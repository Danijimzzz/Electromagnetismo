/* =====================================================================
   Común de las herramientas de Economía (Eco): lo de Calculadora
   (calculadora.js: formato, lectura de campos, listas, tablas y gráfica)
   más euros y porcentajes. Va en «scripts» de catalogo.js después de
   calculadora.js; en Node, cada calculo.js lo pide con require.
     dinero(x, dec)   «1.234,56 €»
     pct(x, dec)      fracción → «3,25 %»
     curvas(sc)       demanda Qd = a − b·P y oferta Qs = c + d·P a partir de sc.forma:
                      'q' (a, b, c, d), 'p' (P = α − β·Q y P = γ + δ·Q: pa, pb, pc, pd) o
                      'puntos' (dos puntos (P, Q) de cada curva: dp1 dq1 dp2 dq2, sp1 sq1 sp2 sq2).
                      Devuelve { a, b, c, d, conv } con conv = texto HTML de la conversión (o '').
   ===================================================================== */
const Eco = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const dinero = (x, dec = 2) => `${K.num(x, dec)} €`;
  const pct = (x, dec = 2) => `${K.num(100 * x, dec)} %`;
  const n = (x) => K.f(x, 6);
  function curvas(sc) {
    const { lee } = K, forma = sc.forma === 'p' || sc.forma === 'puntos' ? sc.forma : 'q';
    if (forma === 'q') return { a: lee(sc, 'a', 'el término a de la demanda', { min: 0, minEx: true }), b: lee(sc, 'b', 'la pendiente b de la demanda', { min: 0, minEx: true }), c: lee(sc, 'c', 'el término c de la oferta'), d: lee(sc, 'd', 'la pendiente d de la oferta', { min: 0, minEx: true }), conv: '', forma };
    let a, b, c, d, conv;
    if (forma === 'p') {
      const al = lee(sc, 'pa', 'el α de la demanda (P = α − βQ)', { min: 0, minEx: true }), be = lee(sc, 'pb', 'el β de la demanda', { min: 0, minEx: true }), ga = lee(sc, 'pc', 'el γ de la oferta (P = γ + δQ)'), de = lee(sc, 'pd', 'el δ de la oferta', { min: 0, minEx: true });
      a = al / be; b = 1 / be; c = -ga / de; d = 1 / de;
      conv = `Las curvas están dadas como el precio en función de la cantidad. Se despeja la cantidad: de $P = ${n(al)} − ${n(be)} Q$ sale $Q_d = ${n(al)}/${n(be)} − (1/${n(be)}) P = ${n(a)} − ${n(b)} P$; y de $P = ${n(ga)} + ${n(de)} Q$ sale $Q_s = −${n(ga)}/${n(de)} + (1/${n(de)}) P = ${n(c)} + ${n(d)} P$.`;
    } else {
      const P = (k) => lee(sc, k, 'un precio de los puntos de las curvas', { min: 0 }), Q = (k) => lee(sc, k, 'una cantidad de los puntos de las curvas', { min: 0 });
      const p1 = P('dp1'), q1 = Q('dq1'), p2 = P('dp2'), q2 = Q('dq2'), s1 = P('sp1'), r1 = Q('sq1'), s2 = P('sp2'), r2 = Q('sq2');
      if (p1 === p2) throw new Error('Los dos puntos de la demanda tienen que tener precios distintos');
      if (s1 === s2) throw new Error('Los dos puntos de la oferta tienen que tener precios distintos');
      b = -(q2 - q1) / (p2 - p1); d = (r2 - r1) / (s2 - s1);
      if (!(b > 0)) throw new Error('Con esos dos puntos la demanda no baja al subir el precio: revisa las cantidades');
      if (!(d > 0)) throw new Error('Con esos dos puntos la oferta no sube al subir el precio: revisa las cantidades');
      a = q1 + b * p1; c = r1 - d * s1;
      conv = `Demanda por los puntos (P, Q) = (${n(p1)}, ${n(q1)}) y (${n(p2)}, ${n(q2)}): pendiente $−b = (${n(q2)} − ${n(q1)})/(${n(p2)} − ${n(p1)}) = ${n(-b)}$, y $a = Q_1 + b·P_1 = ${n(q1)} + ${n(b)}·${n(p1)} = ${n(a)}$. Oferta por (${n(s1)}, ${n(r1)}) y (${n(s2)}, ${n(r2)}): $d = (${n(r2)} − ${n(r1)})/(${n(s2)} − ${n(s1)}) = ${n(d)}$ y $c = Q_1 − d·P_1 = ${n(c)}$.`;
    }
    if (!(a > 0)) throw new Error('La demanda tiene que cortar el eje de cantidades en un valor positivo (a > 0)');
    return { a, b, c, d, conv, forma };
  }
  const FORMAS = [['q', 'Cantidad: Q = a − bP'], ['p', 'Precio: P = α − βQ'], ['puntos', 'Dos puntos de cada curva']];
  // los campos de las curvas según la forma elegida
  function camposCurvas(sc) {
    if (sc.forma === 'p') return [{ k: 'pa', nom: 'α', sep: 'Demanda P = α − βQ', ayuda: 'precio con cantidad 0' }, { k: 'pb', nom: 'β', ayuda: 'euros que baja por cada unidad' }, { k: 'pc', nom: 'γ', sep: 'Oferta P = γ + δQ', ayuda: 'precio con cantidad 0' }, { k: 'pd', nom: 'δ', ayuda: 'euros que sube por cada unidad' }];
    if (sc.forma === 'puntos') return [{ k: 'dp1', nom: 'Demanda: precio 1', un: '€', sep: 'Dos puntos de la demanda' }, { k: 'dq1', nom: 'Demanda: cantidad 1' }, { k: 'dp2', nom: 'Demanda: precio 2', un: '€' }, { k: 'dq2', nom: 'Demanda: cantidad 2' },
      { k: 'sp1', nom: 'Oferta: precio 1', un: '€', sep: 'Dos puntos de la oferta' }, { k: 'sq1', nom: 'Oferta: cantidad 1' }, { k: 'sp2', nom: 'Oferta: precio 2', un: '€' }, { k: 'sq2', nom: 'Oferta: cantidad 2' }];
    return [{ k: 'a', nom: 'a', sep: 'Demanda', ayuda: 'cantidad con precio 0' }, { k: 'b', nom: 'b', ayuda: 'unidades menos por cada euro' }, { k: 'c', nom: 'c', sep: 'Oferta', ayuda: 'cantidad con precio 0' }, { k: 'd', nom: 'd', ayuda: 'unidades más por cada euro' }];
  }
  return { ...K, dinero, pct, curvas, FORMAS, camposCurvas };
})();
if (typeof module !== 'undefined') module.exports = Eco;
