/* =====================================================================
   Interfaz de χ² de bondad de ajuste e independencia: el modo (bondad de
   ajuste o tabla de contingencia), el modelo y sus parámetros, la tabla de
   frecuencias observadas y esperadas, la gráfica de barras observadas
   frente a esperadas y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en chi2-bondad/calculo.js.
   ===================================================================== */
(() => {
  const C = Chi2Bondad, { f } = Calculadora;
  const AYUDA = { uniforme: 'una frecuencia observada por clase', dadas: 'una fila «observada proporción» por clase (las proporciones se normalizan: 9 3 3 1 vale)', binomial: 'una fila «x frecuencia» por valor, seguidos', poisson: 'una fila «x frecuencia» por valor, seguidos', normal: 'una fila «desde hasta frecuencia» por intervalo' };
  const SI_NO = [['si', 'Sí'], ['no', 'No']];
  function campos(sc) {
    const base = [{ k: 'modo', nom: 'Contraste', tipo: 'sel', ops: Object.entries(C.MODOS) }, { k: 'alfa', nom: 'Nivel de significación α' }];
    if (sc.modo === 'fisher') return [...base, { k: 'h1', nom: 'Hipótesis alternativa H₁', tipo: 'sel', ops: Object.entries(C.H1) }, { k: 'datos', nom: 'Tabla 2 × 2', tipo: 'area', ayuda: 'dos filas de dos números; la casilla de arriba a la izquierda es la que se compara en los unilaterales', filas: 3 }];
    if (sc.modo === 'mcnemar') return [...base, { k: 'yates', nom: 'Corrección de continuidad', tipo: 'sel', ops: SI_NO }, { k: 'metodo', nom: 'p-valor que se usa', tipo: 'sel', ops: [['chi2', 'χ² (aproximación)'], ['exacto', 'Exacto (binomial)']] }, { k: 'datos', nom: 'Tabla 2 × 2 de los pares', tipo: 'area', ayuda: 'filas: antes sí / antes no; columnas: después sí / después no', filas: 3 }];
    if (sc.modo === 'independencia') return [...base, { k: 'yates', nom: 'Corrección de Yates', tipo: 'sel', ops: SI_NO, ayuda: 'solo en tablas 2 × 2' }, { k: 'datos', nom: 'Tabla de contingencia', tipo: 'area', ayuda: 'una fila por línea, columnas separadas por espacios', filas: 5 }];
    const m = C.MODELOS[sc.modelo] ? sc.modelo : 'uniforme', dist = ['binomial', 'poisson', 'normal'].includes(m), est = sc.estima !== 'no';
    return [...base, { k: 'modelo', nom: 'Modelo de H₀', tipo: 'sel', ops: Object.entries(C.MODELOS) },
      ...(m === 'binomial' ? [{ k: 'nb', nom: 'Número de pruebas n' }] : []),
      ...(dist ? [{ k: 'estima', nom: 'Parámetros', tipo: 'sel', ops: [['si', 'Estimados de los datos'], ['no', 'Dados']] }] : []),
      ...(dist && !est ? { binomial: [{ k: 'pb', nom: 'Probabilidad de éxito p' }], poisson: [{ k: 'lambda', nom: 'Media λ' }], normal: [{ k: 'mu', nom: 'Media μ' }, { k: 'sigma', nom: 'Desviación típica σ' }] }[m] : []),
      { k: 'agrupa', nom: 'Juntar clases con E < 5', tipo: 'sel', ops: SI_NO },
      { k: 'datos', nom: 'Frecuencias observadas', tipo: 'area', ayuda: AYUDA[m], filas: 7 }];
  }
  // un dado o una tabla 2 × 3 al azar, para el modo práctica
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    if (Math.random() < 0.5) return { modo: 'bondad', modelo: 'uniforme', alfa: '0,05', agrupa: 'no', datos: Array.from({ length: 6 }, () => e(12, 30)).join('\n') };
    return { modo: 'independencia', alfa: '0,05', yates: 'no', datos: [0, 1].map(() => Array.from({ length: 3 }, () => e(10, 50)).join(' ')).join('\n') };
  }
  const tex = (sc) => String(sc.datos || '').trim().split(/\r?\n/).map((l) => l.trim().split(/\s+/).join(', ')).join('; ');
  const fila = (cs, td = 'td') => `<tr>${cs.map((c) => `<${td}>${c}</${td}>`).join('')}</tr>`;
  Calculadora.monta({
    C, carpeta: 'chi2-bondad', app: 'Chi2BondadApp', campos, azar,
    enunciado: (sc, s) => s && (s.modo === 'fisher' || s.modo === 'mcnemar' ? `Resuelve el contraste ${s.modo === 'fisher' ? 'exacto de Fisher' : 'de McNemar'} con la tabla ${tex(sc)} (cada fila separada por «;») y α = ${sc.alfa}: calcula el p-valor.`
      : s.modo === 'independencia'
      ? `En una tabla de contingencia se han observado estas frecuencias (cada fila separada por «;»): ${tex(sc)}. Con α = ${sc.alfa}, contrasta si las dos variables son independientes: calcula χ², los grados de libertad, el valor crítico y el p-valor.`
      : s.modelo !== 'uniforme' ? `Se han observado estas frecuencias: ${tex(sc)}. Con α = ${sc.alfa}, contrasta si se ajustan a ${s.modelo === 'dadas' ? 'las proporciones dadas' : `una ${C.MODELOS[s.modelo]}`}: calcula χ², los grados de libertad, el valor crítico y el p-valor.`
      : `Al tirar un dado ${s.N} veces, cada cara ha salido estas veces: ${tex(sc)}. Con α = ${sc.alfa}, contrasta si el dado está equilibrado: calcula χ², los grados de libertad, el valor crítico y el p-valor.`),
    nota: 'En la bondad de ajuste, la hipótesis nula es el modelo; en la tabla de contingencia, que las dos variables son independientes. Cada frecuencia esperada debería ser al menos 5.',
    resumen: (s) => s.modo === 'fisher' ? [['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true], ['p-valor exacto', f(s.pv)], ['P(X = k) observada', f(s.obs)], ['Odds ratio muestral', s.or === Infinity ? '∞' : f(s.or)], ['Valores posibles de k', `${s.lo} a ${s.hi}`], ...(s.pocos ? [['Aviso', `${s.pocos === 1 ? 'Una casilla tiene' : s.pocos + ' casillas tienen'} frecuencia esperada menor que 5: el χ² no valdría, por eso se usa el test exacto.`, true]] : [])]
      : s.modo === 'mcnemar' ? [['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true], ['Discordantes b y c', `${s.b} y ${s.c}`], ['Estadístico', `χ² = ${f(s.chi)}`], ['p-valor (χ²)', f(s.pChi)], ['p-valor exacto', f(s.pEx)], ['Se usa', s.usaEx ? 'El exacto' : 'El χ²']]
        : [
      ['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true],
      ['Estadístico', `χ² = ${f(s.chi)}`],
      ['Grados de libertad', `ν = ${s.gl}`],
      ['Valor crítico', f(s.crit)],
      ['p-valor', f(s.pv)],
      s.modo === 'independencia' ? ['V de Cramér', f(s.V, 3)] : ['Clases', String(s.celdas.length)],
      ...(s.modo === 'independencia' ? [['Casillas con |residuo| > 2', s.mayores.length ? s.mayores.map((x) => `fila ${x.i + 1}, col. ${x.j + 1}`).join('; ') : 'Ninguna', true]] : []),
    ],
    tabla: (s) => {
      if (s.modo === 'fisher') return `<table class="tabla-eco"><caption>Tabla observada</caption><thead>${fila(['', 'Columna 1', 'Columna 2', 'Total'], 'th')}</thead><tbody>${fila(['Fila 1', s.t[0][0], s.t[0][1], s.t[0][0] + s.t[0][1]])}${fila(['Fila 2', s.t[1][0], s.t[1][1], s.t[1][0] + s.t[1][1]])}</tbody></table><table class="tabla-eco" style="margin-top:14px"><caption>Probabilidad de cada valor de la casilla (1, 1)</caption><thead>${fila(['k', 'P(X = k)', 'P(X ≤ k)', 'P(X ≥ k)'], 'th')}</thead><tbody>${s.dist.map(([k, q]) => fila([`${k}${k === s.n11 ? ' (observado)' : ''}`, f(q), f(s.dist.filter(([j]) => j <= k).reduce((a, [, v]) => a + v, 0)), f(s.dist.filter(([j]) => j >= k).reduce((a, [, v]) => a + v, 0))])).join('')}</tbody></table>`;
      if (s.modo === 'mcnemar') return `<table class="tabla-eco"><caption>Pares antes y después</caption><thead>${fila(['', 'Después: sí', 'Después: no', 'Total'], 'th')}</thead><tbody>${fila(['Antes: sí', s.A, `${s.b} (b)`, s.A + s.b])}${fila(['Antes: no', `${s.c} (c)`, s.d, s.c + s.d])}</tbody><tfoot>${fila(['Total', s.A + s.c, s.b + s.d, s.N])}</tfoot></table>`;
      if (s.modo === 'independencia') {
        const c = s.C.length, cab = ['', ...s.C.map((_, j) => `Columna ${j + 1}`), 'Total'];
        const cuerpo = s.t.map((fl, i) => fila([`Fila ${i + 1}`, ...fl.map((o, j) => `${o} <small>(${f(s.celdas[i * c + j].e)})</small>`), String(s.F[i])])).join('');
        return `<table class="tabla-eco"><thead>${fila(cab, 'th')}</thead><tbody>${cuerpo}</tbody><tfoot>${fila(['Total', ...s.C.map(String), String(s.N)])}</tfoot></table><p class="leyenda">Observadas y, entre paréntesis, esperadas si las variables fueran independientes.</p>` + `<table class="tabla-eco" style="margin-top:14px"><caption>Residuos tipificados (fuera de ±2 pesan de más)</caption><thead>${fila(['', ...s.C.map((_, j) => `Columna ${j + 1}`)], 'th')}</thead><tbody>${s.t.map((fl, i) => fila([`Fila ${i + 1}`, ...fl.map((_, j) => { const x = s.celdas[i * c + j]; return `${f(x.rs)}${x.marca ? ' ⚑ (más de lo esperado)'.replace('más de', x.rs > 0 ? 'más de' : 'menos de') : ''}`; })])).join('')}</tbody></table>`;
      }
      const cuerpo = s.celdas.map((x) => fila([x.nom, String(x.o), x.p.toFixed(4).replace('.', ','), `${f(x.e)}${x.e < 5 ? ' ⚠' : ''}`, f(x.c)])).join('');
      return `<table class="tabla-eco"><thead>${fila(['Clase', 'Oᵢ', 'pᵢ', 'Eᵢ = N pᵢ', '(Oᵢ − Eᵢ)²/Eᵢ'], 'th')}</thead><tbody>${cuerpo}</tbody><tfoot>${fila(['∑', String(s.N), '1', f(s.N), f(s.chi)])}</tfoot></table>`;
    },
    grafica: (s) => {
      if (s.modo === 'fisher') return { x: [s.lo - 0.6, s.hi + 0.6], y: [0, Math.max(...s.dist.map((q) => q[1])) * 1.15], ejeX: 'k: casos en la casilla (1, 1)', ejeY: 'Probabilidad', fx: (v) => (Number.isInteger(v) && v >= s.lo && v <= s.hi ? String(v) : ''), series: [{ tipo: 'barras', pts: s.dist.filter(([k]) => k !== s.n11).map(([k, q]) => [k, q]), ancho: 0.6, color: '--serie-1', alfa: 0.55 }, { tipo: 'barras', pts: s.dist.filter(([k]) => k === s.n11).map(([k, q]) => [k, q]), ancho: 0.6, color: '--serie-2' }] };
      if (s.modo === 'mcnemar') return { x: [0.4, 2.6], y: [0, Math.max(s.b, s.c) * 1.2 + 0.5], ejeX: 'Pares discordantes', ejeY: 'Individuos', fx: (v) => (v === 1 ? 'b: sí → no' : v === 2 ? 'c: no → sí' : ''), series: [{ tipo: 'barras', pts: [[1, s.b]], ancho: 0.6, color: '--serie-1' }, { tipo: 'barras', pts: [[2, s.c]], ancho: 0.6, color: '--serie-2' }], horizontales: [{ y: s.n / 2, color: '--muted', texto: '(b + c)/2 si H₀' }] };
      const k = s.celdas.length, corto = (i) => (s.modo === 'independencia' ? `${s.celdas[i].i + 1}·${s.celdas[i].j + 1}` : s.celdas[i].nom.replace(/^(Clase |x = )/, ''));
      return { x: [0.4, k + 0.6], y: [0, Math.max(...s.celdas.flatMap((x) => [x.o, x.e])) * 1.12], ejeX: s.modo === 'independencia' ? 'Casilla (fila·columna)' : 'Clase', ejeY: 'Frecuencia',
        fx: (v) => (Number.isInteger(v) && v >= 1 && v <= k ? corto(v - 1) : ''),
        series: [{ tipo: 'barras', pts: s.celdas.map((x, i) => [i + 0.82, x.o]), ancho: 0.34, color: '--serie-1' }, { tipo: 'barras', pts: s.celdas.map((x, i) => [i + 1.18, x.e]), ancho: 0.34, color: '--serie-2', alfa: 0.6 }] };
    },
    leyenda: (s) => s.modo === 'fisher' ? `Cada barra es la probabilidad (con los márgenes fijos y H₀ cierta) de que la casilla (1, 1) valga k; la <b style="color:var(--serie-2)">roja</b> es la observada (k = ${s.n11}). El p-valor ${s.h1 === 'mayor' ? 'suma las barras desde la observada hacia la derecha' : s.h1 === 'menor' ? 'suma las barras desde la observada hacia la izquierda' : 'suma las barras que no son más altas que la roja'}: ${f(s.pv)}.`
      : s.modo === 'mcnemar' ? `Solo cuentan los individuos que cambian: b (de sí a no, azul) y c (de no a sí, rojo). Si H₀ es cierta, los dos cambios son igual de probables y las dos barras deberían ser parecidas (b + c = ${s.n}).`
        : `<b style="color:var(--serie-1)">Azul</b>: frecuencias observadas O; <b style="color:var(--serie-2)">rojo</b>: esperadas E si H₀ es cierta. Cuanto más se separan, mayor es χ² = ${f(s.chi)}, que ${s.rechaza ? 'supera' : 'no supera'} el valor crítico ${f(s.crit)}.`,
  });
})();
