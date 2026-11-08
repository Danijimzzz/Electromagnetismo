/* =====================================================================
   Interfaz del Modelo de Solow: parámetros de la economía, el diagrama de
   Solow (inversión s·f(k) frente a la reposición (n + g + δ)·k, con k* y la
   regla de oro), la tabla de la trayectoria y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en solow/calculo.js.
   ===================================================================== */
(() => {
  const S = Solow, { f, num } = Eco;
  const tp = (x) => `${f(100 * x, 5)} %`;
  Calculadora.monta({
    C: S, carpeta: 'solow', app: 'SolowApp',
    nota: 'Las tasas van en %. Todo está por trabajador efectivo: k (capital), y = A·kᵅ (producto), c (consumo). La simulación suma cada año Δk = s·y − (n + g + δ)·k.',
    campos: (sc) => [
      { k: 'alfa', nom: 'Participación del capital α', ayuda: 'entre 0 y 1', sep: 'Tecnología' }, { k: 'A', nom: 'Productividad A' },
      { k: 's', nom: 'Tasa de ahorro s', un: '%', sep: 'Ahorro y crecimiento' }, { k: 'n', nom: 'Crecimiento de la población n', un: '%' },
      { k: 'g', nom: 'Progreso tecnológico g', un: '%' }, { k: 'd', nom: 'Depreciación δ', un: '%' },
      { k: 'k0', nom: 'Capital inicial k₀', sep: 'Simulación' }, { k: 'T', nom: 'Años a simular', un: 'años' },
      { k: 'cambio', nom: 'Perturbación a mitad de camino', tipo: 'sel', sep: 'Perturbación (opcional)', ops: [['ninguno', 'Sin perturbación'], ['s', 'Cambia el ahorro s'], ['n', 'Cambia la población n'], ['g', 'Cambia el progreso técnico g'], ['d', 'Cambia la depreciación δ'], ['A', 'Cambia la productividad A']] },
      ...(sc.cambio && sc.cambio !== 'ninguno' ? [{ k: 'tc', nom: 'Año del cambio', un: 'año' }, { k: 'nuevo', nom: 'Nuevo valor', un: sc.cambio === 'A' ? '' : '%' }] : []),
    ],
    resumen: (s) => [
      ['Capital k*', f(s.k, 6)], ['Producto y*', f(s.y, 6)], ['Consumo c*', f(s.c, 6)], ['Inversión i*', f(s.inv, 6)],
      ['Ahorro de la regla de oro', tp(s.soro)], ['Consumo máximo c_oro', f(s.co, 6)],
      ['Velocidad de convergencia', `${tp(s.lambda)} al año`], ['Semivida', `${f(s.semivida, 4)} años`],
      ...(s.P2 ? [['Nuevo capital k₂*', f(s.k2, 6)], ['Nuevo consumo c₂*', f(s.c2, 6)], [`Consumo antes → justo después del año ${s.tc}`, `${f(s.cAntes, 5)} → ${f(s.cAhora, 5)}`], ['Consumo a largo plazo', `${f(s.c2, 5)} (${s.c2 > s.c ? 'sube' : s.c2 < s.c ? 'baja' : 'igual'})`]] : []),
      ['Capital tras la simulación', `k(${s.T}) = ${f(s.kT, 6)}`, true],
      ['Diagnóstico', Math.abs(s.s - s.soro) < 1e-9 ? 'Justo la regla de oro' : s.sobre ? 'Ahorra de más: ineficiencia dinámica' : 'Ahorra de menos que la regla de oro', true],
    ],
    tabla: (s) => {
      const paso = Math.max(1, Math.ceil(s.T / 20)), fs = s.fila.filter((r) => r.t % paso === 0 || r.t === s.T);
      return `<table class="tabla-eco"><thead><tr><th>Año</th><th>k</th><th>y</th><th>c</th><th>Δk</th></tr></thead><tbody>${fs.map((r) => `<tr${r.nueva ? ' class="nueva"' : ''}><td>${r.t}${r.t === s.tc ? ' (cambio)' : ''}</td><td>${num(r.k, 4)}</td><td>${num(r.y, 4)}</td><td>${num(r.c, 4)}</td><td>${num(r.dk, 4)}</td></tr>`).join('')}</tbody></table>`;
    },
    grafica: (s) => {
      const X = Math.max(1.8 * s.k, 1.1 * s.k0, 1.2 * s.ko), N = 160;
      const inv = Array.from({ length: N + 1 }, (_, i) => { const k = (X * i) / N; return [k, s.s * s.prod(k)]; });
      const rep = [[0, 0], [X, s.x * X]];
      const top = Math.max(...inv.map((p) => p[1]), s.x * X * 0.8);
      return { x: [0, X], y: [0, top * 1.08], fx: (v) => f(v, 3), fy: (v) => f(v, 3), ejeX: 'Capital por trabajador efectivo k', ejeY: 'Inversión por trabajador efectivo',
        series: [{ pts: inv, color: '--serie-1' }, { pts: rep, color: '--serie-2' },
          ...(s.P2 ? [{ pts: Array.from({ length: N + 1 }, (_, i) => { const k = (X * i) / N; return [k, s.P2.s * s.P2.A * k ** s.alfa]; }), color: '--serie-1', discontinua: true }, { pts: [[0, 0], [X, s.P2.x * X]], color: '--serie-2', discontinua: true }, { tipo: 'puntos', pts: [[s.k2, s.P2.s * s.y2]], color: '--serie-3', radio: 5 }] : []), { pts: [[s.k, 0], [s.k, s.s * s.y]], color: '--muted', grosor: 1, discontinua: true },
          { tipo: 'puntos', pts: [[s.k, s.s * s.y]], color: '--ink', radio: 5 }, { tipo: 'puntos', pts: [[s.k0, s.s * s.prod(s.k0)]], color: '--serie-3', radio: 5 }],
        verticales: [{ x: s.ko, color: '--serie-3', texto: 'k oro' }],
        etiquetas: [{ x: X * 0.04, y: s.s * s.prod(X * 0.04) + top * 0.06, texto: 's·f(k)', color: '--serie-1' }, { x: X * 0.9, y: s.x * X * 0.9, texto: '(n+g+δ)·k', color: '--serie-2', alinea: 'right' }, { x: s.k, y: s.s * s.y, texto: 'k*' }] };
    },
    grafica2: (s) => {
      const pts = s.fila.map((r) => [r.t, r.k]), ys = pts.map((p) => p[1]).concat([s.k, s.P2 ? s.k2 : s.k]);
      return { x: [0, s.T], y: Eco.rango(ys, { cero: true }), fx: (v) => f(v, 3), fy: (v) => f(v, 3), ejeX: 'Año t', ejeY: 'Capital por trabajador efectivo k',
        series: [{ pts, color: '--serie-1' }, ...(s.P2 ? [{ tipo: 'puntos', pts: [[s.tc, s.kc]], color: '--serie-3', radio: 5 }] : [])],
        horizontales: [{ y: s.k, color: '--muted', texto: s.P2 ? 'k* inicial' : 'k*' }, ...(s.P2 ? [{ y: s.k2, color: '--serie-3', texto: 'k₂*' }] : [])],
        verticales: s.P2 ? [{ x: s.tc, color: '--serie-3', texto: 'cambio' }] : [] };
    },
    leyenda2: (s) => s.P2 ? `El capital sube o baja hacia el estado estacionario inicial hasta el año ${s.tc}; ahí cambia el parámetro y empieza a moverse hacia el nuevo, k₂* = ${f(s.k2, 5)} (línea morada). El capital no salta en el cambio.` : `El capital por trabajador efectivo año a año se acerca al estado estacionario k* = ${f(s.k, 5)} (línea de puntos) cada vez más despacio.`,
    leyenda: (s) => `<b style="color:var(--serie-1)">Azul</b>: inversión por trabajador efectivo, s·A·kᵅ. <b style="color:var(--serie-2)">Rojo</b>: inversión de reposición, (n + g + δ)·k. Se cortan en k* = ${f(s.k, 5)}: a la izquierda la inversión supera a la reposición y el capital crece; a la derecha, baja. <b style="color:var(--serie-3)">Morado</b>: k₀ y el capital de la regla de oro (${f(s.ko, 5)}).`,
  });
})();
