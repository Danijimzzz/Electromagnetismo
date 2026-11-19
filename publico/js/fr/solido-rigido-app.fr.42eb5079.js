(() => {
  const { $, esc, copia } = Herramienta;
  const S = Solido, f = S.f, CLAVE = 'solido-rigido-v1';
  const txt = (h) => String(h).replace(/<[^>]+>/g, '');
  const MODOS = [['inercia', 'Moment d’inertie (Huygens-Steiner)'], ['compuesto', 'Moment d’inertie d’un corps composé'], ['rodadura', 'Roulement sur un plan incliné'], ['polea', 'Poulie massive'], ['momento', 'Conservation du moment cinétique'], ['choque', 'Choc qui met en rotation'], ['pendulo', 'Pendule pesant et tige qui tombe'], ['equilibrio', 'Équilibre statique (échelle, poutre)']];

  let sc = copia(S.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) {} };
  let sol = null, col = {};

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off">`;
  const area = (k, nom) => `<label for="f-${k}" class="ancho">${nom}</label><textarea id="f-${k}" class="in ancho" data-k="${k}" rows="4" spellcheck="false">${esc(sc[k] ?? '')}</textarea>`;
  const lista = (k, nom, ops) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${opciones(k, ops)}</select>`;
  const opciones = (k, lista) => lista.map(([v, t]) => `<option value="${v}"${sc[k] === v ? ' selected' : ''}>${t}</option>`).join('');
  function formulario() {
    let h = `<label for="f-modo">Que calculer</label><select id="f-modo" class="in" data-k="modo">${opciones('modo', MODOS)}</select>`;
    const cuerpos = Object.entries(S.CUERPOS).filter(([, c]) => sc.modo === 'inercia' || sc.modo === 'pendulo' || c.rueda).map(([k, c]) => [k, c.nombre]);
    if (['inercia', 'rodadura', 'polea', 'pendulo'].includes(sc.modo) && !cuerpos.some(([k]) => k === sc.cuerpo)) sc.cuerpo = cuerpos[0][0];
    const C = S.CUERPOS[sc.cuerpo];
    if (sc.modo === 'inercia') {
      h += `<label for="f-cuerpo">Corps</label><select id="f-cuerpo" class="in" data-k="cuerpo">${opciones('cuerpo', cuerpos)}</select>`;
      h += fila('M', 'Masse M', 'kg') + fila('L', C.medNom, 'm') + (C.placa ? fila('b', 'Côté b', 'm') : '') + fila('d', 'Distance de l’axe au centre d', 'm');
      $('#nota').textContent = 'Laisse d vide (ou 0) pour l’axe passant par le centre de masse. Pour une tige par une extrémité, d = L/2.';
    } else if (sc.modo === 'rodadura') {
      h += `<label for="f-cuerpo">Corps qui roule</label><select id="f-cuerpo" class="in" data-k="cuerpo">${opciones('cuerpo', cuerpos)}</select>`;
      h += fila('M', 'Masse M', 'kg') + fila('L', 'Rayon R', 'm') + fila('theta', 'Angle du plan θ', '°') + fila('d', 'Distance parcourue', 'm') + fila('mu', 'Frottement statique μ<sub>s</sub>', '') + fila('g', 'Gravité g', 'm/s²');
      $('#nota').textContent = 'Il part du repos. Laisse μ vide si tu ne veux que le cas du roulement sans glissement.';
    } else if (sc.modo === 'polea') {
      h += `<label for="f-cuerpo">Poulie</label><select id="f-cuerpo" class="in" data-k="cuerpo">${opciones('cuerpo', cuerpos.filter(([k]) => k === 'cilindro' || k === 'aro'))}</select>`;
      h += fila('M', 'Masse de la poulie M', 'kg') + fila('L', 'Rayon R', 'm') + fila('m', 'Masse suspendue m', 'kg') + fila('d', 'Hauteur de chute', 'm') + fila('g', 'Gravité g', 'm/s²');
      $('#nota').textContent = 'La corde est enroulée sur la poulie, qui tourne sans frottement sur son axe. Elle part du repos.';
    } else if (sc.modo === 'compuesto') {
      h += area('piezas', 'Pièces, une par ligne : <small>type masse dimension distance</small>');
      $('#nota').innerHTML = `Types : ${Object.keys(S.CUERPOS).map((k) => `<code>${k}</code>`).join(', ')} et <code>punto</code> (masse ponctuelle : « punto masse distance »). La dimension est le rayon ou la longueur, la distance va de l’axe au centre de la pièce et la plaque porte le côté b à la fin. Axes parallèles à celui de la pièce.`;
    } else if (sc.modo === 'choque') {
      h += lista('tipo', 'Situation', [['bala', 'Balle qui se fiche dans une tige'], ['plataforma', 'Personne qui saute sur une plateforme']]);
      if (sc.tipo === 'plataforma') {
        h += fila('M', 'Masse de la plateforme M', 'kg') + fila('L', 'Rayon R', 'm') + fila('w1', 'Rotation initiale ω<sub>1</sub>', 'rpm') + fila('m', 'Masse de la personne m', 'kg') + fila('v', 'Vitesse tangentielle de la personne', 'm/s') + fila('r', 'Distance à l’axe où elle tombe', 'm');
        $('#nota').textContent = 'La plateforme est un disque qui tourne sans frottement. Vitesse positive : dans le sens de rotation ; 0 si elle tombe sans se déplacer latéralement.';
      } else {
        h += fila('M', 'Masse de la tige M', 'kg') + fila('L', 'Longueur L', 'm') + fila('m', 'Masse de la balle m', 'kg') + fila('v', 'Vitesse de la balle v', 'm/s') + fila('r', 'Distance du pivot à l’impact r', 'm') + fila('g', 'Gravité g', 'm/s²');
        $('#nota').textContent = 'La tige est suspendue au repos par un pivot à son extrémité supérieure, et la balle arrive à l’horizontale et reste à l’intérieur.';
      }
    } else if (sc.modo === 'pendulo') {
      h += lista('tipo', 'Situation', [['oscila', 'Oscille suspendu à un pivot'], ['cae', 'Tombe depuis le haut en tournant autour du pivot']]);
      h += lista('cuerpo', 'Corps', cuerpos) + fila('M', 'Masse M', 'kg') + fila('L', C.medNom, 'm') + (C.placa ? fila('b', 'Côté b', 'm') : '') + fila('d', 'Distance du pivot au centre de masse d', 'm');
      h += sc.tipo === 'cae' ? fila('th0', 'Angle initial avec la verticale θ<sub>0</sub>', '°') + fila('th', 'Angle auquel porte la question θ', '°') : fila('th0', 'Amplitude θ<sub>0</sub>', '°');
      h += fila('g', 'Gravité g', 'm/s²');
      $('#nota').textContent = sc.tipo === 'cae' ? 'Angles mesurés depuis la verticale au-dessus du pivot : 0° est debout et 90° couché. Pour une tige qui tourne autour de sa base, d = L/2.' : 'Pour une tige suspendue par une extrémité, d = L/2 ; pour un cerceau suspendu à un clou, d = R.';
    } else if (sc.modo === 'equilibrio') {
      h += lista('tipo', 'Situation', [['escalera', 'Échelle appuyée contre un mur lisse'], ['viga', 'Poutre sur deux appuis']]);
      if (sc.tipo === 'viga') {
        h += fila('M', 'Masse de la poutre M', 'kg') + fila('L', 'Longueur L', 'm') + fila('xA', 'Appui A en x', 'm') + fila('xB', 'Appui B en x', 'm') + fila('g', 'Gravité g', 'm/s²') + area('cargas', 'Charges : <small>position masse ; position masse</small>');
        $('#nota').textContent = 'Les positions se mesurent depuis l’extrémité gauche. La poutre est homogène (son poids s’applique en son centre).';
      } else {
        h += fila('M', 'Masse de l’échelle M', 'kg') + fila('L', 'Longueur L', 'm') + fila('theta', 'Angle avec le sol θ', '°') + fila('m', 'Masse de la personne m', 'kg') + fila('s', 'Distance parcourue en montant s', 'm') + fila('mu', 'Frottement avec le sol μ', '') + fila('g', 'Gravité g', 'm/s²');
        $('#nota').textContent = 'Le mur est sans frottement ; le sol non. s se mesure le long de l’échelle depuis le pied.';
      }
    } else {
      h += fila('I1', 'Moment d’inertie initial I<sub>1</sub>', 'kg·m²') + fila('w1', 'Vitesse angulaire initiale ω<sub>1</sub>', '') + `<label for="f-unidad">Unités de ω</label><select id="f-unidad" class="in" data-k="unidad">${opciones('unidad', [['rpm', 'rpm'], ['rad', 'rad/s']])}</select>` + fila('I2', 'Moment d’inertie final I<sub>2</sub>', 'kg·m²');
      $('#nota').textContent = 'Convient pour une patineuse, un tabouret tournant ou deux disques qui s’accouplent (I₂ = somme des deux, le second étant à l’arrêt au début).';
    }
    $('#campos').innerHTML = h;
  }
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return; sc[t.dataset.k] = t.value; $('#ejemplos').value = ''; calcula(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target;
    if (t.tagName !== 'SELECT') return;
    sc[t.dataset.k] = t.value;
    if (t.dataset.k === 'modo' || t.dataset.k === 'tipo') { const ej = S.ejemplos.find((x) => x.sc.modo === sc.modo && (t.dataset.k === 'modo' || x.sc.tipo === t.value)); if (ej) sc = copia(ej.sc); }
    $('#ejemplos').value = ''; formulario(); calcula();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Exemples…</option>' + S.ejemplos.map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = S.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc);
    formulario(); calcula(); sel.value = clave; t0 = null;
  }

  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = S.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#play').hidden = true; dibuja(); return; }
    err.hidden = true; guarda();
    let h = '', ley = '';
    if (sol.modo === 'inercia') {
      h = dato('Moment d’inertie', `I = <b>${f(sol.I)} kg·m<sup>2</sup></b>`) + (sol.d ? dato('Par rapport au centre de masse', `I<sub>cm</sub> = ${f(sol.Icm)} kg·m<sup>2</sup>`) : '');
      ley = 'L’axe de rotation est la ligne en pointillés ; le point est le centre de masse.';
    } else if (sol.modo === 'rodadura') {
      const r = sol.desliza;
      h = dato(r ? 'Roule et glisse' : 'Roule sans glisser', `a = <b>${f(r ? r.a : sol.a)} m/s<sup>2</sup></b>`) + dato('Au bas du plan', `v = <b>${f(r ? r.v : sol.v)} m/s</b>, t = ${f(r ? r.t : sol.t)} s`) + dato('Frottement', r ? `μN = ${f(sol.mu * sol.N)} N (dynamique)` : `F<sub>f</sub> = ${f(sol.Fr)} N ; il faut μ<sub>s</sub> ≥ ${f(sol.muMin)}`);
      ley = 'À droite, le temps que met chaque corps à parcourir le plan en roulant sans glisser : le gagnant est celui dont I/(MR²) est le plus petit.';
    } else if (sol.modo === 'polea') {
      h = dato('Accélération', `a = <b>${f(sol.a)} m/s<sup>2</sup></b>, α = ${f(sol.al)} rad/s<sup>2</sup>`) + dato('Tension', `T = <b>${f(sol.T)} N</b>`) + dato(`Après une descente de ${f(sol.d)} m`, `v = ${f(sol.v)} m/s, ω = ${f(sol.w)} rad/s`);
      ley = 'Forces sur le corps suspendu et tension qui fait tourner la poulie.';
    } else if (sol.modo === 'compuesto') {
      h = dato('Moment d’inertie total', `I = <b>${f(sol.I)} kg·m<sup>2</sup></b>`) + dato('Masse totale', `M = ${f(sol.M)} kg`) + dato('Rayon de giration', `k = ${f(Math.sqrt(sol.I / sol.M))} m`);
      ley = 'Chaque pièce à sa distance de l’axe (le point avec la croix) ; celles qui sont à la même distance sont dessinées d’un côté et de l’autre.';
    } else if (sol.modo === 'choque' && sol.tipo === 'bala') {
      h = dato('Vitesse angulaire après le choc', `ω = <b>${f(sol.W)} rad/s</b>`) + dato('Énergie perdue', `${f(100 * (1 - sol.K1 / sol.K0), 3)} %`) + dato('Monte jusqu’à', sol.vuelta ? '<b>il fait le tour complet</b>' : `θ = <b>${f(sol.sube)}°</b>`);
      ley = 'La tige avec la balle à l’intérieur, et en pointillés jusqu’où elle monte.';
    } else if (sol.modo === 'choque') {
      h = dato('Rotation finale', `ω<sub>2</sub> = <b>${f(sol.w2)} tr/min</b> = ${f(sol.W2)} rad/s`) + dato('Moment cinétique', `L = ${f(sol.L1)} kg·m<sup>2</sup>/s`) + dato('Énergie perdue', `${f(sol.K1 - sol.K2)} J`);
      ley = 'Vue de dessus : la plateforme et la personne, avec sa vitesse tangentielle.';
    } else if (sol.modo === 'pendulo' && sol.tipo === 'cae') {
      h = dato(`À ${f(sol.th)}° de la verticale`, `ω = <b>${f(sol.w)} rad/s</b>`) + dato('Accélération angulaire', `α = <b>${f(sol.al)} rad/s<sup>2</sup></b>`) + (sc.cuerpo === 'varilla' ? dato('Extrémité de la tige', `v = ${f(sol.w * sol.punta)} m/s, a<sub>t</sub> = ${f(sol.al * sol.punta)} m/s<sup>2</sup>`) : '') + dato('Moment d’inertie', `I = ${f(sol.I)} kg·m<sup>2</sup>`);
      ley = 'Elle tombe en tournant autour du pivot (la croix) ; elle se répète en boucle.';
    } else if (sol.modo === 'pendulo') {
      h = dato('Période (petites oscillations)', `T = <b>${f(sol.periodo)} s</b>`) + dato('Longueur équivalente', `L<sub>eq</sub> = <b>${f(sol.Leq)} m</b>`) + dato('ω au passage par le bas', `${f(sol.wmax)} rad/s`) + dato('Moment d’inertie', `I = ${f(sol.I)} kg·m<sup>2</sup>`);
      ley = 'Il oscille autour du pivot (la croix) ; en pointillés, le pendule simple équivalent.';
    } else if (sol.modo === 'equilibrio' && sol.tipo === 'viga') {
      h = dato('Réaction en A', `R<sub>A</sub> = <b>${f(sol.RA)} N</b>`) + dato('Réaction en B', `R<sub>B</sub> = <b>${f(sol.RB)} N</b>`) + (sol.vuelca ? dato('Équilibre', '<b>bascule</b>') : '');
      ley = 'Poids vers le bas et réactions des appuis vers le haut, la longueur de chaque flèche étant proportionnelle à la force.';
    } else if (sol.modo === 'equilibrio') {
      h = dato('Réaction normale du sol', `N<sub>1</sub> = <b>${f(sol.N1)} N</b>`) + dato('Mur et frottement', `N<sub>2</sub> = F<sub>f</sub> = <b>${f(sol.N2)} N</b>`) + dato('Frottement minimal', `μ ≥ <b>${f(sol.muMin)}</b>${sol.mu !== null ? (sol.resbala ? ' (glisse)' : ' (ne glisse pas)') : ''}`) + (sol.sMax !== null ? dato('Peut monter', sol.sMax >= sol.L ? 'jusqu’en haut' : sol.sMax <= 0 ? 'nada' : `${f(sol.sMax)} m`) : '');
      ley = 'Forces sur l’échelle : poids, réactions normales et frottement du sol.';
    } else {
      h = dato('Vitesse angulaire finale', `ω<sub>2</sub> = <b>${f(sol.w2)} ${sol.rpm ? 'rpm' : 'rad/s'}</b>`) + dato('Moment cinétique', `L = ${f(sol.L)} kg·m<sup>2</sup>/s`) + dato('Énergie cinétique', `${f(sol.K1)} J → ${f(sol.K2)} J`);
      ley = 'La taille de chaque disque est liée à son moment d’inertie ; les flèches, à la rapidité de sa rotation.';
    }
    $('#res').innerHTML = h; $('#leyenda').textContent = ley;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    $('#play').hidden = !sol.mov;
    dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const k of ['--ink', '--muted', '--line', '--accent', '--bg', '--peso', '--normal', '--roz', '--fuerza', '--tension', '--cuerpo', '--suelo']) col[k] = cs.getPropertyValue(k).trim(); }
  function flecha(g, x0, y0, x1, y1, color, ancho = 2.2) {
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 2) return;
    g.strokeStyle = color; g.fillStyle = color; g.lineWidth = ancho;
    const a = Math.atan2(y1 - y0, x1 - x0), p = Math.min(10, L * 0.45);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - p * 0.6 * Math.cos(a), y1 - p * 0.6 * Math.sin(a)); g.stroke();
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - p * Math.cos(a - 0.4), y1 - p * Math.sin(a - 0.4)); g.lineTo(x1 - p * Math.cos(a + 0.4), y1 - p * Math.sin(a + 0.4)); g.closePath(); g.fill();
  }
  function texto(g, x, y, t, color = col['--ink'], al = 'center', peso = '') { g.font = `${peso}12px "IBM Plex Sans", system-ui, sans-serif`; g.fillStyle = color; g.textAlign = al; g.textBaseline = 'middle'; g.fillText(t, x, y); }
  function giro(g, x, y, r, color, a0 = -2.4, a1 = -0.5, antihorario = false) {
    g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, a0, a1, antihorario); g.stroke();
    const ex = x + r * Math.cos(a1), ey = y + r * Math.sin(a1), t = a1 + (antihorario ? -1 : 1) * Math.PI / 2;
    g.fillStyle = color; g.beginPath(); g.moveTo(ex + 6 * Math.cos(t), ey + 6 * Math.sin(t)); g.lineTo(ex + 5 * Math.cos(t - 2.2), ey + 5 * Math.sin(t - 2.2)); g.lineTo(ex + 5 * Math.cos(t + 2.2), ey + 5 * Math.sin(t + 2.2)); g.closePath(); g.fill();
  }
  function rueda(g, x, y, r, clave, phi) {
    g.fillStyle = col['--cuerpo']; g.strokeStyle = col['--muted']; g.lineWidth = 1.4;
    g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI);
    if (clave === 'aro') { g.lineWidth = Math.max(3, r * 0.18); g.strokeStyle = col['--cuerpo']; g.stroke(); g.lineWidth = 1; g.strokeStyle = col['--muted']; g.beginPath(); g.arc(x, y, r + Math.max(3, r * 0.18) / 2, 0, 2 * Math.PI); g.stroke(); }
    else { g.fill(); g.stroke(); if (clave === 'esfera-hueca') { g.fillStyle = col['--bg']; g.beginPath(); g.arc(x, y, r * 0.8, 0, 2 * Math.PI); g.fill(); g.stroke(); } }
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(x, y, 2.5, 0, 2 * Math.PI); g.fill();
    if (phi !== undefined) { g.strokeStyle = col['--accent']; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r * 0.85 * Math.cos(phi), y + r * 0.85 * Math.sin(phi)); g.stroke(); }
  }

  function dibujaInercia(g, w, h) {
    const C = sol.C, cx = w / 2, cy = h / 2, esc = Math.min(w * 0.6, h * 0.7);
    const med = C.placa ? Math.max(sol.L, +String(sc.b).replace(',', '.') || 0) : sc.cuerpo === 'varilla' ? sol.L : 2 * sol.L;
    const k = esc / Math.max(med, 2 * sol.d, 1e-9) * 0.8;
    g.fillStyle = col['--cuerpo']; g.strokeStyle = col['--muted']; g.lineWidth = 1.4;
    if (sc.cuerpo === 'varilla') { g.fillRect(cx - (sol.L * k) / 2, cy - 5, sol.L * k, 10); g.strokeRect(cx - (sol.L * k) / 2, cy - 5, sol.L * k, 10); }
    else if (C.placa) { const b = (+String(sc.b).replace(',', '.') || 0) * k; g.fillRect(cx - (sol.L * k) / 2, cy - b / 2, sol.L * k, b); g.strokeRect(cx - (sol.L * k) / 2, cy - b / 2, sol.L * k, b); }
    else if (sc.cuerpo === 'disco-diametro') { g.beginPath(); g.ellipse(cx, cy, sol.L * k, sol.L * k * 0.35, 0, 0, 2 * Math.PI); g.fill(); g.stroke(); }
    else rueda(g, cx, cy, sol.L * k, sc.cuerpo);
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(cx, cy, 3, 0, 2 * Math.PI); g.fill();
    texto(g, cx + 8, cy + 14, 'cm', col['--muted'], 'left');
    const ex = cx + sol.d * k, enPlano = C.eje === 'un diamètre';
    g.strokeStyle = col['--accent']; g.lineWidth = 1.6; g.setLineDash([6, 4]);
    if (enPlano) { g.beginPath(); g.moveTo(ex, 10); g.lineTo(ex, h - 10); g.stroke(); }
    g.setLineDash([]);
    if (!enPlano) { g.beginPath(); g.arc(ex, cy, 7, 0, 2 * Math.PI); g.stroke(); g.beginPath(); g.moveTo(ex - 5, cy - 5); g.lineTo(ex + 5, cy + 5); g.moveTo(ex + 5, cy - 5); g.lineTo(ex - 5, cy + 5); g.stroke(); }
    giro(g, ex, enPlano ? 28 : cy, enPlano ? 16 : 22, col['--accent']);
    if (sol.d) { g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, cy + 30); g.lineTo(ex, cy + 30); g.stroke(); texto(g, (cx + ex) / 2, cy + 42, `d = ${txt(f(sol.d))} m`, col['--muted']); }
    texto(g, 12, 16, `I = ${txt(f(sol.I))} kg·m²`, col['--accent'], 'left', '600 ');
  }

  function dibujaRodadura(g, w, h) {
    const t = sol.th * Math.PI / 180, m = 16, Wp = w * 0.55, L = Math.min((Wp - m) / Math.cos(t), (h - 2 * m) / Math.sin(t)), x0 = m, y0 = h - m, xe = x0 + L * Math.cos(t), ye = y0 - L * Math.sin(t);
    g.fillStyle = col['--line']; g.strokeStyle = col['--suelo']; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(xe, ye); g.lineTo(xe, y0); g.closePath(); g.fill(); g.stroke();
    const r = Math.max(10, Math.min(26, L * 0.08)), mv = sol.mov(tAnim), s = L * 0.92 - (mv.s / sol.d) * (L * 0.92 - r * 2.5), bx = x0 + s * Math.cos(t) - r * Math.sin(t), by = y0 - s * Math.sin(t) - r * Math.cos(t);
    rueda(g, bx, by, r, sc.cuerpo, -mv.phi * (sol.R / ((sol.d / (L * 0.92 - r * 2.5)) * r)) - Math.PI / 2);
    giro(g, bx, by, r + 8, col['--accent'], -1.0, -2.6, true);
    flecha(g, bx, by, bx - 44 * Math.cos(t), by + 44 * Math.sin(t), col['--accent']);
    texto(g, bx - 54 * Math.cos(t), by + 54 * Math.sin(t) + 2, 'a', col['--accent'], 'center', '600 ');
    texto(g, x0 + 44, y0 - 10, `θ = ${txt(f(sol.th))}°`, col['--muted'], 'left');
    const xb = Wp + 30, ancho = w - xb - 16, filas = sol.carrera, tmax = Math.max(...filas.map((q) => q.t)), alto = Math.min(34, (h - 40) / filas.length);
    texto(g, xb, 14, 'Temps jusqu’au bas du plan', col['--muted'], 'left');
    filas.forEach((q, i) => {
      const y = 34 + i * alto, bw = (q.t / tmax) * (ancho - 50), yo = q.k === sc.cuerpo;
      g.fillStyle = yo ? col['--accent'] : col['--cuerpo']; g.fillRect(xb, y, bw, alto * 0.45);
      texto(g, xb, y + alto * 0.45 + 9, q.nombre.split(' (')[0], yo ? col['--ink'] : col['--muted'], 'left', yo ? '600 ' : '');
      texto(g, xb + bw + 6, y + alto * 0.22, `${txt(f(q.t, 3))} s`, col['--ink'], 'left');
    });
  }

  function dibujaPolea(g, w, h) {
    const cx = w / 2 - 30, cy = 70, R = Math.min(48, h * 0.16), s = 44, kF = Math.min(90, h * 0.3) / (sol.m * sol.g), recorre = Math.max(10, Math.min(h - s / 2 - 18 - kF * sol.m * sol.g, cy + R + 140) - (cy + R + 40)), mv = sol.mov(tAnim), yh = cy + R + 40 + (mv.y / sol.d) * recorre;
    g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 60, 8); g.lineTo(cx + 60, 8); g.moveTo(cx, 8); g.lineTo(cx, cy); g.stroke();
    rueda(g, cx, cy, R, sc.cuerpo, (mv.y / sol.d) * (recorre / R) - Math.PI / 2);
    g.strokeStyle = col['--ink']; g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx + R, cy); g.lineTo(cx + R, yh - s / 2); g.stroke();
    g.fillStyle = col['--cuerpo']; g.strokeStyle = col['--muted']; g.fillRect(cx + R - s / 2, yh - s / 2, s, s); g.strokeRect(cx + R - s / 2, yh - s / 2, s, s); texto(g, cx + R, yh, 'm');
    const k = Math.min(90, h * 0.3) / (sol.m * sol.g);
    flecha(g, cx + R + s / 2 + 18, yh, cx + R + s / 2 + 18, yh + k * sol.m * sol.g, col['--peso']); texto(g, cx + R + s / 2 + 32, yh + k * sol.m * sol.g * 0.7, 'mg', col['--peso'], 'left', '600 ');
    flecha(g, cx + R + s / 2 + 18, yh - 4, cx + R + s / 2 + 18, yh - 4 - k * sol.T, col['--tension']); texto(g, cx + R + s / 2 + 32, yh - 4 - k * sol.T * 0.7, 'T', col['--tension'], 'left', '600 ');
    flecha(g, cx + R + 4, cy + R * 0.2, cx + R + 4, cy + R * 0.2 + k * sol.T, col['--tension']); texto(g, cx + R + 16, cy + R * 0.2 + k * sol.T * 0.6, 'T', col['--tension'], 'left', '600 ');
    giro(g, cx, cy, R + 10, col['--accent'], -2.2, -0.3); texto(g, cx - R - 18, cy - R + 4, 'α', col['--accent'], 'center', '600 ');
    flecha(g, cx + R - s / 2 - 20, yh - 20, cx + R - s / 2 - 20, yh + 20, col['--accent'], 1.6); texto(g, cx + R - s / 2 - 32, yh, 'a', col['--accent'], 'center', '600 ');
  }

  function dibujaMomento(g, w, h) {
    const rmax = Math.min(w / 5, h / 2 - 30), r1 = rmax * Math.sqrt(sol.I1 / Math.max(sol.I1, sol.I2)), r2 = rmax * Math.sqrt(sol.I2 / Math.max(sol.I1, sol.I2));
    const wmax = Math.max(sol.W1, sol.W2), cy = h / 2 + 6;
    [[w * 0.27, r1, sol.W1, 'Avant', sol.I1, sol.w1], [w * 0.73, r2, sol.W2, 'Après', sol.I2, sol.w2]].forEach(([x, r, W, nom, I, ww]) => {
      rueda(g, x, cy, Math.max(r, 8), 'cilindro');
      const arco = 0.6 + 4.6 * (W / wmax);
      giro(g, x, cy, Math.max(r, 8) + 12, col['--accent'], -Math.PI / 2 - arco / 2, -Math.PI / 2 + arco / 2);
      texto(g, x, 16, nom, col['--ink'], 'center', '600 ');
      texto(g, x, h - 14, `I = ${txt(f(I))} kg·m², ω = ${txt(f(ww))} ${sol.rpm ? 'rpm' : 'rad/s'}`, col['--muted']);
    });
    flecha(g, w / 2 - 20, cy, w / 2 + 20, cy, col['--muted'], 1.6);
  }

  function eje(g, x, y) {
    g.strokeStyle = col['--accent']; g.lineWidth = 1.6;
    g.beginPath(); g.arc(x, y, 7, 0, 2 * Math.PI); g.stroke(); g.beginPath(); g.moveTo(x - 5, y - 5); g.lineTo(x + 5, y + 5); g.moveTo(x + 5, y - 5); g.lineTo(x - 5, y + 5); g.stroke();
  }
  function pieza(g, clave, x, y, L, b, k, phi = 0) {
    g.save(); g.translate(x, y); g.rotate(phi);
    g.fillStyle = col['--cuerpo']; g.strokeStyle = col['--muted']; g.lineWidth = 1.4;
    if (clave === 'varilla') { g.fillRect((-L * k) / 2, -5, L * k, 10); g.strokeRect((-L * k) / 2, -5, L * k, 10); }
    else if (clave === 'placa') { g.fillRect((-L * k) / 2, (-b * k) / 2, L * k, b * k); g.strokeRect((-L * k) / 2, (-b * k) / 2, L * k, b * k); }
    else if (clave === 'punto') { g.fillStyle = col['--ink']; g.beginPath(); g.arc(0, 0, 6, 0, 2 * Math.PI); g.fill(); }
    else if (clave === 'disco-diametro') { g.beginPath(); g.ellipse(0, 0, L * k, L * k * 0.35, 0, 0, 2 * Math.PI); g.fill(); g.stroke(); }
    else rueda(g, 0, 0, Math.max(4, L * k), clave);
    g.restore();
  }

  function dibujaCompuesto(g, w, h) {
    const P = sol.piezas;
    const lin = String(sc.piezas).split(/\n|;/).map((x) => x.trim()).filter(Boolean).map((l) => l.split(/\s+/));
    const ext = Math.max(...P.map((p, i) => p.d + (lin[i][0] === 'punto' ? 0.02 : (lin[i][0] === 'varilla' || lin[i][0] === 'placa' ? 0.5 : 1) * +String(lin[i][2]).replace(',', '.'))), 1e-6);
    const ax = w / 2, cy = h / 2, k = (Math.min(w / 2 - 20, h / 2 - 20)) / ext;
    const usados = {};
    P.forEach((p, i) => {
      const clave = lin[i][0], L = clave === 'punto' ? 0 : +String(lin[i][2]).replace(',', '.'), b = +String(lin[i][4] || 0).replace(',', '.');
      const n = (usados[p.d] = (usados[p.d] || 0) + 1), lado = p.d === 0 ? 1 : n % 2 ? 1 : -1;
      pieza(g, clave, ax + lado * p.d * k, cy, L, b, k);
      texto(g, ax + lado * p.d * k, cy + Math.max(14, (clave === 'punto' ? 0 : clave === 'varilla' ? 0.05 : L) * k) + 12, `${i + 1}`, col['--muted']);
    });
    eje(g, ax, cy); giro(g, ax, cy, 20, col['--accent']);
    texto(g, 12, 16, `I = ${txt(f(sol.I))} kg·m²`, col['--accent'], 'left', '600 ');
  }

  function dibujaBala(g, w, h) {
    const px = w / 2, py = 24, k = (h - 60) / sol.L, Lp = sol.L * k;
    if (!sol.vuelta) { g.save(); g.globalAlpha = 0.35; g.setLineDash([5, 4]); g.translate(px, py); g.rotate(-sol.sube * Math.PI / 180); g.strokeStyle = col['--muted']; g.lineWidth = 1.4; g.strokeRect(-5, 0, 10, Lp); g.restore(); g.setLineDash([]); }
    pieza(g, 'varilla', px, py + Lp / 2, sol.L, 0, k, Math.PI / 2);
    eje(g, px, py);
    const yb = py + sol.r * k;
    g.fillStyle = col['--peso']; g.beginPath(); g.arc(px, yb, 4.5, 0, 2 * Math.PI); g.fill();
    flecha(g, px - 120, yb, px - 14, yb, col['--peso']); texto(g, px - 120, yb - 12, `v = ${txt(f(sol.v))} m/s`, col['--peso'], 'left');
    giro(g, px, py, 30, col['--accent'], 0.6, 2.4); texto(g, px + 40, py + 24, `ω = ${txt(f(sol.W))} rad/s`, col['--accent'], 'left', '600 ');
    texto(g, px + 14, yb, `r = ${txt(f(sol.r))} m`, col['--muted'], 'left');
    if (!sol.vuelta) texto(g, px + 46, py + 52, `monte de ${txt(f(sol.sube))}°`, col['--muted'], 'left');
  }

  function dibujaPlataforma(g, w, h) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 24, k = R / sol.L, rp = sol.r * k;
    rueda(g, cx, cy, R, 'cilindro');
    g.fillStyle = col['--peso']; g.beginPath(); g.arc(cx + rp, cy, 7, 0, 2 * Math.PI); g.fill();
    if (sol.v) flecha(g, cx + rp, cy, cx + rp, cy - Math.sign(sol.v) * Math.min(60, 12 * Math.abs(sol.v)), col['--peso']);
    giro(g, cx, cy, R + 12, col['--accent'], 0.4, -1.4, true);
    texto(g, 12, 16, `ω₁ = ${txt(f((sol.W1 * 60) / (2 * Math.PI)))} tr/min → ω₂ = ${txt(f(sol.w2))} tr/min`, col['--accent'], 'left', '600 ');
  }

  function dibujaPendulo(g, w, h) {
    const C = sol.C, cae = sol.tipo === 'cae', lc = sc.cuerpo === 'varilla' ? sol.d + sol.L / 2 : sc.cuerpo === 'placa' ? sol.d + Math.hypot(sol.L, sol.b) / 2 : sol.d + sol.L;
    const px = w / 2, py = cae ? h - 30 : 30, k = (h - 70) / Math.max(lc, sol.Leq || 0, 1e-6), th = sol.mov(tAnim).th;
    const ang = cae ? -Math.PI / 2 + th : Math.PI / 2 - th, cxm = px + sol.d * k * Math.cos(ang), cym = py + sol.d * k * Math.sin(ang);
    if (!cae) { const ex = px + sol.Leq * k * Math.cos(ang), ey = py + sol.Leq * k * Math.sin(ang); g.strokeStyle = col['--muted']; g.setLineDash([5, 4]); g.lineWidth = 1; g.beginPath(); g.moveTo(px, py); g.lineTo(ex, ey); g.stroke(); g.setLineDash([]); g.fillStyle = col['--muted']; g.beginPath(); g.arc(ex, ey, 4, 0, 2 * Math.PI); g.fill(); }
    if (cae) { g.strokeStyle = col['--suelo']; g.lineWidth = 2; g.beginPath(); g.moveTo(20, py); g.lineTo(w - 20, py); g.stroke(); }
    pieza(g, sc.cuerpo, cxm, cym, sol.L, sol.b, k, sc.cuerpo === 'varilla' ? ang : 0);
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(cxm, cym, 3, 0, 2 * Math.PI); g.fill();
    eje(g, px, py);
    texto(g, 12, 16, cae ? `θ = ${txt(f(th / (Math.PI / 180), 3))}°` : `T = ${txt(f(sol.periodo))} s`, col['--accent'], 'left', '600 ');
  }

  function dibujaEscalera(g, w, h) {
    const t = sol.th * Math.PI / 180, wx = w - 40, fy = h - 24, k = Math.min((wx - 40) / Math.cos(t), (fy - 20) / Math.sin(t)) / sol.L * 0.95;
    const bx = wx - sol.L * k * Math.cos(t), top = fy - sol.L * k * Math.sin(t);
    g.strokeStyle = col['--suelo']; g.lineWidth = 3; g.beginPath(); g.moveTo(10, fy); g.lineTo(wx, fy); g.lineTo(wx, 8); g.stroke();
    g.strokeStyle = col['--cuerpo']; g.lineWidth = 8; g.beginPath(); g.moveTo(bx, fy); g.lineTo(wx, top); g.stroke();
    const at = (s) => [bx + s * k * Math.cos(t), fy - s * k * Math.sin(t)], E = 70 / Math.max(sol.N1, 1e-9);
    const [mx, my] = at(sol.L / 2); flecha(g, mx, my, mx, my + sol.M * 9.8 * E, col['--peso']); texto(g, mx + 8, my + sol.M * 9.8 * E * 0.7, 'Mg', col['--peso'], 'left', '600 ');
    if (sol.m) { const [qx, qy] = at(sol.s); g.fillStyle = col['--fuerza']; g.beginPath(); g.arc(qx, qy - 8, 7, 0, 2 * Math.PI); g.fill(); flecha(g, qx, qy, qx, qy + sol.m * 9.8 * E, col['--peso']); texto(g, qx + 8, qy + sol.m * 9.8 * E * 0.7, 'mg', col['--peso'], 'left', '600 '); }
    flecha(g, bx, fy, bx, fy - sol.N1 * E, col['--normal']); texto(g, bx - 8, fy - sol.N1 * E * 0.8, 'N₁', col['--normal'], 'right', '600 ');
    flecha(g, bx, fy - 2, bx + sol.Fr * E, fy - 2, col['--roz']); texto(g, bx + sol.Fr * E / 2, fy + 12, 'Fr', col['--roz'], 'center', '600 ');
    flecha(g, wx, top, wx - sol.N2 * E, top, col['--tension']); texto(g, wx - sol.N2 * E - 6, top, 'N₂', col['--tension'], 'right', '600 ');
    texto(g, bx + 44, fy - 12, `θ = ${txt(f(sol.th))}°`, col['--muted'], 'left');
  }

  function dibujaViga(g, w, h) {
    const k = (w - 60) / sol.L, x = (u) => 30 + u * k, yb = h / 2, W = sol.todas.reduce((s_, c) => s_ + c.m * 9.8, 0), E = Math.min(70, h / 2 - 30) / Math.max(W, Math.abs(sol.RA), Math.abs(sol.RB), 1e-9);
    g.fillStyle = col['--cuerpo']; g.strokeStyle = col['--muted']; g.lineWidth = 1.4; g.fillRect(x(0), yb - 6, sol.L * k, 12); g.strokeRect(x(0), yb - 6, sol.L * k, 12);
    for (const [u, nom, R] of [[sol.xA, 'A', sol.RA], [sol.xB, 'B', sol.RB]]) {
      g.fillStyle = col['--suelo']; g.beginPath(); g.moveTo(x(u), yb + 6); g.lineTo(x(u) - 10, yb + 24); g.lineTo(x(u) + 10, yb + 24); g.closePath(); g.fill();
      flecha(g, x(u), yb + 6, x(u), yb + 6 - R * E, col['--normal']); texto(g, x(u) + 8, yb - 12 - Math.abs(R) * E * 0.5, `R${nom}`, col['--normal'], 'left', '600 ');
    }
    for (const c of sol.todas) { flecha(g, x(c.x), yb - 6 - c.m * 9.8 * E, x(c.x), yb - 6, col['--peso']); texto(g, x(c.x), yb - 14 - c.m * 9.8 * E, `${txt(f(c.m))} kg`, col['--peso']); }
    texto(g, x(0), yb + 40, '0', col['--muted']); texto(g, x(sol.L), yb + 40, `${txt(f(sol.L))} m`, col['--muted']);
  }

  let t0 = null, tAnim = 0, parado = false;
  function bucle(ts) {
    if (!parado && sol && sol.mov) {
      if (t0 === null) t0 = ts;
      const T = sol.T_ || sol.T, ciclo = T + 0.8;
      tAnim = Math.min(((ts - t0) / 1000) % ciclo, T);
      dibuja();
    }
    requestAnimationFrame(bucle);
  }
  $('#play').addEventListener('click', () => { parado = !parado; $('#play').textContent = parado ? '▶ Reprendre' : '⏸ Pause'; });

  function dibuja() {
    const c = $('#escena'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = 'round'; g.lineJoin = 'round';
    if (!sol) return;
    colores();
    const fn = sol.modo === 'choque' ? (sol.tipo === 'bala' ? dibujaBala : dibujaPlataforma) : sol.modo === 'equilibrio' ? (sol.tipo === 'viga' ? dibujaViga : dibujaEscalera)
      : { inercia: dibujaInercia, compuesto: dibujaCompuesto, rodadura: dibujaRodadura, polea: dibujaPolea, momento: dibujaMomento, pendulo: dibujaPendulo }[sol.modo];
    fn(g, w, h);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', dibuja);

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('solido-rigido').current;
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const tipos = [
      () => ({ modo: 'inercia', cuerpo: de(['varilla', 'cilindro', 'esfera', 'aro']), M: String(ent(1, 10)), L: c(de([0.2, 0.3, 0.5, 1, 1.2])), d: c(de([0, 0.1, 0.2, 0.5])) }),
      () => ({ modo: 'rodadura', cuerpo: de(['esfera', 'cilindro', 'aro', 'esfera-hueca']), g: '9,8', M: String(ent(1, 5)), L: c(de([0.05, 0.1, 0.2])), theta: String(de([20, 25, 30, 37])), d: String(ent(2, 6)), mu: '' }),
      () => ({ modo: 'polea', cuerpo: de(['cilindro', 'aro']), g: '9,8', M: String(ent(1, 6)), L: c(de([0.1, 0.15, 0.2])), m: String(ent(1, 5)), d: String(ent(1, 3)) }),
      () => ({ modo: 'momento', I1: c(de([2, 3, 4.5, 6])), w1: String(de([30, 45, 60, 90])), I2: c(de([1, 1.5, 2])), unidad: 'rpm' }),
      () => ({ modo: 'choque', tipo: 'bala', g: '9,8', M: String(ent(1, 4)), L: '1', m: c(de([0.005, 0.01, 0.02])), v: String(de([200, 300, 400])), r: c(de([0.5, 0.8, 1])) }),
      () => ({ modo: 'pendulo', tipo: 'oscila', cuerpo: 'varilla', g: '9,8', M: String(ent(1, 3)), L: c(de([0.5, 1, 1.5])), d: '', th0: '10' }),
      () => ({ modo: 'equilibrio', tipo: 'escalera', g: '9,8', M: String(ent(8, 20)), L: String(ent(3, 6)), theta: String(de([53, 60, 65, 70])), m: String(ent(50, 90)), s: '2', mu: '' }),
    ];
    sc = de(tipos)();
    if (sc.modo === 'pendulo') sc.d = c(String(+sc.L.replace(',', '.') / 2));
    formulario(); sel.value = ''; calcula(); t0 = null;
  }
  const enunciado = () => {
    const e = (x) => esc(String(x ?? '').replace('.', ',')), C = S.CUERPOS[sc.cuerpo], g = `(g = ${e(sc.g)} m/s²)`;
    if (sc.modo === 'inercia') return `Calcule le moment d’inertie d’un(e) ${e(C.nombre.toLowerCase())} de ${e(sc.M)} kg et de ${C.med === 'L' ? 'longueur' : 'rayon'} ${e(sc.L)} m par rapport à un axe parallèle à celui qui passe par son centre${+String(sc.d).replace(',', '.') ? ` et situé à ${e(sc.d)} m de celui-ci` : ' (par le centre)'}.`;
    if (sc.modo === 'rodadura') return `Un(e) ${e(C.nombre.split(' (')[0].toLowerCase())} de ${e(sc.M)} kg et de ${e(sc.L)} m de rayon descend en roulant sans glisser, depuis le repos, sur un plan incliné à ${e(sc.theta)}° ${g}. Calcule son accélération, la force de frottement, le μ minimal et la vitesse après un parcours de ${e(sc.d)} m.`;
    if (sc.modo === 'polea') return `Une poulie (${e(C.nombre.toLowerCase())}) de ${e(sc.M)} kg et de ${e(sc.L)} m de rayon porte un corps de ${e(sc.m)} kg suspendu par la corde enroulée ${g}. Calcule l’accélération, la tension et la vitesse après une descente de ${e(sc.d)} m.`;
    if (sc.modo === 'momento') return `Une patineuse dont le moment d’inertie est de ${e(sc.I1)} kg·m² tourne à ${e(sc.w1)} tr/min et ramène les bras jusqu’à ${e(sc.I2)} kg·m². Calcule sa nouvelle vitesse angulaire, le moment cinétique et l’énergie cinétique avant et après.`;
    if (sc.modo === 'choque') return `Une balle de ${e(sc.m)} kg à ${e(sc.v)} m/s se fiche à ${e(sc.r)} m du pivot d’une tige de ${e(sc.M)} kg et de ${e(sc.L)} m suspendue par une extrémité ${g}. Calcule la vitesse angulaire après le choc, l’énergie perdue et l’angle de montée.`;
    if (sc.modo === 'pendulo') return `Une tige de ${e(sc.M)} kg et de ${e(sc.L)} m oscille suspendue par une extrémité ${g}. Calcule la période des petites oscillations, la longueur du pendule simple équivalent et la vitesse angulaire au passage par le bas si on la lâche depuis ${e(sc.th0)}°.`;
    return `Une échelle de ${e(sc.M)} kg et de ${e(sc.L)} m s’appuie contre un mur lisse en formant ${e(sc.theta)}° avec le sol. Une personne de ${e(sc.m)} kg monte de ${e(sc.s)} m ${g}. Calcule les réactions normales du sol et du mur, le frottement et le μ minimal pour qu’elle ne glisse pas.`;
  };

  formulario(); calcula(); requestAnimationFrame(bucle);
  Constantes.monta(document.querySelector('.layout .card'));
  window.SolidoApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, I: sol.I, a: sol.a, v: sol.v, T: sol.T, w2: sol.w2, rueda: sol.rueda }, estado: () => copia(sc) };
})();

