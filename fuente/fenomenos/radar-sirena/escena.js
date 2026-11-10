/* =====================================================================
   El radar de tráfico y la sirena: los 6 pasos de la animación (texto y
   dibujo), el sonido de la sirena que cambia de tono al pasar y el ejercicio
   que se abre en Efecto Doppler (el eco del radar de 24 GHz en un coche a
   33 m/s). El motor es fenomenos/animacion.js, los ayudantes de dibujo
   fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se
   cargan los datos: pruebas/herramientas/fenomenos/radar-sirena.js.
   ===================================================================== */
const RadarSirena = (() => {
  // modelo: sirena de 700 Hz a 25 m/s con el sonido a 340 m/s; radar de 24 GHz y coche a 33 m/s hacia él
  const F = 700, V = 340, VF = 25, FR = 24e9, C = 3e8, U = 33;
  const f1De = (vf) => (F * V) / (V - vf), f2De = (vf) => (F * V) / (V + vf), dfDe = (u) => (2 * u * FR) / (C - u);
  const datos = { F, V, VF, FR, C, U, f1: f1De(VF), f2: f2De(VF), lam: V / F, lam1: (V - VF) / F, lam2: (V + VF) / F, df: dfDe(U), lamR: C / FR, porKmh: dfDe(1 / 3.6) };
  datos.semitonos = 12 * Math.log2(datos.f1 / datos.f2);
  const f1 = (x) => x.toFixed(1).replace('.', ','), f0 = (x) => Math.round(x).toLocaleString('es-ES').replace(/\s/g, '.');

  const pasos = [
    { titulo: 'Una ambulancia que pasa', corto: 'Sirena', dato: { valor: '700 Hz', texto: 'es el tono de la sirena en este ejemplo, el que oye el conductor.' }, texto: 'Estás en la acera y se acerca una ambulancia. Mientras viene, la sirena suena aguda; justo cuando pasa a tu lado, el tono baja de golpe y se aleja más grave. El conductor, en cambio, la oye siempre igual.\n\nEs el efecto Doppler: la frecuencia que se oye depende de cómo se mueven la fuente y el que escucha. Y es lo mismo que usa un radar de tráfico para saber a qué velocidad vas.' },
    { titulo: 'Delante, los frentes de onda se amontonan', corto: 'Delante', dato: { valor: 'f₁ = 755,6 Hz', texto: 'es lo que oyes mientras la ambulancia se acerca a 90 km/h.' }, texto: 'La sirena lanza un frente de onda cada 1/700 s, que se aleja a 340 m/s en todas direcciones. Pero la ambulancia, a 25 m/s, va persiguiendo a sus propios frentes, y los de delante salen más juntos: $λ_1 = (v − v_F)/f = (340 − 25)/700 = 0,45 "m"$, en vez de 0,486 m.\n\nTe llegan más frentes cada segundo, así que oyes más agudo: $f_1 = f v/(v − v_F) = 700 · 340/315 = 755,6 "Hz"$.' },
    { titulo: 'Detrás, se separan', corto: 'Detrás', dato: { valor: 'Δf ≈ 104 Hz', texto: 'baja el tono al pasar: dos semitonos y medio.' }, texto: 'Detrás de la ambulancia los frentes quedan más separados y llegan menos por segundo: $f_2 = f v/(v + v_F) = 700 · 340/365 = 652,1 "Hz"$.\n\nAl pasar, el tono cae de 755,6 Hz a 652,1 Hz. Cuanto más deprisa va la fuente, mayor es el salto. En el dibujo la ambulancia va mucho más rápida que en la realidad para que se vea cómo se amontonan los frentes.' },
    { titulo: 'El radar lanza microondas', corto: 'Radar', dato: { valor: '24 GHz', texto: 'es la frecuencia de muchos radares de tráfico: λ = 1,25 cm.' }, texto: 'Un radar de tráfico hace lo mismo con ondas electromagnéticas, que viajan a la velocidad de la luz, $c = 3·10^8 "m/s"$. Lanza microondas de 24 GHz hacia los coches y recoge las que rebotan en ellos.\n\nLa onda es invisible y no se oye, pero el radar puede comparar con muchísima precisión la frecuencia que envía con la que le vuelve.' },
    { titulo: 'El eco trae dos efectos Doppler', corto: 'Eco', dato: { valor: 'Δf = 5280 Hz', texto: 'más trae el eco de un coche a 33 m/s (unos 119 km/h).' }, texto: 'El coche recibe la onda como un observador que se acerca, $f_R = f (c + u)/c$, y la devuelve como una fuente que se acerca, $f″ = f_R c/(c − u)$. El efecto se suma dos veces: $f″ ≈ f (1 + 2u/c)$.\n\nPara $u = 33 "m/s"$, $Δf = 2 u f/c = 2 · 33 · 24 "GHz"/(3·10^8) = 5280 "Hz"$: apenas dos diezmillonésimas de la frecuencia. El radar mezcla la onda que envía con el eco y mide las pulsaciones, que van justo a Δf.', dura: 11000 },
    { titulo: 'De la frecuencia a la multa', corto: 'Velocidad', dato: { valor: '1 km/h ≈ 44 Hz', texto: 'de diferencia en el eco: se mide sin problema.' }, texto: 'Despejando la velocidad: $u = c Δf/(2 f) = 3·10^8 · 5280/(2 · 24·10^9) = 33 "m/s"$, es decir, 118,8 km/h. Si la carretera está limitada a 100, salta el flash.\n\nEl radar solo mide la parte de la velocidad que va hacia él, $u cos α$: por eso se coloca casi en línea con la carretera. La ecografía Doppler mide igual la velocidad de la sangre, y los radares meteorológicos, la del viento con la lluvia.', dura: 11000 },
  ];

  // ejercicio de Efecto Doppler (formato de doppler-v1): el eco del radar en el coche
  const ejercicio = () => ({ modo: 'eco', buscar: 'frecuencia', f: '24e9', v: '3e8', vE: '0', u: String(U) });
  function abrirEnDoppler(destino) {
    try { localStorage.setItem('doppler-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  // calle: acera de arriba, dos carriles y acera de abajo; el peatón escucha en la de arriba
  const ACERA = 5.0, CARRIL1 = 6.15, MEDIO = 6.65, CARRIL2 = 7.2, BORDE = 7.75, OYE = 8, SIRENA = 5.55;
  const cam = { x: 8, y: 4.5, z: 1 };
  // «Pruébalo tú» del paso 3 (velocidad de la ambulancia, m/s) y del paso 5 (velocidad del coche, km/h)
  const pruebaSirena = { etiqueta: 'la velocidad de la ambulancia', min: 0, max: 80, paso: 1, valor: VF, vf: VF,
    muestra: (vf) => `${vf} m/s (${f0(vf * 3.6)} km/h) → al acercarse ${f1(f1De(vf))} Hz, al alejarse ${f1(f2De(vf))} Hz`,
    cambia: (vf) => { pruebaSirena.vf = vf; } };
  const pruebaRadar = { etiqueta: 'la velocidad del coche', min: 30, max: 200, paso: 1, valor: 119, kmh: 119,
    muestra: (k) => `${k} km/h → Δf = ${f0(dfDe(k / 3.6))} Hz`,
    cambia: (k) => { pruebaRadar.kmh = k; } };
  pasos[2].prueba = pruebaSirena; pasos[4].prueba = pruebaRadar;
  // lo que oye el peatón con la ambulancia en x (1 unidad del dibujo = 10 m; está a 9 m de la sirena)
  const oido = (x, vf) => { const dx = OYE - x, cos = dx / Math.hypot(dx, 0.9); return (F * V) / (V - vf * cos); };
  // posición de la ambulancia (va y vuelve a empezar) y del coche hacia el radar
  const VUELTA = 22, ambulancia = (T, vel) => -3 + ((T * vel) % VUELTA);
  const coche = (T) => 17 - ((T * 2.1) % 15);

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue({ x: 8, y: 4.5, z: 1 }, reloj, quieto);
    const { X, Y, rotulo, punto } = v;
    const foto = window.FenomenoFoto;

    calle();
    if (paso <= 2) {
      const vf = paso === 2 ? pruebaSirena.vf : VF, mach = Math.min(0.75, (vf / V) * 4.8), velS = 2.6, vel = mach * velS || 0.0001;
      // con el movimiento reducido la escena se congela con la ambulancia un poco antes del peatón
      const T = quieto ? (6.3 + 3) / vel : reloj;
      const xa = vf === 0 ? 6.3 : ambulancia(T, vel);
      frentes(T, vel, velS, vf);
      peaton();
      furgon(xa);
      if (paso === 1) rotulo('delante: frentes juntos → más agudo', Math.min(15.6, xa + 1.6), 3.9, { al: 'center', peso: 700, color: c.agudo, escribe: tramo(t, 0.3, 0.6) });
      if (paso === 2) rotulo('detrás: frentes separados → más grave', Math.max(0.4, xa - 1.6), 3.9, { al: 'center', peso: 700, color: c.grave, escribe: tramo(t, 0.3, 0.6) });
      if (!foto) medidor(xa, vf);
    } else {
      const T = quieto ? 8 / 2.1 : reloj, xc = quieto ? 9 : coche(T);
      radar(); ondas(xc, T); auto(xc);
      if (paso === 3) { rotulo('24 GHz → λ = 1,25 cm', 2.4, 4.3, { peso: 700, color: c.ida, escribe: tramo(t, 0.3, 0.6) }); rotulo('a la velocidad de la luz', 2.4, 4.75, { tam: 12, escribe: tramo(t, 0.5, 0.8) }); }
      if (paso >= 4 && !foto) pulsaciones();
      if (paso === 5) multa(xc, T);
    }

    function calle() {
      const gr = g.createLinearGradient(0, 0, 0, Y(ACERA)); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, Y(ACERA));
      // edificios del fondo
      for (let j = 0; j < 9; j++) { const x = -0.5 + j * 1.95 + azar(j) * 0.5, an = 1.3 + azar(j + 3) * 0.5, al = 1.6 + azar(j + 7) * 2.2; g.fillStyle = j % 2 ? c.edificio : c['edificio-2']; g.fillRect(X(x), Y(ACERA - al), an * v.K, al * v.K);
        g.fillStyle = rgba(c.ventana, 0.7); for (let fy = ACERA - al + 0.3; fy < ACERA - 0.5; fy += 0.55) for (let fx = x + 0.2; fx < x + an - 0.3; fx += 0.45) g.fillRect(X(fx), Y(fy), 0.2 * v.K, 0.25 * v.K); }
      g.fillStyle = c.acera; g.fillRect(0, Y(ACERA), w, Y(CARRIL1 - 0.55) - Y(ACERA)); g.fillRect(0, Y(BORDE), w, h - Y(BORDE));
      g.fillStyle = c.asfalto; g.fillRect(0, Y(CARRIL1 - 0.55), w, Y(BORDE) - Y(CARRIL1 - 0.55));
      g.strokeStyle = c.linea; g.lineWidth = Math.max(1.5, 0.06 * v.K); g.setLineDash([0.5 * v.K, 0.4 * v.K]); g.beginPath(); g.moveTo(0, Y(MEDIO)); g.lineTo(w, Y(MEDIO)); g.stroke(); g.setLineDash([]);
    }
    // frentes de onda: uno cada PER s desde donde estaba la sirena, que crecen a velS
    function frentes(T, vel, velS, vf) {
      const PER = 0.32, RMAX = 11;
      g.lineWidth = Math.max(1.2, 0.035 * v.K);
      for (let k = Math.floor(T / PER); k * PER > T - RMAX / velS; k--) {
        const te = k * PER, r = velS * (T - te); if (r < 0.02) continue;
        const xe = vf === 0 ? 6.3 : ambulancia(te, vel);
        if (vf !== 0 && xe > ambulancia(T, vel) + 0.01) continue; // de la vuelta anterior
        g.strokeStyle = rgba(c.onda, 0.75 * (1 - r / RMAX)); g.beginPath(); g.arc(X(xe + 0.55), Y(SIRENA), r * v.K, 0, 2 * Math.PI); g.stroke();
      }
    }
    function peaton() {
      const x = OYE, pie = ACERA + 0.35;
      g.strokeStyle = c.persona; g.lineCap = 'round'; g.lineWidth = Math.max(2, 0.11 * v.K);
      g.beginPath(); g.moveTo(X(x - 0.12), Y(pie)); g.lineTo(X(x), Y(pie - 0.55)); g.lineTo(X(x + 0.12), Y(pie)); g.moveTo(X(x), Y(pie - 0.55)); g.lineTo(X(x), Y(pie - 1.15)); g.moveTo(X(x), Y(pie - 1.05)); g.lineTo(X(x - 0.2), Y(pie - 0.65)); g.moveTo(X(x), Y(pie - 1.05)); g.lineTo(X(x + 0.2), Y(pie - 0.65)); g.stroke();
      punto(x, pie - 1.35, 0.17, c.piel); g.lineCap = 'butt';
    }
    // la ambulancia, hacia la derecha, con la luz azul que parpadea
    function furgon(x) {
      const y = CARRIL1, L = 1.7, H = 0.75;
      g.fillStyle = c.sombra; g.fillRect(X(x), Y(y + 0.3), L * v.K, 0.08 * v.K);
      g.fillStyle = c.ambulancia; g.beginPath(); g.roundRect(X(x), Y(y - H + 0.3), 1.25 * v.K, H * v.K, 0.06 * v.K); g.fill();
      g.beginPath(); g.moveTo(X(x + 1.2), Y(y - 0.3)); g.lineTo(X(x + 1.5), Y(y - 0.3)); g.lineTo(X(x + L), Y(y)); g.lineTo(X(x + L), Y(y + 0.3)); g.lineTo(X(x + 1.2), Y(y + 0.3)); g.fill();
      g.fillStyle = c.cristal; g.beginPath(); g.moveTo(X(x + 1.3), Y(y - 0.24)); g.lineTo(X(x + 1.47), Y(y - 0.24)); g.lineTo(X(x + 1.6), Y(y - 0.02)); g.lineTo(X(x + 1.3), Y(y - 0.02)); g.fill();
      g.fillStyle = c.franja; g.fillRect(X(x), Y(y + 0.02), L * v.K, 0.1 * v.K); g.fillRect(X(x + 0.45), Y(y - 0.32), 0.1 * v.K, 0.3 * v.K); g.fillRect(X(x + 0.35), Y(y - 0.22), 0.3 * v.K, 0.1 * v.K);
      const on = quieto || Math.floor(reloj * 6) % 2 === 0;
      g.fillStyle = on ? c.luz : rgba(c.luz, 0.35); g.fillRect(X(x + 0.45), Y(SIRENA - 0.08), 0.22 * v.K, 0.12 * v.K);
      if (on) { const gr = g.createRadialGradient(X(x + 0.56), Y(SIRENA - 0.02), 0, X(x + 0.56), Y(SIRENA - 0.02), 0.5 * v.K); gr.addColorStop(0, rgba(c.luz, 0.5)); gr.addColorStop(1, rgba(c.luz, 0)); g.fillStyle = gr; g.beginPath(); g.arc(X(x + 0.56), Y(SIRENA - 0.02), 0.5 * v.K, 0, 2 * Math.PI); g.fill(); }
      for (const r of [x + 0.35, x + 1.35]) { punto(r, y + 0.3, 0.16, c.rueda); punto(r, y + 0.3, 0.07, c.llanta); }
    }
    // panel con lo que oye el peatón según dónde está la ambulancia
    function medidor(xa, vf) {
      v.pantalla();
      const x0 = 0.3, y0 = 0.25, an = 4.6, al = 1.95, a = suave(tramo(t, 0.05, 0.3));
      g.globalAlpha = a; v.panel(x0, y0, an, al); g.globalAlpha = 1;
      if (a <= 0) return;
      const fo = vf === 0 ? F : oido(xa, vf), fmin = f2De(Math.max(vf, 25)) - 10, fmax = f1De(Math.max(vf, 25)) + 10;
      rotulo('El peatón oye', x0 + 0.2, y0 + 0.3, { tam: 11.5, fondo: false, color: c.rotulo });
      rotulo(`${f1(fo)} Hz`, x0 + an - 0.2, y0 + 0.3, { al: 'right', tam: 14, peso: 700, fondo: false, color: fo > F + 0.5 ? c.agudo : fo < F - 0.5 ? c.grave : c.rotulo });
      // la curva f′ según la posición de la ambulancia, con un punto donde está ahora
      const gx = (x) => x0 + 0.25 + ((x + 3) / VUELTA) * (an - 0.5), gy = (fq) => y0 + al - 0.2 - ((fq - fmin) / (fmax - fmin)) * (al - 0.75);
      g.globalAlpha = a; g.strokeStyle = rgba(c.rotulo, 0.3); g.lineWidth = 1; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(X(gx(-3)), Y(gy(F))); g.lineTo(X(gx(VUELTA - 3)), Y(gy(F))); g.stroke(); g.setLineDash([]);
      g.strokeStyle = c.onda; g.lineWidth = 2; g.beginPath();
      for (let x = -3; x <= VUELTA - 3; x += 0.1) { const q = vf === 0 ? F : oido(x, vf); x === -3 ? g.moveTo(X(gx(x)), Y(gy(q))) : g.lineTo(X(gx(x)), Y(gy(q))); }
      g.stroke(); g.globalAlpha = 1;
      punto(gx(xa), gy(fo), 0.07, c.resalta, a);
      rotulo('700 Hz', x0 + an - 0.25, gy(F) - 0.17, { al: 'right', tam: 10.5, fondo: false, color: c.rotulo });
    }
    // radar en un trípode en la acera de abajo, mirando hacia la derecha
    function radar() {
      const x = 1.3, y = CARRIL2 + 0.15;
      g.strokeStyle = c.radar; g.lineWidth = Math.max(1.5, 0.06 * v.K); g.beginPath(); g.moveTo(X(x), Y(y + 0.2)); g.lineTo(X(x - 0.35), Y(BORDE + 0.95)); g.moveTo(X(x), Y(y + 0.2)); g.lineTo(X(x + 0.35), Y(BORDE + 0.95)); g.moveTo(X(x), Y(y + 0.2)); g.lineTo(X(x), Y(BORDE + 0.95)); g.stroke();
      g.fillStyle = c.radar; g.beginPath(); g.roundRect(X(x - 0.4), Y(y - 0.25), 0.9 * v.K, 0.45 * v.K, 0.06 * v.K); g.fill();
      g.fillStyle = c.cristal; g.beginPath(); g.ellipse(X(x + 0.5), Y(y - 0.03), 0.07 * v.K, 0.2 * v.K, 0, 0, 2 * Math.PI); g.fill();
    }
    // la onda que sale del radar (ida) y el eco que vuelve del coche, algo más apretado
    function ondas(xc, T) {
      const x0 = 1.85, x1 = xc - 0.05, yI = CARRIL2 - 0.22, yE = CARRIL2 + 0.12, aI = paso === 3 ? suave(tramo(t, 0, 0.4)) : 1;
      const lam = 0.36, lamE = lam * (1 - Math.min(0.35, (paso === 4 ? pruebaRadar.kmh : 119) / 600));
      const linea = (y, L, fase, color, a, hasta) => { g.strokeStyle = rgba(color, a); g.lineWidth = Math.max(1.3, 0.04 * v.K); g.beginPath(); for (let x = x0; x <= hasta; x += 0.03) { const yy = y + 0.07 * Math.sin((2 * Math.PI * (x - fase)) / L); x === x0 ? g.moveTo(X(x), Y(yy)) : g.lineTo(X(x), Y(yy)); } g.stroke(); };
      const T2 = quieto ? 0 : T;
      linea(yI, lam, T2 * 1.2, c.ida, 0.9, x0 + (x1 - x0) * aI);
      if (paso >= 4) linea(yE, lamE, -T2 * 1.2, c.eco, 0.9 * suave(tramo(t, 0.1, 0.4)), x1);
      if (paso === 4) { rotulo('ida: f', 2.4, 4.3, { peso: 700, color: c.ida, escribe: tramo(t, 0.2, 0.4) }); rotulo('eco: f + Δf', 2.4, 4.75, { peso: 700, color: c.eco, escribe: tramo(t, 0.35, 0.55) }); }
    }
    // el coche, hacia la izquierda (hacia el radar)
    function auto(x) {
      const y = CARRIL2, L = 1.5;
      g.fillStyle = c.sombra; g.fillRect(X(x), Y(y + 0.28), L * v.K, 0.08 * v.K);
      g.fillStyle = c.coche; g.beginPath(); g.roundRect(X(x), Y(y - 0.12), L * v.K, 0.4 * v.K, 0.1 * v.K); g.fill();
      g.beginPath(); g.moveTo(X(x + 0.3), Y(y - 0.1)); g.lineTo(X(x + 0.5), Y(y - 0.42)); g.lineTo(X(x + 1.1), Y(y - 0.42)); g.lineTo(X(x + 1.3), Y(y - 0.1)); g.fill();
      g.fillStyle = c.cristal; g.beginPath(); g.moveTo(X(x + 0.4), Y(y - 0.12)); g.lineTo(X(x + 0.55), Y(y - 0.36)); g.lineTo(X(x + 0.78), Y(y - 0.36)); g.lineTo(X(x + 0.78), Y(y - 0.12)); g.fill();
      g.beginPath(); g.moveTo(X(x + 0.84), Y(y - 0.12)); g.lineTo(X(x + 0.84), Y(y - 0.36)); g.lineTo(X(x + 1.05), Y(y - 0.36)); g.lineTo(X(x + 1.2), Y(y - 0.12)); g.fill();
      for (const r of [x + 0.32, x + 1.18]) { punto(r, y + 0.28, 0.14, c.rueda); punto(r, y + 0.28, 0.06, c.llanta); }
    }
    // pasos 5 y 6: las dos ondas mezcladas y sus pulsaciones, a Δf
    function pulsaciones() {
      v.pantalla();
      const x0 = 9.6, y0 = 0.3, an = 6.1, al = 2.5, a = suave(tramo(t, 0.15, 0.4));
      g.globalAlpha = a; v.panel(x0, y0, an, al); g.globalAlpha = 1;
      if (a <= 0) return;
      const kmh = paso === 4 ? pruebaRadar.kmh : 119, n = 2 + kmh / 30, ym = y0 + 1.2;
      g.globalAlpha = a; g.strokeStyle = c.ida; g.lineWidth = 1.2; g.beginPath();
      for (let x = 0; x <= 1; x += 0.002) { const s = Math.sin(2 * Math.PI * 60 * x) + Math.sin(2 * Math.PI * (60 + n) * x); const px = X(x0 + 0.25 + x * (an - 0.5)), py = Y(ym - 0.36 * s); x === 0 ? g.moveTo(px, py) : g.lineTo(px, py); }
      g.stroke();
      g.strokeStyle = c.eco; g.lineWidth = 2; g.setLineDash([5, 4]);
      for (const sg of [1, -1]) { g.beginPath(); for (let x = 0; x <= 1; x += 0.005) { const e = Math.abs(2 * Math.cos(Math.PI * n * x)); const px = X(x0 + 0.25 + x * (an - 0.5)), py = Y(ym - sg * 0.36 * e); x === 0 ? g.moveTo(px, py) : g.lineTo(px, py); } g.stroke(); }
      g.setLineDash([]); g.globalAlpha = 1;
      rotulo('onda enviada + eco: pulsaciones', x0 + 0.25, y0 + 0.28, { tam: 11.5, fondo: false });
      rotulo(`Δf = ${f0(dfDe(kmh / 3.6))} Hz`, x0 + an - 0.25, y0 + al - 0.25, { al: 'right', tam: 13, peso: 700, fondo: false, color: c.eco, escribe: tramo(t, 0.35, 0.6) });
    }
    // paso 6: la velocidad en la pantalla del radar y el flash
    function multa(xc, T) {
      rotulo('u = c Δf / 2f = 33 m/s = 118,8 km/h', 2.4, 4.3, { peso: 700, tam: 14, escribe: tramo(t, 0.3, 0.6) });
      rotulo('límite: 100 km/h', 2.4, 4.75, { tam: 12, color: c.resalta, escribe: tramo(t, 0.55, 0.75) });
      if (!quieto && t > 0.6 && xc < 6.5 && xc > 5.6) { g.fillStyle = rgba('#ffffff', 0.55 * (1 - (6.5 - xc) / 0.9)); g.fillRect(0, 0, w, h); }
    }
  }

  /* ---------------- sonido (opcional, apagado al abrir) ---------------- */
  // la sirena de dos tonos con el tono que oye el peatón en los pasos 1 a 3
  function sonido(ac) {
    const os = ac.createOscillator(), vol = ac.createGain();
    os.type = 'triangle'; vol.gain.value = 0; os.connect(vol).connect(ac.destination); os.start();
    return {
      cuadro({ paso, reloj, quieto }) {
        if (paso > 2) { vol.gain.setTargetAtTime(0, ac.currentTime, 0.05); return; }
        const vf = paso === 2 ? pruebaSirena.vf : VF, vel = Math.min(0.75, (vf / V) * 4.8) * 2.6 || 0.0001;
        const xa = vf === 0 || quieto ? 6.3 : ambulancia(reloj, vel), dos = Math.floor(reloj / 0.6) % 2 ? 0.8 : 1;
        os.frequency.setTargetAtTime((vf === 0 ? F : oido(xa, vf)) * dos, ac.currentTime, 0.01);
        vol.gain.setTargetAtTime(0.03 + 0.12 / (1 + ((OYE - xa) / 2.5) ** 2), ac.currentTime, 0.05);
      },
    };
  }

  const COLORES = ['cielo', 'cielo-alto', 'edificio', 'edificio-2', 'ventana', 'acera', 'asfalto', 'linea', 'sombra', 'ambulancia', 'franja', 'cristal', 'luz', 'rueda', 'llanta', 'coche', 'radar', 'persona', 'piel', 'onda', 'agudo', 'grave', 'ida', 'eco', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, sonido, COLORES, ejercicio, abrirEnDoppler };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: RadarSirena.pasos, dibuja: RadarSirena.dibuja, colores: RadarSirena.COLORES, sonido: RadarSirena.sonido });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); RadarSirena.abrirEnDoppler(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = RadarSirena;
