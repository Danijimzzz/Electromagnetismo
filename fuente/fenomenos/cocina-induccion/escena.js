/* =====================================================================
   La cocina de inducción: los 6 pasos de la animación (texto y dibujo) y el
   ejercicio que se abre en Inducción: Faraday y Lenz (un campo B₀ sen(ωt) de
   25 kHz que atraviesa la base de la sartén, como espira de 8 cm de radio).
   El motor es fenomenos/animacion.js, los ayudantes de dibujo
   fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se
   cargan los datos: pruebas/herramientas/fenomenos/cocina-induccion.js.
   DATOS ESCRITOS DE MEMORIA (Dani debe revisarlos): B₀ = 3 mT en la base,
   ρ del hierro 1·10⁻⁷ Ω·m, anillo de 2 mm × 1 mm, rendimiento ~90 %.
   ===================================================================== */
const CocinaInduccion = (() => {
  // modelo: la base de la sartén como un anillo de radio 8 cm, 2 mm de ancho y 1 mm de espesor, de hierro
  const FREC = 25000, B0 = 3e-3, RADIO = 0.08, RHO = 1e-7, ANCHO = 2e-3, ESPESOR = 1e-3, RED = 50;
  const W = 2 * Math.PI * FREC, S = Math.PI * RADIO * RADIO, R = (RHO * 2 * Math.PI * RADIO) / (ANCHO * ESPESOR);
  const epsPico = B0 * S * W, epsEf = epsPico / Math.SQRT2, Ipico = epsPico / R, P = (epsEf * epsEf) / R;
  // con la frecuencia f (kHz): la fem es proporcional a f y la potencia a f²
  const epsEfDe = (fk) => (epsEf * fk) / (FREC / 1000), potencia = (fk) => (epsEfDe(fk) ** 2) / R;
  const datos = { FREC, W, B0, RADIO, S, RHO, R, epsPico, epsEf, Ipico, P, P50: potencia(RED / 1000), epsEf50: epsEfDe(RED / 1000), caida: Math.sqrt((2 * 0.5) / 9.81) };

  const n = (x, d = 1) => x.toFixed(d).replace('.', ',');
  const miles = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const pw = (x) => (x >= 100 ? miles(x) : x >= 1 ? n(x, 1) : n(x, 3));

  const pasos = [
    { titulo: 'Una sartén que se calienta sin llama', corto: 'Sartén', dato: { valor: '≈ 90 %', texto: 'de la energía de la placa acaba en la sartén; en un fogón de gas, cerca de la mitad.' }, texto: 'Pones una sartén con agua sobre una placa de inducción y el agua hierve enseguida. Pero no hay llama ni una resistencia al rojo: el cristal de debajo casi no se calienta, y si la quitas, la placa se queda fría en pocos segundos.\n\n¿Cómo calienta entonces? No calienta ella: **hace que se caliente la propia sartén**. La energía llega sin contacto, por el campo magnético, y se convierte en calor dentro del metal de la base.' },
    { titulo: 'Debajo del cristal, una bobina', corto: 'Bobina', dato: { valor: '25 kHz', texto: 'son 25 000 ciclos por segundo del campo, frente a los 50 de la red.' }, texto: 'Bajo el cristal hay una bobina plana de hilo de cobre. La electrónica de la placa le pasa una corriente alterna de unos 25 kHz, y esa corriente crea un campo magnético $B$ que atraviesa el cristal y llega hasta la sartén.\n\nComo la corriente cambia de sentido 25 000 veces por segundo, el campo sube, baja y se invierte al mismo ritmo, $B(t) = B_0 "sen"(ω t)$. En la animación va en cámara lenta, para que se vea.' },
    { titulo: 'Un flujo que cambia: Faraday', corto: 'Faraday', dato: { valor: `ε = ${n(epsEf)} V`, texto: `de fem eficaz en la base (pico de ${n(epsPico)} V), aunque sea una sartén.` }, texto: `La base de la sartén es un metal que el campo atraviesa. Su flujo vale $Φ = B S$, y como $B$ cambia, el flujo también. Es justo lo que pide la ley de Faraday para inducir una fem:\n\n$ε = −{dΦ}/{dt} = −B_0 S ω cos(ω t)$\n\nCon $B_0$ = 3 mT, una base de 8 cm de radio ($S$ = ${n(S * 1e4, 0)} cm²) y $ω = 2π · 25000 = ${miles(W)}$ rad/s, la fem máxima es $ε_0 = B_0 S ω$ = **${n(epsPico, 2)} V** (${n(epsEf, 2)} V eficaces). Ni hace falta cable: la induce el propio campo.` },
    { titulo: 'Corrientes por la sartén (de Foucault)', corto: 'Foucault', dato: { valor: `${miles(Ipico)} A`, texto: `de pico circulan por la base, porque su resistencia es de solo ${n(R * 1e3, 1)} mΩ.` }, texto: `Una fem en un metal macizo hace circular una corriente: $I = ε / R$. En la base de la sartén, que es un conductor sin cables, se forman remolinos de corriente cerrados, las corrientes de Foucault (o parásitas).\n\nSi se modela la base como un anillo de hierro de 2 mm × 1 mm de sección, su resistencia es $R = ρ L/A = 10^{−7} · 0,503 / (2·10^{−6}) = ${n(R * 1e3, 1)} "mΩ"$, y la corriente de pico, $I_0 = ε_0 / R$ = **${miles(Ipico)} A**. Por la ley de Lenz, la corriente se opone al cambio del flujo: va en sentido contrario al que haría crecer el campo.` },
    { titulo: 'Calor por efecto Joule', corto: 'Calor', dato: { valor: `${miles(P)} W`, texto: `de potencia con 25 kHz, como un fogón potente; con 50 Hz de la red serían solo ${n(datos.P50 * 1e3, 1)} mW.` }, texto: `Una corriente que pasa por una resistencia la calienta, es el efecto Joule: $P = {ε_"ef"^2}/R = {${n(epsEf, 2)}^2}/{${n(R, 4)}} = ${miles(P)} "W"$. Es la potencia de un fogón de cocina, y sale del propio metal, sin pasar por el cristal.\n\nLa fem es proporcional a la frecuencia, así que la potencia lo es a $f^2$: con la red de 50 Hz saldrían ${n(datos.P50 * 1e3, 1)} mW, nada. Por eso la placa trabaja a decenas de kHz. Y por eso la sartén debe ser de hierro: es magnética (concentra el campo) y mala conductora comparada con el cobre. Una de aluminio o de cobre apenas se calienta, y la placa ni la detecta.`, dura: 11000 },
    { titulo: 'El imán que cae despacio', corto: 'Imán', dato: { valor: '1855', texto: 'Foucault comprobó que un disco de cobre que gira entre los polos de un imán se frena y se calienta.' }, texto: 'Las mismas corrientes de Foucault tienen otro efecto muy visible. Suelta un imán de neodimio por un tubo de plástico: cae en una fracción de segundo, como cualquier piedra (50 cm en unos 0,32 s). Suéltalo por un tubo de cobre del mismo tamaño y tarda varios segundos.\n\nEl imán en movimiento cambia el flujo que atraviesa cada anillo del tubo, y por Faraday se induce una corriente. Por Lenz, esa corriente crea un campo que se opone al movimiento del imán y lo frena. El tubo no se mueve, y el imán no toca nada: la energía de la caída se va en calentar el cobre. Los frenos magnéticos de trenes y montañas rusas funcionan así.', dura: 11000 },
  ];

  // ejercicio de Inducción: Faraday y Lenz (formato de faraday-v1): la base de la sartén como una espira de 8 cm de radio con B(t) = B₀ sen(ωt)
  const ejercicio = () => ({ modo: 'funcion', N: '1', forma: 'circulo', r: '0.08', tipoB: 'seno', B0: '0.003', w: String(Math.round(W * 100) / 100), th: '0', t: '0', sentidoB: 'entrante', R: n(R, 5).replace(',', '.') });
  function abrirEnFaraday(destino) {
    try { localStorage.setItem('faraday-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const cam = { x: 8, y: 4.5, z: 1 };
  const CAMS = [{ x: 8, y: 4.5, z: 1 }, { x: 8, y: 5.0, z: 1.15 }, { x: 8, y: 5.4, z: 1.7 }, { x: 8, y: 5.4, z: 1.7 }, { x: 8, y: 4.8, z: 1.35 }, { x: 8, y: 4.5, z: 1 }];
  const BASE = { x0: 4.2, x1: 11.8, y0: 5.45, y1: 5.9 };
  // «Pruébalo tú» del paso 5: frecuencia de la corriente de la bobina
  const prueba = { etiqueta: 'la frecuencia de la corriente', min: 1, max: 50, paso: 1, valor: 25, fk: 25,
    muestra: (fk) => `${fk} kHz → ${pw(potencia(fk))} W de potencia en la base`, cambia: (fk) => { prueba.fk = fk; } };
  pasos[4].prueba = prueba;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(CAMS[paso], reloj, quieto);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto, r = quieto ? 0.2 : reloj;
    // fase del campo (cámara lenta): B ∝ sen(2π ph), su derivada ∝ cos
    const ph = quieto ? 0.2 : (r * 0.3) % 1, sn = Math.sin(2 * Math.PI * ph), cs = Math.cos(2 * Math.PI * ph);

    if (paso < 5) {
      const calor = paso === 0 ? suave(tramo(t, 0.1, 0.85)) : paso === 4 ? 0.35 + 0.65 * suave(tramo(t, 0.05, 0.6)) : 0.12;
      cocina(calor, paso === 0 || paso === 4 ? calor : 0, paso !== 0);
      if (paso === 1) campoBobina();
      if (paso === 2) flujo();
      if (paso === 3) { flujo(0.35); foucault(); }
      if (paso === 4) calorJoule(calor);
      rotulos();
    } else iman();

    // la cocina vista de lado: placa, bobina, sartén con agua
    function simbolo(x, y, dentro, a) {
      punto(x, y, 0.15, c.cobre, a); g.strokeStyle = rgba(c.rotulo, a); g.lineWidth = Math.max(1.2, 0.03 * v.K);
      g.beginPath(); g.arc(X(x), Y(y), 0.15 * v.K, 0, 2 * Math.PI); g.stroke();
      if (dentro) { const d = 0.09; g.beginPath(); g.moveTo(X(x - d), Y(y - d)); g.lineTo(X(x + d), Y(y + d)); g.moveTo(X(x + d), Y(y - d)); g.lineTo(X(x - d), Y(y + d)); g.stroke(); } else punto(x, y, 0.045, c.rotulo, a);
    }
    function cocina(calor, burbujas, corriente) {
      g.fillStyle = c.sala; g.fillRect(0, 0, w, h);
      g.fillStyle = c.encimera; g.fillRect(0, Y(5.9), w, h - Y(5.9));
      g.fillStyle = c.hueco; g.fillRect(X(2.5), Y(6.15), 11 * v.K, 2.1 * v.K);
      g.fillStyle = c.cristal; g.fillRect(X(2.5), Y(5.9), 11 * v.K, 0.25 * v.K);
      g.fillStyle = c.ferrita; g.fillRect(X(3.6), Y(6.95), 8.8 * v.K, 0.18 * v.K);
      // bobina: hilos de cobre en sección; la corriente entra por un lado y sale por el otro y se invierte con el campo
      for (let k = 0; k < 7; k++) for (const lado of [-1, 1]) {
        const x = 8 + lado * (1 + k * 0.45);
        if (corriente) simbolo(x, 6.55, lado * sn < 0 ? false : true, 0.35 + 0.65 * Math.abs(sn)); else punto(x, 6.55, 0.15, c.cobre);
      }
      // sartén: base y paredes, que se ponen al rojo con el calor
      const sar = (x, y, an, al) => { g.fillStyle = c.sarten; g.fillRect(X(x), Y(y), an * v.K, al * v.K); g.fillStyle = rgba(c.caliente, calor * 0.85); g.fillRect(X(x), Y(y), an * v.K, al * v.K); };
      g.fillStyle = rgba(c.agua, 0.85); g.fillRect(X(4.35), Y(4.4), 7.3 * v.K, 1.05 * v.K);
      sar(BASE.x0, BASE.y0, BASE.x1 - BASE.x0, BASE.y1 - BASE.y0); sar(4.0, 3.6, 0.35, 2.3); sar(11.65, 3.6, 0.35, 2.3); sar(12.0, 3.9, 2.6, 0.22);
      if (burbujas > 0) for (let j = 0; j < 16; j++) { const s = ((quieto ? 0.5 : r * 0.5) + azar(j + 20)) % 1; punto(4.8 + azar(j) * 6.4, 5.4 - s * 1.0, 0.05 + 0.04 * azar(j + 9), c.brillo, burbujas * (1 - s) * 0.9); }
    }
    // paso 2: líneas de campo que salen de la bobina, atraviesan la sartén y vuelven por fuera, cambiando de sentido
    function campoBobina() {
      const a = suave(tramo(t, 0.05, 0.35));
      for (const lado of [-1, 1]) for (const R2 of [2.4, 4.0, 5.6]) {
        const ry = R2 * 0.62, cx = 8 + lado * R2 / 2, cy = 6.1;
        g.strokeStyle = rgba(c.campo, 0.55 * a); g.lineWidth = Math.max(1.2, 0.03 * v.K); g.beginPath(); g.ellipse(X(cx), Y(cy), (R2 / 2) * v.K, ry * v.K, 0, 0, 2 * Math.PI); g.stroke();
        // puntos que van y vienen por la línea: suben por el eje cuando B sube y bajan cuando B baja
        for (let j = 0; j < 4; j++) {
          const th = 2 * Math.PI * (j / 4) + 0.7 * sn, px = cx - lado * (R2 / 2) * Math.cos(th), py = cy + ry * Math.sin(th);
          punto(px, py, 0.07, c.campo, a * Math.min(1, 0.4 + Math.abs(sn)));
        }
      }
    }
    // pasos 3 y 4: el campo atraviesa la base (flechas hacia arriba o abajo) y el flujo cambia
    function flujo(alfa = 1) {
      const a = suave(tramo(t, 0.05, 0.3)) * alfa;
      for (let x = 4.8; x <= 11.3; x += 0.9) if (Math.abs(sn) > 0.08) v.flecha(x, sn > 0 ? 6.3 : 5.0, x, sn > 0 ? 6.3 - 1.25 * sn : 5.0 + 1.25 * -sn, c.campo, a, 0.045);
      if (paso !== 2 || foto) return;
      v.pantalla();
      const x0 = 0.3, y0 = 0.3, an = 5.0, al = 2.9, gx = (u) => x0 + 0.4 + u * (an - 0.8), gy = (q) => y0 + al / 2 + 0.15 - q * (al / 2 - 0.65);
      v.panel(x0, y0, an, al);
      g.strokeStyle = rgba(c.rotulo, 0.4); g.lineWidth = 1; g.beginPath(); g.moveTo(X(gx(0)), Y(gy(0))); g.lineTo(X(gx(1)), Y(gy(0))); g.stroke();
      for (const [f2, col] of [[(u) => Math.sin(2 * Math.PI * u), c.onda], [(u) => -Math.cos(2 * Math.PI * u), c.corriente]]) {
        g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath();
        for (let u = 0; u <= 1.0001; u += 0.01) { u ? g.lineTo(X(gx(u)), Y(gy(f2(u)))) : g.moveTo(X(gx(u)), Y(gy(f2(u)))); }
        g.stroke(); punto(gx(ph), gy(f2(ph)), 0.08, col);
      }
      rotulo('B(t)', x0 + 0.3, y0 + 0.4, { color: c.onda, peso: 700, tam: 12, fondo: false });
      rotulo('ε(t) = −dΦ/dt', x0 + 1.3, y0 + 0.4, { color: c.corriente, peso: 700, tam: 12, fondo: false });
      rotulo('un ciclo', x0 + an - 0.2, y0 + al - 0.25, { al: 'right', tam: 10.5, fondo: false });
      v.mundo();
    }
    // paso 4: remolinos de corriente en la base (sección de lado y vista desde arriba)
    function foucault() {
      const a = suave(tramo(t, 0.15, 0.45)), sentido = cs >= 0 ? 1 : -1;
      // de lado: la corriente sale por un lado y entra por el otro (en sentido contrario al que haría crecer el flujo)
      for (const [x, k] of [[BASE.x0 + 0.35, 1], [BASE.x1 - 0.35, -1]]) simboloC(x, 5.675, sentido * k > 0 ? 0 : 1, a * (0.35 + 0.65 * Math.abs(cs)));
      function simboloC(x, y, dentro, aa) {
        punto(x, y, 0.17, c.corriente, aa * 0.9); g.strokeStyle = rgba(c.brillo, aa); g.lineWidth = Math.max(1.4, 0.035 * v.K); const d = 0.09;
        if (dentro) { g.beginPath(); g.moveTo(X(x - d), Y(y - d)); g.lineTo(X(x + d), Y(y + d)); g.moveTo(X(x + d), Y(y - d)); g.lineTo(X(x - d), Y(y + d)); g.stroke(); } else punto(x, y, 0.045, c.brillo, aa);
      }
      if (foto) return;
      // vista desde arriba: anillos con puntos que giran
      v.pantalla();
      const x0 = 0.3, y0 = 0.3, an = 4.1, al = 3.4, cx = x0 + an / 2, cy = y0 + al / 2 + 0.1;
      v.panel(x0, y0, an, al);
      g.strokeStyle = rgba(c.corriente, 0.5 * a); g.lineWidth = 2;
      for (const [rad, num] of [[0.45, 4], [0.85, 7], [1.25, 10]]) {
        g.beginPath(); g.arc(X(cx), Y(cy), rad * v.K, 0, 2 * Math.PI); g.stroke();
        for (let j = 0; j < num; j++) { const ang = 2 * Math.PI * (j / num) + sentido * Math.abs(cs) * 0.9 * (quieto ? 0.2 : reloj) * 1.5; punto(cx + rad * Math.cos(ang), cy + rad * Math.sin(ang), 0.07, c.corriente, a); }
      }
      rotulo('vista desde arriba', x0 + an / 2, y0 + 0.3, { al: 'center', tam: 11, fondo: false });
      rotulo(`I máx = ${miles(Ipico)} A`, x0 + an / 2, y0 + al - 0.27, { al: 'center', tam: 11.5, peso: 700, color: c.corriente, fondo: false });
      v.mundo();
    }
    // paso 5: el calor sube de la base y panel con P(f)
    function calorJoule(calor) {
      for (let j = 0; j < 12; j++) {
        const x = 4.6 + (j / 11) * 6.8, s = ((quieto ? 0.3 : r * 0.7) + azar(j + 40)) % 1;
        g.strokeStyle = rgba(c.caliente, 0.8 * (1 - s) * calor); g.lineWidth = Math.max(1.5, 0.045 * v.K); g.beginPath();
        for (let k = 0; k <= 8; k++) { const yy = 5.35 - (s + k / 8 * 0.3) * 0.9; (k ? g.lineTo : g.moveTo).call(g, X(x + 0.07 * Math.sin(k * 1.4 + j)), Y(yy)); }
        g.stroke();
      }
      if (foto) return;
      v.pantalla();
      const x0 = 0.3, y0 = 0.3, an = 5.1, al = 3.2, gx = (fk) => x0 + 0.55 + (fk / 50) * (an - 1.0), gy = (q) => y0 + al - 0.55 - q * (al - 1.15), pmax = potencia(50);
      v.panel(x0, y0, an, al);
      g.strokeStyle = rgba(c.rotulo, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(X(gx(0)), Y(gy(1.05))); g.lineTo(X(gx(0)), Y(gy(0))); g.lineTo(X(gx(50)), Y(gy(0))); g.stroke();
      g.strokeStyle = c.caliente; g.lineWidth = 2.5; g.beginPath();
      for (let fk = 0; fk <= 50; fk += 1) { const q = potencia(fk) / pmax; fk ? g.lineTo(X(gx(fk)), Y(gy(q))) : g.moveTo(X(gx(fk)), Y(gy(q))); }
      g.stroke(); punto(gx(prueba.fk), gy(potencia(prueba.fk) / pmax), 0.09, c.resalta);
      rotulo('potencia en la base', x0 + 0.3, y0 + 0.3, { tam: 11.5, peso: 700, fondo: false });
      rotulo('f (kHz) →', x0 + an - 0.2, y0 + al - 0.22, { al: 'right', tam: 10.5, fondo: false });
      rotulo('P ∝ f²', gx(14), gy(0.5), { tam: 11, fondo: false, color: c.caliente });
      rotulo(`${prueba.fk} kHz: ${pw(potencia(prueba.fk))} W`, gx(prueba.fk) - 0.1, gy(potencia(prueba.fk) / pmax) - 0.32, { al: prueba.fk > 30 ? 'right' : 'left', tam: 11, fondo: false, color: c.resalta, peso: 700 });
      v.mundo();
    }
    // paso 6: dos tubos, uno de plástico y otro de cobre, y un imán que cae por cada uno
    function iman() {
      g.fillStyle = c.sala; g.fillRect(0, 0, w, h);
      g.fillStyle = c.encimera; g.fillRect(0, Y(7.7), w, h - Y(7.7));
      const ciclo = quieto ? 0.42 : (r % 7.5) / 7.5, uL = Math.min(1, ciclo / 0.14) ** 2, uR = Math.min(1, ciclo / 0.85);
      const top = 1.5, bot = 7.7, alto = 0.75, ancho = 0.85;
      for (const [cx, cobre, u] of [[4.6, false, uL], [11.4, true, uR]]) {
        const y = top + 0.2 + u * (bot - top - 0.4 - alto);
        // tubo
        g.fillStyle = cobre ? rgba(c.tubocobre, 0.55) : rgba(c.tubo, 0.4); g.fillRect(X(cx - 0.75), Y(top), 1.5 * v.K, (bot - top) * v.K);
        g.strokeStyle = cobre ? c.tubocobre : c.tubo; g.lineWidth = Math.max(2, 0.06 * v.K); g.strokeRect(X(cx - 0.75), Y(top), 1.5 * v.K, (bot - top) * v.K);
        // anillos de corriente alrededor del imán (solo en el cobre), uno por encima y otro por debajo en sentidos contrarios
        if (cobre) for (const [dy, col] of [[-0.45, c.corriente], [alto + 0.45, c.onda]]) {
          g.strokeStyle = rgba(col, 0.9); g.lineWidth = Math.max(2, 0.07 * v.K); g.beginPath(); g.ellipse(X(cx), Y(y + dy), 0.82 * v.K, 0.2 * v.K, 0, 0, 2 * Math.PI); g.stroke();
          const ang = (dy < 0 ? 1 : -1) * (quieto ? 0.3 : reloj * 2.2); punto(cx + 0.82 * Math.cos(ang), y + dy + 0.2 * Math.sin(ang), 0.07, col);
          punto(cx + 0.82 * Math.cos(ang + Math.PI), y + dy + 0.2 * Math.sin(ang + Math.PI), 0.07, col);
        }
        // imán
        g.fillStyle = c.imanN; g.fillRect(X(cx - ancho / 2), Y(y), ancho * v.K, (alto / 2) * v.K); g.fillStyle = c.imanS; g.fillRect(X(cx - ancho / 2), Y(y + alto / 2), ancho * v.K, (alto / 2) * v.K);
        g.strokeStyle = c.rotulo; g.lineWidth = 1.2; g.strokeRect(X(cx - ancho / 2), Y(y), ancho * v.K, alto * v.K);
      }
      rotulo('tubo de plástico', 4.6, 0.9, { al: 'center', peso: 700 });
      rotulo('tubo de cobre', 11.4, 0.9, { al: 'center', peso: 700 });
      rotulo(`cae libre: 50 cm en ${n(datos.caida, 2)} s`, 4.6, 8.4, { al: 'center', tam: 12, escribe: tramo(t, 0.2, 0.5) });
      rotulo('Lenz lo frena: varios segundos', 11.4, 8.4, { al: 'center', tam: 12, color: c.resalta, peso: 700, escribe: tramo(t, 0.4, 0.75) });
      rotulo('Lenz: el campo se opone', 8, 4.5, { al: 'center', tam: 12, escribe: tramo(t, 0.55, 0.9) });
    }
    function rotulos() {
      if (paso === 0) {
        rotulo('la sartén se calienta', 8, 3.2, { al: 'center', peso: 700, color: c.caliente, escribe: tramo(t, 0.3, 0.6) });
        rotulo('el cristal, casi frío', 8, 5.9, { al: 'center', tam: 12, escribe: tramo(t, 0.55, 0.85) });
        rotulo('sin llama ni resistencia roja', 8, 8.5, { al: 'center', tam: 12, escribe: tramo(t, 0.6, 0.9) });
      }
      if (paso === 1) {
        rotulo('bobina de cobre: 25 000 ciclos por segundo', 8, 8.3, { al: 'center', tam: 12.5, peso: 700, escribe: tramo(t, 0.25, 0.55) });
        rotulo('campo B(t) alterno (en cámara lenta)', 8, 1.9, { al: 'center', tam: 12.5, color: c.campo, peso: 700, escribe: tramo(t, 0.5, 0.8) });
      }
      if (paso === 2) rotulo('Φ = B S cambia → ε = −dΦ/dt', 12, 4.6, { al: 'center', tam: 12, peso: 700, escribe: tramo(t, 0.45, 0.8) });
      if (paso === 3) rotulo('corrientes de Foucault', 8, 4.8, { al: 'center', tam: 12.5, peso: 700, color: c.corriente, escribe: tramo(t, 0.4, 0.75) });
      if (paso === 4) rotulo('efecto Joule: P = ε²/R', 8, 4.1, { al: 'center', tam: 12.5, peso: 700, escribe: tramo(t, 0.3, 0.6) });
    }
  }

  const COLORES = ['sala', 'encimera', 'hueco', 'cristal', 'ferrita', 'cobre', 'sarten', 'caliente', 'agua', 'brillo', 'campo', 'corriente', 'onda', 'imanN', 'imanS', 'tubo', 'tubocobre', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, ejercicio, abrirEnFaraday, potencia, epsEfDe };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: CocinaInduccion.pasos, dibuja: CocinaInduccion.dibuja, colores: CocinaInduccion.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); CocinaInduccion.abrirEnFaraday(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = CocinaInduccion;
