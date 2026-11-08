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
    // coeficiente de A y k a partir de otros datos
    const c2 = r('coef-2'); cerca(c2.kA, 0.54, 1e-12, 'k_A = 2k'); cerca(c2.A, p2.A, 1e-12, '2 A con k = 0,27 igual que A con 0,54');
    const kv = r('k-vida-media'); cerca(kv.k, Math.LN2 / 5730, 1e-12, 'k del C-14'); cerca(kv.A, 100 * Math.exp((-Math.LN2 / 5730) * 10000), 1e-12, 'C-14 a los 10 000 años'); cerca(kv.tC, 2 * 5730, 1e-12, 'dos vidas medias hasta el 25 %');
    const kp = r('k-porcentaje'); cerca(kp.k, Math.log(4) / 40, 1e-12, 'k con un 75 % en 40 min'); cerca(kp.t12, 20, 1e-12, 't½ = 20 min');
    const km = r('k-dos-medidas'); cerca(km.k, (1 / 0.04 - 1 / 0.08) / 40, 1e-12, 'k de orden 2 con dos medidas');
    for (const n of [0, 1, 2]) { const x = CinC.orden({ n: String(n), kde: 't12', t12: '30', A0: '0,4', t: '30' }); cerca(x.A, 0.2, 1e-12, `t½ dada en orden ${n}`); }
    // tres reactivos
    const i4 = r('iniciales-abc'); if (i4.oA !== 1 || i4.oB !== 2 || i4.oC !== 0 || i4.ley !== 'v = 2 [A] [B]^{2}') mal(`Cinética: tres reactivos sale «${i4.ley}»`); cerca(i4.k, 2, 1e-9, 'k con tres reactivos');
    // aviso de R² parecidos
    if (r('datos-1').aviso) mal('Cinética: datos-1 avisa sin motivo'); if (!CinC.datos({ ts: '0 1 2 3', As: '1 0,99 0,98 0,97' }).aviso) mal('Cinética: con poco avance no avisa');
    // Arrhenius: ajuste a varias temperaturas con datos exactos
    { const Ts = [290, 300, 315, 330], ks = Ts.map((T) => 1e10 * Math.exp(-80000 / (8.314 * T))), x = CinC.arrhenius({ tipo: 'ajuste', uT: 'K', Ts: Ts.join(' '), ks: ks.join(' ') }); cerca(x.Ea, 80000, 1e-9, 'Ea ajustada'); cerca(x.A, 1e10, 1e-9, 'A ajustado'); cerca(x.r2, 1, 1e-12, 'R² exacto'); }
    { const x = r('arrhenius-cat'); cerca(x.fcat, Math.exp(25000 / (8.314 * 298)), 1e-12, 'factor del catalizador'); cerca(x.Ea / 1000 - x.dH, 115, 1e-12, 'Ea inversa'); }
    // Arrhenius: Ea con dos temperaturas y vuelta atrás
    const a1 = r('arrhenius-ea'); cerca(a1.Ea, (-8.314 * Math.log(9.63e-4 / 3.46e-5)) / (1 / 328 - 1 / 298), 1e-12, 'Ea');
    const a2 = CinC.arrhenius({ tipo: 'k2', uT: 'K', Ea: String(a1.Ea / 1000), k1: '3,46e-5', T1: '298', T2: '328' }); cerca(a2.k2, 9.63e-4, 1e-9, 'k₂ de vuelta');
    const a3 = r('arrhenius-k2'); cerca(a3.k2, 0.01 * Math.exp((-50000 / 8.314) * (1 / 308.15 - 1 / 298.15)), 1e-12, 'k₂ con °C');
    for (const [sc, q] of [[{ modo: 'orden', n: '3', k: '1', A0: '1', t: '1' }, 'orden 3'], [{ modo: 'orden', n: '1', k: '', A0: '1', t: '1' }, 'sin k'], [{ modo: 'orden', n: '1', k: '1', A0: '0,5', t: '1', C: '0,8' }, 'concentración final mayor'], [{ modo: 'datos', ts: '0 1 2', As: '1 0,5' }, 'listas de distinto tamaño'], [{ modo: 'datos', ts: '0 2 1', As: '1 0,5 0,7' }, 'tiempos desordenados'], [{ modo: 'datos', ts: '0 1 2', As: '1 0 0,5' }, 'concentración 0'], [{ modo: 'iniciales', conB: true, exps: [{ A: '0,1', B: '0,1', v: '1' }, { A: '0,2', B: '0,2', v: '4' }, { A: '0,3', B: '0,3', v: '9' }] }, 'A y B que cambian a la vez'], [{ modo: 'arrhenius', tipo: 'ea', uT: 'K', k1: '1', T1: '300', k2: '2', T2: '300' }, 'misma temperatura'], [{ modo: 'arrhenius', tipo: 'k2', uT: 'K', Ea: '50', k1: '1', T1: '300', T2: '310', Eac: '60' }, 'catalizador que sube Eₐ'], [{ modo: 'arrhenius', tipo: 'ajuste', uT: 'K', Ts: '300 310', ks: '1 2' }, 'ajuste con dos puntos'], [{ modo: 'orden', n: '1', kde: 'pct', pct: '100', tp: '10', A0: '1', t: '1' }, 'reacciona el 100 %'], [{ modo: 'orden', n: '1', kde: 'med', t1: '10', A1: '0,5', t2: '5', A2: '0,4', A0: '1', t: '1' }, 'medidas al revés'], [{ modo: 'iniciales', nr: '3', exps: [{ A: '1', B: '1', C: '1', v: '1' }, { A: '2', B: '1', C: '1', v: '2' }, { A: '1', B: '2', C: '1', v: '2' }] }, 'tres reactivos con tres experimentos'], [{ modo: 'arrhenius', tipo: 'ea', uT: 'C', k1: '1', T1: '-300', k2: '2', T2: '30' }, 'bajo el cero absoluto']]) {
      let ok = false; try { CinC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Cinética: ${q} no da error`);
    }
    // CI-2 · consecutivas: k₁ = 0,2, k₂ = 0,1 ⇒ t_máx = ln(k₂/k₁)/(k₂ − k₁) = 6,931 y B_máx = A₀(k₁/k₂)^(k₂/(k₂−k₁)) = 0,5
    { const x = r('consec-abc'), cerca = (p, q, tol, w) => { if (!(Math.abs(p - q) <= tol * Math.max(1, Math.abs(q)))) mal(`Cinética · ${w}: ${p} en vez de ${q}`); };
      cerca(x.tmax, Math.log(0.5) / -0.1, 1e-12, 't máx de B'); cerca(x.Bmax, 0.5, 1e-12, 'B máx'); cerca(x.curva[0].A, 1, 1e-12, 'A(0)');
      for (const p of x.curva) { cerca(p.A + p.B + p.C, 1, 1e-9, 'balance de materia A+B+C'); }
      const m = x.curva.reduce((a, b) => (b.B > a.B ? b : a)); cerca(m.B, 0.5, 2e-3, 'B máximo en la curva');
      const y = r('consec-igual'); cerca(y.tmax, 1 / 0.05, 1e-12, 't máx con k₁ = k₂'); cerca(y.Bmax, 0.8 / Math.E, 1e-12, 'B máx con k₁ = k₂');
      // A ⇌ B, kf = 0,3, kr = 0,1: K = 3, [A]eq = 0,25, [B]eq = 0,75, τ = 2,5
      const z = r('reversible'); cerca(z.K, 3, 1e-12, 'K de A ⇌ B'); cerca(z.Aeq, 0.25, 1e-12, '[A]eq'); cerca(z.Beq, 0.75, 1e-12, '[B]eq'); cerca(z.tau, 2.5, 1e-12, 'τ'); cerca(z.curva[200].A, 0.25, 4e-3, 'A al final'); }
    // CI-1 · mecanismos: orden global 3 (2 NO + O₂), O₃ con orden −1 en O₂, y el estado estacionario con sus casos límite
    { const a1 = r('mec-no-o2'), o1 = a1.leyes[0].ordenes; if (o1.NO !== 2 || o1.O2 !== 1 || Object.keys(o1).length !== 2) mal('Cinética · ley de 2 NO + O2 por etapa lenta: ' + JSON.stringify(o1));
      if (a1.global.re.NO !== 2 || a1.global.re.O2 !== 1 || a1.global.pr.NO2 !== 2 || a1.intermedios.join() !== 'N2O2') mal('Cinética · global o intermedio del NO: ' + JSON.stringify(a1.global) + a1.intermedios);
      const o3 = r('mec-ozono').leyes[0].ordenes; if (o3.O3 !== 2 || o3.O2 !== -1) mal('Cinética · ley del ozono: ' + JSON.stringify(o3));
      const e1 = r('mec-no-o2-ee'); if (e1.leyes.length !== 2 || e1.leyes[0].ordenes.O2 !== 1 || e1.leyes[1].ordenes.O2 !== undefined || e1.leyes[1].ordenes.NO !== 2) mal('Cinética · casos límite del estado estacionario: ' + JSON.stringify(e1.leyes.map((l) => l.ordenes)));
      if (!e1.cuadra[0].ok || e1.cuadra[1].ok) mal('Cinética · la comparación con el experimento (NO=2, O2=1) falla: ' + JSON.stringify(e1.cuadra));
      const mal1 = CinC.resolver({ modo: 'mecanismo', etapas: 'NO + NO <=> N2O2\nN2O2 + O2 -> 2 NO2', metodo: 'lenta', lenta: '1', exp: 'NO=2, O2=1' }); if (mal1.cuadra.some((c) => c.ok)) mal('Cinética · con la etapa 1 lenta no puede salir orden 3');
      for (const [sc, q] of [[{ modo: 'mecanismo', etapas: 'A -> B', lenta: '1' }, 'una sola etapa'], [{ modo: 'mecanismo', etapas: 'A B', lenta: '1' }, 'etapa sin flecha'], [{ modo: 'mecanismo', etapas: 'A -> B\nB -> C', lenta: '5' }, 'etapa lenta que no existe'], [{ modo: 'mecanismo', etapas: 'A -> I\nI + B -> C', lenta: '2', metodo: 'lenta' }, 'intermedio sin equilibrio previo'], [{ modo: 'consecutivas', tipo: 'abc', k1: '0', k2: '1', A0: '1' }, 'k₁ = 0'], [{ modo: 'consecutivas', tipo: 'rev', kf: '1', kr: '', A0: '1' }, 'falta kr']]) {
        let ok = false; try { CinC.resolver(sc); } catch (e) { ok = true; } if (!ok) mal(`Cinética · ${q} no da error`); } }
    if (fallos === antes) console.log(`  ✓ Cinética química: ${CinC.ejemplos.length} ejemplos, leyes integradas y vidas medias a mano, unidades de k, coeficiente de A, k de la vida media, de un % o de dos medidas, orden a partir de datos con aviso, velocidades iniciales con tres reactivos, Arrhenius de ida y vuelta, ajustado y con catalizador, y errores`);
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
        if (r.modo !== e.sc.modo || r.vaso !== !['iniciales', 'consecutivas', 'mecanismo'].includes(e.sc.modo)) mal(`Cinética · ${e.clave}: el modo o el vaso no cuadran`);
      }
      // consecutivas y mecanismos en la página
      { const a0 = fallos;
        await page.evaluate(() => CineticaApp.abrirEjemplo('consec-abc'));
        const c1 = await page.evaluate(() => ({ r: CineticaApp.resultado(), g: !document.querySelector('#grafica').hidden, b: document.querySelectorAll('.exportar button').length }));
        if (Math.abs(c1.r.Bmax - 0.5) > 1e-9 || !c1.g || c1.b < 2) mal('Cinética · A → B → C en la página: ' + JSON.stringify(c1));
        await page.selectOption('#f-tipo', 'rev');
        if (!(await page.locator('#f-kf').count()) || !(await page.evaluate(() => CineticaApp.resultado().Keq > 0))) mal('Cinética · al pasar a A ⇌ B no salen kf, kr ni K');
        await page.evaluate(() => CineticaApp.abrirEjemplo('mec-no-o2'));
        const m1 = await page.evaluate(() => ({ t: document.querySelector('#resumen').textContent, g: document.querySelector('#grafica').hidden, ta: !!document.querySelector('#f-etapas') }));
        if (!/\[NO\]\s*2|NO.*2/.test(m1.t) || !/Compatible/.test(m1.t) || !m1.g || !m1.ta) mal('Cinética · mecanismo en la página: ' + m1.t.slice(0, 200));
        await page.fill('#f-etapas', 'NO + NO -> N2O2');
        if (await page.locator('#error').isHidden()) mal('Cinética · un mecanismo con una sola etapa no muestra el error');
        await page.fill('#f-etapas', 'NO + NO <=> N2O2\nN2O2 + O2 -> 2 NO2'); await page.selectOption('#f-metodo', 'ee');
        if (await page.evaluate(() => CineticaApp.resultado().leyes.length) !== 2) mal('Cinética · el estado estacionario no da los dos casos límite en la página');
        if (fallos === a0) console.log('  ✓ Cinética · consecutivas, reversibles y mecanismos en la página, con la gráfica y los botones de exportar');
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
      await page.selectOption('#f-nr', '2');
      if ((await page.locator('#campos [data-c="B"]').count()) !== 3) mal('Cinética: al pasar a dos reactivos no sale la columna de [B]');
      await page.selectOption('#f-nr', '3');
      if ((await page.locator('#campos [data-c="C"]').count()) !== 4) mal('Cinética: al pasar a tres reactivos no sale la columna de [C] con cuatro experimentos');
      await page.evaluate(() => CineticaApp.abrirEjemplo('primer-orden'));
      await page.selectOption('#f-kde', 't12'); await page.fill('#f-t12', '1359,1');
      if (!(await page.locator('#error').isHidden()) || !(await page.locator('#resumen').textContent()).includes('5,1')) mal('Cinética: k a partir de la vida media no sale en la página');
      await page.evaluate(() => CineticaApp.abrirEjemplo('datos-1'));
      await page.fill('#f-ts', '0 1 2 3'); await page.fill('#f-As', '1 0,99 0,98 0,97');
      if ((await page.locator('#resumen .aviso').count()) !== 1) mal('Cinética: con poco avance no avisa de que dos rectas se ajustan igual');
      await page.evaluate(() => CineticaApp.abrirEjemplo('arrhenius-cat'));
      if (!(await page.locator('#resumen').textContent()).includes('Con catalizador') || (await page.locator('#escena').isHidden())) mal('Cinética: el catalizador o el diagrama de energía no salen');
      await page.selectOption('#f-modo', 'arrhenius');
      await page.selectOption('#f-tipo', 'k2');
      if ((await page.locator('#f-Ea').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Cinética: al pedir k₂ no sale el campo de Eₐ o da error');
      for (let i = 0; i < 10; i++) { await page.evaluate(() => CineticaApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Cinética: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => CineticaApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Cinética: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Cinética química: ${CinC.ejemplos.length} ejemplos con MathML, cambio de orden, errores, las tres rectas, experimentos que se añaden y quitan, tres reactivos, k de la vida media, aviso de R², catalizador y diagrama de energía, Arrhenius y ejercicios al azar sin errores de consola`);
    }
  };
};
