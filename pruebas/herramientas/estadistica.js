/* Comprobación de estadistica: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo estadistica ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Estadistica = require(path.join(fuente, 'estadistica', 'calculo.js'));
  {
    // valores de las tablas y fórmulas cerradas
    const antes = fallos, Es = Estadistica, cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
    const tabla = [[Es.Phi(0), 0.5], [Es.Phi(1), 0.841344746], [Es.Phi(1.96), 0.975002105], [Es.Phi(-2.33), 0.009903076], [Es.Phi(3), 0.998650102]];
    for (const [v, e] of tabla) if (!cerca(v, e, 1e-8)) mal(`Estadística: Φ = ${v}, se esperaba ${e}`);
    const R = Object.fromEntries(Es.ejemplos.map((e) => [e.clave, Es.calcular(e.sc)]));
    const esp = {
      'normal-menor': R['normal-menor'].p - 0.655421742, 'normal-entre': R['normal-entre'].p - 0.682689492, 'normal-cuantil': R['normal-cuantil'].x - (6 + 1.5 * 1.281551566),
      'z-critico': R['z-critico'].c - 1.959963985, 't-critico': R['t-critico'].c - 2.228138852, chi2: R.chi2.p - (2 * (1 - Es.Phi(Math.sqrt(11.07))) + Math.sqrt((2 * 11.07) / Math.PI) * Math.exp(-11.07 / 2) * (1 + 11.07 / 3)), exponencial: R.exponencial.p - Math.exp(-1.5),
      'binomial-igual': R['binomial-igual'].p - 120 / 1024, 'binomial-menor': R['binomial-menor'].p - (0.95 ** 20 + 20 * 0.05 * 0.95 ** 19 + 190 * 0.05 ** 2 * 0.95 ** 18), poisson: R.poisson.p - (1 - 4 * Math.exp(-3)),
    };
    for (const [k, d] of Object.entries(esp)) if (Math.abs(d) > 2e-6) mal(`Estadística · ${k}: diferencia ${d}`);
    // binomial y Poisson acumuladas frente a la suma directa
    for (const [d, P] of [['binomial', { n: 30, p: 0.37 }], ['poisson', { lambda: 7.5 }]]) {
      let s = 0;
      for (let k = 0; k <= 20; k++) { s += Es.DIST[d].pmf(P, k); if (!cerca(Es.DIST[d].cdf(P, k), s, 1e-10)) mal(`Estadística · ${d}: F(${k}) no coincide con la suma`); }
    }
    // cuantil y probabilidad son inversos; P(X < k) = P(X ≤ k − 1)
    for (const p of [0.01, 0.3, 0.95]) for (const [d, P] of [['normal', { mu: 2, sigma: 3 }], ['t', { nu: 4 }], ['chi2', { k: 7 }]]) if (!cerca(Es.DIST[d].cdf(P, Es.cuantil(Es.DIST[d], P, p)), p, 1e-9)) mal(`Estadística · ${d}: cuantil(${p}) no es inverso`);
    if (!cerca(Es.calcular({ dist: 'poisson', lambda: '3', tipo: 'menorE', a: '4' }).p, Es.calcular({ dist: 'poisson', lambda: '3', tipo: 'menor', a: '3' }).p, 1e-12)) mal('Estadística: P(X < 4) ≠ P(X ≤ 3)');
    const malas = [{ dist: 'normal', mu: '0', sigma: '0', tipo: 'menor', a: '1' }, { dist: 'binomial', n: '10', p: '1.2', tipo: 'igual', a: '1' }, { dist: 'binomial', n: '10.5', p: '0.5', tipo: 'igual', a: '1' }, { dist: 'poisson', lambda: '2', tipo: 'igual', a: '1.5' }, { dist: 'normal', mu: '0', sigma: '1', tipo: 'cuantil', p: '1' }, { dist: 'normal', mu: '0', sigma: '1', tipo: 'entre', a: '2', b: '1' }];
    for (const m of malas) { let ok = false; try { Es.calcular(m); } catch (e) { ok = true; } if (!ok) mal(`Estadística: ${JSON.stringify(m)} debería dar un error`); }
    if (fallos === antes) console.log(`  ✓ Estadística: tabla de Φ, ${Es.ejemplos.length} ejemplos con el valor esperado, binomial y Poisson acumuladas, cuantiles inversos y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'estadistica', 'distribuciones', 'index.html'));
      await page.waitForFunction(() => window.EstadisticaApp);
      const antes = fallos;
      const verE = (await page.locator('#ver').textContent()).trim();
      if (verE !== Version.de('estadistica').current) mal(`Estadística: la página muestra la versión «${verE}», se esperaba ${Version.de('estadistica').current}`);
      for (const e of Estadistica.ejemplos) {
        await page.evaluate((c) => EstadisticaApp.abrirEjemplo(c), e.clave);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 2) mal(`Estadística · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => EstadisticaApp.abrirEjemplo('normal-menor'));
      if (!(await page.locator('#res').textContent()).includes('0,6554')) mal('Estadística: N(50, 5) no da 0,6554 en la página');
      await page.selectOption('#f-dist', 'binomial');
      if ((await page.locator('#f-n').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Estadística: al cambiar a binomial no aparecen n y p');
      await page.fill('#f-p', '2');
      if (await page.locator('#error').isHidden()) mal('Estadística: p = 2 no muestra el error');
      await page.close();
      if (consola.length) mal('Estadística: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Estadística: ${Estadistica.ejemplos.length} ejemplos, cambio de distribución y errores sin errores de consola`);
    }
  };
};
