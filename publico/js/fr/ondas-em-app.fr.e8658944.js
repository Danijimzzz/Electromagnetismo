(() => {
  const { $, esc, copia } = Herramienta;
  const O = OndasEM, f = O.f, CLAVE = 'ondasem-v1';
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<sub>(.*?)<\/sub>/g, (_, e) => e.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d])).replace(/<[^>]+>/g, '');
  const MODOS = [['onda', 'Onde plane : E, B et son expression'], ['expresion', 'Onde à partir de E(r, t) ou B(r, t)'], ['incidencia', 'Incidence normale : réflexion et onde stationnaire'], ['intensidad', 'Intensité et pression de radiation'], ['perdidas', 'Milieu à pertes (conducteur)'], ['polarizadores', 'Polariseurs : loi de Malus'], ['poynting', 'Vecteur de Poynting et bilan d\'énergie'], ['plasma', 'Plasma et ionosphère : relation de dispersion'], ['suma', 'Somme de deux ondes : battements, stationnaires, polarisation'], ['retardo', 'Lames à retard λ/4 et λ/2 (Jones)']];
  const DIRS = ['+x', '-x', '+y', '-y', '+z', '-z'].map((d) => [d, d.replace('-', '−')]).concat([['otra', 'otra (componentes)']]);

  let sc = copia(O.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const sep = (t) => `<div class="sep">${t}</div>`;
  const tres = (p, nom) => `<label>${nom}</label><div class="tres">${['x', 'y', 'z'].map((e) => `<input id="f-${p}${e}" class="in" data-k="${p}${e}" value="${esc(sc[p + e] ?? '')}" inputmode="decimal" autocomplete="off" placeholder="${e}" aria-label="${nom}, composante ${e}">`).join('')}</div>`;
  const DATO = [['f', 'Fréquence f'], ['lambda', 'Longueur d\'onde λ'], ['omega', 'Fréquence angulaire ω'], ['k', 'Nombre d\'onde k']], UN = { f: 'Hz', lambda: 'm', omega: 'rad/s', k: 'rad/m' };
  const medioF = () => elige('medio', 'Moyen', [['vacio', 'Vide (ou air)'], ['medio', 'Un matériau (εr, μr)']]) + (sc.medio === 'medio' ? fila('er', 'Permittivité relative ε<sub>r</sub>') + fila('mr', 'Perméabilité relative μ<sub>r</sub>', 'opcional, 1') : '');
  const NOTAS = {
    onda: 'Les formes 3e8, 3·10^8 ou 10^8 sont acceptées. L\'onde s\'écrit E₀ cos(k·r − ωt + φ) : si elle se propage vers −z, on obtient cos(kz + ωt). E doit être perpendiculaire à la direction de propagation. Avec « autre », vous écrivez les composantes, p. ex. (1, 1, 0).',
    expresion: 'Écrivez l\'amplitude, cos ou sin avec la phase et la direction : 30 cos(2,094y + 6,283e8t) k, 5 sin(2x + 2y − 8,5e8t + π/4) (1, −1, 0)… Les notations î ĵ k̂, i j k ou x y z sont acceptées.',
    incidencia: 'L\'onde arrive par z < 0 vers +z avec E selon x et rencontre en z = 0 un conducteur parfait ou un autre milieu.',
    intensidad: 'L\'intensité est la valeur moyenne du vecteur de Poynting. Une source ponctuelle la répartit sur une sphère, donc elle décroît en 1/r².',
    polarizadores: 'Angles des axes par rapport à une direction fixe, séparés par des points-virgules : 0 ; 45 ; 90. Les polariseurs sont idéaux. La lumière naturelle perd la moitié au premier ; la lumière linéaire suit la loi de Malus I = I₀ cos²θ.',
    poynting: 'Courant continu : l\'énergie arrive par les champs extérieurs. Le flux de S = E × B/μ₀ à travers la surface coïncide avec la puissance dissipée ou stockée.',
    plasma: 'Densité d\'électrons nₑ en m⁻³ (l\'ionosphère est de l\'ordre de 10¹¹–10¹² m⁻³ ; un métal, 10²⁸–10²⁹). La fréquence et l\'angle sont facultatifs : avec la fréquence, on sait si l\'onde se propage, et avec l\'angle on applique la loi de la sécante.',
    suma: 'Additionne deux ondes en un point ou le long de z. Battements : deux fréquences voisines. Stationnaire : incidente et réfléchie d\'amplitudes différentes (la phase δ est celle de la réfléchie). Polarisation : deux ondes perpendiculaires déphasées de δ.',
    retardo: 'Jusqu\'à quatre éléments dans l\'ordre, avec l\'angle de leur axe par rapport à l\'axe x. Pour le polariseur, c\'est l\'axe de transmission et pour les lames, l\'axe rapide. La lumière d\'entrée a une intensité 1.',
    perdidas: 'Avec une conductivité σ, l\'onde est atténuée comme e^(−αz). Si σ/(ωε) est très supérieur à 1, le milieu est un bon conducteur et l\'onde ne pénètre presque pas (effet de peau).',
  };
  function formulario() {
    let h = elige('modo', 'Calcul', MODOS);
    if (sc.modo === 'onda') {
      const tp = sc.tipoPol || 'lineal';
      h += medioF() + elige('dato', 'Donnée de l\'onde', DATO) + fila('valor', DATO.find(([k]) => k === (sc.dato || 'f'))[1], UN[sc.dato || 'f']) + fila('E0', tp === 'lineal' ? 'Amplitude E<sub>0</sub>' : 'Amplitude E<sub>01</sub>', 'V/m') + sep('Directions') + elige('prop', 'Se propage vers', DIRS) + (sc.prop === 'otra' ? tres('k', 'Direction de k') : '') + elige('pol', 'E pointe vers', DIRS) + (sc.pol === 'otra' ? tres('e', 'Direction de E') : '');
      h += sep('Polarisation et phase') + elige('tipoPol', 'Polarisation', [['lineal', 'Linéaire'], ['circular', 'Circulaire'], ['eliptica', 'Elliptique']]);
      if (tp === 'circular') h += elige('giro', 'Tourne, vue par celui qui la reçoit', [['antihorario', 'Dans le sens anti-horaire'], ['horario', 'Dans le sens horaire']]);
      if (tp === 'eliptica') h += fila('E02', 'Amplitude E<sub>02</sub> (selon k̂ × Ê)', 'V/m') + fila('delta', 'Déphasage δ', '°');
      h += fila('fase', 'Phase initiale φ (facultative)', '°');
    } else if (sc.modo === 'expresion') h += elige('campo', 'Me dan', [['E', 'Le champ électrique E(r, t)'], ['B', 'Le champ magnétique B(r, t)']]) + `<label for="f-expr">${sc.campo === 'B' ? 'B(r, t) en T' : 'E(r, t) en V/m'}</label><input id="f-expr" class="in" data-k="expr" value="${esc(sc.expr ?? '')}" autocomplete="off" spellcheck="false">`;
    else if (sc.modo === 'incidencia') h += medioF() + elige('dato', 'Donnée de l\'onde', DATO) + fila('valor', DATO.find(([k]) => k === (sc.dato || 'f'))[1], UN[sc.dato || 'f']) + fila('E0', 'Amplitude incidente E<sub>0</sub>', 'V/m') + sep('De l\'autre côté de z = 0') + elige('destino', 'Rencontre', [['conductor', 'Un conducteur parfait'], ['dielectrico', 'Un autre milieu (diélectrique)']]) + (sc.destino === 'dielectrico' ? fila('er2', 'Permittivité relative ε<sub>r2</sub>') + fila('mr2', 'Perméabilité relative μ<sub>r2</sub>', 'opcional, 1') : '');
    else if (sc.modo === 'intensidad') {
      h += medioF() + elige('de', 'Donnée', [['fuente', 'Puissance d\'une source et distance'], ['I', 'L\'intensité I'], ['E0', 'L\'amplitude E₀']]);
      h += sc.de === 'fuente' ? fila('P', 'Puissance P', 'W') + fila('r', 'Distance r', 'm') : sc.de === 'I' ? fila('I', 'Intensité I', 'W/m²') : fila('E0', 'Amplitude E<sub>0</sub>', 'V/m');
      h += sep('Facultatif') + fila('A', 'Aire de la surface A', 'm²');
    } else if (sc.modo === 'polarizadores') {
      h += elige('luz', 'Lumière incidente', [['natural', 'Naturelle (non polarisée)'], ['lineal', 'Polarisée linéairement'], ['circular', 'Circulaire']]) + fila('I0', 'Intensité I<sub>0</sub>', 'W/m²');
      if (sc.luz === 'lineal') h += fila('alfa', 'Angle de polarisation de la lumière', '°');
      h += fila('angulos', 'Axes des polariseurs', '° séparés par ;');
    } else if (sc.modo === 'poynting') {
      h += elige('sis', 'Système', [['hilo', 'Fil parcouru par un courant (effet Joule)'], ['condensador', 'Condensateur qui se charge'], ['coaxial', 'Câble coaxial']]);
      if (sc.sis === 'hilo') h += fila('a', 'Rayon a', 'm') + fila('L', 'Longueur L', 'm') + fila('I', 'Courant I', 'A') + fila('sigma', 'Conductivité σ', 'S/m');
      else if (sc.sis === 'condensador') h += fila('a', 'Rayon des armatures a', 'm') + fila('d', 'Espacement d', 'm') + fila('V', 'Tension V', 'V') + fila('I', 'Courant de charge I', 'A');
      else h += fila('a', 'Rayon intérieur a', 'm') + fila('b', 'Rayon extérieur b', 'm') + fila('V', 'Tension V', 'V') + fila('I', 'Courant I', 'A') + fila('r', 'Point r (facultatif, a ≤ r ≤ b)', 'm');
    } else if (sc.modo === 'plasma') h += fila('ne', 'Densité d\'électrons n<sub>e</sub>', 'm⁻³') + fila('valor', 'Fréquence f (facultative)', 'Hz') + fila('ang', 'Angle d\'incidence (facultatif)', '°');
    else if (sc.modo === 'suma') {
      h += elige('caso', 'Ce qui s\'additionne', [['batido', 'Deux fréquences : battements'], ['estacionaria', 'Incidente et réfléchie : onde stationnaire'], ['polarizacion', 'Deux ondes perpendiculaires : polarisation']]);
      const e = sc.caso === 'estacionaria', pl = sc.caso === 'polarizacion';
      h += fila('A1', pl ? 'Amplitude selon x, A<sub>1</sub>' : e ? 'Amplitude incidente A<sub>1</sub>' : 'Amplitude A<sub>1</sub>', 'V/m') + fila('A2', pl ? 'Amplitude selon y, A<sub>2</sub>' : e ? 'Amplitude réfléchie A<sub>2</sub>' : 'Amplitude A<sub>2</sub>', 'V/m');
      if (sc.caso === 'batido') h += fila('f1', 'Fréquence f<sub>1</sub>', 'Hz') + fila('f2', 'Fréquence f<sub>2</sub>', 'Hz'); else if (e) h += fila('f1', 'Fréquence f', 'Hz');
      h += fila('delta', pl ? 'Déphasage δ de y par rapport à x' : 'Déphasage δ de la seconde onde', '°');
    } else if (sc.modo === 'retardo') {
      h += elige('luz', 'Lumière d\'entrée', [['lineal', 'Linéaire'], ['circI', 'Circulaire gauche'], ['circD', 'Circulaire droite']]);
      if (sc.luz === 'lineal') h += fila('alfa', 'Angle de polarisation', '°');
      for (let i = 1; i <= 4; i++) { h += sep(`Élément ${i}`) + elige('e' + i, `Élément ${i}`, [['', '— aucun —'], ['pol', 'Polariseur'], ['l4', 'Lame λ/4'], ['l2', 'Lame λ/2']]); if (sc['e' + i]) h += fila('a' + i, `Angle de l'axe ${i}`, '°'); }
    } else h += fila('sigma', 'Conductivité σ', 'S/m') + fila('er', 'Permittivité relative ε<sub>r</sub>') + fila('mr', 'Perméabilité relative μ<sub>r</sub>', 'opcional, 1') + fila('valor', 'Fréquence f', 'Hz') + sep('Facultatif') + fila('E0', 'Amplitude à l\'entrée E<sub>0</sub>', 'V/m') + fila('d', 'Profondeur z', 'm');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[sc.modo];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(O.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else if (k === 'caso') sc = copia(O.ejemplos.find((x) => x.sc.modo === 'suma' && x.sc.caso === t.value).sc);
    else {
      sc[k] = t.value;
      if (k === 'medio' && t.value === 'medio' && !sc.er) sc.er = '4';
      if (k === 'destino' && t.value === 'dielectrico' && !sc.er2) sc.er2 = '2,25';
      if (k === 'tipoPol' && t.value === 'eliptica' && !sc.E02) { sc.E02 = String(sc.E0 || '10').replace(/^(\d+)/, (m) => String(Math.max(1, Math.round(+m / 2)))); sc.delta = '90'; }
      if (k === 'luz' && t.value === 'lineal' && vacio(sc.alfa)) sc.alfa = '0';
      if (/^e[1-4]$/.test(k) && t.value && vacio(sc['a' + k[1]])) sc['a' + k[1]] = '0';
      if (k === 'sis') { const o = O.ejemplos.find((x) => x.sc.sis === t.value); if (o) sc = copia(o.sc); }
      if (k === 'prop' && t.value === 'otra' && !sc.kx) Object.assign(sc, { kx: '1', ky: '1', kz: '0' });
      if (k === 'pol' && t.value === 'otra' && !sc.ex) Object.assign(sc, { ex: '0', ey: '0', ez: '1' });
      if ((k === 'prop' || k === 'pol') && sc.prop !== 'otra' && sc.pol !== 'otra' && sc.prop.slice(-1) === sc.pol.slice(-1)) { const libre = 'xyz'.split('').find((c) => c !== sc.prop.slice(-1)); if (k === 'prop') sc.pol = '+' + libre; else sc.prop = '+' + 'xyz'.split('').find((c) => c !== sc.pol.slice(-1)); }
    }
    formulario(); cambia();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Exemples…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${O.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = O.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); formulario(); calcula(); sel.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(x).replace('.', ',');
    const tipos = [
      () => { const p = de(['+x', '-x', '+y', '-y', '+z', '-z']), libres = 'xyz'.split('').filter((q) => q !== p.slice(-1)); return { modo: 'onda', medio: Math.random() < 0.7 ? 'vacio' : 'medio', er: de(['2', '4', '9']), mr: '', dato: de(['f', 'f', 'lambda', 'k']), valor: '', E0: String(de([10, 20, 50, 100, 300])), prop: p, pol: de(['+', '-']) + de(libres) }; },
      () => ({ modo: 'intensidad', medio: 'vacio', de: de(['fuente', 'I', 'E0']), P: String(de([60, 100, 500, 1000, 50000])), r: String(de([1, 2, 5, 10, 100])), I: String(de([10, 100, 500, 1000, 1361])), E0: String(de([10, 50, 100, 500])), A: Math.random() < 0.5 ? '' : String(de([1, 2, 10])) }),
      () => ({ modo: 'onda', medio: 'vacio', er: '', mr: '', dato: de(['f', 'lambda']), valor: '', E0: String(de([10, 20, 50])), prop: '+z', pol: '+x', tipoPol: de(['circular', 'eliptica']), giro: de(['horario', 'antihorario']), E02: String(de([5, 10, 15])), delta: de(['90', '-90', '45']), fase: '' }),
      () => ({ modo: 'incidencia', medio: 'vacio', er: '', mr: '', dato: 'f', valor: de(['1e8', '1e9', '3e9']), E0: String(de([10, 50, 100])), destino: de(['conductor', 'dielectrico']), er2: de(['2,25', '4', '9']), mr2: '' }),
      () => ({ modo: 'polarizadores', luz: de(['natural', 'lineal']), alfa: String(de([0, 30, 60])), I0: String(de([100, 500, 1000])), angulos: de(['0; 45; 90', '30', '0; 60', '20; 50; 80', '0; 90']) }),
      () => de([{ modo: 'poynting', sis: 'hilo', a: '1e-3', L: String(de([1, 2, 5])), I: String(de([5, 10, 20])), sigma: '5,8e7' }, { modo: 'poynting', sis: 'condensador', a: String(de(['0,05', '0,1'])), d: String(de(['0,001', '0,002'])), V: String(de([50, 100])), I: String(de(['0,5', '1'])) }, { modo: 'poynting', sis: 'coaxial', a: '1e-3', b: String(de(['3e-3', '3,5e-3'])), V: String(de([50, 100])), I: String(de([1, 2])), r: '' }]),
      () => ({ modo: 'perdidas', er: de(['1', '10', '81']), mr: '', sigma: de(['5,8e7', '3,5e7', '4', '0,01']), valor: de(['50', '1e3', '1e6', '1e8']), E0: String(de([1, 10, 100])), d: '' }),
    ];
    sc = de(tipos)();
    if (sc.modo === 'onda') sc.valor = { f: de(['1e6', '1e8', '3e9', '5e14']), lambda: de(['3', '0,1', '500e-9']), k: c(de([0.5, 1, 2, 10])) }[sc.dato];
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    if (sc.modo === 'onda') {
      const dato = { f: `frecuencia ${esc(sc.valor)} Hz`, lambda: `longueur d'onde ${esc(sc.valor)} m`, omega: `pulsation ${esc(sc.valor)} rad/s`, k: `nombre d'onde ${esc(sc.valor)} rad/m` }[sc.dato || 'f'];
      return `Une onde électromagnétique plane de ${dato} et d'amplitude E₀ = ${esc(sc.E0)} V/m se propage vers ${esc(sc.prop)} ${sc.medio === 'medio' ? `dans un milieu avec εr = ${esc(sc.er)}` : 'dans le vide'}, avec E dans la direction ${esc(sc.pol)}. Calculez λ, k, ω, le champ B et sa direction, écrivez E et B et calculez l'intensité.`;
    }
    if (sc.modo === 'expresion') return `Le champ ${sc.campo === 'B' ? 'magnétique' : 'électrique'} d'une onde plane est ${sc.campo === 'B' ? 'B' : 'E'}(r, t) = ${esc(sc.expr)} (SI). Calculez la direction de propagation, λ, f, la vitesse, l'autre champ et l'intensité.`;
    if (sc.modo === 'incidencia') return `Une onde plane de ${esc(sc.valor)} ${UN[sc.dato || 'f']} et d'amplitude ${esc(sc.E0)} V/m arrive du vide perpendiculairement sur ${sc.destino === 'dielectrico' ? `un milieu avec εr = ${esc(sc.er2)}. Calculez les coefficients de réflexion et de transmission et la fraction de l'énergie qui est réfléchie.` : 'un conducteur parfait. Écrivez l\'onde stationnaire qui se forme, l\'emplacement des nœuds de E et la pression de radiation.'}`;
    if (sc.modo === 'intensidad') return sc.de === 'fuente' ? `Une source ponctuelle émet ${esc(sc.P)} W également dans toutes les directions. Calculez l'intensité à ${esc(sc.r)} m, les amplitudes de E et B et la pression de radiation.` : sc.de === 'I' ? `Une onde a une intensité de ${esc(sc.I)} W/m². Calculez E₀, B₀, la densité d'énergie et la pression de radiation${sc.A ? ` et la force sur ${esc(sc.A)} m²` : ''}.` : `Le champ électrique d'une onde a une amplitude de ${esc(sc.E0)} V/m. Calculez l'intensité, B₀ et la pression de radiation.`;
    if (sc.modo === 'polarizadores') return `Un faisceau de lumière ${{ natural: 'naturelle', lineal: `polarisée linéairement à ${esc(sc.alfa)}°`, circular: 'circulaire' }[sc.luz || 'natural']} d'intensité ${esc(sc.I0)} W/m² traverse des polariseurs idéaux dont les axes sont à ${esc(sc.angulos)} degrés. Calculez l'intensité après chacun et l'intensité finale.`;
    if (sc.modo === 'poynting') return { hilo: `Un fil de rayon ${esc(sc.a)} m, de longueur ${esc(sc.L)} m et de σ = ${esc(sc.sigma)} S/m est parcouru par un courant de ${esc(sc.I)} A. Calculez E, B et le vecteur de Poynting à sa surface et vérifiez que son flux est la puissance dissipée.`, condensador: `Un condensateur à armatures circulaires de rayon ${esc(sc.a)} m, séparées de ${esc(sc.d)} m, se charge avec ${esc(sc.I)} A lorsqu'il est à ${esc(sc.V)} V. Calculez E, B sur le bord, S et vérifiez le bilan d'énergie.`, coaxial: `Un câble coaxial de rayons ${esc(sc.a)} m et ${esc(sc.b)} m transporte ${esc(sc.I)} A avec ${esc(sc.V)} V entre ses conducteurs. Calculez E, B et S entre eux et la puissance transportée.` }[sc.sis || 'hilo'];
    if (sc.modo === 'plasma') return `Un plasma contient ${esc(sc.ne)} électrons par m³. Calculez sa fréquence plasma${vacio(sc.valor) ? '' : ` et dites si une onde de ${esc(sc.valor)} Hz se propage (indice, vitesses de phase et de groupe)`}${vacio(sc.ang) ? '' : `; avec une incidence à ${esc(sc.ang)}°, trouvez la fréquence maximale qui est réfléchie`}.`;
    if (sc.modo === 'suma') return sc.caso === 'batido' ? `On additionne deux ondes d'amplitudes ${esc(sc.A1)} et ${esc(sc.A2)} V/m et de fréquences ${esc(sc.f1)} et ${esc(sc.f2)} Hz. Calculez la fréquence de battement, la fréquence moyenne et l'amplitude maximale et minimale.` : sc.caso === 'estacionaria' ? `Une onde de ${esc(sc.f1)} Hz et ${esc(sc.A1)} V/m est réfléchie avec ${esc(sc.A2)} V/m et un déphasage de ${esc(sc.delta)}°. Calculez la longueur d'onde, l'amplitude aux ventres et aux nœuds et le taux d'ondes stationnaires.` : `On additionne Ex = ${esc(sc.A1)} cos(kz − ωt) et Ey = ${esc(sc.A2)} cos(kz − ωt + ${esc(sc.delta)}°). Calculez le type de polarisation, le sens de rotation et les demi-axes de l'ellipse.`;
    if (sc.modo === 'retardo') return `Une lumière ${{ lineal: `linéaire à ${esc(sc.alfa)}°`, circI: 'circulaire gauche', circD: 'circulaire droite' }[sc.luz || 'lineal']} traverse ${[1, 2, 3, 4].filter((i) => sc['e' + i]).map((i) => `${{ pol: 'un polariseur', l4: 'une lame λ/4', l2: 'une lame λ/2' }[sc['e' + i]]} à ${esc(sc['a' + i])}°`).join(', puis ')}. Avec le calcul de Jones, trouvez la polarisation et l'intensité de sortie.`;
    return `Une onde de ${esc(sc.valor)} Hz entre dans un milieu avec σ = ${esc(sc.sigma)} S/m et εr = ${esc(sc.er)}. Est-ce un bon conducteur ? Calculez α, β, la profondeur de pénétration et l'impédance.`;
  };

  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = O.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tA = 0;
    let h;
    if (sol.modo === 'incidencia') {
      h = sol.cond ? dato('Coefficient de réflexion', 'r = <b>−1</b>') + dato('Distance entre nœuds', `λ/2 = <b>${f(sol.F.lam / 2)} m</b>`) + dato('Amplitude aux ventres', `2E<sub>0</sub> = <b>${f(2 * sol.E0)} V/m</b>`) + dato('Pression de radiation', `p = ${f((2 * sol.I0) / sol.M.v)} Pa`) + dato('Courant surfacique', `K = ${f(sol.K)} A/m`) + dato('Champ électrique', `E = ${f(2 * sol.E0)} sen(${f(sol.F.k)}z) sen(${f(sol.F.w)}t) î V/m`, 'ancho')
        : dato('Réflexion', `r = <b>${f(sol.r)}</b>`) + dato('Transmission', `t = <b>${f(sol.t)}</b>`) + dato('Énergie réfléchie', `R = <b>${f(100 * sol.R, 3)} %</b>`) + dato('Énergie transmise', `T = <b>${f(100 * sol.T, 3)} %</b>`) + dato('Onde stationnaire', `|E| entre ${f(sol.E0 * (1 - Math.abs(sol.r)))} et ${f(sol.E0 * (1 + Math.abs(sol.r)))} V/m`);
    } else if (sol.modo === 'onda' || sol.modo === 'expresion') {
      h = dato('Longueur d\'onde', `λ = <b>${f(sol.F.lam)} m</b>`) + dato('Nombre d\'onde', `k = <b>${f(sol.F.k)} rad/m</b>`) + dato('Pulsation', `ω = ${f(sol.F.w)} rad/s`) + dato('Fréquence', `f = ${f(sol.F.fr)} Hz`)
        + dato('Amplitude de B', `B<sub>0</sub> = <b>${f(sol.B0)} T</b>`) + dato('Intensité', `I = <b>${f(sol.I)} W/m<sup>2</sup></b>`) + dato('Champ électrique', sol.Eexp, 'ancho') + dato('Champ magnétique', sol.Bexp, 'ancho');
    } else if (sol.modo === 'intensidad') {
      h = dato('Intensité', `I = <b>${f(sol.I)} W/m<sup>2</sup></b>`) + dato('Amplitude de E', `E<sub>0</sub> = <b>${f(sol.E0)} V/m</b>`) + dato('Amplitude de B', `B<sub>0</sub> = <b>${f(sol.B0)} T</b>`) + dato('Densité d\'énergie', `u = ${f(sol.u)} J/m<sup>3</sup>`) + dato('Pression (absorption)', `p = ${f(sol.pa)} Pa`);
      if (sol.A !== null) h += dato('Force (absorption)', `F = ${f(sol.pa * sol.A)} N`);
    } else if (sol.modo === 'polarizadores') {
      h = dato('Intensité finale', `I = <b>${f(sol.I)} W/m<sup>2</sup></b>`) + dato('Fraction transmise', `I/I<sub>0</sub> = <b>${f(sol.frac)}</b> (${f(100 * sol.frac, 3)} %)`) + dato('Amplitude finale', `E<sub>0</sub> = ${f(sol.E0f)} V/m`) + dato('Polarisation finale', `linéaire à <b>${f(sol.angs[sol.angs.length - 1])}°</b>`);
      sol.etapas.forEach((e, i) => { h += dato(`Après le polariseur ${i + 1}`, `I<sub>${i + 1}</sub> = ${f(e.I)} W/m<sup>2</sup>`); });
    } else if (sol.modo === 'poynting') {
      h = dato('Champ électrique', `E = <b>${f(sol.E)} V/m</b>`) + dato('Champ magnétique', `B = <b>${f(sol.B)} T</b>`) + dato('Vecteur de Poynting', `S = <b>${f(sol.S)} W/m<sup>2</sup></b>`) + dato('Direction de S', sol.dir) + dato(sol.sis === 'coaxial' ? 'Puissance transportée' : 'Flux de S à travers la surface', `Φ = <b>${f(sol.flujo)} W</b>`) + dato(sol.sis === 'hilo' ? 'Puissance dissipée I²R' : sol.sis === 'condensador' ? 'dU/dt = V I' : 'P = V I', `${f(sol.P)} W`);
    } else if (sol.modo === 'plasma') {
      h = dato('Pulsation plasma', `ω<sub>p</sub> = <b>${f(sol.wp)} rad/s</b>`) + dato('Fréquence plasma', `f<sub>p</sub> = <b>${f(sol.fp)} Hz</b>`) + dato('Longueur d\'onde plasma', `λ<sub>p</sub> = ${f(sol.lp)} m`);
      if (sol.fr !== null) h += dato('Rapport', `ω/ω<sub>p</sub> = ${f(sol.x)}`) + (sol.propaga ? dato('État', '<b>se propage</b>') + dato('Indice de réfraction', `n = <b>${f(sol.n)}</b>`) + dato('Longueur d\'onde', `λ = ${f(sol.lam)} m`) + dato('Vitesse de phase', `v<sub>f</sub> = <b>${f(sol.vf)} m/s</b>`) + dato('Vitesse de groupe', `v<sub>g</sub> = <b>${f(sol.vg)} m/s</b>`) : dato('État', '<b>ne se propage pas (évanescente)</b>') + dato('Atténuation', `κ = <b>${f(sol.kappa)} m<sup>-1</sup></b>`) + dato('Profondeur de pénétration', `δ = ${f(sol.delta)} m`));
      h += sol.ang === null ? dato('Réflexion verticale jusqu\'à', `f<sub>p</sub> = ${f(sol.fp)} Hz`) : dato(`Fréquence maximale à ${f(sol.ang)}°`, `f<sub>p</sub>/cos θ = <b>${f(sol.fcrit)} Hz</b>`);
      if (sol.fr !== null) h += dato('Est-elle réfléchie par la couche ?', `<b>${sol.reflejada ? 'oui' : 'non, elle la traverse'}</b>`);
    } else if (sol.modo === 'suma') {
      if (sol.caso === 'batido') h = dato('Fréquence moyenne', `f̄ = <b>${f(sol.fm)} Hz</b>`) + dato('Fréquence de battement', `f<sub>b</sub> = <b>${f(sol.df)} Hz</b>`) + dato('Amplitude maximale', `A<sub>1</sub> + A<sub>2</sub> = <b>${f(sol.Emax)} V/m</b>`) + dato('Amplitude minimale', `|A<sub>1</sub> − A<sub>2</sub>| = <b>${f(sol.Emin)} V/m</b>`) + (isFinite(sol.Tb) ? dato('Période du battement', `T<sub>b</sub> = ${f(sol.Tb)} s`) : '');
      else if (sol.caso === 'estacionaria') h = dato('Longueur d\'onde', `λ = <b>${f(sol.lam)} m</b>`) + dato('Nombre d\'onde', `k = ${f(sol.k)} rad/m`) + dato('Amplitude aux ventres', `<b>${f(sol.Emax)} V/m</b>`) + dato('Amplitude aux nœuds', `<b>${f(sol.Emin)} V/m</b>`) + dato('Rapport d\'onde stationnaire', `TOS = <b>${sol.ROE === Infinity ? '∞' : f(sol.ROE)}</b>`) + (sol.Pr !== null ? dato('Puissance réfléchie', `${f(100 * sol.Pr, 3)} %`) : '');
      else h = dato('Polarisation', `<b>${sol.estado.tipo}</b>`) + (sol.estado.giro ? dato('Sens (vu par celui qui reçoit)', `${sol.estado.giro}`) : '') + dato('Demi-grand axe', `a = <b>${f(sol.estado.a)} V/m</b>`) + dato('Demi-petit axe', `b = <b>${f(sol.estado.b)} V/m</b>`) + dato('Inclinaison du grand axe', `ψ = ${f(sol.estado.psi)}°`);
    } else if (sol.modo === 'retardo') {
      h = dato('Lumière de sortie', `<b>${sol.texto}</b>`) + dato('Intensité de sortie', `I/I<sub>0</sub> = <b>${f(sol.I, 4)}</b> (${f(100 * sol.I, 4)} %)`);
      sol.etapas.slice(1).forEach((e, i) => { h += dato(`Après l'élément ${i + 1}`, `I = ${f(e.I, 4)}, ${txtEst(e.estado)}`); });
    } else {
      h = dato('Type de milieu', `<b>${sol.tipo}</b>`) + dato('σ/(ωε)', `${f(sol.tg)}`) + dato('Atténuation', `α = <b>${f(sol.alfa)} Np/m</b>`) + dato('Constante de phase', `β = ${f(sol.beta)} rad/m`) + dato('Profondeur de pénétration', `δ = <b>${f(sol.delta)} m</b>`) + dato('Impédance', `|η| = ${f(sol.etaM)} Ω`);
      if (sol.Ed !== null) h += dato(`E a z = ${f(sol.d)} m`, `<b>${f(sol.Ed)} V/m</b>`);
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    $('#abrir-fresnel').hidden = !(sol.modo === 'incidencia' && !sol.cond && sol.M && sol.M2);
    $('#leyenda').innerHTML = sol.modo === 'plasma' ? 'Gauche : relation de dispersion ω(k) ; la ligne en pointillés est la lumière dans le vide. Droite : un paquet d\'ondes, qui avance à v<sub>g</sub> tandis que les crêtes vont à v<sub>f</sub>, ou la décroissance d\'une onde évanescente.' : sol.modo === 'suma' ? (sol.caso === 'batido' ? 'E total en un point en fonction du temps, avec son enveloppe (ligne en pointillés) : l\'amplitude pulse à la fréquence de battement.' : sol.caso === 'estacionaria' ? 'E(z) à cet instant et son enveloppe ; les points sont les nœuds, séparés de λ/2.' : 'Courbe parcourue par l\'extrémité de E en un point fixe, avec ses demi-axes ; le point indique le sens.') : sol.modo === 'retardo' ? 'État de polarisation après chaque élément, vu par celui qui reçoit la lumière : taille ∝ √I ; l\'extrémité se déplace dans le sens de rotation.' : sol.modo === 'polarizadores' ? 'Chaque disque est un polariseur avec son axe ; la flèche rouge est E après lui, de longueur proportionnelle à √I.' : sol.modo === 'poynting' ? 'E en rouge, B en bleu et S en ambre : S = E × B/μ₀ pointe dans la direction où voyage l\'énergie.' : sol.modo === 'incidencia' ? `E total en rouge et B total en bleu le long de z ; la ligne en pointillés est l'amplitude. ${sol.cond ? 'Les points marquent les nœuds de E : l\'onde ne se propage pas, elle oscille sur place.' : 'À droite, l\'onde transmise.'}` : sol.modo === 'intensidad' && sol.de === 'fuente' ? 'Fronts d\'onde sphériques qui partent de la source : la même puissance se répartit sur des sphères de plus en plus grandes.' : (sol.tp && sol.tp !== 'lineal') ? 'E en rouge et B en bleu : avec deux composantes déphasées, l\'extrémité de E tourne autour de l\'axe de propagation (en orange, la direction de propagation).' : `E en rouge, B en bleu et la direction de propagation (le vecteur de Poynting) en orange${sol.modo === 'perdidas' && sol.alfa > 0 ? '; la ligne en pointillés est l\'enveloppe e<sup>−αz</sup> et le repère, la profondeur δ' : ''}.`;
    dibuja();
  }

  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--bg', '--e', '--b', '--s']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = () => Herramienta.lienzo('#escena');
  const FU = '"IBM Plex Sans", system-ui, sans-serif';
  const flecha = (g, x0, y0, x1, y1, c, ancho = 2) => {
    const L = Math.hypot(x1 - x0, y1 - y0); if (L < 1.5) return;
    const a = Math.atan2(y1 - y0, x1 - x0), p = Math.min(8, L * 0.4);
    g.strokeStyle = c; g.fillStyle = c; g.lineWidth = ancho; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1 - p * 0.6 * Math.cos(a), y1 - p * 0.6 * Math.sin(a)); g.stroke();
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - p * Math.cos(a - 0.4), y1 - p * Math.sin(a - 0.4)); g.lineTo(x1 - p * Math.cos(a + 0.4), y1 - p * Math.sin(a + 0.4)); g.closePath(); g.fill();
  };
  function dibuja() {
    const { g, w, h } = lienzo();
    if (!sol) return;
    if (!col['--ink']) colores();
    if (sol.modo === 'intensidad' && sol.de === 'fuente') return fuente(g, w, h);
    if (sol.modo === 'incidencia') return incide(g, w, h);
    if (sol.modo === 'polarizadores') return polariza(g, w, h);
    if (sol.modo === 'poynting') return poynt(g, w, h);
    if (sol.modo === 'plasma') return plasmaD(g, w, h);
    if (sol.modo === 'suma') return sol.caso === 'batido' ? batidoD(g, w, h) : sol.caso === 'estacionaria' ? estacD(g, w, h) : elipseD(g, w, h);
    if (sol.modo === 'retardo') return retardoD(g, w, h);
    plana(g, w, h);
  }
  function plana(g, w, h) {
    const per = sol.modo !== 'perdidas';
    const eti = (v, por) => { if (!per || !v) return por; const i = v.findIndex((c) => Math.abs(c) > 1 - 1e-9); return i < 0 ? null : `${v[i] > 0 ? '+' : '−'}${'xyz'[i]}`; };
    const tK = eti(sol.K && sol.K.v, '+z') || 'k̂', tE = eti(sol.Ed && sol.Ed.v, '+x') || 'Ê', tB = eti(sol.Bv, '+y') || 'B̂';
    const lam = sol.modo === 'perdidas' ? sol.lam : sol.F ? sol.F.lam : 1, alfa = sol.modo === 'perdidas' ? sol.alfa : 0;
    const E02 = sol.tp && sol.tp !== 'lineal' ? sol.E02 / Math.max(sol.E0, sol.E02) : 0, E01 = sol.tp && sol.tp !== 'lineal' ? sol.E0 / Math.max(sol.E0, sol.E02) : 1, dl = sol.dl || 0, phi0 = sol.phi || 0;
    const L = alfa > 0 && 4 / alfa < 2 * lam ? 4 / alfa : 2 * lam;
    const A = Math.min(h * 0.32, 110), dx = -0.55, dy = 0.42, Bs = A * 0.85, x0 = Math.round((Bs + 30) * -dx + 24), x1 = w - 30, yc = h * 0.5;
    const P = (s, e, b) => [x0 + ((x1 - x0) * s) / L + b * dx, yc - e + b * dy]; // s en metros a lo largo de la propagación
    const t = tA * 0.6, fase = (s) => 2 * Math.PI * (s / lam) - 2 * Math.PI * t + phi0;
    g.lineWidth = 1; g.strokeStyle = col['--line']; g.font = `12px ${FU}`;
    flecha(g, x0 - 20, yc, x1 + 18, yc, col['--muted'], 1.2);
    flecha(g, x0, yc + A * 0.15, x0, yc - A - 18, col['--muted'], 1.2);
    flecha(g, x0, yc, x0 + (Bs + 26) * dx, yc + (Bs + 26) * dy, col['--muted'], 1.2);
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(tK, x1 + 4, yc - 12); g.fillText(tE, x0 + 6, yc - A - 14); g.fillText(tB, x0 + (Bs + 30) * dx + 8, yc + (Bs + 30) * dy + 4);
    if (alfa > 0) {
      g.setLineDash([5, 4]); g.strokeStyle = col['--e']; g.globalAlpha = 0.6; g.beginPath();
      for (let i = 0; i <= 100; i++) { const s = (L * i) / 100, [x, y] = P(s, A * Math.exp(-alfa * s), 0); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.globalAlpha = 1; g.setLineDash([]);
      const d = 1 / alfa; if (d < L) { const [x] = P(d, 0, 0); g.strokeStyle = col['--muted']; g.beginPath(); g.moveTo(x, yc + 6); g.lineTo(x, yc - 6); g.stroke(); g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('δ', x, yc + 8); }
    }
    const th = sol.modo === 'perdidas' ? sol.th : 0, n = 44;
    const puntas = (fn) => { g.beginPath(); for (let i = 0; i <= 200; i++) { const s = (L * i) / 200, [x, y] = fn(s); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
    const Bv = (s) => { const at = Math.exp(-alfa * s); return [-Bs * at * E02 * Math.cos(fase(s) + dl - th), Bs * at * E01 * Math.cos(fase(s) - th)]; };
    const Ev = (s) => { const at = Math.exp(-alfa * s); return [A * at * E01 * Math.cos(fase(s)), A * at * E02 * Math.cos(fase(s) + dl) * (Bs / A)]; };
    g.lineWidth = 2; g.strokeStyle = col['--b']; puntas((s) => P(s, ...Bv(s)));
    for (let i = 0; i <= n; i++) { const s = (L * i) / n, a = P(s, 0, 0), b = P(s, ...Bv(s)); g.globalAlpha = 0.55; flecha(g, a[0], a[1], b[0], b[1], col['--b'], 1.4); }
    g.globalAlpha = 1; g.lineWidth = 2.4; g.strokeStyle = col['--e']; puntas((s) => P(s, ...Ev(s)));
    for (let i = 0; i <= n; i++) { const s = (L * i) / n, a = P(s, 0, 0), b = P(s, ...Ev(s)); g.globalAlpha = 0.7; flecha(g, a[0], a[1], b[0], b[1], col['--e'], 1.6); }
    g.globalAlpha = 1;
    const yS = 22; flecha(g, w / 2 - 50, yS, w / 2 + 50, yS, col['--s'], 2.6); g.fillStyle = col['--s']; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('S = E × B/μ', w / 2 + 58, yS);
    g.fillStyle = col['--e']; g.textAlign = 'left'; g.font = `600 13px ${FU}`; g.fillText('E', x0 + 10, yc - A - 2);
    g.fillStyle = col['--b']; g.textAlign = 'right'; g.fillText('B', x0 + Bs * dx * 0.55 - 8, yc + Bs * dy * 0.55 + 4);
    g.fillStyle = col['--muted']; g.font = `12px ${FU}`; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(`tronçon de ${txt(f(L, 3))} m${per ? ` = ${txt(f(L / lam, 3))} λ` : ''}`, x1, h - 6);
  }
  function incide(g, w, h) {
    const { F, E0, cond } = sol, lam = F.lam, k = F.k, r = sol.r, tt = sol.t, lam2 = cond ? lam : lam * (sol.M2.v / sol.M.v), z0 = -2 * lam, z1 = cond ? 0.25 * lam : 1.5 * lam2;
    const ml = 20, mr = 20, X = (z) => ml + ((z - z0) / (z1 - z0)) * (w - ml - mr), yc = h * 0.52, A = h * 0.2, Y = (e) => yc - (A * e) / E0, wt = tA * 2.4;
    const xs = X(0);
    g.fillStyle = cond ? col['--muted'] : col['--line']; g.globalAlpha = cond ? 0.35 : 0.5; g.fillRect(xs, 8, w - mr - xs + mr, h - 16); g.globalAlpha = 1;
    g.font = `12px ${FU}`; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = col['--muted'];
    g.fillText(sol.M.vacioM ? 'vide' : 'medio 1', (ml + xs) / 2, 10); g.fillText(cond ? 'conductor' : 'medio 2', (xs + w - mr) / 2, 10);
    flecha(g, ml, yc, w - mr + 10, yc, col['--muted'], 1);
    g.textAlign = 'right'; g.fillText('z', w - mr + 8, yc + 6);
    const Et = (z) => (z <= 0 ? E0 * (Math.cos(k * z - wt) + r * Math.cos(-k * z - wt)) : cond ? 0 : tt * E0 * Math.cos((k * lam / lam2) * z - wt));
    const Bt = (z) => (z <= 0 ? E0 * (Math.cos(k * z - wt) - r * Math.cos(-k * z - wt)) : cond ? 0 : tt * E0 * (lam2 / lam) * Math.cos((k * lam / lam2) * z - wt));
    const env = (z) => (z <= 0 ? E0 * Math.sqrt(1 + r * r + 2 * r * Math.cos(2 * k * z)) : cond ? 0 : tt * E0);
    const curva = (fn, c, lw, dash = []) => { g.strokeStyle = c; g.lineWidth = lw; g.setLineDash(dash); g.beginPath(); for (let i = 0; i <= 400; i++) { const z = z0 + ((z1 - z0) * i) / 400, y = Y(fn(z)); i ? g.lineTo(X(z), y) : g.moveTo(X(z), y); } g.stroke(); g.setLineDash([]); };
    g.globalAlpha = 0.6; curva(env, col['--e'], 1.2, [5, 4]); curva((z) => -env(z), col['--e'], 1.2, [5, 4]); g.globalAlpha = 1;
    g.globalAlpha = 0.75; curva(Bt, col['--b'], 1.8); g.globalAlpha = 1; curva(Et, col['--e'], 2.4);
    if (cond) { g.fillStyle = col['--ink']; for (let n = 0; -n * lam / 2 >= z0; n++) { g.beginPath(); g.arc(X((-n * lam) / 2), yc, 3.5, 0, 2 * Math.PI); g.fill(); } }
    g.strokeStyle = col['--ink']; g.lineWidth = 2; g.beginPath(); g.moveTo(xs, 8); g.lineTo(xs, h - 8); g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillStyle = col['--muted']; g.fillText(cond ? `nœuds de E tous les λ/2 = ${txt(f(lam / 2, 3))} m` : `r = ${txt(f(r, 3))}, t = ${txt(f(tt, 3))}`, ml, h - 6);
  }
  function polariza(g, w, h) {
    const n = sol.angs.length, paso = (w - 120) / n, yc = h / 2, R = Math.min(h * 0.36, 52), Lm = R * 1.6;
    g.font = `12px ${FU}`; g.textBaseline = 'middle';
    const E = (x, ang, I, c) => { const l = Lm * Math.sqrt(I / sol.I0); if (l < 1) return; const a = (ang * Math.PI) / 180, osc = Math.cos(2 * Math.PI * tA * 0.8); flecha(g, x - l * Math.cos(a) * osc, yc + l * Math.sin(a) * osc, x + l * Math.cos(a) * osc, yc - l * Math.sin(a) * osc, c, 2.2); };
    flecha(g, 14, yc, w - 10, yc, col['--muted'], 1);
    const a0 = sol.luz === 'lineal' ? sol.alfa : null;
    if (a0 === null) { g.strokeStyle = col['--e']; g.lineWidth = 1.4; for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 6, l = Lm * 0.8; g.beginPath(); g.moveTo(50 - l * Math.cos(a), yc + l * Math.sin(a)); g.lineTo(50 + l * Math.cos(a), yc - l * Math.sin(a)); g.stroke(); } } else E(50, a0, sol.I0, col['--e']);
    g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(`I₀ = ${txt(f(sol.I0))}`, 50, yc + Lm + 8);
    sol.etapas.forEach((e, i) => {
      const x = 90 + paso * (i + 0.5), a = (e.a * Math.PI) / 180;
      g.fillStyle = col['--line']; g.globalAlpha = 0.5; g.beginPath(); g.arc(x, yc, R, 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1;
      g.strokeStyle = col['--ink']; g.lineWidth = 1.2; g.beginPath(); g.arc(x, yc, R, 0, 2 * Math.PI); g.stroke();
      g.setLineDash([4, 3]); g.beginPath(); g.moveTo(x - R * Math.cos(a), yc + R * Math.sin(a)); g.lineTo(x + R * Math.cos(a), yc - R * Math.sin(a)); g.stroke(); g.setLineDash([]);
      E(x + paso * 0.45 - 4, e.a, e.I, col['--e']);
      g.fillStyle = col['--muted']; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(`${txt(f(e.a))}°`, x, yc - R - 4);
      g.textBaseline = 'top'; g.fillStyle = col['--ink']; g.fillText(`I${i + 1} = ${txt(f(e.I))}`, x + paso * 0.45 - 4, yc + Lm + 8);
    });
  }
  function poynt(g, w, h) {
    const yc = h / 2, x0 = 60, x1 = w - 60, hh = Math.min(h * 0.18, 34), p = (tA * 30) % 28;
    g.font = `12px ${FU}`; g.textBaseline = 'middle'; g.textAlign = 'center';
    const rot = (x, y, t, c) => { g.fillStyle = c; g.fillText(t, x, y); };
    if (sol.sis === 'hilo') {
      g.fillStyle = col['--line']; g.fillRect(x0, yc - hh, x1 - x0, 2 * hh); g.strokeStyle = col['--ink']; g.lineWidth = 1.4; g.strokeRect(x0, yc - hh, x1 - x0, 2 * hh);
      for (let x = x0 + 40; x < x1 - 20; x += 80) { flecha(g, x, yc - hh - 46 + (p % 14) * 0.2, x, yc - hh - 4, col['--s'], 2.4); flecha(g, x + 30, yc + hh + 46, x + 30, yc + hh + 4, col['--s'], 2.4); }
      flecha(g, x0 + 10, yc, x1 - 10, yc, col['--e'], 2.4); rot(x1 - 20, yc - 12, 'E, I', col['--e']); rot(w / 2, yc - hh - 58, 'S entre par la surface', col['--s']); rot(w / 2, yc + hh + 58, 'B entoure le fil', col['--b']);
    } else if (sol.sis === 'condensador') {
      const xa = w * 0.3, xb = w * 0.7, ya = yc - 54, yb = yc + 54;
      g.fillStyle = col['--ink']; g.fillRect(xa, ya - 3, xb - xa, 6); g.fillRect(xa, yb - 3, xb - xa, 6);
      for (let x = xa + 24; x < xb - 10; x += 36) flecha(g, x, ya + 8, x, yb - 8, col['--e'], 1.8);
      flecha(g, xa - 40, yc, xa + 24, yc, col['--s'], 2.6); flecha(g, xb + 40, yc, xb - 24, yc, col['--s'], 2.6);
      rot(w / 2, yc, 'E', col['--e']); rot(xa - 50, yc - 12, 'S', col['--s']); rot(w / 2, yb + 22, 'l\'énergie entre par le bord, pas par les fils', col['--muted']);
    } else {
      g.fillStyle = col['--ink']; g.fillRect(x0, yc - 56, x1 - x0, 5); g.fillRect(x0, yc + 51, x1 - x0, 5); g.fillRect(x0, yc - 7, x1 - x0, 14);
      for (let x = x0 + 20 + p; x < x1 - 30; x += 28) { flecha(g, x, yc - 28, x + 20, yc - 28, col['--s'], 2.2); flecha(g, x, yc + 28, x + 20, yc + 28, col['--s'], 2.2); }
      rot(w / 2, yc - 74, 'S (de la source à la charge) entre les conducteurs', col['--s']); rot(w / 2, yc + 74, 'E radial · B azimutal', col['--muted']);
    }
  }

  const txtEst = (e) => (e.tipo === 'sans lumière' ? 'sans lumière' : e.tipo === 'lineal' ? `linéaire à ${f(e.psi)}°` : e.tipo === 'circular' ? `circular ${e.giro === 'antihorario' ? 'a izquierdas' : 'a derechas'}` : `elliptique ${e.giro === 'antihorario' ? 'lévogyre' : 'dextrogyre'}`);
  function ejes(g, x0, y0, x1, y1, tx, ty) {
    flecha(g, x0, y0, x1, y0, col['--muted'], 1.2); flecha(g, x0, y0, x0, y1, col['--muted'], 1.2);
    g.fillStyle = col['--muted']; g.font = `12px ${FU}`; g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText(tx, x1, y0 + 4); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(ty, x0 + 5, y1 + 6);
  }
  function plasmaD(g, w, h) {
    const wl = Math.round(w * 0.42), mx = 38, my = 22, X0 = mx, Y0 = h - 34, XM = wl - 14, YM = my + 10, ymax = Math.max(3, sol.x ? sol.x * 1.15 : 3), xmax = Math.sqrt(ymax * ymax - 1) * 1.02;
    const X = (k) => X0 + (k / xmax) * (XM - X0), Y = (v) => Y0 - (v / ymax) * (Y0 - YM);
    ejes(g, X0, Y0, XM, YM - 6, 'kc/ωp', 'ω/ωp');
    g.setLineDash([5, 4]); g.strokeStyle = col['--muted']; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(0), Y(0)); g.lineTo(X(Math.min(xmax, ymax)), Y(Math.min(xmax, ymax))); g.stroke();
    g.beginPath(); g.moveTo(X0, Y(1)); g.lineTo(XM, Y(1)); g.stroke(); g.setLineDash([]);
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.font = `12px ${FU}`; g.fillText('ω = ωp', X0 + 6, Y(1) - 3);
    g.strokeStyle = col['--e']; g.lineWidth = 2.4; g.beginPath(); for (let i = 0; i <= 120; i++) { const k = (xmax * i) / 120, y = Math.sqrt(1 + k * k); i ? g.lineTo(X(k), Y(y)) : g.moveTo(X(k), Y(y)); } g.stroke();
    const xr = Math.min(wl + 10, w - 120);
    if (sol.fr !== null) {
      const y = Y(sol.x); g.strokeStyle = col['--s']; g.lineWidth = 1.2; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X0, y); g.lineTo(sol.propaga ? X(Math.sqrt(sol.x * sol.x - 1)) : XM, y); g.stroke(); g.setLineDash([]);
      g.fillStyle = col['--s']; g.beginPath(); g.arc(sol.propaga ? X(Math.sqrt(sol.x * sol.x - 1)) : X0, y, 5, 0, 2 * Math.PI); g.fill();
    }
    const x1 = xr, x2 = w - 16, yc = h * 0.5, A = Math.min(h * 0.28, 70);
    g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.moveTo(x1, yc); g.lineTo(x2, yc); g.stroke();
    g.font = `12px ${FU}`; g.textAlign = 'center';
    if (sol.fr === null) { g.fillStyle = col['--muted']; g.textBaseline = 'middle'; g.fillText('Écrivez une fréquence pour voir l\'onde', (x1 + x2) / 2, yc); return; }
    if (sol.propaga) {
      const n = sol.n, vf = 1 / n, vg = n, lamPx = 38, kPx = (2 * Math.PI) / lamPx, c0 = 46, t = tA, W = x2 - x1, sg = W * 0.16, zc = x1 + ((vg * c0 * t) % (W + 4 * sg)) - 2 * sg;
      g.strokeStyle = col['--e']; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i <= W; i += 2) { const x = x1 + i, env = Math.exp(-((x - zc) ** 2) / (2 * sg * sg)); const y = yc - A * env * Math.cos(kPx * (x - x1) - kPx * vf * c0 * t); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.setLineDash([4, 3]); g.strokeStyle = col['--s']; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i <= W; i += 3) { const x = x1 + i, y = yc - A * Math.exp(-((x - zc) ** 2) / (2 * sg * sg)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
      g.fillStyle = col['--s']; g.textBaseline = 'bottom'; g.fillText(txt(`paquete: v_g = ${f(sol.vg)} m/s`), (x1 + x2) / 2, yc - A - 10);
      g.fillStyle = col['--e']; g.textBaseline = 'top'; g.fillText(txt(`crestas: v_f = ${f(sol.vf)} m/s`), (x1 + x2) / 2, yc + A + 8);
    } else {
      const W = x2 - x1, d = W / 4; g.strokeStyle = col['--e']; g.lineWidth = 2.4; g.beginPath(); for (let i = 0; i <= W; i += 2) { const y = yc - A * Math.exp(-i / d); i ? g.lineTo(x1 + i, y) : g.moveTo(x1 + i, y); } g.stroke();
      g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(x1 + d, yc + 6); g.lineTo(x1 + d, yc - 6); g.stroke();
      g.fillStyle = col['--muted']; g.textBaseline = 'top'; g.fillText('δ', x1 + d, yc + 9); g.fillStyle = col['--e']; g.textBaseline = 'bottom'; g.fillText(txt(`onde évanescente : e^(−z/δ), δ = ${f(sol.delta)} m`), (x1 + x2) / 2, yc - A - 10);
    }
  }
  function batidoD(g, w, h) {
    const ml = 18, mr = 18, yc = h * 0.5, A = h * 0.36, Tw = isFinite(sol.Tb) ? 2 * sol.Tb : 4 / sol.fm, X = (t) => ml + (t / Tw) * (w - ml - mr), Y = (v) => yc - (A * v) / sol.Emax;
    flecha(g, ml, yc, w - mr + 8, yc, col['--muted'], 1);
    const N = Math.min(4000, Math.max(600, Math.round(w * 4)));
    g.setLineDash([5, 4]); g.strokeStyle = col['--s']; g.lineWidth = 1.4; for (const sg of [1, -1]) { g.beginPath(); for (let i = 0; i <= N; i++) { const t = (Tw * i) / N; i ? g.lineTo(X(t), Y(sg * sol.env(t))) : g.moveTo(X(t), Y(sg * sol.env(t))); } g.stroke(); } g.setLineDash([]);
    g.strokeStyle = col['--e']; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i <= N; i++) { const t = (Tw * i) / N; i ? g.lineTo(X(t), Y(sol.E(t))) : g.moveTo(X(t), Y(sol.E(t))); } g.stroke();
    const tc = (tA * 0.25 * Tw) % Tw; g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(X(tc), 8); g.lineTo(X(tc), h - 8); g.stroke(); g.fillStyle = col['--ink']; g.beginPath(); g.arc(X(tc), Y(sol.E(tc)), 4, 0, 2 * Math.PI); g.fill();
    g.font = `12px ${FU}`; g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('t', w - mr, yc - 4); g.textAlign = 'left'; g.fillText(txt(isFinite(sol.Tb) ? `fenêtre de 2 périodes de battement = ${f(Tw)} s` : `fenêtre de ${f(Tw)} s`), ml, h - 6);
  }
  function estacD(g, w, h) {
    const ml = 18, mr = 18, yc = h * 0.5, A = h * 0.36, zm = 2 * sol.lam, X = (z) => ml + (z / zm) * (w - ml - mr), Y = (v) => yc - (A * v) / sol.Emax, th = 2 * Math.PI * 0.4 * tA, N = 800;
    flecha(g, ml, yc, w - mr + 8, yc, col['--muted'], 1);
    g.setLineDash([5, 4]); g.strokeStyle = col['--s']; g.lineWidth = 1.4; for (const sg of [1, -1]) { g.beginPath(); for (let i = 0; i <= N; i++) { const z = (zm * i) / N; i ? g.lineTo(X(z), Y(sg * sol.env(z))) : g.moveTo(X(z), Y(sg * sol.env(z))); } g.stroke(); } g.setLineDash([]);
    const d = (sol.delta * Math.PI) / 180, E = (z) => sol.A1 * Math.cos(sol.k * z - th) + sol.A2 * Math.cos(sol.k * z + th + d);
    g.strokeStyle = col['--e']; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i <= N; i++) { const z = (zm * i) / N; i ? g.lineTo(X(z), Y(E(z))) : g.moveTo(X(z), Y(E(z))); } g.stroke();
    g.fillStyle = col['--ink']; for (let m = -4; m < 12; m++) { const z = ((2 * m + 1) * Math.PI - d) / (2 * sol.k); if (z >= 0 && z <= zm) { g.beginPath(); g.arc(X(z), yc, 3.5, 0, 2 * Math.PI); g.fill(); } }
    g.font = `12px ${FU}`; g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('z', w - mr, yc - 4); g.textAlign = 'left'; g.fillText(txt(`2 longueurs d'onde = ${f(zm)} m · ventres ${f(sol.Emax)} V/m · nœuds ${f(sol.Emin)} V/m`), ml, h - 6);
  }
  function elipseGen(g, cx0, cy0, R, e, I, fase) {
    const a = R * Math.sqrt(I) * 1, rz = e.tipo === 'lineal' ? 0 : e.razon, b = a * rz, ps = (e.psi * Math.PI) / 180, sg = e.giro === 'horario' ? -1 : 1;
    const P = (u) => { const x = a * Math.cos(u), y = b * Math.sin(u) * sg; return [cx0 + x * Math.cos(ps) - y * Math.sin(ps), cy0 - (x * Math.sin(ps) + y * Math.cos(ps))]; };
    g.strokeStyle = col['--e']; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 90; i++) { const [x, y] = P((2 * Math.PI * i) / 90); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    const [px, py] = P(fase); g.fillStyle = col['--s']; g.beginPath(); g.arc(px, py, 4, 0, 2 * Math.PI); g.fill();
  }
  function elipseD(g, w, h) {
    const S = sol.estado, cx0 = w * 0.5, cy0 = h * 0.5, R = Math.min(w, h) * 0.38, m = Math.max(sol.A1, sol.A2), esc2 = R / m;
    flecha(g, cx0 - R - 14, cy0, cx0 + R + 18, cy0, col['--muted'], 1); flecha(g, cx0, cy0 + R + 14, cx0, cy0 - R - 18, col['--muted'], 1);
    g.font = `12px ${FU}`; g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('Ex', cx0 + R + 20, cy0 + 4); g.textBaseline = 'bottom'; g.fillText('Ey', cx0 + 6, cy0 - R - 18);
    g.setLineDash([4, 3]); g.strokeStyle = col['--line']; g.strokeRect(cx0 - sol.A1 * esc2, cy0 - sol.A2 * esc2, 2 * sol.A1 * esc2, 2 * sol.A2 * esc2); g.setLineDash([]);
    const ps = (S.psi * Math.PI) / 180; g.strokeStyle = col['--b']; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx0 - S.a * esc2 * Math.cos(ps), cy0 + S.a * esc2 * Math.sin(ps)); g.lineTo(cx0 + S.a * esc2 * Math.cos(ps), cy0 - S.a * esc2 * Math.sin(ps)); g.stroke();
    const d = (sol.delta * Math.PI) / 180, ph = -2 * Math.PI * 0.4 * tA;
    g.strokeStyle = col['--e']; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i <= 180; i++) { const u = (2 * Math.PI * i) / 180, x = cx0 + sol.A1 * esc2 * Math.cos(u), y = cy0 - sol.A2 * esc2 * Math.cos(u + d); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = col['--s']; g.beginPath(); g.arc(cx0 + sol.A1 * esc2 * Math.cos(ph), cy0 - sol.A2 * esc2 * Math.cos(ph + d), 5, 0, 2 * Math.PI); g.fill();
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText(txt(`${S.tipo}${S.giro ? ' · ' + S.giro : ''} · a = ${f(S.a)}, b = ${f(S.b)} V/m`), 12, h - 6);
  }
  function retardoD(g, w, h) {
    const n = sol.etapas.length, paso = (w - 20) / n, yc = h * 0.46, R = Math.min(paso * 0.38, h * 0.3), fase = -2 * Math.PI * 0.6 * tA;
    sol.etapas.forEach((e, i) => {
      const x = 10 + paso * (i + 0.5);
      g.strokeStyle = col['--line']; g.lineWidth = 1; g.beginPath(); g.arc(x, yc, R, 0, 2 * Math.PI); g.stroke();
      g.beginPath(); g.moveTo(x - R, yc); g.lineTo(x + R, yc); g.moveTo(x, yc - R); g.lineTo(x, yc + R); g.stroke();
      if (e.estado.tipo !== 'sans lumière') elipseGen(g, x, yc, R, e.estado, e.I, fase);
      g.font = `12px ${FU}`; g.textAlign = 'center'; g.fillStyle = col['--ink']; g.textBaseline = 'top';
      const nom = i === 0 ? 'Entrée' : (e.nombre || ''); g.fillText(nom.length > 18 && paso < 150 ? nom.replace('Lame ', 'λ ').replace('Polariseur', 'Pol.') : nom, x, yc + R + 8);
      g.fillStyle = col['--muted']; g.textBaseline = 'top'; g.fillText(txt(`I = ${f(e.I, 3)}`), x, yc + R + 26); g.fillText(txt(txtEst(e.estado)), x, yc + R + 44);
      if (i > 0) flecha(g, x - paso + R + 6, yc, x - R - 6, yc, col['--muted'], 1.2);
    });
  }
  function fuente(g, w, h) {
    const cx = Math.min(w * 0.3, 160), cy = h / 2, R = w - cx - 30, paso = 34, t = (tA * 40) % paso;
    g.lineWidth = 1.6;
    for (let r = t; r < R + paso; r += paso) { g.strokeStyle = col['--e']; g.globalAlpha = Math.max(0.08, 0.8 * (1 - r / (R + paso))); g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2.6, Math.PI / 2.6); g.stroke(); }
    g.globalAlpha = 1; g.fillStyle = col['--s']; g.beginPath(); g.arc(cx, cy, 7, 0, 2 * Math.PI); g.fill();
    const xr = cx + R * 0.75; g.strokeStyle = col['--muted']; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(cx, cy); g.lineTo(xr, cy); g.stroke(); g.setLineDash([]);
    g.fillStyle = col['--ink']; g.beginPath(); g.arc(xr, cy, 4, 0, 2 * Math.PI); g.fill();
    g.font = `12px ${FU}`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillStyle = col['--muted']; g.fillText(`r = ${txt(f(sol.r))} m`, (cx + xr) / 2, cy - 6);
    g.textBaseline = 'top'; g.fillStyle = col['--s']; g.fillText(`P = ${txt(f(sol.P))} W`, cx, cy + 12); g.fillStyle = col['--ink']; g.fillText(`I = ${txt(f(sol.I))} W/m²`, xr, cy + 10);
  }

  $('#abrir-fresnel').addEventListener('click', () => {
    if (!sol || sol.modo !== 'incidencia' || sol.cond || !sol.M || !sol.M2) return;
    const n1 = sol.M.n, n2 = sol.M2.n; if (!(n1 > 0 && n2 > 0)) return;
    const c = (x) => String(+x.toPrecision(8)).replace('.', ',');
    try { localStorage.setItem('fresnel-v1', JSON.stringify({ dato: 'n', n1: c(n1), n2: c(n2), theta: '0', E0: String(sol.E0).replace('.', ','), lambda: '' })); } catch (e) { /* sin almacenamiento */ }
    location.href = '../fresnel/' + (location.protocol === 'file:' ? 'index.html' : '');
  });
  Herramienta.exportar('#escena', { nombre: 'ondas-electromagneticas', titulo: 'Ondes électromagnétiques' });
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Reprendre'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sol) { tA += dt; dibuja(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('ondas-em').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.OndasEMApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, I: sol.I, S: sol.S, flujo: sol.flujo, B0: sol.B0, alfa: sol.alfa, delta: sol.delta, r: sol.r, R: sol.R }, estado: () => copia(sc), fresnel: () => { $('#abrir-fresnel').click(); } };
})();

