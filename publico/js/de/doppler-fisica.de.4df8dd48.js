const Doppler = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const fq = (x) => f(x, Math.min(12, Math.max(4, Math.floor(Math.log10(Math.abs(x) || 1)) + 2)));
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
  const sentido = (v, quien) => (v > 0 ? `${quien} nähert sich` : v < 0 ? `${quien} entfernt sich` : `${quien} ruht`);
  const tono = (fp, fr) => (fp > fr ? 'Sie klingt höher als die ausgesandte.' : fp < fr ? 'Sie klingt tiefer als die ausgesandte.' : 'Sie klingt gleich wie die ausgesandte.');

  function recta(sc) {
    const fr = lee(sc, 'f', 'die ausgesandte Frequenz'), v = lee(sc, 'v', 'die Schallgeschwindigkeit');
    const vF0 = lee(sc, 'vF', 'die Geschwindigkeit der Quelle', { opcional: true, signo: true }) ?? 0;
    const vO0 = lee(sc, 'vO', 'die Geschwindigkeit des Beobachters', { opcional: true, signo: true }) ?? 0;
    const w = lee(sc, 'w', 'die Windgeschwindigkeit', { opcional: true, signo: true }) ?? 0;
    const aF = lee(sc, 'aF', 'der Winkel der Quelle', { opcional: true, signo: true }) ?? 0;
    const aO = lee(sc, 'aO', 'der Winkel des Beobachters', { opcional: true, signo: true }) ?? 0;
    const cos = (a) => (Math.abs(a % 180) === 90 ? 0 : Math.cos((a * Math.PI) / 180));
    const vF = vF0 * cos(aF), vO = vO0 * cos(aO);
    const ve = v + w; // velocidad del sonido respecto al suelo, de la fuente al observador
    if (ve <= 0) throw new Error('Der Gegenwind ist so stark wie der Schall: Die Welle erreicht den Beobachter nicht');
    if (vF >= ve) throw new Error('Die Quelle bewegt sich mit Schallgeschwindigkeit oder schneller auf den Beobachter zu: Es bildet sich eine Stoßwelle, und die Doppler-Formel gilt nicht (siehe den Reiter „Stoßwelle“)');
    if (-vO >= ve) throw new Error('Der Beobachter entfernt sich mit Schallgeschwindigkeit oder schneller: Die Welle erreicht ihn nicht');
    const fp = (fr * (ve + vO)) / (ve - vF), lam = ve / fr, lamp = (ve - vF) / fr;
    const pasos = [
      { t: 'Vorzeichenkonvention', html: `Die Geschwindigkeiten sind positiv, wenn sich Quelle und Beobachter einander nähern: ${sentido(vF, 'die Quelle')} ($v_F = ${f(vF)}$ m/s) und ${sentido(vO, 'der Beobachter')} ($v_O = ${f(vO)}$ m/s).` },
    ];
    if (aF || aO) pasos.unshift({ t: 'Schräg bewegte Geschwindigkeiten', html: `Es zählt nur die Komponente jeder Geschwindigkeit längs der Geraden, die Quelle und Beobachter verbindet; die senkrechte nähert oder entfernt nicht und ändert die Tonhöhe nicht:${aF ? ` $v_F = ${f(vF0)} · cos ${f(aF)}° = ${f(vF)}$ m/s` : ''}${aF && aO ? ',' : ''}${aO ? ` $v_O = ${f(vO0)} · cos ${f(aO)}° = ${f(vO)}$ m/s` : ''}.` });
    if (w) pasos.push({ t: 'Wind', html: `Die Luft bewegt sich ${w > 0 ? 'von der Quelle zum Beobachter' : 'vom Beobachter zur Quelle'}, also läuft der Schall bezüglich des Bodens zum Beobachter mit $v + w = ${f(v)} ${w < 0 ? '−' : '+'} ${f(Math.abs(w))} = ${f(ve)}$ m/s. In der Formel setzt man diese Geschwindigkeit anstelle von $v$ ein.` });
    const V = w ? 'v + w' : 'v', Vn = w ? `${f(ve)}` : f(v);
    pasos.push({ t: 'Gehörte Frequenz', html: `$f′ = f (${V} + v_O)/(${V} − v_F) = ${fq(fr)} · (${Vn} + ${p(vO)})/(${Vn} − ${p(vF)})$ = <b>${fq(fp)} Hz</b><br>${tono(fp, fr)} Die Änderung beträgt ${fp >= fr ? '+' : '−'}${fq(Math.abs(fp - fr))} Hz (${f((100 * (fp - fr)) / fr, 3)} %).` });
    pasos.push({ t: 'Wellenlänge zwischen beiden', html: `$λ′ = (${V} − v_F)/f = (${Vn} − ${p(vF)})/${fq(fr)}$ = <b>${f(lamp)} m</b><br>Bei ruhender Quelle wäre $λ = ${V}/f = ${f(lam)}$ m. Die Bewegung des Beobachters ändert λ nicht: Sie ändert, wie schnell ihn die Wellenfronten erreichen.` });
    return { modo: 'recta', fr, v, vF, vO, vF0, vO0, aF, aO, w, ve, fp, lam, lamp, pasos };
  }

  function paso(sc) {
    const v = lee(sc, 'v', 'die Schallgeschwindigkeit');
    let fr, u, f1, f2;
    const pasos = [];
    if (sc.datos === 'oidas') {
      f1 = lee(sc, 'f1', 'die beim Annähern gehörte Frequenz'); f2 = lee(sc, 'f2', 'die beim Entfernen gehörte Frequenz');
      if (f2 >= f1) throw new Error('Beim Annähern der Quelle klingt es höher als beim Entfernen: f₁ muss größer als f₂ sein');
      u = (v * (f1 - f2)) / (f1 + f2); fr = (2 * f1 * f2) / (f1 + f2);
      pasos.push({ t: 'Die beiden Gleichungen', html: `Annähern: $f_1 = f v/(v − u)$ &nbsp; Entfernen: $f_2 = f v/(v + u)$` });
      pasos.push({ t: 'Geschwindigkeit der Quelle', html: `Dividiert man die eine durch die andere, fällt $f$ weg: $f_1/f_2 = (v + u)/(v − u)$, und aufgelöst $u = v (f_1 − f_2)/(f_1 + f_2) = ${f(v)} · (${fq(f1)} − ${fq(f2)})/(${fq(f1)} + ${fq(f2)})$ = <b>${f(u)} m/s</b> (${f(u * 3.6)} km/h)` });
      pasos.push({ t: 'Ausgesandte Frequenz', html: `$f = f_1 (v − u)/v = 2 f_1 f_2/(f_1 + f_2) = 2 · ${fq(f1)} · ${fq(f2)}/(${fq(f1)} + ${fq(f2)})$ = <b>${fq(fr)} Hz</b>` });
    } else {
      fr = lee(sc, 'f', 'die ausgesandte Frequenz'); u = lee(sc, 'vF', 'die Geschwindigkeit der Quelle');
      if (u >= v) throw new Error('Die Quelle bewegt sich mit Schallgeschwindigkeit oder schneller: Es bildet sich eine Stoßwelle (siehe den Reiter „Stoßwelle“)');
      f1 = (fr * v) / (v - u); f2 = (fr * v) / (v + u);
      pasos.push({ t: 'Beim Annähern', html: `$f_1 = f v/(v − v_F) = ${fq(fr)} · ${f(v)}/(${f(v)} − ${f(u)})$ = <b>${fq(f1)} Hz</b>` });
      pasos.push({ t: 'Wenn sie vorbei ist und sich entfernt', html: `$f_2 = f v/(v + v_F) = ${fq(fr)} · ${f(v)}/(${f(v)} + ${f(u)})$ = <b>${fq(f2)} Hz</b>` });
    }
    const salto = f1 - f2;
    pasos.push({ t: 'Frequenzsprung beim Vorbeifahren', html: `$Δf = f_1 − f_2 = ${fq(f1)} − ${fq(f2)}$ = <b>${fq(salto)} Hz</b>, ${f((1200 * Math.log2(f1 / f2)) / 100, 3)} Halbtöne (in der Musik ist ein Halbton ein Verhältnis von $2^{1/12}$).` });
    const d = lee(sc, 'd', 'der Abstand zur Straße', { opcional: true, cero: true }) ?? 0;
    let curva = null;
    if (d > 0) {
      const L = Math.max(8 * d, 40), xs = [];
      for (let i = 0; i <= 200; i++) { const x = -L + (2 * L * i) / 200, c = -x / Math.hypot(x, d); xs.push({ x, t: x / u, tr: x / u + Math.hypot(x, d) / v, fp: (fr * v) / (v - u * c) }); }
      curva = { d, L, puntos: xs };
      pasos.push({ t: `Beobachter ${f(d)} m von der Straße entfernt`, html: `Es zählt nur die Komponente der Geschwindigkeit der Quelle in Richtung des Beobachters, $v_F cos α$, wobei α der Winkel zwischen der Straße und der Verbindungsgeraden Quelle–Beobachter ist: $f′ = f v/(v − v_F cos α)$. Weit entfernt ist cos α ≈ ±1, und man hört $f_1$ und $f_2$; genau gegenüber ist cos α = 0, und man hört die ausgesandte Frequenz, ${fq(fr)} Hz. Das Diagramm zeigt die allmähliche Änderung über dem Zeitpunkt des Hörens: Der Schall braucht $r/v$ bis zum Ohr, also ist der Ton, den man genau beim Vorbeifahren gegenüber hört, bereits tiefer als $f$.` });
    }
    return { modo: 'paso', datos: sc.datos === 'oidas' ? 'oidas' : 'fuente', fr, v, u, f1, f2, salto, d, curva, pasos };
  }

  function eco(sc) {
    const fr = lee(sc, 'f', 'die ausgesandte Frequenz'), v = lee(sc, 'v', 'die Geschwindigkeit der Welle');
    const vE = lee(sc, 'vE', 'die Geschwindigkeit des Senders', { opcional: true, signo: true }) ?? 0;
    if (Math.abs(vE) >= v) throw new Error('Der Sender bewegt sich mit der Wellengeschwindigkeit oder schneller: Die Doppler-Formel gilt nicht');
    let u;
    const pasos = [{ t: 'Zwei aufeinanderfolgende Doppler-Effekte', html: `1) Das Hindernis empfängt die Welle wie ein Beobachter: $f_R = f (v + u)/(v − v_E)$<br>2) Es sendet sie als eine mit ihm bewegte Quelle zurück, und der Sender hört sie: $f″ = f_R (v + v_E)/(v − u)$<br>Geschwindigkeiten positiv beim Annähern: $v_E$ die des Senders, $u$ die des Hindernisses.` }];
    if (sc.buscar === 'velocidad') {
      const df = lee(sc, 'df', 'die Frequenzdifferenz', { signo: true });
      const r = (fr + df) / fr, k = (r * (v - vE)) / (v + vE);
      if (!(r > 0)) throw new Error('Die Frequenz des Echos muss positiv sein: Die Differenz ist zu negativ');
      u = (v * (k - 1)) / (k + 1);
      pasos.push({ t: 'Geschwindigkeit des Hindernisses', html: `Das Echo kommt mit $f″ = f + Δf = ${fq(fr)} + ${p(df)} = ${fq(fr + df)}$ Hz an. Aus $f″/f = (v + u)(v + v_E)/((v − u)(v − v_E))$ mit $k = (f″/f)(v − v_E)/(v + v_E) = ${f(k, 6)}$ folgt $u = v (k − 1)/(k + 1)$ = <b>${f(u)} m/s</b> (${f(u * 3.6)} km/h), ${u > 0 ? 'sich nähernd' : u < 0 ? 'sich entfernend' : 'ruhend'}.` });
    } else {
      u = lee(sc, 'u', 'die Geschwindigkeit des Hindernisses', { signo: true });
    }
    if (Math.abs(u) >= v) throw new Error('Das Hindernis bewegt sich mit der Wellengeschwindigkeit oder schneller: Die Doppler-Formel gilt nicht');
    const fR = (fr * (v + u)) / (v - vE), fpp = (fR * (v + vE)) / (v - u), df = fpp - fr;
    if (sc.buscar !== 'velocidad') {
      pasos.push({ t: 'Vom Hindernis empfangene Frequenz', html: `$f_R = ${fq(fr)} · (${f(v)} + ${p(u)})/(${f(v)} − ${p(vE)})$ = <b>${fq(fR)} Hz</b>` });
      pasos.push({ t: 'Frequenz des Echos', html: `$f″ = ${fq(fR)} · (${f(v)} + ${p(vE)})/(${f(v)} − ${p(u)})$ = <b>${fq(fpp)} Hz</b>` });
    }
    pasos.push({ t: 'Schwebungen', html: `Mischt man die ausgesandte Welle mit dem Echo, hört (oder misst) man $Δf = f″ − f$ = <b>${fq(df)} Hz</b>${Math.abs(u) + Math.abs(vE) < 0.01 * v ? `<br>Bei Geschwindigkeiten, die viel kleiner als v sind, gilt die Näherung $Δf ≈ 2 (u + v_E) f/v = ${f((2 * (u + vE) * fr) / v)}$ Hz, die Verkehrsradare verwenden.` : ''}` });
    return { modo: 'eco', buscar: sc.buscar === 'velocidad' ? 'velocidad' : 'frecuencia', fr, v, vE, u, fR, fpp, df, pasos };
  }

  function choque(sc) {
    const v = lee(sc, 'v', 'die Schallgeschwindigkeit'), vF = lee(sc, 'vF', 'die Geschwindigkeit der Quelle');
    if (vF <= v) throw new Error('Damit es eine Stoßwelle gibt, muss die Quelle schneller als der Schall sein (Mach-Zahl größer als 1)');
    const M = vF / v, th = Math.asin(v / vF), gr = (th * 180) / Math.PI;
    const pasos = [
      { t: 'Mach-Zahl', html: `$M = v_F/v = ${f(vF)}/${f(v)}$ = <b>${f(M)}</b>` },
      { t: 'Halber Öffnungswinkel des Machschen Kegels', html: `Die Wellenfronten bleiben zurück, und ihre Einhüllende ist ein Kegel: $sin θ = v/v_F = 1/M = ${f(1 / M)}$, also θ = <b>${f(gr)}°</b>` },
    ];
    const h = lee(sc, 'h', 'die Höhe', { opcional: true });
    let x = null, t = null, r = null;
    if (h) {
      x = h / Math.tan(th); t = x / vF; r = h / Math.sin(th);
      pasos.push({ t: 'Wann man den Knall hört', html: `Der Kegel erreicht den Boden hinter dem Flugzeug. Wenn du ihn hörst, ist das Flugzeug schon über dich hinweggeflogen und befindet sich in einem horizontalen Abstand $x = h/tan θ = ${f(h)}/tan ${f(gr)}°$ = <b>${f(x)} m</b>.<br>Seit es über dir war, ist eine Zeit $t = x/v_F$ = <b>${f(t)} s</b> vergangen, und es ist $r = h/sin θ = ${f(r)}$ m von dir entfernt.` });
    }
    return { modo: 'choque', v, vF, M, th, gr, h, x, t, r, pasos };
  }

  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const C = SI.c;
  function luz(sc) {
    const lam = lee(sc, 'lam', 'die ausgesandte Wellenlänge');
    const pasos = [];
    let beta, lamO, geo = sc.geo === 'transversal' ? 'transversal' : 'radial';
    if (sc.dato === 'observado') {
      geo = 'radial';
      lamO = lee(sc, 'lamO', 'die beobachtete Wellenlänge');
      const R = lamO / lam; beta = (R * R - 1) / (R * R + 1);
      pasos.push({ t: 'Geschwindigkeit aus der Verschiebung', html: `Für eine sich geradlinig entfernende Quelle gilt $λ′/λ = √((1 + β)/(1 − β))$. Mit $R = λ′/λ = ${f(lamO)}/${f(lam)} = ${f(R, 6)}$ erhält man $β = (R^2 − 1)/(R^2 + 1)$ = <b>${f(beta)}</b>, also $v = β c$ = <b>${f(beta * C)} m/s</b> ${beta > 0 ? 'sich entfernend' : beta < 0 ? 'sich nähernd' : '(ruhend)'}.` });
    } else {
      beta = lee(sc, 'beta', 'β = v/c', { signo: true });
      if (Math.abs(beta) >= 1) throw new Error('Nichts bewegt sich mit Lichtgeschwindigkeit oder schneller: β muss zwischen −1 und 1 liegen');
    }
    const g = 1 / Math.sqrt(1 - beta * beta);
    const k = geo === 'transversal' ? g : Math.sqrt((1 + beta) / (1 - beta)); // λ′/λ
    lamO = lam * k;
    const z = k - 1, kc = geo === 'transversal' ? 1 : 1 + beta, nu = C / (lam * 1e-9);
    if (sc.dato !== 'observado') {
      pasos.push({ t: 'Konvention', html: `$β = v/c = ${f(beta)}$, positiv, wenn sich die Quelle entfernt, und negativ, wenn sie sich nähert. Lorentz-Faktor $γ = 1/√(1 − β^2) = ${f(g, 6)}$.` });
      pasos.push(geo === 'transversal'
        ? { t: 'Transversaler Doppler-Effekt', html: `Bewegt sich die Quelle senkrecht zur Sichtlinie, gibt es keinen klassischen Effekt, aber ihre Uhr geht langsamer (Zeitdilatation): $λ′ = γ λ = ${f(g, 6)} · ${f(lam)}$ = <b>${f(lamO)} nm</b>. Das ist ein rein relativistischer Effekt.` }
        : { t: 'Relativistischer Doppler-Effekt', html: `$λ′ = λ √((1 + β)/(1 − β)) = ${f(lam)} · √((1 + ${p(beta)})/(1 − ${p(beta)}))$ = <b>${f(lamO)} nm</b>` });
    }
    pasos.push({ t: 'Frequenz und Verschiebung', html: `$f = c/λ = ${f(nu)}$ Hz und $f′ = f λ/λ′ = ${f(nu / k)}$ Hz. Verschiebung $z = λ′/λ − 1$ = <b>${f(z)}</b>: ${z > 0 ? 'ins Rote (die Quelle entfernt sich oder ihre Uhr geht langsam)' : z < 0 ? 'ins Blaue (die Quelle nähert sich)' : 'keine'}.` });
    pasos.push({ t: 'Vergleich mit der klassischen Formel', html: geo === 'transversal' ? `Klassisch ändert eine Quelle, die sich senkrecht zur Sichtlinie bewegt, die Farbe nicht: $λ′ = λ$. Der Unterschied, $${f(lamO - lam)}$ nm, rührt allein von der Zeitdilatation her.` : `Für $|β| ≪ 1$ gilt $λ′ ≈ λ (1 + β) = ${f(lam * kc)}$ nm (oder $z ≈ β$), was um ${f((100 * Math.abs(lam * kc - lamO)) / lamO, 3)} % vom exakten Wert abweicht.` });
    return { modo: 'luz', dato: sc.dato === 'observado' ? 'observado' : 'fuente', geo, lam, lamO, beta, g, z, k, nu, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'luz') return luz(sc);
    if (sc.modo === 'paso') return paso(sc);
    if (sc.modo === 'eco') return eco(sc);
    if (sc.modo === 'choque') return choque(sc);
    return recta(sc);
  }

  const ejemplos = [
    { clave: 'ambulancia', nombre: 'Krankenwagen, der sich einem Fußgänger nähert', sc: { modo: 'recta', f: '700', v: '340', vF: '25', vO: '0', w: '' } },
    { clave: 'dos-coches', nombre: 'Zwei Autos, die sich voneinander entfernen', sc: { modo: 'recta', f: '500', v: '340', vF: '-20', vO: '-15', w: '' } },
    { clave: 'viento', nombre: 'Sirene mit Rückenwind', sc: { modo: 'recta', f: '1000', v: '340', vF: '0', vO: '10', w: '15' } },
    { clave: 'tren', nombre: 'Zug, der durch einen Bahnhof fährt', sc: { modo: 'paso', datos: 'fuente', f: '440', v: '343', vF: '30', d: '15' } },
    { clave: 'moto', nombre: 'Geschwindigkeit eines Motorrads aus seinem Klang', sc: { modo: 'paso', datos: 'oidas', f1: '520', f2: '440', v: '340' } },
    { clave: 'radar', nombre: 'Verkehrsradar', sc: { modo: 'eco', buscar: 'frecuencia', f: '24e9', v: '3e8', vE: '0', u: '33' } },
    { clave: 'murcielago', nombre: 'Fledermaus, die auf eine Wand zufliegt', sc: { modo: 'eco', buscar: 'frecuencia', f: '40000', v: '340', vE: '6', u: '0' } },
    { clave: 'ecografia', nombre: 'Blutgeschwindigkeit mit Doppler-Ultraschall', sc: { modo: 'eco', buscar: 'velocidad', f: '5e6', v: '1540', vE: '0', df: '1300' } },
    { clave: 'avion', nombre: 'Überschallflugzeug und Überschallknall', sc: { modo: 'choque', v: '340', vF: '680', h: '8000' } },
    { clave: 'cruce', nombre: 'Auto, das schräg vorbeifährt', sc: { modo: 'recta', f: '600', v: '340', vF: '30', vO: '0', w: '', aF: '60', aO: '' } },
    { clave: 'galaxia', nombre: 'Geschwindigkeit einer Galaxie aus ihrer Rotverschiebung', sc: { modo: 'luz', dato: 'observado', lam: '656,3', lamO: '721,9' } },
    { clave: 'estrella', nombre: 'Stern, der sich mit 0,1c nähert', sc: { modo: 'luz', dato: 'fuente', geo: 'radial', lam: '500', beta: '-0,1' } },
    { clave: 'transversal', nombre: 'Transversaler Doppler-Effekt bei 0,6c', sc: { modo: 'luz', dato: 'fuente', geo: 'transversal', lam: '500', beta: '0,6' } },
  ];

  return { resolver, recta, paso, eco, choque, luz, ejemplos, f, fq, C };
})();

