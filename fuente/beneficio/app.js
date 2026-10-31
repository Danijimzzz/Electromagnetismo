/* =====================================================================
   Interfaz de Maximización del beneficio: el mercado (competencia o
   monopolio), los costes y la demanda o el precio; la gráfica de ingreso
   marginal, coste marginal y coste medio con el óptimo, y el desarrollo. Se
   monta con Calculadora.monta (calculadora.js); el cálculo está en
   beneficio/calculo.js.
   ===================================================================== */
(() => {
  const B = Beneficio, { f, dinero, num } = Eco;
  const ud = (x) => `${f(x, 6)} unidades`;
  Calculadora.monta({
    C: B, carpeta: 'beneficio', app: 'BeneficioApp',
    nota: 'Costes totales CT = CF + c·Q + d·Q², con coste marginal CMg = c + 2d·Q. En competencia perfecta la empresa toma el precio del mercado; en monopolio se enfrenta a la demanda P = a − b·Q (con b > 0).',
    campos: (sc) => [
      { k: 'modo', nom: 'Mercado', tipo: 'sel', ops: Object.entries(B.MODOS) },
      { k: 'cf', nom: 'Costes fijos CF', un: '€', sep: 'Costes' }, { k: 'c', nom: 'Coste variable c', un: '€/unidad' }, { k: 'd', nom: 'Coeficiente d', un: '€/unidad²', ayuda: 'cuánto crece el coste marginal con cada unidad' },
      ...(sc.modo === 'monopolio'
        ? [{ k: 'a', nom: 'Ordenada a', un: '€', sep: 'Demanda P = a − b·Q', ayuda: 'precio con el que no se vende nada' }, { k: 'b', nom: 'Pendiente b', un: '€/unidad', ayuda: 'euros que baja el precio por cada unidad más' }]
        : [{ k: 'p', nom: 'Precio de mercado p', un: '€/unidad', sep: 'Mercado' }]),
    ],
    resumen: (s) => [
      ['Cantidad óptima', s.opera ? `Q = ${ud(s.q)}` : 'No producir (Q = 0)'],
      ['Precio', `${dinero(s.pr)}`],
      ['Ingresos', dinero(s.it)], ['Costes totales', dinero(s.ct)],
      ['Beneficio', dinero(s.b), true],
      ...(s.modo === 'competencia' ? [['Precio de cierre', dinero(s.cierre)], ['Precio de beneficio nulo', dinero(s.pmin)]]
        : [['Índice de Lerner', f(s.lerner, 4)], ['Competencia: cantidad y precio', `${f(s.qc, 5)} a ${dinero(s.pc)}`], ['Pérdida de eficiencia', dinero(s.perd), true]]),
    ],
    grafica: (s) => {
      const mono = s.modo === 'monopolio', X = mono ? Math.max(s.qc, s.q) * 1.35 : Math.max(s.q, 2 * Math.sqrt(s.cf / s.d || 1), 1) * 1.5;
      const cmg = (x) => s.c + 2 * s.d * x, cme = (x) => s.cf / x + s.c + s.d * x, N = 60;
      const xs = Array.from({ length: N }, (_, i) => X * (i + 1) / N);
      const cmeMax = Math.max(s.pr, cmg(X)) * 1.15, rec = xs.filter((x) => cme(x) <= cmeMax);
      const series = [{ pts: [[0, s.c], [X, cmg(X)]], color: '--serie-2' }, { pts: rec.map((x) => [x, cme(x)]), color: '--serie-3' }];
      if (mono) series.unshift({ pts: [[0, s.a], [s.a / s.bb, 0]], color: '--serie-1', grosor: 1.6, discontinua: true }, { pts: [[0, s.a], [s.a / (2 * s.bb), 0]], color: '--serie-1' });
      else series.unshift({ pts: [[0, s.p], [X, s.p]], color: '--serie-1' });
      series.push({ pts: [[0, s.pr], [s.q, s.pr], [s.q, 0]], color: '--muted', grosor: 1, discontinua: true }, { tipo: 'puntos', pts: [[s.q, s.pr], [s.q, s.cmgq]], color: '--ink', radio: 5 });
      const etiquetas = [{ x: s.q, y: s.pr, texto: mono ? 'Pᵐ' : 'E' }, { x: X * 0.96, y: cmg(X * 0.96), texto: 'CMg', color: '--serie-2', alinea: 'right' }];
      if (mono) etiquetas.push({ x: s.a / (2 * s.bb) * 0.9, y: s.a * 0.12, texto: 'IMg', color: '--serie-1' }, { x: s.a / s.bb * 0.9, y: s.a * 0.1 + 0.001, texto: 'D', color: '--serie-1', alinea: 'right' });
      else etiquetas.push({ x: X * 0.96, y: s.p, texto: 'IMg = p', color: '--serie-1', alinea: 'right' });
      return { x: [0, X], y: [0, Math.max(s.pr, s.a ?? 0, cmg(X)) * 1.08], fx: (v) => f(v), fy: (v) => num(v, 0), ejeX: 'Cantidad Q', ejeY: 'Euros por unidad', series, etiquetas };
    },
    leyenda: (s) => `<b style="color:var(--serie-1)">Azul</b>: ${s.modo === 'monopolio' ? 'ingreso marginal IMg (y la demanda D, discontinua)' : 'ingreso marginal, igual al precio'}. <b style="color:var(--serie-2)">Rojo</b>: coste marginal CMg. <b style="color:var(--serie-3)">Violeta</b>: coste medio. El beneficio se maximiza donde IMg corta a CMg${s.opera ? ` (Q = ${f(s.q, 5)})` : ' (aquí el precio no llega al coste, así que no se produce)'}.`,
  });
})();
