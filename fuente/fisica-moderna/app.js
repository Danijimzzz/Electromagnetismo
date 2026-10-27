/* =====================================================================
   Interfaz de Física moderna: lo que se calcula, los datos, la gráfica
   (la recta de Einstein del efecto fotoeléctrico, la longitud de onda de
   De Broglie frente a la velocidad, o el factor de Lorentz frente a v/c)
   y el desarrollo. Se monta con Calculadora.monta (calculadora.js); el
   cálculo está en fisica-moderna/calculo.js.
   ===================================================================== */
(() => {
  const FM = FisicaModerna, { f } = FM;
  const vel = (sc) => [{ k: 'uv', nom: 'Velocidad en', tipo: 'sel', ops: [['c', 'fracción de c (v/c)'], ['ms', 'm/s']] }, { k: 'v', nom: sc.uv === 'ms' ? 'Velocidad v' : 'v/c', un: sc.uv === 'ms' ? 'm/s' : '' }];
  const part = (sc) => [{ k: 'particula', nom: 'Partícula', tipo: 'sel', ops: Object.entries(FM.PARTICULAS).map(([k, [nom]]) => [k, nom]) }, ...(sc.particula === 'otra' ? [{ k: 'm', nom: 'Masa', un: 'kg' }] : [])];
  // γ frente a β, con el punto del caso
  const curvaGamma = (s) => {
    const ymax = Math.max(4, Math.min(s.g * 1.3, 40));
    const pts = []; for (let j = 0; j <= 300; j++) { const b = 1 - (1 - j / 300) ** 3 - 1e-7, g = FM.lorentz(b); pts.push([b, Math.min(g, ymax * 1.1)]); if (g > ymax * 1.1) break; }
    return { x: [0, 1], y: [0, ymax], fx: (v) => f(v), ejeX: 'β = v/c', ejeY: 'γ', series: [{ pts, color: '--serie-1' }, { tipo: 'puntos', pts: [[s.b, s.g]], color: '--serie-2', radio: 6 }], horizontales: [{ y: 1, texto: 'γ = 1: sin relatividad' }] };
  };
  Calculadora.monta({
    C: FM, carpeta: 'fisica-moderna', app: 'FisicaModernaApp',
    nota: 'Se admite 2,2e-6 o 2,2·10^-6. Constantes: h = 6,626·10⁻³⁴ J·s, c = 3·10⁸ m/s y e = 1,602·10⁻¹⁹ C.',
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(FM.MODOS) }];
      if (sc.modo === 'debroglie') return [...cs, ...part(sc), { k: 'dato', nom: 'Dato', tipo: 'sel', ops: [['v', 'Velocidad'], ['Ec', 'Energía cinética'], ['V', 'Tensión que la acelera']] }, ...(sc.dato === 'v' ? vel(sc) : [{ k: 'valor', nom: sc.dato === 'V' ? 'Tensión' : 'Energía cinética', un: sc.dato === 'V' ? 'V' : 'eV' }])];
      if (sc.modo === 'dilatacion') return [...cs, ...vel(sc), { k: 't0', nom: 'Tiempo propio Δt₀', un: 's' }];
      if (sc.modo === 'contraccion') return [...cs, ...vel(sc), { k: 'L0', nom: 'Longitud propia L₀', un: 'm' }];
      if (sc.modo === 'energia') return [...cs, ...part(sc), ...vel(sc)];
      return [...cs, { k: 'dato', nom: 'Dato de la luz', tipo: 'sel', ops: [['lambda', 'Longitud de onda'], ['f', 'Frecuencia'], ['E', 'Energía del fotón']] }, { k: 'valor', nom: sc.dato === 'f' ? 'Frecuencia f' : sc.dato === 'E' ? 'Energía E' : 'Longitud de onda λ', un: sc.dato === 'f' ? 'Hz' : sc.dato === 'E' ? 'eV' : 'nm' },
        { k: 'metal', nom: 'Metal', tipo: 'sel', ops: Object.entries(FM.METALES).map(([k, [nom, W]]) => [k, W ? `${nom} (${f(W)} eV)` : nom]) }, ...(sc.metal === 'otro' ? [{ k: 'W', nom: 'Trabajo de extracción W₀', un: 'eV' }] : [])];
    },
    resumen: (s) => {
      if (s.modo === 'fotoelectrico') return s.emite ? [['Energía cinética máxima', `${f(s.Ec)} eV`, true], ['Velocidad máxima', `${f(s.vmax)} m/s`], ['Potencial de frenado', `${f(s.V0)} V`], ['Energía del fotón', `${f(s.Ev)} eV`], ['Frecuencia umbral', `${f(s.f0)} Hz`]]
        : [['Electrones', 'no se arranca ninguno', true], ['Energía del fotón', `${f(s.Ev)} eV`], ['Trabajo de extracción', `${f(s.W)} eV`], ['Longitud de onda umbral', `${f(s.lam0 * 1e9)} nm`]];
      if (s.modo === 'debroglie') return [['Longitud de onda λ', `${f(s.lam)} m`, true], ['Momento lineal', `${f(s.p)} kg·m/s`], ['Velocidad', `${f(s.b)} c`]];
      if (s.modo === 'dilatacion') return [['Tiempo dilatado Δt', `${f(s.t)} s`, true], ['Factor γ', f(s.g, 5)], ['Distancia recorrida', `${f(s.d)} m`]];
      if (s.modo === 'contraccion') return [['Longitud L', `${f(s.L)} m`, true], ['Factor γ', f(s.g, 5)]];
      return [['Energía cinética', `${f(s.Ec)} J`, true], ['Energía total', `${f(s.Et)} J`], ['Energía en reposo', `${f(s.E0)} J`], ['Momento lineal', `${f(s.p)} kg·m/s`], ['Factor γ', f(s.g, 5)]];
    },
    grafica: (s) => {
      if (s.modo === 'fotoelectrico') {
        // E_c,máx = h f − W₀ frente a f (en 10¹⁴ Hz)
        const k = 1e14, x1 = Math.max(s.fr, s.f0) * 1.6 / k, Ecf = (fr) => (FM.H * fr) / FM.E - s.W;
        return { x: [0, x1], y: [0, Math.max(1, Ecf(x1 * k))], fx: (v) => f(v), ejeX: 'Frecuencia (10¹⁴ Hz)', ejeY: 'Eᴄ máx (eV)',
          series: [{ pts: [[s.f0 / k, 0], [x1, Ecf(x1 * k)]], color: '--serie-1' }, { tipo: 'puntos', pts: [[s.fr / k, Math.max(0, s.Ec)]], color: '--serie-2', radio: 6 }],
          verticales: [{ x: s.f0 / k, texto: 'f₀' }] };
      }
      if (s.modo === 'debroglie') {
        // λ = h/p frente a la velocidad, alrededor del caso
        const pts = []; for (let j = 1; j <= 60; j++) { const b = Math.min(0.99, (s.b * 3 * j) / 60), g = FM.lorentz(b); pts.push([b * FM.C, FM.H / (g * s.m * b * FM.C)]); }
        return { x: [0, pts[pts.length - 1][0]], y: [0, s.lam * 4], ejeX: 'Velocidad (m/s)', ejeY: 'λ (m)', series: [{ pts, color: '--serie-1' }, { tipo: 'puntos', pts: [[s.b * FM.C, s.lam]], color: '--serie-2', radio: 6 }] };
      }
      return curvaGamma(s);
    },
    leyenda: (s) => ({ fotoelectrico: '<b>Recta</b>: ecuación de Einstein, con pendiente h. Por debajo de f₀ no salen electrones. <b>Punto</b>: tu luz.', debroglie: '<b>Curva</b>: λ = h/p para la misma partícula a otras velocidades. <b>Punto</b>: tu caso.' }[s.modo] || '<b>Curva</b>: el factor de Lorentz γ; casi 1 hasta v ≈ 0,3c y se dispara cerca de c. <b>Punto</b>: tu caso.'),
  });
})();
