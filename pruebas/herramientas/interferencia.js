/* Comprobación de interferencia: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo interferencia ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const IfC = require(path.join(fuente, 'interferencia', 'fisica.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Interferencia · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => IfC.resolver(IfC.ejemplos.find((e) => e.clave === c).sc);
    for (const x of IfC.ejemplos) { try { const s = IfC.resolver(x.sc); if (s.pasos.length < 2) mal(`Interferencia · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Interferencia · ${x.clave}: ${err.message}`); } }
    const y = r('young'); cerca(y.dy, 633e-9 * 1.5 / 0.25e-3, 1e-12, 'interfranja'); cerca(y.ym, 1.5 * Math.tan(Math.asin(3 * 633e-9 / 0.25e-3)), 1e-12, 'posición del tercer máximo');
    if (r('young-y').Iy > 1e-6) mal('Interferencia: a media interfranja no sale una franja oscura');
    const ya = r('young-a'); if (!ya.pasos.at(-1).html.includes('±3') || !ya.pasos.at(-1).html.includes('5 franjas')) mal('Interferencia: con d = 3a no faltan los órdenes ±3 o no salen 5 franjas centrales');
    cerca(r('young-agua').dy, (589e-9 / 1.33) / 0.2e-3, 1e-12, 'interfranja en el agua');
    const re = r('rendija'); cerca(re.ym, 1.2 * Math.tan(Math.asin(500e-9 / 0.05e-3)), 1e-12, 'primer mínimo de la rendija'); cerca(re.ancho, 2 * re.ym, 1e-12, 'anchura del máximo central');
    const rd = r('red'); if (rd.mmax !== 3) mal('Interferencia: la red de 600 líneas/mm con 500 nm no llega al orden 3'); cerca(rd.ords[0].th, Math.asin(0.3), 1e-12, 'ángulo del primer orden');
    if (r('sodio').pasos.at(-1).html.indexOf('se resuelven') < 0 || r('sodio').pasos.at(-1).html.includes('no se resuelven')) mal('Interferencia: el doblete del sodio con 1500 líneas no se resuelve');
    const po = r('pompa'); if (po.refuerzan.map(Math.round).join() !== '709,426' || po.anulan.map(Math.round).join() !== '532') mal(`Interferencia: los colores de la pompa no cuadran: ${po.refuerzan} / ${po.anulan}`);
    const ar = r('antirreflejo'); if (ar.medio) mal('Interferencia: en el antirreflectante sale un desfase extra'); cerca(ar.tmin2, 550 / (4 * 1.38), 1e-12, 'espesor antirreflectante');
    if (Math.abs(r('aceite').refuerzan[0] - 580) > 1e-9) mal('Interferencia: la mancha de aceite no refuerza 580 nm');
    for (const [q, sc] of [['un orden que no existe', { modo: 'young', lambda: '600', d: '0,001', L: '1', m: '5' }], ['a mayor que d', { modo: 'young', lambda: '600', d: '0,1', L: '1', a: '0,2' }], ['una red sin primer orden', { modo: 'red', lambda: '700', N: '2000' }], ['lámina sin t ni λ', { modo: 'lamina', nl: '1,3' }], ['λ que no es un número', { modo: 'rendija', lambda: 'x', a: '0,1', L: '1' }]]) {
      let ok = false; try { IfC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Interferencia: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Interferencia y difracción: ${IfC.ejemplos.length} ejemplos, interfranja, máximos, intensidad, órdenes que faltan, rendija, red, resolución, láminas y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'interferencia', 'index.html'));
      await page.waitForFunction(() => window.InterferenciaApp);
      const antes = fallos;
      const verF = (await page.locator('#ver').textContent()).trim();
      if (verF !== Version.de('interferencia').current) mal(`Interferencia: la página muestra la versión «${verF}», se esperaba ${Version.de('interferencia').current}`);
      for (const e of IfC.ejemplos) {
        await page.evaluate((c) => InterferenciaApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(60);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
        if (r.err || r.pasos < 2 || r.res < 1) mal(`Interferencia · ${e.clave}: falta el resultado o el desarrollo`);
        if (r.modo !== e.sc.modo) mal(`Interferencia · ${e.clave}: el modo no cuadra`);
      }
      await page.evaluate(() => InterferenciaApp.abrirEjemplo('young'));
      if (!(await page.locator('#res').textContent()).includes('3,798 mm')) mal('Interferencia: la interfranja de 3,798 mm no sale en la página');
      await page.fill('#f-d', '0,5');
      if (!(await page.locator('#res').textContent()).includes('1,899 mm')) mal('Interferencia: con el doble de d la interfranja no baja a la mitad');
      await page.fill('#f-m', '9999');
      if (await page.locator('#error').isHidden()) mal('Interferencia: un orden que no existe no da error');
      await page.selectOption('#f-modo', 'lamina');
      if ((await page.locator('#f-nl').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Interferencia: al pasar a lámina delgada no sale n o da error');
      await page.click('#play');
      if ((await page.locator('#play').textContent()).trim() !== '▶ Seguir') mal('Interferencia: el botón de pausa no cambia');
      for (let i = 0; i < 12; i++) { await page.evaluate(() => InterferenciaApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Interferencia: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => InterferenciaApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Interferencia: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Interferencia y difracción: ${IfC.ejemplos.length} ejemplos, interfranja, cambio de d, orden imposible, lámina y ejercicios al azar sin errores de consola`);
    }
  };
};
