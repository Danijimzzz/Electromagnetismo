/* =====================================================================
   La rejilla del microondas: los 6 pasos de la animación (texto y dibujo),
   el zumbido del horno y el ejercicio que se abre en Ondas
   electromagnéticas (la onda de 2,45 GHz que se refleja en la pared de
   metal y forma una onda estacionaria). El motor es fenomenos/animacion.js,
   los ayudantes de dibujo fenomenos/dibujo.js y la maqueta pagina.html. En
   Node (pruebas) solo se cargan los datos:
   pruebas/herramientas/fenomenos/microondas.js.
   ===================================================================== */
const Microondas = (() => {
  // modelo: 2,45 GHz, c = 3·10⁸ m/s; agujeros de la rejilla de 1 mm; fuga máxima 5 mW/cm² a 5 cm; Sol 1361 W/m²
  const F = 2.45e9, C = 2.998e8, H = 6.626e-34, EV = 1.602e-19, AGUJERO = 1e-3, FUGA = 5, SOL = 136.1;
  const lam = C / F, cDe = (dcm) => 2 * (dcm / 100) * F;
  const datos = { F, C, lam, medio: lam / 2, giros: F, foton: H * F, fotonEV: (H * F) / EV, cuantas: lam / AGUJERO, FUGA, SOL, solVeces: SOL / FUGA };
  const f1 = (x) => x.toFixed(1).replace('.', ','), f2 = (x) => x.toFixed(2).replace('.', ',');

  const pasos = [
    { titulo: 'El magnetrón lanza microondas', corto: 'Magnetrón', dato: { valor: `λ = ${f1(100 * lam)} cm`, texto: 'mide la onda de 2,45 GHz de un microondas.' }, texto: `Dentro del horno, al lado de la cavidad, hay un magnetrón: un tubo de vacío donde los electrones giran en un campo magnético y emiten una onda electromagnética de 2,45 GHz, que una guía de metal lleva a la cavidad.\n\nSu longitud de onda es $λ = c/f = 3·10^8/(2,45·10^9) = ${f2(lam)} "m"$, unos ${f1(100 * lam)} cm: mucho más larga que la luz y más corta que la radio. Es la misma banda que el wifi.` },
    { titulo: 'El agua gira y se calienta', corto: 'Agua', dato: { valor: '2450 millones', texto: 'de veces por segundo cambia de sentido el campo eléctrico.' }, texto: 'La molécula de agua es un dipolo: el oxígeno tira de los electrones y queda negativo, y los hidrógenos, positivos. El campo eléctrico de la onda la hace girar para alinearse, y como cambia de sentido miles de millones de veces por segundo, las moléculas no paran de girar y de chocar con sus vecinas.\n\nEse roce es calor. No es una resonancia del agua: es una pérdida, y por eso las microondas entran unos centímetros en la comida y no se quedan solo en la superficie. El plato, de cerámica o vidrio, casi no tiene moléculas que giren y no se calienta.' },
    { titulo: 'Las paredes la reflejan', corto: 'Estacionaria', dato: { valor: `λ/2 = ${f1(50 * lam)} cm`, texto: 'separa los nodos de la onda estacionaria: ahí no calienta.' }, texto: `Las paredes son de metal, un conductor: dentro, $E = 0$, y la onda se refleja entera con $r = −1$. La que va y la que vuelve se suman en una onda estacionaria, $E = 2E_0 sen(k x) sen(ω t)$, que no avanza: cada punto oscila en su sitio.\n\nHay nodos, donde $E$ es siempre 0 y no se calienta nada, cada $λ/2 = ${f1(50 * lam)} "cm"$, y entre ellos vientres, donde el campo es el doble. Por eso la comida se calienta a manchas.` },
    { titulo: 'Medir la velocidad de la luz con chocolate', corto: 'Chocolate', dato: { valor: 'c = 2 d f', texto: 'sale de la distancia d entre dos manchas derretidas.' }, texto: `El plato gira para que todo pase por los vientres. Pero si se quita y se mete una tableta de chocolate unos segundos, se derrite solo a manchas, en los vientres, separadas $d = λ/2$.\n\nMidiendo $d ≈ 6,1 "cm"$ y con la frecuencia de la etiqueta: $c = λ f = 2 d f = 2 · 0,061 · 2,45·10^9 ≈ 3·10^8 "m/s"$. Es la velocidad de la luz, medida en la cocina.`, dura: 11000 },
    { titulo: 'La rejilla: agujeros más pequeños que la onda', corto: 'Rejilla', dato: { valor: `${Math.round(datos.cuantas)} veces`, texto: 'más pequeños que la onda son los agujeros de 1 mm de la puerta.' }, texto: `La puerta lleva una chapa de metal con agujeros de 1 mm. Una onda no pasa por un agujero mucho más pequeño que su longitud de onda: las corrientes que induce en el metal de alrededor la reflejan, igual que en una pared lisa. Con λ = 12,2 cm, para las microondas la rejilla es una pared: la cavidad es una jaula de Faraday.\n\nLa luz, en cambio, tiene λ ≈ 0,0005 mm: los agujeros son enormes para ella y pasa sin problema. Por eso ves la comida pero las microondas se quedan dentro.` },
    { titulo: '¿Es peligroso?', corto: 'Seguridad', dato: { valor: '10⁻⁵ eV', texto: 'tiene un fotón de microondas: no rompe ninguna molécula.' }, texto: `La norma limita la fuga a 5 mW/cm² a 5 cm del horno, unas ${Math.round(datos.solVeces)} veces menos que la luz del Sol a mediodía (136 mW/cm²), y a un metro es cien veces menos. Si se abre la puerta, el magnetrón se apaga al momento.\n\nAdemás, las microondas no son ionizantes: cada fotón tiene $E = h f = 6,63·10^{−34} · 2,45·10^9 = 1,6·10^{−24} "J"$, unos $10^{−5} "eV"$, cien mil veces menos de lo que hace falta para romper un enlace. Calientan, como una estufa, pero no dejan la comida «radiactiva».`, dura: 11000 },
  ];

  // ejercicio de Ondas electromagnéticas (formato de ondasem-v1): la onda de 2,45 GHz que llega a una pared de metal
  const ejercicio = () => ({ modo: 'incidencia', destino: 'conductor', medio: 'vacio', dato: 'f', valor: '2,45e9', E0: '1000', er: '', mr: '', er2: '', mr2: '' });
  function abrirEnOndas(destino) {
    try { localStorage.setItem('ondasem-v1', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo (con los ayudantes de fenomenos/dibujo.js) ---------------- */
  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  // 1 unidad del dibujo = 5 cm: λ = 2,45 unidades; la cavidad mide 6 medias longitudes de onda
  const L = (100 * lam) / 5, CX0 = 2.4, CX1 = CX0 + 3 * L, CY0 = 2.0, CY1 = 7.0, MID = 4.3, PX = (CX0 + CX1) / 2, PY = 6.65, k = (2 * Math.PI) / L;
  const cam = { x: 8, y: 4.5, z: 1 };
  const CAMS = [{ x: 8, y: 4.5, z: 1 }, { x: PX, y: 5.3, z: 2.2 }, { x: 7, y: 4.5, z: 1.1 }, { x: PX, y: 5.6, z: 1.5 }, { x: 9.5, y: 4.6, z: 1 }, { x: 9.5, y: 4.6, z: 1 }];
  // «Pruébalo tú» del paso 4: distancia medida entre manchas
  const prueba = { etiqueta: 'la distancia entre dos manchas derretidas', min: 5, max: 7, paso: 0.1, valor: 6.1, d: 6.1,
    muestra: (d) => `d = ${f1(d)} cm → c = 2 d f = ${f2(cDe(d) / 1e8)}·10⁸ m/s`, cambia: (d) => { prueba.d = d; } };
  pasos[3].prueba = prueba;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(CAMS[paso], reloj, quieto);
    const { X, Y, rotulo, punto } = v, foto = window.FenomenoFoto, r = quieto ? 0.4 : reloj, ws = 2 * Math.PI * 0.45;
    const fase = Math.sin(ws * r);

    fondo(); horno();
    if (paso === 0) viaja();
    if (paso === 2 || paso === 4 || paso === 5) estacionaria(paso === 2 ? suave(tramo(t, 0.1, 0.5)) : 0.35);
    plato();
    if (paso === 1) agua();
    if (paso === 3) chocolate();
    rotulos();
    if (!foto && paso === 4) rejilla();
    if (!foto && paso === 5) barras();

    function fondo() {
      g.fillStyle = c.pared; g.fillRect(0, 0, w, h);
      g.fillStyle = c.encimera; g.fillRect(0, Y(7.9), w, h - Y(7.9));
      g.fillStyle = c['encimera-borde']; g.fillRect(0, Y(7.9), w, 0.12 * v.K);
    }
    function horno() {
      g.fillStyle = c.carcasa; g.beginPath(); g.roundRect(X(1.8), Y(1.4), 12.2 * v.K, 6.5 * v.K, 0.3 * v.K); g.fill();
      // la cavidad, con la luz de dentro
      const gr = g.createLinearGradient(0, Y(CY0), 0, Y(CY1)); gr.addColorStop(0, c['cavidad-luz']); gr.addColorStop(1, c.cavidad);
      g.fillStyle = gr; g.fillRect(X(CX0), Y(CY0), (CX1 - CX0) * v.K, (CY1 - CY0) * v.K);
      g.strokeStyle = c.metal; g.lineWidth = Math.max(2, 0.08 * v.K); g.strokeRect(X(CX0), Y(CY0), (CX1 - CX0) * v.K, (CY1 - CY0) * v.K);
      // panel de mandos y el magnetrón detrás
      g.fillStyle = c.mandos; g.fillRect(X(CX1 + 0.5), Y(CY0), (13.6 - CX1 - 0.5) * v.K, (CY1 - CY0) * v.K);
      const mx = (CX1 + 0.5 + 13.6) / 2;
      if (paso === 0) {
        g.fillStyle = c.magnetron; g.beginPath(); g.roundRect(X(mx - 0.7), Y(2.4), 1.4 * v.K, 1.1 * v.K, 0.12 * v.K); g.fill();
        for (let j = 0; j < 5; j++) { g.fillStyle = c.aleta; g.fillRect(X(mx - 0.6 + j * 0.27), Y(2.25), 0.12 * v.K, 0.15 * v.K); }
        g.fillStyle = c.metal; g.fillRect(X(CX1), Y(2.5), (mx - 0.7 - CX1) * v.K, 0.5 * v.K);
      } else {
        g.fillStyle = c.pantalla; g.fillRect(X(mx - 0.8), Y(2.4), 1.6 * v.K, 0.6 * v.K);
        if (!foto) rotulo(`0:${String(30 - (Math.floor(r) % 30)).padStart(2, '0')}`, mx, 2.7, { al: 'center', tam: 13, peso: 700, fondo: false, color: c.digito });
        for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) punto(mx - 0.55 + i * 0.55, 3.8 + j * 0.6, 0.17, c.boton);
      }
      g.fillStyle = c.boton; g.fillRect(X(mx - 0.8), Y(6.1), 1.6 * v.K, 0.5 * v.K);
    }
    // paso 1: la onda que sale del magnetrón y entra en la cavidad
    function viaja() {
      const a = suave(tramo(t, 0, 0.3)), x1 = CX1 + 1.5, x0 = CX0 + (CX1 - CX0) * (1 - suave(tramo(t, 0.1, 0.9)));
      g.strokeStyle = rgba(c.onda, a); g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath();
      for (let x = x1; x >= CX1; x -= 0.04) { const y = 2.75 - 0.18 * Math.sin(k * x + ws * r * 2.5); x === x1 ? g.moveTo(X(x), Y(y)) : g.lineTo(X(x), Y(y)); }
      g.stroke(); g.beginPath();
      for (let x = CX1; x >= x0; x -= 0.04) { const y = MID - 0.75 * Math.sin(k * x + ws * r * 2.5); x === CX1 ? g.moveTo(X(x), Y(y)) : g.lineTo(X(x), Y(y)); }
      g.stroke();
    }
    // la onda estacionaria entre las paredes, con su envolvente, nodos y vientres
    function estacionaria(a) {
      if (a <= 0) return;
      const A = 1.1;
      for (let j = 0; j < 6; j++) { const xv = CX0 + (j + 0.5) * (L / 2); g.fillStyle = rgba(c.caliente, 0.12 * a); g.fillRect(X(xv - L / 8), Y(CY0), (L / 4) * v.K, (CY1 - CY0) * v.K); }
      g.setLineDash([5, 4]); g.strokeStyle = rgba(c.onda, 0.55 * a); g.lineWidth = 1.2;
      for (const s of [1, -1]) { g.beginPath(); for (let x = CX0; x <= CX1 + 1e-9; x += 0.03) { const y = MID - s * A * Math.abs(Math.sin(k * (x - CX0))); x === CX0 ? g.moveTo(X(x), Y(y)) : g.lineTo(X(x), Y(y)); } g.stroke(); }
      g.setLineDash([]); g.strokeStyle = rgba(c.onda, a); g.lineWidth = Math.max(2, 0.05 * v.K); g.beginPath();
      for (let x = CX0; x <= CX1 + 1e-9; x += 0.03) { const y = MID - A * Math.sin(k * (x - CX0)) * fase; x === CX0 ? g.moveTo(X(x), Y(y)) : g.lineTo(X(x), Y(y)); }
      g.stroke();
      for (let j = 0; j <= 6; j++) punto(CX0 + j * (L / 2), MID, 0.07, c.nodo, a);
    }
    function plato() {
      g.fillStyle = c.plato; g.beginPath(); g.ellipse(X(PX), Y(PY), 2.5 * v.K, 0.28 * v.K, 0, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = c['plato-borde']; g.lineWidth = 1; g.stroke();
    }
    // paso 2: una taza y sus moléculas de agua que giran con el campo
    function agua() {
      g.fillStyle = c.taza; g.beginPath(); g.moveTo(X(PX - 0.55), Y(PY - 1.2)); g.lineTo(X(PX + 0.55), Y(PY - 1.2)); g.lineTo(X(PX + 0.45), Y(PY - 0.1)); g.lineTo(X(PX - 0.45), Y(PY - 0.1)); g.fill();
      g.strokeStyle = c.taza; g.lineWidth = Math.max(2, 0.07 * v.K); g.beginPath(); g.arc(X(PX + 0.62), Y(PY - 0.75), 0.22 * v.K, -Math.PI / 2, Math.PI / 2); g.stroke();
      g.fillStyle = c.agua; g.fillRect(X(PX - 0.5), Y(PY - 1.1), 1.0 * v.K, 0.12 * v.K);
      // la flecha del campo E, que cambia de sentido (más despacio que de verdad)
      const fE = Math.sin(2 * Math.PI * 0.6 * r);
      v.flecha(PX - 1.55, PY - 0.8, PX - 1.55 + 0.6 * fE, PY - 0.8, c.campo, 0.95, 0.03);
      rotulo('E', PX - 1.55, PY - 1.05, { al: 'center', peso: 700, color: c.campo, fondo: false, tam: 13 });
      // moléculas en una lupa encima de la taza
      const lx = PX + 0.1, ly = PY - 2.05;
      g.fillStyle = rgba(c.agua, 0.45); g.beginPath(); g.arc(X(lx), Y(ly), 0.8 * v.K, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = c.metal; g.lineWidth = Math.max(1.5, 0.03 * v.K); g.stroke();
      for (let j = 0; j < 7; j++) {
        const ang = j * 0.9, rr = j ? 0.5 : 0, x = lx + rr * Math.cos(ang), y = ly + rr * Math.sin(ang), giro = (azar(j) - 0.5) * 0.6 + (fE > 0 ? 0 : Math.PI) + 0.25 * Math.sin(r * 9 + j);
        // el oxígeno (−) mira hacia donde apunta −E y los hidrógenos (+) hacia E
        const dx = Math.cos(giro + Math.PI), dy = Math.sin(giro + Math.PI);
        for (const s of [-1, 1]) { const a2 = giro + s * 0.9; punto(x + 0.13 * Math.cos(a2), y + 0.13 * Math.sin(a2), 0.06, c.hidrogeno); }
        punto(x + 0.02 * dx, y + 0.02 * dy, 0.1, c.oxigeno);
      }
    }
    // paso 4: chocolate sin plato giratorio, derretido en los vientres
    function chocolate() {
      const x0 = PX - 2.0, x1 = PX + 2.0, y = PY - 0.3, d = prueba.d / 5;
      g.fillStyle = c.chocolate; g.fillRect(X(x0), Y(y - 0.18), (x1 - x0) * v.K, 0.22 * v.K);
      g.strokeStyle = rgba(c.rotulo, 0.15); g.lineWidth = 1; for (let x = x0 + 0.5; x < x1; x += 0.5) { g.beginPath(); g.moveTo(X(x), Y(y - 0.18)); g.lineTo(X(x), Y(y + 0.04)); g.stroke(); }
      const m = suave(tramo(t, 0.1, 0.7));
      const centros = [-1.5, -0.5, 0.5, 1.5].map((j) => PX + j * d).filter((x) => x > x0 && x < x1);
      for (const x of centros) { g.fillStyle = rgba(c.derretido, 0.9 * m); g.beginPath(); g.ellipse(X(x), Y(y - 0.1), 0.3 * v.K * (0.5 + 0.5 * m), 0.16 * v.K, 0, 0, 2 * Math.PI); g.fill(); punto(x, y + 0.07, 0.06 * m, c.derretido, 0.9 * m); }
      if (centros.length > 1 && !foto) {
        const [a, b] = [centros[1], centros[2]];
        g.strokeStyle = c.rotulo; g.lineWidth = 1.2; g.beginPath(); g.moveTo(X(a), Y(y - 0.5)); g.lineTo(X(b), Y(y - 0.5)); g.moveTo(X(a), Y(y - 0.6)); g.lineTo(X(a), Y(y - 0.4)); g.moveTo(X(b), Y(y - 0.6)); g.lineTo(X(b), Y(y - 0.4)); g.stroke();
        rotulo(`d = ${f1(prueba.d)} cm`, (a + b) / 2, y - 0.85, { al: 'center', peso: 700, tam: 12.5, escribe: tramo(t, 0.5, 0.8) });
      }
    }
    function rotulos() {
      const mx = (CX1 + 0.5 + 13.6) / 2;
      if (paso === 0) {
        rotulo('magnetrón: 2,45 GHz', mx, 1.05, { al: 'center', peso: 700, escribe: tramo(t, 0.05, 0.3) });
        rotulo(`λ = ${f1(100 * lam)} cm`, PX, 2.8, { al: 'center', peso: 700, color: c.onda, escribe: tramo(t, 0.5, 0.8) });
      }
      if (paso === 1) rotulo('el agua gira y roza: calor', PX + 1.0, PY - 2.9, { tam: 12.5, peso: 600, escribe: tramo(t, 0.4, 0.7) });
      if (paso === 2) {
        rotulo('nodo: E = 0', CX0 + L / 2, MID + 1.45, { al: 'center', tam: 12, escribe: tramo(t, 0.5, 0.7) });
        rotulo('vientre: 2E₀', CX0 + 1.25 * L, MID - 1.5, { al: 'center', tam: 12, color: c.caliente, escribe: tramo(t, 0.6, 0.8) });
        rotulo(`λ/2 = ${f1(50 * lam)} cm`, CX0 + 2.25 * L, MID + 1.45, { al: 'center', peso: 700, tam: 12, escribe: tramo(t, 0.75, 0.95) });
        rotulo('pared de metal: r = −1', CX0 + 0.15, CY0 + 0.4, { tam: 11.5, escribe: tramo(t, 0.2, 0.45) });
      }
      if (paso === 3) rotulo('sin plato giratorio', PX, PY - 1.5, { al: 'center', tam: 12, escribe: tramo(t, 0.05, 0.3) });
    }
    // paso 5: la rejilla de la puerta de cerca: la microonda rebota y la luz pasa
    function rejilla() {
      v.pantalla();
      const x0 = 9.3, y0 = 0.5, an = 6.3, al = 4.4, a = suave(tramo(t, 0, 0.3)), xm = x0 + an * 0.52;
      g.globalAlpha = a; v.panel(x0, y0, an, al); g.globalAlpha = 1;
      if (a <= 0) return;
      // la chapa con agujeros, de perfil
      g.fillStyle = rgba(c.metal, a); for (let y = y0 + 0.75; y < y0 + al - 0.35; y += 0.3) g.fillRect(X(xm - 0.06), Y(y), 0.12 * v.K, 0.2 * v.K);
      // microonda: llega desde la izquierda y vuelve
      const lw = 2.2, ph = ws * r * 1.5;
      g.lineWidth = Math.max(2, 0.04 * v.K);
      g.strokeStyle = rgba(c.onda, a); g.beginPath(); for (let x = x0 + 0.3; x <= xm - 0.1; x += 0.03) { const y = y0 + 1.6 - 0.45 * Math.sin((2 * Math.PI * x) / lw - ph); x === x0 + 0.3 ? g.moveTo(X(x), Y(y)) : g.lineTo(X(x), Y(y)); } g.stroke();
      g.strokeStyle = rgba(c.onda, 0.5 * a); g.setLineDash([5, 4]); g.beginPath(); for (let x = x0 + 0.3; x <= xm - 0.1; x += 0.03) { const y = y0 + 1.6 - 0.45 * Math.sin((2 * Math.PI * x) / lw + ph); x === x0 + 0.3 ? g.moveTo(X(x), Y(y)) : g.lineTo(X(x), Y(y)); } g.stroke(); g.setLineDash([]);
      // luz: pasa por los agujeros
      g.strokeStyle = rgba(c.luz, a); g.lineWidth = Math.max(1.5, 0.03 * v.K); g.beginPath(); for (let x = x0 + 0.3; x <= x0 + an - 0.3; x += 0.01) { const y = y0 + 3.15 - 0.08 * Math.sin((2 * Math.PI * x) / 0.12 - ph * 3); x === x0 + 0.3 ? g.moveTo(X(x), Y(y)) : g.lineTo(X(x), Y(y)); } g.stroke();
      rotulo('rejilla: agujeros de 1 mm', xm, y0 + 0.4, { al: 'center', tam: 11.5, peso: 700, fondo: false });
      rotulo('λ = 12 cm: rebota', x0 + 0.3, y0 + 2.45, { tam: 11.5, color: c.onda, fondo: false, escribe: tramo(t, 0.3, 0.55) });
      rotulo('luz, λ ≈ 0,0005 mm: pasa', x0 + an - 0.3, y0 + 3.75, { al: 'right', tam: 11.5, color: c.rotulo, fondo: false, escribe: tramo(t, 0.55, 0.8) });
    }
    // paso 6: la fuga máxima frente a la luz del Sol
    function barras() {
      v.pantalla();
      const x0 = 9.3, y0 = 0.5, an = 6.3, al = 2.6, a = suave(tramo(t, 0, 0.3)), ancho = an - 4.3;
      g.globalAlpha = a; v.panel(x0, y0, an, al); g.globalAlpha = 1;
      if (a <= 0) return;
      rotulo('intensidad, en mW/cm²', x0 + 0.25, y0 + 0.35, { tam: 11.5, peso: 700, fondo: false });
      for (const [j, nom, val, col] of [[0, 'Sol a mediodía', SOL, c.sol], [1, 'fuga máxima a 5 cm', FUGA, c.onda]]) {
        const y = y0 + 0.85 + j * 0.8;
        rotulo(nom, x0 + 0.25, y + 0.15, { tam: 11.5, fondo: false });
        g.fillStyle = col; g.globalAlpha = a; g.fillRect(X(x0 + 3.3), Y(y), Math.max(0.05, (ancho * val * suave(tramo(t, 0.2, 0.8))) / SOL) * v.K, 0.32 * v.K); g.globalAlpha = 1;
        rotulo(String(val).replace('.', ','), x0 + 3.35 + Math.max(0.05, (ancho * val) / SOL), y + 0.15, { tam: 11, fondo: false, escribe: tramo(t, 0.7, 0.9) });
      }
    }
  }

  /* ---------------- sonido (opcional, apagado al abrir) ---------------- */
  // el zumbido del horno (transformador a 100 Hz y ventilador) y un «ding» al final del último paso
  function sonido(ac) {
    const os = ac.createOscillator(), fil = ac.createBiquadFilter(), vol = ac.createGain();
    os.type = 'sawtooth'; os.frequency.value = 100; fil.type = 'lowpass'; fil.frequency.value = 400; vol.gain.value = 0;
    os.connect(fil).connect(vol).connect(ac.destination); os.start();
    let dio = false;
    return {
      cuadro({ paso, t }) {
        const fin = paso === 5 && t >= 1;
        vol.gain.setTargetAtTime(fin ? 0 : 0.08, ac.currentTime, 0.1);
        if (fin && !dio) {
          dio = true;
          const d = ac.createOscillator(), dv = ac.createGain(); d.type = 'sine'; d.frequency.value = 1760;
          dv.gain.setValueAtTime(0.25, ac.currentTime); dv.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.5);
          d.connect(dv).connect(ac.destination); d.start(); d.stop(ac.currentTime + 1.6);
        }
        if (paso !== 5) dio = false;
      },
    };
  }

  const COLORES = ['pared', 'encimera', 'encimera-borde', 'carcasa', 'cavidad', 'cavidad-luz', 'metal', 'mandos', 'magnetron', 'aleta', 'pantalla', 'digito', 'boton', 'onda', 'caliente', 'nodo', 'plato', 'plato-borde',
    'taza', 'agua', 'campo', 'oxigeno', 'hidrogeno', 'chocolate', 'derretido', 'luz', 'sol', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, sonido, COLORES, ejercicio, abrirEnOndas, cDe };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: Microondas.pasos, dibuja: Microondas.dibuja, colores: Microondas.COLORES, sonido: Microondas.sonido });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); Microondas.abrirEnOndas(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = Microondas;
