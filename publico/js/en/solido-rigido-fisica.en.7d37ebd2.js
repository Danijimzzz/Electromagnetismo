const Solido = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-10) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const RAD = Math.PI / 180;
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false, max = Infinity, libre = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} must be a number`);
    if (!libre && (cero ? v < 0 : v <= 0)) throw new Error(`${may(nom)} must be ${cero ? 'positive or zero' : 'greater than 0'}`);
    if (v > max) throw new Error(`${may(nom)} cannot exceed ${f(max)}`);
    return v;
  }

  const CUERPOS = {
    'esfera': { nombre: 'Solid sphere', k: 2 / 5, kTxt: '2/5', formula: '2/5 M R^2', med: 'R', medNom: 'Radius R', rueda: true, eje: 'a diameter' },
    'esfera-hueca': { nombre: 'Hollow sphere (shell)', k: 2 / 3, kTxt: '2/3', formula: '2/3 M R^2', med: 'R', medNom: 'Radius R', rueda: true, eje: 'a diameter' },
    'cilindro': { nombre: 'Solid cylinder or disc', k: 1 / 2, kTxt: '1/2', formula: '1/2 M R^2', med: 'R', medNom: 'Radius R', rueda: true, eje: 'its axis' },
    'aro': { nombre: 'Thin hoop or hollow cylinder', k: 1, kTxt: '1', formula: 'M R^2', med: 'R', medNom: 'Radius R', rueda: true, eje: 'its axis' },
    'varilla': { nombre: 'Thin rod', k: 1 / 12, kTxt: '1/12', formula: '1/12 M L^2', med: 'L', medNom: 'Length L', rueda: false, eje: 'perpendicular through the centre' },
    'placa': { nombre: 'Rectangular plate (a × b)', placa: true, formula: '1/12 M(a^2 + b^2)', med: 'a', medNom: 'Side a', rueda: false, eje: 'perpendicular through the centre' },
    'disco-diametro': { nombre: 'Disc (axis through a diameter)', k: 1 / 4, kTxt: '1/4', formula: '1/4 M R^2', med: 'R', medNom: 'Radius R', rueda: false, eje: 'a diameter' },
  };
  const kPor = (C) => (C.kTxt === '1' ? '' : `${C.kTxt} · `);
  function Icm(C, M, L, b) {
    if (C.placa) return { I: (M * (L * L + b * b)) / 12, html: `$I_cm = 1/12 M(a^2 + b^2) = 1/12 · ${f(M)} · (${f(L)}^2 + ${f(b)}^2)$` };
    return { I: C.k * M * L * L, html: `$I_cm = ${C.formula} = ${kPor(C)}${f(M)} · ${f(L)}^2$` };
  }
  const kgm2 = (x) => `<b>${f(x)} kg·m²</b>`;

  function inercia(sc) {
    const C = CUERPOS[sc.cuerpo] || CUERPOS.esfera;
    const M = lee(sc, 'M', 'the mass'), L = lee(sc, 'L', C.medNom.toLowerCase()), d = lee(sc, 'd', 'the distance from the axis to the centre of mass', { opcional: true, cero: true }) ?? 0;
    const b = C.placa ? lee(sc, 'b', 'the side b') : null, ic = Icm(C, M, L, b);
    const pasos = [{ t: `Moment of inertia about an axis through the centre of mass (${C.eje})`, html: `${ic.html} = ${kgm2(ic.I)}` }];
    const I = ic.I + M * d * d;
    if (d) pasos.push({ t: 'Steiner theorem (parallel axes)', html: `$I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$ = ${kgm2(I)}${sc.cuerpo === 'varilla' && Math.abs(d - L / 2) < 1e-12 ? ' (about one end: $1/3 M L^2$)' : ''}` });
    pasos.push({ t: 'Radius of gyration', html: `$k = √(I/M) = √(${f(I)}/${f(M)})$ = <b>${f(Math.sqrt(I / M))} m</b>: it is the distance at which all the mass would have to be concentrated to have the same I.` });
    return { modo: 'inercia', C, M, L, b, d, Icm: ic.I, I, pasos };
  }

  function compuesto(sc) {
    const lineas = String(sc.piezas || '').split(/\n|;/).map((x) => x.trim()).filter(Boolean);
    if (!lineas.length) throw new Error('Enter at least one piece: “type mass size distance”');
    const piezas = lineas.map((l, i) => {
      const [tipo, ...nums] = l.split(/\s+/), v = nums.map(leeNum), quien = `Piece ${i + 1}`;
      if (v.some((x) => !isFinite(x))) throw new Error(`${quien}: the data must be numbers`);
      if (tipo === 'punto') {
        if (v.length < 2) throw new Error(`${quien}: a point mass takes “punto mass distance”`);
        const [M, d] = v; if (M <= 0 || d < 0) throw new Error(`${quien}: the mass must be positive and the distance cannot be negative`);
        return { nombre: 'Point mass', M, d, Icm: 0, html: `$I = M d^2 = ${f(M)} · ${f(d)}^2$`, I: M * d * d };
      }
      const C = CUERPOS[tipo];
      if (!C) throw new Error(`${quien}: “${tipo}” is not a body (use ${Object.keys(CUERPOS).join(', ')} or punto)`);
      if (v.length < (C.placa ? 4 : 3)) throw new Error(`${quien}: takes “${tipo} mass size distance${C.placa ? ' b' : ''}”`);
      const [M, L, d, b] = v; if (M <= 0 || L <= 0 || d < 0 || (C.placa && !(b > 0))) throw new Error(`${quien}: mass and sizes positive, distance not negative`);
      const ic = Icm(C, M, L, b);
      return { nombre: C.nombre, M, d, Icm: ic.I, I: ic.I + M * d * d, html: `${ic.html} = ${f(ic.I)} ⇒ $I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$` };
    });
    const I = piezas.reduce((s, p) => s + p.I, 0), M = piezas.reduce((s, p) => s + p.M, 0);
    const pasos = piezas.map((p, i) => ({ t: `${i + 1}. ${p.nombre} (${f(p.M)} kg at ${f(p.d)} m from the axis)`, html: `${p.html} = ${kgm2(p.I)}` }));
    pasos.push({ t: 'Sum: the moment of inertia is additive', html: `$I = ${piezas.map((p) => f(p.I)).join(' + ')}$ = ${kgm2(I)}, with total mass ${f(M)} kg and radius of gyration $k = √(I/M)$ = ${f(Math.sqrt(I / M))} m.` });
    return { modo: 'compuesto', piezas, I, M, pasos };
  }

  function rodadura(sc) {
    const C = CUERPOS[sc.cuerpo];
    if (!C || !C.rueda) throw new Error('To roll, choose a sphere, a cylinder or a hoop');
    const g = lee(sc, 'g', 'gravity'), M = lee(sc, 'M', 'the mass'), R = lee(sc, 'L', 'the radius'), th = lee(sc, 'theta', 'the angle of the plane', { max: 89.9 }), d = lee(sc, 'd', 'the distance travelled');
    const mu = lee(sc, 'mu', 'the coefficient of static friction', { opcional: true, cero: true });
    const t = th * RAD, k = C.k, a = (g * Math.sin(t)) / (1 + k), Fr = k * M * a, h = d * Math.sin(t), v = Math.sqrt(2 * a * d), tt = Math.sqrt((2 * d) / a);
    const muMin = (Math.tan(t) * k) / (1 + k), N = M * g * Math.cos(t);
    const Krot = 0.5 * k * M * v * v, Ktras = 0.5 * M * v * v;
    const pasos = [
      { t: 'Moment of inertia', html: `${C.nombre}: $I = ${C.formula}$ = ${kgm2(k * M * R * R)}, that is $I/(M R^2) = ${C.kTxt}$` },
      { t: 'Equations of motion (wheel without slipping: a = αR)', html: `Translation: $M g sin θ − F_f = M a$<br>Rotation about the centre: $F_f R = I α = I a/R ⇒ F_f = I a/R^2$<br>Adding: $M g sin θ = (M + I/R^2) a ⇒ a = {g sin θ}/(1 + I/(M R^2)) = {${f(g)} · sin ${f(th)}°}/(1 + ${C.kTxt})$ = <b>${f(a)} m/s²</b>` },
      { t: 'Friction needed', html: `$F_f = I a/R^2 = ${kPor(C)}${f(M)} · ${f(a)}$ = <b>${f(Fr)} N</b> (static: it does no work, the contact point does not move)<br>To roll without slipping you need $μ_s ≥ F_f/N = tan θ · {I/(M R^2)}/{1 + I/(M R^2)}$ = <b>${f(muMin)}</b>${mu !== null ? `; with $μ_s = ${f(mu)}$ ${mu >= muMin ? '<b>it does roll without slipping</b>' : '<b>not enough: it slips and spins at the same time</b> (the above would hold if it rolled; below is what really happens)'}` : ''}` },
      { t: `By energy, after travelling ${f(d)} m (it drops h = d sin θ = ${f(h)} m)`, html: `$M g h = 1/2 M v^2 + 1/2 I ω^2 = 1/2 (M + I/R^2) v^2 ⇒ v = √({2 g h}/{1 + I/(M R^2)})$ = <b>${f(v)} m/s</b>, $ω = v/R$ = ${f(v / R)} rad/s<br>$t = √(2d/a)$ = <b>${f(tt)} s</b>` },
      { t: 'Distribution of the kinetic energy', html: `Translation $1/2 M v^2$ = ${f(Ktras)} J; rotation $1/2 I ω^2$ = ${f(Krot)} J (${f((100 * k) / (1 + k), 3)}% of the total). The larger $I/(M R^2)$ is, the more energy goes into spinning and the more slowly it descends: the solid sphere beats the hollow one, the cylinder and the hoop, whatever their mass and radius.` },
    ];
    let desliza = null;
    if (mu !== null && mu < muMin) {
      const a2 = g * (Math.sin(t) - mu * Math.cos(t)), I = k * M * R * R, al2 = (mu * N * R) / I, t2 = Math.sqrt((2 * d) / a2), v2 = a2 * t2, w2 = al2 * t2;
      const Q = M * g * h - 0.5 * M * v2 * v2 - 0.5 * I * w2 * w2;
      desliza = { a: a2, al: al2, t: t2, v: v2, w: w2, Q };
      pasos.push({ t: 'Since friction is not enough, it slips while spinning', html: `Kinetic friction (we take $μ_k = μ_s$): $F_f = μ N = ${f(mu)} · ${f(N)}$ = ${f(mu * N)} N<br>Translation: $a = g(sin θ − μ cos θ)$ = <b>${f(a2)} m/s²</b>; rotation: $α = F_f R/I$ = <b>${f(al2)} rad/s²</b>, and $α R = ${f(al2 * R)} "m/s²" < a$<br>At the end of the plane: t = ${f(t2)} s, v = <b>${f(v2)} m/s</b>, ω = ${f(w2)} rad/s (less than v/R = ${f(v2 / R)} rad/s); ${f(Q)} J are lost as heat through friction.` });
    }
    const carrera = Object.entries(CUERPOS).filter(([, c]) => c.rueda).map(([kk, c]) => ({ k: kk, nombre: c.nombre, a: (g * Math.sin(t)) / (1 + c.k), v: Math.sqrt((2 * g * h) / (1 + c.k)), t: Math.sqrt((2 * d * (1 + c.k)) / (g * Math.sin(t))) }));
    const A = desliza ? desliza.a : a, Al = desliza ? desliza.al : a / R, T = desliza ? desliza.t : tt;
    const mov = (x) => { const u = Math.min(Math.max(x, 0), T); return { s: 0.5 * A * u * u, phi: 0.5 * Al * u * u, v: A * u }; };
    return { modo: 'rodadura', C, g, M, R, th, d, mu, a, Fr, N, v, w: v / R, t: tt, h, muMin, rueda: mu === null || mu >= muMin, desliza, Krot, Ktras, carrera, pasos, mov, T };
  }

  function polea(sc) {
    const C = CUERPOS[sc.cuerpo] && CUERPOS[sc.cuerpo].rueda ? CUERPOS[sc.cuerpo] : CUERPOS.cilindro;
    const g = lee(sc, 'g', 'gravity'), M = lee(sc, 'M', 'the mass of the pulley'), R = lee(sc, 'L', 'the radius of the pulley'), m = lee(sc, 'm', 'the hanging mass'), d = lee(sc, 'd', 'the height it drops');
    const I = C.k * M * R * R, a = (m * g) / (m + I / (R * R)), T = m * (g - a), al = a / R, v = Math.sqrt(2 * a * d), tt = Math.sqrt((2 * d) / a);
    const pasos = [
      { t: 'Moment of inertia of the pulley', html: `${C.nombre}: $I = ${C.formula} = ${kPor(C)}${f(M)} · ${f(R)}^2$ = ${kgm2(I)}` },
      { t: 'Equations (the rope does not slip: a = αR)', html: `Hanging body: $m g − T = m a$<br>Pulley: $T R = I α = I a/R ⇒ T = I a/R^2$<br>Adding: $m g = (m + I/R^2) a ⇒ a = {${f(m)} · ${f(g)}}/{${f(m)} + ${f(I / (R * R))}}$ = <b>${f(a)} m/s²</b>` },
      { t: 'Tension and angular acceleration', html: `$T = m(g − a) = ${f(m)} · (${f(g)} − ${f(a)})$ = <b>${f(T)} N</b> (less than the weight, ${f(m * g)} N)<br>$α = a/R$ = <b>${f(al)} rad/s²</b>` },
      { t: `After dropping ${f(d)} m`, html: `$v = √(2 a d)$ = <b>${f(v)} m/s</b>, $ω = v/R$ = ${f(v / R)} rad/s, $t = √(2d/a)$ = ${f(tt)} s<br>Energy: $m g h$ = ${f(m * g * d)} J = $1/2 m v^2 + 1/2 I ω^2$ = ${f(0.5 * m * v * v)} + ${f(0.5 * I * (v / R) ** 2)} J` },
    ];
    const mov = (x) => { const u = Math.min(Math.max(x, 0), tt); return { y: 0.5 * a * u * u, phi: (0.5 * a * u * u) / R, v: a * u }; };
    return { modo: 'polea', C, g, M, R, m, d, I, a, T, al, v, w: v / R, t: tt, pasos, mov, T_: tt };
  }

  const aRad = (w, rpm) => (rpm ? (w * 2 * Math.PI) / 60 : w), deRad = (W, rpm) => (rpm ? (W * 60) / (2 * Math.PI) : W);
  function momento(sc) {
    const I1 = lee(sc, 'I1', 'the initial moment of inertia'), I2 = lee(sc, 'I2', 'the final moment of inertia'), w1 = lee(sc, 'w1', 'the initial angular velocity');
    const rpm = sc.unidad !== 'rad', W1 = aRad(w1, rpm), W2 = (I1 * W1) / I2, w2 = deRad(W2, rpm);
    const L = I1 * W1, K1 = 0.5 * I1 * W1 * W1, K2 = 0.5 * I2 * W2 * W2, un = rpm ? 'rpm' : 'rad/s';
    const pasos = [
      { t: 'With no external moment of force, L is conserved', html: `$I_1 ω_1 = I_2 ω_2 ⇒ ω_2 = ω_1 · I_1/I_2 = ${f(w1)} · ${f(I1)}/${f(I2)}$ = <b>${f(w2)} ${un}</b>${rpm ? ` (= ${f(W2)} rad/s)` : ''}` },
      { t: 'Angular momentum', html: `$L = I_1 ω_1 = ${f(I1)} · ${f(W1)}$ = <b>${f(L)} kg·m²/s</b>${rpm ? ` (with ω₁ = ${f(w1)} rpm = ${f(W1)} rad/s)` : ''}` },
      { t: 'The rotational kinetic energy is not conserved', html: `$K_1 = 1/2 I_1 ω_1^2$ = ${f(K1)} J, $K_2 = 1/2 I_2 ω_2^2$ = ${f(K2)} J ⇒ ΔK = <b>${f(K2 - K1)} J</b> ($K_2/K_1 = I_1/I_2$ = ${f(I1 / I2)}). ${K2 > K1 ? 'When pulling in it gains energy: it is supplied by the work of the muscles or of whoever pulls inwards.' : K2 < K1 ? 'Energy is lost, as in an inelastic rotational collision.' : ''}` },
    ];
    return { modo: 'momento', I1, I2, w1, w2, W1, W2, L, K1, K2, rpm, pasos };
  }

  function choque(sc) {
    const m = lee(sc, 'm', sc.tipo === 'plataforma' ? 'the mass of the person' : 'the mass of the bullet'), M = lee(sc, 'M', sc.tipo === 'plataforma' ? 'the mass of the platform' : 'the mass of the rod');
    const L = lee(sc, 'L', sc.tipo === 'plataforma' ? 'the radius of the platform' : 'the length of the rod'), r = lee(sc, 'r', 'the distance to the axis', { cero: true });
    const pasos = [];
    if (sc.tipo === 'plataforma') {
      if (r > L) throw new Error('The person has to land inside the platform (r ≤ R)');
      const w1 = lee(sc, 'w1', 'the angular velocity of the platform', { cero: true }), v = lee(sc, 'v', 'the speed of the person', { libre: true, opcional: true }) ?? 0;
      const Ip = 0.5 * M * L * L, W1 = aRad(w1, true), L1 = Ip * W1 + m * v * r, I2 = Ip + m * r * r, W2 = L1 / I2;
      const K1 = 0.5 * Ip * W1 * W1 + 0.5 * m * v * v, K2 = 0.5 * I2 * W2 * W2;
      pasos.push({ t: 'Angular momentum before', html: `Platform (disc): $I_p = 1/2 M R^2 = 1/2 · ${f(M)} · ${f(L)}^2$ = ${f(Ip)} kg·m², $ω_1$ = ${f(w1)} rpm = ${f(W1)} rad/s<br>Person: $m v r = ${f(m)} · ${f(v)} · ${f(r)}$ = ${f(m * v * r)} kg·m²/s ${v ? '(tangent to the rim, in the direction of rotation if positive)' : '(lands with no tangential velocity)'}<br>$L = I_p ω_1 + m v r$ = <b>${f(L1)} kg·m²/s</b>` });
      pasos.push({ t: 'Afterwards they rotate together', html: `$I_2 = I_p + m r^2 = ${f(Ip)} + ${f(m)} · ${f(r)}^2$ = ${f(I2)} kg·m² ⇒ $ω_2 = L/I_2$ = <b>${f(W2)} rad/s = ${f(deRad(W2, true))} rpm</b>` });
      pasos.push({ t: 'Energy', html: `$K_1$ = ${f(K1)} J → $K_2 = 1/2 I_2 ω_2^2$ = ${f(K2)} J: <b>${f(K1 - K2)} J</b> are lost, as in every perfectly inelastic collision.` });
      return { modo: 'choque', tipo: 'plataforma', M, L, m, r, v, Ip, I2, W1, W2, w2: deRad(W2, true), L1, K1, K2, pasos };
    }
    if (r > L) throw new Error('The bullet has to hit the rod (r ≤ L)');
    const g = lee(sc, 'g', 'gravity'), v = lee(sc, 'v', 'the speed of the bullet');
    const Iv = (M * L * L) / 3, I = Iv + m * r * r, W = (m * v * r) / I, K0 = 0.5 * m * v * v, K1 = 0.5 * I * W * W;
    const dcm = (M * L / 2 + m * r) / (M + m), c = 1 - K1 / ((M + m) * g * dcm), vuelta = c < -1;
    const sube = vuelta ? null : Math.acos(c) / RAD;
    pasos.push({ t: 'Angular momentum about the pivot', html: `Just before, only the bullet is moving: $L = m v r = ${f(m)} · ${f(v)} · ${f(r)}$ = <b>${f(m * v * r)} kg·m²/s</b>. During the collision the pivot exerts a force, but no moment about itself: L is conserved (linear momentum is not).` });
    pasos.push({ t: 'Angular velocity after the collision', html: `$I = 1/3 M L^2 + m r^2 = ${f(Iv)} + ${f(m)} · ${f(r)}^2$ = ${f(I)} kg·m² ⇒ $ω = {m v r}/I$ = <b>${f(W)} rad/s</b>` });
    pasos.push({ t: 'Energy lost in the collision', html: `$K_0 = 1/2 m v^2$ = ${f(K0)} J → $K = 1/2 I ω^2$ = ${f(K1)} J: <b>${f(100 * (1 - K1 / K0), 3)}%</b> is lost.` });
    pasos.push({ t: 'How high it rises', html: `The centre of mass is at $d = {M L/2 + m r}/{M + m}$ = ${f(dcm)} m from the pivot. After the collision energy is conserved: $(M + m) g d (1 − cos θ) = 1/2 I ω^2 ⇒ cos θ = ${f(c)}$ ⇒ ${vuelta ? '<b>it goes right round</b> (there is energy to spare to pass over the top)' : `<b>θ = ${f(sube)}°</b>`}` });
    return { modo: 'choque', tipo: 'bala', M, L, m, r, v, g, I, W, K0, K1, dcm, sube, vuelta, pasos };
  }

  function pendulo(sc) {
    const C = CUERPOS[sc.cuerpo] || CUERPOS.varilla;
    const g = lee(sc, 'g', 'gravity'), M = lee(sc, 'M', 'the mass'), L = lee(sc, 'L', C.medNom.toLowerCase()), d = lee(sc, 'd', 'the distance from the pivot to the centre of mass');
    const b = C.placa ? lee(sc, 'b', 'the side b') : null, ic = Icm(C, M, L, b), I = ic.I + M * d * d, K = (M * g * d) / I;
    const pasos = [{ t: 'Moment of inertia about the pivot', html: `${ic.html} = ${f(ic.I)} ⇒ $I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$ = ${kgm2(I)}` }];
    const simula = (th0, signo, tmax, hasta) => {
      const P = [{ t: 0, th: th0, w: 0 }], dt = Math.min(0.002, tmax / 4000);
      let s = P[0];
      for (let n = 0; n * dt < tmax; n++) {
        const fz = (th) => signo * K * Math.sin(th);
        const k1 = [s.w, fz(s.th)], k2 = [s.w + (dt / 2) * k1[1], fz(s.th + (dt / 2) * k1[0])], k3 = [s.w + (dt / 2) * k2[1], fz(s.th + (dt / 2) * k2[0])], k4 = [s.w + dt * k3[1], fz(s.th + dt * k3[0])];
        s = { t: s.t + dt, th: s.th + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), w: s.w + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) };
        P.push(s);
        if (hasta !== undefined && s.th >= hasta) break;
      }
      return P;
    };
    const enT = (P) => (x) => { const T = P[P.length - 1].t, u = Math.min(Math.max(x, 0), T), dt = P[1].t; const i = Math.min(P.length - 2, Math.floor(u / dt)); const a = P[i], z = P[i + 1], q = (u - a.t) / dt; return { th: a.th + (z.th - a.th) * q, w: a.w + (z.w - a.w) * q }; };
    if (sc.tipo === 'cae') {
      const th0 = lee(sc, 'th0', 'the initial angle', { cero: true, max: 179 }), th = lee(sc, 'th', 'the final angle', { max: 180 });
      if (th <= th0) throw new Error('The final angle must be greater than the initial one');
      const w = Math.sqrt(2 * K * (Math.cos(th0 * RAD) - Math.cos(th * RAD))), al = K * Math.sin(th * RAD), punta = sc.cuerpo === 'varilla' ? d + L / 2 : d;
      pasos.push({ t: 'Energy: it falls from the top', html: `The centre of mass drops $d(cos θ_0 − cos θ)$ (angles measured from the vertical above the pivot): $M g d (cos θ_0 − cos θ) = 1/2 I ω^2 ⇒ ω = √({2 M g d (cos θ_0 − cos θ)}/I)$ = <b>${f(w)} rad/s</b>` });
      pasos.push({ t: 'Angular acceleration at that instant', html: `$τ = M g d sin θ = I α ⇒ α = {M g d sin θ}/I$ = <b>${f(al)} rad/s²</b>. ${sc.cuerpo === 'varilla' ? `The free end (at ${f(punta)} m) has $a_t = α r$ = <b>${f(al * punta)} m/s²</b>${al * punta > g * Math.sin(th * RAD) ? `, more than the component of g in that direction (${f(g * Math.sin(th * RAD))} m/s²): a coin on the tip would be left behind` : ''}.` : ''}` });
      const P = simula(Math.max(th0, 0.5) * RAD, 1, 30, th * RAD);
      return { modo: 'pendulo', tipo: 'cae', C, M, L, b, d, I, w, al, punta, th0, th, pasos, mov: enT(P), T: P[P.length - 1].t };
    }
    const th0 = lee(sc, 'th0', 'the amplitude', { opcional: true, max: 179 }) ?? 10;
    const T = 2 * Math.PI * Math.sqrt(I / (M * g * d)), Leq = I / (M * d), wmax = Math.sqrt(2 * K * (1 - Math.cos(th0 * RAD)));
    pasos.push({ t: 'Period of small oscillations', html: `$τ = −M g d sin θ ≈ −M g d θ = I α ⇒ ω_0 = √({M g d}/I)$ = ${f(Math.sqrt(K))} rad/s ⇒ $T = 2π √(I/(M g d))$ = <b>${f(T)} s</b>` });
    pasos.push({ t: 'Equivalent length', html: `It oscillates just like a simple pendulum of length $L_eq = I/(M d)$ = <b>${f(Leq)} m</b>. If it is hung at $L_eq$ from the pivot, on the other side of the centre of mass, the period is the same (centre of oscillation).` });
    pasos.push({ t: `Released from ${f(th0)}°`, html: `Passing through the bottom: $1/2 I ω^2 = M g d (1 − cos θ_0) ⇒ ω_max$ = <b>${f(wmax)} rad/s</b>${th0 > 20 ? '. With this amplitude the real period is somewhat longer than that of small oscillations (visible in the animation).' : '.'}` });
    const P = simula(th0 * RAD, -1, 2 * T);
    return { modo: 'pendulo', tipo: 'oscila', C, M, L, b, d, I, periodo: T, Leq, wmax, th0, pasos, mov: enT(P), T: 2 * T };
  }

  function equilibrio(sc) {
    const g = lee(sc, 'g', 'gravity'), M = lee(sc, 'M', 'the mass', { cero: true }), L = lee(sc, 'L', 'the length');
    const pasos = [];
    if (sc.tipo === 'viga') {
      const xA = lee(sc, 'xA', 'the position of support A', { libre: true }), xB = lee(sc, 'xB', 'the position of support B', { libre: true });
      if (xA === xB) throw new Error('The two supports cannot be in the same place');
      for (const x of [xA, xB]) if (x < 0 || x > L) throw new Error('The supports must be on the beam (between 0 and L)');
      const cargas = String(sc.cargas || '').split(/;|\n/).map((x) => x.trim()).filter(Boolean).map((c, i) => {
        const [x, m] = c.split(/\s+/).map(leeNum);
        if (!isFinite(x) || !isFinite(m) || m < 0) throw new Error(`Load ${i + 1}: enter “position mass” with numbers (positive mass)`);
        if (x < 0 || x > L) throw new Error(`Load ${i + 1}: it must be on the beam`);
        return { x, m };
      });
      const todas = [{ x: L / 2, m: M, nom: 'weight of the beam' }, ...cargas.map((c, i) => ({ ...c, nom: `load ${i + 1}` }))].filter((c) => c.m > 0);
      const W = todas.reduce((s, c) => s + c.m * g, 0), mA = todas.reduce((s, c) => s + c.m * g * (c.x - xA), 0);
      const RB = mA / (xB - xA), RA = W - RB;
      pasos.push({ t: 'Moments about support A', html: `$Σ τ_A = 0$: ${todas.map((c) => `${f(c.m * g)} · (${f(c.x)} − ${f(xA)})`).join(' + ')} $= R_B (${f(xB)} − ${f(xA)})$ ⇒ <b>R<sub>B</sub> = ${f(RB)} N</b>` });
      pasos.push({ t: 'Vertical forces', html: `$R_A + R_B = Σ m g$ = ${f(W)} N ⇒ <b>R<sub>A</sub> = ${f(RA)} N</b>` });
      const vuelca = RA < -1e-9 || RB < -1e-9;
      if (vuelca) pasos.push({ t: 'It tips over!', html: `A support would have to pull downwards (negative reaction): the beam rotates about support ${RA < 0 ? 'B' : 'A'} and tips over, unless it is anchored.` });
      return { modo: 'equilibrio', tipo: 'viga', M, L, xA, xB, cargas, todas, RA, RB, vuelca, pasos };
    }
    const th = lee(sc, 'theta', 'the angle with the ground', { max: 89.9 }), m = lee(sc, 'm', 'the mass of the person', { cero: true, opcional: true }) ?? 0, s = lee(sc, 's', 'where the person is', { cero: true, opcional: true }) ?? 0;
    const mu = lee(sc, 'mu', 'the friction with the ground', { cero: true, opcional: true });
    if (s > L) throw new Error('The person has to be on the ladder (s ≤ L)');
    const t = th * RAD, N1 = (M + m) * g, N2 = (g * Math.cos(t) * (M * L / 2 + m * s)) / (L * Math.sin(t)), Fr = N2, muMin = Fr / N1;
    pasos.push({ t: 'Forces', html: `Smooth wall: it only pushes horizontally, $N_2$. Ground: normal force $N_1$ and friction $F_f$ towards the wall.<br>Vertical: $N_1 = (M + m) g$ = <b>${f(N1)} N</b> &nbsp; Horizontal: $F_f = N_2$` });
    pasos.push({ t: 'Moments about the foot of the ladder', html: `$N_2 L sen θ = M g L/2 cos θ + m g s cos θ ⇒ N_2 = {g cos θ (M L/2 + m s)}/{L sen θ}$ = <b>${f(N2)} N</b> = $F_r$` });
    pasos.push({ t: 'Does it slip?', html: `You need $μ ≥ F_f/N_1$ = <b>${f(muMin)}</b>${mu !== null ? `; with μ = ${f(mu)} ${mu >= muMin ? '<b>it does not slip</b>' : '<b>it slips</b>'}` : ''}.` });
    let sMax = null;
    if (mu !== null && m > 0) {
      sMax = (mu * N1 * L * Math.tan(t)) / g / m - (M * L) / (2 * m);
      pasos.push({ t: 'How high can they climb?', html: `With $F_f = μ N_1$: $s_max = {μ N_1 L tan θ}/{m g} − {M L}/{2m}$ = ${f(sMax)} m ⇒ ${sMax >= L ? '<b>they can climb all the way up</b>' : sMax <= 0 ? '<b>it slips as soon as they climb</b>' : `<b>they can climb ${f(sMax)} m</b> out of ${f(L)} m`}.` });
    }
    return { modo: 'equilibrio', tipo: 'escalera', M, L, th, m, s, mu, N1, N2, Fr, muMin, resbala: mu !== null && mu < muMin, sMax, pasos };
  }

  function resolver(sc) {
    const fn = { rodadura, polea, momento, compuesto, choque, pendulo, equilibrio }[sc.modo];
    return fn ? fn(sc) : inercia(sc);
  }

  const G = '9,8';
  const ejemplos = [
    { clave: 'varilla-extremo', nombre: 'Rod rotating about one end (Steiner)', sc: { modo: 'inercia', cuerpo: 'varilla', M: '2', L: '1,2', d: '0,6' } },
    { clave: 'disco', nombre: 'Disc about its axis', sc: { modo: 'inercia', cuerpo: 'cilindro', M: '5', L: '0,3', d: '' } },
    { clave: 'placa', nombre: 'Rectangular plate', sc: { modo: 'inercia', cuerpo: 'placa', M: '3', L: '0,4', b: '0,3', d: '' } },
    { clave: 'pendulo-compuesto', nombre: 'Composite: rod with a sphere at the tip', sc: { modo: 'compuesto', piezas: 'varilla 1 0,8 0,4\nesfera 2 0,1 0,9' } },
    { clave: 'mancuerna', nombre: 'Composite: two masses joined by a bar', sc: { modo: 'compuesto', piezas: 'punto 1 0,25\npunto 1 0,25\nvarilla 0,2 0,5 0' } },
    { clave: 'esfera-rueda', nombre: 'Sphere rolling down a plane', sc: { modo: 'rodadura', cuerpo: 'esfera', g: G, M: '2', L: '0,1', theta: '30', d: '3', mu: '0,2' } },
    { clave: 'aro-desliza', nombre: 'Hoop with little friction', sc: { modo: 'rodadura', cuerpo: 'aro', g: G, M: '1', L: '0,2', theta: '40', d: '2', mu: '0,3' } },
    { clave: 'polea', nombre: 'Solid pulley with a hanging body', sc: { modo: 'polea', cuerpo: 'cilindro', g: G, M: '4', L: '0,15', m: '2', d: '1,5' } },
    { clave: 'patinadora', nombre: 'Skater pulling in her arms', sc: { modo: 'momento', I1: '4,5', w1: '60', I2: '1,5', unidad: 'rpm' } },
    { clave: 'bala-varilla', nombre: 'Bullet embedded in a hanging rod', sc: { modo: 'choque', tipo: 'bala', g: G, M: '2', L: '1', m: '0,01', v: '300', r: '0,8' } },
    { clave: 'plataforma', nombre: 'Child jumping onto a merry-go-round', sc: { modo: 'choque', tipo: 'plataforma', M: '200', L: '2', w1: '10', m: '30', v: '3', r: '2' } },
    { clave: 'pendulo-fisico', nombre: 'Physical pendulum: rod hanging from one end', sc: { modo: 'pendulo', tipo: 'oscila', cuerpo: 'varilla', g: G, M: '1', L: '1', d: '0,5', th0: '20' } },
    { clave: 'aro-clavo', nombre: 'Hoop hanging from a nail', sc: { modo: 'pendulo', tipo: 'oscila', cuerpo: 'aro', g: G, M: '0,5', L: '0,2', d: '0,2', th0: '10' } },
    { clave: 'varilla-cae', nombre: 'Vertical rod falling, rotating about its base', sc: { modo: 'pendulo', tipo: 'cae', cuerpo: 'varilla', g: G, M: '1', L: '1,5', d: '0,75', th0: '0', th: '90' } },
    { clave: 'escalera', nombre: 'Ladder leaning against a smooth wall', sc: { modo: 'equilibrio', tipo: 'escalera', g: G, M: '10', L: '4', theta: '60', m: '70', s: '3', mu: '0,4' } },
    { clave: 'viga', nombre: 'Beam on two supports with loads', sc: { modo: 'equilibrio', tipo: 'viga', g: G, M: '50', L: '6', xA: '0', xB: '4', cargas: '6 30; 2 80' } },
  ];

  return { resolver, inercia, compuesto, rodadura, polea, momento, choque, pendulo, equilibrio, CUERPOS, ejemplos, f };
})();

