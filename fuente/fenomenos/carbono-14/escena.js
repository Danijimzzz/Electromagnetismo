/* =====================================================================
   La datación por carbono 14: los 6 pasos de la animación (texto y dibujo),
   el sonido de un contador Geiger que se apaga con los años y el ejercicio
   que se abre en Cinética química (orden 1 con la vida media de 5730 años:
   cuánto tarda en quedar el 25 %). El motor es fenomenos/animacion.js, los
   ayudantes de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node
   (pruebas) solo se cargan los datos: pruebas/herramientas/fenomenos/carbono-14.js.
   ===================================================================== */
const Carbono14 = (() => {
  // modelo: vida media de 5730 años, 13,6 desintegraciones por minuto y gramo de carbono en un ser vivo, hueso con el 25 %
  const T12 = 5730, A0 = 13.6, QUEDA = 0.25, k = Math.LN2 / T12;
  const queda = (anos) => Math.exp(-k * anos), edad = (fr) => Math.log(1 / fr) / k;
  const datos = { T12, A0, QUEDA, k, edad: edad(QUEDA), limite: 10 * T12, quedaLimite: queda(10 * T12), actividad: A0 * QUEDA };
  const f0 = (x) => Math.round(x).toLocaleString('es-ES').replace(/\./g, ' '), f1 = (x) => x.toFixed(1).replace('.', ',');

  const pasos = [
    { titulo: 'El carbono 14 se fabrica en el cielo', corto: 'Origen', dato: { valor: '1 de cada 10¹²', texto: 'átomos de carbono del aire es carbono 14.' }, texto: 'Los rayos cósmicos chocan con la alta atmósfera y arrancan neutrones. Cuando uno de esos neutrones choca con un núcleo de nitrógeno 14, lo convierte en carbono 14: n + ¹⁴N → ¹⁴C + p.\n\nEl carbono 14 se une al oxígeno y forma CO₂, igual que el carbono normal (el 12). Como se fabrica y se desintegra sin parar, en el aire hay siempre la misma proporción: más o menos un átomo de carbono 14 por cada billón.' },
    { titulo: 'Mientras vive, se renueva', corto: 'Vivo', dato: { valor: '13,6 por minuto', texto: 'desintegraciones de carbono 14 en cada gramo de carbono de un ser vivo.' }, texto: 'Las plantas toman el CO₂ del aire para hacer la fotosíntesis, los animales comen plantas y nosotros comemos de todo. Así, mientras un ser vivo respira y se alimenta, tiene la misma proporción de carbono 14 que el aire.\n\nEso se nota en su radiactividad: unas 13,6 desintegraciones por minuto en cada gramo de carbono, en una planta, un ciervo o una persona.' },
    { titulo: 'Al morir, empieza el reloj', corto: 'Reloj', dato: { valor: 'k = 1,21·10⁻⁴ años⁻¹', texto: 'es la constante de desintegración del carbono 14.' }, texto: 'Al morir deja de tomar carbono, y el carbono 14 que tenía se va desintegrando: cada núcleo emite un electrón y vuelve a ser nitrógeno: ¹⁴C → ¹⁴N + e⁻ + antineutrino.\n\nCada núcleo tiene la misma probabilidad de desintegrarse por unidad de tiempo, así que el número que se desintegra es proporcional al que queda: es una cinética de primer orden, $N = N_0 e^{−k t}$, con $k = ln 2/t_{1/2} = 0,693/5730 = 1,21·10^{−4} "años"^{−1}$.' },
    { titulo: 'La mitad cada 5730 años', corto: 'Semivida', dato: { valor: 't½ = 5730 años', texto: 'tarda en desintegrarse la mitad del carbono 14.' }, texto: 'En una reacción de primer orden la vida media no depende de cuánto haya: a los 5730 años queda la mitad, a los 11 460 la cuarta parte, a los 17 190 la octava parte… La curva baja igual de deprisa en proporción, empiece donde empiece.\n\nNo hay forma de saber cuándo se desintegrará un núcleo concreto, pero con billones de ellos el resultado es tan regular como un reloj.', dura: 11000 },
    { titulo: 'Un hueso con el 25 %', corto: 'Datación', dato: { valor: '11 460 años', texto: 'tiene un hueso al que le queda el 25 % del carbono 14.' }, texto: 'En un yacimiento aparece un hueso con una actividad de 3,4 desintegraciones por minuto y gramo de carbono: el 25 % de las 13,6 de un ser vivo.\n\nDespejando el tiempo de la ley de primer orden: $t = ln(N_0/N)/k = ln(1/0,25)/(1,21·10^{−4}) = 11 460 "años"$. Son justo dos vidas medias: la mitad de la mitad.' },
    { titulo: '¿Hasta cuándo sirve?', corto: 'Límite', dato: { valor: 'unos 50 000 años', texto: 'es lo más antiguo que se puede datar: luego queda demasiado poco.' }, texto: 'Después de diez vidas medias (57 300 años) queda menos del 0,1 %, tan poco que no se distingue del ruido. Para cosas más antiguas se usan otros relojes, como el potasio 40 (1250 millones de años).\n\nAdemás, la proporción en el aire no ha sido siempre igual: se calibra con los anillos de los árboles. Y las pruebas nucleares de los años 50 y 60 casi duplicaron el carbono 14 del aire, el «pico de las bombas».', dura: 11000 },
  ];

  // ejercicio de Cinética química (formato de cinetica-v1): orden 1 con la vida media, ¿cuándo queda el 25 %?
  const ejercicio = () => ({ modo: 'orden', n: '1', kde: 't12', t12: '5730', A0: '100', t: '5730', C: '25', ut: 'a' });
  function abrirEnCinetica(destino) {
    try { localStorage.setItem('cinetica-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const SUELO = 5.2, HX = 6.2, HY = 7.2, NAT = 64, cam = { x: 8, y: 4.5, z: 1 };
  // cada átomo del hueso se desintegra a una edad fija: los cuantiles de la exponencial, en un orden al azar
  const mezcla = (j) => { const x = Math.sin((j + 70) * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const ORDEN = Array.from({ length: NAT }, (_, j) => j).sort((a, b) => mezcla(a) - mezcla(b));
  const vidaDe = (j) => edad((ORDEN[j] + 0.5) / NAT);
  // «Pruébalo tú» del paso 4: años desde la muerte
  const prueba = { etiqueta: 'los años desde la muerte', min: 0, max: 40000, paso: 100, valor: 5730, anos: 5730, tocado: false,
    muestra: (a) => `${f0(a)} años → queda el ${f1(100 * queda(a))} % (${f1(A0 * queda(a))} desintegraciones/min·g)`,
    cambia: (a) => { prueba.anos = a; } };
  pasos[3].prueba = prueba;
  // los años que han pasado en cada paso (t va de 0 a 1 durante el movimiento)
  const anosDe = (paso, t) => (paso === 2 ? 5730 * suave(t) : paso === 3 ? prueba.anos : paso === 4 ? datos.edad * suave(t) : paso === 5 ? 57300 * suave(t) : 0);

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue({ x: 8, y: 4.5, z: 1 }, reloj, quieto);
    const { X, Y, rotulo, punto } = v;
    const foto = window.FenomenoFoto, anos = anosDe(paso, t);

    paisaje();
    if (paso <= 1) { cielo(); arbol(3.2); if (paso === 1) ciervo(9.2, reloj); }
    else { arbol(3.2); hueso(anos); if (!foto) grafica(anos); }

    function paisaje() {
      const gr = g.createLinearGradient(0, 0, 0, Y(SUELO)); gr.addColorStop(0, c.espacio); gr.addColorStop(0.35, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, Y(SUELO));
      g.fillStyle = c.cesped; g.fillRect(0, Y(SUELO), w, 0.25 * v.K);
      // capas de tierra, cada vez más antiguas
      const capas = [c.tierra, c['tierra-2'], c.tierra, c['tierra-2']];
      for (let j = 0; j < 4; j++) { g.fillStyle = capas[j]; g.beginPath(); g.moveTo(0, Y(SUELO + 0.25 + j * 1.0 + 0.1 * Math.sin(j))); for (let x = v.x0; x <= v.x1 + 0.5; x += 0.5) g.lineTo(X(x), Y(SUELO + 0.25 + j * 1.0 + 0.12 * Math.sin(x * 0.8 + j))); g.lineTo(w, h); g.lineTo(0, h); g.fill(); }
      for (let j = 0; j < 40; j++) punto(v.x0 + azar(j + 400) * (v.x1 - v.x0), SUELO + 0.6 + azar(j + 500) * 3.2, 0.03 + 0.04 * azar(j + 600), rgba(c.piedra, 0.6));
    }
    // pasos 1 y 2: rayos cósmicos, nitrógeno que pasa a carbono 14 y CO₂ que baja
    function cielo() {
      const ciclo = 3.2, ts = quieto ? 0.55 : (reloj % ciclo) / ciclo;
      for (let j = 0; j < 4; j++) {
        const x = 5.5 + j * 2.4 + azar(j) * 0.6, s = (ts + j * 0.27) % 1, xa = x - 1.0, ya = 0.15, xn = x, yn = 1.3 + 0.3 * azar(j + 3);
        if (s < 0.35) { const u = s / 0.35; v.flecha(xa, ya, xa + (xn - xa) * u, ya + (yn - ya) * u, c.rayo, 0.9, 0.025); punto(xn, yn, 0.12, c.nitrogeno); }
        else { const u = (s - 0.35) / 0.65; punto(xn + 0.3 * u, yn + 2.6 * u * u, 0.12, c.c14); punto(xn - 0.18 + 0.3 * u, yn + 2.6 * u * u, 0.08, c.oxigeno); punto(xn + 0.18 + 0.3 * u, yn + 2.6 * u * u, 0.08, c.oxigeno); if (u < 0.25) punto(xn + 0.4 + u, yn - u, 0.05, c.rayo, 1 - 4 * u); }
      }
      if (paso === 0) {
        rotulo('rayos cósmicos', 4.2, 0.45, { color: c.rayo, peso: 700, escribe: tramo(t, 0.1, 0.35) });
        rotulo('n + ¹⁴N → ¹⁴C + p', 11.8, 0.7, { peso: 700, color: c.c14, escribe: tramo(t, 0.35, 0.6) });
        rotulo('¹⁴CO₂ en el aire', 9.8, 3.7, { escribe: tramo(t, 0.55, 0.8) });
      }
      // CO₂ normal flotando
      for (let j = 0; j < 14; j++) { const x = (azar(j + 30) * 18 + (quieto ? 0 : reloj * 0.15)) % 18 - 1, y = 2.2 + azar(j + 40) * 2.4; punto(x, y, 0.07, c.c12, 0.5); punto(x - 0.1, y, 0.05, c.oxigeno, 0.5); punto(x + 0.1, y, 0.05, c.oxigeno, 0.5); }
    }
    function arbol(x) {
      g.fillStyle = c.tronco; g.fillRect(X(x - 0.15), Y(SUELO - 1.6), 0.3 * v.K, 1.6 * v.K);
      g.fillStyle = c.hoja; for (const [dx, dy, r] of [[0, -2.3, 0.9], [-0.6, -1.8, 0.6], [0.6, -1.9, 0.65], [0, -1.6, 0.6]]) { g.beginPath(); g.arc(X(x + dx), Y(SUELO + dy), r * v.K, 0, 2 * Math.PI); g.fill(); }
      // el carbono 14 dentro de las hojas
      if (paso <= 1) for (let j = 0; j < 7; j++) punto(x - 0.7 + azar(j + 80) * 1.4, SUELO - 2.6 + azar(j + 90) * 1.2, 0.06, c.c14, 0.9);
      if (paso === 1) rotulo('fotosíntesis: toma ¹⁴CO₂', x + 1.1, SUELO - 3.3, { tam: 12.5, escribe: tramo(t, 0.15, 0.4) });
    }
    // paso 2: un ciervo que pasta (también con su carbono 14)
    function ciervo(x, reloj) {
      const y = SUELO - 0.95, cab = quieto ? 0 : 0.15 * Math.sin(reloj * 1.3);
      g.strokeStyle = c.animal; g.lineWidth = Math.max(2, 0.09 * v.K); g.lineCap = 'round';
      g.beginPath(); for (const dx of [-0.55, -0.35, 0.4, 0.6]) { g.moveTo(X(x + dx), Y(y + 0.2)); g.lineTo(X(x + dx), Y(SUELO)); } g.stroke();
      g.fillStyle = c.animal; g.beginPath(); g.ellipse(X(x), Y(y), 0.85 * v.K, 0.38 * v.K, 0, 0, 2 * Math.PI); g.fill();
      g.beginPath(); g.moveTo(X(x - 0.6), Y(y - 0.1)); g.lineTo(X(x - 1.0), Y(y + 0.25 + cab)); g.lineWidth = Math.max(3, 0.2 * v.K); g.stroke();
      g.beginPath(); g.ellipse(X(x - 1.1), Y(y + 0.35 + cab), 0.24 * v.K, 0.14 * v.K, 0.6, 0, 2 * Math.PI); g.fill();
      g.lineWidth = Math.max(1.2, 0.04 * v.K); g.beginPath(); g.moveTo(X(x - 1.0), Y(y + 0.2 + cab)); g.lineTo(X(x - 0.85), Y(y - 0.25 + cab)); g.lineTo(X(x - 0.7), Y(y - 0.4 + cab)); g.moveTo(X(x - 0.85), Y(y - 0.25 + cab)); g.lineTo(X(x - 1.05), Y(y - 0.45 + cab)); g.stroke(); g.lineCap = 'butt';
      for (let j = 0; j < 6; j++) punto(x - 0.6 + azar(j + 120) * 1.2, y - 0.2 + azar(j + 130) * 0.4, 0.06, c.c14);
      rotulo('come plantas: el mismo ¹⁴C que el aire', x, y - 1.0, { al: 'center', tam: 12.5, escribe: tramo(t, 0.4, 0.7) });
    }
    // pasos 3 a 6: el hueso enterrado con sus átomos de carbono 14 (morados) que se van volviendo nitrógeno (grises)
    function hueso(anos) {
      g.fillStyle = rgba(c.tierra, 0.6); g.beginPath(); g.ellipse(X(HX), Y(HY), 3.0 * v.K, 1.1 * v.K, 0, 0, 2 * Math.PI); g.fill();
      g.fillStyle = c.hueso; g.beginPath(); g.roundRect(X(HX - 2), Y(HY - 0.32), 4 * v.K, 0.64 * v.K, 0.25 * v.K); g.fill();
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.beginPath(); g.arc(X(HX + sx * 2.05), Y(HY + sy * 0.32), 0.4 * v.K, 0, 2 * Math.PI); g.fill(); }
      for (let j = 0; j < NAT; j++) {
        const col = j % 16, fila = Math.floor(j / 16), x = HX - 1.8 + col * 0.24, y = HY - 0.21 + fila * 0.14, vivo = anos < vidaDe(j);
        punto(x, y, 0.055, vivo ? c.c14 : c.nitrogeno, vivo ? 1 : 0.55);
        if (!vivo && !quieto && anos - vidaDe(j) < 300 && paso !== 3) punto(x, y, 0.12, c.rayo, 0.5 * (1 - (anos - vidaDe(j)) / 300));
      }
      rotulo(`${f0(anos)} años · queda el ${f1(100 * queda(anos))} %`, HX, HY + 1.35, { al: 'center', peso: 700, tam: 14, color: c.c14 });
      if (paso === 2) rotulo('¹⁴C → ¹⁴N + e⁻', HX, HY - 1.3, { al: 'center', peso: 600, escribe: tramo(t, 0.2, 0.45) });
      if (paso === 4) rotulo('3,4 desintegraciones/min·g → 11 460 años', HX, HY - 1.3, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.75, 0.95) });
      if (paso === 5) rotulo('a los 57 300 años: menos del 0,1 %', HX, HY - 1.3, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.8, 0.98) });
    }
    // la curva N/N₀ = e^(−kt) con las vidas medias y el punto de ahora
    function grafica(anos) {
      v.pantalla();
      const x0 = 9.6, y0 = 0.35, an = 6.0, al = 4.3, a = suave(tramo(t, 0, 0.25)), T = paso === 5 ? 60000 : 40000;
      g.globalAlpha = a; v.panel(x0, y0, an, al); g.globalAlpha = 1;
      if (a <= 0) return;
      const gx = (s) => x0 + 0.55 + (s / T) * (an - 0.85), gy = (fr) => y0 + al - 0.55 - fr * (al - 1.1);
      g.globalAlpha = a; g.strokeStyle = rgba(c.rotulo, 0.4); g.lineWidth = 1; g.beginPath(); g.moveTo(X(gx(0)), Y(gy(1.05))); g.lineTo(X(gx(0)), Y(gy(0))); g.lineTo(X(gx(T)), Y(gy(0))); g.stroke();
      g.setLineDash([3, 3]);
      for (let j = 1; j * T12 <= T; j++) { g.beginPath(); g.moveTo(X(gx(j * T12)), Y(gy(0))); g.lineTo(X(gx(j * T12)), Y(gy(queda(j * T12)))); g.lineTo(X(gx(0)), Y(gy(queda(j * T12)))); g.stroke(); }
      g.setLineDash([]);
      g.strokeStyle = c.c14; g.lineWidth = 2.5; g.beginPath();
      for (let s = 0; s <= T; s += T / 120) s ? g.lineTo(X(gx(s)), Y(gy(queda(s)))) : g.moveTo(X(gx(s)), Y(gy(queda(s))));
      g.stroke(); g.globalAlpha = 1;
      punto(gx(Math.min(anos, T)), gy(queda(Math.min(anos, T))), 0.09, c.resalta, a);
      rotulo('N/N₀', x0 + 0.2, y0 + 0.3, { tam: 11.5, fondo: false });
      rotulo('años →', x0 + an - 0.2, y0 + 0.3, { al: 'right', tam: 11, fondo: false });
      for (const j of T > 50000 ? [5, 10] : [1, 2, 3]) rotulo(`${j}·t½`, gx(j * T12), y0 + al - 0.32, { al: 'center', tam: 10.5, fondo: false });
      for (const fr of [1, 0.5, 0.25]) rotulo(fr === 1 ? '1' : fr === 0.5 ? '½' : '¼', x0 + 0.38, gy(fr), { al: 'right', tam: 10.5, fondo: false });
    }
  }

  /* ---------------- sonido (opcional, apagado al abrir) ---------------- */
  // clics de un contador Geiger, más espaciados cuanto menos carbono 14 queda
  function sonido(ac) {
    const ruido = ac.createBuffer(1, ac.sampleRate * 0.01, ac.sampleRate), d = ruido.getChannelData(0);
    for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ac.sampleRate * 0.0015));
    let antes = null;
    return {
      cuadro({ paso, t, reloj }) {
        const dt = antes === null ? 0 : Math.min(0.1, reloj - antes); antes = reloj;
        const ritmo = 9 * (paso <= 1 ? 1 : queda(anosDe(paso, t)));
        if (Math.random() < ritmo * dt) { const s = ac.createBufferSource(), vol = ac.createGain(); s.buffer = ruido; vol.gain.value = 0.5; s.connect(vol).connect(ac.destination); s.start(); }
      },
    };
  }

  const COLORES = ['espacio', 'cielo', 'cielo-alto', 'cesped', 'tierra', 'tierra-2', 'piedra', 'rayo', 'nitrogeno', 'c14', 'c12', 'oxigeno', 'tronco', 'hoja', 'animal', 'hueso', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, sonido, COLORES, ejercicio, abrirEnCinetica, queda, edad };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: Carbono14.pasos, dibuja: Carbono14.dibuja, colores: Carbono14.COLORES, sonido: Carbono14.sonido });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); Carbono14.abrirEnCinetica(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = Carbono14;
