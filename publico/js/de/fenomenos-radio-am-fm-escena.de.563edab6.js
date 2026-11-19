const RadioAmFm = (() => {
  const CLUZ = 3e8, L = 253.3e-6, C0 = 100e-12, R = 10, RDET = 1e4, CDET = 2.2e-9, FM_MHZ = 98.5;
  const ESTACIONES = [{ n: 'A', f: 855, tipo: 'AM' }, { n: 'B', f: 1000, tipo: 'AM' }, { n: 'C', f: 1215, tipo: 'AM' }];
  const f0De = (Cpf) => 1 / (2 * Math.PI * Math.sqrt(L * Cpf * 1e-12)) / 1e3;
  const Qde = (f0k) => (2 * Math.PI * f0k * 1e3 * L) / R;
  const gananciaDe = (f, f0k) => { const Q = Qde(f0k), x = f / f0k - f0k / f; return 1 / Math.sqrt(1 + Q * Q * x * x); };
  const dB = (g) => 20 * Math.log10(g);
  const cercana = (f0k) => ESTACIONES.find((e) => Math.abs(e.f - f0k) <= 3);
  const f0 = f0De(C0 * 1e12), Q0 = Qde(f0), BW0 = f0 / Q0, g9 = gananciaDe(f0 + 9, f0);
  const datos = { L, C0, R, f0, Q0, BW0, g9, g9dB: dB(g9), lamAM: CLUZ / 1e6, lamAudio: CLUZ / 1e3, lamFM: CLUZ / (FM_MHZ * 1e6), tau: RDET * CDET, ESTACIONES };

  const n = (x, d = 1) => x.toFixed(d).replace('.', ',');
  const entero = (x) => String(Math.round(x));
  const miles = (x) => entero(x).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const pasos = [
    { titulo: 'Alle Sender klingen gleichzeitig', corto: 'Sender', dato: { valor: '530–1700 kHz', texto: 'ist das Mittelwellenband (AM); UKW reicht von 87,5 bis 108 MHz.' }, texto: 'In diesem Moment sind in der Luft um dich Dutzende Radiosender, alle gleichzeitig, und die Antenne deines Radios empfängt ein wenig von jedem. Trotzdem hörst du nur den, den du wählst.\n\nWie trennt das Radio einen von allen anderen? Jeder Sender nutzt **seine eigene Frequenz**, wie eine eigene Spur der Autobahn. Die AM-Sender liegen im Mittelwellenband etwa 9 kHz auseinander und die UKW-Sender in ihrem Band 200 kHz. Am Einstellrad zu drehen heißt, die Spur zu wählen.' },
    { titulo: 'Schall allein lässt sich nicht senden', corto: 'Träger', dato: { valor: '75 m', texto: 'ist die Viertelwellenantenne für 1 MHz; für Schall von 1 kHz wären 75 km nötig.' }, texto: `Eine Antenne strahlt gut, wenn sie ein Viertel der Wellenlänge misst, $λ = c/f$. Für einen Schall von 1 kHz gilt $λ = {3·10^8}/{10^3} = 300 "km"$: eine Antenne von 75 km. Unmöglich.\n\nDie Lösung ist, **den Schall auf eine viel schnellere Welle aufzusetzen**, den Träger. Bei 1 MHz beträgt die Wellenlänge $λ = 300 "m"$, und die 75-m-Antenne ist schon ein normaler Turm. Der Träger enthält für sich keine Information: Der Schall steckt in einer kleinen Veränderung von ihm, und das nennt man Modulieren.` },
    { titulo: 'AM: verändert die Höhe der Welle', corto: 'AM', dato: { valor: '9 kHz', texto: 'Breite belegt ein AM-Sender: das Doppelte der höchsten Schallfrequenz (4,5 kHz).' }, texto: 'Bei der **Amplitudenmodulation** behält der Träger seine Frequenz, aber seine Amplitude steigt und fällt im Takt des Schalls $m(t)$:\n\n$s(t) = A [1 + 0,6 · m(t)] cos(ω_p t)$\n\nDie Kontur der Welle (die Hüllkurve, in der Animation gestrichelt gezeichnet) ist eine Kopie des Schalls. Da der Schall Frequenzen bis 4,5 kHz hat, belegt der Sender von $f_p − 4,5$ bis $f_p + 4,5$ kHz, insgesamt 9 kHz. Deshalb liegen AM-Sender 9 kHz auseinander. Sie ist einfach, aber jedes Rauschen (ein Gewitter, ein Motor) verändert ebenfalls die Amplitude und ist zu hören.' },
    { titulo: 'FM: verändert den Takt der Welle', corto: 'FM', dato: { valor: '±75 kHz', texto: 'ist die Abweichung der Trägerfrequenz bei lautestem Schall; jeder Kanal belegt 200 kHz.' }, texto: `Bei der **Frequenzmodulation** ändert sich die Amplitude nie, und die Frequenz steigt und fällt: schneller bei positivem Schall und langsamer bei negativem. UKW-Sender senden bei etwa ${n(FM_MHZ)} MHz (Wellenlänge $λ$ = ${n(datos.lamFM, 2)} m, Antenne von etwa ${entero(datos.lamFM * 25)} cm) und weichen um ±75 kHz ab.\n\nBei fester Amplitude kann der Empfänger die Höhe der Welle **kappen**, ohne den Schall zu verlieren, und das Rauschen, das sich gerade in der Amplitude einschleicht, verschwindet. Deshalb klingt UKW sauber, und es bietet zudem Platz für höhere Töne (bis 15 kHz) und für Stereo. Dafür belegt es mehr Bandbreite, etwa 200 kHz pro Sender, und reicht nur bis zum Horizont.` },
    { titulo: 'Abstimmen: ein Schwingkreis, der in Resonanz geht', corto: 'Abstimmung', dato: { valor: `f₀ = ${entero(f0)} kHz`, texto: `mit L = ${n(L * 1e6)} µH und C = 100 pF; die Durchlassbandbreite beträgt nur ${n(BW0)} kHz (Q = ${entero(Q0)}).` }, texto: `Das Einstellrad des Radios verstellt einen Drehkondensator, der zusammen mit der Antennenspule einen RLC-Reihenschwingkreis bildet. Dieser Kreis reagiert stark auf eine Frequenz, die Resonanzfrequenz, und wenig auf die übrigen:\n\n$f_0 = {1}/{2π√(L C)} = {1}/{2π√(${n(L * 1e6)}·10^{−6} · 10^{−10})} = ${entero(f0)} "kHz"$\n\nSeine Güte ist $Q = {ω_0 L}/R$ = ${entero(Q0)} (mit R = 10 Ω Spulendraht) und die Bandbreite $Δf = f_0/Q$ = **${n(BW0, 2)} kHz**. Ein Nachbarsender 9 kHz entfernt kommt mit $|H|$ = ${n(g9, 2)} herein (${n(datos.g9dB)} dB): Man hört ihn deutlich leiser, aber er verschwindet nicht. Deshalb mischen moderne Radios das Signal zusätzlich mit dem eines Oszillators auf eine feste Frequenz (455 kHz bei AM, 10,7 MHz bei UKW), wo sich viel bessere Filter einsetzen lassen: das ist der Superhet.`, dura: 11000 },
    { titulo: 'Den Schall gewinnen: Diode und Kondensator', corto: 'Detektor', dato: { valor: `${n(datos.tau * 1e6, 0)} µs`, texto: 'ist das RC des Detektors: viel größer als 1 µs des Trägers und viel kleiner als 200 µs des 5-kHz-Schalls.' }, texto: `Nach der Abstimmung ist das AM-Signal noch immer der 1-MHz-Träger mit veränderlicher Höhe: Kein Lautsprecher könnte ihm folgen. Man muss nur die Hüllkurve behalten.\n\nEine **Diode** lässt nur die positiven Halbwellen durch, und ein **Kondensator mit einem Widerstand** lädt sich an jeder Spitze auf und entlädt sich zwischen den Spitzen langsam. Die Zeitkonstante $τ = R C = 10 "kΩ" · 2,2 "nF" = ${n(datos.tau * 1e6, 0)} "µs"$ wirkt als Tiefpass: Sie folgt dem Anstieg und Abfall der Hüllkurve (200 µs bei 5 kHz), aber nicht den 1 000 Trägerschwingungen pro Millisekunde. Übrig bleibt der Schall, den ein Verstärker zum Lautsprecher führt. Bei UKW ist der Detektor ein anderer (ein Diskriminator, der jede Frequenzänderung in Spannung umwandelt), aber das Ende ist dasselbe.` },
  ];

  const ejercicio = () => ({ tipo: 'rlc-banda', R: '10', L: '0,2533', C: '0,0001', f: '1009k', fmin: '100k', fmax: '10M' });
  function abrirEnBode(destino) {
    try { localStorage.setItem('bode-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const cam = { x: 8, y: 4.5, z: 1 };
  const CAMS = [0, 1, 2, 3, 4, 5].map(() => ({ x: 8, y: 4.5, z: 1 }));
  const prueba = { etiqueta: 'die Kapazität des Kondensators (pF)', min: 35, max: 356, paso: 1, valor: 100, C: 100,
    muestra: (Cpf) => { const f = f0De(Cpf), e = cercana(f); return `C = ${Cpf} pF → ${entero(f)} kHz${e ? ` · es spielt der Sender ${e.n}` : ' · nur Rauschen zwischen den Sendern'}`; }, cambia: (Cpf) => { prueba.C = Cpf; } };
  pasos[4].prueba = prueba;

  const NC = 26;
  const audio = (u) => 0.62 * Math.sin(2 * Math.PI * 2 * u) + 0.38 * Math.sin(2 * Math.PI * 3 * u + 1);
  const integral = (u) => (-0.62 * Math.cos(2 * Math.PI * 2 * u)) / (2 * Math.PI * 2) - (0.38 * Math.cos(2 * Math.PI * 3 * u + 1)) / (2 * Math.PI * 3);
  const portadora = (u) => Math.cos(2 * Math.PI * NC * u);
  const envolvente = (u) => (1 + 0.6 * audio(u)) / 1.6;
  const am = (u) => envolvente(u) * portadora(u);
  const fm = (u) => Math.cos(2 * Math.PI * (NC * u + 0.35 * NC * integral(u) * 0.98));
  const detectada = (u) => Math.max(0, am(u));

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(CAMS[paso], reloj, quieto);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto, r = quieto ? 0.4 : reloj;
    const tau = quieto ? 0.13 : (r * 0.05) % 1;
    const M = Dibujo.mezcla;
    g.fillStyle = c.sala; g.fillRect(0, 0, w, h);
    if (paso > 0) { g.fillStyle = M(c.sala, c.portadora, 0.12); g.fillRect(0, 0, w, h); v.pantalla(); v.brillo(8, 4.5, 10, c.sala, 0.9); v.vineta(0.14); v.mundo(); }

    function traza(fn, yc, amp, color, { x0 = 3.5, x1 = 15.3, ancho = 0.04, a = 1, n = 520, pasoU = 0 } = {}) {
      g.lineJoin = 'round'; g.beginPath();
      for (let j = 0; j <= n; j++) { const u = j / n, x = x0 + u * (x1 - x0), y = yc - amp * fn(u - tau * pasoU); j ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
      g.strokeStyle = rgba(color, 0.16 * a); g.lineWidth = Math.max(4, ancho * 3.6 * v.K); g.stroke();   // halo de la traza, como en un osciloscopio
      g.strokeStyle = rgba(color, a); g.lineWidth = Math.max(1.4, ancho * v.K); g.stroke();
    }
    const ejeFila = (yc, a = 1) => { g.strokeStyle = rgba(c.rotulo, 0.25 * a); g.lineWidth = 1; g.beginPath(); g.moveTo(X(3.5), Y(yc)); g.lineTo(X(15.3), Y(yc)); g.stroke(); };
    const fila = (yc, a = 1) => { v.panel(0.4, yc - 1.02, 15.2, 2.04, 0.5 * a, true); ejeFila(yc, a); };

    function torre(x, suelo, alto, color, a = 1) {
      g.strokeStyle = rgba(color, a); g.lineWidth = Math.max(1.8, 0.05 * v.K);
      g.beginPath(); g.moveTo(X(x - 0.22), Y(suelo)); g.lineTo(X(x), Y(suelo - alto)); g.lineTo(X(x + 0.22), Y(suelo)); g.stroke();
      for (let k = 1; k < 5; k++) { const yy = suelo - (alto * k) / 5, e = 0.22 * (1 - k / 5); g.beginPath(); g.moveTo(X(x - e), Y(yy)); g.lineTo(X(x + e), Y(yy)); g.stroke(); }
    }

    if (paso === 0) {
      const suelo = 7.0;
      v.degradado(-1, suelo, M(c.sala, c.am, 0.32), M(c.sala, c.audio, 0.28)); v.brillo(12.5, suelo - 0.2, 6, c.audio, 0.3);
      v.colinas(suelo - 0.4, 1.3, suelo, M(c.suelo, c.sala, 0.6), 4); v.colinas(suelo - 0.05, 0.7, suelo, M(c.suelo, c.sala, 0.3), 8);
      v.degradado(suelo, 10, M(c.suelo, c.sala, 0.1), M(c.suelo, '#000000', 0.35));
      const antenas = [{ x: 2.0, col: c.am, rot: 'A · 855 kHz', fase: 0 }, { x: 5.0, col: c.audio, rot: 'B · 1000 kHz', fase: 0.3 }, { x: 8.0, col: c.fm, rot: 'C · FM 98,5 MHz', fase: 0.6 }];
      const sale = suave(tramo(t, 0.02, 0.2));
      for (const a of antenas) {
        for (let k = 0; k < 4; k++) {
          const s = ((quieto ? 0.1 : r * 0.12) + a.fase + k / 4) % 1, rad = 0.4 + s * 9;
          g.strokeStyle = rgba(a.col, 0.8 * (1 - s) * sale); g.lineWidth = Math.max(1.5, 0.045 * v.K);
          g.beginPath(); g.arc(X(a.x), Y(suelo - 1.9), rad * v.K, -Math.PI * 0.42, Math.PI * 0.2); g.stroke();
        }
        torre(a.x, suelo, 1.9, c.torre);
        v.brillo(a.x, suelo - 1.95, 0.7, a.col, 0.5 * sale); punto(a.x, suelo - 1.95, 0.08, a.col);
        rotulo(a.rot, a.x, suelo + 0.55, { al: 'center', tam: 11.5, peso: 700, color: a.col, escribe: tramo(t, 0.2 + a.fase * 0.3, 0.5 + a.fase * 0.3) });
      }
      const rx = 13.4, ry = 6.6;
      g.strokeStyle = c.rotulo; g.lineWidth = Math.max(1.6, 0.04 * v.K); g.beginPath(); g.moveTo(X(rx + 0.9), Y(ry - 0.6)); g.lineTo(X(rx + 1.2), Y(ry - 2.2)); g.stroke();
      punto(rx + 1.2, ry - 2.2, 0.07, c.rotulo);
      g.fillStyle = c.radio; g.beginPath(); g.roundRect(X(rx - 1.5), Y(ry - 0.6), 3 * v.K, 1.7 * v.K, 0.15 * v.K); g.fill();
      g.strokeStyle = c.rotulo; g.lineWidth = Math.max(1.4, 0.03 * v.K); g.stroke();
      g.fillStyle = rgba(c.sala, 0.8); g.beginPath(); g.arc(X(rx - 0.75), Y(ry + 0.25), 0.5 * v.K, 0, 2 * Math.PI); g.fill();
      for (let k = -1; k <= 1; k++) { g.strokeStyle = rgba(c.rotulo, 0.4); g.beginPath(); g.moveTo(X(rx - 1.1), Y(ry + 0.25 + k * 0.2)); g.lineTo(X(rx - 0.4), Y(ry + 0.25 + k * 0.2)); g.stroke(); }
      g.fillStyle = rgba(c.sala, 0.9); g.fillRect(X(rx + 0.0), Y(ry - 0.25), 1.3 * v.K, 0.3 * v.K);
      const aguja = 0.15 + 0.7 * suave(tramo(t, 0.5, 0.9)); g.strokeStyle = c.resalta; g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath(); g.moveTo(X(rx + aguja * 1.3), Y(ry - 0.3)); g.lineTo(X(rx + aguja * 1.3), Y(ry + 0.1)); g.stroke();
      rotulo('dein Radio', rx, ry + 1.65, { al: 'center', tam: 12, peso: 700, escribe: tramo(t, 0.4, 0.7) });
      rotulo('empfängt alle drei … und wählt einen aus', 8, 1.2, { al: 'center', tam: 13, peso: 700, escribe: tramo(t, 0.55, 0.95) });
    }

    if (paso === 1) {
      const a = suave(tramo(t, 0.03, 0.3));
      for (const [x0, ancho, titulo, col, ciclos, lam, ant] of [[0.5, 7.3, 'Ton: 1 kHz', c.audio, 1.2, 'λ = 300 km', '75-km-Antenne'], [8.2, 7.3, 'Träger: 1 MHz', c.am, 26, 'λ = 300 m', '75-m-Antenne']]) {
        v.panel(x0, 0.5, ancho, 8.0, 0.75, true);
        rotulo(titulo, x0 + ancho / 2, 1.1, { al: 'center', tam: 14, peso: 700, color: col, escribe: tramo(t, 0.1, 0.35) });
        const yc = 2.9, ini = x0 + 0.5, fin = x0 + ancho - 0.5;
        g.strokeStyle = rgba(col, a); g.lineWidth = Math.max(1.6, 0.05 * v.K); g.beginPath();
        for (let j = 0; j <= 300; j++) { const u = j / 300, y = yc - 0.55 * Math.sin(2 * Math.PI * ciclos * u - (quieto ? 0.5 : r * (ciclos > 5 ? 3 : 1.2))); j ? g.lineTo(X(ini + u * (fin - ini)), Y(y)) : g.moveTo(X(ini), Y(y)); }
        g.stroke();
        rotulo(lam, x0 + ancho / 2, 3.85, { al: 'center', tam: 13, peso: 700, escribe: tramo(t, 0.3, 0.55) });
        const base = 8.0, cx = x0 + ancho / 2, alto = ciclos > 5 ? 2.0 : 2.7;
        torre(cx, base, alto, c.torre, a);
        if (ciclos <= 5) {
          g.strokeStyle = rgba(c.resalta, a); g.lineWidth = Math.max(2, 0.06 * v.K); g.setLineDash([6, 5]); g.beginPath(); g.moveTo(X(cx - 0.4), Y(base - alto - 0.05)); g.lineTo(X(cx + 0.4), Y(base - alto - 0.05)); g.stroke(); g.setLineDash([]);
          v.flecha(cx, base - alto - 0.2, cx, base - alto - 0.9, c.resalta, a, 0.04);
        }
        rotulo(ant, cx + 0.6, ciclos > 5 ? 7.0 : 6.7, { tam: 12.5, peso: 700, color: ciclos > 5 ? c.fm : c.resalta, escribe: tramo(t, 0.5, 0.8) });
      }
      rotulo('imposible', 3.5, 4.55, { al: 'right', tam: 12, color: c.resalta, peso: 700, escribe: tramo(t, 0.6, 0.85) });
      rotulo('es geht doch', 11.0, 6.2, { al: 'right', tam: 12, color: c.fm, peso: 700, escribe: tramo(t, 0.7, 0.95) });
    }

    if (paso === 2) {
      const filas = [{ y: 2.1, fn: audio, col: c.audio, rot: 'sonido m(t)' }, { y: 4.6, fn: portadora, col: c.portadora, rot: 'portadora' }, { y: 7.1, fn: am, col: c.am, rot: 'AM' }];
      filas.forEach((f, k) => {
        const a = suave(tramo(t, 0.04 + k * 0.22, 0.2 + k * 0.22));
        fila(f.y, a); traza(f.fn, f.y, 0.78, f.col, { a, ancho: k === 1 ? 0.025 : 0.05, pasoU: 1 });
        rotulo(f.rot, 0.8, f.y, { tam: 13, peso: 700, color: f.col, fondo: false, escribe: tramo(t, 0.1 + k * 0.22, 0.3 + k * 0.22) });
      });
      const aE = suave(tramo(t, 0.5, 0.75)); g.setLineDash([7, 6]);
      traza(envolvente, 7.1, 0.78, c.resalta, { a: aE, ancho: 0.03, pasoU: 1 }); traza((u) => -envolvente(u), 7.1, 0.78, c.resalta, { a: aE, ancho: 0.03, pasoU: 1 }); g.setLineDash([]);
      rotulo('die Hüllkurve kopiert den Schall', 15.0, 8.35, { al: 'right', tam: 12, color: c.resalta, peso: 700, fondo: false, escribe: tramo(t, 0.7, 0.95) });
      rotulo('nicht maßstabsgetreu: der echte Träger hat 1000 Schwingungen pro ms', 0.8, 8.35, { tam: 10.5, fondo: false, escribe: tramo(t, 0.2, 0.4) });
    }

    if (paso === 3) {
      const filas = [{ y: 2.1, fn: audio, col: c.audio, rot: 'sonido m(t)' }, { y: 4.6, fn: fm, col: c.fm, rot: 'FM' }, { y: 7.1, fn: null, col: c.ruido, rot: 'mit Rauschen' }];
      const ruido = (u) => { let s = 0; for (const [p, q] of [[0.17, 0.55], [0.42, 0.8], [0.66, 0.5], [0.87, 0.7]]) s += q * Math.exp(-(((u - p) * 90) ** 2)); return s; };
      filas.forEach((f, k) => {
        const a = suave(tramo(t, 0.04 + k * 0.22, 0.2 + k * 0.22));
        fila(f.y, a);
        if (f.fn) traza(f.fn, f.y, 0.78, f.col, { a, ancho: k === 0 ? 0.05 : 0.035, pasoU: 1 });
        else {
          g.strokeStyle = rgba(c.fm, a); g.lineWidth = Math.max(1.4, 0.035 * v.K); g.beginPath();
          for (let j = 0; j <= 520; j++) { const u = j / 520, x = 3.5 + u * 11.8, y = f.y - 0.78 * fm(u - tau) * (1 + ruido(u - tau) * 0.9); j ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
          g.stroke();
          g.setLineDash([6, 5]); g.strokeStyle = rgba(c.ruido, a * 0.9); g.lineWidth = Math.max(1.2, 0.025 * v.K);
          for (const s of [1, -1]) { g.beginPath(); g.moveTo(X(3.5), Y(f.y - s * 0.78)); g.lineTo(X(15.3), Y(f.y - s * 0.78)); g.stroke(); } g.setLineDash([]);
        }
        rotulo(f.rot, 0.8, f.y, { tam: 13, peso: 700, color: f.col, fondo: false, escribe: tramo(t, 0.1 + k * 0.22, 0.3 + k * 0.22) });
      });
      rotulo('das Rauschen bläht die Amplitude auf …', 15.1, 5.75, { al: 'right', tam: 12, color: c.ruido, peso: 700, fondo: false, escribe: tramo(t, 0.55, 0.8) });
      rotulo('… und der Begrenzer des Empfängers kappt sie: der Schall bleibt in der Frequenz', 15.1, 8.35, { al: 'right', tam: 12, color: c.fm, peso: 700, fondo: false, escribe: tramo(t, 0.75, 1) });
    }

    if (paso === 4) {
      const Cpf = prueba.C, f0k = f0De(Cpf), Qk = Qde(f0k), e = cercana(f0k);
      const a = suave(tramo(t, 0.03, 0.3));
      const x0 = 0.9, x1 = 5.6, y0 = 1.9, y1 = 5.4;
      v.panel(0.4, 0.5, 5.8, 6.5, 0.7, true);
      g.strokeStyle = rgba(c.rotulo, a); g.lineWidth = Math.max(1.8, 0.045 * v.K); g.lineJoin = 'round';
      const lin = (xa, ya, xb, yb) => { g.beginPath(); g.moveTo(X(xa), Y(ya)); g.lineTo(X(xb), Y(yb)); g.stroke(); };
      lin(x0, y0, 1.7, y0); lin(4.3, y0, x1, y0); lin(x1, y0, x1, 3.0); lin(x1, 4.0, x1, y1); lin(x1, y1, x0, y1); lin(x0, y1, x0, 4.4); lin(x0, 3.0, x0, y0);
      g.beginPath(); for (let k = 0; k < 4; k++) g.arc(X(2.0 + k * 0.6), Y(y0), 0.3 * v.K, Math.PI, 0); g.stroke();
      lin(x1 - 0.5, 3.0, x1 + 0.5, 3.0); lin(x1 - 0.5, 4.0, x1 + 0.5, 4.0);
      v.flecha(x1 - 0.8, 4.35, x1 + 0.7, 2.65, c.resalta, a, 0.035);
      g.fillStyle = rgba(c.sala, 0.9); g.fillRect(X(2.4), Y(y1 - 0.2), 1.6 * v.K, 0.4 * v.K); g.strokeRect(X(2.4), Y(y1 - 0.2), 1.6 * v.K, 0.4 * v.K);
      g.fillStyle = rgba(c.sala, 0.9); g.beginPath(); g.arc(X(x0), Y(3.7), 0.4 * v.K, 0, 2 * Math.PI); g.fill(); g.stroke();
      g.beginPath(); for (let k = 0; k <= 20; k++) { const xx = x0 - 0.22 + 0.44 * (k / 20); k ? g.lineTo(X(xx), Y(3.7 - 0.12 * Math.sin(k / 20 * 2 * Math.PI))) : g.moveTo(X(xx), Y(3.7)); } g.stroke();
      rotulo('antena', x0 + 0.3, 2.65, { tam: 11, fondo: false, escribe: tramo(t, 0.3, 0.5) });
      rotulo(`L = ${n(L * 1e6)} µH`, 3.15, y0 - 0.65, { al: 'center', tam: 11.5, peso: 700, fondo: false, escribe: tramo(t, 0.35, 0.55) });
      rotulo(`C = ${Cpf} pF`, x1 - 0.75, 3.5, { al: 'right', tam: 11.5, peso: 700, color: c.resalta, fondo: false });
      rotulo('R = 10 Ω', 3.2, y1 + 0.55, { al: 'center', tam: 11.5, peso: 700, fondo: false, escribe: tramo(t, 0.45, 0.65) });
      rotulo('der Ausgang wird an R gemessen', 3.2, 6.35, { al: 'center', tam: 11, fondo: false, escribe: tramo(t, 0.55, 0.75) });
      const gx0 = 7.2, gx1 = 15.3, gy0 = 3.6, gy1 = 0.9, fa = 500, fb = 1700;
      const px = (f) => gx0 + ((f - fa) / (fb - fa)) * (gx1 - gx0), py = (q) => gy0 + (gy1 - gy0) * q;
      v.panel(6.6, 0.4, 9.2, 4.6, 0.8, true);
      rotulo('das ganze Band', 6.9, 0.8, { tam: 12, peso: 700, fondo: false });
      g.strokeStyle = rgba(c.rotulo, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(X(gx0), Y(gy1 - 0.1)); g.lineTo(X(gx0), Y(gy0)); g.lineTo(X(gx1), Y(gy0)); g.stroke();
      for (const e2 of ESTACIONES) {
        const sono = e && e.n === e2.n;
        g.strokeStyle = rgba(sono ? c.resalta : c.portadora, sono ? 1 : 0.6); g.lineWidth = Math.max(1.4, 0.03 * v.K); g.setLineDash(sono ? [] : [4, 4]); g.beginPath(); g.moveTo(X(px(e2.f)), Y(gy0)); g.lineTo(X(px(e2.f)), Y(gy1 - 0.05)); g.stroke(); g.setLineDash([]);
        rotulo(e2.n, px(e2.f), gy0 + 0.25, { al: 'center', tam: 11.5, peso: 700, color: sono ? c.resalta : c.rotulo, fondo: false });
      }
      g.strokeStyle = c.am; g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath();
      for (let f = fa; f <= fb; f += 0.5) { const q = gananciaDe(f, f0k); f > fa ? g.lineTo(X(px(f)), Y(py(q))) : g.moveTo(X(px(f)), Y(py(q))); }
      g.stroke(); punto(px(f0k), py(1), 0.1, c.resalta);
      rotulo('500 kHz', gx0, gy0 + 0.25, { tam: 10, fondo: false, al: 'left' }); rotulo('1700 kHz', gx1, gy0 + 0.25, { tam: 10, fondo: false, al: 'right' });
      const zx0 = 7.2, zx1 = 15.3, zy0 = 7.5, zy1 = 5.6, zq = (f) => zx0 + ((f - f0k + 25) / 50) * (zx1 - zx0), zy = (q) => zy0 + (zy1 - zy0) * q;
      v.panel(6.6, 5.2, 9.2, 3.7, 0.8, true);
      rotulo(`vergrößert: ${entero(f0k)} kHz ± 25 kHz`, 6.9, 5.55, { tam: 12, peso: 700, fondo: false });
      g.strokeStyle = rgba(c.rotulo, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(X(zx0), Y(zy1 - 0.1)); g.lineTo(X(zx0), Y(zy0)); g.lineTo(X(zx1), Y(zy0)); g.stroke();
      for (const s of [-1, 1]) { const q = gananciaDe(f0k + 9 * s, f0k); g.strokeStyle = rgba(c.portadora, 0.8); g.setLineDash([4, 4]); g.lineWidth = Math.max(1.2, 0.03 * v.K); g.beginPath(); g.moveTo(X(zq(f0k + 9 * s)), Y(zy0)); g.lineTo(X(zq(f0k + 9 * s)), Y(zy(q))); g.stroke(); g.setLineDash([]); punto(zq(f0k + 9 * s), zy(q), 0.08, c.ruido); }
      g.strokeStyle = c.am; g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath();
      for (let f = f0k - 25; f <= f0k + 25; f += 0.2) { const q = gananciaDe(f, f0k); f > f0k - 25 ? g.lineTo(X(zq(f)), Y(zy(q))) : g.moveTo(X(zq(f)), Y(zy(q))); }
      g.stroke();
      rotulo(`Nachbar bei 9 kHz: ${n(dB(gananciaDe(f0k + 9, f0k))).replace('-', '−')} dB`, 15.5, zy(gananciaDe(f0k + 9, f0k)) - 0.75, { al: 'right', tam: 11, color: c.ruido, peso: 700, fondo: false });
      rotulo(`Q = ${entero(Qk)} · Δf = ${n(f0k / Qk)} kHz`, 15.1, 8.55, { al: 'right', tam: 11.5, peso: 700, fondo: false });
    }

    if (paso === 5) {
      const filas = [{ y: 2.1, fn: am, col: c.am, rot: 'sintonizada' }, { y: 4.6, fn: detectada, col: c.audio, rot: 'nach der Diode' }, { y: 7.1, fn: audio, col: c.fm, rot: 'nach dem Filter' }];
      filas.forEach((f, k) => {
        const a = suave(tramo(t, 0.04 + k * 0.22, 0.2 + k * 0.22));
        fila(f.y, a);
        if (k === 1) {
          g.strokeStyle = rgba(c.audio, a); g.lineWidth = Math.max(1.3, 0.03 * v.K); g.beginPath();
          for (let j = 0; j <= 520; j++) { const u = j / 520, y = f.y - 0.78 * detectada(u - tau); j ? g.lineTo(X(3.5 + u * 11.8), Y(y)) : g.moveTo(X(3.5), Y(y)); } g.stroke();
          g.setLineDash([7, 6]); traza((u) => envolvente(u), f.y, 0.78, c.resalta, { a: a * suave(tramo(t, 0.45, 0.7)), ancho: 0.03, pasoU: 1 }); g.setLineDash([]);
        } else if (k === 2) traza(audio, f.y, 0.78, f.col, { a, ancho: 0.06, pasoU: 1 });
        else traza(f.fn, f.y, 0.78, f.col, { a, ancho: 0.035, pasoU: 1 });
        rotulo(f.rot, 0.8, f.y, { tam: 12.5, peso: 700, color: f.col, fondo: false, escribe: tramo(t, 0.1 + k * 0.22, 0.3 + k * 0.22) });
      });
      rotulo('Diode: nur das Positive passiert', 15.1, 3.55, { al: 'right', tam: 12, fondo: false, escribe: tramo(t, 0.4, 0.65) });
      rotulo('RC = 22 µs: folgt der Hüllkurve, nicht dem Träger', 15.1, 6.05, { al: 'right', tam: 12, fondo: false, escribe: tramo(t, 0.65, 0.95) });
      rotulo('→ zum Lautsprecher: das ist der Schall', 15.1, 8.35, { al: 'right', tam: 12.5, peso: 700, color: c.fm, fondo: false, escribe: tramo(t, 0.8, 1) });
    }
  }

  const COLORES = ['sala', 'suelo', 'torre', 'am', 'fm', 'audio', 'portadora', 'ruido', 'radio', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnBode, f0De, Qde, gananciaDe, cercana };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: RadioAmFm.pasos, dibuja: RadioAmFm.dibuja, colores: RadioAmFm.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); RadioAmFm.abrirEnBode(e.currentTarget.getAttribute('href')); });
}

