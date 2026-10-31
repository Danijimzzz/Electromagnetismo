/* Comprobación de Maximización del beneficio: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo beneficio). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Maximización del beneficio';
  const C = require(path.join(fuente, 'beneficio', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // competencia, p = 20, CMg = 2 + Q: Q = 18; IT = 360; CT = 100 + 36 + 0,5·324 = 298; B = 62; mínimo del CMe: 2 + 2·√50
    const t = ej('competencia'); cerca(t.q, 18, 1e-12, 'Q competencia'); cerca(t.b, 62, 1e-9, 'beneficio'); cerca(t.pmin, 2 + 2 * Math.sqrt(50), 1e-12, 'precio de beneficio nulo');
    // p = 6: Q = 4; CT = 100 + 8 + 8 = 116; B = −92 (mejor que −100 cerrando)
    const p = ej('perdidas'); cerca(p.q, 4, 1e-12, 'Q con pérdidas'); cerca(p.b, -92, 1e-9, 'pérdidas');
    const c = ej('cierre'); cerca(c.q, 0, 0, 'cierra'); cerca(c.b, -100, 1e-12, 'pierde los costes fijos');
    // monopolio P = 100 − 2Q, CMg = 10 + 2Q: Q = 90/6 = 15; P = 70; CT = 200 + 150 + 225 = 575; B = 475; competencia Q = 22,5, P = 55; PIE = ½·7,5·(70 − 40)
    const m = ej('monopolio'); cerca(m.q, 15, 1e-12, 'Q monopolio'); cerca(m.pr, 70, 1e-12, 'precio monopolio'); cerca(m.b, 475, 1e-9, 'beneficio monopolio');
    cerca(m.qc, 22.5, 1e-12, 'Q competitiva'); cerca(m.pc, 55, 1e-12, 'P competitivo'); cerca(m.perd, 112.5, 1e-9, 'pérdida de eficiencia'); cerca(m.lerner, 30 / 70, 1e-12, 'Lerner'); cerca(m.lerner, 1 / Math.abs(m.eps), 1e-12, 'Lerner = 1/|ε|');
    // d = 0: CMg = 20, Q = 60/2 = 30, P = 50, B = 1500 − 650 = 850, PIE = ½·30·30
    const l = ej('monopolio-lineal'); cerca(l.q, 30, 1e-12, 'Q con CMg constante'); cerca(l.b, 850, 1e-9, 'beneficio'); cerca(l.perd, 450, 1e-9, 'PIE');
    error({ modo: 'competencia', cf: '10', c: '2', d: '0', p: '5' }, 'competencia con d = 0');
    error({ modo: 'competencia', cf: '10', c: '2', d: '1', p: '0' }, 'precio 0');
    error({ modo: 'monopolio', cf: '10', c: '50', d: '1', a: '40', b: '1' }, 'demanda por debajo del coste');
    error({ modo: 'monopolio', cf: '10', c: '5', d: '1', a: '40', b: '0' }, 'pendiente cero');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, cierre, Lerner, pérdida de eficiencia y errores`);
  }
  return Com.navegador({ publico, carpeta: 'beneficio', nombre: N, app: 'BeneficioApp', C, pagina, mal, malo: { k: 'cf', v: '-1' } });
};
