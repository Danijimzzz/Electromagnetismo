(() => {
  const { $, esc, copia, txt } = Herramienta;
  const F = Fuerza, f = F.f, CLAVE = 'fuerza-v1';
  const MODOS = [['trayectoria', 'Trajectoire avec E et B dans une direction quelconque (3D)'], ['espejo', 'Miroir magnétique (bouteille)'], ['carga', 'Charge dans un champ B (cercle ou hélice)'], ['franja', 'Charge entrant dans une bande de champ'], ['vectorial', 'Force de Lorentz avec des vecteurs'], ['cruzados', 'Champs E et B croisés (cycloïde)'], ['selector', 'Sélecteur de vitesses et spectromètre'], ['ciclotron', 'Cyclotron'], ['hall', 'Effet Hall'], ['hilo', 'Force sur un fil'], ['espira', 'Couple sur une spire'], ['paralelos', 'Force entre deux fils parallèles']];
  const PARTS = [['proton', 'Proton'], ['electron', 'Électron'], ['alfa', 'Particule α'], ['deuteron', 'Deutéron'], ['otra', 'Autre (je saisis q et m)']];

  let sc = copia(F.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const tres = (p, nom, un) => `<label>${nom} <small>${un}</small></label><div class="tres">${['x', 'y', 'z'].map((e) => `<input id="f-${p}${e}" class="in" data-k="${p}${e}" value="${esc(sc[p + e] ?? '')}" inputmode="decimal" autocomplete="off" placeholder="${e}" aria-label="${nom}, composante ${e}">`).join('')}</div>`;
  const sentidoB = () => elige('sentidoB', 'Sens de B', [['entrante', '⊗ Entrant (vers l\'écran)'], ['saliente', '⊙ Sortant']]);
  const particula = (conM = true) => elige('part', 'Particule', PARTS) + (sc.part === 'otra' ? fila('q', 'Charge q', 'C') + fila('m', conM ? 'Masse m' : 'Masse m (facultatif)', 'kg') : '');
  const veloc = (op = false) => elige('uv', 'Je donne', [['ms', 'la vitesse v (m/s)'], ['eV', 'l\'énergie cinétique (eV)'], ['V', 'la ddp qui l\'accélère (V)']]) + fila('v', `${sc.uv === 'eV' ? 'Énergie cinétique' : sc.uv === 'V' ? 'Différence de potentiel' : 'Vitesse v'}${op ? ' (opcional)' : ''}`, sc.uv === 'eV' ? 'eV' : sc.uv === 'V' ? 'V' : 'm/s');
  const NOTAS = {
    trayectoria: 'La particule part de l\'origine. Saisissez les trois composantes de v, B et E (celles qui manquent valent 0). L\'équation de Lorentz est intégrée pas à pas (Runge-Kutta 4) et dessinée en 3D et en projections. On accepte 2e5 ou 2·10^5.',
    espejo: 'Bouteille magnétique B(z) = B₀(1 + z²/L²) avec les extrémités en z = ±L√(Rm − 1). La particule part du centre ; α₀ est l\'angle entre v et B en ce point (90° = elle tourne sans avancer). Elle est intégrée en 3D et comparée à la théorie du moment magnétique.',
    carga: 'θ est l\'angle entre v et B : avec 90°, la trajectoire est un cercle et avec un autre angle, une hélice. On accepte 2e6 ou 2·10^6.',
    vectorial: 'Saisissez les composantes en unités SI. E est facultatif : avec E, on obtient la force de Lorentz complète F = q(E + v × B).',
    franja: 'La particule entre perpendiculairement au bord d\'une bande de largeur d avec un B uniforme ; en dehors, il n\'y a pas de champ.',
    cruzados: 'E vers le haut et B sortant (⊙), perpendiculaires. La vitesse initiale est dirigée vers la droite ; vide ou 0, elle part du repos.',
    selector: 'Plaque positive en haut (E vers le bas) et B entrant. Si vous laissez v vide, on prend celle qui passe sans déviation ; B′ est le champ du spectromètre, facultatif. Avec la masse d\'un second isotope (en u, même charge), on obtient la séparation des impacts.',
    hall: 'Plaque avec le courant vers la droite et B perpendiculaire à celle-ci. t est l\'épaisseur dans la direction de B et w la largeur, où l\'on mesure V_H (facultatif).',
    espira: 'θ est l\'angle entre la normale à la spire (le moment magnétique) et B : avec 90°, le couple est maximal.',
    ciclotron: 'R est le rayon des dees, où la particule sort. Avec la ddp entre les dees, on calcule le nombre de tours.',
    hilo: 'θ est l\'angle entre le fil et B (90° s\'il est perpendiculaire). Avec la masse du fil, on calcule le courant pour qu\'il flotte.',
    paralelos: 'Fils rectilignes, longs et parallèles séparés d\'une distance d. Sans L, on donne la force par mètre.',
  };
  function formulario() {
    let h = elige('modo', 'Situation', MODOS);
    if (sc.modo === 'carga') h += particula() + veloc() + fila('B', 'Champ B', 'T') + sentidoB() + fila('th', 'Angle entre v et B θ', '°');
    else if (sc.modo === 'trayectoria') h += particula() + tres('v', 'Vitesse initiale v', 'm/s') + tres('B', 'Champ B', 'T') + tres('E', 'Champ électrique E', 'V/m') + sep('Facultatif') + fila('tt', 'Temps d\'intégration', 's (vide = 5 tours)');
    else if (sc.modo === 'espejo') h += particula() + veloc() + fila('B0', 'Champ au centre B₀', 'T') + fila('Rm', 'Rapport de miroir Bmax/B₀', '') + fila('L', 'Longueur caractéristique L', 'm') + fila('au', 'Angle entre v et B au centre α₀', '°');
    else if (sc.modo === 'vectorial') h += particula(false) + tres('v', 'Vitesse v', 'm/s') + tres('B', 'Champ B', 'T') + sep('Facultatif') + tres('E', 'Champ électrique E', 'V/m');
    else if (sc.modo === 'selector') h += particula() + fila('E', 'Champ électrique E', 'V/m') + fila('B', 'Champ B du sélecteur', 'T') + sep('Facultatif') + veloc(true) + fila('B2', 'Champ B′ du spectromètre', 'T') + fila('m2', 'Masse d\'un second isotope', 'u');
    else if (sc.modo === 'ciclotron') h += particula() + fila('B', 'Champ B', 'T') + fila('R', 'Rayon des dees R', 'm') + fila('V', 'Ddp entre les dees (facultatif)', 'V');
    else if (sc.modo === 'franja') h += particula() + veloc() + fila('B', 'Champ B', 'T') + sentidoB() + fila('d', 'Largeur de la bande d', 'm');
    else if (sc.modo === 'cruzados') h += particula() + fila('E', 'Champ électrique E (↑)', 'V/m') + fila('B', 'Champ B (⊙)', 'T') + fila('v0', 'Vitesse initiale (→, facultatif)', 'm/s');
    else if (sc.modo === 'hall') h += elige('portador', 'Porteurs', [['electrones', 'Électrons (métal, type n)'], ['huecos', 'Trous (type p)']]) + fila('I', 'Courant I', 'A') + fila('B', 'Champ B', 'T') + sentidoB() + fila('t', 'Épaisseur t (dans la direction de B)', 'm') + fila('w', 'Largeur w (facultatif)', 'm') + elige('dato', 'Je donne', [['n', 'la densité de porteurs n'], ['VH', 'la tension de Hall mesurée']]) + (sc.dato === 'VH' ? fila('VH', 'Tension de Hall V_H', 'V') : fila('n', 'Densité de porteurs n', 'm⁻³'));
    else if (sc.modo === 'espira') h += fila('N', 'Tours N', '') + fila('I', 'Courant I', 'A') + elige('forma', 'Forme', [['rect', 'Rectangulaire (a × b)'], ['circ', 'Circulaire (rayon R)']]) + (sc.forma === 'circ' ? fila('R', 'Rayon R', 'm') : fila('a', 'Côté a (perpendiculaire à B)', 'm') + fila('b', 'Côté b', 'm')) + fila('B', 'Champ B', 'T') + fila('th', 'Angle entre la normale et B θ', '°');
    else if (sc.modo === 'hilo') h += fila('I', 'Courant I', 'A') + elige('sentidoI', 'Sens de I', [['derecha', '→ Vers la droite'], ['izquierda', '← Vers la gauche']]) + fila('L', 'Longueur L', 'm') + fila('B', 'Champ B', 'T') + sentidoB() + fila('th', 'Angle entre le fil et B θ', '°') + fila('m', 'Masse du fil (facultatif)', 'kg');
    else h += fila('I1', 'Courant I₁', 'A') + fila('I2', 'Courant I₂', 'A') + elige('sentido', 'Sens', [['mismo', 'Le même sens'], ['opuesto', 'Sens contraires']]) + fila('d', 'Distance d', 'm') + fila('L', 'Longueur L (facultatif)', 'm');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(F.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else {
      sc[k] = t.value;
      if (k === 'part' && t.value === 'otra' && !sc.q) { sc.q = '1,6e-19'; sc.m = sc.modo === 'vectorial' ? '' : '1,67e-27'; }
      if (k === 'uv' && sc.v) sc.v = { ms: '1e6', eV: '1000', V: '1000' }[t.value];
      if (k === 'forma') { if (t.value === 'circ' && !sc.R) sc.R = '0,1'; if (t.value === 'rect' && !sc.a) { sc.a = '0,1'; sc.b = '0,05'; } }
      if (k === 'dato') { if (t.value === 'VH' && !sc.VH) sc.VH = '1e-5'; if (t.value === 'n' && !sc.n) sc.n = '8,5e28'; }
    }
    formulario(); cambia();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Exemples…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${F.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = F.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), nz = (a, b) => { let v; do v = ent(a, b); while (!v); return v; }, de = (l) => l[ent(0, l.length - 1)];
    const dec = (a, b) => String(ent(a, b) / 10).replace('.', ','), P0 = { q: '', m: '' };
    const tipos = [
      () => ({ modo: 'carga', part: de(['proton', 'electron', 'alfa']), ...P0, uv: 'ms', v: `${ent(1, 9)}e${ent(5, 6)}`, B: dec(1, 10), th: de(['90', '90', '30', '45', '60']), sentidoB: de(['entrante', 'saliente']) }),
      () => ({ modo: 'carga', part: de(['proton', 'electron']), ...P0, uv: 'V', v: String(ent(1, 20) * 100), B: dec(1, 5), th: '90', sentidoB: de(['entrante', 'saliente']) }),
      () => ({ modo: 'vectorial', part: de(['proton', 'electron']), ...P0, vx: `${nz(-5, 5)}e5`, vy: `${ent(-5, 5)}e5`, vz: '0', Bx: '0', By: dec(-5, 5), Bz: dec(1, 8), Ex: '', Ey: '', Ez: '' }),
      () => { const B = dec(1, 5); return { modo: 'selector', part: de(['proton', 'deuteron', 'alfa']), ...P0, uv: 'ms', v: '', E: `${ent(1, 9)}e4`, B, B2: dec(2, 10) }; },
      () => ({ modo: 'ciclotron', part: de(['proton', 'deuteron', 'alfa']), ...P0, B: dec(5, 20), R: dec(3, 10), V: `${ent(1, 9)}e4` }),
      () => ({ modo: 'hilo', I: String(ent(1, 10)), sentidoI: de(['derecha', 'izquierda']), L: dec(1, 10), B: dec(1, 10), th: de(['90', '90', '30', '60']), sentidoB: de(['entrante', 'saliente']), m: '' }),
      () => ({ modo: 'franja', part: de(['proton', 'electron', 'alfa']), ...P0, uv: 'ms', v: `${ent(1, 9)}e${de(['5', '6'])}`, B: dec(1, 10), sentidoB: de(['entrante', 'saliente']), d: String(ent(1, 10) / 100).replace('.', ',') }),
      () => ({ modo: 'cruzados', part: de(['proton', 'electron']), ...P0, E: String(ent(1, 20) * 100), B: dec(1, 5), v0: '' }),
      () => ({ modo: 'hall', portador: de(['electrones', 'huecos']), I: String(ent(1, 20)), B: dec(1, 20), sentidoB: de(['entrante', 'saliente']), t: `${ent(1, 9)}e-4`, w: String(ent(1, 5) / 100).replace('.', ','), dato: 'n', n: `${ent(1, 9)}e${de(['22', '28'])}`, VH: '' }),
      () => ({ modo: 'espira', N: String(de([1, 10, 20, 50, 100])), I: String(ent(1, 10)), forma: 'rect', a: dec(1, 3), b: dec(1, 3), R: '', B: dec(1, 10), th: de(['30', '45', '60', '90']) }),
      () => ({ modo: 'paralelos', I1: String(ent(1, 20)), I2: String(ent(1, 20)), sentido: de(['mismo', 'opuesto']), d: String(ent(1, 20) / 100).replace('.', ','), L: de(['', '1', '2']) }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const PNOM = { proton: 'un proton', electron: 'un électron', alfa: 'une particule α', deuteron: 'un deutéron' };
  const enunciado = () => {
    const p = PNOM[sc.part] || `une particule de charge ${esc(sc.q)} C${sc.m ? ` et de masse ${esc(sc.m)} kg` : ''}`;
    const vel = () => (sc.uv === 'eV' ? `avec une énergie cinétique de ${esc(sc.v)} eV` : sc.uv === 'V' ? `après accélération depuis le repos par une ddp de ${esc(sc.v)} V` : `a ${esc(sc.v)} m/s`);
    const vec = (k) => `(${['x', 'y', 'z'].map((e) => esc(sc[k + e] || '0')).join(', ')})`;
    if (sc.modo === 'trayectoria') return `${p[0].toUpperCase() + p.slice(1)} part de l'origine avec v = ${vec('v')} m/s dans une région où B = ${vec('B')} T et E = ${vec('E')} V/m. Calculez le rayon de giration, la dérive et l'énergie cinétique finale.`;
    if (sc.modo === 'espejo') return `${p[0].toUpperCase() + p.slice(1)} ${vel()} part du centre d'une bouteille magnétique avec B₀ = ${esc(sc.B0)} T et un rapport de miroir de ${esc(sc.Rm)}, en formant ${esc(sc.al)}° avec B. Est-elle piégée ? Calculez l'angle du cône de perte et la période de rebond.`;
    if (sc.modo === 'carga') return `${p[0].toUpperCase() + p.slice(1)} entre ${vel()} dans un champ B = ${esc(sc.B)} T, en formant ${esc(sc.th || '90')}° avec lui. Calculez la force, le rayon${sc.th && sc.th !== '90' ? ' et le pas de cette hélice' : ''} et la période.`;
    if (sc.modo === 'vectorial') return `Calculez la force sur ${p} avec v = ${vec('v')} m/s dans B = ${vec('B')} T${['x', 'y', 'z'].some((e) => sc['E' + e]) ? ` et E = ${vec('E')} V/m` : ''}.`;
    if (sc.modo === 'selector') return `Dans un sélecteur de vitesses avec E = ${esc(sc.E)} V/m et B = ${esc(sc.B)} T, quelle vitesse passe sans déviation ?${sc.B2 ? ` Si ${p} sort et entre dans B′ = ${esc(sc.B2)} T, quel rayon décrit-il ?` : ''}`;
    if (sc.modo === 'ciclotron') return `Un cyclotron accélère ${p} avec B = ${esc(sc.B)} T et des dees de rayon ${esc(sc.R)} m. Calculez la fréquence, la vitesse et l'énergie de sortie${sc.V ? ` et le nombre de tours avec ${esc(sc.V)} V entre les dees` : ''}.`;
    if (sc.modo === 'franja') return `${p[0].toUpperCase() + p.slice(1)} entre ${vel()} perpendiculairement au bord d'une bande de largeur ${esc(sc.d)} m avec un champ B = ${esc(sc.B)} T. Traverse-t-il la bande ? Calculez le rayon, l'angle de sortie et le temps passé à l'intérieur.`;
    if (sc.modo === 'cruzados') return `${p[0].toUpperCase() + p.slice(1)} ${sc.v0 && +String(sc.v0).replace(',', '.') ? `se déplace à ${esc(sc.v0)} m/s` : 'est au repos'} dans une région où E = ${esc(sc.E)} V/m et B = ${esc(sc.B)} T sont perpendiculaires. Calculez la vitesse de dérive, la distance dont elle s'écarte de la droite initiale et sa vitesse maximale.`;
    if (sc.modo === 'hall') return `Une plaque d'épaisseur ${esc(sc.t)} m${sc.w ? ` et de largeur ${esc(sc.w)} m` : ''}, avec des ${sc.portador === 'huecos' ? 'trous' : 'électrons'} comme porteurs, est parcourue par ${esc(sc.I)} A dans un champ de ${esc(sc.B)} T. ${sc.dato === 'VH' ? `On mesure une tension de Hall de ${esc(sc.VH)} V : calculez la densité de porteurs.` : `Avec n = ${esc(sc.n)} m⁻³, calculez la tension de Hall.`}`;
    if (sc.modo === 'espira') return `Une ${sc.forma === 'circ' ? `spire circulaire de rayon ${esc(sc.R)} m` : `spire rectangulaire de ${esc(sc.a)} × ${esc(sc.b)} m`}${sc.N && sc.N !== '1' ? ` de ${esc(sc.N)} spires` : ''} est parcourue par ${esc(sc.I)} A dans un champ B = ${esc(sc.B)} T dont la direction forme ${esc(sc.th || '90')}° avec la normale. Calculez le moment magnétique, le couple et l'énergie.`;
    if (sc.modo === 'hilo') return `Un fil de ${esc(sc.L)} m parcouru par ${esc(sc.I)} A est placé dans un champ B = ${esc(sc.B)} T à ${esc(sc.th || '90')}° du fil. Calculez la force qui s'exerce sur lui.`;
    return `Deux fils parallèles séparés de ${esc(sc.d)} m sont parcourus par ${esc(sc.I1)} A et ${esc(sc.I2)} A dans ${sc.sentido === 'opuesto' ? 'des sens contraires' : 'le même sens'}. Calculez la force ${sc.L ? `sur ${esc(sc.L)} m` : 'par mètre'} et dites s'ils s'attirent ou se repoussent.`;
  };

  const dato = (t, v) => `<div><span>${t}</span>${v}</div>`;
  const ijk = (u, un) => { const t = u.map((x, i) => (Math.abs(x) < 1e-300 ? '' : `${x < 0 ? '−' : '+'} ${f(Math.abs(x))} <i class="uv">${'ijk'[i]}</i>`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−'); return t ? `(${t}) ${un}` : `0 ${un}`; };
  function calcula() {
    const err = $('#error');
    try { sol = F.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; $('#card3d').hidden = true; $('#desc3d').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tA = 0;
    let h = '', ley = '';
    if (sol.modo === 'carga') {
      h = dato('Force', `F = <b>${f(sol.F)} N</b>`);
      if (sol.F) h += dato('Rayon', `r = <b>${f(sol.r)} m</b>`) + dato('Période', `T = ${f(sol.T)} s`) + dato('Fréquence', `f = ${f(sol.f)} Hz`) + (sol.th !== 90 ? dato('Pas de l\'hélice', `p = <b>${f(sol.paso)} m</b>`) : dato('Sens de rotation', `<b>${sol.giro}</b>`));
      if (sc.uv && sc.uv !== 'ms') h += dato('Vitesse', `v = ${f(sol.v)} m/s`);
      ley = sol.F === 0 ? 'v est parallèle à B : il n\'y a pas de force et la particule continue tout droit.' : sol.th === 90 ? 'Vu de dessus, avec B perpendiculaire à l\'écran. Vert : vitesse ; rouge : force magnétique, toujours dirigée vers le centre.' : 'Vu de côté, avec B vers la droite : la particule tourne autour des lignes de champ tout en avançant (à l\'arrière, plus pâle).';
    } else if (sol.modo === 'trayectoria') {
      h = (sol.Bm ? dato('Fréquence de rotation', `ω<sub>c</sub> = ${f(sol.w)} rad/s · T<sub>c</sub> = ${f(sol.Tc)} s`) + dato('Rayon de giration', `r<sub>L</sub> = <b>${f(sol.rL)} m</b>`) : '') + (sol.hayE && sol.Bm ? dato('Dérive E × B', `v<sub>d</sub> = <b>${f(Math.hypot(...sol.vd))} m/s</b>`) : '') + (sol.hayE ? dato('Accélération le long de B', `a<sub>∥</sub> = ${f(sol.apar)} m/s²`) : '') + dato('Position finale', `(${sol.rf.map((x) => f(x)).join('; ')}) m`) + dato('Énergie cinétique', `${f(sol.KE0)} J → <b>${f(sol.KE1)} J</b>`) + dato('Travail du champ électrique', `q E·Δr = ${f(sol.WE)} J`);
      ley = 'En haut, la trajectoire vue de chaque côté (cercle : début ; carré : fin). En bas, l\'énergie cinétique en fonction du temps : elle ne change que sous l\'effet du champ électrique.';
    } else if (sol.modo === 'espejo') {
      h = dato('Angle du cône de perte', `α<sub>c</sub> = <b>${f((sol.ac * 180) / Math.PI)}°</b>`) + dato('Cette particule', sol.atrapada ? '<b>piégée</b>' : '<b>s\'échappe</b>') + dato('Moment magnétique', `μ = ${f(sol.mu)} J/T`) + dato('Variation de μ dans la simulation', `${f(sol.dev * 100)} %`) + (sol.atrapada ? dato('Point de rebroussement', `z<sub>t</sub> = L cot α₀ = <b>${f(sol.zt)} m</b> (simulé ${f(sol.zmax)} m)`) + dato('Période de rebond', `T<sub>b</sub> = 2πL/v<sub>⊥</sub> = <b>${f(sol.Tb)} s</b>${sol.TbSim ? ` (simulé ${f(sol.TbSim)} s)` : ''}`) : dato('Sort de la bouteille', `à t = ${f(sol.tEscapa)} s`)) + dato('Rayon de giration au centre', `r<sub>L</sub> = ${f(sol.rL)} m`);
      ley = 'En haut, vue latérale de la bouteille avec les lignes de B et la trajectoire. En bas, la hauteur z(t) et le moment magnétique μ(t) relatif à sa valeur initiale : elle rebondit sans que μ change.';
    } else if (sol.modo === 'vectorial') {
      h = dato('v × B', ijk(sol.vB, 'T·m/s')) + dato(sol.hayE ? 'Force magnétique' : 'Force', `F${sol.hayE ? '<sub>m</sub>' : ''} = <b>${ijk(sol.Fm, 'N')}</b>`) + dato(sol.hayE ? '|F<sub>m</sub>|' : 'Module', `${f(sol.Fmmod)} N`);
      if (sol.hayE) h += dato('Force de Lorentz', `F = <b>${ijk(sol.F, 'N')}</b>`) + dato('|F|', `${f(sol.Fmod)} N`);
      ley = `Vert : v ; bleu : B ; rouge : F${sol.hayE ? ' ; violet : E' : ''}. Chaque flèche a sa propre échelle. La vue tourne lentement pour montrer les trois dimensions.`;
    } else if (sol.modo === 'selector') {
      h = dato('Vitesse qui passe', `v = E/B = <b>${f(sol.vs)} m/s</b>`);
      if (sol.dado) h += dato('Cette particule', sol.des === 'si' ? `est déviée vers le <b>${sol.hacia}</b>` : '<b>passe sans déviation</b>');
      if (sol.r2 !== null) h += dato('Rayon dans le spectromètre', `r = <b>${f(sol.r2)} m</b>`) + dato('Distance à la fente (2r)', `${f(2 * sol.r2)} m`);
      if (sol.sepa !== null) h += dato('Rayon du second isotope', `r′ = ${f(sol.rb)} m`) + dato('Séparation des impacts', `Δx = <b>${f(sol.sepa)} m</b>`);
      ley = 'Plaque positive en haut (E vers le bas) et B entrant. Rouge : force électrique ; violet : magnétique. La déviation est exagérée pour qu\'elle se voie.';
    } else if (sol.modo === 'ciclotron') {
      h = dato('Fréquence', `f = <b>${f(sol.fr)} Hz</b>`) + dato('Vitesse de sortie', `v = <b>${f(sol.vmax)} m/s</b>`) + dato('Énergie de sortie', `E<sub>c</sub> = <b>${f(sol.Ec)} J</b>`) + dato('En MeV', `${f(sol.Ec / F.E0 / 1e6)} MeV`) + (sol.n !== null ? dato('Tours', `n = <b>${f(sol.n)}</b>`) + dato('Temps', `t = ${f(sol.t)} s`) : '');
      ley = `Les deux dees avec B entrant ; dans l'espace entre elles, la tension alternative l'accélère à chaque demi-tour et le rayon augmente. ${sol.n !== null && sol.n > 6 ? `Seuls quelques-uns des ${f(sol.n, 3)} tours sont dessinés.` : ''}`;
    } else if (sol.modo === 'franja') {
      h = dato('Rayon', `r = <b>${f(sol.r)} m</b>`) + (sol.cruza ? dato('Traverse la bande', `déviée de <b>α = ${f(sol.alfa)}°</b>`) + dato('Déplacement à la sortie', `y = ${f(sol.y)} m vers ${sol.hacia}`) : dato('Ne la traverse pas', `ressort par où elle est entrée, à <b>2r = ${f(sol.y)} m</b>`)) + dato('Temps à l\'intérieur', `t = <b>${f(sol.t)} s</b>`) + (sc.uv && sc.uv !== 'ms' ? dato('Vitesse', `v = ${f(sol.v)} m/s`) : '');
      ley = 'La bande ombrée contient le champ ; à l\'extérieur il n\'y en a pas. Vert : vitesse ; rouge : force magnétique.';
    } else if (sol.modo === 'cruzados') {
      h = dato('Vitesse de dérive', `v<sub>d</sub> = E/B = <b>${f(sol.vd)} m/s</b>`) + (sol.R ? dato('Rayon dans le référentiel mobile', `R = ${f(sol.R)} m`) + dato('Séparation maximale', `h = 2R = <b>${f(sol.h)} m</b>`) + dato('Vitesse maximale', `v<sub>max</sub> = <b>${f(sol.vmax)} m/s</b>`) + dato('Période', `T = ${f(sol.T)} s`) + dato('Avancée par période', `${f(sol.avance)} m`) : dato('Trajectoire', '<b>droite</b> : v = E/B'));
      ley = 'E vers le haut et B sortant (⊙). Violet : force électrique ; rouge : magnétique ; vert : vitesse. Le point gris avance avec la dérive E/B.';
    } else if (sol.modo === 'hall') {
      h = (sc.dato === 'VH' ? dato('Densité de porteurs', `n = <b>${f(sol.n)} m<sup>−3</sup></b>`) : dato('Tension de Hall', `V<sub>H</sub> = <b>${f(sol.VH)} V</b>`)) + dato('Coefficient de Hall', `R<sub>H</sub> = ${f(sol.RH)} m<sup>3</sup>/C`) + (sol.vd !== null ? dato('Vitesse de dérive', `v<sub>d</sub> = ${f(sol.vd)} m/s`) + dato('Champ de Hall', `E<sub>H</sub> = ${f(sol.EH)} V/m`) : '') + dato('Face au potentiel le plus élevé', `la face <b>${sol.alta}</b>`);
      ley = `Courant vers la droite. Les porteurs (${sol.huecos ? 'trous, +' : 'électrons, −'}) sont déviés et s'accumulent sur une face jusqu'à ce que le champ de Hall équilibre la force magnétique.`;
    } else if (sol.modo === 'espira') {
      h = dato('Moment magnétique', `m = N I S = <b>${f(sol.m)} A·m<sup>2</sup></b>`) + dato('Couple', `τ = <b>${f(sol.tau)} N·m</b>`) + dato('Énergie', `U = −m B cos θ = <b>${f(sol.U)} J</b>`) + dato('Travail depuis θ = 0°', `W = ${f(sol.W)} J`);
      ley = 'Vue de côté, avec B vers la droite : le couple fait tourner la spire vers θ = 0, avec m parallèle à B, et elle oscille autour de cette position (sans frottement). Bleu : B ; violet : m.';
    } else if (sol.modo === 'hilo') {
      h = dato('Force', `F = <b>${f(sol.F)} N</b>`) + dato('Par mètre', `F/L = ${f(sol.F / sol.L)} N/m`) + (sol.arriba !== null ? dato('Sens', `vers le <b>${sol.arriba ? 'haut' : 'bas'}</b>`) : '') + (sol.Iflota !== null ? dato('Courant pour qu\'il flotte', `I = <b>${f(sol.Iflota)} A</b>`) : '');
      ley = `Les points mobiles sont les charges du courant. Violet : force magnétique${sol.m !== null ? ' ; rouge : poids' : ''}.`;
    } else {
      h = dato('Force par mètre', `F/L = <b>${f(sol.FL)} N/m</b>`) + (sol.F !== null ? dato(`Force sur ${f(sol.L)} m`, `F = <b>${f(sol.F)} N</b>`) : '') + dato('Les fils', `<b>${sol.mismo ? 's\'attirent' : 'se repoussent'}</b>`) + dato('Champ de 1 en 2', `B<sub>1</sub> = ${f(sol.B1)} T`);
      ley = 'Les cercles sont les lignes de champ du fil 1. Violet : la force sur chaque fil.';
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    $('#leyenda').textContent = ley;
    const t3 = sol.modo === 'trayectoria' || sol.modo === 'espejo';
    $('#card3d').hidden = !t3; $('#desc3d').textContent = t3 ? descripcion3d() : '';
    dibuja(); if (t3) vista.dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--tension', '--cuerpo', '--panel', '--bg', '--peso', '--normal', '--fuerza', '--z1', '--z2']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = () => Herramienta.lienzo('#escena');
  const flecha = (g, x, y, dx, dy, L, color, lw = 2.4, et = '') => {
    const n = Math.hypot(dx, dy); if (!(n > 0) || !isFinite(n) || !(L > 0)) return;
    const ux = dx / n, uy = dy / n, x2 = x + ux * L, y2 = y + uy * L, a = 4 + lw;
    g.strokeStyle = g.fillStyle = color; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); g.lineTo(x2 - ux * a, y2 - uy * a); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - ux * a * 1.8 - uy * a, y2 - uy * a * 1.8 + ux * a); g.lineTo(x2 - ux * a * 1.8 + uy * a, y2 - uy * a * 1.8 - ux * a); g.closePath(); g.fill();
    if (et) { g.font = '600 13px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(et, x2 + ux * 12, y2 + uy * 12); }
  };
  function simbolos(g, x1, y1, x2, y2, entrante, paso = 36) {
    g.strokeStyle = g.fillStyle = col['--muted']; g.globalAlpha = 0.45; g.lineWidth = 1.2;
    for (let x = x1 + paso / 2; x < x2; x += paso) for (let y = y1 + paso / 2; y < y2; y += paso) {
      g.beginPath(); g.arc(x, y, 6, 0, 2 * Math.PI); g.stroke();
      if (entrante) { g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y + 4); g.moveTo(x + 4, y - 4); g.lineTo(x - 4, y + 4); g.stroke(); } else { g.beginPath(); g.arc(x, y, 1.8, 0, 2 * Math.PI); g.fill(); }
    }
    g.globalAlpha = 1;
  }
  const bola = (g, x, y, r, q) => { g.fillStyle = q > 0 ? col['--peso'] : col['--z1']; g.beginPath(); g.arc(x, y, r, 0, 2 * Math.PI); g.fill(); g.fillStyle = '#fff'; g.font = `600 ${Math.round(r * 1.5)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(q > 0 ? '+' : '−', x, y + 0.5); };
  const etiqueta = (g, t, x, y, al = 'left', c = col['--muted']) => { g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.fillStyle = c; g.textAlign = al; g.textBaseline = 'top'; g.fillText(t, x, y); };

  function proyeccion(g, x0, y0, pw, ph, pts, nomA, nomB, color, extra) {
    const A = pts.map((q) => q[0]), Bb = pts.map((q) => q[1]), a0 = Math.min(...A, extra ? extra.a0 : Infinity), a1 = Math.max(...A, extra ? extra.a1 : -Infinity), b0 = Math.min(...Bb, extra ? extra.b0 : Infinity), b1 = Math.max(...Bb, extra ? extra.b1 : -Infinity);
    const sa = (a1 - a0) || 1, sb = (b1 - b0) || 1, k = Math.min((pw - 40) / sa, (ph - 34) / sb), ox = x0 + 28 + ((pw - 40) - sa * k) / 2, oy = y0 + ph - 20 - ((ph - 34) - sb * k) / 2;
    const X = (a) => ox + (a - a0) * k, Y = (b) => oy - (b - b0) * k;
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); if (a0 <= 0 && a1 >= 0) { g.moveTo(X(0), Y(b0)); g.lineTo(X(0), Y(b1)); } if (b0 <= 0 && b1 >= 0) { g.moveTo(X(a0), Y(0)); g.lineTo(X(a1), Y(0)); } g.stroke();
    if (extra && extra.lineas) for (const l of extra.lineas) { g.strokeStyle = col['--muted']; g.globalAlpha = 0.5; g.lineWidth = 1; g.beginPath(); l.forEach(([a, b], i) => (i ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b)))); g.stroke(); g.globalAlpha = 1; }
    g.strokeStyle = col[color]; g.lineWidth = 1.8; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(X(a), Y(b)) : g.moveTo(X(a), Y(b)))); g.stroke();
    g.fillStyle = col['--normal']; g.beginPath(); g.arc(X(pts[0][0]), Y(pts[0][1]), 4.5, 0, 7); g.fill();
    const u = pts[pts.length - 1]; g.fillStyle = col['--peso']; g.fillRect(X(u[0]) - 4, Y(u[1]) - 4, 8, 8);
    etiqueta(g, nomA, x0 + pw - 14, oy + 2, 'right'); etiqueta(g, nomB, x0 + 2, y0 + 2, 'left');
    etiqueta(g, `${txt(f(a0, 3))} … ${txt(f(a1, 3))} m`, x0 + pw / 2, y0 + ph - 14, 'center');
  }
  function graficaT(g, x0, y0, gw, gh, series, tmax) {
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 + gh); g.lineTo(x0 + gw, y0 + gh); g.stroke();
    etiqueta(g, `t = 0 … ${txt(f(tmax, 3))} s`, x0 + gw, y0 + gh + 3, 'right');
    series.forEach((se, i) => {
      const ys = se.pts.map((q) => q[1]), lo = se.lo ?? Math.min(...ys), hi = se.hi ?? Math.max(...ys), rg = (hi - lo) || Math.abs(hi) || 1;
      g.strokeStyle = col[se.color]; g.lineWidth = 2; g.beginPath(); se.pts.forEach(([t, y], j) => { const px = x0 + (t / tmax) * gw, py = y0 + gh - 4 - ((y - lo) / rg) * (gh - 12); j ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
      etiqueta(g, se.nombre, x0 + 8, y0 + 3 + i * 15, 'left', col[se.color]);
    });
  }
  function escNumerica(g, w, h) {
    const M = sol.muestras, hs = h * 0.56, ancho = w / 2;
    if (sol.modo === 'trayectoria') {
      proyeccion(g, 4, 4, ancho - 8, hs - 8, M.map((q) => [q[1], q[2]]), 'x', 'y', '--tension');
      proyeccion(g, ancho + 4, 4, ancho - 8, hs - 8, M.map((q) => [q[1], q[3]]), 'x', 'z', '--tension');
      const KE = M.map((q) => [q[0], 0.5 * sol.P.m * (q[4] * q[4] + q[5] * q[5] + q[6] * q[6])]);
      graficaT(g, 30, hs + 8, w - 44, h - hs - 28, [{ pts: KE, color: '--fuerza', nombre: `Énergie cinétique (${txt(f(sol.KE0))} → ${txt(f(sol.KE1))} J)` }], sol.tt);
    } else {
      const zm = sol.zm, lineas = [-0.8, -0.5, 0.5, 0.8].map((fr) => Array.from({ length: 41 }, (_, i) => { const z = -zm + (2 * zm * i) / 40; return [fr * 0 + z, (fr * zm * 0.5) / Math.sqrt(1 + (z * z) / (sol.L * sol.L))]; }));
      proyeccion(g, 4, 4, w - 8, hs - 8, M.map((q) => [q[3], q[1]]), 'z', 'x', '--tension', { a0: -zm, a1: zm, b0: -zm * 0.5, b1: zm * 0.5, lineas });
      graficaT(g, 30, hs + 8, w - 44, h - hs - 28, [{ pts: M.map((q) => [q[0], q[3]]), color: '--tension', nombre: `z(t), |z| max ${txt(f(sol.zmax))} m` }, { pts: sol.mut.map((q) => [q[0], q[1] / sol.mu]), color: '--fuerza', nombre: 'μ(t)/μ₀', lo: 0.9, hi: 1.1 }], M[M.length - 1][0]);
    }
  }
  function descripcion3d() {
    const r = (x) => txt(f(x, 3));
    if (sol.modo === 'trayectoria') {
      const u = sol.rf;
      return `Vue 3D de la trajectoire de ${sol.P.pre ? `${sol.P.art} ${sol.P.nom}` : 'la particule'} : ${sol.Bm ? `elle tourne autour de B avec un rayon ${r(sol.rL)} m` : 'sans champ magnétique, elle accélère en ligne droite'}${sol.hayE && sol.Bm ? `, dérive avec une vitesse ${r(Math.hypot(...sol.vd))} m/s` : ''}${sol.hayE ? ` et accélère le long de B à ${r(sol.apar)} m/s²` : ''}. Elle part de l'origine et termine en (${u.map(r).join('; ')}) m. Flèche verte : direction de B ; flèche violette : direction de E.`;
    }
    return `Vue 3D du miroir magnétique : la particule ${sol.atrapada ? `tourne autour des lignes de B et rebondit entre z = ±${r(sol.zt)} m avec une période de ${r(sol.Tb)} s` : `sort de la bouteille à t = ${r(sol.tEscapa)} s par l'extrémité`}. Les lignes grises sont des lignes de B qui se resserrent vers les extrémités (z = ±${r(sol.zm)} m), où le champ vaut ${r(sol.Rm)} fois celui du centre.`;
  }
  function escena3d() {
    if (!sol || (sol.modo !== 'trayectoria' && sol.modo !== 'espejo')) return {};
    const M = sol.muestras;
    if (sol.modo === 'trayectoria') {
      const S = Math.max(...M.flatMap((q) => [Math.abs(q[1]), Math.abs(q[2]), Math.abs(q[3])]), 1e-300), n = (q) => [q[1] / S, q[2] / S, q[3] / S];
      const lineas = [{ pts: M.map(n), color: '--tension', ancho: 2, flecha: true }];
      const vec = (u, c, e) => { const m = Math.hypot(...u); if (m) lineas.push({ pts: [[0, 0, 0], u.map((x) => (0.5 * x) / m)], color: c, ancho: 2.4, flecha: true }); };
      vec(sol.B, '--normal'); vec(sol.E, '--fuerza');
      return { lineas, puntos: [{ p: n(M[0]), color: '--normal', r: 5 }, { p: n(M[M.length - 1]), color: '--peso', r: 5 }], ejes: true, etiquetas: [{ p: [0.55, 0, 0], t: 'x' }] };
    }
    const zm = sol.zm, S = zm * 1.05, lineas = [];
    for (const az of [0, Math.PI / 2, Math.PI, 1.5 * Math.PI]) lineas.push({ pts: Array.from({ length: 31 }, (_, i) => { const z = -zm + (2 * zm * i) / 30, rho = (0.35 * zm) / Math.sqrt(1 + (z * z) / (sol.L * sol.L)); return [(rho * Math.cos(az)) / S, (rho * Math.sin(az)) / S, z / S]; }), color: '--muted', ancho: 1 });
    for (const z of [-zm, zm]) lineas.push({ pts: Array.from({ length: 49 }, (_, i) => [(0.35 * zm * Math.cos((i * Math.PI) / 24)) / S, (0.35 * zm * Math.sin((i * Math.PI) / 24)) / S, z / S]), color: '--suelo', ancho: 2 });
    lineas.push({ pts: M.map((q) => [q[1] / S, q[2] / S, q[3] / S]), color: '--tension', ancho: 1.6, flecha: true });
    return { lineas, puntos: [{ p: [M[0][1] / S, M[0][2] / S, M[0][3] / S], color: '--normal', r: 5 }, { p: [M[M.length - 1][1] / S, M[M.length - 1][2] / S, M[M.length - 1][3] / S], color: '--peso', r: 5 }], ejes: true, etiquetas: [] };
  }
  const vista = Vista3D.monta('#vista3d', { escena: escena3d, descripcion: () => $('#desc3d').textContent || 'Vue tridimensionnelle de la trajectoire', yaw: 0.7, pitch: 0.4 });

  function dibuja() {
    const { g, w, h } = lienzo();
    if (!sol) return;
    if (!col['--ink']) colores();
    const t = tA;
    if (sol.modo === 'trayectoria' || sol.modo === 'espejo') escNumerica(g, w, h);
    else if (sol.modo === 'carga') escCarga(g, w, h, t);
    else if (sol.modo === 'vectorial') escVectores(g, w, h, t);
    else if (sol.modo === 'selector') escSelector(g, w, h, t);
    else if (sol.modo === 'ciclotron') escCiclotron(g, w, h, t);
    else if (sol.modo === 'franja') escFranja(g, w, h, t);
    else if (sol.modo === 'cruzados') escCruzados(g, w, h, t);
    else if (sol.modo === 'hall') escHall(g, w, h, t);
    else if (sol.modo === 'espira') escEspira(g, w, h, t);
    else if (sol.modo === 'hilo') escHilo(g, w, h, t);
    else escParalelos(g, w, h, t);
  }
  function escCarga(g, w, h, t) {
    const q = sol.P.q;
    if (sol.F === 0) {
      g.globalAlpha = 0.5;
      for (let y = 30; y < h; y += 46) { flecha(g, 20, y, 1, 0, w - 40, col['--tension'], 1.3); } g.globalAlpha = 1;
      const dir = sol.th === 0 ? 1 : -1, x = dir > 0 ? 40 + ((t * 80) % (w - 80)) : w - 40 - ((t * 80) % (w - 80));
      bola(g, x, h / 2, 9, q); flecha(g, x + dir * 12, h / 2, dir, 0, 40, col['--normal'], 2.6, 'v');
      etiqueta(g, 'B', 24, 12, 'left', col['--tension']);
      return;
    }
    if (sol.th === 90) {
      simbolos(g, 0, 0, w, h, sol.sentidoB !== 'saliente');
      const R = Math.min(w, h) * 0.33, cx = w / 2, cy = h / 2, s = sol.giro === 'antihoraire' ? 1 : -1, ph = s * t * (2 * Math.PI / 4) - Math.PI / 2;
      g.strokeStyle = col['--ink']; g.globalAlpha = 0.25; g.lineWidth = 1.5; g.setLineDash([5, 5]); g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.lineWidth = 2.6; g.beginPath(); for (let k = 0; k <= 40; k++) { const a = ph - s * (k / 40) * Math.PI * 1.2; g.globalAlpha = 1; k ? g.lineTo(cx + R * Math.cos(a), cy - R * Math.sin(a)) : g.moveTo(cx + R * Math.cos(a), cy - R * Math.sin(a)); } g.stroke();
      const x = cx + R * Math.cos(ph), y = cy - R * Math.sin(ph);
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
      g.fillStyle = col['--muted']; g.beginPath(); g.arc(cx, cy, 2.5, 0, 2 * Math.PI); g.fill();
      etiqueta(g, `r = ${txt(f(sol.r, 3))} m`, cx + 6, cy + 6);
      flecha(g, x, y, -s * Math.sin(ph), -s * Math.cos(ph), 50, col['--normal'], 2.6, 'v');
      flecha(g, x, y, cx - x, cy - y, 42, col['--peso'], 2.6, 'F');
      bola(g, x, y, 9, q);
      return;
    }
    g.globalAlpha = 0.35; for (let y = 24; y < h; y += 44) flecha(g, 8, y, 1, 0, w - 16, col['--tension'], 1.2); g.globalAlpha = 1;
    etiqueta(g, 'B', 12, 4, 'left', col['--tension']);
    const relP = sol.paso / sol.r, R = Math.min(h * 0.3, (w * 0.22) / Math.max(relP, 0.3)), pp = relP * R, dir = sol.va >= 0 ? 1 : -1, cy = h / 2;
    const vueltas = (w - 60) / pp, Tv = 3, u = (t / Tv) % Math.max(1, vueltas), x0 = dir > 0 ? 30 : w - 30, sg = q > 0 ? 1 : -1;
    const pos = (k) => [x0 + dir * k * pp, cy - R * Math.sin(sg * 2 * Math.PI * k), Math.cos(2 * Math.PI * k)];
    g.lineWidth = 2;
    for (let k = 0; k < vueltas * 80; k++) { const a = pos(k / 80), b = pos((k + 1) / 80); g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.globalAlpha = (k / 80 <= u ? 0.9 : 0.18) * (a[2] > 0 ? 1 : 0.45); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    g.globalAlpha = 1;
    const p = pos(u); bola(g, p[0], p[1], p[2] > 0 ? 9 : 7, q);
    etiqueta(g, `paso p = ${txt(f(sol.paso, 3))} m`, w - 10, h - 20, 'right');
  }
  function escVectores(g, w, h, t) {
    const az = (30 + 15 * Math.sin(t * 0.6)) * Math.PI / 180, el = 22 * Math.PI / 180, L = Math.min(w, h) * 0.36, cx = w / 2, cy = h * 0.55;
    const pr = (v) => [cx + L * (-v[0] * Math.sin(az) + v[1] * Math.cos(az)), cy - L * (v[2] * Math.cos(el) - (v[0] * Math.cos(az) + v[1] * Math.sin(az)) * Math.sin(el))];
    g.lineWidth = 1.2; g.strokeStyle = col['--muted']; g.fillStyle = col['--muted']; g.font = '12px "IBM Plex Sans", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [e, v] of [['x', [1, 0, 0]], ['y', [0, 1, 0]], ['z', [0, 0, 1]]]) { const a = pr(v.map((c) => -c * 0.6)), b = pr(v.map((c) => c * 1.15)); g.globalAlpha = 0.6; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); g.globalAlpha = 1; const c = pr(v.map((c) => c * 1.25)); g.fillText(e, c[0], c[1]); }
    const o = pr([0, 0, 0]);
    const dib = (u, c, et) => { const m = Math.hypot(...u); if (!(m > 0)) return; const p = pr(u.map((x) => (x / m) * 0.85)); flecha(g, o[0], o[1], p[0] - o[0], p[1] - o[1], Math.hypot(p[0] - o[0], p[1] - o[1]), c, 2.8, et); };
    dib(sol.v, col['--normal'], 'v'); dib(sol.B, col['--tension'], 'B'); if (sol.hayE) dib(sol.E, col['--fuerza'], 'E'); dib(sol.F, col['--peso'], 'F');
    bola(g, o[0], o[1], 7, sol.P.q);
  }
  function escSelector(g, w, h, t) {
    const x1 = w * 0.08, x2 = sol.r2 !== null ? w * 0.5 : w * 0.8, cy = sol.r2 !== null ? h * 0.62 : h / 2, gap = Math.min(110, h * 0.34), q = sol.P.q;
    simbolos(g, x1, cy - gap / 2, x2, cy + gap / 2, true, 30);
    g.fillStyle = col['--peso']; g.fillRect(x1, cy - gap / 2 - 8, x2 - x1, 8); g.fillStyle = col['--z1']; g.fillRect(x1, cy + gap / 2, x2 - x1, 8);
    etiqueta(g, '+ + + +', x1 + 4, cy - gap / 2 - 24, 'left', col['--peso']); etiqueta(g, '− − − −', x1 + 4, cy + gap / 2 + 12, 'left', col['--z1']);
    etiqueta(g, 'E ↓   B ⊗', (x1 + x2) / 2, cy - gap / 2 - 24, 'center');
    const rel = (sol.v - sol.vs) / sol.vs, sg = sol.des === 'si' ? (sol.hacia === 'haut' ? -1 : 1) : 0, k = Math.min(1, Math.abs(rel) * 5);
    const yv = (x) => cy + sg * (gap / 2) * k * 2 * ((x - x1) / (x2 - x1)) ** 2;
    const vel = (w * 0.9) / 3, Ttot = 3.6, s = (t % Ttot) * vel, recorrido = [];
    let x = x1 - 30, y = cy, choca = false;
    for (let d = 0; d <= s; d += 3) {
      if (x < x1) { x += 3; y = cy; }
      else if (x <= x2) { x += 3; y = yv(x); if (Math.abs(y - cy) >= gap / 2 - 6) { y = cy + Math.sign(y - cy) * (gap / 2 - 6); choca = true; break; } }
      else if (sol.r2 !== null && sol.des !== 'si') {
        const R = Math.min(h * 0.26, (w - x2) * 0.42), a = (d - (x2 - x1 + 30)) / R; if (a > Math.PI) { recorrido.push([x2, cy - 2 * R * Math.sign(q)]); break; }
        x = x2 + R * Math.sin(a); y = cy - Math.sign(q) * R * (1 - Math.cos(a));
      } else x += 3;
      recorrido.push([x, y]);
    }
    if (sol.r2 !== null) {
      const R = Math.min(h * 0.26, (w - x2) * 0.42);
      simbolos(g, x2 + 4, 0, w, h, true, 34);
      g.strokeStyle = col['--ink']; g.lineWidth = 3; g.beginPath(); g.moveTo(x2, 4); g.lineTo(x2, cy - 10); g.moveTo(x2, cy + 10); g.lineTo(x2, h - 4); g.stroke();
      etiqueta(g, `B′  ·  2r = ${txt(f(2 * sol.r2, 3))} m`, x2 + 8, h - 18);
      g.strokeStyle = col['--muted']; g.globalAlpha = 0.4; g.setLineDash([4, 4]); g.beginPath(); g.arc(x2, cy - Math.sign(q) * R, R, -Math.PI / 2, Math.PI / 2); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      if (sol.rb !== null) {
        const Rb = R * sol.rb / sol.r2, yb = cy - Math.sign(q) * 2 * Rb;
        g.strokeStyle = col['--fuerza']; g.lineWidth = 2; g.globalAlpha = 0.8; g.setLineDash([6, 4]); g.beginPath(); g.arc(x2, cy - Math.sign(q) * Rb, Rb, -Math.PI / 2, Math.PI / 2, q < 0); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
        g.fillStyle = col['--fuerza']; g.beginPath(); g.arc(x2, yb, 4, 0, 2 * Math.PI); g.fill();
        etiqueta(g, `${txt(f(sol.m2, 3))} u`, x2 - 6, yb - 7, 'right', col['--fuerza']);
        etiqueta(g, `Δx = ${txt(f(sol.sepa, 3))} m`, x2 + 8, h - 38, 'left', col['--fuerza']);
      }
    }
    g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.lineWidth = 2.4; g.beginPath(); recorrido.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke();
    const p = recorrido[recorrido.length - 1] || [x1 - 30, cy];
    if (p[0] >= x1 && p[0] <= x2 && !choca) { const fe = q > 0 ? 1 : -1, fb = -fe, m = Math.max(sol.FE, sol.FB); flecha(g, p[0], p[1], 0, fe, 36 * sol.FE / m, col['--peso'], 2.4); flecha(g, p[0], p[1], 0, fb, 36 * sol.FB / m, col['--fuerza'], 2.4); }
    bola(g, p[0], p[1], 8, q);
  }
  function escCiclotron(g, w, h, t) {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42, gap = 14, q = sol.P.q;
    simbolos(g, cx - R, cy - R, cx + R, cy + R, true, 34);
    g.strokeStyle = col['--ink']; g.lineWidth = 2.5; g.fillStyle = col['--accent-soft']; g.globalAlpha = 0.5;
    for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * gap / 2, cy, R, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : 1.5 * Math.PI); g.closePath(); g.fill(); g.globalAlpha = 1; g.stroke(); g.globalAlpha = 0.5; }
    g.globalAlpha = 1;
    const nv = Math.max(2, Math.min(12, Math.round(sol.n !== null ? sol.n * 2 : 10))), radios = Array.from({ length: nv }, (_, k) => R * 0.9 * Math.sqrt((k + 1) / nv));
    const centros = []; let yc = cy;
    for (let k = 0; k < nv; k++) { if (k) yc = k % 2 ? centros[k - 1] - radios[k - 1] + radios[k] : centros[k - 1] + radios[k - 1] - radios[k]; centros.push(yc); }
    const sv = q > 0 ? 1 : -1, Y = (y) => cy + sv * (y - cy);
    const pt = (k, a) => (k % 2 ? [cx - gap / 2 - radios[k] * Math.sin(a), Y(centros[k] - radios[k] * Math.cos(a))] : [cx + gap / 2 + radios[k] * Math.sin(a), Y(centros[k] + radios[k] * Math.cos(a))]);
    const Th = 0.6, tot = nv * Th + 1.2, u = t % tot, kk = Math.min(nv - 1, Math.floor(u / Th)), fr = Math.min(1, (u - kk * Th) / Th);
    g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.lineWidth = 2; g.beginPath();
    for (let k = 0; k <= kk; k++) for (let i = 0; i <= 30; i++) { const p = pt(k, Math.PI * (k < kk ? i / 30 : (i / 30) * fr)); k === 0 && i === 0 ? g.moveTo(...p) : g.lineTo(...p); }
    let p = pt(kk, Math.PI * fr);
    if (u >= nv * Th) { const e = pt(nv - 1, Math.PI), dx = (nv - 1) % 2 ? 1 : -1; p = [e[0] + dx * (u - nv * Th) * 160, e[1]]; g.lineTo(...p); }
    g.stroke();
    bola(g, p[0], p[1], 7, q);
    etiqueta(g, `f = ${txt(f(sol.fr, 3))} Hz`, 10, 8);
    const signo = Math.floor(u / Th) % 2 ? '←' : '→'; etiqueta(g, `E ${signo}`, cx, cy - 8, 'center', col['--fuerza']);
  }
  function escFranja(g, w, h, t) {
    const q = sol.P.q, sg = sol.hacia === 'haut' ? -1 : 1, xa = w * 0.3;
    const s = sol.cruza ? Math.min((w * 0.45) / sol.d, (h * 0.5) / Math.max(sol.y, sol.d * 0.15)) : Math.min((h * 0.4) / sol.r, (w * 0.55) / sol.d), rs = sol.r * s, ds = sol.d * s;
    const y0 = sol.cruza ? (sg < 0 ? h * 0.78 : h * 0.22) : h / 2 - sg * rs;
    g.fillStyle = col['--tension']; g.globalAlpha = 0.07; g.fillRect(xa, 0, Math.min(ds, w - xa), h); g.globalAlpha = 1;
    simbolos(g, xa, 0, Math.min(xa + ds, w), h, sol.sentidoB !== 'saliente', 32);
    g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(xa, 0); g.lineTo(xa, h); if (xa + ds < w) { g.moveTo(xa + ds, 0); g.lineTo(xa + ds, h); } g.stroke(); g.setLineDash([]);
    if (xa + ds < w) etiqueta(g, `d = ${txt(f(sol.d, 3))} m`, xa + ds / 2, h - 18, 'center');
    const fin = sol.cruza ? (sol.alfa * Math.PI) / 180 : Math.PI, L1 = xa - 20, L2 = rs * fin, L3 = w * 0.6;
    const pos = (u) => {
      if (u < L1) return [20 + u, y0, 0];
      if (u < L1 + L2) { const ph = (u - L1) / rs; return [xa + rs * Math.sin(ph), y0 + sg * rs * (1 - Math.cos(ph)), ph]; }
      const e = (u - L1 - L2), x = xa + rs * Math.sin(fin), y = y0 + sg * rs * (1 - Math.cos(fin));
      return [x + e * Math.cos(fin), y + sg * e * Math.sin(fin), fin];
    };
    const tot = L1 + L2 + L3, u = (t * w * 0.35) % tot, pts = [];
    g.strokeStyle = col['--muted']; g.globalAlpha = 0.35; g.lineWidth = 1.4; g.setLineDash([4, 4]); g.beginPath();
    for (let k = 0; k <= 200; k++) { const p = pos((k / 200) * tot); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    for (let k = 0; k <= 120; k++) pts.push(pos((k / 120) * u));
    g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.lineWidth = 2.4; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    const [x, y, ph] = pos(u);
    flecha(g, x, y, Math.cos(ph), sg * Math.sin(ph), 44, col['--normal'], 2.4, 'v');
    if (u > L1 && u < L1 + L2) flecha(g, x, y, -Math.sin(ph), sg * Math.cos(ph), 36, col['--peso'], 2.4, 'F');
    bola(g, x, y, 8, q);
    etiqueta(g, sol.cruza ? `α = ${txt(f(sol.alfa, 3))}°` : `2r = ${txt(f(2 * sol.r, 3))} m`, 10, 8);
  }
  function escCruzados(g, w, h, t) {
    const q = sol.P.q, ws = Math.sign(q) * sol.w, T = sol.T, ext = Math.max(sol.avance * 2, 1e-30);
    const s = Math.min((w - 70 - 2 * sol.R * 0) / (ext + 2 * sol.R), sol.h ? (h * 0.62) / sol.h : Infinity), x0 = 30 + sol.R * s, y0 = sol.sube ? h * 0.82 : h * 0.18;
    simbolos(g, 0, 0, w, h, false, 40);
    for (let y = 40; y < h; y += 90) flecha(g, 14, y + 30, 0, -1, 30, col['--fuerza'], 1.6);
    etiqueta(g, 'E ↑   B ⊙', 30, 8);
    const X = (tt) => sol.vd * tt + (sol.u / ws) * Math.sin(ws * tt), Y = (tt) => (sol.u / ws) * (Math.cos(ws * tt) - 1);
    const per = 2, tt = ((t / 2.4) % per) * T;
    g.strokeStyle = col['--muted']; g.globalAlpha = 0.3; g.lineWidth = 1; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(20, y0); g.lineTo(w - 10, y0); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    g.strokeStyle = q > 0 ? col['--peso'] : col['--z1']; g.lineWidth = 2.4; g.beginPath();
    for (let k = 0; k <= 240; k++) { const a = (k / 240) * tt, px = x0 + X(a) * s, py = y0 - Y(a) * s; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
    const px = x0 + X(tt) * s, py = y0 - Y(tt) * s, vx = sol.vd + sol.u * Math.cos(ws * tt), vy = -sol.u * Math.sin(ws * tt);
    g.fillStyle = col['--muted']; g.globalAlpha = 0.6; g.beginPath(); g.arc(x0 + sol.vd * tt * s, y0, 4, 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1;
    const Fe = q * sol.E, Fmx = q * vy * sol.B, Fmy = -q * vx * sol.B, ref = Math.max(Math.abs(Fe), Math.abs(q) * sol.vmax * sol.B) || 1;
    flecha(g, px, py, 0, -Math.sign(Fe), 42 * Math.abs(Fe) / ref, col['--fuerza'], 2.4);
    flecha(g, px, py, Fmx, -Fmy, 42 * Math.hypot(Fmx, Fmy) / ref, col['--peso'], 2.4);
    flecha(g, px, py, vx, -vy, 46 * Math.hypot(vx, vy) / (sol.vmax || 1), col['--normal'], 2.4, 'v');
    bola(g, px, py, 8, q);
    etiqueta(g, `v_d = E/B = ${txt(f(sol.vd, 3))} m/s${sol.h ? `  ·  h = ${txt(f(sol.h, 3))} m` : ''}`, w - 10, h - 20, 'right');
  }
  function escHall(g, w, h, t) {
    const x1 = w * 0.1, x2 = w * 0.84, y1 = h * 0.28, y2 = h * 0.72, hu = sol.huecos, sube = sol.arriba;
    g.fillStyle = col['--cuerpo']; g.globalAlpha = 0.6; g.fillRect(x1, y1, x2 - x1, y2 - y1); g.globalAlpha = 1;
    g.strokeStyle = col['--ink']; g.lineWidth = 1.5; g.strokeRect(x1, y1, x2 - x1, y2 - y1);
    simbolos(g, x1, y1, x2, y2, sol.sentidoB !== 'saliente', 44);
    flecha(g, x1 - 40, (y1 + y2) / 2, 1, 0, 34, col['--z2'], 2.6, ''); etiqueta(g, 'I', x1 - 30, (y1 + y2) / 2 - 22);
    const arriba = hu === sube ? '+' : '−', abajo = arriba === '+' ? '−' : '+';
    g.font = '600 15px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let x = x1 + 18; x < x2; x += 30) { g.fillStyle = arriba === '+' ? col['--peso'] : col['--z1']; g.fillText(arriba, x, y1 - 10); g.fillStyle = abajo === '+' ? col['--peso'] : col['--z1']; g.fillText(abajo, x, y2 + 11); }
    const dir = hu ? 1 : -1, ancho = x2 - x1;
    for (let k = 0; k < 14; k++) {
      const fase = ((t * 0.35 + k / 14) % 1), x = dir > 0 ? x1 + fase * ancho : x2 - fase * ancho, dy = (y2 - y1) * 0.36 * Math.min(1, fase * 1.6), y = (y1 + y2) / 2 + ((k % 3) - 1) * 18 + (sube ? -dy : dy);
      g.fillStyle = hu ? col['--peso'] : col['--z1']; g.beginPath(); g.arc(x, Math.max(y1 + 6, Math.min(y2 - 6, y)), 4, 0, 2 * Math.PI); g.fill();
    }
    g.strokeStyle = col['--fuerza']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x2 + 22, y1); g.lineTo(x2 + 22, y2); g.stroke();
    etiqueta(g, 'V_H', x2 + 28, (y1 + y2) / 2 - 7, 'left', col['--fuerza']);
    etiqueta(g, 'potentiel plus élevé', x2 - 4, sol.alta === 'du haut' ? y1 - 34 : y2 + 24, 'right', col['--ink']);
    etiqueta(g, `V_H = ${txt(f(sol.VH, 3))} V`, x1, h - 20);
  }
  function escEspira(g, w, h, t) {
    const cx = w / 2, cy = h / 2, L = Math.min(w, h) * 0.32, th0 = (sol.th * Math.PI) / 180, th = sol.tau ? th0 * Math.cos(t * 1.6) : th0;
    g.globalAlpha = 0.35; for (let y = 22; y < h; y += 44) flecha(g, 8, y, 1, 0, w - 16, col['--tension'], 1.2); g.globalAlpha = 1;
    etiqueta(g, 'B', 12, 4, 'left', col['--tension']);
    const nx = Math.cos(th), ny = -Math.sin(th);
    g.strokeStyle = col['--ink']; g.lineWidth = 3; g.fillStyle = col['--accent-soft']; g.globalAlpha = 0.7;
    g.beginPath(); g.ellipse(cx, cy, L * 0.22, L, Math.atan2(ny, nx), 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1; g.stroke();
    const ax = cx - ny * L, ay = cy + nx * L, bx = cx + ny * L, by = cy - nx * L;
    g.fillStyle = col['--panel']; for (const [x, y] of [[ax, ay], [bx, by]]) { g.beginPath(); g.arc(x, y, 8, 0, 2 * Math.PI); g.fill(); g.stroke(); }
    g.lineWidth = 1.6; g.beginPath(); g.moveTo(ax - 4, ay - 4); g.lineTo(ax + 4, ay + 4); g.moveTo(ax + 4, ay - 4); g.lineTo(ax - 4, ay + 4); g.stroke();
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(bx, by, 2.5, 0, 2 * Math.PI); g.fill();
    flecha(g, cx, cy, nx, ny, L * 0.9, col['--fuerza'], 3, 'm');
    if (Math.abs(th) > 0.05) { g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, 30, Math.min(0, -th), Math.max(0, -th)); g.stroke(); etiqueta(g, 'θ', cx + 34 * Math.cos(th / 2), cy - 34 * Math.sin(th / 2) - 6); }
    etiqueta(g, `τ = ${txt(f(sol.tau, 3))} N·m avec θ = ${txt(f(sol.th, 3))}°`, w - 10, h - 20, 'right');
  }
  function escHilo(g, w, h, t) {
    simbolos(g, 0, 0, w, h, sol.sentidoB !== 'saliente');
    const cy = h / 2, dir = sol.sentidoI === 'izquierda' ? -1 : 1;
    g.strokeStyle = col['--ink']; g.lineWidth = 6; g.beginPath(); g.moveTo(w * 0.08, cy); g.lineTo(w * 0.92, cy); g.stroke();
    g.fillStyle = col['--z2']; for (let x = 0; x < w; x += 40) { const xx = w * 0.08 + ((x + dir * t * 60) % (w * 0.84) + w * 0.84) % (w * 0.84); g.beginPath(); g.arc(xx, cy, 3, 0, 2 * Math.PI); g.fill(); }
    flecha(g, w * 0.12, cy - 22, dir, 0, 50, col['--z2'], 2.4, 'I');
    const ref = Math.max(sol.F, sol.m !== null ? sol.m * 9.8 : 0) || 1;
    if (sol.arriba !== null) flecha(g, w / 2, cy, 0, sol.arriba ? -1 : 1, 22 + 70 * sol.F / ref, col['--fuerza'], 3, 'F');
    if (sol.m !== null) flecha(g, w / 2 + 40, cy, 0, 1, 22 + 70 * sol.m * 9.8 / ref, col['--peso'], 3, 'P');
  }
  function escParalelos(g, w, h, t) {
    const d = Math.min(w * 0.3, 160), osc = Math.sin(t * 3) * 2 * (sol.mismo ? -1 : 1), x1 = w / 2 - d / 2 - osc, x2 = w / 2 + d / 2 + osc;
    g.strokeStyle = col['--tension']; g.globalAlpha = 0.35; g.lineWidth = 1.2;
    for (const r of [d * 0.35, d * 0.7, d, d * 1.4]) { g.beginPath(); g.ellipse(x1, h / 2, r, r * 0.28, 0, 0, 2 * Math.PI); g.stroke(); }
    g.globalAlpha = 1;
    for (const [x, sg, et] of [[x1, -1, 'I₁'], [x2, sol.mismo ? -1 : 1, 'I₂']]) {
      g.strokeStyle = col['--ink']; g.lineWidth = 6; g.beginPath(); g.moveTo(x, 10); g.lineTo(x, h - 10); g.stroke();
      g.fillStyle = col['--z2']; for (let y = 0; y < h; y += 34) { const yy = 10 + ((y + sg * t * 50) % (h - 20) + (h - 20)) % (h - 20); g.beginPath(); g.arc(x, yy, 3, 0, 2 * Math.PI); g.fill(); }
      flecha(g, x - 18, h / 2 + (sg > 0 ? -30 : 30), 0, sg, 50, col['--z2'], 2.4, et);
    }
    const L = 50, atrae = sol.mismo;
    flecha(g, x1, h * 0.28, atrae ? 1 : -1, 0, L, col['--fuerza'], 3, 'F');
    flecha(g, x2, h * 0.28, atrae ? -1 : 1, 0, L, col['--fuerza'], 3, 'F');
    etiqueta(g, `d = ${txt(f(sol.d, 3))} m`, w / 2, h - 22, 'center');
  }

  Herramienta.exportar('#escena', { nombre: 'fuerza-magnetica', titulo: 'Force magnétique', datos: () => (sol && sol.muestras ? { cab: ['t (s)', 'x (m)', 'y (m)', 'z (m)', 'vx (m/s)', 'vy (m/s)', 'vz (m/s)'], filas: sol.muestras } : null) });
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Reprendre'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('fuerza').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.FuerzaApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { atrapada: sol.atrapada, KE1: sol.KE1, zmax: sol.zmax, modo: sol.modo, F: sol.F, Fmod: sol.Fmod, r: sol.r, vs: sol.vs, r2: sol.r2, sepa: sol.sepa, fr: sol.fr, n: sol.n, FL: sol.FL, alfa: sol.alfa, vd: sol.vd, h: sol.h, VH: sol.VH, tau: sol.tau }, estado: () => copia(sc) };
})();

