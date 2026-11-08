/* =====================================================================
   Interfaz de Elasticidades: el tipo (precio, renta, cruzada o demanda
   lineal), las dos situaciones o la recta de demanda, la gráfica (los dos
   puntos sobre la curva, o la recta con su tramo elástico e inelástico y
   el ingreso total) y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en elasticidades/calculo.js.
   ===================================================================== */
(() => {
  const E = Elasticidades, { f, num } = Eco;
  const NOM = { precio: ['Precio', 'P'], renta: ['Renta', 'R'], cruzada: ['Precio del otro bien', 'P_y'], oferta: ['Precio', 'P'] };
  Calculadora.monta({
    C: E, carpeta: 'elasticidades', app: 'ElasticidadesApp',
    nota: 'La cantidad es la demandada del bien que estudias. En la cruzada, el precio es el del otro bien. La coma es decimal.',
    campos: (sc) => {
      const cs = [{ k: 'tipo', nom: 'Elasticidad', tipo: 'sel', ops: Object.entries(E.TIPOS) }];
      if (sc.tipo === 'lineal') return [...cs, { k: 'a', nom: 'a (cantidad con precio 0)' }, { k: 'b', nom: 'b (unidades menos por cada euro)' }, { k: 'p', nom: 'Precio P', un: '€' }];
      if (sc.tipo === 'isoelastica') return [...cs, { k: 'lado', nom: 'Curva', tipo: 'sel', ops: [['demanda', 'Demanda Q = A·P^(−ε)'], ['oferta', 'Oferta Q = A·P^ε']] }, { k: 'A', nom: 'Constante A' }, { k: 'eps', nom: 'Elasticidad ε (en valor absoluto)' }, { k: 'p', nom: 'Precio P', un: '€' }];
      const [x] = NOM[sc.tipo] || NOM.precio;
      return [...cs, { k: 'x0', nom: `${x} inicial` }, { k: 'q0', nom: 'Cantidad inicial' }, { k: 'x1', nom: `${x} final` }, { k: 'q1', nom: 'Cantidad final' }];
    },
    resumen: (s) => (s.tipo === 'isoelastica'
      ? [['Elasticidad (en todo punto)', f(s.e, 4)], ['Tipo', s.clase], ['Cantidad', f(s.q, 6)], ['Ingreso total', num(s.it)]]
      : s.tipo === 'lineal'
      ? [['Elasticidad en el punto', f(s.e, 4)], ['Tipo', s.clase], ['Cantidad', f(s.q, 6)], ['Precio de ingreso máximo', num(s.pm)]]
      : [['Elasticidad de arco', f(s.ea, 4)], ['Sobre el valor inicial', f(s.e, 4)], ['Tipo', s.clase, true], ...(s.it0 === null ? [] : [['Ingreso total', `${num(s.it0)} → ${num(s.it1)}`, true]])]),
    grafica: (s) => {
      if (s.tipo === 'isoelastica') {
        const N = 80, ps = Array.from({ length: N + 1 }, (_, i) => s.p * (0.4 + (1.8 * i) / N)), pts = ps.map((P) => [s.A * P ** s.e, P]), qs = pts.map((q) => q[0]);
        return { x: Eco.rango(qs, { cero: true }), y: [0, ps[N] * 1.05], fx: (v) => f(v), fy: (v) => f(v), ejeX: 'Cantidad Q', ejeY: 'Precio P',
          series: [{ pts, color: '--serie-1' }, { tipo: 'area', pts: [[0, s.p], [s.q, s.p]], color: '--serie-3', alfa: 0.15 }, { tipo: 'puntos', pts: [[s.q, s.p]], color: '--serie-3', radio: 6 }] };
      }
      if (s.tipo === 'lineal') {
        // la recta de demanda en (Q, P): tramo elástico arriba, inelástico abajo
        const pmax = s.a / s.b, Q = (p) => s.a - s.b * p;
        return { x: [0, s.a * 1.05], y: [0, pmax * 1.08], fx: (v) => f(v), fy: (v) => f(v), ejeX: 'Cantidad Q', ejeY: 'Precio P',
          series: [{ pts: [[0, pmax], [Q(s.pm), s.pm]], color: '--serie-2', grosor: 3 }, { pts: [[Q(s.pm), s.pm], [s.a, 0]], color: '--serie-1', grosor: 3 }, { tipo: 'area', pts: [[0, s.p], [s.q, s.p]], color: '--serie-3', alfa: 0.15 }, { tipo: 'puntos', pts: [[s.q, s.p]], color: '--serie-3', radio: 6 }],
          horizontales: [{ y: s.pm, color: '--muted', texto: '|ε| = 1' }] };
      }
      const [, sx] = NOM[s.tipo], ejeY = s.tipo === 'precio' || s.tipo === 'oferta' ? 'Precio P' : s.tipo === 'renta' ? 'Renta R' : 'Precio del otro bien';
      const pts = [[s.q0, s.x0], [s.q1, s.x1]], xs = Eco.rango([s.q0, s.q1], { cero: true, aire: 0.25 }), ys = Eco.rango([s.x0, s.x1], { cero: true, aire: 0.25 });
      return { x: xs, y: ys, fx: (v) => f(v), fy: (v) => num(v, Math.abs(ys[1]) < 20 ? 2 : 0), ejeX: 'Cantidad Q', ejeY,
        series: [...(s.tipo === 'precio' || s.tipo === 'oferta' ? pts.map(([q, p]) => ({ tipo: 'area', pts: [[0, p], [q, p]], color: '--serie-3', alfa: 0.1 })) : []), { pts, color: '--serie-1' }, { tipo: 'puntos', pts: [pts[0]], color: '--serie-1', radio: 6 }, { tipo: 'puntos', pts: [pts[1]], color: '--serie-2', radio: 6 }],
        etiquetas: [{ x: s.q0, y: s.x0, texto: 'antes' }, { x: s.q1, y: s.x1, texto: 'después', color: '--serie-2' }] };
    },
    leyenda: (s) => (s.tipo === 'isoelastica' ? `<b>Curva</b>: ${s.lado} isoelástica; su elasticidad es ${f(s.e, 4)} en todos sus puntos. <b>Punto</b>: tu precio, con el rectángulo del ingreso total P · Q.` : s.tipo === 'lineal' ? '<b>Rojo</b>: tramo elástico (|ε| > 1). <b>Azul</b>: tramo inelástico. <b>Rectángulo</b>: el ingreso total P · Q en tu punto.' : s.tipo === 'precio' ? '<b>Puntos</b>: antes y después sobre la curva de demanda. <b>Rectángulos</b>: el ingreso total P · Q de cada uno.' : '<b>Puntos</b>: la cantidad antes y después del cambio.'),
  });
})();
