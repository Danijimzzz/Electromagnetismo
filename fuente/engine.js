/* =====================================================================
   Motor de cálculo (sin DOM). Unidades: longitud en unidades de "a",
   ε₀ = 1 internamente; los resultados se muestran como coef·símbolos/(πε₀aⁿ).
   ===================================================================== */
const Engine = (() => {
  const PI = Math.PI;

  /* ---------- Parser de expresiones: 2*sqrt(3), 5/2, -1/(4pi), √3 ---------- */
  const FUN = {
    sqrt: Math.sqrt, ln: Math.log, log: Math.log10, exp: Math.exp, abs: Math.abs,
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
  };
  function parseExpr(src, unit, vars) {
    if (typeof src === 'number') return src;
    let s = String(src ?? '').trim();
    if (!s) throw new Error('vacío');
    s = s.replace(/π/g, 'pi').replace(/λ/g, 'lambda').replace(/σ/g, 'sigma').replace(/ρ/g, 'rho').replace(/ε₀|ε0|ε/g, 'eps0').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => '₀₁₂₃₄₅₆₇₈₉'.indexOf(c)).replace(/²/g, '^2').replace(/³/g, '^3').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/,/g, '.');
    const toks = [];
    const re = /\s*(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+|[A-Za-z_][A-Za-z_0-9]*|√|[-+*/^()])/y;
    let m;
    re.lastIndex = 0;
    while (re.lastIndex < s.length) {
      const at = re.lastIndex;
      m = re.exec(s);
      if (!m) { if (/^\s*$/.test(s.slice(at))) break; throw new Error('símbolo no válido: ' + s.slice(at, at + 3)); }
      toks.push(m[1]);
    }
    let i = 0;
    const peek = () => toks[i];
    const eat = (t) => { if (toks[i] !== t) throw new Error('se esperaba ' + t); i++; };
    const startsPrimary = (t) => t !== undefined && (/^[\d.A-Za-z_(]/.test(t) || t === '√');
    function expr() {
      let v = term();
      while (peek() === '+' || peek() === '-') { const op = toks[i++]; const r = term(); v = op === '+' ? v + r : v - r; }
      return v;
    }
    function term() {
      let v = unary();
      for (;;) {
        const t = peek();
        if (t === '*') { i++; v *= unary(); }
        else if (t === '/') { i++; v /= unary(); }
        else if (startsPrimary(t)) v *= power();
        else return v;
      }
    }
    function unary() {
      if (peek() === '-') { i++; return -unary(); }
      if (peek() === '+') { i++; return unary(); }
      return power();
    }
    function power() {
      const b = primary();
      if (peek() === '^') { i++; return Math.pow(b, unary()); }
      return b;
    }
    function primary() {
      const t = toks[i++];
      if (t === undefined) throw new Error('expresión incompleta');
      if (t === '(') { const v = expr(); eat(')'); return v; }
      if (t === '√') return power();
      if (/^[\d.]/.test(t)) return parseFloat(t);
      const id = t.toLowerCase();
      if (id === 'pi') return PI;
      if (id === 'e') return Math.E;
      if (vars && t in vars) return vars[t];
      if (unit && t === unit) return 1;
      if (FUN[id]) {
        if (peek() === '(') { i++; const v = expr(); eat(')'); return FUN[id](v); }
        return FUN[id](power());
      }
      throw new Error('desconocido: ' + t);
    }
    const v = expr();
    if (i < toks.length) throw new Error('sobra: ' + toks[i]);
    if (!isFinite(v)) throw new Error('no es un número finito');
    return v;
  }

  /* ---------- Vectores numéricos ---------- */
  const V3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    sc: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: (a) => Math.hypot(a[0], a[1], a[2]),
  };
  V3.unit = (a) => { const n = V3.norm(a); return n ? V3.sc(a, 1 / n) : [0, 0, 0]; };

  /* ---------- Reconocer números "bonitos": (n/d)·√r ---------- */
  const RADS = [1, 2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23, 26, 29, 30, 31, 33, 34, 35, 37, 38, 39, 41, 42, 43, 46, 47, 51, 53, 55];
  function rat(x, maxDen, tol = 1e-11) {
    let h0 = 0, h1 = 1, k0 = 1, k1 = 0, y = x;
    for (let it = 0; it < 40; it++) {
      const a = Math.floor(y);
      const h2 = a * h1 + h0, k2 = a * k1 + k0;
      if (k2 > maxDen) break;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (Math.abs(x - h1 / k1) <= tol * Math.abs(x)) return [h1, k1];
      const f = y - a;
      if (f < 1e-14) break;
      y = 1 / f;
    }
    return null;
  }
  const MIXR = [2, 3, 5, 6, 7, 10, 15];
  // x = (a + b·√r)/d con enteros pequeños
  function identifyMix(x) {
    for (let d = 1; d <= 96; d++) {
      const X = x * d;
      for (let m = 1; m <= 60; m++) for (const sg of [1, -1]) {
        const b = sg * m;
        for (const r of MIXR) {
          const a = X - b * Math.sqrt(r), ar = Math.round(a);
          if (ar === 0 || Math.abs(ar) > 5000) continue;
          if (Math.abs(a - ar) <= 1e-10 * Math.max(Math.abs(X), Math.abs(b * Math.sqrt(r)))) {
            const g = gcd3(Math.abs(ar), m, d);
            return { mix: true, a: ar / g, b: b / g, r, d: d / g };
          }
        }
      }
    }
    return null;
  }
  const gcd2 = (a, b) => (b ? gcd2(b, a % b) : a);
  const gcd3 = (a, b, c) => gcd2(gcd2(a, b), c);
  // devuelve {s, n, d, r} o {mix, a, b, r, d}; score = complejidad (menor = más simple)
  function identify(x, allowMix = true) {
    if (!isFinite(x)) return null;
    if (Math.abs(x) < 1e-12) return { s: 1, n: 0, d: 1, r: 1, score: 0 };
    const s = x < 0 ? -1 : 1, ax = Math.abs(x);
    for (const r of RADS) {
      const q = rat(ax / Math.sqrt(r), 1000, 1e-11);
      if (q && q[0] < 1e6) return { s, n: q[0], d: q[1], r, score: q[1] + (r > 1 ? 3 : 0) };
    }
    if (allowMix) { const m = identifyMix(x); if (m) return { ...m, score: m.d + 6 }; }
    const q = rat(ax, 100000, 2e-14);
    if (q && q[0] < 1e7) return { s, n: q[0], d: q[1], r: 1, score: q[1] };
    return null;
  }

  /* ---------- Ex: número exacto = parte algebraica + Σ α·ln β ---------- */
  class Ex {
    constructor(a = 0, L = []) { this.a = a; this.L = L; }
    static of(x) { return x instanceof Ex ? x : new Ex(x); }
    static ln(al, be) { const e = new Ex(0); addLn(e.L, al, be); return e; }
    value() { return this.a + this.L.reduce((s, t) => s + t.al * Math.log(t.be), 0); }
    add(o) { o = Ex.of(o); const r = new Ex(this.a + o.a, this.L.map((t) => ({ ...t }))); for (const t of o.L) addLn(r.L, t.al, t.be); return r; }
    sub(o) { return this.add(Ex.of(o).scale(-1)); }
    scale(k) { return new Ex(this.a * k, this.L.map((t) => ({ al: t.al * k, be: t.be }))); }
    mul(o) {
      o = Ex.of(o);
      if (!o.L.length) return this.scale(o.a);
      if (!this.L.length) return o.scale(this.a);
      return new Ex(this.value() * o.value());
    }
    isZero() { return Math.abs(this.value()) < 1e-13 && Math.abs(this.a) < 1e-13; }
  }
  function addLn(L, al, be) {
    if (Math.abs(al) < 1e-15 || !(be > 0) || Math.abs(Math.log(be)) < 1e-13) return;
    for (const t of L) {
      const s = Math.max(Math.abs(t.al), Math.abs(al));
      if (Math.abs(t.al - al) < 1e-9 * s) { t.be *= be; prune(L); return; }
      if (Math.abs(t.al + al) < 1e-9 * s) { t.be /= be; prune(L); return; }
    }
    L.push({ al, be });
  }
  function prune(L) { for (let i = L.length - 1; i >= 0; i--) if (Math.abs(Math.log(L[i].be)) < 1e-12) L.splice(i, 1); }

  /* ---------- Poly: combinación lineal de monomios simbólicos ---------- */
  const splitKey = (k) => (k ? k.split('*') : []);
  const joinKey = (arr) => arr.slice().sort().join('*');
  class Poly {
    constructor(m) { this.m = m || new Map(); }
    static sym(name, c = 1) { const p = new Poly(); p.m.set(name || '', Ex.of(c)); return p; }
    static num(c) { return Poly.sym('', c); }
    static zero() { return new Poly(); }
    add(o) {
      const r = new Poly(new Map(this.m));
      for (const [k, c] of o.m) r.m.set(k, r.m.has(k) ? r.m.get(k).add(c) : c);
      return r.clean();
    }
    sub(o) { return this.add(o.scale(-1)); }
    scale(k) { const r = new Poly(); for (const [kk, c] of this.m) r.m.set(kk, c.mul(k)); return r.clean(); }
    mul(o) {
      let r = new Poly();
      for (const [k1, c1] of this.m) for (const [k2, c2] of o.m) {
        const k = joinKey([...splitKey(k1), ...splitKey(k2)]);
        r = r.add(Poly.sym(k, c1.mul(c2)));
      }
      return r;
    }
    value(vals = {}) {
      let s = 0;
      for (const [k, c] of this.m) s += c.value() * splitKey(k).reduce((p, n) => p * (vals[n] ?? 1), 1);
      return s;
    }
    clean() {
      let mx = 0;
      for (const c of this.m.values()) mx = Math.max(mx, Math.abs(c.value()), Math.abs(c.a));
      for (const [k, c] of [...this.m]) if (Math.abs(c.value()) <= 1e-11 * Math.max(mx, 1e-300) && Math.abs(c.a) <= 1e-11 * Math.max(mx, 1e-300) && !c.L.length) this.m.delete(k);
      return this;
    }
    keys() { return [...this.m.keys()]; }
    isZero() { return this.m.size === 0; }
    coef(k) { return this.m.get(k) || new Ex(0); }
  }
  // Vectores de Poly
  const VP = {
    zero: () => [Poly.zero(), Poly.zero(), Poly.zero()],
    fromNum: (P, v) => v.map((x) => P.scale(x)),
    add: (a, b) => a.map((p, i) => p.add(b[i])),
    scaleP: (a, P) => a.map((p) => p.mul(P)),
    dot: (a, b) => a[0].mul(b[0]).add(a[1].mul(b[1])).add(a[2].mul(b[2])),
    cross: (a, b) => [
      a[1].mul(b[2]).sub(a[2].mul(b[1])),
      a[2].mul(b[0]).sub(a[0].mul(b[2])),
      a[0].mul(b[1]).sub(a[1].mul(b[0])),
    ],
    dotNum: (a, v) => a[0].scale(v[0]).add(a[1].scale(v[1])).add(a[2].scale(v[2])),
    value: (a, vals) => a.map((p) => p.value(vals)),
    keys: (a) => [...new Set(a.flatMap((p) => p.keys()))],
  };

  /* ---------- Tipos de símbolo (dimensiones) ---------- */
  // m: exponente tal que símbolo·a^m es una carga
  const KINDS = {
    q: { m: 0, label: 'Carga', hint: 'q', si: 'C' },
    lambda: { m: 1, label: 'Densidad lineal', hint: 'λ', si: 'C/m' },
    sigma: { m: 2, label: 'Densidad superficial', hint: 'σ', si: 'C/m²' },
    rho: { m: 3, label: 'Densidad volumétrica', hint: 'ρ', si: 'C/m³' },
    p: { m: -1, label: 'Momento dipolar', hint: 'p', si: 'C·m' },
  };
  // exponente de longitud de cada magnitud física (con ε₀ dividiendo)
  const QTY = {
    E: { L: -2, eps: true, si: 'N/C' }, V: { L: -1, eps: true, si: 'V' }, F: { L: -2, eps: true, si: 'N' },
    U: { L: -1, eps: true, si: 'J' }, T: { L: -1, eps: true, si: 'N·m' }, Phi: { L: 0, eps: true, si: 'N·m²/C' },
  };
  const EPS0 = 8.8541878128e-12;

  /* ---------- Integrales elípticas (AGM) y Gauss-Legendre ---------- */
  function ellipKE(m) {
    let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m), sum = m / 2, p = 0.5;
    for (let i = 0; i < 30 && Math.abs(c) > 1e-15; i++) {
      const an = (a + b) / 2; c = (a - b) / 2; b = Math.sqrt(a * b); a = an;
      p *= 2; sum += p * c * c;
    }
    const K = PI / (2 * a);
    return [K, K * (1 - sum)];
  }
  function gaussLegendre(n) {
    const x = [], w = [];
    for (let i = 1; i <= n; i++) {
      let z = Math.cos(PI * (i - 0.25) / (n + 0.5)), pp;
      for (let it = 0; it < 100; it++) {
        let p1 = 1, p2 = 0;
        for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; }
        pp = n * (z * p1 - p2) / (z * z - 1);
        const z1 = z; z = z1 - p1 / pp;
        if (Math.abs(z - z1) < 1e-15) break;
      }
      x.push(z); w.push(2 / ((1 - z * z) * pp * pp));
    }
    return { x, w };
  }
  const GL = {};
  const gl = (n) => GL[n] || (GL[n] = gaussLegendre(n));


  return { PI, EPS0, parseExpr, V3, identify, Ex, Poly, VP, KINDS, QTY, splitKey, joinKey, ellipKE, gl };
})();
if (typeof module !== 'undefined') module.exports = Engine;
