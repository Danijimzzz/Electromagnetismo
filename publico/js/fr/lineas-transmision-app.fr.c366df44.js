(() => {
  const { $, esc, copia, lienzo } = Herramienta;
  const P = LineasTransmision, f = P.f, CLAVE = 'lineas-transmision-v1', PI = Math.PI;

  let sc = copia(P.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && typeof g === 'object') sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {};

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>(${un})</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  function formulario() {
    $('#campos').innerHTML = '<div class="sep">Ligne</div>' + fila('Z0', 'Impédance caractéristique Z₀', 'Ω') + fila('f', 'Fréquence', 'MHz') + fila('er', 'Diélectrique εr') +
      fila('l', 'Longueur de la ligne') + elige('lu', 'Unité de longueur', [['m', 'metros'], ['lam', 'longueurs d\'onde (λ)']]) +
      '<div class="sep">Charge ZL = R + jX</div>' + fila('R', 'Résistance R', 'Ω') + fila('X', 'Réactance X', 'Ω') +
      '<div class="sep">Pertes de la ligne (facultatif)</div>' + fila('alfa', 'Atténuation α', 'dB/m') + fila('P', 'Puissance incidente à l\'entrée', 'W') +
      '<div class="sep">Régime transitoire avec le générateur (facultatif)</div>' + fila('Vg', 'Tension du générateur Vg', 'V') + fila('Rg', 'Résistance du générateur Rg', 'Ω') + fila('tp', 'Durée de l\'impulsion (vide = échelon)', 'ns') + fila('xp', 'Point observé', '% de la ligne') +
      '<div class="sep">Double stub (facultatif)</div>' + fila('d1', 'Premier stub à', 'λ de la charge') + elige('sep', 'Séparation des stubs', [['1/8', 'λ/8'], ['3/8', '3λ/8']]);
    $('#nota').textContent = 'Sans atténuation, la ligne est sans pertes (α vide). Pour le régime transitoire, la charge doit être résistive et Vg est nécessaire. Vide : X = 0. La virgule décimale est acceptée. X est positive si la charge est inductive et négative si elle est capacitive.';
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (!t.dataset.k) return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => { const t = e.target; if (t.tagName === 'SELECT' && t.dataset.k) { sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); } });

  const GEOS = { coaxial: [['a', 'Rayon de l\'intérieur a', 'mm', '0.45'], ['b', 'Rayon intérieur de la tresse b', 'mm', '1.47'], ['er', 'Diélectrique εr', '', '2.25']], bifilar: [['a', 'Rayon des fils a', 'mm', '1'], ['D', 'Distance entre axes D', 'mm', '10'], ['er', 'Diélectrique εr', '', '1']], microstrip: [['w', 'Largeur de la piste w', 'mm', '3'], ['h', 'Hauteur du substrat h', 'mm', '1.6'], ['er', 'Substrat εr', '', '4.4']] };
  const gz = {}; let gres = null;
  function geoZ0() {
    const geo = $('#g-geo').value;
    if (!gz[geo]) gz[geo] = Object.fromEntries(GEOS[geo].map(([k, , , v]) => [k, v]));
    if ($('#g-campos').dataset.geo !== geo) { $('#g-campos').dataset.geo = geo; $('#g-campos').innerHTML = GEOS[geo].map(([k, n, u]) => `<label for="g-${k}">${n}${u ? ` <small>(${u})</small>` : ''}</label><input id="g-${k}" class="in" data-gk="${k}" value="${esc(gz[geo][k])}" inputmode="decimal" autocomplete="off">`).join(''); }
    try { gres = P.z0Geometria({ geo, ...gz[geo] }); $('#g-res').innerHTML = `Z₀ = <b>${f(gres.Z0)} Ω</b>${gres.erEf !== gres.er ? ` · ε<sub>ef</sub> = <b>${f(gres.erEf)}</b>` : ''}`; $('#g-usar').disabled = false; }
    catch (e) { gres = null; $('#g-res').textContent = e.message; $('#g-usar').disabled = true; }
  }
  $('#g-geo').addEventListener('change', geoZ0);
  $('#g-campos').addEventListener('input', (e) => { const t = e.target; if (t.dataset.gk) { gz[$('#g-geo').value][t.dataset.gk] = t.value; geoZ0(); } });
  $('#g-usar').addEventListener('click', () => { if (!gres) return; sc.Z0 = String(+gres.Z0.toPrecision(5)).replace('.', ','); sc.er = String(+gres.erEf.toPrecision(5)).replace('.', ','); $('#ejemplos').value = ''; formulario(); calcula(); });
  geoZ0();

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Exemples…</option>' + P.ejemplos.map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = P.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }

  function azar() {
    const de = (l) => l[Math.floor(Math.random() * l.length)], c = (x) => String(x).replace('.', ',');
    const Z0 = de([50, 50, 75, 100]), R = de([20, 25, 40, 60, 75, 100, 150]), X = de([-50, -25, 0, 25, 50, 75]);
    const fr = de([100, 200, 300, 500, 900]), er = de([1, 1, 2.25]), lamda = de([0.1, 0.125, 0.2, 0.25, 0.3, 0.375, 0.4]);
    if (R === Z0 && X === 0) return azar();
    sc = { Z0: c(Z0), R: c(R), X: c(X), f: c(fr), er: c(er), l: c(lamda), lu: 'lam', alfa: '', P: '', Vg: '', Rg: '', tp: '', xp: '50', d1: '', sep: '1/8' };
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const x = +String(sc.X || 0).replace(',', '.');
    return `Une ligne sans pertes de ${esc(sc.Z0)} Ω${+String(sc.er).replace(',', '.') === 1 ? '' : ` et εr = ${esc(sc.er)}`} fonctionne à ${esc(sc.f)} MHz et se termine par une charge ZL = ${esc(sc.R)} ${x < 0 ? '−' : '+'} j${f(Math.abs(x))} Ω. Calculez le coefficient de réflexion à la charge (module et phase), le ROS, l'affaiblissement de retour, la longueur d'onde, l'impédance d'entrée à ${esc(sc.l)} ${sc.lu === 'lam' ? 'λ' : 'm'} de la charge et la distance de la charge au premier maximum de tension.`;
  };

  const dato = (t, v, cl = 'num') => `<div class="${cl}"><span>${t}</span>${v}</div>`;
  const cm = (a) => `${f(a.re)} ${a.im < 0 ? '−' : '+'} j${f(Math.abs(a.im))}`;
  function calcula() {
    const err = $('#error');
    try { sol = P.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#leyenda2').textContent = ''; $('#bloque-trans').hidden = true; $('#bloque-bw').hidden = true; lectura(); dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = dato('Réflexion à la charge', `|Γ<sub>L</sub>| = ${f(sol.g)}, θ = ${f(sol.th * 180 / PI)}°`) + dato('Rapport d\'onde stationnaire', `ROE = ${f(sol.roe)}`) +
      dato('Affaiblissement de retour', `RL = ${f(sol.rl)} dB`) + dato('Puissance réfléchie', `${f(sol.pRef)} %`) + dato('Longueur d\'onde dans la ligne', `λ = ${f(sol.lam)} m`) +
      dato('Impédance d\'entrée', `Z<sub>in</sub> = ${cm(sol.zin)} Ω`);
    if (!sol.adaptada) {
      h += dato('Premier maximum de tension', `d<sub>max</sub> = ${f(sol.dmax)} m`) + dato('Premier minimum de tension', `d<sub>min</sub> = ${f(sol.dmin)} m`);
      sol.stub.forEach((s, i) => { h += dato(`Stub parallèle, solution ${i + 1}`, `d = ${f(s.dm)} m ; l<sub>cc</sub> = ${f(s.lccm)} m ; l<sub>ab</sub> = ${f(s.labm)} m`, 'est'); });
      h += dato('Transformateur λ/4 à un maximum', `Z<sub>T</sub> = ${f(sol.cuarto.Zt1)} Ω à d<sub>max</sub>`, 'est');
      sol.serie.forEach((q, i) => { h += dato(`Stub série, solution ${i + 1}`, `d = ${f(q.dm)} m ; l<sub>cc</sub> = ${f(q.lccm)} m ; l<sub>ab</sub> = ${f(q.labm)} m`, 'est'); });
      if (sol.doble.prohibida) h += dato('Double stub', `Zone interdite : g = ${f(sol.doble.g1)} dépasse ${f(sol.doble.gmax)}`, 'est');
      else sol.doble.sols.forEach((q, i) => { h += dato(`Double stub, solution ${i + 1}`, `l<sub>1</sub> = ${f(q.l1m)} m; l<sub>2</sub> = ${f(q.l2m)} m`, 'est'); });
    } else h += dato('État', 'Charge adaptée : il n\'y a pas d\'ondes stationnaires', 'est');
    if (sol.perd) {
      const q = sol.perd; h += dato('Atténuation de la ligne', `α·l = ${f(q.atenDb)} dB`) + dato('Z<sub>in</sub> avec pertes', `${cm(q.zin)} Ω`) + dato('ROS à l\'entrée', `${f(q.roeIn)} (à la charge ${f(sol.roe)})`);
      if (q.PL !== undefined) h += dato('Puissance à la charge', `P<sub>L</sub> = ${f(q.PL)} W`) + dato('Dissipée dans le câble', `${f(q.Pdisip)} W`);
      h += dato('Longueur maximale utile (3 dB)', Number.isFinite(q.lmaxUtil3) ? `${f(q.lmaxUtil3)} m` : 'sans limite');
    }
    if (sol.trans) { const q = sol.trans; h += dato('Première onde', `V₁ = ${f(q.V1)} V; Γ<sub>L</sub> = ${f(q.GL)}, Γ<sub>g</sub> = ${f(q.Gg)}`, 'est') + dato('Retard de la ligne', `T = ${f(q.T * 1e9)} ns`) + dato('Régime permanent', `V<sub>∞</sub> = ${f(q.Vinf)} V`); }
    $('#resumen').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html)}</li>`).join('');
    $('#leyenda').textContent = 'Abaque de Smith normalisé à Z₀. Le cercle bleu est celui de ROS constant ; la flèche rouge va de la charge vers le générateur (sens horaire, un tour par λ/2) jusqu\'à l\'entrée, et si la ligne mesure plus de λ/2, on ne trace que ce qui reste des tours complets. S1 et S2 sont les points où le cercle de ROS coupe le cercle de conductance 1 (tirets rouges) : là, un stub parallèle adapte la ligne.';
    $('#leyenda2').textContent = 'Tension |V| et courant |I|·Z₀ le long de la ligne, avec |V⁺| = 1 et la distance mesurée depuis la charge. Les maximums de tension coïncident avec les minimums de courant.';
    $('#bloque-trans').hidden = !sol.trans; $('#bloque-bw').hidden = !sol.bw; lectura();
    if (sol.trans) $('#leyenda-trans').textContent = `Tension au générateur (bleu), au point choisi (${Math.round(100 * sol.trans.xp)} % de la ligne, rouge) et à la charge (vert) après la fermeture du générateur de ${f(sol.trans.Vg)} V avec Rg = ${f(sol.trans.Rg)} Ω. Retard T = ${f(sol.trans.T * 1e9)} ns, V₁ = ${f(sol.trans.V1)} V, Γ<sub>L</sub> = ${f(sol.trans.GL)}, Γ<sub>g</sub> = ${f(sol.trans.Gg)} ; régime permanent V∞ = ${f(sol.trans.Vinf)} V.`.replace(/<sub>|<\/sub>/g, '');
    if (sol.bw) $('#leyenda-bw').textContent = 'Module de Γ à l\'entrée de chaque réseau d\'adaptation quand la fréquence varie, les longueurs étant fixées (k = f/f₀). La ligne en tirets marque ROS = 2 (|Γ| = 1/3). ' + Object.entries(sol.bw).map(([k, b]) => `${NOMBRE_RED[k]} : ${f(100 * b.bw, 3)} % de f₀`).join('; ') + '.';
    dibuja();
  }
  const NOMBRE_RED = { stub: 'stub paralelo', serie: 'stub serie', doble: 'doble stub', cuarto: 'transformador λ/4' };

  let sonda = null, adm = false;
  function lectura() {
    const o = $('#lectura'); if (!o) return;
    if (!sonda || !sol) { o.textContent = 'Cliquez sur un point de l\'abaque ou saisissez r et x pour lire son coefficient de réflexion, son impédance, son admittance et son ROS.'; return; }
    const G = sonda, g = Math.hypot(G.re, G.im), den = (1 - G.re) ** 2 + G.im ** 2, z = { re: (1 - g * g) / den, im: (2 * G.im) / den }, d2 = z.re * z.re + z.im * z.im, y = { re: z.re / d2, im: -z.im / d2 };
    const th = Math.atan2(G.im, G.re), roe = g < 1 ? (1 + g) / (1 - g) : Infinity;
    const haciaGen = (((sol.th - th) / (4 * PI)) % 0.5 + 0.5) % 0.5, haciaCarga = (((th - sol.th) / (4 * PI)) % 0.5 + 0.5) % 0.5;
    o.innerHTML = `<b>Point P :</b> Γ = ${f(g)} ∠ ${f(th * 180 / PI)}° ; z = ${f(z.re)} ${z.im < 0 ? '−' : '+'} j${f(Math.abs(z.im))} (Z = ${f(z.re * sol.Z0)} ${z.im < 0 ? '−' : '+'} j${f(Math.abs(z.im) * sol.Z0)} Ω) ; y = ${f(y.re)} ${y.im < 0 ? '−' : '+'} j${f(Math.abs(y.im))} ; ROS = ${f(roe)}. Depuis la charge ZL, on atteint P à ${f(haciaGen)} λ vers le générateur (ou à ${f(haciaCarga)} λ vers la charge).`;
    $('#lee-r').value = String(+z.re.toPrecision(5)).replace('.', ','); $('#lee-x').value = String(+z.im.toPrecision(5)).replace('.', ',');
  }
  const desdeZ = (r, x) => { const d = (r + 1) ** 2 + x * x; return { re: (r * r + x * x - 1) / d, im: (2 * x) / d }; };
  const leeRX = () => { const r = +String($('#lee-r').value).replace(',', '.'), x = +String($('#lee-x').value || 0).replace(',', '.'); if (!isFinite(r) || !isFinite(x) || r < 0) return; sonda = desdeZ(r, x); lectura(); smith(); };
  $('#lee-r').addEventListener('input', leeRX); $('#lee-x').addEventListener('input', leeRX);
  $('#ver-adm').addEventListener('change', () => { adm = $('#ver-adm').checked; smith(); });
  $('#grafica').addEventListener('click', (e) => {
    const c = $('#grafica'), b = c.getBoundingClientRect(), R = Math.min(b.width, b.height) / 2 - 24, re = (e.clientX - b.left - b.width / 2) / R, im = -(e.clientY - b.top - b.height / 2) / R;
    if (re * re + im * im > 1.02) return; sonda = { re, im }; lectura(); smith();
  });
  $('#borra-sonda').addEventListener('click', () => { sonda = null; lectura(); smith(); });

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--panel', '--serie-1', '--serie-2', '--serie-3']) col[k] = cs.getPropertyValue(k).trim(); }

  function smith() {
    const { g, w, h } = lienzo('#grafica');
    if (!w || !h) return;
    const R = Math.min(w, h) / 2 - 24, cx = w / 2, cy = h / 2, X = (re) => cx + re * R, Y = (im) => cy - im * R;
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 2 * PI); g.fillStyle = col['--panel']; g.fill(); g.clip();
    g.strokeStyle = col['--muted']; g.globalAlpha = 0.45; g.lineWidth = 1;
    for (const r of [0.2, 0.5, 1, 2, 5]) { g.beginPath(); g.arc(X(r / (1 + r)), cy, R / (1 + r), 0, 2 * PI); g.stroke(); }
    for (const x of [0.2, 0.5, 1, 2, 5]) for (const s of [1, -1]) { g.beginPath(); g.arc(X(1), Y(s / x), R / x, 0, 2 * PI); g.stroke(); }
    if (adm) { g.setLineDash([3, 3]); g.strokeStyle = col['--serie-2']; // admitancias: la misma carta girada media vuelta
      for (const r of [0.2, 0.5, 1, 2, 5]) { g.beginPath(); g.arc(X(-r / (1 + r)), cy, R / (1 + r), 0, 2 * PI); g.stroke(); }
      for (const x of [0.2, 0.5, 1, 2, 5]) for (const s of [1, -1]) { g.beginPath(); g.arc(X(-1), Y(s / x), R / x, 0, 2 * PI); g.stroke(); }
      g.setLineDash([]); g.strokeStyle = col['--muted']; }
    g.beginPath(); g.moveTo(X(-1), cy); g.lineTo(X(1), cy); g.stroke(); // eje real
    g.restore();
    g.strokeStyle = col['--ink']; g.lineWidth = 1.8; g.beginPath(); g.arc(cx, cy, R, 0, 2 * PI); g.stroke();
    g.font = '11px system-ui, sans-serif'; g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const r of [0.2, 0.5, 1, 2, 5]) g.fillText(String(r).replace('.', ','), X((r - 1) / (r + 1)), cy + 3);
    g.textBaseline = 'middle';
    for (const x of [0.2, 0.5, 1, 2, 5]) for (const s of [1, -1]) { // donde el arco de reactancia x corta la circunferencia exterior
      const m = x * x + 1, px = (x * x - 1) / m, py = (2 * x) / m * s, k = 1.07;
      g.textAlign = 'center'; g.fillText((s > 0 ? '+' : '−') + String(x).replace('.', ','), cx + px * R * k, cy - py * R * k);
    }
    if (!sol) return;
    const punto = (G, c, nom, dx = 8, dy = -8) => {
      const x = X(G.re), y = Y(G.im);
      g.fillStyle = c; g.beginPath(); g.arc(x, y, 4.5, 0, 2 * PI); g.fill();
      g.fillStyle = col['--ink']; g.font = 'bold 12px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(nom, x + dx, y + dy);
    };
    g.strokeStyle = col['--serie-1']; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, sol.g * R, 0, 2 * PI); g.stroke();
    if (!sol.adaptada) { g.save(); g.strokeStyle = col['--serie-2']; g.globalAlpha = 0.7; g.setLineDash([4, 4]); g.lineWidth = 1.4; g.beginPath(); g.arc(X(-0.5), cy, R * 0.5, 0, 2 * PI); g.stroke(); g.restore(); }
    const vueltas = sol.ld > 0 && sol.ld % 0.5 < 1e-9 ? 0.5 : sol.ld % 0.5, n = Math.max(2, Math.ceil(vueltas * 240)); // solo la última vuelta, que acaba en Zin
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath();
    for (let i = 0; i <= n; i++) { const a = sol.th - 4 * PI * vueltas * i / n, x = X(sol.g * Math.cos(a)), y = Y(sol.g * Math.sin(a)); if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
    if (sol.g > 1e-9 && vueltas > 0) { // punta de flecha en la entrada
      const a = sol.th - 4 * PI * vueltas, x = X(sol.g * Math.cos(a)), y = Y(sol.g * Math.sin(a)), dx = Math.sin(a), dy = Math.cos(a);
      g.fillStyle = col['--accent']; g.beginPath(); g.moveTo(x + dx * 9, y + dy * 9); g.lineTo(x - dy * 5, y + dx * 5); g.lineTo(x + dy * 5, y - dx * 5); g.closePath(); g.fill();
    }
    if (sol.stub) sol.stub.forEach((s, i) => punto(P.gamma(s.zp, sol.Z0), col['--serie-2'], `S${i + 1}`, -22, 12));
    if (sol.ld > 0 && !sol.adaptada) punto(sol.Gin, col['--serie-1'], 'Zin', 8, 10);
    punto(sol.G, col['--ink'], 'ZL', 8, -8);
    if (sonda) { const gm = Math.hypot(sonda.re, sonda.im); g.save(); g.setLineDash([2, 3]); g.strokeStyle = col['--accent']; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, gm * R, 0, 2 * PI); g.stroke(); g.restore(); punto(sonda, col['--accent'], 'P', 8, -8); }
    g.fillStyle = col['--muted']; g.font = '11px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillText('vers le générateur ↻', 8, 8);
  }

  function perfil() {
    const { g, w, h } = lienzo('#perfil');
    if (!sol || !w || !h) return;
    const m = { l: 40, r: 12, t: 14, b: 34 }, W = w - m.l - m.r, H = h - m.t - m.b, d1 = sol.dPerfil, ym = 2.1;
    const x = (d) => m.l + d / d1 * W, y = (v) => m.t + H - Math.min(v, ym) / ym * H;
    g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.lineWidth = 1; g.font = '11px system-ui, sans-serif';
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of [0, 0.5, 1, 1.5, 2]) { g.beginPath(); g.moveTo(m.l, y(v)); g.lineTo(m.l + W, y(v)); g.stroke(); g.fillText(String(v).replace('.', ','), m.l - 5, y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    const paso = Math.max(d1 > 3 ? 1 : d1 > 1.4 ? 0.5 : 0.25, d1 / 12);
    for (let k = 0, d = 0; k <= 40 && d <= d1 + 1e-9; d = ++k * paso) { g.beginPath(); g.moveTo(x(d), m.t); g.lineTo(x(d), m.t + H); g.stroke(); g.fillText(String(+d.toFixed(2)).replace('.', ','), x(d), m.t + H + 4); }
    g.fillText('distance à la charge (en λ)', m.l + W / 2, m.t + H + 18);
    const serie = (k, c) => { g.strokeStyle = c; g.lineWidth = 2.2; g.beginPath(); sol.perfil.forEach((p, i) => { if (i) g.lineTo(x(p[0]), y(p[k])); else g.moveTo(x(p[0]), y(p[k])); }); g.stroke(); };
    serie(1, col['--serie-1']); serie(2, col['--serie-2']);
    if (sol.ld > 0 && sol.ld < d1 - 1e-9) {
      g.save(); g.setLineDash([4, 4]); g.strokeStyle = col['--accent']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x(sol.ld), m.t); g.lineTo(x(sol.ld), m.t + H); g.stroke(); g.restore();
      g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillStyle = col['--accent']; g.fillText('entrada', x(sol.ld) + 4, m.t + H - 3);
    }
    g.textAlign = 'left'; g.textBaseline = 'top'; g.fillStyle = col['--serie-1']; g.fillText('|V|', m.l + 6, m.t + 2); g.fillStyle = col['--serie-2']; g.fillText('|I|·Z₀', m.l + 34, m.t + 2);
  }
  
  function trans() {
    const { g, w, h } = lienzo('#trans');
    if (!sol || !sol.trans || !w || !h) return;
    const q = sol.trans, m = { l: 48, r: 12, t: 14, b: 34 }, W = w - m.l - m.r, H = h - m.t - m.b, tm = q.tmax, N = 600;
    const puntos = [[0, col['--serie-1']], [q.x, col['--serie-2']], [sol.l, col['--serie-3'] || col['--accent']]];
    let vmin = 0, vmax = 0; for (const [ox] of puntos) for (let i = 0; i <= N; i++) { const v = q.V(tm * i / N, ox); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
    const paso = Math.max(1e-6, vmax - vmin), lo = vmin - 0.08 * paso, hi = vmax + 0.12 * paso, X = (t) => m.l + (t / tm) * W, Y = (v) => m.t + H - ((v - lo) / (hi - lo)) * H;
    g.font = '11px system-ui, sans-serif'; g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.lineWidth = 1; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of Herramienta.marcas(lo, hi, 5)) { g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(m.l + W, Y(v)); g.stroke(); g.fillText(String(+v.toPrecision(4)).replace('.', ','), m.l - 5, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const t of Herramienta.marcas(0, tm * 1e9, 6)) { g.fillText(String(t).replace('.', ','), X(t * 1e-9), m.t + H + 4); }
    g.fillText('tiempo (ns)', m.l + W / 2, m.t + H + 18);
    for (const [ox, c] of puntos) { g.strokeStyle = c; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i <= N; i++) { const t = tm * i / N, v = q.V(t, ox); if (i) g.lineTo(X(t), Y(v)); else g.moveTo(X(t), Y(v)); } g.stroke(); }
    g.setLineDash([5, 4]); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(m.l, Y(q.Vinf)); g.lineTo(m.l + W, Y(q.Vinf)); g.stroke(); g.setLineDash([]);
  }
  function rebotes() {
    const { g, w, h } = lienzo('#rebotes');
    if (!sol || !sol.trans || !w || !h) return;
    const q = sol.trans, m = { l: 46, r: 30, t: 24, b: 14 }, W = w - m.l - m.r, H = h - m.t - m.b, n = Math.min(6, q.rebotes.length), tmax = (n + 0.3) * q.T, X = (x) => m.l + (x / sol.l) * W, Y = (t) => m.t + (t / tmax) * H;
    g.font = '11px system-ui, sans-serif'; g.strokeStyle = col['--ink']; g.lineWidth = 1.4; g.fillStyle = col['--muted'];
    for (const x of [0, sol.l]) { g.beginPath(); g.moveTo(X(x), m.t); g.lineTo(X(x), m.t + H); g.stroke(); }
    g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('generador', X(0), m.t - 6); g.fillText('carga', X(sol.l), m.t - 6);
    g.textAlign = 'right'; g.textBaseline = 'middle'; for (let k = 0; k <= n; k++) g.fillText(`${k}T`, m.l - 6, Y(k * q.T));
    g.strokeStyle = col['--accent']; g.lineWidth = 2; g.fillStyle = col['--ink'];
    for (let k = 0; k < n; k++) {
      const x0 = k % 2 === 0 ? 0 : sol.l, x1 = k % 2 === 0 ? sol.l : 0, b = q.rebotes[k];
      g.beginPath(); g.moveTo(X(x0), Y(k * q.T)); g.lineTo(X(x1), Y((k + 1) * q.T)); g.stroke();
      g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(`${f(b.v, 3)} V`, (X(x0) + X(x1)) / 2, (Y(k * q.T) + Y((k + 1) * q.T)) / 2 - 3 - (k % 2 ? 0 : 0));
    }
  }
  function bw() {
    const { g, w, h } = lienzo('#bw');
    if (!sol || !sol.bw || !w || !h) return;
    const m = { l: 44, r: 12, t: 12, b: 34 }, W = w - m.l - m.r, H = h - m.t - m.b, k0 = 0.5, k1 = 1.5, X = (k) => m.l + ((k - k0) / (k1 - k0)) * W, Y = (v) => m.t + H - Math.min(1, v) * H, cols = { stub: col['--serie-1'], serie: col['--serie-2'], doble: col['--muted'], cuarto: col['--accent'] };
    g.font = '11px system-ui, sans-serif'; g.strokeStyle = col['--line']; g.fillStyle = col['--muted']; g.lineWidth = 1; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (const v of [0, 0.25, 0.5, 0.75, 1]) { g.beginPath(); g.moveTo(m.l, Y(v)); g.lineTo(m.l + W, Y(v)); g.stroke(); g.fillText(String(v).replace('.', ','), m.l - 5, Y(v)); }
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (const k of [0.5, 0.75, 1, 1.25, 1.5]) g.fillText(String(k).replace('.', ','), X(k), m.t + H + 4);
    g.fillText('fréquence relative f/f₀', m.l + W / 2, m.t + H + 18);
    g.setLineDash([5, 4]); g.strokeStyle = col['--ink']; g.beginPath(); g.moveTo(m.l, Y(1 / 3)); g.lineTo(m.l + W, Y(1 / 3)); g.stroke(); g.setLineDash([]);
    let yy = m.t + 4; g.textAlign = 'left'; g.textBaseline = 'top';
    for (const [k, fun] of Object.entries(sol.redes)) { g.strokeStyle = cols[k]; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i <= 200; i++) { const kk = k0 + ((k1 - k0) * i) / 200, v = fun(kk); if (i) g.lineTo(X(kk), Y(v)); else g.moveTo(X(kk), Y(v)); } g.stroke(); g.fillStyle = cols[k]; g.fillText(NOMBRE_RED[k], m.l + 8, yy); yy += 14; }
  }
  const filasBw = () => { const r = []; for (let i = 0; i <= 200; i++) { const k = 0.5 + i / 200; r.push([k, ...['stub', 'serie', 'doble', 'cuarto'].map((c) => (sol.redes[c] ? sol.redes[c](k) : ''))]); } return r; };
  Herramienta.exportar('#bw', { nombre: 'adaptacion-ancho-de-banda', titulo: 'Largeur de bande de l\'adaptation', datos: () => ({ cab: ['f/f0', '|Γ| stub parallèle', '|Γ| stub série', '|Γ| double stub', '|Γ| transformateur λ/4'], filas: sol && sol.redes ? filasBw() : [] }) });
  Herramienta.exportar('#trans', { nombre: 'transitorio-tension', titulo: 'Tension en fonction du temps', datos: () => ({ cab: ['t (ns)', 'V generador (V)', 'V punto (V)', 'V carga (V)'], filas: sol && sol.trans ? Array.from({ length: 301 }, (_, i) => { const t = sol.trans.tmax * i / 300; return [t * 1e9, sol.trans.V(t, 0), sol.trans.V(t, sol.trans.x), sol.trans.V(t, sol.l)]; }) : [] }) });
  Herramienta.exportar('#grafica', { nombre: 'carta-de-smith', titulo: 'Abaque de Smith', datos: () => ({ cab: ['d (λ)', '|V|', '|I|·Z0'], filas: sol ? sol.perfil.map((p) => [p[0], p[1], p[2]]) : [] }) });
  function dibuja() { smith(); perfil(); trans(); rebotes(); bw(); }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('lineas-transmision').current;
  colores(); formulario(); calcula();
  window.LineasTransmisionApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { g: sol.g, th: sol.th, roe: sol.roe, rl: sol.rl, lam: sol.lam, zin: sol.zin, dmax: sol.dmax }, estado: () => copia(sc), sonda: (r, x) => { sonda = desdeZ(r, x); lectura(); smith(); return sonda; } };
})();

