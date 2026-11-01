/* =====================================================================
   El arcoíris: los 6 pasos de la animación (texto y dibujo) y el ejercicio
   que se abre en Reflexión y transmisión (Fresnel): la luz entrando en una
   gota de agua (n = 1,333) con el ángulo de incidencia del arcoíris, 59,4°.
   El modelo es el de Descartes: una gota esférica, dos refracciones y una
   reflexión interna; desviación D = 180° + 2i − 4r y, en el mínimo, cos²i =
   (n² − 1)/3. El motor es fenomenos/animacion.js, los ayudantes de dibujo
   fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se
   cargan los datos: pruebas/herramientas/fenomenos/arcoiris.js.
   ===================================================================== */
const Arcoiris = (() => {
  // índices de refracción del agua: 1,331 para el rojo (700 nm), 1,333 de referencia (590 nm) y 1,343 para el violeta (400 nm)
  const N_ROJO = 1.331, N = 1.333, N_VIOLETA = 1.343, G = Math.PI / 180;
  const sen = (a) => Math.sin(a * G), cos = (a) => Math.cos(a * G), deg = (x) => x / G;
  const refracta = (i, n) => deg(Math.asin(sen(i) / n));                                  // ley de Snell: r
  const desv = (i, n, k = 1) => 180 * k + 2 * i - 2 * (k + 1) * refracta(i, n);          // desviación total con k reflexiones internas
  const iMin = (n, k = 1) => deg(Math.acos(Math.sqrt((n * n - 1) / (k * (k + 2)))));     // incidencia de desviación mínima
  const ang = (i, n) => 180 - desv(i, n);                                                 // ángulo respecto al eje (arcoíris primario)
  const arco = (n) => ang(iMin(n), n);                                                    // ángulo del arco: máximo de ang
  const arco2 = (n) => desv(iMin(n, 2), n, 2) - 180;                                      // arco secundario (dos reflexiones)
  const datos = { N, N_ROJO, N_VIOLETA, i0: iMin(N), r0: refracta(iMin(N), N), D0: desv(iMin(N), N), a0: arco(N), aRojo: arco(N_ROJO), aVioleta: arco(N_VIOLETA), a2: arco2(N), a2Rojo: arco2(N_ROJO), a2Violeta: arco2(N_VIOLETA) };
  const f0 = (x) => String(Math.round(x)), f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ','), f3 = (x) => x.toFixed(3).replace('.', ',');
  const { i0, r0, D0, a0, aRojo, aVioleta, a2 } = datos;

  const pasos = [
    { titulo: 'Con el Sol a la espalda y la lluvia delante', corto: 'Sol', dato: { valor: '42°', texto: 'es el ángulo que forma, desde tu ojo, la luz que vuelve de una gota con la dirección contraria al Sol.' }, texto: `Para ver un arcoíris hacen falta dos cosas: gotas de lluvia delante de ti y el Sol detrás. La luz entra en cada gota, rebota dentro y vuelve hacia el Sol, o sea, hacia ti.\n\nLo curioso es que solo ves esa luz si la gota está a un ángulo muy concreto del eje que pasa por tu ojo y apunta lejos del Sol: ${f0(a0)}°. Las gotas que cumplen eso forman una circunferencia en el cielo, y el arcoíris es la parte de ella que queda sobre el horizonte.`, dura: 11000 },
    { titulo: 'Al entrar en la gota, la luz se dobla', corto: 'Entrada', dato: { valor: `${f1(i0)}° → ${f1(r0)}°`, texto: `es el ángulo del rayo antes y después de entrar, con n = ${f3(N)}.` }, texto: `Un rayo del Sol llega a una gota de agua. En la superficie pasa del aire ($n = 1$) al agua ($n = ${f3(N)}$), donde la luz va más despacio, y se dobla hacia la normal: es la ley de Snell, $"sen" i = n "sen" r$.\n\nPara un rayo que llega con $i = ${f1(i0)}°$ sale $"sen" r = "sen" ${f1(i0)}° / ${f3(N)}$, o sea $r = ${f1(r0)}°$. Cada rayo que entra en la gota por un sitio distinto lo hace con un $i$ distinto, desde 0° (en el centro) hasta 90° (rasante).` },
    { titulo: 'Rebota en el fondo y sale hacia atrás', corto: 'Rebote', dato: { valor: `${f0(D0)}°`, texto: 'es lo que gira en total el rayo: se desvía casi media vuelta.' }, texto: `Al llegar al fondo de la gota, parte de la luz se refleja (el ángulo de reflexión es igual al de incidencia, $r$) y vuelve a la cara de delante, donde sale refractándose otra vez, esta vez de agua a aire.\n\nEn total el rayo gira $(i − r) + (180° − 2r) + (i − r)$, es decir, $D = 180° + 2i − 4r$. Con $i = ${f1(i0)}°$ y $r = ${f1(r0)}°$ da $D = ${f1(D0)}°$: la luz sale casi en sentido contrario al que llevaba, a $180° − D = ${f1(a0)}°$ de la dirección de vuelta al Sol.`, dura: 11000 },
    { titulo: '¿Por qué justo 42°?', corto: '42°', dato: { valor: `máx. ${f1(a0)}°`, texto: 'es el ángulo más grande al que sale la luz: allí se amontonan los rayos.' }, texto: `Los rayos del Sol que llegan a una gota no entran con el mismo $i$. Cada uno sale con su propio ángulo, pero el ángulo $180° − D$ no crece sin parar: sube hasta un máximo de ${f1(a0)}° (con $i = ${f1(i0)}°$) y vuelve a bajar.\n\nCerca de un máximo la curva es plana, así que muchos rayos distintos salen casi en la misma dirección y se suman: ahí hay luz intensa. Más allá de ${f0(a0)}° no sale ninguno. Lo descubrió Descartes en 1637 trazando a mano rayos por una esfera de agua.`, dura: 12000, },
    { titulo: 'Los colores: cada uno se dobla un poco distinto', corto: 'Colores', dato: { valor: `${f1(aVioleta)}° a ${f1(aRojo)}°`, texto: 'es el intervalo de ángulos del violeta al rojo.' }, texto: `El índice de refracción del agua depende de la longitud de onda: es ${f3(datos.N_ROJO)} para el rojo y ${f3(datos.N_VIOLETA)} para el violeta. La luz violeta se dobla un poco más al entrar, y el máximo cae a otro ángulo.\n\nResulta ${f1(aRojo)}° para el rojo y ${f1(aVioleta)}° para el violeta. Un ángulo mayor está más arriba en el cielo: por eso el rojo queda en el borde de fuera del arco y el violeta en el de dentro, con el resto de colores entre medias.` },
    { titulo: 'El cálculo, con la ley de Snell', corto: 'Cálculo', dato: { valor: `cos²i = (n²−1)/3`, texto: `da i = ${f1(i0)}° para el agua; el arco sale a ${f1(a0)}°.` }, texto: `Derivando $D(i)$ e igualando a cero se llega a $cos^2 i = (n^2 − 1)/3$. Con $n = ${f3(N)}$: $cos^2 i = ${f3((N * N - 1) / 3)}$, $i = ${f1(i0)}°$, $"sen" r = "sen" i / n$ da $r = ${f1(r0)}°$ y el arco queda a $4r − 2i = ${f1(a0)}°$.\n\nSi la luz rebota **dos** veces dentro de la gota sale el arcoíris secundario, el de arriba y con los colores al revés: $cos^2 i = (n^2 − 1)/8$ lo coloca a ${f0(a2)}°. Entre los dos queda una franja oscura, la banda de Alejandro.` },
  ];

  // ejercicio de Fresnel (formato de fresnel-v1): la luz del Sol (aire) entrando en el agua de la gota con i = 59,4°
  const ejercicio = () => ({ dato: 'n', n1: '1', n2: '1,333', theta: String(i0.toFixed(1)).replace('.', ','), E0: '', lambda: '' });
  function abrirEnFresnel(destino) {
    try { localStorage.setItem('fresnel-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  // color de una longitud de onda (400 a 700 nm), solo para dibujar el espectro
  const deLongitud = (nm, a = 1) => `hsla(${Math.max(0, 270 - ((nm - 400) / 300) * 270)}, 90%, 52%, ${a})`;
  // «Pruébalo tú» del paso 4: ángulo de incidencia en grados
  const prueba = { etiqueta: 'el ángulo de incidencia i', min: 10, max: 85, paso: 1, valor: 59, i: 59,
    muestra: (i) => `i = ${i}° → el rayo sale a ${f1(ang(i, N))}° del eje (el máximo es ${f1(a0)}°)`,
    cambia: (i) => { prueba.i = i; } };
  pasos[3].prueba = prueba;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto;
    // cielo
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // ---- ayudantes ----
    const lin = (pts, color, ancho = 0.07, a = 1, discont = false) => {
      g.strokeStyle = color; g.globalAlpha = a; g.lineWidth = Math.max(2, ancho * v.K); g.lineJoin = 'round'; g.lineCap = 'round'; g.setLineDash(discont ? [6, 5] : []);
      g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    };
    // tramo de una poligonal hasta la fracción f (0 a 1) de su longitud
    const hasta = (pts, f) => {
      const L = []; let tot = 0; for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); L.push(d); tot += d; }
      let rest = f * tot; const out = [pts[0]];
      for (let k = 1; k < pts.length; k++) { if (rest >= L[k - 1]) { out.push(pts[k]); rest -= L[k - 1]; } else { const s = rest / L[k - 1]; out.push([pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * s, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * s]); break; } }
      return out;
    };
    // arco de circunferencia en ángulos matemáticos (grados, antihorario)
    const arc = (x, y, rad, a, b, color, ancho = 0.04, al = 1) => { const p = []; for (let k = 0; k <= 24; k++) { const an = (a + ((b - a) * k) / 24) * G; p.push([x + rad * Math.cos(an), y - rad * Math.sin(an)]); } lin(p, color, ancho, al); };
    // gota de centro (cx, cy) y radio R
    const gota = (cx, cy, R, brillo = 0) => {
      g.fillStyle = rgba(c.gota, 0.2 + 0.25 * brillo); g.beginPath(); g.arc(X(cx), Y(cy), R * v.K, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = c.gota; g.lineWidth = Math.max(2, 0.06 * v.K); g.stroke();
    };
    // recorrido del rayo de incidencia i: entrada, chord, rebote, salida (de largo Lsal) desde la izquierda en xs
    const traza = (cx, cy, R, i, n, xs, Lsal) => {
      const r = refracta(i, n), P = (a) => [cx + R * Math.cos(a * G), cy - R * Math.sin(a * G)], D = desv(i, n);
      const P1 = P(180 - i), P2 = P(2 * r - i), P3 = P(4 * r - i - 180);
      return { r, D, P1, P2, P3, pts: [[xs, P1[1]], P1, P2, P3, [P3[0] + Lsal * Math.cos(D * G), P3[1] + Lsal * Math.sin(D * G)]] };
    };
    const sol = (x, y, r) => {
      const gg = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r * 3.2 * v.K); gg.addColorStop(0, rgba(c.sol, 0.6)); gg.addColorStop(1, rgba(c.sol, 0));
      g.fillStyle = gg; g.fillRect(X(x - r * 3.2), Y(y - r * 3.2), r * 6.4 * v.K, r * 6.4 * v.K); punto(x, y, r, c.sol);
    };

    // paso 1: el montaje Sol – observador – gotas
    function montaje() {
      const E = [3.6, 6.3], L = 6.2, Dg = [E[0] + L * cos(a0), E[1] - L * sen(a0)], hs = Dg[1];
      g.fillStyle = c.suelo; g.fillRect(0, Y(8.45), w, h);
      // lluvia: las gotas a 42° del eje se iluminan
      for (let k = 0; k < 90; k++) {
        const x = 6.2 + azar(k) * 9.4, y = 0.5 + azar(k + 200) * 7.2, an = deg(Math.atan2(E[1] - y, x - E[0])), cerca = Math.abs(an - a0) < 1.4;
        punto(x, y, cerca ? 0.1 : 0.055, cerca ? c.gota : c.nube, cerca ? 0.35 + 0.65 * suave(tramo(t, 0.5, 0.75)) : 0.55);
      }
      // rayos del Sol (paralelos) y el que llega a la gota
      sol(1.0, hs, 0.55);
      [1.0, 3.0, 4.2].forEach((y) => lin([[1.9, y], [15.6, y]], c.rayo, 0.04, 0.35 * suave(tramo(t, 0, 0.2))));
      const a = suave(tramo(t, 0.05, 0.35)); lin([[1.9, hs], [1.9 + a * (Dg[0] - 1.9), hs]], c.rayo, 0.08);
      const b = suave(tramo(t, 0.4, 0.62)); if (b > 0) { punto(Dg[0], Dg[1], 0.2, c.gota, b); lin([Dg, [Dg[0] + (E[0] - Dg[0]) * b, Dg[1] + (E[1] - Dg[1]) * b]], c.rayo, 0.08, b); }
      // observador (mira hacia la derecha) y eje
      g.fillStyle = c.rotulo; g.beginPath(); g.arc(X(E[0]), Y(E[1]), 0.3 * v.K, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = c.rotulo; g.lineWidth = 0.14 * v.K; g.lineCap = 'round'; g.beginPath(); g.moveTo(X(E[0] - 0.05), Y(E[1] + 0.45)); g.lineTo(X(E[0] - 0.1), Y(8.35)); g.stroke(); g.lineCap = 'butt';
      const e = suave(tramo(t, 0.62, 0.85));
      if (e > 0) { lin([E, [E[0] + 8.6 * e, E[1]]], c.rotulo, 0.03, 0.8, true); arc(E[0], E[1], 1.7, 0, a0 * e, c.resalta, 0.07); }
      rotulo('el Sol, a tu espalda', 1.0, hs - 1.0, { al: 'center', tam: 12.5, peso: 600, escribe: tramo(t, 0.1, 0.3) });
      rotulo('tú', E[0], E[1] - 0.95, { al: 'center', tam: 12.5, peso: 600, escribe: tramo(t, 0.3, 0.4) });
      rotulo('gotas de lluvia', 13.2, 7.9, { al: 'center', tam: 12.5, peso: 600, escribe: tramo(t, 0.15, 0.35), fondo: false });
      rotulo('eje: dirección contraria al Sol', 8.4, 6.7, { al: 'center', tam: 12, escribe: tramo(t, 0.75, 0.92) });
      rotulo('42°', E[0] + 2.35, E[1] - 0.8, { tam: 15, peso: 700, color: c.resalta, escribe: tramo(t, 0.8, 0.95) });
    }
    // gota grande de las pasos 2 a 4
    const GC = [6.0, 4.2], GR = 2.6;
    // paso 2: refracción al entrar
    function entrada() {
      const T = traza(GC[0], GC[1], GR, i0, N, 0.5, 4);
      gota(GC[0], GC[1], GR);
      const f1p = suave(tramo(t, 0.05, 0.3)), f2p = suave(tramo(t, 0.35, 0.6));
      lin(hasta([T.pts[0], T.pts[1]], f1p), c.rayo, 0.08); if (f2p > 0) lin(hasta([T.pts[1], T.pts[2]], f2p), c.rayo, 0.08);
      // normal, ángulo i (fuera) y r (dentro)
      const P1 = T.P1, an = 180 - i0, ex = [P1[0] + 1.25 * cos(an), P1[1] - 1.25 * sen(an)], inn = [P1[0] - 1.9 * cos(an), P1[1] + 1.9 * sen(an)];
      const nrm = tramo(t, 0.25, 0.45); lin([ex, [ex[0] + (inn[0] - ex[0]) * nrm, ex[1] + (inn[1] - ex[1]) * nrm]], c.rotulo, 0.025, 0.8, true);
      const q = suave(tramo(t, 0.45, 0.7));
      if (q > 0) { arc(P1[0], P1[1], 1.15, an, 180, c.resalta, 0.06, q); arc(P1[0], P1[1], 1.15, -i0, -i0 + r0, c.gota, 0.06, q); }
      rotulo('aire  n = 1', 1.9, 0.9, { tam: 12.5, peso: 600, escribe: tramo(t, 0.05, 0.25) }); rotulo(`agua  n = ${f3(N)}`, GC[0], GC[1] + 0.35, { al: 'center', tam: 12.5, peso: 600, color: c.gota, escribe: tramo(t, 0.2, 0.4), fondo: false });
      rotulo(`i = ${f1(i0)}°`, P1[0] - 1.45, P1[1] - 0.55, { al: 'right', tam: 14, peso: 700, color: c.resalta, escribe: tramo(t, 0.55, 0.75) });
      rotulo(`r = ${f1(r0)}°`, P1[0] + 0.45, P1[1] + 1.15, { tam: 14, peso: 700, color: c.gota, escribe: tramo(t, 0.65, 0.85) });
      rotulo('normal', ex[0] - 0.1, ex[1] - 0.5, { al: 'center', tam: 11.5, fondo: false, escribe: tramo(t, 0.3, 0.5) });
      if (foto) return;
      v.panel(10.4, 2.2, 5.1, 3.4);
      rotulo('Ley de Snell', 10.7, 2.75, { tam: 13, peso: 700, fondo: false, escribe: tramo(t, 0.7, 0.8) });
      rotulo('sen i = n · sen r', 10.7, 3.6, { tam: 15, fondo: false, escribe: tramo(t, 0.78, 0.9) });
      rotulo(`sen ${f1(i0)}° = ${f3(N)} · sen r`, 10.7, 4.3, { tam: 13.5, fondo: false, escribe: tramo(t, 0.85, 0.95) });
      rotulo(`r = ${f1(r0)}°`, 10.7, 5.0, { tam: 15, peso: 700, color: c.gota, fondo: false, escribe: tramo(t, 0.92, 1) });
    }
    // paso 3: rebote y salida
    function rebote() {
      const T = traza(GC[0], GC[1], GR, i0, N, 0.5, 2.0);
      gota(GC[0], GC[1], GR, suave(tramo(t, 0.3, 0.5)));
      const tr = hasta(T.pts, suave(tramo(t, 0.04, 0.62))); lin(tr, c.rayo, 0.08);
      const P3 = T.P3, q = suave(tramo(t, 0.62, 0.85));
      if (q > 0) {
        lin([P3, [P3[0] - 3.2 * q, P3[1]]], c.rotulo, 0.025, 0.8, true);
        arc(P3[0], P3[1], 1.6, 180, 180 + a0, c.resalta, 0.07, q);
      }
      punto(T.P2[0], T.P2[1], 0.12, c.resalta, suave(tramo(t, 0.3, 0.4)));
      rotulo('rebota', T.P2[0] + 0.25, T.P2[1] - 0.45, { tam: 12.5, peso: 600, escribe: tramo(t, 0.35, 0.5) });
      rotulo('sale', P3[0] + 0.15, P3[1] + 0.45, { tam: 12.5, peso: 600, escribe: tramo(t, 0.5, 0.62) });
      rotulo('hacia el Sol', P3[0] - 3.25, P3[1] - 0.4, { al: 'center', tam: 11.5, fondo: false, escribe: tramo(t, 0.7, 0.85) });
      rotulo(`${f1(a0)}°`, P3[0] - 1.9, P3[1] + 0.95, { al: 'right', tam: 15, peso: 700, color: c.resalta, escribe: tramo(t, 0.75, 0.9) });
      if (foto) return;
      v.panel(10.4, 1.6, 5.1, 4.4);
      rotulo('Desviación total', 10.7, 2.15, { tam: 13, peso: 700, fondo: false, escribe: tramo(t, 0.55, 0.65) });
      rotulo('(i − r) + (180° − 2r) + (i − r)', 10.7, 3.0, { tam: 12.5, fondo: false, escribe: tramo(t, 0.62, 0.75) });
      rotulo('D = 180° + 2i − 4r', 10.7, 3.8, { tam: 15, fondo: false, escribe: tramo(t, 0.72, 0.85) });
      rotulo(`D = ${f1(D0)}°`, 10.7, 4.6, { tam: 15, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.82, 0.92) });
      rotulo(`180° − D = ${f1(a0)}°`, 10.7, 5.3, { tam: 14, fondo: false, escribe: tramo(t, 0.9, 1) });
    }
    // paso 4: muchos rayos y la curva con su máximo
    function amontona() {
      const cx = 4.3, cy = 3.2, R = 2.2, f = suave(tramo(t, 0.03, 0.4));
      gota(cx, cy, R);
      for (let i = 10; i <= 85; i += 5) {
        const T = traza(cx, cy, R, i, N, 0.3, 2.6), cerca = Math.abs(ang(i, N) - a0) < 1.2;
        lin(hasta(T.pts, f), c.rayo, cerca ? 0.07 : 0.035, cerca ? 1 : 0.55);
      }
      // curva ángulo(i)
      const x0 = 9.0, x1 = 15.2, y0 = 7.2, y1 = 1.3, gx = (i) => x0 + (i / 90) * (x1 - x0), gy = (a) => y0 - (a / 45) * (y0 - y1);
      v.panel(8.3, 0.6, 7.4, 7.5);
      lin([[x0, y1], [x0, y0], [x1, y0]], c.rotulo, 0.03, 0.8);
      const pts = []; for (let i = 0; i <= 90; i += 2) pts.push([gx(i), gy(Math.max(0, ang(i, N)))]);
      lin(hasta(pts, suave(tramo(t, 0.25, 0.6))), c.gota, 0.07);
      const m = suave(tramo(t, 0.6, 0.8)); punto(gx(i0), gy(a0), 0.16, c.resalta, m);
      if (m > 0) { lin([[x0, gy(a0)], [gx(i0), gy(a0)], [gx(i0), y0]], c.resalta, 0.025, m, true); }
            rotulo('0°', x0 - 0.2, y0, { al: 'right', tam: 11.5, fondo: false }); rotulo('45°', x0 - 0.2, gy(45), { al: 'right', tam: 11.5, fondo: false });
      rotulo('ángulo de salida (180° − D) según i, de 0° a 90°', (x0 + x1) / 2, y0 + 0.55, { al: 'center', tam: 11.5, fondo: false, peso: 600 });
      rotulo(`máximo ${f1(a0)}°`, gx(i0), gy(a0) - 0.6, { al: 'center', tam: 13.5, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.7, 0.9) });
      // marcador del deslizador «Pruébalo tú»
      const pi = prueba.i, T = traza(cx, cy, R, pi, N, 0.3, 2.6);
      lin(T.pts, c.resalta, 0.07, 0.9 * f); punto(gx(pi), gy(Math.max(0, ang(pi, N))), 0.13, c.rotulo, f);
      rotulo('casi todos los rayos cerca del máximo salen juntos', 4.3, 8.4, { al: 'center', tam: 12, fondo: false, escribe: tramo(t, 0.75, 1) });
    }
    // paso 5: el arco con sus colores
    function colores() {
      const E = [8, 8.4], esc = 0.17, a = suave(tramo(t, 0.05, 0.6));
      g.fillStyle = c.suelo; g.fillRect(0, Y(8.4), w, h);
      for (let nm = 400; nm <= 700; nm += 3) {
        const n = N_VIOLETA + (N_ROJO - N_VIOLETA) * ((nm - 400) / 300), an = arco(n);
        arc(E[0], E[1], an * esc, 0, 180 * a, deLongitud(nm), 0.048, 0.95);
      }
      punto(E[0], E[1], 0.14, c.rotulo);
      const l = tramo(t, 0.55, 0.9);
      rotulo(`rojo: ${f1(aRojo)}°`, E[0] + aRojo * esc + 0.35, 6.3, { tam: 13.5, peso: 700, color: c.resalta, escribe: l });
      rotulo(`violeta: ${f1(aVioleta)}°`, E[0] + aVioleta * esc - 0.2, 7.55, { al: 'right', tam: 13.5, peso: 700, color: deLongitud(400), escribe: l });
      rotulo('tú', E[0], E[1] + 0.35, { al: 'center', tam: 12, fondo: false });
      rotulo(`n del agua: ${f3(N_ROJO)} (rojo) y ${f3(N_VIOLETA)} (violeta)`, 8, 0.7, { al: 'center', tam: 12.5, escribe: tramo(t, 0.7, 1) });
    }
    // paso 6: la cuenta
    function cuentas() {
      v.panel(1.5, 1.1, 13, 6.4); const o = 2.1;
      rotulo('cos²i = (n² − 1) / 3', o, 2.1, { tam: 17, fondo: false, peso: 700, escribe: tramo(t, 0.05, 0.25) });
      rotulo(`cos²i = (${f3(N * N)} − 1) / 3 = ${f3((N * N - 1) / 3)}  →  i = ${f1(i0)}°`, o, 3.1, { tam: 14.5, fondo: false, escribe: tramo(t, 0.25, 0.45) });
      rotulo(`sen r = sen i / n  →  r = ${f1(r0)}°`, o, 4.0, { tam: 14.5, fondo: false, escribe: tramo(t, 0.45, 0.62) });
      rotulo(`arcoíris = 4r − 2i = ${f1(a0)}°`, o, 5.0, { tam: 17, fondo: false, peso: 700, color: c.resalta, escribe: tramo(t, 0.62, 0.8) });
      rotulo(`rojo ${f1(aRojo)}° · violeta ${f1(aVioleta)}° · secundario ${f0(a2)}°`, o, 6.2, { tam: 14, fondo: false, escribe: tramo(t, 0.8, 1) });
    }

    if (paso === 0) montaje();
    if (paso === 1) entrada();
    if (paso === 2) rebote();
    if (paso === 3) amontona();
    if (paso === 4) colores();
    if (paso === 5 && !foto) cuentas();
  }

  const COLORES = ['cielo', 'cielo-alto', 'gota', 'rayo', 'sol', 'nube', 'suelo', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnFresnel, refracta, desv, ang, iMin, arco, arco2 };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: Arcoiris.pasos, dibuja: Arcoiris.dibuja, colores: Arcoiris.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); Arcoiris.abrirEnFresnel(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = Arcoiris;
