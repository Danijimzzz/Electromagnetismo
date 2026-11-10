/* =====================================================================
   La pantalla táctil capacitiva: los 6 pasos de la animación (texto y dibujo)
   y el ejercicio que se abre en Dieléctricos y condensadores: la yema del
   dedo y un electrodo de 5 × 5 mm separados por un cristal de 0,7 mm con
   εr = 7, con 3,3 V. Modelo de orden de magnitud: el dedo (conductor) y el
   electrodo forman un condensador plano C = ε0 εr S/d que se suma, en paralelo,
   a los 10 pF del electrodo; la posición sale del centro de gravedad de las
   señales de los electrodos vecinos; un guante es otra capa en serie. El
   motor es fenomenos/animacion.js, los ayudantes de dibujo
   fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se
   cargan los datos: pruebas/herramientas/fenomenos/pantalla-tactil.js.
   ===================================================================== */
const PantallaTactil = (() => {
  const E0 = 8.8541878128e-12, ER = 7, D = 0.7e-3, S = 25e-6, V = 3.3;          // cristal: εr = 7, 0,7 mm; electrodo de 5 × 5 mm; 3,3 V
  const CS0 = 10e-12, UMBRAL = 1e-12, ERG = 3, PASO = 5, ANCHO = 8;              // electrodo sin tocar (10 pF), umbral de detección (1 pF), εr del guante, electrodos cada 5 mm y alcance de la señal (mm)
  // capacidad entre la yema y el electrodo con el cristal de espesor d (m) y, en serie, un guante de espesor tg (m)
  const cDedo = (d = D, tg = 0) => (E0 * S) / (d / ER + tg / ERG);
  // posición (mm) que calcula el controlador: centro de gravedad de las señales de los 5 electrodos (en 0, 5, 10, 15 y 20 mm)
  const senales = (x) => [0, 1, 2, 3, 4].map((k) => cDedo() * Math.max(0, 1 - Math.abs(x - k * PASO) / ANCHO));
  const posicion = (x) => { const s = senales(x), tot = s.reduce((a, b) => a + b, 0); return s.reduce((a, b, k) => a + b * k * PASO, 0) / tot; };
  const datos = { E0, ER, D, S, V, CS0, UMBRAL, ERG, Cd: cDedo(), dQ: cDedo() * V, Q0: CS0 * V, Q1: (CS0 + cDedo()) * V, subida: cDedo() / CS0, C1mm: cDedo(D, 1e-3) };
  const f0 = (x) => String(Math.round(x)), f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ',');
  const pF = (x) => f2(x * 1e12) + ' pF', pC = (x) => f1(x * 1e12) + ' pC';

  const pasos = [
    { titulo: 'Bajo el cristal hay una rejilla invisible', corto: 'Rejilla', dato: { valor: '≈ 5 mm', texto: 'es la separación típica entre los electrodos de la rejilla.' }, texto: `Debajo del cristal de tu móvil hay dos capas de tiras de un material que conduce y es transparente (óxido de indio y estaño). Unas son **filas** y las otras **columnas**, separadas por un aislante, y cada cruce es un pequeño **condensador**.\n\nUn chip controlador envía un pulso por cada fila y mide lo que llega por cada columna, cientos de veces por segundo. Mientras nada toca el cristal, cada cruce guarda siempre la misma carga. Para saber dónde has tocado le basta con encontrar el cruce en que algo cambia.`, dura: 10000 },
    { titulo: 'El dedo es un conductor, y la pantalla lo nota', corto: 'Dedo', dato: { valor: '≈ 60 %', texto: 'de tu cuerpo es agua con sales disueltas, que conduce la electricidad.' }, texto: `Tu cuerpo es en su mayor parte agua con sales, y eso lo hace un buen conductor. Además está unido a tierra a través de ti y de lo que tocas.\n\nCuando apoyas la yema sobre el cristal, el dedo (un conductor) y el electrodo de debajo (otro conductor), separados por el cristal (un aislante), son justo lo que hace falta para un **condensador**. Ni el cristal ni los electrodos cambian: lo que cambia es que ahora hay un conductor más al lado.` },
    { titulo: 'La capacidad del dedo con el electrodo', corto: 'Condensador', dato: { valor: pF(datos.Cd), texto: 'es la capacidad entre la yema y un electrodo de 5 × 5 mm, con el cristal por medio.' }, texto: `Es un condensador plano, y se calcula como siempre: $C = {ε_0 ε_r S}/d$. Con un electrodo de $S = 5 × 5 "mm" = 25 "mm"^2$, el cristal de $d = 0,7 "mm"$ y $ε_r = 7$:\n\n$C = {8,854·10^{−12} · 7 · 25·10^{−6}}/{0,7·10^{−3}} = ${f2(datos.Cd * 1e12)} "pF"$\n\nUna capacidad de unos pocos picofaradios, muy pequeña, pero mensurable. Cuanto más fino sea el cristal o más alto su $ε_r$, mayor es: por eso las pantallas usan cristal fino y no una funda gruesa.`, dura: 11000 },
    { titulo: 'El controlador detecta cuánta carga cabe', corto: 'Señal', dato: { valor: `+${f0(100 * datos.subida)} %`, texto: `sube la capacidad del electrodo al apoyar el dedo: de ${pF(CS0)} a ${pF(CS0 + datos.Cd)}.` }, texto: `Cada electrodo tiene ya una capacidad propia, de unos $${f0(CS0 * 1e12)} "pF"$. El dedo añade la suya **en paralelo**, así que se **suman**: $C = ${f0(CS0 * 1e12)} + ${f2(datos.Cd * 1e12)} = ${f2((CS0 + datos.Cd) * 1e12)} "pF"$.\n\nEl controlador carga el electrodo a $V = ${f1(V)} "V"$ y mide la carga que cabe: $Q = C V$ pasa de ${pC(datos.Q0)} a ${pC(datos.Q1)}. Si el aumento supera un umbral, hay un toque. (Las pantallas de hoy miden en realidad la capacidad *mutua* de cada cruce, que *baja* un poco porque el dedo se lleva parte de las líneas de campo, pero es el mismo tipo de cambio de pocos picofaradios.)` },
    { titulo: 'La posición: el centro de gravedad de las señales', corto: 'Posición', dato: { valor: '< 1 mm', texto: 'de error al situar el dedo, aunque los electrodos estén cada 5 mm.' }, texto: `Un dedo mide más de 5 mm de ancho, así que toca varios electrodos a la vez y a cada uno le cambia la señal en proporción a lo cerca que está. Con las señales de los vecinos el chip calcula el **centro de gravedad**:\n\n$x = {Σ x_i s_i}/{Σ s_i}$\n\nAsí no hace falta un electrodo por cada punto: con electrodos cada 5 mm se sitúa el dedo con una precisión de menos de 1 mm. Con varios cruces con señal a la vez la pantalla también sigue varios dedos (multitáctil).`, dura: 12000 },
    { titulo: 'Por qué fallan los guantes y la uña', corto: 'Guantes', dato: { valor: pF(datos.C1mm), texto: 'queda con un guante de 1 mm: unas 4 veces menos que con el dedo desnudo.' }, texto: `Un guante es una capa más de aislante entre el dedo y el electrodo, en serie con el cristal: $d_"eficaz" = d_1/ε_{r1} + d_2/ε_{r2}$. Con un guante de lana de 1 mm ($ε_r ≈ 3$): $C = {ε_0 S}/{0,7/7 + 1/3} = ${f2(datos.C1mm * 1e12)} "pF"$, que ya no llega al umbral supuesto de 1 pF.\n\nUna uña, un lápiz o un guante de lana normal no funcionan porque no conducen o están demasiado lejos. Los guantes «táctiles» llevan hilo conductor en las yemas, y los lápices para pantallas tienen una punta conductora. Y una gota de agua sí se nota: el agua conduce.` },
  ];

  // ejercicio de Dieléctricos y condensadores (formato de condensadores-v1): yema y electrodo de 25 mm², cristal de 0,7 mm con εr = 7, 3,3 V
  const ejercicio = () => ({ geo: 'plano', S: '25 mm2', d: '0,7 mm', disposicion: 'serie', capas: [{ t: '0,7 mm', er: '7' }], fuente: 'V', V: '3,3 V' });
  function abrirEnCondensadores(destino) {
    try { localStorage.setItem('condensadores-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  // «Pruébalo tú» del paso 3: espesor del cristal (mm)
  const prueba3 = { etiqueta: 'el espesor del cristal en mm', min: 0.3, max: 2, paso: 0.1, valor: 0.7, d: 0.7,
    muestra: (d) => `cristal de ${f1(d).replace(',0', ',0')} mm → C = ${f2(cDedo(d * 1e-3) * 1e12)} pF (con 0,7 mm son ${f2(datos.Cd * 1e12)} pF)`,
    cambia: (d) => { prueba3.d = d; } };
  pasos[2].prueba = prueba3;
  // «Pruébalo tú» del paso 5: posición real del dedo (mm)
  const prueba5 = { etiqueta: 'dónde pones el dedo (mm)', min: 2, max: 18, paso: 0.5, valor: 7.5, x: 7.5,
    muestra: (x) => `dedo en ${f1(x)} mm → la pantalla calcula ${f1(posicion(x))} mm (error de ${f2(Math.abs(posicion(x) - x))} mm)`,
    cambia: (x) => { prueba5.x = x; } };
  pasos[4].prueba = prueba5;
  // «Pruébalo tú» del paso 6: espesor del guante (mm)
  const prueba6 = { etiqueta: 'el grosor del guante en mm', min: 0, max: 3, paso: 0.1, valor: 1, tg: 1,
    muestra: (tg) => { const C = cDedo(D, tg * 1e-3); return `guante de ${f1(tg)} mm → C = ${f2(C * 1e12)} pF: ${C >= UMBRAL ? 'se detecta el toque' : 'NO se detecta (menos de 1 pF)'}`; },
    cambia: (tg) => { prueba6.tg = tg; } };
  pasos[5].prueba = prueba6;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c);
    const { X, Y, rotulo, punto, flecha, signo } = v, foto = window.FenomenoFoto;
    // fondo con luz en el centro y las esquinas en sombra
    g.fillStyle = c.fondo; g.fillRect(0, 0, w, h); v.brillo(8, 4.2, 9, c.panel, 0.6); v.vineta(0.13);
    // ---- ayudantes ----
    const lin = (pts, color, ancho = 0.07, a = 1, discont = false) => {
      g.strokeStyle = color; g.globalAlpha = a; g.lineWidth = Math.max(1.5, ancho * v.K); g.lineJoin = 'round'; g.lineCap = 'round'; g.setLineDash(discont ? [6, 5] : []);
      g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    };
    const rect = (x, y, ancho, alto, color, a = 1, r = 0) => { g.globalAlpha = a; g.fillStyle = color; g.beginPath(); g.roundRect(X(x), Y(y), ancho * v.K, alto * v.K, r * v.K); g.fill(); g.globalAlpha = 1; };
    // vista lateral de cristal + electrodo + controlador; devuelve la cara superior del cristal
    function lateral(grosor, y0) {
      const yv = y0, ye = y0 + grosor;
      v.sombra(8, ye + 0.45, 6.6, 0.3, 0.16);
      rect(2.2, yv, 11.6, grosor, c.cristal, 0.85); rect(2.2, yv, 11.6, Math.min(0.12, grosor * 0.3), c.panel, 0.55);   // cristal con su reflejo
      lin([[2.2, yv], [13.8, yv]], c.rotulo, 0.025, 0.7);
      rect(6.0, ye, 4.0, 0.3, c.electrodo, 1);                       // electrodo (ITO)
      rect(2.2, ye, 3.5, 0.3, c.electrodo, 0.35); rect(10.3, ye, 3.5, 0.3, c.electrodo, 0.35);
      lin([[8, ye + 0.3], [8, ye + 1.5], [11.6, ye + 1.5]], c.rotulo, 0.035, 0.9);
      rect(11.6, ye + 1.05, 2.6, 0.9, c.panel, 1, 0.12); lin([[11.6, ye + 1.05], [14.2, ye + 1.05], [14.2, ye + 1.95], [11.6, ye + 1.95], [11.6, ye + 1.05]], c.rotulo, 0.025, 0.8);
      rotulo('controlador', 12.9, ye + 1.5, { al: 'center', tam: 12, fondo: false });
      return yv;
    }
    // dedo apoyado con la yema en la cara y (si hay guante, encima); a = opacidad, tg = grosor dibujado del guante
    function dedo(y, a = 1, tg = 0) {
      if (tg > 0.01) { rect(6.0, y - tg, 4.0, tg, c.guante, 0.9 * a, 0.12); }
      // la yema, con volumen (más oscura en los bordes) y un halo donde toca el cristal
      v.brillo(8, y, 2.8, c.resalta, 0.2 * a * (quieto ? 0.8 : 0.65 + 0.35 * Math.sin(reloj * 3)));
      const piel = g.createLinearGradient(X(6.1), 0, X(9.9), 0); piel.addColorStop(0, Dibujo.mezcla(c.dedo, c.dedo2, 0.45)); piel.addColorStop(0.3, Dibujo.mezcla(c.dedo, c.panel, 0.18)); piel.addColorStop(0.7, c.dedo); piel.addColorStop(1, Dibujo.mezcla(c.dedo, c.dedo2, 0.55));
      rect(6.1, y - tg - 4.6, 3.8, 4.6, piel, a, 1.3); rect(6.1, y - tg - 4.6, 3.8, 3.0, piel, a, 0.2);
      g.globalAlpha = a; lin([[8, y - tg - 4.6], [8, y - tg - 5.1], [11.7, y - tg - 5.1]], c.rotulo, 0.035, 0.9); g.globalAlpha = 1;
      // tierra
      lin([[11.7, y - tg - 5.1], [11.7, y - tg - 4.5]], c.rotulo, 0.035, 0.9 * a);
      [0.45, 0.3, 0.15].forEach((m, k) => lin([[11.7 - m, y - tg - 4.5 + k * 0.17], [11.7 + m, y - tg - 4.5 + k * 0.17]], c.rotulo, 0.035, 0.9 * a));
    }

    // paso 1: la rejilla vista desde arriba
    function rejilla() {
      const FX = [3.7, 5.5, 7.3, 9.1, 10.9, 12.7], FY = [2.2, 3.7, 5.2, 6.7], on = suave(tramo(t, 0.02, 0.35));
      v.sombra(8.2, 8.5, 6.4, 0.35, 0.2 * on); rect(2.35, 0.68, 11.7, 7.64, c.rotulo, 0.85 * on, 0.5);   // el móvil, visto desde arriba
      rect(2.6, 0.9, 11.2, 7.2, c.fondo, on, 0.3); rect(2.6, 0.9, 11.2, 7.2, c.cristal, 0.5 * on, 0.3); lin([[2.6, 0.9], [13.8, 0.9], [13.8, 8.1], [2.6, 8.1], [2.6, 0.9]], c.rotulo, 0.03, 0.7 * on);
      const fila = Math.floor(reloj * 1.5) % 4, quedan = quieto ? -1 : fila;
      FY.forEach((y, k) => { rect(2.9, y - 0.17, 10.6, 0.34, c.fila, (k === quedan ? 1 : 0.75) * suave(tramo(t, 0.1 + k * 0.05, 0.4 + k * 0.05))); });
      FX.forEach((x, k) => { rect(x - 0.17, 1.15, 0.34, 6.7, c.columna, 0.85 * suave(tramo(t, 0.25 + k * 0.04, 0.5 + k * 0.04))); });
      const n = suave(tramo(t, 0.5, 0.7));
      FY.forEach((y) => FX.forEach((x) => punto(x, y, 0.11, c.panel, n)));
      // pulso que recorre la fila activa
      if (n > 0 && quedan >= 0) { const px = 2.9 + ((reloj * 1.5) % 1) * 10.6; punto(px, FY[quedan], 0.14, c.resalta, 0.9); }
      // un cruce ampliado
      const cx = FX[3], cy = FY[1];
      const q = suave(tramo(t, 0.7, 1));
      rotulo('filas: emiten', 2.6, 0.3, { tam: 12.5, peso: 700, color: c.fila, fondo: false, escribe: tramo(t, 0.15, 0.4) });
      rotulo('columnas: miden', 13.8, 0.3, { al: 'right', tam: 12.5, peso: 700, color: c.columna, fondo: false, escribe: tramo(t, 0.3, 0.55) });
      rotulo('cada cruce es un condensador', cx + 0.5, cy - 0.65, { tam: 12.5, peso: 700, escribe: tramo(t, 0.7, 0.9) });
      if (q > 0) { punto(cx, cy, 0.3, c.resalta, 0.3 * q); lin([[cx - 0.3, cy], [cx + 0.3, cy]], c.resalta, 0.03, q); }
      rotulo('vista desde arriba, bajo el cristal', 8.2, 8.68, { al: 'center', tam: 11.5, fondo: false, escribe: tramo(t, 0.8, 1) });
    }
    // paso 2: el dedo se acerca al cristal
    function elDedo() {
      const yv = lateral(0.6, 5.7), yd = yv - (1 - suave(tramo(t, 0.1, 0.55))) * 1.6;
      dedo(yd);
      rotulo('dedo (conductor)', 3.6, yd - 2.3, { al: 'center', tam: 13, peso: 700, color: c.dedo2, fondo: false, escribe: tramo(t, 0.4, 0.6) });
      rotulo('cristal (aislante)', 4.3, yv + 0.3, { al: 'center', tam: 12.5, peso: 600, fondo: false, escribe: tramo(t, 0.5, 0.7) });
      rotulo('electrodo', 4.0, yv + 1.2, { al: 'center', tam: 12.5, peso: 600, color: c.electrodo2, fondo: false, escribe: tramo(t, 0.55, 0.75) });
      rotulo('tierra', 12.7, yd - 4.1, { tam: 12, fondo: false, escribe: tramo(t, 0.6, 0.8) });
      const q = suave(tramo(t, 0.75, 1));
      if (q > 0) rotulo('conductor – aislante – conductor = condensador', 8, 8.6, { al: 'center', tam: 13.5, peso: 700, color: c.resalta, escribe: tramo(t, 0.75, 1) });
    }
    // paso 3: el condensador yema – electrodo
    function condensador() {
      const dm = prueba3.d, gro = 0.35 + dm * 0.55, yv = lateral(gro, 6.0 - Math.max(0, gro - 0.6)), ye = yv + gro;
      dedo(yv);
      const f = suave(tramo(t, 0.1, 0.5));
      // líneas de campo entre el dedo (−) y el electrodo (+)
      for (let k = 0; k < 6; k++) { const x = 6.5 + k * 0.6; flecha(x, ye - 0.04, x, yv + 0.04, c.resalta, 0.85 * f, 0.03); }
      for (let k = 0; k < 6; k++) { signo(6.5 + k * 0.6, ye + 0.15, 1, c.positivo, f); signo(6.5 + k * 0.6, yv - 0.2, -1, c.negativo, f); }
      rotulo('E', 10.6, (yv + ye) / 2, { tam: 14, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.4, 0.55) });
      lin([[5.3, yv], [5.3, ye]], c.rotulo, 0.025, f); lin([[5.15, yv], [5.45, yv]], c.rotulo, 0.025, f); lin([[5.15, ye], [5.45, ye]], c.rotulo, 0.025, f);
      rotulo(`d = ${f1(dm)} mm`, 5.0, (yv + ye) / 2, { al: 'right', tam: 12.5, peso: 600, escribe: tramo(t, 0.4, 0.6) });
      rotulo('S = 5 × 5 mm', 8, ye + 0.8, { al: 'center', tam: 12.5, peso: 600, fondo: false, escribe: tramo(t, 0.5, 0.65) });
      rotulo(`εr = ${ER}`, 11.5, yv + gro / 2 + 0.05, { tam: 12.5, peso: 600, fondo: false, escribe: tramo(t, 0.5, 0.65) });
      if (foto) return;
      v.panel(0.5, 0.6, 3.9, 2.2);
      rotulo('C = ε₀ εr S / d', 0.8, 1.15, { tam: 15, peso: 700, fondo: false, escribe: tramo(t, 0.55, 0.7) });
      rotulo(`C = ${f2(cDedo(dm * 1e-3) * 1e12)} pF`, 0.8, 1.95, { tam: 16, peso: 700, color: c.resalta, fondo: false, escribe: tramo(t, 0.7, 0.9) });
    }
    // paso 4: la carga que cabe, sin y con dedo
    function senal() {
      const x0 = 3.0, y0 = 7.4, Y1 = 1.6, esc = (q) => y0 - (q / 45e-12) * (y0 - Y1), a = suave(tramo(t, 0.05, 0.5)), b = suave(tramo(t, 0.45, 0.85));
      v.panel(1.0, 0.7, 14.0, 7.9);
      lin([[x0 - 0.5, y0], [14.6, y0]], c.rotulo, 0.03, 0.8);
      const bar = (xi, Q, color, f) => { const top = y0 - (y0 - esc(Q)) * f; rect(xi, top, 2.4, y0 - top, color, 0.9, 0.08); };
      bar(x0 + 0.6, datos.Q0, c.electrodo, a); bar(x0 + 4.0, datos.Q1, c.resalta, b);
      const um = (CS0 + UMBRAL) * V;
      lin([[x0 + 0.1, esc(um)], [14.4, esc(um)]], c.alerta, 0.03, 0.9, true);
      rotulo(`umbral: ${pC(um)}`, 14.4, esc(um) - 0.4, { al: 'right', tam: 12, peso: 600, color: c.alerta, fondo: false, escribe: tramo(t, 0.6, 0.8) });
      rotulo('sin dedo', x0 + 1.8, y0 + 0.5, { al: 'center', tam: 13, peso: 600, fondo: false });
      rotulo('con dedo', x0 + 5.2, y0 + 0.5, { al: 'center', tam: 13, peso: 600, fondo: false });
      rotulo(`${pF(CS0)}  →  ${pC(datos.Q0)}`, x0 + 1.8, esc(datos.Q0) - 0.45, { al: 'center', tam: 13, peso: 700, escribe: tramo(t, 0.2, 0.45) });
      rotulo(`${pF(CS0 + datos.Cd)}  →  ${pC(datos.Q1)}`, x0 + 5.2, esc(datos.Q1) - 0.45, { al: 'center', tam: 13, peso: 700, color: c.resalta, escribe: tramo(t, 0.65, 0.9) });
      rotulo('Q = C V', 12.2, 3.75, { al: 'center', tam: 18, peso: 700, fondo: false, escribe: tramo(t, 0.7, 0.85) });
      rotulo(`con V = ${f1(V)} V`, 12.2, 4.45, { al: 'center', tam: 13, fondo: false, escribe: tramo(t, 0.8, 0.95) });
      rotulo('¡toque detectado!', 12.2, 5.6, { al: 'center', tam: 15, peso: 700, color: c.resalta, escribe: tramo(t, 0.88, 1) });
    }
    // paso 5: electrodos cada 5 mm y centro de gravedad
    function lugar() {
      const mm = (x) => 2.4 + x * 0.57, base = 7.0, alto = 3.6, x = prueba5.x, s = senales(x), cd = cDedo(), a = suave(tramo(t, 0.05, 0.4)), b = suave(tramo(t, 0.35, 0.7));
      v.panel(1.0, 0.6, 14.0, 8.1);
      for (let k = 0; k < 5; k++) { rect(mm(k * PASO) - 0.45, base + 0.2, 0.9, 0.4, c.electrodo, 0.95 * a); rotulo(`${k * PASO}`, mm(k * PASO), base + 1.0, { al: 'center', tam: 11.5, fondo: false }); }
      rotulo('mm', 14.5, base + 1.0, { tam: 11.5, fondo: false });
      // barras de señal
      s.forEach((q, k) => { const hh = (q / cd) * alto * b; if (hh > 0.02) rect(mm(k * PASO) - 0.35, base - hh, 0.7, hh, c.resalta, 0.75); if (q > 0 && b > 0.5) rotulo(f2(q * 1e12), mm(k * PASO), base - hh - 0.3, { al: 'center', tam: 11, fondo: false }); });
      // dedo y posición calculada
      const xp = posicion(x);
      if (b > 0) { punto(mm(x), 1.9, 0.5, c.dedo, b); lin([[mm(x), 2.4], [mm(x), base]], c.dedo2, 0.03, 0.8 * b, true); }
      const q = suave(tramo(t, 0.7, 0.95));
      lin([[mm(xp), 2.5], [mm(xp), base + 0.65]], c.alerta, 0.05, q);
      rotulo(`dedo: ${f1(x)} mm`, mm(x) - 0.45, 1.9, { al: 'right', tam: 12.5, peso: 700, color: c.dedo2, fondo: false, escribe: tramo(t, 0.55, 0.75) });
      rotulo(`calculada: ${f1(xp)} mm`, mm(xp) + 0.2, 2.9, { tam: 12.5, peso: 700, color: c.alerta, escribe: tramo(t, 0.8, 1) });
      rotulo('señal de cada electrodo (pF)', 1.3, 1.2, { tam: 12, peso: 600, fondo: false });
    }
    // paso 6: el guante en serie
    function guantes() {
      const tg = prueba6.tg, gd = tg * 0.32, yv = lateral(0.6, 6.4), C = cDedo(D, tg * 1e-3), a = suave(tramo(t, 0.05, 0.45));
      dedo(yv, 1, gd * a);
      // barra de capacidad frente al umbral
      const bx = 1.2, by = 5.6, bh = 3.6;
      rect(bx, by - bh, 0.9, bh, c.panel, 0.9, 0.05);
      const hC = Math.min(1, C / (2.5e-12)) * bh * suave(tramo(t, 0.2, 0.7));
      rect(bx, by - hC, 0.9, hC, C >= UMBRAL ? c.resalta : c.alerta, 0.9, 0.05);
      lin([[bx - 0.2, by - (UMBRAL / 2.5e-12) * bh], [bx + 1.1, by - (UMBRAL / 2.5e-12) * bh]], c.alerta, 0.04, 1, true);
      rotulo('1 pF', bx + 1.2, by - (UMBRAL / 2.5e-12) * bh, { tam: 11.5, color: c.alerta, fondo: false });
      rotulo(`${f2(C * 1e12)} pF`, bx + 0.45, by + 0.4, { al: 'center', tam: 13, peso: 700, color: C >= UMBRAL ? c.resalta : c.alerta, fondo: false });
      rotulo(C >= UMBRAL ? 'se detecta' : 'NO se detecta', 4.2, 8.5, { al: 'center', tam: 15, peso: 700, color: C >= UMBRAL ? c.resalta : c.alerta, escribe: tramo(t, 0.6, 0.85) });
      rotulo(tg > 0 ? `guante de ${f1(tg)} mm` : 'dedo desnudo', 5.0, yv - gd * a - 0.3, { al: 'right', tam: 12.5, peso: 600, fondo: false, escribe: tramo(t, 0.4, 0.6) });
      rotulo('d_eficaz = d₁/εr₁ + d₂/εr₂', 15.2, 3.4, { al: 'right', tam: 13, peso: 600, fondo: false, escribe: tramo(t, 0.55, 0.8) });
    }

    if (paso === 0) rejilla();
    if (paso === 1) elDedo();
    if (paso === 2) condensador();
    if (paso === 3) senal();
    if (paso === 4) lugar();
    if (paso === 5) guantes();
  }

  const COLORES = ['fondo', 'cristal', 'fila', 'columna', 'electrodo', 'electrodo2', 'dedo', 'dedo2', 'guante', 'positivo', 'negativo', 'resalta', 'alerta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnCondensadores, cDedo, senales, posicion };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: PantallaTactil.pasos, dibuja: PantallaTactil.dibuja, colores: PantallaTactil.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); PantallaTactil.abrirEnCondensadores(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = PantallaTactil;
