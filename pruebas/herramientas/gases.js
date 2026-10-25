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
    for (const [sc, q] of [[{ modo: 'estado', P: '1', V: '', T: '', n: '1' }, 'dos incógnitas'], [{ modo: 'estado', P: '1', V: '1', T: '300', n: '5' }, 'cuatro datos incoherentes'], [{ modo: 'estado', uT: 'C', P: '1', V: '', T: '-300', n: '1' }, 'T bajo el cero absoluto'], [{ modo: 'procesos', gas: 'diatomico', P: '1', V: '1', T: '300', n: '', procesos: [{ tipo: 'isoterma', dato: 'V', valor: '2' }, { tipo: 'isobara', dato: 'V', valor: 'A' }] }, 'ciclo que no cierra'], [{ modo: 'procesos', gas: 'diatomico', P: '1', V: '1', T: '300', n: '', procesos: [{ tipo: 'isocora', dato: 'V', valor: '2' }] }, 'isocora con V'], [{ modo: 'procesos', gas: 'diatomico', P: '1', V: '1', T: '300', n: '', procesos: [] }, 'sin transformaciones']]) {
      let ok = false; try { Gases.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Gases: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Gases: ${Gases.ejemplos.length} ejemplos, PV = nRT, isoterma, adiabática, ciclos con rendimiento, teoría cinética y errores`);
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
      await page.close();
      if (consola.length) mal('Gases: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Gases: ${Gases.ejemplos.length} ejemplos, editor de tramos, cierre del ciclo y teoría cinética sin errores de consola`);
    }
  };
};
