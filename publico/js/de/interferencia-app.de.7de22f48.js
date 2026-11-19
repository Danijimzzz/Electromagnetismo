(() => {
  const { $, esc, copia, txt } = Herramienta;
  const IF = Interferencia, f = IF.f, CLAVE = 'interferencia-v1';
  const MODOS = [['young', 'Youngscher Doppelspalt'], ['rendija', 'Einzelspalt (Beugung)'], ['circular', 'Kreisförmige Öffnung (Rayleigh-Kriterium)'], ['red', 'Beugungsgitter'], ['lamina', 'Dünne Schicht'], ['cuna', 'Luftkeil'], ['anillos', 'Newtonsche Ringe']];

  let sc = copia(IF.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const NOTAS = {
    young: 'Monochromatisches Licht, das durch zwei sehr feine Spalte geht. Gibst du die Breite a jedes Spalts an, kommt die Beugungseinhüllende hinzu. Die Brechzahl n ist die des Mediums zwischen Spalten und Schirm (1 in Luft).',
    rendija: 'Der Spalt muss schmal sein, in der Größenordnung der Wellenlänge (Zehntel oder Hundertstel mm), damit die Beugung zu bemerken ist.',
    red: 'Ein Gitter wird meist durch seine Linien pro Millimeter angegeben: d = 1/N. Die beleuchtete Breite dient dem Auflösungsvermögen.',
    lamina: 'Licht, das senkrecht auf eine Schicht der Dicke t trifft, wie eine Seifenblase, ein Ölfleck oder eine Antireflexschicht.',
    circular: 'Die Pupille des Auges misst etwa 2–8 mm; ein Teleskop so viel wie sein Spiegel oder seine Linse. Der Schirm ist optional (oder die Brennweite), und mit dem Abstand zu zwei Objekten und ihrer Trennung entscheidet man, ob sie unterscheidbar sind.',
    cuna: 'Zwei ebene Gläser, die sich an einem Ende berühren und am anderen durch ein Papier oder ein Haar getrennt sind. Gib die Dicke des Abstandhalters oder den gemessenen Streifenabstand an, um die Dicke zu erhalten.',
    anillos: 'Eine Linse auf einem ebenen Glas, von oben beleuchtet. Gib den Krümmungsradius der Linse oder den gemessenen Radius eines dunklen Rings an, um R zu erhalten.',
  };
  function formulario() {
    let h = elige('modo', 'Aufbau', MODOS);
    if (sc.modo === 'young') h += fila('lambda', 'Wellenlänge λ', 'nm') + fila('d', 'Spaltabstand d', 'mm') + fila('L', 'Abstand zum Schirm L', 'm') + sep('Optional') + fila('m', 'Ordnung m des Maximums') + fila('y', 'Position y auf dem Schirm', 'mm') + fila('a', 'Breite jedes Spalts a', 'mm') + fila('n', 'Brechzahl des Mediums n');
    else if (sc.modo === 'rendija') h += fila('lambda', 'Wellenlänge λ', 'nm') + fila('a', 'Breite des Spalts a', 'mm') + fila('L', 'Abstand zum Schirm L', 'm') + fila('m', 'Ordnung m des Minimums') + sep('Optional') + fila('y', 'Position y auf dem Schirm', 'mm') + fila('n', 'Brechzahl des Mediums n');
    else if (sc.modo === 'red') h += fila('lambda', 'Wellenlänge λ', 'nm') + fila('N', 'Linien pro Millimeter N') + sep('Optional') + fila('L', 'Abstand zum Schirm L', 'm') + fila('lambda2', 'Weitere Wellenlänge λ₂', 'nm') + fila('W', 'Beleuchtete Breite des Gitters', 'mm');
    else if (sc.modo === 'circular') h += fila('lambda', 'Wellenlänge λ', 'nm') + fila('D', 'Durchmesser der Öffnung D', 'mm') + sep('Optional') + fila('L', 'Abstand zum Schirm oder Brennweite L', 'm') + fila('dist', 'Abstand zu den Objekten', 'm') + fila('sep', 'Abstand zwischen den beiden Objekten', 'mm') + fila('n', 'Brechzahl des Mediums n');
    else if (sc.modo === 'cuna') h += fila('lambda', 'Wellenlänge λ', 'nm') + fila('Lc', 'Länge der Platten L', 'cm') + sep('Eines von beiden') + fila('h', 'Dicke des Abstandhalters h', 'µm') + fila('dx', 'Gemessener Streifenabstand Δx', 'mm') + sep('Optional') + fila('n', 'Brechzahl dessen, was den Keil füllt n');
    else if (sc.modo === 'anillos') h += fila('lambda', 'Wellenlänge λ', 'nm') + fila('m', 'Nummer des dunklen Rings m') + sep('Eines von beiden') + fila('R', 'Krümmungsradius der Linse R', 'm') + fila('rm', 'Gemessener Radius des Rings m', 'mm') + sep('Optional') + fila('n', 'Brechzahl dessen, was zwischen den Gläsern ist n');
    else h += fila('nl', 'Brechzahl der Schicht n') + fila('n1', 'Brechzahl des oberen Mediums n₁') + fila('n2', 'Brechzahl des unteren Mediums n₂') + fila('t', 'Dicke t', 'nm') + fila('lambda', 'Wellenlänge λ', 'nm');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => { const t = e.target; if (t.tagName !== 'SELECT') return; sc = copia(IF.ejemplos.find((x) => x.sc.modo === t.value).sc); formulario(); cambia(); });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Beispiele…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${IF.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = IF.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const lam = String(de([450, 500, 546, 550, 589, 600, 633, 650]));
    const tipos = [
      () => ({ modo: 'young', lambda: lam, d: c(de([0.1, 0.2, 0.25, 0.3, 0.5])), L: c(de([1, 1.2, 1.5, 2, 3])), n: '', a: '', m: String(ent(1, 5)), y: '' }),
      () => ({ modo: 'rendija', lambda: lam, a: c(de([0.02, 0.05, 0.1, 0.2])), L: c(de([1, 1.5, 2])), n: '', m: String(ent(1, 3)), y: '' }),
      () => ({ modo: 'red', lambda: lam, N: String(de([100, 200, 300, 500, 600, 800])), L: Math.random() < 0.5 ? '' : c(de([0.5, 1, 2])), lambda2: '', W: '' }),
      () => ({ modo: 'lamina', nl: c(de([1.33, 1.38, 1.45, 1.5])), n1: '1', n2: c(de([1, 1, 1.33, 1.52])), t: String(de([100, 200, 300, 400, 500])), lambda: Math.random() < 0.5 ? '' : lam }),
      () => ({ modo: 'circular', lambda: lam, D: c(de([2, 3, 5, 8])), L: '', dist: String(de([500, 1000, 5000, 10000])), sep: '', n: '' }),
      () => ({ modo: 'circular', lambda: lam, D: String(de([50, 100, 200, 2400])), L: c(de([0.5, 1, 2])), dist: '', sep: '', n: '' }),
      () => ({ modo: 'cuna', lambda: lam, Lc: String(ent(5, 15)), h: String(ent(2, 10) * 10), dx: '', n: '' }),
      () => ({ modo: 'cuna', lambda: lam, Lc: String(ent(5, 15)), h: '', dx: c(de([0.2, 0.4, 0.5, 0.8, 1])), n: '' }),
      () => ({ modo: 'anillos', lambda: lam, R: c(de([0.5, 1, 1.5, 2, 3])), m: String(ent(1, 10)), rm: '', n: '' }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    if (sc.modo === 'young') return `In einem Youngschen Versuch mit Licht von ${esc(sc.lambda)} nm haben die Spalte den Abstand ${esc(sc.d)} mm, und der Schirm steht in ${esc(sc.L)} m Entfernung. Berechne den Streifenabstand${sc.m ? `, die Lage des Maximums der Ordnung ${esc(sc.m)}` : ''}${sc.y ? ` und die relative Intensität bei ${esc(sc.y)} mm vom Zentrum` : ''}.`;
    if (sc.modo === 'rendija') return `Licht von ${esc(sc.lambda)} nm geht durch einen Spalt von ${esc(sc.a)} mm und trifft auf einen Schirm in ${esc(sc.L)} m Entfernung. Berechne den Winkel und die Lage des Minimums der Ordnung ${esc(sc.m || 1)} und die Breite des zentralen Maximums.`;
    if (sc.modo === 'circular' && sc.dist) return `Welchen kleinsten Abstand zwischen zwei Punkten in ${esc(sc.dist)} m Entfernung unterscheidet bei Licht von ${esc(sc.lambda)} nm eine Öffnung (Pupille oder Linse) mit ${esc(sc.D)} mm Durchmesser? Berechne auch den Rayleigh-Grenzwinkel.`;
    if (sc.modo === 'circular') return `Ein Teleskop mit ${esc(sc.D)} mm Durchmesser beobachtet mit Licht von ${esc(sc.lambda)} nm. Berechne seine Winkelauflösungsgrenze und den Radius der Airy-Scheibe in ${esc(sc.L)} m.`;
    if (sc.modo === 'cuna' && sc.dx) return `Zwei Glasplatten von ${esc(sc.Lc)} cm berühren sich an einem Ende, und am anderen trennt sie ein Haar. Mit Licht von ${esc(sc.lambda)} nm haben die Streifen den Abstand ${esc(sc.dx)} mm. Wie dick ist das Haar, und wie viele dunkle Streifen sieht man?`;
    if (sc.modo === 'cuna') return `Zwei Glasplatten von ${esc(sc.Lc)} cm berühren sich an einem Ende, und am anderen trennt sie ein Papier von ${esc(sc.h)} µm. Wie oft erscheint mit Licht von ${esc(sc.lambda)} nm ein dunkler Streifen, und wie viele sieht man?`;
    if (sc.modo === 'anillos') return `Eine Linse mit ${esc(sc.R)} m Krümmungsradius liegt auf einem ebenen Glas und wird mit Licht von ${esc(sc.lambda)} nm beleuchtet. Berechne den Radius des dunklen Rings Nummer ${esc(sc.m)} und des vorherigen hellen.`;
    if (sc.modo === 'red') return `Ein Beugungsgitter mit ${esc(sc.N)} Linien/mm wird mit Licht von ${esc(sc.lambda)} nm beleuchtet. Berechne die Winkel der Maxima und die höchste beobachtete Ordnung.`;
    return `Eine Schicht mit Brechzahl ${esc(sc.nl)}${sc.t ? ` und Dicke ${esc(sc.t)} nm` : ''} liegt zwischen einem Medium mit Brechzahl ${esc(sc.n1 || 1)} und einem mit Brechzahl ${esc(sc.n2 || 1)}. ${sc.t ? 'Welche sichtbaren Farben werden im reflektierten Licht verstärkt und welche ausgelöscht?' : ''}${sc.lambda ? ` Welche Mindestdicke verstärkt und welche löscht die Reflexion von ${esc(sc.lambda)} nm aus?` : ''}`;
  };

  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = IF.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tA = 0;
    let h = '';
    if (sol.modo === 'young') {
      h = dato('Streifenabstand', `Δy = <b>${f(sol.dy * 1e3)} mm</b>`) + dato('Höchste Ordnung', `m<sub>max</sub> = ${sol.mmax}`);
      if (sol.m !== null) h += dato(`Winkel des Maximums m = ${sol.m}`, `θ = <b>${f((sol.th * 180) / Math.PI)}°</b>`) + dato(`Lage des Maximums m = ${sol.m}`, `y = <b>${f(sol.ym * 1e3)} mm</b>`);
      if (sol.Iy !== null) h += dato(`Intensität bei y = ${f(sol.y)} mm`, `I/I<sub>max</sub> = <b>${f(sol.Iy)}</b>`);
    } else if (sol.modo === 'rendija') {
      h = dato(`Winkel des Minimums m = ${sol.m}`, `θ = <b>${f((sol.th * 180) / Math.PI)}°</b>`) + dato(`Lage des Minimums m = ${sol.m}`, `y = <b>${f(sol.ym * 1e3)} mm</b>`) + dato('Breite des zentralen Maximums', `<b>${f(sol.ancho * 1e3)} mm</b>`);
      if (sol.Iy !== null) h += dato(`Intensität bei y = ${f(sol.y)} mm`, `I/I<sub>0</sub> = <b>${f(sol.Iy)}</b>`);
    } else if (sol.modo === 'red') {
      h = dato('Gitterkonstante', `d = ${f(sol.d * 1e9)} nm`) + dato('Höchste Ordnung', `m<sub>max</sub> = <b>${sol.mmax}</b>`) + sol.ords.slice(0, 4).map((o) => dato(`Winkel der Ordnung ${o.m}`, `θ = <b>${f((o.th * 180) / Math.PI)}°</b>`)).join('');
      if (sol.sep !== null) h += dato('Trennung von λ und λ₂ (Ordnung 1)', `Δθ = ${f(Math.abs(sol.sep))}°`);
      if (sol.dlmin !== null) h += dato('Kleinste trennbare Δλ (Ordnung 1)', `<b>${f(sol.dlmin, 3)} nm</b>`);
    } else if (sol.modo === 'circular') {
      h = dato('Rayleigh-Grenze', `θ<sub>min</sub> = <b>${f(sol.thR)} rad</b>`);
      if (sol.r !== null) h += dato('Radius der Airy-Scheibe', `r = <b>${f(sol.r * 1e3)} mm</b>`);
      if (sol.smin !== null) h += dato('Kleinster unterscheidbarer Abstand', `s = <b>${f(sol.smin * 1e3)} mm</b>`);
      if (sol.res !== null) h += dato('Die beiden Objekte', `<b>${sol.res ? 'sind unterscheidbar' : 'sind nicht unterscheidbar'}</b>`);
    } else if (sol.modo === 'cuna') {
      h = dato('Streifenabstand', `Δx = <b>${f(sol.dx * 1e3)} mm</b>`) + dato('Dicke des Abstandhalters', `h = <b>${f(sol.h * 1e6)} µm</b>`) + dato('Dunkle Streifen', `<b>${sol.N}</b>`);
    } else if (sol.modo === 'anillos') {
      h = dato(`Dunkler Ring m = ${sol.m}`, `r = <b>${f(sol.ro * 1e3)} mm</b>`) + dato('Vorheriger heller', `r = <b>${f(sol.rb * 1e3)} mm</b>`) + dato('Radius der Linse', `R = <b>${f(sol.R)} m</b>`);
    } else {
      h = dato('Zusätzliche Phasenverschiebung bei der Reflexion', `<b>${sol.medio ? 'ja, λ/2' : 'no'}</b>`);
      if (sol.t !== null) h += dato('Verstärkt', sol.refuerzan.length ? sol.refuerzan.map((l) => `<b>${f(l)} nm</b>`).join(', ') : 'keine sichtbar') + dato('Ausgelöscht', sol.anulan.length ? sol.anulan.map((l) => `${f(l)} nm`).join(', ') : 'keine sichtbar');
      if (sol.tmin !== null) h += dato('Mindestdicke mit Verstärkung', `t = <b>${f(sol.tmin)} nm</b>`) + dato('Mindestdicke, die auslöscht', `t = <b>${f(sol.tmin2)} nm</b>`);
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    $('#leyenda').textContent = sol.modo === 'circular' ? `Oben das Bild ${sol.res !== null ? 'der beiden Punkte' : 'eines Punktes'} durch die Öffnung (Airy-Scheiben, heller als in Wirklichkeit, damit man die Ringe sieht). Unten ihre Intensität: Fahre mit dem Finger oder der Maus darüber, um sie abzulesen.` : sol.modo === 'cuna' ? 'Oben der Keil von der Seite (der Winkel ist übertrieben) und die Streifen von oben gesehen. Unten die reflektierte Intensität entlang des Keils.' : sol.modo === 'anillos' ? 'Oben die Linse auf dem Glas und die Ringe von oben gesehen. Unten die Intensität entlang eines Radius: Fahre mit dem Finger oder der Maus darüber, um sie abzulesen.' : sol.modo === 'lamina' ? 'Oben die beiden reflektierten Strahlen, die interferieren. Unten, wie viel von jeder Farbe reflektiert wird, und die Farbe, die man sieht.' : sol.modo === 'red' ? 'Oben das Gitter und die Bündel jeder Ordnung. Unten, wo die Maxima liegen (sin θ).' : 'Oben die von den Spalten ausgehenden Wellen (nicht maßstäblich). Unten die Intensität auf dem Schirm und wie die Streifen aussehen: Fahre mit dem Finger oder der Maus darüber, um sie abzulesen.';
    dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--bg', '--panel']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = (s) => Herramienta.lienzo(s);
  const FU = '"IBM Plex Sans", system-ui, sans-serif';
  const rgb = (nm, a = 1) => { const [r, g, b] = IF.color(nm); return `rgba(${r},${g},${b},${a})`; };
  const luz = () => (sol.modo === 'lamina' ? sol.l0 || 550 : sol.l0);
  function dibuja() { montaje(); patron(); }
  function montaje() {
    const { g, w, h } = lienzo('#montaje');
    if (!sol) return;
    if (!col['--ink']) colores();
    const nm = luz(), paso = 16, avance = (tA * 30) % paso;
    g.font = `12px ${FU}`;
    if (sol.modo === 'lamina') return lamina(g, w, h, avance);
    if (sol.modo === 'circular' || sol.modo === 'anillos') return imagen(g, w, h);
    if (sol.modo === 'cuna') return cunaVista(g, w, h);
    const xb = w * 0.32, xs = w - 40, yc = h / 2;
    g.lineWidth = 1.5;
    for (let x = 20 + avance; x < xb; x += paso) { g.strokeStyle = rgb(nm, 0.55); g.beginPath(); g.moveTo(x, 14); g.lineTo(x, h - 14); g.stroke(); }
    const nR = sol.modo === 'young' ? 2 : sol.modo === 'rendija' ? 1 : 9, sepR = sol.modo === 'red' ? 9 : 34, ys = Array.from({ length: nR }, (_, i) => yc + (i - (nR - 1) / 2) * sepR), hueco = sol.modo === 'rendija' ? 22 : 4;
    g.fillStyle = col['--ink']; g.fillRect(xb - 3, 8, 6, h - 16);
    g.globalCompositeOperation = 'destination-out'; for (const y of ys) g.fillRect(xb - 4, y - hueco / 2, 8, hueco); g.globalCompositeOperation = 'source-over';
    g.save(); g.beginPath(); g.rect(xb + 3, 0, xs - xb - 3, h); g.clip();
    for (const y of ys) for (let r = avance; r < xs - xb + paso; r += paso) { g.strokeStyle = rgb(nm, Math.max(0.05, 0.5 * (1 - r / (xs - xb)) / Math.sqrt(nR / 2))); g.lineWidth = 1.2; g.beginPath(); g.arc(xb, y, r, -Math.PI / 2, Math.PI / 2); g.stroke(); }
    g.restore();
    if (sol.modo === 'red') {
      g.lineWidth = 2; for (const o of [{ m: 0, th: 0 }, ...sol.ords]) for (const s of o.m ? [1, -1] : [1]) { const L = xs - xb, x2 = xb + L * Math.cos(o.th), y2 = yc - s * L * Math.sin(o.th); g.strokeStyle = rgb(nm, 0.9); g.beginPath(); g.moveTo(xb, yc); g.lineTo(x2, y2); g.stroke(); g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'middle'; if (Math.abs(y2 - yc) < h / 2 - 8) g.fillText(`m = ${s * o.m}`, Math.min(x2 + 4, w - 40), y2); }
      g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(`${txt(f(sol.N))} Linien/mm`, xb, h - 1);
      return;
    }
    const Y = sol.modo === 'young' ? sol.ancho : sol.anchoV, alto = h - 20;
    for (let i = 0; i < alto; i++) { const yy = ((i - alto / 2) / alto) * Y; g.fillStyle = rgb(nm, sol.I(-yy)); g.fillRect(xs, 10 + i, 14, 1); }
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.strokeRect(xs, 10, 14, alto);
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText('pantalla', xs + 7, h - 0); g.fillText(sol.modo === 'young' ? `d = ${txt(f(sol.d * 1e3))} mm` : `a = ${txt(f(sol.a * 1e3))} mm`, xb, h - 0);
  }
  function lamina(g, w, h, avance) {
    const y1 = h * 0.45, y2 = h * 0.72, x0 = w * 0.18, nm = luz();
    g.fillStyle = col['--bg']; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,160,220,0.22)'; g.fillRect(0, y1, w, y2 - y1);
    if (sol.n2 > 1.001) { g.fillStyle = 'rgba(120,160,220,0.10)'; g.fillRect(0, y2, w, h - y2); }
    g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'middle';
    g.fillText(`n₁ = ${txt(f(sol.n1))}`, w - 10, y1 / 2); g.fillText(`n = ${txt(f(sol.nf))}${sol.t !== null ? `, t = ${txt(f(sol.t))} nm` : ''}`, w - 10, (y1 + y2) / 2); g.fillText(`n₂ = ${txt(f(sol.n2))}`, w - 10, (y2 + h) / 2);
    const dx = 70, xa = x0 + dx, xb2 = xa + dx * 0.7, xc = xb2 + dx * 0.7;
    const rayo = (pts, c, fase0) => {
      g.strokeStyle = c; g.lineWidth = 2.2; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
      let acc = 0; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay); for (let s = ((fase0 + avance - acc) % 16 + 16) % 16; s < L; s += 16) { const x = ax + ((bx - ax) * s) / L, y = ay + ((by - ay) * s) / L; g.fillStyle = c; g.beginPath(); g.arc(x, y, 2.2, 0, 2 * Math.PI); g.fill(); } acc += L; }
    };
    rayo([[x0 - dx * 0.2, 10], [xa, y1]], rgb(nm), 0);
    rayo([[xa, y1], [xa + dx * 1.2, 10]], rgb(nm, 0.9), 0);
    rayo([[xa, y1], [xb2, y2], [xc, y1], [xc + dx * 1.2, 10]], rgb(nm, 0.7), sol.medio ? 8 : 0);
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('1', xa + dx * 1.2 + 4, 8); g.fillText('2', xc + dx * 1.2 + 4, 8);
    const [r, gg, b] = visto(); g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(w * 0.62, 14, 46, 46); g.strokeStyle = col['--line']; g.strokeRect(w * 0.62, 14, 46, 46);
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('reflektierte Farbe', w * 0.62 + 54, 37);
  }
  let cache = null;
  function imagen(g, w, h) {
    const nm = sol.l0, lado = Math.min(h - 16, w * 0.5), x0 = w - lado - 20, y0 = (h - lado) / 2;
    if (!cache || cache.sol !== sol || cache.lado !== lado) {
      const c = document.createElement('canvas'), N = Math.max(60, Math.round(lado)), k = c.getContext('2d');
      c.width = c.height = N;
      const im = k.createImageData(N, N), [r, gg, b] = IF.color(nm), Y0 = sol.ancho;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const x = ((i + 0.5) / N - 0.5) * Y0, y = ((j + 0.5) / N - 0.5) * Y0, rr = Math.hypot(x, y);
        let v;
        if (sol.modo === 'anillos') v = sol.I(rr);
        else { const ang = (q) => Math.atan(q / (sol.L ?? 1)); v = sol.s2 === null ? sol.Iuno(rr) : Math.min(1, sol.Iuno((sol.L ?? 1) * Math.tan(Math.hypot(ang(x) - sol.s2, ang(y)))) + sol.Iuno((sol.L ?? 1) * Math.tan(Math.hypot(ang(x) + sol.s2, ang(y))))); v = v ** 0.3; }
        const p = 4 * (j * N + i); im.data[p] = r * v; im.data[p + 1] = gg * v; im.data[p + 2] = b * v; im.data[p + 3] = 255;
      }
      k.putImageData(im, 0, 0); cache = { sol, lado, c };
    }
    g.drawImage(cache.c, x0, y0, lado, lado);
    g.strokeStyle = col['--line']; g.strokeRect(x0, y0, lado, lado);
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'middle';
    if (sol.modo === 'circular') {
      const cx = w * 0.18, cy = h / 2, R = Math.min(h * 0.32, 60);
      g.fillStyle = col['--ink']; g.fillRect(cx - R - 14, cy - R - 14, 2 * R + 28, 2 * R + 28);
      g.fillStyle = col['--bg']; g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.fill();
      g.fillStyle = col['--muted']; g.textAlign = 'center'; g.fillText(`D = ${txt(f(sol.D * 1e3))} mm`, cx, cy + R + 26);
      g.textAlign = 'left'; g.fillText(sol.res === null ? 'Bild eines Punktes' : sol.res ? 'sind unterscheidbar' : 'sind nicht unterscheidbar', x0 - 6 - 110, y0 + 10);
    } else {
      const xa = 20, xb = x0 - 30, yv = h * 0.62, cx = (xa + xb) / 2, an = (xb - xa) / 2;
      g.fillStyle = col['--line']; g.fillRect(xa, yv, xb - xa, 16);
      g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xa, yv - 40); for (let x = xa; x <= xb; x += 2) { const u = (x - cx) / an; g.lineTo(x, yv - 1 - 28 * u * u); } g.lineTo(xb, yv - 40); g.closePath(); g.stroke();
      g.fillStyle = col['--muted']; g.textAlign = 'center'; g.fillText(`R = ${txt(f(sol.R))} m`, cx, yv - 52); g.fillText('ebenes Glas', cx, yv + 30);
    }
  }
  function cunaVista(g, w, h) {
    const nm = sol.l0, xa = 20, xb = w - 20, ya = h * 0.38, alto = 26, Lx = xb - xa, X = (x) => xa + (x / sol.ancho) * Lx;
    g.fillStyle = col['--line']; g.fillRect(xa, ya, Lx, 8);
    g.save(); g.translate(xa, ya); g.rotate(-0.08); g.fillRect(0, -8, Lx + 4, 8); g.restore();
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.font = `12px ${FU}`;
    g.fillText(`Berührpunkt · ${sol.ancho < sol.Lc ? `erste ${txt(f(sol.ancho * 100, 2))} cm von ${txt(f(sol.Lc * 100))}` : `L = ${txt(f(sol.Lc * 100))} cm`} · h = ${txt(f(sol.h * 1e6))} µm am Ende`, xa, ya + 14);
    const yf = h * 0.6;
    for (let x = xa; x < xb; x++) { g.fillStyle = rgb(nm, sol.I(((x - xa) / Lx) * sol.ancho)); g.fillRect(x, yf, 1.5, alto * 1.6); }
    g.strokeStyle = col['--muted']; g.strokeRect(xa, yf, Lx, alto * 1.6);
    g.textBaseline = 'top'; g.fillText(`Δx = ${txt(f(sol.dx * 1e3))} mm`, X(0), yf + alto * 1.6 + 6);
  }
  function visto() {
    if (sol.t === null) return IF.color(sol.l0);
    let s = [0, 0, 0], n = 0;
    for (let l = 400; l <= 700; l += 5) { const c = IF.color(l), R = sol.R(l); s = s.map((v, i) => v + c[i] * R); n++; }
    const m = Math.max(...s) || 1; return s.map((v) => Math.round((255 * v) / m * Math.min(1, (2.2 * m) / (n * 255))));
  }
  function patron() {
    const { g, w, h } = lienzo('#patron');
    if (!sol) return;
    const mL = 40, mR = 14, mT = 14, mB = 52;
    g.font = `11px ${FU}`;
    if (sol.modo === 'lamina') {
      if (sol.t === null) { g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Gib eine Dicke t an, um zu sehen, welche Farben reflektiert werden.', w / 2, h / 2); return; }
      const X = (l) => mL + ((l - 380) / 370) * (w - mL - mR), Y = (r) => mT + (1 - r) * (h - mT - mB);
      for (let l = 380; l < 750; l++) { g.fillStyle = rgb(l, 0.35); g.fillRect(X(l), mT, X(l + 1) - X(l) + 0.5, h - mT - mB); }
      g.strokeStyle = col['--ink']; g.lineWidth = 2.2; g.beginPath(); for (let l = 380; l <= 750; l++) { const x = X(l), y = Y(sol.R(l)); l === 380 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top'; for (let l = 400; l <= 700; l += 50) g.fillText(`${l} nm`, X(l), h - mB + 4);
      g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('max', mL - 4, Y(1)); g.fillText('0', mL - 4, Y(0));
      g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('Relative Reflexion jeder Wellenlänge', mL, h - mB + 22);
      return;
    }
    if (sol.modo === 'red') {
      const X = (s) => mL + ((s + 1) / 2) * (w - mL - mR);
      g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(mL, h - mB); g.lineTo(w - mR, h - mB); g.stroke();
      const lineas = (lam, c, alto) => { for (let m = -sol.mmax - 1; m <= sol.mmax + 1; m++) { const s = (m * lam) / sol.d; if (Math.abs(s) > 1) continue; g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.moveTo(X(s), h - mB); g.lineTo(X(s), mT + alto); g.stroke(); } };
      lineas(sol.lam, rgb(sol.l0), 0); if (sol.l2 !== null) lineas(sol.l2 * 1e-9, rgb(sol.l2, 0.8), 20);
      g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
      for (let m = -sol.mmax; m <= sol.mmax; m++) g.fillText(`${m}`, X((m * sol.lam) / sol.d), h - mB + 4);
      for (const s of [-0.5, 0, 0.5]) g.fillText(`sin θ = ${txt(f(s))}`, X(s), h - mB + 22);
      return;
    }
    const Y0 = sol.modo === 'rendija' ? sol.anchoV : sol.ancho, o = sol.desde0 ? 0 : 0.5, X = (y) => mL + ((y / Y0) + o) * (w - mL - mR), deX = (x) => ((x - mL) / (w - mL - mR) - o) * Y0, Yc = (i) => mT + (1 - i) * (h - mT - mB - 22);
    for (let x = mL; x < w - mR; x++) { g.fillStyle = rgb(sol.l0, sol.I(deX(x))); g.fillRect(x, h - mB - 18, 1.5, 16); }
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(mL, Yc(0)); g.lineTo(w - mR, Yc(0)); g.stroke();
    if (sol.modo === 'circular' && sol.s2 !== null) { g.strokeStyle = col['--muted']; g.lineWidth = 1; g.setLineDash([4, 4]); for (const sg of [1, -1]) { g.beginPath(); for (let x = mL; x <= w - mR; x++) { const q = sol.L ?? 1, v = Yc(sol.Iuno(q * Math.tan(Math.atan(deX(x) / q) + sg * sol.s2))); x === mL ? g.moveTo(x, v) : g.lineTo(x, v); } g.stroke(); } g.setLineDash([]); }
    g.strokeStyle = col['--accent']; g.lineWidth = 2.2; g.beginPath(); for (let x = mL; x <= w - mR; x++) { const v = Yc(sol.I(deX(x))); x === mL ? g.moveTo(x, v) : g.lineTo(x, v); } g.stroke();
    const p0 = (Y0 * 1e3) / 8, e = 10 ** Math.floor(Math.log10(p0)), st = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0);
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top';
    for (let v = Math.ceil((-Y0 * 1e3 * o) / st) * st; v <= Y0 * 1e3 * (1 - o) + 1e-9; v += st) g.fillText(txt(f(Math.abs(v) < st * 1e-6 ? 0 : v)), X(v / 1e3), h - mB + 4);
    g.textAlign = 'right'; g.fillText(sol.eje || 'y (mm)', w - mR, h - mB + 22);
    g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('I', mL - 8, Yc(1)); g.fillText('0', mL - 8, Yc(0));
    const marca = (yv, c) => { if (yv === null || Math.abs(yv) > Y0 / 2) return; g.fillStyle = c; g.beginPath(); g.arc(X(yv), Yc(sol.I(yv)), 5, 0, 2 * Math.PI); g.fill(); };
    if (sol.ym !== null) marca(sol.ym, col['--ink']); if (sol.y !== null) marca(sol.y * 1e-3, col['--accent']);
    if (cursorX !== null && cursorX >= mL && cursorX <= w - mR) {
      const y = deX(cursorX), I = sol.I(y), ex = (sol.eje || 'y (mm)').split(' ')[0];
      g.strokeStyle = col['--ink']; g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(cursorX, mT); g.lineTo(cursorX, h - mB); g.stroke(); g.setLineDash([]);
      g.fillStyle = col['--ink']; g.beginPath(); g.arc(cursorX, Yc(I), 4, 0, 2 * Math.PI); g.fill();
      g.font = `600 12px ${FU}`; g.textBaseline = 'top'; g.textAlign = cursorX > w / 2 ? 'right' : 'left';
      const t = `${ex} = ${txt(f(y * 1e3, 3))} · I/I₀ = ${txt(f(I, 3))}`, an = g.measureText(t).width, xt = cursorX + (cursorX > w / 2 ? -8 - an : 8);
      g.fillStyle = col['--panel']; g.fillRect(xt - 4, mT - 2, an + 8, 18); g.fillStyle = col['--ink']; g.textAlign = 'left'; g.fillText(t, xt, mT);
    }
  }
  let cursorX = null;
  const lienzoP = $('#patron');
  lienzoP.addEventListener('pointermove', (e) => { cursorX = e.clientX - lienzoP.getBoundingClientRect().left; patron(); });
  lienzoP.addEventListener('pointerleave', () => { cursorX = null; patron(); });

  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Weiter'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; montaje(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('interferencia').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.InterferenciaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, dy: sol.dy, ym: sol.ym, mmax: sol.mmax, thR: sol.thR, dx: sol.dx, ro: sol.ro }, cursor: (x) => { cursorX = x; patron(); }, estado: () => copia(sc) };
})();

