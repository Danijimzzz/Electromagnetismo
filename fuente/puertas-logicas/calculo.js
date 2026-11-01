/* =====================================================================
   Tablas de verdad y puertas lógicas · cálculo (sin DOM).
   Dos modos con el mismo resultado:
     'tabla'   el usuario escribe la tabla de verdad (1 a 5 variables, 1 a 4 salidas,
               con indiferentes X) y sale cada ecuación: minitérminos Σm, maxitérminos ΠM,
               formas canónicas y simplificadas (Quine-McCluskey) y el circuito de puertas.
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
      minS: ambos(sop, gS), minP: ambos(pos, gP), gruposS: gS, gruposP: gP,
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
  function validaPuertas(sc, n) {
    const ps = sc.puertas;
    if (!Array.isArray(ps) || !ps.length) throw new Error('Añade al menos una puerta');
    const vistos = new Set(NOM.slice(0, n));
    for (const p of ps) {
      if (!TIPOS[p.tipo]) throw new Error(`La puerta ${p.id} tiene un tipo que no existe`);
      const [a, b] = arid(p.tipo);
      if (!Array.isArray(p.e) || p.e.length < a || p.e.length > b) throw new Error(`La puerta ${p.id} (${p.tipo}) necesita entre ${a} y ${b} entradas`);
      for (const e of p.e) if (!vistos.has(e)) throw new Error(`La puerta ${p.id} usa «${e}», que no es una entrada ni una puerta anterior`);
      if (vistos.has(p.id)) throw new Error(`El nombre ${p.id} está repetido`);
      vistos.add(p.id);
    }
    if (!ps.some((p) => p.sal)) throw new Error('Marca al menos una puerta como salida');
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

  /* ---------- Resolver ---------- */
  const entero = (s, a, b, nom) => {
    const x = Number(String(s ?? '').trim());
    if (!Number.isInteger(x) || x < a || x > b) throw new Error(`${nom} debe ser un número entero de ${a} a ${b}`);
    return x;
  };
  const nombresSal = (m) => (m === 1 ? ['F'] : [...Array(m).keys()].map((i) => `F${i + 1}`));

  function resolver(sc) {
    const modo = sc.modo === 'puertas' ? 'puertas' : 'tabla';
    const forma = sc.forma === 'pos' ? 'pos' : 'sop';
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
    } else {
      n = entero(sc.nc, 1, MAXN, 'El número de entradas');
      validaPuertas(sc, n);
      const nodos = sc.puertas.map((p) => ({ id: p.id, tipo: p.tipo, e: [...p.e], etq: p.id }));
      const sal = sc.puertas.filter((p) => p.sal);
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
      pasos.push({ t: `${f}: simplificación (Quine-McCluskey)`, html: `Se agrupan los minitérminos (y los indiferentes) que se diferencian en un solo bit hasta que no se pueden juntar más. Quedan estos implicantes primos:<div class="tabla-scroll"><table class="tabla"><tr><th>Implicante</th><th>Patrón</th><th>Cubre</th><th></th></tr>${filas}</table></div>Los esenciales son los únicos que cubren algún minitérmino; se añaden los que faltan para cubrirlos todos con el menor número de términos.` });
      pasos.push({ t: `${f}: resultado simplificado`, html: `Suma de productos: ${f} = ${s.minS.html}<br>Producto de sumas: ${f} = ${s.minP.html}<br><span class="nota">El producto de sumas sale de simplificar los ceros (${f}′) y complementar el resultado con De Morgan.</span>` });
    }

    const dibujo = modo === 'puertas' ? circuito
      : dibujoNormal(n, salidas.map((s) => ({ nombre: s.nombre, grupos: forma === 'sop' ? s.gruposS : s.gruposP })), forma);
    if (modo === 'tabla') pasos.push({ t: 'Circuito de puertas', html: `Con la forma simplificada en ${forma === 'sop' ? 'suma de productos: una puerta AND por cada término y una OR que los suma' : 'producto de sumas: una puerta OR por cada factor y una AND que los multiplica'}. Las variables con barra pasan antes por una puerta NOT.` });
    const mapas = n <= MAXN ? salidas.map((s) => ({ nombre: s.nombre, ...karnaugh(n, s.v, forma === 'sop' || modo === 'puertas' ? s.elegidosS : []) })) : [];
    return { modo, forma, n, vars: NOM.slice(0, n), tabla, salidas, dibujo, mapas, dado, pasos };
  }

  /* ---------- Ejemplos ---------- */
  const T = (n, m, tabla) => ({ modo: 'tabla', n: String(n), m: String(m), tabla, forma: 'sop' });
  const P = (nc, puertas) => ({ modo: 'puertas', nc: String(nc), puertas, forma: 'sop' });
  const g = (id, tipo, e, sal) => ({ id, tipo, e, sal: !!sal });
  const ejemplos = [
    { clave: 'mayoria', nombre: 'Mayoría de 3 (votación)', sc: T(3, 1, ['00010111']) },
    { clave: 'semisumador', nombre: 'Semisumador: suma y acarreo', sc: T(2, 2, ['0110', '0001']) },
    { clave: 'sumador', nombre: 'Sumador completo de 1 bit', sc: T(3, 2, ['01101001', '00010111']) },
    { clave: 'primos-bcd', nombre: 'Primo en BCD (con indiferentes)', sc: T(4, 1, ['0011010100XXXXXX']) },
    { clave: 'circ-semisumador', nombre: 'Semisumador con puertas', sc: P(2, [g('P1', 'XOR', ['A', 'B'], 1), g('P2', 'AND', ['A', 'B'], 1)]) },
    { clave: 'circ-mux', nombre: 'Multiplexor 2 a 1 (selector C)', sc: P(3, [g('P1', 'NOT', ['C']), g('P2', 'AND', ['A', 'P1']), g('P3', 'AND', ['B', 'C']), g('P4', 'OR', ['P2', 'P3'], 1)]) },
    { clave: 'circ-xor-nand', nombre: 'XOR hecha solo con NAND', sc: P(2, [g('P1', 'NAND', ['A', 'B']), g('P2', 'NAND', ['A', 'P1']), g('P3', 'NAND', ['B', 'P1']), g('P4', 'NAND', ['P2', 'P3'], 1)]) },
  ];

  // una tabla de 3 variables con 3 a 5 unos, sin indiferentes
  function azar() {
    const k = 3 + Math.floor(Math.random() * 3), v = Array(8).fill('0');
    while (v.filter((x) => x === '1').length < k) v[Math.floor(Math.random() * 8)] = '1';
    return T(3, 1, [v.join('')]);
  }

  return { resolver, ejemplos, azar, NOM, NOMBRES, TIPOS, arid, MAXN, MAXM };
})();
if (typeof module !== 'undefined') module.exports = PuertasLogicas;
