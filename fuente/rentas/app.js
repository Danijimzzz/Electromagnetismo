/* =====================================================================
   Interfaz de Rentas y anualidades: lo que se busca, el tipo de renta, los
   datos que hacen falta, la gráfica de cada término con lo que vale hoy, la
   tabla de términos y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en rentas/calculo.js (Rentas).
   ===================================================================== */
(() => {
  const R = Rentas, { f, dinero, num } = Eco;
  Calculadora.monta({
    C: R, carpeta: 'rentas', app: 'RentasApp',
    nota: 'El tipo es el efectivo anual (TAE): con términos mensuales, trimestrales o semestrales se pasa solo al tipo de cada periodo. El diferimiento se cuenta en periodos.',
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(R.MODOS) },
        { k: 'pago', nom: 'Pago de los términos', tipo: 'sel', ops: [['pos', 'Pospagable (al final)'], ['pre', 'Prepagable (al principio)']] }];
      if (sc.modo === 'va' || sc.modo === 'termino') cs.push({ k: 'duracion', nom: 'Duración', tipo: 'sel', ops: [['temporal', 'Temporal'], ['perpetua', 'Perpetua']] });
      const perpetua = sc.duracion === 'perpetua' && (sc.modo === 'va' || sc.modo === 'termino');
      if (sc.modo !== 'termino') cs.push({ k: 'c', nom: 'Término C', un: '€' });
      if (sc.modo === 'termino' && !perpetua) cs.push({ k: 'conocido', nom: 'Conozco', tipo: 'sel', ops: [['va', 'El valor actual'], ['vf', 'El valor final']] });
      if (sc.modo === 'n' || (sc.modo === 'termino' && (perpetua || sc.conocido !== 'vf'))) cs.push({ k: 'va', nom: 'Valor actual V₀', un: '€' });
      if (sc.modo === 'termino' && !perpetua && sc.conocido === 'vf') cs.push({ k: 'vf', nom: 'Valor final Vₙ', un: '€' });
      if (sc.modo !== 'n' && !perpetua) cs.push({ k: 'n', nom: 'Número de términos n' });
      cs.push({ k: 'm', nom: 'Términos', tipo: 'sel', ops: Object.entries(R.PERIODOS).map(([k, [p]]) => [k, p[0].toUpperCase() + p.slice(1) + 'es']) },
        { k: 'i', nom: 'Tipo efectivo anual', un: '%' }, { k: 'd', nom: 'Diferimiento', un: 'periodos' });
      return cs;
    },
    resumen: (s) => [
      ['Valor actual V₀', dinero(s.va)], ['Valor final Vₙ', s.vf === null ? (s.perpetua ? 'no tiene (perpetua)' : '—') : dinero(s.vf)],
      ['Término C', dinero(s.c)], ['Número de términos', s.n === null ? '∞' : f(s.n, 6)], ['Tipo de cada periodo', `${f(100 * s.ip, 6)} %`],
    ],
    tabla: (s) => `<table class="tabla-eco"><thead><tr><th>Término</th><th>Se paga en el periodo</th><th>Cuantía</th><th>Valor hoy</th></tr></thead><tbody>${s.filas.map((r) => `<tr><td>${r.k}</td><td>${r.t}</td><td>${num(r.c)}</td><td>${num(r.va)}</td></tr>`).join('')}</tbody>${s.perpetua ? '<tfoot><tr><td colspan="4">… y así para siempre (se muestran los 120 primeros)</td></tr></tfoot>' : ''}</table>`,
    grafica: (s) => {
      const fl = s.filas.slice(0, s.perpetua ? 40 : 120), tmax = Math.max(...fl.map((r) => r.t)) + 1;
      return { x: [-0.8, tmax], y: [0, s.c * 1.15], fy: (v) => num(v, 0), ejeX: `Periodo (${s.pers})`, ejeY: '€',
        series: [{ tipo: 'barras', ancho: 0.8, pts: fl.map((r) => [r.t, r.c]), color: '--serie-1', alfa: 0.35 }, { tipo: 'barras', ancho: 0.8, pts: fl.map((r) => [r.t, r.va]), color: '--serie-2' }] };
    },
    leyenda: (s) => `<b>Barra clara</b>: lo que se paga en cada periodo. <b>Barra oscura</b>: lo que vale hoy, $C (1 + i)^{−t}$; su suma es el valor actual.${s.perpetua ? ' Se dibujan los 40 primeros términos.' : ''}`.replace(/\$[^$]+\$/, (x) => Mates.html(x)),
  });
})();
