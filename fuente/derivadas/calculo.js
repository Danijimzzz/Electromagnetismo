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
  const T = (n) => E.texto(pulir(E.simp(n))).replace(/(ln|tg|sen|cos) \(\|([^()|]*)\|\)/g, '$1 |$2|');
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
  function igualNum(a, b, tol = 1e-7) {
    let n = 0;
    for (const x of PRUEBA) {
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
    const nota = (txt, F) => { ps.push(`$∫ ${T(n)} dx = ${T(F)}$ &ensp; (${txt})`); return F; };
    // un solo factor de la tabla con argumento lineal
    if (vs.length === 1) {
      const t = tipo(vs[0].n, vs[0].s);
      if (t.k === 'asen') { const F = prod(N(1 / Math.sqrt(t.q)), fn('arcsen', prod(N(Math.sqrt(t.q / t.p)), X))); return { F: nota('$∫ {dx}/{√(a^{2} − b^{2}x^{2})} = {1}/{b} arcsen {b x}/{a}$', F), como: 'tabla' }; }
      const L = t.u && lineal(t.u), Ft = L && tabla(t);
      if (Ft) return { F: nota(`tabla, ${Math.abs(L.a - 1) < 1e-12 ? `$${nomT(t)}$` : `$${nomT(t)}$ con $u = ${T(t.u)}$, $du = ${E.numTxt(L.a)} dx$`}`, div(Ft, N(L.a))), como: 'tabla' };
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
        if (c !== null && Math.abs(c) > 1e-12) return { F: nota(`sustitución $u = ${T(t.u)}$, $du = ${T(du)} dx$, y $${nomT(t)}$`, prod(N(c), Ft)), como: 'sustitución' };
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
          return { F: nota(`por partes ${k} ${k === 1 ? 'vez' : 'veces'}: $∫ u dv = u v − ∫ v du$ con $u = ${T(poliAst(Pp))}$ y $dv = ${T(vs[ip].n)} dx$`, F), como: 'partes' };
        }
        // e^{ax} sen(bx), e^{ax} cos(bx): partes dos veces y se despeja
        const otro = vs.length === 2 ? tipo(vs[1 - ip].n) : null;
        if (otro && vs[1 - ip].s > 0 && ((t.k === 'exp' && ['sen', 'cos'].includes(otro.k)) || (otro.k === 'exp' && ['sen', 'cos'].includes(t.k)))) {
          const ex = t.k === 'exp' ? t : otro, tr = t.k === 'exp' ? otro : t, A = lineal(ex.u), B = lineal(tr.u);
          if (A && B) {
            const a = A.a, b = B.a, k2 = a * a + b * b, e = op('^', C('e'), ex.u), s = fn('sen', tr.u), c = fn('cos', tr.u);
            const F = tr.k === 'sen' ? prod(div(e, N(k2)), op('-', prod(N(a), s), prod(N(b), c))) : prod(div(e, N(k2)), op('+', prod(N(a), c), prod(N(b), s)));
            return { F: nota('por partes dos veces: vuelve a salir la integral del principio y se despeja', F), como: 'partes' };
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
          if (resto) return { F: nota(`por partes: $u = ${T(g)}$, $dv = ${T(dv)} dx$, así $v = ${T(Q)}$`, op('-', prod(Q, g), resto.F)), como: 'partes' };
        }
      }
    }
    // una potencia de ln o una función inversa sola: por partes con dv = dx
    if (vs.length === 1 && vs[0].s > 0 && /ln|arc/.test(E.texto(n)) && prof < 4) {
      const resto = prim(prod(X, D(n)), ps, prof + 2);
      if (resto) return { F: nota(`por partes: $u = ${T(n)}$, $dv = dx$, así $v = x$`, op('-', prod(X, n), resto.F)), como: 'partes' };
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
      const a = num(sc.a, 'el límite inferior a'), b = num(sc.b, 'el límite superior b');
      if (a === b) throw new Error('Los dos límites son iguales: la integral vale 0');
      out.a = a; out.b = b;
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

  const MODOS = { derivada, integral };
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
  ];
  return { resolver, derivada, integral, prim, igualNum, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Derivadas;
