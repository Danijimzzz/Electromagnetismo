const EDOs = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const Dv = typeof Derivadas !== 'undefined' ? Derivadas : require('../derivadas/calculo.js');
  const Lp = typeof Laplace !== 'undefined' ? Laplace : require('../laplace/calculo.js'); // raíces de polinomios
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  const FACT = [1]; for (let k = 1; k <= 30; k++) FACT[k] = FACT[k - 1] * k;
  const binom = (n, k) => FACT[n] / (FACT[k] * FACT[n - k]);

  function num(s, nom) {
    if (vacio(s)) throw new Error(`Il manque ${nom}`);
    const n = E.lee(s, nom[0].toUpperCase() + nom.slice(1));
    if (E.tieneX(n)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} ne peut pas contenir x`);
    const v = E.valor(n, 0);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} n’est pas un nombre`);
    return v;
  }

  function cTxt(c) {
    const e = E.exacto(c, 1000);
    return e ? E.numTxt(c) : f(c, 4);
  }
  function linTxt(r, v) {
    const e = E.exacto(r, 12);
    if (e && !e.s) {
      const P = Math.abs(e.p), sg = e.p < 0 ? '−' : '';
      return sg + (e.q === 1 ? `${P === 1 ? '' : P + ' '}${v}` : `{${P === 1 ? '' : P + ' '}${v}}/{${e.q}}`);
    }
    return `${r < 0 ? '−' : ''}${f(Math.abs(r), 4)} ${v}`;
  }
  function baseTxt({ m = 0, r = 0, w = 0, p = null }, v = 'x') {
    const xs = [m ? (m === 1 ? v : `${v}^{${m}}`) : '', r ? `e^{${linTxt(r, v)}}` : '', w ? `${p} ${/^[\d{]/.test(linTxt(w, v)) || linTxt(w, v).includes(' ') ? `(${linTxt(w, v)})` : linTxt(w, v)}` : ''];
    return xs.filter(Boolean).join(' ');
  }
  function suma(ts) {
    const vivos = ts.filter((t) => Math.abs(t.c) > 1e-10);
    if (!vivos.length) return '0';
    return vivos.map((t, i) => {
      const neg = t.c < 0, a = Math.abs(t.c);
      let cuerpo;
      if (!t.s) cuerpo = cTxt(a);
      else if (Math.abs(a - 1) < 1e-12) cuerpo = t.s;
      else {
        const ct = cTxt(a);
        const m = ct.match(/^\{1\}\/\{(\d+)\}$/);
        cuerpo = m ? `{${t.s}}/{${m[1]}}` : `${ct} ${t.s}`;
      }
      return (i ? (neg ? ' − ' : ' + ') : neg ? '−' : '') + cuerpo;
    }).join('');
  }

  const Z = (re, im = 0) => ({ re, im }), zm = (a, b) => Z(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re), zs = (a, b) => Z(a.re + b.re, a.im + b.im);
  const zpow = (z, n) => { let r = Z(1); for (let i = 0; i < n; i++) r = zm(r, z); return r; };
  const zexp = (z) => Z(Math.exp(z.re) * Math.cos(z.im), Math.exp(z.re) * Math.sin(z.im));
  function dBase(m, lam, i, x) {
    let s = Z(0);
    for (let j = 0; j <= Math.min(i, m); j++) {
      const k = binom(i, j) * (FACT[m] / FACT[m - j]) * x ** (m - j);
      s = zs(s, zm(Z(k), zpow(lam, i - j)));
    }
    return zm(s, zexp(zm(lam, Z(x))));
  }
  const dReal = (b, i, x) => { const z = dBase(b.m, Z(b.r, b.w), i, x); return b.p === 'sin' ? z.im : z.re; };

  function resuelve(A, y) {
    const n = A.length, M = A.map((r, i) => [...r, y[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
    }
    return M.map((r, i) => r[n] / r[i]);
  }
  function minimos(A, y) {
    const n = A[0].length, AtA = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => A.reduce((s, r) => s + r[i] * r[j], 0))), Aty = Array.from({ length: n }, (_, i) => A.reduce((s, r, k) => s + r[i] * y[k], 0));
    return resuelve(AtA, Aty);
  }
  const limpio = (c) => { if (Math.abs(c) < 1e-10) return 0; const e = E.exacto(c, 1000); if (!e) return c; const v = E.valor(E.lee(E.numTxt(c).replace(/[{}]/g, (q) => (q === '{' ? '(' : ')')).replace(/\)\/\(/g, ')/('), 'c'), 0); return isFinite(v) && Math.abs(v - c) < 1e-9 * Math.max(1, Math.abs(c)) ? v : c; };

  const esY = (n) => n.t === 'x' && n.n === 'y';
  function lineal(u) {
    if (E.tieneX(u, 'y')) return null;
    const u0 = E.valor(u, 0), r = E.valor(u, 1) - u0;
    if (!isFinite(u0) || !isFinite(r) || Math.abs(E.valor(u, 2.5) - (u0 + 2.5 * r)) > 1e-9 * Math.max(1, Math.abs(r))) return null;
    return { u0, r };
  }
  function terminos(ast) {
    const ts = [];
    function enSuma(m, s) {
      if (m.t === '+') { enSuma(m.a, s); enSuma(m.b, s); return true; }
      if (m.t === '-') { enSuma(m.a, s); enSuma(m.b, -s); return true; }
      if (m.t === 'neg') { enSuma(m.a, -s); return true; }
      const t = producto(m);
      if (!t) throw 0;
      for (const q of t) ts.push({ ...q, c: q.c * s });
      return true;
    }
    function producto(m) {
      let base = [{ c: 1, k: 0, r: 0, w: 0, p: null }];
      const mult = (otros) => { const nb = []; for (const a of base) for (const b of otros) { if (a.p && b.p) return false; nb.push({ c: a.c * b.c, k: a.k + b.k, r: a.r + b.r, w: a.w + b.w, p: a.p || b.p }); } base = nb; return true; };
      function fac(q, ex = 1) {
        if (q.t === '*') return fac(q.a, ex) && fac(q.b, ex);
        if (q.t === '/' && !E.tieneX(q.b) && !E.tieneX(q.b, 'y')) { const d = E.valor(q.b, 0); return fac(q.a, ex) && mult([{ c: 1 / d, k: 0, r: 0, w: 0, p: null }]); }
        if (q.t === 'neg') return fac(q.a, ex) && mult([{ c: -1, k: 0, r: 0, w: 0, p: null }]);
        if (!E.tieneX(q) && !E.tieneX(q, 'y')) { const v = E.valor(q, 0); return isFinite(v) && mult([{ c: v, k: 0, r: 0, w: 0, p: null }]); }
        if (q.t === 'x' && !q.n) return mult([{ c: 1, k: 1, r: 0, w: 0, p: null }]);
        if (q.t === '^' && q.a.t === 'x' && !q.a.n && q.b.t === 'n' && Number.isInteger(q.b.v) && q.b.v >= 0) return mult([{ c: 1, k: q.b.v, r: 0, w: 0, p: null }]);
        if (q.t === '^' && q.a.t === 'c' && q.a.v === 'e') { const l = lineal(q.b); return !!l && mult([{ c: Math.exp(l.u0), k: 0, r: l.r, w: 0, p: null }]); }
        if (q.t === 'fn' && (q.f === 'sin' || q.f === 'cos')) {
          const l = lineal(q.a); if (!l || Math.abs(l.r) < 1e-14) return false;
          const w = Math.abs(l.r), sg = Math.sign(l.r), c0 = Math.cos(l.u0), s0 = Math.sin(l.u0);
          return mult(q.f === 'sin' ? [{ c: sg * c0, k: 0, r: 0, w, p: 'sin' }, { c: s0, k: 0, r: 0, w, p: 'cos' }] : [{ c: c0, k: 0, r: 0, w, p: 'cos' }, { c: -sg * s0, k: 0, r: 0, w, p: 'sin' }]);
        }
        if (q.t === 'fn' && (q.f === 'sinh' || q.f === 'cosh')) { const l = lineal(q.a); if (!l) return false; const a = Math.exp(l.u0) / 2, b = Math.exp(-l.u0) / 2; return mult([{ c: a, k: 0, r: l.r, w: 0, p: null }, { c: q.f === 'sinh' ? -b : b, k: 0, r: -l.r, w: 0, p: null }]); }
        return false;
      }
      if (!fac(m)) return null;
      return base.map((b) => (b.w ? b : { ...b, p: null }));
    }
    try { enSuma(E.simp(ast), 1); } catch (e) { if (e === 0) return null; throw e; }
    return ts.filter((t) => Math.abs(t.c) > 1e-14);
  }

  function particular(P, ts) {
    const mod = (z) => Math.hypot(z.re, z.im);
    const grupos = [];
    for (const t of ts) {
      let g = grupos.find((q) => Math.abs(q.r - t.r) < 1e-12 && Math.abs(q.w - t.w) < 1e-12);
      if (!g) { g = { r: t.r, w: t.w, k: 0 }; grupos.push(g); }
      g.k = Math.max(g.k, t.k);
    }
    const bases = [];
    for (const g of grupos) {
      const l = Z(g.r, g.w), sc = Math.max(1, ...P.map(Math.abs));
      g.s = 0;
      for (let k = 0; k < P.length - 1; k++) { const dk = P.reduce((q, p, i) => (i >= k ? zs(q, zm(Z((p * FACT[i]) / FACT[i - k]), zpow(l, i - k))) : q), Z(0)); if (mod(dk) < 1e-9 * sc) g.s++; else break; }
      for (let j = 0; j <= g.k; j++) {
        bases.push({ m: j + g.s, r: g.r, w: g.w, p: g.w ? 'cos' : null });
        if (g.w) bases.push({ m: j + g.s, r: g.r, w: g.w, p: 'sin' });
      }
    }
    const gval = (x) => ts.reduce((s, t) => s + t.c * x ** t.k * Math.exp(t.r * x) * (t.p === 'sin' ? Math.sin(t.w * x) : t.p === 'cos' ? Math.cos(t.w * x) : 1), 0);
    const Lb = (b, x) => P.reduce((s, p, i) => s + p * dReal(b, i, x), 0);
    const xs = Array.from({ length: Math.max(8, 3 * bases.length) }, (_, i) => 0.13 + (1.1 * i) / Math.max(8, 3 * bases.length));
    const A = xs.map((x) => bases.map((b) => Lb(b, x))), y = xs.map(gval);
    const sol = minimos(A, y);
    if (!sol) return null;
    const coef = sol.map(limpio);
    for (const x of [0.37, 0.91, 1.57]) { const r = bases.reduce((s, b, i) => s + coef[i] * Lb(b, x), 0) - gval(x); if (Math.abs(r) > 1e-7 * Math.max(1, Math.abs(gval(x)))) return null; }
    return { grupos, bases: bases.map((b, i) => ({ ...b, c: coef[i] })) };
  }
  const evalBases = (bs, x, i = 0) => bs.reduce((s, b) => s + b.c * dReal(b, i, x), 0);

  function rk4(F, t0, Y0, t1, pasos) {
    const h = (t1 - t0) / pasos, out = [{ t: t0, Y: [...Y0] }];
    let Y = [...Y0], t = t0;
    for (let i = 0; i < pasos; i++) {
      const k1 = F(t, Y), k2 = F(t + h / 2, Y.map((v, j) => v + (h / 2) * k1[j])), k3 = F(t + h / 2, Y.map((v, j) => v + (h / 2) * k2[j])), k4 = F(t + h, Y.map((v, j) => v + h * k3[j]));
      Y = Y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); t += h;
      if (!Y.every(isFinite) || Y.some((v) => Math.abs(v) > 1e12)) break;
      out.push({ t, Y: [...Y] });
    }
    return out;
  }

  const NN = E.N, XX = { t: 'x' }, YY = { t: 'x', n: 'y' };
  const op = (t, a, b) => ({ t, a, b });
  const sust = (n, q, por) => (q(n) ? por : n.a === undefined && n.b === undefined ? n : { ...n, ...(n.a ? { a: sust(n.a, q, por) } : {}), ...(n.b ? { b: sust(n.b, q, por) } : {}) });
  const esX = (n) => n.t === 'x' && !n.n;
  const enY = (n) => sust(n, esX, YY); // un AST en x pasado a y
  const deY = (n) => sust(n, esY, XX); // y al revés
  const T = (n) => Dv.T(n);
  const prim = (n) => { try { const r = Dv.prim(E.simp(n), []); return r ? E.simp(r.F) : null; } catch (e) { return null; } };
  const coincide = (yf, fino) => fino.filter((_, i) => i % 40 === 0 || i === fino.length - 1).every((q) => { const v = yf(q.t); return isFinite(v) && Math.abs(v - q.Y[0]) < 1e-5 * Math.max(1, Math.abs(q.Y[0])); });
  function poli3(n) {
    let c; try { c = [...E.serie(n, 0, 3)]; } catch (e) { return null; }
    for (const x of [-1.3, 0.7, 2.1]) { const v = c.reduceRight((q, k) => q * x + k, 0), w = E.valor(n, x); if (!isFinite(w) || Math.abs(v - w) > 1e-9 * Math.max(1, Math.abs(w))) return null; }
    return c.map((k) => limpio(Math.abs(k) < 1e-12 ? 0 : k));
  }
  const exTxt = (k, G) => `e^{${T(E.simp(op('*', NN(k), G)))}}`; // e^{k G(x)}
  const kT = (k, s) => (Math.abs(k - 1) < 1e-12 ? s : Math.abs(k + 1) < 1e-12 ? `−${s}` : `${cTxt(k)} ${s}`);
  const par = (t) => (/^[^ ]+$/.test(t) || /^\{.*\}$/.test(t) ? t : `(${t})`);

  function lipschitzOk(F, x0, y0) {
    const q = (d) => { const a = F(x0, y0 + d), b = F(x0, y0); return isFinite(a) && isFinite(b) ? Math.abs(a - b) / Math.abs(d) : NaN; };
    for (const s of [1, -1]) { const q1 = q(s * 1e-3), q2 = q(s * 1e-9); if (isFinite(q1) && isFinite(q2) && q2 > 50 && q2 > 5 * q1) return false; }
    return true;
  }

  function separable(ast, F, x0, y0, fino) {
    const pts = [[0.3, 0.7], [1.4, -0.6], [-0.8, 1.9], [2.2, 2.6], [1.1, 0.4], [0.6, 3.1]];
    let vistos = 0;
    for (const [xa, ya] of pts) for (const [xb, yb] of pts) {
      const l = F(xa, ya) * F(xb, yb), r = F(xa, yb) * F(xb, ya);
      if (!isFinite(l) || !isFinite(r)) continue;
      if (Math.abs(l - r) > 1e-9 * Math.max(1, Math.abs(l))) return null;
      vistos++;
    }
    if (vistos < 10) return null;
    let xr = null, yr = null;
    for (const a of [1, 0, 2, 0.5]) for (const b of [0, 1, 2, 0.5]) if (xr === null && Math.abs(F(a, b)) > 1e-9 && isFinite(F(a, b))) { xr = a; yr = b; }
    if (xr === null) return null;
    const g = E.simp(op('/', sust(ast, esY, NN(yr)), NN(F(xr, yr)))), hX = E.simp(deY(sust(ast, esX, NN(xr)))); // h con x en vez de y
    const sinY = !E.tieneX(hX), sinX = !E.tieneX(g);
    const inv = (h) => { let k = 1, q = h; if (q.t === '*' && !E.tieneX(q.a)) { k = E.valor(q.a, 0); q = q.b; } return q.t === '^' && q.a.t === 'c' && q.a.v === 'e' ? E.simp(op('*', NN(1 / k), op('^', q.a, { t: 'neg', a: q.b }))) : op('/', NN(1), h); };
    const G = prim(g), H = sinY ? null : prim(inv(hX)), pasos = [];
    const gT = T(g), hT = T(enY(hX));
    pasos.push({ t: sinY ? 'On intègre directement' : 'Variables séparables', html: sinY ? `y′ ne dépend que de x : $y = ∫ ${gT === '1' ? '' : gT + ' '}${T(hX) === '1' ? '' : T(hX) + ' '}dx$.`.replace('∫  dx', '∫ dx') : `$y′ = g(x) h(y)$ avec $g(x) = ${gT}$ et $h(y) = ${hT}$. On sépare les variables, $${'{dy}/{h(y)}'} = g(x) dx$, et on intègre chaque membre${sinX ? ' (ici g = 1 : elle est autonome)' : ''}.` });
    if (!G) return { pasos: [...pasos, { t: 'Primitive', html: `$∫ ${gT} dx$ n’a pas de primitive simple, donc on résout numériquement.` }] };
    const Gf = (x) => E.valor(G, x), GT = T(G);
    if (sinY) {
      const k = E.valor(hX, 0), C = limpio(y0 - k * Gf(x0)), yf = (x) => k * Gf(x) + C;
      const txt = T(E.simp(op('+', op('*', NN(k), G), NN(C))));
      if (!coincide(yf, fino)) return { pasos };
      pasos.push({ t: 'Solution', html: `$y = ${T(E.simp(op('*', NN(k), G)))} + C$, et avec $y(${f(x0)}) = ${f(y0)}$ on obtient $C = ${cTxt(C)}$ :<br>$y(x) = ${txt}$` });
      return { pasos, exacta: { txt, y: yf } };
    }
    const h0 = E.valor(hX, y0);
    if (Math.abs(h0) < 1e-12) {
      if (!lipschitzOk(F, x0, y0)) {
        const hv = (d) => E.valor(hX, y0 + d), a = Math.log(hv(2e-6) / hv(1e-6)) / Math.LN2, a2 = Math.log(hv(2e-9) / hv(1e-9)) / Math.LN2;
        pasos.push({ t: 'Solution d’équilibre', html: `$h(${f(y0)}) = 0$ : la droite $y = ${cTxt(y0)}$ est solution (la pente est nulle en tous ses points).` });
        let otra = '';
        if (isFinite(a) && Math.abs(a - a2) < 1e-3 && a > 0.01 && a < 0.99 && G) {
          const cc = hv(1e-6) / 1e-6 ** a, k = (1 - a) * cc, e = 1 / (1 - a), yv = (x) => y0 + (k * (Gf(x) - Gf(x0))) ** e;
          const ok = [1, 1.7, 3].every((d) => { const x = x0 + d, e1 = 1e-5, dv = (yv(x + e1) - yv(x - e1)) / (2 * e1), fv = F(x, yv(x)); return isFinite(dv) && isFinite(fv) && Math.abs(dv - fv) < 1e-4 * Math.max(1, Math.abs(fv)); });
          if (ok) otra = ` Est aussi solution, pour $x ≥ ${f(x0)}$, $y = ${y0 ? cTxt(limpio(y0)) + ' + ' : ''}(${T(E.simp(op('*', NN(limpio(k)), op('-', G, NN(limpio(Gf(x0)))))))})^{${cTxt(limpio(e))}}$, qui provient de la séparation des variables et part du même point.`;
        }
        pasos.push({ t: 'Avertissement : la solution n’est pas unique', html: `<b>Le théorème d’unicité n’est pas vérifié ici :</b> $∂f/∂y$ n’est pas bornée près de $(${f(x0)}, ${f(y0)})$ (la pente change trop vite avec $y$), donc <b>plus d’une solution</b> peut passer par ce point.${otra} Ce qui est montré ci-dessous n’est que l’une d’elles (celle d’équilibre).` });
        return { pasos, exacta: { txt: cTxt(limpio(y0)), y: () => y0 }, noUnica: true, otra: !!otra };
      }
      pasos.push({ t: 'Solution d’équilibre', html: `$h(${f(y0)}) = 0$ : la droite $y = ${cTxt(y0)}$ est solution (la pente est nulle en tous ses points) et, par unicité, c’est celle qui passe par le point initial.` });
      return { pasos, exacta: { txt: cTxt(limpio(y0)), y: () => y0 } };
    }
    const HT = H ? T(enY(H)) : null;
    pasos.push({ t: 'Intégrales', html: `$∫ {dy}/{${hT}} = ${HT ?? '(pas de primitive simple)'}$ &ensp; et &ensp; $∫ ${gT} dx = ${GT}$` });
    const c = poli3(hX);
    let sol = null;
    if (c && !c[2] && !c[3] && c[1]) {
      const k = c[1], a = limpio(-c[0] / k), K = limpio((y0 - a) * Math.exp(-k * Gf(x0)));
      sol = { y: (x) => a + K * Math.exp(k * Gf(x)), txt: suma([{ c: K, s: exTxt(k, G) }, { c: a, s: '' }]), como: `$${HT} = ${GT} + C$, donc $${a ? `y ${a < 0 ? '+' : '−'} ${cTxt(Math.abs(a))}` : 'y'} = K ${exTxt(k, G)}$ (avec $K = ± e^{${cTxt(k)} C}$), et avec le point initial $K = ${cTxt(K)}$` };
    } else if (c && !c[3] && c[2]) {
      const k = c[2], D2 = c[1] * c[1] - 4 * c[2] * c[0];
      if (D2 > 1e-12) {
        const r1 = limpio((-c[1] + Math.sqrt(D2)) / (2 * k)), r2 = limpio((-c[1] - Math.sqrt(D2)) / (2 * k));
        const [a, b] = Math.abs(r1) < 1e-12 ? [r1, r2] : [r2, r1], m = k * (a - b);
        if (Math.abs(y0 - b) > 1e-12) {
          const K = limpio(((y0 - a) / (y0 - b)) * Math.exp(-m * Gf(x0)));
          const yf = (x) => { const e = K * Math.exp(m * Gf(x)); return (a - b * e) / (1 - e); };
          const txt = Math.abs(a) < 1e-12 ? `{${cTxt(b)}}/{1 ${-1 / K < 0 ? '−' : '+'} ${Math.abs(1 / K - 1) < 1e-12 || Math.abs(1 / K + 1) < 1e-12 ? '' : cTxt(limpio(Math.abs(1 / K))) + ' '}${exTxt(-m, G)}}` : `{${cTxt(a)} ${-b * K < 0 ? '−' : '+'} ${cTxt(limpio(Math.abs(b * K)))} ${exTxt(m, G)}}/{1 ${-K < 0 ? '−' : '+'} ${cTxt(limpio(Math.abs(K)))} ${exTxt(m, G)}}`;
          sol = { y: yf, txt, como: `Par éléments simples, $${HT} = ${GT} + C$, c’est-à-dire $${'{y − a}/{y − b}'.replace('a', cTxt(a)).replace('b', cTxt(b)).replace('− −', '+ ').replace('y − 0', 'y')} = K ${exTxt(m, G)}$, et avec le point initial $K = ${cTxt(K)}$. En isolant y` };
        }
      } else if (Math.abs(D2) <= 1e-12) {
        const d = limpio(-c[1] / (2 * k));
        if (Math.abs(y0 - d) > 1e-12) {
          const C = limpio(1 / (y0 - d) + k * Gf(x0)), den = T(E.simp(op('-', NN(C), op('*', NN(k), G))));
          sol = { y: (x) => d + 1 / (C - k * Gf(x)), txt: `{1}/{${den}}${d ? ` ${d < 0 ? '−' : '+'} ${cTxt(Math.abs(d))}` : ''}`, como: `$${HT} = ${GT} + C$ ; en isolant y avec le point initial` };
        }
      } else if (D2 < -1e-12) {
        const d = limpio(-c[1] / (2 * k)), w = limpio(Math.sqrt(-D2) / (2 * Math.abs(k))), C = limpio(Math.atan((y0 - d) / w) - k * w * Gf(x0));
        const arg = T(E.simp(op('+', op('*', NN(k * w), G), NN(C))));
        sol = { y: (x) => d + w * Math.tan(k * w * Gf(x) + C), txt: `${Math.abs(w - 1) < 1e-12 ? '' : cTxt(w) + ' '}tg(${arg})${d ? ` ${d < 0 ? '−' : '+'} ${cTxt(Math.abs(d))}` : ''}`, como: `$${HT} = ${GT} + C$ ; en isolant avec la tangente et avec le point initial, $C = ${cTxt(C)}$` };
      }
    }
    const la = Math.log(Math.abs(E.valor(hX, 1) / E.valor(hX, 0)));
    if (!sol && isFinite(la) && Math.abs(la) > 1e-12 && E.valor(hX, 0) * E.valor(hX, 1) > 0 && [2, -1.5].every((y) => Math.abs(E.valor(hX, y) - E.valor(hX, 0) * Math.exp(la * y)) < 1e-9 * Math.max(1, Math.abs(E.valor(hX, y))))) {
      const a = limpio(la), k = limpio(E.valor(hX, 0)), C = limpio(Math.exp(-a * y0) + a * k * Gf(x0));
      const dentro = T(E.simp(op('-', NN(C), op('*', NN(a * k), G))));
      sol = { y: (x) => -Math.log(C - a * k * Gf(x)) / a, txt: `${Math.abs(a + 1) < 1e-12 ? '' : Math.abs(a - 1) < 1e-12 ? '−' : `${linTxt(-1 / a, '').trim() || '−'} `}ln(${dentro})`, como: `$${HT} = ${GT} + C$, donc $e^{${linTxt(-a, 'y')}} = ${dentro}$ avec le point initial, et on prend le logarithme` };
    } else if (!sol && (!c || (!c[0] && !c[1] && !c[2] && c[3]))) {
      const p = Math.log(E.valor(hX, 4) / E.valor(hX, 1)) / Math.log(4), k = E.valor(hX, 1);
      if (isFinite(p) && Math.abs(p - 1) > 1e-9 && [0.5, 2.5, 9].every((y) => Math.abs(E.valor(hX, y) - k * y ** p) < 1e-9 * Math.max(1, Math.abs(k * y ** p))) && y0 > 0) {
        const q = 1 - p, C = limpio(y0 ** q - q * k * Gf(x0)), e = limpio(1 / q);
        const dentro = T(E.simp(op('+', op('*', NN(q * k), G), NN(C))));
        sol = { y: (x) => (q * k * Gf(x) + C) ** (1 / q), txt: Math.abs(e + 1) < 1e-12 ? `{1}/{${dentro}}` : Math.abs(e - 0.5) < 1e-12 ? `√(${dentro})` : `(${dentro})^{${cTxt(e)}}`, como: `$${HT} = ${GT} + C$, donc $y^{${cTxt(limpio(q))}} = ${dentro}$ avec le point initial` };
      }
    }
    if (sol && coincide(sol.y, fino)) {
      pasos.push({ t: 'Solution', html: `${sol.como}:<br>$y(x) = ${sol.txt}$` });
      return { pasos, exacta: { txt: sol.txt, y: sol.y } };
    }
    if (H) {
      const C = limpio(E.valor(H, y0) - Gf(x0)), imp = `${HT} = ${T(E.simp(op('+', G, NN(C))))}`;
      pasos.push({ t: 'Solution implicite', html: `$${HT} = ${GT} + C$ et avec $y(${f(x0)}) = ${f(y0)}$ on obtient $C = ${cTxt(C)}$ :<br>$${imp}$<br>On ne peut pas isoler y simplement ; le graphique la trace avec RK4.` });
      return { pasos, implicita: imp };
    }
    return { pasos };
  }

  function factorIntegrante(pA, qA, x0, y0) {
    const P = prim(pA);
    if (!P) return null;
    let c = 1, L = P;
    if (L.t === 'neg') { c = -1; L = L.a; }
    if (L.t === '*' && !E.tieneX(L.a)) { c *= E.valor(L.a, 0); L = L.b; }
    const u = L.t === 'fn' && L.f === 'ln' ? (L.a.t === 'fn' && L.a.f === 'abs' ? L.a.a : L.a) : null;
    const mu = u && E.valor(u, x0) > 0 ? E.simp(op('^', u, NN(limpio(c)))) : E.simp(op('^', { t: 'c', v: 'e' }, P));
    const I = prim(op('*', mu, qA));
    if (!I) return { P, mu, I: null };
    const m0 = E.valor(mu, x0), C = limpio(y0 * m0 - E.valor(I, x0));
    const r = (x) => E.valor(I, x) / E.valor(mu, x);
    let c3 = null;
    try { c3 = [...E.serie(E.simp(op('/', I, mu)), x0, 6)].map((v) => (Math.abs(v) < 1e-12 ? 0 : v)); } catch (e) { c3 = null; }
    const polOk = c3 && [0.37, 0.81, 1.3].every((d) => { const x = x0 + d, v = c3.reduceRight((q, k) => q * (x - x0) + k, 0); return Math.abs(v - r(x)) < 1e-9 * Math.max(1, Math.abs(v)); });
    let p1 = E.simp(op('/', I, mu));
    if (polOk) {
      const cs = Array(7).fill(0);
      c3.forEach((k, j) => { for (let i = 0; i <= j; i++) cs[i] += k * binom(j, i) * (-x0) ** (j - i); });
      let pA2 = NN(0); cs.forEach((k, i) => { const kk = limpio(k); if (kk) pA2 = op('+', pA2, op('*', NN(kk), op('^', XX, NN(i)))); });
      p1 = E.simp(pA2);
    }
    const p2 = E.simp(mu.t === '^' && mu.a.t === 'c' ? op('*', NN(C), op('^', mu.a, { t: 'neg', a: mu.b })) : op('/', NN(C), mu));
    const yA = E.simp(op('+', p1, p2));
    return { P, mu, I, C, yA, y: (x) => E.valor(yA, x) };
  }
  function linealVariable(ast, x0, y0, fino) {
    const qA = E.simp(sust(ast, esY, NN(0))), pA = E.simp(op('-', qA, sust(ast, esY, NN(1))));
    const r = factorIntegrante(pA, qA, x0, y0), pasos = [];
    pasos.push({ t: 'Linéaire à coefficients variables', html: `C’est $y′ + p(x) y = q(x)$ avec $p(x) = ${T(pA)}$ et $q(x) = ${T(qA)}$. On multiplie par le facteur intégrant $μ(x) = e^{∫ p dx}$, qui fait que le membre de gauche est $(μ y)′$, et $μ y = ∫ μ q dx + C$.` });
    if (!r || !r.I) return { pasos: [...pasos, { t: 'Primitive', html: r ? `$μ = ${T(r.mu)}$, mais $∫ μ q dx$ n’a pas de primitive simple : on résout numériquement.` : '$∫ p dx$ n’a pas de primitive simple : on résout numériquement.' }] };
    if (!coincide(r.y, fino)) return { pasos };
    const txt = T(r.yA);
    pasos.push({ t: 'Facteur intégrant', html: `$∫ p dx = ${T(r.P)}$, donc $μ = ${T(r.mu)}$${r.mu.t === '^' && esX(r.mu.a) ? ' (pour x > 0)' : ''}. Alors $μ y = ∫ ${T(E.simp(op('*', r.mu, qA)))} dx = ${T(r.I)} + C$, et avec le point initial $C = ${cTxt(r.C)}$ :<br>$y(x) = ${txt}$` });
    return { pasos, exacta: { txt, y: r.y } };
  }
  function bernoulli(ast, F, x0, y0, fino) {
    for (const n of [2, 3, -1, 0.5, -2, 4, 1 / 3]) {
      const k = 2 ** n - 2;
      const ok = [0.4, 1.3, 2.2].every((x) => { const a = F(x, 1), b = F(x, 2), p = (2 ** n * a - b) / k, q = (b - 2 * a) / k; return [0.5, 3].every((y) => Math.abs(F(x, y) - p * y - q * y ** n) < 1e-9 * Math.max(1, Math.abs(F(x, y)))); });
      if (!ok) continue;
      const a1 = sust(ast, esY, NN(1)), a2 = sust(ast, esY, NN(2));
      const pA = E.simp(op('/', op('-', op('*', NN(2 ** n), a1), a2), NN(k))), qA = E.simp(op('/', op('-', a2, op('*', NN(2), a1)), NN(k)));
      if ([0.4, 1.3].every((x) => Math.abs(E.valor(qA, x)) < 1e-12 || Math.abs(E.valor(pA, x)) < 1e-12)) return null;
      const m = 1 - n, nT = cTxt(n), pasos = [];
      pasos.push({ t: 'Équation de Bernoulli', html: `C’est $y′ = p(x) y + q(x) y^{${nT}}$ avec $p = ${T(pA)}$ et $q = ${T(qA)}$. Avec le changement $v = y^{${cTxt(m)}}$, $v′ = ${kT(m, `y^{${cTxt(-n)}} y′`)}$, et elle devient linéaire : $v′ = ${kT(m, '(p v + q)')}$.` });
      if (!(y0 > 0) && !Number.isInteger(m)) return { pasos };
      const v0 = y0 ** m, r = factorIntegrante(E.simp(op('*', NN(-m), pA)), E.simp(op('*', NN(m), qA)), x0, v0);
      if (!r || !r.I) return { pasos: [...pasos, { t: 'Primitive', html: 'Les intégrales du facteur intégrant n’ont pas de primitive simple : on résout numériquement.' }] };
      const yf = (x) => r.y(x) ** (1 / m), vT = T(r.yA), e = limpio(1 / m);
      if (!coincide(yf, fino)) return { pasos };
      const txt = Math.abs(e + 1) < 1e-12 ? `{1}/{${vT}}` : Math.abs(e - 0.5) < 1e-12 ? `√(${vT})` : `(${vT})^{${cTxt(e)}}`;
      pasos.push({ t: 'Solution', html: `Avec le facteur intégrant $μ = ${T(r.mu)}$ et $v(${f(x0)}) = ${f(v0)}$ on obtient $v = ${vT}$, et en revenant à la variable de départ, $y = v^{${cTxt(e)}}$ :<br>$y(x) = ${txt}$` });
      return { pasos, exacta: { txt, y: yf } };
    }
    return null;
  }
  function ecExacta(ast, x0, y0) {
    let A, B, sg = 1, n = ast;
    if (n.t === 'neg') { sg = -1; n = n.a; }
    if (n.t !== '/') return null;
    A = n.a; B = n.b;
    const M = sg > 0 ? A : A, N = sg > 0 ? E.simp({ t: 'neg', a: B }) : B; // y′ = A/B → A dx − B dy = 0; y′ = −A/B → A dx + B dy = 0
    const My = E.deriva(M, 'y'), Nx = E.deriva(N, 'x');
    const ok = [[0.3, 0.8], [1.7, -0.4], [-1.1, 1.6]].every(([x, y]) => { const a = E.valor(My, x, { y }), b = E.valor(Nx, x, { y }); return isFinite(a) && Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a)); });
    if (!ok) return null;
    const pasos = [{ t: 'Équation exacte', html: `On l’écrit $M dx + N dy = 0$ avec $M = ${T(M)}$ et $N = ${T(N)}$. Comme $∂M/∂y = ${T(E.simp(My))} = ∂N/∂x$, elle est exacte : il existe une fonction $Φ(x, y)$ avec $Φ_x = M$ et $Φ_y = N$, et la solution est $Φ(x, y) = C$.` }];
    const P1 = prim(M);
    if (!P1) return { pasos };
    const resto = E.simp(op('-', N, E.deriva(P1, 'y')));
    if (E.tieneX(resto)) return { pasos };
    const R2 = E.tieneX(resto, 'y') ? prim(deY(resto)) : E.simp(op('*', resto, XX));
    if (!R2) return { pasos };
    const Phi = E.simp(op('+', P1, enY(R2))), C = limpio(E.valor(Phi, x0, { y: y0 })), imp = `${T(Phi)} = ${cTxt(C)}`;
    pasos.push({ t: 'Fonction potentielle', html: `$Φ = ∫ M dx = ${T(P1)} + φ(y)$. En dérivant par rapport à y et en égalant à N, $φ′(y) = ${T(resto)}$, donc $φ(y) = ${T(enY(R2))}$ et<br>$Φ(x, y) = ${T(Phi)}$<br>Avec le point initial, $C = Φ(${f(x0)}, ${f(y0)}) = ${cTxt(C)}$ :<br>$${imp}$` });
    return { pasos, implicita: imp };
  }

  const METODOS = {
    Euler: { orden: 1, paso: (F, x, y, h) => y + h * F(x, y) },
    Heun: { orden: 2, paso: (F, x, y, h) => { const k1 = F(x, y), k2 = F(x + h, y + h * k1); return y + (h / 2) * (k1 + k2); } },
    'Point milieu': { orden: 2, paso: (F, x, y, h) => y + h * F(x + h / 2, y + (h / 2) * F(x, y)) },
    RK4: { orden: 4, paso: (F, x, y, h) => { const k1 = F(x, y), k2 = F(x + h / 2, y + (h / 2) * k1), k3 = F(x + h / 2, y + (h / 2) * k2), k4 = F(x + h, y + h * k3); return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); } },
  };
  function integra(m, F, x0, y0, h, n) { let y = y0; for (let i = 0; i < n; i++) y = METODOS[m].paso(F, x0 + i * h, y, h); return y; }

  function primer(sc) {
    const ast = E.lee(sc.f, 'La fonction f(x, y)', ['x', 'y']);
    const x0 = num(sc.x0, 'la valeur x₀'), y0 = num(sc.y0, 'la valeur y₀'), x1 = num(sc.x1, 'la fin de l’intervalle');
    if (!(x1 > x0)) throw new Error('La fin de l’intervalle doit être supérieure à x₀');
    const h = vacio(sc.h) ? (x1 - x0) / 10 : num(sc.h, 'le pas h');
    if (!(h > 0)) throw new Error('Le pas h doit être positif');
    if ((x1 - x0) / h > 2000) throw new Error('Avec ce pas, il y a trop de pas d’Euler : utilise un h plus grand');
    const F = (x, y) => E.valor(ast, x, { y });
    if (!isFinite(F(x0, y0))) throw new Error(`f n’est pas définie en (x₀, y₀) = (${f(x0)}, ${f(y0)})`);
    const fTxt = E.texto(E.simp(ast)), pasos = [];
    pasos.push({ t: 'L’équation', html: `$y′ = ${fTxt}$ avec $y(${f(x0)}) = ${f(y0)}$. En chaque point (x, y), l’équation donne la pente de la solution qui y passe : c’est le champ de pentes du graphique.` });

    let exacta = null, p = null, sinPart = false;
    const xsT = [x0, x0 + 0.37, x0 + 1.1, x0 - 0.6], lin = xsT.every((x) => { const a = F(x, 0), b = F(x, 1), c = F(x, 2.5); return isFinite(a) && Math.abs(c - a - 2.5 * (b - a)) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); });
    if (lin) {
      const ps = xsT.map((x) => F(x, 0) - F(x, 1));
      if (ps.every((q) => Math.abs(q - ps[0]) < 1e-9 * Math.max(1, Math.abs(ps[0])))) p = limpio(ps[0]);
    }
    if (p !== null) {
      const q = E.simp(sustY(ast, E.N(0)));
      const ts = terminos(q), qTxt = E.texto(q);
      const yhTxt = Math.abs(p) < 1e-14 ? 'C' : `C e^{${linTxt(-p, 'x')}}`;
      pasos.push({ t: 'Elle est linéaire', html: `En passant le terme en y à gauche, on obtient $y′ ${p < 0 ? '−' : '+'} ${Math.abs(p - 1) < 1e-12 || Math.abs(p + 1) < 1e-12 ? '' : cTxt(Math.abs(p)) + ' '}y = ${qTxt}$ : linéaire à coefficient constant. L’équation homogène $y′ ${p < 0 ? '−' : '+'} ${Math.abs(Math.abs(p) - 1) < 1e-12 ? '' : cTxt(Math.abs(p)) + ' '}y = 0$ donne $y_h = ${yhTxt}$ (racine $λ = ${cTxt(-p)}$).` });
      const part = ts ? particular([p, 1], ts) : null;
      if (part) {
        const ypTxt = suma(part.bases.map((b) => ({ c: b.c, s: baseTxt(b) })));
        pasos.push({ t: 'Solution particulière', html: ansatzTxt(part, 1) + `<br>En substituant dans l’équation et en égalant les coefficients : $y_p = ${ypTxt}$` });
        const hx = Math.exp(-p * x0), C = limpio((y0 - evalBases(part.bases, x0)) / hx);
        const ts2 = [{ c: C, s: Math.abs(p) < 1e-14 ? '' : baseTxt({ r: -p }) }, ...part.bases.map((b) => ({ c: b.c, s: baseTxt(b) }))];
        const sTxt = suma(juntar(ts2));
        pasos.push({ t: 'Condition initiale', html: `$y = ${yhTxt} + ${ypTxt.startsWith('−') ? `(${ypTxt})` : ypTxt}$ et $y(${f(x0)}) = ${f(y0)}$ donne $C = ${cTxt(C)}$ :<br>$y(x) = ${sTxt}$` });
        exacta = { txt: sTxt, y: (x) => C * Math.exp(-p * x) + evalBases(part.bases, x) };
      } else sinPart = true;
    }
    let implicita = null;

    const n = Math.round((x1 - x0) / h), eul = [{ x: x0, y: y0 }];
    for (let i = 0; i < n; i++) { const { x, y } = eul[i], m = F(x, y); eul.push({ x: x + h, y: y + h * m, m }); if (!isFinite(eul[i + 1].y)) break; }
    eul.forEach((e, i) => { if (i < eul.length - 1) e.m = F(e.x, e.y); });
    const fino = rk4((t, Y) => [F(t, Y[0])], x0, [y0], x1, Math.max(400, n * 20));
    const yRK = fino[fino.length - 1].t >= x1 - 1e-9 ? fino[fino.length - 1].Y[0] : NaN;
    const explota = fino[fino.length - 1].t < x1 - 1e-9 ? fino[fino.length - 1].t : null;
    let noUnica = false;
    if (p === null || sinPart) {
      let r = null;
      try { r = separable(ast, F, x0, y0, fino) || (lin ? linealVariable(ast, x0, y0, fino) : bernoulli(ast, F, x0, y0, fino) || ecExacta(E.simp(ast), x0, y0)); } catch (e) { r = null; }
      if (r) { pasos.push(...r.pasos); exacta = r.exacta || null; implicita = r.implicita || null; }
      if (!(r && r.noUnica) && !lipschitzOk(F, x0, y0)) { noUnica = true; pasos.push({ t: 'Avertissement : la solution n’est pas unique', html: `<b>Le théorème d’unicité n’est pas vérifié ici :</b> $∂f/∂y$ n’est pas bornée près de $(${f(x0)}, ${f(y0)})$, donc il peut y avoir plus d’une solution passant par ce point et les méthodes numériques n’en suivent qu’une.` }); }
      if (r && r.noUnica) noUnica = true;
      if (!r || (!r.exacta && !r.implicita)) pasos.push({ t: 'Genre', html: r ? 'Pas de solution sous forme de formule : on résout numériquement, comme ci-dessous.' : 'Elle n’est ni linéaire, ni à variables séparables, ni de Bernoulli, ni exacte : on résout numériquement, comme ci-dessous.' });
    }
    const yEu = eul[eul.length - 1].y, yEx = exacta ? exacta.y(x1) : null;
    const filas = eul.slice(0, Math.min(eul.length - 1, 8)).map((e, i) => `<tr><td>${i}</td><td>${f(e.x, 5)}</td><td>${f(e.y, 6)}</td><td>${f(e.m, 6)}</td><td>${f(eul[i + 1].y, 6)}</td></tr>`).join('');
    pasos.push({ t: `Méthode d’Euler avec h = ${f(h)}`, html: `$y_{n+1} = y_n + h f(x_n, y_n)$, en partant de $(x_0, y_0) = (${f(x0)}, ${f(y0)})$ :<table class="tabla"><tr><th>n</th><th>xₙ</th><th>yₙ</th><th>f(xₙ, yₙ)</th><th>yₙ₊₁</th></tr>${filas}</table>${eul.length - 1 > 8 ? `… et ainsi de suite jusqu’à n = ${eul.length - 1}. ` : ''}En x = ${f(x1)}, Euler donne y ≈ ${f(yEu, 6)}.` });
    if (explota !== null) pasos.push({ t: 'La solution explose', html: `Avec RK4, la solution croît sans limite près de $x ≈ ${f(explota, 4)}$ : elle a une asymptote verticale avant x = ${f(x1)}, donc $y(${f(x1)})$ n’existe pas. Cela arrive dans les équations non linéaires comme $y′ = y^2$, dont la solution $y = 1/(C − x)$ tend vers l’infini en x = C. Les valeurs d’Euler à partir de là n’ont pas de sens.` });
    let metodos = null;
    if (explota === null) {
      const ref = exacta ? yEx : yRK;
      metodos = Object.entries(METODOS).map(([nom, m]) => { const y1 = integra(nom, F, x0, y0, h, n), y2 = integra(nom, F, x0, y0, h / 2, 2 * n); return { nom, orden: m.orden, y: y1, err: Math.abs(y1 - ref), err2: Math.abs(y2 - ref) }; });
      const fila = (q) => `<tr><td>${q.nom}</td><td>${q.orden}</td><td>${f(q.y, 7)}</td><td>${f(q.err, 2)}</td><td>${f(q.err2, 2)}</td><td>${q.err2 > 1e-13 ? f(q.err / q.err2, 3) : '—'}</td></tr>`;
      pasos.push({ t: 'Comparaison des méthodes', html: `${exacta ? `La solution exacte vaut $y(${f(x1)}) = ${f(yEx, 7)}$` : `Avec un RK4 très fin (${fino.length - 1} pas), on obtient $y(${f(x1)}) ≈ ${f(yRK, 7)}$`}. Avec le même pas h = ${f(h)} et avec h/2 :<table class="tabla"><tr><th>Méthode</th><th>Ordre</th><th>y(${f(x1)})</th><th>Erreur avec h</th><th>Erreur avec h/2</th><th>Rapport</th></tr>${metodos.map(fila).join('')}</table>Une méthode d’ordre p a une erreur proportionnelle à $h^p$ : en divisant le pas par deux, l’erreur est divisée par environ $2^p$ (2 Euler, 4 Heun et point milieu, 16 RK4). Heun fait $y_{n+1} = y_n + {h}/{2}(k_1 + k_2)$ avec $k_2 = f(x_n + h, y_n + h k_1)$, et le point milieu $y_{n+1} = y_n + h f(x_n + {h}/{2}, y_n + {h}/{2} k_1)$.` });
    }
    return { modo: 'primer', fTxt, F, x0, y0, x1, h, eul, fino, exacta, implicita, yRK, yEu, yEx, explota, metodos, pasos, noUnica, lineal: p !== null };
  }
  function sustY(n, por) {
    if (esY(n)) return por;
    if (n.a === undefined && n.b === undefined) return n;
    return { ...n, ...(n.a ? { a: sustY(n.a, por) } : {}), ...(n.b ? { b: sustY(n.b, por) } : {}) };
  }
  function juntar(ts) { const out = []; for (const t of ts) { const o = out.find((q) => q.s === t.s); if (o) o.c += t.c; else out.push({ ...t }); } return out; }
  function ansatzTxt(part, orden) {
    const xs = part.grupos.map((g) => {
      const pol = (L) => (g.k === 0 ? L : `(${Array.from({ length: g.k + 1 }, (_, j) => `${L}_{${j}}${j ? (j === 1 ? ' x' : ` x^{${j}}`) : ''}`).join(' + ')})`);
      const e = g.r ? ` e^{${linTxt(g.r, 'x')}}` : '', xs = g.s ? (g.s === 1 ? 'x ' : `x^{${g.s}} `) : '';
      const cuerpo = g.w ? `${xs}${e}(${pol('A')} cos ${linTxt(g.w, 'x')} + ${pol('B')} sin ${linTxt(g.w, 'x')})`.replace('( ', '(') : `${xs}${pol('A')}${e}`;
      return { cuerpo, s: g.s };
    });
    const res = xs.some((q) => q.s) ? ` Comme ${part.grupos.filter((g) => g.s).map((g) => `$λ = ${g.w ? `${Math.abs(g.r) < 1e-12 ? '±' : cTxt(g.r) + ' ± '}${Math.abs(g.w - 1) < 1e-12 ? '' : cTxt(g.w) + ' '}i` : cTxt(g.r)}$`).join(' et ')} ${part.grupos.filter((g) => g.s).length > 1 ? 'sont racines' : 'est racine'} de l’équation caractéristique (résonance), on multiplie par $x${Math.max(...xs.map((q) => q.s)) > 1 ? `^${Math.max(...xs.map((q) => q.s))}` : ''}$.` : '';
    return `On essaie une fonction de même forme que le second membre : $y_p = ${xs.map((q) => (xs.length === 1 ? q.cuerpo.replace(/^\(([^()]*)\)$/, '$1') : q.cuerpo)).join(' + ')}$.${res}`;
  }

  function segundo(sc) {
    const a = num(sc.a, 'le coefficient a'), b = vacio(sc.b) ? 0 : num(sc.b, 'le coefficient b'), c = vacio(sc.c) ? 0 : num(sc.c, 'le coefficient c');
    if (Math.abs(a) < 1e-14) throw new Error('Le coefficient a de y″ ne peut pas être 0 (ce serait du premier ordre)');
    const gAst = vacio(sc.g) ? E.N(0) : E.lee(sc.g, 'Le terme g(x)');
    const x0 = num(sc.x0, 'la valeur x₀'), y0 = num(sc.y0, 'la valeur y(x₀)'), v0 = num(sc.v0, 'la valeur y′(x₀)'), x1 = num(sc.x1, 'la fin de l’intervalle');
    if (!(x1 > x0)) throw new Error('La fin de l’intervalle doit être supérieure à x₀');
    const gTxt = E.texto(E.simp(gAst)), homog = !E.tieneX(gAst) && Math.abs(E.valor(gAst, 0)) < 1e-14;
    const pasos = [], coefTxt = (k, s, primero) => { if (Math.abs(k) < 1e-14) return ''; const sg = k < 0 ? '−' : primero ? '' : '+', m = Math.abs(k); return `${primero ? sg : ` ${sg} `}${Math.abs(m - 1) < 1e-12 && s ? '' : cTxt(m) + (s ? ' ' : '')}${s}`; };
    const ecTxt = `${coefTxt(a, 'y″', true)}${coefTxt(b, 'y′')}${coefTxt(c, 'y')} = ${gTxt}`;
    const carTxt = `${coefTxt(a, 'λ^2', true)}${coefTxt(b, 'λ')}${coefTxt(c, '')} = 0`;
    pasos.push({ t: 'L’équation', html: `$${ecTxt}$ avec $y(${f(x0)}) = ${f(y0)}$ et $y′(${f(x0)}) = ${f(v0)}$. ${homog ? 'Elle est homogène.' : 'La solution est $y = y_h + y_p$ : celle de l’équation homogène plus une solution particulière.'}` });
    const D = b * b - 4 * a * c, al = -b / (2 * a);
    let hb, yhTxt, tipo, raices;
    if (D > 1e-12 * Math.max(1, b * b)) {
      const l1 = limpio(al + Math.sqrt(D) / (2 * Math.abs(a))), l2 = limpio(al - Math.sqrt(D) / (2 * Math.abs(a)));
      hb = [{ m: 0, r: l1, w: 0, p: null }, { m: 0, r: l2, w: 0, p: null }];
      raices = `$λ_1 = ${cTxt(l1)}$ et $λ_2 = ${cTxt(l2)}$, réelles et distinctes`;
      yhTxt = `C_1 ${baseTxt(hb[0]) || '· 1'} + C_2 ${baseTxt(hb[1]) || '· 1'}`.replace(/C_(\d) · 1/g, 'C_$1');
      tipo = 'Sur-amorti';
    } else if (D >= -1e-12 * Math.max(1, b * b)) {
      const l = limpio(al);
      hb = [{ m: 0, r: l, w: 0, p: null }, { m: 1, r: l, w: 0, p: null }];
      raices = `$λ = ${cTxt(l)}$, double`;
      yhTxt = l ? `(C_1 + C_2 x) e^{${linTxt(l, 'x')}}` : 'C_1 + C_2 x';
      tipo = 'Amortissement critique';
    } else {
      const be = limpio(Math.sqrt(-D) / (2 * Math.abs(a))), alc = limpio(al);
      hb = [{ m: 0, r: alc, w: be, p: 'cos' }, { m: 0, r: alc, w: be, p: 'sin' }];
      raices = `$λ = ${alc ? cTxt(alc) + ' ± ' : '±'}${Math.abs(be - 1) < 1e-12 ? '' : cTxt(be) + ' '}i$, complexes conjuguées`;
      const w = linTxt(be, 'x');
      yhTxt = `${alc ? `e^{${linTxt(alc, 'x')}} ` : ''}(C_1 cos ${w.includes(' ') || /^[{\d]/.test(w) ? `(${w})` : w} + C_2 sen ${w.includes(' ') || /^[{\d]/.test(w) ? `(${w})` : w})`.replace(/^\((.*)\)$/, '$1');
      tipo = Math.abs(alc) < 1e-14 ? 'Oscillation non amortie' : alc < 0 ? 'Sous-amorti (oscille et s’éteint)' : 'Oscillation croissante';
    }
    if (hb[0].r > 1e-12 || hb[1].r > 1e-12) tipo = D < 0 ? tipo : 'Croît sans limite (instable)';
    pasos.push({ t: 'Équation caractéristique', html: `En essayant $y = e^{λx}$ on obtient $${carTxt}$, de discriminant $Δ = b^2 − 4ac = ${f(D)}$ : ${raices}.<br>$y_h = ${yhTxt}$` });
    let part = { bases: [], grupos: [] }, ypTxt = '0', vp = null;
    if (!homog) {
      const ts = terminos(gAst);
      part = ts ? particular([c, b, a], ts) : null;
      if (part) {
        ypTxt = suma(part.bases.map((q) => ({ c: q.c, s: baseTxt(q) })));
        pasos.push({ t: 'Solution particulière', html: ansatzTxt(part, 2) + `<br>En substituant dans l’équation et en égalant les coefficients : $y_p = ${ypTxt}$` });
      } else {
        vp = variacion(hb, a, b, gAst, x0);
        if (!vp) throw new Error('On ne trouve pas la solution particulière : g(x) n’est pas du type des coefficients indéterminés (polynômes, exponentielles, sinus et cosinus) et, avec la variation des constantes, les intégrales n’ont pas de primitive simple');
        part = { bases: [], grupos: [] };
        ypTxt = T(vp.yp);
        pasos.push({ t: 'Variation des constantes', html: `g(x) n’est pas de celles que l’on résout par coefficients indéterminés, donc on cherche $y_p = u_1(x) y_1 + u_2(x) y_2$ avec $y_1 = ${T(vp.y1)}$ et $y_2 = ${T(vp.y2)}$. Le wronskien est $W = y_1 y_2′ − y_1′ y_2 = ${T(vp.W)}$ et<br>$u_1 = −∫ {y_2 g}/{${a === 1 ? '' : cTxt(a) + ' '}W} dx = ${T(vp.u1)}$, &ensp; $u_2 = ∫ {y_1 g}/{${a === 1 ? '' : cTxt(a) + ' '}W} dx = ${T(vp.u2)}$<br>donc $y_p = ${ypTxt}$` });
      }
    }
    const ypV = (x, i = 0) => (vp ? E.valor([vp.yp, vp.dyp, vp.d2][i], x) : evalBases(part.bases, x, i));
    const M = [[dReal(hb[0], 0, x0), dReal(hb[1], 0, x0)], [dReal(hb[0], 1, x0), dReal(hb[1], 1, x0)]];
    const Cs = resuelve(M, [y0 - ypV(x0), v0 - ypV(x0, 1)]).map(limpio);
    const todo = [...hb.map((q, i) => ({ ...q, c: Cs[i] })), ...part.bases];
    let sTxt = suma(juntar(todo.map((q) => ({ c: q.c, s: baseTxt(q) }))));
    if (vp) sTxt = sTxt === '0' ? ypTxt : `${sTxt} ${ypTxt.startsWith('−') ? '− ' + ypTxt.slice(1) : '+ ' + ypTxt}`;
    pasos.push({ t: 'Conditions initiales', html: `$y = ${yhTxt}${homog ? '' : ` + ${ypTxt.startsWith('−') ? `(${ypTxt})` : ypTxt}`}$. En imposant $y(${f(x0)}) = ${f(y0)}$ et $y′(${f(x0)}) = ${f(v0)}$ on obtient un système de deux équations avec $C_1 = ${cTxt(Cs[0])}$ et $C_2 = ${cTxt(Cs[1])}$ :<br>$y(x) = ${sTxt}$` });
    if (homog && a > 0 && c > 0 && b >= 0) pasos.push({ t: 'Interprétation', html: `C’est comme un oscillateur : masse a = ${f(a)}, frottement b = ${f(b)} et ressort c = ${f(c)}. ${b === 0 ? `Sans frottement, il oscille indéfiniment avec $ω = √(c/a) = ${cTxt(limpio(Math.sqrt(c / a)))}$ et une période $T = 2π/ω = ${cTxt(limpio((2 * Math.PI) / Math.sqrt(c / a)))}$.` : D < 0 ? `Le frottement est faible (Δ < 0) : il oscille avec $ω = ${f(Math.sqrt(-D) / (2 * a))}$ tandis que l’amplitude décroît comme $e^{${linTxt(al, 'x')}}$.` : D === 0 ? 'C’est l’amortissement critique : il revient à l’équilibre le plus vite possible sans osciller.' : 'Le frottement est grand (Δ > 0) : il revient à l’équilibre sans osciller, lentement.'}` });
    const y = (x, i = 0) => todo.reduce((s, q) => s + q.c * dReal(q, i, x), 0) + (vp ? ypV(x, i) : 0);
    return { modo: 'segundo', a, b, c, D, x0, y0, v0, x1, y, txt: sTxt, yhTxt, ypTxt, tipo, raices, homog, pasos, carTxt, ecTxt };
  }

  function baseAst({ m = 0, r = 0, w = 0, p: tr = null }) {
    let n = NN(1);
    if (m) n = op('*', n, op('^', XX, NN(m)));
    if (r) n = op('*', n, op('^', { t: 'c', v: 'e' }, op('*', NN(r), XX)));
    if (w) n = op('*', n, { t: 'fn', f: tr === 'sin' ? 'sin' : 'cos', a: op('*', NN(w), XX) });
    return E.simp(n);
  }
  function variacion(hb, a, b, g, x0) {
    const y1 = baseAst(hb[0]), y2 = baseAst(hb[1]), s = -b / a;
    const K = limpio(dReal(hb[0], 0, 0) * dReal(hb[1], 1, 0) - dReal(hb[0], 1, 0) * dReal(hb[1], 0, 0));
    if (Math.abs(K) < 1e-12) return null;
    const W = E.simp(s ? op('*', NN(K), op('^', { t: 'c', v: 'e' }, op('*', NN(limpio(s)), XX))) : NN(K));
    const invW = s ? op('*', NN(1 / (a * K)), op('^', { t: 'c', v: 'e' }, op('*', NN(limpio(-s)), XX))) : NN(1 / (a * K));
    const u1 = prim(op('*', NN(-1), op('*', op('*', y2, g), invW))), u2 = u1 && prim(op('*', op('*', y1, g), invW));
    if (!u1 || !u2) return null;
    const yp = E.simp(op('+', op('*', u1, y1), op('*', u2, y2))), dyp = E.simp(E.deriva(yp)), d2 = E.simp(E.deriva(dyp));
    const c = -(a * dReal(hb[0], 2, 0.3) + b * dReal(hb[0], 1, 0.3)) / dReal(hb[0], 0, 0.3);
    const ok = [x0 + 0.13, x0 + 0.29, x0 + 0.41].every((x) => { const l = a * E.valor(d2, x) + b * E.valor(dyp, x) + c * E.valor(yp, x), r = E.valor(g, x); return isFinite(l) && Math.abs(l - r) < 1e-6 * Math.max(1, Math.abs(r)); });
    return ok ? { y1, y2, W, u1, u2, yp, dyp, d2 } : null;
  }

  function leeEcuacion(src) {
    const t = String(src).replace(/⁗/g, "''''").replace(/‴/g, "'''").replace(/″/g, "''").replace(/[′’]/g, "'").replace(/[−–]/g, '-');
    const partes = t.split('=');
    if (partes.length !== 2) throw new Error('Écris l’équation avec un « = » : y‴ − y′ = x');
    const [izq, der] = partes, ts = [];
    let prof = 0, ini = 0;
    for (let i = 0; i <= izq.length; i++) {
      const ch = izq[i];
      if (ch === '(') prof++; else if (ch === ')') prof--;
      if (i === izq.length || ((ch === '+' || ch === '-') && !prof && i > 0 && !/[\^*/(]\s*$/.test(izq.slice(0, i)))) { if (izq.slice(ini, i).trim()) ts.push(izq.slice(ini, i)); ini = i; }
    }
    const co = [];
    for (const raw of ts) {
      const m = raw.trim().match(/^([+-]?)\s*(.*?)\s*[*·]?\s*y\s*('*)$/);
      if (!m) throw new Error(`Je ne comprends pas le terme « ${raw.trim()} » : chaque terme est un coefficient fois y, y′, y″, y‴ ou y⁗`);
      const k = m[3].length;
      if (k > 4) throw new Error('L’ordre maximal est 4');
      let c = 1, e = 0;
      if (m[2]) {
        const n = E.lee(m[2], 'Le coefficient');
        const v1 = E.valor(n, 1), v2 = E.valor(n, 2);
        e = E.tieneX(n) ? Math.round(Math.log2(v2 / v1)) : 0; c = v1;
        if (!isFinite(c) || [0.5, 3].some((x) => Math.abs(E.valor(n, x) - c * x ** e) > 1e-9 * Math.max(1, Math.abs(c * x ** e)))) throw new Error(`Le coefficient « ${m[2]} » doit être un nombre ou un nombre fois une puissance de x (Cauchy-Euler)`);
      }
      if (m[1] === '-') c = -c;
      const q = co.find((z) => z.k === k && z.e === e);
      if (q) q.c += c; else co.push({ k, c, e });
    }
    const orden = Math.max(...co.map((q) => q.k));
    if (orden < 1) throw new Error('L’équation doit contenir une dérivée de y');
    const g = der.trim() ? E.lee(der, 'Le second membre') : NN(0);
    return { co: co.filter((q) => Math.abs(q.c) > 1e-14), orden, g };
  }
  function potencias(g) {
    for (const b of [0, 0.5]) {
      let c;
      try { c = [...E.serie(E.simp(op('*', g, op('^', XX, NN(4 - b)))), 1, 14)]; } catch (e) { continue; }
      if (c.slice(11).some((v) => Math.abs(v) > 1e-9 * Math.max(1, ...c.map(Math.abs)))) continue;
      const cs = Array(11).fill(0);
      c.slice(0, 11).forEach((k, j) => { for (let i = 0; i <= j; i++) cs[i] += k * binom(j, i) * (-1) ** (j - i); });
      const ts = cs.map((k, i) => ({ m: i - 4 + b, c: limpio(Math.abs(k) < 1e-9 ? 0 : k) })).filter((q) => q.c);
      if ([1.1, 2.5, 3.7].every((x) => Math.abs(ts.reduce((q, t) => q + t.c * x ** t.m, 0) - E.valor(g, x)) < 1e-7 * Math.max(1, Math.abs(E.valor(g, x))))) return ts;
    }
    return null;
  }
  const ordTxt = (k) => ['y', 'y′', 'y″', 'y‴', 'y^{(4)}'][k];
  function superior(sc) {
    const { co, orden, g } = leeEcuacion(sc.ec || '');
    const x0 = num(sc.x0, 'la valeur x₀'), x1 = num(sc.x1, 'la fin de l’intervalle');
    if (!(x1 > x0)) throw new Error('La fin de l’intervalle doit être supérieure à x₀');
    const ini = String(sc.ini ?? '').split(';').map((q) => q.trim()).filter(Boolean);
    if (ini.length !== orden) throw new Error(`Les conditions initiales manquent : écris ${orden} valeurs séparées par « ; », ${['y(x₀)', 'y′(x₀)', 'y″(x₀)', 'y‴(x₀)'].slice(0, orden).join('; ')}`);
    const Y0 = ini.map((q, i) => num(q, `la condition ${i + 1}`));
    const cauchy = co.some((q) => q.e), homog = !E.tieneX(g) && Math.abs(E.valor(g, 0)) < 1e-14;
    if (cauchy && co.some((q) => q.e !== q.k)) throw new Error('Avec des coefficients contenant x, on ne résout que le type Cauchy-Euler : chaque dérivée k-ième multipliée par x^k (x^2 y″ + x y′ − y = 0)');
    if (cauchy && !(x0 > 0)) throw new Error('Dans l’équation de Cauchy-Euler, x₀ doit être positif (la solution utilise ln x)');
    const a = Array(orden + 1).fill(0); co.forEach((q) => { a[q.k] += q.c; });
    if (Math.abs(a[orden]) < 1e-14) throw new Error('Le coefficient de la dérivée d’ordre le plus élevé ne peut pas être 0');
    const pasos = [], gTxt = E.texto(E.simp(g));
    const ecTxt = co.sort((p, q) => q.k - p.k).map((q, i) => { const xk = q.e ? (q.e === 1 ? 'x ' : `x^{${q.e}} `) : '', m = Math.abs(q.c), cc = Math.abs(m - 1) < 1e-12 ? '' : cTxt(m) + ' '; return `${i ? (q.c < 0 ? ' − ' : ' + ') : q.c < 0 ? '−' : ''}${cc}${xk}${ordTxt(q.k)}`; }).join('') + ` = ${gTxt}`;
    pasos.push({ t: 'L’équation', html: `$${ecTxt}$, d’ordre ${orden}${cauchy ? ', de <b>Cauchy-Euler</b> (chaque dérivée k-ième va avec $x^k$)' : ', linéaire à coefficients constants'}, avec ${Y0.map((v, i) => `$${ordTxt(i)}(${f(x0)}) = ${f(v)}$`).join(', ')}.` });
    let P = a;
    if (cauchy) {
      P = Array(orden + 1).fill(0);
      a.forEach((ak, k) => { let q = [1]; for (let j = 0; j < k; j++) { const nq = Array(q.length + 1).fill(0); q.forEach((c, i) => { nq[i + 1] += c; nq[i] -= j * c; }); q = nq; } q.forEach((c, i) => { P[i] += ak * c; }); });
      P = P.map(limpio);
    }
    const rs = Lp.raices(P), v = cauchy ? 'r' : 'λ';
    const polTxt = P.map((c, i) => ({ c, s: i ? (i === 1 ? v : `${v}^{${i}}`) : '' })).reverse();
    const raizTxt = (q) => (Math.abs(q.p.im) < 1e-12 ? cTxt(limpio(q.p.re)) : `${Math.abs(q.p.re) < 1e-12 ? '' : cTxt(limpio(q.p.re)) + ' + '}${Math.abs(Math.abs(q.p.im) - 1) < 1e-12 ? '' : cTxt(limpio(Math.abs(q.p.im))) + ' '}i`);
    const raices = rs.filter((q) => q.p.im >= -1e-12).map((q) => `$${v} = ${raizTxt(q)}$${q.p.im > 1e-12 ? ' et sa conjuguée' : ''}${q.m > 1 ? ` (${['', '', 'doble', 'triple', 'quadruple'][q.m]})` : ''}`).join(', ');
    const hb = [];
    for (const q of rs) {
      if (q.p.im < -1e-12) continue;
      for (let j = 0; j < q.m; j++) {
        if (Math.abs(q.p.im) < 1e-12) hb.push({ m: j, r: limpio(q.p.re), w: 0, p: null });
        else hb.push({ m: j, r: limpio(q.p.re), w: limpio(q.p.im), p: 'cos' }, { m: j, r: limpio(q.p.re), w: limpio(q.p.im), p: 'sin' });
      }
    }
    const LN = { t: 'fn', f: 'ln', a: XX };
    const ast = (b) => {
      if (!cauchy) return baseAst(b);
      let n = NN(1);
      if (b.m) n = op('*', n, op('^', LN, NN(b.m)));
      if (b.r) n = op('*', n, op('^', XX, NN(b.r)));
      if (b.w) n = op('*', n, { t: 'fn', f: b.p === 'sin' ? 'sin' : 'cos', a: op('*', NN(b.w), LN) });
      return E.simp(n);
    };
    const bTxt = (b) => { const t = cauchy ? T(ast(b)) : baseTxt(b); return t === '1' ? '' : t; };
    const yhTxt = hb.map((b, i) => `C_{${i + 1}}${bTxt(b) ? ' ' + bTxt(b) : ''}`).join(' + ');
    pasos.push({ t: cauchy ? 'Équation indicielle' : 'Équation caractéristique', html: `${cauchy ? 'En essayant $y = x^r$ (ou avec le changement $x = e^t$, qui la ramène à des coefficients constants)' : 'En essayant $y = e^{λx}$'} on obtient $${suma(polTxt)} = 0$, de racines ${raices}.<br>$y_h = ${yhTxt}$${cauchy ? '<br>Une racine double donne $x^r$ et $x^r ln x$ ; une racine complexe $α ± βi$ donne $x^α cos(β ln x)$ et $x^α sin(β ln x)$.' : ''}` });
    let yp = NN(0), ypTxt = '0';
    if (!homog) {
      if (cauchy) {
        const ts = potencias(g);
        if (!ts) throw new Error('Dans l’équation de Cauchy-Euler, le second membre doit être une somme de puissances de x : x, x^2, 1/x…');
        const Pd = (m, k) => P.reduce((q, c, i) => (i >= k ? q + ((c * FACT[i]) / FACT[i - k]) * m ** (i - k) : q), 0);
        let reson = false;
        yp = E.simp(ts.reduce((q, t) => {
          let sM = 0; while (sM < orden && Math.abs(Pd(t.m, sM)) < 1e-9) sM++;
          if (sM) reson = true;
          const base = sM ? op('*', op('^', XX, NN(t.m)), op('^', LN, NN(sM))) : op('^', XX, NN(t.m));
          return op('+', q, op('*', NN(limpio(t.c / Pd(t.m, sM))), base));
        }, NN(0)));
        ypTxt = T(yp);
        pasos.push({ t: 'Solution particulière', html: `Pour chaque puissance $x^m$ du second membre, on essaie $A x^m$ : en substituant on obtient $A Q(m) x^m$, avec Q le polynôme indiciel, donc $A = {c}/{Q(m)}$.${reson ? ' Si m est racine de Q (résonance), on essaie $A x^m ln x$ (ou $A x^m (ln x)^2$ si elle est double), et alors $A = {c}/{Q′(m)}$ (ou ${c}/{Q″(m)}$).' : ''}<br>$y_p = ${ypTxt}$` });
      } else {
        const ts = terminos(g), part = ts ? particular(a, ts) : null;
        if (!part) throw new Error('Le second membre doit être une somme de polynômes, d’exponentielles, de sinus et de cosinus pour être résolu par coefficients indéterminés');
        yp = E.simp(part.bases.reduce((q, b) => op('+', q, op('*', NN(b.c), baseAst(b))), NN(0)));
        ypTxt = suma(part.bases.map((q) => ({ c: q.c, s: baseTxt(q) })));
        pasos.push({ t: 'Solution particulière', html: ansatzTxt(part, orden) + `<br>En substituant dans l’équation et en égalant les coefficients : $y_p = ${ypTxt}$` });
      }
    }
    const der = (n, k) => { let q = n; for (let i = 0; i < k; i++) q = E.simp(E.deriva(q)); return q; };
    const bs = hb.map(ast), Mx = Y0.map((_, k) => bs.map((b) => E.valor(der(b, k), x0))), rhs = Y0.map((y, k) => y - E.valor(der(yp, k), x0));
    const Cs = resuelve(Mx, rhs);
    if (!Cs) throw new Error('On ne trouve pas les constantes avec ces conditions initiales');
    const Cl = Cs.map(limpio);
    const sol = E.simp(bs.reduce((q, b, i) => op('+', q, op('*', NN(Cl[i]), b)), yp));
    const hTxt = suma(hb.map((b, i) => ({ c: Cl[i], s: bTxt(b) })));
    const txt = homog ? hTxt : hTxt === '0' ? ypTxt : `${hTxt} ${ypTxt.startsWith('−') ? '− ' + ypTxt.slice(1) : '+ ' + ypTxt}`;
    pasos.push({ t: 'Conditions initiales', html: `En imposant les ${orden} conditions, on obtient un système de ${orden} équations avec ${Cl.map((c, i) => `$C_{${i + 1}} = ${cTxt(c)}$`).join(', ')} :<br>$y(x) = ${txt}$` });
    const d1 = der(sol, 1), y = (x, i = 0) => E.valor(i ? d1 : sol, x);
    const tipo = cauchy ? `Cauchy-Euler d’ordre ${orden}` : `Coefficients constants, ordre ${orden}`;
    return { modo: 'segundo', superior: true, orden, cauchy, x0, y0: Y0[0], v0: Y0[1] ?? 0, x1, y, sol, txt, raices, tipo, homog, pasos, ecTxt };
  }

  function autovalores(J) {
    const [[a, b], [c, d]] = J, tr = a + d, det = a * d - b * c, D = tr * tr - 4 * det;
    return { tr, det, D, l: D >= 0 ? [(tr + Math.sqrt(D)) / 2, (tr - Math.sqrt(D)) / 2] : null, al: tr / 2, be: D < 0 ? Math.sqrt(-D) / 2 : 0 };
  }
  function tipoPunto(ev, tol = 1e-9) {
    const { tr, det, D } = ev;
    if (Math.abs(det) < tol) return { nom: 'point critique non isolé (det = 0)', est: null };
    if (det < 0) return { nom: 'point selle', est: false };
    if (Math.abs(D) < tol) return { nom: tr < 0 ? 'nœud impropre stable' : 'nœud impropre instable', est: tr < 0 };
    if (D > 0) return { nom: tr < 0 ? 'nœud stable' : 'nœud instable', est: tr < 0 };
    if (Math.abs(tr) < tol) return { nom: 'centre (orbites fermées)', est: null };
    return { nom: tr < 0 ? 'foyer stable (spirale convergente)' : 'foyer instable (spirale divergente)', est: tr < 0 };
  }
  const evTxt = (ev) => (ev.l ? (Math.abs(ev.l[0] - ev.l[1]) < 1e-12 ? `$λ = ${cTxt(limpio(ev.l[0]))}$ (double)` : `$λ_1 = ${cTxt(limpio(ev.l[0]))}$, $λ_2 = ${cTxt(limpio(ev.l[1]))}$`) : `$λ = ${Math.abs(ev.al) < 1e-12 ? '±' : cTxt(limpio(ev.al)) + ' ± '}${Math.abs(ev.be - 1) < 1e-12 ? '' : cTxt(limpio(ev.be)) + ' '}i$`);
  const matHtml = (M) => `<span class="mat"><table>${M.map((r) => `<tr>${r.map((c) => `<td>$${c}$</td>`).join('')}</tr>`).join('')}</table></span>`;
  const matTxt = (J) => matHtml(J.map((r) => r.map((v) => cTxt(limpio(v)))));
  function sistema(sc) {
    const fA = E.lee(sc.f, 'La fonction de x′', ['x', 'y']), gA = E.lee(sc.g, 'La fonction de y′', ['x', 'y']);
    const x0 = num(sc.x0, 'la valeur x(0)'), y0 = num(sc.y0, 'la valeur y(0)'), t1 = num(sc.t1, 'le temps final');
    if (!(t1 > 0)) throw new Error('Le temps final doit être positif');
    const F = (x, y) => E.valor(fA, x, { y }), G = (x, y) => E.valor(gA, x, { y });
    if (!isFinite(F(x0, y0)) || !isFinite(G(x0, y0))) throw new Error('Le système n’est pas défini au point initial');
    const fT = E.texto(E.simp(fA)), gT = E.texto(E.simp(gA)), pasos = [];
    pasos.push({ t: 'Le système', html: `$x′ = ${fT}$, &ensp; $y′ = ${gT}$, avec $(x(0), y(0)) = (${f(x0)}, ${f(y0)})$. Chaque point du plan a une vitesse (x′, y′) : c’est le champ de directions du diagramme de phase.` });
    const dfx = E.deriva(fA, 'x'), dfy = E.deriva(fA, 'y'), dgx = E.deriva(gA, 'x'), dgy = E.deriva(gA, 'y');
    const J = (x, y) => [[E.valor(dfx, x, { y }), E.valor(dfy, x, { y })], [E.valor(dgx, x, { y }), E.valor(dgy, x, { y })]];
    const prueba = [[0.3, -0.7], [1.9, 0.4], [-1.2, 2.3]], J0 = J(0.11, 0.23);
    const esLineal = prueba.every(([x, y]) => J(x, y).flat().every((v, i) => isFinite(v) && Math.abs(v - J0.flat()[i]) < 1e-9 * Math.max(1, Math.abs(v))));
    const puntos = [];
    let sol = null;
    if (esLineal) {
      const A = J0.map((r) => r.map(limpio)), e = [limpio(F(0, 0)), limpio(G(0, 0))];
      const ev = autovalores(A), tp = tipoPunto(ev);
      pasos.push({ t: 'Elle est linéaire', html: `$(x′, y′) = A (x, y)${e[0] || e[1] ? ` + (${cTxt(e[0])}, ${cTxt(e[1])})` : ''}$ avec $A =$ ${matTxt(A)}. Trace $= ${cTxt(ev.tr)}$, déterminant $= ${cTxt(ev.det)}$ et $Δ = tr^2 − 4 det = ${cTxt(limpio(ev.D))}$.` });
      if (Math.abs(ev.det) > 1e-12) {
        const X = resuelve(A, [-e[0], -e[1]]).map(limpio);
        puntos.push({ x: X[0], y: X[1], J: A, ev, tp });
        pasos.push({ t: 'Point critique', html: `Là où x′ = y′ = 0 : $(${cTxt(X[0])}, ${cTxt(X[1])})$. Les valeurs propres de A, racines de $λ^2 − ${cTxt(ev.tr)} λ + ${cTxt(ev.det)} = 0$, sont ${evTxt(ev)} : c’est un <b>${tp.nom}</b>.`.replace('− −', '+ ').replace('+ −', '− ') });
        sol = lineal2(A, X, x0, y0);
        if (sol) pasos.push({ t: 'Solution', html: sol.html + `<br>$x(t) = ${sol.xTxt}$<br>$y(t) = ${sol.yTxt}$` });
      } else pasos.push({ t: 'Points critiques', html: 'Le déterminant est nul : les points critiques forment une droite (ou il n’y en a aucun), et la solution se calcule numériquement.' });
    } else {
      const W = Math.max(4, 2 * Math.abs(x0), 2 * Math.abs(y0));
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        let x = (i * W) / 3, y = (j * W) / 3, ok = false;
        for (let k = 0; k < 40; k++) {
          const Jm = J(x, y), fx = F(x, y), gx = G(x, y), det = Jm[0][0] * Jm[1][1] - Jm[0][1] * Jm[1][0];
          if (!isFinite(fx) || !isFinite(gx) || Math.abs(det) < 1e-14) break;
          const dx = (fx * Jm[1][1] - gx * Jm[0][1]) / det, dy = (gx * Jm[0][0] - fx * Jm[1][0]) / det;
          x -= dx; y -= dy;
          if (Math.hypot(dx, dy) < 1e-12) { ok = Math.abs(F(x, y)) + Math.abs(G(x, y)) < 1e-10; break; }
        }
        if (ok && Math.abs(x) <= 1.5 * W && Math.abs(y) <= 1.5 * W && !puntos.some((q) => Math.hypot(q.x - x, q.y - y) < 1e-6)) { const Jm = J(x, y), ev = autovalores(Jm); puntos.push({ x: limpio(x), y: limpio(y), J: Jm, ev, tp: tipoPunto(ev) }); }
      }
      puntos.sort((p, q) => p.x - q.x || p.y - q.y);
      pasos.push({ t: 'Jacobienne', html: `Il n’est pas linéaire : près de chaque point critique, il ressemble à sa linéarisation, avec la matrice jacobienne<br>$J(x, y) =$ ${matHtml([[E.texto(dfx), E.texto(dfy)], [E.texto(dgx), E.texto(dgy)]])}` });
      pasos.push({ t: 'Points critiques', html: puntos.length ? puntos.slice(0, 6).map((q) => `$(${cTxt(q.x)}, ${cTxt(q.y)})$: $J =$ ${matTxt(q.J)}, ${evTxt(q.ev)} → <b>${q.tp.nom}</b>`).join('<br>') + (puntos.length > 6 ? `<br>… et ${puntos.length - 6} de plus` : '') : 'Aucun point critique n’a été trouvé près de l’origine.' });
    }
    const tray = rk4((t, Y) => [F(Y[0], Y[1]), G(Y[0], Y[1])], 0, [x0, y0], t1, 1500);
    const fin = tray[tray.length - 1];
    pasos.push({ t: 'Trajectoire', html: `En intégrant avec Runge-Kutta depuis (${f(x0)}, ${f(y0)}) jusqu’à t = ${f(t1)} : $(x, y) ≈ (${f(fin.Y[0], 5)}, ${f(fin.Y[1], 5)})$${fin.t < t1 - 1e-9 ? ` (la solution diverge avant, en t ≈ ${f(fin.t)})` : ''}.` });
    return { modo: 'sistema', F, G, fT, gT, x0, y0, t1, puntos, lineal: esLineal, sol, tray, xf: fin.Y[0], yf: fin.Y[1], pasos };
  }
  function lineal2(A, X, x0, y0) {
    const [[a, b], [c, d]] = A, ev = autovalores(A), u0 = [x0 - X[0], y0 - X[1]];
    const vec = (l) => (Math.abs(b) > 1e-12 ? [1, (l - a) / b] : Math.abs(c) > 1e-12 ? [(l - d) / c, 1] : null);
    const comp = (ts, k, X0) => suma(juntar([{ c: X0, s: '' }, ...ts.map((q) => ({ c: q.c * q.v[k], s: baseTxt(q, 't') }))]));
    if (ev.l && Math.abs(ev.l[0] - ev.l[1]) > 1e-10) {
      const [l1, l2] = ev.l.map(limpio);
      let v1 = vec(l1), v2 = vec(l2);
      if (!v1 || !v2) { v1 = Math.abs(a - l1) < 1e-12 ? [1, 0] : [0, 1]; v2 = v1[0] ? [0, 1] : [1, 0]; }
      v1 = v1.map(limpio); v2 = v2.map(limpio);
      const C = resuelve([[v1[0], v2[0]], [v1[1], v2[1]]], u0).map(limpio);
      const ts = [{ c: C[0], v: v1, r: l1, m: 0, w: 0, p: null }, { c: C[1], v: v2, r: l2, m: 0, w: 0, p: null }];
      const X_ = (t) => [0, 1].map((k) => X[k] + ts.reduce((s, q) => s + q.c * q.v[k] * Math.exp(q.r * t), 0));
      return { html: `Vecteurs propres $v_1 = (${v1.map(cTxt).join(', ')})$ et $v_2 = (${v2.map(cTxt).join(', ')})$, donc $X(t) = X^* + C_1 v_1 e^{λ_1 t} + C_2 v_2 e^{λ_2 t}$ ; avec le point initial, $C_1 = ${cTxt(C[0])}$ et $C_2 = ${cTxt(C[1])}$ :`, xTxt: comp(ts, 0, X[0]), yTxt: comp(ts, 1, X[1]), X: X_ };
    }
    if (ev.l) {
      const l = limpio(ev.l[0]);
      if (Math.abs(b) < 1e-12 && Math.abs(c) < 1e-12) {
        const ts = [{ c: 1, v: u0.map(limpio), r: l, m: 0, w: 0, p: null }];
        return { html: `A = λI : toutes les directions sont propres et $X(t) = X^* + e^{λt} (X(0) − X^*)$ :`, xTxt: comp(ts, 0, X[0]), yTxt: comp(ts, 1, X[1]), X: (t) => [0, 1].map((k) => X[k] + u0[k] * Math.exp(l * t)) };
      }
      const v = vec(l).map(limpio), w = resuelve([[a - l, b], [c, d - l]].map((r) => r), v) || (Math.abs(b) > 1e-12 ? [0, 1 / b] : [1 / c, 0]);
      const C = resuelve([[v[0], w[0]], [v[1], w[1]]], u0).map(limpio), wl = w.map(limpio);
      const ts = [{ c: 1, v: [C[0] * v[0] + C[1] * wl[0], C[0] * v[1] + C[1] * wl[1]], r: l, m: 0, w: 0, p: null }, { c: C[1], v, r: l, m: 1, w: 0, p: null }];
      return { html: `Valeur propre double avec un seul vecteur propre $v = (${v.map(cTxt).join(', ')})$ et un vecteur généralisé $w = (${wl.map(cTxt).join(', ')})$ : $X(t) = X^* + e^{λt}[C_1 v + C_2 (t v + w)]$, avec $C_1 = ${cTxt(C[0])}$ et $C_2 = ${cTxt(C[1])}$ :`, xTxt: comp(ts, 0, X[0]), yTxt: comp(ts, 1, X[1]), X: (t) => [0, 1].map((k) => X[k] + ts.reduce((s, q) => s + q.c * q.v[k] * t ** q.m * Math.exp(l * t), 0)) };
    }
    const al = limpio(ev.al), be = limpio(ev.be);
    let P, Q;
    if (Math.abs(b) > 1e-12) { P = [1, (al - a) / b]; Q = [0, be / b]; } else { P = [(al - d) / c, 1]; Q = [be / c, 0]; }
    P = P.map(limpio); Q = Q.map(limpio);
    const C = resuelve([[P[0], Q[0]], [P[1], Q[1]]], u0).map(limpio);
    const cosK = [0, 1].map((k) => limpio(C[0] * P[k] + C[1] * Q[k])), senK = [0, 1].map((k) => limpio(C[1] * P[k] - C[0] * Q[k]));
    const ts = [{ c: 1, v: cosK, r: al, m: 0, w: be, p: 'cos' }, { c: 1, v: senK, r: al, m: 0, w: be, p: 'sin' }];
    return { html: `Avec $λ = α + iβ$ et son vecteur propre $v = (${P.map(cTxt).join(', ')}) + i (${Q.map(cTxt).join(', ')})$, les parties réelle et imaginaire de $v e^{λt}$ donnent deux solutions réelles ; avec le point initial :`, xTxt: comp(ts, 0, X[0]), yTxt: comp(ts, 1, X[1]), X: (t) => [0, 1].map((k) => X[k] + Math.exp(al * t) * (cosK[k] * Math.cos(be * t) + senK[k] * Math.sin(be * t))) };
  }

  function resolver(sc) {
    if (sc.modo === 'segundo') return segundo(sc);
    if (sc.modo === 'sistema') return sistema(sc);
    if (sc.modo === 'superior') return superior(sc);
    return primer(sc);
  }

  const P1 = (f_, x0, y0, x1, h) => ({ modo: 'primer', f: f_, x0, y0, x1, h });
  const P2 = (a, b, c, g, y0, v0, x1) => ({ modo: 'segundo', a, b, c, g, x0: '0', y0, v0, x1 });
  const PS = (f_, g, x0, y0, t1) => ({ modo: 'sistema', f: f_, g, x0, y0, t1 });
  const PN = (ec, x0, ini, x1) => ({ modo: 'superior', ec, x0, ini, x1 });
  const ejemplos = [
    { clave: 'euler', nombre: 'y′ = x + y avec Euler (h = 0,1)', sc: P1('x + y', '0', '1', '1', '0,1') },
    { clave: 'lineal', nombre: 'y′ = 4 − 2y : tend vers l’équilibre', sc: P1('4 - 2y', '0', '0', '3', '0,25') },
    { clave: 'enfriamiento', nombre: 'Loi de refroidissement de Newton', sc: P1('-0,1(y - 20)', '0', '90', '30', '2') },
    { clave: 'forzada', nombre: 'y′ + y = sin x', sc: P1('sin x - y', '0', '0', '10', '0,5') },
    { clave: 'logistica', nombre: 'Logistique : y′ = y(1 − y)', sc: P1('y(1 - y)', '0', '0,1', '10', '0,5') },
    { clave: 'riccati', nombre: 'y′ = x − y² (non linéaire)', sc: P1('x - y^2', '0', '0', '4', '0,2') },
    { clave: 'separable', nombre: 'Séparable : y′ = x y', sc: P1('x y', '0', '1', '2', '0,2') },
    { clave: 'factor', nombre: 'Facteur intégrant : y′ = x² − y/x', sc: P1('x^2 - y/x', '1', '1', '3', '0,2') },
    { clave: 'bernoulli', nombre: 'Bernoulli : y′ = y + x y²', sc: P1('y + x y^2', '0', '0,1', '1,5', '0,1') },
    { clave: 'exacta', nombre: 'Exacte : y′ = −(2x + y)/(x + 2y)', sc: P1('-(2x + y)/(x + 2y)', '0', '1', '0,5', '0,05') },
    { clave: 'mas', nombre: 'y″ + 4y = 0 : oscillateur harmonique', sc: P2('1', '0', '4', '0', '1', '0', '10') },
    { clave: 'subamortiguado', nombre: 'y″ + 2y′ + 5y = 0 : sous-amorti', sc: P2('1', '2', '5', '0', '1', '0', '6') },
    { clave: 'critico', nombre: 'y″ + 2y′ + y = x : critique avec forçage', sc: P2('1', '2', '1', 'x', '0', '0', '8') },
    { clave: 'exponencial', nombre: 'y″ − 3y′ + 2y = e^(3x)', sc: P2('1', '-3', '2', 'e^(3x)', '0', '0', '1,5') },
    { clave: 'resonancia', nombre: 'y″ + y = cos x : résonance', sc: P2('1', '0', '1', 'cos x', '0', '0', '30') },
    { clave: 'forzado', nombre: 'Oscillateur forcé : y″ + 0,5y′ + 4y = 3 cos(2x)', sc: P2('1', '0,5', '4', '3 cos(2x)', '0', '0', '20') },
    { clave: 'variacion', nombre: 'Variation des constantes : y″ + y = 1/cos x', sc: P2('1', '0', '1', '1/cos(x)', '0', '0', '1,4') },
    { clave: 'orden3', nombre: 'Ordre 3 : y‴ − 3y″ + 3y′ − y = eˣ', sc: PN("y''' - 3y'' + 3y' - y = e^x", '0', '1; 0; 0', '2') },
    { clave: 'orden4', nombre: 'Ordre 4 : y⁗ − y = 0', sc: PN("y'''' - y = 0", '0', '1; 0; 0; 0', '4') },
    { clave: 'cauchy', nombre: 'Cauchy-Euler : x² y″ − 2x y′ + 2y = x³', sc: PN("x^2 y'' - 2x y' + 2y = x^3", '1', '0; 0', '3') },
    { clave: 'cauchy-complejo', nombre: 'Cauchy-Euler : x² y″ + x y′ + y = 0', sc: PN("x^2 y'' + x y' + y = 0", '1', '1; 0', '20') },
    { clave: 'silla', nombre: 'Système linéaire : point selle', sc: PS('x + y', '4x + y', '1', '-1,5', '2') },
    { clave: 'centro', nombre: 'Système linéaire : centre', sc: PS('y', '-x', '2', '0', '7') },
    { clave: 'foco', nombre: 'Système linéaire : foyer stable', sc: PS('-x - 2y', '2x - y', '3', '0', '6') },
    { clave: 'nodo', nombre: 'Système linéaire : nœud stable', sc: PS('-3x + y', 'x - 3y', '2', '3', '3') },
    { clave: 'lotka', nombre: 'Proies et prédateurs (Lotka-Volterra)', sc: PS('2x - x y', 'x y - 3y', '1', '1', '10') },
    { clave: 'pendulo', nombre: 'Pendule amorti', sc: PS('y', '-sin x - 0,3y', '0', '2,5', '25') },
  ];

  return { resolver, ejemplos, terminos, particular, autovalores, tipoPunto, rk4, f, cTxt };
})();

