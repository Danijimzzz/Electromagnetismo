/* =====================================================================
   Interfaz de Amortización del inmovilizado: el bien, el método, la gráfica
   del valor neto contable y de las cuotas, el cuadro de amortización y el
   desarrollo. Se monta con Calculadora.monta (calculadora.js); el cálculo
   está en amortizacion-inmovilizado/calculo.js (AmortizacionInmovilizado).
   ===================================================================== */
(() => {
  const A = AmortizacionInmovilizado, { dinero, num } = Eco;
  Calculadora.monta({
    C: A, carpeta: 'amortizacion-inmovilizado', app: 'AmortizacionApp', azar: A.azar, enunciado: A.enunciado,
    nota: 'El valor residual es lo que se espera sacar del bien al final (0 si no vale nada). En el método por unidades, escribe lo usado cada año separado por espacios.',
    campos: (sc) => [
      { k: 'metodo', nom: 'Método', tipo: 'sel', ops: Object.entries(A.METODOS) },
      { k: 'v0', nom: 'Precio de adquisición', un: '€' }, { k: 'vr', nom: 'Valor residual', un: '€' },
      ...(sc.metodo === 'unidades'
        ? [{ k: 'total', nom: 'Producción total prevista', un: 'unidades, km, horas' }, { k: 'unidades', nom: 'Usado cada año', tipo: 'area', filas: 3, ayuda: 'separado por espacios' }]
        : [{ k: 'n', nom: 'Vida útil', un: 'años' }, ...(sc.metodo === 'degresivo' ? [{ k: 'coef', nom: 'Coeficiente', ayuda: '(1,5, 2 o 2,5)' }] : [])]),
    ],
    resumen: (s) => [
      ['Base amortizable', dinero(s.base)], ['Cuota del primer año', dinero(s.filas[0].c)], ['Cuota del último año', dinero(s.filas[s.filas.length - 1].c)],
      ['Valor neto contable al final', dinero(s.filas[s.filas.length - 1].vnc)],
    ],
    tabla: (s) => `<table class="tabla-eco"><thead><tr><th>Año</th><th>Cuota</th><th>Amortización acumulada</th><th>Valor neto contable</th></tr></thead><tbody><tr><td>0</td><td></td><td></td><td>${num(s.v0)}</td></tr>${s.filas.map((r) => `<tr><td>${r.k}</td><td>${num(r.c)}</td><td>${num(r.ac)}</td><td>${num(r.vnc)}</td></tr>`).join('')}</tbody><tfoot><tr><td>∑</td><td>${num(s.total)}</td><td></td><td></td></tr></tfoot></table>`,
    grafica: (s) => ({
      x: [-0.6, s.filas.length + 0.6], y: [0, s.v0 * 1.08], fy: (v) => num(v, 0), ejeX: 'Año', ejeY: '€',
      series: [{ tipo: 'barras', ancho: 0.6, pts: s.filas.map((r) => [r.k, r.c]), color: '--serie-2' }, { pts: [[0, s.v0], ...s.filas.map((r) => [r.k, r.vnc])], color: '--serie-1' }, { tipo: 'puntos', pts: [[0, s.v0], ...s.filas.map((r) => [r.k, r.vnc])], color: '--serie-1' }],
      horizontales: s.vr > 0 ? [{ y: s.vr, texto: 'Valor residual' }] : [],
    }),
    leyenda: () => '<b>Línea</b>: valor neto contable al final de cada año. <b>Barras</b>: la cuota de amortización de cada año.',
  });
})();
