/* =====================================================================
   Interfaz de Interés simple y compuesto: lo que se busca, el régimen, los
   datos que hacen falta para eso, la gráfica del capital con interés simple
   y compuesto, la tabla año a año y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en interes/calculo.js.
   ===================================================================== */
(() => {
  const I = Interes, { f, dinero, num } = Eco;
  const tp = (x) => `${f(100 * x, 6)} %`;
  const periodos = { k: 'm', nom: 'Capitalización', tipo: 'sel', ops: Object.entries(I.PERIODOS).map(([k, v]) => [k, v[0].toUpperCase() + v.slice(1)]) };
  Calculadora.monta({
    C: I, carpeta: 'interes', app: 'InteresApp',
    nota: 'Los tipos van en % anual (TIN) y el tiempo en años: 9 meses son 0,75 años. Se admite coma decimal.',
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(I.MODOS) }];
      if (sc.modo === 'tae') return [...cs, { k: 'conocido', nom: 'Conozco', tipo: 'sel', ops: [['tin', 'El TIN'], ['tae', 'La TAE']] }, sc.conocido === 'tae' ? { k: 'tae', nom: 'TAE', un: '%' } : { k: 'i', nom: 'TIN', un: '% anual' }, periodos];
      cs.push({ k: 'regimen', nom: 'Régimen', tipo: 'sel', ops: [['compuesto', 'Compuesto'], ['simple', 'Simple']] });
      if (sc.modo !== 'inicial') cs.push({ k: 'c0', nom: 'Capital inicial C₀', un: '€' });
      if (sc.modo !== 'final') cs.push({ k: 'cn', nom: 'Capital final Cₙ', un: '€' });
      if (sc.modo !== 'tipo') cs.push({ k: 'i', nom: 'Tipo de interés (TIN)', un: '% anual' });
      if (sc.modo !== 'tiempo') cs.push({ k: 't', nom: 'Tiempo', un: 'años' });
      if (sc.regimen !== 'simple') cs.push(periodos);
      return cs;
    },
    resumen: (s) => (s.modo === 'tae'
      ? [['TIN', tp(s.tin)], ['TAE', tp(s.tae)], ['Tipo de cada periodo', tp(s.tin / s.m)]]
      : [['Capital inicial C₀', dinero(s.c0)], ['Capital final Cₙ', dinero(s.cn)], ['Intereses', dinero(s.I)],
        s.modo === 'tipo' ? ['Tipo de interés', tp(s.i)] : s.modo === 'tiempo' ? ['Tiempo', `${f(s.t, 5)} años`] : ['TAE', s.tae === null ? '—' : tp(s.tae)]]),
    tabla: (s) => (s.filas.length ? `<table class="tabla-eco"><thead><tr><th>Año</th><th>Simple</th><th>Compuesto</th><th>Intereses del año (compuesto)</th></tr></thead><tbody>${s.filas.map((r, k) => `<tr><td>${f(r.t, 4)}</td><td>${num(r.s)}</td><td>${num(r.c)}</td><td>${k ? num(r.c - s.filas[k - 1].c) : '—'}</td></tr>`).join('')}</tbody></table>` : ''),
    grafica: (s) => {
      if (s.modo === 'tae') {
        // un capital de 100 € durante un año con capitalización anual (TAE) y por periodos (TIN/m), escalonado
        const esc = [];
        for (let k = 0; k < s.m; k++) { const v = 100 * (1 + s.tin / s.m) ** k; esc.push([k / s.m, v], [(k + 1) / s.m, v]); }
        esc.push([1, 100 * (1 + s.tae)]);
        return { x: [0, 1], y: [100, 100 * (1 + s.tae) * 1.005], series: [{ pts: [[0, 100], [1, 100 * (1 + s.tin)]], color: '--serie-1', discontinua: true }, { pts: esc, color: '--serie-2' }], ejeX: 'Años', ejeY: 'Capital de 100 €' };
      }
      const T = Math.max(s.t, 1e-9), pts = (fn) => Array.from({ length: 121 }, (_, k) => [(T * k) / 120, fn((T * k) / 120)]);
      const fy = (v) => num(v, Math.abs(v) >= 100 ? 0 : 2);
      return { x: [0, T], y: Eco.rango([s.c0, s.cnS, s.cnC]), fy, ejeX: 'Años', ejeY: 'Capital (€)', series: [{ pts: pts((x) => s.c0 * (1 + s.i * x)), color: '--serie-1' }, { pts: pts((x) => s.c0 * (1 + s.i / s.m) ** (s.m * x)), color: '--serie-2' }, { pts: [[s.t, s.cn]], tipo: 'puntos', color: '--serie-3', radio: 5 }] };
    },
    leyenda: (s) => (s.modo === 'tae' ? 'Un capital de 100 € durante un año: <b>a trozos</b>, sumando los intereses de cada periodo (acaba en la TAE); <b>discontinua</b>, el TIN sin capitalizar.' : '<b>Recta azul</b>: interés simple. <b>Curva roja</b>: interés compuesto. <b>Punto</b>: el resultado.'),
  });
})();
