const Auroras = (() => {
  const ME = 9.1093837e-31, E0 = 1.602176634e-19, MP = 1.67262192e-27, HC = 1239.84198, G = Math.PI / 180;     // kg, C, kg, eV·nm
  const sen = (a) => Math.sin(a * G), cos = (a) => Math.cos(a * G), deg = (x) => x / G;
  const EK = 5000, B = 5e-5, TH = 30;                                                       // eV, T (50 µT) y ángulo entre v y B
  const vel = (E) => Math.sqrt((2 * E * E0) / ME);                                          // m/s para una energía en eV
  const periodo = 2 * Math.PI * ME / (E0 * B);                                              // T = 2πm/|q|B
  const radio = (E, th = TH) => (ME * vel(E) * sen(th)) / (E0 * B);                         // r = m v⊥ / |q|B
  const paso = (E, th = TH) => vel(E) * cos(th) * periodo;                                  // p = v∥ T
  const B0 = 31.2e-6, L = 6, RT = 6371, H = 100;                                            // dipolo: campo en el ecuador de la superficie, capa L, radio de la Tierra y altura (km)
  const Beq = B0 / (L * L * L), Balt = 2 * B0 * Math.pow(RT / (RT + H), 3);                 // campo en el ecuador de la capa y a 100 km sobre el polo
  const perdida = deg(Math.asin(Math.sqrt(Beq / Balt)));                                    // ángulo de pérdida en el ecuador
  const Ep = (0.5 * MP * 4e5 * 4e5) / E0;                                                   // energía de un protón del viento solar de 400 km/s, en eV
  const fot = (nm) => HC / nm;                                                              // energía del fotón en eV
  const datos = { EK, B, TH, v: vel(EK), r: radio(EK), r90: radio(EK, 90), T: periodo, f: 1 / periodo, p: paso(EK), vpar: vel(EK) * cos(TH), vper: vel(EK) * sen(TH),
    Beq, Balt, perdida, Ep, fVerde: fot(557.7), fRojo: fot(630.0), fAzul: fot(427.8), ion: EK / 35, espejo30: B / (sen(TH) * sen(TH)) };
  const f0 = (x) => String(Math.round(x)), f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ','), f3 = (x) => x.toFixed(3).replace('.', ',');
  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const exp = (x, d = 2) => { const e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); return `${m.toFixed(d).replace('.', ',')}·10${String(e).split('').map((k) => SUP[k]).join('')}`; };
  const expM = (x, d = 2) => { const e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e); return `${m.toFixed(d).replace('.', ',')}·10^{${String(e).replace('-', '−')}}`; };
  const { v, r, p, T } = datos;

  const pasos = [
    { titulo: 'Die Sonne schleudert Teilchen und die Erde lenkt sie ab', corto: 'Sonne', dato: { valor: '≈ 400 km/s', texto: `ist die Geschwindigkeit des Sonnenwinds: Protonen und Elektronen von etwa ${f1(Ep / 1000)} keV.` }, texto: `Die Sonne schleudert unaufhörlich einen Strom geladener Teilchen aus, vor allem Protonen und Elektronen: den Sonnenwind, mit etwa 400 km/s. Bei der Erde treffen sie auf ihr Magnetfeld, das wie ein Schild wirkt: Fast alle werden abgelenkt und ziehen vorbei.\n\nEin kleiner Teil jedoch wird in den Feldlinien gefangen, die an einem Pol austreten und am anderen eintreten, und in Richtung des Schweifs der Magnetosphäre auf einige keV beschleunigt. Diese Teilchen laufen entlang der Linien zu den Polarzonen hinunter, weshalb das Polarlicht in einem Ring um jeden Pol zu sehen ist und nicht am Äquator.`, dura: 12000 },
    { titulo: 'Eine Ladung in einem Magnetfeld kreist', corto: 'Kreisen', dato: { valor: `r = ${f2(datos.r90)} m`, texto: 'ist der Gyrationsradius eines 5-keV-Elektrons bei 90° zu einem Feld von 50 µT.' }, texto: `Eine Ladung, die sich in einem Magnetfeld bewegt, erfährt die Lorentzkraft $F = |q| v B "sin" θ$, immer senkrecht zu ihrer Geschwindigkeit. Sie bremst oder beschleunigt sie nicht, sondern lenkt sie nur ab: Der Betrag der Geschwindigkeit ist konstant und die Bahn ein Kreis.\n\nDie Kraft wirkt als Zentripetalkraft: $|q| v B = m v^2 / r$, also $r = m v / (|q| B)$. Ein 5-keV-Elektron hat $v = ${expM(v)} "m/s"$; in einem Feld von $B = 50 "µT"$ ergibt sich $r = ${f2(datos.r90)} "m"$, mit einer Periode $T = 2π m / (|q| B) = ${f3(T * 1e6)} "µs"$, also $f = ${f2(datos.f / 1e6)} "MHz"$. Es kreist mehr als eine Million Mal pro Sekunde.`, dura: 11000 },
    { titulo: 'Wenn es zusätzlich vorankommt, zeichnet es eine Schraubenlinie', corto: 'Schraubenlinie', dato: { valor: `p = ${f1(p)} m`, texto: `ist die Ganghöhe der Schraubenlinie: wie weit es pro Umlauf entlang des Feldes vorankommt.` }, texto: `Der Teil der Geschwindigkeit entlang des Feldes, $v_∥ = v cos θ$, erfährt keine Kraft und ändert sich nicht. Der senkrechte Teil, $v_⊥ = v "sin" θ$, dreht sich weiter. Die Summe beider ist eine Schraubenlinie, die sich um die Feldlinie windet.\n\nFür $θ = 30°$ kommt das Elektron mit $v_∥ = ${expM(datos.vpar)} "m/s"$ voran und kreist mit $v_⊥ = ${expM(datos.vper)} "m/s"$: Der Radius ist $r = ${f2(r)} "m"$ und die Ganghöhe, das Vorankommen in einem Umlauf, $p = v_∥ T = ${f1(p)} "m"$. Das Elektron lässt sich nicht von der Feldlinie lösen: Es folgt ihr wie eine Perle auf einem Faden.`, dura: 12000 },
    { titulo: 'Sie folgen dem Feld zum Pol… wenn sie nicht reflektiert werden', corto: 'Spiegel', dato: { valor: `${f1(datos.perdida)}°`, texto: 'ist der maximale Winkel (am Äquator), damit ein Elektron die Atmosphäre erreicht.' }, texto: `Nahe den Polen rücken die Feldlinien zusammen und das Feld wächst. Bei wachsendem Feld zieht sich die Schraubenlinie zusammen, und der Teil der Geschwindigkeit entlang des Feldes wandelt sich nach und nach in Kreisbewegung um, weil $"sin"^2 α / B$ konstant bleibt ($α$ ist der Winkel zwischen $v$ und $B$).\n\nErreicht das Feld $B_m = B_{ec} / "sin"^2 α$, bevor es auf die Luft trifft, bleibt das Elektron stehen und kehrt um: Das ist der magnetische Spiegel, und es pendelt von einem Pol zum anderen. Nur die mit sehr kleinem $α$ kommen durch: Mit $B_{ec} = ${f3(Beq * 1e6)} "µT"$ am Äquator der Schale $L = 6$ und $B = ${f1(Balt * 1e6)} "µT"$ in 100 km Höhe ergibt $"sin"^2 α = B_{ec}/B$ den Wert $α < ${f1(datos.perdida)}°$ (der Verlustkegel). Diese entzünden das Polarlicht.`, dura: 13000 },
    { titulo: 'Sie stoßen mit der Luft zusammen und leuchten', corto: 'Leuchten', dato: { valor: '557,7 nm', texto: `ist das grüne Licht des Sauerstoffs in etwa 100–150 km Höhe: Photonen von ${f2(datos.fVerde)} eV.` }, texto: `Die Elektronen von einigen keV dringen in die obere Atmosphäre ein und stoßen mit den Atomen und Molekülen der Luft zusammen. Ein 5-keV-Elektron gibt seine Energie in vielen Stößen ab, mit etwa 35 eV pro ionisiertem Atom, also ${f0(datos.ion)} Stößen. Bei jedem wird das Atom angeregt und sendet beim Zurückfallen in den Normalzustand ein Photon aus.\n\nDie Farbe hängt vom Atom und von der Höhe ab. Sauerstoff liefert das Grün bei ${f1(557.7)} nm (${f2(datos.fVerde)} eV) zwischen 100 und 150 km und das Rot bei 630 nm (${f2(datos.fRojo)} eV) oberhalb von 200 km; Stickstoff liefert die Blau- und Violetttöne am unteren Rand. Energiereichere Elektronen dringen tiefer ein. Da sie der Feldlinie folgen, bildet das Licht senkrechte Vorhänge.`, dura: 13000 },
    { titulo: 'Die Rechnung mit der Lorentzkraft', corto: 'Rechnung', dato: { valor: `${f2(r)} m · ${f2(datos.f / 1e6)} MHz`, texto: 'sind der Radius und die Umlauffrequenz eines 5-keV-Elektrons bei 30° zum Feld.' }, texto: `Eine Ladung, die in ein Feld $B$ eintritt, kreist mit $r = m v "sin" θ / (|q| B)$ und $f = |q| B / (2π m)$: Das hängt nicht von der Energie ab, und alle Elektronen kreisen gleichzeitig, mit ${f2(datos.f / 1e6)} MHz, wenn auch mit verschiedenen Radien. Der Radius wächst dagegen mit $v$: Bei einem 5-keV-Elektron ergibt sich ${f2(r)} m.\n\nIst der Teil der Geschwindigkeit entlang des Feldes $v cos θ$, kommt es pro Umlauf um $p = v cos θ · T = ${f1(p)} "m"$ voran, und das Feld, das es abbremst, erreicht $B_m = B / "sin"^2 θ = ${f0(datos.espejo30 * 1e6)} "µT"$. Diese Rechnungen sind die aus Magnetische Kraft, in der Situation «Ladung im Feld».` },
  ];

  const ejercicio = () => ({ modo: 'carga', part: 'electron', q: '', m: '', uv: 'eV', v: String(EK), B: '5e-5', th: String(TH), sentidoB: 'entrante' });
  function abrirEnFuerza(destino) {
    try { localStorage.setItem('fuerza-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const prueba = { etiqueta: 'die Energie des Elektrons in keV', min: 0.5, max: 20, paso: 0.5, valor: 5, E: 5,
    muestra: (E) => `E = ${String(E).replace('.', ',')} keV → r = ${f2(radio(E * 1000))} m und Ganghöhe p = ${f1(paso(E * 1000))} m (die Frequenz ändert sich nicht: ${f2(datos.f / 1e6)} MHz)`,
    cambia: (E) => { prueba.E = E; } };
  pasos[2].prueba = prueba;
  const linea = (Ls, lam) => ({ x: Ls * Math.pow(cos(lam), 3), y: Ls * Math.pow(cos(lam), 2) * sen(lam) });
  const lamPolo = (Ls) => deg(Math.acos(Math.sqrt(1 / Ls)));
  const campoRel = (lam) => Math.sqrt(1 + 3 * sen(lam) * sen(lam)) / Math.pow(cos(lam), 6);        // B / B_ecuador
  const FASE = (() => { const t = [0]; for (let k = 1; k <= 180; k++) t.push(t[k - 1] + 0.5 * 0.55 * Math.sqrt(campoRel((k - 0.5) * 0.5))); return t; })();
  const fase = (lam) => { const a = Math.abs(lam) / 0.5, k = Math.min(179, Math.floor(a)); return Math.sign(lam) * (FASE[k] + (FASE[k + 1] - FASE[k]) * (a - k)); };
  
  function dibuja(g, { paso: ip, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c);
    const { X, Y, rotulo, punto, flecha } = v, foto = window.FenomenoFoto;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 40; k++) punto(0.3 + azar(k) * 15.4, 0.2 + azar(k + 90) * 5.5, 0.03 + 0.02 * azar(k + 7), c.rotulo, 0.18 + 0.2 * azar(k + 33));
    const lin = (pts, color, ancho = 0.05, a = 1, discont = false) => {
      g.strokeStyle = color; g.globalAlpha = a; g.lineWidth = Math.max(1.5, ancho * v.K); g.lineJoin = 'round'; g.lineCap = 'round'; g.setLineDash(discont ? [6, 5] : []);
      g.beginPath(); pts.forEach((q, k) => (k ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])))); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    };
    const tierra = (cx, cy, R) => {
      const gg = g.createRadialGradient(X(cx - R * 0.3), Y(cy - R * 0.3), 0, X(cx), Y(cy), R * v.K); gg.addColorStop(0, c['tierra-2']); gg.addColorStop(1, c.tierra);
      g.fillStyle = gg; g.beginPath(); g.arc(X(cx), Y(cy), R * v.K, 0, 2 * Math.PI); g.fill();
    };
    const campo = (cx, cy, R, Ls, lado, lam1, color, ancho = 0.04, a = 1) => {
      const pts = []; for (let k = -24; k <= 24; k++) { const lam = (k / 24) * lam1, q = linea(Ls, lam); pts.push([cx + lado * q.x * R, cy - q.y * R]); }
      lin(pts, color, ancho, a);
    };
    const electron = (x, y, r = 0.14, a = 1) => { punto(x, y, r, c.electron, a); v.signo(x, y, -1, c.cielo, a, 0.7); };
    const entrante = (x, y, a = 0.5) => { g.globalAlpha = a; g.strokeStyle = c.campo; g.lineWidth = Math.max(1, 0.025 * v.K); g.beginPath(); g.arc(X(x), Y(y), 0.12 * v.K, 0, 2 * Math.PI); g.moveTo(X(x) - 0.085 * v.K, Y(y) - 0.085 * v.K); g.lineTo(X(x) + 0.085 * v.K, Y(y) + 0.085 * v.K); g.moveTo(X(x) + 0.085 * v.K, Y(y) - 0.085 * v.K); g.lineTo(X(x) - 0.085 * v.K, Y(y) + 0.085 * v.K); g.stroke(); g.globalAlpha = 1; };

    function sol() {
      const cx = 11.6, cy = 4.5, R = 0.85;
      const gg = g.createRadialGradient(X(0), Y(cy), 0, X(0), Y(cy), 3.4 * v.K); gg.addColorStop(0, rgba(c.sol, 0.95)); gg.addColorStop(0.35, rgba(c.sol, 0.55)); gg.addColorStop(1, rgba(c.sol, 0));
      g.fillStyle = gg; g.fillRect(0, 0, X(4), h); punto(0, cy, 1.2, c.sol);
      const xc = cx + 1.4, ea = 5.2, eb = 4.0, fr = suave(tramo(t, 0.15, 0.4));
      if (fr > 0) { g.setLineDash([7, 6]); g.strokeStyle = c.campo; g.globalAlpha = 0.7 * fr; g.lineWidth = Math.max(1.5, 0.04 * v.K); g.beginPath(); g.ellipse(X(xc), Y(cy), ea * v.K, eb * v.K, 0, (100 * Math.PI) / 180, (260 * Math.PI) / 180); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
      [2.2, 3.2, 4.2].forEach((Ls, k) => [-1, 1].forEach((lado) => campo(cx, cy, R, Ls, lado, lamPolo(Ls), c.campo, 0.035, 0.75 * suave(tramo(t, 0.1 + 0.05 * k, 0.35 + 0.05 * k)))));
      tierra(cx, cy, R);
      const nv = suave(tramo(t, 0, 0.2));
      for (let k = 0; k < 46; k++) {
        const d = (azar(k + 5) - 0.5) * 8.4, s = (reloj * 0.16 + azar(k)) % 1, x = 1.5 + s * 14, xb = Math.abs(d) < eb ? xc - ea * Math.sqrt(1 - (d / eb) * (d / eb)) : 99;
        const y = cy + d + (Math.sign(d) || 1) * Math.max(0, x - xb) * 0.75, e = k % 2;
        if (y < 0.2 || y > 8.8) continue;
        punto(x, y, 0.07, e ? c.electron : c.sol, nv * 0.9);
      }
      const pol = suave(tramo(t, 0.45, 0.65));
      if (pol > 0) for (let k = 0; k < 4; k++) {
        const u = (reloj * 0.22 + k / 4) % 1, lam = u * lamPolo(4.2), q = linea(4.2, lam);
        electron(cx + q.x * R, cy - q.y * R, 0.1, pol);
      }
      rotulo('die Sonne', 1.6, 2.7, { tam: 13.5, peso: 600, escribe: tramo(t, 0, 0.12), fondo: false });
      rotulo('Sonnenwind: ≈ 400 km/s', 5.6, 1.1, { al: 'center', tam: 13, peso: 600, escribe: tramo(t, 0.05, 0.25) });
      rotulo('Grenze des Erdfeldes', 7.9, 8.15, { al: 'center', tam: 12, escribe: tramo(t, 0.3, 0.5) });
      rotulo('Feldlinien', cx + 3.6, 1.5, { al: 'center', tam: 12, escribe: tramo(t, 0.35, 0.5), fondo: false });
      rotulo('N', cx, cy - R - 0.4, { al: 'center', tam: 13, peso: 700, escribe: tramo(t, 0.5, 0.6), fondo: false });
      rotulo('sie laufen entlang der Linien zum Pol hinunter', cx - 1.0, 1.6, { al: 'center', tam: 12.5, peso: 600, color: c.electron, escribe: tramo(t, 0.6, 0.85) });
    }

    function giro() {
      const cx = 5.2, cy = 4.5, R = 2.3, ac = reloj * 1.1;
      for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) { const x = 0.8 + i * 1.12, y = 0.9 + j * 1.35; if (Math.hypot(x - cx, y - cy) > 0.5) entrante(x, y, 0.35 + 0.15 * suave(tramo(t, 0, 0.15))); }
      const a = ac, ex = cx + R * Math.cos(a), ey = cy + R * Math.sin(a);
      const pts = []; for (let k = 0; k <= 40; k++) { const b = a - (k / 40) * 2.4; pts.push([cx + R * Math.cos(b), cy + R * Math.sin(b)]); }
      lin(pts, c.electron, 0.06, 0.55);
      lin([[cx, cy], [ex, ey]], c.rotulo, 0.02, 0.5 * suave(tramo(t, 0.3, 0.45)), true);
      electron(ex, ey, 0.17);
      const fv = suave(tramo(t, 0.15, 0.35)), ff = suave(tramo(t, 0.35, 0.55));
      flecha(ex, ey, ex - 1.5 * Math.sin(a) * fv, ey + 1.5 * Math.cos(a) * fv, c.verde, fv, 0.05);        // v: tangente (el giro es horario en pantalla)
      flecha(ex, ey, ex - 1.4 * Math.cos(a) * ff, ey - 1.4 * Math.sin(a) * ff, c.resalta, ff, 0.05);      // F: hacia el centro
      punto(cx, cy, 0.07, c.rotulo, 0.6);
      rotulo('v', ex - 1.7 * Math.sin(a) - 0.1, ey + 1.7 * Math.cos(a), { al: 'center', tam: 14, peso: 700, color: c.verde, escribe: tramo(t, 0.2, 0.3), fondo: false });
      rotulo('F', ex - 1.65 * Math.cos(a), ey - 1.65 * Math.sin(a), { al: 'center', tam: 14, peso: 700, color: c.resalta, escribe: tramo(t, 0.4, 0.5), fondo: false });
      rotulo('B hineinzeigend (⊗)', 1.0, 8.35, { tam: 12.5, color: c.campo, peso: 600, escribe: tramo(t, 0.05, 0.2), fondo: false });
      rotulo(`r = ${f2(datos.r90)} m`, cx - 0.1, cy + 0.65, { al: 'center', tam: 13, peso: 700, color: c.rotulo, escribe: tramo(t, 0.55, 0.7), fondo: false });
      if (foto) return;
      v.panel(9.9, 1.0, 5.6, 6.3);
      rotulo('Lorentzkraft', 10.2, 1.55, { tam: 13, peso: 700, fondo: false, escribe: tramo(t, 0.3, 0.45) });
      rotulo('F = |q| v B  (⊥ a v)', 10.2, 2.35, { tam: 14, fondo: false, escribe: tramo(t, 0.4, 0.55) });
      rotulo('|q| v B = m v² / r', 10.2, 3.15, { tam: 14, fondo: false, escribe: tramo(t, 0.5, 0.65) });
      rotulo('r = m v / (|q| B)', 10.2, 3.95, { tam: 15, peso: 700, fondo: false, escribe: tramo(t, 0.6, 0.75) });
      rotulo(`v = ${exp(datos.v)} m/s`, 10.2, 4.8, { tam: 13, fondo: false, escribe: tramo(t, 0.7, 0.8) });
      rotulo(`r = ${f2(datos.r90)} m`, 10.2, 5.55, { tam: 15, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.75, 0.88) });
      rotulo(`T = ${f3(T * 1e6)} µs · f = ${f2(datos.f / 1e6)} MHz`, 10.2, 6.45, { tam: 13, fondo: false, escribe: tramo(t, 0.85, 1) });
    }

    function helice() {
      const E = prueba.E * 1000, esc = Math.sqrt(prueba.E / 5), Rh = 0.7 * esc, P = 1.55 * esc, alto = 6.2, vueltas = alto / P, hx = 4.6, yb = 7.6;
      for (let i = 0; i < 7; i++) { const x = 1.0 + i * 1.45; lin([[x, 8.2], [x, 1.1]], c.campo, 0.025, 0.4); flecha(x, 1.5, x, 1.05, c.campo, 0.55, 0.025); }
      const cab = Math.min(1, (reloj * 0.16) % 1.3), fin = 2 * Math.PI * vueltas * cab * suave(tramo(t, 0, 0.12) + 0.001);
      const pts = []; for (let k = 0; k <= Math.max(2, Math.round(fin / 0.12)); k++) { const ph = Math.min(fin, k * 0.12); pts.push([hx + Rh * Math.sin(ph), yb - (ph / (2 * Math.PI)) * P]); }
      lin(pts, c.electron, 0.05, 0.9);
      const q = pts[pts.length - 1]; electron(q[0], q[1], 0.16);
      const ox = 9.0, oy = 5.4, L = 3.0, vx = L * sen(TH), vy = L * cos(TH), s = suave(tramo(t, 0.3, 0.55));
      if (!foto) {
        v.panel(8.1, 0.9, 7.4, 7.0);
        flecha(ox, oy, ox, oy - vy * s, c.verde, s, 0.04); flecha(ox, oy - vy * s, ox + vx * s, oy - vy * s, c.campo, s, 0.04); flecha(ox, oy, ox + vx * s, oy - vy * s, c.electron, s, 0.055);
        rotulo('v∥ = v cos θ', ox - 0.15, oy - vy / 2, { al: 'right', tam: 12.5, peso: 600, color: c.verde, fondo: false, escribe: tramo(t, 0.45, 0.6) });
        rotulo('v⊥ = v sin θ', ox + vx / 2 + 0.25, oy - vy - 0.4, { al: 'center', tam: 12.5, peso: 600, color: c.campo, fondo: false, escribe: tramo(t, 0.5, 0.65) });
        rotulo('v', ox + vx / 2 + 0.3, oy - vy / 2 + 0.1, { tam: 14, peso: 700, color: c.electron, fondo: false, escribe: tramo(t, 0.4, 0.5) });
        rotulo('θ = 30°', ox + 0.95, oy - 0.45, { tam: 13, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.55, 0.7) });
        rotulo(`r = m v⊥ / (|q| B) = ${f2(radio(E))} m`, 8.4, 6.5, { tam: 13.5, fondo: false, escribe: tramo(t, 0.65, 0.8) });
        rotulo(`p = v∥ · T = ${f1(paso(E))} m`, 8.4, 7.2, { tam: 13.5, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.78, 0.92) });
      }
      rotulo('B', 1.0, 1.4, { tam: 14, peso: 700, color: c.campo, escribe: tramo(t, 0.05, 0.15), fondo: false });
      rotulo('Schraubenlinie (nicht maßstäblich)', hx, 8.45, { al: 'center', tam: 12, escribe: tramo(t, 0.7, 0.9), fondo: false });
    }

    function espejo() {
      const cx = 3.8, cy = 4.5, R = 1.45, Ls = 3, lam0 = lamPolo(Ls), rho0 = 0.5;
      [2.2, 3, 3.6].forEach((l, k) => campo(cx, cy, R, l, 1, lamPolo(l), c.campo, k === 1 ? 0.045 : 0.025, k === 1 ? 0.85 : 0.4));
      g.strokeStyle = rgba(c.verde, 0.45); g.lineWidth = Math.max(2, 0.08 * v.K); g.beginPath(); g.arc(X(cx), Y(cy), (R + 0.06) * v.K, 0, 2 * Math.PI); g.stroke();
      tierra(cx, cy, R);
      const pos = (lam, fase0) => {
        const q = linea(Ls, lam), q2 = linea(Ls, lam + 0.5), dx = q2.x - q.x, dy = q2.y - q.y, n = Math.hypot(dx, dy) || 1, rho = rho0 / Math.sqrt(campoRel(lam)), s = Math.sin(fase(lam) + fase0);
        return [cx + (q.x * R) + (-dy / n) * rho * s * 1.3, cy - (q.y * R) - (dx / n) * rho * s * 1.3];
      };
      const lamE = 40, lamA = lamE * Math.sin(reloj * 0.9), A = pos(lamA, 0);
      const cicl = (reloj * 0.17) % 1.25, u = Math.min(1, cicl), lamB = u * lam0, Bq = pos(lamB, 1.2);
      const ea = suave(tramo(t, 0.15, 0.3)), eb = suave(tramo(t, 0.4, 0.55));
      [-1, 1].forEach((sg) => { const q = linea(Ls, sg * lamE); punto(cx + q.x * R, cy - q.y * R, 0.1, c.resalta, ea); });
      electron(A[0], A[1], 0.14, ea);
      if (eb > 0) { electron(Bq[0], Bq[1], 0.14, eb * (u >= 1 ? 0 : 1)); }
      if (u >= 1 && eb > 0) { const f = tramo(cicl, 1, 1.25), q = linea(Ls, lam0); punto(cx + q.x * R, cy - q.y * R, 0.12 + 0.55 * f, c.verde, (1 - f) * 0.8 * eb); }
      rotulo('wird reflektiert (magnetischer Spiegel)', cx + 2.1, cy - 2.55, { al: 'center', tam: 12.5, peso: 600, color: c.resalta, escribe: tramo(t, 0.25, 0.4) });
      rotulo('gelangt in die Luft: Polarlicht', cx - 1.1, cy - R - 0.55, { al: 'center', tam: 12.5, peso: 600, color: c.verde, escribe: tramo(t, 0.55, 0.7) });
      rotulo('das Feld wächst → die Spirale zieht sich zusammen', cx + 2.7, cy + 3.25, { al: 'center', tam: 12, escribe: tramo(t, 0.35, 0.5), fondo: false });
      rotulo('nicht maßstäblich', 1.0, 8.5, { tam: 11.5, fondo: false });
      if (foto) return;
      v.panel(9.6, 1.0, 6.0, 6.4);
      rotulo('Magnetischer Spiegel', 9.9, 1.55, { tam: 13, peso: 700, fondo: false, escribe: tramo(t, 0.5, 0.6) });
      rotulo('sin²α / B = konstant', 9.9, 2.4, { tam: 14, fondo: false, escribe: tramo(t, 0.55, 0.65) });
      rotulo('wird reflektiert, wo B = B_ec / sin²α', 9.9, 3.2, { tam: 13.5, fondo: false, escribe: tramo(t, 0.62, 0.72) });
      rotulo(`B_ec = ${f3(Beq * 1e6)} µT  (L = 6)`, 9.9, 4.1, { tam: 13, fondo: false, escribe: tramo(t, 0.7, 0.8) });
      rotulo(`B in 100 km = ${f1(Balt * 1e6)} µT`, 9.9, 4.8, { tam: 13, fondo: false, escribe: tramo(t, 0.76, 0.86) });
      rotulo('sin²α = B_Äq / B_100 km', 9.9, 5.6, { tam: 14, fondo: false, escribe: tramo(t, 0.82, 0.92) });
      rotulo(`α < ${f1(datos.perdida)}°  erreichen die Luft`, 9.9, 6.45, { tam: 15, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.88, 1) });
    }

    function brillo() {
      const alt = (km) => 7.95 - km * 0.0225, nube = suave(tramo(t, 0, 0.3));
      const gc = g.createLinearGradient(0, Y(alt(280)), 0, Y(alt(85)));
      const parada = (km, col, a) => gc.addColorStop(Math.min(1, Math.max(0, (280 - km) / 195)), rgba(col, a));
      parada(280, c.rojo, 0); parada(230, c.rojo, 0.5); parada(200, c.rojo, 0.3); parada(175, c.verde, 0.1); parada(150, c.verde, 0.65); parada(115, c.verde, 0.95); parada(100, c.violeta, 0.7); parada(85, c.violeta, 0);
      for (let k = 0; k < 90; k++) {
        const x = 0.4 + k * 0.17, I = (0.55 + 0.45 * Math.sin(x * 1.3 + reloj * 0.9 + 1.7 * Math.sin(x * 0.45 + reloj * 0.3))) * (0.35 + 0.65 * Math.abs(Math.sin(x * 0.37 + 0.8)));
        g.globalAlpha = nube * Math.max(0, I) * (quieto ? 1 : 0.9); g.fillStyle = gc; g.fillRect(X(x), Y(alt(280)), 0.19 * v.K, (alt(85) - alt(280)) * v.K); g.globalAlpha = 1;
      }
      const parar = [215, 150, 125, 112, 105, 130, 175, 108, 118, 140, 110];
      for (let k = 0; k < parar.length; k++) {
        const x = 1.2 + k * 1.37, fin = alt(parar[k]), s = (reloj * 0.35 + azar(k)) % 1, y = 1.0 + s * (fin - 1.0);
        lin([[x, 1.0], [x, fin]], c.electron, 0.018, 0.4 * suave(tramo(t, 0.05, 0.3)), true);
        if (s < 0.97) electron(x, y, 0.1, suave(tramo(t, 0.05, 0.3)));
        else punto(x, fin, 0.22, c.sol, 0.8);
      }
      g.fillStyle = c.suelo; g.fillRect(0, Y(8.0), w, h);
      [100, 200, 300].forEach((km) => { lin([[0.4, alt(km)], [15.6, alt(km)]], c.rotulo, 0.012, 0.25, true); rotulo(`${km} km`, 0.5, alt(km) - 0.25, { tam: 11.5, fondo: false }); });
      rotulo('electrones', 15.4, 1.0, { al: 'right', tam: 13, peso: 600, color: c.electron, escribe: tramo(t, 0.05, 0.2) });
      rotulo(`rot · Sauerstoff · 630 nm · ${f2(datos.fRojo)} eV`, 15.5, alt(240), { al: 'right', tam: 13, peso: 700, color: c.rojo, escribe: tramo(t, 0.35, 0.55) });
      rotulo(`grün · Sauerstoff · 557,7 nm · ${f2(datos.fVerde)} eV`, 15.5, alt(140), { al: 'right', tam: 13, peso: 700, color: c.verde, escribe: tramo(t, 0.5, 0.7) });
      rotulo(`violett · Stickstoff · 427,8 nm · ${f2(datos.fAzul)} eV`, 15.5, alt(86), { al: 'right', tam: 13, peso: 700, color: c.violeta, escribe: tramo(t, 0.65, 0.85) });
      rotulo('mehr Energie → dringt tiefer ein', 2.7, 1.0, { tam: 12.5, escribe: tramo(t, 0.8, 1), fondo: false });
    }

    function cuentas() {
      v.panel(1.2, 0.7, 13.6, 7.6); const o = 1.7;
      rotulo('Ein 5-keV-Elektron in einem Feld von 50 µT, bei 30° zum Feld', o, 1.4, { tam: 14.5, peso: 700, fondo: false, escribe: tramo(t, 0, 0.12) });
      rotulo(`v = √(2E/m) = ${exp(datos.v)} m/s,  v⊥ = v sin θ = ${exp(datos.vper)} m/s`, o, 2.4, { tam: 14, fondo: false, escribe: tramo(t, 0.12, 0.3) });
      rotulo(`r = m v⊥ / (|q| B) = ${f2(r)} m`, o, 3.3, { tam: 15, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.3, 0.45) });
      rotulo(`T = 2πm / (|q| B) = ${f3(T * 1e6)} µs,  f = ${f2(datos.f / 1e6)} MHz`, o, 4.2, { tam: 14, fondo: false, escribe: tramo(t, 0.45, 0.58) });
      rotulo(`p = v∥ T = ${exp(datos.vpar)} · ${exp(T)} = ${f1(p)} m`, o, 5.1, { tam: 14, fondo: false, escribe: tramo(t, 0.58, 0.7) });
      rotulo(`Verlustkegel: sin²α = ${f3(Beq * 1e6)} / ${f1(Balt * 1e6)}  →  α < ${f1(datos.perdida)}°`, o, 6.0, { tam: 14, fondo: false, escribe: tramo(t, 0.7, 0.82) });
      rotulo(`grünes Licht: E = hc/λ = 1240 / 557,7 = ${f2(datos.fVerde)} eV  (≈ ${f0(datos.ion)} Stöße von 35 eV)`, o, 6.9, { tam: 14, peso: 700, color: c.verde, fondo: false, escribe: tramo(t, 0.82, 1) });
    }

    if (ip === 0) sol();
    if (ip === 1) giro();
    if (ip === 2) helice();
    if (ip === 3) espejo();
    if (ip === 4) brillo();
    if (ip === 5 && !foto) cuentas();
  }

  const COLORES = ['cielo', 'cielo-alto', 'sol', 'tierra', 'tierra-2', 'campo', 'electron', 'verde', 'rojo', 'violeta', 'suelo', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnFuerza, radio, paso, vel, linea, lamPolo };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: Auroras.pasos, dibuja: Auroras.dibuja, colores: Auroras.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); Auroras.abrirEnFuerza(e.currentTarget.getAttribute('href')); });
}

