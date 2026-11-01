/* Comprobación del Multiplicador keynesiano: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo multiplicador). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Multiplicador keynesiano';
  const C = require(path.join(fuente, 'multiplicador', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // básico a mano: A = 100 + 200 + 300 = 600, b = 0,8, k = 5, Y* = 3000, C = 100 + 0,8·3000 = 2500, S = 500; ΔG = 50 → ΔY = 250
    const t = ej('basico'); cerca(t.a, 600, 1e-9, 'A'); cerca(t.b, 0.8, 1e-12, 'b'); cerca(t.k, 5, 1e-9, 'k'); cerca(t.kt, -4, 1e-9, 'k_T'); cerca(t.keq, 1, 1e-9, 'k_eq');
    cerca(t.y, 3000, 1e-9, 'Y*'); cerca(t.cons, 2500, 1e-9, 'C'); cerca(t.ahorro, 500, 1e-9, 'S'); cerca(t.dy, 250, 1e-9, 'ΔY'); cerca(t.y2, 3250, 1e-9, 'Y nueva'); cerca(t.rondas[0].inc, 50, 1e-9, 'ronda 1'); cerca(t.rondas[1].ac, 90, 1e-9, 'acumulado 2');
    // con Estado: A = 200 − 0,8·100 + 300 + 400 = 820, b = 0,8·0,75 = 0,6, k = 2,5, Y* = 2050, T = 100 + 512,5, C = 200 + 0,8·1437,5 = 1350; ΔG = 80 → ΔY = 200
    const u = ej('estado'); cerca(u.a, 820, 1e-9, 'A con Estado'); cerca(u.k, 2.5, 1e-9, 'k con Estado'); cerca(u.y, 2050, 1e-9, 'Y* con Estado'); cerca(u.T, 612.5, 1e-9, 'T'); cerca(u.cons, 1350, 1e-9, 'C con Estado'); cerca(u.dy, 200, 1e-9, 'ΔY con Estado'); cerca(u.saldoPublico, 212.5, 1e-9, 'T − G');
    // abierta: A = 150 − 75 + 250 + 350 + 200 − 50 = 825, b = 0,75·0,8 − 0,1 = 0,5, k = 2, Y* = 1650; M = 215; S + T + M = I + G + X
    const o = ej('abierta'); cerca(o.y, 1650, 1e-9, 'Y* abierta'); cerca(o.imp, 215, 1e-9, 'M'); cerca(o.ahorro + o.T + o.imp, 800, 1e-9, 'S + T + M = I + G + X'); cerca(o.da, o.y, 1e-9, 'DA = Y');
    cerca(o.brecha, 850, 1e-9, 'brecha'); cerca(o.dgNec, 425, 1e-9, 'ΔG necesario'); cerca(o.dtNec, -850 / 1.5, 1e-9, 'ΔT0 necesario');
    error({ ...t.sc ?? C.ejemplos[0].sc, c: '1' }, 'multiplicador infinito');
    error({ ...C.ejemplos[0].sc, c: '1,2' }, 'c mayor que 1');
    error({ ...C.ejemplos[0].sc, c0: '' }, 'falta C0');
    error({ ...C.ejemplos[0].sc, c0: '0', i: '0', g: '0' }, 'renta nula');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, multiplicadores, brecha y errores`);
  }
  return Com.navegador({ publico, carpeta: 'multiplicador', nombre: N, app: 'MultiplicadorApp', C, pagina, mal, malo: { k: 'c', v: '-1' } });
};
