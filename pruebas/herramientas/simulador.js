/* Comprobación del Simulador de circuitos: el motor (pruebas/simulador/motor.js), el paso del esquema al circuito,
   los ejemplos y la página en Chromium (arrastrar, cablear, girar, deshacer, modo oscuro y móvil).
   node pruebas/comprobar.js --solo simulador ejecuta solo esta. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  // 1. Motor: la prueba propia, en un proceso aparte
  {
    const r = require('child_process').spawnSync(process.execPath, [path.join(fuente, '..', 'pruebas', 'simulador', 'motor.js')], { encoding: 'utf8' });
    if (r.status !== 0) mal('Simulador · motor:\n      ' + (r.stdout + r.stderr).trim().split('\n').join('\n      '));
  }
  // 2. Esquema → circuito, con los ejemplos
  global.Esquema = require(path.join(fuente, 'esquema.js')); global.CompSim = require(path.join(fuente, 'simulador', 'componentes.js'));
  global.SimCircuitos = require(path.join(fuente, 'simulador', 'motor.js'));
  const Extraer = require(path.join(fuente, 'simulador', 'extraer.js')), Ejemplos = require(path.join(fuente, 'simulador', 'ejemplos.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Simulador · ${q}: ${a} en vez de ${b}`); };
    const get = (c) => { const e = Ejemplos.lista.find((x) => x.clave === c), x = Extraer.extraer(e.sc); return { x, op: SimCircuitos.operacion(x.net), fa: SimCircuitos.fasores(x.net) }; };
    { const { x, op } = get('divisor'); cerca(op.V[x.pinNet.R2[0]].re, 8, 1e-9, 'divisor V_R2'); }
    { const { x, op } = get('wheatstone'); cerca(op.U.VM1.re, 2, 1e-5, 'Wheatstone: lectura del voltímetro'); cerca(op.balance, 0, 1e-9, 'Wheatstone: balance'); }
    { const { x, op } = get('inversor'); cerca(op.V[x.pinNet.A1[2]].re, -5, 1e-6, 'inversor: salida −5 V'); }
    { const { fa } = get('rlc-alterna'); const w = 100 * Math.PI, Z = Math.hypot(40, w * 0.2 - 1 / (w * 100e-6)); cerca(SimCircuitos.mod(fa[0].I.R1) / Math.SQRT2, 230 / Z, 1e-6, 'RLC alterna: corriente eficaz'); }
    { const { x, fa } = get('transformador'); cerca(SimCircuitos.mod(fa[0].V[x.pinNet.R1[0]]) / Math.SQRT2, 23, 1e-9, 'transformador: 23 V en el secundario'); }
    { const e = Ejemplos.lista.find((q) => q.clave === 'rectificador'), x = Extraer.extraer(e.sc), tr = SimCircuitos.transitorio(x.net, { tfin: 0.06, puntos: 3000 }), v = tr.V[x.pinNet.C1[0]]; const n = v.length; const max = Math.max(...v), min = Math.min(...v.slice(Math.floor(n / 2)));
      if (!(max > 8.8 && max < 9.8)) mal(`Simulador · rectificador: la tensión máxima es ${max}`); if (!(min > 6 && min < max)) mal(`Simulador · rectificador: el rizado no cuadra (${min})`); }
    // importar lo guardado con las herramientas antiguas: divisor de continua y RLC de alterna
    {
      const Imp = require(path.join(fuente, 'simulador', 'importar.js'));
      const a = Imp.aEsquema({ elementos: [{ t: 'V', a: '1', b: '0', v: '12' }, { t: 'R', a: '1', b: '2', v: '1k' }, { t: 'R', a: '2', b: '0', v: '2k' }, { t: 'VV', a: '3', b: '0', v: '2' }] }, false);
      if (a.omitidos !== 1) mal('Simulador · importar: debía omitir 1 elemento no soportado'); const x = Extraer.extraer(a.sc); cerca(SimCircuitos.operacion(x.net).V.n2 ?? SimCircuitos.operacion(x.net).V['2'].re, 8, 1e-9, 'importar continua: V del nudo 2');
      const b = Imp.aEsquema({ f: '50', elementos: [{ t: 'V', a: '1', b: '0', v: '230', fase: '0' }, { t: 'R', a: '1', b: '2', v: '40' }, { t: 'L', a: '2', b: '3', v: '200' }, { t: 'C', a: '3', b: '0', v: '100' }] }, true), y = Extraer.extraer(b.sc), w = 100 * Math.PI;
      cerca(SimCircuitos.mod(SimCircuitos.fasores(y.net)[0].I.R1) / Math.SQRT2, 230 / Math.hypot(40, w * 0.2 - 1 / (w * 100e-6)), 1e-6, 'importar alterna: corriente eficaz');
    }
    // errores del esquema
    const ex = (sc) => { try { Extraer.extraer(sc); return ''; } catch (e) { return e.message; } };
    const base = () => JSON.parse(JSON.stringify(Ejemplos.lista[0].sc));
    { const sc = base(); sc.componentes = sc.componentes.filter((c) => c.t !== 'GND'); if (!/tierra/.test(ex(sc))) mal('Simulador: un esquema sin tierra no avisa'); }
    { const sc = base(); sc.cables = []; sc.componentes.find((c) => c.id === 'R2').x += 3; if (!/sin conectar/.test(ex(sc))) mal('Simulador: una patilla suelta no avisa'); }
    { const sc = base(); sc.componentes.find((c) => c.id === 'R1').v.R = 'abc'; if (!/R1/.test(ex(sc))) mal('Simulador: un valor no numérico no nombra el componente'); }
    // prefijos en los valores
    { const sc = base(); sc.componentes.find((c) => c.id === 'R1').v.R = '4k7'; cerca(Extraer.extraer(sc).net.elementos.find((e) => e.id === 'R1').R, 4700, 1e-12, 'prefijo 4k7'); }
    if (fallos === antes) console.log(`  ✓ Simulador: ${Ejemplos.lista.length} ejemplos desde el esquema (divisor, Wheatstone, inversor, RLC, transformador, rectificador) y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1300, 900);
    await page.goto('file://' + path.join(publico, 'circuitos', 'simulador', 'index.html'));
    await page.waitForFunction(() => window.SimuladorApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('simulador').current) mal(`Simulador: la página muestra la versión «${ver}», se esperaba ${Version.de('simulador').current}`);
    for (const e of Ejemplos.lista) {
      await page.evaluate((c) => SimuladorApp.abrirEjemplo(c), e.clave);
      for (const t of ['op', 'tr', 'fa', 'bo', 'de']) { await page.click('#tab-' + t); }
      const r = await page.evaluate(() => ({ err: SimuladorApp.resultado().err, cables: document.querySelectorAll('#ed .cable').length, comps: document.querySelectorAll('#ed .comp').length }));
      if (r.err || !r.comps) mal(`Simulador · ${e.clave}: ${r.err || 'no dibuja los componentes'}`);
    }
    // arrastrar de la paleta, cablear, girar, deshacer
    await page.evaluate(() => { SimuladorApp.abrirEjemplo('divisor'); });
    await page.click('#b-vaciar');
    const box = await page.locator('#ed').boundingBox();
    const arrastra = async (t, dx, dy) => { const b = page.locator(`#paleta [data-t="${t}"]`); await b.scrollIntoViewIfNeeded(); const bb = await b.boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.mouse.move(box.x + dx, box.y + dy, { steps: 5 }); await page.mouse.up(); };
    await arrastra('V', 120, 150); await arrastra('R', 300, 300); await arrastra('GND', 120, 420);
    const pin = async (id, i) => { const bb = await page.locator(`[data-pin="${id}:${i}"]`).boundingBox(); return [bb.x + bb.width / 2, bb.y + bb.height / 2]; };
    const cable = async (a, b) => { const [x1, y1] = await pin(...a), [x2, y2] = await pin(...b); await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 6 }); await page.mouse.up(); };
    await cable(['E1', 1], ['R1', 0]); await cable(['R1', 1], ['E1', 0]); await cable(['E1', 0], ['GND1', 0]);
    await page.waitForTimeout(400);
    let est = await page.evaluate(() => ({ s: SimuladorApp.estado(), r: SimuladorApp.resultado() }));
    if (est.s.componentes.length !== 3 || est.s.cables.length < 3) mal(`Simulador: arrastrar y cablear deja ${est.s.componentes.length} componentes y ${est.s.cables.length} cables`);
    if (est.r.err) mal('Simulador: el circuito dibujado a mano da error: ' + est.r.err);
    await page.locator('[data-c="R1"] .area').click(); await page.keyboard.press('r');
    if ((await page.evaluate(() => SimuladorApp.estado().componentes.find((c) => c.id === 'R1').rot)) !== 1) mal('Simulador: R no gira el componente');
    await page.keyboard.press('Control+z');
    if ((await page.evaluate(() => SimuladorApp.estado().componentes.find((c) => c.id === 'R1').rot || 0)) !== 0) mal('Simulador: Ctrl+Z no deshace el giro');
    await page.fill('#p-R', '2k'); await page.dispatchEvent('#p-R', 'change'); await page.waitForTimeout(300);
    est = await page.evaluate(() => SimuladorApp.resultado());
    if (est.err || Math.abs(Math.abs(est.op.I.R1.re) - 5 / 2000) > 1e-9) mal('Simulador: cambiar R a 2k no da 2,5 mA');
    // guardar, recargar y verlo
    await page.reload(); await page.waitForFunction(() => window.SimuladorApp);
    if ((await page.evaluate(() => SimuladorApp.estado().componentes.length)) !== 3) mal('Simulador: no recuerda el esquema al recargar');
    // modo oscuro y móvil, sin desbordar
    await page.emulateMedia({ colorScheme: 'dark' }); await page.waitForTimeout(150);
    await page.setViewportSize({ width: 390, height: 800 }); await page.waitForTimeout(250);
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
    if (ancho > 392) mal(`Simulador: a 390 px la página desborda (${ancho} px)`);
    await page.close();
    if (consola.length) mal('Simulador: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Simulador: ${Ejemplos.lista.length} ejemplos en la página, arrastrar, cablear, girar, deshacer, editar valor, guardar, modo oscuro y móvil`);
  };
};
