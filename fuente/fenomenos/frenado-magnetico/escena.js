/* =====================================================================
   El freno magnético y el tren de levitación: los 6 pasos de la animación (texto y dibujo) y el
   ejercicio que se abre en Inducción: Faraday y Lenz (modo «barra»: una aleta de metal de 0,5 m de ancho que
   atraviesa un campo de 1 T a 20 m/s, con una resistencia equivalente de 0,5 mΩ). El motor es fenomenos/animacion.js,
   los ayudantes de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se cargan los datos:
   pruebas/herramientas/fenomenos/frenado-magnetico.js.
   DATOS ESCRITOS DE MEMORIA (Dani debe revisarlos): B = 1 T, L = 0,5 m, R = 0,5 mΩ, vagón de 2000 kg a 20 m/s,
   velocidad crítica de la levitación de 30 m/s (modelo RL sencillo de la bobina del carril).
   ===================================================================== */
const FrenadoMagnetico = (() => {
  // modelo: aleta de ancho L entre los polos de un imán (campo B), resistencia equivalente R de las corrientes de Foucault
  const B = 1, L = 0.5, R = 5e-4, V0 = 20, MASA = 2000, VC = 30, G = 9.81;
  const K = (B * B * L * L) / R, TAU = MASA / K;                         // F = K v ; v(t) = V0 e^(−t/τ)
  const fem = (v) => B * L * v, corriente = (v) => fem(v) / R, fuerza = (v) => K * v, potencia = (v) => K * v * v;
  const levita = (v) => (v * v) / (v * v + VC * VC);                      // fracción del peso que sostiene la levitación
  const datos = { B, L, R, V0, MASA, VC, K, TAU, fem, corriente, fuerza, potencia, levita, eps: fem(V0), I: corriente(V0), F: fuerza(V0), P: potencia(V0),
    a: fuerza(V0) / MASA, Ec: 0.5 * MASA * V0 * V0, v5: V0 * Math.exp(-5 / TAU) };

  const n = (x, d = 1) => x.toFixed(d).replace('.', ',');
  const miles = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const pasos = [
    { titulo: 'Un tren que frena sin rozar nada', corto: 'Freno', dato: { valor: '0 contacto', texto: 'no hay zapatas ni pastillas: ni se gastan, ni se calientan las ruedas, ni dependen de que el carril esté mojado.' }, texto: 'Al final de una montaña rusa el vagón entra a 70 km/h en una zona con grandes imanes a los lados del carril y se detiene suave, sin un chirrido. No hay zapatas que rocen: bajo el vagón cuelga solo una <b>aleta de metal</b>, que pasa entre los imanes sin tocarlos.\n\n¿Quién frena, entonces? El propio movimiento. Los frenos magnéticos usan una consecuencia de la ley de Faraday: **un metal que se mueve en un campo magnético se frena solo**. Y el mismo principio, al revés, hace flotar a los trenes de levitación.' },
    { titulo: 'Una aleta entre dos imanes', corto: 'Campo', dato: { valor: `B = ${n(B, 1)} T`, texto: 'es un campo típico entre los polos de imanes de neodimio: unas 20 000 veces el de la Tierra.' }, texto: 'Mira la aleta desde arriba. Los imanes están por encima y por debajo, uno enfrente de otro, y entre los dos hay una zona con un campo $B$ casi uniforme que **sale de la pantalla** (los puntos ⊙). Fuera de esa zona el campo es casi nulo.\n\nLa aleta, de cobre o aluminio, es un buen conductor y se mueve a velocidad $v$: va entrando por un lado de la zona de campo y saliendo por el otro. Una parte de ella está siempre dentro del campo, y la parte que entra o sale es la que va a importar.' },
    { titulo: 'Se mueve en el campo: Faraday', corto: 'Faraday', dato: { valor: `ε = ${n(datos.eps, 0)} V`, texto: `aparecen en la aleta a ${V0} m/s (72 km/h), con ${n(L, 1)} m de ancho y 1 T.` }, texto: `Dentro del campo, el flujo que atraviesa cualquier circuito dibujado en la aleta cambia según entra o sale de la zona. Para una franja de ancho $L$ que se mueve a velocidad $v$, la ley de Faraday da la fem de movimiento:\n\n$ε = −{dΦ}/{dt} = B L v$\n\nCon $B$ = 1 T, $L$ = 0,5 m y $v$ = 20 m/s, sale $ε$ = **${n(datos.eps, 0)} V**. Es lo mismo que la fem de una barra que se desliza sobre unos raíles: no hace falta batería ni cable, la crea el movimiento.` },
    { titulo: 'Corrientes de Foucault y fuerza de Lenz', corto: 'Lenz', dato: { valor: `F = ${n(datos.F / 1000, 0)} kN`, texto: `frena el vagón a ${V0} m/s, con una corriente de ${n(datos.I / 1000, 0)} kA por la aleta.` }, texto: `Como la aleta es un metal macizo, esa fem no se queda en nada: hace circular corrientes cerradas, las corrientes de Foucault, con un remolino a cada lado de la zona de campo. Su resistencia equivalente es muy pequeña (≈ 0,5 mΩ), así que $I = ε/R = ${n(datos.eps, 0)}/0,0005$ = **${miles(datos.I)} A**.\n\nUna corriente en un campo siente la fuerza $F = I L B$. Y, por la ley de Lenz, tiene el sentido que se opone a la causa: frena. Sustituyendo $I$:\n\n$F = I L B = {B^2 L^2 v}/R = K v$ = **${miles(datos.F)} N**\n\nLa fuerza es proporcional a la velocidad, con $K = B^2 L^2 / R$ = ${miles(K)} N·s/m. Mueve el deslizador para verlo.` },
    { titulo: 'Frena mucho al principio y se apaga', corto: 'Parada', dato: { valor: `τ = ${n(TAU, 0)} s`, texto: `es lo que tarda en bajar a un 37 % la velocidad de un vagón de ${miles(MASA)} kg; a los ${n(5, 0)} s va a ${n(datos.v5, 1)} m/s.` }, texto: `Como $F = K v$, la deceleración es $a = F/m$ = ${n(datos.a, 1)} m/s² (medio <i>g</i>) a 20 m/s, pero **baja a medida que el vagón frena**: a 5 m/s ya es cuatro veces menor. La ecuación $m dv/dt = −K v$ da una caída exponencial:\n\n$v(t) = v_0 e^{−t/τ}$, con $τ = m/K$ = **${n(TAU, 0)} s**\n\nLa energía cinética, ${n(datos.Ec / 1000, 0)} kJ, se convierte en calor en la aleta por efecto Joule (al empezar, $P = ε I$ = ${n(datos.P / 1000, 0)} kW). Por eso el freno magnético nunca para del todo: es perfecto para quitar velocidad con suavidad, pero al final se necesitan frenos de fricción que sujeten el vagón parado.`, dura: 11000 },
    { titulo: 'El tren de levitación: el mismo principio', corto: 'Levitación', dato: { valor: '603 km/h', texto: 'es el récord de velocidad de un tren: el SCMaglev japonés, en 2015. Despega de las ruedas hacia los 150 km/h.' }, texto: `Un tren de levitación electrodinámico lleva potentes imanes superconductores. En el carril hay bobinas cerradas sobre sí mismas. Cuando el tren pasa, el imán cambia el flujo en cada bobina: por Faraday se inducen corrientes, y por Lenz esas corrientes crean un campo que **repele** al imán y lo sostiene. Con los imanes del tren, la bobina se comporta como un freno que en vez de frenar, **eleva**.\n\nSi el tren está parado no hay flujo que cambie, ni corrientes, ni fuerza: se apoya en ruedas. Con un modelo sencillo (la bobina con $R$ y $L$), la fracción del peso que sostiene la levitación es $v^2/(v^2 + v_c^2)$, con $v_c$ = ${VC} m/s: a 30 m/s es la mitad, y a 140 m/s (500 km/h) ya el ${n(100 * levita(140), 0)} %.`, dura: 11000 },
  ];

  // ejercicio de Inducción: Faraday y Lenz (formato de faraday-v1): barra de ancho L en un campo B, a velocidad v, con resistencia R
  const ejercicio = () => ({ modo: 'barra', B: String(B), sentidoB: 'saliente', L: String(L), v: String(V0), R: String(R) });
  function abrirEnFaraday(destino) {
    try { localStorage.setItem('faraday-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const cam = { x: 8, y: 4.5, z: 1 };
  const CAMS = [{ x: 8, y: 4.5, z: 1 }, { x: 8, y: 4.5, z: 1.45 }, { x: 8, y: 4.5, z: 1.45 }, { x: 8, y: 4.5, z: 1.45 }, { x: 8, y: 4.5, z: 1.05 }, { x: 8, y: 4.5, z: 1 }];
  // «Pruébalo tú» del paso 4: la velocidad de la aleta
  const prueba = { etiqueta: 'la velocidad de la aleta', min: 1, max: 40, paso: 1, valor: 20, v: 20,
    muestra: (v) => `${v} m/s → ${n(fuerza(v) / 1000, 1)} kN de fuerza de frenado`, cambia: (v) => { prueba.v = v; } };
  pasos[3].prueba = prueba;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(CAMS[paso], reloj, quieto);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto, r = quieto ? 0.2 : reloj;
    const M = Dibujo.mezcla;
    // cielo, colinas y suelo de las dos vistas de lado (la montaña rusa y el tren)
    const paisaje = (ys) => {
      v.degradado(-1, ys, M(c.sala, c.onda, 0.3), M(c.sala, c.brillo, 0.35));
      v.colinas(ys - 0.5, 1.5, ys, M(c.suelo, c.sala, 0.72), 2); v.colinas(ys - 0.1, 0.9, ys, M(c.suelo, c.sala, 0.5), 6);
      v.degradado(ys, 10, M(c.suelo, c.sala, 0.15), M(c.suelo, '#000000', 0.35)); v.motas(-1, ys + 0.15, 17, 9.2, 50, c.rotulo, 0.14, 0.035, 5);
    };
    if (paso === 0) vagon(); else if (paso < 5) planta(); else maglev();

    // paso 1: el vagón de la montaña rusa entra en la zona de imanes y frena sin tocar nada
    function vagon() {
      paisaje(6.4);
      // la vía, sobre pilares
      for (let k = 0; k < 6; k++) { const px = 0.6 + k * 3.1; if (px > 5.6 && px < 10.2) continue; v.pieza(px, 4.78, 0.28, 1.66, c.riel, 0.03); }
      g.fillStyle = c.riel; g.fillRect(0, Y(4.66), w, 0.12 * v.K);
      // imanes de la vía: dos hileras de bloques a los lados de la aleta (en la vista de lado, delante y detrás de ella; se ven en transparencia)
      const zx0 = 6.4, zx1 = 9.6;
      g.fillStyle = rgba(c.imanN, 0.28); g.fillRect(X(zx0), Y(4.7), (zx1 - zx0) * v.K, 1.7 * v.K);
      g.strokeStyle = rgba(c.imanN, 0.8); g.lineWidth = Math.max(1.5, 0.04 * v.K); g.strokeRect(X(zx0), Y(4.7), (zx1 - zx0) * v.K, 1.7 * v.K);
      rotulo('N', zx0 + 0.3, 5.0, { tam: 13, peso: 700, color: c.imanN, fondo: false }); rotulo('S', zx1 - 0.3, 6.1, { al: 'right', tam: 13, peso: 700, color: c.imanS, fondo: false });
      // el vagón frena al pasar (cámara fija): sale de la izquierda y se detiene suave a la derecha
      const ciclo = quieto ? 0.55 : (r % 8) / 8, u = 1 - Math.pow(1 - Math.min(1, ciclo / 0.8), 2), x = -1.6 + u * 8.4;
      v.sombra(x + 1.8, 6.45, 2.3, 0.16, 0.22);
      // estela de velocidad, que se apaga a medida que frena
      const prisa = quieto ? 0.4 : Math.max(0, 1 - Math.min(1, ciclo / 0.8)) * 1.4;
      g.strokeStyle = rgba(c.rotulo, 0.22 * Math.min(1, prisa)); g.lineWidth = Math.max(1.5, 0.04 * v.K); g.lineCap = 'round'; g.beginPath();
      for (let k = 0; k < 4; k++) { g.moveTo(X(x - 0.2), Y(3.3 + k * 0.28)); g.lineTo(X(x - 0.2 - (0.8 + 0.5 * azar(k + 3)) * prisa), Y(3.3 + k * 0.28)); }
      g.stroke(); g.lineCap = 'butt';
      v.brillo(8, 5.5, 2.4, c.campo, 0.25 * Math.min(1, prisa + 0.2));
      v.pieza(x, 3.1, 3.6, 1.2, c.vagon, 0.22);
      g.fillStyle = rgba(c.brillo, 0.55); for (let k = 0; k < 3; k++) g.fillRect(X(x + 0.3 + k * 1.1), Y(3.35), 0.85 * v.K, 0.5 * v.K);
      g.fillStyle = c.placa; g.fillRect(X(x + 0.9), Y(4.3), 1.8 * v.K, 1.5 * v.K); g.strokeStyle = rgba(c.rotulo, 0.6); g.lineWidth = 1.2; g.strokeRect(X(x + 0.9), Y(4.3), 1.8 * v.K, 1.5 * v.K);
      g.fillStyle = c.placa; g.fillRect(X(x + 1.6), Y(4.25), 0.2 * v.K, 0.1 * v.K);
      g.fillStyle = c.rotulo; for (const dx of [0.5, 2.8]) { g.beginPath(); g.arc(X(x + dx + 0.15), Y(4.45), 0.2 * v.K, 0, 2 * Math.PI); g.fill(); }
      rotulo('aleta de metal', 5.3, 5.1, { al: 'right', tam: 12, escribe: tramo(t, 0.25, 0.55) });
      rotulo('imanes fijos en la vía, a los lados', 8.0, 7.1, { al: 'center', tam: 12, peso: 700, escribe: tramo(t, 0.45, 0.75) });
      rotulo('sin zapatas ni contacto', 8, 1.6, { al: 'center', tam: 13, peso: 700, color: c.resalta, escribe: tramo(t, 0.6, 0.9) });
    }

    // pasos 2 a 5: la aleta vista desde arriba, pasando por la zona de campo (la franja de arriba es la placa, que se mueve a la derecha)
    function planta() {
      const vel = paso === 3 ? prueba.v : paso === 4 ? V0 * Math.exp(-(quieto ? 3 : (r % 14)) / TAU) : V0, esc = 0.045;
      // desplazamiento acumulado de la placa (para las rayas); en el paso 5 se integra la velocidad que decae
      const desp = paso === 4 ? V0 * TAU * (1 - Math.exp(-(quieto ? 3 : (r % 14)) / TAU)) * esc : (quieto ? 1 : r) * vel * esc;
      g.fillStyle = c.sala; g.fillRect(0, 0, w, h); v.brillo(8, 4.5, 9, c.brillo, 0.35); v.vineta(0.12);
      const y0 = 3.0, y1 = 6.0, zx0 = 6.8, zx1 = 9.2, zy0 = 3.4, zy1 = 5.6;
      // la aleta: metal con brillo a lo largo y su sombra debajo
      g.fillStyle = rgba(c.rotulo, 0.12); g.fillRect(0, Y(y1), w, 0.22 * v.K);
      { const gr = g.createLinearGradient(0, Y(y0), 0, Y(y1)); gr.addColorStop(0, M(c.placa, c.brillo, 0.3)); gr.addColorStop(0.35, c.placa); gr.addColorStop(0.75, M(c.placa, c.brillo, 0.12)); gr.addColorStop(1, M(c.placa, '#000000', 0.22)); g.fillStyle = gr; }
      g.fillRect(0, Y(y0), w, (y1 - y0) * v.K);
      g.strokeStyle = rgba(c.rotulo, 0.35); g.lineWidth = Math.max(1, 0.025 * v.K); g.beginPath();
      for (let x = (desp % 0.9) - 0.9 + Math.floor(v.x0 / 0.9) * 0.9; x < v.x1 + 1; x += 0.9) { g.moveTo(X(x), Y(y0)); g.lineTo(X(x), Y(y1)); }
      g.stroke();
      // zona de campo B (sale de la pantalla): puntos ⊙
      const aB = paso === 1 ? 0.35 + 0.65 * suave(tramo(t, 0.05, 0.5)) : 0.8;
      v.brillo((zx0 + zx1) / 2, (zy0 + zy1) / 2, 2.6, c.campo, 0.28 * aB);
      g.fillStyle = rgba(c.campo, 0.13 * aB); g.fillRect(X(zx0), Y(zy0), (zx1 - zx0) * v.K, (zy1 - zy0) * v.K);
      g.strokeStyle = rgba(c.campo, 0.75 * aB); g.lineWidth = Math.max(1.2, 0.03 * v.K); g.setLineDash([6, 5]); g.strokeRect(X(zx0), Y(zy0), (zx1 - zx0) * v.K, (zy1 - zy0) * v.K); g.setLineDash([]);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {
        const xx = zx0 + 0.3 + i * ((zx1 - zx0 - 0.6) / 4), yy = zy0 + 0.3 + j * ((zy1 - zy0 - 0.6) / 3);
        g.strokeStyle = rgba(c.campo, aB); g.lineWidth = Math.max(1.2, 0.03 * v.K); g.beginPath(); g.arc(X(xx), Y(yy), 0.12 * v.K, 0, 2 * Math.PI); g.stroke(); punto(xx, yy, 0.04, c.campo, aB);
      }
      // velocidad de la placa
      const flechaV = (a) => v.flecha(2.3, 2.6, 2.3 + Math.max(0.3, vel / V0 * 1.6), 2.6, c.onda, a, 0.05);
      if (paso >= 1) { flechaV(1); rotulo(`v = ${n(vel, vel < 10 ? 1 : 0)} m/s`, 2.3, 2.25, { tam: 12, peso: 700, color: c.onda, fondo: false }); }
      // paso 3: ancho L de la franja con campo y fem
      if (paso === 2) {
        const a = suave(tramo(t, 0.2, 0.55));
        v.flecha(zx0 - 0.35, zy0, zx0 - 0.35, zy1, c.rotulo, a, 0.025); v.flecha(zx0 - 0.35, zy1, zx0 - 0.35, zy0, c.rotulo, a, 0.025);
        rotulo('L = 0,5 m', zx0 - 0.55, (zy0 + zy1) / 2, { al: 'right', tam: 12, escribe: a });
        rotulo('ε = B L v = 1 · 0,5 · 20 = 10 V', 8, 6.7, { al: 'center', tam: 13, peso: 700, color: c.corriente, escribe: tramo(t, 0.5, 0.9) });
        rotulo('la fem aparece por el movimiento', 8, 1.7, { al: 'center', tam: 12, escribe: tramo(t, 0.35, 0.75) });
      }
      // paso 4: remolinos de corriente a cada lado de la zona y fuerza contra el movimiento
      if (paso === 3 || paso === 4) {
        const a = paso === 3 ? suave(tramo(t, 0.1, 0.45)) : 0.85, ia = Math.min(1, vel / V0);
        const loops = [[6.6, 1], [9.4, -1]];
        for (const [cx, sg] of loops) {
          const rx = 1.6, ry = 1.4, cy = 4.5;
          v.brillo(cx, cy, 2.2, c.corriente, 0.2 * a * (0.3 + 0.7 * ia));
          g.strokeStyle = rgba(c.corriente, 0.55 * a); g.lineWidth = Math.max(1.5, 0.05 * v.K); g.beginPath(); g.ellipse(X(cx), Y(cy), rx * v.K, ry * v.K, 0, 0, 2 * Math.PI); g.stroke();
          for (let j = 0; j < 8; j++) { const th = sg * (2 * Math.PI * ((j / 8) + (quieto ? 0.1 : r * 0.35 * (0.3 + 0.7 * ia)))) + (sg < 0 ? Math.PI : 0); punto(cx + rx * Math.cos(th), cy - ry * Math.sin(th), 0.075, c.corriente, a * (0.35 + 0.65 * ia)); }
        }
        const F1 = Math.max(0.3, ia * 2.3);
        v.flecha(zx1 - 0.2, 4.5, zx1 - 0.2 - F1, 4.5, c.resalta, a, 0.09);
        if (paso === 3) {
          rotulo('corrientes de Foucault', 8, 2.35, { al: 'center', tam: 12.5, peso: 700, color: c.corriente, escribe: tramo(t, 0.3, 0.6) });
          rotulo(`I = ${miles(corriente(prueba.v))} A`, 8, 6.55, { al: 'center', tam: 12, color: c.corriente, peso: 700, escribe: tramo(t, 0.45, 0.75) });
          rotulo(`F = ${miles(fuerza(prueba.v))} N`, zx1 - 0.2 - F1 / 2, 4.1, { al: 'center', tam: 12, color: c.resalta, peso: 700, escribe: tramo(t, 0.55, 0.9) });
          rotulo('Lenz: la fuerza frena', 8, 6.95, { al: 'center', tam: 12, escribe: tramo(t, 0.7, 1) });
        }
      }
      // paso 5: gráfica de v(t) con la parada, la tangente y el calor
      if (paso === 4 && !foto) {
        const tc = quieto ? 3 : r % 14;
        v.pantalla();
        const x0 = 0.3, y0 = 0.3, an = 5.3, al = 3.3, gx = (s) => x0 + 0.65 + (s / 20) * (an - 1.1), gy = (q) => y0 + al - 0.55 - q * (al - 1.2);
        v.panel(x0, y0, an, al);
        g.strokeStyle = rgba(c.rotulo, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(X(gx(0)), Y(gy(1.05))); g.lineTo(X(gx(0)), Y(gy(0))); g.lineTo(X(gx(20)), Y(gy(0))); g.stroke();
        g.strokeStyle = rgba(c.rotulo, 0.3); g.setLineDash([3, 4]); g.beginPath(); g.moveTo(X(gx(TAU)), Y(gy(0))); g.lineTo(X(gx(TAU)), Y(gy(Math.exp(-1)))); g.lineTo(X(gx(0)), Y(gy(Math.exp(-1)))); g.stroke(); g.setLineDash([]);
        g.strokeStyle = c.onda; g.lineWidth = 2.5; g.beginPath();
        for (let s = 0; s <= 20.001; s += 0.25) { s ? g.lineTo(X(gx(s)), Y(gy(Math.exp(-s / TAU)))) : g.moveTo(X(gx(s)), Y(gy(1))); }
        g.stroke(); punto(gx(Math.min(tc, 20)), gy(Math.exp(-Math.min(tc, 20) / TAU)), 0.09, c.resalta);
        rotulo('v(t) = v₀ e^(−t/τ)', x0 + an - 0.3, y0 + 0.35, { al: 'right', tam: 11.5, peso: 700, fondo: false, color: c.onda });
        rotulo('τ = 4 s', gx(TAU) + 0.1, gy(Math.exp(-1)) - 0.3, { tam: 11, fondo: false });
        rotulo('t (s) →', x0 + an - 0.2, y0 + al - 0.22, { al: 'right', tam: 10.5, fondo: false });
        rotulo(`ahora: ${n(V0 * Math.exp(-Math.min(tc, 20) / TAU), 1)} m/s · ${n(fuerza(V0 * Math.exp(-Math.min(tc, 20) / TAU)) / 1000, 1)} kN`, x0 + an - 0.3, y0 + 0.85, { al: 'right', tam: 11, fondo: false, color: c.resalta, peso: 700 });
        v.mundo();
      }
      if (paso === 4) rotulo('frena menos cuanto más despacio va', 8, 7.0, { al: 'center', tam: 12.5, peso: 700, escribe: tramo(t, 0.4, 0.8) });
    }

    // paso 6: levitación; vista de lado con el tren, las bobinas del carril y la fracción del peso que sostienen
    function maglev() {
      const ciclo = quieto ? 0.6 : (r % 12) / 12, vel = Math.min(1, ciclo / 0.8) * 140, fr = levita(vel), alz = 0.12 + 0.95 * fr;
      const yv = 6.2;
      paisaje(yv);
      // bobinas del carril: se iluminan cuando pasa el imán
      const xt = 1.5 + 4.0 * Math.min(1, ciclo / 0.8) + 3.0 * Math.max(0, ciclo - 0.8) / 0.2;
      for (let k = 0; k < 14; k++) {
        const x = 0.8 + k * 1.1, cerca = Math.exp(-((x + 0.4 - (xt + 2.4)) ** 2) / 1.6) * Math.min(1, vel / 40);
        g.fillStyle = rgba(c.cobre, 0.9); g.fillRect(X(x), Y(yv), 0.8 * v.K, 0.45 * v.K);
        g.strokeStyle = rgba(c.corriente, cerca); g.lineWidth = Math.max(2, 0.07 * v.K); g.strokeRect(X(x + 0.05), Y(yv + 0.03), 0.7 * v.K, 0.39 * v.K);
        if (cerca > 0.05) v.flecha(x + 0.4, yv - 0.05, x + 0.4, yv - 0.05 - 0.9 * cerca * fr - 0.1, c.campo, Math.min(1, cerca * 1.6), 0.04);
      }
      // el tren, sostenido a una altura que sube con la velocidad
      const ty = yv - alz - 1.55;
      v.sombra(xt + 2.4, yv + 0.5, 2.9 - 0.9 * fr, 0.14, 0.3 - 0.14 * fr);
      v.brillo(xt + 2.4, yv - 0.1, 3.2, c.campo, 0.38 * fr);                                   // el colchón magnético bajo el tren
      v.pieza(xt, ty, 4.8, 1.35, c.vagon, 0.4);
      g.fillStyle = rgba(c.brillo, 0.3); g.beginPath(); g.roundRect(X(xt + 0.25), Y(ty + 0.1), 4.3 * v.K, 0.1 * v.K, 0.05 * v.K); g.fill();
      g.fillStyle = rgba(c.brillo, 0.55); for (let k = 0; k < 4; k++) g.fillRect(X(xt + 0.5 + k * 1.0), Y(ty + 0.3), 0.7 * v.K, 0.45 * v.K);
      for (const dx of [0.6, 3.4]) { g.fillStyle = c.imanN; g.fillRect(X(xt + dx), Y(ty + 1.35), 0.8 * v.K, 0.2 * v.K); g.fillStyle = c.imanS; g.fillRect(X(xt + dx + 0.8), Y(ty + 1.35), 0.8 * v.K, 0.2 * v.K); }
      // ruedas: salen del carril cuando despega
      if (fr < 0.3) { g.fillStyle = c.rotulo; for (const dx of [0.5, 4.0]) { g.beginPath(); g.arc(X(xt + dx + 0.3), Y(ty + 1.55 + 0.1), 0.17 * v.K, 0, 2 * Math.PI); g.fill(); } }
      rotulo(`${Math.round(vel * 3.6)} km/h`, xt + 2.4, ty - 0.35, { al: 'center', tam: 13, peso: 700, color: c.onda, fondo: false });
      rotulo(fr < 0.3 ? 'parado o lento: se apoya en ruedas' : 'levita: las corrientes del carril lo repelen', 5.2, 1.5, { al: 'center', tam: 13, peso: 700, color: fr < 0.3 ? c.rotulo : c.resalta, escribe: tramo(t, 0.15, 0.55) });
      rotulo('bobinas cerradas en el carril', 8, 7.6, { al: 'center', tam: 12, escribe: tramo(t, 0.4, 0.8) });
      if (!foto) {
        v.pantalla();
        const x0 = 10.3, y0 = 0.3, an = 5.4, al = 3.1, gx = (s) => x0 + 0.7 + (s / 140) * (an - 1.2), gy = (q) => y0 + al - 0.6 - q * (al - 1.25);
        v.panel(x0, y0, an, al);
        g.strokeStyle = rgba(c.rotulo, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(X(gx(0)), Y(gy(1.05))); g.lineTo(X(gx(0)), Y(gy(0))); g.lineTo(X(gx(140)), Y(gy(0))); g.stroke();
        g.strokeStyle = c.resalta; g.lineWidth = 2.5; g.beginPath();
        for (let s = 0; s <= 140; s += 2) s ? g.lineTo(X(gx(s)), Y(gy(levita(s)))) : g.moveTo(X(gx(s)), Y(gy(levita(s))));
        g.stroke(); punto(gx(vel), gy(fr), 0.09, c.onda);
        rotulo('peso sostenido', x0 + 0.3, y0 + 0.3, { tam: 11.5, peso: 700, fondo: false });
        rotulo('v (m/s) →', x0 + an - 0.2, y0 + al - 0.22, { al: 'right', tam: 10.5, fondo: false });
        rotulo(`${Math.round(100 * fr)} %`, gx(vel) - 0.1, gy(fr) - 0.32, { al: 'right', tam: 11.5, fondo: false, color: c.onda, peso: 700 });
        v.mundo();
      }
    }
  }

  const COLORES = ['sala', 'suelo', 'riel', 'vagon', 'placa', 'imanN', 'imanS', 'campo', 'corriente', 'onda', 'resalta', 'cobre', 'brillo', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnFaraday };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: FrenadoMagnetico.pasos, dibuja: FrenadoMagnetico.dibuja, colores: FrenadoMagnetico.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); FrenadoMagnetico.abrirEnFaraday(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = FrenadoMagnetico;
