/* =====================================================================
   Multiplicadores de Lagrange (sin DOM): extremos de f(x, y) o f(x, y, z)
   sujetos a una restricción g = c. Plantea ∇f = λ∇g con g = c, lo resuelve
   numéricamente (Newton desde muchos puntos de partida, con las derivadas
   simbólicas de Expresion), reconoce los valores exactos (√2/2, π…) y
   clasifica cada punto con el hessiano de la lagrangiana restringido al
   plano tangente (hessiano orlado en dos variables). Lee las expresiones con
   Expresion (matematicas/expresion.js). La interfaz está en lagrange/app.js.
     resolver(sc)  sc = { f, g, c } → { …, puntos, pasos }
     ejemplos      para el desplegable y Mis ejercicios
   ===================================================================== */
const Lagrange = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const V3 = ['x', 'y', 'z'];
  const f = (x, d = 6) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    return String(+x.toPrecision(d)).replace('.', ',').replace('-', '−');
  };
  const N = (x) => E.numTxt(Math.abs(x) < 1e-10 ? 0 : x, 6);

  // resuelve A·u = b por eliminación con pivote; null si es singular
  function gauss(A, b) {
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-13) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) { const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
    }
    const u = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * u[j]; u[i] = s / M[i][i]; }
    return u;
  }

  function resolver(sc) {
    if (vacio(sc.f)) throw new Error('Falta la función f que se quiere optimizar');
    if (vacio(sc.g)) throw new Error('Falta la restricción g');
    const fa = E.lee(sc.f, 'La función f', V3), ga = E.lee(sc.g, 'La restricción g', V3);
    const c = vacio(sc.c) ? 0 : E.valor(E.lee(sc.c, 'El valor de la restricción', []), 0);
    if (!isFinite(c)) throw new Error('El valor de la restricción tiene que ser un número');
    const dim = E.tieneX(fa, 'z') || E.tieneX(ga, 'z') ? 3 : 2;
    const V = V3.slice(0, dim);
    if (!V.some((v) => E.tieneX(ga, v))) throw new Error('La restricción g tiene que depender de x o de y');
    if (!V.some((v) => E.tieneX(fa, v))) throw new Error('La función f tiene que depender de x o de y');
    if (dim === 3 && !E.tieneX(fa, 'y') && !E.tieneX(ga, 'y') && !E.tieneX(fa, 'x') && !E.tieneX(ga, 'x')) throw new Error('Usa al menos x e y');
    const D = (n, v) => E.deriva(n, v), T = (n) => E.texto(n);
    const fg = V.map((v) => D(fa, v)), gg = V.map((v) => D(ga, v));
    const Hf = fg.map((p) => V.map((v) => D(p, v))), Hg = gg.map((p) => V.map((v) => D(p, v)));
    const ev = (n, p) => E.valor(n, p[0], { y: p[1], z: p[2] });
    const evN = (n, p) => { const v = ev(n, p); return isFinite(v) ? v : NaN; };

    /* ---- Newton para ∇f − λ∇g = 0, g = c ---- */
    const res = (u) => { const p = u.slice(0, dim), l = u[dim]; return [...V.map((_, i) => evN(fg[i], p) - l * evN(gg[i], p)), evN(ga, p) - c]; };
    const norma = (v) => Math.sqrt(v.reduce((s, a) => s + a * a, 0));
    function newton(u) {
      for (let it = 0; it < 80; it++) {
        const F = res(u), nF = norma(F);
        if (!isFinite(nF)) return null;
        if (nF < 1e-13) return u;
        const p = u.slice(0, dim), l = u[dim];
        const J = V.map((_, i) => [...V.map((__, j) => evN(Hf[i][j], p) - l * evN(Hg[i][j], p)), -evN(gg[i], p)]);
        J.push([...V.map((_, j) => evN(gg[j], p)), 0]);
        const d = gauss(J, F);
        if (!d || d.some((x) => !isFinite(x))) return null;
        let t = 1, nu;
        for (let k = 0; k < 30; k++) { nu = u.map((a, i) => a - t * d[i]); const nn = norma(res(nu)); if (isFinite(nn) && nn < nF) break; t /= 2; }
        u = nu;
        if (u.some((a) => Math.abs(a) > 1e6)) return null;
      }
      return norma(res(u)) < 1e-9 ? u : null;
    }
    /* ---- Puntos de la restricción: ¿f es constante sobre ella? ---- */
    const proyecta = (p0) => {
      let p = p0.slice();
      for (let it = 0; it < 80; it++) {
        const gv = evN(ga, p) - c, gr = V.map((_, i) => evN(gg[i], p)), n2 = gr.reduce((a, b) => a + b * b, 0);
        if (!isFinite(gv) || !(n2 > 1e-14)) return null;
        if (Math.abs(gv) < 1e-13) return p;
        p = p.map((a, i) => a - (gv * gr[i]) / n2);
        if (p.some((a) => !isFinite(a) || Math.abs(a) > 1e6)) return null;
      }
      return Math.abs(evN(ga, p) - c) < 1e-10 ? p : null;
    };
    const muestra = [];
    for (let k = 0; k < 60 && muestra.length < 24; k++) {
      const q = V.map((_, i) => 3 * Math.sin(1.7 * k + 2.3 * i + 0.4) * Math.cos(0.9 * k * (i + 1)) + 0.11 * i);
      const pr = proyecta(q);
      if (pr && isFinite(ev(fa, pr))) muestra.push(pr);
    }
    const fm = muestra.map((q) => ev(fa, q)), escala = Math.max(1, ...fm.map(Math.abs));
    const constante = muestra.length >= 6 && Math.max(...fm) - Math.min(...fm) < 1e-9 * escala ? fm[0] : null;

    /* ---- Puntos singulares de la restricción (∇g = 0, g = c) ---- */
    const singulares = [];
    if (constante === null) {
      const newtonG = (u) => {
        for (let it = 0; it < 80; it++) {
          const F = V.map((_, i) => evN(gg[i], u)), nF = norma(F);
          if (!isFinite(nF)) return null;
          if (nF < 1e-13) return u;
          const J = V.map((_, i) => V.map((__, j) => evN(Hg[i][j], u))), d = gauss(J, F);
          if (!d || d.some((x) => !isFinite(x))) return null;
          u = u.map((a, i) => a - d[i]);
          if (u.some((a) => Math.abs(a) > 1e6)) return null;
        }
        return null;
      };
      const nsm = dim === 2 ? 9 : 4;
      for (let i = 0; i < nsm; i++) for (let j = 0; j < nsm; j++) for (let k = 0; k < (dim === 2 ? 1 : nsm); k++) {
        const s0 = [(i - (nsm - 1) / 2) * 1.3 + 0.071, (j - (nsm - 1) / 2) * 1.3 - 0.113, (k - (nsm - 1) / 2) * 1.3 + 0.047].slice(0, dim);
        const u = newtonG(s0);
        if (!u) continue;
        const q = u.map((a) => (Math.abs(a) < 1e-6 ? 0 : a));
        if (Math.abs(evN(ga, q) - c) > 1e-8 * Math.max(1, Math.abs(c))) continue;
        if (!singulares.some((w) => Math.hypot(...w.map((a, m) => a - q[m])) < 1e-4)) singulares.push(q);
      }
    }
    // clasificación local de un punto singular: se proyectan sobre la restricción puntos cercanos, en muchas direcciones, y se compara f
    const entorno = (p) => {
      const hallados = [], dirs = [];
      if (dim === 2) for (let k = 0; k < 240; k++) dirs.push([Math.cos((k * Math.PI) / 120), Math.sin((k * Math.PI) / 120)]);
      else for (let a = 0; a < 36; a++) for (let b = 1; b < 18; b++) { const th = (b * Math.PI) / 18, ph = (a * 2 * Math.PI) / 36; dirs.push([Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]); }
      for (const R of [0.03, 0.1, 0.3]) for (const d of dirs) {
        const q = proyecta(p.map((a, i) => a + R * d[i])), dist = q ? Math.hypot(...q.map((a, i) => a - p[i])) : 0;
        if (q && dist > 2e-3 && dist < 0.6) hallados.push(q);
      }
      return hallados;
    };

    const sols = [];
    const paso = dim === 2 ? 1.1 : 1.7, n = dim === 2 ? 11 : 5;
    const semillas = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const a = (i - (n - 1) / 2) * paso + 0.137, b = (j - (n - 1) / 2) * paso - 0.211;
      if (dim === 2) semillas.push([a, b]); else for (let k = 0; k < n; k++) semillas.push([a, b, (k - (n - 1) / 2) * paso + 0.093]);
    }
    for (const s of semillas) {
      const g0 = V.map((_, i) => evN(gg[i], s)), f0 = V.map((_, i) => evN(fg[i], s));
      const gg2 = g0.reduce((a, b) => a + b * b, 0);
      for (const l0 of [gg2 > 1e-12 ? f0.reduce((a, b, i) => a + b * g0[i], 0) / gg2 : 0, 0]) {
        if (!isFinite(l0)) continue;
        const u = newton([...s, l0]);
        if (u && !sols.some((w) => Math.hypot(...w.slice(0, dim).map((a, i) => a - u[i])) < 1e-6)) sols.push(u);
      }
    }

    /* ---- Clasificación ---- */
    const puntos = sols.map((u) => {
      const p = u.slice(0, dim).map((a) => (Math.abs(a) < 1e-11 ? 0 : a)), l = Math.abs(u[dim]) < 1e-11 ? 0 : u[dim];
      const HL = V.map((_, i) => V.map((__, j) => evN(Hf[i][j], p) - l * evN(Hg[i][j], p)));
      const gr = V.map((_, i) => evN(gg[i], p));
      const pt = { p, lambda: l, valor: ev(fa, p), grad: gr };
      let e1, e2;
      if (dim === 2) {
        const t = [-gr[1], gr[0]];
        pt.q = t[0] * (HL[0][0] * t[0] + HL[0][1] * t[1]) + t[1] * (HL[1][0] * t[0] + HL[1][1] * t[1]);
        pt.orlado = -pt.q;
        const esc = Math.max(1, Math.abs(HL[0][0]), Math.abs(HL[1][1]), Math.abs(HL[0][1])) * (gr[0] ** 2 + gr[1] ** 2);
        pt.tipo = Math.abs(pt.q) < 1e-9 * esc ? 'no decide' : pt.q > 0 ? 'mínimo' : 'máximo';
      } else {
        const nn = Math.hypot(...gr);
        if (nn < 1e-12) pt.tipo = 'no decide';
        else {
          const nv = gr.map((a) => a / nn), k = nv.map(Math.abs).indexOf(Math.min(...nv.map(Math.abs)));
          const e = [0, 0, 0]; e[k] = 1;
          const dot = e.reduce((a, b, i) => a + b * nv[i], 0);
          let b1 = e.map((a, i) => a - dot * nv[i]); const nb = Math.hypot(...b1); b1 = b1.map((a) => a / nb);
          const b2 = [nv[1] * b1[2] - nv[2] * b1[1], nv[2] * b1[0] - nv[0] * b1[2], nv[0] * b1[1] - nv[1] * b1[0]];
          const q = (a, b) => a.reduce((s, ai, i) => s + ai * b.reduce((t, bj, j) => t + HL[i][j] * bj, 0), 0);
          const A = q(b1, b1), B = q(b1, b2), Cc = q(b2, b2), tr = A + Cc, det = A * Cc - B * B, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
          e1 = tr / 2 - disc; e2 = tr / 2 + disc;
          pt.autovalores = [e1, e2];
          const tol = 1e-9 * Math.max(1, Math.abs(e1), Math.abs(e2));
          pt.tipo = e1 > tol ? 'mínimo' : e2 < -tol ? 'máximo' : e1 < -tol && e2 > tol ? 'silla' : 'no decide';
        }
      }
      return pt;
    });
    if (constante !== null) puntos.length = 0;
    // si ∇g = 0 en toda una curva (muchos puntos), no se clasifican uno a uno
    const muchos = singulares.length > 8;
    for (const p of singulares.slice(0, muchos ? 3 : 8)) {
      if (puntos.some((w) => Math.hypot(...w.p.map((a, i) => a - p[i])) < 1e-6)) continue;
      const f0 = ev(fa, p), cerca = entorno(p), df = cerca.map((q) => ev(fa, q) - f0), tol = 1e-9 * Math.max(1, Math.abs(f0));
      const tipo = muchos ? 'no decide' : !cerca.length ? 'aislado' : df.every((d) => d > -tol) ? 'mínimo' : df.every((d) => d < tol) ? 'máximo' : 'sin extremo';
      puntos.push({ p, lambda: NaN, valor: f0, grad: V.map(() => 0), tipo, singular: true, vecinos: cerca.length });
    }
    puntos.sort((a, b) => a.valor - b.valor);
    const vals = puntos.map((q) => q.valor);
    const gMax = puntos.length ? Math.max(...vals) : null, gMin = puntos.length ? Math.min(...vals) : null;

    /* ---- Desarrollo ---- */
    const nom = V.join(', ');
    const pasos = [
      { t: 'Datos', html: `Optimizar $f(${nom}) = ${T(E.simp(fa))}$ con la restricción $g(${nom}) = ${T(E.simp(ga))} = ${N(c)}$` },
      { t: 'Gradientes', html: `$∇f = (${fg.map(T).join(' ; ')})$<br>$∇g = (${gg.map(T).join(' ; ')})$` },
      { t: 'Sistema de Lagrange', html: `En un extremo condicionado $∇f = λ ∇g$ y se cumple la restricción:<br>${V.map((v, i) => `$${T(fg[i])} = λ (${T(gg[i])})$`).join('<br>')}<br>$${T(E.simp(ga))} = ${N(c)}$`
        + `<br>Son ${dim + 1} ecuaciones con ${dim + 1} incógnitas (${nom}, λ).` },
    ];
    const reg = puntos.filter((q) => !q.singular), sing = puntos.filter((q) => q.singular);
    if (constante !== null) {
      pasos.push({ t: 'f es constante sobre la restricción', html: `En todos los puntos de la restricción $f$ vale lo mismo, $f = ${N(constante)}$: $∇f$ es paralelo a $∇g$ en cada uno (todos cumplen el sistema) y no hay máximo ni mínimo que buscar. Por eso no se da ninguna lista de puntos: la «solución» es toda la restricción.` });
    } else if (!puntos.length) {
      pasos.push({ t: 'Puntos críticos', html: 'No encuentro ninguna solución del sistema cerca del origen (en ' + (dim === 2 ? '|x|, |y| ≤ 6' : '|x|, |y|, |z| ≤ 4') + '): puede que no haya extremos o que estén más lejos.' });
    } else {
      if (reg.length) pasos.push({ t: 'Resolver el sistema', html: `Se resuelve numéricamente (Newton desde ${semillas.length} puntos de partida) y se reconocen los valores exactos. Hay ${reg.length} punto${reg.length === 1 ? '' : 's'} crítico${reg.length === 1 ? '' : 's'}:<br>${reg.map((q) => `$(${q.p.map(N).join(' ; ')})$ con $λ = ${N(q.lambda)}$ y $f = ${N(q.valor)}$`).join('<br>')}` });
      if (reg.length) pasos.push({ t: 'Clasificación', html: dim === 2
        ? `Con $L = f − λ g$, en cada punto se mira el hessiano orlado $\\bar H$ (o $q = t^T H_L t$ en la tangente $t = (−g_y ; g_x)$): si $q > 0$ es mínimo y si $q < 0$, máximo.<br>${reg.map((q) => `$(${q.p.map(N).join(' ; ')})$: $q = ${N(q.q)}$, $|\\bar H| = ${N(q.orlado)}$ → <b>${q.tipo}</b>`).join('<br>')}`
        : `Con $L = f − λ g$ se mira $H_L$ restringido al plano tangente a $g = c$ (autovalores $μ_1$, $μ_2$): ambos positivos, mínimo; ambos negativos, máximo; de distinto signo, punto de silla.<br>${reg.map((q) => `$(${q.p.map(N).join(' ; ')})$: ${q.autovalores ? `$μ_1 = ${N(q.autovalores[0])}$, $μ_2 = ${N(q.autovalores[1])}$` : 'sin plano tangente'} → <b>${q.tipo}</b>`).join('<br>')}` });
      if (sing.length) pasos.push({ t: 'Puntos donde ∇g = 0', html: `El método de Lagrange pide $∇g ≠ 0$ en la restricción; los puntos con $∇g = 0$ que están en $g = ${N(c)}$ hay que probarlos aparte, porque $∇f = λ∇g$ no los detecta. Aquí: ${sing.map((q) => `$(${q.p.map(N).join(' ; ')})$ con $f = ${N(q.valor)}$ → <b>${muchos ? 'no se clasifica: ∇g = 0 en toda una curva (se muestran solo algunos puntos)' : q.tipo === 'aislado' ? 'punto aislado de la restricción' : q.tipo === 'sin extremo' ? 'ni máximo ni mínimo (f toma valores mayores y menores cerca)' : q.tipo + ' (se compara f con sus valores en un entorno de la restricción)'}</b>`).join('<br>')}` });
      const mx = puntos.filter((q) => q.valor > gMax - 1e-9 * Math.max(1, Math.abs(gMax))), mn = puntos.filter((q) => q.valor < gMin + 1e-9 * Math.max(1, Math.abs(gMin)));
      const lista = (a) => a.map((q) => `$(${q.p.map(N).join(' ; ')})$`).join(' y ');
      pasos.push({ t: 'Conclusión', html: puntos.length === 1 ? `Un solo punto crítico, $${lista(puntos).replace(/^\$|\$$/g, '')}$, que es un <b>${puntos[0].tipo}</b>.` : `Comparando los valores de $f$: el mayor es $${N(gMax)}$ en ${lista(mx)} y el menor es $${N(gMin)}$ en ${lista(mn)}. Si la restricción es una curva o superficie cerrada y acotada, son el máximo y el mínimo absolutos; si no, solo los extremos locales que se han clasificado.` });
    }
    return { dim, V, fa, ga, c, constante, f: (p) => ev(fa, p), g: (p) => ev(ga, p), puntos, max: gMax, min: gMin, nsemillas: semillas.length, fT: T(E.simp(fa)), gT: T(E.simp(ga)), pasos };
  }

  const ejemplos = [
    { clave: 'circulo', nombre: 'Máx y mín de x + y en x² + y² = 1', sc: { f: 'x + y', g: 'x^2 + y^2', c: '1' } },
    { clave: 'producto', nombre: 'Mín de x² + y² con x + y = 2', sc: { f: 'x^2 + y^2', g: 'x + y', c: '2' } },
    { clave: 'rectangulo', nombre: 'Rectángulo de área máxima con perímetro 20', sc: { f: 'x y', g: '2x + 2y', c: '20' } },
    { clave: 'elipse', nombre: 'f = x y en la elipse x²/4 + y² = 1', sc: { f: 'x y', g: 'x^2/4 + y^2', c: '1' } },
    { clave: 'esfera', nombre: 'Máx y mín de x + 2y + 3z en la esfera de radio 1', sc: { f: 'x + 2y + 3z', g: 'x^2 + y^2 + z^2', c: '1' } },
    { clave: 'plano', nombre: 'Punto del plano x + y + z = 1 más cercano al origen', sc: { f: 'x^2 + y^2 + z^2', g: 'x + y + z', c: '1' } },
    { clave: 'cubica', nombre: 'x y² con x + y = 3', sc: { f: 'x y^2', g: 'x + y', c: '3' } },
  ];

  return { resolver, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Lagrange;
