/* =====================================================================
   El pájaro posado en un cable: los 6 pasos de la animación (texto y dibujo)
   y el circuito que se abre en Circuitos de corriente continua (500 A por la
   línea, el trozo de cable entre las patas en paralelo con el pájaro y la
   carga que deja la línea a 400 kV). El motor es fenomenos/animacion.js, los
   ayudantes de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node
   (pruebas) solo se cargan los datos: pruebas/herramientas/fenomenos/pajaro-cable.js.
   ===================================================================== */
const PajaroCable = (() => {
  // modelo: 500 A por un cable de aluminio de 0,1 Ω/km, patas a 5 cm, pájaro de 10 kΩ y línea a 400 kV
  const I = 500, RKM = 0.1, SEP = 0.05, RAVE = 10e3, VLINEA = 400e3;
  const Rcable = (RKM / 1000) * SEP, dV = I * Rcable;
  const datos = { I, RKM, SEP, RAVE, VLINEA, Rcable, dV, Iave: dV / RAVE, Ipeligro: VLINEA / RAVE, Rcarga: VLINEA / I };
  const f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ',');

  const pasos = [
    { titulo: 'Un pájaro en una línea de alta tensión', corto: 'Línea', dato: { valor: '400 kV', texto: 'entre cada cable de la línea y el suelo.' }, texto: 'Las líneas que cruzan el campo llevan la electricidad a 400 000 voltios. Si tocases uno de esos cables desde el suelo, morirías al instante. Y sin embargo los pájaros se posan en ellos tan tranquilos.\n\n¿Tienen algo especial? No: les salva cómo están colocados.' },
    { titulo: 'Por el cable pasan 500 A', corto: 'Corriente', dato: { valor: '500 A', texto: 'pueden pasar por cada cable de una línea grande.' }, texto: 'Por cada cable circula una corriente enorme, del orden de cientos de amperios. Los cables son de aluminio con alma de acero y muy gruesos, así que su resistencia es pequeñísima: unos $0,1 "Ω/km"$.\n\nPor eso casi no se pierde tensión a lo largo del cable: en un kilómetro, $ΔV = I R = 500 "A" · 0,1 "Ω" = 50 "V"$, nada al lado de 400 kV.' },
    { titulo: 'Entre las patas casi no hay tensión', corto: 'Patas', dato: { valor: 'ΔV = 2,5 mV', texto: 'entre una pata y la otra.' }, texto: 'Las patas del pájaro están a unos 5 cm. El trozo de cable que queda entre ellas tiene una resistencia de $R = 0,1 "Ω/km" · 0,05 "m" = 5 "µΩ"$.\n\nLa diferencia de potencial entre una pata y otra es la ley de Ohm aplicada a ese trozo: $ΔV = I R = 500 "A" · 5 "µΩ" = 2,5 "mV"$. Menos que la de una pila de reloj.' },
    { titulo: 'El pájaro, en paralelo con el cable', corto: 'Paralelo', dato: { valor: '0,25 µA', texto: 'es lo que pasa por el pájaro: el resto sigue por el cable.' }, texto: 'El pájaro y el trozo de cable están en paralelo entre los mismos dos puntos. La corriente se reparte al revés que las resistencias: casi toda va por el cable (5 µΩ) y casi nada por el pájaro (unos 10 kΩ).\n\nPor el pájaro pasan $I = ΔV/R = (2,5 "mV")/(10 "kΩ") = 0,25 "µA"$, cien veces menos de lo que se puede llegar a notar.' },
    { titulo: 'Lo que cuenta es la diferencia de potencial', corto: 'Diferencia', dato: { valor: '400 kV − 400 kV = 0', texto: 'El pájaro está entero al potencial del cable.' }, texto: 'Respecto del suelo, el pájaro está a 400 kV, igual que el cable. Pero la corriente no depende del potencial de un punto, sino de la diferencia entre dos. Si todo el pájaro está al mismo potencial, por él no pasa nada.\n\nSolo al posarse hay un pequeño reajuste: el pájaro se carga hasta los 400 kV del cable con una corriente minúscula y brevísima, la misma que tendría un condensador diminuto.' },
    { titulo: 'El peligro: tocar dos cosas a la vez', corto: 'Peligro', dato: { valor: 'unos 40 A', texto: 'pasarían por un ave que tocase el cable y la torre a la vez.' }, texto: 'Si un ave grande, como un águila o una cigüeña, toca a la vez el cable y la torre (que está unida a tierra) o dos cables distintos, entre sus dos puntos de contacto hay toda la tensión de la línea.\n\nCon 400 kV y unos 10 kΩ pasarían $I = (400 "kV")/(10 "kΩ") = 40 "A"$: la descarga la mata al instante. Por eso en las torres de las zonas con aves se aíslan los cables cerca de los apoyos y se ponen posaderos lejos de ellos.', dura: 12000 },
  ];

  // esquema del Simulador de circuitos: la línea como una fuente de corriente de 500 A que pasa por el trozo de cable entre las patas (R1) con el pájaro en paralelo (R2) hasta la carga (R3)
  const ejercicio = () => ({"version":2,"componentes":[{"id":"I1","t":"I","x":0,"y":6,"rot":3,"espejo":false,"v":{"forma":"cc","v":"500","A":"5","eficaz":"de pico","f":"50","fase":"0","off":"0","duty":"50","v1":"0","v2":"5","t0":"0","td":"0","tr":"0","tf":"0","pw":"1m","per":"2m"}},{"id":"R1","t":"R","x":0,"y":2,"rot":0,"espejo":false,"v":{"R":"5µ"}},{"id":"R2","t":"R","x":0,"y":-2,"rot":0,"espejo":false,"v":{"R":"10k"}},{"id":"R3","t":"R","x":4,"y":2,"rot":1,"espejo":false,"v":{"R":"800"}},{"id":"GND1","t":"GND","x":0,"y":6,"rot":0,"espejo":false,"v":{}}],"cables":[{"a":[0,2],"b":[0,2]},{"a":[0,2],"b":[0,-2]},{"a":[4,2],"b":[4,-2]},{"a":[0,6],"b":[4,6]}],"analisis":{},"vista":null});
  function abrirEnCircuitos(destino) {
    try { localStorage.setItem('simulador-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const SUELO = 7.9, XA = 2.4, XB = 13.6, ALTURAS = [2.6, 3.7, 4.8], COMBA = 0.6, PAJARO = 8;
  // cable i a la altura x (cuelga un poco en el centro)
  const cable = (i, x) => ALTURAS[i] + COMBA * (1 - ((x - (XA + XB) / 2) / ((XB - XA) / 2)) ** 2);
  const PATAS = [PAJARO - 0.15, PAJARO + 0.15], cam = { x: 8, y: 4.5, z: 1 };
  // «Pruébalo tú» del paso 4: separación entre las patas en cm
  const prueba = { etiqueta: 'la separación entre las patas', min: 1, max: 50, paso: 1, valor: 5, cm: 5,
    muestra: (cm) => { const d = I * (RKM / 1000) * (cm / 100); return `${cm} cm → ΔV = ${f1(d * 1e3)} mV, por el pájaro ${f2((d / RAVE) * 1e6)} µA`; },
    cambia: (cm) => { prueba.cm = cm; } };
  pasos[3].prueba = prueba;
  const camaraDe = (paso) => paso === 2 || paso === 3 ? { x: PAJARO, y: cable(1, PAJARO) - 0.35, z: 4.5 } : paso === 5 ? { x: 12.2, y: 3.2, z: 1.9 } : { x: 8, y: 4.5, z: 1 };

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(camaraDe(paso), reloj, quieto);
    const { X, Y, rotulo, punto } = v;
    const yCable = cable(1, PAJARO);

    paisaje();
    torre(1.4, -1); torre(14.6, 1);
    cables();
    if (paso === 1 || paso === 2 || paso === 3) corriente();
    if (paso === 2 || paso === 3) entrePatas();
    pajaro();
    if (paso === 4) potenciales();
    if (paso === 5) aguila();
    v.pantalla();
    if (paso === 0) rotulo('400 kV', 15.6, cable(0, 13) - 0.2, { al: 'right', peso: 700, color: c.alta, escribe: tramo(t, 0.5, 0.8) });
    if (paso === 1) rotulo('I = 500 A', 4.2, cable(1, 4.2) + 0.55, { peso: 700, color: c.corriente, escribe: tramo(t, 0.2, 0.5) });
    if (paso === 3) circuito();

    function paisaje() {
      const gr = g.createLinearGradient(0, 0, 0, Y(SUELO)); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = c.colina; g.beginPath(); g.moveTo(0, Y(SUELO)); for (let x = v.x0 - 1; x <= v.x1 + 1; x += 0.25) g.lineTo(X(x), Y(SUELO - 0.6 - 0.45 * Math.sin(x * 0.7) - 0.25 * Math.sin(x * 1.9 + 1))); g.lineTo(w, Y(SUELO)); g.closePath(); g.fill();
      g.fillStyle = c.suelo; g.fillRect(0, Y(SUELO), w, h - Y(SUELO));
      // nubes que pasan despacio
      g.fillStyle = rgba(c.nube, 0.8);
      for (let j = 0; j < 4; j++) { const x = ((azar(j) * 20 + reloj * 0.08 * (1 + azar(j + 4))) % 20) - 2, y = 0.7 + 0.8 * azar(j + 8); for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(X(x + q * 0.45), Y(y - (q === 1 ? 0.15 : 0)), (0.35 + 0.1 * (q === 1)) * v.K, 0, 2 * Math.PI); g.fill(); } }
    }
    // torre metálica de celosía con sus tres brazos (lado = −1 a la izquierda, 1 a la derecha)
    function torre(x, lado) {
      g.strokeStyle = c.torre; g.lineWidth = Math.max(1.5, 0.06 * v.K);
      const base = 0.9, cima = 1.9;
      g.beginPath(); g.moveTo(X(x - base / 2), Y(SUELO)); g.lineTo(X(x - 0.12), Y(cima)); g.lineTo(X(x + 0.12), Y(cima)); g.lineTo(X(x + base / 2), Y(SUELO)); g.stroke();
      g.lineWidth = Math.max(1, 0.025 * v.K); g.beginPath();
      for (let y = cima + 0.3; y < SUELO; y += 0.5) { const a1 = ((y - cima) / (SUELO - cima)) * (base / 2 - 0.12) + 0.12, a2 = ((y + 0.5 - cima) / (SUELO - cima)) * (base / 2 - 0.12) + 0.12; g.moveTo(X(x - a1), Y(y)); g.lineTo(X(x + a2), Y(Math.min(SUELO, y + 0.5))); g.moveTo(X(x + a1), Y(y)); g.lineTo(X(x - a2), Y(Math.min(SUELO, y + 0.5))); }
      g.stroke();
      // brazos y aisladores
      g.lineWidth = Math.max(1.5, 0.07 * v.K);
      for (const y of ALTURAS) {
        const fin = x - lado * 1.2; g.strokeStyle = c.torre; g.beginPath(); g.moveTo(X(x), Y(y - 0.35)); g.lineTo(X(fin), Y(y - 0.35)); g.stroke();
        g.strokeStyle = c.aislador; g.lineWidth = Math.max(2, 0.09 * v.K); g.beginPath(); g.moveTo(X(fin), Y(y - 0.35)); g.lineTo(X(fin), Y(y)); g.stroke(); g.lineWidth = Math.max(1.5, 0.07 * v.K);
      }
    }
    function cables() {
      g.strokeStyle = c.cable; g.lineWidth = Math.max(1.5, 0.06 * v.K);
      for (let i = 0; i < 3; i++) { g.beginPath(); for (let x = XA; x <= XB + 1e-9; x += 0.1) x === XA ? g.moveTo(X(x), Y(cable(i, x))) : g.lineTo(X(x), Y(cable(i, x))); g.stroke(); }
    }
    // electrones que corren por el cable del pájaro
    function corriente() {
      const a = paso === 1 ? suave(tramo(t, 0, 0.3)) : 0.7;
      for (let j = 0; j < 60; j++) { const x = XA + ((azar(j) * (XB - XA) + reloj * 1.6) % (XB - XA)); punto(x, cable(1, x) + (azar(j + 9) - 0.5) * 0.03 / cam.z, 0.035 * Math.min(1, 1.6 / cam.z), c.corriente, a); }
      if (paso === 1) for (const x of [4, 11.5]) v.flecha(x - 0.5, cable(1, x - 0.5) + 0.25, x + 0.5, cable(1, x + 0.5) + 0.25, c.corriente, tramo(t, 0.2, 0.4));
    }
    // pasos 3 y 4: el trozo de cable entre las patas y la tensión entre ellas
    function entrePatas() {
      const sep = paso === 3 ? (prueba.cm / 5) * 0.3 : 0.3, xa = PAJARO - sep / 2, xb = PAJARO + sep / 2, u = paso === 2 ? suave(tramo(t, 0.1, 0.5)) : 1;
      g.strokeStyle = rgba(c.resalta, 0.8 * u); g.lineWidth = 0.05 * v.K; g.beginPath(); for (let x = xa; x <= xb + 1e-9; x += 0.02) x === xa ? g.moveTo(X(x), Y(cable(1, x))) : g.lineTo(X(x), Y(cable(1, x))); g.stroke();
      if (paso === 2) {
        rotulo('5 cm de cable: R = 5 µΩ', PAJARO, yCable + 0.28, { al: 'center', tam: 13, peso: 600, color: c.resalta, escribe: tramo(t, 0.3, 0.55) });
        rotulo('ΔV = I R = 2,5 mV', PAJARO, yCable + 0.48, { al: 'center', tam: 13.5, peso: 700, escribe: tramo(t, 0.6, 0.85) });
      }
    }
    function pajaro() {
      // llega volando en el paso 1
      const llega = paso === 0 ? suave(tramo(t, 0, 0.7)) : 1, aleteo = paso === 0 && llega < 1 ? Math.sin(reloj * 22) : 0;
      const x = PAJARO - 4 * (1 - llega), y = yCable - 0.32 - 2.2 * (1 - llega) ** 2;
      const sep = paso === 3 ? (prueba.cm / 5) * 0.3 : 0.3;
      ave(x, y, 1, aleteo, llega >= 1 ? [PAJARO - sep / 2, PAJARO + sep / 2] : null);
    }
    // un ave con el pecho más claro; patas = [x1, x2] posadas en el cable o null (volando)
    function ave(x, y, e, aleteo, patas, alaAbierta = 0) {
      g.strokeStyle = c.pico; g.lineWidth = Math.max(1, 0.025 * v.K * e);
      if (patas) { g.beginPath(); for (const xp of patas) { g.moveTo(X(x + (xp - x) * 0.4), Y(y + 0.1 * e)); g.lineTo(X(xp), Y(cable(1, xp) - 0.02)); } g.stroke(); }
      g.fillStyle = c.ave; g.beginPath(); g.ellipse(X(x), Y(y), 0.32 * e * v.K, 0.2 * e * v.K, -0.15, 0, 2 * Math.PI); g.fill();
      g.beginPath(); g.moveTo(X(x - 0.25 * e), Y(y - 0.03 * e)); g.lineTo(X(x - 0.55 * e), Y(y + 0.12 * e)); g.lineTo(X(x - 0.5 * e), Y(y - 0.02 * e)); g.fill();
      g.fillStyle = c['ave-pecho']; g.beginPath(); g.ellipse(X(x + 0.08 * e), Y(y + 0.06 * e), 0.2 * e * v.K, 0.12 * e * v.K, -0.1, 0, 2 * Math.PI); g.fill();
      g.fillStyle = c.ave; g.beginPath(); g.arc(X(x + 0.28 * e), Y(y - 0.17 * e), 0.13 * e * v.K, 0, 2 * Math.PI); g.fill();
      g.fillStyle = c.pico; g.beginPath(); g.moveTo(X(x + 0.39 * e), Y(y - 0.19 * e)); g.lineTo(X(x + 0.52 * e), Y(y - 0.15 * e)); g.lineTo(X(x + 0.39 * e), Y(y - 0.12 * e)); g.fill();
      g.fillStyle = c.ojo; g.beginPath(); g.arc(X(x + 0.32 * e), Y(y - 0.2 * e), 0.025 * e * v.K, 0, 2 * Math.PI); g.fill();
      // ala: plegada, aleteando o abierta del todo
      g.fillStyle = c['ave-ala']; g.beginPath();
      if (alaAbierta) { g.moveTo(X(x - 0.1 * e), Y(y - 0.1 * e)); g.lineTo(X(x - 1.6 * e * alaAbierta), Y(y - 0.2 * e + 0.5 * e * alaAbierta)); g.lineTo(X(x + 0.15 * e), Y(y + 0.05 * e)); }
      else { const a = aleteo * 0.5; g.moveTo(X(x - 0.15 * e), Y(y - 0.05 * e)); g.lineTo(X(x - 0.05 * e), Y(y - (0.1 + 0.45 * a) * e)); g.lineTo(X(x + 0.2 * e), Y(y - 0.02 * e)); }
      g.fill();
    }
    // paso 4: el circuito equivalente y el reparto de la corriente
    function circuito() {
      const x0 = 0.4, y0 = 0.4, a = suave(tramo(t, 0.15, 0.4));
      g.globalAlpha = a; v.panel(x0, y0, 5.6, 4); g.globalAlpha = 1;
      if (a <= 0) return;
      const d = I * (RKM / 1000) * (prueba.cm / 100), xa = x0 + 0.8, xb = x0 + 4.8, ya = y0 + 1.05, yb = y0 + 2.65;
      g.globalAlpha = a; g.strokeStyle = c.rotulo; g.lineWidth = 2;
      g.beginPath(); g.moveTo(X(x0 + 0.2), Y((ya + yb) / 2)); g.lineTo(X(xa), Y((ya + yb) / 2)); g.moveTo(X(xa), Y(ya)); g.lineTo(X(xa), Y(yb)); g.moveTo(X(xb), Y(ya)); g.lineTo(X(xb), Y(yb)); g.moveTo(X(xb), Y((ya + yb) / 2)); g.lineTo(X(x0 + 5.4), Y((ya + yb) / 2));
      g.moveTo(X(xa), Y(ya)); g.lineTo(X(xa + 1.2), Y(ya)); g.moveTo(X(xb - 1.2), Y(ya)); g.lineTo(X(xb), Y(ya)); g.moveTo(X(xa), Y(yb)); g.lineTo(X(xa + 1.2), Y(yb)); g.moveTo(X(xb - 1.2), Y(yb)); g.lineTo(X(xb), Y(yb)); g.stroke();
      g.fillStyle = c.panel; g.lineWidth = 2;
      for (const y of [ya, yb]) { g.fillRect(X(xa + 1.2), Y(y - 0.17), 1.6 * v.K, 0.34 * v.K); g.strokeRect(X(xa + 1.2), Y(y - 0.17), 1.6 * v.K, 0.34 * v.K); }
      g.globalAlpha = 1;
      rotulo('cable: 5 µΩ', xa + 2, ya - 0.42, { al: 'center', tam: 11.5, fondo: false });
      rotulo('pájaro: 10 kΩ', xa + 2, yb - 0.42, { al: 'center', tam: 11.5, fondo: false });
      rotulo('≈ 500 A', xa + 2, ya + 0.45, { al: 'center', tam: 12.5, peso: 700, color: c.corriente, fondo: false, escribe: tramo(t, 0.4, 0.6) });
      rotulo(`${f2((d / RAVE) * 1e6)} µA`, xa + 2, yb + 0.45, { al: 'center', tam: 12.5, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.55, 0.75) });
      rotulo(`ΔV = ${f1(d * 1e3)} mV`, x0 + 2.8, y0 + 3.6, { al: 'center', tam: 12, peso: 600, fondo: false, escribe: tramo(t, 0.7, 0.9) });
    }
    // paso 5: el potencial de cada cosa respecto del suelo
    function potenciales() {
      const a = suave(tramo(t, 0.1, 0.4));
      g.strokeStyle = rgba(c.alta, 0.35 * a); g.lineWidth = 0.18 * v.K; g.beginPath(); for (let x = XA; x <= XB + 1e-9; x += 0.1) x === XA ? g.moveTo(X(x), Y(cable(1, x))) : g.lineTo(X(x), Y(cable(1, x))); g.stroke();
      g.fillStyle = rgba(c.alta, 0.25 * a); g.beginPath(); g.ellipse(X(PAJARO + 0.05), Y(yCable - 0.4), 0.75 * v.K, 0.5 * v.K, 0, 0, 2 * Math.PI); g.fill();
      rotulo('cable: 400 kV', 3, cable(1, 3) - 0.35, { peso: 700, color: c.alta, escribe: tramo(t, 0.2, 0.4) });
      rotulo('pájaro: 400 kV', PAJARO, yCable - 1.15, { al: 'center', peso: 700, color: c.alta, escribe: tramo(t, 0.35, 0.55) });
      rotulo('suelo: 0 V', 8, SUELO + 0.45, { al: 'center', peso: 700, escribe: tramo(t, 0.5, 0.7) });
      rotulo('ΔV en el pájaro ≈ 0 → no pasa corriente', 8, 6.4, { al: 'center', peso: 600, tam: 14, escribe: tramo(t, 0.7, 0.95) });
    }
    // paso 6: un ave grande en el brazo de la torre que toca el cable con el ala
    function aguila() {
      const xa = 13.2, ya = ALTURAS[0] - 0.62, abre = suave(tramo(t, 0.15, 0.55)), toca = abre > 0.97;
      g.save(); g.translate(X(xa), Y(ya)); g.scale(-1, 1); g.translate(-X(xa), -Y(ya));
      ave(xa, ya, 1.6, 0, null, 0);
      g.restore();
      // ala abierta hacia el cable
      const punta = [XB - 0.15 + 0.6 * (1 - abre), cable(0, XB - 0.15) - 0.05 - 0.6 * (1 - abre)];
      g.fillStyle = c['ave-ala']; g.beginPath(); g.moveTo(X(xa - 0.1), Y(ya - 0.15)); g.lineTo(X(punta[0]), Y(punta[1])); g.lineTo(X(xa + 0.2), Y(ya + 0.1)); g.fill();
      g.strokeStyle = c.pico; g.lineWidth = Math.max(1, 0.04 * v.K); g.beginPath(); g.moveTo(X(xa - 0.1), Y(ya + 0.25)); g.lineTo(X(xa - 0.15), Y(ALTURAS[0] - 0.36)); g.moveTo(X(xa + 0.15), Y(ya + 0.25)); g.lineTo(X(xa + 0.2), Y(ALTURAS[0] - 0.36)); g.stroke();
      if (toca && !quieto) {
        const n = Math.floor(reloj * 25), d0 = 0.6 + 0.4 * Math.sin(reloj * 40);
        g.globalCompositeOperation = 'lighter';
        const gr = g.createRadialGradient(X(punta[0]), Y(punta[1]), 0, X(punta[0]), Y(punta[1]), 0.4 * v.K);
        gr.addColorStop(0, rgba(c['chispa-centro'], 0.7 * d0)); gr.addColorStop(1, rgba(c.chispa, 0)); g.fillStyle = gr; g.beginPath(); g.arc(X(punta[0]), Y(punta[1]), 0.4 * v.K, 0, 2 * Math.PI); g.fill();
        v.chispa(punta[0], punta[1], XB - 0.05, cable(0, XB - 0.05), n, rgba(c['chispa-centro'], d0), 0.03, 4);
        g.globalCompositeOperation = 'source-over';
      }
      if (toca || quieto) {
        v.flecha(punta[0] - 0.1, punta[1] + 0.05, xa - 0.05, ya + 0.15, c.chispa, 1, 0.04);
        v.flecha(xa + 0.15, ya + 0.3, xa + 0.2, ALTURAS[0] - 0.4, c.chispa, 1, 0.04);
        rotulo('400 kV entre el ala y la torre: unos 40 A', 11.6, 5.5, { al: 'center', peso: 700, tam: 13, color: c.chispa, escribe: tramo(t, 0.6, 0.85) });
      }
      rotulo('torre: 0 V (a tierra)', 14.6, 4.3, { al: 'center', tam: 12, escribe: tramo(t, 0.3, 0.5) });
    }
  }

  const COLORES = ['cielo', 'cielo-alto', 'nube', 'colina', 'suelo', 'torre', 'aislador', 'cable', 'corriente', 'resalta', 'alta', 'ave', 'ave-pecho', 'ave-ala', 'pico', 'ojo', 'chispa', 'chispa-centro', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnCircuitos };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: PajaroCable.pasos, dibuja: PajaroCable.dibuja, colores: PajaroCable.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); PajaroCable.abrirEnCircuitos(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = PajaroCable;
