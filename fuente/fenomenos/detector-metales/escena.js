/* =====================================================================
   El detector de metales: los 6 pasos de la animación (texto y dibujo) y el ejercicio que se abre en Autoinducción e
   inducción mutua (dos espiras coaxiales, pestaña de inducción mutua). Modelo: la bobina del cabezal es una espira de
   10 cm de radio y 25 vueltas, y la moneda una sola espira de 1,2 cm de radio a una profundidad z bajo su eje, sin
   resistencia ni autoinducción (M = μ₀π N₁N₂ R² r² / 2(R² + z²)^(3/2)); el eco que vuelve a la receptora se toma
   proporcional a M² (ida y vuelta). Los datos (0,5 A a 10 kHz) son orientativos. El motor es fenomenos/animacion.js,
   los ayudantes de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se cargan los datos:
   pruebas/herramientas/fenomenos/detector-metales.js.
   ===================================================================== */
const DetectorMetales = (() => {
  const MU0 = 4e-7 * Math.PI, N1 = 25, N2 = 1, R = 0.10, r = 0.012, ZREF = 0.10, I0 = 0.5, F0 = 10e3;
  const mutua = (z) => (MU0 * Math.PI * N1 * N2 * R * R * r * r) / (2 * Math.pow(R * R + z * z, 1.5));   // H, con z en m
  const fem = (z, f) => mutua(z) * 2 * Math.PI * f * I0;                                                  // V (valor máximo)
  const eco = (z) => Math.pow(mutua(z) / mutua(0), 2);                                                    // señal relativa a la de contacto
  const M = mutua(ZREF), DIDT = 2 * Math.PI * F0 * I0, EPS = fem(ZREF, F0), FLUJO = M * I0;
  const datos = { MU0, N1, N2, R, r, ZREF, I0, F0, mutua, fem, eco, M, DIDT, EPS, FLUJO, M0: mutua(0), eco10: eco(0.10), eco20: eco(0.20) };
  const f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ',');

  const pasos = [
    { titulo: 'Una bobina que crea un campo que cambia', corto: 'Emisora', dato: { valor: '≈ 10 kHz', texto: 'cambia de sentido la corriente de la bobina de un detector de baja frecuencia: diez mil veces por segundo.' }, texto: 'En el disco que hay al final del bastón va una bobina por la que circula una <b>corriente alterna</b>. Esa corriente crea un campo magnético $B$ que sube, baja y se invierte al ritmo de la corriente, y que se mete bajo tierra.\n\nMientras no haya nada metálico, el campo atraviesa la tierra, la arena y las piedras sin enterarse de nada: no son conductores y no responden. Es el mismo principio que el del cargador inalámbrico, pero aquí el «móvil» está enterrado.', dura: 10000 },
    { titulo: 'Faraday: corrientes de Foucault en el metal', corto: 'Foucault', dato: { valor: 'ε = 2π f M I₀', texto: 'es la tensión máxima que se induce en la moneda: cuanto mayor es la frecuencia, mayor es la tensión.' }, texto: 'Si bajo el disco hay una moneda, el campo que cambia atraviesa su superficie y, por la ley de <b>Faraday</b>, induce en ella una tensión, $ε = −{dΦ}/{dt}$.\n\nComo el metal conduce, esa tensión mueve las cargas en círculos: son las <b>corrientes de Foucault</b>, las mismas que calientan la sartén de la cocina de inducción. Para una corriente $I = I_0 sen(2π f t)$ la tensión de pico es $ε = 2π f M I_0$, así que a más frecuencia, más corriente en el metal. Prueba a cambiar la frecuencia con el deslizador.', dura: 12000 },
    { titulo: 'El metal contesta: el eco', corto: 'Eco', dato: { valor: 'ley de Lenz', texto: 'la moneda crea un campo que se opone al que la induce, y ese campo es el que oye el detector.' }, texto: 'Las corrientes de Foucault tampoco se quedan quietas: cada una crea su propio campo magnético, y por la ley de <b>Lenz</b> es contrario al que las provoca. Ese pequeño campo «de vuelta» sube hasta el cabezal.\n\nAllí hay una segunda bobina, la <b>receptora</b>, colocada de forma que sin metal apenas capta el campo de la emisora. Cuando aparece el eco de la moneda, induce en ella una tensión pequeña, el aparato la amplifica y suena el pitido. Un detector, en el fondo, es un transformador que escucha lo que le devuelve el suelo.', dura: 12000 },
    { titulo: 'Cuanto más hondo, mucho menos', corto: 'Profundidad', dato: { valor: '1/8 a 10 cm', texto: 'queda del eco que daría la moneda pegada a la bobina; a 20 cm solo 1/125.' }, texto: 'La inducción mutua entre la bobina y la moneda baja con la profundidad como $M ∝ 1/(R^2 + z^2)^{3/2}$. El campo tiene que llegar hasta la moneda y el eco volver, así que, en este modelo sencillo, la señal que recibe el detector es proporcional a $M^2$, es decir a $1/(R^2 + z^2)^3$.\n\nCon $R = 10 "cm"$, a $z = 10 "cm"$ el eco es $1/8$ del de contacto y a $20 "cm"$ solo $1/125$. Para profundidades grandes cae como $1/z^6$. Por eso un detector de aficionado encuentra monedas a unos 10 o 20 cm, y los objetos grandes se ven más hondo: su superficie, y con ella $M$, es mayor. Mueve el deslizador y mira el eco.', dura: 12000 },
    { titulo: 'Hierro, oro o aluminio: la fase del eco', corto: 'Metales', dato: { valor: 'fase del eco', texto: 'permite al detector distinguir un clavo de hierro de un anillo de oro o una moneda de cobre.' }, texto: 'No todos los metales contestan igual. Un buen conductor no magnético (oro, plata, cobre) responde con corrientes de Foucault, y su eco sale <b>retrasado</b> respecto a la corriente de la emisora. El hierro, además de conducir, es <b>ferromagnético</b>: concentra el campo y su respuesta tiene otra fase.\n\nMidiendo esa diferencia, el detector puede «discriminar» y callarse ante clavos y chapas. Los detectores de pulsos usan otro truco: cortan de golpe la corriente y escuchan cómo se apagan las corrientes de Foucault, que tardan más cuanto mejor conductora y mayor es la pieza.', dura: 12000 },
    { titulo: 'El cálculo, con la inducción mutua', corto: 'Cálculo', dato: { valor: 'ε ≈ 0,79 mV', texto: 'de pico en la moneda, con 0,5 A a 10 kHz y la moneda a 10 cm.' }, texto: 'Con una espira de 10 cm de radio y 25 vueltas como emisora, una espira de 1,2 cm de radio como moneda y $z = 10 "cm"$, la inducción mutua es $M = {μ_0 π N_1 N_2 R^2 r^2}/{2(R^2 + z^2)^{3/2}} ≈ 25,1 "nH"$.\n\nCon $I_0 = 0,5 "A"$ a 10 kHz, $(dI/dt)_"máx" = 2π f I_0 ≈ 3,14·10^4 "A/s"$ y la tensión de pico en la moneda es $ε = M (dI/dt) ≈ 0,79 "mV"$, con un flujo $Φ = M I_0 ≈ 12,6 "nWb"$. La herramienta de inducción mutua hace este cálculo paso a paso y con cualquier pareja de espiras. Los datos son orientativos.', dura: 12000 },
  ];

  // ejercicio de Autoinducción e inducción mutua (formato de induccion-v1): dos espiras coaxiales a 10 cm con la emisora en su valor máximo
  const ejercicio = () => ({ tab: 'M', M: { geo: 'espiras-coaxiales', N1: String(N1), R: '10', N2: String(N2), r: '1.2', z: '10', I1: String(I0), dI1dt: String(Math.round(DIDT)) } });
  function abrirEnInduccion(destino) {
    // el estado de la herramienta lleva las tres pestañas: se parte de lo que haya guardado o de sus ejemplos
    let st = null;
    try { st = JSON.parse(localStorage.getItem('induccion-v1')); } catch (e) { /* sin estado previo */ }
    const base = st && st.L && st.RL ? st : { L: Induccion.ejemplos.L[0].sc, RL: Induccion.ejemplos.RL[0].sc };
    try { localStorage.setItem('induccion-v1', JSON.stringify({ ...base, ...ejercicio() })); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const cam = { x: 8, y: 4.5, z: 1 };
  // «Pruébalo tú» del paso 2: la frecuencia en kHz; y del paso 4: la profundidad de la moneda en cm
  const frec = { etiqueta: 'la frecuencia de la corriente (kHz)', min: 1, max: 20, paso: 1, valor: 10, kHz: 10,
    muestra: (k) => `${k} kHz → tensión de pico en la moneda ${f2(fem(ZREF, k * 1e3) * 1e3)} mV (con 0,5 A y a 10 cm)`, cambia: (k) => { frec.kHz = k; } };
  const prof = { etiqueta: 'la profundidad de la moneda (cm)', min: 5, max: 25, paso: 1, valor: 10, cm: 10,
    muestra: (z) => `${z} cm → M = ${f2(mutua(z / 100) * 1e9)} nH, eco del ${f1(eco(z / 100) * 100)} % del de contacto`, cambia: (z) => { prof.cm = z; } };
  pasos[1].prueba = frec; pasos[3].prueba = prof;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue({ x: 8, y: 4.5, z: 1 }, reloj, quieto);
    const { X, Y, rotulo, punto, flecha } = v;
    const ZCM = paso === 3 ? prof.cm : 10, BOB_Y = 2.4, SUELO = BOB_Y + 1.0, MON_Y = BOB_Y + ZCM / 5;   // 1 unidad = 5 cm
    const fase = quieto ? Math.PI / 2 : reloj * 3.2, s = Math.sin(fase);   // fase visual de la corriente (mucho más lenta que la real)

    g.fillStyle = c.pared; g.fillRect(0, 0, w, h);
    g.fillStyle = c.cielo; g.fillRect(0, 0, w, Y(SUELO));
    g.fillStyle = c.tierra; g.fillRect(0, Y(SUELO), w, h - Y(SUELO));
    g.fillStyle = c.hierba; g.fillRect(0, Y(SUELO) - 3, w, 6);
    const onda = (x0, y0, ancho, alto, fn, color) => {
      g.strokeStyle = color; g.lineWidth = Math.max(2.2, 0.07 * v.K); g.lineJoin = 'round'; g.beginPath();
      for (let k = 0; k <= 60; k++) { const u = k / 60, px = X(x0 + u * ancho), py = Y(y0 - fn(u) * alto); if (k) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
    };

    campo(); cabezal(); monedaYEco();
    if (paso === 0) p0(); else if (paso === 1) p1(); else if (paso === 2) p2(); else if (paso === 3) p3(); else if (paso === 4) p4(); else p5();

    // el campo de la emisora: líneas cerradas que bajan por el suelo, más débiles cuanto más lejos
    function campo() {
      const a = (paso === 0 ? suave(tramo(t, 0, 0.25)) : 1) * (0.2 + 0.7 * Math.abs(s));
      g.lineWidth = Math.max(1.5, 0.045 * v.K); g.lineCap = 'round';
      for (const lado of [-1, 1]) for (let k = 0; k < 3; k++) {
        const ri = 0.5 + 0.8 * k, ro = ri + 1.6 + 1.2 * k, cx = 8 + lado * (ri + ro) / 2, ax = (ro - ri) / 2, ay = 1.4 + 1.2 * k;
        g.strokeStyle = rgba(c.campo, a * (1 - 0.2 * k)); g.setLineDash([0.34 * v.K, 0.3 * v.K]); g.lineDashOffset = quieto ? 0 : -reloj * 2.2 * v.K * Math.sign(s || 1);
        g.beginPath(); g.ellipse(X(cx), Y(BOB_Y + 0.15), ax * v.K, ay * v.K, 0, 0, Math.PI); g.stroke();
      }
      g.setLineDash([]); g.lineDashOffset = 0; g.lineCap = 'butt';
    }
    // el cabezal con las dos bobinas, visto de lado, y el bastón que sube a la derecha
    function cabezal() {
      g.strokeStyle = c.baston; g.lineWidth = Math.max(5, 0.2 * v.K); g.lineCap = 'round'; g.beginPath(); g.moveTo(X(9.6), Y(BOB_Y - 0.2)); g.lineTo(X(13.2), Y(-0.6)); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = c.cabezal; g.beginPath(); g.ellipse(X(8), Y(BOB_Y), 2.2 * v.K, 0.38 * v.K, 0, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = c.bobina; g.lineWidth = Math.max(2, 0.06 * v.K);
      for (const lado of [-1, 1]) for (let k = 0; k < 3; k++) { const x = 8 + lado * (1.7 - k * 0.18); g.beginPath(); g.ellipse(X(x), Y(BOB_Y), 0.1 * v.K, 0.13 * v.K, 0, 0, 2 * Math.PI); g.stroke(); }
      g.strokeStyle = c.receptora; for (const lado of [-1, 1]) { const x = 8 + lado * 0.8; g.beginPath(); g.ellipse(X(x), Y(BOB_Y), 0.09 * v.K, 0.12 * v.K, 0, 0, 2 * Math.PI); g.stroke(); }
    }
    // la moneda enterrada, sus corrientes de Foucault y el campo que devuelve
    function monedaYEco() {
      const dentro = paso >= 1, conEco = paso === 2 || paso === 3 || paso === 4;
      const a = paso === 1 ? suave(tramo(t, 0.05, 0.3)) : dentro ? 1 : 0;
      if (dentro) {
        g.strokeStyle = rgba(c.foucault, a * (0.35 + 0.65 * Math.abs(s))); g.lineWidth = Math.max(2.4, 0.07 * v.K); g.setLineDash([0.2 * v.K, 0.14 * v.K]); g.lineDashOffset = quieto ? 0 : reloj * 1.6 * v.K * Math.sign(s || 1);
        g.beginPath(); g.ellipse(X(8), Y(MON_Y), 0.62 * v.K, 0.2 * v.K, 0, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]); g.lineDashOffset = 0;
      }
      if (conEco) {
        const k = paso === 3 ? Math.sqrt(eco(ZCM / 100)) : 0.6, alfa = (paso === 2 ? suave(tramo(t, 0.1, 0.4)) : 1) * (0.2 + 0.7 * Math.abs(s)) * (0.25 + 0.75 * k);
        g.strokeStyle = rgba(c.eco, alfa); g.lineWidth = Math.max(1.6, 0.05 * v.K); g.setLineDash([0.28 * v.K, 0.26 * v.K]); g.lineDashOffset = quieto ? 0 : reloj * 2 * v.K * Math.sign(s || 1);
        for (let j = 0; j < 2; j++) { const an = 0.55 + 0.4 * j; g.beginPath(); g.ellipse(X(8), Y(MON_Y - an * 0.9), an * v.K * 1.1, an * v.K * 0.9, 0, Math.PI, 2 * Math.PI); g.stroke(); }
        g.setLineDash([]); g.lineDashOffset = 0;
      }
      g.fillStyle = c.moneda; g.beginPath(); g.ellipse(X(8), Y(MON_Y), 0.5 * v.K, 0.14 * v.K, 0, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = c.rotulo; g.lineWidth = 1.2; g.stroke();
    }
    function p0() {
      rotulo('bobina emisora', 8, BOB_Y - 0.95, { al: 'center', peso: 700, tam: 12.5, escribe: tramo(t, 0.15, 0.4) });
      rotulo('campo magnético B(t), que cambia de sentido', 8, 7.7, { al: 'center', peso: 700, color: c.campo, escribe: tramo(t, 0.45, 0.8) });
      v.panel(0.7, 0.35, 3.6, 1.45); onda(0.95, 1.3, 3.1, 0.4, (u) => Math.sin(2 * Math.PI * (2 * u) - fase), c.corriente);
      rotulo('I(t)', 3.7, 0.7, { tam: 12.5, fondo: false, color: c.corriente, peso: 700 });
    }
    function p1() {
      rotulo('moneda enterrada', 8, MON_Y + 0.85, { al: 'center', peso: 700, tam: 12.5, escribe: tramo(t, 0.15, 0.4) });
      rotulo('corrientes de Foucault', 11.6, MON_Y, { peso: 700, tam: 12.5, color: c.foucault, escribe: tramo(t, 0.3, 0.6) });
      rotulo('ley de Faraday: ε = −dΦ/dt', 8, 7.9, { al: 'center', peso: 700, color: c.foucault, escribe: tramo(t, 0.5, 0.85) });
      rotulo(`${frec.kHz} kHz → ε = ${f2(fem(ZREF, frec.kHz * 1e3) * 1e3)} mV`, 1.0, 0.55, { peso: 700, tam: 13, color: c.foucault, escribe: tramo(t, 0.3, 0.6) });
      v.panel(0.7, 0.95, 3.6, 1.25); onda(0.95, 1.85, 3.1, 0.2 + 0.4 * frec.kHz / 20, (u) => Math.sin(2 * Math.PI * (2 * u) - fase), c.corriente);
    }
    function p2() {
      rotulo('campo de vuelta (Lenz)', 10.4, MON_Y, { peso: 700, tam: 12.5, color: c.eco, escribe: tramo(t, 0.15, 0.45) });
      rotulo('bobina receptora', 10.6, BOB_Y + 0.62, { tam: 12.5, color: c.receptora, peso: 700, escribe: tramo(t, 0.3, 0.55) });
      v.panel(0.3, 0.35, 5.2, 2.3);
      onda(0.55, 1.1, 4.6, 0.3, (u) => Math.sin(2 * Math.PI * (2 * u) - fase), c.corriente);
      onda(0.55, 2.1, 4.6, 0.12, (u) => Math.sin(2 * Math.PI * (2 * u) - fase - 1.1), c.eco);
      rotulo('corriente de la emisora', 0.6, 0.55, { tam: 11.5, fondo: false, color: c.corriente, peso: 700 });
      rotulo('eco que oye la receptora', 0.6, 1.6, { tam: 11.5, fondo: false, color: c.eco, peso: 700, escribe: tramo(t, 0.5, 0.85) });
    }
    function p3() {
      v.panel(10.5, 0.3, 5.1, 3.3);
      const gx0 = 11.2, gx1 = 15.2, gy0 = 2.9, gy1 = 0.9, tx = (z) => gx0 + ((z - 5) / 20) * (gx1 - gx0), ty = (e) => gy0 - e * (gy0 - gy1);
      g.strokeStyle = c.rotulo; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X(gx0), Y(gy1 - 0.15)); g.lineTo(X(gx0), Y(gy0)); g.lineTo(X(gx1), Y(gy0)); g.stroke();
      g.strokeStyle = c.eco; g.lineWidth = Math.max(2.5, 0.07 * v.K); g.beginPath();
      for (let z = 5; z <= 25; z += 0.5) { const px = X(tx(z)), py = Y(ty(eco(z / 100))); if (z > 5) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
      punto(tx(ZCM), ty(eco(ZCM / 100)), 0.16, c.resalta);
      rotulo('eco', gx0 + 0.15, gy1 - 0.25, { tam: 11.5, fondo: false }); rotulo('z (cm)', gx1, gy0 + 0.3, { al: 'right', tam: 11.5, fondo: false });
      rotulo(`z = ${ZCM} cm → eco ${f1(eco(ZCM / 100) * 100)} %`, 13.2, 1.35, { al: 'center', tam: 12, fondo: false, peso: 700, color: c.resalta });
      rotulo(`profundidad: ${ZCM} cm`, 4.2, MON_Y, { peso: 700, tam: 12.5, escribe: tramo(t, 0.1, 0.4) });
      flecha(7.0, BOB_Y + 0.4, 7.0, MON_Y - 0.15, c.resalta, tramo(t, 0.1, 0.4), 0.04);
    }
    function p4() {
      // tres ecos distintos: lo único que cambia entre ellos es su desfase respecto a la corriente de la emisora
      v.panel(0.3, 0.3, 5.3, 3.5);
      const fila = (y, nombre, des, color, d) => { onda(2.3, y, 3.0, 0.3, (u) => Math.sin(2 * Math.PI * (2 * u) - fase - des), color); rotulo(nombre, 0.5, y, { tam: 12, fondo: false, peso: 700, color, escribe: tramo(t, d, d + 0.25) }); };
      fila(0.9, 'emisora', 0, c.corriente, 0.05); fila(1.8, 'oro, cobre', 1.0, c.eco, 0.25); fila(2.7, 'hierro', -0.5, c.foucault, 0.45);
      rotulo('(esquema orientativo)', 2.95, 3.5, { al: 'center', tam: 10.5, fondo: false, escribe: tramo(t, 0.6, 0.9) });
      rotulo('la fase del eco dice de qué metal es', 8, 7.9, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.55, 0.9) });
    }
    function p5() {
      v.panel(0.6, 0.35, 15, 3.35);
      rotulo('M = μ₀π N₁N₂ R² r² / 2(R² + z²)^(3/2) = 25,1 nH', 1.1, 1.1, { tam: 13.5, fondo: false, peso: 600, escribe: tramo(t, 0.1, 0.35) });
      rotulo(`dI/dt (máx) = 2π f I₀ = 2π · 10 kHz · 0,5 A = ${f2(DIDT / 1e4)}·10⁴ A/s`, 1.1, 2.1, { tam: 13.5, fondo: false, escribe: tramo(t, 0.35, 0.6) });
      rotulo(`ε = M · dI/dt = ${f2(EPS * 1e3)} mV`, 1.1, 3.1, { tam: 16, fondo: false, peso: 700, color: c.foucault, escribe: tramo(t, 0.6, 0.85) });
      rotulo(`Φ = M · I₀ = ${f1(FLUJO * 1e9)} nWb`, 9.2, 3.1, { tam: 13.5, fondo: false, peso: 600, color: c.resalta, escribe: tramo(t, 0.8, 1) });
    }
  }

  const COLORES = ['pared', 'cielo', 'tierra', 'hierba', 'baston', 'cabezal', 'bobina', 'receptora', 'campo', 'corriente', 'foucault', 'eco', 'moneda', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnInduccion };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: DetectorMetales.pasos, dibuja: DetectorMetales.dibuja, colores: DetectorMetales.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); DetectorMetales.abrirEnInduccion(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = DetectorMetales;
