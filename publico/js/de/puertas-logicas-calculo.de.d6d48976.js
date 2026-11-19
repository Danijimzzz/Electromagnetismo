const PuertasLogicas = (() => {
  const NOM = ['A', 'B', 'C', 'D', 'E'], MAXN = 5, MAXM = 4;
  const TIPOS = {
    AND: (b) => +b.every(Boolean), OR: (b) => +b.some(Boolean), NOT: (b) => +!b[0],
    NAND: (b) => +!b.every(Boolean), NOR: (b) => +!b.some(Boolean),
    XOR: (b) => b.reduce((s, x) => s ^ x, 0), XNOR: (b) => 1 - b.reduce((s, x) => s ^ x, 0),
  };
  const NOMBRES = { AND: 'AND (Y)', OR: 'OR (O)', NOT: 'NOT (NO)', NAND: 'NAND', NOR: 'NOR', XOR: 'XOR', XNOR: 'XNOR' };
  const arid = (t) => (t === 'NOT' ? [1, 1] : [2, 4]);

  const lit = (k, neg, html) => (neg ? (html ? `<i class="n">${NOM[k]}</i>` : `${NOM[k]}'`) : NOM[k]);
  const ligadura = (html) => (html ? '·' : '·');
  const prod = (ls, html) => (ls.length ? ls.map((l) => lit(l.k, l.neg, html)).join(ligadura(html)) : '1');
  const suma = (ls, html) => (ls.length ? ls.map((l) => lit(l.k, l.neg, html)).join(' + ') : '0');
  const sop = (grupos, html) => (grupos.length ? grupos.map((g) => prod(g, html)).join(' + ') : '0');
  const pos = (grupos, html) => (!grupos.length ? '1' : grupos.map((g) => (grupos.length > 1 && g.length > 1 ? `(${suma(g, html)})` : suma(g, html))).join('·'));
  const ambos = (fn, grupos) => ({ html: fn(grupos, true), txt: fn(grupos, false) });
  const lista = (xs) => xs.join(', ');
  const lits = (imp, n, producto) => {
    const r = [];
    for (let k = 0; k < n; k++) { const b = 1 << (n - 1 - k); if (imp.m & b) continue; const uno = !!(imp.v & b); r.push({ k, neg: producto ? !uno : uno }); }
    return r;
  };
  const patron = (imp, n) => { let s = ''; for (let k = 0; k < n; k++) { const b = 1 << (n - 1 - k); s += imp.m & b ? '-' : imp.v & b ? '1' : '0'; } return s; };
  const bin = (i, n) => i.toString(2).padStart(n, '0');
  const cubreI = (imp, i) => (i & ~imp.m) === imp.v;

  function primos(unos) {
    let act = new Map(unos.map((i) => [`${i}:0`, { v: i, m: 0, c: [i] }]));
    const res = [];
    while (act.size) {
      const l = [...act.values()], usado = new Set(), sig = new Map();
      for (let a = 0; a < l.length; a++) for (let b = a + 1; b < l.length; b++) {
        const x = l[a], y = l[b], d = x.v ^ y.v;
        if (x.m !== y.m || !d || (d & (d - 1))) continue;
        usado.add(a); usado.add(b);
        const v = x.v & y.v, m = x.m | d, clave = `${v}:${m}`;
        if (!sig.has(clave)) sig.set(clave, { v, m, c: [...new Set([...x.c, ...y.c])].sort((p, q) => p - q) });
      }
      l.forEach((x, i) => { if (!usado.has(i)) res.push(x); });
      act = sig;
    }
    return res;
  }
  const orden = (p, n) => [...Array(n).keys()].map((k) => (p.m & (1 << (n - 1 - k)) ? 'z' : String(k))).join('');
  const pop = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
  function minimiza(n, unos, indif) {
    if (!unos.length) return { primos: [], elegidos: [], esenciales: [] };
    const ps = primos([...unos, ...indif].sort((a, b) => a - b)).filter((p) => p.c.some((i) => unos.includes(i)));
    const esenciales = [];
    for (const i of unos) { const q = ps.filter((p) => cubreI(p, i)); if (q.length === 1 && !esenciales.includes(q[0])) esenciales.push(q[0]); }
    let falta = unos.filter((i) => !esenciales.some((p) => cubreI(p, i)));
    const coste = (sel) => sel.length * 100 + sel.reduce((s, p) => s + n - pop(p.m), 0);
    const busca = (rest, cand) => {
      if (!rest.length) return [];
      let mejor = null, elige = null;
      for (const i of rest) { const q = cand.filter((p) => cubreI(p, i)); if (!elige || q.length < elige.q.length) elige = { i, q }; }
      for (const p of elige.q) {
        const sub = busca(rest.filter((i) => !cubreI(p, i)), cand.filter((x) => x !== p)), sel = [p, ...sub];
        if (!mejor || coste(sel) < coste(mejor)) mejor = sel;
      }
      return mejor || [];
    };
    const resto = busca(falta, ps.filter((p) => !esenciales.includes(p)));
    return { primos: ps, esenciales, elegidos: [...esenciales, ...resto].sort((a, b) => orden(a, n).localeCompare(orden(b, n)) || a.v - b.v) };
  }

  function soloUniversal(grupos, op) {
    const ligadura = op === 'NAND' ? '·' : ' + ', un = (l) => lit(l.k, l.neg, false);
    const compl = new Set(); let puertas = 0;
    const capa1 = grupos.map((g) => {
      if (g.length === 1) { const l = g[0]; if (l.neg) return un({ k: l.k, neg: false }); puertas++; return un({ k: l.k, neg: true }); }   // un literal solo: se invierte (o ya viene invertido)
      g.forEach((l) => { if (l.neg) compl.add(l.k); }); puertas++;
      return `(${g.map(un).join(ligadura)})'`;
    });
    puertas += compl.size + 1;
    const dentro = capa1.join(ligadura);
    return { txt: `(${dentro})'`, puertas, inversores: compl.size, capa1 };
  }
  function riesgos(n, s) {
    const out = [];
    for (const i of s.unos) for (let b = 0; b < n; b++) {
      const j = i ^ (1 << b); if (j < i || !s.unos.includes(j)) continue;
      if (s.elegidosS.some((p) => cubreI(p, i) && cubreI(p, j))) continue;
      const cons = s.primosS.find((p) => cubreI(p, i) && cubreI(p, j));
      out.push({ i, j, termino: cons ? prod(lits(cons, n, true), false) : null });
    }
    const vistos = new Set(); return out.filter((h) => { const k = h.termino; if (vistos.has(k)) return false; vistos.add(k); return true; });
  }

  const FFS = { D: 'D-Flipflop', T: 'T-Flipflop', JK: 'JK-Flipflop', SR: 'SR-Flipflop' };
  const ENT = { D: ['D'], T: ['T'], JK: ['J', 'K'], SR: ['S', 'R'] };
  const EXC = {
    D: (q, qn) => [qn],
    T: (q, qn) => [q ^ qn],
    JK: (q, qn) => (q === 0 ? [qn, 2] : [2, 1 - qn]),
    SR: (q, qn) => (q === 0 ? (qn ? [1, 0] : [0, 2]) : (qn ? [2, 0] : [0, 1])),
  };
  function secuencial(sc) {
    const ff = FFS[sc.ff] ? sc.ff : 'D', nb = entero(sc.bits, 1, 4, 'Die Bitanzahl'), sube = sc.sentido !== 'baja', ent = ENT[ff];
    const x = (v) => (v === 2 ? 'X' : String(v));
    const caract = [];
    if (ff === 'D') for (const d of [0, 1]) caract.push({ ent: [d], q: null, sig: String(d) });
    else if (ff === 'T') for (const q of [0, 1]) for (const t of [0, 1]) caract.push({ ent: [t], q, sig: String(q ^ t) });
    else if (ff === 'JK') for (const q of [0, 1]) for (const j of [0, 1]) for (const k of [0, 1]) caract.push({ ent: [j, k], q, sig: String(j && k ? 1 - q : j ? 1 : k ? 0 : q) });
    else for (const q of [0, 1]) for (const sI of [0, 1]) for (const rI of [0, 1]) caract.push({ ent: [sI, rI], q, sig: sI && rI ? 'X (prohibido)' : String(sI ? 1 : rI ? 0 : q) });
    const trans = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([q, qn]) => ({ q, qn, ent: EXC[ff](q, qn).map(x) }));
    const N = 1 << nb, bitsDe = (e) => e.toString(2).padStart(nb, '0'), sig = (e) => (sube ? (e + 1) % N : (e - 1 + N) % N);
    const estados = [...Array(N).keys()].map((e) => {
      const a = bitsDe(e), b = bitsDe(sig(e));
      return { q: a, sig: b, ex: [...a].map((qa, i) => EXC[ff](+qa, +b[i]).map(x)) };   // ex[i] = entradas del biestable del bit i (el 0 es el de más peso)
    });
    const vars = NOM.slice(0, nb), ecuaciones = [];
    for (let i = 0; i < nb; i++) ent.forEach((nm, c) => {
      const v = [...Array(N).keys()].map((e) => EXC[ff](+bitsDe(e)[i], +bitsDe(sig(e))[i])[c]);
      const an = analiza(nb, `${nm}${nb - 1 - i}`, v);
      ecuaciones.push({ nombre: `${nm}${nb - 1 - i}`, txt: an.constante !== null ? String(an.constante) : an.minS.txt, constante: an.constante, v });
    });
    const secuencia = []; let e = 0; for (let k = 0; k <= N; k++) { secuencia.push(bitsDe(e)); e = sig(e); }
    return { ff, nombre: FFS[ff], nb, sube, entradas: ent, caract, trans, estados, vars: vars.map((v, i) => `${v} = Q${nb - 1 - i}`), ecuaciones, secuencia };
  }

  function analiza(n, nombre, v) {
    const N = 1 << n, todos = [...Array(N).keys()];
    const unos = todos.filter((i) => v[i] === 1), ceros = todos.filter((i) => v[i] === 0), indif = todos.filter((i) => v[i] === 2);
    const grupoCanonS = unos.map((i) => lits({ v: i, m: 0 }, n, true));
    const grupoCanonP = ceros.map((i) => lits({ v: i, m: 0 }, n, false));
    const mS = minimiza(n, unos, indif), mP = minimiza(n, ceros, indif);
    const gS = mS.elegidos.map((p) => lits(p, n, true)), gP = mP.elegidos.map((p) => lits(p, n, false));
    return {
      nombre, v, unos, ceros, indif,
      canS: ambos(sop, grupoCanonS), canP: ambos(pos, grupoCanonP),
      minS: ambos(sop, gS), minP: ambos(pos, gP), gruposS: gS, gruposP: gP, gruposCS: grupoCanonS, gruposCP: grupoCanonP,
      elegidosS: mS.elegidos, elegidosP: mP.elegidos, primosS: mS.primos,
      primos: mS.primos.map((p) => ({ pat: patron(p, n), html: prod(lits(p, n, true), true), cubre: p.c.filter((i) => unos.includes(i)), esencial: mS.esenciales.includes(p), elegido: mS.elegidos.includes(p) })),
      sumM: unos.length ? `Σm(${lista(unos)})` : 'Σm( )', prodM: ceros.length ? `ΠM(${lista(ceros)})` : 'ΠM( )',
      constante: !unos.length && !indif.length ? 0 : !ceros.length && !indif.length ? 1 : null,
    };
  }

  function dibujoNormal(n, sals, forma) {
    const nodos = [], mapa = new Map(), usa = new Set(), consts = new Set();
    const puerta = (tipo, e) => {
      const ee = tipo === 'NOT' ? e : [...e].sort(), clave = `${tipo}:${ee.join(',')}`;
      if (mapa.has(clave)) return mapa.get(clave);
      const id = tipo === 'NOT' ? `N${e[0]}` : `G${nodos.length + 1}`;
      nodos.push({ id, tipo, e: ee }); mapa.set(clave, id); return id;
    };
    const entrada = (k) => { usa.add(k); return NOM[k]; };
    const una = (l) => (l.neg ? puerta('NOT', [entrada(l.k)]) : entrada(l.k));
    const interior = forma === 'sop' ? 'AND' : 'OR', exterior = forma === 'sop' ? 'OR' : 'AND';
    const salidas = sals.map((s) => {
      let cte = null; const hijos = [];
      for (const g of s.grupos) {
        if (!g.length) { cte = forma === 'sop' ? 1 : 0; break; }
        hijos.push(g.length === 1 ? una(g[0]) : puerta(interior, [...new Set(g.map(una))]));
      }
      if (cte === null && !s.grupos.length) cte = forma === 'sop' ? 0 : 1;
      let id;
      if (cte !== null) { consts.add(cte); id = `K${cte}`; } else { const h = [...new Set(hijos)]; id = h.length === 1 ? h[0] : puerta(exterior, h); }
      return { nombre: s.nombre, id };
    });
    const entradas = [...usa].sort().map((k) => ({ id: NOM[k], etq: NOM[k] })).concat([...consts].sort().map((c) => ({ id: `K${c}`, etq: String(c) })));
    return { entradas, nodos, salidas };
  }

  function expresion(c, id, memo = {}) {
    if (memo[id]) return memo[id];
    const g = c.nodos.find((x) => x.id === id);
    let r;
    if (!g) r = { h: id, t: id, p: 4 };
    else {
      const hs = g.e.map((e) => expresion(c, e, memo));
      if (g.tipo === 'NOT') { const x = hs[0]; r = { h: `<i class="n">${x.h}</i>`, t: /^[A-E]$/.test(x.t) ? `${x.t}'` : `(${x.t})'`, p: 4 }; }
      else {
        const nivel = { AND: 3, NAND: 3, XOR: 2, XNOR: 2, OR: 1, NOR: 1 }[g.tipo];
        const sep = nivel === 3 ? '·' : nivel === 2 ? ' ⊕ ' : ' + ', neg = g.tipo[0] === 'N' && g.tipo !== 'NOT' || g.tipo === 'XNOR';
        const h = hs.map((x) => (x.p < nivel ? `(${x.h})` : x.h)).join(sep), t = hs.map((x) => (x.p < nivel ? `(${x.t})` : x.t)).join(sep);
        r = neg ? { h: `<i class="n">${h}</i>`, t: `(${t})'`, p: 4 } : { h, t, p: nivel };
      }
    }
    return (memo[id] = r);
  }
  function evalCircuito(c, n) {
    const N = 1 << n, cols = {};
    for (let k = 0; k < n; k++) cols[NOM[k]] = [...Array(N).keys()].map((i) => (i >> (n - 1 - k)) & 1);
    for (const g of c.nodos) cols[g.id] = [...Array(N).keys()].map((i) => TIPOS[g.tipo](g.e.map((e) => cols[e][i])));
    return cols;
  }
  function ordena(sc, n) {
    const ps = sc.puertas;
    if (!Array.isArray(ps) || !ps.length) throw new Error('Füge mindestens ein Gatter hinzu');
    const por = new Map(), ent = new Set(NOM.slice(0, n));
    for (const p of ps) {
      if (!TIPOS[p.tipo]) throw new Error(`Das Gatter ${p.id} hat einen Typ, der nicht existiert`);
      const [a, b] = arid(p.tipo);
      if (!Array.isArray(p.e) || p.e.length < a || p.e.length > b) throw new Error(`Das Gatter ${p.id} (${p.tipo}) braucht zwischen ${a} und ${b} Eingänge`);
      if (ent.has(p.id) || por.has(p.id)) throw new Error(`Der Name ${p.id} ist doppelt vergeben`);
      por.set(p.id, p);
    }
    const orden = [], estado = new Map();
    const visita = (p) => {
      if (estado.get(p.id) === 2) return;
      if (estado.get(p.id) === 1) throw new Error(`Es gibt eine Schleife: Das Gatter ${p.id} hängt von sich selbst ab`);
      estado.set(p.id, 1);
      for (const e of p.e) {
        if (!e) throw new Error(`Das Gatter ${p.id} hat unverbundene Eingänge`);
        if (ent.has(e)) continue;
        if (!por.has(e)) throw new Error(`Das Gatter ${p.id} verwendet „${e}“, das weder ein Eingang noch ein Gatter ist`);
        visita(por.get(e));
      }
      estado.set(p.id, 2); orden.push(p);
    };
    ps.forEach(visita);
    if (!ps.some((p) => p.sal)) throw new Error('Markiere mindestens ein Gatter als Ausgang');
    return orden;
  }

  function karnaugh(n, v, grupos) {
    const r = n >> 1, c = n - r, gray = (i) => i ^ (i >> 1);
    const nf = 1 << r, nc = 1 << c;
    const rot = (k0, k1) => NOM.slice(k0, k1).join('');
    const filas = [...Array(nf).keys()].map((i) => bin(gray(i), r)), cols = [...Array(nc).keys()].map((i) => bin(gray(i), c));
    const celdas = filas.map((fr) => cols.map((cc) => {
      const idx = parseInt(fr + cc, 2), cub = (grupos || []).filter((g) => cubreI(g, idx)).length;
      return { i: idx, v: v[idx], cub };
    }));
    return { rotulo: `${rot(0, r) || ''}\\${rot(r, n)}`, filas: r ? filas : [''], cols, celdas: r ? celdas : [celdas[0]] };
  }

  const OPS_Y = '·*&.∧×', OPS_O = '+|∨', OPS_X = '⊕^', OPS_N = '!~¬';
  function lee(txt, num) {
    const err = (m) => new Error(`Gleichung ${num}: ${m}`);
    const toks = [];
    for (const c of String(txt)) {
      if (/\s/.test(c)) continue;
      if (/[A-Za-z]/.test(c)) { const k = NOM.indexOf(c.toUpperCase()); if (k < 0) throw err(`es werden nur die Variablen A bis E verwendet, und „${c}“ ist keine davon`); toks.push({ t: 'v', k }); }
      else if (c === '0' || c === '1') toks.push({ t: 'c', v: +c });
      else if (c === '(' || c === ')') toks.push({ t: c });
      else if (c === "'" || c === '’' || c === '′') toks.push({ t: 'post' });
      else if (OPS_N.includes(c)) toks.push({ t: 'pre' });
      else if (OPS_Y.includes(c)) toks.push({ t: '&' });
      else if (OPS_O.includes(c)) toks.push({ t: '|' });
      else if (OPS_X.includes(c)) toks.push({ t: '^' });
      else throw err(`ich verstehe das Symbol „${c}“ nicht`);
    }
    let i = 0;
    const empieza = (t) => t && (t.t === 'v' || t.t === 'c' || t.t === '(' || t.t === 'pre');
    const junta = (t, xs) => { const hijos = xs.flatMap((x) => (x.t === t ? x.xs : [x])); return hijos.length === 1 ? hijos[0] : { t, xs: hijos }; };
    function atomo() {
      const t = toks[i++];
      if (!t) throw err('die Gleichung endet zu früh');
      if (t.t === 'pre') return { t: 'n', x: atomo() };
      let r;
      if (t.t === 'v') r = { t: 'v', k: t.k };
      else if (t.t === 'c') r = { t: 'c', v: t.v };
      else if (t.t === '(') { r = o(); if (!toks[i] || toks[i].t !== ')') throw err('eine Klammer wurde nicht geschlossen'); i++; }
      else throw err('vor einem Operator fehlt eine Variable');
      while (toks[i] && toks[i].t === 'post') { i++; r = { t: 'n', x: r }; }
      return r;
    }
    function y() { const xs = [atomo()]; while (toks[i] && (toks[i].t === '&' || empieza(toks[i]))) { if (toks[i].t === '&') i++; xs.push(atomo()); } return junta('&', xs); }
    function x() { const xs = [y()]; while (toks[i] && toks[i].t === '^') { i++; xs.push(y()); } return junta('^', xs); }
    function o() { const xs = [x()]; while (toks[i] && toks[i].t === '|') { i++; xs.push(x()); } return junta('|', xs); }
    if (!toks.length) throw err('sie ist leer');
    const r = o();
    if (i < toks.length) throw err(toks[i].t === ')' ? 'eine Klammer zu viel' : 'ich verstehe nicht, was folgt');
    return r;
  }
  function parseEcuaciones(txt) {
    const lineas = String(txt ?? '').split(/\n|;/).map((l) => l.trim()).filter(Boolean);
    if (!lineas.length) throw new Error('Schreibe mindestens eine Gleichung, zum Beispiel F = A·B + C\'');
    if (lineas.length > MAXM) throw new Error(`Es gibt höchstens ${MAXM} Gleichungen`);
    const ecs = lineas.map((l, j) => {
      const m = l.match(/^\s*([^=]*?)\s*=\s*(.*)$/);
      let nombre = null, cuerpo = l;
      if (m) { nombre = m[1]; cuerpo = m[2]; if (!/^[A-Za-z][A-Za-z0-9]*$/.test(nombre) || (nombre.length === 1 && NOM.includes(nombre.toUpperCase()))) throw new Error(`Gleichung ${j + 1}: Der Name des Ausgangs „${nombre}“ ist ungültig (verwende F, G, Y, F1 …; A bis E sind die Variablen)`); }
      return { nombre, ast: lee(cuerpo, j + 1) };
    });
    const nombres = ecs.map((e, j) => e.nombre || (ecs.length === 1 ? 'F' : `F${j + 1}`));
    if (new Set(nombres).size !== nombres.length) throw new Error('Zwei Gleichungen haben denselben Ausgangsnamen');
    ecs.forEach((e, j) => { e.nombre = nombres[j]; });
    return ecs;
  }
  const usadas = (a, set = new Set()) => { if (a.t === 'v') set.add(a.k); else if (a.x) usadas(a.x, set); else (a.xs || []).forEach((q) => usadas(q, set)); return set; };
  const evalAst = (a, i, n) => (a.t === 'v' ? (i >> (n - 1 - a.k)) & 1 : a.t === 'c' ? a.v : a.t === 'n' ? 1 - evalAst(a.x, i, n)
    : a.t === '&' ? +a.xs.every((q) => evalAst(q, i, n)) : a.t === '|' ? +a.xs.some((q) => evalAst(q, i, n)) : a.xs.reduce((s, q) => s ^ evalAst(q, i, n), 0));
  function escribe(a) {
    const nivel = { '|': 1, '^': 2, '&': 3 };
    if (a.t === 'v') return { h: NOM[a.k], t: NOM[a.k], p: 4 };
    if (a.t === 'c') return { h: String(a.v), t: String(a.v), p: 4 };
    if (a.t === 'n') { const q = escribe(a.x); return { h: `<i class="n">${q.h}</i>`, t: /^[A-E01]$/.test(q.t) ? `${q.t}'` : `(${q.t})'`, p: 4 }; }
    const hs = a.xs.map(escribe), sep = a.t === '&' ? '·' : a.t === '^' ? ' ⊕ ' : ' + ', l = nivel[a.t];
    const par = (q, v) => (q.p < l ? `(${q[v]})` : q[v]);
    return { h: hs.map((q) => par(q, 'h')).join(sep), t: hs.map((q) => par(q, 't')).join(sep), p: l };
  }
  function dibujoAst(ecs) {
    const nodos = [], mapa = new Map(), usa = new Set(), consts = new Set();
    const puerta = (tipo, e) => {
      const ee = tipo === 'NOT' ? e : [...e].sort(), clave = `${tipo}:${ee.join(',')}`;
      if (mapa.has(clave)) return mapa.get(clave);
      const id = `G${nodos.length + 1}`; nodos.push({ id, tipo, e: ee }); mapa.set(clave, id); return id;
    };
    const TIPO = { '&': 'AND', '|': 'OR', '^': 'XOR' };
    const crea = (a) => {
      if (a.t === 'v') { usa.add(a.k); return NOM[a.k]; }
      if (a.t === 'c') { consts.add(a.v); return `K${a.v}`; }
      if (a.t === 'n') return puerta('NOT', [crea(a.x)]);
      let ids = a.xs.map(crea);
      while (ids.length > 4) ids = [puerta(TIPO[a.t], ids.slice(0, 4)), ...ids.slice(4)];
      return puerta(TIPO[a.t], ids);
    };
    const salidas = ecs.map((e) => ({ nombre: e.nombre, id: crea(e.ast) }));
    const entradas = [...usa].sort().map((k) => ({ id: NOM[k], etq: NOM[k] })).concat([...consts].sort().map((c) => ({ id: `K${c}`, etq: String(c) })));
    return { entradas, nodos, salidas };
  }

  const entero = (s, a, b, nom) => {
    const x = Number(String(s ?? '').trim());
    if (!Number.isInteger(x) || x < a || x > b) throw new Error(`${nom} muss eine ganze Zahl von ${a} bis ${b} sein`);
    return x;
  };
  const nombresSal = (m) => (m === 1 ? ['F'] : [...Array(m).keys()].map((i) => `F${i + 1}`));

  function resolver(sc) {
    const modo = sc.modo === 'puertas' ? 'puertas' : sc.modo === 'ecuacion' ? 'ecuacion' : 'tabla';
    let ecs = null;
    const forma = sc.forma === 'pos' ? 'pos' : 'sop', simp = !!sc.simp;
    const pasos = [];
    let n, nombres, valores, tabla, circuito = null, dado = null;

    if (modo === 'tabla') {
      n = entero(sc.n, 1, MAXN, 'Die Anzahl der Variablen');
      const m = entero(sc.m, 1, MAXM, 'Die Anzahl der Ausgänge'), N = 1 << n;
      nombres = nombresSal(m);
      valores = nombres.map((_, j) => {
        const s = String((sc.tabla || [])[j] ?? '').toUpperCase().replace(/[^01X]/g, '').padEnd(N, '0').slice(0, N);
        return [...s].map((c) => (c === 'X' ? 2 : +c));
      });
      tabla = { cab: [...NOM.slice(0, n), ...nombres], filas: [...Array(N).keys()].map((i) => [...bin(i, n)].map(Number).concat(valores.map((v) => v[i]))) };
    } else if (modo === 'ecuacion') {
      ecs = parseEcuaciones(sc.ec);
      const vs = new Set(); ecs.forEach((e) => usadas(e.ast, vs));
      n = vs.size ? Math.max(...vs) + 1 : 1;  // sin variables (F = 1) se usa A solo para tener tabla
      const N = 1 << n; nombres = ecs.map((e) => e.nombre);
      valores = ecs.map((e) => [...Array(N).keys()].map((i) => evalAst(e.ast, i, n)));
      tabla = { cab: [...NOM.slice(0, n), ...nombres], filas: [...Array(N).keys()].map((i) => [...bin(i, n)].map(Number).concat(valores.map((v) => v[i]))), nSal: nombres.map((_, j) => n + j) };
      dado = ecs.map((e) => ({ nombre: e.nombre, ...escribe(e.ast) }));
      pasos.push({ t: 'Gelesene Gleichungen', html: dado.map((g) => `<b>${g.nombre}</b> = ${g.h}`).join('<br>') + `<br><span class="nota">Variablen: ${NOM.slice(0, n).join(', ')}. Priorität: NOT, AND, XOR, OR.</span>` });
      pasos.push({ t: 'Wahrheitstabelle', html: `Jede Gleichung wird für die ${N} Kombinationen von ${NOM.slice(0, n).join(', ')} berechnet (von ${'0'.repeat(n)} bis ${'1'.repeat(n)}).` });
    } else {
      n = entero(sc.nc, 1, MAXN, 'Die Anzahl der Eingänge');
      const orden = ordena(sc, n);
      const nodos = orden.map((p) => ({ id: p.id, tipo: p.tipo, e: [...p.e], etq: p.id }));
      const sal = sc.puertas.filter((p) => p.sal);  // F, F2… por el orden en que se crearon
      nombres = nombresSal(sal.length);
      circuito = { entradas: NOM.slice(0, n).map((x) => ({ id: x, etq: x })), nodos, salidas: sal.map((p, j) => ({ nombre: nombres[j], id: p.id })) };
      const cols = evalCircuito(circuito, n), N = 1 << n;
      valores = sal.map((p) => cols[p.id]);
      const ids = [...NOM.slice(0, n), ...nodos.map((g) => g.id)];
      tabla = { cab: ids.concat([]), filas: [...Array(N).keys()].map((i) => ids.map((id) => cols[id][i])), nSal: sal.map((p) => ids.indexOf(p.id)), nombresSal: nombres };
      dado = nodos.map((g) => ({ id: g.id, tipo: g.tipo, ...expresion(circuito, g.id) }));
      pasos.push({ t: 'Gleichung jedes Gatters', html: dado.map((g) => `<b>${g.id}</b> (${g.tipo}) = ${g.h}`).join('<br>') });
      pasos.push({ t: 'Wahrheitstabelle', html: `Die ${N} Kombinationen von ${NOM.slice(0, n).join(', ')} werden durchlaufen (von ${'0'.repeat(n)} bis ${'1'.repeat(n)}) und der Ausgang jedes Gatters wird von links nach rechts berechnet.` });
    }

    const N = 1 << n;
    const salidas = nombres.map((nom, j) => analiza(n, nom, valores[j]));
    const un = n === 1 ? 'die Variable' : `die ${n} Variablen`;

    for (const s of salidas) {
      const f = s.nombre, ind = s.indif.length ? ` (indiferentes: ${lista(s.indif)})` : '';
      pasos.push({ t: `${f}: Minterme und Maxterme`, html: `Jede Zeile ist eine Binärzahl mit ${un} (A ist das höchstwertige Bit). Die Minterme sind die Zeilen, in denen ${f} = 1 ist: <b>${s.sumM}</b>. Die Maxterme sind die Zeilen, in denen ${f} = 0 ist: <b>${s.prodM}</b>${ind}.` });
      pasos.push({ t: `${f}: kanonische Form`, html: `Summe der Minterme: ${f} = ${s.canS.html}<br>Produkt der Maxterme: ${f} = ${s.canP.html}<br><span class="nota">Ein Minterm enthält alle Variablen, negiert, wenn sie in dieser Zeile 0 sind; ein Maxterm ist die Summe aller, negiert, wenn sie 1 sind.</span>` });
      if (s.constante !== null) { pasos.push({ t: `${f}: Vereinfachung`, html: `${f} ist immer ${s.constante}, es gibt also nichts zu vereinfachen: ${f} = ${s.constante}.` }); continue; }
      const filas = s.primos.map((p) => `<tr><td>${p.html}</td><td>${p.pat}</td><td>${lista(p.cubre)}</td><td>${p.esencial ? 'esencial' : p.elegido ? 'elegido' : ''}</td></tr>`).join('');
      pasos.push({ t: `${f}: Vereinfachung (Quine-McCluskey)`, html: `Es werden die Minterme (und die Don't-Care-Terme), die sich in nur einem Bit unterscheiden, so lange zusammengefasst, bis es nicht mehr geht. Es bleiben diese Primimplikanten:<div class="tabla-scroll"><table class="tabla"><tr><th>Implikant</th><th>Muster</th><th>Deckt ab</th><th>Typ</th></tr>${filas}</table></div>Die wesentlichen sind die einzigen, die einen bestimmten Minterm abdecken; es werden die fehlenden hinzugefügt, um alle mit der geringsten Anzahl an Termen abzudecken.` });
      pasos.push({ t: `${f}: vereinfachtes Ergebnis`, html: `Summe von Produkten: ${f} = ${s.minS.html}<br>Produkt von Summen: ${f} = ${s.minP.html}<br><span class="nota">Das Produkt von Summen ergibt sich, indem man die Nullen (${f}′) vereinfacht und das Ergebnis mit De Morgan komplementiert.</span>` });
      { const hz = riesgos(n, s), nd = soloUniversal(s.gruposS, 'NAND'), nr = soloUniversal(s.gruposP, 'NOR');
        pasos.push({ t: `${f}: nur mit NAND oder nur mit NOR`, html: `Mit zwei Negationen ist eine Summe von Produkten ein <b>NAND von NANDs</b>: ${f} = ${nd.txt.replace(/·/g, '·')} (${nd.puertas} ${nd.puertas === 1 ? 'Gatter' : 'Gatter'}${nd.inversores ? `, einschließlich ${nd.inversores} ${nd.inversores === 1 ? 'Inverter' : 'Inverter'} aus NAND` : ''}). Ein Produkt von Summen ist ein <b>NOR von NORs</b>: ${f} = ${nr.txt} (${nr.puertas} ${nr.puertas === 1 ? 'Gatter' : 'Gatter'}). Dabei wird der Satz von De Morgan verwendet: (X·Y)′ = X′ + Y′.` });
        pasos.push({ t: `${f}: statische Hazards (Glitches)`, html: hz.length ? `In der vereinfachten Summe von Produkten gibt es einen <b>statischen 1-Hazard</b>: Beim Wechsel zwischen ${hz.map((h) => `${h.i} und ${h.j}`).join('; ')} sollte der Ausgang auf 1 bleiben, aber keine Gruppe deckt beide Felder ab, und es kann eine Spitze auf 0 auftreten, während die eine ausgeht und die andere noch nicht angeht. Behoben wird das durch Hinzufügen des Konsensterms ${hz.map((h) => '<b>' + h.termino + '</b>').join(', ')} (er ändert die Funktion nicht, deckt aber den Wechsel ab).` : `Die vereinfachte Summe von Produkten hat <b>keine statischen 1-Hazards</b>: Jedes Paar benachbarter Felder mit 1 wird von derselben Gruppe des Karnaugh-Diagramms abgedeckt.` });
      }
    }

    const dibujo = modo === 'puertas' ? circuito
      : modo === 'ecuacion' && !simp ? dibujoAst(ecs)
      : dibujoNormal(n, salidas.map((s) => ({ nombre: s.nombre, grupos: simp ? (forma === 'sop' ? s.gruposS : s.gruposP) : (forma === 'sop' ? s.gruposCS : s.gruposCP) })), forma);
    if (modo === 'ecuacion') pasos.push({ t: 'Gatterschaltung', html: simp ? `Mit der vereinfachten Form als ${forma === 'sop' ? 'Summe von Produkten' : 'Produkt von Summen'}.` : 'Jede Operation der Gleichung ist ein Gatter (NOT, AND, OR oder XOR); bei mehr als 4 Eingängen werden Gatter verkettet. Klicke auf „Vereinfachen“ für die kleinste Schaltung.' });
    if (modo === 'tabla') pasos.push({ t: 'Gatterschaltung', html: `Mit der ${simp ? 'vereinfachten' : 'kanonischen'} Form als ${forma === 'sop' ? 'Summe von Produkten: ein AND-Gatter für jeden Term und ein OR, das sie addiert' : 'Produkt von Summen: ein OR-Gatter für jeden Faktor und ein AND, das sie multipliziert'}. Negierte Variablen laufen zuvor durch ein NOT-Gatter.${simp ? '' : " Klicke auf „Vereinfachen“, um die kleinste Schaltung zu sehen."}` });
    const mapas = n <= MAXN ? salidas.map((s) => ({ nombre: s.nombre, ...karnaugh(n, s.v, simp || modo === 'puertas' ? s.elegidosS : []) })) : [];
    return { modo, forma, simp, n, vars: NOM.slice(0, n), tabla, salidas, dibujo, mapas, dado, pasos };
  }

  const T = (n, m, tabla) => ({ modo: 'tabla', n: String(n), m: String(m), tabla, forma: 'sop' });
  const P = (nc, puertas) => ({ modo: 'puertas', nc: String(nc), puertas, forma: 'sop' });
  const E = (ec) => ({ modo: 'ecuacion', ec, forma: 'sop' });
  const g = (id, tipo, e, sal) => ({ id, tipo, e, sal: !!sal });
  const ejemplos = [
    { clave: 'mayoria', nombre: 'Mehrheit aus 3 (Abstimmung)', sc: T(3, 1, ['00010111']) },
    { clave: 'semisumador', nombre: 'Halbaddierer: Summe und Übertrag', sc: T(2, 2, ['0110', '0001']) },
    { clave: 'sumador', nombre: '1-Bit-Volladdierer', sc: T(3, 2, ['01101001', '00010111']) },
    { clave: 'primos-bcd', nombre: 'Primzahl in BCD (mit Don\'t-Care)', sc: T(4, 1, ['0011010100XXXXXX']) },
    { clave: 'circ-semisumador', nombre: 'Halbaddierer mit Gattern', sc: P(2, [g('P1', 'XOR', ['A', 'B'], 1), g('P2', 'AND', ['A', 'B'], 1)]) },
    { clave: 'circ-mux', nombre: '2-zu-1-Multiplexer (Wähler C)', sc: P(3, [g('P1', 'NOT', ['C']), g('P2', 'AND', ['A', 'P1']), g('P3', 'AND', ['B', 'C']), g('P4', 'OR', ['P2', 'P3'], 1)]) },
    { clave: 'ec-mux', nombre: 'Gleichung: Multiplexer A·C′ + B·C', sc: E("F = A·C' + B·C") },
    { clave: 'ec-semisumador', nombre: 'Gleichungen: Halbaddierer (⊕ und ·)', sc: E('S = A ⊕ B\nR = A·B') },
    { clave: 'ec-demorgan', nombre: 'Gleichung: NOR, !(A + B)', sc: E('F = !(A + B)') },
    { clave: 'circ-xor-nand', nombre: 'XOR nur aus NAND gebaut', sc: P(2, [g('P1', 'NAND', ['A', 'B']), g('P2', 'NAND', ['A', 'P1']), g('P3', 'NAND', ['B', 'P1']), g('P4', 'NAND', ['P2', 'P3'], 1)]) },
  ];

  function azar() {
    const k = 3 + Math.floor(Math.random() * 3), v = Array(8).fill('0');
    while (v.filter((x) => x === '1').length < k) v[Math.floor(Math.random() * 8)] = '1';
    return T(3, 1, [v.join('')]);
  }

  return { resolver, ejemplos, azar, parseEcuaciones, soloUniversal, riesgos, secuencial, FFS, NOM, NOMBRES, TIPOS, arid, MAXN, MAXM };
})();

