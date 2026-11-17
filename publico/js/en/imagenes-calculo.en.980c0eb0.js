const Imagenes = (() => {
  const EPS0 = 8.8541878128e-12, K = 1 / (4 * Math.PI * EPS0);
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const PREF = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p']];
  const u = (x, unidad, d = 4) => {
    if (!isFinite(x) || Math.abs(x) < 1e-18) return `${f(x, d)} ${unidad}`;
    const a = Math.abs(x), p = PREF.find(([v]) => a >= v * 0.9999999) || PREF[PREF.length - 1];
    return `${String(+(x / p[0]).toPrecision(d)).replace('.', '.').replace('-', '−')} ${p[1]}${unidad}`;
  };
  const uq = (x, unidad, d = 4) => u(x, unidad, d).replace(/ (.+)$/, ' "$1"');
  const leeNum0 = (s) => +String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const lee = (sc, k, nom, { opcional = false, signo = false, cero = false, def = null, entero = false } = {}) => {
    if (vacio(sc[k])) { if (opcional) return def; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be a number`);
    if (entero && !Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be an integer`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be ${cero ? 'positive or zero' : 'greater than 0'}`);
    if (signo && !cero && v === 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} cannot be 0`);
    return v;
  };

  const Q = ['q', 'Charge q', 'nC', 1e-9, { signo: true }];
  const MODOS = {
    plano: { nombre: 'Grounded conducting plane', campos: [Q, ['d', 'Distance from q to the plane d', 'cm', 1e-2, {}]], punto: [['rho', 'ρ, distance to the axis', 'cm', 1e-2], ['z', 'z, height above the plane', 'cm', 1e-2]] },
    'esfera-tierra': { nombre: 'Grounded conducting sphere', campos: [Q, ['a', 'Distance from q to the centre a', 'cm', 1e-2, {}], ['R', 'Radius of the sphere R', 'cm', 1e-2, {}]], punto: [['r', 'r, distance to the centre', 'cm', 1e-2], ['th', 'θ, angle with the axis of q', '°', Math.PI / 180]] },
    'esfera-aislada': { nombre: 'Isolated sphere with charge Q', campos: [Q, ['a', 'Distance from q to the centre a', 'cm', 1e-2, {}], ['R', 'Radius of the sphere R', 'cm', 1e-2, {}], ['Q', 'Total charge of the sphere Q', 'nC', 1e-9, { opcional: true, signo: true, cero: true, def: 0 }]], punto: [['r', 'r, distance to the centre', 'cm', 1e-2], ['th', 'θ, angle with the axis of q', '°', Math.PI / 180]] },
    'esfera-potencial': { nombre: 'Sphere at a potential V₀', campos: [Q, ['a', 'Distance from q to the centre a', 'cm', 1e-2, {}], ['R', 'Radius of the sphere R', 'cm', 1e-2, {}], ['V0', 'Potential of the sphere V₀', 'V', 1, { opcional: true, signo: true, cero: true, def: 0 }]], punto: [['r', 'r, distance to the centre', 'cm', 1e-2], ['th', 'θ, angle with the axis of q', '°', Math.PI / 180]] },
    cuna: { plana: true, nombre: 'Two planes at an angle (wedge π/n)', campos: [['n', 'Number n (the wedge angle is π/n)', '', 1, { entero: true }], Q, ['r0', 'Distance from q to the edge r₀', 'cm', 1e-2, {}], ['ph', 'Angle of q with a plane φ₀', '°', Math.PI / 180, {}]], punto: [['rp', 'r, distance to the edge', 'cm', 1e-2], ['php', 'φ, angle with the first plane', '°', 1]] },
    paralelos: { plana: true, nombre: 'Two parallel planes', campos: [Q, ['L', 'Distance between the planes L', 'cm', 1e-2, {}], ['d', 'Distance from q to the first plane d', 'cm', 1e-2, {}]], punto: [['rho', 'ρ, distance to the axis', 'cm', 1e-2], ['z', 'z, height above the first plane', 'cm', 1e-2]] },
    varias: { plana: true, nombre: 'Several charges in front of a plane', campos: [['q', 'Charge q₁', 'nC', 1e-9, { signo: true }], ['x1', 'x₁', 'cm', 1e-2, { signo: true, cero: true }], ['z1', 'z₁ (altura)', 'cm', 1e-2, {}], ['q2', 'Charge q₂ (optional)', 'nC', 1e-9, { opcional: true, signo: true }], ['x2', 'x₂', 'cm', 1e-2, { opcional: true, signo: true, cero: true }], ['z2', 'z₂ (altura)', 'cm', 1e-2, { opcional: true }], ['q3', 'Charge q₃ (optional)', 'nC', 1e-9, { opcional: true, signo: true }], ['x3', 'x₃', 'cm', 1e-2, { opcional: true, signo: true, cero: true }], ['z3', 'z₃ (altura)', 'cm', 1e-2, { opcional: true }]], punto: [] },
    dipolo: { plana: true, nombre: 'Dipole in front of a plane', campos: [['p', 'Dipole moment p', 'nC·cm', 1e-11, {}], ['d', 'Distance from the dipole to the plane d', 'cm', 1e-2, {}], ['th', 'Angle of p with the normal θ', '°', Math.PI / 180, { signo: true, cero: true }]], punto: [] },
    cavidad: { nombre: 'Charge inside a spherical cavity', campos: [Q, ['a', 'Distance from q to the centre a', 'cm', 1e-2, {}], ['R', 'Radius of the cavity R', 'cm', 1e-2, {}]], punto: [['r', 'r, distance to the centre', 'cm', 1e-2], ['th', 'θ, angle with the axis of q', '°', Math.PI / 180]] },
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
      if (n < 1 || n > 12) throw new Error('n must be between 1 and 12 (wedge angle π/n)');
      if (!(p.ph > 1e-9 && p.ph < alfa - 1e-9)) throw new Error(`φ₀ must be inside the wedge: between 0° and ${f(grados(alfa))}°`);
      for (let k = 0; k < n; k++) for (const sg of [1, -1]) {
        const ang = 2 * k * alfa + sg * p.ph;
        if (k === 0 && sg === 1) cargas.push({ q: p.q, x: p.r0 * Math.cos(ang), z: p.r0 * Math.sin(ang), real: true, nom: 'q' });
        else cargas.push({ q: sg * p.q, x: p.r0 * Math.cos(ang), z: p.r0 * Math.sin(ang), nom: `q′${cargas.length}`, ang: grados(ang) });
      }
      R.alfa = alfa; R.n = n; R.pos = p.r0; lim = p.r0;
      pasos.push({ t: 'Set-up', html: `Two grounded planes forming an angle $α = π/n = ${f(grados(alfa))}°$ ($n = ${n}$). If $α = π/n$ with $n$ an integer, the images all fall outside the wedge and $2n − 1 = ${2 * n - 1}$ image charges are enough, alternating in sign: $+q$ at $φ = 2kα + φ_0$ and $−q$ at $φ = 2kα − φ_0$, with $k = 0, …, n − 1$ and all at the distance $r_0$ from the edge.` });
      pasos.push({ t: 'Image charges', html: cargas.filter((c) => !c.real).map((c) => `$${c.q > 0 ? '+' : '−'}q$ at $φ = ${f(c.ang)}°$`).join('; ') + `. With ${n} positive and ${n} negative charges the sum of all of them is zero, and the wedge is at V = 0 on its two planes.` });
    } else if (modo === 'paralelos') {
      const { q, L, d } = p;
      if (!(d < L)) throw new Error('The charge must be between the planes (d < L)');
      for (let k = -2; k <= 2; k++) { if (k) cargas.push({ q, x: 0, z: 2 * k * L + d, nom: `+q (k = ${k})` }); cargas.push({ q: -q, x: 0, z: 2 * k * L - d, nom: `−q (k = ${k})` }); }
      cargas.unshift({ q, x: 0, z: d, real: true, nom: 'q' });
      cargas = cargas.sort((a, b) => (b.real ? 1 : 0) - (a.real ? 1 : 0));
      const t = d / L, Fz = ((K * q * q) / (4 * L * L)) * (trigamma(1 - t) - trigamma(t));
      R.imagenes = cargas.filter((c) => !c.real); R.Fz = Fz; R.Qa = -q * (1 - t); R.Qb = -q * t; R.L = L; R.pos = d; lim = L;
      const Vsuma = (rho, z, N) => { let V = 0; for (let k = -N; k <= N; k++) V += K * q * (1 / Math.hypot(rho, z - 2 * k * L - d) - 1 / Math.hypot(rho, z + d - 2 * k * L)); return V; };
      R.Vsuma = Vsuma;
      pasos.push({ t: 'Set-up', html: `Two grounded planes, $z = 0$ and $z = L = ${cm(L)} "cm"$, with $q$ at $d = ${cm(d)} "cm"$ from the first. Each plane reflects the charges of the other, so there are infinitely many images: $−q$ at $z = 2kL − d$ and $+q$ at $z = 2kL + d$, with $k$ an integer (the real one is $k = 0$ with + sign).` });
      pasos.push({ t: 'Force on q', html: `The $+q$ images cancel in pairs ($k$ and $−k$) and only the $−q$ ones act: $F = {q^2}/{16π ε_0} ∑_k {sg(kL − d)}/{(kL − d)^2} = {q^2}/{16π ε_0 L^2}[ψ_1(1 − d/L) − ψ_1(d/L)] = ${f(Fz)} "N"$ (with $ψ_1(x) = ∑_{k≥0} 1/(k + x)^2$). ` + (Math.abs(Fz) < 1e-15 * Math.abs(K * q * q / (L * L)) ? 'It is exactly in the middle: the forces cancel and it is zero.' : `It goes toward the ${Fz > 0 ? 'upper' : 'lower'} plane, the nearest one.`) });
      pasos.push({ t: 'Induced charge on each plane', html: `By Green's formula: $Q_0 = −q(1 − d/L) = ${f(R.Qa)} "C"$ on the plane $z = 0$ and $Q_L = −q d/L = ${f(R.Qb)} "C"$ on the plane $z = L$. They add up to $−q$.` });
      cajas.push(['Force on q', u(Math.abs(Fz), 'N'), Fz === 0 ? 'zero: it is in the middle' : Fz > 0 ? 'toward the upper plane' : 'toward the lower plane'], ['Induced charge at z = 0', u(R.Qa, 'C'), '−q (1 − d/L)'], ['Induced charge at z = L', u(R.Qb, 'C'), '−q d/L'], ['Images', 'infinitas', 'the sum converges as 1/k²']);
      R.Fmod = Math.abs(Fz); R.atractiva = true; R.Qe = R.Qa + R.Qb;
    } else if (modo === 'varias') {
      for (const [i, [kq, kx, kz]] of [['q', 'x1', 'z1'], ['q2', 'x2', 'z2'], ['q3', 'x3', 'z3']].entries()) {
        if (i && p[kq] === null) continue;
        if (p[kx] === null || p[kz] === null) throw new Error(`The position of charge ${i + 1} is missing`);
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
      pasos.push({ t: 'Set-up', html: `The plane $z = 0$ is grounded. Each charge $q_i$ at $(x_i, z_i)$ has its image $−q_i$ at $(x_i, −z_i)$ and the field in $z > 0$ is that of the ${2 * n} charges.` });
      pasos.push({ t: 'Force on each charge', html: reales.map((c, i) => `On $q_${i + 1}$ act the other real charges and all the images (including its own): $F_${i + 1} = (${f(F[i][0])}, ${f(F[i][1])}) "N"$, of magnitude $${f(Math.hypot(...F[i]))} "N"$`).join('; ') + '.' });
      pasos.push({ t: 'Total force and energy', html: `Force on the set of real charges: $(${f(Ftot[0])}, ${f(Ftot[1])}) "N"$. The energy of the system is half that of the charges with their images in the interaction with the plane: $U = ∑_{i<j} {q_i q_j}/{4π ε_0 r_{ij}} − ½ ∑_{i,j} {q_i q_j}/{4π ε_0 r_{ij′}} = ${f(Ue)} "J"$. Charge induced on the plane: $Q = −∑ q_i = ${f(R.Qe)} "C"$.` });
      cajas.push(...reales.map((c, i) => [`Force on ${c.nom}`, u(Math.hypot(...F[i]), 'N'), `F = (${f(F[i][0])}; ${f(F[i][1])}) N`]), ['Total force', u(Math.hypot(...Ftot), 'N'), `(${f(Ftot[0])}; ${f(Ftot[1])}) N`], ['Energy of the system', u(Ue, 'J'), 'U with the grounded plane'], ['Total induced charge', u(R.Qe, 'C'), '−Σ qᵢ']);
    } else {
      const { p: pm, d, th } = p, c2 = Math.cos(th) ** 2, px = pm * Math.sin(th), pz = pm * Math.cos(th);
      const Fz = (-3 * pm * pm * (1 + c2)) / (64 * Math.PI * EPS0 * d ** 4), tau = (-pm * pm * Math.sin(th) * Math.cos(th)) / (32 * Math.PI * EPS0 * d ** 3), U = (-pm * pm * (1 + c2)) / (64 * Math.PI * EPS0 * d ** 3);
      const l = 0.5 * d, dx = (l / 2) * Math.sin(th), dz = (l / 2) * Math.cos(th);
      cargas = [{ q: 1e-9, x: dx, z: d + dz, real: true, nom: '+' }, { q: -1e-9, x: -dx, z: d - dz, real: true, nom: '−' }, { q: -1e-9, x: dx, z: -d - dz, nom: '−′' }, { q: 1e-9, x: -dx, z: -d + dz, nom: '+′' }];
      R.imagenes = cargas.filter((c) => !c.real); R.Fz = Fz; R.Fmod = Math.abs(Fz); R.atractiva = true; R.tau = tau; R.U = U; R.W = U; R.pos = d; R.px = px; R.pz = pz; R.Qe = 0; lim = d;
      pasos.push({ t: 'Set-up', html: `A dipole $p = ${f(pm)} "C·m"$ at $d = ${cm(d)} "cm"$ from the grounded plane, with $p$ forming $θ = ${f(grados(th))}°$ with the normal. Its image is another dipole at $z = −d$ with the same normal component and the parallel one reversed: $p′ = (−p_x, p_z) = (${f(-px)}, ${f(pz)}) "C·m"$.` });
      pasos.push({ t: 'Energy', html: `The dipole-dipole interaction at distance $2d$ is $U_{int} = {p·p′ − 3(p·n)(p′·n)}/{4π ε_0 (2d)^3} = −{p^2 (1 + cos^2 θ)}/{32π ε_0 d^3}$, and the real energy is half of it (the image does not exist): $U = −{p^2 (1 + cos^2 θ)}/{64π ε_0 d^3} = ${f(U)} "J"$.` });
      pasos.push({ t: 'Force and torque', html: `$F_z = −{∂U}/{∂d} = −{3 p^2 (1 + cos^2 θ)}/{64π ε_0 d^4} = ${f(Fz)} "N"$ (attractive: the dipole is attracted toward the plane). The torque on $p$ is $τ_y = −{∂U}/{∂θ} = −{p^2 sin θ cos θ}/{32π ε_0 d^3} = ${f(tau)} "N·m"$` + (Math.abs(tau) < 1e-30 ? ': zero (θ = 0° or 90°).' : tau < 0 ? ': it tends to put the dipole perpendicular to the plane (reduces θ).' : ': it tends to put the dipole perpendicular to the plane (increases |θ| toward 180°).') });
      cajas.push(['Force on the dipole', u(Math.abs(Fz), 'N'), 'attractive, toward the plane'], ['Torque on the dipole', u(tau, 'N·m'), 'τ = −∂U/∂θ'], ['Energy', u(U, 'J'), 'interaction with the plane'], ['Image dipole', `(${f(-px)}; ${f(pz)}) C·m`, 'parallel reversed, normal the same']);
    }
    if (modo === 'cuna') {
      const real = cargas[0], F = fuerzaDe(0, cargas), ca = Math.cos(p.ph), sa = Math.sin(p.ph);
      R.imagenes = cargas.filter((c) => !c.real); R.F = F; R.Fx = F[0]; R.Fz = F[1]; R.Fmod = Math.hypot(...F); R.Fr = F[0] * ca + F[1] * sa; R.Fphi = -F[0] * sa + F[1] * ca; R.Qe = -p.q; R.atractiva = R.Fr < 0 || R.Fmod > 0;
      pasos.push({ t: 'Force on q', html: `The force is the sum of those of the ${2 * R.n - 1} images: $F = ∑ {q q_i′}/{4π ε_0 r_i^2}$ (vector). It comes out $F_r = ${f(R.Fr)} "N"$ (radial, away from the edge) and $F_φ = ${f(R.Fphi)} "N"$ (tangential), of magnitude $${f(R.Fmod)} "N"$.` });
      cajas.push(['Image charges', `${2 * R.n - 1}`, `n = ${R.n}, α = ${f(grados(R.alfa))}°`], ['Force on q', u(R.Fmod, 'N'), `F<sub>r</sub> = ${u(R.Fr, 'N', 3)}, F<sub>φ</sub> = ${u(R.Fphi, 'N', 3)}`], ['Total induced charge', u(-p.q, 'C'), 'equal and opposite to q']);
    }
    const [k1, k2] = M.punto.map((x) => x[0]);
    if (k1 && (!vacio(sc[k1]) || !vacio(sc[k2]))) {
      if (vacio(sc[k1]) || vacio(sc[k2])) throw new Error('Fill in both coordinates of the point, or leave them empty');
      const a1 = leeNum(sc[k1]), a2 = leeNum(sc[k2]);
      if (!isFinite(a1) || !isFinite(a2)) throw new Error('The coordinates of the point must be numbers');
      if (modo === 'cuna') {
        const r = a1 * 1e-2, ph = (a2 * Math.PI) / 180;
        if (r < 0) throw new Error('The distance r of the point cannot be negative');
        if (!(ph >= 0 && ph <= R.alfa + 1e-9)) throw new Error(`The point must be inside the wedge (φ between 0° and ${f(grados(R.alfa))}°)`);
        const c = campoXZ(cargas, r * Math.cos(ph), r * Math.sin(ph)); R.pt = { x: r * Math.cos(ph), z: r * Math.sin(ph), ...c, etiqueta: `r = ${cm(r)}, φ = ${f(a2)}°` };
      } else {
        const rho = a1 * 1e-2, z = a2 * 1e-2;
        if (!(z >= 0 && z <= p.L + 1e-12)) throw new Error('The point must be between the planes (0 ≤ z ≤ L)');
        const N = 20000, h = 1e-6 * p.L, V = R.Vsuma(rho, z, N), Ez = -(R.Vsuma(rho, z + h, N) - R.Vsuma(rho, z - h, N)) / (2 * h), Er = -(R.Vsuma(rho + h, z, N) - R.Vsuma(Math.max(rho - h, 0), z, N)) / (rho > h ? 2 * h : h + rho);
        R.pt = { x: rho, z, V, Ex: Er, Ez, E: Math.hypot(Er, Ez), etiqueta: `ρ = ${cm(rho)}, z = ${cm(z)}` };
      }
      pasos.push({ t: 'Potential and field at the point', html: `Adding the charge and all its images: $V = ${f(R.pt.V)} "V"$, $E_x = ${f(R.pt.Ex)} "V/m"$, $E_z = ${f(R.pt.Ez)} "V/m"$, $|E| = ${f(R.pt.E)} "V/m"$.` });
      cajas.push(['V at the point', u(R.pt.V, 'V'), R.pt.etiqueta], ['|E| at the point', u(R.pt.E, 'V/m'), `E<sub>x</sub> = ${u(R.pt.Ex, 'V/m', 3)}, E<sub>z</sub> = ${u(R.pt.Ez, 'V/m', 3)}`]);
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
      if (cav && !(p.a < p.R)) throw new Error('The charge must be inside the cavity (a < R)');
      if (!cav && !(p.a > p.R)) throw new Error('The charge must be outside the sphere (a > R)');
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
      if (vacio(v1)) throw new Error(`The ${n1} of the point is missing`);
      if (vacio(v2)) throw new Error(`The ${n2} of the point is missing`);
      const a1 = leeNum(v1), a2 = leeNum(v2);
      if (!isFinite(a1) || !isFinite(a2)) throw new Error('The coordinates of the point must be numbers');
      let rho, z, th = null, r = null;
      if (!esfera) { rho = a1 * 1e-2; z = a2 * 1e-2; if (z <= 0) throw new Error('The point must be on the side of the charge (z > 0)'); }
      else {
        r = a1 * 1e-2; th = (a2 * Math.PI) / 180;
        if (r < 0) throw new Error('The distance r of the point cannot be negative');
        if (!cav && r <= R) throw new Error('The point must be outside the sphere (r > R)');
        if (cav && r >= R) throw new Error('The point must be inside the cavity (r < R)');
        rho = r * Math.sin(th); z = r * Math.cos(th);
      }
      const c = campo(cargas, z, rho);
      pt = { rho, z, r, th, ...c, sigma: !esfera ? sigma(rho) : sigma(th) };
    }

    const pasos = [];
    const cm = (x) => f(x * 100);
    if (!esfera) {
      pasos.push({ t: 'Set-up', html: `The plane is grounded (V = 0 at z = 0). The conductor is removed and an image charge that gives V = 0 on the plane is placed: the opposite one, at the symmetric point. Valid for z > 0.` });
      pasos.push({ t: 'Image charge', html: `$q′ = −q = ${uq(-q, 'C')}$ at $z = −d = −${cm(p.d)} "cm"$.` });
    } else if (!cav) {
      pasos.push({ t: 'Set-up', html: `The sphere is removed and an image charge is sought inside, on the axis, that gives V = 0 at r = R. It is the image of q with respect to the sphere.` });
      pasos.push({ t: 'Image charge', html: `$q′ = −{q R}/a = −{${f(q)} · ${f(R)}}/{${f(p.a)}} = ${f(imagenes[0].q)} "C"$, at a distance $a′ = R^2/a = {${f(R)}^2}/{${f(p.a)}} = ${cm(imagenes[0].z)} "cm"$ from the centre.` });
      if (modo === 'esfera-tierra') pasos.push({ t: 'Grounded sphere', html: `With V = 0 a single image is enough. The total charge of the sphere is that of the image: $Q = q′ = ${uq(Qe, 'C')}$.` });
      else {
        if (modo === 'esfera-aislada') pasos.push({ t: 'Isolated sphere', html: `The sphere has total charge $Q = ${f(Qe)} "C"$. The image q′ already contributes ${f(imagenes[0].q)} C and the rest is placed at the centre, so that the surface remains equipotential: $q″ = Q − q′ = ${f(Qe)} − (${f(imagenes[0].q)}) = ${f(q2)} "C"$, at $z = 0$.` });
        else pasos.push({ t: 'Sphere at a potential', html: `The sphere is at $V_0 = ${f(V0)} "V"$. The charge q″ at the centre fixes it: $q″ = 4π ε_0 R V_0 = ${f(q2)} "C"$, at $z = 0$, and the total charge of the sphere is $Q = q′ + q″ = ${f(Qe)} "C"$.` });
        pasos.push({ t: 'Potential of the sphere', html: `$V_{sphere} = {q″}/{4π ε_0 R} = ${f(V0)} "V"$ (uniform: the whole sphere is equipotential).` });
      }
    } else {
      pasos.push({ t: 'Set-up', html: `The charge is inside a spherical cavity of radius R in a conductor. An image charge is sought outside the cavity, on the axis, that gives V = 0 at r = R (valid for r < R).` });
      pasos.push({ t: 'Image charge', html: imagenes.length ? `$q′ = −{q R}/a = −{${f(q)} · ${f(R)}}/{${f(p.a)}} = ${f(imagenes[0].q)} "C"$, at a distance $a′ = R^2/a = ${cm(imagenes[0].z)} "cm"$ from the centre, outside the cavity.` : 'If the charge is at the centre no image is needed: the field inside is that of q alone.' });
      pasos.push({ t: 'Induced charge', html: `Exactly $−q = ${f(-q)} "C"$ is induced on the cavity wall (Gauss): the field inside the conductor is zero.` });
    }
    const Fmod = Math.abs(Fz);
    if (modo === 'plano') pasos.push({ t: 'Force on q', html: `The force is that of q with its image, at a distance 2d: $F = {q q′}/{4π ε_0 (2d)^2} = −{q^2}/{16π ε_0 d^2} = −{(${f(q)})^2}/{16π · ${f(EPS0)} · (${f(p.d)})^2} = ${f(Fz)} "N"$ (${atractiva ? 'attractive, toward the plane' : 'repulsive'}).` });
    else if (modo === 'esfera-tierra') pasos.push({ t: 'Force on q', html: `Between q and its image there is $a − a′ = ${cm(p.a - imagenes[0].z)} "cm"$: $F = {q q′}/{4π ε_0 (a − a′)^2} = −{q^2 R a}/{4π ε_0 (a^2 − R^2)^2} = ${f(Fz)} "N"$ (${atractiva ? 'attractive, toward the sphere' : 'repulsive'}).` });
    else if (!cav) pasos.push({ t: 'Force on q', html: `Both images act: $F = {q}/{4π ε_0}[{q′}/{(a − a′)^2} + {q″}/{a^2}] = ${f(K * q)} [{${f(imagenes[0].q)}}/{(${f(p.a - imagenes[0].z)})^2} + {${f(q2)}}/{(${f(p.a)})^2}] = ${f(Fz)} "N"$ (${atractiva ? 'attractive' : 'repulsive'}, ${atractiva ? 'toward the sphere' : 'away from the sphere'}).` });
    else pasos.push({ t: 'Force on q', html: imagenes.length ? `Between q and its image there is $a′ − a = ${cm(imagenes[0].z - p.a)} "cm"$: $F = {q q′}/{4π ε_0 (a′ − a)^2} = {q^2 R a}/{4π ε_0 (R^2 − a^2)^2} = ${f(Math.abs(Fz))} "N"$ (attractive, toward the nearest part of the wall).` : '$F = 0$ by symmetry.' });
    if (modo === 'plano') pasos.push({ t: 'Induced charge', html: `With $σ = ε_0 E_n$ on the plane: $σ(ρ) = −{q d}/{2π (ρ^2 + d^2)^{3/2}}$. At ρ = 0: $σ_{max} = −{q}/{2π d^2} = ${f(sigmaMax)} "C/m²"$. Integrating over the whole plane gives $Q_{ind} = −q = ${f(-q)} "C"$.` });
    else pasos.push({ t: 'Induced charge density', html: `$σ(θ) = −{q (${cav ? 'R^2 − a^2' : 'a^2 − R^2'})}/{4π R (R^2 + a^2 − 2 a R cos θ)^{3/2}}${!cav && q2 !== 0 ? ' + {q″}/{4π R^2}' : ''}$. At the point closest to q (θ = 0): $σ = ${f(sigmaMax)} "C/m²"$.` });
    if (W !== null) pasos.push({ t: 'Work to take q to infinity', html: modo === 'plano' ? `$W = ∫_d^∞ {q^2}/{16π ε_0 x^2} dx = {q^2}/{16π ε_0 d} = ${uq(W, 'J')}$ (it is the energy of the system, half that of the two real charges).` : `$W = ∫_a^∞ F dx = {q^2 R}/{8π ε_0 (a^2 − R^2)} = ${uq(W, 'J')}$.` });
    if (pt) {
      const lista = cargas.map((c, i) => `r<sub>${i}</sub> = ${cm(Math.hypot(pt.z - c.z, pt.rho))} cm`).join(', ');
      pasos.push({ t: 'Potential at the point', html: `The contributions of q and of ${imagenes.length > 1 ? 'the images' : 'its image'} are added: $V = {1}/{4π ε_0} Σ {q_i}/{r_i}$, with ${lista}. The result is $V = ${f(pt.V)} "V"$.` });
      pasos.push({ t: 'Field at the point', html: `$E_z = ${f(pt.Ez)} "V/m"$, $E_ρ = ${f(pt.Er)} "V/m"$, $|E| = ${f(pt.E)} "V/m"$.` });
      pasos.push({ t: 'Induced charge below the point', html: `${!esfera ? `Below the point (ρ = ${cm(pt.rho)} cm)` : `At the point of the surface with the same angle (θ = ${f((pt.th * 180) / Math.PI)}°)`}: $σ = ${f(pt.sigma)} "C/m²"$.` });
    }
    return { modo, esfera, cav, p, q, pos, R, imagenes, cargas, Fz, Fmod, atractiva, Qe, V0, q2, sigma, sigmaMax, W, pt, pasos };
  }

  const ejemplos = [
    { clave: 'plano', nombre: '5 nC charge at 3 cm from a grounded plane', sc: { modo: 'plano', q: '5', d: '3', rho: '4', z: '3' } },
    { clave: 'esfera-tierra', nombre: '10 nC charge in front of a grounded sphere', sc: { modo: 'esfera-tierra', q: '10', a: '30', R: '10', r: '15', th: '0' } },
    { clave: 'esfera-neutra', nombre: 'The same charge in front of a neutral isolated sphere', sc: { modo: 'esfera-aislada', q: '10', a: '30', R: '10', Q: '0', r: '15', th: '0' } },
    { clave: 'esfera-potencial', nombre: 'Sphere at 500 V with a charge nearby', sc: { modo: 'esfera-potencial', q: '2', a: '20', R: '5', V0: '500', r: '10', th: '90' } },
    { clave: 'cavidad', nombre: '5 nC charge inside a spherical cavity', sc: { modo: 'cavidad', q: '5', a: '6', R: '10', r: '3', th: '60' } },
    { clave: 'cuna-90', nombre: '5 nC charge in a 90° wedge (n = 2, IM-1)', sc: { modo: 'cuna', n: '2', q: '5', r0: '5', ph: '30', rp: '', php: '' } },
    { clave: 'cuna-60', nombre: '5 nC charge in a 60° wedge (n = 3, five images)', sc: { modo: 'cuna', n: '3', q: '5', r0: '4', ph: '20', rp: '3', php: '40' } },
    { clave: 'paralelos', nombre: '5 nC charge between two parallel planes 10 cm apart (IM-1)', sc: { modo: 'paralelos', q: '5', L: '10', d: '3', rho: '2', z: '5' } },
    { clave: 'varias', nombre: 'Two charges of opposite sign in front of a plane (IM-4)', sc: { modo: 'varias', q: '5', x1: '-3', z1: '4', q2: '-3', x2: '3', z2: '6', q3: '', x3: '', z3: '' } },
    { clave: 'dipolo', nombre: 'Dipole of 10 nC·cm at 4 cm from the plane, at 30° from the normal (IM-4)', sc: { modo: 'dipolo', p: '10', d: '4', th: '30' } },
  ];

  return { resolver, ejemplos, campo, campoXZ, trigamma, MODOS, f, u, EPS0, K };
})();

