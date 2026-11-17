const Maxwell = (() => {
  const Ex_ = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const E0V = 8.8541878128e-12, MU0 = 1.25663706212e-6, C = 1 / Math.sqrt(E0V * MU0);
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const fm = (x, d) => f(x, d).replace(/<sup>(.*?)<\/sup>/, '^{$1}');
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, signo = 'pos') {
    if (vacio(sc[k])) throw new Error(`Missing ${nom}`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} must be a number`);
    if (signo === 'pos' && v <= 0) throw new Error(`${may(nom)} must be greater than 0`);
    if (signo === 'no0' && v < 0) throw new Error(`${may(nom)} cannot be negative`);
    return v;
  }

  const campos = {
    gauss: [['Q', 'Total charge Q', 'nC'], ['R', 'Radius of the charged sphere R', 'm'], ['r', 'Radius of the Gaussian surface r', 'm']],
    gaussmag: [['Bx', 'B field in x', 'T'], ['By', 'B field in y', 'T'], ['Bz', 'B field in z', 'T'], ['L', 'Cube side L', 'm']],
    faraday: [['B0', 'Field amplitude B₀', 'mT'], ['fr', 'Frequency f', 'Hz'], ['A', 'Area of each loop A', 'cm²'], ['N', 'Number of turns N', '']],
    ampere: [['I', 'Current I charging the capacitor', 'A'], ['R', 'Plate radius R', 'cm'], ['r', 'Distance to the axis r', 'cm']],
    onda: [['E0', 'Electric field amplitude E₀', 'V/m'], ['fr', 'Frequency f', 'Hz']],
    continuidad: [['sigma', 'Conductivity σ', 'S/m'], ['er', 'Relative permittivity ε<sub>r</sub>', ''], ['rho0', 'Initial charge density ρ₀', 'µC/m³'], ['t', 'Time t (empty = τ only)', 's'], ['fr', 'Frequency f for σ/ωε (empty = no)', 'Hz']],
    campo: [['Ex', 'E field, x component', 'V/m'], ['Ey', 'E field, y component', 'V/m'], ['Ez', 'E field, z component', 'V/m'], ['Bx', 'B field, x component (empty = unknown)', 'T'], ['By', 'B field, y component', 'T'], ['Bz', 'B field, z component', 'T'], ['rho', 'Charge density ρ (empty = 0)', 'C/m³'], ['Jx', 'Current J, x component (empty = 0)', 'A/m²'], ['Jy', 'Current J, y component', 'A/m²'], ['Jz', 'Current J, z component', 'A/m²']],
  };
  const nombres = { gauss: 'Gauss for E', gaussmag: 'Gauss for B', faraday: 'Faraday', ampere: 'Ampère–Maxwell', onda: 'The electromagnetic wave', continuidad: 'Continuity: charge relaxation', campo: 'Does this field satisfy the equations?' };

  const lineas = (a, b, g, n = 120) => Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return [x, g(x)]; });


  const VARS = ['x', 'y', 'z', 't'], PUNTOS = [[0.31, -0.52, 0.77, 0], [-0.43, 0.28, 0.61, 1e-9], [0.67, 0.35, -0.29, 2.7e-9], [0.18, -0.74, -0.46, 0.13], [-0.55, -0.21, 0.38, 0.61], [0.92, 0.47, 0.83, 3.1e-9]];
  const val = (n, P) => Ex_.valor(n, P[0], { y: P[1], z: P[2], t: P[3] });
  const lc = (src, nom) => (vacio(src) ? null : Ex_.lee(src, nom, VARS));
  const tx = (n) => Ex_.texto(n);
  const CERO = Ex_.N(0), suma = (...l) => l.reduce((a, b) => Ex_.simp({ t: '+', a, b }));
  const neg = (a) => Ex_.simp({ t: 'neg', a }), rest = (a, b) => Ex_.simp({ t: '-', a, b });
  const dv = (n, v) => (n ? Ex_.deriva(n, v) : CERO);
  const por = (c, a) => Ex_.simp({ t: '*', a: Ex_.N(c), b: a });
  function residuo(izq, der) {
    let r = 0, esc2 = 0, n = 0, malos = 0;
    for (const P of PUNTOS) {
      for (let c = 0; c < izq.length; c++) {
        const a = val(izq[c], P), b = val(der[c], P); if (!isFinite(a) || !isFinite(b)) { malos++; continue; }
        n++; r = Math.max(r, Math.abs(a - b)); esc2 = Math.max(esc2, Math.abs(a), Math.abs(b));
      }
    }
    if (!n || malos * 2 > n + malos) throw new Error('The field cannot be evaluated at the test points (is there a division by zero or a missing variable?)');
    return { abs: r, rel: esc2 > 0 ? r / esc2 : 0, escala: esc2 };
  }
  function resolverCampo(sc) {
    const E = ['Ex', 'Ey', 'Ez'].map((k) => lc(sc[k], `E${k[1]}`) || CERO), Bv = ['Bx', 'By', 'Bz'].map((k) => lc(sc[k], `B${k[1]}`)), conB = Bv.some(Boolean), B = Bv.map((b) => b || CERO);
    if (E.every((e) => e === CERO)) throw new Error('Enter at least one component of E');
    const rho = lc(sc.rho, 'ρ') || CERO, J = ['Jx', 'Jy', 'Jz'].map((k) => lc(sc[k], `J${k[1]}`) || CERO);
    for (const [n, nom] of [...E.map((e, i) => [e, 'E' + 'xyz'[i]]), ...B.map((b, i) => [b, 'B' + 'xyz'[i]]), ...J.map((j, i) => [j, 'J' + 'xyz'[i]]), [rho, 'ρ']]) if (PUNTOS.filter((P) => !isFinite(val(n, P))).length * 2 >= PUNTOS.length) throw new Error(`${nom} cannot be evaluated at the test points (does it divide by zero?)`);
    const V = ['x', 'y', 'z'], rot = (F) => [rest(dv(F[2], 'y'), dv(F[1], 'z')), rest(dv(F[0], 'z'), dv(F[2], 'x')), rest(dv(F[1], 'x'), dv(F[0], 'y'))];
    const div = (F) => suma(dv(F[0], 'x'), dv(F[1], 'y'), dv(F[2], 'z'));
    const divE = div(E), rotE = rot(E), dBdt = B.map((b) => dv(b, 't')), dEdt = E.map((e) => dv(e, 't'));
    const eqs = [];
    eqs.push({ n: 'Gauss for E', f: '∇·E = ρ/ε₀', ...residuo([por(E0V, divE)], [rho]), t: `$∇·E = ${tx(divE)}$`, extra: `required ρ = ε₀∇·E = ${tx(por(E0V, divE))}` });
    let divB = null;
    if (conB) { divB = div(B); eqs.push({ n: 'Gauss for B', f: '∇·B = 0', ...residuo([divB], [CERO]), t: `$∇·B = ${tx(divB)}$` }); }
    if (conB) eqs.push({ n: 'Faraday', f: '∇×E = −∂B/∂t', ...residuo(rotE, dBdt.map(neg)), t: `$∇×E = (${rotE.map(tx).join(', ')})$ y $−∂B/∂t = (${dBdt.map((d) => tx(neg(d))).join(', ')})$` });
    let rotB = null;
    if (conB) { rotB = rot(B); eqs.push({ n: 'Ampère–Maxwell', f: '∇×B = μ₀J + μ₀ε₀ ∂E/∂t', ...residuo(rotB.map((b) => por(1 / MU0, b)), J.map((j, i) => suma(j, por(E0V, dEdt[i])))), t: `$∇×B = (${rotB.map(tx).join(', ')})$` }); }
    for (const q of eqs) q.ok = q.rel <= 1e-6;
    const fallan = eqs.filter((q) => !q.ok), pasos = [];
    pasos.push({ t: 'Set-up', html: `Each Maxwell equation is checked with the exact partial derivatives of what you typed (variables $x$, $y$, $z$, $t$ in m and s). Then the difference between the two sides is evaluated at ${PUNTOS.length} test points and accepted if it is less than $10^{−6}$ of the size of the terms.` });
    pasos.push({ t: 'Divergence of E', html: `$∇·E = {∂E_x}/{∂x} + {∂E_y}/{∂y} + {∂E_z}/{∂z} = ${tx(divE)}$. Gauss requires $∇·E = ρ/ε_0$: ` + (eqs[0].ok ? `it holds with ρ = ${tx(rho)}.` : `it does not hold with ρ = ${tx(rho)}; you would need $ρ = ε_0 ∇·E = ${tx(por(E0V, divE))}$ (relative difference ${f(eqs[0].rel)}).`) });
    if (conB) {
      pasos.push({ t: 'Divergence of B', html: `$∇·B = ${tx(divB)}$. Gauss for B requires it to be 0: ` + (eqs[1].ok ? 'it holds.' : `it does not hold (relative difference ${f(eqs[1].rel)}): such a B field would imply a magnetic monopole.`) });
      pasos.push({ t: 'Curl of E', html: `$∇×E = (${rotE.map(tx).join(', ')})$ and $−{∂B}/{∂t} = (${dBdt.map((d) => tx(neg(d))).join(', ')})$. Faraday: ` + (eqs[2].ok ? 'coinciden.' : `they do not match (relative difference ${f(eqs[2].rel)}).`) });
      pasos.push({ t: 'Curl of B', html: `$∇×B = (${rotB.map(tx).join(', ')})$ and $μ_0 J + μ_0 ε_0 {∂E}/{∂t} = μ_0 (${J.map((j, i) => tx(suma(j, por(E0V, dEdt[i])))).join(', ')})$. Ampère–Maxwell: ` + (eqs[3].ok ? 'coinciden.' : `they do not match (relative difference ${f(eqs[3].rel)}).`) });
    } else {
      pasos.push({ t: 'What B is', html: `With E alone, Faraday gives $∂B/∂t = −∇×E = (${rotE.map((r2) => tx(neg(r2))).join(', ')})$. Integrating in $t$ (plus an arbitrary static field) gives B; enter it in the B fields to check Gauss for B and Ampère–Maxwell.` });
    }
    pasos.push({ t: 'Conclusion', html: conB ? (fallan.length ? `The field does <b>not</b> satisfy: ${fallan.map((q) => q.n).join(', ')}. It cannot be an electromagnetic field with those sources.` : 'It satisfies the four equations: it is a possible electromagnetic field with those sources.') : (eqs[0].ok ? 'It satisfies Gauss for E; enter the B field to continue.' : 'It does not satisfy Gauss for E with that ρ.') });
    const ok = conB && !fallan.length;
    return { modo: 'campo', eqs, conB, ok, fallan, divE: tx(divE), rotE: rotE.map(tx), dBdt: dBdt.map((d) => tx(neg(d))), pasos, grafica: { barras: eqs.map((q) => ({ n: q.n, v: q.rel })), yl: 'relative difference between the two sides', cero: true } };
  }

  function resolver(sc) {
    const modo = sc.modo || 'gauss';
    if (modo === 'campo') return resolverCampo(sc);
    if (!campos[modo]) throw new Error('That equation does not exist');
    let r;
    if (modo === 'gauss') {
      const Q = lee(sc, 'Q', 'the charge', 'cualquiera') * 1e-9, R = lee(sc, 'R', 'the radius of the sphere'), rr = lee(sc, 'r', 'the radius of the surface');
      if (Q === 0) throw new Error('The charge cannot be 0');
      const k = 1 / (4 * Math.PI * E0V), dentro = rr < R, Qint = dentro ? Q * (rr / R) ** 3 : Q, Phi = Qint / E0V;
      const Ef = (x) => (x < R ? (k * Q * x) / R ** 3 : (k * Q) / x ** 2), E = Ef(rr);
      const pasos = [
        { t: 'Gauss\'s law', html: `$∮ E·dS = Q_{enc}/ε_0$, with $ε_0 = 8.854·10^{−12} "F/m"$` },
        { t: 'Enclosed charge', html: dentro ? `The surface ($r = ${fm(rr)} "m"$) is inside the sphere ($R = ${fm(R)} "m"$): it encloses only the fraction $(r/R)^3$ of the charge. $Q_{enc} = Q (r/R)^3 = ${fm(Qint)} "C"$` : `The surface ($r = ${fm(rr)} "m"$) contains the whole sphere ($R = ${fm(R)} "m"$): $Q_{enc} = Q = ${fm(Q)} "C"$` },
        { t: 'Flux', html: `$Φ_E = Q_{enc}/ε_0 = {${fm(Qint)}}/{8,854·10^{−12}} = ${fm(Phi)} "V·m"$` },
        { t: 'Field at the surface', html: `By symmetry E is radial and constant over the sphere of radius $r$, so $E·4π r^2 = Φ_E$ and $E = Φ_E/{4π r^2} = ${fm(E)} "V/m"$` + (dentro ? `, which is $E = {Q r}/{4π ε_0 R^3}$` : `, which is $E = Q/{4π ε_0 r^2}$`) },
      ];
      r = { Q, R, r: rr, dentro, Qint, Phi, E, pasos, grafica: { xl: 'r (m)', yl: 'E (V/m)', series: [{ n: 'E(r)', c: '--e', pts: lineas(0, 3 * Math.max(R, rr), (x) => Math.abs(Ef(x))) }], marca: rr } };
    } else if (modo === 'gaussmag') {
      const B = [lee(sc, 'Bx', 'the x component of B', 'cualquiera'), lee(sc, 'By', 'the y component of B', 'cualquiera'), lee(sc, 'Bz', 'the z component of B', 'cualquiera')], L = lee(sc, 'L', 'the side of the cube');
      if (!B.some((b) => b !== 0)) throw new Error('B cannot be zero in all its components');
      const A = L * L, caras = [];
      ['x', 'y', 'z'].forEach((e, i) => { caras.push({ n: `+${e}`, v: B[i] * A }); caras.push({ n: `−${e}`, v: -B[i] * A }); });
      const total = caras.reduce((s, c) => s + c.v, 0);
      const pasos = [
        { t: 'Gauss\'s law for B', html: `$∮ B·dS = 0$: there are no magnetic charges, so the B field lines neither begin nor end anywhere and everything that enters a closed surface leaves it.` },
        { t: 'Area of each face', html: `$A = L^2 = (${fm(L)})^2 = ${fm(A)} "m"^2$` },
        { t: 'Flux through each face', html: `With the normal pointing outward, on the $+x$ face it is $Φ = B_x A = ${fm(B[0] * A)} "Wb"$ and on the opposite one, $−x$, the normal changes sign: $Φ = −B_x A = ${fm(-B[0] * A)} "Wb"$. The same for y and z: $±B_y A = ±${fm(Math.abs(B[1] * A))} "Wb"$ and $±B_z A = ±${fm(Math.abs(B[2] * A))} "Wb"$.` },
        { t: 'Total flux', html: `$Φ_B = Σ Φ_{faces} = 0$: whatever enters through one face leaves through the opposite one.` },
        { t: 'Differential form', html: `Applying the divergence theorem to a very small cube, $∇·B = {∂B_x}/{∂x} + {∂B_y}/{∂y} + {∂B_z}/{∂z} = 0$. In a uniform field the three derivatives are 0, and also in that of a magnet or a current.` },
      ];
      r = { B, L, A, caras, total, pasos, grafica: { barras: caras.map((c) => ({ n: c.n, v: c.v })), yl: 'Φ (Wb)' } };
    } else if (modo === 'faraday') {
      const B0 = lee(sc, 'B0', 'the field amplitude') * 1e-3, fr = lee(sc, 'fr', 'the frequency'), A = lee(sc, 'A', 'the area') * 1e-4, N = lee(sc, 'N', 'the number of turns');
      if (!Number.isInteger(N)) throw new Error('The number of turns must be an integer');
      const w = 2 * Math.PI * fr, Phi0 = N * B0 * A, emax = Phi0 * w, T = 1 / fr;
      const pasos = [
        { t: 'Faraday\'s law', html: `$ε = −{dΦ}/{dt}$ with $Φ = N ∫ B·dS$ (flux linkage of the $N$ turns)` },
        { t: 'Flux', html: `With $B(t) = B_0 sin ωt$ perpendicular to the coil, $Φ(t) = N B_0 A sin ωt$. Its amplitude is $N B_0 A = ${N} · ${fm(B0)} · ${fm(A)} = ${fm(Phi0)} "Wb"$` },
        { t: 'Angular frequency', html: `$ω = 2π f = 2π · ${fm(fr)} = ${fm(w)} "rad/s"$` },
        { t: 'Electromotive force', html: `$ε(t) = −{dΦ}/{dt} = −N B_0 A ω cos ωt$, with amplitude $ε_{max} = Φ_0 ω = ${fm(Phi0)} · ${fm(w)} = ${fm(emax)} "V"$` },
        { t: 'RMS value', html: `$ε_{rms} = ε_{max}/√2 = ${fm(emax / Math.SQRT2)} "V"$. The emf is 90° out of phase with the flux: it is maximum when the flux passes through zero, which is when it changes fastest.` },
        { t: 'Differential form', html: `By Stokes, $∮ E·dl = −{dΦ}/{dt}$ is equivalent to $∇ × E = −{∂B}/{∂t}$: a changing magnetic field creates an electric field with circulation.` },
      ];
      const nt = (t) => Math.sin(w * t), ne = (t) => -Math.cos(w * t);
      r = { B0, fr, A, N, w, Phi0, emax, T, pasos, grafica: { xl: 't (s)', yl: 'relative to the maximum', series: [{ n: `Φ (max. ${f(Phi0)} Wb)`, c: '--b', pts: lineas(0, 2 * T, nt, 200) }, { n: `ε (max. ${f(emax)} V)`, c: '--e', pts: lineas(0, 2 * T, ne, 200) }] } };
    } else if (modo === 'ampere') {
      const I = lee(sc, 'I', 'the current'), R = lee(sc, 'R', 'the plate radius') * 1e-2, rr = lee(sc, 'r', 'the distance to the axis') * 1e-2;
      const dEdt = I / (E0V * Math.PI * R ** 2), dentro = rr < R, Id = dentro ? I * (rr / R) ** 2 : I, B = (MU0 * Id) / (2 * Math.PI * rr);
      const Bf = (x) => (x < R ? (MU0 * I * x) / (2 * Math.PI * R ** 2) : (MU0 * I) / (2 * Math.PI * x));
      const pasos = [
        { t: 'Ampère–Maxwell law', html: `$∮ B·dl = μ_0 (I_{enc} + ε_0 {dΦ_E}/{dt})$: the second term is the displacement current $I_d$.` },
        { t: 'Field between the plates', html: `Between the plates the field is uniform, $E = σ/ε_0 = Q/{ε_0 π R^2}$, and grows as charge arrives: $dE/dt = I/{ε_0 π R^2} = ${fm(I)}/{8.854·10^{−12}·π·(${fm(R)})^2} = ${fm(dEdt)} "V/(m·s)"$` },
        { t: 'Enclosed displacement current', html: dentro ? `A circle of radius $r = ${fm(rr)} "m"$ (inside the plates) spans the fraction $r^2/R^2$ of the flux: $I_d = ε_0 π r^2 dE/dt = I r^2/R^2 = ${fm(Id)} "A"$` : `A circle of radius $r = ${fm(rr)} "m"$ (outside the plates) spans the whole field: $I_d = ε_0 π R^2 dE/dt = I = ${fm(Id)} "A"$. It is the same current that arrives through the wire: Ampère's law without $I_d$ would not hold.` },
        { t: 'Magnetic field', html: `By symmetry B is tangent to the circle: $B · 2π r = μ_0 I_d$, so $B = {μ_0 I_d}/{2π r} = ${fm(B)} "T"$` + (dentro ? `, that is, $B = {μ_0 I r}/{2π R^2}$` : `, that is, $B = {μ_0 I}/{2π r}$, the same as that of a wire`) },
        { t: 'Differential form', html: `By Stokes: $∇ × B = μ_0 J + μ_0 ε_0 {∂E}/{∂t}$. Maxwell added the last term; with it the equations predict waves.` },
      ];
      r = { I, R, r: rr, dEdt, dentro, Id, B, pasos, grafica: { xl: 'r (m)', yl: 'B (T)', series: [{ n: 'B(r)', c: '--b', pts: lineas(0, 3 * Math.max(R, rr), Bf) }], marca: rr } };
    } else if (modo === 'continuidad') {
      const sigma = lee(sc, 'sigma', 'the conductivity'), er = lee(sc, 'er', 'the relative permittivity'), rho0 = lee(sc, 'rho0', 'the initial charge density', 'cualquiera') * 1e-6;
      if (er < 1) throw new Error('The relative permittivity must be at least 1');
      if (rho0 === 0) throw new Error('The initial charge density cannot be 0');
      const t = vacio(sc.t) ? null : lee(sc, 't', 'the instant', 'no0'), fr = vacio(sc.fr) ? null : lee(sc, 'fr', 'the frequency');
      const eps = er * E0V, tau = eps / sigma, rho = (x) => rho0 * Math.exp(-x / tau), Q = (x) => rho(x) / rho0;
      const t1 = tau * Math.log(100), th = tau * Math.LN2, rt = t === null ? null : rho(t), ratio = fr === null ? null : sigma / (2 * Math.PI * fr * eps);
      const pasos = [
        { t: 'Continuity equation', html: `Charge is neither created nor destroyed: $∇·J + {∂ρ}/{∂t} = 0$. It comes from taking the divergence of Ampère–Maxwell, $∇·(∇ × B) = 0 = μ_0 ∇·J + μ_0 ε_0 {∂(∇·E)}/{∂t}$, and using Gauss, $∇·E = ρ/ε_0$.` },
        { t: 'Ohm\'s law and Gauss', html: `In an ohmic medium $J = σ E$, and with Gauss in the material, $∇·E = ρ/ε$, with $ε = ε_r ε_0 = ${fm(er)} · 8.854·10^{−12} = ${fm(eps)} "F/m"$. Then $∇·J = σ ρ/ε$.` },
        { t: 'Relaxation equation', html: `$σ/ε ρ + {∂ρ}/{∂t} = 0$ ⇒ $ρ(t) = ρ_0 e^{−t/τ}$, with the relaxation constant $τ = ε/σ = {${fm(eps)}}/{${fm(sigma)}} = ${fm(tau)} "s"$.` },
        { t: 'Characteristic times', html: `At $t = τ$ 36.8 % of the charge remains; half at $τ ln 2 = ${fm(th)} "s"$; and 1 % at $τ ln 100 = ${fm(t1)} "s"$. ${tau < 1e-12 ? 'In a good conductor it is so short that the free charge goes to the surface practically instantly.' : tau > 1e-3 ? 'In a good insulator the charge takes a long time to leave.' : ''}` },
      ];
      if (t !== null) pasos.push({ t: `At t = ${f(t)} s`, html: `$ρ = ρ_0 e^{−t/τ}$ = ${fm(rho0)} · e^{−${fm(t / tau)}} = <b>${fm(rt)} "C/m"^3</b>, that is, ${fm(100 * Math.exp(-t / tau))} % of the initial one. The charge that has gone, ${fm(100 * (1 - Math.exp(-t / tau)))} %, has left through the surface as a conduction current.` });
      if (ratio !== null) pasos.push({ t: 'Conductor or dielectric at that frequency?', html: `$σ/(ω ε) = ${fm(sigma)}/(2π · ${fm(fr)} · ${fm(eps)}) = ${fm(ratio)}$ ($= 1/(ω τ)$): ${ratio > 10 ? 'the conduction current dominates over the displacement current: it behaves as a good conductor' : ratio < 0.1 ? 'the displacement current dominates: it behaves as a dielectric' : 'both currents are comparable'}.` });
      const T = 5 * tau;
      r = { sigma, er, eps, rho0, tau, t, rt, th, t1, ratio, pasos, grafica: { xl: 't (s)', yl: 'ρ/ρ₀', series: [{ n: 'ρ(t)/ρ₀', c: '--e', pts: lineas(0, T, Q, 200) }], ...(t !== null && t <= T ? { marca: t } : {}) } };
    } else {
      const E0 = lee(sc, 'E0', 'the amplitude of E'), fr = lee(sc, 'fr', 'the frequency');
      const B0 = E0 / C, lam = C / fr, I = (E0 * E0) / (2 * MU0 * C), u = (E0V * E0 * E0) / 2, eta = MU0 * C;
      const pasos = [
        { t: 'Wave speed', html: `Combining the Faraday and Ampère–Maxwell equations in vacuum gives $∇^2 E = μ_0 ε_0 {∂^2 E}/{∂t^2}$, a wave equation with $c = 1/√{μ_0 ε_0} = 1/√{${fm(MU0)} · ${fm(E0V)}} = ${fm(C)} "m/s"$` },
        { t: 'Amplitude of B', html: `Faraday gives $E_0 = c B_0$, so $B_0 = E_0/c = ${fm(E0)}/${fm(C)} = ${fm(B0)} "T"$` },
        { t: 'Wavelength', html: `$λ = c/f = ${fm(C)}/${fm(fr)} = ${fm(lam)} "m"$` },
        { t: 'Intensity', html: `$I = ⟨S⟩ = {E_0^2}/{2 μ_0 c} = {(${fm(E0)})^2}/{2 · ${fm(MU0)} · ${fm(C)}} = ${fm(I)} "W/m"^2$, with vacuum impedance $η = μ_0 c = ${fm(eta)} "Ω"$` },
        { t: 'Stored energy', html: `The mean energy density is $u = 1/2 ε_0 E_0^2 = ${fm(u)} "J/m"^3$, half electric and half magnetic; the wave carries it at speed $c$ ($I = u c$).` },
      ];
      const k = (2 * Math.PI) / lam;
      r = { E0, fr, B0, lam, I, u, eta, c: C, pasos, grafica: { xl: 'z (m)', yl: 'relative to the amplitude', series: [{ n: `E (${f(E0)} V/m)`, c: '--e', pts: lineas(0, 2 * lam, (z) => Math.cos(k * z), 200) }, { n: `B (${f(B0)} T)`, c: '--b', d: 1, pts: lineas(0, 2 * lam, (z) => Math.cos(k * z), 200) }] } };
    }
    return { modo, ...r };
  }

  const ejemplos = [
    { clave: 'esfera-fuera', nombre: 'Gauss: charged sphere, from outside', sc: { modo: 'gauss', Q: '2', R: '0,1', r: '0,3' } },
    { clave: 'esfera-dentro', nombre: 'Gauss: charged sphere, from inside', sc: { modo: 'gauss', Q: '2', R: '0,1', r: '0,05' } },
    { clave: 'cubo', nombre: 'Gauss for B: a cube in a uniform field', sc: { modo: 'gaussmag', Bx: '0,2', By: '-0,1', Bz: '0,3', L: '0,5' } },
    { clave: 'bobina', nombre: 'Faraday: 200-turn coil at 50 Hz', sc: { modo: 'faraday', B0: '100', fr: '50', A: '20', N: '200' } },
    { clave: 'condensador-dentro', nombre: 'Ampère–Maxwell: inside a capacitor', sc: { modo: 'ampere', I: '2', R: '5', r: '2' } },
    { clave: 'condensador-fuera', nombre: 'Ampère–Maxwell: outside a capacitor', sc: { modo: 'ampere', I: '2', R: '5', r: '10' } },
    { clave: 'fm', nombre: 'Wave: FM station at 100 MHz', sc: { modo: 'onda', E0: '1', fr: '1e8' } },
    { clave: 'relajacion-agua', nombre: 'Continuity: charge relaxation in distilled water', sc: { modo: 'continuidad', sigma: '5,5e-6', er: '80', rho0: '10', t: '2e-4', fr: '1e3' } },
    { clave: 'relajacion-cobre', nombre: 'Continuity: charge relaxation in copper', sc: { modo: 'continuidad', sigma: '5,96e7', er: '1', rho0: '1', t: '', fr: '1e9' } },
    { clave: 'campo-onda', nombre: 'Field: plane wave in vacuum (satisfies everything)', sc: { modo: 'campo', Ex: '0', Ey: '100 cos(299792458 t - z)', Ez: '0', Bx: '-100 cos(299792458 t - z)/299792458', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-mal', nombre: 'Field: wave with too large a B (Faraday fails)', sc: { modo: 'campo', Ex: '0', Ey: '100 cos(299792458 t - z)', Ez: '0', Bx: '-100 cos(299792458 t - z)/100000000', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-coulomb', nombre: 'Field: point charge (∇·E = 0 away from the origin)', sc: { modo: 'campo', Ex: '9 x/(x^2+y^2+z^2)^(3/2)', Ey: '9 y/(x^2+y^2+z^2)^(3/2)', Ez: '9 z/(x^2+y^2+z^2)^(3/2)', Bx: '0', By: '0', Bz: '0', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-uniforme', nombre: 'Field: linear E without charges (Gauss fails)', sc: { modo: 'campo', Ex: '5 x', Ey: '0', Ez: '0', Bx: '', By: '', Bz: '', rho: '', Jx: '', Jy: '', Jz: '' } },
    { clave: 'campo-rho', nombre: 'Field: E = 5x with ρ = 5ε₀ (satisfies Gauss)', sc: { modo: 'campo', Ex: '5 x', Ey: '0', Ez: '0', Bx: '0', By: '0', Bz: '0', rho: '4.4270939064*10^(-11)', Jx: '', Jy: '', Jz: '' } },
  ];

  return { resolver, ejemplos, campos, nombres, f, constantes: { E0V, MU0, C } };
})();

