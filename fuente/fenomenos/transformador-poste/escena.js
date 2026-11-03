/* =====================================================================
   El transformador del poste: los 6 pasos de la animación (texto y dibujo) y el ejercicio que se abre
   en Autoinducción e inducción mutua (bobina de 50 vueltas sobre un toroide de 2500, pestaña de inducción
   mutua, geometría «Bobina sobre un toroide», k = 1). El motor es fenomenos/animacion.js, los ayudantes de dibujo
   fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se cargan los datos:
   pruebas/herramientas/fenomenos/transformador-poste.js.
   DATOS ESCRITOS DE MEMORIA (Dani debe revisarlos): 20 kV → 400 V (relación 50:1), 100 kVA, 50 Hz, núcleo
   de 20 × 20 cm (A = 0,04 m²), rendimiento 99 %. La herramienta calcula el toroide sin hierro: con hierro L y M se
   multiplican por μr, pero la relación de tensiones sigue siendo N₂/N₁.
   ===================================================================== */
const TransformadorPoste = (() => {
  const MU0 = 4e-7 * Math.PI, V1 = 20000, V2 = 400, F = 50, N1 = 2500, N2 = 50, S = 100e3, AREA = 0.04, REND = 0.99;
  const a = 0.08, b = 0.12, h = 0.04;                                                  // toroide de la herramienta (m)
  const W = 2 * Math.PI * F, tension2 = (n2) => (V1 * n2) / N1;
  const I1 = S / V1, I2 = S / V2, flujo = (V, n2) => (V * Math.SQRT2) / (W * n2), PHI = (V2 * Math.SQRT2) / (W * N2), BMAX = PHI / AREA;
  const LN = Math.log(b / a), M = (MU0 * N1 * N2 * h * LN) / (2 * Math.PI), L1 = (MU0 * N1 * N1 * h * LN) / (2 * Math.PI);
  const DIDT = Math.round((V1 * Math.SQRT2) / L1), EPS2 = M * DIDT;                     // pico de I₁' y fem del secundario
  const datos = { V1, V2, F, N1, N2, S, AREA, REND, W, I1, I2, PHI, BMAX, M, L1, DIDT, EPS2, voltiosPorVuelta: V1 / N1, perdidas: S * (1 - REND), tension2, flujo, razon: N1 / N2 };

  const n = (x, d = 1) => x.toFixed(d).replace('.', ',');
  const miles = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const pasos = [
    { titulo: 'El cajón gris del poste que zumba', corto: 'Poste', dato: { valor: '20 000 V → 400 V', texto: 'es lo que hace el transformador de un poste: baja la tensión de la línea a la de las casas.' }, texto: 'En muchos postes y casetas hay un cajón gris que zumba. Por arriba entran los cables de la línea de media tensión, a unos **20 000 V**, y por abajo salen los que van a las casas, a **400 V** entre fases (230 V en cada enchufe).\n\nNo tiene piezas que se muevan, y aun así cambia la tensión en un factor 50 y deja pasar casi toda la energía. Dentro hay solo dos bobinas de hilo y un bloque de hierro. Veamos cómo funciona.' },
    { titulo: 'Dos bobinas y un núcleo de hierro', corto: 'Núcleo', dato: { valor: `${miles(N1)} : ${N2}`, texto: 'es la relación de vueltas del ejemplo: 50 vueltas del primario por cada una del secundario.' }, texto: `Un transformador es un anillo de hierro con dos bobinas que no se tocan. La **primaria**, la que recibe los 20 kV, tiene muchas vueltas ($N_1$ = ${miles(N1)}) de hilo fino. La **secundaria**, que da los 400 V, tiene pocas ($N_2$ = ${N2}) de hilo grueso.\n\nEl hierro hace de guía: casi todo el campo magnético que crea una bobina queda dentro del núcleo y pasa por la otra. Entre las dos no hay ningún cable: solo el campo. (En el dibujo no están todas las vueltas.)` },
    { titulo: 'Un flujo que cambia: Faraday', corto: 'Faraday', dato: { valor: `${n(datos.voltiosPorVuelta, 0)} V por vuelta`, texto: `es la fem que Faraday da a cada vuelta con 50 Hz: la misma para el primario y el secundario.` }, texto: `La corriente alterna del primario crea en el núcleo un flujo $Φ$ que sube, baja y se invierte 50 veces por segundo. Por cada vuelta de cualquier bobina pasa el mismo flujo, y la ley de Faraday da la fem de cada una:\n\n$ε = −N {dΦ}/{dt}$, de modo que $ {V_2}/{V_1} = {N_2}/{N_1} $\n\nCon 20 kV eficaces y 2500 vueltas salen ${n(datos.voltiosPorVuelta, 0)} V por vuelta; con 50 vueltas, $V_2$ = **${V2} V**. El flujo máximo es $Φ = V_2 √2 / (ω N_2)$ = ${n(PHI * 1000, 1)} mWb, y en un núcleo de 0,04 m², $B$ = ${n(BMAX, 2)} T. Cambia el número de vueltas del secundario.` },
    { titulo: 'La misma potencia, otra corriente', corto: 'Potencia', dato: { valor: `${n(I1, 0)} A → ${miles(I2)} A`, texto: `de corriente en el primario y en el secundario: al bajar la tensión, sube la corriente.` }, texto: `Un transformador no crea energía: casi toda la potencia que entra sale. Si el poste entrega ${miles(S / 1000)} kVA, $P = V I$ es igual a los dos lados:\n\n$V_1 I_1 = V_2 I_2$, de modo que $I_1 = S/V_1$ = **${n(I1, 0)} A** e $I_2 = S/V_2$ = **${miles(I2)} A**\n\nPor eso el secundario es de hilo grueso (250 A) y el primario de hilo fino (5 A). Y por eso se transporta la electricidad a tensión alta: con una corriente pequeña se pierde poco en los cables, $P = I^2 R$. El transformador es lo que permite subirla a la salida de la central y bajarla en tu calle.` },
    { titulo: 'Por qué solo funciona con alterna', corto: 'Alterna', dato: { valor: 'ε = 0', texto: 'con corriente continua: el flujo es constante, su derivada es cero y no se induce nada.' }, texto: 'Si conectas el primario a una pila, o a corriente continua, pasa algo curioso: al conectar, el flujo crece un instante y aparece una fem breve; después el flujo es constante y **$ε = −N dΦ/dt = 0$**. En el secundario no hay tensión.\n\nEn el primario, la impedancia de la bobina ($ω L$) es la que limita la corriente cuando es alterna; en continua solo queda la resistencia del hilo, y el primario se quema. Con alterna, el flujo cambia sin parar y la fem aparece siempre. Por eso la red es de corriente alterna: la ganó (guerra de las corrientes) por poder subir y bajar la tensión con transformadores.', dura: 11000 },
    { titulo: 'El zumbido y el calor', corto: 'Zumbido', dato: { valor: '100 Hz', texto: `es el tono del zumbido: el doble de la red, porque la deformación del hierro depende de B², no del sentido.` }, texto: `El hierro no es perfecto. Se deforma un poquito al imantarse (magnetostricción) y lo hace igual con B positivo que con negativo: **dos veces por ciclo**, a 100 Hz. Ese es el zumbido que oyes.\n\nAdemás, el flujo que cambia crea corrientes de Foucault en el propio núcleo, que lo calientan. Por eso se hace de láminas finas de acero al silicio, aisladas entre sí: cortan los remolinos y reducen el calor. Aun así, un transformador de 100 kVA pierde en torno al 1 %, unos ${n(datos.perdidas / 1000, 1)} kW, que se llevan con aceite y aletas. Es un rendimiento del ${n(REND * 100, 0)} %.`, dura: 11000 },
  ];

  // ejercicio de Autoinducción e inducción mutua (formato de induccion-v1): bobina de N₂ vueltas sobre un toroide de N₁ vueltas, con la fem del secundario
  const ejercicio = () => ({ tab: 'M', M: { geo: 'toroide-bobina', N1: String(N1), N2: String(N2), a: String(a * 100), b: String(b * 100), h: String(h * 100), dI1dt: String(DIDT) } });
  function abrirEnInduccion(destino) {
    let st = null;
    try { st = JSON.parse(localStorage.getItem('induccion-v1')); } catch (e) { /* sin estado previo */ }
    const base = st && st.L && st.RL ? st : { L: Induccion.ejemplos.L[0].sc, RL: Induccion.ejemplos.RL[0].sc };
    try { localStorage.setItem('induccion-v1', JSON.stringify({ ...base, ...ejercicio() })); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const cam = { x: 8, y: 4.5, z: 1 };
  const CAMS = [{ x: 8, y: 4.5, z: 1 }, { x: 8, y: 4.5, z: 1 }, { x: 8, y: 4.5, z: 1 }, { x: 8, y: 4.5, z: 1 }, { x: 8, y: 4.5, z: 1 }, { x: 8, y: 4.5, z: 1 }];
  // «Pruébalo tú» del paso 3: vueltas del secundario
  const prueba = { etiqueta: 'las vueltas del secundario', min: 10, max: 100, paso: 5, valor: 50, n2: 50,
    muestra: (k) => `${k} vueltas → ${miles(tension2(k))} V en el secundario`, cambia: (k) => { prueba.n2 = k; } };
  pasos[2].prueba = prueba;

  // núcleo: marco de 7,2 × 5,4, patas de 1,4 y camino medio de 5,8 × 4,0
  const NU = { x0: 4.4, x1: 11.6, y0: 1.8, y1: 7.2, p0: 5.1, p1: 10.9, q0: 2.5, q1: 6.5 };
  const PER = 2 * ((NU.p1 - NU.p0) + (NU.q1 - NU.q0));
  const camino = (s) => {
    let d = ((s % 1) + 1) % 1 * PER; const an = NU.p1 - NU.p0, al = NU.q1 - NU.q0;
    if (d < an) return [NU.p0 + d, NU.q0]; d -= an; if (d < al) return [NU.p1, NU.q0 + d]; d -= al; if (d < an) return [NU.p1 - d, NU.q1]; d -= an; return [NU.p0, NU.q1 - d];
  };

  function dibuja(g, { paso, t, reloj, w, h: alto, c, quieto }) {
    const v = Dibujo.vista(g, w, alto, c, cam);
    v.sigue(CAMS[paso], reloj, quieto);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto, r = quieto ? 0.2 : reloj;
    const ph = quieto ? 0.2 : (r * 0.25) % 1, Phi = Math.sin(2 * Math.PI * ph), dPhi = Math.cos(2 * Math.PI * ph);
    if (paso === 0) poste(); else nucleo();

    // paso 1: el poste con su transformador, las líneas de 20 kV y los cables de 400 V
    function poste() {
      g.fillStyle = c.sala; g.fillRect(0, 0, w, alto);
      g.fillStyle = c.suelo; g.fillRect(0, Y(7.6), w, alto - Y(7.6));
      g.fillStyle = c.poste; g.fillRect(X(7.8), Y(1.6), 0.4 * v.K, 6.0 * v.K); g.fillRect(X(6.2), Y(2.0), 3.6 * v.K, 0.2 * v.K);
      // línea de media tensión (hilos gruesos desde la izquierda) y cables de baja (hacia la casa de la derecha)
      for (const dy of [0, 0.35, 0.7]) { g.strokeStyle = c.caliente; g.lineWidth = Math.max(2, 0.07 * v.K); g.beginPath(); g.moveTo(0, Y(1.2 + dy * 0.2)); g.quadraticCurveTo(X(3.2), Y(1.9 + dy * 0.2), X(6.4 + dy * 0.4), Y(2.0)); g.stroke(); }
      for (const dy of [0, 0.25, 0.5]) { g.strokeStyle = c.onda; g.lineWidth = Math.max(1.5, 0.045 * v.K); g.beginPath(); g.moveTo(X(8.0), Y(4.7 + dy)); g.quadraticCurveTo(X(11.5), Y(5.4 + dy), X(13.2), Y(5.0 + dy * 0.2)); g.stroke(); }
      // el transformador
      g.fillStyle = c.nucleo; g.beginPath(); g.roundRect(X(6.9), Y(2.5), 2.2 * v.K, 2.0 * v.K, 0.15 * v.K); g.fill();
      g.strokeStyle = rgba(c.rotulo, 0.4); g.lineWidth = 1; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(X(6.9 + k * 0.37), Y(2.7)); g.lineTo(X(6.9 + k * 0.37), Y(4.3)); g.stroke(); }
      // zumbido: ondas que salen del cajón
      for (let k = 0; k < 3; k++) { const s = ((quieto ? 0.4 : r * 0.6) + k / 3) % 1; g.strokeStyle = rgba(c.resalta, 0.7 * (1 - s)); g.lineWidth = Math.max(1.5, 0.04 * v.K); g.beginPath(); g.arc(X(8.0), Y(3.5), (1.4 + s * 1.6) * v.K, -0.8, 0.8); g.stroke(); g.beginPath(); g.arc(X(8.0), Y(3.5), (1.4 + s * 1.6) * v.K, Math.PI - 0.8, Math.PI + 0.8); g.stroke(); }
      // la casa
      g.fillStyle = c.casa; g.fillRect(X(13.2), Y(4.9), 2.3 * v.K, 2.7 * v.K); g.beginPath(); g.moveTo(X(12.9), Y(4.9)); g.lineTo(X(14.35), Y(3.9)); g.lineTo(X(15.8), Y(4.9)); g.fill();
      g.fillStyle = c.ventana; g.fillRect(X(13.6), Y(5.5), 0.6 * v.K, 0.6 * v.K); g.fillRect(X(14.5), Y(5.5), 0.6 * v.K, 0.6 * v.K);
      rotulo('20 000 V', 3.6, 1.0, { al: 'center', tam: 13.5, peso: 700, color: c.caliente, escribe: tramo(t, 0.25, 0.55) });
      rotulo('400 V', 11.4, 4.2, { al: 'center', tam: 13.5, peso: 700, color: c.onda, escribe: tramo(t, 0.4, 0.7) });
      rotulo('bzzzz…', 6.3, 3.5, { al: 'right', tam: 13, color: c.resalta, escribe: tramo(t, 0.55, 0.85) });
      rotulo('transformador', 8.0, 5.0, { al: 'center', tam: 12, escribe: tramo(t, 0.65, 0.95) });
    }

    // pasos 2 a 6: el transformador por dentro (núcleo de hierro y dos bobinas)
    function bobina(xc, vueltas, grueso, color) {
      const y0 = 3.0, y1 = 6.0, wd = 1.9, x0 = xc - wd / 2;
      g.fillStyle = rgba(color, 0.2); g.fillRect(X(x0), Y(y0), wd * v.K, (y1 - y0) * v.K);
      g.strokeStyle = color; g.lineWidth = Math.max(1.5, grueso * v.K); g.lineCap = 'round';
      for (let k = 0; k < vueltas; k++) { const y = y0 + 0.1 + (k + 0.5) * ((y1 - y0 - 0.2) / vueltas); g.beginPath(); g.moveTo(X(x0 + 0.05), Y(y + 0.04)); g.lineTo(X(x0 + wd - 0.05), Y(y - 0.04)); g.stroke(); }
      g.lineCap = 'butt';
    }
    function nucleo() {
      g.fillStyle = c.sala; g.fillRect(0, 0, w, alto);
      g.fillStyle = c.nucleo; g.fillRect(X(NU.x0), Y(NU.y0), (NU.x1 - NU.x0) * v.K, (NU.y1 - NU.y0) * v.K);
      g.fillStyle = c.sala; g.fillRect(X(5.8), Y(3.2), 4.4 * v.K, 2.6 * v.K);
      // láminas (paso 6) o calor (paso 6)
      if (paso === 5) { g.strokeStyle = rgba(c.rotulo, 0.35); g.lineWidth = 1; g.beginPath(); for (let k = 1; k < 10; k++) { const x = NU.x0 + k * (1.4 / 10); g.moveTo(X(x), Y(NU.y0)); g.lineTo(X(x), Y(NU.y1)); } g.stroke(); g.fillStyle = rgba(c.caliente, 0.25 + 0.1 * Math.sin(r * 2)); g.fillRect(X(NU.x0), Y(NU.y0), 1.4 * v.K, (NU.y1 - NU.y0) * v.K); }
      const n2d = Math.max(2, Math.round((paso === 2 ? prueba.n2 : N2) / 5));
      bobina(5.1, 24, 0.02, c.cobre); bobina(10.9, n2d, 0.055, c.hilo);
      // flujo magnético: puntos que van y vienen por el camino medio, según el paso
      const cont = paso === 4 && !quieto && (r % 8) < 4;
      const amp = cont ? 0 : paso === 1 ? 0.035 : 0.05, sg = paso === 1 ? Phi : Phi;
      const a = paso === 1 ? suave(tramo(t, 0.2, 0.55)) : 1, N = 18;
      for (let k = 0; k < N; k++) { const [px, py] = camino(k / N + amp * sg); punto(px, py, 0.1, c.campo, a * (cont ? 0.9 : 0.45 + 0.55 * Math.abs(sg))); }
      // cables de entrada y salida
      g.strokeStyle = c.caliente; g.lineWidth = Math.max(2, 0.06 * v.K); g.beginPath(); g.moveTo(X(3.4), Y(2.8)); g.lineTo(X(4.1), Y(3.1)); g.moveTo(X(3.4), Y(6.2)); g.lineTo(X(4.1), Y(5.9)); g.stroke();
      g.strokeStyle = c.onda; g.lineWidth = Math.max(3, 0.11 * v.K); g.beginPath(); g.moveTo(X(12.6), Y(3.1)); g.lineTo(X(13.4), Y(2.8)); g.moveTo(X(12.6), Y(5.9)); g.lineTo(X(13.4), Y(6.2)); g.stroke();
      if (paso === 1) {
        rotulo('núcleo de hierro', 8, 2.15, { al: 'center', tam: 12.5, peso: 700, color: c.rotulo, fondo: false, escribe: tramo(t, 0.1, 0.4) });
        rotulo('primaria: muchas vueltas, hilo fino', 5.1, 7.6, { al: 'center', tam: 12, color: c.cobre, peso: 700, escribe: tramo(t, 0.35, 0.65) });
        rotulo('secundaria: pocas, hilo grueso', 10.9, 7.6, { al: 'center', tam: 12, color: c.hilo, peso: 700, escribe: tramo(t, 0.55, 0.85) });
        rotulo('20 kV', 3.1, 4.5, { al: 'right', tam: 13, peso: 700, color: c.caliente, escribe: tramo(t, 0.2, 0.5) });
        rotulo('400 V', 13.9, 4.5, { tam: 13, peso: 700, color: c.onda, escribe: tramo(t, 0.2, 0.5) });
        rotulo('sin contacto entre bobinas', 8, 4.5, { al: 'center', tam: 12, escribe: tramo(t, 0.7, 1) });
      }
      if (paso === 2) {
        const V2p = tension2(prueba.n2);
        rotulo(`V₁ = ${miles(V1)} V`, 3.1, 4.5, { al: 'right', tam: 12.5, peso: 700, color: c.caliente, escribe: tramo(t, 0.2, 0.5) });
        rotulo(`V₂ = ${miles(V2p)} V`, 13.9, 4.5, { tam: 12.5, peso: 700, color: c.onda, escribe: tramo(t, 0.2, 0.5) });
        rotulo('mismo Φ en cada vuelta', 8, 4.5, { al: 'center', tam: 12.5, peso: 700, color: c.campo, escribe: tramo(t, 0.35, 0.7) });
        rotulo(`N₁ = ${miles(N1)}`, 5.1, 7.6, { al: 'center', tam: 12, escribe: tramo(t, 0.5, 0.8) });
        rotulo(`N₂ = ${prueba.n2}`, 10.9, 7.6, { al: 'center', tam: 12, escribe: tramo(t, 0.5, 0.8) });
        if (!foto) {
          v.pantalla();
          const x0 = 0.3, y0 = 0.25, an = 3.4, al = 2.1, gx = (u) => x0 + 0.3 + u * (an - 0.6), gy = (q) => y0 + al / 2 + 0.15 - q * (al / 2 - 0.6);
          v.panel(x0, y0, an, al);
          g.strokeStyle = rgba(c.rotulo, 0.4); g.lineWidth = 1; g.beginPath(); g.moveTo(X(gx(0)), Y(gy(0))); g.lineTo(X(gx(1)), Y(gy(0))); g.stroke();
          for (const [f2, col] of [[(u) => Math.sin(2 * Math.PI * u), c.campo], [(u) => Math.cos(2 * Math.PI * u), c.corriente]]) {
            g.strokeStyle = col; g.lineWidth = 2.2; g.beginPath(); for (let u = 0; u <= 1.0001; u += 0.01) { u ? g.lineTo(X(gx(u)), Y(gy(f2(u)))) : g.moveTo(X(gx(u)), Y(gy(f2(u)))); } g.stroke(); punto(gx(ph), gy(f2(ph)), 0.07, col);
          }
          rotulo('Φ(t)', x0 + 0.25, y0 + 0.3, { color: c.campo, peso: 700, tam: 11.5, fondo: false }); rotulo('ε ∝ −dΦ/dt', x0 + 1.0, y0 + 0.3, { color: c.corriente, peso: 700, tam: 11.5, fondo: false });
          v.mundo();
        }
      }
      if (paso === 3) {
        const aa = suave(tramo(t, 0.2, 0.55)), sc = Phi >= 0 ? 1 : -1;
        // flechas de corriente sobre los cables de entrada (finas) y de salida (gruesas)
        v.flecha(3.0, 2.55, 3.9, 2.95, c.caliente, aa * (0.35 + 0.65 * Math.abs(dPhi)), 0.04);
        v.flecha(13.7, 2.55, 12.8, 2.95, c.onda, aa * (0.35 + 0.65 * Math.abs(dPhi)), 0.14);
        rotulo(`I₁ = ${n(I1, 0)} A`, 2.9, 1.9, { al: 'center', tam: 13, peso: 700, color: c.caliente, escribe: tramo(t, 0.3, 0.6) });
        rotulo(`I₂ = ${miles(I2)} A`, 13.6, 1.9, { al: 'center', tam: 13, peso: 700, color: c.onda, escribe: tramo(t, 0.45, 0.75) });
        rotulo(`P = V·I = ${miles(S / 1000)} kW`, 8, 4.5, { al: 'center', tam: 13, peso: 700, escribe: tramo(t, 0.6, 0.95) });
        rotulo('la misma potencia, otra corriente', 8, 7.6, { al: 'center', tam: 12, escribe: tramo(t, 0.7, 1) });
      }
      if (paso === 4) {
        const c0 = quieto ? false : (r % 8) < 4;
        rotulo(c0 ? 'corriente continua' : 'corriente alterna', 8, 1.25, { al: 'center', tam: 14, peso: 700, color: c0 ? c.rotulo : c.caliente });
        rotulo(c0 ? 'Φ constante → ε = −dΦ/dt = 0' : 'Φ cambia → hay fem en el secundario', 8, 4.5, { al: 'center', tam: 13, peso: 700, color: c.campo });
        // voltímetro del secundario
        const vx = 14.2, vy = 4.5, valor = c0 ? 0 : V2 * Math.cos(2 * Math.PI * ph);
        g.fillStyle = rgba(c.panel, 0.95); g.beginPath(); g.arc(X(vx), Y(vy), 0.75 * v.K, 0, 2 * Math.PI); g.fill(); g.strokeStyle = c.rotulo; g.lineWidth = 1.5; g.stroke();
        const ang = -Math.PI / 2 + (valor / V2) * 0.95; g.strokeStyle = c.resalta; g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath(); g.moveTo(X(vx), Y(vy + 0.2)); g.lineTo(X(vx + 0.62 * Math.cos(ang)), Y(vy + 0.2 + 0.62 * Math.sin(ang))); g.stroke();
        rotulo('V₂', vx, vy + 0.45, { al: 'center', tam: 11, fondo: false });
        rotulo(`${miles(valor)} V`, vx, vy + 1.2, { al: 'center', tam: 12, peso: 700, color: c.onda, fondo: false });
      }
      if (paso === 5) {
        // ondas de sonido a los lados
        for (const [cx, sg] of [[NU.x0, -1], [NU.x1, 1]]) for (let k = 0; k < 3; k++) { const s = ((quieto ? 0.4 : r * 0.9) + k / 3) % 1; g.strokeStyle = rgba(c.resalta, 0.7 * (1 - s)); g.lineWidth = Math.max(1.5, 0.04 * v.K); g.beginPath(); g.arc(X(cx), Y(4.5), (0.5 + s * 1.2) * v.K, sg > 0 ? -0.9 : Math.PI - 0.9, sg > 0 ? 0.9 : Math.PI + 0.9); g.stroke(); }
        rotulo('láminas de acero al silicio', 8, 7.75, { al: 'center', tam: 12.5, peso: 700, color: c.rotulo, escribe: tramo(t, 0.2, 0.55) });
        rotulo('zumba a 100 Hz', 8, 1.25, { al: 'center', tam: 13.5, peso: 700, color: c.resalta, escribe: tramo(t, 0.35, 0.7) });
        rotulo(`pérdidas ≈ ${n(datos.perdidas / 1000, 1)} kW (1 %)`, 8, 4.5, { al: 'center', tam: 12, color: c.caliente, peso: 700, escribe: tramo(t, 0.55, 0.9) });
      }
    }
  }

  const COLORES = ['sala', 'suelo', 'poste', 'nucleo', 'cobre', 'hilo', 'campo', 'onda', 'corriente', 'resalta', 'caliente', 'casa', 'ventana', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnInduccion };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: TransformadorPoste.pasos, dibuja: TransformadorPoste.dibuja, colores: TransformadorPoste.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); TransformadorPoste.abrirEnInduccion(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = TransformadorPoste;
