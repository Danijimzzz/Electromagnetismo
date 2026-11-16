/* Comprobación de gases: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo gases ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Gases = require(path.join(fuente, 'gases', 'fisica.js'));
  {
    // valores calculados a mano
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.abs(b || 1))) mal(`Gases · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => Gases.resolver(Gases.ejemplos.find((e) => e.clave === c).sc);
    cerca(r('volumen').V, (0.5 * 8.314 * 300.15) / 202650, 1e-9, 'V = nRT/P');
    cerca(r('normales').V * 1000, 22.41, 1e-3, 'volumen molar en condiciones normales');
    const iso = r('isoterma');
    cerca(iso.Wt, 405300 * 0.005 * Math.log(4), 1e-9, 'W isoterma = PV ln 4'); cerca(iso.Ut, 0, 1e-9, 'ΔU isoterma');
    const ad = r('adiabatica');
    cerca(ad.est[1].P, 101325 * 5 ** 1.4, 1e-9, 'P final adiabática'); cerca(ad.Qt, 0, 1e-9, 'Q adiabática'); cerca(ad.Ut, -ad.Wt, 1e-9, 'ΔU = −W en la adiabática');
    const rect = r('ciclo-rect');
    if (!rect.ciclo) mal('Gases: el ciclo rectangular no cierra');
    cerca(rect.Wt, 800, 1e-9, 'W neto = ΔP·ΔV'); cerca(rect.Qabs, 3600, 1e-9, 'Q absorbido del ciclo rectangular'); cerca(rect.rend, 800 / 3600, 1e-9, 'rendimiento del ciclo rectangular');
    const ca = r('carnot');
    if (!ca.ciclo) mal('Gases: el ciclo de Carnot no cierra');
    cerca(ca.rend, 0.5, 1e-5, 'rendimiento de Carnot 1 − 300/600');
    if (ca.tramos[3].a !== 'A') mal('Gases: el último tramo del ciclo no acaba en A');
    cerca(r('cinetica').vrms, Math.sqrt((3 * 8.314 * 300) / 0.032), 1e-9, 'v_cm del O₂ a 300 K');
    // recorrido libre medio del aire a 293 K y 1 atm con d = 365 pm: λ = kT/(√2 π d² P)
    const kB = 1.380649e-23, rc = r('recorrido');
    cerca(rc.lam, (kB * 293) / (Math.SQRT2 * Math.PI * 365e-12 ** 2 * 101325), 1e-9, 'recorrido libre medio'); cerca(rc.z, rc.vmed / rc.lam, 1e-12, 'choques por segundo');
    // aire: 1 mol en 22,4 L a 298 K; P_O₂ = 0,21·P
    const am = r('aire-mezcla'), Pt = (1 * 8.314 * 298) / 0.0224;
    cerca(am.Pt, Pt, 1e-9, 'presión total de la mezcla'); cerca(am.comp[1].P, 0.21 * Pt, 1e-9, 'presión parcial del O₂'); cerca(am.Mm, 0.78 * 28.01 + 0.21 * 32 + 0.01 * 39.95, 1e-9, 'masa molar media del aire');
    const bu = r('buceo'), nO = 800 / 32, nHe = 400 / 4.003;
    cerca(bu.comp[1].x, nHe / (nO + nHe), 1e-9, 'fracción molar del helio'); cerca(bu.Pt, ((nO + nHe) * 8.314 * 293) / 0.012, 1e-9, 'presión de la botella');
    // CO₂: 1 mol en 0,5 L a 300 K, a = 0,364 y b = 4,267·10⁻⁵
    const vd = r('vdw'), Pv = (8.314 * 300) / (5e-4 - 4.267e-5) - 0.364 / 25e-8;
    // Redlich-Kwong con Tc y Pc de Van der Waals (CO₂: a = 0,364; b = 4,267·10⁻⁵; R = 8,314)
    const Tcv = (8 * 0.364) / (27 * 8.314 * 4.267e-5), Pcv = 0.364 / (27 * 4.267e-5 ** 2), aK = (0.42748 * 8.314 ** 2 * Tcv ** 2.5) / Pcv, bK = (0.08664 * 8.314 * Tcv) / Pcv;
    const Pk = (8.314 * 300) / (5e-4 - bK) - aK / (Math.sqrt(300) * 5e-4 * (5e-4 + bK));
    cerca(vd.PRK, Pk, 1e-9, 'presión de Redlich-Kwong'); cerca(vd.ZRK, (Pk * 5e-4) / (8.314 * 300), 1e-9, 'Z de Redlich-Kwong');
    // TRV.10.10 · Redlich-Kwong con los datos críticos reales (CO₂: 304,1 K y 72,8 atm) y N₂: Tc y Pc reales difieren de los de Van der Waals
    {
      const rr = Gases.resolver({ modo: 'real', gasR: 'CO2', a: '', b: '', n: '1', V: '0,5', T: '300', crit: 'real' }), Tr = 304.1, Pr = 72.8 * 101325, aR = (0.42748 * 8.314 ** 2 * Tr ** 2.5) / Pr, bR = (0.08664 * 8.314 * Tr) / Pr;
      cerca(rr.PRK, (8.314 * 300) / (5e-4 - bR) - aR / (Math.sqrt(300) * 5e-4 * (5e-4 + bR)), 1e-9, 'Redlich-Kwong con datos críticos reales del CO₂'); if (!rr.usaReal || vd.usaReal) mal('Gases: el interruptor de datos críticos reales no distingue');
      cerca(rr.Tc, vd.Tc, 1e-9, 'la temperatura crítica de Van der Waals no cambia con el interruptor (solo Redlich-Kwong)');
      const nn = Gases.resolver({ modo: 'real', gasR: 'N2', a: '', b: '', n: '1', V: '0,5', T: '200', crit: 'real' }), n0 = Gases.resolver({ modo: 'real', gasR: 'N2', a: '', b: '', n: '1', V: '0,5', T: '200' });
      if (Math.abs(nn.PRK - n0.PRK) < 1e-6 * n0.PRK) mal('Gases: con datos críticos reales del N₂ la presión de Redlich-Kwong tendría que cambiar');
      for (const [k, [T, P]] of Object.entries(Gases.CRIT)) if (!(T > 0 && P > 0)) mal(`Gases: datos críticos de ${k} mal`);
    }
    // a temperatura alta y volumen grande, Redlich-Kwong, Van der Waals y gas ideal coinciden
    const gd = Gases.resolver({ modo: 'real', gasR: 'N2', a: '', b: '', n: '1', V: '1000', T: '400' });
    cerca(gd.PRK / gd.Pi, 1, 1e-3, 'Redlich-Kwong → ideal a baja densidad');
        cerca(vd.P, Pv, 1e-9, 'presión de Van der Waals'); cerca(vd.Z, (Pv * 5e-4) / (8.314 * 300), 1e-9, 'factor de compresibilidad'); cerca(vd.Tc, (8 * 0.364) / (27 * 8.314 * 4.267e-5), 1e-9, 'temperatura crítica del CO₂');
    if (!(vd.Z < 1) || !(r('vdw-n2').Z > 0.99)) mal('Gases: el CO₂ comprimido debería tener Z < 1 y el N₂ casi ideal Z ≈ 1');
    for (const [sc, q] of [[{ modo: 'estado', P: '1', V: '', T: '', n: '1' }, 'dos incógnitas'], [{ modo: 'estado', P: '1', V: '1', T: '300', n: '5' }, 'cuatro datos incoherentes'], [{ modo: 'estado', uT: 'C', P: '1', V: '', T: '-300', n: '1' }, 'T bajo el cero absoluto'], [{ modo: 'procesos', gas: 'diatomico', P: '1', V: '1', T: '300', n: '', procesos: [{ tipo: 'isoterma', dato: 'V', valor: '2' }, { tipo: 'isobara', dato: 'V', valor: 'A' }] }, 'ciclo que no cierra'], [{ modo: 'procesos', gas: 'diatomico', P: '1', V: '1', T: '300', n: '', procesos: [{ tipo: 'isocora', dato: 'V', valor: '2' }] }, 'isocora con V'], [{ modo: 'procesos', gas: 'diatomico', P: '1', V: '1', T: '300', n: '', procesos: [] }, 'sin transformaciones'], [{ modo: 'real', gasR: 'CO2', n: '1', V: '0,04', T: '300' }, 'un volumen menor que nb'], [{ modo: 'mezcla', T: '300', V: '10', cant: 'n', g1: 'N2', c1: '1', g2: 'O2', c2: '' }, 'una mezcla de un solo gas'], [{ modo: 'cinetica', molecula: 'otra', M: '30', T: '300', uT: 'K', P: '1', d: '' }, 'recorrido libre medio sin diámetro']]) {
      let ok = false; try { Gases.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Gases: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Gases: ${Gases.ejemplos.length} ejemplos, PV = nRT, isoterma, adiabática, ciclos con rendimiento, teoría cinética, recorrido libre medio, mezclas de Dalton, Van der Waals y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'gases', 'index.html'));
      await page.waitForFunction(() => window.GasesApp);
      const antes = fallos;
      const verG = (await page.locator('#ver').textContent()).trim();
      if (verG !== Version.de('gases').current) mal(`Gases: la página muestra la versión «${verG}», se esperaba ${Version.de('gases').current}`);
      for (const e of Gases.ejemplos) {
        await page.evaluate((c) => GasesApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(60);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 2) mal(`Gases · ${e.clave}: falta el resultado o el desarrollo`);
        const m = await page.evaluate(() => ({ mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent) }));
        if (!m.mathml || m.dolar) mal(`Gases · ${e.clave}: el desarrollo no sale en MathML`);
      }
      await page.evaluate(() => GasesApp.abrirEjemplo('ciclo-rect'));
      if (!(await page.locator('#res').textContent()).includes('22,2 %')) mal('Gases: el rendimiento del ciclo no sale en la página');
      // quitar el último tramo deja un proceso abierto; añadir uno que vuelve a A lo cierra
      await page.click('[data-quita="3"]');
      if ((await page.evaluate(() => GasesApp.resultado().ciclo)) !== false) mal('Gases: al quitar un tramo sigue siendo un ciclo');
      await page.click('[data-add="1"]');
      await page.selectOption('[data-i="3"][data-c="tipo"]', 'isobara');
      await page.fill('[data-i="3"][data-c="valor"]', 'A');
      if (!(await page.evaluate(() => GasesApp.resultado().ciclo))) mal('Gases: el tramo añadido no cierra el ciclo');
      await page.fill('[data-i="3"][data-c="valor"]', '9');
      await page.selectOption('[data-i="3"][data-c="tipo"]', 'isocora');
      if ((await page.locator('[data-i="3"][data-c="dato"]').inputValue()) !== 'P') mal('Gases: al pasar a isocora el dato no cambia a P');
      await page.selectOption('#f-modo', 'cinetica');
      await page.selectOption('#f-molecula', 'otra');
      if ((await page.locator('#f-M').count()) !== 1) mal('Gases: «otro gas» no pide la masa molar');
      // la caja de partículas sale en cinética y se esconde en procesos
      if (await page.locator('#caja').isHidden()) mal('Gases: la caja de partículas no sale en teoría cinética');
      await page.evaluate(() => GasesApp.abrirEjemplo('aire-mezcla'));
      if (!(await page.locator('#res').textContent()).includes('110')) mal('Gases: la presión total del aire (110,6 kPa) no sale en la página');
      await page.evaluate(() => GasesApp.abrirEjemplo('vdw'));
      if (!(await page.locator('#res').textContent()).includes('0,801')) mal('Gases: Z = 0,801 del CO₂ no sale en la página');
      // F12.4: R sigue el ajuste común de Química: «de clase» (8,314) por defecto y la exacta al desmarcar; el valor usado sale en el desarrollo
      await page.evaluate(() => { localStorage.removeItem('simu-ajuste'); dispatchEvent(new Event('simu-ajuste')); GasesApp.abrirEjemplo('normales'); });
      if (!(await page.isChecked('#aj-const')) || !/R = 8,314 J/.test(await page.textContent('#aj-valor')) || /96/.test(await page.textContent('.ajuste-clase'))) mal('Gases (F12.4): por defecto R debería ser 8,314 y el ajuste no nombrar la constante de Faraday: ' + await page.textContent('.ajuste-clase'));
      const Vclase = await page.evaluate(() => GasesApp.resultado().V);
      await page.uncheck('#aj-const');
      const Vexacta = await page.evaluate(() => GasesApp.resultado().V);
      if (Math.abs(Vclase - (8.314 * 273.15) / 101325) > 1e-12 || Math.abs(Vexacta - (8.314462618 * 273.15) / 101325) > 1e-12) mal(`Gases (F12.4): V con R de clase ${Vclase} y con R exacta ${Vexacta}`);
      if (!(await page.locator('#pasos').textContent()).includes('8,314462618')) mal('Gases (F12.4): con la R exacta el desarrollo no enseña 8,314462618');
      await page.check('#aj-const');
      if (Math.abs((await page.evaluate(() => GasesApp.resultado().V)) - Vclase) > 1e-15 || !(await page.locator('#pasos').textContent()).includes('R = 8,314 J')) mal('Gases (F12.4): al volver a marcar las constantes de clase no vuelve a 8,314');
      await page.evaluate(() => localStorage.removeItem('simu-ajuste'));
      await page.evaluate(() => GasesApp.abrirEjemplo('isoterma'));
      if (!(await page.locator('#caja').isHidden())) mal('Gases: la caja de partículas sale en las transformaciones');
      for (let i = 0; i < 15; i++) { await page.evaluate(() => GasesApp.azar()); if (!(await page.locator('#error').isHidden()) || !(await page.evaluate(() => GasesApp.enunciado()))) mal(`Gases: un ejercicio al azar da error o no tiene enunciado: ${JSON.stringify(await page.evaluate(() => GasesApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Gases: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Gases: ${Gases.ejemplos.length} ejemplos, MathML, editor de tramos, cierre del ciclo, teoría cinética, mezclas, Van der Waals, caja de partículas y ejercicios al azar sin errores de consola`);
    }
  };
};
