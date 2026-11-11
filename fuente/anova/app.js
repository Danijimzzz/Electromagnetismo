/* =====================================================================
   Interfaz de ANOVA de uno y dos factores: los datos (un grupo por línea o
   una casilla «A / B: valores» por línea), el nivel de significación, la
   prueba principal, las comparaciones por parejas y los contrastes; la
   tabla ANOVA, los supuestos, las medias con su intervalo, las parejas, los
   contrastes y una gráfica (los puntos de cada grupo o las líneas de la
   interacción), con el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en anova/calculo.js.
   ===================================================================== */
(() => {
  const C = Anova, { f } = Calculadora, pr = Estadistica.prob;
  const des = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const fila = (cs, td = 'td') => `<tr>${cs.map((c, i) => (td === 'th' ? `<th scope="col">${c}</th>` : `<${td}>${c}</${td}>`)).join('')}</tr>`;
  const tabla = (cap, cab, cuerpo, pie = '', estilo = '') => `<table class="tabla-eco"${estilo ? ` style="${estilo}"` : ''}><caption>${cap}</caption><thead>${fila(cab, 'th')}</thead><tbody>${cuerpo}</tbody>${pie ? `<tfoot>${pie}</tfoot>` : ''}</table>`;
  const si = (b) => (b ? 'No' : 'Sí');
  // tres grupos al azar con medias algo separadas, para el modo práctica
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), base = e(10, 30), sep = e(0, 4);
    const datos = ['A', 'B', 'C'].map((n, i) => `${n}: ${Array.from({ length: 5 }, () => base + i * sep + e(-3, 3)).join(' ')}`).join('\n');
    return { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'no', contrastes: '', datos };
  }
  const lineas = (sc) => String(sc.datos || '').trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join('; ');
  const parejasTabla = (cap, ps, alfa, post) => tabla(cap, ['Pareja', 'Diferencia', `IC ${f(100 * (1 - alfa))} %`, post === 'scheffe' ? 'F' : post === 'tukey' || post === 'gh' ? 'q' : 't', post === 'holm' ? 'p (Holm)' : post === 'bonferroni' ? 'p (Bonferroni)' : 'p ajustado', '¿Medias distintas?'],
    ps.map((p) => fila([`${p.a} − ${p.b}`, f(p.dif), isFinite(p.lo) ? `(${f(p.lo)}; ${f(p.hi)})` : '—', f(p.est), pr(p.p), p.sig ? 'Sí, diferentes' : 'No'])).join(''), '', 'margin-top:14px');
  Calculadora.monta({
    C, carpeta: 'anova', app: 'AnovaApp', campos: (sc) => {
      const dos = sc.modo === 'dos';
      return [
        { k: 'modo', nom: 'Tipo de ANOVA', tipo: 'sel', ops: Object.entries(C.MODOS) },
        { k: 'alfa', nom: 'Nivel de significación α' },
        ...(dos ? [
          { k: 'nomA', nom: 'Nombre del factor A', tipo: 'texto' },
          { k: 'nomB', nom: 'Nombre del factor B', tipo: 'texto' },
          { k: 'post', nom: 'Comparaciones de niveles', tipo: 'sel', ops: C.POST_DOS.map((k) => [k, C.POST[k]]) },
          { k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'una casilla por línea: nivel A / nivel B: valores separados por espacios (las mismas repeticiones en todas)', filas: 9 },
        ] : [
          { k: 'prueba', nom: 'Prueba principal', tipo: 'sel', ops: Object.entries(C.PRUEBA) },
          { k: 'post', nom: 'Comparaciones por parejas', tipo: 'sel', ops: Object.entries(C.POST) },
          { k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'un grupo por línea, con su nombre antes de «:» si quieres; valores separados por espacios', filas: 7 },
          { k: 'contrastes', nom: 'Contrastes planificados (opcional)', tipo: 'area', ayuda: 'uno por línea, «nombre: coeficientes» en el orden de los grupos; tienen que sumar 0, por ejemplo 2 −1 −1', filas: 3 },
        ]),
      ];
    }, azar,
    // «Usar en…»: los mismos grupos en Kruskal-Wallis (sin suponer normalidad) y todos los datos juntos en Descriptiva
    usarEn: (s, sc) => (s.modo !== 'uno' ? [] : [
      { texto: 'Kruskal-Wallis con estos grupos →', carpeta: 'no-parametricos', estado: { tipo: 'kw', alfa: sc.alfa, post: 'holm', datos: sc.datos } },
      { texto: 'Descriptiva de todos los datos →', carpeta: 'descriptiva', estado: { formato: 'lista', datos: s.g.flatMap((q) => q.x).map((v) => String(v).replace('.', ',')).join(' '), pesos: '', div: 'n1', pk: '' } },
    ]),
    enunciado: (sc, s) => s && (s.modo === 'dos'
      ? `Se ha medido una variable en un diseño con dos factores (cada casilla separada por «;»): ${lineas(sc)}. Con α = ${sc.alfa}, haz un ANOVA de dos factores y calcula, para el factor A, F y su p-valor.`
      : `Se han medido tres o más grupos (cada grupo separado por «;»): ${lineas(sc)}. Con α = ${sc.alfa}, contrasta con un ANOVA de un factor si las medias son iguales: calcula la tabla ANOVA, F, el valor crítico y el p-valor.`),
    nota: 'La hipótesis nula es que todas las medias son iguales. Se supone independencia, residuos aproximadamente normales y varianzas parecidas: la herramienta lo comprueba (Levene y Shapiro-Wilk) y avisa si no se cumple.',
    resumen: (s) => {
      if (s.modo === 'dos') {
        const r = s.ef.flatMap((e) => [[`${e.nom}`, `F = ${f(e.F)}; ${e.sig ? 'significativo' : 'no significativo'}`, true], [`p-valor de ${e.nom}`, f(e.p)]]);
        return [['Decisión', s.rechaza ? 'Hay algún efecto significativo' : 'Ningún efecto es significativo', true], ...r, ['Grados de libertad del error', String(s.glE)], ['Residuos normales (Shapiro-Wilk)', s.sh && isFinite(s.sh.p) ? si(s.sh.p < s.alfa) : 'No se puede comprobar'], ['Varianzas iguales (Levene)', s.lev && isFinite(s.lev.p) ? si(s.lev.p < s.alfa) : 'No se puede comprobar'], ...(s.avisos.length ? [['Avisos', s.avisos.join(' '), true]] : [])];
      }
      return [
        ['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true],
        [s.usaW ? 'Estadístico (Welch)' : 'Estadístico', `F = ${f(s.Fp)}`],
        ['Grados de libertad', s.usaW ? `${s.g1} y ${f(s.g2)}` : `${s.glB} y ${s.glW}`],
        ['Valor crítico', f(s.crit)],
        ['p-valor', f(s.p)],
        ['η² (tamaño del efecto)', f(s.eta2, 3)],
        ['ω² (menos sesgado)', f(s.om2, 3)],
        ['Varianzas iguales (Levene)', s.sup.levene && isFinite(s.sup.levene.p) ? si(s.sup.levene.p < s.alfa) : 'No se puede comprobar'],
        ['Residuos normales (Shapiro-Wilk)', s.sup.shapiro && isFinite(s.sup.shapiro.p) ? si(s.sup.shapiro.p < s.alfa) : 'No se puede comprobar'],
        ...(s.avisos.length ? [['Avisos', s.avisos.join(' '), true]] : []),
      ];
    },
    tabla: (s) => {
      if (s.modo === 'dos') {
        const ano = tabla('Tabla ANOVA de dos factores', ['Fuente', 'Suma de cuadrados', 'g. l.', 'Cuadrado medio', 'F', 'p-valor', 'η² parcial', 'ω² parcial'],
          s.ef.map((e) => fila([e.nom, f(e.SS), String(e.gl), f(e.MS), f(e.F), pr(e.p), f(e.eta2p, 3), f(e.om2p, 3)])).join('') + fila([s.repl ? 'Error' : 'Error (interacción)', f(s.repl ? s.SSE : s.SSAB), String(s.glE), f(s.MSE), '', '', '', '']),
          fila(['Total', f(s.SST), String(s.N - 1), '', '', '', '', '']));
        const cel = tabla('Medias de las casillas', [`${s.nomA} \\ ${s.nomB}`, ...s.B, 'Media'], s.A.map((u, i) => fila([u, ...s.M[i].map((v) => f(v)), f(s.mA[i])])).join('') + fila(['Media', ...s.mB.map((v) => f(v)), f(s.mg)]), '', 'margin-top:14px');
        const sup = tabla('Supuestos', ['Prueba', 'Estadístico', 'p-valor', '¿Se cumple?'], (s.sh && isFinite(s.sh.W) ? fila(['Normalidad de los residuos (Shapiro-Wilk)', `W = ${f(s.sh.W, 4)}`, pr(s.sh.p), s.sh.p < s.alfa ? 'No' : 'Sí']) : '') + (s.lev && isFinite(s.lev.W) ? fila(['Varianzas iguales entre casillas (Levene, mediana)', `W = ${f(s.lev.W)}`, pr(s.lev.p), s.lev.p < s.alfa ? 'No' : 'Sí']) : '') || fila(['No se puede comprobar con un dato por casilla', '', '', '']), '', 'margin-top:14px');
        return ano + cel + sup + (s.paresA.length ? parejasTabla(`Comparaciones de los niveles de «${s.nomA}»`, s.paresA, s.alfa, s.post) : '') + (s.paresB.length ? parejasTabla(`Comparaciones de los niveles de «${s.nomB}»`, s.paresB, s.alfa, s.post) : '');
      }
      const ano = tabla('Tabla ANOVA', ['Fuente', 'Suma de cuadrados', 'g. l.', 'Cuadrado medio', 'F', 'p-valor'], fila(['Entre grupos', f(s.SSB), String(s.glB), f(s.MSB), f(s.F), pr(s.pvF)]) + fila(['Dentro de los grupos', f(s.SSW), String(s.glW), f(s.MSW), '', '']), fila(['Total', f(s.SST), String(s.N - 1), '', '', '']));
      const gr = tabla('Datos de cada grupo', ['Grupo', 'n', 'Media', 'Desv. típica', `IC ${f(100 * (1 - s.alfa))} % de la media`], s.g.map((q) => fila([q.nom, String(q.n), f(q.m), f(q.s), `(${f(q.lo)}; ${f(q.hi)})`])).join(''), '', 'margin-top:14px');
      const v = s.sup, sup = tabla('Supuestos del ANOVA', ['Prueba', 'Estadístico', 'p-valor', '¿Se cumple?'],
        (v.levene && isFinite(v.levene.W) ? fila(['Varianzas iguales (Levene, mediana)', `W = ${f(v.levene.W)}`, pr(v.levene.p), v.levene.p < s.alfa ? 'No' : 'Sí']) : '')
        + (v.bartlett && isFinite(v.bartlett.B) ? fila(['Varianzas iguales (Bartlett)', `B = ${f(v.bartlett.B)}`, pr(v.bartlett.p), v.bartlett.p < s.alfa ? 'No' : 'Sí']) : '')
        + (v.shapiro && isFinite(v.shapiro.W) ? fila(['Residuos normales (Shapiro-Wilk)', `W = ${f(v.shapiro.W, 4)}`, pr(v.shapiro.p), v.shapiro.p < s.alfa ? 'No' : 'Sí']) : '')
        + (s.wel ? fila(['F de Welch', `F* = ${f(s.wel.F)} (${s.wel.gl1} y ${f(s.wel.gl2)} g. l.)`, pr(s.wel.p), s.wel.p < s.alfa ? 'Medias distintas' : 'Sin diferencias']) : ''), '', 'margin-top:14px');
      const pa = s.pares.length ? parejasTabla('Comparaciones por parejas', s.pares, s.alfa, s.post) : '';
      const co = s.contr.length ? tabla('Contrastes planificados', ['Contraste', 'Coeficientes', 'Valor ψ', 'Error típico', 't', 'p-valor', `IC ${f(100 * (1 - s.alfa))} %`], s.contr.map((c) => fila([c.nom, c.c.map((v) => f(v)).join('; '), f(c.psi), f(c.ee), f(c.t), pr(c.p), `(${f(c.lo)}; ${f(c.hi)})`])).join(''), '', 'margin-top:14px') : '';
      return ano + gr + sup + pa + co;
    },
    grafica: (s) => {
      if (s.modo === 'dos') {
        const todos = s.M.flat(), lo = Math.min(...todos), hi = Math.max(...todos), aire = (hi - lo || 1) * 0.15, a = s.a;
        const cols = ['--serie-1', '--serie-2', '--serie-3'];
        return { x: [0.5, a + 0.9], y: [lo - aire, hi + aire], ejeX: s.nomA, ejeY: 'Media', fx: (v) => (Number.isInteger(v) && v >= 1 && v <= a ? des(s.A[v - 1]) : ''),
          series: s.B.flatMap((nm, j) => [{ pts: s.A.map((_, i) => [i + 1, s.M[i][j]]), color: cols[j % 3], grosor: 2.5 }, { tipo: 'puntos', pts: s.A.map((_, i) => [i + 1, s.M[i][j]]), color: cols[j % 3], radio: 4 }]),
          etiquetas: s.B.map((nm, j) => ({ x: a, y: s.M[a - 1][j], texto: des(nm), color: cols[j % 3] })) };
      }
      const todos = s.g.flatMap((q) => q.x), lo = Math.min(...todos), hi = Math.max(...todos), aire = (hi - lo || 1) * 0.12, k = s.k;
      return { x: [0.4, k + 0.6], y: [lo - aire, hi + aire], ejeX: 'Grupo', ejeY: 'Valor', fx: (v) => (Number.isInteger(v) && v >= 1 && v <= k ? des(s.g[v - 1].nom) : ''),
        series: [...s.g.map((q, i) => ({ tipo: 'puntos', pts: q.x.map((v, j) => [i + 1 + (j - (q.n - 1) / 2) * 0.05, v]), color: '--serie-1', radio: 4 })),
          ...s.g.map((q, i) => ({ pts: [[i + 0.7, q.m], [i + 1.3, q.m]], color: '--serie-2', grosor: 3 }))],
        horizontales: [{ y: s.media, color: '--muted' }] };
    },
    leyenda: (s) => {
      if (s.modo === 'dos') return `Cada línea es un nivel de «${s.nomB}» (su nombre está al final de la línea) y recorre los niveles de «${s.nomA}»: si las líneas son casi paralelas no hay interacción; si se cruzan o se abren, el efecto de un factor depende del otro (${s.inter ? `aquí la interacción ${s.inter.sig ? 'es' : 'no es'} significativa, p = ${pr(s.inter.p)}` : 'sin repeticiones no se puede contrastar'}). Los valores exactos están en la tabla de medias.`;
      return `<b style="color:var(--serie-1)">Azul</b>: los datos de cada grupo; <b style="color:var(--serie-2)">rojo</b>: su media; línea discontinua: la media global ${f(s.media)}. Cuanto más separadas están las medias respecto de la dispersión de dentro de cada grupo, mayor es F = ${f(s.F)}, que ${s.F > s.critF ? 'supera' : 'no supera'} el valor crítico clásico. Las medias y su dispersión, grupo a grupo, están en la tabla.`;
    },
  });
})();
