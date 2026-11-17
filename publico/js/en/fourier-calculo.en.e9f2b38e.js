const Fourier = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const PI = Math.PI, vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  const MAXN = 100, NPAT = 14;

  function exacto(v) {
    if (Math.abs(v) < 1e-11) return { p: 0, q: 1, k: 0 };
    for (const k of [0, 1, -1, 2, -2, 3, -3]) { const r = E.fraccion(v / PI ** k, 5000); if (r && Math.abs(r[0]) < 1e6) return { p: r[0], q: r[1], k }; }
    return null;
  }
  const piK = (k) => (Math.abs(k) === 1 ? 'π' : `π^{${Math.abs(k)}}`);
  function numF(v, d = 5) {
    const e = exacto(v);
    if (!e) return f(v, d);
    const sg = e.p < 0 ? '−' : '', P = Math.abs(e.p);
    const arriba = e.k > 0 ? (P === 1 ? piK(e.k) : `${P} ${piK(e.k)}`) : String(P), abajo = [e.q !== 1 ? e.q : '', e.k < 0 ? piK(e.k) : ''].filter(Boolean).join(' ');
    return sg + (abajo ? `{${arriba}}/{${abajo}}` : arriba);
  }
  const conDec = (v) => { const e = exacto(v); return e && (e.k || e.q !== 1) ? `${numF(v)} ≈ ${f(v, 5)}` : numF(v); };

  const DEN = [0, 1, 2, 3, 4].map((k) => ({ v: (n) => n ** k, t: k ? (k === 1 ? 'n' : `n^{${k}}`) : '', k }))
    .concat([[(n) => n * n - 1, '(n^{2} − 1)'], [(n) => 4 * n * n - 1, '(4 n^{2} − 1)'], [(n) => n * n + 1, '(n^{2} + 1)'], [(n) => n * n + 4, '(n^{2} + 4)'], [(n) => 1 + n * n * PI * PI, '(1 + n^{2} π^{2})'], [(n) => 1 + 4 * n * n * PI * PI, '(1 + 4 n^{2} π^{2})']].flatMap(([v, t]) => [{ v, t }, { v: (n) => v(n) / n, t, num: true }]));
  const CTE = [[1, ''], [Math.E, 'e'], [Math.exp(PI), 'e^{π}'], [Math.exp(-PI), 'e^{−π}'], [Math.exp(2 * PI), 'e^{2π}'], [Math.exp(-1), 'e^{−1}'], [Math.sinh(PI), 'senh π'], [Math.sinh(1), 'senh 1']];
  const BASE = [() => 1, (n) => (n % 2 ? -1 : 1), (n) => [1, 0, -1, 0][n % 4], (n) => [0, 1, 0, -1][n % 4]];
  const PAT = ['', '(−1)^n', 'cos({n π}/{2})', 'sen({n π}/{2})'];
  function resuelve(M, y) {
    const n = y.length, A = M.map((r, i) => [...r, y[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-12) return null;
      [A[c], A[p]] = [A[p], A[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const k = A[r][c] / A[c][c]; for (let j = c; j <= n; j++) A[r][j] -= k * A[c][j]; }
    }
    return A.map((r, i) => r[n] / r[i]);
  }
  function conCte(v) {
    if (Math.abs(v) < 1e-10) return { p: 0, q: 1, cte: '', v: 0 };
    for (const [c, t] of CTE) { const r = E.fraccion(v / c, 2000); if (r && Math.abs((r[0] / r[1]) * c - v) < 1e-9 * Math.max(1, Math.abs(v))) return { p: r[0], q: r[1], cte: t, v: (r[0] / r[1]) * c }; }
    return null;
  }
  function ley(cs) {
    const esc = Math.max(1e-12, ...cs.slice(1).map(Math.abs));
    if (cs.slice(1).every((c) => Math.abs(c) < 1e-9 * Math.max(1, esc))) return { cero: true };
    for (const desde of [1, 2]) for (const nb of [2, 4]) for (const m of [0, 1, 2, 3]) for (const D of DEN) {
      if (D.v(desde) === 0) continue;
      const ns = Array.from({ length: nb }, (_, i) => desde + i), g = (n) => cs[n] * D.v(n) * PI ** m;
      const co = resuelve(ns.map((n) => BASE.slice(0, nb).map((b) => b(n))), ns.map(g));
      if (!co) continue;
      const P = (n) => co.reduce((s, c, i) => s + c * BASE[i](n), 0);
      let ok = true;
      for (let n = desde; n < cs.length && ok; n++) ok = Math.abs(cs[n] - P(n) / (D.v(n) * PI ** m)) <= 1e-8 * esc;
      if (!ok) continue;
      const id = co.map(conCte);
      if (id.some((x) => !x)) continue;
      if (nb === 4 && !id[2].p && !id[3].p) continue;
      return { m, D, desde, co: id, k: D.k };
    }
    return null;
  }
  function leyTxt(L) {
    const t = L.co.map((c, i) => ({ ...c, pat: PAT[i] })).filter((c) => c.p);
    if (!t.length) return '0';
    const Q = t.reduce((q, c) => (q * c.q) / gcd(q, c.q), 1), ints = t.map((c) => (c.p * Q) / c.q);
    const g = ints.reduce((x, y) => gcd(x, y), 0) || 1;
    let arriba, sg = '';
    const [a, b] = [t.find((c) => !c.pat), t.find((c) => c.pat === '(−1)^n')].map((c) => (c ? (c.p * Q) / c.q : 0));
    const simple = !L.D.num && t.every((c) => !c.cte && (c.pat === '' || c.pat === '(−1)^n'));
    if (simple && !b) { arriba = String(Math.abs(a)); sg = a < 0 ? '−' : ''; }
    else if (simple && !a) arriba = `${Math.abs(b) === 1 ? '' : Math.abs(b) + ' '}(−1)^{${b < 0 ? 'n+1' : 'n'}}`;
    else if (simple && a === -b) { arriba = g === 1 ? '1 − (−1)^n' : `${g} (1 − (−1)^n)`; sg = a < 0 ? '−' : ''; }
    else if (simple && a === b) { arriba = g === 1 ? '1 + (−1)^n' : `${g} (1 + (−1)^n)`; sg = a < 0 ? '−' : ''; }
    else if (simple) arriba = `${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)} (−1)^n`;
    else {
      const j = ints.findIndex((v) => v > 0);
      if (j > 0) { t.unshift(...t.splice(j, 1)); ints.unshift(...ints.splice(j, 1)); }
      const gg = t.length > 1 ? g : Math.abs(ints[0]), neg = ints[0] < 0;
      const cuerpo = t.map((c, i) => {
        const v = Math.abs(ints[i] / gg), u = [v === 1 && (c.cte || c.pat) ? '' : String(v), c.cte, c.pat].filter(Boolean).join(' ');
        return (i ? ((ints[i] < 0) !== neg ? ' − ' : ' + ') : '') + u;
      }).join('');
      sg = neg ? '−' : '';
      arriba = L.D.num ? (t.length > 1 ? `${gg === 1 ? '' : gg + ' '}n (${cuerpo})` : [gg === 1 ? '' : gg, 'n', cuerpo.replace(/^1 ?/, '')].filter(Boolean).join(' ')) : gg === 1 ? cuerpo : t.length > 1 ? `${gg} (${cuerpo})` : `${gg} ${cuerpo}`;
    }
    const abajo = [Q !== 1 ? String(Q) : '', L.D.t, L.m ? piK(L.m) : ''].filter(Boolean).join(' ');
    return sg + (abajo ? `{${arriba}}/{${abajo}}` : arriba);
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }

  const GX = [-0.9602898564975363, -0.7966664774136267, -0.5255324099163290, -0.1834346424956498, 0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363];
  const GW = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620, 0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
  function nodos(segs, sub = 128) {
    const xs = [], ws = [];
    for (const s of segs) {
      const h = (s.v - s.u) / sub;
      for (let i = 0; i < sub; i++) {
        const c = s.u + (i + 0.5) * h;
        for (let j = 0; j < 8; j++) {
          const x = c + (GX[j] * h) / 2, y = s.fn(x);
          if (!isFinite(y)) throw new Error(`f is not defined at x = ${f(x, 3)}: check that piece`);
          xs.push(x); ws.push((GW[j] * h * y) / 2);
        }
      }
    }
    return { xs, ws };
  }

  function argumento(T) {
    const w = (2 * PI) / T, r = E.fraccion(w, 1000);
    if (r) return r[1] === 1 ? (r[0] === 1 ? 'n x' : `${r[0]} n x`) : `{${r[0] === 1 ? '' : r[0] + ' '}n x}/{${r[1]}}`;
    const s = E.fraccion(w / PI, 1000);
    if (s) return s[1] === 1 ? (s[0] === 1 ? 'n π x' : `${s[0]} n π x`) : `{${s[0] === 1 ? '' : s[0] + ' '}n π x}/{${s[1]}}`;
    return `${f(w)} n x`;
  }
  const conN = (arg, n) => arg.replace(/(^|[{ ])n /, (_, a) => `${a}${n} `).replace(/^1 (?=[xπ])/, '').replace(/\{1 /, '{');

  function resolver(sc) {
    const ext = sc.ext || 'periodica';
    const tr = (sc.tramos || []).filter((t) => !vacio(t.f) || !vacio(t.a) || !vacio(t.b));
    if (!tr.length) throw new Error('The function is missing: write at least one piece');
    const leeN = (s, nom) => { const n = E.lee(s, nom); if (E.tieneX(n)) throw new Error(`${nom} cannot contain x`); const v = E.valor(n, 0); if (!isFinite(v)) throw new Error(`${nom} is not a number`); return v; };
    const tramos = tr.map((t, i) => {
      const nom = tr.length > 1 ? ` of piece ${i + 1}` : '';
      if (vacio(t.f)) throw new Error(`The function${nom} is missing`);
      if (vacio(t.a) || vacio(t.b)) throw new Error(`The endpoints${nom} are missing`);
      const ast = E.lee(t.f, `The function${nom}`);
      const a = leeN(t.a, `The left endpoint${nom}`), b = leeN(t.b, `The right endpoint${nom}`);
      if (!(b > a)) throw new Error(`Piece ${i + 1} must go from lower to higher (a < b)`);
      return { ast, a, b, txt: E.texto(E.simp(ast)), fn: (x) => E.valor(ast, x) };
    });
    tramos.forEach((t, i) => {
      const I = (sub) => { let s = 0; const h = (t.b - t.a) / sub; for (let k = 0; k < sub; k++) for (let j = 0; j < 8; j++) s += (GW[j] * h * Math.abs(t.fn(t.a + (k + 0.5) * h + (GX[j] * h) / 2))) / 2; return s; };
      const i1 = I(64), i2 = I(256), i3 = I(1024);
      if (isFinite(i3) && i3 - i2 > 0.01 * Math.max(1, i3) && i3 - i2 > 0.75 * (i2 - i1)) throw new Error(`The function${tramos.length > 1 ? ` of piece ${i + 1}` : ''} goes to infinity and its integral does not exist: it has no Fourier series`);
    });
    const huecos = [];
    for (let i = 1; i < tramos.length; i++) {
      const u = tramos[i - 1].b, v = tramos[i].a, tol = 1e-9 * Math.max(1, Math.abs(v));
      if (v < u - tol) throw new Error(`Piece ${i + 1} starts before piece ${i} ends (at ${f(u)}): the pieces cannot overlap`);
      if (v > u + tol) { huecos.push({ a: u, b: v }); tramos.splice(i, 0, { ast: null, a: u, b: v, txt: '0', fn: () => 0, hueco: true }); i++; }
    }
    const a0x = tramos[0].a, b0x = tramos[tramos.length - 1].b;
    if (ext !== 'periodica' && Math.abs(a0x) > 1e-12) throw new Error('For the even or odd extension the function is given on [0, L]: the first piece must start at 0');
    const N = vacio(sc.N) ? 10 : +String(sc.N).trim();
    if (!Number.isInteger(N) || N < 1 || N > MAXN) throw new Error(`The number of harmonics N must be an integer between 1 and ${MAXN}`);

    const segs = [];
    if (ext === 'periodica') tramos.forEach((t) => segs.push({ u: t.a, v: t.b, fn: t.fn, t }));
    else {
      const sg = ext === 'par' ? 1 : -1;
      [...tramos].reverse().forEach((t) => segs.push({ u: -t.b, v: -t.a, fn: (x) => sg * t.fn(-x), t, refl: true }));
      tramos.forEach((t) => segs.push({ u: t.a, v: t.b, fn: t.fn, t }));
    }
    const s0 = segs[0].u, T = segs[segs.length - 1].v - s0, L = T / 2, w0 = (2 * PI) / T;
    const fper = (x) => {
      let y = x - s0 - T * Math.floor((x - s0) / T);
      if (y >= T) y -= T;
      const xx = s0 + y, sgm = segs.find((s) => xx >= s.u && xx < s.v) || segs[segs.length - 1];
      return sgm.fn(xx);
    };

    const { xs, ws } = nodos(segs), nmax = Math.max(N, NPAT);
    const an = [], bn = [];
    for (let n = 0; n <= nmax; n++) {
      let sa = 0, sb = 0;
      for (let i = 0; i < xs.length; i++) { const t = n * w0 * xs[i]; sa += ws[i] * Math.cos(t); sb += ws[i] * Math.sin(t); }
      an.push((2 / T) * sa); bn.push((2 / T) * sb);
    }
    const esc = Math.max(1e-12, ...an.map(Math.abs), ...bn.map(Math.abs));
    const limpia = (c) => { if (Math.abs(c) < 1e-10 * esc) return 0; const e = exacto(c); return e ? (e.p / e.q) * PI ** e.k : c; };
    for (let n = 0; n <= nmax; n++) { an[n] = limpia(an[n]); bn[n] = limpia(bn[n]); }
    const par = bn.every((c) => c === 0), impar = an.every((c) => c === 0);
    const S = (x, k = N) => { let s = an[0] / 2; for (let n = 1; n <= Math.min(k, nmax); n++) s += an[n] * Math.cos(n * w0 * x) + bn[n] * Math.sin(n * w0 * x); return s; };

    const saltos = [];
    for (let i = 0; i < segs.length; i++) {
      const x = segs[i].v, izq = segs[i].fn(x - 1e-9 * Math.max(1, Math.abs(x))), sig = i + 1 < segs.length ? segs[i + 1] : segs[0], der = sig.fn((i + 1 < segs.length ? x : sig.u) + 1e-9 * Math.max(1, Math.abs(x)));
      if (isFinite(izq) && isFinite(der) && Math.abs(izq - der) > 1e-6 * Math.max(1, Math.abs(izq), Math.abs(der))) saltos.push({ x, izq, der, media: (izq + der) / 2 });
    }

    let int2 = 0; const n2 = nodos(segs.map((s) => ({ ...s, fn: (x) => s.fn(x) ** 2 })));
    for (const w of n2.ws) int2 += w;
    const energia = (2 / T) * int2;
    let parcial = an[0] ** 2 / 2; for (let n = 1; n <= N; n++) parcial += an[n] ** 2 + bn[n] ** 2;

    const arg = argumento(T), Tt = numF(T), Lt = numF(L), dosT = numF(2 / T);
    const a0t = numF(s0), b0t = numF(s0 + T);
    const pasos = [];
    const defTxt = (t) => `$f(x) = ${t.txt}$ if $${numF(t.a)} ≤ x < ${numF(t.b)}$`;
    pasos.push({ t: 'Period and frequency', html: (ext === 'periodica' ? `The function has period $T = ${Tt}$: ${tramos.map(defTxt).join('; ')}.` : `The function is given on [0, ${Lt}] (${tramos.map(defTxt).join('; ')}) and extended <b>${ext === 'par' ? 'evenly' : 'oddly'}</b> to [−${Lt}, ${Lt}], so $T = 2L = ${Tt}$${ext === 'par' ? ' and only cosines appear' : ' and only sines appear'}.`) + (huecos.length ? ` Between ${huecos.map((h) => `$${numF(h.a)}$ and $${numF(h.b)}$`).join(', ')} the function has not been given, so there <b>f = 0</b> is taken.` : '') + ` The fundamental frequency is $ω_0 = {2π}/{T} = ${numF(w0)}$ and the series is<br>$f(x) ∼ {a_0}/{2} + Σ_{n=1}^{∞} (a_n cos(${arg}) + b_n sen(${arg}))$` });
    pasos.push({ t: 'Parity', html: par && impar ? 'f is 0 over the whole period.' : par ? `f is <b>even</b>, $f(−x) = f(x)$: the product f(x) sin(nω₀x) is odd and its integral over a symmetric period is 0, so all the $b_n = 0$ (cosine series).` : impar ? `f is <b>odd</b>, $f(−x) = −f(x)$: $a_0$ and all the $a_n$ are 0 (sine series).` : 'f is neither even nor odd: the $a_n$ and the $b_n$ have to be computed.' });
    const intDef = (q) => `${dosT} ∫_{${a0t}}^{${b0t}} f(x) ${q} dx`;
    const lA = impar ? { cero: true } : ley(an.slice(0, NPAT + 1)), lB = par ? { cero: true } : ley(bn.slice(0, NPAT + 1));
    const lista = (cs, nom) => cs.slice(1, 9).map((c, i) => `$${nom}_{${i + 1}} = ${numF(c)}$`).join(', ');
    pasos.push({ t: 'Coefficient a₀', html: `$a_0 = ${intDef('')} = ${conDec(an[0])}$, so the mean value of f is $a_0/2 = ${numF(an[0] / 2)}$.` });
    const general = (L) => (L && !L.cero ? leyTxt(L) : null);
    const gA = general(lA), gB = general(lB);
    const aparte = (L, cs, nom) => (L?.desde === 2 ? ` for n ≥ 2, and the first one, computed separately, $${nom}_1 = ${numF(cs[1])}$` : '');
    const coefTxt = (L, g, cs, nom) => (L?.cero ? ` = 0 for all n ≥ 1.` : g === '0' ? ` = 0 for n ≥ 2, and the first one, computed separately, is <b>$${nom}_1 = ${numF(cs[1])}$</b>.` : g ? ` = <b>$${g}$</b>${aparte(L, cs, nom)}<br>Giving values: ${lista(cs, nom)}…` : `<br>They do not follow a simple formula; the first ones are ${lista(cs, nom)}…`);
    if (!impar) pasos.push({ t: 'Coefficients aₙ', html: `$a_n = ${intDef(`cos(${arg})`)}$` + coefTxt(lA, gA, an, 'a') });
    if (!par) pasos.push({ t: 'Coefficients bₙ', html: `$b_n = ${intDef(`sen(${arg})`)}$` + coefTxt(lB, gB, bn, 'b') });

    const terminos = [];
    if (Math.abs(an[0]) > 0) terminos.push({ c: an[0] / 2, s: '' });
    for (let n = 1; n <= nmax && terminos.length < 5; n++) {
      const u = conN(arg, n), ua = /^[xπ]$/.test(u) ? ` ${u}` : `(${u})`;
      if (an[n]) terminos.push({ c: an[n], s: `cos${ua}` });
      if (bn[n]) terminos.push({ c: bn[n], s: `sen${ua}` });
    }
    const unT = (t, i) => { const v = numF(Math.abs(t.c)), neg = t.c < 0, cuerpo = !t.s ? v : v === '1' ? t.s : `${v} ${t.s}`; return (i ? (neg ? ' − ' : ' + ') : neg ? '−' : '') + cuerpo; };
    const primeros = terminos.map(unT).join('') + ' + …';
    const u1 = conN(arg, 1), u1a = /^[xπ]$/.test(u1) ? ` ${u1}` : `(${u1})`;
    const sumaL = (L, g, cs, q) => {
      if (!g || L.cero) return [];
      const uno = L.desde === 2 && cs[1] ? [`${numF(cs[1])} ${q}${u1a}`] : [];
      return g === '0' ? uno : [...uno, `Σ_{n=${L.desde}}^{∞} ${g.startsWith('−') ? '(' + g + ')' : g} ${q}(${arg})`];
    };
    const sumaTxt = [an[0] ? numF(an[0] / 2) : '', ...sumaL(lA, gA, an, 'cos'), ...sumaL(lB, gB, bn, 'sin')].filter(Boolean).join(' + ').replace(/\+ −/g, '− ');
    const partido = (t) => { const i = t.indexOf(' + Σ', t.indexOf('Σ') + 1); return i < 0 ? t : `${t.slice(0, i)}$<br>$\u2003 ${t.slice(i + 1)}`; };
    pasos.push({ t: 'Fourier series', html: ((gA || lA?.cero) && (gB || lB?.cero) && sumaTxt ? `$f(x) ∼ ${partido(sumaTxt)}$<br>` : '') + `$f(x) ∼ ${primeros}$` });

    const cn = an.map((a, n) => (n ? { re: a / 2, im: -bn[n] / 2 } : { re: a / 2, im: 0 })).slice(0, N + 1);
    const An = an.map((a, n) => (n ? Math.hypot(a, bn[n]) : Math.abs(a) / 2)).slice(0, N + 1);
    const fase = an.map((a, n) => (n && An[n] > 1e-12 ? Math.atan2(-bn[n], a) : 0)).slice(0, N + 1);
    const mitad = (L) => (L && !L.cero && L.desde === 1 ? leyTxt({ ...L, co: L.co.map((c) => { const g = gcd(c.p, 2 * c.q) || 1; return { ...c, p: c.p / g, q: (2 * c.q) / g }; }) }) : null);
    const hA = impar || lA?.cero ? '0' : mitad(lA), hB = par || lB?.cero ? '0' : mitad(lB);
    const porI = (t) => (t.startsWith('−') ? `i ${t.slice(1)}` : `−i ${t}`);
    const cnTxt = hA && hB ? (hB === '0' ? hA : hA === '0' ? porI(hB) : `${hA} ${porI(hB).replace(/^−/, '− ').replace(/^i/, '+ i')}`) : null;
    const cTxt = (c) => (Math.abs(c.im) < 1e-12 ? numF(c.re) : `${Math.abs(c.re) < 1e-12 ? (c.im < 0 ? '−' : '') : `${numF(c.re)} ${c.im < 0 ? '−' : '+'} `}${numF(Math.abs(c.im)) === '1' ? '' : numF(Math.abs(c.im)) + ' '}i`);
    pasos.push({ t: 'Complex form', html: `With $cos θ = {e^{iθ} + e^{−iθ}}/{2}$ and $sin θ = {e^{iθ} − e^{−iθ}}/{2i}$ the series becomes $f(x) ∼ Σ_{n=−∞}^{∞} c_n e^{i n ω_0 x}$, with $c_0 = {a_0}/{2} = ${numF(an[0] / 2)}$, $c_n = {a_n − i b_n}/{2}$ and $c_{−n}$ the conjugate of $c_n$${cnTxt ? `:<br>$c_n = ${cnTxt}$` : ''}.<br>The first ones: ${[1, 2, 3].filter((n) => n <= N).map((n) => `$c_{${n}} = ${cTxt(cn[n])}$`).join(', ')}.` });
    const faseTxt = (p) => (Math.abs(p) < 1e-12 ? '0' : exacto(p)?.k === 1 ? numF(p) : f(p, 4));
    pasos.push({ t: 'Amplitude-phase form', html: `Combining the cosine and sine of each harmonic, $a_n cos(n ω_0 x) + b_n sin(n ω_0 x) = A_n cos(n ω_0 x + φ_n)$, with $A_n = √(a_n^2 + b_n^2)$ (the amplitude, the one in the spectrum) and $φ_n = arctan(−b_n/a_n)$ in its quadrant:<br>${[1, 2, 3, 4].filter((n) => n <= N).map((n) => `$A_{${n}} = ${An[n] < 1e-12 ? '0' : conDec(An[n]).replace(/ ≈ .*/, '')}$${An[n] < 1e-12 ? '' : `, $φ_{${n}} = ${faseTxt(fase[n])}$`}`).join('; ')}.` });

    pasos.push({ t: 'Convergence', html: saltos.length ? `f has ${saltos.length === 1 ? 'a jump' : 'jumps'} at ${saltos.map((s) => `$x = ${numF(s.x)}$`).join(', ')}. There the series converges to the mean of the one-sided limits, ${saltos.map((s) => `${'$'}{${f(s.izq)} ${s.der < 0 ? '−' : '+'} ${f(Math.abs(s.der))}}/{2} = ${f(s.media)}$`).join('; ')}, and near the jump the partial sum overshoots by 9% of the jump (Gibbs phenomenon) however many terms it has. At the other points it converges to f(x).` : 'f is continuous (also when passing from one period to the next), so the series converges to f(x) at every point, and the coefficients decrease quickly.' });

    let x0 = null, sx0 = null, fx0 = null;
    if (!vacio(sc.x0)) {
      x0 = leeN(sc.x0, 'The point x₀');
      sx0 = S(x0);
      const sj = saltos.find((s) => { const d = (x0 - s.x) / T; return Math.abs(d - Math.round(d)) < 1e-9; });
      fx0 = sj ? sj.media : fper(x0);
      pasos.push({ t: `Partial sum at x₀ = ${f(x0)}`, html: `With N = ${N} harmonics, $S_{${N}}(${f(x0)}) = ${f(sx0, 6)}$, and the series converges to ${sj ? 'the mean of the jump' : 'f(x₀)'} = ${f(fx0, 6)}: the difference is ${f(Math.abs(sx0 - fx0), 3)}.` });
    }
    pasos.push({ t: 'Parseval\'s identity', html: `$${dosT} ∫ f(x)^2 dx = {a_0^2}/{2} + Σ_{n=1}^{∞} (a_n^2 + b_n^2) = ${conDec(energia)}$. The first ${N} harmonics (with a₀) already add up to ${f(parcial, 6)}, ${f((100 * parcial) / energia, 4)}% of the “energy” of f.` });

    const sumas = [];
    const conv = (x) => { const sj = saltos.find((q) => { const d = (x - q.x) / T; return Math.abs(d - Math.round(d)) < 1e-9; }); return { v: sj ? sj.media : fper(x), salto: !!sj }; };
    const serieNum = (ts, S) => {
      const nz = ts.map((v, i) => ({ v, n: i + 1 })).filter((q) => Math.abs(q.v) > 1e-10 * esc);
      if (nz.length < 4) return null;
      let K = null, us = null;
      for (let j = 1; j <= 200 && !us; j++) {
        const k = nz[0].v * j, u = nz.slice(0, 4).map((q) => E.fraccion(q.v / k, 100000));
        if (u.every((r, i) => r && Math.abs(r[0] / r[1] - nz[i].v / k) < 1e-9 && Math.abs(r[0]) === 1)) { K = k; us = u; }
      }
      if (!us) return null;
      const val = S / K, e = exacto(val);
      if (!e || Math.abs(val) < 1e-12) return null;
      const fr = (r) => (r[1] === 1 ? String(Math.abs(r[0])) : `{${Math.abs(r[0])}}/{${r[1]}}`);
      const txt = us.map((r, i) => (i ? (r[0] < 0 ? ' − ' : ' + ') : r[0] < 0 ? '−' : '') + fr(r)).join('') + ' + …';
      return { txt: `${txt} = ${numF(val)}`, clave: us.map((r) => r.join('/')).join(',') };
    };
    if ((gA || lA?.cero) && (gB || lB?.cero)) {
      for (const x of [0, T / 2, T / 4, -T / 4]) {
        const { v, salto } = conv(x), ts = [];
        for (let n = 1; n <= nmax; n++) { const c = Math.cos(n * w0 * x), sn = Math.sin(n * w0 * x); ts.push(an[n] * (Math.abs(c) < 1e-12 ? 0 : c) + bn[n] * (Math.abs(sn) < 1e-12 ? 0 : sn)); }
        const r = serieNum(ts, v - an[0] / 2);
        if (r && !sumas.some((q) => q.clave === r.clave)) sumas.push({ ...r, como: `At $x = ${numF(x)}$ the series converges to ${salto ? 'the mean of the jump, ' : ''}$${numF(v)}$, so solving` });
        if (sumas.length >= 2) break;
      }
      const ts = []; for (let n = 1; n <= nmax; n++) ts.push(an[n] ** 2 + bn[n] ** 2);
      const r = serieNum(ts, energia - an[0] ** 2 / 2);
      if (r && !sumas.some((q) => q.clave === r.clave)) sumas.push({ ...r, como: 'With Parseval\'s identity, subtracting ${a_0^2}/{2}$ and dividing,' });
    }
    if (sumas.length) pasos.push({ t: 'Sums of numerical series', html: sumas.map((q) => `${q.como}<br>$${q.txt}$`).join('<br>') });

    return { tramos, huecos, ext, T, L, w0, N, nmax, an, bn, par, impar, saltos, S, fper, energia, parcial, x0, sx0, fx0, gA, gB, desdeA: lA?.desde || 1, desdeB: lB?.desde || 1, cerosA: !!lA?.cero, cerosB: !!lB?.cero, cn, cnTxt, An, fase, sumas, pasos, s0, primeros };
  }

  const ejemplos = [
    { clave: 'cuadrada', nombre: 'Square wave (−1 and 1)', sc: { ext: 'periodica', tramos: [{ f: '-1', a: '-π', b: '0' }, { f: '1', a: '0', b: 'π' }], N: '9', x0: 'π/2' } },
    { clave: 'sierra', nombre: 'Sawtooth: f(x) = x on [−π, π]', sc: { ext: 'periodica', tramos: [{ f: 'x', a: '-π', b: 'π' }], N: '10', x0: 'π/2' } },
    { clave: 'parabola', nombre: 'f(x) = x² on [−π, π]', sc: { ext: 'periodica', tramos: [{ f: 'x^2', a: '-π', b: 'π' }], N: '8', x0: 'π' } },
    { clave: 'triangular', nombre: 'Triangular wave: |x| on [−π, π]', sc: { ext: 'periodica', tramos: [{ f: '|x|', a: '-π', b: 'π' }], N: '7', x0: '0' } },
    { clave: 'pulso', nombre: 'Rectangular pulse of period 2', sc: { ext: 'periodica', tramos: [{ f: '1', a: '0', b: '1' }, { f: '0', a: '1', b: '2' }], N: '15', x0: '0,5' } },
    { clave: 'rectificada', nombre: 'Rectified sine: |sin x|', sc: { ext: 'periodica', tramos: [{ f: '|sen x|', a: '-π', b: 'π' }], N: '8', x0: '' } },
    { clave: 'media-onda', nombre: 'Half-wave rectified', sc: { ext: 'periodica', tramos: [{ f: 'sen x', a: '0', b: 'π' }, { f: '0', a: 'π', b: '2π' }], N: '8', x0: '' } },
    { clave: 'sierra-0-2pi', nombre: 'f(x) = x on [0, 2π]', sc: { ext: 'periodica', tramos: [{ f: 'x', a: '0', b: '2π' }], N: '10', x0: '' } },
    { clave: 'cosenos', nombre: 'Cosine expansion of x on [0, π]', sc: { ext: 'par', tramos: [{ f: 'x', a: '0', b: 'π' }], N: '7', x0: '' } },
    { clave: 'senos', nombre: 'Sine expansion of 1 on [0, π]', sc: { ext: 'impar', tramos: [{ f: '1', a: '0', b: 'π' }], N: '9', x0: '' } },
    { clave: 'senos-parabola', nombre: 'Sine expansion of x(π − x)', sc: { ext: 'impar', tramos: [{ f: 'x(π - x)', a: '0', b: 'π' }], N: '5', x0: 'π/2' } },
    { clave: 'cuadrada-T2', nombre: 'Square wave of period 2', sc: { ext: 'periodica', tramos: [{ f: '-1', a: '-1', b: '0' }, { f: '1', a: '0', b: '1' }], N: '9', x0: '' } },
    { clave: 'exponencial', nombre: 'f(x) = eˣ on [−π, π]', sc: { ext: 'periodica', tramos: [{ f: 'e^x', a: '-π', b: 'π' }], N: '10', x0: '' } },
    { clave: 'trapecio', nombre: 'Trapezoidal wave of period 4', sc: { ext: 'periodica', tramos: [{ f: 'x', a: '0', b: '1' }, { f: '1', a: '1', b: '2' }, { f: '3 - x', a: '2', b: '3' }, { f: '0', a: '3', b: '4' }], N: '10', x0: '' } },
    { clave: 'hueco', nombre: 'Pieces with a gap (f = 0 in between)', sc: { ext: 'periodica', tramos: [{ f: '1', a: '-π', b: '-π/2' }, { f: '1', a: 'π/2', b: 'π' }], N: '9', x0: '' } },
  ];

  return { resolver, ejemplos, ley, leyTxt, numF, exacto, f, MAXN };
})();

