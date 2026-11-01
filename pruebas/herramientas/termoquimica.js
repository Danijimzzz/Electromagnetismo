/* Comprobación de Termoquímica y ley de Hess: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo termoquimica). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Termoquímica';
  global.Elementos = global.Elementos || require(path.join(fuente, 'quimica', 'elementos.js'));
  const C = require(path.join(fuente, 'termoquimica', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: CH4 + 2 O2 → CO2 + 2 H2O(l): −393,5 + 2·(−285,8) − (−74,8) = −890,3
    cerca(ej('metano').dH, -890.3, 1e-9, 'combustión del metano');
    // etanol: 2·(−393,5) + 3·(−285,8) + 277,7 = −1366,7; 10 g / 46,07 g/mol · (−1366,7)
    const e = ej('etanol'); cerca(e.dH, -1366.7, 1e-9, 'combustión del etanol'); cerca(e.q, -1366.7 * 10 / 46.069, 0.05, 'calor de 10 g de etanol');
    cerca(ej('amoniaco').dH, -92.2, 1e-9, 'síntesis del amoniaco');
    cerca(ej('propio').dH, -635.1 - 393.5 + 1207.1, 1e-9, 'con una entalpía propia');
    // Hess: C + ½O2 → CO = (C + O2 → CO2) − (CO + ½O2 → CO2): −393,5 + 283 = −110,5
    const h = ej('hess-co'); cerca(h.dH, -110.5, 1e-9, 'Hess del CO'); cerca(h.x[0], 1, 1e-9, 'factor 1'); cerca(h.x[1], -1, 1e-9, 'factor −1');
    // etano: −(−1560) + 2·(−393,5) + 3·(−285,8) = −84,4, con factores −1, 2, 3
    const t = ej('hess-etano'); cerca(t.dH, -84.4, 1e-9, 'Hess del etano'); cerca(t.x[0], -1, 1e-9, 'factor etano'); cerca(t.x[1], 2, 1e-9, 'factor C'); cerca(t.x[2], 3, 1e-9, 'factor H2');
    // Gibbs: 6,01 − 298·0,022 = −0,546; Te = 6010/22 = 273,18 K
    const g = ej('gibbs-hielo'); cerca(g.dG, -0.546, 1e-9, 'ΔG del hielo'); cerca(g.Te, 6010 / 22, 1e-9, 'Te del hielo');
    cerca(ej('gibbs-caco3').dG, 178.3 - 160.5, 1e-9, 'ΔG del CaCO3');
    error({ modo: 'formacion', reactivos: 'CH4(g)\nO2(g)', productos: 'CO2(g)\n2 H2O(l)' }, 'reacción sin ajustar');
    error({ modo: 'formacion', reactivos: 'H2O', productos: 'H2(g)\n1/2 O2(g)' }, 'H2O sin estado');
    error({ modo: 'formacion', reactivos: 'XeF4(s)', productos: 'Xe(g)\n2 F2(g)' }, 'sustancia sin entalpía');
    error({ modo: 'hess', reacciones: 'C(s) + O2(g) -> CO2(g) ; -393,5', objetivo: 'H2(g) + 1/2 O2(g) -> H2O(l)' }, 'Hess imposible');
    error({ modo: 'hess', reacciones: 'C(s) + O2(g) -> CO2(g)', objetivo: 'C(s) + O2(g) -> CO2(g)' }, 'reacción sin ΔH');
    error({ modo: 'gibbs', h: '', s: '1', t: '300' }, 'falta ΔH');
    error({ modo: 'gibbs', h: '1', s: '1', t: '0' }, 'temperatura cero');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (ΔHf, Hess, Gibbs) y errores`);
  }
  return Com.navegador({ publico, asignatura: 'quimica', carpeta: 'termoquimica', nombre: N, app: 'TermoquimicaApp', C, pagina, mal, malo: { k: 'masa', v: '-1' } });
};
