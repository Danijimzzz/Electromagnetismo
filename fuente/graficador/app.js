/* =====================================================================
   Interfaz del Graficador de funciones: las funciones y la ventana, el
   resumen del estudio de f, la gráfica (que se mueve arrastrando y se
   acerca con la rueda o los botones), la tabla de valores y el
   desarrollo. Se monta con Calculadora.monta (calculadora.js); el cálculo
   está en graficador/calculo.js (Graficador).
   ===================================================================== */
(() => {
  const G = Graficador, { f } = Calculadora, { $ } = Herramienta;
  const COLOR = { f: '--serie-1', g: '--serie-2', h: '--serie-3' };
  // en decimal y fuera de MathML, para que el modo práctica pueda preguntarlos
  const punto = (x, y) => `(${f(x)}, ${f(y)})`;
  // la curva en trozos: se corta donde no existe o donde salta (una asíntota vertical)
  function trozos(ev, x0, x1, y0, y1) {
    const out = [], n = 900, alto = y1 - y0;
    let tr = [], ya = NaN;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = ev(x);
      if (!isFinite(y) || (isFinite(ya) && Math.abs(y - ya) > 3 * alto && Math.sign(y) !== Math.sign(ya))) { if (tr.length > 1) out.push(tr); tr = []; }
      if (isFinite(y)) tr.push([x, Math.max(y0 - 2 * alto, Math.min(y1 + 2 * alto, y))]);
      ya = y;
    }
    if (tr.length > 1) out.push(tr);
    return out;
  }
  // polinomios con raíces enteras y racionales sencillas, para el modo práctica
  function azar() {
    const e = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), r = () => { let v; do v = e(-4, 4); while (!v); return v; };
    const tipo = e(0, 2), a = r(), b = r(), c = r();
    const lin = (p) => `(x ${p < 0 ? '+' : '−'} ${Math.abs(p)})`.replace('−', '-');
    const fx = tipo === 0 ? `x^3 ${-3 * a * a < 0 ? '-' : '+'} ${Math.abs(3 * a * a)}x` : tipo === 1 ? `${lin(a)}${lin(b === a ? -a : b)}` : `(x^2 + ${Math.abs(c)})/${lin(a)}`;
    return { f: fx, g: '', h: '', xmin: '-8', xmax: '8', ymin: '', ymax: '' };
  }
  let vista = null; // la última gráfica dibujada: { X, Y, w, h }
  const app = Calculadora.monta({
    C: G, carpeta: 'graficador', app: 'GraficadorApp', colores: ['--serie-3'], azar,
    enunciado: (sc, s) => Mates.html(`Haz el estudio de $f(x) = ${s ? s.fun[0].txt : sc.f}$: dominio, cortes con los ejes, asíntotas, máximos y mínimos y puntos de inflexión.`),
    nota: 'Escribe las funciones como en la calculadora: x^3 - 3x, sen(x), e^(-x^2), ln(x)/x, sqrt(4 - x^2), abs(x). Los límites de la ventana admiten pi y e (2pi, -pi/2). Arrastra la gráfica para moverla y usa la rueda o los botones para acercarla.',
    campos: () => [
      { k: 'f', nom: 'f(x) =', tipo: 'texto' }, { k: 'g', nom: 'g(x) =', tipo: 'texto', ayuda: 'opcional' }, { k: 'h', nom: 'h(x) =', tipo: 'texto', ayuda: 'opcional' },
      { k: 'xmin', nom: 'x mínimo', sep: 'Ventana' }, { k: 'xmax', nom: 'x máximo' },
      { k: 'ymin', nom: 'y mínimo', ayuda: 'vacío: automático' }, { k: 'ymax', nom: 'y máximo', ayuda: 'vacío: automático' },
    ],
    // solo lo que cae en la ventana, y como mucho cuatro puntos por casilla
    resumen: (s) => {
      const e = s.est, as = e.asTxt.length ? Mates.html(e.asTxt.map((t) => `$${t}$`).join(', ')) : 'ninguna';
      const ve = (q) => q.x >= s.x[0] - 1e-9 && q.x <= s.x[1] + 1e-9;
      const lista = (qs, txt) => { const v = qs.filter(ve); return v.length ? v.slice(0, 4).map(txt).join(', ') + (v.length > 4 ? ` y ${v.length - 4} más` : '') : 'ninguno en la ventana'; };
      return [
        ['Dominio de f', Mates.html(`$${e.dom}$`), true],
        ['Cortes con el eje x', lista(e.cortesX.map((x) => ({ x, y: 0 })), (q) => punto(q.x, 0))],
        ['Corte con el eje y', e.y0 === null ? 'ninguno' : punto(0, e.y0)],
        ['Asíntotas', as, true],
        ['Máximos y mínimos', lista(e.extremos, (q) => `${q.tipo === 'máximo' ? 'máx.' : 'mín.'} ${punto(q.x, q.y)}`), true],
        ['Puntos de inflexión', lista(e.infl, (q) => punto(q.x, q.y)), true],
        ...(s.fun.length > 1 ? [['Cortes entre las curvas', s.cortes.length ? s.cortes.slice(0, 4).map((q) => `${q.a} y ${q.b} en ${punto(q.x, q.y)}`).join(', ') + (s.cortes.length > 4 ? ` y ${s.cortes.length - 4} más` : '') : 'no se cortan en la ventana', true]] : []),
      ];
    },
    tabla: (s) => `<table class="tabla-eco"><thead><tr><th>x</th>${s.fun.map((q) => `<th>${q.k}(x)</th>`).join('')}</tr></thead><tbody>${s.tabla.map((r) => `<tr><td>${f(r.x, 5)}</td>${r.v.map((v) => `<td>${isFinite(v) ? f(v, 5) : 'no existe'}</td>`).join('')}</tr>`).join('')}</tbody></table>`,
    grafica: (s) => {
      const [x0, x1] = s.x, [y0, y1] = s.y, e = s.est, dentro = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
      const series = [];
      // asíntotas oblicuas, discontinuas por debajo de las curvas
      for (const q of e.asO) series.push({ pts: [[x0, q.m * x0 + q.n], [x1, q.m * x1 + q.n]], color: '--muted', grosor: 1.2, discontinua: true });
      for (const q of s.fun) for (const t of trozos(q.ev, x0, x1, y0, y1)) series.push({ pts: t, color: COLOR[q.k] });
      const pts = [...e.extremos, ...e.infl, ...e.cortesX.map((x) => ({ x, y: 0 })), ...(e.y0 === null ? [] : [{ x: 0, y: e.y0 }])].filter((q) => dentro(q.x, q.y));
      series.push({ tipo: 'puntos', pts: pts.map((q) => [q.x, q.y]), color: '--serie-1', radio: 4 });
      series.push({ tipo: 'puntos', pts: s.cortes.filter((q) => dentro(q.x, q.y)).map((q) => [q.x, q.y]), color: '--ink', radio: 4.5 });
      return { x: s.x, y: s.y, series, ejeX: 'x', ejeY: 'y',
        verticales: [...(x0 < 0 && x1 > 0 ? [{ x: 0, color: '--muted' }] : []), ...e.asV.filter((x) => x > x0 && x < x1).map((x) => ({ x, color: '--muted', texto: `x = ${f(x)}` }))],
        horizontales: e.asH.filter((q) => q.y > y0 && q.y < y1).map((q) => ({ y: q.y, color: '--muted', texto: `y = ${f(q.y)}` })) };
    },
    despues: (r) => { vista = r; },
    leyenda: (s) => `${s.fun.map((q) => `<b class="c-${q.k}">${q.k}(x)</b>`).join(', ')}. En gris discontinuo, las asíntotas; los puntos son los cortes con los ejes, los extremos y la inflexión de f${s.fun.length > 1 ? ', y en negro, los cortes entre las curvas' : ''}.`,
  });

  /* ---------- Mover y acercar la gráfica ---------- */
  const c = $('#grafica'), txt = (v) => String(+v.toPrecision(4)).replace('.', ',');
  const ventana = () => { const s = app.resultado(); return s ? { x: s.x, y: s.y } : null; };
  const pon = (x, y) => app.pon({ xmin: txt(x[0]), xmax: txt(x[1]), ymin: txt(y[0]), ymax: txt(y[1]) });
  // de un punto del lienzo a coordenadas (las escalas de la gráfica son lineales)
  const aDatos = (px, py, w) => { const kx = (vista.X(w.x[1]) - vista.X(w.x[0])) / (w.x[1] - w.x[0]), ky = (vista.Y(w.y[1]) - vista.Y(w.y[0])) / (w.y[1] - w.y[0]); return [w.x[0] + (px - vista.X(w.x[0])) / kx, w.y[0] + (py - vista.Y(w.y[0])) / ky]; };
  function zoom(k, px, py) {
    const w = ventana(); if (!w || !vista) return;
    const [cx, cy] = px === undefined ? [(w.x[0] + w.x[1]) / 2, (w.y[0] + w.y[1]) / 2] : aDatos(px, py, w);
    pon(w.x.map((v) => cx + (v - cx) * k), w.y.map((v) => cy + (v - cy) * k));
  }
  c.addEventListener('wheel', (e) => { e.preventDefault(); const b = c.getBoundingClientRect(); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, e.clientX - b.left, e.clientY - b.top); }, { passive: false });
  let arrastre = null;
  c.addEventListener('pointerdown', (e) => { const w = ventana(); if (!w || !vista) return; arrastre = { px: e.clientX, py: e.clientY, w }; c.setPointerCapture(e.pointerId); });
  c.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const { w } = arrastre, kx = (vista.X(w.x[1]) - vista.X(w.x[0])) / (w.x[1] - w.x[0]), ky = (vista.Y(w.y[1]) - vista.Y(w.y[0])) / (w.y[1] - w.y[0]);
    const dx = (e.clientX - arrastre.px) / kx, dy = (e.clientY - arrastre.py) / ky;
    pon(w.x.map((v) => v - dx), w.y.map((v) => v - dy));
  });
  for (const ev of ['pointerup', 'pointercancel']) c.addEventListener(ev, () => { arrastre = null; });
  const bot = document.createElement('div');
  bot.className = 'controles';
  bot.innerHTML = '<button class="btn" type="button" data-z="0.5">Acercar</button><button class="btn" type="button" data-z="2">Alejar</button><button class="btn" type="button" data-z="auto">Altura automática</button><button class="btn" type="button" data-z="ini">Ventana inicial</button>';
  c.after(bot);
  bot.addEventListener('click', (e) => {
    const z = e.target.dataset.z; if (!z) return;
    if (z === 'auto') app.pon({ ymin: '', ymax: '' });
    else if (z === 'ini') app.pon({ xmin: '-10', xmax: '10', ymin: '', ymax: '' });
    else zoom(+z);
  });
})();
