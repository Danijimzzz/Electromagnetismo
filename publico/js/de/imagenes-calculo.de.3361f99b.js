const Imagenes = (() => {
  const EPS0 = 8.8541878128e-12, K = 1 / (4 * Math.PI * EPS0);
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const PREF = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p']];
  const u = (x, unidad, d = 4) => {
    if (!isFinite(x) || Math.abs(x) < 1e-18) return `${f(x, d)} ${unidad}`;
    const a = Math.abs(x), p = PREF.find(([v]) => a >= v * 0.9999999) || PREF[PREF.length - 1];
    return `${String(+(x / p[0]).toPrecision(d)).replace('.', ',').replace('-', '−')} ${p[1]}${unidad}`;
  };
  const uq = (x, unidad, d = 4) => u(x, unidad, d).replace(/ (.+)$/, ' "$1"');
  const leeNum0 = (s) => +String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const lee = (sc, k, nom, { opcional = false, signo = false, cero = false, def = null, entero = false } = {}) => {
    if (vacio(sc[k])) { if (opcional) return def; throw new Error(`${nom} fehlt`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine Zahl sein`);
    if (entero && !Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine ganze Zahl sein`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss ${cero ? 'positiv oder null' : 'größer als 0'} sein`);
    if (signo && !cero && v === 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} darf nicht 0 sein`);
    return v;
  };

  const Q = ['q', 'Ladung q', 'nC', 1e-9, { signo: true }];
  const MODOS = {
    plano: { nombre: 'Geerdete leitende Ebene', campos: [Q, ['d', 'Abstand der Ladung q von der Ebene d', 'cm', 1e-2, {}]], punto: [['rho', 'ρ, Abstand von der Achse', 'cm', 1e-2], ['z', 'z, Höhe über der Ebene', 'cm', 1e-2]] },
    'esfera-tierra': { nombre: 'Geerdete leitende Kugel', campos: [Q, ['a', 'Abstand der Ladung q vom Mittelpunkt a', 'cm', 1e-2, {}], ['R', 'Radius der Kugel R', 'cm', 1e-2, {}]], punto: [['r', 'r, Abstand vom Mittelpunkt', 'cm', 1e-2], ['th', 'θ, Winkel zur Achse von q', '°', Math.PI / 180]] },
    'esfera-aislada': { nombre: 'Isolierte Kugel mit der Ladung Q', campos: [Q, ['a', 'Abstand der Ladung q vom Mittelpunkt a', 'cm', 1e-2, {}], ['R', 'Radius der Kugel R', 'cm', 1e-2, {}], ['Q', 'Gesamtladung der Kugel Q', 'nC', 1e-9, { opcional: true, signo: true, cero: true, def: 0 }]], punto: [['r', 'r, Abstand vom Mittelpunkt', 'cm', 1e-2], ['th', 'θ, Winkel zur Achse von q', '°', Math.PI / 180]] },
    'esfera-potencial': { nombre: 'Kugel auf dem Potential V₀', campos: [Q, ['a', 'Abstand der Ladung q vom Mittelpunkt a', 'cm', 1e-2, {}], ['R', 'Radius der Kugel R', 'cm', 1e-2, {}], ['V0', 'Potential der Kugel V₀', 'V', 1, { opcional: true, signo: true, cero: true, def: 0 }]], punto: [['r', 'r, Abstand vom Mittelpunkt', 'cm', 1e-2], ['th', 'θ, Winkel zur Achse von q', '°', Math.PI / 180]] },
    cuna: { plana: true, nombre: 'Zwei Ebenen im Winkel (Keil π/n)', campos: [['n', 'Zahl n (der Keilwinkel ist π/n)', '', 1, { entero: true }], Q, ['r0', 'Abstand der Ladung q von der Kante r₀', 'cm', 1e-2, {}], ['ph', 'Winkel von q zu einer Ebene φ₀', '°', Math.PI / 180, {}]], punto: [['rp', 'r, Abstand zur Kante', 'cm', 1e-2], ['php', 'φ, Winkel zur ersten Ebene', '°', 1]] },
    paralelos: { plana: true, nombre: 'Zwei parallele Ebenen', campos: [Q, ['L', 'Abstand zwischen den Ebenen L', 'cm', 1e-2, {}], ['d', 'Abstand der Ladung q von der ersten Ebene d', 'cm', 1e-2, {}]], punto: [['rho', 'ρ, Abstand von der Achse', 'cm', 1e-2], ['z', 'z, Höhe über der ersten Ebene', 'cm', 1e-2]] },
    varias: { plana: true, nombre: 'Mehrere Ladungen vor einer Ebene', campos: [['q', 'Ladung q₁', 'nC', 1e-9, { signo: true }], ['x1', 'x₁', 'cm', 1e-2, { signo: true, cero: true }], ['z1', 'z₁ (altura)', 'cm', 1e-2, {}], ['q2', 'Ladung q₂ (optional)', 'nC', 1e-9, { opcional: true, signo: true }], ['x2', 'x₂', 'cm', 1e-2, { opcional: true, signo: true, cero: true }], ['z2', 'z₂ (altura)', 'cm', 1e-2, { opcional: true }], ['q3', 'Ladung q₃ (optional)', 'nC', 1e-9, { opcional: true, signo: true }], ['x3', 'x₃', 'cm', 1e-2, { opcional: true, signo: true, cero: true }], ['z3', 'z₃ (altura)', 'cm', 1e-2, { opcional: true }]], punto: [] },
    dipolo: { plana: true, nombre: 'Dipol vor einer Ebene', campos: [['p', 'Dipolmoment p', 'nC·cm', 1e-11, {}], ['d', 'Abstand des Dipols von der Ebene d', 'cm', 1e-2, {}], ['th', 'Winkel von p zur Normalen θ', '°', Math.PI / 180, { signo: true, cero: true }]], punto: [] },
    cavidad: { nombre: 'Ladung in einem kugelförmigen Hohlraum', campos: [Q, ['a', 'Abstand der Ladung q vom Mittelpunkt a', 'cm', 1e-2, {}], ['R', 'Radius des Hohlraums R', 'cm', 1e-2, {}]], punto: [['r', 'r, Abstand vom Mittelpunkt', 'cm', 1e-2], ['th', 'θ, Winkel zur Achse von q', '°', Math.PI / 180]] },
  };

  function campo(cargas, z, rho) {
    let V = 0, Ez = 0, Er = 0;
    for (const c of cargas) { const dz = z - c.z, r2 = dz * dz + rho * rho, r = Math.sqrt(r2); V += (K * c.q) / r; Ez += (K * c.q * dz) / (r2 * r); Er += (K * c.q * rho) / (r2 * r); }
    return { V, Ez, Er, E: Math.hypot(Ez, Er) };
  }

  function trigamma(x) {
    let t = 0; while (x < 12) { t += 1 / (x * x); x += 1; }
    const y = 1 / (x * x);
    return t + 1 / x + y / 2 + (y / x) * (1 / 6 - y * (1 / 30 - y * (1 / 42 - y / 30)));
  }
  function campoXZ(cargas, x, z) {
    let V = 0, Ex = 0, Ez = 0;
    for (const c of cargas) { const dx = x - c.x, dz = z - c.z, r2 = dx * dx + dz * dz, r = Math.sqrt(r2); if (r < 1e-15) continue; V += (K * c.q) / r; Ex += (K * c.q * dx) / (r2 * r); Ez += (K * c.q * dz) / (r2 * r); }
    return { V, Ex, Ez, E: Math.hypot(Ex, Ez) };
  }
  const fuerzaDe = (i, lista) => { let Fx = 0, Fz = 0; const a = lista[i]; for (let j = 0; j < lista.length; j++) { if (j === i) continue; const b = lista[j], dx = a.x - b.x, dz = a.z - b.z, r = Math.hypot(dx, dz); Fx += (K * a.q * b.q * dx) / r ** 3; Fz += (K * a.q * b.q * dz) / r ** 3; } return [Fx, Fz]; };
  const grados = (x) => (x * 180) / Math.PI;

  function resolverPlana(sc, modo) {
    const M = MODOS[modo], p = {}, cm = (x) => f(x * 100), pasos = [];
    for (const [k, nom, , fac, op] of M.campos) { const v = lee(sc, k, nom.charAt(0).toLowerCase() + nom.slice(1), op || {}); p[k] = v === null ? null : v * fac; }
    const cajas = [], R = { modo, plana: true, p, esfera: false, cav: false, V0: null, q2: 0, W: null, pt: null };
    let cargas = [], reales = [], lim = 1;
    if (modo === 'cuna') {
      const n = p.n, alfa = Math.PI / n;
      if (n < 1 || n > 12) throw new Error('n muss zwischen 1 und 12 liegen (Keilwinkel π/n)');
      if (!(p.ph > 1e-9 && p.ph < alfa - 1e-9)) throw new Error(`φ₀ muss innerhalb des Keils liegen: zwischen 0° und ${f(grados(alfa))}°`);
      for (let k = 0; k < n; k++) for (const sg of [1, -1]) {
        const ang = 2 * k * alfa + sg * p.ph;
        if (k === 0 && sg === 1) cargas.push({ q: p.q, x: p.r0 * Math.cos(ang), z: p.r0 * Math.sin(ang), real: true, nom: 'q' });
        else cargas.push({ q: sg * p.q, x: p.r0 * Math.cos(ang), z: p.r0 * Math.sin(ang), nom: `q′${cargas.length}`, ang: grados(ang) });
      }
      R.alfa = alfa; R.n = n; R.pos = p.r0; lim = p.r0;
      pasos.push({ t: 'Ansatz', html: `Zwei geerdete Ebenen bilden einen Winkel $α = π/n = ${f(grados(alfa))}°$ ($n = ${n}$). Ist $α = π/n$ mit ganzzahligem $n$, liegen alle Bildladungen außerhalb des Keils, und es genügen $2n − 1 = ${2 * n - 1}$ Bildladungen mit wechselndem Vorzeichen: $+q$ bei $φ = 2kα + φ_0$ und $−q$ bei $φ = 2kα − φ_0$, mit $k = 0, …, n − 1$, alle im Abstand $r_0$ von der Kante.` });
      pasos.push({ t: 'Bildladungen', html: cargas.filter((c) => !c.real).map((c) => `$${c.q > 0 ? '+' : '−'}q$ bei $φ = ${f(c.ang)}°$`).join('; ') + `. Bei ${n} positiven und ${n} negativen Ladungen ist die Summe aller null, und der Keil liegt auf seinen beiden Ebenen bei V = 0.` });
    } else if (modo === 'paralelos') {
      const { q, L, d } = p;
      if (!(d < L)) throw new Error('Die Ladung muss zwischen den Ebenen liegen (d < L)');
      for (let k = -2; k <= 2; k++) { if (k) cargas.push({ q, x: 0, z: 2 * k * L + d, nom: `+q (k = ${k})` }); cargas.push({ q: -q, x: 0, z: 2 * k * L - d, nom: `−q (k = ${k})` }); }
      cargas.unshift({ q, x: 0, z: d, real: true, nom: 'q' });
      cargas = cargas.sort((a, b) => (b.real ? 1 : 0) - (a.real ? 1 : 0));
      const t = d / L, Fz = ((K * q * q) / (4 * L * L)) * (trigamma(1 - t) - trigamma(t));
      R.imagenes = cargas.filter((c) => !c.real); R.Fz = Fz; R.Qa = -q * (1 - t); R.Qb = -q * t; R.L = L; R.pos = d; lim = L;
      const Vsuma = (rho, z, N) => { let V = 0; for (let k = -N; k <= N; k++) V += K * q * (1 / Math.hypot(rho, z - 2 * k * L - d) - 1 / Math.hypot(rho, z + d - 2 * k * L)); return V; };
      R.Vsuma = Vsuma;
      pasos.push({ t: 'Ansatz', html: `Zwei geerdete Ebenen, $z = 0$ und $z = L = ${cm(L)} "cm"$, mit $q$ im Abstand $d = ${cm(d)} "cm"$ von der ersten. Jede Ebene spiegelt die Ladungen der anderen, daher gibt es unendlich viele Bildladungen: $−q$ bei $z = 2kL − d$ und $+q$ bei $z = 2kL + d$, mit ganzzahligem $k$ (die reale Ladung ist $k = 0$ mit Vorzeichen +).` });
      pasos.push({ t: 'Kraft auf q', html: `Die $+q$-Bildladungen heben sich paarweise auf ($k$ und $−k$), und es wirken nur die $−q$: $F = {q^2}/{16π ε_0} ∑_k {sg(kL − d)}/{(kL − d)^2} = {q^2}/{16π ε_0 L^2}[ψ_1(1 − d/L) − ψ_1(d/L)] = ${f(Fz)} "N"$ (mit $ψ_1(x) = ∑_{k≥0} 1/(k + x)^2$). ` + (Math.abs(Fz) < 1e-15 * Math.abs(K * q * q / (L * L)) ? 'Sie liegt genau in der Mitte: Die Kräfte kompensieren sich, und die Kraft ist null.' : `Sie wird zur ${Fz > 0 ? 'oberen' : 'unteren'}, nächstgelegenen Ebene gezogen.`) });
      pasos.push({ t: 'Influenzierte Ladung auf jeder Ebene', html: `Nach der Green-Formel: $Q_0 = −q(1 − d/L) = ${f(R.Qa)} "C"$ auf der Ebene $z = 0$ und $Q_L = −q d/L = ${f(R.Qb)} "C"$ auf der Ebene $z = L$. Zusammen ergeben sie $−q$.` });
      cajas.push(['Kraft auf q', u(Math.abs(Fz), 'N'), Fz === 0 ? 'null: in der Mitte' : Fz > 0 ? 'zur oberen Ebene' : 'zur unteren Ebene'], ['Influenzierte Ladung bei z = 0', u(R.Qa, 'C'), '−q (1 − d/L)'], ['Influenzierte Ladung bei z = L', u(R.Qb, 'C'), '−q d/L'], ['Bildladungen', 'infinitas', 'die Summe konvergiert wie 1/k²']);
      R.Fmod = Math.abs(Fz); R.atractiva = true; R.Qe = R.Qa + R.Qb;
    } else if (modo === 'varias') {
      for (const [i, [kq, kx, kz]] of [['q', 'x1', 'z1'], ['q2', 'x2', 'z2'], ['q3', 'x3', 'z3']].entries()) {
        if (i && p[kq] === null) continue;
        if (p[kx] === null || p[kz] === null) throw new Error(`Die Position der Ladung ${i + 1} fehlt`);
        cargas.push({ q: i ? p[kq] : p.q, x: p[kx], z: p[kz], real: true, nom: `q${i + 1}` });
      }
      reales = [...cargas];
      for (const c of reales) cargas.push({ q: -c.q, x: c.x, z: -c.z, nom: `${c.nom}′` });
      const n = reales.length, todas = cargas;
      R.imagenes = todas.filter((c) => !c.real); R.pos = reales[0].z;
      const F = reales.map((c, i) => fuerzaDe(i, todas)); R.F = F;
      const Ftot = F.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
      let Ue = 0; for (let i = 0; i < n; i++) { for (let j = i + 1; j < n; j++) Ue += (K * reales[i].q * reales[j].q) / Math.hypot(reales[i].x - reales[j].x, reales[i].z - reales[j].z); for (let j = 0; j < n; j++) Ue -= (0.5 * K * reales[i].q * reales[j].q) / Math.hypot(reales[i].x - reales[j].x, reales[i].z + reales[j].z); }
      R.W = Ue; R.Ftot = Ftot; R.Fz = F[0][1]; R.Fx = F[0][0]; R.Fmod = Math.hypot(...F[0]); R.atractiva = F[0][1] < 0; R.Qe = -reales.reduce((s2, c) => s2 + c.q, 0); R.n = n;
      lim = Math.max(...reales.map((c) => Math.max(Math.abs(c.x), c.z)));
      pasos.push({ t: 'Ansatz', html: `Die Ebene $z = 0$ ist geerdet. Jede Ladung $q_i$ bei $(x_i, z_i)$ hat ihre Bildladung $−q_i$ bei $(x_i, −z_i)$, und das Feld für $z > 0$ ist das der ${2 * n} Ladungen.` });
      pasos.push({ t: 'Kraft auf jede Ladung', html: reales.map((c, i) => `Auf $q_${i + 1}$ wirken die anderen realen Ladungen und alle Bildladungen (auch die eigene): $F_${i + 1} = (${f(F[i][0])}, ${f(F[i][1])}) "N"$, mit dem Betrag $${f(Math.hypot(...F[i]))} "N"$`).join('; ') + '.' });
      pasos.push({ t: 'Gesamtkraft und Energie', html: `Kraft auf die Gesamtheit der realen Ladungen: $(${f(Ftot[0])}, ${f(Ftot[1])}) "N"$. Die Energie des Systems ist die Hälfte der Energie der Ladungen mit ihren Bildladungen bei der Wechselwirkung mit der Ebene: $U = ∑_{i<j} {q_i q_j}/{4π ε_0 r_{ij}} − ½ ∑_{i,j} {q_i q_j}/{4π ε_0 r_{ij′}} = ${f(Ue)} "J"$. Influenzierte Ladung auf der Ebene: $Q = −∑ q_i = ${f(R.Qe)} "C"$.` });
      cajas.push(...reales.map((c, i) => [`Kraft auf ${c.nom}`, u(Math.hypot(...F[i]), 'N'), `F = (${f(F[i][0])}; ${f(F[i][1])}) N`]), ['Gesamtkraft', u(Math.hypot(...Ftot), 'N'), `(${f(Ftot[0])}; ${f(Ftot[1])}) N`], ['Energie des Systems', u(Ue, 'J'), 'U mit geerdeter Ebene'], ['Gesamte influenzierte Ladung', u(R.Qe, 'C'), '−Σ qᵢ']);
    } else {
      const { p: pm, d, th } = p, c2 = Math.cos(th) ** 2, px = pm * Math.sin(th), pz = pm * Math.cos(th);
      const Fz = (-3 * pm * pm * (1 + c2)) / (64 * Math.PI * EPS0 * d ** 4), tau = (-pm * pm * Math.sin(th) * Math.cos(th)) / (32 * Math.PI * EPS0 * d ** 3), U = (-pm * pm * (1 + c2)) / (64 * Math.PI * EPS0 * d ** 3);
      const l = 0.5 * d, dx = (l / 2) * Math.sin(th), dz = (l / 2) * Math.cos(th);
      cargas = [{ q: 1e-9, x: dx, z: d + dz, real: true, nom: '+' }, { q: -1e-9, x: -dx, z: d - dz, real: true, nom: '−' }, { q: -1e-9, x: dx, z: -d - dz, nom: '−′' }, { q: 1e-9, x: -dx, z: -d + dz, nom: '+′' }];
      R.imagenes = cargas.filter((c) => !c.real); R.Fz = Fz; R.Fmod = Math.abs(Fz); R.atractiva = true; R.tau = tau; R.U = U; R.W = U; R.pos = d; R.px = px; R.pz = pz; R.Qe = 0; lim = d;
      pasos.push({ t: 'Ansatz', html: `Ein Dipol $p = ${f(pm)} "C·m"$ im Abstand $d = ${cm(d)} "cm"$ von der geerdeten Ebene, wobei $p$ mit der Normalen den Winkel $θ = ${f(grados(th))}°$ bildet. Sein Bild ist ein weiterer Dipol bei $z = −d$ mit gleicher Normalkomponente und umgekehrter Parallelkomponente: $p′ = (−p_x, p_z) = (${f(-px)}, ${f(pz)}) "C·m"$.` });
      pasos.push({ t: 'Energie', html: `Die Dipol-Dipol-Wechselwirkung im Abstand $2d$ beträgt $U_{int} = {p·p′ − 3(p·n)(p′·n)}/{4π ε_0 (2d)^3} = −{p^2 (1 + cos^2 θ)}/{32π ε_0 d^3}$, und die reale Energie ist die Hälfte (das Bild existiert nicht): $U = −{p^2 (1 + cos^2 θ)}/{64π ε_0 d^3} = ${f(U)} "J"$.` });
      pasos.push({ t: 'Kraft und Drehmoment', html: `$F_z = −{∂U}/{∂d} = −{3 p^2 (1 + cos^2 θ)}/{64π ε_0 d^4} = ${f(Fz)} "N"$ (anziehend: Der Dipol wird zur Ebene gezogen). Das Drehmoment auf $p$ ist $τ_y = −{∂U}/{∂θ} = −{p^2 sin θ cos θ}/{32π ε_0 d^3} = ${f(tau)} "N·m"$` + (Math.abs(tau) < 1e-30 ? ': null (θ = 0° oder 90°).' : tau < 0 ? ': strebt danach, den Dipol senkrecht zur Ebene auszurichten (verkleinert θ).' : ': strebt danach, den Dipol senkrecht zur Ebene auszurichten (vergrößert |θ| in Richtung 180°).') });
      cajas.push(['Kraft auf den Dipol', u(Math.abs(Fz), 'N'), 'anziehend, zur Ebene hin'], ['Drehmoment auf den Dipol', u(tau, 'N·m'), 'τ = −∂U/∂θ'], ['Energie', u(U, 'J'), 'Wechselwirkung mit der Ebene'], ['Bilddipol', `(${f(-px)}; ${f(pz)}) C·m`, 'parallel umgekehrt, normal gleich']);
    }
    if (modo === 'cuna') {
      const real = cargas[0], F = fuerzaDe(0, cargas), ca = Math.cos(p.ph), sa = Math.sin(p.ph);
      R.imagenes = cargas.filter((c) => !c.real); R.F = F; R.Fx = F[0]; R.Fz = F[1]; R.Fmod = Math.hypot(...F); R.Fr = F[0] * ca + F[1] * sa; R.Fphi = -F[0] * sa + F[1] * ca; R.Qe = -p.q; R.atractiva = R.Fr < 0 || R.Fmod > 0;
      pasos.push({ t: 'Kraft auf q', html: `Die Kraft ist die Summe der Kräfte der ${2 * R.n - 1} Bildladungen: $F = ∑ {q q_i′}/{4π ε_0 r_i^2}$ (Vektor). Es ergibt sich $F_r = ${f(R.Fr)} "N"$ (radial, von der Kante weg) und $F_φ = ${f(R.Fphi)} "N"$ (tangential), mit dem Betrag $${f(R.Fmod)} "N"$.` });
      cajas.push(['Bildladungen', `${2 * R.n - 1}`, `n = ${R.n}, α = ${f(grados(R.alfa))}°`], ['Kraft auf q', u(R.Fmod, 'N'), `F<sub>r</sub> = ${u(R.Fr, 'N', 3)}, F<sub>φ</sub> = ${u(R.Fphi, 'N', 3)}`], ['Gesamte influenzierte Ladung', u(-p.q, 'C'), 'gleich und entgegengesetzt zu q']);
    }
    const [k1, k2] = M.punto.map((x) => x[0]);
    if (k1 && (!vacio(sc[k1]) || !vacio(sc[k2]))) {
      if (vacio(sc[k1]) || vacio(sc[k2])) throw new Error('Fülle beide Koordinaten des Punktes aus oder lasse sie leer');
      const a1 = leeNum(sc[k1]), a2 = leeNum(sc[k2]);
      if (!isFinite(a1) || !isFinite(a2)) throw new Error('Die Koordinaten des Punktes müssen Zahlen sein');
      if (modo === 'cuna') {
        const r = a1 * 1e-2, ph = (a2 * Math.PI) / 180;
        if (r < 0) throw new Error('Der Abstand r des Punktes darf nicht negativ sein');
        if (!(ph >= 0 && ph <= R.alfa + 1e-9)) throw new Error(`Der Punkt muss innerhalb des Keils liegen (φ zwischen 0° und ${f(grados(R.alfa))}°)`);
        const c = campoXZ(cargas, r * Math.cos(ph), r * Math.sin(ph)); R.pt = { x: r * Math.cos(ph), z: r * Math.sin(ph), ...c, etiqueta: `r = ${cm(r)}, φ = ${f(a2)}°` };
      } else {
        const rho = a1 * 1e-2, z = a2 * 1e-2;
        if (!(z >= 0 && z <= p.L + 1e-12)) throw new Error('Der Punkt muss zwischen den Ebenen liegen (0 ≤ z ≤ L)');
        const N = 20000, h = 1e-6 * p.L, V = R.Vsuma(rho, z, N), Ez = -(R.Vsuma(rho, z + h, N) - R.Vsuma(rho, z - h, N)) / (2 * h), Er = -(R.Vsuma(rho + h, z, N) - R.Vsuma(Math.max(rho - h, 0), z, N)) / (rho > h ? 2 * h : h + rho);
        R.pt = { x: rho, z, V, Ex: Er, Ez, E: Math.hypot(Er, Ez), etiqueta: `ρ = ${cm(rho)}, z = ${cm(z)}` };
      }
      pasos.push({ t: 'Potential und Feld im Punkt', html: `Summiert man die Ladung und alle ihre Bildladungen, ergibt sich: $V = ${f(R.pt.V)} "V"$, $E_x = ${f(R.pt.Ex)} "V/m"$, $E_z = ${f(R.pt.Ez)} "V/m"$, $|E| = ${f(R.pt.E)} "V/m"$.` });
      cajas.push(['V am Punkt', u(R.pt.V, 'V'), R.pt.etiqueta], ['|E| im Punkt', u(R.pt.E, 'V/m'), `E<sub>x</sub> = ${u(R.pt.Ex, 'V/m', 3)}, E<sub>z</sub> = ${u(R.pt.Ez, 'V/m', 3)}`]);
    }
    Object.assign(R, { cargas, cajas, pasos, lim, q: cargas[0]?.q ?? 0, Fz: R.Fz ?? 0 });
    return R;
  }

  function resolver(sc) {
    if (MODOS[sc.modo] && MODOS[sc.modo].plana) return resolverPlana(sc, sc.modo);
    const modo = MODOS[sc.modo] ? sc.modo : 'plano', M = MODOS[modo], esfera = modo !== 'plano', cav = modo === 'cavidad';
    const p = {};
    for (const [k, nom, , fac, op] of M.campos) { const v = lee(sc, k, nom.charAt(0).toLowerCase() + nom.slice(1), op || {}); p[k] = v * fac; }
    const q = p.q;
    if (esfera) {
      if (cav && !(p.a < p.R)) throw new Error('Die Ladung muss innerhalb des Hohlraums liegen (a < R)');
      if (!cav && !(p.a > p.R)) throw new Error('Die Ladung muss außerhalb der Kugel liegen (a > R)');
    }
    const pos = esfera ? p.a : p.d, R = p.R;
    let imagenes, Qe = null, V0 = null, q2 = 0;
    if (!esfera) imagenes = [{ q: -q, z: -p.d, nom: 'q′' }];
    else {
      const qi = (-q * R) / p.a, zi = (R * R) / p.a;
      imagenes = p.a / R < 1e-9 && cav ? [] : [{ q: qi, z: zi, nom: 'q′' }];
      if (modo === 'esfera-tierra') { Qe = qi; V0 = 0; }
      else if (modo === 'esfera-aislada') { Qe = p.Q; q2 = Qe - qi; V0 = (K * q2) / R; }
      else if (modo === 'esfera-potencial') { V0 = p.V0; q2 = (V0 * R) / K; Qe = qi + q2; }
      else { Qe = -q; V0 = 0; }
      if (q2 !== 0) imagenes.push({ q: q2, z: 0, nom: 'q″' });
    }
    const cargas = [{ q, z: pos, real: true }, ...imagenes];
    let Fz = 0;
    for (const c of imagenes) { const dz = pos - c.z; Fz += (K * q * c.q * dz) / Math.abs(dz) ** 3; }
    const haciaConductor = cav ? 1 : -1, atractiva = Fz * haciaConductor > 0;
    const sigma = !esfera ? (rho) => (-q * p.d) / (2 * Math.PI * (rho * rho + p.d * p.d) ** 1.5)
      : (th) => (-q * Math.abs(p.a * p.a - R * R)) / (4 * Math.PI * R * (R * R + p.a * p.a - 2 * p.a * R * Math.cos(th)) ** 1.5) + (cav ? 0 : q2 / (4 * Math.PI * R * R));
    const sigmaMax = sigma(0);
    const W = modo === 'plano' ? (K * q * q) / (4 * p.d) : modo === 'esfera-tierra' ? (K * q * q * R) / (2 * (p.a * p.a - R * R)) : null;

    let pt = null;
    const [k1, k2] = M.punto.map((x) => x[0]), v1 = sc[k1], v2 = sc[k2];
    if (!vacio(v1) || !vacio(v2)) {
      const n1 = M.punto[0][1].split(',')[0], n2 = M.punto[1][1].split(',')[0];
      if (vacio(v1)) throw new Error(`${n1} des Punktes fehlt`);
      if (vacio(v2)) throw new Error(`${n2} des Punktes fehlt`);
      const a1 = leeNum(v1), a2 = leeNum(v2);
      if (!isFinite(a1) || !isFinite(a2)) throw new Error('Die Koordinaten des Punktes müssen Zahlen sein');
      let rho, z, th = null, r = null;
      if (!esfera) { rho = a1 * 1e-2; z = a2 * 1e-2; if (z <= 0) throw new Error('Der Punkt muss auf der Seite der Ladung liegen (z > 0)'); }
      else {
        r = a1 * 1e-2; th = (a2 * Math.PI) / 180;
        if (r < 0) throw new Error('Der Abstand r des Punktes darf nicht negativ sein');
        if (!cav && r <= R) throw new Error('Der Punkt muss außerhalb der Kugel liegen (r > R)');
        if (cav && r >= R) throw new Error('Der Punkt muss innerhalb des Hohlraums liegen (r < R)');
        rho = r * Math.sin(th); z = r * Math.cos(th);
      }
      const c = campo(cargas, z, rho);
      pt = { rho, z, r, th, ...c, sigma: !esfera ? sigma(rho) : sigma(th) };
    }

    const pasos = [];
    const cm = (x) => f(x * 100);
    if (!esfera) {
      pasos.push({ t: 'Ansatz', html: `Die Ebene ist geerdet (V = 0 bei z = 0). Der Leiter wird entfernt und eine Bildladung eingesetzt, die V = 0 in der Ebene ergibt: die entgegengesetzte, im spiegelbildlichen Punkt. Gilt für z > 0.` });
      pasos.push({ t: 'Bildladung', html: `$q′ = −q = ${uq(-q, 'C')}$ bei $z = −d = −${cm(p.d)} "cm"$.` });
    } else if (!cav) {
      pasos.push({ t: 'Ansatz', html: `Die Kugel wird entfernt, und man sucht eine Bildladung im Inneren auf der Achse, die V = 0 bei r = R ergibt. Es ist das Spiegelbild von q bezüglich der Kugel.` });
      pasos.push({ t: 'Bildladung', html: `$q′ = −{q R}/a = −{${f(q)} · ${f(R)}}/{${f(p.a)}} = ${f(imagenes[0].q)} "C"$, im Abstand $a′ = R^2/a = {${f(R)}^2}/{${f(p.a)}} = ${cm(imagenes[0].z)} "cm"$ vom Mittelpunkt.` });
      if (modo === 'esfera-tierra') pasos.push({ t: 'Geerdete Kugel', html: `Mit V = 0 genügt eine einzige Bildladung. Die Gesamtladung der Kugel ist die der Bildladung: $Q = q′ = ${uq(Qe, 'C')}$.` });
      else {
        if (modo === 'esfera-aislada') pasos.push({ t: 'Isolierte Kugel', html: `Die Kugel hat die Gesamtladung $Q = ${f(Qe)} "C"$. Die Bildladung q′ liefert bereits ${f(imagenes[0].q)} C, und der Rest wird in den Mittelpunkt gesetzt, damit die Oberfläche äquipotential bleibt: $q″ = Q − q′ = ${f(Qe)} − (${f(imagenes[0].q)}) = ${f(q2)} "C"$, bei $z = 0$.` });
        else pasos.push({ t: 'Kugel auf einem Potential', html: `Die Kugel liegt auf $V_0 = ${f(V0)} "V"$. Die Ladung q″ im Mittelpunkt legt es fest: $q″ = 4π ε_0 R V_0 = ${f(q2)} "C"$, bei $z = 0$, und die Gesamtladung der Kugel ist $Q = q′ + q″ = ${f(Qe)} "C"$.` });
        pasos.push({ t: 'Potential der Kugel', html: `$V_{Kugel} = {q″}/{4π ε_0 R} = ${f(V0)} "V"$ (gleichmäßig: Die ganze Kugel ist äquipotential).` });
      }
    } else {
      pasos.push({ t: 'Ansatz', html: `Die Ladung liegt in einem kugelförmigen Hohlraum mit dem Radius R in einem Leiter. Man sucht eine Bildladung außerhalb des Hohlraums auf der Achse, die V = 0 bei r = R ergibt (gilt für r < R).` });
      pasos.push({ t: 'Bildladung', html: imagenes.length ? `$q′ = −{q R}/a = −{${f(q)} · ${f(R)}}/{${f(p.a)}} = ${f(imagenes[0].q)} "C"$, im Abstand $a′ = R^2/a = ${cm(imagenes[0].z)} "cm"$ vom Mittelpunkt, außerhalb des Hohlraums.` : 'Liegt die Ladung im Mittelpunkt, ist keine Bildladung nötig: Das Feld im Inneren ist das von q allein.' });
      pasos.push({ t: 'Influenzierte Ladung', html: `An der Wand des Hohlraums wird genau $−q = ${f(-q)} "C"$ influenziert (Gauß): Das Feld im Leiter ist null.` });
    }
    const Fmod = Math.abs(Fz);
    if (modo === 'plano') pasos.push({ t: 'Kraft auf q', html: `Die Kraft ist die zwischen q und seiner Bildladung im Abstand 2d: $F = {q q′}/{4π ε_0 (2d)^2} = −{q^2}/{16π ε_0 d^2} = −{(${f(q)})^2}/{16π · ${f(EPS0)} · (${f(p.d)})^2} = ${f(Fz)} "N"$ (${atractiva ? 'anziehend, zur Ebene hin' : 'abstoßend'}).` });
    else if (modo === 'esfera-tierra') pasos.push({ t: 'Kraft auf q', html: `Zwischen q und seiner Bildladung liegen $a − a′ = ${cm(p.a - imagenes[0].z)} "cm"$: $F = {q q′}/{4π ε_0 (a − a′)^2} = −{q^2 R a}/{4π ε_0 (a^2 − R^2)^2} = ${f(Fz)} "N"$ (${atractiva ? 'anziehend, zur Kugel hin' : 'abstoßend'}).` });
    else if (!cav) pasos.push({ t: 'Kraft auf q', html: `Beide Bildladungen wirken: $F = {q}/{4π ε_0}[{q′}/{(a − a′)^2} + {q″}/{a^2}] = ${f(K * q)} [{${f(imagenes[0].q)}}/{(${f(p.a - imagenes[0].z)})^2} + {${f(q2)}}/{(${f(p.a)})^2}] = ${f(Fz)} "N"$ (${atractiva ? 'anziehend' : 'abstoßend'}, ${atractiva ? 'zur Kugel hin' : 'von der Kugel weg'}).` });
    else pasos.push({ t: 'Kraft auf q', html: imagenes.length ? `Zwischen q und seiner Bildladung liegen $a′ − a = ${cm(imagenes[0].z - p.a)} "cm"$: $F = {q q′}/{4π ε_0 (a′ − a)^2} = {q^2 R a}/{4π ε_0 (R^2 − a^2)^2} = ${f(Math.abs(Fz))} "N"$ (anziehend, zur nächstgelegenen Wand hin).` : '$F = 0$ aus Symmetriegründen.' });
    if (modo === 'plano') pasos.push({ t: 'Influenzierte Ladung', html: `Mit $σ = ε_0 E_n$ in der Ebene: $σ(ρ) = −{q d}/{2π (ρ^2 + d^2)^{3/2}}$. Bei ρ = 0: $σ_{max} = −{q}/{2π d^2} = ${f(sigmaMax)} "C/m²"$. Integriert man über die ganze Ebene, erhält man $Q_{ind} = −q = ${f(-q)} "C"$.` });
    else pasos.push({ t: 'Influenzierte Ladungsdichte', html: `$σ(θ) = −{q (${cav ? 'R^2 − a^2' : 'a^2 − R^2'})}/{4π R (R^2 + a^2 − 2 a R cos θ)^{3/2}}${!cav && q2 !== 0 ? ' + {q″}/{4π R^2}' : ''}$. Im Punkt, der q am nächsten liegt (θ = 0): $σ = ${f(sigmaMax)} "C/m²"$.` });
    if (W !== null) pasos.push({ t: 'Arbeit, um q ins Unendliche zu bringen', html: modo === 'plano' ? `$W = ∫_d^∞ {q^2}/{16π ε_0 x^2} dx = {q^2}/{16π ε_0 d} = ${uq(W, 'J')}$ (das ist die Energie des Systems, die Hälfte der Energie der beiden realen Ladungen).` : `$W = ∫_a^∞ F dx = {q^2 R}/{8π ε_0 (a^2 − R^2)} = ${uq(W, 'J')}$.` });
    if (pt) {
      const lista = cargas.map((c, i) => `r<sub>${i}</sub> = ${cm(Math.hypot(pt.z - c.z, pt.rho))} cm`).join(', ');
      pasos.push({ t: 'Potential im Punkt', html: `Man addiert die Beiträge von q und ${imagenes.length > 1 ? 'den Bildladungen' : 'seiner Bildladung'}: $V = {1}/{4π ε_0} Σ {q_i}/{r_i}$, mit ${lista}. Es ergibt sich $V = ${f(pt.V)} "V"$.` });
      pasos.push({ t: 'Feld im Punkt', html: `$E_z = ${f(pt.Ez)} "V/m"$, $E_ρ = ${f(pt.Er)} "V/m"$, $|E| = ${f(pt.E)} "V/m"$.` });
      pasos.push({ t: 'Influenzierte Ladung unter dem Punkt', html: `${!esfera ? `Unter dem Punkt (ρ = ${cm(pt.rho)} cm)` : `Im Oberflächenpunkt mit demselben Winkel (θ = ${f((pt.th * 180) / Math.PI)}°)`}: $σ = ${f(pt.sigma)} "C/m²"$.` });
    }
    return { modo, esfera, cav, p, q, pos, R, imagenes, cargas, Fz, Fmod, atractiva, Qe, V0, q2, sigma, sigmaMax, W, pt, pasos };
  }

  const ejemplos = [
    { clave: 'plano', nombre: 'Ladung von 5 nC im Abstand 3 cm von einer geerdeten Ebene', sc: { modo: 'plano', q: '5', d: '3', rho: '4', z: '3' } },
    { clave: 'esfera-tierra', nombre: 'Ladung von 10 nC vor einer geerdeten Kugel', sc: { modo: 'esfera-tierra', q: '10', a: '30', R: '10', r: '15', th: '0' } },
    { clave: 'esfera-neutra', nombre: 'Dieselbe Ladung vor einer neutralen isolierten Kugel', sc: { modo: 'esfera-aislada', q: '10', a: '30', R: '10', Q: '0', r: '15', th: '0' } },
    { clave: 'esfera-potencial', nombre: 'Kugel auf 500 V mit einer Ladung in der Nähe', sc: { modo: 'esfera-potencial', q: '2', a: '20', R: '5', V0: '500', r: '10', th: '90' } },
    { clave: 'cavidad', nombre: 'Ladung von 5 nC in einem kugelförmigen Hohlraum', sc: { modo: 'cavidad', q: '5', a: '6', R: '10', r: '3', th: '60' } },
    { clave: 'cuna-90', nombre: 'Ladung von 5 nC in einem 90°-Keil (n = 2, IM-1)', sc: { modo: 'cuna', n: '2', q: '5', r0: '5', ph: '30', rp: '', php: '' } },
    { clave: 'cuna-60', nombre: 'Ladung von 5 nC in einem 60°-Keil (n = 3, fünf Bildladungen)', sc: { modo: 'cuna', n: '3', q: '5', r0: '4', ph: '20', rp: '3', php: '40' } },
    { clave: 'paralelos', nombre: 'Ladung von 5 nC zwischen zwei parallelen Ebenen im Abstand 10 cm (IM-1)', sc: { modo: 'paralelos', q: '5', L: '10', d: '3', rho: '2', z: '5' } },
    { clave: 'varias', nombre: 'Zwei Ladungen entgegengesetzten Vorzeichens vor einer Ebene (IM-4)', sc: { modo: 'varias', q: '5', x1: '-3', z1: '4', q2: '-3', x2: '3', z2: '6', q3: '', x3: '', z3: '' } },
    { clave: 'dipolo', nombre: 'Dipol von 10 nC·cm im Abstand 4 cm von der Ebene, 30° zur Normalen (IM-4)', sc: { modo: 'dipolo', p: '10', d: '4', th: '30' } },
  ];

  return { resolver, ejemplos, campo, campoXZ, trigamma, MODOS, f, u, EPS0, K };
})();

