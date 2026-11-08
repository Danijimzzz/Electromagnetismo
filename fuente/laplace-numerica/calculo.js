/* =====================================================================
   LaplaceNumerica: cálculo de la ecuación de Laplace ∇²V = 0 en una caja
   rectangular (sin DOM). Los cuatro bordes tienen un potencial fijo y,
   si se quiere, un electrodo rectangular interior también. Se resuelve
   por relajación con diferencias finitas: cada nodo pasa a valer la
   media ponderada de sus cuatro vecinos (Jacobi, Gauss-Seidel o SOR)
   hasta que el error estimado (el cambio por vuelta, corregido con la razón de convergencia del método) es menor que la tolerancia. Con la caja
   sin electrodo se compara con la solución exacta en serie de Fourier.
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

  const MAX_IT = 60000;
  const NOM_METODO = { jacobi: 'Jacobi', gs: 'Gauss-Seidel', sor: 'SOR (sobrerrelajación)' };

  /* ---------- Relajación ---------- */
  // V[j * (nx + 1) + i], con i hacia la derecha (x) y j hacia arriba (y); fijo[k] = 1 si el nodo no cambia
  function relaja(nx, ny, hx, hy, V, fijo, metodo, tol) {
    const W = nx + 1, ax = 1 / (hx * hx), ay = 1 / (hy * hy), d = 2 * (ax + ay);
    const rho = (hy * hy * Math.cos(Math.PI / nx) + hx * hx * Math.cos(Math.PI / ny)) / (hx * hx + hy * hy);
    const om = metodo === 'sor' ? 2 / (1 + Math.sqrt(1 - rho * rho)) : 1;
    // el cambio por vuelta se pasa a error estimado con la razón de convergencia de cada método
    const r = metodo === 'jacobi' ? rho : metodo === 'gs' ? rho * rho : om - 1, factor = r / (1 - r);
    let nuevo = metodo === 'jacobi' ? V.slice() : null, iter = 0, dif = Infinity;
    while (iter < MAX_IT && dif * factor > tol) {
      dif = 0;
      for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) {
        const k = j * W + i;
        if (fijo[k]) { if (nuevo) nuevo[k] = V[k]; continue; }
        const m = (ax * (V[k - 1] + V[k + 1]) + ay * (V[k - W] + V[k + W])) / d;
        const v = metodo === 'jacobi' ? m : V[k] + om * (m - V[k]);
        const c = Math.abs(v - V[k]); if (c > dif) dif = c;
        if (nuevo) nuevo[k] = v; else V[k] = v;
      }
      if (nuevo) { for (let k = 0; k < V.length; k++) V[k] = nuevo[k]; }
      iter++;
    }
    return { iter, dif, om, convergio: dif * factor <= tol };
  }

  // Máximo de |∇²V| discreto en los nodos libres, como medida de lo bien que cumple la ecuación
  function residuo(nx, ny, hx, hy, V, fijo) {
    const W = nx + 1, ax = 1 / (hx * hx), ay = 1 / (hy * hy); let r = 0;
    for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) {
      const k = j * W + i; if (fijo[k]) continue;
      r = Math.max(r, Math.abs(ax * (V[k - 1] - 2 * V[k] + V[k + 1]) + ay * (V[k - W] - 2 * V[k] + V[k + W])));
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
  function resolver(sc) {
    const a = lee(sc, 'a', 'el ancho de la caja'), b = lee(sc, 'b', 'el alto de la caja');
    const nx = Math.round(lee(sc, 'n', 'el número de celdas del ancho'));
    if (nx < 8 || nx > 80) throw new Error('Las celdas del ancho van de 8 a 80');
    const ny = Math.max(4, Math.min(120, Math.round(nx * b / a)));
    if (b / a > 3 || a / b > 3) throw new Error('El ancho y el alto no pueden diferir más de 3 veces');
    const hx = a / nx, hy = b / ny, W = nx + 1;
    const bordes = {
      arriba: lee(sc, 'va', 'el potencial del borde de arriba', 'cualquiera'), abajo: lee(sc, 'vb', 'el potencial del borde de abajo', 'cualquiera'),
      izq: lee(sc, 'vi', 'el potencial del borde izquierdo', 'cualquiera'), der: lee(sc, 'vd', 'el potencial del borde derecho', 'cualquiera'),
    };
    const tol = lee(sc, 'tol', 'la tolerancia');
    const metodo = NOM_METODO[sc.metodo] ? sc.metodo : 'sor';
    const px = lee(sc, 'px', 'la x de la sonda', 'cero'), py = lee(sc, 'py', 'la y de la sonda', 'cero');
    if (px > a || py > b) throw new Error('La sonda debe estar dentro de la caja');

    const V = new Float64Array(W * (ny + 1)), fijo = new Uint8Array(W * (ny + 1));
    for (let i = 0; i <= nx; i++) { V[i] = bordes.abajo; V[ny * W + i] = bordes.arriba; }
    for (let j = 0; j <= ny; j++) { V[j * W] = bordes.izq; V[j * W + nx] = bordes.der; }
    // esquinas: media de los dos bordes que se juntan
    V[0] = (bordes.abajo + bordes.izq) / 2; V[nx] = (bordes.abajo + bordes.der) / 2;
    V[ny * W] = (bordes.arriba + bordes.izq) / 2; V[ny * W + nx] = (bordes.arriba + bordes.der) / 2;
    for (let i = 0; i <= nx; i++) fijo[i] = fijo[ny * W + i] = 1;
    for (let j = 0; j <= ny; j++) fijo[j * W] = fijo[j * W + nx] = 1;

    // electrodo interior opcional
    let electrodo = null, nElec = 0;
    if (sc.elec === '1') {
      const ex = lee(sc, 'ex', 'la x del electrodo', 'cero'), ey = lee(sc, 'ey', 'la y del electrodo', 'cero');
      const ew = lee(sc, 'ew', 'el ancho del electrodo'), eh = lee(sc, 'eh', 'el alto del electrodo'), ev = lee(sc, 'ev', 'el potencial del electrodo', 'cualquiera');
      if (ex + ew > a * (1 + 1e-9) || ey + eh > b * (1 + 1e-9)) throw new Error('El electrodo debe caber dentro de la caja');
      const i0 = Math.round(ex / hx), i1 = Math.round((ex + ew) / hx), j0 = Math.round(ey / hy), j1 = Math.round((ey + eh) / hy);
      if (i0 < 1 || j0 < 1 || i1 > nx - 1 || j1 > ny - 1) throw new Error('El electrodo debe quedar separado de los bordes al menos una celda');
      if (i1 - i0 < 1 || j1 - j0 < 1) throw new Error('El electrodo es más pequeño que una celda: agranda sus medidas o usa más celdas');
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { V[j * W + i] = ev; fijo[j * W + i] = 1; nElec++; }
      electrodo = { x: ex, y: ey, w: ew, h: eh, v: ev, i0, i1, j0, j1 };
    }

    // punto de partida: 0 V en todos los nodos libres (los nodos de V ya están a 0)
    const r = relaja(nx, ny, hx, hy, V, fijo, metodo, tol);
    const res = residuo(nx, ny, hx, hy, V, fijo);
    let vmin = Infinity, vmax = -Infinity;
    for (const v of V) { if (v < vmin) vmin = v; if (v > vmax) vmax = v; }
    const sol = { a, b, nx, ny, hx, hy, V, fijo, bordes, electrodo, metodo, tol, iter: r.iter, omega: r.om, convergio: r.convergio, cambio: r.dif, residuo: res, vmin, vmax, px, py, nElec };
    sol.sonda = valorEn(sol, px, py);
    sol.centro = valorEn(sol, a / 2, b / 2);
    sol.exacto = electrodo ? null : serie(sol, px, py);
    sol.pasos = pasos(sol);
    return sol;
  }

  function pasos(s) {
    const { a, b, nx, ny, hx, hy, bordes: bd } = s, ps = [];
    ps.push({ t: 'Ecuación y condiciones de contorno', html: `Se busca $V(x, y)$ con $∇² V = {∂²V}/{∂x²} + {∂²V}/{∂y²} = 0$ dentro de una caja de $${f(a)} "m" × ${f(b)} "m"$, con $V = ${f(bd.arriba)} "V"$ arriba, $V = ${f(bd.abajo)} "V"$ abajo, $V = ${f(bd.izq)} "V"$ a la izquierda y $V = ${f(bd.der)} "V"$ a la derecha${s.electrodo ? `, y un electrodo de $${f(s.electrodo.w)} "m" × ${f(s.electrodo.h)} "m"$ a $V = ${f(s.electrodo.v)} "V"$ con su esquina inferior en $(${f(s.electrodo.x)}, ${f(s.electrodo.y)}) "m"$` : ''}.` });
    ps.push({ t: 'Malla', html: `Se divide el ancho en $${nx}$ celdas y el alto en $${ny}$: $h_x = ${f(hx)} "m"$ y $h_y = ${f(hy)} "m"$ (${(nx + 1) * (ny + 1)} nodos${s.nElec ? `, ${s.nElec} de ellos del electrodo` : ''}). En las esquinas se toma la media de los dos bordes que se juntan.` });
    const cuadrada = Math.abs(hx - hy) < 1e-9 * hx;
    ps.push({ t: 'Ecuación en diferencias', html: cuadrada ? `Con $h_x = h_y$, la derivada segunda se aproxima por $ {∂²V}/{∂x²} ≈ {V_{i+1,j} − 2V_{i,j} + V_{i−1,j}}/{h^2}$ y lo mismo en $y$, así que $∇² V = 0$ queda $V_{i,j} = {V_{i+1,j} + V_{i−1,j} + V_{i,j+1} + V_{i,j−1}}/4$: cada nodo vale la media de sus cuatro vecinos.` : `Con $ {∂²V}/{∂x²} ≈ {V_{i+1,j} − 2V_{i,j} + V_{i−1,j}}/{h_x^2}$ y lo mismo en $y$, $∇² V = 0$ da $V_{i,j} = {(V_{i+1,j} + V_{i−1,j})/h_x^2 + (V_{i,j+1} + V_{i,j−1})/h_y^2}/{2/h_x^2 + 2/h_y^2}$: cada nodo vale la media ponderada de sus vecinos.` });
    ps.push({ t: 'Relajación', html: `Se parte de $V = 0$ en todos los nodos libres y se repite el reparto con ${NOM_METODO[s.metodo]}${s.metodo === 'sor' ? ` ($ω = ${f(s.omega)}$)` : ''} hasta que el error estimado de cualquier nodo baja de $${f(s.tol)} "V"$: ${s.convergio ? `<b>${s.iter}</b> iteraciones` : `se llegó al límite de ${MAX_IT} iteraciones sin alcanzar la tolerancia (último cambio por vuelta $${f(s.cambio)} "V"$)`}.` });
    ps.push({ t: 'Potencial en la sonda', html: `Interpolando entre los cuatro nodos que rodean a $(${f(s.px)}, ${f(s.py)}) "m"$: $V = ${f(s.sonda.V)} "V"$, $E_x = −{∂V}/{∂x} = ${f(s.sonda.Ex)} "V/m"$, $E_y = −{∂V}/{∂y} = ${f(s.sonda.Ey)} "V/m"$ y $|E| = ${f(s.sonda.E)} "V/m"$.` });
    if (s.exacto !== null) ps.push({ t: 'Comparación con la solución exacta', html: `Sin electrodo, la solución exacta es una serie de Fourier: cada borde aporta $V_0 · ∑ {4}/{nπ} sen({nπx}/a) · {senh({nπy}/a)}/{senh({nπb}/a)}$ con $n$ impar (girada para cada borde). En la sonda da $V = ${f(s.exacto)} "V"$, frente a $${f(s.sonda.V)} "V"$ de la malla: diferencia de $${f(Math.abs(s.sonda.V - s.exacto))} "V"$. Una malla más fina la reduce.` });
    return ps;
  }

  const ejemplos = [
    { clave: 'borde-caliente', nombre: 'Un borde a 100 V y el resto a tierra', sc: { a: '1', b: '1', n: '40', va: '100', vb: '0', vi: '0', vd: '0', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,75' } },
    { clave: 'placas', nombre: 'Placas opuestas a +50 V y −50 V', sc: { a: '1', b: '1', n: '40', va: '50', vb: '-50', vi: '0', vd: '0', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,5' } },
    { clave: 'dos-lados', nombre: 'Dos lados contiguos a 100 V', sc: { a: '1', b: '1', n: '40', va: '100', vb: '0', vi: '100', vd: '0', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '0,5', py: '0,5' } },
    { clave: 'conductor', nombre: 'Conductor central a 100 V dentro de una caja a tierra', sc: { a: '1', b: '1', n: '40', va: '0', vb: '0', vi: '0', vd: '0', elec: '1', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '100', metodo: 'sor', tol: '1e-6', px: '0,25', py: '0,5' } },
    { clave: 'caja-ancha', nombre: 'Caja ancha con lados a +100 V y −100 V', sc: { a: '2', b: '1', n: '40', va: '0', vb: '0', vi: '100', vd: '-100', elec: '0', ex: '0,4', ey: '0,4', ew: '0,2', eh: '0,2', ev: '50', metodo: 'sor', tol: '1e-6', px: '1', py: '0,5' } },
  ];

  return { resolver, valorEn, serie, ejemplos, f, NOM_METODO, MAX_IT };
})();
if (typeof module !== 'undefined') module.exports = LaplaceNumerica;
