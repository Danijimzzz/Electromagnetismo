/* =====================================================================
   Efecto Doppler: interfaz (modo, datos, resultados, animación de los
   frentes de onda, gráfica, sonido y desarrollo). El cálculo está en
   doppler/fisica.js (Doppler).
   ===================================================================== */
(() => {
  const { $, esc, copia, txt } = Herramienta;
  const D = Doppler, f = D.f, fq = D.fq, CLAVE = 'doppler-v1';
  const MODOS = [['recta', 'Fuente y observador en línea'], ['paso', 'Una fuente que pasa de largo'], ['eco', 'Eco en un obstáculo que se mueve'], ['choque', 'Onda de choque (cono de Mach)']];

  let sc = copia(D.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true;

  /* ---------- Formulario ---------- */
  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const NOTAS = {
    recta: 'Velocidades positivas si la fuente y el observador van el uno hacia el otro, negativas si se alejan. El viento es positivo si sopla de la fuente hacia el observador.',
    paso: 'La distancia a la carretera es opcional: con ella se ve cómo cambia el tono poco a poco al pasar.',
    eco: 'Para un radar o una ecografía la onda es electromagnética o ultrasonido: pon su velocidad (3·10^8 m/s, 1540 m/s en los tejidos). Se admite 24e9 o 24·10^9.',
    choque: 'La altura es opcional: con ella se calcula cuándo y dónde se oye el estampido.',
  };
  function formulario() {
    let h = elige('modo', 'Qué calcular', MODOS);
    if (sc.modo === 'recta') {
      h += fila('f', 'Frecuencia que emite la fuente', 'Hz') + fila('v', 'Velocidad del sonido', 'm/s') + fila('vF', 'Velocidad de la fuente', 'm/s') + fila('vO', 'Velocidad del observador', 'm/s') + sep('Opcional') + fila('w', 'Velocidad del viento', 'm/s');
    } else if (sc.modo === 'paso') {
      h += elige('datos', 'Datos', [['fuente', 'Conozco la fuente y su velocidad'], ['oidas', 'Conozco lo que se oye antes y después']]);
      h += sc.datos === 'oidas' ? fila('f1', 'Frecuencia al acercarse f₁', 'Hz') + fila('f2', 'Frecuencia al alejarse f₂', 'Hz') + fila('v', 'Velocidad del sonido', 'm/s')
        : fila('f', 'Frecuencia que emite', 'Hz') + fila('v', 'Velocidad del sonido', 'm/s') + fila('vF', 'Velocidad de la fuente', 'm/s') + sep('Opcional') + fila('d', 'Distancia del observador a la carretera', 'm');
    } else if (sc.modo === 'eco') {
      h += elige('buscar', 'Qué buscas', [['frecuencia', 'La frecuencia del eco'], ['velocidad', 'La velocidad del obstáculo']]);
      h += fila('f', 'Frecuencia emitida', 'Hz') + fila('v', 'Velocidad de la onda', 'm/s') + fila('vE', 'Velocidad del emisor', 'm/s');
      h += sc.buscar === 'velocidad' ? fila('df', 'Diferencia medida f″ − f', 'Hz') : fila('u', 'Velocidad del obstáculo', 'm/s');
    } else {
      h += fila('v', 'Velocidad del sonido', 'm/s') + fila('vF', 'Velocidad de la fuente', 'm/s') + sep('Opcional') + fila('h', 'Altura de vuelo', 'm');
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const vacioC = (v) => v === undefined || v === null || String(v).trim() === '';
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') sc = copia(D.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else { const ej = D.ejemplos.find((x) => x.sc.modo === sc.modo && x.sc[t.dataset.k] === t.value); if (ej) for (const [k, v] of Object.entries(ej.sc)) if (vacioC(sc[k])) sc[k] = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  /* ---------- Ejemplos ---------- */
  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Ejemplos…</option>' + D.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = D.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  /* ---------- Cálculo ---------- */
  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  const kmh = (u) => `${f(u)} m/s = ${f(u * 3.6)} km/h`;
  function calcula() {
    const err = $('#error');
    try { sol = D.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#grafica').hidden = true; $('#oir').hidden = true;
      reinicia(); dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'recta') {
      h = dato('Frecuencia que se oye', `f′ = ${fq(sol.fp)} Hz`) + dato('Cambio', `${sol.fp >= sol.fr ? '+' : '−'}${fq(Math.abs(sol.fp - sol.fr))} Hz`) + dato('Longitud de onda entre los dos', `λ′ = ${f(sol.lamp)} m`);
      ley = 'Cada círculo es un frente de onda, con centro donde estaba la fuente al emitirlo. Delante de la fuente se apelotonan: llegan más a menudo y se oye más agudo.';
    } else if (sol.modo === 'paso') {
      h = (sol.datos === 'oidas' ? dato('Velocidad de la fuente', kmh(sol.u)) + dato('Frecuencia que emite', `f = ${fq(sol.fr)} Hz`) : dato('Al acercarse', `f₁ = ${fq(sol.f1)} Hz`) + dato('Al alejarse', `f₂ = ${fq(sol.f2)} Hz`)) + dato('Salto al pasar', `Δf = ${fq(sol.salto)} Hz`);
      ley = sol.curva ? 'Vista desde arriba: la fuente pasa por la carretera y el observador está a un lado. La gráfica muestra la frecuencia que le llega según dónde estaba la fuente.' : 'Vista desde arriba: la fuente pasa por delante del observador. Antes se oye f₁ y después f₂.';
    } else if (sol.modo === 'eco') {
      h = (sol.buscar === 'velocidad' ? dato('Velocidad del obstáculo', kmh(sol.u)) : dato('Frecuencia del eco', `f″ = ${fq(sol.fpp)} Hz`)) + dato('Recibe el obstáculo', `f<sub>R</sub> = ${fq(sol.fR)} Hz`) + dato('Pulsaciones', `Δf = ${fq(sol.df)} Hz`);
      ley = sol.u + sol.vE === 0 ? 'En azul la onda que sale del emisor y en naranja el eco.' : `En azul la onda que sale del emisor y en naranja el eco.${Math.abs(sol.u) + Math.abs(sol.vE) < 0.001 * sol.v ? ' Las velocidades son tan pequeñas frente a la de la onda que el movimiento no se ve a esta escala.' : ''}`;
    } else {
      h = dato('Número de Mach', `M = ${f(sol.M)}`) + dato('Semiángulo del cono', `θ = ${f(sol.gr)}°`) + (sol.h ? dato('Se oye el estampido', `${f(sol.t)} s después de pasar`) + dato('Distancia horizontal', `x = ${f(sol.x)} m`) : '');
      ley = 'La fuente va más deprisa que sus frentes de onda: se acumulan en el cono de Mach, que al llegar al observador se oye como un estampido.';
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    const oir = tonos();
    $('#oir').hidden = !oir; if (oir) $('#oir').title = oir.titulo;
    $('#grafica').hidden = !(sol.modo === 'paso' && sol.curva);
    reinicia(); dibuja(); grafica();
  }

  /* ---------- Sonido ---------- */
  // qué se oye al pulsar «Escuchar»: tramos { f, dur } o un barrido { curva }
  function tonos() {
    if (!sol) return null;
    const oible = (...fs) => fs.every((x) => x >= 30 && x <= 16000);
    if (sol.modo === 'recta' && oible(sol.fr, sol.fp)) return { tramos: [[sol.fr, 0.7], [0, 0.2], [sol.fp, 0.7]], titulo: `Primero la emitida (${txt(fq(sol.fr))} Hz) y luego la que se oye (${txt(fq(sol.fp))} Hz)` };
    if (sol.modo === 'paso' && oible(sol.f1, sol.f2)) return sol.curva ? { barrido: sol.curva.puntos.map((q) => q.fp), dur: 2.6, titulo: 'La fuente pasando: de f₁ a f₂' } : { tramos: [[sol.f1, 0.8], [sol.f2, 0.8]], titulo: 'Antes y después de pasar' };
    if (sol.modo === 'eco' && oible(sol.fr, sol.fpp)) return { tramos: [[sol.fr, 0.7], [0, 0.2], [sol.fpp, 0.7]], titulo: 'La emitida y el eco' };
    return null;
  }
  let audio = null;
  $('#oir').addEventListener('click', () => {
    const t = tonos();
    if (!t) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + 0.05;
      o.type = 'sine'; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0, t0);
      let fin = t0;
      if (t.barrido) {
        o.frequency.setValueCurveAtTime(new Float32Array(t.barrido), t0, t.dur);
        g.gain.linearRampToValueAtTime(0.08, t0 + 0.05); g.gain.setValueAtTime(0.08, t0 + t.dur - 0.05); g.gain.linearRampToValueAtTime(0, t0 + t.dur);
        fin = t0 + t.dur;
      } else {
        for (const [fr, dur] of t.tramos) {
          if (fr) { o.frequency.setValueAtTime(fr, fin); g.gain.setValueAtTime(0, fin); g.gain.linearRampToValueAtTime(0.08, fin + 0.03); g.gain.setValueAtTime(0.08, fin + dur - 0.03); g.gain.linearRampToValueAtTime(0, fin + dur); }
          fin += dur;
        }
      }
      o.start(t0); o.stop(fin + 0.05);
    } catch (e) { /* el navegador no deja reproducir sonido */ }
  });

  /* ---------- Animación ---------- */
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pausa' : '▶ Seguir'; });
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--suelo', '--cuerpo', '--panel']) col[k] = cs.getPropertyValue(k).trim(); }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  function flecha(g, x, y, dx, dy, color) {
    const l = Math.hypot(dx, dy); if (l < 4) return;
    const ux = dx / l, uy = dy / l;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx - ux * 6, y + dy - uy * 6); g.stroke();
    g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx - ux * 9 - uy * 4.5, y + dy - uy * 9 + ux * 4.5); g.lineTo(x + dx - ux * 9 + uy * 4.5, y + dy - uy * 9 - ux * 4.5); g.closePath(); g.fill();
  }
  const punto = (g, x, y, r, color) => { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); };
  const TE = 0.32; // segundos de animación entre frentes de onda
  let tA = 0, bum = 0, conoAntes = null;
  const reinicia = () => { tA = 0; bum = 0; conoAntes = null; };
  function frentes(g, n, centro, radio, color, max) {
    g.lineWidth = 1.4; g.strokeStyle = color;
    for (let k = 0; k <= n; k++) {
      const r = radio(k); if (r <= 0 || r > max) continue;
      const [cx, cy] = centro(k);
      g.globalAlpha = Math.max(0.12, 1 - r / max);
      g.beginPath(); g.arc(cx, cy, r, 0, 2 * Math.PI); g.stroke();
    }
    g.globalAlpha = 1;
  }
  function dibuja() {
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    if (!col['--ink']) colores();
    const cv = w / 3.2; // velocidad del sonido en la animación (px/s)
    let t = tA;
    if (sol.modo === 'recta') {
      const bF = sol.vF / sol.v, bO = sol.vO / sol.v, bW = sol.w / sol.v, cy = h * 0.55;
      const xs0 = bF >= 0 ? w * 0.12 : w * 0.45, xo0 = w * 0.86;
      const xs = (tt) => xs0 + bF * cv * tt, xo = (tt) => xo0 - bO * cv * tt;
      if (t > 7 || xo(t) - xs(t) < 24 || xs(t) < 10 || xo(t) > w - 10) { tA = t = 0; }
      frentes(g, Math.floor(t / TE), (k) => [xs(k * TE) + bW * cv * (t - k * TE), cy], (k) => cv * (t - k * TE), col['--accent'], w * 1.2);
      punto(g, xs(t), cy, 7, col['--peso']); texto(g, xs(t), cy + 22, `fuente · ${txt(fq(sol.fr))} Hz`, col['--peso']);
      punto(g, xo(t), cy, 7, col['--normal']); texto(g, xo(t), cy + 22, `observador · ${txt(fq(sol.fp))} Hz`, col['--normal']);
      if (bF) flecha(g, xs(t), cy - 16, Math.sign(bF) * Math.min(60, 14 + Math.abs(bF) * 160), 0, col['--peso']);
      if (bO) flecha(g, xo(t), cy - 16, -Math.sign(bO) * Math.min(60, 14 + Math.abs(bO) * 160), 0, col['--normal']);
      if (bW) { texto(g, 14, 18, `viento ${txt(f(Math.abs(sol.w)))} m/s`, col['--muted'], 'left'); flecha(g, bW > 0 ? 130 : 180, 18, bW > 0 ? 50 : -50, 0, col['--muted']); }
    } else if (sol.modo === 'paso') {
      const b = sol.u / sol.v, carretera = h * 0.3, L = sol.curva ? sol.curva.L : 1;
      const dpx = sol.curva ? Math.min(h * 0.55, Math.max(16, (sol.d / (2 * L)) * w)) : 12;
      const xs = (tt) => 12 + b * cv * tt, ox = w / 2, oy = carretera + dpx;
      if (xs(t) > w - 12) tA = t = 0;
      g.strokeStyle = col['--line']; g.lineWidth = 14; g.beginPath(); g.moveTo(0, carretera); g.lineTo(w, carretera); g.stroke();
      g.strokeStyle = col['--panel']; g.lineWidth = 1.2; g.setLineDash([10, 10]); g.beginPath(); g.moveTo(0, carretera); g.lineTo(w, carretera); g.stroke(); g.setLineDash([]);
      frentes(g, Math.floor(t / TE), (k) => [xs(k * TE), carretera], (k) => cv * (t - k * TE), col['--accent'], w * 1.2);
      punto(g, xs(t), carretera, 7, col['--peso']); flecha(g, xs(t), carretera - 18, 40, 0, col['--peso']); texto(g, xs(t), carretera - 32, 'fuente', col['--peso']);
      punto(g, ox, oy, 7, col['--normal']); texto(g, ox, oy + 20, 'observador', col['--normal']);
      // frecuencia que le llega de la fuente según dónde está (sin el retraso de la propagación)
      const xr = sol.curva ? ((xs(t) - ox) / w) * 2 * L : xs(t) - ox, ca = -xr / Math.hypot(xr, sol.curva ? sol.d : 1e-9);
      const fo = (sol.fr * sol.v) / (sol.v - sol.u * ca);
      texto(g, 14, h - 14, `emite ${txt(fq(sol.fr))} Hz · desde aquí llega ${txt(fq(fo))} Hz`, col['--ink'], 'left', '600 ');
      cursor = sol.curva ? xr : null;
    } else if (sol.modo === 'eco') {
      const bE = sol.vE / sol.v, bU = sol.u / sol.v, cy = h * 0.5;
      const xe0 = w * 0.1, xr0 = w * 0.78, eP = bE * cv, uP = bU * cv;
      const xe = (tt) => xe0 + eP * tt, xr = (tt) => xr0 - uP * tt;
      if (t > 7 || xr(t) - xe(t) < 30 || xr(t) > w - 6) { tA = t = 0; }
      const n = Math.floor(t / TE), XR = xr(t);
      g.save(); g.beginPath(); g.rect(0, 0, XR, h); g.clip();
      frentes(g, n, (k) => [xe(k * TE), cy], (k) => cv * (t - k * TE), col['--accent'], w * 1.1);
      const golpe = (k) => (xr0 - xe0 - eP * k * TE + cv * k * TE) / (cv + uP);
      frentes(g, n, (k) => [xr(golpe(k)), cy], (k) => (golpe(k) <= t ? cv * (t - golpe(k)) : 0), col['--roz'], w * 1.1);
      g.restore();
      g.fillStyle = col['--suelo']; g.fillRect(XR, cy - h * 0.3, 10, h * 0.6);
      texto(g, XR + 5, cy - h * 0.3 - 12, 'obstáculo', col['--muted']);
      if (bU) flecha(g, XR + 5, cy + h * 0.3 + 14, -Math.sign(bU) * 40, 0, col['--muted']);
      punto(g, xe(t), cy, 7, col['--peso']); texto(g, xe(t), cy + 22, 'emisor', col['--peso']);
      if (bE) flecha(g, xe(t), cy - 18, Math.sign(bE) * 40, 0, col['--peso']);
      texto(g, 14, 16, `emite ${txt(fq(sol.fr))} Hz · eco ${txt(fq(sol.fpp))} Hz`, col['--ink'], 'left', '600 ');
    } else {
      const suelo = h - 26, y0 = h * 0.26, vP = w / 4, c2 = vP / sol.M, xs = (tt) => 20 + vP * tt, xo = w * 0.42;
      if (xs(t) > w + 220) { tA = t = 0; conoAntes = null; }
      g.fillStyle = col['--suelo']; g.fillRect(0, suelo, w, 3);
      frentes(g, Math.floor(t / TE), (k) => [xs(k * TE), y0], (k) => c2 * (t - k * TE), col['--accent'], w * 1.4);
      // el cono: tangentes a los frentes desde la posición actual
      const L = w * 1.5, ct = Math.cos(sol.th), st = Math.sin(sol.th);
      g.strokeStyle = col['--peso']; g.lineWidth = 2;
      g.beginPath(); g.moveTo(xs(t), y0); g.lineTo(xs(t) - L * ct, y0 - L * st); g.moveTo(xs(t), y0); g.lineTo(xs(t) - L * ct, y0 + L * st); g.stroke();
      const xc = xs(t) - (suelo - y0) / Math.tan(sol.th); // donde el cono toca el suelo
      if (conoAntes !== null && conoAntes < xo && xc >= xo) bum = 0.8;
      conoAntes = xc;
      g.fillStyle = col['--ink']; g.beginPath(); g.moveTo(xs(t) + 10, y0); g.lineTo(xs(t) - 12, y0 - 6); g.lineTo(xs(t) - 12, y0 + 6); g.closePath(); g.fill();
      punto(g, xo, suelo - 6, 6, col['--normal']); texto(g, xo, suelo + 14, 'observador', col['--normal']);
      if (bum > 0) texto(g, xo, suelo - 28, '¡BUM!', col['--peso'], 'center', '700 ');
      texto(g, 14, 16, `M = ${txt(f(sol.M))} · θ = ${txt(f(sol.gr))}°`, col['--ink'], 'left', '600 ');
    }
  }
  let cursor = null;
  /* ---------- Gráfica f′(x) al pasar ---------- */
  function grafica() {
    const c = $('#grafica');
    if (c.hidden || !sol || !sol.curva) return;
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    if (!col['--ink']) colores();
    const pts = sol.curva.puntos, L = sol.curva.L, ml = 58, mr = 14, mt = 14, mb = 30;
    const lo = sol.f2 - 0.08 * sol.salto, hi = sol.f1 + 0.08 * sol.salto;
    const X = (x) => ml + ((x + L) / (2 * L)) * (w - ml - mr), Y = (fr) => mt + ((hi - fr) / (hi - lo)) * (h - mt - mb);
    g.strokeStyle = col['--line']; g.lineWidth = 1;
    for (const fr of [sol.f1, sol.fr, sol.f2]) { g.beginPath(); g.moveTo(ml, Y(fr)); g.lineTo(w - mr, Y(fr)); g.stroke(); texto(g, ml - 6, Y(fr), `${txt(fq(fr))}`, col['--muted'], 'right'); }
    g.beginPath(); g.moveTo(X(0), mt); g.lineTo(X(0), h - mb); g.stroke();
    texto(g, X(-L), h - 12, `${txt(f(-L))} m`, col['--muted'], 'left'); texto(g, X(0), h - 12, 'enfrente', col['--muted']); texto(g, X(L), h - 12, `${txt(f(L))} m`, col['--muted'], 'right');
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
    pts.forEach((q, i) => (i ? g.lineTo(X(q.x), Y(q.fp)) : g.moveTo(X(q.x), Y(q.fp))));
    g.stroke();
    if (cursor !== null && Math.abs(cursor) <= L) { const ca = -cursor / Math.hypot(cursor, sol.d), fo = (sol.fr * sol.v) / (sol.v - sol.u * ca); punto(g, X(cursor), Y(fo), 5, col['--peso']); }
    texto(g, ml, 6, 'f′ (Hz) según la posición de la fuente', col['--muted'], 'left');
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; bum = Math.max(0, bum - dt); dibuja(); grafica(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { dibuja(); grafica(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); grafica(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('doppler').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.DopplerApp = { abrirEjemplo, resultado: () => sol && { modo: sol.modo, fp: sol.fp, f1: sol.f1, f2: sol.f2, u: sol.u, fpp: sol.fpp, M: sol.M }, estado: () => copia(sc), pausa: () => { anda = false; }, tonos };
})();
