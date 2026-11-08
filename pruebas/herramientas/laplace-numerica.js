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
    // LA-1 Poisson: placas a tierra con ρ uniforme: V(x) = ρ x (a − x)/(2 ε0) y centro = ρ a²/(8 ε0)
    const p1 = r('poisson-1d'), E0 = C.EPS0;
    cerca(p1.centro.V, 1e-8 / (8 * E0), 1e-8 / (8 * E0) * 2e-3, 'Poisson 1D en el centro');
    cerca(p1.exacto, p1.sonda.V, Math.abs(p1.exacto) * 2e-3, 'Poisson 1D frente a la parábola');
    // caja a tierra con ρ: coincide con la serie doble y la carga ligada compensa a la libre (Σ Q = −q)
    const p2 = r('poisson-caja'); cerca(p2.sonda.V, p2.exacto, Math.abs(p2.exacto) * 5e-3, 'Poisson 2D frente a la serie');
    cerca(p2.qTotal, -p2.qDiscreta, Math.abs(p2.qDiscreta) * 1e-4, 'cargas inducidas = −carga libre');
    // LA-2/3 placas planas con bordes aislantes: C' = ε0 b/a, carga ±ε0 V b/a y energía ½ C' V²
    const pl = r('placas-planas');
    cerca(pl.capacidad.C, E0 * 0.5 / 1, E0 * 1e-3, 'capacidad de placas planas'); cerca(pl.capacidad.Cw, pl.capacidad.C, pl.capacidad.C * 1e-3, 'capacidad por la energía');
    cerca(pl.qTotal, 0, E0 * 1e-6, 'carga total nula entre placas'); cerca(pl.sonda.V, 100 * (1 - 0.25), 0.01, 'potencial lineal en x');
    // cilindro (electrodo circular) en caja cuadrada: C' ~ 2πε0/ln(R/r) con R equivalente del cuadrado; se pide solo orden de magnitud y simetría
    const ci = r('cilindro'); cerca(ci.capacidad.C, ci.capacidad.Cw, ci.capacidad.C * 0.02, 'capacidad del cilindro por carga y por energía');
    if (!(ci.capacidad.C > 2 * Math.PI * E0 / Math.log(0.6 / 0.2) && ci.capacidad.C < 2 * Math.PI * E0 / Math.log(0.5 / 0.2))) mal('LaplaceNumerica: capacidad del cilindro fuera de los límites de los radios 0,5 y 0,6 m');
    // dos electrodos: carga +/− y suma de cargas nula salvo bordes
    const de = r('dos-electrodos'); cerca(de.q[4] + de.q[5] + de.q[0] + de.q[1] + de.q[2] + de.q[3], 0, Math.abs(de.q[4]) * 1e-6, 'neutralidad con dos electrodos');
    // LA-4 comparar: mismas soluciones y orden de iteraciones
    const cm = C.comparar(ej('borde-caliente'), [16, 32]);
    const it = (m, n) => cm.find((q) => q.metodo === m && q.n === n).iter;
    if (!(it('sor', 32) < it('gs', 32) && it('gs', 32) < it('jacobi', 32))) mal('LaplaceNumerica: comparar no ordena SOR < Gauss-Seidel < Jacobi');
    if (!(it('gs', 32) / it('gs', 16) > 3)) mal('LaplaceNumerica: Gauss-Seidel no crece como N²');
    for (const q of cm) if (!(q.error < 1e-3)) mal(`LaplaceNumerica: error ${q.error} al comparar ${q.metodo} ${q.n}`);
    for (const [x, q] of [[{ ta: 'n', tb: 'n', ti: 'n', td: 'n', elec: '0' }, 'todo aislante sin electrodo'], [{ rho: '1e-8', rw: '2', rh: '0,2', rx: '0', ry: '0' }, 'región con carga fuera'], [{ e2: '1', e2t: 'circ', e2x: '0,5', e2y: '0,5', e2w: '0,1' }, 'electrodos solapados']]) {
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
    await page.locator('#grafica').scrollIntoViewIfNeeded();
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
    // bordes aislantes, Poisson y comparación en la página
    await page.evaluate(() => LaplaceNumericaApp.abrirEjemplo('placas-planas'));
    if (!/Capacidad por metro/.test(await page.locator('#resumen').textContent())) mal('LaplaceNumerica: placas planas sin capacidad en los resultados');
    await page.selectOption('#f-ta', 'v'); if (!(await page.locator('#f-va').count())) mal('LaplaceNumerica: al fijar el borde no sale su potencial');
    await page.fill('#f-rho', '1e-8'); if (!(await page.locator('#f-rw').count())) mal('LaplaceNumerica: con ρ no sale la región con carga');
    await page.evaluate(() => LaplaceNumericaApp.abrirEjemplo('poisson-caja'));
    await page.fill('#f-n', '16'); await page.click('#comparar');
    const nf = await page.locator('#comp-cuerpo tr').count(); if (nf < 6 || await page.locator('#comp-tabla').isHidden()) mal(`LaplaceNumerica: la comparación da ${nf} filas`);
    if (!(await page.locator('#exportar-png, [data-exportar], .exportar').count())) mal('LaplaceNumerica: falta el botón de exportar la gráfica');
    await page.evaluate(() => LaplaceNumericaApp.abrirEjemplo('dos-electrodos'));
    if (await page.locator('#error').isVisible()) mal('LaplaceNumerica: error con electrodos rectangular y circular');
    await page.close();
    if (consola.length) mal('LaplaceNumerica: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ LaplaceNumerica: ${C.ejemplos.length} ejemplos en la página con MathML, mapa pintado, sonda, electrodo y errores, sin errores de consola`);
  };
};
