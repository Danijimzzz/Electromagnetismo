/* =====================================================================
   El altavoz y el motor eléctrico: los 6 pasos de la animación (texto y dibujo) y el ejercicio que se abre en
   Fuerza magnética (par sobre una bobina de 100 vueltas de 4 × 3 cm con 0,5 A en un campo de 0,1 T). Un mismo
   efecto, la fuerza de Lorentz sobre un hilo con corriente F = I L B, hace moverse el cono del altavoz (bobina de
   40 vueltas de 1,25 cm de radio en un campo de 1 T) y girar el rotor del motor (par τ = N I S B sen θ). Los datos
   numéricos son de un altavoz y un motor de juguete típicos, puestos para ilustrar. El motor es
   fenomenos/animacion.js, los ayudantes de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas)
   solo se cargan los datos: pruebas/herramientas/fenomenos/altavoz-motor.js.
   ===================================================================== */
const AltavozMotor = (() => {
  // altavoz: B del entrehierro, vueltas y radio de la bobina móvil, corriente de la señal
  const B_ALT = 1, N_ALT = 40, R_ALT = 0.0125, I_ALT = 0.5, L_ALT = N_ALT * 2 * Math.PI * R_ALT, F_ALT = B_ALT * I_ALT * L_ALT;
  // motor: bobina rectangular de N vueltas de a × b con I en un campo B
  const N_MOT = 100, A_MOT = 0.04, B_MOT = 0.03, I_MOT = 0.5, B_CAMPO = 0.1, S_MOT = A_MOT * B_MOT, M_MOT = N_MOT * I_MOT * S_MOT;
  const TAU_MAX = M_MOT * B_CAMPO, F_LADO = N_MOT * I_MOT * A_MOT * B_CAMPO;
  const par = (grados) => TAU_MAX * Math.sin((grados * Math.PI) / 180);
  const TAU_MEDIO = (2 / Math.PI) * TAU_MAX;                    // valor medio de |sen θ|, con el conmutador
  const datos = { B_ALT, N_ALT, R_ALT, I_ALT, L_ALT, F_ALT, N_MOT, A_MOT, B_MOT, I_MOT, B_CAMPO, S_MOT, M_MOT, TAU_MAX, F_LADO, TAU_MEDIO, par, fuerza: (I) => B_ALT * I * L_ALT };
  const f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ','), f0 = (x) => String(Math.round(x));
  const f3 = (x) => String(+x.toPrecision(2)).replace('.', ',');

  const pasos = [
    { titulo: 'Una corriente en un campo siente una fuerza', corto: 'Fuerza', dato: { valor: 'F = I L B', texto: 'es la fuerza sobre un hilo de longitud L con corriente I perpendicular a un campo B.' }, texto: 'Dentro de un campo magnético, cada carga en movimiento sufre una fuerza perpendicular a su velocidad y al campo. Una corriente es un montón de cargas moviéndose por un hilo, así que el hilo entero recibe un empujón: $F = I L × B$.\n\nSi el hilo es perpendicular al campo, vale $F = I L B$. Su sentido lo da la regla de la mano derecha: los dedos de la corriente hacia el campo, y el pulgar señala la fuerza. Si cambias el sentido de la corriente, la fuerza también cambia de sentido. En eso se basan los altavoces y los motores.' },
    { titulo: 'El altavoz: una bobina que empuja un cono', corto: 'Altavoz', dato: { valor: 'sonido = corriente × campo', texto: 'el cono se mueve al ritmo de la corriente que llega del amplificador.' }, texto: 'Un altavoz tiene un imán con forma de anillo y un polo central: entre los dos, en un hueco estrecho, el campo es radial, siempre perpendicular al hilo. Dentro del hueco hay una bobina ligera pegada al cono de papel.\n\nLa corriente del amplificador es alterna y sigue la forma del sonido. Cuando va en un sentido, la fuerza empuja la bobina hacia fuera; cuando va en el otro, hacia dentro. El cono vibra con la música y mueve el aire: eso es el sonido.' },
    { titulo: 'Cuánta fuerza hace la bobina', corto: 'Fuerza', dato: { valor: `F = ${f2(F_ALT)} N`, texto: 'con 0,5 A en una bobina de 40 vueltas en un campo de 1 T.' }, texto: `Todas las vueltas de la bobina cuentan como un solo hilo largo: $L = N · 2π r = 40 · 2π · 0,0125 = ${f2(L_ALT)} "m"$. Aunque la bobina sea pequeña, sumando sus vueltas se consigue mucho hilo dentro del campo.\n\nCon $B = 1 "T"$ y $I = 0,5 "A"$ sale $F = B I L = ${f2(F_ALT)} "N"$. Y como F es proporcional a I, el cono reproduce la señal sin deformarla: el doble de corriente, el doble de empuje. Mueve el deslizador para verlo.`, prueba: null },
    { titulo: 'El motor: dos fuerzas que hacen girar', corto: 'Motor', dato: { valor: `τ máx = ${f3(TAU_MAX)} N·m`, texto: 'es el par de una bobina de 100 vueltas de 4 × 3 cm con 0,5 A en 0,1 T.' }, texto: `En un motor la bobina es una espira rectangular que puede girar en un campo. Sus dos lados largos llevan la corriente en sentidos contrarios, así que reciben fuerzas contrarias: uno es empujado hacia arriba y el otro hacia abajo. No mueven la bobina de sitio, pero la hacen girar.\n\nEl par que resulta es $τ = N I S B "sen" θ$, donde θ es el ángulo entre la normal a la bobina y el campo. Es máximo, $τ = ${f3(TAU_MAX)} "N·m"$, con la bobina paralela al campo, y nulo cuando es perpendicular. Mueve el deslizador para cambiar el ángulo.`, prueba: null },
    { titulo: 'El conmutador: cambiar la corriente para no frenar', corto: 'Conmutador', dato: { valor: 'cada media vuelta', texto: 'el conmutador invierte la corriente, y el par sigue empujando en el mismo sentido.' }, texto: 'Hay un problema: al pasar la bobina por la vertical, los lados cambian de sitio y el par pasaría a frenarla, como se ve en la curva punteada, que se vuelve negativa. La bobina oscilaría en vez de girar.\n\nLa solución es el conmutador, un anillo partido con unas escobillas que rozan, que invierte la corriente justo en ese momento. Con eso el par es siempre del mismo signo, $|"sen" θ|$, y el motor gira sin parar. Su valor medio es $2/π$ del máximo, unos $' + f3(TAU_MEDIO) + ' "N·m"$.', dura: 11000 },
    { titulo: 'Los dos cálculos, con la misma fuerza', corto: 'Cálculo', dato: { valor: `${f2(F_ALT)} N y ${f3(TAU_MAX)} N·m`, texto: 'es la fuerza sobre el cono del altavoz y el par máximo del motor.' }, texto: `Altavoz: $L = N 2π r = ${f2(L_ALT)} "m"$ y $F = B I L = 1 · 0,5 · ${f2(L_ALT)} = ${f2(F_ALT)} "N"$.\n\nMotor: cada lado largo sufre $F = N I a B = 100 · 0,5 · 0,04 · 0,1 = ${f1(F_LADO)} "N"$, y el par es esa fuerza por el brazo: $τ = N I S B = 100 · 0,5 · 0,0012 · 0,1 = ${f3(TAU_MAX)} "N·m"$.\n\nEn Fuerza magnética se abre el par sobre esa bobina; con los otros dos modos de esa herramienta se calcula la fuerza sobre un hilo, que es lo que hace el altavoz.` },
  ];

  // ejercicio de Fuerza magnética (formato de fuerza-v1): la bobina del motor con la normal perpendicular a B
  const ejercicio = () => ({ modo: 'espira', N: String(N_MOT), I: '0,5', forma: 'rect', a: '0,04', b: '0,03', R: '', B: '0,1', th: '90' });
  function abrirEnFuerza(destino) {
    try { localStorage.setItem('fuerza-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const cam = { x: 8, y: 4.5, z: 1 };
  // «Pruébalo tú»: la corriente del altavoz (paso 3) y el ángulo de la bobina (paso 4)
  const cor = { etiqueta: 'la corriente en la bobina del altavoz (A)', min: 0, max: 1.5, paso: 0.1, valor: I_ALT, I: I_ALT,
    muestra: (I) => `${f1(I)} A → F = ${f2(datos.fuerza(I))} N`, cambia: (I) => { cor.I = I; } };
  const ang = { etiqueta: 'el ángulo θ entre la normal de la bobina y el campo (°)', min: 0, max: 180, paso: 5, valor: 90, th: 90, tocada: false,
    muestra: (a) => `θ = ${f0(a)}° → τ = ${f3(par(a))} N·m`, cambia: (a) => { ang.th = a; ang.tocada = true; } };
  pasos[2].prueba = cor; pasos[3].prueba = ang;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue({ x: 8, y: 4.5, z: 1 }, reloj, quieto);
    const { X, Y, rotulo, punto, flecha } = v;
    // papel de cuaderno con luz en el centro y las esquinas en sombra
    g.fillStyle = c.fondo; g.fillRect(0, 0, w, h); v.brillo(8, 4.5, 9, c.panel, 0.55);
    g.strokeStyle = rgba(c.rotulo, 0.06); g.lineWidth = 1; g.beginPath();
    for (let x = 0; x <= 16; x += 1) { g.moveTo(X(x), 0); g.lineTo(X(x), h); }
    for (let y = 0; y <= 9; y += 1) { g.moveTo(0, Y(y)); g.lineTo(w, Y(y)); }
    g.stroke(); v.vineta(0.12);

    // corriente que sale de la hoja (⊙) o entra (⊗)
    const saliente = (x, y, r, col, a = 1) => { g.globalAlpha = a; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(1.5, 0.05 * v.K); g.beginPath(); g.arc(X(x), Y(y), r * v.K, 0, 2 * Math.PI); g.stroke(); g.beginPath(); g.arc(X(x), Y(y), r * v.K * 0.3, 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1; };
    const entrante = (x, y, r, col, a = 1) => { g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = Math.max(1.5, 0.05 * v.K); g.beginPath(); g.arc(X(x), Y(y), r * v.K, 0, 2 * Math.PI); g.stroke(); const d = r * 0.65 * v.K; g.beginPath(); g.moveTo(X(x) - d, Y(y) - d); g.lineTo(X(x) + d, Y(y) + d); g.moveTo(X(x) + d, Y(y) - d); g.lineTo(X(x) - d, Y(y) + d); g.stroke(); g.globalAlpha = 1; };
    const rect = (x, y, ancho, alto, col, r = 0.06) => { if (col[0] === '#') return v.pieza(x, y, ancho, alto, col, r); g.fillStyle = col; g.beginPath(); g.roundRect(X(x), Y(y), ancho * v.K, alto * v.K, r * v.K); g.fill(); };

    if (paso === 0) hilo(); else if (paso === 1 || paso === 2) altavoz(); else if (paso === 3) motor(); else if (paso === 4) conmutador(); else cuentas();

    // paso 1: un hilo con corriente en un campo que entra en la hoja
    function hilo() {
      const a = suave(tramo(t, 0.05, 0.3)), fz = suave(tramo(t, 0.45, 0.8));
      for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) entrante(2 + i * 1.5, 1.4 + j * 1.5, 0.17, c.imanS, 0.45 * a);
      rotulo('B (entra en la hoja)', 14, 0.65, { al: 'right', tam: 12.5, color: c.imanS, escribe: tramo(t, 0.1, 0.3) });
      const y = 4.6 - 0.55 * fz;
      g.strokeStyle = c.cobre; g.lineWidth = Math.max(4, 0.17 * v.K); g.lineCap = 'round'; g.beginPath(); g.moveTo(X(1.2), Y(y)); g.lineTo(X(14.8), Y(y)); g.stroke(); g.lineCap = 'butt';
      for (let k = 0; k < 13; k++) { const x = 1.5 + (k + (quieto ? 0 : reloj * 2.6)) % 13; punto(x, y, 0.07, c.resalta, a); }
      flecha(4, y - 0.55, 6.2, y - 0.55, c.resalta, a, 0.05);
      rotulo('I', 6.5, y - 0.55, { peso: 700, color: c.resalta, escribe: tramo(t, 0.15, 0.3), fondo: false });
      flecha(8, y - 0.25, 8, y - 0.25 - 2.0 * fz, c.fuerza, fz, 0.07);
      rotulo('F = I L B', 8.4, 3.1, { peso: 700, tam: 15, color: c.fuerza, escribe: tramo(t, 0.55, 0.85) });
      rotulo('regla de la mano derecha: de I hacia B, el pulgar da F', 8, 8.1, { al: 'center', tam: 12.5, escribe: tramo(t, 0.7, 1) });
    }

    // pasos 2 y 3: corte del altavoz con su bobina en el hueco del imán
    function altavoz() {
      const I = paso === 2 ? cor.I : I_ALT, señal = quieto ? 0.6 : Math.sin(reloj * 7), amp = (paso === 1 ? suave(tramo(t, 0.05, 0.3)) : 1) * (paso === 2 ? I / I_ALT : 1);
      const dx = 0.45 * amp * señal, cx = 4.4, y0 = 4.5;
      v.sombra(cx + 0.9, y0 + 4.05, 3.4, 0.22, 0.2); v.brillo(cx + 1.2, y0, 2.4, c.imanN, 0.1 + 0.1 * Math.abs(señal) * Math.min(1, amp));
      // imán: anillo (S) arriba y abajo, polo central (N) y culata
      rect(cx - 1.9, y0 - 2.5, 0.9, 5.0, c.marco, 0.1);
      rect(cx - 1.0, y0 - 2.5, 2.3, 0.9, c.imanS, 0.08); rect(cx - 1.0, y0 + 1.6, 2.3, 0.9, c.imanS, 0.08);
      rect(cx - 1.0, y0 - 0.55, 2.8, 1.1, c.imanN, 0.08);
      rotulo('N', cx - 0.4, y0, { peso: 700, tam: 15, color: c.panel, fondo: false }); rotulo('S', cx - 0.4, y0 - 2.05, { peso: 700, tam: 14, color: c.panel, fondo: false }); rotulo('S', cx - 0.4, y0 + 2.05, { peso: 700, tam: 14, color: c.panel, fondo: false });
      // campo radial en el hueco: flechas del polo central al anillo
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) flecha(cx + 0.6 + k * 0.35, y0 + s * 0.6, cx + 0.6 + k * 0.35, y0 + s * 1.5, c.imanS, 0.6, 0.025);
      rotulo('B radial', cx - 0.3, y0 - 2.95, { tam: 12, color: c.imanS, fondo: false, escribe: tramo(t, 0.1, 0.3) });
      // marco, cono y bobina móvil (con la corriente que sale o entra según el sentido)
      const bx = cx + 0.6 + dx;
      g.strokeStyle = c.cono; { const gr = g.createLinearGradient(0, Y(y0 - 3.4), 0, Y(y0 + 3.4)); gr.addColorStop(0, rgba(Dibujo.mezcla(c.cono, c.panel, 0.4), 0.8)); gr.addColorStop(0.5, rgba(c.cono, 0.5)); gr.addColorStop(1, rgba(Dibujo.mezcla(c.cono, '#000000', 0.3), 0.75)); g.fillStyle = gr; } g.lineWidth = Math.max(2, 0.07 * v.K); g.lineJoin = 'round';
      const cx0 = bx + 0.55, cx1 = bx + 3.0 + dx * 0.3;
      g.beginPath(); g.moveTo(X(cx0), Y(y0 - 1.05)); g.lineTo(X(cx1), Y(y0 - 3.4)); g.lineTo(X(cx1), Y(y0 + 3.4)); g.lineTo(X(cx0), Y(y0 + 1.05)); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = c.marco; g.lineWidth = Math.max(2, 0.08 * v.K); g.beginPath(); g.moveTo(X(cx + 3.6), Y(y0 - 3.4)); g.lineTo(X(cx + 3.6), Y(y0 - 3.9)); g.moveTo(X(cx + 3.6), Y(y0 + 3.4)); g.lineTo(X(cx + 3.6), Y(y0 + 3.9)); g.stroke();
      for (const s of [-1, 1]) {
        const yy = y0 + s * 1.05; rect(bx - 0.55, yy - 0.14, 1.1, 0.28, c.cobre, 0.05);
        const sale = (s > 0) === (señal >= 0); (sale ? saliente : entrante)(bx, yy + s * 0.5, 0.17, c.resalta);
      }
      rotulo('↑ bobina móvil', bx - 0.6, y0 + 2.95, { tam: 12.5, escribe: tramo(t, 0.2, 0.4) }); rotulo('cono', bx + 2.6, y0 - 3.0, { tam: 12.5, escribe: tramo(t, 0.3, 0.5) });
      // fuerza sobre la bobina: horizontal, con el sentido de la corriente
      const Fl = 1.2 * amp * señal;
      if (Math.abs(Fl) > 0.05) for (const s of [-1, 1]) { flecha(bx, y0 + s * 1.05, bx + Fl, y0 + s * 1.05, c.fuerza, 1, 0.07); rotulo('F', bx + Fl * 0.5, y0 + s * 1.05 - 0.3, { peso: 700, color: c.fuerza, fondo: false }); }
      // ondas de sonido hacia la derecha
      for (let k = 0; k < 4; k++) {
        const ph = quieto ? (k + 0.5) / 4 : (reloj * 0.45 + k / 4) % 1, r = 0.4 + ph * 4.2;
        g.strokeStyle = rgba(c.imanS, 0.75 * (1 - ph) * Math.max(0.25, amp)); g.lineWidth = Math.max(1.5, (0.11 - 0.07 * ph) * v.K); g.beginPath(); g.arc(X(bx + 3.2), Y(y0), r * v.K, -0.9, 0.9); g.stroke();
      }
      rotulo('sonido', 14.2, y0, { al: 'right', tam: 13, peso: 600, fondo: false, escribe: tramo(t, 0.4, 0.7) });
      if (paso === 2) {
        v.pantalla(); v.panel(9.6, 0.3, 6.1, 2.6);
        rotulo(`L = N·2πr = ${f2(L_ALT)} m`, 9.9, 0.85, { tam: 13, fondo: false, peso: 600 });
        rotulo(`F = B·I·L = ${f2(datos.fuerza(I))} N`, 9.9, 1.55, { tam: 15, fondo: false, peso: 700, color: c.fuerza });
        rect(9.9, 2.1, 5.5, 0.28, rgba(c.rotulo, 0.14), 0.14); rect(9.9, 2.1, Math.max(0.28, 5.5 * datos.fuerza(I) / datos.fuerza(1.5)), 0.28, c.fuerza, 0.14);
        v.mundo();
      }
    }

    // paso 4: la bobina vista de canto, girando entre los polos
    function motor() {
      const th = ang.tocada ? ang.th : 90 + 90 * Math.sin(quieto ? 0 : reloj * 1.5) * suave(tramo(t, 0.05, 0.4)), rad = (th * Math.PI) / 180;
      const cx = 8, cy = 4.5, R = 2.0;
      rect(0.9, cy - 1.7, 2.4, 3.4, c.imanN, 0.12); rect(12.7, cy - 1.7, 2.4, 3.4, c.imanS, 0.12);
      rotulo('N', 2.1, cy, { peso: 700, tam: 18, color: c.panel, fondo: false }); rotulo('S', 13.9, cy, { peso: 700, tam: 18, color: c.panel, fondo: false });
      for (let k = -2; k <= 2; k++) flecha(3.6, cy + k * 0.8, 12.2 - (Math.abs(k) === 2 ? 0.4 : 0), cy + k * 0.8, c.imanS, 0.38, 0.03);
      rotulo('B', 4.1, cy - 2.1, { peso: 700, color: c.imanS, fondo: false, escribe: tramo(t, 0.1, 0.3) });
      // la normal forma θ con B (horizontal); el plano de la bobina es perpendicular a la normal
      const nx = Math.cos(rad), ny = -Math.sin(rad), px = -ny, py = nx;      // normal y dirección de la bobina (en pantalla)
      const a1 = { x: cx + px * R, y: cy + py * R }, a2 = { x: cx - px * R, y: cy - py * R };
      g.strokeStyle = c.cobre; g.lineWidth = Math.max(4, 0.14 * v.K); g.lineCap = 'round'; g.beginPath(); g.moveTo(X(a1.x), Y(a1.y)); g.lineTo(X(a2.x), Y(a2.y)); g.stroke(); g.lineCap = 'butt';
      punto(cx, cy, 0.12, c.marco);
      flecha(cx, cy, cx + nx * 1.2, cy + ny * 1.2, c.rotulo, 0.7, 0.04);
      rotulo('n', cx + nx * 1.5, cy + ny * 1.5, { tam: 12.5, fondo: false, peso: 600 });
      // corriente: sale en un lado y entra en el otro; fuerzas verticales iguales y opuestas
      saliente(a1.x, a1.y, 0.22, c.resalta); entrante(a2.x, a2.y, 0.22, c.resalta);
      const Lf = 1.3;
      const dir = Math.sign(px) || 1;
      flecha(a1.x, a1.y, a1.x, a1.y - dir * Lf, c.fuerza, 1, 0.07); flecha(a2.x, a2.y, a2.x, a2.y + dir * Lf, c.fuerza, 1, 0.07);
      rotulo('F', a1.x + 0.35, a1.y - dir * Lf * 0.55, { peso: 700, color: c.fuerza, fondo: false }); rotulo('−F', a2.x + 0.45, a2.y + dir * Lf * 0.55, { peso: 700, color: c.fuerza, fondo: false });
      v.pantalla(); v.panel(10.3, 0.3, 5.4, 1.6);
      rotulo(`θ = ${f0(th)}°`, 10.6, 0.8, { tam: 13.5, fondo: false, peso: 600 });
      rotulo(`τ = ${f3(par(th))} N·m`, 10.6, 1.45, { tam: 15, fondo: false, peso: 700, color: c.fuerza });
      v.mundo();
    }

    // paso 5: par sin y con conmutador
    function conmutador() {
      v.pantalla();
      const a = suave(tramo(t, 0.05, 0.2)); g.globalAlpha = a; v.panel(0.5, 0.35, 15, 8.3); g.globalAlpha = 1;
      if (a <= 0) return;
      const gx0 = 1.8, gx1 = 14.6, gy0 = 4.5, amp = 2.8, tx = (d) => gx0 + (d / 360) * (gx1 - gx0), ty = (s) => gy0 - s * amp;
      g.strokeStyle = rgba(c.rotulo, 0.14); g.lineWidth = 1; g.beginPath(); for (const d of [90, 180, 270, 360]) { g.moveTo(X(tx(d)), Y(gy0 - amp - 0.2)); g.lineTo(X(tx(d)), Y(gy0 + amp + 0.2)); } g.stroke();
      g.strokeStyle = c.rotulo; g.lineWidth = 1.4; g.beginPath(); g.moveTo(X(gx0), Y(gy0 - amp - 0.4)); g.lineTo(X(gx0), Y(gy0 + amp + 0.4)); g.moveTo(X(gx0), Y(gy0)); g.lineTo(X(gx1 + 0.2), Y(gy0)); g.stroke();
      const hasta = 360 * tramo(t, 0.1, 0.8);
      const curva = (fn, col, dash) => { g.strokeStyle = col; g.lineWidth = Math.max(2.5, 0.07 * v.K); g.setLineDash(dash); g.beginPath(); for (let d = 0; d <= hasta + 1e-9; d += 4) { const px = X(tx(d)), py = Y(ty(fn(d))); if (d) g.lineTo(px, py); else g.moveTo(px, py); } g.stroke(); g.setLineDash([]); };
      curva((d) => Math.sin((d * Math.PI) / 180), c.marco, [8, 6]);
      curva((d) => Math.abs(Math.sin((d * Math.PI) / 180)), c.fuerza, []);
      punto(tx(hasta), ty(Math.abs(Math.sin((hasta * Math.PI) / 180))), 0.15, c.fuerza);
      for (const d of [90, 180, 270, 360]) rotulo(`${d}°`, tx(d), gy0 + amp + 0.55, { al: 'center', tam: 11.5, fondo: false });
      rotulo('τ / τ máx', gx0 + 0.15, gy0 - amp - 0.5, { tam: 12, fondo: false });
      rotulo('ángulo girado', gx1, gy0 + amp + 1.1, { al: 'right', tam: 12, fondo: false });
      rotulo('sin conmutador: el par se invierte y frena', 4.3, 6.3, { tam: 12.5, color: c.marco, peso: 600, fondo: false, escribe: tramo(t, 0.3, 0.55) });
      rotulo('con conmutador: siempre empuja igual', 10.9, 1.5, { al: 'center', tam: 12.5, color: c.fuerza, peso: 700, fondo: false, escribe: tramo(t, 0.5, 0.8) });
    }

    // paso 6: las dos cuentas
    function cuentas() {
      v.pantalla();
      const a = suave(tramo(t, 0.05, 0.2)); g.globalAlpha = a; v.panel(0.8, 0.8, 14.4, 6.6); g.globalAlpha = 1;
      if (a <= 0) return;
      rotulo('Altavoz', 1.3, 1.5, { tam: 14, fondo: false, peso: 700, color: c.imanS, escribe: tramo(t, 0.1, 0.2) });
      rotulo(`L = N 2π r = 40 · 2π · 0,0125 = ${f2(L_ALT)} m`, 1.3, 2.3, { tam: 13.5, fondo: false, escribe: tramo(t, 0.15, 0.35) });
      rotulo(`F = B I L = 1 · 0,5 · ${f2(L_ALT)} = ${f2(F_ALT)} N`, 1.3, 3.1, { tam: 15, fondo: false, peso: 700, color: c.fuerza, escribe: tramo(t, 0.3, 0.5) });
      rotulo('Motor', 1.3, 4.5, { tam: 14, fondo: false, peso: 700, color: c.imanN, escribe: tramo(t, 0.5, 0.6) });
      rotulo(`τ = N I S B = 100 · 0,5 · 0,0012 · 0,1 = ${f3(TAU_MAX)} N·m`, 1.3, 5.3, { tam: 13.5, fondo: false, escribe: tramo(t, 0.55, 0.75) });
      rotulo('la misma fuerza de Lorentz, F = I L B, en los dos', 1.3, 6.5, { tam: 13.5, fondo: false, peso: 600, color: c.resalta, escribe: tramo(t, 0.75, 0.95) });
    }
  }

  const COLORES = ['fondo', 'panel', 'rotulo', 'resalta', 'cobre', 'marco', 'cono', 'imanN', 'imanS', 'fuerza'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnFuerza };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: AltavozMotor.pasos, dibuja: AltavozMotor.dibuja, colores: AltavozMotor.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); AltavozMotor.abrirEnFuerza(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = AltavozMotor;
