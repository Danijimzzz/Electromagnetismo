/* Comprobación de fuerza: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fuerza ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const FzC = require(path.join(fuente, 'fuerza', 'fisica.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Fuerza magnética · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => FzC.resolver(FzC.ejemplos.find((e) => e.clave === c).sc), e = 1.602176634e-19, mp = 1.67262192e-27, me = 9.1093837e-31;
    for (const x of FzC.ejemplos) { try { const s = FzC.resolver(x.sc); if (s.pasos.length < 2) mal(`Fuerza magnética · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Fuerza magnética · ${x.clave}: ${err.message}`); } }
    const p = r('proton'); cerca(p.F, e * 2e6 * 0.5, 1e-12, 'F del protón'); cerca(p.r, (mp * 2e6) / (e * 0.5), 1e-12, 'radio del protón'); cerca(p.T, (2 * Math.PI * mp) / (e * 0.5), 1e-12, 'periodo');
    if (p.giro !== 'antihorario' || r('electron').giro !== 'antihorario' || FzC.carga({ ...p0(), sentidoB: 'saliente' }).giro !== 'horario') mal('Fuerza magnética: el sentido de giro no cuadra con F = q v × B');
    function p0() { return { ...FzC.ejemplos[0].sc }; }
    cerca(r('electron').v, Math.sqrt((2 * e * 1000) / me), 1e-12, 'v del electrón acelerado');
    const he = r('helice'); cerca(he.paso, 5e5 * 0.5 * he.T, 1e-9, 'paso de la hélice'); cerca(he.r, (mp * 5e5 * Math.sin(Math.PI / 3)) / (e * 0.2), 1e-9, 'radio de la hélice');
    if (FzC.carga({ ...p0(), th: '0' }).F !== 0) mal('Fuerza magnética: con v paralela a B debería salir F = 0');
    const vp = r('vec-proton'); cerca(vp.Fm[0], e * 1.5e5, 1e-9, 'Fx'); cerca(vp.Fm[1], -e * 1e5, 1e-9, 'Fy'); if (vp.Fm[2] !== 0) mal('Fuerza magnética: Fz del protón no es 0');
    const ve = r('vec-electron'); cerca(ve.Fm[1], e * 3e5, 1e-9, 'Fy del electrón'); if (Math.abs(ve.Fm.reduce((s, x, i) => s + x * ve.v[i], 0)) > 1e-30) mal('Fuerza magnética: F no es perpendicular a v');
    const vl = r('vec-lorentz'); cerca(vl.F[2], 2e-6 * (50 - 40), 1e-9, 'Lorentz con E');
    const se = r('selector'); cerca(se.vs, 5e5, 1e-12, 'v del selector'); cerca(se.r2, (mp * 5e5) / (e * 0.5), 1e-9, 'radio en el espectrómetro');
    if (r('selector-rapido').hacia !== 'abajo' || FzC.selector({ ...r0('selector-rapido'), part: 'proton' }).hacia !== 'arriba') mal('Fuerza magnética: el sentido de desviación en el selector no cuadra');
    function r0(c) { return { ...FzC.ejemplos.find((x) => x.clave === c).sc }; }
    const ci = r('ciclotron'); cerca(ci.fr, (e * 1.5) / (2 * Math.PI * mp), 1e-12, 'frecuencia del ciclotrón'); cerca(ci.Ec, (e * 1.5 * 0.5) ** 2 / (2 * mp), 1e-12, 'energía del ciclotrón'); cerca(ci.n, ci.Ec / (2 * e * 5e4), 1e-12, 'vueltas');
    const hi = r('hilo'); cerca(hi.F, 1, 1e-12, 'F sobre el hilo'); if (hi.arriba !== true || r('hilo-flota').arriba !== true || FzC.hilo({ ...r0('hilo'), sentidoI: 'izquierda' }).arriba !== false) mal('Fuerza magnética: el sentido de la fuerza sobre el hilo no cuadra');
    cerca(r('hilo-flota').Iflota, (0.01 * 9.8) / (0.2 * 0.5), 1e-12, 'corriente para que flote');
    const pa = r('paralelos'); cerca(pa.FL, 1e-4, 1e-9, 'F/L entre hilos'); if (!pa.mismo || r('antiparalelos').mismo) mal('Fuerza magnética: atracción y repulsión al revés');
    const u = 1.66053907e-27, iso = r('isotopos'); cerca(iso.sepa, (2 * 4e5 * Math.abs(13 * u - 1.993e-26)) / (1.602e-19 * 0.5), 1e-9, 'separación de isótopos');
    const fc = r('franja-cruza'), rc = (mp * 1e6) / (e * 0.2); cerca(fc.alfa, (Math.asin(0.03 / rc) * 180) / Math.PI, 1e-9, 'ángulo al salir de la franja'); cerca(fc.y, rc * (1 - Math.sqrt(1 - (0.03 / rc) ** 2)), 1e-9, 'desplazamiento al salir'); if (!fc.cruza || fc.hacia !== 'arriba') mal('Fuerza magnética: el protón debería cruzar la franja hacia arriba');
    const fv = r('franja-vuelve'); if (fv.cruza || fv.hacia !== 'abajo') mal('Fuerza magnética: el electrón no debería cruzar la franja y debería curvarse hacia abajo'); cerca(fv.y, (2 * me * Math.sqrt((2 * 500 * e) / me)) / (e * 0.002), 1e-9, '2r del electrón en la franja');
    const cy = r('cicloide'); cerca(cy.vd, 1e5, 1e-12, 'velocidad de deriva'); cerca(cy.h, (2 * mp * 1000) / (e * 0.01 ** 2), 1e-9, 'altura de la cicloide'); cerca(cy.vmax, 2e5, 1e-12, 'rapidez máxima en la cicloide'); if (!cy.sube) mal('Fuerza magnética: el protón en reposo debería subir hacia E');
    const tr = r('trocoide'); cerca(tr.R, (me * 3e6) / (e * 0.001), 1e-9, 'radio de la trocoide'); if (FzC.cruzados({ ...r0('cicloide'), v0: '1e5' }).R !== 0) mal('Fuerza magnética: con v0 = E/B debería ir recta');
    const hc = r('hall-cobre'); cerca(hc.VH, (20 * 1.5) / (8.5e28 * e * 1e-4), 1e-12, 'tensión Hall'); if (hc.alta !== 'de abajo' || r('hall-semi').alta !== 'de arriba') mal('Fuerza magnética: la cara a más potencial del efecto Hall no cuadra');
    cerca(r('hall-semi').n, (0.01 * 0.5) / (e * 1e-3 * 3e-3), 1e-12, 'densidad de huecos');
    const er = r('espira-rect'); cerca(er.tau, 50 * 2 * 0.005 * 0.4 * 0.5, 1e-12, 'par sobre la bobina'); cerca(er.U, -0.2 * Math.cos(Math.PI / 6), 1e-12, 'energía de la bobina'); cerca(r('espira-circ').tau, 5 * Math.PI * 0.01 * 0.2, 1e-12, 'par sobre la espira circular');
    for (const [q, sc] of [['dos isótopos sin B′', { ...r0('isotopos'), B2: '' }], ['una franja de anchura 0', { ...r0('franja-cruza'), d: '0' }], ['un efecto Hall sin grosor', { ...r0('hall-cobre'), t: '' }], ['una espira de 200°', { ...r0('espira-rect'), th: '200' }], ['una B vacía', { ...p0(), B: '' }], ['una velocidad que no es un número', { ...p0(), v: 'abc' }], ['un ángulo de 200°', { ...p0(), th: '200' }], ['una carga 0', { ...p0(), part: 'otra', q: '0', m: '1e-27' }], ['vectores sin B', { ...r0('vec-proton'), Bx: '', By: '', Bz: '' }], ['un selector sin E', { ...r0('selector'), E: '' }], ['dos hilos a distancia 0', { ...r0('paralelos'), d: '0' }]]) {
      let ok = false; try { FzC.resolver(sc); } catch (err) { ok = true; }
      if (!ok) mal(`Fuerza magnética: ${q} no da error`);
    }
    // FU-1: trayectoria numérica contra los casos cerrados
    { const q = FzC.E0, m = FzC.PART.proton.m, tr = (extra) => FzC.resolver({ modo: 'trayectoria', part: 'proton', q: '', m: '', vx: '0', vy: '0', vz: '0', Bx: '0', By: '0', Bz: '0', Ex: '0', Ey: '0', Ez: '0', tt: '', ...extra });
      const cer = (a, b, tol, w) => { if (!(Math.abs(a - b) <= tol)) mal(`Fuerza magnética · ${w}: ${a} en vez de ${b}`); };
      // sin E: circunferencia de radio mv/(qB); a un periodo vuelve al origen y la energía se conserva
      { const v = 1e6, B = 0.5, r = (m * v) / (q * B), T = (2 * Math.PI * m) / (q * B), s2 = tr({ vx: String(v), Bz: String(B), tt: String(T) }), u = s2.muestras[s2.muestras.length - 1];
        cerca(s2.rL, r, 1e-12, 'radio de giro'); cer(Math.hypot(u[1], u[2]) / r, 0, 1e-6, 'vuelve al origen tras un periodo'); cerca(s2.KE1, s2.KE0, 1e-9, 'energía constante sin E');
        const ymax = Math.max(...s2.muestras.map((x) => Math.abs(x[2]))); cerca(ymax, 2 * r, 2e-3, 'diámetro de la circunferencia'); }
      // hélice: avanza v∥·T por vuelta, con B inclinado en x-z
      { const v = 1e6, B = 0.2, T = (2 * Math.PI * m) / (q * B), s2 = tr({ vx: '5e5', vz: '8.66025e5', Bz: String(B), tt: String(3 * T) }), u = s2.muestras[s2.muestras.length - 1]; cerca(u[3], 8.66025e5 * 3 * T, 1e-6, 'avance de la hélice en 3 vueltas'); cerca(s2.vpm, 5e5, 1e-12, 'velocidad perpendicular'); cerca(s2.vpar, 8.66025e5, 1e-12, 'velocidad paralela'); }
      // E ⊥ B desde el reposo: cicloide, deriva E/B, velocidad máxima 2E/B y desplazamiento de un periodo = 2π m E/(q B²)
      { const E = 1000, B = 0.01, T = (2 * Math.PI * m) / (q * B), s2 = tr({ Ex: String(E), Bz: String(B), tt: String(T) }), u = s2.muestras[s2.muestras.length - 1], vmax = Math.max(...s2.muestras.map((x) => Math.hypot(x[4], x[5], x[6])));
        cerca(Math.hypot(...s2.vd), E / B, 1e-12, 'deriva E/B'); cerca(vmax, 2 * E / B, 1e-3, 'velocidad máxima de la cicloide 2E/B'); cerca(u[2], -(2 * Math.PI * m * E) / (q * B * B), 1e-3, 'desplazamiento de un periodo de la cicloide');
        if (s2.vd[1] >= 0) mal('Fuerza magnética · E × B de x con B de z debería derivar hacia −y'); }
      // E ∥ B: movimiento uniformemente acelerado a lo largo de B
      { const E = 50, B = 0.1, tt = 1e-6, s2 = tr({ Ez: String(E), Bz: String(B), vx: '1e5', tt: String(tt) }), u = s2.muestras[s2.muestras.length - 1]; cerca(u[3], 0.5 * (q * E / m) * tt * tt, 1e-6, 'aceleración a lo largo de B'); cerca(s2.apar, q * E / m, 1e-12, 'a∥'); }
      // teorema trabajo-energía con campos inclinados
      { const s2 = FzC.resolver(FzC.ejemplos.find((e) => e.clave === 'tray-general').sc); cerca(s2.KE1 - s2.KE0, s2.WE, 1e-3, 'ΔE_c = q E·Δr con E y B inclinados'); if (s2.muestras.length < 100) mal('Fuerza magnética · trayectoria con pocas muestras'); }
      for (const mala of [{ Bz: '0', Ez: '0' }, { vx: '0', Bz: '0.1', Ez: '0' }, { Bz: '0', Ex: '5', tt: '' }, { Ex: '1e9', Bz: '1', vx: '1' }, { part: 'otra', q: '1e-19', m: '' }]) { let ok = false; try { tr({ vx: '1e5', ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Fuerza magnética · trayectoria ${JSON.stringify(mala)} debería dar error`); } }
    // FU-3: espejo magnético: punto de retorno L cot α, periodo 2πL/v⊥, μ conservado, cono de pérdidas
    { const a = FzC.resolver(FzC.ejemplos.find((e) => e.clave === 'espejo-atrapada').sc), b = FzC.resolver(FzC.ejemplos.find((e) => e.clave === 'espejo-escapa').sc);
      cerca(a.ac, Math.asin(1 / 2), 1e-12, 'ángulo del cono de pérdidas arcsen(1/√Rm)'); if (!a.atrapada || a.escapa) mal('Fuerza magnética · espejo: α₀ = 45° con Rm = 4 debería quedar atrapada');
      cerca(a.zt, 0.5, 1e-12, 'z_t = L cot α₀'); cerca(a.zmax, a.zt, 0.01, 'punto de retorno simulado'); cerca(a.TbSim, a.Tb, 0.01, 'periodo de rebote simulado frente a 2πL/v⊥'); if (!(a.dev < 0.02)) mal(`Fuerza magnética · espejo: μ varía un ${a.dev}`);
      cerca(a.mu, (a.P.m * a.vp * a.vp) / (2 * a.B0), 1e-12, 'μ inicial'); const KE = (q) => 0.5 * a.P.m * (q[4] ** 2 + q[5] ** 2 + q[6] ** 2); cerca(Math.max(...a.muestras.map(KE)), KE(a.muestras[0]), 1e-6, 'energía constante en el espejo');
      if (b.atrapada || !b.escapa) mal('Fuerza magnética · espejo: α₀ = 20° con Rm = 4 debería escapar'); cerca(b.zmax, b.zm, 0.02, 'sale por el extremo z = ±L√(Rm − 1)');
      // en el límite del cono (sen²α = 1/Rm) el punto de retorno es justo el extremo
      cerca(FzC.resolver({ ...FzC.ejemplos.find((e) => e.clave === 'espejo-atrapada').sc, al: '35' }).zt, 0.5 / Math.tan((35 * Math.PI) / 180), 1e-12, 'z_t con 35°');
      for (const mala of [{ Rm: '1' }, { al: '0' }, { al: '120' }, { L: '0.001' }, { B0: '1e-9' }]) { let ok = false; try { FzC.resolver({ ...FzC.ejemplos.find((e) => e.clave === 'espejo-atrapada').sc, ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Fuerza magnética · espejo ${JSON.stringify(mala)} debería dar error`); } }
    if (fallos === antes) console.log(`  ✓ Fuerza magnética: ${FzC.ejemplos.length} ejemplos, radio, periodo, hélice, sentido de giro, v × B, selector, espectrómetro e isótopos, ciclotrón, franja, cicloide, Hall, espira, hilos y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'electromagnetismo', 'fuerza', 'index.html'));
      await page.waitForFunction(() => window.FuerzaApp);
      const antes = fallos;
      const verC = (await page.locator('#ver').textContent()).trim();
      if (verC !== Version.de('fuerza').current) mal(`Fuerza magnética: la página muestra la versión «${verC}», se esperaba ${Version.de('fuerza').current}`);
      for (const e of FzC.ejemplos) {
        await page.evaluate((c) => FuerzaApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(60);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
        if (r.err || r.pasos < 2 || r.res < 1) mal(`Fuerza magnética · ${e.clave}: falta el resultado o el desarrollo`);
        if (r.modo !== e.sc.modo) mal(`Fuerza magnética · ${e.clave}: el modo no cuadra`);
      }
      await page.evaluate(() => FuerzaApp.abrirEjemplo('proton'));
      if (!(await page.locator('#res').textContent()).includes('0,04176')) mal('Fuerza magnética: el radio del protón (0,04176 m) no sale en la página');
      await page.fill('#f-B', '1');
      if (!(await page.locator('#res').textContent()).includes('0,02088')) mal('Fuerza magnética: con el doble de campo el radio no se reduce a la mitad');
      await page.selectOption('#f-part', 'electron');
      if (!(await page.locator('#res').textContent()).includes('horario')) mal('Fuerza magnética: al cambiar a un electrón no cambia el sentido de giro');
      await page.selectOption('#f-part', 'otra');
      if ((await page.locator('#f-q').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Fuerza magnética: al elegir otra partícula no salen q y m o da error');
      await page.selectOption('#f-uv', 'V');
      if (!(await page.locator('#error').isHidden())) mal('Fuerza magnética: al dar la ddp en vez de la velocidad da error');
      await page.fill('#f-B', 'abc');
      if (await page.locator('#error').isHidden()) mal('Fuerza magnética: una B que no es un número no da error');
      await page.selectOption('#f-modo', 'vectorial');
      if ((await page.locator('#f-vx').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Fuerza magnética: al pasar a vectores no salen las componentes o da error');
      await page.fill('#f-Ez', '1e5');
      if (!(await page.locator('#res').textContent()).includes('Lorentz')) mal('Fuerza magnética: con E no sale la fuerza de Lorentz completa');
      await page.click('#play');
      if ((await page.locator('#play').textContent()).trim() !== '▶ Seguir') mal('Fuerza magnética: el botón de pausa no cambia');
      for (let i = 0; i < 12; i++) { await page.evaluate(() => FuerzaApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Fuerza magnética: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => FuerzaApp.estado()))}`); }
      // copiar la solución como texto o LaTeX e imprimirla (compartir.js)
      if ((await page.locator('.compartir button').count()) !== 4 || !/Resultados[\s\S]*Desarrollo/.test(await page.evaluate(() => Compartir.ejercicio(false)))) mal('Fuerza magnética: faltan los botones para copiar o imprimir la solución');
      // vista 3D y alternativa 2D de los modos numéricos
      for (const c of ['tray-helice', 'tray-general', 'espejo-atrapada', 'espejo-escapa']) {
        await page.evaluate((k) => FuerzaApp.abrirEjemplo(k), c);
        const r = await page.evaluate(() => ({ visible: !document.querySelector('#card3d').hidden, desc: document.querySelector('#desc3d').textContent.length, aria: document.querySelector('#vista3d').getAttribute('aria-label').length, p3: document.querySelector('#vista3d').toDataURL().length, p2: document.querySelector('#escena').toDataURL().length, tab: document.querySelector('#vista3d').tabIndex }));
        if (!r.visible || r.desc < 60 || r.aria < 60 || r.p3 < 4000 || r.p2 < 4000 || r.tab !== 0) mal(`Fuerza magnética · ${c}: la vista 3D, su descripción o la alternativa 2D no salen bien (${JSON.stringify(r)})`);
      }
      await page.evaluate(() => FuerzaApp.abrirEjemplo('proton'));
      if (!(await page.locator('#card3d').isHidden())) mal('Fuerza magnética: la vista 3D debería ocultarse en los demás modos');
      await page.evaluate(() => FuerzaApp.abrirEjemplo('tray-helice'));
      await page.focus('#vista3d'); const antes3 = await page.evaluate(() => document.querySelector('#vista3d').toDataURL()); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
      if ((await page.evaluate(() => document.querySelector('#vista3d').toDataURL())) === antes3) mal('Fuerza magnética: las flechas del teclado no giran la vista 3D');
      await page.selectOption('#f-modo', 'espejo'); if (await page.locator('#error').isVisible()) mal('Fuerza magnética: error al elegir el espejo magnético: ' + await page.locator('#error').textContent());
      await page.fill('#f-Rm', '1'); if (await page.locator('#error').isHidden()) mal('Fuerza magnética: Rm = 1 debería dar error');
      await page.close();
      if (consola.length) mal('Fuerza magnética: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Fuerza magnética: ${FzC.ejemplos.length} ejemplos, cambio de campo y de partícula, sentido de giro, ddp, errores, vectores con E y ejercicios al azar sin errores de consola`);
    }
  };
};
