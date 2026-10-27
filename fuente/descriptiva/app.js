/* =====================================================================
   Interfaz de Estadística descriptiva: los datos (lista, tabla o
   intervalos), la tabla de frecuencias, el histograma o el diagrama de
   barras con el diagrama de caja encima y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en
   descriptiva/calculo.js (Descriptiva).
   ===================================================================== */
(() => {
  const D = Descriptiva, { f } = Calculadora;
  const AYUDA = { lista: 'los datos separados por espacios, «;» o saltos de línea', tabla: 'una fila «x n» por valor', intervalos: 'una fila «Lᵢ Lₛ n» por intervalo' };
  // unas notas al azar, para el modo práctica
  function azar() {
    const n = 12 + Math.floor(Math.random() * 9), v = Array.from({ length: n }, () => Math.max(0, Math.min(10, Math.round(6 + 2 * (Math.random() + Math.random() + Math.random() - 1.5)))));
    return { formato: 'lista', datos: v.join(' '), div: 'n', pk: '' };
  }
  Calculadora.monta({
    C: D, carpeta: 'descriptiva', app: 'DescriptivaApp', azar,
    enunciado: (sc) => `Estas son las notas de ${sc.datos.split(/\s+/).length} alumnos: <b>${sc.datos}</b>. Calcula la media, la mediana, los cuartiles, la varianza y la desviación típica (dividiendo entre N) y el coeficiente de variación.`,
    nota: 'La coma es decimal. En las tablas, una fila por línea con los números separados por espacios, tabuladores o «;» (puedes pegarlos de una hoja de cálculo); se salta una primera fila con nombres.',
    campos: (sc) => [
      { k: 'formato', nom: 'Forma de los datos', tipo: 'sel', ops: Object.entries(D.FORMATOS) },
      { k: 'datos', nom: 'Datos', tipo: 'area', ayuda: AYUDA[sc.formato] || AYUDA.lista, filas: 7 },
      { k: 'div', nom: 'Varianza', tipo: 'sel', ops: [['n', 'De la población (entre N)'], ['n1', 'De una muestra (entre N − 1)']] },
      { k: 'pk', nom: 'Percentil k', un: 'opcional' },
    ],
    resumen: (s) => [
      ['Media x̄', f(s.media)], ['Mediana', f(s.Me)], ['Moda', s.moda.length ? s.moda.map((v) => f(v)).join(', ') : 'no hay'],
      ['Cuartiles Q₁ y Q₃', `${f(s.Q1)} y ${f(s.Q3)}`],
      [s.div === 'n1' ? 'Cuasivarianza s²' : 'Varianza σ²', f(s.varz)], [s.div === 'n1' ? 'Desviación típica s' : 'Desviación típica σ', f(s.sd)],
      ['Coeficiente de variación', isFinite(s.cv) ? `${f(100 * s.cv, 3)} %` : '—'], ['Rango intercuartílico', f(s.ric)],
      ...(s.P === null ? [] : [[`Percentil ${f(s.pk)}`, f(s.P)]]),
    ],
    tabla: (s) => {
      const ag = s.fmt === 'intervalos', g = (v) => f(v, 5);
      const cab = [...(ag ? ['Intervalo', 'xᵢ'] : ['xᵢ']), 'nᵢ', 'fᵢ', 'Nᵢ', 'Fᵢ', 'xᵢ·nᵢ', 'xᵢ²·nᵢ'];
      const fil = s.fil.map((r) => [...(ag ? [`[${g(r.li)}, ${g(r.ls)})`] : []), g(r.x), g(r.n), r.fr.toFixed(4).replace('.', ','), g(r.N), r.F.toFixed(4).replace('.', ','), g(r.x * r.n), g(r.x * r.x * r.n)]);
      const tot = [...(ag ? ['∑', ''] : ['∑']), g(s.N), '1', '', '', g(s.fil.reduce((a, r) => a + r.x * r.n, 0)), g(s.fil.reduce((a, r) => a + r.x * r.x * r.n, 0))];
      return `<table class="tabla-eco"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${fil.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr>${tot.map((c) => `<td>${c}</td>`).join('')}</tr></tfoot></table>`;
    },
    grafica: (s) => {
      const ag = s.fmt === 'intervalos';
      const paso = ag ? 0 : s.fil.length > 1 ? Math.min(...s.fil.slice(1).map((r, i) => r.x - s.fil[i].x)) : 1;
      // muchos valores distintos o muy separados: histograma con k = 1 + log₂ N intervalos iguales (Sturges)
      const sturges = !ag && (s.fil.length > 12 || (s.max - s.min) / paso > 25);
      let barras;
      if (ag) barras = s.fil.map((r) => ({ c: r.x, a: r.a, n: r.n }));
      else if (sturges) {
        const k = Math.ceil(1 + Math.log2(s.N)), a = (s.max - s.min) / k || 1;
        barras = Array.from({ length: k }, (_, i) => ({ c: s.min + (i + 0.5) * a, a, n: 0 }));
        for (const r of s.fil) barras[Math.min(k - 1, Math.floor((r.x - s.min) / a))].n += r.n;
      } else barras = s.fil.map((r) => ({ c: r.x, a: paso * 0.6, n: r.n, fina: true }));
      // con intervalos de distinta amplitud, la altura es la densidad nᵢ/aᵢ (el área es la frecuencia)
      const iguales = barras.every((b) => b.fina || Math.abs(b.a - barras[0].a) < 1e-9), alto = (b) => (iguales ? b.n : b.n / b.a);
      const x = barras[0].fina ? [s.min - paso, s.max + paso] : [s.min - 0.04 * (s.max - s.min), s.max + 0.04 * (s.max - s.min)];
      const series = barras.map((b) => ({ tipo: 'barras', ancho: b.fina ? b.a : b.a * 0.98, pts: [[b.c, alto(b)]], color: '--serie-1' }));
      return { x, y: [0, Math.max(...barras.map(alto)) * 1.45], series, ejeY: iguales ? 'nᵢ' : 'nᵢ / aᵢ (densidad)', verticales: [{ x: s.media, color: '--serie-2', texto: 'x̄' }], sturges };
    },
    // el diagrama de caja, en la franja de arriba
    despues: ({ X, g, h }, s, col) => {
      const y = 30, a = 9;
      g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.fillStyle = col['--serie-3']; g.globalAlpha = 0.35; g.fillRect(X(s.Q1), y - a, X(s.Q3) - X(s.Q1), 2 * a); g.globalAlpha = 1;
      g.strokeRect(X(s.Q1), y - a, X(s.Q3) - X(s.Q1), 2 * a);
      g.beginPath(); g.moveTo(X(s.Me), y - a); g.lineTo(X(s.Me), y + a); g.moveTo(X(s.bigoteI), y); g.lineTo(X(s.Q1), y); g.moveTo(X(s.Q3), y); g.lineTo(X(s.bigoteS), y);
      g.moveTo(X(s.bigoteI), y - a / 2); g.lineTo(X(s.bigoteI), y + a / 2); g.moveTo(X(s.bigoteS), y - a / 2); g.lineTo(X(s.bigoteS), y + a / 2); g.stroke();
      g.fillStyle = col['--serie-2']; for (const v of s.atipicos) { g.beginPath(); g.arc(X(v), y, 4, 0, 2 * Math.PI); g.fill(); }
    },
    leyenda: (s) => `${s.fmt === 'intervalos' ? '<b>Histograma</b> de los intervalos' : s.fil.length > 12 || (s.max - s.min) / Math.min(...s.fil.slice(1).map((r, i) => r.x - s.fil[i].x)) > 25 ? `<b>Histograma</b> con ${Math.ceil(1 + Math.log2(s.N))} intervalos iguales (regla de Sturges)` : '<b>Diagrama de barras</b> de las frecuencias'}, la <b>media</b> en línea discontinua y, arriba, el <b>diagrama de caja</b>: de Q₁ a Q₃ con la mediana dentro${s.atipicos.length ? ' y los atípicos como puntos' : ''}.`,
  });
})();
