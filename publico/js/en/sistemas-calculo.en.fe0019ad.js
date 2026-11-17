const Sistemas = (() => {
  const A_ = Algebra, { html, htmlF, matHtml } = A_;
  const METODOS = [['gauss', 'Gauss'], ['jordan', 'Gauss-Jordan'], ['cramer', 'Cramer\'s rule'], ['inversa', 'Inverse matrix'], ['reduccion', 'Elimination'], ['igualacion', 'Equating'], ['sustitucion', 'Substitution']];
  const CLASICOS = { reduccion: 'elimination', igualacion: 'equating', sustitucion: 'substitution' };
  const PARAMS = ['λ', 'μ', 'ν', 'α', 'β', 'γ', 'δ'];
  const P_ = typeof Parametro !== 'undefined' ? Parametro : typeof require !== 'undefined' ? require('../matematicas/parametro.js') : null;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function nombres(n, propios) {
    const p = String(propios ?? '').split(/[,;\s]+/).map((t) => t.trim()).filter(Boolean);
    if (p.length) {
      if (p.length !== n) throw new Error(`You have typed ${p.length} unknown ${p.length === 1 ? 'name' : 'names'} and there are ${n}`);
      if (new Set(p).size !== n) throw new Error('There are repeated unknown names');
      return p.map((t) => esc(t).replace(/^(.*?[^\d_])_?(\d+)$/, '$1<sub>$2</sub>'));
    }
    return n <= 4 ? ['x', 'y', 'z', 't'].slice(0, n) : Array.from({ length: n }, (_, i) => `x<sub>${i + 1}</sub>`);
  }

  function combinacion(terminos, constante = null) {
    let s = '';
    const pon = (sg, v) => { s += s ? ` ${sg} ${v}` : `${sg === '−' ? '−' : ''}${v}`; };
    if (constante && !A_.esCero(constante)) s = html(constante);
    for (const [a, x] of terminos) {
      if (A_.esCero(a)) continue;
      const [sg, v] = A_.signo(a);
      pon(sg, A_.esUno(a) || A_.esUno(A_.neg(a)) ? x : `${v}${x}`);
    }
    return s || '0';
  }
  const ecuacion = (fila, vars) => `${combinacion(fila.slice(0, -1).map((a, j) => [a, vars[j]]))} = ${html(fila[fila.length - 1])}`;
  const sistemaHtml = (M, vars) => `<span class="sis">${M.map((f) => `<span>${ecuacion(f, vars)}</span>`).join('')}</span>`;

  const { c0, suma, resta, mul, div, neg, esCero, esUno } = A_;
  const ecH = (e, vars) => `<span class="et">(${e.et})</span> ${combinacion(e.a.map((x, j) => [x, vars[j]]))} = ${html(e.b)}`;
  const despeja = (e, p) => ({ c: div(e.b, e.a[p]), k: e.a.map((x, j) => (j === p ? c0 : neg(div(x, e.a[p])))) });
  const exprH = (E, vars) => combinacion(E.k.map((x, j) => [x, vars[j]]), E.c);
  const sustituye = (e, p, E, et) => ({ a: e.a.map((x, j) => (j === p ? c0 : suma(x, mul(e.a[p], E.k[j])))), b: resta(e.b, mul(e.a[p], E.c)), et });
  const unidad = (x) => esUno(x) || esUno(neg(x));
  function elige(eqs, act) {
    let mejor = null;
    for (const p of act) for (let r = 0; r < eqs.length; r++) {
      if (esCero(eqs[r].a[p])) continue;
      const nota = (unidad(eqs[r].a[p]) ? 10 : 0) + eqs.filter((e) => !esCero(e.a[p])).length;
      if (!mejor || nota > mejor.nota) mejor = { p, r, nota };
    }
    return mejor;
  }
  const entero = (x) => A_.esReal(x) && x.re.d === 1n ? x.re.n : null;
  function clasicoResolver(eqs, act, metodo, vars, pasos, cont) {
    const nueva = () => String(++cont.k);
    if (act.length === 1) {
      const p = act[0], e = eqs.find((q) => !esCero(q.a[p])), v = div(e.b, e.a[p]);
      pasos.push({ t: `${vars[p]} is solved for`, html: `${ecH(e, vars)} &nbsp;⇒&nbsp; ${vars[p]} = ${unidad(e.a[p]) && esUno(e.a[p]) ? '' : `${htmlF(e.b)} / ${htmlF(e.a[p])} = `}<b>${html(v)}</b>` });
      return { [p]: v };
    }
    let p, base, E, resto;
    if (metodo === 'sustitucion') {
      const el = elige(eqs, act); p = el.p; base = eqs[el.r]; E = despeja(base, p);
      pasos.push({ t: `${vars[p]} is solved for from equation (${base.et})`, html: `${ecH(base, vars)} &nbsp;⇒&nbsp; ${vars[p]} = ${exprH(E, vars)}` });
      resto = eqs.filter((q) => q !== base).map((q) => {
        const nq = sustituye(q, p, E, nueva());
        const escrita = combinacion(q.a.map((x, j) => [x, j === p ? `(${exprH(E, vars)})` : vars[j]]));
        return { nq, linea: `In (${q.et}): ${escrita} = ${html(q.b)} &nbsp;⇒&nbsp; ${ecH(nq, vars)}` };
      });
      pasos.push({ t: `${vars[p]} is substituted into ${resto.length === 1 ? 'the other equation' : 'the other equations'}`, html: resto.map((x) => x.linea).join('<br>') });
      resto = resto.map((x) => x.nq);
    } else if (metodo === 'igualacion') {
      const el = elige(eqs, act); p = el.p;
      const con = eqs.filter((q) => !esCero(q.a[p])), sin = eqs.filter((q) => esCero(q.a[p])), Es = con.map((q) => despeja(q, p));
      base = con[0]; E = Es[0];
      pasos.push({ t: `${vars[p]} is solved for in ${con.length === 2 ? 'both equations' : 'each equation'}`, html: con.map((q, i) => `${ecH(q, vars)} &nbsp;⇒&nbsp; ${vars[p]} = ${exprH(Es[i], vars)}`).join('<br>') });
      resto = [];
      const lineas = Es.slice(1).map((Ei, i) => {
        const nq = { a: E.k.map((x, j) => resta(x, Ei.k[j])), b: resta(Ei.c, E.c), et: nueva() };
        resto.push(nq);
        return `${exprH(E, vars)} = ${exprH(Ei, vars)} &nbsp;⇒&nbsp; ${ecH(nq, vars)}`;
      });
      resto.push(...sin);
      pasos.push({ t: `The expressions for ${vars[p]} are equated`, html: lineas.join('<br>') + (sin.length ? `<br>Equation (${sin.map((q) => q.et).join(', ')}) has no ${vars[p]} and is carried over unchanged.` : '') });
    } else {
      const el = elige(eqs, act); p = el.p; base = eqs[el.r];
      resto = [];
      const lineas = [];
      for (const q of eqs) {
        if (q === base) continue;
        if (esCero(q.a[p])) { resto.push(q); continue; }
        let k1 = base.a[p], k2 = q.a[p];
        const e1 = entero(k1), e2 = entero(k2);
        if (e1 !== null && e2 !== null) { let a = e1 < 0n ? -e1 : e1, b = e2 < 0n ? -e2 : e2; while (b) [a, b] = [b, a % b]; k1 = A_.ent(Number(e1 / a)); k2 = A_.ent(Number(e2 / a)); }
        if (A_.esReal(k1) && k1.re.n < 0n) { k1 = neg(k1); k2 = neg(k2); }
        const nq = { a: q.a.map((x, j) => resta(mul(k1, x), mul(k2, base.a[j]))), b: resta(mul(k1, q.b), mul(k2, base.b)), et: nueva() };
        const fac = (k, et) => (esUno(k) ? `(${et})` : `${htmlF(k)}·(${et})`), resta2 = A_.esReal(k2) && k2.re.n < 0n;
        lineas.push(`${fac(k1, q.et)} ${resta2 ? '+' : '−'} ${fac(resta2 ? neg(k2) : k2, base.et)}: &nbsp; ${ecH(nq, vars)}`);
        resto.push(nq);
      }
      pasos.push({ t: `Elimination: ${vars[p]} is eliminated by combining with equation (${base.et})`, html: `${ecH(base, vars)}<br>${lineas.join('<br>')}` });
    }
    const val = clasicoResolver(resto, act.filter((j) => j !== p), metodo, vars, pasos, cont);
    if (!E) E = despeja(base, p);
    let v = E.c;
    for (const [j, x] of Object.entries(val)) v = suma(v, mul(E.k[j], x));
    const conocidos = Object.entries(val).map(([j, x]) => `${vars[j]} = ${html(x)}`).join(', ');
    pasos.push({ t: `${vars[p]} is computed`, html: `${metodo === 'reduccion' ? `From (${base.et}): ` : ''}${vars[p]} = ${exprH(E, vars)}, with ${conocidos} &nbsp;⇒&nbsp; ${vars[p]} = <b>${html(v)}</b>` });
    return { ...val, [p]: v };
  }

  function resolver(sc) {
    const m = sc.M.length, n = sc.M[0].length - 1;
    if (n < 1) throw new Error('At least one unknown is needed');
    const letra = P_ ? P_.letraDe(sc.M.flat()) : null;
    if (letra) return resolverParam(sc, letra);
    return resolverNum(A_.leerMatriz(sc.M), sc);
  }
  function resolverNum(M, sc, evita = null) {
    const m = M.length, n = M[0].length - 1;
    const PARAM = PARAMS.filter((p) => p !== evita);
    const A = M.map((f) => f.slice(0, n)), vars = nombres(n, sc.vars);
    const metodo = METODOS.some(([k]) => k === sc.metodo) ? sc.metodo : 'gauss';
    const pasos = [{ t: 'System', html: sistemaHtml(M, vars) }, { t: 'Augmented matrix A* = [A | b]', html: matHtml(M, { barra: n }) }];
    const e = A_.escalonar(M, { reducida: metodo === 'jordan', columnas: n, barra: n });
    const rA = e.rango, rAmp = e.R.some((f, i) => i >= rA && !A_.esCero(f[n])) ? rA + 1 : rA;
    const tipo = rA < rAmp ? 'SI' : rA === n ? 'SCD' : 'SCI';
    const TIPOS = { SCD: 'consistent and determined: a single solution', SCI: `consistent and indeterminate: infinitely many solutions with ${n - rA} ${n - rA === 1 ? 'parameter' : 'parameters'}`, SI: 'inconsistent: no solution' };
    const clasico = !!CLASICOS[metodo], aplicable = tipo === 'SCD' && m === n && (n === 2 || n === 3);
    const usaGauss = metodo === 'gauss' || metodo === 'jordan' || tipo !== 'SCD' || m !== n || (clasico && !aplicable);
    if (usaGauss) pasos.push(...e.pasos.map((p) => ({ t: p.ops.join(', &nbsp;'), html: matHtml(p.M, { barra: n, marca: p.piv }) })));
    else {
      pasos.push({ t: 'Determinant of A', html: `|A| = <b>${html(A_.determinante(A))}</b> ≠ 0` });
    }
    pasos.push({ t: 'Rouché-Frobenius theorem', html: `rank(A) = ${rA}, &nbsp; rank(A*) = ${rAmp}, &nbsp; no. of unknowns = ${n}${tipo === 'SI' ? ` <br>A row ends up 0 = ${html(e.R.find((f, i) => i >= rA && !A_.esCero(f[n]))[n])}, which is impossible.` : ''}<br>rank(A) ${rA === rAmp ? '=' : '≠'} rank(A*)${rA === rAmp ? ` ${rA === n ? '=' : '&lt;'} n` : ''} ⇒ system <b>${TIPOS[tipo]}</b>` });
    if ((metodo === 'cramer' || metodo === 'inversa') && (tipo !== 'SCD' || m !== n)) pasos.push({ t: `${metodo === 'cramer' ? 'Cramer' : 'The inverse matrix'} cannot be used`, html: `${m !== n ? 'The coefficient matrix is not square' : '|A| = 0'}; it is solved by Gauss.` });
    if (clasico && !aplicable) pasos.push({ t: `${CLASICOS[metodo]} is not used`, html: `The ${CLASICOS[metodo]} method is used with systems of 2 or 3 equations and unknowns with a unique solution${tipo !== 'SCD' ? ', and this one does not have it' : ''}; it is solved by Gauss.` });
    let sol = null, param = null;
    if (tipo !== 'SI') {
      const R = metodo === 'jordan' ? e.R : A_.escalonar(M, { reducida: true, columnas: n }).R;
      const piv = A_.escalonar(M, { reducida: true, columnas: n }).pivotes, pc = piv.map(([, c]) => c);
      const libres = [...Array(n).keys()].filter((c) => !pc.includes(c));
      const P = Object.fromEntries(libres.map((c, k) => [c, PARAM[k] || `p<sub>${k + 1}</sub>`]));
      sol = Array.from({ length: n }, (_, j) => ({ c: A_.c0, t: libres.map((l) => [l === j ? A_.c1 : A_.c0, P[l]]) }));
      piv.forEach(([r, c]) => { sol[c] = { c: R[r][n], t: libres.map((l) => [A_.neg(R[r][l]), P[l]]) }; });
      param = libres.map((l) => P[l]);
      if (tipo === 'SCD' && metodo === 'cramer' && m === n) {
        const d = A_.determinante(A);
        const lineas = vars.map((v, j) => {
          const Aj = A.map((f, i) => f.map((x, k) => (k === j ? M[i][n] : x))), dj = A_.determinante(Aj);
          return `${v} = |A<sub>${j + 1}</sub>| / |A| = ${matHtml(Aj, { det: true })} / ${htmlF(d)} = ${htmlF(dj)} / ${htmlF(d)} = <b>${html(A_.div(dj, d))}</b>`;
        });
        pasos.push({ t: 'Cramer\'s rule: each unknown is |A<sub>i</sub>| / |A|, with column i replaced by b', html: lineas.join('<br>') });
      } else if (tipo === 'SCD' && metodo === 'inversa' && m === n) {
        const aug = A.map((f, i) => [...f, ...A_.identidad(n)[i]]), inv = A_.escalonar(aug, { reducida: true, columnas: n }).R.map((f) => f.slice(n));
        const b = M.map((f) => [f[n]]);
        pasos.push({ t: 'Inverse of A (Gauss-Jordan)', html: `A<sup>−1</sup> = ${matHtml(inv)}` });
        pasos.push({ t: 'X = A<sup>−1</sup> b', html: `${matHtml(inv)} · ${matHtml(b)} = <b>${matHtml(A_.producto(inv, b))}</b>` });
      } else if (clasico && aplicable) {
        const val = clasicoResolver(M.map((f, i) => ({ a: f.slice(0, n), b: f[n], et: String(i + 1) })), [...Array(n).keys()], metodo, vars, pasos, { k: m });
        if (!vars.every((_, j) => A_.igual(val[j], sol[j].c))) throw new Error(`The ${CLASICOS[metodo]} method does not give the same solution as Gauss`);
      } else if (metodo === 'gauss' || clasico) {
        const lineas = [];
        const conocidos = {};
        libres.forEach((l) => { conocidos[l] = sol[l]; });
        for (let k = e.pivotes.length - 1; k >= 0; k--) {
          const [r, c] = e.pivotes[k], f = e.R[r], resto = [];
          for (let j = c + 1; j < n; j++) if (!A_.esCero(f[j])) resto.push(j);
          const ec = `${combinacion([[f[c], vars[c]], ...resto.map((j) => [f[j], vars[j]])])} = ${html(f[n])}`;
          const valor = combinacion(sol[c].t, sol[c].c);
          lineas.push(`${ec} &nbsp;⇒&nbsp; ${vars[c]} = <b>${valor}</b>`);
        }
        if (libres.length) lineas.unshift(`The unknowns without a pivot are parameters: ${libres.map((l) => `${vars[l]} = ${P[l]}`).join(', ')}`);
        pasos.push({ t: 'Back substitution (from the last equation to the first)', html: lineas.join('<br>') });
      } else {
        pasos.push({ t: 'The solution is read from the reduced matrix', html: `${sistemaHtml(R.filter((f) => f.some((x) => !A_.esCero(x))), vars)}${libres.length ? `<br>With ${libres.map((l) => `${vars[l]} = ${P[l]}`).join(', ')}:` : ''}` });
      }
      pasos.push({ t: tipo === 'SCD' ? 'Solution' : 'Solution in parametric form', html: `${vars.map((v, j) => `${v} = <b>${combinacion(sol[j].t, sol[j].c)}</b>`).join(', &nbsp;')}${param.length ? `, &nbsp;with ${param.join(', ')} ∈ ${M.flat().every(A_.esReal) ? 'ℝ' : 'ℂ'}` : ''}` });
      const x0 = sol.map((s) => s.c), ok = M.every((f) => A_.igual(f.slice(0, n).reduce((s, a, j) => A_.suma(s, A_.mul(a, x0[j])), A_.c0), f[n]));
      if (!ok) throw new Error('The check of the solution has failed');
      if (tipo === 'SCD') pasos.push({ t: 'Check', html: M.map((f) => `${f.slice(0, n).map((a, j) => (A_.esCero(a) ? null : `${htmlF(a)}·${htmlF(x0[j])}`)).filter(Boolean).join(' + ') || '0'} = ${html(f[n])} ✓`).join('<br>') });
    }
    let mc = null;
    if (tipo === 'SI' && m > n && M.flat().every(A_.esReal)) {
      const b = M.map((f) => [f[n]]), At = A_.traspuesta(A), AtA = A_.producto(At, A), Atb = A_.producto(At, b);
      if (!A_.esCero(A_.determinante(AtA))) {
        const N = AtA.map((f, i) => [...f, Atb[i][0]]), xr = A_.escalonar(N, { reducida: true, columnas: n }).R.map((f) => f[n]);
        const r = A.map((f, i) => A_.resta(f.reduce((s2, a, j) => A_.suma(s2, A_.mul(a, xr[j])), A_.c0), M[i][n]));
        const e2 = r.reduce((s2, x) => A_.suma(s2, A_.mul(x, x)), A_.c0);
        mc = { x: xr, e2 };
        pasos.push({ t: 'Least-squares solution', html: `There is no x that satisfies all the equations, but there is one that satisfies them “as well as possible”: the one that minimizes ‖A x − b‖<sup>2</sup>. It comes from the normal equations A<sup>t</sup>A x = A<sup>t</sup>b:<br>${matHtml(AtA)} x = ${matHtml(Atb)} &nbsp;⇒&nbsp; ${vars.map((v, j) => `${v} = <b>${html(xr[j])}</b>`).join(', &nbsp;')}<br>With that solution, the sum of the squares of the errors is ${html(e2)} ≈ ${A_.decimal(A_.qnum(e2.re), 4)}. It is what the regression line does.` });
      }
    }
    pasos.push(...geometria(M, n, m, tipo, rA, rAmp));
    const res = tipo === 'SI' ? `Inconsistent system: no solution${mc ? `<br><small>By least squares: ${vars.map((v, j) => `${v} ≈ ${html(mc.x[j])}`).join(', ')}</small>` : ''}` : `${vars.map((v, j) => `${v} = ${combinacion(sol[j].t, sol[j].c)}`).join(', &nbsp;')}`;
    return { tipo, rA, rAmp, n, m, vars, sol, param, pasos, res, descripcion: TIPOS[tipo], metodo, mc, M: M.map((f) => f.map((x) => A_.esReal(x) ? A_.qnum(x.re) : NaN)) };
  }

  function geometria(M, n, m, tipo, rA, rAmp) {
    if (!M.flat().every(A_.esReal) || (n !== 2 && n !== 3)) return [];
    const filas = M.filter((f) => f.slice(0, n).some((x) => !A_.esCero(x)));
    const rangoF = (fs) => (fs.length ? A_.escalonar(fs).rango : 0);
    let paralelas = 0, iguales = 0;
    for (let i = 0; i < filas.length; i++) for (let j = i + 1; j < filas.length; j++) {
      if (rangoF([filas[i].slice(0, n), filas[j].slice(0, n)]) === 1) { if (rangoF([filas[i], filas[j]]) === 1) iguales++; else paralelas++; }
    }
    const obj = n === 2 ? ['recta', 'rectas'] : ['plano', 'planos'], k = filas.length;
    let t;
    if (n === 2) {
      if (tipo === 'SCD') t = k === 2 ? 'The two lines meet at a point, which is the solution.' : `The ${k} lines pass through the same point, which is the solution.`;
      else if (tipo === 'SCI') t = k <= 1 ? 'Only one line remains: all its points are solutions.' : `The ${k} lines are the same (coincident): all their points are solutions.`;
      else t = paralelas && rAmp === 2 && rA === 1 ? `The lines are parallel: they never meet.` : `The lines meet two by two, but not all ${k} at the same point.`;
    } else {
      if (tipo === 'SCD') t = `The ${k} planes meet at a single point.`;
      else if (tipo === 'SCI') t = rA === 2 ? (iguales ? 'The planes meet along a line (two of them coincide): the points of that line are the solution.' : `The ${k} planes meet along a common line (they form a pencil): its points are the solution.`) : 'All the planes are the same: any of their points is a solution.';
      else if (rA === 1) t = iguales ? 'There are parallel planes (and some coincident): they have no common point.' : 'The planes are parallel: they have no common point.';
      else t = paralelas ? 'Two planes are parallel and the other cuts them: there is no point common to all.' : `The planes meet two by two in parallel lines (they form a prism): there is no point common to the ${k}.`;
    }
    void obj;
    return [{ t: 'Geometric interpretation', html: `Each equation with ${n} unknowns is ${n === 2 ? 'a line in the plane' : 'a plane in space'}. ${t}`, geo: true }];
  }

  function resolverParam(sc, letra) {
    const M = P_.leeMatriz(sc.M, letra), m = M.length, n = M[0].length - 1, A = M.map((f) => f.slice(0, n));
    const vars = nombres(n, sc.vars), mh = (X, o) => P_.matHtml(X, letra, o), fh = (q) => P_.factorHtml(q, letra), vh = P_.raizHtml;
    const pasos = [{ t: `System with the parameter ${letra}`, html: `A* = [A | b] = ${mh(M, { barra: n })}` }];
    const unicas = (rs) => rs.filter((r, i, xs) => !xs.slice(0, i).some((q) => Math.abs(q.num - r.num) < 1e-9));
    let rs, generico;
    if (m === n) {
      const d = P_.det(A);
      rs = unicas(P_.raices(d));
      pasos.push({ t: 'Determinant of the coefficient matrix', html: `|A| = ${mh(A, { det: true })} = <b>${fh(d)}</b>${P_.constante(d) ? '' : rs.length ? `, which is zero for ${letra} = ${rs.map(vh).join(', ')}` : `, which is not zero for any real ${letra}`}` });
      if (P_.nulo(d)) generico = null;
      else {
        generico = { tipo: 'SCD', txt: 'consistent and determined' };
        const xs = vars.map((v, j) => `${v} = ${P_.fracHtml(P_.det(A.map((f, i) => f.map((x, k) => (k === j ? M[i][n] : x)))), d, letra)}`);
        generico.sol = xs.join(', &nbsp;');
        pasos.push({ t: `If ${letra} ≠ ${rs.map(vh).join(', ') || '…'}`, html: `|A| ≠ 0, so rank(A) = rank(A*) = ${n}: <b>consistent and determined</b>. By Cramer, x<sub>i</sub> = |A<sub>i</sub>| / |A|:<br>${xs.join('<br>')}` });
      }
    }
    if (m !== n || generico === null) {
      const gA = P_.rangoGenerico(A), gM = P_.rangoGenerico(M);
      rs = unicas([...P_.raices(gA.mcd), ...P_.raices(gM.mcd)]).sort((a, b) => a.num - b.num);
      const t = gA.r < gM.r ? 'SI' : gA.r === n ? 'SCD' : 'SCI';
      generico = { tipo: t, txt: { SI: 'incompatible', SCD: 'consistent and determined', SCI: `consistent and indeterminate (${n - gA.r} ${n - gA.r === 1 ? 'parameter' : 'parameters'})` }[t] };
      pasos.push({ t: 'Ranks for almost all values', html: `For almost every ${letra}: rank(A) = ${gA.r} and rank(A*) = ${gM.r} ⇒ <b>${generico.txt}</b>.${rs.length ? ` The ranks can only drop where all the minors of that order vanish at once: ${letra} = ${rs.map(vh).join(', ')}.` : ''}` });
    }
    const casos = rs.map((r) => {
      if (r.exacta) {
        const S = resolverNum(P_.evaluaM(M, r.valor), sc, letra);
        return { r, tipo: S.tipo, txt: S.descripcion, sol: S.tipo === 'SI' ? '' : S.res };
      }
      const ra = P_.rangoF(A, r.num), rm = P_.rangoF(M, r.num), t = ra < rm ? 'SI' : ra === n ? 'SCD' : 'SCI';
      return { r, tipo: t, txt: { SI: 'incompatible', SCD: 'consistent and determined', SCI: 'consistent and indeterminate' }[t], sol: '' };
    });
    if (casos.length) pasos.push({ t: 'The special values', html: casos.map((c) => `${letra} = ${vh(c.r)}: substituted into the system it becomes <b>${c.txt}</b>${c.sol ? `: ${c.sol}` : ''}`).join('<br>') });
    const linea = (pre, t, sl) => `${pre}: <b>${t}</b>${sl ? ` &nbsp;(${sl})` : ''}`;
    const res = [linea(casos.length ? `If ${letra} ≠ ${rs.map(vh).join(', ')}` : `For every ${letra}`, generico.txt, generico.sol), ...casos.map((c) => linea(`If ${letra} = ${vh(c.r)}`, c.txt, c.sol))].join('<br>');
    pasos.push({ t: 'Discussion', html: res });
    return { tipo: 'PARAM', letra, n, m, vars, pasos, res, descripcion: `discussed according to the value of ${letra}`, casos: [{ valor: null, tipo: generico.tipo }, ...casos.map((c) => ({ valor: c.r.num, tipo: c.tipo }))] };
  }

  function leeTexto(texto) {
    const lineas = String(texto ?? '').split(/\n|;/).map((l) => l.trim()).filter(Boolean);
    if (!lineas.length) throw new Error('Write at least one equation');
    const orden = [], ecs = [];
    lineas.forEach((l, k) => {
      const lados = l.replace(/[−–]/g, '-').replace(/\s+/g, '').split('=');
      if (lados.length !== 2 || !lados[0] || !lados[1]) throw new Error(`Equation ${k + 1}: it must have an “=”`);
      const co = {};
      let cte = A_.c0;
      lados.forEach((lado, li) => {
        const sg = li ? -1 : 1;
        const terms = [];
        let dentro = 0, ini = 0;
        for (let q = 0; q < lado.length; q++) {
          const ch = lado[q];
          if (ch === '(') dentro++; else if (ch === ')') dentro--;
          else if ((ch === '+' || ch === '-') && !dentro && q > ini && !/[*/^]/.test(lado[q - 1])) { terms.push(lado.slice(ini, q)); ini = q; }
        }
        terms.push(lado.slice(ini));
        for (const t0 of terms) {
          let t = t0, neg = false;
          if (t[0] === '+') t = t.slice(1); else if (t[0] === '-') { neg = true; t = t.slice(1); }
          const m = /^(.*?)[*·]?([a-hk-zA-Zα-ωΑ-Ω](?:_?\d+)?|[ij]_?\d+)(\/\d+)?$/.exec(t);
          let c, v = null;
          if (m && !/^\d*[.,]?\d*i$/.test(t)) {
            v = m[2]; const cs = (m[1] || '1').replace(/^\((.*)\)$/, '$1');
            c = A_.leer(cs === '' ? '1' : cs);
            if (m[3]) c = A_.div(c, A_.leer(m[3].slice(1)));
          } else c = A_.leer(t);
          if (neg) c = A_.neg(c);
          if (sg < 0) c = A_.neg(c);
          if (v) { if (!(v in co)) co[v] = A_.c0; co[v] = A_.suma(co[v], c); if (!orden.includes(v)) orden.push(v); }
          else cte = A_.resta(cte, c);
        }
      });
      ecs.push({ co, cte });
    });
    if (!orden.length) throw new Error('There are no unknowns');
    if (orden.length > 6) throw new Error('At most 6 unknowns');
    const M = ecs.map((e) => [...orden.map((v) => A_.txt(e.co[v] || A_.c0)), A_.txt(e.cte)]);
    return { M, vars: orden.join(', ') };
  }

  const S = (...filas) => filas.map((f) => f.split(' '));
  const ejemplos = [
    { clave: 'parametro', nombre: 'Discuss according to the parameter k', sc: { metodo: 'gauss', M: S('1 1 k 1', '1 k 1 1', 'k 1 1 1') } },
    { clave: 'parametro2', nombre: 'Discuss a 2×2 system with a', sc: { metodo: 'gauss', M: S('a 1 2', '1 a 2') } },
    { clave: 'minimos', nombre: 'Inconsistent: least squares', sc: { metodo: 'gauss', M: S('1 1 2', '1 -1 0', '2 1 4') } },
    { clave: 'scd', nombre: 'Consistent and determined 3×3', sc: { metodo: 'gauss', M: S('2 1 -1 8', '-3 -1 2 -11', '-2 1 2 -3') } },
    { clave: 'cramer', nombre: 'By Cramer\'s rule', sc: { metodo: 'cramer', M: S('1 1 1 6', '0 2 5 -4', '2 5 -1 27') } },
    { clave: 'sci', nombre: 'Consistent and indeterminate (one parameter)', sc: { metodo: 'gauss', M: S('1 1 1 6', '2 -1 1 3', '3 0 2 9') } },
    { clave: 'sci2', nombre: 'Two equations and four unknowns', sc: { metodo: 'jordan', M: S('1 2 -1 1 4', '2 4 1 -1 5') } },
    { clave: 'si', nombre: 'Inconsistent', sc: { metodo: 'gauss', M: S('1 1 1 2', '1 2 3 5', '2 3 4 6') } },
    { clave: 'homogeneo', nombre: 'Homogeneous system', sc: { metodo: 'jordan', M: S('1 2 3 0', '4 5 6 0', '7 8 9 0') } },
    { clave: 'inversa', nombre: 'By the inverse matrix', sc: { metodo: 'inversa', M: S('2 1 5', '1 3 10') } },
    { clave: 'fracciones', nombre: 'With fractions and decimals', sc: { metodo: 'gauss', M: S('1/2 1/3 1', '0,25 -1 2') } },
    { clave: 'reduccion', nombre: 'Elimination 2×2', sc: { metodo: 'reduccion', M: S('3 2 7', '5 -3 -1') } },
    { clave: 'igualacion', nombre: 'Equating 2×2', sc: { metodo: 'igualacion', M: S('1 2 8', '1 -1 2') } },
    { clave: 'sustitucion', nombre: 'Substitution 3×3', sc: { metodo: 'sustitucion', M: S('1 1 1 6', '2 -1 1 3', '1 2 -1 2') } },
    { clave: 'reduccion3', nombre: 'Elimination 3×3', sc: { metodo: 'reduccion', M: S('2 1 -1 8', '-3 -1 2 -11', '-2 1 2 -3') } },
    { clave: 'complejo', nombre: 'With complex numbers', sc: { metodo: 'gauss', M: S('1+i 2 3+i', '1 -i 1') } },
    { clave: 'mallas', nombre: 'AC meshes (complex impedances)', sc: { metodo: 'cramer', vars: 'I1, I2', M: S('2+3i -3i 10', '-3i 4+i 0') } },
  ];
  return { METODOS, resolver, leeTexto, ejemplos, nombres, combinacion };
})();

