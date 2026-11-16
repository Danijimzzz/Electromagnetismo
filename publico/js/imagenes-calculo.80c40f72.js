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
    if (vacio(sc[k])) { if (opcional) return def; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (entero && !Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número entero`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    if (signo && !cero && v === 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} no puede ser 0`);
    return v;
  };

  const Q = ['q', 'Carga q', 'nC', 1e-9, { signo: true }];
  const MODOS = {
    plano: { nombre: 'Plano conductor a tierra', campos: [Q, ['d', 'Distancia de q al plano d', 'cm', 1e-2, {}]], punto: [['rho', 'ρ, distancia al eje', 'cm', 1e-2], ['z', 'z, altura sobre el plano', 'cm', 1e-2]] },
    'esfera-tierra': { nombre: 'Esfera conductora a tierra', campos: [Q, ['a', 'Distancia de q al centro a', 'cm', 1e-2, {}], ['R', 'Radio de la esfera R', 'cm', 1e-2, {}]], punto: [['r', 'r, distancia al centro', 'cm', 1e-2], ['th', 'θ, ángulo con el eje de q', '°', Math.PI / 180]] },
    'esfera-aislada': { nombre: 'Esfera aislada con carga Q', campos: [Q, ['a', 'Distancia de q al centro a', 'cm', 1e-2, {}], ['R', 'Radio de la esfera R', 'cm', 1e-2, {}], ['Q', 'Carga total de la esfera Q', 'nC', 1e-9, { opcional: true, signo: true, cero: true, def: 0 }]], punto: [['r', 'r, distancia al centro', 'cm', 1e-2], ['th', 'θ, ángulo con el eje de q', '°', Math.PI / 180]] },
    'esfera-potencial': { nombre: 'Esfera a un potencial V₀', campos: [Q, ['a', 'Distancia de q al centro a', 'cm', 1e-2, {}], ['R', 'Radio de la esfera R', 'cm', 1e-2, {}], ['V0', 'Potencial de la esfera V₀', 'V', 1, { opcional: true, signo: true, cero: true, def: 0 }]], punto: [['r', 'r, distancia al centro', 'cm', 1e-2], ['th', 'θ, ángulo con el eje de q', '°', Math.PI / 180]] },
    cuna: { plana: true, nombre: 'Dos planos en ángulo (cuña π/n)', campos: [['n', 'Número n (el ángulo de la cuña es π/n)', '', 1, { entero: true }], Q, ['r0', 'Distancia de q a la arista r₀', 'cm', 1e-2, {}], ['ph', 'Ángulo de q con un plano φ₀', '°', Math.PI / 180, {}]], punto: [['rp', 'r, distancia a la arista', 'cm', 1e-2], ['php', 'φ, ángulo con el primer plano', '°', 1]] },
    paralelos: { plana: true, nombre: 'Dos planos paralelos', campos: [Q, ['L', 'Distancia entre los planos L', 'cm', 1e-2, {}], ['d', 'Distancia de q al primer plano d', 'cm', 1e-2, {}]], punto: [['rho', 'ρ, distancia al eje', 'cm', 1e-2], ['z', 'z, altura sobre el primer plano', 'cm', 1e-2]] },
    varias: { plana: true, nombre: 'Varias cargas frente a un plano', campos: [['q', 'Carga q₁', 'nC', 1e-9, { signo: true }], ['x1', 'x₁', 'cm', 1e-2, { signo: true, cero: true }], ['z1', 'z₁ (altura)', 'cm', 1e-2, {}], ['q2', 'Carga q₂ (opcional)', 'nC', 1e-9, { opcional: true, signo: true }], ['x2', 'x₂', 'cm', 1e-2, { opcional: true, signo: true, cero: true }], ['z2', 'z₂ (altura)', 'cm', 1e-2, { opcional: true }], ['q3', 'Carga q₃ (opcional)', 'nC', 1e-9, { opcional: true, signo: true }], ['x3', 'x₃', 'cm', 1e-2, { opcional: true, signo: true, cero: true }], ['z3', 'z₃ (altura)', 'cm', 1e-2, { opcional: true }]], punto: [] },
    dipolo: { plana: true, nombre: 'Dipolo frente a un plano', campos: [['p', 'Momento dipolar p', 'nC·cm', 1e-11, {}], ['d', 'Distancia del dipolo al plano d', 'cm', 1e-2, {}], ['th', 'Ángulo de p con la normal θ', '°', Math.PI / 180, { signo: true, cero: true }]], punto: [] },
    cavidad: { nombre: 'Carga dentro de una cavidad esférica', campos: [Q, ['a', 'Distancia de q al centro a', 'cm', 1e-2, {}], ['R', 'Radio de la cavidad R', 'cm', 1e-2, {}]], punto: [['r', 'r, distancia al centro', 'cm', 1e-2], ['th', 'θ, ángulo con el eje de q', '°', Math.PI / 180]] },
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
      if (n < 1 || n > 12) throw new Error('n tiene que estar entre 1 y 12 (ángulo de la cuña π/n)');
      if (!(p.ph > 1e-9 && p.ph < alfa - 1e-9)) throw new Error(`φ₀ tiene que estar dentro de la cuña: entre 0° y ${f(grados(alfa))}°`);
      for (let k = 0; k < n; k++) for (const sg of [1, -1]) {
        const ang = 2 * k * alfa + sg * p.ph;
        if (k === 0 && sg === 1) cargas.push({ q: p.q, x: p.r0 * Math.cos(ang), z: p.r0 * Math.sin(ang), real: true, nom: 'q' });
        else cargas.push({ q: sg * p.q, x: p.r0 * Math.cos(ang), z: p.r0 * Math.sin(ang), nom: `q′${cargas.length}`, ang: grados(ang) });
      }
      R.alfa = alfa; R.n = n; R.pos = p.r0; lim = p.r0;
      pasos.push({ t: 'Planteamiento', html: `Dos planos a tierra que forman un ángulo $α = π/n = ${f(grados(alfa))}°$ ($n = ${n}$). Si $α = π/n$ con $n$ entero, las imágenes caen todas fuera de la cuña y bastan $2n − 1 = ${2 * n - 1}$ cargas imagen, alternando signo: $+q$ en $φ = 2kα + φ_0$ y $−q$ en $φ = 2kα − φ_0$, con $k = 0, …, n − 1$ y todas a la distancia $r_0$ de la arista.` });
      pasos.push({ t: 'Cargas imagen', html: cargas.filter((c) => !c.real).map((c) => `$${c.q > 0 ? '+' : '−'}q$ en $φ = ${f(c.ang)}°$`).join('; ') + `. Con ${n} cargas positivas y ${n} negativas la suma de todas es cero, y la cuña queda a V = 0 en sus dos planos.` });
    } else if (modo === 'paralelos') {
      const { q, L, d } = p;
      if (!(d < L)) throw new Error('La carga tiene que estar entre los planos (d < L)');
      for (let k = -2; k <= 2; k++) { if (k) cargas.push({ q, x: 0, z: 2 * k * L + d, nom: `+q (k = ${k})` }); cargas.push({ q: -q, x: 0, z: 2 * k * L - d, nom: `−q (k = ${k})` }); }
      cargas.unshift({ q, x: 0, z: d, real: true, nom: 'q' });
      cargas = cargas.sort((a, b) => (b.real ? 1 : 0) - (a.real ? 1 : 0));
      const t = d / L, Fz = ((K * q * q) / (4 * L * L)) * (trigamma(1 - t) - trigamma(t));
      R.imagenes = cargas.filter((c) => !c.real); R.Fz = Fz; R.Qa = -q * (1 - t); R.Qb = -q * t; R.L = L; R.pos = d; lim = L;
      const Vsuma = (rho, z, N) => { let V = 0; for (let k = -N; k <= N; k++) V += K * q * (1 / Math.hypot(rho, z - 2 * k * L - d) - 1 / Math.hypot(rho, z + d - 2 * k * L)); return V; };
      R.Vsuma = Vsuma;
      pasos.push({ t: 'Planteamiento', html: `Dos planos a tierra, $z = 0$ y $z = L = ${cm(L)} "cm"$, con $q$ a $d = ${cm(d)} "cm"$ del primero. Cada plano refleja las cargas del otro, así que hay imágenes infinitas: $−q$ en $z = 2kL − d$ y $+q$ en $z = 2kL + d$, con $k$ entero (la real es $k = 0$ con signo +).` });
      pasos.push({ t: 'Fuerza sobre q', html: `Las imágenes $+q$ se anulan por parejas ($k$ y $−k$) y solo actúan las $−q$: $F = {q^2}/{16π ε_0} ∑_k {sg(kL − d)}/{(kL − d)^2} = {q^2}/{16π ε_0 L^2}[ψ_1(1 − d/L) − ψ_1(d/L)] = ${f(Fz)} "N"$ (con $ψ_1(x) = ∑_{k≥0} 1/(k + x)^2$). ` + (Math.abs(Fz) < 1e-15 * Math.abs(K * q * q / (L * L)) ? 'Está justo en el medio: las fuerzas se compensan y es nula.' : `Va hacia el plano ${Fz > 0 ? 'de arriba' : 'de abajo'}, el más cercano.`) });
      pasos.push({ t: 'Carga inducida en cada plano', html: `Por la fórmula de Green: $Q_0 = −q(1 − d/L) = ${f(R.Qa)} "C"$ en el plano $z = 0$ y $Q_L = −q d/L = ${f(R.Qb)} "C"$ en el plano $z = L$. Suman $−q$.` });
      cajas.push(['Fuerza sobre q', u(Math.abs(Fz), 'N'), Fz === 0 ? 'nula: está en el medio' : Fz > 0 ? 'hacia el plano de arriba' : 'hacia el plano de abajo'], ['Carga inducida en z = 0', u(R.Qa, 'C'), '−q (1 − d/L)'], ['Carga inducida en z = L', u(R.Qb, 'C'), '−q d/L'], ['Imágenes', 'infinitas', 'la suma converge como 1/k²']);
      R.Fmod = Math.abs(Fz); R.atractiva = true; R.Qe = R.Qa + R.Qb;
    } else if (modo === 'varias') {
      for (const [i, [kq, kx, kz]] of [['q', 'x1', 'z1'], ['q2', 'x2', 'z2'], ['q3', 'x3', 'z3']].entries()) {
        if (i && p[kq] === null) continue;
        if (p[kx] === null || p[kz] === null) throw new Error(`Falta la posición de la carga ${i + 1}`);
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
      pasos.push({ t: 'Planteamiento', html: `El plano $z = 0$ está a tierra. Cada carga $q_i$ en $(x_i, z_i)$ tiene su imagen $−q_i$ en $(x_i, −z_i)$ y el campo en $z > 0$ es el de las ${2 * n} cargas.` });
      pasos.push({ t: 'Fuerza sobre cada carga', html: reales.map((c, i) => `Sobre $q_${i + 1}$ actúan las otras cargas reales y todas las imágenes (también la suya): $F_${i + 1} = (${f(F[i][0])}, ${f(F[i][1])}) "N"$, de módulo $${f(Math.hypot(...F[i]))} "N"$`).join('; ') + '.' });
      pasos.push({ t: 'Fuerza total y energía', html: `Fuerza sobre el conjunto de cargas reales: $(${f(Ftot[0])}, ${f(Ftot[1])}) "N"$. La energía del sistema es la mitad de la de las cargas con sus imágenes en la interacción con el plano: $U = ∑_{i<j} {q_i q_j}/{4π ε_0 r_{ij}} − ½ ∑_{i,j} {q_i q_j}/{4π ε_0 r_{ij′}} = ${f(Ue)} "J"$. Carga inducida en el plano: $Q = −∑ q_i = ${f(R.Qe)} "C"$.` });
      cajas.push(...reales.map((c, i) => [`Fuerza sobre ${c.nom}`, u(Math.hypot(...F[i]), 'N'), `F = (${f(F[i][0])}; ${f(F[i][1])}) N`]), ['Fuerza total', u(Math.hypot(...Ftot), 'N'), `(${f(Ftot[0])}; ${f(Ftot[1])}) N`], ['Energía del sistema', u(Ue, 'J'), 'U con el plano a tierra'], ['Carga inducida total', u(R.Qe, 'C'), '−Σ qᵢ']);
    } else {
      const { p: pm, d, th } = p, c2 = Math.cos(th) ** 2, px = pm * Math.sin(th), pz = pm * Math.cos(th);
      const Fz = (-3 * pm * pm * (1 + c2)) / (64 * Math.PI * EPS0 * d ** 4), tau = (-pm * pm * Math.sin(th) * Math.cos(th)) / (32 * Math.PI * EPS0 * d ** 3), U = (-pm * pm * (1 + c2)) / (64 * Math.PI * EPS0 * d ** 3);
      const l = 0.5 * d, dx = (l / 2) * Math.sin(th), dz = (l / 2) * Math.cos(th);
      cargas = [{ q: 1e-9, x: dx, z: d + dz, real: true, nom: '+' }, { q: -1e-9, x: -dx, z: d - dz, real: true, nom: '−' }, { q: -1e-9, x: dx, z: -d - dz, nom: '−′' }, { q: 1e-9, x: -dx, z: -d + dz, nom: '+′' }];
      R.imagenes = cargas.filter((c) => !c.real); R.Fz = Fz; R.Fmod = Math.abs(Fz); R.atractiva = true; R.tau = tau; R.U = U; R.W = U; R.pos = d; R.px = px; R.pz = pz; R.Qe = 0; lim = d;
      pasos.push({ t: 'Planteamiento', html: `Un dipolo $p = ${f(pm)} "C·m"$ a $d = ${cm(d)} "cm"$ del plano a tierra, con $p$ formando $θ = ${f(grados(th))}°$ con la normal. Su imagen es otro dipolo en $z = −d$ con la componente normal igual y la paralela invertida: $p′ = (−p_x, p_z) = (${f(-px)}, ${f(pz)}) "C·m"$.` });
      pasos.push({ t: 'Energía', html: `La interacción dipolo-dipolo a la distancia $2d$ es $U_{int} = {p·p′ − 3(p·n)(p′·n)}/{4π ε_0 (2d)^3} = −{p^2 (1 + cos^2 θ)}/{32π ε_0 d^3}$, y la energía real es la mitad (la imagen no existe): $U = −{p^2 (1 + cos^2 θ)}/{64π ε_0 d^3} = ${f(U)} "J"$.` });
      pasos.push({ t: 'Fuerza y par', html: `$F_z = −{∂U}/{∂d} = −{3 p^2 (1 + cos^2 θ)}/{64π ε_0 d^4} = ${f(Fz)} "N"$ (atractiva: el dipolo es atraído hacia el plano). El par sobre $p$ es $τ_y = −{∂U}/{∂θ} = −{p^2 sen θ cos θ}/{32π ε_0 d^3} = ${f(tau)} "N·m"$` + (Math.abs(tau) < 1e-30 ? ': nulo (θ = 0° o 90°).' : tau < 0 ? ': tiende a poner el dipolo perpendicular al plano (reduce θ).' : ': tiende a poner el dipolo perpendicular al plano (aumenta |θ| hacia 180°).') });
      cajas.push(['Fuerza sobre el dipolo', u(Math.abs(Fz), 'N'), 'atractiva, hacia el plano'], ['Par sobre el dipolo', u(tau, 'N·m'), 'τ = −∂U/∂θ'], ['Energía', u(U, 'J'), 'interacción con el plano'], ['Dipolo imagen', `(${f(-px)}; ${f(pz)}) C·m`, 'paralela invertida, normal igual']);
    }
    if (modo === 'cuna') {
      const real = cargas[0], F = fuerzaDe(0, cargas), ca = Math.cos(p.ph), sa = Math.sin(p.ph);
      R.imagenes = cargas.filter((c) => !c.real); R.F = F; R.Fx = F[0]; R.Fz = F[1]; R.Fmod = Math.hypot(...F); R.Fr = F[0] * ca + F[1] * sa; R.Fphi = -F[0] * sa + F[1] * ca; R.Qe = -p.q; R.atractiva = R.Fr < 0 || R.Fmod > 0;
      pasos.push({ t: 'Fuerza sobre q', html: `La fuerza es la suma de las de las ${2 * R.n - 1} imágenes: $F = ∑ {q q_i′}/{4π ε_0 r_i^2}$ (vector). Sale $F_r = ${f(R.Fr)} "N"$ (radial, desde la arista) y $F_φ = ${f(R.Fphi)} "N"$ (tangencial), de módulo $${f(R.Fmod)} "N"$.` });
      cajas.push(['Cargas imagen', `${2 * R.n - 1}`, `n = ${R.n}, α = ${f(grados(R.alfa))}°`], ['Fuerza sobre q', u(R.Fmod, 'N'), `F<sub>r</sub> = ${u(R.Fr, 'N', 3)}, F<sub>φ</sub> = ${u(R.Fphi, 'N', 3)}`], ['Carga inducida total', u(-p.q, 'C'), 'igual y opuesta a q']);
    }
    const [k1, k2] = M.punto.map((x) => x[0]);
    if (k1 && (!vacio(sc[k1]) || !vacio(sc[k2]))) {
      if (vacio(sc[k1]) || vacio(sc[k2])) throw new Error('Rellena las dos coordenadas del punto, o déjalas vacías');
      const a1 = leeNum(sc[k1]), a2 = leeNum(sc[k2]);
      if (!isFinite(a1) || !isFinite(a2)) throw new Error('Las coordenadas del punto deben ser números');
      if (modo === 'cuna') {
        const r = a1 * 1e-2, ph = (a2 * Math.PI) / 180;
        if (r < 0) throw new Error('La distancia r del punto no puede ser negativa');
        if (!(ph >= 0 && ph <= R.alfa + 1e-9)) throw new Error(`El punto tiene que estar dentro de la cuña (φ entre 0° y ${f(grados(R.alfa))}°)`);
        const c = campoXZ(cargas, r * Math.cos(ph), r * Math.sin(ph)); R.pt = { x: r * Math.cos(ph), z: r * Math.sin(ph), ...c, etiqueta: `r = ${cm(r)}, φ = ${f(a2)}°` };
      } else {
        const rho = a1 * 1e-2, z = a2 * 1e-2;
        if (!(z >= 0 && z <= p.L + 1e-12)) throw new Error('El punto tiene que estar entre los planos (0 ≤ z ≤ L)');
        const N = 20000, h = 1e-6 * p.L, V = R.Vsuma(rho, z, N), Ez = -(R.Vsuma(rho, z + h, N) - R.Vsuma(rho, z - h, N)) / (2 * h), Er = -(R.Vsuma(rho + h, z, N) - R.Vsuma(Math.max(rho - h, 0), z, N)) / (rho > h ? 2 * h : h + rho);
        R.pt = { x: rho, z, V, Ex: Er, Ez, E: Math.hypot(Er, Ez), etiqueta: `ρ = ${cm(rho)}, z = ${cm(z)}` };
      }
      pasos.push({ t: 'Potencial y campo en el punto', html: `Sumando la carga y todas sus imágenes: $V = ${f(R.pt.V)} "V"$, $E_x = ${f(R.pt.Ex)} "V/m"$, $E_z = ${f(R.pt.Ez)} "V/m"$, $|E| = ${f(R.pt.E)} "V/m"$.` });
      cajas.push(['V en el punto', u(R.pt.V, 'V'), R.pt.etiqueta], ['|E| en el punto', u(R.pt.E, 'V/m'), `E<sub>x</sub> = ${u(R.pt.Ex, 'V/m', 3)}, E<sub>z</sub> = ${u(R.pt.Ez, 'V/m', 3)}`]);
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
      if (cav && !(p.a < p.R)) throw new Error('La carga tiene que estar dentro de la cavidad (a < R)');
      if (!cav && !(p.a > p.R)) throw new Error('La carga tiene que estar fuera de la esfera (a > R)');
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
      if (vacio(v1)) throw new Error(`Falta ${n1} del punto`);
      if (vacio(v2)) throw new Error(`Falta ${n2} del punto`);
      const a1 = leeNum(v1), a2 = leeNum(v2);
      if (!isFinite(a1) || !isFinite(a2)) throw new Error('Las coordenadas del punto deben ser números');
      let rho, z, th = null, r = null;
      if (!esfera) { rho = a1 * 1e-2; z = a2 * 1e-2; if (z <= 0) throw new Error('El punto tiene que estar del lado de la carga (z > 0)'); }
      else {
        r = a1 * 1e-2; th = (a2 * Math.PI) / 180;
        if (r < 0) throw new Error('La distancia r del punto no puede ser negativa');
        if (!cav && r <= R) throw new Error('El punto tiene que estar fuera de la esfera (r > R)');
        if (cav && r >= R) throw new Error('El punto tiene que estar dentro de la cavidad (r < R)');
        rho = r * Math.sin(th); z = r * Math.cos(th);
      }
      const c = campo(cargas, z, rho);
      pt = { rho, z, r, th, ...c, sigma: !esfera ? sigma(rho) : sigma(th) };
    }

    const pasos = [];
    const cm = (x) => f(x * 100);
    if (!esfera) {
      pasos.push({ t: 'Planteamiento', html: `El plano está a tierra (V = 0 en z = 0). Se quita el conductor y se pone una carga imagen que dé V = 0 en el plano: la opuesta, en el punto simétrico. Vale para z > 0.` });
      pasos.push({ t: 'Carga imagen', html: `$q′ = −q = ${uq(-q, 'C')}$ en $z = −d = −${cm(p.d)} "cm"$.` });
    } else if (!cav) {
      pasos.push({ t: 'Planteamiento', html: `Se quita la esfera y se busca una carga imagen en el interior, sobre el eje, que dé V = 0 en r = R. Es la imagen de q respecto a la esfera.` });
      pasos.push({ t: 'Carga imagen', html: `$q′ = −{q R}/a = −{${f(q)} · ${f(R)}}/{${f(p.a)}} = ${f(imagenes[0].q)} "C"$, a una distancia $a′ = R^2/a = {${f(R)}^2}/{${f(p.a)}} = ${cm(imagenes[0].z)} "cm"$ del centro.` });
      if (modo === 'esfera-tierra') pasos.push({ t: 'Esfera a tierra', html: `Con V = 0 basta una sola imagen. La carga total de la esfera es la de la imagen: $Q = q′ = ${uq(Qe, 'C')}$.` });
      else {
        if (modo === 'esfera-aislada') pasos.push({ t: 'Esfera aislada', html: `La esfera tiene carga total $Q = ${f(Qe)} "C"$. La imagen q′ ya aporta ${f(imagenes[0].q)} C y el resto se pone en el centro, para que la superficie siga siendo equipotencial: $q″ = Q − q′ = ${f(Qe)} − (${f(imagenes[0].q)}) = ${f(q2)} "C"$, en $z = 0$.` });
        else pasos.push({ t: 'Esfera a un potencial', html: `La esfera está a $V_0 = ${f(V0)} "V"$. La carga q″ del centro la fija: $q″ = 4π ε_0 R V_0 = ${f(q2)} "C"$, en $z = 0$, y la carga total de la esfera es $Q = q′ + q″ = ${f(Qe)} "C"$.` });
        pasos.push({ t: 'Potencial de la esfera', html: `$V_{esfera} = {q″}/{4π ε_0 R} = ${f(V0)} "V"$ (uniforme: toda la esfera es equipotencial).` });
      }
    } else {
      pasos.push({ t: 'Planteamiento', html: `La carga está dentro de una cavidad esférica de radio R en un conductor. Se busca una carga imagen fuera de la cavidad, sobre el eje, que dé V = 0 en r = R (vale para r < R).` });
      pasos.push({ t: 'Carga imagen', html: imagenes.length ? `$q′ = −{q R}/a = −{${f(q)} · ${f(R)}}/{${f(p.a)}} = ${f(imagenes[0].q)} "C"$, a una distancia $a′ = R^2/a = ${cm(imagenes[0].z)} "cm"$ del centro, fuera de la cavidad.` : 'Si la carga está en el centro no hace falta imagen: el campo dentro es el de q sola.' });
      pasos.push({ t: 'Carga inducida', html: `En la pared de la cavidad se induce exactamente $−q = ${f(-q)} "C"$ (Gauss): el campo dentro del conductor es nulo.` });
    }
    const Fmod = Math.abs(Fz);
    if (modo === 'plano') pasos.push({ t: 'Fuerza sobre q', html: `La fuerza es la de q con su imagen, a una distancia 2d: $F = {q q′}/{4π ε_0 (2d)^2} = −{q^2}/{16π ε_0 d^2} = −{(${f(q)})^2}/{16π · ${f(EPS0)} · (${f(p.d)})^2} = ${f(Fz)} "N"$ (${atractiva ? 'atractiva, hacia el plano' : 'repulsiva'}).` });
    else if (modo === 'esfera-tierra') pasos.push({ t: 'Fuerza sobre q', html: `Entre q y su imagen hay $a − a′ = ${cm(p.a - imagenes[0].z)} "cm"$: $F = {q q′}/{4π ε_0 (a − a′)^2} = −{q^2 R a}/{4π ε_0 (a^2 − R^2)^2} = ${f(Fz)} "N"$ (${atractiva ? 'atractiva, hacia la esfera' : 'repulsiva'}).` });
    else if (!cav) pasos.push({ t: 'Fuerza sobre q', html: `Actúan las dos imágenes: $F = {q}/{4π ε_0}[{q′}/{(a − a′)^2} + {q″}/{a^2}] = ${f(K * q)} [{${f(imagenes[0].q)}}/{(${f(p.a - imagenes[0].z)})^2} + {${f(q2)}}/{(${f(p.a)})^2}] = ${f(Fz)} "N"$ (${atractiva ? 'atractiva' : 'repulsiva'}, ${atractiva ? 'hacia la esfera' : 'alejándose de la esfera'}).` });
    else pasos.push({ t: 'Fuerza sobre q', html: imagenes.length ? `Entre q y su imagen hay $a′ − a = ${cm(imagenes[0].z - p.a)} "cm"$: $F = {q q′}/{4π ε_0 (a′ − a)^2} = {q^2 R a}/{4π ε_0 (R^2 − a^2)^2} = ${f(Math.abs(Fz))} "N"$ (atractiva, hacia la pared más cercana).` : '$F = 0$ por simetría.' });
    if (modo === 'plano') pasos.push({ t: 'Carga inducida', html: `Con $σ = ε_0 E_n$ en el plano: $σ(ρ) = −{q d}/{2π (ρ^2 + d^2)^{3/2}}$. En ρ = 0: $σ_{máx} = −{q}/{2π d^2} = ${f(sigmaMax)} "C/m²"$. Integrando en todo el plano sale $Q_{ind} = −q = ${f(-q)} "C"$.` });
    else pasos.push({ t: 'Densidad de carga inducida', html: `$σ(θ) = −{q (${cav ? 'R^2 − a^2' : 'a^2 − R^2'})}/{4π R (R^2 + a^2 − 2 a R cos θ)^{3/2}}${!cav && q2 !== 0 ? ' + {q″}/{4π R^2}' : ''}$. En el punto más cercano a q (θ = 0): $σ = ${f(sigmaMax)} "C/m²"$.` });
    if (W !== null) pasos.push({ t: 'Trabajo para llevar q al infinito', html: modo === 'plano' ? `$W = ∫_d^∞ {q^2}/{16π ε_0 x^2} dx = {q^2}/{16π ε_0 d} = ${uq(W, 'J')}$ (es la energía del sistema, la mitad de la de las dos cargas reales).` : `$W = ∫_a^∞ F dx = {q^2 R}/{8π ε_0 (a^2 − R^2)} = ${uq(W, 'J')}$.` });
    if (pt) {
      const lista = cargas.map((c, i) => `r<sub>${i}</sub> = ${cm(Math.hypot(pt.z - c.z, pt.rho))} cm`).join(', ');
      pasos.push({ t: 'Potencial en el punto', html: `Se suman las contribuciones de q y de ${imagenes.length > 1 ? 'las imágenes' : 'su imagen'}: $V = {1}/{4π ε_0} Σ {q_i}/{r_i}$, con ${lista}. Sale $V = ${f(pt.V)} "V"$.` });
      pasos.push({ t: 'Campo en el punto', html: `$E_z = ${f(pt.Ez)} "V/m"$, $E_ρ = ${f(pt.Er)} "V/m"$, $|E| = ${f(pt.E)} "V/m"$.` });
      pasos.push({ t: 'Carga inducida bajo el punto', html: `${!esfera ? `Bajo el punto (ρ = ${cm(pt.rho)} cm)` : `En el punto de la superficie con el mismo ángulo (θ = ${f((pt.th * 180) / Math.PI)}°)`}: $σ = ${f(pt.sigma)} "C/m²"$.` });
    }
    return { modo, esfera, cav, p, q, pos, R, imagenes, cargas, Fz, Fmod, atractiva, Qe, V0, q2, sigma, sigmaMax, W, pt, pasos };
  }

  const ejemplos = [
    { clave: 'plano', nombre: 'Carga de 5 nC a 3 cm de un plano a tierra', sc: { modo: 'plano', q: '5', d: '3', rho: '4', z: '3' } },
    { clave: 'esfera-tierra', nombre: 'Carga de 10 nC frente a una esfera a tierra', sc: { modo: 'esfera-tierra', q: '10', a: '30', R: '10', r: '15', th: '0' } },
    { clave: 'esfera-neutra', nombre: 'La misma carga frente a una esfera neutra aislada', sc: { modo: 'esfera-aislada', q: '10', a: '30', R: '10', Q: '0', r: '15', th: '0' } },
    { clave: 'esfera-potencial', nombre: 'Esfera a 500 V con una carga cerca', sc: { modo: 'esfera-potencial', q: '2', a: '20', R: '5', V0: '500', r: '10', th: '90' } },
    { clave: 'cavidad', nombre: 'Carga de 5 nC dentro de una cavidad esférica', sc: { modo: 'cavidad', q: '5', a: '6', R: '10', r: '3', th: '60' } },
    { clave: 'cuna-90', nombre: 'Carga de 5 nC en una cuña de 90° (n = 2, IM-1)', sc: { modo: 'cuna', n: '2', q: '5', r0: '5', ph: '30', rp: '', php: '' } },
    { clave: 'cuna-60', nombre: 'Carga de 5 nC en una cuña de 60° (n = 3, cinco imágenes)', sc: { modo: 'cuna', n: '3', q: '5', r0: '4', ph: '20', rp: '3', php: '40' } },
    { clave: 'paralelos', nombre: 'Carga de 5 nC entre dos planos paralelos a 10 cm (IM-1)', sc: { modo: 'paralelos', q: '5', L: '10', d: '3', rho: '2', z: '5' } },
    { clave: 'varias', nombre: 'Dos cargas de signos opuestos frente a un plano (IM-4)', sc: { modo: 'varias', q: '5', x1: '-3', z1: '4', q2: '-3', x2: '3', z2: '6', q3: '', x3: '', z3: '' } },
    { clave: 'dipolo', nombre: 'Dipolo de 10 nC·cm a 4 cm del plano, a 30° de la normal (IM-4)', sc: { modo: 'dipolo', p: '10', d: '4', th: '30' } },
  ];

  return { resolver, ejemplos, campo, campoXZ, trigamma, MODOS, f, u, EPS0, K };
})();

