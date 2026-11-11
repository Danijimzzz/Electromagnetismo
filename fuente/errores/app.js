/* =====================================================================
   Interfaz de Propagación de errores: la fórmula y sus variables (con sus
   correlaciones), una serie de medidas o varias medidas con su error (media
   ponderada), la comparación con el valor aceptado, el resultado redondeado, la tabla de derivadas
   parciales, la gráfica de lo que aporta cada variable (o de las medidas
   con su media y su banda de error) y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en errores/calculo.js.
   ===================================================================== */
(() => {
  const C = Errores, { f } = Calculadora;
  // un péndulo, un cilindro o una ley de Ohm con medidas al azar, para el modo práctica
  function azar() {
    const r = (a, b, d) => (a + Math.random() * (b - a)).toFixed(d).replace('.', ','), t = Math.floor(Math.random() * 3);
    if (t === 0) return { modo: 'formula', nombre: 'g', f: '4 pi^2 l / T^2', vars: `l ${r(0.5, 1.5, 3)} 0,001\nT ${r(1.5, 2.4, 3)} ${['0,002', '0,005', '0,01'][Math.floor(Math.random() * 3)]}`, metodo: 'cuadratica', unidad: 'm/s²' };
    if (t === 1) return { modo: 'formula', nombre: 'R', f: 'V / I', vars: `V ${r(3, 24, 1)} 0,1\nI ${r(0.1, 0.9, 3)} 0,005`, metodo: 'cuadratica', unidad: 'Ω' };
    return { modo: 'formula', nombre: 'ρ', f: 'm / (a b c)', vars: `m ${r(20, 80, 2)} 0,01\na ${r(2, 4, 2)} 0,02\nb ${r(2, 4, 2)} 0,02\nc ${r(1, 3, 2)} 0,02`, metodo: 'cuadratica', unidad: 'g/cm³' };
  }
  Calculadora.monta({
    C, carpeta: 'errores', app: 'ErroresApp', azar,
    enunciado: (sc, s) => s && s.modo === 'formula' ? Mates.html(`Se calcula $${s.nom} = ${Expresion.texto(s.ast)}$ con ${s.vs.map((q) => `$${q.n} = ${f(q.v, 6)} ± ${f(q.d, 3)}$`).join(', ')}. Halla ${s.nom}, su incertidumbre (errores independientes) y el error relativo, y escribe el resultado bien redondeado.`) : 'Con las medidas de la izquierda, halla la media, el error y el resultado redondeado.',
    nota: 'En las variables, una fila por variable con su nombre (una letra), su valor y su incertidumbre: «l 1,250 0,002» o «T = 2,006 ± 0,005». En la fórmula, pi es π y e es el número e; escribe los productos con espacios o *: 4 pi^2 l / T^2.',
    campos: (sc) => sc.modo === 'ponderada' ? [
      { k: 'modo', nom: 'Calcular el error de', tipo: 'sel', ops: Object.entries(C.MODOS) },
      { k: 'nombre', nom: 'Magnitud', tipo: 'texto', ayuda: 'su símbolo' },
      { k: 'pond', nom: 'Medidas', tipo: 'area', ayuda: 'una por fila: valor e incertidumbre', filas: 5 },
      { k: 'unidad', nom: 'Unidad', tipo: 'texto', ayuda: 'opcional' },
      { sep: 'Comparar con el valor aceptado (opcional)' },
      { k: 'acept', nom: 'Valor aceptado' }, { k: 'dacept', nom: 'Su incertidumbre', ayuda: 'si la tiene' },
    ] : sc.modo === 'medidas' ? [
      { k: 'modo', nom: 'Calcular el error de', tipo: 'sel', ops: Object.entries(C.MODOS) },
      { k: 'nombre', nom: 'Magnitud', tipo: 'texto', ayuda: 'su símbolo' },
      { k: 'datos', nom: 'Medidas', tipo: 'area', ayuda: 'separadas por espacios', filas: 4 },
      { k: 'inst', nom: 'Error del aparato', ayuda: 'su resolución' },
      { k: 'k', nom: 'Factor de cobertura k', ayuda: '1 por defecto' },
      { k: 'unidad', nom: 'Unidad', tipo: 'texto', ayuda: 'opcional' },
      { sep: 'Comparar con el valor aceptado (opcional)' },
      { k: 'acept', nom: 'Valor aceptado' }, { k: 'dacept', nom: 'Su incertidumbre', ayuda: 'si la tiene' },
    ] : [
      { k: 'modo', nom: 'Calcular el error de', tipo: 'sel', ops: Object.entries(C.MODOS) },
      { k: 'nombre', nom: 'Magnitud', tipo: 'texto', ayuda: 'su símbolo' },
      { k: 'f', nom: 'Fórmula', tipo: 'texto' },
      { k: 'vars', nom: 'Variables', tipo: 'area', ayuda: 'nombre, valor e incertidumbre', filas: 4 },
      { k: 'metodo', nom: 'Cómo se combinan', tipo: 'sel', ops: Object.entries(C.METODOS) },
      ...(sc.metodo === 'lineal' ? [] : [{ k: 'corr', nom: 'Correlaciones', tipo: 'area', ayuda: 'opcional: «l T 0,8» o «cov l T 0,00002»', filas: 2 }]),
      { k: 'unidad', nom: 'Unidad', tipo: 'texto', ayuda: 'opcional' },
      { sep: 'Comparar con el valor aceptado (opcional)' },
      { k: 'acept', nom: 'Valor aceptado' }, { k: 'dacept', nom: 'Su incertidumbre', ayuda: 'si la tiene' },
    ],
    resumen: (s) => [
      ['Resultado', `${s.nom} = (${s.R.txt})${s.un}`, true],
      [s.modo === 'medidas' ? 'Media' : s.modo === 'ponderada' ? 'Media ponderada' : `Valor de ${s.nom}`, f(s.v, 6)], [`Incertidumbre Δ${s.nom}`, f(s.d, 3)], ['Error relativo', `${f(100 * s.rel, 3)} %`],
      ...(s.modo === 'medidas' ? [['Desviación típica s', f(s.s, 3)], ['Error de la media s/√n', f(s.sm, 3)]] : []),
      ...(s.modo === 'ponderada' ? [['χ² reducido', f(s.red, 4)], ['σ de la media (1/√∑w)', f(s.dInt, 3)], ['Media sin pesos', f(s.simple, 6)]] : []),
      ...(s.modo === 'formula' && s.cors.length ? [['Si fueran independientes', `Δ${s.nom} = ${f(s.dIndep, 3)}`]] : []),
      ...(s.comp ? [['Discrepancia con el aceptado', `${f(s.comp.dif, 3)}${s.un} (${f(s.comp.relPct, 3)} %)`], ['En incertidumbres', `${f(s.comp.z, 3)} σ: ${s.comp.nivel}`]] : []),
    ],
    tabla: (s) => s.modo === 'medidas' ? '' : s.modo === 'ponderada' ? `<table class="tabla-eco"><thead><tr><th>Medida</th><th>Valor</th><th>σ</th><th>Peso 1/σ²</th><th>Peso</th><th>(x − x̄)/σ</th></tr></thead><tbody>${s.ms.map((q, i) => `<tr><td>${i + 1}</td><td>${f(q.x, 6)}</td><td>${f(q.d, 3)}</td><td>${f(q.w, 4)}</td><td>${f(100 * q.peso, 3)} %</td><td>${f(q.z, 3)}</td></tr>`).join('')}</tbody></table>` : `<table class="tabla-eco"><thead><tr><th>Variable</th><th>Valor</th><th>Δ</th><th>∂${s.nom}/∂x</th><th>|∂${s.nom}/∂x|·Δx</th><th>Peso</th></tr></thead><tbody>${s.vs.map((q) => `<tr><td>${q.n}</td><td>${f(q.v, 6)}</td><td>${f(q.d, 3)}</td><td>${f(q.dv, 5)}</td><td>${f(q.c, 4)}</td><td>${f(100 * q.peso, 3)} %</td></tr>`).join('')}</tbody></table>`,
    grafica: (s) => {
      if (s.modo === 'medidas') {
        const ys = [...s.xs, s.m - s.d, s.m + s.d], y = Calculadora.rango(ys, { aire: 0.2 });
        return { x: [0.5, s.n + 0.5], y, ejeX: 'número de medida', ejeY: s.nom, fx: (v) => (Number.isInteger(v) ? String(v) : ''),
          series: [{ tipo: 'area', pts: [[0.5, s.m + s.d], [s.n + 0.5, s.m + s.d]], base: s.m - s.d, color: '--serie-1', alfa: 0.15 }, { tipo: 'puntos', pts: s.xs.map((x, i) => [i + 1, x]), color: '--serie-2' }],
          horizontales: [{ y: s.m, color: '--serie-1', texto: `x̄ = ${f(s.m, 5)}` }, { y: s.m + s.d, color: '--muted' }, { y: s.m - s.d, color: '--muted' }] };
      }
      if (s.modo === 'ponderada') {
        const ys = [...s.ms.flatMap((q) => [q.x - q.d, q.x + q.d]), s.m - s.d, s.m + s.d, ...(s.comp ? [s.comp.v0] : [])], y = Calculadora.rango(ys, { aire: 0.15 });
        return { x: [0.5, s.n + 0.5], y, ejeX: 'número de medida', ejeY: s.nom, fx: (v) => (Number.isInteger(v) ? String(v) : ''),
          series: [{ tipo: 'area', pts: [[0.5, s.m + s.d], [s.n + 0.5, s.m + s.d]], base: s.m - s.d, color: '--serie-1', alfa: 0.15 }, { tipo: 'puntos', pts: s.ms.map((q, i) => [i + 1, q.x]), color: '--serie-2' }],
          horizontales: [{ y: s.m, color: '--serie-1', texto: `x̄ = ${f(s.m, 5)}` }, ...(s.comp ? [{ y: s.comp.v0, color: '--serie-3', texto: 'aceptado' }] : [])] };
      }
      const nombres = s.vs.map((q) => q.n);
      return { x: [0.4, s.vs.length + 0.6], y: [0, 100], ejeY: `% de ${s.met === 'lineal' ? 'la cota' : 'Δ' + s.nom + '²'}`, fx: (v) => (Number.isInteger(v) ? nombres[v - 1] || '' : ''), fy: (v) => `${f(v)} %`,
        series: [{ tipo: 'barras', ancho: 0.6, pts: s.vs.map((q, i) => [i + 1, 100 * q.peso]), color: '--serie-1' }] };
    },
    // barras de error de cada medida en la media ponderada
    despues: (r, s, col) => {
      if (s.modo !== 'ponderada') return;
      const { g, X, Y } = r; g.strokeStyle = col['--serie-2'] || col['--ink']; g.lineWidth = 1.6;
      s.ms.forEach((q, i) => { const x = X(i + 1); g.beginPath(); g.moveTo(x, Y(q.x - q.d)); g.lineTo(x, Y(q.x + q.d)); g.moveTo(x - 5, Y(q.x - q.d)); g.lineTo(x + 5, Y(q.x - q.d)); g.moveTo(x - 5, Y(q.x + q.d)); g.lineTo(x + 5, Y(q.x + q.d)); g.stroke(); });
    },
    datosExporta: (s) => (s.modo === 'ponderada' ? { cab: ['Medida', 'Valor', 'Incertidumbre', 'Peso (%)'], filas: s.ms.map((q, i) => [i + 1, q.x, q.d, 100 * q.peso]) } : null),
    leyenda: (s) => s.modo === 'ponderada' ? `Cada <b>punto</b> es una medida con su barra de error; la <b>franja</b> es la media ponderada con su incertidumbre${s.comp ? ' y la línea discontinua, el valor aceptado' : ''}.` : s.modo === 'medidas' ? 'Cada <b>punto</b> es una medida; la <b>franja</b> va de x̄ − Δ a x̄ + Δ.' : `Lo que aporta cada variable a ${s.met === 'lineal' ? 'la cota lineal' : 'la incertidumbre al cuadrado'}: la barra más alta es la medida que más conviene mejorar.`,
  });
})();
