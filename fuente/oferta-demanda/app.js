/* =====================================================================
   Interfaz de Oferta y demanda: las dos rectas, un precio fijado y los
   desplazamientos; la gráfica en (Q, P) con el equilibrio, la escasez o el
   excedente y las curvas desplazadas, y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en
   oferta-demanda/calculo.js.
   ===================================================================== */
(() => {
  const O = OfertaDemanda, { f, num } = Eco;
  // un mercado al azar con equilibrio entero, para el modo práctica
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const p = e(4, 30), q = e(4, 30) * 10, b = e(1, 5), d = e(1, 6);
    return { a: String(q + b * p), b: String(b), c: String(q - d * p), d: String(d), pf: '', da: '', dc: '' };
  }
  const ec = (sc) => `Qd = ${sc.a} − ${sc.b}P y Qs = ${String(sc.c).startsWith('-') ? `−${String(sc.c).slice(1)} + ` : sc.c === '0' ? '' : `${sc.c} + `}${sc.d}P`;
  Calculadora.monta({
    C: O, carpeta: 'oferta-demanda', app: 'OfertaDemandaApp', azar,
    usarEn: (s) => [{ carpeta: 'excedentes', texto: 'Usar en Excedentes e impuestos →', estado: { a: String(s.a), b: String(s.b), c: String(s.c), d: String(s.d), interv: 'ninguna', v: '' } }],
    enunciado: (sc) => `En un mercado, la demanda y la oferta son ${ec(sc)}. Calcula el precio y la cantidad de equilibrio y las elasticidades de la demanda y de la oferta en ese punto.`,
    nota: 'Demanda Qd = a − bP y oferta Qs = c + dP. Escribe las curvas como cantidad en función del precio (c puede ser negativo). Si te las dan al revés, P = α − βQ, despeja: a = α/β y b = 1/β. Los tres últimos datos son opcionales.',
    campos: (sc) => [
      { k: 'forma', nom: 'Forma de las curvas', tipo: 'sel', ops: Eco.FORMAS },
      ...Eco.camposCurvas(sc),
      { k: 'pf', nom: 'Precio fijado', un: '€', sep: 'Intervención y desplazamientos', ayuda: 'máximo o mínimo; vacío si no hay' },
      { k: 'da', nom: 'Desplazamiento de la demanda', ayuda: 'unidades más (o menos) a cada precio' },
      { k: 'dc', nom: 'Desplazamiento de la oferta', ayuda: 'unidades más (o menos) a cada precio' },
    ],
    resumen: (s) => [
      ['Precio de equilibrio', `P* = ${f(s.p, 5)}`], ['Cantidad de equilibrio', `Q* = ${f(s.q, 5)}`],
      ['Elasticidad de la demanda', f(s.ed, 3)], ['Elasticidad de la oferta', f(s.es, 3)],
      ...(s.control && s.control.tipo !== 'igual' ? [[s.control.dif > 0 ? 'Escasez (exceso de demanda)' : 'Excedente (exceso de oferta)', `${f(Math.abs(s.control.dif), 5)} unidades a ${f(s.control.pf, 5)} €`, true]] : []),
      ...(s.nuevo ? [['Nuevo equilibrio', `P = ${f(s.nuevo.p, 5)} y Q = ${f(s.nuevo.q, 5)}`, true]] : []),
    ],
    grafica: (s) => {
      const curvas = [[s.a, s.c], ...(s.nuevo ? [[s.nuevo.a, s.nuevo.c]] : [])];
      const pmax = Math.max(...curvas.map(([a]) => a / s.b)) * 1.05, qmax = Math.max(...curvas.map(([a]) => a), ...curvas.map(([, c]) => c + s.d * pmax)) * 1.02;
      const D = (a) => [[a, 0], [0, a / s.b]], S = (c) => [[Math.max(0, c), Math.max(0, -c / s.d)], [c + s.d * pmax, pmax]];
      const series = [{ pts: D(s.a), color: '--serie-1' }, { pts: S(s.c), color: '--serie-2' }];
      const etiquetas = [{ x: s.a * 0.9, y: (s.a * 0.1) / s.b, texto: 'D', color: '--serie-1' }, { x: s.c + s.d * pmax * 0.9, y: pmax * 0.9, texto: 'S', color: '--serie-2', alinea: 'right' }];
      if (s.nuevo) {
        if (s.nuevo.a !== s.a) { series.push({ pts: D(s.nuevo.a), color: '--serie-1', discontinua: true }); etiquetas.push({ x: s.nuevo.a * 0.9, y: (s.nuevo.a * 0.1) / s.b, texto: 'D₂', color: '--serie-1' }); }
        if (s.nuevo.c !== s.c) { series.push({ pts: S(s.nuevo.c), color: '--serie-2', discontinua: true }); etiquetas.push({ x: s.nuevo.c + s.d * pmax * 0.8, y: pmax * 0.8, texto: 'S₂', color: '--serie-2', alinea: 'right' }); }
        series.push({ pts: [[0, s.nuevo.p], [s.nuevo.q, s.nuevo.p], [s.nuevo.q, 0]], color: '--muted', grosor: 1, discontinua: true }, { tipo: 'puntos', pts: [[s.nuevo.q, s.nuevo.p]], color: '--serie-3', radio: 6 });
        etiquetas.push({ x: s.nuevo.q, y: s.nuevo.p, texto: 'E₂', color: '--serie-3' });
      }
      if (s.control && s.control.tipo !== 'igual') {
        const { pf, qd, qs } = s.control;
        series.push({ pts: [[0, pf], [Math.max(qd, qs) * 1.1, pf]], color: '--serie-3', grosor: 1.4, discontinua: true }, { pts: [[qs, pf], [qd, pf]], color: '--serie-3', grosor: 6 });
        etiquetas.push({ x: (qs + qd) / 2, y: pf, texto: qd > qs ? 'escasez' : 'excedente', color: '--serie-3', alinea: 'center' });
      }
      series.push({ pts: [[0, s.p], [s.q, s.p], [s.q, 0]], color: '--muted', grosor: 1, discontinua: true }, { tipo: 'puntos', pts: [[s.q, s.p]], color: '--ink', radio: 6 });
      etiquetas.push({ x: s.q, y: s.p, texto: 'E' });
      return { x: [0, qmax], y: [0, pmax], fx: (v) => f(v), fy: (v) => num(v, pmax < 20 ? 1 : 0), ejeX: 'Cantidad Q', ejeY: 'Precio P', series, etiquetas };
    },
    leyenda: (s) => `<b style="color:var(--serie-1)">D</b>: demanda; <b style="color:var(--serie-2)">S</b>: oferta; <b>E</b>: el equilibrio (${f(s.q, 5)} unidades a ${f(s.p, 5)} €).${s.nuevo ? ' En discontinua, las curvas desplazadas y el nuevo equilibrio E₂.' : ''}${s.control && s.control.tipo !== 'igual' ? ` El tramo grueso es ${s.control.dif > 0 ? 'la escasez' : 'el excedente'} al precio fijado.` : ''}`,
  });
})();
