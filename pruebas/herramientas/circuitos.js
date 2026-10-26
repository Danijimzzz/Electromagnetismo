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
    // prefijos (4k7, 1k) y carga en paralelo con una fuente de tensión ideal (R_th = 0: sin Norton ni máximo)
    { const s = Continua.resolver({ elementos: [{ t: 'V', a: 'a', b: '0', v: '12' }, { t: 'R', a: 'a', b: 'b', v: '1k' }, { t: 'R', a: 'b', b: '0', v: '2k' }], carga: '' }); cerca(s.V.b, 8, 1e-9, 'divisor con 1k y 2k'); }
    { const s = Continua.resolver({ elementos: [{ t: 'V', a: 'a', b: '0', v: '12' }, { t: 'R', a: 'a', b: '0', v: '4k7' }, { t: 'R', a: 'a', b: '0', v: '4' }], carga: '1' }); if (!s.thev.ideal || s.thev.Rth !== 0 || !/no tiene equivalente de Norton/.test(s.pasos.map((p) => p.html).join(''))) mal('Circuitos: con R_th = 0 no explica que no hay Norton'); cerca(s.thev.IL, 12 / 4700, 1e-12, 'corriente con R_th = 0'); }
    // fuentes dependientes, Thévenin entre nudos, condensador y bobina, superposición y mallas, calculados a mano
    { const s = r('dependiente'); cerca(s.V.b, 20 / 3, 1e-9, 'dependiente V_b'); cerca(s.V.c, 20, 1e-9, 'fuente controlada por tensión V_c = 3·V_b'); }
    { const s = r('dependiente-corriente'); cerca(s.V.b, 360 / 39, 1e-9, 'controlada por corriente V_b = 360/39'); cerca(s.thev.Vth, 360 / 34, 1e-9, 'V_th con dependiente'); cerca(s.thev.Rth, 1 / 0.85, 1e-9, 'R_th con dependiente (corriente de prueba)'); cerca(s.thev.IL, s.els[3].I, 1e-9, 'Thévenin con dependiente da la misma corriente'); }
    { const t = r('thevenin-nudos').thev; cerca(t.Vth, 20 / 3 - 40 / 7, 1e-9, 'V_th entre b y c'); cerca(t.Rth, 200 / 3 + 600 / 7, 1e-9, 'R_th entre b y c'); }
    { const s = r('condensador'); cerca(s.V.b, 8, 1e-9, 'condensador abierto y bobina en corto'); cerca(s.els[4].W, 0.5 * 100e-6 * 64, 1e-12, 'energía del condensador ½CV²'); cerca(s.els[2].W, 0.5 * 0.05 * 1, 1e-12, 'energía de la bobina ½LI²'); }
    for (const c of ['dos-mallas', 'mixto']) { const s = r(c); if (!s.superposicion || !s.superposicion.ok) mal(`Circuitos · ${c}: la superposición no suma lo mismo`); if (!s.malla || !s.malla.ok) mal(`Circuitos · ${c}: las mallas no dan las corrientes de los nudos`); }
    { const s = r('dos-mallas'); cerca(s.superposicion.filas[0].V.b, 60 / 13, 1e-9, 'superposición: V_b solo con E1'); if (s.malla.lazos.length !== 2) mal('Circuitos: dos mallas no da 2 mallas'); }
    for (const w of Continua.ejemplos.filter((e) => e.sc.elementos.some((x) => x.t === 'VV' || x.t === 'II'))) { const s = Continua.resolver({ ...w.sc, mallas: true }); if (!s.malla.nota) mal(`Circuitos · ${w.clave}: con dependientes las mallas deberían avisar`); }
    for (const [els, q] of [[[E('a', '0', '5'), R('a', 'b', '1'), { t: 'II', a: 'b', b: '0', v: '2', x: 'R9' }], 'controlada por un elemento que no existe'], [[E('a', '0', '5'), R('a', 'b', '1'), { t: 'VV', a: 'b', b: '0', v: '2', c: 'z', d: '0' }], 'nudo de control que no está'], [[E('a', '0', '5'), { t: 'C', a: 'a', b: 'b', v: '10' }, R('b', 'c', '1'), { t: 'C', a: 'c', b: '0', v: '10' }], 'nudo unido solo por condensadores']]) {
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
      // Thévenin entre dos nudos desde la página y dibujar un elemento arrastrando de un nudo a un sitio vacío
      await page.evaluate(() => CircuitosApp.abrirEjemplo('wheatstone'));
      await page.selectOption('#carga', 'nudos'); await page.selectOption('#thA', 'b'); await page.selectOption('#thB', 'c');
      if (!(await page.locator('#res').textContent()).includes('Thévenin entre b y c')) mal('Circuitos: el Thévenin entre dos nudos no sale en la página');
      await page.click('[data-modo="dibujar"]');
      const pos = await page.evaluate(() => CircuitosApp.posiciones()), caja = await page.locator('#esquema').boundingBox(), n1 = await page.evaluate(() => CircuitosApp.estado().elementos.length);
      await page.mouse.move(caja.x + pos.b[0], caja.y + pos.b[1]); await page.mouse.down(); await page.mouse.move(caja.x + 40, caja.y + 40, { steps: 4 }); await page.mouse.up();
      const ult = await page.evaluate(() => CircuitosApp.estado().elementos.at(-1));
      if ((await page.evaluate(() => CircuitosApp.estado().elementos.length)) !== n1 + 1 || ult.a !== 'b' || ult.t !== 'R') mal('Circuitos: dibujar desde un nudo no añade la resistencia');
      await page.click('[data-modo="ver"]');
      await page.close();
      if (consola.length) mal('Circuitos: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Circuitos de continua: ${Continua.ejemplos.length} circuitos, añadir y quitar elementos y errores sin errores de consola`);
    }
  };
};
