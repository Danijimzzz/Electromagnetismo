const Algebra = (() => {
  const babs = (a) => (a < 0n ? -a : a);
  const mcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
  const mcm = (a, b) => (a / mcd(a, b)) * b;
  function Q(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new Error('Division durch null');
    if (d < 0n) { n = -n; d = -d; }
    const g = mcd(n, d) || 1n;
    return { n: n / g, d: d / g };
  }
  const q0 = Q(0), q1 = Q(1);
  const qsum = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d), qres = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
  const qmul = (a, b) => Q(a.n * b.n, a.d * b.d), qdiv = (a, b) => { if (b.n === 0n) throw new Error('Division durch null'); return Q(a.n * b.d, a.d * b.n); };
  const qneg = (a) => ({ n: -a.n, d: a.d }), qcero = (a) => a.n === 0n, qigual = (a, b) => a.n === b.n && a.d === b.d;
  const qnum = (a) => Number(a.n) / Number(a.d);

  const C = (re, im = q0) => ({ re, im });
  const c0 = C(q0), c1 = C(q1), cI = C(q0, q1);
  const ent = (k) => C(Q(k));
  const suma = (a, b) => C(qsum(a.re, b.re), qsum(a.im, b.im));
  const resta = (a, b) => C(qres(a.re, b.re), qres(a.im, b.im));
  const mul = (a, b) => C(qres(qmul(a.re, b.re), qmul(a.im, b.im)), qsum(qmul(a.re, b.im), qmul(a.im, b.re)));
  const neg = (a) => C(qneg(a.re), qneg(a.im));
  const conj = (a) => C(a.re, qneg(a.im));
  function div(a, b) {
    const m = qsum(qmul(b.re, b.re), qmul(b.im, b.im));
    if (qcero(m)) throw new Error('Division durch null');
    const p = mul(a, conj(b));
    return C(qdiv(p.re, m), qdiv(p.im, m));
  }
  const esCero = (a) => qcero(a.re) && qcero(a.im), igual = (a, b) => qigual(a.re, b.re) && qigual(a.im, b.im);
  const esReal = (a) => qcero(a.im), esUno = (a) => igual(a, c1), esMenosUno = (a) => igual(a, ent(-1));
  const aFloat = (a) => ({ re: qnum(a.re), im: qnum(a.im) });
  function potencia(b, e) {
    let r = c1, x = b, k = BigInt(e);
    if (k < 0n) { x = div(c1, b); k = -k; }
    while (k > 0n) { if (k & 1n) r = mul(r, x); x = mul(x, x); k >>= 1n; }
    return r;
  }

  function leer(texto) {
    const orig = String(texto ?? '').trim();
    const s = orig.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/j/gi, 'i').replace(/I/g, 'i');
    if (!s) throw new Error('Ein Feld ist leer');
    let p = 0;
    const mal = () => new Error(`„${orig}“ ist keine Zahl: Schreibe zum Beispiel 3, −1/2, 0,25 oder 2−3i`);
    const ve = () => s[p];
    function expr() {
      let v = termino();
      while (ve() === '+' || ve() === '-') { const op = s[p++], t = termino(); v = op === '+' ? suma(v, t) : resta(v, t); }
      return v;
    }
    function termino() {
      let v = unario();
      for (;;) {
        const c = ve();
        if (c === '*' || c === '/') { p++; const f = unario(); v = c === '*' ? mul(v, f) : div(v, f); }
        else if (c === 'i' || c === '(') v = mul(v, pot());
        else return v;
      }
    }
    function unario() {
      if (ve() === '-') { p++; return neg(unario()); }
      if (ve() === '+') { p++; return unario(); }
      return pot();
    }
    function pot() {
      const b = atomo();
      if (ve() !== '^') return b;
      p++;
      const m = /^-?\d+/.exec(s.slice(p));
      if (!m) throw mal();
      p += m[0].length;
      return potencia(b, m[0]);
    }
    function atomo() {
      const c = ve();
      if (c === '(') { p++; const v = expr(); if (s[p++] !== ')') throw mal(); return v; }
      if (c === 'i') { p++; return cI; }
      const m = /^(\d+)(?:[.,](\d*))?|^[.,](\d+)/.exec(s.slice(p));
      if (!m) throw mal();
      p += m[0].length;
      const e = m[1] ?? '0', d = m[2] ?? m[3] ?? '';
      return C(Q(BigInt(e + d), 10n ** BigInt(d.length)));
    }
    let v;
    try { v = expr(); } catch (e) { throw e.message === 'Division durch null' ? new Error(`„${orig}“ teilt durch null`) : mal(); }
    if (p < s.length) throw mal();
    return v;
  }

  const menos = (s) => s.replace(/-/g, '−');
  const qTxt = (a) => menos(a.d === 1n ? `${a.n}` : `${a.n}/${a.d}`);
  const qHtml = (a) => (a.d === 1n ? menos(`${a.n}`) : `${a.n < 0n ? '−' : ''}<span class="fr"><span>${babs(a.n)}</span><span>${a.d}</span></span>`);
  const imTxt = (q) => (qigual(q, q1) ? 'i' : qigual(q, qneg(q1)) ? '−i' : q.d === 1n ? `${qTxt(q)}i` : `${qTxt(q)}·i`);
  const imHtml = (q) => (qigual(q, q1) ? 'i' : qigual(q, qneg(q1)) ? '−i' : `${qHtml(q)}i`);
  function escribe(a, im, re) {
    if (qcero(a.im)) return re(a.re);
    if (qcero(a.re)) return im(a.im);
    return `${re(a.re)} ${a.im.n < 0n ? '−' : '+'} ${im(qcero(a.im) ? a.im : { n: babs(a.im.n), d: a.im.d })}`;
  }
  const txt = (a) => escribe(a, imTxt, qTxt);
  const html = (a) => escribe(a, imHtml, qHtml);
  const compuesto = (a) => !qcero(a.re) && !qcero(a.im);
  const htmlP = (a) => (compuesto(a) ? `(${html(a)})` : html(a));
  const htmlF = (a) => (compuesto(a) || (qcero(a.im) ? a.re.n < 0n : qcero(a.re) && a.im.n < 0n) ? `(${html(a)})` : html(a));
  function signo(a) {
    if (compuesto(a)) return ['+', `(${html(a)})`];
    const negativo = qcero(a.im) ? a.re.n < 0n : a.im.n < 0n;
    return negativo ? ['−', html(neg(a))] : ['+', html(a)];
  }
  const decimal = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    return menos(String(+x.toPrecision(d))).replace('.', ',');
  };
  const decimalC = (z, d = 4) => {
    const re = Math.abs(z.re) < 1e-10 ? 0 : z.re, im = Math.abs(z.im) < 1e-10 ? 0 : z.im;
    if (!im) return decimal(re, d);
    const ii = Math.abs(im) === 1 ? 'i' : `${decimal(Math.abs(im), d)}i`;
    return re ? `${decimal(re, d)} ${im < 0 ? '−' : '+'} ${ii}` : `${im < 0 ? '−' : ''}${ii}`;
  };

  const copia = (M) => M.map((f) => f.slice());
  const identidad = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? c1 : c0)));
  const traspuesta = (M) => M[0].map((_, j) => M.map((f) => f[j]));
  const sumaM = (A, B) => A.map((f, i) => f.map((x, j) => suma(x, B[i][j])));
  const restaM = (A, B) => A.map((f, i) => f.map((x, j) => resta(x, B[i][j])));
  const escalar = (k, A) => A.map((f) => f.map((x) => mul(k, x)));
  const producto = (A, B) => A.map((f) => B[0].map((_, j) => f.reduce((s, x, k) => suma(s, mul(x, B[k][j])), c0)));
  const iguales = (A, B) => A.length === B.length && A.every((f, i) => f.length === B[i].length && f.every((x, j) => igual(x, B[i][j])));
  const traza = (A) => A.reduce((s, f, i) => suma(s, f[i]), c0);
  const esRealM = (A) => A.every((f) => f.every(esReal));
  const leerMatriz = (filas) => filas.map((f, i) => f.map((v, j) => { try { return leer(v); } catch (e) { throw new Error(`Zeile ${i + 1}, Spalte ${j + 1}: ${e.message}`); } }));

  function matHtml(M, { barra = null, det = false, marca = null } = {}) {
    return `<span class="mat${det ? ' det' : ''}"><table>${M.map((f, i) => `<tr>${f.map((x, j) => `<td${j === barra ? ' class="barra"' : ''}${marca && marca[0] === i && marca[1] === j ? ' data-piv' : ''}>${html(x)}</td>`).join('')}</tr>`).join('')}</table></span>`;
  }
  const vecHtml = (v) => matHtml(v.map((x) => [x]));
  const F = (i) => `F<sub>${i + 1}</sub>`;

  function escalonar(M0, { reducida = false, columnas = M0[0].length, barra = null } = {}) {
    const M = copia(M0), m = M.length, pasos = [], pivotes = [];
    let r = 0, cambios = 0, escala = c1;
    for (let c = 0; c < columnas && r < m; c++) {
      let k = -1;
      if (!esCero(M[r][c]) && (esUno(M[r][c]) || esMenosUno(M[r][c]))) k = r;
      else {
        for (let j = r + 1; j < m && k < 0; j++) if (esUno(M[j][c])) k = j;
        if (k < 0 && !esCero(M[r][c])) k = r;
        for (let j = r + 1; j < m && k < 0; j++) if (!esCero(M[j][c])) k = j;
      }
      if (k < 0) continue;
      const ops = [];
      if (k !== r) { [M[r], M[k]] = [M[k], M[r]]; cambios++; ops.push(`${F(r)} ↔ ${F(k)}`); }
      if (reducida && !esUno(M[r][c])) {
        const p = M[r][c];
        escala = mul(escala, p);
        M[r] = M[r].map((x) => div(x, p));
        ops.push(esMenosUno(p) ? `${F(r)} → −${F(r)}` : `${F(r)} → ${F(r)} / ${htmlP(p)}`);
      }
      for (let j = reducida ? 0 : r + 1; j < m; j++) {
        if (j === r || esCero(M[j][c])) continue;
        const f = div(M[j][c], M[r][c]);
        M[j] = M[j].map((x, l) => resta(x, mul(f, M[r][l])));
        const [s, v] = signo(neg(f));
        ops.push(`${F(j)} → ${F(j)} ${s} ${esUno(f) || esMenosUno(f) ? '' : v + '·'}${F(r)}`);
      }
      pivotes.push([r, c]);
      if (ops.length) pasos.push({ ops, M: copia(M), barra, piv: [r, c] });
      r++;
    }
    return { R: M, pasos, pivotes, rango: pivotes.length, cambios, escala };
  }

  function determinante(A) {
    const n = A.length, e = escalonar(A);
    if (e.rango < n) return c0;
    let d = e.cambios % 2 ? ent(-1) : c1;
    for (let i = 0; i < n; i++) d = mul(d, e.R[i][i]);
    return d;
  }
  const menor = (A, i, j) => A.filter((_, r) => r !== i).map((f) => f.filter((_, c) => c !== j));
  const cofactor = (A, i, j) => ((i + j) % 2 ? neg : (x) => x)(determinante(menor(A, i, j)));

  function nucleo(A) {
    const n = A[0].length, e = escalonar(A, { reducida: true }), pc = e.pivotes.map(([, c]) => c);
    const libres = [...Array(n).keys()].filter((c) => !pc.includes(c));
    const base = libres.map((l) => {
      const v = Array(n).fill(c0);
      v[l] = c1;
      e.pivotes.forEach(([r, c]) => { v[c] = neg(e.R[r][l]); });
      return limpia(v);
    });
    return { R: e.R, pasos: e.pasos, pivotes: e.pivotes, libres, base };
  }
  function limpia(v) {
    let m = 1n;
    for (const x of v) m = mcm(mcm(m, x.re.d), x.im.d);
    let w = v.map((x) => mul(ent(m), x));
    const ints = w.flatMap((x) => [x.re.n, x.im.n]).filter((x) => x !== 0n);
    const g = ints.reduce((a, b) => mcd(a, b), 0n);
    if (g > 1n) w = w.map((x) => div(x, ent(g)));
    const p = w.find((x) => !esCero(x));
    if (p && esReal(p) && p.re.n < 0n) w = w.map(neg);
    return w;
  }

  function caracteristico(A) {
    const n = A.length, c = Array(n + 1).fill(c0);
    c[0] = c1;
    let Mk = identidad(n).map((f) => f.map(() => c0));
    for (let k = 1; k <= n; k++) {
      Mk = sumaM(producto(A, Mk), escalar(c[k - 1], identidad(n)));
      c[k] = div(neg(traza(producto(A, Mk))), ent(k));
    }
    return c;
  }
  const evalua = (p, x) => p.reduce((s, a) => suma(mul(s, x), a), c0);
  function ruffini(p, r) {
    const q = [p[0]];
    for (let i = 1; i < p.length; i++) q.push(suma(p[i], mul(q[i - 1], r)));
    return [q.slice(0, -1), q[q.length - 1]];
  }
  function raicesNum(p) {
    const a = p.map(aFloat), n = a.length - 1;
    if (n < 1) return [];
    const lc = a[0], co = a.map((x) => { const m = lc.re * lc.re + lc.im * lc.im; return { re: (x.re * lc.re + x.im * lc.im) / m, im: (x.im * lc.re - x.re * lc.im) / m }; });
    const cm = (x, y) => ({ re: x.re * y.re - x.im * y.im, im: x.re * y.im + x.im * y.re });
    const cd = (x, y) => { const m = y.re * y.re + y.im * y.im; return { re: (x.re * y.re + x.im * y.im) / m, im: (x.im * y.re - x.re * y.im) / m }; };
    const R = 1 + Math.max(...co.slice(1).map((x) => Math.hypot(x.re, x.im)));
    let z = Array.from({ length: n }, (_, k) => ({ re: R * Math.cos((2 * Math.PI * k) / n + 0.4), im: R * Math.sin((2 * Math.PI * k) / n + 0.4) }));
    for (let it = 0; it < 2000; it++) {
      let delta = 0;
      z = z.map((zi, i) => {
        let num = { re: 1, im: 0 };
        for (let k = 1; k <= n; k++) num = { re: num.re * zi.re - num.im * zi.im + co[k].re, im: num.re * zi.im + num.im * zi.re + co[k].im };
        let den = { re: 1, im: 0 };
        z.forEach((zj, j) => { if (j !== i) den = cm(den, { re: zi.re - zj.re, im: zi.im - zj.im }); });
        const d = cd(num, den);
        delta = Math.max(delta, Math.hypot(d.re, d.im));
        return { re: zi.re - d.re, im: zi.im - d.im };
      });
      if (delta < 1e-14) break;
    }
    return z;
  }
  const aproxQ = (x) => {
    for (let d = 1; d <= 60; d++) { const n = Math.round(x * d); if (Math.abs(x - n / d) < 1e-3 * Math.max(1, Math.abs(x)) / d) return Q(n, d); }
    return null;
  };
  function raices(p0) {
    let p = p0.slice();
    const exactas = [];
    for (let vuelta = 0; vuelta < 30 && p.length > 1; vuelta++) {
      let hallada = null;
      for (const z of raicesNum(p)) {
        const re = aproxQ(z.re), im = Math.abs(z.im) < 1e-7 ? q0 : aproxQ(z.im);
        if (!re || !im) continue;
        const r = C(re, im);
        if (esCero(evalua(p, r))) { hallada = r; break; }
      }
      if (!hallada) break;
      let m = 0;
      for (;;) { const [q, resto] = ruffini(p, hallada); if (!esCero(resto)) break; p = q; m++; }
      exactas.push({ valor: hallada, mult: m });
    }
    return { exactas, resto: p, aprox: raicesNum(p) };
  }

  function raizHtml(q) {
    const N = q.n * q.d, D = q.d;
    let fuera = 1n, dentro = N;
    for (let k = 2n; k * k <= dentro && k <= 100000n; k++) while (dentro % (k * k) === 0n) { dentro /= k * k; fuera *= k; }
    const g = mcd(fuera, D), a = fuera / g, b = D / g;
    if (dentro === 1n) return null;
    return { a, b, dentro };
  }

  function polHtml(p, x = 'λ') {
    const n = p.length - 1;
    let s = '';
    p.forEach((a, i) => {
      if (esCero(a)) return;
      const g = n - i, var_ = g === 0 ? '' : g === 1 ? x : `${x}<sup>${g}</sup>`;
      let [sg, v] = signo(a);
      if (g > 0 && (esUno(a) || esMenosUno(a))) v = '';
      if (!s) s = (sg === '−' ? '−' : '') + v + var_;
      else s += ` ${sg} ${v}${var_}`;
    });
    return s || '0';
  }

  return {
    Q, C, c0, c1, cI, ent, suma, resta, mul, div, neg, conj, potencia, esCero, igual, esReal, esUno, aFloat, qnum,
    leer, leerMatriz, txt, html, htmlP, htmlF, signo, decimal, decimalC,
    copia, identidad, traspuesta, sumaM, restaM, escalar, producto, iguales, traza, esRealM, matHtml, vecHtml, F,
    escalonar, determinante, menor, cofactor, nucleo, limpia, caracteristico, evalua, ruffini, raicesNum, raices, raizHtml, polHtml,
  };
})();

