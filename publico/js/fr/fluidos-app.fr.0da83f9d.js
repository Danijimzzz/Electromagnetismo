(() => {
  const { $, esc, copia, txt } = Herramienta;
  const F = Fluidos, f = F.f, CLAVE = 'fluidos-v1';
  const MODOS = [['presion', 'Pression à une profondeur'], ['tuboU', 'Tube en U avec deux liquides'], ['prensa', 'Presse hydraulique (Pascal)'], ['empuje', 'Poussée (Archimède)'], ['bernoulli', 'Conduite : continuité et Bernoulli'], ['torricelli', 'Jet d’un réservoir (Torricelli)'], ['viscosidad', 'Viscosité (Poiseuille et Stokes)'], ['medidor', 'Tube de Pitot et débitmètre de Venturi'], ['pared', 'Force sur une paroi ou une vanne'], ['capilar', 'Capillarité (loi de Jurin)']];

  let sc = copia(F.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, lista)}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const NOTAS = {
    presion: 'Si tu laisses vide la pression à la surface, on prend l’atmosphérique, 101 325 Pa. Mets 0 s’il y a du vide au-dessus, comme dans un baromètre. L’aire est facultative : avec elle, on obtient la force sur le fond.',
    tuboU: 'Le liquide du fond est le plus dense (eau, mercure). Les hauteurs se mesurent depuis la surface de séparation des deux liquides.',
    prensa: 'Les diamètres des pistons sont en centimètres, comme la course.',
    empuje: 'Masses volumiques : eau 1000 kg/m³, eau de mer 1025 kg/m³. Le volume est en m³ : on accepte 2e-3 ou 2·10^-3.',
    bernoulli: 'Les diamètres sont en centimètres et le débit en litres par seconde. La pression peut être absolue ou manométrique : p₂ sort du même type.',
    viscosidad: 'Viscosité de l’eau 10⁻³ Pa·s, du sang environ 4·10⁻³ Pa·s, de la glycérine 1,5 Pa·s. Dans Poiseuille, le diamètre intérieur est en mm et le débit en mL/s ; dans Stokes, le rayon de la sphère en mm.',
    medidor: 'La dénivellation du manomètre est en cm. Dans le Venturi, laisse vide la masse volumique du manomètre s’il s’agit de deux tubes verticaux ouverts avec le même fluide.',
    pared: 'Pour un barrage ou la paroi d’un réservoir, laisse vide la profondeur du bord supérieur : la paroi est mouillée depuis la surface. Pour une vanne immergée, indique à quelle profondeur elle commence.',
    capilar: 'Tension superficielle de l’eau 0,073 N/m (angle 0°), du mercure 0,49 N/m (environ 140°). Le rayon du tube est en mm.',
    torricelli: 'H est la hauteur du liquide au-dessus du trou. Le reste est facultatif : avec la hauteur du trou, on obtient la portée, avec son diamètre le débit et avec celui du réservoir le temps de vidange.',
  };
  function formulario() {
    let h = elige('modo', 'Que calculer', MODOS);
    const gr = sep('Facultatif') + fila('g', 'Gravité', 'm/s²');
    if (sc.modo === 'presion') {
      h += fila('rho', 'Masse volumique du liquide', 'kg/m³') + fila('h', 'Profondeur', 'm') + sep('Facultatif') + fila('p0', 'Pression à la surface', 'Pa') + fila('A', 'Aire du fond', 'm²') + fila('g', 'Gravité', 'm/s²');
    } else if (sc.modo === 'tuboU') {
      h += elige('buscar', 'Que cherches-tu', [['altura', 'La hauteur de l’autre côté'], ['densidad', 'La masse volumique du liquide ajouté']]);
      h += fila('rho1', 'Masse volumique du liquide du fond ρ₁', 'kg/m³') + (sc.buscar === 'densidad' ? fila('h1', 'Hauteur du liquide du fond h₁', 'm') : fila('rho2', 'Masse volumique du liquide ajouté ρ₂', 'kg/m³')) + fila('h2', 'Colonne du liquide ajouté h₂', 'm');
    } else if (sc.modo === 'prensa') {
      h += elige('datos', 'Données', [['fuerza', 'Je connais la force sur le petit piston'], ['masa', 'Je connais la masse à soulever']]);
      h += (sc.datos === 'masa' ? fila('m', 'Masse soulevée', 'kg') : fila('F1', 'Force sur le petit piston F₁', 'N')) + fila('d1', 'Diamètre du petit piston', 'cm') + fila('d2', 'Diamètre du grand piston', 'cm') + sep('Facultatif') + fila('x1', 'Course du petit piston', 'cm') + fila('g', 'Gravité', 'm/s²');
    } else if (sc.modo === 'empuje') {
      h += elige('datos', 'Données', [['cuerpo', 'Je connais le corps : flotte-t-il ou coule-t-il ?'], ['pesadas', 'Je le pèse dans l’air et dans le fluide']]);
      h += (sc.datos === 'pesadas' ? fila('P', 'Poids dans l’air', 'N') + fila('Pa', 'Poids dans le fluide', 'N') : fila('rhoC', 'Masse volumique du corps', 'kg/m³') + fila('V', 'Volume du corps', 'm³')) + fila('rhoF', 'Masse volumique du fluide', 'kg/m³') + gr;
    } else if (sc.modo === 'bernoulli') {
      h += elige('datos', 'Données', [['v1', 'Je connais la vitesse en 1'], ['Q', 'Je connais le débit']]);
      h += fila('rho', 'Masse volumique du fluide', 'kg/m³') + fila('d1', 'Diamètre en 1', 'cm') + fila('d2', 'Diamètre en 2', 'cm') + (sc.datos === 'Q' ? fila('Q', 'Débit', 'L/s') : fila('v1', 'Vitesse en 1', 'm/s')) + fila('p1', 'Pression en 1', 'Pa') + sep('Facultatif') + fila('h1', 'Hauteur de 1', 'm') + fila('h2', 'Hauteur de 2', 'm') + fila('g', 'Gravité', 'm/s²');
    } else if (sc.modo === 'viscosidad') {
      h += elige('tipo', 'Cas', [['poiseuille', 'Un fluide dans un tube (Poiseuille)'], ['stokes', 'Une sphère qui tombe (Stokes)']]);
      if (sc.tipo === 'stokes') h += elige('datos', 'Que cherches-tu', [['eta', 'La vitesse limite'], ['v', 'La viscosité (je mesure la vitesse)']]) + fila('r', 'Rayon de la sphère', 'mm') + fila('rhoE', 'Masse volumique de la sphère', 'kg/m³') + fila('rhoF', 'Masse volumique du fluide', 'kg/m³') + (sc.datos === 'v' ? fila('v', 'Vitesse limite mesurée', 'm/s') : fila('eta', 'Viscosité η', 'Pa·s')) + gr;
      else h += elige('datos', 'Que cherches-tu', [['dp', 'Le débit'], ['Q', 'La différence de pression']]) + fila('eta', 'Viscosité η', 'Pa·s') + fila('L', 'Longueur du tube', 'm') + fila('d', 'Diamètre intérieur', 'mm') + (sc.datos === 'Q' ? fila('Q', 'Débit', 'mL/s') : fila('dp', 'Différence de pression Δp', 'Pa')) + sep('Facultatif') + fila('rho', 'Masse volumique (pour le nombre de Reynolds)', 'kg/m³');
    } else if (sc.modo === 'medidor') {
      h += elige('tipo', 'Appareil', [['pitot', 'Tube de Pitot'], ['venturi', 'Débitmètre de Venturi']]) + fila('rhoF', 'Masse volumique du fluide mesuré', 'kg/m³') + fila('dh', 'Dénivellation dans le manomètre Δh', 'cm');
      h += sc.tipo === 'venturi' ? fila('d1', 'Diamètre de la conduite', 'cm') + fila('d2', 'Diamètre de l’étranglement', 'cm') + sep('Facultatif') + fila('rhoM', 'Masse volumique du liquide du manomètre', 'kg/m³') + fila('g', 'Gravité', 'm/s²') : fila('rhoM', 'Masse volumique du liquide du manomètre', 'kg/m³') + gr;
    } else if (sc.modo === 'pared') {
      h += fila('rho', 'Masse volumique du liquide', 'kg/m³') + fila('b', 'Largeur de la paroi ou de la vanne', 'm') + fila('hc', 'Hauteur mouillée (ou de la vanne)', 'm') + sep('Facultatif') + fila('h0', 'Profondeur du bord supérieur', 'm') + fila('g', 'Gravité', 'm/s²');
    } else if (sc.modo === 'capilar') {
      h += fila('gamma', 'Tension superficielle γ', 'N/m') + fila('r', 'Rayon du tube', 'mm') + fila('rho', 'Masse volumique du liquide', 'kg/m³') + sep('Facultatif') + fila('theta', 'Angle de contact θ', '°') + fila('g', 'Gravité', 'm/s²');
    } else {
      h += fila('H', 'Hauteur du liquide au-dessus du trou H', 'm') + sep('Facultatif') + fila('y', 'Hauteur du trou au-dessus du sol', 'm') + fila('d', 'Diamètre du trou', 'cm') + fila('D', 'Diamètre du réservoir', 'm') + fila('g', 'Gravité', 'm/s²');
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
    if (t.dataset.k === 'modo') sc = copia(F.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else { const ej = F.ejemplos.find((x) => x.sc.modo === sc.modo && x.sc[t.dataset.k] === t.value); if (ej) for (const [k, v] of Object.entries(ej.sc)) if (vacioC(sc[k])) sc[k] = v; }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Exemples…</option>' + F.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = F.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave;
  }

  const dato = (t, v) => `<div><span>${t}</span><b>${v}</b></div>`;
  function calcula() {
    const err = $('#error');
    try { sol = F.resolver(sc); } catch (e) {
      sol = null; err.textContent = e.message; err.hidden = false;
      $('#resumen').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = '';
      tA = 0; dibuja(); return;
    }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'presion') {
      h = dato('Pression manométrique', `p<sub>man</sub> = ${f(sol.pm)} Pa`) + dato('Pression absolue', `p = ${f(sol.pa)} Pa`) + dato('En atmosphères', `p = ${f(sol.pa / F.ATM)} atm`) + (sol.A ? dato('Force sur le fond', `F = ${f(sol.F)} N`) : '');
      ley = 'Les flèches représentent la pression sur la sonde : à une même profondeur, elle pousse également dans toutes les directions.';
    } else if (sol.modo === 'tuboU') {
      h = (sol.buscar === 'densidad' ? dato('Masse volumique du liquide ajouté', `ρ₂ = ${f(sol.rho2)} kg/m³`) : dato('Hauteur de l’autre côté', `h₁ = ${f(sol.h1)} m`)) + dato('Dénivelé entre les surfaces', `Δh = ${f(sol.dh)} m`);
      ley = 'Quand on verse le liquide le moins dense dans une branche, l’autre monte dans la branche opposée. Sur la ligne pointillée, la pression est la même des deux côtés.';
    } else if (sol.modo === 'prensa') {
      h = (sol.datos === 'masa' ? dato('Force nécessaire', `F₁ = ${f(sol.F1)} N`) : dato('Force sur le grand piston', `F₂ = ${f(sol.F2)} N`)) + dato('Pression dans le liquide', `p = ${f(sol.pr)} Pa`) + dato('Multiplie la force par', `A₂/A₁ = ${f(sol.k)}`) + (sol.x1 ? dato('Le grand piston monte', `x₂ = ${f(sol.x2)} cm`) : '');
      ley = 'Quand le petit piston descend, le liquide pousse le grand avec la même pression et une force bien plus grande, mais le fait monter beaucoup moins.';
    } else if (sol.modo === 'empuje') {
      if (sol.datos === 'pesadas') {
        h = dato('Poussée', `E = ${f(sol.E)} N`) + dato('Volume', `V = ${f(sol.V)} m³`) + dato('Masse volumique du corps', `ρ = ${f(sol.rhoC)} kg/m³`);
        ley = 'Le dynamomètre indique moins à mesure que le corps entre dans le fluide : la différence est la poussée.';
      } else {
        h = dato('Poids', `P = ${f(sol.P)} N`) + dato('Poussée totalement immergé', `E = ${f(sol.Emax)} N`) + (sol.flota ? dato('Il flotte avec une partie immergée', `${f((100 * sol.rhoC) / sol.rhoF)} %`) + dato('Volume immergé', `V<sub>s</sub> = ${f(sol.Vs)} m³`) : sol.flota === false ? dato('Il coule avec un poids apparent', `P<sub>ap</sub> = ${f(sol.Pa)} N`) + dato('Accélération au lâcher', `a = ${f(sol.a)} m/s²`) : dato('Équilibre', 'ne monte ni ne descend'));
        ley = sol.flota ? 'En rouge le poids et en vert la poussée, qui augmente avec la partie immergée. Le corps oscille jusqu’à ce que les deux s’égalent.' : 'En rouge le poids et en vert la poussée. Le poids l’emporte et le corps va au fond.';
      }
    } else if (sol.modo === 'bernoulli') {
      h = dato('Vitesse en 2', `v₂ = ${f(sol.v2)} m/s`) + dato('Pression en 2', `p₂ = ${f(sol.p2)} Pa`) + dato('Débit', `Q = ${f(sol.Q * 1000)} L/s`) + (sol.datos === 'Q' ? dato('Vitesse en 1', `v₁ = ${f(sol.v1)} m/s`) : '');
      ley = 'Chaque point est une goutte de fluide : elle va plus vite là où le tuyau est étroit. La hauteur des tubes au-dessus indique la pression.';
    } else if (sol.modo === 'viscosidad') {
      if (sol.tipo === 'stokes') { h = (sol.datos === 'v' ? dato('Viscosité', `η = ${f(sol.eta)} Pa·s`) : dato('Vitesse limite', `v = ${f(sol.v)} m/s`)) + dato('Nombre de Reynolds', `Re = ${f(sol.Re)}`) + dato('Temps caractéristique', `τ = ${f(sol.tau)} s`); ley = 'La sphère accélère puis est freinée jusqu’à sa vitesse limite : en rouge le poids, en vert la poussée et en orange le frottement visqueux, qui augmente avec la vitesse.'; }
      else { h = (sol.datos === 'Q' ? dato('Différence de pression', `Δp = ${f(sol.dp)} Pa`) : dato('Débit', `Q = ${f(sol.Q * 1e6)} mL/s`)) + dato('Vitesse moyenne', `v̄ = ${f(sol.vm)} m/s`) + dato('Vitesse au centre', `v<sub>max</sub> = ${f(sol.vmax)} m/s`) + dato('Nombre de Reynolds', `Re = ${f(sol.Re)}`); ley = 'Profil parabolique : le fluide va plus vite au centre et est immobile contre la paroi. Les flèches représentent la vitesse de chaque couche.'; }
    } else if (sol.modo === 'medidor') {
      h = dato('Différence de pression', `Δp = ${f(sol.dp)} Pa`) + (sol.tipo === 'venturi' ? dato('Vitesse dans la conduite', `v₁ = ${f(sol.v1)} m/s`) + dato('Débit', `Q = ${f(sol.Q * 1000)} L/s`) : dato('Vitesse du fluide', `v = ${f(sol.v)} m/s = ${f(sol.v * 3.6)} km/h`));
      ley = sol.tipo === 'venturi' ? 'Dans l’étranglement, le fluide va plus vite et la pression baisse : le manomètre mesure cette différence et le débit en découle.' : 'L’ouverture du tube freine le fluide (pression totale) et la prise latérale mesure la pression statique : la dénivellation donne la vitesse.';
    } else if (sol.modo === 'pared') {
      h = dato('Force du liquide', `F = ${f(sol.F)} N`) + dato('Centre de poussée', `à ${f(sol.yc)} m de profondeur`) + dato('Moment au bord inférieur', `M = ${f(sol.M)} N·m`);
      ley = 'Les flèches représentent la pression, qui augmente avec la profondeur. La résultante s’exerce au centre de poussée, sous le centre de la paroi.';
    } else if (sol.modo === 'capilar') {
      h = dato(sol.h >= 0 ? 'Monte' : 'Descend', `h = ${f(Math.abs(sol.h) * 1000)} mm`) + dato('Pression sous le ménisque', `Δp = ${f(sol.dp)} Pa`);
      ley = sol.h >= 0 ? 'Le liquide mouille le tube, le ménisque est concave et la tension superficielle le fait monter.' : 'Le liquide ne mouille pas le tube, le ménisque est convexe et reste en dessous du niveau extérieur.';
    } else {
      h = dato('Vitesse de sortie', `v = ${f(sol.v)} m/s`) + (sol.x !== null ? dato('Portée', `x = ${f(sol.x)} m`) : '') + (sol.Q ? dato('Débit', `Q = ${f(sol.Q * 1000)} L/s`) : '') + (sol.tv ? dato('Temps de vidange', `t = ${f(sol.tv)} s`) : '');
      ley = 'Le jet sort à l’horizontale avec la vitesse de chute libre depuis la surface, puis tombe comme un tir horizontal.';
    }
    $('#resumen').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${Mates.html(p.t)}</strong>${Mates.html(p.html, true)}</li>`).join('');
    tA = 0; gotas = null; bernoulliPaso = null; dibuja();
  }

  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Reprendre'; });
  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--suelo', '--cuerpo', '--panel', '--agua', '--aceite']) col[k] = cs.getPropertyValue(k).trim(); }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  function flecha(g, x, y, dx, dy, color) {
    const l = Math.hypot(dx, dy); if (l < 4) return;
    const ux = dx / l, uy = dy / l;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx - ux * 6, y + dy - uy * 6); g.stroke();
    g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(x + dx - ux * 9 - uy * 4.5, y + dy - uy * 9 + ux * 4.5); g.lineTo(x + dx - ux * 9 + uy * 4.5, y + dy - uy * 9 - ux * 4.5); g.closePath(); g.fill();
  }
  const punto = (g, x, y, r, color) => { g.fillStyle = color; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); };
  function cota(g, x, y1, y2, t, color = col['--muted'], al = 'left') {
    if (Math.abs(y2 - y1) < 3) return;
    g.strokeStyle = color; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y1); g.lineTo(x, y2); g.moveTo(x - 4, y1); g.lineTo(x + 4, y1); g.moveTo(x - 4, y2); g.lineTo(x + 4, y2); g.stroke();
    texto(g, x + (al === 'left' ? 7 : -7), (y1 + y2) / 2, t, color, al);
  }
  function liquido(g, x1, x2, ySup, yFondo, color, t, ola = 2) {
    g.fillStyle = color; g.beginPath(); g.moveTo(x1, yFondo); g.lineTo(x1, ySup);
    for (let x = x1; x <= x2; x += 6) g.lineTo(x, ySup + ola * Math.sin(x / 18 + t * 2.4));
    g.lineTo(x2, ySup); g.lineTo(x2, yFondo); g.closePath(); g.fill();
  }
  const suave = (s) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, s)));
  let tA = 0, gotas = null;

  function dibuja() {
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    if (!col['--ink']) colores();
    const t = tA;
    if (sol.modo === 'presion') {
      const x1 = w * 0.12, x2 = Math.min(w * 0.62, x1 + 420), ySup = h * 0.16, yF = h - 22, prof = sol.A ? 1 : 0.72;
      const yp = ySup + prof * (yF - ySup) - (sol.A ? 12 : 0), xp = (x1 + x2) / 2;
      g.fillStyle = col['--suelo']; g.fillRect(x1 - 4, ySup - 14, 4, yF - ySup + 18); g.fillRect(x2, ySup - 14, 4, yF - ySup + 18); g.fillRect(x1 - 4, yF, x2 - x1 + 8, 4);
      liquido(g, x1, x2, ySup, yF, col['--agua'], t);
      for (let k = 0; k < 6; k++) { const s = ((t * 0.35 + k / 6) % 1), yb = yp - s * (yp - ySup); punto(g, xp + 14 + 6 * Math.sin(t * 3 + k), yb, 2.5 + 2 * s, col['--panel']); }
      const L = 12 + Math.min(1, sol.pa / (3 * F.ATM)) * 28;
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, cx = Math.cos(a), cy = Math.sin(a); flecha(g, xp + cx * (L + 9), yp + cy * (L + 9), -cx * L, -cy * L, col['--peso']); }
      punto(g, xp, yp, 7, col['--ink']);
      cota(g, x2 + 16, ySup, yp, `h = ${txt(f(sol.h))} m`);
      texto(g, x2 + 22, ySup - 10, sol.p0 ? `p₀ = ${txt(f(sol.p0))} Pa` : 'vide (p₀ = 0)', col['--muted'], 'left');
      texto(g, 14, 16, `p = ${txt(f(sol.pa))} Pa · manométrique ${txt(f(sol.pm))} Pa`, col['--ink'], 'left', '600 ');
      if (sol.A) texto(g, xp, yF - 30, `F = ${txt(f(sol.F))} N sur le fond`, col['--ink'], 'center', '600 ');
    } else if (sol.modo === 'tuboU') {
      const ciclo = 6, s = suave((t % ciclo) / 2.5);
      const ancho = 38, xa = w * 0.3, xb = Math.min(w * 0.62, xa + 260), yb = h - 36, yi0 = h * 0.62;
      const esc2 = (h * 0.48) / sol.h2, h2 = s * sol.h2 * esc2, h1 = s * sol.h1 * esc2;
      const ySep = yi0 + h1 / 2, yIzq = ySep - h1, yDer = ySep - h2, med = (xa + xb) / 2;
      const R = (xb - xa) / 2, tubo = () => { g.beginPath(); g.moveTo(xa, h * 0.06); g.lineTo(xa, yb - R); g.arc(med, yb - R, R, Math.PI, 0, true); g.lineTo(xb, h * 0.06); };
      const pinta = (yTop, yBot, x0, x1, color) => { g.save(); g.beginPath(); g.rect(x0, yTop, x1 - x0, yBot - yTop); g.clip(); tubo(); g.lineWidth = ancho; g.strokeStyle = color; g.stroke(); g.restore(); };
      g.lineCap = 'butt'; tubo(); g.strokeStyle = col['--suelo']; g.lineWidth = ancho + 8; g.stroke(); g.strokeStyle = col['--bg']; g.lineWidth = ancho; g.stroke();
      pinta(yIzq, h, 0, med + 1, col['--agua']); pinta(ySep, h, med, w, col['--agua']);
      if (h2 > 0.5) pinta(yDer, ySep, med, w, col['--aceite']);
      g.strokeStyle = col['--ink']; g.setLineDash([5, 5]); g.lineWidth = 1; g.beginPath(); g.moveTo(xa - ancho, ySep); g.lineTo(xb + ancho, ySep); g.stroke(); g.setLineDash([]);
      cota(g, xa - ancho / 2 - 12, ySep, yIzq, `h₁ = ${txt(f(s * sol.h1))} m`, col['--muted'], 'right');
      cota(g, xb + ancho / 2 + 12, ySep, yDer, `h₂ = ${txt(f(s * sol.h2))} m`);
      texto(g, xa, yb + 18, `ρ₁ = ${txt(f(sol.rho1))} kg/m³`, col['--muted']);
      texto(g, xb + ancho / 2 + 10, h * 0.06 + 10, `ρ₂ = ${txt(f(sol.rho2))} kg/m³`, col['--muted'], 'left');
      texto(g, 14, 16, `Δh = ${txt(f(s * sol.dh))} m`, col['--ink'], 'left', '600 ');
    } else if (sol.modo === 'prensa') {
      const ciclo = 4, s = suave(Math.abs(((t % ciclo) / ciclo) * 2 - 1) * 1.2 - 0.1);
      const yb = h - 30, wG = Math.min(w * 0.34, 260), wP = Math.max(10, (wG * sol.d1) / sol.d2), xP = w * 0.22, xG = w * 0.62;
      const baj = 70 * s, sube = baj / sol.k, y0P = h * 0.3, y0G = h * 0.48;
      const yP = y0P + baj, yG = y0G - sube;
      g.fillStyle = col['--agua'];
      g.fillRect(xP - wP / 2, yP, wP, yb - yP); g.fillRect(xG - wG / 2, yG, wG, yb - yG); g.fillRect(xP - wP / 2, yb - 26, xG - xP, 26);
      g.fillStyle = col['--suelo'];
      g.fillRect(xP - wP / 2 - 4, h * 0.14, 4, yb - h * 0.14 + 4); g.fillRect(xP + wP / 2, h * 0.14, 4, yb - 26 - h * 0.14); g.fillRect(xG - wG / 2 - 4, h * 0.3, 4, yb - 26 - h * 0.3); g.fillRect(xG + wG / 2, h * 0.3, 4, yb - h * 0.3 + 4);
      g.fillRect(xP - wP / 2 - 4, yb, xG + wG / 2 - xP + wP / 2 + 8, 4); g.fillRect(xP + wP / 2, yb - 30, xG - wG / 2 - xP - wP / 2, 4);
      g.fillStyle = col['--ink']; g.fillRect(xP - wP / 2, yP - 8, wP, 8); g.fillRect(xG - wG / 2, yG - 10, wG, 10);
      g.fillStyle = col['--cuerpo']; g.fillRect(xG - wG * 0.35, yG - 10 - 40, wG * 0.7, 40);
      texto(g, xG, yG - 30, sol.m ? `${txt(f(sol.m))} kg` : 'carga', col['--ink']);
      flecha(g, xP, yP - 60, 0, 48, col['--peso']); texto(g, xP + 10, yP - 66, `F₁ = ${txt(f(sol.F1))} N`, col['--peso'], 'left');
      flecha(g, xG + wG / 2 + 22, yG + 50, 0, -60, col['--normal']); texto(g, xG + wG / 2 + 30, yG + 20, `F₂ = ${txt(f(sol.F2))} N`, col['--normal'], 'left');
      texto(g, 14, 16, `p = ${txt(f(sol.pr))} Pa dans tout le liquide · A₂/A₁ = ${txt(f(sol.k))}`, col['--ink'], 'left', '600 ');
    } else if (sol.modo === 'empuje') {
      const x1 = w * 0.14, x2 = Math.min(w * 0.7, x1 + 460), ySup = h * 0.34, yF = h - 20, L = Math.min(76, (yF - ySup) * 0.4), xc = (x1 + x2) / 2;
      g.fillStyle = col['--suelo']; g.fillRect(x1 - 4, h * 0.2, 4, yF - h * 0.2 + 4); g.fillRect(x2, h * 0.2, 4, yF - h * 0.2 + 4); g.fillRect(x1 - 4, yF, x2 - x1 + 8, 4);
      liquido(g, x1, x2, ySup, yF, col['--agua'], t);
      const escF = 70 / Math.max(sol.P, sol.datos === 'pesadas' ? sol.P : sol.Emax);
      let yTop, sub;
      if (sol.datos === 'pesadas') {
        const ciclo = 7, s = suave((t % ciclo) / 3);
        yTop = ySup - L - 16 + s * (L + 40); sub = Math.max(0, Math.min(1, (yTop + L - ySup) / L));
        const lect = sol.P - sol.E * sub;
        g.strokeStyle = col['--muted']; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xc, 12); g.lineTo(xc, 30);
        for (let k = 0; k < 8; k++) g.lineTo(xc + (k % 2 ? 6 : -6), 30 + ((yTop - 50) * (k + 1)) / 9);
        g.lineTo(xc, yTop - 14); g.lineTo(xc, yTop); g.stroke();
        g.fillStyle = col['--panel']; g.strokeStyle = col['--line']; g.fillRect(xc + 14, 18, 116, 24); g.strokeRect(xc + 14, 18, 116, 24);
        texto(g, xc + 72, 30, `indique ${txt(f(lect))} N`, col['--ink'], 'center', '600 ');
        g.fillStyle = col['--roz']; g.fillRect(xc - L / 2, yTop, L, L);
        flecha(g, xc, yTop + L / 2, 0, sol.P * escF, col['--peso']);
        if (sub > 0) flecha(g, xc - L / 2 - 14, yTop + L, 0, -sol.E * sub * escF, col['--normal']);
        texto(g, 14, h - 34 < ySup ? 16 : 16, `P = ${txt(f(sol.P))} N · E = ${txt(f(sol.E * sub))} N`, col['--ink'], 'left', '600 ');
      } else {
        let sp;
        if (sol.flota) {
          const fr = sol.rhoC / sol.rhoF, tt = t % 8;
          sp = fr + (0 - fr) * Math.exp(-0.7 * tt) * Math.cos(3 * tt);
        } else if (sol.flota === null) sp = 1.6;
        else { const tt = t % 5, a = Math.min(1, sol.a / 9.8); sp = Math.min((yF - ySup) / L, 1 + 0.5 * a * 9 * tt * tt); }
        yTop = ySup - L + sp * L; sub = Math.max(0, Math.min(1, sp));
        g.fillStyle = col['--roz']; g.fillRect(xc - L / 2, yTop, L, L);
        flecha(g, xc + 10, yTop + L / 2, 0, sol.P * escF, col['--peso']);
        flecha(g, xc - 10, yTop + L / 2, 0, -sol.Emax * sub * escF, col['--normal']);
        texto(g, xc + L / 2 + 10, yTop + L / 2 + 30, 'P', col['--peso'], 'left', '600 ');
        texto(g, xc - L / 2 - 10, yTop + L / 2 - 30, 'E', col['--normal'], 'right', '600 ');
        texto(g, 14, 16, `P = ${txt(f(sol.P))} N · E = ${txt(f(sol.Emax * sub))} N`, col['--ink'], 'left', '600 ');
      }
      texto(g, x2 - 8, yF - 12, `fluide : ρ = ${txt(f(sol.rhoF))} kg/m³`, col['--muted'], 'right');
    } else if (sol.modo === 'bernoulli') {
      const xa = 20, xb = w - 20, xm1 = w * 0.42, xm2 = w * 0.56, Dmax = Math.min(h * 0.32, 110);
      const r1 = (Dmax * Math.min(1, sol.d1 / Math.max(sol.d1, sol.d2))) / 2, r2 = (Dmax * Math.min(1, sol.d2 / Math.max(sol.d1, sol.d2))) / 2;
      const dz = sol.h2 - sol.h1, cy0 = h * 0.7, sz = dz ? Math.max(-1, Math.min(1, dz / Math.max(Math.abs(dz), 1))) * h * 0.18 : 0;
      const cyA = cy0 + sz / 2, cyB = cy0 - sz / 2;
      const ctr = (x) => (x <= xm1 ? cyA : x >= xm2 ? cyB : cyA + (cyB - cyA) * suave((x - xm1) / (xm2 - xm1)));
      const rad = (x) => (x <= xm1 ? r1 : x >= xm2 ? r2 : r1 + (r2 - r1) * suave((x - xm1) / (xm2 - xm1)));
      const vel = (x) => sol.v1 * (r1 / rad(x)) ** 2;
      const pmax = Math.max(Math.abs(sol.p1), Math.abs(sol.p2)) || 1, hp = Math.min(h * 0.38, cyB - r2 - 30, cyA - r1 - 30);
      for (const [x, pr, cy, r, n] of [[(xa + xm1) / 2, sol.p1, cyA, r1, '1'], [(xm2 + xb) / 2, sol.p2, cyB, r2, '2']]) {
        const alto = Math.max(0, (pr / pmax) * hp);
        g.fillStyle = col['--line']; g.fillRect(x - 7, cy - r - hp - 6, 14, hp + 6);
        g.fillStyle = col['--agua']; g.fillRect(x - 5, cy - r - alto, 10, alto);
        texto(g, x + 14, cy - r - hp + 4, `p${n === '1' ? '₁' : '₂'} = ${txt(f(pr))} Pa`, col['--ink'], 'left');
      }
      g.fillStyle = col['--agua']; g.beginPath(); g.moveTo(xa, ctr(xa) - rad(xa));
      for (let x = xa; x <= xb; x += 4) g.lineTo(x, ctr(x) - rad(x));
      for (let x = xb; x >= xa; x -= 4) g.lineTo(x, ctr(x) + rad(x));
      g.closePath(); g.fill();
      g.strokeStyle = col['--suelo']; g.lineWidth = 3;
      for (const sg of [-1, 1]) { g.beginPath(); for (let x = xa; x <= xb; x += 4) (x === xa ? g.moveTo(x, ctr(x) + sg * rad(x)) : g.lineTo(x, ctr(x) + sg * rad(x))); g.stroke(); }
      if (!gotas) { gotas = []; for (let k = 0; k < 90; k++) gotas.push({ x: xa + Math.random() * (xb - xa), s: Math.random() * 1.6 - 0.8 }); }
      for (const q of gotas) punto(g, q.x, ctr(q.x) + q.s * rad(q.x), 2.2, col['--ink']);
      bernoulliPaso = (dt) => { const k = (0.18 * w) / Math.max(sol.v1, sol.v2); for (const q of gotas) { q.x += vel(q.x) * k * dt; if (q.x > xb) { q.x = xa + (q.x - xb) % 30; q.s = Math.random() * 1.6 - 0.8; } } };
      texto(g, (xa + xm1) / 2, cyA + r1 + 16, `v₁ = ${txt(f(sol.v1))} m/s`, col['--ink']);
      texto(g, (xm2 + xb) / 2, cyB + r2 + 16, `v₂ = ${txt(f(sol.v2))} m/s`, col['--ink']);
      texto(g, 14, 16, `Q = ${txt(f(sol.Q * 1000))} L/s`, col['--ink'], 'left', '600 ');
    } else if (sol.modo === 'viscosidad') {
      if (sol.tipo === 'stokes') {
        const x1 = w * 0.3, x2 = w * 0.62, yS = 30, yF = h - 20, xc = (x1 + x2) / 2, R0 = 14, T = 4.5;
        g.fillStyle = col['--suelo']; g.fillRect(x1 - 4, 14, 4, yF - 10); g.fillRect(x2, 14, 4, yF - 10); g.fillRect(x1 - 4, yF, x2 - x1 + 8, 4);
        liquido(g, x1, x2, yS, yF, col['--aceite'], t, 1);
        const u = t % T, tauA = 0.6, pos = u - tauA * (1 - Math.exp(-u / tauA)), posMax = T - tauA * (1 - Math.exp(-T / tauA)), y = yS + R0 + (pos / posMax) * (yF - yS - 2 * R0), fr = 1 - Math.exp(-u / tauA);
        punto(g, xc, y, R0, col['--ink']);
        const k = 50;
        flecha(g, xc, y, 0, k, col['--peso']); flecha(g, xc - 22, y, 0, -k * (sol.rhoF / sol.rhoE), col['--normal']); flecha(g, xc + 22, y, 0, -k * (1 - sol.rhoF / sol.rhoE) * fr, col['--roz']);
        texto(g, x2 + 14, h * 0.4, `v = ${txt(f(sol.v * fr))} m/s`, col['--ink'], 'left', '600 ');
        texto(g, x2 + 14, h * 0.4 + 20, `v limite ${txt(f(sol.v))} m/s`, col['--muted'], 'left');
      } else {
        const xa = 20, xb = w - 20, cy = h * 0.5, R0 = Math.min(h * 0.32, 90);
        g.fillStyle = col['--agua']; g.fillRect(xa, cy - R0, xb - xa, 2 * R0);
        g.fillStyle = col['--suelo']; g.fillRect(xa, cy - R0 - 4, xb - xa, 4); g.fillRect(xa, cy + R0, xb - xa, 4);
        const xp = w * 0.3, L = Math.min(w * 0.3, 220);
        g.strokeStyle = col['--ink']; g.lineWidth = 1; g.beginPath(); g.moveTo(xp, cy - R0); g.lineTo(xp, cy + R0); g.stroke();
        for (let k = -8; k <= 8; k++) { const yy = (k / 9) * R0, vv = 1 - (k / 9) ** 2; flecha(g, xp, cy + yy, vv * L, 0, col['--accent']); }
        g.strokeStyle = col['--accent']; g.lineWidth = 1.5; g.beginPath(); for (let k = -20; k <= 20; k++) { const yy = (k / 20) * R0, vv = 1 - (k / 20) ** 2; k === -20 ? g.moveTo(xp + vv * L, cy + yy) : g.lineTo(xp + vv * L, cy + yy); } g.stroke();
        if (!gotas) { gotas = []; for (let k = 0; k < 70; k++) gotas.push({ x: xa + Math.random() * (xb - xa), s: Math.random() * 1.9 - 0.95 }); }
        for (const q of gotas) punto(g, q.x, cy + q.s * R0, 2, col['--ink']);
        bernoulliPaso = (dt) => { for (const q of gotas) { q.x += (1 - q.s * q.s) * 0.25 * w * dt; if (q.x > xb) q.x = xa + (q.x - xb) % 20; } };
        texto(g, 14, 16, `v̄ = ${txt(f(sol.vm))} m/s · centre ${txt(f(sol.vmax))} m/s · Re = ${txt(f(sol.Re, 3))}`, col['--ink'], 'left', '600 ');
        texto(g, w - 14, h - 10, `Δp = ${txt(f(sol.dp))} Pa sur ${txt(f(sol.L))} m`, col['--muted'], 'right');
      }
    } else if (sol.modo === 'medidor') {
      const xa = 20, xb = w - 20, cy = h * 0.32, R1 = Math.min(h * 0.14, 40), R2 = sol.tipo === 'venturi' ? R1 * (sol.d2 / sol.d1) : R1, xm1 = w * 0.42, xm2 = w * 0.56;
      const rad = (x) => (x <= xm1 ? R1 : x >= xm2 ? R1 : R2 + (R1 - R2) * Math.abs((x - (xm1 + xm2) / 2) / ((xm2 - xm1) / 2)) ** 2);
      g.fillStyle = sol.rhoF < 50 ? col['--line'] : col['--agua']; g.beginPath(); for (let x = xa; x <= xb; x += 4) g.lineTo(x, cy - rad(x)); for (let x = xb; x >= xa; x -= 4) g.lineTo(x, cy + rad(x)); g.closePath(); g.fill();
      g.strokeStyle = col['--suelo']; g.lineWidth = 3; for (const sg of [-1, 1]) { g.beginPath(); for (let x = xa; x <= xb; x += 4) (x === xa ? g.moveTo(x, cy + sg * rad(x)) : g.lineTo(x, cy + sg * rad(x))); g.stroke(); }
      if (!gotas) { gotas = []; for (let k = 0; k < 60; k++) gotas.push({ x: xa + Math.random() * (xb - xa), s: Math.random() * 1.6 - 0.8 }); }
      for (const q of gotas) punto(g, q.x, cy + q.s * rad(q.x), 2, col['--ink']);
      bernoulliPaso = (dt) => { for (const q of gotas) { q.x += 0.15 * w * dt * (R1 / rad(q.x)) ** 2; if (q.x > xb) q.x = xa + (q.x - xb) % 20; } };
      const pA = sol.tipo === 'venturi' ? (xa + xm1) / 2 : w * 0.3, pB = sol.tipo === 'venturi' ? (xm1 + xm2) / 2 : w * 0.3 + 60, yU = h - 30, dhp = Math.min(h * 0.28, 30 + sol.dh * 200), base = h * 0.72;
      g.strokeStyle = col['--suelo']; g.lineWidth = 2; g.beginPath(); g.moveTo(pA, cy + rad(pA)); g.lineTo(pA, yU); g.lineTo(pB, yU); g.lineTo(pB, cy + rad(pB)); g.stroke();
      if (sol.tipo === 'pitot') { g.beginPath(); g.moveTo(pB, cy); g.lineTo(pB - 40, cy); g.stroke(); }
      g.strokeStyle = sol.rhoM ? col['--aceite'] : col['--agua']; g.lineWidth = 6; const sg = sol.tipo === 'pitot' ? -1 : 1; g.beginPath(); g.moveTo(pA, base + sg * dhp / 2); g.lineTo(pA, yU); g.lineTo(pB, yU); g.lineTo(pB, base - sg * dhp / 2); g.stroke();
      cota(g, pB + 14, base - dhp / 2, base + dhp / 2, `Δh = ${txt(f(sol.dh * 100))} cm`);
      texto(g, 14, h - 10, sol.tipo === 'venturi' ? `Q = ${txt(f(sol.Q * 1000))} L/s` : `v = ${txt(f(sol.v))} m/s`, col['--ink'], 'left', '600 ');
    } else if (sol.modo === 'pared') {
      const xw = w * 0.6, yS = 26, H = sol.h0 + sol.hc, esc = (h - 46) / H, yF = yS + H * esc, yA = yS + sol.h0 * esc, x1 = 20;
      liquido(g, x1, xw, yS, yF, col['--agua'], t, 1.5);
      g.fillStyle = col['--suelo']; g.fillRect(xw, yS - 10, 14, yF - yS + 14); g.fillRect(x1, yF, xw - x1 + 14, 4);
      if (sol.h0) { g.fillStyle = col['--ink']; g.fillRect(xw - 2, yA, 6, sol.hc * esc); }
      const k = Math.min(xw - x1 - 30, 160) / H;
      g.strokeStyle = col['--peso']; g.lineWidth = 1; g.beginPath(); g.moveTo(xw, yA); g.lineTo(xw - k * sol.h0, yA); g.lineTo(xw - k * H, yF); g.lineTo(xw, yF); g.stroke();
      for (let i = 0; i <= 8; i++) { const yy = yA + (i / 8) * sol.hc * esc, pr = (yy - yS) / esc; flecha(g, xw - k * pr, yy, k * pr - 2, 0, col['--peso']); }
      const yP = yS + sol.yc * esc; flecha(g, xw - 90, yP, 86, 0, col['--ink']);
      texto(g, xw - 96, yP, `F = ${txt(f(sol.F))} N`, col['--ink'], 'right', '600 ');
      cota(g, xw + 26, yS, yP, `y_P = ${txt(f(sol.yc))} m`.replace('y_P', 'yP'));
      cota(g, xw + 110, yS, yF, `${txt(f(H))} m`);
    } else if (sol.modo === 'capilar') {
      const yN = h * 0.62, x1 = 30, x2 = w - 30, xc = w * 0.45, rr = Math.max(6, Math.min(30, sol.r * 1000 * 12)), dh = Math.max(-h * 0.35, Math.min(h * 0.45, sol.h * 1000 * 8)), s = suave((t % 5) / 2), yT = yN - dh * s;
      liquido(g, x1, x2, yN, h - 10, col['--agua'], t, 1);
      g.fillStyle = col['--bg']; g.fillRect(xc - rr, 10, 2 * rr, h - 30);
      g.fillStyle = col['--agua']; g.beginPath(); g.moveTo(xc - rr, h - 20); g.lineTo(xc - rr, yT); g.quadraticCurveTo(xc, yT + (sol.c > 0 ? 1 : -1) * rr * 0.8 * Math.abs(sol.c), xc + rr, yT); g.lineTo(xc + rr, h - 20); g.closePath(); g.fill();
      g.fillStyle = col['--suelo']; g.fillRect(xc - rr - 3, 10, 3, h - 30); g.fillRect(xc + rr, 10, 3, h - 30);
      g.strokeStyle = col['--ink']; g.setLineDash([4, 4]); g.lineWidth = 1; g.beginPath(); g.moveTo(x1, yN); g.lineTo(x2, yN); g.stroke(); g.setLineDash([]);
      cota(g, xc + rr + 30, yN, yT, `h = ${txt(f(sol.h * 1000 * s))} mm`);
      texto(g, 14, 16, `r = ${txt(f(sol.r * 1000))} mm · θ = ${txt(f(sol.th))}° (tube hors échelle)`, col['--ink'], 'left', '600 ');
    } else {
      const yv = sol.y ?? sol.H / 2, alto = sol.H + yv, rango = 2 * Math.sqrt(sol.H * yv), tw = Math.min(w * 0.22, 150);
      const s = Math.min((h - 50) / alto, (w - tw - 60) / Math.max(rango, 0.1)), yS = h - 18, xo = 20 + tw, yo = yS - yv * s, ySup = yo - sol.H * s;
      g.fillStyle = col['--suelo']; g.fillRect(0, yS, w, 3);
      g.fillRect(16, ySup - 16, 4, yo - ySup + 26); g.fillRect(xo, ySup - 16, 4, yo - ySup - 4); g.fillRect(16, yo + 10, tw + 8, 4);
      g.fillRect(24, yo + 14, 6, yS - yo - 14); g.fillRect(xo - 8, yo + 14, 6, yS - yo - 14);
      liquido(g, 20, xo, ySup, yo + 10, col['--agua'], t, 1.5);
      const pasoT = (u) => [xo + 4 + u * rango * s, yo + u * u * yv * s];
      g.strokeStyle = col['--agua']; g.lineWidth = 6; g.beginPath();
      for (let k = 0; k <= 40; k++) { const [x, y] = pasoT(k / 40); k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      for (let k = 0; k < 10; k++) { const u = (t * 0.8 + k / 10) % 1, [x, y] = pasoT(u); punto(g, x, y, 2.2, col['--accent']); }
      flecha(g, xo + 8, yo - 14, 44, 0, col['--peso']); texto(g, xo + 58, yo - 14, `v = ${txt(f(sol.v))} m/s`, col['--peso'], 'left');
      cota(g, xo - 14, ySup, yo, `H = ${txt(f(sol.H))} m`, col['--muted'], 'right');
      if (sol.y !== null) {
        cota(g, xo + 18, yo + 8, yS, `y = ${txt(f(sol.y))} m`);
        if (sol.x) { g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(xo + 4, yS + 10); g.lineTo(xo + 4 + rango * s, yS + 10); g.stroke(); texto(g, xo + 4 + (rango * s) / 2, yS - 10, `x = ${txt(f(sol.x))} m`, col['--ink'], 'center', '600 '); }
      }
      texto(g, w - 14, 16, sol.tv ? `se vide en ${txt(f(sol.tv))} s` : '', col['--ink'], 'right', '600 ');
    }
  }
  let bernoulliPaso = null;
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; if (['bernoulli', 'viscosidad', 'medidor'].includes(sol.modo) && bernoulliPaso) bernoulliPaso(dt); dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', () => { gotas = null; dibuja(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const tipos = [
      () => ({ modo: 'presion', rho: de(['1000', '1025']), h: String(ent(2, 60)), p0: '', A: Math.random() < 0.5 ? '' : String(ent(2, 50)), g: '9,8' }),
      () => ({ modo: 'tuboU', buscar: 'altura', rho1: de(['1000', '13600']), rho2: de(['800', '850', '900']), h2: c(ent(5, 20) / 100) }),
      () => ({ modo: 'prensa', datos: 'masa', m: String(ent(5, 30) * 100), d1: String(ent(2, 5)), d2: String(ent(20, 50)), x1: String(ent(10, 30)), g: '9,8' }),
      () => ({ modo: 'empuje', datos: 'cuerpo', rhoC: de(['500', '600', '700', '917', '2700', '7870']), V: c(de([0.001, 0.002, 0.005, 0.01])), rhoF: de(['1000', '1025']), g: '9,8' }),
      () => ({ modo: 'empuje', datos: 'pesadas', P: String(ent(5, 20)), Pa: '', rhoF: '1000', g: '9,8' }),
      () => ({ modo: 'bernoulli', datos: 'v1', rho: '1000', d1: String(ent(6, 12)), d2: String(ent(2, 5)), v1: c(ent(5, 30) / 10), p1: c(ent(15, 40) * 1e4), h1: '', h2: '', g: '9,8' }),
      () => ({ modo: 'torricelli', H: c(ent(5, 40) / 10), y: c(ent(5, 20) / 10), d: String(ent(1, 4)), D: '', g: '9,8' }),
      () => ({ modo: 'viscosidad', tipo: 'poiseuille', datos: 'dp', eta: de(['1e-3', '4e-3']), L: c(de([0.05, 0.1, 0.5, 1])), d: String(ent(1, 6)), dp: String(ent(1, 20) * 10), Q: '', rho: '1000' }),
      () => ({ modo: 'viscosidad', tipo: 'stokes', datos: 'eta', r: c(de([0.5, 1, 1.5, 2])), rhoE: de(['2700', '7800']), rhoF: de(['900', '1260']), eta: c(de([0.3, 0.8, 1.5])), v: '', g: '9,8' }),
      () => ({ modo: 'medidor', tipo: 'pitot', rhoF: '1,2', rhoM: '1000', dh: String(ent(2, 30)), d1: '', d2: '', g: '9,8' }),
      () => ({ modo: 'medidor', tipo: 'venturi', rhoF: '1000', rhoM: '13600', dh: String(ent(1, 10)), d1: String(ent(8, 15)), d2: String(ent(3, 6)), g: '9,8' }),
      () => ({ modo: 'pared', rho: '1000', b: String(ent(2, 60)), hc: String(ent(2, 30)), h0: '', g: '9,8' }),
      () => ({ modo: 'capilar', gamma: '0,073', r: c(de([0.1, 0.2, 0.5, 1])), rho: '1000', theta: '0', g: '9,8' }),
    ];
    sc = de(tipos)();
    if (sc.modo === 'empuje' && sc.datos === 'pesadas') sc.Pa = c(+(sc.P * (1 - de([0.052, 0.1, 0.13, 0.37]))).toFixed(2));
    formulario(); sel.value = ''; calcula();
  }
  const enunciado = () => {
    const e = (x) => esc(String(x ?? '').replace('.', ','));
    switch (sc.modo) {
      case 'presion': return `Calcule la pression manométrique et la pression absolue à ${e(sc.h)} m de profondeur dans un liquide de ${e(sc.rho)} kg/m³${sc.A ? `, et la force du liquide sur un fond de ${e(sc.A)} m²` : ''}.`;
      case 'tuboU': return `Dans un tube en U contenant un liquide de ${e(sc.rho1)} kg/m³, on verse dans une branche une colonne de ${e(sc.h2)} m d’un autre liquide de ${e(sc.rho2)} kg/m³ non miscible. De combien le premier monte-t-il dans l’autre branche et quelle dénivellation reste-t-il ?`;
      case 'prensa': return `Un élévateur hydraulique a des pistons de ${e(sc.d1)} cm et ${e(sc.d2)} cm de diamètre. Quelle force faut-il exercer pour soulever ${e(sc.m)} kg et de combien monte la charge si le petit piston descend de ${e(sc.x1)} cm ?`;
      case 'empuje': return sc.datos === 'pesadas' ? `Un corps pèse ${e(sc.P)} N dans l’air et ${e(sc.Pa)} N immergé dans l’eau. Calcule la poussée, son volume et sa masse volumique.` : `Un corps de ${e(sc.rhoC)} kg/m³ et ${e(sc.V)} m³ est placé dans un fluide de ${e(sc.rhoF)} kg/m³. Flotte-t-il ou coule-t-il ? Calcule son poids, la poussée et la partie immergée ou le poids apparent.`;
      case 'bernoulli': return `De l’eau circule à ${e(sc.v1)} m/s avec une pression de ${e(sc.p1)} Pa dans une conduite horizontale de ${e(sc.d1)} cm de diamètre. Elle se rétrécit jusqu’à ${e(sc.d2)} cm : calcule la vitesse, la pression dans l’étranglement et le débit.`;
      case 'torricelli': return `Un réservoir ouvert a un trou de ${e(sc.d)} cm situé à ${e(sc.H)} m sous la surface et à ${e(sc.y)} m du sol. Calcule la vitesse de sortie, la portée du jet et le débit.`;
      case 'viscosidad': return sc.tipo === 'stokes' ? `Une sphère de ${e(sc.r)} mm de rayon et de ${e(sc.rhoE)} kg/m³ tombe dans un liquide de ${e(sc.rhoF)} kg/m³ et de viscosité ${e(sc.eta)} Pa·s. Calcule sa vitesse limite et vérifie si la loi de Stokes est valable.` : `Un fluide de viscosité ${e(sc.eta)} Pa·s circule dans un tube de ${e(sc.d)} mm de diamètre intérieur et de ${e(sc.L)} m de long avec une différence de pression de ${e(sc.dp)} Pa. Calcule le débit, les vitesses moyenne et maximale et le nombre de Reynolds.`;
      case 'medidor': return sc.tipo === 'venturi' ? `Un débitmètre de Venturi dans une conduite d’eau de ${e(sc.d1)} cm se rétrécit jusqu’à ${e(sc.d2)} cm. Son manomètre à mercure indique une dénivellation de ${e(sc.dh)} cm. Calcule la vitesse de l’eau et le débit.` : `Le tube de Pitot d’un petit avion (air de ${e(sc.rhoF)} kg/m³) a un manomètre à eau qui indique ${e(sc.dh)} cm. À quelle vitesse vole-t-il par rapport à l’air ?`;
      case 'pared': return `Un barrage de ${e(sc.b)} m de largeur retient de l’eau jusqu’à ${e(sc.hc)} m de hauteur. Calcule la force de l’eau, la profondeur à laquelle elle s’exerce et le moment par rapport à la base.`;
      case 'capilar': return `De combien monte l’eau (γ = ${e(sc.gamma)} N/m, angle de contact ${e(sc.theta)}°) dans un tube capillaire de ${e(sc.r)} mm de rayon ?`;
      default: return 'Résous le problème.';
    }
  };

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('fluidos').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  Constantes.monta(document.querySelector('.layout .card'));
  window.FluidosApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && Object.fromEntries(Object.entries(sol).filter(([, v]) => typeof v === 'number' || typeof v === 'boolean' || v === null)), estado: () => copia(sc), pausa: () => { anda = false; } };
})();

