(() => {
  const { $, esc, copia, txt } = Herramienta;
  const D = Doppler, f = D.f, fq = D.fq, CLAVE = 'doppler-v1';
  const MODOS = [['recta', 'Source and observer in line'], ['paso', 'A source passing by'], ['eco', 'Echo from a moving obstacle'], ['choque', 'Shock wave (Mach cone)'], ['luz', 'Light (relativistic Doppler)']];

  let sc = copia(D.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const NOTAS = {
    recta: 'Velocities are positive if the source and the observer move towards each other, negative if they move apart. Wind is positive if it blows from the source towards the observer.',
    paso: 'The distance to the road is optional: with it you can see how the pitch changes gradually as it passes.',
    eco: 'For a radar or an ultrasound scan the wave is electromagnetic or ultrasonic: enter its speed (3·10^8 m/s, 1540 m/s in tissue). 24e9 or 24·10^9 is accepted.',
    choque: 'The height is optional: with it, when and where the sonic boom is heard is calculated.',
    luz: 'β = v/c is positive if the source recedes (redshift) and negative if it approaches. Wavelengths are in nanometres: the hydrogen Hα line is at 656.3 nm.',
  };
  function formulario() {
    let h = elige('modo', 'What to calculate', MODOS);
    if (sc.modo === 'recta') {
      h += fila('f', 'Frequency emitted by the source', 'Hz') + fila('v', 'Speed of sound', 'm/s') + fila('vF', 'Speed of the source', 'm/s') + fila('vO', 'Speed of the observer', 'm/s') + sep('Optional') + fila('w', 'Wind speed', 'm/s') + fila('aF', 'Angle of the source velocity with the line joining them', '°') + fila('aO', 'Angle of the observer velocity', '°');
    } else if (sc.modo === 'paso') {
      h += elige('datos', 'Data', [['fuente', 'I know the source and its speed'], ['oidas', 'I know what is heard before and after']]);
      h += sc.datos === 'oidas' ? fila('f1', 'Frequency on approaching f₁', 'Hz') + fila('f2', 'Frequency on receding f₂', 'Hz') + fila('v', 'Speed of sound', 'm/s')
        : fila('f', 'Frequency emitted', 'Hz') + fila('v', 'Speed of sound', 'm/s') + fila('vF', 'Speed of the source', 'm/s') + sep('Optional') + fila('d', 'Distance from the observer to the road', 'm');
    } else if (sc.modo === 'eco') {
      h += elige('buscar', 'What you are looking for', [['frecuencia', 'The echo frequency'], ['velocidad', 'The speed of the obstacle']]);
      h += fila('f', 'Frequency emitted', 'Hz') + fila('v', 'Wave speed', 'm/s') + fila('vE', 'Emitter speed', 'm/s');
      h += sc.buscar === 'velocidad' ? fila('df', 'Measured difference f″ − f', 'Hz') : fila('u', 'Speed of the obstacle', 'm/s');
    } else if (sc.modo === 'luz') {
      h += elige('dato', 'What I know', [['fuente', 'The speed of the source'], ['observado', 'The wavelength that arrives']]);
      h += fila('lam', 'Emitted wavelength λ', 'nm');
      h += sc.dato === 'observado' ? fila('lamO', 'Observed wavelength λ′', 'nm') : elige('geo', 'How it moves', [['radial', 'Along the line of sight (approaching or receding)'], ['transversal', 'Perpendicular to the line of sight']]) + fila('beta', 'β = v/c', '');
    } else {
      h += fila('v', 'Speed of sound', 'm/s') + fila('vF', 'Speed of the source', 'm/s') + sep('Optional') + fila('h', 'Flight height', 'm');
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

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Examples…</option>' + D.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = D.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

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
      h = dato('Frequency heard', `f′ = ${fq(sol.fp)} Hz`) + dato('Change', `${sol.fp >= sol.fr ? '+' : '−'}${fq(Math.abs(sol.fp - sol.fr))} Hz`) + dato('Wavelength between the two', `λ′ = ${f(sol.lamp)} m`);
      ley = 'Each circle is a wavefront, centred where the source was when it emitted it. Ahead of the source they bunch up: they arrive more often and the sound is higher-pitched.';
    } else if (sol.modo === 'paso') {
      h = (sol.datos === 'oidas' ? dato('Speed of the source', kmh(sol.u)) + dato('Frequency emitted', `f = ${fq(sol.fr)} Hz`) : dato('On approaching', `f₁ = ${fq(sol.f1)} Hz`) + dato('On receding', `f₂ = ${fq(sol.f2)} Hz`)) + dato('Jump on passing', `Δf = ${fq(sol.salto)} Hz`);
      ley = sol.curva ? 'View from above: the source passes along the road and the observer is to one side. The graph shows the frequency they hear at each instant (t = 0 when the source passes opposite).' : 'View from above: the source passes in front of the observer. Before, f₁ is heard and after, f₂.';
    } else if (sol.modo === 'eco') {
      h = (sol.buscar === 'velocidad' ? dato('Speed of the obstacle', kmh(sol.u)) : dato('Echo frequency', `f″ = ${fq(sol.fpp)} Hz`)) + dato('The obstacle receives', `f<sub>R</sub> = ${fq(sol.fR)} Hz`) + dato('Beats', `Δf = ${fq(sol.df)} Hz`);
      ley = sol.u + sol.vE === 0 ? 'In blue the wave leaving the emitter and in orange the echo.' : `In blue the wave leaving the emitter and in orange the echo.${Math.abs(sol.u) + Math.abs(sol.vE) < 0.001 * sol.v ? ' The speeds are so small compared with that of the wave that the motion cannot be seen at this scale.' : ''}`;
    } else if (sol.modo === 'luz') {
      h = (sol.dato === 'observado' ? dato('Speed of the source', `β = ${f(sol.beta)} · v = ${f(sol.beta * D.C)} m/s`) : dato('Wavelength that arrives', `λ′ = ${f(sol.lamO)} nm`)) + dato('Shift', `z = ${f(sol.z)} (${sol.z > 0 ? 'redshift' : sol.z < 0 ? 'blueshift' : 'ninguno'})`) + dato('Lorentz factor', `γ = ${f(sol.g, 6)}`);
      ley = 'The visible spectrum with the line emitted by the source (top) and the one reaching the observer (bottom). Outside 380–750 nm light can no longer be seen.';
    } else {
      h = dato('Mach number', `M = ${f(sol.M)}`) + dato('Half-angle of the cone', `θ = ${f(sol.gr)}°`) + (sol.h ? dato('The boom is heard', `${f(sol.t)} s after passing`) + dato('Horizontal distance', `x = ${f(sol.x)} m`) : '');
      ley = 'The source goes faster than its wavefronts: they pile up in the Mach cone, which on reaching the observer is heard as a boom.';
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    const oir = tonos();
    $('#oir').hidden = !oir; if (oir) $('#oir').title = oir.titulo;
    $('#grafica').hidden = !(sol.modo === 'paso' && sol.curva);
    reinicia(); dibuja(); grafica();
  }

  function tonos() {
    if (!sol) return null;
    const oible = (...fs) => fs.every((x) => x >= 30 && x <= 16000);
    if (sol.modo === 'recta' && oible(sol.fr, sol.fp)) return { tramos: [[sol.fr, 0.7], [0, 0.2], [sol.fp, 0.7]], titulo: `First the emitted one (${txt(fq(sol.fr))} Hz) and then the one heard (${txt(fq(sol.fp))} Hz)` };
    if (sol.modo === 'paso' && oible(sol.f1, sol.f2)) return sol.curva ? { barrido: sol.curva.puntos.map((q) => q.fp), dur: 2.6, titulo: 'The source passing: from f₁ to f₂' } : { tramos: [[sol.f1, 0.8], [sol.f2, 0.8]], titulo: 'Before and after passing' };
    if (sol.modo === 'eco' && oible(sol.fr, sol.fpp)) return { tramos: [[sol.fr, 0.7], [0, 0.2], [sol.fpp, 0.7]], titulo: 'The emitted wave and the echo' };
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

  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Resume'; });
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
      punto(g, xs(t), cy, 7, col['--peso']); texto(g, xs(t), cy + 22, `source · ${txt(fq(sol.fr))} Hz`, col['--peso']);
      punto(g, xo(t), cy, 7, col['--normal']); texto(g, xo(t), cy + 22, `observer · ${txt(fq(sol.fp))} Hz`, col['--normal']);
      const largo = (x) => Math.min(60, 14 + Math.abs(x / sol.v) * 160), rad = (a) => (a * Math.PI) / 180;
      if (sol.vF0) flecha(g, xs(t), cy - 16, Math.sign(sol.vF0) * largo(sol.vF0) * Math.cos(rad(sol.aF)), -largo(sol.vF0) * Math.sin(rad(sol.aF)), col['--peso']);
      if (sol.vO0) flecha(g, xo(t), cy - 16, -Math.sign(sol.vO0) * largo(sol.vO0) * Math.cos(rad(sol.aO)), -largo(sol.vO0) * Math.sin(rad(sol.aO)), col['--normal']);
      if (bW) { texto(g, 14, 18, `wind ${txt(f(Math.abs(sol.w)))} m/s`, col['--muted'], 'left'); flecha(g, bW > 0 ? 130 : 180, 18, bW > 0 ? 50 : -50, 0, col['--muted']); }
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
      const xr = sol.curva ? ((xs(t) - ox) / w) * 2 * L : xs(t) - ox, ca = -xr / Math.hypot(xr, sol.curva ? sol.d : 1e-9);
      const fo = (sol.fr * sol.v) / (sol.v - sol.u * ca);
      texto(g, 14, h - 14, `emits ${txt(fq(sol.fr))} Hz · from here ${txt(fq(fo))} Hz arrives`, col['--ink'], 'left', '600 ');
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
      texto(g, XR + 5, cy - h * 0.3 - 12, 'obstacle', col['--muted']);
      if (bU) flecha(g, XR + 5, cy + h * 0.3 + 14, -Math.sign(bU) * 40, 0, col['--muted']);
      punto(g, xe(t), cy, 7, col['--peso']); texto(g, xe(t), cy + 22, 'emisor', col['--peso']);
      if (bE) flecha(g, xe(t), cy - 18, Math.sign(bE) * 40, 0, col['--peso']);
      texto(g, 14, 16, `emits ${txt(fq(sol.fr))} Hz · echo ${txt(fq(sol.fpp))} Hz`, col['--ink'], 'left', '600 ');
    } else if (sol.modo === 'choque') {
      const suelo = h - 26, y0 = h * 0.26, vP = w / 4, c2 = vP / sol.M, xs = (tt) => 20 + vP * tt, xo = w * 0.42;
      if (xs(t) > w + 220) { tA = t = 0; conoAntes = null; }
      g.fillStyle = col['--suelo']; g.fillRect(0, suelo, w, 3);
      frentes(g, Math.floor(t / TE), (k) => [xs(k * TE), y0], (k) => c2 * (t - k * TE), col['--accent'], w * 1.4);
      const L = w * 1.5, ct = Math.cos(sol.th), st = Math.sin(sol.th);
      g.strokeStyle = col['--peso']; g.lineWidth = 2;
      g.beginPath(); g.moveTo(xs(t), y0); g.lineTo(xs(t) - L * ct, y0 - L * st); g.moveTo(xs(t), y0); g.lineTo(xs(t) - L * ct, y0 + L * st); g.stroke();
      const xc = xs(t) - (suelo - y0) / Math.tan(sol.th); // donde el cono toca el suelo
      if (conoAntes !== null && conoAntes < xo && xc >= xo) bum = 0.8;
      conoAntes = xc;
      g.fillStyle = col['--ink']; g.beginPath(); g.moveTo(xs(t) + 10, y0); g.lineTo(xs(t) - 12, y0 - 6); g.lineTo(xs(t) - 12, y0 + 6); g.closePath(); g.fill();
      punto(g, xo, suelo - 6, 6, col['--normal']); texto(g, xo, suelo + 14, 'observador', col['--normal']);
      if (bum > 0) texto(g, xo, suelo - 28, 'BOOM!', col['--peso'], 'center', '700 ');
      texto(g, 14, 16, `M = ${txt(f(sol.M))} · θ = ${txt(f(sol.gr))}°`, col['--ink'], 'left', '600 ');
    } else if (sol.modo === 'luz') espectro(g, w, h);
  }
  function rgb(nm) {
    let r = 0, gg = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { gg = (nm - 440) / 50; b = 1; } else if (nm < 510) { gg = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; gg = 1; } else if (nm < 645) { r = 1; gg = (645 - nm) / 65; } else if (nm <= 750) r = 1;
    const k = nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (750 - nm)) / 50 : 1;
    return `rgb(${[r, gg, b].map((c) => Math.round(255 * (c * k) ** 0.8)).join(',')})`;
  }
  function espectro(g, w, h) {
    const a = Math.min(330, sol.lam, sol.lamO) - 20, z = Math.max(800, sol.lam, sol.lamO) + 20, ml = 20, mr = 20;
    const X = (nm) => ml + ((nm - a) / (z - a)) * (w - ml - mr), y1 = h * 0.22, y2 = h * 0.58, alto = h * 0.2;
    const banda = (y) => {
      g.fillStyle = col['--line']; g.fillRect(ml, y, w - ml - mr, alto);
      for (let nm = 380; nm < 750; nm += 2) { g.fillStyle = rgb(nm); g.fillRect(X(nm), y, X(nm + 2) - X(nm) + 0.5, alto); }
    };
    const linea = (y, nm, t) => {
      g.strokeStyle = col['--ink']; g.lineWidth = 3; g.beginPath(); g.moveTo(X(nm), y - 4); g.lineTo(X(nm), y + alto + 4); g.stroke();
      texto(g, X(nm), y - 12, t, col['--ink'], 'center', '600 ');
    };
    banda(y1); banda(y2);
    linea(y1, sol.lam, `emitted ${txt(f(sol.lam))} nm`); linea(y2, sol.lamO, `received ${txt(f(sol.lamO))} nm`);
    flecha(g, X(sol.lam), y1 + alto + 8, X(sol.lamO) - X(sol.lam), y2 - y1 - alto - 34, col['--peso']);
    for (const nm of [400, 500, 600, 700]) if (nm > a && nm < z) texto(g, X(nm), h - 14, `${nm} nm`, col['--muted']);
  }
  let cursor = null;
  function grafica() {
    const c = $('#grafica');
    if (c.hidden || !sol || !sol.curva) return;
    const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    if (!col['--ink']) colores();
    const pts = sol.curva.puntos, ml = 58, mr = 14, mt = 14, mb = 30, t0 = pts[0].tr, t1 = pts[pts.length - 1].tr, d0 = sol.d / sol.v;
    const lo = sol.f2 - 0.08 * sol.salto, hi = sol.f1 + 0.08 * sol.salto;
    const X = (tt) => ml + ((tt - t0) / (t1 - t0)) * (w - ml - mr), Y = (fr) => mt + ((hi - fr) / (hi - lo)) * (h - mt - mb);
    g.strokeStyle = col['--line']; g.lineWidth = 1;
    for (const fr of [sol.f1, sol.fr, sol.f2]) { g.beginPath(); g.moveTo(ml, Y(fr)); g.lineTo(w - mr, Y(fr)); g.stroke(); texto(g, ml - 6, Y(fr), `${txt(fq(fr))}`, col['--muted'], 'right'); }
    g.beginPath(); g.moveTo(X(0), mt); g.lineTo(X(0), h - mb); g.stroke();
    g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(d0), mt); g.lineTo(X(d0), h - mb); g.stroke(); g.setLineDash([]);
    texto(g, X(t0), h - 12, `${txt(f(t0, 3))} s`, col['--muted'], 'left'); if (X(d0) - X(0) > 120) { texto(g, X(0), h - 12, 'passes in front', col['--muted'], 'right'); texto(g, X(d0), h - 12, `heard (+${txt(f(d0, 3))} s)`, col['--muted'], 'left'); } else texto(g, X(0), h - 12, `passes opposite (heard ${txt(f(d0, 3))} s later)`, col['--muted']); texto(g, X(t1), h - 12, `${txt(f(t1, 3))} s`, col['--muted'], 'right');
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
    pts.forEach((q, i) => (i ? g.lineTo(X(q.tr), Y(q.fp)) : g.moveTo(X(q.tr), Y(q.fp))));
    g.stroke();
    if (cursor !== null && Math.abs(cursor) <= sol.curva.L) { const ca = -cursor / Math.hypot(cursor, sol.d), fo = (sol.fr * sol.v) / (sol.v - sol.u * ca); punto(g, X(cursor / sol.u + Math.hypot(cursor, sol.d) / sol.v), Y(fo), 5, col['--peso']); }
    texto(g, ml, 6, 'f′ (Hz) heard at each instant', col['--muted'], 'left');
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
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', '.');
    const tipos = [
      () => ({ modo: 'recta', f: String(ent(4, 12) * 50), v: '340', vF: String(de([-30, -20, -15, 15, 20, 25, 30])), vO: String(de([0, 0, -10, 5, 10])), w: '' }),
      () => ({ modo: 'recta', f: String(ent(4, 12) * 50), v: '340', vF: String(ent(2, 6) * 5), vO: '0', w: '', aF: String(de([30, 45, 60])), aO: '' }),
      () => ({ modo: 'paso', datos: 'fuente', f: String(ent(3, 9) * 50), v: '340', vF: String(ent(4, 12) * 5), d: '' }),
      () => ({ modo: 'paso', datos: 'oidas', f1: String(ent(45, 60) * 10), f2: String(ent(36, 44) * 10), v: '340' }),
      () => ({ modo: 'eco', buscar: 'frecuencia', f: String(ent(20, 60) * 1000), v: '340', vE: String(ent(2, 8)), u: '0' }),
      () => ({ modo: 'choque', v: '340', vF: String(ent(41, 100) * 10), h: String(ent(3, 12) * 1000) }),
      () => ({ modo: 'luz', dato: 'fuente', geo: 'radial', lam: c(de([486.1, 500, 589, 656.3])), beta: c(de([-0.2, -0.1, -0.05, 0.05, 0.1, 0.3])) }),
      () => ({ modo: 'luz', dato: 'observado', lam: '656,3', lamO: c(+(656.3 * (1 + ent(2, 30) / 100)).toFixed(1)) }),
    ];
    sc = de(tipos)();
    formulario(); sel.value = ''; calcula();
  }
  const enunciado = () => {
    const e = (x) => esc(String(x ?? '').replace('.', '.')), mod = (x) => e(String(x).replace('-', ''));
    const mueve = (v, quien, hacia) => (+v > 0 ? `${quien} moves towards ${hacia} at ${mod(v)} m/s` : +v < 0 ? `${quien} moves away from ${hacia === 'el observador' ? 'the observer' : 'the source'} at ${mod(v)} m/s` : `${quien} is at rest`);
    if (sc.modo === 'recta') return sc.aF ? `A car with a ${e(sc.f)} Hz horn travels at ${e(sc.vF)} m/s in a direction making ${e(sc.aF)}° with the line joining it to a stationary pedestrian (v = ${e(sc.v)} m/s). What frequency does the pedestrian hear?` : `A source emits ${e(sc.f)} Hz (v = ${e(sc.v)} m/s): ${mueve(sc.vF, 'the source', 'the observer')} and ${mueve(sc.vO, 'the observer', 'the source')}. Calculate the frequency heard and the wavelength between the two.`;
    if (sc.modo === 'paso' && sc.datos === 'oidas') return `A motorbike passes in front of you: when approaching it sounds at ${e(sc.f1)} Hz and when receding at ${e(sc.f2)} Hz (v = ${e(sc.v)} m/s). How fast is it going and what frequency does it emit?`;
    if (sc.modo === 'paso') return `A train sounds its whistle at ${e(sc.f)} Hz and passes through a station at ${e(sc.vF)} m/s (v = ${e(sc.v)} m/s). Calculate the frequency heard on approaching, on receding and the jump on passing.`;
    if (sc.modo === 'eco') return `A bat emits at ${e(sc.f)} Hz and flies at ${e(sc.vE)} m/s towards a wall (v = ${e(sc.v)} m/s). Calculate the frequency received by the wall, that of the echo and the beats.`;
    if (sc.modo === 'choque') return `An aircraft flies at ${e(sc.vF)} m/s at a height of ${e(sc.h)} m (v = ${e(sc.v)} m/s). Calculate the Mach number, the half-angle of the cone and how long after passing over you the boom is heard.`;
    if (sc.modo === 'luz' && sc.dato === 'observado') return `The hydrogen Hα line (${e(sc.lam)} nm) arrives from a galaxy at ${e(sc.lamO)} nm. How fast is it receding? Also calculate the redshift z.`;
    if (sc.modo === 'luz') return `A star ${+String(sc.beta).replace(',', '.') > 0 ? 'recedes' : 'approaches'} at ${mod(sc.beta)}c and emits light of ${e(sc.lam)} nm. What wavelength arrives? Calculate the redshift z and the Lorentz factor.`;
    return 'Calculate the frequency heard.';
  };

  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.DopplerApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, fp: sol.fp, f1: sol.f1, f2: sol.f2, u: sol.u, fpp: sol.fpp, M: sol.M, lamO: sol.lamO, beta: sol.beta }, estado: () => copia(sc), pausa: () => { anda = false; }, tonos };
})();

