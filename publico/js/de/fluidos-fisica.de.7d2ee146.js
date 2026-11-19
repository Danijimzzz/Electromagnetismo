const Fluidos = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Es fehlt ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} muss eine Zahl sein`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${Mayus(nom)} muss ${cero ? 'positiv oder null' : 'größer als 0'} sein`);
    return v;
  }
  const G = 9.8, ATM = 101325;
  const MATERIALES = [['Gold', 19300], ['Blei', 11340], ['Silber', 10490], ['Kupfer', 8960], ['Eisen', 7870], ['Aluminium', 2700]];
  const gDe = (sc) => lee(sc, 'g', 'die Erdbeschleunigung', { opcional: true }) ?? G;
  const circulo = (dcm) => (Math.PI * (dcm / 100) ** 2) / 4; // área en m² de un círculo de diámetro en cm
  const areaPaso = (nom, A, dcm) => `$A_${nom} = {π d_${nom}^2}/{4} = {π · ${f(dcm / 100)}^2}/{4}$ = ${f(A)} m²`;

  function presion(sc) {
    const rho = lee(sc, 'rho', 'die Dichte der Flüssigkeit'), h = lee(sc, 'h', 'die Tiefe', { cero: true }), g = gDe(sc);
    const p0dato = lee(sc, 'p0', 'der Druck an der Oberfläche', { opcional: true, cero: true });
    const p0 = p0dato ?? ATM, A = lee(sc, 'A', 'die Bodenfläche', { opcional: true });
    const pm = rho * g * h, pa = p0 + pm;
    const pasos = [
      { t: 'Druck durch die Flüssigkeit', html: `Der hydrostatische Druck hängt nur von der Tiefe ab, nicht von der Form des Gefäßes: $p_{man} = ρ g h = ${f(rho)} · ${f(g)} · ${f(h)}$ = <b>${f(pm)} Pa</b>. Das ist der Druck, den ein Manometer anzeigt (Überdruck).` },
      { t: 'Absoluter Druck', html: `${p0dato === null ? 'Auf der Oberfläche lastet die Atmosphäre, $p_0 = 101325$ Pa: ' : ''}$p = p_0 + ρ g h = ${f(p0)} + ${f(pm)}$ = <b>${f(pa)} Pa</b> = ${f(pa / ATM)} atm` },
    ];
    let F = null;
    if (A) {
      F = pm * A;
      pasos.push({ t: 'Kraft der Flüssigkeit auf den Boden', html: `$F = p_{man} A = ${f(pm)} · ${f(A)}$ = <b>${f(F)} N</b><br>Die Atmosphäre drückt auch von außen auf das Gefäß, ihr Anteil hebt sich also auf; mit ihr wäre es $p A = ${f(pa * A)}$ N.` });
    }
    pasos.push({ t: 'Wie schnell der Druck mit der Tiefe steigt', html: `In dieser Flüssigkeit steigt der Druck alle $h = p_{atm}/(ρ g) = 101325/(${f(rho)} · ${f(g)})$ = ${f(ATM / (rho * g))} m um 1 atm.` });
    return { modo: 'presion', rho, h, g, p0, pm, pa, A, F, pasos };
  }

  function tuboU(sc) {
    const rho1 = lee(sc, 'rho1', 'die Dichte der Flüssigkeit am Boden'), h2 = lee(sc, 'h2', 'die Höhe der hinzugefügten Säule');
    let rho2, h1;
    const pasos = [{ t: 'Gleiche Höhe, gleicher Druck', html: 'An der Trennfläche der beiden Flüssigkeiten und in gleicher Höhe im anderen Schenkel befindet sich dieselbe ruhende, verbundene Flüssigkeit, der Druck ist also gleich. Darüber hat jeder Schenkel seine Säule und oben die Atmosphäre: $p_0 + ρ_2 g h_2 = p_0 + ρ_1 g h_1$, also $ρ_2 h_2 = ρ_1 h_1$.' }];
    if (sc.buscar === 'densidad') {
      h1 = lee(sc, 'h1', 'die Höhe auf der anderen Seite');
      if (h1 >= h2) throw new Error('Die Säule der hinzugefügten Flüssigkeit muss höher sein als die auf der anderen Seite (sie ist die weniger dichte)');
      rho2 = (rho1 * h1) / h2;
      pasos.push({ t: 'Dichte der hinzugefügten Flüssigkeit', html: `$ρ_2 = {ρ_1 h_1}/{h_2} = {${f(rho1)} · ${f(h1)}}/{${f(h2)}}$ = <b>${f(rho2)} kg/m³</b>` });
    } else {
      rho2 = lee(sc, 'rho2', 'die Dichte der hinzugefügten Flüssigkeit');
      if (rho2 >= rho1) throw new Error('Die hinzugefügte Flüssigkeit muss weniger dicht sein als die am Boden: Sonst sinkt sie in die Krümmung des Rohrs und drückt die andere hoch');
      h1 = (rho2 * h2) / rho1;
      pasos.push({ t: 'Höhe auf der anderen Seite', html: `Über der Trennfläche steigt die Flüssigkeit vom Boden im anderen Schenkel auf $h_1 = {ρ_2 h_2}/{ρ_1} = {${f(rho2)} · ${f(h2)}}/{${f(rho1)}}$ = <b>${f(h1)} m</b>` });
    }
    const dh = h2 - h1;
    pasos.push({ t: 'Höhenunterschied zwischen den beiden Oberflächen', html: `$Δh = h_2 − h_1 = ${f(h2)} − ${f(h1)}$ = <b>${f(dh)} m</b> (${f(dh * 100)} cm), höher steht die weniger dichte Flüssigkeit.` });
    return { modo: 'tuboU', buscar: sc.buscar === 'densidad' ? 'densidad' : 'altura', rho1, rho2, h1, h2, dh, pasos };
  }

  function prensa(sc) {
    const d1 = lee(sc, 'd1', 'der Durchmesser des kleinen Kolbens'), d2 = lee(sc, 'd2', 'der Durchmesser des großen Kolbens'), g = gDe(sc);
    if (d2 <= d1) throw new Error('Der große Kolben muss einen größeren Durchmesser haben als der kleine');
    const A1 = circulo(d1), A2 = circulo(d2), k = A2 / A1;
    const pasos = [{ t: 'Flächen der Kolben', html: `${areaPaso(1, A1, d1)}<br>${areaPaso(2, A2, d2)}` }];
    let F1, F2, m = null;
    if (sc.datos === 'masa') {
      m = lee(sc, 'm', 'die Masse, die angehoben werden soll'); F2 = m * g; F1 = F2 / k;
      pasos.push({ t: 'Gewichtskraft der Last', html: `$F_2 = m g = ${f(m)} · ${f(g)}$ = ${f(F2)} N` });
      pasos.push({ t: 'Pascalsches Prinzip', html: `Der Druck überträgt sich gleichmäßig auf die ganze Flüssigkeit: $F_1/A_1 = F_2/A_2$, also $F_1 = {F_2 A_1}/{A_2} = F_2 (d_1/d_2)^2 = ${f(F2)} · (${f(d1)}/${f(d2)})^2$ = <b>${f(F1)} N</b>` });
    } else {
      F1 = lee(sc, 'F1', 'die Kraft auf den kleinen Kolben'); F2 = F1 * k;
      pasos.push({ t: 'Pascalsches Prinzip', html: `Der Druck überträgt sich gleichmäßig auf die ganze Flüssigkeit: $F_1/A_1 = F_2/A_2$, also $F_2 = {F_1 A_2}/{A_1} = F_1 (d_2/d_1)^2 = ${f(F1)} · (${f(d2)}/${f(d1)})^2$ = <b>${f(F2)} N</b>${g ? `, was der Gewichtskraft einer Masse von ${f(F2 / g)} kg entspricht` : ''}` });
    }
    const pr = F1 / A1;
    pasos.push({ t: 'Druck in der Flüssigkeit', html: `$p = F_1/A_1 = ${f(F1)}/${f(A1)}$ = <b>${f(pr)} Pa</b> (${f(pr / ATM)} atm über dem Atmosphärendruck). Die Kraft wird mit $A_2/A_1 = ${f(k)}$ vervielfacht.` });
    const x1 = lee(sc, 'x1', 'der Weg des kleinen Kolbens', { opcional: true });
    let x2 = null;
    if (x1) {
      x2 = x1 / k;
      pasos.push({ t: 'Wege', html: `Das Flüssigkeitsvolumen, das auf einer Seite austritt, tritt auf der anderen ein: $A_1 x_1 = A_2 x_2$, also $x_2 = {x_1 A_1}/{A_2} = ${f(x1)}/${f(k)}$ = <b>${f(x2)} cm</b><br>Was man an Kraft gewinnt, verliert man am Weg: Die Arbeit ist gleich, $F_1 x_1 = F_2 x_2 = ${f((F1 * x1) / 100)}$ J.` });
    }
    return { modo: 'prensa', datos: sc.datos === 'masa' ? 'masa' : 'fuerza', d1, d2, A1, A2, k, F1, F2, m, pr, x1, x2, g, pasos };
  }

  function empuje(sc) {
    const rhoF = lee(sc, 'rhoF', 'die Dichte des Fluids'), g = gDe(sc);
    const pasos = [];
    if (sc.datos === 'pesadas') {
      const P = lee(sc, 'P', 'das Gewicht in Luft'), Pa = lee(sc, 'Pa', 'das Gewicht im Fluid', { cero: true });
      if (Pa >= P) throw new Error('Im Fluid muss der Körper weniger wiegen als in Luft');
      const E = P - Pa, V = E / (rhoF * g), m = P / g, rhoC = m / V;
      pasos.push({ t: 'Auftrieb', html: `Was er beim Eintauchen an Gewicht verliert, ist der Auftrieb: $E = P − P_{ap} = ${f(P)} − ${f(Pa)}$ = <b>${f(E)} N</b>` });
      pasos.push({ t: 'Volumen des Körpers', html: `Bei vollständigem Eintauchen gilt $E = ρ_f V g$, also $V = E/(ρ_f g) = ${f(E)}/(${f(rhoF)} · ${f(g)})$ = <b>${f(V)} m³</b> (${f(V * 1e6)} cm³)` });
      pasos.push({ t: 'Dichte des Körpers', html: `$m = P/g = ${f(m)}$ kg und $ρ = m/V = {ρ_f P}/{E} = {${f(rhoF)} · ${f(P)}}/{${f(E)}}$ = <b>${f(rhoC)} kg/m³</b>` });
      const cerca = MATERIALES.reduce((a, b) => (Math.abs(Math.log(b[1] / rhoC)) < Math.abs(Math.log(a[1] / rhoC)) ? b : a));
      pasos.push({ t: 'Woraus kann er bestehen?', html: `Im Vergleich mit einigen Dichten (Gold 19 300, Blei 11 340, Silber 10 490, Kupfer 8960, Eisen 7870, Aluminium 2700 kg/m³) passt am besten ${cerca[0]}${Math.abs(rhoC / cerca[1] - 1) > 0.03 ? ', stimmt aber nicht überein: Es ist eine Legierung oder hat Hohlräume' : ''}.` });
      return { modo: 'empuje', datos: 'pesadas', rhoF, g, P, Pa, E, V, m, rhoC, flota: false, pasos };
    }
    const rhoC = lee(sc, 'rhoC', 'die Dichte des Körpers'), V = lee(sc, 'V', 'das Volumen des Körpers');
    const m = rhoC * V, P = m * g, Emax = rhoF * V * g;
    pasos.push({ t: 'Gewichtskraft', html: `$P = m g = ρ V g = ${f(rhoC)} · ${f(V)} · ${f(g)}$ = <b>${f(P)} N</b>` });
    pasos.push({ t: 'Auftrieb bei ganz eingetauchtem Körper', html: `$E = ρ_f V g = ${f(rhoF)} · ${f(V)} · ${f(g)}$ = <b>${f(Emax)} N</b>` });
    let flota, E, Vs = null, Pa = null, a = null;
    if (rhoC < rhoF) {
      flota = true; E = P; Vs = (rhoC * V) / rhoF;
      pasos.push({ t: 'Er schwimmt', html: `Da $E > P$ (der Körper ist weniger dicht als das Fluid), steigt er, bis der eingetauchte Teil einen Auftrieb gleich dem Gewicht liefert: $ρ_f V_s g = ρ V g$, $V_s = {ρ V}/{ρ_f} = {${f(rhoC)} · ${f(V)}}/{${f(rhoF)}}$ = <b>${f(Vs)} m³</b><br>Zu ${f((100 * rhoC) / rhoF)} % eingetaucht und zu ${f(100 - (100 * rhoC) / rhoF)} % draußen.` });
      pasos.push({ t: 'Um ihn ganz unterzutauchen', html: `Man muss ihn mit $F = E − P = ${f(Emax)} − ${f(P)}$ = ${f(Emax - P)} N nach unten drücken` });
    } else if (rhoC === rhoF) {
      flota = null; E = Emax; Pa = 0;
      pasos.push({ t: 'Er steigt nicht und sinkt nicht', html: 'Der Körper hat dieselbe Dichte wie das Fluid: $E = P$ an jeder Stelle, und er bleibt, wo man ihn loslässt (indifferentes Gleichgewicht).' });
    } else {
      flota = false; E = Emax; Pa = P - Emax; a = Pa / m;
      pasos.push({ t: 'Er sinkt', html: `Da $P > E$ ist, sinkt er auf den Grund. Sein scheinbares Gewicht ist $P_{ap} = P − E = ${f(P)} − ${f(Emax)}$ = <b>${f(Pa)} N</b>` });
      pasos.push({ t: 'Beschleunigung beim Loslassen', html: `Ohne Reibung im Fluid gilt $a = (P − E)/m = g (1 − ρ_f/ρ) = ${f(Pa)}/${f(m)}$ = <b>${f(a)} m/s²</b>` });
    }
    return { modo: 'empuje', datos: 'cuerpo', rhoC, V, rhoF, g, m, P, Emax, E, flota, Vs, Pa, a, pasos };
  }

  function bernoulli(sc) {
    const rho = lee(sc, 'rho', 'die Dichte des Fluids'), d1 = lee(sc, 'd1', 'der Durchmesser bei 1'), d2 = lee(sc, 'd2', 'der Durchmesser bei 2'), g = gDe(sc);
    const p1 = lee(sc, 'p1', 'der Druck bei 1', { signo: true });
    const h1 = lee(sc, 'h1', 'die Höhe von 1', { opcional: true, signo: true }) ?? 0, h2 = lee(sc, 'h2', 'die Höhe von 2', { opcional: true, signo: true }) ?? 0;
    const A1 = circulo(d1), A2 = circulo(d2);
    const pasos = [{ t: 'Querschnitte', html: `${areaPaso(1, A1, d1)}<br>${areaPaso(2, A2, d2)}` }];
    let v1, Q;
    if (sc.datos === 'Q') {
      const QL = lee(sc, 'Q', 'der Volumenstrom'); Q = QL / 1000; v1 = Q / A1;
      pasos.push({ t: 'Geschwindigkeit bei 1', html: `$Q = ${f(QL)}$ L/s = ${f(Q)} m³/s, y $v_1 = Q/A_1 = ${f(Q)}/${f(A1)}$ = <b>${f(v1)} m/s</b>` });
    } else {
      v1 = lee(sc, 'v1', 'die Geschwindigkeit bei 1'); Q = A1 * v1;
      pasos.push({ t: 'Volumenstrom', html: `$Q = A_1 v_1 = ${f(A1)} · ${f(v1)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s (${f(rho * Q)} kg/s)` });
    }
    const v2 = (v1 * A1) / A2;
    pasos.push({ t: 'Kontinuität', html: `Der Volumenstrom ist im ganzen Rohr gleich: $A_1 v_1 = A_2 v_2$, $v_2 = v_1 (d_1/d_2)^2 = ${f(v1)} · (${f(d1)}/${f(d2)})^2$ = <b>${f(v2)} m/s</b>` });
    const p2 = p1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * g * (h1 - h2);
    const alt = h1 || h2;
    pasos.push({ t: 'Bernoulli', html: `$p_1 + {1}/{2} ρ v_1^2 ${alt ? '+ ρ g h_1 ' : ''}= p_2 + {1}/{2} ρ v_2^2${alt ? ' + ρ g h_2' : ''}$, also<br>$p_2 = p_1 + {1}/{2} ρ (v_1^2 − v_2^2)${alt ? ' + ρ g (h_1 − h_2)' : ''} = ${f(p1)} + {1}/{2} · ${f(rho)} · (${f(v1)}^2 − ${f(v2)}^2)${alt ? `$ $+ ${f(rho)} · ${f(g)} · (${f(h1)} − ${p(h2)})` : ''}$ = <b>${f(p2)} Pa</b>${p2 < 0 ? '<br>Das Ergebnis ist negativ: War $p_1$ ein Überdruck, herrscht bei 2 weniger Druck als der atmosphärische; war es ein absoluter Druck, ist das nicht möglich, und die Flüssigkeit würde sieden (Kavitation).' : ''}` });
    pasos.push({ t: 'Druckdifferenz', html: `$Δp = p_1 − p_2 = ${f(p1 - p2)}$ Pa${alt ? '' : `. Wo sich das Rohr verengt, strömt das Fluid schneller und der Druck sinkt: Das ist der Venturi-Effekt. Mit zwei offenen senkrechten Rohren stiege die Flüssigkeit um ${f(Math.abs(p1 - p2) / (rho * g))} m höher, und zwar auf der Seite von ${p1 > p2 ? '1' : '2'}.`}` });
    return { modo: 'bernoulli', datos: sc.datos === 'Q' ? 'Q' : 'v1', rho, d1, d2, A1, A2, v1, v2, Q, p1, p2, h1, h2, g, pasos };
  }

  function torricelli(sc) {
    const H = lee(sc, 'H', 'die Höhe der Flüssigkeit über der Öffnung'), g = gDe(sc);
    const y = lee(sc, 'y', 'die Höhe der Öffnung', { opcional: true, cero: true });
    const d = lee(sc, 'd', 'der Durchmesser der Öffnung', { opcional: true }), D = lee(sc, 'D', 'der Durchmesser des Behälters', { opcional: true });
    if (D && !d) throw new Error('Für die Entleerungszeit braucht man auch den Durchmesser der Öffnung');
    if (D && d && D <= d / 100) throw new Error('Der Behälter muss breiter sein als die Öffnung');
    const v = Math.sqrt(2 * g * H);
    const pasos = [{ t: 'Austrittsgeschwindigkeit', html: `Bernoulli zwischen der Oberfläche (fast in Ruhe, bei Atmosphärendruck) und der Öffnung (ebenfalls an der Luft): $v = √(2 g H) = √(2 · ${f(g)} · ${f(H)})$ = <b>${f(v)} m/s</b>, dieselbe wie bei freiem Fall von der Oberfläche.` }];
    let x = null, tc = null, Q = null, A = null, tv = null;
    if (y) {
      tc = Math.sqrt((2 * y) / g); x = v * tc;
      pasos.push({ t: 'Reichweite des Strahls', html: `Er tritt waagerecht aus und fällt wie bei einem waagerechten Wurf: Er braucht $t = √(2 y/g) = √(2 · ${f(y)}/${f(g)})$ = ${f(tc)} s und erreicht $x = v t = 2 √(H y) = ${f(v)} · ${f(tc)}$ = <b>${f(x)} m</b><br>Bei gleicher Gesamthöhe, ${f(H + y)} m, wäre die Reichweite am größten mit der Öffnung auf halber Höhe: ${f(H + y)} m.` });
    } else if (y === 0) {
      x = 0;
    }
    if (d) {
      A = circulo(d); Q = A * v;
      pasos.push({ t: 'Austretender Volumenstrom', html: `${areaPaso('o', A, d)}, $Q = A_o v = ${f(A)} · ${f(v)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s` });
    }
    if (D) {
      const AD = (Math.PI * D * D) / 4;
      tv = (AD / A) * Math.sqrt((2 * H) / g);
      pasos.push({ t: 'Zeit bis zur Entleerung', html: `Mit sinkendem Pegel nimmt die Geschwindigkeit ab. Mit $A_D v_{nivel} = A_o √(2 g z)$ und Integration von H bis 0 gilt: $t = (A_D/A_o) √(2 H/g) = (D/d)^2 √(2 H/g) = ${f(AD / A)} · ${f(Math.sqrt((2 * H) / g))}$ = <b>${f(tv)} s</b> (${f(tv / 60)} min), das Doppelte dessen, was es dauern würde, wenn immer der anfängliche Volumenstrom austräte.` });
    }
    return { modo: 'torricelli', H, y, d, D, g, v, x, tc, A, Q, tv, pasos };
  }

  function viscosidad(sc) {
    const pasos = [], g = gDe(sc);
    if (sc.tipo === 'stokes') {
      const r = lee(sc, 'r', 'der Radius der Kugel') / 1000, rhoE = lee(sc, 'rhoE', 'die Dichte der Kugel'), rhoF = lee(sc, 'rhoF', 'die Dichte des Fluids');
      if (rhoE <= rhoF) throw new Error('Die Kugel muss dichter sein als das Fluid, um zu fallen');
      let eta, v;
      pasos.push({ t: 'Kräfte auf die Kugel', html: `Sie fällt mit ihrer Gewichtskraft $ρ_e V g$, der Auftrieb bremst sie mit $ρ_f V g$, und die zähe Stokessche Reibung, $F_v = 6 π η r v$, wächst mit der Geschwindigkeit. Sie erreicht die Endgeschwindigkeit, wenn sich alles ausgleicht: $6 π η r v = (ρ_e − ρ_f) {4}/{3} π r^3 g$.` });
      if (sc.datos === 'v') {
        v = lee(sc, 'v', 'die gemessene Endgeschwindigkeit'); eta = (2 * r * r * (rhoE - rhoF) * g) / (9 * v);
        pasos.push({ t: 'Viskosität (Kugelfallviskosimeter)', html: `$η = {2 r^2 (ρ_e − ρ_f) g}/{9 v} = {2 · (${f(r)})^2 · (${f(rhoE)} − ${f(rhoF)}) · ${f(g)}}/{9 · ${f(v)}}$ = <b>${f(eta)} Pa·s</b>` });
      } else {
        eta = lee(sc, 'eta', 'die Viskosität'); v = (2 * r * r * (rhoE - rhoF) * g) / (9 * eta);
        pasos.push({ t: 'Endgeschwindigkeit', html: `$v_{lím} = {2 r^2 (ρ_e − ρ_f) g}/{9 η} = {2 · (${f(r)})^2 · (${f(rhoE)} − ${f(rhoF)}) · ${f(g)}}/{9 · ${f(eta)}}$ = <b>${f(v)} m/s</b>` });
      }
      const Re = (rhoF * v * 2 * r) / eta, tau = (2 * rhoE * r * r) / (9 * eta);
      pasos.push({ t: 'Gilt das Stokessche Gesetz?', html: `Reynolds-Zahl $Re = ρ_f v (2r)/η = ${f(Re)}$: ${Re < 1 ? 'viel kleiner als 1, die Umströmung der Kugel ist laminar und das Gesetz gilt.' : 'nicht klein gegenüber 1, das Ergebnis ist also nur eine Näherung (es entsteht ein Nachlauf und die Kraft wächst schneller).'} Sie erreicht die Endgeschwindigkeit nahezu nach wenigen $τ = {2 ρ_e r^2}/{9 η} = ${f(tau)}$ s.` });
      return { modo: 'viscosidad', tipo: 'stokes', datos: sc.datos === 'v' ? 'v' : 'eta', r, rhoE, rhoF, eta, v, Re, tau, g, pasos };
    }
    const eta = lee(sc, 'eta', 'die Viskosität'), L = lee(sc, 'L', 'die Länge des Rohrs'), d = lee(sc, 'd', 'der Innendurchmesser') / 1000, r = d / 2;
    const Rh = (8 * eta * L) / (Math.PI * r ** 4);
    pasos.push({ t: 'Hagen-Poiseuille-Gesetz', html: `In einem Rohr mit dem Radius r und der Länge L hat ein zähes Fluid bei laminarer Strömung ein parabelförmiges Geschwindigkeitsprofil, und der Volumenstrom ist $Q = {π r^4 Δp}/{8 η L}$. Der Strömungswiderstand des Rohrs ist $R = {8 η L}/{π r^4} = {8 · ${f(eta)} · ${f(L)}}/{π · (${f(r)})^4}$ = ${f(Rh)} Pa·s/m³: Halbiert man den Radius, sinkt der Volumenstrom auf ein Sechzehntel.` });
    let Q, dp;
    if (sc.datos === 'Q') {
      Q = lee(sc, 'Q', 'der Volumenstrom') / 1e6; dp = Q * Rh;
      pasos.push({ t: 'Erforderliche Druckdifferenz', html: `$Δp = Q R = ${f(Q)} · ${f(Rh)}$ = <b>${f(dp)} Pa</b> (${f(dp / 133.32)} mmHg)` });
    } else {
      dp = lee(sc, 'dp', 'die Druckdifferenz'); Q = dp / Rh;
      pasos.push({ t: 'Volumenstrom', html: `$Q = Δp/R = ${f(dp)}/${f(Rh)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1e6)} mL/s` });
    }
    const A = Math.PI * r * r, vm = Q / A, vmax = 2 * vm, rho = lee(sc, 'rho', 'die Dichte des Fluids', { opcional: true }) ?? 1000, Re = (rho * vm * d) / eta;
    pasos.push({ t: 'Geschwindigkeiten', html: `Mittlere Geschwindigkeit $v̄ = Q/(π r^2) = ${f(vm)}$ m/s; in der Mitte ist sie doppelt so groß, $v_{max} = 2 v̄ = ${f(vmax)}$ m/s, und an der Wand 0.` });
    pasos.push({ t: 'Ist sie laminar?', html: `$Re = ρ v̄ d/η = {${f(rho)} · ${f(vm)} · ${f(d)}}/${'{'}${f(eta)}}$ = ${f(Re)}: ${Re < 2000 ? 'kleiner als etwa 2000, laminare Strömung, und das Hagen-Poiseuille-Gesetz gilt.' : Re < 4000 ? 'zwischen 2000 und 4000, Übergangsbereich: Das Hagen-Poiseuille-Gesetz ist nicht mehr verlässlich.' : 'größer als 4000, die Strömung ist turbulent, und das Hagen-Poiseuille-Gesetz gilt nicht.'}` });
    return { modo: 'viscosidad', tipo: 'poiseuille', datos: sc.datos === 'Q' ? 'Q' : 'dp', eta, L, d, r, Rh, Q, dp, vm, vmax, rho, Re, pasos };
  }

  function medidor(sc) {
    const rhoF = lee(sc, 'rhoF', 'die Dichte des Fluids'), dh = lee(sc, 'dh', 'der Höhenunterschied im Manometer') / 100, g = gDe(sc), pasos = [];
    const rhoM = lee(sc, 'rhoM', 'die Dichte der Manometerflüssigkeit', { opcional: true });
    if (rhoM !== null && rhoM <= rhoF) throw new Error('Die Manometerflüssigkeit muss dichter sein als das gemessene Fluid');
    const dp = rhoM === null ? rhoF * g * dh : (rhoM - rhoF) * g * dh;
    pasos.push({ t: 'Druckdifferenz', html: rhoM === null ? `Bei zwei offenen senkrechten Rohren steigt die Flüssigkeit so hoch, bis ihr Gewicht den Druck ausgleicht: $Δp = ρ g Δh = ${f(rhoF)} · ${f(g)} · ${f(dh)}$ = <b>${f(dp)} Pa</b>` : `Beim U-Rohr-Manometer ist der Druck in Höhe der tieferen Oberfläche in beiden Schenkeln gleich: $Δp = (ρ_m − ρ) g Δh = (${f(rhoM)} − ${f(rhoF)}) · ${f(g)} · ${f(dh)}$ = <b>${f(dp)} Pa</b>` });
    if (sc.tipo === 'venturi') {
      const d1 = lee(sc, 'd1', 'der Durchmesser des Rohrs'), d2 = lee(sc, 'd2', 'der Durchmesser der Verengung');
      if (d2 >= d1) throw new Error('Die Verengung muss enger sein als das Rohr');
      const A1 = circulo(d1), A2 = circulo(d2), k = (A1 / A2) ** 2 - 1, v1 = Math.sqrt((2 * dp) / (rhoF * k)), v2 = (v1 * A1) / A2, Q = A1 * v1;
      pasos.push({ t: 'Kontinuität und Bernoulli', html: `$v_2 = v_1 A_1/A_2$ und $p_1 − p_2 = {1}/{2} ρ (v_2^2 − v_1^2) = {1}/{2} ρ v_1^2 ((A_1/A_2)^2 − 1)$, mit $(A_1/A_2)^2 = (d_1/d_2)^4 = ${f(k + 1)}$` });
      pasos.push({ t: 'Geschwindigkeit und Volumenstrom', html: `$v_1 = √({2 Δp}/{ρ ((A_1/A_2)^2 − 1)}) = √({2 · ${f(dp)}}/{${f(rhoF)} · ${f(k)}})$ = <b>${f(v1)} m/s</b>, $v_2$ = ${f(v2)} m/s<br>$Q = A_1 v_1 = ${f(A1)} · ${f(v1)}$ = <b>${f(Q)} m³/s</b> = ${f(Q * 1000)} L/s` });
      return { modo: 'medidor', tipo: 'venturi', rhoF, rhoM, dh, dp, d1, d2, A1, A2, v1, v2, Q, g, pasos };
    }
    const v = Math.sqrt((2 * dp) / rhoF);
    pasos.unshift({ t: 'Wie es funktioniert', html: 'Das Rohr hat eine Öffnung frontal zur Strömung, wo das Fluid zum Stillstand kommt, und eine seitliche Bohrung, an der es mit seiner Geschwindigkeit vorbeiströmt. Bernoulli zwischen beiden, in gleicher Höhe: $p_{total} = p + {1}/{2} ρ v^2$, das verbindende Manometer misst also den dynamischen Druck ${1}/{2} ρ v^2$.' });
    pasos.push({ t: 'Geschwindigkeit des Fluids', html: `An der Öffnung des Pitot-Rohrs kommt das Fluid zum Stillstand (Staudruck), und an der seitlichen Bohrung strömt es mit seiner Geschwindigkeit vorbei: $Δp = {1}/{2} ρ v^2$, also $v = √({2 Δp}/{ρ}) = √({2 · ${f(dp)}}/{${f(rhoF)}})$ = <b>${f(v)} m/s</b> (${f(v * 3.6)} km/h). So messen Flugzeuge ihre Geschwindigkeit relativ zur Luft.` });
    return { modo: 'medidor', tipo: 'pitot', rhoF, rhoM, dh, dp, v, g, pasos };
  }

  function pared(sc) {
    const rho = lee(sc, 'rho', 'die Dichte der Flüssigkeit'), b = lee(sc, 'b', 'die Breite'), hc = lee(sc, 'hc', 'die benetzte Höhe'), g = gDe(sc);
    const h0 = lee(sc, 'h0', 'die Tiefe der Oberkante', { opcional: true, cero: true }) ?? 0;
    const hg = h0 + hc / 2, A = b * hc, F = rho * g * hg * A, yc = hg + (hc * hc) / (12 * hg), M = F * (h0 + hc - yc);
    const pasos = [{ t: 'Druck auf die Wand', html: `Der Druck der Flüssigkeit wächst mit der Tiefe, $p = ρ g y$, unten drückt sie also stärker als oben. ${h0 ? `Das Schütz reicht von $y = ${f(h0)}$ m bis $y = ${f(h0 + hc)}$ m.` : `Die Wand ist bis $H = ${f(hc)}$ m benetzt.`}` }];
    pasos.push({ t: 'Resultierende Kraft', html: `Sie ist der Druck im Flächenschwerpunkt mal die Fläche: $F = ρ g h_G A = ${f(rho)} · ${f(g)} · ${f(hg)} · (${f(b)} · ${f(hc)})$ = <b>${f(F)} N</b>${h0 ? '' : `, also $F = {1}/{2} ρ g b H^2$`}` });
    pasos.push({ t: 'Druckmittelpunkt', html: `Da sie weiter unten stärker drückt, greift die Kraft nicht im Schwerpunkt an, sondern tiefer: $y_P = h_G + {I_G}/{h_G A} = h_G + {h_c^2}/{12 h_G} = ${f(hg)} + {${f(hc)}^2}/{12 · ${f(hg)}}$ = <b>${f(yc)} m</b> Tiefe${h0 ? '' : ', bei zwei Dritteln der Höhe (H/3 vom Boden)'}.` });
    pasos.push({ t: 'Moment bezüglich der Unterkante', html: `$M = F (h_0 + h_c − y_P) = ${f(F)} · ${f(h0 + hc - yc)}$ = <b>${f(M)} N·m</b>: Das müssen die Staumauer oder die unteren Scharniere aushalten, damit sie nicht kippt.` });
    return { modo: 'pared', rho, b, hc, h0, hg, A, F, yc, M, g, pasos };
  }

  function capilar(sc) {
    const ga = lee(sc, 'gamma', 'die Oberflächenspannung'), r = lee(sc, 'r', 'der Radius des Rohrs') / 1000, rho = lee(sc, 'rho', 'die Dichte der Flüssigkeit'), g = gDe(sc);
    const th = lee(sc, 'theta', 'der Kontaktwinkel', { opcional: true, cero: true }) ?? 0;
    if (th > 180) throw new Error('Der Kontaktwinkel liegt zwischen 0° und 180°');
    const c = Math.abs(th - 90) < 1e-9 ? 0 : Math.cos((th * Math.PI) / 180), h = (2 * ga * c) / (rho * g * r), dp = (2 * ga * c) / r;
    const pasos = [{ t: 'Warum sie steigt (oder sinkt)', html: `Die Oberflächenspannung zieht am Rand des Meniskus entlang des gesamten Umfangs, $2πr$, mit einem Kontaktwinkel θ = ${f(th)}°: Die senkrechte Kraft ist $2 π r γ cos θ$. ${c > 0 ? 'Die Flüssigkeit benetzt das Glas und steigt' : c < 0 ? 'Die Flüssigkeit benetzt nicht (wie Quecksilber) und sinkt' : 'Bei θ = 90° steigt sie nicht und sinkt nicht'}.` }];
    pasos.push({ t: 'Jurinsches Gesetz', html: `Die Säule steigt, bis ihr Gewicht, $ρ π r^2 h g$, diese Kraft ausgleicht: $h = {2 γ cos θ}/{ρ g r} = {2 · ${f(ga)} · ${f(c)}}/{${f(rho)} · ${f(g)} · ${f(r)}}$ = <b>${f(h * 1000)} mm</b>${h < 0 ? ' (unter dem Außenpegel)' : ''}. Je dünner das Rohr, desto höher steigt sie: So steigt Wasser im Papier und Pflanzensaft in den Pflanzen.` });
    pasos.push({ t: 'Druck unter dem Meniskus', html: `Die gekrümmte Oberfläche bewirkt, dass der Druck unter dem Meniskus um $Δp = {2 γ cos θ}/{r} = ${f(dp)}$ Pa ${dp >= 0 ? 'niedriger' : 'höher'} als der atmosphärische ist (Laplace-Gesetz), genau das, was die Säule ausgleicht: $ρ g h = ${f(rho * g * h)}$ Pa.` });
    return { modo: 'capilar', ga, r, rho, th, c, h, dp, g, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'viscosidad') return viscosidad(sc);
    if (sc.modo === 'medidor') return medidor(sc);
    if (sc.modo === 'pared') return pared(sc);
    if (sc.modo === 'capilar') return capilar(sc);
    if (sc.modo === 'tuboU') return tuboU(sc);
    if (sc.modo === 'prensa') return prensa(sc);
    if (sc.modo === 'empuje') return empuje(sc);
    if (sc.modo === 'bernoulli') return bernoulli(sc);
    if (sc.modo === 'torricelli') return torricelli(sc);
    return presion(sc);
  }

  const ejemplos = [
    { clave: 'buceo', nombre: 'Druck auf einen Taucher in 20 m Tiefe', sc: { modo: 'presion', rho: '1025', h: '20', p0: '', A: '', g: '9,8' } },
    { clave: 'piscina', nombre: 'Kraft auf den Boden eines Schwimmbeckens', sc: { modo: 'presion', rho: '1000', h: '2', p0: '', A: '50', g: '9,8' } },
    { clave: 'barometro', nombre: 'Torricellis Quecksilberbarometer', sc: { modo: 'presion', rho: '13600', h: '0,76', p0: '0', A: '', g: '9,8' } },
    { clave: 'tubo-aceite', nombre: 'Öl und Wasser in einem U-Rohr', sc: { modo: 'tuboU', buscar: 'altura', rho1: '1000', rho2: '800', h2: '0,1' } },
    { clave: 'tubo-densidad', nombre: 'Dichte einer Flüssigkeit mit einem U-Rohr', sc: { modo: 'tuboU', buscar: 'densidad', rho1: '1000', h1: '0,068', h2: '0,08' } },
    { clave: 'elevador', nombre: 'Hydraulischer Wagenheber in einer Werkstatt', sc: { modo: 'prensa', datos: 'masa', m: '1500', d1: '4', d2: '40', x1: '20', g: '9,8' } },
    { clave: 'prensa', nombre: 'Hydraulische Presse', sc: { modo: 'prensa', datos: 'fuerza', F1: '200', d1: '2', d2: '30', x1: '', g: '9,8' } },
    { clave: 'madera', nombre: 'Holzblock im Wasser', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '600', V: '0,002', rhoF: '1000', g: '9,8' } },
    { clave: 'iceberg', nombre: 'Sichtbarer Teil eines Eisbergs', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '917', V: '1000', rhoF: '1025', g: '9,8' } },
    { clave: 'hierro', nombre: 'Eisenstück unter Wasser', sc: { modo: 'empuje', datos: 'cuerpo', rhoC: '7870', V: '1e-4', rhoF: '1000', g: '9,8' } },
    { clave: 'corona', nombre: 'Die Krone des Archimedes: Ist sie aus Gold?', sc: { modo: 'empuje', datos: 'pesadas', P: '10', Pa: '9,4', rhoF: '1000', g: '9,8' } },
    { clave: 'venturi', nombre: 'Venturi-Rohr', sc: { modo: 'bernoulli', datos: 'v1', rho: '1000', d1: '10', d2: '5', v1: '2', p1: '1,5e5', h1: '', h2: '', g: '9,8' } },
    { clave: 'casa', nombre: 'Wasser, das in den zweiten Stock steigt', sc: { modo: 'bernoulli', datos: 'Q', rho: '1000', d1: '4', d2: '2', Q: '1,5', p1: '4e5', h1: '0', h2: '6', g: '9,8' } },
    { clave: 'deposito', nombre: 'Strahl aus einem Behälter mit einem Loch', sc: { modo: 'torricelli', H: '2', y: '1', d: '2', D: '1', g: '9,8' } },
    { clave: 'sangre', nombre: 'Blut in einer Arterie (Poiseuille)', sc: { modo: 'viscosidad', tipo: 'poiseuille', datos: 'dp', eta: '4e-3', L: '0,1', d: '4', dp: '400', Q: '', rho: '1060' } },
    { clave: 'jeringa', nombre: 'Druck, um Wasser durch eine Nadel zu pressen', sc: { modo: 'viscosidad', tipo: 'poiseuille', datos: 'Q', eta: '1e-3', L: '0,04', d: '0,5', dp: '', Q: '0,5', rho: '1000' } },
    { clave: 'glicerina', nombre: 'Stahlkugel fällt in Glycerin (Stokes)', sc: { modo: 'viscosidad', tipo: 'stokes', datos: 'eta', r: '1', rhoE: '7800', rhoF: '1260', eta: '1,5', v: '', g: '9,8' } },
    { clave: 'viscosimetro', nombre: 'Viskosität eines Öls mit einer fallenden Kugel', sc: { modo: 'viscosidad', tipo: 'stokes', datos: 'v', r: '1,5', rhoE: '7800', rhoF: '900', eta: '', v: '0,12', g: '9,8' } },
    { clave: 'pitot', nombre: 'Geschwindigkeit eines Flugzeugs mit einem Pitot-Rohr', sc: { modo: 'medidor', tipo: 'pitot', rhoF: '1,2', rhoM: '1000', dh: '25', d1: '', d2: '', g: '9,8' } },
    { clave: 'venturimetro', nombre: 'Volumenstrom mit einem Venturi-Messer und Quecksilber', sc: { modo: 'medidor', tipo: 'venturi', rhoF: '1000', rhoM: '13600', dh: '4', d1: '10', d2: '5', g: '9,8' } },
    { clave: 'presa', nombre: 'Kraft des Wassers auf eine Staumauer', sc: { modo: 'pared', rho: '1000', b: '50', hc: '20', h0: '', g: '9,8' } },
    { clave: 'compuerta', nombre: 'Eingetauchtes Schütz in einem Behälter', sc: { modo: 'pared', rho: '1000', b: '1,5', hc: '2', h0: '3', g: '9,8' } },
    { clave: 'capilar', nombre: 'Wasser, das in einer Kapillare steigt', sc: { modo: 'capilar', gamma: '0,073', r: '0,5', rho: '1000', theta: '0', g: '9,8' } },
    { clave: 'mercurio', nombre: 'Quecksilber, das in einer Kapillare sinkt', sc: { modo: 'capilar', gamma: '0,49', r: '1', rho: '13600', theta: '140', g: '9,8' } },
  ];

  return { resolver, presion, tuboU, prensa, empuje, bernoulli, torricelli, viscosidad, medidor, pared, capilar, ejemplos, f, ATM };
})();

