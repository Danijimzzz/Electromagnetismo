/* =====================================================================
   Interfaz de la Regresión lineal múltiple: la tabla de datos (una
   columna por variable y la Y al final), los niveles, una predicción, la
   tabla de coeficientes, la gráfica de valores observados frente a
   ajustados y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en regresion-multiple/calculo.js.
   ===================================================================== */
(() => {
  const C = RegresionMultiple, { f } = Calculadora;
  const fila = (cs, td = 'td') => `<tr>${cs.map((c) => `<${td}>${c}</${td}>`).join('')}</tr>`;
  // un plano con ruido, para el modo práctica
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), b0 = e(2, 10), b1 = e(2, 6), b2 = e(-4, -1);
    const datos = Array.from({ length: 8 }, (_, i) => { const x1 = i + 1 + e(0, 1), x2 = e(3, 12); return `${x1} ${x2} ${(b0 + b1 * x1 + b2 * x2 + (Math.random() - 0.5) * 3).toFixed(1).replace('.', ',')}`; }).join('\n');
    return { alfa: '0,05', nivel: '95', x0: '', datos: `x1 x2 y\n${datos}` };
  }
  Calculadora.monta({
    C, carpeta: 'regresion-multiple', app: 'RegresionMultipleApp', azar,
    campos: () => [
      { k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'una fila por observación: las variables X y la Y al final; una primera fila con los nombres es opcional', filas: 10 },
      { k: 'alfa', nom: 'Nivel de significación α', sep: 'Contrastes y predicción' },
      { k: 'nivel', nom: 'Nivel de confianza', un: '%' },
      { k: 'x0', nom: 'Predecir para X =', tipo: 'texto', ayuda: 'un valor por variable X, separados por espacios (opcional)' },
    ],
    enunciado: (sc, s) => s && `Con estos datos (una fila por observación, ${s.nv.slice(0, s.p).join(', ')} y ${s.nv[s.p]} al final, separadas por «;»): ${String(sc.datos).trim().split(/\r?\n/).map((l) => l.trim().replace(/\s+/g, ' ')).join('; ')}. Ajusta la regresión lineal múltiple de ${s.nv[s.p]} sobre ${s.nv.slice(0, s.p).join(', ')}: halla los coeficientes, R², R² ajustado y el contraste F global.`,
    nota: 'La coma es decimal. Hacen falta más observaciones que coeficientes (n > p + 1). Si dos variables explicativas están muy relacionadas (VIF alto), sus coeficientes son poco fiables.',
    resumen: (s) => [
      ['Plano ajustado', `Ŷ = ${f(s.b[0])}${s.b.slice(1).map((v, j) => ` ${v < 0 ? '−' : '+'} ${f(Math.abs(v))} X${j + 1}`).join('')}`, true],
      ['R²', s.R2.toFixed(4).replace('.', ',')],
      ['R² ajustado', s.R2aj.toFixed(4).replace('.', ',')],
      ['F global', `${f(s.Fg)} (p = ${Estadistica.prob(s.pF)})`],
      ['Error típico s', f(s.s)],
      ...(s.pred ? [['Predicción ŷ', `${f(s.pred.yh)} ± ${f(s.pred.eI)}`]] : []),
    ],
    tabla: (s) => {
      const cab = ['Variable', 'Coeficiente', 'Error típico', 't', 'p-valor', `IC ${f(s.nivel)} %`, 'VIF'];
      const cuerpo = s.coefs.map((q) => fila([q.nom, f(q.b), f(q.se), f(q.t), `${f(q.p)}${q.sig ? ' ✱' : ''}`, `(${f(q.lo)}; ${f(q.hi)})`, q.vif === null ? '' : f(q.vif, 3)])).join('');
      const ano = `<table class="tabla-eco" style="margin-top:14px"><thead>${fila(['Fuente', 'Suma de cuadrados', 'g. l.', 'Cuadrado medio', 'F', 'p-valor'], 'th')}</thead><tbody>${fila(['Regresión', f(s.SSR), String(s.p), f(s.SSR / s.p), f(s.Fg), f(s.pF)])}${fila(['Residuos', f(s.SSE), String(s.gl), f(s.s2), '', ''])}</tbody><tfoot>${fila(['Total', f(s.SST), String(s.n - 1), '', '', ''])}</tfoot></table>`;
      return `<table class="tabla-eco"><thead>${fila(cab, 'th')}</thead><tbody>${cuerpo}</tbody></table><p class="leyenda">✱ significativo con α = ${f(s.alfa)}. VIF = factor de inflación de la varianza: por encima de 5–10 hay multicolinealidad.</p>${ano}`;
    },
    grafica: (s) => {
      const v = [...s.y, ...s.ajust], lo = Math.min(...v), hi = Math.max(...v), aire = (hi - lo || 1) * 0.08;
      return { x: [lo - aire, hi + aire], y: [lo - aire, hi + aire], ejeX: 'Valor ajustado ŷ', ejeY: 'Valor observado y',
        series: [{ pts: [[lo - aire, lo - aire], [hi + aire, hi + aire]], color: '--serie-2', discontinua: true, grosor: 1.6 }, { tipo: 'puntos', pts: s.ajust.map((a, i) => [a, s.y[i]]), color: '--serie-1', radio: 4.5 }] };
    },
    leyenda: (s) => `Cada punto es una observación: valor ajustado por el modelo (eje horizontal) frente al observado (vertical). Sobre la recta discontinua y = ŷ el ajuste sería perfecto; cuanto más pegados, mayor es R² = ${s.R2.toFixed(4).replace('.', ',')}.`,
  });
})();
