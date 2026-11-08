/* =====================================================================
   LaplaceNumerica: cálculo de la ecuación de Laplace ∇²V = 0 en una caja
   rectangular (sin DOM). Los cuatro bordes tienen un potencial fijo y,
   si se quiere, un electrodo rectangular interior también. Se resuelve
   por relajación con diferencias finitas: cada nodo pasa a valer la
   media ponderada de sus cuatro vecinos (Jacobi, Gauss-Seidel o SOR)
   hasta que el error estimado (el cambio por vuelta, corregido con la razón de convergencia del método) es menor que la tolerancia. Con la caja
   sin electrodo se compara con la solución exacta en serie de Fourier.
   Ampliado en la Fase 10: Poisson ∇²V = −ρ/ε₀ con ρ uniforme en toda la caja o en un rectángulo (LA-1);
   bordes aislantes (∂V/∂n = 0, por nodo espejo) y hasta tres electrodos rectangulares o circulares (LA-2);
   carga de cada conductor (flujo de Gauss discreto), capacidad por unidad de longitud y energía (LA-3);
   comparar(sc) con iteraciones, tiempo y error de Jacobi, Gauss-Seidel y SOR en varias mallas (LA-4).
   La interfaz está en app.js y la prueba en
   pruebas/herramientas/laplace-numerica.js.
     resolver(sc)  datos del formulario (texto) → { malla, V, iter, residuo,
                   sonda, exacto, pasos, … }; lanza un Error con un mensaje
                   para el usuario si falta o falla algo
     valorEn(sol, x, y)  V, Ex y Ey en un punto (interpolación bilinear)
     serie(sol, x, y)    solución exacta en serie (solo sin electrodo)
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     f(x)          número con coma decimal y ·10<sup>n</sup>
   ===================================================================== */
const LaplaceNumerica = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // acepta coma decimal, 3e8 y 3·10^8
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (t) => t[0].toUpperCase() + t.slice(1);
  // positivo: mayor que 0; cero: puede ser 0; cualquiera: también negativo
  function lee(sc, k, nom, tipo = 'positivo') {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (tipo === 'positivo' && v <= 0) throw new Error(`${may(nom)} debe ser mayor que 0`);
    if (tipo === 'cero' && v < 0) throw new Error(`${may(nom)} no puede ser negativo`);
    return v;
  }

  const MAX_IT = 60000, EPS0 = 8.8541878128e-12;
  const NOM_METODO = { jacobi: 'Jacobi', gs: 'Gauss-Seidel', sor: 'SOR (sobrerrelajación)' };

  /* ---------- Relajación ---------- */
  // V[j * (nx + 1) + i], con i hacia la derecha (x) y j hacia arriba (y); fijo[k] = 1 si el nodo no cambia.
  // S[k] = ρ/ε₀ (V/m²) o null; neu = { izq, der, aba, arr }: en un borde aislante el nodo vecino que falta es el espejo.
  function relaja(nx, ny, hx, hy, V, fijo, metodo, tol, S = null, neu = {}) {
    const W = nx + 1, ax = 1 / (hx * hx), ay = 1 / (hy * hy), d = 2 * (ax + ay);
    const ex = neu.izq || neu.der ? 2 : 1, ey = neu.aba || neu.arr ? 2 : 1; // un borde aislante equivale a una caja más larga
    const rho = (hy * hy * Math.cos(Math.PI / (nx * ex)) + hx * hx * Math.cos(Math.PI / (ny * ey))) / (hx * hx + hy * hy);
    const om = metodo === 'sor' ? 2 / (1 + Math.sqrt(1 - rho * rho)) : 1;
    // el cambio por vuelta se pasa a error estimado con la razón de convergencia de cada método
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

  // Máximo de |∇²V + ρ/ε₀| discreto en los nodos libres interiores, como medida de lo bien que cumple la ecuación
  function residuo(nx, ny, hx, hy, V, fijo, S = null) {
    const W = nx + 1, ax = 1 / (hx * hx), ay = 1 / (hy * hy); let r = 0;
    for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) {
      const k = j * W + i; if (fijo[k]) continue;
      r = Math.max(r, Math.abs(ax * (V[k - 1] - 2 * V[k] + V[k + 1]) + ay * (V[k - W] - 2 * V[k] + V[k + W]) + (S ? S[k] : 0)));
    }
    return r;
  }

  /* ---------- Solución exacta en serie (caja sin electrodo) ---------- */
  // sinh(p·u)/sinh(p·c) sin desbordar
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

  // Poisson con ρ uniforme en toda la caja y bordes a tierra: V = ∑ 16 ρ/(π² ε₀ m n [(mπ/a)² + (nπ/b)²]) sen(mπx/a) sen(nπy/b), m y n impares
  function seriePoisson(sol, x, y) {
    const { a, b, rho } = sol; let t = 0;
    for (let m = 1; m <= 199; m += 2) for (let n = 1; n <= 199; n += 2) t += (16 * rho) / (Math.PI ** 2 * EPS0 * m * n * ((m * Math.PI / a) ** 2 + (n * Math.PI / b) ** 2)) * Math.sin(m * Math.PI * x / a) * Math.sin(n * Math.PI * y / b);
    return t;
  }
  // solución exacta cuando se conoce: serie de Fourier (borde fijo en los cuatro lados, sin electrodo; con ρ uniforme en toda la caja se suma Poisson)
  // o la solución unidimensional V(x) (arriba y abajo aislantes, izquierda y derecha fijos, ρ uniforme): V1 + (V2 − V1)x/a + ρ x(a − x)/(2ε₀)
  function exactoEn(sol, x, y) {
    if (sol.electrodos.length) return null;
    const { neu, rho, rhoRegion } = sol, n4 = neu.izq + neu.der + neu.aba + neu.arr;
    if (rho && rhoRegion) return null;
    if (n4 === 0) return serie(sol, x, y) + (rho ? seriePoisson(sol, x, y) : 0);
    if (neu.aba && neu.arr && !neu.izq && !neu.der) return sol.bordes.izq + ((sol.bordes.der - sol.bordes.izq) * x) / sol.a + (rho * x * (sol.a - x)) / (2 * EPS0);
    return null;
  }

  /* ---------- Valor en un punto ---------- */
  function valorEn(sol, x, y) {
    const { nx, ny, hx, hy, V } = sol, W = nx + 1;
    const u = Math.min(Math.max(x / hx, 0), nx), w = Math.min(Math.max(y / hy, 0), ny);
    const i = Math.min(Math.floor(u), nx - 1), j = Math.min(Math.floor(w), ny - 1), s = u - i, t = w - j;
    const v00 = V[j * W + i], v10 = V[j * W + i + 1], v01 = V[(j + 1) * W + i], v11 = V[(j + 1) * W + i + 1];
    const v = v00 * (1 - s) * (1 - t) + v10 * s * (1 - t) + v01 * (1 - s) * t + v11 * s * t;
    const ex = -((v10 - v00) * (1 - t) + (v11 - v01) * t) / hx, ey = -((v01 - v00) * (1 - s) + (v11 - v10) * s) / hy;
    return { V: v, Ex: ex, Ey: ey, E: Math.hypot(ex, ey) };
  }

  /* ---------- Resolver ---------- */
  const TIPO_BORDE = { v: 'fijo', n: 'aislante' };
  // electrodos del formulario: el 1 (elec, et, ex, ey, ew, eh, ev) y los extras 2 y 3 (e2, e2t, e2x, …); circular: (x, y) centro y w radio
  function leeElectrodos(sc, nx, ny, hx, hy, a, b, neu, V, fijo) {
    const W = nx + 1, out = [];
    const defs = [['elec', 'et', 'ex', 'ey', 'ew', 'eh', 'ev', 1], ['e2', 'e2t', 'e2x', 'e2y', 'e2w', 'e2h', 'e2v', 2], ['e3', 'e3t', 'e3x', 'e3y', 'e3w', 'e3h', 'e3v', 3]];
    for (const [on, tt, kx, ky, kw, kh, kv, num] of defs) {
      if (sc[on] !== '1') continue;
      const circ = sc[tt] === 'circ', nom = `del electrodo ${num}`, ex = lee(sc, kx, `la x ${nom}`, circ ? 'cualquiera' : 'cero'), ey = lee(sc, ky, `la y ${nom}`, circ ? 'cualquiera' : 'cero'), ew = lee(sc, kw, circ ? `el radio ${nom}` : `el ancho ${nom}`), ev = lee(sc, kv, `el potencial ${nom}`, 'cualquiera');
      const eh = circ ? ew : lee(sc, kh, `el alto ${nom}`), minX = neu.izq ? 0 : 1, maxX = neu.der ? nx : nx - 1, minY = neu.aba ? 0 : 1, maxY = neu.arr ? ny : ny - 1;
      const nodos = []; let lim;
      if (circ) {
        for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) if ((i * hx - ex) ** 2 + (j * hy - ey) ** 2 <= ew * ew * (1 + 1e-9)) nodos.push([i, j]);
        if (nodos.length < 4) throw new Error(`El electrodo ${num} (circular) es demasiado pequeño para la malla: agranda su radio o usa más celdas`);
        lim = { i0: Math.min(...nodos.map((q) => q[0])), i1: Math.max(...nodos.map((q) => q[0])), j0: Math.min(...nodos.map((q) => q[1])), j1: Math.max(...nodos.map((q) => q[1])) };
      } else {
        if (ex + ew > a * (1 + 1e-9) || ey + eh > b * (1 + 1e-9)) throw new Error(`El electrodo ${num} debe caber dentro de la caja`);
        lim = { i0: Math.round(ex / hx), i1: Math.round((ex + ew) / hx), j0: Math.round(ey / hy), j1: Math.round((ey + eh) / hy) };
        if (lim.i1 - lim.i0 < 1 || lim.j1 - lim.j0 < 1) throw new Error(`El electrodo ${num} es más pequeño que una celda: agranda sus medidas o usa más celdas`);
        for (let j = lim.j0; j <= lim.j1; j++) for (let i = lim.i0; i <= lim.i1; i++) nodos.push([i, j]);
      }
      if (lim.i0 < minX || lim.j0 < minY || lim.i1 > maxX || lim.j1 > maxY) throw new Error(`El electrodo ${num} debe quedar separado de los bordes fijos al menos una celda`);
      if (circ && (ex - ew < -1e-9 || ey - ew < -1e-9 || ex + ew > a * (1 + 1e-9) || ey + ew > b * (1 + 1e-9)) && false) throw new Error('x');
      for (const [i, j] of nodos) { const k = j * W + i; if (fijo[k] && !(out.length === 0 && false)) throw new Error(`El electrodo ${num} se solapa con otro electrodo o toca un borde fijo`); V[k] = ev; fijo[k] = 1; }
      out.push({ num, tipo: circ ? 'circ' : 'rect', x: ex, y: ey, w: ew, h: eh, v: ev, ...lim, nodos, n: nodos.length });
    }
    return out;
  }

  // carga por unidad de longitud (C/m) de cada conductor por el flujo discreto de Gauss: Q = ε₀ ∑ (V_c − V_vecino)/h · (anchura de la cara)
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
  // energía por unidad de longitud W' = ½ ε₀ ∫ |E|² dA con las diferencias de los nodos (lo mismo que ½ ∑ Q V + ½ ∫ ρ V dA)
  function energia(sol) {
    const { nx, ny, hx, hy, V } = sol, W = nx + 1; let t = 0;
    for (let j = 0; j <= ny; j++) for (let i = 0; i < nx; i++) t += ((V[j * W + i + 1] - V[j * W + i]) / hx) ** 2 * hx * hy * (j === 0 || j === ny ? 0.5 : 1);
    for (let j = 0; j < ny; j++) for (let i = 0; i <= nx; i++) t += ((V[(j + 1) * W + i] - V[j * W + i]) / hy) ** 2 * hx * hy * (i === 0 || i === nx ? 0.5 : 1);
    return 0.5 * EPS0 * t;
  }

  function resolver(sc, opc = {}) {
    const a = lee(sc, 'a', 'el ancho de la caja'), b = lee(sc, 'b', 'el alto de la caja');
    const nx = Math.round(lee(sc, 'n', 'el número de celdas del ancho'));
    if (nx < 8 || nx > 80) throw new Error('Las celdas del ancho van de 8 a 80');
    const ny = Math.max(4, Math.min(120, Math.round(nx * b / a)));
    if (b / a > 3 || a / b > 3) throw new Error('El ancho y el alto no pueden diferir más de 3 veces');
    const hx = a / nx, hy = b / ny, W = nx + 1;
    const tb = (k) => ((sc[k] ?? 'v') === 'n' ? 1 : 0), neu = { arr: tb('ta'), aba: tb('tb'), izq: tb('ti'), der: tb('td') };
    const val = (k, nom, aisl) => (aisl ? 0 : lee(sc, k, nom, 'cualquiera'));
    const bordes = { arriba: val('va', 'el potencial del borde de arriba', neu.arr), abajo: val('vb', 'el potencial del borde de abajo', neu.aba), izq: val('vi', 'el potencial del borde izquierdo', neu.izq), der: val('vd', 'el potencial del borde derecho', neu.der) };
    const tol = lee(sc, 'tol', 'la tolerancia');
    const metodo = NOM_METODO[opc.metodo || sc.metodo] ? (opc.metodo || sc.metodo) : 'sor';
    const px = lee(sc, 'px', 'la x de la sonda', 'cero'), py = lee(sc, 'py', 'la y de la sonda', 'cero');
    if (px > a || py > b) throw new Error('La sonda debe estar dentro de la caja');

    const V = new Float64Array(W * (ny + 1)), fijo = new Uint8Array(W * (ny + 1)), id = new Int8Array(W * (ny + 1)).fill(-1);
    // conductores: los bordes fijos (0 arriba, 1 abajo, 2 izquierda, 3 derecha) y los electrodos (4, 5, 6)
    const conductores = [], idBorde = { arr: -1, aba: -1, izq: -1, der: -1 };
    for (const [clave, nom, v] of [['arr', 'Borde de arriba', bordes.arriba], ['aba', 'Borde de abajo', bordes.abajo], ['izq', 'Borde izquierdo', bordes.izq], ['der', 'Borde derecho', bordes.der]]) if (!neu[clave]) { idBorde[clave] = conductores.length; conductores.push({ nombre: nom, v }); }
    const marca = (i, j, v, c) => { const k = j * W + i; V[k] = v; fijo[k] = 1; if (c >= 0) id[k] = c; };
    for (let i = 0; i <= nx; i++) { if (!neu.aba) marca(i, 0, bordes.abajo, i > 0 && i < nx ? idBorde.aba : -1); if (!neu.arr) marca(i, ny, bordes.arriba, i > 0 && i < nx ? idBorde.arr : -1); }
    for (let j = 0; j <= ny; j++) { if (!neu.izq) marca(0, j, bordes.izq, j > 0 && j < ny ? idBorde.izq : -1); if (!neu.der) marca(nx, j, bordes.der, j > 0 && j < ny ? idBorde.der : -1); }
    // con un borde vecino aislante, la esquina del borde fijo también es parte del conductor (si no, faltaría su media celda de flujo)
    for (const [i, j, h, v] of [[0, 0, 'aba', 'izq'], [nx, 0, 'aba', 'der'], [0, ny, 'arr', 'izq'], [nx, ny, 'arr', 'der']]) {
      if (neu[h] && !neu[v]) id[j * W + i] = idBorde[v]; else if (neu[v] && !neu[h]) id[j * W + i] = idBorde[h];
    }
    // esquinas: media de los dos bordes fijos que se juntan (si uno es aislante, el valor del otro)
    const esq = (i, j, h, v) => { const A = h.filter((x) => x !== null); if (A.length) { const m = A.reduce((s2, x) => s2 + x, 0) / A.length; V[j * W + i] = m; fijo[j * W + i] = 1; } };
    esq(0, 0, [neu.aba ? null : bordes.abajo, neu.izq ? null : bordes.izq]); esq(nx, 0, [neu.aba ? null : bordes.abajo, neu.der ? null : bordes.der]);
    esq(0, ny, [neu.arr ? null : bordes.arriba, neu.izq ? null : bordes.izq]); esq(nx, ny, [neu.arr ? null : bordes.arriba, neu.der ? null : bordes.der]);

    // electrodos interiores (rectangulares o circulares)
    const electrodos = leeElectrodos(sc, nx, ny, hx, hy, a, b, neu, V, fijo);
    for (const e of electrodos) { const c = conductores.length; conductores.push({ nombre: `Electrodo ${e.num}`, v: e.v }); for (const [i, j] of e.nodos) id[j * W + i] = c; }
    const nElec = electrodos.reduce((s2, e) => s2 + e.n, 0);
    if (!fijo.some((x) => x)) throw new Error('Hace falta al menos un borde con potencial fijo o un electrodo');

    // carga: ρ uniforme en toda la caja o en un rectángulo (LA-1)
    const rho = vacio(sc.rho) ? 0 : lee(sc, 'rho', 'la densidad de carga ρ', 'cualquiera');
    let S = null, rhoRegion = null, qLibre = 0, qDiscreta = 0;
    if (rho) {
      S = new Float64Array(W * (ny + 1));
      const reg = !vacio(sc.rw) || !vacio(sc.rh) || !vacio(sc.rx) || !vacio(sc.ry);
      let x0 = 0, y0 = 0, x1 = a, y1 = b;
      if (reg) {
        const rx = lee(sc, 'rx', 'la x de la región con carga', 'cero'), ry = lee(sc, 'ry', 'la y de la región con carga', 'cero'), rw = lee(sc, 'rw', 'el ancho de la región con carga'), rh = lee(sc, 'rh', 'el alto de la región con carga');
        if (rx + rw > a * (1 + 1e-9) || ry + rh > b * (1 + 1e-9)) throw new Error('La región con carga debe caber dentro de la caja');
        x0 = rx; y0 = ry; x1 = rx + rw; y1 = ry + rh; rhoRegion = { x: rx, y: ry, w: rw, h: rh };
      }
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const x = i * hx, y = j * hy;
        if (x >= x0 - 1e-9 * a && x <= x1 + 1e-9 * a && y >= y0 - 1e-9 * b && y <= y1 + 1e-9 * b) { const k = j * W + i; S[k] = rho / EPS0; if (!fijo[k]) qDiscreta += rho * hx * hy * (j === 0 || j === ny ? 0.5 : 1) * (i === 0 || i === nx ? 0.5 : 1); }
      }
      qLibre = rho * (x1 - x0) * (y1 - y0);
    }

    // punto de partida: 0 V en todos los nodos libres (los nodos de V ya están a 0)
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
    // LA-3: cargas, energía y capacidad
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

  // LA-4: Jacobi, Gauss-Seidel y SOR en varias mallas (n/2, n y 2n, entre 8 y 80 celdas): iteraciones, tiempo y error
  function comparar(sc, mallas = null) {
    const n0 = Math.round(lee(sc, 'n', 'el número de celdas del ancho')), tam = mallas || [...new Set([Math.max(8, Math.round(n0 / 2)), n0, Math.min(80, n0 * 2)])].filter((n) => n >= 8 && n <= 80), filas = [];
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
    ps.push({ t: 'Ecuación y condiciones de contorno', html: `Se busca $V(x, y)$ con $∇² V = {∂²V}/{∂x²} + {∂²V}/{∂y²} = 0$ dentro de una caja de $${f(a)} "m" × ${f(b)} "m"$, con ${[['arriba', 'arr', bd.arriba], ['abajo', 'aba', bd.abajo], ['a la izquierda', 'izq', bd.izq], ['a la derecha', 'der', bd.der]].map(([n, k, v]) => (s.neu[k] ? `borde ${n} aislante ($∂V/∂n = 0$)` : `$V = ${f(v)} "V"$ ${n}`)).join(', ')}${s.electrodos.map((e) => `, y un electrodo ${e.tipo === 'circ' ? `circular de radio $${f(e.w)} "m"$ centrado en $(${f(e.x)}, ${f(e.y)}) "m"$` : `de $${f(e.w)} "m" × ${f(e.h)} "m"$ con su esquina inferior en $(${f(e.x)}, ${f(e.y)}) "m"$`} a $V = ${f(e.v)} "V"$`).join('')}.` });
    if (s.rho) ps.push({ t: 'Ecuación de Poisson', html: `Dentro hay carga: $∇² V = −ρ/ε_0$ con $ρ = ${f(s.rho)} "C/m"^3$${s.rhoRegion ? ` en el rectángulo de $${f(s.rhoRegion.w)} "m" × ${f(s.rhoRegion.h)} "m"$ con esquina en $(${f(s.rhoRegion.x)}, ${f(s.rhoRegion.y)}) "m"$` : ' en toda la caja'}. En la malla cada nodo libre queda $V_{i,j} = {(V_{i+1,j} + V_{i−1,j})/h_x^2 + (V_{i,j+1} + V_{i,j−1})/h_y^2 + ρ/ε_0}/{2/h_x^2 + 2/h_y^2}$: la media de los vecinos más un término de carga.` });
    ps.push({ t: 'Malla', html: `Se divide el ancho en $${nx}$ celdas y el alto en $${ny}$: $h_x = ${f(hx)} "m"$ y $h_y = ${f(hy)} "m"$ (${(nx + 1) * (ny + 1)} nodos${s.nElec ? `, ${s.nElec} de ellos de los electrodos` : ''}). En las esquinas se toma la media de los dos bordes que se juntan${s.neu.izq || s.neu.der || s.neu.aba || s.neu.arr ? '. En un borde aislante no se fija el potencial: se impone $∂V/∂n = 0$ con un nodo espejo, $V_{i,−1} = V_{i,1}$' : ''}.` });
    const cuadrada = Math.abs(hx - hy) < 1e-9 * hx;
    ps.push({ t: 'Ecuación en diferencias', html: cuadrada ? `Con $h_x = h_y$, la derivada segunda se aproxima por $ {∂²V}/{∂x²} ≈ {V_{i+1,j} − 2V_{i,j} + V_{i−1,j}}/{h^2}$ y lo mismo en $y$, así que $∇² V = 0$ queda $V_{i,j} = {V_{i+1,j} + V_{i−1,j} + V_{i,j+1} + V_{i,j−1}}/4$: cada nodo vale la media de sus cuatro vecinos.` : `Con $ {∂²V}/{∂x²} ≈ {V_{i+1,j} − 2V_{i,j} + V_{i−1,j}}/{h_x^2}$ y lo mismo en $y$, $∇² V = 0$ da $V_{i,j} = {(V_{i+1,j} + V_{i−1,j})/h_x^2 + (V_{i,j+1} + V_{i,j−1})/h_y^2}/{2/h_x^2 + 2/h_y^2}$: cada nodo vale la media ponderada de sus vecinos.` });
    ps.push({ t: 'Relajación', html: `Se parte de $V = 0$ en todos los nodos libres y se repite el reparto con ${NOM_METODO[s.metodo]}${s.metodo === 'sor' ? ` ($ω = ${f(s.omega)}$)` : ''} hasta que el error estimado de cualquier nodo baja de $${f(s.tol)} "V"$: ${s.convergio ? `<b>${s.iter}</b> iteraciones` : `se llegó al límite de ${MAX_IT} iteraciones sin alcanzar la tolerancia (último cambio por vuelta $${f(s.cambio)} "V"$)`}.` });
    ps.push({ t: 'Potencial en la sonda', html: `Interpolando entre los cuatro nodos que rodean a $(${f(s.px)}, ${f(s.py)}) "m"$: $V = ${f(s.sonda.V)} "V"$, $E_x = −{∂V}/{∂x} = ${f(s.sonda.Ex)} "V/m"$, $E_y = −{∂V}/{∂y} = ${f(s.sonda.Ey)} "V/m"$ y $|E| = ${f(s.sonda.E)} "V/m"$.` });
    if (s.exacto !== null && s.exactoTipo === '1d') ps.push({ t: 'Comparación con la solución unidimensional', html: `Con arriba y abajo aislantes el potencial solo depende de $x$: $V(x) = V_1 + (V_2 − V_1) x/a${s.rho ? ' + {ρ x (a − x)}/{2 ε_0}' : ''}$. En la sonda da $V = ${f(s.exacto)} "V"$, frente a $${f(s.sonda.V)} "V"$ de la malla.` });
    else if (s.exacto !== null) ps.push({ t: 'Comparación con la solución exacta', html: `Sin electrodo, la solución exacta es una serie de Fourier: cada borde aporta $V_0 · ∑ {4}/{nπ} sen({nπx}/a) · {senh({nπy}/a)}/{senh({nπb}/a)}$ con $n$ impar (girada para cada borde). En la sonda da $V = ${f(s.exacto)} "V"$, frente a $${f(s.sonda.V)} "V"$ de la malla: diferencia de $${f(Math.abs(s.sonda.V - s.exacto))} "V"$. Una malla más fina la reduce.` + (s.rho ? ' Con carga uniforme se suma la solución de Poisson con bordes a tierra, $V = ∑ {16 ρ}/{π^2 ε_0 m n [(mπ/a)^2 + (nπ/b)^2]} sen {mπx}/a sen {nπy}/b$.' : '') });
    const qs = s.conductores.map((c, i) => `${c.nombre} ($${f(c.v)} "V"$): $${f(s.q[i])} "C/m"$`).join('; ');
    ps.push({ t: 'Carga de cada conductor y energía', html: `La carga por unidad de longitud de un conductor es el flujo de $E$ que sale de él, $Q' = ε_0 ∮ E_n dl$ (con las diferencias de la malla): ${qs}. Suma: $${f(s.qTotal)} "C/m"$` + (s.rho ? ` (la carga libre de la caja es $${f(s.qDiscreta)} "C/m"$ y la suma de todas las cargas es cero)` : ' (nula: las líneas de campo que salen de unos conductores acaban en otros)') + `. Energía: $W' = ½ ε_0 ∫ E^2 dA = ${f(s.W)} "J/m"$.` + (s.capacidad ? ` Con solo dos potenciales, $C' = Q'/ΔV = ${f(s.capacidad.Q)}/${f(s.capacidad.dV)} = ${f(s.capacidad.C)} "F/m"$ y, por la energía, $C' = 2W'/ΔV^2 = ${f(s.capacidad.Cw)} "F/m"$.` : ' Con más de dos potenciales no hay una única capacidad: se dan las cargas.') });
    return ps;
  }

  const ejemplos = [
    { clave: 'borde-caliente', nombre: 'Un borde a 100 V y el resto a tierra', sc: { a: '1', b: '1', n: '40', va: '100', vb: '0', vi: '0', vd: '0', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,75' } },
    { clave: 'placas', nombre: 'Placas opuestas a +50 V y −50 V', sc: { a: '1', b: '1', n: '40', va: '50', vb: '-50', vi: '0', vd: '0', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,5' } },
    { clave: 'dos-lados', nombre: 'Dos lados contiguos a 100 V', sc: { a: '1', b: '1', n: '40', va: '100', vb: '0', vi: '100', vd: '0', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,5' } },
    { clave: 'conductor', nombre: 'Conductor central a 100 V dentro de una caja a tierra', sc: { a: '1', b: '1', n: '40', va: '0', vb: '0', vi: '0', vd: '0', elec: '1', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '100', metodo: 'sor', tol: '1e-6', px: '0,25', py: '0,5' } },
    { clave: 'caja-ancha', nombre: 'Caja ancha con lados a +100 V y −100 V', sc: { a: '2', b: '1', n: '40', va: '0', vb: '0', vi: '100', vd: '-100', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '1', py: '0,5' } },
    { clave: 'placas-planas', nombre: 'Condensador de placas planas: izquierda 100 V, derecha 0 V, arriba y abajo aislantes (LA-2/LA-3)', sc: { a: '1', b: '0,5', n: '40', va: '', vb: '', vi: '100', vd: '0', ta: 'n', tb: 'n', ti: 'v', td: 'v', elec: '0', ex: '0,4', ey: '0,2', ew: '0,2', eh: '0,1', ev: '50', metodo: 'sor', tol: '1e-8', px: '0,25', py: '0,25' } },
    { clave: 'poisson-1d', nombre: 'Poisson 1D: dos placas a 0 V con carga uniforme entre ellas (ρ = 10⁻⁸ C/m³, LA-1)', sc: { a: '1', b: '0,5', n: '40', va: '', vb: '', vi: '0', vd: '0', ta: 'n', tb: 'n', ti: 'v', td: 'v', rho: '1e-8', elec: '0', ex: '0,4', ey: '0,2', ew: '0,2', eh: '0,1', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,25' } },
    { clave: 'poisson-caja', nombre: 'Caja a tierra con carga uniforme ρ = 10⁻⁸ C/m³ (LA-1)', sc: { a: '1', b: '1', n: '40', va: '0', vb: '0', vi: '0', vd: '0', rho: '1e-8', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,5' } },
    { clave: 'dos-electrodos', nombre: 'Un electrodo rectangular a +100 V y otro circular a −100 V (LA-2)', sc: { a: '2', b: '1', n: '48', va: '0', vb: '0', vi: '0', vd: '0', elec: '1', et: 'rect', ex: '0,3', ey: '0,3', ew: '0,4', eh: '0,4', ev: '100', e2: '1', e2t: 'circ', e2x: '1,5', e2y: '0,5', e2w: '0,25', e2h: '', e2v: '-100', metodo: 'sor', tol: '1e-6', px: '1', py: '0,5' } },
    { clave: 'cilindro', nombre: 'Electrodo circular de 0,2 m a 100 V dentro de una caja a tierra (capacidad, LA-3)', sc: { a: '1', b: '1', n: '60', va: '0', vb: '0', vi: '0', vd: '0', elec: '1', et: 'circ', ex: '0,5', ey: '0,5', ew: '0,2', eh: '', ev: '100', metodo: 'sor', tol: '1e-8', px: '0,25', py: '0,5' } },
  ];

  return { resolver, comparar, valorEn, serie, seriePoisson, exactoEn, ejemplos, f, NOM_METODO, MAX_IT, EPS0 };
})();
if (typeof module !== 'undefined') module.exports = LaplaceNumerica;
