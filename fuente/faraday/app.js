/* =====================================================================
   Inducción (Faraday y Lenz): interfaz (modo, datos, resultado,
   animación con la gráfica de Φ y ε y desarrollo). El cálculo está en
   faraday/fisica.js (Faraday).
   ===================================================================== */
(() => {
  const { $, esc, copia } = Herramienta;
  const F = Faraday, f = F.f, CLAVE = 'faraday-v1';
  const txt = (h) => String(h).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '');
  const MODOS = [['barra', 'Barra sobre raíles'], ['giratoria', 'Bobina que gira (alternador)'], ['flujo', 'Flujo que cambia en un tiempo'], ['cruza', 'Espira que atraviesa un campo']];

  let sc = copia(F.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {}, anda = true;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const sentidoB = () => elige('sentidoB', 'Sentido de B', [['entrante', '⊗ Entrante (hacia la pantalla)'], ['saliente', '⊙ Saliente']]);
  const forma = () => elige('forma', 'Forma de la espira', [['circulo', 'Circular (radio r)'], ['rectangulo', 'Rectangular (a × b)'], ['area', 'Doy la superficie S']]) + (sc.forma === 'circulo' ? fila('r', 'Radio r', 'm') : sc.forma === 'rectangulo' ? fila('a', 'Lado a', 'm') + fila('b', 'Lado b', 'm') : fila('S', 'Superficie S', 'm²'));
  function formulario() {
    let h = elige('modo', 'Situación', MODOS);
    if (sc.modo === 'barra') {
      h += fila('B', 'Campo B', 'T') + sentidoB() + fila('L', 'Longitud de la barra L', 'm') + fila('v', 'Velocidad v', 'm/s') + fila('R', 'Resistencia R (opcional)', 'Ω');
      $('#nota').textContent = 'v positiva hacia la derecha (el circuito se cierra por la resistencia de la izquierda) y negativa hacia la izquierda.';
    } else if (sc.modo === 'giratoria') {
      h += fila('N', 'Número de espiras N', '') + fila('B', 'Campo B', 'T') + forma() + fila('w', 'Velocidad de giro', '') + elige('uw', 'Unidad', [['Hz', 'Hz (vueltas por segundo)'], ['rpm', 'rpm'], ['rad/s', 'rad/s']]) + sep('Opcional') + fila('R', 'Resistencia R', 'Ω') + fila('t', 'Instante t', 's');
      $('#nota').textContent = 'En t = 0 la espira es perpendicular a B, con el flujo máximo.';
    } else if (sc.modo === 'flujo') {
      h += fila('N', 'Número de espiras N', '') + forma() + sentidoB() + sep('Antes y después') + fila('B1', 'Campo inicial B₁', 'T') + fila('B2', 'Campo final B₂', 'T') + fila('th1', 'Ángulo inicial θ₁', '°') + fila('th2', 'Ángulo final θ₂', '°') + fila('dt', 'Tiempo que tarda Δt', 's') + fila('R', 'Resistencia R (opcional)', 'Ω');
      $('#nota').textContent = 'θ es el ángulo entre B y la normal a la espira. Si B₂ o θ₂ se dejan vacíos, no cambian.';
    } else {
      h += fila('N', 'Número de espiras N', '') + fila('a', 'Lado de la espira cuadrada a', 'm') + fila('D', 'Anchura de la región con campo D', 'm') + fila('v', 'Velocidad v', 'm/s') + fila('B', 'Campo B', 'T') + sentidoB() + fila('R', 'Resistencia R (opcional)', 'Ω');
      $('#nota').textContent = 'La espira avanza hacia la derecha con velocidad constante y entra por el borde izquierdo de la región.';
    }
    $('#campos').innerHTML = h;
  }
  const vacioC = (v) => v === undefined || v === null || String(v).trim() === '';
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') sc = copia(F.ejemplos.find((x) => x.sc.modo === t.value).sc);
    if (t.dataset.k === 'forma') { const d = { circulo: { r: '0.05' }, rectangulo: { a: '0.1', b: '0.2' }, area: { S: '0.01' } }[t.value]; for (const [k, v] of Object.entries(d)) if (vacioC(sc[k])) sc[k] = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + F.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = F.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = F.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tAnim = 0;
    let h = '', ley = '';
    if (sol.modo === 'barra') {
      h = dato('Fem inducida', `ε = <b>${f(sol.eps)} V</b>`) + dato('Sentido de la corriente', `<b>${sol.sentido}</b>`) + (sol.I !== null ? dato('Corriente', `I = <b>${f(sol.I)} A</b>`) + dato('Fuerza que frena la barra', `F = ${f(sol.F)} N`) : '');
      ley = 'Flechas rojas: corriente inducida. Verde: velocidad de la barra; naranja: fuerza magnética sobre ella.';
    } else if (sol.modo === 'giratoria') {
      h = dato('Fem máxima', `ε<sub>máx</sub> = <b>${f(sol.em)} V</b>`) + dato('Fem eficaz', `ε<sub>ef</sub> = ${f(sol.ef)} V`) + dato('Flujo máximo', `Φ<sub>máx</sub> = ${f(sol.Fm)} Wb`) + (sol.Im !== null ? dato('Corriente máxima', `I<sub>máx</sub> = ${f(sol.Im)} A`) : '') + (sol.et !== null ? dato(`ε en t = ${f(sol.t)} s`, `${f(sol.et)} V`) : '');
      ley = 'A cámara lenta: una vuelta dura 3 s. Abajo, Φ(t) en azul y ε(t) en rojo: la fem es máxima cuando el flujo pasa por 0.';
    } else if (sol.modo === 'flujo') {
      h = dato('Variación del flujo', `ΔΦ = ${f(sol.dF)} Wb`) + dato('Fem media', `ε = <b>${f(sol.em)} V</b>`) + dato('Sentido de la corriente', `<b>${sol.sentido}</b>`) + (sol.I !== null ? dato('Corriente y carga', `I = ${f(sol.I)} A, q = ${f(sol.q)} C`) : '');
      ley = 'El tamaño de los símbolos indica la intensidad del campo; la espira se ve inclinada si cambia el ángulo. A la derecha, Φ(t).';
    } else {
      h = dato('Fem al entrar y al salir', `|ε| = <b>${f(sol.eps)} V</b>`) + dato('Sentido', `entra: <b>${sol.tramos[0].sentido}</b>, sale: <b>${sol.tramos[2].sentido}</b>`) + (sol.I !== null ? dato('Corriente', `I = ${f(sol.I)} A`) + dato('Calor disipado', `Q = ${f(sol.Q)} J`) : '');
      ley = 'Abajo, Φ(t) en azul y ε(t) en rojo: solo hay fem mientras cambia la parte de la espira que está dentro del campo.';
    }
    $('#res').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    dibuja();
  }
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pausa' : '▶ Seguir'; if (anda) { ultimo = performance.now(); bucle(); } });

  /* ---------- Dibujo ---------- */
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--cuerpo', '--suelo']) col[k] = cs.getPropertyValue(k).trim(); }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  function flecha(g, x1, y1, x2, y2, color, ancho = 2) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = ancho; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - 7 * Math.cos(a), y2 - 7 * Math.sin(a)); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 10 * Math.cos(a) + 5 * Math.sin(a), y2 - 10 * Math.sin(a) - 5 * Math.cos(a)); g.lineTo(x2 - 10 * Math.cos(a) - 5 * Math.sin(a), y2 - 10 * Math.sin(a) + 5 * Math.cos(a)); g.closePath(); g.fill();
  }
  // punta de flecha sola en (x, y) apuntando en el ángulo a
  function punta(g, x, y, a, color) { g.fillStyle = color; g.beginPath(); g.moveTo(x + 6 * Math.cos(a), y + 6 * Math.sin(a)); g.lineTo(x - 6 * Math.cos(a) + 5 * Math.sin(a), y - 6 * Math.sin(a) - 5 * Math.cos(a)); g.lineTo(x - 6 * Math.cos(a) - 5 * Math.sin(a), y - 6 * Math.sin(a) + 5 * Math.cos(a)); g.closePath(); g.fill(); }
  // símbolos ⊗ / ⊙ de B en una rejilla
  function campo(g, x0, y0, x1, y1, entrante, esc = 1, paso = 34) {
    const r = 6 * esc;
    if (r < 0.6) return;
    g.strokeStyle = col['--muted']; g.fillStyle = col['--muted']; g.lineWidth = 1; g.globalAlpha = 0.55;
    for (let y = y0 + paso / 2; y < y1; y += paso) for (let x = x0 + paso / 2; x < x1; x += paso) {
      g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.stroke();
      if (entrante) { const d = r * 0.6; g.beginPath(); g.moveTo(x - d, y - d); g.lineTo(x + d, y + d); g.moveTo(x + d, y - d); g.lineTo(x - d, y + d); g.stroke(); } else { g.beginPath(); g.arc(x, y, Math.max(1, r * 0.25), 0, 2 * Math.PI); g.fill(); }
    }
    g.globalAlpha = 1;
  }
  // gráfica de varias series normalizadas a su máximo, con cursor en tc
  function grafica(g, x0, y0, gw, gh, tmax, series, tc) {
    const X = (t) => x0 + (t / tmax) * gw, cy = y0 + gh / 2 + 6;
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, cy); g.lineTo(x0 + gw, cy); g.moveTo(x0, y0); g.lineTo(x0, y0 + gh); g.stroke();
    texto(g, x0 + gw, cy + 12, 't', col['--muted'], 'right');
    series.forEach((s, i) => {
      const max = Math.max(...s.pts.map((p) => Math.abs(p[1]))) || 1;
      g.strokeStyle = s.color; g.lineWidth = 2.2; g.beginPath();
      s.pts.forEach(([t, y], j) => { const px = X(t), py = cy - (y / max) * (gh / 2 - 14); j ? g.lineTo(px, py) : g.moveTo(px, py); });
      g.stroke();
      texto(g, x0 + 8 + i * 150, y0 + 4, s.nombre, s.color, 'left', '600 ');
    });
    if (tc !== null && tc >= 0 && tc <= tmax) { g.strokeStyle = col['--ink']; g.globalAlpha = 0.5; g.lineWidth = 1; g.beginPath(); g.moveTo(X(tc), y0); g.lineTo(X(tc), y0 + gh); g.stroke(); g.globalAlpha = 1; }
  }
  // corriente por un rectángulo (sentido horario o antihorario en pantalla)
  function corrienteRect(g, x0, y0, x1, y1, horario, color) {
    const s = horario ? 1 : -1, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    punta(g, mx, y0, s > 0 ? 0 : Math.PI, color); punta(g, x1, my, s > 0 ? Math.PI / 2 : -Math.PI / 2, color);
    punta(g, mx, y1, s > 0 ? Math.PI : 0, color); punta(g, x0, my, s > 0 ? -Math.PI / 2 : Math.PI / 2, color);
  }
  let tAnim = 0;
  function dibuja() {
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    if (!col['--ink']) colores();
    const rojo = col['--peso'], ent = sol.sentidoB === 'entrante';
    if (sol.modo === 'barra') {
      campo(g, 0, 0, w, h, ent);
      const yA = h * 0.24, yB = h * 0.76, xR = 34, xF = w - 20, s = (tAnim / 4) % 1, pos = sol.v > 0 ? 0.32 + 0.6 * s : 0.92 - 0.6 * s, xb = xR + (xF - xR) * pos;
      g.strokeStyle = col['--suelo']; g.lineWidth = 4; g.beginPath(); g.moveTo(xR, yA); g.lineTo(xF, yA); g.moveTo(xR, yB); g.lineTo(xF, yB); g.stroke();
      // resistencia en zigzag
      g.strokeStyle = col['--ink']; g.lineWidth = 2; g.beginPath(); g.moveTo(xR, yA); g.lineTo(xR, yA + (yB - yA) * 0.3);
      for (let i = 0; i <= 8; i++) g.lineTo(xR + (i % 2 ? 9 : -9) * (i && i < 8 ? 1 : 0), yA + (yB - yA) * (0.3 + 0.4 * (i / 8)));
      g.lineTo(xR, yB); g.stroke(); texto(g, xR + 22, (yA + yB) / 2 - 22, sol.R ? `R = ${txt(f(sol.R))} Ω` : 'R', col['--ink'], 'left');
      g.fillStyle = col['--roz']; g.fillRect(xb - 5, yA - 12, 10, yB - yA + 24);
      corrienteRect(g, xR, yA, xb, yB, sol.sentido === 'horario', rojo);
      const dir = sol.v > 0 ? 1 : -1, ym = (yA + yB) / 2;
      flecha(g, xb, ym - 18, xb + dir * 60, ym - 18, col['--normal'], 2.4); texto(g, xb + dir * 66, ym - 18, 'v', col['--normal'], dir > 0 ? 'left' : 'right', '600 ');
      if (sol.F) { flecha(g, xb, ym + 18, xb - dir * 60, ym + 18, col['--roz'], 2.4); texto(g, xb - dir * 66, ym + 18, 'F', col['--roz'], dir > 0 ? 'right' : 'left', '600 '); }
      texto(g, xb, yA - 22, `L = ${txt(f(sol.L))} m`, col['--muted']);
      texto(g, w / 2, h - 14, `ε = ${txt(f(sol.eps))} V${sol.I !== null ? ` · I = ${txt(f(sol.I))} A` : ''} · sentido ${sol.sentido}`, col['--ink'], 'center', '600 ');
    } else if (sol.modo === 'giratoria') {
      const hs = h * 0.56, T = 3, th = 2 * Math.PI * (tAnim / T), cx = w / 2, cy = hs / 2, W = Math.min(w * 0.18, 110), H = hs * 0.62;
      g.fillStyle = rojo; g.fillRect(14, cy - hs * 0.36, 34, hs * 0.72); g.fillStyle = col['--accent']; g.fillRect(w - 48, cy - hs * 0.36, 34, hs * 0.72);
      texto(g, 31, cy, 'N', '#fff', 'center', '600 '); texto(g, w - 31, cy, 'S', '#fff', 'center', '600 ');
      g.strokeStyle = col['--line']; g.lineWidth = 1;
      for (let k = -2; k <= 2; k++) { const y = cy + k * hs * 0.15; g.beginPath(); g.moveTo(56, y); g.lineTo(w - 56, y); g.stroke(); punta(g, w * 0.25, y, 0, col['--line']); punta(g, w * 0.75, y, 0, col['--line']); }
      // espira vista de lado: su anchura aparente es W·|sen θ|
      const ww = W * Math.sin(th);
      g.fillStyle = col['--roz']; g.globalAlpha = 0.18; g.fillRect(cx - Math.abs(ww), cy - H / 2, 2 * Math.abs(ww), H); g.globalAlpha = 1;
      g.strokeStyle = col['--roz']; g.lineWidth = 3; g.strokeRect(cx - Math.abs(ww), cy - H / 2, 2 * Math.abs(ww), H);
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(cx, cy - H / 2 - 16); g.lineTo(cx, cy + H / 2 + 16); g.stroke(); g.setLineDash([]);
      const tf = 2 / sol.fr, pts = (fn) => Array.from({ length: 241 }, (_, i) => { const t = (tf * i) / 240; return [t, fn(t)]; });
      grafica(g, 20, hs + 8, w - 40, h - hs - 16, tf, [{ pts: pts((t) => Math.cos(sol.w * t)), color: col['--accent'], nombre: `Φ (máx ${txt(f(sol.Fm))} Wb)` }, { pts: pts((t) => Math.sin(sol.w * t)), color: rojo, nombre: `ε (máx ${txt(f(sol.em))} V)` }], ((tAnim / T) % 2) * (1 / sol.fr));
    } else if (sol.modo === 'flujo') {
      const T = 3, ciclo = (tAnim % (T + 1.2)) / T, s = Math.min(1, ciclo), B = sol.B1 + (sol.B2 - sol.B1) * s, th = sol.th1 + (sol.th2 - sol.th1) * s;
      const Bmax = Math.max(Math.abs(sol.B1), Math.abs(sol.B2)) || 1, wl = w * 0.56, cx = wl / 2, cy = h / 2;
      campo(g, 0, 0, wl, h, ent === B >= 0, Math.abs(B) / Bmax);
      const kx = Math.cos((th * Math.PI) / 180), R = Math.min(wl, h) * 0.32;
      g.strokeStyle = col['--roz']; g.lineWidth = 3.5;
      if (sol.forma === 'rectangulo' || sol.forma === 'area') { g.strokeRect(cx - R * Math.abs(kx), cy - R * 0.8, 2 * R * Math.abs(kx), 1.6 * R); if (s < 1) corrienteRect(g, cx - R * Math.abs(kx), cy - R * 0.8, cx + R * Math.abs(kx), cy + R * 0.8, sol.sentido === 'horario', rojo); }
      else {
        g.beginPath(); g.ellipse(cx, cy, Math.max(1, R * Math.abs(kx)), R, 0, 0, 2 * Math.PI); g.stroke();
        if (s < 1) { const hor = sol.sentido === 'horario'; punta(g, cx, cy - R, hor ? 0 : Math.PI, rojo); punta(g, cx, cy + R, hor ? Math.PI : 0, rojo); }
      }
      texto(g, cx, h - 14, `B = ${txt(f(B, 3))} T · θ = ${txt(f(th, 3))}°${s < 1 ? ` · sentido ${sol.sentido}` : ' · sin corriente'}`, col['--ink'], 'center', '600 ');
      const tf = sol.dt * 1.4, pts = Array.from({ length: 141 }, (_, i) => { const t = (tf * i) / 140, u = Math.min(1, t / sol.dt); return [t, sol.N * (sol.B1 + (sol.B2 - sol.B1) * u) * sol.S * Math.cos(((sol.th1 + (sol.th2 - sol.th1) * u) * Math.PI) / 180)]; });
      // eje del flujo desde 0 para que se vea si crece o decrece
      const gx = wl + 20, gw = w - wl - 34, gy = 30, gh = h - 70, max = Math.max(...pts.map((p) => Math.abs(p[1]))) || 1, X = (t) => gx + (t / tf) * gw, Y = (y) => gy + gh / 2 - (y / max) * (gh / 2 - 6);
      g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + gh); g.moveTo(gx, Y(0)); g.lineTo(gx + gw, Y(0)); g.stroke();
      g.strokeStyle = col['--accent']; g.lineWidth = 2.2; g.beginPath(); pts.forEach(([t, y], i) => (i ? g.lineTo(X(t), Y(y)) : g.moveTo(X(t), Y(y)))); g.stroke();
      texto(g, gx + 4, gy - 12, 'Φ(t)', col['--accent'], 'left', '600 '); texto(g, X(sol.dt), Y(0) + 14, `Δt = ${txt(f(sol.dt))} s`, col['--muted']);
      const tc = s * sol.dt + Math.max(0, ciclo - 1) * T * (sol.dt / T);
      g.strokeStyle = col['--ink']; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(X(Math.min(tf, tc)), gy); g.lineTo(X(Math.min(tf, tc)), gy + gh); g.stroke(); g.globalAlpha = 1;
    } else {
      const hs = h * 0.56, T = 6, t0 = -0.15 * sol.t3, t1 = 1.15 * sol.t3, t = t0 + ((tAnim % T) / T) * (t1 - t0);
      const xmin = -sol.a * 1.3, xmax = sol.D + sol.a * 1.3, m = 16, X = (x) => m + ((x - xmin) / (xmax - xmin)) * (w - 2 * m), sx = (w - 2 * m) / (xmax - xmin);
      g.fillStyle = col['--accent']; g.globalAlpha = 0.07; g.fillRect(X(0), 10, X(sol.D) - X(0), hs - 20); g.globalAlpha = 1;
      campo(g, X(0), 10, X(sol.D), hs - 10, ent, 1, Math.max(20, Math.min(34, (X(sol.D) - X(0)) / 3)));
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(0), 6); g.lineTo(X(0), hs - 6); g.moveTo(X(sol.D), 6); g.lineTo(X(sol.D), hs - 6); g.stroke(); g.setLineDash([]);
      const lado = Math.min(sol.a * sx, hs * 0.6), xf = sol.v * t, cy = hs / 2;
      g.strokeStyle = col['--roz']; g.lineWidth = 3.5; g.strokeRect(X(xf - sol.a), cy - lado / 2, sol.a * sx, lado);
      const tr = sol.tramos.find((q) => t >= q.t0 && t < q.t1);
      if (tr && tr.sentido) corrienteRect(g, X(xf - sol.a), cy - lado / 2, X(xf), cy + lado / 2, tr.sentido === 'horario', rojo);
      texto(g, X(sol.D / 2), hs - 1, `D = ${txt(f(sol.D))} m`, col['--muted']);
      const pts = (fn) => Array.from({ length: 301 }, (_, i) => { const tt = t0 + ((t1 - t0) * i) / 300; return [tt - t0, fn(tt)]; });
      const fi = (tt) => { const x = sol.v * tt; return Math.max(0, Math.min(x, sol.D) - Math.max(x - sol.a, 0)); }, ep = (tt) => { const q = sol.tramos.find((r) => tt >= r.t0 && tt < r.t1); return q ? -q.eps : 0; };
      grafica(g, 20, hs + 8, w - 40, h - hs - 16, t1 - t0, [{ pts: pts(fi), color: col['--accent'], nombre: `Φ (máx ${txt(f(sol.N * sol.B * sol.a * Math.min(sol.a, sol.D)))} Wb)` }, { pts: pts(ep), color: rojo, nombre: `ε = −dΦ/dt (±${txt(f(sol.eps))} V)` }], t - t0);
    }
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = (ahora - ultimo) / 1000; ultimo = ahora;
    if (!anda) return;
    if (sol) { tAnim += Math.min(dt, 0.1); dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('faraday').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.FaradayApp = { abrirEjemplo, resultado: () => sol && { modo: sol.modo, eps: sol.eps, em: sol.em, I: sol.I, sentido: sol.sentido }, estado: () => copia(sc), pausa: () => { anda = false; } };
})();
