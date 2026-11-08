/* =====================================================================
   Interfaz de Contrastes de hipótesis: el tipo de contraste y sus datos
   (resumen o lista), la decisión con el estadístico, los valores críticos,
   el p-valor, el tamaño del efecto y la potencia; la gráfica de la
   distribución bajo H₀ (y bajo la alternativa, con β) con la región crítica
   sombreada, la curva de potencia, el gráfico cuantil-cuantil de la
   normalidad o las desviaciones de varios grupos; y el desarrollo. Se monta
   con Calculadora.monta (calculadora.js); el cálculo está en
   contrastes/calculo.js.
   ===================================================================== */
(() => {
  const C = Contrastes, { f } = Calculadora, pr = Estadistica.prob, IN = Inferencia, D = Estadistica.DIST;
  const comun = (sc) => [{ k: 'h1', nom: 'Hipótesis alternativa H₁', tipo: 'sel', ops: Object.entries(C.H1) }, { k: 'alfa', nom: 'Nivel de significación α' }];
  const entrada = (sc) => ({ k: 'entrada', nom: 'Los datos son', tipo: 'sel', ops: Object.entries(C.ENTRADA) });
  const pot = (sc, ayuda) => [{ k: 'real', nom: 'Valor real (opcional)', ayuda, sep: 'Potencia y tamaño de muestra' }, { k: 'pot', nom: 'Potencia deseada 1 − β', ayuda: 'por defecto 0,8' }];
  const CAMPOS = {
    media: (sc) => [entrada(sc), { k: 'mu0', nom: 'Valor de H₀ μ₀' }, { k: 'sigmaC', nom: 'σ de la población', tipo: 'sel', ops: [['no', 'Desconocida (t de Student)'], ['si', 'Conocida (z)']] },
      ...(sc.entrada === 'datos' ? [{ k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'valores separados por espacios o saltos de línea', filas: 4 }, ...(sc.sigmaC === 'si' ? [{ k: 's', nom: 'σ de la población' }] : [])]
        : [{ k: 'n', nom: 'Tamaño de la muestra n' }, { k: 'xm', nom: 'Media muestral x̄' }, { k: 's', nom: sc.sigmaC === 'si' ? 'σ de la población' : 'Desviación típica muestral s' }]), ...pot(sc, 'la μ verdadera que se quiere detectar')],
    apareados: (sc) => [{ k: 'mu0', nom: 'Diferencia de H₀ μ_d', ayuda: 'normalmente 0' }, { k: 'datos1', nom: 'Muestra 1 (antes)', tipo: 'area', ayuda: 'un valor por individuo', filas: 3 }, { k: 'datos2', nom: 'Muestra 2 (después)', tipo: 'area', ayuda: 'en el mismo orden', filas: 3 }, ...pot(sc, 'la diferencia media verdadera μ_d')],
    proporcion: (sc) => [{ k: 'p0', nom: 'Proporción de H₀ p₀' }, { k: 'n', nom: 'Tamaño de la muestra n' }, { k: 'x', nom: 'Éxitos en la muestra x' }, ...pot(sc, 'la p verdadera')],
    varianza: (sc) => [entrada(sc), { k: 's0', nom: 'σ₀ de H₀', ayuda: 'desviación típica' },
      ...(sc.entrada === 'datos' ? [{ k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'valores separados por espacios o saltos de línea', filas: 4 }] : [{ k: 'n', nom: 'Tamaño de la muestra n' }, { k: 's', nom: 'Desviación típica muestral s' }]), ...pot(sc, 'la σ (desviación típica) verdadera')],
    dosmedias: (sc) => [entrada(sc), { k: 'caso', nom: 'Varianzas', tipo: 'sel', ops: Object.entries(C.CASOS) }, { k: 'd0', nom: 'Diferencia de H₀', ayuda: 'normalmente 0' },
      ...(sc.entrada === 'datos'
        ? [{ k: 'datos1', nom: 'Muestra 1', tipo: 'area', ayuda: 'valores separados por espacios', filas: 3, sep: 'Muestra 1' }, { k: 'datos2', nom: 'Muestra 2', tipo: 'area', ayuda: 'valores separados por espacios', filas: 3, sep: 'Muestra 2' }, ...(sc.caso === 'conocidas' ? [{ k: 's1', nom: 'σ₁' }, { k: 's2', nom: 'σ₂' }] : [])]
        : [{ k: 'n1', nom: 'n₁', sep: 'Muestra 1' }, { k: 'xm1', nom: 'x̄₁' }, { k: 's1', nom: sc.caso === 'conocidas' ? 'σ₁' : 's₁' }, { k: 'n2', nom: 'n₂', sep: 'Muestra 2' }, { k: 'xm2', nom: 'x̄₂' }, { k: 's2', nom: sc.caso === 'conocidas' ? 'σ₂' : 's₂' }]), ...pot(sc, 'la diferencia μ₁ − μ₂ verdadera')],
    dosprop: (sc) => [{ k: 'n1', nom: 'n₁', sep: 'Muestra 1' }, { k: 'x1', nom: 'Éxitos x₁' }, { k: 'n2', nom: 'n₂', sep: 'Muestra 2' }, { k: 'x2', nom: 'Éxitos x₂' }, ...pot(sc, 'la diferencia p₁ − p₂ verdadera, con p₂ la observada')],
    dosvar: (sc) => [{ k: 'n1', nom: 'n₁', sep: 'Muestra 1' }, { k: 's1', nom: 's₁' }, { k: 'n2', nom: 'n₂', sep: 'Muestra 2' }, { k: 's2', nom: 's₂' }, ...pot(sc, 'el cociente σ₁²/σ₂² verdadero')],
    normalidad: () => [{ k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'de 3 a 5000 valores separados por espacios o saltos de línea', filas: 6 }],
    varios: () => [{ k: 'metodo', nom: 'Prueba', tipo: 'sel', ops: Object.entries(C.METODOS) }, { k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'un grupo por línea, con su nombre antes de «:» si quieres', filas: 6 }],
  };
  // una media o una proporción al azar, para el modo práctica
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), c = (x) => String(x).replace('.', ','), h1 = ['distinto', 'mayor', 'menor'][e(0, 2)], alfa = ['0,05', '0,01', '0,1'][e(0, 2)];
    if (Math.random() < 0.5) { const mu0 = e(10, 60) * 10, s = e(2, 8) * 5, n = e(3, 8) ** 2, xm = mu0 + (h1 === 'menor' ? -1 : 1) * e(0, 6) * s / 10; return { tipo: 'media', h1, alfa, entrada: 'resumen', sigmaC: Math.random() < 0.5 ? 'si' : 'no', mu0: String(mu0), n: String(n), xm: c(xm), s: String(s) }; }
    const p0 = [0.2, 0.25, 0.3, 0.4, 0.5][e(0, 4)], n = e(10, 40) * 10, x = Math.round(n * (p0 + (h1 === 'menor' ? -1 : 1) * e(0, 8) / 100));
    return { tipo: 'proporcion', h1, alfa, p0: c(p0), n: String(n), x: String(x) };
  }
  const H = { distinto: '≠', mayor: '>', menor: '<' };
  const eN = (s) => s.e.replace('^2', '²');
  const SIN = 'No se puede comprobar';
  // la densidad del estadístico bajo la alternativa (para dibujar H₁)
  const pdfAlt = (m) => (x) => (m.k === 'z' ? Math.exp(-0.5 * ((x - m.mu) / m.sg) ** 2) / (m.sg * Math.sqrt(2 * Math.PI)) : m.k === 't' ? IN.nctPdf(x, m.nu, m.delta) : m.k === 'chi2' ? D.chi2.pdf({ k: m.kk }, x / m.esc) / m.esc : D.f.pdf({ d1: m.d1, d2: m.d2 }, x / m.esc) / m.esc);
  Calculadora.monta({
    C, carpeta: 'contrastes', app: 'ContrastesApp', azar,
    enunciado: (sc, s) => s && (s.tipo === 'media' && sc.entrada !== 'datos'
      ? `Una muestra de ${sc.n} datos da una media de ${sc.xm} ${sc.sigmaC === 'si' ? `(la población tiene σ = ${sc.s})` : `y una desviación típica s = ${sc.s}`}. Contrasta con α = ${sc.alfa} si μ ${H[sc.h1]} ${sc.mu0}: calcula el estadístico, el valor crítico y el p-valor.`
      : s.tipo === 'proporcion' ? `En una muestra de ${sc.n} personas, ${sc.x} cumplen la condición. Contrasta con α = ${sc.alfa} si la proporción es ${H[sc.h1]} ${sc.p0}: calcula el estadístico, el valor crítico y el p-valor.`
        : `Resuelve el contraste de hipótesis con los datos de la herramienta (α = ${sc.alfa}): calcula el estadístico, el valor crítico y el p-valor.`),
    nota: 'En H₁ eliges qué quieres probar: «≠» si la diferencia puede ir a cualquier lado (bilateral), «>» o «<» si solo interesa un lado (unilateral). α suele ser 0,05, 0,01 o 0,1. Si das el valor real del parámetro, se calculan también la potencia y el tamaño de muestra necesario.',
    campos: (sc) => [{ k: 'tipo', nom: 'Contraste de', tipo: 'sel', ops: Object.entries(C.TIPOS) }, ...(['normalidad', 'varios'].includes(sc.tipo) ? [{ k: 'alfa', nom: 'Nivel de significación α' }] : comun(sc)), ...(CAMPOS[sc.tipo] || CAMPOS.media)(sc)],
    resumen: (s) => {
      if (s.tipo === 'normalidad') return [['Decisión', s.rechaza ? 'Se rechaza la normalidad' : 'No se rechaza la normalidad', true], ['Shapiro-Wilk', `W = ${f(s.sh.W, 4)}`], ['p-valor (Shapiro-Wilk)', f(s.sh.p)], ...(s.jb ? [['Jarque-Bera', `JB = ${f(s.jb.JB)}`], ['p-valor (Jarque-Bera)', f(s.jb.p)]] : []), ['Media', f(s.m)], ['Desviación típica', f(s.s)]];
      if (s.tipo === 'varios') return [['Decisión', s.rechaza ? 'Se rechaza la igualdad de varianzas' : 'No se rechaza la igualdad de varianzas', true], ['Levene (mediana)', `W = ${f(s.lev.W)}`], ['p-valor (Levene)', f(s.lev.p)], ['Bartlett', `B = ${f(s.bar.B)}`], ['p-valor (Bartlett)', f(s.bar.p)]];
      const o = [
        ['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true],
        ['Estadístico', `${eN(s)} = ${f(s.est)}`],
        [s.crit.length > 1 ? 'Valores críticos' : 'Valor crítico', s.crit.map((v) => f(v)).join(' y ')],
        ['p-valor', f(s.pv)],
        ['Estimación', f(s.estimado)],
      ];
      if (s.efecto) o.push([s.efecto.nom, `${f(s.efecto.val)} (${C.lim(s.efecto.val)})`]);
      if (s.pot) o.push(['Potencia 1 − β', f(s.pot.potencia, 4)], ['Error de tipo II β', f(s.pot.beta, 4)], [s.pot.n2 ? 'Tamaños necesarios' : 'Tamaño necesario', s.pot.necAlcanza ? (s.pot.n2 ? `n₁ = ${s.pot.nec[0]} y n₂ = ${s.pot.nec[1]}` : `n = ${s.pot.nec[0]}`) : 'No se alcanza']);
      const mal = (s.norm || []).filter((q) => q.ok === false);
      if (s.norm && s.norm.length) o.push(['Normalidad de los datos', mal.length ? `No se sostiene (${mal.map((q) => q.nom).join(', ')})` : 'Sin pruebas en contra'], ...(mal.length ? [['Aviso', 'Los datos no parecen normales: con pocas observaciones la t pierde fiabilidad; mira Contrastes no paramétricos.', true]] : []));
      return o;
    },
    grafica: (s, col) => {
      if (s.tipo === 'normalidad') {
        const z = s.q.map((q) => q[0]), zl = Math.min(...z), zh = Math.max(...z), ys = s.q.map((q) => q[1]), lo = Math.min(...ys, s.m + s.s * zl), hi = Math.max(...ys, s.m + s.s * zh), aire = (hi - lo || 1) * 0.08;
        return { x: [zl - 0.3, zh + 0.3], y: [lo - aire, hi + aire], ejeX: 'Cuantil teórico de la normal', ejeY: 'Dato ordenado', series: [{ pts: [[zl - 0.3, s.m + s.s * (zl - 0.3)], [zh + 0.3, s.m + s.s * (zh + 0.3)]], color: '--serie-2', grosor: 2 }, { tipo: 'puntos', pts: s.q, color: '--serie-1', radio: 4 }] };
      }
      if (s.tipo === 'varios') {
        const k = s.k, mx = Math.max(...s.grupos.map((g) => g.s)) * 1.15;
        return { x: [0.4, k + 0.6], y: [0, mx], ejeX: 'Grupo', ejeY: 'Desviación típica', fx: (v) => (Number.isInteger(v) && v >= 1 && v <= k ? s.grupos[v - 1].nom.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : ''), series: [{ tipo: 'barras', pts: s.grupos.map((g, i) => [i + 1, g.s]), ancho: 0.5, color: '--serie-1' }] };
      }
      const [Dd, P] = s.d, sim = s.sim, ext = Math.max(4, Math.abs(s.est) * 1.15, ...s.crit.map((v) => Math.abs(v) * 1.15), ...(s.pot && s.pot.alt.k === 'z' ? [Math.abs(s.pot.alt.mu) + 3 * s.pot.alt.sg] : s.pot && s.pot.alt.k === 't' ? [Math.abs(s.pot.alt.delta) + 3.5] : []));
      let [a, b] = sim ? [-ext, ext] : Dd.rango(P);
      if (!sim) { b = Math.max(b, s.est * 1.15, s.crit[s.crit.length - 1] * 1.15); if (s.pot) b = Math.max(b, Dd.rango(P)[1] * Math.max(1, Math.min(6, s.pot.alt.esc || 1))); }
      const pts = Array.from({ length: 301 }, (_, i) => { const x = a + ((b - a) * i) / 300; return [x, Dd.pdf(P, x)]; }).filter(([, y]) => isFinite(y));
      const alt = s.pot ? pdfAlt(s.pot.alt) : null, pts1 = alt ? Array.from({ length: 301 }, (_, i) => { const x = a + ((b - a) * i) / 300; return [x, alt(x)]; }).filter(([, y]) => isFinite(y)) : [];
      const ymax = Math.max(...pts.map((q) => q[1]).filter((y) => y < 5), ...pts1.map((q) => q[1]).filter((y) => y < 5)) * 1.15;
      // las colas de la región crítica
      const colas = s.h1 === 'mayor' ? [[s.crit[0], b]] : s.h1 === 'menor' ? [[a, s.crit[0]]] : [[a, s.crit[0]], [s.crit[1], b]];
      const area = colas.map(([u, v]) => ({ tipo: 'area', pts: pts.filter(([x]) => x >= u && x <= v), color: '--serie-2', alfa: 0.4 }));
      // β: la parte de la curva de H₁ fuera de la región crítica
      const ac = s.h1 === 'mayor' ? [[a, s.crit[0]]] : s.h1 === 'menor' ? [[s.crit[0], b]] : [[s.crit[0], s.crit[1]]];
      const beta = alt ? ac.map(([u, v]) => ({ tipo: 'area', pts: pts1.filter(([x]) => x >= u && x <= v), color: '--serie-3', alfa: 0.3 })) : [];
      return { x: [a, b], y: [0, ymax], ejeX: eN(s), series: [...area, ...beta, { pts: pts.map(([x, y]) => [x, Math.min(y, ymax * 2)]), color: '--serie-1' }, ...(alt ? [{ pts: pts1.map(([x, y]) => [x, Math.min(y, ymax * 2)]), color: '--serie-3', grosor: 2 }] : [])],
        verticales: [...s.crit.map((v) => ({ x: v, color: '--serie-2' })), { x: s.est, color: '--ink', texto: `${eN(s)} = ${f(s.est)}` }] };
    },
    leyenda: (s) => {
      if (s.tipo === 'normalidad') return `Cada punto es un dato ordenado frente al cuantil que le tocaría en una normal con la media y la desviación de la muestra (recta roja). Si los puntos siguen la recta, los datos son compatibles con una normal; las curvas o los puntos sueltos en los extremos indican asimetría o colas pesadas. Resultado: W = ${f(s.sh.W, 4)}, p = ${pr(s.sh.p)}.`;
      if (s.tipo === 'varios') return `Cada barra es la desviación típica de un grupo (${s.grupos.map((g) => `${g.nom}: ${f(g.s)}`).join('; ')}). Barras muy distintas sugieren varianzas distintas: ${s.rechaza ? 'el contraste las considera distintas' : 'el contraste no ve diferencias claras'} (p = ${pr(s.p)}).`;
      return `Distribución del estadístico si H₀ es cierta (azul). En rojo, la <b>región crítica</b> (área α = ${f(s.alfa)}); la línea negra es el <b>estadístico</b>, que ${s.rechaza ? 'cae dentro: se rechaza H₀' : 'cae fuera: no se rechaza H₀'}.${s.pot ? ` En verde, la distribución si el valor real fuera ${f(s.pot.real)}: la parte verde fuera de la región roja es el error de tipo II, β = ${f(s.pot.beta, 4)}, y el resto es la potencia ${f(s.pot.potencia, 4)}.` : ''}`;
    },
    datosExporta: (s) => (s.tipo === 'normalidad' ? { cab: ['Cuantil teórico', 'Dato ordenado'], filas: s.q.map((q) => [+q[0].toFixed(6), q[1]]) } : s.tipo === 'varios' ? { cab: ['Grupo', 'n', 'Desviación típica'], filas: s.grupos.map((g) => [g.nom, g.n, +g.s.toFixed(6)]) } : { cab: ['Magnitud', 'Valor'], filas: [['Estadístico', +s.est.toFixed(6)], ...s.crit.map((v, i) => [`Valor crítico ${i + 1}`, +v.toFixed(6)]), ['p-valor', +s.pv.toFixed(8)], ...(s.pot ? [['Potencia', +s.pot.potencia.toFixed(6)], ['β', +s.pot.beta.toFixed(6)]] : [])] }),
    // curva de potencia en una segunda gráfica
    despues: (r, s, col) => {
      const card = document.querySelector('#card-potencia'), c2 = document.querySelector('#grafica2'); if (!card || !c2) return;
      card.hidden = !s || !s.pot; if (card.hidden) return;
      const P = s.pot, ys = P.curva.map((q) => q[1]);
      Calculadora.grafica(c2, { x: [P.curva[0][0], P.curva[P.curva.length - 1][0]], y: [0, 1.02], ejeX: P.nom.replace(' real', ''), ejeY: 'Potencia 1 − β', series: [{ pts: P.curva, color: '--serie-1', grosor: 2.5 }, { tipo: 'puntos', pts: [[P.real, P.potencia]], color: '--serie-3', radio: 6 }],
        verticales: [{ x: P.centro, color: '--muted' }], horizontales: [{ y: P.objetivo, color: '--serie-2', texto: `objetivo ${f(P.objetivo)}` }, { y: s.alfa, color: '--muted' }] }, col);
      document.querySelector('#leyenda2').textContent = `La potencia crece al alejarse el valor real del de H₀ (línea gris): vale ${f(Math.min(...ys), 3)} (cerca de α) en el extremo menos favorable y ${f(Math.max(...ys), 3)} en el más lejano. El punto verde es el valor real elegido, con potencia ${f(P.potencia, 4)}; la línea roja es la potencia deseada.`;
      if (window.Herramienta && Herramienta.exportar) Herramienta.exportar(c2, { nombre: 'contrastes-potencia', titulo: 'Curva de potencia', datos: () => ({ cab: [P.nom, 'Potencia'], filas: P.curva.map((q) => [+q[0].toFixed(6), +q[1].toFixed(6)]) }) });
    },
  });
})();
