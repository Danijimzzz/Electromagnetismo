const Eco = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const dinero = (x, dec = 2) => `${K.num(x, dec)} €`;
  const pct = (x, dec = 2) => `${K.num(100 * x, dec)} %`;
  const n = (x) => K.f(x, 6);
  const az = {
    e: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    toma: (xs) => xs[Math.floor(Math.random() * xs.length)],
    t: (x, d = 6) => String(+x.toFixed(d)).replace('.', ','),
    poli: (ts, v = 'q') => {
      let r = '';
      for (const [c0, p] of ts) {
        const c = +String(c0).replace(',', '.'); if (!c) continue;
        const a = Math.abs(c), cs = a === 1 && p > 0 ? '' : String(+a.toFixed(6)).replace('.', ',');
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
    if (forma === 'q') return { a: lee(sc, 'a', 'le terme a de la demande', { min: 0, minEx: true }), b: lee(sc, 'b', 'la pente b de la demande', { min: 0, minEx: true }), c: lee(sc, 'c', 'le terme c de l’offre'), d: lee(sc, 'd', 'la pente d de l’offre', { min: 0, minEx: true }), conv: '', forma };
    let a, b, c, d, conv;
    if (forma === 'p') {
      const al = lee(sc, 'pa', 'le α de la demande (P = α − βQ)', { min: 0, minEx: true }), be = lee(sc, 'pb', 'le β de la demande', { min: 0, minEx: true }), ga = lee(sc, 'pc', 'le γ de l’offre (P = γ + δQ)'), de = lee(sc, 'pd', 'le δ de l’offre', { min: 0, minEx: true });
      a = al / be; b = 1 / be; c = -ga / de; d = 1 / de;
      conv = `Les courbes sont données comme le prix en fonction de la quantité. On isole la quantité : de $P = ${n(al)} − ${n(be)} Q$ on tire $Q_d = ${n(al)}/${n(be)} − (1/${n(be)}) P = ${n(a)} − ${n(b)} P$ ; et de $P = ${n(ga)} + ${n(de)} Q$ on tire $Q_s = −${n(ga)}/${n(de)} + (1/${n(de)}) P = ${n(c)} + ${n(d)} P$.`;
    } else {
      const P = (k) => lee(sc, k, 'un prix des points des courbes', { min: 0 }), Q = (k) => lee(sc, k, 'une quantité des points des courbes', { min: 0 });
      const p1 = P('dp1'), q1 = Q('dq1'), p2 = P('dp2'), q2 = Q('dq2'), s1 = P('sp1'), r1 = Q('sq1'), s2 = P('sp2'), r2 = Q('sq2');
      if (p1 === p2) throw new Error('Les deux points de la demande doivent avoir des prix différents');
      if (s1 === s2) throw new Error('Les deux points de l’offre doivent avoir des prix différents');
      b = -(q2 - q1) / (p2 - p1); d = (r2 - r1) / (s2 - s1);
      if (!(b > 0)) throw new Error('Avec ces deux points, la demande ne baisse pas quand le prix monte : vérifiez les quantités');
      if (!(d > 0)) throw new Error('Avec ces deux points, l’offre ne monte pas quand le prix monte : vérifiez les quantités');
      a = q1 + b * p1; c = r1 - d * s1;
      conv = `Demande par les points (P, Q) = (${n(p1)}, ${n(q1)}) et (${n(p2)}, ${n(q2)}) : pente $−b = (${n(q2)} − ${n(q1)})/(${n(p2)} − ${n(p1)}) = ${n(-b)}$, et $a = Q_1 + b·P_1 = ${n(q1)} + ${n(b)}·${n(p1)} = ${n(a)}$. Offre par (${n(s1)}, ${n(r1)}) et (${n(s2)}, ${n(r2)}) : $d = (${n(r2)} − ${n(r1)})/(${n(s2)} − ${n(s1)}) = ${n(d)}$, et $c = Q_1 − d·P_1 = ${n(c)}$.`;
    }
    if (!(a > 0)) throw new Error('La demande doit couper l’axe des quantités en une valeur positive (a > 0)');
    return { a, b, c, d, conv, forma };
  }
  const FORMAS = [['q', 'Quantité : Q = a − bP'], ['p', 'Prix : P = α − βQ'], ['puntos', 'Deux points de chaque courbe']];
  function camposCurvas(sc) {
    if (sc.forma === 'p') return [{ k: 'pa', nom: 'α', sep: 'Demande P = α − βQ', ayuda: 'prix à quantité 0' }, { k: 'pb', nom: 'β', ayuda: 'euros de baisse par unité' }, { k: 'pc', nom: 'γ', sep: 'Offre P = γ + δQ', ayuda: 'prix à quantité 0' }, { k: 'pd', nom: 'δ', ayuda: 'euros de hausse par unité' }];
    if (sc.forma === 'puntos') return [{ k: 'dp1', nom: 'Demande : prix 1', un: '€', sep: 'Deux points de la demande' }, { k: 'dq1', nom: 'Demande : quantité 1' }, { k: 'dp2', nom: 'Demande : prix 2', un: '€' }, { k: 'dq2', nom: 'Demande : quantité 2' },
      { k: 'sp1', nom: 'Offre : prix 1', un: '€', sep: 'Deux points de l’offre' }, { k: 'sq1', nom: 'Offre : quantité 1' }, { k: 'sp2', nom: 'Offre : prix 2', un: '€' }, { k: 'sq2', nom: 'Offre : quantité 2' }];
    return [{ k: 'a', nom: 'a', sep: 'Demande', ayuda: 'quantité à prix 0' }, { k: 'b', nom: 'b', ayuda: 'unités de moins par euro' }, { k: 'c', nom: 'c', sep: 'Offre', ayuda: 'quantité à prix 0' }, { k: 'd', nom: 'd', ayuda: 'unités de plus par euro' }];
  }
  return { ...K, dinero, pct, az, curvas, FORMAS, camposCurvas };
})();

