/* Comprobación de Curva de Lorenz e índice de Gini: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo lorenz-gini). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Lorenz y Gini';
  const C = require(path.join(fuente, 'lorenz-gini', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: 10 20 30 40 100 → G = 2Σ i·x_i/(nΣx) − (n+1)/n = 2·800/1000 − 1,2 = 0,4; Σ(p − q)/Σp = 1/2 = 0,5; S80/S20 = 0,5/0,05 = 10
    const c = ej('cinco'); cerca(c.G, 0.4, 1e-12, 'Gini de cinco'); cerca(c.Gc, 0.5, 1e-12, 'fórmula de clase'); cerca(c.ratio, 10, 1e-9, 'S80/S20');
    cerca(ej('igualdad').G, 0, 1e-12, 'igualdad');
    // quintiles: Σ 0,2·(q_i + q_{i−1}) = 0,2·(0,07 + 0,27 + 0,57 + 1,0 + 1,6) = 0,696 → 0,304; S80/S20 = 40/7
    const q = ej('quintiles'); cerca(q.G, 0.304, 1e-12, 'Gini de los quintiles'); cerca(q.ratio, 40 / 7, 1e-9, 'S80/S20 de los quintiles');
    // tramos: p = 0,4 0,7 0,9 1 y q = 0,16 0,4 0,68 1 → 1 − 0,616 = 0,384; (0,24 + 0,3 + 0,22)/2 = 0,38
    const t = ej('tramos'); cerca(t.G, 0.384, 1e-12, 'Gini de los tramos'); cerca(t.Gc, 0.38, 1e-12, 'fórmula de clase de los tramos');
    // desordenado: Gini con la fórmula de las parejas Σ|x_i − x_j|/(2n²μ)
    const x = [1500, 900, 2100, 1200, 3500, 800, 1800, 6000, 1100, 1400], mu = x.reduce((s, v) => s + v, 0) / x.length;
    cerca(ej('desordenado').G, x.reduce((s, a) => s + x.reduce((u, b) => u + Math.abs(a - b), 0), 0) / (2 * x.length ** 2 * mu), 1e-12, 'Gini por parejas');
    // comparar a mano: quintiles A (7, 13, 17, 23, 40 → G = 0,304) y B (9, 14, 18, 22, 37 → G = 0,256): B es más igualitaria en todos los tramos
    const cm = ej('comparar'); cerca(cm.G, 0.304, 1e-12, 'Gini de A'); cerca(cm.cmp.G, 0.256, 1e-12, 'Gini de B'); if (cm.cmp.cruce || cm.cmp.masIgual !== 2) mal('comparar: B debería ser más igualitaria sin cruce');
    // 10 20 30 40 100 (G = 0,4) frente a 5 40 40 40 75 (G = 0,28): las curvas se cruzan en el primer quintil
    const cr = ej('cruce'); cerca(cr.G, 0.4, 1e-12, 'Gini A del cruce'); cerca(cr.cmp.G, 0.28, 1e-12, 'Gini B del cruce'); if (!cr.cmp.cruce) mal('cruce: las curvas deberían cruzarse');
    if (ej('cinco').cmp !== null) mal('sin segunda distribución no debería haber comparación');
    error({ modo: 'rentas', datos: '10 20 30', datos2: '5' }, 'segunda distribución con una sola renta');
    error({ modo: 'rentas', datos: '5' }, 'una sola renta'); error({ modo: 'rentas', datos: '0 0 0' }, 'renta total 0'); error({ modo: 'grupos', datos: '20 7\n0 13' }, 'grupo sin población');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, Gini por el área, por parejas y de clase, S80/S20 y errores`);
  }
  return Com.navegador({ publico, carpeta: 'lorenz-gini', nombre: N, app: 'LorenzGiniApp', C, pagina, mal, malo: { k: 'datos', v: '5' } });
};
