const Derivadas = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const LapR = typeof Laplace !== 'undefined' ? Laplace : require('../laplace/calculo.js');
  const N = (v) => ({ t: 'n', v }), X = { t: 'x' }, C = (v) => ({ t: 'c', v });
  const op = (t, a, b) => ({ t, a, b }), neg = (a) => ({ t: 'neg', a }), fn = (f, a) => ({ t: 'fn', f, a });
  const esNum = (n) => n.t === 'n';
  const tx = (n) => E.tieneX(n);
  const T = (n) => E.texto(pulir(E.simp(n))).replace(/(ln|tg|sen|cos) \(\|((?:[^()|]|\([^()]*\))*)\|\)/g, '$1 |$2|');
  const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));
  function pulir(n) {
    let sg = 1, q = n;
    if (q.t === 'neg') { sg = -1; q = q.a; }
    if (q.t !== '/' || !tx(q.b)) return n;
    let Pn = poli(q.a);
    if (!Pn || Pn.length < 2) return n;
    const den = factores(q.b), fs = den.fs.map((g) => { const b = g.n.t === '^' && esNum(g.n.b) && Number.isInteger(g.n.b.v) ? g.n.a : g.n, k = b === g.n ? 1 : g.n.b.v; return { b, k: k * g.s, P: poli(b) }; });
    if (fs.some((g) => g.k < 0)) return n;
    const divide = (A, B) => {
      const r = A.slice(), dq = new Array(Math.max(0, A.length - B.length + 1)).fill(0), l = B[B.length - 1];
      for (let i = A.length - B.length; i >= 0; i--) { const c = r[i + B.length - 1] / l; dq[i] = c; for (let j = 0; j < B.length; j++) r[i + j] -= c * B[j]; }
      return r.slice(0, B.length - 1).every((v) => Math.abs(v) < 1e-9 * Math.max(1, ...A.map(Math.abs))) ? dq.map((v) => { const k = Math.round(v); return Math.abs(v - k) < 1e-9 ? k : v; }) : null;
    };
    for (const g of fs) while (g.P && g.P.length > 1 && g.k > 0) { const d = divide(Pn, g.P); if (!d) break; Pn = d; g.k--; }
    Pn = Pn.map((c) => c * sg * den.k ** -1);
    let lead = Pn[Pn.length - 1] < 0 ? -1 : 1;
    const ent = Pn.every((c) => Number.isInteger(c)), g0 = ent ? Pn.reduce((a, c) => mcd(a, c), 0) : 1;
    const k = ent && g0 > 1 ? lead * g0 : lead;
    const numA = poliDesc(Pn.map((c) => c / k)), kk = Math.abs(k);
    const arriba = kk !== 1 ? (numA.t === '+' || numA.t === '-' ? op('*', N(kk), numA) : poliDesc(Pn.map((c) => c * lead))) : numA;
    const resto = fs.filter((g) => g.k > 0).map((g) => (g.k === 1 ? g.b : op('^', g.b, N(g.k))));
    const r = resto.length ? op('/', arriba, mul(resto)) : arriba;
    return lead < 0 ? neg(r) : r;
  }
  const poliDesc = (c) => { let r = null; for (let i = c.length - 1; i >= 0; i--) { const k = c[i]; if (Math.abs(k) < 1e-14) continue; const m = i === 0 ? N(Math.abs(k)) : Math.abs(k) === 1 ? (i === 1 ? X : op('^', X, N(i))) : op('*', N(Math.abs(k)), i === 1 ? X : op('^', X, N(i))); r = r ? op(k < 0 ? '-' : '+', r, m) : k < 0 ? neg(m) : m; } return r || N(0); };
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function num(s, nom) {
    if (vacio(s)) throw new Error(`Il manque ${nom}`);
    const a = E.lee(String(s), nom, ['x']);
    if (tx(a)) throw new Error(`${nom} doit être un nombre`);
    const v = E.valor(a, 0);
    if (!isFinite(v)) throw new Error(`${nom} n’est pas un nombre valide`);
    return v;
  }
  const mul = (xs) => (xs.length ? xs.reduce((a, b) => op('*', a, b)) : N(1));
  const PRUEBA = [-2.3, -1.1, -0.37, 0.29, 0.83, 1.7, 2.6, 3.4];
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
  function lineal(u) {
    if (!tx(u)) return null;
    const b = E.valor(u, 0), a = E.valor(u, 1) - b;
    if (!isFinite(a) || !isFinite(b) || Math.abs(a) < 1e-14) return null;
    for (const x of [-1.7, 2.3]) if (Math.abs(E.valor(u, x) - (a * x + b)) > 1e-9 * Math.max(1, Math.abs(a * x + b))) return null;
    return { a, b };
  }
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
        if (prof === 0) pasos.push({ t: 'Somme', html: `La dérivée d’une somme est la somme des dérivées : on dérive chaque terme.` });
        sub(n.a); sub(n.b); return;
      }
      case 'neg': sub(n.a); return;
      case '*': {
        if (!tx(n.a) || !tx(n.b)) { const k = tx(n.a) ? n.b : n.a, u = tx(n.a) ? n.a : n.b; if (prof === 0) pasos.push({ t: 'Constante fois une fonction', html: `$(k u)′ = k u′$, avec $k = ${t(k)}$.` }); sub(u); return; }
        pasos.push({ t: 'Règle du produit', html: `$(u v)′ = u′ v + u v′$, avec $u = ${t(n.a)}$ et $v = ${t(n.b)}$ :<br>$u′ = ${d(n.a)}$, &ensp; $v′ = ${d(n.b)}$` });
        sub(n.a); sub(n.b); return;
      }
      case '/': {
        if (!tx(n.b)) { sub(n.a); return; }
        pasos.push({ t: 'Règle du quotient', html: `$({u}/{v})′ = {u′ v − u v′}/{v^{2}}$, avec $u = ${t(n.a)}$ et $v = ${t(n.b)}$ :<br>$u′ = ${d(n.a)}$, &ensp; $v′ = ${d(n.b)}$` });
        sub(n.a); sub(n.b); return;
      }
      case '^': {
        const { a, b } = n;
        if (!tx(b)) {
          if (a.t === 'x') return;
          pasos.push({ t: 'Puissance et dérivation en chaîne', html: `$(u^{n})′ = n u^{n − 1} u′$, avec $u = ${t(a)}$ et $n = ${t(b)}$ :<br>$u′ = ${d(a)}$` });
          sub(a); return;
        }
        if (a.t === 'c' && a.v === 'e') { if (b.t !== 'x') pasos.push({ t: 'Exponentielle et dérivation en chaîne', html: `$(e^{u})′ = e^{u} u′$, avec $u = ${t(b)}$ :<br>$u′ = ${d(b)}$` }); sub(b); return; }
        if (!tx(a)) { pasos.push({ t: 'Exponentielle de base a', html: `$(a^{u})′ = a^{u} ln a · u′$, avec $a = ${t(a)}$ et $u = ${t(b)}$ :<br>$u′ = ${d(b)}$` }); sub(b); return; }
        pasos.push({ t: 'Dérivation logarithmique', html: `Pour $y = u^{v}$ on prend le logarithme : $ln y = v ln u$, et en dérivant $y′ = u^{v} (v′ ln u + {v u′}/{u})$, avec $u = ${t(a)}$ et $v = ${t(b)}$.` });
        return;
      }
      case 'fn': {
        const u = n.a, F = FUNC[n.f] || '';
        if (u.t === 'x') { if (prof === 0) pasos.push({ t: 'Dérivée du tableau', html: `$(${n.f} x)′ = ${F.replace(/u/g, 'x')}$` }); return; }
        pasos.push({ t: 'Dérivation en chaîne', html: `$(f(u))′ = f′(u) · u′$ : ici $f = ${n.f === 'sqrt' ? '√' : n.f}$ et $u = ${t(u)}$, avec $(${n.f === 'sqrt' ? '√u' : `${n.f} u`})′ = ${F}$ et $u′ = ${d(u)}$` });
        sub(u); return;
      }
    }
  }
  function derivada(sc) {
    const ast = E.lee(sc.f, 'f(x)', ['x']);
    const orden = Math.max(1, Math.min(4, Math.round(num(sc.orden || '1', 'el orden'))));
    const pasos = [];
    pasos.push({ t: 'Fonction', html: `$f(x) = ${T(ast)}$` });
    const r = [];
    reglas(E.simp(ast), r);
    if (!r.length) r.push({ t: 'Tableau', html: 'C’est une dérivée directe du tableau.' });
    pasos.push(...r);
    const ders = [E.simp(ast)];
    for (let k = 1; k <= orden; k++) ders.push(pulir(D(ders[k - 1])));
    const prima = (k) => (k <= 3 ? `f${'′'.repeat(k)}` : `f^{(${k})}`);
    pasos.push({ t: 'Simplification', html: ders.slice(1).map((q, i) => `$${prima(i + 1)}(x) = ${T(q)}$`).join('<br>') });
    const out = { modo: 'derivada', ast: ders[0], ders, orden, txt: ders.slice(1).map(T), f: (x) => E.valor(ders[0], x), d: (k) => (x) => E.valor(ders[k] || D(ders[ders.length - 1]), x), pasos };
    if (!vacio(sc.x0)) {
      const x0 = num(sc.x0, 'x₀'), y0 = E.valor(ders[0], x0), m = E.valor(ders[1], x0);
      if (!isFinite(y0)) throw new Error(`f n’existe pas en x₀ = ${f(x0)}`);
      if (!isFinite(m)) throw new Error(`f n’est pas dérivable en x₀ = ${f(x0)}`);
      out.x0 = x0; out.y0 = y0; out.m = m; out.vals = ders.map((q) => E.valor(q, x0));
      const nt = E.numTxt, b = y0 - m * x0;
      out.tangente = `y = ${Math.abs(m) < 1e-12 ? nt(y0) : `${E.texto(E.simp(op('+', op('*', N(m), X), N(b))))}`}`;
      pasos.push({ t: `En x₀ = ${f(x0)}`, html: `$f(${nt(x0)}) = ${nt(y0)}$, &ensp; $f′(${nt(x0)}) = ${nt(m)}$${orden > 1 ? ders.slice(2).map((q, i) => `, &ensp; $${prima(i + 2)}(${nt(x0)}) = ${nt(E.valor(q, x0))}$`).join('') : ''}<br>Tangente : $y − f(x_0) = f′(x_0)(x − x_0)$ &ensp;⇒&ensp; $${out.tangente}$` });
    }
    const d1 = ders[1], d2 = D(d1), a = out.x0 !== undefined ? out.x0 - 5 : -5, b = out.x0 !== undefined ? out.x0 + 5 : 5, crit = [];
    out.constante = esNum(d1) ? d1.v === 0 : Array.from({ length: 41 }, (_, i) => E.valor(d1, a + ((b - a) * i) / 40)).every((v) => isFinite(v) && Math.abs(v) < 1e-12);
    if (out.constante) pasos.push({ t: 'Fonction constante', html: `$f′(x) = 0$ pour tout x, donc f est constante : elle n’a ni maxima ni minima isolés.` });
    let xa = a, va = E.valor(d1, a);
    for (let i = 1; i <= 400 && !out.constante; i++) {
      const xb = a + ((b - a) * i) / 400, vb = E.valor(d1, xb);
      if (isFinite(va) && isFinite(vb) && va * vb <= 0 && !(va === 0 && i > 1)) {
        let lo = xa, hi = xb, fl = va;
        for (let k = 0; k < 60; k++) { const mi = (lo + hi) / 2, vm = E.valor(d1, mi); if (fl * vm <= 0) hi = mi; else { lo = mi; fl = vm; } }
        const xc = (lo + hi) / 2, yc = E.valor(ders[0], xc);
        if (isFinite(yc) && Math.abs(E.valor(d1, xc)) < 1e-6 * Math.max(1, Math.abs(yc)) && !crit.some((q) => Math.abs(q.x - xc) < 1e-6)) {
          let q = d2, k = 2, s = E.valor(q, xc);
          while (Math.abs(s) < 1e-7 && k < 5) { q = D(q); k++; s = E.valor(q, xc); }
          const tipo = Math.abs(s) < 1e-7 ? 'dudoso' : k % 2 ? 'point d’inflexion à tangente horizontale' : s > 0 ? 'minimum' : 'maximum';
          crit.push({ x: Math.abs(xc) < 1e-10 ? 0 : xc, y: yc, tipo });
        }
      }
      xa = xb; va = vb;
    }
    out.crit = crit.slice(0, 8);
    if (out.crit.length) pasos.push({ t: 'Points critiques', html: `Là où $f′(x) = 0$ entre ${f(a)} et ${f(b)} ; le signe de $f″$ indique s’il s’agit d’un maximum ou d’un minimum :<br>${out.crit.map((q) => `$x = ${E.numTxt(q.x)}$: ${q.tipo} (f = ${f(q.y)})`).join('<br>')}` });
    return out;
  }

  const abs = (u) => fn('abs', u), ln = (u) => fn('ln', u);
  const div = (a, b) => op('/', a, b), prod = (a, b) => op('*', a, b), pot = (a, k) => op('^', a, N(k));
  function factores(n, s = 1, out = { k: 1, fs: [] }) {
    if (n.t === 'neg') { out.k *= -1; return factores(n.a, s, out); }
    if (n.t === '*') { factores(n.a, s, out); return factores(n.b, s, out); }
    if (n.t === '/') { factores(n.a, s, out); return factores(n.b, -s, out); }
    if (esNum(n)) { out.k *= n.v ** s; return out; }
    out.fs.push({ n, s });
    return out;
  }
  const junta = (fs) => { const a = fs.filter((q) => q.s > 0).map((q) => q.n), b = fs.filter((q) => q.s < 0).map((q) => q.n); return b.length ? div(mul(a), mul(b)) : mul(a); };
  function tipo(n, s = 1) {
    if (s < 0) {
      if (n.t === '^' && !tx(n.b)) { const e = E.valor(n.b, 0); if (n.a.t === 'fn' && e === 2 && n.a.f === 'cos') return { k: 'sec2', u: n.a.a }; if (n.a.t === 'fn' && e === 2 && n.a.f === 'sin') return { k: 'csc2', u: n.a.a }; return { k: 'pot', e: -e, u: n.a }; }
      if (n.t === 'fn' && n.f === 'sqrt') { const q = poli(n.a); if (q && q.length === 3 && q[1] === 0 && q[0] > 0 && q[2] < 0) return { k: 'asen', p: q[0], q: -q[2] }; return { k: 'pot', e: -0.5, u: n.a }; }
      if (n.t === 'fn' && n.f === 'cbrt') return { k: 'pot', e: -1 / 3, u: n.a };
      if (n.t === 'fn' && n.f === 'cos') return { k: 'sec', u: n.a };
      if (n.t === 'fn' && n.f === 'sin') return { k: 'csc', u: n.a };
      return { k: 'pot', e: -1, u: n };
    }
    if (n.t === 'fn' && n.f === 'cosec') return { k: 'csc', u: n.a };
    if (n.t === 'fn') { if (n.f === 'sqrt') return { k: 'pot', e: 0.5, u: n.a }; if (n.f === 'cbrt') return { k: 'pot', e: 1 / 3, u: n.a }; return { k: n.f, u: n.a }; }
    if (n.t === '^') {
      if (n.a.t === 'c' && n.a.v === 'e') return { k: 'exp', u: n.b };
      if (!tx(n.a)) return { k: 'apot', a: n.a, u: n.b };
      if (!tx(n.b)) { const e = E.valor(n.b, 0); return { k: 'pot', e, u: n.a }; }
    }
    if (n.t === 'x') return { k: 'pot', e: 1, u: n };
    return { k: 'otra', u: n };
  }
  function tabla(t) {
    const u = t.u;
    switch (t.k) {
      case 'sin': return neg(fn('cos', u));
      case 'cos': return fn('sin', u);
      case 'exp': return op('^', C('e'), u);
      case 'sinh': return fn('cosh', u);
      case 'cosh': return fn('sinh', u);
      case 'sec2': return fn('tan', u);
      case 'csc2': return neg(fn('cotg', u));
      case 'tan': return neg(ln(abs(fn('cos', u))));
      case 'cotg': return ln(abs(fn('sin', u)));
      case 'sec': return ln(abs(op('+', fn('sec', u), fn('tan', u))));
      case 'csc': case 'cosec': return ln(abs(fn('tan', prod(N(0.5), u))));
      case 'ln': return op('-', prod(u, ln(u)), u);
      case 'arctan': return op('-', prod(u, fn('arctan', u)), prod(N(0.5), ln(op('+', N(1), pot(u, 2)))));
      case 'arcsin': return op('+', prod(u, fn('arcsin', u)), fn('sqrt', op('-', N(1), pot(u, 2))));
      case 'apot': return div(op('^', t.a, u), ln(t.a));
      case 'pot':
        if (Math.abs(t.e + 1) < 1e-12) return ln(abs(u));
        return div(op('^', u, N(t.e + 1)), N(t.e + 1));
    }
    return null;
  }
  const NOMBRE_T = { csc: '∫ {du}/{sin u} = ln |tan {u}/{2}|', sen: '∫ sin u du = −cos u', cos: '∫ cos u du = sin u', exp: '∫ e^{u} du = e^{u}', senh: '∫ sinh u du = cosh u', cosh: '∫ cosh u du = sinh u', sec2: '∫ {du}/{cos^{2} u} = tan u', csc2: '∫ {du}/{sen^{2} u} = −"cotg" u', tg: '∫ tan u du = −ln |cos u|', ln: '∫ ln u du = u ln u − u (par parties)', apot: '∫ a^{u} du = {a^{u}}/{ln a}', arctg: '∫ arctan u du = u arctan u − {1}/{2} ln(1 + u^{2}) (par parties)', arcsen: '∫ arcsin u du = u arcsin u + √(1 − u^{2}) (par parties)' };
  const nomT = (t) => (t.k === 'pot' ? (Math.abs(t.e + 1) < 1e-12 ? '∫ {du}/{u} = ln |u|' : '∫ u^{n} du = {u^{n + 1}}/{n + 1}') : NOMBRE_T[t.k] || '');

  function prim1(h) {
    const { k, fs } = factores(E.simp(h));
    if (fs.length !== 1) return null;
    const t = tipo(fs[0].n, fs[0].s), L = t.u && lineal(t.u), F = L && tabla(t);
    return F ? E.simp(prod(N(k / L.a), F)) : null;
  }
  function prim(n0, ps, prof = 0) {
    if (prof > 8) return null;
    const n = E.simp(n0);
    if (!tx(n)) return { F: prod(n, X), como: 'constante' };
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
    if (vs.length > 1 && vs.every((q) => { const t = tipo(q.n, 1); return t.k === 'pot' && t.u.t === 'x'; })) {
      const e = vs.reduce((acc, q) => acc + tipo(q.n, 1).e * q.s, 0), F = tabla({ k: 'pot', e, u: X });
      ps.push(`$∫ ${T(n)} dx = ∫ x^{${E.numTxt(e)}} dx = ${T(F)}$ &ensp; (puissances)`);
      return { F, como: 'potencias' };
    }
    if (vs.length === 1 && vs[0].s > 0 && vs[0].n.t === '^' && vs[0].n.a.t === 'fn' && vs[0].n.a.f === 'tan' && E.valor(vs[0].n.b, 0) === 2) {
      ps.push('$tg^{2} u = {1}/{cos^{2} u} − 1$');
      const a = prim(op('-', div(N(1), pot(fn('cos', vs[0].n.a.a), 2)), N(1)), ps, prof + 1); if (a) return a;
    }
    const nota = (txt, F, det) => { ps.push(`$∫ ${T(n)} dx = ${T(F)}$ &ensp; (${txt})${det ? `<br>${det}` : ''}`); return F; };
    if (vs.length === 1) {
      const t = tipo(vs[0].n, vs[0].s);
      if (t.k === 'asen') { const F = prod(N(1 / Math.sqrt(t.q)), fn('arcsin', prod(N(Math.sqrt(t.q / t.p)), X))); return { F: nota('$∫ {dx}/{√(a^{2} − b^{2}x^{2})} = {1}/{b} arcsin {b x}/{a}$', F), como: 'tabla' }; }
      const L = t.u && lineal(t.u), Ft = L && tabla(t);
      if (Ft) {
        const dW = { ln: '{1}/{w}', arctg: '{1}/{1 + w^{2}}', arcsen: '{1}/{√(1 − w^{2})}' }[t.k], dp = dW ? `Par parties (en $w = ${T(t.u)}$) : $u = ${t.k} w$ ⟹ $du = ${dW} dw$ et $dv = dw$ ⟹ $v = w$.<br>$∫ ${t.k} w dw = w ${t.k} w − ∫ w · ${dW} dw$, et l’intégrale restante est du tableau ou par substitution.` : '';
        return { F: nota(`tableau, ${Math.abs(L.a - 1) < 1e-12 ? `$${nomT(t)}$` : `$${nomT(t)}$ avec $u = ${T(t.u)}$, $du = ${E.numTxt(L.a)} dx$`}`, div(Ft, N(L.a)), dp), como: 'tabla' };
      }
    }
    for (let i = 0; i < vs.length; i++) {
      const q = vs[i].n, base = q.t === '^' && !tx(q.b) ? { k: 'pot', e: E.valor(q.b, 0) * vs[i].s, u: q.a } : null;
      const radic = q.t === 'fn' && (q.f === 'sqrt' || q.f === 'cbrt') ? { k: 'pot', e: (q.f === 'sqrt' ? 0.5 : 1 / 3) * vs[i].s, u: q.a } : null;
      for (const t of [tipo(q, vs[i].s), { k: 'pot', e: vs[i].s, u: q }, base, radic].filter(Boolean)) {
        if (!t.u || t.k === 'otra' || t.k === 'asen' || t.u.t === 'x' || !tx(t.u)) continue;
        const Ft = tabla(t); if (!Ft) continue;
        const resto = junta(vs.filter((_, j) => j !== i)), du = D(t.u);
        const c = cociente(resto, du);
        if (c !== null && Math.abs(c) > 1e-12) { const Fc = prod(N(c), Ft);
        const det = `1) On choisit $u = ${T(t.u)}$.<br>2) On dérive : $du = ${T(du)} dx$, et le reste de l’intégrande est $${E.numTxt(c)} · du/dx$, donc $∫ f(x) dx = ${E.numTxt(c)} ∫ h(u) du$ avec $h(u)$ la fonction du tableau.<br>3) On intègre en $u$ avec la règle du tableau : $${nomT(t)}$.<br>4) On revient à la variable initiale ($u = ${T(t.u)}$) et on obtient $${T(Fc)}$.`;
        return { F: nota(`changement de variable $u = ${T(t.u)}$, $du = ${T(du)} dx$, et $${nomT(t)}$`, Fc, det), como: 'changement de variable' }; }
      }
    }
    if (vs.length === 1 && vs[0].s > 0 && vs[0].n.t === '^' && vs[0].n.a.t === 'fn' && ['sin', 'cos'].includes(vs[0].n.a.f) && !tx(vs[0].n.b)) {
      const e = E.valor(vs[0].n.b, 0), m = (e - 1) / 2;
      if (Number.isInteger(m) && m >= 1 && m <= 4) {
        const u = vs[0].n.a.a, sf = vs[0].n.a.f, of = sf === 'sin' ? 'cos' : 'sin';
        let suma = null, bin = 1;
        for (let k = 0; k <= m; k++) { if (k) bin = (bin * (m - k + 1)) / k; const t = prod(N(bin * (-1) ** k), prod(fn(sf, u), op('^', fn(of, u), N(2 * k)))); suma = suma ? op('+', suma, t) : t; }
        ps.push(`$${sf}^{${e}} u = ${sf} u (1 − ${of}^{2} u)^{${m}}$, et on pose $t = ${of} u$`);
        const a = prim(suma, ps, prof + 1); if (a) return { F: a.F, como: 'trigonométrique' };
      }
    }
    const P = poli(n);
    if (P) { const F = poliAst(P.map((c, i) => (i ? c : c)).reduce((acc, c, i) => { acc[i + 1] = c / (i + 1); return acc; }, [0])); return { F: nota('puissances : $∫ x^{n} dx = {x^{n + 1}}/{n + 1}$', F), como: 'potencias' }; }
    const R = racional(n, nota);
    if (R) return { F: R, como: 'racional' };
    if (vs.length === 1 && vs[0].s > 0 && vs[0].n.t === '^' && vs[0].n.a.t === 'fn' && ['sin', 'cos'].includes(vs[0].n.a.f) && E.valor(vs[0].n.b, 0) === 2) {
      const u = vs[0].n.a.a, s = vs[0].n.a.f === 'sin' ? -1 : 1, id = op(s < 0 ? '-' : '+', N(0.5), prod(N(0.5), fn('cos', prod(N(2), u))));
      ps.push(`$${vs[0].n.a.f}^{2} u = {1 ${s < 0 ? '−' : '+'} cos 2u}/{2}$ (angle double)`);
      const a = prim(id, ps, prof + 1); if (a) return { F: a.F, como: 'trigonométrique' };
    }
    if (vs.length === 2 && vs.every((q) => q.s > 0 && q.n.t === 'fn') && new Set(vs.map((q) => q.n.f)).size === 2 && vs.every((q) => ['sin', 'cos'].includes(q.n.f)) && E.texto(vs[0].n.a) === E.texto(vs[1].n.a)) {
    }
    if (vs.length === 2 && vs.every((q) => q.s > 0 && q.n.t === 'fn' && ['sin', 'cos'].includes(q.n.f) && lineal(q.n.a))) {
      const [p, q] = Math.abs(lineal(vs[0].n.a).a) >= Math.abs(lineal(vs[1].n.a).a) ? [vs[0].n, vs[1].n] : [vs[1].n, vs[0].n], A = p.a, B = q.a, sum = E.simp(op('+', A, B)), dif = E.simp(op('-', A, B));
      const m = (f1, u, k) => prod(N(k), fn(f1, u));
      let id = null, txt = '';
      if (p.f === 'sin' && q.f === 'cos') { id = op('+', m('sin', sum, 0.5), m('sin', dif, 0.5)); txt = 'sin A cos B = {1}/{2} [sin(A + B) + sin(A − B)]'; }
      else if (p.f === 'cos' && q.f === 'sin') { id = op('-', m('sin', sum, 0.5), m('sin', dif, 0.5)); txt = 'cos A sin B = {1}/{2} [sin(A + B) − sin(A − B)]'; }
      else if (p.f === 'cos') { id = op('+', m('cos', dif, 0.5), m('cos', sum, 0.5)); txt = 'cos A cos B = {1}/{2} [cos(A − B) + cos(A + B)]'; }
      else { id = op('-', m('cos', dif, 0.5), m('cos', sum, 0.5)); txt = 'sin A sin B = {1}/{2} [cos(A − B) − cos(A + B)]'; }
      if (!lineal(dif) && E.valor(dif, 0) === 0 && E.valor(dif, 1) === 0) id = null;
      if (id) { ps.push(`$${txt}$, con $A = ${T(A)}$ y $B = ${T(B)}$`); const a = prim(id, ps, prof + 1); if (a) return { F: a.F, como: 'trigonométrique' }; }
    }
    if (vs.length === 1 && vs[0].n.t === 'fn' && vs[0].n.f === 'sqrt') {
      const P = poli(vs[0].n.a);
      if (P && P.length === 3 && Math.abs(P[1]) < 1e-12 && P[0] !== 0) {
        const c = P[0], q = P[2], r = vs[0].n, b = Math.sqrt(Math.abs(q));
        let F = null, txt = '';
        if (vs[0].s > 0 && q < 0 && c > 0) { F = op('+', prod(div(X, N(2)), r), prod(N(c / (2 * b)), fn('arcsin', prod(N(b / Math.sqrt(c)), X)))); txt = `changement trigonométrique $x = ${E.numTxt(Math.sqrt(c) / b)} sin t$, $√(a^{2} − x^{2}) = a cos t$, et $∫ cos^{2} t dt$ par l’angle double`; }
        else if (vs[0].s > 0 && q > 0) { F = op('+', prod(div(X, N(2)), r), prod(N(c / (2 * b)), ln(abs(op('+', prod(N(b), X), r))))); txt = `changement $x = ${E.numTxt(Math.sqrt(Math.abs(c)) / b)} ${c > 0 ? 'senh' : 'cosh'} t$ (ou $x = a ${c > 0 ? 'tg' : 'sec'} t$) : $∫ √(x^{2} ${c > 0 ? '+' : '−'} a^{2}) dx = {x}/{2} √(x^{2} ${c > 0 ? '+' : '−'} a^{2}) ${c > 0 ? '+' : '−'} {a^{2}}/{2} ln |x + √(x^{2} ${c > 0 ? '+' : '−'} a^{2})|$`; }
        else if (vs[0].s < 0 && q > 0) { F = prod(N(1 / b), ln(abs(op('+', prod(N(b), X), r)))); txt = `changement $x = ${E.numTxt(Math.sqrt(Math.abs(c)) / b)} ${c > 0 ? 'senh' : 'cosh'} t$ : $∫ {dx}/{√(x^{2} ${c > 0 ? '+' : '−'} a^{2})} = ln |x + √(x^{2} ${c > 0 ? '+' : '−'} a^{2})|$`; }
        if (F) return { F: nota(txt, F), como: 'changement trigonométrique' };
      }
    }
    if (vs.length >= 2) {
      const ip = vs.findIndex((q) => q.s > 0 && (() => { const t = tipo(q.n); return ['exp', 'sin', 'cos', 'sinh', 'cosh'].includes(t.k) && lineal(t.u); })());
      if (ip >= 0) {
        const Pp = poli(junta(vs.filter((_, j) => j !== ip)));
        const t = tipo(vs[ip].n), L = lineal(t.u);
        if (Pp && Pp.length > 1) {
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
          const det = `Méthode du tableau : on dérive $u = ${T(poliAst(Pp))}$ jusqu’à arriver à 0 et on intègre $dv = ${T(vs[ip].n)} dx$ à chaque fois, en alternant les signes (+, −, +…) et en multipliant en diagonale :<br>${filas.map((fl, i) => `${i % 2 ? '−' : '+'} ${fl}`).join('<br>')}`;
          return { F: nota(`par parties ${k} ${k === 1 ? 'fois' : 'fois'} : $∫ u dv = u v − ∫ v du$ avec $u = ${T(poliAst(Pp))}$ et $dv = ${T(vs[ip].n)} dx$`, F, det), como: 'partes' };
        }
        const otro = vs.length === 2 ? tipo(vs[1 - ip].n) : null;
        if (otro && vs[1 - ip].s > 0 && ((t.k === 'exp' && ['sin', 'cos'].includes(otro.k)) || (otro.k === 'exp' && ['sin', 'cos'].includes(t.k)))) {
          const ex = t.k === 'exp' ? t : otro, tr = t.k === 'exp' ? otro : t, A = lineal(ex.u), B = lineal(tr.u);
          if (A && B) {
            const a = A.a, b = B.a, k2 = a * a + b * b, e = op('^', C('e'), ex.u), s = fn('sin', tr.u), c = fn('cos', tr.u);
            const F = tr.k === 'sin' ? prod(div(e, N(k2)), op('-', prod(N(a), s), prod(N(b), c))) : prod(div(e, N(k2)), op('+', prod(N(a), c), prod(N(b), s)));
            const det = `Soit $I = ∫ ${T(n)} dx$. On intègre par parties deux fois, en choisissant à chaque fois le même type de fonction comme $u$ :<br>1) $u = ${T(fn(tr.k, tr.u))}$ et $dv = ${T(op('^', C('e'), ex.u))} dx$, et il reste une autre intégrale avec la fonction trigonométrique échangée.<br>2) On répète le processus et dans le second membre $I$ réapparaît, multipliée par $−${E.numTxt(b * b / (a * a))}$.<br>3) On passe au premier membre : $I (1 + ${E.numTxt(b * b / (a * a))}) = $ le reste, et en isolant on obtient $I = ${T(F)}$.`;
            return { F: nota('par parties deux fois : l’intégrale du début réapparaît et on la résout', F, det), como: 'partes' };
          }
        }
      }
      const il = vs.findIndex((q) => q.s > 0 && q.n.t === 'fn' && ['ln', 'arctan', 'arcsin'].includes(q.n.f));
      if (il >= 0) {
        const dv = junta(vs.filter((_, j) => j !== il)), V = prim(dv, [], prof + 2);
        if (V) {
          const Q = E.simp(V.F), g = vs[il].n;
          const resto = prim(prod(Q, D(g)), ps, prof + 1);
          if (resto) {
            const det = `$u = ${T(g)}$ ⟹ $du = ${T(D(g))} dx$<br>$dv = ${T(dv)} dx$ ⟹ $v = ${T(Q)}$<br>$∫ u dv = u v − ∫ v du = ${T(prod(Q, g))} − ∫ ${T(prod(Q, D(g)))} dx$, et cette intégrale vaut $${T(resto.F)}$.`;
            return { F: nota(`par parties : $u = ${T(g)}$, $dv = ${T(dv)} dx$, donc $v = ${T(Q)}$`, op('-', prod(Q, g), resto.F), det), como: 'partes' };
          }
        }
      }
    }
    if (vs.length === 1 && vs[0].s > 0 && /ln|arc/.test(E.texto(n)) && prof < 4) {
      const resto = prim(prod(X, D(n)), ps, prof + 2);
      if (resto) {
        const det = `$u = ${T(n)}$ ⟹ $du = ${T(D(n))} dx$<br>$dv = dx$ ⟹ $v = x$<br>$∫ u dv = u v − ∫ v du = ${T(prod(X, n))} − ∫ ${T(prod(X, D(n)))} dx$, et cette intégrale vaut $${T(resto.F)}$.`;
        return { F: nota(`par parties : $u = ${T(n)}$, $dv = dx$, donc $v = x$`, op('-', prod(X, n), resto.F), det), como: 'partes' };
      }
    }
    if (n.t === '/') { const c = cociente(n.a, D(n.b)); if (c !== null) return { F: nota('$∫ {u′}/{u} dx = ln |u|$', prod(N(c), ln(abs(n.b)))), como: 'logaritmo' }; }
    return primExtra(n, vs, nota, prof);
  }
  const mapa = (n, g) => { const r = g(n); if (r) return r; if (n.a === undefined && n.b === undefined) return n; return { ...n, ...(n.a ? { a: mapa(n.a, g) } : {}), ...(n.b ? { b: mapa(n.b, g) } : {}) }; };
  const esXn = (m) => m.t === 'x' && !m.n;
  const pMul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const pPot = (a, k) => { let r = [1]; for (let i = 0; i < k; i++) r = pMul(r, a); return r; };
  const pInt = (a) => [0, ...a.map((c, i) => c / (i + 1))];
  const pDer = (a) => (a.length > 1 ? a.slice(1).map((c, i) => c * (i + 1)) : [0]);
  const pSum = (a, b) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0));
  const pQuita = (a) => { const r = a.map((c) => (Math.abs(c) < 1e-9 ? 0 : c)); while (r.length > 1 && r[r.length - 1] === 0) r.pop(); return r; };
  function pDiv(n, d) {
    n = pQuita(n); d = pQuita(d);
    if (n.length < d.length) return [[0], n];
    const q = new Array(n.length - d.length + 1).fill(0), r = n.slice();
    for (let i = n.length - d.length; i >= 0; i--) { const c = r[i + d.length - 1] / d[d.length - 1]; q[i] = c; for (let j = 0; j < d.length; j++) r[i + j] -= c * d[j]; }
    return [q, pQuita(r.slice(0, Math.max(1, d.length - 1)))];
  }
  function pMcd(a, b) {
    a = pQuita(a); b = pQuita(b);
    while (!(b.length === 1 && b[0] === 0)) { const r = pDiv(a, b)[1]; a = b; b = r; }
    return a.map((c) => c / a[a.length - 1]);
  }
  function resuelve(M, b) {
    const n = b.length, A = M.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-10) return null;
      [A[c], A[p]] = [A[p], A[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const k = A[r][c] / A[c][c]; for (let j = c; j <= n; j++) A[r][j] -= k * A[c][j]; }
    }
    return A.map((r, i) => r[n] / r[i]);
  }
  const redondeo = (c) => { const fr = E.fraccion(c, 2000); if (fr && Math.abs(fr[0] / fr[1] - c) < 1e-9 * Math.max(1, Math.abs(c))) return fr[0] / fr[1]; const r = Math.round(c * 1e9) / 1e9; return Math.abs(r) < 1e-12 ? 0 : r; };
  const polX = (c) => poliAst(c.map(redondeo)); // polinomio como árbol en x
  const sustX = (n, por) => mapa(n, (m) => (esXn(m) ? por : null));

  function polPotencia(vs, prof) {
    const ip = vs.findIndex((q) => { const t = tipo(q.n, q.s); return t.k === 'pot' && t.u.t === 'x' && !Number.isInteger(t.e); });
    if (ip < 0) return null;
    const e = tipo(vs[ip].n, vs[ip].s).e, P = poli(junta(vs.filter((_, j) => j !== ip)));
    if (!P || P.length < 2) return null;
    const trozos = P.map((c, i) => (Math.abs(c) < 1e-14 ? null : prod(N(c), op('^', X, N(i + e))))).filter(Boolean);
    const suma = trozos.reduce((a, b) => op('+', a, b));
    const r = prim(suma, [], prof + 1);
    return r && { F: r.F, txt: `on répartit le polynôme entre les puissances de $x$ : $${T(suma)}$` };
  }

  function sustRadical(n, prof) {
    const cand = [];
    const busca = (m) => {
      if (!m || typeof m !== 'object') return;
      let arg = null;
      if (m.t === 'fn' && (m.f === 'sqrt' || m.f === 'cbrt')) arg = m.a;
      else if (m.t === '^' && !tx(m.b)) { const e = E.valor(m.b, 0); if (!Number.isInteger(e)) arg = m.a; }
      if (arg) { const L = lineal(arg); if (L && !(Math.abs(L.a - 1) < 1e-12 && Math.abs(L.b) < 1e-12)) cand.push({ arg, L }); }
      busca(m.a); busca(m.b);
    };
    busca(n);
    for (const { arg, L } of cand) {
      const txt = E.texto(arg), nuevo = mapa(n, (m) => (E.texto(m) === txt ? X : esXn(m) ? op('/', op('-', X, N(L.b)), N(L.a)) : null));
      const g = E.simp(prod(N(1 / L.a), nuevo)), r = prim(g, [], prof + 1);
      if (r) return { F: sustX(r.F, arg), txt: `changement de variable $u = ${T(arg)}$, $x = ${T(op('/', op('-', X, N(L.b)), N(L.a)))}$ (en $u$) et $dx = ${E.numTxt(1 / L.a)} du$ : on obtient $∫ ${T(g)} du$` };
    }
    return null;
  }

  function sustRaizX(n, prof) {
    const dens = []; let ok = true;
    const busca = (m) => {
      if (!m || typeof m !== 'object' || !ok) return;
      if (m.t === 'fn' && (m.f === 'sqrt' || m.f === 'cbrt')) { if (esXn(m.a)) dens.push(m.f === 'sqrt' ? 2 : 3); else if (tx(m.a)) ok = false; return; }
      if (m.t === '^' && !tx(m.b) && esXn(m.a)) { const e = E.valor(m.b, 0); if (!Number.isInteger(e)) { const fr = E.fraccion(e, 12); if (fr) dens.push(fr[1]); else ok = false; } return; }
      if (m.t === '^' && !tx(m.b) && !Number.isInteger(E.valor(m.b, 0)) && tx(m.a)) { ok = false; return; }
      busca(m.a); busca(m.b);
    };
    busca(n);
    if (!ok || !dens.length) return null;
    const k = dens.reduce((a, b) => (a * b) / mcd(a, b), 1);
    if (k < 2 || k > 12) return null;
    const por = (e) => op('^', X, N(e * k));
    const sub = mapa(n, (m) => {
      if (m.t === 'fn' && m.f === 'sqrt' && esXn(m.a)) return por(0.5);
      if (m.t === 'fn' && m.f === 'cbrt' && esXn(m.a)) return por(1 / 3);
      if (m.t === '^' && !tx(m.b) && esXn(m.a)) return por(E.valor(m.b, 0));
      return esXn(m) ? por(1) : null;
    });
    const g = E.simp(prod(prod(N(k), op('^', X, N(k - 1))), sub)), r = prim(g, [], prof + 1);
    if (!r) return null;
    const raiz = k === 2 ? fn('sqrt', X) : k === 3 ? fn('cbrt', X) : op('^', X, N(1 / k));
    return { F: sustX(r.F, raiz), txt: `changement de variable $x = u^{${k}}$, $dx = ${k} u^{${k - 1}} du$ : on obtient $∫ ${T(g)} du$, avec $u = ${T(raiz)}$` };
  }

  function trigPotencias(vs, prof) {
    if (!vs.length || vs.length > 2 || vs.some((q) => q.s < 0)) return null;
    let m = 0, nn = 0, arg = null;
    for (const q of vs) {
      const b = q.n.t === '^' ? q.n.a : q.n, e = q.n.t === '^' ? (tx(q.n.b) ? NaN : E.valor(q.n.b, 0)) : 1;
      if (!(b.t === 'fn' && (b.f === 'sin' || b.f === 'cos')) || !Number.isInteger(e) || e < 1) return null;
      if (arg && E.texto(b.a) !== E.texto(arg)) return null;
      arg = b.a;
      if (b.f === 'sin') m += e; else nn += e;
    }
    const L = lineal(arg);
    if (!L || m + nn < 2) return null;
    const u = T(arg);
    if (nn % 2) {
      const kk = (nn - 1) / 2, poly = pMul(pPot([0, 1], m), pPot([1, 0, -1], kk)), F = pInt(poly).map((c) => c / L.a);
      return { F: sustX(polX(F), fn('sin', arg)), txt: `$cos^{${nn}} ${u} = cos ${u} (1 − sin^{2} ${u})^{${kk}}$ et on pose $t = sin ${u}$, $dt = ${E.numTxt(L.a)} cos ${u} dx$ : on obtient $∫ ${T(polX(poly))} dt/${E.numTxt(L.a)}$` };
    }
    if (m % 2) {
      const kk = (m - 1) / 2, poly = pMul(pPot([1, 0, -1], kk), pPot([0, 1], nn)), F = pInt(poly).map((c) => -c / L.a);
      return { F: sustX(polX(F), fn('cos', arg)), txt: `$sin^{${m}} ${u} = sin ${u} (1 − cos^{2} ${u})^{${kk}}$ et on pose $t = cos ${u}$, $dt = −${E.numTxt(L.a)} sin ${u} dx$ : on obtient $−∫ ${T(polX(poly))} dt/${E.numTxt(L.a)}$` };
    }
    const poly = pMul(pPot([0.5, -0.5], m / 2), pPot([0.5, 0.5], nn / 2)), doble = fn('cos', prod(N(2), arg)), g = sustX(polX(poly), doble), r = prim(g, [], prof + 1);
    return r && { F: r.F, txt: `angle double : $sin^{2} ${u} = {1 − cos 2(${u})}/{2}$ et $cos^{2} ${u} = {1 + cos 2(${u})}/{2}$, de sorte que l’intégrande est $${T(g)}$` };
  }

  function radCuadratica(vs) {
    const ir = vs.findIndex((q) => q.n.t === 'fn' && q.n.f === 'sqrt' && (() => { const P = poli(q.n.a); return P && P.length === 3; })());
    if (ir < 0) return null;
    const Q = poli(vs[ir].n.a), resto = vs.filter((_, j) => j !== ir), P0 = resto.length ? poli(junta(resto)) : [1];
    if (!P0) return null;
    const num = vs[ir].s < 0 ? P0 : pMul(P0, Q), d = num.length - 1, Qd = pDer(Q);
    const cols = [];
    for (let i = 0; i < d; i++) { const xi = new Array(i + 1).fill(0); xi[i] = 1; cols.push(pSum(pMul(pDer(xi), Q), pMul(xi, Qd).map((c) => c / 2))); }
    cols.push([1]);
    const M = Array.from({ length: d + 1 }, (_, i) => cols.map((c) => c[i] || 0)), sol = resuelve(M, Array.from({ length: d + 1 }, (_, i) => num[i] || 0));
    if (!sol) return null;
    const Q1 = sol.slice(0, d), K = sol[d], a = Q[2], b = Q[1], c = Q[0];
    let I0 = null;
    if (Math.abs(K) > 1e-12) {
      if (a > 0) I0 = prod(N(1 / Math.sqrt(a)), ln(abs(op('+', op('+', prod(N(2 * a), X), N(b)), prod(N(2 * Math.sqrt(a)), vs[ir].n)))));
      else { const Dd = b * b - 4 * a * c; if (!(Dd > 0)) return null; I0 = prod(N(-1 / Math.sqrt(-a)), fn('arcsin', div(op('+', prod(N(2 * a), X), N(b)), N(Math.sqrt(Dd))))); }
    }
    const parte1 = Q1.some((v) => Math.abs(v) > 1e-12) ? prod(polX(Q1), vs[ir].n) : null;
    const F = parte1 && I0 ? op('+', parte1, prod(N(K), I0)) : parte1 || prod(N(K), I0);
    return { F, txt: `intégrande avec $√(${T(polX(Q))})$ : on cherche $∫ = Q_1(x) √{${T(polX(Q))}} + K ∫ {dx}/{√{${T(polX(Q))}}}$ avec $Q_1$ de degré inférieur d’une unité, en dérivant et en identifiant les coefficients${I0 ? ` ($K = ${E.numTxt(K)}$)` : ''}` };
  }

  function xPorRaiz(vs) {
    if (vs.length !== 2 || vs.some((q) => q.s > 0)) return null;
    const ix = vs.findIndex((q) => esXn(q.n)), ir = 1 - ix;
    if (ix < 0 || vs[ir].n.t !== 'fn' || vs[ir].n.f !== 'sqrt') return null;
    const P = poli(vs[ir].n.a);
    if (!P || P.length !== 3 || Math.abs(P[1]) > 1e-12) return null;
    const c = P[0], d = P[2], R = vs[ir].n;
    if (d > 0 && c < 0) return { F: prod(N(1 / Math.sqrt(-c)), fn('arccos', div(N(Math.sqrt(-c / d)), abs(X)))), txt: `avec $x = a / cos t$ (ou $u = 1/x$) : $∫ {dx}/{x √(x^{2} − a^{2})} = {1}/{a} arccos {a}/{|x|}$` };
    if (c > 0) return { F: prod(N(-1 / Math.sqrt(c)), ln(abs(div(op('+', N(Math.sqrt(c)), R), X)))), txt: `avec $u = 1/x$ : $∫ {dx}/{x √(a^{2} ± x^{2})} = −{1}/{a} ln |{a + √(a^{2} ± x^{2})}/{x}|$` };
    return null;
  }

  function expRacional(n, prof) {
    const as = []; let ok = true;
    const busca = (m) => {
      if (!m || typeof m !== 'object' || !ok) return;
      if (m.t === '^' && m.a.t === 'c' && m.a.v === 'e') { const L = lineal(m.b); if (L && Math.abs(L.b) < 1e-12) as.push(L.a); else ok = false; return; }
      if (esXn(m)) { ok = false; return; }
      busca(m.a); busca(m.b);
    };
    busca(n);
    if (!ok || !as.length) return null;
    const a0 = Math.min(...as.map(Math.abs));
    if (!as.every((a) => Math.abs(a / a0 - Math.round(a / a0)) < 1e-9)) return null;
    const sub = mapa(n, (m) => (m.t === 'x' ? null : m.t === '^' && m.a.t === 'c' && m.a.v === 'e' ? op('^', X, N(Math.round(lineal(m.b).a / a0))) : null));
    const g = E.simp(div(sub, prod(N(a0), X))), r = prim(g, [], prof + 1);
    if (!r) return null;
    return { F: sustX(r.F, op('^', C('e'), prod(N(a0), X))), txt: `changement de variable $u = e^{${E.numTxt(a0)} x}$, $du = ${E.numTxt(a0)} u dx$ : on obtient $∫ ${T(g)} du$` };
  }

  function hermite(n, prof) {
    const cambia = (m) => (m.t === 'x' ? { t: 'x', n: 's' } : m.t === 'n' || m.t === 'c' ? m : { ...m, a: m.a && cambia(m.a), b: m.b && cambia(m.b) });
    let Fr;
    try { Fr = LapR.simplifica(LapR.racional(cambia(n))); } catch (e) { return null; }
    const Qp = pQuita(Fr.d), dq = Qp.length - 1;
    if (dq < 3) return null;
    const [ent, r] = pDiv(pQuita(Fr.n), Qp), B = pMcd(Qp, pDer(Qp));
    if (B.length < 2) return null;
    const Dd = pDiv(Qp, B)[0], [H, resto] = pDiv(pMul(pDer(B), Dd), B);
    if (resto.some((c) => Math.abs(c) > 1e-7)) return null;
    const b = B.length - 1, dd = Dd.length - 1, cols = [];
    for (let i = 0; i < b; i++) { const ai = new Array(i + 1).fill(0); ai[i] = 1; cols.push(pSum(pMul(pDer(ai), Dd), pMul(ai, H).map((c) => -c))); }
    for (let i = 0; i < dd; i++) { const ci = new Array(i + 1).fill(0); ci[i] = 1; cols.push(pMul(ci, B)); }
    const M = Array.from({ length: dq }, (_, i) => cols.map((c) => c[i] || 0)), sol = resuelve(M, Array.from({ length: dq }, (_, i) => r[i] || 0));
    if (!sol) return null;
    const A = sol.slice(0, b).map(redondeo), C2 = sol.slice(b).map(redondeo);
    let F = prod(polX(A), op('^', polX(B), N(-1)));
    F = div(polX(A), polX(B));
    if (ent.some((c) => Math.abs(c) > 1e-12)) F = op('+', polX(pInt(ent)), F);
    if (C2.some((c) => Math.abs(c) > 1e-12)) {
      const rest = racional(div(polX(C2), polX(Dd)), () => {});
      if (!rest) return null;
      F = op('+', F, rest);
    }
    return { F, txt: `facteurs répétés, réduction d’Hermite : $Q = ${T(polX(Qp))}$, $B = \\text{pgcd}(Q, Q′) = ${T(polX(B))}$ et $∫ {P}/{Q} dx = {A}/{B} + ∫ {C}/{D} dx$ avec $A = ${T(polX(A))}$, $D = ${T(polX(Dd))}$ et $C = ${T(polX(C2))}$` };
  }

  function noElemental(ast) {
    const pts = [0.35, 0.8, 1.3, 1.9, 2.6, 3.1], val = (x) => E.valor(ast, x);
    const cte = (g) => { let k = null; for (const x of pts) { const a = val(x), b = g(x); if (!isFinite(a) || !isFinite(b) || Math.abs(b) < 1e-12) return false; const r = a / b; if (k === null) k = r; else if (Math.abs(r - k) > 1e-8 * Math.max(1, Math.abs(k))) return false; } return k !== null && Math.abs(k) > 1e-12; };
    const l = (x) => Math.log(Math.abs(val(x))), kq = (l(pts[2]) - l(pts[0])) / (pts[2] ** 2 - pts[0] ** 2);
    if (pts.every((x) => isFinite(l(x))) && Math.abs(kq) > 1e-6 && pts.every((x) => Math.abs(l(x) - l(pts[0]) - kq * (x * x - pts[0] * pts[0])) < 1e-8 * Math.max(1, Math.abs(l(x))))) return kq < 0 ? { f: 'erf', desc: 'la fonction d’erreur, erf(x) = (2/√π) ∫₀ˣ e^{−t²} dt' } : { f: 'erfi', desc: 'la fonction d’erreur imaginaire, erfi(x)' };
    for (const k of [1, 2, 3, 0.5, Math.PI]) {
      if (cte((x) => Math.sin(k * x) / x)) return { f: 'Si', desc: 'le sinus intégral, Si(x) = ∫₀ˣ sin t / t dt' };
      if (cte((x) => Math.cos(k * x) / x)) return { f: 'Ci', desc: 'le cosinus intégral, Ci(x) = −∫ₓ^∞ cos t / t dt' };
    }
    for (const k of [1, 2, 0.5, Math.PI / 2, Math.PI]) {
      if (cte((x) => Math.sin(k * x * x))) return { f: 'S', desc: 'l’intégrale de Fresnel, S(x) = ∫₀ˣ sin(π t²/2) dt' };
      if (cte((x) => Math.cos(k * x * x))) return { f: 'C', desc: 'l’intégrale de Fresnel, C(x) = ∫₀ˣ cos(π t²/2) dt' };
    }
    if (cte((x) => 1 / Math.log(x))) return { f: 'li', desc: 'le logarithme intégral, li(x) = ∫ dt / ln t' };
    for (const k of [1, -1, 2, -2]) if (cte((x) => Math.exp(k * x) / x)) return { f: 'Ei', desc: 'l’exponentielle intégrale, Ei(x) = ∫ eᵗ / t dt' };
    return null;
  }

  function primExtra(n, vs, nota, prof) {
    if (prof > 5) return null;
    let r;
    if ((r = polPotencia(vs, prof))) return { F: nota(r.txt, r.F), como: 'potencias' };
    if ((r = trigPotencias(vs, prof))) return { F: nota(r.txt, r.F), como: 'trigonométrique' };
    if ((r = radCuadratica(vs))) return { F: nota(r.txt, r.F), como: 'radical' };
    if ((r = xPorRaiz(vs))) return { F: nota(r.txt, r.F), como: 'radical' };
    if ((r = sustRadical(n, prof))) return { F: nota(r.txt, r.F), como: 'changement de variable' };
    if ((r = sustRaizX(n, prof))) return { F: nota(r.txt, r.F), como: 'changement de variable' };
    if ((r = expRacional(n, prof))) return { F: nota(r.txt, r.F), como: 'changement de variable' };
    if ((r = hermite(n, prof))) return { F: nota(r.txt, r.F), como: 'racional' };
    return null;
  }

  function racional(n, nota) {
    const cambia = (m) => (m.t === 'x' ? { t: 'x', n: 's' } : m.t === 'n' || m.t === 'c' ? m : { ...m, a: m.a && cambia(m.a), b: m.b && cambia(m.b) });
    let F;
    try { F = LapR.simplifica(LapR.racional(cambia(n))); } catch (e) { return null; }
    const g = (p) => p.length - 1;
    if (g(F.d) < 1) return null;
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
          let r = 1; while (r < 48 && !(Number.isInteger(+(r * al).toFixed(9)) && Number.isInteger(+(r * r * be * be).toFixed(9)))) r++;
          const m = Math.round(r * r * be * be), rq = Math.round(Math.sqrt(m)), raiz = rq * rq === m ? N(rq) : fn('sqrt', N(m));
          const ok = r < 48;
          const arg = ok ? div(poliDesc([-r * al, r]), raiz) : div(lin(al), N(be)), k = ok ? div(N((Cc + B * al) * r), raiz) : N((Cc + B * al) / be);
          add(prod(k, fn('arctan', arg)));
        }
      }
    }
    if (!out) return null;
    nota(`éléments simples : ${q.some((c) => Math.abs(c) > 1e-14) ? `partie entière $${T(poliAst(q))}$ et ` : ''}$${fr.join(' + ').replace(/\+ \{−/g, '− {')}$`, out);
    return out;
  }
  const sinAbsEn = (n, xm) => { if (!n || typeof n !== 'object') return n; if (n.t === 'fn' && n.f === 'abs') { const u = sinAbsEn(n.a, xm); return E.valor(u, xm) < 0 ? neg(u) : u; } return { ...n, a: n.a && sinAbsEn(n.a, xm), b: n.b && sinAbsEn(n.b, xm) }; };
  function trozosAbs(ast, a, b) {
    const args = [], busca = (m) => { if (!m || typeof m !== 'object') return; if (m.t === 'fn' && m.f === 'abs') args.push(m.a); busca(m.a); busca(m.b); };
    busca(ast);
    if (!args.length) return null;
    const lo = Math.min(a, b), hi = Math.max(a, b);
    if (!isFinite(lo) || !isFinite(hi)) return null;
    const cortes = [...new Set(args.flatMap((u) => raicesNum((x) => E.valor(u, x), lo, hi, 2000)))].filter((c) => c > lo + 1e-9 && c < hi - 1e-9).sort((p, q) => p - q);
    const pts = [lo, ...cortes, hi], partes = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const br = E.simp(sinAbsEn(ast, (pts[i] + pts[i + 1]) / 2)), r = (() => { try { return prim(br, []); } catch (e) { return null; } })(), F = r && E.simp(r.F);
      if (!F || !igualNum(D(F), br, 1e-6)) return null;
      const v = E.valor(F, pts[i + 1]) - E.valor(F, pts[i]);
      if (!isFinite(v)) return null;
      partes.push({ p: pts[i], q: pts[i + 1], br, F, v });
    }
    return { cortes, partes, val: (a < b ? 1 : -1) * partes.reduce((t, q) => t + q.v, 0) };
  }
  function integral(sc) {
    const ast = E.simp(E.lee(sc.f, 'f(x)', ['x']));
    const pasos = [{ t: 'Fonction', html: `$f(x) = ${T(ast)}$` }], ps = [];
    let r = null;
    try { r = prim(ast, ps); } catch (e) { r = null; }
    let F = r && E.simp(r.F);
    if (F && !igualNum(D(F), ast, 1e-6)) F = null;
    const out = { modo: 'integral', ast, f: (x) => E.valor(ast, x), pasos };
    if (F) {
      out.F = F; out.Ftxt = T(F); out.Ff = (x) => E.valor(F, x);
      if (ps.length) pasos.push({ t: ast.t === '+' || ast.t === '-' ? 'Terme à terme' : 'Méthode', html: ps.slice(-8).join('<br>') });
      pasos.push({ t: 'Primitive', html: `$∫ f(x) dx = ${out.Ftxt} + C$<br>Vérification : en dérivant on retrouve f(x).` });
    } else {
      const ne = noElemental(ast);
      pasos.push({ t: 'Primitive', html: ne ? `<b>Cette intégrale n’a pas de primitive élémentaire</b> (elle ne peut pas s’écrire avec des polynômes, des exponentielles, des logarithmes ni des fonctions trigonométriques) : elle s’exprime avec ${ne.desc}. Aucune formule n’est donnée ; si tu mets des bornes, la valeur est calculée numériquement.` : 'Je ne trouve pas de primitive avec des fonctions élémentaires (ou je ne sais pas la faire avec le tableau, le changement de variable, les parties et les éléments simples).' });
      out.noElemental = ne ? ne.f : null;
    }
    if (!vacio(sc.a) || !vacio(sc.b)) {
      const a = limiteDe(sc.a, 'la borne inférieure a'), b = limiteDe(sc.b, 'la borne supérieure b');
      if (a === b) throw new Error('Les deux bornes sont égales : l’intégrale vaut 0');
      out.a = a; out.b = b;
      const lo = Math.min(a, b), hi = Math.max(a, b), sg = a < b ? 1 : -1, g = (x) => E.valor(ast, x);
      const malo = (c, s) => isFinite(c) && (!isFinite(g(c)) || Math.abs(g(c + s * 1e-9)) > 1e7);
      const sing = singulares(ast, isFinite(lo) ? lo : Math.min(hi, 0) - 60, isFinite(hi) ? hi : Math.max(lo, 0) + 60).filter((c) => c > lo && c < hi);
      const malLo = !isFinite(lo) || malo(lo, 1), malHi = !isFinite(hi) || malo(hi, -1);
      if (malLo || malHi || sing.length) {
        const r = impropia(ast, F, lo, hi, sing, malLo, malHi, pasos);
        out.impropia = true; out.diverge = r.diverge; out.val = sg * r.val; out.sing = sing;
        if (sg < 0 && !r.diverge) pasos.push({ t: 'Bornes inversées', html: `Comme $a > b$, $∫_{a}^{b} = −∫_{b}^{a} = ${nt(out.val)}$` });
        return out;
      }
      const n = 2000, h = (b - a) / n; let s = 0, finita = true;
      for (let i = 0; i <= n; i++) { const v = E.valor(ast, a + i * h); if (!isFinite(v)) { finita = false; break; } s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * v; }
      out.num = finita ? (s * h) / 3 : NaN;
      if (!finita) throw new Error(`f(x) n’est pas finie sur tout [${f(Math.min(a, b))}, ${f(Math.max(a, b))}] : l’intégrale est impropre`);
      const nt = E.numTxt;
      const tr = F ? null : trozosAbs(ast, a, b);
      if (tr && Math.abs(tr.val - out.num) < 1e-5 * Math.max(1, Math.abs(out.num))) {
        out.val = tr.val; out.trozos = tr.partes.length;
        pasos.push({ t: 'Valeur absolue', html: `${tr.cortes.length ? `L’argument de la valeur absolue change de signe en ${tr.cortes.map((c) => `$x = ${nt(c)}$`).join(', ')}, donc on découpe l’intégrale en ${tr.partes.length} morceaux` : 'L’argument de la valeur absolue ne change pas de signe sur l’intervalle'} et sur chacun on enlève la valeur absolue avec son signe :<br>${tr.partes.map((q) => `En $[${nt(q.p)}, ${nt(q.q)}]$: $f(x) = ${T(q.br)}$, $F(x) = ${T(q.F)}$ y $F(${nt(q.q)}) − F(${nt(q.p)}) = ${nt(q.v)}$`).join('<br>')}` });
        pasos.push({ t: 'Règle de Barrow', html: `$∫_{${nt(a)}}^{${nt(b)}} f(x) dx = ${tr.partes.map((q) => nt(q.v)).join(' + ')} = ${nt(tr.val)}$${a > b ? ' (avec le signe changé car les bornes sont inversées)' : ''}` });
      } else if (F && isFinite(E.valor(F, a)) && isFinite(E.valor(F, b)) && Math.abs(E.valor(F, b) - E.valor(F, a) - out.num) < 1e-5 * Math.max(1, Math.abs(out.num))) {
        out.val = E.valor(F, b) - E.valor(F, a);
        pasos.push({ t: 'Règle de Barrow', html: `$∫_{${nt(a)}}^{${nt(b)}} f(x) dx = F(${nt(b)}) − F(${nt(a)}) = ${nt(E.valor(F, b))} − ${nt(E.valor(F, a))}`.replace('− −', '+ ') + ` = ${nt(out.val)}$${E.exacto(out.val) && !Number.isInteger(out.val) ? ` ≈ ${f(out.val, 6)}` : ''}` });
      } else {
        out.val = out.num;
        pasos.push({ t: 'Intégrale numérique', html: `Avec la méthode de Simpson et 2000 intervalles : $∫_{${nt(a)}}^{${nt(b)}} f(x) dx ≈ ${f(out.num, 7)}$` });
      }
      let ar = 0; for (let i = 0; i < n; i++) { const p = E.valor(ast, a + i * h), q = E.valor(ast, a + (i + 1) * h); ar += (Math.abs(p) + Math.abs(q)) / 2 * Math.abs(h); }
      out.area = ar;
      if (Math.abs(ar - Math.abs(out.val)) > 1e-4 * Math.max(1, ar)) pasos.push({ t: 'Aire', html: `f change de signe sur l’intervalle : l’intégrale soustrait les parties situées sous l’axe. L’aire totale délimitée est ≈ ${f(ar, 6)}.` });
    }
    return out;
  }

  function nt(v) {
    if (v === Infinity) return '∞';
    if (v === -Infinity) return '−∞';
    const x = E.exacto(v, 1000);
    if (x && x.q <= 1000) return E.numTxt(v);
    for (const k of [2, 3, 4, -1, -2, -3]) { const r = fracSencilla(v / Math.exp(k), 1e-10); if (r !== null && r !== 0 && Math.abs(r) < 100) return `${r === 1 ? '' : r === -1 ? '−' : E.numTxt(r) + ' '}e^{${k < 0 ? '−' : ''}${Math.abs(k)}}`; }
    return f(v, 6);
  }
  const INF = /^\s*([+\-−]?)\s*(∞|inf|infinito)\s*$/i;
  function limiteDe(s, nom) { const m = String(s ?? '').match(INF); if (m) return m[1] === '-' || m[1] === '−' ? -Infinity : Infinity; return num(s, nom); }
  function limNum(g, c, lado = 1, kmax) {
    if (kmax !== undefined) return limNum0(g, c, lado, kmax);
    const kd = isFinite(c) ? 10 : 12, rs = [kd, 8, 7, 6, 5].map((k) => limNum0(g, c, lado, k));
    const eq = (p, q) => p !== null && q !== null && (p === q || (isFinite(p) && isFinite(q) && Math.abs(p - q) <= 1e-6 * Math.max(1, Math.abs(p))));
    if (rs[0] !== null && (eq(rs[0], rs[1]) || eq(rs[0], rs[2]))) return rs[0];
    for (const [i, j] of [[1, 2], [1, 3], [2, 3], [3, 4]]) if (eq(rs[i], rs[j])) return rs[i];
    const dist = rs.filter((q) => q !== null).filter((q, i, a) => a.findIndex((o) => eq(o, q)) === i);
    return dist.length > 1 ? null : rs[0];
  }
  function limNum0(g, c, lado = 1, kmax = isFinite(c) ? 10 : 12) {
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
    if (Math.sign(d1) === Math.sign(d2) && Math.sign(d2) === Math.sign(d3) && r >= 0.9 && Math.abs(d2) / Math.max(1e-300, Math.abs(d1)) >= 0.9) return Math.sign(d3) * Infinity;
    if (r < 0.9 && Math.abs(d2) / Math.max(1e-300, Math.abs(d1)) < 0.95) { const L = v[3] + (d3 * r) / (1 - r); return Math.abs(L) < 1e-8 ? 0 : L; }
    return null;
  }
  function limAst(n, c, lado = 0) {
    const g = (x) => E.valor(n, x);
    if (isFinite(c)) {
      const v = g(c), cerca = (s) => g(c + s * 1e-7);
      if (isFinite(v) && (lado >= 0 ? Math.abs(cerca(1) - v) < 1e-4 * Math.max(1, Math.abs(v)) : true) && (lado <= 0 ? Math.abs(cerca(-1) - v) < 1e-4 * Math.max(1, Math.abs(v)) : true)) return v;
      if (lado) return limNum(g, c, lado);
      const a = limNum(g, c, 1), b = limNum(g, c, -1);
      const existe = (s) => [1e-3, 1e-5, 1e-7].some((e) => isFinite(g(c + s * e)));
      if (a !== null && b === null && !existe(-1)) return a;
      if (b !== null && a === null && !existe(1)) return b;
      if (a === null || b === null) return null;
      return a === b || (isFinite(a) && Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(a))) ? a : NaN;
    }
    return limNum(g, c);
  }
  function redondea(x, tol = 1e-9) {
    const r = fracSencilla(x, tol);
    return r === null ? x : r;
  }
  function fracSencilla(x, tol = 1e-9) {
    if (Math.abs(x) < 1e-11) return 0;
    for (let q = 1; q <= 64; q++) { const p = Math.round(x * q); if (Math.abs(p / q - x) < tol * Math.max(1, Math.abs(x))) return p / q; }
    return null;
  }
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
  function singulares(ast, a, b, n = 1200) {
    const g = (x) => E.valor(ast, x), out = [], h = (b - a) / n;
    const add = (x) => { const y = redondea(x, 1e-6); if (!out.some((q) => Math.abs(q - y) < 1e-6)) out.push(y); };
    const vs = Array.from({ length: n + 1 }, (_, i) => g(a + i * h));
    let picos = 0;
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      if (!isFinite(vs[i])) { add(x); continue; }
      if (picos < 80 && Math.abs(vs[i]) >= Math.abs(vs[i - 1]) && Math.abs(vs[i]) >= Math.abs(vs[i + 1]) && Math.abs(vs[i]) > Math.abs(vs[i - 1]) + Math.abs(vs[i + 1]) - Math.abs(vs[i]) + 1e-9) {
        picos++;
        let lo = x - h, hi = x + h;
        for (let k = 0; k < 100; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3, f1 = Math.abs(g(m1)), f2 = Math.abs(g(m2)); if (!isFinite(f1)) { hi = m2; lo = m1; break; } if (!isFinite(f2)) { lo = m1; hi = m2; break; } if (f1 < f2) lo = m1; else hi = m2; }
        const c = (lo + hi) / 2, A = Math.abs(g(c + 1e-9)) + Math.abs(g(c - 1e-9)), B = Math.abs(g(c + 1e-3)) + Math.abs(g(c - 1e-3));
        if (!isFinite(g(c)) || Math.abs(g(c)) > 1e8 || (A > 100 && A > 20 * B)) add(c);
      }
    }
    return out.sort((p, q) => p - q);
  }
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
      const d = (2 * r) / (Math.exp(2 * Math.abs(u)) + 1), x = u > 0 ? q - d : p + d;
      if (d <= 0) continue;
      const v = g(x); if (isFinite(v)) s += v * w;
    }
    return s * h;
  }

  const intervalo = (p, q) => `${p === -Infinity ? '(' : '['}${nt(p)}, ${nt(q)}${q === Infinity ? ')' : ']'}`;
  function impropia(ast, F, lo, hi, sing, malLo, malHi, pasos) {
    const pts = [lo, ...sing.filter((c) => c > lo && c < hi), hi], trozos = [];
    for (let i = 0; i < pts.length - 1; i++) trozos.push({ p: pts[i], q: pts[i + 1], ip: i ? true : malLo, iq: i < pts.length - 2 ? true : malHi });
    const por = [];
    if (!isFinite(lo) || !isFinite(hi)) por.push('l’intervalle n’est pas borné');
    const ss = [...(malLo && isFinite(lo) ? [lo] : []), ...sing.filter((c) => c > lo && c < hi), ...(malHi && isFinite(hi) ? [hi] : [])];
    if (ss.length) por.push(`f n’est pas bornée près de ${ss.map((c) => `$x = ${nt(c)}$`).join(', ')}`);
    const def = trozos.map(({ p, q, ip, iq }) => {
      const R = (c, s) => (c === Infinity ? 'R → ∞' : c === -Infinity ? 'R → −∞' : `ε → 0^{+}`), Rv = (c, s) => (!isFinite(c) ? 'R' : `${nt(c)} ${s} ε`);
      if (ip && iq) return `lim ∫_{${Rv(p, '+')}}^{${Rv(q, '−')}}`;
      if (iq) return `lim_{${R(q)}} ∫_{${nt(p)}}^{${Rv(q, '−')}}`;
      return `lim_{${R(p)}} ∫_{${Rv(p, '+')}}^{${nt(q)}}`;
    });
    pasos.push({ t: 'Intégrale impropre', html: `Elle est impropre parce que ${por.join(' et ')} : on la calcule comme une limite${trozos.length > 1 ? ', en découpant l’intervalle aux points problématiques' : ''}.<br>$∫_{${nt(lo)}}^{${nt(hi)}} f(x) dx = ${def.map((d) => `${d} f(x) dx`).join(' + ')}$` });
    let total = 0, diverge = null;
    const g = (x) => E.valor(ast, x);
    const lineas = [];
    for (const { p, q, ip, iq } of trozos) {
      let v = null;
      if (F) {
        const Fq = iq ? limAst(F, q, -1) : E.valor(F, q), Fp = ip ? limAst(F, p, 1) : E.valor(F, p);
        const lq = iq ? `lim_{x → ${nt(q)}${isFinite(q) ? '^{−}' : ''}} F(x)` : `F(${nt(q)})`, lp = ip ? `lim_{x → ${nt(p)}${isFinite(p) ? '^{+}' : ''}} F(x)` : `F(${nt(p)})`;
        if (Fq === null || Fp === null || Number.isNaN(Fq) || Number.isNaN(Fp)) { diverge = diverge || `sur ${intervalo(p, q)} la primitive n’a pas de limite (elle oscille)`; lineas.push(`En $${intervalo(p, q)}$: $${Fq === null || Number.isNaN(Fq) ? lq : lp}$ no existe`); continue; }
        if (!isFinite(Fq) || !isFinite(Fp)) { diverge = diverge || `$${!isFinite(Fq) ? `${lq} = ${nt(Fq)}` : `${lp} = ${nt(Fp)}`}$`; lineas.push(`En $${intervalo(p, q)}$: $${lq} = ${nt(Fq)}$, &ensp; $${lp} = ${nt(Fp)}$`); continue; }
        v = Fq - Fp;
        const nv = cuadratura(g, p, q);
        if (isFinite(nv) && Math.abs(nv - v) > 1e-5 * Math.max(1, Math.abs(v))) v = null;
        else lineas.push(`En $${intervalo(p, q)}$: $${lq} − ${lp} = ${nt(Fq)} − ${nt(Fp)}`.replace('− −', '+ ') + ` = ${nt(v)}$`);
      }
      if (v === null) {
        const v1 = cuadratura(g, p, q), v2 = cuadratura(g, p, q, 1 / 16, -1);
        if (!isFinite(v1) || Math.abs(v1 - v2) > 1e-6 * Math.max(1, Math.abs(v1))) { diverge = diverge || 'l’intégrale numérique ne se stabilise pas quand on s’approche du point problématique'; lineas.push(`Sur $${intervalo(p, q)}$ : l’intégrale numérique ne se stabilise pas : elle diverge`); continue; }
        v = v1; lineas.push(`Sur $${intervalo(p, q)}$ (numérique, quadrature double exponentielle) : $≈ ${f(v, 8)}$`);
      }
      total += v;
    }
    pasos.push({ t: 'Limites', html: `${F ? `Avec la primitive $F(x) = ${T(F)}$ :<br>` : ''}${lineas.join('<br>')}` });
    if (diverge) { pasos.push({ t: 'Résultat', html: `L’intégrale <b>diverge</b> : ${diverge}.` }); return { diverge: true, val: NaN }; }
    total = redondea(total);
    pasos.push({ t: 'Résultat', html: `L’intégrale <b>converge</b> : $∫_{${nt(lo)}}^{${nt(hi)}} f(x) dx = ${nt(total)}$${E.exacto(total) && !Number.isInteger(total) ? ` ≈ ${f(total, 6)}` : ''}` });
    return { diverge: false, val: total };
  }

  function simpson(g, a, b, n = 2000) { const h = (b - a) / n; let s = 0; for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * g(a + i * h); return (s * h) / 3; }
  function primC(n) { let r = null; try { r = prim(n, []); } catch (e) { r = null; } const F = r && E.simp(r.F); return F && igualNum(D(F), n, 1e-6) ? F : null; }
  const integra = (F, g, p, q) => { if (F) { const v = E.valor(F, q) - E.valor(F, p); if (isFinite(v) && Math.abs(v - simpson(g, p, q)) < 1e-6 * Math.max(1, Math.abs(v))) return v; } return simpson(g, p, q); };
  function limitesCorte(h, sc, nom) {
    if (!vacio(sc.a) || !vacio(sc.b)) { const a = num(sc.a, 'a'), b = num(sc.b, 'b'); if (a === b) throw new Error('Les deux bornes sont égales'); return { a: Math.min(a, b), b: Math.max(a, b), dados: true }; }
    const rs = raicesNum((x) => E.valor(h, x), -10, 10);
    if (rs.length < 2) throw new Error(`${nom} ne se coupent pas deux fois entre −10 et 10 : écris a et b`);
    return { a: rs[0], b: rs[rs.length - 1], dados: false, rs };
  }
  function area(sc) {
    const fa = E.simp(E.lee(sc.f, 'f(x)', ['x'])), ga = E.simp(vacio(sc.g) ? N(0) : E.lee(sc.g, 'g(x)', ['x'])), h = E.simp(op('-', fa, ga)), hv = (x) => E.valor(h, x);
    const { a, b, dados } = limitesCorte(h, sc, 'Les courbes');
    for (let i = 0; i <= 400; i++) if (!isFinite(hv(a + ((b - a) * i) / 400))) throw new Error(`f ou g n’existent pas sur tout [${f(a)}, ${f(b)}]`);
    const cortes = raicesNum(hv, a, b).filter((x) => x > a + 1e-9 && x < b - 1e-9), pts = [a, ...cortes, b], pasos = [];
    pasos.push({ t: 'Courbes', html: `$f(x) = ${T(fa)}$, &ensp; $g(x) = ${T(ga)}$` });
    pasos.push({ t: 'Points d’intersection', html: `$f(x) = g(x)$ &ensp;⇔&ensp; $${T(h)} = 0$${dados ? (cortes.length ? ` ; dans $[${nt(a)}, ${nt(b)}]$ elles se coupent en ${cortes.map((x) => `$x = ${nt(x)}$`).join(', ')}` : ` : elles ne se coupent pas dans $[${nt(a)}, ${nt(b)}]$`) : ` : $x = ${[a, ...cortes, b].map(nt).join('$, $x = ')}$. La région va de $x = ${nt(a)}$ à $x = ${nt(b)}$.`}` });
    const H = primC(h);
    if (H) pasos.push({ t: 'Primitive de f − g', html: `$∫ (f − g) dx = ${T(H)}$` });
    let tot = 0; const lineas = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], arriba = hv((p + q) / 2) >= 0, v = integra(H, hv, p, q);
      tot += Math.abs(v);
      lineas.push(`Sur $[${nt(p)}, ${nt(q)}]$ ${arriba ? 'f' : 'g'} est au-dessus : $∫_{${nt(p)}}^{${nt(q)}} (${arriba ? 'f − g' : 'g − f'}) dx = ${nt(Math.abs(v))}$`);
    }
    pasos.push({ t: 'Chaque morceau', html: `L’aire est l’intégrale de la courbe du haut moins celle du bas ; si elles se croisent, on découpe aux points d’intersection.<br>${lineas.join('<br>')}` });
    pasos.push({ t: 'Aire', html: `$A = ${pts.length > 2 ? `${lineas.map((_, i) => `A_{${i + 1}}`).join(' + ')} = ` : ''}${nt(tot)}$${E.exacto(tot) && !Number.isInteger(tot) ? ` ≈ ${f(tot, 6)}` : ''}` });
    return { modo: 'area', ast: fa, ga, h, a, b, cortes, val: tot, txt: nt(tot), f: (x) => E.valor(fa, x), g: (x) => E.valor(ga, x), pasos };
  }
  function volumen(sc) {
    const eje = sc.eje === 'y' ? 'y' : 'x', hayG = !vacio(sc.g) && String(sc.g).trim() !== '0';
    const fa = E.simp(E.lee(sc.f, 'f(x)', ['x'])), ga = E.simp(hayG ? E.lee(sc.g, 'g(x)', ['x']) : N(0)), h = E.simp(op('-', fa, ga));
    const { a, b, dados } = limitesCorte(h, sc, hayG ? 'Les courbes' : 'La curva y el eje x');
    if (eje === 'y' && a < -1e-12) throw new Error('Pour faire tourner autour de l’axe y, la région doit être dans x ≥ 0 (a ≥ 0)');
    const q = E.simp(eje === 'x' ? op('-', pot(fa, 2), pot(ga, 2)) : prod(X, h)), qv = (x) => E.valor(q, x), pasos = [];
    for (let i = 0; i <= 400; i++) if (!isFinite(qv(a + ((b - a) * i) / 400))) throw new Error(`f${hayG ? ' ou g' : ''} n’existe pas sur tout [${f(a)}, ${f(b)}]`);
    const cambia = raicesNum(qv, a, b).some((x) => x > a + 1e-9 && x < b - 1e-9);
    pasos.push({ t: 'Région', html: `${hayG ? `Entre $f(x) = ${T(fa)}$ et $g(x) = ${T(ga)}$` : `Sous $f(x) = ${T(fa)}$ jusqu’à l’axe x`}, de $x = ${nt(a)}$ à $x = ${nt(b)}$${dados ? '' : ' (où elles se coupent)'}, en tournant autour de l’axe ${eje}.` });
    pasos.push(eje === 'x'
      ? { t: hayG ? 'Méthode des rondelles' : 'Méthode des disques', html: `Chaque coupe perpendiculaire à l’axe x est ${hayG ? 'une rondelle de rayons f et g' : 'un disque de rayon f(x)'} : $V = π ∫_{a}^{b} ${hayG ? '(f^{2} − g^{2})' : 'f(x)^{2}'} dx$<br>En intégrant : $${T(q)}$` }
      : { t: 'Méthode des coques', html: `Chaque bande verticale à la distance x de l’axe est une coque cylindrique de rayon x et de hauteur ${hayG ? 'f − g' : 'f(x)'} : $V = 2π ∫_{a}^{b} x ${hayG ? '(f − g)' : 'f(x)'} dx$<br>En intégrant : $${T(q)}$` });
    const Q = cambia ? null : primC(q), I = cambia ? simpson((x) => Math.abs(qv(x)), a, b) : integra(Q, qv, a, b), k = eje === 'x' ? 1 : 2, V = Math.abs(k * Math.PI * I);
    const qT = q.t === '+' || q.t === '-' ? `(${T(q)})` : T(q);
    if (Q) pasos.push({ t: 'Primitive', html: `$∫ ${qT} dx = ${T(Q)}$<br>$∫_{${nt(a)}}^{${nt(b)}} ${qT} dx = ${nt(I)}$` });
    else pasos.push({ t: 'Intégrale', html: `${cambia ? 'Les deux courbes se croisent : on intègre la valeur absolue. ' : ''}Numérique (Simpson) : $∫_{${nt(a)}}^{${nt(b)}} ≈ ${f(I, 8)}$` });
    const r = E.fraccion(V / Math.PI, 1000), vT = r && Math.abs(r[0] / r[1] - V / Math.PI) < 1e-9 * Math.max(1, V) ? (r[1] === 1 ? `${r[0] === 1 ? '' : r[0] + ' '}π` : `{${r[0] === 1 ? '' : r[0] + ' '}π}/{${r[1]}}`) : nt(V);
    pasos.push({ t: 'Volume', html: `$V = ${k === 2 ? '2' : ''}π · ${nt(Math.abs(I))} = ${vT}$ ≈ ${f(V, 6)}` });
    return { modo: 'volumen', eje, ast: fa, ga, hayG, a, b, val: V, txt: vT, f: (x) => E.valor(fa, x), g: (x) => E.valor(ga, x), pasos };
  }

  const Y = { t: 'x', n: 'y' };
  const dY = (n) => E.simp(E.deriva(n, 'y')), dX = (n) => E.simp(E.deriva(n));
  const T2 = (n) => E.texto(E.simp(n));
  const val2 = (n, x, y) => E.valor(n, x, { y });
  function implicita(sc) {
    if (vacio(sc.ec)) throw new Error('Il manque l’équation');
    const lados = String(sc.ec).split('=');
    if (lados.length > 2) throw new Error('L’équation ne peut avoir qu’un seul signe =');
    const L = E.simp(E.lee(lados[0], 'L’équation', ['x', 'y'])), R = E.simp(lados.length > 1 ? E.lee(lados[1], 'L’équation', ['x', 'y']) : N(0));
    if (!E.tieneX(L, 'y') && !E.tieneX(R, 'y')) throw new Error('L’équation doit contenir y');
    const F = E.simp(op('-', L, R)), Fx = dX(F), Fy = dY(F), pasos = [];
    if (esNum(Fy) && Fy.v === 0) throw new Error('L’équation ne dépend pas de y');
    const yp = E.simp(neg(div(Fx, Fy)));
    const lado = (n) => { const a = dX(n), b = dY(n), sb = T2(b); return esNum(b) && b.v === 0 ? T2(a) : `${esNum(a) && a.v === 0 ? '' : `${T2(a)} + `}${/[+−]/.test(sb.slice(1)) ? `(${sb})` : sb} y′`.replace('+ −', '− '); };
    pasos.push({ t: 'Équation', html: `$${T2(L)} = ${T2(R)}$, con $y = y(x)$` });
    pasos.push({ t: 'Dériver par rapport à x', html: `On dérive chaque membre en considérant y comme une fonction de x : chaque fois qu’on dérive quelque chose contenant y, un $y′$ apparaît par la règle de dérivation en chaîne (par exemple, $(y^{2})′ = 2 y y′$).<br>$${lado(L)} = ${lado(R)}$` });
    pasos.push({ t: 'Isoler y′', html: `En passant tout d’un côté, $F(x, y) = ${T2(F)} = 0$ et $y′ = −{F_{x}}/{F_{y}}$, avec $F_{x} = ${T2(Fx)}$ et $F_{y} = ${T2(Fy)}$ :<br>$y′ = ${T2(yp)}$` });
    const out = { modo: 'implicita', F, Fx, Fy, yp, txt: T2(yp), Fv: (x, y) => val2(F, x, y), pasos };
    if (!vacio(sc.x0) || !vacio(sc.y0)) {
      const x0 = num(sc.x0, 'x₀'), y0 = num(sc.y0, 'y₀'), r = val2(F, x0, y0);
      if (!isFinite(r) || Math.abs(r) > 1e-6 * Math.max(1, Math.abs(val2(L, x0, y0)), Math.abs(val2(R, x0, y0)))) throw new Error(`Le point (${f(x0)}, ${f(y0)}) n’est pas sur la courbe`);
      const fx = val2(Fx, x0, y0), fy = val2(Fy, x0, y0);
      out.x0 = x0; out.y0 = y0;
      if (Math.abs(fy) < 1e-12) { out.vertical = true; out.tangente = `x = ${nt(x0)}`; pasos.push({ t: `En (${f(x0)}, ${f(y0)})`, html: `$F_{y} = 0$ : la tangente est verticale, $x = ${nt(x0)}$.` }); }
      else {
        const m = -fx / fy, b = y0 - m * x0;
        out.m = m; out.tangente = `y = ${Math.abs(m) < 1e-12 ? nt(y0) : E.texto(E.simp(op('+', op('*', N(redondea(m)), X), N(redondea(b)))))}`;
        pasos.push({ t: `En (${f(x0)}, ${f(y0)})`, html: `$y′ = ${nt(m)}$<br>Tangente : $y − y_0 = y′ (x − x_0)$ &ensp;⇒&ensp; $${out.tangente}$` });
      }
    }
    return out;
  }
  function parciales(sc) {
    const ast = E.simp(E.lee(sc.f, 'f(x, y)', ['x', 'y'])), fx = dX(ast), fy = dY(ast), fxx = dX(fx), fxy = dY(fx), fyy = dY(fy), pasos = [];
    pasos.push({ t: 'Fonction', html: `$f(x, y) = ${T2(ast)}$` });
    pasos.push({ t: 'Dérivées premières', html: `Pour $f_{x}$ on dérive en x avec y constant, et inversement pour $f_{y}$ :<br>$f_{x} = ${T2(fx)}$, &ensp; $f_{y} = ${T2(fy)}$` });
    pasos.push({ t: 'Dérivées secondes', html: `$f_{xx} = ${T2(fxx)}$, &ensp; $f_{yy} = ${T2(fyy)}$, &ensp; $f_{xy} = f_{yx} = ${T2(fxy)}$ (théorème de Schwarz)` });
    const out = { modo: 'parciales', ast, fx, fy, fxx, fxy, fyy, txt: [fx, fy, fxx, fyy, fxy].map(T2), fv: (x, y) => val2(ast, x, y), pasos };
    const clasifica = (x, y) => { const a = val2(fxx, x, y), b = val2(fxy, x, y), c = val2(fyy, x, y), Dt = a * c - b * b; return { Dt, tipo: Math.abs(Dt) < 1e-9 ? 'dudoso (D = 0)' : Dt < 0 ? 'punto de silla' : a > 0 ? 'minimum' : 'maximum' }; };
    if (!vacio(sc.x0) || !vacio(sc.y0)) {
      const x0 = num(sc.x0, 'x₀'), y0 = num(sc.y0, 'y₀'), z = val2(ast, x0, y0);
      if (!isFinite(z)) throw new Error(`f n’existe pas en (${f(x0)}, ${f(y0)})`);
      const gx = val2(fx, x0, y0), gy = val2(fy, x0, y0);
      out.punto = { x0, y0, z, gx, gy };
      pasos.push({ t: `En (${f(x0)}, ${f(y0)})`, html: `$f = ${nt(z)}$, &ensp; $∇f = (f_{x}, f_{y}) = (${nt(gx)}, ${nt(gy)})$, &ensp; $|∇f| = ${nt(Math.hypot(gx, gy))}$<br>Le gradient pointe là où f croît le plus vite. Plan tangent : $z = ${nt(z)} ${gx < 0 ? '−' : '+'} ${nt(Math.abs(gx))} (x − ${nt(x0)}) ${gy < 0 ? '−' : '+'} ${nt(Math.abs(gy))} (y − ${nt(y0)})$`.replace(/\(x − −/g, '(x + ').replace(/\(y − −/g, '(y + ') });
    }
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
    pasos.push({ t: 'Points critiques', html: out.crit.length ? `Là où $f_{x} = f_{y} = 0$ (cherchés près de l’origine). Avec la hessienne $D = f_{xx} f_{yy} − f_{xy}^{2}$ : si $D > 0$ c’est un extremum (minimum si $f_{xx} > 0$, maximum si $f_{xx} < 0$) et si $D < 0$, un point selle.<br>${out.crit.map((q) => `$(${nt(q.x)}, ${nt(q.y)})$: $D = ${nt(q.Dt)}$, ${q.tipo} (f = ${f(q.z)})`).join('<br>')}` : 'Il n’y a pas de points où $f_{x} = f_{y} = 0$ près de l’origine.' });
    return out;
  }

  function limite(sc) {
    const ast = E.simp(E.lee(sc.f, 'f(x)', ['x'])), a = limiteDe(sc.a, 'el punto a'), pasos = [];
    const g0 = (x) => E.valor(ast, x), hay = (s) => isFinite(a) && [1e-3, 1e-5, 1e-7].some((e) => isFinite(g0(a + s * e)));
    const lado = !isFinite(a) ? 0 : hay(1) && !hay(-1) ? 1 : hay(-1) && !hay(1) ? -1 : 0;
    const lv = (n) => limAst(n, a, lado);
    const inf2 = (n) => isFinite(a) && !lado && [1, -1].every((s) => { const L = limNum((x) => E.valor(n, x), a, s); return L === Infinity || L === -Infinity; });
    const cls = (L, n) => (n && Number.isNaN(L) && inf2(n) ? '∞' : L === null || Number.isNaN(L) ? '?' : !isFinite(L) ? '∞' : Math.abs(L) < 1e-10 ? '0' : 'k');
    const flecha = `x → ${nt(a)}`, lim = (s) => `lim_{${flecha}} ${s}`;
    pasos.push({ t: 'Limite', html: `$${lim(T(ast))}$` });
    const L0 = lv(ast);
    let u = null, v = null, ex = false;
    const hayLn = (n) => /ln|log|arc/.test(E.texto(n));
    const producto = (A, B) => {
      const ca = cls(lv(A), A), cb = cls(lv(B), B);
      if (!((ca === '0' && cb === '∞') || (ca === '∞' && cb === '0'))) return null;
      if (hayLn(B) && !hayLn(A)) return [B, div(N(1), A)];
      if (hayLn(A) && !hayLn(B)) return [A, div(N(1), B)];
      return ca === '∞' ? [A, div(N(1), B)] : [B, div(N(1), A)];
    };
    if (ast.t === '/' && tx(ast.b)) { u = ast.a; v = ast.b; }
    else if (ast.t === '*') { const p = producto(ast.a, ast.b); if (p) { [u, v] = p; pasos.push({ t: 'Forme 0 · ∞', html: `On passe à un quotient : $${T(ast.a)} · ${T(ast.b)} = {${T(u)}}/{${T(v)}}$` }); } }
    else if (ast.t === '^' && tx(ast.b) && tx(ast.a)) {
      const cb = lv(ast.a), ce = cls(lv(ast.b), ast.b), forma = Math.abs(cb - 1) < 1e-10 && ce === '∞' ? '1^{∞}' : cls(cb) === '0' && ce === '0' ? '0^{0}' : cls(cb) === '∞' && ce === '0' ? '∞^{0}' : null;
      if (forma) {
        const lnu = E.simp(ln(ast.a)), p = producto(ast.b, lnu) || (ast.t && null);
        if (p) { [u, v] = p; ex = true; pasos.push({ t: `Forme ${forma}`, html: `On prend le logarithme : $f = e^{ln f}$ avec $ln f = ${T(ast.b)} · ${T(lnu)} = {${T(u)}}/{${T(v)}}$, et on calcule la limite de l’exposant.` }); }
      }
    } else if ((ast.t === '-' || ast.t === '+') && cls(lv(ast.a), ast.a) === '∞' && cls(lv(ast.b), ast.b) === '∞' && ast.a.t === '/' && ast.b.t === '/') {
      u = E.simp(op(ast.t, prod(ast.a.a, ast.b.b), prod(ast.b.a, ast.a.b))); v = E.simp(prod(ast.a.b, ast.b.b));
      pasos.push({ t: 'Forme ∞ − ∞', html: `On met sur un dénominateur commun : $${T(ast)} = {${T(u)}}/{${T(v)}}$` });
    }
    let L = u ? null : L0, usado = 0;
    if (u) {
      for (let k = 0; k < 6; k++) {
        const lu = lv(u), ld = lv(v), cu = cls(lu, u), cd = cls(ld, v);
        if (!((cu === '0' && cd === '0') || (cu === '∞' && cd === '∞'))) {
          const q = cd === 'k' && cu !== '?' ? (cu === '∞' ? lu * Math.sign(ld) : lu / ld) : lv(div(u, v));
          pasos.push({ t: usado ? 'Ya no es indeterminado' : 'En substituant', html: `$${lim(`{${T(u)}}/{${T(v)}}`)} = ${cu === '∞' ? nt(lu) : nt(lu)}/${nt(ld)} = ${q === null || Number.isNaN(q) ? '?' : nt(q)}$`.replace(/= ([^$]*)\/([^$]*) =/, (m0, p, s) => `= {${p}}/{${s}} =`) });
          L = ex ? Math.exp(q) : q;
          if (ex) pasos.push({ t: 'On défait le logarithme', html: `$${lim('f')} = e^{${nt(q)}} = ${nt(L)}$` });
          break;
        }
        usado++;
        const du = E.simp(D(u)), dv = E.simp(D(v));
        pasos.push({ t: `Règle de L’Hôpital${usado > 1 ? ` (${usado}ᵉ fois)` : ''}`, html: `Elle est de la forme $${cu === '0' ? '{0}/{0}' : '{∞}/{∞}'}$ : $${lim(`{u}/{v}`)} = ${lim(`{u′}/{v′}`)}$<br>$u′ = ${T(du)}$, &ensp; $v′ = ${T(dv)}$` });
        u = pulir(du); v = pulir(dv);
        const rq = cocienteP(div(du, dv));
        if (rq) { u = rq.n; v = rq.d; pasos[pasos.length - 1].html += `<br>En simplifiant : $${esNum(v) && v.v === 1 ? `{u′}/{v′} = ${T(u)}` : `{u′}/{v′} = {${T(u)}}/{${T(v)}}`}$`; }
        if (k === 5) { const q = lv(div(u, v)); L = ex && q !== null && !Number.isNaN(q) ? Math.exp(q) : q; pasos.push({ t: 'Limite du quotient', html: `Elle reste indéterminée ; numériquement, $${lim(`{u′}/{v′}`)} = ${q === null || Number.isNaN(q) ? '?' : nt(redondea(q, 1e-8))}$${ex && q !== null && !Number.isNaN(q) ? ` et $${lim('f')} = e^{${nt(redondea(q, 1e-8))}} = ${nt(redondea(L, 1e-8))}$` : ''}` }); }
      }
    } else pasos.push({ t: L0 === null || Number.isNaN(L0) ? 'Pas de limite' : 'En substituant', html: L0 === null || Number.isNaN(L0) ? 'Les limites à gauche et à droite ne coïncident pas (ou f oscille) : la limite n’existe pas.' : `Ce n’est pas une forme indéterminée : $${lim(T(ast))} = ${nt(L0)}$` });
    if (L === null || Number.isNaN(L)) L = L0;
    if (L !== null && isFinite(L) && isFinite(a)) {
      const ext = (s) => { const v = [2, 3, 4].map((k) => g0(a + s * 10 ** -k)); if (!v.every(isFinite)) return null; const d1 = v[1] - v[0], d2 = v[2] - v[1]; if (Math.abs(d2) > 0.05 * Math.abs(d1) + 1e-13 || Math.abs(d2) > 1e-6 * Math.max(1, Math.abs(v[2]))) return null; const r = d1 ? d2 / d1 : 0; return v[2] + (d2 * r) / (1 - r); };
      const lados = lado ? [lado] : [1, -1], es = lados.map(ext);
      if (es.every((q) => q !== null) && es.every((q) => Math.abs(q - es[0]) < 1e-6 * Math.max(1, Math.abs(q))) && Math.abs(L - es[0]) > 1e-4 * Math.max(1, Math.abs(es[0]))) {
        L = es[0]; usado = usado || 0;
        pasos.push({ t: 'Vérification', html: `Avec h petit, les calculs avec les dérivées perdent des chiffres : en regardant f en des points proches de ${nt(a)} (à des distances de 10⁻², 10⁻³ et 10⁻⁴), f se stabilise en ${nt(L)}, qui est la valeur retenue.` });
      }
    }
    if (L !== null && isFinite(L)) L = redondea(L, 1e-8);
    pasos.push({ t: 'Résultat', html: L === null || Number.isNaN(L) ? 'La limite n’existe pas.' : `$${lim(T(ast))} = ${nt(L)}$` });
    return { modo: 'limite', ast, a, val: L, existe: !(L === null || Number.isNaN(L)), txt: L === null || Number.isNaN(L) ? 'no existe' : nt(L), lhopital: usado, f: (x) => E.valor(ast, x), pasos };
  }

  function cocienteP(q) {
    const cambia = (m) => (m.t === 'x' ? { t: 'x', n: 's' } : m.t === 'n' || m.t === 'c' ? m : { ...m, a: m.a && cambia(m.a), b: m.b && cambia(m.b) });
    let F;
    try { F = LapR.simplifica(LapR.racional(cambia(q))); } catch (e) { return null; }
    const k = F.d[F.d.length - 1], nn = F.n.map((c) => redondea(c / k)), dd = F.d.map((c) => redondea(c / k));
    if (F.n.length + F.d.length > 12) return null;
    return { n: poliDesc(nn), d: poliDesc(dd) };
  }

  const A_ = 10;
  function estudio(sc) {
    const ast = E.simp(E.lee(sc.f, 'f(x)', ['x'])), g = (x) => E.valor(ast, x), d1 = E.simp(D(ast)), d2 = E.simp(D(d1)), pasos = [];
    pasos.push({ t: 'Fonction', html: `$f(x) = ${T(ast)}$, &ensp; $f′(x) = ${T(pulir(d1))}$, &ensp; $f″(x) = ${T(pulir(d2))}$<br>Ce qu’il faut chercher (intersections, asymptotes, extrema) est cherché entre $x = −${A_}$ et $x = ${A_}$.` });
    const n = 4000, h = (2 * A_) / n, ok = Array.from({ length: n + 1 }, (_, i) => isFinite(g(-A_ + i * h)));
    const borde = (x1, x2) => { let lo = x1, hi = x2; const a0 = isFinite(g(lo)); for (let k = 0; k < 70; k++) { const m = (lo + hi) / 2; if (isFinite(g(m)) === a0) lo = m; else hi = m; } return redondea((lo + hi) / 2, 1e-7); };
    const tramos = [];
    for (let i = 0; i <= n; i++) {
      if (!ok[i]) continue;
      let j = i; while (j < n && ok[j + 1]) j++;
      tramos.push({ l: i === 0 ? -Infinity : borde(-A_ + (i - 1) * h, -A_ + i * h), r: j === n ? Infinity : borde(-A_ + (j + 1) * h, -A_ + j * h) });
      i = j;
    }
    if (!tramos.length) throw new Error('f n’existe en aucun point entre −10 et 10');
    for (const c of singulares(ast, -A_, A_)) { const t = tramos.find((q) => q.l < c && c < q.r); if (t) { tramos.push({ l: c, r: t.r }); t.r = c; } }
    tramos.sort((p, q) => p.l - q.l);
    const cerrado = (x) => isFinite(x) && isFinite(g(x));
    const tTxt = (t) => `${cerrado(t.l) ? '[' : '('}${nt(t.l)}, ${nt(t.r)}${cerrado(t.r) ? ']' : ')'}`;
    const quitados = tramos.slice(1).filter((t, i) => t.l === tramos[i].r).map((t) => t.l);
    const dom = tramos.length === 1 && tramos[0].l === -Infinity && tramos[0].r === Infinity ? 'ℝ'
      : tramos[0].l === -Infinity && tramos[tramos.length - 1].r === Infinity && quitados.length === tramos.length - 1 ? `ℝ − \\{${quitados.map(nt).join(', ')}\\}` : tramos.map(tTxt).join(' ∪ ');
    pasos.push({ t: 'Domaine', html: `$"Dom" f = ${dom}$` });
    const par = PRUEBA.filter((x) => isFinite(g(x)) && isFinite(g(-x))), esPar = par.length >= 3 && par.every((x) => Math.abs(g(-x) - g(x)) < 1e-9 * Math.max(1, Math.abs(g(x)))), esImpar = !esPar && par.length >= 3 && par.every((x) => Math.abs(g(-x) + g(x)) < 1e-9 * Math.max(1, Math.abs(g(x))));
    const sim = esPar ? 'paire : $f(−x) = f(x)$, symétrique par rapport à l’axe y' : esImpar ? 'impaire : $f(−x) = −f(x)$, symétrique par rapport à l’origine' : 'ni paire ni impaire';
    pasos.push({ t: 'Symétrie', html: `Es ${sim}.` });
    const clip = (t) => [Math.max(t.l, -A_), Math.min(t.r, A_)];
    const cortesX = tramos.flatMap((t) => { const [l, r] = clip(t); return raicesNum(g, l + 1e-9, r - 1e-9, 1500); });
    const y0 = cerrado(0) ? g(0) : null;
    pasos.push({ t: 'Intersections avec les axes', html: `Axe x ($f = 0$) : ${cortesX.length ? cortesX.map((x) => `$(${nt(x)}, 0)$`).join(', ') : 'elle ne le coupe pas'}.<br>Axe y : ${y0 === null ? '$x = 0$ n’est pas dans le domaine' : `$(0, ${nt(y0)})$`}.` });
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
    const hTxt = asH.length === 2 && asH[0].y === asH[1].y ? [`$y = ${nt(asH[0].y)}$ (des deux côtés)`] : asH.map((q) => `$y = ${nt(q.y)}$ (cuando $${lado(q.s)}$)`);
    const oTxt = asO.length === 2 && asO[0].m === asO[1].m && asO[0].n === asO[1].n ? [`$y = ${recta(asO[0].m, asO[0].n)}$ (des deux côtés)`] : asO.map((q) => `$y = ${recta(q.m, q.n)}$ (cuando $${lado(q.s)}$)`);
    pasos.push({ t: 'Asymptotes', html: `Verticales : ${vert.length ? vert.map((c) => `$x = ${nt(c)}$`).join(', ') : 'aucune'}.<br>Horizontales : ${hTxt.length ? hTxt.join(', ') : 'aucune'}.${oTxt.length ? `<br>Obliques ($m = lim f/x$, $n = lim (f − m x)$) : ${oTxt.join(', ')}.` : ''}` });
    const argsAbs = [], buscaAbs = (n) => { if (!n || typeof n !== 'object') return; if (n.t === 'fn' && n.f === 'abs') argsAbs.push(n.a); buscaAbs(n.a); buscaAbs(n.b); };
    buscaAbs(ast);
    const quiebros = [...new Set(argsAbs.flatMap((u) => raicesNum((x) => E.valor(u, x), -A_, A_, 1500)))].sort((a, b) => a - b);
    const sinAbs = (n, xm) => { if (!n || typeof n !== 'object') return n; if (n.t === 'fn' && n.f === 'abs') { const u = sinAbs(n.a, xm); return E.valor(u, xm) < 0 ? neg(u) : u; } return { ...n, a: n.a && sinAbs(n.a, xm), b: n.b && sinAbs(n.b, xm) }; };
    const cotas = [-A_ - 1, ...quiebros, A_ + 1], ramas = quiebros.length ? cotas.slice(0, -1).map((a, i) => { const q = sinAbs(ast, (a + cotas[i + 1]) / 2), e1 = E.simp(D(q)); return { d1: e1, d2: E.simp(D(e1)) }; }) : null;
    const rama = (x) => quiebros.filter((c) => c <= x).length;
    const v1 = ramas ? (x) => E.valor(ramas[rama(x)].d1, x) : (x) => E.valor(d1, x), v2 = ramas ? (x) => E.valor(ramas[rama(x)].d2, x) : (x) => E.valor(d2, x);
    const eps = 1e-6, picos = quiebros.filter((c) => Math.abs(v1(c - eps) - v1(c + eps)) > 1e-4);
    const signos = (dv) => {
      const out = [];
      for (const t of tramos) {
        const [l, r] = clip(t), qs = quiebros.filter((c) => c > t.l && c < t.r), rs = raicesNum(dv, l + 1e-9, r - 1e-9, 1500).filter((x) => !qs.some((c) => Math.abs(c - x) < 1e-6)), pts = [t.l, ...[...rs, ...qs].sort((a, b) => a - b), t.r];
        for (let i = 0; i < pts.length - 1; i++) {
          const p = pts[i], q = pts[i + 1], m = !isFinite(p) && !isFinite(q) ? 0 : !isFinite(p) ? q - 1 : !isFinite(q) ? p + 1 : (p + q) / 2;
          const s = Math.sign(dv(m)), ant = out[out.length - 1];
          if (ant && ant.cierra !== null && ant.s === s && !picos.includes(ant.cierra)) { ant.q = q; ant.cierra = i < pts.length - 2 ? q : null; continue; }
          out.push({ p, q, s, cierra: i < pts.length - 2 ? q : null });
        }
      }
      return out;
    };
    const iTxt = (p, q) => `(${nt(p)}, ${nt(q)})`;
    const S1 = signos(v1), crece = S1.filter((q) => q.s > 0).map((q) => iTxt(q.p, q.q)), decrece = S1.filter((q) => q.s < 0).map((q) => iTxt(q.p, q.q));
    const extremos = [];
    for (let i = 0; i < S1.length - 1; i++) if (S1[i].cierra !== null && S1[i].s && S1[i + 1].s && S1[i].s !== S1[i + 1].s) { const x = S1[i].cierra; extremos.push({ x, y: g(x), tipo: S1[i].s > 0 ? 'maximum' : 'minimum' }); }
    const S2 = signos(v2), arriba = S2.filter((q) => q.s > 0).map((q) => iTxt(q.p, q.q)), abajo = S2.filter((q) => q.s < 0).map((q) => iTxt(q.p, q.q)), infl = [];
    for (let i = 0; i < S2.length - 1; i++) if (S2[i].cierra !== null && S2[i].s && S2[i + 1].s && S2[i].s !== S2[i + 1].s && !picos.includes(S2[i].cierra)) { const x = S2[i].cierra; infl.push({ x, y: g(x) }); }
    pasos.push({ t: 'Monotonie et extrema', html: `D’après le signe de $f′$ : croissante sur $${crece.join(' ∪ ') || '∅'}$ et décroissante sur $${decrece.join(' ∪ ') || '∅'}$.<br>${extremos.length ? extremos.map((q) => `${q.tipo === 'máximo' ? 'Maximum' : 'Minimum'} relatif en $(${nt(q.x)}, ${nt(q.y)})$`).join('<br>') : 'Elle n’a ni maxima ni minima relatifs.'}${picos.length ? `<br>À cause de la valeur absolue, $f$ n’est pas dérivable en ${picos.map((c) => `$x = ${nt(c)}$`).join(', ')} (il y a un point anguleux) : là on compare le signe de $f′$ de chaque côté.` : ''}` });
    const rectas = S2.filter((q) => q.s === 0 && q.p !== q.q).map((q) => iTxt(q.p, q.q));
    pasos.push({ t: 'Courbure et inflexion', html: `D’après le signe de $f″$ : convexe ($∪$, $f″ > 0$) sur $${arriba.join(' ∪ ') || '∅'}$ et concave ($∩$, $f″ < 0$) sur $${abajo.join(' ∪ ') || '∅'}$.${rectas.length ? ` C’est une droite ($f″ = 0$) sur $${rectas.join(' ∪ ')}$.` : ''}<br>${infl.length ? infl.map((q) => `Point d’inflexion en $(${nt(q.x)}, ${nt(q.y)})$`).join('<br>') : 'Elle n’a pas de points d’inflexion.'}` });
    const asTxt = [...vert.map((c) => `x = ${nt(c)}`), ...(asH.length === 2 && asH[0].y === asH[1].y ? [`y = ${nt(asH[0].y)}`] : asH.map((q) => `y = ${nt(q.y)}`)), ...(asO.length === 2 && asO[0].m === asO[1].m && asO[0].n === asO[1].n ? [`y = ${recta(asO[0].m, asO[0].n)}`] : asO.map((q) => `y = ${recta(q.m, q.n)}`))];
    return { modo: 'estudio', ast, d1, d2, dom, tramos, asTxt, par: esPar, impar: esImpar, cortesX, y0, asV: vert, asH, asO, extremos, infl, crece, decrece, convexa: arriba, concava: abajo, f: (x) => g(x), d: (k) => (x) => E.valor(k === 1 ? d1 : d2, x), txt: dom, pasos };
  }

  const MODOS = { derivada, integral, limite, implicita, parciales, estudio, area, volumen };
  function resolver(sc) { return (MODOS[sc.modo] || derivada)(sc); }
  const ejemplos = [
    { clave: 'producto', nombre: 'Produit : x² sin x', sc: { modo: 'derivada', f: 'x^2 sen(x)', orden: '1', x0: '' } },
    { clave: 'cociente', nombre: 'Quotient : (x² + 1)/(x − 1)', sc: { modo: 'derivada', f: '(x^2 + 1)/(x - 1)', orden: '1', x0: '3' } },
    { clave: 'cadena', nombre: 'Composée : e^(−x²)', sc: { modo: 'derivada', f: 'e^(-x^2)', orden: '2', x0: '' } },
    { clave: 'raiz', nombre: 'Racine et logarithme', sc: { modo: 'derivada', f: 'ln(sqrt(x^2 + 1))', orden: '1', x0: '1' } },
    { clave: 'tangente', nombre: 'Tangente à x³ − 3x', sc: { modo: 'derivada', f: 'x^3 - 3x', orden: '2', x0: '2' } },
    { clave: 'arctan', nombre: 'arctg(2x) y orden 3', sc: { modo: 'derivada', f: 'arctg(2x)', orden: '3', x0: '0' } },
    { clave: 'logaritmica', nombre: 'Dérivation logarithmique : x^x', sc: { modo: 'derivada', f: 'x^x', orden: '1', x0: '1' } },
    { clave: 'potencias', nombre: 'Puissances et racines', sc: { modo: 'integral', f: '3x^2 - 4/x + sqrt(x)', a: '1', b: '4' } },
    { clave: 'sustitucion', nombre: 'Changement de variable : x e^(x²)', sc: { modo: 'integral', f: 'x e^(x^2)', a: '0', b: '1' } },
    { clave: 'partes', nombre: 'Par parties : x² eˣ', sc: { modo: 'integral', f: 'x^2 e^x', a: '0', b: '1' } },
    { clave: 'partes-ln', nombre: 'Par parties : x ln x', sc: { modo: 'integral', f: 'x ln(x)', a: '1', b: 'e' } },
    { clave: 'racional', nombre: 'Rationnelle : éléments simples', sc: { modo: 'integral', f: '(3x + 5)/(x^2 + 2x - 3)', a: '2', b: '4' } },
    { clave: 'arcotangente', nombre: 'Rationnelle avec arctangente', sc: { modo: 'integral', f: '1/(x^2 + 4)', a: '0', b: '2' } },
    { clave: 'trig', nombre: 'sin² x (angle double)', sc: { modo: 'integral', f: 'sen(x)^2', a: '0', b: 'pi' } },
    { clave: 'cicliclica', nombre: 'eˣ cos x (parties deux fois)', sc: { modo: 'integral', f: 'e^x cos(x)', a: '0', b: 'pi/2' } },
    { clave: 'gauss', nombre: 'e^(−x²) : sans primitive élémentaire', sc: { modo: 'integral', f: 'e^(-x^2)', a: '0', b: '1' } },
    { clave: 'prod-trig', nombre: 'sen 3x cos 2x (producto a suma)', sc: { modo: 'integral', f: 'sen(3x) cos(2x)', a: '0', b: 'pi/2' } },
    { clave: 'semicirculo', nombre: '√(4 − x²) : changement trigonométrique', sc: { modo: 'integral', f: 'sqrt(4 - x^2)', a: '-2', b: '2' } },
    { clave: 'impropia', nombre: 'Impropre : ∫₁^∞ 1/x²', sc: { modo: 'integral', f: '1/x^2', a: '1', b: '∞' } },
    { clave: 'impropia-diverge', nombre: 'Impropre divergente : ∫₁^∞ 1/x', sc: { modo: 'integral', f: '1/x', a: '1', b: '∞' } },
    { clave: 'impropia-asintota', nombre: 'Asymptote à une borne : ∫₀¹ 1/√x', sc: { modo: 'integral', f: '1/sqrt(x)', a: '0', b: '1' } },
    { clave: 'impropia-dentro', nombre: 'Asymptote à l’intérieur : ∫₋₁⁸ 1/∛x', sc: { modo: 'integral', f: '1/cbrt(x)', a: '-1', b: '8' } },
    { clave: 'impropia-gauss', nombre: 'Gauss : ∫₀^∞ e^(−x²)', sc: { modo: 'integral', f: 'e^(-x^2)', a: '0', b: '∞' } },
    { clave: 'lh-sen', nombre: 'sin x / x en 0', sc: { modo: 'limite', f: 'sen(x)/x', a: '0' } },
    { clave: 'lh-dos', nombre: '(1 − cos x)/x² : deux fois', sc: { modo: 'limite', f: '(1 - cos(x))/x^2', a: '0' } },
    { clave: 'lh-cero-inf', nombre: 'x ln x en 0 (0 · ∞)', sc: { modo: 'limite', f: 'x ln(x)', a: '0' } },
    { clave: 'lh-uno-inf', nombre: '(1 + 1/x)^x en ∞ (1^∞)', sc: { modo: 'limite', f: '(1 + 1/x)^x', a: '∞' } },
    { clave: 'lh-resta', nombre: '1/x − 1/sen x (∞ − ∞)', sc: { modo: 'limite', f: '1/x - 1/sen(x)', a: '0' } },
    { clave: 'circunferencia', nombre: 'Cercle x² + y² = 25', sc: { modo: 'implicita', ec: 'x^2 + y^2 = 25', x0: '3', y0: '4' } },
    { clave: 'folium', nombre: 'Folium de Descartes', sc: { modo: 'implicita', ec: 'x^3 + y^3 = 6 x y', x0: '3', y0: '3' } },
    { clave: 'parciales', nombre: 'f(x, y) = x² y + y³ − 3y', sc: { modo: 'parciales', f: 'x^2 y + y^3 - 3y', x0: '1', y0: '2' } },
    { clave: 'silla', nombre: 'Selle et minimum : x³ − 3x + y²', sc: { modo: 'parciales', f: 'x^3 - 3x + y^2', x0: '', y0: '' } },
    { clave: 'estudio', nombre: 'Étude de (x² + 1)/(x − 1)', sc: { modo: 'estudio', f: '(x^2 + 1)/(x - 1)' } },
    { clave: 'estudio-exp', nombre: 'Étude de x e^(−x)', sc: { modo: 'estudio', f: 'x e^(-x)' } },
    { clave: 'estudio-ln', nombre: 'Étude de ln x / x', sc: { modo: 'estudio', f: 'ln(x)/x' } },
    { clave: 'area', nombre: 'Aire entre x² et x', sc: { modo: 'area', f: 'x', g: 'x^2', a: '', b: '' } },
    { clave: 'area-cruce', nombre: 'Aire entre x³ et x (elles se croisent)', sc: { modo: 'area', f: 'x^3', g: 'x', a: '', b: '' } },
    { clave: 'volumen', nombre: 'Volume : √x de 0 à 4 (disques)', sc: { modo: 'volumen', f: 'sqrt(x)', g: '', a: '0', b: '4', eje: 'x' } },
    { clave: 'esfera', nombre: 'Volume de la sphère', sc: { modo: 'volumen', f: 'sqrt(1 - x^2)', g: '', a: '', b: '', eje: 'x' } },
    { clave: 'capas', nombre: 'Entre x et x² autour de l’axe y (coques)', sc: { modo: 'volumen', f: 'x', g: 'x^2', a: '', b: '', eje: 'y' } },
  ];
  return { resolver, derivada, integral, limite, implicita, parciales, estudio, area, volumen, prim, igualNum, limNum, raicesNum, cuadratura, ejemplos, f, T };
})();

