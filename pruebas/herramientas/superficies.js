/* Comprobación de superficies: cálculos a mano en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo superficies ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'superficies', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Superficies · ${q}: ${a} en vez de ${b}`); };
    const igual = (a, b, q) => { if (a !== b) mal(`Superficies · ${q}: sale «${a}», se esperaba «${b}»`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    for (const e of C.ejemplos) { try { const x = C.resolver(e.sc); if (x.pasos.length < 4) mal(`Superficies · ${e.clave}: desarrollo corto`); } catch (err) { mal(`Superficies · ${e.clave}: ${err.message}`); } }
    // paraboloide x² + y² en (1, 2): f = 5, ∇f = (2, 4), |∇f| = √20, plano z = 2x + 4y − 5
    let p = r('paraboloide').punto;
    cerca(p.z0, 5, 1e-12, 'f(1, 2)'); cerca(p.gx, 2, 1e-12, 'fx'); cerca(p.gy, 4, 1e-12, 'fy'); cerca(p.g, Math.sqrt(20), 1e-12, '|∇f|');
    igual(p.tangente, 'z = 2 x + 4 y − 5', 'plano tangente del paraboloide'); igual(p.rectaNivel, '2 x + 4 y − 10 = 0', 'tangente a la curva de nivel');
    cerca(p.dir.Du, 22 / 5, 1e-12, 'derivada direccional (3, 4)/5'); cerca(p.aprox.zl, 4.8, 1e-12, 'aproximación lineal'); cerca(p.aprox.ze, 4.82, 1e-12, 'valor exacto en (1,1; 1,9)');
    cerca(p.normal[2], -1, 0, 'normal');
    let k = r('paraboloide').crit; if (k.length !== 1 || k[0].tipo !== 'mínimo' || k[0].x !== 0 || k[0].y !== 0) mal('Superficies: x² + y² no tiene un mínimo en el origen');
    // silla x² − y² en (1, 1): f = 0, ∇f = (2, −2); punto de silla en el origen
    p = r('silla').punto; cerca(p.z0, 0, 1e-12, 'f silla'); cerca(p.gx, 2, 1e-12, 'fx silla'); cerca(p.gy, -2, 1e-12, 'fy silla'); igual(p.tangente, 'z = 2 x − 2 y', 'plano tangente de la silla');
    k = r('silla').crit; if (k.length !== 1 || k[0].tipo !== 'punto de silla') mal('Superficies: x² − y² no tiene un punto de silla');
    // cono √(x² + y²) en (3, 4): f = 5, ∇f = (3/5, 4/5), |∇f| = 1, f(3,1; 3,9) ≈ 4,98
    p = r('cono').punto; cerca(p.z0, 5, 1e-12, 'f cono'); cerca(p.gx, 0.6, 1e-12, 'fx cono'); cerca(p.gy, 0.8, 1e-12, 'fy cono'); cerca(p.g, 1, 1e-12, '|∇f| cono');
    cerca(p.aprox.zl, 4.98, 1e-12, 'aproximación del cono'); cerca(p.aprox.ze, Math.sqrt(3.1 ** 2 + 3.9 ** 2), 1e-12, 'valor exacto del cono');
    if (r('cono').crit.length) mal('Superficies: el cono da un punto crítico en el vértice, donde no es derivable');
    // campana e^(−(x² + y²)) en (1, 0): f = 1/e, ∇f = (−2/e, 0); máximo en el origen; sin cambio hacia y
    p = r('campana').punto; cerca(p.z0, Math.exp(-1), 1e-12, 'f campana'); cerca(p.gx, -2 * Math.exp(-1), 1e-12, 'fx campana'); cerca(p.gy, 0, 1e-12, 'fy campana'); cerca(p.dir.Du, 0, 1e-12, 'derivada hacia y');
    k = r('campana').crit; if (k.length !== 1 || k[0].tipo !== 'máximo') mal('Superficies: la campana no tiene un máximo en el origen');
    // huevera sen x cos y en (1, 1)
    p = r('onda').punto; cerca(p.z0, Math.sin(1) * Math.cos(1), 1e-12, 'f onda'); cerca(p.gx, Math.cos(1) ** 2, 1e-12, 'fx onda'); cerca(p.gy, -(Math.sin(1) ** 2), 1e-12, 'fy onda');
    cerca(p.dir.Du, (Math.cos(1) ** 2 + Math.sin(1) ** 2) / Math.SQRT2, 1e-12, 'derivada direccional (1, −1)');
    // x³ − 3x + y²: mínimo en (1, 0) y silla en (−1, 0); en el punto (1, 0) el plano es horizontal
    k = r('cubica').crit; if (k.length !== 2 || k[0].tipo !== 'punto de silla' || k[0].x !== -1 || k[1].tipo !== 'mínimo' || k[1].x !== 1) mal('Superficies: x³ − 3x + y² no da la silla en −1 y el mínimo en 1');
    p = r('cubica').punto; if (!p.plano || p.tangente !== 'z = −2') mal('Superficies: en el mínimo el plano tangente no es z = −2');
    // silla del mono x³ − 3xy²: D = 0 en el origen
    k = r('mono').crit; if (k.length !== 1 || !/dudoso/.test(k[0].tipo)) mal('Superficies: la silla del mono no sale como dudosa');
    if (r('mono').punto) mal('Superficies: sin punto no debería haber gradiente');
    // plano 2x − y + 1
    p = r('plano').punto; igual(p.tangente, 'z = 2 x − y + 1', 'plano de un plano'); cerca(p.dir.Du, 2, 1e-12, 'derivada del plano'); if (r('plano').crit.length) mal('Superficies: un plano inclinado tiene puntos críticos');
    // las derivadas parciales de todos los ejemplos cumplen el cociente incremental
    for (const e of C.ejemplos) {
      const x = C.resolver(e.sc), h = 1e-5;
      for (const [a, b] of [[0.4, 0.7], [-0.9, 1.1], [1.3, -0.5]]) {
        cerca(C.resolver({ ...e.sc, x0: String(a), y0: String(b) }).punto.gx, (x.fv(a + h, b) - x.fv(a - h, b)) / (2 * h), 1e-5, `${e.clave}: fx en (${a}, ${b})`);
        cerca(C.resolver({ ...e.sc, x0: String(a), y0: String(b) }).punto.gy, (x.fv(a, b + h) - x.fv(a, b - h)) / (2 * h), 1e-5, `${e.clave}: fy en (${a}, ${b})`);
      }
    }
    // malla y curvas de nivel: x² + y² en [−3, 3]² va de 0 a 18 y la curva f = 5 es una circunferencia de radio √5
    const s = r('paraboloide'), m = C.malla(s, 81);
    cerca(m.zlo, 0, 1e-9, 'altura mínima de la malla'); cerca(m.zhi, 18, 1e-9, 'altura máxima de la malla');
    const seg = C.contorno(m, 5);
    if (seg.length < 60) mal(`Superficies: la curva de nivel f = 5 tiene solo ${seg.length} segmentos`);
    for (const [a, b, c, d] of seg) for (const [x, y] of [[a, b], [c, d]]) if (Math.abs(x * x + y * y - 5) > 0.02) mal(`Superficies: el punto (${x}, ${y}) de la curva f = 5 no cumple x² + y² = 5`);
    if (C.contorno(m, 20).length || C.contorno(m, -1).length) mal('Superficies: hay curvas de nivel fuera de la altura de la superficie');
    // una asíntota no rompe la malla ni la escala
    const as = C.resolver({ f: '1/(x^2 + y^2)', x0: '1', y0: '1' }), ma = C.malla(as, 31);
    if (!isFinite(ma.zlo) || !isFinite(ma.zhi) || ma.zhi > 1e4) mal('Superficies: 1/(x² + y²) da una escala descontrolada');
    // el punto fuera del rango amplía el dibujo
    const fuera = C.resolver({ f: 'x^2 + y^2', x0: '5', y0: '0', xmin: '-1', xmax: '1', ymin: '-1', ymax: '1' });
    if (fuera.rango.xmax < 5) mal('Superficies: el rango no se amplía para incluir el punto');
    for (const [sc, q] of [[{ f: '' }, 'sin f'], [{ f: 'x + z' }, 'otra letra'], [{ f: 'x^2 + y^2', x0: '1' }, 'falta y₀'], [{ f: 'ln(x) + y', x0: '-1', y0: '0' }, 'punto fuera del dominio'],
      [{ f: 'x*y', x0: '1', y0: '1', ux: '0', uy: '0' }, 'dirección (0, 0)'], [{ f: 'x*y', xmin: '2', xmax: '1' }, 'rango al revés'], [{ f: 'x*y', x0: 'x', y0: '1' }, 'punto con x']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Superficies: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Superficies: ${C.ejemplos.length} ejemplos a mano, derivadas contra cociente incremental, malla y curvas de nivel`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'matematicas', 'superficies', 'index.html'));
    await page.waitForFunction(() => window.SuperficiesApp);
    await require('./comun/exportar.js')(page, mal, 'superficies', { lienzo: '#niveles', datos: false });
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('superficies').current) mal(`Superficies: la página muestra la versión «${ver}», se esperaba ${Version.de('superficies').current}`);
    const pintado = (q) => page.evaluate((s) => document.querySelector(s).toDataURL().length, q);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => SuperficiesApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div').length, nums: document.querySelectorAll('#resumen > div.num').length }));
      if (r.err || r.pasos < 4 || !r.res) mal(`Superficies · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Superficies · ${e.clave}: el desarrollo no sale en MathML`);
      if (e.sc.x0 !== '' && r.nums < 4) mal(`Superficies · ${e.clave}: faltan los resultados numéricos (hay ${r.nums})`);
      for (const q of ['#superficie', '#niveles']) if ((await pintado(q)) < 6000) mal(`Superficies · ${e.clave}: el lienzo ${q} está casi vacío`);
    }
    // girar arrastrando cambia el dibujo; pulsar en el mapa mueve el punto
    await page.evaluate(() => SuperficiesApp.abrirEjemplo('paraboloide'));
    const antesImg = await page.evaluate(() => document.querySelector('#superficie').toDataURL());
    await page.locator('#superficie').scrollIntoViewIfNeeded();
    const caja = await page.locator('#superficie').boundingBox();
    await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2); await page.mouse.down(); await page.mouse.move(caja.x + caja.width / 2 + 90, caja.y + caja.height / 2 + 20, { steps: 5 }); await page.mouse.up();
    if (antesImg === await page.evaluate(() => document.querySelector('#superficie').toDataURL())) mal('Superficies: arrastrar no gira la superficie');
    await page.locator('#niveles').click({ position: { x: 200, y: 150 } });
    const x0 = await page.inputValue('#f-x0');
    if (x0 === '1') mal('Superficies: pulsar en el mapa no cambia el punto');
    await page.evaluate(() => SuperficiesApp.abrirEjemplo('paraboloide'));
    await page.uncheck('#ver-plano'); await page.check('#ver-plano');
    // un error de escritura se avisa y no deja basura
    await page.fill('#f-f', 'x + z');
    if (await page.locator('#error').isHidden()) mal('Superficies: una letra desconocida no muestra el error');
    await page.fill('#f-f', 'x^2 + y^2');
    if (await page.locator('#error').isVisible()) mal('Superficies: el error no se quita al corregir');
    // modo práctica: ejercicios al azar con sus resultados numéricos
    for (let i = 0; i < 12; i++) {
      const r = await page.evaluate(() => { SuperficiesApp.azar(); return { err: !document.querySelector('#error').hidden, nums: document.querySelectorAll('#resumen > div.num').length, enun: SuperficiesApp.enunciado() }; });
      if (r.err || r.nums < 4 || !r.enun) mal(`Superficies: el ejercicio al azar nº ${i + 1} no sale bien (${r.nums} resultados)`);
    }
    await page.close();
    if (consola.length) mal('Superficies: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Superficies: ${C.ejemplos.length} ejemplos en la página con MathML y dibujo, giro, mapa y práctica, sin errores de consola`);
  };
};
