const Continua = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-10) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const p = (x) => (x < -1e-10 ? `(${f(x)})` : f(x));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const TIPOS = {
    R: { nombre: 'Widerstand', letra: 'R', un: 'Ω' },
    V: { nombre: 'Spannungsquelle', letra: 'E', un: 'V' },
    I: { nombre: 'Stromquelle', letra: 'J', un: 'A' },
    C: { nombre: 'Kondensator', letra: 'C', un: 'μF', base: 1e-6 },
    L: { nombre: 'Spule', letra: 'L', un: 'mH', base: 1e-3 },
    VV: { nombre: 'Spannungsgesteuerte Spannungsquelle', letra: 'Ed', un: 'V/V', k: 'k', ctrl: 'V' },
    VI: { nombre: 'Stromgesteuerte Spannungsquelle', letra: 'Ed', un: 'Ω', k: 'r', ctrl: 'I' },
    IV: { nombre: 'Spannungsgesteuerte Stromquelle', letra: 'Jd', un: 'S', k: 'g', ctrl: 'V' },
    II: { nombre: 'Stromgesteuerte Stromquelle', letra: 'Jd', un: 'A/A', k: 'β', ctrl: 'I' },
  };
  const FIJA_TENSION = new Set(['V', 'L', 'VV', 'VI']); // su corriente es una incógnita más
  const DEPENDIENTE = new Set(['VV', 'VI', 'IV', 'II']);
  const sub = (n) => n.replace(/^([A-Za-z])(\w+)$/, '$1<sub>$2</sub>');
  const Vn = (n, ref) => (n === ref ? '0' : `V<sub>${n}</sub>`);
  const dif = (a, b, ref) => (b === ref ? Vn(a, ref) : a === ref ? `−${Vn(b, ref)}` : `(${Vn(a, ref)} − ${Vn(b, ref)})`);
  const NUDO = /^[\wÀ-ÿ]{1,8}$/;

  function nombres(els) {
    const c = {};
    return els.map((e) => { const l = (TIPOS[e.t] || TIPOS.R).letra; c[l] = (c[l] || 0) + 1; return `${l}${c[l]}`; });
  }

  function leer(sc) {
    const crudos = sc.elementos || [];
    if (!crudos.length) throw new Error('Füge mindestens ein Element hinzu');
    const nom = nombres(crudos);
    const els = crudos.map((e, i) => {
      const q = nom[i], T = TIPOS[e.t];
      if (!T) throw new Error(`${q}: unbekannter Typ`);
      const a = String(e.a ?? '').trim(), b = String(e.b ?? '').trim();
      if (!a || !b) throw new Error(`${q}: Die Knoten fehlen`);
      if (!NUDO.test(a) || !NUDO.test(b)) throw new Error(`${q}: Knoten werden mit Buchstaben oder Zahlen benannt (bis zu 8)`);
      if (a === b) throw new Error(`${q}: Es ist auf beiden Seiten mit demselben Knoten verbunden`);
      if (vacio(e.v)) throw new Error(`${q}: Es fehlt ${T.k ? `der Faktor ${T.k}` : 'der Wert'}`);
      const v = Herramienta.leeSI(e.v, T.base || 1); // admite 4k7, 1,5k, 100m…
      if (!isFinite(v)) throw new Error(`${q}: Der Wert muss eine Zahl sein`);
      if ('RCL'.includes(e.t) && v <= 0) throw new Error(`${q}: ${e.t === 'R' ? 'Der Widerstand' : e.t === 'C' ? 'Die Kapazität' : 'Die Induktivität'} muss größer als 0 sein`);
      const el = { i, t: e.t, n: q, a, b, v };
      if (T.ctrl === 'V') {
        el.c = String(e.c ?? '').trim(); el.d = String(e.d ?? '').trim();
        if (!el.c || !el.d) throw new Error(`${q}: Die Knoten der steuernden Spannung fehlen`);
        if (!NUDO.test(el.c) || !NUDO.test(el.d)) throw new Error(`${q}: Die Steuerknoten werden mit Buchstaben oder Zahlen benannt (bis zu 8)`);
        if (el.c === el.d) throw new Error(`${q}: Die steuernde Spannung liegt zwischen demselben Knoten`);
      } else if (T.ctrl === 'I') {
        const x = String(e.x ?? '').trim().toUpperCase(), j = nom.findIndex((m) => m.toUpperCase() === x);
        if (!x) throw new Error(`${q}: Das Element, dessen Strom steuert, fehlt`);
        if (j < 0) throw new Error(`${q}: Es gibt kein Element namens ${e.x}`);
        if (j === i) throw new Error(`${q}: Sie kann nicht von ihrem eigenen Strom gesteuert werden`);
        el.x = nom[j];
      }
      return el;
    });
    const nudos = new Set(els.flatMap((e) => [e.a, e.b]));
    for (const e of els) for (const n of [e.c, e.d]) if (n !== undefined && !nudos.has(n)) throw new Error(`${e.n}: Der Steuerknoten ${n} ist nicht in der Schaltung`);
    return els;
  }

  function gauss(A, b) {
    const n = b.length, M = A.map((f, i) => [...f, b[i]]);
    const escala = Math.max(1e-300, ...A.flat().map(Math.abs));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (Math.abs(M[piv][c]) < 1e-12 * escala) return null;
      [M[c], M[piv]] = [M[piv], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c] / M[c][c]; if (k) for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
    }
    return M.map((f, i) => f[n] / f[i]);
  }

  function nodal(els, ref) {
    const nudos = [];
    for (const e of els) for (const n of [e.a, e.b]) if (!nudos.includes(n)) nudos.push(n);
    const inc = nudos.filter((n) => n !== ref), fuentes = els.filter((e) => FIJA_TENSION.has(e.t));
    const N = inc.length + fuentes.length, porNombre = Object.fromEntries(els.map((e) => [e.n, e]));
    const forma = (k = 0) => ({ c: Array(N).fill(0), k });
    const suma = (...ts) => ts.reduce((s, [q, x]) => ({ c: s.c.map((v, j) => v + q * x.c[j]), k: s.k + q * x.k }), forma());
    const pot = (n) => { const x = forma(); if (n !== ref && inc.includes(n)) x.c[inc.indexOf(n)] = 1; return x; };
    function corr(e, vistos = []) {
      if (vistos.includes(e.n)) throw new Error(`${vistos[0]}: Die gesteuerten Quellen steuern sich gegenseitig im Kreis`);
      if (e.t === 'R') return suma([1 / e.v, pot(e.a)], [-1 / e.v, pot(e.b)]);
      if (FIJA_TENSION.has(e.t)) { const x = forma(); x.c[inc.length + fuentes.indexOf(e)] = 1; return x; }
      if (e.t === 'I') return forma(e.v);
      if (e.t === 'C') return forma();
      if (e.t === 'IV') return suma([e.v, pot(e.c)], [-e.v, pot(e.d)]);
      const ctrl = porNombre[e.x];
      if (!ctrl) throw new Error(`${e.n}: Das steuernde Element ${e.x} ist nicht vorhanden`);
      return suma([e.v, corr(ctrl, [...vistos, e.n])]); // II
    }
    const A = [], b = [];
    for (const n of inc) {
      const x = suma(...els.filter((e) => e.a === n || e.b === n).map((e) => [e.a === n ? 1 : -1, corr(e)]));
      A.push(x.c); b.push(-x.k);
    }
    for (const e of fuentes) {
      const u = suma([1, pot(e.a)], [-1, pot(e.b)]);
      const x = e.t === 'V' ? suma([1, u], [1, forma(-e.v)]) : e.t === 'L' ? u : e.t === 'VV' ? suma([1, u], [-e.v, pot(e.c)], [e.v, pot(e.d)]) : suma([1, u], [-e.v, corr(porNombre[e.x] || (() => { throw new Error(`${e.n}: Das steuernde Element ${e.x} ist nicht vorhanden`); })(), [e.n])]);
      A.push(x.c); b.push(-x.k);
    }
    const x = N ? gauss(A, b) : [];
    if (!x) return null;
    const val = (q) => q.c.reduce((s, v, j) => s + v * x[j], q.k);
    const V = Object.fromEntries(nudos.map((n) => [n, n === ref ? 0 : x[inc.indexOf(n)]]));
    const I = Object.fromEntries(els.map((e) => [e.n, val(corr(e))]));
    return { nudos, inc, fuentes, A, b, x, V, I };
  }

  function conectado(els) {
    const ady = {};
    for (const e of els) { (ady[e.a] ||= []).push(e.b); (ady[e.b] ||= []).push(e.a); }
    const nudos = Object.keys(ady), visto = new Set([nudos[0]]), pila = [nudos[0]];
    while (pila.length) for (const m of ady[pila.pop()]) if (!visto.has(m)) { visto.add(m); pila.push(m); }
    return nudos.filter((n) => !visto.has(n));
  }

  const matHtml = (M) => `<span class="mat"><span class="mat-in" style="grid-template-columns:repeat(${M[0].length}, auto)">${M.flat().map((v) => `<span>${v}</span>`).join('')}</span></span>`;
  const SINGULAR = 'Das System hat keine eindeutige Lösung: Prüfe, ob keine Spannungsquellen (oder Spulen) parallel oder in einer Schleife liegen, keine Stromquellen (oder Kondensatoren) in Reihe liegen und kein Knoten nur Stromquellen oder Kondensatoren hat';

  function termino(e, n, ref) {
    const s = e.a === n ? '+' : '−', otro = e.a === n ? e.b : e.a;
    if (e.t === 'R') return `${s} ${otro === ref ? Vn(n, ref) : `(${Vn(n, ref)} − ${Vn(otro, ref)})`}/${f(e.v)}`;
    if (FIJA_TENSION.has(e.t)) return `${s} I<sub>${e.n}</sub>`;
    if (e.t === 'IV') return `${s} ${f(e.v)}·${dif(e.c, e.d, ref)}`;
    if (e.t === 'II') return `${s} ${f(e.v)}·I<sub>${e.x}</sub>`;
    return null;
  }
  const junta = (ts) => ts.join(' ').replace(/^\+ /, '').replace(/^− /, '−') || '0';

  function thevenin(els, a, b, ref, L) {
    const resto = L ? els.filter((e) => e !== L) : els, quien = L ? `Al quitar ${L.n}` : 'Zwischen diesen Knoten';
    if (L) {
      const dep = resto.find((e) => e.x === L.n);
      if (dep) throw new Error(`${dep.n} hängt vom Strom von ${L.n} ab: Es kann für das Thévenin-Äquivalent nicht entfernt werden`);
      if (!resto.length || conectado(resto).length || ![a, b].every((n) => resto.some((e) => e.a === n || e.b === n))) throw new Error(`Beim Entfernen von ${L.n} zerfällt die Schaltung: Es gibt kein Thévenin-Äquivalent zwischen ${a} und ${b}`);
    }
    const r = resto.some((e) => e.a === ref || e.b === ref) ? ref : a;
    const ab = nodal(resto, r);
    if (!ab) throw new Error(`${quien} hat das System keine eindeutige Lösung`);
    const Vth = ab.V[a] - ab.V[b];
    const apagado = resto.map((e) => (e.t === 'V' || e.t === 'I' ? { ...e, v: 0 } : e)).concat([{ t: 'I', n: 'Jp', a: b, b: a, v: 1 }]);
    const pr = nodal(apagado, r);
    if (!pr) throw new Error(`Bei abgeschalteten Quellen lässt sich der Thévenin-Widerstand zwischen ${a} und ${b} nicht berechnen`);
    const Rmax = Math.max(1, ...resto.filter((e) => e.t === 'R').map((e) => e.v), L ? L.v : 0), ideal = Math.abs(pr.V[a] - pr.V[b]) < 1e-9 * Rmax;
    const Rth = ideal ? 0 : pr.V[a] - pr.V[b], IN = ideal ? Infinity : Vth / Rth, Pmax = ideal || Rth < 0 ? Infinity : (Vth * Vth) / (4 * Rth);
    return { a, b, Vth, Rth, IN, Pmax, ideal, dep: resto.some((e) => DEPENDIENTE.has(e.t)) };
  }

  function mallas(els, sol) {
    if (els.some((e) => DEPENDIENTE.has(e.t))) return { nota: 'Bei gesteuerten Quellen erfolgt der Rechenweg nur mit dem Knotenpotentialverfahren.' };
    const padre = {}, raiz = (n) => (padre[n] === undefined || padre[n] === n ? n : (padre[n] = raiz(padre[n])));
    const orden = (e) => ({ V: 0, L: 0, R: 1, C: 2, I: 2 }[e.t]), arbol = [], eslabones = [];
    for (const e of [...els].sort((x, y) => orden(x) - orden(y) || x.i - y.i)) {
      const ra = raiz(e.a), rb = raiz(e.b);
      if (ra !== rb) { padre[ra] = rb; arbol.push(e); } else eslabones.push(e);
    }
    if (arbol.some((e) => e.t === 'I' || e.t === 'C')) return { nota: 'Hier lässt sich das Maschenstromverfahren nicht aufstellen: Es gibt Knoten, an denen nur Stromquellen oder Kondensatoren liegen.' };
    eslabones.sort((x, y) => x.i - y.i);
    const camino = (u, w) => {
      const prev = { [u]: null }, cola = [u];
      while (cola.length) { const n = cola.shift(); if (n === w) break; for (const e of arbol) for (const [x, y, s] of [[e.a, e.b, 1], [e.b, e.a, -1]]) if (x === n && !(y in prev)) { prev[y] = [e, s, n]; cola.push(y); } }
      const out = []; for (let n = w; prev[n]; n = prev[n][2]) out.unshift([prev[n][0], prev[n][1]]);
      return out;
    };
    const lazos = eslabones.map((l) => [[l, 1], ...camino(l.b, l.a)]);
    const conocida = eslabones.map((l) => (l.t === 'I' ? l.v : l.t === 'C' ? 0 : null));
    const inc = lazos.map((_, k) => k).filter((k) => conocida[k] === null);
    const sentido = (lz, e) => (lz.find(([x]) => x === e) || [null, 0])[1];
    const A = [], b = [], ecs = [];
    for (const m of inc) {
      const fila = inc.map((k) => lazos[m].filter(([e]) => e.t === 'R').reduce((s, [e, sm]) => s + sm * sentido(lazos[k], e) * e.v, 0));
      let rhs = -lazos[m].filter(([e]) => e.t === 'V').reduce((s, [e, sm]) => s + sm * e.v, 0);
      lazos.forEach((lz, k) => { if (conocida[k] !== null) rhs -= lazos[m].filter(([e]) => e.t === 'R').reduce((s, [e, sm]) => s + sm * sentido(lz, e) * e.v, 0) * conocida[k]; });
      A.push(fila); b.push(rhs);
      const izq = fila.map((v, j) => (Math.abs(v) < 1e-12 ? '' : `${v < 0 ? '−' : '+'} ${Math.abs(Math.abs(v) - 1) < 1e-12 ? '' : `${f(Math.abs(v))}·`}I<sub>${inc[j] + 1}</sub>`)).filter(Boolean);
      ecs.push(`Masche ${m + 1} (${lazos[m].map(([e]) => sub(e.n)).join(' → ')}): ${junta(izq)} = ${f(rhs)}`);
    }
    const x = inc.length ? gauss(A, b) : [];
    if (!x) return { nota: 'Das Maschensystem hat keine eindeutige Lösung.' };
    const Im = lazos.map((_, k) => (conocida[k] !== null ? conocida[k] : x[inc.indexOf(k)]));
    const rama = Object.fromEntries(els.map((e) => [e.n, lazos.reduce((s, lz, k) => s + sentido(lz, e) * Im[k], 0)]));
    const ok = els.every((e) => Math.abs(rama[e.n] - sol.I[e.n]) <= 1e-7 * Math.max(1, Math.abs(sol.I[e.n])));
    return { lazos, conocida, inc, A, b, Im, rama, ok, ecs, ramas: els.length, nudos: sol.nudos.length };
  }

  function resolver(sc) {
    const els = leer(sc);
    const todos = [...new Set(els.flatMap((e) => [e.a, e.b]))];
    const ref = todos.includes('0') ? '0' : todos.includes('tierra') ? 'tierra' : todos[0];
    const sueltos = conectado(els);
    if (sueltos.length) throw new Error(`Die Schaltung ist getrennt: ${sueltos.join(', ')} sind nicht mit dem Rest verbunden`);
    const sol = nodal(els, ref);
    if (!sol) throw new Error(SINGULAR);
    const { V, inc, fuentes } = sol, deps = els.filter((e) => DEPENDIENTE.has(e.t));
    const pasos = [];
    pasos.push({ t: 'Knoten und Bezug', html: `Knoten: ${sol.nudos.map((n) => `<b>${n}</b>`).join(', ')}. Wir nehmen <b>${ref}</b> als Bezug (V = 0)${ref !== '0' ? ', weil es keinen Knoten namens 0 gibt' : ''}.<br>Unbekannte: ${[...inc.map((n) => `V<sub>${n}</sub>`), ...fuentes.map((e) => `I<sub>${e.n}</sub> (Strom durch ${sub(e.n)}, von ${e.a} nach ${e.b}${e.t === 'L' ? '' : ', vom Pluspol zum Minuspol, im Inneren'})`)].join(', ') || 'keine'}.${els.some((e) => e.t === 'C' || e.t === 'L') ? '<br>Im stationären Gleichstromzustand ist ein Kondensator ein Leerlauf (es fließt kein Strom) und eine Spule ein Kurzschluss (Spannung 0).' : ''}` });
    if (deps.length) pasos.push({ t: 'Gesteuerte Quellen', html: deps.map((e) => `${sub(e.n)}: ${e.t[0] === 'V' ? `V<sub>${e.a}</sub> − V<sub>${e.b}</sub>` : `corriente de ${e.a} a ${e.b}`} = ${f(e.v)}·${e.t[1] === 'V' ? `(V<sub>${e.c}</sub> − V<sub>${e.d}</sub>)` : `I<sub>${e.x}</sub>`}`).join('<br>') + (deps.some((e) => e.x) ? '<br>' + [...new Set(deps.filter((e) => e.x).map((e) => e.x))].map((n) => { const c = els.find((e) => e.n === n); return `I<sub>${n}</sub> = ${c.t === 'R' ? `${dif(c.a, c.b, ref)}/${f(c.v)}` : FIJA_TENSION.has(c.t) ? `I<sub>${n}</sub> (ist eine Unbekannte)` : c.t === 'I' ? f(c.v) : c.t === 'C' ? '0' : `la de ${sub(n)}`}`; }).join('<br>') : '') + '<br>Gesteuerte Quellen werden nie abgeschaltet: weder bei Thévenin noch bei der Superposition.' });
    const ecs = inc.map((n) => {
      const t = [], rhs = [];
      for (const e of els) {
        if (e.a !== n && e.b !== n) continue;
        if (e.t === 'I') rhs.push(`${e.a === n ? '−' : '+'} ${f(e.v)}`);
        else { const q = termino(e, n, ref); if (q) t.push(q); }
      }
      return `Knoten ${n}: ${junta(t)} = ${junta(rhs)}`;
    });
    const ecV = fuentes.map((e) => `${sub(e.n)}: ${Vn(e.a, ref)} − ${Vn(e.b, ref)} = ${e.t === 'V' ? f(e.v) : e.t === 'L' ? '0 (cortocircuito)' : e.t === 'VV' ? `${f(e.v)}·${dif(e.c, e.d, ref)}` : `${f(e.v)}·I<sub>${e.x}</sub>`}`.replace(/ − 0 =/, ' =').replace(/^([^:]+): 0 − /, '$1: −'));
    pasos.push({ t: 'Erste Kirchhoffsche Regel an jedem Knoten: Die abfließenden Ströme summieren sich zu dem, was die Stromquellen einspeisen', html: ecs.join('<br>') + (ecV.length ? `<br><br>Jede Spannungsquelle${fuentes.some((e) => e.t === 'L') ? ' und jede Spule' : ''} legt die Potentialdifferenz zwischen ihren Klemmen fest:<br>${ecV.join('<br>')}` : '') });
    if (sol.A.length) {
      const incTxt = [...inc.map((n) => `V<sub>${n}</sub>`), ...fuentes.map((e) => `I<sub>${e.n}</sub>`)];
      pasos.push({ t: 'System in Matrixform', html: `${matHtml(sol.A.map((fi) => fi.map((v) => f(v))))} · ${matHtml(incTxt.map((v) => [v]))} = ${matHtml(sol.b.map((v) => [f(v)]))}` });
      pasos.push({ t: 'Lösung', html: [...inc.map((n) => `V<sub>${n}</sub> = <b>${f(V[n])} V</b>`), ...fuentes.map((e) => `I<sub>${e.n}</sub> = <b>${f(sol.I[e.n])} A</b>`)].join(', &nbsp; ') });
    }
    const res = els.map((e) => {
      const U = V[e.a] - V[e.b], I = sol.I[e.n], P = U * I; // absorbida (negativa = entrega)
      const W = e.t === 'C' ? 0.5 * e.v * U * U : e.t === 'L' ? 0.5 * e.v * I * I : null;
      return { ...e, U, I, P, W };
    });
    const que = (r) => (r.P < -1e-12 ? 'entrega' : r.P > 1e-12 ? 'consume' : 'gibt weder ab noch nimmt auf');
    pasos.push({ t: 'Strom und Leistung jedes Elements', html: res.map((r) => {
      if (r.t === 'R') return `${sub(r.n)}: I = ${dif(r.a, r.b, ref)}/${sub(r.n)} = ${r.b === ref ? p(V[r.a]) : r.a === ref ? `−${p(V[r.b])}` : `(${f(V[r.a])} − ${p(V[r.b])})`}/${f(r.v)} = <b>${f(Math.abs(r.I))} A</b>${Math.abs(r.I) > 1e-12 ? ` von ${r.I > 0 ? r.a : r.b} nach ${r.I > 0 ? r.b : r.a}` : ''}; &nbsp; P = I<sup>2</sup>R = <b>${f(r.P)} W</b>`;
      if (r.t === 'V') return `${sub(r.n)}: I = ${f(r.I)} A ${r.I < -1e-12 ? '(tritt am Pluspol aus)' : r.I > 1e-12 ? '(tritt am Pluspol ein)' : ''}; &nbsp; P = E·I = <b>${f(Math.abs(r.P))} W</b> (${que(r)})`;
      if (r.t === 'C') return `${sub(r.n)}: Es fließt kein Strom; Spannung U = ${dif(r.a, r.b, ref).replace(/^\((.*)\)$/, '$1')} = ${f(r.U)} V, Ladung q = CU = <b>${f(r.v * r.U)} C</b> und Energie ½CU<sup>2</sup> = <b>${f(r.W)} J</b>`;
      if (r.t === 'L') return `${sub(r.n)}: Spannung 0; I = <b>${f(Math.abs(r.I))} A</b>${Math.abs(r.I) > 1e-12 ? ` von ${r.I > 0 ? r.a : r.b} nach ${r.I > 0 ? r.b : r.a}` : ''} und Energie ½LI<sup>2</sup> = <b>${f(r.W)} J</b>`;
      if (r.t === 'VV' || r.t === 'VI') return `${sub(r.n)}: Spannung ${f(r.U)} V, I = ${f(r.I)} A (von ${r.a} nach ${r.b} im Inneren); &nbsp; P = U·I = <b>${f(Math.abs(r.P))} W</b> (${que(r)})`;
      return `${sub(r.n)}: ${r.t === 'I' ? '' : `Strom ${f(r.I)} A; `}Spannung zwischen den Klemmen U = ${Vn(r.a, ref)} − ${Vn(r.b, ref)} = ${f(r.U)} V; &nbsp; P = U·${r.t === 'I' ? 'J' : 'I'} = <b>${f(Math.abs(r.P))} W</b> (${que(r)})`;
    }).join('<br>') });
    const ent = -res.filter((r) => r.P < 0).reduce((s, r) => s + r.P, 0), abs = res.filter((r) => r.P > 0).reduce((s, r) => s + r.P, 0);
    pasos.push({ t: 'Leistungsbilanz', html: `Abgegeben: ${f(ent)} W; &nbsp; aufgenommen: ${f(abs)} W. ${Math.abs(ent - abs) <= 1e-9 * Math.max(1, ent) ? 'Sie stimmen überein, wie es sein muss.' : 'Sie stimmen nicht überein: Prüfe die Daten.'}` });

    let thev = null;
    if (sc.carga === 'nudos') {
      const a = String(sc.thA ?? '').trim(), b = String(sc.thB ?? '').trim();
      if (!sol.nudos.includes(a) || !sol.nudos.includes(b)) throw new Error('Wähle die beiden Knoten, zwischen denen du das Thévenin-Äquivalent willst');
      if (a === b) throw new Error('Das Thévenin-Äquivalent muss zwischen zwei verschiedenen Knoten liegen');
      thev = { ...thevenin(els, a, b, ref, null), carga: null };
      const t = thev;
      pasos.push({ t: `Thévenin-Äquivalent zwischen ${a} und ${b}`, html: `V<sub>th</sub> = V<sub>${a}</sub> − V<sub>${b}</sub> = ${f(V[a])} − ${p(V[b])} = <b>${f(t.Vth)} V</b> (die Leerlaufspannung, also die der Schaltung, so wie sie ist)<br>Bei abgeschalteten unabhängigen Quellen (Spannungsquellen kurzgeschlossen und Stromquellen offen)${t.dep ? ', eingeschalteten gesteuerten Quellen und 1 A, der zwischen die beiden Knoten eingespeist wird' : ''}, ist der Widerstand zwischen ${a} und ${b} R<sub>th</sub> = <b>${f(t.Rth)} Ω</b><br>${t.ideal ? `Bei R<sub>th</sub> = 0 liegt zwischen ${a} und ${b} eine ideale Spannungsquelle: Sie hat kein Norton-Äquivalent.` : `Norton: I<sub>N</sub> = V<sub>th</sub>/R<sub>th</sub> = <b>${f(t.IN)} A</b>${t.Rth > 0 ? `<br>Eine Last zwischen ${a} und ${b} erhält die maximale Leistung, wenn sie R<sub>th</sub> = ${f(t.Rth)} Ω beträgt: P<sub>max</sub> = V<sub>th</sub><sup>2</sup>/(4R<sub>th</sub>) = <b>${f(t.Pmax)} W</b>` : ''}`}` });
    } else if (!vacio(sc.carga)) {
      const L = els[+sc.carga];
      if (!L || L.t !== 'R') throw new Error('Die Last für das Thévenin-Äquivalent muss ein Widerstand sein');
      const t = thevenin(els, L.a, L.b, ref, L), { Vth, Rth, ideal } = t;
      const IL = Vth / (Rth + L.v), PL = IL * IL * L.v;
      thev = { ...t, carga: L.n, RL: L.v, IL, PL };
      pasos.push({ t: `Thévenin-Äquivalent aus Sicht von ${L.n} (zwischen ${L.a} und ${L.b})`, html: `${sub(L.n)} wird entfernt und es wird genauso gelöst: V<sub>th</sub> = V<sub>${L.a}</sub> − V<sub>${L.b}</sub> im Leerlauf = <b>${f(Vth)} V</b><br>Bei abgeschalteten ${t.dep ? 'unabhängigen ' : ''}Quellen (Spannungsquellen kurzgeschlossen und Stromquellen offen)${t.dep ? ' und eingeschalteten gesteuerten Quellen' : ''} ist der Widerstand zwischen ${L.a} und ${L.b} R<sub>th</sub> = <b>${f(Rth)} Ω</b><br>${ideal ? `Bei R<sub>th</sub> = 0 sieht ${sub(L.n)} eine ideale Spannungsquelle: Sie hat kein Norton-Äquivalent, weil I<sub>N</sub> = V<sub>th</sub>/R<sub>th</sub> unendlich wäre.` : `Norton: I<sub>N</sub> = V<sub>th</sub>/R<sub>th</sub> = <b>${f(t.IN)} A</b>`}` });
      pasos.push({ t: 'Mit angeschlossener Last und maximaler Leistungsübertragung', html: `I<sub>${L.n}</sub> = V<sub>th</sub>/(R<sub>th</sub> + ${sub(L.n)}) = ${f(Vth)}/(${f(Rth)} + ${f(L.v)}) = <b>${f(IL)} A</b> (stimmt mit der der vollständigen Schaltung überein); P = <b>${f(PL)} W</b><br>${ideal ? `Bei R<sub>th</sub> = 0 ist die Spannung an der Last immer V<sub>th</sub> und ihre Leistung V<sub>th</sub><sup>2</sup>/${sub(L.n)} wächst unbegrenzt, wenn ${sub(L.n)} sinkt: Es gibt keine maximale Leistungsübertragung.` : Rth < 0 ? 'Bei negativem R<sub>th</sub> (durch die gesteuerten Quellen) gibt es keinen Lastwert, der die maximale Leistung liefert.' : `Die Leistung an der Last ist maximal, wenn ${sub(L.n)} = R<sub>th</sub> = ${f(Rth)} Ω: P<sub>max</sub> = V<sub>th</sub><sup>2</sup>/(4R<sub>th</sub>) = <b>${f(t.Pmax)} W</b>`}` });
    }

    let superposicion = null;
    const indep = els.filter((e) => e.t === 'V' || e.t === 'I');
    if (sc.superposicion && indep.length >= 2) {
      const otros = sol.nudos.filter((n) => n !== ref), rs = els.filter((e) => e.t === 'R');
      const filas = indep.map((s) => {
        const parcial = nodal(els.map((e) => (e !== s && (e.t === 'V' || e.t === 'I') ? { ...e, v: 0 } : e)), ref);
        return { fuente: s.n, V: Object.fromEntries(otros.map((n) => [n, parcial.V[n]])), I: Object.fromEntries(rs.map((e) => [e.n, parcial.I[e.n]])) };
      });
      const total = { V: Object.fromEntries(otros.map((n) => [n, filas.reduce((s, q) => s + q.V[n], 0)])), I: Object.fromEntries(rs.map((e) => [e.n, filas.reduce((s, q) => s + q.I[e.n], 0)])) };
      const ok = otros.every((n) => Math.abs(total.V[n] - V[n]) <= 1e-9 * Math.max(1, Math.abs(V[n])));
      superposicion = { filas, total, ok };
      const cab = [...otros.map((n) => `V<sub>${n}</sub> (V)`), ...rs.map((e) => `I<sub>${e.n}</sub> (A)`)];
      const fila = (t, q) => `<tr><th>${t}</th>${otros.map((n) => `<td>${f(q.V[n])}</td>`).join('')}${rs.map((e) => `<td>${f(q.I[e.n])}</td>`).join('')}</tr>`;
      pasos.push({ t: 'Superposition: jede unabhängige Quelle einzeln', html: `Es wird jeweils nur eine unabhängige Quelle eingeschaltet gelassen (abgeschaltete Spannungsquellen sind ein Kurzschluss und Stromquellen ein Leerlauf${deps.length ? '; die gesteuerten bleiben' : ''}) und die Ergebnisse werden addiert. Die Ströme fließen in jedem Widerstand von A nach B.<div class="tabla-scroll"><table class="tabla"><tr><th>Nur mit</th>${cab.map((c) => `<th>${c}</th>`).join('')}</tr>${filas.map((q) => fila(sub(q.fuente), q)).join('')}${fila('Summe', total)}</table></div>${ok ? 'Die Summe stimmt mit dem Ergebnis der vollständigen Schaltung überein.' : 'Die Summe stimmt nicht überein: Prüfe die Daten.'} Die Leistung lässt sich nicht so addieren, weil sie mit dem Quadrat des Stroms geht.` });
    } else if (sc.superposicion) pasos.push({ t: 'Superposition', html: 'Für die Superposition braucht es mehr als eine unabhängige Quelle.' });

    let malla = null;
    if (sc.mallas) {
      malla = mallas(els, sol);
      if (malla.nota) pasos.push({ t: 'Maschenstromverfahren', html: malla.nota });
      else {
        const m = malla, n = m.lazos.length;
        const conoc = m.lazos.map((lz, k) => (m.conocida[k] !== null ? `I<sub>${k + 1}</sub> = ${f(m.conocida[k])} A (festgelegt durch ${sub(lz[0][0].n)}${lz[0][0].t === 'C' ? ', das keinen Strom durchlässt' : ''})` : '')).filter(Boolean);
        pasos.push({ t: 'Maschenstromverfahren: zweite Kirchhoffsche Regel', html: `Mit ${m.ramas} Elementen und ${m.nudos} Knoten gibt es ${m.ramas} − ${m.nudos} + 1 = <b>${n}</b> unabhängige Maschen. Jede folgt dem angegebenen Umlaufsinn und hat ihren Maschenstrom I<sub>k</sub>; der Strom jedes Elements ist die (vorzeichenbehaftete) Summe der Maschenströme, die es durchlaufen. In jeder Masche summieren sich die Spannungsabfälle R·I zu dem, was die Spannungsquellen liefern:<br>${m.ecs.join('<br>')}${conoc.length ? `<br>${conoc.join('<br>')}` : ''}` });
        if (m.inc.length) pasos.push({ t: 'Maschenströme', html: `${matHtml(m.A.map((fi) => fi.map((v) => f(v))))} · ${matHtml(m.inc.map((k) => [`I<sub>${k + 1}</sub>`]))} = ${matHtml(m.b.map((v) => [f(v)]))} ⇒ ${m.inc.map((k) => `I<sub>${k + 1}</sub> = <b>${f(m.Im[k])} A</b>`).join(', &nbsp; ')}<br>Strom jedes Elements (von A nach B): ${els.map((e) => `I<sub>${e.n}</sub> = ${f(m.rama[e.n])} A`).join(', ')}. ${m.ok ? 'Sie stimmen mit denen des Knotenpotentialverfahrens überein.' : 'Sie stimmen nicht mit denen des Knotenpotentialverfahrens überein: Prüfe die Daten.'}` });
      }
    }
    return { ref, nudos: sol.nudos, V, els: res, ent, abs, thev, superposicion, malla, pasos };
  }

  const R = (a, b, v) => ({ t: 'R', a, b, v }), E = (a, b, v) => ({ t: 'V', a, b, v }), J = (a, b, v) => ({ t: 'I', a, b, v });
  const ejemplos = [
    { clave: 'divisor', nombre: 'Spannungsteiler', sc: { elementos: [E('a', '0', '12'), R('a', 'b', '1000'), R('b', '0', '2000')], carga: '' } },
    { clave: 'dos-mallas', nombre: 'Zwei Maschen mit zwei Quellen', sc: { elementos: [E('a', '0', '10'), R('a', 'b', '2'), R('b', '0', '4'), R('b', 'c', '3'), E('c', '0', '5')], carga: '', mallas: true, superposicion: true } },
    { clave: 'wheatstone', nombre: 'Verstimmte Wheatstone-Brücke', sc: { elementos: [E('a', '0', '10'), R('a', 'b', '100'), R('a', 'c', '150'), R('b', '0', '200'), R('c', '0', '200'), R('b', 'c', '50')], carga: '' } },
    { clave: 'corriente', nombre: 'Mit einer Stromquelle', sc: { elementos: [J('0', 'a', '2'), R('a', '0', '10'), R('a', 'b', '5'), R('b', '0', '5')], carga: '' } },
    { clave: 'mixto', nombre: 'Spannungs- und Stromquelle', sc: { elementos: [E('a', '0', '12'), R('a', 'b', '4'), J('0', 'b', '1'), R('b', '0', '6')], carga: '', superposicion: true, mallas: true } },
    { clave: 'thevenin', nombre: 'Thévenin und maximale Leistung', sc: { elementos: [E('a', '0', '24'), R('a', 'b', '6'), R('b', '0', '3'), R('b', '0', '2')], carga: '3' } },
    { clave: 'thevenin-nudos', nombre: 'Thévenin zwischen zwei Knoten', sc: { elementos: [E('a', '0', '10'), R('a', 'b', '100'), R('a', 'c', '150'), R('b', '0', '200'), R('c', '0', '200')], carga: 'nudos', thA: 'b', thB: 'c' } },
    { clave: 'dependiente', nombre: 'Von einer Spannung gesteuerte Spannungsquelle', sc: { elementos: [E('a', '0', '10'), R('a', 'b', '2'), R('b', '0', '4'), { t: 'VV', a: 'c', b: '0', v: '3', c: 'b', d: '0' }, R('c', '0', '6')], carga: '' } },
    { clave: 'dependiente-corriente', nombre: 'Gesteuerte Stromquelle und Thévenin', sc: { elementos: [E('a', '0', '12'), R('a', 'b', '4'), { t: 'II', a: '0', b: 'b', v: '2', x: 'R1' }, R('b', '0', '8'), R('b', '0', '10')], carga: '3' } },
    { clave: 'condensador', nombre: 'Kondensator und Spule im stationären Zustand', sc: { elementos: [E('a', '0', '12'), R('a', 'b', '4'), { t: 'L', a: 'b', b: 'c', v: '50' }, R('c', '0', '8'), { t: 'C', a: 'b', b: '0', v: '100' }], carga: '' } },
  ];

  return { resolver, nombres, TIPOS, ejemplos, f };
})();

