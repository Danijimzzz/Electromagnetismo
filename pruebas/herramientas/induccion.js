/* Comprobación de induccion: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo induccion ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Induccion = require(path.join(fuente, 'induccion', 'fisica.js'));
  {
    // coeficientes resueltos a mano (μ0 = 4π·10⁻⁷)
    const antes = fallos, cerca = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.abs(b), m0 = 4e-7 * Math.PI;
    const L = Object.fromEntries(Induccion.ejemplos.L.map((e) => [e.clave, Induccion.autoinduccion(e.sc).res]));
    const M = Object.fromEntries(Induccion.ejemplos.M.map((e) => [e.clave, Induccion.mutua(e.sc).res]));
    const ESP = {
      'L solenoide': [L.solenoide.L, (m0 * 500 ** 2 * Math.PI * 0.01 ** 2) / 0.2], 'L energía': [L.solenoide.U, 0.5 * L.solenoide.L * 4], 'L fem': [L.solenoide.fem, -100 * L.solenoide.L],
      'L solenoide-hierro': [L['solenoide-hierro'].L, (m0 * 800 * 300 ** 2 * Math.PI * 0.015 ** 2) / 0.15],
      'L toroide-rect': [L['toroide-rect'].L, (m0 * 1e6 * 0.02 * Math.log(8 / 5)) / (2 * Math.PI)],
      'L toroide-circ': [L['toroide-circ'].L, m0 * 200 ** 2 * (0.1 - Math.sqrt(0.01 - 0.0004))],
      'L coaxial': [L.coaxial.L, (m0 * Math.log(4)) / (2 * Math.PI) + m0 / (8 * Math.PI)],
      'L bifilar': [L.bifilar.L, (m0 * Math.log(9)) / Math.PI],
      'M solenoides': [M.solenoides.M, (m0 * 200 * 1000 * Math.PI * 1e-4) / 0.4],
      'M espiras': [M.espiras.M, (m0 * 10 * Math.PI * 1e-4) / 0.4],
      'M hilo-espira': [M['hilo-espira'].M, (m0 * 0.2 * Math.log(3)) / (2 * Math.PI)],
      'M toroide-bobina k': [M['toroide-bobina'].M / Math.sqrt(M['toroide-bobina'].L1 * M['toroide-bobina'].L2), 1],
      'M acoplamiento': [M.acoplamiento.M, 0.5 * Math.sqrt(2e-3 * 8e-3)],
      'L entrehierro': [L.entrehierro.L, 500 ** 2 / ((2 * Math.PI * 0.1 - 0.002) / (m0 * 2000 * 4e-4) + 0.002 / (m0 * 4e-4))],
      'M espiras-coaxiales': [M['espiras-coaxiales'].M, (m0 * Math.PI * 100 * 20 * 0.01 * 1e-4) / (2 * 0.02 ** 1.5)],
      'M espira-solenoide': [M['espira-solenoide'].M, (m0 * 1000 * 30 * Math.PI * 1e-4 * 0.5) / 0.5],
      'M serie': [M.acoplamiento.Ls, 0.014], 'M serie opuesta': [M.acoplamiento.Lso, 0.006], 'M paralelo': [M.acoplamiento.Lp, 0.002], 'M paralelo opuesto': [M.acoplamiento.Lpo, 12e-6 / 0.014],
    };
    for (const [k, [v, e]] of Object.entries(ESP)) if (!cerca(v, e)) mal(`Inducción · ${k}: ${v}, se esperaba ${e}`);
    const c = Induccion.rl(Induccion.ejemplos.RL[0].sc).res, d = Induccion.rl(Induccion.ejemplos.RL[1].sc).res;
    if (!cerca(c.tau, 0.05) || !cerca(c.I0, 2) || !cerca(c.It, 2 * (1 - Math.exp(-1))) || !cerca(c.VLt + c.VRt, 12)) mal(`Inducción · RL carga: ${JSON.stringify(c)}`);
    if (!cerca(d.tau, 0.005) || !cerca(d.It, 0.1 * Math.exp(-0.4)) || !cerca(d.VLt, -d.VRt)) mal(`Inducción · RL descarga: ${JSON.stringify(d)}`);
    if (!cerca(c.Wf, 12 * 2 * 0.05 * Math.exp(-1)) || !cerca(c.WR, c.Wf - 0.5 * 0.3 * c.It ** 2) || !cerca(d.WR, 0.5 * 0.5 * 0.01 * (1 - Math.exp(-0.8)))) mal(`Inducción · RL energía: ${JSON.stringify([c, d])}`);
    const pu = Induccion.rl(Induccion.ejemplos.RL.find((e) => e.clave === 'pulsos').sc), e1 = Math.exp(-1);
    if (!cerca(pu.res.Imax, (1.2 * (1 - e1)) / (1 - e1 * e1)) || !cerca(pu.res.Imin, pu.res.Imax * e1) || !cerca(pu.res.Imed, 0.6) || !cerca(pu.I(0.1), pu.res.Imin, 1e-6) || !cerca(pu.I(0.005), 1.2 * (1 - e1))) mal(`Inducción · RL a pulsos: ${JSON.stringify(pu.res)}`);
    const malas = [() => Induccion.autoinduccion({ geo: 'solenoide', N: '10.5', l: '10', r: '1', mur: '1' }), () => Induccion.autoinduccion({ geo: 'coaxial', l: '1', a: '4', b: '2' }),
      () => Induccion.autoinduccion({ geo: 'bifilar', l: '1', d: '1', a: '1' }), () => Induccion.mutua({ geo: 'acoplamiento', L1: '1', L2: '1', k: '1.2' }), () => Induccion.rl({ E: '1', R: '0', L: '1' })];
    for (const m of malas) { let ok = false; try { m(); } catch (e) { ok = true; } if (!ok) mal(`Inducción: ${m} debería dar un error`); }
    // IN-3: fuerza entre espiras coaxiales: elípticas, M exacta, límites de espira pequeña y de dipolo
    { const e = Induccion.elip(0.5); if (!cerca(e.K, 1.685750354812596, 1e-12) || !cerca(e.E, 1.467462209339427, 1e-12)) mal('Inducción: K(0,5) y E(0,5) no cuadran');
      const dip = (R, r, z) => (m0 * Math.PI * R * R * r * r) / (2 * Math.pow(R * R + z * z, 1.5));
      if (!cerca(Induccion.mutuaExacta(0.1, 0.05, 2), dip(0.1, 0.05, 2), 2e-3)) mal('Inducción: M exacta no tiende al dipolo lejos');
      if (!cerca(Induccion.mutuaExacta(0.1, 0.001, 0.05), dip(0.1, 0.001, 0.05), 1e-4)) mal('Inducción: M exacta no coincide con la espira pequeña');
      const R = 0.1, r = 0.001, z = 0.05, F = Induccion.fuerza({ N1: '1', R: '10', N2: '1', r: '0.1', z: '5', I1: '1', I2: '1' }).res;
      if (!cerca(F.F, (-3 * m0 * Math.PI * R * R * r * r * z) / (2 * Math.pow(R * R + z * z, 2.5)), 2e-4)) mal('Inducción: F de una espira pequeña en el eje no cuadra con m·dB/dz');
      const A = Induccion.fuerza(Induccion.ejemplos.F[0].sc).res, B = Induccion.fuerza({ ...Induccion.ejemplos.F[0].sc, I2: '-50' }).res;
      if (!(A.F < 0) || A.sentido !== 'se atraen' || !cerca(B.F, -A.F, 1e-12) || B.sentido !== 'se repelen') mal('Inducción: corrientes paralelas se atraen y opuestas se repelen');
      const c = Induccion.fuerza({ N1: '1', R: '10', N2: '1', r: '1', z: '5', I1: '1', I2: '1' }), c2 = Induccion.fuerza({ N1: '3', R: '10', N2: '4', r: '1', z: '5', I1: '2', I2: '5' }); if (!cerca(c2.res.F, c.res.F * 12 * 10, 1e-9)) mal('Inducción: F proporcional a N₁N₂I₁I₂');
      if (!cerca(Induccion.fuerza({ N1: '1', R: '10', N2: '1', r: '1', z: '5', I1: '1', I2: '1' }).res.zmax, 0.05, 0.12)) mal('Inducción: la fuerza máxima de una espira pequeña debería estar cerca de z = R/2');
      for (const mala of [{ R: '' }, { z: '0' }, { I1: 'x' }, { r: '-1' }, { N1: '1,5' }]) { let ok = false; try { Induccion.fuerza({ ...Induccion.ejemplos.F[0].sc, ...mala }); } catch (er) { ok = true; } if (!ok) mal(`Inducción: fuerza ${JSON.stringify(mala)} debería dar error`); } }
    if (fallos === antes) console.log(`  ✓ Inducción: ${Induccion.ejemplos.L.length} autoinducciones, ${Induccion.ejemplos.M.length} inducciones mutuas y ${Induccion.ejemplos.RL.length} circuitos RL con el valor esperado, serie y paralelo, energía disipada, pulsos y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'electromagnetismo', 'induccion', 'index.html'));
      await page.waitForFunction(() => window.InducApp);
      const antes = fallos;
      const verI = (await page.locator('#ver').textContent()).trim();
      if (verI !== Version.de('induccion').current) mal(`Inducción: la página muestra la versión «${verI}», se esperaba ${Version.de('induccion').current}`);
      for (const tab of ['L', 'M', 'F', 'RL']) for (const e of Induccion.ejemplos[tab]) {
        await page.evaluate(([t, c]) => InducApp.abrirEjemplo(t, c), [tab, e.clave]);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 1 || (await page.locator('#resumen > div').count()) < 3) mal(`Inducción · ${tab} ${e.clave}: falta el resumen o el desarrollo`);
      }
      await page.evaluate(() => InducApp.abrirEjemplo('L', 'solenoide'));
      if (!(await page.locator('#resumen').textContent()).includes('493,5 μH')) mal('Inducción: el solenoide de ejemplo no da 493,5 μH en la página');
      await page.selectOption('#f-geo', 'toroide-rect');
      if ((await page.locator('#f-b').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Inducción: al cambiar a toroide no aparecen sus datos');
      await page.fill('#f-b', '1');
      if (await page.locator('#error').isHidden()) mal('Inducción: un toroide con b < a no muestra el error');
      await page.click('#tab-RL');
      await page.fill('#f-t', '');
      if (!(await page.locator('#error').isHidden())) mal('Inducción: el circuito RL sin tiempo da error');
      // copiar la solución como texto o LaTeX e imprimirla (compartir.js)
      if ((await page.locator('.compartir button').count()) !== 4 || !/Resultados[\s\S]*Desarrollo/.test(await page.evaluate(() => Compartir.ejercicio(false)))) mal('Inducción: faltan los botones para copiar o imprimir la solución');
      await page.close();
      if (consola.length) mal('Inducción: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Inducción: ${Induccion.ejemplos.L.length + Induccion.ejemplos.M.length + Induccion.ejemplos.F.length + Induccion.ejemplos.RL.length} ejemplos, cambio de geometría y errores sin errores de consola`);
    }
  };
};
