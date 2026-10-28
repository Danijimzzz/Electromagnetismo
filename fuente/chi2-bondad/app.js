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
    enunciado: (sc, s) => s && (s.modo === 'independencia'
      ? `En una tabla de contingencia se han observado estas frecuencias (cada fila separada por «;»): ${tex(sc)}. Con α = ${sc.alfa}, contrasta si las dos variables son independientes: calcula χ², los grados de libertad, el valor crítico y el p-valor.`
      : s.modelo !== 'uniforme' ? `Se han observado estas frecuencias: ${tex(sc)}. Con α = ${sc.alfa}, contrasta si se ajustan a ${s.modelo === 'dadas' ? 'las proporciones dadas' : `una ${C.MODELOS[s.modelo]}`}: calcula χ², los grados de libertad, el valor crítico y el p-valor.`
      : `Al tirar un dado ${s.N} veces, cada cara ha salido estas veces: ${tex(sc)}. Con α = ${sc.alfa}, contrasta si el dado está equilibrado: calcula χ², los grados de libertad, el valor crítico y el p-valor.`),
    nota: 'En la bondad de ajuste, la hipótesis nula es el modelo; en la tabla de contingencia, que las dos variables son independientes. Cada frecuencia esperada debería ser al menos 5.',
    resumen: (s) => [
      ['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true],
      ['Estadístico', `χ² = ${f(s.chi)}`],
      ['Grados de libertad', `ν = ${s.gl}`],
      ['Valor crítico', f(s.crit)],
      ['p-valor', f(s.pv)],
      s.modo === 'independencia' ? ['V de Cramér', f(s.V, 3)] : ['Clases', String(s.celdas.length)],
    ],
    tabla: (s) => {
      if (s.modo === 'independencia') {
        const c = s.C.length, cab = ['', ...s.C.map((_, j) => `Columna ${j + 1}`), 'Total'];
        const cuerpo = s.t.map((fl, i) => fila([`Fila ${i + 1}`, ...fl.map((o, j) => `${o} <small>(${f(s.celdas[i * c + j].e)})</small>`), String(s.F[i])])).join('');
        return `<table class="tabla-eco"><thead>${fila(cab, 'th')}</thead><tbody>${cuerpo}</tbody><tfoot>${fila(['Total', ...s.C.map(String), String(s.N)])}</tfoot></table><p class="leyenda">Observadas y, entre paréntesis, esperadas si las variables fueran independientes.</p>`;
      }
      const cuerpo = s.celdas.map((x) => fila([x.nom, String(x.o), x.p.toFixed(4).replace('.', ','), `${f(x.e)}${x.e < 5 ? ' ⚠' : ''}`, f(x.c)])).join('');
      return `<table class="tabla-eco"><thead>${fila(['Clase', 'Oᵢ', 'pᵢ', 'Eᵢ = N pᵢ', '(Oᵢ − Eᵢ)²/Eᵢ'], 'th')}</thead><tbody>${cuerpo}</tbody><tfoot>${fila(['∑', String(s.N), '1', f(s.N), f(s.chi)])}</tfoot></table>`;
    },
    grafica: (s) => {
      const k = s.celdas.length, corto = (i) => (s.modo === 'independencia' ? `${s.celdas[i].i + 1}·${s.celdas[i].j + 1}` : s.celdas[i].nom.replace(/^(Clase |x = )/, ''));
      return { x: [0.4, k + 0.6], y: [0, Math.max(...s.celdas.flatMap((x) => [x.o, x.e])) * 1.12], ejeX: s.modo === 'independencia' ? 'Casilla (fila·columna)' : 'Clase', ejeY: 'Frecuencia',
        fx: (v) => (Number.isInteger(v) && v >= 1 && v <= k ? corto(v - 1) : ''),
        series: [{ tipo: 'barras', pts: s.celdas.map((x, i) => [i + 0.82, x.o]), ancho: 0.34, color: '--serie-1' }, { tipo: 'barras', pts: s.celdas.map((x, i) => [i + 1.18, x.e]), ancho: 0.34, color: '--serie-2', alfa: 0.6 }] };
    },
    leyenda: (s) => `<b style="color:var(--serie-1)">Azul</b>: frecuencias observadas O; <b style="color:var(--serie-2)">rojo</b>: esperadas E si H₀ es cierta. Cuanto más se separan, mayor es χ² = ${f(s.chi)}, que ${s.rechaza ? 'supera' : 'no supera'} el valor crítico ${f(s.crit)}.`,
  });
})();
