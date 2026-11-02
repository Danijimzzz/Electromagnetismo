/* =====================================================================
   Interfaz de Oscilaciones acopladas: datos de las dos masas y los tres
   muelles, resultados (modos normales, batido), la posición de cada masa en
   el tiempo y el desarrollo. Se monta con Calculadora.monta (calculadora.js);
   el cálculo está en osc-acopladas/calculo.js.
   ===================================================================== */
(() => {
  const O = OscAcopladas, { f } = O;
  const enunciado = (sc) => `Dos masas de ${sc.m1} kg y ${sc.m2} kg, unidas entre sí por un muelle de ${sc.kc} N/m y a las paredes por muelles de ${sc.k1} N/m y ${sc.k2} N/m, parten de x₁ = ${sc.x10} m, x₂ = ${sc.x20} m, v₁ = ${sc.v10} m/s y v₂ = ${sc.v20} m/s. Calcula las frecuencias de los modos normales y la posición de cada masa en t = ${sc.t} s.`;
  Calculadora.monta({
    C: O, carpeta: 'osc-acopladas', app: 'OscAcopladasApp', azar: O.azar, enunciado,
    nota: 'Muelles: pared — k₁ — m₁ — kc — m₂ — k₂ — pared. k₁ o k₂ pueden valer 0 (masa libre por ese lado), pero no los dos. Las posiciones se miden desde el equilibrio.',
    campos: () => [
      { sep: 'Masas y muelles' }, { k: 'm1', nom: 'Masa m₁', un: 'kg' }, { k: 'm2', nom: 'Masa m₂', un: 'kg' },
      { k: 'k1', nom: 'Muelle k₁ (pared–m₁)', un: 'N/m' }, { k: 'kc', nom: 'Muelle de acoplo kc', un: 'N/m' }, { k: 'k2', nom: 'Muelle k₂ (m₂–pared)', un: 'N/m' },
      { sep: 'Condiciones iniciales' }, { k: 'x10', nom: 'Posición x₁(0)', un: 'm' }, { k: 'x20', nom: 'Posición x₂(0)', un: 'm' },
      { k: 'v10', nom: 'Velocidad v₁(0)', un: 'm/s' }, { k: 'v20', nom: 'Velocidad v₂(0)', un: 'm/s' }, { k: 't', nom: 'Instante t', un: 's' },
    ],
    resumen: (s) => [
      ['Frecuencia ω₁', `${f(s.w1, 5)} rad/s`, true], ['Frecuencia ω₂', `${f(s.w2, 5)} rad/s`, true],
      ['Modo 1 (x₂/x₁)', f(s.r1, 4)], ['Modo 2 (x₂/x₁)', f(s.r2, 4)],
      ['Periodos T₁ y T₂', `${f(s.T1, 4)} s y ${f(s.T2, 4)} s`], ['Periodo del batido', `${f(s.Tbat, 4)} s`], ['Transferencia de energía', `${f(s.Ttrans, 4)} s`], ['Energía total', `${f(s.E, 4)} J`],
      [`x₁ en t = ${f(s.t)} s`, `${f(s.xa, 4)} m`], [`x₂ en t = ${f(s.t)} s`, `${f(s.xb, 4)} m`],
    ],
    grafica: (s) => {
      const tmax = Math.min(2 * s.Tbat, 40 * s.T2), N = 700, p1 = [], p2 = []; let amp = 0;
      for (let j = 0; j <= N; j++) { const t = (tmax * j) / N, [a, b] = s.x(t); p1.push([t, a]); p2.push([t, b]); amp = Math.max(amp, Math.abs(a), Math.abs(b)); }
      const tt = Math.min(s.t, tmax), [a, b] = s.x(tt);
      return { x: [0, tmax], y: [-amp * 1.15, amp * 1.15], fx: (v) => f(v, 3), ejeX: 'Tiempo (s)', ejeY: 'Posición (m)', series: [{ pts: p1, color: '--serie-1' }, { pts: p2, color: '--serie-2' }, { tipo: 'puntos', pts: [[tt, a]], color: '--serie-1', radio: 6 }, { tipo: 'puntos', pts: [[tt, b]], color: '--serie-2', radio: 6 }], horizontales: [{ y: 0 }] };
    },
    leyenda: () => '<b>Azul</b>: posición de m₁. <b>Rojo</b>: posición de m₂. Los puntos marcan el instante elegido. Cuando una se apaga, la otra se llena: la energía pasa de una masa a la otra.',
  });
})();
