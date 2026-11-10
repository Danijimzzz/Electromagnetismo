/* =====================================================================
   El cargador inalámbrico: los 6 pasos de la animación (texto y dibujo) y el ejercicio que se abre en
   Autoinducción e inducción mutua (dos espiras coaxiales a una distancia, pestaña de inducción mutua). El
   modelo es el de la herramienta: la emisora se trata como una espira grande y la del móvil como una pequeña
   (M = μ₀π N₁N₂ R² r² / 2(R² + z²)^(3/2)). Los datos de la bobina (3 cm y 1 cm de radio, 20 espiras, 2 A,
   110 kHz, L = 10 µH, C = 210 nF) son orientativos y se han revisado (f0 = 1/(2π√(LC)) = 110 kHz; M con la aproximación de receptora pequeña). El motor es fenomenos/animacion.js, los
   ayudantes de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se cargan los
   datos: pruebas/herramientas/fenomenos/cargador-inalambrico.js.
   ===================================================================== */
const CargadorInalambrico = (() => {
  const MU0 = 4e-7 * Math.PI, N1 = 20, N2 = 20, R = 0.03, r = 0.01, ZREF = 0.02, I0 = 2, F0 = 110e3, LB = 10e-6, CB = 210e-9;
  const mutua = (z) => (MU0 * Math.PI * N1 * N2 * R * R * r * r) / (2 * Math.pow(R * R + z * z, 1.5));   // H, con z en m
  const fem = (z, f) => mutua(z) * 2 * Math.PI * f * I0;                                                  // V (valor máximo)
  const M = mutua(ZREF), DIDT = 2 * Math.PI * F0 * I0, EPS = fem(ZREF, F0), FLUJO = M * I0, FRES = 1 / (2 * Math.PI * Math.sqrt(LB * CB));
  const datos = { MU0, N1, N2, R, r, ZREF, I0, F0, LB, CB, mutua, fem, M, DIDT, EPS, FLUJO, FRES, M0: mutua(0), razon: M / mutua(0) };
  const f0 = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ',');

  const pasos = [
    { titulo: 'Una bobina que crea un campo que cambia', corto: 'Emisora', dato: { valor: '≈ 110 kHz', texto: 'cambia el sentido de la corriente de un cargador Qi, más de cien mil veces por segundo.' }, texto: 'Dentro del cargador hay una bobina plana por la que circula una <b>corriente alterna</b>. Toda corriente crea un campo magnético, así que la bobina crea un $B$ que sube, baja y se invierte al ritmo de la corriente.\n\nNo hay ningún cable hacia el móvil: lo único que sale de la bobina es ese campo, que se extiende por el aire y va perdiendo fuerza al alejarse.', dura: 10000 },
    { titulo: 'El campo atraviesa la bobina del móvil', corto: 'Flujo', dato: { valor: 'Φ = M · I', texto: 'es el flujo que la corriente de la emisora manda por la bobina del móvil.' }, texto: 'En la tapa trasera del móvil hay otra bobina, la <b>receptora</b>. Una parte de las líneas de campo de la emisora la atraviesa: ese es el <b>flujo</b> $Φ$ que le llega.\n\nEl flujo es proporcional a la corriente, y a la constante de proporcionalidad se le llama <b>inductancia mutua</b>, $M$ (en henrios). Cuanto mejor alineadas y más cerca estén las bobinas, mayor es $M$.', dura: 10000 },
    { titulo: 'Faraday: flujo que cambia, tensión que aparece', corto: 'Faraday', dato: { valor: 'ε = −M dI/dt', texto: 'es la tensión que aparece en la bobina del móvil: cuanto más rápido cambia la corriente, mayor.' }, texto: 'Si el flujo fuera constante no pasaría nada. Pero la corriente es alterna, así que el flujo cambia sin parar, y la ley de <b>Faraday</b> dice que un flujo que cambia induce una tensión: $ε = −M {dI}/{dt}$.\n\nPara una corriente $I = I_0 sen(2π f t)$, el máximo de $dI/dt$ es $2π f I_0$ y por tanto $ε_"máx" = 2π f M I_0$. Por eso los cargadores usan frecuencias tan altas: <b>a más frecuencia, más tensión</b> con la misma corriente. Con una corriente continua no habría ninguna.', dura: 12000 },
    { titulo: 'Resonancia y rectificador', corto: 'Resonancia', dato: { valor: 'f₀ = 1/(2π√(LC))', texto: 'es la frecuencia a la que la bobina y un condensador intercambian la energía sin esfuerzo.' }, texto: 'La tensión inducida es alterna, y una batería necesita continua. Antes de eso, un truco: se conecta un <b>condensador</b> a la bobina para que ambos formen un circuito resonante, $f_0 = 1/(2π√(L C))$. Con $L = 10 μ"H"$ y $C = 210 "nF"$ sale $f_0 ≈ 110 "kHz"$, justo la frecuencia de la emisora, y así se aprovecha mucho más energía.\n\nDespués, unos diodos (el <b>rectificador</b>) dejan pasar solo un sentido de la corriente y un condensador la alisa, y ya se puede cargar la batería. La emisora hace lo mismo al revés: parte de continua y la convierte en alterna.', dura: 12000 },
    { titulo: 'Cuanto más lejos, mucho menos', corto: 'Distancia', dato: { valor: '−42 %', texto: 'baja la inducción mutua, con la aproximación de receptora pequeña, al separar las bobinas 20 mm (de 2,63 µH a 1,52 µH).' }, texto: 'Las líneas de campo se abren y se dispersan al alejarse de la emisora. Para dos espiras coaxiales, la inducción mutua baja con la distancia $z$ como $M ∝ 1/(R^2 + z^2)^{3/2}$, y para distancias grandes como $1/z^3$.\n\nPor eso el móvil tiene que estar <b>bien puesto sobre la base</b>: unos milímetros de más o un desalineamiento y la tensión inducida cae. Las bases con imanes o varias bobinas existen precisamente para centrar el móvil. Prueba a separarlo con el deslizador.', dura: 12000 },
    { titulo: 'El cálculo, con la inducción mutua', corto: 'Cálculo', dato: { valor: 'ε ≈ 2,1 V', texto: 'de pico, con 2 A a 110 kHz y las bobinas separadas 2 cm.' }, texto: 'Con una espira de 3 cm y 20 vueltas como emisora, otra de 1 cm y 20 vueltas como receptora, separadas 2 cm, la inducción mutua es $M = {μ_0 π N_1 N_2 R^2 r^2}/{2(R^2 + z^2)^{3/2}} ≈ 1,52 μ"H"$.\n\nCon $I_0 = 2 "A"$ a 110 kHz, $(dI/dt)_"máx" = 2π f I_0 ≈ 1,38·10^6 "A/s"$, y la tensión de pico es $ε = M (dI/dt) ≈ 2,1 "V"$. La herramienta de inducción mutua hace este cálculo paso a paso y con cualquier pareja de bobinas.', dura: 12000 },
  ];

  // ejercicio de Autoinducción e inducción mutua (formato de induccion-v1): dos espiras coaxiales a 2 cm con la emisora en su valor máximo
  const ejercicio = () => ({ tab: 'M', M: { geo: 'espiras-coaxiales', N1: String(N1), R: '3', N2: String(N2), r: '1', z: '2', I1: String(I0), dI1dt: String(Math.round(DIDT)) } });
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
  // «Pruébalo tú» del paso 3: la frecuencia en kHz; y del paso 5: la distancia entre las bobinas en mm
  const frec = { etiqueta: 'la frecuencia de la corriente (kHz)', min: 20, max: 200, paso: 5, valor: 110, kHz: 110,
    muestra: (k) => `${k} kHz → tensión de pico ${f2(fem(ZREF, k * 1e3))} V (con 2 A y 20 mm)`, cambia: (k) => { frec.kHz = k; } };
  const dist = { etiqueta: 'la distancia entre las bobinas (mm)', min: 0, max: 40, paso: 1, valor: 20, mm: 20, tocada: false,
    muestra: (z) => `${z} mm → M = ${f2(mutua(z / 1000) * 1e6)} µH, tensión de pico ${f2(fem(z / 1000, F0))} V`, cambia: (z) => { dist.mm = z; dist.tocada = true; } };
  pasos[2].prueba = frec; pasos[4].prueba = dist;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue({ x: 8, y: 4.5, z: 1 }, reloj, quieto);
    const { X, Y, rotulo, punto, flecha } = v;
    const ZMM = paso === 4 ? dist.mm : 20, GAP = 0.3 + ZMM * 0.1;   // separación dibujada (unidades), 1 unidad = 5 mm
    const PADY = 7.0, TX_Y = PADY - 0.25, MOV_Y = PADY - 0.55 - GAP, RX_Y = MOV_Y - 0.2;
    const fase = quieto ? Math.PI / 2 : reloj * 3.2, s = Math.sin(fase);   // fase visual de la corriente (mucho más lenta que la real)

    // ambiente: la pared con la luz de una lámpara, la mesa de madera con sus vetas y una taza al lado
    const M = Dibujo.mezcla, MESA = PADY + 0.55;
    v.degradado(-1, MESA, M(c.pared, c.mesa, 0.1), M(c.pared, c.mesa, 0.32));
    v.brillo(8, MESA - 0.4, 9, c.pared, 0.55);
    v.degradado(MESA, 10, M(c.mesa, c.pared, 0.18), M(c.mesa, '#000000', 0.3));
    g.strokeStyle = rgba(c.rotulo, 0.08); g.lineWidth = 1;
    for (let k = 0; k < 7; k++) { const y = MESA + 0.18 + k * 0.22; g.beginPath(); g.moveTo(0, Y(y)); for (let px = 0; px <= w; px += 16) g.lineTo(px, Y(y) + 2.5 * Math.sin(px * 0.011 + k * 1.7)); g.stroke(); }
    g.fillStyle = rgba(c.pared, 0.35); g.fillRect(0, Y(MESA), w, Math.max(1.5, 0.04 * v.K));
    v.sombra(14.75, MESA + 0.05, 1.0, 0.14); v.pieza(14.2, MESA - 1.15, 1.1, 1.2, c.resalta, 0.1);
    g.strokeStyle = M(c.resalta, '#000000', 0.2); g.lineWidth = Math.max(2.5, 0.09 * v.K); g.beginPath(); g.arc(X(15.3), Y(MESA - 0.58), 0.3 * v.K, -Math.PI / 2, Math.PI / 2); g.stroke();
    if (!quieto) for (let k = 0; k < 3; k++) { const q = (reloj * 0.25 + k / 3) % 1; g.strokeStyle = rgba(c.rotulo, 0.16 * (1 - q)); g.lineWidth = Math.max(1.5, 0.05 * v.K); g.beginPath(); g.moveTo(X(14.75 + 0.12 * Math.sin(q * 7 + k)), Y(MESA - 1.2 - q * 0.9)); g.lineTo(X(14.75 + 0.12 * Math.sin(q * 7 + k + 0.8)), Y(MESA - 1.45 - q * 0.9)); g.stroke(); }
    const onda = (x0, y0, ancho, alto, fn, color, hasta = 1) => {
      g.strokeStyle = color; g.lineWidth = Math.max(2.2, 0.07 * v.K); g.lineJoin = 'round'; g.beginPath();
      for (let k = 0; k <= 60 * hasta; k++) { const u = k / 60, px = X(x0 + u * ancho), py = Y(y0 - fn(u) * alto); if (k) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
    };

    campo(); cargador(); movil();
    if (paso === 0) p0(); else if (paso === 1) p1(); else if (paso === 2) p2(); else if (paso === 3) p3(); else if (paso === 4) p4(); else p5();

    // las líneas de campo de la emisora, cerradas, más débiles cuanto más lejos
    function campo() {
      const a = (paso === 0 ? suave(tramo(t, 0, 0.25)) : 1) * (0.2 + 0.7 * Math.abs(s));
      g.lineWidth = Math.max(1.5, 0.045 * v.K); g.lineCap = 'round';
      for (const lado of [-1, 1]) for (let k = 0; k < 4; k++) {
        const ri = 0.4 + 0.75 * k, ro = ri + 1.9 + 1.4 * k, cx = 8 + lado * (ri + ro) / 2, ax = (ro - ri) / 2, ay = 1.5 + 1.0 * k;
        g.strokeStyle = rgba(c.campo, a * (1 - 0.13 * k)); g.setLineDash([0.34 * v.K, 0.3 * v.K]); g.lineDashOffset = quieto ? 0 : -reloj * 2.2 * v.K * Math.sign(s || 1);
        g.beginPath(); g.ellipse(X(cx), Y(TX_Y), ax * v.K, ay * v.K, 0, Math.PI, 2 * Math.PI); g.stroke();
      }
      g.setLineDash([]); g.lineDashOffset = 0; g.lineCap = 'butt';
    }
    // la base del cargador con la bobina emisora vista de lado (3 cm de radio: 6 unidades de semianchura)
    function cargador() {
      v.sombra(8, PADY + 0.58, 6.2, 0.22, 0.3); v.brillo(8, TX_Y - 0.6, 5.5, c.campo, 0.08 + 0.14 * Math.abs(s));
      v.pieza(2.8, PADY - 0.45, 10.4, 1.0, c.base, 0.2);
      g.strokeStyle = c.bobina; g.lineWidth = Math.max(2, 0.06 * v.K);
      for (const lado of [-1, 1]) for (let k = 0; k < 4; k++) { const x = 8 + lado * (3.3 + k * 0.55); g.beginPath(); g.ellipse(X(x), Y(TX_Y), 0.2 * v.K, 0.16 * v.K, 0, 0, 2 * Math.PI); g.stroke(); }
      // un cable al enchufe y la corriente que oscila
      g.strokeStyle = c.base; g.lineWidth = Math.max(3, 0.12 * v.K); g.beginPath(); g.moveTo(X(2.8), Y(PADY)); g.lineTo(X(1.8), Y(PADY)); g.lineTo(X(1.2), Y(PADY - 0.3)); g.stroke();
    }
    // el móvil, tumbado sobre la base, con su bobina receptora
    function movil() {
      v.pieza(3.2, MOV_Y - 0.1, 9.6, 0.7, c.movil, 0.18);
      const luz = paso >= 2 ? Math.min(1, Math.abs(s) * fem(ZMM / 1000, paso === 2 ? frec.kHz * 1e3 : F0) / 2.5 + 0.1) : 0;
      if (luz > 0) v.brillo(8, MOV_Y - 0.2, 5, c.pantalla, 0.12 + 0.2 * luz);
      if (luz > 0) { g.fillStyle = rgba(c.pantalla, 0.35 + 0.5 * luz); g.beginPath(); g.roundRect(X(3.5), Y(MOV_Y - 0.02), 9.0 * v.K, 0.12 * v.K, 0.06 * v.K); g.fill(); }
      g.strokeStyle = c.bobina; g.lineWidth = Math.max(2, 0.06 * v.K);
      for (const lado of [-1, 1]) for (let k = 0; k < 3; k++) { const x = 8 + lado * (1.0 + k * 0.4) * 0.8; g.beginPath(); g.ellipse(X(x), Y(RX_Y + 0.3), 0.14 * v.K, 0.12 * v.K, 0, 0, 2 * Math.PI); g.stroke(); }
    }
    function p0() {
      rotulo('bobina emisora', 8, PADY + 0.85, { al: 'center', peso: 700, tam: 12.5, escribe: tramo(t, 0.15, 0.4) });
      rotulo('corriente alterna', 1.2, PADY - 0.8, { tam: 12.5, color: c.corriente, peso: 700, escribe: tramo(t, 0.25, 0.5) });
      rotulo('campo magnético B(t), que cambia de sentido', 8, 1.0, { al: 'center', peso: 700, color: c.campo, escribe: tramo(t, 0.45, 0.8) });
      v.panel(0.7, 1.6, 3.6, 2.0); onda(0.95, 2.6, 3.1, 0.7, (u) => Math.sin(2 * Math.PI * (2 * u) - fase), c.corriente);
      rotulo('I(t)', 3.7, 1.95, { tam: 12.5, fondo: false, color: c.corriente, peso: 700, escribe: tramo(t, 0.3, 0.5) });
    }
    function p1() {
      const a = suave(tramo(t, 0.05, 0.3));
      for (const x of [7.2, 8, 8.8]) flecha(x, TX_Y - 2.4 - 0.6, x, RX_Y + 0.15, c.resalta, a * (0.4 + 0.6 * Math.abs(s)), 0.05);
      rotulo('bobina receptora', 8, MOV_Y - 0.85, { al: 'center', peso: 700, tam: 12.5, escribe: tramo(t, 0.2, 0.45) });
      rotulo('flujo Φ a través de la bobina del móvil', 8, 1.0, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.35, 0.75) });
      rotulo('Φ = M · I', 12.9, 2.3, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.6, 0.9) });
    }
    function p2() {
      const k = frec.kHz / 200, ciclos = 2;
      v.panel(9.6, 0.4, 6.0, 3.2);
      onda(9.9, 1.75, 5.4, 0.55, (u) => Math.sin(2 * Math.PI * ciclos * u - fase), c.corriente);
      onda(9.9, 3.05, 5.4, 0.55 * (0.25 + 0.75 * k), (u) => -Math.cos(2 * Math.PI * ciclos * u - fase), c.fem);
      rotulo('corriente I(t) de la emisora', 9.9, 0.75, { tam: 12, fondo: false, color: c.corriente, peso: 700 });
      rotulo(`tensión ε(t): pico de ${f2(fem(ZREF, frec.kHz * 1e3))} V`, 9.9, 2.35, { tam: 12, fondo: false, color: c.fem, peso: 700, escribe: tramo(t, 0.2, 0.5) });
      rotulo(`${frec.kHz} kHz`, 15.3, 0.75, { al: 'right', tam: 12, fondo: false, peso: 700 });
      rotulo('ley de Faraday: ε = −dΦ/dt', 4.6, 1.0, { al: 'center', peso: 700, color: c.fem, escribe: tramo(t, 0.4, 0.8) });
      rotulo('el móvil recibe tensión', 8, MOV_Y - 0.85, { al: 'center', tam: 12.5, escribe: tramo(t, 0.55, 0.85) });
    }
    function p3() {
      const y = 1.5, caja = (x, tx, ancho = 2.6) => { v.panel(x, y - 0.7, ancho, 1.4, 0.94, true); rotulo(tx, x + ancho / 2, y, { al: 'center', tam: 12, fondo: false, peso: 700 }); };
      caja(0.9, 'bobina L'); caja(4.4, 'condensador C'); caja(8.1, 'rectificador'); caja(11.6, 'batería', 2.6);
      const a = (x) => flecha(x, y, x + 0.55, y, c.rotulo, suave(tramo(t, 0.1, 0.3)), 0.04);
      a(3.55); a(7.0); a(10.75);
      onda(0.9, 3.1, 3.0, 0.5, (u) => Math.sin(2 * Math.PI * 3 * u - fase), c.fem); rotulo('alterna', 2.4, 3.85, { al: 'center', tam: 12, fondo: false, color: c.fem, escribe: tramo(t, 0.3, 0.5) });
      onda(5.1, 3.1, 3.0, 0.5, (u) => Math.abs(Math.sin(2 * Math.PI * 3 * u - fase)), c.corriente); rotulo('rectificada', 6.6, 3.85, { al: 'center', tam: 12, fondo: false, color: c.corriente, escribe: tramo(t, 0.5, 0.7) });
      onda(9.3, 3.1, 3.0, 0.5, () => 0.65, c.barra); rotulo('continua', 10.8, 3.85, { al: 'center', tam: 12, fondo: false, color: c.barra, escribe: tramo(t, 0.7, 0.9) });
      rotulo(`f₀ = 1/(2π√(LC)) = ${f0(FRES / 1000)} kHz`, 8, 6.0, { al: 'center', peso: 700, tam: 14, color: c.resalta, escribe: tramo(t, 0.3, 0.65) });
    }
    function p4() {
      // gráfica M(z) arriba a la derecha y marca de la distancia actual
      v.panel(9.6, 0.35, 6.0, 3.3);
      const gx0 = 10.4, gx1 = 15.2, gy0 = 3.0, gy1 = 0.9, M0 = mutua(0), tx = (z) => gx0 + (z / 40) * (gx1 - gx0), ty = (m) => gy0 - (m / M0) * (gy0 - gy1);
      g.strokeStyle = c.rotulo; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X(gx0), Y(gy1 - 0.15)); g.lineTo(X(gx0), Y(gy0)); g.lineTo(X(gx1), Y(gy0)); g.stroke();
      g.strokeStyle = c.campo; g.lineWidth = Math.max(2.5, 0.07 * v.K); g.beginPath();
      for (let z = 0; z <= 40; z += 1) { const px = X(tx(z)), py = Y(ty(mutua(z / 1000))); if (z) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
      punto(tx(ZMM), ty(mutua(ZMM / 1000)), 0.16, c.resalta);
      rotulo('M (µH)', gx0 + 0.1, gy1 - 0.3, { tam: 11.5, fondo: false }); rotulo('z (mm)', gx1, gy0 + 0.35, { al: 'right', tam: 11.5, fondo: false });
      rotulo(`z = ${ZMM} mm → M = ${f2(mutua(ZMM / 1000) * 1e6)} µH`, gx0, gy0 + 0.35, { tam: 12.5, fondo: false, peso: 700, color: c.resalta });
      rotulo(`tensión de pico: ${f2(fem(ZMM / 1000, F0))} V`, 4.3, 1.0, { peso: 700, color: c.fem, escribe: tramo(t, 0.1, 0.4) });
      rotulo('separación entre bobinas', 8, MOV_Y + 1.3 + GAP * 0.1, { al: 'center', tam: 12.5, escribe: tramo(t, 0.3, 0.6) });
      flecha(1.9, TX_Y, 1.9, RX_Y + 0.1, c.resalta, 0, 0.04);
    }
    function p5() {
      v.panel(0.6, 0.4, 15, 4.6);
      rotulo('M = μ₀π N₁N₂ R² r² / 2(R² + z²)^(3/2) = 1,52 µH', 1.1, 1.2, { tam: 13.5, fondo: false, peso: 600, escribe: tramo(t, 0.1, 0.35) });
      rotulo(`dI/dt (máx) = 2π f I₀ = 2π · 110 kHz · 2 A = ${f2(DIDT / 1e6)}·10⁶ A/s`, 1.1, 2.3, { tam: 13.5, fondo: false, escribe: tramo(t, 0.35, 0.6) });
      rotulo(`ε = M · dI/dt = ${f2(EPS)} V`, 1.1, 3.5, { tam: 16, fondo: false, peso: 700, color: c.fem, escribe: tramo(t, 0.6, 0.85) });
      rotulo(`Φ = M · I₀ = ${f2(FLUJO * 1e6)} µWb`, 9.2, 3.5, { tam: 13.5, fondo: false, peso: 600, color: c.resalta, escribe: tramo(t, 0.8, 1) });
    }
  }

  const COLORES = ['pared', 'mesa', 'base', 'movil', 'pantalla', 'bobina', 'campo', 'corriente', 'fem', 'resalta', 'rotulo', 'barra', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnInduccion };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: CargadorInalambrico.pasos, dibuja: CargadorInalambrico.dibuja, colores: CargadorInalambrico.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); CargadorInalambrico.abrirEnInduccion(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = CargadorInalambrico;
