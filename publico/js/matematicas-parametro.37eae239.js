const Parametro = (() => {
  const A = Algebra, { c0, c1, suma, resta, mul, div, neg, esCero, igual, esUno } = A;
  const LETRA = /[a-dfghk-zα-ωA-HJ-Z]/;

  const limpia = (p) => { const q = p.slice(); while (q.length > 1 && esCero(q[q.length - 1])) q.pop(); return q.length ? q : [c0]; };
  const cte = (c) => [c];
  const grado = (p) => { const q = limpia(p); return q.length === 1 && esCero(q[0]) ? -Infinity : q.length - 1; };
  const nulo = (p) => grado(p) === -Infinity;
  const constante = (p) => grado(p) <= 0;
  const psuma = (p, q) => limpia(Array.from({ length: Math.max(p.length, q.length) }, (_, i) => suma(p[i] || c0, q[i] || c0)));
  const pneg = (p) => p.map(neg);
  const presta = (p, q) => psuma(p, pneg(q));
  function pmul(p, q) {
    const r = Array(p.length + q.length - 1).fill(c0);
    p.forEach((a, i) => { if (!esCero(a)) q.forEach((b, j) => { r[i + j] = suma(r[i + j], mul(a, b)); }); });
    return limpia(r);
  }
  const pesc = (k, p) => limpia(p.map((a) => mul(k, a)));
  const ppot = (p, n) => { let r = cte(c1); for (let i = 0; i < n; i++) r = pmul(r, p); return r; };
  const pval = (p, x) => p.reduceRight((s, a) => suma(mul(s, x), a), c0);
  const pvalF = (p, x) => p.reduceRight((s, a) => s * x + A.qnum(a.re), 0);
  function pdiv(p, q) {
    p = limpia(p); q = limpia(q);
    const dq = grado(q);
    if (dq === -Infinity) throw new Error('División por cero');
    let r = p.slice();
    const c = Array(Math.max(1, p.length - q.length + 1)).fill(c0);
    while (grado(r) >= dq) {
      const dr = grado(r), f = div(r[dr], q[dq]);
      c[dr - dq] = f;
      r = presta(r, Array(dr - dq).fill(c0).concat(q.map((x) => mul(f, x))));
    }
    return [limpia(c), limpia(r)];
  }
  const monico = (p) => { const q = limpia(p); return nulo(q) ? q : q.map((a) => div(a, q[q.length - 1])); };
  function mcd(p, q) {
    p = limpia(p); q = limpia(q);
    while (!nulo(q)) [p, q] = [q, pdiv(p, q)[1]];
    return monico(p);
  }

  function letraDe(celdas) {
    const vistas = new Set();
    for (const c of celdas) for (const ch of String(c ?? '').replace(/sqrt|√/g, '')) if (LETRA.test(ch)) vistas.add(ch);
    if (vistas.size > 1) throw new Error(`Solo puede haber un parámetro, y aparecen ${[...vistas].join(', ')}`);
    return vistas.size ? [...vistas][0] : null;
  }
  function lee(texto, letra) {
    const orig = String(texto ?? '').trim();
    const s = orig.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*');
    if (!s) throw new Error('casilla vacía: escribe un número o una expresión con el parámetro');
    let p = 0;
    const mal = () => new Error(`«${orig}» no se entiende: escribe por ejemplo 3, −1/2, 2${letra} − 1 o ${letra}^2`);
    const ve = () => s[p];
    const empieza = (c) => c !== undefined && (/[\d.,(i]/.test(c) || c === letra);
    function expr() { let v = term(); while (ve() === '+' || ve() === '-') { const o = s[p++], t = term(); v = o === '+' ? psuma(v, t) : presta(v, t); } return v; }
    function term() {
      let v = un();
      for (;;) {
        const c = ve();
        if (c === '*') { p++; v = pmul(v, un()); }
        else if (c === '/') { p++; const t = un(); if (!constante(t) || nulo(t)) throw mal(); v = v.map((a) => div(a, t[0])); }
        else if (empieza(c)) v = pmul(v, pot());
        else return v;
      }
    }
    function un() { if (ve() === '-') { p++; return pneg(un()); } if (ve() === '+') { p++; return un(); } return pot(); }
    function pot() {
      const b = at();
      if (ve() !== '^') return b;
      p++;
      const m = /^\(?(\d+)\)?/.exec(s.slice(p));
      if (!m || +m[1] > 12) throw mal();
      p += m[0].length;
      return ppot(b, +m[1]);
    }
    function at() {
      const c = ve();
      if (c === '(') { p++; const v = expr(); if (s[p++] !== ')') throw mal(); return v; }
      if (c === letra) { p++; return [c0, c1]; }
      if (c === 'i' || c === 'j') { p++; return cte(A.cI); }
      const m = /^(\d+(?:[.,]\d*)?|[.,]\d+)/.exec(s.slice(p));
      if (!m) throw mal();
      p += m[0].length;
      return cte(A.leer(m[0]));
    }
    let v;
    try { v = expr(); } catch (e) { throw mal(); }
    if (p < s.length) throw mal();
    return v;
  }
  const leeMatriz = (filas, letra) => filas.map((f, i) => f.map((v, j) => { try { return lee(v, letra); } catch (e) { throw new Error(`Fila ${i + 1}, columna ${j + 1}: ${e.message}`); } }));

  const alto = (p) => limpia(p).slice().reverse();
  const html = (p, letra) => A.polHtml(alto(p), letra);
  const htmlP = (p, letra) => { const n = limpia(p).filter((a) => !esCero(a)).length; const h = html(p, letra); return n > 1 ? `(${h})` : h; };
  function factorHtml(p, letra) {
    const q = limpia(p);
    if (constante(q)) return A.html(q[0]);
    const r = A.raices(alto(q));
    const lc = q[q.length - 1];
    let resto = r.resto, sal = '';
    const lin = (v) => { if (esCero(v)) return letra; const [sg, t] = A.signo(neg(v)); return `(${letra} ${sg} ${t})`; };
    for (const { valor, mult } of r.exactas) sal += lin(valor) + (mult > 1 ? `<sup>${mult}</sup>` : '');
    const k = esUno(lc) ? '' : igual(lc, A.ent(-1)) ? '−' : A.htmlP(lc);
    if (resto.length > 1) {
      const rh = A.polHtml(resto.map((a) => div(a, resto[0])), letra);
      if (!sal) return A.polHtml(alto(q), letra);
      sal += `(${rh})`;
    }
    return (k + sal).replace(/^\((\w)\)/, '$1').replace(/^\(([^()]*)\)$/, '$1');
  }
  function raices(p) {
    const q = limpia(p);
    if (constante(q)) return [];
    const r = A.raices(alto(q)), out = r.exactas.filter((x) => A.esReal(x.valor)).map((x) => ({ exacta: true, valor: x.valor, mult: x.mult, num: A.qnum(x.valor.re) }));
    const resto = r.resto;
    if (resto.length === 3 && resto.every(A.esReal)) {
      const [a2, b2, c2] = resto.map((x) => x.re);
      const Dq = { n: b2.n * b2.n * a2.d * c2.d - 4n * a2.n * c2.n * b2.d * b2.d, d: b2.d * b2.d * a2.d * c2.d };
      if (Dq.n > 0n) {
        const rz = A.raizHtml(A.Q(Dq.n, Dq.d)), p0 = A.div(A.C(A.Q(-b2.n, b2.d)), A.C(A.Q(2n * a2.n, a2.d))), sq = A.qnum(A.Q(Dq.n, Dq.d)) ** 0.5 / Math.abs(A.qnum(a2) * 2);
        if (rz) {
          const k = A.div(A.C(A.Q(rz.a, rz.b)), A.C(A.Q(2n * (a2.n < 0n ? -a2.n : a2.n), a2.d))), kk = k.re;
          const coef = kk.d === 1n ? (kk.n === 1n ? '' : `${kk.n}`) : null, raiz = `√${rz.dentro}`;
          const parte = coef !== null ? `${coef}${raiz}` : `${kk.n === 1n ? '' : kk.n}${raiz}/${kk.d}`;
          const c = A.qnum(p0.re), h = (sg) => (A.esCero(p0) ? `${sg === '−' ? '−' : ''}${parte}` : `${A.html(p0)} ${sg} ${parte}`);
          out.push({ exacta: false, raiz: true, html: h('−'), num: c - sq, mult: 1 }, { exacta: false, raiz: true, html: h('+'), num: c + sq, mult: 1 });
          return out.sort((x, y) => x.num - y.num);
        }
      }
    }
    for (const z of r.aprox) if (Math.abs(z.im) < 1e-9) out.push({ exacta: false, num: z.re, mult: 1 });
    return out.sort((a, b) => a.num - b.num);
  }
  const raizHtml = (r) => (r.exacta ? A.html(r.valor) : r.html ? `${r.html} ≈ ${A.decimal(r.num, 4)}` : `≈ ${A.decimal(r.num, 5)}`);

  function det(M) {
    const n = M.length, memo = new Map();
    const d = (fila, usadas) => {
      if (fila === n) return cte(c1);
      const k = fila * 64 + usadas;
      if (memo.has(k)) return memo.get(k);
      let s = cte(c0), signo = 1;
      for (let j = 0; j < n; j++) {
        if (usadas & (1 << j)) continue;
        if (!nulo(M[fila][j])) { const t = pmul(M[fila][j], d(fila + 1, usadas | (1 << j))); s = signo > 0 ? psuma(s, t) : presta(s, t); }
        signo = -signo;
      }
      memo.set(k, s);
      return s;
    };
    return d(0, 0);
  }
  function combina(n, k) {
    const out = [], cur = [];
    const go = (i) => { if (cur.length === k) { out.push(cur.slice()); return; } for (let j = i; j < n; j++) { cur.push(j); go(j + 1); cur.pop(); } };
    go(0);
    return out;
  }
  const submatriz = (M, fs, cs) => fs.map((i) => cs.map((j) => M[i][j]));
  function rangoGenerico(M) {
    const m = M.length, n = M[0].length;
    for (let r = Math.min(m, n); r >= 1; r--) {
      let g = null, alguno = null;
      for (const fs of combina(m, r)) for (const cs of combina(n, r)) {
        const d = det(submatriz(M, fs, cs));
        if (nulo(d)) continue;
        alguno = alguno || { fs, cs, d };
        g = g ? mcd(g, d) : monico(d);
      }
      if (g) return { r, mcd: g, menor: alguno };
    }
    return { r: 0, mcd: cte(c1), menor: null };
  }
  const evaluaM = (M, x) => M.map((f) => f.map((p) => pval(p, x)));
  function rangoF(M, x) {
    const R = M.map((f) => f.map((p) => pvalF(p, x))), m = R.length, n = R[0].length, esc = Math.max(1, ...R.flat().map(Math.abs));
    let r = 0;
    for (let c = 0; c < n && r < m; c++) {
      let k = r; for (let i = r + 1; i < m; i++) if (Math.abs(R[i][c]) > Math.abs(R[k][c])) k = i;
      if (Math.abs(R[k][c]) < 1e-8 * esc) continue;
      [R[r], R[k]] = [R[k], R[r]];
      for (let i = r + 1; i < m; i++) { const f = R[i][c] / R[r][c]; for (let j = c; j < n; j++) R[i][j] -= f * R[r][j]; }
      r++;
    }
    return r;
  }
  function matHtml(M, letra, { barra = null, det: esDet = false } = {}) {
    return `<span class="mat${esDet ? ' det' : ''}"><table>${M.map((f) => `<tr>${f.map((p, j) => `<td${j === barra ? ' class="barra"' : ''}>${html(p, letra)}</td>`).join('')}</tr>`).join('')}</table></span>`;
  }
  function fraccion(n, d) {
    const g = mcd(n, d);
    let N = pdiv(n, g)[0], D = pdiv(d, g)[0];
    const lc = limpia(D)[limpia(D).length - 1];
    if (!esUno(lc)) { N = N.map((a) => div(a, lc)); D = D.map((a) => div(a, lc)); }
    return [limpia(N), limpia(D)];
  }
  function fracHtml(n, d, letra) {
    const [N, D] = fraccion(n, d);
    if (constante(D)) return html(N, letra);
    return `<span class="fr"><span>${factorHtml(N, letra)}</span><span>${factorHtml(D, letra)}</span></span>`;
  }

  return {
    letraDe, lee, leeMatriz, limpia, cte, grado, nulo, constante, psuma, presta, pmul, pneg, pesc, ppot, pval, pvalF, pdiv, mcd, monico,
    html, htmlP, factorHtml, raices, raizHtml, det, combina, submatriz, rangoGenerico, evaluaM, rangoF, matHtml, fraccion, fracHtml,
  };
})();

