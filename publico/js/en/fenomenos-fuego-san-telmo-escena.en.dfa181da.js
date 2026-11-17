const FuegoSanTelmo = (() => {
  const V = 50e3, R1 = 1, R2 = 0.01, RUPTURA = 3e6, EPS0 = 8.8541878128e-12;
  const datos = { V, R1, R2, Ecasco: V / R1, Epunta: V / R2, sigmas: R1 / R2, Q1: 4 * Math.PI * EPS0 * R1 * V, RUPTURA };

  const pasos = [
    { titulo: 'A storm above the ship', corto: 'Storm', dato: { valor: '≈ 10 kV/m', texto: 'of field between the base of the cloud and the sea.' }, texto: 'The base of a thundercloud becomes negatively charged and the sea, which conducts well, is left with positive charge just below. Between the two a vertical electric field appears, $E⃗$, pointing from the sea to the cloud.\n\nIn fine weather that field is about 100 V/m; under a storm it reaches 10 or 20 kV/m, a hundred times more.' },
    { titulo: 'The mast is charged by induction', corto: 'Induction', dato: { valor: '≈ 50 kV', texto: 'between the tip of the mast and the air around it.' }, texto: 'The hull, the masts and the sea form a single conductor. The negative cloud drives the electrons away towards the sea and leaves positive charge at the top, at the tips of the masts.\n\nIn equilibrium the whole conductor is at the same potential. If the tips are 5 m above the sea in a field of 10 kV/m, they are about $ΔV ≈ E h = 50 "kV"$ from the air around them.' },
    { titulo: 'Charges pile up at the tip', corto: 'Point effect', dato: { valor: 'σ₂/σ₁ = 100', texto: 'The tip has 100 times more charge per unit area than the hull.' }, texto: 'A simple model: two conducting spheres joined by a wire, a large one (the hull, $R_1 = 1 "m"$) and a small one (the tip, $R_2 = 1 "cm"$). Being joined they have the same potential:\n\n$V = Q_1/(4πε_0 R_1) = Q_2/(4πε_0 R_2)$\n\nThe small one takes less charge, but on a much smaller surface, so its charge density is greater: $σ_2/σ_1 = R_1/R_2 = 100$.' },
    { titulo: 'The field at the tip is enormous', corto: 'Field', dato: { valor: '5 MV/m > 3 MV/m', texto: 'The field next to the tip exceeds the dielectric strength of air.' }, texto: 'Next to a conductor the field is $E = σ/ε_0$, which for a sphere is $E = V/R$. With the same 50 kV, at the hull $E = (50 "kV")/(1 "m") = 50 "kV/m"$ and at the tip $E = (50 "kV")/(0.01 "m") = 5 "MV/m"$.\n\nDry air stops insulating at around 3 MV/m: that is its dielectric strength. At the tip it is exceeded; at the hull, not by a long way.' },
    { titulo: 'The air breaks down: corona discharge', corto: 'Avalanche', dato: { valor: '1 → 2 → 4 → 8…', texto: 'Each electron knocks another one loose when it collides with a molecule: they multiply.' }, texto: 'In the air there is always some free electron, knocked loose by cosmic rays or natural radioactivity. In such an intense field, between collisions it gains enough energy to knock another electron out of a nitrogen or oxygen molecule, and those two knock out two more: it is an avalanche.\n\nBut the field falls quickly away from the tip (as $1/r^2$), so the avalanche stays in a layer a few millimetres thick around it: it is a corona discharge, not lightning.', dura: 11000 },
    { titulo: 'The blue light of St. Elmo\'s fire', corto: 'Brightness', dato: { valor: 'Blue and violet', texto: 'It is the light of excited nitrogen molecules: a cold plasma that does not burn.' }, texto: 'The nitrogen molecules excited by the avalanche emit, on returning to their normal state, blue and violet light (and some ultraviolet). That is why the tips glow with a bluish shimmer and a crackling is heard.\n\nIt is a cold plasma with currents of microamperes: it burns or breaks nothing. Sailors took it as the protection of Saint Erasmus, St. Elmo. Today it is seen on aircraft wings, and the lightning rod uses the same idea: a point connected to ground that concentrates the field.\n\nTry it yourself: with the slider you change the radius of the tip. Above about 1.7 cm the field, $E = V/R$, no longer reaches 3 MV/m and the glow goes out.', dura: 12000 },
  ];

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
    ref: { kind: 'preset', id: 'fenomeno-fuego-san-telmo' }, title: 'St. Elmo\'s fire: hull and tip',
    statement: 'A conducting sphere of radius 1 m (the hull) with 5.56 µC and another of radius 1 cm (the tip of the mast), 20 m away, are joined by a wire, so they have the same potential. Obtain the charge of the small one and the electric field at the surface of each, and compare it with the dielectric strength of air, 3 MV/m.',
    scene: escenaElectrostatica(),
  });
  function abrirEnElectrostatica(destino) {
    try { localStorage.setItem('electro-sim-cur-v2', JSON.stringify(ejercicio())); } catch (e) { /* sin almacenamiento: se abre sin datos */ }
    location.href = destino;
  }

  const { suave, tramo, rgba, azar } = typeof Dibujo !== 'undefined' ? Dibujo : {};
  const PUNTA_A = [7, 2.9], PUNTA_B = [9.6, 3.9], AGUA = 7.7, CICLO_RAYO = 6.5;
  const EJE = [8, 7.4];
  const balanceo = (reloj) => ({ an: 0.022 * Math.sin(reloj * 0.8), dy: 0.05 * Math.sin(reloj * 1.1 + 1) });
  const B = ([x, y], { an, dy }) => [EJE[0] + (x - EJE[0]) * Math.cos(an) - (y - EJE[1]) * Math.sin(an), EJE[1] + dy + (x - EJE[0]) * Math.sin(an) + (y - EJE[1]) * Math.cos(an)];
  const camaraDe = (paso, bal) => paso === 3 ? { x: 7.9, y: 3.4, z: 1.7 } : paso === 4 ? { ...((p) => ({ x: p[0], y: p[1] }))(B(PUNTA_A, bal)), z: 7 } : { x: 8, y: 4.5, z: 1 };
  const cam = { x: 8, y: 4.5, z: 1 };
  const prueba = { etiqueta: 'change the radius of the mast tip', min: 0.3, max: 5, paso: 0.1, valor: 1, R: 1,
    muestra: (R) => { const E = V / (R / 100); return `R = ${R.toFixed(1).replace('.', '.')} cm → E = ${(E / 1e6).toFixed(1).replace('.', '.')} MV/m ${E > RUPTURA ? '> 3 MV/m: it glows' : '< 3 MV/m: it does not glow'}`; },
    cambia: (R) => { prueba.R = R; } };
  pasos[5].prueba = prueba;

  function dibuja(g, { paso, t, reloj, w, h, c, quieto }) {
    const bal = quieto ? { an: 0, dy: 0 } : balanceo(reloj), v = Dibujo.vista(g, w, h, c, cam);
    v.sigue(camaraDe(paso, bal), reloj, quieto);
    const { X, Y, rotulo, signo, flecha, punto } = v, pantalla = v.pantalla;
    const enBarco = (dibujo) => { const p = B(EJE, bal); g.save(); g.translate(X(p[0]), Y(p[1])); g.rotate(bal.an); g.translate(-X(EJE[0]), -Y(EJE[1])); dibujo(); g.restore(); };
    const noche = paso === 5 ? suave(t) : 0;
    const cerca = tramo(Math.log(cam.z), Math.log(2.2), Math.log(5));
    const nRayo = Math.floor(reloj / CICLO_RAYO), fase = reloj - nRayo * CICLO_RAYO, rayo = quieto || cerca > 0.5 || paso === 2 ? 0 : fase < 0.12 ? 1 : fase < 0.22 ? 0.35 : fase < 0.3 ? 0.8 : fase < 0.6 ? 0.8 * (1 - (fase - 0.3) / 0.3) : 0;

    if (cerca < 1) {
      cielo(); if (rayo) relampago();
      nube(); campoNubeMar();
      enBarco(() => barco(paso === 2 ? 0.35 : 1));
      mar();
      enBarco(() => { if (paso === 1) induccion(); else if (paso === 2 || paso === 3) cargasPunta(); });
      if (paso === 3) campoPunta();
      if (paso === 5) brillo();
      lluvia(paso === 2 ? 0.5 : 1);
      if (paso === 2) esferas();
    }
    if (cerca > 0) { g.globalAlpha = cerca; pantalla(); avalancha(); g.globalAlpha = 1; }
    pantalla();
    if (paso === 3 && cerca < 0.5) medidor();
    if (paso === 5) lecturaPrueba();

    function cielo() {
      const gr = g.createLinearGradient(0, 0, 0, Y(AGUA)); gr.addColorStop(0, c['cielo-alto']); gr.addColorStop(1, c.cielo);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      if (noche) { g.fillStyle = rgba(c['cielo-noche'], noche); g.fillRect(0, 0, w, h); }
      if (rayo) { g.fillStyle = rgba(c.rayo, 0.28 * rayo * (1 - 0.4 * noche)); g.fillRect(0, 0, w, h); }
    }
    function relampago() {
      const lado = nRayo % 2 ? 1 : -1, xa = lado > 0 ? Math.min(v.x1 - 1, 14.2) : Math.max(v.x0 + 1, 1.8);
      g.strokeStyle = rgba(c.rayo, rayo); g.lineWidth = Math.max(1.5, 0.05 * v.K); g.lineJoin = 'round'; g.beginPath();
      let x = xa + (azar(nRayo) - 0.5), y = 1.3; g.moveTo(X(x), Y(y));
      while (y < AGUA) { y += 0.35 + 0.3 * azar(nRayo * 7 + y); x += (azar(nRayo * 13 + y * 3) - 0.5) * 0.7; g.lineTo(X(x), Y(Math.min(y, AGUA))); }
      g.stroke();
    }
    function nube() {
      const a = paso === 0 ? suave(tramo(t, 0, 0.5)) : 1;
      g.globalAlpha = a;
      const gr = g.createLinearGradient(0, Y(0), 0, Y(1.9)); gr.addColorStop(0, rgba(c.nube, 1)); gr.addColorStop(1, rgba(c.nube, 0.92));
      g.fillStyle = gr;
      for (let x = Math.floor(v.x0) - 1, j = Math.floor(v.x0) * 7; x < v.x1 + 1; x += 1.3, j++) { g.beginPath(); g.arc(X(x), Y(0.7 + 0.5 * azar(j)), (0.9 + 0.5 * azar(j + 9)) * v.K, 0, 2 * Math.PI); g.fill(); }
      g.fillRect(0, 0, w, Math.max(0, Y(1.2))); g.globalAlpha = 1;
      const xs = []; for (let x = Math.ceil(v.x0 + 0.4); x < v.x1 - 0.3; x += 1.1) xs.push(x);
      const nNeg = paso === 0 ? Math.round(xs.length * tramo(t, 0.2, 0.8)) : xs.length;
      xs.slice(0, nNeg).forEach((x) => signo(x, 1.85, -1, c.neg));
    }
    function campoNubeMar() {
      if (!(paso <= 1 || paso === 5)) return;
      const a = paso === 0 ? tramo(t, 0.5, 1) * 0.8 : paso === 1 ? 0.35 : 0.15 * (1 - noche);
      for (let x = Math.ceil(v.x0) + 0.5, j = 0; x < v.x1; x += 1.6, j++) {
        if (!(x < 4 || x > 12)) continue;
        flecha(x, 7.5, x, 2.3, c.campo, a);
        for (let q = 0; q < 3; q++) { const u = (reloj * 0.18 + q / 3 + azar(j)) % 1; punto(x, 7.4 - u * 5, 0.05, c.campo, a * Math.sin(Math.PI * u)); }
      }
      if (paso === 0) {
        rotulo('E ≈ 10 kV/m', Math.min(v.x1 - 0.4, 15.4), 4.8, { color: c.campo, al: 'right', peso: 600, escribe: tramo(t, 0.55, 0.85) });
        const xs = []; for (let x = Math.ceil(v.x0 + 0.4); x < v.x1 - 0.3; x += 1.1) xs.push(x);
        xs.slice(0, Math.round(xs.length * tramo(t, 0.4, 0.9))).forEach((x) => signo(x, 8.15, 1, c.pos));
      }
    }
    function mar() {
      const ola = (x, f) => AGUA + f * (0.06 * Math.sin(1.7 * x + reloj * 1.6) + 0.04 * Math.sin(3.1 * x - reloj * 2.3));
      g.fillStyle = c.mar; g.beginPath(); g.moveTo(0, h);
      for (let x = v.x0 - 0.2; x <= v.x1 + 0.2; x += 0.15) g.lineTo(X(x), Y(ola(x, 1)));
      g.lineTo(w, h); g.closePath(); g.fill();
      g.strokeStyle = rgba(c.ola, 0.7); g.lineWidth = Math.max(1, 0.03 * v.K);
      for (let j = 0; j < 9; j++) {
        const y = AGUA + 0.35 + 0.18 * j, xa = v.x0 + ((azar(j) * (v.x1 - v.x0) + reloj * (0.15 + 0.1 * azar(j + 5))) % (v.x1 - v.x0 + 1)) - 0.5;
        g.beginPath(); g.moveTo(X(xa), Y(y)); g.quadraticCurveTo(X(xa + 0.3), Y(y - 0.06), X(xa + 0.6), Y(y)); g.stroke();
      }
    }
    function lluvia(a) {
      if (quieto) return;
      g.strokeStyle = rgba(c.lluvia, 0.45 * a * (1 - 0.5 * noche)); g.lineWidth = 1;
      g.beginPath();
      for (let j = 0; j < 90; j++) {
        const vel = 0.55 + 0.35 * azar(j + 7), y = ((azar(j + 99) + reloj * vel) % 1) * (h + 30) - 15, x = ((azar(j) + reloj * vel * 0.08) % 1) * (w + 20) - 10;
        g.moveTo(x, y); g.lineTo(x - 4, y + 14);
      }
      g.stroke();
    }

    function barco(a) {
      g.globalAlpha = a;
      g.fillStyle = c.casco; g.beginPath(); g.moveTo(X(4.5), Y(6.9)); g.lineTo(X(11.5), Y(6.9)); g.lineTo(X(10.8), Y(7.95)); g.lineTo(X(5.2), Y(7.95)); g.closePath(); g.fill();
      g.strokeStyle = c.mastil; g.lineWidth = Math.max(2, 0.1 * v.K); g.lineCap = 'round';
      g.beginPath(); g.moveTo(X(7), Y(6.9)); g.lineTo(X(PUNTA_A[0]), Y(PUNTA_A[1])); g.moveTo(X(9.6), Y(6.9)); g.lineTo(X(PUNTA_B[0]), Y(PUNTA_B[1])); g.stroke();
      g.lineWidth = Math.max(1.5, 0.07 * v.K); g.beginPath(); g.moveTo(X(5.9), Y(4)); g.lineTo(X(8.1), Y(4)); g.moveTo(X(8.8), Y(4.9)); g.lineTo(X(10.4), Y(4.9)); g.stroke();
      g.globalAlpha = a * (1 - noche * 0.6); g.fillStyle = c.vela;
      const vela = (xa, xb, ya, yb, e) => { g.beginPath(); g.moveTo(X(xa), Y(ya)); g.lineTo(X(xb), Y(ya)); g.quadraticCurveTo(X(xb - e + 0.12 * Math.sin(reloj * 1.3)), Y((ya + yb) / 2), X(xb - 0.2), Y(yb)); g.lineTo(X(xa + 0.2), Y(yb)); g.quadraticCurveTo(X(xa - e), Y((ya + yb) / 2), X(xa), Y(ya)); g.fill(); };
      vela(6.1, 7.9, 4.15, 6.3, 0.15); vela(8.95, 10.25, 5.05, 6.4, 0.12);
      g.globalAlpha = a; g.fillStyle = c.metal;
      const r = paso === 5 ? 0.025 + prueba.R * 0.035 : 0.06;
      for (const [x, y] of [PUNTA_A, PUNTA_B]) { g.beginPath(); g.arc(X(x), Y(y), r * v.K, 0, 2 * Math.PI); g.fill(); }
      g.globalAlpha = 1; g.lineCap = 'butt';
    }
    function induccion() {
      const fin = [[7, 3.05], [7, 3.35], [6.85, 3.2], [7.15, 3.2], [9.6, 4.05], [9.6, 4.35], [9.45, 4.2], [9.75, 4.2]];
      fin.forEach(([x, y], j) => { const u = suave(tramo(t, 0.05 * j, 0.55 + 0.05 * j)); signo(x, 8.1 + (y - 8.1) * u, 1, c.pos); });
      for (let j = 0; j < 6; j++) { const u = suave(tramo(t, 0.1, 0.8)); signo(5.5 + j, 7.3 + 0.6 * u, -1, c.neg, 1 - 0.7 * u); }
      rotulo('The whole conductor, at the same potential', 8, 8.45, { al: 'center', peso: 600, escribe: tramo(t, 0.6, 0.85) });
      rotulo('ΔV ≈ 50 kV with the air', 7.35, 2.45, { color: c.pos, peso: 600, escribe: tramo(t, 0.75, 1) });
    }
    function cargasPunta() {
      const a = paso === 2 ? 0.35 : 1;
      for (const [x, y] of [[7.17, 3.15], [6.83, 3.15], [7.17, 3.45], [6.83, 3.45], [9.78, 4.15]]) signo(x, y, 1, c.pos, a, 0.55);
    }
    function esferas() {
      const bx = 10.3, by = 2.2, bw = 5.4, bh = 5.2, a = suave(tramo(t, 0, 0.3)), P = B(PUNTA_A, bal);
      g.globalAlpha = a; g.fillStyle = c.panel; g.strokeStyle = c.rotulo; g.lineWidth = 1;
      g.save(); g.shadowColor = rgba('#000', 0.18); g.shadowBlur = 18; g.shadowOffsetY = 4;
      g.beginPath(); g.roundRect(X(bx), Y(by), bw * v.K, bh * v.K, 0.25 * v.K); g.fill(); g.restore(); g.stroke();
      g.setLineDash([4, 4]); g.beginPath(); g.arc(X(P[0]), Y(P[1]), 0.45 * v.K, 0, 2 * Math.PI); g.moveTo(X(P[0] + 0.45), Y(P[1])); g.lineTo(X(bx), Y(by + 1.2)); g.stroke(); g.setLineDash([]);
      const C1 = [12, 4.85], r1 = 1.05, C2 = [14.7, 3.9], r2 = 0.18;
      const uh = tramo(t, 0.1, 0.3);
      g.strokeStyle = c.mastil; g.lineWidth = Math.max(1.5, 0.05 * v.K); g.beginPath();
      for (let s = 0; s <= uh + 1e-9; s += 0.05) { const a1 = [C1[0] + r1 * 0.8, C1[1] - r1 * 0.6], m = [14, 5.1], b1 = [C2[0], C2[1] + r2], q = (u, v, z) => (1 - s) ** 2 * u + 2 * s * (1 - s) * v + s * s * z; const x = q(a1[0], m[0], b1[0]), y = q(a1[1], m[1], b1[1]); s ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
      g.stroke();
      g.fillStyle = c.metal; g.beginPath(); g.arc(X(C1[0]), Y(C1[1]), r1 * v.K, 0, 2 * Math.PI); g.arc(X(C2[0]), Y(C2[1]), r2 * v.K, 0, 2 * Math.PI); g.fill();
      const u = tramo(t, 0.25, 0.75);
      for (let j = 0; j < 10; j++) if (j / 10 < u) { const an = (j / 10) * 2 * Math.PI; signo(C1[0] + (r1 + 0.2) * Math.cos(an), C1[1] + (r1 + 0.2) * Math.sin(an), 1, c.pos); }
      for (let j = 0; j < 7; j++) if (j / 7 < u) { const an = (j / 7) * 2 * Math.PI; signo(C2[0] + (r2 + 0.16) * Math.cos(an), C2[1] + (r2 + 0.16) * Math.sin(an), 1, c.pos, 1, 0.6); }
      g.globalAlpha = a; rotulo('R₁: hull', C1[0], C1[1] + r1 + 0.62, { al: 'center', fondo: false, escribe: tramo(t, 0.2, 0.4) }); rotulo('R₂: tip', C2[0], C2[1] - r2 - 0.55, { al: 'center', fondo: false, escribe: tramo(t, 0.3, 0.5) });
      g.globalAlpha = 1; rotulo(bw * v.K < 280 ? 'σ₂/σ₁ = R₁/R₂' : 'Same V  ⇒  σ₂/σ₁ = R₁/R₂', bx + bw / 2, by + bh - 0.35, { al: 'center', peso: 600, fondo: false, color: c.pos, escribe: tramo(t, 0.7, 1) });
    }
    function campoPunta() {
      const P = B(PUNTA_A, bal), u = suave(tramo(t, 0, 0.6));
      for (let j = 0; j < 11; j++) {
        const xa = 3.2 + j * 0.75, ya = 2.0, C = [P[0] + (xa - P[0]) * 0.15, ya + 0.15];
        const en = (s) => [(1 - s) ** 2 * P[0] + 2 * s * (1 - s) * C[0] + s * s * xa, (1 - s) ** 2 * (P[1] - 0.12) + 2 * s * (1 - s) * C[1] + s * s * ya];
        g.strokeStyle = rgba(c.campo, 0.75); g.lineWidth = Math.max(1, 0.03 * v.K); g.beginPath();
        for (let s = 0; s <= u + 1e-9; s += 0.04) { const [x, y] = en(s); s ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); }
        g.stroke();
        if (u > 0.55) { const [xa2, ya2] = en(0.5), [xb2, yb2] = en(0.53); flecha(xa2, ya2, xb2, yb2, c.campo, tramo(u, 0.55, 0.8)); }
        if (u > 0.9) for (let q = 0; q < 4; q++) { const fase2 = (reloj * 0.35 + q / 4 + azar(j + 40)) % 1, s = Math.sqrt(fase2), [x, y] = en(s); punto(x, y, 0.045, c.campo, Math.min(1, 4 * (1 - s))); }
      }
    }
    function medidor() {
      const cx = 13.3, cy = 6.1, R = 1.55, emax = 6e6, sube = suave(tramo(t, 0.35, 1)), E = datos.Epunta * sube * (1 + (sube > 0.95 ? 0.012 * Math.sin(reloj * 9) : 0));
      const ang = (e) => Math.PI + Math.PI * Math.min(1, e / emax);
      g.save(); g.fillStyle = rgba(c.panel, 0.94); g.shadowColor = rgba('#000', 0.18); g.shadowBlur = 16; g.beginPath(); g.roundRect(X(cx - R - 0.45), Y(cy - R - 0.85), (2 * R + 0.9) * v.K, (R + 1.95) * v.K, 0.25 * v.K); g.fill(); g.restore();
      g.lineWidth = 0.22 * v.K;
      g.strokeStyle = rgba(c.campo, 0.85); g.beginPath(); g.arc(X(cx), Y(cy), R * v.K, ang(0), ang(RUPTURA)); g.stroke();
      g.strokeStyle = c.pos; g.beginPath(); g.arc(X(cx), Y(cy), R * v.K, ang(RUPTURA), ang(emax)); g.stroke();
      g.strokeStyle = c.rotulo; g.lineWidth = 1;
      for (let e = 0; e <= 6; e++) { const a = ang(e * 1e6); g.beginPath(); g.moveTo(X(cx + (R - 0.2) * Math.cos(a)), Y(cy + (R - 0.2) * Math.sin(a))); g.lineTo(X(cx + (R - 0.38) * Math.cos(a)), Y(cy + (R - 0.38) * Math.sin(a))); g.stroke(); rotulo(String(e), cx + (R - 0.6) * Math.cos(a), cy + (R - 0.6) * Math.sin(a), { al: 'center', fondo: false, tam: 10.5 }); }
      const a = ang(E); g.strokeStyle = c.rotulo; g.lineWidth = Math.max(2, 0.06 * v.K); g.lineCap = 'round';
      g.beginPath(); g.moveTo(X(cx), Y(cy)); g.lineTo(X(cx + (R - 0.15) * Math.cos(a)), Y(cy + (R - 0.15) * Math.sin(a))); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = c.rotulo; g.beginPath(); g.arc(X(cx), Y(cy), 0.09 * v.K, 0, 2 * Math.PI); g.fill();
      rotulo('E next to the tip (MV/m)', cx, cy - R - 0.5, { al: 'center', fondo: false, tam: 12, peso: 600, escribe: tramo(t, 0.2, 0.45) });
      rotulo(`${(E / 1e6).toFixed(1).replace('.', '.')} MV/m`, cx, cy + 0.42, { al: 'center', fondo: false, tam: 14, peso: 700, color: E > RUPTURA ? c.pos : c.rotulo });
      rotulo('hull: 0.05 MV/m · air: 3 MV/m', cx, cy + 0.82, { al: 'center', fondo: false, tam: 10.5, escribe: tramo(t, 0.5, 0.8) });
      if (E > RUPTURA) rotulo('The air breaks down!', cx, cy - R - 1.15, { al: 'center', tam: 13, peso: 700, color: c.pos, escribe: tramo(t, 0.75, 0.95) });
    }
    function brillo() {
      const a = suave(tramo(t, 0.2, 0.9)), Ep = V / (prueba.R / 100), fuerza = Math.min(1.3, Math.max(0, (Ep / RUPTURA - 1) / 0.6));
      const puntos = [[...PUNTA_A, 1], [...PUNTA_B, 0.85], [5.9, 4, 0.5], [8.1, 4, 0.5], [8.8, 4.9, 0.45], [10.4, 4.9, 0.45]];
      g.globalCompositeOperation = 'lighter';
      const P = B(PUNTA_A, bal), luz = g.createRadialGradient(X(P[0]), Y(P[1]), 0, X(P[0]), Y(P[1]), 3.2 * v.K);
      luz.addColorStop(0, rgba(c.brillo, 0.22 * a * fuerza)); luz.addColorStop(1, rgba(c.brillo, 0)); g.fillStyle = luz; g.fillRect(0, 0, w, h);
      puntos.forEach(([x0p, y0p, s], j) => {
        const [x, y] = B([x0p, y0p], bal), p = s * fuerza * (1 + 0.18 * Math.sin(reloj * 13 + j) + 0.1 * Math.sin(reloj * 31 + 2 * j)), r = 0.75 * p * v.K;
        if (r < 0.5) return;
        const halo = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), 2.2 * r);
        halo.addColorStop(0, rgba(c.brillo, 0.35 * a)); halo.addColorStop(1, rgba(c.brillo, 0)); g.fillStyle = halo; g.beginPath(); g.arc(X(x), Y(y), 2.2 * r, 0, 2 * Math.PI); g.fill();
        const gr = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r);
        gr.addColorStop(0, rgba(c['brillo-centro'], 0.95 * a)); gr.addColorStop(0.35, rgba(c.brillo, 0.7 * a)); gr.addColorStop(1, rgba(c.brillo, 0));
        g.fillStyle = gr; g.beginPath(); g.arc(X(x), Y(y), r, 0, 2 * Math.PI); g.fill();
        g.strokeStyle = rgba(c['brillo-centro'], 0.8 * a); g.lineWidth = 1.2;
        for (let q = 0; q < 7; q++) {
          const an = -Math.PI / 2 + (q - 3) * 0.45 + 0.25 * Math.sin(reloj * 7 + q * 3 + j), L = (0.25 + 0.35 * azar(Math.floor(reloj * 12) + q * 7 + j * 31)) * p;
          g.beginPath(); g.moveTo(X(x), Y(y));
          for (let s2 = 1; s2 <= 3; s2++) { const d = (L * s2) / 3, z = (azar(q + s2 * 13 + Math.floor(reloj * 20)) - 0.5) * 0.12; g.lineTo(X(x + d * Math.cos(an) + z), Y(y + d * Math.sin(an) + z)); }
          g.stroke();
        }
        for (let q = 0; q < 4; q++) { const u = (reloj * 0.5 + q / 4 + azar(j * 9 + q)) % 1; punto(x + (azar(j + q * 5) - 0.5) * 0.5 * u, y - 0.9 * u * p, 0.03, c['brillo-centro'], a * (1 - u) * Math.min(1, p)); }
      });
      g.globalCompositeOperation = 'source-over';
      if (fuerza > 0.05) rotulo('St. Elmo\'s fire', P[0] + 0.4, P[1] - 0.75, { color: c.brillo, peso: 600, tam: 14, escribe: tramo(t, 0.5, 0.8) });
    }
    function lecturaPrueba() {
      const Ep = V / (prueba.R / 100), si = Ep > RUPTURA;
      rotulo(`Tip of ${prueba.R.toFixed(1).replace('.', '.')} cm: E = ${(Ep / 1e6).toFixed(1).replace('.', '.')} MV/m`, Math.min(v.x1 - 0.3, 15.7), 0.55, { al: 'right', tam: 12.5, peso: 600, color: si ? c.brillo : c.rotulo });
    }
    function avalancha() {
      g.fillStyle = c.cielo; g.fillRect(0, 0, w, h);
      const P = [8, 5.2], u = suave(tramo(t, 0, 0.5));
      const lat = 1 + 0.03 * Math.sin(reloj * 4);
      g.globalAlpha *= 1; g.fillStyle = rgba(c.brillo, 0.16 * u); g.beginPath(); g.arc(X(P[0]), Y(P[1]), 1.9 * lat * v.K, 0, 2 * Math.PI); g.fill();
      g.strokeStyle = rgba(c.brillo, u); g.setLineDash([5, 4]); g.lineWidth = 1.5; g.stroke(); g.setLineDash([]);
      for (let j = 0; j < 46; j++) {
        const an = -Math.PI * azar(j), r = 0.6 + 4.6 * azar(j + 50), x = P[0] + r * Math.cos(an) * 1.5 + 0.03 * Math.sin(reloj * 3 + j), y = P[1] + r * Math.sin(an) + 0.03 * Math.cos(reloj * 2.6 + j);
        if (y > P[1] + 0.2 || y < 0.3) continue;
        const cerca2 = Math.hypot((x - P[0]) / 1.4, y - P[1]) < 1.9, ex = cerca2 && azar(j + Math.floor(reloj * 5)) > 0.6;
        if (ex) { const gr = g.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), 0.35 * v.K); gr.addColorStop(0, rgba(c.brillo, 0.55 * u)); gr.addColorStop(1, rgba(c.brillo, 0)); g.fillStyle = gr; g.beginPath(); g.arc(X(x), Y(y), 0.35 * v.K, 0, 2 * Math.PI); g.fill(); }
        g.fillStyle = c.molecula; g.beginPath(); g.arc(X(x - 0.07), Y(y), 0.09 * v.K, 0, 2 * Math.PI); g.arc(X(x + 0.07), Y(y), 0.09 * v.K, 0, 2 * Math.PI); g.fill();
      }
      g.fillStyle = c.metal; g.beginPath(); g.moveTo(X(6.6), Y(9)); g.lineTo(X(7.75), Y(P[1] + 0.25)); g.quadraticCurveTo(X(8), Y(P[1] - 0.15), X(8.25), Y(P[1] + 0.25)); g.lineTo(X(9.4), Y(9)); g.closePath(); g.fill();
      for (const [x, y] of [[8, P[1] + 0.2], [7.6, P[1] + 0.9], [8.4, P[1] + 0.9], [7.2, P[1] + 1.8], [8.8, P[1] + 1.8]]) signo(x, y, 1, c.pos);
      const n = Math.round(4 + 10 * u);
      for (let j = 0; j < n; j++) {
        const an = -Math.PI * (0.12 + 0.76 * azar(j + 200)), q = (reloj * (0.35 + 0.2 * azar(j + 300)) + azar(j + 400)) % 1;
        const r = 0.3 + 4.2 * (1 - q) ** 2, hijos = r < 1.9 ? (r < 1.1 ? 4 : 2) : 1;
        for (let m = 0; m < hijos; m++) {
          const da = (m - (hijos - 1) / 2) * 0.09 * (1.9 - Math.min(1.9, r)), x = P[0] + r * Math.cos(an + da) * 1.4, y = P[1] + r * Math.sin(an + da);
          const r2 = r + 0.25 + 0.3 * (1 - q), xe = P[0] + r2 * Math.cos(an + da) * 1.4, ye = P[1] + r2 * Math.sin(an + da);
          g.strokeStyle = rgba(c.neg, 0.35); g.lineWidth = 0.05 * v.K; g.beginPath(); g.moveTo(X(xe), Y(ye)); g.lineTo(X(x), Y(y)); g.stroke();
          g.fillStyle = c.neg; g.beginPath(); g.arc(X(x), Y(y), 0.07 * v.K, 0, 2 * Math.PI); g.fill();
        }
      }
      rotulo('Zone with E > 3 MV/m: avalanche', P[0] + 2.1, P[1] - 1.75, { color: c.brillo, peso: 600, escribe: paso === 4 ? tramo(t, 0.4, 0.75) : 1 });
      g.fillStyle = c.neg; g.beginPath(); g.arc(X(v.x0 + 0.6), Y(0.7), 0.08 * v.K, 0, 2 * Math.PI); g.fill(); rotulo('electron', v.x0 + 0.85, 0.7, { fondo: false, tam: 12 });
      g.fillStyle = c.molecula; g.beginPath(); g.arc(X(v.x0 + 0.53), Y(1.25), 0.08 * v.K, 0, 2 * Math.PI); g.arc(X(v.x0 + 0.67), Y(1.25), 0.08 * v.K, 0, 2 * Math.PI); g.fill(); rotulo('N₂ or O₂ molecule', v.x0 + 0.85, 1.25, { fondo: false, tam: 12 });
    }
  }

  function sonido(ac) {
    const ruido = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = ruido.getChannelData(0);
    for (let j = 0; j < d.length; j++) d[j] = Math.random() * 2 - 1;
    const fuente = (filtro, f, q = 0.7) => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), v = ac.createGain(); s.buffer = ruido; s.loop = true; fl.type = filtro; fl.frequency.value = f; fl.Q.value = q; v.gain.value = 0; s.connect(fl).connect(v).connect(ac.destination); s.start(); return v; };
    const lluvia = fuente('lowpass', 1400), chispa = fuente('bandpass', 3200, 0.9);
    let ultimo = -1;
    return {
      cuadro({ paso, t, reloj }) {
        const ahora = ac.currentTime, Ep = V / (prueba.R / 100), fuerza = paso === 4 ? 0.6 : paso === 5 ? Math.min(1.3, Math.max(0, (Ep / RUPTURA - 1) / 0.6)) * suave(t) : 0;
        lluvia.gain.setTargetAtTime(paso === 4 ? 0.01 : 0.05, ahora, 0.3);
        chispa.gain.setTargetAtTime(fuerza * (Math.random() < 0.25 ? 0.12 + 0.25 * Math.random() : 0.015), ahora, 0.01);
        const n = Math.floor(reloj / CICLO_RAYO);
        if (n !== ultimo && reloj - n * CICLO_RAYO < 0.3 && paso !== 2 && paso !== 4) {
          ultimo = n;
          const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), v = ac.createGain(); s.buffer = ruido; fl.type = 'lowpass'; fl.frequency.value = 160;
          v.gain.setValueAtTime(0, ahora + 0.5); v.gain.linearRampToValueAtTime(0.7, ahora + 0.65); v.gain.exponentialRampToValueAtTime(0.001, ahora + 3.2);
          s.connect(fl).connect(v).connect(ac.destination); s.start(ahora + 0.5); s.stop(ahora + 3.3);
        }
      },
    };
  }

  const COLORES = ['cielo', 'cielo-alto', 'cielo-noche', 'mar', 'ola', 'lluvia', 'rayo', 'nube', 'casco', 'mastil', 'vela', 'metal', 'neg', 'pos', 'campo', 'brillo', 'brillo-centro', 'molecula', 'rotulo', 'panel'];
  return { datos, pasos, dibuja, sonido, COLORES, escenaElectrostatica, ejercicio, abrirEnElectrostatica };
})();

if (typeof document !== 'undefined') {
  Animacion.monta({ lienzo: '#escena', pasos: FuegoSanTelmo.pasos, dibuja: FuegoSanTelmo.dibuja, colores: FuegoSanTelmo.COLORES, sonido: FuegoSanTelmo.sonido });
  document.querySelector('#abrir').addEventListener('click', (e) => { e.preventDefault(); FuegoSanTelmo.abrirEnElectrostatica(e.currentTarget.getAttribute('href')); });
}

