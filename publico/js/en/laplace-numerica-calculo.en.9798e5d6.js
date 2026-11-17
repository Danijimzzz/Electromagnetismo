const LaplaceNumerica = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (t) => t[0].toUpperCase() + t.slice(1);
  function lee(sc, k, nom, tipo = 'positivo') {
    if (vacio(sc[k])) throw new Error(`Missing ${nom}`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} must be a number`);
    if (tipo === 'positivo' && v <= 0) throw new Error(`${may(nom)} must be greater than 0`);
    if (tipo === 'cero' && v < 0) throw new Error(`${may(nom)} cannot be negative`);
    return v;
  }

  const MAX_IT = 60000, EPS0 = 8.8541878128e-12;
  const NOM_METODO = { jacobi: 'Jacobi', gs: 'Gauss-Seidel', sor: 'SOR (over-relaxation)' };

  function relaja(nx, ny, hx, hy, V, fijo, metodo, tol, S = null, neu = {}) {
    const W = nx + 1, ax = 1 / (hx * hx), ay = 1 / (hy * hy), d = 2 * (ax + ay);
    const ex = neu.izq || neu.der ? 2 : 1, ey = neu.aba || neu.arr ? 2 : 1; // un borde aislante equivale a una caja más larga
    const rho = (hy * hy * Math.cos(Math.PI / (nx * ex)) + hx * hx * Math.cos(Math.PI / (ny * ey))) / (hx * hx + hy * hy);
    const om = metodo === 'sor' ? 2 / (1 + Math.sqrt(1 - rho * rho)) : 1;
    const r = metodo === 'jacobi' ? rho : metodo === 'gs' ? rho * rho : om - 1, factor = r / (1 - r);
    let nuevo = metodo === 'jacobi' ? V.slice() : null, iter = 0, dif = Infinity;
    const T = neu.izq || neu.der || neu.aba || neu.arr; // con bordes aislantes los nodos del borde también se relajan
    const j0 = neu.aba ? 0 : 1, j1 = neu.arr ? ny : ny - 1, i0 = neu.izq ? 0 : 1, i1 = neu.der ? nx : nx - 1;
    while (iter < MAX_IT && dif * factor > tol) {
      dif = 0;
      for (let j = T ? 0 : 1; j <= (T ? ny : ny - 1); j++) for (let i = T ? 0 : 1; i <= (T ? nx : nx - 1); i++) {
        const k = j * W + i;
        if (fijo[k] || j < j0 || j > j1 || i < i0 || i > i1) { if (nuevo) nuevo[k] = V[k]; continue; }
        const L = i > 0 ? V[k - 1] : V[k + 1], R = i < nx ? V[k + 1] : V[k - 1], D = j > 0 ? V[k - W] : V[k + W], U = j < ny ? V[k + W] : V[k - W];
        const m = (ax * (L + R) + ay * (D + U) + (S ? S[k] : 0)) / d;
        const v = metodo === 'jacobi' ? m : V[k] + om * (m - V[k]);
        const c = Math.abs(v - V[k]); if (c > dif) dif = c;
        if (nuevo) nuevo[k] = v; else V[k] = v;
      }
      if (nuevo) { for (let k = 0; k < V.length; k++) V[k] = nuevo[k]; }
      iter++;
    }
    return { iter, dif, om, convergio: dif * factor <= tol };
  }

  function residuo(nx, ny, hx, hy, V, fijo, S = null) {
    const W = nx + 1, ax = 1 / (hx * hx), ay = 1 / (hy * hy); let r = 0;
    for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) {
      const k = j * W + i; if (fijo[k]) continue;
      r = Math.max(r, Math.abs(ax * (V[k - 1] - 2 * V[k] + V[k + 1]) + ay * (V[k - W] - 2 * V[k] + V[k + W]) + (S ? S[k] : 0)));
    }
    return r;
  }

  const razon = (p, u, c) => (Math.exp(p * (u - c)) - Math.exp(-p * (u + c))) / (1 - Math.exp(-2 * p * c));
  function serie(sol, x, y) {
    const { a, b, bordes } = sol, { arriba, abajo, izq, der } = bordes; let s = 0;
    for (let n = 1; n <= 801; n += 2) {
      const k = 4 / (n * Math.PI), p = n * Math.PI / a, q = n * Math.PI / b;
      s += k * Math.sin(p * x) * (arriba * razon(p, y, b) + abajo * razon(p, b - y, b));
      s += k * Math.sin(q * y) * (der * razon(q, x, a) + izq * razon(q, a - x, a));
    }
    return s;
  }

  function seriePoisson(sol, x, y) {
    const { a, b, rho } = sol; let t = 0;
    for (let m = 1; m <= 199; m += 2) for (let n = 1; n <= 199; n += 2) t += (16 * rho) / (Math.PI ** 2 * EPS0 * m * n * ((m * Math.PI / a) ** 2 + (n * Math.PI / b) ** 2)) * Math.sin(m * Math.PI * x / a) * Math.sin(n * Math.PI * y / b);
    return t;
  }
  function exactoEn(sol, x, y) {
    if (sol.electrodos.length) return null;
    const { neu, rho, rhoRegion } = sol, n4 = neu.izq + neu.der + neu.aba + neu.arr;
    if (rho && rhoRegion) return null;
    if (n4 === 0) return serie(sol, x, y) + (rho ? seriePoisson(sol, x, y) : 0);
    if (neu.aba && neu.arr && !neu.izq && !neu.der) return sol.bordes.izq + ((sol.bordes.der - sol.bordes.izq) * x) / sol.a + (rho * x * (sol.a - x)) / (2 * EPS0);
    return null;
  }

  function valorEn(sol, x, y) {
    const { nx, ny, hx, hy, V } = sol, W = nx + 1;
    const u = Math.min(Math.max(x / hx, 0), nx), w = Math.min(Math.max(y / hy, 0), ny);
    const i = Math.min(Math.floor(u), nx - 1), j = Math.min(Math.floor(w), ny - 1), s = u - i, t = w - j;
    const v00 = V[j * W + i], v10 = V[j * W + i + 1], v01 = V[(j + 1) * W + i], v11 = V[(j + 1) * W + i + 1];
    const v = v00 * (1 - s) * (1 - t) + v10 * s * (1 - t) + v01 * (1 - s) * t + v11 * s * t;
    const ex = -((v10 - v00) * (1 - t) + (v11 - v01) * t) / hx, ey = -((v01 - v00) * (1 - s) + (v11 - v10) * s) / hy;
    return { V: v, Ex: ex, Ey: ey, E: Math.hypot(ex, ey) };
  }

  const TIPO_BORDE = { v: 'fijo', n: 'aislante' };
  function leeElectrodos(sc, nx, ny, hx, hy, a, b, neu, V, fijo) {
    const W = nx + 1, out = [];
    const defs = [['elec', 'et', 'ex', 'ey', 'ew', 'eh', 'ev', 1], ['e2', 'e2t', 'e2x', 'e2y', 'e2w', 'e2h', 'e2v', 2], ['e3', 'e3t', 'e3x', 'e3y', 'e3w', 'e3h', 'e3v', 3]];
    for (const [on, tt, kx, ky, kw, kh, kv, num] of defs) {
      if (sc[on] !== '1') continue;
      const circ = sc[tt] === 'circ', nom = `of electrode ${num}`, ex = lee(sc, kx, `the x ${nom}`, circ ? 'cualquiera' : 'cero'), ey = lee(sc, ky, `the y ${nom}`, circ ? 'cualquiera' : 'cero'), ew = lee(sc, kw, circ ? `the radius ${nom}` : `the width ${nom}`), ev = lee(sc, kv, `the potential ${nom}`, 'cualquiera');
      const eh = circ ? ew : lee(sc, kh, `the height ${nom}`), minX = neu.izq ? 0 : 1, maxX = neu.der ? nx : nx - 1, minY = neu.aba ? 0 : 1, maxY = neu.arr ? ny : ny - 1;
      const nodos = []; let lim;
      if (circ) {
        for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) if ((i * hx - ex) ** 2 + (j * hy - ey) ** 2 <= ew * ew * (1 + 1e-9)) nodos.push([i, j]);
        if (nodos.length < 4) throw new Error(`Electrode ${num} (circular) is too small for the grid: enlarge its radius or use more cells`);
        lim = { i0: Math.min(...nodos.map((q) => q[0])), i1: Math.max(...nodos.map((q) => q[0])), j0: Math.min(...nodos.map((q) => q[1])), j1: Math.max(...nodos.map((q) => q[1])) };
      } else {
        if (ex + ew > a * (1 + 1e-9) || ey + eh > b * (1 + 1e-9)) throw new Error(`Electrode ${num} must fit inside the box`);
        lim = { i0: Math.round(ex / hx), i1: Math.round((ex + ew) / hx), j0: Math.round(ey / hy), j1: Math.round((ey + eh) / hy) };
        if (lim.i1 - lim.i0 < 1 || lim.j1 - lim.j0 < 1) throw new Error(`Electrode ${num} is smaller than a cell: enlarge its dimensions or use more cells`);
        for (let j = lim.j0; j <= lim.j1; j++) for (let i = lim.i0; i <= lim.i1; i++) nodos.push([i, j]);
      }
      if (lim.i0 < minX || lim.j0 < minY || lim.i1 > maxX || lim.j1 > maxY) throw new Error(`Electrode ${num} must be at least one cell away from the fixed edges`);
      if (circ && (ex - ew < -1e-9 || ey - ew < -1e-9 || ex + ew > a * (1 + 1e-9) || ey + ew > b * (1 + 1e-9)) && false) throw new Error('x');
      for (const [i, j] of nodos) { const k = j * W + i; if (fijo[k] && !(out.length === 0 && false)) throw new Error(`Electrode ${num} overlaps another electrode or touches a fixed edge`); V[k] = ev; fijo[k] = 1; }
      out.push({ num, tipo: circ ? 'circ' : 'rect', x: ex, y: ey, w: ew, h: eh, v: ev, ...lim, nodos, n: nodos.length });
    }
    return out;
  }

  function cargas(sol) {
    const { nx, ny, hx, hy, V, fijo, id, conductores } = sol, W = nx + 1, q = conductores.map(() => 0);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const k = j * W + i, c = id[k]; if (c < 0) continue;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii > nx || jj > ny) continue;
        const kk = jj * W + ii; if (id[kk] >= 0) continue; // vecino del mismo conductor o de otro: sin flujo en el medio
        q[c] += EPS0 * ((V[k] - V[kk]) / (di ? hx : hy)) * (di ? hy : hx) * (di ? (j === 0 || j === ny ? 0.5 : 1) : (i === 0 || i === nx ? 0.5 : 1));
      }
    }
    return q;
  }
  function energia(sol) {
    const { nx, ny, hx, hy, V } = sol, W = nx + 1; let t = 0;
    for (let j = 0; j <= ny; j++) for (let i = 0; i < nx; i++) t += ((V[j * W + i + 1] - V[j * W + i]) / hx) ** 2 * hx * hy * (j === 0 || j === ny ? 0.5 : 1);
    for (let j = 0; j < ny; j++) for (let i = 0; i <= nx; i++) t += ((V[(j + 1) * W + i] - V[j * W + i]) / hy) ** 2 * hx * hy * (i === 0 || i === nx ? 0.5 : 1);
    return 0.5 * EPS0 * t;
  }

  function resolver(sc, opc = {}) {
    const a = lee(sc, 'a', 'the width of the box'), b = lee(sc, 'b', 'the height of the box');
    const nx = Math.round(lee(sc, 'n', 'the number of cells across the width'));
    if (nx < 8 || nx > 80) throw new Error('The cells across the width go from 8 to 80');
    const ny = Math.max(4, Math.min(120, Math.round(nx * b / a)));
    if (b / a > 3 || a / b > 3) throw new Error('The width and the height cannot differ by more than a factor of 3');
    const hx = a / nx, hy = b / ny, W = nx + 1;
    const tb = (k) => ((sc[k] ?? 'v') === 'n' ? 1 : 0), neu = { arr: tb('ta'), aba: tb('tb'), izq: tb('ti'), der: tb('td') };
    const val = (k, nom, aisl) => (aisl ? 0 : lee(sc, k, nom, 'cualquiera'));
    const bordes = { arriba: val('va', 'the potential of the top edge', neu.arr), abajo: val('vb', 'the potential of the bottom edge', neu.aba), izq: val('vi', 'the potential of the left edge', neu.izq), der: val('vd', 'the potential of the right edge', neu.der) };
    const tol = lee(sc, 'tol', 'the tolerance');
    const metodo = NOM_METODO[opc.metodo || sc.metodo] ? (opc.metodo || sc.metodo) : 'sor';
    const px = lee(sc, 'px', 'the x of the probe', 'cero'), py = lee(sc, 'py', 'the y of the probe', 'cero');
    if (px > a || py > b) throw new Error('The probe must be inside the box');

    const V = new Float64Array(W * (ny + 1)), fijo = new Uint8Array(W * (ny + 1)), id = new Int8Array(W * (ny + 1)).fill(-1);
    const conductores = [], idBorde = { arr: -1, aba: -1, izq: -1, der: -1 };
    for (const [clave, nom, v] of [['arr', 'Top edge', bordes.arriba], ['aba', 'Bottom edge', bordes.abajo], ['izq', 'Left edge', bordes.izq], ['der', 'Right edge', bordes.der]]) if (!neu[clave]) { idBorde[clave] = conductores.length; conductores.push({ nombre: nom, v }); }
    const marca = (i, j, v, c) => { const k = j * W + i; V[k] = v; fijo[k] = 1; if (c >= 0) id[k] = c; };
    for (let i = 0; i <= nx; i++) { if (!neu.aba) marca(i, 0, bordes.abajo, i > 0 && i < nx ? idBorde.aba : -1); if (!neu.arr) marca(i, ny, bordes.arriba, i > 0 && i < nx ? idBorde.arr : -1); }
    for (let j = 0; j <= ny; j++) { if (!neu.izq) marca(0, j, bordes.izq, j > 0 && j < ny ? idBorde.izq : -1); if (!neu.der) marca(nx, j, bordes.der, j > 0 && j < ny ? idBorde.der : -1); }
    for (const [i, j, h, v] of [[0, 0, 'aba', 'izq'], [nx, 0, 'aba', 'der'], [0, ny, 'arr', 'izq'], [nx, ny, 'arr', 'der']]) {
      if (neu[h] && !neu[v]) id[j * W + i] = idBorde[v]; else if (neu[v] && !neu[h]) id[j * W + i] = idBorde[h];
    }
    const esq = (i, j, h, v) => { const A = h.filter((x) => x !== null); if (A.length) { const m = A.reduce((s2, x) => s2 + x, 0) / A.length; V[j * W + i] = m; fijo[j * W + i] = 1; } };
    esq(0, 0, [neu.aba ? null : bordes.abajo, neu.izq ? null : bordes.izq]); esq(nx, 0, [neu.aba ? null : bordes.abajo, neu.der ? null : bordes.der]);
    esq(0, ny, [neu.arr ? null : bordes.arriba, neu.izq ? null : bordes.izq]); esq(nx, ny, [neu.arr ? null : bordes.arriba, neu.der ? null : bordes.der]);

    const electrodos = leeElectrodos(sc, nx, ny, hx, hy, a, b, neu, V, fijo);
    for (const e of electrodos) { const c = conductores.length; conductores.push({ nombre: `Electrode ${e.num}`, v: e.v }); for (const [i, j] of e.nodos) id[j * W + i] = c; }
    const nElec = electrodos.reduce((s2, e) => s2 + e.n, 0);
    if (!fijo.some((x) => x)) throw new Error('At least one edge with fixed potential or an electrode is needed');

    const rho = vacio(sc.rho) ? 0 : lee(sc, 'rho', 'the charge density ρ', 'cualquiera');
    let S = null, rhoRegion = null, qLibre = 0, qDiscreta = 0;
    if (rho) {
      S = new Float64Array(W * (ny + 1));
      const reg = !vacio(sc.rw) || !vacio(sc.rh) || !vacio(sc.rx) || !vacio(sc.ry);
      let x0 = 0, y0 = 0, x1 = a, y1 = b;
      if (reg) {
        const rx = lee(sc, 'rx', 'the x of the charged region', 'cero'), ry = lee(sc, 'ry', 'the y of the charged region', 'cero'), rw = lee(sc, 'rw', 'the width of the charged region'), rh = lee(sc, 'rh', 'the height of the charged region');
        if (rx + rw > a * (1 + 1e-9) || ry + rh > b * (1 + 1e-9)) throw new Error('The charged region must fit inside the box');
        x0 = rx; y0 = ry; x1 = rx + rw; y1 = ry + rh; rhoRegion = { x: rx, y: ry, w: rw, h: rh };
      }
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const x = i * hx, y = j * hy;
        if (x >= x0 - 1e-9 * a && x <= x1 + 1e-9 * a && y >= y0 - 1e-9 * b && y <= y1 + 1e-9 * b) { const k = j * W + i; S[k] = rho / EPS0; if (!fijo[k]) qDiscreta += rho * hx * hy * (j === 0 || j === ny ? 0.5 : 1) * (i === 0 || i === nx ? 0.5 : 1); }
      }
      qLibre = rho * (x1 - x0) * (y1 - y0);
    }

    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const r = relaja(nx, ny, hx, hy, V, fijo, metodo, tol, S, neu);
    const tiempo = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    const res = residuo(nx, ny, hx, hy, V, fijo, S);
    let vmin = Infinity, vmax = -Infinity;
    for (const v of V) { if (v < vmin) vmin = v; if (v > vmax) vmax = v; }
    const sol = { a, b, nx, ny, hx, hy, V, fijo, id, S, bordes, neu, electrodo: electrodos[0] || null, electrodos, conductores, rho, rhoRegion, qLibre, qDiscreta, metodo, tol, iter: r.iter, omega: r.om, convergio: r.convergio, cambio: r.dif, residuo: res, vmin, vmax, px, py, nElec, tiempo };
    sol.sonda = valorEn(sol, px, py);
    sol.centro = valorEn(sol, a / 2, b / 2);
    sol.exacto = exactoEn(sol, px, py);
    sol.exactoTipo = sol.exacto === null ? null : (neu.aba && neu.arr ? '1d' : 'serie');
    sol.q = cargas(sol); sol.qTotal = sol.q.reduce((s2, x) => s2 + x, 0);
    sol.W = energia(sol);
    const potenciales = [...new Set(conductores.map((c) => c.v))];
    if (potenciales.length === 2 && !rho) {
      const vh = Math.max(...potenciales), vl = Math.min(...potenciales), Qh = sol.q.reduce((s2, x, i) => s2 + (conductores[i].v === vh ? x : 0), 0);
      sol.capacidad = { Q: Qh, dV: vh - vl, C: Qh / (vh - vl), vh, vl, Cw: (2 * sol.W) / ((vh - vl) ** 2) };
    } else sol.capacidad = null;
    if (!opc.sinPasos) sol.pasos = pasos(sol);
    return sol;
  }

  function comparar(sc, mallas = null) {
    const n0 = Math.round(lee(sc, 'n', 'the number of cells across the width')), tam = mallas || [...new Set([Math.max(8, Math.round(n0 / 2)), n0, Math.min(80, n0 * 2)])].filter((n) => n >= 8 && n <= 80), filas = [];
    for (const n of tam) {
      const base = { ...sc, n: String(n) }, ref = resolver({ ...base, tol: '1e-10' }, { metodo: 'sor', sinPasos: true });
      for (const m of ['jacobi', 'gs', 'sor']) {
        const q = resolver(base, { metodo: m, sinPasos: true });
        let e = 0; for (let k = 0; k < q.V.length; k++) e = Math.max(e, Math.abs(q.V[k] - ref.V[k]));
        filas.push({ metodo: m, n, ny: q.ny, iter: q.iter, tiempo: q.tiempo, error: e, convergio: q.convergio });
      }
    }
    return filas;
  }

  function pasos(s) {
    const { a, b, nx, ny, hx, hy, bordes: bd } = s, ps = [];
    const lados = [['top', 'arr', bd.arriba], ['bottom', 'aba', bd.abajo], ['left', 'izq', bd.izq], ['right', 'der', bd.der]];
    const descE = (e) => (e.tipo === 'circ' ? `circular of radius $${f(e.w)} "m"$ centred at $(${f(e.x)}, ${f(e.y)}) "m"$` : `of $${f(e.w)} "m" × ${f(e.h)} "m"$ with its lower corner at $(${f(e.x)}, ${f(e.y)}) "m"$`);
    ps.push({ t: 'Equation and boundary conditions', html: `We look for $V(x, y)$ with $∇² V = {∂²V}/{∂x²} + {∂²V}/{∂y²} = 0$ inside a box of $${f(a)} "m" × ${f(b)} "m"$, with ${lados.map(([n, k, v]) => (s.neu[k] ? `insulating ${n} edge ($∂V/∂n = 0$)` : `$V = ${f(v)} "V"$ at the ${n} edge`)).join(', ')}${s.electrodos.map((e) => `, and an electrode ${descE(e)} at $V = ${f(e.v)} "V"$`).join('')}.` });
    if (s.rho) ps.push({ t: 'Poisson equation', html: `There is charge inside: $∇² V = −ρ/ε_0$ with $ρ = ${f(s.rho)} "C/m"^3$${s.rhoRegion ? ` in the rectangle of $${f(s.rhoRegion.w)} "m" × ${f(s.rhoRegion.h)} "m"$ with its corner at $(${f(s.rhoRegion.x)}, ${f(s.rhoRegion.y)}) "m"$` : ' in the whole box'}. On the grid each free node becomes $V_{i,j} = {(V_{i+1,j} + V_{i−1,j})/h_x^2 + (V_{i,j+1} + V_{i,j−1})/h_y^2 + ρ/ε_0}/{2/h_x^2 + 2/h_y^2}$: the mean of the neighbours plus a charge term.` });
    ps.push({ t: 'Grid', html: `The width is divided into $${nx}$ cells and the height into $${ny}$: $h_x = ${f(hx)} "m"$ and $h_y = ${f(hy)} "m"$ (${(nx + 1) * (ny + 1)} nodes${s.nElec ? `, ${s.nElec} of them belonging to the electrodes` : ''}). At the corners the mean of the two edges that meet is taken${s.neu.izq || s.neu.der || s.neu.aba || s.neu.arr ? '. At an insulating edge the potential is not fixed: $∂V/∂n = 0$ is imposed with a mirror node, $V_{i,−1} = V_{i,1}$' : ''}.` });
    const cuadrada = Math.abs(hx - hy) < 1e-9 * hx;
    ps.push({ t: 'Difference equation', html: cuadrada ? `With $h_x = h_y$, the second derivative is approximated by $ {∂²V}/{∂x²} ≈ {V_{i+1,j} − 2V_{i,j} + V_{i−1,j}}/{h^2}$ and the same in $y$, so $∇² V = 0$ becomes $V_{i,j} = {V_{i+1,j} + V_{i−1,j} + V_{i,j+1} + V_{i,j−1}}/4$: each node equals the mean of its four neighbours.` : `With $ {∂²V}/{∂x²} ≈ {V_{i+1,j} − 2V_{i,j} + V_{i−1,j}}/{h_x^2}$ and the same in $y$, $∇² V = 0$ gives $V_{i,j} = {(V_{i+1,j} + V_{i−1,j})/h_x^2 + (V_{i,j+1} + V_{i,j−1})/h_y^2}/{2/h_x^2 + 2/h_y^2}$: each node equals the weighted mean of its neighbours.` });
    ps.push({ t: 'Relaxation', html: `We start from $V = 0$ at all free nodes and repeat the distribution with ${NOM_METODO[s.metodo]}${s.metodo === 'sor' ? ` ($ω = ${f(s.omega)}$)` : ''} until the estimated error of any node falls below $${f(s.tol)} "V"$: ${s.convergio ? `<b>${s.iter}</b> iterations` : `the limit of ${MAX_IT} iterations was reached without meeting the tolerance (last change per sweep $${f(s.cambio)} "V"$)`}.` });
    ps.push({ t: 'Potential at the probe', html: `Interpolating between the four nodes around $(${f(s.px)}, ${f(s.py)}) "m"$: $V = ${f(s.sonda.V)} "V"$, $E_x = −{∂V}/{∂x} = ${f(s.sonda.Ex)} "V/m"$, $E_y = −{∂V}/{∂y} = ${f(s.sonda.Ey)} "V/m"$ and $|E| = ${f(s.sonda.E)} "V/m"$.` });
    if (s.exacto !== null && s.exactoTipo === '1d') ps.push({ t: 'Comparison with the one-dimensional solution', html: `With the top and bottom insulating the potential depends only on $x$: $V(x) = V_1 + (V_2 − V_1) x/a${s.rho ? ' + {ρ x (a − x)}/{2 ε_0}' : ''}$. At the probe it gives $V = ${f(s.exacto)} "V"$, versus $${f(s.sonda.V)} "V"$ from the grid.` });
    else if (s.exacto !== null) ps.push({ t: 'Comparison with the exact solution', html: `Without an electrode, the exact solution is a Fourier series: each edge contributes $V_0 · ∑ {4}/{nπ} sin({nπx}/a) · {sinh({nπy}/a)}/{sinh({nπb}/a)}$ with $n$ odd (rotated for each edge). At the probe it gives $V = ${f(s.exacto)} "V"$, versus $${f(s.sonda.V)} "V"$ from the grid: a difference of $${f(Math.abs(s.sonda.V - s.exacto))} "V"$. A finer grid reduces it.` + (s.rho ? ' With uniform charge the Poisson solution with grounded edges is added, $V = ∑ {16 ρ}/{π^2 ε_0 m n [(mπ/a)^2 + (nπ/b)^2]} sin {mπx}/a sin {nπy}/b$.' : '') });
    const qs = s.conductores.map((c, i) => `${c.nombre} ($${f(c.v)} "V"$): $${f(s.q[i])} "C/m"$`).join('; ');
    ps.push({ t: 'Charge of each conductor and energy', html: `The charge per unit length of a conductor is the flux of $E$ leaving it, $Q' = ε_0 ∮ E_n dl$ (with the grid differences): ${qs}. Sum: $${f(s.qTotal)} "C/m"$` + (s.rho ? ` (the free charge in the box is $${f(s.qDiscreta)} "C/m"$ and the sum of all the charges is zero)` : ' (zero: the field lines leaving some conductors end on others)') + `. Energy: $W' = ½ ε_0 ∫ E^2 dA = ${f(s.W)} "J/m"$.` + (s.capacidad ? ` With only two potentials, $C' = Q'/ΔV = ${f(s.capacidad.Q)}/${f(s.capacidad.dV)} = ${f(s.capacidad.C)} "F/m"$ and, from the energy, $C' = 2W'/ΔV^2 = ${f(s.capacidad.Cw)} "F/m"$.` : ' With more than two potentials there is no single capacitance: the charges are given.') });
    return ps;
  }

  const ejemplos = [
    { clave: 'borde-caliente', nombre: 'One edge at 100 V and the rest grounded', sc: { a: '1', b: '1', n: '40', va: '100', vb: '0', vi: '0', vd: '0', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,75' } },
    { clave: 'placas', nombre: 'Opposite plates at +50 V and −50 V', sc: { a: '1', b: '1', n: '40', va: '50', vb: '-50', vi: '0', vd: '0', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,5' } },
    { clave: 'dos-lados', nombre: 'Two adjacent sides at 100 V', sc: { a: '1', b: '1', n: '40', va: '100', vb: '0', vi: '100', vd: '0', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,5' } },
    { clave: 'conductor', nombre: 'Central conductor at 100 V inside a grounded box', sc: { a: '1', b: '1', n: '40', va: '0', vb: '0', vi: '0', vd: '0', elec: '1', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '100', metodo: 'sor', tol: '1e-6', px: '0,25', py: '0,5' } },
    { clave: 'caja-ancha', nombre: 'Wide box with sides at +100 V and −100 V', sc: { a: '2', b: '1', n: '40', va: '0', vb: '0', vi: '100', vd: '-100', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '1', py: '0,5' } },
    { clave: 'placas-planas', nombre: 'Parallel-plate capacitor: left 100 V, right 0 V, top and bottom insulating (LA-2/LA-3)', sc: { a: '1', b: '0,5', n: '40', va: '', vb: '', vi: '100', vd: '0', ta: 'n', tb: 'n', ti: 'v', td: 'v', elec: '0', ex: '0,4', ey: '0,2', ew: '0,2', eh: '0,1', ev: '50', metodo: 'sor', tol: '1e-8', px: '0,25', py: '0,25' } },
    { clave: 'poisson-1d', nombre: '1D Poisson: two plates at 0 V with uniform charge between them (ρ = 10⁻⁸ C/m³, LA-1)', sc: { a: '1', b: '0,5', n: '40', va: '', vb: '', vi: '0', vd: '0', ta: 'n', tb: 'n', ti: 'v', td: 'v', rho: '1e-8', elec: '0', ex: '0,4', ey: '0,2', ew: '0,2', eh: '0,1', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,25' } },
    { clave: 'poisson-caja', nombre: 'Grounded box with uniform charge ρ = 10⁻⁸ C/m³ (LA-1)', sc: { a: '1', b: '1', n: '40', va: '0', vb: '0', vi: '0', vd: '0', rho: '1e-8', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,5' } },
    { clave: 'dos-electrodos', nombre: 'A rectangular electrode at +100 V and a circular one at −100 V (LA-2)', sc: { a: '2', b: '1', n: '48', va: '0', vb: '0', vi: '0', vd: '0', elec: '1', et: 'rect', ex: '0,3', ey: '0,3', ew: '0,4', eh: '0,4', ev: '100', e2: '1', e2t: 'circ', e2x: '1,5', e2y: '0,5', e2w: '0,25', e2h: '', e2v: '-100', metodo: 'sor', tol: '1e-6', px: '1', py: '0,5' } },
    { clave: 'cilindro', nombre: 'Circular electrode of 0.2 m at 100 V inside a grounded box (capacitance, LA-3)', sc: { a: '1', b: '1', n: '60', va: '0', vb: '0', vi: '0', vd: '0', elec: '1', et: 'circ', ex: '0,5', ey: '0,5', ew: '0,2', eh: '', ev: '100', metodo: 'sor', tol: '1e-8', px: '0,25', py: '0,5' } },
  ];

  return { resolver, comparar, valorEn, serie, seriePoisson, exactoEn, ejemplos, f, NOM_METODO, MAX_IT, EPS0 };
})();

