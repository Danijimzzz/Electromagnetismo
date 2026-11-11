/* =====================================================================
   Interfaz de Curva de Lorenz e índice de Gini: cómo vienen los datos
   (rentas sueltas, tramos o grupos), la curva de Lorenz con la diagonal de
   la igualdad, la tabla de proporciones acumuladas y el desarrollo. Se
   monta con Calculadora.monta (calculadora.js); el cálculo está en
   lorenz-gini/calculo.js.
   ===================================================================== */
(() => {
  const LG = LorenzGini, { f, num } = Eco;
  const pc = (x) => `${f(100 * x, 4)} %`;
  const AYUDA = { rentas: 'las rentas separadas por espacios', tramos: 'una fila «personas renta media» por tramo', grupos: 'una fila «% población % renta» por grupo' };
  Calculadora.monta({
    C: LG, carpeta: 'lorenz-gini', app: 'LorenzGiniApp', azar: LG.azar, enunciado: LG.enunciado,
    nota: 'El orden da igual: se ordenan de menos a más renta. La coma es decimal; en una fila, separa los números con espacios o «;».',
    campos: (sc) => [{ k: 'modo', nom: 'Tipo de datos', tipo: 'sel', ops: Object.entries(LG.MODOS) }, { k: 'datos', nom: 'Datos', tipo: 'area', ayuda: AYUDA[sc.modo] || AYUDA.rentas, filas: 8 }],
    resumen: (s) => [['Índice de Gini', f(s.G, 4), true], ['Con Σ(p − q)/Σp', f(s.Gc, 4)], ['20 % más pobre', pc(s.s20)], ['20 % más rico', pc(s.s80)], ['S80/S20', isFinite(s.ratio) ? f(s.ratio, 4) : '—']],
    tabla: (s) => `<table class="tabla-eco"><thead><tr><th>${s.modo === 'rentas' ? 'Persona' : 'Grupo'}</th><th>${s.modo === 'grupos' ? '% renta / % pobl.' : 'Renta por persona'}</th><th>p</th><th>q</th><th>p − q</th></tr></thead><tbody>${s.filas.map((r, k) => `<tr><td>${k + 1}</td><td>${s.modo === 'grupos' ? f(r.x, 4) : num(r.x, r.x % 1 ? 2 : 0)}</td><td>${f(r.p, 4)}</td><td>${f(r.q, 4)}</td><td>${f(r.p - r.q, 4)}</td></tr>`).join('')}</tbody></table>`,
    grafica: (s) => {
      const pts = [[0, 0], ...s.filas.map((r) => [r.p, r.q])], fp = (v) => `${Math.round(100 * v)} %`;
      return { x: [0, 1], y: [0, 1], fx: fp, fy: fp, ejeX: 'Población acumulada p', ejeY: 'Renta acumulada q',
        series: [{ tipo: 'area', pts: [[0, 0], [1, 1]], color: '--serie-2', alfa: 0.2 }, { tipo: 'area', pts, color: '--serie-1', alfa: 0.25 }, { pts: [[0, 0], [1, 1]], color: '--muted', discontinua: true, grosor: 1.5 }, { pts, color: '--serie-1' }, { tipo: 'puntos', pts, color: '--serie-1' }],
        etiquetas: [{ x: 0.5, y: 0.5, texto: 'igualdad', color: '--muted', alinea: 'right' }] };
    },
    leyenda: () => '<b>Discontinua</b>: la diagonal, reparto igualitario. <b>Azul</b>: la curva de Lorenz. <b>Zona roja</b>: la desigualdad; el índice de Gini es el doble de su área.',
  });
})();
