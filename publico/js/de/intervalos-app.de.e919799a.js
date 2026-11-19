(() => {
  const { $, esc, copia, txt } = Herramienta;
  const I = Intervalos, f = I.f, CLAVE = 'intervalos-v1', E = Estadistica;
  const MODOS = [['media', 'Erwartungswert μ'], ['proporcion', 'Anteil p'], ['prediccion', 'Prognose und Toleranz'], ['varianza', 'Varianz σ² und Standardabweichung σ'], ['dif-medias', 'Differenz der Mittelwerte μ₁ − μ₂'], ['apareadas', 'Gepaarte Daten μ_d'], ['dif-prop', 'Differenz der Anteile p₁ − p₂'], ['cociente-var', 'Varianzquotient σ₁²/σ₂²'], ['tamano', 'Stichprobenumfang']];

  let sc = copia(I.ejemplos[0].sc);
  try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && MODOS.some(([k]) => k === g.modo)) sc = g; } catch (e) { /* sin almacenamiento */ }
  const guarda = () => { try { localStorage.setItem(CLAVE, JSON.stringify(sc)); } catch (e) { /* sin almacenamiento */ } };
  let sol = null, col = {}, sim = null, anda = true;

  const fila = (k, nom, un) => `<label for="f-${k}">${nom}${un ? ` <small>${un}</small>` : ''}</label><input id="f-${k}" class="in" data-k="${k}" value="${esc(sc[k] ?? '')}" inputmode="decimal" autocomplete="off" spellcheck="false">`;
  const elige = (k, nom, lista) => `<label for="f-${k}">${nom}</label><select id="f-${k}" class="in" data-k="${k}">${lista.map(([v, t]) => `<option value="${v}"${String(sc[k]) === v ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
  const area = (k, nom) => `<label for="f-${k}" class="ancho">${nom} <small>getrennt durch Leerzeichen, „;“ oder in Zeilen</small></label><textarea id="f-${k}" class="in ancho" data-k="${k}" rows="4" spellcheck="false" autocomplete="off">${esc(sc[k] ?? '')}</textarea>`;
  const sep = (t) => `<div class="sep">${t}</div>`;
  const FUENTE = [['resumen', 'Eine Zusammenfassung (x̄, s, n)'], ['datos', 'Die Liste der Werte']];
  const TIPO_S = [['cuasi', 'Stichprobenstandardabweichung (mit n − 1)'], ['muestral', 'Standardabweichung der Stichprobe (mit n)']];
  const nivelF = () => fila('nivel', 'Konfidenzniveau', '%');
  const PARAM = { prediccion: 'x', media: 'μ', proporcion: 'p', varianza: 'σ²', 'dif-medias': 'μ₁ − μ₂', apareadas: 'μ<sub>d</sub>', 'dif-prop': 'p₁ − p₂', 'cociente-var': 'σ₁²/σ₂²' };
  const NOTAS = {
    media: 'Wenn dir die Standardabweichung der Grundgesamtheit σ gegeben ist, wähle „σ bekannt“ (es wird z verwendet). Hast du nur die der Stichprobe, wird die Student-t-Verteilung mit n − 1 Freiheitsgraden verwendet.',
    proporcion: 'Du kannst die Anzahl der Erfolge x oder direkt den Anteil der Stichprobe p̂ angeben (0,42 oder 42 %… schreibe 0,42). Die Normalmethode (Wald) ist die aus dem Unterricht; bei wenigen Erfolgen oder Misserfolgen sind Wilson oder die exakte besser.',
    prediccion: 'Das Prognoseintervall sagt, wo der nächste Wert liegen wird; das Toleranzintervall, wo der größte Teil der Grundgesamtheit liegt. Beide sind breiter als das des Mittelwerts und setzen eine normalverteilte Grundgesamtheit voraus.',
    varianza: 'Es wird die χ²-Verteilung mit n − 1 Freiheitsgraden verwendet. Gibt dein Buch die Stichprobenstandardabweichung mit Division durch n an, wähle sie unten, dann wird sie in die Stichprobenstandardabweichung (mit n − 1) umgerechnet.',
    'dif-medias': 'Unabhängige Stichproben. Bei unbekannten σ wird, wenn sie als gleich angenommen werden, die gewichtete Stichprobenvarianz verwendet; sonst die Welch-Näherung.',
    'dif-prop': 'Unabhängige und große Stichproben. Das Intervall von p₁ − p₂ sagt, ob die beiden Anteile verschieden sind.',
    apareadas: 'Zwei Messungen an denselben Individuen (vorher und nachher, zwei Verfahren am selben Teil…). Man arbeitet mit den Differenzen d = x₁ − x₂ als einer einzigen Stichprobe.',
    'cociente-var': 'Vergleicht die Variabilität zweier normalverteilter Grundgesamtheiten mit der F-Verteilung. Enthält das Intervall die 1, können gleiche Varianzen angenommen werden.',
    tamano: 'Wie viele Daten man braucht, um bei dem gewünschten Konfidenzniveau einen Fehler E nicht zu überschreiten. Bei einem Anteil ohne vorherige Schätzung wird p = 0,5 verwendet. Ist die Grundgesamtheit klein, gib ihren Umfang N an.',
  };
  function formulario() {
    let h = elige('modo', 'Intervall für', MODOS);
    const m = sc.modo;
    if (m === 'media' || m === 'varianza') {
      h += elige('fuente', 'Daten', FUENTE);
      if (m === 'media') h += elige('sigmaC', 'Standardabweichung der Grundgesamtheit', [['no', 'σ unbekannt (Student-t)'], ['si', 'σ bekannt (Normalverteilung)']]) + (sc.sigmaC === 'si' ? fila('sigma', 'Standardabweichung σ') : '');
      if (sc.fuente === 'datos') h += area('datos', 'Werte');
      else {
        h += (m === 'media' ? fila('xm', 'Mittelwert der Stichprobe x̄') : '') + fila('n', 'Umfang der Stichprobe n');
        if (!(m === 'media' && sc.sigmaC === 'si')) h += fila('s', 'Standardabweichung der Stichprobe s') + elige('tipoS', 'Diese Standardabweichung ist die', TIPO_S);
      }
    } else if (m === 'proporcion') {
      h += elige('tipoP', 'Daten', [['exitos', 'Anzahl der Erfolge x'], ['proporcion', 'Anteil p̂']]) + fila('n', 'Umfang der Stichprobe n') + (sc.tipoP === 'proporcion' ? fila('ph', 'Anteil p̂') : fila('x', 'Erfolge x'));
      h += elige('metodoP', 'Verfahren', Object.entries(I.METODOS_P));
    } else if (m === 'prediccion') {
      h += elige('queP', 'Intervall für', [['pred', 'Eine zukünftige Beobachtung (Prognose)'], ['tol', 'Ein Anteil der Grundgesamtheit (Toleranz)']]) + elige('fuente', 'Daten', FUENTE);
      if (sc.fuente === 'datos') h += area('datos', 'Werte');
      else h += fila('xm', 'Mittelwert der Stichprobe x̄') + fila('n', 'Umfang der Stichprobe n') + fila('s', 'Standardabweichung der Stichprobe s') + elige('tipoS', 'Diese Standardabweichung ist die', TIPO_S);
      if (sc.queP === 'tol') h += fila('cob', 'Anteil der Grundgesamtheit', '%');
    } else if (m === 'dif-medias') {
      h += elige('caso', 'Standardabweichungen', [['conocidas', 'σ₁ und σ₂ bekannt (Normalverteilung)'], ['iguales', 'Unbekannt, aber gleich (t)'], ['distintas', 'Unbekannt und verschieden (Welch)']]) + elige('fuente', 'Daten', FUENTE);
      for (const i of ['1', '2']) {
        h += sep(`Stichprobe ${i}`);
        if (sc.fuente === 'datos') h += area('datos' + i, 'Werte');
        else h += fila('xm' + i, `Mittelwert x̄${i === '1' ? '₁' : '₂'}`) + fila('n' + i, `Umfang n${i === '1' ? '₁' : '₂'}`);
        if (sc.caso === 'conocidas') h += fila('sigma' + i, `σ${i === '1' ? '₁' : '₂'} der Grundgesamtheit`);
        else if (sc.fuente !== 'datos') h += fila('s' + i, `Stichprobenstandardabweichung s${i === '1' ? '₁' : '₂'}`);
      }
      h += sep('Konfidenz');
    } else if (m === 'apareadas') {
      h += elige('fuente', 'Daten', [['datos', 'Die beiden Wertelisten'], ['resumen', 'Eine Zusammenfassung (d̄, s_d, n)']]);
      if (sc.fuente === 'datos') h += area('datos1', 'Werte der Messung 1 (vorher)') + area('datos2', 'Werte der Messung 2 (nachher), in derselben Reihenfolge');
      else h += fila('n', 'Anzahl der Paare n') + fila('dm', 'Mittelwert der Differenzen d̄') + fila('sd', 'Stichprobenstandardabweichung der Differenzen s<sub>d</sub>');
    } else if (m === 'cociente-var') {
      h += elige('fuente', 'Daten', FUENTE);
      for (const i of ['1', '2']) { const s = i === '1' ? '₁' : '₂'; h += sep(`Stichprobe ${i}`) + (sc.fuente === 'datos' ? area('datos' + i, 'Werte') : fila('n' + i, `Umfang n${s}`) + fila('s' + i, `Stichprobenstandardabweichung s${s}`)); }
      h += sep('Konfidenz');
    } else if (m === 'dif-prop') {
      h += elige('tipoP', 'Daten', [['exitos', 'Anzahl der Erfolge'], ['proporcion', 'Anteile p̂']]);
      for (const i of ['1', '2']) { const s = i === '1' ? '₁' : '₂'; h += sep(`Stichprobe ${i}`) + fila('n' + i, `Umfang n${s}`) + (sc.tipoP === 'proporcion' ? fila('ph' + i, `Anteil p̂${s}`) : fila('x' + i, `Erfolge x${s}`)); }
      h += sep('Konfidenz');
    } else {
      h += elige('de', 'Zu schätzen', [['media', 'Ein Mittelwert'], ['proporcion', 'Ein Anteil'], ['dif-medias', 'Eine Differenz von Mittelwerten'], ['dif-prop', 'Eine Differenz von Anteilen']]) + fila('E', 'Maximaler Fehler E');
      h += sc.de === 'proporcion' ? fila('p0', 'Erwarteter Anteil p', '(opcional)') : sc.de === 'dif-medias' ? fila('sigma1', 'σ₁ der Grundgesamtheit 1') + fila('sigma2', 'σ₂ der Grundgesamtheit 2') : sc.de === 'dif-prop' ? fila('p1', 'Erwarteter Anteil p₁', '(opcional)') + fila('p2', 'Erwarteter Anteil p₂', '(opcional)') : fila('sigma', 'Standardabweichung σ');
    }
    h += nivelF();
    if (m !== 'tamano' && !(m === 'prediccion' && sc.queP === 'tol')) h += elige('lado', 'Art des Intervalls', [['dos', 'Zweiseitig (a; b)'], ['inf', 'Untere Schranke (a; +∞)'], ['sup', 'Obere Schranke (−∞; b)']]);
    if (m === 'media' || m === 'proporcion' || (m === 'tamano' && (sc.de === 'media' || sc.de === 'proporcion' || !sc.de))) h += fila('Npob', 'Umfang der Grundgesamtheit N', '(opcional, si es finita)');
    if (m !== 'tamano' && m !== 'prediccion') h += fila('h0', `Testen ${PARAM[m]} =`, '(opcional)');
    $('#campos').innerHTML = h;
    $('#nota').textContent = NOTAS[m];
  }
  const cambia = () => { $('#ejemplos').value = ''; calcula(); };
  $('#campos').addEventListener('input', (e) => { const t = e.target; if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return; sc[t.dataset.k] = t.value; cambia(); });
  $('#campos').addEventListener('change', (e) => {
    const t = e.target; if (t.tagName !== 'SELECT') return;
    const k = t.dataset.k;
    if (k === 'modo') sc = copia(I.ejemplos.find((x) => x.sc.modo === t.value).sc);
    else if (k === 'queP') { sc.queP = t.value; if (t.value === 'tol') { sc.lado = 'dos'; if (!sc.cob) sc.cob = '90'; } }
    else {
      sc[k] = t.value;
      if (k === 'fuente') { sc.fuente1 = sc.fuente2 = t.value; if (t.value === 'datos') for (const d of ['dif-medias', 'apareadas', 'cociente-var'].includes(sc.modo) ? ['datos1', 'datos2'] : ['datos']) if (!sc[d]) sc[d] = d === 'datos2' ? '11,2 12,8 10,9 12,1 11,7 12,4' : '12,1 13,4 11,8 12,9 13,2 12,5'; }
    }
    formulario(); cambia();
  });

  const sel = $('#ejemplos');
  sel.innerHTML = '<option value="">Beispiele…</option>' + MODOS.map(([k, m]) => `<optgroup label="${m}">${I.ejemplos.filter((e) => e.sc.modo === k).map((e) => `<option value="${e.clave}">${e.nombre}</option>`).join('')}</optgroup>`).join('');
  sel.addEventListener('change', () => { if (sel.value) abrirEjemplo(sel.value); });
  function abrirEjemplo(clave) {
    const e = I.ejemplos.find((x) => x.clave === clave);
    if (!e) return;
    sc = copia(e.sc); if (sc.fuente1 && !sc.fuente) sc.fuente = sc.fuente1;
    formulario(); calcula(); sel.value = clave;
  }
  function azar() {
    const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(+x.toFixed(2)).replace('.', ',');
    const nivel = de(['90', '95', '95', '99']);
    const tipos = [
      () => { const conocida = Math.random() < 0.5, s = ent(2, 30); return { modo: 'media', fuente: 'resumen', sigmaC: conocida ? 'si' : 'no', sigma: conocida ? String(s) : '', xm: String(ent(20, 500)), s: conocida ? '' : String(s), n: String(de([9, 10, 16, 25, 36, 49, 64, 100])), nivel, tipoS: 'cuasi' }; },
      () => { const n = de([100, 200, 400, 500, 1000]); return { modo: 'proporcion', tipoP: 'exitos', n: String(n), x: String(ent(Math.round(n * 0.1), Math.round(n * 0.7))), ph: '', nivel }; },
      () => ({ modo: 'varianza', fuente: 'resumen', xm: '', s: c(ent(10, 80) / 10), n: String(ent(8, 30)), nivel, tipoS: 'cuasi' }),
      () => { const s = ent(3, 12); return { modo: 'dif-medias', caso: 'conocidas', fuente: 'resumen', fuente1: 'resumen', fuente2: 'resumen', xm1: String(ent(60, 90)), n1: String(ent(30, 80)), sigma1: String(s), xm2: String(ent(60, 90)), n2: String(ent(30, 80)), sigma2: String(s + ent(0, 4)), nivel, tipoS: 'cuasi' }; },
      () => ({ modo: 'media', fuente: 'resumen', sigmaC: 'no', sigma: '', xm: String(ent(50, 300)), s: String(ent(5, 40)), n: String(de([10, 16, 20, 25])), nivel, tipoS: 'cuasi', lado: de(['inf', 'sup']) }),
      () => ({ modo: 'apareadas', fuente: 'resumen', n: String(ent(8, 20)), dm: c(ent(5, 40) / 10), sd: c(ent(10, 50) / 10), nivel }),
      () => (Math.random() < 0.5 ? { modo: 'tamano', de: 'media', sigma: String(ent(5, 30)), E: String(ent(1, 5)), p0: '', nivel } : { modo: 'tamano', de: 'proporcion', sigma: '', E: c(de([0.02, 0.03, 0.04, 0.05])), p0: Math.random() < 0.5 ? '' : c(ent(10, 60) / 100), nivel }),
    ];
    sc = de(tipos)();
    formulario(); calcula(); sel.value = '';
  }
  const enunciado = () => {
    const nc = `al ${esc(sc.nivel)} %`;
    if (sc.modo === 'media' && (sc.lado === 'inf' || sc.lado === 'sup')) return `Eine Stichprobe von ${esc(sc.n)} Elementen hat den Mittelwert ${esc(sc.xm)} und die Stichprobenstandardabweichung ${esc(sc.s)}. Berechne die ${sc.lado === 'inf' ? 'untere' : 'obere'} Schranke des Mittelwerts der Grundgesamtheit mit einem Konfidenzniveau von ${esc(sc.nivel)} %.`;
    switch (sc.modo) {
      case 'apareadas': return `${esc(sc.n)} Personen werden vor und nach einer Behandlung gemessen. Der Mittelwert der Differenzen ist ${esc(sc.dm)} und ihre Stichprobenstandardabweichung ${esc(sc.sd)}. Berechne das ${nc}-Konfidenzintervall für den Mittelwert der Differenzen.`;
      case 'cociente-var': return `Zwei Stichproben von ${esc(sc.n1)} und ${esc(sc.n2)} Teilen haben die Stichprobenstandardabweichungen ${esc(sc.s1)} und ${esc(sc.s2)}. Berechne das ${nc}-Intervall für σ₁²/σ₂² und gib an, ob die Varianzen gleich sein können.`;
      case 'media': return sc.fuente === 'datos' ? `Berechne mit den Daten der Stichprobe das ${nc}-Konfidenzintervall für den Mittelwert der Grundgesamtheit.` : `Eine Stichprobe von ${esc(sc.n)} Elementen hat den Mittelwert ${esc(sc.xm)}${sc.sigmaC === 'si' ? `. Die Standardabweichung der Grundgesamtheit ist ${esc(sc.sigma)}` : ` und die Stichprobenstandardabweichung ${esc(sc.s)}`}. Berechne das ${nc}-Konfidenzintervall für den Mittelwert und den maximalen Fehler.`;
      case 'proporcion': return `In einer Stichprobe von ${esc(sc.n)} Personen ${sc.tipoP === 'proporcion' ? `beträgt der Anteil mit dem Merkmal ${esc(sc.ph)}` : `haben ${esc(sc.x)} das Merkmal`}. Berechne das ${nc}-Konfidenzintervall für den Anteil und den maximalen Fehler.`;
      case 'varianza': return `Eine Stichprobe von ${esc(sc.n)} Teilen hat die Stichprobenstandardabweichung ${esc(sc.s)}. Berechne das ${nc}-Konfidenzintervall für die Varianz und für die Standardabweichung der Grundgesamtheit.`;
      case 'dif-medias': return `Zwei unabhängige Stichproben: n₁ = ${esc(sc.n1)} mit Mittelwert ${esc(sc.xm1)} und n₂ = ${esc(sc.n2)} mit Mittelwert ${esc(sc.xm2)}${sc.caso === 'conocidas' ? `, aus Grundgesamtheiten mit σ₁ = ${esc(sc.sigma1)} und σ₂ = ${esc(sc.sigma2)}` : ''}. Berechne das ${nc}-Intervall für μ₁ − μ₂ und gib an, ob die Mittelwerte verschieden sind.`;
      case 'dif-prop': return `In einer Stichprobe von ${esc(sc.n1)} gibt es ${esc(sc.x1)} Erfolge und in einer anderen von ${esc(sc.n2)} ${esc(sc.x2)}. Berechne das ${nc}-Intervall für p₁ − p₂.`;
      default: return sc.de === 'proporcion' ? `Wie viele Personen muss man befragen, um einen Anteil${sc.p0 ? ` (der voraussichtlich ${esc(sc.p0)} beträgt)` : ''} mit einem maximalen Fehler von ${esc(sc.E)} und einem Konfidenzniveau von ${esc(sc.nivel)} % zu schätzen?` : `Die Standardabweichung einer Grundgesamtheit ist ${esc(sc.sigma)}. Welcher Stichprobenumfang ist nötig, um den Mittelwert mit einem maximalen Fehler von ${esc(sc.E)} und einem Konfidenzniveau von ${esc(sc.nivel)} % zu schätzen?`;
    }
  };

  const dato = (t, v, cl = '') => `<div${cl ? ` class="${cl}"` : ''}><span>${t}</span>${v}</div>`;
  const CRIT = (s) => {
    const al = s.lado === 'inf' || s.lado === 'sup' ? 'α' : 'α/2', X = s.crit === 'F' ? 'F' : 'χ<sup>2</sup>';
    if (s.crit === 'z') return `z<sub>${al}</sub> = <b>${f(s.k)}</b>`;
    if (s.crit === 't') return `t<sub>${s.gl}; ${al}</sub> = <b>${f(s.k)}</b>`;
    if (s.crit === 'k') return `k = <b>${f(s.k)}</b>`;
    return s.lado === 'inf' ? `${X} = <b>${f(s.k)}</b>` : s.lado === 'sup' ? `${X} = <b>${f(s.k2)}</b>` : `${X} = ${f(s.k2)} y ${f(s.k)}`;
  };
  const extremo = (x) => (x === Infinity ? '+∞' : x === -Infinity ? '−∞' : f(x, 5));
  const iv = (a, b) => `(${extremo(a)}; ${extremo(b)})`;
  function calcula() {
    const err = $('#error');
    try { sol = I.resolver({ ...sc, fuente1: sc.fuente ?? sc.fuente1, fuente2: sc.fuente ?? sc.fuente2 }); } catch (e) { sol = null; err.textContent = e.message; err.hidden = false; $('#res').innerHTML = ''; $('#usar-en').hidden = true; $('#pasos').innerHTML = ''; $('#cuenta').textContent = ''; sim = null; dibuja(); return; }
    err.hidden = true; guarda();
    const nc = `${f(100 * sol.c)} %`;
    let h;
    if (sol.modo === 'tamano') h = dato(sol.de.startsWith('dif') ? 'Umfang jeder Stichprobe' : 'Stichprobenumfang', `n = <b>${sol.n}</b>`) + dato('Ungerundet', `${f(sol.n0, 6)}`) + dato('Kritischer Wert', CRIT(sol));
    else {
      const tipo = sol.lado === 'inf' ? 'Untere Schranke' : sol.lado === 'sup' ? 'Obere Schranke' : 'Intervall';
      h = dato(`${tipo} bei ${nc} für ${sol.paramTxt || PARAM[sol.modo]}`, `<b>${iv(sol.a, sol.b)}</b>`, 'ancho');
      if (sol.modo === 'varianza') h += dato(`Intervall für σ`, `<b>${iv(sol.sa, sol.sb)}</b>`) + dato('Schätzung', `s<sup>2</sup> = ${f(sol.est, 5)}`);
      else if (sol.modo === 'cociente-var') h += dato(`Intervall für σ₁/σ₂`, `<b>${iv(sol.sa, sol.sb)}</b>`) + dato('Schätzung', `s₁<sup>2</sup>/s₂<sup>2</sup> = ${f(sol.est, 5)}`);
      else h += dato('Schätzung', `${{ prediccion: 'x̄', media: 'x̄', proporcion: 'p̂', 'dif-medias': 'x̄₁ − x̄₂', apareadas: 'd̄', 'dif-prop': 'p̂₁ − p̂₂' }[sol.modo]} = ${f(sol.est, 5)}`) + dato('Maximaler Fehler', `E = <b>${f(sol.err)}</b>`);
      h += dato(sol.crit === 'k' ? 'Toleranzfaktor' : 'Kritischer Wert', CRIT(sol));
      if (sol.modo === 'proporcion') h += dato('Verfahren', I.METODOS_P[sol.metodoP]);
      if (sol.h0 !== undefined) h += dato(`Test von ${PARAM[sol.modo]} = ${f(sol.h0)}`, sol.rechaza ? '<b>H₀ wird verworfen</b>' : '<b>H₀ wird nicht verworfen</b>', 'ancho');
    }
    $('#res').innerHTML = h;
    const ue = $('#usar-en'), lleva = (sol.modo === 'media' || sol.modo === 'prediccion' || sol.modo === 'varianza') && sc.fuente === 'datos' && !Herramienta.vacio(sc.datos);
    ue.hidden = !lleva;
    ue.innerHTML = lleva ? `<a class="btn" data-usar="descriptiva" href="${esc(Herramienta.enlaceA('descriptiva', { formato: 'lista', datos: sc.datos, pesos: '', div: 'n1', pk: '' }))}">Deskriptive Statistik dieser Daten →</a>` : '';
    $('#pasos').innerHTML = sol.pasos.map((p) => `<li><strong>${p.t}</strong>${p.html}</li>`).join('');
    $('#simcard').hidden = sol.modo === 'tamano' || sol.modo === 'prediccion';
    nuevaSim();
    dibuja();
  }

  const N = 100;
  function nuevaSim() {
    const g = sol && I.simula(sol);
    sim = g ? { ...g, hechos: [], t: 0 } : null;
    if (!sim) return;
    try { for (let i = 0; i < N; i++) sim.hechos.push(g.una()); } catch (e) { sim = null; }
    $('#cuenta').textContent = '';
  }
  const visibles = () => (sim ? Math.min(N, Math.floor(sim.t * 25)) : 0);

  function colores() { const cs = getComputedStyle(document.documentElement); for (const c of ['--ink', '--muted', '--line', '--accent', '--accent-soft', '--panel', '--bg', '--ok', '--mal']) col[c] = cs.getPropertyValue(c).trim(); }
  const lienzo = (s) => Herramienta.lienzo(s);
  const FUENTE_UI = '"IBM Plex Sans", system-ui, sans-serif';
  function dibuja() { campana(); simulacion(); }
  function campana() {
    const { g, w, h } = lienzo('#grafica');
    if (!sol) return;
    const S = sol.sinGrafica ? { ...sol, k: sol.kz, c: sol.cob, crit: 'z', dist: { d: 'normal' } } : sol;
    if (!col['--ink']) colores();
    const d = S.dist, D = E.DIST[d.d], P = d.d === 'normal' ? { mu: 0, sigma: 1 } : d.d === 't' ? { nu: d.nu } : d.d === 'f' ? { d1: d.d1, d2: d.d2 } : { k: d.k };
    const al = 1 - S.c, asim = d.d === 'chi2' || d.d === 'f', inf = S.lado === 'inf', sup = S.lado === 'sup';
    let x0, x1;
    if (d.d === 'chi2') { x0 = 0; x1 = Math.max(S.k * 1.25, d.k + 4 * Math.sqrt(2 * d.k)); } else if (d.d === 'f') { x0 = 0; x1 = Math.max(S.k * 1.25, E.cuantil(D, P, 0.99)); } else { const r = Math.max(4, S.k * 1.35); x0 = -r; x1 = r; }
    const lo = inf ? x0 : asim ? S.k2 : -S.k, hi = sup ? x1 : S.k;
    const mL = 16, mR = 16, mT = 26, mB = 30, M = 300, xs = Array.from({ length: M + 1 }, (_, i) => x0 + ((x1 - x0) * i) / M), ys = xs.map((x) => D.pdf(P, x));
    const ymax = Math.max(...ys.filter(isFinite)) * 1.1 || 1;
    const X = (x) => mL + ((x - x0) / (x1 - x0)) * (w - mL - mR), Y = (y) => h - mB - (Math.min(y, ymax) / ymax) * (h - mT - mB);
    const tramo = (a, b, color) => { g.fillStyle = color; g.beginPath(); g.moveTo(X(a), Y(0)); for (let i = 0; i <= 80; i++) { const x = a + ((b - a) * i) / 80; g.lineTo(X(x), Y(D.pdf(P, x))); } g.lineTo(X(b), Y(0)); g.closePath(); g.fill(); };
    tramo(Math.max(x0 + 1e-9, lo), Math.min(x1, hi), col['--accent-soft']);
    g.globalAlpha = 0.35; if (!inf) tramo(x0 + 1e-9, lo, col['--mal']); if (!sup) tramo(hi, x1, col['--mal']); g.globalAlpha = 1;
    g.strokeStyle = col['--accent']; g.lineWidth = 2.4; g.beginPath(); xs.forEach((x, i) => (i ? g.lineTo(X(x), Y(ys[i])) : g.moveTo(X(x), Y(ys[i])))); g.stroke();
    g.strokeStyle = col['--muted']; g.lineWidth = 1; g.beginPath(); g.moveTo(mL, Y(0)); g.lineTo(w - mR, Y(0)); g.stroke();
    g.font = `12px ${FUENTE_UI}`; g.textAlign = 'center'; g.textBaseline = 'top';
    for (const [x, t] of [[lo, f(lo)], [hi, f(hi)]].filter((_, i) => (i ? !sup : !inf))) { g.strokeStyle = col['--ink']; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(X(x), Y(0)); g.lineTo(X(x), mT - 4); g.stroke(); g.setLineDash([]); g.fillStyle = col['--ink']; g.fillText(txt(t), X(x), h - mB + 6); }
    const nom = d.d === 'normal' ? 'Z ~ N(0, 1)' : d.d === 't' ? `T ~ Student-t mit ${d.nu} Freiheitsgraden` : d.d === 'f' ? `F-Verteilung mit (${d.d1}, ${d.d2}) Freiheitsgraden` : `χ² mit ${d.k} Freiheitsgraden`;
    g.fillStyle = col['--muted']; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(nom, mL, 4);
    g.fillStyle = col['--accent']; g.textAlign = 'center'; g.font = `600 13px ${FUENTE_UI}`; g.fillText(`1 − α = ${txt(f(S.c))}`, X((lo + hi) / 2), Y(D.pdf(P, (lo + hi) / 2)) * 0.5 + Y(0) * 0.5);
    g.font = `12px ${FUENTE_UI}`; g.fillStyle = col['--mal'];
    const ya = mT + (h - mT - mB) * 0.6, et = inf || sup ? `α = ${txt(f(al))}` : `α/2 = ${txt(f(al / 2))}`, an = g.measureText(et).width;
    if (!inf) { if (X(lo) - 8 - an >= mL) { g.textAlign = 'right'; g.fillText(et, X(lo) - 8, ya); } else { g.textAlign = 'left'; g.fillText(et, mL, ya - 18); } }
    if (!sup) { if (X(hi) + 8 + an <= w - mR) { g.textAlign = 'left'; g.fillText(et, X(hi) + 8, ya); } else { g.textAlign = 'right'; g.fillText(et, w - mR, ya - 18); } }
  }
  function simulacion() {
    const { g, w, h } = lienzo('#sim');
    if (!sim || !sol) return;
    const v = visibles(), hs = sim.hechos;
    const fin = hs.flat().concat(sim.real).filter(isFinite);
    let a = Math.min(...fin), b = Math.max(...fin);
    const pad = (b - a) * 0.05 || 1; a -= pad; b += pad;
    const mL = 12, mR = 12, mT = 22, mB = 26, X = (x) => mL + ((Math.max(a, Math.min(b, x)) - a) / (b - a)) * (w - mL - mR), paso = (h - mT - mB) / N;
    g.font = `11px ${FUENTE_UI}`; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = col['--muted']; g.strokeStyle = col['--line']; g.lineWidth = 1;
    const p0 = (b - a) / 6, e = 10 ** Math.floor(Math.log10(p0)), st = [1, 2, 2.5, 5, 10].map((q) => q * e).find((q) => q >= p0);
    for (let x = Math.ceil(a / st) * st; x <= b; x += st) { g.beginPath(); g.moveTo(X(x), mT); g.lineTo(X(x), h - mB); g.stroke(); g.fillText(txt(f(Math.abs(x) < st * 1e-9 ? 0 : x)), X(x), h - mB + 6); }
    let dentro = 0;
    for (let i = 0; i < v; i++) {
      const [lo, hi, est] = hs[i], ok = lo <= sim.real && sim.real <= hi, y = mT + paso * (i + 0.5);
      if (ok) dentro++;
      g.strokeStyle = ok ? col['--ok'] : col['--mal']; g.lineWidth = Math.max(1, Math.min(2.2, paso * 0.6)); g.beginPath(); g.moveTo(X(lo), y); g.lineTo(X(hi), y); g.stroke();
      g.fillStyle = g.strokeStyle; g.fillRect(X(est) - 1, y - Math.max(1, paso * 0.4), 2, Math.max(2, paso * 0.8));
    }
    g.strokeStyle = col['--ink']; g.lineWidth = 1.6; g.beginPath(); g.moveTo(X(sim.real), mT - 4); g.lineTo(X(sim.real), h - mB); g.stroke();
    g.fillStyle = col['--ink']; g.textBaseline = 'top'; g.font = `600 12px ${FUENTE_UI}`; g.fillText(`${sol.param.replace('μ_d', 'μd')} real = ${txt(f(sim.real, 5))}`, X(sim.real), 4);
    $('#cuenta').innerHTML = v ? `<b>${dentro} von ${v}</b> Intervallen enthalten den wahren Wert${v === N ? ` (erwartet werden etwa ${Math.round(100 * sol.c)})` : ''}.` : '';
  }

  $('#otra').addEventListener('click', () => { nuevaSim(); if (sim) sim.t = 0; anda = true; $('#play').textContent = '⏸ Pause'; dibuja(); });
  $('#play').addEventListener('click', () => { anda = !anda; $('#play').textContent = anda ? '⏸ Pause' : '▶ Fortsetzen'; });
  let ultimo = performance.now();
  function bucle() {
    const ahora = performance.now(), dt = Math.min(0.1, (ahora - ultimo) / 1000); ultimo = ahora;
    if (anda && sim && visibles() < N) { sim.t += dt; simulacion(); }
    requestAnimationFrame(bucle);
  }
  window.addEventListener('resize', dibuja);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { colores(); dibuja(); });

  const ver = $('#ver'); if (ver) ver.textContent = Version.de('intervalos').current;
  formulario(); colores(); calcula(); requestAnimationFrame(bucle);
  window.IntervalosApp = { abrirEjemplo, azar, enunciado, resultado: () => sol && { modo: sol.modo, a: sol.a, b: sol.b, n: sol.n, k: sol.k }, estado: () => copia(sc), simulacion: () => sim && { real: sim.real, dentro: sim.hechos.filter(([a, b]) => a <= sim.real && sim.real <= b).length } };
})();

