/* =====================================================================
   Interfaz de los contrastes no paramétricos: el tipo (Mann-Whitney,
   Wilcoxon apareado o de una mediana), los datos, la tabla de rangos, la
   gráfica y el desarrollo. Se monta con Calculadora.monta (calculadora.js);
   el cálculo está en no-parametricos/calculo.js.
   ===================================================================== */
(() => {
  const C = NoParametricos, { f } = Calculadora;
  const SI_NO = [['si', 'Sí'], ['no', 'No']];
  const fila = (cs, td = 'td') => `<tr>${cs.map((c) => `<${td}>${c}</${td}>`).join('')}</tr>`;
  function campos(sc) {
    const t = C.TIPOS[sc.tipo] ? sc.tipo : 'mw';
    return [{ k: 'tipo', nom: 'Contraste', tipo: 'sel', ops: Object.entries(C.TIPOS) },
      { k: 'h1', nom: 'Hipótesis alternativa H₁', tipo: 'sel', ops: Object.entries(C.H1) },
      { k: 'alfa', nom: 'Nivel de significación α' },
      ...(t === 'mw' ? [{ k: 'datos1', nom: 'Muestra 1', tipo: 'area', ayuda: 'valores separados por espacios', filas: 3 }, { k: 'datos2', nom: 'Muestra 2', tipo: 'area', ayuda: 'valores separados por espacios', filas: 3 }]
        : t === 'pares' ? [{ k: 'datos', nom: 'Pares «primera segunda»', tipo: 'area', ayuda: 'una fila por individuo, p. ej. antes y después', filas: 8 }]
          : [{ k: 'm0', nom: 'Mediana de H₀' }, { k: 'datos', nom: 'Muestra', tipo: 'area', ayuda: 'valores separados por espacios', filas: 4 }]),
      { k: 'exacto', nom: 'p-valor exacto si se puede', tipo: 'sel', ops: SI_NO, ayuda: 'sin empates y con pocos datos' },
      { k: 'cc', nom: 'Corrección de continuidad', tipo: 'sel', ops: SI_NO, ayuda: 'en la aproximación normal' }];
  }
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), vals = (n, c) => Array.from({ length: n }, () => c + e(-8, 8)).join(' ');
    if (Math.random() < 0.5) return { tipo: 'mw', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', datos1: vals(6, 20), datos2: vals(7, 20 + e(0, 6)) };
    return { tipo: 'pares', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', datos: Array.from({ length: 8 }, () => { const a = e(60, 90); return `${a} ${a + e(-4, 8)}`; }).join('\n') };
  }
  const H1T = { dos: 'las medianas son distintas', mayor: 'la primera es mayor', menor: 'la primera es menor' };
  Calculadora.monta({
    C, carpeta: 'no-parametricos', app: 'NoParametricosApp', campos, azar,
    enunciado: (sc, s) => s && (s.tipo === 'mw'
      ? `Se han medido dos grupos independientes. Muestra 1: ${sc.datos1.trim().replace(/\s+/g, ' ')}. Muestra 2: ${sc.datos2.trim().replace(/\s+/g, ' ')}. Con α = ${sc.alfa}, contrasta con la U de Mann-Whitney si ${H1T[s.h1]}: calcula los rangos, U y el p-valor.`
      : s.tipo === 'pares' ? `Se ha medido a ${s.nTotal} individuos antes y después (pares «antes después» separados por «;»): ${String(sc.datos).trim().split(/\r?\n/).map((l) => l.trim().replace(/\s+/g, ' ')).join('; ')}. Con α = ${sc.alfa}, contrasta con el test de Wilcoxon si ${H1T[s.h1]}: calcula los rangos con signo, W⁺ y el p-valor.`
        : `Una muestra: ${sc.datos.trim().replace(/\s+/g, ' ')}. Con α = ${sc.alfa}, contrasta con el test de Wilcoxon si la mediana es ${sc.m0} frente a que ${H1T[s.h1]}: calcula los rangos con signo, W⁺ y el p-valor.`),
    nota: 'No hace falta que los datos sean normales: solo cuenta su orden. Si hay empates o muchos datos, el p-valor sale por la aproximación normal.',
    resumen: (s) => [
      ['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true],
      s.tipo === 'mw' ? ['Estadístico', `U₁ = ${f(s.U1)}`] : ['Estadístico', `W⁺ = ${f(s.Wp)}`],
      s.tipo === 'mw' ? ['Otro estadístico', `U₂ = ${f(s.U2)}`] : ['Otro estadístico', `W⁻ = ${f(s.Wm)}`],
      ['p-valor', f(s.p)],
      ['Método', s.exacto ? 'p-valor exacto' : 'Aproximación normal'],
      s.z === null ? ['Datos', s.tipo === 'mw' ? `${s.n1} y ${s.n2}` : `n = ${s.n}`] : ['z', f(s.z)],
    ],
    tabla: (s) => {
      if (s.tipo === 'mw') return `<table class="tabla-eco"><thead>${fila(['Dato', 'Muestra', 'Rango'], 'th')}</thead><tbody>${s.orden.map((q) => fila([f(q.v), String(q.g), f(q.r)])).join('')}</tbody><tfoot>${fila(['Suma de rangos', `R₁ = ${f(s.R1)}`, `R₂ = ${f(s.R2)}`])}</tfoot></table>`;
      const cab = s.tipo === 'pares' ? ['Primera', 'Segunda'] : ['Dato', 'Mediana H₀'];
      return `<table class="tabla-eco"><thead>${fila([...cab, 'd', '|d|', 'Rango con signo'], 'th')}</thead><tbody>${s.ds.map((q) => fila([f(q.a), f(q.b), f(q.d), f(Math.abs(q.d)), q.d === 0 ? 'se descarta' : `${q.d < 0 ? '−' : '+'}${f(q.r)}`])).join('')}</tbody><tfoot>${fila(['', '', '', `W⁺ = ${f(s.Wp)}`, `W⁻ = ${f(s.Wm)}`])}</tfoot></table>`;
    },
    grafica: (s) => {
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
    leyenda: (s) => s.tipo === 'mw'
      ? `<b style="color:var(--serie-1)">Azul</b>: los datos de cada muestra; <b style="color:var(--serie-2)">rojo</b>: su mediana. Si una muestra tiende a dar valores mayores, sus rangos suman más (R₁ = ${f(s.R1)}, R₂ = ${f(s.R2)}).`
      : `Cada barra es una diferencia, ordenada por tamaño: su altura es el rango de |d|. <b style="color:var(--serie-1)">Azul</b>: diferencias positivas (W⁺ = ${f(s.Wp)}); <b style="color:var(--serie-2)">rojo</b>: negativas (W⁻ = ${f(s.Wm)}). Si H₀ es cierta, las dos sumas se parecen.`,
  });
})();
