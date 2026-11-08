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
    // perturbación: sube el ahorro del 20 % al 30 % en el año 30 (α = 1/3, n + g + δ = 0,08)
    const p = ej('sube-ahorro'); cerca(p.k2, 3.75 ** 1.5, 1e-9, 'k₂* tras subir el ahorro'); cerca(p.c2, 0.7 * Math.sqrt(3.75), 1e-9, 'c₂* tras subir el ahorro');
    cerca(p.fila[30].k, p.kc, 0, 'el capital no salta en el cambio'); cerca(p.cAntes, 0.8 * p.A * p.kc ** p.alfa, 1e-12, 'consumo justo antes'); cerca(p.cAhora, 0.7 * p.A * p.kc ** p.alfa, 1e-12, 'consumo justo después');
    if (!(p.cAhora < p.cAntes && p.c2 > p.c)) mal(`${N}: subir el ahorro debe bajar el consumo hoy y subirlo después (s < regla de oro)`);
    cerca(p.fila[29].dk, 0.2 * p.prod(p.fila[29].k) - 0.08 * p.fila[29].k, 1e-12, 'Δk antes del cambio'); cerca(p.fila[30].dk, 0.3 * p.prod(p.fila[30].k) - 0.08 * p.fila[30].k, 1e-12, 'Δk desde el cambio');
    cerca(p.fila[31].k, p.fila[30].k + p.fila[30].dk, 1e-12, 'primer año con el ahorro nuevo');
    const tec = ej('sube-tecnologia'); cerca(tec.k2, (0.25 * 1.5 / 0.08) ** (1 / 0.7), 1e-9, 'k₂* tras subir A');
    cerca(ej('baja-poblacion').k2, (0.2 / 0.07) ** 1.5, 1e-9, 'k₂* tras frenar la población (n + g + δ = 0,07)');
    // sin perturbación el resultado no cambia
    cerca(ej('base').k, 2.5 ** 1.5, 1e-9, 'k* sin perturbación'); if (ej('base').P2) mal(`${N}: sin perturbación no debe haber fase nueva`);
    // casos límite: ahorro del 100 %, n + g + δ ≤ 0, α = 0 y 1, k₀ = 0, T = 0
    error({ ...C.ejemplos[0].sc, s: '100' }, 's = 100 %'); error({ ...C.ejemplos[0].sc, alfa: '0' }, 'α = 0'); error({ ...C.ejemplos[0].sc, k0: '0' }, 'k₀ = 0');
    error({ ...C.ejemplos[0].sc, cambio: 's', tc: '5', nuevo: '100' }, 'ahorro nuevo del 100 %'); error({ ...C.ejemplos[0].sc, cambio: 's', tc: '0', nuevo: '30' }, 'cambio en el año 0'); error({ ...C.ejemplos[0].sc, cambio: 's', tc: '999', nuevo: '30' }, 'cambio después de la simulación'); error({ ...C.ejemplos[0].sc, cambio: 'n', tc: '5', nuevo: '-20' }, 'cambio que deja n + g + δ ≤ 0'); error({ ...C.ejemplos[0].sc, cambio: 'A', tc: '5', nuevo: '' }, 'sin valor nuevo');
    cerca(C.resolver({ ...C.ejemplos[0].sc, d: '100', n: '0', g: '0' }).x, 1, 1e-12, 'depreciación del 100 % funciona');
    error({ ...C.ejemplos[0].sc, alfa: '1' }, 'α = 1'); error({ ...C.ejemplos[0].sc, s: '0' }, 'ahorro nulo');
    error({ ...C.ejemplos[0].sc, n: '-3', g: '-2', d: '0,5' }, 'n + g + δ ≤ 0'); error({ ...C.ejemplos[0].sc, T: '0' }, 'cero años');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, estado estacionario, regla de oro y convergencia calculados a mano, y errores`);
  }
  return Com.navegador({ publico, carpeta: 'solow', nombre: N, app: 'SolowApp', C, pagina, mal, malo: { k: 'alfa', v: '1,5' } });
};
