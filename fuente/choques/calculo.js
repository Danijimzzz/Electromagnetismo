/* =====================================================================
   Choques y momento lineal: cálculo (sin DOM). Dos cuerpos que chocan en 1D
   o en 2D (esferas lisas): velocidades finales, momento lineal y energía.
     resolver(sc)  datos del formulario (texto) → { v1, v2, u1, u2, p0, p1, k0, k1, … , pasos }
                   lanza un Error con un mensaje para el usuario si falta o falla algo
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     f(x)          número con coma decimal y ·10<sup>n</sup>
   Modelo: la normal (línea de choque) forma el ángulo «th» con el eje x. Por la
   normal vale la restitución (u2n' − u1n' = e·(u1n − u2n)) y se conserva el
   momento; por la tangente no hay fuerza y cada velocidad se queda como estaba.
   Con th = 0 es el choque en una dimensión. «Pegados» (perfectamente inelástico):
   los dos cuerpos acaban con la misma velocidad V = (m₁v₁ + m₂v₂)/(m₁ + m₂).
   La interfaz está en app.js y la prueba en pruebas/herramientas/choques.js.
   ===================================================================== */
const Choques = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // acepta coma decimal, 3e8 y 3·10^8
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { pos = false, def } = {}) {
    if (vacio(sc[k])) { if (def !== undefined) return def; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} debe ser un número`);
    if (pos && v <= 0) throw new Error(`${Mayus(nom)} debe ser mayor que 0`);
    return v;
  }
  const mod = (x, y) => Math.hypot(x, y), ang = (x, y) => (mod(x, y) < 1e-12 ? 0 : (Math.atan2(y, x) * 180) / Math.PI);
  const vec = (x, y) => `(${f(x)}, ${f(y)})`;

  function resolver(sc) {
    const tipo = ['elastico', 'inelastico', 'pegados'].includes(sc.tipo) ? sc.tipo : 'elastico';
    const m1 = lee(sc, 'm1', 'la masa 1', { pos: true }), m2 = lee(sc, 'm2', 'la masa 2', { pos: true });
    const v1x = lee(sc, 'v1x', 'la velocidad 1', { def: 0 }), v1y = lee(sc, 'v1y', 'la velocidad 1 en y', { def: 0 });
    const v2x = lee(sc, 'v2x', 'la velocidad 2', { def: 0 }), v2y = lee(sc, 'v2y', 'la velocidad 2 en y', { def: 0 });
    const th = lee(sc, 'th', 'el ángulo de la normal', { def: 0 });
    const e = tipo === 'elastico' ? 1 : tipo === 'pegados' ? 0 : lee(sc, 'e', 'el coeficiente de restitución');
    if (e < 0 || e > 1) throw new Error('El coeficiente de restitución e debe estar entre 0 y 1');
    const M = m1 + m2, nx = Math.cos((th * Math.PI) / 180), ny = Math.sin((th * Math.PI) / 180), tx = -ny, ty = nx;
    const u1n = v1x * nx + v1y * ny, u2n = v2x * nx + v2y * ny, u1t = v1x * tx + v1y * ty, u2t = v2x * tx + v2y * ty;
    const dim2 = Math.abs(v1y) > 1e-12 || Math.abs(v2y) > 1e-12 || Math.abs(Math.sin((th * Math.PI) / 180)) > 1e-12;
    const pasos = [];
    pasos.push({ t: 'Datos', html: `$m_1 = ${f(m1)} "kg"$, $m_2 = ${f(m2)} "kg"$; $v⃗_1 = ${vec(v1x, v1y)} "m/s"$, $v⃗_2 = ${vec(v2x, v2y)} "m/s"$` });
    let w1x, w1y, w2x, w2y;
    if (tipo === 'pegados') {
      const Vx = (m1 * v1x + m2 * v2x) / M, Vy = (m1 * v1y + m2 * v2y) / M;
      w1x = w2x = Vx; w1y = w2y = Vy;
      pasos.push({ t: 'Conservación del momento lineal', html: `Quedan unidos, con una sola velocidad: $m_1 v⃗_1 + m_2 v⃗_2 = (m_1 + m_2) V⃗$` });
      pasos.push({ t: 'Velocidad común', html: `$V_x = (${f(m1)}·${f(v1x)} + ${f(m2)}·${f(v2x)})/${f(M)} = ${f(Vx)} "m/s"$` + (dim2 ? `, $V_y = (${f(m1)}·${f(v1y)} + ${f(m2)}·${f(v2y)})/${f(M)} = ${f(Vy)} "m/s"$` : '') });
    } else {
      if (u1n - u2n <= 1e-12) throw new Error('Los cuerpos no se acercan según la normal del choque: no hay choque (cambia las velocidades o el ángulo)');
      const pn = m1 * u1n + m2 * u2n, w1n = (pn - m2 * e * (u1n - u2n)) / M, w2n = (pn + m1 * e * (u1n - u2n)) / M;
      w1x = w1n * nx + u1t * tx; w1y = w1n * ny + u1t * ty; w2x = w2n * nx + u2t * tx; w2y = w2n * ny + u2t * ty;
      if (dim2) pasos.push({ t: 'Componentes según la normal y la tangente', html: `Normal $n = (cos ${f(th)}°, sin ${f(th)}°)$: $u_{1n} = ${f(u1n)}$, $u_{2n} = ${f(u2n)}$ "m/s"; tangente: $u_{1t} = ${f(u1t)}$, $u_{2t} = ${f(u2t)}$ "m/s" (no cambian)` });
      pasos.push({ t: 'Momento lineal y restitución', html: `$m_1 u_{1n} + m_2 u_{2n} = m_1 w_{1n} + m_2 w_{2n}$ y $w_{2n} − w_{1n} = e (u_{1n} − u_{2n})$ con $e = ${f(e)}$${tipo === 'elastico' ? ' (elástico)' : ''}` });
      pasos.push({ t: 'Velocidades finales según la normal', html: `$w_{1n} = (${f(pn)} − ${f(m2)}·${f(e)}·${f(u1n - u2n)})/${f(M)} = ${f(w1n)} "m/s"$, $w_{2n} = (${f(pn)} + ${f(m1)}·${f(e)}·${f(u1n - u2n)})/${f(M)} = ${f(w2n)} "m/s"$` });
    }
    const p0x = m1 * v1x + m2 * v2x, p0y = m1 * v1y + m2 * v2y, p1x = m1 * w1x + m2 * w2x, p1y = m1 * w1y + m2 * w2y;
    const k0 = 0.5 * m1 * (v1x * v1x + v1y * v1y) + 0.5 * m2 * (v2x * v2x + v2y * v2y), k1 = 0.5 * m1 * (w1x * w1x + w1y * w1y) + 0.5 * m2 * (w2x * w2x + w2y * w2y);
    pasos.push({ t: 'Velocidades finales', html: `$w⃗_1 = ${vec(w1x, w1y)} "m/s"$, $|w⃗_1| = ${f(mod(w1x, w1y))} "m/s"$; $w⃗_2 = ${vec(w2x, w2y)} "m/s"$, $|w⃗_2| = ${f(mod(w2x, w2y))} "m/s"$` });
    pasos.push({ t: 'Momento lineal total', html: `Antes $p⃗ = ${vec(p0x, p0y)} "kg·m/s"$; después $p⃗ = ${vec(p1x, p1y)} "kg·m/s"$ (se conserva)` });
    pasos.push({ t: 'Energía cinética', html: `Antes $K = ${f(k0)} "J"$; después $K = ${f(k1)} "J"$; se pierde $ΔK = ${f(k0 - k1)} "J"$ (${f(k0 > 0 ? ((k0 - k1) / k0) * 100 : 0)} %)` });
    return { tipo, dim2, m1, m2, v1: [v1x, v1y], v2: [v2x, v2y], w1: [w1x, w1y], w2: [w2x, w2y], th, e, p0: [p0x, p0y], p1: [p1x, p1y], k0, k1, perdida: k0 - k1, pasos };
  }

  const ejemplos = [
    { clave: 'elastico-1d', nombre: 'Elástico en 1D: 2 kg a 3 m/s contra 1 kg en reposo', sc: { tipo: 'elastico', m1: '2', v1x: '3', v1y: '0', m2: '1', v2x: '0', v2y: '0', th: '0', e: '1' } },
    { clave: 'coches', nombre: 'Coches que quedan pegados (1000 kg a 20 m/s y 1500 kg parado)', sc: { tipo: 'pegados', m1: '1000', v1x: '20', v1y: '0', m2: '1500', v2x: '0', v2y: '0', th: '0', e: '0' } },
    { clave: 'inelastico-1d', nombre: 'Inelástico en 1D con e = 0,5 y sentidos opuestos', sc: { tipo: 'inelastico', m1: '1', v1x: '4', v1y: '0', m2: '1', v2x: '-2', v2y: '0', th: '0', e: '0,5' } },
    { clave: 'billar', nombre: 'Billar: bola contra otra parada, normal a 30°', sc: { tipo: 'elastico', m1: '0,17', v1x: '2', v1y: '0', m2: '0,17', v2x: '0', v2y: '0', th: '30', e: '1' } },
  ];

  return { resolver, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Choques;
