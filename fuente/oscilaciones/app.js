/* =====================================================================
   Interfaz de Oscilaciones: lo que se calcula, los datos, la gráfica
   (la posición en el tiempo del MAS, el oscilador amortiguado con su
   envolvente, o la curva de resonancia) y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en
   oscilaciones/calculo.js.
   ===================================================================== */
(() => {
  const O = Oscilaciones, { f } = O, TAU = 2 * Math.PI;
  const enunciado = (sc, s) => {
    if (sc.modo === 'mas') return sc.sistema === 'pendulo' ? `Un péndulo simple de ${sc.L} m y ${sc.m} kg se suelta desde ${sc.A}°. Calcula su periodo y la velocidad máxima.` : `Una masa de ${sc.m} kg unida a un muelle de ${sc.k} N/m oscila con amplitud ${sc.A} m. Calcula el periodo, la velocidad máxima y la energía.`;
    if (sc.modo === 'amortiguado') return `Un oscilador de ${sc.m} kg y ${sc.k} N/m tiene un rozamiento de ${sc.b} kg/s y parte de x₀ = ${sc.x0} m en reposo. ¿Qué tipo de movimiento hace?`;
    return `Un oscilador de ${sc.m} kg, ${sc.k} N/m y b = ${sc.b} kg/s se somete a una fuerza de ${sc.F0} N con ω = ${sc.w} rad/s. Calcula la amplitud y el desfase.`;
  };
  Calculadora.monta({
    C: O, carpeta: 'oscilaciones', app: 'OscilacionesApp', azar: O.azar, enunciado,
    nota: 'Se admite 0,05, 5e-2 o 5·10^-2. El péndulo usa la aproximación de ángulos pequeños; se compara con el periodo exacto.',
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(O.MODOS) }];
      if (sc.modo === 'amortiguado') return [...cs, { k: 'm', nom: 'Masa m', un: 'kg' }, { k: 'k', nom: 'Constante k', un: 'N/m' }, { k: 'b', nom: 'Rozamiento b', un: 'kg/s' }, { k: 'x0', nom: 'Posición inicial x₀', un: 'm' }, { k: 'v0', nom: 'Velocidad inicial v₀', un: 'm/s' }];
      if (sc.modo === 'forzado') return [...cs, { k: 'm', nom: 'Masa m', un: 'kg' }, { k: 'k', nom: 'Constante k', un: 'N/m' }, { k: 'b', nom: 'Rozamiento b', un: 'kg/s' }, { k: 'F0', nom: 'Fuerza máxima F₀', un: 'N' }, { k: 'w', nom: 'Frecuencia de la fuerza ω', un: 'rad/s' }];
      const pen = sc.sistema === 'pendulo';
      return [...cs, { k: 'sistema', nom: 'Sistema', tipo: 'sel', ops: Object.entries(O.SISTEMAS) }, { k: 'm', nom: 'Masa m', un: 'kg' },
        ...(pen ? [{ k: 'L', nom: 'Longitud L', un: 'm' }, { k: 'g', nom: 'Gravedad g', un: 'm/s²' }, { k: 'A', nom: 'Amplitud angular θ₀', un: '°' }, { k: 'fase', nom: 'Fase inicial φ', un: '°' }]
          : [{ k: 'k', nom: 'Constante k', un: 'N/m' }, { k: 'ini', nom: 'Condiciones iniciales', tipo: 'sel', ops: [['af', 'Amplitud y fase'], ['xv', 'Posición y velocidad']] },
            ...(sc.ini === 'xv' ? [{ k: 'x0', nom: 'Posición x₀', un: 'm' }, { k: 'v0', nom: 'Velocidad v₀', un: 'm/s' }] : [{ k: 'A', nom: 'Amplitud A', un: 'm' }, { k: 'fase', nom: 'Fase inicial φ', un: '°' }])]),
        { k: 't', nom: 'Instante t', un: 's' }];
    },
    resumen: (s) => {
      if (s.modo === 'mas') return [['Periodo T', `${f(s.T, 5)} s`, true], ['Frecuencia f', `${f(s.fr, 5)} Hz`], ['Frecuencia angular ω', `${f(s.w, 5)} rad/s`], ['Amplitud', `${f(s.A, 4)} m`], ['Velocidad máxima', `${f(s.vmax, 4)} m/s`], ['Aceleración máxima', `${f(s.amax, 4)} m/s²`], ['Energía total', `${f(s.E, 4)} J`],
        [`x en t = ${f(s.t)} s`, `${f(s.x, 4)} m`], ...(s.Texacto ? [['Periodo exacto', `${f(s.Texacto, 5)} s`]] : [])];
      if (s.modo === 'amortiguado') return [['Movimiento', { sub: 'subamortiguado', crit: 'crítico', sobre: 'sobreamortiguado' }[s.caso], true], ['Tiempo de relajación τ', `${f(s.tau, 4)} s`], ['ω₀', `${f(s.w0, 5)} rad/s`], ['γ = b/2m', `${f(s.gm, 4)} s⁻¹`], ['Rozamiento crítico', `${f(s.bc, 4)} kg/s`],
        ...(s.caso === 'sub' ? [['Frecuencia ω_d', `${f(s.wd, 5)} rad/s`], ['Periodo T_d', `${f(s.Td, 5)} s`], ['Factor de calidad Q', f(s.Q, 4)], ['Decremento logarítmico', f(s.dl, 4)]] : [])];
      return [['Amplitud A', `${f(s.A, 5)} m`, true], ['Desfase δ', `${f(s.delta / (Math.PI / 180), 4)}°`], ['ω₀', `${f(s.w0, 5)} rad/s`], ['Factor de calidad Q', f(s.Q, 4)], ['Amplitud máxima', `${f(s.Amax, 4)} m`], ['Frecuencia de resonancia', s.hayRes ? `${f(s.wr, 5)} rad/s` : 'no hay máximo'], ['Potencia media', `${f(s.P, 4)} W`]];
    },
    grafica: (s) => {
      if (s.modo === 'forzado') {
        const wmax = Math.max(s.w, s.w0) * 1.8, pts = []; let ymax = s.Amax;
        for (let j = 0; j <= 300; j++) { const w = (wmax * j) / 300; pts.push([w, s.amp(w)]); }
        ymax = Math.max(ymax, s.A, s.est) * 1.15;
        return { x: [0, wmax], y: [0, ymax], fx: (v) => f(v, 3), ejeX: 'ω (rad/s)', ejeY: 'Amplitud A (m)', series: [{ pts, color: '--serie-1' }, { tipo: 'puntos', pts: [[s.w, s.A]], color: '--serie-2', radio: 6 }], verticales: [{ x: s.w0, texto: 'ω₀' }] };
      }
      if (s.modo === 'amortiguado') {
        const tmax = s.caso === 'sub' ? Math.min(Math.max(3 * s.Td, 5 * s.tau), 12 * s.Td) : 6 * Math.max(s.tau, 1 / Math.abs(s.r1 ?? s.gm)), pts = [], sup = [], inf = [];
        let amp = Math.abs(s.x0); for (let j = 0; j <= 400; j++) { const t = (tmax * j) / 400, x = s.x(t); pts.push([t, x]); amp = Math.max(amp, Math.abs(x)); }
        if (s.caso === 'sub') { const A = Math.hypot(s.x0, s.B); for (let j = 0; j <= 100; j++) { const t = (tmax * j) / 100, e = A * Math.exp(-s.gm * t); sup.push([t, e]); inf.push([t, -e]); } amp = Math.max(amp, A); }
        return { x: [0, tmax], y: [-amp * 1.1, amp * 1.1], fx: (v) => f(v, 3), ejeX: 'Tiempo (s)', ejeY: 'Posición x (m)', series: [...(sup.length ? [{ pts: sup, color: '--muted', discontinua: true }, { pts: inf, color: '--muted', discontinua: true }] : []), { pts, color: '--serie-1' }], horizontales: [{ y: 0 }] };
      }
      const pts = [], tmax = 2 * s.T; for (let j = 0; j <= 300; j++) { const t = (tmax * j) / 300; pts.push([t, s.A * Math.cos(s.w * t + s.phi)]); }
      return { x: [0, tmax], y: [-s.A * 1.15, s.A * 1.15], fx: (v) => f(v, 3), ejeX: 'Tiempo (s)', ejeY: 'Posición x (m)', series: [{ pts, color: '--serie-1' }, { tipo: 'puntos', pts: [[Math.min(s.t, tmax), s.A * Math.cos(s.w * Math.min(s.t, tmax) + s.phi)]], color: '--serie-2', radio: 6 }], horizontales: [{ y: 0 }] };
    },
    leyenda: (s) => ({ mas: '<b>Curva</b>: x(t) = A cos(ωt + φ) durante dos periodos. <b>Punto</b>: el instante elegido.', amortiguado: s.caso === 'sub' ? '<b>Curva</b>: la posición. <b>Líneas discontinuas</b>: la envolvente e<sup>−γt</sup>, que baja aunque el cuerpo siga oscilando.' : '<b>Curva</b>: la posición. No cruza el equilibrio más de una vez.', forzado: '<b>Curva</b>: amplitud en régimen estacionario según la frecuencia de la fuerza. <b>Punto</b>: tu caso. La línea discontinua marca ω₀.' }[s.modo]),
  });
})();
