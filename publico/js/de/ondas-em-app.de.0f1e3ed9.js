(() => {
  const { $, esc, copia } = Herramienta;
  const O = OndasEM, f = O.f, CLAVE = 'ondasem-v1';
  const txt = (h) => String(h).replace(/<sup>(.*?)<\/sup>/g, (_, e) => e.replace(/−/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])).replace(/<sub>(.*?)<\/sub>/g, (_, e) => e.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d])).replace(/<[^>]+>/g, '');
  const MODOS = [['onda', 'Ebene Welle: E, B und ihr Ausdruck'], ['expresion', 'Welle aus E(r, t) oder B(r, t)'], ['incidencia', 'Senkrechter Einfall: Reflexion und stehende Welle'], ['intensidad', 'Intensität und Strahlungsdruck'], ['perdidas', 'Verlustbehaftetes Medium (Leiter)'], ['polarizadores', 'Polarisatoren: Gesetz von Malus'], ['poynting', 'Poynting-Vektor und Energiebilanz'], ['plasma', 'Plasma und Ionosphäre: Dispersionsrelation'], ['suma', 'Summe zweier Wellen: Schwebungen, stehende Wellen, Polarisation'], ['retardo', 'Verzögerungsplatten λ/4 und λ/2 (Jones)']];
  const DIRS = ['+x', '-x', '+y', '-y', '+z', '-z'].map((d) => [d, d.replace('-', '−')]).concat([['otra', 'otra (componentes)']]);

  let sc = copia(O.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, anda = true, tA = 0;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const sep = (t) => `<div class="sep">${t}</div>`;
  const tres = (p, nom) => `<label>${nom}</label><div class="tres">${['x', 'y', 'z'].map((e) => `<input id="f-${p}${e}" class="in" data-k="${p}${e}" value="${esc(sc[p + e] ?? '')}" inputmode="decimal" autocomplete="off" placeholder="${e}" aria-label="${nom}, Komponente ${e}">`).join('')}</div>`;
  const DATO = [['f', 'Frequenz f'], ['lambda', 'Wellenlänge λ'], ['omega', 'Kreisfrequenz ω'], ['k', 'Wellenzahl k']], UN = { f: 'Hz', lambda: 'm', omega: 'rad/s', k: 'rad/m' };
  const medioF = () => elige('medio', 'Mittel', [['vacio', 'Vakuum (oder Luft)'], ['medio', 'Ein Material (εr, μr)']]) + (sc.medio === 'medio' ? fila('er', 'Relative Permittivität ε<sub>r</sub>') + fila('mr', 'Relative Permeabilität μ<sub>r</sub>', 'opcional, 1') : '');
  const NOTAS = {
    onda: 'Erlaubt sind 3e8, 3·10^8 oder 10^8. Die Welle wird als E₀ cos(k·r − ωt + φ) geschrieben: Läuft sie in Richtung −z, ergibt sich cos(kz + ωt). E muss senkrecht zur Ausbreitungsrichtung stehen. Bei „andere“ gibst du die Komponenten ein, z. B. (1, 1, 0).',
    expresion: 'Schreibe die Amplitude, cos oder sin mit der Phase und die Richtung: 30 cos(2,094y + 6,283e8t) k, 5 sin(2x + 2y − 8,5e8t + π/4) (1, −1, 0) … Erlaubt sind î ĵ k̂, i j k oder x y z.',
    incidencia: 'Die Welle kommt aus z < 0 in Richtung +z, mit E in x-Richtung, und trifft bei z = 0 auf einen perfekten Leiter oder ein anderes Medium.',
    intensidad: 'Die Intensität ist der Mittelwert des Poynting-Vektors. Eine Punktquelle verteilt sie auf eine Kugel, sie sinkt also wie 1/r².',
    polarizadores: 'Winkel der Achsen zu einer festen Richtung, durch Semikolon getrennt: 0; 45; 90. Die Polarisatoren sind ideal. Natürliches Licht verliert im ersten die Hälfte; lineares folgt dem Gesetz von Malus I = I₀ cos²θ.',
    poynting: 'Gleichstrom: Die Energie kommt über die Felder von außen. Der Fluss von S = E × B/μ₀ durch die Oberfläche stimmt mit der abgeführten oder gespeicherten Leistung überein.',
    plasma: 'Elektronendichte nₑ in m⁻³ (die Ionosphäre liegt bei etwa 10¹¹–10¹² m⁻³, ein Metall bei 10²⁸–10²⁹). Frequenz und Winkel sind optional: Mit der Frequenz wird angegeben, ob sich die Welle ausbreitet, und mit dem Winkel wird das Sekansgesetz angewendet.',
    suma: 'Addiere zwei Wellen in einem Punkt oder entlang z. Schwebungen: zwei ähnliche Frequenzen. Stehende Welle: einfallende und reflektierte mit unterschiedlichen Amplituden (die Phase δ ist die der reflektierten). Polarisation: zwei senkrechte, um δ phasenverschobene Wellen.',
    retardo: 'Bis zu vier Elemente der Reihe nach, mit dem Winkel ihrer Achse zur x-Achse. Beim Polarisator ist es die Transmissionsachse und bei den Platten die schnelle Achse. Das Eingangslicht hat die Intensität 1.',
    perdidas: 'Mit der Leitfähigkeit σ wird die Welle wie e^(−αz) gedämpft. Ist σ/(ωε) viel größer als 1, ist das Medium ein guter Leiter, und die Welle dringt kaum ein (Skineffekt).',
  };
  function formulario() {
    let h = elige('modo', 'Rechnung', MODOS);
    if (sc.modo === 'onda') {
      const tp = sc.tipoPol || 'lineal';
      h += medioF() + elige('dato', 'Wellendaten', DATO) + fila('valor', DATO.find(([k]) => k === (sc.dato || 'f'))[1], UN[sc.dato || 'f']) + fila('E0', tp === 'lineal' ? 'Amplitude E<sub>0</sub>' : 'Amplitude E<sub>01</sub>', 'V/m') + sep('Richtungen') + elige('prop', 'Breitet sich aus in Richtung', DIRS) + (sc.prop === 'otra' ? tres('k', 'Richtung von k') : '') + elige('pol', 'E zeigt in Richtung', DIRS) + (sc.pol === 'otra' ? tres('e', 'Richtung von E') : '');
      h += sep('Polarisation und Phase') + elige('tipoPol', 'Polarisation', [['lineal', 'Linear'], ['circular', 'Rund'], ['eliptica', 'Elliptisch']]);
      if (tp === 'circular') h += elige('giro', 'Dreht, vom Empfänger aus gesehen', [['antihorario', 'Gegen den Uhrzeigersinn'], ['horario', 'Im Uhrzeigersinn']]);
      if (tp === 'eliptica') h += fila('E02', 'Amplitude E<sub>02</sub> (in Richtung k̂ × Ê)', 'V/m') + fila('delta', 'Phasenverschiebung δ', '°');
      h += fila('fase', 'Anfangsphase φ (optional)', '°');
    } else if (sc.modo === 'expresion') h += elige('campo', 'Me dan', [['E', 'Das elektrische Feld E(r, t)'], ['B', 'Das magnetische Feld B(r, t)']]) + `<label for="f-expr">${sc.campo === 'B' ? 'B(r, t) in T' : 'E(r, t) in V/m'}</label><input id="f-expr" class="in" data-k="expr" value="${esc(sc.expr ?? '')}" autocomplete="off" spellcheck="false">`;
    else if (sc.modo === 'incidencia') h += medioF() + elige('dato', 'Wellendaten', DATO) + fila('valor', DATO.find(([k]) => k === (sc.dato || 'f'))[1], UN[sc.dato || 'f']) + fila('E0', 'Einfallende Amplitude E<sub>0</sub>', 'V/m') + sep('Auf der anderen Seite von z = 0') + elige('destino', 'Trifft auf', [['conductor', 'Einen perfekten Leiter'], ['dielectrico', 'Ein anderes Medium (Dielektrikum)']]) + (sc.destino === 'dielectrico' ? fila('er2', 'Relative Permittivität ε<sub>r2</sub>') + fila('mr2', 'Relative Permeabilität μ<sub>r2</sub>', 'opcional, 1') : '');
    else if (sc.modo === 'intensidad') {
      h += medioF() + elige('von', 'Angabe', [['fuente', 'Leistung einer Quelle und Abstand'], ['I', 'Die Stromstärke I'], ['E0', 'Die Amplitude E₀']]);
      h += sc.de === 'fuente' ? fila('P', 'Leistung P', 'W') + fila('r', 'Entfernung r', 'm') : sc.de === 'I' ? fila('I', 'Stromstärke I', 'W/m²') : fila('E0', 'Amplitude E<sub>0</sub>', 'V/m');
      h += sep('Optional') + fila('A', 'Fläche der Oberfläche A', 'm²');
    } else if (sc.modo === 'polarizadores') {
      h += elige('luz', 'Einfallendes Licht', [['natural', 'Natürlich (unpolarisiert)'], ['lineal', 'Linear polarisiert'], ['circular', 'Rund']]) + fila('I0', 'Intensität I<sub>0</sub>', 'W/m²');
      if (sc.luz === 'lineal') h += fila('alfa', 'Polarisationswinkel des Lichts', '°');
      h += fila('angulos', 'Achsen der Polarisatoren', '° getrennt durch ;');
    } else if (sc.modo === 'poynting') {
      h += elige('sis', 'System', [['hilo', 'Draht mit Strom (Joulesche Wärme)'], ['condensador', 'Sich ladender Kondensator'], ['coaxial', 'Koaxialkabel']]);
      if (sc.sis === 'hilo') h += fila('a', 'Radius a', 'm') + fila('L', 'Länge L', 'm') + fila('I', 'Strom I', 'A') + fila('sigma', 'Leitfähigkeit σ', 'S/m');
      else if (sc.sis === 'condensador') h += fila('a', 'Plattenradius a', 'm') + fila('d', 'Abstand d', 'm') + fila('V', 'Spannung V', 'V') + fila('I', 'Ladestrom I', 'A');
      else h += fila('a', 'Innenradius a', 'm') + fila('b', 'Außenradius b', 'm') + fila('V', 'Spannung V', 'V') + fila('I', 'Strom I', 'A') + fila('r', 'Punkt r (optional, a ≤ r ≤ b)', 'm');
    } else if (sc.modo === 'plasma') h += fila('ne', 'Elektronendichte n<sub>e</sub>', 'm⁻³') + fila('valor', 'Frequenz f (optional)', 'Hz') + fila('ang', 'Einfallswinkel (optional)', '°');
    else if (sc.modo === 'suma') {
      h += elige('caso', 'Was addiert wird', [['batido', 'Zwei Frequenzen: Schwebungen'], ['estacionaria', 'Einfallende und reflektierte: stehende Welle'], ['polarizacion', 'Zwei senkrechte Wellen: Polarisation']]);
      const e = sc.caso === 'estacionaria', pl = sc.caso === 'polarizacion';
      h += fila('A1', pl ? 'Amplitude in x, A<sub>1</sub>' : e ? 'Einfallende Amplitude A<sub>1</sub>' : 'Amplitude A<sub>1</sub>', 'V/m') + fila('A2', pl ? 'Amplitude in y, A<sub>2</sub>' : e ? 'Reflektierte Amplitude A<sub>2</sub>' : 'Amplitude A<sub>2</sub>', 'V/m');
      if (sc.caso === 'batido') h += fila('f1', 'Frequenz f<sub>1</sub>', 'Hz') + fila('f2', 'Frequenz f<sub>2</sub>', 'Hz'); else if (e) h += fila('f1', 'Frequenz f', 'Hz');
      h += fila('delta', pl ? 'Phasenverschiebung δ von y gegenüber x' : 'Phasenverschiebung δ der zweiten Welle', '°');
    } else if (sc.modo === 'retardo') {
      h += elige('luz', 'Eingangslicht', [['lineal', 'Linear'], ['circI', 'Linkszirkular'], ['circD', 'Rechtszirkular']]);
      if (sc.luz === 'lineal') h += fila('alfa', 'Polarisationswinkel', '°');
      for (let i = 1; i <= 4; i++) { h += sep(`Element ${i}`) + elige('e' + i, `Element ${i}`, [['', '— keines —'], ['pol', 'Polarisator'], ['l4', 'λ/4-Platte'], ['l2', 'λ/2-Platte']]); if (sc['e' + i]) h += fila('a' + i, `Winkel der Achse ${i}`, '°'); }
    } else h += fila('sigma', 'Leitfähigkeit σ', 'S/m') + fila('er', 'Relative Permittivität ε<sub>r</sub>') + fila('mr', 'Relative Permeabilität μ<sub>r</sub>', 'opcional, 1') + fila('valor', 'Frequenz f', 'Hz') + sep('Optional') + fila('E0', 'Amplitude beim Eintritt E<sub>0</sub>', 'V/m') + fila('d', 'Tiefe z', 'm');
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
  sel.innerHTML = '<option value="">Beispiele …</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${O.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${esc(e.nombre)}</option>`).join('')}</optgroup>`).join('');
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
      const dato = { f: `frecuencia ${esc(sc.valor)} Hz`, lambda: `Wellenlänge ${esc(sc.valor)} m`, omega: `Kreisfrequenz ${esc(sc.valor)} rad/s`, k: `Wellenzahl ${esc(sc.valor)} rad/m` }[sc.dato || 'f'];
      return `Eine ebene elektromagnetische Welle mit ${dato} und der Amplitude E₀ = ${esc(sc.E0)} V/m breitet sich in Richtung ${esc(sc.prop)} ${sc.medio === 'medio' ? `in einem Medium mit εr = ${esc(sc.er)}` : 'im Vakuum'} aus, mit E in Richtung ${esc(sc.pol)}. Berechne λ, k, ω, das Feld B und seine Richtung, schreibe E und B auf und berechne die Intensität.`;
    }
    if (sc.modo === 'expresion') return `Das ${sc.campo === 'B' ? 'magnetische' : 'elektrische'} Feld einer ebenen Welle ist ${sc.campo === 'B' ? 'B' : 'E'}(r, t) = ${esc(sc.expr)} (SI). Berechne die Ausbreitungsrichtung, λ, f, die Geschwindigkeit, das andere Feld und die Intensität.`;
    if (sc.modo === 'incidencia') return `Eine ebene Welle mit ${esc(sc.valor)} ${UN[sc.dato || 'f']} und der Amplitude ${esc(sc.E0)} V/m trifft aus dem Vakuum senkrecht auf ${sc.destino === 'dielectrico' ? `ein Medium mit εr = ${esc(sc.er2)}. Berechne die Reflexions- und Transmissionskoeffizienten und welcher Bruchteil der Energie reflektiert wird.` : 'einen perfekten Leiter. Schreibe die entstehende stehende Welle auf, gib an, wo die Knoten von E liegen, und berechne den Strahlungsdruck.'}`;
    if (sc.modo === 'intensidad') return sc.de === 'fuente' ? `Eine Punktquelle strahlt ${esc(sc.P)} W gleichmäßig in alle Richtungen ab. Berechne die Intensität in ${esc(sc.r)} m Abstand, die Amplituden von E und B und den Strahlungsdruck.` : sc.de === 'I' ? `Eine Welle hat die Intensität ${esc(sc.I)} W/m². Berechne E₀, B₀, die Energiedichte und den Strahlungsdruck${sc.A ? ` sowie die Kraft auf ${esc(sc.A)} m²` : ''}.` : `Das elektrische Feld einer Welle hat die Amplitude ${esc(sc.E0)} V/m. Berechne die Intensität, B₀ und den Strahlungsdruck.`;
    if (sc.modo === 'polarizadores') return `Ein ${{ natural: 'natürliches Lichtbündel', lineal: `linear polarisiertes Lichtbündel unter ${esc(sc.alfa)}°`, circular: 'zirkular polarisiertes Lichtbündel' }[sc.luz || 'natural']} mit der Intensität ${esc(sc.I0)} W/m² durchläuft ideale Polarisatoren mit Achsen unter ${esc(sc.angulos)} Grad. Berechne die Intensität nach jedem und die Endintensität.`;
    if (sc.modo === 'poynting') return { hilo: `Ein Draht mit dem Radius ${esc(sc.a)} m, der Länge ${esc(sc.L)} m und σ = ${esc(sc.sigma)} S/m führt einen Strom von ${esc(sc.I)} A. Berechne E, B und den Poynting-Vektor an seiner Oberfläche und prüfe, dass sein Fluss der abgeführten Leistung entspricht.`, condensador: `Ein Kondensator mit kreisförmigen Platten vom Radius ${esc(sc.a)} m im Abstand ${esc(sc.d)} m wird mit ${esc(sc.I)} A geladen, wenn er ${esc(sc.V)} V hat. Berechne E, B am Rand, S und prüfe die Energiebilanz.`, coaxial: `Ein Koaxialkabel mit den Radien ${esc(sc.a)} m und ${esc(sc.b)} m führt ${esc(sc.I)} A bei ${esc(sc.V)} V zwischen seinen Leitern. Berechne E, B und S zwischen ihnen und die übertragene Leistung.` }[sc.sis || 'hilo'];
    if (sc.modo === 'plasma') return `Ein Plasma hat ${esc(sc.ne)} Elektronen pro m³. Berechne seine Plasmafrequenz${vacio(sc.valor) ? '' : ` und gib an, ob sich eine Welle von ${esc(sc.valor)} Hz ausbreitet (Brechungsindex, Phasen- und Gruppengeschwindigkeit)`}${vacio(sc.ang) ? '' : `; bei Einfall unter ${esc(sc.ang)}° bestimme die maximale Frequenz, die reflektiert wird`}.`;
    if (sc.modo === 'suma') return sc.caso === 'batido' ? `Zwei Wellen mit den Amplituden ${esc(sc.A1)} und ${esc(sc.A2)} V/m und den Frequenzen ${esc(sc.f1)} und ${esc(sc.f2)} Hz werden addiert. Berechne die Schwebungsfrequenz, die mittlere Frequenz sowie die maximale und minimale Amplitude.` : sc.caso === 'estacionaria' ? `Eine Welle von ${esc(sc.f1)} Hz und ${esc(sc.A1)} V/m wird mit ${esc(sc.A2)} V/m und der Phasenverschiebung ${esc(sc.delta)}° reflektiert. Berechne die Wellenlänge, die Amplitude in Bäuchen und Knoten und das Stehwellenverhältnis.` : `Es werden Ex = ${esc(sc.A1)} cos(kz − ωt) und Ey = ${esc(sc.A2)} cos(kz − ωt + ${esc(sc.delta)}°) addiert. Berechne die Art der Polarisation, den Drehsinn und die Halbachsen der Ellipse.`;
    if (sc.modo === 'retardo') return `${{ lineal: `Linear unter ${esc(sc.alfa)}° polarisiertes Licht`, circI: 'Linkszirkulares Licht', circD: 'Rechtszirkulares Licht' }[sc.luz || 'lineal']} durchläuft ${[1, 2, 3, 4].filter((i) => sc['e' + i]).map((i) => `${{ pol: 'einen Polarisator', l4: 'eine λ/4-Platte', l2: 'eine λ/2-Platte' }[sc['e' + i]]} unter ${esc(sc['a' + i])}°`).join(', dann ')}. Bestimme mit dem Jones-Kalkül die Polarisation und die Ausgangsintensität.`;
    return `Eine Welle von ${esc(sc.valor)} Hz tritt in ein Medium mit σ = ${esc(sc.sigma)} S/m und εr = ${esc(sc.er)} ein. Ist es ein guter Leiter? Berechne α, β, die Eindringtiefe und die Impedanz.`;
  };

  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  function calcula() {
    const err = $('#error');
    try { sol = O.resolver(sc); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#pasos').innerHTML = ''; $('#leyenda').textContent = ''; dibuja(); return; }
    err.hidden = true; guarda(); tA = 0;
    let h;
    if (sol.modo === 'incidencia') {
      h = sol.cond ? dato('Reflexionskoeffizient', 'r = <b>−1</b>') + dato('Abstand zwischen den Knoten', `λ/2 = <b>${f(sol.F.lam / 2)} m</b>`) + dato('Amplitude in den Bäuchen', `2E<sub>0</sub> = <b>${f(2 * sol.E0)} V/m</b>`) + dato('Strahlungsdruck', `p = ${f((2 * sol.I0) / sol.M.v)} Pa`) + dato('Oberflächenstrom', `K = ${f(sol.K)} A/m`) + dato('Elektrisches Feld', `E = ${f(2 * sol.E0)} sen(${f(sol.F.k)}z) sen(${f(sol.F.w)}t) î V/m`, 'ancho')
        : dato('Reflexion', `r = <b>${f(sol.r)}</b>`) + dato('Transmission', `t = <b>${f(sol.t)}</b>`) + dato('Reflektierte Energie', `R = <b>${f(100 * sol.R, 3)} %</b>`) + dato('Transmittierte Energie', `T = <b>${f(100 * sol.T, 3)} %</b>`) + dato('Stehende Welle', `|E| zwischen ${f(sol.E0 * (1 - Math.abs(sol.r)))} und ${f(sol.E0 * (1 + Math.abs(sol.r)))} V/m`);
    } else if (sol.modo === 'onda' || sol.modo === 'expresion') {
      h = dato('Wellenlänge', `λ = <b>${f(sol.F.lam)} m</b>`) + dato('Wellenzahl', `k = <b>${f(sol.F.k)} rad/m</b>`) + dato('Kreisfrequenz', `ω = ${f(sol.F.w)} rad/s`) + dato('Frequenz', `f = ${f(sol.F.fr)} Hz`)
        + dato('Amplitude von B', `B<sub>0</sub> = <b>${f(sol.B0)} T</b>`) + dato('Intensität', `I = <b>${f(sol.I)} W/m<sup>2</sup></b>`) + dato('Elektrisches Feld', sol.Eexp, 'ancho') + dato('Magnetfeld', sol.Bexp, 'ancho');
    } else if (sol.modo === 'intensidad') {
      h = dato('Intensität', `I = <b>${f(sol.I)} W/m<sup>2</sup></b>`) + dato('Amplitude von E', `E<sub>0</sub> = <b>${f(sol.E0)} V/m</b>`) + dato('Amplitude von B', `B<sub>0</sub> = <b>${f(sol.B0)} T</b>`) + dato('Energiedichte', `u = ${f(sol.u)} J/m<sup>3</sup>`) + dato('Druck (Absorption)', `p = ${f(sol.pa)} Pa`);
      if (sol.A !== null) h += dato('Kraft (Absorption)', `F = ${f(sol.pa * sol.A)} N`);
    } else if (sol.modo === 'polarizadores') {
      h = dato('Endintensität', `I = <b>${f(sol.I)} W/m<sup>2</sup></b>`) + dato('Durchgelassener Anteil', `I/I<sub>0</sub> = <b>${f(sol.frac)}</b> (${f(100 * sol.frac, 3)} %)`) + dato('Endamplitude', `E<sub>0</sub> = ${f(sol.E0f)} V/m`) + dato('Endpolarisation', `linear unter <b>${f(sol.angs[sol.angs.length - 1])}°</b>`);
      sol.etapas.forEach((e, i) => { h += dato(`Nach Polarisator ${i + 1}`, `I<sub>${i + 1}</sub> = ${f(e.I)} W/m<sup>2</sup>`); });
    } else if (sol.modo === 'poynting') {
      h = dato('Elektrisches Feld', `E = <b>${f(sol.E)} V/m</b>`) + dato('Magnetfeld', `B = <b>${f(sol.B)} T</b>`) + dato('Poynting-Vektor', `S = <b>${f(sol.S)} W/m<sup>2</sup></b>`) + dato('Richtung von S', sol.dir) + dato(sol.sis === 'coaxial' ? 'Übertragene Leistung' : 'Fluss von S durch die Oberfläche', `Φ = <b>${f(sol.flujo)} W</b>`) + dato(sol.sis === 'hilo' ? 'Verlustleistung I²R' : sol.sis === 'condensador' ? 'dU/dt = V I' : 'P = V I', `${f(sol.P)} W`);
    } else if (sol.modo === 'plasma') {
      h = dato('Plasma-Kreisfrequenz', `ω<sub>p</sub> = <b>${f(sol.wp)} rad/s</b>`) + dato('Plasmafrequenz', `f<sub>p</sub> = <b>${f(sol.fp)} Hz</b>`) + dato('Plasma-Wellenlänge', `λ<sub>p</sub> = ${f(sol.lp)} m`);
      if (sol.fr !== null) h += dato('Verhältnis', `ω/ω<sub>p</sub> = ${f(sol.x)}`) + (sol.propaga ? dato('Zustand', '<b>breitet sich aus</b>') + dato('Brechungsindex', `n = <b>${f(sol.n)}</b>`) + dato('Wellenlänge', `λ = ${f(sol.lam)} m`) + dato('Phasengeschwindigkeit', `v<sub>f</sub> = <b>${f(sol.vf)} m/s</b>`) + dato('Gruppengeschwindigkeit', `v<sub>g</sub> = <b>${f(sol.vg)} m/s</b>`) : dato('Zustand', '<b>breitet sich nicht aus (evaneszent)</b>') + dato('Dämpfung', `κ = <b>${f(sol.kappa)} m<sup>-1</sup></b>`) + dato('Eindringtiefe', `δ = ${f(sol.delta)} m`));
      h += sol.ang === null ? dato('Vertikale Reflexion bis', `f<sub>p</sub> = ${f(sol.fp)} Hz`) : dato(`Maximale Frequenz bei ${f(sol.ang)}°`, `f<sub>p</sub>/cos θ = <b>${f(sol.fcrit)} Hz</b>`);
      if (sol.fr !== null) h += dato('Wird sie in der Schicht reflektiert?', `<b>${sol.reflejada ? 'ja' : 'nein, sie geht hindurch'}</b>`);
    } else if (sol.modo === 'suma') {
      if (sol.caso === 'batido') h = dato('Mittlere Frequenz', `f̄ = <b>${f(sol.fm)} Hz</b>`) + dato('Schwebungsfrequenz', `f<sub>b</sub> = <b>${f(sol.df)} Hz</b>`) + dato('Maximale Amplitude', `A<sub>1</sub> + A<sub>2</sub> = <b>${f(sol.Emax)} V/m</b>`) + dato('Minimale Amplitude', `|A<sub>1</sub> − A<sub>2</sub>| = <b>${f(sol.Emin)} V/m</b>`) + (isFinite(sol.Tb) ? dato('Schwebungsperiode', `T<sub>b</sub> = ${f(sol.Tb)} s`) : '');
      else if (sol.caso === 'estacionaria') h = dato('Wellenlänge', `λ = <b>${f(sol.lam)} m</b>`) + dato('Wellenzahl', `k = ${f(sol.k)} rad/m`) + dato('Amplitude in den Bäuchen', `<b>${f(sol.Emax)} V/m</b>`) + dato('Amplitude in den Knoten', `<b>${f(sol.Emin)} V/m</b>`) + dato('Stehwellenverhältnis', `SWR = <b>${sol.ROE === Infinity ? '∞' : f(sol.ROE)}</b>`) + (sol.Pr !== null ? dato('Reflektierte Leistung', `${f(100 * sol.Pr, 3)} %`) : '');
      else h = dato('Polarisation', `<b>${sol.estado.tipo}</b>`) + (sol.estado.giro ? dato('Drehsinn (vom Empfänger aus gesehen)', `${sol.estado.giro}`) : '') + dato('Große Halbachse', `a = <b>${f(sol.estado.a)} V/m</b>`) + dato('Kleine Halbachse', `b = <b>${f(sol.estado.b)} V/m</b>`) + dato('Neigung der Hauptachse', `ψ = ${f(sol.estado.psi)}°`);
    } else if (sol.modo === 'retardo') {
      h = dato('Ausgangslicht', `<b>${sol.texto}</b>`) + dato('Ausgangsintensität', `I/I<sub>0</sub> = <b>${f(sol.I, 4)}</b> (${f(100 * sol.I, 4)} %)`);
      sol.etapas.slice(1).forEach((e, i) => { h += dato(`Nach Element ${i + 1}`, `I = ${f(e.I, 4)}, ${txtEst(e.estado)}`); });
    } else {
      h = dato('Art des Mediums', `<b>${sol.tipo}</b>`) + dato('σ/(ωε)', `${f(sol.tg)}`) + dato('Dämpfung', `α = <b>${f(sol.alfa)} Np/m</b>`) + dato('Phasenkonstante', `β = ${f(sol.beta)} rad/m`) + dato('Eindringtiefe', `δ = <b>${f(sol.delta)} m</b>`) + dato('Impedanz', `|η| = ${f(sol.etaM)} Ω`);
      if (sol.Ed !== null) h += dato(`E a z = ${f(sol.d)} m`, `<b>${f(sol.Ed)} V/m</b>`);
    }
    $('#res').innerHTML = h;
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${Mates.html(p.html, true)}</li>`).join('');
    $('#abrir-fresnel').hidden = !(sol.modo === 'incidencia' && !sol.cond && sol.M && sol.M2);
    $('#leyenda').innerHTML = sol.modo === 'plasma' ? 'Links: Dispersionsrelation ω(k); die gestrichelte Linie ist das Licht im Vakuum. Rechts: ein Wellenpaket, das sich mit v<sub>g</sub> bewegt, während die Wellenberge mit v<sub>f</sub> laufen, oder das Abklingen einer evaneszenten Welle.' : sol.modo === 'suma' ? (sol.caso === 'batido' ? 'Gesamt-E in einem Punkt als Funktion der Zeit mit ihrer Hüllkurve (gestrichelte Linie): Die Amplitude pulsiert mit der Schwebungsfrequenz.' : sol.caso === 'estacionaria' ? 'E(z) in diesem Augenblick und seine Hüllkurve; die Punkte sind die Knoten im Abstand λ/2.' : 'Kurve, die die Spitze von E in einem festen Punkt durchläuft, mit ihren Halbachsen; der Punkt markiert den Drehsinn.') : sol.modo === 'retardo' ? 'Polarisationszustand nach jedem Element, vom Empfänger des Lichts aus gesehen: Größe ∝ √I; die Spitze bewegt sich im Drehsinn.' : sol.modo === 'polarizadores' ? 'Jede Scheibe ist ein Polarisator mit seiner Achse; der rote Pfeil ist E dahinter, mit einer Länge proportional zu √I.' : sol.modo === 'poynting' ? 'E in Rot, B in Blau und S in Bernstein: S = E × B/μ₀ zeigt in die Richtung, in der die Energie wandert.' : sol.modo === 'incidencia' ? `Gesamt-E in Rot und Gesamt-B in Blau entlang z; die gestrichelte Linie ist die Amplitude. ${sol.cond ? 'Die Punkte markieren die Knoten von E: Die Welle schreitet nicht fort, sie schwingt an Ort und Stelle.' : 'Rechts die transmittierte Welle.'}` : sol.modo === 'intensidad' && sol.de === 'fuente' ? 'Kugelförmige Wellenfronten, die von der Quelle ausgehen: Dieselbe Leistung verteilt sich auf immer größere Kugeln.' : (sol.tp && sol.tp !== 'lineal') ? 'E in Rot und B in Blau: Bei zwei phasenverschobenen Komponenten dreht sich die Spitze von E um die Ausbreitungsachse (in Orange die Ausbreitungsrichtung).' : `E in Rot, B in Blau und die Ausbreitungsrichtung (der Poynting-Vektor) in Orange${sol.modo === 'perdidas' && sol.alfa > 0 ? '; die gestrichelte Linie ist die Hüllkurve e<sup>−αz</sup> und die Markierung die Tiefe δ' : ''}.`;
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
    g.fillStyle = col['--muted']; g.font = `12px ${FU}`; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(`Abschnitt von ${txt(f(L, 3))} m${per ? ` = ${txt(f(L / lam, 3))} λ` : ''}`, x1, h - 6);
  }
  function incide(g, w, h) {
    const { F, E0, cond } = sol, lam = F.lam, k = F.k, r = sol.r, tt = sol.t, lam2 = cond ? lam : lam * (sol.M2.v / sol.M.v), z0 = -2 * lam, z1 = cond ? 0.25 * lam : 1.5 * lam2;
    const ml = 20, mr = 20, X = (z) => ml + ((z - z0) / (z1 - z0)) * (w - ml - mr), yc = h * 0.52, A = h * 0.2, Y = (e) => yc - (A * e) / E0, wt = tA * 2.4;
    const xs = X(0);
    g.fillStyle = cond ? col['--muted'] : col['--line']; g.globalAlpha = cond ? 0.35 : 0.5; g.fillRect(xs, 8, w - mr - xs + mr, h - 16); g.globalAlpha = 1;
    g.font = `12px ${FU}`; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = col['--muted'];
    g.fillText(sol.M.vacioM ? 'Vakuum' : 'medio 1', (ml + xs) / 2, 10); g.fillText(cond ? 'conductor' : 'medio 2', (xs + w - mr) / 2, 10);
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
    g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillStyle = col['--muted']; g.fillText(cond ? `Knoten von E alle λ/2 = ${txt(f(lam / 2, 3))} m` : `r = ${txt(f(r, 3))}, t = ${txt(f(tt, 3))}`, ml, h - 6);
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
      flecha(g, x0 + 10, yc, x1 - 10, yc, col['--e'], 2.4); rot(x1 - 20, yc - 12, 'E, I', col['--e']); rot(w / 2, yc - hh - 58, 'S tritt durch die Oberfläche ein', col['--s']); rot(w / 2, yc + hh + 58, 'B umgibt den Draht', col['--b']);
    } else if (sol.sis === 'condensador') {
      const xa = w * 0.3, xb = w * 0.7, ya = yc - 54, yb = yc + 54;
      g.fillStyle = col['--ink']; g.fillRect(xa, ya - 3, xb - xa, 6); g.fillRect(xa, yb - 3, xb - xa, 6);
      for (let x = xa + 24; x < xb - 10; x += 36) flecha(g, x, ya + 8, x, yb - 8, col['--e'], 1.8);
      flecha(g, xa - 40, yc, xa + 24, yc, col['--s'], 2.6); flecha(g, xb + 40, yc, xb - 24, yc, col['--s'], 2.6);
      rot(w / 2, yc, 'E', col['--e']); rot(xa - 50, yc - 12, 'S', col['--s']); rot(w / 2, yb + 22, 'die Energie tritt am Rand ein, nicht über die Drähte', col['--muted']);
    } else {
      g.fillStyle = col['--ink']; g.fillRect(x0, yc - 56, x1 - x0, 5); g.fillRect(x0, yc + 51, x1 - x0, 5); g.fillRect(x0, yc - 7, x1 - x0, 14);
      for (let x = x0 + 20 + p; x < x1 - 30; x += 28) { flecha(g, x, yc - 28, x + 20, yc - 28, col['--s'], 2.2); flecha(g, x, yc + 28, x + 20, yc + 28, col['--s'], 2.2); }
      rot(w / 2, yc - 74, 'S (von der Quelle zur Last) zwischen den Leitern', col['--s']); rot(w / 2, yc + 74, 'E radial · B azimutal', col['--muted']);
    }
  }

  const txtEst = (e) => (e.tipo === 'kein Licht' ? 'kein Licht' : e.tipo === 'lineal' ? `linear bei ${f(e.psi)}°` : e.tipo === 'circular' ? `circular ${e.giro === 'antihorario' ? 'a izquierdas' : 'a derechas'}` : `elliptisch ${e.giro === 'antihorario' ? 'linkszirkular' : 'rechtszirkular'}`);
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
    if (sol.fr === null) { g.fillStyle = col['--muted']; g.textBaseline = 'middle'; g.fillText('Gib eine Frequenz ein, um die Welle zu sehen', (x1 + x2) / 2, yc); return; }
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
      g.fillStyle = col['--muted']; g.textBaseline = 'top'; g.fillText('δ', x1 + d, yc + 9); g.fillStyle = col['--e']; g.textBaseline = 'bottom'; g.fillText(txt(`evaneszente Welle: e^(−z/δ), δ = ${f(sol.delta)} m`), (x1 + x2) / 2, yc - A - 10);
    }
  }
  function batidoD(g, w, h) {
    const ml = 18, mr = 18, yc = h * 0.5, A = h * 0.36, Tw = isFinite(sol.Tb) ? 2 * sol.Tb : 4 / sol.fm, X = (t) => ml + (t / Tw) * (w - ml - mr), Y = (v) => yc - (A * v) / sol.Emax;
    flecha(g, ml, yc, w - mr + 8, yc, col['--muted'], 1);
    const N = Math.min(4000, Math.max(600, Math.round(w * 4)));
    g.setLineDash([5, 4]); g.strokeStyle = col['--s']; g.lineWidth = 1.4; for (const sg of [1, -1]) { g.beginPath(); for (let i = 0; i <= N; i++) { const t = (Tw * i) / N; i ? g.lineTo(X(t), Y(sg * sol.env(t))) : g.moveTo(X(t), Y(sg * sol.env(t))); } g.stroke(); } g.setLineDash([]);
    g.strokeStyle = col['--e']; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i <= N; i++) { const t = (Tw * i) / N; i ? g.lineTo(X(t), Y(sol.E(t))) : g.moveTo(X(t), Y(sol.E(t))); } g.stroke();
    const tc = (tA * 0.25 * Tw) % Tw; g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(X(tc), 8); g.lineTo(X(tc), h - 8); g.stroke(); g.fillStyle = col['--ink']; g.beginPath(); g.arc(X(tc), Y(sol.E(tc)), 4, 0, 2 * Math.PI); g.fill();
    g.font = `12px ${FU}`; g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('t', w - mr, yc - 4); g.textAlign = 'left'; g.fillText(txt(isFinite(sol.Tb) ? `Fenster von 2 Schwebungsperioden = ${f(Tw)} s` : `Fenster von ${f(Tw)} s`), ml, h - 6);
  }
  function estacD(g, w, h) {
    const ml = 18, mr = 18, yc = h * 0.5, A = h * 0.36, zm = 2 * sol.lam, X = (z) => ml + (z / zm) * (w - ml - mr), Y = (v) => yc - (A * v) / sol.Emax, th = 2 * Math.PI * 0.4 * tA, N = 800;
    flecha(g, ml, yc, w - mr + 8, yc, col['--muted'], 1);
    g.setLineDash([5, 4]); g.strokeStyle = col['--s']; g.lineWidth = 1.4; for (const sg of [1, -1]) { g.beginPath(); for (let i = 0; i <= N; i++) { const z = (zm * i) / N; i ? g.lineTo(X(z), Y(sg * sol.env(z))) : g.moveTo(X(z), Y(sg * sol.env(z))); } g.stroke(); } g.setLineDash([]);
    const d = (sol.delta * Math.PI) / 180, E = (z) => sol.A1 * Math.cos(sol.k * z - th) + sol.A2 * Math.cos(sol.k * z + th + d);
    g.strokeStyle = col['--e']; g.lineWidth = 2.2; g.beginPath(); for (let i = 0; i <= N; i++) { const z = (zm * i) / N; i ? g.lineTo(X(z), Y(E(z))) : g.moveTo(X(z), Y(E(z))); } g.stroke();
    g.fillStyle = col['--ink']; for (let m = -4; m < 12; m++) { const z = ((2 * m + 1) * Math.PI - d) / (2 * sol.k); if (z >= 0 && z <= zm) { g.beginPath(); g.arc(X(z), yc, 3.5, 0, 2 * Math.PI); g.fill(); } }
    g.font = `12px ${FU}`; g.fillStyle = col['--muted']; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText('z', w - mr, yc - 4); g.textAlign = 'left'; g.fillText(txt(`2 Wellenlängen = ${f(zm)} m · Bäuche ${f(sol.Emax)} V/m · Knoten ${f(sol.Emin)} V/m`), ml, h - 6);
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
      if (e.estado.tipo !== 'kein Licht') elipseGen(g, x, yc, R, e.estado, e.I, fase);
      g.font = `12px ${FU}`; g.textAlign = 'center'; g.fillStyle = col['--ink']; g.textBaseline = 'top';
      const nom = i === 0 ? 'Eintritt' : (e.nombre || ''); g.fillText(nom.length > 18 && paso < 150 ? nom.replace('Platte', 'λ ').replace('Polarisator', 'Pol.') : nom, x, yc + R + 8);
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
  Herramienta.exportar('#escena', { nombre: 'ondas-electromagneticas', titulo: 'Elektromagnetische Wellen' });
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Fortsetzen'; });
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

