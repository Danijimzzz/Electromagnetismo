/* =====================================================================
   Matrices paso a paso (sin DOM): determinante por Gauss, Sarrus o
   Laplace, inversa por Gauss-Jordan o por adjuntos, rango, forma
   escalonada y reducida, valores y vectores propios, y operaciones
   (suma, producto, potencia, traspuesta). Todo con fracciones exactas y
   números complejos, usando Algebra (matematicas/algebra.js).
   ===================================================================== */
const Matrices = (() => {
  const A_ = Algebra, { html, htmlP, htmlF, matHtml } = A_;
  const OPS = {
    det: { nombre: 'Determinante', cuadrada: true, metodos: [['gauss', 'Por Gauss (triangular)'], ['directo', 'Sarrus o Laplace']] },
    inversa: { nombre: 'Inversa', cuadrada: true, metodos: [['gauss', 'Por Gauss-Jordan'], ['adjuntos', 'Por adjuntos']] },
    rango: { nombre: 'Rango' },
    gauss: { nombre: 'Escalonar (Gauss)' },
    reducida: { nombre: 'Escalonada reducida (Gauss-Jordan)' },
    propios: { nombre: 'Valores y vectores propios', cuadrada: true },
    traspuesta: { nombre: 'Traspuesta' },
    suma: { nombre: 'A + B', B: true },
    resta: { nombre: 'A − B', B: true },
    producto: { nombre: 'A · B', B: true },
    escalar: { nombre: 'k · A', k: true },
    potencia: { nombre: 'Aⁿ', cuadrada: true, n: true },
  };
  const pasosGauss = (pasos, opts = {}) => pasos.map((p) => ({ t: p.ops.join(', &nbsp;'), html: matHtml(p.M, { barra: opts.barra ?? p.barra, marca: p.piv }) }));
  const dims = (M) => `${M.length}×${M[0].length}`;

  /* ---------- Determinante ---------- */
  function detGauss(A) {
    const n = A.length, e = A_.escalonar(A), pasos = [{ t: 'Matriz', html: matHtml(A, { det: true }) }, ...pasosGauss(e.pasos)];
    if (e.rango < n) {
      pasos.push({ t: 'Resultado', html: `Al escalonar queda una fila de ceros, así que |A| = <b>0</b> (la matriz no tiene inversa).` });
      return { valor: A_.c0, pasos };
    }
    const d = A_.determinante(A), diag = e.R.map((f, i) => htmlF(f[i])).join('·');
    pasos.push({ t: 'Resultado', html: `Sumar a una fila un múltiplo de otra no cambia el determinante${e.cambios ? `, y cada intercambio de filas le cambia el signo (${e.cambios} ${e.cambios === 1 ? 'intercambio' : 'intercambios'})` : ''}. El de una matriz triangular es el producto de la diagonal:<br>|A| = ${e.cambios % 2 ? '−' : ''}${diag} = <b>${html(d)}</b>` });
    return { valor: d, pasos };
  }
  function detDirecto(A) {
    const n = A.length, pasos = [];
    const t = (i, j) => A[i][j];
    const prod = (...xs) => xs.map(htmlF).join('·');
    if (n === 1) return { valor: A[0][0], pasos: [{ t: 'Resultado', html: `|A| = <b>${html(A[0][0])}</b>` }] };
    if (n === 2) {
      const d = A_.determinante(A);
      pasos.push({ t: 'Regla del 2×2', html: `${matHtml(A, { det: true })} = a<sub>11</sub>a<sub>22</sub> − a<sub>12</sub>a<sub>21</sub> = ${prod(t(0, 0), t(1, 1))} − ${prod(t(0, 1), t(1, 0))} = <b>${html(d)}</b>` });
      return { valor: d, pasos };
    }
    if (n === 3) {
      const mas = [[[0, 0], [1, 1], [2, 2]], [[0, 1], [1, 2], [2, 0]], [[0, 2], [1, 0], [2, 1]]], men = [[[0, 2], [1, 1], [2, 0]], [[0, 0], [1, 2], [2, 1]], [[0, 1], [1, 0], [2, 2]]];
      const val = (g) => g.reduce((s, [i, j]) => A_.mul(s, t(i, j)), A_.c1);
      const vm = mas.map(val), vn = men.map(val), d = A_.resta(vm.reduce(A_.suma), vn.reduce(A_.suma));
      pasos.push({ t: 'Regla de Sarrus', html: `${matHtml(A, { det: true })} = ${mas.map((g) => prod(...g.map(([i, j]) => t(i, j)))).join(' + ')} − ${men.map((g) => prod(...g.map(([i, j]) => t(i, j)))).join(' − ')}` });
      pasos.push({ t: 'Productos', html: `= (${vm.map(html).join(') + (')}) − (${vn.map(html).join(') − (')}) = <b>${html(d)}</b>` });
      return { valor: d, pasos };
    }
    // Laplace por la fila o columna con más ceros
    let mejor = { ceros: -1 };
    for (let i = 0; i < n; i++) { const c = A[i].filter(A_.esCero).length; if (c > mejor.ceros) mejor = { ceros: c, fila: true, k: i }; }
    for (let j = 0; j < n; j++) { const c = A.filter((f) => A_.esCero(f[j])).length; if (c > mejor.ceros) mejor = { ceros: c, fila: false, k: j }; }
    const pos = [...Array(n).keys()].map((l) => (mejor.fila ? [mejor.k, l] : [l, mejor.k]));
    const terminos = pos.filter(([i, j]) => !A_.esCero(t(i, j))).map(([i, j]) => ({ i, j, a: t(i, j), m: A_.menor(A, i, j), s: (i + j) % 2 ? '−' : '+' }));
    pasos.push({ t: `Desarrollo de Laplace por la ${mejor.fila ? 'fila' : 'columna'} ${mejor.k + 1}${mejor.ceros ? ` (tiene ${mejor.ceros} ${mejor.ceros === 1 ? 'cero' : 'ceros'})` : ''}`, html: `|A| = Σ (−1)<sup>i+j</sup> a<sub>ij</sub> |A<sub>ij</sub>| = ${terminos.map((x, k) => `${k ? ` ${x.s} ` : x.s === '−' ? '−' : ''}${htmlF(x.a)}·${matHtml(x.m, { det: true })}`).join('') || '0'}` });
    let d = A_.c0;
    const vals = terminos.map((x) => { const dm = A_.determinante(x.m); const v = A_.mul(x.a, dm); d = x.s === '+' ? A_.suma(d, v) : A_.resta(d, v); return `${x.s === '−' ? '−' : '+'} ${htmlF(x.a)}·${htmlF(dm)}`; });
    pasos.push({ t: `Cada menor de ${n - 1}×${n - 1}${n - 1 === 3 ? ' por Sarrus' : ''}`, html: `|A| = ${vals.join(' ').replace(/^\+ /, '').replace(/^− /, '−')} = <b>${html(d)}</b>` });
    return { valor: d, pasos };
  }

  /* ---------- Inversa ---------- */
  function invGauss(A) {
    const n = A.length, aug = A.map((f, i) => [...f, ...A_.identidad(n)[i]]);
    const e = A_.escalonar(aug, { reducida: true, columnas: n, barra: n });
    const pasos = [{ t: 'Se escribe [A | I] y se reduce hasta que a la izquierda quede la identidad', html: matHtml(aug, { barra: n }) }, ...pasosGauss(e.pasos)];
    if (e.rango < n) { pasos.push({ t: 'Resultado', html: `A la izquierda queda una fila de ceros: rang(A) = ${e.rango} < ${n}, así que |A| = 0 y <b>A no tiene inversa</b>.` }); return { valor: null, pasos }; }
    const inv = e.R.map((f) => f.slice(n));
    pasos.push({ t: 'Resultado: la parte derecha es la inversa', html: `A<sup>−1</sup> = ${matHtml(inv)}` });
    return { valor: inv, pasos };
  }
  function invAdjuntos(A) {
    const n = A.length, d = A_.determinante(A), pasos = [{ t: 'Determinante', html: `|A| = <b>${html(d)}</b>` }];
    if (A_.esCero(d)) { pasos.push({ t: 'Resultado', html: '|A| = 0, así que <b>A no tiene inversa</b>.' }); return { valor: null, pasos }; }
    if (n === 1) { const inv = [[A_.div(A_.c1, A[0][0])]]; pasos.push({ t: 'Resultado', html: `A<sup>−1</sup> = ${matHtml(inv)}` }); return { valor: inv, pasos }; }
    const adj = A.map((f, i) => f.map((_, j) => A_.cofactor(A, i, j)));
    pasos.push({ t: 'Matriz adjunta: cada elemento es su adjunto A<sub>ij</sub> = (−1)<sup>i+j</sup>·|menor|', html: `${n <= 3 ? `Por ejemplo, A<sub>11</sub> = +${matHtml(A_.menor(A, 0, 0), { det: true })} = ${html(adj[0][0])}${n > 1 ? `, A<sub>12</sub> = −${matHtml(A_.menor(A, 0, 1), { det: true })} = ${html(adj[0][1])}` : ''}.<br>` : ''}Adj(A) = ${matHtml(adj)}` });
    const adjT = A_.traspuesta(adj);
    pasos.push({ t: 'Se traspone', html: `(Adj A)<sup>t</sup> = ${matHtml(adjT)}` });
    const inv = adjT.map((f) => f.map((x) => A_.div(x, d)));
    pasos.push({ t: 'Resultado', html: `A<sup>−1</sup> = (1 / |A|)·(Adj A)<sup>t</sup> = (1 / ${htmlP(d)})·${matHtml(adjT)} = ${matHtml(inv)}` });
    return { valor: inv, pasos };
  }

  /* ---------- Valores y vectores propios ---------- */
  function propios(A) {
    const n = A.length, p = A_.caracteristico(A), pasos = [];
    // |A − λI| = (−1)^n det(λI − A)
    const pc = n % 2 ? p.map(A_.neg) : p;
    const AL = A.map((f, i) => f.map((x, j) => (i === j ? `${html(x) === '0' ? '' : html(x) + ' '}−&nbsp;λ` : html(x))));
    pasos.push({ t: 'Polinomio característico', html: `|A − λI| = <span class="mat det"><table>${AL.map((f) => `<tr>${f.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</table></span> = <b>${A_.polHtml(pc)}</b>` });
    const r = A_.raices(p), vals = [];
    const fac = r.exactas.map(({ valor, mult }) => { const [s, v] = A_.signo(A_.neg(valor)); return `(λ ${s} ${v})${mult > 1 ? `<sup>${mult}</sup>` : ''}`; });
    if (r.resto.length > 1) fac.push(`(${A_.polHtml(r.resto)})`);
    if (r.exactas.length) pasos.push({ t: 'Raíces del polinomio', html: `|A − λI| = ${n % 2 ? '−' : ''}${fac.join('')} = 0` });
    const orden = (a, b) => A_.qnum(a.valor.re) - A_.qnum(b.valor.re) || A_.qnum(b.valor.im) - A_.qnum(a.valor.im);
    for (const { valor, mult } of r.exactas.slice().sort(orden)) vals.push({ valor, mult, exacto: true });
    // resto de grado 2 con coeficientes reales: λ = (p ± q√r)/d
    let radicales = null, aprox = r.aprox.slice();
    if (r.resto.length === 3 && r.resto.every(A_.esReal)) {
      const [a, b, c] = r.resto.map((x) => x.re), D = A_.Q(b.n * b.n * a.d * a.d * c.d - 4n * a.n * c.n * b.d * b.d * a.d, b.d * b.d * a.d * a.d * c.d);
      const rq = A_.raizHtml(D.n < 0n ? { n: -D.n, d: D.d } : D);
      if (rq) {
        // −b/(2a) y (rq.a/rq.b)/(2a) con el mismo denominador
        const m = A_.div(A_.C(A_.Q(-b.n, b.d)), A_.C(A_.Q(2n * a.n, a.d))).re, k = A_.div(A_.C(A_.Q(rq.a, rq.b)), A_.C(A_.Q(2n * a.n, a.d))).re;
        const kp = k.n < 0n ? { n: -k.n, d: k.d } : k, L = (m.d * kp.d) / ((x, y) => { while (y) [x, y] = [y, x % y]; return x; })(m.d, kp.d);
        const p0 = (m.n * L) / m.d, q = (kp.n * L) / kp.d, im = D.n < 0n ? ' i' : '';
        const cuerpo = (sg) => `${p0 ? String(p0).replace('-', '−') + ` ${sg} ` : sg === '−' ? '−' : ''}${q === 1n ? '' : q}√${rq.dentro}${im}`;
        const forma = (sg) => (L === 1n ? cuerpo(sg) : `(${cuerpo(sg)})/${L}`);
        radicales = { mas: forma('+'), menos: forma('−'), ambos: L === 1n ? cuerpo('±') : `(${cuerpo('±')})/${L}` };
        pasos.push({ t: 'El factor de segundo grado no tiene raíces racionales', html: `${A_.polHtml(r.resto)} = 0 ⇒ λ = (−b ± √(b<sup>2</sup> − 4ac)) / (2a) = <b>${radicales.ambos}</b>` });
        // la raíz «+» es la de mayor parte real (o imaginaria si son complejas)
        aprox.sort((x, y) => (D.n < 0n ? y.im - x.im : y.re - x.re));
      }
    }
    aprox.forEach((z, i) => vals.push({ valor: z, mult: 1, exacto: false, etiqueta: radicales ? (i ? radicales.menos : radicales.mas) : null }));
    if (r.resto.length > 1 && !radicales) pasos.push({ t: 'Raíces no racionales', html: `Las raíces de ${A_.polHtml(r.resto)} se calculan numéricamente: λ ≈ ${r.aprox.map((z) => A_.decimalC(z, 6)).join(', ')}` });
    const multTxt = (m) => ({ 2: 'doble', 3: 'triple' }[m] || `multiplicidad ${m}`);
    const etq = (v) => (v.exacto ? html(v.valor) : v.etiqueta ? `${v.etiqueta} ≈ ${A_.decimalC(v.valor, 5)}` : '≈ ' + A_.decimalC(v.valor, 6));
    const lista = vals.map((v) => `${etq(v)}${v.mult > 1 ? ` (${multTxt(v.mult)})` : ''}`);
    pasos.push({ t: 'Valores propios', html: `λ = <b>${lista.join(', &nbsp;')}</b>` });
    // vectores propios de los valores exactos
    const esp = [];
    for (const v of vals.filter((x) => x.exacto)) {
      const M = A_.restaM(A, A_.escalar(v.valor, A_.identidad(n))), N = A_.nucleo(M);
      esp.push({ ...v, base: N.base });
      const [s, vv] = A_.signo(A_.neg(v.valor));
      pasos.push({ t: `Vectores propios de λ = ${html(v.valor)}`, html: `(A ${s === '+' ? '+' : '−'} ${vv.replace(/^\((.*)\)$/, '($1)')}I) x = 0: ${matHtml(M)} → ${matHtml(N.R)}<br>dim = ${N.base.length}${v.mult > 1 ? ` (multiplicidad algebraica ${v.mult})` : ''}; base: ${N.base.map((b) => A_.vecHtml(b)).join(' ')}` });
    }
    const todos = vals.every((x) => x.exacto);
    let diag;
    if (todos) {
      diag = esp.every((x) => x.base.length === x.mult);
      if (diag) {
        const P = A_.traspuesta(esp.flatMap((x) => x.base)), D = esp.flatMap((x) => Array(x.mult).fill(x.valor)).map((x, i, arr) => arr.map((_, j) => (i === j ? x : A_.c0)));
        pasos.push({ t: 'Es diagonalizable', html: `Cada valor propio tiene tantos vectores como su multiplicidad. Con los vectores en columnas, A = P D P<sup>−1</sup>:<br>P = ${matHtml(P)}, &nbsp; D = ${matHtml(D)}` });
      } else pasos.push({ t: 'No es diagonalizable', html: `Algún valor propio tiene menos vectores propios independientes que su multiplicidad.` });
    } else {
      diag = vals.every((x) => x.mult === 1) ? true : null;
      if (diag) pasos.push({ t: 'Es diagonalizable', html: `Los ${n} valores propios son distintos, así que es diagonalizable${A_.esRealM(A) && vals.some((x) => !x.exacto && Math.abs(x.valor.im) > 1e-9) ? ' (en los complejos)' : ''}. Los vectores propios de las raíces no racionales no se calculan de forma exacta aquí.` });
    }
    return { valor: vals, pasos, diag, polinomio: pc };
  }

  /* ---------- Resolución ---------- */
  function resolver(sc) {
    const op = OPS[sc.op] ? sc.op : 'det', O = OPS[op];
    const A = A_.leerMatriz(sc.A);
    if (!A.length || !A[0].length) throw new Error('La matriz está vacía');
    if (O.cuadrada && A.length !== A[0].length) throw new Error(`${O.nombre}: la matriz tiene que ser cuadrada (es ${dims(A)})`);
    let B = null;
    if (O.B) B = (() => { try { return A_.leerMatriz(sc.B); } catch (e) { throw new Error('Matriz B · ' + e.message); } })();
    const metodo = O.metodos ? (O.metodos.some(([k]) => k === sc.metodo) ? sc.metodo : O.metodos[0][0]) : null;
    let r;
    switch (op) {
      case 'det': r = metodo === 'directo' ? detDirecto(A) : detGauss(A); r.res = `|A| = ${html(r.valor)}`; break;
      case 'inversa': r = metodo === 'adjuntos' ? invAdjuntos(A) : invGauss(A); r.res = r.valor ? `A<sup>−1</sup> = ${matHtml(r.valor)}` : 'A no tiene inversa (|A| = 0)'; break;
      case 'rango': case 'gauss': case 'reducida': {
        const e = A_.escalonar(A, { reducida: op === 'reducida' });
        r = { valor: op === 'rango' ? e.rango : e.R, pasos: [{ t: 'Matriz', html: matHtml(A) }, ...pasosGauss(e.pasos)] };
        if (!e.pasos.length) r.pasos.push({ t: 'Ya está escalonada', html: 'No hace falta ninguna operación.' });
        r.pasos.push({ t: 'Resultado', html: op === 'rango' ? `Quedan ${e.rango} ${e.rango === 1 ? 'fila no nula' : 'filas no nulas'} (los pivotes están en las columnas ${e.pivotes.map(([, c]) => c + 1).join(', ') || '—'}): rang(A) = <b>${e.rango}</b>` : `${matHtml(e.R)}, con rango ${e.rango}` });
        r.res = op === 'rango' ? `rang(A) = ${e.rango}` : matHtml(e.R);
        break;
      }
      case 'propios': r = propios(A); r.res = `λ = ${r.valor.map((v) => (v.exacto ? html(v.valor) : v.etiqueta || '≈ ' + A_.decimalC(v.valor, 5))).join(', &nbsp;')}`; break;
      case 'traspuesta': { const T = A_.traspuesta(A); r = { valor: T, pasos: [{ t: 'Las filas pasan a ser columnas', html: `A<sup>t</sup> = ${matHtml(T)} (de ${dims(A)} a ${dims(T)})` }] }; r.res = matHtml(T); break; }
      case 'suma': case 'resta': {
        if (A.length !== B.length || A[0].length !== B[0].length) throw new Error(`Para ${op === 'suma' ? 'sumar' : 'restar'}, A y B deben tener el mismo tamaño (A es ${dims(A)} y B es ${dims(B)})`);
        const S = op === 'suma' ? A_.sumaM(A, B) : A_.restaM(A, B);
        r = { valor: S, pasos: [{ t: 'Elemento a elemento', html: `${matHtml(A)} ${op === 'suma' ? '+' : '−'} ${matHtml(B)} = ${matHtml(S)}` }] }; r.res = matHtml(S); break;
      }
      case 'producto': {
        if (A[0].length !== B.length) throw new Error(`Para multiplicar A·B, las columnas de A (${A[0].length}) tienen que ser tantas como las filas de B (${B.length})`);
        const P = A_.producto(A, B), pasos = [{ t: `Tamaño: (${dims(A)})·(${dims(B)}) = ${dims(P)}`, html: `Cada elemento c<sub>ij</sub> es la fila i de A por la columna j de B.` }];
        if (P.length * P[0].length <= 16) pasos.push({ t: 'Elementos', html: P.map((f, i) => f.map((x, j) => `c<sub>${i + 1}${j + 1}</sub> = ${A[i].map((a, k) => `${htmlF(a)}·${htmlF(B[k][j])}`).join(' + ')} = ${html(x)}`).join('<br>')).join('<br>') });
        pasos.push({ t: 'Resultado', html: `A·B = ${matHtml(P)}` });
        r = { valor: P, pasos }; r.res = matHtml(P); break;
      }
      case 'escalar': {
        let k; try { k = A_.leer(sc.k); } catch (e) { throw new Error('k · ' + e.message); }
        const S = A_.escalar(k, A); r = { valor: S, pasos: [{ t: 'Se multiplica cada elemento por k', html: `${htmlP(k)}·${matHtml(A)} = ${matHtml(S)}` }] }; r.res = matHtml(S); break;
      }
      case 'potencia': {
        const n = Number(String(sc.n).trim().replace('−', '-'));
        if (!Number.isInteger(n) || Math.abs(n) > 50) throw new Error('El exponente n tiene que ser un número entero entre −50 y 50');
        const pasos = [];
        let base = A;
        if (n < 0) { const inv = invGauss(A); if (!inv.valor) throw new Error('A no tiene inversa, así que no se puede elevar a un exponente negativo'); base = inv.valor; pasos.push({ t: 'Exponente negativo', html: `A<sup>${n}</sup> = (A<sup>−1</sup>)<sup>${-n}</sup>, con A<sup>−1</sup> = ${matHtml(base)}` }); }
        let P = A_.identidad(A.length);
        for (let k = 1; k <= Math.abs(n); k++) { P = A_.producto(P, base); if (Math.abs(n) <= 5 && k > 1) pasos.push({ t: `A<sup>${n < 0 ? -k : k}</sup> = A<sup>${n < 0 ? -(k - 1) : k - 1}</sup>·A${n < 0 ? '<sup>−1</sup>' : ''}`, html: matHtml(P) }); }
        if (n === 0) pasos.push({ t: 'Exponente 0', html: `A<sup>0</sup> = I = ${matHtml(P)}` });
        else pasos.push({ t: 'Resultado', html: `A<sup>${n}</sup> = ${matHtml(P)}` });
        r = { valor: P, pasos }; r.res = matHtml(P); break;
      }
    }
    return { op, metodo, A, B, ...r };
  }

  const M = (...filas) => filas.map((f) => f.split(' '));
  const ejemplos = [
    { clave: 'det3', nombre: 'Determinante 3×3 por Sarrus', sc: { op: 'det', metodo: 'directo', A: M('2 1 3', '0 -1 4', '1 2 5') } },
    { clave: 'det4', nombre: 'Determinante 4×4 por Laplace', sc: { op: 'det', metodo: 'directo', A: M('1 0 2 -1', '3 0 0 5', '2 1 4 -3', '1 0 5 0') } },
    { clave: 'det-gauss', nombre: 'Determinante por Gauss', sc: { op: 'det', metodo: 'gauss', A: M('2 4 -2', '1 3 1', '3 1 2') } },
    { clave: 'inv3', nombre: 'Inversa 3×3 por Gauss-Jordan', sc: { op: 'inversa', metodo: 'gauss', A: M('1 2 3', '0 1 4', '5 6 0') } },
    { clave: 'inv-adj', nombre: 'Inversa por adjuntos', sc: { op: 'inversa', metodo: 'adjuntos', A: M('2 0 1', '1 1 0', '0 1 3') } },
    { clave: 'inv-complejos', nombre: 'Inversa de una matriz compleja', sc: { op: 'inversa', metodo: 'gauss', A: M('1 i', '-i 2') } },
    { clave: 'rango', nombre: 'Rango de una matriz 3×4', sc: { op: 'rango', A: M('1 2 -1 3', '2 4 1 0', '3 6 0 3') } },
    { clave: 'reducida', nombre: 'Escalonada reducida', sc: { op: 'reducida', A: M('2 4 6 8', '1 3 5 7', '1 1 1 2') } },
    { clave: 'propios2', nombre: 'Valores y vectores propios 2×2', sc: { op: 'propios', A: M('4 1', '2 3') } },
    { clave: 'diagonalizar', nombre: 'Diagonalizar una matriz 3×3', sc: { op: 'propios', A: M('2 0 0', '0 3 4', '0 4 -3') } },
    { clave: 'rotacion', nombre: 'Valores propios complejos (giro)', sc: { op: 'propios', A: M('0 -1', '1 0') } },
    { clave: 'producto', nombre: 'Producto de matrices', sc: { op: 'producto', A: M('1 2 0', '-1 3 2'), B: M('2 1', '0 -1', '4 3') } },
    { clave: 'potencia', nombre: 'Potencia de una matriz', sc: { op: 'potencia', A: M('1 1', '0 1'), n: '5' } },
  ];

  return { OPS, resolver, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = Matrices;
