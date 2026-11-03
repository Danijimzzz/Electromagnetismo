/* =====================================================================
   La resonancia magnética: los 6 pasos de la animación (texto y dibujo) y el ejercicio que se abre en Magnetostática
   (el campo B₀ en el centro de un solenoide ideal). Modelo: el imán es un solenoide largo de 2 m con 4775 espiras
   (2387,5 por metro) por el que circulan 500 A, B₀ = μ₀ n I = 1,500 T; el protón del hidrógeno gira (precesa) a la
   frecuencia de Larmor f = (γ/2π) B₀ con γ/2π = 42,577 MHz/T; el exceso de protones alineados con el campo a 310 K es
   tanh(h f / 2kT); un gradiente G cambia la frecuencia con la posición, f(x) = (γ/2π)(B₀ + G x). Los datos son
   orientativos (un imán real es de NbTi a 4 K con varias bobinas, no un solenoide único). El motor es
   fenomenos/animacion.js, los ayudantes de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas)
   solo se cargan los datos: pruebas/herramientas/fenomenos/resonancia-magnetica.js.
   ===================================================================== */
const ResonanciaMagnetica = (() => {
  const MU0 = 4e-7 * Math.PI, N = 4775, L = 2, R = 0.4, I = 500, GAMMA = 42.577478518e6, H = 6.62607015e-34, KB = 1.380649e-23, TCUERPO = 310, G0 = 0.010, X0 = 0.20;
  const larmor = (B) => GAMMA * B;                                                  // Hz, con B en T
  const exceso = (f, T = TCUERPO) => Math.tanh((H * f) / (2 * KB * T));             // fracción de protones de más a favor del campo
  const B0 = MU0 * (N / L) * I, FL = larmor(B0), FL3 = larmor(3), P = exceso(FL), HZ_CM = GAMMA * G0 * 0.01;
  const datos = { MU0, N, L, R, I, GAMMA, B0, FL, FL3, P, G0, X0, HZ_CM, larmor, exceso, fx: (x, G = G0) => GAMMA * (B0 + G * x), veces: B0 / 50e-6 };
  const f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ','), f3 = (x) => x.toFixed(3).replace('.', ',');

  const pasos = [
    { titulo: 'Un imán enorme y uniforme', corto: 'Imán', dato: { valor: '1,5 T', texto: 'es el campo del imán de un equipo habitual: unas 30 000 veces el de la Tierra, que ronda los 50 µT.' }, texto: 'El túnel del escáner es en realidad un <b>solenoide</b>: miles de vueltas de hilo superconductor, enfriado casi a −269 °C, por las que circulan cientos de amperios sin gastar energía. Dentro crea un campo muy intenso y uniforme, $B_0 = μ_0 n I$.\n\nEse campo, siempre encendido y siempre en el mismo sentido, no es la imagen: es solo el escenario. Hace falta que sea casi idéntico en todo el volumen del paciente, porque de su valor va a depender, punto a punto, la señal que se mida.', dura: 10000 },
    { titulo: 'Los protones giran como peonzas', corto: 'Larmor', dato: { valor: 'f = (γ/2π) B₀', texto: 'es la frecuencia de giro de un protón en el campo: unos 63,9 MHz a 1,5 T (42,58 MHz por cada tesla).' }, texto: 'El cuerpo es sobre todo agua, y cada molécula de agua tiene dos núcleos de hidrógeno: dos <b>protones</b>. Un protón se comporta como un pequeño imán que además gira sobre sí mismo (tiene <b>espín</b>).\n\nEn un campo $B_0$ ese imanillo no se coloca sin más: <b>precesa</b>, como una peonza inclinada que da vueltas alrededor de la vertical, a la frecuencia de Larmor $f = (γ/2π) B_0$. La frecuencia solo depende del campo: si $B_0$ cambia un poco, cambia su frecuencia. Con el deslizador puedes ver otros equipos.', dura: 12000 },
    { titulo: 'Resonancia: un pulso de radio', corto: 'Resonancia', dato: { valor: '≈ 5 por millón', texto: 'es el exceso de protones alineados a favor del campo a 1,5 T y 37 °C; de ese pequeño sobrante sale toda la señal.' }, texto: 'Casi todos los protones se compensan unos con otros; solo queda un exceso minúsculo alineado con el campo, unos 5 de cada millón. Pero son tantos que suman una magnetización medible, $M$, paralela a $B_0$.\n\nPara moverla se emite un <b>pulso de radio</b> exactamente a la frecuencia de Larmor, 63,9 MHz. Es <b>resonancia</b>: solo si coincide la frecuencia el pulso empuja los protones, que se inclinan hasta 90° y pasan a girar todos juntos y en fase. Con otra frecuencia, no se mueve nada.', dura: 12000 },
    { titulo: 'La señal: Faraday y la relajación', corto: 'Señal', dato: { valor: 'ε = −dΦ/dt', texto: 'es la tensión que aparece en la bobina receptora porque la magnetización gira y su flujo cambia.' }, texto: 'Al acabar el pulso, la magnetización inclinada sigue girando a 63,9 MHz. Es un imán que gira cerca de una bobina: por la ley de <b>Faraday</b> induce en ella una tensión alterna, y esa tensión es la señal de radio que se amplifica.\n\nLa señal no dura: los protones vuelven a su equilibrio con dos tiempos, $T_1$ (recuperan el alineamiento con el campo) y $T_2$ (pierden la fase entre ellos). Cada tejido tiene los suyos: la grasa recupera en una fracción de segundo y el líquido cefalorraquídeo tarda varios segundos. Esa diferencia es lo que da contraste a la imagen. Los valores de la gráfica son aproximados a 1,5 T.', dura: 14000 },
    { titulo: 'Gradientes: dónde está cada señal', corto: 'Gradientes', dato: { valor: '≈ 4,3 kHz/cm', texto: 'es lo que cambia la frecuencia por cada centímetro con un gradiente de 10 mT/m.' }, texto: 'Hasta aquí sabemos que hay señal, pero no de dónde viene. El truco: unas bobinas extra, los <b>gradientes</b>, hacen que el campo crezca de forma lineal con la posición, $B(x) = B_0 + G x$.\n\nComo la frecuencia depende del campo, <b>cada rebanada del cuerpo precesa a su frecuencia</b>: $f(x) = (γ/2π)(B_0 + G x)$. Con $G = 10 "mT/m"$, a 20 cm del centro la frecuencia cambia $±85 "kHz"$. Midiendo qué frecuencias llegan y con qué intensidad, un ordenador reconstruye el mapa del cuerpo (una transformada de Fourier). Mueve el deslizador para ver el efecto de un gradiente mayor.', dura: 12000 },
    { titulo: 'El cálculo, con el campo del solenoide', corto: 'Cálculo', dato: { valor: 'f = 63,87 MHz', texto: 'es la frecuencia de Larmor del protón en el centro del imán de 1,5 T.' }, texto: 'Con un solenoide de 2 m con 4775 espiras ($n = 2387,5 "esp/m"$) y 500 A, el campo en el centro es $B_0 = μ_0 n I = 4π·10^{−7} · 2387,5 · 500 ≈ 1,500 "T"$.\n\nLa frecuencia de Larmor es $f = 42,577 "MHz/T" · 1,500 "T" ≈ 63,87 "MHz"$ (a 3 T serían 127,7 MHz). La herramienta de magnetostática calcula ese campo con Biot-Savart y Ampère para cualquier solenoide. Los datos son orientativos: un imán real se hace con varias bobinas y su campo es muy uniforme en una esfera de unos 40 cm.', dura: 12000 },
  ];

  // ejercicio de Magnetostática (formato de magneto-cur-v1): el solenoide ideal del imán y el campo en su centro, en modo SI
  const ejercicio = () => ({ titulo: 'Imán de un equipo de resonancia magnética', enunciado: 'El imán de un equipo de resonancia es un solenoide ideal de 2 m de longitud y 0,4 m de radio con 4775 espiras por las que circulan 500 A. Calcula el campo B₀ en su centro; con él, la frecuencia de Larmor del protón es f = 42,577 MHz/T · B₀.',
    modo: 'si', vista: { plano: 'xz', corte: '0', flechas: true, mapa: false, lineas: true },
    fuentes: [{ tipo: 'solenoide', nombre: 'Imán', I: String(I), s: 'I', C: ['0', '0', '0'], eje: 'z', R: String(R), L: String(L), N: String(N), sentido: 1, ideal: true }],
    preguntas: [{ tipo: 'B', P: ['0', '0', '0'] }] });
  function abrirEnMagnetostatica(destino) {
    try { localStorage.setItem('magneto-cur-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const cam = { x: 8, y: 4.5, z: 1 };
  // «Pruébalo tú» del paso 2: el campo del imán en T; y del paso 5: el gradiente en mT/m
  const campoB = { etiqueta: 'el campo del imán (T)', min: 0.5, max: 7, paso: 0.5, valor: 1.5, T: 1.5,
    muestra: (b) => `${f1(b)} T → frecuencia de Larmor ${f2(larmor(b) / 1e6)} MHz`, cambia: (b) => { campoB.T = b; } };
  const grad = { etiqueta: 'el gradiente (mT/m)', min: 1, max: 40, paso: 1, valor: 10, mT: 10,
    muestra: (g) => `${g} mT/m → la frecuencia cambia ${f2(GAMMA * g * 1e-3 * 0.01 / 1e3)} kHz por centímetro`, cambia: (g) => { grad.mT = g; } };
  pasos[1].prueba = campoB; pasos[4].prueba = grad;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue({ x: 8, y: 4.5, z: 1 }, reloj, quieto);
    const { X, Y, rotulo, flecha, punto } = v;
    const giro = quieto ? 0.9 : reloj * 4.2;   // giro visual del protón (mucho más lento que los 64 millones de vueltas por segundo)
    const TY0 = 3.3, TY1 = 5.7;                 // el túnel: de y = 3,3 a 5,7

    g.fillStyle = c.pared; g.fillRect(0, 0, w, h);
    iman(); paciente(); lineasB();
    if (paso === 0) p0(); else if (paso === 1) p1(); else if (paso === 2) p2(); else if (paso === 3) p3(); else if (paso === 4) p4(); else p5();

    // la carcasa del imán con las vueltas del hilo (⊙ y ⊗) arriba y abajo del túnel
    function iman() {
      g.fillStyle = c.iman; g.beginPath(); g.roundRect(X(0.7), Y(1.5), 14.6 * v.K, 6.0 * v.K, 0.5 * v.K); g.fill();
      g.fillStyle = c.pared; g.fillRect(X(0.7), Y(TY0), 14.6 * v.K, (TY1 - TY0) * v.K);
      g.strokeStyle = c.bobina; g.lineWidth = Math.max(1.6, 0.05 * v.K);
      for (const y of [2.45, 6.55]) for (let k = 0; k < 21; k++) {
        const x = 1.5 + k * 0.66; g.beginPath(); g.arc(X(x), Y(y), 0.17 * v.K, 0, 2 * Math.PI); g.stroke();
        if (y < 4) { g.beginPath(); g.arc(X(x), Y(y), 0.04 * v.K, 0, 2 * Math.PI); g.fillStyle = c.bobina; g.fill(); }
        else { const r = 0.1 * v.K; g.beginPath(); g.moveTo(X(x) - r, Y(y) - r); g.lineTo(X(x) + r, Y(y) + r); g.moveTo(X(x) + r, Y(y) - r); g.lineTo(X(x) - r, Y(y) + r); g.stroke(); }
      }
    }
    // el paciente tumbado sobre la camilla (cabeza a la izquierda)
    function paciente() {
      g.fillStyle = c.camilla; g.fillRect(X(2.2), Y(5.12), 11.8 * v.K, 0.16 * v.K);
      g.fillStyle = c.cuerpo; g.beginPath(); g.roundRect(X(3.5), Y(4.15), 8.8 * v.K, 0.95 * v.K, 0.4 * v.K); g.fill();
      g.beginPath(); g.arc(X(3.1), Y(4.62), 0.5 * v.K, 0, 2 * Math.PI); g.fill();
    }
    // el campo B₀ del túnel: flechas a lo largo del eje
    function lineasB() {
      const a = paso === 0 ? suave(tramo(t, 0, 0.3)) : paso === 2 || paso === 3 ? 0.35 : 0.6;
      g.strokeStyle = rgba(c.campo, a); g.lineWidth = Math.max(1.6, 0.045 * v.K); g.setLineDash([0.4 * v.K, 0.3 * v.K]); g.lineDashOffset = quieto ? 0 : -reloj * 1.6 * v.K;
      for (const y of [3.65, 4.0, 5.3, 5.55]) { g.beginPath(); g.moveTo(X(1.2), Y(y)); g.lineTo(X(14.8), Y(y)); g.stroke(); }
      g.setLineDash([]); g.lineDashOffset = 0;
    }
    // el protón dentro de un recuadro: eje del campo B₀ vertical y espín inclinado que gira sobre un cono
    function proton(px, py, tam, ang, color = c.proton) {
      const l = tam, an = ang, tx = px + l * Math.sin(an) * Math.cos(giro), ty = py - l * Math.cos(an) + l * Math.sin(an) * Math.sin(giro) * 0.3;
      flecha(px, py + l * 0.9, px, py - l * 1.25, c.campo, 0.9, 0.05);
      g.strokeStyle = rgba(c.rotulo, 0.35); g.lineWidth = 1.4; g.setLineDash([5, 4]); g.beginPath(); g.ellipse(X(px), Y(py - l * Math.cos(an)), l * Math.sin(an) * v.K, l * Math.sin(an) * 0.3 * v.K, 0, 0, 2 * Math.PI); g.stroke(); g.setLineDash([]);
      flecha(px, py, tx, ty, color, 1, 0.07); punto(px, py, 0.12, color);
    }
    function p0() {
      rotulo('imán superconductor', 8, 1.0, { al: 'center', peso: 700, tam: 12.5, escribe: tramo(t, 0.1, 0.4) });
      rotulo('B₀ = 1,5 T, uniforme en todo el túnel', 8, 7.95, { al: 'center', peso: 700, color: c.campo, escribe: tramo(t, 0.4, 0.8) });
      rotulo('corriente en el hilo (⊙ sale, ⊗ entra)', 8, 2.95, { al: 'center', tam: 11.5, color: c.bobina, escribe: tramo(t, 0.55, 0.9), fondo: false });
    }
    function p1() {
      v.panel(9.6, 0.3, 5.9, 3.0);
      proton(11.3, 1.95, 1.05, 0.65);
      rotulo('B₀', 11.45, 0.65, { tam: 12.5, fondo: false, peso: 700, color: c.campo });
      rotulo('protón', 12.6, 1.35, { tam: 12.5, fondo: false, peso: 700, color: c.proton, escribe: tramo(t, 0.2, 0.45) });
      rotulo('precesión', 12.6, 1.85, { tam: 12.5, fondo: false, escribe: tramo(t, 0.35, 0.6) });
      rotulo(`${f1(campoB.T)} T → ${f2(larmor(campoB.T) / 1e6)} MHz`, 12.55, 2.7, { al: 'center', tam: 13.5, fondo: false, peso: 700, color: c.resalta, escribe: tramo(t, 0.5, 0.8) });
      rotulo('f = (γ/2π) B₀', 8, 7.95, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.55, 0.9) });
    }
    function p2() {
      const pulso = suave(tramo(t, 0.15, 0.75)), ang = 0.65 + (Math.PI / 2 - 0.65) * pulso;   // el espín se inclina de 37° a 90°
      v.panel(9.6, 0.3, 5.9, 3.0);
      proton(11.3, 1.95, 1.05, ang, pulso > 0.9 ? c.rf : c.proton);
      rotulo(`${Math.round(ang * 180 / Math.PI)}°`, 12.9, 1.5, { tam: 13.5, fondo: false, peso: 700, color: c.resalta });
      rotulo(`pulso de ${f1(FL / 1e6)} MHz`, 12.55, 2.7, { al: 'center', tam: 13, fondo: false, peso: 700, color: c.rf, escribe: tramo(t, 0.1, 0.4) });
      // la bobina de radio rodea el tórax y emite ondas hacia dentro
      g.strokeStyle = c.rf; g.lineWidth = Math.max(2.2, 0.07 * v.K);
      for (const x of [7.3, 8.9]) { g.beginPath(); g.moveTo(X(x), Y(3.75)); g.lineTo(X(x), Y(5.35)); g.stroke(); }
      const onda = quieto ? 0.5 : (reloj * 1.2) % 1;
      for (let k = 0; k < 3; k++) { const u = (onda + k / 3) % 1, a = 1 - u; g.strokeStyle = rgba(c.rf, 0.55 * a * pulso); g.lineWidth = Math.max(1.6, 0.05 * v.K); g.beginPath(); g.ellipse(X(8.1), Y(4.6), (0.4 + u * 1.6) * v.K, (0.5 + u * 0.6) * v.K, 0, 0, 2 * Math.PI); g.stroke(); }
      rotulo('bobina de radiofrecuencia', 5.4, 2.95, { al: 'center', tam: 11.5, fondo: false, color: c.rf, peso: 700, escribe: tramo(t, 0.3, 0.6) });
      rotulo('solo si la frecuencia coincide', 8, 7.95, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.6, 0.95) });
    }
    function p3() {
      // la bobina receptora en el tórax y, arriba a la derecha, la recuperación de la magnetización longitudinal de dos tejidos
      g.strokeStyle = c.rf; g.lineWidth = Math.max(2.2, 0.07 * v.K);
      for (const x of [7.3, 8.9]) { g.beginPath(); g.moveTo(X(x), Y(3.75)); g.lineTo(X(x), Y(5.35)); g.stroke(); }
      const sen = quieto ? 0.8 : Math.sin(reloj * 7);
      flecha(8.1, 4.62, 8.1 + 0.6 * sen, 4.62 - 0.35, c.proton, 0.9, 0.06);
      v.panel(9.6, 0.3, 5.9, 3.0);
      const gx0 = 10.3, gx1 = 15.1, gy0 = 2.65, gy1 = 1.4, tx = (s) => gx0 + (s / 2) * (gx1 - gx0), ty = (m) => gy0 - m * (gy0 - gy1);
      g.strokeStyle = c.rotulo; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X(gx0), Y(gy1 - 0.2)); g.lineTo(X(gx0), Y(gy0)); g.lineTo(X(gx1), Y(gy0)); g.stroke();
      const curva = (T1, color, hasta) => { g.strokeStyle = color; g.lineWidth = Math.max(2.5, 0.07 * v.K); g.beginPath(); for (let s = 0; s <= 2 * hasta; s += 0.02) { const px = X(tx(s)), py = Y(ty(1 - Math.exp(-s / T1))); if (s) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke(); };
      const hasta = Math.max(0.02, tramo(t, 0.1, 0.8));
      curva(0.25, c.grasa, hasta); curva(4, c.liquido, hasta);
      rotulo('Mz', gx0 + 0.1, gy1 - 0.3, { tam: 11.5, fondo: false }); rotulo('tiempo (s)', gx1, gy0 + 0.3, { al: 'right', tam: 11.5, fondo: false });
      rotulo('grasa: T₁ ≈ 0,25 s', 11.5, 0.62, { tam: 11.5, fondo: false, peso: 700, color: c.grasa, escribe: tramo(t, 0.4, 0.6) });
      rotulo('líquido: T₁ ≈ 4 s', 11.5, 1.0, { tam: 11.5, fondo: false, peso: 700, color: c.liquido, escribe: tramo(t, 0.5, 0.7) });
      rotulo('la magnetización que gira induce una tensión en la bobina', 8, 7.95, { al: 'center', peso: 700, color: c.rf, escribe: tramo(t, 0.55, 0.95) });
    }
    function p4() {
      // el campo crece con la posición: tres rebanadas con su frecuencia
      const G = grad.mT * 1e-3;
      for (let k = 0; k < 40; k++) { const a = 0.08 + 0.3 * (k / 39); g.fillStyle = rgba(c.rf, a); g.fillRect(X(1.3 + k * 0.3375), Y(TY0), 0.34 * v.K, (TY1 - TY0) * v.K); }
      paciente(); lineasB();
      const xs = [-1, 0, 1].map((u) => 8 + u * 3.6), tags = ['−20 cm', '0', '+20 cm'];
      xs.forEach((x, i) => {
        const u = i - 1, f = larmor(B0 + G * X0 * u) / 1e6, a = tramo(t, 0.1 + 0.2 * i, 0.4 + 0.2 * i);
        g.strokeStyle = rgba(c.resalta, a); g.lineWidth = Math.max(1.6, 0.05 * v.K); g.beginPath(); g.moveTo(X(x), Y(TY0 - 0.3)); g.lineTo(X(x), Y(TY1 + 0.3)); g.stroke();
        rotulo(`${f2(f)} MHz`, x, 2.95, { al: 'center', tam: 12.5, peso: 700, color: c.resalta, escribe: a, fondo: false });
        rotulo(tags[i], x, 6.1, { al: 'center', tam: 11.5, escribe: a, fondo: false });
      });
      rotulo(`gradiente ${grad.mT} mT/m: ${f2(HZ_CM * grad.mT / 10 / 1e3)} kHz por cm`, 8, 7.95, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.55, 0.9) });
    }
    function p5() {
      v.panel(0.6, 0.3, 15, 4.9);
      rotulo('B₀ = μ₀ n I = 4π·10⁻⁷ · 2387,5 esp/m · 500 A', 1.1, 1.0, { tam: 13.5, fondo: false, peso: 600, escribe: tramo(t, 0.1, 0.35) });
      rotulo(`B₀ = ${f3(B0)} T`, 1.1, 2.0, { tam: 16, fondo: false, peso: 700, color: c.campo, escribe: tramo(t, 0.3, 0.55) });
      rotulo(`f = 42,577 MHz/T · ${f3(B0)} T = ${f2(FL / 1e6)} MHz`, 1.1, 3.1, { tam: 16, fondo: false, peso: 700, color: c.resalta, escribe: tramo(t, 0.55, 0.8) });
      rotulo(`a 3 T: ${f1(FL3 / 1e6)} MHz`, 1.1, 4.2, { tam: 13.5, fondo: false, peso: 600, escribe: tramo(t, 0.8, 1) });
    }
  }

  const COLORES = ['pared', 'iman', 'bobina', 'camilla', 'cuerpo', 'campo', 'proton', 'rf', 'grasa', 'liquido', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnMagnetostatica };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: ResonanciaMagnetica.pasos, dibuja: ResonanciaMagnetica.dibuja, colores: ResonanciaMagnetica.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); ResonanciaMagnetica.abrirEnMagnetostatica(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = ResonanciaMagnetica;
