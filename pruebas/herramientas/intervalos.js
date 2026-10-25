/* Comprobación de intervalos: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo intervalos ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const IcC = require(path.join(fuente, 'intervalos', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Intervalos · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => IcC.resolver(IcC.ejemplos.find((e) => e.clave === c).sc);
    for (const x of IcC.ejemplos) { try { const s = IcC.resolver(x.sc); if (s.pasos.length < 2) mal(`Intervalos · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Intervalos · ${x.clave}: ${err.message}`); } }
    cerca(IcC.zc(0.025), 1.959964, 1e-6, 'z₀,₀₂₅'); cerca(IcC.zc(0.005), 2.575829, 1e-6, 'z₀,₀₀₅'); cerca(IcC.tc(15, 0.005), 2.946713, 1e-6, 't₁₅; ₀,₀₀₅'); cerca(IcC.xc(19, 0.025), 32.85233, 1e-6, 'χ²₁₉; ₀,₀₂₅'); cerca(IcC.xc(19, 0.975), 8.906516, 1e-6, 'χ²₁₉; ₀,₉₇₅');
    const al = r('altura'); cerca(al.a, 172 - 1.959964 * 8 / 6, 1e-6, 'IC de la estatura'); cerca(al.err, 1.959964 * 8 / 6, 1e-6, 'error máximo');
    const bo = r('bombillas'); cerca(bo.b - bo.a, 2 * 2.946713 * 90 / 4, 1e-6, 'anchura con la t');
    const li = r('lista'); cerca(li.M.m, 10.01, 1e-12, 'media de la lista'); if (li.gl !== 9) mal('Intervalos: con 10 datos no salen 9 grados de libertad');
    const mu = r('muestral'); cerca(mu.M.sc, 3.2 * Math.sqrt(12 / 11), 1e-12, 'cuasidesviación desde la desviación con n');
    const en = r('encuesta'); cerca(en.err, 1.959964 * Math.sqrt(0.42 * 0.58 / 500), 1e-6, 'error de la proporción');
    const va = r('varianza'); cerca(va.a, 19 * 6.25 / 32.85233, 1e-6, 'extremo inferior de σ²'); cerca(va.b, 19 * 6.25 / 8.906516, 1e-6, 'extremo superior de σ²');
    const ig = r('dif-iguales'); cerca(ig.sp ** 2, (9 * 1.8 ** 2 + 11 * 2.1 ** 2) / 20, 1e-12, 'cuasivarianza ponderada'); if (ig.gl !== 20) mal('Intervalos: varianzas iguales sin n₁ + n₂ − 2 grados de libertad');
    if (r('dif-welch').gl !== 27) mal('Intervalos: los grados de libertad de Welch no salen 27');
    if (r('n-media').n !== 97 || r('n-prop').n !== 1068) mal('Intervalos: el tamaño de muestra no sale 97 y 1068');
    // la simulación acierta más o menos el nivel de confianza
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (const k of ['altura', 'encuesta', 'varianza']) { const s = r(k), g = IcC.simula(s, rnd); let d = 0; for (let i = 0; i < 2000; i++) { const [a, b] = g.una(); if (a <= g.real && g.real <= b) d++; } if (Math.abs(d / 2000 - s.c) > 0.025) mal(`Intervalos · ${k}: la simulación acierta un ${d / 20} % en vez del ${100 * s.c} %`); }
    // con 0 éxitos el intervalo es el de Wilson, (0; z²/(n + z²)), no un punto
    { const w = IcC.resolver({ modo: 'proporcion', tipoP: 'exitos', n: '20', x: '0', nivel: '95' }), z2 = IcC.zc(0.025) ** 2; cerca(w.b, z2 / (20 + z2), 1e-9, 'Wilson con 0 éxitos'); if (w.a !== 0) mal('Intervalos: con 0 éxitos el extremo inferior no es 0'); }
    for (const [q, sc] of [['n = 1', { modo: 'media', sigmaC: 'no', xm: '5', s: '1', n: '1', nivel: '95' }], ['nivel 100 %', { modo: 'media', sigmaC: 'si', sigma: '1', xm: '5', n: '10', nivel: '100' }], ['más éxitos que n', { modo: 'proporcion', n: '10', x: '12', nivel: '95' }], ['un dato que no es un número', { modo: 'media', fuente: 'datos', sigmaC: 'no', datos: '1 2 x 4', nivel: '95' }], ['error de proporción ≥ 1', { modo: 'tamano', de: 'proporcion', E: '2', nivel: '95' }]]) {
      let ok = false; try { IcC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Intervalos: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Intervalos de confianza: ${IcC.ejemplos.length} ejemplos, z, t y χ², media, proporción, varianza, diferencias, Welch, tamaño de muestra, simulación y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'estadistica', 'intervalos', 'index.html'));
      await page.waitForFunction(() => window.IntervalosApp);
      const antes = fallos;
      const verI = (await page.locator('#ver').textContent()).trim();
      if (verI !== Version.de('intervalos').current) mal(`Intervalos: la página muestra la versión «${verI}», se esperaba ${Version.de('intervalos').current}`);
      for (const e of IcC.ejemplos) {
        await page.evaluate((c) => IntervalosApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(60);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
        if (r.err || r.pasos < 2 || r.res < 1) mal(`Intervalos · ${e.clave}: falta el resultado o el desarrollo`);
        if (r.modo !== e.sc.modo) mal(`Intervalos · ${e.clave}: el modo no cuadra`);
      }
      await page.evaluate(() => IntervalosApp.abrirEjemplo('altura'));
      if (!(await page.locator('#res').textContent()).includes('169,39; 174,61')) mal('Intervalos: el intervalo (169,39; 174,61) no sale en la página');
      await page.fill('#f-nivel', '99');
      if (!(await page.locator('#res').textContent()).includes('2,576')) mal('Intervalos: al 99 % no sale z = 2,576');
      await page.selectOption('#f-sigmaC', 'no');
      if ((await page.locator('#f-s').count()) !== 1) mal('Intervalos: con σ desconocida no sale la desviación de la muestra');
      await page.fill('#f-s', '8');
      if (!(await page.locator('#res').textContent()).includes('t35')) mal('Intervalos: con σ desconocida no se usa la t con 35 grados de libertad');
      await page.selectOption('#f-fuente', 'datos');
      if ((await page.locator('#f-datos').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Intervalos: al elegir la lista de datos no sale o da error');
      await page.fill('#f-datos', '1 2 abc');
      if (await page.locator('#error').isHidden()) mal('Intervalos: un dato que no es un número no da error');
      await page.selectOption('#f-modo', 'tamano');
      if (!(await page.locator('#simcard').isHidden())) mal('Intervalos: en el tamaño de muestra sigue saliendo la simulación');
      await page.selectOption('#f-modo', 'proporcion');
      await page.waitForTimeout(4500);
      const sim = await page.evaluate(() => ({ s: IntervalosApp.simulacion(), t: document.querySelector('#cuenta').textContent }));
      if (!sim.s || !sim.t.includes('de 100') || sim.s.dentro < 80) mal(`Intervalos: la simulación no saca 100 intervalos o acierta muy pocos: ${JSON.stringify(sim)}`);
      await page.click('#otra');
      if ((await page.locator('#play').textContent()).trim() !== '⏸ Pausa') mal('Intervalos: tras otras 100 muestras la animación no sigue');
      for (let i = 0; i < 12; i++) { await page.evaluate(() => IntervalosApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Intervalos: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => IntervalosApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Intervalos: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Intervalos de confianza: ${IcC.ejemplos.length} ejemplos, nivel, σ desconocida, lista de datos, errores, tamaño de muestra, simulación y ejercicios al azar sin errores de consola`);
    }
  };
};
