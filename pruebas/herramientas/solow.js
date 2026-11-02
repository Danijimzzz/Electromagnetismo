/* Comprobación del modelo de Solow: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo solow). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Modelo de Solow';
  const C = require(path.join(fuente, 'solow', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano con α = 1/3, s = 0,2 y n + g + δ = 0,08: k* = 2,5^1,5 = 3,95285; y* = 2,5^0,5 = 1,58114; c* = 0,8·y* = 1,26491
    const b = ej('base');
    cerca(b.k, 2.5 ** 1.5, 1e-9, 'k* del ejemplo base'); cerca(b.y, Math.sqrt(2.5), 1e-9, 'y*'); cerca(b.c, 0.8 * Math.sqrt(2.5), 1e-9, 'c*');
    // regla de oro: k = (α/0,08)^1,5 = 8,50517; c = (1 − α)·y = (2/3)·√(1/(3·0,08)) = 1,36083
    cerca(b.ko, (1 / 3 / 0.08) ** 1.5, 1e-6, 'k de la regla de oro'); cerca(b.co, (2 / 3) * Math.sqrt(1 / 3 / 0.08), 1e-6, 'c de la regla de oro');
    cerca(b.lambda, (2 / 3) * 0.08, 1e-9, 'velocidad de convergencia'); cerca(b.semivida, Math.LN2 / ((2 / 3) * 0.08), 1e-9, 'semivida');
    // la primera iteración: k1 = 1 + 0,2·1 − 0,08·1 = 1,12
    cerca(b.fila[1].k, 1.12, 1e-12, 'primer año de la trayectoria'); cerca(b.fila[0].dk, 0.12, 1e-12, 'Δk del primer año');
    // con s = α el ahorro y la regla de oro coinciden, y en el estado estacionario Δk = 0
    const o = ej('oro'); cerca(o.k, o.ko, 1e-9, 'k* con s = α'); cerca(o.c, o.co, 1e-9, 'c* con s = α');
    cerca(o.s * o.prod(o.k) - o.x * o.k, 0, 1e-9, 'Δk en el estado estacionario');
    if (!ej('ahorra-mucho').sobre || ej('ahorra-mucho').c >= ej('ahorra-mucho').co) mal(`${N}: con s = 50 % debe haber ineficiencia dinámica`);
    if (!(ej('exceso').fila[5].k < ej('exceso').k0)) mal(`${N}: con k₀ > k* el capital debe bajar`);
    error({ ...C.ejemplos[0].sc, alfa: '1' }, 'α = 1'); error({ ...C.ejemplos[0].sc, s: '0' }, 'ahorro nulo');
    error({ ...C.ejemplos[0].sc, n: '-3', g: '-2', d: '0,5' }, 'n + g + δ ≤ 0'); error({ ...C.ejemplos[0].sc, T: '0' }, 'cero años');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, estado estacionario, regla de oro y convergencia calculados a mano, y errores`);
  }
  return Com.navegador({ publico, carpeta: 'solow', nombre: N, app: 'SolowApp', C, pagina, mal, malo: { k: 'alfa', v: '1,5' } });
};
