/* Comprobación de sistemas: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo sistemas ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Sistemas = require(path.join(fuente, 'sistemas', 'calculo.js'));
  {
    // soluciones resueltas a mano; cada solución se sustituye en el sistema (también con los parámetros a 1 y a 2)
    const antes = fallos, Al = Algebra;
    const R = Object.fromEntries(Sistemas.ejemplos.map((e) => [e.clave, Sistemas.resolver(e.sc)]));
    const tipos = { scd: 'SCD', cramer: 'SCD', sci: 'SCI', sci2: 'SCI', si: 'SI', homogeneo: 'SCI', inversa: 'SCD', fracciones: 'SCD', complejo: 'SCD', mallas: 'SCD' };
    for (const [k, t] of Object.entries(tipos)) if (R[k].tipo !== t) mal(`Sistemas · ${k}: ${R[k].tipo}, se esperaba ${t}`);
    const unicas = { scd: ['2', '3', '−1'], cramer: ['5', '3', '−2'], inversa: ['1', '3'], fracciones: ['20/7', '−9/7'], complejo: ['2 + i', '1 − i'], mallas: ['25/14 − 15/14·i', '15/14 + 15/14·i'] };
    for (const [k, v] of Object.entries(unicas)) { const x = R[k].sol.map((s) => Al.txt(s.c)); if (x.join() !== v.join()) mal(`Sistemas · ${k}: (${x}), se esperaba (${v})`); }
    for (const e of Sistemas.ejemplos) {
      const r = R[e.clave];
      if (r.tipo === 'SI' || r.letra || !r.sol) continue;
      const M = Al.leerMatriz(e.sc.M), n = M[0].length - 1;
      for (const p of [0, 1, 2]) {
        const x = r.sol.map((s) => s.t.reduce((acc, [a]) => Al.suma(acc, Al.mul(a, Al.ent(p))), s.c));
        if (!M.every((f) => Al.igual(f.slice(0, n).reduce((s, a, j) => Al.suma(s, Al.mul(a, x[j])), Al.c0), f[n]))) mal(`Sistemas · ${e.clave}: la solución con parámetros = ${p} no cumple el sistema`);
      }
      for (const m of ['gauss', 'jordan', 'cramer', 'inversa']) { const o = Sistemas.resolver({ ...e.sc, metodo: m }); if (o.tipo !== r.tipo || o.res !== r.res) mal(`Sistemas · ${e.clave}: el método ${m} da otro resultado`); }
    }
    if (R.sci.param.length !== 1 || R.sci2.param.length !== 2) mal('Sistemas: número de parámetros incorrecto');
    const malas = [{ M: [['1', 'x y', '2']] }, { M: [['1', '2', '3']], vars: 'a, b, c' }, { M: [['1', '2', '3']], vars: 'a, a' }];
    for (const m of malas) { let ok = false; try { Sistemas.resolver(m); } catch (e) { ok = true; } if (!ok) mal(`Sistemas: ${JSON.stringify(m)} debería dar un error`); }
    if (fallos === antes) console.log(`  ✓ Sistemas: ${Sistemas.ejemplos.length} sistemas bien clasificados, soluciones esperadas que cumplen las ecuaciones, los cuatro métodos coinciden y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'matematicas', 'sistemas', 'index.html'));
      await page.waitForFunction(() => window.SistemasApp);
      const antes = fallos;
      const verS = (await page.locator('#ver').textContent()).trim();
      if (verS !== Version.de('sistemas').current) mal(`Sistemas: la página muestra la versión «${verS}», se esperaba ${Version.de('sistemas').current}`);
      for (const e of Sistemas.ejemplos) {
        await page.evaluate((c) => SistemasApp.abrirEjemplo(c), e.clave);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 3) mal(`Sistemas · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => SistemasApp.abrirEjemplo('scd'));
      if (!(await page.locator('#res').textContent()).includes('z = −1')) mal('Sistemas: el ejemplo 3×3 no da z = −1 en la página');
      await page.selectOption('#ed select[data-d="n"]', '4');
      if ((await page.locator('#ed input').count()) !== 15) mal('Sistemas: al pasar a 4 incógnitas no hay 3×5 casillas');
      await page.fill('#ed input[data-i="0"][data-j="0"]', '2-i');
      if (!(await page.locator('#error').isHidden())) mal('Sistemas: un coeficiente complejo da error: ' + (await page.locator('#error').textContent()));
      await page.fill('#vars', 'a, b');
      if (await page.locator('#error').isHidden()) mal('Sistemas: dos nombres para cuatro incógnitas no muestran el error');
      await page.close();
      if (consola.length) mal('Sistemas: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Sistemas: ${Sistemas.ejemplos.length} sistemas, cambio de tamaño, complejos y errores sin errores de consola`);
    }
  };
};
