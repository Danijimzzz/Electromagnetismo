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
    };
    for (const [k, [v, e]] of Object.entries(ESP)) if (!cerca(v, e)) mal(`Inducción · ${k}: ${v}, se esperaba ${e}`);
    const c = Induccion.rl(Induccion.ejemplos.RL[0].sc).res, d = Induccion.rl(Induccion.ejemplos.RL[1].sc).res;
    if (!cerca(c.tau, 0.05) || !cerca(c.I0, 2) || !cerca(c.It, 2 * (1 - Math.exp(-1))) || !cerca(c.VLt + c.VRt, 12)) mal(`Inducción · RL carga: ${JSON.stringify(c)}`);
    if (!cerca(d.tau, 0.005) || !cerca(d.It, 0.1 * Math.exp(-0.4)) || !cerca(d.VLt, -d.VRt)) mal(`Inducción · RL descarga: ${JSON.stringify(d)}`);
    const malas = [() => Induccion.autoinduccion({ geo: 'solenoide', N: '10.5', l: '10', r: '1', mur: '1' }), () => Induccion.autoinduccion({ geo: 'coaxial', l: '1', a: '4', b: '2' }),
      () => Induccion.autoinduccion({ geo: 'bifilar', l: '1', d: '1', a: '1' }), () => Induccion.mutua({ geo: 'acoplamiento', L1: '1', L2: '1', k: '1.2' }), () => Induccion.rl({ E: '1', R: '0', L: '1' })];
    for (const m of malas) { let ok = false; try { m(); } catch (e) { ok = true; } if (!ok) mal(`Inducción: ${m} debería dar un error`); }
    if (fallos === antes) console.log(`  ✓ Inducción: ${Induccion.ejemplos.L.length} autoinducciones, ${Induccion.ejemplos.M.length} inducciones mutuas y ${Induccion.ejemplos.RL.length} circuitos RL con el valor esperado, y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'electromagnetismo', 'induccion', 'index.html'));
      await page.waitForFunction(() => window.InducApp);
      const antes = fallos;
      const verI = (await page.locator('#ver').textContent()).trim();
      if (verI !== Version.de('induccion').current) mal(`Inducción: la página muestra la versión «${verI}», se esperaba ${Version.de('induccion').current}`);
      for (const tab of ['L', 'M', 'RL']) for (const e of Induccion.ejemplos[tab]) {
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
      await page.close();
      if (consola.length) mal('Inducción: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Inducción: ${Induccion.ejemplos.L.length + Induccion.ejemplos.M.length + Induccion.ejemplos.RL.length} ejemplos, cambio de geometría y errores sin errores de consola`);
    }
  };
};
