/* =====================================================================
   El airbag y el cinturón: los 6 pasos de la animación (texto y dibujo) y
   el ejercicio que se abre en Trabajo y energía (fuerza variable: la
   fuerza del cinturón frena al ocupante en la distancia que se deforma el
   coche). El motor es fenomenos/animacion.js, los ayudantes de dibujo
   fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se
   cargan los datos: pruebas/herramientas/fenomenos/airbag.js.
   ===================================================================== */
const Airbag = (() => {
  // modelo: ocupante de 75 kg a 14 m/s (50 km/h); sin cinturón se para en 5 cm contra el volante, con cinturón en 50 cm (lo que se aplasta el morro)
  const M = 75, V = 14, G = 9.8, D_SIN = 0.05, D_CON = 0.5;
  const Ec = 0.5 * M * V * V, fuerza = (d) => Ec / d, veces = (d) => fuerza(d) / (M * G), tiempo = (d) => (2 * d) / V;
  const datos = { M, V, G, D_SIN, D_CON, Ec, kmh: V * 3.6, Fsin: fuerza(D_SIN), Fcon: fuerza(D_CON), gSin: veces(D_SIN), gCon: veces(D_CON), tSin: tiempo(D_SIN), tCon: tiempo(D_CON), p: M * V };
  const f0 = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), f1 = (x) => x.toFixed(1).replace('.', ',');

  const pasos = [
    { titulo: 'Un choque a 50 km/h', corto: 'Choque', dato: { valor: 'Ec = 7350 J', texto: 'de energía cinética lleva una persona de 75 kg a 14 m/s.' }, texto: 'Un coche va por la ciudad a 50 km/h, unos 14 m/s, y choca de frente contra un muro. El coche se para en un instante, pero lo que importa es qué le pasa a quien va dentro.\n\nUna persona de 75 kg a esa velocidad lleva $E_c = ½ m v^2 = ½ · 75 · 14^2 = 7350 "J"$, lo mismo que si cayera desde 10 metros de altura. Esa energía hay que quitársela en el choque.' },
    { titulo: 'El coche se para, tú no', corto: 'Inercia', dato: { valor: '14 m/s', texto: 'sigues yendo hacia delante aunque el coche ya se haya parado.' }, texto: 'Es la primera ley de Newton: un cuerpo sigue en línea recta a la misma velocidad mientras ninguna fuerza lo frene. El morro del coche se aplasta unos 50 cm contra el muro y el coche se para, pero a ti no te frena nada.\n\nSin cinturón sigues a 14 m/s hasta que el volante, el salpicadero o el parabrisas te paran de golpe.' },
    { titulo: 'Sin cinturón: frenar en 5 centímetros', corto: 'Sin cinturón', dato: { valor: 'F ≈ 147 000 N', texto: 'unas 200 veces tu peso, si te paras en solo 5 cm.' }, texto: 'El trabajo de la fuerza que te frena tiene que quitarte toda la energía cinética: $F · d = ½ m v^2$. Si te paras en lo que se hunde el pecho contra el volante, unos $d = 5 "cm"$:\n\n$F = {7350}/{0,05} = 147 000 "N"$, unas 200 veces tu peso ($m g = 735 "N"$). Ningún cuerpo aguanta esa fuerza concentrada en el pecho o en la cabeza.' },
    { titulo: 'Con cinturón: frenas con el coche', corto: 'Cinturón', dato: { valor: 'F ≈ 14 700 N', texto: 'unas 20 veces tu peso: diez veces menos, frenando en 50 cm.' }, texto: 'El cinturón te ata al coche, así que frenas a la vez que él, mientras se aplasta el morro: unos $d = 50 "cm"$. La energía es la misma, pero la distancia es diez veces mayor:\n\n$F = {7350}/{0,5} = 14 700 "N"$, unas 20 veces tu peso, repartidas por la pelvis y el pecho, donde el cuerpo lo aguanta. Por eso los coches se diseñan para aplastarse: la zona de deformación es la que da los centímetros.', dura: 11000 },
    { titulo: 'El airbag alarga el choque', corto: 'Airbag', dato: { valor: '7 ms → 71 ms', texto: 'dura el frenazo del cuerpo sin cinturón y con cinturón y airbag.' }, texto: 'Visto con el impulso, $F · Δt = m · Δv = 75 · 14 = 1050 "N·s"$ en los dos casos: lo que cambia es cuánto dura. Frenando igual de deprisa todo el rato, $Δt = 2d/v$: 7 ms contra el volante, 71 ms con el cinturón.\n\nEl airbag se infla en unos 30 ms, antes de que llegues al volante, y te recoge la cabeza y el pecho con una superficie grande y blanda: alarga aún más el tiempo y reparte la fuerza. Sin cinturón no sirve: llegarías antes de que esté lleno o te saldrías de él.', dura: 11000 },
    { titulo: 'El cálculo, con el teorema de las fuerzas vivas', corto: 'Cálculo', dato: { valor: 'F = m v² / (2d)', texto: 'la fuerza media es inversamente proporcional a la distancia de frenado.' }, texto: 'Todo sale del teorema de las fuerzas vivas: el trabajo de la fuerza que te frena es la variación de tu energía cinética, $W = −F d = 0 − ½ m v^2$. Con el doble de velocidad, la fuerza es cuatro veces mayor; con el doble de distancia, la mitad.\n\nEn Trabajo y energía se abre como una fuerza variable: una fuerza de $−14 700 "N"$ durante 0,5 m sobre una masa de 75 kg que va a 14 m/s. El área bajo la gráfica es $−7350 "J"$ y la velocidad final sale cero.' },
  ];

  // ejercicio de Trabajo y energía (formato de energia-v1): la fuerza del cinturón como fuerza variable
  const ejercicio = () => ({ modo: 'fuerza', puntos: `0 −${fuerza(D_CON)}; 0.5 −${fuerza(D_CON)}`, m: String(M), v0: String(V), t: '' });
  function abrirEnEnergia(destino) {
    try { localStorage.setItem('energia-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  // 1 unidad del dibujo por metro; muro en x = 12,6; coche de 4,2 m
  const SUELO = 7.4, MURO = 12.6, L = 4.2, AP = 0.5, cam = { x: 8, y: 4.5, z: 1 };
  // «Pruébalo tú» del paso 4: distancia en la que frenas, en cm
  const prueba = { etiqueta: 'la distancia en la que frenas', min: 5, max: 100, paso: 1, valor: 50, d: D_CON,
    muestra: (cm) => `${cm} cm → F = ${f0(fuerza(cm / 100))} N, ${f1(veces(cm / 100))} veces tu peso`,
    cambia: (cm) => { prueba.d = cm / 100; } };
  pasos[3].prueba = prueba;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    const foto = window.FenomenoFoto;
    // la cámara se acerca a la cabina en los pasos del ocupante
    v.sigue(paso === 0 ? { x: 8, y: 4.5, z: 1 } : { x: 10.4, y: 5.6, z: 1.5 }, reloj, quieto);
    const { X, Y, rotulo, punto } = v;
    const cinturon = paso >= 3, airbag = paso >= 4;
    // tiempo del choque: el coche se para en tc = 1 (frenada uniforme), el ocupante sin cinturón sigue y choca
    const tc = paso === 0 ? 0 : paso === 1 || paso === 3 ? 1.25 * t : 1.25;
    const ap = AP * (1 - (1 - Math.min(1, tc)) ** 2), xr = paso === 0 ? MURO - L - (1 - t) * 8 : MURO - L + ap;
    // el ocupante respecto del coche: sin cinturón se adelanta hasta el volante (0,6 m); con cinturón, solo lo que estira (0,15 m)
    const o = cinturon ? 0.15 * suave(Math.min(1, tc)) : Math.min(0.6, 0.5 * Math.min(1, tc) ** 2 + Math.max(0, tc - 1));
    const golpe = !cinturon && tc > 1.1;

    escenario();
    coche(xr, ap);
    if (paso === 0) {
      for (let k = 0; k < 4; k++) { const y = 5.6 + k * 0.45, x = xr - 0.4 - azar(k) * 0.5; g.strokeStyle = rgba(c.rotulo, 0.35); g.lineWidth = 2; g.beginPath(); g.moveTo(X(x - 1.2 * (1 - t * 0.3)), Y(y)); g.lineTo(X(x), Y(y)); g.stroke(); }
      rotulo('50 km/h = 14 m/s', xr + 1.6, 4.2, { al: 'center', peso: 700, escribe: tramo(t, 0.1, 0.4) });
    }
    if (paso === 2 || (paso === 3 && prueba.d < 0.2)) {
      const F = paso === 2 ? datos.Fsin : fuerza(prueba.d), L2 = Math.min(3.2, 0.35 * F / datos.Fcon);
      v.flecha(xr + 2.75 + o, 5.75, xr + 2.75 + o - L2, 5.75, c.resalta, paso === 2 ? suave(tramo(t, 0.2, 0.5)) : 1, 0.06);
      rotulo(`F ≈ ${f0(F)} N`, xr + 2.6 + o - L2, 4.35, { al: 'left', peso: 700, color: c.resalta, escribe: paso === 2 ? tramo(t, 0.4, 0.7) : 1 });
    } else if (paso === 3) {
      const F = fuerza(prueba.d), L2 = Math.min(3.2, 0.35 * F / datos.Fcon);
      v.flecha(xr + 2.75 + o, 5.75, xr + 2.75 + o - L2, 5.75, c.resalta, suave(tramo(t, 0.75, 0.95)), 0.05);
      rotulo(`F ≈ ${f0(F)} N`, xr + 2.6 + o - Math.max(L2, 1.4), 4.35, { al: 'left', peso: 700, color: c.resalta, escribe: tramo(t, 0.8, 1) });
    }
    if (paso === 1) rotulo(tc < 1 ? 'el coche frena…' : 'el coche ya está parado', xr + 1.4, 3.9, { al: 'center', tam: 12.5 });
    if (paso === 4 && !foto) grafica();
    if (paso === 5 && !foto) cuentas();

    function escenario() {
      const gr = g.createLinearGradient(0, 0, 0, Y(SUELO)); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // edificios al fondo
      for (let k = 0; k < 9; k++) { const x = -2 + k * 2.3, al = 2.2 + 2.4 * azar(k + 3); g.fillStyle = k % 2 ? c.edificio : c['edificio-2']; g.fillRect(X(x), Y(SUELO - al), 1.9 * v.K, al * v.K); }
      g.fillStyle = c.asfalto; g.fillRect(0, Y(SUELO), w, h - Y(SUELO));
      g.fillStyle = c.raya; for (let x = -4; x < 22; x += 2) g.fillRect(X(x), Y(SUELO + 0.55), 1 * v.K, 0.08 * v.K);
      // el muro de hormigón
      g.fillStyle = c.muro; g.fillRect(X(MURO), Y(SUELO - 2.6), (v.x1 - MURO + 1) * v.K, 2.6 * v.K);
      g.strokeStyle = rgba(c.rotulo, 0.25); g.lineWidth = 1; g.beginPath();
      for (let y = SUELO - 2.6; y < SUELO; y += 0.4) { g.moveTo(X(MURO), Y(y)); g.lineTo(X(v.x1 + 1), Y(y)); }
      g.stroke();
    }
    // coche visto de lado, mirando a la derecha; el morro se aplasta «ap» metros contra el muro
    function coche(xr, ap) {
      const xf = xr + L - ap, base = SUELO - 0.35, cint = SUELO - 1.25, techo = SUELO - 2.25;
      g.fillStyle = c.coche; g.beginPath();
      g.moveTo(X(xr), Y(base)); g.lineTo(X(xr), Y(cint + 0.1)); g.lineTo(X(xr + 0.55), Y(techo + 0.1)); g.lineTo(X(xr + 2.7), Y(techo)); g.lineTo(X(xr + 3.25), Y(cint));
      // el capó, con pliegues si está aplastado
      const n = 5; for (let k = 1; k <= n; k++) { const x = xr + 3.25 + ((xf - xr - 3.25) * k) / n, dy = ap > 0.02 ? (k % 2 ? -1 : 1) * 0.12 * (ap / AP) : 0; g.lineTo(X(x), Y(cint + 0.08 * k / n + dy)); }
      g.lineTo(X(xf), Y(base)); g.closePath(); g.fill();
      // ventanas
      g.fillStyle = c.cristal; g.beginPath(); g.moveTo(X(xr + 0.7), Y(cint - 0.05)); g.lineTo(X(xr + 0.8), Y(techo + 0.2)); g.lineTo(X(xr + 2.6), Y(techo + 0.12)); g.lineTo(X(xr + 3.05), Y(cint - 0.05)); g.closePath(); g.fill();
      // ruedas
      for (const x of [xr + 0.9, Math.min(xr + 3.4, xf - 0.4)]) { punto(x, SUELO - 0.35, 0.36, c.rueda); punto(x, SUELO - 0.35, 0.15, c.llanta); }
      ocupante(xr, cint);
      // el volante y, en los últimos pasos, el airbag
      const vx = xr + 2.95, vy = cint - 0.35;
      g.strokeStyle = c.rueda; g.lineWidth = Math.max(2, 0.07 * v.K); g.beginPath(); g.moveTo(X(vx + 0.25), Y(cint + 0.1)); g.lineTo(X(vx), Y(vy)); g.stroke();
      g.beginPath(); g.ellipse(X(vx), Y(vy), 0.06 * v.K, 0.22 * v.K, -0.4, 0, 2 * Math.PI); g.stroke();
      if (airbag) { const r = 0.42 * suave(tramo(paso === 4 ? t : 1, 0.05, 0.3)); if (r > 0.01) { g.fillStyle = rgba(c.airbag, 0.92); g.beginPath(); g.ellipse(X(vx - 0.12), Y(vy - 0.05), r * 0.75 * v.K, r * v.K, 0, 0, 2 * Math.PI); g.fill(); } }
    }
    // la persona sentada; «o» es lo que se adelanta respecto del coche
    function ocupante(xr, cint) {
      const cx = xr + 2.0, cad = [cx, cint + 0.15], hom = [cx + 0.15 + o, cint - 0.6], cab = [cx + 0.3 + o * 1.15, cint - 0.82];
      // asiento
      g.strokeStyle = c.asiento; g.lineWidth = Math.max(3, 0.16 * v.K); g.lineCap = 'round'; g.beginPath(); g.moveTo(X(cx - 0.2), Y(cint - 0.85)); g.lineTo(X(cx - 0.1), Y(cint + 0.25)); g.lineTo(X(cx + 0.55), Y(cint + 0.25)); g.stroke();
      g.strokeStyle = c.persona; g.lineWidth = Math.max(3, 0.2 * v.K); g.beginPath(); g.moveTo(X(cad[0]), Y(cad[1])); g.lineTo(X(hom[0]), Y(hom[1])); g.stroke();
      g.lineWidth = Math.max(2.5, 0.14 * v.K); g.beginPath(); g.moveTo(X(cad[0]), Y(cad[1])); g.lineTo(X(cx + 0.75), Y(cint + 0.2)); g.lineTo(X(cx + 0.85), Y(cint + 0.65)); g.moveTo(X(hom[0]), Y(hom[1] + 0.1)); g.lineTo(X(cx + 0.75 + o), Y(cint - 0.35)); g.stroke(); g.lineCap = 'butt';
      punto(cab[0], cab[1], 0.17, c.piel);
      if (cinturon) { g.strokeStyle = c.cinturon; g.lineWidth = Math.max(2, 0.07 * v.K); g.beginPath(); g.moveTo(X(cx - 0.12), Y(cint - 0.82)); g.lineTo(X(hom[0] + 0.05), Y(hom[1] + 0.25)); g.lineTo(X(cx + 0.35), Y(cint + 0.12)); g.stroke(); }
      if (golpe && !quieto) for (let k = 0; k < 7; k++) { const an = (k / 7) * 2 * Math.PI, r = 0.25 + 0.12 * Math.sin(reloj * 12 + k); g.strokeStyle = c.resalta; g.lineWidth = 2; g.beginPath(); g.moveTo(X(cab[0] + 0.3 + 0.2 * Math.cos(an)), Y(cab[1] + 0.2 * Math.sin(an))); g.lineTo(X(cab[0] + 0.3 + r * 1.6 * Math.cos(an)), Y(cab[1] + r * 1.6 * Math.sin(an))); g.stroke(); }
    }
    // paso 5: la fuerza frente al tiempo, con la misma área (el impulso) en los dos casos
    function grafica() {
      v.pantalla();
      const x0 = 0.4, y0 = 0.35, an = 6.4, al = 3.6, a = suave(tramo(t, 0.25, 0.45));
      g.globalAlpha = a; v.panel(x0, y0, an, al); g.globalAlpha = 1;
      if (a <= 0) return;
      const gx0 = x0 + 0.7, gx1 = x0 + an - 0.3, gy0 = y0 + al - 0.55, gy1 = y0 + 0.75, tx = (ms) => gx0 + (ms / 80) * (gx1 - gx0), fy = (F) => gy0 - (F / 150000) * (gy0 - gy1);
      g.globalAlpha = a;
      g.fillStyle = rgba(c.resalta, 0.55); g.fillRect(X(tx(0)), Y(fy(datos.Fsin)), (tx(datos.tSin * 1000) - tx(0)) * v.K, (fy(0) - fy(datos.Fsin)) * v.K);
      const sale = tramo(t, 0.5, 0.8);
      g.fillStyle = rgba(c.persona, 0.7); g.fillRect(X(tx(0)), Y(fy(datos.Fcon)), (tx(datos.tCon * 1000 * sale) - tx(0)) * v.K, (fy(0) - fy(datos.Fcon)) * v.K);
      g.strokeStyle = c.rotulo; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(gx0), Y(gy1 - 0.2)); g.lineTo(X(gx0), Y(gy0)); g.lineTo(X(gx1), Y(gy0)); g.stroke();
      g.globalAlpha = 1;
      rotulo('F (N)', gx0 + 0.1, y0 + 0.35, { tam: 11, fondo: false });
      rotulo('t (ms)', gx1, gy0 + 0.3, { al: 'right', tam: 11, fondo: false });
      rotulo('sin cinturón: 7 ms', tx(datos.tSin * 1000) + 0.15, fy(datos.Fsin) + 0.25, { tam: 11.5, fondo: false, peso: 600, color: c.resalta });
      rotulo('cinturón y airbag: 71 ms', tx(28), fy(datos.Fcon) - 0.3, { tam: 11.5, fondo: false, peso: 600, escribe: tramo(t, 0.7, 0.9) });
      rotulo('misma área: 1050 N·s', tx(28), (gy0 + gy1) / 2, { tam: 11, fondo: false, escribe: tramo(t, 0.85, 1) });
    }
    // paso 6: la cuenta del teorema de las fuerzas vivas
    function cuentas() {
      v.pantalla();
      const a = suave(tramo(t, 0.1, 0.3)); g.globalAlpha = a; v.panel(0.4, 0.35, 6.2, 2.5); g.globalAlpha = 1;
      if (a <= 0) return;
      rotulo('W = −F·d = 0 − ½ m v²', 0.8, 1.0, { tam: 13, fondo: false, peso: 700, escribe: tramo(t, 0.2, 0.45) });
      rotulo('F = 75 · 14² / (2 · 0,5)', 0.8, 1.7, { tam: 12.5, fondo: false, escribe: tramo(t, 0.45, 0.7) });
      rotulo('F = 14 700 N ≈ 20 veces tu peso', 0.8, 2.35, { tam: 12.5, fondo: false, peso: 700, color: c.resalta, escribe: tramo(t, 0.7, 0.95) });
    }
  }

  const COLORES = ['cielo', 'cielo-alto', 'edificio', 'edificio-2', 'asfalto', 'raya', 'muro', 'coche', 'cristal', 'rueda', 'llanta', 'asiento', 'persona', 'piel', 'cinturon', 'airbag', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnEnergia };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: Airbag.pasos, dibuja: Airbag.dibuja, colores: Airbag.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); Airbag.abrirEnEnergia(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = Airbag;
