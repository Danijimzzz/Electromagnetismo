const Solido = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-10) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const RAD = Math.PI / 180;
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false, max = Infinity, libre = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Es fehlt ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} muss eine Zahl sein`);
    if (!libre && (cero ? v < 0 : v <= 0)) throw new Error(`${may(nom)} muss ${cero ? 'positiv oder null' : 'größer als 0'} sein`);
    if (v > max) throw new Error(`${may(nom)} darf ${f(max)} nicht überschreiten`);
    return v;
  }

  const CUERPOS = {
    'esfera': { nombre: 'Vollkugel', k: 2 / 5, kTxt: '2/5', formula: '2/5 M R^2', med: 'R', medNom: 'Radius R', rueda: true, eje: 'ein Durchmesser' },
    'esfera-hueca': { nombre: 'Hohlkugel (Schale)', k: 2 / 3, kTxt: '2/3', formula: '2/3 M R^2', med: 'R', medNom: 'Radius R', rueda: true, eje: 'ein Durchmesser' },
    'cilindro': { nombre: 'Vollzylinder oder Scheibe', k: 1 / 2, kTxt: '1/2', formula: '1/2 M R^2', med: 'R', medNom: 'Radius R', rueda: true, eje: 'seine Achse' },
    'aro': { nombre: 'Reifen oder dünner Hohlzylinder', k: 1, kTxt: '1', formula: 'M R^2', med: 'R', medNom: 'Radius R', rueda: true, eje: 'seine Achse' },
    'varilla': { nombre: 'Dünner Stab', k: 1 / 12, kTxt: '1/12', formula: '1/12 M L^2', med: 'L', medNom: 'Länge L', rueda: false, eje: 'senkrecht durch die Mitte' },
    'placa': { nombre: 'Rechteckige Platte (a × b)', placa: true, formula: '1/12 M(a^2 + b^2)', med: 'a', medNom: 'Seite a', rueda: false, eje: 'senkrecht durch die Mitte' },
    'disco-diametro': { nombre: 'Scheibe (Achse durch einen Durchmesser)', k: 1 / 4, kTxt: '1/4', formula: '1/4 M R^2', med: 'R', medNom: 'Radius R', rueda: false, eje: 'ein Durchmesser' },
  };
  const kPor = (C) => (C.kTxt === '1' ? '' : `${C.kTxt} · `);
  function Icm(C, M, L, b) {
    if (C.placa) return { I: (M * (L * L + b * b)) / 12, html: `$I_cm = 1/12 M(a^2 + b^2) = 1/12 · ${f(M)} · (${f(L)}^2 + ${f(b)}^2)$` };
    return { I: C.k * M * L * L, html: `$I_cm = ${C.formula} = ${kPor(C)}${f(M)} · ${f(L)}^2$` };
  }
  const kgm2 = (x) => `<b>${f(x)} kg·m²</b>`;

  function inercia(sc) {
    const C = CUERPOS[sc.cuerpo] || CUERPOS.esfera;
    const M = lee(sc, 'M', 'die Masse'), L = lee(sc, 'L', C.medNom.toLowerCase()), d = lee(sc, 'd', 'der Abstand der Achse zum Schwerpunkt', { opcional: true, cero: true }) ?? 0;
    const b = C.placa ? lee(sc, 'b', 'die Seite b') : null, ic = Icm(C, M, L, b);
    const pasos = [{ t: `Trägheitsmoment bezüglich einer Achse durch den Schwerpunkt (${C.eje})`, html: `${ic.html} = ${kgm2(ic.I)}` }];
    const I = ic.I + M * d * d;
    if (d) pasos.push({ t: 'Satz von Steiner (parallele Achsen)', html: `$I = I_S + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$ = ${kgm2(I)}${sc.cuerpo === 'varilla' && Math.abs(d - L / 2) < 1e-12 ? ' (um ein Ende: $1/3 M L^2$)' : ''}` });
    pasos.push({ t: 'Trägheitsradius', html: `$k = √(I/M) = √(${f(I)}/${f(M)})$ = <b>${f(Math.sqrt(I / M))} m</b>: Das ist der Abstand, in dem man die gesamte Masse konzentrieren müsste, um dasselbe I zu erhalten.` });
    return { modo: 'inercia', C, M, L, b, d, Icm: ic.I, I, pasos };
  }

  function compuesto(sc) {
    const lineas = String(sc.piezas || '').split(/\n|;/).map((x) => x.trim()).filter(Boolean);
    if (!lineas.length) throw new Error('Schreibe mindestens ein Teil: „Typ Masse Maß Abstand“');
    const piezas = lineas.map((l, i) => {
      const [tipo, ...nums] = l.split(/\s+/), v = nums.map(leeNum), quien = `Teil ${i + 1}`;
      if (v.some((x) => !isFinite(x))) throw new Error(`${quien}: Die Angaben müssen Zahlen sein`);
      if (tipo === 'punto') {
        if (v.length < 2) throw new Error(`${quien}: Eine Punktmasse braucht „punto Masse Abstand“`);
        const [M, d] = v; if (M <= 0 || d < 0) throw new Error(`${quien}: Die Masse muss positiv und der Abstand darf nicht negativ sein`);
        return { nombre: 'Punktmasse', M, d, Icm: 0, html: `$I = M d^2 = ${f(M)} · ${f(d)}^2$`, I: M * d * d };
      }
      const C = CUERPOS[tipo];
      if (!C) throw new Error(`${quien}: „${tipo}“ ist kein Körper (verwende ${Object.keys(CUERPOS).join(', ')} oder punto)`);
      if (v.length < (C.placa ? 4 : 3)) throw new Error(`${quien}: braucht „${tipo} Masse Maß Abstand${C.placa ? ' b' : ''}“`);
      const [M, L, d, b] = v; if (M <= 0 || L <= 0 || d < 0 || (C.placa && !(b > 0))) throw new Error(`${quien}: Masse und Maße positiv, Abstand nicht negativ`);
      const ic = Icm(C, M, L, b);
      return { nombre: C.nombre, M, d, Icm: ic.I, I: ic.I + M * d * d, html: `${ic.html} = ${f(ic.I)} ⇒ $I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$` };
    });
    const I = piezas.reduce((s, p) => s + p.I, 0), M = piezas.reduce((s, p) => s + p.M, 0);
    const pasos = piezas.map((p, i) => ({ t: `${i + 1}. ${p.nombre} (${f(p.M)} kg in ${f(p.d)} m Abstand von der Achse)`, html: `${p.html} = ${kgm2(p.I)}` }));
    pasos.push({ t: 'Summe: Das Trägheitsmoment ist additiv', html: `$I = ${piezas.map((p) => f(p.I)).join(' + ')}$ = ${kgm2(I)}, mit der Gesamtmasse ${f(M)} kg und dem Trägheitsradius $k = √(I/M)$ = ${f(Math.sqrt(I / M))} m.` });
    return { modo: 'compuesto', piezas, I, M, pasos };
  }

  function rodadura(sc) {
    const C = CUERPOS[sc.cuerpo];
    if (!C || !C.rueda) throw new Error('Zum Rollen wähle eine Kugel, einen Zylinder oder einen Reifen');
    const g = lee(sc, 'g', 'die Erdbeschleunigung'), M = lee(sc, 'M', 'die Masse'), R = lee(sc, 'L', 'der Radius'), th = lee(sc, 'theta', 'der Winkel der Ebene', { max: 89.9 }), d = lee(sc, 'd', 'die zurückgelegte Strecke');
    const mu = lee(sc, 'mu', 'der Haftreibungskoeffizient', { opcional: true, cero: true });
    const t = th * RAD, k = C.k, a = (g * Math.sin(t)) / (1 + k), Fr = k * M * a, h = d * Math.sin(t), v = Math.sqrt(2 * a * d), tt = Math.sqrt((2 * d) / a);
    const muMin = (Math.tan(t) * k) / (1 + k), N = M * g * Math.cos(t);
    const Krot = 0.5 * k * M * v * v, Ktras = 0.5 * M * v * v;
    const pasos = [
      { t: 'Trägheitsmoment', html: `${C.nombre}: $I = ${C.formula}$ = ${kgm2(k * M * R * R)}, also $I/(M R^2) = ${C.kTxt}$` },
      { t: 'Bewegungsgleichungen (Rad ohne Gleiten: a = αR)', html: `Translation: $M g sin θ − F_r = M a$<br>Rotation um den Mittelpunkt: $F_r R = I α = I a/R ⇒ F_r = I a/R^2$<br>Addiert: $M g sin θ = (M + I/R^2) a ⇒ a = {g sin θ}/(1 + I/(M R^2)) = {${f(g)} · sin ${f(th)}°}/(1 + ${C.kTxt})$ = <b>${f(a)} m/s²</b>` },
      { t: 'Nötige Reibung', html: `$F_r = I a/R^2 = ${kPor(C)}${f(M)} · ${f(a)}$ = <b>${f(Fr)} N</b> (Haftreibung: verrichtet keine Arbeit, der Berührpunkt bewegt sich nicht)<br>Damit er ohne Gleiten rollt, braucht man $μ_e ≥ F_r/N = tan θ · {I/(M R^2)}/{1 + I/(M R^2)}$ = <b>${f(muMin)}</b>${mu !== null ? `; mit $μ_e = ${f(mu)}$ ${mu >= muMin ? '<b>rollt er ohne Gleiten</b>' : '<b>reicht nicht: Er gleitet und dreht sich zugleich</b> (das Obige gälte, wenn er rollte; unten steht, was wirklich passiert)'}` : ''}` },
      { t: `Über die Energie, nach ${f(d)} m Weg (sinkt um h = d sin θ = ${f(h)} m)`, html: `$M g h = 1/2 M v^2 + 1/2 I ω^2 = 1/2 (M + I/R^2) v^2 ⇒ v = √({2 g h}/{1 + I/(M R^2)})$ = <b>${f(v)} m/s</b>, $ω = v/R$ = ${f(v / R)} rad/s<br>$t = √(2d/a)$ = <b>${f(tt)} s</b>` },
      { t: 'Aufteilung der kinetischen Energie', html: `Translation $1/2 M v^2$ = ${f(Ktras)} J; Rotation $1/2 I ω^2$ = ${f(Krot)} J (${f((100 * k) / (1 + k), 3)} % des Gesamten). Je größer $I/(M R^2)$ ist, desto mehr Energie geht in die Drehung und desto langsamer rollt er hinunter: Die Vollkugel schlägt Hohlkugel, Zylinder und Reifen, egal wie groß Masse und Radius sind.` },
    ];
    let desliza = null;
    if (mu !== null && mu < muMin) {
      const a2 = g * (Math.sin(t) - mu * Math.cos(t)), I = k * M * R * R, al2 = (mu * N * R) / I, t2 = Math.sqrt((2 * d) / a2), v2 = a2 * t2, w2 = al2 * t2;
      const Q = M * g * h - 0.5 * M * v2 * v2 - 0.5 * I * w2 * w2;
      desliza = { a: a2, al: al2, t: t2, v: v2, w: w2, Q };
      pasos.push({ t: 'Da die Reibung nicht ausreicht, gleitet er, während er sich dreht', html: `Gleitreibung (wir nehmen $μ_d = μ_e$): $F_r = μ N = ${f(mu)} · ${f(N)}$ = ${f(mu * N)} N<br>Translation: $a = g(sin θ − μ cos θ)$ = <b>${f(a2)} m/s²</b>; Rotation: $α = F_r R/I$ = <b>${f(al2)} rad/s²</b>, und $α R = ${f(al2 * R)} "m/s²" < a$<br>Am Ende der Ebene: t = ${f(t2)} s, v = <b>${f(v2)} m/s</b>, ω = ${f(w2)} rad/s (weniger als v/R = ${f(v2 / R)} rad/s); durch die Reibung gehen ${f(Q)} J als Wärme verloren.` });
    }
    const carrera = Object.entries(CUERPOS).filter(([, c]) => c.rueda).map(([kk, c]) => ({ k: kk, nombre: c.nombre, a: (g * Math.sin(t)) / (1 + c.k), v: Math.sqrt((2 * g * h) / (1 + c.k)), t: Math.sqrt((2 * d * (1 + c.k)) / (g * Math.sin(t))) }));
    const A = desliza ? desliza.a : a, Al = desliza ? desliza.al : a / R, T = desliza ? desliza.t : tt;
    const mov = (x) => { const u = Math.min(Math.max(x, 0), T); return { s: 0.5 * A * u * u, phi: 0.5 * Al * u * u, v: A * u }; };
    return { modo: 'rodadura', C, g, M, R, th, d, mu, a, Fr, N, v, w: v / R, t: tt, h, muMin, rueda: mu === null || mu >= muMin, desliza, Krot, Ktras, carrera, pasos, mov, T };
  }

  function polea(sc) {
    const C = CUERPOS[sc.cuerpo] && CUERPOS[sc.cuerpo].rueda ? CUERPOS[sc.cuerpo] : CUERPOS.cilindro;
    const g = lee(sc, 'g', 'die Erdbeschleunigung'), M = lee(sc, 'M', 'die Masse der Rolle'), R = lee(sc, 'L', 'der Radius der Rolle'), m = lee(sc, 'm', 'die hängende Masse'), d = lee(sc, 'd', 'die Absinkhöhe');
    const I = C.k * M * R * R, a = (m * g) / (m + I / (R * R)), T = m * (g - a), al = a / R, v = Math.sqrt(2 * a * d), tt = Math.sqrt((2 * d) / a);
    const pasos = [
      { t: 'Trägheitsmoment der Rolle', html: `${C.nombre}: $I = ${C.formula} = ${kPor(C)}${f(M)} · ${f(R)}^2$ = ${kgm2(I)}` },
      { t: 'Gleichungen (das Seil rutscht nicht: a = αR)', html: `Hängender Körper: $m g − T = m a$<br>Rolle: $T R = I α = I a/R ⇒ T = I a/R^2$<br>Addiert: $m g = (m + I/R^2) a ⇒ a = {${f(m)} · ${f(g)}}/{${f(m)} + ${f(I / (R * R))}}$ = <b>${f(a)} m/s²</b>` },
      { t: 'Seilkraft und Winkelbeschleunigung', html: `$T = m(g − a) = ${f(m)} · (${f(g)} − ${f(a)})$ = <b>${f(T)} N</b> (kleiner als die Gewichtskraft, ${f(m * g)} N)<br>$α = a/R$ = <b>${f(al)} rad/s²</b>` },
      { t: `Nach ${f(d)} m Absinken`, html: `$v = √(2 a d)$ = <b>${f(v)} m/s</b>, $ω = v/R$ = ${f(v / R)} rad/s, $t = √(2d/a)$ = ${f(tt)} s<br>Energie: $m g h$ = ${f(m * g * d)} J = $1/2 m v^2 + 1/2 I ω^2$ = ${f(0.5 * m * v * v)} + ${f(0.5 * I * (v / R) ** 2)} J` },
    ];
    const mov = (x) => { const u = Math.min(Math.max(x, 0), tt); return { y: 0.5 * a * u * u, phi: (0.5 * a * u * u) / R, v: a * u }; };
    return { modo: 'polea', C, g, M, R, m, d, I, a, T, al, v, w: v / R, t: tt, pasos, mov, T_: tt };
  }

  const aRad = (w, rpm) => (rpm ? (w * 2 * Math.PI) / 60 : w), deRad = (W, rpm) => (rpm ? (W * 60) / (2 * Math.PI) : W);
  function momento(sc) {
    const I1 = lee(sc, 'I1', 'das anfängliche Trägheitsmoment'), I2 = lee(sc, 'I2', 'das endgültige Trägheitsmoment'), w1 = lee(sc, 'w1', 'die Anfangswinkelgeschwindigkeit');
    const rpm = sc.unidad !== 'rad', W1 = aRad(w1, rpm), W2 = (I1 * W1) / I2, w2 = deRad(W2, rpm);
    const L = I1 * W1, K1 = 0.5 * I1 * W1 * W1, K2 = 0.5 * I2 * W2 * W2, un = rpm ? 'rpm' : 'rad/s';
    const pasos = [
      { t: 'Ohne äußeres Drehmoment bleibt L erhalten', html: `$I_1 ω_1 = I_2 ω_2 ⇒ ω_2 = ω_1 · I_1/I_2 = ${f(w1)} · ${f(I1)}/${f(I2)}$ = <b>${f(w2)} ${un}</b>${rpm ? ` (= ${f(W2)} rad/s)` : ''}` },
      { t: 'Drehimpuls', html: `$L = I_1 ω_1 = ${f(I1)} · ${f(W1)}$ = <b>${f(L)} kg·m²/s</b>${rpm ? ` (mit ω₁ = ${f(w1)} U/min = ${f(W1)} rad/s)` : ''}` },
      { t: 'Die kinetische Rotationsenergie bleibt nicht erhalten', html: `$K_1 = 1/2 I_1 ω_1^2$ = ${f(K1)} J, $K_2 = 1/2 I_2 ω_2^2$ = ${f(K2)} J ⇒ ΔK = <b>${f(K2 - K1)} J</b> ($K_2/K_1 = I_1/I_2$ = ${f(I1 / I2)}). ${K2 > K1 ? 'Beim Zusammenziehen gewinnt sie Energie: Sie stammt aus der Arbeit der Muskeln oder dessen, der nach innen zieht.' : K2 < K1 ? 'Es geht Energie verloren, wie bei einem inelastischen Rotationsstoß.' : ''}` },
    ];
    return { modo: 'momento', I1, I2, w1, w2, W1, W2, L, K1, K2, rpm, pasos };
  }

  function choque(sc) {
    const m = lee(sc, 'm', sc.tipo === 'plataforma' ? 'die Masse der Person' : 'die Masse der Kugel'), M = lee(sc, 'M', sc.tipo === 'plataforma' ? 'die Masse der Plattform' : 'die Masse des Stabs');
    const L = lee(sc, 'L', sc.tipo === 'plataforma' ? 'der Radius der Plattform' : 'die Länge des Stabs'), r = lee(sc, 'r', 'der Abstand zur Achse', { cero: true });
    const pasos = [];
    if (sc.tipo === 'plataforma') {
      if (r > L) throw new Error('Die Person muss innerhalb der Plattform landen (r ≤ R)');
      const w1 = lee(sc, 'w1', 'die Winkelgeschwindigkeit der Plattform', { cero: true }), v = lee(sc, 'v', 'die Geschwindigkeit der Person', { libre: true, opcional: true }) ?? 0;
      const Ip = 0.5 * M * L * L, W1 = aRad(w1, true), L1 = Ip * W1 + m * v * r, I2 = Ip + m * r * r, W2 = L1 / I2;
      const K1 = 0.5 * Ip * W1 * W1 + 0.5 * m * v * v, K2 = 0.5 * I2 * W2 * W2;
      pasos.push({ t: 'Drehimpuls vorher', html: `Plattform (Scheibe): $I_p = 1/2 M R^2 = 1/2 · ${f(M)} · ${f(L)}^2$ = ${f(Ip)} kg·m², $ω_1$ = ${f(w1)} U/min = ${f(W1)} rad/s<br>Person: $m v r = ${f(m)} · ${f(v)} · ${f(r)}$ = ${f(m * v * r)} kg·m²/s ${v ? '(tangential zum Rand, bei positivem Wert in Drehrichtung)' : '(landet ohne Tangentialgeschwindigkeit)'}<br>$L = I_p ω_1 + m v r$ = <b>${f(L1)} kg·m²/s</b>` });
      pasos.push({ t: 'Danach drehen sie sich gemeinsam', html: `$I_2 = I_p + m r^2 = ${f(Ip)} + ${f(m)} · ${f(r)}^2$ = ${f(I2)} kg·m² ⇒ $ω_2 = L/I_2$ = <b>${f(W2)} rad/s = ${f(deRad(W2, true))} U/min</b>` });
      pasos.push({ t: 'Energie', html: `$K_1$ = ${f(K1)} J → $K_2 = 1/2 I_2 ω_2^2$ = ${f(K2)} J: Es gehen <b>${f(K1 - K2)} J</b> verloren, wie bei jedem vollkommen inelastischen Stoß.` });
      return { modo: 'choque', tipo: 'plataforma', M, L, m, r, v, Ip, I2, W1, W2, w2: deRad(W2, true), L1, K1, K2, pasos };
    }
    if (r > L) throw new Error('Die Kugel muss den Stab treffen (r ≤ L)');
    const g = lee(sc, 'g', 'die Erdbeschleunigung'), v = lee(sc, 'v', 'die Geschwindigkeit der Kugel');
    const Iv = (M * L * L) / 3, I = Iv + m * r * r, W = (m * v * r) / I, K0 = 0.5 * m * v * v, K1 = 0.5 * I * W * W;
    const dcm = (M * L / 2 + m * r) / (M + m), c = 1 - K1 / ((M + m) * g * dcm), vuelta = c < -1;
    const sube = vuelta ? null : Math.acos(c) / RAD;
    pasos.push({ t: 'Drehimpuls bezüglich des Drehpunkts', html: `Unmittelbar vorher bewegt sich nur die Kugel: $L = m v r = ${f(m)} · ${f(v)} · ${f(r)}$ = <b>${f(m * v * r)} kg·m²/s</b>. Beim Stoß übt der Drehpunkt eine Kraft aus, aber kein Drehmoment um sich selbst: L bleibt erhalten (der Impuls nicht).` });
    pasos.push({ t: 'Winkelgeschwindigkeit nach dem Stoß', html: `$I = 1/3 M L^2 + m r^2 = ${f(Iv)} + ${f(m)} · ${f(r)}^2$ = ${f(I)} kg·m² ⇒ $ω = {m v r}/I$ = <b>${f(W)} rad/s</b>` });
    pasos.push({ t: 'Beim Stoß verlorene Energie', html: `$K_0 = 1/2 m v^2$ = ${f(K0)} J → $K = 1/2 I ω^2$ = ${f(K1)} J: Es gehen <b>${f(100 * (1 - K1 / K0), 3)} %</b> verloren.` });
    pasos.push({ t: 'Wie hoch er steigt', html: `Der Schwerpunkt liegt $d = {M L/2 + m r}/{M + m}$ = ${f(dcm)} m vom Drehpunkt entfernt. Nach dem Stoß bleibt die Energie erhalten: $(M + m) g d (1 − cos θ) = 1/2 I ω^2 ⇒ cos θ = ${f(c)}$ ⇒ ${vuelta ? '<b>er überschlägt sich vollständig</b> (es bleibt genug Energie, um oben vorbeizukommen)' : `<b>θ = ${f(sube)}°</b>`}` });
    return { modo: 'choque', tipo: 'bala', M, L, m, r, v, g, I, W, K0, K1, dcm, sube, vuelta, pasos };
  }

  function pendulo(sc) {
    const C = CUERPOS[sc.cuerpo] || CUERPOS.varilla;
    const g = lee(sc, 'g', 'die Erdbeschleunigung'), M = lee(sc, 'M', 'die Masse'), L = lee(sc, 'L', C.medNom.toLowerCase()), d = lee(sc, 'd', 'der Abstand vom Drehpunkt zum Schwerpunkt');
    const b = C.placa ? lee(sc, 'b', 'die Seite b') : null, ic = Icm(C, M, L, b), I = ic.I + M * d * d, K = (M * g * d) / I;
    const pasos = [{ t: 'Trägheitsmoment bezüglich des Drehpunkts', html: `${ic.html} = ${f(ic.I)} ⇒ $I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$ = ${kgm2(I)}` }];
    const simula = (th0, signo, tmax, hasta) => {
      const P = [{ t: 0, th: th0, w: 0 }], dt = Math.min(0.002, tmax / 4000);
      let s = P[0];
      for (let n = 0; n * dt < tmax; n++) {
        const fz = (th) => signo * K * Math.sin(th);
        const k1 = [s.w, fz(s.th)], k2 = [s.w + (dt / 2) * k1[1], fz(s.th + (dt / 2) * k1[0])], k3 = [s.w + (dt / 2) * k2[1], fz(s.th + (dt / 2) * k2[0])], k4 = [s.w + dt * k3[1], fz(s.th + dt * k3[0])];
        s = { t: s.t + dt, th: s.th + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), w: s.w + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) };
        P.push(s);
        if (hasta !== undefined && s.th >= hasta) break;
      }
      return P;
    };
    const enT = (P) => (x) => { const T = P[P.length - 1].t, u = Math.min(Math.max(x, 0), T), dt = P[1].t; const i = Math.min(P.length - 2, Math.floor(u / dt)); const a = P[i], z = P[i + 1], q = (u - a.t) / dt; return { th: a.th + (z.th - a.th) * q, w: a.w + (z.w - a.w) * q }; };
    if (sc.tipo === 'cae') {
      const th0 = lee(sc, 'th0', 'der Anfangswinkel', { cero: true, max: 179 }), th = lee(sc, 'th', 'der Endwinkel', { max: 180 });
      if (th <= th0) throw new Error('Der Endwinkel muss größer als der Anfangswinkel sein');
      const w = Math.sqrt(2 * K * (Math.cos(th0 * RAD) - Math.cos(th * RAD))), al = K * Math.sin(th * RAD), punta = sc.cuerpo === 'varilla' ? d + L / 2 : d;
      pasos.push({ t: 'Energie: fällt von oben', html: `Der Schwerpunkt sinkt um $d(cos θ_0 − cos θ)$ (Winkel von der Senkrechten oberhalb des Drehpunkts): $M g d (cos θ_0 − cos θ) = 1/2 I ω^2 ⇒ ω = √({2 M g d (cos θ_0 − cos θ)}/I)$ = <b>${f(w)} rad/s</b>` });
      pasos.push({ t: 'Winkelbeschleunigung in diesem Augenblick', html: `$τ = M g d sin θ = I α ⇒ α = {M g d sin θ}/I$ = <b>${f(al)} rad/s²</b>. ${sc.cuerpo === 'varilla' ? `Das freie Ende (in ${f(punta)} m) hat $a_t = α r$ = <b>${f(al * punta)} m/s²</b>${al * punta > g * Math.sin(th * RAD) ? `, mehr als die Komponente von g in dieser Richtung (${f(g * Math.sin(th * RAD))} m/s²): Eine Münze an der Spitze bliebe zurück` : ''}.` : ''}` });
      const P = simula(Math.max(th0, 0.5) * RAD, 1, 30, th * RAD);
      return { modo: 'pendulo', tipo: 'cae', C, M, L, b, d, I, w, al, punta, th0, th, pasos, mov: enT(P), T: P[P.length - 1].t };
    }
    const th0 = lee(sc, 'th0', 'die Amplitude', { opcional: true, max: 179 }) ?? 10;
    const T = 2 * Math.PI * Math.sqrt(I / (M * g * d)), Leq = I / (M * d), wmax = Math.sqrt(2 * K * (1 - Math.cos(th0 * RAD)));
    pasos.push({ t: 'Periode der kleinen Schwingungen', html: `$τ = −M g d sin θ ≈ −M g d θ = I α ⇒ ω_0 = √({M g d}/I)$ = ${f(Math.sqrt(K))} rad/s ⇒ $T = 2π √(I/(M g d))$ = <b>${f(T)} s</b>` });
    pasos.push({ t: 'Äquivalente Länge', html: `Er schwingt wie ein mathematisches Pendel der Länge $L_{eq} = I/(M d)$ = <b>${f(Leq)} m</b>. Hängt man ihn in $L_{eq}$ Abstand vom Drehpunkt auf der anderen Seite des Schwerpunkts auf, ist die Periode dieselbe (Schwingungsmittelpunkt).` });
    pasos.push({ t: `Losgelassen aus ${f(th0)}°`, html: `Beim Durchgang unten: $1/2 I ω^2 = M g d (1 − cos θ_0) ⇒ ω_{max}$ = <b>${f(wmax)} rad/s</b>${th0 > 20 ? '. Bei dieser Amplitude ist die tatsächliche Periode etwas größer als bei kleinen Schwingungen (in der Animation zu sehen).' : '.'}` });
    const P = simula(th0 * RAD, -1, 2 * T);
    return { modo: 'pendulo', tipo: 'oscila', C, M, L, b, d, I, periodo: T, Leq, wmax, th0, pasos, mov: enT(P), T: 2 * T };
  }

  function equilibrio(sc) {
    const g = lee(sc, 'g', 'die Erdbeschleunigung'), M = lee(sc, 'M', 'die Masse', { cero: true }), L = lee(sc, 'L', 'die Länge');
    const pasos = [];
    if (sc.tipo === 'viga') {
      const xA = lee(sc, 'xA', 'die Position des Auflagers A', { libre: true }), xB = lee(sc, 'xB', 'die Position des Auflagers B', { libre: true });
      if (xA === xB) throw new Error('Die beiden Auflager dürfen nicht am selben Ort liegen');
      for (const x of [xA, xB]) if (x < 0 || x > L) throw new Error('Die Auflager müssen auf dem Balken liegen (zwischen 0 und L)');
      const cargas = String(sc.cargas || '').split(/;|\n/).map((x) => x.trim()).filter(Boolean).map((c, i) => {
        const [x, m] = c.split(/\s+/).map(leeNum);
        if (!isFinite(x) || !isFinite(m) || m < 0) throw new Error(`Last ${i + 1}: Schreibe „Position Masse“ mit Zahlen (positive Masse)`);
        if (x < 0 || x > L) throw new Error(`Last ${i + 1}: Sie muss auf dem Balken liegen`);
        return { x, m };
      });
      const todas = [{ x: L / 2, m: M, nom: 'Gewichtskraft des Balkens' }, ...cargas.map((c, i) => ({ ...c, nom: `Last ${i + 1}` }))].filter((c) => c.m > 0);
      const W = todas.reduce((s, c) => s + c.m * g, 0), mA = todas.reduce((s, c) => s + c.m * g * (c.x - xA), 0);
      const RB = mA / (xB - xA), RA = W - RB;
      pasos.push({ t: 'Drehmomente bezüglich des Auflagers A', html: `$Σ τ_A = 0$: ${todas.map((c) => `${f(c.m * g)} · (${f(c.x)} − ${f(xA)})`).join(' + ')} $= R_B (${f(xB)} − ${f(xA)})$ ⇒ <b>R<sub>B</sub> = ${f(RB)} N</b>` });
      pasos.push({ t: 'Vertikale Kräfte', html: `$R_A + R_B = Σ m g$ = ${f(W)} N ⇒ <b>R<sub>A</sub> = ${f(RA)} N</b>` });
      const vuelca = RA < -1e-9 || RB < -1e-9;
      if (vuelca) pasos.push({ t: 'Er kippt!', html: `Ein Auflager müsste nach unten ziehen (negative Reaktion): Der Balken dreht sich um das Auflager ${RA < 0 ? 'B' : 'A'} und kippt, es sei denn, er ist verankert.` });
      return { modo: 'equilibrio', tipo: 'viga', M, L, xA, xB, cargas, todas, RA, RB, vuelca, pasos };
    }
    const th = lee(sc, 'theta', 'der Winkel zum Boden', { max: 89.9 }), m = lee(sc, 'm', 'die Masse der Person', { cero: true, opcional: true }) ?? 0, s = lee(sc, 's', 'wo die Person steht', { cero: true, opcional: true }) ?? 0;
    const mu = lee(sc, 'mu', 'die Reibung am Boden', { cero: true, opcional: true });
    if (s > L) throw new Error('Die Person muss auf der Leiter stehen (s ≤ L)');
    const t = th * RAD, N1 = (M + m) * g, N2 = (g * Math.cos(t) * (M * L / 2 + m * s)) / (L * Math.sin(t)), Fr = N2, muMin = Fr / N1;
    pasos.push({ t: 'Kräfte', html: `Glatte Wand: Sie drückt nur horizontal, $N_2$. Boden: Normalkraft $N_1$ und Reibung $F_r$ zur Wand hin.<br>Vertikal: $N_1 = (M + m) g$ = <b>${f(N1)} N</b> &nbsp; Horizontal: $F_r = N_2$` });
    pasos.push({ t: 'Drehmomente bezüglich des Fußpunkts der Leiter', html: `$N_2 L sen θ = M g L/2 cos θ + m g s cos θ ⇒ N_2 = {g cos θ (M L/2 + m s)}/{L sen θ}$ = <b>${f(N2)} N</b> = $F_r$` });
    pasos.push({ t: 'Rutscht sie?', html: `Nötig ist $μ ≥ F_r/N_1$ = <b>${f(muMin)}</b>${mu !== null ? `; mit μ = ${f(mu)} ${mu >= muMin ? '<b>rutscht sie nicht</b>' : '<b>rutscht sie</b>'}` : ''}.` });
    let sMax = null;
    if (mu !== null && m > 0) {
      sMax = (mu * N1 * L * Math.tan(t)) / g / m - (M * L) / (2 * m);
      pasos.push({ t: 'Wie weit kann sie hinaufsteigen?', html: `Mit $F_r = μ N_1$: $s_{max} = {μ N_1 L tan θ}/{m g} − {M L}/{2m}$ = ${f(sMax)} m ⇒ ${sMax >= L ? '<b>kann bis ganz oben steigen</b>' : sMax <= 0 ? '<b>rutscht schon beim Hinaufsteigen</b>' : `<b>kann ${f(sMax)} m hinaufsteigen</b> von ${f(L)} m`}.` });
    }
    return { modo: 'equilibrio', tipo: 'escalera', M, L, th, m, s, mu, N1, N2, Fr, muMin, resbala: mu !== null && mu < muMin, sMax, pasos };
  }

  function resolver(sc) {
    const fn = { rodadura, polea, momento, compuesto, choque, pendulo, equilibrio }[sc.modo];
    return fn ? fn(sc) : inercia(sc);
  }

  const G = '9,8';
  const ejemplos = [
    { clave: 'varilla-extremo', nombre: 'Stab, der sich um ein Ende dreht (Steiner)', sc: { modo: 'inercia', cuerpo: 'varilla', M: '2', L: '1,2', d: '0,6' } },
    { clave: 'disco', nombre: 'Scheibe um ihre Achse', sc: { modo: 'inercia', cuerpo: 'cilindro', M: '5', L: '0,3', d: '' } },
    { clave: 'placa', nombre: 'Rechteckige Platte', sc: { modo: 'inercia', cuerpo: 'placa', M: '3', L: '0,4', b: '0,3', d: '' } },
    { clave: 'pendulo-compuesto', nombre: 'Zusammengesetzt: Stab mit einer Kugel an der Spitze', sc: { modo: 'compuesto', piezas: 'varilla 1 0,8 0,4\nesfera 2 0,1 0,9' } },
    { clave: 'mancuerna', nombre: 'Zusammengesetzt: zwei durch eine Stange verbundene Massen', sc: { modo: 'compuesto', piezas: 'punto 1 0,25\npunto 1 0,25\nvarilla 0,2 0,5 0' } },
    { clave: 'esfera-rueda', nombre: 'Kugel, die eine Ebene hinunterrollt', sc: { modo: 'rodadura', cuerpo: 'esfera', g: G, M: '2', L: '0,1', theta: '30', d: '3', mu: '0,2' } },
    { clave: 'aro-desliza', nombre: 'Reifen mit wenig Reibung', sc: { modo: 'rodadura', cuerpo: 'aro', g: G, M: '1', L: '0,2', theta: '40', d: '2', mu: '0,3' } },
    { clave: 'polea', nombre: 'Vollrolle mit hängendem Körper', sc: { modo: 'polea', cuerpo: 'cilindro', g: G, M: '4', L: '0,15', m: '2', d: '1,5' } },
    { clave: 'patinadora', nombre: 'Eisläuferin, die die Arme anlegt', sc: { modo: 'momento', I1: '4,5', w1: '60', I2: '1,5', unidad: 'rpm' } },
    { clave: 'bala-varilla', nombre: 'Kugel, die in einem hängenden Stab stecken bleibt', sc: { modo: 'choque', tipo: 'bala', g: G, M: '2', L: '1', m: '0,01', v: '300', r: '0,8' } },
    { clave: 'plataforma', nombre: 'Kind, das auf ein Karussell springt', sc: { modo: 'choque', tipo: 'plataforma', M: '200', L: '2', w1: '10', m: '30', v: '3', r: '2' } },
    { clave: 'pendulo-fisico', nombre: 'Physikalisches Pendel: an einem Ende aufgehängter Stab', sc: { modo: 'pendulo', tipo: 'oscila', cuerpo: 'varilla', g: G, M: '1', L: '1', d: '0,5', th0: '20' } },
    { clave: 'aro-clavo', nombre: 'An einem Nagel aufgehängter Reifen', sc: { modo: 'pendulo', tipo: 'oscila', cuerpo: 'aro', g: G, M: '0,5', L: '0,2', d: '0,2', th0: '10' } },
    { clave: 'varilla-cae', nombre: 'Senkrechter Stab, der sich um seinen Fuß drehend fällt', sc: { modo: 'pendulo', tipo: 'cae', cuerpo: 'varilla', g: G, M: '1', L: '1,5', d: '0,75', th0: '0', th: '90' } },
    { clave: 'escalera', nombre: 'An eine glatte Wand gelehnte Leiter', sc: { modo: 'equilibrio', tipo: 'escalera', g: G, M: '10', L: '4', theta: '60', m: '70', s: '3', mu: '0,4' } },
    { clave: 'viga', nombre: 'Balken auf zwei Auflagern mit Lasten', sc: { modo: 'equilibrio', tipo: 'viga', g: G, M: '50', L: '6', xA: '0', xB: '4', cargas: '6 30; 2 80' } },
  ];

  return { resolver, inercia, compuesto, rodadura, polea, momento, choque, pendulo, equilibrio, CUERPOS, ejemplos, f };
})();

