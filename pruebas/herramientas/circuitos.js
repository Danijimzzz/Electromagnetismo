/* Comprobación de circuitos: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo circuitos ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Continua = require(path.join(fuente, 'circuitos', 'fisica.js'));
  {
    // valores calculados a mano
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Circuitos · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => Continua.resolver(Continua.ejemplos.find((e) => e.clave === c).sc);
    cerca(r('divisor').V.b, 8, 1e-9, 'divisor de tensión');
    cerca(r('dos-mallas').V.b, 80 / 13, 1e-9, 'dos mallas V_b = 80/13');
    const ws = r('wheatstone');
    cerca(ws.V.b, 108 / 17, 1e-9, 'Wheatstone V_b = 108/17'); cerca(ws.V.c, 104 / 17, 1e-9, 'Wheatstone V_c = 104/17');
    cerca(r('corriente').V.a, 10, 1e-9, 'fuente de corriente V_a');
    cerca(r('mixto').V.b, 9.6, 1e-9, 'mixto V_b');
    for (const c of Continua.ejemplos) { const s = Continua.resolver(c.sc); cerca(s.ent, s.abs, 1e-9 * Math.max(1, s.ent), `balance de potencias en ${c.clave}`); }
    const t = r('thevenin').thev;
    cerca(t.Vth, 8, 1e-9, 'V_th'); cerca(t.Rth, 2, 1e-9, 'R_th'); cerca(t.IN, 4, 1e-9, 'I_N'); cerca(t.IL, 2, 1e-9, 'corriente en la carga'); cerca(t.Pmax, 8, 1e-9, 'P_máx');
    cerca(t.IL, r('thevenin').els[3].I, 1e-9, 'Thévenin da la misma corriente que el circuito completo');
    const E = (a, b, v) => ({ t: 'V', a, b, v }), R = (a, b, v) => ({ t: 'R', a, b, v }), J = (a, b, v) => ({ t: 'I', a, b, v });
    for (const [els, q] of [[[E('a', '0', '5'), E('a', '0', '6'), R('a', '0', '1')], 'dos fuentes de tensión distintas en paralelo'], [[R('a', '0', '0')], 'resistencia de 0 Ω'], [[E('a', '0', '5'), R('a', '0', '1'), R('x', 'y', '1')], 'circuito partido'], [[J('0', 'a', '1'), J('a', 'b', '2'), R('b', '0', '1')], 'fuentes de corriente en serie distintas'], [[R('a', 'a', '1')], 'elemento entre el mismo nudo']]) {
      let ok = false; try { Continua.resolver({ elementos: els, carga: '' }); } catch (e) { ok = true; }
      if (!ok) mal(`Circuitos: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Circuitos de continua: ${Continua.ejemplos.length} circuitos con los potenciales esperados, balance de potencias, Thévenin y Norton, y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'circuitos', 'continua', 'index.html'));
      await page.waitForFunction(() => window.CircuitosApp);
      const antes = fallos;
      const verC = (await page.locator('#ver').textContent()).trim();
      if (verC !== Version.de('circuitos').current) mal(`Circuitos: la página muestra la versión «${verC}», se esperaba ${Version.de('circuitos').current}`);
      for (const e of Continua.ejemplos) {
        await page.evaluate((c) => CircuitosApp.abrirEjemplo(c), e.clave);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 4) mal(`Circuitos · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => CircuitosApp.abrirEjemplo('thevenin'));
      if (!(await page.locator('#res').textContent()).includes('8 V')) mal('Circuitos: el ejemplo de Thévenin no da V_th = 8 V en la página');
      await page.evaluate(() => CircuitosApp.abrirEjemplo('divisor'));
      const n0 = await page.locator('#lista input').count();
      await page.click('[data-add="R"]');
      if ((await page.locator('#lista input').count()) !== n0 + 3) mal('Circuitos: el botón de añadir resistencia no añade una fila');
      await page.locator('#lista input[data-k="v"]').last().fill('-4');
      if (await page.locator('#error').isHidden()) mal('Circuitos: una resistencia negativa no muestra el error');
      await page.locator('[data-quita]').last().click();
      if (!(await page.locator('#error').isHidden())) mal('Circuitos: al quitar la resistencia mala sigue el error');
      await page.close();
      if (consola.length) mal('Circuitos: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Circuitos de continua: ${Continua.ejemplos.length} circuitos, añadir y quitar elementos y errores sin errores de consola`);
    }
  };
};
