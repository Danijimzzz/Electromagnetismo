/* =====================================================================
   La chispa al tocar el pomo: los 6 pasos de la animación (texto y dibujo) y
   el ejercicio que se abre en Transitorios RC, RL y RLC (el cuerpo como un
   condensador de 150 pF a 10 kV que se descarga por 330 Ω, el modelo de la
   norma IEC 61000-4-2). El motor es fenomenos/animacion.js, los ayudantes de
   dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo
   se cargan los datos: pruebas/herramientas/fenomenos/chispa-pomo.js.
   ===================================================================== */
const ChispaPomo = (() => {
  // modelo: cuerpo de 150 pF a 10 kV que se descarga por 330 Ω; el aire se rompe a unos 3 MV/m
  const V = 10e3, C = 150e-12, R = 330, RUPTURA = 3e6, E_CARGA = 1.602176634e-19;
  const datos = { V, C, R, RUPTURA, Q: C * V, electrones: (C * V) / E_CARGA, tau: R * C, I0: V / R, U: 0.5 * C * V * V, d: V / RUPTURA };
  const f1 = (x) => x.toFixed(1).replace('.', ',');

  const pasos = [
    { titulo: 'Arrastras los pies por la moqueta', corto: 'Frotamiento', dato: { valor: 'hasta 10 kV', texto: 'puede cargarse tu cuerpo al andar por una moqueta en un día seco.' }, texto: 'Al rozar las suelas con la moqueta, unos materiales arrancan electrones a otros: es el efecto triboeléctrico, el mismo que el del globo frotado en el pelo. A cada paso tu cuerpo se queda con unos cuantos electrones de más.\n\nComo las suelas aíslan, esa carga no se va al suelo y se va acumulando. En un día seco de invierno tu cuerpo llega a estar a 10 kV (o más) respecto del suelo sin que notes nada.' },
    { titulo: 'Tu cuerpo es un condensador', corto: 'Condensador', dato: { valor: 'C ≈ 150 pF', texto: 'Tu cuerpo y el suelo forman un condensador.' }, texto: 'Tu cuerpo es un conductor y el suelo otro: juntos forman un condensador, con las suelas y el aire de dieléctrico. Su capacidad es de unos $C ≈ 150 "pF"$.\n\nA 10 kV guarda una carga $Q = C V = 150 "pF" · 10 "kV" = 1,5 "µC"$, unos $10^{13}$ electrones de más. Parece mucho, pero es una cantidad minúscula: una pila corriente mueve esa carga en una millonésima de segundo.' },
    { titulo: 'Acercas la mano al pomo', corto: 'Acercarse', dato: { valor: 'E = V/d', texto: 'Cuanto más cerca, más intenso el campo entre el dedo y el pomo.' }, texto: 'El pomo es metálico y está unido a la puerta y al suelo, así que está a 0 V. Entre tu dedo, a 10 kV, y el pomo hay un campo de aproximadamente $E = V/d$, que crece a medida que acercas la mano.\n\nEl aire aguanta unos 3 MV/m (su rigidez dieléctrica). Con 10 kV se llega a ese campo cuando $d = (10 "kV")/(3 "MV/m") ≈ 3 "mm"$: la chispa salta antes de que llegues a tocar.' },
    { titulo: 'Salta la chispa', corto: 'Chispa', dato: { valor: '30 A en 50 ns', texto: 'Una corriente enorme, pero durante muy poco tiempo.' }, texto: 'El aire se ioniza y el condensador que eres se descarga de golpe a través de la chispa y de tu piel, con una resistencia de unos 330 Ω. Es un circuito RC: la corriente empieza en $I_0 = V/R = (10 "kV")/(330 "Ω") ≈ 30 "A"$ y cae como $i(t) = I_0 e^{−t/τ}$.\n\nLa constante de tiempo es $τ = R C = 330 "Ω" · 150 "pF" ≈ 50 "ns"$: en unos 250 ns (5τ) se ha acabado todo.' },
    { titulo: 'Poca energía, mucho susto', corto: 'Energía', dato: { valor: '7,5 mJ', texto: 'Toda la energía de la chispa: menos que la de un mosquito volando.' }, texto: 'La energía guardada era $U = 1/2 C V^2 = 1/2 · 150 "pF" · (10 "kV")^2 = 7,5 "mJ"$, muy poca. Duele porque toda esa corriente entra por un punto diminuto de la yema del dedo, que está llena de terminaciones nerviosas.\n\nEn verano pasa mucho menos: el aire húmedo deja una capa finísima de agua sobre la ropa y la moqueta por la que la carga se escapa poco a poco. Con aire seco puedes llegar a unos 35 kV; con aire húmedo, a poco más de 1 kV.' },
    { titulo: 'El truco de la llave', corto: 'Truco', dato: { valor: 'Con una llave', texto: 'La chispa salta entre la llave y el pomo, no en tu piel.' }, texto: 'Si tocas el pomo con una llave o una moneda, la chispa salta entre el metal y el pomo, y la corriente entra en tu mano por toda la superficie con que agarras la llave. No la notas.\n\nPor debajo de unos 3 kV casi nadie siente la chispa; de 10 kV para arriba, duele. Por eso en las fábricas de electrónica se llevan pulseras unidas a tierra: una descarga que no notarías puede romper un chip.', dura: 12000 },
  ];

  // ejercicio de Transitorios (formato de transitorios-v1): descarga RC con C en µF y el estado en t = 100 ns
  const ejercicio = () => ({ modo: 'rc', proceso: 'descarga', V: '', V0: '10000', R: '330', C: '1,5e-4', t: '1e-7', Vobj: '' });
  function abrirEnTransitorios(destino) {
    try { localStorage.setItem('transitorios-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const SUELO = 7.6, POMO = [11.75, 4.7], RPOMO = 0.17, CICLO = 1.4;
  const cam = { x: 8, y: 4.5, z: 1 }, quien = { x: 2.5 };
  // «Pruébalo tú» del último paso: tensión del cuerpo en kV
  const prueba = { etiqueta: 'la tensión de tu cuerpo', min: 1, max: 30, paso: 0.5, valor: 10, kV: 10,
    muestra: (kV) => `${f1(kV)} kV → la chispa salta a ${f1(kV / 3)} mm, con ${f1(0.5 * C * (kV * 1e3) ** 2 * 1e3)} mJ: ${kV < 3 ? 'no la notas' : kV < 10 ? 'la notas' : 'duele'}`,
    cambia: (kV) => { prueba.kV = kV; } };
  pasos[5].prueba = prueba;
  const camaraDe = (paso) => paso === 2 || paso === 3 ? { x: 11, y: 4.6, z: 3 } : paso === 5 ? { x: 10.6, y: 4.6, z: 2.4 } : { x: 8, y: 4.5, z: 1 };
  // hueco entre el dedo y el pomo en cada momento (en unidades del dibujo)
  const hueco = (paso, t) => paso === 2 ? 1.4 - 1.1 * suave(tramo(t, 0.1, 0.9)) : paso === 3 ? 0.3 : paso === 5 ? 0.12 + 0.03 * prueba.kV : 2;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(camaraDe(paso), reloj, quieto);
    const { X, Y, rotulo, signo, punto } = v;
    // la persona va andando en el paso 1 y luego se acerca a la puerta
    const meta = paso === 0 ? 2.5 + 4.5 * suave(tramo(t, 0, 0.85)) : paso === 1 ? 7 : 9.4, antes = quien.x;
    quien.x = paso === 0 || quieto ? meta : quien.x + (meta - quien.x) * Math.min(1, 0.06);
    const anda = paso === 0 ? (t < 0.85 && !quieto ? 1 : 0) : Math.min(1, Math.abs(quien.x - antes) * 30);
    const px = quien.x, carga = paso === 0 ? tramo(t, 0.05, 0.85) : paso === 4 || (paso === 3 && destello() > 0) ? 0.15 : 1;
    const nChispa = Math.floor(reloj / CICLO);
    // la chispa salta al empezar cada CICLO y parpadea medio segundo
    function destello() { if (paso !== 3 && paso !== 5) return 0; const fase = quieto ? 0.05 : reloj % CICLO; return fase < 0.6 ? (1 - fase / 0.6) * (0.65 + 0.35 * Math.sin(fase * 70)) : 0; }

    habitacion();
    persona();
    if (paso === 1) condensador();
    if (paso === 2) campoHueco();
    if (paso === 3 || paso === 5) chispa();
    v.pantalla();
    if (paso === 1) circuito();
    if (paso === 2) lecturaHueco();
    if (paso === 3) grafica();
    if (paso === 4) energia();

    function habitacion() {
      g.fillStyle = c.pared; g.fillRect(0, 0, w, h);
      // zócalo y moqueta con su dibujo
      g.fillStyle = c.zocalo; g.fillRect(0, Y(SUELO - 0.25), w, 0.25 * v.K);
      g.fillStyle = c.alfombra; g.fillRect(0, Y(SUELO), w, h - Y(SUELO));
      g.strokeStyle = rgba(c['alfombra-dibujo'], 0.6); g.lineWidth = Math.max(1, 0.03 * v.K);
      for (let x = Math.floor(v.x0) - 1; x < v.x1 + 1; x += 0.6) { g.beginPath(); g.moveTo(X(x), Y(SUELO + 0.15)); g.lineTo(X(x + 0.3), Y(SUELO + 0.45)); g.lineTo(X(x + 0.6), Y(SUELO + 0.15)); g.stroke(); }
      // puerta con su pomo
      g.fillStyle = c.puerta; g.fillRect(X(11.2), Y(1.3), 3.2 * v.K, (SUELO - 1.3) * v.K);
      g.strokeStyle = rgba(c.rotulo, 0.25); g.lineWidth = 1; g.strokeRect(X(11.55), Y(1.7), 2.5 * v.K, 2.2 * v.K); g.strokeRect(X(11.55), Y(4.3), 2.5 * v.K, 2.9 * v.K);
      g.fillStyle = c.metal; g.fillRect(X(11.55), Y(POMO[1] - 0.06), 0.25 * v.K, 0.12 * v.K);
      const gr = g.createRadialGradient(X(POMO[0] - 0.05), Y(POMO[1] - 0.06), 0, X(POMO[0]), Y(POMO[1]), RPOMO * v.K);
      gr.addColorStop(0, c['metal-brillo']); gr.addColorStop(1, c.metal); g.fillStyle = gr;
      g.beginPath(); g.arc(X(POMO[0]), Y(POMO[1]), RPOMO * v.K, 0, 2 * Math.PI); g.fill();
      if (paso === 2 || paso === 3) rotulo('pomo: 0 V', POMO[0] + 0.05, POMO[1] - 0.45, { al: 'center', tam: 12, fondo: false });
    }
    function persona() {
      const pie = SUELO, cad = [px, 5.6], hombro = [px + 0.2, 3.75], fase = reloj * 6;
      g.strokeStyle = c.persona; g.lineCap = 'round';
      // piernas (se mueven al andar)
      g.lineWidth = 0.32 * v.K;
      for (const s of [1, -1]) { const p = anda * 0.35 * Math.sin(fase) * s; g.beginPath(); g.moveTo(X(cad[0]), Y(cad[1])); g.lineTo(X(cad[0] + p), Y(pie - 0.12)); g.stroke(); }
      g.fillStyle = c.suela; for (const s of [1, -1]) { const p = anda * 0.35 * Math.sin(fase) * s; g.fillRect(X(cad[0] + p - 0.16), Y(pie - 0.14), 0.42 * v.K, 0.14 * v.K); }
      // cuerpo y cabeza
      g.fillStyle = c.persona; g.beginPath(); g.roundRect(X(px - 0.5), Y(3.4), 1 * v.K, 2.4 * v.K, 0.35 * v.K); g.fill();
      g.beginPath(); g.arc(X(px), Y(2.85), 0.45 * v.K, 0, 2 * Math.PI); g.fill();
      // brazo: colgando, hacia el pomo o retirado tras la chispa
      const h2 = hueco(paso, t), retirado = paso === 4 ? suave(tramo(t, 0, 0.3)) : 0;
      let mano = paso >= 2 && paso !== 4 ? [POMO[0] - RPOMO - h2 - (paso === 5 ? 0.45 : 0), POMO[1]] : [hombro[0] + 0.25, hombro[1] + 1.7];
      if (paso === 4) mano = [hombro[0] + 0.9 - 0.4 * retirado, hombro[1] + 0.5 + 0.6 * retirado];
      g.lineWidth = 0.22 * v.K; g.beginPath(); g.moveTo(X(hombro[0]), Y(hombro[1])); g.lineTo(X(mano[0]), Y(mano[1])); g.stroke();
      g.fillStyle = c.piel; g.beginPath(); g.arc(X(mano[0]), Y(mano[1]), 0.15 * v.K, 0, 2 * Math.PI); g.fill();
      if (paso === 5) {
        // la llave que sale de la mano hacia el pomo
        g.fillStyle = c.metal; g.beginPath(); g.arc(X(mano[0] + 0.05), Y(mano[1]), 0.12 * v.K, 0, 2 * Math.PI); g.fill();
        g.fillRect(X(mano[0] + 0.1), Y(mano[1] - 0.035), 0.35 * v.K, 0.07 * v.K);
      }
      g.lineCap = 'butt';
      // electrones de más repartidos por el cuerpo
      const n = Math.round(16 * carga);
      for (let j = 0; j < n; j++) {
        const x = px - 0.32 + 0.64 * azar(j + 3), y = j < 11 ? 3.6 + 2 * azar(j + 30) : 2.65 + 0.4 * azar(j + 60);
        punto(x, y, 0.1, rgba(c.panel, 0.8)); signo(x, y, -1, c.neg, 1, 0.55);
      }
      if (paso === 0 && t < 0.85 && !quieto) for (let j = 0; j < 3; j++) { const u = (reloj * 1.3 + j / 3) % 1; signo(px + (j - 1) * 0.3, SUELO - 0.1 - u * 1.5, -1, c.neg, 1 - u, 0.5); }
      if (paso === 0) rotulo(`${f1(10 * tramo(t, 0.05, 0.85))} kV`, px, 1.9, { al: 'center', peso: 700, color: c.neg, escribe: tramo(t, 0.05, 0.2) });
      if (paso === 4) rotulo('¡Ay!', px + 0.9, 2.3, { al: 'center', peso: 700, tam: 16, color: c.chispa, escribe: tramo(t, 0, 0.15) });
    }
    // paso 2: líneas de campo entre el suelo (+, por inducción) y el cuerpo (−)
    function condensador() {
      const u = suave(tramo(t, 0, 0.6));
      for (let j = 0; j < 7; j++) {
        const xa = px - 2.6 + j * 0.85, ya = SUELO + 0.05, xb = px - 0.4 + j * 0.13, yb = 4.6 + 0.6 * Math.abs(j - 3) / 3;
        const e = (s) => [xa + (xb - xa) * s, ya + (yb - ya) * s * s];
        g.strokeStyle = rgba(c.campo, 0.8); g.lineWidth = Math.max(1, 0.03 * v.K); g.beginPath();
        for (let s = 0; s <= u + 1e-9; s += 0.05) { const [x, y] = e(s); s ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
        g.stroke();
        if (u > 0.95) for (let q = 0; q < 2; q++) { const s = (reloj * 0.3 + q / 2 + azar(j)) % 1, [x, y] = e(s); punto(x, y, 0.045, c.campo); }
        signo(xa, SUELO + 0.3, 1, c.pos, tramo(t, 0.2 + 0.05 * j, 0.5 + 0.05 * j), 0.6);
      }
    }
    // paso 3: el campo en el hueco entre el dedo y el pomo
    function campoHueco() {
      const h2 = hueco(paso, t), xa = POMO[0] - RPOMO - h2, E = V / mm(h2) * 1e3, a = Math.min(1, E / RUPTURA);
      for (let j = -2; j <= 2; j++) { const y = POMO[1] + j * 0.05; v.flecha(POMO[0] - RPOMO, y, xa + 0.02, y, rgba(c.campo, 0.5 + 0.5 * a), 1, 0.012); }
      g.fillStyle = rgba(c.chispa, 0.25 * a * a); g.fillRect(X(xa), Y(POMO[1] - 0.15), h2 * v.K, 0.3 * v.K);
    }
    function mm(h2) { return 3.3 + (20 - 3.3) * (h2 - 0.3) / 1.1; }
    function lecturaHueco() {
      const h2 = hueco(paso, t), d = mm(h2), E = V / (d / 1e3), rompe = E >= RUPTURA * 0.999;
      v.panel(10.2, 0.4, 5.4, 2.05);
      rotulo(`d = ${f1(d)} mm`, 10.5, 0.95, { tam: 13.5, peso: 700, fondo: false });
      rotulo(`E = V/d = ${f1(E / 1e6)} MV/m`, 10.5, 1.45, { tam: 13, peso: 600, fondo: false, color: rompe ? c.chispa : c.rotulo });
      g.fillStyle = rgba(c.rotulo, 0.12); g.fillRect(X(10.5), Y(1.85), 4.8 * v.K, 0.25 * v.K);
      g.fillStyle = rompe ? c.chispa : c.campo; g.fillRect(X(10.5), Y(1.85), 4.8 * v.K * Math.min(1, E / 4e6), 0.25 * v.K);
      const xr = 10.5 + 4.8 * 0.75; g.strokeStyle = c.chispa; g.setLineDash([4, 3]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(xr), Y(1.75)); g.lineTo(X(xr), Y(2.2)); g.stroke(); g.setLineDash([]);
      rotulo('3 MV/m', xr, 2.3, { al: 'center', tam: 10.5, fondo: false, color: c.chispa });
    }
    function chispa() {
      const d0 = destello(), h2 = hueco(paso, t), xa = POMO[0] - RPOMO - h2;
      if (paso === 5 && prueba.kV < 1.5) return;
      if (d0 <= 0) return;
      g.globalCompositeOperation = 'lighter';
      const cxm = (xa + POMO[0] - RPOMO) / 2, r = (0.35 + h2) * (paso === 5 ? 0.6 + prueba.kV / 25 : 1);
      const gr = g.createRadialGradient(X(cxm), Y(POMO[1]), 0, X(cxm), Y(POMO[1]), r * v.K);
      gr.addColorStop(0, rgba(c['chispa-centro'], 0.9 * d0)); gr.addColorStop(0.4, rgba(c.chispa, 0.5 * d0)); gr.addColorStop(1, rgba(c.chispa, 0));
      g.fillStyle = gr; g.beginPath(); g.arc(X(cxm), Y(POMO[1]), r * v.K, 0, 2 * Math.PI); g.fill();
      const n = Math.floor(reloj * 30);
      for (let q = 0; q < 2; q++) v.chispa(xa, POMO[1] + (q - 0.5) * 0.03, POMO[0] - RPOMO, POMO[1], n + q * 7, rgba(q ? c.chispa : c['chispa-centro'], d0), q ? 0.04 : 0.02, 6);
      g.globalCompositeOperation = 'source-over';
      if (paso === 3) { const fl = d0 * 0.25; g.fillStyle = rgba(c['chispa-centro'], fl); g.fillRect(0, 0, w, h); }
    }
    // paso 2: el circuito equivalente, un condensador entre el cuerpo y el suelo
    function circuito() {
      const a = suave(tramo(t, 0.3, 0.6));
      g.globalAlpha = a; v.panel(10.1, 0.5, 5.5, 3.3); g.globalAlpha = 1;
      if (a <= 0) return;
      g.globalAlpha = a; g.strokeStyle = c.rotulo; g.lineWidth = 2;
      const x = 11.4; g.beginPath(); g.moveTo(X(x), Y(1.1)); g.lineTo(X(x), Y(1.95)); g.moveTo(X(x - 0.45), Y(1.95)); g.lineTo(X(x + 0.45), Y(1.95)); g.moveTo(X(x - 0.45), Y(2.25)); g.lineTo(X(x + 0.45), Y(2.25)); g.moveTo(X(x), Y(2.25)); g.lineTo(X(x), Y(3.1)); g.stroke();
      g.beginPath(); for (let j = 0; j < 3; j++) { g.moveTo(X(x - 0.3 + j * 0.1), Y(3.1 + j * 0.12)); g.lineTo(X(x + 0.3 - j * 0.1), Y(3.1 + j * 0.12)); } g.stroke();
      g.globalAlpha = 1;
      rotulo('cuerpo', x, 0.85, { al: 'center', tam: 11.5, fondo: false, escribe: tramo(t, 0.4, 0.55) });
      rotulo('suelo', x + 0.55, 3.2, { tam: 11.5, fondo: false, escribe: tramo(t, 0.45, 0.6) });
      rotulo('C ≈ 150 pF', 12.3, 1.45, { tam: 13.5, peso: 700, fondo: false, escribe: tramo(t, 0.5, 0.7) });
      rotulo('V = 10 kV', 12.3, 1.95, { tam: 13, fondo: false, escribe: tramo(t, 0.6, 0.8) });
      rotulo('Q = C V = 1,5 µC', 12.3, 2.45, { tam: 13, peso: 600, color: c.neg, fondo: false, escribe: tramo(t, 0.7, 0.95) });
    }
    // paso 4: la corriente de la chispa, i(t) = I₀ e^(−t/τ)
    function grafica() {
      const gx = 10, gy = 0.4, gw = 5.7, gh = 3.2, ox = gx + 0.7, oy = gy + gh - 0.55, ax = gw - 1, ay = gh - 1.15, u = tramo(t, 0.1, 0.8);
      v.panel(gx, gy, gw, gh);
      g.strokeStyle = c.rotulo; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(ox), Y(oy - ay - 0.1)); g.lineTo(X(ox), Y(oy)); g.lineTo(X(ox + ax + 0.1), Y(oy)); g.stroke();
      // τ y la curva hasta 250 ns
      const xt = ox + ax * (datos.tau * 1e9 / 250);
      g.setLineDash([4, 3]); g.strokeStyle = rgba(c.rotulo, 0.5); g.beginPath(); g.moveTo(X(xt), Y(oy)); g.lineTo(X(xt), Y(oy - ay * Math.exp(-1))); g.stroke(); g.setLineDash([]);
      g.strokeStyle = c.chispa; g.lineWidth = 2.5; g.beginPath();
      for (let s = 0; s <= u + 1e-9; s += 0.01) { const y = oy - ay * Math.exp(-(s * 250e-9) / datos.tau); s ? g.lineTo(X(ox + ax * s), Y(y)) : g.moveTo(X(ox), Y(oy)); }
      g.stroke();
      rotulo('i (A)', ox - 0.15, gy + 0.3, { al: 'left', tam: 11, fondo: false });
      rotulo('30', ox - 0.12, oy - ay, { al: 'right', tam: 10.5, fondo: false });
      rotulo('t (ns)', ox + ax, oy + 0.32, { al: 'right', tam: 11, fondo: false });
      rotulo('τ = 50', xt, oy + 0.32, { al: 'center', tam: 10.5, fondo: false, escribe: tramo(t, 0.5, 0.7) });
      rotulo('i = I₀ e^(−t/τ)', ox + 1.4, oy - ay + 0.4, { tam: 12.5, peso: 600, color: c.chispa, fondo: false, escribe: tramo(t, 0.3, 0.6) });
    }
    // paso 5: la energía de la chispa y la humedad
    function energia() {
      const x0 = 0.5;
      v.panel(x0, 0.5, 5.9, 3.1);
      rotulo('U = ½ C V² = 7,5 mJ', x0 + 0.35, 1.05, { tam: 13.5, peso: 700, fondo: false, escribe: tramo(t, 0.15, 0.4) });
      const barra = (y, txt, kV, col, ini) => {
        const u = suave(tramo(t, ini, ini + 0.3));
        rotulo(txt, x0 + 0.35, y - 0.3, { tam: 11.5, fondo: false, escribe: tramo(t, ini, ini + 0.15) });
        g.fillStyle = rgba(c.rotulo, 0.1); g.fillRect(X(x0 + 0.35), Y(y), 4.2 * v.K, 0.28 * v.K);
        g.fillStyle = col; g.fillRect(X(x0 + 0.35), Y(y), 4.2 * v.K * (kV / 35) * u, 0.28 * v.K);
        rotulo(`${String(kV).replace('.', ',')} kV`, x0 + 0.45 + 4.2 * (kV / 35) * u, y + 0.14, { tam: 11, peso: 600, fondo: false });
      };
      barra(2, 'Aire seco (invierno, 20 %)', 35, c.chispa, 0.35);
      barra(2.95, 'Aire húmedo (verano, 70 %)', 1.5, c.campo, 0.55);
    }
  }

  /* ---------------- sonido (opcional, apagado al abrir) ---------------- */
  // un chasquido corto con cada chispa de los pasos 4 y 6
  function sonido(ac) {
    const ruido = ac.createBuffer(1, ac.sampleRate * 0.25, ac.sampleRate), d = ruido.getChannelData(0);
    for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ac.sampleRate * 0.02));
    let ultimo = -1;
    return {
      cuadro({ paso, reloj }) {
        const n = Math.floor(reloj / CICLO);
        if ((paso === 3 || (paso === 5 && prueba.kV >= 1.5)) && n !== ultimo) {
          ultimo = n;
          const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), vol = ac.createGain();
          s.buffer = ruido; fl.type = 'highpass'; fl.frequency.value = 1500; vol.gain.value = paso === 5 ? Math.min(0.9, 0.1 + prueba.kV / 30) : 0.6;
          s.connect(fl).connect(vol).connect(ac.destination); s.start();
        }
      },
    };
  }

  const COLORES = ['pared', 'zocalo', 'alfombra', 'alfombra-dibujo', 'puerta', 'metal', 'metal-brillo', 'persona', 'piel', 'suela', 'neg', 'pos', 'campo', 'chispa', 'chispa-centro', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, sonido, COLORES, ejercicio, abrirEnTransitorios };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: ChispaPomo.pasos, dibuja: ChispaPomo.dibuja, colores: ChispaPomo.COLORES, sonido: ChispaPomo.sonido });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); ChispaPomo.abrirEnTransitorios(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = ChispaPomo;
