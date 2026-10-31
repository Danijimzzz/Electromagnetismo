/* =====================================================================
   Interfaz de Costes de producción: los coeficientes de la función de
   costes, la gráfica de los costes medios y el marginal con el mínimo de
   explotación y el óptimo, y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en costes/calculo.js.
   ===================================================================== */
(() => {
  const P = Costes, { f, dinero, num } = Eco;
  const ud = (x) => `${f(x, 6)} unidades`;
  Calculadora.monta({
    C: P, carpeta: 'costes', app: 'CostesApp',
    nota: 'CT(Q) = CF + a·Q + b·Q² + c·Q³. Con b y c vacíos valen 0. Para una curva en U, b negativo y c positivo; con c = 0, b tiene que ser positivo.',
    campos: () => [
      { k: 'cf', nom: 'Costes fijos CF', un: '€', sep: 'Función de costes' },
      { k: 'a', nom: 'Coeficiente a', un: '€/unidad' },
      { k: 'b', nom: 'Coeficiente b', un: '€/unidad²' },
      { k: 'c', nom: 'Coeficiente c', un: '€/unidad³' },
      { k: 'q', nom: 'Producción Q', un: 'unidades', sep: 'Producción' },
    ],
    resumen: (s) => [['Coste variable CV', dinero(s.cv)], ['Coste total CT', dinero(s.ct)], ['Coste medio CMe', dinero(s.cme)], ['Coste variable medio', dinero(s.cvme)], ['Coste fijo medio', dinero(s.cfme)], ['Coste marginal CMg', dinero(s.cmg), true],
      ['Mínimo de explotación', `${dinero(s.pc)} en Q = ${f(s.qc, 5)}`], ['Óptimo de explotación', `${dinero(s.pm)} en Q = ${f(s.qm, 5)}`]],
    grafica: (s) => {
      const X0 = 0.1 * s.qm, X1 = Math.max(2 * s.qm, 1.15 * s.q), n = 120, pts = (fn) => Array.from({ length: n + 1 }, (_, i) => { const x = X0 + (X1 - X0) * i / n; return [x, fn(x)]; });
      const F = s.F, ym = Math.min(Math.max(F.cmg(X1), F.cme(X0)), 3 * s.pm);
      return { x: [0, X1], y: [0, ym], fx: (v) => num(v, 0), fy: (v) => num(v, 0), ejeX: 'Producción Q', ejeY: 'Euros por unidad',
        series: [{ pts: pts(F.cmg), color: '--serie-2' }, { pts: pts(F.cme), color: '--serie-1' }, { pts: pts(F.cvme), color: '--muted', discontinua: true },
          { tipo: 'puntos', pts: [[s.qm, s.pm]], color: '--serie-3', radio: 5 }, { tipo: 'puntos', pts: [[s.qc, s.pc]], color: '--serie-3', radio: 4 }],
        verticales: [{ x: s.q, color: '--muted', texto: 'Q' }] };
    },
    leyenda: () => '<b>Rojo</b>: coste marginal. <b>Azul</b>: coste medio. <b>Discontinua</b>: coste variable medio. El marginal corta al medio en su <b>mínimo (óptimo de explotación)</b> y al variable medio en el suyo (<b>mínimo de explotación</b>, punto del precio de cierre).',
  });
})();
