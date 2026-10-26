/* =====================================================================
   El fuego de San Telmo: los 6 pasos de la animación (texto y dibujo) y la
   escena que se abre en Electrostática (dos esferas conductoras unidas, la
   pequeña con su carga como incógnita). El motor de la animación es
   fenomenos/animacion.js; la maqueta, pagina.html. En Node (pruebas) solo se
   cargan los datos: pruebas/herramientas/fenomenos/fuego-san-telmo.js.
   Los dibujos usan un mundo de 16 × 9 unidades centrado en el lienzo.
   ===================================================================== */
const FuegoSanTelmo = (() => {
  // modelo del paso 3: casco de 1 m y punta de 1 cm a unos 50 kV del aire que los rodea
  const V = 50e3, R1 = 1, R2 = 0.01, RUPTURA = 3e6, EPS0 = 8.8541878128e-12;
  const datos = { V, R1, R2, Ecasco: V / R1, Epunta: V / R2, sigmas: R1 / R2, Q1: 4 * Math.PI * EPS0 * R1 * V, RUPTURA };

  const pasos = [
    { titulo: 'Una tormenta encima del barco', texto: 'La base de una nube de tormenta se carga negativamente y el mar, que conduce bien, queda con carga positiva justo debajo. Entre los dos aparece un campo eléctrico vertical, $E⃗$, que apunta del mar a la nube.\n\nCon buen tiempo ese campo es de unos 100 V/m; debajo de una tormenta llega a 10 o 20 kV/m, cien veces más.' },
    { titulo: 'El mástil se carga por inducción', texto: 'El casco, los mástiles y el mar forman un solo conductor. La nube negativa aleja los electrones hacia el mar y deja carga positiva arriba, en las puntas de los mástiles.\n\nEn equilibrio todo el conductor está al mismo potencial. Si las puntas están a 5 m sobre el mar en un campo de 10 kV/m, quedan a unos $ΔV ≈ E h = 50 "kV"$ del aire que las rodea.' },
    { titulo: 'Las cargas se amontonan en la punta', texto: 'Un modelo sencillo: dos esferas conductoras unidas por un hilo, una grande (el casco, $R_1 = 1 "m"$) y una pequeña (la punta, $R_2 = 1 "cm"$). Al estar unidas tienen el mismo potencial:\n\n$V = Q_1/(4πε_0 R_1) = Q_2/(4πε_0 R_2)$\n\nLa pequeña se lleva menos carga, pero en mucha menos superficie, así que su densidad de carga es mayor: $σ_2/σ_1 = R_1/R_2 = 100$.' },
    { titulo: 'El campo en la punta es enorme', texto: 'Junto a un conductor el campo es $E = σ/ε_0$, que en una esfera es $E = V/R$. Con los mismos 50 kV, en el casco $E = (50 "kV")/(1 "m") = 50 "kV/m"$ y en la punta $E = (50 "kV")/(0,01 "m") = 5 "MV/m"$.\n\nEl aire seco deja de aislar hacia los 3 MV/m: es su rigidez dieléctrica. En la punta se supera; en el casco, ni de lejos.' },
    { titulo: 'El aire se rompe: descarga corona', texto: 'En el aire siempre hay algún electrón libre, arrancado por los rayos cósmicos o la radiactividad natural. En un campo tan intenso, entre choque y choque gana energía suficiente para arrancar otro electrón a una molécula de nitrógeno u oxígeno, y esos dos arrancan otros dos: es una avalancha.\n\nPero el campo cae deprisa al alejarse de la punta (como $1/r^2$), así que la avalancha se queda en una capa de pocos milímetros alrededor: es una descarga corona, no un rayo.', dura: 11000 },
    { titulo: 'La luz azul del fuego de San Telmo', texto: 'Las moléculas de nitrógeno que la avalancha excita emiten, al volver a su estado normal, luz azul y violeta (y algo de ultravioleta). Por eso las puntas brillan con un resplandor azulado y se oye un chisporroteo.\n\nEs un plasma frío con corrientes de microamperios: no quema ni rompe nada. Los marineros lo tomaban por la protección de San Erasmo, San Telmo. Hoy se ve en las alas de los aviones, y el pararrayos usa la misma idea: una punta unida a tierra que concentra el campo.', dura: 12000 },
  ];

  // escena del simulador de electrostática (formato de electro-sim-cur-v2): dos esferas conductoras en el SI,
  // la pequeña con su carga como incógnita y la condición V_B − V_A = 0 entre las dos superficies
  const escenaElectrostatica = () => ({
    unit: 'a', mode: 'si', view: { plane: 'xy', cut: '0' }, kinds: {},
    sources: [
      { id: 'casco', type: 'conductor', name: 'Q1', pos: ['0', '0', '0'], R: '1', s: { c: '5.56e-6', sym: '' } },
      { id: 'punta', type: 'conductor', name: 'Q2', pos: ['20', '0', '0'], R: '0.01', s: { c: '1e-9', sym: '' } },
    ],
    unknown: { srcs: ['punta'], conds: [{ type: 'dV', A: ['0', '1', '0'], B: ['20', '0.01', '0'], val: { c: '0', sym: '' } }] },
    analyses: [{ id: 'e-casco', type: 'E', P: ['0', '1', '0'] }, { id: 'e-punta', type: 'E', P: ['20', '0.01', '0'] }],
  });
  const ejercicio = () => ({
    ref: { kind: 'preset', id: 'fenomeno-fuego-san-telmo' }, title: 'El fuego de San Telmo: casco y punta',
    statement: 'Una esfera conductora de radio 1 m (el casco) con 5,56 µC y otra de radio 1 cm (la punta del mástil), a 20 m, están unidas por un hilo, así que tienen el mismo potencial. Obtener la carga de la pequeña y el campo eléctrico en la superficie de cada una, y compararlo con la rigidez dieléctrica del aire, 3 MV/m.',
    scene: escenaElectrostatica(),
  });
  // escribe el ejercicio en el estado de Electrostática y la abre
  function abrirEnElectrostatica(destino) {
    try { localStorage.setItem('electro-sim-cur-v2', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  /* ---------------- dibujo ---------------- */
  const suave = (t) => t * t * (3 - 2 * t);
  const tramo = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
  const rgba = (hex, a) => { const h = hex.replace('#', ''), n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  // azar fijo (siempre las mismas posiciones)
  const azar = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const PUNTA_A = [7, 2.9], PUNTA_B = [9.6, 3.9];

  function dibuja(g, { paso, t, reloj, w, h, c }) {
    const k = Math.min(w / 16, h / 9), ox = (w - 16 * k) / 2, oy = (h - 9 * k) / 2;
    const X = (x) => ox + x * k, Y = (y) => oy + y * k, x0 = -ox / k, x1 = (w - ox) / k;
    const letra = (px, peso = 500) => `${peso} ${Math.max(11, px * k / 40)}px "IBM Plex Sans", system-ui, sans-serif`;
    const rotulo = (txt, x, y, { color = c.rotulo, tam = 13, al = 'left', peso = 500, fondo = true } = {}) => {
      g.font = letra(tam, peso); g.textAlign = al; g.textBaseline = 'middle';
      if (fondo) { const m = g.measureText(txt).width, p = 4, x2 = al === 'center' ? X(x) - m / 2 : al === 'right' ? X(x) - m : X(x); g.fillStyle = rgba(c.panel, 0.85); g.fillRect(x2 - p, Y(y) - 9 - p / 2, m + 2 * p, 18 + p); }
      g.fillStyle = color; g.fillText(txt, X(x), Y(y));
    };
    const signo = (x, y, s, color, a = 1) => {
      const r = 0.13 * k; g.globalAlpha = a; g.strokeStyle = color; g.lineWidth = Math.max(1.5, 0.045 * k); g.beginPath();
      g.moveTo(X(x) - r, Y(y)); g.lineTo(X(x) + r, Y(y)); if (s > 0) { g.moveTo(X(x), Y(y) - r); g.lineTo(X(x), Y(y) + r); } g.stroke(); g.globalAlpha = 1;
    };
    const flecha = (xa, ya, xb, yb, color, a = 1, ancho = 0.03) => {
      g.globalAlpha = a; g.strokeStyle = color; g.fillStyle = color; g.lineWidth = Math.max(1, ancho * k);
      g.beginPath(); g.moveTo(X(xa), Y(ya)); g.lineTo(X(xb), Y(yb)); g.stroke();
      const an = Math.atan2(Y(yb) - Y(ya), X(xb) - X(xa)), L = 0.18 * k;
      g.beginPath(); g.moveTo(X(xb), Y(yb)); g.lineTo(X(xb) - L * Math.cos(an - 0.4), Y(yb) - L * Math.sin(an - 0.4)); g.lineTo(X(xb) - L * Math.cos(an + 0.4), Y(yb) - L * Math.sin(an + 0.4)); g.fill(); g.globalAlpha = 1;
    };
    const noche = paso === 5 ? suave(t) : 0;

    // cielo y mar (a lo ancho de todo el lienzo)
    g.fillStyle = c.cielo; g.fillRect(0, 0, w, h);
    if (noche) { g.fillStyle = rgba(c['cielo-noche'], noche); g.fillRect(0, 0, w, h); }
    g.fillStyle = c.mar; g.fillRect(0, Y(7.7), w, h - Y(7.7));
    if (paso === 4) return avalancha();

    // nube con su base negativa
    const aNube = paso === 0 ? suave(tramo(t, 0, 0.5)) : 1;
    g.globalAlpha = aNube; g.fillStyle = c.nube;
    for (let x = Math.floor(x0) - 1, j = 0; x < x1 + 1; x += 1.3, j++) { g.beginPath(); g.arc(X(x), Y(0.7 + 0.5 * azar(j)), (0.9 + 0.5 * azar(j + 9)) * k, 0, 2 * Math.PI); g.fill(); }
    g.fillRect(0, 0, w, Y(1.2)); g.globalAlpha = 1;
    const xs = []; for (let x = Math.ceil(x0 + 0.4); x < x1 - 0.3; x += 1.1) xs.push(x);
    const nNeg = paso === 0 ? Math.round(xs.length * tramo(t, 0.2, 0.8)) : xs.length;
    xs.slice(0, nNeg).forEach((x) => signo(x, 1.85, -1, c.neg));

    // campo entre la nube y el mar
    if (paso <= 1 || paso === 5) {
      const a = paso === 0 ? tramo(t, 0.5, 1) * 0.8 : paso === 1 ? 0.35 : 0.15 * (1 - noche);
      for (let x = Math.ceil(x0) + 0.5; x < x1; x += 1.6) if (x < 4 || x > 12) flecha(x, 7.5, x, 2.3, c.campo, a);
      if (paso === 0) { rotulo('E ≈ 10 kV/m', Math.min(x1 - 0.4, 15.4), 4.8, { color: c.campo, al: 'right', peso: 600 }); xs.slice(0, Math.round(xs.length * tramo(t, 0.4, 0.9))).forEach((x) => signo(x, 8.15, 1, c.pos)); }
    }

    barco(paso === 2 ? 0.35 : 1);
    if (paso === 1) induccion();
    else if (paso === 2) esferas();
    else if (paso === 3) campoPunta();
    else if (paso === 5) brillo();

    function barco(a) {
      g.globalAlpha = a;
      g.fillStyle = c.casco; g.beginPath(); g.moveTo(X(4.5), Y(6.9)); g.lineTo(X(11.5), Y(6.9)); g.lineTo(X(10.8), Y(7.85)); g.lineTo(X(5.2), Y(7.85)); g.closePath(); g.fill();
      g.strokeStyle = c.mastil; g.lineWidth = Math.max(2, 0.1 * k); g.lineCap = 'round';
      g.beginPath(); g.moveTo(X(7), Y(6.9)); g.lineTo(X(PUNTA_A[0]), Y(PUNTA_A[1])); g.moveTo(X(9.6), Y(6.9)); g.lineTo(X(PUNTA_B[0]), Y(PUNTA_B[1])); g.stroke();
      g.lineWidth = Math.max(1.5, 0.07 * k); g.beginPath(); g.moveTo(X(5.9), Y(4)); g.lineTo(X(8.1), Y(4)); g.moveTo(X(8.8), Y(4.9)); g.lineTo(X(10.4), Y(4.9)); g.stroke();
      g.globalAlpha = a * (1 - noche * 0.6); g.fillStyle = c.vela;
      g.beginPath(); g.moveTo(X(6.1), Y(4.15)); g.lineTo(X(7.9), Y(4.15)); g.lineTo(X(7.7), Y(6.3)); g.lineTo(X(6.3), Y(6.3)); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(X(8.95), Y(5.05)); g.lineTo(X(10.25), Y(5.05)); g.lineTo(X(10.1), Y(6.4)); g.lineTo(X(9.1), Y(6.4)); g.closePath(); g.fill();
      g.globalAlpha = 1; g.lineCap = 'butt';
    }
    function induccion() {
      // cargas positivas que suben del mar a las puntas y electrones que bajan
      const fin = [[7, 3.05], [7, 3.35], [6.85, 3.2], [7.15, 3.2], [9.6, 4.05], [9.6, 4.35], [9.45, 4.2], [9.75, 4.2]];
      fin.forEach(([x, y], j) => { const u = suave(tramo(t, 0.05 * j, 0.55 + 0.05 * j)); signo(x, 8.1 + (y - 8.1) * u, 1, c.pos); });
      for (let j = 0; j < 6; j++) { const u = suave(tramo(t, 0.1, 0.8)); signo(5.5 + j, 7.3 + 0.6 * u, -1, c.neg, 1 - 0.7 * u); }
      if (t > 0.6) { g.globalAlpha = tramo(t, 0.6, 0.9); rotulo('Todo el conductor, al mismo potencial', 8, 8.45, { al: 'center', peso: 600 }); rotulo('ΔV ≈ 50 kV con el aire', 7.35, 2.45, { color: c.pos, peso: 600 }); g.globalAlpha = 1; }
    }
    function esferas() {
      for (const [x, y] of [[7, 3.1], [9.6, 4.1]]) signo(x, y, 1, c.pos, 0.35);
      // recuadro con el modelo: esfera grande (casco) y pequeña (punta) unidas por un hilo
      const bx = 10.3, by = 2.2, bw = 5.4, bh = 5.2, a = suave(tramo(t, 0, 0.3));
      g.globalAlpha = a; g.fillStyle = c.panel; g.strokeStyle = c.rotulo; g.lineWidth = 1;
      g.beginPath(); g.roundRect(X(bx), Y(by), bw * k, bh * k, 0.25 * k); g.fill(); g.stroke();
      g.setLineDash([4, 4]); g.beginPath(); g.arc(X(PUNTA_A[0]), Y(PUNTA_A[1]), 0.45 * k, 0, 2 * Math.PI); g.moveTo(X(PUNTA_A[0] + 0.45), Y(PUNTA_A[1])); g.lineTo(X(bx), Y(by + 1.2)); g.stroke(); g.setLineDash([]);
      const C1 = [12, 4.85], r1 = 1.05, C2 = [14.7, 3.9], r2 = 0.18;
      g.strokeStyle = c.mastil; g.lineWidth = Math.max(1.5, 0.05 * k); g.beginPath(); g.moveTo(X(C1[0] + r1 * 0.8), Y(C1[1] - r1 * 0.6)); g.quadraticCurveTo(X(14), Y(5.1), X(C2[0]), Y(C2[1] + r2)); g.stroke();
      g.fillStyle = c.metal; g.beginPath(); g.arc(X(C1[0]), Y(C1[1]), r1 * k, 0, 2 * Math.PI); g.arc(X(C2[0]), Y(C2[1]), r2 * k, 0, 2 * Math.PI); g.fill();
      const u = tramo(t, 0.25, 0.75);
      for (let j = 0; j < 10; j++) { if (j / 10 < u) { const an = (j / 10) * 2 * Math.PI; signo(C1[0] + (r1 + 0.2) * Math.cos(an), C1[1] + (r1 + 0.2) * Math.sin(an), 1, c.pos); } }
      for (let j = 0; j < 7; j++) { if (j / 7 < u) { const an = (j / 7) * 2 * Math.PI; g.save(); g.translate(X(C2[0] + (r2 + 0.16) * Math.cos(an)), Y(C2[1] + (r2 + 0.16) * Math.sin(an))); g.scale(0.6, 0.6); g.translate(-X(C2[0] + (r2 + 0.16) * Math.cos(an)), -Y(C2[1] + (r2 + 0.16) * Math.sin(an))); signo(C2[0] + (r2 + 0.16) * Math.cos(an), C2[1] + (r2 + 0.16) * Math.sin(an), 1, c.pos); g.restore(); } }
      g.globalAlpha = a; rotulo('R₁: casco', C1[0], C1[1] + r1 + 0.62, { al: 'center', fondo: false }); rotulo('R₂: punta', C2[0], C2[1] - r2 - 0.55, { al: 'center', fondo: false });
      g.globalAlpha = tramo(t, 0.7, 1); rotulo('Mismo V  ⇒  σ₂/σ₁ = R₁/R₂', bx + bw / 2, by + bh - 0.35, { al: 'center', peso: 600, fondo: false, color: c.pos }); g.globalAlpha = 1;
    }
    function campoPunta() {
      for (const [x, y] of [[7, 3.05], [6.88, 3.2], [7.12, 3.2], [9.6, 4.05]]) signo(x, y, 1, c.pos);
      // líneas de campo que se juntan en la punta
      const u = suave(tramo(t, 0, 0.6));
      for (let j = 0; j < 11; j++) {
        // del + de la punta al − de la nube
        const xa = 2.2 + j * 0.95, ya = 2.05, [xb, yb] = PUNTA_A;
        if (u > 0.02) flecha(xb, yb - 0.12, xb + (xa - xb) * u, yb - 0.12 + (ya - yb + 0.12) * u, c.campo, 0.9);
      }
      // medidor: campo en el casco y en la punta frente a la ruptura del aire
      const mx = 11.2, mw = 4.3, emax = 6e6, v = tramo(t, 0.35, 1);
      g.fillStyle = rgba(c.panel, 0.9); g.beginPath(); g.roundRect(X(mx - 0.25), Y(4.25), (mw + 0.5) * k, 2.55 * k, 0.2 * k); g.fill();
      const barra = (y, E, txt) => {
        rotulo(txt, mx, y - 0.32, { fondo: false, tam: 12 });
        g.fillStyle = rgba(c.rotulo, 0.12); g.fillRect(X(mx), Y(y), mw * k, 0.32 * k);
        g.fillStyle = E * v > RUPTURA ? c.brillo : c.campo; g.fillRect(X(mx), Y(y), Math.max(2, mw * k * Math.min(1, (E / emax) * v)), 0.32 * k);
      };
      barra(5.05, datos.Ecasco, 'Casco: 50 kV/m'); barra(6.15, datos.Epunta, 'Punta: 5 MV/m');
      const xr = mx + mw * (RUPTURA / emax); g.strokeStyle = c.pos; g.lineWidth = 2; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(xr), Y(4.3)); g.lineTo(X(xr), Y(6.6)); g.stroke(); g.setLineDash([]);
      rotulo('ruptura del aire: 3 MV/m', mx + mw, 3.85, { color: c.pos, al: 'right', tam: 11.5, peso: 600 });
    }
    function brillo() {
      const a = suave(tramo(t, 0.2, 0.9));
      const puntos = [[...PUNTA_A, 1], [...PUNTA_B, 0.85], [5.9, 4, 0.5], [8.1, 4, 0.5], [8.8, 4.9, 0.45], [10.4, 4.9, 0.45]];
      puntos.forEach(([x, y, s], j) => {
        const p = s * (1 + 0.18 * Math.sin(reloj * 13 + j) + 0.1 * Math.sin(reloj * 31 + 2 * j)), r = 0.75 * p * k;
        const gr = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r);
        gr.addColorStop(0, rgba(c['brillo-centro'], 0.95 * a)); gr.addColorStop(0.35, rgba(c.brillo, 0.7 * a)); gr.addColorStop(1, rgba(c.brillo, 0));
        g.fillStyle = gr; g.beginPath(); g.arc(X(x), Y(y), r, 0, 2 * Math.PI); g.fill();
        // chispitas que salen de la punta y cambian a cada momento
        g.strokeStyle = rgba(c['brillo-centro'], 0.8 * a); g.lineWidth = 1.2;
        for (let q = 0; q < 7; q++) {
          const an = -Math.PI / 2 + (q - 3) * 0.45 + 0.25 * Math.sin(reloj * 7 + q * 3 + j), L = (0.25 + 0.35 * azar(Math.floor(reloj * 12) + q * 7 + j * 31)) * p;
          g.beginPath(); g.moveTo(X(x), Y(y));
          for (let s2 = 1; s2 <= 3; s2++) { const d = (L * s2) / 3, z = (azar(q + s2 * 13 + Math.floor(reloj * 20)) - 0.5) * 0.12; g.lineTo(X(x + d * Math.cos(an) + z), Y(y + d * Math.sin(an) + z)); }
          g.stroke();
        }
      });
      if (t > 0.5) { g.globalAlpha = tramo(t, 0.5, 0.9); rotulo('Fuego de San Telmo', 7.4, 2.15, { color: c.brillo, peso: 600, tam: 14 }); g.globalAlpha = 1; }
    }
    // paso 5: de cerca, la punta y los electrones que se multiplican en el aire
    function avalancha() {
      g.fillStyle = c.cielo; g.fillRect(0, 0, w, h);
      const P = [8, 5.2], u = suave(tramo(t, 0, 0.5));
      // zona donde el campo supera la rigidez del aire
      g.globalAlpha = u; g.fillStyle = rgba(c.brillo, 0.16); g.beginPath(); g.arc(X(P[0]), Y(P[1]), 1.9 * k, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = c.brillo; g.setLineDash([5, 4]); g.lineWidth = 1.5; g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      // moléculas de N₂ y O₂ (siempre en el mismo sitio)
      for (let j = 0; j < 46; j++) {
        const an = -Math.PI * azar(j), r = 0.6 + 4.6 * azar(j + 50), x = P[0] + r * Math.cos(an) * 1.5, y = P[1] + r * Math.sin(an);
        if (y > P[1] + 0.2 || y < 0.3) continue;
        g.fillStyle = c.molecula; g.beginPath(); g.arc(X(x - 0.07), Y(y), 0.09 * k, 0, 2 * Math.PI); g.arc(X(x + 0.07), Y(y), 0.09 * k, 0, 2 * Math.PI); g.fill();
      }
      // la punta del mástil, de cerca, con su carga positiva
      g.fillStyle = c.metal; g.beginPath(); g.moveTo(X(6.6), Y(9)); g.lineTo(X(7.75), Y(P[1] + 0.25)); g.quadraticCurveTo(X(8), Y(P[1] - 0.15), X(8.25), Y(P[1] + 0.25)); g.lineTo(X(9.4), Y(9)); g.closePath(); g.fill();
      for (const [x, y] of [[8, P[1] + 0.2], [7.6, P[1] + 0.9], [8.4, P[1] + 0.9], [7.2, P[1] + 1.8], [8.8, P[1] + 1.8]]) signo(x, y, 1, c.pos);
      // electrones que caen hacia la punta cada vez más deprisa y se multiplican cerca de ella
      const n = Math.round(4 + 10 * u);
      for (let j = 0; j < n; j++) {
        const an = -Math.PI * (0.12 + 0.76 * azar(j + 200)), q = (reloj * (0.35 + 0.2 * azar(j + 300)) + azar(j + 400)) % 1;
        const r = 0.3 + 4.2 * (1 - q) ** 2, hijos = r < 1.9 ? (r < 1.1 ? 4 : 2) : 1;
        for (let m = 0; m < hijos; m++) {
          const da = (m - (hijos - 1) / 2) * 0.09 * (1.9 - Math.min(1.9, r)), x = P[0] + r * Math.cos(an + da) * 1.4, y = P[1] + r * Math.sin(an + da);
          g.fillStyle = c.neg; g.beginPath(); g.arc(X(x), Y(y), 0.07 * k, 0, 2 * Math.PI); g.fill();
        }
      }
      rotulo('Zona con E > 3 MV/m: avalancha', P[0] + 2.1, P[1] - 1.75, { color: c.brillo, peso: 600 });
      g.fillStyle = c.neg; g.beginPath(); g.arc(X(x0 + 0.6), Y(0.7), 0.08 * k, 0, 2 * Math.PI); g.fill(); rotulo('electrón', x0 + 0.85, 0.7, { fondo: false, tam: 12 });
      g.fillStyle = c.molecula; g.beginPath(); g.arc(X(x0 + 0.53), Y(1.25), 0.08 * k, 0, 2 * Math.PI); g.arc(X(x0 + 0.67), Y(1.25), 0.08 * k, 0, 2 * Math.PI); g.fill(); rotulo('molécula de N₂ u O₂', x0 + 0.85, 1.25, { fondo: false, tam: 12 });
    }
  }

  const COLORES = ['cielo', 'cielo-noche', 'mar', 'nube', 'casco', 'mastil', 'vela', 'metal', 'neg', 'pos', 'campo', 'brillo', 'brillo-centro', 'molecula', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, COLORES, escenaElectrostatica, ejercicio, abrirEnElectrostatica };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: FuegoSanTelmo.pasos, dibuja: FuegoSanTelmo.dibuja, colores: FuegoSanTelmo.COLORES });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); FuegoSanTelmo.abrirEnElectrostatica(e.currentTarget.getAttribute('href')); });
}
if (typeof module !== 'undefined') module.exports = FuegoSanTelmo;
