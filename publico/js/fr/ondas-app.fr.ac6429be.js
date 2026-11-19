(() => {
  const { $, esc, copia } = Herramienta;
  const O = Ondas, f = O.f, CLAVE = 'ondas-v1';
  const txt = (h) => String(h).replace(/<sup>/g, '^').replace(/<[^>]+>/g, '');
  const MODOS = [['armonica', 'Onde harmonique'], ['estacionaria', 'Ondes stationnaires'], ['superposicion', 'Superposition : battements et interférences'], ['energia', 'Énergie et puissance sur une corde'], ['reflexion', 'Réflexion et transmission entre deux cordes'], ['doppler', 'Effet Doppler'], ['sonido', 'Intensité et niveau sonore']];

  let sc = copia(O.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {}, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const sep = (t) => `<div class="sep">${t}</div>`;
  function formulario() {
    let h = `<label for="f-modo">Que calculer</label><select id="f-modo" class="in" data-k="modo">${opciones('modo', MODOS)}</select>`;
    if (sc.modo === 'armonica') {
      h += fila('A', 'Amplitude A', 'm') + fila('f', 'Fréquence f', 'Hz') + fila('v', 'Vitesse de propagation v', 'm/s') + `<label for="f-sentido">Sens</label><select id="f-sentido" class="in" data-k="sentido">${opciones('sentido', [['+', 'Vers les x positifs'], ['-', 'Vers les x négatifs']])}</select>` + fila('fase', 'Phase initiale φ', 'rad');
      h += sep('Un point du milieu (facultatif)') + fila('x0', 'Position x', 'm') + fila('t0', 'Instant t', 's') + fila('dx', 'Déphasage avec un point à Δx', 'm');
      $('#nota').textContent = 'La phase accepte π : par exemple π/2 ou 3pi/4.';
    } else if (sc.modo === 'estacionaria') {
      h += `<label for="f-medio">Moyen</label><select id="f-medio" class="in" data-k="medio">${opciones('medio', [['cuerda', 'Corde aux deux extrémités fixes'], ['abierto', 'Tuyau ouvert aux deux extrémités'], ['cerrado', 'Tuyau fermé à une extrémité']])}</select>` + fila('L', 'Longueur L', 'm');
      h += sc.medio === 'cuerda' ? fila('tension', 'Tension T', 'N') + fila('mu', 'Masse linéique μ', 'kg/m') : fila('vs', 'Vitesse du son', 'm/s') + fila('Taire', 'ou température de l’air', '°C');
      h += fila('n', sc.medio === 'cerrado' ? 'Mode n (harmonique 2n − 1)' : 'Harmonique n', '');
      $('#nota').textContent = sc.medio === 'cuerda' ? 'μ est la masse par unité de longueur : 1,1 g/m = 0,0011 kg/m.' : 'Le dessin montre le déplacement de l’air : des nœuds là où il ne bouge pas.';
    } else if (sc.modo === 'superposicion') {
      h += `<label for="f-tipo">Situation</label><select id="f-tipo" class="in" data-k="tipo">${opciones('tipo', [['pulsaciones', 'Battements (deux fréquences voisines)'], ['fase', 'Deux ondes identiques déphasées']])}</select>`;
      h += sc.tipo === 'fase' ? fila('A1', 'Amplitude A<sub>1</sub>', 'm') + fila('A2', 'Amplitude A<sub>2</sub>', 'm') + fila('f', 'Fréquence f', 'Hz') + fila('v', 'Vitesse de propagation v', 'm/s') + fila('dr', 'Différence de marche Δr', 'm') + fila('delta', 'ou déphasage δ', 'rad')
        : fila('A1', 'Amplitude A<sub>1</sub>', 'm') + fila('f1', 'Fréquence f<sub>1</sub>', 'Hz') + fila('A2', 'Amplitude A<sub>2</sub>', 'm') + fila('f2', 'Fréquence f<sub>2</sub>', 'Hz');
      $('#nota').textContent = sc.tipo === 'fase' ? 'Donne Δr (par exemple, la distance supplémentaire parcourue par le son d’un haut-parleur) ou directement δ, qui accepte π.' : 'Sur le dessin, la somme en fonction du temps avec son enveloppe en pointillés.';
    } else if (sc.modo === 'energia') {
      h += fila('mu', 'Masse linéique μ', 'kg/m') + fila('A', 'Amplitude A', 'm') + fila('f', 'Fréquence f', 'Hz') + fila('tension', 'Tension T', 'N') + fila('v', 'ou vitesse v', 'm/s');
      $('#nota').textContent = 'Donne la tension ou directement la vitesse de propagation.';
    } else if (sc.modo === 'reflexion') {
      h += fila('tension', 'Tension T (la même dans les deux)', 'N') + fila('mu1', 'Masse linéique de la corde 1 μ<sub>1</sub>', 'kg/m') + fila('mu2', 'Masse linéique de la corde 2 μ<sub>2</sub>', 'kg/m') + fila('A', 'Amplitude incidente', 'm') + fila('f', 'Fréquence (facultative)', 'Hz');
      $('#nota').textContent = 'L’onde arrive par la corde 1 (à gauche) à la jonction avec la 2. Sur le dessin, la corde la plus épaisse est la plus lourde.';
    } else if (sc.modo === 'doppler') {
      h += fila('f', 'Fréquence émise par la source', 'Hz') + fila('vs', 'Vitesse du son', 'm/s') + fila('Taire', 'ou température de l’air', '°C') + fila('vF', 'Vitesse de la source', 'm/s') + fila('vO', 'Vitesse de l’observateur', 'm/s');
      $('#nota').innerHTML = 'Positives s’ils se rapprochent, négatives s’ils s’éloignent. Pour le vent, une source qui passe, l’angle ou le cône de Mach, utilise <a href="../doppler/">Effet Doppler</a>.';
    } else {
      h += fila('P', 'Puissance de la source', 'W') + fila('r1', 'Distance r₁', 'm') + fila('r2', 'Autre distance r₂', 'm') + fila('N', 'Nombre de sources identiques', '');
      $('#nota').textContent = 'Source ponctuelle qui émet de la même façon dans toutes les directions, sans réflexions ni absorption.';
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
  sel.innerHTML = '<option value="">Exemples…</option>' + O.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
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
      h = dato('Équation', `<b>${sol.ec}</b>`) + dato('λ y T', `λ = ${f(sol.lam)} m, T = ${f(sol.T)} s`) + (sol.punto ? dato(`Point x = ${f(sol.punto.x0)} m, t = ${f(sol.punto.t0)} s`, `y = ${f(sol.punto.y)} m, v<sub>y</sub> = ${f(sol.punto.vy)} m/s`) : '');
      ley = 'Animation au ralenti : une période dure environ 3 s. Le point rouge est celui du x demandé.';
    } else if (sol.modo === 'estacionaria') {
      h = dato(sol.medio === 'cerrado' ? `Mode ${sol.n} (harmonique ${sol.m})` : `Harmonique ${sol.n}`, `f = <b>${f(sol.fn)} Hz</b>, λ = ${f(sol.lam)} m`) + dato('Fondamental', `${f(sol.freqs[0])} Hz`) + dato('Vitesse', `v = ${f(sol.v)} m/s`);
      ley = 'Nœuds en rouge et ventres en bleu ; en gris, l’enveloppe.';
    } else if (sol.modo === 'superposicion' && sol.tipo === 'pulsaciones') {
      h = dato('Battements', `f<sub>b</sub> = <b>${f(sol.fb)} Hz</b>`) + dato('Fréquence entendue', `${f(sol.fm)} Hz`) + dato('Amplitude', `de ${f(Math.abs(sol.A1 - sol.A2))} à ${f(sol.A1 + sol.A2)} m`);
      ley = 'La somme des deux ondes en fonction du temps, avec l’enveloppe en pointillés ; la ligne verticale marque l’instant.';
    } else if (sol.modo === 'superposicion') {
      h = dato('Amplitude résultante', `A = <b>${f(sol.A)} m</b>${sol.interferencia ? ` (${sol.interferencia})` : ''}`) + dato('Déphasage', `δ = ${f(sol.delta)} rad`) + dato('Longueur d’onde', `λ = ${f(sol.lam)} m`);
      ley = 'En gris, les deux ondes ; en couleur, leur somme.';
    } else if (sol.modo === 'energia') {
      h = dato('Puissance', `P = <b>${f(sol.P)} W</b>`) + dato('Énergie par mètre', `u = <b>${f(sol.u)} J/m</b>`) + dato('Vitesse', `v = ${f(sol.v)} m/s, λ = ${f(sol.lam)} m`);
      ley = 'L’onde transporte l’énergie vers la droite à la vitesse v.';
    } else if (sol.modo === 'reflexion') {
      h = dato('Coefficient de réflexion', `r = <b>${f(sol.r)}</b>, A<sub>r</sub> = ${f(sol.r * sol.A)} m`) + dato('Coefficient de transmission', `t = <b>${f(sol.t)}</b>, A<sub>t</sub> = ${f(sol.t * sol.A)} m`) + dato('Puissance', `${f(100 * sol.R, 3)} % réfléchie, ${f(100 * sol.Tt, 3)} % transmise`);
      ley = 'Une impulsion arrive par la corde 1 ; à la jonction, une partie est réfléchie et une partie passe dans la corde 2 avec une autre vitesse.';
    } else if (sol.modo === 'doppler') {
      h = dato('Fréquence entendue', `f′ = <b>${f(sol.fp)} Hz</b>`) + dato('Variation', `${sol.fp >= sol.fr ? '+' : '−'}${f(Math.abs(sol.fp - sol.fr))} Hz (${f((100 * (sol.fp - sol.fr)) / sol.fr, 3)} %)`);
      ley = 'Fronts d’onde de la source (à gauche) qui parviennent à l’observateur (à droite), au ralenti.';
    } else {
      h = dato(`A ${f(sol.r1)} m`, `I = ${f(sol.I1)} W/m<sup>2</sup>, <b>β = ${f(sol.b1)} dB</b>`) + (sol.r2 ? dato(`A ${f(sol.r2)} m`, `I = ${f(sol.I2)} W/m<sup>2</sup>, <b>β = ${f(sol.b2)} dB</b>`) : '');
      ley = 'Échelle de niveaux sonores avec quelques sons de référence.';
    }
    $('#res').innerHTML = h; $('#leyenda').textContent = ley;
    $('#play').hidden = sol.modo === 'sonido';
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    dibuja();
  }
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Reprendre'; if (anda) bucle(); });

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
      texto(g, w / 2, h - 10, `${txt(f(sol.fb))} battements par seconde`, col['--muted']);
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
      texto(g, m + L / 2, h - 12, `corde 1 · v₁ = ${txt(f(sol.v1))} m/s`, col['--muted']); texto(g, x0 + (w - m - x0) / 2, h - 12, `corde 2 · v₂ = ${txt(f(sol.v2))} m/s`, col['--muted']);
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
      const ref = [[0, 'umbral'], [30, 'susurro'], [60, 'conversation'], [85, 'circulation'], [110, 'concierto'], [130, 'dolor']];
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
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
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
    const e = (x) => esc(String(x ?? '').replace('.', ','));
    if (sc.modo === 'estacionaria' && sc.medio === 'cuerda') return `Une corde de ${e(sc.L)} m aux extrémités fixes, de tension ${e(sc.tension)} N et de masse linéique ${e(sc.mu)} kg/m, vibre sur son harmonique ${e(sc.n)}. Calcule la vitesse des ondes, la longueur d’onde, la fréquence et le fondamental.`;
    if (sc.modo === 'estacionaria') return `Un tuyau de ${e(sc.L)} m ${sc.medio === 'abierto' ? 'ouvert aux deux extrémités' : 'fermé à une extrémité'} (v = ${e(sc.vs)} m/s) sonne sur son mode ${e(sc.n)}. Calcule la fréquence, la longueur d’onde et le fondamental.`;
    if (sc.modo === 'doppler') return `Une sirène de ${e(sc.f)} Hz ${+sc.vF > 0 ? 's’approche' : 's’éloigne'} à ${e(String(sc.vF).replace('-', ''))} m/s d’un observateur immobile (v = ${e(sc.vs)} m/s). Quelle fréquence entend-il ?`;
    if (sc.modo === 'sonido') return `Un haut-parleur émet ${e(sc.P)} W de façon égale dans toutes les directions. Calcule l’intensité et le niveau sonore à ${e(sc.r1)} m et à ${e(sc.r2)} m.`;
    if (sc.modo === 'superposicion') return `Deux diapasons de ${e(sc.f1)} Hz et ${e(sc.f2)} Hz, de même amplitude (${e(sc.A1)}), sonnent en même temps. Calcule la fréquence des battements, la fréquence entendue et entre quelles valeurs varie l’amplitude.`;
    if (sc.modo === 'energia') return `Une onde d’amplitude ${e(sc.A)} m et de fréquence ${e(sc.f)} Hz se propage le long d’une corde de ${e(sc.mu)} kg/m soumise à une tension de ${e(sc.tension)} N. Calcule la puissance transportée, l’énergie par mètre, la vitesse et la longueur d’onde.`;
    if (sc.modo === 'reflexion') return `Une corde de ${e(sc.mu1)} kg/m est reliée à une autre de ${e(sc.mu2)} kg/m, toutes deux soumises à une tension de ${e(sc.tension)} N. Une onde d’amplitude ${e(sc.A)} m arrive par la première : calcule les coefficients de réflexion et de transmission, les amplitudes et la répartition de la puissance.`;
    return `Calcule l’équation de l’onde et ses caractéristiques.`;
  };

  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.OndasApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, ec: sol.ec, fn: sol.fn, fp: sol.fp, b1: sol.b1 }, estado: () => copia(sc), pausa: () => { anda = false; } };
})();

