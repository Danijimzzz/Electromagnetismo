const Taylor = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const { numTxt, dec4, exacto } = E;
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const FACT = [1]; for (let k = 1; k <= 40; k++) FACT[k] = FACT[k - 1] * k;
  const MAXN = 25;
  const f = (x, d = 4) => dec4(x, d);

  function leeNum(s, nom) {
    const n = E.lee(s, nom);
    if (E.tieneX(n)) throw new Error(`${nom} cannot contain x`);
    const v = E.valor(n, 0);
    if (!isFinite(v)) throw new Error(`${nom} is not a number`);
    return v;
  }
  const fk = (k) => (k === 0 ? 'f' : k === 1 ? 'f′' : k === 2 ? 'f″' : `f^{(${k})}`);
  function valTxt(v) {
    const e = exacto(v), t = numTxt(v);
    return e && e.s ? `${t} ≈ ${f(v, 5)}` : t;
  }

  function base(a) {
    if (Math.abs(a) < 1e-14) return { b: 'x', par: false };
    return { b: `(x ${a > 0 ? '−' : '+'} ${numTxt(Math.abs(a))})`, par: true };
  }
  const potTxt = (B, k) => (k === 0 ? '' : k === 1 ? B.b : `${B.b}^{${k}}`);
  function exactoC(c, k) {
    const e = exacto(c);
    if ((e && (e.s || e.q <= 1000)) || k < 1) return e;
    for (const b of [2, 3, 5, 10]) { const L = Math.log(b) ** k, r = exacto(c / L, 1000); if (r && !r.s) return { p: r.p, q: r.q, s: k === 1 ? `ln ${b}` : `(ln ${b})^{${k}}` }; }
    return e;
  }
  function termino(c, k, B) {
    const pw = potTxt(B, k), e = exactoC(c, k);
    if (!e) return { neg: c < 0, s: [f(Math.abs(c), 6), pw].filter(Boolean).join(' ') };
    const P = Math.abs(e.p);
    if (pw && /ln/.test(e.s)) {
      const arriba = [P !== 1 ? String(P) : '', pw, e.s].filter(Boolean).join(' ');
      return { neg: e.p < 0, s: e.q === 1 ? arriba : `{${arriba}}/{${e.q}}` };
    }
    if (B.par && pw) {
      const cf = [P !== 1 || (!e.s && e.q !== 1) ? String(P) : '', e.s].filter(Boolean).join(' ');
      return { neg: e.p < 0, s: [e.q === 1 ? cf : `{${cf}}/{${e.q}}`, pw].filter(Boolean).join(' ') };
    }
    const arriba = [P !== 1 || (!e.s && !pw) ? String(P) : '', e.s, pw].filter(Boolean).join(' ');
    return { neg: e.p < 0, s: e.q === 1 ? arriba : `{${arriba}}/{${e.q}}` };
  }
  function polinomio(cs, a) {
    const B = base(a), ts = [];
    cs.forEach((c, k) => { if (Math.abs(c) > 1e-13 * Math.max(1, ...cs.map(Math.abs))) ts.push(termino(c, k, B)); });
    if (!ts.length) return '0';
    return ts.map((t, i) => (i ? `${t.neg ? '−' : '+'} ${t.s}` : `${t.neg ? '−' : ''}${t.s}`)).join(' ');
  }

  const alt = (k) => (k % 2 ? -1 : 1);
  const CONOCIDOS = [
    { f: 'e^{x}', c: (k) => 1 / FACT[k], gen: 'Σ_{k=0}^{∞} {x^k}/{k!}', conv: 'for all x', R: Infinity },
    { f: 'sen x', c: (k) => (k % 2 ? alt((k - 1) / 2) / FACT[k] : 0), gen: 'Σ_{k=0}^{∞} {(−1)^k x^{2k+1}}/{(2k+1)!}', conv: 'for all x', R: Infinity },
    { f: 'cos x', c: (k) => (k % 2 ? 0 : alt(k / 2) / FACT[k]), gen: 'Σ_{k=0}^{∞} {(−1)^k x^{2k}}/{(2k)!}', conv: 'for all x', R: Infinity },
    { f: 'senh x', c: (k) => (k % 2 ? 1 / FACT[k] : 0), gen: 'Σ_{k=0}^{∞} {x^{2k+1}}/{(2k+1)!}', conv: 'for all x', R: Infinity },
    { f: 'cosh x', c: (k) => (k % 2 ? 0 : 1 / FACT[k]), gen: 'Σ_{k=0}^{∞} {x^{2k}}/{(2k)!}', conv: 'for all x', R: Infinity },
    { f: 'ln (1 + x)', c: (k) => (k ? alt(k + 1) / k : 0), gen: 'Σ_{k=1}^{∞} {(−1)^{k+1} x^k}/{k}', conv: 'for −1 < x ≤ 1', R: 1 },
    { f: '{1}/{1 − x}', c: () => 1, gen: 'Σ_{k=0}^{∞} x^k', conv: 'for |x| < 1 (geometric series)', R: 1 },
    { f: '{1}/{1 + x}', c: (k) => alt(k), gen: 'Σ_{k=0}^{∞} (−1)^k x^k', conv: 'for |x| < 1 (geometric series)', R: 1 },
    { f: 'arctg x', c: (k) => (k % 2 ? alt((k - 1) / 2) / k : 0), gen: 'Σ_{k=0}^{∞} {(−1)^k x^{2k+1}}/{2k+1}', conv: 'for −1 ≤ x ≤ 1', R: 1 },
  ];
  const binom = (al, k) => { let r = 1; for (let j = 0; j < k; j++) r *= (al - j) / (j + 1); return r; };
  function conocido(cs0) {
    const iguales = (g) => cs0.every((c, k) => Math.abs(c - g(k)) <= 1e-9 * Math.max(1, Math.abs(g(k))));
    const k = CONOCIDOS.find((q) => iguales(q.c));
    if (k) return k;
    if (Math.abs(cs0[0] - 1) < 1e-12 && Math.abs(cs0[1]) > 1e-12) {
      const al = cs0[1], ent = Number.isInteger(+al.toPrecision(12)) && al > 0;
      if (!ent && cs0.length > 3 && iguales((j) => binom(al, j))) return { f: `(1 + x)^{${numTxt(al)}}`, c: (j) => binom(al, j), gen: `Σ_{k=0}^{∞} binom(${numTxt(al)}, k) x^k`, conv: 'for |x| < 1 (binomial series)', R: 1 };
    }
    return null;
  }

  function serieEvitable(ast, a, N) {
    try { E.serie.quitados = 0; const s = [...E.serie(ast, a, N + 10, { evitable: true })]; if (E.serie.quitados > 10) return null; return s.slice(0, N + 1).map((c) => (Math.abs(c) < 1e-14 ? 0 : c)); } catch (e) { return null; }
  }
  const serieSegura = (ast, t, N) => { try { return [...E.serie(ast, t, N)]; } catch (e) { const s = serieEvitable(ast, t, N); if (s) return s; throw e; } };
  const NC = 80;
  function bonito(v, tol) {
    const mcd = (x, y) => (y ? mcd(y, x % y) : x), cerca = (w) => Math.abs(w - v) < tol * Math.max(v, 1e-300);
    for (let q = 1; q <= 12; q++) { const pq = Math.round(v * q); if (pq > 0 && cerca(pq / q)) return { v: pq / q, txt: numTxt(pq / q) }; }
    for (let q = 1; q <= 6; q++) { const pq = Math.round((v * q) / Math.PI); if (pq > 0 && pq <= 24 && cerca((pq * Math.PI) / q)) { const d = mcd(pq, q), P = pq / d, Q = q / d, ar = P === 1 ? 'π' : `${P} π`; return { v: (pq * Math.PI) / q, txt: Q === 1 ? ar : `{${ar}}/{${Q}}` }; } }
    for (let q = 1; q <= 4; q++) {
      const pq = Math.round(v * v * q); if (!(pq > 0 && pq <= 400 && cerca(Math.sqrt(pq / q)))) continue;
      let n = pq * q, m = 1; for (let d = 2; d * d <= n; d++) while (n % (d * d) === 0) { n /= d * d; m *= d; }
      const d = mcd(m, q), M = m / d, Q = q / d, ar = M === 1 ? `√{${n}}` : `${M} √{${n}}`;
      return { v: Math.sqrt(pq / q), txt: Q === 1 ? ar : `{${ar}}/{${Q}}` };
    }
    return null;
  }
  const esPol = (n) => n.t === 'n' || n.t === 'c' || n.t === 'x' || (n.t === 'neg' ? esPol(n.a) : n.t === '+' || n.t === '-' || n.t === '*' ? esPol(n.a) && esPol(n.b) : n.t === '/' ? esPol(n.a) && (n.b.t === 'n' || n.b.t === 'c') : n.t === '^' ? esPol(n.a) && n.b.t === 'n' && Number.isInteger(n.b.v) && n.b.v >= 0 : false);
  function ajusteRadio(ast, a) {
    let cs;
    try { cs = [...E.serie(ast, a, NC)]; } catch (e) { try { E.serie.quitados = 0; cs = [...E.serie(ast, a, NC + 10, { evitable: true })].slice(0, NC + 1); if (E.serie.quitados > 10) return null; } catch (e2) { return null; } }
    if (cs.some((c) => !isFinite(c))) return null;
    const tope = Math.max(...cs.map(Math.abs)) * 1e-280 || 1e-300;
    if (esPol(ast) || cs.slice(20).every((c) => Math.abs(c) <= tope)) return { R: Infinity, cs }; // un polinomio
    const env = (k) => Math.max(...cs.slice(k, k + 6).map(Math.abs));
    const vivos = []; for (let k = 20; k <= 74; k++) if (Math.abs(cs[k]) > 1e-9 * Math.max(...cs.slice(Math.max(0, k - 3), k + 4).map(Math.abs))) vivos.push(k);
    const limpia = vivos.length >= 16 && vivos.every((k) => Math.abs(cs[k]) > 0.5 * Math.min(env(k), Math.max(...cs.slice(k - 5, k + 1).map(Math.abs))));
    const minimos = (X, y) => {
      const A = [0, 1, 2].map((u) => [0, 1, 2].map((v) => X.reduce((t, r) => t + r[u] * r[v], 0))), b = [0, 1, 2].map((u) => X.reduce((t, r, m) => t + r[u] * y[m], 0));
      for (let c = 0; c < 3; c++) { let pv = c; for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[pv][c])) pv = r; [A[c], A[pv]] = [A[pv], A[c]]; [b[c], b[pv]] = [b[pv], b[c]]; if (Math.abs(A[c][c]) < 1e-300) return null; for (let r = 0; r < 3; r++) if (r !== c) { const q = A[r][c] / A[c][c]; for (let v = 0; v < 3; v++) A[r][v] -= q * A[c][v]; b[r] -= q * b[c]; } }
      return b.map((v, c) => v / A[c][c]);
    };
    const ajusta = (k0, k1) => {
      const ks = []; for (let k = k0; k <= k1; k++) if (limpia ? vivos.includes(k) : env(k) > tope && isFinite(env(k))) ks.push(k);
      if (ks.length < 8) return null;
      const X = ks.map((k) => [k, Math.log(k), 1]), y = ks.map((k) => -Math.log(limpia ? Math.abs(cs[k]) : env(k)));
      const z = minimos(X, y); return z && { R: Math.exp(z[0]), alfa: z[1] };
    };
    const pend = (k0, k1) => (Math.log(env(k0)) - Math.log(env(k1))) / (k1 - k0), p1 = pend(20, 34), p2 = pend(56, 70);
    if (!isFinite(p1) || !isFinite(p2)) return env(60) <= tope ? { R: Infinity, cs } : null;
    if (p2 - p1 > 0.25) return { R: Infinity, cs };
    const fino = (rs) => {
      if (rs.length < 12) return null;
      const z = minimos(rs.map(([k]) => [1, 1 / k, 1 / (k * k)]), rs.map((r) => r[1])); if (!z || !(z[0] > 0)) return null;
      const res = Math.max(...rs.map(([k, r]) => Math.abs(z[0] + z[1] / k + z[2] / (k * k) - r))) / z[0];
      return res < 2e-3 ? { R: z[0], res } : null;
    };
    const r1 = [], r2 = [];
    if (limpia) { const paso = Math.min(...vivos.slice(1).map((k, m) => k - vivos[m])); for (const k of vivos) if (k >= 30 && vivos.includes(k - paso)) r1.push([k, Math.abs(cs[k - paso] / cs[k]) ** (1 / paso)]); }
    for (let k = 30; k <= 78; k++) { const B2 = (cs[k + 1] * cs[k - 1] - cs[k] ** 2) / (cs[k] * cs[k - 2] - cs[k - 1] ** 2); if (B2 > 0 && isFinite(B2)) r2.push([k, 1 / Math.sqrt(B2)]); }
    const f1 = fino(r1), f2 = fino(r2), Rf = f1 && f2 ? (f1.res <= f2.res ? f1.R : f2.R) : f1 ? f1.R : f2 ? f2.R : null;
    const g = Rf ? { R: Rf } : ajusta(24, 72), g2 = Rf ? g : ajusta(36, 72);
    if (!g || !g2 || !(g.R > 0) || Math.abs(g.R - g2.R) > 0.02 * g.R) return null;
    const b = bonito(g.R, Rf ? 2e-4 : 2e-3), R = b ? b.v : g.R;
    let sa = 0, na = 0; for (let k = 40; k <= 72; k++) { const e = env(k); if (e > tope) { const e2 = env(Math.round(k / 2)); if (e2 > tope) { sa += (-Math.log(e) - k * Math.log(R) + Math.log(e2) + Math.round(k / 2) * Math.log(R)) / Math.log(k / Math.round(k / 2)); na++; } } }
    return { R, alfa: na ? sa / na : g.alfa, cs, txt: b ? b.txt : null };
  }
  const radio = (ast, a) => { const g = ajusteRadio(ast, a); return g ? g.R : null; };
  function singularidad(ast, a, R) {
    if (!E.valorC || !isFinite(R)) return null;
    const M = 1440, fz = (re, im) => { try { return E.valorC(ast, { re, im }); } catch (e) { return null; } };
    const par = (t, rr) => { const z = fz(a + rr * Math.cos(t), rr * Math.sin(t)), w = fz(a + rr * Math.cos(t + 1e-7), rr * Math.sin(t + 1e-7)); return z && w && isFinite(z.re) && isFinite(z.im) && isFinite(w.re) && isFinite(w.im) ? [Math.hypot(z.re, z.im), Math.hypot(z.re - w.re, z.im - w.im) / (R * 1e-7)] : [Infinity, Infinity]; };
    const ps = []; for (let m = 0; m < M; m++) ps.push(par((2 * Math.PI * m) / M, R * (1 - 1e-3)));
    const mediana = (u) => { const o = u.filter(isFinite).sort((p, q) => p - q); return Math.max(o[Math.floor(o.length / 2)] || 0, 1e-300); }, mf = mediana(ps.map((q) => q[0])), md = mediana(ps.map((q) => q[1]));
    const nota = (q) => Math.max(q[0] / mf, q[1] / md), v = ps.map(nota), mx = Math.max(...v), k = v.indexOf(mx);
    if (!(mx > 8)) return null;
    const mide = (t) => nota(par(t, R * (1 - 1e-5)));
    let lo = (2 * Math.PI * (k - 1)) / M, hi = (2 * Math.PI * (k + 1)) / M;
    for (let it = 0; it < 60 && isFinite(mx); it++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (mide(m1) < mide(m2)) lo = m1; else hi = m2; }
    const t = isFinite(mx) ? (lo + hi) / 2 : (2 * Math.PI * k) / M, re = a + R * Math.cos(t), im = R * Math.sin(t), l = (x) => (Math.abs(x) < 1e-6 * Math.max(1, R) ? 0 : +x.toPrecision(7));
    const bo = (x) => { const y = l(x), b = y ? bonito(Math.abs(y), 1e-5 / Math.min(1, Math.abs(y) / Math.max(1, R))) : null; return b ? { v: Math.sign(y) * b.v, txt: (y < 0 ? '−' : '') + b.txt } : { v: y, txt: numTxt(y) }; };
    const br = bo(re), bi = bo(Math.abs(im));
    return { re: br.v, im: bi.v, reTxt: br.txt, imTxt: bi.txt };
  }
  function extremo(g, sg) {
    const { cs, R, alfa } = g, al = Math.round(alfa * 2) / 2;
    if (Math.abs(alfa - al) > 0.12) return null;
    const ss = [], ik = []; for (let k = 30; k < NC - 6; k++) { const t = cs[k] * (sg < 0 && k % 2 ? -1 : 1); if (Math.abs(cs[k]) * R ** k > 1e-12 * Math.max(...cs.slice(k, k + 6).map((c, m) => Math.abs(c) * R ** (k + m)))) { ss.push(Math.sign(t)); ik.push(k); } }
    if (ik.some((k, m) => m > 1 && k - ik[m - 1] !== ik[1] - ik[0])) return null; // ceros sin patrón: no se decide aquí
    if (ss.length < 8) return null;
    const mismo = ss.every((q) => q === ss[0]), alterna = ss.every((q, m) => m === 0 || q === -ss[m - 1]);
    if (al <= 0) return { conv: false, por: 'the terms do not tend to 0' };
    if (!mismo && !alterna) return null; // signos sin patrón (singularidad compleja): no se decide aquí
    if (al > 1) return { conv: true, por: `the terms decrease like 1/k^{${numTxt(al)}} and the series converges absolutely` };
    if (mismo) return { conv: false, por: `the terms have the same sign and decrease only like 1/k^{${numTxt(al)}}, like the harmonic series` };
    if (alterna) return { conv: true, por: 'it is an alternating series with terms that decrease to 0 (Leibniz test)' };
    return null;
  }

  const nu = (v) => ({ t: 'n', v }), op = (t, a, b) => ({ t, a, b }), esUno = (n) => n.t === 'n' && n.v === 1;
  const por = (a, b) => (esUno(a) ? b : esUno(b) ? a : op('*', a, b));
  function cociente(n) {
    const c = (m) => cociente(m), uno = nu(1);
    switch (n.t) {
      case 'neg': { const q = c(n.a); return { N: { t: 'neg', a: q.N }, D: q.D }; }
      case '+': case '-': { const p = c(n.a), q = c(n.b); return esUno(p.D) && esUno(q.D) ? { N: op(n.t, p.N, q.N), D: uno } : { N: op(n.t, por(p.N, q.D), por(q.N, p.D)), D: por(p.D, q.D) }; }
      case '*': { const p = c(n.a), q = c(n.b); return { N: por(p.N, q.N), D: por(p.D, q.D) }; }
      case '/': { const p = c(n.a), q = c(n.b); return { N: por(p.N, q.D), D: por(p.D, q.N) }; }
      case '^': {
        if (n.b.t === 'n' && Number.isInteger(n.b.v) || (n.b.t === 'neg' && n.b.a.t === 'n' && Number.isInteger(n.b.a.v))) {
          const k = n.b.t === 'n' ? n.b.v : -n.b.a.v, p = c(n.a), e = nu(Math.abs(k)), pw = (m) => (esUno(m) ? m : op('^', m, e));
          return k >= 0 ? { N: pw(p.N), D: pw(p.D) } : { N: pw(p.D), D: pw(p.N) };
        }
        const p = c(n.a), q = c(n.b), dentro = (r) => (esUno(r.D) ? r.N : op('/', r.N, r.D));
        return { N: op('^', dentro(p), dentro(q)), D: uno };
      }
      case 'fn': { const p = c(n.a); return { N: { ...n, a: esUno(p.D) ? p.N : op('/', p.N, p.D) }, D: uno }; }
    }
    return { N: n, D: uno };
  }
  const inversa = (n) => (!n || typeof n !== 'object' ? n : n.t === 'x' && !n.n ? op('/', nu(1), { t: 'x' }) : Object.fromEntries(Object.entries(n).map(([k, v]) => [k, inversa(v)])));
  const INF = /^\s*([+\-−]?)\s*(?:inf(?:inito)?|∞|oo)\s*$/i;
  function limite(sc) {
    const ast0 = E.lee(sc.f, 'The function');
    if (vacio(sc.a)) throw new Error('The point a is missing');
    const mi = INF.exec(String(sc.a)), a = mi ? (mi[1] === '-' || mi[1] === '−' ? -Infinity : Infinity) : leeNum(sc.a, 'The point a'), pasos = [];
    const aTxt = isFinite(a) ? numTxt(a) : a > 0 ? '∞' : '−∞', fin = (r) => ({ modo: 'limite', f: E.texto(E.simp(ast0)), a, aTxt, fv: (x) => E.valor(ast0, x), pasos, ...r });
    const enT = (tx) => tx.replace(/x/g, 't');
    let ast = ast0, pt = a, lado = 0, V = (tx) => tx;
    if (!isFinite(a)) {
      ast = inversa(ast0); pt = 0; lado = a > 0 ? 1 : -1; V = enT;
      pasos.push({ t: 'Change of variable', html: `With $x = 1/t$, when $x → ${aTxt}$ the new variable $t → 0$ from the ${lado > 0 ? 'right' : 'left'}, and there it can be expanded by Taylor.` });
    }
    if (ast.t === '^' && E.tieneX(ast.b)) {
      pasos.push({ t: 'Power with the variable in the exponent', html: `Write $f^g = e^{g · ln f}$ and compute the limit of the exponent, $g · ln f$${isFinite(a) ? '' : ' (now with the variable t)'}.` });
      const r = limCociente(op('*', ast.b, { t: 'fn', f: 'ln', a: ast.a }), pt, lado, pasos, V, isFinite(a) ? aTxt : '0'), L = r.val;
      const val = Number.isNaN(L) ? NaN : L === Infinity ? Infinity : L === -Infinity ? 0 : Math.exp(L), txt = Number.isNaN(val) ? 'does not exist' : val === Infinity ? '+∞' : val === 0 ? '0' : L === 0 ? '1' : L === 1 ? 'e' : `e^{${r.txt}} ≈ ${f(val, 6)}`;
      pasos.push({ t: 'Limit', html: Number.isNaN(L) ? 'The exponent has no limit, so neither does the power.' : `The exponent tends to $${r.txt}$, so the limit is <b>$${isFinite(L) && L !== 0 && L !== 1 ? txt : `e^{${r.txt}} = ${txt}`}$</b>.` });
      return fin({ val, txt, oN: r.oN, oD: r.oD, exponente: L });
    }
    const r = limCociente(ast, pt, lado, pasos, V, isFinite(a) ? aTxt : '0');
    return fin(r);
  }
  function limCociente(ast, a, lado, pasos, V, aTxt) {
    const q = cociente(ast), N = E.simp(q.N), D = E.simp(q.D), vx = V('x');
    const ser = (n) => { try { return [...E.serie(n, a, 14)]; } catch (e) { const s2 = serieEvitable(n, a, 13); if (s2) return [...s2, 0]; throw new Error(`Cannot expand ${V(E.texto(E.simp(n))).replace(/[{}]/g, '')} at ${vx} = ${f(a)} (${e.detalle || e.message}): the limit cannot be found with Taylor; try writing it another way`); } };
    if (ast.t !== '/' && !(D.t === 'n' && D.v === 1)) pasos.push({ t: 'It is written as a quotient', html: `$${V(E.texto(E.simp(ast)))} = {${V(E.texto(N))}}/{${V(E.texto(D))}}$` });
    const sN = ser(N), sD = ser(D), esc = (s) => Math.max(1, ...s.map(Math.abs));
    const orden = (s) => s.findIndex((v) => Math.abs(v) > 1e-10 * esc(s));
    const oN = orden(sN), oD = orden(sD);
    if (oD < 0) throw new Error('The denominator is 0 near a');
    const B = base(a), term = (c, k) => V(polinomio(Array.from({ length: k + 1 }, (_, j) => (j === k ? c : 0)), a));
    const desarrollo = (s, o) => { const cs = Array.from({ length: Math.min(14, o + 3) }, (_, j) => (j < o ? 0 : s[j])); return V(`${polinomio(cs, a)}${s.slice(cs.length).some((v) => Math.abs(v) > 1e-12) ? ' + …' : ''}`); };
    pasos.push({ t: 'The idea', html: `The numerator and denominator are replaced by their Taylor expansion at ${vx} = $${aTxt}$ and the first nonvanishing terms are compared.` });
    pasos.push({ t: 'Numerator', html: oN < 0 ? 'The numerator is 0 near a.' : `$${V(E.texto(N))} = ${desarrollo(sN, oN)}$` });
    pasos.push({ t: 'Denominator', html: `$${V(E.texto(D))}${desarrollo(sD, oD) === V(E.texto(D)) ? '' : ` = ${desarrollo(sD, oD)}`}$` });
    const par = (t) => (/[/−]/.test(t) ? `(${t})` : t);
    let val, txt;
    if (oN < 0 || oN > oD) { val = 0; txt = '0'; pasos.push({ t: 'Limit', html: `The numerator starts at a higher order (${oN < 0 ? '∞' : oN} > ${oD}), so the quotient tends to <b>0</b>.` }); }
    else if (oN === oD) { val = sN[oN] / sD[oD]; txt = numTxt(val); pasos.push({ t: 'Limit', html: `Both start at $${V(potTxt(B, oN)) || '1'}$: it is simplified and the quotient of the coefficients remains,<br>$lím_{${vx} → ${aTxt}} {${term(sN[oN], oN)}}/{${term(sD[oD], oD)}} ${Math.abs(sD[oD] - 1) < 1e-12 ? '' : `= ${par(numTxt(sN[oN]))}/${par(numTxt(sD[oD]))} `}= $ <b>$${txt}$</b>` }); }
    else {
      const k = oD - oN, sg = sN[oN] / sD[oD];
      const s1 = lado && k % 2 ? sg * lado : sg, unLado = lado !== 0 || k % 2 === 0;
      val = !unLado ? NaN : s1 > 0 ? Infinity : -Infinity;
      txt = !unLado ? 'does not exist' : s1 > 0 ? '+∞' : '−∞';
      pasos.push({ t: 'Limit', html: `The denominator starts at a higher order (${oD} > ${oN}): the quotient behaves like $${par(numTxt(sg))}/${V(potTxt(B, k))}$, so ${!unLado ? `from the left and from the right it goes to infinities of opposite sign: <b>the limit does not exist</b> (the one-sided limits are ${sg > 0 ? '−∞ and +∞' : '+∞ and −∞'})` : `it tends to <b>${txt}</b>`}.` });
    }
    return { val, txt, oN, oD };
  }

  function resolver(sc) {
    if (sc.modo === 'limite') return limite(sc);
    const ast = E.lee(sc.f, 'The function');
    if (vacio(sc.a)) throw new Error('The point a is missing');
    const a = leeNum(sc.a, 'The point a');
    if (vacio(sc.n)) throw new Error('The degree n is missing');
    const n = +String(sc.n).trim();
    if (!Number.isInteger(n) || n < 0 || n > MAXN) throw new Error(`The degree n must be an integer between 0 and ${MAXN}`);
    const hayX0 = !vacio(sc.x0), x0 = hayX0 ? leeNum(sc.x0, 'The point x₀') : null;
    let cs, evitable = false;
    try { cs = [...E.serie(ast, a, n + 1)].map((c) => (Math.abs(c) < 1e-14 ? 0 : c)); } catch (e) {
      const s2 = serieEvitable(ast, a, n + 1);
      if (!s2) throw new Error(e.message.replace('x = a', `x = ${f(a)}`));
      cs = s2; evitable = true;
    }
    const der = cs.map((c, k) => c * FACT[k]);
    const coef = cs.slice(0, n + 1);
    const P = (x, k = n) => { let s = 0; for (let j = Math.min(k, n); j >= 0; j--) s = s * (x - a) + coef[j]; return s; };
    const fv = (x) => E.valor(ast, x);
    const fTxt = E.texto(E.simp(ast)), B = base(a), Pn = `P_{${n}}`;
    const pol = polinomio(coef, a);
    const pasos = [];
    const aTxt = numTxt(a);

    if (evitable) pasos.push({ t: 'Removable singularity', html: `f is not defined at x = $${aTxt}$ (it gives 0/0), but the limit exists: the numerator and denominator are expanded and the common power of $${potTxt(B, 1)}$ is simplified. So f is extended with $f(${aTxt}) = ${numTxt(cs[0])}$ and has a Taylor expansion.` });
    pasos.push({ t: 'Taylor\'s formula', html: `The Taylor polynomial of degree ${n} of f at x = ${'$' + aTxt + '$'} is $${Pn}(x) = Σ_{k=0}^{${n}} {f^{(k)}(${aTxt})}/{k!} ${potTxt(B, 1)}^k$, so f and its derivatives up to order ${n} at that point are needed.${Math.abs(a) < 1e-14 ? ' Since a = 0, it is also called the Maclaurin polynomial.' : ''}` });

    const lineas = [];
    let d = ast, escrita = true;
    for (let k = 0; k <= n; k++) {
      if (k) { if (escrita && k <= 6) { try { d = E.deriva(d); } catch (e) { escrita = false; } } else escrita = false; }
      const txt = escrita ? E.texto(k ? d : E.simp(d)) : null;
      if (txt && txt.length > 90) escrita = false;
      const izq = escrita ? `$${fk(k)}(x) = ${txt}$ &ensp;⇒&ensp; ` : '';
      lineas.push(`${izq}$${fk(k)}(${aTxt}) = ${valTxt(der[k])}$`);
    }
    pasos.push({ t: `Derivatives at x = ${'$' + aTxt + '$'}`, html: lineas.join('<br>') + (escrita ? '' : '<br><small>(the longer derivatives are given only at the point)</small>') });

    pasos.push({ t: 'Coefficients', html: coef.map((c, k) => `$c_{${k}} = {${fk(k)}(${aTxt})}/{${k}!} = ${numTxt(c)}$`).join('<br>') });
    pasos.push({ t: `Taylor polynomial of degree ${n}`, html: `$${Pn}(x) = ${pol}$` });

    let con = null;
    if (Math.abs(a) < 1e-14) {
      try { con = conocido([...E.serie(ast, 0, 14)]); } catch (e) { con = null; }
      if (con) pasos.push({ t: 'Known expansion', html: `It is the Maclaurin expansion of $${con.f} = ${con.gen}$, which converges ${con.conv}.${con.R < Infinity && hayX0 && Math.abs(x0) > con.R ? ` Careful: x₀ = ${f(x0)} is outside, so when the degree increases the polynomial does not approach f(x₀).` : ''}` });
    }

    const ajR = ajusteRadio(ast, a), R = con ? con.R : ajR ? ajR.R : null;
    const Rs = R === null || R === Infinity ? null : !con && ajR.txt ? ajR.txt : numTxt(R), Rtxt = Rs === null ? null : `R ${con || ajR.txt ? '=' : '≈'} ${Rs}`;
    const centro = Math.abs(a) < 1e-14 ? 'x' : `x − ${aTxt}`.replace('− −', '+ ');
    let sing = null, intervalo = null;
    if (R !== null && R !== Infinity) {
      try { sing = singularidad(ast, a, R); } catch (e) { sing = null; }
      const gE = ajR && isFinite(ajR.R) && Math.abs(ajR.R - R) < 1e-9 * R ? ajR : null, eI = gE && extremo(gE, -1), eD = gE && extremo(gE, 1), lo = a - R, hi = a + R;
      intervalo = { lo, hi, izq: eI ? eI.conv : null, der: eD ? eD.conv : null };
      const singTxt = sing ? ` The nearest singularity of f is at ${sing.im ? `the complex numbers $z = ${sing.reTxt === '0' ? '' : `${sing.reTxt} `}± ${sing.imTxt === '1' ? '' : `${sing.imTxt} `}i$` : `$x = ${sing.reTxt}$`}, at distance $${Rs}$ from a${sing.im ? ': that is why the series stops converging even though f has no problem over the real numbers' : ''}.` : '';
      const irr = /[√π]/.test(Rs), xT = (x, sg) => (!irr ? numTxt(x) : Math.abs(a) < 1e-14 ? `${sg}${Rs}` : `${aTxt} ${sg || '+'} ${Rs}`);
      const ext = (e, x) => (e ? `at $x = ${x}$ ${e.conv ? '<b>converges</b>' : '<b>diverges</b>'} (${e.por})` : `at $x = ${x}$ it has to be studied separately`);
      const loT = xT(lo, '−'), hiT = xT(hi, '');
      intervalo.txt = `${intervalo.izq ? '[' : '('}${loT}, ${hiT}${intervalo.der ? ']' : ')'}`;
      pasos.push({ t: 'Radius and interval of convergence', html: `${con ? `The known expansion has radius $R = ${Rs}$.` : `With the root test, $1/R = lim sup |c_k|^{1/k}$, the coefficients give $${Rtxt}$: the series converges for $|${centro}| < ${Rs}$ and diverges outside.`}${singTxt}<br>At the endpoints: ${ext(eI, loT)}; ${ext(eD, hiT)}.<br>Interval of convergence: <b>$${intervalo.txt}$</b>${intervalo.izq === null || intervalo.der === null ? ' (an endpoint left undecided)' : ''}.${hayX0 && Math.abs(x0 - a) > R ? ` Careful: x₀ = ${f(x0)} is outside, so when the degree increases the polynomial does not approach f(x₀).` : ''}` });
    } else if (R === Infinity && !con) pasos.push({ t: 'Radius of convergence', html: 'The coefficients become small very quickly (like 1/k!): the Taylor series converges for every x (radius ∞, interval $(−∞, ∞)$).' });
    let fx0 = null, px0 = null, err = null, cota = null, M = null, cotaNota = '';
    if (hayX0) {
      fx0 = fv(x0); px0 = P(x0);
      if (!isFinite(fx0)) throw new Error(`f is not defined at x₀ = ${f(x0)}`);
      err = Math.abs(fx0 - px0);
      const h = x0 - a, vals = coef.map((c, k) => c * h ** k);
      const sumandos = vals.filter((v) => Math.abs(v) > 1e-15).map((v, i) => (i ? `${v < 0 ? '−' : '+'} ${f(Math.abs(v), 5)}` : f(v, 5))).join(' ') || '0';
      pasos.push({ t: `Approximation of f(${f(x0)})`, html: `$${Pn}(${f(x0, 6)}) = ${sumandos} = ${f(px0, 7)}$<br>The exact value is $f(${f(x0, 6)}) = ${f(fx0, 7)}$, so the error made is $|f(x_0) − ${Pn}(x_0)| = ${f(err, 3)}$.` });
      if (Math.abs(h) > 1e-14) {
        let ok = true; M = 0;
        for (let i = 0; i <= 200; i++) {
          const t = a + (h * i) / 200;
          try { const s = serieSegura(ast, t, n + 1); M = Math.max(M, Math.abs(s[n + 1] * FACT[n + 1])); } catch (e) { ok = false; break; }
        }
        if (ok && M < 1e-12) { cota = 0; pasos.push({ t: 'Error bound (Lagrange remainder)', html: `The derivative of order ${n + 1} is 0, so the Lagrange remainder is 0: the Taylor polynomial coincides with f.` }); }
        else if (ok && isFinite(M)) {
          cota = (M * Math.abs(h) ** (n + 1)) / FACT[n + 1];
          pasos.push({ t: 'Error bound (Lagrange remainder)', html: `$R_{${n}}(x) = {${fk(n + 1)}(ξ)}/{${n + 1}!} ${potTxt(B, n + 1)}$, with ξ between ${'$' + aTxt + '$'} and x. Between a and x₀ the maximum of $|${fk(n + 1)}|$ is $M ≈ ${f(M, 4)}$, so<br>$|R_{${n}}(${f(x0, 6)})| ≤ {M |x_0 − a|^{${n + 1}}}/{${n + 1}!} = {${f(M, 4)} · ${f(Math.abs(h), 4)}^{${n + 1}}}/{${FACT[n + 1]}} = ${f(cota, 3)}$` + (err <= cota * (1 + 1e-9) + 1e-15 ? ', and the true error is below that.' : '.') });
        } else { cotaNota = 'The next derivative is not bounded between a and x₀ (f is not differentiable at some point), so there is no Lagrange bound.'; pasos.push({ t: 'Error bound', html: cotaNota }); }
      }
    }
    return { f: fTxt, a, n, x0, coef, der, pol, Pn, P, fv, fx0, px0, err, cota, M, conocido: con, pasos, aTxt, evitable, R, Rtxt, intervalo, singularidad: sing };
  }

  const ejemplos = [
    { clave: 'exp', nombre: 'e^x at 0: approximate √e', sc: { f: 'e^x', a: '0', n: '4', x0: '0,5' } },
    { clave: 'seno', nombre: 'sin x at 0, degree 5', sc: { f: 'sen x', a: '0', n: '5', x0: '0,5' } },
    { clave: 'coseno', nombre: 'cos x at 0: cos 0.2', sc: { f: 'cos x', a: '0', n: '4', x0: '0,2' } },
    { clave: 'ln1x', nombre: 'ln(1 + x) at 0: ln 1.1', sc: { f: 'ln(1+x)', a: '0', n: '4', x0: '0,1' } },
    { clave: 'raiz', nombre: '√x at 4: approximate √4.1', sc: { f: '√x', a: '4', n: '2', x0: '4,1' } },
    { clave: 'lnx', nombre: 'ln x at 1, degree 3', sc: { f: 'ln x', a: '1', n: '3', x0: '1,2' } },
    { clave: 'gauss', nombre: 'e^(−x²) at 0', sc: { f: 'e^(-x^2)', a: '0', n: '4', x0: '0,3' } },
    { clave: 'arctan', nombre: 'arctan x at 0', sc: { f: 'arctg x', a: '0', n: '5', x0: '0,5' } },
    { clave: 'seno-pi6', nombre: 'sin x at π/6', sc: { f: 'sen x', a: 'π/6', n: '3', x0: '0,6' } },
    { clave: 'geometrica', nombre: '1/(1 − x): the geometric series', sc: { f: '1/(1-x)', a: '0', n: '5', x0: '0,1' } },
    { clave: 'binomica', nombre: '√(1 + x): binomial series', sc: { f: '√(1+x)', a: '0', n: '3', x0: '0,2' } },
    { clave: 'tangente', nombre: 'tan x at 0', sc: { f: 'tg x', a: '0', n: '5', x0: '0,3' } },
    { clave: 'polinomio', nombre: 'A polynomial at x = 1', sc: { f: 'x^3 - 2x + 1', a: '1', n: '3', x0: '1,5' } },
    { clave: 'producto', nombre: 'e^x sin x at 0', sc: { f: 'e^x sin x', a: '0', n: '3', x0: '0,2' } },
    { clave: 'evitable', nombre: 'sin x / x: removable singularity', sc: { f: 'sen(x)/x', a: '0', n: '6', x0: '0,5' } },
    { clave: 'fuera', nombre: '1/(1 + x²) outside the radius', sc: { f: '1/(1+x^2)', a: '0', n: '6', x0: '1,5' } },
    { clave: 'radio-complejo', nombre: 'Radius from a complex singularity: 1/(x² − 2x + 5)', sc: { f: '1/(x^2-2x+5)', a: '0', n: '6', x0: '1' } },
    { clave: 'limite-infinito', nombre: 'Limit at infinity: (1 + 1/x)^x', sc: { modo: 'limite', f: '(1+1/x)^x', a: 'inf' } },
    { clave: 'limite-producto', nombre: 'Limit of a 0·∞ product: x·sin(1/x) at infinity', sc: { modo: 'limite', f: 'x sen(1/x)', a: 'inf' } },
    { clave: 'limite', nombre: 'Limit (sin x − x)/x³', sc: { modo: 'limite', f: '(sen(x) - x)/x^3', a: '0' } },
    { clave: 'limite-cos', nombre: 'Limit (1 − cos x)/x²', sc: { modo: 'limite', f: '(1 - cos(x))/x^2', a: '0' } },
  ];

  return { resolver, ejemplos, conocido, polinomio, f, MAXN, CONOCIDOS };
})();

