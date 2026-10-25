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
    for (const e of Energia.ejemplos) {
      const r = Energia.resolver(e.sc).res, esp = ESP[e.clave];
      if (!esp) { mal(`Trabajo y energía: falta el resultado esperado de ${e.clave}`); continue; }
      for (const [k, v] of Object.entries(esp)) if (typeof v === 'number' ? !(Math.abs(r[k] - v) < 1e-4 * Math.max(1, Math.abs(v))) : r[k] !== v) mal(`Trabajo y energía · ${e.clave}: ${k} = ${r[k]}, se esperaba ${v}`);
      const sim = Energia.simular(e.sc, 20);
      const deriva = Math.max(...sim.puntos.map((q) => Math.abs(q.K + q.Ug + q.Ue + q.Q - sim.E0)));
      if (deriva > 1e-6 * Math.max(1, sim.E0)) mal(`Trabajo y energía · ${e.clave}: la simulación no conserva la energía (desvío ${deriva} J)`);
      if (esp.x !== undefined) { const xs = Math.max(...sim.puntos.map((q) => q.x)); if (Math.abs(xs - esp.x) > 1e-4) mal(`Trabajo y energía · ${e.clave}: compresión simulada ${xs}, analítica ${esp.x}`); }
    }
    if (fallos === antes) console.log(`  ✓ Trabajo y energía: ${Energia.ejemplos.length} ejemplos con los resultados esperados y la energía conservada en la simulación`);
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
      await page.click('#play'); await page.waitForTimeout(300); await page.click('#play');
      await page.fill('#c-m', 'x');
      if (await page.locator('#error').isHidden()) mal('Trabajo y energía: una masa no numérica no muestra el error');
      await page.close();
      if (consola.length) mal('Trabajo y energía: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Trabajo y energía: ${Energia.ejemplos.length} ejemplos, animación y errores de datos sin errores de consola`);
    }
  };
};
