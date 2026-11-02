/* =====================================================================
   Derivadas e integrales (sin DOM): derivada de cualquier orden con la
   regla que se usa en cada paso (suma, producto, cociente, cadena…),
   recta tangente y puntos críticos; primitiva por la tabla, sustitución,
   partes, fracciones simples e identidades trigonométricas, comprobada
   derivándola, e integral definida por Barrow (o numérica si no hay
   primitiva elemental). Usa Expresion (matematicas/expresion.js) para
   leer, derivar y escribir, y Laplace (laplace/calculo.js) para las
   raíces y los coeficientes de las fracciones simples.
   ===================================================================== */
const Derivadas = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const LapR = typeof Laplace !== 'undefined' ? Laplace : require('../laplace/calculo.js');
  const N = (v) => ({ t: 'n', v }), X = { t: 'x' }, C = (v) => ({ t: 'c', v });
  const op = (t, a, b) => ({ t, a, b }), neg = (a) => ({ t: 'neg', a }), fn = (f, a) => ({ t: 'fn', f, a });
  const esNum = (n) => n.t === 'n';
  const tx = (n) => E.tieneX(n);
  // texto para Mates, con ln |u| sin paréntesis de más y los cocientes de polinomios desarrollados
  const T = (n) => E.texto(pulir(E.simp(n))).replace(/(ln|tg|sen|cos) \(\|((?:[^()|]|\([^()]*\))*)\|\)/g, '$1 |$2|');
  const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));
  // numerador polinómico desarrollado y, si se puede, simplificado con los factores del denominador
  function pulir(n) {
    let sg = 1, q = n;
    if (q.t === 'neg') { sg = -1; q = q.a; }
    if (q.t !== '/' || !tx(q.b)) return n;
    let Pn = poli(q.a);
    if (!Pn || Pn.length < 2) return n;
    const den = factores(q.b), fs = den.fs.map((g) => { const b = g.n.t === '^' && esNum(g.n.b) && Number.isInteger(g.n.b.v) ? g.n.a : g.n, k = b === g.n ? 1 : g.n.b.v; return { b, k: k * g.s, P: poli(b) }; });
    if (fs.some((g) => g.k < 0)) return n;
    // dividir Pn entre P si es exacto
    const divide = (A, B) => {
      const r = A.slice(), dq = new Array(Math.max(0, A.length - B.length + 1)).fill(0), l = B[B.length - 1];
      for (let i = A.length - B.length; i >= 0; i--) { const c = r[i + B.length - 1] / l; dq[i] = c; for (let j = 0; j < B.length; j++) r[i + j] -= c * B[j]; }
      return r.slice(0, B.length - 1).every((v) => Math.abs(v) < 1e-9 * Math.max(1, ...A.map(Math.abs))) ? dq.map((v) => { const k = Math.round(v); return Math.abs(v - k) < 1e-9 ? k : v; }) : null;
    };
    for (const g of fs) while (g.P && g.P.length > 1 && g.k > 0) { const d = divide(Pn, g.P); if (!d) break; Pn = d; g.k--; }
    Pn = Pn.map((c) => c * sg * den.k ** -1);
    // signo fuera y el factor común entero del numerador
    let lead = Pn[Pn.length - 1] < 0 ? -1 : 1;
    const ent = Pn.every((c) => Number.isInteger(c)), g0 = ent ? Pn.reduce((a, c) => mcd(a, c), 0) : 1;
    const k = ent && g0 > 1 ? lead * g0 : lead;
    const numA = poliDesc(Pn.map((c) => c / k)), kk = Math.abs(k);
    const arriba = kk !== 1 ? (numA.t === '+' || numA.t === '-' ? op('*', N(kk), numA) : poliDesc(Pn.map((c) => c * lead))) : numA;
    const resto = fs.filter((g) => g.k > 0).map((g) => (g.k === 1 ? g.b : op('^', g.b, N(g.k))));
    const r = resto.length ? op('/', arriba, mul(resto)) : arriba;
    return lead < 0 ? neg(r) : r;
  }
  // polinomio de mayor a menor grado: x^2 − 2x − 1
  const poliDesc = (c) => { let r = null; for (let i = c.length - 1; i >= 0; i--) { const k = c[i]; if (Math.abs(k) < 1e-14) continue; const m = i === 0 ? N(Math.abs(k)) : Math.abs(k) === 1 ? (i === 1 ? X : op('^', X, N(i))) : op('*', N(Math.abs(k)), i === 1 ? X : op('^', X, N(i))); r = r ? op(k < 0 ? '-' : '+', r, m) : k < 0 ? neg(m) : m; } return r || N(0); };
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function num(s, nom) {
    if (vacio(s)) throw new Error(`Falta ${nom}`);
    const a = E.lee(String(s), nom, ['x']);
    if (tx(a)) throw new Error(`${nom} tiene que ser un número`);
    const v = E.valor(a, 0);
    if (!isFinite(v)) throw new Error(`${nom} no es un número válido`);
    return v;
  }
  const mul = (xs) => (xs.length ? xs.reduce((a, b) => op('*', a, b)) : N(1));
  // mismo valor en unos puntos de prueba (donde las dos existen)
  const PRUEBA = [-2.3, -1.1, -0.37, 0.29, 0.83, 1.7, 2.6, 3.4];
  // y unos cuantos cerca de 0, para funciones con dominio pequeño (√(4 − 9x²))
  const PEQ = [-0.61, -0.47, -0.19, 0.11, 0.43, 0.58];
  function igualNum(a, b, tol = 1e-7) {
    let n = 0;
    for (const x of [...PRUEBA, ...PEQ]) {
      const p = E.valor(a, x), q = E.valor(b, x);
      if (!isFinite(p) || !isFinite(q)) continue;
      if (Math.abs(p - q) > tol * Math.max(1, Math.abs(q))) return false;
      n++;
    }
    return n >= 3;
  }
  // a/b es constante: el número o null
  function cociente(a, b) {
    let k = null, n = 0;
    for (const x of PRUEBA) {
      const p = E.valor(a, x), q = E.valor(b, x);
      if (!isFinite(p) || !isFinite(q) || Math.abs(q) < 1e-9) continue;
      const r = p / q;
      if (k === null) k = r; else if (Math.abs(r - k) > 1e-8 * Math.max(1, Math.abs(k))) return null;
      n++;
    }
    return n >= 3 ? k : null;
  }
  // u = a x + b
  function lineal(u) {
    if (!tx(u)) return null;
    const b = E.valor(u, 0), a = E.valor(u, 1) - b;
    if (!isFinite(a) || !isFinite(b) || Math.abs(a) < 1e-14) return null;
    for (const x of [-1.7, 2.3]) if (Math.abs(E.valor(u, x) - (a * x + b)) > 1e-9 * Math.max(1, Math.abs(a * x + b))) return null;
    return { a, b };
  }
  // polinomio en x: coeficientes de grado 0 … n o null
  function poli(n) {
    if (!tx(n)) { const v = E.valor(n, 0); return isFinite(v) ? [v] : null; }
    let c;
    try { c = [...E.serie(n, 0, 20)]; } catch (e) { return null; }
    let g = c.length - 1; while (g > 0 && Math.abs(c[g]) < 1e-10) g--;
    if (g > 16) return null;
    c = c.slice(0, g + 1).map((v) => { const r = Math.round(v); return Math.abs(v - r) < 1e-9 ? r : v; });
    for (const x of [-1.9, 0.7, 2.2]) { const p = c.reduceRight((s, k) => s * x + k, 0), q = E.valor(n, x); if (!isFinite(q) || Math.abs(p - q) > 1e-8 * Math.max(1, Math.abs(q))) return null; }
    return c;
  }
  const poliAst = (c) => poliDesc(c);

  /* ---------- Derivada con sus reglas ---------- */
  const D = (n) => E.deriva(n);
  const FUNC = {
    sen: 'cos u', cos: '−sen u', tg: '{1}/{cos^{2} u} = 1 + tg^{2} u', ln: '{1}/{u}', log: '{1}/{u ln 10}', sqrt: '{1}/{2 √u}', cbrt: '{1}/{3 ∛u^{2}}',
    arcsen: '{1}/{√(1 − u^{2})}', arccos: '−{1}/{√(1 − u^{2})}', arctg: '{1}/{1 + u^{2}}', senh: 'cosh u', cosh: 'senh u', tgh: '{1}/{cosh^{2} u}',
    sec: '"sec" u tg u', cosec: '−"cosec" u "cotg" u', cotg: '−{1}/{sen^{2} u}', abs: '{u}/{|u|}',
  };
  function reglas(n, pasos, prof = 0) {
    if (pasos.length >= 9 || !tx(n) || n.t === 'x') return;
    const d = (q) => T(D(q)), t = T;
    const sub = (q) => { if (tx(q) && q.t !== 'x' && !lineal(q)) reglas(q, pasos, prof + 1); };
    switch (n.t) {
      case '+': case '-': {
        if (prof === 0) pasos.push({ t: 'Suma', html: `La derivada de una suma es la suma de las derivadas: se deriva cada término.` });
        sub(n.a); sub(n.b); return;
      }
      case 'neg': sub(n.a); return;
      case '*': {
        if (!tx(n.a) || !tx(n.b)) { const k = tx(n.a) ? n.b : n.a, u = tx(n.a) ? n.a : n.b; if (prof === 0) pasos.push({ t: 'Constante por función', html: `$(k u)′ = k u′$, con $k = ${t(k)}$.` }); sub(u); return; }
        pasos.push({ t: 'Regla del producto', html: `$(u v)′ = u′ v + u v′$, con $u = ${t(n.a)}$ y $v = ${t(n.b)}$:<br>$u′ = ${d(n.a)}$, &ensp; $v′ = ${d(n.b)}$` });
        sub(n.a); sub(n.b); return;
      }
      case '/': {
        if (!tx(n.b)) { sub(n.a); return; }
        pasos.push({ t: 'Regla del cociente', html: `$({u}/{v})′ = {u′ v − u v′}/{v^{2}}$, con $u = ${t(n.a)}$ y $v = ${t(n.b)}$:<br>$u′ = ${d(n.a)}$, &ensp; $v′ = ${d(n.b)}$` });
        sub(n.a); sub(n.b); return;
      }
      case '^': {
        const { a, b } = n;
        if (!tx(b)) {
          if (a.t === 'x') return;
          pasos.push({ t: 'Potencia y regla de la cadena', html: `$(u^{n})′ = n u^{n − 1} u′$, con $u = ${t(a)}$ y $n = ${t(b)}$:<br>$u′ = ${d(a)}$` });
          sub(a); return;
        }
        if (a.t === 'c' && a.v === 'e') { if (b.t !== 'x') pasos.push({ t: 'Exponencial y regla de la cadena', html: `$(e^{u})′ = e^{u} u′$, con $u = ${t(b)}$:<br>$u′ = ${d(b)}$` }); sub(b); return; }
        if (!tx(a)) { pasos.push({ t: 'Exponencial de base a', html: `$(a^{u})′ = a^{u} ln a · u′$, con $a = ${t(a)}$ y $u = ${t(b)}$:<br>$u′ = ${d(b)}$` }); sub(b); return; }
        pasos.push({ t: 'Derivación logarítmica', html: `Para $y = u^{v}$ se toma logaritmo: $ln y = v ln u$, y derivando $y′ = u^{v} (v′ ln u + {v u′}/{u})$, con $u = ${t(a)}$ y $v = ${t(b)}$.` });
        return;
      }
      case 'fn': {
        const u = n.a, F = FUNC[n.f] || '';
        if (u.t === 'x') { if (prof === 0) pasos.push({ t: 'Derivada de la tabla', html: `$(${n.f} x)′ = ${F.replace(/u/g, 'x')}$` }); return; }
        pasos.push({ t: 'Regla de la cadena', html: `$(f(u))′ = f′(u) · u′$: aquí $f = ${n.f === 'sqrt' ? '√' : n.f}$ y $u = ${t(u)}$, con $(${n.f === 'sqrt' ? '√u' : `${n.f} u`})′ = ${F}$ y $u′ = ${d(u)}$` });
        sub(u); return;
      }
    }
  }
  function derivada(sc) {
    const ast = E.lee(sc.f, 'f(x)', ['x']);
    const orden = Math.max(1, Math.min(4, Math.round(num(sc.orden || '1', 'el orden'))));
    const pasos = [];
    pasos.push({ t: 'Función', html: `$f(x) = ${T(ast)}$` });
    const r = [];
    reglas(E.simp(ast), r);
    if (!r.length) r.push({ t: 'Tabla', html: 'Es una derivada directa de la tabla.' });
    pasos.push(...r);
    const ders = [E.simp(ast)];
    for (let k = 1; k <= orden; k++) ders.push(pulir(D(ders[k - 1])));
    const prima = (k) => (k <= 3 ? `f${'′'.repeat(k)}` : `f^{(${k})}`);
    pasos.push({ t: 'Simplificando', html: ders.slice(1).map((q, i) => `$${prima(i + 1)}(x) = ${T(q)}$`).join('<br>') });
    const out = { modo: 'derivada', ast: ders[0], ders, orden, txt: ders.slice(1).map(T), f: (x) => E.valor(ders[0], x), d: (k) => (x) => E.valor(ders[k] || D(ders[ders.length - 1]), x), pasos };
    // en un punto: valor, pendiente y recta tangente
    if (!vacio(sc.x0)) {
      const x0 = num(sc.x0, 'x₀'), y0 = E.valor(ders[0], x0), m = E.valor(ders[1], x0);
      if (!isFinite(y0)) throw new Error(`f no existe en x₀ = ${f(x0)}`);
      if (!isFinite(m)) throw new Error(`f no es derivable en x₀ = ${f(x0)}`);
      out.x0 = x0; out.y0 = y0; out.m = m; out.vals = ders.map((q) => E.valor(q, x0));
      const nt = E.numTxt, b = y0 - m * x0;
      out.tangente = `y = ${Math.abs(m) < 1e-12 ? nt(y0) : `${E.texto(E.simp(op('+', op('*', N(m), X), N(b))))}`}`;
      pasos.push({ t: `En x₀ = ${f(x0)}`, html: `$f(${nt(x0)}) = ${nt(y0)}$, &ensp; $f′(${nt(x0)}) = ${nt(m)}$${orden > 1 ? ders.slice(2).map((q, i) => `, &ensp; $${prima(i + 2)}(${nt(x0)}) = ${nt(E.valor(q, x0))}$`).join('') : ''}<br>Recta tangente: $y − f(x_0) = f′(x_0)(x − x_0)$ &ensp;⇒&ensp; $${out.tangente}$` });
    }
    // puntos críticos en la ventana: f′ = 0, y su tipo por f″
    const d1 = ders[1], d2 = D(d1), a = out.x0 !== undefined ? out.x0 - 5 : -5, b = out.x0 !== undefined ? out.x0 + 5 : 5, crit = [];
    // f′ = 0 en todo x (por ejemplo sen²x + cos²x): f es constante y no tiene puntos críticos aislados
    out.constante = esNum(d1) ? d1.v === 0 : Array.from({ length: 41 }, (_, i) => E.valor(d1, a + ((b - a) * i) / 40)).every((v) => isFinite(v) && Math.abs(v) < 1e-12);
    if (out.constante) pasos.push({ t: 'Función constante', html: `$f′(x) = 0$ en todo x, así que f es constante: no tiene máximos ni mínimos aislados.` });
    let xa = a, va = E.valor(d1, a);
    for (let i = 1; i <= 400 && !out.constante; i++) {
      const xb = a + ((b - a) * i) / 400, vb = E.valor(d1, xb);
      if (isFinite(va) && isFinite(vb) && va * vb <= 0 && !(va === 0 && i > 1)) {
        let lo = xa, hi = xb, fl = va;
        for (let k = 0; k < 60; k++) { const mi = (lo + hi) / 2, vm = E.valor(d1, mi); if (fl * vm <= 0) hi = mi; else { lo = mi; fl = vm; } }
        const xc = (lo + hi) / 2, yc = E.valor(ders[0], xc);
        if (isFinite(yc) && Math.abs(E.valor(d1, xc)) < 1e-6 * Math.max(1, Math.abs(yc)) && !crit.some((q) => Math.abs(q.x - xc) < 1e-6)) {
          // la primera derivada que no se anula: par da extremo (por su signo), impar da inflexión
          let q = d2, k = 2, s = E.valor(q, xc);
          while (Math.abs(s) < 1e-7 && k < 5) { q = D(q); k++; s = E.valor(q, xc); }
          const tipo = Math.abs(s) < 1e-7 ? 'dudoso' : k % 2 ? 'punto de inflexión con tangente horizontal' : s > 0 ? 'mínimo' : 'máximo';
          crit.push({ x: Math.abs(xc) < 1e-10 ? 0 : xc, y: yc, tipo });
        }
      }
      xa = xb; va = vb;
    }
    out.crit = crit.slice(0, 8);
    if (out.crit.length) pasos.push({ t: 'Puntos críticos', html: `Donde $f′(x) = 0$ entre ${f(a)} y ${f(b)}; el signo de $f″$ dice si es máximo o mínimo:<br>${out.crit.map((q) => `$x = ${E.numTxt(q.x)}$: ${q.tipo} (f = ${f(q.y)})`).join('<br>')}` });
    return out;
  }

  /* ---------- Primitivas ---------- */
  const abs = (u) => fn('abs', u), ln = (u) => fn('ln', u);
  const div = (a, b) => op('/', a, b), prod = (a, b) => op('*', a, b), pot = (a, k) => op('^', a, N(k));
  // factores de un producto con su exponente (±1)
  function factores(n, s = 1, out = { k: 1, fs: [] }) {
    if (n.t === 'neg') { out.k *= -1; return factores(n.a, s, out); }
    if (n.t === '*') { factores(n.a, s, out); return factores(n.b, s, out); }
    if (n.t === '/') { factores(n.a, s, out); return factores(n.b, -s, out); }
    if (esNum(n)) { out.k *= n.v ** s; return out; }
    out.fs.push({ n, s });
    return out;
  }
  const junta = (fs) => { const a = fs.filter((q) => q.s > 0).map((q) => q.n), b = fs.filter((q) => q.s < 0).map((q) => q.n); return b.length ? div(mul(a), mul(b)) : mul(a); };
  // tipo de función de la tabla: { k, u } (k: sen, cos, exp, pot (con e), inv, sec2…)
  function tipo(n, s = 1) {
    if (s < 0) {
      // 1/u, 1/u^k, 1/cos² u, 1/sen² u, 1/√u, 1/(1 + u²), 1/√(1 − u²)
      if (n.t === '^' && !tx(n.b)) { const e = E.valor(n.b, 0); if (n.a.t === 'fn' && e === 2 && n.a.f === 'cos') return { k: 'sec2', u: n.a.a }; if (n.a.t === 'fn' && e === 2 && n.a.f === 'sen') return { k: 'csc2', u: n.a.a }; return { k: 'pot', e: -e, u: n.a }; }
      if (n.t === 'fn' && n.f === 'sqrt') { const q = poli(n.a); if (q && q.length === 3 && q[1] === 0 && q[0] > 0 && q[2] < 0) return { k: 'asen', p: q[0], q: -q[2] }; return { k: 'pot', e: -0.5, u: n.a }; }
      if (n.t === 'fn' && n.f === 'cbrt') return { k: 'pot', e: -1 / 3, u: n.a };
      if (n.t === 'fn' && n.f === 'cos') return { k: 'sec', u: n.a };
      return { k: 'pot', e: -1, u: n };
    }
    if (n.t === 'fn') { if (n.f === 'sqrt') return { k: 'pot', e: 0.5, u: n.a }; if (n.f === 'cbrt') return { k: 'pot', e: 1 / 3, u: n.a }; return { k: n.f, u: n.a }; }
    if (n.t === '^') {
      if (n.a.t === 'c' && n.a.v === 'e') return { k: 'exp', u: n.b };
      if (!tx(n.a)) return { k: 'apot', a: n.a, u: n.b };
      if (!tx(n.b)) { const e = E.valor(n.b, 0); return { k: 'pot', e, u: n.a }; }
    }
    if (n.t === 'x') return { k: 'pot', e: 1, u: n };
    return { k: 'otra', u: n };
  }
  // primitiva de la tabla en la variable u (AST con u dentro)
  function tabla(t) {
    const u = t.u;
    switch (t.k) {
      case 'sen': return neg(fn('cos', u));
      case 'cos': return fn('sen', u);
      case 'exp': return op('^', C('e'), u);
      case 'senh': return fn('cosh', u);
      case 'cosh': return fn('senh', u);
      case 'sec2': return fn('tg', u);
      case 'csc2': return neg(fn('cotg', u));
      case 'tg': return neg(ln(abs(fn('cos', u))));
      case 'cotg': return ln(abs(fn('sen', u)));
      case 'sec': return ln(abs(op('+', fn('sec', u), fn('tg', u))));
      case 'ln': return op('-', prod(u, ln(u)), u);
      case 'arctg': return op('-', prod(u, fn('arctg', u)), prod(N(0.5), ln(op('+', N(1), pot(u, 2)))));
      case 'arcsen': return op('+', prod(u, fn('arcsen', u)), fn('sqrt', op('-', N(1), pot(u, 2))));
      case 'apot': return div(op('^', t.a, u), ln(t.a));
      case 'pot':
        if (Math.abs(t.e + 1) < 1e-12) return ln(abs(u));
        return div(op('^', u, N(t.e + 1)), N(t.e + 1));
    }
    return null;
  }
  const NOMBRE_T = { sen: '∫ sen u du = −cos u', cos: '∫ cos u du = sen u', exp: '∫ e^{u} du = e^{u}', senh: '∫ senh u du = cosh u', cosh: '∫ cosh u du = senh u', sec2: '∫ {du}/{cos^{2} u} = tg u', csc2: '∫ {du}/{sen^{2} u} = −"cotg" u', tg: '∫ tg u du = −ln |cos u|', ln: '∫ ln u du = u ln u − u (por partes)', apot: '∫ a^{u} du = {a^{u}}/{ln a}', arctg: '∫ arctg u du = u arctg u − {1}/{2} ln(1 + u^{2}) (por partes)', arcsen: '∫ arcsen u du = u arcsen u + √(1 − u^{2}) (por partes)' };
  const nomT = (t) => (t.k === 'pot' ? (Math.abs(t.e + 1) < 1e-12 ? '∫ {du}/{u} = ln |u|' : '∫ u^{n} du = {u^{n + 1}}/{n + 1}') : NOMBRE_T[t.k] || '');

  // primitiva directa de c·h(ax + b) con h de la tabla (para el método de la tabla en partes)
  function prim1(h) {
    const { k, fs } = factores(E.simp(h));
    if (fs.length !== 1) return null;
    const t = tipo(fs[0].n, fs[0].s), L = t.u && lineal(t.u), F = L && tabla(t);
    return F ? E.simp(prod(N(k / L.a), F)) : null;
  }
  // primitiva de n: { F, como } o null; ps recoge el desarrollo
  function prim(n0, ps, prof = 0) {
    if (prof > 6) return null;
    const n = E.simp(n0);
    if (!tx(n)) return { F: prod(n, X), como: 'constante' };
    // linealidad
    if (n.t === '+' || n.t === '-') {
      const a = prim(n.a, ps, prof + 1), b = a && prim(n.b, ps, prof + 1);
      if (!a || !b) return null;
      return { F: op(n.t, a.F, b.F), como: 'suma' };
    }
    if (n.t === 'neg') { const a = prim(n.a, ps, prof + 1); return a && { F: neg(a.F), como: a.como }; }
    const { k, fs } = factores(n);
    const cte = fs.filter((q) => !tx(q.n)), vs = fs.filter((q) => tx(q.n));
    if (k !== 1 || cte.length) {
      const kk = cte.length ? prod(N(k), junta(cte)) : N(k);
      const a = prim(junta(vs), ps, prof + 1);
      return a && { F: prod(kk, a.F), como: a.como };
    }
    // potencias de x juntas: x² √x = x^{5/2}
    if (vs.length > 1 && vs.every((q) => { const t = tipo(q.n, 1); return t.k === 'pot' && t.u.t === 'x'; })) {
      const e = vs.reduce((acc, q) => acc + tipo(q.n, 1).e * q.s, 0), F = tabla({ k: 'pot', e, u: X });
      ps.push(`$∫ ${T(n)} dx = ∫ x^{${E.numTxt(e)}} dx = ${T(F)}$ &ensp; (potencias)`);
      return { F, como: 'potencias' };
    }
    // tg² u = 1/cos² u − 1
    if (vs.length === 1 && vs[0].s > 0 && vs[0].n.t === '^' && vs[0].n.a.t === 'fn' && vs[0].n.a.f === 'tg' && E.valor(vs[0].n.b, 0) === 2) {
      ps.push('$tg^{2} u = {1}/{cos^{2} u} − 1$');
      const a = prim(op('-', div(N(1), pot(fn('cos', vs[0].n.a.a), 2)), N(1)), ps, prof + 1); if (a) return a;
    }
    const nota = (txt, F, det) => { ps.push(`$∫ ${T(n)} dx = ${T(F)}$ &ensp; (${txt})${det ? `<br>${det}` : ''}`); return F; };
    // un solo factor de la tabla con argumento lineal
    if (vs.length === 1) {
      const t = tipo(vs[0].n, vs[0].s);
      if (t.k === 'asen') { const F = prod(N(1 / Math.sqrt(t.q)), fn('arcsen', prod(N(Math.sqrt(t.q / t.p)), X))); return { F: nota('$∫ {dx}/{√(a^{2} − b^{2}x^{2})} = {1}/{b} arcsen {b x}/{a}$', F), como: 'tabla' }; }
      const L = t.u && lineal(t.u), Ft = L && tabla(t);
      if (Ft) {
        // ln u, arctg u y arcsen u se integran por partes con dv = du: se enseña
        const dW = { ln: '{1}/{w}', arctg: '{1}/{1 + w^{2}}', arcsen: '{1}/{√(1 − w^{2})}' }[t.k], dp = dW ? `Por partes (en $w = ${T(t.u)}$): $u = ${t.k} w$ ⟹ $du = ${dW} dw$ y $dv = dw$ ⟹ $v = w$.<br>$∫ ${t.k} w dw = w ${t.k} w − ∫ w · ${dW} dw$, y la integral que queda es de tabla o de sustitución.` : '';
        return { F: nota(`tabla, ${Math.abs(L.a - 1) < 1e-12 ? `$${nomT(t)}$` : `$${nomT(t)}$ con $u = ${T(t.u)}$, $du = ${E.numTxt(L.a)} dx$`}`, div(Ft, N(L.a)), dp), como: 'tabla' };
      }
    }
    // sustitución: un factor f(g(x)) por g′(x)
    for (let i = 0; i < vs.length; i++) {
      // u es el argumento de la función, o el factor entero (u · u′ = (u²/2)′)
      const q = vs[i].n, base = q.t === '^' && !tx(q.b) ? { k: 'pot', e: E.valor(q.b, 0) * vs[i].s, u: q.a } : null;
      for (const t of [tipo(q, vs[i].s), { k: 'pot', e: vs[i].s, u: q }, base].filter(Boolean)) {
        if (!t.u || t.k === 'otra' || t.k === 'asen' || t.u.t === 'x' || !tx(t.u)) continue;
        const Ft = tabla(t); if (!Ft) continue;
        const resto = junta(vs.filter((_, j) => j !== i)), du = D(t.u);
        const c = cociente(resto, du);
        if (c !== null && Math.abs(c) > 1e-12) { const Fc = prod(N(c), Ft);
        const det = `1) Se elige $u = ${T(t.u)}$.<br>2) Se deriva: $du = ${T(du)} dx$, y el resto del integrando es $${E.numTxt(c)} · du/dx$, así que $∫ f(x) dx = ${E.numTxt(c)} ∫ h(u) du$ con $h(u)$ la función de la tabla.<br>3) Se integra en $u$ con la regla de la tabla: $${nomT(t)}$.<br>4) Se deshace el cambio ($u = ${T(t.u)}$) y sale $${T(Fc)}$.`;
        return { F: nota(`sustitución $u = ${T(t.u)}$, $du = ${T(du)} dx$, y $${nomT(t)}$`, Fc, det), como: 'sustitución' }; }
      }
    }
    // potencia impar de sen o cos: sen^{2m+1} u = sen u (1 − cos² u)^m, y cada término por sustitución
    if (vs.length === 1 && vs[0].s > 0 && vs[0].n.t === '^' && vs[0].n.a.t === 'fn' && ['sen', 'cos'].includes(vs[0].n.a.f) && !tx(vs[0].n.b)) {
      const e = E.valor(vs[0].n.b, 0), m = (e - 1) / 2;
      if (Number.isInteger(m) && m >= 1 && m <= 4) {
        const u = vs[0].n.a.a, sf = vs[0].n.a.f, of = sf === 'sen' ? 'cos' : 'sen';
        let suma = null, bin = 1;
        for (let k = 0; k <= m; k++) { if (k) bin = (bin * (m - k + 1)) / k; const t = prod(N(bin * (-1) ** k), prod(fn(sf, u), op('^', fn(of, u), N(2 * k)))); suma = suma ? op('+', suma, t) : t; }
        ps.push(`$${sf}^{${e}} u = ${sf} u (1 − ${of}^{2} u)^{${m}}$, y se sustituye $t = ${of} u$`);
        const a = prim(suma, ps, prof + 1); if (a) return { F: a.F, como: 'trigonométrica' };
      }
    }
    // polinomio: término a término
    const P = poli(n);
    if (P) { const F = poliAst(P.map((c, i) => (i ? c : c)).reduce((acc, c, i) => { acc[i + 1] = c / (i + 1); return acc; }, [0])); return { F: nota('potencias: $∫ x^{n} dx = {x^{n + 1}}/{n + 1}$', F), como: 'potencias' }; }
    // cociente de polinomios: fracciones simples
    const R = racional(n, nota);
    if (R) return { F: R, como: 'racional' };
    // sen² y cos²: se baja el grado con el ángulo doble; sen u cos u = sen(2u)/2
    if (vs.length === 1 && vs[0].s > 0 && vs[0].n.t === '^' && vs[0].n.a.t === 'fn' && ['sen', 'cos'].includes(vs[0].n.a.f) && E.valor(vs[0].n.b, 0) === 2) {
      const u = vs[0].n.a.a, s = vs[0].n.a.f === 'sen' ? -1 : 1, id = op(s < 0 ? '-' : '+', N(0.5), prod(N(0.5), fn('cos', prod(N(2), u))));
      ps.push(`$${vs[0].n.a.f}^{2} u = {1 ${s < 0 ? '−' : '+'} cos 2u}/{2}$ (ángulo doble)`);
      const a = prim(id, ps, prof + 1); if (a) return { F: a.F, como: 'trigonométrica' };
    }
    if (vs.length === 2 && vs.every((q) => q.s > 0 && q.n.t === 'fn') && new Set(vs.map((q) => q.n.f)).size === 2 && vs.every((q) => ['sen', 'cos'].includes(q.n.f)) && E.texto(vs[0].n.a) === E.texto(vs[1].n.a)) {
      // (ya cubierta por la sustitución, pero por si el argumento no es lineal)
    }
    // productos de senos y cosenos de distinto argumento: se pasan a sumas
    if (vs.length === 2 && vs.every((q) => q.s > 0 && q.n.t === 'fn' && ['sen', 'cos'].includes(q.n.f) && lineal(q.n.a))) {
      // A el de más frecuencia, para que A − B salga con coeficiente positivo
      const [p, q] = Math.abs(lineal(vs[0].n.a).a) >= Math.abs(lineal(vs[1].n.a).a) ? [vs[0].n, vs[1].n] : [vs[1].n, vs[0].n], A = p.a, B = q.a, sum = E.simp(op('+', A, B)), dif = E.simp(op('-', A, B));
      const m = (f1, u, k) => prod(N(k), fn(f1, u));
      let id = null, txt = '';
      if (p.f === 'sen' && q.f === 'cos') { id = op('+', m('sen', sum, 0.5), m('sen', dif, 0.5)); txt = 'sen A cos B = {1}/{2} [sen(A + B) + sen(A − B)]'; }
      else if (p.f === 'cos' && q.f === 'sen') { id = op('-', m('sen', sum, 0.5), m('sen', dif, 0.5)); txt = 'cos A sen B = {1}/{2} [sen(A + B) − sen(A − B)]'; }
      else if (p.f === 'cos') { id = op('+', m('cos', dif, 0.5), m('cos', sum, 0.5)); txt = 'cos A cos B = {1}/{2} [cos(A − B) + cos(A + B)]'; }
      else { id = op('-', m('cos', dif, 0.5), m('cos', sum, 0.5)); txt = 'sen A sen B = {1}/{2} [cos(A − B) − cos(A + B)]'; }
      if (!lineal(dif) && E.valor(dif, 0) === 0 && E.valor(dif, 1) === 0) id = null;
      if (id) { ps.push(`$${txt}$, con $A = ${T(A)}$ y $B = ${T(B)}$`); const a = prim(id, ps, prof + 1); if (a) return { F: a.F, como: 'trigonométrica' }; }
    }
    // raíces de cuadráticas: √(a² − b²x²) con x = (a/b) sen t, √(b²x² ± a²) con x = (a/b) senh t o cosh t
    if (vs.length === 1 && vs[0].n.t === 'fn' && vs[0].n.f === 'sqrt') {
      const P = poli(vs[0].n.a);
      if (P && P.length === 3 && Math.abs(P[1]) < 1e-12 && P[0] !== 0) {
        const c = P[0], q = P[2], r = vs[0].n, b = Math.sqrt(Math.abs(q));
        let F = null, txt = '';
        if (vs[0].s > 0 && q < 0 && c > 0) { F = op('+', prod(div(X, N(2)), r), prod(N(c / (2 * b)), fn('arcsen', prod(N(b / Math.sqrt(c)), X)))); txt = `cambio trigonométrico $x = ${E.numTxt(Math.sqrt(c) / b)} sen t$, $√(a^{2} − x^{2}) = a cos t$, y $∫ cos^{2} t dt$ por el ángulo doble`; }
        else if (vs[0].s > 0 && q > 0) { F = op('+', prod(div(X, N(2)), r), prod(N(c / (2 * b)), ln(abs(op('+', prod(N(b), X), r))))); txt = `cambio $x = ${E.numTxt(Math.sqrt(Math.abs(c)) / b)} ${c > 0 ? 'senh' : 'cosh'} t$ (o $x = a ${c > 0 ? 'tg' : 'sec'} t$): $∫ √(x^{2} ${c > 0 ? '+' : '−'} a^{2}) dx = {x}/{2} √(x^{2} ${c > 0 ? '+' : '−'} a^{2}) ${c > 0 ? '+' : '−'} {a^{2}}/{2} ln |x + √(x^{2} ${c > 0 ? '+' : '−'} a^{2})|$`; }
        else if (vs[0].s < 0 && q > 0) { F = prod(N(1 / b), ln(abs(op('+', prod(N(b), X), r)))); txt = `cambio $x = ${E.numTxt(Math.sqrt(Math.abs(c)) / b)} ${c > 0 ? 'senh' : 'cosh'} t$: $∫ {dx}/{√(x^{2} ${c > 0 ? '+' : '−'} a^{2})} = ln |x + √(x^{2} ${c > 0 ? '+' : '−'} a^{2})|$`; }
        if (F) return { F: nota(txt, F), como: 'cambio trigonométrico' };
      }
    }
    // por partes: polinomio por e^{ax+b}, sen, cos, senh, cosh (método de la tabla)
    if (vs.length >= 2) {
      const ip = vs.findIndex((q) => q.s > 0 && (() => { const t = tipo(q.n); return ['exp', 'sen', 'cos', 'senh', 'cosh'].includes(t.k) && lineal(t.u); })());
      if (ip >= 0) {
        const Pp = poli(junta(vs.filter((_, j) => j !== ip)));
        const t = tipo(vs[ip].n), L = lineal(t.u);
        if (Pp && Pp.length > 1) {
          // ∫ P h = P H₁ − P′ H₂ + P″ H₃ − …
          const H = [vs[ip].n];
          let Pk = Pp, F = null, sg = 1, k = 0, filas = [];
          while (Pk.length && Pk.some((c) => Math.abs(c) > 1e-14) && k < 12) {
            const Hk = prim1(H[k]);
            if (!Hk) return null;
            H.push(Hk);
            const term = prod(N(sg), prod(poliAst(Pk), Hk));
            F = F ? op('+', F, term) : term;
            filas.push(`$${T(poliAst(Pk))}$ · $${T(Hk)}$`);
            Pk = Pk.slice(1).map((c, i) => c * (i + 1)); sg = -sg; k++;
          }
          const det = `Método de la tabla: se deriva $u = ${T(poliAst(Pp))}$ hasta llegar a 0 y se primitiva $dv = ${T(vs[ip].n)} dx$ cada vez, alternando los signos (+, −, +…) y multiplicando en diagonal:<br>${filas.map((fl, i) => `${i % 2 ? '−' : '+'} ${fl}`).join('<br>')}`;
          return { F: nota(`por partes ${k} ${k === 1 ? 'vez' : 'veces'}: $∫ u dv = u v − ∫ v du$ con $u = ${T(poliAst(Pp))}$ y $dv = ${T(vs[ip].n)} dx$`, F, det), como: 'partes' };
        }
        // e^{ax} sen(bx), e^{ax} cos(bx): partes dos veces y se despeja
        const otro = vs.length === 2 ? tipo(vs[1 - ip].n) : null;
        if (otro && vs[1 - ip].s > 0 && ((t.k === 'exp' && ['sen', 'cos'].includes(otro.k)) || (otro.k === 'exp' && ['sen', 'cos'].includes(t.k)))) {
          const ex = t.k === 'exp' ? t : otro, tr = t.k === 'exp' ? otro : t, A = lineal(ex.u), B = lineal(tr.u);
          if (A && B) {
            const a = A.a, b = B.a, k2 = a * a + b * b, e = op('^', C('e'), ex.u), s = fn('sen', tr.u), c = fn('cos', tr.u);
            const F = tr.k === 'sen' ? prod(div(e, N(k2)), op('-', prod(N(a), s), prod(N(b), c))) : prod(div(e, N(k2)), op('+', prod(N(a), c), prod(N(b), s)));
            const det = `Sea $I = ∫ ${T(n)} dx$. Se integra por partes dos veces, eligiendo cada vez la misma clase de función como $u$:<br>1) $u = ${T(fn(tr.k, tr.u))}$ y $dv = ${T(op('^', C('e'), ex.u))} dx$, y queda otra integral con la función trigonométrica cambiada.<br>2) Se repite el proceso y en el segundo miembro vuelve a aparecer $I$ multiplicada por $−${E.numTxt(b * b / (a * a))}$.<br>3) Se pasa al primer miembro: $I (1 + ${E.numTxt(b * b / (a * a))}) = $ lo demás, y al despejar queda $I = ${T(F)}$.`;
            return { F: nota('por partes dos veces: vuelve a salir la integral del principio y se despeja', F, det), como: 'partes' };
          }
        }
      }
      // polinomio por ln, arctg o arcsen: u = la función, dv = el polinomio
      const il = vs.findIndex((q) => q.s > 0 && q.n.t === 'fn' && ['ln', 'arctg', 'arcsen'].includes(q.n.f));
      if (il >= 0) {
        const dv = junta(vs.filter((_, j) => j !== il)), V = prim(dv, [], prof + 2);
        if (V) {
          const Q = E.simp(V.F), g = vs[il].n;
          const resto = prim(prod(Q, D(g)), ps, prof + 1);
          if (resto) {
            const det = `$u = ${T(g)}$ ⟹ $du = ${T(D(g))} dx$<br>$dv = ${T(dv)} dx$ ⟹ $v = ${T(Q)}$<br>$∫ u dv = u v − ∫ v du = ${T(prod(Q, g))} − ∫ ${T(prod(Q, D(g)))} dx$, y esa integral sale $${T(resto.F)}$.`;
            return { F: nota(`por partes: $u = ${T(g)}$, $dv = ${T(dv)} dx$, así $v = ${T(Q)}$`, op('-', prod(Q, g), resto.F), det), como: 'partes' };
          }
        }
      }
    }
    // una potencia de ln o una función inversa sola: por partes con dv = dx
    if (vs.length === 1 && vs[0].s > 0 && /ln|arc/.test(E.texto(n)) && prof < 4) {
      const resto = prim(prod(X, D(n)), ps, prof + 2);
      if (resto) {
        const det = `$u = ${T(n)}$ ⟹ $du = ${T(D(n))} dx$<br>$dv = dx$ ⟹ $v = x$<br>$∫ u dv = u v − ∫ v du = ${T(prod(X, n))} − ∫ ${T(prod(X, D(n)))} dx$, y esa integral sale $${T(resto.F)}$.`;
        return { F: nota(`por partes: $u = ${T(n)}$, $dv = dx$, así $v = x$`, op('-', prod(X, n), resto.F), det), como: 'partes' };
      }
    }
    // u′/u: logaritmo
    if (n.t === '/') { const c = cociente(n.a, D(n.b)); if (c !== null) return { F: nota('$∫ {u′}/{u} dx = ln |u|$', prod(N(c), ln(abs(n.b)))), como: 'logaritmo' }; }
    return null;
  }
  // fracciones simples con los polos de Laplace
  function racional(n, nota) {
    const cambia = (m) => (m.t === 'x' ? { t: 'x', n: 's' } : m.t === 'n' || m.t === 'c' ? m : { ...m, a: m.a && cambia(m.a), b: m.b && cambia(m.b) });
    let F;
    try { F = LapR.simplifica(LapR.racional(cambia(n))); } catch (e) { return null; }
    const g = (p) => p.length - 1;
    if (g(F.d) < 1) return null;
    // parte entera: división de polinomios
    let r = F.n.slice(); const q = new Array(Math.max(0, g(r) - g(F.d) + 1)).fill(0), dl = F.d[F.d.length - 1];
    for (let i = g(r) - g(F.d); i >= 0; i--) { const c = r[i + g(F.d)] / dl; q[i] = c; for (let j = 0; j <= g(F.d); j++) r[i + j] -= c * F.d[j]; }
    r = r.slice(0, g(F.d)); while (r.length > 1 && Math.abs(r[r.length - 1]) < 1e-12) r.pop();
    let rs;
    try { rs = LapR.residuos({ n: r, d: F.d }); } catch (e) { return null; }
    let out = q.length && q.some((c) => Math.abs(c) > 1e-14) ? poliAst(q.reduce((acc, c, i) => { acc[i + 1] = c / (i + 1); return acc; }, [0])) : null;
    const add = (t) => { out = out ? op('+', out, t) : t; };
    const lin = (p) => (Math.abs(p) < 1e-12 ? X : op(p > 0 ? '-' : '+', X, N(Math.abs(p))));
    const fr = [];
    for (const { p, m, A } of rs) {
      if (Math.abs(p.im) < 1e-12) {
        A.forEach((a, j) => {
          if (Math.abs(a.re) < 1e-12) return;
          fr.push(`{${E.numTxt(a.re)}}/{${j ? `(${T(lin(p.re))})^{${j + 1}}` : T(lin(p.re))}}`);
          add(j === 0 ? prod(N(a.re), ln(abs(lin(p.re)))) : div(N(-a.re / j), pot(lin(p.re), j)));
        });
      } else if (p.im > 0) {
        if (m > 1) return null;
        const a = A[0], B = 2 * a.re, Cc = -2 * (a.re * p.re + a.im * p.im), al = p.re, be = p.im, Q = poliDesc([al * al + be * be, -2 * al, 1]);
        fr.push(`{${T(op('+', prod(N(B), X), N(Cc)))}}/{${T(Q)}}`);
        if (Math.abs(B) > 1e-12) add(prod(N(B / 2), ln(Q)));
        if (Math.abs(Cc + B * al) > 1e-12) {
          // (x − α)/β = (r x − r α)/√m con enteros, como en clase: (2x + 1)/√3
          let r = 1; while (r < 48 && !(Number.isInteger(+(r * al).toFixed(9)) && Number.isInteger(+(r * r * be * be).toFixed(9)))) r++;
          const m = Math.round(r * r * be * be), rq = Math.round(Math.sqrt(m)), raiz = rq * rq === m ? N(rq) : fn('sqrt', N(m));
          const ok = r < 48;
          const arg = ok ? div(poliDesc([-r * al, r]), raiz) : div(lin(al), N(be)), k = ok ? div(N((Cc + B * al) * r), raiz) : N((Cc + B * al) / be);
          add(prod(k, fn('arctg', arg)));
        }
      }
    }
    if (!out) return null;
    nota(`fracciones simples: ${q.some((c) => Math.abs(c) > 1e-14) ? `parte entera $${T(poliAst(q))}$ y ` : ''}$${fr.join(' + ').replace(/\+ \{−/g, '− {')}$`, out);
    return out;
  }
  function integral(sc) {
    const ast = E.simp(E.lee(sc.f, 'f(x)', ['x']));
    const pasos = [{ t: 'Función', html: `$f(x) = ${T(ast)}$` }], ps = [];
    let r = null;
    try { r = prim(ast, ps); } catch (e) { r = null; }
    let F = r && E.simp(r.F);
    // la primitiva se comprueba derivándola
    if (F && !igualNum(D(F), ast, 1e-6)) F = null;
    const out = { modo: 'integral', ast, f: (x) => E.valor(ast, x), pasos };
    if (F) {
      out.F = F; out.Ftxt = T(F); out.Ff = (x) => E.valor(F, x);
      if (ps.length) pasos.push({ t: ast.t === '+' || ast.t === '-' ? 'Término a término' : 'Método', html: ps.slice(-8).join('<br>') });
      pasos.push({ t: 'Primitiva', html: `$∫ f(x) dx = ${out.Ftxt} + C$<br>Comprobación: al derivar sale otra vez f(x).` });
    } else pasos.push({ t: 'Primitiva', html: 'No encuentro una primitiva con funciones elementales (o no sé hacerla con la tabla, sustitución, partes y fracciones simples).' });
    if (!vacio(sc.a) || !vacio(sc.b)) {
      const a = limiteDe(sc.a, 'el límite inferior a'), b = limiteDe(sc.b, 'el límite superior b');
      if (a === b) throw new Error('Los dos límites son iguales: la integral vale 0');
      out.a = a; out.b = b;
      // impropia: hasta ∞, o con f no acotada en un extremo o dentro
      const lo = Math.min(a, b), hi = Math.max(a, b), sg = a < b ? 1 : -1, g = (x) => E.valor(ast, x);
      const malo = (c, s) => isFinite(c) && (!isFinite(g(c)) || Math.abs(g(c + s * 1e-9)) > 1e7);
      const sing = singulares(ast, isFinite(lo) ? lo : Math.min(hi, 0) - 60, isFinite(hi) ? hi : Math.max(lo, 0) + 60).filter((c) => c > lo && c < hi);
      const malLo = !isFinite(lo) || malo(lo, 1), malHi = !isFinite(hi) || malo(hi, -1);
      if (malLo || malHi || sing.length) {
        const r = impropia(ast, F, lo, hi, sing, malLo, malHi, pasos);
        out.impropia = true; out.diverge = r.diverge; out.val = sg * r.val; out.sing = sing;
        if (sg < 0 && !r.diverge) pasos.push({ t: 'Límites al revés', html: `Como $a > b$, $∫_{a}^{b} = −∫_{b}^{a} = ${nt(out.val)}$` });
        return out;
      }
      // numérica (Simpson) siempre, para comparar; si f no es finita en [a, b], impropia
      const n = 2000, h = (b - a) / n; let s = 0, finita = true;
      for (let i = 0; i <= n; i++) { const v = E.valor(ast, a + i * h); if (!isFinite(v)) { finita = false; break; } s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * v; }
      out.num = finita ? (s * h) / 3 : NaN;
      if (!finita) throw new Error(`f(x) no es finita en todo [${f(Math.min(a, b))}, ${f(Math.max(a, b))}]: la integral es impropia`);
      const nt = E.numTxt;
      if (F && isFinite(E.valor(F, a)) && isFinite(E.valor(F, b)) && Math.abs(E.valor(F, b) - E.valor(F, a) - out.num) < 1e-5 * Math.max(1, Math.abs(out.num))) {
        out.val = E.valor(F, b) - E.valor(F, a);
        pasos.push({ t: 'Regla de Barrow', html: `$∫_{${nt(a)}}^{${nt(b)}} f(x) dx = F(${nt(b)}) − F(${nt(a)}) = ${nt(E.valor(F, b))} − ${nt(E.valor(F, a))}`.replace('− −', '+ ') + ` = ${nt(out.val)}$${E.exacto(out.val) && !Number.isInteger(out.val) ? ` ≈ ${f(out.val, 6)}` : ''}` });
      } else {
        out.val = out.num;
        pasos.push({ t: 'Integral numérica', html: `Con la regla de Simpson y 2000 intervalos: $∫_{${nt(a)}}^{${nt(b)}} f(x) dx ≈ ${f(out.num, 7)}$` });
      }
      // área: con los trozos negativos restando, y el área total en valor absoluto
      let ar = 0; for (let i = 0; i < n; i++) { const p = E.valor(ast, a + i * h), q = E.valor(ast, a + (i + 1) * h); ar += (Math.abs(p) + Math.abs(q)) / 2 * Math.abs(h); }
      out.area = ar;
      if (Math.abs(ar - Math.abs(out.val)) > 1e-4 * Math.max(1, ar)) pasos.push({ t: 'Área', html: `f cambia de signo en el intervalo: la integral resta las partes de debajo del eje. El área total encerrada es ≈ ${f(ar, 6)}.` });
    }
    return out;
  }

  /* ---------- Límites, raíces y puntos singulares (numéricos) ---------- */
  // un número como en clase: fracción sencilla, π/2, √3, e^{2}, o decimal
  function nt(v) {
    if (v === Infinity) return '∞';
    if (v === -Infinity) return '−∞';
    const x = E.exacto(v, 1000);
    if (x && x.q <= 1000) return E.numTxt(v);
    for (const k of [2, 3, 4, -1, -2, -3]) { const r = fracSencilla(v / Math.exp(k), 1e-10); if (r !== null && r !== 0 && Math.abs(r) < 100) return `${r === 1 ? '' : r === -1 ? '−' : E.numTxt(r) + ' '}e^{${k < 0 ? '−' : ''}${Math.abs(k)}}`; }
    return f(v, 6);
  }
  // «∞», «inf», «-inf», «+∞» o un número
  const INF = /^\s*([+\-−]?)\s*(∞|inf|infinito)\s*$/i;
  function limiteDe(s, nom) { const m = String(s ?? '').match(INF); if (m) return m[1] === '-' || m[1] === '−' ? -Infinity : Infinity; return num(s, nom); }
  // límite de g cuando x → c por un lado (lado = ±1) o cuando x → ±∞: número, ±Infinity o null si no tiene
  function limNum(g, c, lado = 1, kmax = isFinite(c) ? 10 : 12) {
    const vs = [];
    for (let k = 2; k <= kmax; k++) { const x = isFinite(c) ? c + lado * 10 ** -k : Math.sign(c) * 10 ** k, v = g(x); vs.push(v); }
    const fin = vs.filter((v) => !Number.isNaN(v));
    if (fin.length < 4) return null;
    const v = fin.slice(-4);
    if (v.some((q) => !isFinite(q))) return v[3] === Infinity || v[3] === -Infinity ? v[3] : null;
    if (Math.abs(v[3]) > 1e9 && Math.abs(v[3]) > Math.abs(v[1])) return Math.sign(v[3]) * Infinity;
    const d1 = v[1] - v[0], d2 = v[2] - v[1], d3 = v[3] - v[2], esc = Math.max(1, Math.abs(v[3]));
    if (Math.abs(d3) < 1e-11 * esc) return Math.abs(v[3]) < 1e-9 ? 0 : v[3];
    const r = Math.abs(d3) / Math.max(1e-300, Math.abs(d2));
    // sigue creciendo (ln x, √x, 1/x…): va a infinito
    if (Math.sign(d1) === Math.sign(d2) && Math.sign(d2) === Math.sign(d3) && r >= 0.9 && Math.abs(d2) / Math.max(1e-300, Math.abs(d1)) >= 0.9) return Math.sign(d3) * Infinity;
    // se acerca como una serie geométrica: se extrapola
    if (r < 0.9 && Math.abs(d2) / Math.max(1e-300, Math.abs(d1)) < 0.95) { const L = v[3] + (d3 * r) / (1 - r); return Math.abs(L) < 1e-8 ? 0 : L; }
    return null;
  }
  // límite de una expresión: primero el valor (si es continua ahí) y si no, acercándose
  function limAst(n, c, lado = 0) {
    const g = (x) => E.valor(n, x);
    if (isFinite(c)) {
      const v = g(c), cerca = (s) => g(c + s * 1e-7);
      if (isFinite(v) && (lado >= 0 ? Math.abs(cerca(1) - v) < 1e-4 * Math.max(1, Math.abs(v)) : true) && (lado <= 0 ? Math.abs(cerca(-1) - v) < 1e-4 * Math.max(1, Math.abs(v)) : true)) return v;
      if (lado) return limNum(g, c, lado);
      const a = limNum(g, c, 1), b = limNum(g, c, -1);
      // si f solo existe por un lado (x ln x en 0), vale ese lado
      const existe = (s) => [1e-3, 1e-5, 1e-7].some((e) => isFinite(g(c + s * e)));
      if (a !== null && b === null && !existe(-1)) return a;
      if (b !== null && a === null && !existe(1)) return b;
      if (a === null || b === null) return null;
      return a === b || (isFinite(a) && Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(a))) ? a : NaN;
    }
    return limNum(g, c);
  }
  // un número que sale casi entero o casi una fracción sencilla, redondeado a ella
  function redondea(x, tol = 1e-9) {
    const r = fracSencilla(x, tol);
    return r === null ? x : r;
  }
  function fracSencilla(x, tol = 1e-9) {
    if (Math.abs(x) < 1e-11) return 0;
    for (let q = 1; q <= 64; q++) { const p = Math.round(x * q); if (Math.abs(p / q - x) < tol * Math.max(1, Math.abs(x))) return p / q; }
    return null;
  }
  // raíces de g en [a, b]: cambio de signo + bisección, descartando los saltos de una asíntota
  function raicesNum(g, a, b, n = 2000) {
    const out = [];
    let xa = a, va = g(a);
    const add = (x) => { const y = redondea(x); if (!out.some((q) => Math.abs(q - y) < 1e-7)) out.push(y); };
    if (va === 0) add(a);
    for (let i = 1; i <= n; i++) {
      const xb = a + ((b - a) * i) / n, vb = g(xb);
      if (vb === 0) add(xb);
      else if (isFinite(va) && isFinite(vb) && va * vb < 0) {
        let lo = xa, hi = xb, fl = va;
        for (let k = 0; k < 80; k++) { const mi = (lo + hi) / 2, vm = g(mi); if (!isFinite(vm)) break; if (fl * vm <= 0) hi = mi; else { lo = mi; fl = vm; } }
        const x = (lo + hi) / 2, vx = g(x);
        if (isFinite(vx) && Math.abs(vx) < 1e-6 * Math.max(1, Math.abs(va), Math.abs(vb))) add(x);
      }
      xa = xb; va = vb;
    }
    return out.sort((p, q) => p - q);
  }
  // puntos de (a, b) donde f no está acotada (asíntotas) o no existe
  function singulares(ast, a, b, n = 1200) {
    const g = (x) => E.valor(ast, x), out = [], h = (b - a) / n;
    const add = (x) => { const y = redondea(x, 1e-6); if (!out.some((q) => Math.abs(q - y) < 1e-6)) out.push(y); };
    const vs = Array.from({ length: n + 1 }, (_, i) => g(a + i * h));
    let picos = 0;
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      if (!isFinite(vs[i])) { add(x); continue; }
      // máximo local de |f|: se busca el pico, por si es una asíntota entre dos puntos de la rejilla
      if (picos < 80 && Math.abs(vs[i]) >= Math.abs(vs[i - 1]) && Math.abs(vs[i]) >= Math.abs(vs[i + 1]) && Math.abs(vs[i]) > Math.abs(vs[i - 1]) + Math.abs(vs[i + 1]) - Math.abs(vs[i]) + 1e-9) {
        picos++;
        let lo = x - h, hi = x + h;
        for (let k = 0; k < 100; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3, f1 = Math.abs(g(m1)), f2 = Math.abs(g(m2)); if (!isFinite(f1)) { hi = m2; lo = m1; break; } if (!isFinite(f2)) { lo = m1; hi = m2; break; } if (f1 < f2) lo = m1; else hi = m2; }
        const c = (lo + hi) / 2, A = Math.abs(g(c + 1e-9)) + Math.abs(g(c - 1e-9)), B = Math.abs(g(c + 1e-3)) + Math.abs(g(c - 1e-3));
        // crece sin parar al acercarse (también las débiles, como 1/∛x)
        if (!isFinite(g(c)) || Math.abs(g(c)) > 1e8 || (A > 100 && A > 20 * B)) add(c);
      }
    }
    return out.sort((p, q) => p - q);
  }
  // cuadratura doble exponencial (tanh-sinh en [p, q], exp-sinh hasta ∞): aguanta las singularidades de los extremos
  // dT < 0 recorta los extremos: si el valor cambia, la integral no converge
  function cuadratura(g, p, q, h = 1 / 16, dT = 0) {
    if (p === -Infinity && q === Infinity) return cuadratura(g, -Infinity, 0, h, dT) + cuadratura(g, 0, Infinity, h, dT);
    if (p === -Infinity) return cuadratura((x) => g(-x), -q, Infinity, h, dT);
    let s = 0;
    if (q === Infinity) {
      for (let t = -4.5 - dT; t <= 4.5 + dT + 1e-12; t += h) { const e = Math.exp((Math.PI / 2) * Math.sinh(t)), w = (Math.PI / 2) * Math.cosh(t) * e, v = g(p + e); if (isFinite(v) && isFinite(w)) s += v * w; }
      return s * h;
    }
    const m = (p + q) / 2, r = (q - p) / 2;
    for (let t = -3.5 - dT; t <= 3.5 + dT + 1e-12; t += h) {
      const u = (Math.PI / 2) * Math.sinh(t), ch = Math.cosh(u), w = (r * (Math.PI / 2) * Math.cosh(t)) / (ch * ch);
      // distancia al extremo sin perder cifras: r (1 − tanh u) = 2r/(e^{2u} + 1)
      const d = (2 * r) / (Math.exp(2 * Math.abs(u)) + 1), x = u > 0 ? q - d : p + d;
      if (d <= 0) continue;
      const v = g(x); if (isFinite(v)) s += v * w;
    }
    return s * h;
  }

  /* ---------- Integrales impropias ---------- */
  const intervalo = (p, q) => `${p === -Infinity ? '(' : '['}${nt(p)}, ${nt(q)}${q === Infinity ? ')' : ']'}`;
  function impropia(ast, F, lo, hi, sing, malLo, malHi, pasos) {
    const pts = [lo, ...sing.filter((c) => c > lo && c < hi), hi], trozos = [];
    for (let i = 0; i < pts.length - 1; i++) trozos.push({ p: pts[i], q: pts[i + 1], ip: i ? true : malLo, iq: i < pts.length - 2 ? true : malHi });
    const por = [];
    if (!isFinite(lo) || !isFinite(hi)) por.push('el intervalo no está acotado');
    const ss = [...(malLo && isFinite(lo) ? [lo] : []), ...sing.filter((c) => c > lo && c < hi), ...(malHi && isFinite(hi) ? [hi] : [])];
    if (ss.length) por.push(`f no está acotada cerca de ${ss.map((c) => `$x = ${nt(c)}$`).join(', ')}`);
    const def = trozos.map(({ p, q, ip, iq }) => {
      const R = (c, s) => (c === Infinity ? 'R → ∞' : c === -Infinity ? 'R → −∞' : `ε → 0^{+}`), Rv = (c, s) => (!isFinite(c) ? 'R' : `${nt(c)} ${s} ε`);
      if (ip && iq) return `lím ∫_{${Rv(p, '+')}}^{${Rv(q, '−')}}`;
      if (iq) return `lím_{${R(q)}} ∫_{${nt(p)}}^{${Rv(q, '−')}}`;
      return `lím_{${R(p)}} ∫_{${Rv(p, '+')}}^{${nt(q)}}`;
    });
    pasos.push({ t: 'Integral impropia', html: `Es impropia porque ${por.join(' y ')}: se calcula como límite${trozos.length > 1 ? ', partiendo el intervalo por los puntos malos' : ''}.<br>$∫_{${nt(lo)}}^{${nt(hi)}} f(x) dx = ${def.map((d) => `${d} f(x) dx`).join(' + ')}$` });
    let total = 0, diverge = null;
    const g = (x) => E.valor(ast, x);
    const lineas = [];
    for (const { p, q, ip, iq } of trozos) {
      let v = null;
      if (F) {
        const Fq = iq ? limAst(F, q, -1) : E.valor(F, q), Fp = ip ? limAst(F, p, 1) : E.valor(F, p);
        const lq = iq ? `lím_{x → ${nt(q)}${isFinite(q) ? '^{−}' : ''}} F(x)` : `F(${nt(q)})`, lp = ip ? `lím_{x → ${nt(p)}${isFinite(p) ? '^{+}' : ''}} F(x)` : `F(${nt(p)})`;
        if (Fq === null || Fp === null || Number.isNaN(Fq) || Number.isNaN(Fp)) { diverge = diverge || `en ${intervalo(p, q)} la primitiva no tiene límite (oscila)`; lineas.push(`En $${intervalo(p, q)}$: $${Fq === null || Number.isNaN(Fq) ? lq : lp}$ no existe`); continue; }
        if (!isFinite(Fq) || !isFinite(Fp)) { diverge = diverge || `$${!isFinite(Fq) ? `${lq} = ${nt(Fq)}` : `${lp} = ${nt(Fp)}`}$`; lineas.push(`En $${intervalo(p, q)}$: $${lq} = ${nt(Fq)}$, &ensp; $${lp} = ${nt(Fp)}$`); continue; }
        v = Fq - Fp;
        // la primitiva tiene que valer en todo el trozo: se compara con la numérica
        const nv = cuadratura(g, p, q);
        if (isFinite(nv) && Math.abs(nv - v) > 1e-5 * Math.max(1, Math.abs(v))) v = null;
        else lineas.push(`En $${intervalo(p, q)}$: $${lq} − ${lp} = ${nt(Fq)} − ${nt(Fp)}`.replace('− −', '+ ') + ` = ${nt(v)}$`);
      }
      if (v === null) {
        const v1 = cuadratura(g, p, q), v2 = cuadratura(g, p, q, 1 / 16, -1);
        if (!isFinite(v1) || Math.abs(v1 - v2) > 1e-6 * Math.max(1, Math.abs(v1))) { diverge = diverge || 'la integral numérica no se estabiliza al acercarse al punto malo'; lineas.push(`En $${intervalo(p, q)}$: la integral numérica no se estabiliza: diverge`); continue; }
        v = v1; lineas.push(`En $${intervalo(p, q)}$ (numérica, cuadratura doble exponencial): $≈ ${f(v, 8)}$`);
      }
      total += v;
    }
    pasos.push({ t: 'Límites', html: `${F ? `Con la primitiva $F(x) = ${T(F)}$:<br>` : ''}${lineas.join('<br>')}` });
    if (diverge) { pasos.push({ t: 'Resultado', html: `La integral <b>diverge</b>: ${diverge}.` }); return { diverge: true, val: NaN }; }
    total = redondea(total);
    pasos.push({ t: 'Resultado', html: `La integral <b>converge</b>: $∫_{${nt(lo)}}^{${nt(hi)}} f(x) dx = ${nt(total)}$${E.exacto(total) && !Number.isInteger(total) ? ` ≈ ${f(total, 6)}` : ''}` });
    return { diverge: false, val: total };
  }

  /* ---------- Área entre curvas y volumen de revolución ---------- */
  function simpson(g, a, b, n = 2000) { const h = (b - a) / n; let s = 0; for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * g(a + i * h); return (s * h) / 3; }
  // primitiva comprobada (o null)
  function primC(n) { let r = null; try { r = prim(n, []); } catch (e) { r = null; } const F = r && E.simp(r.F); return F && igualNum(D(F), n, 1e-6) ? F : null; }
  const integra = (F, g, p, q) => { if (F) { const v = E.valor(F, q) - E.valor(F, p); if (isFinite(v) && Math.abs(v - simpson(g, p, q)) < 1e-6 * Math.max(1, Math.abs(v))) return v; } return simpson(g, p, q); };
  function limitesCorte(h, sc, nom) {
    if (!vacio(sc.a) || !vacio(sc.b)) { const a = num(sc.a, 'a'), b = num(sc.b, 'b'); if (a === b) throw new Error('Los dos límites son iguales'); return { a: Math.min(a, b), b: Math.max(a, b), dados: true }; }
    const rs = raicesNum((x) => E.valor(h, x), -10, 10);
    if (rs.length < 2) throw new Error(`${nom} no se cortan dos veces entre −10 y 10: escribe a y b`);
    return { a: rs[0], b: rs[rs.length - 1], dados: false, rs };
  }
  function area(sc) {
    const fa = E.simp(E.lee(sc.f, 'f(x)', ['x'])), ga = E.simp(vacio(sc.g) ? N(0) : E.lee(sc.g, 'g(x)', ['x'])), h = E.simp(op('-', fa, ga)), hv = (x) => E.valor(h, x);
    const { a, b, dados } = limitesCorte(h, sc, 'Las curvas');
    for (let i = 0; i <= 400; i++) if (!isFinite(hv(a + ((b - a) * i) / 400))) throw new Error(`f o g no existen en todo [${f(a)}, ${f(b)}]`);
    const cortes = raicesNum(hv, a, b).filter((x) => x > a + 1e-9 && x < b - 1e-9), pts = [a, ...cortes, b], pasos = [];
    pasos.push({ t: 'Curvas', html: `$f(x) = ${T(fa)}$, &ensp; $g(x) = ${T(ga)}$` });
    pasos.push({ t: 'Puntos de corte', html: `$f(x) = g(x)$ &ensp;⇔&ensp; $${T(h)} = 0$${dados ? (cortes.length ? `; dentro de $[${nt(a)}, ${nt(b)}]$ se cortan en ${cortes.map((x) => `$x = ${nt(x)}$`).join(', ')}` : `: no se cortan dentro de $[${nt(a)}, ${nt(b)}]$`) : `: $x = ${[a, ...cortes, b].map(nt).join('$, $x = ')}$. La región va de $x = ${nt(a)}$ a $x = ${nt(b)}$.`}` });
    const H = primC(h);
    if (H) pasos.push({ t: 'Primitiva de f − g', html: `$∫ (f − g) dx = ${T(H)}$` });
    let tot = 0; const lineas = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], arriba = hv((p + q) / 2) >= 0, v = integra(H, hv, p, q);
      tot += Math.abs(v);
      lineas.push(`En $[${nt(p)}, ${nt(q)}]$ va arriba ${arriba ? 'f' : 'g'}: $∫_{${nt(p)}}^{${nt(q)}} (${arriba ? 'f − g' : 'g − f'}) dx = ${nt(Math.abs(v))}$`);
    }
    pasos.push({ t: 'Cada trozo', html: `El área es la integral de la curva de arriba menos la de abajo; si se cruzan, se parte por los cortes.<br>${lineas.join('<br>')}` });
    pasos.push({ t: 'Área', html: `$A = ${pts.length > 2 ? `${lineas.map((_, i) => `A_{${i + 1}}`).join(' + ')} = ` : ''}${nt(tot)}$${E.exacto(tot) && !Number.isInteger(tot) ? ` ≈ ${f(tot, 6)}` : ''}` });
    return { modo: 'area', ast: fa, ga, h, a, b, cortes, val: tot, txt: nt(tot), f: (x) => E.valor(fa, x), g: (x) => E.valor(ga, x), pasos };
  }
  function volumen(sc) {
    const eje = sc.eje === 'y' ? 'y' : 'x', hayG = !vacio(sc.g) && String(sc.g).trim() !== '0';
    const fa = E.simp(E.lee(sc.f, 'f(x)', ['x'])), ga = E.simp(hayG ? E.lee(sc.g, 'g(x)', ['x']) : N(0)), h = E.simp(op('-', fa, ga));
    const { a, b, dados } = limitesCorte(h, sc, hayG ? 'Las curvas' : 'La curva y el eje x');
    if (eje === 'y' && a < -1e-12) throw new Error('Para girar alrededor del eje y, la región tiene que estar en x ≥ 0 (a ≥ 0)');
    const q = E.simp(eje === 'x' ? op('-', pot(fa, 2), pot(ga, 2)) : prod(X, h)), qv = (x) => E.valor(q, x), pasos = [];
    for (let i = 0; i <= 400; i++) if (!isFinite(qv(a + ((b - a) * i) / 400))) throw new Error(`f${hayG ? ' o g' : ''} no existe en todo [${f(a)}, ${f(b)}]`);
    // si la de dentro y la de fuera se cruzan, se toma el valor absoluto (numérico)
    const cambia = raicesNum(qv, a, b).some((x) => x > a + 1e-9 && x < b - 1e-9);
    pasos.push({ t: 'Región', html: `${hayG ? `Entre $f(x) = ${T(fa)}$ y $g(x) = ${T(ga)}$` : `Bajo $f(x) = ${T(fa)}$ hasta el eje x`}, de $x = ${nt(a)}$ a $x = ${nt(b)}$${dados ? '' : ' (donde se cortan)'}, girando alrededor del eje ${eje}.` });
    pasos.push(eje === 'x'
      ? { t: hayG ? 'Método de las arandelas' : 'Método de los discos', html: `Cada corte perpendicular al eje x es ${hayG ? 'una arandela de radios f y g' : 'un disco de radio f(x)'}: $V = π ∫_{a}^{b} ${hayG ? '(f^{2} − g^{2})' : 'f(x)^{2}'} dx$<br>Integrando: $${T(q)}$` }
      : { t: 'Método de las capas', html: `Cada tira vertical a distancia x del eje es una capa cilíndrica de radio x y altura ${hayG ? 'f − g' : 'f(x)'}: $V = 2π ∫_{a}^{b} x ${hayG ? '(f − g)' : 'f(x)'} dx$<br>Integrando: $${T(q)}$` });
    const Q = cambia ? null : primC(q), I = cambia ? simpson((x) => Math.abs(qv(x)), a, b) : integra(Q, qv, a, b), k = eje === 'x' ? 1 : 2, V = Math.abs(k * Math.PI * I);
    const qT = q.t === '+' || q.t === '-' ? `(${T(q)})` : T(q);
    if (Q) pasos.push({ t: 'Primitiva', html: `$∫ ${qT} dx = ${T(Q)}$<br>$∫_{${nt(a)}}^{${nt(b)}} ${qT} dx = ${nt(I)}$` });
    else pasos.push({ t: 'Integral', html: `${cambia ? 'Las dos curvas se cruzan: se integra el valor absoluto. ' : ''}Numérica (Simpson): $∫_{${nt(a)}}^{${nt(b)}} ≈ ${f(I, 8)}$` });
    // V como múltiplo de π si se puede: 8 π, {2 π}/{15}
    const r = E.fraccion(V / Math.PI, 1000), vT = r && Math.abs(r[0] / r[1] - V / Math.PI) < 1e-9 * Math.max(1, V) ? (r[1] === 1 ? `${r[0] === 1 ? '' : r[0] + ' '}π` : `{${r[0] === 1 ? '' : r[0] + ' '}π}/{${r[1]}}`) : nt(V);
    pasos.push({ t: 'Volumen', html: `$V = ${k === 2 ? '2' : ''}π · ${nt(Math.abs(I))} = ${vT}$ ≈ ${f(V, 6)}` });
    return { modo: 'volumen', eje, ast: fa, ga, hayG, a, b, val: V, txt: vT, f: (x) => E.valor(fa, x), g: (x) => E.valor(ga, x), pasos };
  }

  /* ---------- Derivación implícita y derivadas parciales ---------- */
  const Y = { t: 'x', n: 'y' };
  const dY = (n) => E.simp(E.deriva(n, 'y')), dX = (n) => E.simp(E.deriva(n));
  const T2 = (n) => E.texto(E.simp(n));
  const val2 = (n, x, y) => E.valor(n, x, { y });
  function implicita(sc) {
    if (vacio(sc.ec)) throw new Error('Falta la ecuación');
    const lados = String(sc.ec).split('=');
    if (lados.length > 2) throw new Error('La ecuación solo puede tener un signo =');
    const L = E.simp(E.lee(lados[0], 'La ecuación', ['x', 'y'])), R = E.simp(lados.length > 1 ? E.lee(lados[1], 'La ecuación', ['x', 'y']) : N(0));
    if (!E.tieneX(L, 'y') && !E.tieneX(R, 'y')) throw new Error('La ecuación tiene que llevar y');
    const F = E.simp(op('-', L, R)), Fx = dX(F), Fy = dY(F), pasos = [];
    if (esNum(Fy) && Fy.v === 0) throw new Error('La ecuación no depende de y');
    const yp = E.simp(neg(div(Fx, Fy)));
    const lado = (n) => { const a = dX(n), b = dY(n), sb = T2(b); return esNum(b) && b.v === 0 ? T2(a) : `${esNum(a) && a.v === 0 ? '' : `${T2(a)} + `}${/[+−]/.test(sb.slice(1)) ? `(${sb})` : sb} y′`.replace('+ −', '− '); };
    pasos.push({ t: 'Ecuación', html: `$${T2(L)} = ${T2(R)}$, con $y = y(x)$` });
    pasos.push({ t: 'Derivar respecto de x', html: `Se deriva cada lado pensando que y es función de x: cada vez que se deriva algo con y sale un $y′$ por la regla de la cadena (por ejemplo, $(y^{2})′ = 2 y y′$).<br>$${lado(L)} = ${lado(R)}$` });
    pasos.push({ t: 'Despejar y′', html: `Pasando todo a un lado, $F(x, y) = ${T2(F)} = 0$ y $y′ = −{F_{x}}/{F_{y}}$, con $F_{x} = ${T2(Fx)}$ y $F_{y} = ${T2(Fy)}$:<br>$y′ = ${T2(yp)}$` });
    const out = { modo: 'implicita', F, Fx, Fy, yp, txt: T2(yp), Fv: (x, y) => val2(F, x, y), pasos };
    if (!vacio(sc.x0) || !vacio(sc.y0)) {
      const x0 = num(sc.x0, 'x₀'), y0 = num(sc.y0, 'y₀'), r = val2(F, x0, y0);
      if (!isFinite(r) || Math.abs(r) > 1e-6 * Math.max(1, Math.abs(val2(L, x0, y0)), Math.abs(val2(R, x0, y0)))) throw new Error(`El punto (${f(x0)}, ${f(y0)}) no está en la curva`);
      const fx = val2(Fx, x0, y0), fy = val2(Fy, x0, y0);
      out.x0 = x0; out.y0 = y0;
      if (Math.abs(fy) < 1e-12) { out.vertical = true; out.tangente = `x = ${nt(x0)}`; pasos.push({ t: `En (${f(x0)}, ${f(y0)})`, html: `$F_{y} = 0$: la tangente es vertical, $x = ${nt(x0)}$.` }); }
      else {
        const m = -fx / fy, b = y0 - m * x0;
        out.m = m; out.tangente = `y = ${Math.abs(m) < 1e-12 ? nt(y0) : E.texto(E.simp(op('+', op('*', N(redondea(m)), X), N(redondea(b)))))}`;
        pasos.push({ t: `En (${f(x0)}, ${f(y0)})`, html: `$y′ = ${nt(m)}$<br>Recta tangente: $y − y_0 = y′ (x − x_0)$ &ensp;⇒&ensp; $${out.tangente}$` });
      }
    }
    return out;
  }
  function parciales(sc) {
    const ast = E.simp(E.lee(sc.f, 'f(x, y)', ['x', 'y'])), fx = dX(ast), fy = dY(ast), fxx = dX(fx), fxy = dY(fx), fyy = dY(fy), pasos = [];
    pasos.push({ t: 'Función', html: `$f(x, y) = ${T2(ast)}$` });
    pasos.push({ t: 'Primeras derivadas', html: `Para $f_{x}$ se deriva en x con y constante, y al revés para $f_{y}$:<br>$f_{x} = ${T2(fx)}$, &ensp; $f_{y} = ${T2(fy)}$` });
    pasos.push({ t: 'Segundas derivadas', html: `$f_{xx} = ${T2(fxx)}$, &ensp; $f_{yy} = ${T2(fyy)}$, &ensp; $f_{xy} = f_{yx} = ${T2(fxy)}$ (teorema de Schwarz)` });
    const out = { modo: 'parciales', ast, fx, fy, fxx, fxy, fyy, txt: [fx, fy, fxx, fyy, fxy].map(T2), fv: (x, y) => val2(ast, x, y), pasos };
    const clasifica = (x, y) => { const a = val2(fxx, x, y), b = val2(fxy, x, y), c = val2(fyy, x, y), Dt = a * c - b * b; return { Dt, tipo: Math.abs(Dt) < 1e-9 ? 'dudoso (D = 0)' : Dt < 0 ? 'punto de silla' : a > 0 ? 'mínimo' : 'máximo' }; };
    if (!vacio(sc.x0) || !vacio(sc.y0)) {
      const x0 = num(sc.x0, 'x₀'), y0 = num(sc.y0, 'y₀'), z = val2(ast, x0, y0);
      if (!isFinite(z)) throw new Error(`f no existe en (${f(x0)}, ${f(y0)})`);
      const gx = val2(fx, x0, y0), gy = val2(fy, x0, y0);
      out.punto = { x0, y0, z, gx, gy };
      pasos.push({ t: `En (${f(x0)}, ${f(y0)})`, html: `$f = ${nt(z)}$, &ensp; $∇f = (f_{x}, f_{y}) = (${nt(gx)}, ${nt(gy)})$, &ensp; $|∇f| = ${nt(Math.hypot(gx, gy))}$<br>El gradiente apunta hacia donde f crece más deprisa. Plano tangente: $z = ${nt(z)} ${gx < 0 ? '−' : '+'} ${nt(Math.abs(gx))} (x − ${nt(x0)}) ${gy < 0 ? '−' : '+'} ${nt(Math.abs(gy))} (y − ${nt(y0)})$`.replace(/\(x − −/g, '(x + ').replace(/\(y − −/g, '(y + ') });
    }
    // puntos críticos: f_x = f_y = 0 por Newton desde una rejilla
    const crit = [];
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
      let x = i, y = j;
      for (let k = 0; k < 60; k++) {
        const g1 = val2(fx, x, y), g2 = val2(fy, x, y), a = val2(fxx, x, y), b = val2(fxy, x, y), c = val2(fyy, x, y), d = a * c - b * b;
        if (![g1, g2, a, b, c].every(isFinite) || Math.abs(d) < 1e-14) break;
        const dx = (c * g1 - b * g2) / d, dy = (a * g2 - b * g1) / d; x -= dx; y -= dy;
        if (Math.abs(dx) + Math.abs(dy) < 1e-13) break;
      }
      if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 8 || Math.abs(y) > 8) continue;
      if (Math.hypot(val2(fx, x, y), val2(fy, x, y)) > 1e-8) continue;
      x = redondea(x, 1e-7); y = redondea(y, 1e-7);
      if (!crit.some((q) => Math.abs(q.x - x) < 1e-6 && Math.abs(q.y - y) < 1e-6)) crit.push({ x, y, z: val2(ast, x, y), ...clasifica(x, y) });
    }
    crit.sort((p, q) => p.x - q.x || p.y - q.y);
    out.crit = crit.slice(0, 9);
    pasos.push({ t: 'Puntos críticos', html: out.crit.length ? `Donde $f_{x} = f_{y} = 0$ (buscados cerca del origen). Con el hessiano $D = f_{xx} f_{yy} − f_{xy}^{2}$: si $D > 0$ es extremo (mínimo si $f_{xx} > 0$, máximo si $f_{xx} < 0$) y si $D < 0$, punto de silla.<br>${out.crit.map((q) => `$(${nt(q.x)}, ${nt(q.y)})$: $D = ${nt(q.Dt)}$, ${q.tipo} (f = ${f(q.z)})`).join('<br>')}` : 'No hay puntos donde $f_{x} = f_{y} = 0$ cerca del origen.' });
    return out;
  }

  /* ---------- Límites con L'Hôpital ---------- */
  function limite(sc) {
    const ast = E.simp(E.lee(sc.f, 'f(x)', ['x'])), a = limiteDe(sc.a, 'el punto a'), pasos = [];
    // si f solo existe por un lado de a, todos los límites se toman por ese lado
    const g0 = (x) => E.valor(ast, x), hay = (s) => isFinite(a) && [1e-3, 1e-5, 1e-7].some((e) => isFinite(g0(a + s * e)));
    const lado = !isFinite(a) ? 0 : hay(1) && !hay(-1) ? 1 : hay(-1) && !hay(1) ? -1 : 0;
    const lv = (n) => limAst(n, a, lado);
    // la clase de un límite; ±∞ distinto por cada lado (1/x en 0) también cuenta como ∞
    const inf2 = (n) => isFinite(a) && !lado && [1, -1].every((s) => { const L = limNum((x) => E.valor(n, x), a, s); return L === Infinity || L === -Infinity; });
    const cls = (L, n) => (n && Number.isNaN(L) && inf2(n) ? '∞' : L === null || Number.isNaN(L) ? '?' : !isFinite(L) ? '∞' : Math.abs(L) < 1e-10 ? '0' : 'k');
    const flecha = `x → ${nt(a)}`, lim = (s) => `lím_{${flecha}} ${s}`;
    pasos.push({ t: 'Límite', html: `$${lim(T(ast))}$` });
    const L0 = lv(ast);
    let u = null, v = null, ex = false;
    // 0 · ∞ como cociente: el logaritmo arriba (ln x / (1/x)); si no, el factor que va a ∞ arriba
    const hayLn = (n) => /ln|log|arc/.test(E.texto(n));
    const producto = (A, B) => {
      const ca = cls(lv(A), A), cb = cls(lv(B), B);
      if (!((ca === '0' && cb === '∞') || (ca === '∞' && cb === '0'))) return null;
      if (hayLn(B) && !hayLn(A)) return [B, div(N(1), A)];
      if (hayLn(A) && !hayLn(B)) return [A, div(N(1), B)];
      return ca === '∞' ? [A, div(N(1), B)] : [B, div(N(1), A)];
    };
    if (ast.t === '/' && tx(ast.b)) { u = ast.a; v = ast.b; }
    else if (ast.t === '*') { const p = producto(ast.a, ast.b); if (p) { [u, v] = p; pasos.push({ t: 'Forma 0 · ∞', html: `Se pasa a cociente: $${T(ast.a)} · ${T(ast.b)} = {${T(u)}}/{${T(v)}}$` }); } }
    else if (ast.t === '^' && tx(ast.b) && tx(ast.a)) {
      const cb = lv(ast.a), ce = cls(lv(ast.b), ast.b), forma = Math.abs(cb - 1) < 1e-10 && ce === '∞' ? '1^{∞}' : cls(cb) === '0' && ce === '0' ? '0^{0}' : cls(cb) === '∞' && ce === '0' ? '∞^{0}' : null;
      if (forma) {
        const lnu = E.simp(ln(ast.a)), p = producto(ast.b, lnu) || (ast.t && null);
        if (p) { [u, v] = p; ex = true; pasos.push({ t: `Forma ${forma}`, html: `Se toma logaritmo: $f = e^{ln f}$ con $ln f = ${T(ast.b)} · ${T(lnu)} = {${T(u)}}/{${T(v)}}$, y se calcula el límite del exponente.` }); }
      }
    } else if ((ast.t === '-' || ast.t === '+') && cls(lv(ast.a), ast.a) === '∞' && cls(lv(ast.b), ast.b) === '∞' && ast.a.t === '/' && ast.b.t === '/') {
      u = E.simp(op(ast.t, prod(ast.a.a, ast.b.b), prod(ast.b.a, ast.a.b))); v = E.simp(prod(ast.a.b, ast.b.b));
      pasos.push({ t: 'Forma ∞ − ∞', html: `Se pone con denominador común: $${T(ast)} = {${T(u)}}/{${T(v)}}$` });
    }
    let L = u ? null : L0, usado = 0;
    if (u) {
      for (let k = 0; k < 6; k++) {
        const lu = lv(u), ld = lv(v), cu = cls(lu, u), cd = cls(ld, v);
        if (!((cu === '0' && cd === '0') || (cu === '∞' && cd === '∞'))) {
          const q = cd === 'k' && cu !== '?' ? (cu === '∞' ? lu * Math.sign(ld) : lu / ld) : lv(div(u, v));
          pasos.push({ t: usado ? 'Ya no es indeterminado' : 'Sustituyendo', html: `$${lim(`{${T(u)}}/{${T(v)}}`)} = ${cu === '∞' ? nt(lu) : nt(lu)}/${nt(ld)} = ${q === null || Number.isNaN(q) ? '?' : nt(q)}$`.replace(/= ([^$]*)\/([^$]*) =/, (m0, p, s) => `= {${p}}/{${s}} =`) });
          L = ex ? Math.exp(q) : q;
          if (ex) pasos.push({ t: 'Deshaciendo el logaritmo', html: `$${lim('f')} = e^{${nt(q)}} = ${nt(L)}$` });
          break;
        }
        usado++;
        const du = E.simp(D(u)), dv = E.simp(D(v));
        pasos.push({ t: `Regla de L'Hôpital${usado > 1 ? ` (${usado}.ª vez)` : ''}`, html: `Es de la forma $${cu === '0' ? '{0}/{0}' : '{∞}/{∞}'}$: $${lim(`{u}/{v}`)} = ${lim(`{u′}/{v′}`)}$<br>$u′ = ${T(du)}$, &ensp; $v′ = ${T(dv)}$` });
        u = pulir(du); v = pulir(dv);
        // si u′/v′ es un cociente de polinomios, se simplifica: {1/x}/{−1/x²} = −x
        const rq = cocienteP(div(du, dv));
        if (rq) { u = rq.n; v = rq.d; pasos[pasos.length - 1].html += `<br>Simplificando: $${esNum(v) && v.v === 1 ? `{u′}/{v′} = ${T(u)}` : `{u′}/{v′} = {${T(u)}}/{${T(v)}}`}$`; }
        // si tras seis veces sigue indeterminado, el límite del último cociente (que ya no tiene la cancelación del principio)
        if (k === 5) { const q = lv(div(u, v)); L = ex && q !== null && !Number.isNaN(q) ? Math.exp(q) : q; pasos.push({ t: 'Límite del cociente', html: `Sigue siendo indeterminado; numéricamente, $${lim(`{u′}/{v′}`)} = ${q === null || Number.isNaN(q) ? '?' : nt(redondea(q, 1e-8))}$${ex && q !== null && !Number.isNaN(q) ? ` y $${lim('f')} = e^{${nt(redondea(q, 1e-8))}} = ${nt(redondea(L, 1e-8))}$` : ''}` }); }
      }
    } else pasos.push({ t: L0 === null || Number.isNaN(L0) ? 'Sin límite' : 'Sustituyendo', html: L0 === null || Number.isNaN(L0) ? 'Los límites por la izquierda y por la derecha no coinciden (o f oscila): el límite no existe.' : `No es una indeterminación: $${lim(T(ast))} = ${nt(L0)}$` });
    // si L'Hôpital no llega, el valor numérico
    if (L === null || Number.isNaN(L)) L = L0;
    if (L !== null && isFinite(L)) L = redondea(L, 1e-8);
    pasos.push({ t: 'Resultado', html: L === null || Number.isNaN(L) ? 'El límite no existe.' : `$${lim(T(ast))} = ${nt(L)}$` });
    return { modo: 'limite', ast, a, val: L, existe: !(L === null || Number.isNaN(L)), txt: L === null || Number.isNaN(L) ? 'no existe' : nt(L), lhopital: usado, f: (x) => E.valor(ast, x), pasos };
  }

  // cociente de polinomios ya simplificado (o null): { n, d } como árboles
  function cocienteP(q) {
    const cambia = (m) => (m.t === 'x' ? { t: 'x', n: 's' } : m.t === 'n' || m.t === 'c' ? m : { ...m, a: m.a && cambia(m.a), b: m.b && cambia(m.b) });
    let F;
    try { F = LapR.simplifica(LapR.racional(cambia(q))); } catch (e) { return null; }
    const k = F.d[F.d.length - 1], nn = F.n.map((c) => redondea(c / k)), dd = F.d.map((c) => redondea(c / k));
    if (F.n.length + F.d.length > 12) return null;
    return { n: poliDesc(nn), d: poliDesc(dd) };
  }

  /* ---------- Estudio completo de una función ---------- */
  const A_ = 10;
  function estudio(sc) {
    const ast = E.simp(E.lee(sc.f, 'f(x)', ['x'])), g = (x) => E.valor(ast, x), d1 = E.simp(D(ast)), d2 = E.simp(D(d1)), pasos = [];
    pasos.push({ t: 'Función', html: `$f(x) = ${T(ast)}$, &ensp; $f′(x) = ${T(pulir(d1))}$, &ensp; $f″(x) = ${T(pulir(d2))}$<br>Lo que hay que buscar (cortes, asíntotas, extremos) se busca entre $x = −${A_}$ y $x = ${A_}$.` });
    // dominio: tramos donde f existe
    const n = 4000, h = (2 * A_) / n, ok = Array.from({ length: n + 1 }, (_, i) => isFinite(g(-A_ + i * h)));
    const borde = (x1, x2) => { let lo = x1, hi = x2; const a0 = isFinite(g(lo)); for (let k = 0; k < 70; k++) { const m = (lo + hi) / 2; if (isFinite(g(m)) === a0) lo = m; else hi = m; } return redondea((lo + hi) / 2, 1e-7); };
    const tramos = [];
    for (let i = 0; i <= n; i++) {
      if (!ok[i]) continue;
      let j = i; while (j < n && ok[j + 1]) j++;
      tramos.push({ l: i === 0 ? -Infinity : borde(-A_ + (i - 1) * h, -A_ + i * h), r: j === n ? Infinity : borde(-A_ + (j + 1) * h, -A_ + j * h) });
      i = j;
    }
    if (!tramos.length) throw new Error('f no existe en ningún punto entre −10 y 10');
    // los polos sueltos que no caen en la rejilla
    for (const c of singulares(ast, -A_, A_)) { const t = tramos.find((q) => q.l < c && c < q.r); if (t) { tramos.push({ l: c, r: t.r }); t.r = c; } }
    tramos.sort((p, q) => p.l - q.l);
    const cerrado = (x) => isFinite(x) && isFinite(g(x));
    const tTxt = (t) => `${cerrado(t.l) ? '[' : '('}${nt(t.l)}, ${nt(t.r)}${cerrado(t.r) ? ']' : ')'}`;
    const quitados = tramos.slice(1).filter((t, i) => t.l === tramos[i].r).map((t) => t.l);
    const dom = tramos.length === 1 && tramos[0].l === -Infinity && tramos[0].r === Infinity ? 'ℝ'
      : tramos[0].l === -Infinity && tramos[tramos.length - 1].r === Infinity && quitados.length === tramos.length - 1 ? `ℝ − \\{${quitados.map(nt).join(', ')}\\}` : tramos.map(tTxt).join(' ∪ ');
    pasos.push({ t: 'Dominio', html: `$"Dom" f = ${dom}$` });
    // simetría
    const par = PRUEBA.filter((x) => isFinite(g(x)) && isFinite(g(-x))), esPar = par.length >= 3 && par.every((x) => Math.abs(g(-x) - g(x)) < 1e-9 * Math.max(1, Math.abs(g(x)))), esImpar = !esPar && par.length >= 3 && par.every((x) => Math.abs(g(-x) + g(x)) < 1e-9 * Math.max(1, Math.abs(g(x))));
    const sim = esPar ? 'par: $f(−x) = f(x)$, simétrica respecto del eje y' : esImpar ? 'impar: $f(−x) = −f(x)$, simétrica respecto del origen' : 'ni par ni impar';
    pasos.push({ t: 'Simetría', html: `Es ${sim}.` });
    // cortes con los ejes
    const clip = (t) => [Math.max(t.l, -A_), Math.min(t.r, A_)];
    const cortesX = tramos.flatMap((t) => { const [l, r] = clip(t); return raicesNum(g, l + 1e-9, r - 1e-9, 1500); });
    const y0 = cerrado(0) ? g(0) : null;
    pasos.push({ t: 'Cortes con los ejes', html: `Eje x ($f = 0$): ${cortesX.length ? cortesX.map((x) => `$(${nt(x)}, 0)$`).join(', ') : 'no lo corta'}.<br>Eje y: ${y0 === null ? '$x = 0$ no está en el dominio' : `$(0, ${nt(y0)})$`}.` });
    // asíntotas
    const asV = [];
    for (const t of tramos) for (const [c, s] of [[t.l, 1], [t.r, -1]]) if (isFinite(c)) { const L = limNum(g, c, s); if (L === Infinity || L === -Infinity) asV.push({ x: c, lado: s, L }); }
    const vert = [...new Set(asV.map((q) => q.x))];
    const asH = [], asO = [];
    for (const s of [1, -1]) {
      const fin = s > 0 ? tramos[tramos.length - 1].r === Infinity : tramos[0].l === -Infinity;
      if (!fin) continue;
      const L = limNum(g, s * Infinity);
      if (L !== null && isFinite(L)) { asH.push({ s, y: redondea(L) }); continue; }
      if (L === null) continue;
      const m0 = limNum((x) => g(x) / x, s * Infinity), m = m0 === null ? null : redondea(m0, 1e-8);
      if (m === null || !isFinite(m) || Math.abs(m) < 1e-9) continue;
      const k = limNum((x) => g(x) - m * x, s * Infinity, 1, 7);
      if (k !== null && isFinite(k)) asO.push({ s, m: redondea(m), n: redondea(k) });
    }
    const recta = (m, k) => E.texto(E.simp(op('+', op('*', N(m), X), N(k))));
    const lado = (s) => (s > 0 ? 'x → ∞' : 'x → −∞');
    const hTxt = asH.length === 2 && asH[0].y === asH[1].y ? [`$y = ${nt(asH[0].y)}$ (por los dos lados)`] : asH.map((q) => `$y = ${nt(q.y)}$ (cuando $${lado(q.s)}$)`);
    const oTxt = asO.length === 2 && asO[0].m === asO[1].m && asO[0].n === asO[1].n ? [`$y = ${recta(asO[0].m, asO[0].n)}$ (por los dos lados)`] : asO.map((q) => `$y = ${recta(q.m, q.n)}$ (cuando $${lado(q.s)}$)`);
    pasos.push({ t: 'Asíntotas', html: `Verticales: ${vert.length ? vert.map((c) => `$x = ${nt(c)}$`).join(', ') : 'ninguna'}.<br>Horizontales: ${hTxt.length ? hTxt.join(', ') : 'ninguna'}.${oTxt.length ? `<br>Oblicuas ($m = lím f/x$, $n = lím (f − m x)$): ${oTxt.join(', ')}.` : ''}` });
    // monotonía y extremos, curvatura e inflexión
    const v1 = (x) => E.valor(d1, x), v2 = (x) => E.valor(d2, x);
    const signos = (dv) => {
      const out = [];
      for (const t of tramos) {
        const [l, r] = clip(t), rs = raicesNum(dv, l + 1e-9, r - 1e-9, 1500), pts = [t.l, ...rs, t.r];
        for (let i = 0; i < pts.length - 1; i++) {
          const p = pts[i], q = pts[i + 1], m = !isFinite(p) && !isFinite(q) ? 0 : !isFinite(p) ? q - 1 : !isFinite(q) ? p + 1 : (p + q) / 2;
          out.push({ p, q, s: Math.sign(dv(m)), cierra: i < pts.length - 2 ? q : null });
        }
      }
      return out;
    };
    const iTxt = (p, q) => `(${nt(p)}, ${nt(q)})`;
    const S1 = signos(v1), crece = S1.filter((q) => q.s > 0).map((q) => iTxt(q.p, q.q)), decrece = S1.filter((q) => q.s < 0).map((q) => iTxt(q.p, q.q));
    const extremos = [];
    for (let i = 0; i < S1.length - 1; i++) if (S1[i].cierra !== null && S1[i].s && S1[i + 1].s && S1[i].s !== S1[i + 1].s) { const x = S1[i].cierra; extremos.push({ x, y: g(x), tipo: S1[i].s > 0 ? 'máximo' : 'mínimo' }); }
    const S2 = signos(v2), arriba = S2.filter((q) => q.s > 0).map((q) => iTxt(q.p, q.q)), abajo = S2.filter((q) => q.s < 0).map((q) => iTxt(q.p, q.q)), infl = [];
    for (let i = 0; i < S2.length - 1; i++) if (S2[i].cierra !== null && S2[i].s && S2[i + 1].s && S2[i].s !== S2[i + 1].s) { const x = S2[i].cierra; infl.push({ x, y: g(x) }); }
    pasos.push({ t: 'Monotonía y extremos', html: `Por el signo de $f′$: crece en $${crece.join(' ∪ ') || '∅'}$ y decrece en $${decrece.join(' ∪ ') || '∅'}$.<br>${extremos.length ? extremos.map((q) => `${q.tipo === 'máximo' ? 'Máximo' : 'Mínimo'} relativo en $(${nt(q.x)}, ${nt(q.y)})$`).join('<br>') : 'No tiene máximos ni mínimos relativos.'}` });
    pasos.push({ t: 'Curvatura e inflexión', html: `Por el signo de $f″$: convexa ($∪$, $f″ > 0$) en $${arriba.join(' ∪ ') || '∅'}$ y cóncava ($∩$, $f″ < 0$) en $${abajo.join(' ∪ ') || '∅'}$.<br>${infl.length ? infl.map((q) => `Punto de inflexión en $(${nt(q.x)}, ${nt(q.y)})$`).join('<br>') : 'No tiene puntos de inflexión.'}` });
    const asTxt = [...vert.map((c) => `x = ${nt(c)}`), ...(asH.length === 2 && asH[0].y === asH[1].y ? [`y = ${nt(asH[0].y)}`] : asH.map((q) => `y = ${nt(q.y)}`)), ...(asO.length === 2 && asO[0].m === asO[1].m && asO[0].n === asO[1].n ? [`y = ${recta(asO[0].m, asO[0].n)}`] : asO.map((q) => `y = ${recta(q.m, q.n)}`))];
    return { modo: 'estudio', ast, d1, d2, dom, tramos, asTxt, par: esPar, impar: esImpar, cortesX, y0, asV: vert, asH, asO, extremos, infl, crece, decrece, convexa: arriba, concava: abajo, f: (x) => g(x), d: (k) => (x) => E.valor(k === 1 ? d1 : d2, x), txt: dom, pasos };
  }

  const MODOS = { derivada, integral, limite, implicita, parciales, estudio, area, volumen };
  function resolver(sc) { return (MODOS[sc.modo] || derivada)(sc); }
  const ejemplos = [
    { clave: 'producto', nombre: 'Producto: x² sen x', sc: { modo: 'derivada', f: 'x^2 sen(x)', orden: '1', x0: '' } },
    { clave: 'cociente', nombre: 'Cociente: (x² + 1)/(x − 1)', sc: { modo: 'derivada', f: '(x^2 + 1)/(x - 1)', orden: '1', x0: '3' } },
    { clave: 'cadena', nombre: 'Cadena: e^(−x²)', sc: { modo: 'derivada', f: 'e^(-x^2)', orden: '2', x0: '' } },
    { clave: 'raiz', nombre: 'Raíz y logaritmo', sc: { modo: 'derivada', f: 'ln(sqrt(x^2 + 1))', orden: '1', x0: '1' } },
    { clave: 'tangente', nombre: 'Recta tangente a x³ − 3x', sc: { modo: 'derivada', f: 'x^3 - 3x', orden: '2', x0: '2' } },
    { clave: 'arctg', nombre: 'arctg(2x) y orden 3', sc: { modo: 'derivada', f: 'arctg(2x)', orden: '3', x0: '0' } },
    { clave: 'logaritmica', nombre: 'Derivación logarítmica: x^x', sc: { modo: 'derivada', f: 'x^x', orden: '1', x0: '1' } },
    { clave: 'potencias', nombre: 'Potencias y raíces', sc: { modo: 'integral', f: '3x^2 - 4/x + sqrt(x)', a: '1', b: '4' } },
    { clave: 'sustitucion', nombre: 'Sustitución: x e^(x²)', sc: { modo: 'integral', f: 'x e^(x^2)', a: '0', b: '1' } },
    { clave: 'partes', nombre: 'Por partes: x² eˣ', sc: { modo: 'integral', f: 'x^2 e^x', a: '0', b: '1' } },
    { clave: 'partes-ln', nombre: 'Por partes: x ln x', sc: { modo: 'integral', f: 'x ln(x)', a: '1', b: 'e' } },
    { clave: 'racional', nombre: 'Racional: fracciones simples', sc: { modo: 'integral', f: '(3x + 5)/(x^2 + 2x - 3)', a: '2', b: '4' } },
    { clave: 'arcotangente', nombre: 'Racional con arcotangente', sc: { modo: 'integral', f: '1/(x^2 + 4)', a: '0', b: '2' } },
    { clave: 'trig', nombre: 'sen² x (ángulo doble)', sc: { modo: 'integral', f: 'sen(x)^2', a: '0', b: 'pi' } },
    { clave: 'cicliclica', nombre: 'eˣ cos x (partes dos veces)', sc: { modo: 'integral', f: 'e^x cos(x)', a: '0', b: 'pi/2' } },
    { clave: 'gauss', nombre: 'e^(−x²): sin primitiva elemental', sc: { modo: 'integral', f: 'e^(-x^2)', a: '0', b: '1' } },
    { clave: 'prod-trig', nombre: 'sen 3x cos 2x (producto a suma)', sc: { modo: 'integral', f: 'sen(3x) cos(2x)', a: '0', b: 'pi/2' } },
    { clave: 'semicirculo', nombre: '√(4 − x²): cambio trigonométrico', sc: { modo: 'integral', f: 'sqrt(4 - x^2)', a: '-2', b: '2' } },
    { clave: 'impropia', nombre: 'Impropia: ∫₁^∞ 1/x²', sc: { modo: 'integral', f: '1/x^2', a: '1', b: '∞' } },
    { clave: 'impropia-diverge', nombre: 'Impropia que diverge: ∫₁^∞ 1/x', sc: { modo: 'integral', f: '1/x', a: '1', b: '∞' } },
    { clave: 'impropia-asintota', nombre: 'Asíntota en un extremo: ∫₀¹ 1/√x', sc: { modo: 'integral', f: '1/sqrt(x)', a: '0', b: '1' } },
    { clave: 'impropia-dentro', nombre: 'Asíntota dentro: ∫₋₁⁸ 1/∛x', sc: { modo: 'integral', f: '1/cbrt(x)', a: '-1', b: '8' } },
    { clave: 'impropia-gauss', nombre: 'Gauss: ∫₀^∞ e^(−x²)', sc: { modo: 'integral', f: 'e^(-x^2)', a: '0', b: '∞' } },
    { clave: 'lh-sen', nombre: 'sen x / x en 0', sc: { modo: 'limite', f: 'sen(x)/x', a: '0' } },
    { clave: 'lh-dos', nombre: '(1 − cos x)/x²: dos veces', sc: { modo: 'limite', f: '(1 - cos(x))/x^2', a: '0' } },
    { clave: 'lh-cero-inf', nombre: 'x ln x en 0 (0 · ∞)', sc: { modo: 'limite', f: 'x ln(x)', a: '0' } },
    { clave: 'lh-uno-inf', nombre: '(1 + 1/x)^x en ∞ (1^∞)', sc: { modo: 'limite', f: '(1 + 1/x)^x', a: '∞' } },
    { clave: 'lh-resta', nombre: '1/x − 1/sen x (∞ − ∞)', sc: { modo: 'limite', f: '1/x - 1/sen(x)', a: '0' } },
    { clave: 'circunferencia', nombre: 'Circunferencia x² + y² = 25', sc: { modo: 'implicita', ec: 'x^2 + y^2 = 25', x0: '3', y0: '4' } },
    { clave: 'folium', nombre: 'Folium de Descartes', sc: { modo: 'implicita', ec: 'x^3 + y^3 = 6 x y', x0: '3', y0: '3' } },
    { clave: 'parciales', nombre: 'f(x, y) = x² y + y³ − 3y', sc: { modo: 'parciales', f: 'x^2 y + y^3 - 3y', x0: '1', y0: '2' } },
    { clave: 'silla', nombre: 'Silla y mínimo: x³ − 3x + y²', sc: { modo: 'parciales', f: 'x^3 - 3x + y^2', x0: '', y0: '' } },
    { clave: 'estudio', nombre: 'Estudio de (x² + 1)/(x − 1)', sc: { modo: 'estudio', f: '(x^2 + 1)/(x - 1)' } },
    { clave: 'estudio-exp', nombre: 'Estudio de x e^(−x)', sc: { modo: 'estudio', f: 'x e^(-x)' } },
    { clave: 'estudio-ln', nombre: 'Estudio de ln x / x', sc: { modo: 'estudio', f: 'ln(x)/x' } },
    { clave: 'area', nombre: 'Área entre x² y x', sc: { modo: 'area', f: 'x', g: 'x^2', a: '', b: '' } },
    { clave: 'area-cruce', nombre: 'Área entre x³ y x (se cruzan)', sc: { modo: 'area', f: 'x^3', g: 'x', a: '', b: '' } },
    { clave: 'volumen', nombre: 'Volumen: √x de 0 a 4 (discos)', sc: { modo: 'volumen', f: 'sqrt(x)', g: '', a: '0', b: '4', eje: 'x' } },
    { clave: 'esfera', nombre: 'Volumen de la esfera', sc: { modo: 'volumen', f: 'sqrt(1 - x^2)', g: '', a: '', b: '', eje: 'x' } },
    { clave: 'capas', nombre: 'Entre x y x² alrededor del eje y (capas)', sc: { modo: 'volumen', f: 'x', g: 'x^2', a: '', b: '', eje: 'y' } },
  ];
  return { resolver, derivada, integral, limite, implicita, parciales, estudio, area, volumen, prim, igualNum, limNum, raicesNum, cuadratura, ejemplos, f, T };
})();
if (typeof module !== 'undefined') module.exports = Derivadas;
