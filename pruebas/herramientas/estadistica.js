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
    const malas = [{ dist: 'normal', mu: '0', sigma: '0', tipo: 'menor', a: '1' }, { dist: 'binomial', n: '10', p: '1.2', tipo: 'igual', a: '1' }, { dist: 'binomial', n: '10.5', p: '0.5', tipo: 'igual', a: '1' }, { dist: 'poisson', lambda: '2', tipo: 'igual', a: '1.5' }, { dist: 'normal', mu: '0', sigma: '1', tipo: 'cuantil', q: '1' }, { dist: 'normal', mu: '0', sigma: '1', tipo: 'entre', a: '2', b: '1' }];
    // el cuantil de la binomial no pisa la p de éxito (antes las dos iban en «p»)
    const bq = Es.calcular({ dist: 'binomial', n: '10', p: '0.5', tipo: 'cuantil', q: '0.9' });
    if (bq.P.p !== 0.5 || bq.x !== 7) mal(`Estadística: el cuantil 0,9 de B(10; 0,5) da k = ${bq.x} con p = ${bq.P.p}, se esperaba k = 7 con p = 0,5`);
    // lo nuevo de la 0.2: F, uniforme, geométrica, hipergeométrica, críticos, μ o σ, colas lejanas y aproximaciones
    const esp2 = { 'chi2-critico': [R['chi2-critico'].c1, 3.246973], 'chi2-critico c₂': [R['chi2-critico'].c, 20.483177], 'f-critico': [R['f-critico'].c, 3.325835], 'z-unilateral': [R['z-unilateral'].c, 1.644854],
      'normal-inverso': [R['normal-inverso'].valor, 10 / 1.644854], 'normal-centro': [R['normal-centro'].p, 0.682689], uniforme: [R.uniforme.p, 0.3], geometrica: [R.geometrica.p, 0.8 ** 3 * 0.2], hipergeometrica: [R.hipergeometrica.p, (10 * 105) / 4845] };
    for (const [k, [v, e]] of Object.entries(esp2)) if (!cerca(v, e, 2e-6)) mal(`Estadística · ${k}: ${v}, se esperaba ${e}`);
    const fbi = Es.calcular({ dist: 'f', d1: '5', d2: '10', tipo: 'critico', alfa: '0.05' });
    if (!cerca(fbi.c1, 1 / Es.cuantil(Es.DIST.f, { d1: 10, d2: 5 }, 0.975), 1e-9) || !cerca(fbi.c, 4.236085, 2e-6)) mal(`Estadística: F(5, 10) bilateral da ${fbi.c1} y ${fbi.c}`);
    const cola = Es.calcular({ dist: 'normal', mu: '0', sigma: '1', tipo: 'mayor', a: '8' });
    if (Math.abs(cola.p / 6.220961e-16 - 1) > 1e-5 || !cola.res.includes('10<sup>−16</sup>')) mal(`Estadística: P(Z ≥ 8) da ${cola.p} («${cola.res}»)`);
    if (!cerca(Es.calcular({ dist: 'binomial', n: '30', p: '0.5', tipo: 'mayor', a: '28' }).p, (435 + 30 + 1) / 2 ** 30, 1e-15)) mal('Estadística: la cola P(X ≥ 28) de B(30; 0,5) no es exacta');
    for (const [d, P] of [['f', { d1: 4, d2: 9 }], ['uniforme', { lo: 2, hi: 5 }]]) for (const p of [0.1, 0.7]) if (!cerca(Es.DIST[d].cdf(P, Es.cuantil(Es.DIST[d], P, p)), p, 1e-9)) mal(`Estadística · ${d}: cuantil(${p}) no es inverso`);
    for (const [d, P] of [['geometrica', { p: 0.3 }], ['hipergeometrica', { N: 20, K: 7, n: 6 }]]) { let s = 0; for (let k = 0; k <= 12; k++) { s += Es.DIST[d].pmf(P, k); if (!cerca(Es.DIST[d].cdf(P, k), s, 1e-12)) mal(`Estadística · ${d}: F(${k}) no coincide con la suma`); } }
    if (!R['binomial-poisson'].pasos.some((q) => q.t.includes('Poisson')) || !R['poisson-normal'].pasos.some((q) => q.t.includes('normal'))) mal('Estadística: faltan las aproximaciones de Poisson o de la normal');
    if (!R['binomial-igual'].pasos.some((q) => q.t === 'Tabla de valores')) mal('Estadística: la binomial no trae la tabla de valores');
    for (let i = 0; i < 200; i++) { const e = Es.ejercicio(); try { Es.calcular(e.sc); } catch (err) { mal(`Estadística: el ejercicio al azar «${e.enunciado}» da un error: ${err.message}`); break; } }
    for (const m of [{ dist: 'normal', mu: '70', sigma: '5', tipo: 'inverso', incog: 'sigma', cola: 'mayor', a: '60', q: '0.05' }, { dist: 'uniforme', lo: '5', hi: '2', tipo: 'menor', a: '3' }, { dist: 'hipergeometrica', N: '5', K: '7', n: '2', tipo: 'igual', a: '1' }, { dist: 't', nu: '1', tipo: 'centro', cc: '1' }]) malas.push(m);
    for (const m of malas) { let ok = false; try { Es.calcular(m); } catch (e) { ok = true; } if (!ok) mal(`Estadística: ${JSON.stringify(m)} debería dar un error`); }
    // gamma, beta, lognormal, Weibull y binomial negativa frente a scipy.stats
    {
      const REF = JSON.parse(fs.readFileSync(path.join(fuente, '..', 'pruebas', 'referencias', 'estadistica.json'), 'utf8')).distribuciones, rel = (a, b, t = 1e-8) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
      for (const [k, d] of Object.entries(REF)) {
        const nom = k.split('_')[0];
        if (k === 'momentos' || k === 'nbinomial') continue;
        const D = Es.DIST[nom], P = d.par;
        d.x.forEach((x, i) => {
          if (!rel(D.pdf(P, x), d.pdf[i])) mal(`Estadística · ${k}: f(${x}) = ${D.pdf(P, x)}, scipy ${d.pdf[i]}`);
          if (!rel(D.cdf(P, x), d.cdf[i])) mal(`Estadística · ${k}: F(${x}) = ${D.cdf(P, x)}, scipy ${d.cdf[i]}`);
          if (!rel(D.sf(P, x), d.sf[i])) mal(`Estadística · ${k}: S(${x}) = ${D.sf(P, x)}, scipy ${d.sf[i]}`);
        });
        d.p.forEach((q, i) => { const v = Es.cuantil(D, P, q); if (!rel(v, d.ppf[i], 1e-7)) mal(`Estadística · ${k}: cuantil ${q} = ${v}, scipy ${d.ppf[i]}`); });
      }
      for (const [nom, [m, v]] of Object.entries(REF.momentos)) { const P = nom === 'nbinomial' ? REF.nbinomial.par : Object.values(REF).find((x, j) => Object.keys(REF)[j] === nom)?.par, mo = Es.DIST[nom].momentos(P); if (!rel(mo.media, m, 1e-9) || !rel(mo.varianza, v, 1e-9)) mal(`Estadística · ${nom}: momentos ${mo.media}, ${mo.varianza} frente a ${m}, ${v}`); }
      const NB = REF.nbinomial, Dn = Es.DIST.nbinomial;
      NB.k.forEach((k, i) => { if (!rel(Dn.pmf(NB.par, k), NB.pmf[i], 1e-10) || !rel(Dn.cdf(NB.par, k), NB.cdf[i], 1e-10) || !rel(Dn.cola(NB.par, k), NB.sf_ge[i], 1e-10)) mal(`Estadística · binomial negativa en k = ${k}`); });
      for (const e of Es.ejemplos.filter((x) => ['gamma', 'beta', 'lognormal', 'weibull', 'nbinomial'].includes(x.clave))) { const r = Es.calcular(e.sc); if (!(r.p >= 0 && r.p <= 1) && r.x === undefined) mal(`Estadística · ejemplo ${e.clave} sin resultado`); }
    }
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
      // arrastrar a sobre la gráfica, la μ o σ de una normal y la tabla de valores
      await page.evaluate(() => EstadisticaApp.abrirEjemplo('normal-menor'));
      const bx = await page.locator('#grafica').boundingBox();
      await page.mouse.move(bx.x + bx.width * 0.8, bx.y + bx.height / 2); await page.mouse.down(); await page.mouse.move(bx.x + bx.width * 0.85, bx.y + bx.height / 2); await page.mouse.up();
      const tras = await page.evaluate(() => EstadisticaApp.estado().a);
      if (!(+tras > 55) || (await page.locator('#f-a').inputValue()) !== tras) mal(`Estadística: al arrastrar sobre la gráfica a vale «${tras}»`);
      await page.evaluate(() => EstadisticaApp.abrirEjemplo('normal-inverso'));
      if ((await page.locator('#f-sigma').count()) || !(await page.locator('#res').textContent()).includes('6,08')) mal('Estadística: hallar σ no oculta σ o no da 6,08');
      await page.evaluate(() => EstadisticaApp.abrirEjemplo('binomial-igual'));
      if ((await page.locator('#pasos table.tabla tr').count()) < 5 || !(await page.locator('[data-copiar]').count())) mal('Estadística: falta la tabla de valores con el botón de copiar');
      await page.selectOption('#f-dist', 'binomial');
      await page.fill('#f-p', '2');
      if (await page.locator('#error').isHidden()) mal('Estadística: p = 2 no muestra el error');
      await page.close();
      if (consola.length) mal('Estadística: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Estadística: ${Estadistica.ejemplos.length} ejemplos, cambio de distribución y errores sin errores de consola`);
    }
  };
};
