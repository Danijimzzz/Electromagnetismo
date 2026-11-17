const Control = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const PI = Math.PI, grados = (r) => (r * 180) / PI;
  const normaGr = (g) => { g = ((g + 180) % 360 + 360) % 360 - 180; return g === -180 ? 180 : g; };

  const cAdd = (a, b) => [a[0] + b[0], a[1] + b[1]], cSub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const cMul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cDiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const cAbs = (a) => Math.hypot(a[0], a[1]), cArg = (a) => Math.atan2(a[1], a[0]);

  const recorta = (p) => { let i = 0; const m = Math.max(0, ...p.map(Math.abs)); while (i < p.length - 1 && Math.abs(p[i]) <= 1e-14 * m) i++; return p.slice(i); };
  const grado = (p) => recorta(p).length - 1;
  const esCero = (p) => p.every((c) => Math.abs(c) < 1e-300);
  const pSuma = (a, b) => { const n = Math.max(a.length, b.length), A = Array(n - a.length).fill(0).concat(a), B = Array(n - b.length).fill(0).concat(b); return A.map((c, i) => c + B[i]); };
  const pMul = (a, b) => { const r = Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; };
  const pEsc = (a, k) => a.map((c) => c * k);
  const pDer = (a) => (a.length < 2 ? [0] : a.slice(0, -1).map((c, i) => c * (a.length - 1 - i)));
  const pEval = (p, z) => { let r = [0, 0]; for (const c of p) r = cAdd(cMul(r, z), [c, 0]); return r; };
  const pReal = (p, x) => { let r = 0; for (const c of p) r = r * x + c; return r; };

  function lee(sc, k, nom, opcional) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} is missing`); }
    let s = String(sc[k]).trim().replace(/[−–]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3').replace(/·/g, '*');
    const mal = () => new Error(`I don't understand ${nom}: enter the coefficients (1 3 2) or an expression like s^2+3s+2`);
    let p;
    if (!/[sS]/.test(s)) {
      const t = s.split(/[\s;]+/).filter(Boolean).map(leeNum);
      if (!t.length || t.some((x) => !isFinite(x))) throw mal();
      p = t;
    } else {
      s = s.replace(/S/g, 's').replace(/\s+/g, '');
      let i = 0;
      const num = () => { const m = s.slice(i).match(/^\d+(?:[.,]\d+)?(?:e[+-]?\d+)?/i); if (!m) return null; i += m[0].length; return leeNum(m[0]); };
      const mul = (a, b) => { const r = Array(a.length + b.length - 1).fill(0); a.forEach((x, u) => b.forEach((y, v) => { r[u + v] += x * y; })); return r; };
      const pot = (a, e) => { let r = [1]; for (let u = 0; u < e; u++) r = mul(r, a); return r; };
      const suma = (a, b) => { const r = Array(Math.max(a.length, b.length)).fill(0); a.forEach((x, u) => { r[u] += x; }); b.forEach((x, u) => { r[u] += x; }); return r; };
      let expr;
      const base = () => {
        let b;
        if (s[i] === '(') { i++; b = expr(); if (s[i] !== ')') throw mal(); i++; }
        else if (s[i] === 's') { i++; b = [0, 1]; }
        else { const v = num(); if (v === null) throw mal(); b = [v]; }
        if (s[i] === '^') { i++; const e = num(); if (e === null || e !== Math.round(e) || e < 0 || e > 40) throw mal(); b = pot(b, e); }
        return b;
      };
      const term = () => {
        let t = base();
        while (i < s.length && s[i] !== '+' && s[i] !== '-' && s[i] !== ')') { if (s[i] === '*') i++; t = mul(t, base()); }
        return t;
      };
      expr = () => {
        let sg = 1; if (s[i] === '-') { sg = -1; i++; } else if (s[i] === '+') i++;
        let r = term().map((c) => c * sg);
        while (i < s.length && (s[i] === '+' || s[i] === '-')) { const sg2 = s[i] === '-' ? -1 : 1; i++; r = suma(r, term().map((c) => c * sg2)); }
        return r;
      };
      const r = expr();
      if (i !== s.length) throw mal();
      p = r.slice().reverse();
    }
    if (p.length > 25) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} has too high a degree (maximum 24)`);
    return recorta(p);
  }

  function raices(p0) {
    let p = recorta(p0.slice());
    if (p.length < 2) return [];
    let ceros = 0;
    while (p.length > 1 && Math.abs(p[p.length - 1]) < 1e-14 * Math.max(...p.map(Math.abs))) { p.pop(); ceros++; }
    const out = Array.from({ length: ceros }, () => [0, 0]);
    const n = p.length - 1;
    if (n >= 1) {
      const a = p.map((c) => c / p[0]);
      const R = 1 + Math.max(...a.slice(1).map(Math.abs)), z = [];
      for (let k = 0; k < n; k++) { const t = (2 * PI * k) / n + 0.4; z.push([R * 0.5 * Math.cos(t), R * 0.5 * Math.sin(t)]); }
      for (let it = 0; it < 800; it++) {
        let mx = 0;
        for (let k = 0; k < n; k++) {
          let den = [1, 0]; for (let j = 0; j < n; j++) if (j !== k) den = cMul(den, cSub(z[k], z[j]));
          const d = cDiv(pEval(a, z[k]), den); z[k] = cSub(z[k], d); mx = Math.max(mx, cAbs(d) / Math.max(1, cAbs(z[k])));
        }
        if (mx < 1e-15) break;
      }
      const da = pDer(a);
      for (let k = 0; k < n; k++) for (let it = 0; it < 6; it++) { const d = pEval(da, z[k]); if (cAbs(d) < 1e-300) break; const e = cDiv(pEval(a, z[k]), d); if (!isFinite(e[0])) break; z[k] = cSub(z[k], e); }
      for (const w of z) { const re = Math.abs(w[0]) < 1e-9 * Math.max(1, Math.abs(w[1])) ? 0 : w[0], im = Math.abs(w[1]) < 1e-9 * Math.max(1, Math.abs(w[0])) ? 0 : w[1]; out.push([re, im]); }
    }
    return out.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  }

  const polTxt = (p, v = 's') => {
    p = recorta(p); const n = p.length - 1; let h = '';
    p.forEach((c, i) => {
      if (Math.abs(c) < 1e-14 * Math.max(1, ...p.map(Math.abs))) return;
      const k = n - i, a = Math.abs(c), cs = k > 0 && Math.abs(a - 1) < 1e-12 ? '' : f(a);
      h += (h ? (c < 0 ? ' − ' : ' + ') : (c < 0 ? '−' : '')) + cs + (k > 1 ? `${v}^${k}` : k === 1 ? v : '');
      if (k === 0 && cs === '') h += '1';
    });
    return h || '0';
  };
  const cTxt = (z, d = 4) => {
    const re = Math.abs(z[0]) < 1e-12 ? 0 : z[0], im = Math.abs(z[1]) < 1e-12 ? 0 : z[1];
    if (!im) return f(re, d);
    const ai = Math.abs(im), parte = `${Math.abs(ai - 1) < 1e-12 ? '' : f(ai, d)}j`;
    return re ? `${f(re, d)} ${im < 0 ? '−' : '+'} ${parte}` : `${im < 0 ? '−' : ''}${parte}`;
  };
  const listaRaices = (r) => (r.length ? r.map((z) => cTxt(z)).join('; ') : 'ninguna');

  const MAXP = 24;
  const sLimpia = (a, ref) => { const m = new Map(); for (const [e, c] of a) m.set(e, (m.get(e) || 0) + c); return [...m].filter(([e, c]) => Math.abs(c) > 1e-10 * ref && e <= MAXP).sort((x, y) => x[0] - y[0]); };
  const sSuma = (a, b, ref) => sLimpia([...a, ...b], ref);
  const sMul = (a, b, ref) => sLimpia(a.flatMap(([e, c]) => b.map(([e2, c2]) => [e + e2, c * c2])), ref);
  const sInv = (a, ref) => {
    const [q, c0] = a[0], u = a.slice(1).map(([e, c]) => [e - q, c / c0]);   // a = c0 ε^q (1 + u)
    let suma = [[0, 1]], pot = [[0, 1]];
    for (let k = 1; k < 16; k++) { pot = sMul(pot, u.map(([e, c]) => [e, -c]), 1e-300); suma = sSuma(suma, pot, 1e-300); }
    return sLimpia(suma.map(([e, c]) => [e - q, c / c0]), 1e-300 * ref);
  };
  const sNum = (a) => { const t = a.find(([e]) => e === 0); return t ? t[1] : 0; };
  const sSigno = (a) => (a.length ? Math.sign(a[0][1]) : 0);
  const sTxt = (a) => a.filter(([e, c], i) => !i || (e <= 4 && Math.abs(c) > 1e-6 * Math.abs(a[0][1]))).slice(0, 2).map(([e, c], i) => {
    const t = e === 0 ? f(Math.abs(c)) : `${Math.abs(Math.abs(c) - 1) < 1e-9 ? '' : f(Math.abs(c))}ε${e === 1 ? '' : `<sup>${e < 0 ? '−' : ''}${Math.abs(e)}</sup>`}`;
    return (i ? (c < 0 ? ' − ' : ' + ') : (c < 0 ? '−' : '')) + t;
  }).join('') || '0';
  function routh(p0) {
    const p = recorta(p0), n = p.length - 1;
    if (n < 1) throw new Error('The polynomial has to be at least first degree');
    const sc = Math.max(...p.map(Math.abs));
    const filas = [], aux = [];
    const ser = (x) => (Math.abs(x) > 1e-14 * sc ? [[0, x]] : []);
    const cuenta = (pot) => Math.floor(pot / 2) + 1;
    const nueva = (pot, cs) => { const fl = { pot, s: cs, eps: false, cero: false }; filas.push(fl); return fl; };
    nueva(n, p.filter((_, i) => i % 2 === 0).map(ser));
    nueva(n - 1, Array.from({ length: cuenta(n - 1) }, (_, j) => ser(p[2 * j + 1] ?? 0)));
    const get = (fl, j) => fl.s[j] || [];
    const refDe = (...fls) => Math.max(1e-300, ...fls.flatMap((fl) => fl.s.map((x) => (x.length ? Math.abs(x[0][1]) : 0))));
    const vacia = (fl) => fl.s.every((x) => !x.length || x[0][0] > 0);   // cero en el límite ε → 0
    const fila0 = (k) => {          // fila de ceros: se sustituye por la derivada del polinomio auxiliar de la anterior
      const prev = filas[k - 1], coef = prev.s.map((x) => sNum(x)).slice(0, cuenta(prev.pot));
      aux.push({ pot: prev.pot, coef });
      filas[k].s = Array.from({ length: cuenta(filas[k].pot) }, (_, j) => (j < coef.length && prev.pot - 2 * j > 0 ? ser(coef[j] * (prev.pot - 2 * j)) : []));
      filas[k].cero = true;
    };
    if (vacia(filas[1])) fila0(1);
    for (let k = 2; k <= n; k++) {
      const p1 = filas[k - 1], p2 = filas[k - 2], ref = refDe(p1, p2);
      if (!get(p1, 0).length && !vacia(p1)) { p1.s[0] = [[1, 1]]; p1.eps = true; }   // ε en lugar del cero
      const fl = nueva(n - k, []);
      const inv = sInv(get(p1, 0), ref);
      for (let j = 0; j < cuenta(n - k); j++) {
        const num = sSuma(sMul(get(p1, 0), get(p2, j + 1), ref), sMul(get(p2, 0), get(p1, j + 1), ref).map(([e, c]) => [e, -c]), ref);
        fl.s.push(sMul(num, inv, ref));
      }
      if (vacia(fl)) fila0(k);
    }
    for (const fl of filas) { fl.c = fl.s.map(sNum); fl.txt = fl.s.map(sTxt); fl.simple = fl.s.map((x) => !x.length || (x.length === 1 && x[0][0] === 0)); }
    const primera = filas.map((fl) => sNum(fl.s[0] || [])), signos = filas.map((fl) => sSigno(fl.s[0] || []));
    let cambios = 0, prev = 0;
    for (const sg of signos) { if (!sg) continue; if (prev && sg !== prev) cambios++; prev = sg; }
    const rs = raices(p), eje = rs.filter((z) => Math.abs(z[0]) <= 1e-7 * Math.max(1, cAbs(z))).length;
    const estado = cambios > 0 ? 'inestable' : eje > 0 ? 'marginal' : 'estable';
    const auxRaices = aux.map((a) => raices(a.coef.flatMap((c, j) => (j ? [0, c] : [c]))));
    return { p, n, filas, aux, auxRaices, primera, signos, cambios, eje, estado, raices: rs, rhp: cambios };
  }

  const polBase = (N, D, K) => recorta(pSuma(D, pEsc(N, K)));
  function paresImpares(p) {
    const n = p.length - 1, par = [], imp = [];
    for (let k = 0; k <= n; k += 2) par.push((((k / 2) % 2) ? -1 : 1) * p[n - k]);
    for (let k = 1; k <= n; k += 2) imp.push((((k - 1) / 2) % 2 ? -1 : 1) * p[n - k]);
    return { Pe: par.reverse(), Po: imp.reverse() };
  }
  function rangoK(N, D) {
    const crit = [];
    const nuevo = (K, w) => { if (K > 1e-12 && isFinite(K) && !crit.some((c) => Math.abs(c.K - K) <= 1e-9 * Math.max(1, K) && Math.abs(c.w - w) <= 1e-6 * Math.max(1, w))) crit.push({ K, w }); };
    const n0 = N[N.length - 1], d0 = D[D.length - 1];
    if (Math.abs(n0) > 1e-14 * Math.max(...N.map(Math.abs))) nuevo(-d0 / n0, 0);
    if (grado(N) === grado(D)) nuevo(-D[0] / N[0], Infinity);
    const { Pe: De, Po: Do } = paresImpares(D), { Pe: Ne, Po: No } = paresImpares(N);
    const R = recorta(pSuma(pMul(De, No), pEsc(pMul(Do, Ne), -1)));
    if (!esCero(R) && R.length > 1) for (const u of raices(R)) {
      if (Math.abs(u[1]) > 1e-7 * Math.max(1, Math.abs(u[0])) || u[0] <= 1e-12) continue;
      const x = u[0], w = Math.sqrt(x), ne = pReal(Ne, x), no = pReal(No, x), de = pReal(De, x), dd = pReal(Do, x);
      const K = Math.abs(ne) >= Math.abs(no) ? -de / ne : -dd / no;
      nuevo(K, w);
    }
    crit.sort((a, b) => a.K - b.K || a.w - b.w);
    const cuentaRHP = (K) => raices(polBase(N, D, K)).filter((z) => z[0] > 1e-7 * Math.max(1, cAbs(z))).length;
    const lim = [0, ...[...new Set(crit.map((c) => c.K))], Infinity], intervalos = [];
    for (let i = 0; i < lim.length - 1; i++) {
      const a = lim[i], b = lim[i + 1], mid = b === Infinity ? Math.max(a * 2, a + 1) : (a + b) / 2;
      intervalos.push({ a, b, rhp: cuentaRHP(mid), estable: cuentaRHP(mid) === 0 });
    }
    const estables = [];
    for (const it of intervalos) if (it.estable) { const u = estables[estables.length - 1]; if (u && u.b === it.a) u.b = it.b; else estables.push({ a: it.a, b: it.b }); }
    return { criticos: crit.filter((c) => isFinite(c.w)), todos: crit, intervalos, estables };
  }
  const textoRango = (r) => (r.estables.length ? r.estables.map((e) => (e.b === Infinity ? `K > ${f(e.a)}` : e.a === 0 ? `0 < K < ${f(e.b)}` : `${f(e.a)} < K < ${f(e.b)}`)).join(' y ') : 'no value of K > 0');

  function lugar(N, D, Kref = 1) {
    const n = grado(D), m = grado(N);
    if (m > n) throw new Error('The numerator cannot have a higher degree than the denominator (the system would not be proper)');
    const polos = raices(D), ceros = raices(N), sg = Math.sign(N[0] / D[0]);
    const reales = [...polos, ...ceros].filter((z) => z[1] === 0).map((z) => z[0]).sort((a, b) => a - b);
    const u = [...new Set(reales.map((x) => +x.toPrecision(10)))];
    const tramos = [], pts = [-Infinity, ...u, Infinity];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], mid = a === -Infinity ? b - 1 - Math.abs(b) * 0.1 : b === Infinity ? a + 1 + Math.abs(a) * 0.1 : (a + b) / 2;
      if (pReal(N, mid) / pReal(D, mid) < 0) { const t = tramos[tramos.length - 1]; if (t && t[1] === a) t[1] = b; else tramos.push([a, b]); }
    }
    const q = n - m, asint = { q, centro: null, ang: [] };
    if (q > 0) {
      const sp = polos.reduce((s, z) => s + z[0], 0), sz = ceros.reduce((s, z) => s + z[0], 0);
      asint.centro = (sp - sz) / q;
      const base = sg > 0 ? 180 : 0;
      for (let k = 0; k < q; k++) asint.ang.push(normaGr(base + (360 * k) / q));
      asint.ang.sort((a, b) => a - b);
    }
    const ruptura = [];
    if (m >= 0) {
      const rr = recorta(pSuma(pMul(pDer(D), N), pEsc(pMul(D, pDer(N)), -1)));
      if (!esCero(rr) && rr.length > 1) for (const z of raices(rr)) {
        if (Math.abs(z[1]) > 1e-7 * Math.max(1, Math.abs(z[0]))) continue;
        const s = z[0], nv = pReal(N, s);
        if (Math.abs(nv) < 1e-12) continue;
        const K = -pReal(D, s) / nv;
        if (!(K > 1e-12) || !isFinite(K)) continue;
        if (!tramos.some((t) => s >= t[0] - 1e-9 && s <= t[1] + 1e-9)) continue;
        const h = 1e-4 * Math.max(1, Math.abs(s)), Kf = (x) => -pReal(D, x) / pReal(N, x);
        if (ruptura.some((r) => Math.abs(r.s - s) < 1e-7 * Math.max(1, Math.abs(s)))) continue;
        ruptura.push({ s, K, tipo: Kf(s - h) < K && Kf(s + h) < K ? 'salida' : 'entrada' });
      }
      ruptura.sort((a, b) => a.s - b.s);
    }
    const angSigno = sg > 0 ? 0 : 180, angulos = [];
    const fase = (a, b) => grados(cArg(cSub(a, b)));
    for (const [lista, tipo] of [[polos, 'polo'], [ceros, 'cero']]) {
      lista.forEach((z, i) => {
        if (z[1] <= 1e-9) return;              // solo el de arriba de cada pareja
        const otros = lista.filter((_, j) => j !== i), contra = tipo === 'polo' ? ceros : polos;
        const sum = (arr) => arr.reduce((s, w) => s + fase(z, w), 0);
        const a = tipo === 'polo' ? angSigno + sum(contra) - sum(otros) - 180 : 180 - angSigno - sum(otros) + sum(contra);
        angulos.push({ tipo, z, ang: normaGr(a) });
      });
    }
    const rk = rangoK(N, D), cruces = rk.criticos.map((c) => ({ w: c.w, K: c.K })).concat(rk.todos.filter((c) => c.w === 0 && !rk.criticos.some((x) => x.K === c.K)).map((c) => ({ w: 0, K: c.K })));
    const feat = [...polos, ...ceros, ...ruptura.map((r) => [r.s, 0]), ...cruces.map((c) => [0, c.w])];
    if (asint.centro !== null) feat.push([asint.centro, 0]);
    const S = Math.max(1, ...feat.map(cAbs));
    const Kb = q > 0 ? Math.abs(D[0] / N[0]) * S ** q : Math.abs(D[0] / N[0]);
    const Ks = [0]; const NP = 1400;
    for (let i = 0; i <= NP; i++) Ks.push(Kb * 10 ** (-5 + (9 * i) / NP));
    for (const r of ruptura) Ks.push(r.K * 0.999, r.K * 1.001);
    for (const c of cruces) Ks.push(c.K * 0.999, c.K * 1.001);
    Ks.push(Kref); Ks.sort((a, b) => a - b);
    const ramas = Array.from({ length: n }, () => []);
    let prev = null;
    for (const K of Ks) {
      const rs = K === 0 ? polos : raices(polBase(N, D, K));
      if (rs.length !== n) continue;
      if (!prev) { rs.forEach((z, i) => ramas[i].push([z[0], z[1], K])); prev = rs.slice(); continue; }
      const libres = rs.map((z, i) => i), asig = Array(n).fill(-1), pares = [];
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) pares.push([cAbs(cSub(prev[a], rs[b])), a, b]);
      pares.sort((x, y) => x[0] - y[0]);
      const usadoA = new Set(), usadoB = new Set();
      for (const [, a, b] of pares) if (!usadoA.has(a) && !usadoB.has(b)) { asig[a] = b; usadoA.add(a); usadoB.add(b); }
      void libres;
      const nuevo = prev.map((_, a) => rs[asig[a]]);
      nuevo.forEach((z, a) => ramas[a].push([z[0], z[1], K]));
      prev = nuevo;
    }
    return { n, m, sg, polos, ceros, tramos, asint, ruptura, angulos, cruces, rango: rk, ramas, S };
  }

  function nyquist(N, D, K) {
    const n = grado(D), m = grado(N);
    if (m > n) throw new Error('The numerator cannot have a higher degree than the denominator (the system would not be proper)');
    const L = (s) => { const num = pEval(N, s), den = pEval(D, s); return cDiv([K * num[0], K * num[1]], den); };
    const Lw = (w) => L([0, w]);
    const polos = raices(D), ceros = raices(N), escala = Math.max(1, ...polos.concat(ceros).map(cAbs));
    const tolEje = 1e-9 * escala;
    const P = polos.filter((z) => z[0] > tolEje).length;
    const noCero = [...polos, ...ceros].map(cAbs).filter((x) => x > tolEje);
    let wlo = noCero.length ? Math.min(...noCero) / 1e3 : 1e-2, whi = noCero.length ? Math.max(...noCero) * 1e3 : 1e2;
    if (n > m) { const rK = Math.abs(K * N[0] / D[0]) ** (1 / (n - m)); if (rK > 0 && isFinite(rK)) { wlo = Math.min(wlo, rK / 1e2); whi = Math.max(whi, rK * 1e2); } }
    const NW = 3000, ws = [], zs = [];
    for (let i = 0; i <= NW; i++) { const w = wlo * (whi / wlo) ** (i / NW); ws.push(w); zs.push(Lw(w)); }
    const biseca = (g, a, b) => { let ga = g(a); for (let it = 0; it < 80; it++) { const c = Math.sqrt(a * b), gc = g(c); if (Math.sign(gc) === Math.sign(ga)) { a = c; ga = gc; } else b = c; } return Math.sqrt(a * b); };
    const gMag = (w) => cAbs(Lw(w)) - 1, gIm = (w) => Lw(w)[1];
    const ganancia = [], fase = [];
    for (let i = 0; i < NW; i++) {
      if (Math.sign(gMag(ws[i])) !== Math.sign(gMag(ws[i + 1])) && isFinite(gMag(ws[i])) && isFinite(gMag(ws[i + 1]))) {
        const w = biseca(gMag, ws[i], ws[i + 1]), z = Lw(w), a = grados(cArg(z));
        ganancia.push({ w, z, fase: a, PM: normaGr(180 + a) });
      }
      const y0 = gIm(ws[i]), y1 = gIm(ws[i + 1]);
      if (y0 !== 0 && Math.sign(y0) !== Math.sign(y1)) {
        const w = biseca(gIm, ws[i], ws[i + 1]), z = Lw(w);
        if (z[0] < 0) fase.push({ w, z, mod: cAbs(z), GM: 1 / cAbs(z), GMdB: -20 * Math.log10(cAbs(z)) });
      }
    }
    const W = whi * 1e3, r = 1e-4 * Math.max(1, escala), axis = [];
    for (const z of polos) if (Math.abs(z[0]) <= tolEje) axis.push(z[1]);
    const paradas = [...new Set(axis.flatMap((w) => (Math.abs(w) <= tolEje ? [0] : [w, -w])).map((w) => +w.toPrecision(10)))].sort((a, b) => a - b);
    const piezas = [];
    let desde = -W;
    for (const w0 of paradas) { piezas.push({ tipo: 'eje', a: desde, b: w0 - r }); piezas.push({ tipo: 'arco', w0 }); desde = w0 + r; }
    piezas.push({ tipo: 'eje', a: desde, b: W });
    piezas.push({ tipo: 'grande' });
    let giro = 0, minD = Infinity, npts = 0, ultimo = null;
    const ang = (z) => Math.atan2(z[1], z[0] + 1), unos = (z) => [z[0] + 1, z[1]];
    const subdivide = (g, t0, t1, z0, z1, prof) => {
      const a0 = ang(z0), a1 = ang(z1);
      let da = a1 - a0; da -= 2 * PI * Math.round(da / (2 * PI));
      const l0 = Math.log(Math.max(cAbs(z0), 1e-300)), l1 = Math.log(Math.max(cAbs(z1), 1e-300));
      if (prof < 18 && npts < 400000 && (Math.abs(da) > 0.2 || Math.abs(l1 - l0) > 0.3) && Math.abs(t1 - t0) > 1e-14 * Math.max(1, Math.abs(t0))) {
        const tm = (t0 + t1) / 2, zm = g(tm);
        subdivide(g, t0, tm, z0, zm, prof + 1); subdivide(g, tm, t1, zm, z1, prof + 1); return;
      }
      giro += da; npts++; ultimo = z1;
      minD = Math.min(minD, cAbs(unos(z1)));
    };
    for (const pz of piezas) {
      let g, t0, t1;
      if (pz.tipo === 'eje') { g = (w) => L([0, w]); t0 = pz.a; t1 = pz.b; }
      else if (pz.tipo === 'arco') { g = (t) => L([r * Math.cos(t), pz.w0 + r * Math.sin(t)]); t0 = -PI / 2; t1 = PI / 2; }
      else { g = (t) => L([W * Math.cos(t), W * Math.sin(t)]); t0 = PI / 2; t1 = -PI / 2; }
      const NS = 60, tt = Array.from({ length: NS + 1 }, (_, i) => t0 + ((t1 - t0) * i) / NS);
      let zp = g(tt[0]); minD = Math.min(minD, cAbs(unos(zp)));
      for (let i = 1; i <= NS; i++) { const zc = g(tt[i]); subdivide(g, tt[i - 1], tt[i], zp, zc, 0); zp = zc; }
    }
    void ultimo;
    const vueltas = giro / (2 * PI), Ncw = Math.round(-vueltas);
    const Z = Ncw + P, polosCL = raices(polBase(N, D, K));
    const zCL = polosCL.filter((z) => z[0] > 1e-7 * Math.max(1, cAbs(z))).length, ejeCL = polosCL.filter((z) => Math.abs(z[0]) <= 1e-7 * Math.max(1, cAbs(z))).length;
    const pasaPor = minD < 1e-6 || ejeCL > 0;
    return { n, m, K, polos, ceros, P, Ncw, Z, vueltas, polosCL, zCL, ejeCL, pasaPor, ws, zs, wlo, whi, ganancia, fase, L: Lw, tipo: axis.filter((w) => Math.abs(w) <= tolEje).length };
  }

  function escalonCL(N, D, K, polosCL) {
    const cl = polBase(N, D, K), Nc = pEsc(N, K), n = grado(cl);
    const a0 = cl[0], a = cl.map((c) => c / a0), b = Array(cl.length - Nc.length).fill(0).concat(Nc).map((c) => c / a0);
    const d = b[0], bp = b.map((c, i) => c - d * a[i]);   // parte estrictamente propia: bp[1..n]
    const estable = polosCL.every((z) => z[0] < -1e-9 * Math.max(1, cAbs(z))), maxRe = Math.max(...polosCL.map((z) => z[0])), minSig = Math.min(...polosCL.map((z) => Math.abs(z[0])).filter((x) => x > 1e-9 * Math.max(1, ...polosCL.map(cAbs))), Infinity), vmax = Math.max(...polosCL.map(cAbs));
    let tmax;
    if (estable) tmax = 7 / minSig; else if (maxRe > 1e-7) tmax = 6 / maxRe; else tmax = 30 / Math.max(1e-9, Math.min(...polosCL.map(cAbs).filter((x) => x > 1e-9), Infinity));
    if (!isFinite(tmax) || tmax <= 0) tmax = 10;
    const pasosRK = Math.min(200000, Math.max(4000, Math.ceil(2 * vmax * tmax))), dt = tmax / pasosRK, M = 800, cada = Math.max(1, Math.floor(pasosRK / M));
    const x = Array(n).fill(0), der = (v) => { const o = v.slice(1).concat([0]); let s2 = 1; for (let k = 0; k < n; k++) s2 -= a[n - k] * v[k]; o[n - 1] = s2; return o; };   // x' = A x + B (u = 1)
    const y = (v) => { let s2 = d; for (let k = 0; k < n; k++) s2 += bp[n - k] * v[k]; return s2; };
    const t = [0], ys = [y(x)];
    for (let i = 1; i <= pasosRK; i++) {
      const k1 = der(x), k2 = der(x.map((v, j) => v + 0.5 * dt * k1[j])), k3 = der(x.map((v, j) => v + 0.5 * dt * k2[j])), k4 = der(x.map((v, j) => v + dt * k3[j]));
      for (let j = 0; j < n; j++) x[j] += (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]);
      if (i % cada === 0) { t.push(i * dt); ys.push(y(x)); }
    }
    const yss = a[n] !== 0 ? b[n] / a[n] : NaN, out = { t, y: ys, estable, tmax, yss, n };
    if (estable && Math.abs(yss) > 1e-9) {
      const cruce = (nivel) => { for (let i = 1; i < ys.length; i++) if ((ys[i - 1] - nivel) * (ys[i] - nivel) <= 0 && ys[i] !== ys[i - 1]) return t[i - 1] + ((nivel - ys[i - 1]) / (ys[i] - ys[i - 1])) * (t[i] - t[i - 1]); return NaN; };
      let pico = ys[0], tp = 0; ys.forEach((v, i) => { if (Math.sign(yss) * v > Math.sign(yss) * pico) { pico = v; tp = t[i]; } });
      let ult = 0; for (let i = ys.length - 1; i >= 0; i--) if (Math.abs(ys[i] - yss) > 0.02 * Math.abs(yss)) { ult = t[i]; break; }
      Object.assign(out, { subida: cruce(0.9 * yss) - cruce(0.1 * yss), sobre: Math.max(0, ((pico - yss) / yss) * Math.sign(yss) * Math.sign(yss)) * 100, tpico: tp, pico, ts: ult, ess: 1 - yss });
    }
    return out;
  }
  function bodeLazo(N, D, K) {
    const pz = [...raices(D), ...raices(N)].map(cAbs).filter((x) => x > 1e-9), lo = pz.length ? Math.min(...pz) : 1, hi = pz.length ? Math.max(...pz) : 1;
    const w0 = lo / 100, w1 = hi * 100, M = 500, ws = [], mag = [], fase = [];
    let previa = null;
    for (let i = 0; i <= M; i++) {
      const w = w0 * (w1 / w0) ** (i / M), L = cMul([K, 0], cDiv(pEval(N, [0, w]), pEval(D, [0, w])));
      let ph = (cArg(L) * 180) / PI; if (previa !== null) { while (ph - previa > 180) ph -= 360; while (ph - previa < -180) ph += 360; }
      previa = ph; ws.push(w); mag.push(20 * Math.log10(cAbs(L))); fase.push(ph);
    }
    return { ws, mag, fase };
  }

  const sol_estable = (ny) => (ny.pasaPor ? 'marginalmente estable' : ny.Z === 0 ? 'estable' : 'inestable');
  const MODOS = ['routh', 'raices', 'nyquist', 'escalon', 'bode'];
  function leeDatos(sc) {
    const modo = MODOS.includes(sc.modo) ? sc.modo : 'routh';
    const D = lee(sc, 'den', 'el denominador D(s)'), N = lee(sc, 'num', 'el numerador N(s)', modo === 'routh');
    const K = vacio(sc.K) ? 1 : leeNum(sc.K);
    if (!isFinite(K)) throw new Error('The gain K must be a number');
    if (grado(D) < 1) throw new Error('The denominator has to be at least first degree');
    if (N && esCero(N)) throw new Error('The numerator cannot be zero');
    if (N && K === 0) throw new Error('With K = 0 there is no loop: enter a nonzero K');
    if (N && grado(N) > grado(D)) throw new Error('The numerator cannot have a higher degree than the denominator (the system would not be proper)');
    return { modo, N, D, K };
  }
  const TABLA = (R) => {
    const w = Math.max(...R.filas.map((fl) => fl.c.length)), celda = (fl, j) => (j >= fl.c.length ? '<td></td>' : `<td>${fl.simple[j] ? (Math.abs(fl.c[j]) < 1e-12 ? '0' : f(fl.c[j])) : fl.txt[j]}</td>`);
    const cab = `<tr><th>Row</th>${Array.from({ length: w }, (_, j) => `<th>${j + 1}.ª</th>`).join('')}<th>Sign</th></tr>`;
    return `<table class="tabla">${cab}${R.filas.map((fl, i) => `<tr><td><b>$s^${fl.pot}$</b></td>${Array.from({ length: w }, (_, j) => celda(fl, j)).join('')}<td>${R.signos[i] > 0 ? '+' : R.signos[i] < 0 ? '−' : '0'}</td></tr>`).join('')}</table>`;
  };

  function resolver(sc) {
    const { modo, N, D, K } = leeDatos(sc);
    const pasos = [];
    const cl = N ? polBase(N, D, K) : D;
    if (grado(cl) < 1) throw new Error('With this K the characteristic equation loses its degree');
    const polosCL = raices(cl), estable = polosCL.every((z) => z[0] < -1e-7 * Math.max(1, cAbs(z)));
    const base = { modo, N, D, K, cl, polosCL, estable };

    if (modo === 'routh') {
      const R = routh(cl), rk = N ? rangoK(N, D) : null;
      pasos.push({ t: 'Characteristic equation', html: N ? `$1 + L(s) = 0$ with $L(s) = K · N(s)/D(s)$ gives $D(s) + K N(s) = 0$. With $N(s) = ${polTxt(N)}$, $D(s) = ${polTxt(D)}$ and $K = ${f(K)}$:<br>$p(s) = ${polTxt(cl)}$` : `The polynomial $p(s) = ${polTxt(cl)}$ is studied.` });
      pasos.push({ t: 'Routh table', html: `The first two rows are the coefficients of $p(s)$ (those in even positions and those in odd positions) and each following row comes from the two before it: $b = (a_1 c_0 − a_0 c_1)/a_1$.${TABLA(R)}${R.filas.some((fl) => fl.eps) ? 'A zero in the first column is replaced by a very small positive number $ε$; what matters in the following rows is their sign.' : ''}${R.aux.length ? `A whole row of zeros: the auxiliary polynomial $A(s) = ${R.aux.map((a) => polTxt(a.coef.flatMap((c, j) => [c, 0]).slice(0, a.pot + 1))).join('$ and $')}$ is formed with the previous row and the row of zeros is replaced by the coefficients of $A'(s)$. The roots of $A(s)$ (${R.auxRaices.map(listaRaices).join(' | ')}) are also roots of $p(s)$.` : ''}` });
      pasos.push({ t: 'Signs of the first column', html: `${R.signos.map((g) => (g > 0 ? '+' : g < 0 ? '−' : '0')).join(' ')}.<br>There ${R.cambios === 1 ? 'is' : 'are'} <b>${R.cambios}</b> sign change${R.cambios === 1 ? '' : 's'}: ${R.cambios} ${R.cambios === 1 ? 'root' : 'roots'} in the right half-plane${R.eje ? ` and ${R.eje} on the imaginary axis` : ''}. The system is <b>${R.estado}</b>.` });
      if (rk) {
        const crit = rk.criticos.map((c) => `$K = ${f(c.K)}$ with $ω = ${f(c.w)}$ rad/s`).concat(rk.todos.filter((c) => c.w === 0).map((c) => `$K = ${f(c.K)}$ with a root at $s = 0$`));
        pasos.push({ t: 'Values of K that give stability', html: `${crit.length ? `The closed-loop poles cross the imaginary axis at: ${crit.join('; ')}.` : 'No value of K > 0 puts a pole on the imaginary axis.'}<br>${rk.estables.length ? `The system is stable for <b>${textoRango(rk)}</b>.` : 'No value of K > 0 gives a stable system.'}` });
      }
      pasos.push({ t: 'Check with the roots', html: `The closed-loop poles are $${polosCL.map((z) => cTxt(z)).join('; ')}$ (${polosCL.filter((z) => z[0] > 1e-7 * Math.max(1, cAbs(z))).length} in the right half-plane).` });
      return { ...base, R, rk, pasos };
    }

    if (modo === 'raices') {
      const lg = lugar(N, D, K > 0 ? K : 1);
      const dom = polosCL.filter((z) => z[1] > 1e-9).sort((a, b) => Math.abs(a[0]) - Math.abs(b[0]))[0] || null;
      let din = null;
      if (dom) { const wn = cAbs(dom), z = -dom[0] / wn; din = { wn, zeta: z, wd: dom[1] }; if (z > 0 && z < 1) { din.Mp = 100 * Math.exp((-PI * z) / Math.sqrt(1 - z * z)); din.ts = 4 / (z * wn); din.tp = PI / dom[1]; } }
      pasos.push({ t: 'Open-loop poles and zeros', html: `Poles of $D(s) = ${polTxt(D)}$: ${listaRaices(lg.polos)}.<br>Zeros of $N(s) = ${polTxt(N)}$: ${listaRaices(lg.ceros)}.<br>There are $n = ${lg.n}$ branches: they start at the poles (K = 0), ${lg.m} end at the zeros and ${lg.n - lg.m} go to infinity (K → ∞).` });
      pasos.push({ t: 'Real axis', html: lg.tramos.length ? `The stretches of the real axis that have an odd number of real poles and zeros to their right belong to the locus: ${lg.tramos.map((t) => `[${t[0] === -Infinity ? '−∞' : f(t[0])}, ${t[1] === Infinity ? '∞' : f(t[1])}]`).join(' and ')}.` : 'No stretch of the real axis is on the locus.' });
      pasos.push({ t: 'Asymptotes', html: lg.asint.q > 0 ? `With $n − m = ${lg.asint.q}$ the branches that go to infinity follow asymptotes with angles ${lg.asint.ang.map((a) => `${f(a)}°`).join(', ')} starting at the centroid $σ = (Σ p − Σ z)/(n − m) = ${f(lg.asint.centro)}$.` : 'Since n = m, all the branches end at zeros: there are no asymptotes.' });
      pasos.push({ t: 'Breakaway points', html: lg.ruptura.length ? `$dK/ds = 0$ is solved, that is $D'(s) N(s) − D(s) N'(s) = 0$, and what lies on the locus with K > 0 is kept: ${lg.ruptura.map((r) => `$s = ${f(r.s)}$ (${r.tipo === 'salida' ? 'breakaway' : 'break-in'}, $K = ${f(r.K)}$)`).join('; ')}.` : 'The roots of $D\'N − DN\'$ give no breakaway point on the locus.' });
      if (lg.angulos.length) pasos.push({ t: 'Departure and arrival angles', html: lg.angulos.map((a) => `${a.tipo === 'polo' ? 'It leaves the pole' : 'It arrives at the zero'} $${cTxt(a.z)}$ at an angle of <b>${f(a.ang)}°</b>.`).join('<br>') + ' (It follows from the phase of $L(s)$ being 180° on the locus.)' });
      pasos.push({ t: 'Crossings of the imaginary axis', html: lg.cruces.length ? `The characteristic equation has roots on the imaginary axis for: ${lg.cruces.map((c) => (c.w ? `$K = ${f(c.K)}$ at $s = ±${f(c.w)}j$` : `$K = ${f(c.K)}$ at $s = 0$`)).join('; ')}. Beyond the first of those values, the system is unstable (provided the remaining branches are on the left).` : 'The locus does not cross the imaginary axis for K > 0.' });
      pasos.push({ t: `Closed-loop poles with K = ${f(K)}`, html: `${polosCL.map((z) => `$${cTxt(z)}$`).join('; ')}. The system is <b>${estable ? 'stable' : 'unstable or marginal'}</b>.${din ? ` The dominant pair has $ω_n = ${f(din.wn)}$ rad/s and $ζ = ${f(din.zeta)}$${din.Mp !== undefined ? `: overshoot $M_p = ${f(din.Mp)}$ %, peak time $t_p = ${f(din.tp)}$ s and settling time (2 %) $t_s ≈ ${f(din.ts)}$ s` : ''}.` : ''}` });
      return { ...base, lg, din, pasos };
    }

    if (modo === 'escalon') {
      const e = escalonCL(N, D, K, polosCL), T = `${f(K)}·(${polTxt(N)}) / (${polTxt(cl)})`;
      pasos.push({ t: 'Closed-loop transfer function', html: `With unity feedback, $T(s) = L(s)/(1 + L(s)) = K N(s)/(D(s) + K N(s))$. Here $T(s) = ${T}$. Its denominator is the characteristic equation: $p(s) = ${polTxt(cl)}$.` });
      pasos.push({ t: 'Closed-loop poles', html: `${polosCL.map((z) => `$${cTxt(z)}$`).join('; ')}. The system is <b>${e.estable ? 'stable' : 'unstable or marginal'}</b>${e.estable ? ': all the poles have negative real part and the step response settles' : ': there are poles with positive or zero real part and the response does not settle (only an interval is drawn)'}.` });
      if (e.estable && e.subida !== undefined) {
        pasos.push({ t: 'Final value and error', html: `By the final value theorem, $y(∞) = T(0) = ${f(e.yss)}$. The steady-state error for a unit step is $e_{ss} = 1 − T(0) = ${f(e.ess)}$${Math.abs(e.ess) < 1e-9 ? ' (an integrator in the loop cancels it)' : ''}.` });
        pasos.push({ t: 'Response parameters', html: `Rise time (from 10 % to 90 % of the final value): $${f(e.subida)}$ s. Overshoot: $M_p = ${f(e.sobre)}$ %. Peak time: $t_p = ${f(e.tpico)}$ s. Settling time (2 %): $t_s = ${f(e.ts)}$ s.` });
      } else if (e.estable) pasos.push({ t: 'Final value', html: `$T(0) = ${f(e.yss)}$: the output tends to 0, so it makes no sense to measure rise time or overshoot.` });
      pasos.push({ t: 'How it was computed', html: `The response is obtained by numerically integrating (fourth-order Runge-Kutta) the canonical form of $T(s)$ of order ${e.n} with a step input, for ${f(e.tmax)} s.` });
      return { ...base, es: e, pasos };
    }
    if (modo === 'bode') {
      if (K === 0) throw new Error('With K = 0 there is no loop: enter a nonzero K');
      const bd = bodeLazo(N, D, K), ny = nyquist(N, D, K), gm = ny.fase.slice().sort((a, b) => a.GM - b.GM)[0] || null, pm = ny.ganancia[0] || null, rk = rangoK(N, D);
      pasos.push({ t: 'Open loop', html: `$L(jω) = K N(jω)/D(jω) = ${f(K)} · (${polTxt(N, 'jω')})/(${polTxt(D, 'jω')})$. Its magnitude in decibels, $20 \log_{10}|L|$, and its phase are plotted, with $ω$ on a logarithmic scale.` });
      pasos.push({ t: 'Phase margin', html: pm ? `The magnitude crosses 0 dB (|L| = 1) at $ω_c = ${f(pm.w)}$ rad/s, where the phase is $${f(pm.fase)}°$. Phase margin: $M_F = 180° + ∠L(jω_c) = ${f(pm.PM)}°$${pm.PM > 0 ? '' : ' (negative: unstable closed loop)'}.` : 'The magnitude does not cross 0 dB: there is no gain crossover frequency or phase margin.' });
      pasos.push({ t: 'Gain margin', html: gm ? `The phase crosses −180° at $ω_{180} = ${f(gm.w)}$ rad/s, where $|L| = ${f(1 / gm.GM)}$ (${f(-gm.GMdB)} dB). Gain margin: $M_G = ${f(gm.GM)}$ = ${f(gm.GMdB)} dB. K can be raised up to $K_{crit} = ${f(K * gm.GM)}$ before reaching instability.` : 'The phase does not reach −180°: there is no finite gain margin.' });
      pasos.push({ t: 'Stability', html: `With K = ${f(K)} the closed loop is <b>${sol_estable(ny)}</b> (checked with the Nyquist criterion and with the roots: Routh gives stability for ${textoRango(rk)}).` });
      return { ...base, bd, ny, rk, gm, pm, pasos };
    }

    if (K === 0) throw new Error('With K = 0 there is no loop: enter a nonzero K');
    const ny = nyquist(N, D, K), rk = rangoK(N, D);
    const gm = ny.fase.slice().sort((a, b) => a.GM - b.GM)[0] || null, pm = ny.ganancia[0] || null;
    pasos.push({ t: 'Loop transfer function', html: `$L(s) = K N(s)/D(s) = ${f(K)} · (${polTxt(N)})/(${polTxt(D)})$. $s = jω$ is substituted and $L(jω)$ is plotted for $ω$ from 0 to ∞ (solid line) and its mirror image for $ω < 0$ (dashed).` });
    pasos.push({ t: 'Poles in the right half-plane', html: `Open-loop poles: ${listaRaices(ny.polos)}. There are $P = ${ny.P}$ in the right half-plane${ny.tipo ? `, and ${ny.tipo} at the origin (the contour goes around them on the right with an infinitesimal semicircle, which on the plot is closed with arcs of infinite radius)` : ''}.` });
    pasos.push({ t: 'Crossing of the real axis (gain margin)', html: gm ? `$L(jω)$ crosses the negative real axis at $ω_{180} = ${f(gm.w)}$ rad/s, with $L = ${f(gm.z[0])}$. Gain margin: $M_G = 1/|L| = ${f(gm.GM)}$ = ${f(gm.GMdB)} dB. K could be multiplied by ${f(gm.GM)} before the curve touches −1: $K_{crit} = ${f(K * gm.GM)}$.` : 'The curve does not cross the negative real axis: there is no finite gain margin (the gain can grow without the curve passing through −1).' });
    pasos.push({ t: 'Crossing of the unit circle (phase margin)', html: pm ? `$|L(jω)| = 1$ for $ω_c = ${f(pm.w)}$ rad/s, where the phase is $${f(pm.fase)}°$. Phase margin: $M_F = 180° + ∠L = ${f(pm.PM)}°$${pm.PM > 0 ? '' : ' (negative: unstable)'}.` : 'The curve does not cross the unit circle: there is no gain crossover frequency.' });
    pasos.push({ t: 'Nyquist criterion', html: `The curve makes <b>N = ${Math.abs(ny.Ncw)}</b> encirclement${Math.abs(ny.Ncw) === 1 ? '' : 's'} of −1 ${ny.Ncw === 0 ? '' : ny.Ncw > 0 ? 'clockwise' : 'counterclockwise'}. The closed-loop poles in the right half-plane are $Z = N + P = ${ny.Ncw} + ${ny.P} = ${ny.Z}$${ny.pasaPor ? ', but the curve passes through −1 (or very close to it): the system is marginally stable' : ny.Z === 0 ? ': the system is <b>stable</b>' : ': the system is <b>unstable</b>'}.` });
    pasos.push({ t: 'Check with the roots', html: `The closed-loop poles with K = ${f(K)} are $${ny.polosCL.map((z) => cTxt(z)).join('; ')}$ (${ny.zCL} in the right half-plane), and the Routh criterion gives stability for ${textoRango(rk)}.` });
    return { ...base, ny, rk, gm, pm, pasos };
  }

  const ejemplos = [
    { clave: 'tercer-orden', nombre: 'Third order: K/(s(s+1)(s+2)), K = 1', sc: { modo: 'routh', num: '1', den: 's(s+1)(s+2)', K: '1' } },
    { clave: 'tercer-orden-k', nombre: 'Third order with K = 10 (unstable)', sc: { modo: 'routh', num: '1', den: 's(s+1)(s+2)', K: '10' } },
    { clave: 'dos-cambios', nombre: 'Polynomial s⁴ + 2s³ + 3s² + 4s + 5', sc: { modo: 'routh', num: '1', den: 's^4+2s^3+3s^2+4s', K: '5' } },
    { clave: 'cero-primera', nombre: 'Zero in the first column', sc: { modo: 'routh', num: '1', den: 's^4+s^3+2s^2+2s', K: '3' } },
    { clave: 'fila-ceros', nombre: 'Row of zeros (auxiliary polynomial)', sc: { modo: 'routh', num: '1', den: 's^5+2s^4+24s^3+48s^2-25s-51', K: '1' } },
    { clave: 'raices-tres', nombre: 'Locus of K/(s(s+1)(s+2))', sc: { modo: 'raices', num: '1', den: 's(s+1)(s+2)', K: '1' } },
    { clave: 'raices-complejos', nombre: 'Complex poles and a zero: K(s+3)/(s(s²+2s+2))', sc: { modo: 'raices', num: 's+3', den: 's(s^2+2s+2)', K: '1' } },
    { clave: 'escalon-segundo', nombre: 'Step of K/(s(s+2)) with K = 5', sc: { modo: 'escalon', num: '1', den: 's(s+2)', K: '5' } },
    { clave: 'escalon-estable', nombre: 'Step of K/(s+1)(s+3), K = 6', sc: { modo: 'escalon', num: '1', den: '(s+1)(s+3)', K: '6' } },
    { clave: 'bode-tres', nombre: 'Open-loop Bode plot of K/(s(s+1)(s+2)), K = 1', sc: { modo: 'bode', num: '1', den: 's(s+1)(s+2)', K: '1' } },
    { clave: 'bode-inestable', nombre: 'Bode plot with K = 10: negative margins', sc: { modo: 'bode', num: '1', den: 's(s+1)(s+2)', K: '10' } },
    { clave: 'nyquist-tres', nombre: 'Nyquist plot of K/(s(s+1)(s+2)), K = 1', sc: { modo: 'nyquist', num: '1', den: 's(s+1)(s+2)', K: '1' } },
    { clave: 'nyquist-inestable', nombre: 'Nyquist plot of an unstable pole: K/(s−1), K = 2', sc: { modo: 'nyquist', num: '1', den: 's-1', K: '2' } },
  ];

  return { resolver, escalonCL, bodeLazo, routh, rangoK, lugar, nyquist, raices, lee, polBase, polTxt, cTxt, ejemplos, f, grado };
})();

