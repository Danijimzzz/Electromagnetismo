/* Comprobación de trabajo-y-energia: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo trabajo-y-energia ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Energia = require(path.join(fuente, 'trabajo-y-energia', 'fisica.js'));
  {
    // resultados comprobados a mano; la simulación debe conservar E = K + Ug + Ue + Q y llegar a la misma compresión
    const ESP = {
      'rampa-muelle': { vB: 9.0014, vC: 8.0837, x: 0.78901 },
      'sin-rozamiento': { vB: 6.2610, vC: 6.2610, x: 0.62610 },
      'para-llano': { vB: 9.0014, paraLlano: 8.2679 },
      'no-arranca': { quieto: true },
      'empujon': { vB: 1.2941, paraLlano: 0.42722 },
      'muelle-duro': { vB: 7.4361, vC: 7.3032, x: 0.18227 },
    };
    const antes = fallos;
    for (const e of Energia.ejemplos.filter((x) => !x.sc.modo)) {
      const r = Energia.resolver(e.sc).res, esp = ESP[e.clave];
      if (!esp) { mal(`Trabajo y energía: falta el resultado esperado de ${e.clave}`); continue; }
      for (const [k, v] of Object.entries(esp)) if (typeof v === 'number' ? !(Math.abs(r[k] - v) < 1e-4 * Math.max(1, Math.abs(v))) : r[k] !== v) mal(`Trabajo y energía · ${e.clave}: ${k} = ${r[k]}, se esperaba ${v}`);
      const sim = Energia.simular(e.sc, 20);
      const deriva = Math.max(...sim.puntos.map((q) => Math.abs(q.K + q.Ug + q.Ue + q.Q - sim.E0)));
      if (deriva > 1e-6 * Math.max(1, sim.E0)) mal(`Trabajo y energía · ${e.clave}: la simulación no conserva la energía (desvío ${deriva} J)`);
      if (esp.x !== undefined) { const xs = Math.max(...sim.puntos.map((q) => q.x)); if (Math.abs(xs - esp.x) > 1e-4) mal(`Trabajo y energía · ${e.clave}: compresión simulada ${xs}, analítica ${esp.x}`); }
    }
    // los otros modos, calculados a mano con g = 9,8
    const R = (c) => Energia.resolver(Energia.ejemplos.find((e) => e.clave === c).sc).res, cerca = (a, b, q) => { if (!(Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b)))) mal(`Trabajo y energía · ${q}: ${a} en vez de ${b}`); };
    const rm = R('rampa-muelle'); cerca(rm.hmin, (2 * 0.2 * 9.8 * 4) / (2 * 9.8 * (1 - 0.1 / Math.tan(Math.PI / 6))), 'altura mínima para llegar al muelle'); cerca(rm.mu2Para, rm.vB ** 2 / (2 * 9.8 * 4), 'μ₂ para pararse');
    const kx = Energia.resolver({ ...Energia.ejemplos[0].sc, xobj: '0,5' }).res; cerca(kx.kPara, (2 * rm.vC ** 2 - 2 * 0.2 * 2 * 9.8 * 0.5) / 0.25, 'k para comprimir 0,5 m');
    const rj = R('rizo-justo'); cerca(rj.hmin, 5, 'rizo h mínima = 5R/2'); cerca(rj.vArriba, Math.sqrt(2 * 9.8 * 6 - 4 * 9.8 * 2), 'rizo v arriba'); cerca(rj.Narriba, 0.5 * ((2 * 9.8 * 6 - 4 * 9.8 * 2) / 2 - 9.8), 'rizo N arriba');
    const rd = R('rizo-despega'); if (rd.completa) mal('Trabajo y energía: desde 4 m un rizo de 2 m no debería completarse'); cerca(rd.ydesp, (2 * 4 + 2) / 3, 'rizo altura de despegue (2h + R)/3');
    const pe = R('pendulo'); cerca(pe.vAbajo, Math.sqrt(9.8), 'péndulo v abajo'); cerca(pe.Tabajo, 0.2 * 9.8 * 2, 'péndulo T = mg(3 − 2cos θ₀)'); cerca(pe.vEn, Math.sqrt(9.8 - 2 * 9.8 * (1 - Math.cos(Math.PI / 6))), 'péndulo v a 30°');
    const pv = R('pendulo-vuelta'); if (!pv.vuelta) mal('Trabajo y energía: a 7 m/s el péndulo de 0,8 m debería dar la vuelta'); cerca(pv.vArriba, Math.sqrt(49 - 4 * 9.8 * 0.8), 'péndulo v arriba');
    const mo = R('montana'); cerca(mo.v[0], Math.sqrt(4 + 2 * 9.8 * 22), 'montaña rusa v en el punto 2'); if (mo.llega !== 6) mal('Trabajo y energía: la montaña rusa debería llegar al final');
    const fv = R('fuerza-variable'); cerca(fv.W, 110, 'trabajo = área'); cerca(fv.v, Math.sqrt(55), 'velocidad final'); cerca(fv.Pmedia, 110 / 3, 'potencia media');
    for (const c of ['rizo-justo', 'pendulo', 'montana']) { const sm = Energia.resolver(Energia.ejemplos.find((e) => e.clave === c).sc).sim; const dv = Math.max(...sm.puntos.map((q) => Math.abs(q.K + q.Ug - sm.E0))); if (dv > 1e-6 * sm.E0) mal(`Trabajo y energía · ${c}: la animación no conserva la energía (${dv} J)`); }
    if (fallos === antes) console.log(`  ✓ Trabajo y energía: ${Energia.ejemplos.length} ejemplos con los resultados esperados (rampa, al revés, rizo, péndulo, montaña rusa y fuerza variable) y la energía conservada en la simulación`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'trabajo-y-energia', 'index.html'));
      await page.waitForFunction(() => window.EnergiaApp);
      const antes = fallos;
      const verE = (await page.locator('#ver').textContent()).trim();
      if (verE !== Version.de('trabajo-y-energia').current) mal(`Trabajo y energía: la página muestra la versión «${verE}», se esperaba ${Version.de('trabajo-y-energia').current}`);
      for (const e of Energia.ejemplos) {
        await page.evaluate((c) => { EnergiaApp.abrirEjemplo(c); EnergiaApp.ir(EnergiaApp.fin() / 2); EnergiaApp.ir(EnergiaApp.fin()); }, e.clave);
        if ((await page.locator('#pasos li').count()) < 2) mal(`Trabajo y energía · ${e.clave}: no aparece el desarrollo`);
      }
      await page.evaluate(() => EnergiaApp.abrirEjemplo('rampa-muelle'));
      await page.click('#play'); await page.waitForTimeout(300); await page.click('#play');
      await page.fill('#c-m', 'x');
      if (await page.locator('#error').isHidden()) mal('Trabajo y energía: una masa no numérica no muestra el error');
      await page.close();
      if (consola.length) mal('Trabajo y energía: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Trabajo y energía: ${Energia.ejemplos.length} ejemplos, animación y errores de datos sin errores de consola`);
    }
  };
};
