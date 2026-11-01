/* Comprobación de laplace-numerica: cálculos en Node y la página en Chromium.
   node pruebas/comprobar.js --solo laplace-numerica ejecuta solo esta.
   Valores calculados a mano: un borde a V0 con el resto a 0 en una caja cuadrada
   da V0/4 en el centro (superposición de las cuatro caras) y, en (0,5; 0,75),
   54,0529 V por la serie de Fourier (comprobado con otro programa). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'laplace-numerica', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`LaplaceNumerica · ${q}: ${a} en vez de ${b}`); };
    const ej = (c) => C.ejemplos.find((e) => e.clave === c).sc, r = (c, extra = {}) => C.resolver({ ...ej(c), ...extra });
    // un borde a 100 V: centro = 25 V por simetría; (0,5; 0,75) = 54,0529 V con la serie
    const b = r('borde-caliente');
    cerca(b.centro.V, 25, 1e-4, 'centro con un borde a 100 V');
    cerca(b.exacto, 54.0529218, 1e-5, 'serie en (0,5; 0,75)');
    cerca(b.sonda.V, 54.0529, 0.05, 'malla en (0,5; 0,75)');
    if (!b.convergio) mal('LaplaceNumerica: el primer ejemplo no converge');
    // dos lados contiguos a 100 V: el centro es la mitad (50 V)
    cerca(r('dos-lados').centro.V, 50, 1e-4, 'centro con dos lados a 100 V');
    // placas opuestas ±50 V: el centro es 0 por simetría
    cerca(r('placas').centro.V, 0, 1e-4, 'centro entre placas opuestas');
    cerca(r('placas').exacto, 0, 1e-9, 'serie entre placas opuestas');
    // todos los bordes al mismo potencial: V constante (principio del máximo)
    const u = r('borde-caliente', { va: '30', vb: '30', vi: '30', vd: '30' });
    cerca(u.vmin, 30, 1e-4, 'mínimo con bordes iguales'); cerca(u.vmax, 30, 1e-4, 'máximo con bordes iguales');
    // conductor central a 100 V en una caja a tierra: simetría de cuarto de vuelta y máximo en el electrodo
    const cd = r('conductor');
    cerca(cd.vmax, 100, 1e-12, 'máximo en el electrodo'); cerca(cd.vmin, 0, 1e-12, 'mínimo en el borde');
    cerca(r('conductor', { px: '0,25', py: '0,5' }).sonda.V, r('conductor', { px: '0,5', py: '0,25' }).sonda.V, 1e-3, 'simetría del electrodo central');
    cerca(r('conductor', { px: '0,25', py: '0,5' }).sonda.V, r('conductor', { px: '0,75', py: '0,5' }).sonda.V, 1e-3, 'simetría izquierda-derecha');
    if (cd.exacto !== null) mal('LaplaceNumerica: con electrodo no hay solución exacta');
    // los tres métodos dan lo mismo y SOR es mucho más rápido que Gauss-Seidel, y este que Jacobi
    const [sj, sg, ss] = ['jacobi', 'gs', 'sor'].map((m) => r('borde-caliente', { metodo: m }));
    cerca(sj.sonda.V, ss.sonda.V, 1e-4, 'Jacobi igual que SOR'); cerca(sg.sonda.V, ss.sonda.V, 1e-4, 'Gauss-Seidel igual que SOR');
    if (!(ss.iter * 5 < sg.iter && sg.iter < sj.iter)) mal(`LaplaceNumerica: iteraciones SOR ${ss.iter}, Gauss-Seidel ${sg.iter}, Jacobi ${sj.iter}: no salen en orden`);
    // la malla fina se acerca más a la serie
    const fino = r('borde-caliente', { n: '80' });
    if (!(Math.abs(fino.sonda.V - fino.exacto) < Math.abs(b.sonda.V - b.exacto) / 2)) mal('LaplaceNumerica: la malla fina no mejora el error');
    // caja ancha: 2 × 1 con ±100 V a izquierda y derecha, el centro es 0
    const ca = r('caja-ancha'); if (ca.ny !== 20) mal(`LaplaceNumerica: celdas del alto ${ca.ny} en vez de 20`);
    cerca(ca.centro.V, 0, 1e-4, 'centro de la caja ancha');
    // errores
    for (const [x, q] of [[{ a: '' }, 'falta el ancho'], [{ b: '0' }, 'alto cero'], [{ n: '3' }, 'pocas celdas'], [{ va: '' }, 'falta un potencial'], [{ tol: '0' }, 'tolerancia cero'], [{ px: '2' }, 'sonda fuera'], [{ b: '5' }, 'caja demasiado alargada'], [{ elec: '1', ex: '0,9' }, 'electrodo fuera'], [{ elec: '1', ex: '0' }, 'electrodo pegado al borde'], [{ elec: '1', ew: '0,001' }, 'electrodo menor que una celda']]) {
      let ok = false; try { C.resolver({ ...ej('conductor'), ...x }); } catch (e) { ok = true; }
      if (!ok) mal(`LaplaceNumerica: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ LaplaceNumerica: serie, simetrías, tres métodos, malla fina y errores (${C.ejemplos.length} ejemplos)`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'laplace-numerica', 'index.html'));
    await page.waitForFunction(() => window.LaplaceNumericaApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('laplace-numerica').current) mal(`LaplaceNumerica: la página muestra la versión «${ver}», se esperaba ${Version.de('laplace-numerica').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => LaplaceNumericaApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, num: document.querySelectorAll('#resumen > div.num').length }));
      if (r.err || !r.pasos || !r.res) mal(`LaplaceNumerica · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`LaplaceNumerica · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.num !== 3) mal(`LaplaceNumerica · ${e.clave}: ${r.num} resultados para el modo práctica en vez de 3`);
    }
    // el mapa se pinta (no queda en blanco) y la sonda se mueve al pulsar
    await page.evaluate(() => LaplaceNumericaApp.abrirEjemplo('borde-caliente'));
    const pintado = await page.evaluate(() => { const c = document.querySelector('#grafica'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const vistos = new Set(); for (let i = 0; i < d.length; i += 4 * 97) vistos.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return vistos.size; });
    if (pintado < 20) mal(`LaplaceNumerica: el mapa de color solo tiene ${pintado} colores`);
    const caja = await page.locator('#grafica').boundingBox();
    await page.mouse.click(caja.x + caja.width / 2, caja.y + caja.height / 2);
    const px = await page.inputValue('#f-px'); const py = await page.inputValue('#f-py');
    if (px === '0,5' && py === '0,75') mal('LaplaceNumerica: pulsar en el mapa no mueve la sonda');
    const nx = +px.replace(',', '.'), ny = +py.replace(',', '.');
    if (!(nx > 0.2 && nx < 0.8 && ny > 0.2 && ny < 0.8)) mal(`LaplaceNumerica: la sonda tras pulsar en el centro del mapa está en (${px}; ${py})`);
    // electrodo: aparecen sus campos y la sonda se calcula
    await page.selectOption('#f-elec', '1');
    if (!(await page.locator('#f-ev').count())) mal('LaplaceNumerica: con electrodo no salen sus campos');
    if (await page.locator('#error').isVisible()) mal('LaplaceNumerica: error inesperado con electrodo: ' + await page.locator('#error').textContent());
    await page.check('#ver-e'); await page.uncheck('#ver-eq');
    // un dato mal escrito muestra el error
    await page.fill('#f-a', '0');
    if (await page.locator('#error').isHidden()) mal('LaplaceNumerica: un ancho cero no muestra el error');
    await page.close();
    if (consola.length) mal('LaplaceNumerica: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ LaplaceNumerica: ${C.ejemplos.length} ejemplos en la página con MathML, mapa pintado, sonda, electrodo y errores, sin errores de consola`);
  };
};
