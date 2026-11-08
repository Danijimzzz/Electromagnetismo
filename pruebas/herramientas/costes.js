/* Comprobación de Costes de producción: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo costes). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Costes de producción';
  const C = require(path.join(fuente, 'costes', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano, CV = Q³ − 6Q² + 15Q, CF = 32: Q = 5 → CV = 125 − 150 + 75 = 50; CT = 82; CMe = 16,4; CMg = 75 − 60 + 15 = 30
    const t = ej('clasico'); cerca(t.cv, 50, 1e-9, 'CV'); cerca(t.ct, 82, 1e-9, 'CT'); cerca(t.cfme, 6.4, 1e-9, 'CFMe'); cerca(t.cvme, 10, 1e-9, 'CVMe'); cerca(t.cme, 16.4, 1e-9, 'CMe'); cerca(t.cmg, 30, 1e-9, 'CMg');
    // CVMe mínimo en Q = 6/2 = 3 con 9 − 18 + 15 = 6; CMe mínimo: 2Q³ − 6Q² = 32 → Q = 4, CMe = 15 = CMg(4)
    cerca(t.qc, 3, 1e-12, 'Q del mínimo de explotación'); cerca(t.pc, 6, 1e-12, 'mínimo de explotación'); cerca(t.qm, 4, 1e-9, 'Q del óptimo'); cerca(t.pm, 15, 1e-9, 'óptimo de explotación');
    // costes cuadráticos: Q* = √(450/0,5) = 30, CMe = 15 + 20 + 15 = 50; Q = 20 → CV = 400 + 200
    const u = ej('cuadratico'); cerca(u.qm, 30, 1e-12, 'Q* cuadrático'); cerca(u.pm, 50, 1e-12, 'CMe mínimo cuadrático'); cerca(u.cv, 600, 1e-9, 'CV cuadrático'); cerca(u.cmg, 40, 1e-9, 'CMg cuadrático'); cerca(u.pc, 20, 1e-12, 'cierre = a');
    const o = ej('optimo'); cerca(o.cme, o.cmg, 1e-9, 'CMe = CMg en el óptimo');
    // dado CMg = 15 − 12Q + 3Q² y CF = 32: se integra a CT = 32 + 15Q − 6Q² + Q³, igual que el ejemplo clásico
    { const g = ej('dado-cmg'), k = ej('clasico'); cerca(g.ct, k.ct, 1e-12, 'CT integrando el CMg'); cerca(g.cmg, k.cmg, 1e-12, 'CMg'); cerca(g.pm, k.pm, 1e-9, 'óptimo de explotación'); cerca(g.b, -6, 1e-12, 'b = m1/2'); cerca(g.c, 1, 1e-12, 'c = m2/3');
      const c2 = ej('cuadratico-2'); cerca(c2.qm, Math.sqrt(200 / 0.25), 1e-9, 'óptimo del CT cuadrático (√(CF/b))'); cerca(c2.pm, 10 + 2 * Math.sqrt(200 * 0.25), 1e-9, 'mínimo del CMe cuadrático'); }
    error({ entrada: 'cmg', cf: '', m0: '15', m1: '-12', m2: '3', q: '5' }, 'CMg sin costes fijos (constante de integración)'); error({ entrada: 'cmg', cf: '32', m0: '', m1: '1', m2: '0', q: '5' }, 'CMg sin término constante');
    error({ cf: '32', a: '15', b: '-6', c: '1', q: '0' }, 'producción 0');
    error({ cf: '32', a: '15', b: '0', c: '0', q: '3' }, 'costes lineales sin mínimo');
    error({ cf: '32', a: '1', b: '-6', c: '1', q: '3' }, 'coste marginal negativo');
    error({ cf: '0', a: '15', b: '-6', c: '1', q: '3' }, 'sin costes fijos');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, mínimos de explotación y óptimo, y errores`);
  }
  return Com.navegador({ publico, carpeta: 'costes', nombre: N, app: 'CostesApp', C, pagina, mal, malo: { k: 'a', v: '-1' } });
};
