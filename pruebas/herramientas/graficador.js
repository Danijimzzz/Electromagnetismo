/* Comprobación del Graficador de funciones: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo graficador). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Graficador';
  const C = require(path.join(fuente, 'graficador', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // (x² + 1)/(x − 1): asíntotas x = 1 e y = x + 1; f′ = (x² − 2x − 1)/(x − 1)² ⇒ x = 1 ∓ √2, y = 2 ∓ 2√2
    const r = ej('racional');
    if (r.est.asV.join() !== '1' || r.est.asO.length !== 2 || r.est.asO[0].m !== 1 || r.est.asO[0].n !== 1) mal(`${N}: asíntotas de la racional ${JSON.stringify([r.est.asV, r.est.asO])}`);
    cerca(r.est.extremos[0].x, 1 - Math.SQRT2, 1e-6, 'máximo de la racional'); cerca(r.est.extremos[0].y, 2 - 2 * Math.SQRT2, 1e-6, 'valor del máximo');
    cerca(r.est.extremos[1].x, 1 + Math.SQRT2, 1e-6, 'mínimo de la racional');
    // x² − 4 = 2x − 1 ⇒ x² − 2x − 3 = 0 ⇒ x = −1 (y = −3) y x = 3 (y = 5)
    const p = ej('parabola-recta');
    if (p.cortes.length !== 2) mal(`${N}: parábola y recta dan ${p.cortes.length} cortes`);
    else { cerca(p.cortes[0].x, -1, 1e-9, 'primer corte'); cerca(p.cortes[0].y, -3, 1e-9, 'y del primer corte'); cerca(p.cortes[1].x, 3, 1e-9, 'segundo corte'); }
    // sen x = cos x en π/4 + kπ: −3π/4, π/4 y 5π/4 en [−π, 2π]
    const t = ej('trig'), sc = t.cortes.filter((q) => q.a === 'f' && q.b === 'g').map((q) => q.x);
    if (sc.length !== 3) mal(`${N}: sen x y cos x se cortan ${sc.length} veces en [−π, 2π]`); else cerca(sc[1], Math.PI / 4, 1e-9, 'sen x = cos x');
    // eˣ, ln x y x no se cortan
    if (ej('exp-ln').cortes.length) mal(`${N}: eˣ, ln x y x no deberían cortarse`);
    // ventana fija con pi; automática para la cúbica: incluye ±18 (f(±3)) recortado al percentil
    cerca(t.x[0], -Math.PI, 1e-12, 'x mínimo −pi'); cerca(t.x[1], 2 * Math.PI, 1e-12, 'x máximo 2pi');
    const c = ej('cubica'); if (!(c.y[0] < -10 && c.y[1] > 10)) mal(`${N}: la altura automática de la cúbica es ${c.y}`);
    // GR-1: |x| baja hasta 0 y sube después, con un mínimo sin derivada en (0, 0) y sin curvatura de ruido; |x² − 1| tiene mínimos en ±1 y máximo en (0, 1)
    {
      const eA = C.resolver({ f: 'abs(x)', xmin: '-3', xmax: '3' }).est;
      if (eA.crece.join() !== '(0, ∞)' || eA.decrece.join() !== '(−∞, 0)') mal(`${N}: |x| crece en ${eA.crece} y decrece en ${eA.decrece}`);
      if (eA.extremos.length !== 1 || eA.extremos[0].tipo !== 'mínimo' || eA.extremos[0].x !== 0 || eA.extremos[0].y !== 0) mal(`${N}: |x| debería tener un mínimo en (0, 0): ${JSON.stringify(eA.extremos)}`);
      if (eA.convexa.length || eA.concava.length || eA.infl.length) mal(`${N}: |x| no es convexa ni cóncava en ningún tramo: ${eA.convexa.length}/${eA.concava.length}`);
      if (!C.resolver({ f: 'abs(x)', xmin: '-3', xmax: '3' }).pasos.some((q) => /no es derivable en/.test(q.html))) mal(`${N}: |x| debería avisar de que no es derivable en 0`);
      const eB = C.resolver({ f: 'abs(x^2-1)', xmin: '-3', xmax: '3' }).est;
      if (eB.extremos.map((q) => q.tipo.slice(0, 3) + q.x + ',' + q.y).join(' ') !== 'mín-1,0 máx0,1 mín1,0') mal(`${N}: extremos de |x²−1|: ${eB.extremos.map((q) => q.tipo.slice(0, 3) + q.x + ',' + q.y).join(' ')}`);
      const eC = C.resolver({ f: 'x*abs(x)', xmin: '-3', xmax: '3' }).est;
      if (eC.crece.join() !== '(−∞, ∞)' || eC.extremos.length || eC.infl.length !== 1) mal(`${N}: x|x| crece siempre y tiene una inflexión en 0`);
      const eD = C.resolver({ f: 'x^3', xmin: '-3', xmax: '3' }).est;
      if (eD.crece.join() !== '(−∞, ∞)') mal(`${N}: x³ crece en ${eD.crece}`);
    }
    error({ f: '', g: 'x', xmin: '', xmax: '' }, 'sin f');
    error({ f: 'x', xmin: '3', xmax: '1' }, 'x máximo menor');
    error({ f: 'x', xmin: '', xmax: '', ymin: '1', ymax: '' }, 'solo un límite de y');
    error({ f: 'x +* 2' }, 'una expresión mal escrita');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, asíntotas, extremos, cortes entre curvas, ventana y errores`);
  }
  return Com.navegador({ publico, asignatura: 'matematicas', carpeta: 'graficador', nombre: N, app: 'GraficadorApp', C, pagina, mal, exportar: { lienzo: '#grafica', datos: true }, malo: { k: 'f', v: 'x +* 2' },
    // la rueda acerca la gráfica y cambia la ventana
    extra: async (page, m) => {
      await page.evaluate(() => GraficadorApp.abrirEjemplo('cubica'));
      await page.locator('#grafica').scrollIntoViewIfNeeded();
      const b = await page.locator('#grafica').boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.wheel(0, -200);
      const x = await page.evaluate(() => GraficadorApp.resultado().x);
      if (!(x[1] - x[0] < 6)) m(`${N}: la rueda no acerca la gráfica (x de ${x[0]} a ${x[1]})`);
      await page.click('button[data-z="ini"]');
      const y = await page.evaluate(() => GraficadorApp.resultado().x);
      if (y[0] !== -10 || y[1] !== 10) m(`${N}: «Ventana inicial» deja x de ${y[0]} a ${y[1]}`);
    } });
};
