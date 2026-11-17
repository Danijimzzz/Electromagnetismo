(() => {
  const { $, esc, copia } = Herramienta;
  const F = Faraday, f = F.f, CLAVE = 'faraday-v1';
  const txt = (h) => String(h).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '');
  const MODOS = [['barra', 'Bar on rails'], ['giratoria', 'Rotating coil (alternator)'], ['flujo', 'Flux changing in a given time'], ['cruza', 'Loop crossing a field'], ['hilo', 'Straight wire and rectangular loop'], ['funcion', 'Field B(t) changing with time'], ['dinamica', 'Bar with mass: terminal velocity'], ['gira', 'Rotating rod or disc'], ['foucault', 'Eddy currents']];

  let sc = copia(F.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {}, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="${k === 'expr' ? 'text' : 'decimal'}" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const sentidoB = () => elige('sentidoB', 'Direction of B', [['entrante', '⊗ Incoming (toward the screen)'], ['saliente', '⊙ Outgoing']]);
  const forma = () => elige('forma', 'Shape of the loop', [['circulo', 'Circular (radius r)'], ['rectangulo', 'Rectangular (a × b)'], ['area', 'I give the area S']]) + (sc.forma === 'circulo' ? fila('r', 'Radius r', 'm') : sc.forma === 'rectangulo' ? fila('a', 'Side a', 'm') + fila('b', 'Side b', 'm') : fila('S', 'Area S', 'm²'));
  function formulario() {
    let h = elige('modo', 'Situation', MODOS);
    if (sc.modo === 'barra') {
      h += fila('B', 'Field B', 'T') + sentidoB() + fila('L', 'Length of the bar L', 'm') + fila('v', 'Velocity v', 'm/s') + fila('R', 'Resistance R (optional)', 'Ω');
      $('#nota').textContent = 'v positive to the right (the circuit is closed by the resistance on the left) and negative to the left.';
    } else if (sc.modo === 'giratoria') {
      h += fila('N', 'Number of turns N', '') + fila('B', 'Field B', 'T') + forma() + fila('w', 'Rotation speed', '') + elige('uw', 'Unit', [['Hz', 'Hz (turns per second)'], ['rpm', 'rpm'], ['rad/s', 'rad/s']]) + sep('Optional') + fila('R', 'Resistance R', 'Ω') + fila('t', 'Instant t', 's');
      $('#nota').textContent = 'At t = 0 the loop is perpendicular to B, with maximum flux.';
    } else if (sc.modo === 'flujo') {
      h += fila('N', 'Number of turns N', '') + forma() + sentidoB() + sep('Before and after') + fila('B1', 'Initial field B₁', 'T') + fila('B2', 'Final field B₂', 'T') + fila('th1', 'Initial angle θ₁', '°') + fila('th2', 'Final angle θ₂', '°') + fila('dt', 'Time taken Δt', 's') + fila('R', 'Resistance R (optional)', 'Ω');
      $('#nota').textContent = 'θ is the angle between B and the normal to the loop. If B₂ or θ₂ are left empty, they do not change.';
    } else if (sc.modo === 'hilo') {
      h += fila('I', 'Wire current I', 'A') + elige('sentidoI', 'Direction of I', [['arriba', '↑ Upward'], ['abajo', '↓ Downward']]) + fila('d', 'Distance from the wire to the near side d', 'm') + fila('w', 'Width of the loop w', 'm') + fila('h', 'Height of the loop h (parallel to the wire)', 'm') + fila('N', 'Number of turns N', '') + sep('What changes') + fila('v', 'Velocity of the loop v', 'm/s') + fila('dIdt', 'Rate of change dI/dt', 'A/s') + fila('R', 'Resistance R (optional)', 'Ω');
      $('#nota').textContent = 'The wire is vertical, to the left of the loop and in the same plane. v is positive if the loop moves away from the wire; you can give v, dI/dt or both.';
    } else if (sc.modo === 'funcion') {
      const t = sc.tipoB || 'lineal';
      h += fila('N', 'Number of turns N', '') + forma() + sentidoB() + elige('tipoB', 'How B changes', Object.entries(F.FUNCB).map(([k, v]) => [k, v.nombre])) + (t === 'libre' ? fila('expr', 'B(t) in T (t in s)', '') + fila('tf', 'Window: from 0 to', 's') : fila('B0', 'B₀', 'T')) + (t === 'lineal' || t === 'cuadratica' ? fila('k', 'Constant k', t === 'lineal' ? 'T/s' : 'T/s²') : '') + (t === 'seno' ? fila('w', 'Angular frequency ω', 'rad/s') : '') + (t === 'exp' ? fila('tau', 'Time constant τ', 's') : '') + fila('th', 'Angle between B and the normal θ', '°') + fila('t', 'Instant t', 's') + fila('R', 'Resistance R (optional)', 'Ω');
      $('#nota').textContent = 'The direction of B is that of the positive values of B(t). The emf is calculated at the instant t and B(t) and ε(t) are plotted.';
    } else if (sc.modo === 'dinamica') {
      h += elige('caso', 'Situation', [['fuerza', 'Pulled with a constant force F'], ['cae', 'Falls on vertical rails'], ['lanzada', 'Launched with v₀ and released']]) + fila('B', 'Field B', 'T') + fila('L', 'Length of the bar L', 'm') + fila('R', 'Resistance R', 'Ω') + fila('m', 'Mass of the bar m', 'kg') + (sc.caso === 'fuerza' ? fila('F', 'Force F', 'N') : sc.caso === 'lanzada' ? fila('v0', 'Initial velocity v₀', 'm/s') : fila('ang', 'Angle of the rails with the horizontal', '°, empty = 90°') + elige('g', 'Gravity g', [['9.8', '9,8 m/s²'], ['9.80665', '9,80665 m/s²']])) + sep('Optional') + fila('t', 'Instant t', 's');
      $('#nota').textContent = sc.caso === 'cae' ? 'The bar starts from rest and slides without friction on vertical rails (or inclined ones if you give the angle); B is perpendicular to the plane of the rails.' : 'Without friction; the bar starts ' + (sc.caso === 'fuerza' ? 'from rest.' : 'with v₀ and nobody pushes it.');
    } else if (sc.modo === 'foucault') {
      h += elige('geo', 'Piece', [['disco', 'Disc or circular plate (B perpendicular)'], ['lamina', 'Laminated core (B in the plane of the laminations)']]) + fila('sigma', 'Conductivity σ', 'MS/m') + fila('B0', 'Field amplitude B₀', 'T') + fila('fr', 'Frequency f', 'Hz')
        + (sc.geo === 'lamina' ? fila('D', 'Total thickness of the core D', 'mm') + fila('N', 'Number of laminations N', '') + fila('V', 'Volume of the core', 'cm³') : fila('a', 'Radius of the disc a', 'cm') + fila('d', 'Thickness of the disc d', 'mm'));
      $('#nota').textContent = 'Simple model: uniform field B₀ sin ωt throughout the piece. Copper 58 MS/m, aluminium 35, iron 10, silicon steel 2. A warning appears when the piece is large compared with the penetration depth.';
    } else if (sc.modo === 'gira') {
      h += elige('cuerpo', 'What rotates', [['varilla', 'Rod rotating about one end'], ['disco', 'Conducting disc (Faraday disc)']]) + fila('B', 'Field B (perpendicular)', 'T') + sentidoB() + fila('L', sc.cuerpo === 'disco' ? 'Radius of the disc R' : 'Length of the rod L', 'm') + fila('w', 'Rotation speed', '') + elige('uw', 'Unit', [['rad/s', 'rad/s'], ['rpm', 'rpm'], ['Hz', 'Hz (turns per second)']]) + fila('R', 'Circuit resistance (optional)', 'Ω');
      $('#nota').textContent = 'B is perpendicular to the plane in which it rotates. The emf appears between the axis and the end.';
    } else {
      h += fila('N', 'Number of turns N', '') + fila('a', 'Side of the square loop a', 'm') + fila('D', 'Width of the region with field D', 'm') + fila('v', 'Velocity v', 'm/s') + fila('B', 'Field B', 'T') + sentidoB() + fila('R', 'Resistance R (optional)', 'Ω');
      $('#nota').textContent = 'The loop moves to the right at constant velocity and enters through the left edge of the region.';
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
    if (t.dataset.k === 'tipoB') { const d = { lineal: { k: '0.5' }, cuadratica: { k: '0.4' }, seno: { w: '314', B0: '0.05' }, exp: { tau: '0.5', B0: '1' }, libre: { expr: '0.2 sen(2 pi t)', tf: '1' } }[t.value]; for (const [k, v] of Object.entries(d)) if (vacioC(sc[k])) sc[k] = v; }
    if (t.dataset.k === 'geo') { const d = { disco: { a: '5', d: '2' }, lamina: { D: '20', N: '100', V: '500' } }[t.value]; for (const [k, v] of Object.entries(d)) if (vacioC(sc[k])) sc[k] = v; }
    if (t.dataset.k === 'caso') { const d = { fuerza: { F: '0.5' }, lanzada: { v0: '5' }, cae: {} }[t.value]; for (const [k, v] of Object.entries(d)) if (vacioC(sc[k])) sc[k] = v; }
    if (t.dataset.k === 'forma') { const d = { circulo: { r: '0.05' }, rectangulo: { a: '0.1', b: '0.2' }, area: { S: '0.01' } }[t.value]; for (const [k, v] of Object.entries(d)) if (vacioC(sc[k])) sc[k] = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Examples…</option>' + F.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = F.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = F.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tAnim = 0;
    let h = '', ley = '';
    if (sol.modo === 'barra') {
      h = dato('Induced emf', `ε = <b>${f(sol.eps)} V</b>`) + dato('Direction of the current', `<b>${sol.sentido}</b>`) + (sol.I !== null ? dato('Current', `I = <b>${f(sol.I)} A</b>`) + dato('Force braking the bar', `F = ${f(sol.F)} N`) : '');
      ley = 'Red arrows: induced current. Green: velocity of the bar; orange: magnetic force on it.';
    } else if (sol.modo === 'giratoria') {
      h = dato('Maximum emf', `ε<sub>max</sub> = <b>${f(sol.em)} V</b>`) + dato('Rms emf', `ε<sub>rms</sub> = ${f(sol.ef)} V`) + dato('Maximum flux', `Φ<sub>max</sub> = ${f(sol.Fm)} Wb`) + (sol.Im !== null ? dato('Maximum current', `I<sub>max</sub> = ${f(sol.Im)} A`) + dato('Mean torque', `M = ${f(sol.par)} N·m`) : '') + (sol.et !== null ? dato(`ε at t = ${f(sol.t)} s`, `${f(sol.et)} V`) : '');
      ley = 'In slow motion: one turn lasts 3 s. Below, Φ(t) in blue and ε(t) in red: the emf is maximum when the flux passes through 0.';
    } else if (sol.modo === 'flujo') {
      h = dato('Change in flux', `ΔΦ = ${f(sol.dF)} Wb`) + dato('Mean emf', `ε = <b>${f(sol.em)} V</b>`) + dato('Direction of the current', `<b>${sol.sentido}</b>`) + (sol.I !== null ? dato('Current and charge', `I = ${f(sol.I)} A, q = ${f(sol.q)} C`) : '');
      ley = 'The size of the symbols indicates the strength of the field; the loop looks tilted if the angle changes. On the right, Φ(t).';
    } else if (sol.modo === 'hilo') {
      h = dato('Flux in the loop', `Φ = ${f(sol.Phi)} Wb`) + dato('Induced emf', `|ε| = <b>${f(sol.eps)} V</b>`) + dato('Direction of the current', `<b>${sol.sentido}</b>`) + (sol.Ii !== null ? dato('Induced current', `I = ${f(sol.Ii)} A`) + dato('Force on the loop', `F = ${f(sol.F)} N`) : '');
      ley = `The field of the wire is ${sol.sentidoB} in the loop and gets weaker moving away (smaller symbols). Red arrows: induced current.`;
    } else if (sol.modo === 'funcion') {
      h = dato(`B at t = ${f(sol.t)} s`, `B = ${f(sol.Bt)} T`) + dato('Flux', `Φ = ${f(sol.Phi)} Wb`) + dato('Emf', `ε = <b>${f(sol.eps)} V</b>`) + (sol.sentido ? dato('Direction', `<b>${sol.sentido}</b>`) : '') + (sol.I !== null ? dato('Current', `I = ${f(sol.I)} A`) : '');
      ley = 'Above, the loop with the changing field. Below, B(t) in blue and ε(t) in red; the vertical line marks the instant t.';
    } else if (sol.modo === 'dinamica') {
      h = dato('Time constant', `τ = <b>${f(sol.tau)} s</b>`) + (sol.caso !== 'lanzada' ? dato('Terminal velocity', `v<sub>L</sub> = <b>${f(sol.vL)} m/s</b>`) + dato('Terminal current', `I<sub>L</sub> = ${f(sol.IL)} A`) + dato('Power at the limit', `P = ${f(sol.PL)} W`) : dato('Distance until it stops', `x = <b>${f(sol.v0 * sol.tau)} m</b>`)) + (sol.vt !== null ? dato(`At t = ${f(sol.t)} s`, `v = ${f(sol.vt)} m/s, I = ${f(sol.It)} A`) : '');
      ley = 'The bar accelerates (or brakes) until the magnetic force balances the one that moves it. Below, v(t) in blue and I(t) in red, which approach their limit values.';
    } else if (sol.modo === 'foucault') {
      h = dato('Mean dissipated power', `⟨P⟩ = <b>${f(sol.P)} W</b>`) + dato('Maximum power', `P<sub>max</sub> = ${f(sol.Pp)} W`) + dato('Power per volume', `p = ${f(sol.pv)} W/m³`) + dato('Maximum current density', `J<sub>max</sub> = ${f(sol.Jmax)} A/m²`) + dato('Penetration depth', `δ = ${f(sol.delta * 1000)} mm`) + (sol.comp ? dato(`Unlaminated (N = 1)`, `⟨P⟩ = ${f(sol.comp.P1)} W · ${f(sol.comp.reduccion)} times more`) : '') + (sol.aviso ? dato('Warning', `<b>${sol.aviso}</b>`) : '');
      ley = 'Eddy currents are closed loops in the material, perpendicular to B; they reverse direction every half period. Below, B(t) in blue and J(t) in red (maximum when B passes through zero).';
    } else if (sol.modo === 'gira') {
      h = dato('Emf between the axis and the end', `ε = <b>${f(sol.eps)} V</b>`) + dato('Angular velocity', `ω = ${f(sol.w)} rad/s`) + (sol.I !== null ? dato('Current', `I = ${f(sol.I)} A`) + dato('Power', `P = ${f(sol.P)} W`) : '');
      ley = `${sol.cuerpo === 'disco' ? 'The disc' : 'The rod'} rotates in a uniform field; the shaded area is the swept area, which makes the flux grow at the rate ½BωL².`;
    } else {
      h = dato('Emf on entering and leaving', `|ε| = <b>${f(sol.eps)} V</b>`) + dato('Direction', `enters: <b>${sol.tramos[0].sentido}</b>, leaves: <b>${sol.tramos[2].sentido}</b>`) + (sol.I !== null ? dato('Current', `I = ${f(sol.I)} A`) + dato('Heat dissipated', `Q = ${f(sol.Q)} J`) : '');
      ley = 'Below, Φ(t) in blue and ε(t) in red: there is only emf while the part of the loop inside the field changes.';
    }
    $('#res').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    dibuja();
  }
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Resume'; if (anda) { ultimo = performance.now(); bucle(); } });

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--tension', '--cuerpo', '--suelo']) col[k] = cs.getPropertyValue(k).trim(); }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  function flecha(g, x1, y1, x2, y2, color, ancho = 2) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = ancho; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - 7 * Math.cos(a), y2 - 7 * Math.sin(a)); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 10 * Math.cos(a) + 5 * Math.sin(a), y2 - 10 * Math.sin(a) - 5 * Math.cos(a)); g.lineTo(x2 - 10 * Math.cos(a) - 5 * Math.sin(a), y2 - 10 * Math.sin(a) + 5 * Math.cos(a)); g.closePath(); g.fill();
  }
  function punta(g, x, y, a, color) { g.fillStyle = color; g.beginPath(); g.moveTo(x + 6 * Math.cos(a), y + 6 * Math.sin(a)); g.lineTo(x - 6 * Math.cos(a) + 5 * Math.sin(a), y - 6 * Math.sin(a) - 5 * Math.cos(a)); g.lineTo(x - 6 * Math.cos(a) - 5 * Math.sin(a), y - 6 * Math.sin(a) + 5 * Math.cos(a)); g.closePath(); g.fill(); }
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
      g.strokeStyle = col['--ink']; g.lineWidth = 2; g.beginPath(); g.moveTo(xR, yA); g.lineTo(xR, yA + (yB - yA) * 0.3);
      for (let i = 0; i <= 8; i++) g.lineTo(xR + (i % 2 ? 9 : -9) * (i && i < 8 ? 1 : 0), yA + (yB - yA) * (0.3 + 0.4 * (i / 8)));
      g.lineTo(xR, yB); g.stroke(); texto(g, xR + 22, (yA + yB) / 2 - 22, sol.R ? `R = ${txt(f(sol.R))} Ω` : 'R', col['--ink'], 'left');
      g.fillStyle = col['--roz']; g.fillRect(xb - 5, yA - 12, 10, yB - yA + 24);
      corrienteRect(g, xR, yA, xb, yB, sol.sentido === 'clockwise', rojo);
      const dir = sol.v > 0 ? 1 : -1, ym = (yA + yB) / 2;
      flecha(g, xb, ym - 18, xb + dir * 60, ym - 18, col['--normal'], 2.4); texto(g, xb + dir * 66, ym - 18, 'v', col['--normal'], dir > 0 ? 'left' : 'right', '600 ');
      if (sol.F) { flecha(g, xb, ym + 18, xb - dir * 60, ym + 18, col['--roz'], 2.4); texto(g, xb - dir * 66, ym + 18, 'F', col['--roz'], dir > 0 ? 'right' : 'left', '600 '); }
      texto(g, xb, yA - 22, `L = ${txt(f(sol.L))} m`, col['--muted']);
      texto(g, w / 2, h - 14, `ε = ${txt(f(sol.eps))} V${sol.I !== null ? ` · I = ${txt(f(sol.I))} A` : ''} · ${sol.sentido}`, col['--ink'], 'center', '600 ');
    } else if (sol.modo === 'giratoria') {
      const hs = h * 0.56, T = 3, th = 2 * Math.PI * (tAnim / T), cx = w / 2, cy = hs / 2, W = Math.min(w * 0.18, 110), H = hs * 0.62;
      g.fillStyle = rojo; g.fillRect(14, cy - hs * 0.36, 34, hs * 0.72); g.fillStyle = col['--tension']; g.fillRect(w - 48, cy - hs * 0.36, 34, hs * 0.72);
      texto(g, 31, cy, 'N', '#fff', 'center', '600 '); texto(g, w - 31, cy, 'S', '#fff', 'center', '600 ');
      g.strokeStyle = col['--line']; g.lineWidth = 1;
      for (let k = -2; k <= 2; k++) { const y = cy + k * hs * 0.15; g.beginPath(); g.moveTo(56, y); g.lineTo(w - 56, y); g.stroke(); punta(g, w * 0.25, y, 0, col['--line']); punta(g, w * 0.75, y, 0, col['--line']); }
      const ww = W * Math.sin(th);
      g.fillStyle = col['--roz']; g.globalAlpha = 0.18; g.fillRect(cx - Math.abs(ww), cy - H / 2, 2 * Math.abs(ww), H); g.globalAlpha = 1;
      g.strokeStyle = col['--roz']; g.lineWidth = 3; g.strokeRect(cx - Math.abs(ww), cy - H / 2, 2 * Math.abs(ww), H);
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(cx, cy - H / 2 - 16); g.lineTo(cx, cy + H / 2 + 16); g.stroke(); g.setLineDash([]);
      const tf = 2 / sol.fr, pts = (fn) => Array.from({ length: 241 }, (_, i) => { const t = (tf * i) / 240; return [t, fn(t)]; });
      grafica(g, 20, hs + 8, w - 40, h - hs - 16, tf, [{ pts: pts((t) => Math.cos(sol.w * t)), color: col['--tension'], nombre: `Φ (max ${txt(f(sol.Fm))} Wb)` }, { pts: pts((t) => Math.sin(sol.w * t)), color: rojo, nombre: `ε (max ${txt(f(sol.em))} V)` }], ((tAnim / T) % 2) * (1 / sol.fr));
    } else if (sol.modo === 'flujo') {
      const T = 3, ciclo = (tAnim % (T + 1.2)) / T, s = Math.min(1, ciclo), B = sol.B1 + (sol.B2 - sol.B1) * s, th = sol.th1 + (sol.th2 - sol.th1) * s;
      const Bmax = Math.max(Math.abs(sol.B1), Math.abs(sol.B2)) || 1, wl = w * 0.56, cx = wl / 2, cy = h / 2;
      campo(g, 0, 0, wl, h, ent === B >= 0, Math.abs(B) / Bmax);
      const kx = Math.cos((th * Math.PI) / 180), R = Math.min(wl, h) * 0.32;
      g.strokeStyle = col['--roz']; g.lineWidth = 3.5;
      if (sol.forma === 'rectangulo' || sol.forma === 'area') { g.strokeRect(cx - R * Math.abs(kx), cy - R * 0.8, 2 * R * Math.abs(kx), 1.6 * R); if (s < 1) corrienteRect(g, cx - R * Math.abs(kx), cy - R * 0.8, cx + R * Math.abs(kx), cy + R * 0.8, sol.sentido === 'clockwise', rojo); }
      else {
        g.beginPath(); g.ellipse(cx, cy, Math.max(1, R * Math.abs(kx)), R, 0, 0, 2 * Math.PI); g.stroke();
        if (s < 1) { const hor = sol.sentido === 'clockwise'; punta(g, cx, cy - R, hor ? 0 : Math.PI, rojo); punta(g, cx, cy + R, hor ? Math.PI : 0, rojo); }
      }
      texto(g, cx, h - 14, `B = ${txt(f(B, 3))} T · θ = ${txt(f(th, 3))}°${s < 1 ? ` · ${sol.sentido}` : ' · no current'}`, col['--ink'], 'center', '600 ');
      const tf = sol.dt * 1.4, pts = Array.from({ length: 141 }, (_, i) => { const t = (tf * i) / 140, u = Math.min(1, t / sol.dt); return [t, sol.N * (sol.B1 + (sol.B2 - sol.B1) * u) * sol.S * Math.cos(((sol.th1 + (sol.th2 - sol.th1) * u) * Math.PI) / 180)]; });
      const gx = wl + 20, gw = w - wl - 34, gy = 30, gh = h - 70, max = Math.max(...pts.map((p) => Math.abs(p[1]))) || 1, X = (t) => gx + (t / tf) * gw, Y = (y) => gy + gh / 2 - (y / max) * (gh / 2 - 6);
      g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + gh); g.moveTo(gx, Y(0)); g.lineTo(gx + gw, Y(0)); g.stroke();
      g.strokeStyle = col['--tension']; g.lineWidth = 2.2; g.beginPath(); pts.forEach(([t, y], i) => (i ? g.lineTo(X(t), Y(y)) : g.moveTo(X(t), Y(y)))); g.stroke();
      texto(g, gx + 4, gy - 12, 'Φ(t)', col['--tension'], 'left', '600 '); texto(g, X(sol.dt), Y(0) + 14, `Δt = ${txt(f(sol.dt))} s`, col['--muted']);
      const tc = s * sol.dt + Math.max(0, ciclo - 1) * T * (sol.dt / T);
      g.strokeStyle = col['--ink']; g.globalAlpha = 0.5; g.beginPath(); g.moveTo(X(Math.min(tf, tc)), gy); g.lineTo(X(Math.min(tf, tc)), gy + gh); g.stroke(); g.globalAlpha = 1;
    } else if (sol.modo === 'hilo') {
      const xh = w * 0.14, dmax = sol.d + sol.w, esc = (w * 0.7) / (dmax * (sol.v > 0 ? 1.6 : 1.1)), T = 4, s = sol.v ? (tAnim % T) / T : 0, d = sol.d * (1 + (sol.v > 0 ? 0.5 : -0.4) * s * Math.sign(sol.v));
      const x0 = xh + d * esc, x1 = x0 + sol.w * esc, hh = Math.min(h * 0.6, sol.h * esc), y0 = h / 2 - hh / 2, y1 = h / 2 + hh / 2, ent = sol.sentidoB === 'entrante';
      for (let x = xh + 26; x < w; x += 30) campo(g, x - 15, 0, x + 15, h - 30, ent, Math.min(1.3, Math.max(0.25, (w * 0.12) / (x - xh))), 30);
      g.strokeStyle = col['--tension']; g.lineWidth = 4; g.beginPath(); g.moveTo(xh, 10); g.lineTo(xh, h - 30); g.stroke();
      punta(g, xh, h / 2 - 40, (sc.sentidoI === 'abajo') === (sol.I >= 0) ? Math.PI / 2 : -Math.PI / 2, col['--tension']); texto(g, xh - 8, 20, `I = ${txt(f(Math.abs(sol.I)))} A`, col['--tension'], 'right', '600 ');
      g.strokeStyle = col['--roz']; g.lineWidth = 3.5; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
      corrienteRect(g, x0, y0, x1, y1, sol.sentido === 'clockwise', rojo);
      if (sol.v) flecha(g, x1 + 6, h / 2, x1 + 6 + 50 * Math.sign(sol.v), h / 2, col['--normal'], 2.4);
      texto(g, (xh + x0) / 2, y1 + 14, 'd', col['--muted']); texto(g, (x0 + x1) / 2, y0 - 10, 'w', col['--muted']); texto(g, x1 + 10, y1 - 10, 'h', col['--muted'], 'left');
      texto(g, w / 2, h - 12, `|ε| = ${txt(f(sol.eps))} V · ${sol.sentido}`, col['--ink'], 'center', '600 ');
    } else if (sol.modo === 'funcion') {
      const hs = h * 0.5, tf = sol.tipo === 'libre' ? sol.tf : Math.max(sol.t * 1.6, sol.tipo === 'seno' ? (4 * Math.PI) / sol.p.w : sol.tipo === 'exp' ? 4 * sol.p.tau : 1), T = 5, tc = ((tAnim % T) / T) * tf, B = sol.Bf(tc);
      const Bmax = Math.max(...Array.from({ length: 81 }, (_, i) => Math.abs(sol.Bf((tf * i) / 80)))) || 1, cx = w / 2, cy = hs / 2, R = hs * 0.36;
      campo(g, 0, 0, w, hs, (B >= 0) === (sol.sentidoB === 'entrante'), Math.abs(B) / Bmax);
      g.strokeStyle = col['--roz']; g.lineWidth = 3.5;
      if (sol.forma === 'circulo') { g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke(); } else g.strokeRect(cx - R * 1.3, cy - R, 2.6 * R, 2 * R);
      texto(g, cx, hs - 8, `t = ${txt(f(tc, 3))} s · B = ${txt(f(B, 3))} T`, col['--ink'], 'center', '600 ');
      const pts = (fn) => Array.from({ length: 241 }, (_, i) => { const t = (tf * i) / 240; return [t, fn(t)]; });
      grafica(g, 20, hs + 8, w - 40, h - hs - 16, tf, [{ pts: pts(sol.Bf), color: col['--tension'], nombre: 'B(t)' }, { pts: pts(sol.Ef), color: rojo, nombre: 'ε(t)' }], sol.t);
    } else if (sol.modo === 'dinamica') {
      const hs = h * 0.5, tf = 5 * sol.tau, T = 5, tc = ((tAnim % T) / T) * tf, cae = sol.caso === 'cae';
      const x = sol.vL * tc + (sol.v0 - sol.vL) * sol.tau * (1 - Math.exp(-tc / sol.tau)), xmax = Math.max(sol.vL * tf, sol.v0 * sol.tau) || 1, u = (x / xmax) % 1;
      if (cae) {
        const xA = w * 0.36, xB = w * 0.64, y = 30 + u * (hs - 60);
        campo(g, xA - 30, 0, xB + 30, hs, true, 0.8);
        g.strokeStyle = col['--suelo']; g.lineWidth = 4; g.beginPath(); g.moveTo(xA, 14); g.lineTo(xA, hs - 6); g.moveTo(xB, 14); g.lineTo(xB, hs - 6); g.moveTo(xA, 14); g.lineTo(xB, 14); g.stroke();
        g.fillStyle = col['--roz']; g.fillRect(xA - 8, y - 4, xB - xA + 16, 8); flecha(g, w / 2, y + 6, w / 2, y + 40, col['--peso'], 2.4); texto(g, w / 2 + 8, y + 30, 'mg', col['--peso'], 'left');
      } else {
        const yA = hs * 0.25, yB = hs * 0.8, xR = 30, xb = xR + 30 + u * (w - 90);
        campo(g, 0, 0, w, hs, true, 0.8);
        g.strokeStyle = col['--suelo']; g.lineWidth = 4; g.beginPath(); g.moveTo(xR, yA); g.lineTo(w - 10, yA); g.moveTo(xR, yB); g.lineTo(w - 10, yB); g.moveTo(xR, yA); g.lineTo(xR, yB); g.stroke();
        g.fillStyle = col['--roz']; g.fillRect(xb - 4, yA - 8, 8, yB - yA + 16);
        if (sol.caso === 'fuerza') flecha(g, xb + 6, (yA + yB) / 2, xb + 50, (yA + yB) / 2, col['--normal'], 2.4);
      }
      const pts = Array.from({ length: 201 }, (_, i) => { const t = (tf * i) / 200; return [t, sol.vf(t)]; });
      const pi = Array.from({ length: 201 }, (_, i) => { const t = (tf * i) / 200; return [t, sol.If(t)]; });
      grafica(g, 20, hs + 8, w - 40, h - hs - 16, tf, [{ pts, color: col['--tension'], nombre: sol.caso === 'lanzada' ? `v(t), v₀ = ${txt(f(sol.v0))} m/s` : `v(t) → ${txt(f(sol.vL))} m/s` }, { pts: pi, color: rojo, nombre: sol.caso === 'lanzada' ? `I(t), I₀ = ${txt(f(sol.If(0)))} A` : `I(t) → ${txt(f(sol.IL))} A` }], tc);
    } else if (sol.modo === 'foucault') {
      const hs = h * 0.56, T = 4, ph = (tAnim / T) * 2 * Math.PI, B = Math.sin(ph), dB = Math.cos(ph), cx = w / 2, cy = hs / 2, disco = sol.geo === 'disco';
      campo(g, 0, 0, w, hs, B >= 0, Math.max(Math.abs(B), 0.15));
      const sg = dB >= 0 ? -1 : 1; // B entrante que crece → corriente antihoraria (sentido −1 en pantalla)
      g.strokeStyle = rojo; g.fillStyle = rojo; g.globalAlpha = 0.25 + 0.75 * Math.abs(dB);
      if (disco) {
        const R = hs * 0.38; g.lineWidth = 3; g.strokeStyle = col['--roz']; g.globalAlpha = 1; g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke();
        g.strokeStyle = rojo; g.globalAlpha = 0.25 + 0.75 * Math.abs(dB);
        for (const q of [0.3, 0.55, 0.8]) { g.lineWidth = 1 + 3 * q * Math.abs(dB); g.beginPath(); g.arc(cx, cy, R * q, 0, 2 * Math.PI); g.stroke(); punta(g, cx + R * q, cy, sg * Math.PI / 2, rojo); }
      } else {
        const ww = Math.min(w * 0.7, 360), hh = hs * 0.72;
        g.globalAlpha = 1; g.lineWidth = 3; g.strokeStyle = col['--roz']; g.strokeRect(cx - ww / 2, cy - hh / 2, ww, hh);
        g.strokeStyle = rojo; g.globalAlpha = 0.25 + 0.75 * Math.abs(dB);
        for (const q of [0.25, 0.5, 0.75]) { g.lineWidth = 1 + 3 * q * Math.abs(dB); g.strokeRect(cx - (ww * q) / 2, cy - (hh * q) / 2, ww * q, hh * q); punta(g, cx, cy - (hh * q) / 2, sg > 0 ? 0 : Math.PI, rojo); }
      }
      g.globalAlpha = 1;
      texto(g, cx, hs - 6, `B = ${txt(f(sol.B0 * B, 3))} T · ⟨P⟩ = ${txt(f(sol.P))} W`, col['--ink'], 'center', '600 ');
      const tf = 2 / sol.fr, pts = (fn) => Array.from({ length: 241 }, (_, i) => { const t = (tf * i) / 240; return [t, fn(t)]; }), tc = ((tAnim % T) / T) * tf;
      grafica(g, 20, hs + 8, w - 40, h - hs - 16, tf, [{ pts: pts((t) => Math.sin(sol.w * t)), color: col['--tension'], nombre: `B(t), B₀ = ${txt(f(sol.B0))} T` }, { pts: pts((t) => Math.cos(sol.w * t)), color: rojo, nombre: `J(t), J max = ${txt(f(sol.Jmax))} A/m²` }], tc);
    } else if (sol.modo === 'gira') {
      const cx = w / 2, cy = h / 2 - 8, R = Math.min(w, h) * 0.36, a = (tAnim * 1.2) % (2 * Math.PI), disco = sol.cuerpo === 'disco';
      campo(g, 0, 0, w, h - 24, sol.sentidoB !== 'saliente', 0.8);
      g.fillStyle = col['--tension']; g.globalAlpha = 0.14; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a - 0.9, a); g.closePath(); g.fill(); g.globalAlpha = 1;
      if (disco) { g.strokeStyle = col['--roz']; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke(); }
      g.strokeStyle = col['--roz']; g.lineWidth = disco ? 2 : 6; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); g.stroke();
      g.fillStyle = col['--ink']; g.beginPath(); g.arc(cx, cy, 5, 0, 2 * Math.PI); g.fill();
      texto(g, w / 2, h - 12, `ε = ½ B ω ${disco ? 'R' : 'L'}² = ${txt(f(sol.eps))} V`, col['--ink'], 'center', '600 ');
    } else {
      const hs = h * 0.56, T = 6, t0 = -0.15 * sol.t3, t1 = 1.15 * sol.t3, t = t0 + ((tAnim % T) / T) * (t1 - t0);
      const xmin = -sol.a * 1.3, xmax = sol.D + sol.a * 1.3, m = 16, X = (x) => m + ((x - xmin) / (xmax - xmin)) * (w - 2 * m), sx = (w - 2 * m) / (xmax - xmin);
      g.fillStyle = col['--tension']; g.globalAlpha = 0.07; g.fillRect(X(0), 10, X(sol.D) - X(0), hs - 20); g.globalAlpha = 1;
      campo(g, X(0), 10, X(sol.D), hs - 10, ent, 1, Math.max(20, Math.min(34, (X(sol.D) - X(0)) / 3)));
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(0), 6); g.lineTo(X(0), hs - 6); g.moveTo(X(sol.D), 6); g.lineTo(X(sol.D), hs - 6); g.stroke(); g.setLineDash([]);
      const lado = Math.min(sol.a * sx, hs * 0.6), xf = sol.v * t, cy = hs / 2;
      g.strokeStyle = col['--roz']; g.lineWidth = 3.5; g.strokeRect(X(xf - sol.a), cy - lado / 2, sol.a * sx, lado);
      const tr = sol.tramos.find((q) => t >= q.t0 && t < q.t1);
      if (tr && tr.sentido) corrienteRect(g, X(xf - sol.a), cy - lado / 2, X(xf), cy + lado / 2, tr.sentido === 'clockwise', rojo);
      texto(g, X(sol.D / 2), hs - 1, `D = ${txt(f(sol.D))} m`, col['--muted']);
      const pts = (fn) => Array.from({ length: 301 }, (_, i) => { const tt = t0 + ((t1 - t0) * i) / 300; return [tt - t0, fn(tt)]; });
      const fi = (tt) => { const x = sol.v * tt; return Math.max(0, Math.min(x, sol.D) - Math.max(x - sol.a, 0)); }, ep = (tt) => { const q = sol.tramos.find((r) => tt >= r.t0 && tt < r.t1); return q ? -q.eps : 0; };
      grafica(g, 20, hs + 8, w - 40, h - hs - 16, t1 - t0, [{ pts: pts(fi), color: col['--tension'], nombre: `Φ (max ${txt(f(sol.N * sol.B * sol.a * Math.min(sol.a, sol.D)))} Wb)` }, { pts: pts(ep), color: rojo, nombre: `ε = −dΦ/dt (±${txt(f(sol.eps))} V)` }], t - t0);
    }
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = (ahora - ultimo) / 1000; ultimo = ahora;
    if (!anda) return;
    if (sol) { tAnim += Math.min(dt, 0.1); dibuja(); }
    requestAnimationFrame(bucle);
  }
  Herramienta.exportar('#escena', { nombre: 'faraday', titulo: 'Electromagnetic induction' });
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('faraday').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.FaradayApp = { abrirEjemplo, resultado: () => sol && { P: sol.P, IL: sol.IL, modo: sol.modo, eps: sol.eps, em: sol.em, I: sol.I, sentido: sol.sentido, vL: sol.vL, tau: sol.tau }, estado: () => copia(sc), pausa: () => { anda = false; } };
})();

