(() => {
  const { $, esc, copia } = Herramienta;
  const O = Ondas, f = O.f, CLAVE = 'ondas-v1';
  const txt = (h) => String(h).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '');
  const MODOS = [['armonica', 'Harmonic wave'], ['estacionaria', 'Standing waves'], ['superposicion', 'Superposition: beats and interference'], ['energia', 'Energy and power on a string'], ['reflexion', 'Reflection and transmission between two strings'], ['doppler', 'Doppler effect'], ['sonido', 'Intensity and sound level']];

  let sc = copia(O.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {}, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const sep = (t) => `<div class="sep">${t}</div>`;
  function formulario() {
    let h = `<label for="f-modo">What to calculate</label><select id="f-modo" class="in" data-k="modo">${opciones('modo', MODOS)}</select>`;
    if (sc.modo === 'armonica') {
      h += fila('A', 'Amplitude A', 'm') + fila('f', 'Frequency f', 'Hz') + fila('v', 'Propagation speed v', 'm/s') + `<label for="f-sentido">Direction</label><select id="f-sentido" class="in" data-k="sentido">${opciones('sentido', [['+', 'Towards positive x'], ['-', 'Towards negative x']])}</select>` + fila('fase', 'Initial phase φ', 'rad');
      h += sep('A point of the medium (optional)') + fila('x0', 'Position x', 'm') + fila('t0', 'Time t', 's') + fila('dx', 'Phase difference with a point at Δx', 'm');
      $('#nota').textContent = 'The phase accepts π: for example π/2 or 3pi/4.';
    } else if (sc.modo === 'estacionaria') {
      h += `<label for="f-medio">Medium</label><select id="f-medio" class="in" data-k="medio">${opciones('medio', [['cuerda', 'String with both ends fixed'], ['abierto', 'Tube open at both ends'], ['cerrado', 'Tube closed at one end']])}</select>` + fila('L', 'Length L', 'm');
      h += sc.medio === 'cuerda' ? fila('tension', 'Tension T', 'N') + fila('mu', 'Linear density μ', 'kg/m') : fila('vs', 'Speed of sound', 'm/s') + fila('Taire', 'or air temperature', '°C');
      h += fila('n', sc.medio === 'cerrado' ? 'Mode n (harmonic 2n − 1)' : 'Harmonic n', '');
      $('#nota').textContent = sc.medio === 'cuerda' ? 'μ is the mass per unit length: 1.1 g/m = 0.0011 kg/m.' : 'The drawing shows the displacement of the air: nodes where it does not move.';
    } else if (sc.modo === 'superposicion') {
      h += `<label for="f-tipo">Situation</label><select id="f-tipo" class="in" data-k="tipo">${opciones('tipo', [['pulsaciones', 'Beats (two close frequencies)'], ['fase', 'Two identical waves out of phase']])}</select>`;
      h += sc.tipo === 'fase' ? fila('A1', 'Amplitude A<sub>1</sub>', 'm') + fila('A2', 'Amplitude A<sub>2</sub>', 'm') + fila('f', 'Frequency f', 'Hz') + fila('v', 'Propagation speed v', 'm/s') + fila('dr', 'Path difference Δr', 'm') + fila('delta', 'or phase difference δ', 'rad')
        : fila('A1', 'Amplitude A<sub>1</sub>', 'm') + fila('f1', 'Frequency f<sub>1</sub>', 'Hz') + fila('A2', 'Amplitude A<sub>2</sub>', 'm') + fila('f2', 'Frequency f<sub>2</sub>', 'Hz');
      $('#nota').textContent = sc.tipo === 'fase' ? 'Give Δr (for example, the extra distance the sound from one loudspeaker travels) or directly δ, which accepts π.' : 'In the drawing, the sum against time with its envelope dashed.';
    } else if (sc.modo === 'energia') {
      h += fila('mu', 'Linear density μ', 'kg/m') + fila('A', 'Amplitude A', 'm') + fila('f', 'Frequency f', 'Hz') + fila('tension', 'Tension T', 'N') + fila('v', 'or speed v', 'm/s');
      $('#nota').textContent = 'Give the tension or directly the propagation speed.';
    } else if (sc.modo === 'reflexion') {
      h += fila('tension', 'Tension T (the same in both)', 'N') + fila('mu1', 'Density of string 1 μ<sub>1</sub>', 'kg/m') + fila('mu2', 'Density of string 2 μ<sub>2</sub>', 'kg/m') + fila('A', 'Incident amplitude', 'm') + fila('f', 'Frequency (optional)', 'Hz');
      $('#nota').textContent = 'The wave arrives along string 1 (left) at the junction with 2. In the drawing, the thicker string is the heavier one.';
    } else if (sc.modo === 'doppler') {
      h += fila('f', 'Frequency emitted by the source', 'Hz') + fila('vs', 'Speed of sound', 'm/s') + fila('Taire', 'or air temperature', '°C') + fila('vF', 'Speed of the source', 'm/s') + fila('vO', 'Speed of the observer', 'm/s');
      $('#nota').innerHTML = 'Positive if they approach each other, negative if they move apart. For wind, a source passing by, the angle or the Mach cone, use <a href="../doppler/">Doppler effect</a>.';
    } else {
      h += fila('P', 'Power of the source', 'W') + fila('r1', 'Distance r₁', 'm') + fila('r2', 'Another distance r₂', 'm') + fila('N', 'Number of identical sources', '');
      $('#nota').textContent = 'Point source emitting equally in all directions, with no reflections or absorption.';
    }
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') sc = copia(O.ejemplos.find((x) => x.sc.modo === t.value).sc);
    if (t.dataset.k === 'tipo') sc = copia(O.ejemplos.find((x) => x.sc.modo === sc.modo && x.sc.tipo === t.value).sc);
    if (t.dataset.k === 'medio') { const ej = O.ejemplos.find((x) => x.sc.medio === t.value); for (const [k, v] of Object.entries(ej.sc)) if (vacioC(sc[k])) sc[k] = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });
  const vacioC = (v) => v === undefined || v === null || String(v).trim() === '';

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Examples…</option>' + O.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = O.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = O.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'armonica') {
      h = dato('Equation', `<b>${sol.ec}</b>`) + dato('λ y T', `λ = ${f(sol.lam)} m, T = ${f(sol.T)} s`) + (sol.punto ? dato(`Point x = ${f(sol.punto.x0)} m, t = ${f(sol.punto.t0)} s`, `y = ${f(sol.punto.y)} m, v<sub>y</sub> = ${f(sol.punto.vy)} m/s`) : '');
      ley = 'Slow-motion animation: one period lasts about 3 s. The red dot is the requested x.';
    } else if (sol.modo === 'estacionaria') {
      h = dato(sol.medio === 'cerrado' ? `Mode ${sol.n} (harmonic ${sol.m})` : `Harmonic ${sol.n}`, `f = <b>${f(sol.fn)} Hz</b>, λ = ${f(sol.lam)} m`) + dato('Fundamental', `${f(sol.freqs[0])} Hz`) + dato('Speed', `v = ${f(sol.v)} m/s`);
      ley = 'Nodes in red and antinodes in blue; in grey, the envelope.';
    } else if (sol.modo === 'superposicion' && sol.tipo === 'pulsaciones') {
      h = dato('Beats', `f<sub>b</sub> = <b>${f(sol.fb)} Hz</b>`) + dato('Frequency heard', `${f(sol.fm)} Hz`) + dato('Amplitude', `from ${f(Math.abs(sol.A1 - sol.A2))} to ${f(sol.A1 + sol.A2)} m`);
      ley = 'The sum of the two waves against time, with the envelope dashed; the vertical line marks the instant.';
    } else if (sol.modo === 'superposicion') {
      h = dato('Resulting amplitude', `A = <b>${f(sol.A)} m</b>${sol.interferencia ? ` (${sol.interferencia})` : ''}`) + dato('Phase difference', `δ = ${f(sol.delta)} rad`) + dato('Wavelength', `λ = ${f(sol.lam)} m`);
      ley = 'In grey, the two waves; in colour, their sum.';
    } else if (sol.modo === 'energia') {
      h = dato('Power', `P = <b>${f(sol.P)} W</b>`) + dato('Energy per metre', `u = <b>${f(sol.u)} J/m</b>`) + dato('Speed', `v = ${f(sol.v)} m/s, λ = ${f(sol.lam)} m`);
      ley = 'The wave carries the energy to the right at speed v.';
    } else if (sol.modo === 'reflexion') {
      h = dato('Reflection coefficient', `r = <b>${f(sol.r)}</b>, A<sub>r</sub> = ${f(sol.r * sol.A)} m`) + dato('Transmission coefficient', `t = <b>${f(sol.t)}</b>, A<sub>t</sub> = ${f(sol.t * sol.A)} m`) + dato('Power', `${f(100 * sol.R, 3)} % reflected, ${f(100 * sol.Tt, 3)} % transmitted`);
      ley = 'A pulse arrives along string 1, and at the junction part is reflected and part passes into string 2 with a different speed.';
    } else if (sol.modo === 'doppler') {
      h = dato('Frequency heard', `f′ = <b>${f(sol.fp)} Hz</b>`) + dato('Change', `${sol.fp >= sol.fr ? '+' : '−'}${f(Math.abs(sol.fp - sol.fr))} Hz (${f((100 * (sol.fp - sol.fr)) / sol.fr, 3)} %)`);
      ley = 'Wavefronts from the source (left) reaching the observer (right), in slow motion.';
    } else {
      h = dato(`A ${f(sol.r1)} m`, `I = ${f(sol.I1)} W/m<sup>2</sup>, <b>β = ${f(sol.b1)} dB</b>`) + (sol.r2 ? dato(`A ${f(sol.r2)} m`, `I = ${f(sol.I2)} W/m<sup>2</sup>, <b>β = ${f(sol.b2)} dB</b>`) : '');
      ley = 'Scale of sound levels with some reference sounds.';
    }
    $('#res').innerHTML = h; $('#leyenda').textContent = ley;
    $('#play').hidden = sol.modo === 'sonido';
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    dibuja();
  }
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Resume'; if (anda) bucle(); });

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
    const onda = (Y, color, ancho) => { g.strokeStyle = color; g.lineWidth = ancho; g.beginPath(); for (let i = 0; i <= 400; i++) { const [x, y] = Y(i / 400); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
    if (sol.modo === 'superposicion' && sol.tipo === 'pulsaciones') {
      const m = 20, cy = h / 2, amp = (h * 0.4) / (sol.A1 + sol.A2), T = 2 / sol.fb, w1 = 2 * Math.PI * sol.f1, w2 = 2 * Math.PI * sol.f2;
      g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(m, cy); g.lineTo(w - m, cy); g.stroke();
      g.strokeStyle = col['--accent']; g.lineWidth = 1.2; g.beginPath();
      const N = Math.min(6000, Math.max(800, Math.ceil(T * sol.fm * 24)));
      for (let i = 0; i <= N; i++) { const t = (T * i) / N, y = sol.A1 * Math.sin(w1 * t) + sol.A2 * Math.sin(w2 * t), x = m + (i / N) * (w - 2 * m); i ? g.lineTo(x, cy - amp * y) : g.moveTo(x, cy - amp * y); }
      g.stroke();
      const env = (t) => Math.sqrt(sol.A1 ** 2 + sol.A2 ** 2 + 2 * sol.A1 * sol.A2 * Math.cos((w1 - w2) * t));
      g.setLineDash([5, 4]);
      for (const sg of [1, -1]) onda((u) => [m + u * (w - 2 * m), cy - sg * amp * env(u * T)], col['--peso'], 1.4);
      g.setLineDash([]);
      const xc = m + (((fase / 3) % 2) / 2) * (w - 2 * m);
      g.strokeStyle = col['--ink']; g.lineWidth = 1; g.beginPath(); g.moveTo(xc, 10); g.lineTo(xc, h - 24); g.stroke();
      texto(g, m, h - 10, '0', col['--muted'], 'left'); texto(g, w - m, h - 10, `${txt(f(T))} s`, col['--muted'], 'right');
      texto(g, w / 2, h - 10, `${txt(f(sol.fb))} beats per second`, col['--muted']);
    } else if (sol.modo === 'superposicion') {
      const m = 20, cy = h / 2, amp = (h * 0.38) / (sol.A1 + sol.A2), X = 2 * sol.lam, sx = (w - 2 * m) / X, wt = 2 * Math.PI * fase;
      g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(m, cy); g.lineTo(w - m, cy); g.stroke();
      const y1 = (x) => sol.A1 * Math.sin(wt - sol.k * x), y2 = (x) => sol.A2 * Math.sin(wt - sol.k * x + sol.delta);
      onda((u) => [m + u * (w - 2 * m), cy - amp * y1(u * X)], col['--muted'], 1.2);
      g.setLineDash([5, 4]); onda((u) => [m + u * (w - 2 * m), cy - amp * y2(u * X)], col['--muted'], 1.2); g.setLineDash([]);
      onda((u) => [m + u * (w - 2 * m), cy - amp * (y1(u * X) + y2(u * X))], col['--accent'], 2.4);
      texto(g, m, 14, `A = ${txt(f(sol.A))} m`, col['--accent'], 'left', '600 ');
      for (let j = 0; j <= 4; j++) texto(g, m + ((j * sol.lam) / 2) * sx, h - 10, ['0', 'λ/2', 'λ', '3λ/2', '2λ'][j], col['--muted']);
    } else if (sol.modo === 'reflexion') {
      const m = 16, cy = h / 2, x0 = w / 2, amp = h * 0.3, L = x0 - m, ciclo = (fase / 1.5) % 2.2, ancho = L * 0.12;
      const vmax = Math.max(sol.v1, sol.v2), p1 = (L * sol.v1) / vmax, p2 = (L * sol.v2) / vmax;
      const pulso = (x, c) => Math.exp(-(((x - c) / ancho) ** 2));
      const u = ciclo - 1, y = (x) => (x <= x0 ? pulso(x, x0 + u * p1) + sol.r * pulso(x, x0 - u * p1) : sol.t * pulso(x, x0 + u * p2));
      g.lineWidth = 1 + 3 * Math.sqrt(sol.mu1 / Math.max(sol.mu1, sol.mu2)) * 1.5; g.strokeStyle = col['--accent'];
      g.beginPath(); for (let i = 0; i <= 200; i++) { const x = m + (i / 200) * L; i ? g.lineTo(x, cy - amp * y(x)) : g.moveTo(x, cy - amp * y(x)); } g.stroke();
      g.lineWidth = 1 + 3 * Math.sqrt(sol.mu2 / Math.max(sol.mu1, sol.mu2)) * 1.5; g.strokeStyle = col['--normal'];
      g.beginPath(); for (let i = 0; i <= 200; i++) { const x = x0 + (i / 200) * (w - m - x0); i ? g.lineTo(x, cy - amp * y(x)) : g.moveTo(x, cy - amp * y(x)); } g.stroke();
      g.fillStyle = col['--ink']; g.beginPath(); g.arc(x0, cy, 4, 0, 2 * Math.PI); g.fill();
      texto(g, m + L / 2, h - 12, `string 1 · v₁ = ${txt(f(sol.v1))} m/s`, col['--muted']); texto(g, x0 + (w - m - x0) / 2, h - 12, `string 2 · v₂ = ${txt(f(sol.v2))} m/s`, col['--muted']);
    } else if (sol.modo === 'armonica' || sol.modo === 'energia') {
      if (sol.modo === 'energia') Object.assign(sol, { mas: true, fase: 0 });
      const m = 20, cy = h / 2, amp = h * 0.32, X = 2 * sol.lam, sx = (w - 2 * m) / X;
      g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(m, cy); g.lineTo(w - m, cy); g.stroke();
      for (let j = 0; j <= 4; j++) { const x = m + (j * sol.lam) / 2 * sx; g.beginPath(); g.moveTo(x, cy - 4); g.lineTo(x, cy + 4); g.stroke(); texto(g, x, cy + amp + 18, ['0', 'λ/2', 'λ', '3λ/2', '2λ'][j], col['--muted']); }
      const y = (x) => Math.sin(2 * Math.PI * fase + (sol.mas ? -1 : 1) * sol.k * x + sol.fase);
      g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
      for (let i = 0; i <= 400; i++) { const x = (X * i) / 400, py = cy - amp * y(x); i ? g.lineTo(m + x * sx, py) : g.moveTo(m + x * sx, py); }
      g.stroke();
      if (sol.punto && sol.punto.x0 >= 0 && sol.punto.x0 <= X) { const px = m + sol.punto.x0 * sx, py = cy - amp * y(sol.punto.x0); g.fillStyle = col['--peso']; g.beginPath(); g.arc(px, py, 5, 0, 2 * Math.PI); g.fill(); }
      const yf = 18, dir = sol.mas ? 1 : -1;
      g.strokeStyle = col['--muted']; g.fillStyle = col['--muted']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(w / 2 - 30 * dir, yf); g.lineTo(w / 2 + 30 * dir, yf); g.stroke();
      g.beginPath(); g.moveTo(w / 2 + 36 * dir, yf); g.lineTo(w / 2 + 28 * dir, yf - 5); g.lineTo(w / 2 + 28 * dir, yf + 5); g.closePath(); g.fill();
      texto(g, w / 2 + 48 * dir, yf, `v = ${txt(f(sol.v))} m/s`, col['--muted'], dir > 0 ? 'left' : 'right');
      texto(g, m, cy - amp - 10, sol.modo === 'energia' ? `P = ${txt(f(sol.P))} W` : `A = ${txt(f(sol.A))} m`, col['--muted'], 'left');
    } else if (sol.modo === 'estacionaria') {
      const m = 24, cy = h / 2, amp = h * 0.3, L = sol.L, sx = (w - 2 * m) / L;
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
      const ref = [[0, 'umbral'], [30, 'susurro'], [60, 'conversation'], [85, 'traffic'], [110, 'concierto'], [130, 'dolor']];
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
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', '.');
    const tipos = [
      () => ({ modo: 'estacionaria', medio: 'cuerda', L: c(de([0.5, 0.6, 0.65, 0.8, 1])), tension: String(ent(4, 20) * 10), mu: c(de([0.001, 0.002, 0.005, 0.01])), n: String(ent(1, 4)) }),
      () => ({ modo: 'estacionaria', medio: de(['abierto', 'cerrado']), L: c(de([0.4, 0.5, 0.85, 1, 1.2])), vs: '340', n: String(ent(1, 3)) }),
      () => ({ modo: 'doppler', f: String(ent(4, 10) * 100), vs: '340', vF: String(de([-30, -20, 20, 25, 30])), vO: '0' }),
      () => ({ modo: 'sonido', P: c(de([0.01, 0.05, 0.1, 1])), r1: String(ent(1, 5)), r2: String(ent(6, 20)), N: '' }),
      () => ({ modo: 'superposicion', tipo: 'pulsaciones', A1: '1', f1: String(ent(250, 450)), A2: '1', f2: '' }),
      () => ({ modo: 'energia', mu: c(de([0.01, 0.02, 0.05])), A: c(de([0.005, 0.01, 0.02])), f: String(ent(2, 10) * 10), tension: String(ent(2, 10) * 10), v: '' }),
      () => ({ modo: 'reflexion', tension: String(ent(2, 10) * 10), mu1: c(de([0.01, 0.04])), mu2: c(de([0.09, 0.0025, 0.16])), A: '0,02', f: '' }),
    ];
    sc = de(tipos)();
    if (sc.modo === 'superposicion') sc.f2 = String(+sc.f1 + ent(1, 6));
    formulario(); sel.value = ''; calcula();
  }
  const enunciado = () => {
    const e = (x) => esc(String(x ?? '').replace('.', '.'));
    if (sc.modo === 'estacionaria' && sc.medio === 'cuerda') return `A ${e(sc.L)} m string with fixed ends, tension ${e(sc.tension)} N and linear density ${e(sc.mu)} kg/m vibrates in its harmonic ${e(sc.n)}. Calculate the speed of the waves, the wavelength, the frequency and the fundamental.`;
    if (sc.modo === 'estacionaria') return `A ${e(sc.L)} m tube ${sc.medio === 'abierto' ? 'open at both ends' : 'closed at one end'} (v = ${e(sc.vs)} m/s) sounds in its mode ${e(sc.n)}. Calculate the frequency, the wavelength and the fundamental.`;
    if (sc.modo === 'doppler') return `A siren of ${e(sc.f)} Hz ${+sc.vF > 0 ? 'approaches' : 'moves away from'} a stationary observer at ${e(String(sc.vF).replace('-', ''))} m/s (v = ${e(sc.vs)} m/s). What frequency do they hear?`;
    if (sc.modo === 'sonido') return `A loudspeaker emits ${e(sc.P)} W equally in all directions. Calculate the intensity and the sound level at ${e(sc.r1)} m and at ${e(sc.r2)} m.`;
    if (sc.modo === 'superposicion') return `Two tuning forks of ${e(sc.f1)} Hz and ${e(sc.f2)} Hz with the same amplitude (${e(sc.A1)}) sound at the same time. Calculate the beat frequency, the frequency that is heard and between which values the amplitude varies.`;
    if (sc.modo === 'energia') return `A wave of amplitude ${e(sc.A)} m and frequency ${e(sc.f)} Hz travels along a string of ${e(sc.mu)} kg/m with a tension of ${e(sc.tension)} N. Calculate the power it carries, the energy per metre, the speed and the wavelength.`;
    if (sc.modo === 'reflexion') return `A string of ${e(sc.mu1)} kg/m is joined to another of ${e(sc.mu2)} kg/m, both with a tension of ${e(sc.tension)} N. A wave of amplitude ${e(sc.A)} m arrives along the first: calculate the reflection and transmission coefficients, the amplitudes and the power distribution.`;
    return `Calculate the wave equation and its characteristics.`;
  };

  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.OndasApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, ec: sol.ec, fn: sol.fn, fp: sol.fp, b1: sol.b1 }, estado: () => copia(sc), pausa: () => { anda = false; } };
})();

