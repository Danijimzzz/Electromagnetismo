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
    if (vacio(sc[k])) { if (opcional) return def; throw new Error(`${nom} manquant`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} doit être un nombre`);
    if (entero && !Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} doit être un nombre entier`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} doit être ${cero ? 'positif ou nul' : 'supérieur à 0'}`);
    if (signo && !cero && v === 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} ne peut pas être 0`);
    return v;
  };

  const Q = ['q', 'Charge q', 'nC', 1e-9, { signo: true }];
  const MODOS = {
    plano: { nombre: 'Plan conducteur à la terre', campos: [Q, ['d', 'Distance de q au plan d', 'cm', 1e-2, {}]], punto: [['rho', 'ρ, distance à l\'axe', 'cm', 1e-2], ['z', 'z, hauteur au-dessus du plan', 'cm', 1e-2]] },
    'esfera-tierra': { nombre: 'Sphère conductrice à la terre', campos: [Q, ['a', 'Distance de q au centre a', 'cm', 1e-2, {}], ['R', 'Rayon de la sphère R', 'cm', 1e-2, {}]], punto: [['r', 'r, distance au centre', 'cm', 1e-2], ['th', 'θ, angle avec l\'axe de q', '°', Math.PI / 180]] },
    'esfera-aislada': { nombre: 'Sphère isolée de charge Q', campos: [Q, ['a', 'Distance de q au centre a', 'cm', 1e-2, {}], ['R', 'Rayon de la sphère R', 'cm', 1e-2, {}], ['Q', 'Charge totale de la sphère Q', 'nC', 1e-9, { opcional: true, signo: true, cero: true, def: 0 }]], punto: [['r', 'r, distance au centre', 'cm', 1e-2], ['th', 'θ, angle avec l\'axe de q', '°', Math.PI / 180]] },
    'esfera-potencial': { nombre: 'Sphère à un potentiel V₀', campos: [Q, ['a', 'Distance de q au centre a', 'cm', 1e-2, {}], ['R', 'Rayon de la sphère R', 'cm', 1e-2, {}], ['V0', 'Potentiel de la sphère V₀', 'V', 1, { opcional: true, signo: true, cero: true, def: 0 }]], punto: [['r', 'r, distance au centre', 'cm', 1e-2], ['th', 'θ, angle avec l\'axe de q', '°', Math.PI / 180]] },
    cuna: { plana: true, nombre: 'Deux plans formant un angle (coin π/n)', campos: [['n', 'Nombre n (l\'angle du coin est π/n)', '', 1, { entero: true }], Q, ['r0', 'Distance de q à l\'arête r₀', 'cm', 1e-2, {}], ['ph', 'Angle de q avec un plan φ₀', '°', Math.PI / 180, {}]], punto: [['rp', 'r, distance à l\'arête', 'cm', 1e-2], ['php', 'φ, angle avec le premier plan', '°', 1]] },
    paralelos: { plana: true, nombre: 'Deux plans parallèles', campos: [Q, ['L', 'Distance entre les plans L', 'cm', 1e-2, {}], ['d', 'Distance de q au premier plan d', 'cm', 1e-2, {}]], punto: [['rho', 'ρ, distance à l\'axe', 'cm', 1e-2], ['z', 'z, hauteur au-dessus du premier plan', 'cm', 1e-2]] },
    varias: { plana: true, nombre: 'Plusieurs charges devant un plan', campos: [['q', 'Charge q₁', 'nC', 1e-9, { signo: true }], ['x1', 'x₁', 'cm', 1e-2, { signo: true, cero: true }], ['z1', 'z₁ (altura)', 'cm', 1e-2, {}], ['q2', 'Charge q₂ (facultative)', 'nC', 1e-9, { opcional: true, signo: true }], ['x2', 'x₂', 'cm', 1e-2, { opcional: true, signo: true, cero: true }], ['z2', 'z₂ (altura)', 'cm', 1e-2, { opcional: true }], ['q3', 'Charge q₃ (facultative)', 'nC', 1e-9, { opcional: true, signo: true }], ['x3', 'x₃', 'cm', 1e-2, { opcional: true, signo: true, cero: true }], ['z3', 'z₃ (altura)', 'cm', 1e-2, { opcional: true }]], punto: [] },
    dipolo: { plana: true, nombre: 'Dipôle devant un plan', campos: [['p', 'Moment dipolaire p', 'nC·cm', 1e-11, {}], ['d', 'Distance du dipôle au plan d', 'cm', 1e-2, {}], ['th', 'Angle de p avec la normale θ', '°', Math.PI / 180, { signo: true, cero: true }]], punto: [] },
    cavidad: { nombre: 'Charge dans une cavité sphérique', campos: [Q, ['a', 'Distance de q au centre a', 'cm', 1e-2, {}], ['R', 'Rayon de la cavité R', 'cm', 1e-2, {}]], punto: [['r', 'r, distance au centre', 'cm', 1e-2], ['th', 'θ, angle avec l\'axe de q', '°', Math.PI / 180]] },
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
      if (n < 1 || n > 12) throw new Error('n doit être compris entre 1 et 12 (angle du coin π/n)');
      if (!(p.ph > 1e-9 && p.ph < alfa - 1e-9)) throw new Error(`φ₀ doit être à l'intérieur du coin : entre 0° et ${f(grados(alfa))}°`);
      for (let k = 0; k < n; k++) for (const sg of [1, -1]) {
        const ang = 2 * k * alfa + sg * p.ph;
        if (k === 0 && sg === 1) cargas.push({ q: p.q, x: p.r0 * Math.cos(ang), z: p.r0 * Math.sin(ang), real: true, nom: 'q' });
        else cargas.push({ q: sg * p.q, x: p.r0 * Math.cos(ang), z: p.r0 * Math.sin(ang), nom: `q′${cargas.length}`, ang: grados(ang) });
      }
      R.alfa = alfa; R.n = n; R.pos = p.r0; lim = p.r0;
      pasos.push({ t: 'Mise en équation', html: `Deux plans à la terre formant un angle $α = π/n = ${f(grados(alfa))}°$ ($n = ${n}$). Si $α = π/n$ avec $n$ entier, les images tombent toutes en dehors du coin et $2n − 1 = ${2 * n - 1}$ charges images suffisent, de signes alternés : $+q$ en $φ = 2kα + φ_0$ et $−q$ en $φ = 2kα − φ_0$, avec $k = 0, …, n − 1$ et toutes à la distance $r_0$ de l'arête.` });
      pasos.push({ t: 'Charges images', html: cargas.filter((c) => !c.real).map((c) => `$${c.q > 0 ? '+' : '−'}q$ en $φ = ${f(c.ang)}°$`).join('; ') + `. Avec ${n} charges positives et ${n} négatives, la somme de toutes est nulle, et le coin est à V = 0 sur ses deux plans.` });
    } else if (modo === 'paralelos') {
      const { q, L, d } = p;
      if (!(d < L)) throw new Error('La charge doit se trouver entre les plans (d < L)');
      for (let k = -2; k <= 2; k++) { if (k) cargas.push({ q, x: 0, z: 2 * k * L + d, nom: `+q (k = ${k})` }); cargas.push({ q: -q, x: 0, z: 2 * k * L - d, nom: `−q (k = ${k})` }); }
      cargas.unshift({ q, x: 0, z: d, real: true, nom: 'q' });
      cargas = cargas.sort((a, b) => (b.real ? 1 : 0) - (a.real ? 1 : 0));
      const t = d / L, Fz = ((K * q * q) / (4 * L * L)) * (trigamma(1 - t) - trigamma(t));
      R.imagenes = cargas.filter((c) => !c.real); R.Fz = Fz; R.Qa = -q * (1 - t); R.Qb = -q * t; R.L = L; R.pos = d; lim = L;
      const Vsuma = (rho, z, N) => { let V = 0; for (let k = -N; k <= N; k++) V += K * q * (1 / Math.hypot(rho, z - 2 * k * L - d) - 1 / Math.hypot(rho, z + d - 2 * k * L)); return V; };
      R.Vsuma = Vsuma;
      pasos.push({ t: 'Mise en équation', html: `Deux plans à la terre, $z = 0$ et $z = L = ${cm(L)} "cm"$, avec $q$ à $d = ${cm(d)} "cm"$ du premier. Chaque plan réfléchit les charges de l'autre, il y a donc une infinité d'images : $−q$ en $z = 2kL − d$ et $+q$ en $z = 2kL + d$, avec $k$ entier (la charge réelle est $k = 0$ avec le signe +).` });
      pasos.push({ t: 'Force sur q', html: `Les images $+q$ s'annulent par paires ($k$ et $−k$) et seules agissent les $−q$ : $F = {q^2}/{16π ε_0} ∑_k {sg(kL − d)}/{(kL − d)^2} = {q^2}/{16π ε_0 L^2}[ψ_1(1 − d/L) − ψ_1(d/L)] = ${f(Fz)} "N"$ (avec $ψ_1(x) = ∑_{k≥0} 1/(k + x)^2$). ` + (Math.abs(Fz) < 1e-15 * Math.abs(K * q * q / (L * L)) ? 'Elle est exactement au milieu : les forces se compensent et la force est nulle.' : `Elle va vers le plan ${Fz > 0 ? 'du haut' : 'du bas'}, le plus proche.`) });
      pasos.push({ t: 'Charge induite sur chaque plan', html: `Par la formule de Green : $Q_0 = −q(1 − d/L) = ${f(R.Qa)} "C"$ sur le plan $z = 0$ et $Q_L = −q d/L = ${f(R.Qb)} "C"$ sur le plan $z = L$. Leur somme vaut $−q$.` });
      cajas.push(['Force sur q', u(Math.abs(Fz), 'N'), Fz === 0 ? 'nulle : elle est au milieu' : Fz > 0 ? 'vers le plan du haut' : 'vers le plan du bas'], ['Charge induite en z = 0', u(R.Qa, 'C'), '−q (1 − d/L)'], ['Charge induite en z = L', u(R.Qb, 'C'), '−q d/L'], ['Images', 'infinitas', 'la somme converge comme 1/k²']);
      R.Fmod = Math.abs(Fz); R.atractiva = true; R.Qe = R.Qa + R.Qb;
    } else if (modo === 'varias') {
      for (const [i, [kq, kx, kz]] of [['q', 'x1', 'z1'], ['q2', 'x2', 'z2'], ['q3', 'x3', 'z3']].entries()) {
        if (i && p[kq] === null) continue;
        if (p[kx] === null || p[kz] === null) throw new Error(`La position de la charge ${i + 1} est manquante`);
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
      pasos.push({ t: 'Mise en équation', html: `Le plan $z = 0$ est à la terre. Chaque charge $q_i$ en $(x_i, z_i)$ a son image $−q_i$ en $(x_i, −z_i)$ et le champ en $z > 0$ est celui des ${2 * n} charges.` });
      pasos.push({ t: 'Force sur chaque charge', html: reales.map((c, i) => `Sur $q_${i + 1}$ agissent les autres charges réelles et toutes les images (aussi la sienne) : $F_${i + 1} = (${f(F[i][0])}, ${f(F[i][1])}) "N"$, de module $${f(Math.hypot(...F[i]))} "N"$`).join('; ') + '.' });
      pasos.push({ t: 'Force totale et énergie', html: `Force sur l'ensemble des charges réelles : $(${f(Ftot[0])}, ${f(Ftot[1])}) "N"$. L'énergie du système est la moitié de celle des charges avec leurs images dans l'interaction avec le plan : $U = ∑_{i<j} {q_i q_j}/{4π ε_0 r_{ij}} − ½ ∑_{i,j} {q_i q_j}/{4π ε_0 r_{ij′}} = ${f(Ue)} "J"$. Charge induite sur le plan : $Q = −∑ q_i = ${f(R.Qe)} "C"$.` });
      cajas.push(...reales.map((c, i) => [`Force sur ${c.nom}`, u(Math.hypot(...F[i]), 'N'), `F = (${f(F[i][0])}; ${f(F[i][1])}) N`]), ['Force totale', u(Math.hypot(...Ftot), 'N'), `(${f(Ftot[0])}; ${f(Ftot[1])}) N`], ['Énergie du système', u(Ue, 'J'), 'U avec le plan à la terre'], ['Charge induite totale', u(R.Qe, 'C'), '−Σ qᵢ']);
    } else {
      const { p: pm, d, th } = p, c2 = Math.cos(th) ** 2, px = pm * Math.sin(th), pz = pm * Math.cos(th);
      const Fz = (-3 * pm * pm * (1 + c2)) / (64 * Math.PI * EPS0 * d ** 4), tau = (-pm * pm * Math.sin(th) * Math.cos(th)) / (32 * Math.PI * EPS0 * d ** 3), U = (-pm * pm * (1 + c2)) / (64 * Math.PI * EPS0 * d ** 3);
      const l = 0.5 * d, dx = (l / 2) * Math.sin(th), dz = (l / 2) * Math.cos(th);
      cargas = [{ q: 1e-9, x: dx, z: d + dz, real: true, nom: '+' }, { q: -1e-9, x: -dx, z: d - dz, real: true, nom: '−' }, { q: -1e-9, x: dx, z: -d - dz, nom: '−′' }, { q: 1e-9, x: -dx, z: -d + dz, nom: '+′' }];
      R.imagenes = cargas.filter((c) => !c.real); R.Fz = Fz; R.Fmod = Math.abs(Fz); R.atractiva = true; R.tau = tau; R.U = U; R.W = U; R.pos = d; R.px = px; R.pz = pz; R.Qe = 0; lim = d;
      pasos.push({ t: 'Mise en équation', html: `Un dipôle $p = ${f(pm)} "C·m"$ à $d = ${cm(d)} "cm"$ du plan à la terre, avec $p$ formant $θ = ${f(grados(th))}°$ avec la normale. Son image est un autre dipôle en $z = −d$ avec la même composante normale et la composante parallèle inversée : $p′ = (−p_x, p_z) = (${f(-px)}, ${f(pz)}) "C·m"$.` });
      pasos.push({ t: 'Énergie', html: `L'interaction dipôle-dipôle à la distance $2d$ est $U_{int} = {p·p′ − 3(p·n)(p′·n)}/{4π ε_0 (2d)^3} = −{p^2 (1 + cos^2 θ)}/{32π ε_0 d^3}$, et l'énergie réelle en est la moitié (l'image n'existe pas) : $U = −{p^2 (1 + cos^2 θ)}/{64π ε_0 d^3} = ${f(U)} "J"$.` });
      pasos.push({ t: 'Force et couple', html: `$F_z = −{∂U}/{∂d} = −{3 p^2 (1 + cos^2 θ)}/{64π ε_0 d^4} = ${f(Fz)} "N"$ (attractive : le dipôle est attiré vers le plan). Le couple sur $p$ est $τ_y = −{∂U}/{∂θ} = −{p^2 sin θ cos θ}/{32π ε_0 d^3} = ${f(tau)} "N·m"$` + (Math.abs(tau) < 1e-30 ? ': nul (θ = 0° ou 90°).' : tau < 0 ? ': il tend à placer le dipôle perpendiculairement au plan (réduit θ).' : ': il tend à placer le dipôle perpendiculairement au plan (augmente |θ| vers 180°).') });
      cajas.push(['Force sur le dipôle', u(Math.abs(Fz), 'N'), 'attractive, vers le plan'], ['Couple sur le dipôle', u(tau, 'N·m'), 'τ = −∂U/∂θ'], ['Énergie', u(U, 'J'), 'interaction avec le plan'], ['Dipôle image', `(${f(-px)}; ${f(pz)}) C·m`, 'parallèle inversée, normale identique']);
    }
    if (modo === 'cuna') {
      const real = cargas[0], F = fuerzaDe(0, cargas), ca = Math.cos(p.ph), sa = Math.sin(p.ph);
      R.imagenes = cargas.filter((c) => !c.real); R.F = F; R.Fx = F[0]; R.Fz = F[1]; R.Fmod = Math.hypot(...F); R.Fr = F[0] * ca + F[1] * sa; R.Fphi = -F[0] * sa + F[1] * ca; R.Qe = -p.q; R.atractiva = R.Fr < 0 || R.Fmod > 0;
      pasos.push({ t: 'Force sur q', html: `La force est la somme de celles des ${2 * R.n - 1} images : $F = ∑ {q q_i′}/{4π ε_0 r_i^2}$ (vecteur). On obtient $F_r = ${f(R.Fr)} "N"$ (radiale, depuis l'arête) et $F_φ = ${f(R.Fphi)} "N"$ (tangentielle), de module $${f(R.Fmod)} "N"$.` });
      cajas.push(['Charges images', `${2 * R.n - 1}`, `n = ${R.n}, α = ${f(grados(R.alfa))}°`], ['Force sur q', u(R.Fmod, 'N'), `F<sub>r</sub> = ${u(R.Fr, 'N', 3)}, F<sub>φ</sub> = ${u(R.Fphi, 'N', 3)}`], ['Charge induite totale', u(-p.q, 'C'), 'égale et opposée à q']);
    }
    const [k1, k2] = M.punto.map((x) => x[0]);
    if (k1 && (!vacio(sc[k1]) || !vacio(sc[k2]))) {
      if (vacio(sc[k1]) || vacio(sc[k2])) throw new Error('Renseignez les deux coordonnées du point, ou laissez-les vides');
      const a1 = leeNum(sc[k1]), a2 = leeNum(sc[k2]);
      if (!isFinite(a1) || !isFinite(a2)) throw new Error('Les coordonnées du point doivent être des nombres');
      if (modo === 'cuna') {
        const r = a1 * 1e-2, ph = (a2 * Math.PI) / 180;
        if (r < 0) throw new Error('La distance r du point ne peut pas être négative');
        if (!(ph >= 0 && ph <= R.alfa + 1e-9)) throw new Error(`Le point doit se trouver à l'intérieur du coin (φ entre 0° et ${f(grados(R.alfa))}°)`);
        const c = campoXZ(cargas, r * Math.cos(ph), r * Math.sin(ph)); R.pt = { x: r * Math.cos(ph), z: r * Math.sin(ph), ...c, etiqueta: `r = ${cm(r)}, φ = ${f(a2)}°` };
      } else {
        const rho = a1 * 1e-2, z = a2 * 1e-2;
        if (!(z >= 0 && z <= p.L + 1e-12)) throw new Error('Le point doit se trouver entre les plans (0 ≤ z ≤ L)');
        const N = 20000, h = 1e-6 * p.L, V = R.Vsuma(rho, z, N), Ez = -(R.Vsuma(rho, z + h, N) - R.Vsuma(rho, z - h, N)) / (2 * h), Er = -(R.Vsuma(rho + h, z, N) - R.Vsuma(Math.max(rho - h, 0), z, N)) / (rho > h ? 2 * h : h + rho);
        R.pt = { x: rho, z, V, Ex: Er, Ez, E: Math.hypot(Er, Ez), etiqueta: `ρ = ${cm(rho)}, z = ${cm(z)}` };
      }
      pasos.push({ t: 'Potentiel et champ au point', html: `En additionnant la charge et toutes ses images : $V = ${f(R.pt.V)} "V"$, $E_x = ${f(R.pt.Ex)} "V/m"$, $E_z = ${f(R.pt.Ez)} "V/m"$, $|E| = ${f(R.pt.E)} "V/m"$.` });
      cajas.push(['V au point', u(R.pt.V, 'V'), R.pt.etiqueta], ['|E| au point', u(R.pt.E, 'V/m'), `E<sub>x</sub> = ${u(R.pt.Ex, 'V/m', 3)}, E<sub>z</sub> = ${u(R.pt.Ez, 'V/m', 3)}`]);
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
      if (cav && !(p.a < p.R)) throw new Error('La charge doit se trouver à l\'intérieur de la cavité (a < R)');
      if (!cav && !(p.a > p.R)) throw new Error('La charge doit se trouver à l\'extérieur de la sphère (a > R)');
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
      if (vacio(v1)) throw new Error(`${n1} du point est manquant(e)`);
      if (vacio(v2)) throw new Error(`${n2} du point est manquant(e)`);
      const a1 = leeNum(v1), a2 = leeNum(v2);
      if (!isFinite(a1) || !isFinite(a2)) throw new Error('Les coordonnées du point doivent être des nombres');
      let rho, z, th = null, r = null;
      if (!esfera) { rho = a1 * 1e-2; z = a2 * 1e-2; if (z <= 0) throw new Error('Le point doit se trouver du côté de la charge (z > 0)'); }
      else {
        r = a1 * 1e-2; th = (a2 * Math.PI) / 180;
        if (r < 0) throw new Error('La distance r du point ne peut pas être négative');
        if (!cav && r <= R) throw new Error('Le point doit se trouver à l\'extérieur de la sphère (r > R)');
        if (cav && r >= R) throw new Error('Le point doit se trouver à l\'intérieur de la cavité (r < R)');
        rho = r * Math.sin(th); z = r * Math.cos(th);
      }
      const c = campo(cargas, z, rho);
      pt = { rho, z, r, th, ...c, sigma: !esfera ? sigma(rho) : sigma(th) };
    }

    const pasos = [];
    const cm = (x) => f(x * 100);
    if (!esfera) {
      pasos.push({ t: 'Mise en équation', html: `Le plan est à la terre (V = 0 en z = 0). On retire le conducteur et on place une charge image qui donne V = 0 sur le plan : l'opposée, au point symétrique. Valable pour z > 0.` });
      pasos.push({ t: 'Charge image', html: `$q′ = −q = ${uq(-q, 'C')}$ en $z = −d = −${cm(p.d)} "cm"$.` });
    } else if (!cav) {
      pasos.push({ t: 'Mise en équation', html: `On retire la sphère et on cherche une charge image à l'intérieur, sur l'axe, qui donne V = 0 en r = R. C'est l'image de q par rapport à la sphère.` });
      pasos.push({ t: 'Charge image', html: `$q′ = −{q R}/a = −{${f(q)} · ${f(R)}}/{${f(p.a)}} = ${f(imagenes[0].q)} "C"$, à une distance $a′ = R^2/a = {${f(R)}^2}/{${f(p.a)}} = ${cm(imagenes[0].z)} "cm"$ du centre.` });
      if (modo === 'esfera-tierra') pasos.push({ t: 'Sphère à la terre', html: `Avec V = 0, une seule image suffit. La charge totale de la sphère est celle de l'image : $Q = q′ = ${uq(Qe, 'C')}$.` });
      else {
        if (modo === 'esfera-aislada') pasos.push({ t: 'Sphère isolée', html: `La sphère a une charge totale $Q = ${f(Qe)} "C"$. L'image q′ en apporte déjà ${f(imagenes[0].q)} C et le reste est placé au centre, pour que la surface reste équipotentielle : $q″ = Q − q′ = ${f(Qe)} − (${f(imagenes[0].q)}) = ${f(q2)} "C"$, en $z = 0$.` });
        else pasos.push({ t: 'Sphère à un potentiel', html: `La sphère est à $V_0 = ${f(V0)} "V"$. La charge q″ du centre le fixe : $q″ = 4π ε_0 R V_0 = ${f(q2)} "C"$, en $z = 0$, et la charge totale de la sphère est $Q = q′ + q″ = ${f(Qe)} "C"$.` });
        pasos.push({ t: 'Potentiel de la sphère', html: `$V_{sphère} = {q″}/{4π ε_0 R} = ${f(V0)} "V"$ (uniforme : toute la sphère est équipotentielle).` });
      }
    } else {
      pasos.push({ t: 'Mise en équation', html: `La charge est à l'intérieur d'une cavité sphérique de rayon R dans un conducteur. On cherche une charge image à l'extérieur de la cavité, sur l'axe, qui donne V = 0 en r = R (valable pour r < R).` });
      pasos.push({ t: 'Charge image', html: imagenes.length ? `$q′ = −{q R}/a = −{${f(q)} · ${f(R)}}/{${f(p.a)}} = ${f(imagenes[0].q)} "C"$, à une distance $a′ = R^2/a = ${cm(imagenes[0].z)} "cm"$ du centre, à l'extérieur de la cavité.` : 'Si la charge est au centre, aucune image n\'est nécessaire : le champ à l\'intérieur est celui de q seule.' });
      pasos.push({ t: 'Charge induite', html: `Sur la paroi de la cavité s'induit exactement $−q = ${f(-q)} "C"$ (Gauss) : le champ à l'intérieur du conducteur est nul.` });
    }
    const Fmod = Math.abs(Fz);
    if (modo === 'plano') pasos.push({ t: 'Force sur q', html: `La force est celle de q avec son image, à une distance 2d : $F = {q q′}/{4π ε_0 (2d)^2} = −{q^2}/{16π ε_0 d^2} = −{(${f(q)})^2}/{16π · ${f(EPS0)} · (${f(p.d)})^2} = ${f(Fz)} "N"$ (${atractiva ? 'attractive, vers le plan' : 'répulsive'}).` });
    else if (modo === 'esfera-tierra') pasos.push({ t: 'Force sur q', html: `Entre q et son image il y a $a − a′ = ${cm(p.a - imagenes[0].z)} "cm"$ : $F = {q q′}/{4π ε_0 (a − a′)^2} = −{q^2 R a}/{4π ε_0 (a^2 − R^2)^2} = ${f(Fz)} "N"$ (${atractiva ? 'attractive, vers la sphère' : 'répulsive'}).` });
    else if (!cav) pasos.push({ t: 'Force sur q', html: `Les deux images agissent : $F = {q}/{4π ε_0}[{q′}/{(a − a′)^2} + {q″}/{a^2}] = ${f(K * q)} [{${f(imagenes[0].q)}}/{(${f(p.a - imagenes[0].z)})^2} + {${f(q2)}}/{(${f(p.a)})^2}] = ${f(Fz)} "N"$ (${atractiva ? 'attractive' : 'répulsive'}, ${atractiva ? 'vers la sphère' : 'en s\'éloignant de la sphère'}).` });
    else pasos.push({ t: 'Force sur q', html: imagenes.length ? `Entre q et son image il y a $a′ − a = ${cm(imagenes[0].z - p.a)} "cm"$ : $F = {q q′}/{4π ε_0 (a′ − a)^2} = {q^2 R a}/{4π ε_0 (R^2 − a^2)^2} = ${f(Math.abs(Fz))} "N"$ (attractive, vers la partie la plus proche de la paroi).` : '$F = 0$ par symétrie.' });
    if (modo === 'plano') pasos.push({ t: 'Charge induite', html: `Avec $σ = ε_0 E_n$ sur le plan : $σ(ρ) = −{q d}/{2π (ρ^2 + d^2)^{3/2}}$. En ρ = 0 : $σ_{max} = −{q}/{2π d^2} = ${f(sigmaMax)} "C/m²"$. En intégrant sur tout le plan on obtient $Q_{ind} = −q = ${f(-q)} "C"$.` });
    else pasos.push({ t: 'Densité de charge induite', html: `$σ(θ) = −{q (${cav ? 'R^2 − a^2' : 'a^2 − R^2'})}/{4π R (R^2 + a^2 − 2 a R cos θ)^{3/2}}${!cav && q2 !== 0 ? ' + {q″}/{4π R^2}' : ''}$. Au point le plus proche de q (θ = 0) : $σ = ${f(sigmaMax)} "C/m²"$.` });
    if (W !== null) pasos.push({ t: 'Travail pour amener q à l\'infini', html: modo === 'plano' ? `$W = ∫_d^∞ {q^2}/{16π ε_0 x^2} dx = {q^2}/{16π ε_0 d} = ${uq(W, 'J')}$ (c'est l'énergie du système, la moitié de celle des deux charges réelles).` : `$W = ∫_a^∞ F dx = {q^2 R}/{8π ε_0 (a^2 − R^2)} = ${uq(W, 'J')}$.` });
    if (pt) {
      const lista = cargas.map((c, i) => `r<sub>${i}</sub> = ${cm(Math.hypot(pt.z - c.z, pt.rho))} cm`).join(', ');
      pasos.push({ t: 'Potentiel au point', html: `On additionne les contributions de q et de ${imagenes.length > 1 ? 'des images' : 'son image'} : $V = {1}/{4π ε_0} Σ {q_i}/{r_i}$, avec ${lista}. On obtient $V = ${f(pt.V)} "V"$.` });
      pasos.push({ t: 'Champ au point', html: `$E_z = ${f(pt.Ez)} "V/m"$, $E_ρ = ${f(pt.Er)} "V/m"$, $|E| = ${f(pt.E)} "V/m"$.` });
      pasos.push({ t: 'Charge induite sous le point', html: `${!esfera ? `Sous le point (ρ = ${cm(pt.rho)} cm)` : `Au point de la surface avec le même angle (θ = ${f((pt.th * 180) / Math.PI)}°)`}: $σ = ${f(pt.sigma)} "C/m²"$.` });
    }
    return { modo, esfera, cav, p, q, pos, R, imagenes, cargas, Fz, Fmod, atractiva, Qe, V0, q2, sigma, sigmaMax, W, pt, pasos };
  }

  const ejemplos = [
    { clave: 'plano', nombre: 'Charge de 5 nC à 3 cm d\'un plan à la terre', sc: { modo: 'plano', q: '5', d: '3', rho: '4', z: '3' } },
    { clave: 'esfera-tierra', nombre: 'Charge de 10 nC devant une sphère à la terre', sc: { modo: 'esfera-tierra', q: '10', a: '30', R: '10', r: '15', th: '0' } },
    { clave: 'esfera-neutra', nombre: 'La même charge devant une sphère neutre isolée', sc: { modo: 'esfera-aislada', q: '10', a: '30', R: '10', Q: '0', r: '15', th: '0' } },
    { clave: 'esfera-potencial', nombre: 'Sphère à 500 V avec une charge à proximité', sc: { modo: 'esfera-potencial', q: '2', a: '20', R: '5', V0: '500', r: '10', th: '90' } },
    { clave: 'cavidad', nombre: 'Charge de 5 nC à l\'intérieur d\'une cavité sphérique', sc: { modo: 'cavidad', q: '5', a: '6', R: '10', r: '3', th: '60' } },
    { clave: 'cuna-90', nombre: 'Charge de 5 nC dans un coin de 90° (n = 2, IM-1)', sc: { modo: 'cuna', n: '2', q: '5', r0: '5', ph: '30', rp: '', php: '' } },
    { clave: 'cuna-60', nombre: 'Charge de 5 nC dans un coin de 60° (n = 3, cinq images)', sc: { modo: 'cuna', n: '3', q: '5', r0: '4', ph: '20', rp: '3', php: '40' } },
    { clave: 'paralelos', nombre: 'Charge de 5 nC entre deux plans parallèles distants de 10 cm (IM-1)', sc: { modo: 'paralelos', q: '5', L: '10', d: '3', rho: '2', z: '5' } },
    { clave: 'varias', nombre: 'Deux charges de signes opposés devant un plan (IM-4)', sc: { modo: 'varias', q: '5', x1: '-3', z1: '4', q2: '-3', x2: '3', z2: '6', q3: '', x3: '', z3: '' } },
    { clave: 'dipolo', nombre: 'Dipôle de 10 nC·cm à 4 cm du plan, à 30° de la normale (IM-4)', sc: { modo: 'dipolo', p: '10', d: '4', th: '30' } },
  ];

  return { resolver, ejemplos, campo, campoXZ, trigamma, MODOS, f, u, EPS0, K };
})();

