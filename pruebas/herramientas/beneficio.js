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
    // coste cúbico CT = 100 + 20Q − 6Q² + 0,5Q³ (el de Costes): CVMe mínimo en Q = 6 con 2 €; p = 40 → 1,5Q² − 12Q + 20 = 40 → Q = (6 + √66)/1,5
    { const k = ej('cubico'), Q = (6 + Math.sqrt(66)) / 1.5; cerca(k.q, Q, 1e-12, 'Q con coste cúbico'); cerca(k.fn.cmg(k.q), 40, 1e-9, 'CMg = p'); cerca(k.cierre, 2, 1e-12, 'precio de cierre (mín. CVMe)'); cerca(k.b, 40 * Q - (100 + 20 * Q - 6 * Q * Q + 0.5 * Q ** 3), 1e-9, 'beneficio cúbico');
      // el mínimo del CMe cumple CMg = CMe, y es el menor valor de CMe
      cerca(k.fn.cmg(k.qm), k.fn.cme(k.qm), 1e-6, 'CMg = CMe en el óptimo de explotación'); for (const dq of [-0.5, 0.5]) if (k.fn.cme(k.qm + dq) < k.pmin - 1e-12) mal(`${N}: el CMe baja de su mínimo`);
      // la raíz elegida tiene CMg creciente y da más beneficio que la otra
      const Q2 = (6 - Math.sqrt(66)) / 1.5; if (Q2 > 0 && 40 * Q2 - k.fn.ct(Q2) > k.b) mal(`${N}: la raíz decreciente no puede dar más beneficio`);
      const z = ej('cubico-cierre'); if (z.opera || z.q !== 0) mal(`${N}: con p = 1,5 < 2 hay que cerrar`); cerca(z.b, -100, 1e-12, 'pérdida al cerrar'); }
    error({ modo: 'competencia3', cf: '100', ca: '20', cb: '-6', cc: '0', p: '10' }, 'cúbico con c = 0'); error({ modo: 'competencia3', cf: '100', ca: '1', cb: '-6', cc: '0,5', p: '10' }, 'CVMe negativo');
    error({ modo: 'competencia', cf: '10', c: '2', d: '0', p: '5' }, 'competencia con d = 0');
    error({ modo: 'competencia', cf: '10', c: '2', d: '1', p: '0' }, 'precio 0');
    error({ modo: 'monopolio', cf: '10', c: '50', d: '1', a: '40', b: '1' }, 'demanda por debajo del coste');
    error({ modo: 'monopolio', cf: '10', c: '5', d: '1', a: '40', b: '0' }, 'pendiente cero');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, cierre, Lerner, pérdida de eficiencia y errores`);
  }
  return Com.navegador({ publico, carpeta: 'beneficio', nombre: N, app: 'BeneficioApp', C, pagina, mal, malo: { k: 'cf', v: '-1' } });
};
