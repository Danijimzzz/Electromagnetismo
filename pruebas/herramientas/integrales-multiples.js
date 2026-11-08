/* Comprobación de integrales-multiples: cálculos en Node (valores hechos a mano) y la página en Chromium.
   node pruebas/comprobar.js --solo integrales-multiples ejecuta solo esta. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'integrales-multiples', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`IntegralesMultiples · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano (integral, área o volumen, y si el desarrollo sale entero a mano)
    const T = [
      ['rectangulo', 3, 2, true], ['parabola', 1 / 24, 1 / 6, true], ['cambio-orden', (Math.E - 1) / 2, 0.5, true],
      ['disco', 8 * Math.PI, 4 * Math.PI, true], ['corona', 14 / 3, 1.5 * Math.PI, true], ['gauss', Math.PI * (1 - 1 / Math.E), Math.PI, true], ['cardioide', 1.5 * Math.PI, 1.5 * Math.PI, true],
      ['caja', 1 / 8, 1, true], ['tetraedro', 1 / 24, 1 / 6, true],
      ['cilindro', Math.PI, 2 * Math.PI, true], ['cono', Math.PI / 3, Math.PI / 3, true],
      ['esfera', (4 * Math.PI) / 5, (4 * Math.PI) / 3, true], ['hemisferio', Math.PI / 4, (2 * Math.PI) / 3, true],
    ];
    for (const [c, I, med, completo] of T) {
      const s = r(c);
      cerca(s.I, I, 1e-8, `${c}: integral`); cerca(s.medida, med, 1e-8, `${c}: área o volumen`);
      if (s.completo !== completo) mal(`IntegralesMultiples · ${c}: el desarrollo ${s.completo ? 'sale' : 'no sale'} entero a mano`);
    }
    if (r('disco').exacto !== '8 π') mal(`IntegralesMultiples · el disco no sale exacto: ${r('disco').exacto}`);
    if (r('esfera').exacto !== '{4 π}/{5}') mal(`IntegralesMultiples · la esfera no sale exacta: ${r('esfera').exacto}`);
    // el mismo dominio con los dos órdenes da lo mismo (triángulo 0 ≤ x ≤ 1, x² ≤ y ≤ x → 0 ≤ y ≤ 1, y ≤ x ≤ √y)
    cerca(C.resolver({ modo: 'cart2', orden: 'xy', f: 'x y', a: '0', b: '1', g1: 'y', g2: 'sqrt(y)' }).I, 1 / 24, 1e-8, 'cambio de orden del triángulo curvo');
    // círculo desplazado r = 2 cos θ: el área es π; ∬ x = π; ∬ x² = 5π/4 (sale numérico, con cos⁶)
    const cir = (f) => C.resolver({ modo: 'polar', f, a: '-π/2', b: 'π/2', g1: '0', g2: '2cos t' });
    cerca(cir('1').I, Math.PI, 1e-8, 'círculo r = 2cos θ: área'); cerca(cir('x').I, Math.PI, 1e-8, 'círculo r = 2cos θ: ∬ x'); cerca(cir('x^2').I, (5 * Math.PI) / 4, 1e-8, 'círculo r = 2cos θ: ∬ x²');
    // lo mismo que en cartesianas: el disco de radio 1 con f = x² + y²: π/2
    cerca(C.resolver({ modo: 'polar', f: 'x^2 + y^2', a: '0', b: '2π', g1: '0', g2: '1' }).I, Math.PI / 2, 1e-8, 'disco unidad');
    // triple en esféricas con cono φ ≤ π/4: 2π(1 − √2/2)/3
    cerca(C.resolver({ modo: 'esf', f: '1', a: '0', b: '2π', g1: '0', g2: 'π/4', h1: '0', h2: '1' }).I, (2 * Math.PI * (1 - Math.SQRT1_2)) / 3, 1e-8, 'cono esférico');
    // esfera de radio 2 en cartesianas con límites que dependen: volumen 32π/3
    cerca(C.resolver({ modo: 'cart3', f: '1', a: '-2', b: '2', g1: '-sqrt(4-x^2)', g2: 'sqrt(4-x^2)', h1: '-sqrt(4-x^2-y^2)', h2: 'sqrt(4-x^2-y^2)' }).I, (32 * Math.PI) / 3, 1e-6, 'bola en cartesianas');
    for (const [sc, q] of [
      [{ modo: 'cart2', orden: 'yx', f: '', a: '0', b: '1', g1: '0', g2: '1' }, 'falta el integrando'],
      [{ modo: 'cart2', orden: 'yx', f: 'x', a: '0', b: '1', g1: 'x', g2: '0' }, 'límites al revés'],
      [{ modo: 'cart2', orden: 'yx', f: 'x', a: '0', b: '1', g1: '0', g2: 'y' }, 'el límite de y usa y'],
      [{ modo: 'cart2', orden: 'yx', f: 'x + z', a: '0', b: '1', g1: '0', g2: '1' }, 'z en una doble'],
      [{ modo: 'cart2', orden: 'yx', f: '1/x', a: '0', b: '1', g1: '0', g2: '1' }, 'integral impropia'],
      [{ modo: 'polar', f: '1', a: '0', b: '2π', g1: '0', g2: '2cos t' }, 'r negativo en θ entre π/2 y 3π/2'],
      [{ modo: 'cart3', f: '1', a: '0', b: '1', g1: '0', g2: '1', h1: '0', h2: 'ln(x - 2)' }, 'z no definida'],
      [{ modo: 'nada' }, 'sin modo'],
    ]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`IntegralesMultiples: ${q} no da error`);
    }
    // la malla de la gráfica
    const m2 = r('cardioide').malla(20), m3 = r('esfera').malla(6);
    if (m2.length !== 21 || !m2.every((q) => q.lo.every(isFinite) && q.hi.every(isFinite))) mal('IntegralesMultiples: malla plana mal formada');
    if (m3.length !== 7 || !m3[3].every((q) => q.hi.every(isFinite)) || Math.abs(Math.hypot(...m3[2][3].hi) - 1) > 1e-9) mal('IntegralesMultiples: la malla de la esfera unidad no está sobre ρ = 1');
    if (fallos === antes) console.log(`  ✓ IntegralesMultiples: ${C.ejemplos.length} ejemplos a mano, cambio de orden, polares desplazadas, esféricas, errores y mallas`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'matematicas', 'integrales-multiples', 'index.html'));
    await page.waitForFunction(() => window.IntegralesMultiplesApp);
    await require('./comun/exportar.js')(page, mal, 'integrales-multiples', { lienzo: '#grafica', datos: false });
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('integrales-multiples').current) mal(`IntegralesMultiples: la página muestra la versión «${ver}», se esperaba ${Version.de('integrales-multiples').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => IntegralesMultiplesApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div.num').length, I: IntegralesMultiplesApp.resultado().I }));
      if (r.err || !r.pasos || r.res < 3) mal(`IntegralesMultiples · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`IntegralesMultiples · ${e.clave}: el desarrollo no sale en MathML`);
      if (Math.abs(r.I - C.resolver(e.sc).I) > 1e-9) mal(`IntegralesMultiples · ${e.clave}: la página y el cálculo no coinciden`);
      // la gráfica tiene algo dibujado
      const pintado = await page.evaluate(() => document.querySelector('#grafica').toDataURL().length);
      if (pintado < 6000) mal(`IntegralesMultiples · ${e.clave}: la gráfica está vacía`);
    }
    // cambiar de tipo desde el desplegable, escribir un dato, un error y volver
    await page.selectOption('#f-modo', 'esf');
    if (!(await page.locator('#f-h2').count())) mal('IntegralesMultiples: en esféricas faltan los límites de ρ');
    await page.fill('#f-h2', '2');
    await page.fill('#f-f', '1');
    const vol = await page.evaluate(() => IntegralesMultiplesApp.resultado().I);
    if (Math.abs(vol - (32 * Math.PI) / 3) > 1e-8) mal(`IntegralesMultiples: el volumen de la bola de radio 2 sale ${vol}`);
    await page.fill('#f-g2', '');
    if (await page.locator('#error').isHidden()) mal('IntegralesMultiples: un límite vacío no muestra el error');
    await page.selectOption('#f-modo', 'cart2');
    await page.selectOption('#f-orden', 'xy');
    if (!(await page.locator('#error').isHidden())) mal('IntegralesMultiples: cambiar el orden da error');
    // el estado se guarda y se recupera al recargar
    await page.fill('#f-f', 'x + y');
    await page.reload(); await page.waitForFunction(() => window.IntegralesMultiplesApp);
    if ((await page.inputValue('#f-f')) !== 'x + y' || (await page.inputValue('#f-orden')) !== 'xy') mal('IntegralesMultiples: no recuerda los datos al recargar');
    for (let i = 0; i < 80; i++) {
      await page.evaluate(() => IntegralesMultiplesApp.azar());
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, enun: IntegralesMultiplesApp.enunciado().length }));
      if (r.err || r.enun < 20) mal(`IntegralesMultiples: un ejercicio al azar da error o no tiene enunciado: ${JSON.stringify(await page.evaluate(() => IntegralesMultiplesApp.estado()))}`);
    }
    // girar el sólido arrastrando no rompe nada
    await page.evaluate(() => IntegralesMultiplesApp.abrirEjemplo('cono'));
    const caja = await page.locator('#grafica').boundingBox();
    await page.mouse.move(caja.x + 100, caja.y + 100); await page.mouse.down(); await page.mouse.move(caja.x + 180, caja.y + 130, { steps: 4 }); await page.mouse.up();
    await page.close();
    if (consola.length) mal('IntegralesMultiples: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ IntegralesMultiples: ${C.ejemplos.length} ejemplos en la página con MathML y gráfica, cambio de tipo, errores, estado guardado y ejercicios al azar, sin errores de consola`);
  };
};
