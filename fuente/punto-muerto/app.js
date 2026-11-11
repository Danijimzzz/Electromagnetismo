/* =====================================================================
   Interfaz de Punto muerto: los costes y el precio, la gráfica de ingresos
   y costes con el punto muerto, las zonas de pérdidas y beneficios y las
   ventas previstas, y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en punto-muerto/calculo.js.
   ===================================================================== */
(() => {
  const P = PuntoMuerto, { f, dinero, num } = Eco;
  const ud = (x) => `${f(x, 6)} unidades`;
  Calculadora.monta({
    C: P, carpeta: 'punto-muerto', app: 'PuntoMuertoApp', azar: P.azar, enunciado: P.enunciado,
    nota: 'Los costes fijos son los del periodo que mires (un mes, un año); las ventas previstas y el beneficio objetivo, del mismo periodo. Los dos últimos se pueden dejar vacíos.',
    campos: () => [
      { k: 'cf', nom: 'Costes fijos CF', un: '€' },
      { k: 'p', nom: 'Precio de venta p', un: '€/unidad' },
      { k: 'cv', nom: 'Coste variable unitario c<sub>v</sub>', un: '€/unidad' },
      { k: 'q', nom: 'Ventas previstas Q', un: 'unidades' },
      { k: 'objetivo', nom: 'Beneficio objetivo', un: '€' },
    ],
    resumen: (s) => [['Punto muerto', ud(s.q0)], ['Facturación en el punto muerto', dinero(s.i0)], ['Margen de contribución', `${dinero(s.m)} por unidad`],
      ...(s.q === null ? [] : [['Beneficio con Q', dinero(s.b)], ['Margen de seguridad', `${f(100 * s.ms, 4)} %`]]), ...(s.gao === null ? [] : [['Apalancamiento operativo', f(s.gao, 4)]]),
      ...(s.qObj === null ? [] : [['Ventas para el objetivo', ud(s.qObj), true]])],
    grafica: (s) => {
      const X = 1.6 * Math.max(s.q0, s.q ?? 0, s.qObj ?? 0), fy = (v) => num(v, 0);
      const it = (x) => s.p * x, ct = (x) => s.cf + s.cv * x, rect = (fn) => [[0, fn(0)], [X, fn(X)]];
      const ver = [{ x: s.q0, color: '--serie-3', texto: 'Q*' }];
      if (s.q !== null) ver.push({ x: s.q, color: '--muted', texto: 'Q' });
      return { x: [0, X], y: [0, it(X) * 1.04], fx: (v) => num(v, 0), fy, ejeX: 'Unidades vendidas Q', ejeY: 'Euros',
        series: [{ pts: rect(() => s.cf), color: '--muted', discontinua: true }, { pts: rect(ct), color: '--serie-2' }, { pts: rect(it), color: '--serie-1' }, { tipo: 'puntos', pts: [[s.q0, s.i0]], color: '--serie-3', radio: 5 }], verticales: ver };
    },
    leyenda: () => '<b>Azul</b>: ingresos, p · Q. <b>Rojo</b>: costes totales, CF + c<sub>v</sub> · Q. <b>Discontinua</b>: costes fijos. A la izquierda del <b>punto muerto</b> los costes superan a los ingresos (pérdidas); a la derecha, beneficios.',
  });
})();
