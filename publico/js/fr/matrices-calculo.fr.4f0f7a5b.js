const Matrices = (() => {
  const A_ = Algebra, { html, htmlP, htmlF, matHtml } = A_;
  const OPS = {
    det: { nombre: 'Déterminant', cuadrada: true, metodos: [['gauss', 'Par Gauss (triangulaire)'], ['directo', 'Sarrus ou Laplace']] },
    inversa: { nombre: 'Inverse', cuadrada: true, metodos: [['gauss', 'Par Gauss-Jordan'], ['adjuntos', 'Par les cofacteurs']] },
    rango: { nombre: 'Rang' },
    subespacios: { nombre: 'Noyau, image et sous-espaces' },
    gauss: { nombre: 'Échelonner (Gauss)' },
    reducida: { nombre: 'Forme échelonnée réduite (Gauss-Jordan)' },
    propios: { nombre: 'Valeurs et vecteurs propres', cuadrada: true },
    jordan: { nombre: 'Forme de Jordan', cuadrada: true },
    ortogonal: { nombre: 'Diagonalisation orthogonale (symétrique)', cuadrada: true },
    adjunta: { nombre: 'Matrice adjointe (cofacteurs)', cuadrada: true },
    lu: { nombre: 'Décomposition LU', cuadrada: true },
    traspuesta: { nombre: 'Transposée' },
    suma: { nombre: 'A + B', B: true },
    resta: { nombre: 'A − B', B: true },
    producto: { nombre: 'A · B', B: true },
    escalar: { nombre: 'k · A', k: true },
    potencia: { nombre: 'Aⁿ', cuadrada: true, n: true, metodos: [['producto', 'Multiplication'], ['diagonal', 'Par diagonalisation (P·Dⁿ·P⁻¹)']] },
    ecAX: { nombre: 'Équation A·X = B', cuadrada: true, B: true },
    ecXA: { nombre: 'Équation X·A = B', cuadrada: true, B: true },
  };
  const pasosGauss = (pasos, opts = {}) => pasos.map((p) => ({ t: p.ops.join(', &nbsp;'), html: matHtml(p.M, { barra: opts.barra ?? p.barra, marca: p.piv }) }));
  const dims = (M) => `${M.length}×${M[0].length}`;

  function detGauss(A) {
    const n = A.length, e = A_.escalonar(A), pasos = [{ t: 'Matrice', html: matHtml(A, { det: true }) }, ...pasosGauss(e.pasos)];
    if (e.rango < n) {
      pasos.push({ t: 'Résultat', html: `En échelonnant, il reste une ligne de zéros, donc |A| = <b>0</b> (la matrice n’est pas inversible).` });
      return { valor: A_.c0, pasos };
    }
    const d = A_.determinante(A), diag = e.R.map((f, i) => htmlF(f[i])).join('·');
    pasos.push({ t: 'Résultat', html: `Ajouter à une ligne un multiple d’une autre ne change pas le déterminant${e.cambios ? `, et chaque échange de lignes en change le signe (${e.cambios} ${e.cambios === 1 ? 'échange' : 'échanges'})` : ''}. Celui d’une matrice triangulaire est le produit de la diagonale :<br>|A| = ${e.cambios % 2 ? '−' : ''}${diag} = <b>${html(d)}</b>` });
    return { valor: d, pasos };
  }
  function detDirecto(A) {
    const n = A.length, pasos = [];
    const t = (i, j) => A[i][j];
    const prod = (...xs) => xs.map(htmlF).join('·');
    if (n === 1) return { valor: A[0][0], pasos: [{ t: 'Résultat', html: `|A| = <b>${html(A[0][0])}</b>` }] };
    if (n === 2) {
      const d = A_.determinante(A);
      pasos.push({ t: 'Règle du 2×2', html: `${matHtml(A, { det: true })} = a<sub>11</sub>a<sub>22</sub> − a<sub>12</sub>a<sub>21</sub> = ${prod(t(0, 0), t(1, 1))} − ${prod(t(0, 1), t(1, 0))} = <b>${html(d)}</b>` });
      return { valor: d, pasos };
    }
    if (n === 3) {
      const mas = [[[0, 0], [1, 1], [2, 2]], [[0, 1], [1, 2], [2, 0]], [[0, 2], [1, 0], [2, 1]]], men = [[[0, 2], [1, 1], [2, 0]], [[0, 0], [1, 2], [2, 1]], [[0, 1], [1, 0], [2, 2]]];
      const val = (g) => g.reduce((s, [i, j]) => A_.mul(s, t(i, j)), A_.c1);
      const vm = mas.map(val), vn = men.map(val), d = A_.resta(vm.reduce(A_.suma), vn.reduce(A_.suma));
      pasos.push({ t: 'Règle de Sarrus', html: `${matHtml(A, { det: true })} = ${mas.map((g) => prod(...g.map(([i, j]) => t(i, j)))).join(' + ')} − ${men.map((g) => prod(...g.map(([i, j]) => t(i, j)))).join(' − ')}` });
      pasos.push({ t: 'Produits', html: `= (${vm.map(html).join(') + (')}) − (${vn.map(html).join(') − (')}) = <b>${html(d)}</b>` });
      return { valor: d, pasos };
    }
    let mejor = { ceros: -1 };
    for (let i = 0; i < n; i++) { const c = A[i].filter(A_.esCero).length; if (c > mejor.ceros) mejor = { ceros: c, fila: true, k: i }; }
    for (let j = 0; j < n; j++) { const c = A.filter((f) => A_.esCero(f[j])).length; if (c > mejor.ceros) mejor = { ceros: c, fila: false, k: j }; }
    const pos = [...Array(n).keys()].map((l) => (mejor.fila ? [mejor.k, l] : [l, mejor.k]));
    const terminos = pos.filter(([i, j]) => !A_.esCero(t(i, j))).map(([i, j]) => ({ i, j, a: t(i, j), m: A_.menor(A, i, j), s: (i + j) % 2 ? '−' : '+' }));
    pasos.push({ t: `Développement de Laplace selon la ${mejor.fila ? 'ligne' : 'colonne'} ${mejor.k + 1}${mejor.ceros ? ` (elle contient ${mejor.ceros} ${mejor.ceros === 1 ? 'zéro' : 'zéros'})` : ''}`, html: `|A| = Σ (−1)<sup>i+j</sup> a<sub>ij</sub> |A<sub>ij</sub>| = ${terminos.map((x, k) => `${k ? ` ${x.s} ` : x.s === '−' ? '−' : ''}${htmlF(x.a)}·${matHtml(x.m, { det: true })}`).join('') || '0'}` });
    let d = A_.c0;
    const vals = terminos.map((x) => { const dm = A_.determinante(x.m); const v = A_.mul(x.a, dm); d = x.s === '+' ? A_.suma(d, v) : A_.resta(d, v); return `${x.s === '−' ? '−' : '+'} ${htmlF(x.a)}·${htmlF(dm)}`; });
    pasos.push({ t: `Chaque mineur de ${n - 1}×${n - 1}${n - 1 === 3 ? ' par Sarrus' : ''}`, html: `|A| = ${vals.join(' ').replace(/^\+ /, '').replace(/^− /, '−')} = <b>${html(d)}</b>` });
    return { valor: d, pasos };
  }

  function invGauss(A) {
    const n = A.length, aug = A.map((f, i) => [...f, ...A_.identidad(n)[i]]);
    const e = A_.escalonar(aug, { reducida: true, columnas: n, barra: n });
    const pasos = [{ t: 'On écrit [A | I] et on réduit jusqu’à obtenir l’identité à gauche', html: matHtml(aug, { barra: n }) }, ...pasosGauss(e.pasos)];
    if (e.rango < n) { pasos.push({ t: 'Résultat', html: `À gauche, il reste une ligne de zéros : rg(A) = ${e.rango} < ${n}, donc |A| = 0 et <b>A n’est pas inversible</b>.` }); return { valor: null, pasos }; }
    const inv = e.R.map((f) => f.slice(n));
    pasos.push({ t: 'Résultat : la partie droite est l’inverse', html: `A<sup>−1</sup> = ${matHtml(inv)}` });
    return { valor: inv, pasos };
  }
  function invAdjuntos(A) {
    const n = A.length, d = A_.determinante(A), pasos = [{ t: 'Déterminant', html: `|A| = <b>${html(d)}</b>` }];
    if (A_.esCero(d)) { pasos.push({ t: 'Résultat', html: '|A| = 0, donc <b>A n’est pas inversible</b>.' }); return { valor: null, pasos }; }
    if (n === 1) { const inv = [[A_.div(A_.c1, A[0][0])]]; pasos.push({ t: 'Résultat', html: `A<sup>−1</sup> = ${matHtml(inv)}` }); return { valor: inv, pasos }; }
    const adj = A.map((f, i) => f.map((_, j) => A_.cofactor(A, i, j)));
    pasos.push({ t: 'Matrice adjointe : chaque élément est son cofacteur A<sub>ij</sub> = (−1)<sup>i+j</sup>·|mineur|', html: `${n <= 3 ? `Par exemple, A<sub>11</sub> = +${matHtml(A_.menor(A, 0, 0), { det: true })} = ${html(adj[0][0])}${n > 1 ? `, A<sub>12</sub> = −${matHtml(A_.menor(A, 0, 1), { det: true })} = ${html(adj[0][1])}` : ''}.<br>` : ''}Adj(A) = ${matHtml(adj)}` });
    const adjT = A_.traspuesta(adj);
    pasos.push({ t: 'On transpose', html: `(Adj A)<sup>t</sup> = ${matHtml(adjT)}` });
    const inv = adjT.map((f) => f.map((x) => A_.div(x, d)));
    pasos.push({ t: 'Résultat', html: `A<sup>−1</sup> = (1 / |A|)·(Adj A)<sup>t</sup> = (1 / ${htmlP(d)})·${matHtml(adjT)} = ${matHtml(inv)}` });
    return { valor: inv, pasos };
  }

  function propios(A) {
    const n = A.length, p = A_.caracteristico(A), pasos = [];
    const pc = n % 2 ? p.map(A_.neg) : p;
    const AL = A.map((f, i) => f.map((x, j) => (i === j ? `${html(x) === '0' ? '' : html(x) + ' '}−&nbsp;λ` : html(x))));
    pasos.push({ t: 'Polynôme caractéristique', html: `|A − λI| = <span class="mat det"><table>${AL.map((f) => `<tr>${f.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</table></span> = <b>${A_.polHtml(pc)}</b>` });
    const r = A_.raices(p), vals = [];
    const fac = r.exactas.map(({ valor, mult }) => { const [s, v] = A_.signo(A_.neg(valor)); return `(λ ${s} ${v})${mult > 1 ? `<sup>${mult}</sup>` : ''}`; });
    if (r.resto.length > 1) fac.push(`(${A_.polHtml(r.resto)})`);
    if (r.exactas.length) pasos.push({ t: 'Racines du polynôme', html: `|A − λI| = ${n % 2 ? '−' : ''}${fac.join('')} = 0` });
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
        pasos.push({ t: 'Le facteur du second degré n’a pas de racines rationnelles', html: `${A_.polHtml(r.resto)} = 0 ⇒ λ = (−b ± √(b<sup>2</sup> − 4ac)) / (2a) = <b>${radicales.ambos}</b>` });
        aprox.sort((x, y) => (D.n < 0n ? y.im - x.im : y.re - x.re));
      }
    }
    aprox.forEach((z, i) => vals.push({ valor: z, mult: 1, exacto: false, etiqueta: radicales ? (i ? radicales.menos : radicales.mas) : null }));
    if (r.resto.length > 1 && !radicales) pasos.push({ t: 'Racines irrationnelles', html: `Les racines de ${A_.polHtml(r.resto)} se calculent numériquement : λ ≈ ${r.aprox.map((z) => A_.decimalC(z, 6)).join(', ')}` });
    const multTxt = (m) => ({ 2: 'doble', 3: 'triple' }[m] || `multiplicidad ${m}`);
    const etq = (v) => (v.exacto ? html(v.valor) : v.etiqueta ? `${v.etiqueta} ≈ ${A_.decimalC(v.valor, 5)}` : '≈ ' + A_.decimalC(v.valor, 6));
    const lista = vals.map((v) => `${etq(v)}${v.mult > 1 ? ` (${multTxt(v.mult)})` : ''}`);
    pasos.push({ t: 'Valeurs propres', html: `λ = <b>${lista.join(', &nbsp;')}</b>` });
    const esp = [];
    for (const v of vals.filter((x) => x.exacto)) {
      const M = A_.restaM(A, A_.escalar(v.valor, A_.identidad(n))), N = A_.nucleo(M);
      esp.push({ ...v, base: N.base });
      const [s, vv] = A_.signo(A_.neg(v.valor));
      pasos.push({ t: `Vecteurs propres de λ = ${html(v.valor)}`, html: `(A ${s === '+' ? '+' : '−'} ${vv.replace(/^\((.*)\)$/, '($1)')}I) x = 0: ${matHtml(M)} → ${matHtml(N.R)}<br>dim = ${N.base.length}${v.mult > 1 ? ` (multiplicité algébrique ${v.mult})` : ''} ; base : ${N.base.map((b) => A_.vecHtml(b)).join(' ')}` });
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
        rad = `<br>Avec des radicaux, de la ${usaB ? 'première' : 'seconde'} ligne de (A − λI) v = 0 on tire v = ${usaB ? '(b, λ − a)' : '(λ − d, c)'} : ${noEx.map((v) => `λ = ${v.etiqueta} ⇒ v = <b>${v.vectorRad}</b>`).join('; &nbsp;')}.`;
      }
      if (noEx.every((v) => v.vector)) pasos.push({ t: 'Vecteurs propres des valeurs non rationnelles', html: `On résout (A − λI) v = 0 avec la valeur numérique de chaque λ ; le vecteur est donné avec une composante égale à 1 (tout multiple convient) :<br>${noEx.map((v) => `λ ≈ ${A_.decimalC(v.valor, 5)} ⇒ v ≈ <b>(${v.vector.map((z) => A_.decimalC(z, 4)).join('; &nbsp;')})</b>`).join('<br>')}${rad}` });
    }
    const todos = vals.every((x) => x.exacto);
    let diag, PD = null;
    if (todos) {
      diag = esp.every((x) => x.base.length === x.mult);
      if (diag) {
        const P = A_.traspuesta(esp.flatMap((x) => x.base)), D = esp.flatMap((x) => Array(x.mult).fill(x.valor)).map((x, i, arr) => arr.map((_, j) => (i === j ? x : A_.c0)));
        pasos.push({ t: 'Elle est diagonalisable', html: `Chaque valeur propre a autant de vecteurs que sa multiplicité. Avec les vecteurs en colonnes, A = P D P<sup>−1</sup> :<br>P = ${matHtml(P)}, &nbsp; D = ${matHtml(D)}` });
        PD = { P, D };
      } else pasos.push({ t: 'Elle n’est pas diagonalisable', html: `Une valeur propre a moins de vecteurs propres indépendants que sa multiplicité.` });
    } else {
      diag = vals.every((x) => x.mult === 1) ? true : null;
      if (diag) pasos.push({ t: 'Elle est diagonalisable', html: `Les ${n} valeurs propres sont distinctes, donc elle est diagonalisable${A_.esRealM(A) && vals.some((x) => !x.exacto && Math.abs(x.valor.im) > 1e-9) ? ' (dans les complexes)' : ''}. Les vecteurs propres des racines non rationnelles figurent plus haut, avec leur valeur numérique.` });
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
    const m = A.length, n = A[0].length, N = A_.nucleo(A), e = A_.escalonar(A, { reducida: true }), rg = e.rango, pasos = [{ t: 'Matrice', html: `${matHtml(A)}, de ${dims(A)} : en tant qu’application linéaire, elle va de ℝ<sup>${n}</sup> dans ℝ<sup>${m}</sup> (ou de ℂ dans ℂ si elle a des complexes).` }];
    pasos.push(...pasosGauss(e.pasos));
    const cp = e.pivotes.map(([, c]) => c), libres = Array.from({ length: n }, (_, j) => j).filter((j) => !cp.includes(j));
    pasos.push({ t: 'Forme échelonnée réduite', html: `${matHtml(e.R)}<br>Rang ${rg} : pivots dans ${cp.length ? `les colonnes ${cp.map((c) => c + 1).join(', ')}` : 'aucune colonne'}${libres.length ? ` ; ${libres.map((j) => VAR(j)).join(', ')} ${libres.length > 1 ? 'restent libres' : 'reste libre'}` : ' ; aucune inconnue ne reste libre'}.` });
    const filasR = e.R.slice(0, rg), nuc = N.base, par = 'tsuvw';
    const implN = filasR.map((fl) => `${combinacion(fl)} = 0`), paramN = Array.from({ length: n }, (_, i) => `${VAR(i)} = ${nuc.length ? combinacion(nuc.map((b) => b[i]), 't').replace(/t<sub>(\d)<\/sub>/g, (_, k) => (nuc.length === 1 ? 't' : par[k - 1])) : '0'}`);
    pasos.push({ t: 'Noyau (Ker A) : solutions de A·x = 0', html: nuc.length
      ? `dim Ker A = n − rg(A) = ${n} − ${rg} = <b>${nuc.length}</b>.<br>Équations implicites : ${implN.length ? implN.join('; &nbsp;') : 'aucune (tout vecteur les vérifie)'}.<br>Équations paramétriques : ${paramN.join(', &nbsp;')}.<br>Base : ${nuc.map((b) => A_.vecHtml(b)).join(' ')}`
      : `dim Ker A = n − rg(A) = ${n} − ${rg} = <b>0</b> : seul le vecteur nul vérifie A·x = 0 (l’application est injective).` });
    const im = cp.map((c) => A.map((fl) => fl[c])), NT = A_.nucleo(A_.traspuesta(A)).base;
    const paramI = Array.from({ length: m }, (_, i) => `${VAR(i, 'y')} = ${combinacion(im.map((b) => b[i]), 't').replace(/t<sub>(\d)<\/sub>/g, (_, k) => (im.length === 1 ? 't' : par[k - 1]))}`);
    pasos.push({ t: 'Image (Im A) : le sous-espace engendré par les colonnes', html: rg === 0 ? 'La matrice est nulle : Im A = {0}, de dimension <b>0</b>.'
      : `dim Im A = rg(A) = <b>${rg}</b>. Les colonnes de A qui contiennent un pivot (${cp.map((c) => c + 1).join(', ')}) forment une base : ${im.map((b) => A_.vecHtml(b)).join(' ')}<br>Équations paramétriques : ${paramI.join(', &nbsp;')}.<br>${NT.length ? `Équations implicites (ce que y doit vérifier pour que A·x = y ait une solution) : ${NT.map((w) => `${combinacion(w, 'y')} = 0`).join('; &nbsp;')}.` : `Comme le rang est ${m}, Im A est tout l’espace d’arrivée : il n’y a pas d’équations implicites (l’application est surjective).`}` });
    pasos.push({ t: 'Espace des lignes', html: rg ? `Les lignes non nulles de la forme échelonnée réduite forment une base du sous-espace engendré par les lignes de A (dimension ${rg}) : ${filasR.map((fl) => `(${fl.map((x) => html(x)).join(', ')})`).join(', &nbsp;')}. Le noyau en est l’orthogonal.` : 'La matrice est nulle : il n’y a pas de lignes indépendantes.' });
    pasos.push({ t: 'Théorème du rang', html: `dim Ker A + dim Im A = ${nuc.length} + ${rg} = ${n}, le nombre de colonnes.` });
    return { valor: { nucleo: nuc, imagen: im, filas: filasR, implicitasImagen: NT, rango: rg, dimNucleo: nuc.length }, pasos, res: `dim Ker A = ${nuc.length}, &nbsp; dim Im A = ${rg}` };
  }

  function potDiagonal(A, n) {
    if (!Number.isInteger(n) || Math.abs(n) > 1000) throw new Error('L’exposant n doit être un nombre entier compris entre −1000 et 1000');
    const pr = propios(A);
    if (!pr.PD) throw new Error(pr.diag === false ? 'A n’est pas diagonalisable : calcule la puissance par multiplication' : 'Les valeurs propres ne sont pas exactes : calcule la puissance par multiplication');
    const { P, D } = pr.PD, Pi = invGauss(P).valor;
    if (n < 0 && D.some((f, i) => A_.esCero(f[i]))) throw new Error('A a la valeur propre 0, donc elle n’a ni inverse ni puissances négatives');
    const Dn = D.map((f, i) => f.map((x, j) => (i === j ? A_.potencia(x, n) : A_.c0)));
    const R = A_.producto(A_.producto(P, Dn), Pi);
    const pasos = pr.pasos.filter((p) => /Polinomio|Valores propios|diagonalizable/.test(p.t));
    pasos.push({ t: 'Pourquoi ça marche', html: `A = P D P<sup>−1</sup> ⇒ A<sup>n</sup> = P D P<sup>−1</sup> · P D P<sup>−1</sup> ⋯ = P D<sup>n</sup> P<sup>−1</sup>, et D<sup>n</sup> se calcule en élevant chaque élément de la diagonale à la puissance n.` });
    pasos.push({ t: `D<sup>${n}</sup> y P<sup>−1</sup>`, html: `D<sup>${n}</sup> = ${matHtml(Dn)}, &nbsp; P<sup>−1</sup> = ${matHtml(Pi)}` });
    pasos.push({ t: 'Résultat', html: `A<sup>${n}</sup> = P·D<sup>${n}</sup>·P<sup>−1</sup> = <b>${matHtml(R)}</b>` });
    return { valor: R, pasos };
  }

  const potM = (M, k) => { let R = A_.identidad(M.length); for (let i = 0; i < k; i++) R = A_.producto(R, M); return R; };
  const columna = (M, j) => M.map((f) => f[j]);
  const rangoV = (vs) => (vs.length ? A_.escalonar(vs).rango : 0);
  function jordan(A) {
    const n = A.length, pr = propios(A), pasos = pr.pasos.filter((p) => /Polinomio|Raíces|Valores propios/.test(p.t));
    if (!pr.valor.every((v) => v.exacto)) throw new Error('La forme de Jordan n’est calculée ici que lorsque les valeurs propres sont exactes (rationnelles ou complexes rationnelles)');
    const cols = [], bloques = [];
    for (const v of pr.valor) {
      const N = A_.restaM(A, A_.escalar(v.valor, A_.identidad(n)));
      const dims = [0];
      for (let k = 1; k <= n && dims[k - 1] < v.mult; k++) dims.push(A_.nucleo(potM(N, k)).base.length);
      const s = dims.length - 1, g = dims[1];
      pasos.push({ t: `λ = ${html(v.valor)}`, html: `Multiplicité algébrique ${v.mult} et géométrique ${g} (dim ker(A − λI)${s > 1 ? `; ${dims.slice(2).map((d, i) => `dim ker(A − λI)<sup>${i + 2}</sup> = ${d}`).join(', ')}` : ''}).${g === v.mult ? ' Elle a tous ses vecteurs propres : blocs de taille 1.' : ` Il lui manque ${v.mult - g} vecteurs : il faut des vecteurs propres généralisés.`}` });
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
    if (cols.length !== n) throw new Error('Je n’ai pas pu construire la base de Jordan de cette matrice');
    const P = A_.traspuesta(cols), J = A.map((_, i) => A.map((_, j) => A_.c0));
    let pos = 0;
    for (const b of bloques) { for (let i = 0; i < b.k; i++) { J[pos + i][pos + i] = b.l; if (i < b.k - 1) J[pos + i][pos + i + 1] = A_.c1; } pos += b.k; }
    if (!A_.iguales(A_.producto(A, P), A_.producto(P, J))) throw new Error('Je n’ai pas pu vérifier la forme de Jordan de cette matrice');
    pasos.push({ t: 'Base de Jordan', html: `Chaque chaîne commence par un vecteur propre v₁ et se poursuit avec (A − λI) v₂ = v₁, (A − λI) v₃ = v₂…, avec les vecteurs en colonnes :<br>P = ${matHtml(P)}` });
    pasos.push({ t: 'Forme de Jordan', html: `J = P<sup>−1</sup> A P = <b>${matHtml(J)}</b>${bloques.every((b) => b.k === 1) ? ' (elle est diagonale : A est diagonalisable)' : ', avec un 1 au-dessus de la diagonale dans chaque bloc de taille supérieure à 1'}.` });
    return { valor: J, P, pasos };
  }

  function ortogonal(A) {
    const n = A.length;
    if (!A_.iguales(A, A_.traspuesta(A)) || !A_.esRealM(A)) throw new Error('La diagonalisation orthogonale concerne les matrices symétriques réelles (A = Aᵗ)');
    const pr = propios(A), pasos = pr.pasos.filter((p) => /Polinomio|Raíces|Valores propios|Vectores propios/.test(p.t));
    if (!pr.valor.every((v) => v.exacto)) throw new Error('Les valeurs propres ne sont pas rationnelles : la diagonalisation orthogonale exacte ne peut pas s’écrire ici');
    pasos.push({ t: 'Théorème spectral', html: 'Une matrice symétrique réelle est toujours diagonalisable et ses vecteurs propres associés à des valeurs distinctes sont orthogonaux. Dans chaque sous-espace propre, on orthogonalise avec Gram-Schmidt puis on normalise.' });
    const dot = (u, v) => u.reduce((s, x, i) => A_.suma(s, A_.mul(x, v[i])), A_.c0), cols = [];
    for (const e of pr.esp) {
      const orto = [];
      for (const v of e.base) {
        let w = v;
        for (const u of orto) w = w.map((x, i) => A_.resta(x, A_.mul(A_.div(dot(v, u), dot(u, u)), u[i])));
        orto.push(A_.limpia(w));
      }
      if (e.base.length > 1) pasos.push({ t: `Gram-Schmidt en λ = ${html(e.valor)}`, html: `u₁ = v₁, u₂ = v₂ − (v₂·u₁ / u₁·u₁) u₁ …: ${orto.map((u) => A_.vecHtml(u)).join(' ')}` });
      cols.push(...orto);
    }
    const raizTxt = (q) => { const r = A_.raizHtml(q.re); if (!r) { const n2 = q.re; const sq = (b) => { let x = BigInt(Math.round(Math.sqrt(Number(b)))); while (x * x > b) x--; while ((x + 1n) * (x + 1n) <= b) x++; return x; }; return A_.html(A_.C(A_.Q(sq(n2.n), sq(n2.d)))); } return `${r.a === 1n ? '' : r.a}√${r.dentro}${r.b === 1n ? '' : '/' + r.b}`; };
    const normas = cols.map((u) => raizTxt(dot(u, u)));
    const Qh = `<span class="mat"><table>${A.map((_, i) => `<tr>${cols.map((u, j) => `<td>${A_.esCero(u[i]) ? '0' : normas[j] === '1' ? html(u[i]) : `<span class="fr"><span>${html(u[i])}</span><span>${normas[j]}</span></span>`}</td>`).join('')}</tr>`).join('')}</table></span>`;
    const D = pr.esp.flatMap((x) => Array(x.mult).fill(x.valor)).map((x, i, arr) => arr.map((_, j) => (i === j ? x : A_.c0)));
    pasos.push({ t: 'On normalise', html: `Normes : ${normas.map((t, j) => `‖u<sub>${j + 1}</sub>‖ = ${t}`).join(', ')}` });
    pasos.push({ t: 'Résultat', html: `A = Q D Q<sup>t</sup>, avec Q orthogonale (Q<sup>−1</sup> = Q<sup>t</sup>) :<br>Q = ${Qh}, &nbsp; D = ${matHtml(D)}` });
    return { valor: D, pasos, Qh };
  }

  function lu(A) {
    const n = A.length, U = A_.copia(A), L = A_.identidad(n), pasos = [{ t: 'Idée', html: 'On échelonne A sans échanger de lignes. U est la matrice échelonnée et L conserve, sous la diagonale, les multiplicateurs de chaque étape L<sub>i</sub> → L<sub>i</sub> − m·L<sub>j</sub>.' }];
    for (let c = 0; c < n; c++) {
      if (A_.esCero(U[c][c])) {
        if (U.slice(c + 1).every((f) => A_.esCero(f[c]))) continue;
        throw new Error(`Il faut échanger des lignes (le pivot ${c + 1} est 0) : cette matrice n’a pas de LU sans permutation. Essaie de changer l’ordre des lignes (PA = LU)`);
      }
      const ops = [];
      for (let r = c + 1; r < n; r++) {
        if (A_.esCero(U[r][c])) continue;
        const m = A_.div(U[r][c], U[c][c]);
        L[r][c] = m; U[r] = U[r].map((x, j) => A_.resta(x, A_.mul(m, U[c][j])));
        ops.push(`m<sub>${r + 1}${c + 1}</sub> = ${html(m)}: ${A_.F(r)} → ${A_.F(r)} − ${esUnoM(m) ? '' : htmlP(m) + '·'}${A_.F(c)}`);
      }
      if (ops.length) pasos.push({ t: `Colonne ${c + 1}`, html: `${ops.join('<br>')}<br>${matHtml(U)}` });
    }
    pasos.push({ t: 'Résultat', html: `A = L·U avec L = ${matHtml(L)} et U = ${matHtml(U)}` });
    return { valor: { L, U }, pasos, L, U };
  }
  const esUnoM = (m) => A_.esUno(m);

  function ecuacion(A, B, lado) {
    const n = A.length;
    if (lado === 'AX' && B.length !== n) throw new Error(`Dans A·X = B, B doit avoir ${n} lignes (elle en a ${B.length})`);
    if (lado === 'XA' && B[0].length !== n) throw new Error(`Dans X·A = B, B doit avoir ${n} colonnes (elle en a ${B[0].length})`);
    const pasos = [{ t: 'On isole X', html: lado === 'AX' ? 'Si A est inversible, on multiplie par A<sup>−1</sup> <b>à gauche</b> : A<sup>−1</sup>·A·X = A<sup>−1</sup>·B ⇒ X = A<sup>−1</sup>·B' : 'Si A est inversible, on multiplie par A<sup>−1</sup> <b>à droite</b> : X·A·A<sup>−1</sup> = B·A<sup>−1</sup> ⇒ X = B·A<sup>−1</sup>' }];
    const d = A_.determinante(A);
    pasos.push({ t: 'Déterminant de A', html: `|A| = ${html(d)}${A_.esCero(d) ? ' : A n’est pas inversible' : ' ≠ 0 : A est inversible'}` });
    if (A_.esCero(d)) { pasos.push({ t: 'Non inversible', html: 'Avec |A| = 0, l’équation n’a pas de solution unique : elle n’en a aucune ou une infinité (on la résout comme un système colonne par colonne).' }); return { valor: null, pasos, res: 'A n’est pas inversible : X n’est pas unique (ou n’existe pas)' }; }
    const inv = invGauss(A).valor;
    pasos.push({ t: 'Inverse de A', html: `A<sup>−1</sup> = ${matHtml(inv)}` });
    const X = lado === 'AX' ? A_.producto(inv, B) : A_.producto(B, inv);
    pasos.push({ t: 'Résultat', html: `X = ${lado === 'AX' ? `A<sup>−1</sup>·B = ${matHtml(inv)}·${matHtml(B)}` : `B·A<sup>−1</sup> = ${matHtml(B)}·${matHtml(inv)}`} = <b>${matHtml(X)}</b>` });
    pasos.push({ t: 'Vérification', html: `${lado === 'AX' ? 'A·X' : 'X·A'} = ${matHtml(lado === 'AX' ? A_.producto(A, X) : A_.producto(X, A))} = B ✓<br>Pour A·X + C = D, on fait de même avec B = D − C.` });
    return { valor: X, pasos, res: matHtml(X) };
  }

  const P_ = typeof Parametro !== 'undefined' ? Parametro : typeof require !== 'undefined' ? require('../matematicas/parametro.js') : null;
  const valoresTxt = (rs) => rs.map(P_.raizHtml).join(', ');
  function resolverParam(sc, op, O, letra) {
    const sinParam = { gauss: 'escalonar', reducida: 'la forme échelonnée réduite', propios: 'les valeurs propres' };
    if (sinParam[op]) throw new Error(`Avec le paramètre ${letra}, on peut calculer le déterminant, le rang, l’inverse et les opérations, mais pas ${sinParam[op]} : donne une valeur à ${letra}`);
    const A = P_.leeMatriz(sc.A, letra), mh = (M, o) => P_.matHtml(M, letra, o), ph = (q) => P_.html(q, letra), fh = (q) => P_.factorHtml(q, letra);
    if (!A.length || !A[0].length) throw new Error('La matrice est vide');
    if (O.cuadrada && A.length !== A[0].length) throw new Error(`${O.nombre} : la matrice doit être carrée (elle est ${dims(A)})`);
    const pasos = [{ t: 'Matrice avec le paramètre ' + letra, html: `A = ${mh(A)}` }];
    let res, valor = null, discusion = null;
    const raicesDe = (d) => P_.raices(d).filter((r, i, xs) => !xs.slice(0, i).some((q) => Math.abs(q.num - r.num) < 1e-9));
    if (op === 'det' || op === 'inversa') {
      const d = P_.det(A), rs = raicesDe(d);
      pasos.push({ t: 'Déterminant', html: `|A| = ${mh(A, { det: true })} = ${ph(d)}${P_.grado(d) >= 2 && fh(d) !== ph(d) ? ` = <b>${fh(d)}</b>` : ''}` });
      if (P_.constante(d)) pasos.push({ t: 'Ne dépend pas de ' + letra, html: `|A| = ${ph(d)} a la même valeur pour tout ${letra}.` });
      else pasos.push({ t: `Quand a-t-on |A| = 0 ?`, html: rs.length ? `${ph(d)} = 0 &ensp;⇔&ensp; ${letra} = ${valoresTxt(rs)}` : `${ph(d)} ne s’annule pour aucun ${letra} réel.` });
      if (op === 'det') { res = `|A| = ${fh(d)}`; valor = d; discusion = rs; }
      else {
        const n = A.length;
        if (P_.nulo(d)) { res = `A n’est inversible pour aucun ${letra} (|A| = 0 toujours)`; pasos.push({ t: 'Résultat', html: res }); }
        else {
          pasos.push({ t: 'Quand elle est inversible', html: rs.length ? `A est inversible si et seulement si |A| ≠ 0 : <b>pour ${letra} ≠ ${valoresTxt(rs)}</b>. Pour ${rs.length > 1 ? 'ces valeurs' : 'cette valeur'}, elle n’est pas inversible.` : `|A| ne s’annule jamais, donc A est inversible pour tout ${letra}.` });
          if (n > 4) pasos.push({ t: 'L’inverse', html: `Pour ${n}×${n}, l’inverse avec ${letra} est trop longue : donne une valeur à ${letra} pour la calculer.` });
          else {
            const cof = (i, j) => { const m = A.filter((_, r) => r !== i).map((f) => f.filter((_, c) => c !== j)); const v = n === 1 ? P_.cte(A_.c1) : P_.det(m); return (i + j) % 2 ? P_.pneg(v) : v; };
            const adj = A.map((f, i) => f.map((_, j) => cof(i, j))), adjT = adj[0].map((_, j) => adj.map((f) => f[j]));
            pasos.push({ t: 'Matrice adjointe et transposée', html: `Chaque élément est son cofacteur (−1)<sup>i+j</sup>·|mineur| : (Adj A)<sup>t</sup> = ${mh(adjT)}` });
            const inv = `<span class="mat"><table>${adjT.map((f) => `<tr>${f.map((q) => `<td>${P_.fracHtml(q, d, letra)}</td>`).join('')}</tr>`).join('')}</table></span>`;
            pasos.push({ t: 'Résultat', html: `A<sup>−1</sup> = (1 / |A|)·(Adj A)<sup>t</sup> = ${inv}${rs.length ? `, pour ${letra} ≠ ${valoresTxt(rs)}` : ''}` });
            res = `A<sup>−1</sup> = ${inv}`;
          }
          if (!res) res = rs.length ? `A est inversible pour ${letra} ≠ ${valoresTxt(rs)}` : `A est inversible pour tout ${letra}`;
          discusion = rs;
        }
      }
    } else if (op === 'rango') {
      const g = P_.rangoGenerico(A), rs = raicesDe(g.mcd), m = A.length, n = A[0].length;
      if (g.r === 0) { res = 'rg(A) = 0'; pasos.push({ t: 'Résultat', html: 'Tous les éléments sont nuls : rg(A) = 0' }); }
      else {
        if (g.menor) pasos.push({ t: `Un mineur d’ordre ${g.r}`, html: `Avec les lignes ${g.menor.fs.map((i) => i + 1).join(', ')} et les colonnes ${g.menor.cs.map((j) => j + 1).join(', ')} : ${mh(P_.submatriz(A, g.menor.fs, g.menor.cs), { det: true })} = ${fh(g.menor.d)}${g.r < Math.min(m, n) ? `. Tous les mineurs d’ordre ${g.r + 1} sont nuls pour tout ${letra}, donc le rang ne dépasse jamais ${g.r}` : ''}.` });
        const casos = rs.map((r) => {
          const rg = r.exacta ? A_.escalonar(P_.evaluaM(A, r.valor)).rango : P_.rangoF(A, r.num);
          return { r, rg };
        });
        pasos.push({ t: rs.length ? `Quand tous les mineurs d’ordre ${g.r} s’annulent-ils ?` : 'Discussion', html: rs.length ? `Tous les mineurs d’ordre ${g.r} s’annulent simultanément seulement si ${letra} = ${valoresTxt(rs)} (les racines communes, qui sont celles de leur plus grand commun diviseur ${fh(g.mcd)}). Pour chaque valeur, on substitue et l’on échelonne :<br>${casos.map((c) => `${letra} = ${P_.raizHtml(c.r)} : rg(A) = <b>${c.rg}</b>`).join('<br>')}` : `Il existe un mineur d’ordre ${g.r} qui ne s’annule pour aucun ${letra} : rg(A) = ${g.r} toujours.` });
        res = casos.length ? `Si ${letra} ≠ ${valoresTxt(rs)} : rg(A) = ${g.r}${casos.map((c) => `<br>Si ${letra} = ${P_.raizHtml(c.r)} : rg(A) = ${c.rg}`).join('')}` : `rg(A) = ${g.r} pour tout ${letra}`;
        valor = { r: g.r, casos: casos.map((c) => ({ valor: c.r.num, rango: c.rg })) };
      }
    } else {
      const B = O.B ? (() => { try { return P_.leeMatriz(sc.B, letra); } catch (e) { throw new Error('Matrice B · ' + e.message); } })() : null;
      const prod = (X, Y) => X.map((f) => Y[0].map((_, j) => f.reduce((s, x, k) => P_.psuma(s, P_.pmul(x, Y[k][j])), P_.cte(A_.c0))));
      let R;
      if (op === 'traspuesta') R = A[0].map((_, j) => A.map((f) => f[j]));
      else if (op === 'suma' || op === 'resta') {
        if (A.length !== B.length || A[0].length !== B[0].length) throw new Error(`Pour ${op === 'suma' ? 'additionner' : 'soustraire'}, A et B doivent avoir la même taille (A est ${dims(A)} et B est ${dims(B)})`);
        R = A.map((f, i) => f.map((x, j) => (op === 'suma' ? P_.psuma : P_.presta)(x, B[i][j])));
        pasos.push({ t: 'B', html: `B = ${mh(B)}` });
      } else if (op === 'producto') {
        if (A[0].length !== B.length) throw new Error(`Pour multiplier A·B, le nombre de colonnes de A (${A[0].length}) doit être égal au nombre de lignes de B (${B.length})`);
        R = prod(A, B); pasos.push({ t: 'B', html: `B = ${mh(B)}` });
      } else if (op === 'escalar') { const k = P_.lee(sc.k, letra); R = A.map((f) => f.map((x) => P_.pmul(k, x))); }
      else if (op === 'potencia') {
        const n = Number(String(sc.n).trim().replace('−', '-'));
        if (!Number.isInteger(n) || n < 0 || n > 10) throw new Error(`Avec le paramètre ${letra}, l’exposant n doit être un entier compris entre 0 et 10`);
        R = A.map((f, i) => f.map((_, j) => P_.cte(i === j ? A_.c1 : A_.c0)));
        for (let k = 1; k <= n; k++) { R = prod(R, A); if (k > 1 && n <= 4) pasos.push({ t: `A<sup>${k}</sup>`, html: mh(R) }); }
      }
      if (!R) throw new Error(`Avec une lettre (${letra}) dans les cases, cette opération ne peut pas se calculer : écris des nombres partout`);
      pasos.push({ t: 'Résultat', html: mh(R) });
      res = mh(R); valor = R;
    }
    return { op, metodo: null, letra, A: sc.A, valor, discusion, res, pasos };
  }

  const EX = typeof Expresion !== 'undefined' ? Expresion : typeof require !== 'undefined' ? require('../matematicas/expresion.js') : null;
  const FLEX = /sqrt|√|π|pi|ln\(|log\(|sen\(|cos\(|tg\(|exp\(|abs\(|e\^/i;
  function casilla(c, leidos) {
    const t = String(c ?? '').trim();
    if (!EX || !FLEX.test(t)) return c;
    let z; try { z = EX.complejo(t.replace(/[−–]/g, '-').replace(/[·×]/g, '*'), 'La case').z; } catch (e) { return c; }
    const q = (v) => { const fr = EX.fraccion(v, 10000); return fr && Math.abs(fr[0] / fr[1] - v) < 1e-12 ? fr : null; }, a = q(z.re), b = q(z.im);
    const dec = A_.decimalC(z, 6);
    if (!a || !b) throw new Error(`« ${t} » vaut ${dec.replace(/<[^>]+>/g, '')}, qui n’est pas une fraction exacte, et ici on calcule avec des fractions. Si une valeur approchée te convient, écris-la avec des décimales`);
    const fr = ([n, d]) => (d === 1 ? `${n}` : `${n}/${d}`), txt = b[0] === 0 ? fr(a) : `${a[0] === 0 ? '' : fr(a)}${b[0] < 0 ? '-' : a[0] === 0 ? '' : '+'}${fr([Math.abs(b[0]), b[1]])}i`;
    leidos.push(`«${t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}» = ${html(A_.leer(txt))}`);
    return txt;
  }
  function resolver(sc0) {
    const leidos = [], mat = (M) => (Array.isArray(M) ? M.map((f) => (Array.isArray(f) ? f.map((c) => casilla(c, leidos)) : f)) : M);
    const r = resolver0({ ...sc0, A: mat(sc0.A), B: mat(sc0.B), k: sc0.k === undefined ? sc0.k : casilla(sc0.k, leidos) });
    if (leidos.length && r.pasos) { r.pasos.unshift({ t: 'Valeurs lues', html: `${leidos.join(', &nbsp;')}. Les racines et les logarithmes sont pris en valeur principale.` }); r.leidos = leidos.length; }
    return r;
  }
  function resolver0(sc) {
    const op = OPS[sc.op] ? sc.op : 'det', O = OPS[op];
    const letra = P_ ? P_.letraDe([...(sc.A || []).flat(), ...(O.B ? (sc.B || []).flat() : []), ...(O.k ? [sc.k] : [])]) : null;
    if (letra) return resolverParam(sc, op, O, letra);
    const A = A_.leerMatriz(sc.A);
    if (!A.length || !A[0].length) throw new Error('La matrice est vide');
    if (O.cuadrada && A.length !== A[0].length) throw new Error(`${O.nombre} : la matrice doit être carrée (elle est ${dims(A)})`);
    let B = null;
    if (O.B) B = (() => { try { return A_.leerMatriz(sc.B); } catch (e) { throw new Error('Matrice B · ' + e.message); } })();
    const metodo = O.metodos ? (O.metodos.some(([k]) => k === sc.metodo) ? sc.metodo : O.metodos[0][0]) : null;
    let r;
    switch (op) {
      case 'det': r = metodo === 'directo' ? detDirecto(A) : detGauss(A); r.res = `|A| = ${html(r.valor)}`; break;
      case 'inversa': r = metodo === 'adjuntos' ? invAdjuntos(A) : invGauss(A); r.res = r.valor ? `A<sup>−1</sup> = ${matHtml(r.valor)}` : 'A n’est pas inversible (|A| = 0)'; break;
      case 'rango': case 'gauss': case 'reducida': {
        const e = A_.escalonar(A, { reducida: op === 'reducida' });
        r = { valor: op === 'rango' ? e.rango : e.R, pasos: [{ t: 'Matrice', html: matHtml(A) }, ...pasosGauss(e.pasos)] };
        if (!e.pasos.length) r.pasos.push({ t: 'Elle est déjà échelonnée', html: 'Aucune opération n’est nécessaire.' });
        r.pasos.push({ t: 'Résultat', html: op === 'rango' ? `Il reste ${e.rango} ${e.rango === 1 ? 'ligne non nulle' : 'lignes non nulles'} (les pivots sont dans les colonnes ${e.pivotes.map(([, c]) => c + 1).join(', ') || '—'}) : rg(A) = <b>${e.rango}</b>` : `${matHtml(e.R)}, de rang ${e.rango}` });
        r.res = op === 'rango' ? `rg(A) = ${e.rango}` : matHtml(e.R);
        break;
      }
      case 'subespacios': r = subespacios(A); break;
      case 'jordan': r = jordan(A); r.res = `J = ${matHtml(r.valor)}`; break;
      case 'ortogonal': r = ortogonal(A); r.res = `Q = ${r.Qh}, &nbsp; D = ${matHtml(r.valor)}`; break;
      case 'lu': r = lu(A); r.res = `L = ${matHtml(r.L)}, &nbsp; U = ${matHtml(r.U)}`; break;
      case 'adjunta': {
        const n = A.length, adj = n === 1 ? [[A_.c1]] : A.map((f, i) => f.map((_, j) => A_.cofactor(A, i, j))), pasos = [{ t: 'Matrice', html: matHtml(A) }];
        if (n > 1) pasos.push({ t: 'Cofacteurs', html: `A<sub>ij</sub> = (−1)<sup>i+j</sup>·|M<sub>ij</sub>|, avec M<sub>ij</sub> la matrice privée de la ligne i et de la colonne j.${n <= 3 ? '<br>' + adj.map((f, i) => f.map((x, j) => `A<sub>${i + 1}${j + 1}</sub> = ${(i + j) % 2 ? '−' : '+'}${matHtml(A_.menor(A, i, j), { det: true })} = ${html(x)}`).join('<br>')).join('<br>') : ''}` });
        pasos.push({ t: 'Matrice adjointe', html: `Adj(A) = ${matHtml(adj)}` }, { t: 'Transposée de l’adjointe', html: `(Adj A)<sup>t</sup> = ${matHtml(A_.traspuesta(adj))}. Elle vérifie A·(Adj A)<sup>t</sup> = |A|·I, avec |A| = ${html(A_.determinante(A))}.` });
        r = { valor: adj, pasos, res: `Adj(A) = ${matHtml(adj)}` }; break;
      }
      case 'ecAX': case 'ecXA': r = ecuacion(A, B, op === 'ecAX' ? 'AX' : 'XA'); break;
      case 'propios': r = propios(A); r.res = `λ = ${r.valor.map((v) => (v.exacto ? html(v.valor) : v.etiqueta || '≈ ' + A_.decimalC(v.valor, 5))).join(', &nbsp;')}`; break;
      case 'traspuesta': { const T = A_.traspuesta(A); r = { valor: T, pasos: [{ t: 'Les lignes deviennent des colonnes', html: `A<sup>t</sup> = ${matHtml(T)} (de ${dims(A)} à ${dims(T)})` }] }; r.res = matHtml(T); break; }
      case 'suma': case 'resta': {
        if (A.length !== B.length || A[0].length !== B[0].length) throw new Error(`Pour ${op === 'suma' ? 'additionner' : 'soustraire'}, A et B doivent avoir la même taille (A est ${dims(A)} et B est ${dims(B)})`);
        const S = op === 'suma' ? A_.sumaM(A, B) : A_.restaM(A, B);
        r = { valor: S, pasos: [{ t: 'Élément par élément', html: `${matHtml(A)} ${op === 'suma' ? '+' : '−'} ${matHtml(B)} = ${matHtml(S)}` }] }; r.res = matHtml(S); break;
      }
      case 'producto': {
        if (A[0].length !== B.length) throw new Error(`Pour multiplier A·B, le nombre de colonnes de A (${A[0].length}) doit être égal au nombre de lignes de B (${B.length})`);
        const P = A_.producto(A, B), pasos = [{ t: `Taille : (${dims(A)})·(${dims(B)}) = ${dims(P)}`, html: `Chaque élément c<sub>ij</sub> est la ligne i de A multipliée par la colonne j de B.` }];
        if (P.length * P[0].length <= 16) pasos.push({ t: 'Éléments', html: P.map((f, i) => f.map((x, j) => `c<sub>${i + 1}${j + 1}</sub> = ${A[i].map((a, k) => `${htmlF(a)}·${htmlF(B[k][j])}`).join(' + ')} = ${html(x)}`).join('<br>')).join('<br>') });
        pasos.push({ t: 'Résultat', html: `A·B = ${matHtml(P)}` });
        r = { valor: P, pasos }; r.res = matHtml(P); break;
      }
      case 'escalar': {
        let k; try { k = A_.leer(sc.k); } catch (e) { throw new Error('k · ' + e.message); }
        const S = A_.escalar(k, A); r = { valor: S, pasos: [{ t: 'On multiplie chaque élément par k', html: `${htmlP(k)}·${matHtml(A)} = ${matHtml(S)}` }] }; r.res = matHtml(S); break;
      }
      case 'potencia': {
        const n = Number(String(sc.n).trim().replace('−', '-'));
        if (metodo === 'diagonal') { r = potDiagonal(A, n); r.res = matHtml(r.valor); break; }
        if (!Number.isInteger(n) || Math.abs(n) > 50) throw new Error('L’exposant n doit être un nombre entier compris entre −50 et 50 (pour plus, utilise la diagonalisation)');
        const pasos = [];
        let base = A;
        if (n < 0) { const inv = invGauss(A); if (!inv.valor) throw new Error('A n’est pas inversible, donc on ne peut pas l’élever à un exposant négatif'); base = inv.valor; pasos.push({ t: 'Exposant négatif', html: `A<sup>${n}</sup> = (A<sup>−1</sup>)<sup>${-n}</sup>, con A<sup>−1</sup> = ${matHtml(base)}` }); }
        let P = A_.identidad(A.length);
        for (let k = 1; k <= Math.abs(n); k++) { P = A_.producto(P, base); if (Math.abs(n) <= 5 && k > 1) pasos.push({ t: `A<sup>${n < 0 ? -k : k}</sup> = A<sup>${n < 0 ? -(k - 1) : k - 1}</sup>·A${n < 0 ? '<sup>−1</sup>' : ''}`, html: matHtml(P) }); }
        if (n === 0) pasos.push({ t: 'Exposant 0', html: `A<sup>0</sup> = I = ${matHtml(P)}` });
        else pasos.push({ t: 'Résultat', html: `A<sup>${n}</sup> = ${matHtml(P)}` });
        r = { valor: P, pasos }; r.res = matHtml(P); break;
      }
    }
    return { op, metodo, A, B, ...r };
  }

  const M = (...filas) => filas.map((f) => f.split(' '));
  const ejemplos = [
    { clave: 'param-rango', nombre: 'Rang selon le paramètre k', sc: { op: 'rango', A: M('1 1 k', '1 k 1', 'k 1 1') } },
    { clave: 'param-inversa', nombre: 'Inverse selon la valeur de a', sc: { op: 'inversa', metodo: 'adjuntos', A: M('1 0 -1', '0 a 3', '4 1 -a') } },
    { clave: 'jordan', nombre: 'Forme de Jordan 3×3', sc: { op: 'jordan', A: M('2 1 0', '0 2 0', '0 0 3') } },
    { clave: 'ortogonal', nombre: 'Diagonalisation orthogonale', sc: { op: 'ortogonal', A: M('2 1 1', '1 2 1', '1 1 2') } },
    { clave: 'ecuacion', nombre: 'Équation matricielle A·X = B', sc: { op: 'ecAX', A: M('1 2', '3 4'), B: M('5 6', '7 8') } },
    { clave: 'lu', nombre: 'Décomposition LU', sc: { op: 'lu', A: M('2 1 1', '4 3 3', '8 7 9') } },
    { clave: 'potencia-diag', nombre: 'A¹⁰ par diagonalisation', sc: { op: 'potencia', metodo: 'diagonal', A: M('4 1', '2 3'), n: '10' } },
    { clave: 'det3', nombre: 'Déterminant 3×3 par Sarrus', sc: { op: 'det', metodo: 'directo', A: M('2 1 3', '0 -1 4', '1 2 5') } },
    { clave: 'det4', nombre: 'Déterminant 4×4 par Laplace', sc: { op: 'det', metodo: 'directo', A: M('1 0 2 -1', '3 0 0 5', '2 1 4 -3', '1 0 5 0') } },
    { clave: 'det-gauss', nombre: 'Déterminant par Gauss', sc: { op: 'det', metodo: 'gauss', A: M('2 4 -2', '1 3 1', '3 1 2') } },
    { clave: 'inv3', nombre: 'Inverse 3×3 par Gauss-Jordan', sc: { op: 'inversa', metodo: 'gauss', A: M('1 2 3', '0 1 4', '5 6 0') } },
    { clave: 'inv-adj', nombre: 'Inverse par les cofacteurs', sc: { op: 'inversa', metodo: 'adjuntos', A: M('2 0 1', '1 1 0', '0 1 3') } },
    { clave: 'inv-complejos', nombre: 'Inverse d’une matrice complexe', sc: { op: 'inversa', metodo: 'gauss', A: M('1 i', '-i 2') } },
    { clave: 'rango', nombre: 'Rang d’une matrice 3×4', sc: { op: 'rango', A: M('1 2 -1 3', '2 4 1 0', '3 6 0 3') } },
    { clave: 'subespacios', nombre: 'Noyau et image d’une matrice 3×4', sc: { op: 'subespacios', A: M('1 2 -1 3', '2 4 1 0', '3 6 0 3') } },
    { clave: 'propios-raiz', nombre: 'Vecteurs propres avec radicaux (2×2)', sc: { op: 'propios', A: M('1 1', '1 0') } },
    { clave: 'propios-num', nombre: 'Vecteurs propres numériques (3×3)', sc: { op: 'propios', A: M('1 2 0', '2 1 1', '0 1 1') } },
    { clave: 'reducida', nombre: 'Forme échelonnée réduite', sc: { op: 'reducida', A: M('2 4 6 8', '1 3 5 7', '1 1 1 2') } },
    { clave: 'propios2', nombre: 'Valeurs et vecteurs propres 2×2', sc: { op: 'propios', A: M('4 1', '2 3') } },
    { clave: 'diagonalizar', nombre: 'Diagonaliser une matrice 3×3', sc: { op: 'propios', A: M('2 0 0', '0 3 4', '0 4 -3') } },
    { clave: 'rotacion', nombre: 'Valeurs propres complexes (rotation)', sc: { op: 'propios', A: M('0 -1', '1 0') } },
    { clave: 'producto', nombre: 'Produit de matrices', sc: { op: 'producto', A: M('1 2 0', '-1 3 2'), B: M('2 1', '0 -1', '4 3') } },
    { clave: 'potencia', nombre: 'Puissance d’une matrice', sc: { op: 'potencia', A: M('1 1', '0 1'), n: '5' } },
  ];

  return { OPS, resolver, ejemplos };
})();

