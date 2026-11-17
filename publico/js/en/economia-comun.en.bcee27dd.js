const Eco = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const dinero = (x, dec = 2) => `${K.num(x, dec)} €`;
  const pct = (x, dec = 2) => `${K.num(100 * x, dec)} %`;
  const n = (x) => K.f(x, 6);
  const az = {
    e: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    toma: (xs) => xs[Math.floor(Math.random() * xs.length)],
    t: (x, d = 6) => String(+x.toFixed(d)).replace('.', '.'),
    poli: (ts, v = 'q') => {
      let r = '';
      for (const [c0, p] of ts) {
        const c = +String(c0).replace(',', '.'); if (!c) continue;
        const a = Math.abs(c), cs = a === 1 && p > 0 ? '' : String(+a.toFixed(6)).replace('.', '.');
        r += (r ? (c < 0 ? ' − ' : ' + ') : (c < 0 ? '−' : '')) + cs + (p ? v + ['', '', '²', '³'][p] : '');
      }
      return r || '0';
    },
    desde: (ejemplos, cambia, donde, calcula) => () => {
      const es = donde ? ejemplos.filter((e) => donde(e.sc, e)) : ejemplos;
      let sc;
      for (let k = 0; k < 60; k++) {
        const b = JSON.parse(JSON.stringify(az.toma(es).sc)); sc = { ...b, ...cambia(b) };
        if (!calcula) return sc;
        try { calcula(sc); return sc; } catch (e) { /* otro intento */ }
      }
      return sc;
    },
  };
  function curvas(sc) {
    const { lee } = K, forma = sc.forma === 'p' || sc.forma === 'puntos' ? sc.forma : 'q';
    if (forma === 'q') return { a: lee(sc, 'a', 'the term a of demand', { min: 0, minEx: true }), b: lee(sc, 'b', 'the slope b of the demand curve', { min: 0, minEx: true }), c: lee(sc, 'c', 'the term c of supply'), d: lee(sc, 'd', 'the slope d of the supply curve', { min: 0, minEx: true }), conv: '', forma };
    let a, b, c, d, conv;
    if (forma === 'p') {
      const al = lee(sc, 'pa', 'the α of demand (P = α − βQ)', { min: 0, minEx: true }), be = lee(sc, 'pb', 'the β of demand', { min: 0, minEx: true }), ga = lee(sc, 'pc', 'the γ of supply (P = γ + δQ)'), de = lee(sc, 'pd', 'the δ of supply', { min: 0, minEx: true });
      a = al / be; b = 1 / be; c = -ga / de; d = 1 / de;
      conv = `The curves are given as price as a function of quantity. Solve for quantity: from $P = ${n(al)} − ${n(be)} Q$ we get $Q_d = ${n(al)}/${n(be)} − (1/${n(be)}) P = ${n(a)} − ${n(b)} P$; and from $P = ${n(ga)} + ${n(de)} Q$ we get $Q_s = −${n(ga)}/${n(de)} + (1/${n(de)}) P = ${n(c)} + ${n(d)} P$.`;
    } else {
      const P = (k) => lee(sc, k, 'a price of the curve points', { min: 0 }), Q = (k) => lee(sc, k, 'a quantity of the curve points', { min: 0 });
      const p1 = P('dp1'), q1 = Q('dq1'), p2 = P('dp2'), q2 = Q('dq2'), s1 = P('sp1'), r1 = Q('sq1'), s2 = P('sp2'), r2 = Q('sq2');
      if (p1 === p2) throw new Error('The two demand points must have different prices');
      if (s1 === s2) throw new Error('The two supply points must have different prices');
      b = -(q2 - q1) / (p2 - p1); d = (r2 - r1) / (s2 - s1);
      if (!(b > 0)) throw new Error('With those two points demand does not fall as the price rises: check the quantities');
      if (!(d > 0)) throw new Error('With those two points supply does not rise as the price rises: check the quantities');
      a = q1 + b * p1; c = r1 - d * s1;
      conv = `Demand through the points (P, Q) = (${n(p1)}, ${n(q1)}) and (${n(p2)}, ${n(q2)}): slope $−b = (${n(q2)} − ${n(q1)})/(${n(p2)} − ${n(p1)}) = ${n(-b)}$, and $a = Q_1 + b·P_1 = ${n(q1)} + ${n(b)}·${n(p1)} = ${n(a)}$. Supply through (${n(s1)}, ${n(r1)}) and (${n(s2)}, ${n(r2)}): $d = (${n(r2)} − ${n(r1)})/(${n(s2)} − ${n(s1)}) = ${n(d)}$ and $c = Q_1 − d·P_1 = ${n(c)}$.`;
    }
    if (!(a > 0)) throw new Error('Demand must cross the quantity axis at a positive value (a > 0)');
    return { a, b, c, d, conv, forma };
  }
  const FORMAS = [['q', 'Quantity: Q = a − bP'], ['p', 'Price: P = α − βQ'], ['puntos', 'Two points on each curve']];
  function camposCurvas(sc) {
    if (sc.forma === 'p') return [{ k: 'pa', nom: 'α', sep: 'Demand P = α − βQ', ayuda: 'price at quantity 0' }, { k: 'pb', nom: 'β', ayuda: 'euros it falls per unit' }, { k: 'pc', nom: 'γ', sep: 'Supply P = γ + δQ', ayuda: 'price at quantity 0' }, { k: 'pd', nom: 'δ', ayuda: 'euros it rises per unit' }];
    if (sc.forma === 'puntos') return [{ k: 'dp1', nom: 'Demand: price 1', un: '€', sep: 'Two demand points' }, { k: 'dq1', nom: 'Demand: quantity 1' }, { k: 'dp2', nom: 'Demand: price 2', un: '€' }, { k: 'dq2', nom: 'Demand: quantity 2' },
      { k: 'sp1', nom: 'Supply: price 1', un: '€', sep: 'Two supply points' }, { k: 'sq1', nom: 'Supply: quantity 1' }, { k: 'sp2', nom: 'Supply: price 2', un: '€' }, { k: 'sq2', nom: 'Supply: quantity 2' }];
    return [{ k: 'a', nom: 'a', sep: 'Demand', ayuda: 'quantity at price 0' }, { k: 'b', nom: 'b', ayuda: 'fewer units per euro' }, { k: 'c', nom: 'c', sep: 'Supply', ayuda: 'quantity at price 0' }, { k: 'd', nom: 'd', ayuda: 'more units per euro' }];
  }
  return { ...K, dinero, pct, az, curvas, FORMAS, camposCurvas };
})();

