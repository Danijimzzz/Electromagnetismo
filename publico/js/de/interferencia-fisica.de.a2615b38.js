const Interferencia = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, entero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Es fehlt ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} muss eine Zahl sein`);
    if (!signo && v <= 0) throw new Error(`${may(nom)} muss größer als 0 sein`);
    if (entero && !Number.isInteger(v)) throw new Error(`${may(nom)} muss eine ganze Zahl sein`);
    return v;
  }
  const grados = (r) => (r * 180) / Math.PI;
  const sinc2 = (b) => (Math.abs(b) < 1e-9 ? 1 : (Math.sin(b) / b) ** 2);
  function color(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else if (nm <= 780) r = 1;
    const k = nm < 380 || nm > 780 ? 0 : nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1;
    if (nm < 380 || nm > 780) return [150, 150, 150];
    return [r, g, b].map((c) => Math.round(255 * (c * k) ** 0.8));
  }
  const nombreColor = (nm) => (nm < 380 ? 'ultravioleta' : nm < 450 ? 'violeta' : nm < 495 ? 'azul' : nm < 570 ? 'verde' : nm < 590 ? 'amarillo' : nm < 620 ? 'naranja' : nm <= 750 ? 'rojo' : 'infrarrojo');
  const G = (x, d) => `{${f(x, d)}}`;
  const J1 = (x) => { let s = 0; const N = 64; for (let k = 0; k < N; k++) { const t = ((k + 0.5) * Math.PI) / N; s += Math.cos(t - x * Math.sin(t)); } return s / N; };
  const airy = (u) => (Math.abs(u) < 1e-6 ? 1 : ((2 * J1(u)) / u) ** 2);
  const ord = (m) => (m === 0 ? 'central' : `der Ordnung ${m}`);

  function young(sc) {
    const l0 = lee(sc, 'lambda', 'die Wellenlänge λ'), d = lee(sc, 'd', 'der Spaltabstand d') * 1e-3, L = lee(sc, 'L', 'der Abstand zum Schirm L');
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'die Brechzahl des Mediums n'), lam = (l0 * 1e-9) / n, a = lee(sc, 'a', 'die Breite jedes Spalts a', { opcional: true });
    const aa = a === null ? null : a * 1e-3, pasos = [];
    if (aa !== null && aa >= d) throw new Error('Die Breite jedes Spalts muss kleiner als der Abstand zwischen ihnen sein');
    const dy = (lam * L) / d, mmax = Math.floor(d / lam - 1e-12);
    pasos.push({ t: 'Daten', html: `$λ = ${f(l0)}$ nm${n !== 1 ? `, in einem Medium mit Brechzahl $n = ${f(n)}$: $λ_n = λ/n = ${f(lam * 1e9)}$ nm` : ''} (${nombreColor(l0)}), $d = ${f(d * 1e3)}$ mm, $L = ${f(L)}$ m${aa !== null ? `, Spaltbreite $a = ${f(a)}$ mm` : ''}` });
    pasos.push({ t: 'Interferenzbedingung', html: `Der Gangunterschied der beiden Spalte zu einem Punkt des Schirms ist $Δ = d sin θ$. Es gibt ein Maximum (heller Streifen), wenn $Δ = mλ$, und ein Minimum (dunkler Streifen), wenn $Δ = (m + ½)λ$, mit m = 0, ±1, ±2…<br>Für kleine Winkel gilt $sin θ ≈ tan θ = y/L$, also liegen die Maxima bei $y_m = mλL/d$.` });
    pasos.push({ t: 'Streifenabstand', html: `Abstand zwischen zwei aufeinanderfolgenden hellen (oder dunklen) Streifen: $Δy = λL/d = {${f(lam)} · ${f(L)}}/${G(d)}$ = <b>${f(dy * 1e3)} mm</b>` });
    const m = lee(sc, 'm', 'die Ordnung m', { opcional: true, signo: true, entero: true });
    let ym = null, th = null;
    if (m !== null) {
      if (Math.abs(m) > mmax) throw new Error(`Es gibt kein Maximum der Ordnung ${m}: höchstens m = ${mmax} (sin θ = mλ/d darf 1 nicht übersteigen)`);
      th = Math.asin((m * lam) / d); ym = L * Math.tan(th);
      pasos.push({ t: `Maximum ${ord(m)}`, html: `$sen θ_{${m}} = mλ/d = {${m} · ${f(lam)}}/${G(d)} = ${f(Math.sin(th))}$ ⇒ θ = <b>${f(grados(th))}°</b><br>$y_{${m}} = L tan θ$ = <b>${f(ym * 1e3)} mm</b>${Math.abs(th) < 0.1 ? ` (mit der Näherung, $m Δy = ${f(m * dy * 1e3)}$ mm)` : ''}<br>Das nächste Minimum liegt bei $y = {(m + ½)λL}/d = ${f((m + 0.5) * dy * 1e3)}$ mm.` });
    }
    const y = lee(sc, 'y', 'die Position y auf dem Schirm', { opcional: true, signo: true });
    let Iy = null;
    if (y !== null) {
      const yy = y * 1e-3, s = yy / Math.hypot(yy, L), delta = (2 * Math.PI * d * s) / lam, beta = aa !== null ? (Math.PI * aa * s) / lam : 0;
      Iy = Math.cos(delta / 2) ** 2 * sinc2(beta);
      pasos.push({ t: `Intensität bei y = ${f(y)} mm`, html: `Gangunterschied $Δ = d sin θ = ${f(d * s * 1e9)}$ nm $= ${f((d * s) / lam)} λ$, Phasenverschiebung $δ = 2πΔ/λ = ${f(delta)}$ rad<br>$I/I_{"máx"} = cos^2(δ/2)${aa !== null ? ' · (sin β/β)^2' : ''}$ = <b>${f(Iy)}</b>${Iy > 0.95 ? ' (heller Streifen)' : Iy < 0.05 ? ' (dunkler Streifen)' : ''}` });
    }
    let h = `Die höchste sichtbare Ordnung ist $m_{"max"} = ⌊d/λ⌋$ = <b>${mmax}</b> (insgesamt ${2 * mmax + 1} Maxima, wenn der Schirm unendlich wäre).`;
    if (aa !== null) {
      const ya = (lam * L) / aa, perd = [], q = d / aa, nc = Math.abs(q - Math.round(q)) < 1e-6 ? 2 * Math.round(q) - 1 : 2 * Math.floor(q) + 1;
      for (let k = 1; k * aa < d * 1.0000001 && k < 50; k++) if (Math.abs(((k * d) / aa) - Math.round((k * d) / aa)) < 1e-6) perd.push(Math.round((k * d) / aa));
      h += `<br>Jeder Spalt beugt: Die Einhüllende hat ihr erstes Minimum bei $a sin θ = λ$, $y = λL/a = ${f(ya * 1e3)}$ mm, also befinden sich im zentralen Beugungsmaximum <b>${nc} helle Streifen</b> ($d/a = ${f(d / aa)}$).${perd.length ? ` Es fehlen die Ordnungen ${perd.map((q) => `±${q}`).join(', ')}, die genau auf ein Beugungsminimum fallen.` : ''}`;
    }
    pasos.push({ t: 'Wie viele Streifen', html: h });
    return { modo: 'young', l0, lam, d, L, n, a: aa, dy, mmax, m, th, ym, y, Iy, I: (yy) => { const s = yy / Math.hypot(yy, L); return Math.cos((Math.PI * d * s) / lam) ** 2 * (aa !== null ? sinc2((Math.PI * aa * s) / lam) : 1); }, ancho: aa !== null ? (2 * lam * L) / aa * 1.3 : 10 * dy, pasos };
  }

  function rendija(sc) {
    const l0 = lee(sc, 'lambda', 'die Wellenlänge λ'), a = lee(sc, 'a', 'die Breite des Spalts a') * 1e-3, L = lee(sc, 'L', 'der Abstand zum Schirm L');
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'die Brechzahl des Mediums n'), lam = (l0 * 1e-9) / n, pasos = [];
    pasos.push({ t: 'Daten', html: `$λ = ${f(l0)}$ nm${n !== 1 ? ` (im Medium $λ/n = ${f(lam * 1e9)}$ nm)` : ''}, $a = ${f(a * 1e3)}$ mm, $L = ${f(L)}$ m` });
    pasos.push({ t: 'Beugungsminima', html: `Teilt man den Spalt in zwei Hälften, löscht sich das Licht jedes Punktes der einen Hälfte mit dem des entsprechenden Punktes der anderen aus, wenn $a sin θ = mλ$, mit m = ±1, ±2… (m = 0 ist das zentrale Maximum, kein Minimum).` });
    const m = vacio(sc.m) ? 1 : lee(sc, 'm', 'die Ordnung m', { entero: true });
    if (m * lam > a) throw new Error(`Es gibt kein Minimum der Ordnung ${m}: a sin θ = mλ verlangt sin θ = ${f((m * lam) / a)} > 1`);
    const th = Math.asin((m * lam) / a), ym = L * Math.tan(th), th1 = Math.asin(Math.min(1, lam / a)), ancho = 2 * L * Math.tan(th1);
    pasos.push({ t: `Minimum der Ordnung ${m}`, html: `$sin θ_{${m}} = mλ/a = {${m} · ${f(lam)}}/${G(a)} = ${f(Math.sin(th))}$ ⇒ θ = <b>${f(grados(th))}°</b>, $y_{${m}} = L tan θ$ = <b>${f(ym * 1e3)} mm</b>` });
    pasos.push({ t: 'Breite des zentralen Maximums', html: `Es reicht vom Minimum −1 bis +1: $2L tan θ_1 ≈ 2λL/a$ = <b>${f(ancho * 1e3)} mm</b>. Die Nebenmaxima sind halb so breit und viel schwächer (das erste hat 4,7 % der zentralen Intensität). Je schmaler der Spalt, desto stärker öffnet sich das Licht.` });
    const y = lee(sc, 'y', 'die Position y', { opcional: true, signo: true });
    let Iy = null;
    if (y !== null) { const s = (y * 1e-3) / Math.hypot(y * 1e-3, L), b = (Math.PI * a * s) / lam; Iy = sinc2(b); pasos.push({ t: `Intensität bei y = ${f(y)} mm`, html: `$β = πa sin θ/λ = ${f(b)}$ rad ⇒ $I/I_0 = (sin β/β)^2$ = <b>${f(Iy)}</b>` }); }
    return { modo: 'rendija', l0, lam, a, L, n, m, th, ym, ancho, y, Iy, I: (yy) => sinc2((Math.PI * a * (yy / Math.hypot(yy, L))) / lam), anchoV: Math.min(3.2 * ancho, 4 * L), pasos };
  }

  function circular(sc) {
    const l0 = lee(sc, 'lambda', 'die Wellenlänge λ'), D = lee(sc, 'D', 'der Durchmesser der Öffnung D') * 1e-3;
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'die Brechzahl des Mediums n'), lam = (l0 * 1e-9) / n, pasos = [];
    const L = lee(sc, 'L', 'der Abstand zum Schirm L', { opcional: true }), dist = lee(sc, 'dist', 'der Abstand zu den Objekten', { opcional: true }), sep = lee(sc, 'sep', 'der Abstand der Objekte', { opcional: true });
    if (1.22 * lam >= D) throw new Error('Die Öffnung ist kleiner als die Wellenlänge: Es gibt keine Airy-Scheibe (1,22 λ/D > 1)');
    const thR = Math.asin((1.22 * lam) / D);
    pasos.push({ t: 'Airy-Scheibe', html: `Eine kreisförmige Öffnung mit Durchmesser D beugt das Licht in eine helle zentrale Scheibe, umgeben von Ringen. Das erste Minimum liegt bei $sin θ = 1,22 λ/D = {1,22 · ${f(lam)}}/${G(D)} = ${f(Math.sin(thR))}$ ⇒ θ = <b>${f(thR)} rad</b> (${f(grados(thR))}°)${n !== 1 ? `, mit $λ/n = ${f(lam * 1e9)}$ nm im Medium` : ''}.` });
    let r = null;
    if (L !== null) { r = L * Math.tan(thR); pasos.push({ t: 'Größe der Scheibe', html: `Auf einem Schirm (oder in der Brennebene) bei $L = ${f(L)}$ m ist der Radius der zentralen Scheibe $r = L tan θ ≈ 1,22 λL/D$ = <b>${f(r * 1e3)} mm</b>.` }); }
    pasos.push({ t: 'Rayleigh-Kriterium', html: `Zwei Punkte sind unterscheidbar, wenn das Maximum des einen mindestens auf das erste Minimum des anderen fällt: Der kleinste Winkelabstand ist $θ_{"min"} ≈ 1,22 λ/D$ = <b>${f(thR)} rad</b>. Das ist die Auflösungsgrenze des Instruments: Je größer der Durchmesser und je kleiner die Wellenlänge, desto mehr Detail sieht man.` });
    let smin = null, res = null, thS = null;
    if (dist !== null) {
      smin = dist * thR;
      pasos.push({ t: `Objekte in ${f(dist)} m Entfernung`, html: `Der kleinste unterscheidbare Abstand ist $s_{"min"} = θ_{"min"} · d = ${f(thR)} · ${f(dist)}$ = <b>${f(smin * 1e3)} mm</b>${smin > 1 ? ` (${f(smin / 1e3)} km)` : ''}.` });
      if (sep !== null) { thS = (sep * 1e-3) / dist; res = thS >= thR; pasos.push({ t: 'Unterscheidbar?', html: `Die beiden Objekte erscheinen unter einem Winkel $θ = s/d = ${f(sep * 1e-3)}/${f(dist)} = ${f(thS)}$ rad, ${res ? 'größer' : 'kleiner'} als $θ_{"min"}$: <b>${res ? 'sie sind unterscheidbar' : 'sie sind nicht unterscheidbar'}</b>${res ? '' : ', man sieht sie als einen einzigen Punkt'}.` }); }
    }
    const esc = L ?? 1, k = (Math.PI * D) / lam, s2 = thS !== null ? thS / 2 : null;
    const un = (y) => airy(k * Math.sin(Math.atan(y / esc)));
    const dos = s2 === null ? null : (y) => (airy(k * Math.sin(Math.atan(y / esc) - s2)) + airy(k * Math.sin(Math.atan(y / esc) + s2)));
    let norma = 1;
    if (dos) { norma = 0; for (let i = 0; i <= 400; i++) norma = Math.max(norma, dos(((i / 400) - 0.5) * 2 * esc * Math.tan(thR + 2 * s2))); }
    const ancho = 2 * esc * Math.tan(Math.min(1.4, 2.6 * thR + (s2 ?? 0) * 2));
    return { modo: 'circular', l0, lam, D, n, L, dist, sep, thR, r, smin, thS, res, eje: L !== null ? 'y (mm)' : 'θ (mrad)', I: dos ? (y) => dos(y) / norma : un, Iuno: un, s2, ancho, ym: null, y: null, pasos };
  }

  function red(sc) {
    const l0 = lee(sc, 'lambda', 'die Wellenlänge λ'), N = lee(sc, 'N', 'die Anzahl der Linien pro mm'), d = 1e-3 / N, lam = l0 * 1e-9, pasos = [];
    const L = lee(sc, 'L', 'der Abstand zum Schirm L', { opcional: true }), l2 = lee(sc, 'lambda2', 'die zweite Wellenlänge', { opcional: true }), W = lee(sc, 'W', 'die beleuchtete Breite', { opcional: true });
    pasos.push({ t: 'Gitterkonstante', html: `Bei ${f(N)} Linien pro mm ist der Abstand zwischen den Spalten $d = 1/N = ${f(d * 1e3)}$ mm $= ${f(d * 1e9)}$ nm` });
    const mmax = Math.floor(d / lam - 1e-12);
    if (mmax < 1) throw new Error('Bei diesem Gitter und diesem λ gibt es nicht einmal die erste Ordnung (λ > d)');
    const ords = [];
    for (let m = 1; m <= mmax; m++) { const th = Math.asin((m * lam) / d); ords.push({ m, th, y: L !== null && th < 1.5 ? L * Math.tan(th) : null }); }
    pasos.push({ t: 'Gittergleichung', html: `Die Spalte interferieren konstruktiv, wenn $d sin θ = mλ$. Bei vielen Spalten sind die Maxima sehr schmal und hell.<br>${ords.map((o) => `m = ${o.m}: $sen θ = ${f((o.m * lam) / d)}$ ⇒ θ = <b>${f(grados(o.th))}°</b>${o.y !== null ? `, $y = L tan θ = ${f(o.y * 100)}$ cm` : ''}`).join('<br>')}` });
    pasos.push({ t: 'Höchste Ordnung', html: `$sin θ ≤ 1$ ⇒ $m ≤ d/λ = ${f(d / lam)}$ ⇒ <b>m<sub>max</sub> = ${mmax}</b>, also sieht man ${2 * mmax + 1} Maxima einschließlich des zentralen.` });
    let sep = null, R = null, dlmin = null;
    if (W !== null) {
      const Nt = W * N; R = Nt * mmax; dlmin = l0 / Nt;
      pasos.push({ t: 'Auflösungsvermögen (Rayleigh)', html: `Bei $N = ${f(Nt)}$ beleuchteten Spalten ist jedes Maximum so schmal, dass zwei Wellenlängen getrennt werden, wenn $λ/Δλ ≤ R = mN$. In erster Ordnung ist $R = ${f(Nt)}$, und man unterscheidet $Δλ_{"min"} = λ/(mN) = ${f(l0)}/${G(Nt)}$ = <b>${f(dlmin, 3)} nm</b>; in der Ordnung ${mmax} ist $R = ${f(R)}$ und $Δλ_{"min"} = ${f(l0 / R, 3)}$ nm.` });
    }
    if (l2 !== null) {
      const t1 = Math.asin(lam / d), t2 = (l2 * 1e-9) / d <= 1 ? Math.asin((l2 * 1e-9) / d) : NaN;
      sep = grados(t2 - t1);
      let h = `In erster Ordnung erscheint $λ_2 = ${f(l2)}$ nm bei θ = ${isFinite(t2) ? `${f(grados(t2))}°` : 'keiner'}: Winkelabstand $Δθ$ = <b>${f(Math.abs(sep))}°</b>${L !== null && isFinite(t2) ? `, auf dem Schirm ${f(Math.abs(L * (Math.tan(t2) - Math.tan(t1))) * 1000)} mm` : ''}.`;
      if (W !== null) { const Nt = W * N, dl = Math.abs(l2 - l0), lm = (l0 + l2) / 2; h += `<br>Um sie in erster Ordnung zu trennen, braucht man $λ/Δλ = ${f(lm)}/${G(dl)} = ${f(lm / dl)}$, und das Gitter liefert $R = ${f(Nt)}$: ${Nt >= lm / dl ? '<b>sie werden aufgelöst</b>' : '<b>sie werden nicht aufgelöst</b>'}.`; }
      pasos.push({ t: 'Zwei Wellenlängen', html: h });
    }
    return { modo: 'red', l0, lam, N, d, L, mmax, ords, l2, sep, R, dlmin, W, pasos };
  }

  function lamina(sc) {
    const nf = lee(sc, 'nl', 'die Brechzahl der Schicht n'), n1 = vacio(sc.n1) ? 1 : lee(sc, 'n1', 'die Brechzahl des oberen Mediums'), n2 = vacio(sc.n2) ? 1 : lee(sc, 'n2', 'die Brechzahl des unteren Mediums'), pasos = [];
    const salto1 = nf > n1, salto2 = n2 > nf, medio = salto1 !== salto2;
    pasos.push({ t: 'Phasensprünge bei der Reflexion', html: `Eine Welle, die an einem Medium mit größerer Brechzahl reflektiert wird, ändert ihre Phase um π (wie eine halbe Wellenlänge); bei kleinerer Brechzahl nicht.<br>Oben (${f(n1)} → ${f(nf)}): ${salto1 ? 'ändert sich um π' : 'ändert sich nicht'}. &ensp; Unten (${f(nf)} → ${f(n2)}): ${salto2 ? 'ändert sich um π' : 'ändert sich nicht'}.<br>${medio ? 'Nur eine der beiden ändert sich: Es gibt eine zusätzliche Phasenverschiebung von einer halben Wellenlänge.' : 'Beide gleich: keine zusätzliche Phasenverschiebung.'}` });
    const condC = medio ? '$2nt = (m + ½)λ$' : '$2nt = mλ$', condD = medio ? '$2nt = mλ$' : '$2nt = (m + ½)λ$';
    pasos.push({ t: 'Bedingung', html: `Der in die Schicht eintretende Strahl legt 2t mehr zurück, einen optischen Weg 2nt. In Reflexion:<br>Verstärkung (hell): ${condC}; &ensp; Auslöschung: ${condD}, mit m = ${medio ? '0, 1, 2…' : '1, 2, 3…'}` });
    const t = lee(sc, 't', 'die Dicke t', { opcional: true }), l0 = lee(sc, 'lambda', 'die Wellenlänge λ', { opcional: true });
    let refuerzan = [], anulan = [], tmin = null, tmin2 = null;
    if (t !== null) {
      const op = 2 * nf * t;
      for (let m = 0; m < 200; m++) { const lc = op / (medio ? m + 0.5 : m), ld = op / (medio ? m : m + 0.5); if (isFinite(lc) && lc >= 380 && lc <= 750) refuerzan.push(lc); if (isFinite(ld) && ld > 0 && ld >= 380 && ld <= 750) anulan.push(ld); }
      pasos.push({ t: `Mit t = ${f(t)} nm`, html: `Zusätzlicher optischer Weg $2nt = 2 · ${f(nf)} · ${f(t)} = ${f(op)}$ nm<br>Im Sichtbaren verstärkt: ${refuerzan.length ? refuerzan.map((l) => `<b>${f(l)} nm</b> (${nombreColor(l)})`).join(', ') : 'keine'}<br>Ausgelöscht: ${anulan.length ? anulan.map((l) => `${f(l)} nm (${nombreColor(l)})`).join(', ') : 'keine'}${t < 30 ? '<br>Bei einer so geringen Dicke im Vergleich zu λ erscheint die Schicht in Reflexion dunkel, wenn es eine zusätzliche Phasenverschiebung gibt (wie der obere Teil einer Seifenblase kurz vor dem Platzen).' : ''}` });
    }
    if (l0 !== null) {
      tmin = medio ? l0 / (4 * nf) : l0 / (2 * nf); tmin2 = medio ? l0 / (2 * nf) : l0 / (4 * nf);
      pasos.push({ t: `Dicken für λ = ${f(l0)} nm`, html: `Mindestdicke mit Verstärkung: $t = ${medio ? 'λ/(4n)' : 'λ/(2n)'}$ = <b>${f(tmin)} nm</b><br>Mindestdicke, die die Reflexion auslöscht (Antireflex): $t = ${medio ? 'λ/(2n)' : 'λ/(4n)'}$ = <b>${f(tmin2)} nm</b>${!medio && n1 < nf && nf < n2 ? `<br>Um sie ganz auszulöschen, gleicht $n = √(n_1 n_2) = ${f(Math.sqrt(n1 * n2))}$ die beiden Reflexionen an.` : ''}` });
    }
    if (t === null && l0 === null) throw new Error('Gib die Dicke t, die Wellenlänge λ oder beide an');
    return { modo: 'lamina', nf, n1, n2, medio, t, l0, refuerzan, anulan, tmin, tmin2, pasos, R: (lnm, tt = t) => { const d = (2 * Math.PI * 2 * nf * tt) / lnm + (medio ? Math.PI : 0); return Math.cos(d / 2) ** 2; } };
  }

  function cuna(sc) {
    const l0 = lee(sc, 'lambda', 'die Wellenlänge λ'), Lc = lee(sc, 'Lc', 'die Länge der Platten') * 1e-2;
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'die Brechzahl dessen, was im Keil ist'), lam = l0 * 1e-9, pasos = [];
    const h0 = lee(sc, 'h', 'die Dicke des Abstandhalters', { opcional: true }), dx0 = lee(sc, 'dx', 'der gemessene Streifenabstand', { opcional: true });
    if (h0 === null && dx0 === null) throw new Error('Gib die Dicke des Abstandhalters h oder den gemessenen Streifenabstand an');
    pasos.push({ t: 'Warum Streifen entstehen', html: `Das Licht wird oben und unten an der Schicht aus ${n === 1 ? 'Luft' : `Brechzahl ${f(n)}`} reflektiert; die Reflexion unten ändert die Phase um π, also gibt es im Abstand x vom Berührpunkt, bei Dicke $t = αx$, einen dunklen Streifen, wenn $2nt = mλ$, und einen hellen, wenn $2nt = (m + ½)λ$. Genau am Berührpunkt (t = 0) ist der Streifen dunkel.` });
    let h, dx;
    if (h0 !== null) {
      h = h0 * 1e-6; dx = (lam * Lc) / (2 * n * h);
      pasos.push({ t: 'Streifenabstand', html: `Der Keilwinkel ist $α ≈ h/L = ${f(h)}/${f(Lc)} = ${f(h / Lc)}$ rad. Zwischen zwei dunklen Streifen wächst die Dicke um λ/(2n): $Δx = λ/(2nα) = λL/(2nh) = {${f(lam)} · ${f(Lc)}}/{2 · ${f(n)} · ${f(h)}}$ = <b>${f(dx * 1e3)} mm</b>` });
    } else {
      dx = dx0 * 1e-3; h = (lam * Lc) / (2 * n * dx);
      pasos.push({ t: 'Dicke aus den Streifen', html: `Aus $Δx = λL/(2nh)$ folgt $h = λL/(2nΔx) = {${f(lam)} · ${f(Lc)}}/{2 · ${f(n)} · ${f(dx)}}$ = <b>${f(h * 1e6)} µm</b>. So misst man die Dicke eines Haares oder eines Blatts Papier.` });
    }
    const N = Math.floor((2 * n * h) / lam + 1e-9) + 1;
    pasos.push({ t: 'Wie viele Streifen', html: `Am Ende ist $2nh/λ = ${f((2 * n * h) / lam)}$, also sieht man <b>${N} dunkle Streifen</b> einschließlich des am Berührpunkt (einen alle ${f(dx * 1e3)} mm).` });
    const alfa = h / Lc;
    return { modo: 'cuna', l0, lam, Lc, n, h, dx, N, alfa, eje: 'x (mm)', desde0: true, I: (x) => Math.sin((2 * Math.PI * n * alfa * Math.max(0, x)) / lam) ** 2, ancho: Math.min(Lc, 12 * dx), ym: null, y: null, pasos };
  }

  function anillos(sc) {
    const l0 = lee(sc, 'lambda', 'die Wellenlänge λ'), lam = l0 * 1e-9, n = vacio(sc.n) ? 1 : lee(sc, 'n', 'die Brechzahl dessen, was zwischen Linse und Glas ist');
    const m = vacio(sc.m) ? 5 : lee(sc, 'm', 'die Nummer des Rings m', { entero: true });
    const R0 = lee(sc, 'R', 'der Krümmungsradius der Linse', { opcional: true }), rm0 = lee(sc, 'rm', 'der gemessene Radius des Rings', { opcional: true }), pasos = [];
    if (R0 === null && rm0 === null) throw new Error('Gib den Krümmungsradius R oder den gemessenen Radius eines Rings an');
    pasos.push({ t: 'Dicke der Schicht', html: `Zwischen Linse und Glas bleibt eine Schicht aus ${n === 1 ? 'Luft' : `Brechzahl ${f(n)}`}, die im Abstand r von der Mitte $t ≈ r^2/(2R)$ misst. Wie beim Keil ändert die Reflexion unten die Phase um π: dunkler Ring, wenn $2nt = mλ$, und heller, wenn $2nt = (m + ½)λ$. Die Mitte ist dunkel.` });
    let R;
    if (R0 !== null) R = R0;
    else { const rm = rm0 * 1e-3; R = (n * rm * rm) / (m * lam); pasos.push({ t: 'Krümmungsradius', html: `Aus $r_m^2 = mλR/n$ folgt $R = n r_m^2/(mλ) = {${f(n)} · (${f(rm)})^2}/{${m} · ${f(lam)}}$ = <b>${f(R)} m</b>` }); }
    const ro = Math.sqrt((m * lam * R) / n), rb = Math.sqrt(((m - 0.5) * lam * R) / n);
    pasos.push({ t: `Ring ${m}`, html: `Dunkel: $r_m = √(mλR/n) = √({${m} · ${f(lam)} · ${f(R)}}/${G(n)})$ = <b>${f(ro * 1e3)} mm</b><br>Der vorherige helle: $r = √({(m − ½)λR}/n)$ = <b>${f(rb * 1e3)} mm</b><br>Die Ringe rücken nach außen zusammen, weil der Radius wie $√m$ wächst.` });
    return { modo: 'anillos', l0, lam, n, m, R, ro, rb, eje: 'r (mm)', I: (r) => Math.sin((Math.PI * n * r * r) / (lam * R)) ** 2, ancho: 2 * Math.sqrt(((m + 3) * lam * R) / n), ym: ro, y: null, pasos };
  }

  const MODOS = { young, rendija, circular, red, lamina, cuna, anillos };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : young(sc); }

  const ejemplos = [
    { clave: 'young', nombre: 'Young mit einem roten Laser', sc: { modo: 'young', lambda: '633', d: '0,25', L: '1,5', n: '', a: '', m: '3', y: '' } },
    { clave: 'young-y', nombre: 'Intensität an einem Punkt des Schirms', sc: { modo: 'young', lambda: '550', d: '0,1', L: '2', n: '', a: '', m: '', y: '5,5' } },
    { clave: 'young-a', nombre: 'Doppelspalt mit Beugung (Ordnungen fehlen)', sc: { modo: 'young', lambda: '600', d: '0,3', L: '1', n: '', a: '0,1', m: '1', y: '' } },
    { clave: 'young-agua', nombre: 'Young unter Wasser', sc: { modo: 'young', lambda: '589', d: '0,2', L: '1', n: '1,33', a: '', m: '1', y: '' } },
    { clave: 'rendija', nombre: 'Einzelspalt', sc: { modo: 'rendija', lambda: '500', a: '0,05', L: '1,2', n: '', m: '1', y: '' } },
    { clave: 'rendija-2', nombre: 'Zweites Minimum eines schmalen Spalts', sc: { modo: 'rendija', lambda: '633', a: '0,02', L: '2', n: '', m: '2', y: '10' } },
    { clave: 'ojo', nombre: 'Die Scheinwerfer eines Autos: Sieht man zwei oder einen?', sc: { modo: 'circular', lambda: '550', D: '5', L: '', dist: '10000', sep: '1400', n: '' } },
    { clave: 'telescopio', nombre: 'Teleskop mit 10 cm und seine Airy-Scheibe', sc: { modo: 'circular', lambda: '550', D: '100', L: '1', dist: '', sep: '', n: '' } },
    { clave: 'red', nombre: 'Gitter mit 600 Linien/mm', sc: { modo: 'red', lambda: '500', N: '600', L: '1', lambda2: '', W: '' } },
    { clave: 'sodio', nombre: 'Natrium-Dublett (589,0 und 589,6 nm)', sc: { modo: 'red', lambda: '589', N: '300', L: '2', lambda2: '589,6', W: '5' } },
    { clave: 'pompa', nombre: 'Seifenblase', sc: { modo: 'lamina', nl: '1,33', n1: '1', n2: '1', t: '400', lambda: '' } },
    { clave: 'antirreflejo', nombre: 'Antireflexschicht auf einer Brille', sc: { modo: 'lamina', nl: '1,38', n1: '1', n2: '1,52', t: '', lambda: '550' } },
    { clave: 'aceite', nombre: 'Ölfleck auf Wasser', sc: { modo: 'lamina', nl: '1,45', n1: '1', n2: '1,33', t: '300', lambda: '' } },
    { clave: 'cuna', nombre: 'Luftkeil mit einem Papier als Abstandhalter', sc: { modo: 'cuna', lambda: '589', Lc: '10', h: '50', dx: '', n: '' } },
    { clave: 'pelo', nombre: 'Dicke eines Haares aus den Streifen', sc: { modo: 'cuna', lambda: '633', Lc: '8', h: '', dx: '0,5', n: '' } },
    { clave: 'newton', nombre: 'Newtonsche Ringe', sc: { modo: 'anillos', lambda: '589', R: '1', m: '5', rm: '', n: '' } },
    { clave: 'newton-r', nombre: 'Radius einer Linse aus ihren Ringen', sc: { modo: 'anillos', lambda: '546', R: '', m: '10', rm: '2,5', n: '' } },
  ];
  return { resolver, color, nombreColor, ejemplos, f };
})();

