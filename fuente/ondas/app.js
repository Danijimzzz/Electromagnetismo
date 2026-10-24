/* =====================================================================
   Ondas mecánicas: interfaz (modo, datos, resultado, animación y
   desarrollo). El cálculo está en ondas/fisica.js (Ondas).
   ===================================================================== */
(() => {
  const $ = (q) => document.querySelector(q);
  const O = Ondas, f = O.f, CLAVE = 'ondas-v1';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const txt = (h) => String(h).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '');
  const MODOS = [['armonica', 'Onda armónica'], ['estacionaria', 'Ondas estacionarias'], ['doppler', 'Efecto Doppler'], ['sonido', 'Intensidad y nivel sonoro']];

  let sc = copia(O.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {}, anda = true;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const sep = (t) => `<div class="sep">${t}</div>`;
  function formulario() {
    let h = `<label for="f-modo">Qué calcular</label><select id="f-modo" class="in" data-k="modo">${opciones('modo', MODOS)}</select>`;
    if (sc.modo === 'armonica') {
      h += fila('A', 'Amplitud A', 'm') + fila('f', 'Frecuencia f', 'Hz') + fila('v', 'Velocidad de propagación v', 'm/s') + `<label for="f-sentido">Sentido</label><select id="f-sentido" class="in" data-k="sentido">${opciones('sentido', [['+', 'Hacia x positivas'], ['-', 'Hacia x negativas']])}</select>` + fila('fase', 'Fase inicial φ', 'rad');
      h += sep('Un punto del medio (opcional)') + fila('x0', 'Posición x', 'm') + fila('t0', 'Instante t', 's') + fila('dx', 'Desfase con un punto a Δx', 'm');
      $('#nota').textContent = 'La fase admite π: por ejemplo π/2 o 3pi/4.';
    } else if (sc.modo === 'estacionaria') {
      h += `<label for="f-medio">Medio</label><select id="f-medio" class="in" data-k="medio">${opciones('medio', [['cuerda', 'Cuerda con los dos extremos fijos'], ['abierto', 'Tubo abierto por los dos extremos'], ['cerrado', 'Tubo cerrado por un extremo']])}</select>` + fila('L', 'Longitud L', 'm');
      h += sc.medio === 'cuerda' ? fila('tension', 'Tensión T', 'N') + fila('mu', 'Densidad lineal μ', 'kg/m') : fila('vs', 'Velocidad del sonido', 'm/s');
      h += fila('n', sc.medio === 'cerrado' ? 'Modo n (armónico 2n − 1)' : 'Armónico n', '');
      $('#nota').textContent = sc.medio === 'cuerda' ? 'μ es la masa por unidad de longitud: 1,1 g/m = 0,0011 kg/m.' : 'En el dibujo se ve el desplazamiento del aire: nodos donde no se mueve.';
    } else if (sc.modo === 'doppler') {
      h += fila('f', 'Frecuencia que emite la fuente', 'Hz') + fila('vs', 'Velocidad del sonido', 'm/s') + fila('vF', 'Velocidad de la fuente', 'm/s') + fila('vO', 'Velocidad del observador', 'm/s');
      $('#nota').textContent = 'Positivas si se acercan el uno al otro, negativas si se alejan.';
    } else {
      h += fila('P', 'Potencia de la fuente', 'W') + fila('r1', 'Distancia r₁', 'm') + fila('r2', 'Otra distancia r₂', 'm') + fila('N', 'Número de fuentes iguales', '');
      $('#nota').textContent = 'Fuente puntual que emite igual en todas las direcciones, sin reflexiones ni absorción.';
    }
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') sc = copia(O.ejemplos.find((x) => x.sc.modo === t.value).sc);
    if (t.dataset.k === 'medio') { const ej = O.ejemplos.find((x) => x.sc.medio === t.value); for (const [k, v] of Object.entries(ej.sc)) if (vacioC(sc[k])) sc[k] = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });
  const vacioC = (v) => v === undefined || v === null || String(v).trim() === '';

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + O.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = O.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = O.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'armonica') {
      h = dato('Ecuación', `<b>${sol.ec}</b>`) + dato('λ y T', `λ = ${f(sol.lam)} m, T = ${f(sol.T)} s`) + (sol.punto ? dato(`Punto x = ${f(sol.punto.x0)} m, t = ${f(sol.punto.t0)} s`, `y = ${f(sol.punto.y)} m, v<sub>y</sub> = ${f(sol.punto.vy)} m/s`) : '');
      ley = 'Animación a cámara lenta: un periodo dura unos 3 s. El punto rojo es el de x pedido.';
    } else if (sol.modo === 'estacionaria') {
      h = dato(sol.medio === 'cerrado' ? `Modo ${sol.n} (armónico ${sol.m})` : `Armónico ${sol.n}`, `f = <b>${f(sol.fn)} Hz</b>, λ = ${f(sol.lam)} m`) + dato('Fundamental', `${f(sol.freqs[0])} Hz`) + dato('Velocidad', `v = ${f(sol.v)} m/s`);
      ley = 'Nodos en rojo y vientres en azul; en gris, la envolvente.';
    } else if (sol.modo === 'doppler') {
      h = dato('Frecuencia que se oye', `f′ = <b>${f(sol.fp)} Hz</b>`) + dato('Cambio', `${sol.fp >= sol.fr ? '+' : '−'}${f(Math.abs(sol.fp - sol.fr))} Hz (${f((100 * (sol.fp - sol.fr)) / sol.fr, 3)} %)`);
      ley = 'Frentes de onda de la fuente (izquierda) que llegan al observador (derecha), a cámara lenta.';
    } else {
      h = dato(`A ${f(sol.r1)} m`, `I = ${f(sol.I1)} W/m<sup>2</sup>, <b>β = ${f(sol.b1)} dB</b>`) + (sol.r2 ? dato(`A ${f(sol.r2)} m`, `I = ${f(sol.I2)} W/m<sup>2</sup>, <b>β = ${f(sol.b2)} dB</b>`) : '');
      ley = 'Escala de niveles sonoros con algunos sonidos de referencia.';
    }
    $('#res').innerHTML = h; $('#leyenda').textContent = ley;
    $('#play').hidden = sol.modo === 'sonido';
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pausa' : '▶ Seguir'; if (anda) bucle(); });

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--cuerpo', '--suelo']) col[k] = cs.getPropertyValue(k).trim(); }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  let tAnim = 0;
  function dibuja() {
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    if (!col['--ink']) colores();
    const fase = tAnim; // en periodos
    if (sol.modo === 'armonica') {
      const m = 20, cy = h / 2, amp = h * 0.32, X = 2 * sol.lam, sx = (w - 2 * m) / X;
      g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(m, cy); g.lineTo(w - m, cy); g.stroke();
      for (let j = 0; j <= 4; j++) { const x = m + (j * sol.lam) / 2 * sx; g.beginPath(); g.moveTo(x, cy - 4); g.lineTo(x, cy + 4); g.stroke(); texto(g, x, cy + amp + 18, ['0', 'λ/2', 'λ', '3λ/2', '2λ'][j], col['--muted']); }
      const y = (x) => Math.sin(2 * Math.PI * fase + (sol.mas ? -1 : 1) * sol.k * x + sol.fase);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
      for (let i = 0; i <= 400; i++) { const x = (X * i) / 400, py = cy - amp * y(x); i ? g.lineTo(m + x * sx, py) : g.moveTo(m + x * sx, py); }
      g.stroke();
      if (sol.punto && sol.punto.x0 >= 0 && sol.punto.x0 <= X) { const px = m + sol.punto.x0 * sx, py = cy - amp * y(sol.punto.x0); g.fillStyle = col['--peso']; g.beginPath(); g.arc(px, py, 5, 0, 2 * Math.PI); g.fill(); }
      // sentido de propagación
      const yf = 18, dir = sol.mas ? 1 : -1;
      g.strokeStyle = col['--muted']; g.fillStyle = col['--muted']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(w / 2 - 30 * dir, yf); g.lineTo(w / 2 + 30 * dir, yf); g.stroke();
      g.beginPath(); g.moveTo(w / 2 + 36 * dir, yf); g.lineTo(w / 2 + 28 * dir, yf - 5); g.lineTo(w / 2 + 28 * dir, yf + 5); g.closePath(); g.fill();
      texto(g, w / 2 + 48 * dir, yf, `v = ${txt(f(sol.v))} m/s`, col['--muted'], dir > 0 ? 'left' : 'right');
      texto(g, m, cy - amp - 10, `A = ${txt(f(sol.A))} m`, col['--muted'], 'left');
    } else if (sol.modo === 'estacionaria') {
      const m = 24, cy = h / 2, amp = h * 0.3, L = sol.L, sx = (w - 2 * m) / L;
      // tubos: paredes
      if (sol.medio !== 'cuerda') {
        g.fillStyle = col['--cuerpo']; g.fillRect(m, cy - amp - 16, w - 2 * m, 8); g.fillRect(m, cy + amp + 8, w - 2 * m, 8);
        if (sol.medio === 'cerrado') g.fillRect(m - 8, cy - amp - 16, 8, 2 * amp + 32);
      } else { g.fillStyle = col['--suelo']; g.fillRect(m - 6, cy - 30, 6, 60); g.fillRect(w - m, cy - 30, 6, 60); }
      const k = (2 * Math.PI) / sol.lam, forma = (x) => (sol.medio === 'cuerda' ? Math.sin(k * x) : sol.medio === 'abierto' ? Math.cos(k * x) : Math.sin(k * x));
      g.strokeStyle = col['--line']; g.lineWidth = 1.2;
      for (const s of [1, -1]) { g.beginPath(); for (let i = 0; i <= 300; i++) { const x = (L * i) / 300, py = cy - s * amp * forma(x); i ? g.lineTo(m + x * sx, py) : g.moveTo(m + x * sx, py); } g.stroke(); }
      const c2 = Math.cos(2 * Math.PI * fase);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
      for (let i = 0; i <= 300; i++) { const x = (L * i) / 300, py = cy - amp * forma(x) * c2; i ? g.lineTo(m + x * sx, py) : g.moveTo(m + x * sx, py); }
      g.stroke();
      for (const x of sol.nodos) { g.fillStyle = col['--peso']; g.beginPath(); g.arc(m + x * sx, cy, 4.5, 0, 2 * Math.PI); g.fill(); }
      for (const x of sol.vientres) { g.fillStyle = col['--accent']; g.beginPath(); g.arc(m + x * sx, cy, 3, 0, 2 * Math.PI); g.fill(); }
      texto(g, w / 2, h - 10, `L = ${txt(f(sol.L))} m · λ = ${txt(f(sol.lam))} m · f = ${txt(f(sol.fn))} Hz`, col['--muted']);
    } else if (sol.modo === 'doppler') {
      // a escala: la fuente va de izquierda a derecha si se acerca; el observador a la derecha
      const cy = h / 2, sx0 = w * 0.3, ox = w * 0.82, pxs = Math.min(w, h) * 0.08, beta = sol.vF / sol.v;
      const t = (fase * 3) % 9, xF = (tt) => sx0 + beta * pxs * tt;
      g.lineWidth = 1.5;
      for (let j = Math.floor(t); j >= 0; j--) {
        const r = (t - j) * pxs; if (r <= 0) continue;
        g.strokeStyle = col['--accent']; g.globalAlpha = Math.max(0.15, 1 - (t - j) / 9); g.beginPath(); g.arc(xF(j), cy, r, 0, 2 * Math.PI); g.stroke();
      }
      g.globalAlpha = 1;
      g.fillStyle = col['--peso']; g.beginPath(); g.arc(xF(t), cy, 7, 0, 2 * Math.PI); g.fill(); texto(g, xF(t), cy + 20, 'fuente', col['--peso']);
      g.fillStyle = col['--normal']; g.beginPath(); g.arc(ox, cy, 7, 0, 2 * Math.PI); g.fill(); texto(g, ox, cy + 20, 'observador', col['--normal']);
      texto(g, 12, 16, `f = ${txt(f(sol.fr))} Hz → f′ = ${txt(f(sol.fp))} Hz`, col['--ink'], 'left', '600 ');
    } else {
      const m = 30, y = h / 2, x = (b) => m + (Math.max(0, Math.min(140, b)) / 140) * (w - 2 * m);
      const grad = g.createLinearGradient(m, 0, w - m, 0); grad.addColorStop(0, col['--normal']); grad.addColorStop(0.6, col['--accent']); grad.addColorStop(1, col['--peso']);
      g.fillStyle = grad; g.fillRect(m, y - 6, w - 2 * m, 12);
      const ref = [[0, 'umbral'], [30, 'susurro'], [60, 'conversación'], [85, 'tráfico'], [110, 'concierto'], [130, 'dolor']];
      ref.forEach(([b, t], i) => { g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(x(b), y + 8); g.lineTo(x(b), y + 16); g.stroke(); texto(g, x(b), y + 26 + (i % 2) * 14, `${b} dB ${t}`, col['--muted'], i ? 'center' : 'left'); });
      [[sol.b1, sol.r1], [sol.b2, sol.r2]].forEach(([b, r], i) => {
        if (b === null || b === undefined) return;
        g.fillStyle = col['--ink']; g.beginPath(); g.moveTo(x(b), y - 9); g.lineTo(x(b) - 7, y - 21); g.lineTo(x(b) + 7, y - 21); g.closePath(); g.fill();
        g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(x(b), y - 21); g.lineTo(x(b), y - 28 - i * 18); g.stroke();
        texto(g, x(b), y - 34 - i * 18, `${txt(f(b, 3))} dB a ${txt(f(r))} m`, col['--ink'], 'center', '600 ');
      });
    }
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = (ahora - ultimo) / 1000; ultimo = ahora;
    if (anda && sol && sol.modo !== 'sonido') { tAnim += dt / 3; dibuja(); requestAnimationFrame(bucle); } else if (anda) requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('ondas').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.OndasApp = { abrirEjemplo, resultado: () => sol && { modo: sol.modo, ec: sol.ec, fn: sol.fn, fp: sol.fp, b1: sol.b1 }, estado: () => copia(sc), pausa: () => { anda = false; } };
})();
