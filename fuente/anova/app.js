/* =====================================================================
   Interfaz de ANOVA de un factor: los grupos (una línea cada uno), el
   nivel de significación y las comparaciones por parejas; la tabla ANOVA,
   los puntos de cada grupo con su media y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en anova/calculo.js.
   ===================================================================== */
(() => {
  const C = Anova, { f } = Calculadora;
  const fila = (cs, td = 'td') => `<tr>${cs.map((c) => `<${td}>${c}</${td}>`).join('')}</tr>`;
  // tres grupos al azar con medias algo separadas, para el modo práctica
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), base = e(10, 30), sep = e(0, 4);
    const datos = ['A', 'B', 'C'].map((n, i) => `${n}: ${Array.from({ length: 5 }, () => base + i * sep + e(-3, 3)).join(' ')}`).join('\n');
    return { alfa: '0,05', post: 'no', datos };
  }
  const lineas = (sc) => String(sc.datos || '').trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join('; ');
  Calculadora.monta({
    C, carpeta: 'anova', app: 'AnovaApp', campos: () => [
      { k: 'alfa', nom: 'Nivel de significación α' },
      { k: 'post', nom: 'Comparaciones por parejas', tipo: 'sel', ops: Object.entries(C.POST) },
      { k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'un grupo por línea, con su nombre antes de «:» si quieres; valores separados por espacios', filas: 7 },
    ], azar,
    enunciado: (sc, s) => s && `Se han medido tres o más grupos (cada grupo separado por «;»): ${lineas(sc)}. Con α = ${sc.alfa}, contrasta con un ANOVA de un factor si las medias son iguales: calcula la tabla ANOVA, F, el valor crítico y el p-valor.`,
    nota: 'La hipótesis nula es que todas las medias son iguales. Se supone que cada grupo es aproximadamente normal y que las varianzas son parecidas.',
    resumen: (s) => [
      ['Decisión', s.rechaza ? 'Se rechaza H₀' : 'No se rechaza H₀', true],
      ['Estadístico', `F = ${f(s.F)}`],
      ['Grados de libertad', `${s.glB} y ${s.glW}`],
      ['Valor crítico', f(s.crit)],
      ['p-valor', f(s.pv)],
      ['η² (tamaño del efecto)', f(s.eta2, 3)],
    ],
    tabla: (s) => {
      const ano = `<table class="tabla-eco"><thead>${fila(['Fuente', 'Suma de cuadrados', 'g. l.', 'Cuadrado medio', 'F', 'p-valor'], 'th')}</thead><tbody>${fila(['Entre grupos', f(s.SSB), String(s.glB), f(s.MSB), f(s.F), f(s.pv)])}${fila(['Dentro de los grupos', f(s.SSW), String(s.glW), f(s.MSW), '', ''])}</tbody><tfoot>${fila(['Total', f(s.SST), String(s.N - 1), '', '', ''])}</tfoot></table>`;
      const gr = `<table class="tabla-eco" style="margin-top:14px"><thead>${fila(['Grupo', 'n', 'Media', 'Varianza'], 'th')}</thead><tbody>${s.g.map((q) => fila([q.nom, String(q.n), f(q.m), f(q.s2)])).join('')}</tbody></table>`;
      const pa = s.post ? `<table class="tabla-eco" style="margin-top:14px"><thead>${fila(['Pareja', 'Diferencia', 't', 'p (Bonferroni)', 'Medias'], 'th')}</thead><tbody>${s.pares.map((p) => fila([`${p.a} − ${p.b}`, f(p.dif), f(p.t), f(p.p), p.sig ? 'diferentes' : '—'])).join('')}</tbody></table>` : '';
      return ano + gr + pa;
    },
    grafica: (s) => {
      const todos = s.g.flatMap((q) => q.x), lo = Math.min(...todos), hi = Math.max(...todos), aire = (hi - lo || 1) * 0.12, k = s.k;
      return { x: [0.4, k + 0.6], y: [lo - aire, hi + aire], ejeX: 'Grupo', ejeY: 'Valor', fx: (v) => (Number.isInteger(v) && v >= 1 && v <= k ? s.g[v - 1].nom : ''),
        series: [...s.g.map((q, i) => ({ tipo: 'puntos', pts: q.x.map((v, j) => [i + 1 + (j - (q.n - 1) / 2) * 0.05, v]), color: '--serie-1', radio: 4 })),
          ...s.g.map((q, i) => ({ pts: [[i + 0.7, q.m], [i + 1.3, q.m]], color: '--serie-2', grosor: 3 }))],
        horizontales: [{ y: s.media, color: '--muted' }] };
    },
    leyenda: (s) => `<b style="color:var(--serie-1)">Azul</b>: los datos de cada grupo; <b style="color:var(--serie-2)">rojo</b>: su media; línea discontinua: la media global ${f(s.media)}. Cuanto más separadas están las medias respecto de la dispersión de dentro de cada grupo, mayor es F = ${f(s.F)}, que ${s.rechaza ? 'supera' : 'no supera'} el valor crítico ${f(s.crit)}.`,
  });
})();
