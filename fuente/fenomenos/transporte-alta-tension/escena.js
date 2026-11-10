/* =====================================================================
   Por qué la luz viaja en alta tensión: los 6 pasos de la animación (texto
   y dibujo), el zumbido de los transformadores y el ejercicio que se abre
   en el Simulador de circuitos (la central, los dos cables de la línea y la
   ciudad como una resistencia, a 400 kV). El motor es fenomenos/animacion.js,
   los ayudantes de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En
   Node (pruebas) solo se cargan los datos:
   pruebas/herramientas/fenomenos/transporte-alta-tension.js.
   ===================================================================== */
const TransporteAltaTension = (() => {
  // modelo: una ciudad de 10 MW a 50 km; dos cables de aluminio (ρ = 2,8·10⁻⁸ Ω·m) de 560 mm², 2,5 Ω cada uno
  const P = 10e6, L = 50e3, RHO = 2.8e-8, S = 560e-6, RC = (RHO * L) / S, R = 2 * RC;
  const corriente = (V) => P / V, perdidas = (V) => corriente(V) ** 2 * R;
  const datos = { P, L, RHO, S, Rcable: RC, R, I230: corriente(230), P230: perdidas(230), I20k: corriente(20e3), P20k: perdidas(20e3), I400k: corriente(400e3), P400k: perdidas(400e3) };
  datos.veces230 = datos.P230 / P;
  // número con espacio de miles, como en los textos
  const m = (x, d = 0) => x.toFixed(d).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const pc = (x) => (x < 0.1 ? x.toFixed(3) : x < 10 ? x.toFixed(2) : x.toFixed(1)).replace('.', ',');
  const pot = (w) => (w >= 1e9 ? `${m(w / 1e9, 2)} GW` : w >= 1e6 ? `${m(w / 1e6, 2)} MW` : w >= 1e3 ? `${m(w / 1e3, 1)} kW` : `${m(w, 0)} W`);

  const pasos = [
    { titulo: 'Una ciudad a 50 km de la central', corto: 'Línea', dato: { valor: '10 MW', texto: 'consume la ciudad: lo que hay que llevarle por los cables.' }, texto: 'La central está lejos de la ciudad, a 50 km, y la ciudad necesita 10 MW, unas 10 000 casas con todo encendido. La potencia que llega por una línea es $P = V I$: tensión por corriente.\n\nLa misma potencia se puede llevar con mucha tensión y poca corriente o con poca tensión y mucha corriente. Parece lo mismo, pero no lo es: los cables no son perfectos.' },
    { titulo: 'Los cables se calientan', corto: 'Cables', dato: { valor: `R = ${m(RC, 1)} Ω`, texto: 'tiene cada cable de 50 km, y son dos: ida y vuelta.' }, texto: `Cada cable es de aluminio, con 560 mm² de sección: $R = ρ L/S = 2,8·10^{−8} · 5·10^4/(5,6·10^{−4}) = ${m(RC, 1)} "Ω"$. Entre la ida y la vuelta, ${m(R, 0)} Ω.\n\nLos electrones chocan con los átomos del metal y lo calientan: es el efecto Joule, y la potencia que se pierde es $P_p = I^2 R$. Va con el cuadrado de la corriente: el doble de corriente, cuatro veces más pérdidas.` },
    { titulo: 'Con 230 V, imposible', corto: '230 V', dato: { valor: pot(datos.P230), texto: `se perderían en los cables a 230 V: ${m(datos.veces230, 0)} veces lo que gasta la ciudad.` }, texto: `Si la línea fuera a 230 V, como los enchufes, la corriente sería $I = P/V = 10^7/230 = ${m(datos.I230, 0)} "A"$.\n\nY las pérdidas, $P_p = I^2 R = ${m(datos.I230, 0)}^2 · ${m(R, 0)} = ${m(datos.P230 / 1e9, 2)}·10^9 "W"$: mucho más que la potencia que se quería llevar. En la práctica los cables se fundirían. Por eso la luz no viaja a 230 V.` },
    { titulo: 'Con 400 kV, casi nada', corto: '400 kV', dato: { valor: `${pc((100 * datos.P400k) / P)} %`, texto: 'de la potencia se pierde a 400 kV: unos 3 kW de 10 MW.' }, texto: `A 400 000 V, la corriente baja a $I = 10^7/(4·10^5) = ${m(datos.I400k, 0)} "A"$, y las pérdidas a $P_p = ${m(datos.I400k, 0)}^2 · ${m(R, 0)} = ${m(datos.P400k, 0)} "W"$. Multiplicar la tensión por 1739 divide las pérdidas por 1739², unos tres millones.\n\nPor eso las líneas de transporte de España van a 220 y 400 kV, con torres altísimas y aisladores largos para que la chispa no salte a la torre ni al suelo.`, dura: 11000 },
    { titulo: 'El transformador cambia la tensión', corto: 'Transformador', dato: { valor: 'V₂/V₁ = N₂/N₁', texto: 'la tensión cambia en la proporción de las vueltas de las bobinas.' }, texto: 'Para subir y bajar la tensión se usa el transformador: dos bobinas en el mismo núcleo de hierro. La corriente alterna de la primera crea un campo magnético que cambia y que induce tensión en la segunda (ley de Faraday), en proporción a sus vueltas: $V_2/V_1 = N_2/N_1$.\n\nLa potencia se conserva (casi entera), así que si la tensión sube 20 veces, la corriente baja 20 veces: $V_1 I_1 = V_2 I_2$. Solo funciona con corriente alterna: por eso la red es alterna, de 50 Hz.' },
    { titulo: 'De la central al enchufe', corto: 'Red', dato: { valor: '400 kV → 230 V', texto: 'en varios saltos: transporte, distribución y el transformador del barrio.' }, texto: 'La central produce a unos 20 kV, un transformador lo sube a 400 kV para el viaje largo, en la entrada de la ciudad se baja a 20 kV para repartir por los barrios y el transformador de la esquina lo deja en 230 V para las casas.\n\nCon todo eso, la red de transporte pierde solo alrededor de un 1 o 2 % de la energía. Para distancias muy largas o cables bajo el mar, como el de la Península a Baleares, se usa alta tensión en continua, que hoy se puede transformar con electrónica de potencia.', dura: 11000 },
  ];

  // esquema del Simulador de circuitos: central de 400 kV, dos cables de 2,5 Ω y la ciudad de 16 kΩ (10 MW)
  const ejercicio = () => ({"version":2,"componentes":[{"id":"E1","t":"V","x":0,"y":2,"rot":1,"espejo":false,"v":{"forma":"cc","v":"400k","A":"5","eficaz":"de pico","f":"50","fase":"0","off":"0","duty":"50","v1":"0","v2":"5","t0":"0","td":"0","tr":"0","tf":"0","pw":"1m","per":"2m"}},{"id":"R1","t":"R","x":0,"y":2,"rot":0,"espejo":false,"v":{"R":"2,5"}},{"id":"R2","t":"R","x":4,"y":2,"rot":1,"espejo":false,"v":{"R":"16k"}},{"id":"R3","t":"R","x":4,"y":6,"rot":2,"espejo":false,"v":{"R":"2,5"}},{"id":"GND1","t":"GND","x":0,"y":6,"rot":0,"espejo":false,"v":{}}],"cables":[{"a":[0,6],"b":[0,6]}],"analisis":{},"vista":null});
  function abrirEnCircuitos(destino) {
    try { localStorage.setItem('simulador-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const SUELO = 7.2, TORRES = [4.6, 7.5, 10.4], SUBE = 3.0, BAJA = 12.0, ALTO = 3.3, cam = { x: 8, y: 4.5, z: 1 };
  const CAMS = [{ x: 8, y: 4.5, z: 1 }, { x: 6.05, y: 3.9, z: 2.3 }, { x: 8, y: 4.5, z: 1 }, { x: 8, y: 4.5, z: 1 }, { x: 3.0, y: 5.4, z: 2.0 }, { x: 8, y: 4.5, z: 1 }];
  // «Pruébalo tú» del paso 4: la tensión de la línea
  const prueba = { etiqueta: 'la tensión de la línea', min: 10, max: 500, paso: 10, valor: 400, kV: 400,
    muestra: (kV) => { const p = (100 * perdidas(kV * 1e3)) / P; return `${kV} kV → I = ${m(corriente(kV * 1e3), 0)} A, se pierde el ${p > 100 ? 'más del 100' : pc(p)} %`; },
    cambia: (kV) => { prueba.kV = kV; } };
  pasos[3].prueba = prueba;
  const tension = (paso) => (paso === 2 ? 230 : paso === 3 ? prueba.kV * 1e3 : 400e3);
  // los dos cables: puntos de amarre (subestación, torres, subestación) a dos alturas, con catenaria entre ellos
  const amarres = (k) => [[SUBE + 0.3, SUELO - 1.4 - 0.3 * k], ...TORRES.map((x) => [x, ALTO + 0.5 * k]), [BAJA - 0.3, SUELO - 1.4 - 0.3 * k]];
  const cableY = (x, k) => { const a = amarres(k); for (let j = 0; j < a.length - 1; j++) { const [x0, y0] = a[j], [x1, y1] = a[j + 1]; if (x <= x1 || j === a.length - 2) { const u = Math.max(0, Math.min(1, (x - x0) / (x1 - x0))); return y0 + (y1 - y0) * u + 0.45 * 4 * u * (1 - u); } } return 0; };

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(CAMS[paso], reloj, quieto);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto, r = quieto ? 1.3 : reloj;
    const V = tension(paso), I = corriente(V), frac = Math.min(1, perdidas(V) / P), calor = Math.min(1, frac * 6);

    fondo(); central(); trafo(SUBE, 'sube'); trafo(BAJA, 'baja'); ciudad(); TORRES.forEach(torre); cables();
    if (paso === 1) zoomCable();
    if (paso === 4) bobinas();
    rotulos();
    if (!foto && (paso === 0 || paso === 2 || paso === 3 || paso === 5)) panel();

    function fondo() {
      const gr = g.createLinearGradient(0, 0, 0, Y(SUELO)); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, Y(SUELO));
      g.fillStyle = c.monte; g.beginPath(); g.moveTo(X(-3), Y(SUELO)); for (let x = -3; x <= 20; x += 0.5) g.lineTo(X(x), Y(SUELO - 0.8 - 0.5 * Math.sin(x * 0.6) - 0.25 * Math.sin(x * 1.9))); g.lineTo(X(20), Y(SUELO)); g.fill();
      g.fillStyle = c.cesped; g.fillRect(0, Y(SUELO), w, h - Y(SUELO));
    }
    function central() {
      // torre de refrigeración con vapor y la nave de la turbina
      g.fillStyle = c.hormigon; g.beginPath(); g.moveTo(X(0.3), Y(SUELO)); g.quadraticCurveTo(X(0.75), Y(SUELO - 1.4), X(0.55), Y(SUELO - 2.6)); g.lineTo(X(1.55), Y(SUELO - 2.6)); g.quadraticCurveTo(X(1.35), Y(SUELO - 1.4), X(1.8), Y(SUELO)); g.fill();
      for (let j = 0; j < 5; j++) { const s = ((quieto ? 0.3 : r * 0.15) + j / 5) % 1; punto(1.05 + 0.4 * s * Math.sin(j), SUELO - 2.8 - 1.6 * s, 0.25 + 0.35 * s, c.vapor, 0.6 * (1 - s)); }
      g.fillStyle = c.edificio; g.fillRect(X(1.6), Y(SUELO - 1.2), 1.2 * v.K, 1.2 * v.K);
      g.fillStyle = c.ventana; for (let j = 0; j < 2; j++) g.fillRect(X(1.8 + j * 0.5), Y(SUELO - 0.8), 0.25 * v.K, 0.3 * v.K);
    }
    function trafo(x, que) {
      g.fillStyle = c.trafo; g.fillRect(X(x - 0.35), Y(SUELO - 0.9), 0.7 * v.K, 0.9 * v.K);
      g.fillStyle = c.aislador; for (const dx of [-0.2, 0.2]) g.fillRect(X(x + dx - 0.04), Y(SUELO - 1.4), 0.08 * v.K, 0.5 * v.K);
      g.strokeStyle = c.valla; g.lineWidth = 1; g.strokeRect(X(x - 0.55), Y(SUELO - 1.0), 1.1 * v.K, 1.0 * v.K);
      // salida en media tensión hacia la central o la ciudad
      g.strokeStyle = c.cable; g.lineWidth = Math.max(1, 0.025 * v.K); g.beginPath(); g.moveTo(X(que === 'sube' ? x - 0.35 : x + 0.35), Y(SUELO - 0.5)); g.lineTo(X(que === 'sube' ? 2.8 : 12.7), Y(SUELO - 0.5)); g.stroke();
    }
    function ciudad() {
      const luz = paso === 2 ? 0.1 : 1;
      for (const [x, an, al] of [[12.8, 0.7, 1.8], [13.6, 0.9, 2.6], [14.6, 0.6, 1.5], [15.3, 0.8, 2.2], [16.2, 0.9, 1.9]]) {
        g.fillStyle = c.edificio; g.fillRect(X(x), Y(SUELO - al), an * v.K, al * v.K);
        for (let fy = 0; fy < Math.floor(al / 0.4); fy++) for (let fx = 0; fx < 2; fx++) { const on = azar(x * 10 + fy * 3 + fx) < 0.7 * luz + (luz < 1 ? 0 : 0.2); g.fillStyle = on ? c.ventana : c.apagada; g.fillRect(X(x + 0.12 + fx * (an - 0.3) / 1.5), Y(SUELO - al + 0.2 + fy * 0.4), 0.16 * v.K, 0.2 * v.K); }
      }
    }
    function torre(x) {
      g.strokeStyle = c.torre; g.lineWidth = Math.max(1.2, 0.035 * v.K);
      const b = 0.55, top = ALTO - 0.4;
      g.beginPath(); g.moveTo(X(x - b), Y(SUELO)); g.lineTo(X(x - 0.12), Y(top)); g.lineTo(X(x + 0.12), Y(top)); g.lineTo(X(x + b), Y(SUELO));
      for (let j = 0; j < 6; j++) { const y1 = SUELO - (j / 6) * (SUELO - top), y2 = SUELO - ((j + 1) / 6) * (SUELO - top), a1 = b - (b - 0.12) * (j / 6), a2 = b - (b - 0.12) * ((j + 1) / 6); g.moveTo(X(x - a1), Y(y1)); g.lineTo(X(x + a2), Y(y2)); g.moveTo(X(x + a1), Y(y1)); g.lineTo(X(x - a2), Y(y2)); }
      for (const k of [0, 1]) { const y = ALTO + 0.5 * k - 0.25; g.moveTo(X(x - 0.7), Y(y)); g.lineTo(X(x + 0.7), Y(y)); }
      g.stroke();
      // aisladores colgando de los brazos
      g.strokeStyle = c.aislador; g.lineWidth = Math.max(2, 0.07 * v.K);
      for (const k of [0, 1]) for (const s of [-1, 1]) { if (s > 0) continue; g.beginPath(); g.moveTo(X(x), Y(ALTO + 0.5 * k - 0.25)); g.lineTo(X(x), Y(ALTO + 0.5 * k)); g.stroke(); }
    }
    function cables() {
      for (const k of [0, 1]) {
        g.strokeStyle = c.cable; g.lineWidth = Math.max(1.4, 0.035 * v.K); g.beginPath();
        for (let x = SUBE + 0.3; x <= BAJA - 0.3 + 1e-9; x += 0.05) x === SUBE + 0.3 ? g.moveTo(X(x), Y(cableY(x, k))) : g.lineTo(X(x), Y(cableY(x, k)));
        g.stroke();
        if (calor > 0.01) { g.save(); g.strokeStyle = rgba(c.caliente, calor); g.lineWidth = Math.max(2, 0.09 * v.K * calor + 0.03 * v.K); g.shadowColor = c.caliente; g.shadowBlur = 14 * calor; g.stroke(); g.restore(); }
        // las cargas que avanzan: más juntas y deprisa cuanta más corriente
        const n = Math.round(6 + 34 * Math.min(1, Math.log10(I) / 4.6)), vel = 0.02 + 0.12 * Math.min(1, Math.log10(I) / 4.6), dir = k ? -1 : 1;
        for (let j = 0; j < n; j++) { let s = ((quieto ? 0.2 : r * vel * dir) + j / n) % 1; if (s < 0) s += 1; const x = SUBE + 0.3 + s * (BAJA - SUBE - 0.6); punto(x, cableY(x, k), 0.045, c.carga, 0.9); }
      }
      // humo y chispas si los cables se queman (paso 3)
      if (calor > 0.5 && !quieto) for (let j = 0; j < 10; j++) { const s = (r * 0.4 + azar(j + 70)) % 1, x = SUBE + 1 + azar(j + 80) * (BAJA - SUBE - 2); punto(x + 0.2 * s, cableY(x, j % 2) - 0.8 * s, 0.08 + 0.15 * s, c.humo, 0.5 * (1 - s)); }
    }
    // paso 2: el cable de cerca, con los electrones que chocan con los átomos y lo calientan
    function zoomCable() {
      const x0 = 5.3, x1 = 6.8;
      for (let j = 0; j < 14; j++) { const s = ((quieto ? 0.3 : r * 0.3) + j / 14) % 1, x = x0 + s * (x1 - x0); punto(x, cableY(x, 0) + 0.015 * Math.sin(j * 5 + r * 9), 0.025, c.carga); }
      for (let j = 0; j < 6; j++) { const x = x0 + 0.1 + j * 0.27, y = cableY(x, 0) - 0.12, s = quieto ? 0.5 : (r * 0.7 + j * 0.3) % 1; g.strokeStyle = rgba(c.caliente, 0.7 * (1 - s)); g.lineWidth = Math.max(1, 0.012 * v.K); g.beginPath(); g.moveTo(X(x), Y(y - 0.25 * s)); g.quadraticCurveTo(X(x + 0.04), Y(y - 0.25 * s - 0.05), X(x), Y(y - 0.25 * s - 0.1)); g.stroke(); }
    }
    // paso 5: el transformador de la central, por dentro
    function bobinas() {
      const cx = 3.0, cy = 4.5, a = suave(tramo(t, 0, 0.3));
      g.globalAlpha = a; v.panel(cx - 1.25, cy - 0.75, 2.5, 1.65); g.globalAlpha = 1;
      if (a <= 0) return;
      g.strokeStyle = rgba(c.hierro, a); g.lineWidth = 0.14 * v.K; g.strokeRect(X(cx - 0.75), Y(cy - 0.45), 1.5 * v.K, 0.95 * v.K);
      const fase = quieto ? 0 : r * 2 * Math.PI * 0.5;
      g.lineWidth = Math.max(1.5, 0.03 * v.K);
      for (let j = 0; j < 4; j++) { g.strokeStyle = rgba(c.primario, a); g.beginPath(); g.ellipse(X(cx - 0.75), Y(cy - 0.25 + j * 0.17), 0.16 * v.K, 0.05 * v.K, 0, 0, 2 * Math.PI); g.stroke(); }
      for (let j = 0; j < 12; j++) { g.strokeStyle = rgba(c.secundario, a); g.beginPath(); g.ellipse(X(cx + 0.75), Y(cy - 0.38 + j * 0.068), 0.16 * v.K, 0.03 * v.K, 0, 0, 2 * Math.PI); g.stroke(); }
      // el flujo que da vueltas por el núcleo
      for (let j = 0; j < 8; j++) { const s = ((fase / (2 * Math.PI)) * 0.4 + j / 8) % 1, per = 2 * (1.5 + 0.95), d = s * per; let x, y; if (d < 1.5) { x = cx - 0.75 + d; y = cy - 0.45; } else if (d < 2.45) { x = cx + 0.75; y = cy - 0.45 + (d - 1.5); } else if (d < 3.95) { x = cx + 0.75 - (d - 2.45); y = cy + 0.5; } else { x = cx - 0.75; y = cy + 0.5 - (d - 3.95); } punto(x, y, 0.035, c.flujo, a * Math.abs(Math.sin(fase))); }
    }
    function rotulos() {
      if (paso === 0) {
        rotulo('central', 1.4, SUELO + 0.4, { al: 'center', tam: 12, escribe: tramo(t, 0.05, 0.25) });
        rotulo('ciudad: 10 MW', 14.5, SUELO + 0.4, { al: 'center', peso: 700, escribe: tramo(t, 0.25, 0.5) });
        rotulo('50 km', 7.5, 6.1, { al: 'center', peso: 700, escribe: tramo(t, 0.5, 0.7) });
      }
      if (paso === 1) {
        rotulo('R = ρL/S = 2,5 Ω', 6.05, 2.75, { al: 'center', peso: 700, tam: 13, escribe: tramo(t, 0.2, 0.5) });
        rotulo('Pₚ = I²R: el cable se calienta', 6.05, 5.1, { al: 'center', tam: 12.5, color: c.resalta, escribe: tramo(t, 0.5, 0.8) });
      }
      if (paso === 2) rotulo('¡los cables se funden!', 7.5, 6.1, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.4, 0.7) });
      if (paso === 3) rotulo('cables fríos: casi toda la potencia llega', 7.5, 6.1, { al: 'center', peso: 600, escribe: tramo(t, 0.4, 0.75) });
      if (paso === 4) {
        rotulo('N₁ vueltas', 2.25, 5.25, { al: 'center', tam: 11.5, color: c.primario, escribe: tramo(t, 0.3, 0.5) });
        rotulo('N₂ = 20 N₁', 3.75, 5.25, { al: 'center', tam: 11.5, color: c.secundario, escribe: tramo(t, 0.4, 0.6) });
        rotulo('20 kV → 400 kV', 3.0, 3.55, { al: 'center', peso: 700, tam: 12.5, escribe: tramo(t, 0.55, 0.8) });
      }
      if (paso === 5) {
        rotulo('20 kV → 400 kV', SUBE, SUELO + 0.45, { al: 'center', tam: 12, escribe: tramo(t, 0.05, 0.3) });
        rotulo('transporte: 400 kV', 9.5, 2.3, { al: 'center', peso: 700, escribe: tramo(t, 0.3, 0.55) });
        rotulo('400 kV → 20 kV → 230 V', BAJA + 1.4, SUELO + 0.45, { al: 'center', tam: 12, escribe: tramo(t, 0.55, 0.85) });
      }
    }
    // tensión, corriente y pérdidas, fijo arriba a la izquierda
    function panel() {
      v.pantalla();
      const x0 = 0.3, y0 = 0.3, an = 5.4, al = 1.75, pp = (100 * perdidas(V)) / P;
      v.panel(x0, y0, an, al);
      rotulo(`Tensión: ${V >= 1e3 ? `${m(V / 1e3, 0)} kV` : `${m(V, 0)} V`}`, x0 + 0.25, y0 + 0.3, { peso: 700, tam: 12.5, fondo: false });
      rotulo(`Corriente: ${m(I, 0)} A`, x0 + 0.25, y0 + 0.65, { tam: 12, fondo: false });
      rotulo(`Pérdidas: ${pot(perdidas(V))} (${pp > 100 ? 'más del 100' : pc(pp)} %)`, x0 + 0.25, y0 + 1.0, { tam: 12, fondo: false, color: pp > 5 ? c.resalta : c.rotulo });
      g.fillStyle = rgba(c.rotulo, 0.15); g.fillRect(X(x0 + 0.25), Y(y0 + 1.3), (an - 0.5) * v.K, 0.2 * v.K);
      g.fillStyle = pp > 5 ? c.resalta : c.bien; g.fillRect(X(x0 + 0.25), Y(y0 + 1.3), Math.max(0.03, (an - 0.5) * Math.min(1, pp / 100)) * v.K, 0.2 * v.K);
    }
  }

  /* ---------------- sonido (opcional, apagado al abrir) ---------------- */
  // el zumbido de 100 Hz de los transformadores (dos veces la frecuencia de la red), más fuerte de cerca, y chisporroteo si se queman los cables
  function sonido(ac) {
    const os = ac.createOscillator(), os2 = ac.createOscillator(), vol = ac.createGain();
    os.type = 'sawtooth'; os.frequency.value = 100; os2.type = 'sine'; os2.frequency.value = 200; vol.gain.value = 0;
    const fil = ac.createBiquadFilter(); fil.type = 'lowpass'; fil.frequency.value = 600;
    os.connect(fil); os2.connect(fil); fil.connect(vol).connect(ac.destination); os.start(); os2.start();
    const ruido = ac.createBuffer(1, ac.sampleRate * 0.02, ac.sampleRate), d = ruido.getChannelData(0);
    for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ac.sampleRate * 0.002));
    let antes = null;
    return {
      cuadro({ paso, reloj }) {
        vol.gain.setTargetAtTime(paso === 4 ? 0.12 : 0.03, ac.currentTime, 0.1);
        const dt = antes === null ? 0 : Math.min(0.1, reloj - antes); antes = reloj;
        if (paso === 2 && Math.random() < 12 * dt) { const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = ruido; g.gain.value = 0.4; s.connect(g).connect(ac.destination); s.start(); }
      },
    };
  }

  const COLORES = ['cielo', 'cielo-alto', 'monte', 'cesped', 'hormigon', 'vapor', 'edificio', 'ventana', 'apagada', 'trafo', 'aislador', 'valla', 'torre', 'cable', 'caliente', 'carga', 'humo', 'hierro', 'primario', 'secundario', 'flujo', 'bien', 'resalta', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, sonido, COLORES, ejercicio, abrirEnCircuitos, perdidas, corriente };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: TransporteAltaTension.pasos, dibuja: TransporteAltaTension.dibuja, colores: TransporteAltaTension.COLORES, sonido: TransporteAltaTension.sonido });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); TransporteAltaTension.abrirEnCircuitos(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = TransporteAltaTension;
