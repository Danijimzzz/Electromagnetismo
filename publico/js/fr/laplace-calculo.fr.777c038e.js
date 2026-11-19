const Laplace = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  const FACT = [1]; for (let k = 1; k <= 30; k++) FACT[k] = FACT[k - 1] * k;
  const cTxt = (c) => (E.exacto(c, 200) ? E.numTxt(c) : f(c, 4));
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function num(s, nom) {
    if (vacio(s)) throw new Error(`Il manque ${nom}`);
    const n = E.lee(s, may(nom), ['t', 's']);
    if (E.tieneX(n, 't') || E.tieneX(n, 's')) throw new Error(`${may(nom)} doit être un nombre`);
    const v = E.valor(n, 0, {});
    if (!isFinite(v)) throw new Error(`${may(nom)} n’est pas un nombre`);
    return v;
  }

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
  const rDiv = (a, b) => { if (limpia(b.n).length === 1 && Math.abs(b.n[0]) < 1e-300) throw new Error('Division par zéro dans F(s)'); return R(pMul(a.n, b.d), pMul(a.d, b.n)); };
  const rDer = (a) => R(pSuma(pMul(pDer(a.n), a.d), pEsc(pMul(a.n, pDer(a.d)), -1)), pMul(a.d, a.d));
  const rPot = (a, k) => { let r = R([1]); for (let i = 0; i < Math.abs(k); i++) r = rMul(r, a); return k < 0 ? rDiv(R([1]), r) : r; };
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
  const normaliza = (r) => { const d = limpia(r.d), k = d[d.length - 1]; return R(pEsc(r.n, 1 / k), pEsc(d, 1 / k)); };
  const rTxt = (r) => { const q = normaliza(r); return grado(q.d) === 0 ? pTxt(pEsc(q.n, 1 / q.d[0])) : `{${pTxt(q.n)}}/{${pTxt(q.d)}}`; };

  function racional(n) {
    switch (n.t) {
      case 'n': return R([n.v]);
      case 'c': return R([E.valor(n, 0, {})]);
      case 'x': if (n.n === 's') return R([0, 1]); throw new Error('F(s) ne peut contenir que la variable s');
      case 'neg': { const a = racional(n.a); return R(pEsc(a.n, -1), a.d); }
      case '+': return rSuma(racional(n.a), racional(n.b));
      case '-': { const b = racional(n.b); return rSuma(racional(n.a), R(pEsc(b.n, -1), b.d)); }
      case '*': return rMul(racional(n.a), racional(n.b));
      case '/': return rDiv(racional(n.a), racional(n.b));
      case '^': {
        if (E.tieneX(n.b, 's')) throw new Error('F(s) ne peut pas avoir s dans un exposant : ce doit être une fraction de polynômes');
        const k = E.valor(n.b, 0, {});
        if (!Number.isInteger(k) || Math.abs(k) > 20) throw new Error('Les exposants de F(s) doivent être des entiers');
        return rPot(racional(n.a), k);
      }
      case 'fn': if (!E.tieneX(n, 's')) return R([E.valor(n, 0, {})]); throw new Error(`F(s) doit être une fraction de polynômes en s (${n.f}(s) n’est pas admis)`);
    }
    throw new Error('No entiendo F(s)');
  }

  const C = (re, im = 0) => ({ re, im });
  const cAdd = (a, b) => C(a.re + b.re, a.im + b.im), cSub = (a, b) => C(a.re - b.re, a.im - b.im);
  const cMul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const cDiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  const cAbs = (a) => Math.hypot(a.re, a.im);
  const cVal = (p, z) => p.reduceRight((s, c) => cAdd(cMul(s, z), typeof c === 'number' ? C(c) : c), C(0));
  function raices(p) {
    const q = limpia(p), n = q.length - 1;
    if (n < 1) return [];
    const m = pEsc(q, 1 / q[n]), cota = 2 * Math.max(...m.slice(0, n).map((c, i) => Math.abs(c) ** (1 / (n - i)))) || 1;
    let z = Array.from({ length: n }, (_, k) => { const a = (2 * Math.PI * k) / n + 0.4; return C(cota * 0.9 * Math.cos(a), cota * 0.9 * Math.sin(a)); });
    for (let it = 0; it < 2000; it++) {
      let mx = 0;
      z = z.map((zi, i) => { let den = C(1); z.forEach((zj, j) => { if (j !== i) den = cMul(den, cSub(zi, zj)); }); const dz = cDiv(cVal(m, zi), den); mx = Math.max(mx, cAbs(dz)); return cSub(zi, dz); });
      if (mx < 1e-15 * cota) break;
    }
    const snap = (x, tol) => { if (Math.abs(x) < tol) return 0; for (let q = 1; q <= 24; q++) { const k = Math.round(x * q); if (Math.abs(k / q - x) < tol * Math.max(1, Math.abs(x))) return k / q; } return x; };
    let out = null;
    for (const radio of [1e-1, 2e-2, 2e-3, 2e-4, 0]) {
      const grupos = [];
      for (const r of z) { const g = grupos.find((x) => cAbs(cSub(x.c, r)) <= radio * Math.max(1, cAbs(r))); if (g) { g.v.push(r); g.c = C(g.v.reduce((s, x) => s + x.re, 0) / g.v.length, g.v.reduce((s, x) => s + x.im, 0) / g.v.length); } else grupos.push({ c: r, v: [r] }); }
      for (const g of grupos) if (g.v.length > 1) {
        let d = m; for (let k = 1; k < g.v.length; k++) d = pDer(d);
        const d1 = pDer(d);
        for (let it = 0; it < 40; it++) { const v = cVal(d1, g.c); if (cAbs(v) < 1e-300) break; const dz = cDiv(cVal(d, g.c), v); g.c = cSub(g.c, dz); if (cAbs(dz) < 1e-15 * cota) break; }
      }
      const cand = grupos.map((g) => ({ p: C(snap(g.c.re, 1e-7), snap(g.c.im, 1e-7)), m: g.v.length }));
      let prod = [C(1)];
      for (const r of cand) for (let k = 0; k < r.m; k++) { const nx = new Array(prod.length + 1).fill(null).map(() => C(0)); prod.forEach((c, i) => { nx[i + 1] = cAdd(nx[i + 1], c); nx[i] = cSub(nx[i], cMul(c, r.p)); }); prod = nx; }
      const err = Math.max(...prod.map((c, i) => Math.abs(c.re - m[i]) + Math.abs(c.im))) / Math.max(1, ...m.map(Math.abs));
      if (err < 1e-8) { out = cand; break; }
    }
    if (!out) throw new Error('Je n’ai pas pu factoriser le dénominateur avec précision');
    return out.sort((a, b) => a.p.re - b.p.re || Math.abs(a.p.im) - Math.abs(b.p.im) || a.p.im - b.p.im);
  }
  function taylorP(p, z0) {
    let a = p.map((c) => (typeof c === 'number' ? C(c) : c));
    const out = [];
    while (a.length) { const q = new Array(a.length - 1).fill(null).map(() => C(0)); let acc = C(0); for (let i = a.length - 1; i >= 0; i--) { acc = cAdd(cMul(acc, z0), a[i]); if (i > 0) q[i - 1] = acc; } out.push(acc); a = q; }
    return out;
  }
  function residuos(r) {
    const N = limpia(r.n), D = limpia(r.d), lead = D[D.length - 1], polos = raices(D);
    return polos.map(({ p, m }) => {
      let Qp = [C(1)];
      for (const o of polos) if (o.p !== p) for (let k = 0; k < o.m; k++) { const nx = new Array(Qp.length + 1).fill(null).map(() => C(0)); Qp.forEach((c, i) => { nx[i + 1] = cAdd(nx[i + 1], c); nx[i] = cSub(nx[i], cMul(c, o.p)); }); Qp = nx; }
      const nT = taylorP(N, p).map((c) => cDiv(c, C(lead))), dT = taylorP(Qp, p);
      const g = [];
      for (let k = 0; k < m; k++) { let s = nT[k] || C(0); for (let j = 1; j <= k; j++) s = cSub(s, cMul(dT[j] || C(0), g[k - j])); g.push(cDiv(s, dT[0])); }
      return { p, m, A: Array.from({ length: m }, (_, j) => g[m - 1 - j]) };
    });
  }

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

  const sinParen = (d) => /^s(\^\{\d+\})?$|^\([^()]*\)\^\{\d+\}$/.test(d);
  function frNum(c, num, den) {
    const v = Math.abs(c) * num, e = E.fraccion(v, 200);
    if (!e || Math.abs(e[0] / e[1] - v) > 1e-9 * Math.max(1, v)) return { c, s: `{${cTxt(num)}}/{${den}}` };
    return { c: Math.sign(c), s: e[1] === 1 ? `{${e[0]}}/{${den}}` : `{${e[0]}}/{${e[1]} ${sinParen(den) ? den : `(${den})`}}` };
  }
  const sMenos = (p) => (Math.abs(p) < 1e-12 ? 's' : p > 0 ? `s − ${cTxt(p)}` : `s + ${cTxt(-p)}`);
  const linT = (r, v = 't') => { const a = Math.abs(r), sg = r < 0 ? '−' : ''; if (Math.abs(a - 1) < 1e-12) return `${sg}${v}`; const e = E.exacto(a, 12); if (e && !e.s && e.q !== 1) return `${sg}{${e.p === 1 ? '' : e.p + ' '}${v}}/{${e.q}}`; return `${sg}${cTxt(a)} ${v}`; };
  const expT = (r, v = 't') => (Math.abs(r) < 1e-12 ? '' : `e^{${linT(r, v)}}`);
  const trigT = (p, w, v = 't') => { if (!w) return ''; const a = linT(w, v); return `${p} ${a === v ? v : /[ {]/.test(a) ? `(${a})` : a}`; };
  const potT = (k, v = 't') => (k === 0 ? '' : k === 1 ? v : `${v}^{${k}}`);
  function suma(ts) {
    const vivos = ts.filter((t) => Math.abs(t.c) > 1e-10);
    if (!vivos.length) return '0';
    return vivos.map((t, i) => {
      const a = Math.abs(t.c), neg = t.c < 0;
      const cuerpo = !t.s ? cTxt(a) : Math.abs(a - 1) < 1e-12 ? t.s : `${cTxt(a)} ${t.s}`;
      return i ? `${neg ? ' − ' : ' + '}${cuerpo}` : `${neg ? '−' : ''}${cuerpo}`;
    }).join('');
  }

  function lineal(u) {
    const u0 = E.valor(u, 0, { t: 0 }), r = E.valor(u, 0, { t: 1 }) - u0;
    if (!isFinite(u0) || !isFinite(r) || Math.abs(E.valor(u, 0, { t: 2.5 }) - (u0 + 2.5 * r)) > 1e-9 * Math.max(1, Math.abs(r))) return null;
    return { u0, r };
  }
  let linealiza = false;
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
      const mult = (otros) => {
        const nb = [];
        for (const a of base) for (const b of otros) {
          const q = { c: a.c * b.c, k: a.k + b.k, r: a.r + b.r, h: a.h || b.h };
          if (!(a.p && b.p)) { nb.push({ ...q, w: a.w + b.w, p: a.p || b.p }); continue; }
          linealiza = true;
          const d = a.w - b.w, s1 = a.w + b.w, mas = (p, w, c) => { if (Math.abs(w) < 1e-14) { if (p === 'cos') nb.push({ ...q, c: q.c * c, w: 0, p: null }); return; } nb.push({ ...q, c: q.c * c * (p === 'sin' && w < 0 ? -1 : 1), w: Math.abs(w), p }); };
          if (a.p === 'cos' && b.p === 'cos') { mas('cos', d, 0.5); mas('cos', s1, 0.5); }
          else if (a.p === 'sin' && b.p === 'sin') { mas('cos', d, 0.5); mas('cos', s1, -0.5); }
          else if (a.p === 'sin') { mas('sin', s1, 0.5); mas('sin', d, 0.5); }
          else { mas('sin', s1, 0.5); mas('sin', -d, 0.5); }
        }
        base = nb; return true;
      };
      function fac(q) {
        if (q.t === '*') return fac(q.a) && fac(q.b);
        if (q.t === '/' && nT(q.b)) { const d = E.valor(q.b, 0, {}); return fac(q.a) && mult([{ c: 1 / d, k: 0, r: 0, w: 0, p: null }]); }
        if (q.t === 'neg') return fac(q.a) && mult([{ c: -1, k: 0, r: 0, w: 0, p: null }]);
        if (q.t === '+' || q.t === '-') { const sub = terminos(q); return !!sub && mult(sub); }
        if (nT(q)) { const v = E.valor(q, 0, {}); return isFinite(v) && mult([{ c: v, k: 0, r: 0, w: 0, p: null }]); }
        if (q.t === '^' && nT(q.b) && E.tieneX(q.a, 't')) { const n = E.valor(q.b, 0, {}); if (!Number.isInteger(n) || n < 0 || n > 12 || (q.a.t === 'x')) { if (q.a.t !== 'x') return false; } else { for (let i = 0; i < n; i++) if (!fac(q.a)) return false; return true; } }
        if (q.t === 'x' && q.n === 't') return mult([{ c: 1, k: 1, r: 0, w: 0, p: null }]);
        if (q.t === '^' && q.a.t === 'x' && q.a.n === 't' && q.b.t === 'n' && Number.isInteger(q.b.v) && q.b.v >= 0 && q.b.v <= 12) return mult([{ c: 1, k: q.b.v, r: 0, w: 0, p: null }]);
        if ((q.t === '^' && q.a.t === 'c' && q.a.v === 'e') || (q.t === 'fn' && q.f === 'exp')) { const l = lineal(q.t === '^' ? q.b : q.a); return !!l && mult([{ c: Math.exp(l.u0), k: 0, r: l.r, w: 0, p: null }]); }
        if (q.t === 'fn' && (q.f === 'sin' || q.f === 'cos')) {
          const l = lineal(q.a); if (!l || Math.abs(l.r) < 1e-14) return false;
          const w = Math.abs(l.r), sg = Math.sign(l.r), c0 = Math.cos(l.u0), s0 = Math.sin(l.u0);
          return mult(q.f === 'sin' ? [{ c: sg * c0, k: 0, r: 0, w, p: 'sin' }, { c: s0, k: 0, r: 0, w, p: 'cos' }] : [{ c: c0, k: 0, r: 0, w, p: 'cos' }, { c: -sg * s0, k: 0, r: 0, w, p: 'sin' }]);
        }
        if (q.t === 'fn' && (q.f === 'sinh' || q.f === 'cosh')) { const l = lineal(q.a); if (!l) return false; const a = Math.exp(l.u0) / 2, b = Math.exp(-l.u0) / 2; return mult([{ c: a, k: 0, r: l.r, w: 0, p: null, h: q.f }, { c: q.f === 'sinh' ? -b : b, k: 0, r: -l.r, w: 0, p: null, h: q.f }]); }
        return false;
      }
      if (!fac(m)) return null;
      return base.map((b) => (b.w ? b : { ...b, p: null }));
    }
    try { enSuma(E.simp(ast), 1); } catch (e) { if (e === 0) return null; throw e; }
    const out = [];
    for (const t of ts) { const o = out.find((q) => q.k === t.k && Math.abs(q.r - t.r) < 1e-12 && Math.abs(q.w - t.w) < 1e-12 && q.p === t.p); if (o) { o.c += t.c; if (o.h !== t.h) o.h = undefined; } else out.push({ ...t }); }
    return out.filter((t) => Math.abs(t.c) > 1e-14);
  }
  function transTermino({ k, r, w, p }) {
    let base = !p ? R([1], [-r, 1]) : p === 'sin' ? R([w], [r * r + w * w, -2 * r, 1]) : R([-r, 1], [r * r + w * w, -2 * r, 1]);
    for (let i = 0; i < k; i++) base = simplifica(rDer(base));
    if (k % 2) base = R(pEsc(base.n, -1), base.d);
    return base;
  }
  function formaTabla({ c, k, r, w, p }) {
    const a = sMenos(r), q2 = w ? `${r === 0 ? 's^{2}' : `(${a})^{2}`} + ${cTxt(w * w)}` : '';
    let num = null, den = null, txt;
    if (!p) { num = FACT[k]; den = k === 0 ? a : r === 0 ? `s^{${k + 1}}` : `(${a})^{${k + 1}}`; }
    else if (k === 0 && p === 'sin') { num = w; den = q2; }
    else if (k === 0) txt = `{${a}}/{${q2}}`;
    else txt = factTxt(transTermino({ k, r, w, p }));
    if (num !== null) txt = `{${cTxt(num)}}/{${den}}`;
    return { c, txt, conC: num !== null ? frNum(c, num, den) : { c, s: txt } };
  }
  const fTermTxt = (t, v = 't') => [potT(t.k, v), expT(t.r, v), trigT(t.p, t.w, v)].filter(Boolean).join(' ');

  function directa(sc) {
    if (vacio(sc.f)) throw new Error('Il manque f(t)');
    const ast = leeT(sc.f, 'f(t)');
    if (E.tieneX(ast, 's')) throw new Error('f(t) ne peut pas contenir s');
    if (tieneSalto(ast)) return directaSaltos(ast, sc);
    linealiza = false;
    const ts = terminos(ast);
    if (!ts) throw new Error('Je ne sais transformer que des sommes de termes c·tⁿ·e^{at}·sin(bt) ou cos(bt) (aussi sinh et cosh)');
    if (!ts.length) throw new Error('f(t) es 0');
    const pasos = [];
    if (ts.length > 1) pasos.push({ t: 'Linéarité', html: `$ℒ\\{a f + b g\\} = a F(s) + b G(s)$ : on transforme chaque terme séparément.<br>$f(t) = ${suma(ts.map((t) => ({ c: t.c, s: fTermTxt(t) })))}$` });
    const usa = new Set();
    const lineas = ts.map((t) => {
      const ft = fTermTxt(t), F = formaTabla(t);
      if (!t.p && t.k === 0 && t.r === 0) usa.add('$ℒ\\{1\\} = {1}/{s}$');
      if (!t.p && t.k > 0) usa.add('$ℒ\\{t^{n}\\} = {n!}/{s^{n+1}}$');
      if (t.p === 'sin') usa.add('$ℒ\\{sen(bt)\\} = {b}/{s^{2} + b^{2}}$');
      if (t.p === 'cos') usa.add('$ℒ\\{cos(bt)\\} = {s}/{s^{2} + b^{2}}$');
      if (t.r) usa.add('$ℒ\\{e^{at} f(t)\\} = F(s − a)$ (décalage en s)');
      if (t.k && t.p) usa.add('$ℒ\\{t^{n} f(t)\\} = (−1)^{n} {d^{n}F}/{ds^{n}}$');
      if (t.k && t.p) { const b = formaTabla({ ...t, k: 0 }), d = t.k === 1 ? '−{d}/{ds}' : `${t.k % 2 ? '−' : ''}{d^{${t.k}}}/{ds^{${t.k}}}`; return `$ℒ\\{${fTermTxt({ ...t, k: 0 })}\\} = ${b.txt}$ &ensp;⇒&ensp; $ℒ\\{${ft}\\} = ${d} (${b.txt}) = ${F.txt}$`; }
      return `$ℒ\\{${ft || '1'}\\} = ${F.txt}$`;
    });
    if (linealiza) pasos.unshift({ t: 'Linéariser', html: 'Les produits de sinus et de cosinus se transforment en sommes : $sin A cos B = {1}/{2} [sin(A + B) + sin(A − B)]$, $cos A cos B = {1}/{2} [cos(A − B) + cos(A + B)]$, $sin A sin B = {1}/{2} [cos(A − B) − cos(A + B)]$. Par exemple, $sin^{2} t = {1}/{2} − {1}/{2} cos (2 t)$.' });
    pasos.push({ t: 'Tableau et propriétés', html: `${[...usa].join('<br>')}` });
    pasos.push({ t: 'Chaque terme', html: lineas.join('<br>') });
    let Fs = R([0]);
    for (const t of ts) { const b = transTermino(t); Fs = simplifica(rSuma(Fs, R(pEsc(b.n, t.c), b.d))); }
    const hechos = new Set(), sumaTxt = [];
    ts.forEach((t, i) => {
      if (hechos.has(i)) return;
      const j = t.h && t.k === 0 ? ts.findIndex((o, jj) => jj > i && !hechos.has(jj) && o.h === t.h && o.k === 0 && !o.p && !t.p && Math.abs(Math.abs(o.c) - Math.abs(t.c)) < 1e-12) : -1;
      if (j < 0) { sumaTxt.push(formaTabla(t).conC); return; }
      hechos.add(j);
      const al = (t.r + ts[j].r) / 2, a = Math.abs(t.r - ts[j].r) / 2, d = `${Math.abs(al) < 1e-12 ? 's^{2}' : `(${sMenos(al)})^{2}`} − ${cTxt(a * a)}`, cosh = Math.abs(t.c - ts[j].c) < 1e-12;
      const c = 2 * (cosh ? t.c : (t.r > ts[j].r ? t.c : ts[j].c));
      sumaTxt.push(cosh ? { c, s: `{${sMenos(al)}}/{${d}}` } : frNum(c, a, d));
      usa.add(cosh ? '$ℒ\\{cosh(at)\\} = {s}/{s^{2} − a^{2}}$' : '$ℒ\\{senh(at)\\} = {a}/{s^{2} − a^{2}}$');
    });
    const conv = Math.max(...ts.map((t) => t.r));
    pasos.push({ t: 'Résultat', html: `$F(s) = ${suma(sumaTxt)}$${ts.length > 1 ? `<br>Avec un dénominateur commun : $F(s) = ${factTxt(Fs)}$` : ''}<br>Elle existe pour $s > ${cTxt(conv)}$.` });
    const fn = (tt) => ts.reduce((s, q) => s + q.c * tt ** q.k * Math.exp(q.r * tt) * (q.p === 'sin' ? Math.sin(q.w * tt) : q.p === 'cos' ? Math.cos(q.w * tt) : 1), 0);
    return { modo: 'directa', ts, conv, F: Fs, Ftxt: suma(sumaTxt), Fcomun: rTxt(Fs), Ffact: factTxt(Fs), f: fn, ftxt: suma(ts.map((t) => ({ c: t.c, s: fTermTxt(t) }))), polos: raicesSeguras(Fs.d), ceros: raicesSeguras(Fs.n), pasos };
  }
  function raicesSeguras(p) { try { return raices(p); } catch (e) { return []; } }

  function invierte(F, pasos, nombre = 'F') {
    const q = simplifica(F);
    if (grado(q.d) < 1) throw new Error(`${nombre}(s) n’a pas de dénominateur contenant s : son inverse serait une delta de Dirac`);
    if (grado(q.n) >= grado(q.d)) throw new Error(`${nombre}(s) doit être propre (le degré du numérateur inférieur à celui du dénominateur) ; sinon l’inverse contient des deltas de Dirac`);
    const rs = residuos(q);
    const polosTxt = rs.filter(({ p }) => p.im > -1e-12).map(({ p, m }) => { const par = p.im > 1e-12, b = Math.abs(p.im), bt = Math.abs(b - 1) < 1e-12 ? '' : cTxt(b) + ' '; return `$s = ${!par ? cTxt(p.re) : `${Math.abs(p.re) < 1e-12 ? '±' : cTxt(p.re) + ' ±'} ${bt}i`}$${m > 1 ? ` (${m === 2 ? 'doble' : m === 3 ? 'triple' : `multiplicidad ${m}`}${par ? 's' : ''})` : ''}`; });
    pasos.push({ t: 'Pôles', html: `Les racines du dénominateur $${factTxt(R([1], q.d)).replace(/^\{1\}\/\{(.*)\}$/, '$1')} = 0$ sont ${polosTxt.join(', ')}.` });
    const frac = [], terms = [];
    for (const { p, m, A } of rs) {
      if (Math.abs(p.im) < 1e-12) {
        A.forEach((a, j) => { frac.push(frNum(a.re, 1, j ? (Math.abs(p.re) < 1e-12 ? `s^{${j + 1}}` : `(${sMenos(p.re)})^{${j + 1}}`) : sMenos(p.re))); terms.push({ c: a.re / FACT[j], k: j, r: p.re, w: 0, p: null }); });
      } else if (p.im > 0) {
        const al = p.re, be = p.im, Q = [al * al + be * be, -2 * al, 1], Qtxt = `${Math.abs(al) < 1e-12 ? 's^{2}' : `(${sMenos(al)})^{2}`} + ${cTxt(be * be)}`;
        A.forEach((a, j) => { terms.push({ c: (2 * a.re) / FACT[j], k: j, r: al, w: be, p: 'cos' }, { c: (-2 * a.im) / FACT[j], k: j, r: al, w: be, p: 'sin' }); });
        const cp = (z) => [C(-z.re, -z.im), C(1)], cpMul = (a, b) => { const r = new Array(a.length + b.length - 1).fill(null).map(() => C(0)); a.forEach((x, i) => b.forEach((y, k) => { r[i + k] = cAdd(r[i + k], cMul(x, y)); })); return r; };
        let Nre = [0];
        A.forEach((a, j) => { let t = [a]; for (let i = 0; i < m - 1 - j; i++) t = cpMul(t, cp(p)); for (let i = 0; i < m; i++) t = cpMul(t, cp(C(p.re, -p.im))); Nre = pSuma(Nre, t.map((z) => 2 * z.re)); });
        const restos = [];
        for (let i = 0; i < m; i++) { const r = Nre.slice(), qq = new Array(Math.max(1, r.length - 2)).fill(0); for (let d = r.length - 1; d >= 2; d--) { const k = r[d]; qq[d - 2] = k; r[d] -= k; r[d - 1] -= k * Q[1]; r[d - 2] -= k * Q[0]; } restos.push([r[0] || 0, r[1] || 0]); Nre = qq; }
        restos.forEach((r, i) => {
          const jj = m - i, den = jj > 1 ? `(${Qtxt})^{${jj}}` : Qtxt;
          const ent = (x) => Math.abs(x - Math.round(x)) < 1e-9, mcd = (x, y) => (y ? mcd(y, x % y) : x);
          if (Math.abs(r[1]) > 1e-10) {
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
      h += `<br>Chaque coefficient d’un pôle simple s’obtient en masquant son facteur : $A = [(s − p) ${nombre}(s)]_{s = p}$`;
      h += reales.filter((x) => x.m === 1).map(({ p, A }) => `<br>$[(${sMenos(p.re)}) ${nombre}(s)]_{s = ${cTxt(p.re)}} = ${cTxt(A[0].re)}$`).join('');
    }
    if (reales.some((x) => x.m > 1)) h += '<br>Avec un pôle de multiplicité m, $A_{m−j} = {1}/{j!} [{d^{j}}/{ds^{j}} ((s − p)^{m} F(s))]_{s = p}$.';
    if (compl.length) h += '<br>Chaque paire de pôles complexes $α ± βi$ donne un terme $(Bs + C)/((s − α)^{2} + β^{2})$, qui se sépare en $B (s − α)/(…) + (C + Bα)/β · β/(…)$.';
    if (compl.some((x) => x.m > 1)) h += '<br>Avec des pôles complexes doubles, on travaille avec $p = α + βi$ complexe : $ℒ^{−1}\\{{A}/{(s − p)^{2}} + {Ā}/{(s − p̄)^{2}}\\} = 2 t e^{αt} ("Re" A cos βt − "Im" A sin βt)$.';
    pasos.push({ t: 'Décomposition en éléments simples', html: h });
    const ft = terms.filter((t) => Math.abs(t.c) > 1e-10);
    const tab = [];
    if (reales.length) tab.push('$ℒ^{−1}\\{{1}/{s − a}\\} = e^{at}$');
    if (reales.some((x) => x.m > 1)) tab.push('$ℒ^{−1}\\{{1}/{(s − a)^{n+1}}\\} = {t^{n}}/{n!} e^{at}$');
    if (compl.length) tab.push('$ℒ^{−1}\\{{s − α}/{(s − α)^{2} + β^{2}}\\} = e^{αt} cos(βt)$, $ℒ^{−1}\\{{β}/{(s − α)^{2} + β^{2}}\\} = e^{αt} sen(βt)$');
    pasos.push({ t: 'Inverse terme à terme', html: `${tab.join('<br>')}<br>$f(t) = ${suma(ft.map((t) => ({ c: t.c, s: fTermTxt(t) })))}$ &ensp; pour $t ≥ 0$` });
    return { rs, terms: ft, frac: fracTxt, txt: suma(ft.map((t) => ({ c: t.c, s: fTermTxt(t) }))) };
  }
  const evalTerms = (ts) => (tt) => ts.reduce((s, q) => s + q.c * tt ** q.k * Math.exp(q.r * tt) * (q.p === 'sin' ? Math.sin(q.w * tt) : q.p === 'cos' ? Math.cos(q.w * tt) : 1), 0);
  function limites(F, rs, pasos, F0 = F) {
    const q = normaliza(F), sF = simplifica(R(pMul(q.n, [0, 1]), q.d)), q0 = normaliza(F0), sF0 = esCero(F0) ? R([0]) : simplifica(R(pMul(q0.n, [0, 1]), q0.d));
    const gn = grado(sF0.n), gd = grado(sF0.d), ini = esCero(F0) ? 0 : gn < gd ? 0 : gn === gd ? limpia(sF0.n)[gn] / limpia(sF0.d)[gd] : Infinity;
    const estable = rs.every(({ p }) => p.re < -1e-12 || (Math.abs(p.re) < 1e-12 && Math.abs(p.im) < 1e-12 && rs.find((x) => x.p === p).m === 1));
    const fin = estable ? pVal(sF.n, 0) / pVal(sF.d, 0) : null;
    pasos.push({ t: 'Valeurs initiale et finale', html: `Valeur initiale : $f(0^{+}) = lim_{s→∞} s F(s) = ${isFinite(ini) ? cTxt(ini) : '∞'}$<br>${estable ? `Valeur finale : $lim_{t→∞} f(t) = lim_{s→0} s F(s) = ${cTxt(fin)}$` : 'Valeur finale : elle n’existe pas, car il y a des pôles de partie réelle positive, ou sur l’axe imaginaire (sauf un pôle simple en 0), et f(t) croît ou oscille indéfiniment.'}` });
    return { ini, fin };
  }
  function inversa(sc) {
    if (vacio(sc.F)) throw new Error('Il manque F(s)');
    const ast = E.lee(sc.F, 'F(s)', ['s']);
    if (E.tieneX(ast, 't')) throw new Error('F(s) ne peut pas contenir t');
    const igualG = () => { try { const r = simplifica(racional(ast)); return grado(r.d) >= 1 && grado(r.n) === grado(r.d); } catch (e) { return false; } };
    if (tieneExpS(ast) || igualG()) {
      const gs = gruposS(ast, 'F(s)'), pasos = [];
      if (!gs.length) throw new Error('F(s) es 0');
      const inv = invierteSG(gs, pasos), tot = gs.reduce((x, g) => rSuma(x, g.R), R([0])), g0 = gs.find((g) => !g.a);
      const prop = (r) => { const q = normaliza(r), gn = grado(q.n); return gn === grado(q.d) && gn ? simplifica(rSuma(q, R([-limpia(q.n)[gn]]))) : gn ? q : R([0]); };
      const lim = limites(prop(tot), inv.rs, pasos, g0 ? prop(g0.R) : R([0]));
      return { modo: 'inversa', saltos: true, gs, Fcomun: sgTxt(gs), Ffact: sgTxt(gs), Fval: (s) => sgVal(gs, s), ...inv, lim, polos: inv.rs, ceros: [], pasos };
    }
    const F = simplifica(racional(ast)), pasos = [];
    pasos.push({ t: 'Fonction rationnelle', html: `$F(s) = ${rTxt(F)}${factTxt(F) !== rTxt(F) ? ` = ${factTxt(F)}` : ''}$` });
    const inv = invierte(F, pasos), lim = limites(F, inv.rs, pasos);
    return { modo: 'inversa', F, Fcomun: rTxt(F), Ffact: factTxt(F), ...inv, f: evalTerms(inv.terms), lim, polos: inv.rs, ceros: raicesSeguras(normaliza(F).n), pasos };
  }

  function edo(sc) {
    const orden = sc.orden === '1' ? 1 : 2, a = orden === 2 ? num(sc.a, 'le coefficient de y″') : 0, b = num(sc.b, `le coefficient de y′`), c = num(sc.c, 'le coefficient de y');
    if (orden === 2 && a === 0) throw new Error('Le coefficient de y″ ne peut pas être 0 (l’équation serait du premier ordre)');
    if (orden === 1 && b === 0) throw new Error('Le coefficient de y′ ne peut pas être 0');
    const y0 = num(sc.y0, 'y(0)'), v0 = orden === 2 ? num(sc.v0, 'y′(0)') : 0, pasos = [];
    let G = R([0]), g = () => 0, gts = [], GS = null, gtxt = '0';
    if (!vacio(sc.g) && String(sc.g).trim() !== '0') {
      const ast = leeT(sc.g, 'g(t)');
      if (tieneSalto(ast)) { const T = transformaT(ast, 'g(t)'); GS = T.gs; g = T.f; gtxt = T.txt; }
      else {
        gts = terminos(ast);
        if (!gts) throw new Error('g(t) doit être une somme de termes c·tⁿ·e^{at}·sin(bt) ou cos(bt), avec des échelons u(t − a) ou des deltas δ(t − a)');
        for (const t of gts) { const q = transTermino(t); G = rSuma(G, R(pEsc(q.n, t.c), q.d)); }
        g = evalTerms(gts); gtxt = suma(gts.map((t) => ({ c: t.c, s: fTermTxt(t) })));
      }
    }
    const ec = `${orden === 2 ? `${a === 1 ? '' : cTxt(a) + ' '}y″ ` : ''}${suma([...(orden === 2 ? [] : []), { c: b, s: 'y′' }, { c, s: 'y' }]).replace(/^(?!−)/, orden === 2 ? '+ ' : '').replace(/^\+ −/, '− ')} = ${gtxt}`;
    pasos.push({ t: 'Équation', html: `$${ec}$, avec $y(0) = ${cTxt(y0)}$${orden === 2 ? ` et $y′(0) = ${cTxt(v0)}$` : ''}` });
    const dentro = (ts) => suma(ts) === '0' ? '0' : suma(ts);
    const lado = [orden === 2 ? { c: a, s: y0 || v0 ? `(${dentro([{ c: 1, s: 's^{2}Y' }, { c: -y0, s: 's' }, { c: -v0, s: '' }])})` : 's^{2}Y' } : null, { c: b, s: y0 ? `(sY − ${cTxt(y0)})`.replace('− −', '+ ') : 'sY' }, { c, s: 'Y' }].filter(Boolean);
    pasos.push({ t: 'En transformant', html: `Avec $ℒ\\{y′\\} = sY − y(0)$${orden === 2 ? ' et $ℒ\\{y″\\} = s^{2}Y − s y(0) − y′(0)$' : ''} :<br>$${suma(lado)} = ${GS ? sgTxt(GS) : gts.length ? factTxt(G) : '0'}$` });
    const car = orden === 2 ? [c, b, a] : [c, b], ini = orden === 2 ? [a * v0 + b * y0, a * y0] : [b * y0];
    const hayIni = limpia(ini).some((x) => Math.abs(x) > 1e-12);
    let out;
    if (!GS) {
      const Y = simplifica(rDiv(rSuma(G, R(ini)), R(car)));
      pasos.push({ t: 'En isolant Y(s)', html: `$(${pTxt(car)}) Y(s) = ${gts.length ? `${factTxt(G)}${hayIni ? ` + ${pTxt(ini)}`.replace('+ −', '− ') : ''}` : pTxt(ini)}$<br>$Y(s) = ${factTxt(Y)}$` });
      const inv = invierte(Y, pasos, 'Y');
      pasos[pasos.length - 1].t = 'Solution';
      pasos[pasos.length - 1].html = pasos[pasos.length - 1].html.replace('f(t) =', 'y(t) =');
      out = { G, Y, Fcomun: rTxt(Y), Ffact: factTxt(Y), ...inv, f: evalTerms(inv.terms), polos: inv.rs, ceros: raicesSeguras(normaliza(Y).n) };
    } else {
      const YS = sgSuma(sgMulR(GS, R([1], car)), hayIni ? [{ a: 0, R: R(ini, car) }] : []).filter((q) => !esCero(q.R));
      pasos.push({ t: 'En isolant Y(s)', html: `$(${pTxt(car)}) Y(s) = ${sgTxt(GS)}${hayIni ? ` + ${pTxt(ini)}`.replace('+ −', '− ') : ''}$<br>$Y(s) = ${sgTxt(YS)}$` });
      const inv = invierteSG(YS, pasos, 'Y');
      pasos[pasos.length - 1].t = 'Solution';
      out = { G: GS, Y: YS, Fcomun: sgTxt(YS), Ffact: sgTxt(YS), ...inv, polos: inv.rs, ceros: [] };
    }
    const H = R([1], car), hI = invierte(H, []), hE = invierte(R([1], pMul(car, [0, 1])), []);
    pasos.push({ t: 'Fonction de transfert', html: `Avec des conditions initiales nulles, $Y(s) = H(s) G(s)$ avec $H(s) = ${factTxt(H)}$.<br>Réponse impulsionnelle (avec $g = δ(t)$) : $h(t) = ℒ^{−1}\\{H(s)\\} = ${hI.txt}$<br>Réponse à l’échelon unité (avec $g = u(t)$) : $ℒ^{−1}\\{{H(s)}/{s}\\} = ${hE.txt}$<br>Et en général la partie forcée est la convolution $(h * g)(t)$.` });
    return { modo: 'edo', orden, a, b, c, y0, v0, g, ...out, H, htxt: hI.txt, Htxt: factTxt(H), escTxt: hE.txt, ec, pasos };
  }

  const T_ = { t: 'x', n: 't' }, uno = E.N(1), menos = E.N(-1);
  const opN = (o, a, b) => ({ t: o, a, b });
  const tieneSalto = (n) => !!n && ((n.t === 'fn' && (n.f === 'u' || n.f === 'δ')) || tieneSalto(n.a) || tieneSalto(n.b));
  const esExpS = (n) => n.t === '^' && n.a.t === 'c' && n.a.v === 'e' && E.tieneX(n.b, 's');
  const tieneExpS = (n) => !!n && (esExpS(n) || tieneExpS(n.a) || tieneExpS(n.b));
  const corre = (n, a) => (n.t === 'x' && n.n === 't' ? opN('+', T_, E.N(a)) : n.a ? { ...n, a: corre(n.a, a), ...(n.b ? { b: corre(n.b, a) } : {}) } : n);
  function sumandos(n, hay) {
    if (!hay(n)) return [[n]];
    if (n.t === '+') return [...sumandos(n.a, hay), ...sumandos(n.b, hay)];
    if (n.t === '-') return [...sumandos(n.a, hay), ...sumandos(n.b, hay).map((fs) => [menos, ...fs])];
    if (n.t === 'neg') return sumandos(n.a, hay).map((fs) => [menos, ...fs]);
    if (n.t === '*') { const A = sumandos(n.a, hay), B = sumandos(n.b, hay); return A.flatMap((x) => B.map((y) => [...x, ...y])); }
    if (n.t === '/' && !hay(n.b)) return sumandos(n.a, hay).map((fs) => [...fs, opN('/', uno, n.b)]);
    if (n.t === '^' && n.a.t === 'fn' && n.a.f === 'u' && n.b.t === 'n' && Number.isInteger(n.b.v) && n.b.v > 0) return [[n.a]];
    return [[n]];
  }
  const prodF = (fs) => (fs.length ? fs.reduce((x, y) => opN('*', x, y)) : uno);
  const minus = (n) => n[0].toLowerCase() + n.slice(1);
  const tA = (a) => (Math.abs(a) < 1e-12 ? 't' : `t − ${cTxt(a)}`);
  const eS = (a) => `e^{−${linT(a, 's')}}`;

  function trozos(src, nom) {
    const ps = String(src).split(';').map((x) => x.trim()).filter(Boolean), out = [];
    for (const p of ps) {
      const m = p.match(/^(.*?)\s+(?:si|if)\s+(.+)$/i);
      if (!m) throw new Error(`${nom} : chaque morceau doit être « expression si a ≤ t < b », séparés par « ; »`);
      const c = m[2].replace(/≤|=</g, '<=').replace(/≥|=>/g, '>=').replace(/\s+/g, '');
      let a = 0, b = Infinity, q;
      if ((q = c.match(/^(.+?)<=?t<=?(.+)$/))) { a = num(q[1], 'le début du morceau'); b = num(q[2], 'la fin du morceau'); }
      else if ((q = c.match(/^t>=?(.+)$/))) a = num(q[1], 'le début du morceau');
      else if ((q = c.match(/^t<=?(.+)$/))) b = num(q[1], 'la fin du morceau');
      else throw new Error(`${nom} : je ne comprends pas la condition « ${m[2]} » ; écris a ≤ t < b, t ≥ a ou t < b`);
      if (!(b > a)) throw new Error(`${nom} : dans le morceau « ${p} » la fin doit être supérieure au début`);
      if (a < 0) a = 0;
      out.push({ g: E.lee(m[1], nom, ['t']), a, b });
    }
    if (!out.length) throw new Error(`Il manque ${nom}`);
    return out;
  }
  function leeT(src, nom) {
    const pre = String(src).replace(/(^|[^a-zA-Záéíóúñ])[uH]\s*\(/g, '$1escalon(').replace(/δ\s*\(/g, 'delta(');
    if (!/\bsi\b/i.test(pre)) return E.lee(pre, nom, ['t']);
    const ts = trozos(pre, nom), U = (a) => ({ t: 'fn', f: 'u', a: opN('-', T_, E.N(a)) });
    const ast = ts.map(({ g, a, b }) => opN('*', g, isFinite(b) ? opN('-', U(a), U(b)) : U(a))).reduce((x, y) => opN('+', x, y));
    ast.trozos = ts;
    return ast;
  }
  const trozosTxt = (ts) => ts.map(({ g, a, b }) => `$${E.texto(g)}$ &ensp; si &ensp; $${isFinite(b) ? `${cTxt(a)} ≤ t < ${cTxt(b)}` : `t ≥ ${cTxt(a)}`}$`).join('<br>');
  const trozosU = (ts) => suma(ts.filter(({ g }) => !(g.t === 'n' && g.v === 0)).map(({ g, a, b }) => { const x = E.texto(g), u1 = a ? `u(${tA(a)})` : '1'; return { c: 1, s: `${/[ ]/.test(x) ? `(${x})` : x === '1' ? '' : x} [${isFinite(b) ? `${u1} − u(${tA(b)})` : u1}]`.trim() }; }));

  const linealT = (arg, que) => { const l = lineal(arg); if (!l || Math.abs(l.r) < 1e-14) throw new Error(`Dans ${que}( ) il doit y avoir t − a`); return { r: l.r, a: -l.u0 / l.r }; };
  function piezasT(ast, nom) {
    const G = new Map(), grupo = (a) => { const k = Math.round(a * 1e9) / 1e9; if (!G.has(k)) G.set(k, { a, g: [], d: 0 }); return G.get(k); };
    for (const fs of sumandos(ast, tieneSalto)) {
      let a = 0, d = null, k = 1;
      const resto = [];
      for (const q of fs) {
        if (q.t === 'fn' && q.f === 'u') { const l = linealT(q.a, 'u'); if (l.r < 0) throw new Error(`${nom} : je ne connais que l’échelon u(t − a), qui s’allume en t = a (pas u(a − t))`); a = Math.max(a, l.a); }
        else if (q.t === 'fn' && q.f === 'δ') { if (d !== null) throw new Error(`${nom} : je ne sais pas multiplier deux deltas`); const l = linealT(q.a, 'δ'); d = l.a; k /= Math.abs(l.r); }
        else if (tieneSalto(q)) throw new Error(`${nom} : u et δ doivent être en facteur, et non à l’intérieur d’une autre fonction`);
        else resto.push(q);
      }
      const g = prodF(resto);
      if (d !== null) {
        if (d < -1e-12 || d < a - 1e-12) continue;
        const v = k * E.valor(g, 0, { t: d });
        if (!isFinite(v)) throw new Error(`${nom} : ce qui multiplie la delta n’a pas de valeur en t = ${cTxt(d)}`);
        grupo(Math.max(0, d)).d += v;
      } else grupo(a).g.push(g);
    }
    const out = [];
    for (const q of [...G.values()].sort((x, y) => x.a - y.a)) {
      let ts = [], gts = [];
      if (q.g.length) {
        const gA = q.g.reduce((x, y) => opN('+', x, y));
        ts = terminos(q.a ? corre(gA, q.a) : gA);
        if (!ts) throw new Error(`${nom} : ce qui multiplie chaque échelon doit être une somme de termes c·tⁿ·e^{at}·sin(bt) ou cos(bt)`);
        gts = q.a ? terminos(gA) || [] : ts;
      }
      let R = R_([0]);
      for (const t of ts) { const b = transTermino(t); R = rSuma(R, R_(pEsc(b.n, t.c), b.d)); }
      if (Math.abs(q.d) > 1e-14) R = rSuma(R, R_([q.d]));
      out.push({ a: q.a, ts, gts, d: q.d, R: simplifica(R) });
    }
    return out.filter((q) => q.ts.length || Math.abs(q.d) > 1e-14);
  }
  const R_ = (n, d) => R(n, d);
  const esCero = (r) => limpia(r.n).every((c) => Math.abs(c) < 1e-14);
  function pieza(r, a) {
    const q = normaliza(r), N = limpia(q.n), ex = a ? eS(a) : '';
    if (grado(q.d) === 0) {
      const p = pEsc(N, 1 / q.d[0]);
      return grado(p) === 0 ? [{ c: p[0], s: ex }] : [{ c: 1, s: `${ex ? ex + ' ' : ''}(${pTxt(p)})` }];
    }
    const den = factTxt(R([1], q.d)).replace(/^\{1\}\/\{(.*)\}$/, '$1');
    if (grado(N) === 0) {
      if (!ex) return [frNum(N[0], 1, den)];
      const k = E.exacto(N[0], 200) ? 0 : [-1, -2, -3, -4, -5, -6, 1, 2, 3, 4, 5, 6].find((j) => { const x = E.exacto(N[0] / Math.exp(j), 50); return x && !x.s; });
      return [k ? { c: N[0] / Math.exp(k), s: `e^{${k < 0 ? '−' : ''}${Math.abs(k)}} {${ex}}/{${den}}` } : { c: N[0], s: `{${ex}}/{${den}}` }];
    }
    return [{ c: 1, s: `${ex ? ex + ' ' : ''}{${pTxt(N)}}/{${den}}` }];
  }
  const sgTxt = (gs) => suma(gs.flatMap((g) => (esCero(g.R) ? [] : pieza(g.R, g.a))));
  const sgVal = (gs, s) => gs.reduce((v, g) => v + Math.exp(-g.a * s) * pVal(g.R.n, s) / pVal(g.R.d, s), 0);
  const sgMulR = (gs, r) => gs.map((g) => ({ a: g.a, R: simplifica(rMul(g.R, r)) }));
  function sgSuma(...ls) { const m = new Map(); for (const g of ls.flat()) { const k = Math.round(g.a * 1e9) / 1e9; m.set(k, m.has(k) ? { a: m.get(k).a, R: rSuma(m.get(k).R, g.R) } : { a: g.a, R: g.R }); } return [...m.values()].sort((x, y) => x.a - y.a).map(({ a, R: r }) => ({ a, R: simplifica(r) })); }
  function sgMul(A, B) { return sgSuma(A.flatMap((x) => B.map((y) => ({ a: x.a + y.a, R: rMul(x.R, y.R) })))); }
  const polosSG = (gs) => { const out = []; for (const g of gs) for (const z of raicesSeguras(normaliza(g.R).d)) if (!out.some((o) => cAbs(cSub(o.p, z.p)) < 1e-9)) out.push(z); return out; };

  function gruposS(ast, nom) {
    const G = new Map();
    for (const fs of sumandos(ast, tieneExpS)) {
      let a = 0; const resto = [];
      for (const q of fs) {
        if (esExpS(q)) {
          const u0 = E.valor(q.b, 0, { s: 0 }), r = E.valor(q.b, 0, { s: 1 }) - u0;
          if (!isFinite(u0) || Math.abs(E.valor(q.b, 0, { s: 2.5 }) - (u0 + 2.5 * r)) > 1e-9 * Math.max(1, Math.abs(r))) throw new Error(`${nom} : l’exposant de e doit être −a s`);
          if (r > 1e-12) throw new Error(`${nom} : e^{as} avec a > 0 avancerait le signal dans le temps ; je ne sais inverser que e^{−as}`);
          a += -r; resto.push(E.N(Math.exp(u0)));
        } else if (tieneExpS(q)) throw new Error(`${nom} : les exponentielles e^{−as} doivent être en facteur`);
        else resto.push(q);
      }
      const k = Math.round(a * 1e9) / 1e9, r = racional(prodF(resto));
      G.set(k, G.has(k) ? { a: G.get(k).a, R: rSuma(G.get(k).R, r) } : { a, R: r });
    }
    return [...G.values()].sort((x, y) => x.a - y.a).map(({ a, R: r }) => ({ a, R: simplifica(r) })).filter((g) => !esCero(g.R));
  }

  function transformaT(ast, nom) {
    if (tieneSalto(ast)) { const ps = piezasT(ast, nom); return { gs: ps.map(({ a, R: r }) => ({ a, R: r })), ps, f: evalPiezas(ps.map((p) => ({ a: p.a, terms: p.ts }))), txt: enT(ps) }; }
    const ts = terminos(ast);
    if (!ts) throw new Error(`${nom} doit être une somme de termes c·tⁿ·e^{at}·sin(bt) ou cos(bt), avec des échelons u(t − a) ou des deltas δ(t − a)`);
    let r = R([0]); for (const t of ts) { const b = transTermino(t); r = rSuma(r, R(pEsc(b.n, t.c), b.d)); }
    return { gs: [{ a: 0, R: simplifica(r) }], ts, f: evalTerms(ts), txt: suma(ts.map((t) => ({ c: t.c, s: fTermTxt(t) }))) };
  }
  const enT = (ps) => piezasTxt(ps.map((p) => { const t = p.gts.length && p.gts.length <= p.ts.length; return { a: p.a, terms: t ? p.gts : p.ts, d: p.d, crudo: p.a > 0 && t }; }));
  const evalPiezas = (ps) => (tt) => ps.reduce((v, p) => (tt >= p.a - 1e-12 ? v + evalTerms(p.terms)(tt - p.a) : v), 0);
  function piezasTxt(ps) {
    const out = [];
    for (const p of ps) {
      const v = p.a ? `(${tA(p.a)})` : 't', vivos = p.terms.filter((t) => Math.abs(t.c) > 1e-10);
      if (vivos.length && !p.a) out.push(...vivos.map((t) => ({ c: t.c, s: fTermTxt(t) })));
      else if (vivos.length === 1) out.push({ c: vivos[0].c, s: [fTermTxt(vivos[0], p.crudo ? 't' : v), `u(${tA(p.a)})`].filter(Boolean).join(' ') });
      else if (vivos.length) out.push({ c: 1, s: `[${suma(vivos.map((t) => ({ c: t.c, s: fTermTxt(t, p.crudo ? 't' : v) })))}] u(${tA(p.a)})` });
      if (Math.abs(p.d || 0) > 1e-10) out.push({ c: p.d, s: `δ(${tA(p.a)})` });
    }
    return suma(out);
  }

  function directaSaltos(ast, sc) {
    linealiza = false;
    const ps = piezasT(ast, 'f(t)');
    if (!ps.length) throw new Error('f(t) es 0');
    const pasos = [];
    if (ast.trozos) pasos.push({ t: 'Fonction définie par morceaux', html: `$f(t) =$<br>${trozosTxt(ast.trozos)}<br>Avec des échelons : $f(t) = ${trozosU(ast.trozos)}$` });
    if (linealiza) pasos.push({ t: 'Linéariser', html: 'Les produits de sinus et de cosinus se transforment en sommes, par exemple $sin^{2} t = {1}/{2} − {1}/{2} cos (2 t)$ et $sin A cos B = {1}/{2} [sin(A + B) + sin(A − B)]$.' });
    const usa = [];
    if (ps.some((p) => p.a && p.ts.length)) usa.push('$ℒ\\{u(t − a) g(t)\\} = e^{−as} ℒ\\{g(t + a)\\}$ (second théorème du retard)');
    if (ps.some((p) => Math.abs(p.d) > 1e-14)) usa.push('$ℒ\\{δ(t − a)\\} = e^{−as}$');
    pasos.push({ t: 'Échelons et deltas', html: `${usa.join('<br>')}<br>On regroupe les termes selon l’instant $a$ où ils s’allument.` });
    const lineas = ps.map((p) => {
      const out = [];
      if (p.ts.length) {
        const sinD = { a: p.a, R: p.R };
        let Rg = R([0]); for (const t of p.ts) { const b = transTermino(t); Rg = rSuma(Rg, R(pEsc(b.n, t.c), b.d)); }
        sinD.R = simplifica(Rg);
        const gTxt = suma((p.gts.length ? p.gts : p.ts).map((t) => ({ c: t.c, s: fTermTxt(t) })));
        if (!p.a) out.push(`$ℒ\\{${gTxt}\\} = ${sgTxt([sinD])}$`);
        else out.push(`À partir de $t = ${cTxt(p.a)}$ : $g(t) = ${p.gts.length ? gTxt : '…'}$, &ensp; $g(t + ${cTxt(p.a)}) = ${suma(p.ts.map((t) => ({ c: t.c, s: fTermTxt(t) })))}$ &ensp;⇒&ensp; $ℒ\\{g(t) u(${tA(p.a)})\\} = ${sgTxt([sinD])}$`);
      }
      if (Math.abs(p.d) > 1e-14) out.push(`$ℒ\\{${suma([{ c: p.d, s: `δ(${tA(p.a)})` }])}\\} = ${suma([{ c: p.d, s: p.a ? eS(p.a) : '' }])}$`);
      return out.join('<br>');
    });
    pasos.push({ t: 'Chaque terme', html: lineas.join('<br>') });
    const gs = ps.map(({ a, R: r }) => ({ a, R: r })), Ftxt = sgTxt(gs);
    const rs = ps.flatMap((p) => p.ts.map((t) => t.r)), conv = rs.length ? Math.max(...rs) : -Infinity;
    pasos.push({ t: 'Résultat', html: `$F(s) = ${Ftxt}$<br>${isFinite(conv) ? `Elle existe pour $s > ${cTxt(conv)}$.` : 'Elle existe pour tout $s$.'}` });
    const piezas = ps.map((p) => ({ a: p.a, terms: p.ts, d: p.d }));
    const ftxt = enT(ps);
    return { modo: 'directa', saltos: true, gs, piezas, ts: ps.flatMap((p) => p.ts), conv, Ftxt, Ffact: Ftxt, Fcomun: Ftxt, Fval: (s) => sgVal(gs, s), f: evalPiezas(piezas), deltas: deltasDe(piezas), ftxt, polos: polosSG(gs), ceros: [], pasos };
  }
  const deltasDe = (ps) => ps.filter((p) => Math.abs(p.d || 0) > 1e-10).map((p) => ({ a: p.a, c: p.d }));

  function invierteSG(gs, pasos, nombre = 'F') {
    if (gs.length === 1 && !gs[0].a && grado(simplifica(gs[0].R).n) < grado(simplifica(gs[0].R).d)) {
      const inv = invierte(gs[0].R, pasos, nombre), ult = pasos[pasos.length - 1];
      ult.html = ult.html.replace('f(t) =', `${minus(nombre)}(t) =`);
      return { ...inv, piezas: [{ a: 0, terms: inv.terms, d: 0 }], deltas: [], f: evalTerms(inv.terms) };
    }
    const varios = gs.length > 1;
    const nom = (i) => (varios ? `${nombre}_{${i + 1}}` : nombre), nomT = (i) => (varios ? `${nombre}${'₀₁₂₃₄₅₆₇₈₉'[i + 1] || `_${i + 1}`}` : nombre);
    if (varios || gs[0].a) pasos.push({ t: 'Séparer les exponentielles', html: `$${nombre}(s) = ${suma(gs.map((g, i) => ({ c: 1, s: `${g.a ? eS(g.a) + ' ' : ''}${nom(i)}(s)` })))}$${gs.map((g, i) => `<br>$${nom(i)}(s) = ${factTxt(g.R)}$`).join('')}<br>Décalage en t : $ℒ^{−1}\\{e^{−as} F(s)\\} = u(t − a) f(t − a)$` });
    const piezas = [], rs = [], fr = [];
    gs.forEach((g, i) => {
      const q = simplifica(g.R), gn = grado(q.n), gd = grado(q.d);
      if (gn > gd) throw new Error(`${nom(i)}(s) a un numérateur de degré supérieur à celui du dénominateur : son inverse contient des dérivées de la delta`);
      let d = 0, resto = q;
      if (gn === gd) {
        const n = normaliza(q); d = limpia(n.n)[gn]; resto = gd ? simplifica(rSuma(n, R([-d]))) : R([0]);
        pasos.push({ t: `Partie constante de ${nomT(i)}(s)`, html: `$${nom(i)}(s) = ${esCero(resto) ? cTxt(d) : suma([{ c: d, s: '' }, ...pieza(resto, 0)])}$${esCero(resto) ? ' est une constante' : ''}, et comme $ℒ^{−1}\\{1\\} = δ(t)$, on obtient $${suma([{ c: d, s: `δ(${tA(g.a)})` }])}$.` });
      }
      let terms = [];
      if (!esCero(resto)) {
        const sub = [], inv = invierte(resto, sub, nom(i));
        for (const p of sub) pasos.push({ ...p, t: varios ? `${p.t} de ${nomT(i)}` : p.t, html: p.html.replace('f(t) =', `${minus(nom(i))}(t) =`) });
        terms = inv.terms; rs.push(...inv.rs); fr.push(...pieza(resto, 0));
        if (g.a) pasos[pasos.length - 1].html += `<br>Avec le retard : $${piezasTxt([{ a: g.a, terms, d: 0 }])}$`;
      }
      piezas.push({ a: g.a, terms, d });
    });
    const txt = piezasTxt(piezas);
    pasos.push({ t: 'Résultat', html: `$${nombre === 'F' ? 'f' : nombre.toLowerCase()}(t) = ${txt}$ &ensp; pour $t ≥ 0$` });
    return { rs: polosSG(gs), terms: piezas.flatMap((p) => p.terms), piezas, deltas: deltasDe(piezas), frac: sgTxt(gs), txt, f: evalPiezas(piezas) };
  }

  function convolucion(sc) {
    if (vacio(sc.f)) throw new Error('Il manque f(t)');
    if (vacio(sc.g)) throw new Error('Il manque g(t)');
    linealiza = false;
    const af = leeT(sc.f, 'f(t)'), ag = leeT(sc.g, 'g(t)');
    if (E.tieneX(af, 's') || E.tieneX(ag, 's')) throw new Error('f(t) et g(t) ne peuvent pas contenir s');
    const F = transformaT(af, 'f(t)'), G = transformaT(ag, 'g(t)'), H = sgMul(F.gs, G.gs), pasos = [];
    if (!H.length) throw new Error('El producto F(s) G(s) es 0');
    pasos.push({ t: 'Théorème de convolution', html: '$(f * g)(t) = ∫_{0}^{t} f(τ) g(t − τ) dτ$ &ensp; et &ensp; $ℒ\\{f * g\\} = F(s) G(s)$ : au lieu de calculer l’intégrale, on multiplie les transformées et on inverse le produit.' });
    pasos.push({ t: 'Transformées', html: `$f(t) = ${F.txt}$ &ensp;⇒&ensp; $F(s) = ${sgTxt(F.gs)}$<br>$g(t) = ${G.txt}$ &ensp;⇒&ensp; $G(s) = ${sgTxt(G.gs)}$` });
    pasos.push({ t: 'Produit', html: `$F(s) G(s) = ${sgTxt(H)}$` });
    const inv = invierteSG(H, pasos, 'H');
    const ult = pasos[pasos.length - 1];
    if (ult.t === 'Résultat') ult.html = ult.html.replace('h(t) =', '(f * g)(t) =');
    else pasos.push({ t: 'Résultat', html: `$(f * g)(t) = ${inv.txt}$ &ensp; pour $t ≥ 0$` });
    return { modo: 'convolucion', gs: H, F: F.gs, G: G.gs, Ftxt: sgTxt(F.gs), Gtxt: sgTxt(G.gs), Ffact: sgTxt(H), Fcomun: sgTxt(H), ...inv, f1: F.f, g1: G.f, polos: inv.rs, ceros: [], pasos };
  }

  function sistema(sc) {
    const a = num(sc.a11, 'a₁₁'), b = num(sc.a12, 'a₁₂'), c = num(sc.a21, 'a₂₁'), d = num(sc.a22, 'a₂₂'), x0 = num(sc.x0, 'x(0)'), y0 = num(sc.y0, 'y(0)');
    linealiza = false;
    const fu = (src, nom) => (vacio(src) || String(src).trim() === '0' ? { gs: [], txt: '0', f: () => 0 } : transformaT(leeT(src, nom), nom));
    const F = fu(sc.f, 'f(t)'), G = fu(sc.g, 'g(t)'), pasos = [];
    const lado = (p, q, f) => `${suma([{ c: p, s: 'x' }, { c: q, s: 'y' }])}${f === '0' ? '' : ` + ${f}`.replace('+ −', '− ')}`;
    pasos.push({ t: 'Système', html: `$x′ = ${lado(a, b, F.txt)}$<br>$y′ = ${lado(c, d, G.txt)}$<br>avec $x(0) = ${cTxt(x0)}$ et $y(0) = ${cTxt(y0)}$` });
    const fs = (x0, gs) => (!gs.length ? cTxt(x0) : !x0 ? sgTxt(gs) : `${cTxt(x0)} + ${sgTxt(gs)}`.replace('+ −', '− '));
    pasos.push({ t: 'En transformant', html: `Avec $ℒ\\{x′\\} = sX − x(0)$ et $ℒ\\{y′\\} = sY − y(0)$, on obtient un système linéaire en $X(s)$ et $Y(s)$ :<br>$(${pTxt([-a, 1])}) X ${suma([{ c: -b, s: 'Y' }]).replace(/^(?!−)/, '+ ').replace(/^−/, '− ')} = ${fs(x0, F.gs)}$<br>$${suma([{ c: -c, s: 'X' }])} + (${pTxt([-d, 1])}) Y = ${fs(y0, G.gs)}$`.replace(/\+ − /g, '− ').replace(/\$0 X \+ /g, '$') });
    const D = [a * d - b * c, -(a + d), 1], P = sgSuma([{ a: 0, R: R([x0]) }], F.gs), Q = sgSuma([{ a: 0, R: R([y0]) }], G.gs);
    const X = sgSuma(sgMulR(P, R([-d, 1], D)), sgMulR(Q, R([b], D))).filter((g) => !esCero(g.R));
    const Y = sgSuma(sgMulR(P, R([c], D)), sgMulR(Q, R([-a, 1], D))).filter((g) => !esCero(g.R));
    pasos.push({ t: 'Règle de Cramer', html: `$Δ(s) = (${pTxt([-a, 1])}) (${pTxt([-d, 1])}) − (${cTxt(b)}) (${cTxt(c)}) = ${pTxt(D)}$<br>$X(s) = {(x(0) + F) (${pTxt([-d, 1])}) + ${cTxt(b)} (y(0) + G)}/{Δ} = ${X.length ? sgTxt(X) : '0'}$<br>$Y(s) = {${cTxt(c)} (x(0) + F) + (${pTxt([-a, 1])}) (y(0) + G)}/{Δ} = ${Y.length ? sgTxt(Y) : '0'}$`.replace(/\(− /g, '(−') });
    const parte = (gs, n) => { if (!gs.length) return { txt: '0', f: () => 0, rs: [], terms: [], piezas: [] }; const sub = [], inv = invierteSG(gs, sub, n); for (const p of sub) pasos.push({ ...p, t: `${n}(s): ${p.t.toLowerCase()}` }); return inv; };
    const ix = parte(X, 'X'), iy = parte(Y, 'Y');
    pasos.push({ t: 'Solution', html: `$x(t) = ${ix.txt}$<br>$y(t) = ${iy.txt}$ &ensp; pour $t ≥ 0$` });
    return { modo: 'sistema', a, b, c, d, x0, y0, fx: F.f, gy: G.f, X, Y, Xtxt: X.length ? sgTxt(X) : '0', Ytxt: Y.length ? sgTxt(Y) : '0', txt: ix.txt, txt2: iy.txt, f: ix.f, f2: iy.f, terms: [...ix.terms, ...iy.terms], piezas: [...(ix.piezas || []), ...(iy.piezas || [])], deltas: [], polos: raicesSeguras(D), ceros: [], pasos };
  }

  const MODOS = { directa, inversa, edo, convolucion, sistema };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : directa(sc); }

  const ejemplos = [
    { clave: 'basica', nombre: 'Polynôme et exponentielle', sc: { modo: 'directa', f: '3t^2 + 2e^(-4t) - 5' } },
    { clave: 'trig', nombre: 'Sinus et cosinus', sc: { modo: 'directa', f: '4sen(3t) - 2cos(3t)' } },
    { clave: 'amortiguada', nombre: 'Oscillation amortie', sc: { modo: 'directa', f: 'e^(-2t) cos(5t)' } },
    { clave: 'tsen', nombre: 't·sen(t) (derivar F)', sc: { modo: 'directa', f: 't sen(t)' } },
    { clave: 'hiper', nombre: 'Cosinus hyperbolique fois t', sc: { modo: 'directa', f: 't^2 e^(3t) + cosh(2t)' } },
    { clave: 'simples', nombre: 'Pôles simples', sc: { modo: 'inversa', F: '(3s + 7)/((s + 1)(s + 3))' } },
    { clave: 'doble', nombre: 'Pôle double', sc: { modo: 'inversa', F: '(s + 5)/(s (s + 1)^2)' } },
    { clave: 'complejos', nombre: 'Pôles complexes', sc: { modo: 'inversa', F: '(2s + 3)/(s^2 + 4s + 13)' } },
    { clave: 'mixta', nombre: 'Pôle réel et paire complexe', sc: { modo: 'inversa', F: '10/((s + 1)(s^2 + 2s + 5))' } },
    { clave: 'escalon', nombre: 'Réponse à un échelon', sc: { modo: 'inversa', F: '4/(s (s^2 + 4))' } },
    { clave: 'retardo', nombre: 'Avec un retard e^(−2s)', sc: { modo: 'inversa', F: 'e^(-2s)/(s (s + 1))' } },
    { clave: 'pulso', nombre: 'Rampe qui s’arrête : (1 − e^(−s))/s²', sc: { modo: 'inversa', F: '(1 - e^(-s))/s^2' } },
    { clave: 'con-delta', nombre: 'Degrés égaux : une delta apparaît', sc: { modo: 'inversa', F: '(s + 3)/(s + 1)' } },
    { clave: 'sen2', nombre: 'sen² t (linealizar)', sc: { modo: 'directa', f: 'sen^2(t) + sen(3t) cos(t)' } },
    { clave: 'retrasada', nombre: 'Rampe retardée et échelon', sc: { modo: 'directa', f: '(t - 1) u(t - 1) + 2 u(t - 3)' } },
    { clave: 'trozos', nombre: 'Fonction définie par morceaux (triangle)', sc: { modo: 'directa', f: 't si 0 ≤ t < 2 ; 4 - t si 2 ≤ t < 4 ; 0 si t ≥ 4' } },
    { clave: 'delta', nombre: 'Delta de Dirac', sc: { modo: 'directa', f: '3δ(t - 1) + e^(-t) u(t - 2)' } },
    { clave: 'edo-sub', nombre: 'Oscillateur amorti', sc: { modo: 'edo', orden: '2', a: '1', b: '2', c: '5', g: '0', y0: '1', v0: '0' } },
    { clave: 'edo-forzada', nombre: 'y″ + 3y′ + 2y = e^(−3t)', sc: { modo: 'edo', orden: '2', a: '1', b: '3', c: '2', g: 'e^(-3t)', y0: '0', v0: '1' } },
    { clave: 'edo-resonancia', nombre: 'Résonance : y″ + y = sin t', sc: { modo: 'edo', orden: '2', a: '1', b: '0', c: '1', g: 'sen(t)', y0: '0', v0: '0' } },
    { clave: 'edo-1', nombre: 'Premier ordre : y′ + 2y = 4t', sc: { modo: 'edo', orden: '1', a: '', b: '1', c: '2', g: '4t', y0: '1', v0: '' } },
    { clave: 'edo-impulso', nombre: 'Impulsion : y″ + y = δ(t − π)', sc: { modo: 'edo', orden: '2', a: '1', b: '0', c: '1', g: 'δ(t - π)', y0: '1', v0: '0' } },
    { clave: 'edo-pulso', nombre: 'Pulse : y′ + y = u(t − 1) − u(t − 2)', sc: { modo: 'edo', orden: '1', a: '', b: '1', c: '1', g: 'u(t - 1) - u(t - 2)', y0: '0', v0: '' } },
    { clave: 'conv', nombre: 't * e^(−t)', sc: { modo: 'convolucion', f: 't', g: 'e^(-t)' } },
    { clave: 'conv-sen', nombre: 'sen t * cos t', sc: { modo: 'convolucion', f: 'sen(t)', g: 'cos(t)' } },
    { clave: 'conv-escalon', nombre: 'e^(−2t) * échelon retardé', sc: { modo: 'convolucion', f: 'e^(-2t)', g: 'u(t - 1)' } },
    { clave: 'sis-acoplado', nombre: 'Deux réservoirs : x′ = −2x + y, y′ = x − 2y', sc: { modo: 'sistema', a11: '-2', a12: '1', a21: '1', a22: '-2', f: '0', g: '0', x0: '1', y0: '0' } },
    { clave: 'sis-oscila', nombre: 'Oscillateur : x′ = y, y′ = −x', sc: { modo: 'sistema', a11: '0', a12: '1', a21: '-1', a22: '0', f: '0', g: '0', x0: '1', y0: '0' } },
    { clave: 'sis-forzado', nombre: 'Forcé : x′ = x + 2y + e^t, y′ = 2x + y', sc: { modo: 'sistema', a11: '1', a12: '2', a21: '2', a22: '1', f: 'e^(t)', g: '0', x0: '0', y0: '1' } },
  ];
  function estabilidad(polos) {
    const tol = 1e-9, eje = polos.filter(({ p }) => Math.abs(p.re) <= tol), dere = polos.filter(({ p }) => p.re > tol);
    if (dere.length) return { estado: 'inestable', txt: 'instable : il a des pôles de partie réelle positive, et sa réponse croît' };
    if (eje.some(({ m }) => m > 1)) return { estado: 'inestable', txt: 'instable : il a un pôle multiple sur l’axe imaginaire, et sa réponse croît' };
    if (eje.length) return { estado: 'marginal', txt: 'marginalement stable : il a des pôles simples sur l’axe imaginaire, et sa réponse oscille ou reste constante sans s’amortir' };
    return { estado: 'estable', txt: 'stable : tous les pôles ont une partie réelle négative, et sa réponse s’amortit' };
  }
  function paraControl(F) {
    if (!F || !F.n || !F.d || F.d.length < 2 || F.n.length > F.d.length) return null;
    const t = (c) => [...c].reverse().map((x) => String(+Number(x).toFixed(12))).join(' ');
    return [...F.n, ...F.d].every(isFinite) ? { num: t(F.n), den: t(F.d) } : null;
  }
  return { estabilidad, paraControl, resolver, directa, inversa, edo, convolucion, sistema, raices, residuos, racional, terminos, ejemplos, f, R, rTxt, factTxt, simplifica, pVal };
})();

