/* =====================================================================
   Interfaz de Métodos numéricos: lo que se calcula, los datos, la gráfica
   (la curva con las iteraciones, la telaraña del punto fijo, los
   trapecios bajo la curva o las soluciones de la EDO), la tabla de
   iteraciones y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en metodos-numericos/calculo.js.
   ===================================================================== */
(() => {
  const MN = MetodosNumericos, { f } = MN, K = Calculadora;
  const n6 = (x) => f(x, 6), n9 = (x) => f(x, 9);
  const raices = (sc) => [{ k: 'tol', nom: 'Tolerancia', ayuda: 'p. ej. 1e-6' }, { k: 'nmax', nom: 'Máximo de iteraciones' }];
  // puntos de una función en [a, b], cortando donde no está definida o se dispara
  const curva = (ev, a, b, m = 300) => { const p = []; for (let j = 0; j <= m; j++) { const x = a + ((b - a) * j) / m, y = ev(x); if (isFinite(y)) p.push([x, y]); } return p; };
  const recorta = (pts, y0, y1) => pts.map(([x, y]) => [x, Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), y))]);
  // tabla con las filas de en medio resumidas si son muchas
  const tabla = (cab, filas, fila) => {
    const muchas = filas.length > 40, ver = muchas ? [...filas.slice(0, 20), null, ...filas.slice(-10)] : filas;
    return `<table class="tabla-eco"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${ver.map((q) => q ? `<tr>${fila(q).map((c) => `<td>${c}</td>`).join('')}</tr>` : `<tr><td colspan="${cab.length}">… ${filas.length - 30} filas más …</td></tr>`).join('')}</tbody></table>`;
  };
  const app = Calculadora.monta({
    C: MN, carpeta: 'metodos-numericos', app: 'MetodosNumericosApp',
    nota: 'Escribe las funciones como en la calculadora: x^3 - 2x - 5, cos x - x, e^(-x^2), sen x, ln(1+x), sqrt(x). Los números admiten coma decimal, 1e-6 y pi.',
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(MN.MODOS) }];
      if (sc.modo === 'newton') return [...cs, { k: 'fx', nom: 'f(x)', tipo: 'texto' }, { k: 'x0', nom: 'Punto inicial x₀' }, ...raices(sc)];
      if (sc.modo === 'secante') return [...cs, { k: 'fx', nom: 'f(x)', tipo: 'texto' }, { k: 'x0', nom: 'Punto x₀' }, { k: 'x1', nom: 'Punto x₁' }, ...raices(sc)];
      if (sc.modo === 'puntofijo') return [...cs, { k: 'gx', nom: 'g(x)', tipo: 'texto', ayuda: 'x = g(x)' }, { k: 'x0', nom: 'Punto inicial x₀' }, ...raices(sc)];
      if (sc.modo === 'integral') return [...cs, { k: 'fx', nom: 'f(x)', tipo: 'texto' }, { k: 'a', nom: 'Límite inferior a' }, { k: 'b', nom: 'Límite superior b' }, { k: 'n', nom: 'Subintervalos n' }];
      if (sc.modo === 'edo') return [...cs, { k: 'fxy', nom: 'y′ = f(x, y)', tipo: 'texto' }, { k: 'x0', nom: 'x₀' }, { k: 'y0', nom: 'y(x₀)' }, { k: 'h', nom: 'Paso h' }, { k: 'xf', nom: 'Hasta x =' },
        { k: 'metodo', nom: 'Método', tipo: 'sel', ops: Object.entries(MN.METODOS) }, { k: 'exacta', nom: 'Solución exacta', tipo: 'texto', ayuda: '(opcional, para comparar)' }];
      return [...cs, { k: 'fx', nom: 'f(x)', tipo: 'texto' }, { k: 'a', nom: 'Extremo a' }, { k: 'b', nom: 'Extremo b' }, ...raices(sc)];
    },
    resumen: (s) => {
      if (s.modo === 'integral') return [['Simpson', s.par ? n9(s.S) : 'necesita n par', true], ['Trapecios', n9(s.T)], ['Referencia', isFinite(s.ref) ? n9(s.ref) : '—'], ['Paso h', n6(s.h)]];
      if (s.modo === 'edo') return [[`y(${f(s.xf)}) por ${MN.METODOS[s.met]}`, n9(s.y), true], ...(s.ex ? [['Solución exacta', n9(s.yex)], ['Error', f(Math.abs(s.y - s.yex), 3)]] : []), ['Pasos', String(s.N)]];
      const r = [['Raíz aproximada', s.conv ? n9(s.x) : 'no converge', true], ['Iteraciones', String(s.filas.length)], ['f(x)', n6(s.modo === 'puntofijo' ? s.F.ev(s.x) : s.fx)]];
      return s.modo === 'puntofijo' ? [...r.slice(0, 2), ["g′(x)", n6(s.dg)]] : [...r, ['Último error', f(s.err, 3)]];
    },
    tabla: (s) => {
      if (s.modo === 'biseccion') return tabla(['n', 'a', 'b', 'c = (a + b)/2', 'f(c)', '(b − a)/2'], s.filas, (q) => [q.n, n9(q.a), n9(q.b), n9(q.c), n6(q.fc), f(q.err, 3)]);
      if (s.modo === 'newton') return tabla(['n', 'xₙ', 'f(xₙ)', 'f′(xₙ)', 'xₙ₊₁', '|xₙ₊₁ − xₙ|'], s.filas, (q) => [q.n, n9(q.x), n6(q.fx), n6(q.dx), n9(q.x1), f(q.err, 3)]);
      if (s.modo === 'secante') return tabla(['n', 'xₙ₋₁', 'xₙ', 'f(xₙ)', 'xₙ₊₁', '|xₙ₊₁ − xₙ|'], s.filas, (q) => [q.n, n9(q.xa), n9(q.x), n6(q.fx), n9(q.x1), f(q.err, 3)]);
      if (s.modo === 'puntofijo') return tabla(['n', 'xₙ', 'xₙ₊₁ = g(xₙ)', '|xₙ₊₁ − xₙ|'], s.filas, (q) => [q.n, n9(q.x), n9(q.x1), f(q.err, 3)]);
      if (s.modo === 'integral') return tabla(['i', 'xᵢ', 'f(xᵢ)', 'Peso trapecios', 'Peso Simpson'], s.filas, (q) => [q.i, n6(q.x), n9(q.y), q.wt, s.par ? q.ws : '—']);
      return tabla(['n', 'xₙ', 'Euler', 'Heun', 'Runge-Kutta 4', ...(s.ex ? ['Exacta'] : [])], s.filas, (q) => [q.i, n6(q.x), n9(q.euler), n9(q.heun), n9(q.rk4), ...(s.ex ? [n9(q.ex)] : [])]);
    },
    grafica: (s) => {
      if (s.modo === 'integral') {
        const c = curva(s.F.ev, s.a, s.b), y = K.rango([...c.map((p) => p[1]), 0]);
        return { x: [s.a, s.b], y, ejeX: 'x', ejeY: 'f(x)', series: [{ tipo: 'area', pts: s.filas.map((q) => [q.x, q.y]), color: '--serie-2', alfa: 0.22 }, { pts: s.filas.map((q) => [q.x, q.y]), color: '--serie-2', grosor: 1.6 }, { pts: c, color: '--serie-1' }, { tipo: 'puntos', pts: s.filas.map((q) => [q.x, q.y]), color: '--serie-2', radio: 3.5 }],
          verticales: s.filas.length <= 41 ? s.filas.slice(1, -1).map((q) => ({ x: q.x })) : [] };
      }
      if (s.modo === 'edo') {
        const xs = [s.x0, s.xf], todo = ['euler', 'heun', 'rk4'].flatMap((m) => s.ys[m]), ex = s.ex ? curva(s.ex.ev, s.x0, s.xf) : [];
        const y = K.rango([...todo, ...ex.map((p) => p[1])]), pts = (m) => s.ys[m].map((v, i) => [s.x0 + i * s.h, v]);
        return { x: xs, y, ejeX: 'x', ejeY: 'y', series: [...(s.ex ? [{ pts: ex, color: '--muted', grosor: 5 }] : []), { pts: pts('euler'), color: '--serie-2' }, { pts: pts('heun'), color: '--serie-3' }, { pts: pts('rk4'), color: '--serie-1', discontinua: true }, { tipo: 'puntos', pts: pts(s.met), color: s.met === 'euler' ? '--serie-2' : s.met === 'heun' ? '--serie-3' : '--serie-1', radio: 3 }] };
      }
      if (s.modo === 'puntofijo') {
        // telaraña: de (xₙ, xₙ) sube a (xₙ, g(xₙ)) y va a la diagonal
        const xs = [s.x0, ...s.filas.map((q) => q.x1)], x = K.rango(xs, { aire: 0.25 }), c = curva(s.G.ev, x[0], x[1]), tela = [[s.x0, x[0] < 0 && x[1] > 0 ? 0 : s.x0]];
        for (const q of s.filas.slice(0, 30)) tela.push([q.x, q.x1], [q.x1, q.x1]);
        return { x, y: x, ejeX: 'x', ejeY: 'y', series: [{ pts: [[x[0], x[0]], [x[1], x[1]]], color: '--muted', grosor: 1.4 }, { pts: recorta(c, x[0], x[1]), color: '--serie-1' }, { pts: tela, color: '--serie-2', grosor: 1.5 }, { tipo: 'puntos', pts: [[s.x, s.x]], color: '--serie-2', radio: 5 }] };
      }
      // raíces: la curva, las iteraciones sobre el eje y, en Newton, las tangentes
      const xs = s.modo === 'biseccion' ? [s.a0, s.b0] : [s.x0, ...(s.modo === 'secante' ? [s.x1] : []), ...s.filas.map((q) => q.x1)].filter((v) => isFinite(v) && Math.abs(v) < 1e6);
      const x = K.rango(xs, { aire: 0.3 }), c = curva(s.F.ev, x[0], x[1]), y = K.rango(c.map((p) => p[1]), { cero: true });
      const it = s.filas.slice(0, 12), puntos = s.modo === 'biseccion' ? it.map((q) => [q.c, 0]) : it.map((q) => [q.x, 0]);
      const lineas = s.modo === 'newton' ? it.map((q) => ({ pts: [[q.x, 0], [q.x, q.fx], [q.x1, 0]], color: '--serie-2', grosor: 1.3 })) : s.modo === 'secante' ? it.map((q) => ({ pts: [[q.xa, s.F.ev(q.xa)], [q.x, q.fx], [q.x1, 0]], color: '--serie-2', grosor: 1.3 })) : [];
      return { x, y, ejeX: 'x', ejeY: 'f(x)', series: [{ pts: recorta(c, y[0], y[1]), color: '--serie-1' }, ...lineas, { tipo: 'puntos', pts: puntos, color: '--serie-2', radio: 3.5 }, ...(s.conv ? [{ tipo: 'puntos', pts: [[s.x, 0]], color: '--serie-3', radio: 6 }] : [])],
        verticales: s.modo === 'biseccion' ? [{ x: s.a0, texto: 'a' }, { x: s.b0, texto: 'b' }] : [] };
    },
    leyenda: (s) => ({
      biseccion: '<b>Curva</b>: f(x). <b>Puntos</b>: los puntos medios de las primeras iteraciones, cada vez más juntos. <b>Punto grande</b>: la raíz.',
      newton: '<b>Curva</b>: f(x). <b>Líneas</b>: en cada xₙ se sube a la curva y se baja por la tangente hasta el eje, que da xₙ₊₁. <b>Punto grande</b>: la raíz.',
      secante: '<b>Curva</b>: f(x). <b>Líneas</b>: la secante por los dos últimos puntos corta el eje en el siguiente. <b>Punto grande</b>: la raíz.',
      puntofijo: '<b>Curva</b>: g(x). <b>Diagonal</b>: y = x. <b>Telaraña</b>: de cada xₙ se sube a g(xₙ) y se va a la diagonal; el punto fijo es el corte.',
      integral: '<b>Curva</b>: f(x). <b>Zona sombreada</b>: los trapecios, cuya área es la regla de los trapecios. <b>Puntos</b>: los nodos.',
    }[s.modo] || `<b>Rojo</b>: Euler. <b>Morado</b>: Heun. <b>Azul discontinua</b>: Runge-Kutta 4.${s.ex ? ' <b>Gris ancha</b>: la solución exacta.' : ''}`),
  });
  // PNG y datos de la gráfica: las filas de la tabla del método elegido
  Herramienta.exportar('#grafica', { nombre: 'metodos-numericos', titulo: 'Métodos numéricos', etiqueta: 'la gráfica', datos: () => {
    const s = app.resultado();
    if (!s || !s.filas) return null;
    if (s.modo === 'biseccion') return { cab: ['n', 'a', 'b', 'c', 'f(c)', '(b − a)/2'], filas: s.filas.map((q) => [q.n, q.a, q.b, q.c, q.fc, q.err]) };
    if (s.modo === 'newton') return { cab: ['n', 'xₙ', 'f(xₙ)', 'f′(xₙ)', 'xₙ₊₁', 'error'], filas: s.filas.map((q) => [q.n, q.x, q.fx, q.dx, q.x1, q.err]) };
    if (s.modo === 'secante') return { cab: ['n', 'xₙ₋₁', 'xₙ', 'f(xₙ)', 'xₙ₊₁', 'error'], filas: s.filas.map((q) => [q.n, q.xa, q.x, q.fx, q.x1, q.err]) };
    if (s.modo === 'puntofijo') return { cab: ['n', 'xₙ', 'xₙ₊₁', 'error'], filas: s.filas.map((q) => [q.n, q.x, q.x1, q.err]) };
    if (s.modo === 'integral') return { cab: ['i', 'xᵢ', 'f(xᵢ)'], filas: s.filas.map((q) => [q.i, q.x, q.y]) };
    return { cab: ['n', 'xₙ', 'Euler', 'Heun', 'RK4', ...(s.ex ? ['exacta'] : [])], filas: s.filas.map((q) => [q.i, q.x, q.euler, q.heun, q.rk4, ...(s.ex ? [q.ex] : [])]) };
  } });
})();
