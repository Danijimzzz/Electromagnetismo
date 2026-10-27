/* =====================================================================
   Interfaz de Regresión sobre datos económicos: los datos (una fila «x y»),
   el modelo, los nombres de las variables, la predicción, la nube de puntos
   con la recta o la curva estimada y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en
   regresion-economia/calculo.js (RegresionEconomia).
   ===================================================================== */
(() => {
  const R = RegresionEconomia, { f, num } = Eco;
  // una serie al azar alrededor de una recta, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), n = ent(6, 8), b = ent(5, 9) / 10, a = ent(1, 5);
    const datos = Array.from({ length: n }, (_, i) => { const x = 10 + 5 * i; return `${x} ${num(a + b * x + (Math.random() - 0.5) * 1.2, 1)}`; }).join('\n');
    return { modelo: 'lineal', nx: 'Renta disponible', ny: 'Consumo', datos, x0: String(10 + 5 * n), nivel: '95' };
  }
  Eco.monta({
    C: R, carpeta: 'regresion-economia', app: 'RegresionEconomiaApp', azar,
    enunciado: (sc) => `Con los datos de renta y consumo de la tabla, estima la función de consumo por mínimos cuadrados: la propensión marginal a consumir, el consumo autónomo, el R², la elasticidad en la media y el consumo para una renta de ${sc.x0}.`,
    nota: 'Una observación por fila: el valor de X y el de Y separados por espacios, tabuladores o «;» (puedes pegarlos de una hoja de cálculo). La coma es decimal. Se salta una primera fila con nombres.',
    campos: (sc) => [
      { k: 'modelo', nom: 'Modelo', tipo: 'sel', ops: Object.entries(R.MODELOS).map(([k, m]) => [k, m.nombre]) },
      { k: 'nx', nom: 'Variable X', tipo: 'texto' },
      { k: 'ny', nom: 'Variable Y', tipo: 'texto' },
      { k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'una fila «x y» por observación', filas: 8 },
      { k: 'x0', nom: `Predecir para ${(sc.nx || 'X').trim() || 'X'} =`, sep: 'Predicción y contraste' },
      { k: 'nivel', nom: 'Nivel de confianza', un: '%' },
    ],
    resumen: (s) => [
      [s.modelo === 'loglog' ? 'Elasticidad β̂₁' : s.modelo === 'loglin' ? 'Pendiente β̂₁ (de ln Y)' : 'Efecto marginal β̂₁', f(s.b)],
      ['Constante β̂₀', f(s.a)],
      ['R²', s.r2.toFixed(4).replace('.', ',')],
      s.modelo === 'loglin' ? ['Crecimiento por unidad de X', `${f(100 * s.crec)} %`] : s.modelo === 'lineal' ? ['Elasticidad en la media', f(s.elast)] : ['R² ajustado', s.r2aj.toFixed(4).replace('.', ',')],
      ['p-valor de β̂₁', Estadistica.prob(s.pval)],
      ...(s.y0 === null ? [] : [[`${s.ny[0].toUpperCase() + s.ny.slice(1)} estimado`, f(s.y0)]]),
    ],
    grafica: (s) => {
      const xs = s.pts.map((q) => q.x), x = Eco.rango([...xs, ...(s.x0 === null ? [] : [s.x0])]), curva = [];
      for (let i = 0; i <= 120; i++) { const v = x[0] + ((x[1] - x[0]) * i) / 120; if (s.modelo !== 'loglog' || v > 0) curva.push([v, s.pred(v)]); }
      return {
        x, y: Eco.rango([...s.pts.map((q) => q.y), ...(s.y0 === null ? [] : [s.y0])]), ejeX: s.nx[0].toUpperCase() + s.nx.slice(1), ejeY: s.ny[0].toUpperCase() + s.ny.slice(1), fx: (v) => (Math.abs(v) >= 1000 && Number.isInteger(v) && v < 3000 ? String(v) : Herramienta.txt(f(v))),
        series: [{ pts: curva, color: '--serie-2' }, { pts: s.pts.map((q) => [q.x, q.y]), tipo: 'puntos', color: '--serie-1' }, ...(s.y0 === null ? [] : [{ pts: [[s.x0, s.y0]], tipo: 'puntos', color: '--serie-3', radio: 6 }])],
      };
    },
    leyenda: (s) => `<b>Puntos</b>: las ${s.n} observaciones. <b>Línea</b>: ${s.modelo === 'lineal' ? 'la recta estimada' : 'la curva estimada, deshaciendo el logaritmo'}.${s.y0 === null ? '' : ' <b>Punto grande</b>: la predicción.'}`,
  });
})();
