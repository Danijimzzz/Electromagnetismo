/* =====================================================================
   Interfaz de los contrastes no paramétricos: el tipo (Mann-Whitney,
   Wilcoxon apareado o de una mediana), los datos, la tabla de rangos, la
   gráfica y el desarrollo. Se monta con Calculadora.monta (calculadora.js);
   el cálculo está en no-parametricos/calculo.js.
   ===================================================================== */
(() => {
  const C = NoParametricos, { f } = Calculadora;
  const SI_NO = [['si', 'Sí'], ['no', 'No']];
  const pr = Estadistica.prob;
  const fila = (cs, td = 'td') => `<tr>${cs.map((c) => (td === 'th' ? `<th scope="col">${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`;
  const des = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const tabla = (cap, cab, filas, pie = '') => `<table class="tabla-eco" style="margin-bottom:14px"><caption>${cap}</caption><thead>${fila(cab, 'th')}</thead><tbody>${filas}</tbody>${pie ? `<tfoot>${pie}</tfoot>` : ''}</table>`;
  const ic = (hl) => (isFinite(hl.lo) ? `(${f(hl.lo)}; ${f(hl.hi)})` : '—');
  function campos(sc) {
    const t = C.TIPOS[sc.tipo] ? sc.tipo : 'mw';
    if (t === 'kw') return [{ k: 'tipo', nom: 'Contraste', tipo: 'sel', ops: Object.entries(C.TIPOS) }, { k: 'alfa', nom: 'Nivel de significación α' }, { k: 'post', nom: 'Comparaciones por parejas', tipo: 'sel', ops: Object.entries(C.POST) }, { k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'un grupo por línea, con su nombre antes de «:» si quieres; valores separados por espacios', filas: 7 }];
    return [{ k: 'tipo', nom: 'Contraste', tipo: 'sel', ops: Object.entries(C.TIPOS) },
      { k: 'h1', nom: 'Hipótesis alternativa H₁', tipo: 'sel', ops: Object.entries(C.H1) },
      { k: 'alfa', nom: 'Nivel de significación α' },
      ...(t === 'signos' || t === 'signosmed' ? (t === 'signos' ? [{ k: 'datos', nom: 'Pares «primera segunda»', tipo: 'area', ayuda: 'una fila por individuo', filas: 8 }] : [{ k: 'm0', nom: 'Mediana de H₀' }, { k: 'datos', nom: 'Muestra', tipo: 'area', ayuda: 'valores separados por espacios', filas: 4 }])
        : t === 'correlacion' ? [{ k: 'datos', nom: 'Pares «x y»', tipo: 'area', ayuda: 'una fila por individuo', filas: 8 }] : []),
      ...(['signos', 'signosmed', 'correlacion'].includes(t) ? [] : [
      ...(t === 'mw' ? [{ k: 'datos1', nom: 'Muestra 1', tipo: 'area', ayuda: 'valores separados por espacios', filas: 3 }, { k: 'datos2', nom: 'Muestra 2', tipo: 'area', ayuda: 'valores separados por espacios', filas: 3 }]
        : t === 'pares' ? [{ k: 'datos', nom: 'Pares «primera segunda»', tipo: 'area', ayuda: 'una fila por individuo, p. ej. antes y después', filas: 8 }]
          : [{ k: 'm0', nom: 'Mediana de H₀' }, { k: 'datos', nom: 'Muestra', tipo: 'area', ayuda: 'valores separados por espacios', filas: 4 }]),
      { k: 'exacto', nom: 'p-valor exacto si se puede', tipo: 'sel', ops: SI_NO, ayuda: 'sin empates y con pocos datos' },
      { k: 'cc', nom: 'Corrección de continuidad', tipo: 'sel', ops: SI_NO, ayuda: 'en la aproximación normal' }])];
  }
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), vals = (n, c) => Array.from({ length: n }, () => c + e(-8, 8)).join(' ');
    if (Math.random() < 0.5) return { tipo: 'mw', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', datos1: vals(6, 20), datos2: vals(7, 20 + e(0, 6)) };
    return { tipo: 'pares', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', datos: Array.from({ length: 8 }, () => { const a = e(60, 90); return `${a} ${a + e(-4, 8)}`; }).join('\n') };
  }
  const H1T = { dos: 'las medianas son distintas', mayor: 'la primera es mayor', menor: 'la primera es menor' };
  Calculadora.monta({
    C, carpeta: 'no-parametricos', app: 'NoParametricosApp', campos, azar,
    // «Usar en…»: los grupos de Kruskal-Wallis en el ANOVA y la muestra de Wilcoxon en Descriptiva
    usarEn: (s, sc) => (s.tipo === 'kw' ? [{ texto: 'ANOVA con estos grupos →', carpeta: 'anova', estado: { modo: 'uno', alfa: sc.alfa, prueba: 'f', post: 'tukey', contrastes: '', datos: sc.datos } }]
      : s.tipo === 'mediana' || s.tipo === 'signosmed' ? [{ texto: 'Descriptiva de estos datos →', carpeta: 'descriptiva', estado: { formato: 'lista', datos: sc.datos, pesos: '', div: 'n1', pk: '' } }] : []),
    enunciado: (sc, s) => s && (s.tipo === 'kw' ? `Se han medido varios grupos (cada grupo separado por «;»): ${String(sc.datos).trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join('; ')}. Con α = ${sc.alfa}, contrasta con Kruskal-Wallis si los grupos difieren: calcula las sumas de rangos, H y el p-valor.`
      : s.tipo === 'signos' || s.tipo === 'signosmed' || s.tipo === 'correlacion' ? `Resuelve el contraste con los datos de la herramienta (α = ${sc.alfa}): calcula el estadístico y el p-valor.`
      : s.tipo === 'mw'
      ? `Se han medido dos grupos independientes. Muestra 1: ${sc.datos1.trim().replace(/\s+/g, ' ')}. Muestra 2: ${sc.datos2.trim().replace(/\s+/g, ' ')}. Con α = ${sc.alfa}, contrasta con la U de Mann-Whitney si ${H1T[s.h1]}: calcula los rangos, U y el p-valor.`
      : s.tipo === 'pares' ? `Se ha medido a ${s.nTotal} individuos antes y después (pares «antes después» separados por «;»): ${String(sc.datos).trim().split(/\r?\n/).map((l) => l.trim().replace(/\s+/g, ' ')).join('; ')}. Con α = ${sc.alfa}, contrasta con el test de Wilcoxon si ${H1T[s.h1]}: calcula los rangos con signo, W⁺ y el p-valor.`
        : `Una muestra: ${sc.datos.trim().replace(/\s+/g, ' ')}. Con α = ${sc.alfa}, contrasta con el test de Wilcoxon si la mediana es ${sc.m0} frente a que ${H1T[s.h1]}: calcula los rangos con signo, W⁺ y el p-valor.`),
    nota: 'No hace falta que los datos sean normales: solo cuenta su orden. Si hay empates o muchos datos, el p-valor sale por la aproximación normal.',
    resumen: (s) => s.tipo === 'kw' ? [['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true], ['Estadístico', `H = ${f(s.H)}`], ['Grados de libertad', String(s.gl)], ['Valor crítico', f(s.crit)], ['p-valor', f(s.p)], ['ε² (tamaño del efecto)', f(s.eps2, 3)]]
      : s.tipo === 'signos' || s.tipo === 'signosmed' ? [['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true], ['Positivos n⁺', String(s.mas)], ['Negativos n⁻', String(s.menos)], ['p-valor exacto (binomial)', f(s.p)], ['Diferencias nulas descartadas', String(s.ceros)]]
      : s.tipo === 'correlacion' ? [['Decisión', s.rechaza ? 'Hay asociación (alguna de las dos pruebas rechaza H₀)' : 'No se rechaza H₀ con ninguna', true], ['Spearman ρₛ', f(s.sp.rho, 4)], ['p-valor (Spearman)', f(s.pS)], ['Kendall τ', f(s.ke.tau, 4)], ['p-valor (Kendall)', f(s.pK)], ['Método de Kendall', s.ke.exacto ? 'Exacto' : 'Aproximación normal']]
      : [
      ['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true],
      s.tipo === 'mw' ? ['Estadístico', `U₁ = ${f(s.U1)}`] : ['Estadístico', `W⁺ = ${f(s.Wp)}`],
      s.tipo === 'mw' ? ['Otro estadístico', `U₂ = ${f(s.U2)}`] : ['Otro estadístico', `W⁻ = ${f(s.Wm)}`],
      ['p-valor', f(s.p)],
      ['Método', s.exacto ? 'p-valor exacto' : 'Aproximación normal'],
      s.z === null ? ['Datos', s.tipo === 'mw' ? `${s.n1} y ${s.n2}` : `n = ${s.n}`] : ['z', f(s.z)],
      s.tipo === 'mw' ? ['Prob. de superioridad', f(s.psup, 3)] : ['r biserial de rangos', f(s.rb, 3)],
      ['r = |z|/√n (efecto)', f(s.rEf, 3)],
      ['Hodges-Lehmann', f(s.hl.est)],
      ['IC de Hodges-Lehmann', ic(s.hl)],
    ],
    tabla: (s) => {
      if (s.tipo === 'kw') return tabla('Rangos de cada grupo', ['Grupo', 'n', 'Suma de rangos', 'Rango medio'], s.g.map((q) => fila([q.nom, String(q.n), f(q.R), f(q.Rm)])).join('')) + (s.pares.length ? tabla(`Comparaciones de Dunn (${s.post === 'holm' ? 'Holm' : 'Bonferroni'})`, ['Pareja', 'Dif. de rangos medios', 'z', 'p ajustado', '¿Distintos?'], s.pares.map((q) => fila([`${q.a} − ${q.b}`, f(q.dif), f(q.z), pr(q.p), q.sig ? 'Sí' : 'No'])).join('')) : '');
      if (s.tipo === 'signos' || s.tipo === 'signosmed') return tabla('Signos de las diferencias', [s.tipo === 'signos' ? 'Primera' : 'Dato', s.tipo === 'signos' ? 'Segunda' : 'Mediana H₀', 'd', 'Signo'], s.ds.map((q) => fila([f(q.a), f(q.b), f(q.d), q.d > 0 ? '+' : q.d < 0 ? '−' : 'se descarta'])).join(''), fila(['', '', 'n⁺ / n⁻', `${s.mas} / ${s.menos}`]));
      if (s.tipo === 'correlacion') return tabla('Datos y rangos', ['x', 'y', 'Rango de x', 'Rango de y'], s.x.map((v, i) => fila([f(v), f(s.y[i]), f(s.rx[i]), f(s.ry[i])])).join(''));
      if (s.tipo === 'mw') return `<table class="tabla-eco"><thead>${fila(['Dato', 'Muestra', 'Rango'], 'th')}</thead><tbody>${s.orden.map((q) => fila([f(q.v), String(q.g), f(q.r)])).join('')}</tbody><tfoot>${fila(['Suma de rangos', `R₁ = ${f(s.R1)}`, `R₂ = ${f(s.R2)}`])}</tfoot></table>`;
      const cab = s.tipo === 'pares' ? ['Primera', 'Segunda'] : ['Dato', 'Mediana H₀'];
      return `<table class="tabla-eco"><thead>${fila([...cab, 'd', '|d|', 'Rango con signo'], 'th')}</thead><tbody>${s.ds.map((q) => fila([f(q.a), f(q.b), f(q.d), f(Math.abs(q.d)), q.d === 0 ? 'se descarta' : `${q.d < 0 ? '−' : '+'}${f(q.r)}`])).join('')}</tbody><tfoot>${fila(['', '', '', `W⁺ = ${f(s.Wp)}`, `W⁻ = ${f(s.Wm)}`])}</tfoot></table>`;
    },
    grafica: (s) => {
      if (s.tipo === 'kw') { const r = s.g.flatMap((q) => q.rangos), k = s.k; return { x: [0.4, k + 0.6], y: [0, Math.max(...r) + 1], ejeX: 'Grupo', ejeY: 'Rango', fx: (v) => (Number.isInteger(v) && v >= 1 && v <= k ? des(s.g[v - 1].nom) : ''), series: [...s.g.map((q, i) => ({ tipo: 'puntos', pts: q.rangos.map((v, j) => [i + 1 + (j - (q.n - 1) / 2) * 0.05, v]), color: '--serie-1', radio: 4 })), ...s.g.map((q, i) => ({ pts: [[i + 0.7, q.Rm], [i + 1.3, q.Rm]], color: '--serie-2', grosor: 3 }))], horizontales: [{ y: (s.N + 1) / 2, color: '--muted' }] }; }
      if (s.tipo === 'signos' || s.tipo === 'signosmed') return { x: [0.4, 2.6], y: [0, Math.max(s.mas, s.menos) * 1.2 + 0.5], ejeX: 'Signo de la diferencia', ejeY: 'Número de diferencias', fx: (v) => (v === 1 ? '+' : v === 2 ? '−' : ''), series: [{ tipo: 'barras', ancho: 0.6, pts: [[1, s.mas]], color: '--serie-1' }, { tipo: 'barras', ancho: 0.6, pts: [[2, s.menos]], color: '--serie-2' }], horizontales: [{ y: s.n / 2, color: '--muted', texto: 'n/2 si H₀' }] };
      if (s.tipo === 'correlacion') { const n = s.n; return { x: [0.5, n + 0.5], y: [0.5, n + 0.5], ejeX: 'Rango de x', ejeY: 'Rango de y', series: [{ pts: [[0.5, 0.5], [n + 0.5, n + 0.5]], color: '--muted', grosor: 1.5 }, { tipo: 'puntos', pts: s.rx.map((v, i) => [v, s.ry[i]]), color: '--serie-1', radio: 4.5 }] }; }
      if (s.tipo === 'mw') {
        const med = (v) => { const o = [...v].sort((a, b) => a - b), m = o.length >> 1; return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };
        const todos = [...s.x, ...s.y], lo = Math.min(...todos), hi = Math.max(...todos), aire = (hi - lo || 1) * 0.12;
        return { x: [0.4, 2.6], y: [lo - aire, hi + aire], ejeX: 'Muestra', ejeY: 'Valor', fx: (v) => (v === 1 || v === 2 ? `Muestra ${v}` : ''),
          series: [{ tipo: 'puntos', pts: s.x.map((v, j) => [1 + (j - (s.n1 - 1) / 2) * 0.05, v]), color: '--serie-1', radio: 4 }, { tipo: 'puntos', pts: s.y.map((v, j) => [2 + (j - (s.n2 - 1) / 2) * 0.05, v]), color: '--serie-1', radio: 4 },
            { pts: [[0.7, med(s.x)], [1.3, med(s.x)]], color: '--serie-2', grosor: 3 }, { pts: [[1.7, med(s.y)], [2.3, med(s.y)]], color: '--serie-2', grosor: 3 }] };
      }
      const o = [...s.nz].sort((a, b) => Math.abs(a.d) - Math.abs(b.d)), m = Math.max(...o.map((q) => q.r)) * 1.15;
      return { x: [0.4, o.length + 0.6], y: [-m, m], ejeX: 'Diferencias ordenadas por |d|', ejeY: 'Rango con signo', fx: (v) => (Number.isInteger(v) && v >= 1 && v <= o.length ? String(v) : ''),
        series: [{ tipo: 'barras', ancho: 0.6, pts: o.filter((q) => q.d > 0).map((q) => [o.indexOf(q) + 1, q.r]), color: '--serie-1' }, { tipo: 'barras', ancho: 0.6, pts: o.filter((q) => q.d < 0).map((q) => [o.indexOf(q) + 1, -q.r]), color: '--serie-2' }] };
    },
    leyenda: (s) => s.tipo === 'kw' ? `<b style="color:var(--serie-1)">Azul</b>: el rango de cada dato (1 es el menor de todos); <b style="color:var(--serie-2)">rojo</b>: el rango medio de cada grupo; la línea gris es el rango medio global (N + 1)/2 = ${f((s.N + 1) / 2)}. Si H₀ es cierta, todos los rangos medios se parecen a ella. ${s.g.map((q) => `${q.nom}: ${f(q.Rm)}`).join('; ')}.`
      : s.tipo === 'signos' || s.tipo === 'signosmed' ? `Se cuentan las diferencias positivas (azul, n⁺ = ${s.mas}) y las negativas (rojo, n⁻ = ${s.menos}). Si H₀ es cierta, se reparten a partes iguales (n/2 = ${f(s.n / 2)} cada una), y el p-valor es la probabilidad binomial de un reparto tan desigual.`
        : s.tipo === 'correlacion' ? `Cada punto es un individuo con el rango de x en el eje horizontal y el de y en el vertical. La diagonal gris es la asociación perfecta (ρₛ = 1); cuanto más se pegan los puntos a ella (o a la otra diagonal, si es negativa), mayor es |ρₛ|. Aquí ρₛ = ${f(s.sp.rho, 4)} y τ = ${f(s.ke.tau, 4)}.`
        : s.tipo === 'mw'
      ? `<b style="color:var(--serie-1)">Azul</b>: los datos de cada muestra; <b style="color:var(--serie-2)">rojo</b>: su mediana. Si una muestra tiende a dar valores mayores, sus rangos suman más (R₁ = ${f(s.R1)}, R₂ = ${f(s.R2)}).`
      : `Cada barra es una diferencia, ordenada por tamaño: su altura es el rango de |d|. <b style="color:var(--serie-1)">Azul</b>: diferencias positivas (W⁺ = ${f(s.Wp)}); <b style="color:var(--serie-2)">rojo</b>: negativas (W⁻ = ${f(s.Wm)}). Si H₀ es cierta, las dos sumas se parecen.`,
  });
})();
