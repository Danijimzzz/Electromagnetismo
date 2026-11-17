(() => {
  const { $, esc, copia, txt } = Herramienta;
  const C = Ciclos, f = C.f, CLAVE = 'ciclos-v1';
  const MODOS = [['carnot', 'Carnot cycle'], ['otto', 'Otto cycle (petrol)'], ['diesel', 'Diesel cycle'], ['brayton', 'Brayton cycle (gas turbine)'], ['stirling', 'Stirling cycle'], ['propio', 'Custom cycle (states in p-V)'], ['maquina', 'Engine, refrigerator or heat pump']];

  let sc = copia(C.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const gas = () => elige('gas', 'Gas', [['di', 'Diatomic (air), γ = 1.4'], ['mono', 'Monatomic, γ = 5/3']]);
  const NOTAS = {
    carnot: 'The cycle starts at state 1 with an isothermal expansion at the temperature of the hot reservoir, from V₁ to V₂.',
    otto: 'The compression ratio is r = V₁/V₂. Combustion is given by the temperature the gas reaches or by the heat it receives.',
    diesel: 'The cutoff ratio is V₃/V₂: how much the gas expands while the fuel is injected.',
    brayton: 'The pressure ratio is r_p = P₂/P₁: that given by the compressor. T₃ is the temperature of the gases at the turbine inlet.',
    stirling: 'Two isotherms and two isochores between the minimum volume V₁ and the maximum V₂. The cycle starts at state 1 with an isothermal expansion at the hot temperature.',
    propio: 'Give the pressure and volume of each state, in order; the fourth is optional (three-stage cycle). Between two states with the same V or the same P the stage is an isochore or an isobar; otherwise it is a straight line in p-V, unless you say it is an isotherm or an adiabat. To chain transformations from one state, open Ideal gases.',
    maquina: 'Enter two of the three (Q of the hot reservoir, Q of the cold reservoir and W) and leave the other empty. With the temperatures of the reservoirs it is compared with Carnot.',
  };
  function formulario() {
    let h = elige('modo', 'What to calculate', MODOS);
    if (sc.modo === 'carnot') h += gas() + fila('Tc', 'Temperature of the hot reservoir', 'K') + fila('Tf', 'Temperature of the cold reservoir', 'K') + fila('n', 'Moles of gas', 'mol') + fila('V1', 'Initial volume V₁', 'L') + fila('V2', 'Volume after the isotherm V₂', 'L');
    else if (sc.modo === 'otto') {
      h += gas() + fila('r', 'Compression ratio r') + fila('T1', 'Initial temperature', 'K') + fila('P1', 'Initial pressure', 'kPa') + fila('V1', 'Initial volume (displacement)', 'L');
      h += elige('datos', 'Combustion', [['T3', 'I know the maximum temperature'], ['Q', 'I know the heat received']]) + (sc.datos === 'Q' ? fila('Q', 'Heat of combustion', 'J') : fila('T3', 'Maximum temperature T₃', 'K'));
      h += motorF();
    } else if (sc.modo === 'diesel') h += gas() + fila('r', 'Compression ratio r') + fila('rc', 'Cutoff ratio r<sub>c</sub>') + fila('T1', 'Initial temperature', 'K') + fila('P1', 'Initial pressure', 'kPa') + fila('V1', 'Initial volume', 'L') + motorF();
    else if (sc.modo === 'brayton') h += gas() + fila('rp', 'Pressure ratio r<sub>p</sub>') + fila('T1', 'Temperature of the incoming air', 'K') + fila('P1', 'Pressure of the incoming air', 'kPa') + fila('V1', 'Initial volume', 'L') + fila('T3', 'Temperature at the turbine inlet T₃', 'K');
    else if (sc.modo === 'stirling') h += gas() + fila('Tc', 'Temperature of the hot reservoir', 'K') + fila('Tf', 'Temperature of the cold reservoir', 'K') + fila('n', 'Moles of gas', 'mol') + fila('V1', 'Minimum volume V₁', 'L') + fila('V2', 'Maximum volume V₂', 'L');
    else if (sc.modo === 'propio') {
      const tipoT = (k, nom) => elige(k, nom, [['auto', 'Isochore, isobar or straight line'], ['isoterma', 'Isotherm'], ['adiabatica', 'Adiabat']]);
      h += gas() + fila('n', 'Moles of gas', 'mol');
      for (let i = 1; i <= 4; i++) h += sep(`State ${i}${i === 4 ? ' (optional)' : ''}`) + fila(`P${i}`, `Pressure P${'₁₂₃₄'[i - 1]}`, 'kPa') + fila(`V${i}`, `Volume V${'₁₂₃₄'[i - 1]}`, 'L');
      h += sep('Stages') + tipoT('t12', 'Stage 1→2') + tipoT('t23', 'Stage 2→3') + tipoT('t34', 'Stage 3→4') + tipoT('tfin', 'Stage returning to 1');
    } else {
      h += elige('tipo', 'What it is', [['motor', 'A heat engine (motor)'], ['frigorifico', 'A refrigerator'], ['bomba', 'A heat pump']]);
      h += fila('Qc', 'Heat from the hot reservoir Q<sub>h</sub>', 'J') + fila('Qf', 'Heat from the cold reservoir Q<sub>c</sub>', 'J') + fila('W', 'Work W', 'J') + sep('Optional') + fila('Tc', 'Temperature of the hot reservoir', 'K') + fila('Tf', 'Temperature of the cold reservoir', 'K');
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  function motorF() { return sep('Optional: engine power') + fila('rpm', 'Revolutions per minute', 'rpm') + fila('cil', 'Number of cylinders'); }
  const vacioC = (v) => v === undefined || v === null || String(v).trim() === '';
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo') sc = copia(C.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else { const ej = C.ejemplos.find((x) => x.sc.modo === sc.modo && x.sc[t.dataset.k] === t.value); if (ej) for (const [k, v] of Object.entries(ej.sc)) if (vacioC(sc[k])) sc[k] = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Examples…</option>' + C.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = C.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  const NOMT = { isoterma: 'isoterma', adiabatica: 'adiabatic', isocora: 'isocora', isobara: 'isobara', recta: 'recta' };
  function calcula() {
    const err = $('#error');
    try { sol = C.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#tablas').hidden = true;
      dibuja(); return;
    }
    err.hidden = true; guarda();
    let h, ley;
    if (sol.modo === 'maquina') {
      h = dato(sol.nomEf, sol.tipo === 'motor' ? `η = ${f(100 * sol.ef, 3)} %` : `COP = ${f(sol.ef, 3)}`) + dato('Work', `W = ${f(sol.W)} J`) + dato('Heat from the hot reservoir', `Q<sub>h</sub> = ${f(sol.Qc)} J`) + dato('Heat from the cold reservoir', `Q<sub>c</sub> = ${f(sol.Qf)} J`) + (sol.efC !== null ? dato('Carnot limit', sol.tipo === 'motor' ? `η<sub>C</sub> = ${f(100 * sol.efC, 3)} %` : `COP<sub>Carnot</sub> = ${f(sol.efC, 3)}`) + dato('Is it possible?', sol.posible ? 'yes' : 'no: it exceeds Carnot') : '');
      ley = 'The thickness of each arrow is proportional to the energy passing in each cycle.';
      $('#tablas').hidden = true;
    } else {
      h = dato('Efficiency', `η = ${f(100 * sol.eta, 3)} %`) + (sol.Pot ? dato('Engine power', `P = ${f(sol.Pot / 1000)} kW`) : '') + (sol.etaReg ? dato('With ideal regenerator', `η = ${f(100 * sol.etaReg, 3)} %`) : '') + dato('Net work', `W = ${f(sol.W)} J`) + dato('Heat absorbed', `Q<sub>abs</sub> = ${f(sol.Qabs)} J`) + dato('Heat released', `Q<sub>rel</sub> = ${f(sol.Qced)} J`) + dato('Carnot between T<sub>max</sub> and T<sub>min</sub>', `η<sub>C</sub> = ${f(100 * sol.etaC, 3)} %`);
      ley = 'The dot runs round the cycle and the cylinder shows the piston and the gas temperature. Below, the same cycle in the T-S diagram. In both, the enclosed area is the net work.';
      $('#estados').innerHTML = '<tr><th>State</th><th>P (kPa)</th><th>V (L)</th><th>T (K)</th></tr>' + sol.est.map((e) => `<tr><td>${e.nom}</td><td>${f(e.P / 1000)}</td><td>${f(e.V * 1000)}</td><td>${f(e.T)}</td></tr>`).join('');
      $('#tramos').innerHTML = '<tr><th>Stage</th><th>Process</th><th>W (J)</th><th>Q (J)</th><th>ΔU (J)</th><th>ΔS (J/K)</th></tr>' + sol.tramos.map((t) => `<tr><td>${t.nom}</td><td>${NOMT[t.tipo]}</td><td>${f(t.W)}</td><td>${f(t.Q)}</td><td>${f(t.U)}</td><td>${f(t.S)}</td></tr>`).join('') + `<tr class="tot"><td>Cycle</td><td></td><td>${f(sol.W)}</td><td>${f(sol.W)}</td><td>0</td><td>0</td></tr>`;
      $('#tablas').hidden = false;
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    tA = 0; dibuja();
  }

  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Resume'; });
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--suelo', '--cuerpo', '--panel', '--tension']) col[k] = cs.getPropertyValue(k).trim(); }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  function flecha(g, x, y, dx, dy, color, grosor = 2) {
    const l = Math.hypot(dx, dy); if (l < 4) return;
    const ux = dx / l, uy = dy / l, cab = 6 + grosor * 1.6;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = grosor; g.lineCap = 'butt'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx - ux * cab, y + dy - uy * cab); g.stroke();
    g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx - ux * cab - uy * cab * 0.6, y + dy - uy * cab + ux * cab * 0.6); g.lineTo(x + dx - ux * cab + uy * cab * 0.6, y + dy - uy * cab - ux * cab * 0.6); g.closePath(); g.fill(); g.lineCap = 'round';
  }
  const punto = (g, x, y, r, color) => { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); };
  let tA = 0;
  function enTramo(t, s) {
    const a = sol.est.find((e) => e.nom === t.de), b = sol.est.find((e) => e.nom === t.a);
    if (t.tipo === 'isocora') return { V: a.V, P: a.P + (b.P - a.P) * s };
    const V = a.V + (b.V - a.V) * s;
    if (t.tipo === 'isobara') return { V, P: a.P };
    if (t.tipo === 'recta') return { V, P: a.P + (b.P - a.P) * s };
    if (t.tipo === 'isoterma') return { V, P: (a.P * a.V) / V };
    return { V, P: a.P * (a.V / V) ** sol.G.gam };
  }
  const colorT = (T) => { const s = Math.max(0, Math.min(1, (T - sol.Tmin) / (sol.Tmax - sol.Tmin || 1))); return `rgb(${Math.round(60 + 180 * s)}, ${Math.round(110 - 40 * s)}, ${Math.round(210 - 160 * s)})`; };

  function dibuja() {
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    if (!col['--ink']) colores();
    $('#ts').hidden = sol.modo === 'maquina';
    if (sol.modo === 'maquina') return flujos(g, w, h);
    const ml = 56, mt = 18, mb = 34, wd = Math.min(w * 0.66, w - 150), mr = w - wd;
    const Vmax = Math.max(...sol.est.map((e) => e.V)) * 1.08, Pmax = Math.max(...sol.est.map((e) => e.P)) * 1.08;
    const X = (V) => ml + (V / Vmax) * (wd - ml - 10), Y = (P) => mt + (1 - P / Pmax) * (h - mt - mb);
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(ml, mt); g.lineTo(ml, h - mb); g.lineTo(wd, h - mb); g.stroke();
    texto(g, ml - 8, mt, 'P (kPa)', col['--muted'], 'right'); texto(g, wd, h - mb + 16, 'V (L)', col['--muted'], 'right');
    for (const k of [0.5, 1]) { texto(g, ml - 6, Y(Pmax * k / 1.08), txt(f((Pmax * k) / 1.08 / 1000, 3)), col['--muted'], 'right'); texto(g, X((Vmax * k) / 1.08), h - mb + 14, txt(f((Vmax * k) / 1.08 * 1000, 3)), col['--muted']); }
    g.beginPath();
    sol.tramos.forEach((t, i) => { for (let k = 0; k <= 40; k++) { const q = enTramo(t, k / 40); (i || k ? g.lineTo : g.moveTo).call(g, X(q.V), Y(q.P)); } });
    g.closePath(); g.fillStyle = col['--accent']; g.globalAlpha = 0.12; g.fill(); g.globalAlpha = 1;
    sol.tramos.forEach((t) => {
      g.strokeStyle = t.Q > 1e-9 ? col['--peso'] : t.Q < -1e-9 ? col['--tension'] : col['--ink']; g.lineWidth = 2.4; g.beginPath();
      for (let k = 0; k <= 40; k++) { const q = enTramo(t, k / 40); k ? g.lineTo(X(q.V), Y(q.P)) : g.moveTo(X(q.V), Y(q.P)); }
      g.stroke();
      const m = enTramo(t, 0.5); flecha(g, X(m.V), Y(m.P), (X(enTramo(t, 0.56).V) - X(m.V)) * 3, (Y(enTramo(t, 0.56).P) - Y(m.P)) * 3, g.strokeStyle, 1.5);
    });
    for (const e of sol.est) { punto(g, X(e.V), Y(e.P), 4, col['--ink']); texto(g, X(e.V) + 10, Y(e.P) - 10, e.nom, col['--ink'], 'left', '600 '); }
    const n = sol.tramos.length, u = (tA / 2) % n, i = Math.floor(u), t = sol.tramos[i], q = enTramo(t, u - i), T = (q.P * q.V) / (sol.n * C.R);
    punto(g, X(q.V), Y(q.P), 6.5, colorT(T));
    const cx = wd + 30, cw = Math.min(90, mr - 60), cb = h - mb, ch = h - mt - mb - 30, alto = (q.V / Vmax) * ch;
    g.fillStyle = colorT(T); g.globalAlpha = 0.6; g.fillRect(cx, cb - alto, cw, alto); g.globalAlpha = 1;
    g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cb - ch - 10); g.lineTo(cx, cb); g.lineTo(cx + cw, cb); g.lineTo(cx + cw, cb - ch - 10); g.stroke();
    g.fillStyle = col['--ink']; g.fillRect(cx + 2, cb - alto - 8, cw - 4, 8); g.fillRect(cx + cw / 2 - 3, cb - alto - 8 - 30, 6, 30);
    texto(g, cx + cw / 2, cb + 14, `${txt(f(T, 3))} K`, col['--ink'], 'center', '600 ');
    if (t.Q > 1e-9) { flecha(g, cx + cw / 2, cb + 40, 0, -22, col['--peso'], 3); texto(g, cx + cw + 8, cb - 10, 'Q in', col['--peso'], 'left'); }
    else if (t.Q < -1e-9) { flecha(g, cx + cw + 4, cb - alto / 2, 26, 0, col['--tension'], 3); texto(g, cx + cw + 8, cb - alto / 2 - 14, 'Q out', col['--tension'], 'left'); }
    else texto(g, cx + cw + 8, cb - 10, 'aislado', col['--muted'], 'left');
    texto(g, cx, mt, `${t.nom}: ${NOMT[t.tipo]}`, col['--ink'], 'left', '600 ');
    diagramaTS(t, u - i);
  }
  const entropia = (q) => { const e1 = sol.est[0], T = (q.P * q.V) / (sol.n * C.R); return { T, S: sol.n * sol.G.Cv * Math.log(T / e1.T) + sol.n * C.R * Math.log(q.V / e1.V) }; };
  function diagramaTS(tAct, sAct) {
    const { g, w, h } = Herramienta.lienzo('#ts');
    if (!w || !sol || sol.modo === 'maquina') return;
    const pts = sol.tramos.map((t) => Array.from({ length: 41 }, (_, k) => entropia(enTramo(t, k / 40))));
    const todos = pts.flat(), Smin = Math.min(...todos.map((p) => p.S)), Smax = Math.max(...todos.map((p) => p.S)), Tmax = Math.max(...todos.map((p) => p.T)) * 1.06, Tmin0 = Math.min(...todos.map((p) => p.T)) * 0.85;
    const ml = 56, mt = 18, mb = 34, mr = 16, dS = Smax - Smin || 1;
    const X = (S) => ml + ((S - Smin + 0.06 * dS) / (1.12 * dS)) * (w - ml - mr), Y = (T) => mt + (1 - (T - Tmin0) / (Tmax - Tmin0)) * (h - mt - mb);
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(ml, mt); g.lineTo(ml, h - mb); g.lineTo(w - mr, h - mb); g.stroke();
    texto(g, ml - 8, mt, 'T (K)', col['--muted'], 'right'); texto(g, w - mr, h - mb - 10, 'S − S₁ (J/K)', col['--muted'], 'right');
    for (const T of [sol.Tmin, sol.Tmax]) texto(g, ml - 6, Y(T), txt(f(T, 3)), col['--muted'], 'right');
    for (const S of [Smin, Smax]) texto(g, X(S), h - mb + 14, txt(f(S, 3)), col['--muted']);
    g.beginPath(); pts.flat().forEach((p, k) => (k ? g.lineTo(X(p.S), Y(p.T)) : g.moveTo(X(p.S), Y(p.T)))); g.closePath(); g.fillStyle = col['--accent']; g.globalAlpha = 0.12; g.fill(); g.globalAlpha = 1;
    sol.tramos.forEach((t, i) => { g.strokeStyle = t.Q > 1e-9 ? col['--peso'] : t.Q < -1e-9 ? col['--tension'] : col['--ink']; g.lineWidth = 2.4; g.beginPath(); pts[i].forEach((p, k) => (k ? g.lineTo(X(p.S), Y(p.T)) : g.moveTo(X(p.S), Y(p.T)))); g.stroke(); });
    sol.est.forEach((e, i) => { const p = pts[i][0]; punto(g, X(p.S), Y(p.T), 4, col['--ink']); texto(g, X(p.S) + 10, Y(p.T) - 10, e.nom, col['--ink'], 'left', '600 '); });
    const q = entropia(enTramo(tAct, sAct)); punto(g, X(q.S), Y(q.T), 6.5, colorT(q.T));
  }
  function flujos(g, w, h) {
    const cx = w / 2, fw = Math.min(260, w * 0.5), yC = 30, yF = h - 50, yM = h / 2, E = Math.max(sol.Qc, sol.Qf, sol.W), gr = (x) => 3 + (22 * x) / E;
    const motor = sol.tipo === 'motor';
    g.fillStyle = col['--peso']; g.globalAlpha = 0.2; g.fillRect(cx - fw / 2, yC - 20, fw, 40); g.globalAlpha = 1;
    g.fillStyle = col['--tension']; g.globalAlpha = 0.2; g.fillRect(cx - fw / 2, yF - 20, fw, 40); g.globalAlpha = 1;
    texto(g, cx, yC, `Hot reservoir${sol.Tc ? ` · ${txt(f(sol.Tc))} K` : ''}`, col['--peso'], 'center', '600 ');
    texto(g, cx, yF, `Cold reservoir${sol.Tf ? ` · ${txt(f(sol.Tf))} K` : ''}`, col['--tension'], 'center', '600 ');
    punto(g, cx, yM, 28, col['--cuerpo']); texto(g, cx, yM, motor ? 'motor' : sol.tipo === 'frigorifico' ? 'refrigerator' : 'bomba', col['--ink'], 'center', '600 ');
    const s = (tA * 0.6) % 1;
    if (motor) {
      flecha(g, cx, yC + 22, 0, yM - 30 - yC - 22, col['--peso'], gr(sol.Qc)); flecha(g, cx, yM + 30, 0, yF - 22 - yM - 30, col['--tension'], gr(sol.Qf)); flecha(g, cx + 30, yM, w * 0.22, 0, col['--normal'], gr(sol.W));
      punto(g, cx, yC + 22 + s * (yM - 52 - yC), 3, col['--panel']); punto(g, cx, yM + 30 + s * (yF - 52 - yM), 3, col['--panel']); punto(g, cx + 30 + s * w * 0.2, yM, 3, col['--panel']);
    } else {
      flecha(g, cx, yF - 22, 0, -(yF - 22 - yM - 30), col['--tension'], gr(sol.Qf)); flecha(g, cx, yM - 30, 0, -(yM - 30 - yC - 22), col['--peso'], gr(sol.Qc)); flecha(g, cx + 30 + w * 0.22, yM, -w * 0.22, 0, col['--normal'], gr(sol.W));
      punto(g, cx, yF - 22 - s * (yF - 52 - yM), 3, col['--panel']); punto(g, cx, yM - 30 - s * (yM - 52 - yC), 3, col['--panel']); punto(g, cx + 30 + w * 0.22 - s * w * 0.2, yM, 3, col['--panel']);
    }
    texto(g, cx + 18, (yC + yM) / 2, `Q_c = ${txt(f(sol.Qc))} J`.replace('Q_c', 'Qc'), col['--peso'], 'left');
    texto(g, cx + 18, (yM + yF) / 2, `Qf = ${txt(f(sol.Qf))} J`, col['--tension'], 'left');
    texto(g, cx + 40 + w * 0.11, yM - 22, `W = ${txt(f(sol.W))} J`, col['--normal'], 'center');
    if (sol.posible === false) texto(g, 14, h - 14, 'Impossible! It exceeds the Carnot efficiency', col['--peso'], 'left', '700 ');
  }
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('ciclos').current;
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', '.');
    const tipos = [
      () => ({ modo: 'carnot', gas: de(['di', 'mono']), Tc: String(ent(5, 9) * 100), Tf: String(ent(25, 40) * 10), n: c(de([0.5, 1, 2])), V1: String(ent(2, 10)), V2: '' }),
      () => ({ modo: 'otto', gas: 'di', r: String(ent(7, 11)), T1: '300', P1: '100', V1: c(de([0.4, 0.5, 0.6])), datos: 'T3', T3: String(ent(15, 22) * 100), rpm: Math.random() < 0.5 ? '' : String(ent(2, 6) * 1000), cil: '4' }),
      () => ({ modo: 'diesel', gas: 'di', r: String(ent(15, 22)), rc: c(de([1.5, 2, 2.5, 3])), T1: '300', P1: '100', V1: c(de([0.5, 1])), rpm: '', cil: '' }),
      () => ({ modo: 'brayton', gas: 'di', rp: String(ent(6, 16)), T1: '300', P1: '100', V1: '1', T3: String(ent(11, 16) * 100) }),
      () => ({ modo: 'stirling', gas: de(['mono', 'di']), Tc: String(ent(5, 9) * 100), Tf: '300', n: '1', V1: '1', V2: String(ent(2, 4)) }),
      () => ({ modo: 'propio', gas: de(['mono', 'di']), n: '1', P1: '100', V1: '10', P2: String(ent(2, 4) * 100), V2: '10', P3: '', V3: String(ent(2, 4) * 10), P4: '100', V4: '', t12: 'auto', t23: 'auto', t34: 'auto', tfin: 'auto' }),
      () => ({ modo: 'maquina', tipo: de(['motor', 'frigorifico', 'bomba']), Qc: '', Qf: String(ent(3, 9) * 100), W: String(ent(1, 4) * 100), Tc: String(ent(29, 60) * 10), Tf: String(ent(26, 28) * 10) }),
    ];
    sc = de(tipos)();
    if (sc.modo === 'carnot') sc.V2 = String(+sc.V1 * ent(2, 3));
    if (sc.modo === 'propio') { sc.P3 = sc.P2; sc.V4 = sc.V3; }
    formulario(); sel.value = ''; calcula();
  }
  const enunciado = () => {
    const e = (x) => esc(String(x ?? '').replace('.', '.')), g = sc.gas === 'mono' ? 'a monatomic ideal gas' : 'air (diatomic ideal gas)';
    const mot = sc.rpm ? ` If the engine has ${e(sc.cil || 1)} cylinders like this one and runs at ${e(sc.rpm)} rpm, what power does it give?` : '';
    if (sc.modo === 'carnot') return `${e(sc.n)} mol of ${g} go through a Carnot cycle between ${e(sc.Tc)} K and ${e(sc.Tf)} K. The isothermal expansion goes from ${e(sc.V1)} L to ${e(sc.V2)} L. Calculate the states, the heat and work of each stage and the efficiency.`;
    if (sc.modo === 'otto') return `An Otto cycle with ${g} has a compression ratio of ${e(sc.r)}. At the start of compression the gas is at ${e(sc.T1)} K and ${e(sc.P1)} kPa in ${e(sc.V1)} L, and after combustion it reaches ${e(sc.T3)} K. Calculate the states, the net work and the efficiency.${mot}`;
    if (sc.modo === 'diesel') return `A Diesel cycle with ${g} has a compression ratio of ${e(sc.r)} and a cutoff ratio of ${e(sc.rc)}. At the start the gas is at ${e(sc.T1)} K and ${e(sc.P1)} kPa in ${e(sc.V1)} L. Calculate the states, the net work and the efficiency.${mot}`;
    if (sc.modo === 'brayton') return `A gas turbine works with a Brayton cycle of pressure ratio ${e(sc.rp)}. Air enters at ${e(sc.T1)} K and ${e(sc.P1)} kPa (${e(sc.V1)} L) and the gases reach the turbine at ${e(sc.T3)} K. Calculate the temperatures, the net work and the efficiency.`;
    if (sc.modo === 'stirling') return `${e(sc.n)} mol of ${g} go through a Stirling cycle between ${e(sc.Tc)} K and ${e(sc.Tf)} K, with volumes of ${e(sc.V1)} L and ${e(sc.V2)} L. Calculate the net work and the efficiency, without a regenerator and with an ideal regenerator.`;
    if (sc.modo === 'propio') return `${e(sc.n)} mol of ${g} go through a four-stage cycle through the states (${e(sc.P1)} kPa, ${e(sc.V1)} L), (${e(sc.P2)} kPa, ${e(sc.V2)} L), (${e(sc.P3)} kPa, ${e(sc.V3)} L) and (${e(sc.P4)} kPa, ${e(sc.V4)} L), joined by isochores and isobars. Calculate W, Q, ΔU and ΔS of each stage and the efficiency.`;
    const que = sc.tipo === 'motor' ? 'A heat engine releases' : sc.tipo === 'frigorifico' ? 'A refrigerator removes' : 'A heat pump removes';
    return `${que} ${e(sc.Qf)} J ${sc.tipo === 'motor' ? 'to the cold reservoir' : 'from the cold reservoir'} per cycle with a work of ${e(sc.W)} J, between reservoirs at ${e(sc.Tc)} K and ${e(sc.Tf)} K. Calculate the heat from the hot reservoir, ${sc.tipo === 'motor' ? 'the efficiency' : 'the COP'} and whether it is possible by comparing it with Carnot.`;
  };

  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.CiclosApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, eta: sol.eta, W: sol.W, ef: sol.ef, posible: sol.posible, Pot: sol.Pot }, estado: () => copia(sc), pausa: () => { anda = false; } };
})();

