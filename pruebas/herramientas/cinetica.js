/* Comprobación de cinetica: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo cinetica ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const CinC = require(path.join(fuente, 'cinetica', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Cinética · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => CinC.resolver(CinC.ejemplos.find((e) => e.clave === c).sc);
    for (const e of CinC.ejemplos) { try { const x = CinC.resolver(e.sc); if (x.pasos.length < 3) mal(`Cinética · ${e.clave}: desarrollo corto`); } catch (err) { mal(`Cinética · ${e.clave}: ${err.message}`); } }
    // leyes integradas a mano
    const p1 = r('primer-orden'); cerca(p1.A, 0.25 * Math.exp(-5.1e-4 * 3600), 1e-12, '[A] de orden 1'); cerca(p1.t12, Math.LN2 / 5.1e-4, 1e-12, 't½ de orden 1'); cerca(p1.tC, Math.log(5) / 5.1e-4, 1e-12, 'tiempo hasta 0,05 M');
    const p0 = r('orden-cero'); cerca(p0.A, 0.26, 1e-12, '[A] de orden 0'); cerca(p0.t12, 125, 1e-12, 't½ de orden 0'); cerca(p0.tC, 200, 1e-12, 'tiempo de orden 0');
    const p2 = r('segundo-orden'); cerca(p2.A, 1 / (20 + 0.54 * 60), 1e-12, '[A] de orden 2'); cerca(p2.t12, 1 / (0.54 * 0.05), 1e-12, 't½ de orden 2');
    if (p0.unidad !== 'mol·L⁻¹·s⁻¹' || p1.unidad !== 's⁻¹' || p2.unidad !== 'L·mol⁻¹·s⁻¹') mal(`Cinética: unidades de k «${p0.unidad}», «${p1.unidad}», «${p2.unidad}»`);
    // orden 0 que se agota: no sale negativa
    if (CinC.orden({ n: '0', k: '0,01', A0: '0,5', t: '100' }).A !== 0) mal('Cinética: en orden 0 la concentración sale negativa al agotarse');
    // datos: cada ejemplo da su orden
    for (const [c, n, k] of [['datos-0', 0, 0.02], ['datos-1', 1, Math.LN2 / 20], ['datos-2', 2, 0.1]]) { const x = r(c); if (x.n !== n) mal(`Cinética: ${c} sale de orden ${x.n}`); cerca(x.k, k, 0.01, `k de ${c}`); }
    // datos exactos de orden 1: R² = 1
    const ts = [0, 5, 10, 15, 20], ex = CinC.datos({ ts: ts.join(' '), As: ts.map((t) => 0.8 * Math.exp(-0.07 * t)).join(' ') }); if (ex.n !== 1 || Math.abs(ex.fits[1].r2 - 1) > 1e-12) mal('Cinética: datos exactos de orden 1 no dan R² = 1'); cerca(ex.k, 0.07, 1e-9, 'k de datos exactos');
    // velocidades iniciales
    const i2 = r('iniciales-2'); if (i2.oA !== 2 || i2.oB !== 1 || i2.ley !== 'v = 25 [A]^{2} [B]') mal(`Cinética: 2 NO + O₂ sale «${i2.ley}»`); cerca(i2.k, 25, 1e-9, 'k de 2 NO + O₂');
    const i3 = r('iniciales-3'); if (i3.oA !== 1 || i3.oB !== 2) mal('Cinética: el ejemplo de órdenes 1 y 2 no sale'); if (r('iniciales-1').oA !== 1) mal('Cinética: el ejemplo de un reactivo no sale de orden 1');
    if (i2.unidad !== 'L²·mol⁻²·s⁻¹') mal(`Cinética: unidades de k de orden 3 «${i2.unidad}»`);
    // Arrhenius: Ea con dos temperaturas y vuelta atrás
    const a1 = r('arrhenius-ea'); cerca(a1.Ea, (-8.314 * Math.log(9.63e-4 / 3.46e-5)) / (1 / 328 - 1 / 298), 1e-12, 'Ea');
    const a2 = CinC.arrhenius({ tipo: 'k2', uT: 'K', Ea: String(a1.Ea / 1000), k1: '3,46e-5', T1: '298', T2: '328' }); cerca(a2.k2, 9.63e-4, 1e-9, 'k₂ de vuelta');
    const a3 = r('arrhenius-k2'); cerca(a3.k2, 0.01 * Math.exp((-50000 / 8.314) * (1 / 308.15 - 1 / 298.15)), 1e-12, 'k₂ con °C');
    for (const [sc, q] of [[{ modo: 'orden', n: '3', k: '1', A0: '1', t: '1' }, 'orden 3'], [{ modo: 'orden', n: '1', k: '', A0: '1', t: '1' }, 'sin k'], [{ modo: 'orden', n: '1', k: '1', A0: '0,5', t: '1', C: '0,8' }, 'concentración final mayor'], [{ modo: 'datos', ts: '0 1 2', As: '1 0,5' }, 'listas de distinto tamaño'], [{ modo: 'datos', ts: '0 2 1', As: '1 0,5 0,7' }, 'tiempos desordenados'], [{ modo: 'datos', ts: '0 1 2', As: '1 0 0,5' }, 'concentración 0'], [{ modo: 'iniciales', conB: true, exps: [{ A: '0,1', B: '0,1', v: '1' }, { A: '0,2', B: '0,2', v: '4' }, { A: '0,3', B: '0,3', v: '9' }] }, 'A y B que cambian a la vez'], [{ modo: 'arrhenius', tipo: 'ea', uT: 'K', k1: '1', T1: '300', k2: '2', T2: '300' }, 'misma temperatura'], [{ modo: 'arrhenius', tipo: 'ea', uT: 'C', k1: '1', T1: '-300', k2: '2', T2: '30' }, 'bajo el cero absoluto']]) {
      let ok = false; try { CinC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Cinética: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Cinética química: ${CinC.ejemplos.length} ejemplos, leyes integradas y vidas medias a mano, unidades de k, orden a partir de datos, velocidades iniciales, Arrhenius de ida y vuelta y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'quimica', 'cinetica', 'index.html'));
      await page.waitForFunction(() => window.CineticaApp);
      const antes = fallos;
      const verC = (await page.locator('#ver').textContent()).trim();
      if (verC !== Version.de('cinetica').current) mal(`Cinética: la página muestra la versión «${verC}», se esperaba ${Version.de('cinetica').current}`);
      for (const e of CinC.ejemplos) {
        await page.evaluate((c) => CineticaApp.abrirEjemplo(c), e.clave);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, modo: document.querySelector('#f-modo').value, vaso: !document.querySelector('#escena').hidden }));
        if (r.err || r.pasos < 3 || r.res < 1) mal(`Cinética · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`Cinética · ${e.clave}: el desarrollo no sale en MathML`);
        if (r.modo !== e.sc.modo || r.vaso !== (e.sc.modo === 'orden' || e.sc.modo === 'datos')) mal(`Cinética · ${e.clave}: el modo o el vaso no cuadran`);
      }
      await page.evaluate(() => CineticaApp.abrirEjemplo('primer-orden'));
      if (!(await page.locator('#resumen').textContent()).includes('1359')) mal('Cinética: la vida media del N₂O₅ (1359 s) no sale en la página');
      await page.selectOption('#f-n', '2');
      if (!(await page.locator('#resumen').textContent()).includes('7843')) mal('Cinética: al pasar a orden 2 la vida media no cambia a 1/(k[A]₀)');
      await page.fill('#f-k', 'abc');
      if (await page.locator('#error').isHidden()) mal('Cinética: una k que no es un número no da error');
      await page.evaluate(() => CineticaApp.abrirEjemplo('datos-2'));
      await page.click('#vistas [data-v="0"]');
      if ((await page.locator('#vistas [aria-pressed="true"]').getAttribute('data-v')) !== '0') mal('Cinética: los botones de las tres rectas no cambian de gráfica');
      await page.evaluate(() => CineticaApp.abrirEjemplo('iniciales-1'));
      await page.click('#mas');
      if ((await page.locator('#campos [data-c="A"]').count()) !== 4 || !(await page.locator('#error').isHidden())) mal('Cinética: añadir un experimento vacío no aparece o no se deja sin contar');
      await page.fill('#campos [data-i="3"][data-c="A"]', '0,8');
      if (await page.locator('#error').isHidden()) mal('Cinética: un experimento sin velocidad no da error');
      await page.fill('#campos [data-i="3"][data-c="A"]', '0,8'); await page.fill('#campos [data-i="3"][data-c="v"]', '0,032');
      if (!(await page.locator('#error').isHidden())) mal('Cinética: con el cuarto experimento bien escrito da error');
      await page.click('#campos [data-quita="3"]');
      if ((await page.locator('#campos [data-c="A"]').count()) !== 3) mal('Cinética: quitar un experimento no lo quita');
      await page.selectOption('#f-conB', '1');
      if ((await page.locator('#campos [data-c="B"]').count()) !== 3) mal('Cinética: al pasar a dos reactivos no sale la columna de [B]');
      await page.selectOption('#f-modo', 'arrhenius');
      await page.selectOption('#f-tipo', 'k2');
      if ((await page.locator('#f-Ea').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Cinética: al pedir k₂ no sale el campo de Eₐ o da error');
      for (let i = 0; i < 10; i++) { await page.evaluate(() => CineticaApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Cinética: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => CineticaApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Cinética: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Cinética química: ${CinC.ejemplos.length} ejemplos con MathML, cambio de orden, errores, las tres rectas, experimentos que se añaden y quitan, Arrhenius y ejercicios al azar sin errores de consola`);
    }
  };
};
