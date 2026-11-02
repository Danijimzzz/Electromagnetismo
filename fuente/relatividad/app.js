/* =====================================================================
   Interfaz de Cinemática relativista: lo que se calcula, los datos, el
   diagrama de Minkowski (o la curva de composición de velocidades) y el
   desarrollo. Se monta con Calculadora.monta (calculadora.js); el cálculo
   está en relatividad/calculo.js.
   ===================================================================== */
(() => {
  const R = Relatividad, { f } = R;
  const enunciado = (sc) => {
    if (sc.modo === 'lorentz') return `Un sistema S′ se mueve a ${sc.v}c respecto de S. Un evento ocurre en x = ${sc.x}, t = ${sc.t} (${R.UNIDADES[sc.unidades]?.nom}). Calcula sus coordenadas en S′.`;
    if (sc.modo === 'velocidades') return sc.caso === 'relativa' ? `Un objeto va a ${sc.u}c respecto de S y S′ va a ${sc.v}c respecto de S. ¿Qué velocidad tiene el objeto en S′?` : `Una nave va a ${sc.v}c respecto de la Tierra y lanza un objeto a ${sc.u}c respecto de ella. ¿Qué velocidad tiene respecto de la Tierra?`;
    return `Dos eventos ocurren en (x₁, t₁) = (${sc.x1}, ${sc.t1}) y (x₂, t₂) = (${sc.x2}, ${sc.t2}), en ${R.UNIDADES[sc.unidades]?.nom}. Calcula el intervalo y di de qué tipo es.`;
  };
  const unidades = { k: 'unidades', nom: 'Unidades de x y t', tipo: 'sel', ops: Object.entries(R.UNIDADES).map(([k, u]) => [k, u.nom]) };
  Calculadora.monta({
    C: R, carpeta: 'relatividad', app: 'RelatividadApp', azar: R.azar, enunciado,
    nota: 'Las velocidades se dan como fracción de c (0,6 es el 60 % de la velocidad de la luz); se admite 0,6 o 6e-1. Las posiciones se miden en una unidad de longitud y los tiempos en la unidad de tiempo que da c = 1 (años y años-luz, o segundos y segundos-luz).',
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(R.MODOS) }];
      if (sc.modo === 'velocidades') return [...cs, { k: 'caso', nom: 'Caso', tipo: 'sel', ops: [['compone', 'Suma: objeto lanzado desde una nave'], ['relativa', 'Resta: velocidad en otro sistema']] },
        { k: 'u', nom: sc.caso === 'relativa' ? 'Velocidad u del objeto en S' : 'Velocidad u respecto de la nave', un: 'c' }, { k: 'v', nom: sc.caso === 'relativa' ? 'Velocidad v de S′ respecto de S' : 'Velocidad v de la nave', un: 'c' }];
      if (sc.modo === 'intervalo') return [...cs, unidades, { sep: 'Evento 1' }, { k: 'x1', nom: 'Posición x₁' }, { k: 't1', nom: 'Instante t₁' }, { sep: 'Evento 2' }, { k: 'x2', nom: 'Posición x₂' }, { k: 't2', nom: 'Instante t₂' }];
      return [...cs, unidades, { k: 'v', nom: 'Velocidad v de S′ respecto de S', un: 'c' }, { sep: 'Evento en S' }, { k: 'x', nom: 'Posición x' }, { k: 't', nom: 'Instante t' }];
    },
    resumen: (s) => {
      if (s.modo === 'lorentz') return [['Factor γ', f(s.g, 6), true], [`x′`, `${f(s.xp, 6)} ${s.U.L}`], [`t′`, `${f(s.tp, 6)} ${s.U.T}`], ['Intervalo s²', `${f(s.s2, 5)} ${s.U.L}²`], ['Tipo de evento', { temporal: 'tipo tiempo', espacial: 'tipo espacio', luz: 'tipo luz' }[s.tipo]]];
      if (s.modo === 'velocidades') return [[s.rel ? 'Velocidad en S′' : 'Velocidad respecto de la Tierra', `${f(s.w, 6)} c`, true], ['Suma de Galileo', `${f(s.gal, 6)} c`], ['Factor γ', f(s.g, 6)], ['Rapideces φ_u, φ_v', `${f(s.fu, 4)} y ${f(s.fv, 4)}`], ['Rapidez del resultado', f(s.fw, 5)]];
      return [['Intervalo s²', `${f(s.s2, 6)} ${s.U.L}²`, true], ['Tipo', { temporal: 'tipo tiempo', espacial: 'tipo espacio', luz: 'tipo luz' }[s.tipo]], ['Δx', `${f(s.dx, 6)} ${s.U.L}`], ['Δt', `${f(s.dt, 6)} ${s.U.T}`],
        ...(s.tau !== null ? [['Tiempo propio Δτ', `${f(s.tau, 6)} ${s.U.T}`], ['Sistema donde coinciden en el lugar', `β = ${f(s.beta, 5)}`]] : []), ...(s.d !== null ? [['Distancia propia', `${f(s.d, 6)} ${s.U.L}`], ['Sistema donde son simultáneos', `β = ${f(s.beta, 5)}`]] : [])];
    },
    grafica: (s) => {
      if (s.modo === 'velocidades') {
        const sg = s.rel ? -1 : 1, pts = [], gal = [];
        for (let j = 0; j <= 200; j++) { const u = -0.999 + (1.998 * j) / 200; pts.push([u, (u + sg * s.v) / (1 + sg * u * s.v)]); gal.push([u, u + sg * s.v]); }
        const ym = Math.max(1.2, Math.abs(s.gal) * 1.1, 1 + Math.abs(s.v));
        return { x: [-1, 1], y: [-ym, ym], fx: (v) => f(v, 2), fy: (v) => f(v, 2), ejeX: 'Velocidad u (en unidades de c)', ejeY: s.rel ? 'Velocidad en S′ (c)' : 'Velocidad respecto de la Tierra (c)', series: [{ pts: gal, color: '--muted', discontinua: true }, { pts, color: '--serie-1' }, { tipo: 'puntos', pts: [[s.u, s.w]], color: '--serie-2', radio: 6 }], horizontales: [{ y: 1, texto: 'c' }, { y: -1 }], verticales: [{ x: 0 }] };
      }
      const lorentz = s.modo === 'lorentz', U = s.U;
      // coordenadas del diagrama: relativas al primer evento en «intervalo», del origen en «lorentz»
      const ex = lorentz ? s.x : s.dx, ect = lorentz ? s.ct : s.dct, b = lorentz ? s.b : 0;
      const Rg = Math.max(1, Math.abs(ex), Math.abs(ect), lorentz ? Math.abs(s.xp) : 0, lorentz ? Math.abs(s.ctp) : 0) * 1.25;
      const luz = [{ pts: [[-Rg, -Rg], [Rg, Rg]], color: '--muted', discontinua: true }, { pts: [[-Rg, Rg], [Rg, -Rg]], color: '--muted', discontinua: true }];
      const series = [...luz];
      const etiquetas = [{ x: ex, y: ect, texto: lorentz ? 'Evento' : 'Evento 2', color: '--serie-2' }];
      if (lorentz) {
        const c0 = s.ct - b * s.x, d0 = s.x - b * s.ct, g = s.g;
        series.push({ pts: [[-b * Rg, -Rg], [b * Rg, Rg]], color: '--serie-1' }, { pts: [[-Rg, -b * Rg], [Rg, b * Rg]], color: '--serie-1' },
          { pts: [[-Rg, -b * Rg + c0], [Rg, b * Rg + c0]], color: '--serie-2', discontinua: true, grosor: 1.4 }, { pts: [[-b * Rg + d0, -Rg], [b * Rg + d0, Rg]], color: '--serie-2', discontinua: true, grosor: 1.4 });
        etiquetas.push({ x: b * Rg * 0.9, y: Rg * 0.9, texto: 'c t′', color: '--serie-1' }, { x: Rg * 0.8, y: b * Rg * 0.8, texto: 'x′', color: '--serie-1' });
        void g;
      } else {
        const hip = [], hip2 = [], m = Math.abs(s.s2);
        for (let j = 0; j <= 160; j++) { const a = -Rg + (2 * Rg * j) / 160, r = Math.sqrt(m + a * a); if (s.tipo === 'temporal') { hip.push([a, r]); hip2.push([a, -r]); } else if (s.tipo === 'espacial') { hip.push([r, a]); hip2.push([-r, a]); } }
        if (hip.length) series.push({ pts: hip, color: '--serie-1', discontinua: true, grosor: 1.4 }, { pts: hip2, color: '--serie-1', discontinua: true, grosor: 1.4 });
        series.push({ pts: [[0, 0], [ex, ect]], color: '--serie-2', grosor: 1.8 }, { tipo: 'puntos', pts: [[0, 0]], color: '--serie-1', radio: 6 });
        etiquetas.push({ x: 0, y: 0, texto: 'Evento 1', color: '--serie-1', alinea: 'right' });
      }
      series.push({ tipo: 'puntos', pts: [[ex, ect]], color: '--serie-2', radio: 6 });
      if (lorentz) series.push({ tipo: 'puntos', pts: [[0, 0]], color: '--ink', radio: 4 });
      return { x: [-Rg, Rg], y: [-Rg, Rg], fx: (v) => f(v, 3), fy: (v) => f(v, 3), ejeX: lorentz ? `x (${U.L})` : `Δx (${U.L})`, ejeY: lorentz ? `c t (${U.L})` : `c Δt (${U.L})`, series, verticales: [{ x: 0 }], horizontales: [{ y: 0 }], etiquetas };
    },
    leyenda: (s) => s.modo === 'velocidades' ? '<b>Curva azul</b>: la velocidad compuesta según u. <b>Discontinua</b>: la suma de Galileo. <b>Punto</b>: tu caso. La curva nunca pasa de ±c.' : s.modo === 'lorentz'
      ? '<b>Ejes cuadrados</b>: S (x y c t). <b>Líneas azules inclinadas</b>: los ejes x′ y c t′ de S′. <b>Rayas rojas</b>: paralelas a los ejes de S′ por el evento, que dan x′ y c t′. <b>Rayas grises</b>: la luz, a 45°.'
      : '<b>Punto azul</b>: evento 1, en el origen. <b>Punto rojo</b>: evento 2. <b>Rayas grises</b>: el cono de luz del evento 1. <b>Rayas azules</b>: los puntos con el mismo intervalo s² que el evento 2.',
  });
})();
