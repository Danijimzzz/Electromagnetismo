/* =====================================================================
   La jaula de Faraday: los 6 pasos de la animación (texto y dibujo), el
   sonido del trueno y de las chispas y el ejercicio que se abre en Ondas
   electromagnéticas (la señal del móvil, de 900 MHz, que entra en la chapa
   de aluminio de un ascensor: profundidad de penetración). El motor es
   fenomenos/animacion.js, los ayudantes de dibujo fenomenos/dibujo.js y la
   maqueta pagina.html. En Node (pruebas) solo se cargan los datos:
   pruebas/herramientas/fenomenos/jaula-faraday.js.
   ===================================================================== */
const JaulaFaraday = (() => {
  // modelo: móvil a 900 MHz; chapa de aluminio, σ = 3,5·10⁷ S/m, μ = μ₀; chapa de 1 mm; rayo de 30 kA
  const F = 9e8, SIGMA = 3.5e7, MU0 = 4 * Math.PI * 1e-7, CHAPA = 1e-3, RAYO = 30e3;
  const delta = 1 / Math.sqrt(Math.PI * F * MU0 * SIGMA), queda = (d) => Math.exp(-d / delta);
  const datos = { F, SIGMA, delta, lam: 3e8 / F, chapa: CHAPA, vecesDelta: CHAPA / delta, RAYO };
  const f1 = (x) => x.toFixed(1).replace('.', ',');

  const pasos = [
    { titulo: 'Un rayo cae sobre un coche', corto: 'Rayo', dato: { valor: '30 000 A', texto: 'lleva un rayo normal, durante unas decenas de microsegundos.' }, texto: 'En plena tormenta, un rayo cae sobre el techo de un coche. Dentro, los pasajeros ven el destello y oyen el trueno, pero no les pasa nada.\n\nNo es por las ruedas de goma: un rayo acaba de atravesar kilómetros de aire, y unos centímetros de caucho no lo paran. Es por la carrocería de metal, que rodea a los pasajeros por todas partes: el coche es una jaula de Faraday.' },
    { titulo: 'En un conductor, las cargas se van fuera', corto: 'Cargas', dato: { valor: 'E = 0', texto: 'dentro de un conductor en equilibrio.' }, texto: 'En un metal los electrones se mueven libremente. Si dentro hubiera campo eléctrico, los empujaría hasta que dejara de haberlo: en equilibrio, $E = 0$ en todo el metal.\n\nCon el teorema de Gauss en una superficie metida en el metal, que rodee el hueco: como $E = 0$ en toda ella, el flujo es 0 y no encierra carga, $Q_{int} = ε_0 ∮ E · dS = 0$. Toda la carga se queda en la superficie de fuera, y en el hueco, si no hay cargas dentro, tampoco hay campo.' },
    { titulo: 'La corriente del rayo va por fuera', corto: 'Corriente', dato: { valor: 'Una vez al año', texto: 'recibe un rayo, de media, cada avión de pasajeros.' }, texto: 'La corriente del rayo busca el camino de menos resistencia hasta el suelo: la chapa del coche, mucho mejor conductora que el aire o que una persona. Corre por fuera de la carrocería y salta al suelo desde los bajos, junto a las ruedas.\n\nLos aviones reciben rayos a menudo y siguen volando: la corriente entra por una punta, recorre el fuselaje por fuera y sale por la cola. Dentro, solo se ve el destello.' },
    { titulo: 'El campo de fuera no entra', corto: 'Pantalla', dato: { valor: 'E = 0 dentro', texto: 'del coche, aunque fuera haya un campo enorme bajo la nube.' }, texto: 'Bajo una nube de tormenta hay un campo eléctrico de decenas de kV/m. En la carrocería, ese campo mueve los electrones: arriba quedan cargas positivas y abajo negativas, y su campo anula el de fuera en todo el interior.\n\nLas líneas de campo acaban en la carrocería, perpendiculares a ella, y no entran. Es el apantallamiento electrostático: da igual la forma del hueco y el campo de fuera.' },
    { titulo: 'Sin cobertura en el ascensor', corto: 'Ascensor', dato: { valor: `δ = ${f1(delta * 1e6)} µm`, texto: 'entra la señal del móvil en el aluminio antes de bajar a un 37 %.' }, texto: `Con las ondas pasa algo parecido: en un metal, la onda induce corrientes que la frenan y se apaga en muy poca distancia, la profundidad de penetración $δ = 1/√(π f μ σ)$. Para la señal del móvil, de 900 MHz, en aluminio: $δ = 1/√(π · 9·10^8 · 4π·10^{−7} · 3,5·10^7) = ${f1(delta * 1e6)} "µm"$.\n\nUna chapa de 1 mm son ${Math.round(datos.vecesDelta)} veces δ: la onda queda multiplicada por $e^{−${Math.round(datos.vecesDelta)}}$, nada. La poca cobertura que hay entra por las rendijas de las puertas, que no son mucho más pequeñas que la onda, de 33 cm.`, dura: 11000 },
    { titulo: 'La jaula de Faraday', corto: 'Jaula', dato: { valor: '1836', texto: 'Faraday se metió en una jaula de metal cargada y no notó nada.' }, texto: 'Michael Faraday construyó una habitación forrada de metal, la cargó con un generador hasta que saltaban chispas por fuera y se metió dentro con un electroscopio: no detectó ninguna carga. No hace falta que sea una chapa: basta una rejilla con agujeros mucho más pequeños que la onda que se quiera parar.\n\nHoy se usa en la puerta del microondas, en los cables coaxiales, en las salas de resonancia magnética, en los trajes conductores de quienes trabajan en líneas de alta tensión y en las bolsas que bloquean la señal del móvil.', dura: 11000 },
  ];

  // ejercicio de Ondas electromagnéticas (formato de ondasem-v1): 900 MHz en aluminio, el campo a 10 µm
  const ejercicio = () => ({ modo: 'perdidas', er: '1', mr: '1', sigma: '3,5e7', valor: '9e8', E0: '1', d: '1e-5' });
  function abrirEnOndas(destino) {
    try { localStorage.setItem('ondasem-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const SUELO = 7.2, cam = { x: 8, y: 4.5, z: 1 };
  const CAMS = [{ x: 8, y: 4.4, z: 1 }, { x: 8.1, y: 5.9, z: 2.3 }, { x: 8.1, y: 5.0, z: 1.5 }, { x: 8, y: 4.4, z: 1.05 }, { x: 8, y: 4.5, z: 1 }, { x: 8, y: 4.5, z: 1 }];
  // contorno de la carrocería (de delante hacia atrás por arriba) y su techo
  const COCHE = [[5.6, 6.75], [5.6, 6.15], [6.4, 5.95], [7.0, 5.35], [9.1, 5.35], [9.8, 5.95], [10.6, 6.15], [10.6, 6.75]];
  const techo = (x) => { for (let j = 0; j < COCHE.length - 1; j++) { const [x0, y0] = COCHE[j], [x1, y1] = COCHE[j + 1]; if (x1 > x0 && x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); } return null; };
  // un punto a una fracción s de una línea quebrada
  const sobre = (pts, s) => { const ls = pts.slice(1).map((p, j) => Math.hypot(p[0] - pts[j][0], p[1] - pts[j][1])), tot = ls.reduce((a, b) => a + b, 0); let d = s * tot; for (let j = 0; j < ls.length; j++) { if (d <= ls[j]) { const u = d / ls[j]; return [pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]; } d -= ls[j]; } return pts[pts.length - 1]; };
  // «Pruébalo tú» del paso 5: espesor de la chapa
  const prueba = { etiqueta: 'el espesor de la chapa', min: 0, max: 20, paso: 1, valor: 10, um: 10,
    muestra: (um) => `${um} µm → queda el ${(100 * queda(um * 1e-6)).toFixed(um > 12 ? 2 : 1).replace('.', ',')} % de la onda`, cambia: (um) => { prueba.um = um; } };
  pasos[4].prueba = prueba;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(CAMS[paso], reloj, quieto);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto, r = quieto ? 0.15 : reloj;
    // el rayo cae cada 3 s y dura un poco
    const fase = r % 3, destello = quieto || foto ? 1 : fase < 0.45 ? 1 - fase / 0.45 : 0;

    if (paso <= 3) { tormenta(); coche(); }
    if (paso === 0 || paso === 2) rayo();
    if (paso === 1) cargas();
    if (paso === 2) corriente();
    if (paso === 3) campo();
    if (paso === 4) ascensor();
    if (paso === 5) jaula();
    rotulos();

    function tormenta() {
      const gr = g.createLinearGradient(0, 0, 0, Y(SUELO)); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, Y(SUELO));
      if (destello > 0 && (paso === 0 || paso === 2)) { g.fillStyle = rgba(c.destello, 0.35 * destello); g.fillRect(0, 0, w, Y(SUELO)); }
      g.fillStyle = c.nube; for (let j = 0; j < 12; j++) { g.beginPath(); g.arc(X(-1 + j * 1.6 + 0.4 * azar(j)), Y(0.3 + 0.5 * azar(j + 9)), (0.9 + 0.5 * azar(j + 3)) * v.K, 0, 2 * Math.PI); g.fill(); }
      g.fillStyle = c.suelo; g.fillRect(0, Y(SUELO), w, h - Y(SUELO));
      g.fillStyle = c.asfalto; g.fillRect(0, Y(SUELO), w, 0.35 * v.K);
      // lluvia
      g.strokeStyle = rgba(c.lluvia, 0.6); g.lineWidth = 1;
      for (let j = 0; j < 80; j++) { const x = -4 + azar(j) * 24, s = ((quieto ? 0.5 : r * (1.1 + 0.4 * azar(j + 40))) + azar(j + 80)) % 1, y = 1 + s * (SUELO - 1); g.beginPath(); g.moveTo(X(x), Y(y)); g.lineTo(X(x - 0.05), Y(y + 0.25)); g.stroke(); }
    }
    function coche() {
      g.fillStyle = c.carroceria; g.beginPath(); COCHE.forEach(([x, y], j) => (j ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.closePath(); g.fill();
      // ventanillas, con un pasajero tranquilo
      g.fillStyle = c.cristal; g.beginPath(); g.moveTo(X(7.15), Y(5.5)); g.lineTo(X(8.0), Y(5.5)); g.lineTo(X(8.0), Y(6.0)); g.lineTo(X(6.65), Y(6.0)); g.fill();
      g.beginPath(); g.moveTo(X(8.15), Y(5.5)); g.lineTo(X(9.0), Y(5.5)); g.lineTo(X(9.55), Y(6.0)); g.lineTo(X(8.15), Y(6.0)); g.fill();
      punto(8.55, 5.78, 0.17, c.persona); g.fillStyle = c.persona; g.fillRect(X(8.35), Y(5.92), 0.4 * v.K, 0.1 * v.K);
      g.strokeStyle = c.metal; g.lineWidth = Math.max(2, 0.07 * v.K); g.beginPath(); COCHE.forEach(([x, y], j) => (j ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.closePath(); g.stroke();
      for (const x of [6.5, 9.6]) { punto(x, 6.8, 0.4, c.rueda); punto(x, 6.8, 0.17, c.llanta); }
      g.fillStyle = c.faro; g.fillRect(X(10.45), Y(6.2), 0.15 * v.K, 0.15 * v.K);
    }
    function rayo() {
      if (destello <= 0) return;
      g.save(); g.strokeStyle = rgba(c.rayo, destello); g.lineWidth = Math.max(3, 0.1 * v.K); g.shadowColor = c.rayo; g.shadowBlur = 25 * destello; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(X(7.4), Y(-1)); let x = 7.4;
      for (let j = 1; j <= 10; j++) { x += (azar(j + Math.floor(r / 3) * 13) - 0.5) * 0.8; const y = -1 + (j / 10) * 6.35; g.lineTo(X(j === 10 ? 8.2 : x), Y(y)); }
      g.stroke(); g.restore();
    }
    // paso 2: la carga en la superficie de fuera y una superficie de Gauss dentro del metal
    function cargas() {
      const N = 26, borde = [...COCHE, COCHE[0]];
      for (let j = 0; j < N; j++) { const [x, y] = sobre(borde, (j + 0.5) / N); v.signo(x + (x - 8.1) * 0.06, y + (y - 6.1) * 0.12, 1, c.positivo, suave(tramo(t, 0.1 + 0.4 * (j / N), 0.3 + 0.4 * (j / N))), 0.7); }
      g.setLineDash([5, 4]); g.strokeStyle = c.gauss; g.lineWidth = 1.5; g.beginPath();
      COCHE.forEach(([x, y], j) => { const px = 8.1 + (x - 8.1) * 0.93, py = 6.08 + (y - 6.08) * 0.85; j ? g.lineTo(X(px), Y(py)) : g.moveTo(X(px), Y(py)); }); g.closePath(); g.stroke(); g.setLineDash([]);
    }
    // paso 3: la corriente del rayo por la chapa y el salto al suelo
    function corriente() {
      const a = suave(tramo(t, 0.1, 0.4)), ida = [[8.2, 5.35], [9.1, 5.35], [9.8, 5.95], [10.6, 6.15], [10.6, 6.75], [10.2, 6.95]], vuelta = [[8.2, 5.35], [7.0, 5.35], [6.4, 5.95], [5.6, 6.15], [5.6, 6.75], [5.95, 6.95]];
      for (const cam2 of [ida, vuelta]) for (let j = 0; j < 9; j++) { const s = ((quieto ? 0.3 : r * 0.9) + j / 9) % 1, [x, y] = sobre(cam2, s); punto(x, y - 0.03, 0.06, c.rayo, a); }
      for (const x of [10.2, 5.95]) if (!quieto && (r * 7 + x) % 1 < 0.5) { g.strokeStyle = rgba(c.rayo, a); g.lineWidth = 2; g.beginPath(); g.moveTo(X(x), Y(6.95)); g.lineTo(X(x + 0.08), Y(7.05)); g.lineTo(X(x - 0.05), Y(7.12)); g.lineTo(X(x + 0.03), Y(SUELO + 0.02)); g.stroke(); }
    }
    // paso 4: líneas de campo entre la nube y el suelo que acaban en la carrocería
    function campo() {
      const a = suave(tramo(t, 0.05, 0.4));
      g.strokeStyle = rgba(c.campo, 0.85 * a); g.lineWidth = Math.max(1.2, 0.03 * v.K);
      for (let x = -3.75; x <= 19.8; x += 0.5) {
        const top = techo(x), y0 = 1.2;
        if (top === null) { g.beginPath(); g.moveTo(X(x), Y(SUELO)); g.lineTo(X(x), Y(y0)); g.stroke(); v.flecha(x, 3.4, x, 3.1, rgba(c.campo, a), 1, 0.025); continue; }
        g.beginPath(); g.moveTo(X(x), Y(top)); g.lineTo(X(x), Y(y0)); g.stroke(); v.flecha(x, 3.4, x, 3.1, rgba(c.campo, a), 1, 0.025);
        g.beginPath(); g.moveTo(X(x), Y(SUELO)); g.lineTo(X(x), Y(6.85)); g.stroke();
      }
      const b = suave(tramo(t, 0.3, 0.7));
      for (let x = 7.2; x <= 9.0; x += 0.45) v.signo(x, 5.15, 1, c.positivo, b, 0.75);
      for (let x = 5.9; x <= 10.3; x += 0.55) v.signo(x, 6.6, -1, c.negativo, b, 0.75);
      for (let x = 0; x <= 16; x += 1.2) v.signo(x + 0.3, 1.2, -1, c.negativo, a, 0.8);
    }
    // paso 5: el ascensor, con la antena y la señal que rebota en la cabina
    function ascensor() {
      g.fillStyle = c.cielo; g.fillRect(0, 0, w, h);
      g.fillStyle = c.edificio; g.fillRect(X(7.2), Y(0.6), 6.8 * v.K, 7.4 * v.K);
      g.fillStyle = c.hueco; g.fillRect(X(9.4), Y(0.9), 2.8 * v.K, 7.1 * v.K);
      g.fillStyle = c.suelo; g.fillRect(0, Y(8.0), w, h - Y(8.0));
      // antena de telefonía
      g.strokeStyle = c.torre; g.lineWidth = Math.max(1.5, 0.04 * v.K); g.beginPath(); g.moveTo(X(1.6), Y(8)); g.lineTo(X(2.1), Y(2.4)); g.lineTo(X(2.6), Y(8)); g.moveTo(X(1.8), Y(6)); g.lineTo(X(2.4), Y(6)); g.moveTo(X(1.95), Y(4)); g.lineTo(X(2.25), Y(4)); g.stroke();
      g.fillStyle = c.torre; g.fillRect(X(2.0), Y(2.2), 0.2 * v.K, 0.5 * v.K);
      // la cabina de metal
      const cx0 = 9.7, cx1 = 11.9, cy0 = 3.8, cy1 = 6.8;
      g.fillStyle = c.cabina; g.fillRect(X(cx0), Y(cy0), (cx1 - cx0) * v.K, (cy1 - cy0) * v.K);
      g.strokeStyle = c.metal; g.lineWidth = Math.max(3, 0.1 * v.K); g.strokeRect(X(cx0), Y(cy0), (cx1 - cx0) * v.K, (cy1 - cy0) * v.K);
      g.strokeStyle = c.cable; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(10.8), Y(0.9)); g.lineTo(X(10.8), Y(cy0)); g.stroke();
      // persona con el móvil sin barras
      punto(10.6, 4.6, 0.2, c.persona); g.fillStyle = c.persona; g.fillRect(X(10.4), Y(4.85), 0.4 * v.K, 1.2 * v.K); g.fillRect(X(10.45), Y(6.05), 0.12 * v.K, 0.75 * v.K); g.fillRect(X(10.63), Y(6.05), 0.12 * v.K, 0.75 * v.K);
      g.fillStyle = c.movil; g.fillRect(X(10.85), Y(4.9), 0.18 * v.K, 0.32 * v.K);
      // frentes de onda que salen de la antena y rebotan en la chapa
      // las ondas llegan hasta la chapa de la cabina y no pasan
      g.save(); g.beginPath(); g.rect(0, 0, X(cx0), h); g.clip();
      for (let j = 0; j < 7; j++) {
        const s = ((quieto ? 0.4 : r * 0.35) + j / 7) % 1, R = s * 9;
        g.strokeStyle = rgba(c.onda, 0.8 * (1 - 0.6 * s)); g.lineWidth = Math.max(1.5, 0.04 * v.K);
        g.beginPath(); g.arc(X(2.1), Y(2.4), R * v.K, -0.35, 0.75); g.stroke();
      }
      g.restore();
      if (!foto) chapa();
    }
    // panel: la amplitud de la onda dentro de la chapa, e^(−x/δ)
    function chapa() {
      v.pantalla();
      const x0 = 0.3, y0 = 0.3, an = 5.6, al = 3.0, xm = 20, gx = (um) => x0 + 0.5 + (um / xm) * (an - 0.8), gy = (q) => y0 + al - 0.5 - q * (al - 1.0);
      v.panel(x0, y0, an, al);
      g.fillStyle = rgba(c.metal, 0.25); g.fillRect(X(gx(0)), Y(gy(1.05)), (gx(prueba.um) - gx(0)) * v.K, (gy(0) - gy(1.05)) * v.K);
      g.strokeStyle = rgba(c.rotulo, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(X(gx(0)), Y(gy(1.05))); g.lineTo(X(gx(0)), Y(gy(0))); g.lineTo(X(gx(xm)), Y(gy(0))); g.stroke();
      g.strokeStyle = c.onda; g.lineWidth = 2.5; g.beginPath();
      for (let um = 0; um <= xm; um += 0.2) { const q = queda(um * 1e-6); um ? g.lineTo(X(gx(um)), Y(gy(q))) : g.moveTo(X(gx(um)), Y(gy(q))); }
      g.stroke();
      punto(gx(prueba.um), gy(queda(prueba.um * 1e-6)), 0.08, c.resalta);
      rotulo('amplitud dentro del aluminio', x0 + 0.3, y0 + 0.3, { tam: 11.5, peso: 700, fondo: false });
      rotulo('profundidad (µm) →', x0 + an - 0.2, y0 + al - 0.22, { al: 'right', tam: 10.5, fondo: false });
      rotulo('δ', gx(delta * 1e6), gy(0) + 0.25, { al: 'center', tam: 11, fondo: false });
      rotulo(`chapa de ${prueba.um} µm`, gx(prueba.um) + 0.15, gy(queda(prueba.um * 1e-6)) - 0.3, { tam: 11, fondo: false, color: c.resalta });
    }
    // paso 6: la jaula de Faraday con chispas por fuera
    function jaula() {
      g.fillStyle = c.sala; g.fillRect(0, 0, w, h);
      g.fillStyle = c.suelo; g.fillRect(0, Y(7.4), w, h - Y(7.4));
      // generador: una esfera sobre una columna
      g.fillStyle = c.columna; g.fillRect(X(3.3), Y(3.6), 0.5 * v.K, 3.8 * v.K);
      const gr = g.createRadialGradient(X(3.4), Y(2.9), 0.1 * v.K, X(3.55), Y(3.1), 0.9 * v.K); gr.addColorStop(0, c.brillo); gr.addColorStop(1, c.metal);
      g.fillStyle = gr; g.beginPath(); g.arc(X(3.55), Y(3.1), 0.85 * v.K, 0, 2 * Math.PI); g.fill();
      // jaula
      const jx0 = 7.2, jx1 = 11.2, jy0 = 2.6, jy1 = 7.4;
      g.strokeStyle = c.metal; g.lineWidth = Math.max(1.2, 0.03 * v.K); g.beginPath();
      for (let x = jx0; x <= jx1 + 1e-9; x += 0.4) { g.moveTo(X(x), Y(jy0)); g.lineTo(X(x), Y(jy1)); }
      for (let y = jy0; y <= jy1 + 1e-9; y += 0.4) { g.moveTo(X(jx0), Y(y)); g.lineTo(X(jx1), Y(y)); }
      g.stroke();
      // Faraday sentado con su electroscopio
      punto(9.0, 5.1, 0.24, c.persona); g.fillStyle = c.persona; g.fillRect(X(8.75), Y(5.4), 0.5 * v.K, 1.1 * v.K); g.fillRect(X(8.75), Y(6.4), 1.0 * v.K, 0.22 * v.K); g.fillRect(X(9.55), Y(6.4), 0.18 * v.K, 1.0 * v.K);
      g.fillStyle = c.mesa; g.fillRect(X(10.0), Y(6.3), 0.9 * v.K, 0.1 * v.K); g.fillRect(X(10.4), Y(6.4), 0.1 * v.K, 1.0 * v.K);
      g.strokeStyle = c.rotulo; g.lineWidth = 1.5; g.beginPath(); g.arc(X(10.45), Y(5.95), 0.3 * v.K, 0, 2 * Math.PI); g.stroke();
      g.beginPath(); g.moveTo(X(10.45), Y(5.65)); g.lineTo(X(10.45), Y(5.95)); g.lineTo(X(10.4), Y(6.15)); g.moveTo(X(10.45), Y(5.95)); g.lineTo(X(10.5), Y(6.15)); g.stroke();
      // chispas del generador a la jaula
      if (destello > 0 || quieto) { g.save(); g.strokeStyle = c.rayo; g.lineWidth = Math.max(2, 0.05 * v.K); g.shadowColor = c.rayo; g.shadowBlur = 15; g.globalAlpha = quieto ? 1 : destello; g.beginPath(); let y = 3.1; g.moveTo(X(4.35), Y(y)); for (let j = 1; j <= 8; j++) { y += (azar(j + Math.floor(r / 3) * 7) - 0.5) * 0.5; g.lineTo(X(4.35 + (j / 8) * (jx0 - 4.35)), Y(j === 8 ? 3.4 : y)); } g.stroke(); g.restore(); }
    }
    function rotulos() {
      if (paso === 0) {
        rotulo('rayo: unos 30 000 A', 9.0, 2.7, { peso: 700, escribe: tramo(t, 0.2, 0.45) });
        rotulo('dentro: E = 0, no pasa nada', 8.1, 4.65, { al: 'center', escribe: tramo(t, 0.5, 0.8) });
      }
      if (paso === 1) {
        rotulo('la carga, por fuera', 8.1, 4.85, { al: 'center', tam: 12.5, color: c.positivo, peso: 700, escribe: tramo(t, 0.3, 0.55) });
        rotulo('superficie de Gauss: no encierra carga', 8.1, 7.45, { al: 'center', tam: 12, color: c.gauss, escribe: tramo(t, 0.55, 0.85) });
      }
      if (paso === 2) rotulo('la corriente va por la chapa', 8.1, 4.4, { al: 'center', peso: 700, escribe: tramo(t, 0.4, 0.7) });
      if (paso === 3) rotulo('las líneas acaban en la chapa: dentro, E = 0', 8.1, 4.4, { al: 'center', peso: 700, escribe: tramo(t, 0.5, 0.8) });
      if (paso === 4) {
        rotulo('900 MHz, λ = 33 cm', 4.5, 7.4, { al: 'center', tam: 12, color: c.onda, peso: 700, escribe: tramo(t, 0.2, 0.45) });
        rotulo('sin cobertura', 10.8, 3.35, { al: 'center', tam: 12, peso: 700, escribe: tramo(t, 0.5, 0.75) });
      }
      if (paso === 5) {
        rotulo('generador: chispas por fuera', 3.55, 1.7, { al: 'center', tam: 12, escribe: tramo(t, 0.15, 0.4) });
        rotulo('dentro, el electroscopio no se mueve', 9.2, 2.15, { al: 'center', tam: 12, peso: 700, escribe: tramo(t, 0.45, 0.75) });
      }
    }
  }

  /* ---------------- sonido (opcional, apagado al abrir) ---------------- */
  // un trueno con cada rayo (ruido grave que se apaga) y chisporroteo en la jaula
  function sonido(ac) {
    const ruido = ac.createBuffer(1, ac.sampleRate * 2.5, ac.sampleRate), d = ruido.getChannelData(0);
    let u = 0; for (let j = 0; j < d.length; j++) { u = 0.97 * u + 0.03 * (Math.random() * 2 - 1); d[j] = 6 * u * Math.exp(-j / (ac.sampleRate * 0.7)); }
    let antes = -1;
    return {
      cuadro({ paso, reloj, quieto }) {
        if (quieto) return;
        const n = Math.floor(reloj / 3);
        if (n !== antes && (paso === 0 || paso === 2 || paso === 5)) {
          antes = n;
          const s = ac.createBufferSource(), fil = ac.createBiquadFilter(), vol = ac.createGain();
          s.buffer = ruido; fil.type = paso === 5 ? 'highpass' : 'lowpass'; fil.frequency.value = paso === 5 ? 2000 : 300; vol.gain.value = paso === 5 ? 0.25 : 0.6;
          s.connect(fil).connect(vol).connect(ac.destination); s.start(); s.stop(ac.currentTime + (paso === 5 ? 0.3 : 2.5));
        }
      },
    };
  }

  const COLORES = ['cielo', 'cielo-alto', 'destello', 'nube', 'suelo', 'asfalto', 'lluvia', 'carroceria', 'cristal', 'persona', 'metal', 'rueda', 'llanta', 'faro', 'rayo', 'positivo', 'negativo', 'gauss', 'campo',
    'edificio', 'hueco', 'torre', 'cabina', 'cable', 'movil', 'onda', 'sala', 'columna', 'brillo', 'mesa', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, sonido, COLORES, ejercicio, abrirEnOndas, queda };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: JaulaFaraday.pasos, dibuja: JaulaFaraday.dibuja, colores: JaulaFaraday.COLORES, sonido: JaulaFaraday.sonido });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); JaulaFaraday.abrirEnOndas(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = JaulaFaraday;
