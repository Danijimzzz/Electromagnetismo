/* =====================================================================
   La línea de alta tensión y el suelo: los 6 pasos de la animación (texto y
   dibujo) y la escena que se abre en Electrostática (el cable y su imagen
   por debajo del suelo, como dos hilos infinitos con ±λ). El motor es
   fenomenos/animacion.js, los ayudantes de dibujo fenomenos/dibujo.js y la
   maqueta pagina.html. En Node (pruebas) solo se cargan los datos:
   pruebas/herramientas/fenomenos/linea-alta-tension.js.
   ===================================================================== */
const LineaAltaTension = (() => {
  // modelo: un cable de 1,5 cm de radio a 10 m del suelo (en el punto más bajo) y a 133 kV respecto de tierra
  // (una línea de 230 kV entre fases: 230/√3); el suelo es un conductor plano
  const V = 133e3, H = 10, A = 0.015, EPS0 = 8.8541878128e-12;
  const cPrima = (h) => (2 * Math.PI * EPS0) / Math.log((2 * h) / A), lambda = (h) => cPrima(h) * V;
  // potencial a una altura y sobre el suelo (el cable y su imagen) y campo en el suelo
  const pot = (y, h = H) => (lambda(h) / (2 * Math.PI * EPS0)) * Math.log((h + y) / (h - y)), campo = (h) => lambda(h) / (Math.PI * EPS0 * h);
  const datos = { V, H, A, EPS0, C: cPrima(H), lambda: lambda(H), E0: campo(H), tubo: pot(1.7) - pot(0.5), persona: pot(1.8), corriente: 15e-6 * campo(H) / 1e3 };
  const f1 = (x) => x.toFixed(1).replace('.', ',');

  const pasos = [
    { titulo: 'Una línea de alta tensión', corto: 'Línea', dato: { valor: '133 kV', texto: 'tiene cada cable de una línea de 230 kV respecto del suelo.' }, texto: 'Las líneas que cruzan el campo llevan tres cables, uno por fase. En una de 230 kV, esa es la tensión entre dos cables; entre cada cable y el suelo hay $230/√3 ≈ 133 "kV"$.\n\nEs corriente alterna de 50 Hz: la tensión de cada cable sube y baja, y cambia de signo, cien veces por segundo. En el punto más bajo de la curva, el cable queda a unos 10 m del suelo.' },
    { titulo: 'El cable y el suelo forman un condensador', corto: 'Condensador', dato: { valor: 'C′ ≈ 7,7 pF/m', texto: 'de capacidad por cada metro de cable.' }, texto: 'El suelo húmedo conduce, así que el cable y el suelo son dos conductores separados por aire: un condensador. Si el cable tiene carga $+λ$ por metro, en el suelo de debajo aparece por inducción una carga negativa.\n\nPara calcularlo se usa el <b>método de las imágenes</b>: el suelo se cambia por un cable imagen con $−λ$ a 10 m por debajo. Con un cable de radio $a = 1,5 "cm"$ a $h = 10 "m"$:\n\n$C′ = {2πε_0}/{ln(2h/a)} = {2π · 8,85 · 10^{−12}}/{ln(1333)} ≈ 7,7 "pF/m"$' },
    { titulo: 'Una carga que va y viene', corto: 'Alterna', dato: { valor: 'λ ≈ 1 µC/m', texto: 'de carga en el cable, que cambia de signo 100 veces por segundo.' }, texto: 'La carga del cable es $λ = C′ V = 7,7 "pF/m" · 133 "kV" ≈ 1,03 "µC/m"$. Como la tensión es alterna, la carga también: la del cable y la del suelo cambian de signo a la vez, 50 veces por segundo en cada sentido.\n\nCon cientos de kilómetros de línea, esa carga que entra y sale es una corriente apreciable aunque nadie gaste energía: es la corriente capacitiva de la línea.' },
    { titulo: 'El campo eléctrico bajo la línea', corto: 'Campo', dato: { valor: 'E ≈ 3,7 kV/m', texto: 'de campo eléctrico en el suelo, justo debajo del cable.' }, texto: 'Las líneas de campo salen del cable y acaban en el suelo, perpendiculares a él. Justo debajo, los campos del cable y de su imagen apuntan igual y se suman:\n\n$E = 2 · {λ}/{2πε_0 h} = {λ}/{πε_0 h} = {1,03 · 10^{−6}}/{π · 8,85 · 10^{−12} · 10} ≈ 3,7 "kV/m"$\n\nEntre los pies y la cabeza de una persona de 1,8 m hay unos 6,7 kV, que cambian de signo con la alterna. No los notas porque tu cuerpo conduce y deforma el campo a su alrededor.', dura: 12000 },
    { titulo: 'Un fluorescente que se enciende solo', corto: 'Fluorescente', dato: { valor: '≈ 4,5 kV', texto: 'entre los extremos de un tubo de 1,2 m sostenido de pie.' }, texto: 'Un tubo fluorescente de 1,2 m sostenido en vertical, con su extremo de abajo a medio metro del suelo, tiene entre sus extremos:\n\n$ΔV = λ/(2πε_0) · [ln{h + y}/{h − y}]_{0,5}^{1,7} ≈ 4,5 "kV"$\n\nEso basta para ionizar el gas del tubo. Como la tensión es alterna, la carga va y viene por el gas cien veces por segundo y el tubo brilla, sin cables ni enchufe.\n\nEn 2004 el artista Richard Box clavó 1301 tubos en un campo bajo una línea cerca de Bristol: se encendían solos al anochecer.', dura: 12000 },
    { titulo: '¿Es peligroso?', corto: 'Peligro', dato: { valor: '≈ 50 µA', texto: 'de corriente por el cuerpo de alguien de pie debajo: unas 20 veces menos de lo que se nota.' }, texto: 'Por tu cuerpo, de pie bajo la línea, pasa hacia el suelo una corriente capacitiva de unos 15 µA por cada kV/m de campo: unos 50 µA aquí. Una corriente alterna empieza a notarse hacia 1 mA.\n\nLa Unión Europea recomienda no pasar de 5 kV/m donde está el público, y por eso los cables van a esa altura. Lo que sí puede dar un calambre es tocar algo metálico grande y aislado del suelo, como un coche o una valla larga: recoge más carga y la descarga entera pasa por tu mano.' },
  ];

  // escena del simulador de electrostática (formato de electro-sim-cur-v2): el cable y su imagen como dos hilos paralelos al eje Z
  // en el SI, con la diferencia de potencial cable–suelo, el campo en el suelo y a 1,5 m, y la tensión entre los extremos del tubo
  const l4 = (x) => x.toPrecision(4);
  const escenaElectrostatica = () => ({
    unit: 'a', mode: 'si', view: { plane: 'xy', cut: '0' }, kinds: {}, unknown: null,
    sources: [
      { id: 'cable', type: 'line', name: 'cable', pos: ['0', String(H), '0'], dir: 'z', mode: 'lambda', R: '1', s: { c: l4(datos.lambda), sym: '' } },
      { id: 'imagen', type: 'line', name: 'imagen', pos: ['0', String(-H), '0'], dir: 'z', mode: 'lambda', R: '1', s: { c: l4(-datos.lambda), sym: '' } },
    ],
    analyses: [
      { id: 'v-cable', type: 'dV', A: ['0', '0', '0'], B: ['0', String(H - A), '0'] },
      { id: 'e-suelo', type: 'E', P: ['0', '0', '0'] },
      { id: 'e-pecho', type: 'E', P: ['0', '1.5', '0'] },
      { id: 'v-tubo', type: 'dV', A: ['0', '0.5', '0'], B: ['0', '1.7', '0'] },
    ],
  });
  const ejercicio = () => ({
    ref: { kind: 'preset', id: 'fenomeno-linea-alta-tension' }, title: 'La línea de alta tensión y el suelo',
    statement: `Un cable de una línea de alta tensión, de radio 1,5 cm, está a 10 m sobre el suelo, que se toma como un plano conductor. Por el método de las imágenes, el suelo se sustituye por un hilo con −λ a 10 m por debajo. Con λ = ${l4(datos.lambda * 1e6).replace('.', ',')} µC/m, obtener la diferencia de potencial entre el cable y el suelo, el campo eléctrico en el suelo y a 1,5 m de altura, y la tensión entre los extremos de un tubo fluorescente vertical que va de 0,5 m a 1,7 m.`,
    scene: escenaElectrostatica(),
  });
  // escribe el ejercicio en el estado de Electrostática y la abre
  function abrirEnElectrostatica(destino) {
    try { localStorage.setItem('electro-sim-cur-v2', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  // 0,42 unidades del dibujo por metro; el cable cuelga entre dos torres y baja hasta 10 m en el centro
  const SUELO = 7.6, S = 0.42, TORRES = [1.2, 14.8], ALTO = 1.4, BAJO = SUELO - H * S, PERSONA = 9.2, cam = { x: 8, y: 4.5, z: 1 };
  const cableY = (x) => { const u = (x - 8) / (TORRES[1] - 8); return BAJO + (ALTO - BAJO) * u * u; };
  // «Pruébalo tú» del paso 4: altura del cable en metros
  const prueba = { etiqueta: 'la altura del cable', min: 6, max: 30, paso: 1, valor: 10, h: H,
    muestra: (h) => `${h} m → C′ = ${f1(cPrima(h) * 1e12)} pF/m y E en el suelo = ${f1(campo(h) / 1e3)} kV/m`,
    cambia: (h) => { prueba.h = h; } };
  pasos[3].prueba = prueba;
  const camaraDe = (paso) => (paso === 1 ? { x: 8, y: 7.4, z: 0.62 } : paso === 4 ? { x: PERSONA + 0.1, y: SUELO - 0.45, z: 4.2 } : { x: 8, y: 4.5, z: 1 });

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(camaraDe(paso), reloj, quieto);
    const { X, Y, rotulo, signo, punto } = v, foto = window.FenomenoFoto;
    // fase de la alterna, muy lenta para que se vea (en los pasos 3 y 5 va y viene; en los demás, quieta en +)
    const fase = paso === 2 || paso === 4 ? (quieto ? 1 : Math.cos(reloj * Math.PI * 0.8)) : 1;

    paisaje();
    if (paso === 1) imagen();
    if (paso === 3) lineasDeCampo();
    torres();
    cable();
    if (paso >= 1 && paso <= 3) cargas();
    persona();
    if (!foto) rotulos();

    function paisaje() {
      const gr = g.createLinearGradient(0, Y(-1), 0, Y(SUELO)); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // colinas al fondo
      g.fillStyle = c.colina; g.beginPath(); g.moveTo(X(-4), Y(SUELO));
      for (let x = -4; x <= 20; x += 0.5) g.lineTo(X(x), Y(SUELO - 0.9 - 0.6 * Math.sin(x * 0.55) - 0.3 * Math.sin(x * 1.3)));
      g.lineTo(X(20), Y(SUELO)); g.closePath(); g.fill();
      // la hierba y, por debajo, la tierra
      g.fillStyle = c.hierba; g.fillRect(0, Y(SUELO), w, 0.25 * v.K);
      g.fillStyle = c.tierra; g.fillRect(0, Y(SUELO + 0.25), w, Math.max(0, h - Y(SUELO + 0.25)));
      g.strokeStyle = rgba(c.hierba, 0.9); g.lineWidth = Math.max(1, 0.03 * v.K);
      for (let k = 0; k < 90; k++) { const x = -3 + k * 0.25 + 0.1 * azar(k); g.beginPath(); g.moveTo(X(x), Y(SUELO)); g.lineTo(X(x + 0.05), Y(SUELO - 0.12 - 0.1 * azar(k + 9))); g.stroke(); }
    }
    function torres() {
      for (const xt of TORRES) {
        g.strokeStyle = c.torre; g.lineWidth = Math.max(1.5, 0.05 * v.K);
        const pata = 0.9, arriba = 0.2, cima = ALTO - 0.8;
        g.beginPath(); g.moveTo(X(xt - pata), Y(SUELO)); g.lineTo(X(xt - arriba), Y(cima)); g.lineTo(X(xt + arriba), Y(cima)); g.lineTo(X(xt + pata), Y(SUELO)); g.stroke();
        // celosía
        g.lineWidth = Math.max(1, 0.025 * v.K); g.beginPath();
        for (let k = 0; k < 7; k++) { const y0 = SUELO - k * (SUELO - cima) / 7, y1 = SUELO - (k + 1) * (SUELO - cima) / 7, a0 = pata - (pata - arriba) * k / 7, a1 = pata - (pata - arriba) * (k + 1) / 7; g.moveTo(X(xt - a0), Y(y0)); g.lineTo(X(xt + a1), Y(y1)); g.moveTo(X(xt + a0), Y(y0)); g.lineTo(X(xt - a1), Y(y1)); }
        g.stroke();
        // la cruceta y los aisladores
        g.lineWidth = Math.max(1.5, 0.05 * v.K); g.beginPath(); g.moveTo(X(xt - 1.1), Y(ALTO - 0.4)); g.lineTo(X(xt + 1.1), Y(ALTO - 0.4)); g.stroke();
        g.strokeStyle = c.aislador; g.lineWidth = Math.max(2, 0.08 * v.K); g.beginPath(); g.moveTo(X(xt), Y(ALTO - 0.4)); g.lineTo(X(xt), Y(ALTO)); g.stroke();
      }
    }
    function cable() {
      g.strokeStyle = c.cable; g.lineWidth = Math.max(1.5, 0.045 * v.K); g.beginPath();
      for (let x = TORRES[0]; x <= TORRES[1] + 1e-9; x += 0.1) x === TORRES[0] ? g.moveTo(X(x), Y(cableY(x))) : g.lineTo(X(x), Y(cableY(x)));
      g.stroke();
      // los otros dos cables, más finos, por detrás
      g.strokeStyle = rgba(c.cable, 0.45); g.lineWidth = Math.max(1, 0.025 * v.K);
      for (const d of [-0.9, 0.9]) { g.beginPath(); for (let x = TORRES[0]; x <= TORRES[1] + 1e-9; x += 0.1) { const y = cableY(x) - 0.45; x === TORRES[0] ? g.moveTo(X(x + d * 0.3), Y(y)) : g.lineTo(X(x + d * 0.3), Y(y)); } g.stroke(); }
    }
    // paso 2: la carga inducida en el suelo y el cable imagen por debajo
    function imagen() {
      const a = suave(tramo(t, 0.35, 0.6)), yi = SUELO + (SUELO - BAJO);
      g.globalAlpha = a; g.strokeStyle = c.neg; g.lineWidth = Math.max(1.5, 0.04 * v.K); g.setLineDash([8, 6]); g.beginPath();
      for (let x = TORRES[0]; x <= TORRES[1] + 1e-9; x += 0.1) { const y = 2 * SUELO - cableY(x); x === TORRES[0] ? g.moveTo(X(x), Y(y)) : g.lineTo(X(x), Y(y)); }
      g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      for (let k = -3; k <= 3; k++) { punto(8 + k * 0.8, yi + 0.4, 0.15, c.panel, 0.85 * a); signo(8 + k * 0.8, yi + 0.4, -1, c.neg, a, 0.75); }
      g.strokeStyle = rgba(c.rotulo, 0.5 * a); g.lineWidth = 1; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(X(8), Y(BAJO)); g.lineTo(X(8), Y(yi)); g.stroke(); g.setLineDash([]);
    }
    function cargas() {
      const s = Math.sign(fase) || 1, a = paso === 1 ? suave(tramo(t, 0, 0.25)) : Math.min(1, Math.abs(fase) * 1.6);
      for (let k = -6; k <= 6; k++) { const x = 8 + k * 0.85; signo(x, cableY(x) + 0.28, s, s > 0 ? c.pos : c.neg, a, 0.6); }
      // en el suelo, la carga de signo contrario, más junta bajo el cable
      for (let k = -7; k <= 7; k++) { const x = 8 + k * (0.45 + 0.04 * k * k), b = a * (1 - Math.abs(k) / 10); if (x < -0.5 || x > 16.5) continue; punto(x, SUELO + 0.5, 0.15, c.panel, 0.85 * b); signo(x, SUELO + 0.5, -s, -s > 0 ? c.pos : c.neg, b, 0.75); }
    }
    // paso 4: las líneas de campo del cable al suelo. Las de un hilo y su imagen son circunferencias que pasan por los
    // dos, con el centro en el suelo: la que llega al suelo en 8 + xs tiene el centro en 8 + m, con m = (xs² − hh²)/(2 xs)
    function lineasDeCampo() {
      const hh = SUELO - BAJO, u = suave(tramo(t, 0, 0.5));
      g.strokeStyle = rgba(c.lineas, 0.85); g.lineWidth = Math.max(1, 0.03 * v.K);
      for (const xs of [-9, -5.5, -3.4, -2, -1, 1, 2, 3.4, 5.5, 9]) {
        const m = (xs * xs - hh * hh) / (2 * xs), R = Math.abs(xs - m), a0 = Math.atan2(BAJO - SUELO, -m), a1 = xs > m ? 0 : -Math.PI;
        const en = (s) => { const an = a0 + (a1 - a0) * s; return [8 + m + R * Math.cos(an), SUELO + R * Math.sin(an)]; };
        g.beginPath();
        for (let j = 0; j <= 48 * u; j++) { const [x, y] = en(j / 48); j ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
        g.stroke();
        if (u >= 1 && !quieto) { const [x, y] = en((reloj * 0.25 + azar(xs + 20)) % 1); punto(x, y, 0.05, c.lineas); }
      }
      v.flecha(8, SUELO - 1.3, 8, SUELO - 0.1, c.lineas, u, 0.035);
    }
    function persona() {
      const x = PERSONA, pie = SUELO, alto = 1.8 * S, cab = 0.11;
      g.strokeStyle = c.persona; g.lineCap = 'round'; g.lineWidth = Math.max(2, 0.09 * v.K);
      g.beginPath(); g.moveTo(X(x - 0.06), Y(pie)); g.lineTo(X(x), Y(pie - 0.36)); g.lineTo(X(x + 0.06), Y(pie)); g.stroke();
      g.lineWidth = Math.max(2.5, 0.12 * v.K); g.beginPath(); g.moveTo(X(x), Y(pie - 0.36)); g.lineTo(X(x), Y(pie - alto + 2 * cab)); g.stroke();
      punto(x, pie - alto + cab, cab, c.piel);
      // brazo que sujeta el tubo (de 0,5 a 1,7 m)
      const xt = x + 0.2, y0 = pie - 0.5 * S, y1 = pie - 1.7 * S;
      g.lineWidth = Math.max(1.5, 0.06 * v.K); g.beginPath(); g.moveTo(X(x), Y(pie - 1.35 * S)); g.lineTo(X(xt), Y(pie - 1.1 * S)); g.stroke(); g.lineCap = 'butt';
      const luz = paso === 4 ? Math.abs(fase) ** 0.6 * suave(tramo(t, 0.15, 0.35)) : paso === 5 || (paso === 0 && foto) ? 0.8 : 0;
      if (luz > 0.02) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(X(xt), Y((y0 + y1) / 2), 0, X(xt), Y((y0 + y1) / 2), 0.5 * v.K); gr.addColorStop(0, rgba(c.brillo, 0.45 * luz)); gr.addColorStop(1, rgba(c.brillo, 0)); g.fillStyle = gr; g.fillRect(X(xt - 0.6), Y(y1 - 0.4), 1.2 * v.K, (y0 - y1 + 0.8) * v.K); g.restore(); }
      g.fillStyle = luz > 0.02 ? c.brillo : c.tubo; g.fillRect(X(xt - 0.025), Y(y1), 0.05 * v.K, (y0 - y1) * v.K);
      g.fillStyle = c.torre; g.fillRect(X(xt - 0.03), Y(y1), 0.06 * v.K, 0.03 * v.K); g.fillRect(X(xt - 0.03), Y(y0 - 0.03), 0.06 * v.K, 0.03 * v.K);
    }
    function rotulos() {
      if (paso === 0) { rotulo('133 kV respecto del suelo · 50 Hz', 8, BAJO - 0.6, { al: 'center', peso: 700, escribe: tramo(t, 0.1, 0.4) }); rotulo('10 m', 8.25, (BAJO + SUELO) / 2, { tam: 12, escribe: tramo(t, 0.4, 0.6) }); g.strokeStyle = rgba(c.rotulo, 0.6); g.lineWidth = 1; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(X(8), Y(BAJO + 0.1)); g.lineTo(X(8), Y(SUELO)); g.stroke(); g.setLineDash([]); }
      if (paso === 1) { rotulo('+λ', 8.6, BAJO - 0.4, { peso: 700, color: c.pos, escribe: tramo(t, 0.1, 0.3) }); rotulo('suelo conductor: carga inducida', 12.8, SUELO + 0.95, { al: 'center', tam: 12, escribe: tramo(t, 0.2, 0.4) }); rotulo('cable imagen: −λ', 8.6, 2 * SUELO - BAJO + 0.8, { peso: 700, color: c.neg, escribe: tramo(t, 0.55, 0.75) }); }
      if (paso === 2) { v.pantalla(); v.panel(0.4, 0.35, 5.6, 1.5); rotulo('λ = C′V ≈ 1,03 µC/m', 0.75, 0.85, { tam: 13, peso: 700, fondo: false }); rotulo(fase > 0 ? 'ahora: cable +, suelo −' : 'ahora: cable −, suelo +', 0.75, 1.4, { tam: 12.5, fondo: false, color: fase > 0 ? c.pos : c.neg }); }
      if (paso === 3) { const hh = prueba.h; v.pantalla(); v.panel(0.4, 0.35, 5.8, 1.5); rotulo(`h = ${hh} m: E = λ/(πε₀h)`, 0.75, 0.85, { tam: 13, fondo: false }); rotulo(`E en el suelo ≈ ${f1(campo(hh) / 1e3)} kV/m`, 0.75, 1.4, { tam: 13, peso: 700, fondo: false, color: c.lineas, escribe: tramo(t, 0.3, 0.6) }); }
      if (paso === 4) { const xt = PERSONA + 0.2; rotulo('1,7 m', xt + 0.12, SUELO - 1.7 * S, { tam: 12, fondo: false }); rotulo('0,5 m', xt + 0.12, SUELO - 0.5 * S, { tam: 12, fondo: false }); rotulo('ΔV ≈ 4,5 kV', xt + 0.12, SUELO - 1.1 * S, { tam: 13, peso: 700, color: c.pos, escribe: tramo(t, 0.3, 0.55) }); }
      if (paso === 5) { v.pantalla(); v.panel(0.4, 0.35, 6.4, 2.05); rotulo('Corriente por el cuerpo ≈ 50 µA', 0.75, 0.85, { tam: 13, peso: 700, fondo: false, escribe: tramo(t, 0.1, 0.35) }); rotulo('Se nota a partir de ≈ 1 mA', 0.75, 1.4, { tam: 12.5, fondo: false, escribe: tramo(t, 0.35, 0.55) }); rotulo('Límite de la UE para el público: 5 kV/m', 0.75, 1.95, { tam: 12.5, fondo: false, color: c.lineas, escribe: tramo(t, 0.55, 0.8) }); }
    }
  }

  const COLORES = ['cielo', 'cielo-alto', 'colina', 'hierba', 'tierra', 'torre', 'aislador', 'cable', 'persona', 'piel', 'tubo', 'brillo', 'pos', 'neg', 'lineas', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, escenaElectrostatica, ejercicio, abrirEnElectrostatica, cPrima, campo };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: LineaAltaTension.pasos, dibuja: LineaAltaTension.dibuja, colores: LineaAltaTension.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); LineaAltaTension.abrirEnElectrostatica(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = LineaAltaTension;
