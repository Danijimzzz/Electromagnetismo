/* Comprobación de Métodos numéricos: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo metodos-numericos). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Métodos numéricos';
  const C = require(path.join(fuente, 'metodos-numericos', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // raíz de x³ − 2x − 5 = 2,0945514815… (Wallis). Bisección en [2, 3] con tolerancia 10⁻⁴: 1/2ⁿ < 10⁻⁴ pide n = 14
    const b = ej('biseccion'); cerca(b.filas.length, 14, 0, 'iteraciones de la bisección'); cerca(b.x, 2.0945514815, 1e-4, 'raíz por bisección'); cerca(b.filas[0].c, 2.5, 0, 'primer punto medio');
    // Newton desde 2: x₁ = 2 − (−1)/10 = 2,1; x₂ = 2,1 − 0,061/11,23 = 2,0945681
    const n = ej('newton'); cerca(n.filas[0].x1, 2.1, 1e-12, 'x₁ de Newton'); cerca(n.filas[1].x1, 2.1 - 0.061 / 11.23, 1e-9, 'x₂ de Newton'); cerca(n.x, 2.0945514815423265, 1e-12, 'raíz por Newton');
    cerca(ej('coseno').x, 0.7390851332151607, 1e-12, 'cos x = x');
    // secante con 1 y 2: x₂ = 2 − 2 · 1/(2 − (−1)) = 4/3
    const s = ej('raiz2'); cerca(s.filas[0].x1, 4 / 3, 1e-12, 'x₂ de la secante'); cerca(s.x, Math.SQRT2, 1e-12, '√2');
    const p = ej('puntofijo'); cerca(p.x, 0.739085, 1e-5, 'punto fijo de cos x'); cerca(p.dg, -Math.sin(0.739085), 1e-5, "g′ en el punto fijo");
    // ∫₀¹ e^(−x²) dx = 0,746824133; con n = 10, trapecios 0,746210796 y Simpson 0,746824948
    const g = ej('gauss'); cerca(g.T, 0.7462107961, 1e-9, 'trapecios'); cerca(g.S, 0.7468249483, 1e-9, 'Simpson'); cerca(g.ref, 0.7468241328, 1e-9, 'referencia');
    // ∫₀^π sen x dx con n = 4: T = π/4 (1 + √2) = 1,896119; S = π/12 (2 + 4√2) = 2,004560
    const se = ej('seno'); cerca(se.T, (Math.PI / 4) * (1 + Math.SQRT2), 1e-12, 'trapecios del seno'); cerca(se.S, (Math.PI / 12) * (2 + 4 * Math.SQRT2), 1e-12, 'Simpson del seno');
    // y′ = y con h = 0,1 hasta 1: Euler 1,1¹⁰, Heun 1,105¹⁰, RK4 (1 + h + h²/2 + h³/6 + h⁴/24)¹⁰
    const e = ej('exponencial'); cerca(e.y, 1.1 ** 10, 1e-12, 'Euler'); cerca(e.ys.heun[10], 1.105 ** 10, 1e-12, 'Heun'); cerca(e.ys.rk4[10], (1 + 0.1 + 0.005 + 0.1 ** 3 / 6 + 0.1 ** 4 / 24) ** 10, 1e-12, 'RK4'); cerca(e.yex, Math.E, 1e-12, 'exacta');
    // y′ = x − y: exacta x − 1 + 2e^(−x); RK4 con h = 0,2 acierta 4 decimales
    const l = ej('lineal'); cerca(l.y, 1 + 2 * Math.exp(-2), 1e-4, 'RK4 de y′ = x − y'); cerca(l.ys.euler[1], 0.8, 1e-12, 'primer paso de Euler');
    error({ modo: 'biseccion', fx: 'x^2 + 1', a: '-1', b: '1', tol: '1e-6', nmax: '50' }, 'intervalo sin cambio de signo');
    error({ modo: 'integral', fx: 'x', a: '0', b: '1', n: '0' }, 'n = 0');
    error({ modo: 'edo', fxy: 'y', x0: '0', y0: '1', h: '0,3', xf: '1', metodo: 'euler' }, 'paso que no cabe');
    error({ modo: 'newton', fx: 'x^2 +', x0: '1', tol: '1e-6', nmax: '50' }, 'función mal escrita');
    if (ej('seno').par !== true) mal(`${N}: n = 4 debería admitir Simpson`);
    if (C.resolver({ modo: 'newton', fx: 'x^2 + 1', x0: '1', tol: '1e-10', nmax: '30' }).conv) mal(`${N}: x² + 1 no tiene raíz y Newton no debería converger`);
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (bisección, Newton, secante, punto fijo, trapecios, Simpson, Euler, Heun y RK4) y errores`);
  }
  return Com.navegador({ publico, asignatura: 'matematicas', carpeta: 'metodos-numericos', nombre: N, app: 'MetodosNumericosApp', C, pagina, mal, malo: { k: 'fx', v: 'x^2 +' } });
};
