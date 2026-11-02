/* =====================================================================
   Modelo de Solow (sin DOM): crecimiento con función de producción
   Cobb-Douglas y = A·kᵅ en magnitudes por trabajador efectivo. Saca el
   estado estacionario (k*, y*, c*, i*), la regla de oro (la tasa de ahorro
   que maximiza el consumo), la velocidad de convergencia con su semivida y
   la trayectoria año a año desde el capital inicial k₀. Formato de
   economia/comun.js; interfaz en solow/app.js.
     resolver(sc)  { alfa, s, n, g, d, A, k0, T } → { k, y, c, ..., fila, pasos }
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
    const prod = (k) => A * k ** alfa;
    const ss = (sa) => (sa * A / x) ** (1 / (1 - alfa));
    const k = ss(s), y = prod(k), c = (1 - s) * y, inv = s * y;
    const ko = (alfa * A / x) ** (1 / (1 - alfa)), yo = prod(ko), co = yo - x * ko;
    const lambda = (1 - alfa) * x, semivida = Math.LN2 / lambda;
    // trayectoria
    const fila = []; let kt = k0;
    for (let t = 0; t <= T; t++) { const yt = prod(kt); fila.push({ t, k: kt, y: yt, c: (1 - s) * yt, dk: s * yt - x * kt }); kt = kt + s * yt - x * kt; }
    const kT = fila[T].k, cierre = (k - k0) !== 0 ? (kT - k0) / (k - k0) : 1;
    // años hasta cubrir la mitad de la distancia a k*
    let mitad = null; for (const r of fila) if ((k0 < k ? r.k >= (k0 + k) / 2 : r.k <= (k0 + k) / 2)) { mitad = r.t; break; }
    const sobre = s > alfa;
    const pasos = [];
    pasos.push({ t: 'Ecuación de acumulación', html: `El capital por trabajador efectivo crece con lo que se invierte, $s·y$, y se reduce con la inversión de reposición, $(n + g + δ)·k$ (la depreciación más el reparto del capital entre más trabajadores y más productivos):<br>$Δk = s·A·k^α − (n + g + δ)·k$<br>Aquí $n + g + δ = ${f(100 * n, 4)} % + ${f(100 * g, 4)} % + ${f(100 * d, 4)} % = ${tp(x)}$.` });
    pasos.push({ t: 'Estado estacionario', html: `Es el capital con $Δk = 0$: $s·A·k^α = (n + g + δ)·k$. Despejando:<br>$k^* = ({s·A}/{n + g + δ})^{1/(1 − α)} = ({${f(s, 4)}·${f(A, 4)}}/{${f(x, 4)}})^{1/${f(1 - alfa, 4)}} = ${f(k, 6)}$<br>$y^* = A·(k^*)^α = ${f(y, 6)}$ · $c^* = (1 − s)·y^* = ${f(c, 6)}$ · $i^* = s·y^* = ${f(inv, 6)}$` });
    pasos.push({ t: 'Regla de oro', html: `El consumo por trabajador es $c = A·k^α − (n + g + δ)·k$ y es máximo cuando la productividad marginal del capital iguala a $n + g + δ$, que ocurre con $s_{oro} = α = ${f(alfa, 4)}$:<br>$k_{oro} = ({α·A}/{n + g + δ})^{1/(1 − α)} = ${f(ko, 6)}$ · $c_{oro} = ${f(co, 6)}$<br>${Math.abs(s - alfa) < 1e-9 ? 'Tu tasa de ahorro coincide con la de la regla de oro.' : sobre ? `Con $s = ${tp(s)}$ &gt; $α$ se ahorra de más: <b>ineficiencia dinámica</b>, porque bajar el ahorro subiría el consumo en el estado estacionario (${f(c, 5)} frente a ${f(co, 5)}).` : `Con $s = ${tp(s)}$ &lt; $α$ se ahorra de menos: subir el ahorro hasta ${tp(alfa)} aumentaría el consumo del estado estacionario (de ${f(c, 5)} a ${f(co, 5)}), aunque a costa de consumir menos al principio.`}` });
    pasos.push({ t: 'Velocidad de convergencia', html: `Cerca de $k^*$ la brecha se cierra a un ritmo $λ = (1 − α)(n + g + δ) = ${f(1 - alfa, 4)}·${f(x, 4)} = ${tp(lambda)}$ al año. La mitad de la distancia se cubre en $ln 2/λ = ${f(semivida, 4)}$ años${mitad === null ? '' : ` (en la simulación, ${mitad} año${mitad === 1 ? '' : 's'})`}.` });
    pasos.push({ t: `Trayectoria desde k₀ = ${f(k0, 5)}`, html: `Se itera $k_{t+1} = k_t + s·A·k_t^α − (n + g + δ)·k_t$ durante ${T} año${T === 1 ? '' : 's'}: $k_{${T}} = ${f(kT, 6)}$, ${k0 < k ? 'que cubre' : 'que recorre'} el ${f(100 * cierre, 4)} % del camino hacia $k^*$. ${k0 < k ? 'Como $k_0 &lt; k^*$, el capital crece pero cada vez más despacio (rendimientos decrecientes).' : k0 > k ? 'Como $k_0 &gt; k^*$, el capital baja: hay más de lo que la economía puede mantener.' : 'Parte justo del estado estacionario: no se mueve.'}<br>En el estado estacionario, el producto por trabajador (no efectivo) crece al ritmo $g = ${tp(g)}$ y el producto total al ritmo $n + g = ${tp(n + g)}$.` });
    return { alfa, s, n, g, d, A, k0, T, x, k, y, c, inv, ko, yo, co, soro: alfa, lambda, semivida, mitad, kT, cierre, fila, prod, sobre, pasos };
  }

  const ejemplos = [
    { clave: 'base', nombre: 'Economía de manual: α = 1/3, s = 20 %', sc: { alfa: '0,3333333333', s: '20', n: '1', g: '2', d: '5', A: '1', k0: '1', T: '60' } },
    { clave: 'oro', nombre: 'Regla de oro: s = α = 30 %', sc: { alfa: '0,3', s: '30', n: '1', g: '2', d: '5', A: '1', k0: '2', T: '80' } },
    { clave: 'ahorra-mucho', nombre: 'Ahorra de más (s = 50 %): ineficiencia dinámica', sc: { alfa: '0,3', s: '50', n: '1', g: '2', d: '5', A: '1', k0: '1', T: '100' } },
    { clave: 'exceso', nombre: 'Empieza con exceso de capital (k₀ > k*)', sc: { alfa: '0,35', s: '15', n: '1', g: '2', d: '6', A: '1', k0: '6', T: '60' } },
    { clave: 'poblacion', nombre: 'Población que crece rápido (n = 3 %)', sc: { alfa: '0,3333333333', s: '20', n: '3', g: '2', d: '5', A: '1', k0: '1', T: '60' } },
  ];

  return { resolver, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Solow;
