/* =====================================================================
   Tablas de verdad y puertas lógicas · cálculo (sin DOM).
   Tres modos con el mismo resultado:
     'tabla'   el usuario escribe la tabla de verdad (1 a 5 variables, 1 a 4 salidas,
               con indiferentes X) y sale cada ecuación: minitérminos Σm, maxitérminos ΠM,
               formas canónicas y simplificadas (Quine-McCluskey) y el circuito de puertas.
     'ecuacion' el usuario escribe ecuaciones booleanas (F = A·B + C') y salen la tabla de
               verdad, las mismas ecuaciones y el circuito de la ecuación escrita (o el simplificado).
     'puertas' el usuario añade puertas (AND, OR, NOT, NAND, NOR, XOR, XNOR) con sus
               entradas y marca las salidas; sale la tabla de verdad con todas las puertas
               y las mismas ecuaciones.
   Variables A, B, C, D, E (A es el bit de más peso: la fila i de la tabla es i en binario).
     resolver(sc)  → { modo, n, vars, tabla, salidas, dibujo, mapas, expresiones, pasos }
     ejemplos      [{ clave, nombre, sc }]
     azar()        una tabla de 3 variables al azar para el modo práctica
   El dibujo es un modelo { entradas, nodos, salidas } que dibuja app.js en el lienzo.
   Las ecuaciones salen en HTML (la negación con <span class="n">) y en texto (A').
   La interfaz está en app.js y la prueba en pruebas/herramientas/puertas-logicas.js.
   ===================================================================== */
const PuertasLogicas = (() => {
  const NOM = ['A', 'B', 'C', 'D', 'E'], MAXN = 5, MAXM = 4;
  const TIPOS = {
    AND: (b) => +b.every(Boolean), OR: (b) => +b.some(Boolean), NOT: (b) => +!b[0],
    NAND: (b) => +!b.every(Boolean), NOR: (b) => +!b.some(Boolean),
    XOR: (b) => b.reduce((s, x) => s ^ x, 0), XNOR: (b) => 1 - b.reduce((s, x) => s ^ x, 0),
  };
  const NOMBRES = { AND: 'AND (Y)', OR: 'OR (O)', NOT: 'NOT (NO)', NAND: 'NAND', NOR: 'NOR', XOR: 'XOR', XNOR: 'XNOR' };
  const arid = (t) => (t === 'NOT' ? [1, 1] : [2, 4]);

  /* ---------- Escritura de expresiones ---------- */
  const lit = (k, neg, html) => (neg ? (html ? `<i class="n">${NOM[k]}</i>` : `${NOM[k]}'`) : NOM[k]);
  const ligadura = (html) => (html ? '·' : '·');
  const prod = (ls, html) => (ls.length ? ls.map((l) => lit(l.k, l.neg, html)).join(ligadura(html)) : '1');
  const suma = (ls, html) => (ls.length ? ls.map((l) => lit(l.k, l.neg, html)).join(' + ') : '0');
  const sop = (grupos, html) => (grupos.length ? grupos.map((g) => prod(g, html)).join(' + ') : '0');
  const pos = (grupos, html) => (!grupos.length ? '1' : grupos.map((g) => (grupos.length > 1 && g.length > 1 ? `(${suma(g, html)})` : suma(g, html))).join('·'));
  const ambos = (fn, grupos) => ({ html: fn(grupos, true), txt: fn(grupos, false) });
  const lista = (xs) => xs.join(', ');
  // literales de un implicante (v = valores, m = bits que no aparecen); en suma de productos 1 → A, 0 → A'
  const lits = (imp, n, producto) => {
    const r = [];
    for (let k = 0; k < n; k++) { const b = 1 << (n - 1 - k); if (imp.m & b) continue; const uno = !!(imp.v & b); r.push({ k, neg: producto ? !uno : uno }); }
    return r;
  };
  const patron = (imp, n) => { let s = ''; for (let k = 0; k < n; k++) { const b = 1 << (n - 1 - k); s += imp.m & b ? '-' : imp.v & b ? '1' : '0'; } return s; };
  const bin = (i, n) => i.toString(2).padStart(n, '0');
  const cubreI = (imp, i) => (i & ~imp.m) === imp.v;

  /* ---------- Quine-McCluskey ---------- */
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
  // las variables que aparecen, en orden, para ordenar los términos (A antes que B…)
  const orden = (p, n) => [...Array(n).keys()].map((k) => (p.m & (1 << (n - 1 - k)) ? 'z' : String(k))).join('');
  const pop = (x) => { let c = 0; while (x) { c += x & 1; x >>= 1; } return c; };
  // cubrimiento mínimo de los unos con los primos: esenciales y, para el resto, búsqueda exacta
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

  /* ---------- Análisis de una salida ---------- */
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
      elegidosS: mS.elegidos, elegidosP: mP.elegidos,
      primos: mS.primos.map((p) => ({ pat: patron(p, n), html: prod(lits(p, n, true), true), cubre: p.c.filter((i) => unos.includes(i)), esencial: mS.esenciales.includes(p), elegido: mS.elegidos.includes(p) })),
      sumM: unos.length ? `Σm(${lista(unos)})` : 'Σm( )', prodM: ceros.length ? `ΠM(${lista(ceros)})` : 'ΠM( )',
      constante: !unos.length && !indif.length ? 0 : !ceros.length && !indif.length ? 1 : null,
    };
  }

  /* ---------- Circuito normal: de las ecuaciones simplificadas a puertas ---------- */
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

  /* ---------- Circuito de puertas escrito a mano ---------- */
  // prioridad: 4 = átomo o con barra, 3 = AND, 2 = XOR, 1 = OR
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
  // comprueba las puertas y las devuelve en orden de cálculo (una puerta después de las que la alimentan)
  function ordena(sc, n) {
    const ps = sc.puertas;
    if (!Array.isArray(ps) || !ps.length) throw new Error('Añade al menos una puerta');
    const por = new Map(), ent = new Set(NOM.slice(0, n));
    for (const p of ps) {
      if (!TIPOS[p.tipo]) throw new Error(`La puerta ${p.id} tiene un tipo que no existe`);
      const [a, b] = arid(p.tipo);
      if (!Array.isArray(p.e) || p.e.length < a || p.e.length > b) throw new Error(`La puerta ${p.id} (${p.tipo}) necesita entre ${a} y ${b} entradas`);
      if (ent.has(p.id) || por.has(p.id)) throw new Error(`El nombre ${p.id} está repetido`);
      por.set(p.id, p);
    }
    const orden = [], estado = new Map();
    const visita = (p) => {
      if (estado.get(p.id) === 2) return;
      if (estado.get(p.id) === 1) throw new Error(`Hay un lazo: la puerta ${p.id} depende de sí misma`);
      estado.set(p.id, 1);
      for (const e of p.e) {
        if (!e) throw new Error(`La puerta ${p.id} tiene entradas sin conectar`);
        if (ent.has(e)) continue;
        if (!por.has(e)) throw new Error(`La puerta ${p.id} usa «${e}», que no es una entrada ni una puerta`);
        visita(por.get(e));
      }
      estado.set(p.id, 2); orden.push(p);
    };
    ps.forEach(visita);
    if (!ps.some((p) => p.sal)) throw new Error('Marca al menos una puerta como salida');
    return orden;
  }

  /* ---------- Mapa de Karnaugh ---------- */
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

  /* ---------- Ecuaciones escritas a mano ---------- */
  // Una ecuación por línea: «F = A·B + C'». Negación: ' ! ~ ¬; Y: · * & . ∧ o variables juntas (AB);
  // O: + | ∨; XOR: ⊕ ^. Prioridad: NOT, Y, XOR, O. Nodos: {t:'v',k} {t:'c',v} {t:'n',x} {t:'&'|'|'|'^',xs}
  const OPS_Y = '·*&.∧×', OPS_O = '+|∨', OPS_X = '⊕^', OPS_N = '!~¬';
  function lee(txt, num) {
    const err = (m) => new Error(`Ecuación ${num}: ${m}`);
    const toks = [];
    for (const c of String(txt)) {
      if (/\s/.test(c)) continue;
      if (/[A-Za-z]/.test(c)) { const k = NOM.indexOf(c.toUpperCase()); if (k < 0) throw err(`solo se usan las variables A a E y «${c}» no es una`); toks.push({ t: 'v', k }); }
      else if (c === '0' || c === '1') toks.push({ t: 'c', v: +c });
      else if (c === '(' || c === ')') toks.push({ t: c });
      else if (c === "'" || c === '’' || c === '′') toks.push({ t: 'post' });
      else if (OPS_N.includes(c)) toks.push({ t: 'pre' });
      else if (OPS_Y.includes(c)) toks.push({ t: '&' });
      else if (OPS_O.includes(c)) toks.push({ t: '|' });
      else if (OPS_X.includes(c)) toks.push({ t: '^' });
      else throw err(`no entiendo el símbolo «${c}»`);
    }
    let i = 0;
    const empieza = (t) => t && (t.t === 'v' || t.t === 'c' || t.t === '(' || t.t === 'pre');
    const junta = (t, xs) => { const hijos = xs.flatMap((x) => (x.t === t ? x.xs : [x])); return hijos.length === 1 ? hijos[0] : { t, xs: hijos }; };
    function atomo() {
      const t = toks[i++];
      if (!t) throw err('la ecuación termina antes de tiempo');
      if (t.t === 'pre') return { t: 'n', x: atomo() };
      let r;
      if (t.t === 'v') r = { t: 'v', k: t.k };
      else if (t.t === 'c') r = { t: 'c', v: t.v };
      else if (t.t === '(') { r = o(); if (!toks[i] || toks[i].t !== ')') throw err('falta cerrar un paréntesis'); i++; }
      else throw err('falta una variable antes de un operador');
      while (toks[i] && toks[i].t === 'post') { i++; r = { t: 'n', x: r }; }
      return r;
    }
    function y() { const xs = [atomo()]; while (toks[i] && (toks[i].t === '&' || empieza(toks[i]))) { if (toks[i].t === '&') i++; xs.push(atomo()); } return junta('&', xs); }
    function x() { const xs = [y()]; while (toks[i] && toks[i].t === '^') { i++; xs.push(y()); } return junta('^', xs); }
    function o() { const xs = [x()]; while (toks[i] && toks[i].t === '|') { i++; xs.push(x()); } return junta('|', xs); }
    if (!toks.length) throw err('está vacía');
    const r = o();
    if (i < toks.length) throw err(toks[i].t === ')' ? 'sobra un paréntesis' : 'no entiendo lo que sigue');
    return r;
  }
  function parseEcuaciones(txt) {
    const lineas = String(txt ?? '').split(/\n|;/).map((l) => l.trim()).filter(Boolean);
    if (!lineas.length) throw new Error('Escribe al menos una ecuación, por ejemplo F = A·B + C\'');
    if (lineas.length > MAXM) throw new Error(`Hay como mucho ${MAXM} ecuaciones`);
    const ecs = lineas.map((l, j) => {
      const m = l.match(/^\s*([^=]*?)\s*=\s*(.*)$/);
      let nombre = null, cuerpo = l;
      if (m) { nombre = m[1]; cuerpo = m[2]; if (!/^[A-Za-z][A-Za-z0-9]*$/.test(nombre) || (nombre.length === 1 && NOM.includes(nombre.toUpperCase()))) throw new Error(`Ecuación ${j + 1}: el nombre de la salida «${nombre}» no vale (usa F, G, Y, F1…; A a E son las variables)`); }
      return { nombre, ast: lee(cuerpo, j + 1) };
    });
    const nombres = ecs.map((e, j) => e.nombre || (ecs.length === 1 ? 'F' : `F${j + 1}`));
    if (new Set(nombres).size !== nombres.length) throw new Error('Dos ecuaciones tienen el mismo nombre de salida');
    ecs.forEach((e, j) => { e.nombre = nombres[j]; });
    return ecs;
  }
  const usadas = (a, set = new Set()) => { if (a.t === 'v') set.add(a.k); else if (a.x) usadas(a.x, set); else (a.xs || []).forEach((q) => usadas(q, set)); return set; };
  const evalAst = (a, i, n) => (a.t === 'v' ? (i >> (n - 1 - a.k)) & 1 : a.t === 'c' ? a.v : a.t === 'n' ? 1 - evalAst(a.x, i, n)
    : a.t === '&' ? +a.xs.every((q) => evalAst(q, i, n)) : a.t === '|' ? +a.xs.some((q) => evalAst(q, i, n)) : a.xs.reduce((s, q) => s ^ evalAst(q, i, n), 0));
  // la ecuación escrita de nuevo, en HTML (barra encima) y en texto
  function escribe(a) {
    const nivel = { '|': 1, '^': 2, '&': 3 };
    if (a.t === 'v') return { h: NOM[a.k], t: NOM[a.k], p: 4 };
    if (a.t === 'c') return { h: String(a.v), t: String(a.v), p: 4 };
    if (a.t === 'n') { const q = escribe(a.x); return { h: `<i class="n">${q.h}</i>`, t: /^[A-E01]$/.test(q.t) ? `${q.t}'` : `(${q.t})'`, p: 4 }; }
    const hs = a.xs.map(escribe), sep = a.t === '&' ? '·' : a.t === '^' ? ' ⊕ ' : ' + ', l = nivel[a.t];
    const par = (q, v) => (q.p < l ? `(${q[v]})` : q[v]);
    return { h: hs.map((q) => par(q, 'h')).join(sep), t: hs.map((q) => par(q, 't')).join(sep), p: l };
  }
  // circuito de la ecuación tal como está escrita: puertas de hasta 4 entradas, en árbol si hay más
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

  /* ---------- Resolver ---------- */
  const entero = (s, a, b, nom) => {
    const x = Number(String(s ?? '').trim());
    if (!Number.isInteger(x) || x < a || x > b) throw new Error(`${nom} debe ser un número entero de ${a} a ${b}`);
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
      n = entero(sc.n, 1, MAXN, 'El número de variables');
      const m = entero(sc.m, 1, MAXM, 'El número de salidas'), N = 1 << n;
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
      pasos.push({ t: 'Ecuaciones leídas', html: dado.map((g) => `<b>${g.nombre}</b> = ${g.h}`).join('<br>') + `<br><span class="nota">Variables: ${NOM.slice(0, n).join(', ')}. Prioridad: NOT, AND, XOR, OR.</span>` });
      pasos.push({ t: 'Tabla de verdad', html: `Se calcula cada ecuación en las ${N} combinaciones de ${NOM.slice(0, n).join(', ')} (de ${'0'.repeat(n)} a ${'1'.repeat(n)}).` });
    } else {
      n = entero(sc.nc, 1, MAXN, 'El número de entradas');
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
      pasos.push({ t: 'Ecuación de cada puerta', html: dado.map((g) => `<b>${g.id}</b> (${g.tipo}) = ${g.h}`).join('<br>') });
      pasos.push({ t: 'Tabla de verdad', html: `Se recorren las ${N} combinaciones de ${NOM.slice(0, n).join(', ')} (de ${'0'.repeat(n)} a ${'1'.repeat(n)}) y se calcula la salida de cada puerta de izquierda a derecha.` });
    }

    const N = 1 << n;
    const salidas = nombres.map((nom, j) => analiza(n, nom, valores[j]));
    const un = n === 1 ? 'la variable' : `las ${n} variables`;

    for (const s of salidas) {
      const f = s.nombre, ind = s.indif.length ? ` (indiferentes: ${lista(s.indif)})` : '';
      pasos.push({ t: `${f}: minitérminos y maxitérminos`, html: `Cada fila es un número en binario con ${un} (A es el bit de más peso). Los minitérminos son las filas donde ${f} = 1: <b>${s.sumM}</b>. Los maxitérminos son las filas donde ${f} = 0: <b>${s.prodM}</b>${ind}.` });
      pasos.push({ t: `${f}: forma canónica`, html: `Suma de minitérminos: ${f} = ${s.canS.html}<br>Producto de maxitérminos: ${f} = ${s.canP.html}<br><span class="nota">Un minitérmino tiene todas las variables, con barra si en esa fila valen 0; un maxitérmino es la suma de todas, con barra si valen 1.</span>` });
      if (s.constante !== null) { pasos.push({ t: `${f}: simplificación`, html: `${f} vale siempre ${s.constante}, así que no hay nada que simplificar: ${f} = ${s.constante}.` }); continue; }
      const filas = s.primos.map((p) => `<tr><td>${p.html}</td><td>${p.pat}</td><td>${lista(p.cubre)}</td><td>${p.esencial ? 'esencial' : p.elegido ? 'elegido' : ''}</td></tr>`).join('');
      pasos.push({ t: `${f}: simplificación (Quine-McCluskey)`, html: `Se agrupan los minitérminos (y los indiferentes) que se diferencian en un solo bit hasta que no se pueden juntar más. Quedan estos implicantes primos:<div class="tabla-scroll"><table class="tabla"><tr><th>Implicante</th><th>Patrón</th><th>Cubre</th><th>Tipo</th></tr>${filas}</table></div>Los esenciales son los únicos que cubren algún minitérmino; se añaden los que faltan para cubrirlos todos con el menor número de términos.` });
      pasos.push({ t: `${f}: resultado simplificado`, html: `Suma de productos: ${f} = ${s.minS.html}<br>Producto de sumas: ${f} = ${s.minP.html}<br><span class="nota">El producto de sumas sale de simplificar los ceros (${f}′) y complementar el resultado con De Morgan.</span>` });
    }

    const dibujo = modo === 'puertas' ? circuito
      : modo === 'ecuacion' && !simp ? dibujoAst(ecs)
      : dibujoNormal(n, salidas.map((s) => ({ nombre: s.nombre, grupos: simp ? (forma === 'sop' ? s.gruposS : s.gruposP) : (forma === 'sop' ? s.gruposCS : s.gruposCP) })), forma);
    if (modo === 'ecuacion') pasos.push({ t: 'Circuito de puertas', html: simp ? `Con la forma simplificada en ${forma === 'sop' ? 'suma de productos' : 'producto de sumas'}.` : 'Cada operación de la ecuación es una puerta (NOT, AND, OR o XOR); si hay más de 4 entradas se encadenan puertas. Pulsa «Simplificar» para el circuito más pequeño.' });
    if (modo === 'tabla') pasos.push({ t: 'Circuito de puertas', html: `Con la forma ${simp ? 'simplificada' : 'canónica'} en ${forma === 'sop' ? 'suma de productos: una puerta AND por cada término y una OR que los suma' : 'producto de sumas: una puerta OR por cada factor y una AND que los multiplica'}. Las variables con barra pasan antes por una puerta NOT.${simp ? '' : " Pulsa «Simplificar» para ver el circuito más pequeño."}` });
    const mapas = n <= MAXN ? salidas.map((s) => ({ nombre: s.nombre, ...karnaugh(n, s.v, simp || modo === 'puertas' ? s.elegidosS : []) })) : [];
    return { modo, forma, simp, n, vars: NOM.slice(0, n), tabla, salidas, dibujo, mapas, dado, pasos };
  }

  /* ---------- Ejemplos ---------- */
  const T = (n, m, tabla) => ({ modo: 'tabla', n: String(n), m: String(m), tabla, forma: 'sop' });
  const P = (nc, puertas) => ({ modo: 'puertas', nc: String(nc), puertas, forma: 'sop' });
  const E = (ec) => ({ modo: 'ecuacion', ec, forma: 'sop' });
  const g = (id, tipo, e, sal) => ({ id, tipo, e, sal: !!sal });
  const ejemplos = [
    { clave: 'mayoria', nombre: 'Mayoría de 3 (votación)', sc: T(3, 1, ['00010111']) },
    { clave: 'semisumador', nombre: 'Semisumador: suma y acarreo', sc: T(2, 2, ['0110', '0001']) },
    { clave: 'sumador', nombre: 'Sumador completo de 1 bit', sc: T(3, 2, ['01101001', '00010111']) },
    { clave: 'primos-bcd', nombre: 'Primo en BCD (con indiferentes)', sc: T(4, 1, ['0011010100XXXXXX']) },
    { clave: 'circ-semisumador', nombre: 'Semisumador con puertas', sc: P(2, [g('P1', 'XOR', ['A', 'B'], 1), g('P2', 'AND', ['A', 'B'], 1)]) },
    { clave: 'circ-mux', nombre: 'Multiplexor 2 a 1 (selector C)', sc: P(3, [g('P1', 'NOT', ['C']), g('P2', 'AND', ['A', 'P1']), g('P3', 'AND', ['B', 'C']), g('P4', 'OR', ['P2', 'P3'], 1)]) },
    { clave: 'ec-mux', nombre: 'Ecuación: multiplexor A·C′ + B·C', sc: E("F = A·C' + B·C") },
    { clave: 'ec-semisumador', nombre: 'Ecuaciones: semisumador (⊕ y ·)', sc: E('S = A ⊕ B\nR = A·B') },
    { clave: 'ec-demorgan', nombre: 'Ecuación: NOR, !(A + B)', sc: E('F = !(A + B)') },
    { clave: 'circ-xor-nand', nombre: 'XOR hecha solo con NAND', sc: P(2, [g('P1', 'NAND', ['A', 'B']), g('P2', 'NAND', ['A', 'P1']), g('P3', 'NAND', ['B', 'P1']), g('P4', 'NAND', ['P2', 'P3'], 1)]) },
  ];

  // una tabla de 3 variables con 3 a 5 unos, sin indiferentes
  function azar() {
    const k = 3 + Math.floor(Math.random() * 3), v = Array(8).fill('0');
    while (v.filter((x) => x === '1').length < k) v[Math.floor(Math.random() * 8)] = '1';
    return T(3, 1, [v.join('')]);
  }

  return { resolver, ejemplos, azar, parseEcuaciones, NOM, NOMBRES, TIPOS, arid, MAXN, MAXM };
})();
if (typeof module !== 'undefined') module.exports = PuertasLogicas;
