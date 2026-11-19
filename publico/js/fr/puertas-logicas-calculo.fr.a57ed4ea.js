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

  const FFS = { D: 'Bascule D', T: 'Bascule T', JK: 'Bascule JK', SR: 'Bascule SR' };
  const ENT = { D: ['D'], T: ['T'], JK: ['J', 'K'], SR: ['S', 'R'] };
  const EXC = {
    D: (q, qn) => [qn],
    T: (q, qn) => [q ^ qn],
    JK: (q, qn) => (q === 0 ? [qn, 2] : [2, 1 - qn]),
    SR: (q, qn) => (q === 0 ? (qn ? [1, 0] : [0, 2]) : (qn ? [2, 0] : [0, 1])),
  };
  function secuencial(sc) {
    const ff = FFS[sc.ff] ? sc.ff : 'D', nb = entero(sc.bits, 1, 4, 'Le nombre de bits'), sube = sc.sentido !== 'baja', ent = ENT[ff];
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
    if (!Array.isArray(ps) || !ps.length) throw new Error('Ajoutez au moins une porte');
    const por = new Map(), ent = new Set(NOM.slice(0, n));
    for (const p of ps) {
      if (!TIPOS[p.tipo]) throw new Error(`La porte ${p.id} a un type qui n'existe pas`);
      const [a, b] = arid(p.tipo);
      if (!Array.isArray(p.e) || p.e.length < a || p.e.length > b) throw new Error(`La porte ${p.id} (${p.tipo}) a besoin de ${a} à ${b} entrées`);
      if (ent.has(p.id) || por.has(p.id)) throw new Error(`Le nom ${p.id} est répété`);
      por.set(p.id, p);
    }
    const orden = [], estado = new Map();
    const visita = (p) => {
      if (estado.get(p.id) === 2) return;
      if (estado.get(p.id) === 1) throw new Error(`Il y a une boucle : la porte ${p.id} dépend d'elle-même`);
      estado.set(p.id, 1);
      for (const e of p.e) {
        if (!e) throw new Error(`La porte ${p.id} a des entrées non connectées`);
        if (ent.has(e)) continue;
        if (!por.has(e)) throw new Error(`La porte ${p.id} utilise « ${e} », qui n'est ni une entrée ni une porte`);
        visita(por.get(e));
      }
      estado.set(p.id, 2); orden.push(p);
    };
    ps.forEach(visita);
    if (!ps.some((p) => p.sal)) throw new Error('Marquez au moins une porte comme sortie');
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
    const err = (m) => new Error(`Équation ${num} : ${m}`);
    const toks = [];
    for (const c of String(txt)) {
      if (/\s/.test(c)) continue;
      if (/[A-Za-z]/.test(c)) { const k = NOM.indexOf(c.toUpperCase()); if (k < 0) throw err(`seules les variables A à E sont utilisées et « ${c} » n'en est pas une`); toks.push({ t: 'v', k }); }
      else if (c === '0' || c === '1') toks.push({ t: 'c', v: +c });
      else if (c === '(' || c === ')') toks.push({ t: c });
      else if (c === "'" || c === '’' || c === '′') toks.push({ t: 'post' });
      else if (OPS_N.includes(c)) toks.push({ t: 'pre' });
      else if (OPS_Y.includes(c)) toks.push({ t: '&' });
      else if (OPS_O.includes(c)) toks.push({ t: '|' });
      else if (OPS_X.includes(c)) toks.push({ t: '^' });
      else throw err(`je ne comprends pas le symbole « ${c} »`);
    }
    let i = 0;
    const empieza = (t) => t && (t.t === 'v' || t.t === 'c' || t.t === '(' || t.t === 'pre');
    const junta = (t, xs) => { const hijos = xs.flatMap((x) => (x.t === t ? x.xs : [x])); return hijos.length === 1 ? hijos[0] : { t, xs: hijos }; };
    function atomo() {
      const t = toks[i++];
      if (!t) throw err('l\'équation se termine trop tôt');
      if (t.t === 'pre') return { t: 'n', x: atomo() };
      let r;
      if (t.t === 'v') r = { t: 'v', k: t.k };
      else if (t.t === 'c') r = { t: 'c', v: t.v };
      else if (t.t === '(') { r = o(); if (!toks[i] || toks[i].t !== ')') throw err('il manque une parenthèse fermante'); i++; }
      else throw err('il manque une variable avant un opérateur');
      while (toks[i] && toks[i].t === 'post') { i++; r = { t: 'n', x: r }; }
      return r;
    }
    function y() { const xs = [atomo()]; while (toks[i] && (toks[i].t === '&' || empieza(toks[i]))) { if (toks[i].t === '&') i++; xs.push(atomo()); } return junta('&', xs); }
    function x() { const xs = [y()]; while (toks[i] && toks[i].t === '^') { i++; xs.push(y()); } return junta('^', xs); }
    function o() { const xs = [x()]; while (toks[i] && toks[i].t === '|') { i++; xs.push(x()); } return junta('|', xs); }
    if (!toks.length) throw err('elle est vide');
    const r = o();
    if (i < toks.length) throw err(toks[i].t === ')' ? 'il y a une parenthèse en trop' : 'je ne comprends pas ce qui suit');
    return r;
  }
  function parseEcuaciones(txt) {
    const lineas = String(txt ?? '').split(/\n|;/).map((l) => l.trim()).filter(Boolean);
    if (!lineas.length) throw new Error('Écrivez au moins une équation, par exemple F = A·B + C\'');
    if (lineas.length > MAXM) throw new Error(`Il y a au plus ${MAXM} équations`);
    const ecs = lineas.map((l, j) => {
      const m = l.match(/^\s*([^=]*?)\s*=\s*(.*)$/);
      let nombre = null, cuerpo = l;
      if (m) { nombre = m[1]; cuerpo = m[2]; if (!/^[A-Za-z][A-Za-z0-9]*$/.test(nombre) || (nombre.length === 1 && NOM.includes(nombre.toUpperCase()))) throw new Error(`Équation ${j + 1} : le nom de la sortie « ${nombre} » n'est pas valable (utilisez F, G, Y, F1… ; A à E sont les variables)`); }
      return { nombre, ast: lee(cuerpo, j + 1) };
    });
    const nombres = ecs.map((e, j) => e.nombre || (ecs.length === 1 ? 'F' : `F${j + 1}`));
    if (new Set(nombres).size !== nombres.length) throw new Error('Deux équations ont le même nom de sortie');
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
    if (!Number.isInteger(x) || x < a || x > b) throw new Error(`${nom} doit être un nombre entier de ${a} à ${b}`);
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
      n = entero(sc.n, 1, MAXN, 'Le nombre de variables');
      const m = entero(sc.m, 1, MAXM, 'Le nombre de sorties'), N = 1 << n;
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
      pasos.push({ t: 'Équations lues', html: dado.map((g) => `<b>${g.nombre}</b> = ${g.h}`).join('<br>') + `<br><span class="nota">Variables : ${NOM.slice(0, n).join(', ')}. Priorité : NOT, AND, XOR, OR.</span>` });
      pasos.push({ t: 'Table de vérité', html: `On calcule chaque équation sur les ${N} combinaisons de ${NOM.slice(0, n).join(', ')} (de ${'0'.repeat(n)} à ${'1'.repeat(n)}).` });
    } else {
      n = entero(sc.nc, 1, MAXN, 'Le nombre d\'entrées');
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
      pasos.push({ t: 'Équation de chaque porte', html: dado.map((g) => `<b>${g.id}</b> (${g.tipo}) = ${g.h}`).join('<br>') });
      pasos.push({ t: 'Table de vérité', html: `On parcourt les ${N} combinaisons de ${NOM.slice(0, n).join(', ')} (de ${'0'.repeat(n)} à ${'1'.repeat(n)}) et on calcule la sortie de chaque porte de gauche à droite.` });
    }

    const N = 1 << n;
    const salidas = nombres.map((nom, j) => analiza(n, nom, valores[j]));
    const un = n === 1 ? 'la variable' : `les ${n} variables`;

    for (const s of salidas) {
      const f = s.nombre, ind = s.indif.length ? ` (indiferentes: ${lista(s.indif)})` : '';
      pasos.push({ t: `${f} : mintermes et maxtermes`, html: `Chaque ligne est un nombre en binaire avec ${un} (A est le bit de poids fort). Les mintermes sont les lignes où ${f} = 1 : <b>${s.sumM}</b>. Les maxtermes sont les lignes où ${f} = 0 : <b>${s.prodM}</b>${ind}.` });
      pasos.push({ t: `${f} : forme canonique`, html: `Somme de mintermes : ${f} = ${s.canS.html}<br>Produit de maxtermes : ${f} = ${s.canP.html}<br><span class="nota">Un minterme contient toutes les variables, avec une barre si elles valent 0 sur cette ligne ; un maxterme est la somme de toutes, avec une barre si elles valent 1.</span>` });
      if (s.constante !== null) { pasos.push({ t: `${f} : simplification`, html: `${f} vaut toujours ${s.constante}, donc il n'y a rien à simplifier : ${f} = ${s.constante}.` }); continue; }
      const filas = s.primos.map((p) => `<tr><td>${p.html}</td><td>${p.pat}</td><td>${lista(p.cubre)}</td><td>${p.esencial ? 'esencial' : p.elegido ? 'elegido' : ''}</td></tr>`).join('');
      pasos.push({ t: `${f} : simplification (Quine-McCluskey)`, html: `On regroupe les mintermes (et les indifférents) qui ne diffèrent que par un seul bit jusqu'à ce qu'on ne puisse plus en regrouper. Il reste ces implicants premiers :<div class="tabla-scroll"><table class="tabla"><tr><th>Implicant</th><th>Motif</th><th>Couvre</th><th>Type</th></tr>${filas}</table></div>Les essentiels sont les seuls à couvrir un minterme ; on ajoute ceux qui manquent pour tous les couvrir avec le moins de termes possible.` });
      pasos.push({ t: `${f} : résultat simplifié`, html: `Somme de produits : ${f} = ${s.minS.html}<br>Produit de sommes : ${f} = ${s.minP.html}<br><span class="nota">Le produit de sommes s'obtient en simplifiant les zéros (${f}′) et en complémentant le résultat avec De Morgan.</span>` });
      { const hz = riesgos(n, s), nd = soloUniversal(s.gruposS, 'NAND'), nr = soloUniversal(s.gruposP, 'NOR');
        pasos.push({ t: `${f} : uniquement avec NAND ou uniquement avec NOR`, html: `Avec deux négations, une somme de produits devient un <b>NAND de NAND</b> : ${f} = ${nd.txt.replace(/·/g, '·')} (${nd.puertas} ${nd.puertas === 1 ? 'porte' : 'portes'}${nd.inversores ? `, en comptant ${nd.inversores} ${nd.inversores === 1 ? 'inverseur' : 'inverseurs'} réalisés avec des NAND` : ''}). Un produit de sommes devient un <b>NOR de NOR</b> : ${f} = ${nr.txt} (${nr.puertas} ${nr.puertas === 1 ? 'porte' : 'portes'}). On utilise le théorème de De Morgan : (X·Y)′ = X′ + Y′.` });
        pasos.push({ t: `${f} : aléas statiques (glitches)`, html: hz.length ? `Dans la somme de produits simplifiée, il y a un <b>aléa statique de 1</b> : lors du passage entre ${hz.map((h) => `${h.i} et ${h.j}`).join(' ; ')}, la sortie devrait rester à 1, mais aucun groupe ne couvre les deux cases et un pic à 0 peut apparaître pendant que l'un s'éteint et que l'autre ne s'allume pas encore. On le corrige en ajoutant le terme de consensus ${hz.map((h) => '<b>' + h.termino + '</b>').join(', ')} (il ne change pas la fonction, mais couvre la transition).` : `La somme de produits simplifiée <b>n'a pas d'aléas statiques de 1</b> : chaque paire de cases voisines à 1 est couverte par un même groupe du tableau de Karnaugh.` });
      }
    }

    const dibujo = modo === 'puertas' ? circuito
      : modo === 'ecuacion' && !simp ? dibujoAst(ecs)
      : dibujoNormal(n, salidas.map((s) => ({ nombre: s.nombre, grupos: simp ? (forma === 'sop' ? s.gruposS : s.gruposP) : (forma === 'sop' ? s.gruposCS : s.gruposCP) })), forma);
    if (modo === 'ecuacion') pasos.push({ t: 'Circuit de portes', html: simp ? `Avec la forme simplifiée en ${forma === 'sop' ? 'somme de produits' : 'produit de sommes'}.` : 'Chaque opération de l\'équation est une porte (NOT, AND, OR ou XOR) ; s\'il y a plus de 4 entrées, on enchaîne des portes. Appuyez sur « Simplifier » pour obtenir le plus petit circuit.' });
    if (modo === 'tabla') pasos.push({ t: 'Circuit de portes', html: `Avec la forme ${simp ? 'simplifiée' : 'canonique'} en ${forma === 'sop' ? 'somme de produits : une porte AND par terme et une porte OR qui les additionne' : 'produit de sommes : une porte OR par facteur et une porte AND qui les multiplie'}. Les variables barrées passent d'abord par une porte NOT.${simp ? '' : " Appuyez sur « Simplifier » pour voir le plus petit circuit."}` });
    const mapas = n <= MAXN ? salidas.map((s) => ({ nombre: s.nombre, ...karnaugh(n, s.v, simp || modo === 'puertas' ? s.elegidosS : []) })) : [];
    return { modo, forma, simp, n, vars: NOM.slice(0, n), tabla, salidas, dibujo, mapas, dado, pasos };
  }

  const T = (n, m, tabla) => ({ modo: 'tabla', n: String(n), m: String(m), tabla, forma: 'sop' });
  const P = (nc, puertas) => ({ modo: 'puertas', nc: String(nc), puertas, forma: 'sop' });
  const E = (ec) => ({ modo: 'ecuacion', ec, forma: 'sop' });
  const g = (id, tipo, e, sal) => ({ id, tipo, e, sal: !!sal });
  const ejemplos = [
    { clave: 'mayoria', nombre: 'Majorité de 3 (vote)', sc: T(3, 1, ['00010111']) },
    { clave: 'semisumador', nombre: 'Demi-additionneur : somme et retenue', sc: T(2, 2, ['0110', '0001']) },
    { clave: 'sumador', nombre: 'Additionneur complet de 1 bit', sc: T(3, 2, ['01101001', '00010111']) },
    { clave: 'primos-bcd', nombre: 'Premier en BCD (avec indifférents)', sc: T(4, 1, ['0011010100XXXXXX']) },
    { clave: 'circ-semisumador', nombre: 'Demi-additionneur avec des portes', sc: P(2, [g('P1', 'XOR', ['A', 'B'], 1), g('P2', 'AND', ['A', 'B'], 1)]) },
    { clave: 'circ-mux', nombre: 'Multiplexeur 2 vers 1 (sélecteur C)', sc: P(3, [g('P1', 'NOT', ['C']), g('P2', 'AND', ['A', 'P1']), g('P3', 'AND', ['B', 'C']), g('P4', 'OR', ['P2', 'P3'], 1)]) },
    { clave: 'ec-mux', nombre: 'Équation : multiplexeur A·C′ + B·C', sc: E("F = A·C' + B·C") },
    { clave: 'ec-semisumador', nombre: 'Équations : demi-additionneur (⊕ et ·)', sc: E('S = A ⊕ B\nR = A·B') },
    { clave: 'ec-demorgan', nombre: 'Équation : NOR, !(A + B)', sc: E('F = !(A + B)') },
    { clave: 'circ-xor-nand', nombre: 'XOR réalisée uniquement avec des NAND', sc: P(2, [g('P1', 'NAND', ['A', 'B']), g('P2', 'NAND', ['A', 'P1']), g('P3', 'NAND', ['B', 'P1']), g('P4', 'NAND', ['P2', 'P3'], 1)]) },
  ];

  function azar() {
    const k = 3 + Math.floor(Math.random() * 3), v = Array(8).fill('0');
    while (v.filter((x) => x === '1').length < k) v[Math.floor(Math.random() * 8)] = '1';
    return T(3, 1, [v.join('')]);
  }

  return { resolver, ejemplos, azar, parseEcuaciones, soloUniversal, riesgos, secuencial, FFS, NOM, NOMBRES, TIPOS, arid, MAXN, MAXM };
})();

