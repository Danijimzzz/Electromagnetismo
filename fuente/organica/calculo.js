/* =====================================================================
   Química orgánica e isomería en 3D (sin DOM). De una molécula escrita en
   SMILES (cadenas y ramas, sin anillos) saca la fórmula, los grupos funcionales,
   el nombre IUPAC (cadena principal, numeración y sustituyentes), los centros
   quirales R/S y los dobles enlaces E/Z por las reglas de Cahn-Ingold-Prelog,
   todos los estereoisómeros y las posiciones 3D de los átomos (con hidrógenos).
   Usa Elementos (masas) de quimica/ y Mates para las fórmulas del desarrollo.
     resolver(sc)  { smiles } → { smiles, formula, masa, grupos, nombre, errorNombre,
                   estereo: { centros, dobles, quiral, lista }, atomos, enlaces,
                   isomeros, pasos }. Lanza un Error con un mensaje si no se entiende.
     enantiomero(smiles)  el SMILES de la imagen especular
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     ISOMEROS      listas de isómeros constitucionales de fórmulas pequeñas
   Los centros se guardan con la forma del SMILES: @ = visto desde el primer
   vecino, los otros tres van en sentido antihorario; @@ = horario.
   ===================================================================== */
const Organica = (() => {
  const VAL = { C: 4, N: 3, O: 2, S: 2, F: 1, Cl: 1, Br: 1, I: 1 };
  const ZA = { H: 1, C: 6, N: 7, O: 8, F: 9, S: 16, Cl: 17, Br: 35, I: 53 };
  const MASA = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, F: 18.998, S: 32.06, Cl: 35.453, Br: 79.904, I: 126.904 };
  const masaDe = (e) => (typeof Elementos !== 'undefined' && Elementos.porSimbolo[e]?.masa) || MASA[e];
  const coma = (x, d = 2) => String(+x.toFixed(d)).replace('.', ',').replace('-', '−');
  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (n) => (n === 1 ? '' : String(n).split('').map((c) => SUB[+c]).join(''));
  const NUM = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec', 'undec', 'dodec', 'tridec', 'tetradec', 'pentadec', 'hexadec', 'heptadec', 'octadec', 'nonadec', 'icos'];
  const MULT = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
  const BIS = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis', 'heptakis', 'octakis', 'nonakis', 'decakis'];
  const HAL = { F: 'fluoro', Cl: 'cloro', Br: 'bromo', I: 'yodo' };

  /* ---------- Lectura del SMILES (árbol: raíz = primer átomo) ---------- */
  function leer(txt) {
    const s = String(txt ?? '').replace(/\s+/g, '');
    if (!s) throw new Error('Escribe la molécula en notación SMILES, por ejemplo CC(O)C');
    const at = [], pila = [];
    let k = 0, actual = -1, ord = 1, marca = null, pendiente = false;
    const nuevo = (el, h, chir) => {
      if (!(el in VAL)) throw new Error(`No sé tratar el elemento ${el}: solo C, H, N, O, S, F, Cl, Br e I`);
      at.push({ el, h, chir, auto: h === null, padre: actual, ord: actual < 0 ? 0 : ord, marca: actual < 0 ? null : marca, hijos: [] });
      if (actual >= 0) at[actual].hijos.push(at.length - 1);
      actual = at.length - 1; ord = 1; marca = null; pendiente = false;
    };
    while (k < s.length) {
      const c = s[k];
      if (c === '(') { if (actual < 0) throw new Error('Un paréntesis no puede ir al principio'); pila.push(actual); k++; }
      else if (c === ')') { if (!pila.length) throw new Error('Hay un paréntesis de cierre de más'); actual = pila.pop(); ord = 1; marca = null; k++; }
      else if (c === '=') { ord = 2; pendiente = true; k++; }
      else if (c === '#') { ord = 3; pendiente = true; k++; }
      else if (c === '-') { ord = 1; pendiente = true; k++; }
      else if (c === '/' || c === '\\') { marca = c; pendiente = true; k++; }
      else if (/[0-9%]/.test(c)) throw new Error('Los anillos (números en el SMILES) todavía no están: de momento solo cadenas con ramas');
      else if (c === '.') throw new Error('Una sola molécula cada vez: quita el punto');
      else if (c === '[') {
        const f = s.indexOf(']', k); if (f < 0) throw new Error('Falta cerrar un corchete ]');
        const m = /^(\d+)?([A-Z][a-z]?)(@@?)?(?:H(\d*))?(.*)$/.exec(s.slice(k + 1, f));
        if (!m) throw new Error(`No entiendo el átomo [${s.slice(k + 1, f)}]`);
        if (m[5]) throw new Error('Los átomos con carga o con otros datos entre corchetes todavía no están');
        nuevo(m[2], m[4] === undefined ? 0 : (m[4] === '' ? 1 : +m[4]), m[3] || null);
        k = f + 1;
      } else if (/[a-z]/.test(c)) throw new Error('Los átomos aromáticos (en minúscula) todavía no están');
      else if (/[A-Z]/.test(c)) {
        const dos = s.slice(k, k + 2);
        if (dos === 'Cl' || dos === 'Br') { nuevo(dos, null, null); k += 2; } else { nuevo(c, null, null); k++; }
      } else throw new Error(`No entiendo el símbolo «${c}»`);
    }
    if (pila.length) throw new Error('Falta cerrar un paréntesis');
    if (pendiente) throw new Error('El SMILES acaba en un enlace sin átomo');
    if (!at.length) throw new Error('No hay ningún átomo');
    for (const [i, a] of at.entries()) {
      const suma = (a.padre >= 0 ? a.ord : 0) + a.hijos.reduce((t, h) => t + at[h].ord, 0);
      if (a.auto) a.h = VAL[a.el] - suma;
      if (a.h < 0 || suma + a.h > VAL[a.el]) throw new Error(`El átomo ${a.el} (n.º ${i + 1}) tiene demasiados enlaces: su valencia es ${VAL[a.el]}`);
      if (a.chir && a.h > 1) a.chir = null;
    }
    if (at.some((a, i) => (a.padre >= 0 && a.ord === 2 ? 1 : 0) + a.hijos.filter((h) => at[h].ord === 2).length >= 2)) throw new Error('Los dienos acumulados (alenos) todavía no están');
    return { at };
  }
  const vec = (M, i) => { const a = M.at[i]; return [...(a.padre >= 0 ? [{ j: a.padre, o: a.ord }] : []), ...a.hijos.map((c) => ({ j: c, o: M.at[c].ord }))]; };
  // vecinos en el orden del SMILES: padre, hidrógeno(s), hijos
  const fichas = (M, i) => { const a = M.at[i]; return [...(a.padre >= 0 ? [a.padre] : []), ...Array(a.h).fill('H'), ...a.hijos]; };
  const orden = (M, a, b) => (M.at[b].padre === a ? M.at[b].ord : M.at[a].ord);

  function escribe(M, opc = {}) {
    const chir = opc.chir || {}, marcas = opc.marcas || {};
    const rec = (i) => {
      const a = M.at[i], ch = i in chir ? chir[i] : a.chir;
      let t = ch ? `[${a.el}${ch}${a.h ? 'H' + (a.h > 1 ? a.h : '') : ''}]` : a.el;
      a.hijos.forEach((c, n) => {
        const m = c in marcas ? marcas[c] : (opc.sinMarcas ? null : M.at[c].marca);
        const e = (M.at[c].ord === 2 ? '=' : M.at[c].ord === 3 ? '#' : '') + (M.at[c].ord === 1 && m ? m : '');
        t += n < a.hijos.length - 1 ? `(${e}${rec(c)})` : e + rec(c);
      });
      return t;
    };
    return rec(0);
  }

  const formulaDe = (M) => {
    const c = {};
    for (const a of M.at) { c[a.el] = (c[a.el] || 0) + 1; c.H = (c.H || 0) + a.h; }
    const resto = Object.keys(c).filter((e) => e !== 'C' && e !== 'H').sort();
    const orden = c.C ? ['C', ...(c.H ? ['H'] : []), ...resto] : [...Object.keys(c).sort()];
    return { c, orden, txt: orden.map((e) => e + sub(c[e])).join(''), plano: orden.map((e) => e + (c[e] > 1 ? c[e] : '')).join('') };
  };

  /* ---------- Clases de equivalencia (simetría constitucional) ---------- */
  function clases(M) {
    let cl = M.at.map((a) => a.el + a.h);
    for (let r = 0; r < M.at.length; r++) {
      const nu = M.at.map((a, i) => `${cl[i]}(${vec(M, i).map((v) => v.o + cl[v.j]).sort().join(',')})`);
      const mapa = [...new Set(nu)].sort();
      cl = nu.map((x) => 'k' + mapa.indexOf(x));
    }
    return cl;
  }

  /* ---------- Prioridades CIP (digrafo jerárquico) ---------- */
  function hijosCIP(M, n) {
    if (n.a < 0) return [];
    const a = M.at[n.a], res = [];
    for (const { j, o } of vec(M, n.a)) {
      if (j === n.desde) continue;
      res.push({ z: ZA[M.at[j].el], a: j, desde: n.a, dup: Array(o - 1).fill(ZA[a.el]) });
      for (let q = 1; q < o; q++) res.push({ z: ZA[M.at[j].el], a: -1, desde: -1, dup: [] });
    }
    for (let q = 0; q < a.h; q++) res.push({ z: 1, a: -1, desde: -1, dup: [] });
    for (const z of n.dup) res.push({ z, a: -1, desde: -1, dup: [] });
    return res;
  }
  function ordenados(M, n) {
    const llave = n.a < 0 ? null : `${n.a},${n.desde}`;
    M.cache = M.cache || new Map();
    if (llave && M.cache.has(llave)) return M.cache.get(llave);
    const r = hijosCIP(M, n).sort((p, q) => cmpNodo(M, q, p));
    if (llave) M.cache.set(llave, r);
    return r;
  }
  // > 0 si X tiene más prioridad que Y (misma esfera, comparando por esferas)
  function cmpNodo(M, X, Y) {
    if (X.z !== Y.z) return X.z - Y.z;
    let fx = [X], fy = [Y];
    for (let nivel = 0; nivel < 14; nivel++) {
      const gx = fx.map((n) => ordenados(M, n)), gy = fy.map((n) => ordenados(M, n));
      for (let k = 0; k < gx.length; k++) {
        const L = Math.max(gx[k].length, gy[k].length);
        for (let m = 0; m < L; m++) { const za = gx[k][m]?.z ?? 0, zb = gy[k][m]?.z ?? 0; if (za !== zb) return za - zb; }
      }
      fx = gx.flat(); fy = gy.flat();
      if (!fx.length && !fy.length) return 0;
    }
    return 0;
  }
  const nodoDe = (M, centro, ficha) => {
    if (ficha === 'H') return { z: 1, a: -1, desde: -1, dup: [], ficha };
    const o = orden(M, centro, ficha);
    return { z: ZA[M.at[ficha].el], a: ficha, desde: centro, dup: Array(o - 1).fill(ZA[M.at[centro].el]), ficha };
  };
  // fichas ordenadas de mayor a menor prioridad; null si hay empate
  function rangos(M, centro, lista) {
    const ns = lista.map((f) => nodoDe(M, centro, f)).sort((p, q) => cmpNodo(M, q, p));
    for (let k = 0; k < ns.length - 1; k++) if (cmpNodo(M, ns[k], ns[k + 1]) === 0) return null;
    return ns.map((n) => n.ficha);
  }
  // los H repetidos (CH2) dan empate: se detecta aparte
  const centroEstereo = (M, i) => {
    const a = M.at[i];
    if (a.el !== 'C' || vec(M, i).some((v) => v.o !== 1)) return null;
    const f = fichas(M, i);
    if (f.length !== 4) return null;
    return rangos(M, i, f);
  };
  const paridad = (arr) => { let inv = 0; for (let x = 0; x < arr.length; x++) for (let y = x + 1; y < arr.length; y++) if (arr[x] > arr[y]) inv++; return inv % 2; };
  // R o S a partir de @/@@ y del orden CIP (sin coordenadas)
  function etiquetaCentro(M, i, rg, chir) {
    const ch = chir === undefined ? M.at[i].chir : chir;
    if (!ch) return null;
    const f = fichas(M, i), seq = f.map((t) => { const r = rg.indexOf(t) + 1; return r === 4 ? 0 : r; });
    const p = paridad(seq);
    return (ch === '@') === (p === 0) ? 'R' : 'S';
  }

  // lado (+1 arriba, −1 abajo) de un vecino s respecto al átomo d por las marcas / y \ del SMILES
  function lado(M, d, s) {
    if (s === 'H') return 0;
    if (M.at[s].padre === d) { const m = M.at[s].marca; return m === '/' ? 1 : m === '\\' ? -1 : 0; }
    const m = M.at[d].marca; return m === '/' ? -1 : m === '\\' ? 1 : 0;
  }
  const dobles = (M) => {
    const r = [];
    for (let b = 1; b < M.at.length; b++) {
      const a = M.at[b].padre;
      if (M.at[b].ord === 2 && M.at[a].el === 'C' && M.at[b].el === 'C') {
        const extremo = (x, otro) => { const f = fichas(M, x).filter((t) => t !== otro); return f.length === 2 && f.every((t) => t !== undefined) ? f : null; };
        const fa = extremo(a, b), fb = extremo(b, a);
        if (!fa || !fb) continue;
        const ra = rangos(M, a, fa), rb = rangos(M, b, fb);
        if (!ra || !rb) continue;
        r.push({ a, b, ra, rb });
      }
    }
    return r;
  };
  const ladosExtremo = (M, x, r) => {
    const sa = lado(M, x, r[0]), sb = lado(M, x, r[1]);
    if (sa) return [sa, -sa];
    if (sb) return [-sb, sb];
    return null;
  };
  function etiquetaDoble(M, d) {
    const A = ladosExtremo(M, d.a, d.ra), B = ladosExtremo(M, d.b, d.rb);
    if (!A || !B) return null;
    return A[0] === B[0] ? 'Z' : 'E';
  }

  function estereo(M) {
    const cl = clases(M), centros = [], ds = dobles(M);
    for (let i = 0; i < M.at.length; i++) { const rg = centroEstereo(M, i); if (rg) centros.push({ i, rg, label: etiquetaCentro(M, i, rg) }); }
    const dd = ds.map((d) => ({ ...d, label: etiquetaDoble(M, d) }));
    const clave = (invierte) => [
      ...centros.map((c) => `${cl[c.i]}:${c.label ? (invierte ? (c.label === 'R' ? 'S' : 'R') : c.label) : '?'}`),
      ...dd.map((d) => `${[cl[d.a], cl[d.b]].sort().join('=')}:${d.label || '?'}`),
    ].sort().join('|');
    const completo = centros.every((c) => c.label) && dd.every((d) => d.label);
    return { centros, dobles: dd, clave: clave(false), claveEspejo: clave(true), completo, quiral: completo && centros.length > 0 && clave(false) !== clave(true) };
  }

  /* ---------- Nombre IUPAC (cadenas acíclicas) ---------- */
  const PRIO = ['cooh', 'coor', 'conh2', 'cn', 'cho', 'ceto', 'oh', 'sh', 'nh2'];
  const TERMINAL = ['cooh', 'coor', 'conh2', 'cn', 'cho'];
  const SUFIJO = { cooh: 'oico', coor: 'oato', conh2: 'amida', cn: 'nitrilo', cho: 'al', ceto: 'ona', oh: 'ol', sh: 'tiol', nh2: 'amina' };
  const GRUPO = { cooh: 'ácido carboxílico', coor: 'éster', conh2: 'amida', cn: 'nitrilo', cho: 'aldehído', ceto: 'cetona', oh: 'alcohol', sh: 'tiol', nh2: 'amina' };
  const cmpClave = (a, b) => {
    if (Array.isArray(a)) {
      for (let k = 0; k < Math.min(a.length, b.length); k++) { const c = cmpClave(a[k], b[k]); if (c) return c; }
      return a.length - b.length;
    }
    return a - b;
  };
  const soloLetras = (t) => t.replace(/[^a-záéíóúñ]/gi, '').toLowerCase();

  function nombrar(M, est) {
    const n = M.at.length, V = M.at.map((_, i) => vec(M, i)), el = (i) => M.at[i].el;
    const tipoC = new Array(n).fill(null);
    // comprobaciones de lo que se sabe nombrar
    for (let i = 0; i < n; i++) {
      for (const { j, o } of V[i]) {
        if (o === 2 && !((el(i) === 'C' && (el(j) === 'C' || el(j) === 'O')) || (el(j) === 'C' && el(i) === 'O'))) throw new Error('Solo sé nombrar dobles enlaces C=C y C=O');
        if (o === 3 && !(el(i) === 'C' && (el(j) === 'C' || el(j) === 'N')) && !(el(j) === 'C' && el(i) === 'N')) throw new Error('Solo sé nombrar triples enlaces C≡C y C≡N');
      }
      const a = M.at[i];
      if (a.el === 'O' && V[i].length === 2 && V[i].some((v) => el(v.j) !== 'C')) throw new Error('Los peróxidos y otros enlaces O–O u O–heteroátomo todavía no se nombran');
      if (a.el === 'N' && !(V[i].length === 1 && (a.h === 2 || V[i][0].o === 3))) throw new Error('Las aminas secundarias y terciarias, las imidas y otros compuestos con nitrógeno todavía no se nombran: solo aminas primarias, amidas primarias y nitrilos');
      if (a.el === 'S' && V[i].length === 2 && V[i].some((v) => el(v.j) !== 'C')) throw new Error('Este compuesto con azufre todavía no se nombra');
    }
    if (M.at.some((a, i) => V[i].filter((v) => v.o === 2).length >= 2)) throw new Error('Los dienos acumulados (alenos) todavía no se nombran');
    if (!M.at.some((a) => a.el === 'C')) throw new Error('Esta herramienta nombra compuestos orgánicos (con carbono)');
    for (let i = 0; i < n; i++) {
      if (el(i) !== 'C') continue;
      const nb = V[i], oD = nb.find((v) => v.o === 2 && el(v.j) === 'O'), nT = nb.find((v) => v.o === 3 && el(v.j) === 'N');
      if (nT) tipoC[i] = 'cn';
      else if (oD) {
        const otros = nb.filter((v) => v !== oD), oh = otros.find((v) => el(v.j) === 'O'), nn = otros.find((v) => el(v.j) === 'N');
        const cs = otros.filter((v) => el(v.j) === 'C');
        if (otros.some((v) => ['F', 'Cl', 'Br', 'I', 'S'].includes(el(v.j)))) throw new Error('Los haluros de ácido y los tioácidos todavía no se nombran');
        if (oh) tipoC[i] = V[oh.j].length === 1 ? 'cooh' : 'coor';
        else if (nn) { if (!(V[nn.j].length === 1 && M.at[nn.j].h === 2)) throw new Error('Las amidas N-sustituidas todavía no se nombran'); tipoC[i] = 'conh2'; }
        else tipoC[i] = cs.length === 2 ? 'ceto' : 'cho';
      }
    }
    // grupo característico de un heteroátomo que cuelga de un carbono
    const gk = (j) => { const a = M.at[j]; if (V[j].length !== 1 || V[j][0].o !== 1) return null; if (a.el === 'O' && a.h === 1) return 'oh'; if (a.el === 'S' && a.h === 1) return 'sh'; if (a.el === 'N' && a.h === 2) return 'nh2'; return null; };
    const presentes = new Set();
    for (let i = 0; i < n; i++) {
      if (el(i) !== 'C') continue;
      if (tipoC[i]) presentes.add(tipoC[i]);
      if (!TERMINAL.includes(tipoC[i])) for (const { j } of V[i]) { const g = gk(j); if (g) presentes.add(g); }
    }
    const principal = PRIO.find((t) => presentes.has(t)) || null;
    if (principal === 'coor' && tipoC.filter((t) => t === 'coor').length > 1) throw new Error('Los diésteres todavía no se nombran');
    const elegible = (i) => el(i) === 'C' && (!tipoC[i] || tipoC[i] === 'ceto' || tipoC[i] === principal);

    const memo = new Map();
    // ---- nombre de lo que cuelga de la cadena
    function nombreSub(raiz, desde) {
      const llave = raiz + ',' + desde;
      if (memo.has(llave)) return memo.get(llave);
      const r = nombreSub0(raiz, desde); memo.set(llave, r); return r;
    }
    function nombreSub0(raiz, desde) {
      const e = el(raiz), o = orden(M, desde, raiz), nb = V[raiz].filter((v) => v.j !== desde);
      if (HAL[e]) return { txt: HAL[e], complejo: false };
      if (e === 'O') {
        if (o === 2) return { txt: 'oxo', complejo: false };
        if (!nb.length) return { txt: 'hidroxi', complejo: false };
        const q = nombreSub(nb[0].j, raiz);
        return { txt: q.txt.replace(/il$/, 'oxi'), complejo: q.complejo };
      }
      if (e === 'N') return { txt: 'amino', complejo: false };
      if (e === 'S') {
        if (!nb.length) return { txt: 'mercapto', complejo: false };
        const q = nombreSub(nb[0].j, raiz);
        return { txt: q.txt + 'tio', complejo: true };
      }
      const t = tipoC[raiz];
      if (t === 'cooh') return { txt: 'carboxi', complejo: false };
      if (t === 'cho') return { txt: 'formil', complejo: false };
      if (t === 'conh2') return { txt: 'carbamoil', complejo: false };
      if (t === 'cn') return { txt: 'ciano', complejo: false };
      if (t === 'coor') {
        const oo = V[raiz].find((v) => el(v.j) === 'O' && v.o === 1 && v.j !== desde), q = nombreSub(V[oo.j].find((v) => v.j !== raiz).j, oo.j);
        return { txt: q.txt.replace(/il$/, 'oxi') + 'carbonil', complejo: q.complejo };
      }
      if (t === 'ceto') throw new Error('Un grupo acilo (como el acetilo) como sustituyente todavía no se nombra');
      return cadena(null, raiz, desde);
    }

    // ---- candidatos y evaluación de una cadena
    function rutas(inicios, prohibido) {
      const res = [];
      const sigue = (p) => {
        const u = p[p.length - 1];
        if (!inicios.fijo && p[0] <= u) res.push([...p]);
        if (inicios.fijo) res.push([...p]);
        for (const { j } of V[u]) if (!p.includes(j) && j !== prohibido && elegible(j)) { p.push(j); sigue(p); p.pop(); }
      };
      for (const s of inicios.lista) if (elegible(s)) sigue([s]);
      return res;
    }
    function evalua(P, ctx) {
      const largo = P.length, enP = new Set(P), usados = new Set();
      const princ = [];   // posiciones (0..) con el grupo principal
      const grupoDe = (k) => {
        const c = P[k], t = tipoC[c], r = [];
        if (principal && TERMINAL.includes(principal)) { if (t === principal) { princ.push(k); for (const { j } of V[c]) if (el(j) === 'O' || el(j) === 'N') usados.add(j); } }
        else if (principal === 'ceto') { if (t === 'ceto') { princ.push(k); const o = V[c].find((v) => v.o === 2 && el(v.j) === 'O'); usados.add(o.j); } }
        else if (principal) for (const { j } of V[c]) if (!enP.has(j) && gk(j) === principal) { princ.push(k); usados.add(j); }
        return r;
      };
      if (!ctx.sub) for (let k = 0; k < largo; k++) grupoDe(k);
      const subs = [], dob = [], tri = [];
      for (let k = 0; k < largo; k++) {
        for (const { j } of V[P[k]]) if (!enP.has(j) && !usados.has(j) && j !== ctx.desde) subs.push({ k, j });
        if (k < largo - 1) { const o = orden(M, P[k], P[k + 1]); if (o === 2) dob.push(k); else if (o === 3) tri.push(k); }
      }
      const orient = (dir) => {
        const loc = (k) => (dir ? k + 1 : largo - k), locB = (k) => (dir ? k + 1 : largo - k - 1);
        const L = {
          princ: princ.map(loc).sort((a, b) => a - b), mult: [...dob.map(locB), ...tri.map(locB)].sort((a, b) => a - b),
          dob: dob.map(locB).sort((a, b) => a - b), tri: tri.map(locB).sort((a, b) => a - b),
          subs: subs.map((s) => ({ loc: loc(s.k), j: s.j, desde: P[s.k] })),
        };
        const sl = L.subs.map((s) => s.loc).sort((a, b) => a - b);
        const alfa = [...L.subs].sort((p, q) => soloLetras(nombreSub(p.j, p.desde).txt).localeCompare(soloLetras(nombreSub(q.j, q.desde).txt)))[0];
        L.clave = [L.princ, L.mult, L.dob, sl, alfa ? alfa.loc : 0];
        L.loc = loc; L.locB = locB;
        return L;
      };
      const o1 = orient(true), o2 = ctx.sub ? null : orient(false);
      const mejor = o2 && cmpClave(o2.clave, o1.clave) < 0 ? o2 : o1;
      const dir = mejor === o1;
      return { P, dir, L: mejor, clave: [-princ.length, -(dob.length + tri.length), -largo, -subs.length, mejor.clave], nPrinc: princ.length };
    }
    // ---- el nombre de una cadena (principal o de un sustituyente)
    function cadena(inicioPrincipal, raiz, desde) {
      const sub = raiz !== null && !inicioPrincipal;
      let cand;
      if (sub) cand = rutas({ lista: [raiz], fijo: true }, desde).filter((p) => p[0] === raiz);
      else cand = rutas({ lista: [...Array(n).keys()] }, -1);
      if (!cand.length) throw new Error('No encuentro una cadena de carbonos');
      let mejor = null;
      if (!sub && principal) {   // solo cuentan las cadenas con más grupos principales (así no se nombran cadenas descartadas)
        const cuenta = (P) => P.reduce((t, c) => t + (TERMINAL.includes(principal) || principal === 'ceto' ? (tipoC[c] === principal ? 1 : 0) : V[c].filter((v) => !P.includes(v.j) && gk(v.j) === principal).length), 0);
        const mx = Math.max(...cand.map(cuenta)); cand = cand.filter((P) => cuenta(P) === mx);
      }
      for (const P of cand) { const e = evalua(P, { sub, desde: sub ? desde : -1 }); if (!mejor || cmpClave(e.clave, mejor.clave) < 0) mejor = e; }
      return componer(mejor, sub);
    }
    function componer(E, esSub) {
      const { P, L } = E, largo = P.length, orient = L;
      if (largo > 20) throw new Error('La cadena es demasiado larga (más de 20 carbonos)');
      const stem = NUM[largo];
      // sustituyentes agrupados por nombre
      const grupos = new Map();
      for (const s of orient.subs) {
        const nm = nombreSub(s.j, s.desde), key = nm.txt;
        if (!grupos.has(key)) grupos.set(key, { nm, locs: [] });
        grupos.get(key).locs.push(s.loc);
      }
      const lista = [...grupos.values()].sort((p, q) => soloLetras(p.nm.txt).localeCompare(soloLetras(q.nm.txt)));
      const nSub = orient.subs.length, locsSuf = E.nPrinc ? orient.princ : [];
      const tipoSuf = !esSub && principal && E.nPrinc ? principal : null;
      const terminal = tipoSuf && TERMINAL.includes(tipoSuf);
      const items = nSub + (tipoSuf && !terminal ? locsSuf.length : 0);
      const omiteTodo = largo === 1 || (!esSub && largo === 2 && items <= 1);
      const nIns = orient.dob.length + orient.tri.length;
      const omiteIns = largo <= 2 || (largo === 3 && !tipoSuf && nSub === 0 && nIns === 1);
      // prefijos
      const prefijo = lista.map(({ nm, locs }) => {
        locs.sort((a, b) => a - b);
        const m = locs.length, ls = omiteTodo ? '' : locs.join(',') + '-';
        const nombre = nm.complejo ? (m > 1 ? BIS[m] : '') + `(${nm.txt})` : (m > 1 ? MULT[m] : '') + nm.txt;
        return ls + nombre;
      }).join('-');
      // insaturaciones
      let base;
      if (!nIns) base = esSub ? stem : stem + 'an';
      else {
        const partes = [];
        if (orient.dob.length) partes.push((omiteIns ? '' : orient.dob.join(',') + '-') + (orient.dob.length > 1 ? MULT[orient.dob.length] : '') + 'en');
        if (orient.tri.length) partes.push((omiteIns ? '' : orient.tri.join(',') + '-') + (orient.tri.length > 1 ? MULT[orient.tri.length] : '') + 'in');
        const a = (orient.dob.length || orient.tri.length) > 1 && (orient.dob.length ? orient.dob.length > 1 : orient.tri.length > 1) ? 'a' : '';
        base = stem + a + (omiteIns ? '' : '-') + partes.join(omiteIns ? '' : '-');
      }
      let cuerpo;
      if (esSub) cuerpo = base + 'il';
      else if (!tipoSuf) cuerpo = base + 'o';
      else {
        const m = locsSuf.length, suf = SUFIJO[tipoSuf], vocal = /^[aeiou]/.test(suf);
        const omiteSuf = terminal || omiteTodo || (tipoSuf === 'ceto' && largo === 3 && items === 1 && !nIns);
        const ls = omiteSuf ? '' : locsSuf.join(',');
        const mu = m > 1 ? MULT[m] : '';
        if (m === 1 && vocal) cuerpo = base + (ls ? `-${ls}-` : '') + suf;
        else cuerpo = base + 'o' + (ls ? `-${ls}-` : '') + mu + suf;
      }
      const res = { txt: (prefijo ? prefijo : '') + cuerpo, complejo: /[\d,(]/.test(prefijo + cuerpo) || nSub > 0, E, prefijo, cuerpo, tipoSuf };
      return res;
    }

    const R = cadena(true, null, -1);
    // descriptores estereoquímicos de lo que está en la cadena
    const { P, L } = R.E;
    const locAt = (a) => { const k = P.indexOf(a); return k < 0 ? null : L.loc(k); };
    const desc = [];
    for (const c of est.centros) { const l = locAt(c.i); if (c.label && l) desc.push({ l, t: c.label }); }
    for (const d of est.dobles) {
      const ka = P.indexOf(d.a), kb = P.indexOf(d.b);
      if (d.label && ka >= 0 && kb >= 0) desc.push({ l: Math.min(L.loc(ka), L.loc(kb)), t: d.label });
    }
    desc.sort((p, q) => p.l - q.l || p.t.localeCompare(q.t));
    const omiteLoc = P.length === 1;
    const pre = desc.length ? `(${desc.map((x) => (omiteLoc ? '' : x.l) + x.t).join(',')})-` : '';
    let txt;
    if (R.tipoSuf === 'cooh') txt = `ácido ${pre}${R.txt}`;
    else if (R.tipoSuf === 'coor') {
      const c = P.find((a) => tipoC[a] === 'coor'), oo = V[c].find((v) => el(v.j) === 'O' && v.o === 1), alq = nombreSub(V[oo.j].find((v) => v.j !== c).j, oo.j);
      txt = `${pre}${R.txt} de ${alq.txt}o`;
    } else txt = pre + R.txt;
    return { txt, principal: R.tipoSuf, cadena: P, locAt, tipoC, pre, base: R.txt, E: R.E };
  }

  /* ---------- Grupos funcionales ---------- */
  function grupos(M) {
    const V = M.at.map((_, i) => vec(M, i)), el = (i) => M.at[i].el, r = new Set();
    for (let i = 0; i < M.at.length; i++) {
      const a = M.at[i];
      for (const { j, o } of V[i]) if (j > i || M.at[j].padre === i) { /* cada enlace una vez */ }
      if (a.el === 'C') {
        for (const v of V[i]) {
          if (v.o === 2 && el(v.j) === 'C' && v.j > i) r.add('alqueno');
          if (v.o === 3 && el(v.j) === 'C' && v.j > i) r.add('alquino');
        }
        const oD = V[i].find((v) => v.o === 2 && el(v.j) === 'O');
        const nT = V[i].find((v) => v.o === 3 && el(v.j) === 'N');
        if (nT) r.add('nitrilo');
        else if (oD) {
          const otros = V[i].filter((v) => v !== oD), oo = otros.find((v) => el(v.j) === 'O'), nn = otros.find((v) => el(v.j) === 'N'), cs = otros.filter((v) => el(v.j) === 'C').length;
          if (oo) r.add(V[oo.j].length === 1 ? 'ácido carboxílico' : 'éster');
          else if (nn) r.add('amida');
          else r.add(cs === 2 ? 'cetona' : 'aldehído');
        }
      } else if (a.el === 'O' && V[i].length === 2 && V[i].every((v) => el(v.j) === 'C')) {
        const esEster = V[i].some((v) => M.at[v.j].el === 'C' && V[v.j].some((w) => w.o === 2 && el(w.j) === 'O'));
        if (!esEster) r.add('éter');
      } else if (a.el === 'O' && a.h === 1 && V[i].length === 1 && el(V[i][0].j) === 'C') {
        const c = V[i][0].j; if (!V[c].some((w) => w.o === 2 && el(w.j) === 'O')) r.add('alcohol');
      } else if (a.el === 'N' && V[i].length === 1 && V[i][0].o === 1 && a.h === 2) {
        const c = V[i][0].j; if (!V[c].some((w) => w.o === 2 && el(w.j) === 'O')) r.add('amina');
      } else if (a.el === 'S') r.add(a.h ? 'tiol' : 'tioéter');
      else if (HAL[a.el]) r.add(`haluro de alquilo (${HAL[a.el]})`);
    }
    return [...r];
  }

  /* ---------- Coordenadas 3D ---------- */
  const v3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: (a) => Math.hypot(a[0], a[1], a[2]), unit: (a) => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; },
  };
  const perp = (v, a) => v3.sub(v, v3.mul(a, v3.dot(v, a)));
  const LARGOS = { 'C-C': [0, 1.54, 1.34, 1.2], 'C-O': [0, 1.43, 1.21], 'C-N': [0, 1.47, 1.28, 1.16], 'C-S': [0, 1.82], 'C-F': [0, 1.35], 'C-Cl': [0, 1.77], 'Br-C': [0, 1.94], 'C-I': [0, 2.14], 'C-H': [0, 1.09], 'H-O': [0, 0.96], 'H-N': [0, 1.01], 'H-S': [0, 1.34] };
  const largo = (a, b, o) => (LARGOS[[a, b].sort().join('-')] || [0, 1.5])[o] || 1.5;
  const rad = (g) => (g * Math.PI) / 180;

  function coordenadas(M) {
    const n = M.at.length, V = M.at.map((_, i) => vec(M, i)), pos = new Array(n).fill(null), fp = new Array(n), Hs = [];
    const hib = (i) => { const v = V[i]; if (v.some((x) => x.o === 3) || v.filter((x) => x.o === 2).length >= 2) return 'sp'; if (v.some((x) => x.o === 2)) return 'sp2'; return 'sp3'; };
    const baseAz = (e1, u) => ({ e1, e2: v3.cross(u, e1) });
    function situa(i, u, eref, modoB) {
      const a = M.at[i], T = fichas(M, i), tipo = hib(i), p0 = pos[i], R = T.slice(1), pt = new Array(T.length);
      const { e1, e2 } = baseAz(eref, u);
      const dir = (polar, az) => v3.add(v3.mul(u, Math.cos(polar)), v3.mul(v3.add(v3.mul(e1, Math.cos(az)), v3.mul(e2, Math.sin(az))), Math.sin(polar)));
      const poner = (idx, d) => {
        const t = T[idx];
        const p = v3.add(p0, v3.mul(d, largo(a.el, t === 'H' ? 'H' : M.at[t].el, t === 'H' ? 1 : orden(M, i, t))));
        pt[idx] = p;
        if (t === 'H') Hs.push({ de: i, p }); else if (pos[t] === null) pos[t] = p;
      };
      // la ficha 0 es el padre (ya colocado) o, en la raíz, un vecino que se coloca en la dirección u
      if (a.padre >= 0) pt[0] = pos[a.padre]; else poner(0, u);
      const pesado = (t) => t !== 'H';
      if (modoB) {
        const A = a.padre, TA = fichas(M, A), ptA = fp[A], axis = v3.unit(v3.sub(pos[i], pos[A]));
        const iB = TA.indexOf(i), otros = TA.map((t, k) => k).filter((k) => k !== iB);
        const lA = otros.map((k) => (TA[k] === 'H' ? 0 : lado(M, A, TA[k])));
        let w = null, sA0 = 1;
        for (let q = 0; q < otros.length; q++) if (lA[q]) { w = v3.mul(v3.unit(perp(v3.sub(ptA[otros[q]], pos[A]), axis)), lA[q]); sA0 = q === 0 ? lA[q] : -lA[q]; break; }
        if (!w) w = v3.unit(perp(v3.sub(ptA[otros[0]], pos[A]), axis));
        const lB = R.map((t) => (t === 'H' ? 0 : lado(M, i, t)));
        let sig = lB.findIndex((x) => x), lados;
        if (sig >= 0) lados = R.map((_, q) => (q === sig ? lB[q] : -lB[sig]));
        else lados = R.map((_, q) => (q === 0 ? -sA0 : sA0));
        R.forEach((t, q) => poner(q + 1, v3.add(v3.mul(axis, Math.cos(rad(60))), v3.mul(w, lados[q] * Math.sin(rad(60))))));
      } else if (tipo === 'sp') {
        if (R.length) poner(1, v3.mul(u, -1));
      } else if (tipo === 'sp2') {
        let anc = R.findIndex((t) => pesado(t) && orden(M, i, t) === 2); if (anc < 0) anc = R.findIndex(pesado); if (anc < 0) anc = 0;
        R.forEach((t, q) => poner(q + 1, dir(rad(120), q === anc ? 0 : Math.PI)));
      } else {
        let anc = R.findIndex(pesado); if (anc < 0) anc = 0;
        const s = a.chir && T.length === 4 && a.chir === '@@' ? -1 : 1;
        // de las tres posiciones escalonadas (giro de 120° que no cambia la quiralidad) se toma la que menos choca
        const colocados = [...pos.filter((p, j) => p && j !== i && j !== a.padre), ...Hs.filter((h) => h.de !== a.padre).map((h) => h.p)];
        let mejorK = 0, mejorPen = Infinity;
        for (const kk of [0, 1, 2]) {
          let pen = 0;
          R.forEach((t, q) => {
            const d = dir(rad(109.47), s * rad(120) * (q - anc + kk)), p = v3.add(p0, v3.mul(d, largo(a.el, t === 'H' ? 'H' : M.at[t].el, 1)));
            for (const o of colocados) { const dd = v3.norm(v3.sub(p, o)); if (dd < 2.4) pen += (2.4 - dd) ** 2; }
          });
          if (pen < mejorPen - 1e-9) { mejorPen = pen; mejorK = kk; }
        }
        R.forEach((t, q) => poner(q + 1, dir(rad(109.47), s * rad(120) * (q - anc + mejorK))));
      }
      fp[i] = pt;
      for (let q = a.padre >= 0 ? 1 : 0; q < T.length; q++) {
        const c = T[q]; if (c === 'H') continue;
        const axis = v3.unit(v3.sub(pos[c], p0)), g = pt.find((p, k) => k !== q && p);
        let e = g ? perp(v3.sub(g, p0), axis) : [0, 0, 0];
        if (v3.norm(e) < 1e-6) e = perp(Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], axis);
        const dB = M.at[c].ord === 2 && a.el === 'C' && M.at[c].el === 'C' && M.at[c].hijos.length + M.at[c].h === 2;
        situa(c, v3.mul(axis, -1), v3.mul(v3.unit(e), -1), dB);
      }
    }
    pos[0] = [0, 0, 0];
    situa(0, [0, 0, 1], [1, 0, 0], false);
    // relajar: se giran las ramas alrededor de enlaces sencillos para quitar choques entre átomos lejanos
    {
      const D = M.at.map(() => new Array(n).fill(99));
      for (let s0 = 0; s0 < n; s0++) { D[s0][s0] = 0; const cola = [s0]; for (let q = 0; q < cola.length; q++) for (const { j } of V[cola[q]]) if (D[s0][j] === 99) { D[s0][j] = D[s0][cola[q]] + 1; cola.push(j); } }
      const P = [...pos, ...Hs.map((h) => h.p)], host = [...Array(n).keys(), ...Hs.map((h) => h.de)], ex = P.map((_, k) => (k < n ? 0 : 1));
      const topo = (x, y) => (host[x] === host[y] ? (ex[x] && ex[y] ? 2 : ex[x] + ex[y]) : D[host[x]][host[y]] + ex[x] + ex[y]);
      const pen = () => { let t = 0; for (let x = 0; x < P.length; x++) for (let y = x + 1; y < P.length; y++) if (topo(x, y) >= 3) { const d = v3.norm(v3.sub(P[x], P[y])); if (d < 2.3) t += (2.3 - d) ** 2; } return t; };
      const rama = (c) => { const r = [c]; for (let q = 0; q < r.length; q++) r.push(...M.at[r[q]].hijos); return r; };
      const gira = (ids, o, ax, ang) => {
        const co = Math.cos(ang), si = Math.sin(ang);
        for (const k of ids) { const v = v3.sub(P[k], o), r = v3.add(v3.add(v3.mul(v, co), v3.mul(v3.cross(ax, v), si)), v3.mul(ax, v3.dot(ax, v) * (1 - co))); P[k] = v3.add(o, r); }
      };
      for (let pasada = 0; pasada < 3; pasada++) {
        let cambio = false;
        for (let c = 1; c < n; c++) {
          const pd = M.at[c].padre; if (M.at[c].ord !== 1 || (M.at[c].hijos.length === 0)) continue;
          const hs = rama(c), ids = [...hs, ...Hs.map((h, q) => (hs.includes(h.de) ? n + q : -1)).filter((k) => k >= 0)].filter((k) => k !== c);
          const ax = v3.unit(v3.sub(P[c], P[pd])), base = P.map((p) => p), p0 = pen();
          let mejor = p0, mejorAng = 0;
          for (const ang of [rad(60), rad(120), rad(180), rad(240), rad(300)]) {
            for (let k = 0; k < P.length; k++) P[k] = base[k];
            gira(ids, P[c], ax, ang); const q = pen();
            if (q < mejor - 1e-6) { mejor = q; mejorAng = ang; }
          }
          for (let k = 0; k < P.length; k++) P[k] = base[k];
          if (mejorAng) { gira(ids, P[c], ax, mejorAng); cambio = true; }
        }
        if (!cambio) break;
      }
      for (let k = 0; k < n; k++) pos[k] = P[k];
      Hs.forEach((h, q) => { h.p = P[n + q]; });
    }
    // centrar
    const todos = [...pos, ...Hs.map((h) => h.p)], c = todos.reduce((t, p) => v3.add(t, p), [0, 0, 0]).map((x) => x / todos.length);
    const atomos = [...M.at.map((a, i) => ({ sim: a.el, p: v3.sub(pos[i], c), i })), ...Hs.map((h) => ({ sim: 'H', p: v3.sub(h.p, c), de: h.de }))];
    const enlaces = [];
    M.at.forEach((a, i) => { if (a.padre >= 0) enlaces.push({ a: a.padre, b: i, o: a.ord }); });
    Hs.forEach((h, q) => enlaces.push({ a: h.de, b: n + q, o: 1 }));
    const radio = Math.max(...atomos.map((x) => v3.norm(x.p))) + 1;
    return { atomos, enlaces, radio };
  }

  // R/S medido en las coordenadas (para comprobar la geometría)
  function etiquetaGeometrica(M, geo, i, rg) {
    const idx = (t) => (t === 'H' ? geo.atomos.findIndex((x) => x.de === i) : t);
    const p = (t) => geo.atomos[idx(t)].p, c = geo.atomos[i].p;
    const va = v3.sub(p(rg[0]), c), vb = v3.sub(p(rg[1]), c), vc = v3.sub(p(rg[2]), c);
    return v3.dot(va, v3.cross(vb, vc)) < 0 ? 'R' : 'S';
  }
  const diedro = (geo, a, b, c, d) => {
    const P = (i) => geo.atomos[i].p, b1 = v3.sub(P(b), P(a)), b2 = v3.sub(P(c), P(b)), b3 = v3.sub(P(d), P(c));
    const n1 = v3.cross(b1, b2), n2 = v3.cross(b2, b3), m1 = v3.cross(n1, v3.unit(b2));
    return (Math.atan2(v3.dot(m1, n2), v3.dot(n1, n2)) * 180) / Math.PI;
  };

  /* ---------- Estereoisómeros ---------- */
  function variantes(M, est) {
    const cs = est.centros, ds = est.dobles;
    if (!cs.length && !ds.length) return [];
    // en cada extremo de un doble enlace se marca un enlace; si dos dobles enlaces conjugados comparten uno, se marca una sola vez
    const aristas = [];
    for (const d of ds) {
      const hijoA = M.at[d.a].hijos.find((h) => h !== d.b), hijoB = M.at[d.b].hijos[0];
      for (const k of [hijoA !== undefined ? hijoA : d.a, hijoB]) if (k !== undefined && !aristas.includes(k)) aristas.push(k);
    }
    if (cs.length + aristas.length > 8) return null;
    const total = 2 ** (cs.length + aristas.length), res = [], vistas = new Set();
    for (let mask = 0; mask < total; mask++) {
      const chir = {}, marcas = {};
      cs.forEach((c, q) => { chir[c.i] = mask & (1 << q) ? '@' : '@@'; });
      aristas.forEach((k, q) => { marcas[k] = mask & (1 << (cs.length + q)) ? '/' : '\\'; });
      const s = escribe(M, { chir, marcas, sinMarcas: true });
      const N = leer(s), e2 = estereo(N);
      if (vistas.has(e2.clave)) continue;
      vistas.add(e2.clave);
      res.push({ smiles: s, est: e2, M: N });
    }
    return res;
  }

  /* ---------- Resolución completa ---------- */
  const ISOMEROS = {
    C4H10: ['CCCC', 'CC(C)C'], C5H12: ['CCCCC', 'CCC(C)C', 'CC(C)(C)C'], C2H6O: ['CCO', 'COC'], C3H8O: ['CCCO', 'CC(O)C', 'CCOC'],
    C3H6O: ['CCC=O', 'CC(C)=O', 'C=CCO', 'C=COC'], C4H8: ['C=CCC', 'CC=CC', 'CC(C)=C'], C2H4O2: ['CC(=O)O', 'COC=O'],
    C3H6O2: ['CCC(=O)O', 'CC(=O)OC', 'COCC=O'.replace('COCC=O', 'CCOC=O')],
    C4H10O: ['CCCCO', 'CCC(C)O', 'CC(C)CO', 'CC(C)(C)O', 'CCCOC', 'CC(C)OC', 'CCOCC'],
    C4H8O: ['CCCC=O', 'CCC(C)=O', 'CC(C)C=O'], C3H7N: ['C=CCN'],
  };
  function isomerosDe(formulaPlano) {
    const lista = ISOMEROS[formulaPlano];
    if (!lista) return null;
    return lista.map((s) => { const M = leer(s); let nombre = ''; try { nombre = nombrar(M, estereo(M)).txt; } catch (e) { nombre = ''; } return { smiles: s, nombre }; });
  }
  const ALCANOS = [1, 1, 1, 2, 3, 5, 9, 18, 35, 75];   // C1…C10

  function resolver(sc) {
    const M = leer(sc.smiles), f = formulaDe(M), est = estereo(M), gr = grupos(M);
    const masa = Object.entries(f.c).reduce((t, [e, q]) => t + q * masaDe(e), 0);
    let nom = null, errorNombre = '';
    try { nom = nombrar(M, est); } catch (e) { errorNombre = e.message; }
    const geo = coordenadas(M);
    const lista = variantes(M, est);
    let vars = null;
    if (lista) {
      vars = lista.map((v) => {
        let nombre = ''; try { nombre = nombrar(v.M, v.est).txt; } catch (e) { nombre = ''; }
        const desc = v.est.centros.map((c) => c.label || '?').join('');
        const rel = !est.completo ? '' : v.est.clave === est.clave ? 'este' : (v.est.clave === est.claveEspejo ? 'enantiómero' : 'diastereoisómero');
        return { smiles: v.smiles, nombre, quiral: v.est.quiral, rel, desc };
      });
    }
    // pasos
    const pasos = [];
    pasos.push({ t: 'Estructura', html: `La molécula tiene ${M.at.length} átomos distintos de H y ${f.c.H || 0} hidrógenos: fórmula molecular <b>${f.txt}</b> y masa molar ${coma(masa, 2)} g/mol.` });
    pasos.push({ t: 'Grupos funcionales', html: gr.length ? `Encuentro: ${gr.join(', ')}.` : 'Solo hay enlaces sencillos entre carbonos y hidrógenos: es un alcano.' });
    if (nom) {
      const P = nom.cadena, tc = nom.tipoC;
      pasos.push({ t: 'Grupo principal', html: nom.principal ? `El grupo con más prioridad es <b>${GRUPO[nom.principal]}</b>: pasa a ser el sufijo del nombre (orden: ácido > éster > amida > nitrilo > aldehído > cetona > alcohol > tiol > amina).` : 'No hay ningún grupo con sufijo: se nombra como hidrocarburo y todo lo demás son prefijos.' });
      pasos.push({ t: 'Cadena principal', html: `La cadena principal es la que contiene más grupos principales, luego más enlaces múltiples y después más carbonos: <b>${P.length} carbono${P.length > 1 ? 's' : ''}</b> (${NUM[P.length]}an…).` });
      pasos.push({ t: 'Numeración', html: `Se numera por el extremo que da los localizadores más bajos, por este orden: grupo principal, enlaces múltiples y sustituyentes.` });
      pasos.push({ t: 'Nombre', html: `Los sustituyentes se ordenan alfabéticamente (sin contar di-, tri-…) y van delante: <b>${nom.txt}</b>.` });
    } else pasos.push({ t: 'Nombre', html: `No puedo nombrarla: ${errorNombre}.` });
    for (const c of est.centros) {
      const loc = nom ? nom.locAt(c.i) : null;
      const prio = c.rg.map((t, q) => `${q + 1}. ${t === 'H' ? 'H' : M.at[t].el + (M.at[t].h ? `(${M.at[t].h}H)` : '')}`).join(' &gt; ');
      pasos.push({ t: `Centro quiral${loc ? ' C' + loc : ''}`, html: `Tiene cuatro sustituyentes distintos. Prioridades CIP: ${prio}. ${c.label ? `Con el de menor prioridad detrás, los otros tres giran ${c.label === 'R' ? 'en sentido horario: <b>R</b>' : 'en sentido antihorario: <b>S</b>'}.` : 'Falta la configuración: escribe @ o @@ en el SMILES (por ejemplo [C@H]).'}` });
    }
    for (const d of est.dobles) pasos.push({ t: 'Doble enlace con isomería geométrica', html: d.label ? `Los sustituyentes de mayor prioridad de cada carbono están ${d.label === 'Z' ? 'del mismo lado: <b>Z</b>' : 'en lados opuestos: <b>E</b>'}.` : 'Cada carbono tiene dos sustituyentes distintos, así que hay isómeros E y Z. Marca el lado con / y \\ en el SMILES (por ejemplo C/C=C\\C).' });
    return {
      smiles: sc.smiles.replace(/\s+/g, ''), M, formula: f.txt, formulaPlano: f.plano, masa, grupos: gr, nombre: nom ? nom.txt : '', errorNombre, nom,
      estereo: { centros: est.centros, dobles: est.dobles, quiral: est.quiral, completo: est.completo, lista: vars, nTeorico: 2 ** (est.centros.length + est.dobles.length) },
      atomos: geo.atomos, enlaces: geo.enlaces, radio: geo.radio, geo,
      isomeros: isomerosDe(f.plano), pasos,
    };
  }
  // imagen especular: se invierten todos los centros
  function enantiomero(smiles) {
    const M = leer(smiles), chir = {};
    for (let i = 0; i < M.at.length; i++) if (M.at[i].chir) chir[i] = M.at[i].chir === '@' ? '@@' : '@';
    return escribe(M, { chir });
  }

  const ejemplos = [
    { clave: 'butano', nombre: 'Butano', sc: { smiles: 'CCCC' } },
    { clave: 'isobutano', nombre: '2-Metilpropano (isobutano)', sc: { smiles: 'CC(C)C' } },
    { clave: 'dimetilbutano', nombre: '3-Etil-2-metilpentano', sc: { smiles: 'CCC(CC)C(C)C' } },
    { clave: 'but1eno', nombre: 'But-1-eno', sc: { smiles: 'C=CCC' } },
    { clave: 'but2eno-e', nombre: '(E)-but-2-eno', sc: { smiles: 'C/C=C/C' } },
    { clave: 'but2eno-z', nombre: '(Z)-but-2-eno', sc: { smiles: 'C/C=C\\C' } },
    { clave: 'dieno', nombre: 'Buta-1,3-dieno', sc: { smiles: 'C=CC=C' } },
    { clave: 'propino', nombre: 'Propino', sc: { smiles: 'C#CC' } },
    { clave: 'etanol', nombre: 'Etanol', sc: { smiles: 'CCO' } },
    { clave: 'propan2ol', nombre: 'Propan-2-ol', sc: { smiles: 'CC(O)C' } },
    { clave: 'butan2ol-s', nombre: '(S)-butan-2-ol', sc: { smiles: 'CC[C@H](C)O' } },
    { clave: 'butan2ol-r', nombre: '(R)-butan-2-ol', sc: { smiles: 'CC[C@@H](C)O' } },
    { clave: 'eter', nombre: 'Metoxietano (éter)', sc: { smiles: 'COCC' } },
    { clave: 'propanona', nombre: 'Propanona (acetona)', sc: { smiles: 'CC(C)=O' } },
    { clave: 'propanal', nombre: 'Propanal', sc: { smiles: 'CCC=O' } },
    { clave: 'acetico', nombre: 'Ácido etanoico (acético)', sc: { smiles: 'CC(=O)O' } },
    { clave: 'lactico', nombre: 'Ácido L-láctico', sc: { smiles: 'C[C@H](O)C(=O)O' } },
    { clave: 'alanina', nombre: 'L-Alanina', sc: { smiles: 'N[C@@H](C)C(=O)O' } },
    { clave: 'acetato', nombre: 'Etanoato de etilo (acetato de etilo)', sc: { smiles: 'CC(=O)OCC' } },
    { clave: 'amida', nombre: 'Etanamida', sc: { smiles: 'CC(=O)N' } },
    { clave: 'nitrilo', nombre: 'Etanonitrilo', sc: { smiles: 'CC#N' } },
    { clave: 'etilamina', nombre: 'Etanamina', sc: { smiles: 'CCN' } },
    { clave: 'cloroalcano', nombre: '2-Clorobutano (quiral)', sc: { smiles: 'CC[C@H](C)Cl' } },
    { clave: 'tartarico-meso', nombre: 'Ácido tartárico meso', sc: { smiles: 'O=C(O)[C@H](O)[C@@H](O)C(=O)O' } },
    { clave: 'tartarico-l', nombre: 'Ácido L-(+)-tartárico', sc: { smiles: 'O=C(O)[C@H](O)[C@H](O)C(=O)O' } },
    { clave: 'dicloropentano', nombre: '2,3-Diclorobutano (2 centros)', sc: { smiles: 'C[C@H](Cl)[C@@H](Cl)C' } },
  ];

  return { resolver, leer, escribe, nombrar, estereo, coordenadas, etiquetaGeometrica, diedro, centroEstereo, enantiomero, isomerosDe, variantes, formulaDe, ejemplos, ISOMEROS, ALCANOS, NUM, v3 };
})();
if (typeof module !== 'undefined') module.exports = Organica;
