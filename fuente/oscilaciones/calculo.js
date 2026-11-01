/* =====================================================================
   Oscilaciones (sin DOM): movimiento armónico simple (masa en un muelle y
   péndulo simple), oscilador amortiguado (subamortiguado, crítico y
   sobreamortiguado) y oscilador forzado con su resonancia. Formato y lectura
   de campos de calculadora.js; interfaz en oscilaciones/app.js.
     resolver(sc)  { modo: 'mas' | 'amortiguado' | 'forzado', … } → { …, pasos }
   Convenciones: x = A cos(ωt + φ) en el MAS; ecuación m x″ + b x′ + k x = F(t);
   γ = b/2m y ω₀ = √(k/m). Lo que viene del péndulo usa la aproximación de
   ángulos pequeños (con el periodo exacto como comparación).
   ===================================================================== */
const Oscilaciones = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { lee, f } = K, n = f, RAD = Math.PI / 180;
  const MODOS = { mas: 'Movimiento armónico simple', amortiguado: 'Oscilador amortiguado', forzado: 'Oscilador forzado y resonancia' };
  const SISTEMAS = { muelle: 'Masa en un muelle', pendulo: 'Péndulo simple' };

  // periodo exacto del péndulo de amplitud θ0 (rad): T = T₀ / AGM(1, cos(θ₀/2))
  const agm = (a, b) => { for (let i = 0; i < 30 && Math.abs(a - b) > 1e-15; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)]; return a; };
  const factorPendulo = (th0) => 1 / agm(1, Math.cos(th0 / 2));

  function mas(sc) {
    const sis = sc.sistema === 'pendulo' ? 'pendulo' : 'muelle', pasos = [];
    const m = lee(sc, 'm', 'la masa', { min: 0, minEx: true }), t = lee(sc, 't', 'el instante', { def: 0 });
    let w, k, L, g, th0 = null;
    if (sis === 'muelle') {
      k = lee(sc, 'k', 'la constante del muelle', { min: 0, minEx: true }); w = Math.sqrt(k / m);
      pasos.push({ t: 'Frecuencia angular', html: `$ω = √(k/m) = √({${n(k)}}/{${n(m)}}) = ${n(w, 5)} "rad/s"$` });
    } else {
      L = lee(sc, 'L', 'la longitud', { min: 0, minEx: true }); g = lee(sc, 'g', 'la gravedad', { min: 0, minEx: true, def: 9.8 }); w = Math.sqrt(g / L); k = m * w * w;
      pasos.push({ t: 'Frecuencia angular', html: `Para ángulos pequeños, $ω = √(g/L) = √({${n(g)}}/{${n(L)}}) = ${n(w, 5)} "rad/s"$ (equivale a un muelle de constante $k = m ω^2 = ${n(k, 4)} "N/m"$).` });
    }
    const T = (2 * Math.PI) / w, fr = 1 / T;
    pasos.push({ t: 'Periodo y frecuencia', html: `$T = 2π/ω = ${n(T, 5)} "s"$ y $f = 1/T = ${n(fr, 5)} "Hz"$` });
    // amplitud y fase
    let A, phi, x0, v0;
    if (sis === 'muelle' && sc.ini === 'xv') {
      x0 = lee(sc, 'x0', 'la posición inicial'); v0 = lee(sc, 'v0', 'la velocidad inicial', { def: 0 });
      A = Math.hypot(x0, v0 / w); if (A === 0) throw new Error('Con x₀ = 0 y v₀ = 0 el cuerpo no se mueve');
      phi = Math.atan2(-v0 / w, x0);
      pasos.push({ t: 'Amplitud y fase', html: `$A = √(x_0^2 + (v_0/ω)^2) = √(${n(x0)}^2 + (${n(v0)}/${n(w, 5)})^2) = ${n(A, 5)} "m"$ y $φ = "atan2"(−v_0/ω, x_0) = ${n(phi, 5)} "rad"$ = ${n(phi / RAD, 5)}°` });
    } else {
      const am = lee(sc, 'A', sis === 'pendulo' ? 'la amplitud angular' : 'la amplitud', { min: 0, minEx: true });
      const ph = lee(sc, 'fase', 'la fase inicial', { def: 0 });
      phi = ph * RAD;
      if (sis === 'pendulo') {
        th0 = am * RAD; if (th0 >= Math.PI) throw new Error('La amplitud angular tiene que ser menor que 180°');
        A = L * th0;
        pasos.push({ t: 'Amplitud', html: `La amplitud angular es $θ_0 = ${n(am)}° = ${n(th0, 5)} "rad"$, y el arco máximo, $A = L θ_0 = ${n(A, 5)} "m"$.` });
      } else A = am;
      x0 = A * Math.cos(phi); v0 = -A * w * Math.sin(phi);
    }
    const vmax = A * w, amax = A * w * w, E = 0.5 * k * A * A;
    const x = A * Math.cos(w * t + phi), v = -A * w * Math.sin(w * t + phi), a = -w * w * x, Ep = 0.5 * k * x * x, Ec = 0.5 * m * v * v;
    pasos.push({ t: 'Ecuaciones del movimiento', html: `$x(t) = A cos(ω t + φ) = ${n(A, 5)} cos(${n(w, 5)} t + ${n(phi, 4)})$, $v = −A ω sin(ω t + φ)$ y $a = −ω^2 x$. Máximos: $v_{máx} = A ω = ${n(vmax, 5)} "m/s"$ y $a_{máx} = A ω^2 = ${n(amax, 5)} "m/s"^2$.` });
    pasos.push({ t: `En t = ${n(t)} s`, html: `$x = ${n(x, 5)} "m"$, $v = ${n(v, 5)} "m/s"$ y $a = −ω^2 x = ${n(a, 5)} "m/s"^2$.` });
    pasos.push({ t: 'Energía', html: `$E = 1/2 k A^2 = ${n(E, 5)} "J"$ se mantiene constante. En ese instante: $E_p = 1/2 k x^2 = ${n(Ep, 5)} "J"$ y $E_c = 1/2 m v^2 = ${n(Ec, 5)} "J"$ (suman ${n(Ep + Ec, 5)} J).` });
    let Texacto = null;
    if (sis === 'pendulo') {
      Texacto = T * factorPendulo(th0);
      pasos.push({ t: 'Cuánto vale la aproximación', html: `Con esa amplitud el periodo exacto es $T = ${n(Texacto, 5)} "s"$, un ${n(100 * (Texacto / T - 1), 3)} % mayor que el de ángulos pequeños.${th0 > 0.26 ? ' Pasa de unos 15°: el movimiento ya no es armónico simple y conviene el periodo exacto.' : ' Por debajo de unos 15° la aproximación es muy buena.'}` });
    }
    return { modo: 'mas', sis, m, k, w, T, fr, A, phi, x0, v0, vmax, amax, E, t, x, v, a, Ep, Ec, th0, Texacto, pasos };
  }

  // x(t) del oscilador amortiguado con x(0) = x0, x′(0) = v0
  function movimiento(gm, w0, x0, v0) {
    const d = gm * gm - w0 * w0, tol = 1e-9 * w0 * w0;
    if (d < -tol) { const wd = Math.sqrt(-d), B = (v0 + gm * x0) / wd; return { caso: 'sub', wd, B, x: (t) => Math.exp(-gm * t) * (x0 * Math.cos(wd * t) + B * Math.sin(wd * t)) }; }
    if (Math.abs(d) <= tol) { const B = v0 + gm * x0; return { caso: 'crit', B, x: (t) => (x0 + B * t) * Math.exp(-gm * t) }; }
    const s = Math.sqrt(d), r1 = -gm + s, r2 = -gm - s, c1 = (v0 - r2 * x0) / (r1 - r2), c2 = x0 - c1;
    return { caso: 'sobre', r1, r2, c1, c2, x: (t) => c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t) };
  }

  function amortiguado(sc) {
    const m = lee(sc, 'm', 'la masa', { min: 0, minEx: true }), k = lee(sc, 'k', 'la constante del muelle', { min: 0, minEx: true }), b = lee(sc, 'b', 'el coeficiente de rozamiento', { min: 0, minEx: true });
    const x0 = lee(sc, 'x0', 'la posición inicial'), v0 = lee(sc, 'v0', 'la velocidad inicial', { def: 0 });
    if (x0 === 0 && v0 === 0) throw new Error('Con x₀ = 0 y v₀ = 0 el cuerpo no se mueve');
    const w0 = Math.sqrt(k / m), gm = b / (2 * m), bc = 2 * Math.sqrt(k * m), mov = movimiento(gm, w0, x0, v0), tau = 1 / gm, pasos = [];
    pasos.push({ t: 'Parámetros del oscilador', html: `$ω_0 = √(k/m) = ${n(w0, 5)} "rad/s"$ y $γ = b/(2m) = ${n(b)}/(2·${n(m)}) = ${n(gm, 5)} "s"^{−1}$. El rozamiento crítico sería $b_c = 2√(k m) = ${n(bc, 5)} "kg/s"$.` });
    let R = { modo: 'amortiguado', m, k, b, x0, v0, w0, gm, bc, caso: mov.caso, tau, x: mov.x, pasos };
    if (mov.caso === 'sub') {
      const wd = mov.wd, Td = (2 * Math.PI) / wd, Q = w0 / (2 * gm), dl = gm * Td;
      pasos.push({ t: 'Tipo de movimiento', html: `$γ < ω_0$ ($b < b_c$): subamortiguado. Oscila con frecuencia angular $ω_d = √(ω_0^2 − γ^2) = ${n(wd, 5)} "rad/s"$ y periodo $T_d = 2π/ω_d = ${n(Td, 5)} "s"$, dentro de una envolvente $e^{−γ t}$.` });
      pasos.push({ t: 'Solución', html: `$x(t) = e^{−γ t}(x_0 cos ω_d t + B sin ω_d t)$ con $B = (v_0 + γ x_0)/ω_d = ${n(mov.B, 5)}$.` });
      pasos.push({ t: 'Qué tan amortiguado está', html: `Factor de calidad $Q = ω_0/(2γ) = ${n(Q, 4)}$; decremento logarítmico $δ = γ T_d = ${n(dl, 4)}$ (cada oscilación la amplitud se reduce un factor $e^{δ} = ${n(Math.exp(dl), 4)}$).` });
      Object.assign(R, { wd, Td, Q, dl, B: mov.B });
    } else if (mov.caso === 'crit') {
      pasos.push({ t: 'Tipo de movimiento', html: `$γ = ω_0$ ($b = b_c$): amortiguamiento crítico. Es el que vuelve al equilibrio más deprisa sin oscilar.` });
      pasos.push({ t: 'Solución', html: `$x(t) = (x_0 + (v_0 + γ x_0) t) e^{−γ t} = (${n(x0)} + ${n(mov.B, 5)} t) e^{−${n(gm, 5)} t}$` });
      Object.assign(R, { B: mov.B });
    } else {
      pasos.push({ t: 'Tipo de movimiento', html: `$γ > ω_0$ ($b > b_c$): sobreamortiguado. No oscila; vuelve al equilibrio de forma exponencial.` });
      pasos.push({ t: 'Solución', html: `Las raíces son $r_{1,2} = −γ ± √(γ^2 − ω_0^2) = ${n(mov.r1, 5)}$ y ${n(mov.r2, 5)} s⁻¹, y $x(t) = c_1 e^{r_1 t} + c_2 e^{r_2 t}$ con $c_1 = ${n(mov.c1, 5)}$ y $c_2 = ${n(mov.c2, 5)}$.` });
      Object.assign(R, { r1: mov.r1, r2: mov.r2, c1: mov.c1, c2: mov.c2 });
    }
    pasos.push({ t: 'Tiempo de relajación', html: `La amplitud cae a $1/e$ en $τ = 1/γ = 2m/b = ${n(tau, 5)} "s"$; la energía, en $τ/2$.` });
    return R;
  }

  function forzado(sc) {
    const m = lee(sc, 'm', 'la masa', { min: 0, minEx: true }), k = lee(sc, 'k', 'la constante del muelle', { min: 0, minEx: true }), b = lee(sc, 'b', 'el coeficiente de rozamiento', { min: 0, minEx: true });
    const F0 = lee(sc, 'F0', 'la fuerza máxima', { min: 0, minEx: true }), w = lee(sc, 'w', 'la frecuencia de la fuerza', { min: 0, minEx: true });
    const w0 = Math.sqrt(k / m), gm = b / (2 * m), pasos = [];
    const amp = (ww) => (F0 / m) / Math.hypot(w0 * w0 - ww * ww, 2 * gm * ww);
    const A = amp(w), delta = Math.atan2(2 * gm * w, w0 * w0 - w * w), Q = w0 / (2 * gm);
    pasos.push({ t: 'Parámetros', html: `$ω_0 = √(k/m) = ${n(w0, 5)} "rad/s"$ ($f_0 = ${n(w0 / (2 * Math.PI), 5)} "Hz"$) y $γ = b/(2m) = ${n(gm, 5)} "s"^{−1}$. La fuerza $F_0 cos(ω t)$ tiene $ω = ${n(w, 5)} "rad/s"$ ($ω/ω_0 = ${n(w / w0, 4)}$).` });
    pasos.push({ t: 'Amplitud en régimen estacionario', html: `$A = {F_0/m}/√((ω_0^2 − ω^2)^2 + 4 γ^2 ω^2) = {${n(F0 / m, 5)}}/√((${n(w0 * w0, 5)} − ${n(w * w, 5)})^2 + (${n(2 * gm * w, 5)})^2) = ${n(A, 5)} "m"$` });
    pasos.push({ t: 'Desfase', html: `$δ = "atan2"(2γω, ω_0^2 − ω^2) = ${n(delta, 5)} "rad"$ = ${n(delta / RAD, 4)}°: el cuerpo ${delta < 1e-3 ? 'va a la vez que la fuerza' : Math.abs(delta - Math.PI / 2) < 1e-3 ? 'va retrasado un cuarto de periodo (90°), justo en resonancia de velocidad' : 'va retrasado respecto a la fuerza'}, y $x(t) = A cos(ω t − δ)$.` });
    const hayRes = w0 * w0 > 2 * gm * gm, wr = hayRes ? Math.sqrt(w0 * w0 - 2 * gm * gm) : 0, Amax = hayRes ? (F0 / m) / (2 * gm * Math.sqrt(w0 * w0 - gm * gm)) : (F0 / m) / (w0 * w0);
    pasos.push({ t: 'Resonancia', html: hayRes ? `La amplitud es máxima en $ω_r = √(ω_0^2 − 2γ^2) = ${n(wr, 5)} "rad/s"$, con $A_{máx} = {F_0/m}/(2γ√(ω_0^2 − γ^2)) = ${n(Amax, 5)} "m"$. Factor de calidad $Q = ω_0/(2γ) = ${n(Q, 4)}$.` : `Con tanto rozamiento ($2γ^2 ≥ ω_0^2$) no hay máximo de amplitud: crece menos cuanto mayor es ω, y el valor más alto es el estático, $F_0/k = ${n(F0 / k, 5)} "m"$.` });
    const est = F0 / k;
    pasos.push({ t: 'Comparación con la fuerza estática', html: `Una fuerza constante $F_0$ estiraría el muelle $F_0/k = ${n(est, 5)} "m"$; la amplitud es ${n(A / est, 4)} veces esa deformación (amplificación).` });
    const P = 0.5 * b * w * w * A * A;
    pasos.push({ t: 'Potencia media absorbida', html: `$P = 1/2 b ω^2 A^2 = ${n(P, 5)} "W"$, que es la que disipa el rozamiento.` });
    return { modo: 'forzado', m, k, b, F0, w, w0, gm, Q, A, delta, hayRes, wr, Amax, est, P, amp, pasos };
  }

  const R = { mas, amortiguado, forzado };
  const resolver = (sc) => (R[sc.modo] || mas)(sc);

  const ejemplos = [
    { clave: 'muelle', nombre: 'Masa de 0,5 kg en un muelle de 200 N/m', sc: { modo: 'mas', sistema: 'muelle', m: '0,5', k: '200', ini: 'af', A: '0,1', fase: '0', t: '0,05' } },
    { clave: 'muelle-xv', nombre: 'Muelle lanzado desde x₀ = 4 cm con v₀ = 0,6 m/s', sc: { modo: 'mas', sistema: 'muelle', m: '0,5', k: '200', ini: 'xv', x0: '0,04', v0: '0,6', t: '0,1' } },
    { clave: 'pendulo', nombre: 'Péndulo de 1 m soltado desde 10°', sc: { modo: 'mas', sistema: 'pendulo', m: '0,2', L: '1', g: '9,8', A: '10', fase: '0', t: '0,5' } },
    { clave: 'sub', nombre: 'Subamortiguado: m = 1 kg, k = 100 N/m, b = 2 kg/s', sc: { modo: 'amortiguado', m: '1', k: '100', b: '2', x0: '0,2', v0: '0' } },
    { clave: 'critico', nombre: 'Amortiguamiento crítico (b = 20 kg/s)', sc: { modo: 'amortiguado', m: '1', k: '100', b: '20', x0: '0,2', v0: '0' } },
    { clave: 'sobre', nombre: 'Sobreamortiguado (b = 50 kg/s)', sc: { modo: 'amortiguado', m: '1', k: '100', b: '50', x0: '0,2', v0: '0' } },
    { clave: 'resonancia', nombre: 'Oscilador forzado justo en ω = ω₀', sc: { modo: 'forzado', m: '1', k: '100', b: '2', F0: '5', w: '10' } },
    { clave: 'fuera', nombre: 'Oscilador forzado muy por debajo de la resonancia', sc: { modo: 'forzado', m: '1', k: '100', b: '2', F0: '5', w: '5' } },
  ];

  // sc al azar para el modo práctica
  const azar = () => {
    const r = (a, b, d = 1) => (Math.round((a + Math.random() * (b - a)) * 10 ** d) / 10 ** d).toString().replace('.', ',');
    const modo = ['mas', 'amortiguado', 'forzado'][Math.floor(Math.random() * 3)];
    if (modo === 'mas') return { modo, sistema: 'muelle', m: r(0.2, 2, 1), k: r(50, 400, 0), ini: 'af', A: r(0.05, 0.3, 2), fase: '0', t: r(0.05, 0.5, 2) };
    if (modo === 'amortiguado') return { modo, m: r(0.5, 2, 1), k: r(50, 300, 0), b: r(0.5, 8, 1), x0: r(0.05, 0.3, 2), v0: '0' };
    return { modo, m: r(0.5, 2, 1), k: r(50, 300, 0), b: r(0.5, 6, 1), F0: r(1, 10, 1), w: r(3, 20, 1) };
  };

  return { resolver, ejemplos, azar, MODOS, SISTEMAS, factorPendulo, movimiento, f };
})();
if (typeof module !== 'undefined') module.exports = Oscilaciones;
