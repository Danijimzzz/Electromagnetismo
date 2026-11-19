const FibraOptica = (() => {
  const N1 = 1.48, N2 = 1.46, LAMBDA = 1550, ATEN = 0.2, P0 = 1, G = Math.PI / 180;     // núcleo, cubierta, nm, dB/km y mW
  const deg = (x) => x / G, sen = (a) => Math.sin(a * G), cos = (a) => Math.cos(a * G), tan = (a) => Math.tan(a * G);
  const thc = deg(Math.asin(N2 / N1));                                                 // ángulo crítico núcleo → cubierta
  const AN = Math.sqrt(N1 * N1 - N2 * N2), aMax = deg(Math.asin(AN));                  // apertura numérica y semiángulo del cono en el aire
  const betaMax = deg(Math.asin(sen(aMax) / N1));                                       // ángulo con el eje dentro de la fibra = 90° − θc
  const refl = (th, n1 = N1, n2 = N2) => {
    const s = (n1 * sen(th)) / n2; if (s >= 1) return 1;
    const ci = cos(th), ct = Math.sqrt(1 - s * s), rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct), rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
    return (rs * rs + rp * rp) / 2;
  };
  const refracta = (i, n1, n2) => deg(Math.asin(Math.min(1, (n1 * sen(i)) / n2)));
  const penetra = (th) => { const s = (N1 / N2) * sen(th); return s > 1 ? LAMBDA / (2 * Math.PI * N2 * Math.sqrt(s * s - 1)) : null; };   // nm, onda evanescente
  const potencia = (km) => P0 * Math.pow(10, (-ATEN * km) / 10);                       // mW tras km kilómetros
  const retardo = (km) => (km * N1) / 299792.458 * 1e3;                                 // ms que tarda la luz en recorrer km
  const datos = { N1, N2, LAMBDA, ATEN, P0, thc, AN, aMax, betaMax, th0: 85, i0: 30, r0: refracta(30, N1, 1), alfa: 22, R85: refl(85), prof85: penetra(85), km: 100, P100: potencia(100), dB100: ATEN * 100, t100: retardo(100), usPorKm: retardo(1) * 1e3 };
  const f0 = (x) => String(Math.round(x)), f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ','), f3 = (x) => x.toFixed(3).replace('.', ',');
  const fP = (mW) => (mW >= 0.1 ? `${f2(mW)} mW` : mW >= 1e-4 ? `${f1(mW * 1000)} µW` : `${f1(mW * 1e6)} nW`);

  const pasos = [
    { titulo: 'Ein Glasfaden, dünner als ein Haar', corto: 'Draht', dato: { valor: '125 µm', texto: 'ist eine Glasfaser breit, wie ein Haar; das Licht läuft in einem Kern von etwa 8 µm.' }, texto: `Eine Glasfaser ist ein Faden aus Glas (Quarzglas) mit zwei Teilen: einem zentralen **Kern** und darum herum einem **Mantel**, das Ganze mit Kunststoff überzogen. Der Kern misst bei Langstreckenfasern etwa 8 µm, der Mantel 125 µm.\n\nDurch ihn wandert das Infrarotlicht eines Lasers (mit ${LAMBDA} nm, unsichtbar), und das auch dann, wenn der Faden gebogen ist. Jede Sekunde laufen Billionen Pulse durch eine einzige Faser, und deshalb reist fast das gesamte Internet zwischen Städten und Ländern auf diese Weise. Wie schafft es das Licht, seitlich nicht herauszutreten?`, dura: 10000 },
    { titulo: 'Von Glas in Luft wird das Licht gebrochen', corto: 'Brechung', dato: { valor: `${f0(datos.i0)}° → ${f1(datos.r0)}°`, texto: 'ist der Winkel des Strahls beim Austritt aus einem Glas mit n = 1,48 in die Luft.' }, texto: `Wechselt das Licht das Medium, wird es gebrochen. Das ist das Snelliussche Gesetz: $n_1 "sin" θ_1 = n_2 "sin" θ_2$. Beim Übergang von Glas ($n_1 = ${f2(N1)}$) in Luft ($n_2 = 1$) **entfernt es sich vom Lot**: Ein Strahl, der mit $θ_1 = ${f0(datos.i0)}°$ ankommt, tritt mit $"sin" θ_2 = ${f2(N1)} · "sin" ${f0(datos.i0)}°$ aus, also $θ_2 = ${f1(datos.r0)}°$.\n\nZusätzlich wird ein kleiner Teil des Lichts reflektiert, die schwache Spiegelung, die du in einem Fenster siehst. Wächst der Winkel weiter, nähert sich der austretende Strahl immer mehr der Oberfläche …` },
    { titulo: 'Der Grenzwinkel', corto: 'Grenzwinkel', dato: { valor: `θc = ${f1(thc)}°`, texto: `ist der Einfallswinkel, ab dem das Licht den Kern nicht mehr verlässt (n = ${f2(N1)} gegenüber ${f2(N2)}).` }, texto: `In der Faser ist der Kern ($n_1 = ${f2(N1)}$) von einem Mantel aus einem etwas weniger dichten Glas ($n_2 = ${f2(N2)}$) umgeben. Ein Strahl, der auf die Wand trifft, tritt mit $"sin" θ_2 = (n_1/n_2) "sin" θ_1$ aus, und mit wachsendem Winkel erreicht $θ_2$ 90°: Der Strahl tritt streifend an der Wand aus.\n\nDas geschieht genau beim **Grenzwinkel**: $"sin" θ_c = n_2/n_1 = ${f2(N2)}/${f2(N1)}$, also $θ_c = ${f1(thc)}°$. Bei einem größeren Winkel gibt es keine reelle Lösung für die Brechung mehr: Es kann nichts austreten.`, dura: 11000 },
    { titulo: 'Totalreflexion: das Licht bleibt gefangen', corto: 'Totalreflexion', dato: { valor: '100 %', texto: 'des Lichts wird an der Wand reflektiert, wenn der Winkel den Grenzwinkel übersteigt.' }, texto: `Trifft der Strahl mit mehr als ${f1(thc)}° (also fast parallel zur Achse) auf die Wand, wird er bei jeder Reflexion **vollständig** zurückgeworfen: $R = 100 %$ und $T = 0$. Das ist kein Metallspiegel: An der Wand wird nichts absorbiert, und deshalb kann das Licht Millionen von Reflexionen machen, ohne sich zu erschöpfen.\n\nEin Detail: Die Welle hält an der Grenze nicht abrupt an, sondern dringt in den Mantel ein (evaneszente Welle), und zwar bis zu einer Tiefe $d = {λ}/{2π √(n_1^2 sin^2 θ − n_2^2)}$, die bei $θ = 85°$ etwa **${f1((datos.prof85 || 0) / 1000)} µm** beträgt. Deshalb muss der Mantel deutlich dicker sein als das.\n\nBewege den Schieberegler: Sinkt der Winkel unter ${f1(thc)}°, entweicht bei jeder Reflexion ein Teil des Lichts.`, dura: 12000 },
    { titulo: 'Warum nur gut gerichtetes Licht eintritt', corto: 'Apertur', dato: { valor: `AN = ${f2(AN)}`, texto: `ergibt einen Akzeptanzkegel von ±${f1(aMax)}° in Luft.` }, texto: `Damit das Licht gefangen bleibt, muss es mit mehr als ${f1(thc)}° auf die Wand treffen, also mit weniger als $90° − θ_c = ${f1(betaMax)}°$ zur Achse. Beim Eintritt an der Faserspitze wird der Strahl gebrochen (Luft → Glas), daher gibt es einen maximalen Eintrittswinkel: $"sin" α_"max" = √(n_1^2 − n_2^2) = ${f3(AN)}$, also $α_"max" = ${f1(aMax)}°$.\n\nDiese Zahl, $NA = √(n_1^2 − n_2^2)$, ist die **numerische Apertur**. Licht innerhalb des Kegels wandert durch die Faser; Licht, das schräger ankommt (in der Zeichnung ${f0(datos.alfa)}°), tritt nach wenigen Reflexionen seitlich aus und geht verloren.` },
    { titulo: 'Hundert Kilometer, fast ohne Lichtverlust', corto: 'Abstand', dato: { valor: `${f1(datos.dB100)} dB`, texto: `gehen auf 100 km verloren: Von ${f0(P0)} mW kommen ${fP(datos.P100)} an.` }, texto: `Glas ist nicht vollkommen durchsichtig: Es absorbiert und streut etwas Licht. Bei ${LAMBDA} nm verliert die Langstreckenfaser nur ${f1(ATEN)} dB pro Kilometer, den besten Wert im gesamten Spektrum. In Dezibel addieren sich die Verluste, $"dB" = 0,2 · L$, und die ankommende Leistung ist $P = P_0 · 10^{−0,2 L/10}$.\n\nAuf 100 km sind es ${f0(datos.dB100)} dB: Es kommt ein Hundertstel an, ${fP(datos.P100)} von ${f0(P0)} mW, was noch erkannt wird. Mit Verstärkern alle paar Dutzend Kilometer überquert man einen Ozean. Und das Licht läuft mit etwa 200.000 km/s durch das Glas ($c/n$): Es braucht ${f2(datos.usPorKm)} µs pro Kilometer.` },
  ];

  const ejercicio = () => ({ dato: 'n', n1: '1,48', n2: '1,46', theta: '85', E0: '', lambda: String(LAMBDA) });
  function abrirEnFresnel(destino) {
    try { localStorage.setItem('fresnel-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  const { suave, tramo, rgba } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const prueba4 = { etiqueta: 'der Winkel, mit dem das Licht auf die Wand trifft', min: 55, max: 89, paso: 1, valor: 85, th: 85,
    muestra: (th) => {
      const R = refl(th);
      return th >= thc ? `θ = ${th}° ≥ ${f1(thc)}°: Totalreflexion, 100 % des Lichts bleiben im Inneren` : `θ = ${th}° < ${f1(thc)}°: bei jeder Reflexion werden ${f1(100 * R)} % reflektiert, und nach 10 Reflexionen bleiben ${f2(100 * Math.pow(R, 10))} %`;
    },
    cambia: (th) => { prueba4.th = th; } };
  pasos[3].prueba = prueba4;
  const prueba6 = { etiqueta: 'die Kilometer Glasfaser', min: 0, max: 200, paso: 5, valor: 100, km: 100,
    muestra: (km) => `${km} km → Verlust ${f1(ATEN * km)} dB: Es kommen ${fP(potencia(km))} von ${f0(P0)} mW an, Laufzeit ${f2(retardo(km))} ms`,
    cambia: (km) => { prueba6.km = km; } };
  pasos[5].prueba = prueba6;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c);
    const { X, Y, rotulo, punto, flecha } = v, foto = window.FenomenoFoto;
    g.fillStyle = c.aire; g.fillRect(0, 0, w, h);
    const lin = (pts, color, ancho = 0.07, a = 1, discont = false) => {
      g.strokeStyle = color; g.globalAlpha = a; g.lineWidth = Math.max(1.5, ancho * v.K); g.lineJoin = 'round'; g.lineCap = 'round'; g.setLineDash(discont ? [6, 5] : []);
      g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    };
    const rect = (x, y, ancho, alto, color, a = 1) => { g.globalAlpha = a; g.fillStyle = color; g.fillRect(X(x), Y(y), ancho * v.K, alto * v.K); g.globalAlpha = 1; };
    const arc = (x, y, rad, a, b, color, ancho = 0.04, al = 1) => { const p = []; for (let k = 0; k <= 24; k++) { const an = (a + ((b - a) * k) / 24) * G; p.push([x + rad * Math.cos(an), y - rad * Math.sin(an)]); } lin(p, color, ancho, al); };
    const hasta = (pts, f) => {
      const L = []; let tot = 0; for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); L.push(d); tot += d; }
      let rest = f * tot; const out = [pts[0]];
      for (let k = 1; k < pts.length; k++) { if (rest >= L[k - 1]) { out.push(pts[k]); rest -= L[k - 1]; } else { const s = rest / L[k - 1]; out.push([pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * s, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * s]); break; } }
      return out;
    };
    const luz = (x, y, r, a = 1) => {
      const gg = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r * 3 * v.K); gg.addColorStop(0, rgba(c.rayo, 0.55 * a)); gg.addColorStop(1, rgba(c.rayo, 0));
      g.fillStyle = gg; g.fillRect(X(x - r * 3), Y(y - r * 3), r * 6 * v.K, r * 6 * v.K); punto(x, y, r, c.rayo, a);
    };
    const zig = (x0, y0, dir, s, yt, yb, xmax) => {
      const pts = [[x0, y0]], reb = []; let x = x0, y = y0;
      for (let k = 0; k < 60 && x < xmax; k++) {
        const meta = dir < 0 ? yt : yb, dx = Math.abs(meta - y) / s;
        if (x + dx >= xmax) { pts.push([xmax, y + dir * s * (xmax - x)]); break; }
        x += dx; y = meta; pts.push([x, y]); reb.push([x, y, dir]); dir = -dir;
      }
      return { pts, reb };
    };
    const dibujaZig = (z, R, f, ancho = 0.08) => {
      const tr = hasta(z.pts, f); let k = 0;
      for (let j = 1; j < tr.length; j++) {
        const a = Math.max(0.12, Math.pow(R, j - 1));
        lin([tr[j - 1], tr[j]], c.rayo, ancho, a);
        if (j - 1 < z.reb.length && j < tr.length && (j < tr.length - 1 || f >= 1)) {
          const [bx, by, d] = z.reb[j - 1];
          if (R < 0.999) lin([[bx, by], [bx + 0.9, by + d * 0.9]], c.rayo, ancho * 0.7, Math.min(1, (1 - R) * Math.pow(R, j - 1) * 3.5 + 0.12));
          k++;
        }
      }
      return tr[tr.length - 1];
    };

    function hilo() {
      const P = (s) => [1.3 + 13.4 * s, 4.5 + 1.9 * Math.sin(s * 2 * Math.PI * 1.1 + 0.5)], N = 60, tray = []; for (let k = 0; k <= N; k++) tray.push(P(k / N));
      const crece = suave(tramo(t, 0, 0.35));
      const vis = hasta(tray, crece);
      lin(vis, c.plastico, 0.95, 0.5); lin(vis, c.cubierta, 0.66); lin(vis, c.nucleo, 0.2);
      const q = suave(tramo(t, 0.3, 1));
      if (q > 0) {
        for (let k = 0; k < 7; k++) {
          const s = ((k / 7 + reloj * 0.09 + t * 0.1) % 1), p = P(s);
          luz(p[0], p[1], 0.15, q * Math.min(1, s * 6) * Math.min(1, (1 - s) * 6));
        }
      }
      punto(1.15, P(0)[1], 0.32, c.resalta, crece); punto(14.85, P(1)[1], 0.32, c.resalta, crece);
      const e = P(0.5);
      rotulo('Laser', 1.15, P(0)[1] - 0.75, { al: 'center', tam: 12.5, peso: 600, escribe: tramo(t, 0.05, 0.25) });
      rotulo('receptor', 14.85, P(1)[1] + 0.75, { al: 'center', tam: 12.5, peso: 600, escribe: tramo(t, 0.05, 0.25) });
      rotulo('Kern (≈ 8 µm): hier läuft das Licht', 8, 1.0, { al: 'center', tam: 13, peso: 600, color: c.resalta, escribe: tramo(t, 0.5, 0.75) });
      rotulo('Glasmantel (125 µm)', 8, 8.0, { al: 'center', tam: 13, peso: 600, escribe: tramo(t, 0.65, 0.85) });
      rotulo('Zeichnung nicht maßstabsgetreu: Der Kern ist ~15-mal dünner als der Mantel', 8, 8.6, { al: 'center', tam: 11, fondo: false, escribe: tramo(t, 0.8, 1) });
      if (!foto) { flecha(8, 1.5, e[0], e[1] - 0.45, c.resalta, tramo(t, 0.55, 0.8), 0.025); }
    }
    function refraccion() {
      const O = [8, 4.7], i = datos.i0, r = datos.r0, Ls = 4;
      rect(0, 4.7, 16, 5, c.vidrio, 0.55);
      lin([[0, 4.7], [16, 4.7]], c.rotulo, 0.03, 0.8);
      const a1 = suave(tramo(t, 0.04, 0.35)), a2 = suave(tramo(t, 0.35, 0.65)), a3 = suave(tramo(t, 0.55, 0.75));
      const S = [O[0] - Ls * sen(i), O[1] + Ls * cos(i)];
      lin([[O[0] + 0.0, O[1] - 3.4], [O[0], O[1] + 3.4]], c.rotulo, 0.025, 0.8 * suave(tramo(t, 0, 0.12)), true);
      lin(hasta([S, O], a1), c.rayo, 0.08);
      lin(hasta([O, [O[0] + Ls * sen(r), O[1] - Ls * cos(r)]], a2), c.rayo, 0.08);
      lin(hasta([O, [O[0] + Ls * sen(i), O[1] + Ls * cos(i)]], a3), c.rayo, 0.04, 0.4);
      const q = suave(tramo(t, 0.5, 0.75));
      if (q > 0) { arc(O[0], O[1], 1.3, 270 - i, 270, c.resalta, 0.06, q); arc(O[0], O[1], 1.7, 90 - r, 90, c.resalta, 0.06, q); }
      rotulo(`Glas  n = ${f2(N1)}`, 2.0, 7.9, { tam: 13, peso: 600, color: c.resalta, fondo: false, escribe: tramo(t, 0.05, 0.25) });
      rotulo('Luft  n = 1', 2.0, 1.5, { tam: 13, peso: 600, fondo: false, escribe: tramo(t, 0.05, 0.25) });
      rotulo(`θ₁ = ${f0(i)}°`, O[0] - 1.45, O[1] + 1.65, { al: 'right', tam: 14.5, peso: 700, color: c.resalta, escribe: tramo(t, 0.55, 0.75) });
      rotulo(`θ₂ = ${f1(r)}°`, O[0] + 1.75, O[1] - 1.2, { tam: 14.5, peso: 700, color: c.resalta, escribe: tramo(t, 0.65, 0.85) });
      rotulo('ein wenig wird reflektiert', O[0] + 0.75, O[1] + 0.75, { tam: 11.5, fondo: false, escribe: tramo(t, 0.75, 0.95) });
      rotulo('normal', O[0] + 0.2, O[1] - 3.2, { tam: 11.5, fondo: false, escribe: tramo(t, 0.1, 0.25) });
      if (foto) return;
      v.panel(10.8, 5.7, 4.8, 2.3);
      rotulo('Snellius\'sches Gesetz', 11.05, 6.2, { tam: 13, peso: 700, fondo: false, escribe: tramo(t, 0.7, 0.8) });
      rotulo('n₁ sin θ₁ = n₂ sin θ₂', 11.05, 6.85, { tam: 14, fondo: false, escribe: tramo(t, 0.78, 0.9) });
      rotulo(`${f2(N1)} · sin ${f0(i)}° = 1 · sin θ₂`, 11.05, 7.45, { tam: 12.5, fondo: false, escribe: tramo(t, 0.88, 1) });
    }
    function critico() {
      const O = [8.5, 4.7], Ls = 4.4;
      rect(0, 4.7, 16, 5, c.nucleo, 0.35); rect(0, 1.2, 16, 3.5, c.cubierta, 0.4);
      lin([[0, 4.7], [16, 4.7]], c.rotulo, 0.03, 0.8);
      lin([[O[0], O[1] - 3.3], [O[0], O[1] + 3.3]], c.rotulo, 0.025, 0.7 * suave(tramo(t, 0, 0.1)), true);
      const lista = [30, 55, 72, thc, 87];
      lista.forEach((i, k) => {
        const a = suave(tramo(t, 0.08 + k * 0.13, 0.2 + k * 0.13)), total = i >= thc - 1e-9, crit = Math.abs(i - thc) < 1e-9, col = crit ? c.resalta : c.rayo;
        const S = [O[0] - Ls * sen(i), O[1] + Ls * cos(i)];
        lin(hasta([S, O], a), col, crit ? 0.1 : 0.06, crit ? 1 : 0.85);
        const b = suave(tramo(t, 0.2 + k * 0.13, 0.34 + k * 0.13));
        if (b > 0) {
          if (!total) { const r = refracta(i, N1, N2); lin(hasta([O, [O[0] + Ls * sen(r), O[1] - Ls * cos(r)]], b), col, 0.06, 0.85); lin(hasta([O, [O[0] + 2.6 * sen(i), O[1] + 2.6 * cos(i)]], b), col, 0.03, 0.35); }
          else if (crit) lin(hasta([O, [O[0] + 5.8, O[1] - 0.012]], b), col, 0.1);
          else lin(hasta([O, [O[0] + Ls * sen(i), O[1] + Ls * cos(i)]], b), col, 0.06, 0.9);
        }
        const [lx, ly] = [O[0] - (Ls + 0.5) * sen(i), O[1] + (Ls + 0.45) * cos(i)];
        rotulo(`${f0(i)}°`.replace(f0(thc) + '°', f1(thc) + '°'), Math.max(0.8, lx), Math.min(8.5, ly), { al: 'center', tam: 12.5, peso: crit ? 700 : 600, color: crit ? c.resalta : c.rotulo, fondo: false, escribe: tramo(t, 0.25 + k * 0.1, 0.4 + k * 0.1) });
      });
      rotulo(`Kern  n₁ = ${f2(N1)}`, 0.7, 8.4, { tam: 13, peso: 600, color: c.resalta, fondo: false });
      rotulo(`Mantel  n₂ = ${f2(N2)}`, 0.7, 1.7, { tam: 13, peso: 600, fondo: false });
      rotulo('tritt streifend an der Wand aus', O[0] + 5.6, O[1] - 0.55, { al: 'right', tam: 12, color: c.resalta, peso: 600, fondo: false, escribe: tramo(t, 0.7, 0.9) });
      if (foto) return;
      v.panel(10.9, 6.3, 4.8, 1.9);
      rotulo('sin θc = n₂ / n₁', 11.15, 6.85, { tam: 14, peso: 700, fondo: false, escribe: tramo(t, 0.7, 0.85) });
      rotulo(`= ${f2(N2)} / ${f2(N1)}  →  θc = ${f1(thc)}°`, 11.15, 7.55, { tam: 13, fondo: false, color: c.resalta, escribe: tramo(t, 0.82, 1) });
    }
    function total() {
      const yt = 3.4, yb = 5.6, th = prueba4.th, beta = 90 - th, s = Math.min(3.2, 4 * tan(beta)), R = refl(th), ok = th >= thc;
      rect(0, 2.2, 16, 1.2, c.cubierta, 0.55); rect(0, 5.6, 16, 1.2, c.cubierta, 0.55); rect(0, yt, 16, yb - yt, c.nucleo, 0.45);
      lin([[0, yt], [16, yt]], c.rotulo, 0.02, 0.5); lin([[0, yb], [16, yb]], c.rotulo, 0.02, 0.5);
      const z = zig(0.4, 4.9, -1, s, yt, yb, 15.6), f = suave(tramo(t, 0.04, 0.75)), fin = dibujaZig(z, R, f);
      luz(fin[0], fin[1], 0.13, f > 0 ? 1 : 0);
      z.reb.forEach(([bx, by, d], j) => { if (bx < fin[0] && ok) { const a = Math.min(1, (fin[0] - bx) * 2); g.globalAlpha = 0.28 * a; const gg = g.createRadialGradient(X(bx), Y(by + d * 0.1), 0, X(bx), Y(by + d * 0.1), 0.55 * v.K); gg.addColorStop(0, rgba(c.resalta, 0.9)); gg.addColorStop(1, rgba(c.resalta, 0)); g.fillStyle = gg; g.fillRect(X(bx - 0.6), Y(by - 0.6 + d * 0.5), 1.2 * v.K, 1.2 * v.K); g.globalAlpha = 1; } });
      const b0 = z.reb[0];
      if (b0) {
        lin([[b0[0], b0[1] - 0.9], [b0[0], b0[1] + 0.9]], c.rotulo, 0.02, 0.8 * suave(tramo(t, 0.15, 0.3)), true);
        rotulo(`θ = ${f0(th)}°`, b0[0] + 0.15, b0[1] - 0.95 * (b0[2] < 0 ? 1 : -1) * 1.0 + (b0[2] < 0 ? -0.1 : 0.1), { tam: 14, peso: 700, color: c.resalta, escribe: tramo(t, 0.3, 0.5) });
      }
      rotulo(`Kern  n₁ = ${f2(N1)}`, 0.5, 5.3, { tam: 12.5, peso: 600, color: c.resalta, fondo: false, escribe: tramo(t, 0.1, 0.3) });
      rotulo(`Mantel  n₂ = ${f2(N2)}`, 0.5, 2.8, { tam: 12.5, peso: 600, fondo: false, escribe: tramo(t, 0.1, 0.3) });
      rotulo(ok ? `θ ≥ θc = ${f1(thc)}°: Totalreflexion, nichts tritt aus` : `θ < θc = ${f1(thc)}°: bei jeder Reflexion entweicht ein Teil`, 8, 7.8, { al: 'center', tam: 14, peso: 700, color: ok ? c.resalta : c.alerta, escribe: tramo(t, 0.6, 0.85) });
      rotulo('(die Faser ist viel breiter als lang gezeichnet, damit man die Reflexionen sieht)', 8, 8.45, { al: 'center', tam: 11, fondo: false, escribe: tramo(t, 0.8, 1) });
      if (ok && !foto) rotulo(`die evaneszente Welle dringt ≈ ${f1((penetra(th) || 0) / 1000)} µm in den Mantel ein`, 8, 1.4, { al: 'center', tam: 12, fondo: false, escribe: tramo(t, 0.85, 1) });
    }
    function apertura() {
      const xc = 6.5, yt = 3.6, yb = 5.4, Lc = 5.0;
      rect(xc, 2.6, 16 - xc, 1.0, c.cubierta, 0.55); rect(xc, 5.4, 16 - xc, 1.0, c.cubierta, 0.55); rect(xc, yt, 16 - xc, yb - yt, c.nucleo, 0.45);
      lin([[xc, 2.6], [xc, 6.4]], c.rotulo, 0.05, 0.9);
      const a = suave(tramo(t, 0.04, 0.3));
      g.fillStyle = rgba(c.rayo, 0.2 * a); g.beginPath(); g.moveTo(X(xc), Y(4.5));
      g.lineTo(X(xc - Lc * cos(aMax)), Y(4.5 + Lc * sen(aMax))); g.lineTo(X(xc - Lc * cos(aMax)), Y(4.5 - Lc * sen(aMax))); g.closePath(); g.fill();
      lin(hasta([[xc - Lc * cos(aMax), 4.5 + Lc * sen(aMax)], [xc, 4.5]], a), c.resalta, 0.04, 0.9, true); lin(hasta([[xc - Lc * cos(aMax), 4.5 - Lc * sen(aMax)], [xc, 4.5]], a), c.resalta, 0.04, 0.9, true);
      lin([[0.6, 4.5], [xc, 4.5]], c.rotulo, 0.02, 0.5 * a, true);
      arc(xc, 4.5, 2.1, 180 - aMax, 180 + aMax, c.resalta, 0.06, a);
      const guiado = 10, fuera = datos.alfa;
      [[guiado, c.rayo, 'guiado'], [fuera, c.alerta, 'fuera']].forEach(([al, col, tipo], k) => {
        const f = suave(tramo(t, 0.3 + k * 0.1, 0.65 + k * 0.1)), beta = deg(Math.asin(sen(al) / N1)), th = 90 - beta, R = refl(th);
        const S = [xc - 4.6 * cos(al), 4.5 + 4.6 * sen(al)];
        lin(hasta([S, [xc, 4.5]], Math.min(1, f * 1.5)), col, 0.07);
        const z = zig(xc, 4.5, -1, Math.min(3, 4 * tan(beta)), yt, yb, 15.6);
        if (f > 0.34) { const sub = { pts: z.pts, reb: z.reb }; const dd = (ff) => { const tr = hasta(sub.pts, ff); for (let j = 1; j < tr.length; j++) lin([tr[j - 1], tr[j]], col, 0.07, Math.max(0.12, Math.pow(R, j - 1))); if (R < 0.999) sub.reb.forEach(([bx, by, d], j) => { if (bx < tr[tr.length - 1][0]) lin([[bx, by], [bx + 0.9, by + d * 0.9]], col, 0.05, Math.min(1, (1 - R) * Math.pow(R, j) * 3 + 0.15)); }); }; dd((f - 0.34) / 0.66); }
      });
      rotulo(`Halbwinkel ${f1(aMax)}°`, xc - 2.3, 4.5 - 1.3, { al: 'center', tam: 13, peso: 700, color: c.resalta, escribe: tramo(t, 0.3, 0.5) });
      rotulo('Akzeptanzkegel', xc - 2.8, 1.2, { al: 'center', tam: 13, peso: 600, color: c.resalta, fondo: false, escribe: tramo(t, 0.2, 0.4) });
      rotulo(`tritt mit ${f0(guiado)}° ein: bleibt gefangen`, 11.2, 2.15, { al: 'center', tam: 12.5, peso: 600, color: c.rayo, escribe: tramo(t, 0.55, 0.75) });
      rotulo(`tritt mit ${f0(fuera)}° ein: entweicht seitlich`, 11.2, 7.35, { al: 'center', tam: 12.5, peso: 600, color: c.alerta, escribe: tramo(t, 0.7, 0.9) });
      rotulo('(Zeichnung innerhalb der Faser nicht maßstabsgetreu)', 8, 8.5, { al: 'center', tam: 11, fondo: false, escribe: tramo(t, 0.85, 1) });
      if (foto) return;
      v.panel(0.6, 6.3, 4.9, 1.9);
      rotulo('NA = √(n₁² − n₂²)', 0.85, 6.85, { tam: 14, peso: 700, fondo: false, escribe: tramo(t, 0.75, 0.88) });
      rotulo(`= ${f3(AN)}  →  α max = ${f1(aMax)}°`, 0.85, 7.55, { tam: 13, fondo: false, color: c.resalta, escribe: tramo(t, 0.85, 1) });
    }
    function distancia() {
      const x0 = 2.4, x1 = 14.6, y0 = 7.0, y1 = 1.7, km = prueba6.km, gx = (k) => x0 + (k / 200) * (x1 - x0), gy = (p) => y0 - Math.min(1, p / P0) * (y0 - y1);
      v.panel(0.8, 0.8, 14.4, 7.7);
      lin([[x0, y1 - 0.2], [x0, y0], [x1 + 0.2, y0]], c.rotulo, 0.03, 0.8);
      for (const k of [0, 50, 100, 150, 200]) { lin([[gx(k), y0], [gx(k), y0 + 0.12]], c.rotulo, 0.02, 0.8); rotulo(String(k), gx(k), y0 + 0.5, { al: 'center', tam: 11.5, fondo: false }); }
      for (const p of [0, 0.5, 1]) { lin([[x0 - 0.12, gy(p)], [x0, gy(p)]], c.rotulo, 0.02, 0.8); rotulo(f1(p).replace(',0', '').replace('0', '0'), x0 - 0.25, gy(p), { al: 'right', tam: 11.5, fondo: false }); }
      const pts = []; for (let k = 0; k <= 200; k += 2) pts.push([gx(k), gy(potencia(k))]);
      lin(hasta(pts, suave(tramo(t, 0.05, 0.6))), c.resalta, 0.08);
      const m = suave(tramo(t, 0.6, 0.85)), pm = potencia(km);
      punto(gx(km), gy(pm), 0.17, c.alerta, m);
      if (m > 0) { lin([[x0, gy(pm)], [gx(km), gy(pm)], [gx(km), y0]], c.alerta, 0.025, 0.9 * m, true); }
      rotulo('Leistung (mW)', x0 - 0.1, y1 - 0.5, { tam: 12, peso: 600, fondo: false });
      rotulo('Kilometer Glasfaser', (x0 + x1) / 2, y0 + 1.15, { al: 'center', tam: 12, peso: 600, fondo: false });
      rotulo(`${km} km → ${fP(pm)}  (${f1(ATEN * km)} dB)`, Math.min(gx(km) + 0.4, x1 - 3.6), Math.max(gy(pm) - 0.65, y1 + 0.3), { tam: 14, peso: 700, color: c.alerta, escribe: tramo(t, 0.7, 0.9) });
      rotulo(`${f1(ATEN)} dB pro Kilometer, bei ${LAMBDA} nm`, 5.2, 2.2, { tam: 13, peso: 600, fondo: false, escribe: tramo(t, 0.75, 0.95) });
    }

    if (paso === 0) hilo();
    if (paso === 1) refraccion();
    if (paso === 2) critico();
    if (paso === 3) total();
    if (paso === 4) apertura();
    if (paso === 5) distancia();
  }

  const COLORES = ['aire', 'vidrio', 'cubierta', 'nucleo', 'plastico', 'rayo', 'resalta', 'alerta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnFresnel, refl, refracta, penetra, potencia, retardo };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: FibraOptica.pasos, dibuja: FibraOptica.dibuja, colores: FibraOptica.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); FibraOptica.abrirEnFresnel(e.currentTarget.getAttribute('href')); });
}

