/* =====================================================================
   Integrales múltiples: interfaz (integral doble en cartesianas y en
   polares; triple en cartesianas, cilíndricas y esféricas). Datos: el
   integrando y los límites de cada variable, de fuera adentro. La gráfica
   es la región (plano) o el sólido en perspectiva, que se gira arrastrando.
   El cálculo y el desarrollo están en integrales-multiples/calculo.js
   (IntegralesMultiples); las expresiones, en matematicas/expresion.js.
   Guarda el estado (sc) en localStorage[CLAVE]; expone
   window.IntegralesMultiplesApp para el modo práctica y las pruebas.
   ===================================================================== */
(() => {
  const { $, esc, copia, txt, marcas, lienzo } = Herramienta;
  const P = IntegralesMultiples, f = P.f, CLAVE = 'integrales-multiples-v1';
  const fH = (x, d = 4) => f(x, d).replace(/\^\{([^}]*)\}/, '<sup>$1</sup>');
  const MODOS = [['cart2', 'Integral doble · cartesianas'], ['polar', 'Integral doble · polares'], ['cart3', 'Integral triple · cartesianas'], ['cil', 'Integral triple · cilíndricas'], ['esf', 'Integral triple · esféricas']];
  const D3 = ['cart3', 'cil', 'esf'];

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, az = 0.7, el = 0.45, anda = false, arrastre = null;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, ay = '', larga = false) => `<label for="f-${k}">${nom}${ay ? ` <small>${ay}</small>` : ''}</label><input id="f-${k}" class="in${larga ? ' larga' : ''}" data-k="${k}" value="${esc(sc[k] ?? '')}" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  // una variable: «x desde … hasta …», con lo que pueden usar sus límites
  const rango = (v, ka, kb, ay = '') => `<div class="sep" style="text-transform:none">${v}${ay ? ` <small>${ay}</small>` : ''}</div>` + fila(ka, 'Desde', '', true) + fila(kb, 'Hasta', '', true);
  const NOTAS = {
    cart2: 'Escribe f con x e y (x^2 + y, e^(x y), sen x…). Los límites van de fuera adentro: los de la variable de fuera son números (se admite π) y los de la de dentro pueden depender de ella.',
    polar: 'Escribe f en x e y: la herramienta pasa a polares y añade el factor r. Para los límites, t es el ángulo θ y r el radio; los de r pueden depender de t (1 + cos t). Se admite π: 2π, π/2.',
    cart3: 'Se integra primero en z, luego en y y al final en x. Los límites de y pueden depender de x, y los de z de x e y. Escribe f con x, y, z.',
    cil: 'x = r cos θ, y = r sen θ. Límites: t es θ, r el radio y z la altura; r puede depender de t, y z de r y t. Escribe f en x, y, z: la herramienta añade el factor r.',
    esf: 'x = ρ sen φ cos θ, … con φ medido desde el eje z. Límites: t es θ (0 a 2π), f es φ (0 a π) y r es ρ; f puede depender de t, y r de f y t. Escribe f en x, y, z: se añade ρ² sen φ.',
  };
  function formulario() {
    const m = sc.modo;
    let h = elige('modo', 'Qué calcular', MODOS) + sep('Integrando') + fila('f', m === 'cart2' || m === 'polar' ? 'f(x, y) =' : 'f(x, y, z) =', 'f = 1 da el ' + (D3.includes(m) ? 'volumen' : 'área'), true);
    if (m === 'cart2') {
      const xy = sc.orden === 'xy', [o, i] = xy ? ['y', 'x'] : ['x', 'y'];
      h += elige('orden', 'Orden', [['yx', 'dy dx (primero y)'], ['xy', 'dx dy (primero x)']]) + sep('Región') + rango(`${o} (fuera)`, 'a', 'b', 'números') + rango(`${i} (dentro)`, 'g1', 'g2', `puede depender de ${o}`);
    } else if (m === 'polar') h += sep('Región') + rango('θ (fuera)', 'a', 'b', 'números; t = θ') + rango('r (dentro)', 'g1', 'g2', 'puede depender de t');
    else if (m === 'cart3') h += sep('Región') + rango('x (fuera)', 'a', 'b', 'números') + rango('y (medio)', 'g1', 'g2', 'puede depender de x') + rango('z (dentro)', 'h1', 'h2', 'puede depender de x e y');
    else if (m === 'cil') h += sep('Región') + rango('θ (fuera)', 'a', 'b', 'números; t = θ') + rango('r (medio)', 'g1', 'g2', 'puede depender de t') + rango('z (dentro)', 'h1', 'h2', 'puede depender de r y t');
    else h += sep('Región') + rango('θ (fuera)', 'a', 'b', 'números; t = θ') + rango('φ (medio)', 'g1', 'g2', 'f = φ; puede depender de t') + rango('ρ (dentro)', 'h1', 'h2', 'r = ρ; puede depender de f y t');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[m];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    if (t.dataset.k === 'modo') sc = copia(P.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else { sc[t.dataset.k] = t.value; if (t.dataset.k === 'orden') Object.assign(sc, t.value === 'xy' ? { a: '0', b: '1', g1: '0', g2: 'y' } : { a: '0', b: '1', g1: '0', g2: 'x' }); }
    formulario(); cambia();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${P.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  // un ejercicio al azar de los de clase, para el modo práctica
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), toma = (xs) => xs[ent(0, xs.length - 1)];
    const tipos = [
      () => ({ modo: 'cart2', orden: 'yx', f: toma(['x + y', 'x y', '2x - y', 'x^2 + y', 'x + 2y']), a: '0', b: String(ent(1, 3)), g1: '0', g2: String(ent(1, 3)) }),
      () => { const [b, g1, g2] = toma([[ent(1, 3), '0', 'x'], [ent(1, 3), '0', '2x'], [ent(1, 3), '0', 'x + 1'], [1, 'x^2', 'x'], [2, 'x^2', '2x']]); return { modo: 'cart2', orden: 'yx', f: toma(['x', 'y', 'x y', 'x + y', '1']), a: '0', b: String(b), g1, g2 }; },
      () => ({ modo: 'cart2', orden: 'xy', f: toma(['x + y', 'x y', 'y']), a: '0', b: String(ent(1, 3)), g1: '0', g2: toma(['y', '2y', 'y^2']) }),
      () => ({ modo: 'polar', f: toma(['1', 'x^2 + y^2', 'sqrt(x^2 + y^2)']), a: '0', b: toma(['2π', 'π', 'π/2']), g1: '0', g2: String(ent(1, 3)) }),
      () => ({ modo: 'polar', f: toma(['y', 'x y', 'x^2 + y^2', '1']), a: '0', b: toma(['π/2', 'π/2', 'π']), g1: String(ent(0, 1)), g2: String(ent(2, 3)) }),
      () => ({ modo: 'cart3', f: toma(['x + y + z', 'x y z', 'z', 'x y']), a: '0', b: String(ent(1, 2)), g1: '0', g2: String(ent(1, 3)), h1: '0', h2: String(ent(1, 3)) }),
      () => ({ modo: 'cart3', f: toma(['1', 'x', 'z']), a: '0', b: '1', g1: '0', g2: '1 - x', h1: '0', h2: '1 - x - y' }),
      () => ({ modo: 'cil', f: toma(['1', 'x^2 + y^2', 'z']), a: '0', b: '2π', g1: '0', g2: String(ent(1, 2)), h1: '0', h2: String(ent(1, 3)) }),
      () => ({ modo: 'cil', f: toma(['1', 'z']), a: '0', b: '2π', g1: '0', g2: String(ent(1, 2)), h1: '0', h2: 'r' }),
      () => ({ modo: 'esf', f: toma(['1', 'x^2 + y^2 + z^2']), a: '0', b: '2π', g1: '0', g2: 'π', h1: '0', h2: String(ent(1, 2)) }),
      () => ({ modo: 'esf', f: toma(['1', 'z', 'x^2 + y^2 + z^2']), a: '0', b: '2π', g1: '0', g2: 'π/2', h1: '0', h2: String(ent(1, 2)) }),
    ];
    sc = toma(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const m = sc.modo, n3 = D3.includes(m), I = n3 ? '∭' : '∬', dif = n3 ? 'dV' : 'dA', fx = `<b>${I} (${esc(sc.f)}) ${dif}</b>`;
    const r = (v, a, b) => `${v} de ${esc(a)} a ${esc(b)}`;
    if (m === 'cart2') {
      const xy = sc.orden === 'xy';
      return `Calcula ${fx} sobre la región con ${r(xy ? 'y' : 'x', sc.a, sc.b)} y ${r(xy ? 'x' : 'y', sc.g1, sc.g2)}. ¿Cuánto vale el ${'área'} de la región?`;
    }
    if (m === 'polar') return `Calcula ${fx} en la región con ${r('θ', sc.a, sc.b)} y ${r('r', sc.g1, sc.g2)}, pasando a polares. ¿Cuánto vale su área?`;
    if (m === 'cart3') return `Calcula ${fx} en la región con ${r('x', sc.a, sc.b)}, ${r('y', sc.g1, sc.g2)} y ${r('z', sc.h1, sc.h2)}. ¿Cuánto vale su volumen?`;
    if (m === 'cil') return `Calcula ${fx} en la región con ${r('θ', sc.a, sc.b)}, ${r('r', sc.g1, sc.g2)} y ${r('z', sc.h1, sc.h2)}, pasando a cilíndricas. ¿Cuánto vale su volumen?`;
    return `Calcula ${fx} en la región con ${r('θ', sc.a, sc.b)}, ${r('φ', sc.g1, sc.g2)} y ${r('ρ', sc.h1, sc.h2)}, pasando a esféricas. ¿Cuánto vale su volumen?`;
  };

  /* ---------- Cálculo ---------- */
  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span><b>${v}</b></div>`;
  const M = (s) => Mates.html(`$${s}$`);
  // decimal (lo que se pregunta en el modo práctica) y, si lo hay, el valor exacto al lado
  const nx = (x, d = 5) => { const e = P.ex(x, d); return e === f(x, d) ? fH(x, d) : `${fH(x, d)} <small>= ${M(e)}</small>`; };
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return;
    }
    err.hidden = true; guarda();
    const I = sol.doble ? '∬' : '∭';
    $('#resumen').innerHTML = dato(`${I} f ${sol.doble ? 'dA' : 'dV'}`, nx(sol.I), 'num')
      + (sol.medida > 1e-12 ? dato(sol.nombreMedida, nx(sol.medida), 'num') + dato('Valor medio de f', nx(sol.media), 'num') : '')
      + dato('Integral iterada', M(`${sol.itLinea}`), 'ancho');
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = sol.doble
      ? 'La región de integración (sombreada) y, en trazos finos, el barrido de la integral interior: por cada valor de la variable de fuera se recorre la variable de dentro entre sus dos límites.'
      : 'El sólido en perspectiva: la superficie de arriba (naranja), la de abajo (azul) y las aristas. Arrastra la gráfica para girarlo.';
    $('#animar').hidden = sol.doble;
    dibuja();
  }

  /* ---------- Gráfica ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--serie-1', '--serie-2']) col[k] = cs.getPropertyValue(k).trim(); }
  const mL = 40, mR = 14, mT = 12, mB = 26;
  function plano(g, w, h) {
    const filas = sol.malla(80), pts = filas.flatMap((q) => [q.lo, q.hi]);
    let x1 = Math.min(...pts.map((p) => p[0])), x2 = Math.max(...pts.map((p) => p[0])), y1 = Math.min(...pts.map((p) => p[1])), y2 = Math.max(...pts.map((p) => p[1]));
    const lado = Math.max(x2 - x1, y2 - y1, 1e-6) * 1.25, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, ax = w - mL - mR, ay = h - mT - mB, k = Math.max(lado / ax, lado / ay);
    x1 = cx - (ax * k) / 2; x2 = cx + (ax * k) / 2; y1 = cy - (ay * k) / 2; y2 = cy + (ay * k) / 2;
    const X = (x) => mL + ((x - x1) / (x2 - x1)) * ax, Y = (y) => h - mB - ((y - y1) / (y2 - y1)) * ay;
    g.font = '11px "IBM Plex Sans", system-ui, sans-serif'; g.lineWidth = 1; g.strokeStyle = col['--line']; g.fillStyle = col['--muted'];
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const v of marcas(x1, x2, Math.max(4, Math.round(w / 80)))) { g.beginPath(); g.moveTo(X(v), mT); g.lineTo(X(v), h - mB); g.stroke(); g.fillText(txt(fH(v, 3)), X(v), h - mB + 5); }
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of marcas(y1, y2, Math.max(4, Math.round(h / 55)))) { g.beginPath(); g.moveTo(mL, Y(v)); g.lineTo(w - mR, Y(v)); g.stroke(); g.fillText(txt(fH(v, 3)), mL - 5, Y(v)); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath();
    if (y1 < 0 && y2 > 0) { g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); }
    if (x1 < 0 && x2 > 0) { g.moveTo(X(0), mT); g.lineTo(X(0), h - mB); }
    g.stroke();
    g.fillText('x', w - mR - 2, Y(0) > h - mB - 12 ? h - mB - 12 : Y(0) - 8); g.textAlign = 'left'; g.fillText('y', X(0) + 6, mT + 6);
    // región: el borde de abajo de ida y el de arriba de vuelta
    g.beginPath();
    filas.forEach((q, i) => (i ? g.lineTo(X(q.lo[0]), Y(q.lo[1])) : g.moveTo(X(q.lo[0]), Y(q.lo[1]))));
    for (let i = filas.length - 1; i >= 0; i--) g.lineTo(X(filas[i].hi[0]), Y(filas[i].hi[1]));
    g.closePath(); g.fillStyle = col['--accent-soft']; g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
    g.strokeStyle = col['--ink']; g.lineWidth = 2.2; g.stroke();
    // barrido de la integral interior
    const paso = Math.max(1, Math.round(80 / 14)); g.strokeStyle = col['--serie-2']; g.lineWidth = 1.2; g.globalAlpha = 0.75;
    for (let i = paso; i < filas.length - 1; i += paso) { g.beginPath(); g.moveTo(X(filas[i].lo[0]), Y(filas[i].lo[1])); g.lineTo(X(filas[i].hi[0]), Y(filas[i].hi[1])); g.stroke(); }
    g.globalAlpha = 1;
  }
  // proyección en perspectiva ortográfica: giro az alrededor de z y elevación el
  const proy = (p) => { const c = Math.cos(az), s = Math.sin(az), xr = p[0] * c - p[1] * s, yr = p[0] * s + p[1] * c; return [xr, p[2] * Math.cos(el) + yr * Math.sin(el)]; };
  function solido(g, w, h) {
    const malla = sol.malla(14), n = malla.length - 1, todos = [];
    for (const fila of malla) for (const q of fila) { todos.push(q.lo, q.hi); }
    const mn = [0, 1, 2].map((i) => Math.min(...todos.map((p) => p[i]))), mx = [0, 1, 2].map((i) => Math.max(...todos.map((p) => p[i])));
    const c = mn.map((v, i) => (v + mx[i]) / 2), cen = (p) => [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    const ps = todos.map((p) => proy(cen(p))), ex = ps.map((p) => p[0]), ey = ps.map((p) => p[1]);
    const dx = Math.max(...ex) - Math.min(...ex), dy = Math.max(...ey) - Math.min(...ey), k = Math.min((w - 40) / Math.max(dx, 1e-9), (h - 30) / Math.max(dy, 1e-9));
    const ox = w / 2 - ((Math.max(...ex) + Math.min(...ex)) / 2) * k, oy = h / 2 + ((Math.max(...ey) + Math.min(...ey)) / 2) * k;
    const S = (p) => { const q = proy(cen(p)); return [ox + q[0] * k, oy - q[1] * k]; };
    const lo0 = malla.every((fila) => fila.every((q) => Math.hypot(q.lo[0] - q.hi[0], q.lo[1] - q.hi[1], q.lo[2] - q.hi[2]) < 1e-9));
    const hayLo = !malla.every((fila) => fila.every((q) => Math.hypot(...q.lo.map((v, i) => v - malla[0][0].lo[i])) < 1e-9));
    const linea = (pts, color, ancho, alfa) => { g.strokeStyle = color; g.lineWidth = ancho; g.globalAlpha = alfa; g.beginPath(); pts.forEach((p, i) => { const q = S(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke(); g.globalAlpha = 1; };
    const cara = (cl, color, ancho, alfa) => {
      for (let i = 0; i <= n; i++) {
        const dentro = i > 0 && i < n;
        if (!dentro || i % 2 === 0) linea(malla[i].map((q) => q[cl]), color, dentro ? ancho * 0.6 : ancho, alfa);
        if (!dentro || i % 2 === 0) linea(malla.map((fila) => fila[i][cl]), color, dentro ? ancho * 0.6 : ancho, alfa);
      }
    };
    if (!lo0) {
      if (hayLo) cara('lo', col['--serie-1'], 1.6, 0.6);
      cara('hi', col['--serie-2'], 1.6, 0.75);
      // aristas entre las dos caras por el borde del dominio (si abajo es un punto, como el centro de una esfera, no hay)
      if (hayLo) { g.strokeStyle = col['--ink']; g.lineWidth = 1.2; g.globalAlpha = 0.55;
      for (let i = 0; i <= n; i += 2) for (const [a, b] of [[i, 0], [i, n], [0, i], [n, i]]) { const q = malla[a][b], p0 = S(q.lo), p1 = S(q.hi); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
      g.globalAlpha = 1; }
    }
    // ejes x, y, z desde el origen
    const L = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) * 0.6, ejes = [['x', [L, 0, 0]], ['y', [0, L, 0]], ['z', [0, 0, L]]];
    g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'middle';
    const O = S([0, 0, 0]);
    for (const [nom, v] of ejes) { const q = S(v); g.strokeStyle = col['--muted']; g.lineWidth = 1.3; g.beginPath(); g.moveTo(O[0], O[1]); g.lineTo(q[0], q[1]); g.stroke(); g.fillText(nom, q[0] + (q[0] - O[0]) * 0.08, q[1] + (q[1] - O[1]) * 0.08); }
  }
  function dibuja() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol || !w || !h) return;
    if (sol.doble) plano(g, w, h); else solido(g, w, h);
  }
  const cv = $('#grafica');
  cv.addEventListener('pointerdown', (e) => { if (!sol || sol.doble) return; arrastre = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    az += (e.clientX - arrastre[0]) * 0.01; el = Math.max(-1.4, Math.min(1.4, el + (e.clientY - arrastre[1]) * 0.01)); arrastre = [e.clientX, e.clientY]; dibuja();
  });
  const suelta = () => { arrastre = null; };
  cv.addEventListener('pointerup', suelta); cv.addEventListener('pointercancel', suelta);
  cv.style.touchAction = 'pan-y'; cv.style.cursor = 'grab';
  $('#animar').addEventListener('click', () => { anda = !anda; $('#animar').textContent = anda ? '⏸ Parar' : '▶ Girar'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol && !sol.doble && !arrastre) { az += dt * 0.4; dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('integrales-multiples').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  Herramienta.exportar('#grafica', { nombre: 'integrales-multiples', titulo: 'Integrales múltiples', etiqueta: 'la región' });
  window.IntegralesMultiplesApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, I: sol.I, exacto: sol.exacto, medida: sol.medida, media: sol.media, simb: sol.simb, completo: sol.completo }, estado: () => copia(sc) };
})();
