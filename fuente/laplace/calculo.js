/* =====================================================================
   Transformada de Laplace (sin DOM):
   · directa: f(t) como suma de términos c·tⁿ·e^{at}·(1, sen bt, cos bt,
     senh, cosh) → F(s) término a término con la tabla y sus propiedades;
   · inversa: F(s) racional → polos (con su multiplicidad), fracciones
     simples y f(t), con los teoremas del valor inicial y final;
   · ecuaciones diferenciales lineales de coeficientes constantes de
     orden 1 o 2 con condiciones iniciales: se transforma, se despeja Y(s)
     y se invierte.
   Las expresiones las lee Expresion (variables t y s). Las funciones
   racionales se guardan como dos polinomios (coeficientes de menor a
   mayor grado).
   ===================================================================== */
const Laplace = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  const FACT = [1]; for (let k = 1; k <= 30; k++) FACT[k] = FACT[k - 1] * k;
  // número exacto si es sencillo ({3}/{4}, √2, π), si no decimal
  const cTxt = (c) => (E.exacto(c, 200) ? E.numTxt(c) : f(c, 4));
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function num(s, nom) {
    if (vacio(s)) throw new Error(`Falta ${nom}`);
    const n = E.lee(s, may(nom), ['t', 's']);
    if (E.tieneX(n, 't') || E.tieneX(n, 's')) throw new Error(`${may(nom)} tiene que ser un número`);
    const v = E.valor(n, 0, {});
    if (!isFinite(v)) throw new Error(`${may(nom)} no es un número`);
    return v;
  }

  /* ---------- Polinomios y funciones racionales ---------- */
  const limpia = (p) => { const q = p.slice(); while (q.length > 1 && Math.abs(q[q.length - 1]) < 1e-12 * Math.max(1, ...q.map(Math.abs))) q.pop(); return q; };
  const grado = (p) => limpia(p).length - 1;
  const pSuma = (a, b) => limpia(Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] || 0) + (b[i] || 0)));
  const pEsc = (a, k) => a.map((x) => x * k);
  const pMul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return limpia(r); };
  const pDer = (a) => (a.length <= 1 ? [0] : a.slice(1).map((x, i) => x * (i + 1)));
  const pVal = (a, x) => a.reduceRight((s, c) => s * x + c, 0);
  const R = (n, d = [1]) => ({ n: limpia(n), d: limpia(d) });
  const rSuma = (a, b) => R(pSuma(pMul(a.n, b.d), pMul(b.n, a.d)), pMul(a.d, b.d));
  const rMul = (a, b) => R(pMul(a.n, b.n), pMul(a.d, b.d));
  const rDiv = (a, b) => { if (limpia(b.n).length === 1 && Math.abs(b.n[0]) < 1e-300) throw new Error('División entre cero en F(s)'); return R(pMul(a.n, b.d), pMul(a.d, b.n)); };
  const rDer = (a) => R(pSuma(pMul(pDer(a.n), a.d), pEsc(pMul(a.n, pDer(a.d)), -1)), pMul(a.d, a.d));
  const rPot = (a, k) => { let r = R([1]); for (let i = 0; i < Math.abs(k); i++) r = rMul(r, a); return k < 0 ? rDiv(R([1]), r) : r; };
  // texto de un polinomio en s: s^{2} + 4 s + 13
  function pTxt(p, v = 's') {
    const q = limpia(p), ts = [];
    for (let i = q.length - 1; i >= 0; i--) {
      const c = q[i]; if (Math.abs(c) < 1e-12) continue;
      const pot = i === 0 ? '' : i === 1 ? v : `${v}^{${i}}`, a = Math.abs(c);
      const cuerpo = !pot ? cTxt(a) : Math.abs(a - 1) < 1e-12 ? pot : `${cTxt(a)} ${pot}`;
      ts.push({ neg: c < 0, cuerpo });
    }
    if (!ts.length) return '0';
    return ts.map((t, i) => (i ? `${t.neg ? ' − ' : ' + '}${t.cuerpo}` : `${t.neg ? '−' : ''}${t.cuerpo}`)).join('');
  }
  // divide numerador y denominador por el coeficiente principal del denominador
  const normaliza = (r) => { const d = limpia(r.d), k = d[d.length - 1]; return R(pEsc(r.n, 1 / k), pEsc(d, 1 / k)); };
  const rTxt = (r) => { const q = normaliza(r); return grado(q.d) === 0 ? pTxt(pEsc(q.n, 1 / q.d[0])) : `{${pTxt(q.n)}}/{${pTxt(q.d)}}`; };

  // árbol de Expresion en s → función racional
  function racional(n) {
    switch (n.t) {
      case 'n': return R([n.v]);
      case 'c': return R([E.valor(n, 0, {})]);
      case 'x': if (n.n === 's') return R([0, 1]); throw new Error('F(s) solo puede llevar la variable s');
      case 'neg': { const a = racional(n.a); return R(pEsc(a.n, -1), a.d); }
      case '+': return rSuma(racional(n.a), racional(n.b));
      case '-': { const b = racional(n.b); return rSuma(racional(n.a), R(pEsc(b.n, -1), b.d)); }
      case '*': return rMul(racional(n.a), racional(n.b));
      case '/': return rDiv(racional(n.a), racional(n.b));
      case '^': {
        if (E.tieneX(n.b, 's')) throw new Error('F(s) no puede tener s en un exponente: tiene que ser una fracción de polinomios');
        const k = E.valor(n.b, 0, {});
        if (!Number.isInteger(k) || Math.abs(k) > 20) throw new Error('Los exponentes de F(s) tienen que ser enteros');
        return rPot(racional(n.a), k);
      }
      case 'fn': if (!E.tieneX(n, 's')) return R([E.valor(n, 0, {})]); throw new Error(`F(s) tiene que ser una fracción de polinomios en s (no vale ${n.f}(s))`);
    }
    throw new Error('No entiendo F(s)');
  }

  /* ---------- Números complejos y raíces ---------- */
  const C = (re, im = 0) => ({ re, im });
  const cAdd = (a, b) => C(a.re + b.re, a.im + b.im), cSub = (a, b) => C(a.re - b.re, a.im - b.im);
  const cMul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const cDiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const cAbs = (a) => Math.hypot(a.re, a.im);
  const cVal = (p, z) => p.reduceRight((s, c) => cAdd(cMul(s, z), typeof c === 'number' ? C(c) : c), C(0));
  // todas las raíces de un polinomio real (Durand-Kerner), agrupadas por multiplicidad y redondeadas a valores sencillos
  function raices(p) {
    const q = limpia(p), n = q.length - 1;
    if (n < 1) return [];
    // cota de Fujiwara: todas las raíces tienen |z| ≤ cota
    const m = pEsc(q, 1 / q[n]), cota = 2 * Math.max(...m.slice(0, n).map((c, i) => Math.abs(c) ** (1 / (n - i)))) || 1;
    let z = Array.from({ length: n }, (_, k) => { const a = (2 * Math.PI * k) / n + 0.4; return C(cota * 0.9 * Math.cos(a), cota * 0.9 * Math.sin(a)); });
    for (let it = 0; it < 2000; it++) {
      let mx = 0;
      z = z.map((zi, i) => { let den = C(1); z.forEach((zj, j) => { if (j !== i) den = cMul(den, cSub(zi, zj)); }); const dz = cDiv(cVal(m, zi), den); mx = Math.max(mx, cAbs(dz)); return cSub(zi, dz); });
      if (mx < 1e-15 * cota) break;
    }
    // agrupar las que salen juntas (raíces múltiples): se prueba de más a menos tolerancia hasta que el producto cuadra
    const snap = (x, tol) => { if (Math.abs(x) < tol) return 0; for (let q = 1; q <= 24; q++) { const k = Math.round(x * q); if (Math.abs(k / q - x) < tol * Math.max(1, Math.abs(x))) return k / q; } return x; };
    let out = null;
    for (const radio of [1e-1, 2e-2, 2e-3, 2e-4, 0]) {
      const grupos = [];
      for (const r of z) { const g = grupos.find((x) => cAbs(cSub(x.c, r)) <= radio * Math.max(1, cAbs(r))); if (g) { g.v.push(r); g.c = C(g.v.reduce((s, x) => s + x.re, 0) / g.v.length, g.v.reduce((s, x) => s + x.im, 0) / g.v.length); } else grupos.push({ c: r, v: [r] }); }
      // una raíz de multiplicidad k es raíz simple de la derivada k − 1: Newton ahí para afinar el centro del grupo
      for (const g of grupos) if (g.v.length > 1) {
        let d = m; for (let k = 1; k < g.v.length; k++) d = pDer(d);
        const d1 = pDer(d);
        for (let it = 0; it < 40; it++) { const v = cVal(d1, g.c); if (cAbs(v) < 1e-300) break; const dz = cDiv(cVal(d, g.c), v); g.c = cSub(g.c, dz); if (cAbs(dz) < 1e-15 * cota) break; }
      }
      const cand = grupos.map((g) => ({ p: C(snap(g.c.re, 1e-7), snap(g.c.im, 1e-7)), m: g.v.length }));
      // comprobación: el producto de (s − p)^m tiene que dar el polinomio
      let prod = [C(1)];
      for (const r of cand) for (let k = 0; k < r.m; k++) { const nx = new Array(prod.length + 1).fill(null).map(() => C(0)); prod.forEach((c, i) => { nx[i + 1] = cAdd(nx[i + 1], c); nx[i] = cSub(nx[i], cMul(c, r.p)); }); prod = nx; }
      const err = Math.max(...prod.map((c, i) => Math.abs(c.re - m[i]) + Math.abs(c.im))) / Math.max(1, ...m.map(Math.abs));
      if (err < 1e-8) { out = cand; break; }
    }
    if (!out) throw new Error('No he podido factorizar el denominador con precisión');
    return out.sort((a, b) => a.p.re - b.p.re || Math.abs(a.p.im) - Math.abs(b.p.im) || a.p.im - b.p.im);
  }
  // coeficientes de Taylor de un polinomio (complejo) alrededor de z0: p(z0 + h) = Σ c_k h^k
  function taylorP(p, z0) {
    let a = p.map((c) => (typeof c === 'number' ? C(c) : c));
    const out = [];
    while (a.length) { const q = new Array(a.length - 1).fill(null).map(() => C(0)); let acc = C(0); for (let i = a.length - 1; i >= 0; i--) { acc = cAdd(cMul(acc, z0), a[i]); if (i > 0) q[i - 1] = acc; } out.push(acc); a = q; }
    return out;
  }
  // fracciones simples: para cada polo p de multiplicidad m, A_1 … A_m de A_j/(s − p)^j
  function residuos(r) {
    const N = limpia(r.n), D = limpia(r.d), lead = D[D.length - 1], polos = raices(D);
    return polos.map(({ p, m }) => {
      // Q_p(s) = D(s)/(lead·(s − p)^m) como producto del resto de factores
      let Qp = [C(1)];
      for (const o of polos) if (o.p !== p) for (let k = 0; k < o.m; k++) { const nx = new Array(Qp.length + 1).fill(null).map(() => C(0)); Qp.forEach((c, i) => { nx[i + 1] = cAdd(nx[i + 1], c); nx[i] = cSub(nx[i], cMul(c, o.p)); }); Qp = nx; }
      const nT = taylorP(N, p).map((c) => cDiv(c, C(lead))), dT = taylorP(Qp, p);
      // serie de N/Q_p alrededor de p hasta el orden m − 1
      const g = [];
      for (let k = 0; k < m; k++) { let s = nT[k] || C(0); for (let j = 1; j <= k; j++) s = cSub(s, cMul(dT[j] || C(0), g[k - j])); g.push(cDiv(s, dT[0])); }
      // A_j (con j = 1…m) es el coeficiente de h^(m − j)
      return { p, m, A: Array.from({ length: m }, (_, j) => g[m - 1 - j]) };
    });
  }

  // quita los factores comunes de numerador y denominador (raíces que coinciden)
  function desde(rs, lead) {
    let p = [C(lead)];
    for (const r of rs) for (let k = 0; k < r.m; k++) { const nx = new Array(p.length + 1).fill(null).map(() => C(0)); p.forEach((c, i) => { nx[i + 1] = cAdd(nx[i + 1], c); nx[i] = cSub(nx[i], cMul(c, r.p)); }); p = nx; }
    return p.map((c) => (Math.abs(c.re) < 1e-12 ? 0 : c.re));
  }
  function simplifica(r) {
    const q = normaliza(r);
    if (grado(q.n) < 1 || limpia(q.n).every((c) => c === 0)) return q;
    let pn, pd;
    try { pn = raices(q.n); pd = raices(q.d); } catch (e) { return q; }
    let quita = false;
    for (const z of pn) for (const o of pd) if (z.m && o.m && cAbs(cSub(z.p, o.p)) < 1e-6) { const k = Math.min(z.m, o.m); z.m -= k; o.m -= k; quita = true; }
    if (!quita) return q;
    const ln = limpia(q.n);
    return R(desde(pn.filter((x) => x.m), ln[ln.length - 1]), desde(pd.filter((x) => x.m), 1));
  }

  // denominador factorizado como en clase: s (s + 1)^{2} (s^{2} + 4)
  function factTxt(r) {
    const q = normaliza(r);
    let rs; try { rs = raices(q.d); } catch (e) { return rTxt(q); }
    const fs = [];
    for (const { p, m } of rs.slice().sort((x, y) => cAbs(x.p) - cAbs(y.p) || y.p.re - x.p.re)) {
      if (p.im < -1e-12) continue;
      let b;
      if (Math.abs(p.im) < 1e-12) b = sMenos(p.re);
      else b = pTxt([p.re * p.re + p.im * p.im, -2 * p.re, 1]);
      const sola = b === 's';
      fs.push(m > 1 ? `${sola ? 's' : `(${b})`}^{${m}}` : sola || rs.length === 1 ? b : `(${b})`);
    }
    if (fs.length === 1 && /^\(.*\)$/.test(fs[0])) fs[0] = fs[0].slice(1, -1);
    const n = limpia(q.n);
    return grado(q.d) === 0 ? rTxt(q) : `{${pTxt(n)}}/{${fs.join(' ')}}`;
  }

  /* ---------- Textos de términos ---------- */
  // c·{num}/{den} escrito como en clase: {6}/{s^{3}}, {5}/{2 (s + 1)}
  const sinParen = (d) => /^s(\^\{\d+\})?$|^\([^()]*\)\^\{\d+\}$/.test(d);
  function frNum(c, num, den) {
    const v = Math.abs(c) * num, e = E.fraccion(v, 200);
    if (!e || Math.abs(e[0] / e[1] - v) > 1e-9 * Math.max(1, v)) return { c, s: `{${cTxt(num)}}/{${den}}` };
    return { c: Math.sign(c), s: e[1] === 1 ? `{${e[0]}}/{${den}}` : `{${e[0]}}/{${e[1]} ${sinParen(den) ? den : `(${den})`}}` };
  }
  // (s − p) con el signo bien: s + 2, s − 3, s
  const sMenos = (p) => (Math.abs(p) < 1e-12 ? 's' : p > 0 ? `s − ${cTxt(p)}` : `s + ${cTxt(-p)}`);
  const linT = (r, v = 't') => { const a = Math.abs(r), sg = r < 0 ? '−' : ''; if (Math.abs(a - 1) < 1e-12) return `${sg}${v}`; const e = E.exacto(a, 12); if (e && !e.s && e.q !== 1) return `${sg}{${e.p === 1 ? '' : e.p + ' '}${v}}/{${e.q}}`; return `${sg}${cTxt(a)} ${v}`; };
  const expT = (r) => (Math.abs(r) < 1e-12 ? '' : `e^{${linT(r)}}`);
  const trigT = (p, w) => (w ? `${p} ${/[ {]/.test(linT(w)) ? `(${linT(w)})` : linT(w)}` : '');
  const potT = (k) => (k === 0 ? '' : k === 1 ? 't' : `t^{${k}}`);
  // c·(cuerpo) con signo, para sumas
  function suma(ts) {
    const vivos = ts.filter((t) => Math.abs(t.c) > 1e-10);
    if (!vivos.length) return '0';
    return vivos.map((t, i) => {
      const a = Math.abs(t.c), neg = t.c < 0;
      const cuerpo = !t.s ? cTxt(a) : Math.abs(a - 1) < 1e-12 ? t.s : `${cTxt(a)} ${t.s}`;
      return i ? `${neg ? ' − ' : ' + '}${cuerpo}` : `${neg ? '−' : ''}${cuerpo}`;
    }).join('');
  }

  /* ---------- f(t) como suma de términos ---------- */
  function lineal(u) {
    const u0 = E.valor(u, 0, { t: 0 }), r = E.valor(u, 0, { t: 1 }) - u0;
    if (!isFinite(u0) || !isFinite(r) || Math.abs(E.valor(u, 0, { t: 2.5 }) - (u0 + 2.5 * r)) > 1e-9 * Math.max(1, Math.abs(r))) return null;
    return { u0, r };
  }
  // términos { c, k, r, w, p }: c·t^k·e^{rt}·(sen|cos)(wt)
  function terminos(ast) {
    const ts = [];
    const nT = (q) => !E.tieneX(q, 't');
    function enSuma(m, s) {
      if (m.t === '+') { enSuma(m.a, s); enSuma(m.b, s); return; }
      if (m.t === '-') { enSuma(m.a, s); enSuma(m.b, -s); return; }
      if (m.t === 'neg') { enSuma(m.a, -s); return; }
      const t = producto(m);
      if (!t) throw 0;
      for (const q of t) ts.push({ ...q, c: q.c * s });
    }
    function producto(m) {
      let base = [{ c: 1, k: 0, r: 0, w: 0, p: null }];
      const mult = (otros) => { const nb = []; for (const a of base) for (const b of otros) { if (a.p && b.p) return false; nb.push({ c: a.c * b.c, k: a.k + b.k, r: a.r + b.r, w: a.w + b.w, p: a.p || b.p, h: a.h || b.h }); } base = nb; return true; };
      function fac(q) {
        if (q.t === '*') return fac(q.a) && fac(q.b);
        if (q.t === '/' && nT(q.b)) { const d = E.valor(q.b, 0, {}); return fac(q.a) && mult([{ c: 1 / d, k: 0, r: 0, w: 0, p: null }]); }
        if (q.t === 'neg') return fac(q.a) && mult([{ c: -1, k: 0, r: 0, w: 0, p: null }]);
        // un paréntesis con una suma dentro: se reparte (propiedad distributiva)
        if (q.t === '+' || q.t === '-') { const sub = terminos(q); return !!sub && mult(sub); }
        if (nT(q)) { const v = E.valor(q, 0, {}); return isFinite(v) && mult([{ c: v, k: 0, r: 0, w: 0, p: null }]); }
        if (q.t === '^' && nT(q.b) && E.tieneX(q.a, 't')) { const n = E.valor(q.b, 0, {}); if (!Number.isInteger(n) || n < 0 || n > 12 || (q.a.t === 'x')) { if (q.a.t !== 'x') return false; } else { for (let i = 0; i < n; i++) if (!fac(q.a)) return false; return true; } }
        if (q.t === 'x' && q.n === 't') return mult([{ c: 1, k: 1, r: 0, w: 0, p: null }]);
        if (q.t === '^' && q.a.t === 'x' && q.a.n === 't' && q.b.t === 'n' && Number.isInteger(q.b.v) && q.b.v >= 0 && q.b.v <= 12) return mult([{ c: 1, k: q.b.v, r: 0, w: 0, p: null }]);
        if ((q.t === '^' && q.a.t === 'c' && q.a.v === 'e') || (q.t === 'fn' && q.f === 'exp')) { const l = lineal(q.t === '^' ? q.b : q.a); return !!l && mult([{ c: Math.exp(l.u0), k: 0, r: l.r, w: 0, p: null }]); }
        if (q.t === 'fn' && (q.f === 'sen' || q.f === 'cos')) {
          const l = lineal(q.a); if (!l || Math.abs(l.r) < 1e-14) return false;
          const w = Math.abs(l.r), sg = Math.sign(l.r), c0 = Math.cos(l.u0), s0 = Math.sin(l.u0);
          return mult(q.f === 'sen' ? [{ c: sg * c0, k: 0, r: 0, w, p: 'sen' }, { c: s0, k: 0, r: 0, w, p: 'cos' }] : [{ c: c0, k: 0, r: 0, w, p: 'cos' }, { c: -sg * s0, k: 0, r: 0, w, p: 'sen' }]);
        }
        if (q.t === 'fn' && (q.f === 'senh' || q.f === 'cosh')) { const l = lineal(q.a); if (!l) return false; const a = Math.exp(l.u0) / 2, b = Math.exp(-l.u0) / 2; return mult([{ c: a, k: 0, r: l.r, w: 0, p: null, h: q.f }, { c: q.f === 'senh' ? -b : b, k: 0, r: -l.r, w: 0, p: null, h: q.f }]); }
        return false;
      }
      if (!fac(m)) return null;
      return base.map((b) => (b.w ? b : { ...b, p: null }));
    }
    try { enSuma(E.simp(ast), 1); } catch (e) { if (e === 0) return null; throw e; }
    // juntar términos iguales
    const out = [];
    for (const t of ts) { const o = out.find((q) => q.k === t.k && Math.abs(q.r - t.r) < 1e-12 && Math.abs(q.w - t.w) < 1e-12 && q.p === t.p); if (o) { o.c += t.c; if (o.h !== t.h) o.h = undefined; } else out.push({ ...t }); }
    return out.filter((t) => Math.abs(t.c) > 1e-14);
  }
  // transformada de un término: tabla + desplazamiento en s + multiplicar por t^k
  function transTermino({ k, r, w, p }) {
    let base = !p ? R([1], [-r, 1]) : p === 'sen' ? R([w], [r * r + w * w, -2 * r, 1]) : R([-r, 1], [r * r + w * w, -2 * r, 1]);
    for (let i = 0; i < k; i++) base = simplifica(rDer(base));
    if (k % 2) base = R(pEsc(base.n, -1), base.d);
    return base;
  }
  // F(s) de un término en la forma de la tabla
  function formaTabla({ c, k, r, w, p }) {
    const a = sMenos(r), q2 = w ? `${r === 0 ? 's^{2}' : `(${a})^{2}`} + ${cTxt(w * w)}` : '';
    let num = null, den = null, txt;
    if (!p) { num = FACT[k]; den = k === 0 ? a : r === 0 ? `s^{${k + 1}}` : `(${a})^{${k + 1}}`; }
    else if (k === 0 && p === 'sen') { num = w; den = q2; }
    else if (k === 0) txt = `{${a}}/{${q2}}`;
    else txt = factTxt(transTermino({ k, r, w, p }));
    if (num !== null) txt = `{${cTxt(num)}}/{${den}}`;
    return { c, txt, conC: num !== null ? frNum(c, num, den) : { c, s: txt } };
  }
  const fTermTxt = (t) => [potT(t.k), expT(t.r), trigT(t.p, t.w)].filter(Boolean).join(' ');

  /* ---------- Directa ---------- */
  function directa(sc) {
    if (vacio(sc.f)) throw new Error('Falta f(t)');
    const ast = E.lee(sc.f, 'f(t)', ['t']);
    if (E.tieneX(ast, 's')) throw new Error('f(t) no puede llevar s');
    const ts = terminos(ast);
    if (!ts) throw new Error('Solo sé transformar sumas de términos c·tⁿ·e^{at}·sen(bt) o cos(bt) (también senh y cosh)');
    if (!ts.length) throw new Error('f(t) es 0');
    const pasos = [];
    if (ts.length > 1) pasos.push({ t: 'Linealidad', html: `$ℒ\\{a f + b g\\} = a F(s) + b G(s)$: se transforma cada término por separado.<br>$f(t) = ${suma(ts.map((t) => ({ c: t.c, s: fTermTxt(t) })))}$` });
    const usa = new Set();
    const lineas = ts.map((t) => {
      const ft = fTermTxt(t), F = formaTabla(t);
      if (!t.p && t.k === 0 && t.r === 0) usa.add('$ℒ\\{1\\} = {1}/{s}$');
      if (!t.p && t.k > 0) usa.add('$ℒ\\{t^{n}\\} = {n!}/{s^{n+1}}$');
      if (t.p === 'sen') usa.add('$ℒ\\{sen(bt)\\} = {b}/{s^{2} + b^{2}}$');
      if (t.p === 'cos') usa.add('$ℒ\\{cos(bt)\\} = {s}/{s^{2} + b^{2}}$');
      if (t.r) usa.add('$ℒ\\{e^{at} f(t)\\} = F(s − a)$ (desplazamiento en s)');
      if (t.k && t.p) usa.add('$ℒ\\{t^{n} f(t)\\} = (−1)^{n} {d^{n}F}/{ds^{n}}$');
      // con t^k delante: primero la transformada sin t^k y luego se deriva
      if (t.k && t.p) { const b = formaTabla({ ...t, k: 0 }), d = t.k === 1 ? '−{d}/{ds}' : `${t.k % 2 ? '−' : ''}{d^{${t.k}}}/{ds^{${t.k}}}`; return `$ℒ\\{${fTermTxt({ ...t, k: 0 })}\\} = ${b.txt}$ &ensp;⇒&ensp; $ℒ\\{${ft}\\} = ${d} (${b.txt}) = ${F.txt}$`; }
      return `$ℒ\\{${ft || '1'}\\} = ${F.txt}$`;
    });
    pasos.push({ t: 'Tabla y propiedades', html: `${[...usa].join('<br>')}` });
    pasos.push({ t: 'Cada término', html: lineas.join('<br>') });
    let Fs = R([0]);
    for (const t of ts) { const b = transTermino(t); Fs = simplifica(rSuma(Fs, R(pEsc(b.n, t.c), b.d))); }
    // senh y cosh se escriben con su fila de la tabla en vez de como dos exponenciales
    const hechos = new Set(), sumaTxt = [];
    ts.forEach((t, i) => {
      if (hechos.has(i)) return;
      const j = t.h && t.k === 0 ? ts.findIndex((o, jj) => jj > i && !hechos.has(jj) && o.h === t.h && o.k === 0 && !o.p && !t.p && Math.abs(Math.abs(o.c) - Math.abs(t.c)) < 1e-12) : -1;
      if (j < 0) { sumaTxt.push(formaTabla(t).conC); return; }
      hechos.add(j);
      // e^{αt}·(cosh | senh)(at): F(s − α) con la fila de la tabla
      const al = (t.r + ts[j].r) / 2, a = Math.abs(t.r - ts[j].r) / 2, d = `${Math.abs(al) < 1e-12 ? 's^{2}' : `(${sMenos(al)})^{2}`} − ${cTxt(a * a)}`, cosh = Math.abs(t.c - ts[j].c) < 1e-12;
      const c = 2 * (cosh ? t.c : (t.r > ts[j].r ? t.c : ts[j].c));
      sumaTxt.push(cosh ? { c, s: `{${sMenos(al)}}/{${d}}` } : frNum(c, a, d));
      usa.add(cosh ? '$ℒ\\{cosh(at)\\} = {s}/{s^{2} − a^{2}}$' : '$ℒ\\{senh(at)\\} = {a}/{s^{2} − a^{2}}$');
    });
    const conv = Math.max(...ts.map((t) => t.r));
    pasos.push({ t: 'Resultado', html: `$F(s) = ${suma(sumaTxt)}$${ts.length > 1 ? `<br>Con denominador común: $F(s) = ${factTxt(Fs)}$` : ''}<br>Existe para $s > ${cTxt(conv)}$.` });
    const fn = (tt) => ts.reduce((s, q) => s + q.c * tt ** q.k * Math.exp(q.r * tt) * (q.p === 'sen' ? Math.sin(q.w * tt) : q.p === 'cos' ? Math.cos(q.w * tt) : 1), 0);
    return { modo: 'directa', ts, conv, F: Fs, Ftxt: suma(sumaTxt), Fcomun: rTxt(Fs), Ffact: factTxt(Fs), f: fn, ftxt: suma(ts.map((t) => ({ c: t.c, s: fTermTxt(t) }))), polos: raicesSeguras(Fs.d), ceros: raicesSeguras(Fs.n), pasos };
  }
  function raicesSeguras(p) { try { return raices(p); } catch (e) { return []; } }

  /* ---------- Inversa ---------- */
  // F(s) → f(t) por fracciones simples
  function invierte(F, pasos, nombre = 'F') {
    const q = simplifica(F);
    if (grado(q.d) < 1) throw new Error(`${nombre}(s) no tiene denominador con s: su inversa sería una delta de Dirac`);
    if (grado(q.n) >= grado(q.d)) throw new Error(`${nombre}(s) tiene que ser propia (el grado del numerador menor que el del denominador); si no, la inversa lleva deltas de Dirac`);
    const rs = residuos(q);
    const polosTxt = rs.filter(({ p }) => p.im > -1e-12).map(({ p, m }) => { const par = p.im > 1e-12, b = Math.abs(p.im), bt = Math.abs(b - 1) < 1e-12 ? '' : cTxt(b) + ' '; return `$s = ${!par ? cTxt(p.re) : `${Math.abs(p.re) < 1e-12 ? '±' : cTxt(p.re) + ' ±'} ${bt}i`}$${m > 1 ? ` (${m === 2 ? 'doble' : m === 3 ? 'triple' : `multiplicidad ${m}`}${par ? 's' : ''})` : ''}`; });
    pasos.push({ t: 'Polos', html: `Las raíces del denominador $${factTxt(R([1], q.d)).replace(/^\{1\}\/\{(.*)\}$/, '$1')} = 0$ son ${polosTxt.join(', ')}.` });
    const frac = [], terms = [];
    for (const { p, m, A } of rs) {
      if (Math.abs(p.im) < 1e-12) {
        A.forEach((a, j) => { frac.push(frNum(a.re, 1, j ? (Math.abs(p.re) < 1e-12 ? `s^{${j + 1}}` : `(${sMenos(p.re)})^{${j + 1}}`) : sMenos(p.re))); terms.push({ c: a.re / FACT[j], k: j, r: p.re, w: 0, p: null }); });
      } else if (p.im > 0) {
        const al = p.re, be = p.im, Q = [al * al + be * be, -2 * al, 1], Qtxt = `${Math.abs(al) < 1e-12 ? 's^{2}' : `(${sMenos(al)})^{2}`} + ${cTxt(be * be)}`;
        // A_j/(s − p)^j + conjugado = t^{j−1}/(j−1)! e^{αt} · 2(Re A_j cos βt − Im A_j sen βt)
        A.forEach((a, j) => { terms.push({ c: (2 * a.re) / FACT[j], k: j, r: al, w: be, p: 'cos' }, { c: (-2 * a.im) / FACT[j], k: j, r: al, w: be, p: 'sen' }); });
        // en real: Σ (B_j s + C_j)/Q^j, sacando de N/Q^m los restos de dividir entre Q una y otra vez
        const cp = (z) => [C(-z.re, -z.im), C(1)], cpMul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(null).map(() => C(0)); a.forEach((x, i) => b.forEach((y, k) => { r[i + k] = cAdd(r[i + k], cMul(x, y)); })); return r; };
        let Nre = [0];
        A.forEach((a, j) => { let t = [a]; for (let i = 0; i < m - 1 - j; i++) t = cpMul(t, cp(p)); for (let i = 0; i < m; i++) t = cpMul(t, cp(C(p.re, -p.im))); Nre = pSuma(Nre, t.map((z) => 2 * z.re)); });
        const restos = [];
        for (let i = 0; i < m; i++) { const r = Nre.slice(), qq = new Array(Math.max(1, r.length - 2)).fill(0); for (let d = r.length - 1; d >= 2; d--) { const k = r[d]; qq[d - 2] = k; r[d] -= k; r[d - 1] -= k * Q[1]; r[d - 2] -= k * Q[0]; } restos.push([r[0] || 0, r[1] || 0]); Nre = qq; }
        restos.forEach((r, i) => {
          const jj = m - i, den = jj > 1 ? `(${Qtxt})^{${jj}}` : Qtxt;
          const ent = (x) => Math.abs(x - Math.round(x)) < 1e-9, mcd = (x, y) => (y ? mcd(y, x % y) : x);
          if (Math.abs(r[1]) > 1e-10) {
            // (Bs + C) con enteros si se puede; si no, B(s + C/B) cuando C/B es entero
            let c = 1;
            if (ent(r[0]) && ent(r[1])) c = Math.sign(r[1]) * mcd(Math.abs(Math.round(r[1])), Math.abs(Math.round(r[0])));
            else if (ent(r[0] / r[1])) c = r[1];
            frac.push({ c, s: `{${pTxt([r[0] / c, r[1] / c])}}/{${den}}` });
          }
          else if (Math.abs(r[0]) > 1e-10) frac.push(frNum(r[0], 1, den));
        });
      }
    }
    const fracTxt = suma(frac);
    const reales = rs.filter((x) => Math.abs(x.p.im) < 1e-12), compl = rs.filter((x) => x.p.im > 1e-12);
    let h = `$${nombre}(s) = ${fracTxt}$`;
    if (reales.some((x) => x.m === 1)) {
      h += `<br>Cada coeficiente de un polo simple sale tapando su factor: $A = [(s − p) ${nombre}(s)]_{s = p}$`;
      h += reales.filter((x) => x.m === 1).map(({ p, A }) => `<br>$[(${sMenos(p.re)}) ${nombre}(s)]_{s = ${cTxt(p.re)}} = ${cTxt(A[0].re)}$`).join('');
    }
    if (reales.some((x) => x.m > 1)) h += '<br>Con un polo de multiplicidad m, $A_{m−j} = {1}/{j!} [{d^{j}}/{ds^{j}} ((s − p)^{m} F(s))]_{s = p}$.';
    if (compl.length) h += '<br>Cada par de polos complejos $α ± βi$ da un término $(Bs + C)/((s − α)^{2} + β^{2})$, que se separa en $B (s − α)/(…) + (C + Bα)/β · β/(…)$.';
    if (compl.some((x) => x.m > 1)) h += '<br>Con polos complejos dobles se trabaja con $p = α + βi$ complejo: $ℒ^{−1}\\{{A}/{(s − p)^{2}} + {Ā}/{(s − p̄)^{2}}\\} = 2 t e^{αt} ("Re" A cos βt − "Im" A sen βt)$.';
    pasos.push({ t: 'Fracciones simples', html: h });
    const ft = terms.filter((t) => Math.abs(t.c) > 1e-10);
    const tab = [];
    if (reales.length) tab.push('$ℒ^{−1}\\{{1}/{s − a}\\} = e^{at}$');
    if (reales.some((x) => x.m > 1)) tab.push('$ℒ^{−1}\\{{1}/{(s − a)^{n+1}}\\} = {t^{n}}/{n!} e^{at}$');
    if (compl.length) tab.push('$ℒ^{−1}\\{{s − α}/{(s − α)^{2} + β^{2}}\\} = e^{αt} cos(βt)$, $ℒ^{−1}\\{{β}/{(s − α)^{2} + β^{2}}\\} = e^{αt} sen(βt)$');
    pasos.push({ t: 'Inversa término a término', html: `${tab.join('<br>')}<br>$f(t) = ${suma(ft.map((t) => ({ c: t.c, s: fTermTxt(t) })))}$ &ensp; para $t ≥ 0$` });
    return { rs, terms: ft, frac: fracTxt, txt: suma(ft.map((t) => ({ c: t.c, s: fTermTxt(t) }))) };
  }
  const evalTerms = (ts) => (tt) => ts.reduce((s, q) => s + q.c * tt ** q.k * Math.exp(q.r * tt) * (q.p === 'sen' ? Math.sin(q.w * tt) : q.p === 'cos' ? Math.cos(q.w * tt) : 1), 0);
  function limites(F, rs, pasos) {
    const q = normaliza(F), sF = simplifica(R(pMul(q.n, [0, 1]), q.d));
    const gn = grado(sF.n), gd = grado(sF.d), ini = gn < gd ? 0 : gn === gd ? limpia(sF.n)[gn] / limpia(sF.d)[gd] : Infinity;
    const estable = rs.every(({ p }) => p.re < -1e-12 || (Math.abs(p.re) < 1e-12 && Math.abs(p.im) < 1e-12 && rs.find((x) => x.p === p).m === 1));
    const fin = estable ? pVal(sF.n, 0) / pVal(sF.d, 0) : null;
    pasos.push({ t: 'Valores inicial y final', html: `Valor inicial: $f(0^{+}) = lím_{s→∞} s F(s) = ${isFinite(ini) ? cTxt(ini) : '∞'}$<br>${estable ? `Valor final: $lím_{t→∞} f(t) = lím_{s→0} s F(s) = ${cTxt(fin)}$` : 'Valor final: no existe, porque hay polos con parte real positiva, o en el eje imaginario (salvo un polo simple en 0), y f(t) crece u oscila sin pararse.'}` });
    return { ini, fin };
  }
  function inversa(sc) {
    if (vacio(sc.F)) throw new Error('Falta F(s)');
    const ast = E.lee(sc.F, 'F(s)', ['s']);
    if (E.tieneX(ast, 't')) throw new Error('F(s) no puede llevar t');
    const F = simplifica(racional(ast)), pasos = [];
    pasos.push({ t: 'Función racional', html: `$F(s) = ${rTxt(F)}${factTxt(F) !== rTxt(F) ? ` = ${factTxt(F)}` : ''}$` });
    const inv = invierte(F, pasos), lim = limites(F, inv.rs, pasos);
    return { modo: 'inversa', F, Fcomun: rTxt(F), Ffact: factTxt(F), ...inv, f: evalTerms(inv.terms), lim, polos: inv.rs, ceros: raicesSeguras(normaliza(F).n), pasos };
  }

  /* ---------- Ecuaciones diferenciales ---------- */
  function edo(sc) {
    const orden = sc.orden === '1' ? 1 : 2, a = orden === 2 ? num(sc.a, 'el coeficiente de y″') : 0, b = num(sc.b, `el coeficiente de y′`), c = num(sc.c, 'el coeficiente de y');
    if (orden === 2 && a === 0) throw new Error('El coeficiente de y″ no puede ser 0 (sería de primer orden)');
    if (orden === 1 && b === 0) throw new Error('El coeficiente de y′ no puede ser 0');
    const y0 = num(sc.y0, 'y(0)'), v0 = orden === 2 ? num(sc.v0, 'y′(0)') : 0, pasos = [];
    let G = R([0]), g = () => 0, gts = [];
    if (!vacio(sc.g) && String(sc.g).trim() !== '0') {
      const ast = E.lee(sc.g, 'g(t)', ['t']);
      gts = terminos(ast);
      if (!gts) throw new Error('g(t) tiene que ser una suma de términos c·tⁿ·e^{at}·sen(bt) o cos(bt)');
      for (const t of gts) { const q = transTermino(t); G = rSuma(G, R(pEsc(q.n, t.c), q.d)); }
      g = evalTerms(gts);
    }
    const ec = `${orden === 2 ? `${a === 1 ? '' : cTxt(a) + ' '}y″ ` : ''}${suma([...(orden === 2 ? [] : []), { c: b, s: 'y′' }, { c, s: 'y' }]).replace(/^(?!−)/, orden === 2 ? '+ ' : '').replace(/^\+ −/, '− ')} = ${gts.length ? suma(gts.map((t) => ({ c: t.c, s: fTermTxt(t) }))) : '0'}`;
    pasos.push({ t: 'Ecuación', html: `$${ec}$, con $y(0) = ${cTxt(y0)}$${orden === 2 ? ` e $y′(0) = ${cTxt(v0)}$` : ''}` });
    const dentro = (ts) => suma(ts) === '0' ? '0' : suma(ts);
    const lado = [orden === 2 ? { c: a, s: y0 || v0 ? `(${dentro([{ c: 1, s: 's^{2}Y' }, { c: -y0, s: 's' }, { c: -v0, s: '' }])})` : 's^{2}Y' } : null, { c: b, s: y0 ? `(sY − ${cTxt(y0)})`.replace('− −', '+ ') : 'sY' }, { c, s: 'Y' }].filter(Boolean);
    pasos.push({ t: 'Transformando', html: `Con $ℒ\\{y′\\} = sY − y(0)$${orden === 2 ? ' y $ℒ\\{y″\\} = s^{2}Y − s y(0) − y′(0)$' : ''}:<br>$${suma(lado)} = ${gts.length ? factTxt(G) : '0'}$` });
    // Y(s) = (G(s) + a(s y0 + v0) + b y0)/(a s² + b s + c)
    const car = orden === 2 ? [c, b, a] : [c, b], ini = orden === 2 ? [a * v0 + b * y0, a * y0] : [b * y0];
    const Y = simplifica(rDiv(rSuma(G, R(ini)), R(car)));
    pasos.push({ t: 'Despejando Y(s)', html: `$(${pTxt(car)}) Y(s) = ${gts.length ? `${factTxt(G)}${limpia(ini).some((x) => Math.abs(x) > 1e-12) ? ` + ${pTxt(ini)}`.replace('+ −', '− ') : ''}` : pTxt(ini)}$<br>$Y(s) = ${factTxt(Y)}$` });
    const inv = invierte(Y, pasos, 'Y');
    pasos[pasos.length - 1].t = 'Solución';
    pasos[pasos.length - 1].html = pasos[pasos.length - 1].html.replace('f(t) =', 'y(t) =');
    return { modo: 'edo', orden, a, b, c, y0, v0, G, g, Y, Fcomun: rTxt(Y), Ffact: factTxt(Y), ...inv, f: evalTerms(inv.terms), polos: inv.rs, ceros: raicesSeguras(normaliza(Y).n), ec, pasos };
  }

  const MODOS = { directa, inversa, edo };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : directa(sc); }

  const ejemplos = [
    { clave: 'basica', nombre: 'Polinomio y exponencial', sc: { modo: 'directa', f: '3t^2 + 2e^(-4t) - 5' } },
    { clave: 'trig', nombre: 'Seno y coseno', sc: { modo: 'directa', f: '4sen(3t) - 2cos(3t)' } },
    { clave: 'amortiguada', nombre: 'Oscilación amortiguada', sc: { modo: 'directa', f: 'e^(-2t) cos(5t)' } },
    { clave: 'tsen', nombre: 't·sen(t) (derivar F)', sc: { modo: 'directa', f: 't sen(t)' } },
    { clave: 'hiper', nombre: 'Coseno hiperbólico por t', sc: { modo: 'directa', f: 't^2 e^(3t) + cosh(2t)' } },
    { clave: 'simples', nombre: 'Polos simples', sc: { modo: 'inversa', F: '(3s + 7)/((s + 1)(s + 3))' } },
    { clave: 'doble', nombre: 'Polo doble', sc: { modo: 'inversa', F: '(s + 5)/(s (s + 1)^2)' } },
    { clave: 'complejos', nombre: 'Polos complejos', sc: { modo: 'inversa', F: '(2s + 3)/(s^2 + 4s + 13)' } },
    { clave: 'mixta', nombre: 'Polo real y par complejo', sc: { modo: 'inversa', F: '10/((s + 1)(s^2 + 2s + 5))' } },
    { clave: 'escalon', nombre: 'Respuesta a un escalón', sc: { modo: 'inversa', F: '4/(s (s^2 + 4))' } },
    { clave: 'edo-sub', nombre: 'Oscilador amortiguado', sc: { modo: 'edo', orden: '2', a: '1', b: '2', c: '5', g: '0', y0: '1', v0: '0' } },
    { clave: 'edo-forzada', nombre: 'y″ + 3y′ + 2y = e^(−3t)', sc: { modo: 'edo', orden: '2', a: '1', b: '3', c: '2', g: 'e^(-3t)', y0: '0', v0: '1' } },
    { clave: 'edo-resonancia', nombre: 'Resonancia: y″ + y = sen t', sc: { modo: 'edo', orden: '2', a: '1', b: '0', c: '1', g: 'sen(t)', y0: '0', v0: '0' } },
    { clave: 'edo-1', nombre: 'Primer orden: y′ + 2y = 4t', sc: { modo: 'edo', orden: '1', a: '', b: '1', c: '2', g: '4t', y0: '1', v0: '' } },
  ];
  return { resolver, directa, inversa, edo, raices, residuos, racional, terminos, ejemplos, f, R, rTxt, factTxt, simplifica, pVal };
})();
if (typeof module !== 'undefined') module.exports = Laplace;
