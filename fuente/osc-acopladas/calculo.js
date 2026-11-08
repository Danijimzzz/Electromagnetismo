/* =====================================================================
   Oscilaciones acopladas (sin DOM): dos masas m₁ y m₂ unidas entre sí por un
   muelle kc y cada una a una pared por otro (k₁ y k₂, que puede valer 0).
   Calcula los modos normales (frecuencias y cómo se mueven las masas),
   reparte las condiciones iniciales entre los dos modos, da x₁(t) y x₂(t),
   el batido y el tiempo en que la energía pasa de una masa a la otra.
   Formato y lectura de campos de calculadora.js; interfaz en
   osc-acopladas/app.js.
     resolver(sc) → { w1, w2, r1, r2, x(t), … , pasos }
   Convenciones: m₁ x₁″ = −(k₁ + kc) x₁ + kc x₂ y m₂ x₂″ = kc x₁ − (kc + k₂) x₂;
   cada modo j tiene x₂ = r_j x₁ y frecuencia ω_j (ω₁ < ω₂).
   ===================================================================== */
const OscAcopladas = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { lee, f } = K, n = f;
  const TAU = 2 * Math.PI;

  // kc = 0: dos osciladores independientes (cada masa con su muelle); no hay batido ni intercambio de energía
  function independientes({ m1, m2, k1, k2, x10, x20, v10, v20, t }) {
    if (!(k1 > 0) || !(k2 > 0)) throw new Error('Sin muelle de acoplo (kc = 0) cada masa necesita su propio muelle a la pared: k₁ y k₂ deben ser mayores que 0');
    const wa = Math.sqrt(k1 / m1), wb = Math.sqrt(k2 / m2), primero = wa <= wb, w1 = primero ? wa : wb, w2 = primero ? wb : wa, T1 = TAU / w1, T2 = TAU / w2;
    const osc = (x0, v0, w, tt) => [x0 * Math.cos(w * tt) + (v0 / w) * Math.sin(w * tt), -x0 * w * Math.sin(w * tt) + v0 * Math.cos(w * tt)];
    const x = (tt) => [osc(x10, v10, wa, tt)[0], osc(x20, v20, wb, tt)[0]], v = (tt) => [osc(x10, v10, wa, tt)[1], osc(x20, v20, wb, tt)[1]];
    const [xa, xb] = x(t), [va, vb] = v(t), A1 = Math.hypot(x10, v10 / wa), A2 = Math.hypot(x20, v20 / wb);
    const E = 0.5 * m1 * v10 ** 2 + 0.5 * k1 * x10 ** 2 + 0.5 * m2 * v20 ** 2 + 0.5 * k2 * x20 ** 2;
    const r1 = primero ? 0 : Infinity, r2 = primero ? Infinity : 0, q1 = primero ? x10 : x20, q2 = primero ? x20 : x10, p1 = primero ? v10 : v20, p2 = primero ? v20 : v10, C1 = primero ? A1 : A2, C2 = primero ? A2 : A1;
    const pasos = [
      { t: 'Sin acoplo', html: `Con $k_c = 0$ las ecuaciones se separan: $m_1 x_1″ = −k_1 x_1$ y $m_2 x_2″ = −k_2 x_2$. Son dos osciladores armónicos independientes, sin batido ni transferencia de energía.` },
      { t: 'Frecuencias', html: `$ω_a = √{k_1/m_1} = ${n(wa, 5)} "rad/s"$ ($T = ${n(TAU / wa, 5)} "s"$) para la masa 1 y $ω_b = √{k_2/m_2} = ${n(wb, 5)} "rad/s"$ ($T = ${n(TAU / wb, 5)} "s"$) para la masa 2. Los modos normales son cada masa por separado: en el modo 1 solo se mueve la masa ${primero ? 1 : 2} y en el modo 2 la masa ${primero ? 2 : 1}.` },
      { t: `En t = ${n(t)} s`, html: `$x_1 = ${n(xa, 5)} "m"$, $x_2 = ${n(xb, 5)} "m"$, $v_1 = ${n(va, 5)} "m/s"$ y $v_2 = ${n(vb, 5)} "m/s"$. Amplitudes: $A_1 = ${n(A1, 5)} "m"$ y $A_2 = ${n(A2, 5)} "m"$. Energía total conservada: $E = ${n(E, 5)} "J"$.` },
    ];
    return { m1, m2, k1, k2, kc: 0, x10, x20, v10, v20, t, w1, w2, T1, T2, r1, r2, q1, q2, p1, p2, C1, C2, x, v, xa, xb, va, vb, E, dw: Math.abs(w2 - w1), Tbat: Infinity, Ttrans: Infinity, independiente: true, pasos };
  }

  function resolver(sc) {
    const m1 = lee(sc, 'm1', 'la masa m₁', { min: 0, minEx: true }), m2 = lee(sc, 'm2', 'la masa m₂', { min: 0, minEx: true });
    const k1 = lee(sc, 'k1', 'la constante k₁', { min: 0 }), k2 = lee(sc, 'k2', 'la constante k₂', { min: 0 }), kc = lee(sc, 'kc', 'la constante del muelle de acoplo kc', { min: 0 });
    if (k1 + k2 === 0) throw new Error('Al menos uno de los muelles k₁ y k₂ tiene que sujetar una masa a la pared (si no, el conjunto se desplaza entero)');
    const x10 = lee(sc, 'x10', 'la posición inicial x₁(0)', { def: 0 }), x20 = lee(sc, 'x20', 'la posición inicial x₂(0)', { def: 0 });
    const v10 = lee(sc, 'v10', 'la velocidad inicial v₁(0)', { def: 0 }), v20 = lee(sc, 'v20', 'la velocidad inicial v₂(0)', { def: 0 }), t = lee(sc, 't', 'el instante', { def: 0 });
    if (!x10 && !x20 && !v10 && !v20) throw new Error('Con todas las condiciones iniciales a cero el sistema no se mueve');
    const pasos = [];
    if (kc === 0) return independientes({ m1, m2, k1, k2, x10, x20, v10, v20, t });
    pasos.push({ t: 'Ecuaciones del movimiento', html: `Con $x_1$ y $x_2$ medidas desde el equilibrio: $m_1 x_1″ = −(k_1 + k_c) x_1 + k_c x_2$ y $m_2 x_2″ = k_c x_1 − (k_c + k_2) x_2$. Buscamos soluciones en las que las dos masas oscilen a la vez con la misma $ω$: $x_i = a_i cos(ω t)$.` });
    const a = (k1 + kc) / m1, b = -kc / m1, c = -kc / m2, d = (kc + k2) / m2;
    pasos.push({ t: 'Ecuación de frecuencias', html: `Con $A = (k_1 + k_c)/m_1 = ${n(a, 5)}$, $B = −k_c/m_1 = ${n(b, 5)}$, $C = −k_c/m_2 = ${n(c, 5)}$ y $D = (k_c + k_2)/m_2 = ${n(d, 5)}$ (en s$^{−2}$), $ω^2$ es autovalor de la matriz: $(A − ω^2)(D − ω^2) − B C = 0$.` });
    const med = (a + d) / 2, disc = Math.sqrt(((a - d) / 2) ** 2 + b * c), l1 = med - disc, l2 = med + disc;
    const w1 = Math.sqrt(l1), w2 = Math.sqrt(l2), T1 = TAU / w1, T2 = TAU / w2;
    pasos.push({ t: 'Frecuencias de los modos normales', html: `$ω^2 = (A + D)/2 ∓ √(((A − D)/2)^2 + B C) = ${n(med, 5)} ∓ ${n(disc, 5)}$, es decir $ω_1 = ${n(w1, 5)} "rad/s"$ ($f_1 = ${n(w1 / TAU, 5)} "Hz"$, $T_1 = ${n(T1, 5)} "s"$) y $ω_2 = ${n(w2, 5)} "rad/s"$ ($f_2 = ${n(w2 / TAU, 5)} "Hz"$, $T_2 = ${n(T2, 5)} "s"$).` });
    const r1 = (l1 - a) / b, r2 = (l2 - a) / b, simetrico = m1 === m2 && k1 === k2;
    if (simetrico) pasos.push({ t: 'Caso simétrico', html: `Como $m_1 = m_2 = m$ y $k_1 = k_2 = k$, el sistema es simétrico y los modos son exactos: en fase ($x_2 = x_1$, el muelle de acoplo no se estira) con $ω_1^2 = k/m = ${n(k1 / m1, 5)}$, y en oposición ($x_2 = −x_1$, el acoplo se estira el doble) con $ω_2^2 = (k + 2k_c)/m = ${n((k1 + 2 * kc) / m1, 5)}$.` });
    const desc = (r) => (r > 0 ? `las dos masas van en fase (x₂ = ${n(r, 4)} x₁)` : `las masas van en oposición de fase (x₂ = ${n(r, 4)} x₁)`);
    pasos.push({ t: 'Modos normales', html: `De la primera ecuación, $a_2/a_1 = (ω^2 − A)/B$. Modo 1: $${n(r1, 5)}$, ${desc(r1)}. Modo 2: $${n(r2, 5)}$, ${desc(r2)}.` });
    // x_i = Σ V_ij (q_j cos ω_j t + p_j/ω_j sin ω_j t), con V = [[1, 1], [r1, r2]]
    const det = r2 - r1;
    const q1 = (r2 * x10 - x20) / det, q2 = (x20 - r1 * x10) / det, p1 = (r2 * v10 - v20) / det, p2 = (v20 - r1 * v10) / det;
    const C1 = Math.hypot(q1, p1 / w1), C2 = Math.hypot(q2, p2 / w2);
    pasos.push({ t: 'Condiciones iniciales', html: `Se escribe $x_1(0) = ${n(x10)}$, $x_2(0) = ${n(x20)}$, $v_1(0) = ${n(v10)}$ y $v_2(0) = ${n(v20)}$ como suma de los dos modos, $x_1 = q_1 cos(ω_1 t) + (p_1/ω_1) sin(ω_1 t) + q_2 cos(ω_2 t) + (p_2/ω_2) sin(ω_2 t)$ y $x_2 = r_1 (…)_1 + r_2 (…)_2$, con $q_1 = ${n(q1, 5)}$, $q_2 = ${n(q2, 5)}$, $p_1 = ${n(p1, 5)}$ y $p_2 = ${n(p2, 5)}$. Amplitud de cada modo (en $x_1$): $${n(C1, 5)} "m"$ y $${n(C2, 5)} "m"$.` });
    const x = (tt) => {
      const g1 = q1 * Math.cos(w1 * tt) + (p1 / w1) * Math.sin(w1 * tt), g2 = q2 * Math.cos(w2 * tt) + (p2 / w2) * Math.sin(w2 * tt);
      return [g1 + g2, r1 * g1 + r2 * g2];
    };
    const v = (tt) => {
      const h1 = -q1 * w1 * Math.sin(w1 * tt) + p1 * Math.cos(w1 * tt), h2 = -q2 * w2 * Math.sin(w2 * tt) + p2 * Math.cos(w2 * tt);
      return [h1 + h2, r1 * h1 + r2 * h2];
    };
    const [xa, xb] = x(t), [va, vb] = v(t);
    pasos.push({ t: `En t = ${n(t)} s`, html: `$x_1 = ${n(xa, 5)} "m"$, $x_2 = ${n(xb, 5)} "m"$, $v_1 = ${n(va, 5)} "m/s"$ y $v_2 = ${n(vb, 5)} "m/s"$.` });
    const energia = (xx, vv) => 0.5 * m1 * vv[0] ** 2 + 0.5 * m2 * vv[1] ** 2 + 0.5 * k1 * xx[0] ** 2 + 0.5 * kc * (xx[1] - xx[0]) ** 2 + 0.5 * k2 * xx[1] ** 2;
    const E = energia([x10, x20], [v10, v20]);
    pasos.push({ t: 'Energía', html: `$E = 1/2 m_1 v_1^2 + 1/2 m_2 v_2^2 + 1/2 k_1 x_1^2 + 1/2 k_c (x_2 − x_1)^2 + 1/2 k_2 x_2^2 = ${n(E, 5)} "J"$ se conserva (en t = ${n(t)} s vale ${n(energia([xa, xb], [va, vb]), 5)} J).` });
    const dw = w2 - w1, Tbat = TAU / dw, Ttrans = Math.PI / dw;
    pasos.push({ t: 'Batido y transferencia de energía', html: `Las dos frecuencias se suman y se restan: $ω_2 − ω_1 = ${n(dw, 5)} "rad/s"$ da un batido de periodo $T_b = 2π/(ω_2 − ω_1) = ${n(Tbat, 5)} "s"$. Si empieza moviéndose solo una masa con los dos modos igual de excitados, la energía pasa entera a la otra en $π/(ω_2 − ω_1) = ${n(Ttrans, 5)} "s"$. Cuanto más débil es el acoplo $k_c$, más cerca están $ω_1$ y $ω_2$ y más lento es el intercambio.` });
    return { m1, m2, k1, k2, kc, x10, x20, v10, v20, t, w1, w2, T1, T2, r1, r2, q1, q2, p1, p2, C1, C2, x, v, xa, xb, va, vb, E, dw, Tbat, Ttrans, pasos };
  }

  const ejemplos = [
    { clave: 'sin-acoplo', nombre: 'Sin muelle de acoplo (kc = 0): dos osciladores independientes', sc: { m1: '1', m2: '2', k1: '100', kc: '0', k2: '150', x10: '0,1', x20: '0,05', v10: '0', v20: '0', t: '0,5' } },
    { clave: 'iguales', nombre: 'Dos masas iguales: se suelta una', sc: { m1: '1', m2: '1', k1: '100', kc: '10', k2: '100', x10: '0,1', x20: '0', v10: '0', v20: '0', t: '0,5' } },
    { clave: 'modo1', nombre: 'Modo 1 puro: las dos masas en fase', sc: { m1: '1', m2: '1', k1: '100', kc: '10', k2: '100', x10: '0,1', x20: '0,1', v10: '0', v20: '0', t: '0,3' } },
    { clave: 'modo2', nombre: 'Modo 2 puro: masas en oposición', sc: { m1: '1', m2: '1', k1: '100', kc: '10', k2: '100', x10: '0,1', x20: '-0,1', v10: '0', v20: '0', t: '0,3' } },
    { clave: 'carros', nombre: 'Dos carros, uno unido a la pared (2 kg y 1 kg)', sc: { m1: '2', m2: '1', k1: '100', kc: '50', k2: '0', x10: '0,1', x20: '0', v10: '0', v20: '0', t: '0,2' } },
    { clave: 'debil', nombre: 'Acoplo débil: el batido es lento', sc: { m1: '1', m2: '1', k1: '100', kc: '2', k2: '100', x10: '0,05', x20: '0', v10: '0', v20: '0', t: '1' } },
    { clave: 'golpe', nombre: 'Golpe a la segunda masa (v₂ = 1 m/s)', sc: { m1: '0,5', m2: '1', k1: '80', kc: '30', k2: '60', x10: '0', x20: '0', v10: '0', v20: '1', t: '0,4' } },
  ];

  // sc al azar para el modo práctica
  const azar = () => {
    const r = (a, b, d = 1) => (Math.round((a + Math.random() * (b - a)) * 10 ** d) / 10 ** d).toString().replace('.', ',');
    return { m1: r(0.5, 2, 1), m2: r(0.5, 2, 1), k1: r(50, 200, 0), kc: r(5, 60, 0), k2: r(50, 200, 0), x10: r(0.05, 0.2, 2), x20: '0', v10: '0', v20: '0', t: r(0.1, 1, 1) };
  };

  return { resolver, ejemplos, azar, f };
})();
if (typeof module !== 'undefined') module.exports = OscAcopladas;
