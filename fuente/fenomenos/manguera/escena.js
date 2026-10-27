/* =====================================================================
   Tapar la manguera con el dedo: los 6 pasos de la animación (texto y
   dibujo) y el ejercicio que se abre en Fluidos (continuidad y Bernoulli
   entre la manguera y el hueco que deja el dedo). El motor es
   fenomenos/animacion.js, los ayudantes de dibujo fenomenos/dibujo.js y la
   maqueta pagina.html. En Node (pruebas) solo se cargan los datos:
   pruebas/herramientas/fenomenos/manguera.js.
   ===================================================================== */
const Manguera = (() => {
  // modelo: 0,2 L/s por una manguera de 1,6 cm; el dedo deja un hueco como un círculo de 0,7 cm; boca a 1 m del suelo
  const Q = 0.2e-3, D1 = 0.016, D2 = 0.007, H = 1, G = 9.8, RHO = 1000;
  const area = (d) => (Math.PI * d * d) / 4, A1 = area(D1), A2 = area(D2), v1 = Q / A1, vDe = (d) => Q / area(d), v2 = vDe(D2);
  const vuelo = Math.sqrt((2 * H) / G), alcance = (v) => v * vuelo;
  const datos = { Q, D1, D2, H, G, RHO, A1, A2, v1, v2, vuelo, x1: alcance(v1), x2: alcance(v2), dp: 0.5 * RHO * (v2 * v2 - v1 * v1), r45: (v2 * v2) / G, hmax: (v2 * v2) / (2 * G) };
  const f2 = (x) => x.toFixed(2).replace('.', ','), f1 = (x) => x.toFixed(1).replace('.', ',');

  const pasos = [
    { titulo: 'Regar el jardín con la manguera', corto: 'Manguera', dato: { valor: 'Q = 0,2 L/s', texto: 'da el grifo: 12 litros por minuto.' }, texto: 'Abres el grifo, coges la manguera y el agua sale tranquila, cae casi a tus pies. Las plantas del fondo no llegan a mojarse.\n\nPero todos sabemos el truco: tapas la boca de la manguera con el pulgar y el chorro sale disparado y llega mucho más lejos. ¿Por qué, si el grifo sigue dando lo mismo?' },
    { titulo: 'Lo que entra tiene que salir', corto: 'Caudal', dato: { valor: 'v₁ ≈ 1 m/s', texto: 'es la velocidad del agua en la manguera.' }, texto: 'El agua apenas se comprime, así que cada segundo sale por la boca el mismo volumen que entra por el grifo: el caudal $Q = A v$ es el mismo en toda la manguera. Es la ecuación de continuidad.\n\nLa manguera tiene 1,6 cm de diámetro: $A_1 = π (0,8 "cm")^2 = 2,01 "cm"^2$. Así que el agua va a $v_1 = Q/A_1 = (0,2·10^{−3})/(2,01·10^{−4}) ≈ 0,99 "m/s"$.' },
    { titulo: 'El dedo estrecha la salida', corto: 'Dedo', dato: { valor: 'v₂ = 5,2 m/s', texto: 'sale el agua por el hueco que deja el dedo: cinco veces más deprisa.' }, texto: 'Con el pulgar dejas un hueco como un círculo de unos 0,7 cm, de $A_2 = 0,385 "cm"^2$. Por ahí tiene que salir el mismo caudal, así que el agua tiene que ir más deprisa:\n\n$A_1 v_1 = A_2 v_2$ ⇒ $v_2 = v_1 (d_1/d_2)^2 = 0,99 · (1,6/0,7)^2 = 5,2 "m/s"$. La velocidad crece con el cuadrado de lo que estrechas el diámetro.' },
    { titulo: 'Y llega mucho más lejos', corto: 'Alcance', dato: { valor: '0,45 m → 2,35 m', texto: 'de alcance con la manguera horizontal a 1 m del suelo.' }, texto: 'Con la manguera horizontal, cada gota es un tiro horizontal. Desde 1 m de altura tarda lo mismo en caer, la vaya rápida o despacio: $t = √(2h/g) = √(2 · 1/9,8) = 0,45 "s"$.\n\nEn ese tiempo avanza $x = v t$: sin dedo, $0,99 · 0,45 = 0,45 "m"$; con el dedo, $5,2 · 0,45 = 2,35 "m"$. Cinco veces más velocidad, cinco veces más lejos.', dura: 11000 },
    { titulo: '¿De dónde sale la energía?', corto: 'Presión', dato: { valor: 'Δp ≈ 0,13 bar', texto: 'de presión hacen falta para acelerar el agua de 1 a 5,2 m/s.' }, texto: 'Acelerar el agua cuesta energía, y la pone la presión. Según Bernoulli, $p_1 + ½ ρ v_1^2 = p_2 + ½ ρ v_2^2$, así que dentro de la manguera la presión tiene que ser mayor que a la salida:\n\n$Δp = ½ ρ (v_2^2 − v_1^2) = ½ · 1000 · (5,2^2 − 0,99^2) ≈ 13 "kPa"$. La red de agua de una casa da 2 o 3 bar, de sobra: al tapar, la presión sube dentro de la manguera (lo notas en el dedo) y el grifo sigue dando casi el mismo caudal.' },
    { titulo: 'Para llegar aún más lejos, apunta hacia arriba', corto: 'Ángulo', dato: { valor: '2,76 m', texto: 'de alcance a 45° desde el suelo, con el agua a 5,2 m/s.' }, texto: 'El chorro es un tiro parabólico. Sobre un suelo llano, el alcance $R = v^2 sen(2θ)/g$ es máximo a 45°: $R = 5,2^2/9,8 = 2,76 "m"$. Hacia arriba del todo subiría $h = v^2/(2g) = 1,38 "m"$.\n\nEl mismo truco usan las boquillas de las pistolas de riego, las de los bomberos o un pulverizador: estrechar la salida para que el agua gane velocidad.', dura: 11000 },
  ];

  // ejercicio de Fluidos (formato de fluidos-v1): Bernoulli con el caudal, de la manguera al hueco del dedo
  const ejercicio = () => ({ modo: 'bernoulli', datos: 'Q', rho: '1000', d1: '1,6', d2: '0,7', Q: '0,2', p1: '1,13e5', h1: '', h2: '', g: '9,8' });
  function abrirEnFluidos(destino) {
    try { localStorage.setItem('fluidos-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  // 2 unidades del dibujo por metro; suelo, boca de la manguera (a 1 m) y plantas
  const SUELO = 7.7, S = 2, BX = 3.3, BY = SUELO - S * H, PLANTAS = 7.4, cam = { x: 8, y: 4.5, z: 1 };
  // «Pruébalo tú» del paso 4: diámetro del hueco que deja el dedo, en mm
  const prueba = { etiqueta: 'el hueco que deja el dedo', min: 3, max: 16, paso: 0.5, valor: 7, d: D2,
    muestra: (mm) => { const v = vDe(mm / 1000); return `${f1(mm)} mm → v = ${f2(v)} m/s, alcance ${f2(alcance(v))} m`; },
    cambia: (mm) => { prueba.d = mm / 1000; } };
  pasos[3].prueba = prueba;

  // posición de una gota de edad a (s) que sale a vel (m/s) con ángulo ang (°), en el dibujo, y cuánto tarda en caer
  const gota = (vel, ang, a) => { const r = (ang * Math.PI) / 180; return [BX + S * vel * Math.cos(r) * a, BY - S * (vel * Math.sin(r) * a - 0.5 * G * a * a)]; };
  const tVuelo = (vel, ang) => { const vy = vel * Math.sin((ang * Math.PI) / 180); return (vy + Math.sqrt(vy * vy + 2 * G * H)) / G; };

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue({ x: 8, y: 4.5, z: 1 }, reloj, quieto);
    const { X, Y, rotulo, punto } = v;
    const foto = window.FenomenoFoto, tt = quieto ? 0 : reloj * 0.55;
    const dedo = paso >= 2, ang = paso === 5 ? 45 : 0, vel = paso === 3 ? vDe(prueba.d) : dedo ? v2 : v1;

    jardin();
    if (paso === 3) chorro(v1, 0, c['agua-claro'], 0.35, true);
    if (paso === 5) for (const a of [15, 30, 60, 75]) trayectoria(v2, a, rgba(c.agua, 0.35));
    chorro(vel, ang, c.agua, 1, false);
    persona(ang, dedo);
    if (paso === 3) {
      const xa = BX + S * alcance(vel), xs = BX + S * alcance(v1);
      rotulo(`sin dedo: ${f2(datos.x1)} m`, xs, SUELO + 0.55, { al: 'center', tam: 12, escribe: tramo(t, 0.2, 0.45) });
      rotulo(`con el dedo: ${f2(alcance(vel))} m`, Math.min(xa, 14.5), SUELO + 0.55, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.4, 0.7) });
      v.flecha(BX, SUELO + 0.15, xa, SUELO + 0.15, c.resalta, tramo(t, 0.4, 0.6), 0.03);
    }
    if (paso === 5) rotulo(`45°: ${f2(datos.r45)} m desde el suelo`, 11.5, 2.6, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.3, 0.6) });
    if (paso === 0) rotulo('el agua cae a tus pies', BX + 1.6, SUELO - 1.2, { tam: 12.5, escribe: tramo(t, 0.4, 0.7) });
    if ((paso === 1 || paso === 2 || paso === 4) && !foto) tubo();

    function jardin() {
      const gr = g.createLinearGradient(0, 0, 0, Y(SUELO)); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // casa con el grifo a la izquierda
      g.fillStyle = c.pared; g.fillRect(X(v.x0 - 1), Y(2.4), (1.6 - v.x0 + 1) * v.K, (SUELO - 2.4) * v.K);
      g.fillStyle = c.teja; g.beginPath(); g.moveTo(X(v.x0 - 1), Y(2.4)); g.lineTo(X(1.9), Y(2.4)); g.lineTo(X(v.x0 - 1), Y(1.2)); g.fill();
      g.fillStyle = c.grifo; g.fillRect(X(1.6), Y(6.15), 0.3 * v.K, 0.12 * v.K); g.fillRect(X(1.72), Y(6.0), 0.07 * v.K, 0.15 * v.K);
      // valla del fondo
      g.strokeStyle = c.valla; g.lineWidth = Math.max(1, 0.05 * v.K); g.beginPath();
      for (let x = 2; x < v.x1 + 1; x += 0.6) { g.moveTo(X(x), Y(SUELO - 0.2)); g.lineTo(X(x), Y(SUELO - 1.4)); }
      g.moveTo(X(1.6), Y(SUELO - 1.1)); g.lineTo(X(v.x1 + 1), Y(SUELO - 1.1)); g.moveTo(X(1.6), Y(SUELO - 0.6)); g.lineTo(X(v.x1 + 1), Y(SUELO - 0.6)); g.stroke();
      g.fillStyle = c.cesped; g.fillRect(0, Y(SUELO), w, h - Y(SUELO));
      g.strokeStyle = c['cesped-2']; g.lineWidth = 1; g.beginPath();
      for (let j = 0; j < 140; j++) { const x = v.x0 + azar(j) * (v.x1 - v.x0), y = SUELO + 0.1 + azar(j + 300) * 1.2; g.moveTo(X(x), Y(y)); g.lineTo(X(x + 0.04), Y(y - 0.15)); }
      g.stroke();
      // plantas y flores al fondo
      for (let j = 0; j < 5; j++) {
        const x = PLANTAS + j * 0.75, al = 0.7 + 0.35 * azar(j + 20);
        g.strokeStyle = c.hoja; g.lineWidth = Math.max(1.5, 0.05 * v.K); g.beginPath(); g.moveTo(X(x), Y(SUELO)); g.lineTo(X(x), Y(SUELO - al)); g.stroke();
        g.fillStyle = c.hoja; g.beginPath(); g.ellipse(X(x - 0.15), Y(SUELO - al * 0.5), 0.16 * v.K, 0.07 * v.K, 0.5, 0, 2 * Math.PI); g.fill();
        punto(x, SUELO - al, 0.17, j % 2 ? c.flor : c['flor-2']); punto(x, SUELO - al, 0.06, c.centro);
      }
      // la manguera por el suelo, del grifo a la mano
      g.strokeStyle = c.manguera; g.lineWidth = Math.max(2, 0.09 * v.K); g.lineCap = 'round'; g.beginPath(); g.moveTo(X(1.75), Y(6.0));
      g.bezierCurveTo(X(1.8), Y(7.6), X(2.4), Y(7.7), X(2.6), Y(7.4)); g.bezierCurveTo(X(2.8), Y(7.0), X(2.7), Y(BY + 0.2), X(BX - 0.4), Y(BY)); g.stroke(); g.lineCap = 'butt';
    }
    function trayectoria(vel, ang, color) {
      const T = tVuelo(vel, ang); g.strokeStyle = color; g.lineWidth = Math.max(1, 0.03 * v.K); g.setLineDash([4, 4]); g.beginPath();
      for (let k = 0; k <= 40; k++) { const [x, y] = gota(vel, ang, (T * k) / 40); k ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
      g.stroke(); g.setLineDash([]);
    }
    // el chorro: una banda que se abre un poco y gotas que avanzan por ella; charco donde cae
    function chorro(vel, ang, color, a, fantasma) {
      const T = tVuelo(vel, ang), ancho = Math.max(0.05, 0.12 * Math.sqrt(v1 / vel));
      g.globalAlpha = a;
      g.strokeStyle = rgba(color, 0.55); g.lineCap = 'round';
      for (let k = 0; k < 30; k++) { const a0 = (T * k) / 30, a1 = (T * (k + 1)) / 30, [xa, ya] = gota(vel, ang, a0), [xb, yb] = gota(vel, ang, a1); g.lineWidth = (ancho * (1 + 2.2 * (k / 30))) * v.K; g.beginPath(); g.moveTo(X(xa), Y(ya)); g.lineTo(X(xb), Y(yb)); g.stroke(); }
      g.lineCap = 'butt';
      if (!fantasma) for (let k = 0; k < 46; k++) { const ag = ((tt + (k / 46) * T) % T), [x, y] = gota(vel, ang, ag), dx = (azar(k) - 0.5) * 0.12 * (ag / T), dy = (azar(k + 50) - 0.5) * 0.12 * (ag / T); punto(x + dx, y + dy, 0.035 + 0.02 * azar(k + 9), c['agua-gota']); }
      const [xc] = gota(vel, ang, T); g.fillStyle = rgba(color, 0.4); g.beginPath(); g.ellipse(X(xc), Y(SUELO + 0.08), (0.3 + 0.1 * Math.sin(tt * 9)) * v.K, 0.08 * v.K, 0, 0, 2 * Math.PI); g.fill();
      if (!fantasma && !quieto) for (let k = 0; k < 5; k++) { const s = (tt * 3 + k / 5) % 1; punto(xc + (azar(k) - 0.5) * 0.6 * s, SUELO - 0.35 * Math.sin(Math.PI * s), 0.03, c['agua-gota'], 1 - s); }
      g.globalAlpha = 1;
    }
    // persona que sujeta la manguera; con «dedo», el pulgar tapa media boca
    function persona(ang, dedo) {
      const px = 2.25, cab = SUELO - 3.2, r = (ang * Math.PI) / 180;
      g.strokeStyle = c.persona; g.lineCap = 'round'; g.lineWidth = Math.max(3, 0.18 * v.K);
      g.beginPath(); g.moveTo(X(px - 0.25), Y(SUELO)); g.lineTo(X(px), Y(SUELO - 1.6)); g.lineTo(X(px + 0.25), Y(SUELO)); g.moveTo(X(px), Y(SUELO - 1.6)); g.lineTo(X(px), Y(cab + 0.45)); g.stroke();
      g.lineWidth = Math.max(2.5, 0.13 * v.K); g.beginPath(); g.moveTo(X(px), Y(cab + 0.75)); g.lineTo(X(BX - 0.55), Y(BY + 0.05)); g.stroke(); g.lineCap = 'butt';
      punto(px, cab + 0.1, 0.36, c.piel);
      // la boca de la manguera (girada con el ángulo del chorro) y la mano
      g.save(); g.translate(X(BX), Y(BY)); g.rotate(-r);
      g.fillStyle = c.manguera; g.fillRect(-0.6 * v.K, -0.07 * v.K, 0.6 * v.K, 0.14 * v.K);
      g.fillStyle = c.piel; g.beginPath(); g.ellipse(-0.42 * v.K, 0, 0.17 * v.K, 0.13 * v.K, 0, 0, 2 * Math.PI); g.fill();
      if (dedo) { g.beginPath(); g.ellipse(-0.04 * v.K, -0.06 * v.K, 0.12 * v.K, 0.06 * v.K, 0.35, 0, 2 * Math.PI); g.fill(); }
      g.restore();
    }
    // esquema de la boca de la manguera: el agua acelera donde el dedo estrecha el paso
    function tubo() {
      v.pantalla();
      const x0 = 9.0, y0 = 0.35, an = 6.6, al = paso === 4 ? 3.4 : 2.7, a = suave(tramo(t, 0.05, 0.3));
      g.globalAlpha = a; v.panel(x0, y0, an, al); g.globalAlpha = 1;
      if (a <= 0) return;
      const tx0 = x0 + 0.4, tx1 = x0 + an - 0.6, ym = y0 + 1.35, W = 0.9, Wn = paso === 1 ? W : W * (A2 / A1) * 1.9;
      const ancho = (s) => (s < 0.62 ? W : s < 0.86 ? W + (Wn - W) * suave((s - 0.62) / 0.24) : Wn), X0 = (s) => tx0 + s * (tx1 - tx0);
      g.globalAlpha = a; g.fillStyle = rgba(c.agua, 0.22); g.beginPath();
      for (let k = 0; k <= 60; k++) { const s = k / 60; g.lineTo(X(X0(s)), Y(ym - ancho(s) / 2)); }
      for (let k = 60; k >= 0; k--) { const s = k / 60; g.lineTo(X(X0(s)), Y(ym + ancho(s) / 2)); }
      g.fill();
      g.strokeStyle = c.manguera; g.lineWidth = 3;
      for (const sg of [-1, 1]) { g.beginPath(); for (let k = 0; k <= 60; k++) { const s = k / 60; g.lineTo(X(X0(s)), Y(ym + (sg * ancho(s)) / 2)); } g.stroke(); }
      // gotas que avanzan con v ∝ 1/ancho: tiempo acumulado para recorrer el tubo
      const acum = [0]; for (let k = 1; k <= 100; k++) acum.push(acum[k - 1] + ancho((k - 0.5) / 100) / W / 100);
      const T = acum[100], dondeS = (tau) => { let k = 0; while (k < 100 && acum[k + 1] < tau) k++; return (k + (tau - acum[k]) / (acum[k + 1] - acum[k])) / 100; };
      for (let j = 0; j < 36; j++) { const s = dondeS(((tt * 0.35 + j / 36) * T) % T), lado = (azar(j) - 0.5) * 0.85; punto(X0(s), ym + lado * ancho(s), 0.045, c['agua-gota'], a); }
      g.globalAlpha = 1;
      rotulo(`A₁ = 2,01 cm²   v₁ = ${f2(v1)} m/s`, tx0 + 0.1, ym + W / 2 + 0.35, { tam: 12, fondo: false, peso: 600 });
      if (paso === 1) rotulo('Q = A₁ v₁ = 0,2 L/s', tx0 + 0.1, y0 + 0.3, { tam: 12, fondo: false, escribe: tramo(t, 0.3, 0.55) });
      if (paso >= 2) {
        g.fillStyle = rgba(c.piel, a); g.beginPath(); g.ellipse(X(tx1 - 0.25), Y(ym - Wn / 2 - 0.42), 0.55 * v.K, 0.38 * v.K, 0.15, 0, 2 * Math.PI); g.fill();
        rotulo('dedo', tx1 - 0.25, ym - Wn / 2 - 0.45, { al: 'center', tam: 11, fondo: false });
        rotulo(`v₂ = ${f2(v2)} m/s`, tx1 + 0.45, ym + 0.45, { al: 'right', tam: 12.5, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.3, 0.55) });
        v.flecha(tx1 - 0.2, ym, tx1 + 0.45, ym, c.resalta, a, 0.035);
      }
      if (paso === 4) {
        // la presión: alta dentro de la manguera, la del aire a la salida
        const bar = (y, p, txt) => { const lw = (p - 0.9) * 12; g.fillStyle = rgba(c.presion, 0.75 * a); g.fillRect(X(tx0), Y(y - 0.13), lw * v.K, 0.26 * v.K); rotulo(txt, tx0 + lw + 0.15, y, { tam: 11.5, fondo: false }); };
        bar(y0 + 2.5, 1.13, 'presión dentro: 1,13 bar'); bar(y0 + 2.95, 1.0, 'a la salida: 1,00 bar (la del aire)');
      }
    }
  }

  const COLORES = ['cielo', 'cielo-alto', 'pared', 'teja', 'grifo', 'valla', 'cesped', 'cesped-2', 'hoja', 'flor', 'flor-2', 'centro', 'manguera', 'agua', 'agua-claro', 'agua-gota', 'persona', 'piel', 'presion', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnFluidos };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: Manguera.pasos, dibuja: Manguera.dibuja, colores: Manguera.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); Manguera.abrirEnFluidos(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = Manguera;
