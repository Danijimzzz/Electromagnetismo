/* Comprobación de ondas-em: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo ondas-em ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const OeC = require(path.join(fuente, 'ondas-em', 'fisica.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Ondas EM · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => OeC.resolver(OeC.ejemplos.find((e) => e.clave === c).sc), c0 = 299792458;
    for (const x of OeC.ejemplos) { try { const s = OeC.resolver(x.sc); if (s.pasos.length < 2) mal(`Ondas EM · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Ondas EM · ${x.clave}: ${err.message}`); } }
    const fm = r('fm'); cerca(fm.F.lam, c0 / 1e8, 1e-9, 'λ de la FM'); cerca(fm.B0, 0.05 / c0, 1e-9, 'B₀ = E₀/c'); cerca(fm.I, 0.05 ** 2 / (2 * 376.730313), 1e-6, 'intensidad');
    if (fm.Bv.join() !== '0,1,0') mal('Ondas EM: con k̂ = +z y Ê = +x, B̂ no sale +y');
    const ex = r('expresion'); if (ex.Bv.join() !== '-1,0,0') mal('Ondas EM: con k̂ = −y y Ê = +z, B̂ no sale −x'); if (!ex.Eexp.includes('+')) mal('Ondas EM: hacia −y la fase no es ky + ωt');
    const ag = r('agua'); cerca(ag.M.n, Math.sqrt(1.77), 1e-12, 'índice del agua'); cerca(ag.F.lam, c0 / Math.sqrt(1.77) / 5e14, 1e-9, 'λ en el agua');
    if (!OeC.banda(5e14).includes('visible') || OeC.banda(1e8) !== 'ondas de radio' || OeC.banda(1e18) !== 'rayos X') mal('Ondas EM: la zona del espectro no cuadra');
    cerca(r('bombilla').I, 100 / (4 * Math.PI * 4), 1e-12, 'I de una fuente puntual'); cerca(r('sol').E0, Math.sqrt(2 * 376.730313 * 1361), 1e-6, 'E₀ del Sol');
    const cu = r('cobre'); cerca(cu.delta, 1 / Math.sqrt(Math.PI * 1e6 * 1.25663706212e-6 * 5.8e7), 1e-6, 'profundidad de penetración del cobre'); cerca(cu.th, Math.PI / 4, 1e-6, 'fase de η en un buen conductor');
    const ba = r('baquelita'); cerca(ba.alfa, (1e-6 / 2) * Math.sqrt(1.25663706212e-6 / (4.9 * 8.8541878128e-12)), 1e-3, 'α con pocas pérdidas');
    for (const [q, sc] of [['E paralelo a k', { modo: 'onda', dato: 'f', valor: '1e6', E0: '1', prop: '+z', pol: '-z' }], ['frecuencia negativa', { modo: 'onda', dato: 'f', valor: '-5', E0: '1', prop: '+z', pol: '+x' }], ['E₀ vacía', { modo: 'onda', dato: 'f', valor: '1e6', E0: '', prop: '+z', pol: '+x' }], ['σ que no es un número', { modo: 'perdidas', er: '1', sigma: 'abc', valor: '1e6' }]]) {
      let ok = false; try { OeC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Ondas EM: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Ondas EM planas: ${OeC.ejemplos.length} ejemplos, λ, k, B₀, dirección de B, fase, índice, espectro, intensidad, fuente puntual, profundidad de penetración y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'electromagnetismo', 'ondas-em', 'index.html'));
      await page.waitForFunction(() => window.OndasEMApp);
      const antes = fallos;
      const verO = (await page.locator('#ver').textContent()).trim();
      if (verO !== Version.de('ondas-em').current) mal(`Ondas EM: la página muestra la versión «${verO}», se esperaba ${Version.de('ondas-em').current}`);
      for (const e of OeC.ejemplos) {
        await page.evaluate((c) => OndasEMApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(60);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
        if (r.err || r.pasos < 2 || r.res < 1) mal(`Ondas EM · ${e.clave}: falta el resultado o el desarrollo`);
        if (r.modo !== e.sc.modo) mal(`Ondas EM · ${e.clave}: el modo no cuadra`);
      }
      await page.evaluate(() => OndasEMApp.abrirEjemplo('fm'));
      if (!(await page.locator('#res').textContent()).includes('2,998 m')) mal('Ondas EM: λ = 2,998 m no sale en la página');
      await page.fill('#f-valor', '200e6');
      if (!(await page.locator('#res').textContent()).includes('1,499 m')) mal('Ondas EM: con el doble de frecuencia λ no se reduce a la mitad');
      await page.selectOption('#f-pol', '+z');
      if ((await page.locator('#f-prop').inputValue()).slice(-1) === 'z' || !(await page.locator('#error').isHidden())) mal('Ondas EM: al poner E paralelo a k no se corrige la propagación o da error');
      await page.selectOption('#f-medio', 'medio');
      if ((await page.locator('#f-er').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Ondas EM: al elegir un material no sale εr o da error');
      await page.fill('#f-E0', 'abc');
      if (await page.locator('#error').isHidden()) mal('Ondas EM: una E₀ que no es un número no da error');
      await page.selectOption('#f-modo', 'perdidas');
      if (!(await page.locator('#res').textContent()).includes('buen conductor')) mal('Ondas EM: el cobre no sale buen conductor');
      await page.click('#play');
      if ((await page.locator('#play').textContent()).trim() !== '▶ Seguir') mal('Ondas EM: el botón de pausa no cambia');
      for (let i = 0; i < 12; i++) { await page.evaluate(() => OndasEMApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Ondas EM: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => OndasEMApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Ondas EM: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Ondas EM planas: ${OeC.ejemplos.length} ejemplos, cambio de frecuencia, E perpendicular a k, material, pérdidas, errores y ejercicios al azar sin errores de consola`);
    }
  };
};
