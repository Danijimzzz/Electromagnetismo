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
      await page.close();
      if (consola.length) mal('Fuerza magnética: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Fuerza magnética: ${FzC.ejemplos.length} ejemplos, cambio de campo y de partícula, sentido de giro, ddp, errores, vectores con E y ejercicios al azar sin errores de consola`);
    }
  };
};
