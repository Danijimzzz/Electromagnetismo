/* =====================================================================
   Modelo de Solow (sin DOM): crecimiento con función de producción
   Cobb-Douglas y = A·kᵅ en magnitudes por trabajador efectivo. Saca el
   estado estacionario (k*, y*, c*, i*), la regla de oro (la tasa de ahorro
   que maximiza el consumo), la velocidad de convergencia con su semivida y
   la trayectoria año a año desde el capital inicial k₀. Formato de
   economia/comun.js; interfaz en solow/app.js.
     resolver(sc)  { alfa, s, n, g, d, A, k0, T, cambio, tc, nuevo } → { k, y, c, ..., fila, pasos }
   Perturbación (cambio = 's' | 'n' | 'g' | 'd' | 'A'): ese parámetro toma el valor
   «nuevo» desde el año tc (el capital no salta: k es continuo) y la trayectoria
   tiene dos fases, con el nuevo estado estacionario k2* y el consumo antes,
   justo en el cambio y a largo plazo.
   Ecuación de acumulación (discreta): k(t+1) = k(t) + s·A·k(t)ᵅ − (n + g + δ)·k(t)
   ===================================================================== */
const Solow = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const tp = (x) => `${f(100 * x, 5)} %`;

  function resolver(sc) {
    const alfa = lee(sc, 'alfa', 'la participación del capital α', { min: 0, minEx: true, max: 1, maxEx: true });
    const s = lee(sc, 's', 'la tasa de ahorro', { min: 0, minEx: true, max: 100, maxEx: true }) / 100;
    const n = lee(sc, 'n', 'el crecimiento de la población', { min: -50, max: 50 }) / 100;
    const g = lee(sc, 'g', 'el progreso tecnológico', { min: -50, max: 50 }) / 100;
    const d = lee(sc, 'd', 'la depreciación', { min: 0, minEx: true, max: 100 }) / 100;
    const A = lee(sc, 'A', 'la productividad A', { min: 0, minEx: true });
    const k0 = lee(sc, 'k0', 'el capital inicial k₀', { min: 0, minEx: true });
    const T = lee(sc, 'T', 'los años a simular', { min: 1, max: 500, entero: true });
    const x = n + g + d; // inversión de reposición por unidad de capital
    if (!(x > 0)) throw new Error('n + g + δ debe ser positivo: si no, el capital crece sin límite');
    // perturbación a mitad de camino
    const cambio = ['s', 'n', 'g', 'd', 'A'].includes(sc.cambio) ? sc.cambio : 'ninguno';
    let P2 = null, tc = null;
    if (cambio !== 'ninguno') {
      const lim = { s: ['el nuevo ahorro', { min: 0, minEx: true, max: 100, maxEx: true }], n: ['la nueva población n', { min: -50, max: 50 }], g: ['el nuevo progreso técnico g', { min: -50, max: 50 }], d: ['la nueva depreciación', { min: 0, minEx: true, max: 100 }], A: ['la nueva productividad A', { min: 0, minEx: true }] }[cambio];
      tc = lee(sc, 'tc', 'el año del cambio', { min: 1, max: T, entero: true });
      const nv = lee(sc, 'nuevo', ...lim) / (cambio === 'A' ? 1 : 100);
      P2 = { s, n, g, d, A, [cambio]: nv }; P2.x = P2.n + P2.g + P2.d;
      if (!(P2.x > 0)) throw new Error('Con ese cambio n + g + δ no sería positivo: el capital crecería sin límite');
    }
    const prod = (k) => A * k ** alfa;
    const ss = (sa) => (sa * A / x) ** (1 / (1 - alfa));
    const k = ss(s), y = prod(k), c = (1 - s) * y, inv = s * y;
    const ko = (alfa * A / x) ** (1 / (1 - alfa)), yo = prod(ko), co = yo - x * ko;
    const lambda = (1 - alfa) * x, semivida = Math.LN2 / lambda;
    // trayectoria
    const fila = []; let kt = k0;
    for (let t = 0; t <= T; t++) { const q = P2 && t >= tc ? P2 : { s, A, x }, yt = q.A * kt ** alfa; fila.push({ t, k: kt, y: yt, c: (1 - q.s) * yt, dk: q.s * yt - q.x * kt, nueva: !!(P2 && t >= tc) }); kt = kt + q.s * yt - q.x * kt; }
    // con perturbación, la meta de la trayectoria es el nuevo estado estacionario
    const k2 = P2 ? (P2.s * P2.A / P2.x) ** (1 / (1 - alfa)) : null, y2 = P2 ? P2.A * k2 ** alfa : null, c2 = P2 ? (1 - P2.s) * y2 : null;
    const kc = P2 ? fila[tc].k : null, cAntes = P2 ? (1 - s) * A * kc ** alfa : null, cAhora = P2 ? (1 - P2.s) * P2.A * kc ** alfa : null;
    const meta = P2 ? k2 : k;
    const kT = fila[T].k, cierre = (meta - k0) !== 0 ? (kT - k0) / (meta - k0) : 1;
    // años hasta cubrir la mitad de la distancia al estado estacionario (sin perturbación)
    let mitad = null; if (!P2) for (const r of fila) if ((k0 < k ? r.k >= (k0 + k) / 2 : r.k <= (k0 + k) / 2)) { mitad = r.t; break; }
    // con perturbación: años desde el cambio hasta cubrir la mitad de la distancia entre el capital de ese año y k2*
    let mitad2 = null; if (P2) for (const r of fila) if (r.t >= tc && (kc < k2 ? r.k >= (kc + k2) / 2 : r.k <= (kc + k2) / 2)) { mitad2 = r.t - tc; break; }
    const sobre = s > alfa;
    const pasos = [];
    pasos.push({ t: 'Ecuación de acumulación', html: `El capital por trabajador efectivo crece con lo que se invierte, $s·y$, y se reduce con la inversión de reposición, $(n + g + δ)·k$ (la depreciación más el reparto del capital entre más trabajadores y más productivos):<br>$Δk = s·A·k^α − (n + g + δ)·k$<br>Aquí $n + g + δ = ${f(100 * n, 4)} % + ${f(100 * g, 4)} % + ${f(100 * d, 4)} % = ${tp(x)}$.` });
    pasos.push({ t: 'Estado estacionario', html: `Es el capital con $Δk = 0$: $s·A·k^α = (n + g + δ)·k$. Despejando:<br>$k^* = ({s·A}/{n + g + δ})^{1/(1 − α)} = ({${f(s, 4)}·${f(A, 4)}}/{${f(x, 4)}})^{1/${f(1 - alfa, 4)}} = ${f(k, 6)}$<br>$y^* = A·(k^*)^α = ${f(y, 6)}$ · $c^* = (1 − s)·y^* = ${f(c, 6)}$ · $i^* = s·y^* = ${f(inv, 6)}$` });
    pasos.push({ t: 'Regla de oro', html: `El consumo por trabajador es $c = A·k^α − (n + g + δ)·k$ y es máximo cuando la productividad marginal del capital iguala a $n + g + δ$, que ocurre con $s_{oro} = α = ${f(alfa, 4)}$:<br>$k_{oro} = ({α·A}/{n + g + δ})^{1/(1 − α)} = ${f(ko, 6)}$ · $c_{oro} = ${f(co, 6)}$<br>${Math.abs(s - alfa) < 1e-9 ? 'Tu tasa de ahorro coincide con la de la regla de oro.' : sobre ? `Con $s = ${tp(s)}$ &gt; $α$ se ahorra de más: <b>ineficiencia dinámica</b>, porque bajar el ahorro subiría el consumo en el estado estacionario (${f(c, 5)} frente a ${f(co, 5)}).` : `Con $s = ${tp(s)}$ &lt; $α$ se ahorra de menos: subir el ahorro hasta ${tp(alfa)} aumentaría el consumo del estado estacionario (de ${f(c, 5)} a ${f(co, 5)}), aunque a costa de consumir menos al principio.`}` });
    pasos.push({ t: 'Velocidad de convergencia', html: `Cerca de $k^*$ la brecha se cierra a un ritmo $λ = (1 − α)(n + g + δ) = ${f(1 - alfa, 4)}·${f(x, 4)} = ${tp(lambda)}$ al año. La mitad de la distancia se cubre en $ln 2/λ = ${f(semivida, 4)}$ años${mitad === null ? '' : ` (en la simulación, ${mitad} año${mitad === 1 ? '' : 's'})`}.` });
    if (P2) {
      const nom = { s: 'la tasa de ahorro s', n: 'el crecimiento de la población n', g: 'el progreso tecnológico g', d: 'la depreciación δ', A: 'la productividad A' }[cambio], un = cambio === 'A' ? '' : ' %', v0 = cambio === 'A' ? A : 100 * ({ s, n, g, d })[cambio], v1 = cambio === 'A' ? P2.A : 100 * P2[cambio];
      pasos.push({ t: `Perturbación en el año ${tc}`, html: `En el año ${tc} cambia ${nom}: de $${f(v0, 5)}${un}$ a $${f(v1, 5)}${un}$. El capital no salta (es una cantidad acumulada: $k_{${tc}} = ${f(kc, 6)}$), pero la curva de inversión o la de reposición se mueven y el estado estacionario también:<br>$k_2^* = ({s_2·A_2}/{n_2 + g_2 + δ_2})^{1/(1 − α)} = ({${f(P2.s, 4)}·${f(P2.A, 4)}}/{${f(P2.x, 4)}})^{1/${f(1 - alfa, 4)}} = ${f(k2, 6)}$ · $y_2^* = ${f(y2, 6)}$ · $c_2^* = ${f(c2, 6)}$<br>El consumo por trabajador efectivo, justo antes del cambio, es ${f(cAntes, 6)}; justo después, con el mismo capital, ${f(cAhora, 6)}; y a largo plazo ${f(c2, 6)} (${c2 > c ? 'más' : c2 < c ? 'menos' : 'igual'} que antes del cambio, ${f(c, 6)}).${cambio === 's' ? (P2.s > s ? ' Ahorrar más reduce el consumo hoy y, si no se ahorra de más, lo aumenta después.' : ' Ahorrar menos aumenta el consumo hoy pero lo reduce a largo plazo.') : ''}${mitad2 !== null ? ` Desde el cambio, el capital cubre la mitad de la distancia al nuevo estado estacionario en ${mitad2} año${mitad2 === 1 ? '' : 's'}.` : ''}` });
    }
    pasos.push({ t: `Trayectoria desde k₀ = ${f(k0, 5)}`, html: `Se itera $k_{t+1} = k_t + s·A·k_t^α − (n + g + δ)·k_t$ durante ${T} año${T === 1 ? '' : 's'}: $k_{${T}} = ${f(kT, 6)}$, ${meta > k0 ? 'que cubre' : 'que recorre'} el ${f(100 * cierre, 4)} % del camino hacia $k${P2 ? '_2' : ''}^*$. ${k0 < k ? 'Como $k_0 &lt; k^*$, el capital crece pero cada vez más despacio (rendimientos decrecientes).' : k0 > k ? 'Como $k_0 &gt; k^*$, el capital baja: hay más de lo que la economía puede mantener.' : 'Parte justo del estado estacionario: no se mueve.'}<br>En el estado estacionario, el producto por trabajador (no efectivo) crece al ritmo $g = ${tp(g)}$ y el producto total al ritmo $n + g = ${tp(n + g)}$.` });
    return { alfa, s, n, g, d, A, k0, T, x, cambio, tc, P2, k2, y2, c2, kc, cAntes, cAhora, mitad2, meta, k, y, c, inv, ko, yo, co, soro: alfa, lambda, semivida, mitad, kT, cierre, fila, prod, sobre, pasos };
  }

  const ejemplos = [
    { clave: 'base', nombre: 'Economía de manual: α = 1/3, s = 20 %', sc: { alfa: '0,3333333333', s: '20', n: '1', g: '2', d: '5', A: '1', k0: '1', T: '60' } },
    { clave: 'oro', nombre: 'Regla de oro: s = α = 30 %', sc: { alfa: '0,3', s: '30', n: '1', g: '2', d: '5', A: '1', k0: '2', T: '80' } },
    { clave: 'ahorra-mucho', nombre: 'Ahorra de más (s = 50 %): ineficiencia dinámica', sc: { alfa: '0,3', s: '50', n: '1', g: '2', d: '5', A: '1', k0: '1', T: '100' } },
    { clave: 'exceso', nombre: 'Empieza con exceso de capital (k₀ > k*)', sc: { alfa: '0,35', s: '15', n: '1', g: '2', d: '6', A: '1', k0: '6', T: '60' } },
    { clave: 'poblacion', nombre: 'Población que crece rápido (n = 3 %)', sc: { alfa: '0,3333333333', s: '20', n: '3', g: '2', d: '5', A: '1', k0: '1', T: '60' } },
    { clave: 'sube-ahorro', nombre: 'Sube el ahorro del 20 % al 30 % en el año 30', sc: { alfa: '0,3333333333', s: '20', n: '1', g: '2', d: '5', A: '1', k0: '3,95', T: '100', cambio: 's', tc: '30', nuevo: '30' } },
    { clave: 'sube-tecnologia', nombre: 'Salto de productividad: A pasa de 1 a 1,5 en el año 20', sc: { alfa: '0,3', s: '25', n: '1', g: '2', d: '5', A: '1', k0: '3', T: '80', cambio: 'A', tc: '20', nuevo: '1,5' } },
    { clave: 'baja-poblacion', nombre: 'Se frena la población: n pasa del 3 % al 0 %', sc: { alfa: '0,3333333333', s: '20', n: '3', g: '2', d: '5', A: '1', k0: '1', T: '80', cambio: 'n', tc: '25', nuevo: '0' } },
  ];

  // modo práctica: datos redondos al azar
  const AZ = K.az, azar = AZ.desde(ejemplos, () => ({ alfa: AZ.t(AZ.toma([0.3, 0.35, 0.4])), s: String(AZ.toma([15, 20, 25, 30])), n: String(AZ.toma([0, 1, 2])), g: String(AZ.toma([1, 2])), d: String(AZ.toma([4, 5, 6])), A: String(AZ.toma([1, 2])), k0: String(AZ.toma([1, 2, 3])), T: '60' }), (sc) => !sc.cambio || sc.cambio === 'ninguno', (sc) => resolver(sc));
  const enunciado = (sc) => `En el modelo de Solow, α = ${sc.alfa}, A = ${sc.A}, la tasa de ahorro es el ${sc.s} %, la población crece un ${sc.n} %, el progreso tecnológico un ${sc.g} % y la depreciación es del ${sc.d} %. Calcula el capital, el producto, el consumo y la inversión por trabajador efectivo en el estado estacionario, el ahorro de la regla de oro y la velocidad de convergencia.`;

  return { azar, enunciado, resolver, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Solow;
