/* =====================================================================
   La lluvia ácida y el pH del mar: los 6 pasos de la animación (texto y
   dibujo), el sonido de las gotas y el ejercicio que se abre en pH y
   valoraciones (la lluvia limpia como disolución de ácido carbónico, un
   ácido débil). El motor es fenomenos/animacion.js, los ayudantes de dibujo
   fenomenos/dibujo.js y la maqueta pagina.html. En Node (pruebas) solo se
   cargan los datos: pruebas/herramientas/fenomenos/lluvia-acida.js.
   ===================================================================== */
const LluviaAcida = (() => {
  // modelo: CO₂ disuelto 1,4·10⁻⁵ M (420 ppm) con Ka₁ = 4,3·10⁻⁷; lluvia ácida con 30 µmol/L de H₂SO₄;
  // lago sobre caliza con HCO₃⁻ 10⁻³ M y H₂CO₃ 10⁻⁴ M al que llegan 6·10⁻⁶ mol/L de H⁺; mar de pH 8,2 a 8,1
  const KA = 4.3e-7, CO2 = 1.4e-5, KW = 1e-14, SULF = 30, HCO3 = 1e-3, H2CO3 = 1e-4, HLAGO = 6e-6;
  // [H⁺] de la lluvia con c mol/L de H₂SO₄ (dos H⁺ cada uno) y el CO₂ disuelto: h = 2c + Ka·C/(h + Ka) + Kw/h, por bisección
  const hDe = (c) => { let a = -9, b = -1; for (let j = 0; j < 80; j++) { const m = (a + b) / 2, h = 10 ** m; if (h - 2 * c - (KA * CO2) / (h + KA) - KW / h > 0) b = m; else a = m; } return 10 ** ((a + b) / 2); };
  const pHDe = (umol) => -Math.log10(hDe(umol * 1e-6));
  const pKa = -Math.log10(KA);
  const datos = { KA, CO2, pKa, h0: hDe(0), ph0: pHDe(0), sulf: SULF, phAcida: pHDe(SULF),
    lagoAntes: pKa + Math.log10(HCO3 / H2CO3), lagoDespues: pKa + Math.log10((HCO3 - HLAGO) / (H2CO3 + HLAGO)), aguaPura: -Math.log10(HLAGO + 1e-7),
    marAntes: 8.2, marAhora: 8.1, masH: 10 ** 0.1 - 1 };
  datos.veces = 10 ** (datos.ph0 - datos.phAcida);
  const f2 = (x) => x.toFixed(2).replace('.', ','), f1 = (x) => x.toFixed(1).replace('.', ',');

  const pasos = [
    { titulo: 'La lluvia limpia ya es ácida', corto: 'Lluvia', dato: { valor: 'pH 5,6', texto: 'tiene el agua de lluvia sin contaminar, por el CO₂ del aire.' }, texto: `El agua pura tiene pH 7, pero la lluvia nunca es agua pura: al caer disuelve el CO₂ del aire, que forma ácido carbónico, un ácido débil: $CO_2 + H_2O ⇌ H_2CO_3 ⇌ H^+ + HCO_3^−$.\n\nCon 420 ppm de CO₂ se disuelven $1,4·10^{−5} "mol/L"$, y con $K_a = 4,3·10^{−7}$ el ácido se disocia poco: resolviendo el equilibrio, $[H^+] = ${f2(datos.h0 * 1e6)}·10^{−6} "M"$ y $pH = ${f2(datos.ph0)}$. Eso es lo normal: solo se llama lluvia ácida a la que baja de 5,6.` },
    { titulo: 'Humo con azufre y nitrógeno', corto: 'Humos', dato: { valor: 'SO₂ y NOₓ', texto: 'son los gases que la vuelven ácida de verdad.' }, texto: 'El carbón y el gasóleo llevan algo de azufre, que al quemarse da dióxido de azufre: $S + O_2 → SO_2$. Y en los motores y las centrales, a tanta temperatura, el nitrógeno del aire reacciona con el oxígeno y forma óxidos de nitrógeno, los NOₓ.\n\nLas chimeneas altas los llevan lejos: la lluvia ácida suele caer a cientos de kilómetros de donde se emitió, a veces en otro país.' },
    { titulo: 'En las nubes se vuelven ácidos fuertes', corto: 'Nubes', dato: { valor: `pH ${f1(datos.phAcida)}`, texto: `tiene una lluvia con ${SULF} µmol/L de ácido sulfúrico.` }, texto: `En el aire, con el oxígeno, la luz y las gotas de las nubes, el SO₂ acaba en ácido sulfúrico, $SO_2 + 1/2 O_2 + H_2O → H_2SO_4$, y los NOₓ en ácido nítrico, $HNO_3$. Los dos son ácidos fuertes: se disocian del todo.\n\nCon solo ${SULF} µmol/L de $H_2SO_4$, que da dos $H^+$ cada uno, $[H^+] ≈ 2 · 3·10^{−5} = 6·10^{−5} "M"$ y el pH baja a ${f2(datos.phAcida)}. Ahora el ácido carbónico ya no cuenta: el ácido fuerte manda.`, dura: 11000 },
    { titulo: 'Bosques, lagos y estatuas', corto: 'Daños', dato: { valor: `${Math.round(datos.veces)} veces`, texto: 'más H⁺ que la lluvia limpia: el pH es logarítmico.' }, texto: `De pH ${f1(datos.ph0)} a ${f1(datos.phAcida)} parece poca diferencia, pero cada unidad de pH es multiplicar por 10 los $H^+$: $10^{${f2(datos.ph0)} − ${f2(datos.phAcida)}} ≈ ${Math.round(datos.veces)}$.\n\nLa lluvia ácida arrastra los nutrientes del suelo y daña las hojas de los abetos; en los lagos, por debajo de pH 5, mueren las truchas y sus huevos. Y disuelve el mármol y la caliza de las estatuas y las catedrales: $CaCO_3 + H_2SO_4 → CaSO_4 + CO_2 + H_2O$.` },
    { titulo: 'Los lagos con caliza aguantan: un tampón', corto: 'Tampón', dato: { valor: `pH ${f2(datos.lagoAntes)} → ${f2(datos.lagoDespues)}`, texto: 'en un lago sobre caliza, con la misma lluvia que dejaría el agua pura en 5,2.' }, texto: `Un lago sobre roca caliza tiene bicarbonato disuelto, que se come los $H^+$ que llegan: $HCO_3^− + H^+ → H_2CO_3$. Con su ácido carbónico forma una disolución reguladora, y su pH sale de Henderson-Hasselbalch: $pH = pK_a + log([HCO_3^−]/[H_2CO_3]) = 6,37 + log(10^{−3}/10^{−4}) = ${f2(datos.lagoAntes)}$.\n\nSi le llegan $6·10^{−6} "mol/L"$ de $H^+$, el cociente pasa a $(10^{−3} − 6·10^{−6})/(10^{−4} + 6·10^{−6})$ y el pH apenas baja, a ${f2(datos.lagoDespues)}. En un lago sobre granito, sin tampón, el mismo ácido lo dejaría en ${f1(datos.aguaPura)}. Por eso Escandinavia sufrió tanto: casi todo es granito.`, dura: 11000 },
    { titulo: 'El mar también se acidifica', corto: 'Mar', dato: { valor: `+${Math.round(100 * datos.masH)} % de H⁺`, texto: 'en el mar desde 1850: su pH ha bajado de 8,2 a 8,1.' }, texto: `El mar absorbe una cuarta parte del CO₂ que emitimos. Al disolverse forma ácido carbónico, y el pH del mar, que es básico, ha bajado de 8,2 a 8,1: parece poco, pero son un $10^{0,1} − 1 = ${Math.round(100 * datos.masH)} %$ más de $H^+$.\n\nEl mar está tamponado por el bicarbonato y el carbonato, y para frenar el cambio gasta carbonato: $CO_3^{2−} + H^+ → HCO_3^−$. Ese carbonato es el que usan los corales, las almejas y el plancton para hacer su concha. La buena noticia: el SO₂ en Europa ha bajado más del 90 % desde 1980 con filtros en las chimeneas y gasóleo sin azufre.`, dura: 11000 },
  ];

  // ejercicio de pH y valoraciones (formato de ph-v1): la lluvia limpia, ácido débil 1,4·10⁻⁵ M con Ka = 4,3·10⁻⁷
  const ejercicio = () => ({ modo: 'debil', especie: 'acido', C: '1.4e-5', K: '4.3e-7', pK: '' });
  function abrirEnPH(destino) {
    try { localStorage.setItem('ph-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const SUELO = 6.2, LAGO = [8.4, 11.3], MAR = 12.4, NUBE = 2.0, cam = { x: 8, y: 4.5, z: 1 };
  const CAMS = [{ x: 8.6, y: 4.4, z: 1.1 }, { x: 4.6, y: 4.2, z: 1.25 }, { x: 8.4, y: 3.4, z: 1.2 }, { x: 7.8, y: 4.9, z: 1.3 }, { x: 9.8, y: 5.5, z: 1.6 }, { x: 13, y: 5.4, z: 1.35 }];
  // «Pruébalo tú» del paso 3: ácido sulfúrico en la lluvia
  const prueba = { etiqueta: 'el ácido sulfúrico de la lluvia', min: 0, max: 100, paso: 1, valor: SULF, umol: SULF,
    muestra: (u) => `${u} µmol/L de H₂SO₄ → pH ${f2(pHDe(u))}`, cambia: (u) => { prueba.umol = u; } };
  pasos[2].prueba = prueba;
  // pH que marca el medidor en cada paso (t va de 0 a 1 durante el movimiento)
  const medida = (paso, t) => (paso <= 1 ? ['pH de la lluvia', datos.ph0] : paso === 2 ? ['pH de la lluvia', pHDe(prueba.umol)] : paso === 3 ? ['pH de la lluvia', datos.phAcida]
    : paso === 4 ? ['pH del lago', datos.lagoAntes + (datos.lagoDespues - datos.lagoAntes) * suave(tramo(t, 0.3, 0.9))] : ['pH del mar', 8.2 - 0.1 * suave(tramo(t, 0.2, 0.9))]);

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(CAMS[paso], reloj, quieto);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto, r = quieto ? 1.3 : reloj;
    const acida = paso >= 2 && paso <= 4, llueve = paso !== 1 && paso !== 5;

    fondo(); fabrica(); coche(); estatua(); arboles(); lago(); mar(); nubes();
    if (llueve) lluvia();
    if (paso === 1 || paso === 2) humo();
    rotulos();
    if (!foto) medidor();

    function fondo() {
      const gr = g.createLinearGradient(0, 0, 0, Y(SUELO)); gr.addColorStop(0, acida ? c['cielo-gris'] : c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, Y(SUELO));
      // montes al fondo
      g.fillStyle = c.monte; g.beginPath(); g.moveTo(X(-2), Y(SUELO));
      for (let x = -2; x <= 18; x += 0.5) g.lineTo(X(x), Y(SUELO - 1.1 - 0.7 * Math.sin(x * 0.55) - 0.3 * Math.sin(x * 1.7)));
      g.lineTo(X(18), Y(SUELO)); g.fill();
      g.fillStyle = c.tierra; g.fillRect(0, Y(SUELO), w, h - Y(SUELO));
      g.fillStyle = c.cesped; g.fillRect(0, Y(SUELO), w, 0.18 * v.K);
      // la caliza bajo el lago (paso 5)
      if (paso === 4) { g.fillStyle = c.caliza; g.beginPath(); g.moveTo(X(LAGO[0] - 1.2), Y(SUELO + 0.3)); g.quadraticCurveTo(X((LAGO[0] + LAGO[1]) / 2), Y(SUELO + 2.4), X(LAGO[1] + 1.0), Y(SUELO + 0.3)); g.lineTo(X(LAGO[1] + 0.4), Y(SUELO + 2.4)); g.lineTo(X(LAGO[0] - 0.6), Y(SUELO + 2.4)); g.fill(); }
    }
    function fabrica() {
      g.fillStyle = c.edificio; g.fillRect(X(0.4), Y(SUELO - 1.4), 2.0 * v.K, 1.4 * v.K);
      g.beginPath(); g.moveTo(X(0.4), Y(SUELO - 1.4)); for (let j = 0; j < 3; j++) { g.lineTo(X(0.4 + j * 0.67), Y(SUELO - 1.9)); g.lineTo(X(0.4 + (j + 1) * 0.67), Y(SUELO - 1.4)); } g.fill();
      g.fillStyle = c.chimenea; g.fillRect(X(1.95), Y(2.9), 0.36 * v.K, (SUELO - 1.4 - 2.9) * v.K);
      g.fillStyle = c.resalta; g.fillRect(X(1.95), Y(3.1), 0.36 * v.K, 0.12 * v.K);
      g.fillStyle = c.ventana; for (let j = 0; j < 3; j++) g.fillRect(X(0.6 + j * 0.6), Y(SUELO - 0.9), 0.3 * v.K, 0.35 * v.K);
    }
    function coche() {
      const x = 3.3 + (quieto ? 0.5 : (r * 0.35) % 2.2), y = SUELO - 0.12;
      g.fillStyle = c.asfalto; g.fillRect(X(2.6), Y(SUELO - 0.02), 3.0 * v.K, 0.2 * v.K);
      g.fillStyle = c.coche; g.beginPath(); g.roundRect(X(x), Y(y - 0.28), 0.9 * v.K, 0.28 * v.K, 0.06 * v.K); g.fill();
      g.beginPath(); g.roundRect(X(x + 0.18), Y(y - 0.5), 0.5 * v.K, 0.24 * v.K, 0.08 * v.K); g.fill();
      for (const dx of [0.2, 0.7]) punto(x + dx, y, 0.1, c.rueda);
      if (paso === 1) for (let j = 0; j < 5; j++) { const s = ((quieto ? 0.4 : r * 0.8) + j * 0.2) % 1; punto(x - 0.15 - s * 0.9, y - 0.15 - s * 0.5, 0.05 + 0.08 * s, c.nox, 0.7 * (1 - s)); }
    }
    function estatua() {
      const x = 6.3, y = SUELO, d = paso === 3 ? suave(tramo(t, 0.2, 1)) : paso > 3 ? 1 : 0;
      g.fillStyle = c.marmol; g.fillRect(X(x - 0.4), Y(y - 0.45), 0.8 * v.K, 0.45 * v.K);
      g.beginPath(); g.moveTo(X(x - 0.25), Y(y - 0.45)); g.lineTo(X(x - 0.15), Y(y - 1.35)); g.lineTo(X(x + 0.15), Y(y - 1.35)); g.lineTo(X(x + 0.25), Y(y - 0.45)); g.fill();
      punto(x, y - 1.55, 0.18 * (1 - 0.15 * d), c.marmol);
      g.fillRect(X(x + 0.12), Y(y - 1.3), 0.32 * v.K, 0.09 * v.K);
      for (let j = 0; j < 14; j++) if (azar(j + 200) < d) punto(x - 0.3 + azar(j + 210) * 0.6, y - 1.6 + azar(j + 220) * 1.5, 0.03 + 0.03 * azar(j + 230), c.mancha, 0.8);
    }
    function arboles() {
      const malo = paso === 3 ? suave(tramo(t, 0.1, 0.8)) : paso > 3 ? 1 : 0;
      for (const [x, s] of [[7.2, 1], [7.75, 0.8], [11.9, 0.9]]) {
        g.fillStyle = c.tronco; g.fillRect(X(x - 0.06 * s), Y(SUELO - 0.5 * s), 0.12 * s * v.K, 0.5 * s * v.K);
        g.fillStyle = c.abeto; g.beginPath(); g.moveTo(X(x), Y(SUELO - 2.0 * s)); g.lineTo(X(x - 0.5 * s), Y(SUELO - 0.45 * s)); g.lineTo(X(x + 0.5 * s), Y(SUELO - 0.45 * s)); g.fill();
        if (malo > 0) { g.globalAlpha = 0.75 * malo; g.fillStyle = c.seco; g.beginPath(); g.moveTo(X(x), Y(SUELO - 2.0 * s)); g.lineTo(X(x - 0.28 * s), Y(SUELO - 1.15 * s)); g.lineTo(X(x + 0.28 * s), Y(SUELO - 1.15 * s)); g.fill(); g.globalAlpha = 1; }
      }
    }
    function lago() {
      const [a, b] = LAGO, m = (a + b) / 2;
      g.fillStyle = c.lago; g.beginPath(); g.moveTo(X(a), Y(SUELO)); g.quadraticCurveTo(X(m), Y(SUELO + 1.6), X(b), Y(SUELO)); g.fill();
      // el bicarbonato del lago atrapa los H⁺ que llegan (paso 5)
      if (paso === 4) for (let j = 0; j < 9; j++) {
        const x = a + 0.6 + azar(j + 300) * (b - a - 1.2), y = SUELO + 0.15 + azar(j + 310) * 0.45, s = quieto ? 1 : ((r * 0.5 + azar(j + 320)) % 1);
        punto(x, y, 0.07, c.bicarbonato);
        if (s < 0.6) punto(x + 0.25 * (1 - s / 0.6), y - 0.9 * (1 - s / 0.6), 0.045, c.acido); else punto(x + 0.08, y - 0.05, 0.045, c.acido, 1 - (s - 0.6) / 0.4);
      }
      // peces que se van con la lluvia ácida
      const peces = paso === 3 ? 1 - suave(tramo(t, 0.3, 0.9)) : paso > 3 ? 0 : 1;
      if (peces > 0.02 && paso !== 4) for (let j = 0; j < 2; j++) { const x = m - 0.6 + j * 1.0 + (quieto ? 0 : 0.25 * Math.sin(r * 0.8 + j * 2)), y = SUELO + 0.35 + 0.15 * j; g.globalAlpha = peces; g.fillStyle = c.pez; g.beginPath(); g.ellipse(X(x), Y(y), 0.2 * v.K, 0.08 * v.K, 0, 0, 2 * Math.PI); g.fill(); g.beginPath(); g.moveTo(X(x - 0.17), Y(y)); g.lineTo(X(x - 0.32), Y(y - 0.09)); g.lineTo(X(x - 0.32), Y(y + 0.09)); g.fill(); g.globalAlpha = 1; }
    }
    function mar() {
      g.fillStyle = c.arena; g.beginPath(); g.moveTo(X(MAR - 0.6), Y(SUELO)); g.lineTo(X(MAR + 0.8), Y(9.5)); g.lineTo(X(MAR - 0.6), Y(9.5)); g.fill();
      const gr = g.createLinearGradient(0, Y(SUELO), 0, Y(9.2)); gr.addColorStop(0, c.mar); gr.addColorStop(1, c['mar-hondo']);
      g.fillStyle = gr; g.beginPath(); g.moveTo(X(MAR - 0.5), Y(SUELO + 0.05));
      for (let x = MAR - 0.5; x <= 30; x += 0.25) g.lineTo(X(x), Y(SUELO + 0.05 + 0.05 * Math.sin(x * 3 + (quieto ? 0 : r * 1.5))));
      g.lineTo(X(30), Y(9.5)); g.lineTo(X(MAR + 0.8), Y(9.5)); g.closePath(); g.fill();
      // coral y conchas en el fondo; en el paso 6 pierden color
      const pal = paso === 5 ? suave(tramo(t, 0.3, 1)) : 0;
      g.strokeStyle = pal ? rgba(c.coral, 1 - 0.55 * pal) : c.coral; g.lineWidth = Math.max(2, 0.07 * v.K); g.lineCap = 'round';
      for (const x0 of [13.6, 14.9]) { g.beginPath(); for (const [dx, dy] of [[0, -0.6], [-0.25, -0.45], [0.25, -0.5]]) { g.moveTo(X(x0), Y(8.4)); g.lineTo(X(x0 + dx), Y(8.4 + dy)); } g.stroke(); }
      g.lineCap = 'butt';
      g.fillStyle = c.concha; g.beginPath(); g.ellipse(X(14.3), Y(8.35), 0.18 * v.K, 0.1 * v.K, 0, Math.PI, 2 * Math.PI); g.fill();
      if (paso === 5) {
        // el CO₂ del aire entra en el mar y suelta H⁺
        for (let j = 0; j < 6; j++) { const s = quieto ? 0.5 : ((r * 0.35 + j / 6) % 1), x = MAR + 0.8 + j * 0.6, y = 3.8 + 3.2 * s; punto(x, y, 0.07, c.co2); punto(x - 0.1, y, 0.05, c.oxigeno); punto(x + 0.1, y, 0.05, c.oxigeno); }
        const n = Math.round(6 + 10 * suave(tramo(t, 0.2, 0.9)));
        for (let j = 0; j < n; j++) punto(MAR + 0.6 + azar(j + 400) * 3.3, SUELO + 0.5 + azar(j + 410) * 1.5, 0.045, c.acido, 0.9);
      }
    }
    function nubes() {
      const sombra = acida ? c['nube-gris'] : c.nube;
      for (const [x, y, s] of [[7.4, NUBE - 0.4, 1], [9.6, NUBE - 0.2, 1.15], [11.6, NUBE - 0.5, 0.8], [5.4, NUBE - 0.7, 0.7]]) {
        const dx = quieto ? 0 : 0.15 * Math.sin(r * 0.2 + x);
        g.fillStyle = sombra; for (const [ax, ay, rr] of [[-0.7, 0.1, 0.5], [0, -0.2, 0.7], [0.7, 0.05, 0.55], [0.25, 0.25, 0.5], [-0.3, 0.3, 0.45]]) { g.beginPath(); g.arc(X(x + dx + ax * s), Y(y + ay * s), rr * s * v.K, 0, 2 * Math.PI); g.fill(); }
      }
    }
    function lluvia() {
      const col = acida ? c.acida : c.gota, n = 70;
      g.strokeStyle = col; g.lineWidth = Math.max(1.2, 0.03 * v.K);
      for (let j = 0; j < n; j++) {
        const x = 6.6 + azar(j) * 5.6, vel = 2.2 + azar(j + 50), s = ((quieto ? 0.37 : r * vel / 4.5) + azar(j + 100)) % 1, y = NUBE + 0.3 + s * (SUELO - NUBE - 0.3);
        g.globalAlpha = 0.75; g.beginPath(); g.moveTo(X(x), Y(y)); g.lineTo(X(x - 0.04), Y(y + 0.22)); g.stroke(); g.globalAlpha = 1;
      }
      // en el paso 1, el CO₂ entra en las gotas
      if (paso === 0) for (let j = 0; j < 8; j++) { const x = 6.8 + azar(j + 600) * 5, y = 3.3 + azar(j + 610) * 1.8; punto(x, y, 0.07, c.co2); punto(x - 0.1, y, 0.05, c.oxigeno); punto(x + 0.1, y, 0.05, c.oxigeno); }
    }
    function humo() {
      // SO₂ de la chimenea que sube hacia las nubes; en el paso 3 se vuelve gotitas ácidas dentro de ellas
      for (let j = 0; j < 22; j++) {
        const s = ((quieto ? 0.5 : r * 0.12) + j / 22) % 1, x = 2.13 + s * 6.5 + 0.3 * Math.sin(j * 1.7 + s * 4), y = 2.85 - 1.0 * Math.sin(Math.min(1, s * 1.6) * Math.PI / 2) + 0.15 * Math.sin(j);
        punto(x, y, 0.1 + 0.18 * s, rgba(paso === 2 && s > 0.6 ? c.acida : c.so2, 1), (paso === 2 ? 0.55 : 0.75) * (1 - 0.7 * s));
      }
    }
    function rotulos() {
      if (paso === 0) {
        rotulo('CO₂ + H₂O ⇌ H₂CO₃', 9.2, 3.1, { al: 'center', peso: 700, color: c.co2, escribe: tramo(t, 0.15, 0.45) });
        rotulo('lluvia: pH 5,6', 9.2, 5.3, { al: 'center', escribe: tramo(t, 0.5, 0.8) });
      }
      if (paso === 1) {
        rotulo('SO₂', 2.75, 2.4, { peso: 700, color: c.resalta, escribe: tramo(t, 0.1, 0.3) });
        rotulo('carbón y gasóleo con azufre', 0.4, 3.3, { tam: 12, escribe: tramo(t, 0.25, 0.5) });
        rotulo('NOₓ', 2.85, SUELO - 0.85, { peso: 700, color: c.resalta, escribe: tramo(t, 0.45, 0.65) });
      }
      if (paso === 2) {
        rotulo('SO₂ → H₂SO₄', 4.4, 1.0, { peso: 700, color: c.resalta, escribe: tramo(t, 0.1, 0.4) });
        rotulo('NOₓ → HNO₃', 4.4, 1.7, { peso: 700, color: c.resalta, escribe: tramo(t, 0.35, 0.65) });
        rotulo('ácidos fuertes: se disocian del todo', 9.6, 4.6, { al: 'center', escribe: tramo(t, 0.6, 0.9) });
      }
      if (paso === 3) {
        rotulo('el mármol se disuelve', 6.3, 3.9, { al: 'center', tam: 12, escribe: tramo(t, 0.2, 0.45) });
        rotulo('hojas dañadas', 7.4, 3.6, { tam: 12, escribe: tramo(t, 0.4, 0.6) });
        rotulo('pH < 5: los peces mueren', 9.85, 7.3, { al: 'center', tam: 12, escribe: tramo(t, 0.6, 0.85) });
      }
      if (paso === 4) {
        rotulo('HCO₃⁻ + H⁺ → H₂CO₃', 9.85, 3.6, { al: 'center', peso: 700, color: c.bicarbonato, escribe: tramo(t, 0.1, 0.4) });
        rotulo('roca caliza (CaCO₃)', 9.85, 7.9, { al: 'center', tam: 12, escribe: tramo(t, 0.4, 0.65) });
      }
      if (paso === 5) {
        rotulo('CO₂ del aire', 14.2, 3.6, { al: 'center', peso: 700, color: c.co2, escribe: tramo(t, 0.1, 0.35) });
        rotulo('CO₃²⁻ + H⁺ → HCO₃⁻', 14.3, 6.75, { al: 'center', peso: 700, color: c.resalta, escribe: tramo(t, 0.45, 0.75) });
        rotulo('corales y conchas', 15.2, 7.75, { tam: 12, escribe: tramo(t, 0.6, 0.85) });
      }
    }
    // medidor de pH fijo arriba a la derecha: escala de colores del indicador universal y la aguja
    function medidor() {
      v.pantalla();
      const [nom, ph] = medida(paso, t), x0 = 11.0, y0 = 0.3, an = 4.7, al = 1.45, a = 0.35, b = x0 + an - 0.35, xp = (p) => a + x0 + (p / 14) * (b - x0 - a);
      v.panel(x0, y0, an, al);
      const gr = g.createLinearGradient(X(xp(0)), 0, X(xp(14)), 0);
      ['ph-0', 'ph-4', 'ph-7', 'ph-10', 'ph-14'].forEach((k, j) => gr.addColorStop([0, 4, 7, 10, 14][j] / 14, c[k]));
      g.fillStyle = gr; g.fillRect(X(xp(0)), Y(y0 + 0.75), (xp(14) - xp(0)) * v.K, 0.25 * v.K);
      g.fillStyle = c.rotulo; g.beginPath(); g.moveTo(X(xp(ph)), Y(y0 + 0.72)); g.lineTo(X(xp(ph) - 0.12), Y(y0 + 0.55)); g.lineTo(X(xp(ph) + 0.12), Y(y0 + 0.55)); g.fill();
      rotulo(`${nom}: ${f2(ph)}`, x0 + 0.3, y0 + 0.32, { peso: 700, tam: 12.5, fondo: false });
      for (const p of [0, 7, 14]) rotulo(String(p), xp(p), y0 + 1.2, { al: 'center', tam: 10.5, fondo: false });
    }
  }

  /* ---------------- sonido (opcional, apagado al abrir) ---------------- */
  // gotas sueltas: ruido corto filtrado, solo en los pasos con lluvia
  function sonido(ac) {
    const ruido = ac.createBuffer(1, ac.sampleRate * 0.03, ac.sampleRate), d = ruido.getChannelData(0);
    for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ac.sampleRate * 0.004));
    let antes = null;
    return {
      cuadro({ paso, reloj }) {
        const dt = antes === null ? 0 : Math.min(0.1, reloj - antes); antes = reloj;
        const ritmo = paso === 1 ? 0 : paso === 5 ? 3 : 18;
        for (let k = 0; k < 2; k++) if (Math.random() < (ritmo / 2) * dt) {
          const s = ac.createBufferSource(), fil = ac.createBiquadFilter(), vol = ac.createGain();
          s.buffer = ruido; fil.type = 'bandpass'; fil.frequency.value = 1500 + Math.random() * 3000; fil.Q.value = 3; vol.gain.value = 0.25 + 0.25 * Math.random();
          s.connect(fil).connect(vol).connect(ac.destination); s.start();
        }
      },
    };
  }

  const COLORES = ['cielo', 'cielo-alto', 'cielo-gris', 'monte', 'tierra', 'cesped', 'caliza', 'edificio', 'chimenea', 'ventana', 'asfalto', 'coche', 'rueda', 'marmol', 'mancha', 'tronco', 'abeto', 'seco', 'lago', 'pez', 'arena', 'mar', 'mar-hondo', 'coral', 'concha',
    'nube', 'nube-gris', 'gota', 'acida', 'so2', 'nox', 'co2', 'oxigeno', 'acido', 'bicarbonato', 'resalta', 'rotulo', 'panel', 'ph-0', 'ph-4', 'ph-7', 'ph-10', 'ph-14'];
  return { datos, pasos, dibuja, sonido, COLORES, ejercicio, abrirEnPH, pHDe };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: LluviaAcida.pasos, dibuja: LluviaAcida.dibuja, colores: LluviaAcida.COLORES, sonido: LluviaAcida.sonido });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); LluviaAcida.abrirEnPH(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = LluviaAcida;
