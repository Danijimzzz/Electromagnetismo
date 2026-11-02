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
    campos: () => [
      { k: 'alfa', nom: 'Participación del capital α', ayuda: 'entre 0 y 1', sep: 'Tecnología' }, { k: 'A', nom: 'Productividad A' },
      { k: 's', nom: 'Tasa de ahorro s', un: '%', sep: 'Ahorro y crecimiento' }, { k: 'n', nom: 'Crecimiento de la población n', un: '%' },
      { k: 'g', nom: 'Progreso tecnológico g', un: '%' }, { k: 'd', nom: 'Depreciación δ', un: '%' },
      { k: 'k0', nom: 'Capital inicial k₀', sep: 'Simulación' }, { k: 'T', nom: 'Años a simular', un: 'años' },
    ],
    resumen: (s) => [
      ['Capital k*', f(s.k, 6)], ['Producto y*', f(s.y, 6)], ['Consumo c*', f(s.c, 6)], ['Inversión i*', f(s.inv, 6)],
      ['Ahorro de la regla de oro', tp(s.soro)], ['Consumo máximo c_oro', f(s.co, 6)],
      ['Velocidad de convergencia', `${tp(s.lambda)} al año`], ['Semivida', `${f(s.semivida, 4)} años`],
      ['Capital tras la simulación', `k(${s.T}) = ${f(s.kT, 6)}`, true],
      ['Diagnóstico', Math.abs(s.s - s.soro) < 1e-9 ? 'Justo la regla de oro' : s.sobre ? 'Ahorra de más: ineficiencia dinámica' : 'Ahorra de menos que la regla de oro', true],
    ],
    tabla: (s) => {
      const paso = Math.max(1, Math.ceil(s.T / 20)), fs = s.fila.filter((r) => r.t % paso === 0 || r.t === s.T);
      return `<table class="tabla-eco"><thead><tr><th>Año</th><th>k</th><th>y</th><th>c</th><th>Δk</th></tr></thead><tbody>${fs.map((r) => `<tr><td>${r.t}</td><td>${num(r.k, 4)}</td><td>${num(r.y, 4)}</td><td>${num(r.c, 4)}</td><td>${num(r.dk, 4)}</td></tr>`).join('')}</tbody></table>`;
    },
    grafica: (s) => {
      const X = Math.max(1.8 * s.k, 1.1 * s.k0, 1.2 * s.ko), N = 160;
      const inv = Array.from({ length: N + 1 }, (_, i) => { const k = (X * i) / N; return [k, s.s * s.prod(k)]; });
      const rep = [[0, 0], [X, s.x * X]];
      const top = Math.max(...inv.map((p) => p[1]), s.x * X * 0.8);
      return { x: [0, X], y: [0, top * 1.08], fx: (v) => f(v, 3), fy: (v) => f(v, 3), ejeX: 'Capital por trabajador efectivo k', ejeY: 'Inversión por trabajador efectivo',
        series: [{ pts: inv, color: '--serie-1' }, { pts: rep, color: '--serie-2' }, { pts: [[s.k, 0], [s.k, s.s * s.y]], color: '--muted', grosor: 1, discontinua: true },
          { tipo: 'puntos', pts: [[s.k, s.s * s.y]], color: '--ink', radio: 5 }, { tipo: 'puntos', pts: [[s.k0, s.s * s.prod(s.k0)]], color: '--serie-3', radio: 5 }],
        verticales: [{ x: s.ko, color: '--serie-3', texto: 'k oro' }],
        etiquetas: [{ x: X * 0.04, y: s.s * s.prod(X * 0.04) + top * 0.06, texto: 's·f(k)', color: '--serie-1' }, { x: X * 0.9, y: s.x * X * 0.9, texto: '(n+g+δ)·k', color: '--serie-2', alinea: 'right' }, { x: s.k, y: s.s * s.y, texto: 'k*' }] };
    },
    leyenda: (s) => `<b style="color:var(--serie-1)">Azul</b>: inversión por trabajador efectivo, s·A·kᵅ. <b style="color:var(--serie-2)">Rojo</b>: inversión de reposición, (n + g + δ)·k. Se cortan en k* = ${f(s.k, 5)}: a la izquierda la inversión supera a la reposición y el capital crece; a la derecha, baja. <b style="color:var(--serie-3)">Morado</b>: k₀ y el capital de la regla de oro (${f(s.ko, 5)}).`,
  });
})();
