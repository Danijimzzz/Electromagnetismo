/* =====================================================================
   Interfaz de Gravitación y órbitas: lo que se calcula, los datos, la
   gráfica (la fuerza según la distancia, las velocidades orbital y de escape
   o la elipse de Kepler) y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en gravitacion/calculo.js.
   ===================================================================== */
(() => {
  const P = Gravitacion, { f } = P, fk = (v) => f(v / 1e3, 4);
  const nom = (sc) => (P.CUERPOS[sc.cuerpo] || P.CUERPOS.tierra).nom;
  const enunciado = (sc) => {
    if (sc.modo === 'fuerza') return `Dos cuerpos de ${sc.m1} kg y ${sc.m2} kg están separados ${sc.r} km entre centros. Calcula la fuerza de atracción y el campo de cada uno.`;
    if (sc.modo === 'satelite') return `Un satélite de ${sc.m} kg orbita ${nom(sc)} a ${sc.h} km de altura en órbita circular. Calcula su velocidad, su periodo y su energía.`;
    if (sc.modo === 'escape') return `Calcula la velocidad de escape a ${sc.h} km de altura sobre ${nom(sc)} y la energía necesaria para un cuerpo de ${sc.m} kg.`;
    if (sc.modo === 'periodo') return `Un satélite orbita ${nom(sc)} con un periodo de ${sc.T} h. ¿A qué distancia del centro orbita y con qué velocidad?`;
    return sc.datos === 'pa' ? `Un cuerpo orbita ${nom(sc)} con periastro ${sc.rp} km y apoastro ${sc.ra} km. Calcula el periodo y las velocidades en los extremos.` : `Un cuerpo orbita ${nom(sc)} con semieje mayor ${sc.a} km y excentricidad ${sc.e}. Calcula el periodo, las distancias extremas y las velocidades.`;
  };
  const cuerpoCampos = (sc, radio) => [{ k: 'cuerpo', nom: 'Cuerpo central', tipo: 'sel', ops: P.NOMBRES },
    ...(sc.cuerpo === 'otro' ? [{ k: 'M', nom: 'Masa M', un: 'kg' }, ...(radio ? [{ k: 'R', nom: 'Radio R', un: 'km' }] : [])] : [])];
  Calculadora.monta({
    C: P, carpeta: 'gravitacion', app: 'GravitacionApp', azar: P.azar, enunciado,
    nota: 'Se admite 5,97e24 o 5,97·10^24. G = 6,6743·10⁻¹¹ N·m²/kg². Los datos de los planetas están redondeados.',
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(P.MODOS) }];
      if (sc.modo === 'fuerza') return [...cs, { k: 'm1', nom: 'Masa 1', un: 'kg' }, { k: 'm2', nom: 'Masa 2', un: 'kg' }, { k: 'r', nom: 'Distancia entre centros', un: 'km' }];
      if (sc.modo === 'satelite') return [...cs, ...cuerpoCampos(sc, true), { k: 'h', nom: 'Altura sobre la superficie', un: 'km' }, { k: 'm', nom: 'Masa del satélite', un: 'kg' }];
      if (sc.modo === 'escape') return [...cs, ...cuerpoCampos(sc, true), { k: 'h', nom: 'Altura sobre la superficie', un: 'km' }, { k: 'm', nom: 'Masa del cuerpo', un: 'kg' }];
      if (sc.modo === 'periodo') return [...cs, ...cuerpoCampos(sc, false), { k: 'T', nom: 'Periodo T', un: 'h' }];
      return [...cs, ...cuerpoCampos(sc, false), { k: 'datos', nom: 'Datos de la órbita', tipo: 'sel', ops: [['ae', 'Semieje mayor y excentricidad'], ['pa', 'Periastro y apoastro']] },
        ...(sc.datos === 'pa' ? [{ k: 'rp', nom: 'Periastro r_p', un: 'km' }, { k: 'ra', nom: 'Apoastro r_a', un: 'km' }] : [{ k: 'a', nom: 'Semieje mayor a', un: 'km' }, { k: 'e', nom: 'Excentricidad e' }]),
        { k: 'nu', nom: 'Anomalía verdadera ν', un: '°' }];
    },
    resumen: (s) => {
      if (s.modo === 'fuerza') return [['Fuerza F', `${f(s.F, 5)} N`, true], ['Campo de la masa 1', `${f(s.g1, 4)} m/s²`], ['Campo de la masa 2', `${f(s.g2, 4)} m/s²`], ['Energía potencial U', `${f(s.U, 4)} J`]];
      if (s.modo === 'satelite') return [['Velocidad orbital', `${f(s.v, 5)} m/s`, true], ['Periodo T', P.tiempo(s.T)], ['Radio de la órbita', `${fk(s.r)} km`], ['Gravedad a esa altura', `${f(s.gh, 4)} m/s²`], ['Energía cinética', `${f(s.Ec, 4)} J`], ['Energía potencial', `${f(s.Ep, 4)} J`], ['Energía total', `${f(s.E, 4)} J`], ['Velocidad de escape', `${f(s.vesc, 5)} m/s`]];
      if (s.modo === 'escape') return [['Velocidad de escape', `${f(s.vesc, 5)} m/s`, true], ['En km/s', `${f(s.vesc / 1e3, 5)}`], ['Velocidad orbital', `${f(s.v, 5)} m/s`], ['Gravedad a esa altura', `${f(s.gh, 4)} m/s²`], ['Energía para escapar', `${f(s.E, 4)} J`]];
      if (s.modo === 'periodo') return [['Radio de la órbita', `${fk(s.r)} km`, true], ...(s.h != null ? [['Altura sobre la superficie', `${fk(s.h)} km`]] : []), ['Velocidad orbital', `${f(s.v, 5)} m/s`], ['Velocidad de escape', `${f(s.vesc, 5)} m/s`]];
      return [['Periodo T', P.tiempo(s.T), true], ['Periastro r_p', `${fk(s.rp)} km`], ['Apoastro r_a', `${fk(s.ra)} km`], ['Velocidad en el periastro', `${f(s.vp, 5)} m/s`], ['Velocidad en el apoastro', `${f(s.va, 5)} m/s`], ['Semieje mayor a', `${fk(s.a)} km`], ['Excentricidad e', f(s.e, 5)], ['Velocidad areolar', `${f(s.areal, 4)} m²/s`], [`En ν = ${f(s.nu / (Math.PI / 180), 4)}°`, `r = ${fk(s.r)} km; v = ${f(s.v, 5)} m/s`, true]];
    },
    grafica: (s) => {
      if (s.modo === 'fuerza') {
        const r0 = s.r / 1e3, pts = []; for (let j = 0; j <= 200; j++) { const rr = r0 * (0.4 + (2.6 * j) / 200); pts.push([rr, s.Fr(rr * 1e3)]); }
        return { x: [r0 * 0.4, r0 * 3], y: [0, s.Fr(s.r * 0.4) * 1.05], fx: (v) => f(v, 3), ejeX: 'Distancia r (km)', ejeY: 'Fuerza F (N)', series: [{ pts, color: '--serie-1' }, { tipo: 'puntos', pts: [[r0, s.F]], color: '--serie-2', radio: 6 }] };
      }
      if (s.modo === 'kepler') {
        const el = document.getElementById('grafica'), w = el.clientWidth || 600, h = el.clientHeight || 300, a = s.a;
        const pw = Math.max(50, w - 54), ph = Math.max(50, h - 58), xm = (-(1 + s.e) + (1 - s.e)) / 2, an = (1 - s.e) + (1 + s.e), alto = 2 * (s.b / a);
        const esc = Math.max(an / pw, alto / ph) * 1.18, mx = (pw * esc) / 2, my = (ph * esc) / 2, pts = []; // unidades de a
        for (let j = 0; j <= 360; j++) { const nu = (j * Math.PI) / 180, rr = (1 - s.e * s.e) / (1 + s.e * Math.cos(nu)); pts.push([rr * Math.cos(nu), rr * Math.sin(nu)]); }
        const rr = s.r / a;
        return { x: [xm - mx, xm + mx], y: [-my, my], fx: (v) => f(v, 2), fy: (v) => f(v, 2), ejeX: 'x / a (el cuerpo central está en el foco, en el origen)', series: [{ pts, color: '--serie-1' }, { tipo: 'puntos', pts: [[0, 0]], color: '--muted', radio: 7 }, { tipo: 'puntos', pts: [[rr * Math.cos(s.nu), rr * Math.sin(s.nu)]], color: '--serie-2', radio: 6 }, { pts: [[0, 0], [rr * Math.cos(s.nu), rr * Math.sin(s.nu)]], color: '--serie-2', grosor: 1.4, discontinua: true }], horizontales: [{ y: 0 }] };
      }
      const R = s.R || s.r / 2, r1 = s.modo === 'periodo' ? Math.max(R, s.r) : s.r, rmax = Math.max(r1 * 2.5, R * 3), rmin = s.modo === 'periodo' ? Math.min(R * 0.9, s.r * 0.5) : R, vo = [], ve = [];
      for (let j = 0; j <= 200; j++) { const r = rmin + ((rmax - rmin) * j) / 200; vo.push([r / 1e3, Math.sqrt(s.mu / r) / 1e3]); ve.push([r / 1e3, Math.sqrt((2 * s.mu) / r) / 1e3]); }
      return { x: [rmin / 1e3, rmax / 1e3], y: [0, ve[0][1] * 1.08], fx: (v) => f(v, 3), ejeX: 'Distancia al centro r (km)', ejeY: 'Velocidad (km/s)', series: [{ pts: ve, color: '--serie-2' }, { pts: vo, color: '--serie-1' }, { tipo: 'puntos', pts: [[s.r / 1e3, s.v / 1e3]], color: '--serie-1', radio: 6 }] };
    },
    leyenda: (s) => ({ fuerza: '<b>Curva</b>: F = G m₁m₂/r² según la distancia. <b>Punto</b>: tu caso. Cae con el cuadrado de la distancia.', satelite: '<b>Azul</b>: velocidad de una órbita circular a cada distancia. <b>Naranja</b>: velocidad de escape, siempre √2 veces mayor. <b>Punto</b>: tu satélite.', escape: '<b>Azul</b>: velocidad de una órbita circular a cada distancia. <b>Naranja</b>: velocidad de escape, siempre √2 veces mayor. <b>Punto</b>: la órbita circular a esa altura.', periodo: '<b>Azul</b>: velocidad de una órbita circular a cada distancia. <b>Naranja</b>: velocidad de escape. <b>Punto</b>: la órbita que da ese periodo.', kepler: '<b>Elipse</b>: la órbita, en unidades del semieje mayor, con el cuerpo central (gris) en un foco. <b>Punto naranja</b>: la posición para la anomalía ν; la línea discontinua es el radio vector.' }[s.modo]),
  });
})();
