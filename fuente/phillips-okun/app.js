/* =====================================================================
   Interfaz de Curva de Phillips y ley de Okun: lo que se calcula, los
   datos, la gráfica (la recta de Okun, la brecha de producción, la curva
   de Phillips a corto y largo plazo, o la nube de puntos con su recta) y
   el desarrollo. Se monta con Calculadora.monta (calculadora.js); el
   cálculo está en phillips-okun/calculo.js.
   ===================================================================== */
(() => {
  const PO = PhillipsOkun, { f, num } = Eco;
  const pc = (v) => `${f(v)} %`;
  Calculadora.monta({
    C: PO, carpeta: 'phillips-okun', app: 'PhillipsOkunApp',
    nota: (sc) => 'Paro, crecimiento e inflación en %. Para un valor negativo, escribe el signo menos (−1).' + (sc.modo === 'datos' ? ' <b>Los datos del ejemplo están inventados</b> (no son de ningún país real): sustitúyelos por los tuyos.' : ''),
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(PO.MODOS) }];
      if (sc.modo === 'brecha') return [...cs, { k: 'u', nom: 'Paro u', un: '%' }, { k: 'un', nom: 'Paro natural uₙ', un: '%' }, { k: 'c', nom: 'Coeficiente de Okun c', ayuda: '(suele ser 2 o 3)' }, { k: 'Yp', nom: 'PIB potencial (opcional)', un: 'miles de millones de €' }];
      if (sc.modo === 'phillips') return [...cs, { k: 'pe', nom: 'Inflación esperada πᵉ', un: '%' }, { k: 'alfa', nom: 'Pendiente α' }, { k: 'un', nom: 'Paro natural uₙ', un: '%' }, { k: 'u', nom: 'Paro u', un: '%' }, { k: 's', nom: 'Shock de oferta s', un: 'puntos' }];
      if (sc.modo === 'datos') return [...cs, { k: 'datos', nom: 'Datos', tipo: 'area', ayuda: 'una fila «paro inflación» por año', filas: 10 }];
      cs.push({ k: 'busca', nom: 'Buscar', tipo: 'sel', ops: [['paro', 'El paro con un crecimiento'], ['crecimiento', 'El crecimiento para un paro']] }, { k: 'u0', nom: 'Paro de partida u₀', un: '%' });
      cs.push(sc.busca === 'crecimiento' ? { k: 'u1', nom: 'Paro que se quiere u₁', un: '%' } : { k: 'g', nom: 'Crecimiento del PIB g', un: '%' });
      return [...cs, { k: 'gp', nom: 'Crecimiento potencial gₚ', un: '%' }, { k: 'beta', nom: 'Coeficiente de Okun β', ayuda: '(suele ser 0,3 a 0,5)' }];
    },
    resumen: (s) => {
      if (s.modo === 'okun') return s.busca === 'crecimiento' ? [['Crecimiento necesario', pc(s.g), true], ['Por encima del potencial', `${f(s.g - s.gp)} puntos`]] : [['Paro al final', pc(s.u1), true], ['Variación', `${s.du > 0 ? '+' : ''}${f(s.du)} puntos`]];
      if (s.modo === 'brecha') return [['Brecha de producción', pc(s.br), true], ['Paro cíclico', `${f(s.u - s.un)} puntos`], ...(s.Y === null ? [] : [['PIB', `${num(s.Y, 1)} mil millones €`]])];
      if (s.modo === 'phillips') return [['Inflación', pc(s.pi), true], ['Frente a la esperada', `${s.pi - s.pe > 0 ? '+' : ''}${f(s.pi - s.pe)} puntos`]];
      return [['Recta', `π = ${f(s.a, 4)} ${s.b < 0 ? '−' : '+'} ${f(Math.abs(s.b), 4)} u`, true], ['Pendiente', f(s.b, 4)], ['Correlación r', f(s.r, 4)]];
    },
    grafica: (s) => {
      if (s.modo === 'okun') {
        const L = (g) => -s.b * (g - s.gp), x = [Math.min(s.gp - 5, s.g - 1), Math.max(s.gp + 5, s.g + 1)];
        return { x, y: Eco.rango([L(x[0]), L(x[1]), 0]), ejeX: 'Crecimiento del PIB g (%)', ejeY: 'Variación del paro Δu (puntos)',
          series: [{ pts: x.map((g) => [g, L(g)]), color: '--serie-1' }, { tipo: 'puntos', pts: [[s.g, s.du]], color: '--serie-2', radio: 6 }],
          verticales: [{ x: s.gp, texto: 'gₚ' }], horizontales: [{ y: 0 }] };
      }
      if (s.modo === 'brecha') {
        const x = [0, Math.max(2 * s.un, s.u + 2)], L = (u) => -s.c * (u - s.un);
        return { x, y: Eco.rango([L(x[0]), L(x[1]), 0]), ejeX: 'Paro u (%)', ejeY: 'Brecha de producción (%)',
          series: [{ pts: x.map((u) => [u, L(u)]), color: '--serie-1' }, { tipo: 'puntos', pts: [[s.u, s.br]], color: '--serie-2', radio: 6 }], verticales: [{ x: s.un, texto: 'uₙ' }], horizontales: [{ y: 0 }] };
      }
      if (s.modo === 'phillips') {
        const x = [0, Math.max(2 * s.un, s.u + 2)], CP = (u, sh) => s.pe - s.a * (u - s.un) + sh;
        return { x, y: Eco.rango([CP(x[0], 0), CP(x[1], 0), CP(x[0], s.s), CP(x[1], s.s), 0]), ejeX: 'Paro u (%)', ejeY: 'Inflación π (%)',
          series: [{ pts: x.map((u) => [u, CP(u, 0)]), color: '--serie-1' }, ...(s.s ? [{ pts: x.map((u) => [u, CP(u, s.s)]), color: '--serie-3', discontinua: true }] : []), { tipo: 'puntos', pts: [[s.u, s.pi]], color: '--serie-2', radio: 6 }],
          verticales: [{ x: s.un, texto: 'largo plazo' }], horizontales: [{ y: s.pe, texto: 'πᵉ' }] };
      }
      const xs = s.pts.map(([x]) => x), x = Eco.rango(xs);
      return { x, y: Eco.rango(s.pts.map(([, y]) => y).concat(x.map((u) => s.a + s.b * u))), ejeX: 'Paro u (%)', ejeY: 'Inflación π (%)',
        series: [{ pts: x.map((u) => [u, s.a + s.b * u]), color: '--serie-1' }, { tipo: 'puntos', pts: s.pts, color: '--serie-2', radio: 5 }] };
    },
    leyenda: (s) => ({ okun: '<b>Recta</b>: la ley de Okun; el paro baja a la derecha de gₚ y sube a la izquierda. <b>Punto</b>: tu caso.', brecha: '<b>Recta</b>: la brecha de producción según el paro. <b>Punto</b>: tu caso.', phillips: `<b>Azul</b>: curva de Phillips a corto plazo. <b>Vertical</b>: a largo plazo, en el paro natural.${s.s ? ' <b>Discontinua</b>: la curva desplazada por el shock.' : ''} <b>Punto</b>: tu caso.`, datos: '<b>Puntos</b>: cada año. <b>Recta</b>: la de mínimos cuadrados.' }[s.modo]),
  });
})();
