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
    if (forma === 'q') return { a: lee(sc, 'a', 'der Term a der Nachfrage', { min: 0, minEx: true }), b: lee(sc, 'b', 'die Steigung b der Nachfrage', { min: 0, minEx: true }), c: lee(sc, 'c', 'der Term c des Angebots'), d: lee(sc, 'd', 'die Steigung d des Angebots', { min: 0, minEx: true }), conv: '', forma };
    let a, b, c, d, conv;
    if (forma === 'p') {
      const al = lee(sc, 'pa', 'das α der Nachfrage (P = α − βQ)', { min: 0, minEx: true }), be = lee(sc, 'pb', 'das β der Nachfrage', { min: 0, minEx: true }), ga = lee(sc, 'pc', 'das γ des Angebots (P = γ + δQ)'), de = lee(sc, 'pd', 'das δ des Angebots', { min: 0, minEx: true });
      a = al / be; b = 1 / be; c = -ga / de; d = 1 / de;
      conv = `Die Kurven sind als Preis in Abhängigkeit von der Menge gegeben. Man löst nach der Menge auf: Aus $P = ${n(al)} − ${n(be)} Q$ folgt $Q_d = ${n(al)}/${n(be)} − (1/${n(be)}) P = ${n(a)} − ${n(b)} P$; und aus $P = ${n(ga)} + ${n(de)} Q$ folgt $Q_s = −${n(ga)}/${n(de)} + (1/${n(de)}) P = ${n(c)} + ${n(d)} P$.`;
    } else {
      const P = (k) => lee(sc, k, 'ein Preis der Kurvenpunkte', { min: 0 }), Q = (k) => lee(sc, k, 'eine Menge der Kurvenpunkte', { min: 0 });
      const p1 = P('dp1'), q1 = Q('dq1'), p2 = P('dp2'), q2 = Q('dq2'), s1 = P('sp1'), r1 = Q('sq1'), s2 = P('sp2'), r2 = Q('sq2');
      if (p1 === p2) throw new Error('Die beiden Nachfragepunkte müssen verschiedene Preise haben');
      if (s1 === s2) throw new Error('Die beiden Angebotspunkte müssen verschiedene Preise haben');
      b = -(q2 - q1) / (p2 - p1); d = (r2 - r1) / (s2 - s1);
      if (!(b > 0)) throw new Error('Mit diesen beiden Punkten sinkt die Nachfrage bei steigendem Preis nicht: Prüfe die Mengen');
      if (!(d > 0)) throw new Error('Mit diesen beiden Punkten steigt das Angebot bei steigendem Preis nicht: Prüfe die Mengen');
      a = q1 + b * p1; c = r1 - d * s1;
      conv = `Nachfrage durch die Punkte (P, Q) = (${n(p1)}, ${n(q1)}) und (${n(p2)}, ${n(q2)}): Steigung $−b = (${n(q2)} − ${n(q1)})/(${n(p2)} − ${n(p1)}) = ${n(-b)}$, und $a = Q_1 + b·P_1 = ${n(q1)} + ${n(b)}·${n(p1)} = ${n(a)}$. Angebot durch (${n(s1)}, ${n(r1)}) und (${n(s2)}, ${n(r2)}): $d = (${n(r2)} − ${n(r1)})/(${n(s2)} − ${n(s1)}) = ${n(d)}$ und $c = Q_1 − d·P_1 = ${n(c)}$.`;
    }
    if (!(a > 0)) throw new Error('Die Nachfrage muss die Mengenachse bei einem positiven Wert schneiden (a > 0)');
    return { a, b, c, d, conv, forma };
  }
  const FORMAS = [['q', 'Menge: Q = a − bP'], ['p', 'Preis: P = α − βQ'], ['puntos', 'Zwei Punkte je Kurve']];
  function camposCurvas(sc) {
    if (sc.forma === 'p') return [{ k: 'pa', nom: 'α', sep: 'Nachfrage P = α − βQ', ayuda: 'Preis bei Menge 0' }, { k: 'pb', nom: 'β', ayuda: 'Euro, um die er pro Einheit sinkt' }, { k: 'pc', nom: 'γ', sep: 'Angebot P = γ + δQ', ayuda: 'Preis bei Menge 0' }, { k: 'pd', nom: 'δ', ayuda: 'Euro, um die er pro Einheit steigt' }];
    if (sc.forma === 'puntos') return [{ k: 'dp1', nom: 'Nachfrage: Preis 1', un: '€', sep: 'Zwei Punkte der Nachfrage' }, { k: 'dq1', nom: 'Nachfrage: Menge 1' }, { k: 'dp2', nom: 'Nachfrage: Preis 2', un: '€' }, { k: 'dq2', nom: 'Nachfrage: Menge 2' },
      { k: 'sp1', nom: 'Angebot: Preis 1', un: '€', sep: 'Zwei Punkte des Angebots' }, { k: 'sq1', nom: 'Angebot: Menge 1' }, { k: 'sp2', nom: 'Angebot: Preis 2', un: '€' }, { k: 'sq2', nom: 'Angebot: Menge 2' }];
    return [{ k: 'a', nom: 'a', sep: 'Nachfrage', ayuda: 'Menge bei Preis 0' }, { k: 'b', nom: 'b', ayuda: 'Einheiten weniger pro Euro' }, { k: 'c', nom: 'c', sep: 'Angebot', ayuda: 'Menge bei Preis 0' }, { k: 'd', nom: 'd', ayuda: 'Einheiten mehr pro Euro' }];
  }
  return { ...K, dinero, pct, az, curvas, FORMAS, camposCurvas };
})();

