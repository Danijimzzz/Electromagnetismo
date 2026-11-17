const Matrices = (() => {
  const A_ = Algebra, { html, htmlP, htmlF, matHtml } = A_;
  const OPS = {
    det: { nombre: 'Determinant', cuadrada: true, metodos: [['gauss', 'By Gauss (triangular)'], ['directo', 'Sarrus or Laplace']] },
    inversa: { nombre: 'Inverse', cuadrada: true, metodos: [['gauss', 'By Gauss-Jordan'], ['adjuntos', 'By cofactors']] },
    rango: { nombre: 'Rank' },
    subespacios: { nombre: 'Kernel, image and subspaces' },
    gauss: { nombre: 'Row echelon form (Gauss)' },
    reducida: { nombre: 'Reduced row echelon form (Gauss-Jordan)' },
    propios: { nombre: 'Eigenvalues and eigenvectors', cuadrada: true },
    jordan: { nombre: 'Jordan form', cuadrada: true },
    ortogonal: { nombre: 'Orthogonal diagonalization (symmetric)', cuadrada: true },
    adjunta: { nombre: 'Adjugate matrix (cofactors)', cuadrada: true },
    lu: { nombre: 'LU decomposition', cuadrada: true },
    traspuesta: { nombre: 'Transpose' },
    suma: { nombre: 'A + B', B: true },
    resta: { nombre: 'A − B', B: true },
    producto: { nombre: 'A · B', B: true },
    escalar: { nombre: 'k · A', k: true },
    potencia: { nombre: 'Aⁿ', cuadrada: true, n: true, metodos: [['producto', 'Multiplication'], ['diagonal', 'By diagonalization (P·Dⁿ·P⁻¹)']] },
    ecAX: { nombre: 'Equation A·X = B', cuadrada: true, B: true },
    ecXA: { nombre: 'Equation X·A = B', cuadrada: true, B: true },
  };
  const pasosGauss = (pasos, opts = {}) => pasos.map((p) => ({ t: p.ops.join(', &nbsp;'), html: matHtml(p.M, { barra: opts.barra ?? p.barra, marca: p.piv }) }));
  const dims = (M) => `${M.length}×${M[0].length}`;

  function detGauss(A) {
    const n = A.length, e = A_.escalonar(A), pasos = [{ t: 'Matrix', html: matHtml(A, { det: true }) }, ...pasosGauss(e.pasos)];
    if (e.rango < n) {
      pasos.push({ t: 'Result', html: `Row reduction leaves a row of zeros, so |A| = <b>0</b> (the matrix has no inverse).` });
      return { valor: A_.c0, pasos };
    }
    const d = A_.determinante(A), diag = e.R.map((f, i) => htmlF(f[i])).join('·');
    pasos.push({ t: 'Result', html: `Adding to a row a multiple of another does not change the determinant${e.cambios ? `, and each row swap changes its sign (${e.cambios} ${e.cambios === 1 ? 'swap' : 'swaps'})` : ''}. That of a triangular matrix is the product of the diagonal:<br>|A| = ${e.cambios % 2 ? '−' : ''}${diag} = <b>${html(d)}</b>` });
    return { valor: d, pasos };
  }
  function detDirecto(A) {
    const n = A.length, pasos = [];
    const t = (i, j) => A[i][j];
    const prod = (...xs) => xs.map(htmlF).join('·');
    if (n === 1) return { valor: A[0][0], pasos: [{ t: 'Result', html: `|A| = <b>${html(A[0][0])}</b>` }] };
    if (n === 2) {
      const d = A_.determinante(A);
      pasos.push({ t: '2×2 rule', html: `${matHtml(A, { det: true })} = a<sub>11</sub>a<sub>22</sub> − a<sub>12</sub>a<sub>21</sub> = ${prod(t(0, 0), t(1, 1))} − ${prod(t(0, 1), t(1, 0))} = <b>${html(d)}</b>` });
      return { valor: d, pasos };
    }
    if (n === 3) {
      const mas = [[[0, 0], [1, 1], [2, 2]], [[0, 1], [1, 2], [2, 0]], [[0, 2], [1, 0], [2, 1]]], men = [[[0, 2], [1, 1], [2, 0]], [[0, 0], [1, 2], [2, 1]], [[0, 1], [1, 0], [2, 2]]];
      const val = (g) => g.reduce((s, [i, j]) => A_.mul(s, t(i, j)), A_.c1);
      const vm = mas.map(val), vn = men.map(val), d = A_.resta(vm.reduce(A_.suma), vn.reduce(A_.suma));
      pasos.push({ t: 'Sarrus\' rule', html: `${matHtml(A, { det: true })} = ${mas.map((g) => prod(...g.map(([i, j]) => t(i, j)))).join(' + ')} − ${men.map((g) => prod(...g.map(([i, j]) => t(i, j)))).join(' − ')}` });
      pasos.push({ t: 'Products', html: `= (${vm.map(html).join(') + (')}) − (${vn.map(html).join(') − (')}) = <b>${html(d)}</b>` });
      return { valor: d, pasos };
    }
    let mejor = { ceros: -1 };
    for (let i = 0; i < n; i++) { const c = A[i].filter(A_.esCero).length; if (c > mejor.ceros) mejor = { ceros: c, fila: true, k: i }; }
    for (let j = 0; j < n; j++) { const c = A.filter((f) => A_.esCero(f[j])).length; if (c > mejor.ceros) mejor = { ceros: c, fila: false, k: j }; }
    const pos = [...Array(n).keys()].map((l) => (mejor.fila ? [mejor.k, l] : [l, mejor.k]));
    const terminos = pos.filter(([i, j]) => !A_.esCero(t(i, j))).map(([i, j]) => ({ i, j, a: t(i, j), m: A_.menor(A, i, j), s: (i + j) % 2 ? '−' : '+' }));
    pasos.push({ t: `Laplace expansion along ${mejor.fila ? 'row' : 'column'} ${mejor.k + 1}${mejor.ceros ? ` (it has ${mejor.ceros} ${mejor.ceros === 1 ? 'zero' : 'zeros'})` : ''}`, html: `|A| = Σ (−1)<sup>i+j</sup> a<sub>ij</sub> |A<sub>ij</sub>| = ${terminos.map((x, k) => `${k ? ` ${x.s} ` : x.s === '−' ? '−' : ''}${htmlF(x.a)}·${matHtml(x.m, { det: true })}`).join('') || '0'}` });
    let d = A_.c0;
    const vals = terminos.map((x) => { const dm = A_.determinante(x.m); const v = A_.mul(x.a, dm); d = x.s === '+' ? A_.suma(d, v) : A_.resta(d, v); return `${x.s === '−' ? '−' : '+'} ${htmlF(x.a)}·${htmlF(dm)}`; });
    pasos.push({ t: `Each ${n - 1}×${n - 1} minor${n - 1 === 3 ? ' by Sarrus' : ''}`, html: `|A| = ${vals.join(' ').replace(/^\+ /, '').replace(/^− /, '−')} = <b>${html(d)}</b>` });
    return { valor: d, pasos };
  }

  function invGauss(A) {
    const n = A.length, aug = A.map((f, i) => [...f, ...A_.identidad(n)[i]]);
    const e = A_.escalonar(aug, { reducida: true, columnas: n, barra: n });
    const pasos = [{ t: '[A | I] is written and reduced until the identity is on the left', html: matHtml(aug, { barra: n }) }, ...pasosGauss(e.pasos)];
    if (e.rango < n) { pasos.push({ t: 'Result', html: `A row of zeros remains on the left: rank(A) = ${e.rango} < ${n}, so |A| = 0 and <b>A has no inverse</b>.` }); return { valor: null, pasos }; }
    const inv = e.R.map((f) => f.slice(n));
    pasos.push({ t: 'Result: the right-hand part is the inverse', html: `A<sup>−1</sup> = ${matHtml(inv)}` });
    return { valor: inv, pasos };
  }
  function invAdjuntos(A) {
    const n = A.length, d = A_.determinante(A), pasos = [{ t: 'Determinant', html: `|A| = <b>${html(d)}</b>` }];
    if (A_.esCero(d)) { pasos.push({ t: 'Result', html: '|A| = 0, so <b>A has no inverse</b>.' }); return { valor: null, pasos }; }
    if (n === 1) { const inv = [[A_.div(A_.c1, A[0][0])]]; pasos.push({ t: 'Result', html: `A<sup>−1</sup> = ${matHtml(inv)}` }); return { valor: inv, pasos }; }
    const adj = A.map((f, i) => f.map((_, j) => A_.cofactor(A, i, j)));
    pasos.push({ t: 'Adjugate matrix: each entry is its cofactor A<sub>ij</sub> = (−1)<sup>i+j</sup>·|minor|', html: `${n <= 3 ? `For example, A<sub>11</sub> = +${matHtml(A_.menor(A, 0, 0), { det: true })} = ${html(adj[0][0])}${n > 1 ? `, A<sub>12</sub> = −${matHtml(A_.menor(A, 0, 1), { det: true })} = ${html(adj[0][1])}` : ''}.<br>` : ''}Adj(A) = ${matHtml(adj)}` });
    const adjT = A_.traspuesta(adj);
    pasos.push({ t: 'It is transposed', html: `(Adj A)<sup>t</sup> = ${matHtml(adjT)}` });
    const inv = adjT.map((f) => f.map((x) => A_.div(x, d)));
    pasos.push({ t: 'Result', html: `A<sup>−1</sup> = (1 / |A|)·(Adj A)<sup>t</sup> = (1 / ${htmlP(d)})·${matHtml(adjT)} = ${matHtml(inv)}` });
    return { valor: inv, pasos };
  }

  function propios(A) {
    const n = A.length, p = A_.caracteristico(A), pasos = [];
    const pc = n % 2 ? p.map(A_.neg) : p;
    const AL = A.map((f, i) => f.map((x, j) => (i === j ? `${html(x) === '0' ? '' : html(x) + ' '}−&nbsp;λ` : html(x))));
    pasos.push({ t: 'Characteristic polynomial', html: `|A − λI| = <span class="mat det"><table>${AL.map((f) => `<tr>${f.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</table></span> = <b>${A_.polHtml(pc)}</b>` });
    const r = A_.raices(p), vals = [];
    const fac = r.exactas.map(({ valor, mult }) => { const [s, v] = A_.signo(A_.neg(valor)); return `(λ ${s} ${v})${mult > 1 ? `<sup>${mult}</sup>` : ''}`; });
    if (r.resto.length > 1) fac.push(`(${A_.polHtml(r.resto)})`);
    if (r.exactas.length) pasos.push({ t: 'Roots of the polynomial', html: `|A − λI| = ${n % 2 ? '−' : ''}${fac.join('')} = 0` });
    const orden = (a, b) => A_.qnum(a.valor.re) - A_.qnum(b.valor.re) || A_.qnum(b.valor.im) - A_.qnum(a.valor.im);
    for (const { valor, mult } of r.exactas.slice().sort(orden)) vals.push({ valor, mult, exacto: true });
    let radicales = null, aprox = r.aprox.slice();
    if (r.resto.length === 3 && r.resto.every(A_.esReal)) {
      const [a, b, c] = r.resto.map((x) => x.re), D = A_.Q(b.n * b.n * a.d * a.d * c.d - 4n * a.n * c.n * b.d * b.d * a.d, b.d * b.d * a.d * a.d * c.d);
      const rq = A_.raizHtml(D.n < 0n ? { n: -D.n, d: D.d } : D);
      if (rq) {
        const m = A_.div(A_.C(A_.Q(-b.n, b.d)), A_.C(A_.Q(2n * a.n, a.d))).re, k = A_.div(A_.C(A_.Q(rq.a, rq.b)), A_.C(A_.Q(2n * a.n, a.d))).re;
        const kp = k.n < 0n ? { n: -k.n, d: k.d } : k, L = (m.d * kp.d) / ((x, y) => { while (y) [x, y] = [y, x % y]; return x; })(m.d, kp.d);
        const p0 = (m.n * L) / m.d, q = (kp.n * L) / kp.d, im = D.n < 0n ? ' i' : '';
        const cuerpo = (sg) => `${p0 ? String(p0).replace('-', '−') + ` ${sg} ` : sg === '−' ? '−' : ''}${q === 1n ? '' : q}√${rq.dentro}${im}`;
        const forma = (sg) => (L === 1n ? cuerpo(sg) : `(${cuerpo(sg)})/${L}`);
        radicales = { mas: forma('+'), menos: forma('−'), ambos: L === 1n ? cuerpo('±') : `(${cuerpo('±')})/${L}`, m, k: kp, dentro: rq.dentro, im };
        pasos.push({ t: 'The quadratic factor has no rational roots', html: `${A_.polHtml(r.resto)} = 0 ⇒ λ = (−b ± √(b<sup>2</sup> − 4ac)) / (2a) = <b>${radicales.ambos}</b>` });
        aprox.sort((x, y) => (D.n < 0n ? y.im - x.im : y.re - x.re));
      }
    }
    aprox.forEach((z, i) => vals.push({ valor: z, mult: 1, exacto: false, etiqueta: radicales ? (i ? radicales.menos : radicales.mas) : null }));
    if (r.resto.length > 1 && !radicales) pasos.push({ t: 'Irrational roots', html: `The roots of ${A_.polHtml(r.resto)} are computed numerically: λ ≈ ${r.aprox.map((z) => A_.decimalC(z, 6)).join(', ')}` });
    const multTxt = (m) => ({ 2: 'doble', 3: 'triple' }[m] || `multiplicidad ${m}`);
    const etq = (v) => (v.exacto ? html(v.valor) : v.etiqueta ? `${v.etiqueta} ≈ ${A_.decimalC(v.valor, 5)}` : '≈ ' + A_.decimalC(v.valor, 6));
    const lista = vals.map((v) => `${etq(v)}${v.mult > 1 ? ` (${multTxt(v.mult)})` : ''}`);
    pasos.push({ t: 'Eigenvalues', html: `λ = <b>${lista.join(', &nbsp;')}</b>` });
    const esp = [];
    for (const v of vals.filter((x) => x.exacto)) {
      const M = A_.restaM(A, A_.escalar(v.valor, A_.identidad(n))), N = A_.nucleo(M);
      esp.push({ ...v, base: N.base });
      const [s, vv] = A_.signo(A_.neg(v.valor));
      pasos.push({ t: `Eigenvectors of λ = ${html(v.valor)}`, html: `(A ${s === '+' ? '+' : '−'} ${vv.replace(/^\((.*)\)$/, '($1)')}I) x = 0: ${matHtml(M)} → ${matHtml(N.R)}<br>dim = ${N.base.length}${v.mult > 1 ? ` (algebraic multiplicity ${v.mult})` : ''}; basis: ${N.base.map((b) => A_.vecHtml(b)).join(' ')}` });
    }
    const noEx = vals.filter((x) => !x.exacto);
    if (noEx.length) {
      const Af = A.map((fl) => fl.map((x) => A_.aFloat(x)));
      for (const v of noEx) { v.vector = vectorNum(Af, v.valor); }
      let rad = '';
      if (n === 2 && radicales && A_.esRealM(A)) {
        const [[a, b], [c, d]] = A, usaB = !A_.esCero(b), e = A_.resta(A_.C(radicales.m), usaB ? a : d), fijo = html(usaB ? b : c);
        const kt = radicales.k.n === radicales.k.d ? '' : html(A_.C(radicales.k)), comp = (sg) => `${A_.esCero(e) ? (sg === '−' ? '−' : '') : `${html(e)} ${sg} `}${kt}√${radicales.dentro}${radicales.im}`;
        const vec = (sg) => (usaB ? `(${fijo}, &nbsp;${comp(sg)})` : `(${comp(sg)}, &nbsp;${fijo})`);
        noEx.forEach((v, i) => { v.vectorRad = vec(i ? '−' : '+'); });
        rad = `<br>With radicals, from the ${usaB ? 'first' : 'second'} row of (A − λI) v = 0 we get v = ${usaB ? '(b, λ − a)' : '(λ − d, c)'}: ${noEx.map((v) => `λ = ${v.etiqueta} ⇒ v = <b>${v.vectorRad}</b>`).join('; &nbsp;')}.`;
      }
      if (noEx.every((v) => v.vector)) pasos.push({ t: 'Eigenvectors of the irrational eigenvalues', html: `(A − λI) v = 0 is solved with the numerical value of each λ; the vector is given with one component equal to 1 (any multiple works):<br>${noEx.map((v) => `λ ≈ ${A_.decimalC(v.valor, 5)} ⇒ v ≈ <b>(${v.vector.map((z) => A_.decimalC(z, 4)).join('; &nbsp;')})</b>`).join('<br>')}${rad}` });
    }
    const todos = vals.every((x) => x.exacto);
    let diag, PD = null;
    if (todos) {
      diag = esp.every((x) => x.base.length === x.mult);
      if (diag) {
        const P = A_.traspuesta(esp.flatMap((x) => x.base)), D = esp.flatMap((x) => Array(x.mult).fill(x.valor)).map((x, i, arr) => arr.map((_, j) => (i === j ? x : A_.c0)));
        pasos.push({ t: 'It is diagonalizable', html: `Each eigenvalue has as many vectors as its multiplicity. With the vectors as columns, A = P D P<sup>−1</sup>:<br>P = ${matHtml(P)}, &nbsp; D = ${matHtml(D)}` });
        PD = { P, D };
      } else pasos.push({ t: 'It is not diagonalizable', html: `Some eigenvalue has fewer independent eigenvectors than its multiplicity.` });
    } else {
      diag = vals.every((x) => x.mult === 1) ? true : null;
      if (diag) pasos.push({ t: 'It is diagonalizable', html: `The ${n} eigenvalues are distinct, so it is diagonalizable${A_.esRealM(A) && vals.some((x) => !x.exacto && Math.abs(x.valor.im) > 1e-9) ? ' (over the complex numbers)' : ''}. The eigenvectors of the irrational roots appear above, with their numerical value.` });
    }
    return { valor: vals, pasos, diag, polinomio: pc, PD, esp };
  }

  function vectorNum(Af, lam) {
    const n = Af.length, cm = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }), cs = (a, b) => ({ re: a.re - b.re, im: a.im - b.im }), ab = (a) => Math.hypot(a.re, a.im);
    const cd = (a, b) => { const q = b.re * b.re + b.im * b.im; return { re: (a.re * b.re + a.im * b.im) / q, im: (a.im * b.re - a.re * b.im) / q }; };
    const M = Af.map((fl, i) => fl.map((x, j) => (i === j ? cs(x, lam) : { ...x }))), esc = Math.max(1e-300, ...Af.flat().map(ab), ab(lam)), piv = [];
    let r = 0;
    for (let c = 0; c < n && r < n; c++) {
      let k = r; for (let i = r + 1; i < n; i++) if (ab(M[i][c]) > ab(M[k][c])) k = i;
      if (ab(M[k][c]) < 1e-7 * esc) continue;
      [M[r], M[k]] = [M[k], M[r]];
      const p = M[r][c]; M[r] = M[r].map((x) => cd(x, p));
      for (let i = 0; i < n; i++) if (i !== r) { const q = M[i][c]; if (ab(q)) M[i] = M[i].map((x, j) => cs(x, cm(q, M[r][j]))); }
      piv.push(c); r++;
    }
    const libres = Array.from({ length: n }, (_, j) => j).filter((j) => !piv.includes(j));
    if (libres.length !== 1) return null;
    const v = Array.from({ length: n }, () => ({ re: 0, im: 0 })); v[libres[0]] = { re: 1, im: 0 };
    piv.forEach((c, i) => { v[c] = { re: -M[i][libres[0]].re, im: -M[i][libres[0]].im }; });
    return v.map((z) => ({ re: Math.abs(z.re) < 1e-12 ? 0 : z.re, im: Math.abs(z.im) < 1e-12 ? 0 : z.im }));
  }

  const VAR = (i, l = 'x') => `${l}<sub>${i + 1}</sub>`;
  function combinacion(cs, l = 'x') {
    const ts = cs.map((c, i) => (A_.esCero(c) ? null : (() => { const [sg, v] = A_.signo(c); return [sg, `${v === '1' ? '' : v}${VAR(i, l)}`]; })())).filter(Boolean);
    return ts.length ? ts.map(([sg, t], i) => (i ? `${sg} ${t}` : `${sg === '−' ? '−' : ''}${t}`)).join(' ') : '0';
  }
  function subespacios(A) {
    const m = A.length, n = A[0].length, N = A_.nucleo(A), e = A_.escalonar(A, { reducida: true }), rg = e.rango, pasos = [{ t: 'Matrix', html: `${matHtml(A)}, of ${dims(A)}: as a linear map it goes from ℝ<sup>${n}</sup> to ℝ<sup>${m}</sup> (or from ℂ to ℂ if it has complex entries).` }];
    pasos.push(...pasosGauss(e.pasos));
    const cp = e.pivotes.map(([, c]) => c), libres = Array.from({ length: n }, (_, j) => j).filter((j) => !cp.includes(j));
    pasos.push({ t: 'Reduced row echelon form', html: `${matHtml(e.R)}<br>Rank ${rg}: pivots in ${cp.length ? `columns ${cp.map((c) => c + 1).join(', ')}` : 'no column'}${libres.length ? `; ${libres.map((j) => VAR(j)).join(', ')} ${libres.length > 1 ? 'are free' : 'is free'}` : '; no unknown is left free'}.` });
    const filasR = e.R.slice(0, rg), nuc = N.base, par = 'tsuvw';
    const implN = filasR.map((fl) => `${combinacion(fl)} = 0`), paramN = Array.from({ length: n }, (_, i) => `${VAR(i)} = ${nuc.length ? combinacion(nuc.map((b) => b[i]), 't').replace(/t<sub>(\d)<\/sub>/g, (_, k) => (nuc.length === 1 ? 't' : par[k - 1])) : '0'}`);
    pasos.push({ t: 'Kernel (Ker A): solutions of A·x = 0', html: nuc.length
      ? `dim Ker A = n − rank(A) = ${n} − ${rg} = <b>${nuc.length}</b>.<br>Implicit equations: ${implN.length ? implN.join('; &nbsp;') : 'none (every vector satisfies them)'}.<br>Parametric equations: ${paramN.join(', &nbsp;')}.<br>Basis: ${nuc.map((b) => A_.vecHtml(b)).join(' ')}`
      : `dim Ker A = n − rank(A) = ${n} − ${rg} = <b>0</b>: only the zero vector satisfies A·x = 0 (the map is injective).` });
    const im = cp.map((c) => A.map((fl) => fl[c])), NT = A_.nucleo(A_.traspuesta(A)).base;
    const paramI = Array.from({ length: m }, (_, i) => `${VAR(i, 'y')} = ${combinacion(im.map((b) => b[i]), 't').replace(/t<sub>(\d)<\/sub>/g, (_, k) => (im.length === 1 ? 't' : par[k - 1]))}`);
    pasos.push({ t: 'Image (Im A): the subspace spanned by the columns', html: rg === 0 ? 'The matrix is zero: Im A = {0}, of dimension <b>0</b>.'
      : `dim Im A = rank(A) = <b>${rg}</b>. The columns of A with a pivot (${cp.map((c) => c + 1).join(', ')}) form a basis: ${im.map((b) => A_.vecHtml(b)).join(' ')}<br>Parametric equations: ${paramI.join(', &nbsp;')}.<br>${NT.length ? `Implicit equations (what y must satisfy for A·x = y to have a solution): ${NT.map((w) => `${combinacion(w, 'y')} = 0`).join('; &nbsp;')}.` : `Since the rank is ${m}, Im A is the whole target space: there are no implicit equations (the map is surjective).`}` });
    pasos.push({ t: 'Row space', html: rg ? `The nonzero rows of the reduced row echelon form are a basis of the subspace spanned by the rows of A (dimension ${rg}): ${filasR.map((fl) => `(${fl.map((x) => html(x)).join(', ')})`).join(', &nbsp;')}. The kernel is its orthogonal complement.` : 'The matrix is zero: there are no independent rows.' });
    pasos.push({ t: 'Rank–nullity theorem', html: `dim Ker A + dim Im A = ${nuc.length} + ${rg} = ${n}, the number of columns.` });
    return { valor: { nucleo: nuc, imagen: im, filas: filasR, implicitasImagen: NT, rango: rg, dimNucleo: nuc.length }, pasos, res: `dim Ker A = ${nuc.length}, &nbsp; dim Im A = ${rg}` };
  }

  function potDiagonal(A, n) {
    if (!Number.isInteger(n) || Math.abs(n) > 1000) throw new Error('The exponent n must be an integer between −1000 and 1000');
    const pr = propios(A);
    if (!pr.PD) throw new Error(pr.diag === false ? 'A is not diagonalizable: compute the power by multiplying' : 'The eigenvalues are not exact: compute the power by multiplying');
    const { P, D } = pr.PD, Pi = invGauss(P).valor;
    if (n < 0 && D.some((f, i) => A_.esCero(f[i]))) throw new Error('A has the eigenvalue 0, so it has no inverse or negative powers');
    const Dn = D.map((f, i) => f.map((x, j) => (i === j ? A_.potencia(x, n) : A_.c0)));
    const R = A_.producto(A_.producto(P, Dn), Pi);
    const pasos = pr.pasos.filter((p) => /Polinomio|Valores propios|diagonalizable/.test(p.t));
    pasos.push({ t: 'Why it works', html: `A = P D P<sup>−1</sup> ⇒ A<sup>n</sup> = P D P<sup>−1</sup> · P D P<sup>−1</sup> ⋯ = P D<sup>n</sup> P<sup>−1</sup>, and D<sup>n</sup> is computed by raising each diagonal entry to the power.` });
    pasos.push({ t: `D<sup>${n}</sup> y P<sup>−1</sup>`, html: `D<sup>${n}</sup> = ${matHtml(Dn)}, &nbsp; P<sup>−1</sup> = ${matHtml(Pi)}` });
    pasos.push({ t: 'Result', html: `A<sup>${n}</sup> = P·D<sup>${n}</sup>·P<sup>−1</sup> = <b>${matHtml(R)}</b>` });
    return { valor: R, pasos };
  }

  const potM = (M, k) => { let R = A_.identidad(M.length); for (let i = 0; i < k; i++) R = A_.producto(R, M); return R; };
  const columna = (M, j) => M.map((f) => f[j]);
  const rangoV = (vs) => (vs.length ? A_.escalonar(vs).rango : 0);
  function jordan(A) {
    const n = A.length, pr = propios(A), pasos = pr.pasos.filter((p) => /Polinomio|Raíces|Valores propios/.test(p.t));
    if (!pr.valor.every((v) => v.exacto)) throw new Error('The Jordan form is only computed here when the eigenvalues are exact (rational or rational complex)');
    const cols = [], bloques = [];
    for (const v of pr.valor) {
      const N = A_.restaM(A, A_.escalar(v.valor, A_.identidad(n)));
      const dims = [0];
      for (let k = 1; k <= n && dims[k - 1] < v.mult; k++) dims.push(A_.nucleo(potM(N, k)).base.length);
      const s = dims.length - 1, g = dims[1];
      pasos.push({ t: `λ = ${html(v.valor)}`, html: `Algebraic multiplicity ${v.mult} and geometric multiplicity ${g} (dim ker(A − λI)${s > 1 ? `; ${dims.slice(2).map((d, i) => `dim ker(A − λI)<sup>${i + 2}</sup> = ${d}`).join(', ')}` : ''}).${g === v.mult ? ' It has all its eigenvectors: blocks of size 1.' : ` It lacks ${v.mult - g} vectors: generalized eigenvectors are needed.`}` });
      const usados = [];
      for (let k = s; k >= 1; k--) {
        const cuantos = (dims[k] - dims[k - 1]) - (k < s ? dims[k + 1] - dims[k] : 0);
        if (cuantos <= 0) continue;
        const ker = A_.nucleo(potM(N, k)).base;
        let puestos = 0;
        for (const w of ker) {
          if (puestos >= cuantos) break;
          const cad = [w]; for (let i = 1; i < k; i++) cad.unshift(columna(A_.producto(N, cad[0].map((x) => [x])), 0));
          if (cad.some((c) => c.every(A_.esCero))) continue;
          if (rangoV([...usados, ...cad]) !== usados.length + k) continue;
          usados.push(...cad); cols.push(...cad); bloques.push({ l: v.valor, k }); puestos++;
        }
      }
    }
    if (cols.length !== n) throw new Error('I could not build the Jordan basis of this matrix');
    const P = A_.traspuesta(cols), J = A.map((_, i) => A.map((_, j) => A_.c0));
    let pos = 0;
    for (const b of bloques) { for (let i = 0; i < b.k; i++) { J[pos + i][pos + i] = b.l; if (i < b.k - 1) J[pos + i][pos + i + 1] = A_.c1; } pos += b.k; }
    if (!A_.iguales(A_.producto(A, P), A_.producto(P, J))) throw new Error('I could not verify the Jordan form of this matrix');
    pasos.push({ t: 'Jordan basis', html: `Each chain starts at an eigenvector v₁ and continues with (A − λI) v₂ = v₁, (A − λI) v₃ = v₂…, with the vectors as columns:<br>P = ${matHtml(P)}` });
    pasos.push({ t: 'Jordan form', html: `J = P<sup>−1</sup> A P = <b>${matHtml(J)}</b>${bloques.every((b) => b.k === 1) ? ' (it is diagonal: A is diagonalizable)' : ', with a 1 above the diagonal in each block of size greater than 1'}.` });
    return { valor: J, P, pasos };
  }

  function ortogonal(A) {
    const n = A.length;
    if (!A_.iguales(A, A_.traspuesta(A)) || !A_.esRealM(A)) throw new Error('Orthogonal diagonalization is for real symmetric matrices (A = Aᵗ)');
    const pr = propios(A), pasos = pr.pasos.filter((p) => /Polinomio|Raíces|Valores propios|Vectores propios/.test(p.t));
    if (!pr.valor.every((v) => v.exacto)) throw new Error('The eigenvalues are not rational: the exact orthogonal diagonalization cannot be written here');
    pasos.push({ t: 'Spectral theorem', html: 'A real symmetric matrix is always diagonalizable and its eigenvectors for distinct eigenvalues are orthogonal. Within each eigenspace, Gram-Schmidt orthogonalization is applied and then the vectors are normalized.' });
    const dot = (u, v) => u.reduce((s, x, i) => A_.suma(s, A_.mul(x, v[i])), A_.c0), cols = [];
    for (const e of pr.esp) {
      const orto = [];
      for (const v of e.base) {
        let w = v;
        for (const u of orto) w = w.map((x, i) => A_.resta(x, A_.mul(A_.div(dot(v, u), dot(u, u)), u[i])));
        orto.push(A_.limpia(w));
      }
      if (e.base.length > 1) pasos.push({ t: `Gram-Schmidt at λ = ${html(e.valor)}`, html: `u₁ = v₁, u₂ = v₂ − (v₂·u₁ / u₁·u₁) u₁ …: ${orto.map((u) => A_.vecHtml(u)).join(' ')}` });
      cols.push(...orto);
    }
    const raizTxt = (q) => { const r = A_.raizHtml(q.re); if (!r) { const n2 = q.re; const sq = (b) => { let x = BigInt(Math.round(Math.sqrt(Number(b)))); while (x * x > b) x--; while ((x + 1n) * (x + 1n) <= b) x++; return x; }; return A_.html(A_.C(A_.Q(sq(n2.n), sq(n2.d)))); } return `${r.a === 1n ? '' : r.a}√${r.dentro}${r.b === 1n ? '' : '/' + r.b}`; };
    const normas = cols.map((u) => raizTxt(dot(u, u)));
    const Qh = `<span class="mat"><table>${A.map((_, i) => `<tr>${cols.map((u, j) => `<td>${A_.esCero(u[i]) ? '0' : normas[j] === '1' ? html(u[i]) : `<span class="fr"><span>${html(u[i])}</span><span>${normas[j]}</span></span>`}</td>`).join('')}</tr>`).join('')}</table></span>`;
    const D = pr.esp.flatMap((x) => Array(x.mult).fill(x.valor)).map((x, i, arr) => arr.map((_, j) => (i === j ? x : A_.c0)));
    pasos.push({ t: 'It is normalized', html: `Norms: ${normas.map((t, j) => `‖u<sub>${j + 1}</sub>‖ = ${t}`).join(', ')}` });
    pasos.push({ t: 'Result', html: `A = Q D Q<sup>t</sup>, with Q orthogonal (Q<sup>−1</sup> = Q<sup>t</sup>):<br>Q = ${Qh}, &nbsp; D = ${matHtml(D)}` });
    return { valor: D, pasos, Qh };
  }

  function lu(A) {
    const n = A.length, U = A_.copia(A), L = A_.identidad(n), pasos = [{ t: 'Idea', html: 'A is row-reduced without swapping rows. U is the echelon matrix and L stores, below the diagonal, the multipliers of each step F<sub>i</sub> → F<sub>i</sub> − m·F<sub>j</sub>.' }];
    for (let c = 0; c < n; c++) {
      if (A_.esCero(U[c][c])) {
        if (U.slice(c + 1).every((f) => A_.esCero(f[c]))) continue;
        throw new Error(`Rows need to be swapped (pivot ${c + 1} is 0): this matrix has no LU without permuting. Try changing the order of the rows (PA = LU)`);
      }
      const ops = [];
      for (let r = c + 1; r < n; r++) {
        if (A_.esCero(U[r][c])) continue;
        const m = A_.div(U[r][c], U[c][c]);
        L[r][c] = m; U[r] = U[r].map((x, j) => A_.resta(x, A_.mul(m, U[c][j])));
        ops.push(`m<sub>${r + 1}${c + 1}</sub> = ${html(m)}: ${A_.F(r)} → ${A_.F(r)} − ${esUnoM(m) ? '' : htmlP(m) + '·'}${A_.F(c)}`);
      }
      if (ops.length) pasos.push({ t: `Column ${c + 1}`, html: `${ops.join('<br>')}<br>${matHtml(U)}` });
    }
    pasos.push({ t: 'Result', html: `A = L·U with L = ${matHtml(L)} and U = ${matHtml(U)}` });
    return { valor: { L, U }, pasos, L, U };
  }
  const esUnoM = (m) => A_.esUno(m);

  function ecuacion(A, B, lado) {
    const n = A.length;
    if (lado === 'AX' && B.length !== n) throw new Error(`In A·X = B, B must have ${n} rows (it has ${B.length})`);
    if (lado === 'XA' && B[0].length !== n) throw new Error(`In X·A = B, B must have ${n} columns (it has ${B[0].length})`);
    const pasos = [{ t: 'X is solved for', html: lado === 'AX' ? 'If A has an inverse, multiply by A<sup>−1</sup> <b>on the left</b>: A<sup>−1</sup>·A·X = A<sup>−1</sup>·B ⇒ X = A<sup>−1</sup>·B' : 'If A has an inverse, multiply by A<sup>−1</sup> <b>on the right</b>: X·A·A<sup>−1</sup> = B·A<sup>−1</sup> ⇒ X = B·A<sup>−1</sup>' }];
    const d = A_.determinante(A);
    pasos.push({ t: 'Determinant of A', html: `|A| = ${html(d)}${A_.esCero(d) ? ': A has no inverse' : ' ≠ 0: A has an inverse'}` });
    if (A_.esCero(d)) { pasos.push({ t: 'No inverse', html: 'With |A| = 0 the equation has no unique solution: it has either none or infinitely many (it is solved as a system column by column).' }); return { valor: null, pasos, res: 'A has no inverse: X is not unique (or does not exist)' }; }
    const inv = invGauss(A).valor;
    pasos.push({ t: 'Inverse of A', html: `A<sup>−1</sup> = ${matHtml(inv)}` });
    const X = lado === 'AX' ? A_.producto(inv, B) : A_.producto(B, inv);
    pasos.push({ t: 'Result', html: `X = ${lado === 'AX' ? `A<sup>−1</sup>·B = ${matHtml(inv)}·${matHtml(B)}` : `B·A<sup>−1</sup> = ${matHtml(B)}·${matHtml(inv)}`} = <b>${matHtml(X)}</b>` });
    pasos.push({ t: 'Check', html: `${lado === 'AX' ? 'A·X' : 'X·A'} = ${matHtml(lado === 'AX' ? A_.producto(A, X) : A_.producto(X, A))} = B ✓<br>For A·X + C = D the same is done with B = D − C.` });
    return { valor: X, pasos, res: matHtml(X) };
  }

  const P_ = typeof Parametro !== 'undefined' ? Parametro : typeof require !== 'undefined' ? require('../matematicas/parametro.js') : null;
  const valoresTxt = (rs) => rs.map(P_.raizHtml).join(', ');
  function resolverParam(sc, op, O, letra) {
    const sinParam = { gauss: 'escalonar', reducida: 'the reduced row echelon form', propios: 'the eigenvalues' };
    if (sinParam[op]) throw new Error(`With the parameter ${letra} you can compute the determinant, the rank, the inverse and the operations, but not ${sinParam[op]}: give ${letra} a value`);
    const A = P_.leeMatriz(sc.A, letra), mh = (M, o) => P_.matHtml(M, letra, o), ph = (q) => P_.html(q, letra), fh = (q) => P_.factorHtml(q, letra);
    if (!A.length || !A[0].length) throw new Error('The matrix is empty');
    if (O.cuadrada && A.length !== A[0].length) throw new Error(`${O.nombre}: the matrix must be square (it is ${dims(A)})`);
    const pasos = [{ t: 'Matrix with the parameter' + letra, html: `A = ${mh(A)}` }];
    let res, valor = null, discusion = null;
    const raicesDe = (d) => P_.raices(d).filter((r, i, xs) => !xs.slice(0, i).some((q) => Math.abs(q.num - r.num) < 1e-9));
    if (op === 'det' || op === 'inversa') {
      const d = P_.det(A), rs = raicesDe(d);
      pasos.push({ t: 'Determinant', html: `|A| = ${mh(A, { det: true })} = ${ph(d)}${P_.grado(d) >= 2 && fh(d) !== ph(d) ? ` = <b>${fh(d)}</b>` : ''}` });
      if (P_.constante(d)) pasos.push({ t: 'It does not depend on' + letra, html: `|A| = ${ph(d)} has the same value for any ${letra}.` });
      else pasos.push({ t: `When is |A| = 0?`, html: rs.length ? `${ph(d)} = 0 &ensp;⇔&ensp; ${letra} = ${valoresTxt(rs)}` : `${ph(d)} is not zero for any real ${letra}.` });
      if (op === 'det') { res = `|A| = ${fh(d)}`; valor = d; discusion = rs; }
      else {
        const n = A.length;
        if (P_.nulo(d)) { res = `A has no inverse for any ${letra} (|A| = 0 always)`; pasos.push({ t: 'Result', html: res }); }
        else {
          pasos.push({ t: 'When it has an inverse', html: rs.length ? `A has an inverse if and only if |A| ≠ 0: <b>for ${letra} ≠ ${valoresTxt(rs)}</b>. For ${rs.length > 1 ? 'those values' : 'that value'} it has no inverse.` : `|A| is never zero, so A has an inverse for every ${letra}.` });
          if (n > 4) pasos.push({ t: 'The inverse', html: `For ${n}×${n} the inverse with ${letra} is too long: give ${letra} a value to compute it.` });
          else {
            const cof = (i, j) => { const m = A.filter((_, r) => r !== i).map((f) => f.filter((_, c) => c !== j)); const v = n === 1 ? P_.cte(A_.c1) : P_.det(m); return (i + j) % 2 ? P_.pneg(v) : v; };
            const adj = A.map((f, i) => f.map((_, j) => cof(i, j))), adjT = adj[0].map((_, j) => adj.map((f) => f[j]));
            pasos.push({ t: 'Adjugate and transpose', html: `Each entry is its cofactor (−1)<sup>i+j</sup>·|minor|: (Adj A)<sup>t</sup> = ${mh(adjT)}` });
            const inv = `<span class="mat"><table>${adjT.map((f) => `<tr>${f.map((q) => `<td>${P_.fracHtml(q, d, letra)}</td>`).join('')}</tr>`).join('')}</table></span>`;
            pasos.push({ t: 'Result', html: `A<sup>−1</sup> = (1 / |A|)·(Adj A)<sup>t</sup> = ${inv}${rs.length ? `, for ${letra} ≠ ${valoresTxt(rs)}` : ''}` });
            res = `A<sup>−1</sup> = ${inv}`;
          }
          if (!res) res = rs.length ? `A has an inverse for ${letra} ≠ ${valoresTxt(rs)}` : `A has an inverse for every ${letra}`;
          discusion = rs;
        }
      }
    } else if (op === 'rango') {
      const g = P_.rangoGenerico(A), rs = raicesDe(g.mcd), m = A.length, n = A[0].length;
      if (g.r === 0) { res = 'rank(A) = 0'; pasos.push({ t: 'Result', html: 'All entries are 0: rank(A) = 0' }); }
      else {
        if (g.menor) pasos.push({ t: `A minor of order ${g.r}`, html: `With rows ${g.menor.fs.map((i) => i + 1).join(', ')} and columns ${g.menor.cs.map((j) => j + 1).join(', ')}: ${mh(P_.submatriz(A, g.menor.fs, g.menor.cs), { det: true })} = ${fh(g.menor.d)}${g.r < Math.min(m, n) ? `. All the minors of order ${g.r + 1} are 0 for any ${letra}, so the rank never exceeds ${g.r}` : ''}.` });
        const casos = rs.map((r) => {
          const rg = r.exacta ? A_.escalonar(P_.evaluaM(A, r.valor)).rango : P_.rangoF(A, r.num);
          return { r, rg };
        });
        pasos.push({ t: rs.length ? `When do all the minors of order ${g.r} vanish?` : 'Discussion', html: rs.length ? `All the minors of order ${g.r} vanish at once only if ${letra} = ${valoresTxt(rs)} (the common roots, which are those of their greatest common divisor ${fh(g.mcd)}). For each value the matrix is substituted and row-reduced:<br>${casos.map((c) => `${letra} = ${P_.raizHtml(c.r)}: rank(A) = <b>${c.rg}</b>`).join('<br>')}` : `There is a minor of order ${g.r} that is not zero for any ${letra}: rank(A) = ${g.r} always.` });
        res = casos.length ? `If ${letra} ≠ ${valoresTxt(rs)}: rank(A) = ${g.r}${casos.map((c) => `<br>If ${letra} = ${P_.raizHtml(c.r)}: rank(A) = ${c.rg}`).join('')}` : `rank(A) = ${g.r} for every ${letra}`;
        valor = { r: g.r, casos: casos.map((c) => ({ valor: c.r.num, rango: c.rg })) };
      }
    } else {
      const B = O.B ? (() => { try { return P_.leeMatriz(sc.B, letra); } catch (e) { throw new Error('Matrix B ·' + e.message); } })() : null;
      const prod = (X, Y) => X.map((f) => Y[0].map((_, j) => f.reduce((s, x, k) => P_.psuma(s, P_.pmul(x, Y[k][j])), P_.cte(A_.c0))));
      let R;
      if (op === 'traspuesta') R = A[0].map((_, j) => A.map((f) => f[j]));
      else if (op === 'suma' || op === 'resta') {
        if (A.length !== B.length || A[0].length !== B[0].length) throw new Error(`To ${op === 'suma' ? 'add' : 'subtract'}, A and B must have the same size (A is ${dims(A)} and B is ${dims(B)})`);
        R = A.map((f, i) => f.map((x, j) => (op === 'suma' ? P_.psuma : P_.presta)(x, B[i][j])));
        pasos.push({ t: 'B', html: `B = ${mh(B)}` });
      } else if (op === 'producto') {
        if (A[0].length !== B.length) throw new Error(`To multiply A·B, the columns of A (${A[0].length}) must be as many as the rows of B (${B.length})`);
        R = prod(A, B); pasos.push({ t: 'B', html: `B = ${mh(B)}` });
      } else if (op === 'escalar') { const k = P_.lee(sc.k, letra); R = A.map((f) => f.map((x) => P_.pmul(k, x))); }
      else if (op === 'potencia') {
        const n = Number(String(sc.n).trim().replace('−', '-'));
        if (!Number.isInteger(n) || n < 0 || n > 10) throw new Error(`With the parameter ${letra}, the exponent n must be an integer between 0 and 10`);
        R = A.map((f, i) => f.map((_, j) => P_.cte(i === j ? A_.c1 : A_.c0)));
        for (let k = 1; k <= n; k++) { R = prod(R, A); if (k > 1 && n <= 4) pasos.push({ t: `A<sup>${k}</sup>`, html: mh(R) }); }
      }
      if (!R) throw new Error(`With a letter (${letra}) in the cells this operation cannot be computed: write numbers in all of them`);
      pasos.push({ t: 'Result', html: mh(R) });
      res = mh(R); valor = R;
    }
    return { op, metodo: null, letra, A: sc.A, valor, discusion, res, pasos };
  }

  const EX = typeof Expresion !== 'undefined' ? Expresion : typeof require !== 'undefined' ? require('../matematicas/expresion.js') : null;
  const FLEX = /sqrt|√|π|pi|ln\(|log\(|sen\(|cos\(|tg\(|exp\(|abs\(|e\^/i;
  function casilla(c, leidos) {
    const t = String(c ?? '').trim();
    if (!EX || !FLEX.test(t)) return c;
    let z; try { z = EX.complejo(t.replace(/[−–]/g, '-').replace(/[·×]/g, '*'), 'The cell').z; } catch (e) { return c; }
    const q = (v) => { const fr = EX.fraccion(v, 10000); return fr && Math.abs(fr[0] / fr[1] - v) < 1e-12 ? fr : null; }, a = q(z.re), b = q(z.im);
    const dec = A_.decimalC(z, 6);
    if (!a || !b) throw new Error(`“${t}” equals ${dec.replace(/<[^>]+>/g, '')}, which is not an exact fraction, and here exact fractions are used. If an approximate value is fine, write it with decimals`);
    const fr = ([n, d]) => (d === 1 ? `${n}` : `${n}/${d}`), txt = b[0] === 0 ? fr(a) : `${a[0] === 0 ? '' : fr(a)}${b[0] < 0 ? '-' : a[0] === 0 ? '' : '+'}${fr([Math.abs(b[0]), b[1]])}i`;
    leidos.push(`«${t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}» = ${html(A_.leer(txt))}`);
    return txt;
  }
  function resolver(sc0) {
    const leidos = [], mat = (M) => (Array.isArray(M) ? M.map((f) => (Array.isArray(f) ? f.map((c) => casilla(c, leidos)) : f)) : M);
    const r = resolver0({ ...sc0, A: mat(sc0.A), B: mat(sc0.B), k: sc0.k === undefined ? sc0.k : casilla(sc0.k, leidos) });
    if (leidos.length && r.pasos) { r.pasos.unshift({ t: 'Values read', html: `${leidos.join(', &nbsp;')}. Roots and logarithms are taken at their principal value.` }); r.leidos = leidos.length; }
    return r;
  }
  function resolver0(sc) {
    const op = OPS[sc.op] ? sc.op : 'det', O = OPS[op];
    const letra = P_ ? P_.letraDe([...(sc.A || []).flat(), ...(O.B ? (sc.B || []).flat() : []), ...(O.k ? [sc.k] : [])]) : null;
    if (letra) return resolverParam(sc, op, O, letra);
    const A = A_.leerMatriz(sc.A);
    if (!A.length || !A[0].length) throw new Error('The matrix is empty');
    if (O.cuadrada && A.length !== A[0].length) throw new Error(`${O.nombre}: the matrix must be square (it is ${dims(A)})`);
    let B = null;
    if (O.B) B = (() => { try { return A_.leerMatriz(sc.B); } catch (e) { throw new Error('Matrix B ·' + e.message); } })();
    const metodo = O.metodos ? (O.metodos.some(([k]) => k === sc.metodo) ? sc.metodo : O.metodos[0][0]) : null;
    let r;
    switch (op) {
      case 'det': r = metodo === 'directo' ? detDirecto(A) : detGauss(A); r.res = `|A| = ${html(r.valor)}`; break;
      case 'inversa': r = metodo === 'adjuntos' ? invAdjuntos(A) : invGauss(A); r.res = r.valor ? `A<sup>−1</sup> = ${matHtml(r.valor)}` : 'A has no inverse (|A| = 0)'; break;
      case 'rango': case 'gauss': case 'reducida': {
        const e = A_.escalonar(A, { reducida: op === 'reducida' });
        r = { valor: op === 'rango' ? e.rango : e.R, pasos: [{ t: 'Matrix', html: matHtml(A) }, ...pasosGauss(e.pasos)] };
        if (!e.pasos.length) r.pasos.push({ t: 'It is already in echelon form', html: 'No operation is needed.' });
        r.pasos.push({ t: 'Result', html: op === 'rango' ? `${e.rango} ${e.rango === 1 ? 'nonzero row' : 'nonzero rows'} remain (the pivots are in columns ${e.pivotes.map(([, c]) => c + 1).join(', ') || '—'}): rank(A) = <b>${e.rango}</b>` : `${matHtml(e.R)}, with rank ${e.rango}` });
        r.res = op === 'rango' ? `rank(A) = ${e.rango}` : matHtml(e.R);
        break;
      }
      case 'subespacios': r = subespacios(A); break;
      case 'jordan': r = jordan(A); r.res = `J = ${matHtml(r.valor)}`; break;
      case 'ortogonal': r = ortogonal(A); r.res = `Q = ${r.Qh}, &nbsp; D = ${matHtml(r.valor)}`; break;
      case 'lu': r = lu(A); r.res = `L = ${matHtml(r.L)}, &nbsp; U = ${matHtml(r.U)}`; break;
      case 'adjunta': {
        const n = A.length, adj = n === 1 ? [[A_.c1]] : A.map((f, i) => f.map((_, j) => A_.cofactor(A, i, j))), pasos = [{ t: 'Matrix', html: matHtml(A) }];
        if (n > 1) pasos.push({ t: 'Cofactors', html: `A<sub>ij</sub> = (−1)<sup>i+j</sup>·|M<sub>ij</sub>|, with M<sub>ij</sub> the matrix without row i and column j.${n <= 3 ? '<br>' + adj.map((f, i) => f.map((x, j) => `A<sub>${i + 1}${j + 1}</sub> = ${(i + j) % 2 ? '−' : '+'}${matHtml(A_.menor(A, i, j), { det: true })} = ${html(x)}`).join('<br>')).join('<br>') : ''}` });
        pasos.push({ t: 'Adjugate matrix', html: `Adj(A) = ${matHtml(adj)}` }, { t: 'Transpose of the adjugate', html: `(Adj A)<sup>t</sup> = ${matHtml(A_.traspuesta(adj))}. It satisfies A·(Adj A)<sup>t</sup> = |A|·I, with |A| = ${html(A_.determinante(A))}.` });
        r = { valor: adj, pasos, res: `Adj(A) = ${matHtml(adj)}` }; break;
      }
      case 'ecAX': case 'ecXA': r = ecuacion(A, B, op === 'ecAX' ? 'AX' : 'XA'); break;
      case 'propios': r = propios(A); r.res = `λ = ${r.valor.map((v) => (v.exacto ? html(v.valor) : v.etiqueta || '≈ ' + A_.decimalC(v.valor, 5))).join(', &nbsp;')}`; break;
      case 'traspuesta': { const T = A_.traspuesta(A); r = { valor: T, pasos: [{ t: 'The rows become columns', html: `A<sup>t</sup> = ${matHtml(T)} (from ${dims(A)} to ${dims(T)})` }] }; r.res = matHtml(T); break; }
      case 'suma': case 'resta': {
        if (A.length !== B.length || A[0].length !== B[0].length) throw new Error(`To ${op === 'suma' ? 'add' : 'subtract'}, A and B must have the same size (A is ${dims(A)} and B is ${dims(B)})`);
        const S = op === 'suma' ? A_.sumaM(A, B) : A_.restaM(A, B);
        r = { valor: S, pasos: [{ t: 'Entry by entry', html: `${matHtml(A)} ${op === 'suma' ? '+' : '−'} ${matHtml(B)} = ${matHtml(S)}` }] }; r.res = matHtml(S); break;
      }
      case 'producto': {
        if (A[0].length !== B.length) throw new Error(`To multiply A·B, the columns of A (${A[0].length}) must be as many as the rows of B (${B.length})`);
        const P = A_.producto(A, B), pasos = [{ t: `Size: (${dims(A)})·(${dims(B)}) = ${dims(P)}`, html: `Each entry c<sub>ij</sub> is row i of A times column j of B.` }];
        if (P.length * P[0].length <= 16) pasos.push({ t: 'Entries', html: P.map((f, i) => f.map((x, j) => `c<sub>${i + 1}${j + 1}</sub> = ${A[i].map((a, k) => `${htmlF(a)}·${htmlF(B[k][j])}`).join(' + ')} = ${html(x)}`).join('<br>')).join('<br>') });
        pasos.push({ t: 'Result', html: `A·B = ${matHtml(P)}` });
        r = { valor: P, pasos }; r.res = matHtml(P); break;
      }
      case 'escalar': {
        let k; try { k = A_.leer(sc.k); } catch (e) { throw new Error('k · ' + e.message); }
        const S = A_.escalar(k, A); r = { valor: S, pasos: [{ t: 'Each entry is multiplied by k', html: `${htmlP(k)}·${matHtml(A)} = ${matHtml(S)}` }] }; r.res = matHtml(S); break;
      }
      case 'potencia': {
        const n = Number(String(sc.n).trim().replace('−', '-'));
        if (metodo === 'diagonal') { r = potDiagonal(A, n); r.res = matHtml(r.valor); break; }
        if (!Number.isInteger(n) || Math.abs(n) > 50) throw new Error('The exponent n must be an integer between −50 and 50 (for more, use diagonalization)');
        const pasos = [];
        let base = A;
        if (n < 0) { const inv = invGauss(A); if (!inv.valor) throw new Error('A has no inverse, so it cannot be raised to a negative exponent'); base = inv.valor; pasos.push({ t: 'Negative exponent', html: `A<sup>${n}</sup> = (A<sup>−1</sup>)<sup>${-n}</sup>, con A<sup>−1</sup> = ${matHtml(base)}` }); }
        let P = A_.identidad(A.length);
        for (let k = 1; k <= Math.abs(n); k++) { P = A_.producto(P, base); if (Math.abs(n) <= 5 && k > 1) pasos.push({ t: `A<sup>${n < 0 ? -k : k}</sup> = A<sup>${n < 0 ? -(k - 1) : k - 1}</sup>·A${n < 0 ? '<sup>−1</sup>' : ''}`, html: matHtml(P) }); }
        if (n === 0) pasos.push({ t: 'Exponent 0', html: `A<sup>0</sup> = I = ${matHtml(P)}` });
        else pasos.push({ t: 'Result', html: `A<sup>${n}</sup> = ${matHtml(P)}` });
        r = { valor: P, pasos }; r.res = matHtml(P); break;
      }
    }
    return { op, metodo, A, B, ...r };
  }

  const M = (...filas) => filas.map((f) => f.split(' '));
  const ejemplos = [
    { clave: 'param-rango', nombre: 'Rank according to the parameter k', sc: { op: 'rango', A: M('1 1 k', '1 k 1', 'k 1 1') } },
    { clave: 'param-inversa', nombre: 'Inverse according to the value of a', sc: { op: 'inversa', metodo: 'adjuntos', A: M('1 0 -1', '0 a 3', '4 1 -a') } },
    { clave: 'jordan', nombre: '3×3 Jordan form', sc: { op: 'jordan', A: M('2 1 0', '0 2 0', '0 0 3') } },
    { clave: 'ortogonal', nombre: 'Orthogonal diagonalization', sc: { op: 'ortogonal', A: M('2 1 1', '1 2 1', '1 1 2') } },
    { clave: 'ecuacion', nombre: 'Matrix equation A·X = B', sc: { op: 'ecAX', A: M('1 2', '3 4'), B: M('5 6', '7 8') } },
    { clave: 'lu', nombre: 'LU decomposition', sc: { op: 'lu', A: M('2 1 1', '4 3 3', '8 7 9') } },
    { clave: 'potencia-diag', nombre: 'A¹⁰ by diagonalization', sc: { op: 'potencia', metodo: 'diagonal', A: M('4 1', '2 3'), n: '10' } },
    { clave: 'det3', nombre: '3×3 determinant by Sarrus', sc: { op: 'det', metodo: 'directo', A: M('2 1 3', '0 -1 4', '1 2 5') } },
    { clave: 'det4', nombre: '4×4 determinant by Laplace', sc: { op: 'det', metodo: 'directo', A: M('1 0 2 -1', '3 0 0 5', '2 1 4 -3', '1 0 5 0') } },
    { clave: 'det-gauss', nombre: 'Determinant by Gauss', sc: { op: 'det', metodo: 'gauss', A: M('2 4 -2', '1 3 1', '3 1 2') } },
    { clave: 'inv3', nombre: '3×3 inverse by Gauss-Jordan', sc: { op: 'inversa', metodo: 'gauss', A: M('1 2 3', '0 1 4', '5 6 0') } },
    { clave: 'inv-adj', nombre: 'Inverse by cofactors', sc: { op: 'inversa', metodo: 'adjuntos', A: M('2 0 1', '1 1 0', '0 1 3') } },
    { clave: 'inv-complejos', nombre: 'Inverse of a complex matrix', sc: { op: 'inversa', metodo: 'gauss', A: M('1 i', '-i 2') } },
    { clave: 'rango', nombre: 'Rank of a 3×4 matrix', sc: { op: 'rango', A: M('1 2 -1 3', '2 4 1 0', '3 6 0 3') } },
    { clave: 'subespacios', nombre: 'Kernel and image of a 3×4 matrix', sc: { op: 'subespacios', A: M('1 2 -1 3', '2 4 1 0', '3 6 0 3') } },
    { clave: 'propios-raiz', nombre: 'Eigenvectors with radicals (2×2)', sc: { op: 'propios', A: M('1 1', '1 0') } },
    { clave: 'propios-num', nombre: 'Numerical eigenvectors (3×3)', sc: { op: 'propios', A: M('1 2 0', '2 1 1', '0 1 1') } },
    { clave: 'reducida', nombre: 'Reduced row echelon form', sc: { op: 'reducida', A: M('2 4 6 8', '1 3 5 7', '1 1 1 2') } },
    { clave: 'propios2', nombre: 'Eigenvalues and eigenvectors 2×2', sc: { op: 'propios', A: M('4 1', '2 3') } },
    { clave: 'diagonalizar', nombre: 'Diagonalize a 3×3 matrix', sc: { op: 'propios', A: M('2 0 0', '0 3 4', '0 4 -3') } },
    { clave: 'rotacion', nombre: 'Complex eigenvalues (rotation)', sc: { op: 'propios', A: M('0 -1', '1 0') } },
    { clave: 'producto', nombre: 'Matrix product', sc: { op: 'producto', A: M('1 2 0', '-1 3 2'), B: M('2 1', '0 -1', '4 3') } },
    { clave: 'potencia', nombre: 'Matrix power', sc: { op: 'potencia', A: M('1 1', '0 1'), n: '5' } },
  ];

  return { OPS, resolver, ejemplos };
})();

