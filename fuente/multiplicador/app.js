/* =====================================================================
   Interfaz del Multiplicador keynesiano: los datos del modelo renta-gasto,
   la cruz keynesiana (recta de 45° y demanda agregada, antes y después de
   un cambio de gasto o de impuestos), las rondas del multiplicador y el
   desarrollo. Se monta con Calculadora.monta (calculadora.js); el cálculo
   está en multiplicador/calculo.js.
   ===================================================================== */
(() => {
  const P = Multiplicador, { f, dinero, num } = Eco;
  Calculadora.monta({
    C: P, carpeta: 'multiplicador', app: 'MultiplicadorApp', azar: P.azar, enunciado: P.enunciado,
    nota: 'C = C0 + c·(Y − T), T = T0 + t·Y y M = M0 + m·Y. Dejar vacíos T0, t, X, M0, m, ΔG y ΔT0 equivale a 0. Con el pleno empleo se calcula la brecha y el gasto que la cierra (opcional).',
    campos: () => [
      { k: 'c0', nom: 'Consumo autónomo C<sub>0</sub>', un: '€', sep: 'Consumo' },
      { k: 'c', nom: 'Propensión marginal a consumir c', un: '0 a 1' },
      { k: 'i', nom: 'Inversión I', un: '€', sep: 'Gasto' },
      { k: 'g', nom: 'Gasto público G', un: '€' },
      { k: 'x', nom: 'Exportaciones X', un: '€' },
      { k: 't0', nom: 'Impuestos fijos T<sub>0</sub>', un: '€', sep: 'Impuestos e importaciones' },
      { k: 't', nom: 'Tipo impositivo t', un: '0 a 1' },
      { k: 'm0', nom: 'Importaciones autónomas M<sub>0</sub>', un: '€' },
      { k: 'm', nom: 'Propensión marginal a importar m', un: '0 a 1' },
      { k: 'dg', nom: 'Variación del gasto ΔG', un: '€', sep: 'Política fiscal' },
      { k: 'dt0', nom: 'Variación de impuestos ΔT<sub>0</sub>', un: '€' },
      { k: 'yp', nom: 'Renta de pleno empleo Y<sub>p</sub>', un: '€' },
    ],
    resumen: (s) => [['Renta de equilibrio Y*', dinero(s.y), true], ['Multiplicador del gasto k', f(s.k, 5)], ['Multiplicador de impuestos fijos', f(s.kt, 5)], ['Presupuesto equilibrado', f(s.keq, 5)],
      ['Consumo C', dinero(s.cons)], ['Ahorro privado S', dinero(s.ahorro)], ['Impuestos T', dinero(s.T)], ['Importaciones M', dinero(s.imp)], ['Saldo público T − G', dinero(s.saldoPublico)], ['Saldo exterior X − M', dinero(s.saldoExterior)],
      ...(s.da_ === 0 ? [] : [['Variación de la renta ΔY', dinero(s.dy)], ['Nueva renta de equilibrio', dinero(s.y2), true]]),
      ...(s.brecha === null ? [] : [['Brecha de producción', dinero(s.brecha)], ['ΔG que la cierra', dinero(s.dgNec)], ...(s.dtNec === null ? [] : [['ΔT₀ que la cierra', dinero(s.dtNec)]])])],
    tabla: (s) => (s.rondas.length ? `<table class="tabla-eco"><thead><tr><th>Ronda</th><th>Gasto nuevo</th><th>Aumento acumulado de la renta</th></tr></thead><tbody>${s.rondas.map((r) => `<tr><td>${r.r + 1}</td><td>${num(r.inc)}</td><td>${num(r.ac)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td></td><td>${num(s.dy)}</td></tr></tfoot></table>` : ''),
    grafica: (s) => {
      const top = Math.max(s.y, s.y2) * 1.3, da = (A, v) => A + s.b * v, rect = (fn) => [[0, fn(0)], [top, fn(top)]];
      const hay = s.da_ !== 0, ym = Math.max(top, da(s.a, top), hay ? da(s.a2, top) : 0);
      const series = [{ pts: [[0, 0], [top, top]], color: '--muted', discontinua: true }, { pts: rect((v) => da(s.a, v)), color: '--serie-1' }];
      if (hay) series.push({ pts: rect((v) => da(s.a2, v)), color: '--serie-2' });
      series.push({ tipo: 'puntos', pts: [[s.y, s.y]], color: '--serie-1', radio: 5 });
      if (hay) series.push({ tipo: 'puntos', pts: [[s.y2, s.y2]], color: '--serie-2', radio: 5 });
      const ver = [{ x: s.y, color: '--serie-1', texto: 'Y*' }]; if (hay) ver.push({ x: s.y2, color: '--serie-2', texto: "Y'" });
      if (s.yp !== null) ver.push({ x: s.yp, color: '--serie-3', texto: 'Yp' });
      return { x: [0, top], y: [0, Math.min(ym, top * 1.1)], fx: (v) => num(v, 0), fy: (v) => num(v, 0), ejeX: 'Renta Y', ejeY: 'Demanda agregada DA', series, verticales: ver };
    },
    leyenda: (s) => `<b>Discontinua</b>: la recta de 45° (producción = demanda). <b>Azul</b>: demanda agregada DA = A + b·Y, con pendiente b = ${f(s.b, 4)}; se cruza con la de 45° en la <b>renta de equilibrio</b>.${s.da_ === 0 ? '' : ' <b>Rojo</b>: la demanda tras el cambio de gasto o de impuestos, que desplaza el equilibrio ΔA·k.'}`,
  });
})();
