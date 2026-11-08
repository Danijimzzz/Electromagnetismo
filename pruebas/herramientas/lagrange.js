/* Comprobación de lagrange: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo lagrange ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'lagrange', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Lagrange · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    const s2 = Math.SQRT1_2;
    const cuenta = (c, n, q) => { const x = r(c); if (x.puntos.length !== n) mal(`Lagrange · ${q}: ${x.puntos.length} puntos en vez de ${n}`); return x; };
    // a mano: x + y en x²+y²=1 → ±(√2/2, √2/2), f = ±√2, λ = ±√2/2
    let x = cuenta('circulo', 2, 'círculo');
    cerca(x.max, Math.SQRT2, 1e-9, 'máx x + y'); cerca(x.min, -Math.SQRT2, 1e-9, 'mín x + y');
    cerca(x.puntos[1].p[0], s2, 1e-9, 'x del máximo'); cerca(x.puntos[1].lambda, s2, 1e-9, 'λ del máximo');
    if (x.puntos[1].tipo !== 'máximo' || x.puntos[0].tipo !== 'mínimo') mal('Lagrange · círculo: mal clasificado');
    // x² + y² con x + y = 2 → (1, 1), f = 2, λ = 2, mínimo
    x = cuenta('producto', 1, 'distancia a la recta'); cerca(x.puntos[0].valor, 2, 1e-9, 'valor mínimo'); cerca(x.puntos[0].lambda, 2, 1e-9, 'λ'); if (x.puntos[0].tipo !== 'mínimo') mal('Lagrange · distancia a la recta: no es mínimo');
    // área máxima del rectángulo con perímetro 20: 5 × 5
    x = cuenta('rectangulo', 1, 'rectángulo'); cerca(x.puntos[0].valor, 25, 1e-9, 'área'); if (x.puntos[0].tipo !== 'máximo') mal('Lagrange · rectángulo: no es máximo');
    // x y en x²/4 + y² = 1: extremos ±1
    x = cuenta('elipse', 4, 'elipse'); cerca(x.max, 1, 1e-9, 'máx x y'); cerca(x.min, -1, 1e-9, 'mín x y');
    // x + 2y + 3z en la esfera: ±√14
    x = cuenta('esfera', 2, 'esfera'); cerca(x.max, Math.sqrt(14), 1e-9, 'máx esfera'); cerca(x.min, -Math.sqrt(14), 1e-9, 'mín esfera');
    if (x.puntos[1].tipo !== 'máximo' || x.puntos[0].tipo !== 'mínimo') mal('Lagrange · esfera: mal clasificado');
    // x² + y² + z² con x + y + z = 1: (1/3, 1/3, 1/3), f = 1/3
    x = cuenta('plano', 1, 'plano'); cerca(x.puntos[0].valor, 1 / 3, 1e-9, 'distancia al plano');
    // x y² con x + y = 3: (1, 2) máximo (f = 4) y (3, 0) mínimo local
    x = cuenta('cubica', 2, 'x y²'); cerca(x.max, 4, 1e-9, 'máx x y²');
    // LA-1: f constante sobre la restricción (∇f ∥ ∇g en todas partes): se avisa, sin lista de «no decide»
    for (const [fx, g, c, v] of [['x^2+y^2', 'x^2+y^2', '1', 1], ['x+y', 'x+y', '1', 1], ['x^2+y^2+z^2', 'x^2+y^2+z^2', '4', 4], ['2x^2+2y^2+3', 'x^2+y^2', '1', 5]]) {
      const r = C.resolver({ f: fx, g, c });
      if (r.constante === null || Math.abs(r.constante - v) > 1e-9 || r.puntos.length || !r.pasos.some((q) => /constante/.test(q.t))) mal(`Lagrange · f = ${fx}, g = ${g}: debería ser constante = ${v} (${r.constante}, ${r.puntos.length} puntos)`);
    }
    if (C.ejemplos.some((e) => C.resolver(e.sc).constante !== null)) mal('Lagrange: un ejemplo normal sale como constante');
    // LA-2: puntos con ∇g = 0 en la restricción. f = x en y² = x³ (cúspide): mínimo en el origen, donde ∇g = 0
    {
      const r = C.resolver({ f: 'x', g: 'y^2 - x^3', c: '0' }), o = r.puntos.find((q) => q.singular);
      if (!o || Math.hypot(...o.p) > 1e-9 || o.tipo !== 'mínimo' || r.min !== 0) mal(`Lagrange · cúspide y² = x³: ${JSON.stringify(r.puntos.map((q) => [q.p, q.tipo, q.singular]))}`);
      if (!r.pasos.some((q) => /∇g = 0/.test(q.t))) mal('Lagrange · cúspide: falta el paso de los puntos con ∇g = 0');
      // f = x + y en x² + y² = 0 (solo el origen): punto aislado; f = y − x² con y² = x⁴... se prueba también un nodo: x y = 0 con f = x + y no tiene ∇g = 0 en c ≠ 0
      const r2 = C.resolver({ f: 'x + y', g: 'x^2 + y^2', c: '0' });
      if (!r2.puntos.some((q) => q.singular && q.tipo === 'aislado')) mal('Lagrange · x² + y² = 0 debería dar el origen como punto aislado');
      const r3 = C.resolver({ f: 'x', g: 'x^2 - y^2', c: '0' }), n = r3.puntos.find((q) => q.singular);
      if (!n || n.tipo !== 'sin extremo') mal(`Lagrange · nodo x² = y²: f = x no tiene extremo en el origen (${n && n.tipo})`);
    }
    for (const [sc, q] of [[{ f: '', g: 'x+y', c: '1' }, 'falta f'], [{ f: 'x', g: '', c: '1' }, 'falta g'], [{ f: 'x+y', g: '5', c: '1' }, 'g constante'], [{ f: 'x', g: 'x+y', c: 'abc' }, 'c no numérico']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Lagrange: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Lagrange: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'matematicas', 'lagrange', 'index.html'));
    await page.waitForFunction(() => window.LagrangeApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('lagrange').current) mal(`Lagrange: la página muestra la versión «${ver}», se esperaba ${Version.de('lagrange').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => LagrangeApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Lagrange · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Lagrange · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.fill('#f-g', '');
    if (await page.locator('#error').isHidden()) mal('Lagrange: una restricción vacía no muestra el error');
    await page.close();
    if (consola.length) mal('Lagrange: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Lagrange: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
