(() => {
  const { $, esc, copia, txt } = Herramienta;
  const C = Ciclos, f = C.f, CLAVE = 'ciclos-v1';
  const MODOS = [['carnot', 'Cycle de Carnot'], ['otto', 'Cycle d’Otto (essence)'], ['diesel', 'Cycle Diesel'], ['brayton', 'Cycle de Brayton (turbine à gaz)'], ['stirling', 'Cycle de Stirling'], ['propio', 'Cycle personnalisé (états en p-V)'], ['maquina', 'Machine, réfrigérateur ou pompe à chaleur']];

  let sc = copia(C.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const gas = () => elige('gas', 'Gaz', [['di', 'Diatomique (air), γ = 1,4'], ['mono', 'Monoatomique, γ = 5/3']]);
  const NOTAS = {
    carnot: 'Le cycle commence à l’état 1 par une détente isotherme à la température de la source chaude, de V₁ à V₂.',
    otto: 'Le taux de compression est r = V₁/V₂. La combustion est donnée par la température qu’atteint le gaz ou par la chaleur qu’il reçoit.',
    diesel: 'Le rapport de détente est V₃/V₂ : de combien le gaz se dilate pendant l’injection du carburant.',
    brayton: 'Le rapport de pressions est r_p = P₂/P₁ : celui que donne le compresseur. T₃ est la température des gaz à l’entrée de la turbine.',
    stirling: 'Deux isothermes et deux isochores entre le volume minimal V₁ et le maximal V₂. Le cycle commence à l’état 1 par une détente isotherme à la température chaude.',
    propio: 'Donne la pression et le volume de chaque état, dans l’ordre ; le quatrième est facultatif (cycle à trois transformations). Entre deux états de même V ou de même P, la transformation est une isochore ou une isobare ; sinon, c’est une droite en p-V, sauf si tu indiques que c’est une isotherme ou une adiabatique. Pour enchaîner des transformations à partir d’un état, ouvre Gaz parfaits.',
    maquina: 'Entre deux des trois (Q de la source chaude, Q de la source froide et W) et laisse l’autre vide. Avec les températures des sources, on compare à Carnot.',
  };
  function formulario() {
    let h = elige('modo', 'Que calculer', MODOS);
    if (sc.modo === 'carnot') h += gas() + fila('Tc', 'Température de la source chaude', 'K') + fila('Tf', 'Température de la source froide', 'K') + fila('n', 'Moles de gaz', 'mol') + fila('V1', 'Volume initial V₁', 'L') + fila('V2', 'Volume après l’isotherme V₂', 'L');
    else if (sc.modo === 'otto') {
      h += gas() + fila('r', 'Taux de compression r') + fila('T1', 'Température initiale', 'K') + fila('P1', 'Pression initiale', 'kPa') + fila('V1', 'Volume initial (cylindrée)', 'L');
      h += elige('datos', 'Combustion', [['T3', 'Je connais la température maximale'], ['Q', 'Je connais la chaleur reçue']]) + (sc.datos === 'Q' ? fila('Q', 'Chaleur de combustion', 'J') : fila('T3', 'Température maximale T₃', 'K'));
      h += motorF();
    } else if (sc.modo === 'diesel') h += gas() + fila('r', 'Taux de compression r') + fila('rc', 'Rapport de détente r<sub>c</sub>') + fila('T1', 'Température initiale', 'K') + fila('P1', 'Pression initiale', 'kPa') + fila('V1', 'Volume initial', 'L') + motorF();
    else if (sc.modo === 'brayton') h += gas() + fila('rp', 'Rapport de pressions r<sub>p</sub>') + fila('T1', 'Température de l’air entrant', 'K') + fila('P1', 'Pression de l’air entrant', 'kPa') + fila('V1', 'Volume initial', 'L') + fila('T3', 'Température à l’entrée de la turbine T₃', 'K');
    else if (sc.modo === 'stirling') h += gas() + fila('Tc', 'Température de la source chaude', 'K') + fila('Tf', 'Température de la source froide', 'K') + fila('n', 'Moles de gaz', 'mol') + fila('V1', 'Volume minimal V₁', 'L') + fila('V2', 'Volume maximal V₂', 'L');
    else if (sc.modo === 'propio') {
      const tipoT = (k, nom) => elige(k, nom, [['auto', 'Isochore, isobare ou droite'], ['isoterma', 'Isotherme'], ['adiabatica', 'Adiabatique']]);
      h += gas() + fila('n', 'Moles de gaz', 'mol');
      for (let i = 1; i <= 4; i++) h += sep(`État ${i}${i === 4 ? ' (facultatif)' : ''}`) + fila(`P${i}`, `Pression P${'₁₂₃₄'[i - 1]}`, 'kPa') + fila(`V${i}`, `Volume V${'₁₂₃₄'[i - 1]}`, 'L');
      h += sep('Transformations') + tipoT('t12', 'Transformation 1→2') + tipoT('t23', 'Transformation 2→3') + tipoT('t34', 'Transformation 3→4') + tipoT('tfin', 'Transformation qui revient à 1');
    } else {
      h += elige('tipo', 'Ce que c’est', [['motor', 'Une machine thermique (moteur)'], ['frigorifico', 'Un réfrigérateur'], ['bomba', 'Une pompe à chaleur']]);
      h += fila('Qc', 'Chaleur de la source chaude Q<sub>c</sub>', 'J') + fila('Qf', 'Chaleur de la source froide Q<sub>f</sub>', 'J') + fila('W', 'Travail W', 'J') + sep('Facultatif') + fila('Tc', 'Température de la source chaude', 'K') + fila('Tf', 'Température de la source froide', 'K');
    }
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  function motorF() { return sep('Facultatif : puissance du moteur') + fila('rpm', 'Tours par minute', 'rpm') + fila('cil', 'Nombre de cylindres'); }
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
  sel.innerHTML = '<option value="">Exemples…</option>' + C.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = C.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  const NOMT = { isoterma: 'isoterma', adiabatica: 'adiabatique', isocora: 'isocora', isobara: 'isobara', recta: 'recta' };
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
      h = dato(sol.nomEf, sol.tipo === 'motor' ? `η = ${f(100 * sol.ef, 3)} %` : `COP = ${f(sol.ef, 3)}`) + dato('Travail', `W = ${f(sol.W)} J`) + dato('Chaleur de la source chaude', `Q<sub>c</sub> = ${f(sol.Qc)} J`) + dato('Chaleur de la source froide', `Q<sub>f</sub> = ${f(sol.Qf)} J`) + (sol.efC !== null ? dato('Limite de Carnot', sol.tipo === 'motor' ? `η<sub>C</sub> = ${f(100 * sol.efC, 3)} %` : `COP<sub>C</sub> = ${f(sol.efC, 3)}`) + dato('Est-ce possible ?', sol.posible ? 'oui' : 'non : il dépasse Carnot') : '');
      ley = 'L’épaisseur de chaque flèche est proportionnelle à l’énergie qui passe à chaque cycle.';
      $('#tablas').hidden = true;
    } else {
      h = dato('Rendement', `η = ${f(100 * sol.eta, 3)} %`) + (sol.Pot ? dato('Puissance du moteur', `P = ${f(sol.Pot / 1000)} kW`) : '') + (sol.etaReg ? dato('Avec régénérateur idéal', `η = ${f(100 * sol.etaReg, 3)} %`) : '') + dato('Travail net', `W = ${f(sol.W)} J`) + dato('Chaleur absorbée', `Q<sub>abs</sub> = ${f(sol.Qabs)} J`) + dato('Chaleur cédée', `Q<sub>ced</sub> = ${f(sol.Qced)} J`) + dato('Carnot entre T<sub>max</sub> et T<sub>min</sub>', `η<sub>C</sub> = ${f(100 * sol.etaC, 3)} %`);
      ley = 'Le point parcourt le cycle et le cylindre montre le piston et la température du gaz. En dessous, le même cycle dans le diagramme T-S. Dans les deux, l’aire délimitée est le travail net.';
      $('#estados').innerHTML = '<tr><th>État</th><th>P (kPa)</th><th>V (L)</th><th>T (K)</th></tr>' + sol.est.map((e) => `<tr><td>${e.nom}</td><td>${f(e.P / 1000)}</td><td>${f(e.V * 1000)}</td><td>${f(e.T)}</td></tr>`).join('');
      $('#tramos').innerHTML = '<tr><th>Transformation</th><th>Processus</th><th>W (J)</th><th>Q (J)</th><th>ΔU (J)</th><th>ΔS (J/K)</th></tr>' + sol.tramos.map((t) => `<tr><td>${t.nom}</td><td>${NOMT[t.tipo]}</td><td>${f(t.W)}</td><td>${f(t.Q)}</td><td>${f(t.U)}</td><td>${f(t.S)}</td></tr>`).join('') + `<tr class="tot"><td>Cycle</td><td></td><td>${f(sol.W)}</td><td>${f(sol.W)}</td><td>0</td><td>0</td></tr>`;
      $('#tablas').hidden = false;
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    tA = 0; dibuja();
  }

  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Reprendre'; });
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
    if (t.Q > 1e-9) { flecha(g, cx + cw / 2, cb + 40, 0, -22, col['--peso'], 3); texto(g, cx + cw + 8, cb - 10, 'entre Q', col['--peso'], 'left'); }
    else if (t.Q < -1e-9) { flecha(g, cx + cw + 4, cb - alto / 2, 26, 0, col['--tension'], 3); texto(g, cx + cw + 8, cb - alto / 2 - 14, 'sort Q', col['--tension'], 'left'); }
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
    texto(g, cx, yC, `Source chaude${sol.Tc ? ` · ${txt(f(sol.Tc))} K` : ''}`, col['--peso'], 'center', '600 ');
    texto(g, cx, yF, `Source froide${sol.Tf ? ` · ${txt(f(sol.Tf))} K` : ''}`, col['--tension'], 'center', '600 ');
    punto(g, cx, yM, 28, col['--cuerpo']); texto(g, cx, yM, motor ? 'motor' : sol.tipo === 'frigorifico' ? 'réfrigérateur' : 'bomba', col['--ink'], 'center', '600 ');
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
    if (sol.posible === false) texto(g, 14, h - 14, 'Impossible ! Il dépasse le rendement de Carnot', col['--peso'], 'left', '700 ');
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
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
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
    const e = (x) => esc(String(x ?? '').replace('.', ',')), g = sc.gas === 'mono' ? 'un gaz parfait monoatomique' : 'de l’air (gaz parfait diatomique)';
    const mot = sc.rpm ? ` Si le moteur a ${e(sc.cil || 1)} cylindres comme celui-ci et tourne à ${e(sc.rpm)} tr/min, quelle puissance fournit-il ?` : '';
    if (sc.modo === 'carnot') return `${e(sc.n)} mol de ${g} parcourent un cycle de Carnot entre ${e(sc.Tc)} K et ${e(sc.Tf)} K. La détente isotherme va de ${e(sc.V1)} L à ${e(sc.V2)} L. Calcule les états, la chaleur et le travail de chaque transformation et le rendement.`;
    if (sc.modo === 'otto') return `Un cycle d’Otto avec ${g} a un taux de compression de ${e(sc.r)}. Au début de la compression, le gaz est à ${e(sc.T1)} K et ${e(sc.P1)} kPa dans ${e(sc.V1)} L, et après la combustion il atteint ${e(sc.T3)} K. Calcule les états, le travail net et le rendement.${mot}`;
    if (sc.modo === 'diesel') return `Un cycle Diesel avec ${g} a un taux de compression de ${e(sc.r)} et un rapport de détente de ${e(sc.rc)}. Au début, le gaz est à ${e(sc.T1)} K et ${e(sc.P1)} kPa dans ${e(sc.V1)} L. Calcule les états, le travail net et le rendement.${mot}`;
    if (sc.modo === 'brayton') return `Une turbine à gaz fonctionne avec un cycle de Brayton de rapport de pressions ${e(sc.rp)}. L’air entre à ${e(sc.T1)} K et ${e(sc.P1)} kPa (${e(sc.V1)} L) et les gaz arrivent à la turbine à ${e(sc.T3)} K. Calcule les températures, le travail net et le rendement.`;
    if (sc.modo === 'stirling') return `${e(sc.n)} mol de ${g} parcourent un cycle de Stirling entre ${e(sc.Tc)} K et ${e(sc.Tf)} K, avec des volumes de ${e(sc.V1)} L et ${e(sc.V2)} L. Calcule le travail net et le rendement, sans régénérateur et avec un régénérateur idéal.`;
    if (sc.modo === 'propio') return `${e(sc.n)} mol de ${g} parcourent un cycle à quatre transformations passant par les états (${e(sc.P1)} kPa, ${e(sc.V1)} L), (${e(sc.P2)} kPa, ${e(sc.V2)} L), (${e(sc.P3)} kPa, ${e(sc.V3)} L) et (${e(sc.P4)} kPa, ${e(sc.V4)} L), reliés par des isochores et des isobares. Calcule W, Q, ΔU et ΔS de chaque transformation et le rendement.`;
    const que = sc.tipo === 'motor' ? 'Une machine thermique cède' : sc.tipo === 'frigorifico' ? 'Un réfrigérateur extrait' : 'Une pompe à chaleur extrait';
    return `${que} ${e(sc.Qf)} J ${sc.tipo === 'motor' ? 'à la source froide' : 'de la source froide'} par cycle avec un travail de ${e(sc.W)} J, entre des sources à ${e(sc.Tc)} K et ${e(sc.Tf)} K. Calcule la chaleur de la source chaude, ${sc.tipo === 'motor' ? 'le rendement' : 'l’efficacité'} et si c’est possible en la comparant à Carnot.`;
  };

  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.CiclosApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, eta: sol.eta, W: sol.W, ef: sol.ef, posible: sol.posible, Pot: sol.Pot }, estado: () => copia(sc), pausa: () => { anda = false; } };
})();

