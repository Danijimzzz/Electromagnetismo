/* =====================================================================
   Integrales múltiples (sin DOM): integral doble y triple de f sobre una
   región dada por límites iterados, en cartesianas, polares (doble),
   cilíndricas y esféricas (triple).
     resolver(sc)  → { modo, I, medida, media, exacto, pasos, niveles, simb, malla… }
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
   El valor sale siempre de una cuadratura de Gauss-Legendre anidada (con un
   cambio de variable que suaviza las raíces en los bordes) y, cuando se
   reconoce, se escribe exacto (4π/3, 14/3…). El desarrollo intenta además
   integrar a mano, nivel a nivel, con las primitivas de Derivadas/Campos
   (primEn): si un nivel no sale, sigue en numérico y lo dice.
   Variables de los límites: x, y, z en cartesianas; t = θ, r (= ρ en esféricas)
   y f = φ en polares, cilíndricas y esféricas. Convenio esférico: φ desde el
   eje z, x = ρ sen φ cos θ, y = ρ sen φ sen θ, z = ρ cos φ.
   ===================================================================== */
const IntegralesMultiples = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const C = typeof Campos !== 'undefined' ? Campos : require('../campos/calculo.js');
  const { sust, primEn } = C;
  const N = E.N, X = E.X;
  const op = (t, a, b) => ({ t, a, b }), neg = (a) => ({ t: 'neg', a }), fn = (f, a) => ({ t: 'fn', f, a });
  const nodo = (k) => (k === 'x' ? X : { t: 'x', n: k });
  const T = (n) => E.texto(E.simp(n));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const valorEn = (n, env) => E.valor(n, env.x, env);
  const f = C.f, ex = C.ex;
  const M = (s) => `$${s}$`;

  /* ---------- Cuadratura anidada ---------- */
  const GX = [-0.9602898564975363, -0.7966664774136267, -0.525532409916329, -0.1834346424956498, 0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363];
  const GW = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.362683783378362, 0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
  // ∫ de a a b con x = a + (b − a)(3u² − 2u³): las raíces de los bordes (√(1 − x²)) dejan de ser un problema
  function gl(h, a, b, m = 8) {
    if (a === b) return 0;
    let s = 0;
    for (let k = 0; k < m; k++) for (let i = 0; i < 8; i++) {
      const u = (k + (GX[i] + 1) / 2) / m;
      s += GW[i] * h(a + (b - a) * u * u * (3 - 2 * u)) * 6 * u * (1 - u);
    }
    return (s * (b - a)) / (2 * m);
  }
  function itera(niv, g, env, j = 0, m = 8) {
    if (j === niv.length) return valorEn(g, env);
    const L = niv[j], a = valorEn(L.lo, env), b = valorEn(L.hi, env);
    if (!isFinite(a) || !isFinite(b)) return NaN;
    return gl((t) => { env[L.k] = t; return itera(niv, g, env, j + 1, m); }, a, b, m);
  }

  /* ---------- Lectura ---------- */
  const GR = (s) => String(s ?? '').replace(/θ/g, 't').replace(/φ/g, 'f').replace(/ρ/g, 'r');
  const lee = (s, nom, vars) => { if (vacio(s)) throw new Error(`Falta ${nom[0].toLowerCase() + nom.slice(1)}`); return E.lee(GR(s), nom, vars); };
  // sustituye a la vez (sust no encadena): cada letra del alumno → su nodo interno
  const interno = (n, niv, j) => sust(n, Object.fromEntries(niv.slice(0, j).map((L) => [L.u, nodo(L.k)])));

  // x² + y² (+ z²) con el mismo coeficiente → c·r²: así (x² + y²) y e^(−x² − y²) pasan a polares limpios
  function terminos(n, s = 1, out = []) {
    if (n.t === '+') { terminos(n.a, s, out); terminos(n.b, s, out); } else if (n.t === '-') { terminos(n.a, s, out); terminos(n.b, -s, out); } else if (n.t === 'neg') terminos(n.a, -s, out); else out.push({ s, n });
    return out;
  }
  const cuad = (n) => {
    if (n.t === '^' && n.a.t === 'x' && n.b.t === 'n' && n.b.v === 2) return { v: n.a.n || 'x', c: 1 };
    if (n.t === '*' && n.a.t === 'n') { const q = cuad(n.b); return q && { v: q.v, c: q.c * n.a.v }; }
    if (n.t === '*' && n.b.t === 'n') { const q = cuad(n.a); return q && { v: q.v, c: q.c * n.b.v }; }
    if (n.t === 'neg') { const q = cuad(n.a); return q && { v: q.v, c: -q.c }; }
    return null;
  };
  function agrupa(n, vs, por) {
    if (n.a || n.b) n = { ...n, ...(n.a ? { a: agrupa(n.a, vs, por) } : {}), ...(n.b ? { b: agrupa(n.b, vs, por) } : {}) };
    if (n.t !== '+' && n.t !== '-') return n;
    let ts = terminos(n).map((q) => ({ ...q, q: cuad(q.n) }));
    const ps = vs.map((v) => ts.find((q) => q.q && q.q.v === v));
    if (ps.some((p) => !p)) return n;
    const c = ps[0].s * ps[0].q.c;
    if (!ps.every((p) => Math.abs(p.s * p.q.c - c) < 1e-12)) return n;
    const resto = ts.filter((q) => !ps.includes(q));
    const nuevo = { s: 1, n: op('*', N(c), por) };
    const todos = [nuevo, ...resto];
    let r = null;
    for (const q of todos) r = r ? op(q.s > 0 ? '+' : '-', r, q.n) : q.s > 0 ? q.n : neg(q.n);
    return r;
  }

  /* ---------- Definición de cada tipo ---------- */
  const pot = (a, k) => op('^', a, N(k)), mul = (...xs) => xs.reduce((a, b) => op('*', a, b));
  const sen = (a) => fn('sen', a), cos = (a) => fn('cos', a);
  const TH = nodo('θ'), R = nodo('r'), PH = nodo('φ'), RO = nodo('ρ'), Z = nodo('z');
  const MODOS = {
    cart2: { dim: 2, nombre: 'Integral doble en cartesianas', vars: ['x', 'y'] },
    polar: { dim: 2, nombre: 'Integral doble en polares', vars: ['x', 'y'] },
    cart3: { dim: 3, nombre: 'Integral triple en cartesianas', vars: ['x', 'y', 'z'] },
    cil: { dim: 3, nombre: 'Integral triple en cilíndricas', vars: ['x', 'y', 'z'] },
    esf: { dim: 3, nombre: 'Integral triple en esféricas', vars: ['x', 'y', 'z'] },
  };
  // niveles de fuera adentro: k = nombre interno, u = letra del alumno, ra y rb = lo que escribió
  function niveles(sc) {
    switch (sc.modo) {
      case 'cart2': { const xy = sc.orden === 'xy', [o, i] = xy ? ['y', 'x'] : ['x', 'y']; return [{ k: o, u: o, ra: sc.a, rb: sc.b }, { k: i, u: i, ra: sc.g1, rb: sc.g2 }]; }
      case 'polar': return [{ k: 'θ', u: 't', ra: sc.a, rb: sc.b }, { k: 'r', u: 'r', ra: sc.g1, rb: sc.g2 }];
      case 'cart3': return [{ k: 'x', u: 'x', ra: sc.a, rb: sc.b }, { k: 'y', u: 'y', ra: sc.g1, rb: sc.g2 }, { k: 'z', u: 'z', ra: sc.h1, rb: sc.h2 }];
      case 'cil': return [{ k: 'θ', u: 't', ra: sc.a, rb: sc.b }, { k: 'r', u: 'r', ra: sc.g1, rb: sc.g2 }, { k: 'z', u: 'z', ra: sc.h1, rb: sc.h2 }];
      case 'esf': return [{ k: 'θ', u: 't', ra: sc.a, rb: sc.b }, { k: 'φ', u: 'f', ra: sc.g1, rb: sc.g2 }, { k: 'ρ', u: 'r', ra: sc.h1, rb: sc.h2 }];
    }
    throw new Error('Elige qué integral calcular');
  }
  const NOM_LIM = { x: 'x', y: 'y', z: 'z', 'θ': 'θ', r: 'r', 'φ': 'φ', 'ρ': 'ρ' };
  const NOM_INT = { cart2: 'el integrando', polar: 'el integrando', cart3: 'el integrando', cil: 'el integrando', esf: 'el integrando' };
  // posición (x, y, z) de un punto con las variables del modo
  function punto(modo, e) {
    switch (modo) {
      case 'cart2': case 'cart3': return [e.x, e.y ?? 0, e.z ?? 0];
      case 'polar': return [e.r * Math.cos(e['θ']), e.r * Math.sin(e['θ']), 0];
      case 'cil': return [e.r * Math.cos(e['θ']), e.r * Math.sin(e['θ']), e.z];
      case 'esf': return [e['ρ'] * Math.sin(e['φ']) * Math.cos(e['θ']), e['ρ'] * Math.sin(e['φ']) * Math.sin(e['θ']), e['ρ'] * Math.cos(e['φ'])];
    }
  }

  function define(sc) {
    const modo = sc.modo, M0 = MODOS[modo];
    if (!M0) throw new Error('Elige qué integral calcular');
    const niv = niveles(sc);
    niv.forEach((L, j) => {
      const nl = NOM_LIM[L.k], vs = niv.slice(0, j).map((q) => q.u);
      const alt = vs.length ? ` (puede depender de ${vs.join(' y ')})` : '';
      L.lo = interno(lee(L.ra, `El límite inferior de ${nl}`, vs), niv, j);
      L.hi = interno(lee(L.rb, `El límite superior de ${nl}`, vs), niv, j);
      L.alt = alt;
    });
    let fx = lee(sc.f, 'El integrando f', M0.vars);
    const usa = (v) => E.tieneX(fx, v);
    let g, J;
    if (modo === 'cart2' || modo === 'cart3') { g = fx; J = N(1); }
    else {
      if (modo === 'polar') { J = R; g = sust(agrupa(fx, ['x', 'y'], pot(R, 2)), { x: mul(R, cos(TH)), y: mul(R, sen(TH)) }); }
      else if (modo === 'cil') { J = R; g = sust(agrupa(fx, ['x', 'y'], pot(R, 2)), { x: mul(R, cos(TH)), y: mul(R, sen(TH)), z: Z }); }
      else {
        J = mul(pot(RO, 2), sen(PH));
        const a3 = agrupa(fx, ['x', 'y', 'z'], pot(RO, 2));
        g = sust(agrupa(a3, ['x', 'y'], mul(pot(RO, 2), pot(sen(PH), 2))), { x: mul(RO, sen(PH), cos(TH)), y: mul(RO, sen(PH), sen(TH)), z: mul(RO, cos(PH)) });
      }
      g = E.simp(op('*', g, J));
    }
    if (M0.dim === 2 && usa('z')) throw new Error('En una integral doble solo hay x e y');
    return { modo, M0, niv, fx, g, J };
  }

  // los límites tienen que estar definidos y en orden (inferior ≤ superior) en toda la región
  function revisa(niv) {
    const env = {};
    const rec = (j) => {
      if (j === niv.length) return;
      const L = niv[j], a = valorEn(L.lo, env), b = valorEn(L.hi, env), nl = NOM_LIM[L.k];
      const donde = Object.keys(env).length ? ' en ' + Object.entries(env).map(([k, v]) => `${k === 'θ' ? 'θ' : k} = ${f(v)}`).join(', ') : '';
      if (!isFinite(a) || !isFinite(b)) throw new Error(`Los límites de ${nl} no están definidos${donde}: revisa la región`);
      if (a > b + 1e-9) throw new Error(`El límite inferior de ${nl} (${f(a)}) queda por encima del superior (${f(b)})${donde}: cámbialos o revisa la región`);
      for (const q of [0, 0.25, 0.5, 0.75, 1]) { env[L.k] = a + (b - a) * q; rec(j + 1); if (a === b) break; }
      delete env[L.k];
    };
    rec(0);
  }

  /* ---------- Integración a mano por niveles ---------- */
  const VARS = ['x', 'y', 'z', 'θ', 'r', 'φ', 'ρ'];
  const constante = (n) => !VARS.some((v) => E.tieneX(n, v));
  // cos π = −1, sen(π/2) = 1…: las funciones de constantes con valor racional pasan a número
  function plega(n) {
    if (!n.a && !n.b) return n;
    const m = { ...n, ...(n.a ? { a: plega(n.a) } : {}), ...(n.b ? { b: plega(n.b) } : {}) };
    if (m.t === 'fn' && constante(m)) { const v = E.valor(m, 0), q = isFinite(v) && E.fraccion(v, 12); if (q && Math.abs(q[0] / q[1] - v) < 1e-12) return N(q[0] / q[1]); }
    return m;
  }
  const sumaT = (ts) => { let r = null; for (const q of ts) r = r ? op(q.s > 0 ? '+' : '-', r, q.n) : q.s > 0 ? q.n : neg(q.n); return r || N(0); };
  // desarrolla productos y potencias enteras de sumas y reparte entre constantes: (1 + cos θ)²/2 → 1/2 + cos θ + cos²θ/2
  function expande(n) {
    if (!n.a && !n.b) return n;
    const a = n.a && expande(n.a), b = n.b && expande(n.b);
    if (n.t === '*') {
      const ta = terminos(a), tb = terminos(b);
      if (ta.length > 1 || tb.length > 1) return expande(sumaT(ta.flatMap((p) => tb.map((q) => ({ s: p.s * q.s, n: op('*', p.n, q.n) })))));
    }
    if (n.t === '^' && b.t === 'n' && Number.isInteger(b.v) && b.v >= 2 && b.v <= 6 && terminos(a).length > 1) return expande(op('*', a, op('^', a, N(b.v - 1))));
    if (n.t === '/' && constante(b) && terminos(a).length > 1) return sumaT(terminos(a).map((p) => ({ s: p.s, n: op('/', p.n, b) })));
    return { ...n, ...(a ? { a } : {}), ...(b ? { b } : {}) };
  }
  // cos² u = (1 + cos 2u)/2, sen² u = (1 − cos 2u)/2
  function baja(n) {
    if (!n.a && !n.b) return n;
    const m = { ...n, ...(n.a ? { a: baja(n.a) } : {}), ...(n.b ? { b: baja(n.b) } : {}) };
    if (m.t === '^' && m.a.t === 'fn' && (m.a.f === 'cos' || m.a.f === 'sen') && m.b.t === 'n' && m.b.v >= 2 && m.b.v % 2 === 0) {
      const mitad = op('/', op(m.a.f === 'cos' ? '+' : '-', N(1), fn('cos', op('*', N(2), m.a.a))), N(2));
      return m.b.v === 2 ? mitad : op('^', mitad, N(m.b.v / 2));
    }
    return m;
  }
  const prepara = (n) => { let r = E.simp(n); for (let i = 0; i < 4; i++) r = E.simp(expande(baja(E.simp(expande(r))))); return r; };
  function primitiva(cur, k) {
    let F = null;
    try { F = primEn(cur, k); } catch (e) { F = null; }
    if (F) return { F, nota: false };
    try { const p = prepara(cur); F = primEn(p, k); } catch (e) { F = null; }
    return F ? { F, nota: true } : null;
  }
  // devuelve [{ L, F, res, ok }] hasta donde se pueda; cada resultado se contrasta con la cuadratura
  function simbolico(niv, g) {
    const out = [];
    let cur = g;
    for (let j = niv.length - 1; j >= 0; j--) {
      const L = niv[j];
      let F = null, res = null, nota = false;
      const pr = primitiva(cur, L.k);
      if (pr) {
        ({ F, nota } = pr);
        try { res = E.simp(plega(E.simp(op('-', sust(F, { [L.k]: L.hi }), sust(F, { [L.k]: L.lo }))))); } catch (e) { res = null; }
      }
      // contraste en un punto de las variables de fuera
      if (res) {
        const env = {};
        let bien = true;
        for (let i = 0; i < j; i++) { const a = valorEn(niv[i].lo, env), b = valorEn(niv[i].hi, env); env[niv[i].k] = a + (b - a) * 0.4; }
        const a = valorEn(L.lo, env), b = valorEn(L.hi, env), v1 = valorEn(res, env), v2 = gl((t) => { env[L.k] = t; return valorEn(cur, env); }, a, b);
        bien = isFinite(v1) && Math.abs(v1 - v2) <= 1e-7 * Math.max(1, Math.abs(v2));
        if (!bien) res = null;
      }
      if (!F || !res) break;
      out.push({ L, F, res, nota });
      cur = res;
    }
    return out;
  }

  /* ---------- Resolver ---------- */
  const difs = (niv) => niv.slice().reverse().map((L) => `d${L.k}`).join(' ');
  const ETQ = { cart2: 'dA = dx dy', polar: 'dA = r dr dθ', cart3: 'dV = dx dy dz', cil: 'dV = r dr dθ dz', esf: 'dV = ρ^{2} sen φ dρ dφ dθ' };
  const sub = (a) => `_{${a}}`;
  function resolver(sc) {
    const d = define(sc), { modo, M0, niv, fx, g, J } = d;
    revisa(niv);
    const I = itera(niv, g, {}), medida = itera(niv, J, {});
    if (!isFinite(I)) throw new Error('El integrando no está definido en algún punto de la región (¿una división entre 0 o un logaritmo de un negativo?)');
    // si con otra malla sale otro valor, el integrando se dispara en un borde (integral impropia)
    const I2 = itera(niv, g, {}, 0, M0.dim === 2 ? 16 : 4);
    if (!(Math.abs(I - I2) <= 2e-4 * Math.max(1, Math.abs(I)))) throw new Error('La integral parece impropia: el integrando se hace infinito en algún punto de la región (como 1/x en x = 0) o cambia demasiado deprisa. Prueba con otra región.');
    const media = medida > 1e-12 ? I / medida : NaN, doble = M0.dim === 2, unidad = doble ? 'área' : 'volumen';
    const nombreMedida = doble ? 'Área de la región' : 'Volumen de la región', simb = simbolico(niv, g);
    const pasos = [];
    const lim = (L) => `${T(L.lo)} ≤ ${L.k} ≤ ${T(L.hi)}`;
    const rangos = niv.map((L) => M(lim(L))).join(',&ensp; ');
    pasos.push({ t: 'Región de integración', html: `Los límites se escriben de fuera adentro, y los de cada variable pueden depender de las de fuera: ${rangos}. ${modo === 'cart2' ? `Se integra primero en ${niv[1].k} (con ${niv[0].k} fijo) y luego en ${niv[0].k}.` : ''}` });
    if (modo === 'polar') pasos.push({ t: 'Cambio a polares', html: `Con $x = r cos θ$, $y = r sen θ$ el elemento de área es $dA = r dr dθ$: el factor $r$ (el jacobiano) es el largo del arco $r dθ$ de un trocito de anillo de ancho $dr$. Además $x^{2} + y^{2} = r^{2}$.` });
    if (modo === 'cil') pasos.push({ t: 'Cambio a cilíndricas', html: `Con $x = r cos θ$, $y = r sen θ$, $z = z$ el elemento de volumen es $dV = r dr dθ dz$ (jacobiano $r$, como en polares) y $x^{2} + y^{2} = r^{2}$.` });
    if (modo === 'esf') pasos.push({ t: 'Cambio a esféricas', html: `Con $x = ρ sen φ cos θ$, $y = ρ sen φ sen θ$, $z = ρ cos φ$ (φ se mide desde el eje z) el elemento de volumen es $dV = ρ^{2} sen φ dρ dφ dθ$ (jacobiano $ρ^{2} sen φ$) y $x^{2} + y^{2} + z^{2} = ρ^{2}$.` });
    if (modo !== 'cart2' && modo !== 'cart3') pasos.push({ t: 'El integrando', html: `$f = ${T(fx)}$ pasa a $f · ${T(J)} = ${T(g)}$.` });
    const caja = (niv0, cuerpo) => niv0.reduce((s, L) => `∫${sub(T(L.lo))}^{${T(L.hi)}} ${s}`, cuerpo);
    const orden = niv.map((L) => L.k);
    const itLinea = `∫${sub(T(niv[0].lo))}^{${T(niv[0].hi)}} ` + niv.slice(1).map((L) => `∫${sub(T(L.lo))}^{${T(L.hi)}} `).join('') + `(${T(g)}) ${difs(niv)}`;
    pasos.push({ t: 'Integral iterada', html: `${M(`${doble ? '∬' : '∭'}${sub('D')} f ${doble ? 'dA' : 'dV'} = ${itLinea}`)}. Se hace de dentro afuera: primero ${orden[orden.length - 1]}, después ${orden.slice(0, -1).reverse().join(' y ') || ''}${niv.length > 1 ? '' : ''}.` });
    // nivel a nivel
    simb.forEach(({ L, F, res, nota }, i) => {
      const resto = niv.slice(0, niv.indexOf(L));
      pasos.push({ t: `Integral respecto de ${L.k}${resto.length ? ` (con ${resto.map((q) => q.k).join(', ')} fijo${resto.length > 1 ? 's' : ''})` : ''}`, html: `${M(`∫ ${i === 0 ? `(${T(g)})` : `(${T(simb[i - 1].res)})`} d${L.k} = ${T(F)}`)}. Entre ${M(T(L.lo))} y ${M(T(L.hi))}: ${M(`[${T(F)}]${sub(T(L.lo))}^{${T(L.hi)}} = ${T(res)}`)}.${nota ? ' Antes se desarrolla el integrando y se baja la potencia con $cos^{2} u = {1 + cos 2u}/{2}$ (y $sen^{2} u = {1 − cos 2u}/{2}$).' : ''}` });
    });
    const completo = simb.length === niv.length;
    if (!completo) {
      const hecho = simb.length, quedan = niv.slice(0, niv.length - hecho).map((L) => L.k);
      pasos.push({ t: 'El resto, numérico', html: hecho
        ? `El resultado de esa integral (${M(T(simb[hecho - 1].res))}) ya no se integra en ${niv[niv.length - hecho - 1].k} con las reglas de la herramienta. Lo que falta (${quedan.join(' y ')}) se calcula con una cuadratura numérica de Gauss–Legendre, con error mucho menor que la última cifra.`
        : `La primera integral (en ${niv[niv.length - 1].k}) no sale con las reglas de la herramienta. Se calcula con una cuadratura numérica de Gauss–Legendre anidada, con error mucho menor que la última cifra.` });
    }
    const exI = ex(I, 5), dec = exI === f(I, 5), simbFinal = completo && dec ? T(simb[simb.length - 1].res) : null;
    pasos.push({ t: 'Resultado', html: `${M(`${doble ? '∬' : '∭'}${sub('D')} f ${doble ? 'dA' : 'dV'} = ${simbFinal ? `${simbFinal} ≈ ${f(I, 5)}` : `${exI}${dec ? '' : ` ≈ ${f(I, 5)}`}`}`)}.` });
    if (medida > 1e-12) pasos.push({ t: `${nombreMedida} y valor medio`, html: `Con $f = 1$ sale el ${unidad} de la región: ${M(`${ex(medida, 5)}${ex(medida, 5) === f(medida, 5) ? '' : ` ≈ ${f(medida, 5)}`}`)}. El valor medio de f es ${M(`{${doble ? '∬' : '∭'} f}/{${unidad === 'área' ? 'A' : 'V'}} = ${f(media, 5)}`)}.` });
    return { modo, nombre: M0.nombre, doble, niveles: niv, I, exacto: exI, medida, media, nombreMedida, unidad, simb: simb.map((s) => T(s.res)), completo, pasos, fTxt: T(fx), gTxt: T(g), difs: difs(niv), itLinea, malla: (n = 16) => malla(modo, niv, n) };
  }

  /* ---------- Malla para la gráfica ---------- */
  function malla(modo, niv, n) {
    const env = {}, dim = niv.length;
    const filas = [];
    const [L0, L1, L2] = niv;
    const a0 = valorEn(L0.lo, env), b0 = valorEn(L0.hi, env);
    for (let i = 0; i <= n; i++) {
      env[L0.k] = a0 + ((b0 - a0) * i) / n;
      const lo1 = valorEn(L1.lo, env), hi1 = valorEn(L1.hi, env);
      if (dim === 2) { env[L1.k] = lo1; const p = punto(modo, env); env[L1.k] = hi1; filas.push({ lo: p, hi: punto(modo, env), medio: [] }); continue; }
      const fila = [];
      for (let j = 0; j <= n; j++) {
        env[L1.k] = lo1 + ((hi1 - lo1) * j) / n;
        const lo2 = valorEn(L2.lo, env), hi2 = valorEn(L2.hi, env);
        env[L2.k] = lo2; const p = punto(modo, env); env[L2.k] = hi2; fila.push({ lo: p, hi: punto(modo, env) });
      }
      filas.push(fila);
    }
    return filas;
  }

  /* ---------- Ejemplos ---------- */
  const ejemplos = [
    { clave: 'rectangulo', nombre: 'Doble: ∬ (x + y) en un rectángulo', sc: { modo: 'cart2', orden: 'yx', f: 'x + y', a: '0', b: '2', g1: '0', g2: '1' } },
    { clave: 'parabola', nombre: 'Doble: ∬ x y entre y = x² e y = x', sc: { modo: 'cart2', orden: 'yx', f: 'x y', a: '0', b: '1', g1: 'x^2', g2: 'x' } },
    { clave: 'cambio-orden', nombre: 'Doble: e^(y²) cambiando el orden (dx dy)', sc: { modo: 'cart2', orden: 'xy', f: 'e^(y^2)', a: '0', b: '1', g1: '0', g2: 'y' } },
    { clave: 'disco', nombre: 'Polares: ∬ (x² + y²) en un círculo', sc: { modo: 'polar', f: 'x^2 + y^2', a: '0', b: '2π', g1: '0', g2: '2' } },
    { clave: 'corona', nombre: 'Polares: ∬ y en media corona', sc: { modo: 'polar', f: 'y', a: '0', b: 'π', g1: '1', g2: '2' } },
    { clave: 'gauss', nombre: 'Polares: ∬ e^(−x²−y²) en el círculo unidad', sc: { modo: 'polar', f: 'e^(-x^2-y^2)', a: '0', b: '2π', g1: '0', g2: '1' } },
    { clave: 'cardioide', nombre: 'Polares: área de la cardioide r = 1 + cos θ', sc: { modo: 'polar', f: '1', a: '0', b: '2π', g1: '0', g2: '1 + cos t' } },
    { clave: 'caja', nombre: 'Triple: ∭ x y z en el cubo unidad', sc: { modo: 'cart3', f: 'x y z', a: '0', b: '1', g1: '0', g2: '1', h1: '0', h2: '1' } },
    { clave: 'tetraedro', nombre: 'Triple: ∭ z en un tetraedro', sc: { modo: 'cart3', f: 'z', a: '0', b: '1', g1: '0', g2: '1 - x', h1: '0', h2: '1 - x - y' } },
    { clave: 'cilindro', nombre: 'Cilíndricas: ∭ (x² + y²) en un cilindro', sc: { modo: 'cil', f: 'x^2 + y^2', a: '0', b: '2π', g1: '0', g2: '1', h1: '0', h2: '2' } },
    { clave: 'cono', nombre: 'Cilíndricas: volumen de un cono', sc: { modo: 'cil', f: '1', a: '0', b: '2π', g1: '0', g2: '1', h1: 'r', h2: '1' } },
    { clave: 'esfera', nombre: 'Esféricas: ∭ (x² + y² + z²) en la esfera unidad', sc: { modo: 'esf', f: 'x^2 + y^2 + z^2', a: '0', b: '2π', g1: '0', g2: 'π', h1: '0', h2: '1' } },
    { clave: 'hemisferio', nombre: 'Esféricas: ∭ z en el hemisferio superior', sc: { modo: 'esf', f: 'z', a: '0', b: '2π', g1: '0', g2: 'π/2', h1: '0', h2: '1' } },
  ];

  return { resolver, ejemplos, f, ex, MODOS };
})();
if (typeof module !== 'undefined') module.exports = IntegralesMultiples;
