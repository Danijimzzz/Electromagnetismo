/* =====================================================================
   Ecuaciones diferenciales (sin DOM):
   · primer orden y′ = f(x, y): campo de pendientes, método de Euler y
     RK4, y la solución exacta si es lineal con coeficiente constante;
   · segundo orden a y″ + b y′ + c y = g(x) con coeficientes constantes:
     ecuación característica, solución homogénea, particular por
     coeficientes indeterminados (con resonancia) y constantes por las
     condiciones iniciales;
   · sistemas x′ = f(x, y), y′ = g(x, y): puntos críticos con su tipo
     (autovalores del jacobiano), solución exacta si es lineal y
     trayectorias para el diagrama de fases.
   Las expresiones las lee Expresion.
   ===================================================================== */
const EDOs = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  const FACT = [1]; for (let k = 1; k <= 30; k++) FACT[k] = FACT[k - 1] * k;
  const binom = (n, k) => FACT[n] / (FACT[k] * FACT[n - k]);

  function num(s, nom) {
    if (vacio(s)) throw new Error(`Falta ${nom}`);
    const n = E.lee(s, nom[0].toUpperCase() + nom.slice(1));
    if (E.tieneX(n)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} no puede llevar x`);
    const v = E.valor(n, 0);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} no es un número`);
    return v;
  }

  /* ---------- Números y términos en texto ---------- */
  // coeficiente exacto si es sencillo: {3}/{4}, √2, π; si no, decimal
  function cTxt(c) {
    const e = E.exacto(c, 1000);
    return e ? E.numTxt(c) : f(c, 4);
  }
  // r·v: 2x, −x, {x}/{2}, 0,1 t
  function linTxt(r, v) {
    const e = E.exacto(r, 12);
    if (e && !e.s) {
      const P = Math.abs(e.p), sg = e.p < 0 ? '−' : '';
      return sg + (e.q === 1 ? `${P === 1 ? '' : P + ' '}${v}` : `{${P === 1 ? '' : P + ' '}${v}}/{${e.q}}`);
    }
    return `${r < 0 ? '−' : ''}${f(Math.abs(r), 4)} ${v}`;
  }
  // factor de una base x^m e^{rx} cos(wx)
  function baseTxt({ m = 0, r = 0, w = 0, p = null }, v = 'x') {
    const xs = [m ? (m === 1 ? v : `${v}^{${m}}`) : '', r ? `e^{${linTxt(r, v)}}` : '', w ? `${p} ${/^[\d{]/.test(linTxt(w, v)) || linTxt(w, v).includes(' ') ? `(${linTxt(w, v)})` : linTxt(w, v)}` : ''];
    return xs.filter(Boolean).join(' ');
  }
  // suma de términos c·base: [{ c, s }] → texto con los signos bien
  function suma(ts) {
    const vivos = ts.filter((t) => Math.abs(t.c) > 1e-10);
    if (!vivos.length) return '0';
    return vivos.map((t, i) => {
      const neg = t.c < 0, a = Math.abs(t.c);
      let cuerpo;
      if (!t.s) cuerpo = cTxt(a);
      else if (Math.abs(a - 1) < 1e-12) cuerpo = t.s;
      else {
        const ct = cTxt(a);
        // {1}/{2} e^{x} → {e^{x}}/{2} solo si el coeficiente es 1/q
        const m = ct.match(/^\{1\}\/\{(\d+)\}$/);
        cuerpo = m ? `{${t.s}}/{${m[1]}}` : `${ct} ${t.s}`;
      }
      return (i ? (neg ? ' − ' : ' + ') : neg ? '−' : '') + cuerpo;
    }).join('');
  }

  /* ---------- Complejos mínimos ---------- */
  const Z = (re, im = 0) => ({ re, im }), zm = (a, b) => Z(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re), zs = (a, b) => Z(a.re + b.re, a.im + b.im);
  const zpow = (z, n) => { let r = Z(1); for (let i = 0; i < n; i++) r = zm(r, z); return r; };
  const zexp = (z) => Z(Math.exp(z.re) * Math.cos(z.im), Math.exp(z.re) * Math.sin(z.im));
  // D^i [x^m e^{λx}] en x (complejo)
  function dBase(m, lam, i, x) {
    let s = Z(0);
    for (let j = 0; j <= Math.min(i, m); j++) {
      const k = binom(i, j) * (FACT[m] / FACT[m - j]) * x ** (m - j);
      s = zs(s, zm(Z(k), zpow(lam, i - j)));
    }
    return zm(s, zexp(zm(lam, Z(x))));
  }
  // valor de la derivada i de una base real { m, r, w, p: 'cos'|'sen'|null }
  const dReal = (b, i, x) => { const z = dBase(b.m, Z(b.r, b.w), i, x); return b.p === 'sen' ? z.im : z.re; };

  /* ---------- Sistemas lineales pequeños ---------- */
  function resuelve(A, y) {
    const n = A.length, M = A.map((r, i) => [...r, y[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const k = M[r][c] / M[c][c]; for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j]; }
    }
    return M.map((r, i) => r[n] / r[i]);
  }
  // mínimos cuadrados con las ecuaciones normales
  function minimos(A, y) {
    const n = A[0].length, AtA = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => A.reduce((s, r) => s + r[i] * r[j], 0))), Aty = Array.from({ length: n }, (_, i) => A.reduce((s, r, k) => s + r[i] * y[k], 0));
    return resuelve(AtA, Aty);
  }
  const limpio = (c) => { if (Math.abs(c) < 1e-10) return 0; const e = E.exacto(c, 1000); if (!e) return c; const v = E.valor(E.lee(E.numTxt(c).replace(/[{}]/g, (q) => (q === '{' ? '(' : ')')).replace(/\)\/\(/g, ')/('), 'c'), 0); return isFinite(v) && Math.abs(v - c) < 1e-9 * Math.max(1, Math.abs(c)) ? v : c; };

  /* ---------- Término independiente: suma de c x^k e^{rx} cos/sen(wx) ---------- */
  const esY = (n) => n.t === 'x' && n.n === 'y';
  function lineal(u) {
    // u(x) = u0 + r x
    if (E.tieneX(u, 'y')) return null;
    const u0 = E.valor(u, 0), r = E.valor(u, 1) - u0;
    if (!isFinite(u0) || !isFinite(r) || Math.abs(E.valor(u, 2.5) - (u0 + 2.5 * r)) > 1e-9 * Math.max(1, Math.abs(r))) return null;
    return { u0, r };
  }
  function terminos(ast) {
    const ts = [];
    function enSuma(m, s) {
      if (m.t === '+') { enSuma(m.a, s); enSuma(m.b, s); return true; }
      if (m.t === '-') { enSuma(m.a, s); enSuma(m.b, -s); return true; }
      if (m.t === 'neg') { enSuma(m.a, -s); return true; }
      const t = producto(m);
      if (!t) throw 0;
      for (const q of t) ts.push({ ...q, c: q.c * s });
      return true;
    }
    // un producto: puede dar varios términos (sen(ωx + φ), senh)
    function producto(m) {
      let base = [{ c: 1, k: 0, r: 0, w: 0, p: null }];
      const mult = (otros) => { const nb = []; for (const a of base) for (const b of otros) { if (a.p && b.p) return false; nb.push({ c: a.c * b.c, k: a.k + b.k, r: a.r + b.r, w: a.w + b.w, p: a.p || b.p }); } base = nb; return true; };
      function fac(q, ex = 1) {
        if (q.t === '*') return fac(q.a, ex) && fac(q.b, ex);
        if (q.t === '/' && !E.tieneX(q.b) && !E.tieneX(q.b, 'y')) { const d = E.valor(q.b, 0); return fac(q.a, ex) && mult([{ c: 1 / d, k: 0, r: 0, w: 0, p: null }]); }
        if (q.t === 'neg') return fac(q.a, ex) && mult([{ c: -1, k: 0, r: 0, w: 0, p: null }]);
        if (!E.tieneX(q) && !E.tieneX(q, 'y')) { const v = E.valor(q, 0); return isFinite(v) && mult([{ c: v, k: 0, r: 0, w: 0, p: null }]); }
        if (q.t === 'x' && !q.n) return mult([{ c: 1, k: 1, r: 0, w: 0, p: null }]);
        if (q.t === '^' && q.a.t === 'x' && !q.a.n && q.b.t === 'n' && Number.isInteger(q.b.v) && q.b.v >= 0) return mult([{ c: 1, k: q.b.v, r: 0, w: 0, p: null }]);
        if (q.t === '^' && q.a.t === 'c' && q.a.v === 'e') { const l = lineal(q.b); return !!l && mult([{ c: Math.exp(l.u0), k: 0, r: l.r, w: 0, p: null }]); }
        if (q.t === 'fn' && (q.f === 'sen' || q.f === 'cos')) {
          const l = lineal(q.a); if (!l || Math.abs(l.r) < 1e-14) return false;
          const w = Math.abs(l.r), sg = Math.sign(l.r), c0 = Math.cos(l.u0), s0 = Math.sin(l.u0);
          // sen(ωx + φ) = cos φ sen ωx + sen φ cos ωx
          return mult(q.f === 'sen' ? [{ c: sg * c0, k: 0, r: 0, w, p: 'sen' }, { c: s0, k: 0, r: 0, w, p: 'cos' }] : [{ c: c0, k: 0, r: 0, w, p: 'cos' }, { c: -sg * s0, k: 0, r: 0, w, p: 'sen' }]);
        }
        if (q.t === 'fn' && (q.f === 'senh' || q.f === 'cosh')) { const l = lineal(q.a); if (!l) return false; const a = Math.exp(l.u0) / 2, b = Math.exp(-l.u0) / 2; return mult([{ c: a, k: 0, r: l.r, w: 0, p: null }, { c: q.f === 'senh' ? -b : b, k: 0, r: -l.r, w: 0, p: null }]); }
        return false;
      }
      if (!fac(m)) return null;
      return base.map((b) => (b.w ? b : { ...b, p: null }));
    }
    try { enSuma(E.simp(ast), 1); } catch (e) { if (e === 0) return null; throw e; }
    return ts.filter((t) => Math.abs(t.c) > 1e-14);
  }

  /* ---------- Solución particular por coeficientes indeterminados ---------- */
  // P: coeficientes del operador [p0, p1, p2] (p0 y + p1 y′ + p2 y″)
  function particular(P, ts) {
    const car = (l) => P.reduce((s, p, i) => zs(s, zm(Z(p), zpow(l, i))), Z(0));
    const dcar = (l) => P.reduce((s, p, i) => (i ? zs(s, zm(Z(i * p), zpow(l, i - 1))) : s), Z(0));
    const mod = (z) => Math.hypot(z.re, z.im);
    const grupos = [];
    for (const t of ts) {
      let g = grupos.find((q) => Math.abs(q.r - t.r) < 1e-12 && Math.abs(q.w - t.w) < 1e-12);
      if (!g) { g = { r: t.r, w: t.w, k: 0 }; grupos.push(g); }
      g.k = Math.max(g.k, t.k);
    }
    const bases = [];
    for (const g of grupos) {
      const l = Z(g.r, g.w), sc = Math.max(1, ...P.map(Math.abs));
      g.s = mod(car(l)) < 1e-9 * sc ? (P.length > 2 && mod(dcar(l)) < 1e-9 * sc ? 2 : 1) : 0;
      for (let j = 0; j <= g.k; j++) {
        bases.push({ m: j + g.s, r: g.r, w: g.w, p: g.w ? 'cos' : null });
        if (g.w) bases.push({ m: j + g.s, r: g.r, w: g.w, p: 'sen' });
      }
    }
    const gval = (x) => ts.reduce((s, t) => s + t.c * x ** t.k * Math.exp(t.r * x) * (t.p === 'sen' ? Math.sin(t.w * x) : t.p === 'cos' ? Math.cos(t.w * x) : 1), 0);
    const Lb = (b, x) => P.reduce((s, p, i) => s + p * dReal(b, i, x), 0);
    const xs = Array.from({ length: Math.max(8, 3 * bases.length) }, (_, i) => 0.13 + (1.1 * i) / Math.max(8, 3 * bases.length));
    const A = xs.map((x) => bases.map((b) => Lb(b, x))), y = xs.map(gval);
    const sol = minimos(A, y);
    if (!sol) return null;
    const coef = sol.map(limpio);
    // comprobación en otros puntos
    for (const x of [0.37, 0.91, 1.57]) { const r = bases.reduce((s, b, i) => s + coef[i] * Lb(b, x), 0) - gval(x); if (Math.abs(r) > 1e-7 * Math.max(1, Math.abs(gval(x)))) return null; }
    return { grupos, bases: bases.map((b, i) => ({ ...b, c: coef[i] })) };
  }
  const evalBases = (bs, x, i = 0) => bs.reduce((s, b) => s + b.c * dReal(b, i, x), 0);

  /* ---------- RK4 ---------- */
  function rk4(F, t0, Y0, t1, pasos) {
    const h = (t1 - t0) / pasos, out = [{ t: t0, Y: [...Y0] }];
    let Y = [...Y0], t = t0;
    for (let i = 0; i < pasos; i++) {
      const k1 = F(t, Y), k2 = F(t + h / 2, Y.map((v, j) => v + (h / 2) * k1[j])), k3 = F(t + h / 2, Y.map((v, j) => v + (h / 2) * k2[j])), k4 = F(t + h, Y.map((v, j) => v + h * k3[j]));
      Y = Y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])); t += h;
      if (!Y.every(isFinite) || Y.some((v) => Math.abs(v) > 1e12)) break;
      out.push({ t, Y: [...Y] });
    }
    return out;
  }

  /* ---------- Primer orden ---------- */
  function primer(sc) {
    const ast = E.lee(sc.f, 'La función f(x, y)', ['x', 'y']);
    const x0 = num(sc.x0, 'el valor x₀'), y0 = num(sc.y0, 'el valor y₀'), x1 = num(sc.x1, 'el final del intervalo');
    if (!(x1 > x0)) throw new Error('El final del intervalo tiene que ser mayor que x₀');
    const h = vacio(sc.h) ? (x1 - x0) / 10 : num(sc.h, 'el paso h');
    if (!(h > 0)) throw new Error('El paso h tiene que ser positivo');
    if ((x1 - x0) / h > 2000) throw new Error('Con ese paso salen demasiados pasos de Euler: usa un h mayor');
    const F = (x, y) => E.valor(ast, x, { y });
    if (!isFinite(F(x0, y0))) throw new Error(`f no está definida en (x₀, y₀) = (${f(x0)}, ${f(y0)})`);
    const fTxt = E.texto(E.simp(ast)), pasos = [];
    pasos.push({ t: 'La ecuación', html: `$y′ = ${fTxt}$ con $y(${f(x0)}) = ${f(y0)}$. En cada punto (x, y) la ecuación da la pendiente de la solución que pasa por él: es el campo de pendientes de la gráfica.` });

    // ¿lineal con coeficiente constante? f = q(x) − p y
    let exacta = null, p = null;
    const xsT = [x0, x0 + 0.37, x0 + 1.1, x0 - 0.6], lin = xsT.every((x) => { const a = F(x, 0), b = F(x, 1), c = F(x, 2.5); return isFinite(a) && Math.abs(c - a - 2.5 * (b - a)) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); });
    if (lin) {
      const ps = xsT.map((x) => F(x, 0) - F(x, 1));
      if (ps.every((q) => Math.abs(q - ps[0]) < 1e-9 * Math.max(1, Math.abs(ps[0])))) p = limpio(ps[0]);
    }
    if (p !== null) {
      const q = E.simp(sustY(ast, E.N(0)));
      const ts = terminos(q), qTxt = E.texto(q);
      const yhTxt = Math.abs(p) < 1e-14 ? 'C' : `C e^{${linTxt(-p, 'x')}}`;
      pasos.push({ t: 'Es lineal', html: `Pasando el término en y a la izquierda queda $y′ ${p < 0 ? '−' : '+'} ${Math.abs(p - 1) < 1e-12 || Math.abs(p + 1) < 1e-12 ? '' : cTxt(Math.abs(p)) + ' '}y = ${qTxt}$: lineal con coeficiente constante. La homogénea $y′ ${p < 0 ? '−' : '+'} ${Math.abs(Math.abs(p) - 1) < 1e-12 ? '' : cTxt(Math.abs(p)) + ' '}y = 0$ da $y_h = ${yhTxt}$ (raíz $λ = ${cTxt(-p)}$).` });
      const part = ts ? particular([p, 1], ts) : null;
      if (part) {
        const ypTxt = suma(part.bases.map((b) => ({ c: b.c, s: baseTxt(b) })));
        pasos.push({ t: 'Solución particular', html: ansatzTxt(part, 1) + `<br>Sustituyendo en la ecuación e igualando coeficientes: $y_p = ${ypTxt}$` });
        // C por la condición inicial
        const hx = Math.exp(-p * x0), C = limpio((y0 - evalBases(part.bases, x0)) / hx);
        const ts2 = [{ c: C, s: Math.abs(p) < 1e-14 ? '' : baseTxt({ r: -p }) }, ...part.bases.map((b) => ({ c: b.c, s: baseTxt(b) }))];
        const sTxt = suma(juntar(ts2));
        pasos.push({ t: 'Condición inicial', html: `$y = ${yhTxt} + ${ypTxt.startsWith('−') ? `(${ypTxt})` : ypTxt}$ y $y(${f(x0)}) = ${f(y0)}$ da $C = ${cTxt(C)}$:<br>$y(x) = ${sTxt}$` });
        exacta = { txt: sTxt, y: (x) => C * Math.exp(-p * x) + evalBases(part.bases, x) };
      } else pasos.push({ t: 'Solución', html: 'El término independiente no es de los que se resuelven por coeficientes indeterminados (polinomios, exponenciales, senos y cosenos), así que se resuelve con el factor integrante o numéricamente, como aquí abajo.' });
    } else pasos.push({ t: 'Tipo', html: lin ? 'Es lineal pero con coeficientes que dependen de x: se resuelve con el factor integrante $μ(x) = e^{∫ p(x) dx}$ o numéricamente.' : 'No es lineal en y: si se pueden separar las variables, $∫ dy/h(y) = ∫ g(x) dx$; si no, se resuelve numéricamente.' });

    // Euler con el paso del alumno y RK4 fino como referencia
    const n = Math.round((x1 - x0) / h), eul = [{ x: x0, y: y0 }];
    for (let i = 0; i < n; i++) { const { x, y } = eul[i], m = F(x, y); eul.push({ x: x + h, y: y + h * m, m }); if (!isFinite(eul[i + 1].y)) break; }
    eul.forEach((e, i) => { if (i < eul.length - 1) e.m = F(e.x, e.y); });
    const fino = rk4((t, Y) => [F(t, Y[0])], x0, [y0], x1, Math.max(400, n * 20));
    const yRK = fino[fino.length - 1].t >= x1 - 1e-9 ? fino[fino.length - 1].Y[0] : NaN;
    const yEu = eul[eul.length - 1].y, yEx = exacta ? exacta.y(x1) : null;
    const filas = eul.slice(0, Math.min(eul.length - 1, 8)).map((e, i) => `<tr><td>${i}</td><td>${f(e.x, 5)}</td><td>${f(e.y, 6)}</td><td>${f(e.m, 6)}</td><td>${f(eul[i + 1].y, 6)}</td></tr>`).join('');
    pasos.push({ t: `Método de Euler con h = ${f(h)}`, html: `$y_{n+1} = y_n + h f(x_n, y_n)$, empezando en $(x_0, y_0) = (${f(x0)}, ${f(y0)})$:<table class="tabla"><tr><th>n</th><th>xₙ</th><th>yₙ</th><th>f(xₙ, yₙ)</th><th>yₙ₊₁</th></tr>${filas}</table>${eul.length - 1 > 8 ? `… y así hasta n = ${eul.length - 1}. ` : ''}En x = ${f(x1)} Euler da y ≈ ${f(yEu, 6)}.` });
    pasos.push({ t: 'Comparación', html: `${exacta ? `La solución exacta vale $y(${f(x1)}) = ${f(yEx, 7)}$` : `Con Runge-Kutta (RK4, ${fino.length - 1} pasos) sale $y(${f(x1)}) ≈ ${f(yRK, 7)}$`}, así que el error de Euler es ${f(Math.abs(yEu - (exacta ? yEx : yRK)), 3)}. El error de Euler es proporcional a h: con la mitad de paso, más o menos la mitad de error.` });
    return { modo: 'primer', fTxt, F, x0, y0, x1, h, eul, fino, exacta, yRK, yEu, yEx, pasos, lineal: p !== null };
  }
  // sustituye y por un nodo
  function sustY(n, por) {
    if (esY(n)) return por;
    if (n.a === undefined && n.b === undefined) return n;
    return { ...n, ...(n.a ? { a: sustY(n.a, por) } : {}), ...(n.b ? { b: sustY(n.b, por) } : {}) };
  }
  // junta términos con la misma base
  function juntar(ts) { const out = []; for (const t of ts) { const o = out.find((q) => q.s === t.s); if (o) o.c += t.c; else out.push({ ...t }); } return out; }
  function ansatzTxt(part, orden) {
    const xs = part.grupos.map((g) => {
      const pol = (L) => (g.k === 0 ? L : `(${Array.from({ length: g.k + 1 }, (_, j) => `${L}_{${j}}${j ? (j === 1 ? ' x' : ` x^{${j}}`) : ''}`).join(' + ')})`);
      const e = g.r ? ` e^{${linTxt(g.r, 'x')}}` : '', xs = g.s ? (g.s === 1 ? 'x ' : 'x^{2} ') : '';
      const cuerpo = g.w ? `${xs}${e}(${pol('A')} cos ${linTxt(g.w, 'x')} + ${pol('B')} sen ${linTxt(g.w, 'x')})`.replace('( ', '(') : `${xs}${pol('A')}${e}`;
      return { cuerpo, s: g.s };
    });
    const res = xs.some((q) => q.s) ? ` Como ${part.grupos.filter((g) => g.s).map((g) => `$λ = ${g.w ? `${Math.abs(g.r) < 1e-12 ? '±' : cTxt(g.r) + ' ± '}${Math.abs(g.w - 1) < 1e-12 ? '' : cTxt(g.w) + ' '}i` : cTxt(g.r)}$`).join(' y ')} ${part.grupos.filter((g) => g.s).length > 1 ? 'son raíces' : 'es raíz'} de la ecuación característica (resonancia), se multiplica por $x${xs.some((q) => q.s === 2) ? '^2' : ''}$.` : '';
    return `Se prueba con una función de la misma forma que el término independiente: $y_p = ${xs.map((q) => (xs.length === 1 ? q.cuerpo.replace(/^\(([^()]*)\)$/, '$1') : q.cuerpo)).join(' + ')}$.${res}`;
  }

  /* ---------- Segundo orden con coeficientes constantes ---------- */
  function segundo(sc) {
    const a = num(sc.a, 'el coeficiente a'), b = vacio(sc.b) ? 0 : num(sc.b, 'el coeficiente b'), c = vacio(sc.c) ? 0 : num(sc.c, 'el coeficiente c');
    if (Math.abs(a) < 1e-14) throw new Error('El coeficiente a de y″ no puede ser 0 (sería de primer orden)');
    const gAst = vacio(sc.g) ? E.N(0) : E.lee(sc.g, 'El término g(x)');
    const x0 = num(sc.x0, 'el valor x₀'), y0 = num(sc.y0, 'el valor y(x₀)'), v0 = num(sc.v0, 'el valor y′(x₀)'), x1 = num(sc.x1, 'el final del intervalo');
    if (!(x1 > x0)) throw new Error('El final del intervalo tiene que ser mayor que x₀');
    const gTxt = E.texto(E.simp(gAst)), homog = !E.tieneX(gAst) && Math.abs(E.valor(gAst, 0)) < 1e-14;
    const pasos = [], coefTxt = (k, s, primero) => { if (Math.abs(k) < 1e-14) return ''; const sg = k < 0 ? '−' : primero ? '' : '+', m = Math.abs(k); return `${primero ? sg : ` ${sg} `}${Math.abs(m - 1) < 1e-12 && s ? '' : cTxt(m) + (s ? ' ' : '')}${s}`; };
    const ecTxt = `${coefTxt(a, 'y″', true)}${coefTxt(b, 'y′')}${coefTxt(c, 'y')} = ${gTxt}`;
    const carTxt = `${coefTxt(a, 'λ^2', true)}${coefTxt(b, 'λ')}${coefTxt(c, '')} = 0`;
    pasos.push({ t: 'La ecuación', html: `$${ecTxt}$ con $y(${f(x0)}) = ${f(y0)}$ y $y′(${f(x0)}) = ${f(v0)}$. ${homog ? 'Es homogénea.' : 'La solución es $y = y_h + y_p$: la de la homogénea más una particular.'}` });
    const D = b * b - 4 * a * c, al = -b / (2 * a);
    let hb, yhTxt, tipo, raices;
    if (D > 1e-12 * Math.max(1, b * b)) {
      const l1 = limpio(al + Math.sqrt(D) / (2 * Math.abs(a))), l2 = limpio(al - Math.sqrt(D) / (2 * Math.abs(a)));
      hb = [{ m: 0, r: l1, w: 0, p: null }, { m: 0, r: l2, w: 0, p: null }];
      raices = `$λ_1 = ${cTxt(l1)}$ y $λ_2 = ${cTxt(l2)}$, reales y distintas`;
      yhTxt = `C_1 ${baseTxt(hb[0]) || '· 1'} + C_2 ${baseTxt(hb[1]) || '· 1'}`.replace(/C_(\d) · 1/g, 'C_$1');
      tipo = 'Sobreamortiguado';
    } else if (D >= -1e-12 * Math.max(1, b * b)) {
      const l = limpio(al);
      hb = [{ m: 0, r: l, w: 0, p: null }, { m: 1, r: l, w: 0, p: null }];
      raices = `$λ = ${cTxt(l)}$, doble`;
      yhTxt = l ? `(C_1 + C_2 x) e^{${linTxt(l, 'x')}}` : 'C_1 + C_2 x';
      tipo = 'Amortiguamiento crítico';
    } else {
      const be = limpio(Math.sqrt(-D) / (2 * Math.abs(a))), alc = limpio(al);
      hb = [{ m: 0, r: alc, w: be, p: 'cos' }, { m: 0, r: alc, w: be, p: 'sen' }];
      raices = `$λ = ${alc ? cTxt(alc) + ' ± ' : '±'}${Math.abs(be - 1) < 1e-12 ? '' : cTxt(be) + ' '}i$, complejas conjugadas`;
      const w = linTxt(be, 'x');
      yhTxt = `${alc ? `e^{${linTxt(alc, 'x')}} ` : ''}(C_1 cos ${w.includes(' ') || /^[{\d]/.test(w) ? `(${w})` : w} + C_2 sen ${w.includes(' ') || /^[{\d]/.test(w) ? `(${w})` : w})`.replace(/^\((.*)\)$/, '$1');
      tipo = Math.abs(alc) < 1e-14 ? 'Oscilación sin amortiguar' : alc < 0 ? 'Subamortiguado (oscila y se apaga)' : 'Oscilación que crece';
    }
    if (hb[0].r > 1e-12 || hb[1].r > 1e-12) tipo = D < 0 ? tipo : 'Crece sin límite (inestable)';
    pasos.push({ t: 'Ecuación característica', html: `Probando $y = e^{λx}$ sale $${carTxt}$, con discriminante $Δ = b^2 − 4ac = ${f(D)}$: ${raices}.<br>$y_h = ${yhTxt}$` });
    let part = { bases: [], grupos: [] }, ypTxt = '0';
    if (!homog) {
      const ts = terminos(gAst);
      part = ts ? particular([c, b, a], ts) : null;
      if (!part) throw new Error('g(x) tiene que ser una suma de polinomios, exponenciales, senos y cosenos (por ejemplo 3x^2, e^(2x), 5 sen(3x) o x e^x) para resolverla por coeficientes indeterminados');
      ypTxt = suma(part.bases.map((q) => ({ c: q.c, s: baseTxt(q) })));
      pasos.push({ t: 'Solución particular', html: ansatzTxt(part, 2) + `<br>Sustituyendo en la ecuación e igualando coeficientes: $y_p = ${ypTxt}$` });
    }
    // C₁ y C₂ por las condiciones iniciales
    const M = [[dReal(hb[0], 0, x0), dReal(hb[1], 0, x0)], [dReal(hb[0], 1, x0), dReal(hb[1], 1, x0)]];
    const Cs = resuelve(M, [y0 - evalBases(part.bases, x0), v0 - evalBases(part.bases, x0, 1)]).map(limpio);
    const todo = [...hb.map((q, i) => ({ ...q, c: Cs[i] })), ...part.bases];
    const sTxt = suma(juntar(todo.map((q) => ({ c: q.c, s: baseTxt(q) }))));
    pasos.push({ t: 'Condiciones iniciales', html: `$y = ${yhTxt}${homog ? '' : ` + ${ypTxt.startsWith('−') ? `(${ypTxt})` : ypTxt}`}$. Imponiendo $y(${f(x0)}) = ${f(y0)}$ y $y′(${f(x0)}) = ${f(v0)}$ sale un sistema de dos ecuaciones con $C_1 = ${cTxt(Cs[0])}$ y $C_2 = ${cTxt(Cs[1])}$:<br>$y(x) = ${sTxt}$` });
    if (homog && a > 0 && c > 0 && b >= 0) pasos.push({ t: 'Interpretación', html: `Es como un oscilador: masa a = ${f(a)}, rozamiento b = ${f(b)} y muelle c = ${f(c)}. ${b === 0 ? `Sin rozamiento oscila para siempre con $ω = √(c/a) = ${cTxt(limpio(Math.sqrt(c / a)))}$ y periodo $T = 2π/ω = ${cTxt(limpio((2 * Math.PI) / Math.sqrt(c / a)))}$.` : D < 0 ? `El rozamiento es pequeño (Δ < 0): oscila con $ω = ${f(Math.sqrt(-D) / (2 * a))}$ mientras la amplitud baja como $e^{${linTxt(al, 'x')}}$.` : D === 0 ? 'Es el amortiguamiento crítico: vuelve al equilibrio lo más rápido posible sin oscilar.' : 'El rozamiento es grande (Δ > 0): vuelve al equilibrio sin oscilar, despacio.'}` });
    const y = (x, i = 0) => todo.reduce((s, q) => s + q.c * dReal(q, i, x), 0);
    return { modo: 'segundo', a, b, c, D, x0, y0, v0, x1, y, txt: sTxt, yhTxt, ypTxt, tipo, raices, homog, pasos, carTxt, ecTxt };
  }

  /* ---------- Sistemas 2×2 ---------- */
  function autovalores(J) {
    const [[a, b], [c, d]] = J, tr = a + d, det = a * d - b * c, D = tr * tr - 4 * det;
    return { tr, det, D, l: D >= 0 ? [(tr + Math.sqrt(D)) / 2, (tr - Math.sqrt(D)) / 2] : null, al: tr / 2, be: D < 0 ? Math.sqrt(-D) / 2 : 0 };
  }
  function tipoPunto(ev, tol = 1e-9) {
    const { tr, det, D } = ev;
    if (Math.abs(det) < tol) return { nom: 'punto crítico no aislado (det = 0)', est: null };
    if (det < 0) return { nom: 'punto de silla', est: false };
    if (Math.abs(D) < tol) return { nom: tr < 0 ? 'nodo impropio estable' : 'nodo impropio inestable', est: tr < 0 };
    if (D > 0) return { nom: tr < 0 ? 'nodo estable' : 'nodo inestable', est: tr < 0 };
    if (Math.abs(tr) < tol) return { nom: 'centro (órbitas cerradas)', est: null };
    return { nom: tr < 0 ? 'foco estable (espiral que entra)' : 'foco inestable (espiral que sale)', est: tr < 0 };
  }
  const evTxt = (ev) => (ev.l ? (Math.abs(ev.l[0] - ev.l[1]) < 1e-12 ? `$λ = ${cTxt(limpio(ev.l[0]))}$ (doble)` : `$λ_1 = ${cTxt(limpio(ev.l[0]))}$, $λ_2 = ${cTxt(limpio(ev.l[1]))}$`) : `$λ = ${Math.abs(ev.al) < 1e-12 ? '±' : cTxt(limpio(ev.al)) + ' ± '}${Math.abs(ev.be - 1) < 1e-12 ? '' : cTxt(limpio(ev.be)) + ' '}i$`);
  const matHtml = (M) => `<span class="mat"><table>${M.map((r) => `<tr>${r.map((c) => `<td>$${c}$</td>`).join('')}</tr>`).join('')}</table></span>`;
  const matTxt = (J) => matHtml(J.map((r) => r.map((v) => cTxt(limpio(v)))));
  function sistema(sc) {
    const fA = E.lee(sc.f, 'La función de x′', ['x', 'y']), gA = E.lee(sc.g, 'La función de y′', ['x', 'y']);
    const x0 = num(sc.x0, 'el valor x(0)'), y0 = num(sc.y0, 'el valor y(0)'), t1 = num(sc.t1, 'el tiempo final');
    if (!(t1 > 0)) throw new Error('El tiempo final tiene que ser positivo');
    const F = (x, y) => E.valor(fA, x, { y }), G = (x, y) => E.valor(gA, x, { y });
    if (!isFinite(F(x0, y0)) || !isFinite(G(x0, y0))) throw new Error('El sistema no está definido en el punto inicial');
    const fT = E.texto(E.simp(fA)), gT = E.texto(E.simp(gA)), pasos = [];
    pasos.push({ t: 'El sistema', html: `$x′ = ${fT}$, &ensp; $y′ = ${gT}$, con $(x(0), y(0)) = (${f(x0)}, ${f(y0)})$. Cada punto del plano tiene una velocidad (x′, y′): eso es el campo de direcciones del diagrama de fases.` });
    // jacobiano simbólico
    const dfx = E.deriva(fA, 'x'), dfy = E.deriva(fA, 'y'), dgx = E.deriva(gA, 'x'), dgy = E.deriva(gA, 'y');
    const J = (x, y) => [[E.valor(dfx, x, { y }), E.valor(dfy, x, { y })], [E.valor(dgx, x, { y }), E.valor(dgy, x, { y })]];
    // ¿lineal? el jacobiano es constante
    const prueba = [[0.3, -0.7], [1.9, 0.4], [-1.2, 2.3]], J0 = J(0.11, 0.23);
    const esLineal = prueba.every(([x, y]) => J(x, y).flat().every((v, i) => isFinite(v) && Math.abs(v - J0.flat()[i]) < 1e-9 * Math.max(1, Math.abs(v))));
    const puntos = [];
    let sol = null;
    if (esLineal) {
      const A = J0.map((r) => r.map(limpio)), e = [limpio(F(0, 0)), limpio(G(0, 0))];
      const ev = autovalores(A), tp = tipoPunto(ev);
      pasos.push({ t: 'Es lineal', html: `$(x′, y′) = A (x, y)${e[0] || e[1] ? ` + (${cTxt(e[0])}, ${cTxt(e[1])})` : ''}$ con $A =$ ${matTxt(A)}. Traza $= ${cTxt(ev.tr)}$, determinante $= ${cTxt(ev.det)}$ y $Δ = tr^2 − 4 det = ${cTxt(limpio(ev.D))}$.` });
      if (Math.abs(ev.det) > 1e-12) {
        const X = resuelve(A, [-e[0], -e[1]]).map(limpio);
        puntos.push({ x: X[0], y: X[1], J: A, ev, tp });
        pasos.push({ t: 'Punto crítico', html: `Donde x′ = y′ = 0: $(${cTxt(X[0])}, ${cTxt(X[1])})$. Los autovalores de A, raíces de $λ^2 − ${cTxt(ev.tr)} λ + ${cTxt(ev.det)} = 0$, son ${evTxt(ev)}: es un <b>${tp.nom}</b>.`.replace('− −', '+ ').replace('+ −', '− ') });
        sol = lineal2(A, X, x0, y0);
        if (sol) pasos.push({ t: 'Solución', html: sol.html + `<br>$x(t) = ${sol.xTxt}$<br>$y(t) = ${sol.yTxt}$` });
      } else pasos.push({ t: 'Puntos críticos', html: 'El determinante es 0: los puntos críticos forman una recta (o no hay ninguno), y la solución se calcula numéricamente.' });
    } else {
      // puntos críticos por Newton desde una rejilla
      const W = Math.max(4, 2 * Math.abs(x0), 2 * Math.abs(y0));
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        let x = (i * W) / 3, y = (j * W) / 3, ok = false;
        for (let k = 0; k < 40; k++) {
          const Jm = J(x, y), fx = F(x, y), gx = G(x, y), det = Jm[0][0] * Jm[1][1] - Jm[0][1] * Jm[1][0];
          if (!isFinite(fx) || !isFinite(gx) || Math.abs(det) < 1e-14) break;
          const dx = (fx * Jm[1][1] - gx * Jm[0][1]) / det, dy = (gx * Jm[0][0] - fx * Jm[1][0]) / det;
          x -= dx; y -= dy;
          if (Math.hypot(dx, dy) < 1e-12) { ok = Math.abs(F(x, y)) + Math.abs(G(x, y)) < 1e-10; break; }
        }
        if (ok && Math.abs(x) <= 1.5 * W && Math.abs(y) <= 1.5 * W && !puntos.some((q) => Math.hypot(q.x - x, q.y - y) < 1e-6)) { const Jm = J(x, y), ev = autovalores(Jm); puntos.push({ x: limpio(x), y: limpio(y), J: Jm, ev, tp: tipoPunto(ev) }); }
      }
      puntos.sort((p, q) => p.x - q.x || p.y - q.y);
      pasos.push({ t: 'Jacobiano', html: `No es lineal: cerca de cada punto crítico se parece a su linealización, con la matriz jacobiana<br>$J(x, y) =$ ${matHtml([[E.texto(dfx), E.texto(dfy)], [E.texto(dgx), E.texto(dgy)]])}` });
      pasos.push({ t: 'Puntos críticos', html: puntos.length ? puntos.slice(0, 6).map((q) => `$(${cTxt(q.x)}, ${cTxt(q.y)})$: $J =$ ${matTxt(q.J)}, ${evTxt(q.ev)} → <b>${q.tp.nom}</b>`).join('<br>') + (puntos.length > 6 ? `<br>… y ${puntos.length - 6} más` : '') : 'No se han encontrado puntos críticos cerca del origen.' });
    }
    const tray = rk4((t, Y) => [F(Y[0], Y[1]), G(Y[0], Y[1])], 0, [x0, y0], t1, 1500);
    const fin = tray[tray.length - 1];
    pasos.push({ t: 'Trayectoria', html: `Integrando con Runge-Kutta desde (${f(x0)}, ${f(y0)}) hasta t = ${f(t1)}: $(x, y) ≈ (${f(fin.Y[0], 5)}, ${f(fin.Y[1], 5)})$${fin.t < t1 - 1e-9 ? ` (la solución se dispara antes, en t ≈ ${f(fin.t)})` : ''}.` });
    return { modo: 'sistema', F, G, fT, gT, x0, y0, t1, puntos, lineal: esLineal, sol, tray, xf: fin.Y[0], yf: fin.Y[1], pasos };
  }
  // solución exacta de X′ = A (X − X*)
  function lineal2(A, X, x0, y0) {
    const [[a, b], [c, d]] = A, ev = autovalores(A), u0 = [x0 - X[0], y0 - X[1]];
    const vec = (l) => (Math.abs(b) > 1e-12 ? [1, (l - a) / b] : Math.abs(c) > 1e-12 ? [(l - d) / c, 1] : null);
    const comp = (ts, k, X0) => suma(juntar([{ c: X0, s: '' }, ...ts.map((q) => ({ c: q.c * q.v[k], s: baseTxt(q, 't') }))]));
    if (ev.l && Math.abs(ev.l[0] - ev.l[1]) > 1e-10) {
      const [l1, l2] = ev.l.map(limpio);
      let v1 = vec(l1), v2 = vec(l2);
      if (!v1 || !v2) { v1 = Math.abs(a - l1) < 1e-12 ? [1, 0] : [0, 1]; v2 = v1[0] ? [0, 1] : [1, 0]; }
      v1 = v1.map(limpio); v2 = v2.map(limpio);
      const C = resuelve([[v1[0], v2[0]], [v1[1], v2[1]]], u0).map(limpio);
      const ts = [{ c: C[0], v: v1, r: l1, m: 0, w: 0, p: null }, { c: C[1], v: v2, r: l2, m: 0, w: 0, p: null }];
      const X_ = (t) => [0, 1].map((k) => X[k] + ts.reduce((s, q) => s + q.c * q.v[k] * Math.exp(q.r * t), 0));
      return { html: `Autovectores $v_1 = (${v1.map(cTxt).join(', ')})$ y $v_2 = (${v2.map(cTxt).join(', ')})$, así que $X(t) = X^* + C_1 v_1 e^{λ_1 t} + C_2 v_2 e^{λ_2 t}$; con el punto inicial, $C_1 = ${cTxt(C[0])}$ y $C_2 = ${cTxt(C[1])}$:`, xTxt: comp(ts, 0, X[0]), yTxt: comp(ts, 1, X[1]), X: X_ };
    }
    if (ev.l) {
      const l = limpio(ev.l[0]);
      if (Math.abs(b) < 1e-12 && Math.abs(c) < 1e-12) {
        const ts = [{ c: 1, v: u0.map(limpio), r: l, m: 0, w: 0, p: null }];
        return { html: `A = λI: todas las direcciones son propias y $X(t) = X^* + e^{λt} (X(0) − X^*)$:`, xTxt: comp(ts, 0, X[0]), yTxt: comp(ts, 1, X[1]), X: (t) => [0, 1].map((k) => X[k] + u0[k] * Math.exp(l * t)) };
      }
      const v = vec(l).map(limpio), w = resuelve([[a - l, b], [c, d - l]].map((r) => r), v) || (Math.abs(b) > 1e-12 ? [0, 1 / b] : [1 / c, 0]);
      const C = resuelve([[v[0], w[0]], [v[1], w[1]]], u0).map(limpio), wl = w.map(limpio);
      // X = e^{λt}[C₁ v + C₂ (t v + w)]
      const ts = [{ c: 1, v: [C[0] * v[0] + C[1] * wl[0], C[0] * v[1] + C[1] * wl[1]], r: l, m: 0, w: 0, p: null }, { c: C[1], v, r: l, m: 1, w: 0, p: null }];
      return { html: `Autovalor doble con un solo autovector $v = (${v.map(cTxt).join(', ')})$ y un vector generalizado $w = (${wl.map(cTxt).join(', ')})$: $X(t) = X^* + e^{λt}[C_1 v + C_2 (t v + w)]$, con $C_1 = ${cTxt(C[0])}$ y $C_2 = ${cTxt(C[1])}$:`, xTxt: comp(ts, 0, X[0]), yTxt: comp(ts, 1, X[1]), X: (t) => [0, 1].map((k) => X[k] + ts.reduce((s, q) => s + q.c * q.v[k] * t ** q.m * Math.exp(l * t), 0)) };
    }
    // complejos: λ = α ± iβ, v = p + i q
    const al = limpio(ev.al), be = limpio(ev.be);
    let P, Q;
    if (Math.abs(b) > 1e-12) { P = [1, (al - a) / b]; Q = [0, be / b]; } else { P = [(al - d) / c, 1]; Q = [be / c, 0]; }
    P = P.map(limpio); Q = Q.map(limpio);
    // X − X* = e^{αt}[C₁(P cos βt − Q sen βt) + C₂(P sen βt + Q cos βt)]
    const C = resuelve([[P[0], Q[0]], [P[1], Q[1]]], u0).map(limpio);
    const cosK = [0, 1].map((k) => limpio(C[0] * P[k] + C[1] * Q[k])), senK = [0, 1].map((k) => limpio(C[1] * P[k] - C[0] * Q[k]));
    const ts = [{ c: 1, v: cosK, r: al, m: 0, w: be, p: 'cos' }, { c: 1, v: senK, r: al, m: 0, w: be, p: 'sen' }];
    return { html: `Con $λ = α + iβ$ y su autovector $v = (${P.map(cTxt).join(', ')}) + i (${Q.map(cTxt).join(', ')})$, la parte real e imaginaria de $v e^{λt}$ dan dos soluciones reales; con el punto inicial:`, xTxt: comp(ts, 0, X[0]), yTxt: comp(ts, 1, X[1]), X: (t) => [0, 1].map((k) => X[k] + Math.exp(al * t) * (cosK[k] * Math.cos(be * t) + senK[k] * Math.sin(be * t))) };
  }

  function resolver(sc) {
    if (sc.modo === 'segundo') return segundo(sc);
    if (sc.modo === 'sistema') return sistema(sc);
    return primer(sc);
  }

  const P1 = (f_, x0, y0, x1, h) => ({ modo: 'primer', f: f_, x0, y0, x1, h });
  const P2 = (a, b, c, g, y0, v0, x1) => ({ modo: 'segundo', a, b, c, g, x0: '0', y0, v0, x1 });
  const PS = (f_, g, x0, y0, t1) => ({ modo: 'sistema', f: f_, g, x0, y0, t1 });
  const ejemplos = [
    { clave: 'euler', nombre: 'y′ = x + y con Euler (h = 0,1)', sc: P1('x + y', '0', '1', '1', '0,1') },
    { clave: 'lineal', nombre: 'y′ = 4 − 2y: tiende al equilibrio', sc: P1('4 - 2y', '0', '0', '3', '0,25') },
    { clave: 'enfriamiento', nombre: 'Ley de enfriamiento de Newton', sc: P1('-0,1(y - 20)', '0', '90', '30', '2') },
    { clave: 'forzada', nombre: 'y′ + y = sen x', sc: P1('sen x - y', '0', '0', '10', '0,5') },
    { clave: 'logistica', nombre: 'Logística: y′ = y(1 − y)', sc: P1('y(1 - y)', '0', '0,1', '10', '0,5') },
    { clave: 'riccati', nombre: 'y′ = x − y² (no lineal)', sc: P1('x - y^2', '0', '0', '4', '0,2') },
    { clave: 'mas', nombre: 'y″ + 4y = 0: oscilador armónico', sc: P2('1', '0', '4', '0', '1', '0', '10') },
    { clave: 'subamortiguado', nombre: 'y″ + 2y′ + 5y = 0: subamortiguado', sc: P2('1', '2', '5', '0', '1', '0', '6') },
    { clave: 'critico', nombre: 'y″ + 2y′ + y = x: crítico con fuerza', sc: P2('1', '2', '1', 'x', '0', '0', '8') },
    { clave: 'exponencial', nombre: 'y″ − 3y′ + 2y = e^(3x)', sc: P2('1', '-3', '2', 'e^(3x)', '0', '0', '1,5') },
    { clave: 'resonancia', nombre: 'y″ + y = cos x: resonancia', sc: P2('1', '0', '1', 'cos x', '0', '0', '30') },
    { clave: 'forzado', nombre: 'Oscilador forzado: y″ + 0,5y′ + 4y = 3 cos(2x)', sc: P2('1', '0,5', '4', '3 cos(2x)', '0', '0', '20') },
    { clave: 'silla', nombre: 'Sistema lineal: punto de silla', sc: PS('x + y', '4x + y', '1', '-1,5', '2') },
    { clave: 'centro', nombre: 'Sistema lineal: centro', sc: PS('y', '-x', '2', '0', '7') },
    { clave: 'foco', nombre: 'Sistema lineal: foco estable', sc: PS('-x - 2y', '2x - y', '3', '0', '6') },
    { clave: 'nodo', nombre: 'Sistema lineal: nodo estable', sc: PS('-3x + y', 'x - 3y', '2', '3', '3') },
    { clave: 'lotka', nombre: 'Presas y depredadores (Lotka-Volterra)', sc: PS('2x - x y', 'x y - 3y', '1', '1', '10') },
    { clave: 'pendulo', nombre: 'Péndulo amortiguado', sc: PS('y', '-sen x - 0,3y', '0', '2,5', '25') },
  ];

  return { resolver, ejemplos, terminos, particular, autovalores, tipoPunto, rk4, f, cTxt };
})();
if (typeof module !== 'undefined') module.exports = EDOs;
