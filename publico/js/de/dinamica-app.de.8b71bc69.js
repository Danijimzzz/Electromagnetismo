(() => {
  const { $, esc, copia, txt } = Herramienta;
  const D = Dinamica, f = D.f, CLAVE = 'dinamica-v1';
  const TIPOS = { plano: 'Block auf einer Ebene', dos: 'Zwei Blöcke zusammen', atwood: 'Atwoodsche Fallmaschine', circular: 'Kreisbewegung', muelle: 'Federn (Hookesches Gesetz)' };
  const CASOS = { peralte: 'Kurve (mit oder ohne Überhöhung)', conico: 'Kegelpendel', loma: 'Kuppe oder Gefällewechsel', hondonada: 'Senke' };

  let sc = copia(D.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && TIPOS[g.tipo]) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const elige = (k, nom, ops) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${Object.entries(ops).map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const NOTAS = {
    plano: 'θ = 0 ist eine horizontale Ebene. Die Kraft zieht hangaufwärts (negatives α neigt sie zur Ebene hin). Die Anfangsgeschwindigkeit ist hangaufwärts positiv. Gibst du die gemessene Beschleunigung an, wird μ<sub>d</sub> berechnet. Lass leer, was es nicht gibt.',
    dos: 'Block 1 liegt vorn. Beim Schieben wirkt die Kraft auf 2, der 1 schiebt; mit Seil zieht sie an 1, der 2 mitzieht.',
    atwood: 'Die Rolle wird als Scheibe angenommen (I = ½mR²). Lass sie leer, wenn sie keine Masse hat.',
    circular: { peralte: 'β = 0 ist eine ebene Kurve. Lass die Geschwindigkeit leer, um nur die Grenzgeschwindigkeiten zu sehen.', conico: 'Gib den Winkel zur Senkrechten oder die Winkelgeschwindigkeit an.', loma: '', hondonada: '' },
    muelle: 'θ = 90° ist eine hängende Masse. Mit einer zweiten Feder wird die Ersatzkonstante in Reihen- oder Parallelschaltung berechnet.',
  };
  function formulario() {
    let h = elige('tipo', 'Aufgabe', TIPOS);
    if (sc.tipo === 'atwood') h += fila('m1', 'Masse 1 (links)', 'kg') + fila('m2', 'Masse 2 (rechts)', 'kg') + fila('mp', 'Masse der Rolle', 'kg') + sep('Weitere') + fila('d', 'Zurückgelegte Strecke', 'm');
    else if (sc.tipo === 'dos') {
      h += elige('union', 'Verbindung', { contacto: 'In Kontakt (schieben)', cuerda: 'Mit einem Seil (ziehen)' }) + sep('Blöcke und Ebene') + fila('m1', 'Masse von Block 1 (vorn)', 'kg') + fila('m2', 'Masse von Block 2 (hinten)', 'kg') + fila('theta', 'Winkel der Ebene θ', '°');
      h += fila('mus', 'Haftreibung μ<sub>e</sub>', '') + fila('muk1', 'Gleitreibung μ<sub>1</sub>', '') + fila('muk2', 'Gleitreibung μ<sub>2</sub>', '') + sep('Kraft') + fila('F', 'Kraft parallel zur Ebene', 'N') + sep('Weitere') + fila('d', 'Zurückgelegte Strecke', 'm');
    } else if (sc.tipo === 'circular') {
      h += elige('caso', 'Situation', CASOS) + fila('m', 'Masse', 'kg');
      if (sc.caso === 'conico') h += fila('L', 'Länge des Fadens', 'm') + fila('ang', 'Winkel zur Senkrechten θ', '°') + fila('w', 'Oder Winkelgeschwindigkeit ω', 'rad/s');
      else if (sc.caso === 'peralte') h += fila('R', 'Radius der Kurve', 'm') + fila('beta', 'Überhöhungswinkel β', '°') + fila('mus', 'Haftreibung μ<sub>e</sub>', '') + fila('v', 'Geschwindigkeit', 'm/s');
      else h += fila('R', 'Krümmungsradius', 'm') + fila('v', 'Geschwindigkeit', 'm/s');
    } else if (sc.tipo === 'muelle') {
      h += sep('Federn') + fila('k', 'Konstante k<sub>1</sub>', 'N/m') + fila('k2', 'Zweite Feder k<sub>2</sub>', 'N/m') + elige('asoc', 'Geschaltet in', { serie: 'Reihenschaltung', paralelo: 'Parallelschaltung' });
      h += sep('Körper') + fila('m', 'Masse', 'kg') + fila('theta', 'Winkel der Ebene θ', '°') + fila('mus', 'Haftreibung μ<sub>e</sub>', '') + sep('Hookesches Gesetz') + fila('x', 'Dehnung x', 'm');
    } else {
      h += sep('Block und Ebene') + fila('m1', 'Masse des Blocks', 'kg') + fila('theta', 'Winkel der Ebene θ', '°') + fila('mus', 'Haftreibung μ<sub>e</sub>', '') + fila('muk', 'Gleitreibung μ<sub>d</sub>', '');
      h += sep('Angreifende Kraft') + fila('F', 'Betrag F', 'N') + fila('alfa', 'Winkel zur Ebene α', '°');
      h += sep('Rolle') + fila('m2', 'Hängende Masse', 'kg');
      h += sep('Bewegung') + fila('v0', 'Anfangsgeschwindigkeit', 'm/s') + fila('amed', 'Gemessene Beschleunigung', 'm/s²') + fila('d', 'Zurückgelegte Strecke', 'm');
    }
    h += fila('g', 'Erdbeschleunigung g', 'm/s²');
    $('#campos').innerHTML = h;
    const n = NOTAS[sc.tipo];
    $('#nota').innerHTML = typeof n === 'string' ? n : n[sc.caso] || '';
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'tipo' || t.dataset.k === 'caso') {
      const ej = D.ejemplos.find((x) => x.sc.tipo === sc.tipo && (t.dataset.k === 'tipo' || x.sc.caso === t.value || (t.value === 'hondonada' && x.sc.caso === 'loma')));
      sc = { ...copia(ej.sc), g: sc.g || ej.sc.g }; if (t.dataset.k === 'caso') sc.caso = t.value;
    }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Beispiele…</option>' + Object.entries(TIPOS).map(([k, t]) => `<optgroup label="${t}">${D.ejemplos.filter((e) => e.sc.tipo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = D.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const tipos = [
      () => ({ tipo: 'plano', g: '9,8', m1: String(ent(2, 20)), theta: String(de([0, 0, 15, 20, 25, 30, 37])), mus: c(de([0.3, 0.4, 0.5])), muk: c(de([0.1, 0.15, 0.2, 0.25])), F: String(de([0, 20, 40, 60, 80, 100])), alfa: String(de([0, 0, 20, 30])), m2: '', v0: '', amed: '', d: String(ent(1, 5)) }),
      () => ({ tipo: 'plano', g: '9,8', m1: String(ent(1, 10)), theta: String(de([0, 20, 30])), mus: c(de([0.3, 0.4])), muk: c(de([0.1, 0.2, 0.25])), F: '', alfa: '', m2: '', v0: String(ent(2, 10)), amed: '', d: '' }),
      () => ({ tipo: 'plano', g: '9,8', m1: String(ent(2, 8)), theta: String(de([0, 30, 37])), mus: c(de([0.2, 0.3])), muk: c(de([0.1, 0.15, 0.2])), F: '', alfa: '', m2: String(ent(2, 8)), v0: '', amed: '', d: String(ent(1, 3)) }),
      () => ({ tipo: 'dos', union: de(['contacto', 'cuerda']), g: '9,8', m1: String(ent(1, 6)), m2: String(ent(1, 6)), theta: String(de([0, 0, 20, 30])), mus: '0,4', muk1: c(de([0.1, 0.2, 0.3])), muk2: c(de([0.1, 0.2, 0.3])), F: String(de([50, 60, 80, 100])), d: '' }),
      () => ({ tipo: 'atwood', g: '9,8', m1: String(ent(1, 6)), m2: String(ent(2, 9)), mp: Math.random() < 0.5 ? '' : String(ent(1, 4)), d: String(ent(1, 3)) }),
      () => ({ tipo: 'circular', caso: 'peralte', g: '9,8', m: String(de([800, 1000, 1200, 1500])), R: String(de([40, 50, 80, 100, 150])), beta: String(de([0, 10, 15, 20])), mus: c(de([0.3, 0.5, 0.7])), v: String(ent(10, 30)), L: '', ang: '', w: '' }),
      () => ({ tipo: 'circular', caso: 'conico', g: '9,8', m: c(de([0.2, 0.5, 1])), L: c(de([0.5, 1, 1.2, 1.5])), ang: String(de([20, 30, 40, 45, 60])), w: '', R: '', v: '' }),
      () => ({ tipo: 'circular', caso: de(['loma', 'hondonada']), g: '9,8', m: String(de([70, 900, 1200])), R: String(de([20, 30, 40, 50])), v: String(ent(8, 20)) }),
      () => ({ tipo: 'muelle', g: '9,8', k: String(de([100, 200, 250, 400])), k2: Math.random() < 0.5 ? '' : String(de([100, 300])), asoc: de(['serie', 'paralelo']), m: c(de([0.2, 0.5, 1, 2])), theta: String(de([90, 90, 30])), mus: '', x: '' }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const e = esc, g = `(g = ${e(sc.g)} m/s²)`;
    if (sc.tipo === 'atwood') return `An einer Atwoodschen Fallmaschine hängen ${e(sc.m1)} kg und ${e(sc.m2)} kg an einer${sc.mp ? ` massiven Rolle von ${e(sc.mp)} kg` : ' idealen Rolle'} ${g}. Berechne die Beschleunigung, ${sc.mp ? 'die Seilkräfte' : 'die Seilkraft'} und die Geschwindigkeit, wenn jede Masse ${e(sc.d)} m zurückgelegt hat.`;
    if (sc.tipo === 'dos') return `Zwei Blöcke von ${e(sc.m1)} kg (vorn) und ${e(sc.m2)} kg ${sc.union === 'cuerda' ? 'durch ein Seil verbunden' : 'in Kontakt'} befinden sich auf einer ${+sc.theta ? `um ${e(sc.theta)}° geneigten` : 'horizontalen'} Ebene, mit den Reibungskoeffizienten ${e(sc.muk1)} und ${e(sc.muk2)}. Eine Kraft von ${e(sc.F)} N parallel zur Ebene ${sc.union === 'cuerda' ? 'zieht am ersten' : 'schiebt den zweiten'} ${+sc.theta ? 'nach oben' : ''} ${g}. Berechne die Beschleunigung und ${sc.union === 'cuerda' ? 'die Seilkraft' : 'die Kraft zwischen den Blöcken'}.`;
    if (sc.tipo === 'circular') {
      if (sc.caso === 'peralte') return `Ein Auto von ${e(sc.m)} kg durchfährt mit ${e(sc.v)} m/s eine Kurve mit ${e(sc.R)} m Radius ${+sc.beta ? `und ${e(sc.beta)}° Überhöhung` : 'ohne Überhöhung'}; der Haftreibungskoeffizient beträgt ${e(sc.mus)} ${g}. Berechne ${+sc.beta ? 'die Geschwindigkeit, bei der keine Reibung nötig ist, ' : ''}die Höchstgeschwindigkeit, die Normalkraft und die benötigte Reibung.`;
      if (sc.caso === 'conico') return `Eine Kugel von ${e(sc.m)} kg, an einem Faden von ${e(sc.L)} m Länge aufgehängt, kreist als Kegelpendel, wobei der Faden ${e(sc.ang)}° von der Senkrechten abweicht ${g}. Berechne die Seilkraft, die Geschwindigkeit, die Winkelgeschwindigkeit und die Periode.`;
      return `Ein Fahrzeug von ${e(sc.m)} kg fährt mit ${e(sc.v)} m/s über ${sc.caso === 'loma' ? 'die Spitze einer Kuppe' : 'den tiefsten Punkt einer Senke'} mit ${e(sc.R)} m Radius ${g}. Berechne die Normalkraft${sc.caso === 'loma' ? ' und die Geschwindigkeit, bei der es abheben würde' : ''}.`;
    }
    if (sc.tipo === 'muelle') return `${sc.k2 ? `Zwei Federn mit ${e(sc.k)} N/m und ${e(sc.k2)} N/m, als ${sc.asoc} verbunden, tragen` : `Eine Feder mit ${e(sc.k)} N/m trägt`} eine Masse von ${e(sc.m)} kg, ${+sc.theta >= 90 ? 'aufgehängt' : `auf einer um ${e(sc.theta)}° geneigten reibungsfreien Ebene`} ${g}. Berechne ${sc.k2 ? 'die Ersatzkonstante, ' : ''}die Dehnung im Gleichgewicht und die Schwingungsdauer.`;
    const plano = +sc.theta ? `einer um ${e(sc.theta)}° geneigten Ebene` : 'einer horizontalen Fläche';
    if (sc.m2) return `Ein Block von ${e(sc.m1)} kg auf ${plano} (μ<sub>e</sub> = ${e(sc.mus)}, μ<sub>d</sub> = ${e(sc.muk)}) ist durch ein Seil über eine Rolle mit einer hängenden Masse von ${e(sc.m2)} kg verbunden ${g}. Berechne die Beschleunigung, die Seilkraft und die Geschwindigkeit nach ${e(sc.d)} m Weg.`;
    if (sc.v0) return `Ein Block von ${e(sc.m1)} kg wird ${+sc.theta ? 'nach oben ' : ''}auf ${plano} mit ${e(sc.v0)} m/s angestoßen (μ<sub>e</sub> = ${e(sc.mus)}, μ<sub>d</sub> = ${e(sc.muk)}) ${g}. Welche Strecke legt er bis zum Stillstand zurück, und wie lange braucht er? Bleibt er liegen, oder ${+sc.theta ? 'rutscht er wieder hinunter' : 'bewegt er sich weiter'}?`;
    return `Ein Block von ${e(sc.m1)} kg liegt auf ${plano} (μ<sub>e</sub> = ${e(sc.mus)}, μ<sub>d</sub> = ${e(sc.muk)})${+sc.F ? ` und wird mit ${e(sc.F)} N unter ${e(sc.alfa || 0)}° zur Ebene gezogen` : ''} ${g}. Bewegt er sich? Berechne die Normalkraft, die Reibung, die Beschleunigung und die Geschwindigkeit nach ${e(sc.d)} m Weg.`;
  };

  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  const kmh = (v) => `${f(v)} m/s (${f(v * 3.6)} km/h)`;
  function calcula() {
    const err = $('#error');
    try { sol = D.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').innerHTML = ''; t0 = null; dibuja(); return; }
    err.hidden = true; guarda(); t0 = null;
    let h = '', ley = 'Die Pfeile sind proportional zur jeweiligen Kraft: <b style="color:var(--peso)">Gewichtskraft</b>, <b style="color:var(--normal)">Normalkraft</b>, <b style="color:var(--roz)">Reibung</b>, <b style="color:var(--fuerza)">angreifende Kraft</b> und <b style="color:var(--tension)">Seilkraft</b>. Der gestrichelte Pfeil ist die Beschleunigung.';
    if (sol.tipo === 'atwood') {
      h = dato('Beschleunigung', `a = <b>${f(sol.a)} m/s<sup>2</sup></b>`) + dato(sol.mp ? 'Seilkräfte' : 'Seilkraft', sol.mp ? `T<sub>1</sub> = ${f(sol.T1)} N, T<sub>2</sub> = ${f(sol.T2)} N` : `T = <b>${f(sol.T1)} N</b>`);
    } else if (sol.tipo === 'dos') {
      h = dato('Was passiert', `<b>${sol.estado === 'reposo' ? 'In Ruhe' : 'Sie bewegen sich gemeinsam'}</b>`) + dato('Beschleunigung', `a = <b>${f(sol.a)} m/s<sup>2</sup></b>`);
      if (sol.Fi !== null) h += dato(sol.cuerda ? 'Seilkraft' : 'Kraft zwischen den Blöcken', `${sol.cuerda ? 'T' : 'F<sub>12</sub>'} = <b>${f(sol.Fi)} N</b>`);
      ley = 'Kräfte längs der Ebene: <b style="color:var(--fuerza)">angreifende Kraft</b> und <b style="color:var(--tension)">Kraft zwischen den Blöcken</b>. Der gestrichelte Pfeil ist die Beschleunigung.';
    } else if (sol.tipo === 'circular') {
      if (sol.caso === 'peralte') {
        if (sol.beta) h += dato('Ohne Reibung', `v = ${kmh(sol.videal)}`);
        h += dato('Höchstgeschwindigkeit', `v<sub>max</sub> = <b>${isFinite(sol.vmax) ? kmh(sol.vmax) : '∞'}</b>`);
        if (sol.vmin > 0) h += dato('Mindestgeschwindigkeit', `v<sub>min</sub> = ${kmh(sol.vmin)}`);
        if (sol.v !== null) h += dato('Normalkraft', `N = ${f(sol.N)} N`) + dato('Benötigte Reibung', `F<sub>r</sub> = ${f(sol.fr)} N`) + dato('Was passiert', `<b>${sol.derrapa ? (sol.fr > 0 ? 'Schleudert nach außen' : 'Rutscht nach innen') : 'Schafft die Kurve'}</b>`);
      } else if (sol.caso === 'conico') h = dato('Seilkraft', `T = <b>${f(sol.T)} N</b>`) + dato('Geschwindigkeit', `v = <b>${f(sol.v)} m/s</b>`) + dato('Winkelgeschwindigkeit', `ω = ${f(sol.w)} rad/s`) + dato('Periode', `<b>${f(sol.periodo)} s</b>`) + dato('Radius', `r = ${f(sol.R)} m`);
      else h = dato('Normalkraft', `N = <b>${f(sol.N)} N</b>`) + dato('Scheinbares Gewicht', `${f(sol.N / (sol.m * sol.g))}-fache Gewichtskraft`) + (sol.caso === 'loma' ? dato('Hebt ab ab', `v = ${kmh(sol.vmax)}`) : '');
      ley = 'Kräfte auf den Körper: <b style="color:var(--peso)">Gewichtskraft</b>, <b style="color:var(--normal)">Normalkraft</b>, <b style="color:var(--roz)">Reibung</b> und <b style="color:var(--tension)">Seilkraft</b>. Der gestrichelte Pfeil zeigt zum Mittelpunkt der Kurve.';
    } else if (sol.tipo === 'muelle') {
      if (sol.k2) h += dato('Ersatzkonstante', `k = <b>${f(sol.k)} N/m</b>`);
      if (sol.Fx !== undefined) h += dato('Federkraft', `F = ${f(sol.Fx)} N`);
      if (sol.m) h += dato('Dehnung im Gleichgewicht', `x = <b>${f(sol.x0)} m</b>`) + (sol.mu && sol.th < 90 ? dato('Bleibt in Ruhe zwischen', `${f(sol.xmin)} y ${f(sol.xmax)} m`) : '') + dato('Schwingungsdauer', `T = <b>${f(sol.periodo)} s</b>`);
      ley = 'Der Körper schwingt um das Gleichgewicht (ohne Reibung). Pfeile: <b style="color:var(--peso)">Gewichtskraft</b>, <b style="color:var(--normal)">Normalkraft</b> und <b style="color:var(--tension)">Federkraft</b> im Gleichgewicht.';
    } else {
      const arr = sol.th > 0 ? 'hangaufwärts' : 'nach rechts', aba = sol.th > 0 ? 'hangabwärts' : 'nach links';
      const mov = sol.estado === 'reposo' ? (sol.v0 ? 'Bremst ab und bleibt stehen' : 'In Ruhe') : sol.v0 && isFinite(sol.fase1.t) ? `Bremst ab und bewegt sich wieder ${sol.sentido > 0 ? arr : aba}` : `Gleitet ${sol.sentido > 0 ? arr : aba}`;
      h = dato('Was passiert', `<b>${mov}</b>`);
      if (sol.v0 && sol.fase1) h += dato('Beim Abbremsen', isFinite(sol.fase1.t) ? `a = ${f(Math.abs(sol.fase1.a))} m/s<sup>2</sup>, bleibt nach ${f(sol.fase1.t)} s und ${f(Math.abs(sol.fase1.x))} m stehen` : `a = ${f(sol.fase1.a)} m/s<sup>2</sup>`);
      h += dato(sol.v0 ? 'Danach' : 'Beschleunigung', `a = <b>${f(Math.abs(sol.a))} m/s<sup>2</sup></b>`) + dato('Normalkraft', `N = ${f(sol.N)} N`) + dato('Reibung', `F<sub>r</sub> = ${f(Math.abs(sol.Fr))} N${sol.estado === 'reposo' ? ' (Haftreibung)' : ''}`);
      if (sol.amed !== null) h += dato('Gleitreibungskoeffizient', `μ<sub>d</sub> = <b>${f(sol.muk)}</b>`);
      if (sol.m2) h += dato('Seilkraft', `T = <b>${f(sol.T)} N</b>`);
      if (sol.Fmin) h += dato('Mindestkraft zum Hinaufschieben', `${f(sol.Fmin.F)} N (mit α = ${f(sol.al)}°); ${f(sol.Fmin.Fopt)} N mit α = ${f(sol.Fmin.alfaOpt)}°`);
    }
    if (sol.cin) h += dato(`Nach ${f(sol.d)} m Weg`, `v = ${f(sol.cin.v)} m/s, t = ${f(sol.cin.t)} s`);
    $('#res').innerHTML = h;
    $('#leyenda').innerHTML = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--fuerza', '--tension', '--cuerpo', '--suelo']) col[k] = cs.getPropertyValue(k).trim(); }
  const COLOR = { P: '--peso', P2: '--peso', N: '--normal', Fr: '--roz', F: '--fuerza', T: '--tension', T1: '--tension', T2: '--tension', Fi: '--tension', ac: '--ink' };
  function flecha(g, x0, y0, x1, y1, color, ancho = 2.5, punteada = false) {
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 2) return;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = ancho; g.setLineDash(punteada ? [5, 4] : []);
    const a = Math.atan2(y1 - y0, x1 - x0), p = Math.min(11, L * 0.45);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - p * 0.6 * Math.cos(a), y1 - p * 0.6 * Math.sin(a)); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - p * Math.cos(a - 0.4), y1 - p * Math.sin(a - 0.4)); g.lineTo(x1 - p * Math.cos(a + 0.4), y1 - p * Math.sin(a + 0.4)); g.closePath(); g.fill();
  }
  function etiqueta(g, x, y, t, color) {
    g.font = '600 12.5px "IBM Plex Sans", system-ui, sans-serif';
    const w = g.measureText(t).width;
    g.fillStyle = col['--bg']; g.globalAlpha = 0.85; g.fillRect(x - w / 2 - 2, y - 8, w + 4, 16); g.globalAlpha = 1;
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y);
  }
  function fuerza(g, x, y, dx, dy, k, nombre, alInicio = false) {
    flecha(g, x, y, x + dx, y + dy, col[COLOR[k] || '--ink'], k === 'ac' ? 1.5 : 2.5, k === 'ac');
    const L = Math.hypot(dx, dy) || 1;
    if (nombre) etiqueta(g, alInicio ? x - (dx / L) * 13 : x + dx + (dx / L) * 13, alInicio ? y - (dy / L) * 13 : y + dy + (dy / L) * 13, nombre, col[COLOR[k] || '--ink']);
  }
  function cuerpo(g, cx, cy, s, ang, texto, esquina = false) {
    g.save(); g.translate(cx, cy); g.rotate(-ang);
    g.fillStyle = col['--cuerpo']; g.strokeStyle = col['--muted']; g.lineWidth = 1.2;
    g.fillRect(-s / 2, -s / 2, s, s); g.strokeRect(-s / 2, -s / 2, s, s);
    g.fillStyle = col['--ink']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif';
    if (esquina) { g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(texto, -s / 2 + 4, -s / 2 + 3); }
    else { g.rotate(ang); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, 0, 0); }
    g.restore();
  }
  function texto(g, x, y, t, al = 'left') { g.fillStyle = col['--muted']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  function lienzo() {
    const r = Herramienta.lienzo('#escena');
    r.g.lineCap = 'round'; r.g.lineJoin = 'round';
    return r;
  }

  let t0 = null, tAnim = 0, parado = false;
  function guion() {
    if (!sol || !sol.mov) return null;
    let dur;
    if (sol.cin) dur = sol.cin.t;
    else if (sol.tipo === 'plano' && sol.estado === 'reposo') dur = sol.v0 ? sol.tf + 0.8 : 1;
    else dur = sol.tipo === 'plano' && sol.v0 && isFinite(sol.fase1.t) ? sol.tf * 2 + 1 : 2.5;
    dur = Math.min(Math.max(dur, 0.8), 8);
    let xm = 1e-9; for (let i = 0; i <= 60; i++) xm = Math.max(xm, Math.abs(sol.mov((dur * i) / 60).x));
    return { dur, xm };
  }
  function bucle(ts) {
    if (!parado && sol) {
      if (t0 === null) t0 = ts;
      const gi = guion();
      if (gi) { const ciclo = gi.dur + 0.7; tAnim = Math.min(((ts - t0) / 1000) % ciclo, gi.dur); }
      else if (sol.tipo === 'circular' || sol.tipo === 'muelle') tAnim = (ts - (t0 ?? ts)) / 1000;
      dibuja();
    }
    requestAnimationFrame(bucle);
  }
  $('#play').addEventListener('click', () => { parado = !parado; $('#play').textContent = parado ? '▶ Weiter' : '⏸ Pause'; });

  function dibujaPlano(g, w, h) {
    const t = sol.th * Math.PI / 180, m = 20, pol = !!sol.m2;
    const s = Math.max(44, Math.min(68, w / 9)), r = 11;
    const anchoMax = (pol ? w * 0.7 : w - 2 * m) - m, altoMax = h - 2 * m - 30;
    const L = Math.min(anchoMax / Math.max(Math.cos(t), 1e-6), t > 1e-6 ? altoMax / Math.sin(t) : Infinity);
    const horiz = t < 1e-6, suelo = h - m, y0 = horiz ? h * (pol ? 0.46 : 0.6) : suelo;
    const x0 = m, xe = x0 + L * Math.cos(t), ye = y0 - L * Math.sin(t);
    const ux = [Math.cos(t), -Math.sin(t)], uy = [-Math.sin(t), -Math.cos(t)];
    g.fillStyle = col['--line']; g.strokeStyle = col['--suelo']; g.lineWidth = 1.5;
    if (!horiz) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(xe, ye); g.lineTo(xe, y0); g.closePath(); g.fill(); g.stroke(); }
    else if (pol) { g.fillRect(x0, y0, xe - x0, 8); g.strokeRect(x0, y0, xe - x0, 8); g.beginPath(); g.moveTo(x0 + 14, y0 + 8); g.lineTo(x0 + 14, suelo); g.moveTo(xe - 14, y0 + 8); g.lineTo(xe - 14, suelo); g.stroke(); }
    else { g.beginPath(); g.moveTo(0, y0); g.lineTo(w, y0); g.stroke(); }
    g.beginPath(); g.moveTo(0, suelo); g.lineTo(w, suelo); if (!horiz || pol) g.stroke();
    if (t > 1e-6) { g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.arc(x0, y0, 34, -t, 0); g.stroke(); texto(g, x0 + 40, y0 - 12, `θ = ${txt(f(sol.th))}°`); }
    const gi = guion(), esc_ = gi ? (L * 0.3) / gi.xm : 0, mv = sol.mov(tAnim), desp = Math.max(-L * 0.42, Math.min(L * 0.42, mv.x * esc_));
    const xb = x0 + (L * 0.5 + desp) * ux[0] + (s / 2) * uy[0], yb = y0 + (L * 0.5 + desp) * ux[1] + (s / 2) * uy[1];
    const fz = sol.v0 && tAnim > sol.tf && isFinite(sol.fase1.t) ? sol.fuerzasFin : sol.v0 ? sol.fuerzas : sol.fuerzasFin;
    const mods = fz.map((q) => q.mod).concat(sol.m2 ? [sol.m2 * sol.g] : []), k = (Math.min(h, w) * 0.26) / Math.max(...mods, 1e-9);
    const pant = (fx, fy) => [k * (fx * ux[0] + fy * uy[0]), k * (fx * ux[1] + fy * uy[1])];
    let xh, yh;
    if (pol) {
      const cxp = xe + (s / 2 - r) * uy[0], cyp = ye + (s / 2 - r) * uy[1];
      g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(xe, ye); g.lineTo(cxp, cyp); g.stroke();
      g.strokeStyle = col['--ink']; g.lineWidth = 1.2;
      const tx = cxp + r * uy[0], ty = cyp + r * uy[1];
      g.beginPath(); g.moveTo(xb + (s / 2) * ux[0], yb + (s / 2) * ux[1]); g.lineTo(tx, ty); g.stroke();
      xh = cxp + r; yh = Math.min(suelo - s / 2 - 6, cyp + Math.max(70, (suelo - cyp) * 0.5) - desp);
      g.beginPath(); g.moveTo(xh, cyp); g.lineTo(xh, yh - s / 2); g.stroke();
      g.beginPath(); g.arc(cxp, cyp, r, 0, 2 * Math.PI); g.fillStyle = col['--cuerpo']; g.fill(); g.strokeStyle = col['--muted']; g.stroke();
      cuerpo(g, xh, yh, s * 0.85, 0, 'm₂', true);
    }
    cuerpo(g, xb, yb, s, t, 'm₁', true);
    for (const q of fz) {
      const [dx, dy] = pant(q.x, q.y);
      let ox = xb, oy = yb;
      if (q.k === 'Fr') { ox = xb - (s / 2) * uy[0]; oy = yb - (s / 2) * uy[1]; }
      fuerza(g, ox, oy, dx, dy, q.k, q.k);
    }
    const Tn = fz.find((q) => q.k === 'T');
    if (pol) { fuerza(g, xh, yh, 0, k * sol.m2 * sol.g, 'P2', 'P₂'); if (Tn) fuerza(g, xh, yh - s * 0.42, 0, -k * Tn.mod, 'T', 'T'); }
    const ac = sol.v0 && tAnim < sol.tf ? sol.fase1.a : sol.a;
    if (Math.abs(ac) > 1e-9) {
      const la = 46 * Math.sign(ac), d0 = la / 2 + 6 * Math.sign(la), ax = xb + (s * 0.9) * uy[0] + d0 * ux[0], ay = yb + (s * 0.9) * uy[1] + d0 * ux[1];
      flecha(g, ax - (la / 2) * ux[0], ay - (la / 2) * ux[1], ax + (la / 2) * ux[0], ay + (la / 2) * ux[1], col['--ink'], 1.5, true);
      etiqueta(g, ax + (la / 2 + 12 * Math.sign(la)) * ux[0], ay + (la / 2 + 12 * Math.sign(la)) * ux[1], 'a', col['--ink']);
    }
    texto(g, w - 10, 14, `t = ${txt(f(tAnim, 3))} s · v = ${txt(f(Math.abs(mv.v), 3))} m/s`, 'right');
  }

  function dibujaDos(g, w, h) {
    const t = sol.th * Math.PI / 180, m = 20, s1 = Math.max(40, Math.min(60, w / 10)), s2 = s1 * 0.9;
    const L = Math.min((w - 2 * m) / Math.cos(t), t > 1e-6 ? (h - 2 * m - 30) / Math.sin(t) : Infinity), y0 = t < 1e-6 ? h * 0.62 : h - m;
    const ux = [Math.cos(t), -Math.sin(t)], uy = [-Math.sin(t), -Math.cos(t)];
    g.fillStyle = col['--line']; g.strokeStyle = col['--suelo']; g.lineWidth = 1.5;
    if (t > 1e-6) { g.beginPath(); g.moveTo(m, y0); g.lineTo(m + L * ux[0], y0 + L * ux[1]); g.lineTo(m + L * ux[0], y0); g.closePath(); g.fill(); g.stroke(); texto(g, m + 40, y0 - 12, `θ = ${txt(f(sol.th))}°`); }
    else { g.beginPath(); g.moveTo(0, y0); g.lineTo(w, y0); g.stroke(); }
    const gi = guion(), desp = gi ? Math.min(L * 0.3, (sol.mov(tAnim).x * L * 0.3) / gi.xm) : 0, gap = sol.cuerda ? 40 : 0;
    const pos = (u, s) => [m + u * ux[0] + (s / 2) * uy[0], y0 + u * ux[1] + (s / 2) * uy[1]];
    const u2 = L * 0.22 + desp, u1 = u2 + s2 / 2 + gap + s1 / 2;
    const [x2, y2] = pos(u2, s2), [x1, y1] = pos(u1, s1);
    if (sol.cuerda) { g.strokeStyle = col['--ink']; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x2 + (s2 / 2) * ux[0], y2 + (s2 / 2) * ux[1]); g.lineTo(x1 - (s1 / 2) * ux[0], y1 - (s1 / 2) * ux[1]); g.stroke(); }
    cuerpo(g, x1, y1, s1, t, 'm₁', true); cuerpo(g, x2, y2, s2, t, 'm₂', true);
    const k = (Math.min(w, h) * 0.22) / Math.max(sol.F, Math.abs(sol.Fi || 0), 1e-9);
    if (sol.F) { if (sol.cuerda) fuerza(g, x1 + (s1 / 2) * ux[0], y1 + (s1 / 2) * ux[1], k * sol.F * ux[0], k * sol.F * ux[1], 'F', 'F'); else fuerza(g, x2 - (s2 / 2 + k * sol.F) * ux[0], y2 - (s2 / 2 + k * sol.F) * ux[1], k * sol.F * ux[0], k * sol.F * ux[1], 'F', 'F', true); }
    if (sol.Fi > 0) {
      const v = k * sol.Fi;
      if (sol.cuerda) { fuerza(g, x2 + (s2 / 2) * ux[0] + 4 * uy[0], y2 + (s2 / 2) * ux[1] + 4 * uy[1], v * ux[0], v * ux[1], 'Fi', 'T'); }
      else {
        const cx = x1 - (s1 / 2) * ux[0], cy = y1 - (s1 / 2) * ux[1], vv = Math.min(v, s1 * 0.8);
        fuerza(g, cx + uy[0] * s2 * 0.25, cy + uy[1] * s2 * 0.25, vv * ux[0], vv * ux[1], 'Fi', 'F₂₁');
        fuerza(g, cx - uy[0] * s2 * 0.25, cy - uy[1] * s2 * 0.25, -vv * ux[0], -vv * ux[1], 'Fi', 'F₁₂');
      }
    }
    if (Math.abs(sol.a) > 1e-9) { const ax = x1 + s1 * 0.95 * uy[0], ay = y1 + s1 * 0.95 * uy[1], la = 46 * Math.sign(sol.a); fuerza(g, ax - la / 2 * ux[0], ay - la / 2 * ux[1], la * ux[0], la * ux[1], 'ac', 'a'); }
  }

  function dibujaAtwood(g, w, h) {
    const cx = w / 2, cy = 34, R = Math.max(18, Math.min(30, w / 18)), s = Math.max(34, Math.min(52, w / 12));
    const gi = guion(), desp = gi ? (sol.mov(tAnim).x * h * 0.18) / gi.xm : 0;
    const y1 = h * 0.5 + (sol.m1 >= sol.m2 ? 20 : -20) - desp, y2 = h * 0.5 + (sol.m2 > sol.m1 ? 20 : -20) + desp;
    g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 60, 6); g.lineTo(cx + 60, 6); g.moveTo(cx, 6); g.lineTo(cx, cy); g.stroke();
    g.strokeStyle = col['--ink']; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - R, y1 - s / 2); g.moveTo(cx + R, cy); g.lineTo(cx + R, y2 - s / 2); g.stroke();
    g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.fillStyle = col['--cuerpo']; g.fill(); g.strokeStyle = col['--muted']; g.stroke();
    const giro = desp / R; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R * Math.cos(giro), cy + R * Math.sin(giro)); g.stroke();
    if (sol.mp) texto(g, cx + R + 8, cy, `mp = ${txt(f(sol.mp))} kg`);
    cuerpo(g, cx - R, y1, s, 0, 'm₁'); cuerpo(g, cx + R, y2, s, 0, 'm₂');
    const k = (h * 0.26) / Math.max(sol.m1 * sol.g, sol.m2 * sol.g, sol.T1, sol.T2);
    const ox = s * 0.85;
    fuerza(g, cx - R - ox, y1, 0, k * sol.m1 * sol.g, 'P', 'P₁'); fuerza(g, cx - R - ox, y1, 0, -k * sol.T1, 'T', 'T₁');
    fuerza(g, cx + R + ox, y2, 0, k * sol.m2 * sol.g, 'P', 'P₂'); fuerza(g, cx + R + ox, y2, 0, -k * sol.T2, 'T', 'T₂');
    if (Math.abs(sol.a) > 1e-9) {
      const la = 40 * Math.sign(sol.a);
      flecha(g, cx - R - s, y1 + la / 2, cx - R - s, y1 - la / 2, col['--ink'], 1.5, true);
      flecha(g, cx + R + s, y2 - la / 2, cx + R + s, y2 + la / 2, col['--ink'], 1.5, true);
    }
  }

  function dibujaCircular(g, w, h) {
    const P = sol.m * sol.g;
    if (sol.caso === 'peralte') {
      const b = sol.beta * Math.PI / 180, cx = w * 0.55, cy = h * 0.62, Lr = Math.min(w * 0.6, 300), s = 48;
      const ux = [Math.cos(b), -Math.sin(b)], uy = [-Math.sin(b), -Math.cos(b)];
      g.fillStyle = col['--line']; g.strokeStyle = col['--suelo']; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(cx - Lr / 2 * ux[0], cy - Lr / 2 * ux[1]); g.lineTo(cx + Lr / 2 * ux[0], cy + Lr / 2 * ux[1]); g.lineTo(cx + Lr / 2 * ux[0], h - 10); g.lineTo(cx - Lr / 2 * ux[0], h - 10); g.closePath(); g.fill(); g.stroke();
      const xb = cx + (s / 2) * uy[0], yb = cy + (s / 2) * uy[1];
      cuerpo(g, xb, yb, s, b, 'coche', true);
      const fr = sol.v !== null ? sol.fr : 0, N = sol.v !== null ? sol.N : P / Math.cos(b), k = (Math.min(w, h) * 0.24) / Math.max(P, N, Math.abs(fr), 1e-9);
      fuerza(g, xb, yb, 0, k * P, 'P', 'P');
      fuerza(g, xb, yb, k * N * uy[0], k * N * uy[1], 'N', 'N');
      if (Math.abs(fr) > 1e-9) { const ox = xb - (s / 2) * uy[0], oy = yb - (s / 2) * uy[1]; fuerza(g, ox, oy, -k * fr * ux[0], -k * fr * ux[1], 'Fr', 'Fr'); }
      fuerza(g, xb - s * 0.9, yb - s * 0.9, -56, 0, 'ac', 'zum Mittelpunkt');
      if (sol.beta) texto(g, cx + Lr / 2 * ux[0] - 70, cy + Lr / 2 * ux[1] + 22, `β = ${txt(f(sol.beta))}°`);
      texto(g, 12, 16, `R = ${txt(f(sol.R))} m${sol.v !== null ? ` · v = ${txt(f(sol.v))} m/s` : ''}`);
    } else if (sol.caso === 'conico') {
      const th = sol.ang * Math.PI / 180, top = 30, Lp = Math.min(h - 80, w * 0.6) / Math.max(Math.cos(th) + 0.25, 0.6), cx = w / 2;
      const rr = Lp * Math.sin(th), yc = top + Lp * Math.cos(th), fase = (tAnim * sol.w) % (2 * Math.PI);
      const bx = cx + rr * Math.cos(fase), by = yc + rr * 0.28 * Math.sin(fase);
      g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 50, top); g.lineTo(cx + 50, top); g.stroke();
      g.strokeStyle = col['--line']; g.lineWidth = 1; g.setLineDash([4, 4]); g.beginPath(); g.ellipse(cx, yc, rr, rr * 0.28, 0, 0, 2 * Math.PI); g.stroke(); g.beginPath(); g.moveTo(cx, top); g.lineTo(cx, yc); g.stroke(); g.setLineDash([]);
      g.strokeStyle = col['--ink']; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, top); g.lineTo(bx, by); g.stroke();
      g.beginPath(); g.arc(bx, by, 12, 0, 2 * Math.PI); g.fillStyle = col['--cuerpo']; g.fill(); g.strokeStyle = col['--muted']; g.stroke();
      const k = (h * 0.22) / sol.T, dx = cx - bx, dy = top - by, Ld = Math.hypot(dx, dy);
      fuerza(g, bx, by, 0, k * P, 'P', 'P'); fuerza(g, bx, by, (k * sol.T * dx) / Ld, (k * sol.T * dy) / Ld, 'T', 'T');
      const dc = Math.hypot(cx - bx, yc - by) || 1; if (dc > 4) fuerza(g, bx, by, ((cx - bx) / dc) * 40, ((yc - by) / dc) * 40, 'ac', '');
      texto(g, cx + 8, top + 30, `θ = ${txt(f(sol.ang))}°`);
    } else {
      const loma = sol.caso === 'loma', cx = w / 2, Rp = Math.min(w * 0.7, h * 1.4), cy = loma ? h * 0.42 + Rp : h * 0.62 - Rp, s = 40, sg = loma ? 1 : -1;
      const ang = Math.asin(Math.min(0.95, (w * 0.48) / Rp));
      g.strokeStyle = col['--suelo']; g.lineWidth = 2; g.beginPath();
      if (loma) g.arc(cx, cy, Rp, -Math.PI / 2 - ang, -Math.PI / 2 + ang); else g.arc(cx, cy, Rp, Math.PI / 2 - ang, Math.PI / 2 + ang);
      g.stroke();
      const phi = (((tAnim * 0.25) % 1) * 2 - 1) * ang * 0.9;
      const px = cx + Rp * Math.sin(phi), py = cy - sg * Rp * Math.cos(phi), nx = loma ? Math.sin(phi) : -Math.sin(phi), ny = -Math.cos(phi);
      const bx = px + nx * (s / 2), by = py + ny * (s / 2);
      cuerpo(g, bx, by, s, loma ? phi : -phi, 'coche', true);
      const k = (h * 0.24) / Math.max(P, Math.abs(sol.N));
      fuerza(g, bx, by, 0, k * P, 'P', 'P');
      if (sol.N > 0) fuerza(g, bx, by, nx * k * sol.N, ny * k * sol.N, 'N', 'N');
      fuerza(g, bx + 30, by, (cx - bx) / Math.hypot(cx - bx, cy - by) * 40, (cy - by) / Math.hypot(cx - bx, cy - by) * 40, 'ac', '');
      texto(g, 12, 16, `R = ${txt(f(sol.R))} m · v = ${txt(f(sol.v))} m/s · ${loma ? 'der Mittelpunkt liegt unten' : 'der Mittelpunkt liegt oben'}`);
    }
  }

  function dibujaMuelle(g, w, h) {
    if (!sol.m) { texto(g, w / 2, h / 2, 'Gib die Masse an, um die Feder mit dem Körper zu sehen.', 'center'); return; }
    const t = sol.th * Math.PI / 180, colg = sol.th >= 90 - 1e-9, s = 46;
    const A = Math.max(sol.x0 * 0.4, 0.03), x = sol.x0 + A * Math.sin(Math.min(sol.w, 6) * tAnim);
    const esc_ = Math.min(h * 0.45, w * 0.4) / Math.max(sol.x0 + A + 0.05, 0.1), L0 = 60;
    let ax, ay, ux, uy;
    if (colg) { ax = w / 2; ay = 16; ux = [0, 1]; uy = [1, 0]; g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(ax - 50, ay); g.lineTo(ax + 50, ay); g.stroke(); }
    else {
      const m = 20, L = Math.min((w - 2 * m) / Math.cos(t), (h - 2 * m - 20) / Math.max(Math.sin(t), 1e-6)), y0 = h - m;
      const xe = m + L * Math.cos(t), ye = y0 - L * Math.sin(t);
      g.fillStyle = col['--line']; g.strokeStyle = col['--suelo']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(m, y0); g.lineTo(xe, ye); g.lineTo(xe, y0); g.closePath(); g.fill(); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(xe, ye); g.lineTo(xe, ye - 40); g.stroke();
      ux = [-Math.cos(t), Math.sin(t)]; uy = [-Math.sin(t), -Math.cos(t)];
      ax = xe + (s / 2) * uy[0]; ay = ye + (s / 2) * uy[1];
      texto(g, m + 40, y0 - 12, `θ = ${txt(f(sol.th))}°`);
    }
    const Lm = L0 + x * esc_, n = 12;
    g.strokeStyle = col['--tension']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(ax, ay);
    for (let i = 1; i < n; i++) { const u = (Lm * i) / n, lado = (i % 2 ? 1 : -1) * 8; g.lineTo(ax + u * ux[0] + lado * uy[0], ay + u * ux[1] + lado * uy[1]); }
    g.lineTo(ax + Lm * ux[0], ay + Lm * ux[1]); g.stroke();
    const bx = ax + (Lm + s / 2) * ux[0], by = ay + (Lm + s / 2) * ux[1];
    cuerpo(g, bx, by, s, colg ? 0 : t, 'm', true);
    const P = sol.m * sol.g, k = (Math.min(w, h) * 0.2) / P;
    fuerza(g, bx, by, 0, k * P, 'P', 'P');
    if (!colg) fuerza(g, bx, by, k * P * Math.cos(t) * uy[0], k * P * Math.cos(t) * uy[1], 'N', 'N');
    const Fm = sol.k * x; fuerza(g, bx, by, -k * Fm * ux[0], -k * Fm * ux[1], 'T', 'kx');
    texto(g, 10, h - 12, `x = ${txt(f(x, 3))} m (equilibrio ${txt(f(sol.x0, 3))} m) · T = ${txt(f(sol.periodo, 3))} s`);
  }

  function dibuja() {
    const { g, w, h } = lienzo();
    if (!sol) return;
    colores();
    if (sol.tipo === 'atwood') dibujaAtwood(g, w, h);
    else if (sol.tipo === 'dos') dibujaDos(g, w, h);
    else if (sol.tipo === 'circular') dibujaCircular(g, w, h);
    else if (sol.tipo === 'muelle') dibujaMuelle(g, w, h);
    else dibujaPlano(g, w, h);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('dinamica').current;
  formulario(); calcula(); requestAnimationFrame(bucle);
  Constantes.monta(document.querySelector('.layout .card'));
  window.DinamicaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { tipo: sol.tipo, a: sol.a, N: sol.N, T: sol.T ?? sol.T1, estado: sol.estado, Fi: sol.Fi, v: sol.v }, estado: () => copia(sc) };
})();

