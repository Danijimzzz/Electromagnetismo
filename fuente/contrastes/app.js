/* =====================================================================
   Interfaz de Contrastes de hipótesis: el tipo de contraste y sus datos,
   la decisión con el estadístico, los valores críticos y el p-valor, la
   gráfica de la distribución bajo H₀ con la región crítica sombreada y el
   estadístico marcado, y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en contrastes/calculo.js.
   ===================================================================== */
(() => {
  const C = Contrastes, { f } = Calculadora;
  const comun = [{ k: 'h1', nom: 'Hipótesis alternativa H₁', tipo: 'sel', ops: Object.entries(C.H1) }, { k: 'alfa', nom: 'Nivel de significación α' }];
  const CAMPOS = {
    media: (sc) => [{ k: 'mu0', nom: 'Valor de H₀ μ₀' }, { k: 'sigmaC', nom: 'σ de la población', tipo: 'sel', ops: [['no', 'Desconocida (t de Student)'], ['si', 'Conocida (z)']] }, { k: 'n', nom: 'Tamaño de la muestra n' }, { k: 'xm', nom: 'Media muestral x̄' }, { k: 's', nom: sc.sigmaC === 'si' ? 'σ de la población' : 'Desviación típica muestral s' }],
    proporcion: () => [{ k: 'p0', nom: 'Proporción de H₀ p₀' }, { k: 'n', nom: 'Tamaño de la muestra n' }, { k: 'x', nom: 'Éxitos en la muestra x' }],
    varianza: () => [{ k: 's0', nom: 'σ₀ de H₀', ayuda: 'desviación típica' }, { k: 'n', nom: 'Tamaño de la muestra n' }, { k: 's', nom: 'Desviación típica muestral s' }],
    dosmedias: (sc) => [{ k: 'caso', nom: 'Varianzas', tipo: 'sel', ops: Object.entries(C.CASOS) }, { k: 'd0', nom: 'Diferencia de H₀', ayuda: 'normalmente 0' },
      { k: 'n1', nom: 'n₁', sep: 'Muestra 1' }, { k: 'xm1', nom: 'x̄₁' }, { k: 's1', nom: sc.caso === 'conocidas' ? 'σ₁' : 's₁' }, { k: 'n2', nom: 'n₂', sep: 'Muestra 2' }, { k: 'xm2', nom: 'x̄₂' }, { k: 's2', nom: sc.caso === 'conocidas' ? 'σ₂' : 's₂' }],
    dosprop: () => [{ k: 'n1', nom: 'n₁', sep: 'Muestra 1' }, { k: 'x1', nom: 'Éxitos x₁' }, { k: 'n2', nom: 'n₂', sep: 'Muestra 2' }, { k: 'x2', nom: 'Éxitos x₂' }],
    dosvar: () => [{ k: 'n1', nom: 'n₁', sep: 'Muestra 1' }, { k: 's1', nom: 's₁' }, { k: 'n2', nom: 'n₂', sep: 'Muestra 2' }, { k: 's2', nom: 's₂' }],
  };
  // una media o una proporción al azar, para el modo práctica
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), c = (x) => String(x).replace('.', ','), h1 = ['distinto', 'mayor', 'menor'][e(0, 2)], alfa = ['0,05', '0,01', '0,1'][e(0, 2)];
    if (Math.random() < 0.5) { const mu0 = e(10, 60) * 10, s = e(2, 8) * 5, n = e(3, 8) ** 2, xm = mu0 + (h1 === 'menor' ? -1 : 1) * e(0, 6) * s / 10; return { tipo: 'media', h1, alfa, sigmaC: Math.random() < 0.5 ? 'si' : 'no', mu0: String(mu0), n: String(n), xm: c(xm), s: String(s) }; }
    const p0 = [0.2, 0.25, 0.3, 0.4, 0.5][e(0, 4)], n = e(10, 40) * 10, x = Math.round(n * (p0 + (h1 === 'menor' ? -1 : 1) * e(0, 8) / 100));
    return { tipo: 'proporcion', h1, alfa, p0: c(p0), n: String(n), x: String(x) };
  }
  const H = { distinto: '≠', mayor: '>', menor: '<' };
  Calculadora.monta({
    C, carpeta: 'contrastes', app: 'ContrastesApp', azar,
    enunciado: (sc, s) => s && (s.tipo === 'media'
      ? `Una muestra de ${sc.n} datos da una media de ${sc.xm} ${sc.sigmaC === 'si' ? `(la población tiene σ = ${sc.s})` : `y una desviación típica s = ${sc.s}`}. Contrasta con α = ${sc.alfa} si μ ${H[sc.h1]} ${sc.mu0}: calcula el estadístico, el valor crítico y el p-valor.`
      : `En una muestra de ${sc.n} personas, ${sc.x} cumplen la condición. Contrasta con α = ${sc.alfa} si la proporción es ${H[sc.h1]} ${sc.p0}: calcula el estadístico, el valor crítico y el p-valor.`),
    nota: 'En H₁ eliges qué quieres probar: «≠» si la diferencia puede ir a cualquier lado (bilateral), «>» o «<» si solo interesa un lado (unilateral). α suele ser 0,05, 0,01 o 0,1.',
    campos: (sc) => [{ k: 'tipo', nom: 'Contraste de', tipo: 'sel', ops: Object.entries(C.TIPOS) }, ...comun, ...(CAMPOS[sc.tipo] || CAMPOS.media)(sc)],
    resumen: (s) => [
      ['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true],
      ['Estadístico', `${s.e.replace('^2', '²')} = ${f(s.est)}`],
      [s.crit.length > 1 ? 'Valores críticos' : 'Valor crítico', s.crit.map((v) => f(v)).join(' y ')],
      ['p-valor', f(s.pv)],
      ['Estimación', f(s.estimado)],
    ],
    grafica: (s, col) => {
      const [Dd, P] = s.d, sim = s.sim, ext = Math.max(4, Math.abs(s.est) * 1.15, ...s.crit.map((v) => Math.abs(v) * 1.15));
      let [a, b] = sim ? [-ext, ext] : Dd.rango(P);
      if (!sim) b = Math.max(b, s.est * 1.15, s.crit[s.crit.length - 1] * 1.15);
      const pts = Array.from({ length: 301 }, (_, i) => { const x = a + ((b - a) * i) / 300; return [x, Dd.pdf(P, x)]; }).filter(([, y]) => isFinite(y));
      const ymax = Math.max(...pts.map((q) => q[1]).filter((y) => y < 5)) * 1.15;
      // las colas de la región crítica
      const colas = s.h1 === 'mayor' ? [[s.crit[0], b]] : s.h1 === 'menor' ? [[a, s.crit[0]]] : [[a, s.crit[0]], [s.crit[1], b]];
      const area = colas.map(([u, v]) => ({ tipo: 'area', pts: pts.filter(([x]) => x >= u && x <= v), color: '--serie-2', alfa: 0.4 }));
      return { x: [a, b], y: [0, ymax], ejeX: s.e.replace('^2', '²'), series: [...area, { pts: pts.map(([x, y]) => [x, Math.min(y, ymax * 2)]), color: '--serie-1' }],
        verticales: [...s.crit.map((v) => ({ x: v, color: '--serie-2' })), { x: s.est, color: '--ink', texto: `${s.e.replace('^2', '²')} = ${f(s.est)}` }] };
    },
    leyenda: (s) => `Distribución del estadístico si H₀ es cierta. En rojo, la <b>región crítica</b> (área α = ${f(s.alfa)}); la línea negra es el <b>estadístico</b>, que ${s.rechaza ? 'cae dentro: se rechaza H₀' : 'cae fuera: no se rechaza H₀'}.`,
  });
})();
