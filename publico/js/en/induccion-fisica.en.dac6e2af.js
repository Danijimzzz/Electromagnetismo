const Induccion = (() => {
  const MU0 = 4e-7 * Math.PI;
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const PREF = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p']];
  const u = (x, unidad, d = 4) => {
    if (!isFinite(x) || x === 0) return `${f(x, d)} ${unidad}`;
    const a = Math.abs(x), p = PREF.find(([v]) => a >= v * 0.9999999) || PREF[PREF.length - 1];
    return `${String(+(x / p[0]).toPrecision(d)).replace('.', '.').replace('-', '−')} ${p[1]}${unidad}`;
  };
  const leeNum0 = (s) => +String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const lee = (sc, k, nom, { opcional = false, cero = false, signo = false } = {}) => {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be a number`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be ${cero ? 'positive or zero' : 'greater than 0'}`);
    return v;
  };

  const GEO_L = {
    solenoide: {
      nombre: 'Long solenoid', campos: [['N', 'Number of turns N', '', 1], ['l', 'Length l', 'cm', 1e-2], ['r', 'Radius r', 'cm', 1e-2], ['mur', 'Relative permeability μ<sub>r</sub>', '', 1]],
      calc: ({ N, l, r, mur }) => {
        const S = Math.PI * r * r, L = (MU0 * mur * N * N * S) / l;
        return { L, pasos: [
          { t: 'Field inside the solenoid (Ampère)', html: `$B = {μ_0 μ_r N I}/l$, uniform inside and zero outside (if l ≫ r).` },
          { t: 'Self flux', html: `$Φ = N B S = {μ_0 μ_r N^2 S I}/l$, with $S = π r^2$ = ${f(S)} m<sup>2</sup>.` },
          { t: 'Self-inductance coefficient', html: `$L = Φ/I = {μ_0 μ_r N^2 π r^2}/l = {4π·10^{−7} · ${f(mur)} · ${f(N)}^2 · ${f(S)}}/{${f(l)}}$ = <b>${u(L, 'H')}</b>` },
        ], B1: (MU0 * mur * N) / l, letras: 'L = {μ_0 μ_r N^2 π r^2}/l' };
      },
    },
    'toroide-rect': {
      nombre: 'Toroid of rectangular cross-section', campos: [['N', 'Number of turns N', '', 1], ['a', 'Inner radius a', 'cm', 1e-2], ['b', 'Outer radius b', 'cm', 1e-2], ['h', 'Height h', 'cm', 1e-2], ['mur', 'Relative permeability μ<sub>r</sub>', '', 1]],
      valida: ({ a, b }) => { if (b <= a) throw new Error('The outer radius must be greater than the inner one'); },
      calc: ({ N, a, b, h, mur }) => {
        const L = (MU0 * mur * N * N * h * Math.log(b / a)) / (2 * Math.PI);
        return { L, pasos: [
          { t: 'Field inside the toroid (Ampère)', html: `$B(r) = {μ_0 μ_r N I}/{2π r}$, for a < r < b.` },
          { t: 'Flux through one turn', html: `$Φ_1 = ∫_a^b B h dr = {μ_0 μ_r N I h ln(b/a)}/{2π}$, with ln(b/a) = ln(${f(b / a)}) = ${f(Math.log(b / a))}.` },
          { t: 'Self-inductance coefficient', html: `$L = {N Φ_1}/I = {μ_0 μ_r N^2 h ln(b/a)}/{2π} = 2·10^{−7} · ${f(mur)} · ${f(N)}^2 · ${f(h)} · ${f(Math.log(b / a))}$ = <b>${u(L, 'H')}</b>` },
        ], letras: 'L = {μ_0 μ_r N^2 h}/{2π} ln(b/a)' };
      },
    },
    'toroide-circ': {
      nombre: 'Toroid of circular cross-section', campos: [['N', 'Number of turns N', '', 1], ['R', 'Mean radius R', 'cm', 1e-2], ['r', 'Radius of the cross-section r', 'cm', 1e-2], ['mur', 'Relative permeability μ<sub>r</sub>', '', 1]],
      valida: ({ R, r }) => { if (r >= R) throw new Error('The radius of the cross-section must be smaller than the mean radius'); },
      calc: ({ N, R, r, mur }) => {
        const L = MU0 * mur * N * N * (R - Math.sqrt(R * R - r * r)), La = (MU0 * mur * N * N * r * r) / (2 * R);
        return { L, pasos: [
          { t: 'Field inside the toroid (Ampère)', html: `$B(ρ) = {μ_0 μ_r N I}/{2π ρ}$, at a distance ρ from the axis.` },
          { t: 'Self-inductance coefficient', html: `Integrating the flux over the circular cross-section: $L = μ_0 μ_r N^2 (R − √(R^2 − r^2))$ = <b>${u(L, 'H')}</b>` },
          { t: 'Thin toroid approximation', html: `If r ≪ R, B is almost uniform and $L ≈ {μ_0 μ_r N^2 π r^2}/{2π R}$ = ${u(La, 'H')} (it differs by ${f(100 * Math.abs(La / L - 1), 2)} %).` },
        ], letras: 'L = μ_0 μ_r N^2 (R − √(R^2 − r^2))' };
      },
    },
    entrehierro: {
      nombre: 'Toroid with air gap', campos: [['N', 'Number of turns N', '', 1], ['R', 'Mean radius R', 'cm', 1e-2], ['S', 'Cross-section S', 'cm²', 1e-4], ['mur', 'Relative permeability of the core μ<sub>r</sub>', '', 1], ['g', 'Air gap g', 'mm', 1e-3]],
      valida: ({ R, g }) => { if (g >= 2 * Math.PI * R) throw new Error('The air gap cannot be longer than the toroid'); },
      calc: ({ N, R, S, mur, g }) => {
        const lc = 2 * Math.PI * R - g, Rn = lc / (MU0 * mur * S), Rg = g / (MU0 * S), Rt = Rn + Rg, L = (N * N) / Rt, L0 = (MU0 * mur * N * N * S) / (2 * Math.PI * R);
        return { L, pasos: [
          { t: 'Ampère\'s law', html: `Along the mean line of the toroid: $H_n l_n + H_g g = N I$, with $l_n = 2πR − g$ = ${f(lc)} m of core. Without leakage, B is the same in the core and in the gap: $H_n = B/(μ_0 μ_r)$ and $H_g = B/μ_0$, so $B = {μ_0 N I}/{l_n/μ_r + g}$.` },
          { t: 'Reluctances', html: `As in a series circuit: $ℛ_n = {l_n}/{μ_0 μ_r S}$ = ${f(Rn)} A/Wb and $ℛ_g = g/(μ_0 S)$ = ${f(Rg)} A/Wb. Total ℛ = <b>${f(Rt)} A/Wb</b>${Rg > Rn ? `: the air gap, although it measures only ${f(g * 1000)} mm, weighs more than the whole core` : ''}.` },
          { t: 'Self-inductance coefficient', html: `Φ = N I/ℛ per turn, and $L = {N Φ}/I = N^2/ℛ = ${f(N)}^2/{${f(Rt)}}$ = <b>${u(L, 'H')}</b>. Without the air gap it would be $ {μ_0 μ_r N^2 S}/{2π R}$ = ${u(L0, 'H')}, ${f(L0 / L, 3)} times more.` },
        ], B1: N / (Rt * S), letras: 'L = {μ_0 N^2 S}/{(2π R − g)/μ_r + g}' };
      },
    },
    coaxial: {
      nombre: 'Coaxial cable', campos: [['l', 'Length l', 'm', 1], ['a', 'Radius of the inner conductor a', 'mm', 1e-3], ['b', 'Radius of the outer conductor b', 'mm', 1e-3]], interior: true,
      valida: ({ a, b }) => { if (b <= a) throw new Error('The outer radius must be greater than the inner one'); },
      calc: ({ l, a, b, macizo }) => {
        const Le = (MU0 * l * Math.log(b / a)) / (2 * Math.PI), Li = macizo ? (MU0 * l) / (8 * Math.PI) : 0, L = Le + Li;
        const pasos = [
          { t: 'Field between the conductors (Ampère)', html: `$B(r) = {μ_0 I}/{2π r}$, for a < r < b; outside the cable B = 0.` },
          { t: 'External part', html: `$Φ = ∫_a^b B l dr = {μ_0 I l ln(b/a)}/{2π}$ ⇒ $L_ext = {μ_0 l ln(b/a)}/{2π} = 2·10^{−7} · ${f(l)} · ln(${f(b / a)})$ = <b>${u(Le, 'H')}</b>` },
        ];
        if (macizo) pasos.push({ t: 'Internal part (solid conductor)', html: `Inside the conductor $B = {μ_0 I r}/{2π a^2}$. From energy, $1/2 L_int I^2 = ∫ B^2/(2μ_0) dV$ ⇒ $L_int = {μ_0 l}/{8π}$ = ${u(Li, 'H')}. Total: L = <b>${u(L, 'H')}</b>` });
        pasos.push({ t: 'Per unit length', html: `$L/l$ = <b>${u(L / l, 'H/m')}</b>` });
        return { L, pasos, letras: macizo ? 'L = {μ_0 l}/{2π} (ln(b/a) + 1/4)' : 'L = {μ_0 l}/{2π} ln(b/a)' };
      },
    },
    bifilar: {
      nombre: 'Twin-wire line', campos: [['l', 'Length l', 'm', 1], ['d', 'Centre-to-centre distance d', 'mm', 1e-3], ['a', 'Radius of each wire a', 'mm', 1e-3]], interior: true,
      valida: ({ d, a }) => { if (d <= 2 * a) throw new Error('The wires touch: the centre-to-centre distance must be greater than 2a'); },
      calc: ({ l, d, a, macizo }) => {
        const Le = (MU0 * l * Math.log((d - a) / a)) / Math.PI, Li = macizo ? (MU0 * l) / (4 * Math.PI) : 0, L = Le + Li;
        const pasos = [
          { t: 'Field between the wires', html: `Each wire creates $B = {μ_0 I}/{2π r}$ and between them the two fields add: $B(x) = {μ_0 I}/{2π} (1/x + 1/(d − x))$.` },
          { t: 'Flux between the wires', html: `$Φ = ∫_a^{d−a} B l dx = {μ_0 I l}/π ln({d − a}/a)$ ⇒ $L_ext = {μ_0 l}/π ln({d − a}/a) = 4·10^{−7} · ${f(l)} · ln(${f((d - a) / a)})$ = <b>${u(Le, 'H')}</b>${d > 20 * a ? ` ($≈ {μ_0 l}/π ln(d/a)$, since d ≫ a)` : ''}` },
        ];
        if (macizo) pasos.push({ t: 'Internal part (solid wires)', html: `Each wire contributes $ {μ_0 l}/{8π}$: $L_int = {μ_0 l}/{4π}$ = ${u(Li, 'H')}. Total: L = <b>${u(L, 'H')}</b>` });
        pasos.push({ t: 'Per unit length', html: `$L/l$ = <b>${u(L / l, 'H/m')}</b>` });
        return { L, pasos, letras: macizo ? 'L = {μ_0 l}/π (ln({d − a}/a) + 1/4)' : 'L = {μ_0 l}/π ln({d − a}/a)' };
      },
    },
  };

  const GEO_M = {
    solenoides: {
      nombre: 'Two coaxial solenoids', campos: [['N1', 'Turns of the inner one N<sub>1</sub>', '', 1], ['r1', 'Radius of the inner one r<sub>1</sub>', 'cm', 1e-2], ['N2', 'Turns of the outer one N<sub>2</sub>', '', 1], ['r2', 'Radius of the outer one r<sub>2</sub>', 'cm', 1e-2], ['l', 'Common length l', 'cm', 1e-2]],
      valida: ({ r1, r2 }) => { if (r1 > r2) throw new Error('The inner solenoid cannot be wider than the outer one'); },
      calc: ({ N1, r1, N2, r2, l }) => {
        const S1 = Math.PI * r1 * r1, M = (MU0 * N1 * N2 * S1) / l, L1 = (MU0 * N1 * N1 * S1) / l, L2 = (MU0 * N2 * N2 * Math.PI * r2 * r2) / l;
        return { M, L1, L2, pasos: [
          { t: 'Field of the outer one', html: `With a current I<sub>2</sub> in the outer one, $B_2 = {μ_0 N_2 I_2}/l$ inside it, also inside the inner one.` },
          { t: 'Flux in the inner one', html: `$Φ_12 = N_1 B_2 π r_1^2 = {μ_0 N_1 N_2 π r_1^2 I_2}/l$ (only the cross-section of the inner one counts).` },
          { t: 'Mutual inductance coefficient', html: `$M = {Φ_12}/{I_2} = {μ_0 N_1 N_2 π r_1^2}/l = {4π·10^{−7} · ${f(N1)} · ${f(N2)} · ${f(S1)}}/{${f(l)}}$ = <b>${u(M, 'H')}</b>. The same comes out calculating the flux of the inner one in the outer one ($M_12 = M_21$).` },
          { t: 'Coupling coefficient', html: `$L_1 = {μ_0 N_1^2 π r_1^2}/l$ = ${u(L1, 'H')}, $L_2 = {μ_0 N_2^2 π r_2^2}/l$ = ${u(L2, 'H')} ⇒ $k = M/√(L_1 L_2) = {r_1}/{r_2}$ = <b>${f(M / Math.sqrt(L1 * L2))}</b>` },
        ], letras: 'M = {μ_0 N_1 N_2 π r_1^2}/l' };
      },
    },
    espiras: {
      nombre: 'Small loop at the centre of a large one', campos: [['N1', 'Turns of the large one N<sub>1</sub>', '', 1], ['R', 'Radius of the large one R', 'cm', 1e-2], ['N2', 'Turns of the small one N<sub>2</sub>', '', 1], ['r', 'Radius of the small one r', 'cm', 1e-2]],
      valida: ({ R, r }) => { if (r >= R) throw new Error('The small loop must have a smaller radius than the large one'); },
      calc: ({ N1, R, N2, r }) => {
        const M = (MU0 * N1 * N2 * Math.PI * r * r) / (2 * R);
        return { M, pasos: [
          { t: 'Field at the centre of the large one', html: `$B_1 = {μ_0 N_1 I_1}/{2R}$ (Biot-Savart at the centre of the loop).` },
          { t: 'Flux in the small one', html: `If r ≪ R the field is almost uniform over the small loop: $Φ_21 = N_2 B_1 π r^2$.` },
          { t: 'Mutual inductance coefficient', html: `$M = {Φ_21}/{I_1} = {μ_0 N_1 N_2 π r^2}/{2R}$ = <b>${u(M, 'H')}</b>${r > 0.2 * R ? '. Note: r is not much smaller than R, so this is a rough approximation.' : ''}` },
        ], letras: 'M = {μ_0 N_1 N_2 π r^2}/{2R}' };
      },
    },
    'espiras-coaxiales': {
      nombre: 'Two coaxial loops apart', campos: [['N1', 'Turns of the large one N<sub>1</sub>', '', 1], ['R', 'Radius of the large one R', 'cm', 1e-2], ['N2', 'Turns of the small one N<sub>2</sub>', '', 1], ['r', 'Radius of the small one r', 'cm', 1e-2], ['z', 'Distance between the centres z', 'cm', 1e-2]],
      valida: ({ R, r }) => { if (r > R) throw new Error('Put the larger-radius one as loop 1'); },
      calc: ({ N1, R, N2, r, z }) => {
        const D = Math.pow(R * R + z * z, 1.5), M = (MU0 * N1 * N2 * Math.PI * R * R * r * r) / (2 * D);
        return { M, pasos: [
          { t: 'Field of the large one on its axis', html: `$B_1(z) = {μ_0 N_1 I_1 R^2}/{2 (R^2 + z^2)^{3/2}}$ (Biot-Savart), with $(R^2 + z^2)^{3/2}$ = ${f(D)} m<sup>3</sup>.` },
          { t: 'Flux in the small one', html: `If the small one is small compared with the distance to the wires of the large one, B<sub>1</sub> is almost uniform over it: $Φ_21 = N_2 B_1 π r^2$.` },
          { t: 'Mutual inductance coefficient', html: `$M = {μ_0 π N_1 N_2 R^2 r^2}/{2 (R^2 + z^2)^{3/2}}$ = <b>${u(M, 'H')}</b>. With z ≫ R it falls as 1/z<sup>3</sup>, just like the field of a dipole.${r > 0.3 * Math.sqrt(R * R + z * z) ? ' Note: r is not small compared with √(R² + z²), so this is a rough approximation.' : ''}` },
        ], letras: 'M = {μ_0 π N_1 N_2 R^2 r^2}/{2 (R^2 + z^2)^{3/2}}' };
      },
    },
    'espira-solenoide': {
      nombre: 'Loop or coil inside a solenoid', campos: [['N1', 'Turns of the solenoid N<sub>1</sub>', '', 1], ['l', 'Length of the solenoid l', 'cm', 1e-2], ['N2', 'Turns of the coil N<sub>2</sub>', '', 1], ['r', 'Radius of the coil r', 'cm', 1e-2], ['th', 'Angle between the axes θ', '°', 1]],
      valida: ({ th }) => { if (th > 180) throw new Error('The angle between the axes must be between 0° and 180°'); },
      calc: ({ N1, l, N2, r, th }) => {
        const c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180), M = (MU0 * N1 * N2 * Math.PI * r * r * c) / l;
        return { M, pasos: [
          { t: 'Field of the solenoid', html: `$B_1 = {μ_0 N_1 I_1}/l$, uniform inside (the coil must fit inside and far from the ends).` },
          { t: 'Flux in the coil', html: `$Φ_21 = N_2 B_1 π r^2 cos θ$: only the component of B perpendicular to the coil counts.` },
          { t: 'Mutual inductance coefficient', html: `$M = {μ_0 N_1 N_2 π r^2 cos θ}/l = {4π·10^{−7} · ${f(N1)} · ${f(N2)} · π·${f(r)}^2${th ? ` · cos ${f(th)}°` : ''}}/{${f(l)}}$ = <b>${u(M, 'H')}</b>${c === 0 ? ': with the axes perpendicular there is no coupling' : ''}. Rotating the coil, M changes as cos θ (this is how a generator works).` },
        ], letras: 'M = {μ_0 N_1 N_2 π r^2 cos θ}/l' };
      },
    },
    'hilo-espira': {
      nombre: 'Straight wire and coplanar rectangular loop', campos: [['d', 'Distance from the wire to the near side d', 'cm', 1e-2], ['w', 'Width of the loop w', 'cm', 1e-2], ['h', 'Side parallel to the wire h', 'cm', 1e-2], ['N2', 'Turns of the loop N', '', 1]],
      calc: ({ d, w, h, N2 }) => {
        const M = (MU0 * N2 * h * Math.log((d + w) / d)) / (2 * Math.PI);
        return { M, pasos: [
          { t: 'Field of the wire', html: `$B(x) = {μ_0 I}/{2π x}$, perpendicular to the plane of the loop.` },
          { t: 'Flux in the loop', html: `$Φ = N ∫_d^{d+w} {μ_0 I h}/{2π x} dx = {μ_0 N I h}/{2π} ln({d + w}/d)$, with ln(${f((d + w) / d)}) = ${f(Math.log((d + w) / d))}.` },
          { t: 'Mutual inductance coefficient', html: `$M = Φ/I = {μ_0 N h}/{2π} ln({d + w}/d) = 2·10^{−7} · ${f(N2)} · ${f(h)} · ${f(Math.log((d + w) / d))}$ = <b>${u(M, 'H')}</b>` },
        ], letras: 'M = {μ_0 N h}/{2π} ln({d + w}/d)' };
      },
    },
    'toroide-bobina': {
      nombre: 'Coil wound on a toroid', campos: [['N1', 'Turns of the toroid N<sub>1</sub>', '', 1], ['N2', 'Turns of the coil N<sub>2</sub>', '', 1], ['a', 'Inner radius a', 'cm', 1e-2], ['b', 'Outer radius b', 'cm', 1e-2], ['h', 'Height h', 'cm', 1e-2]],
      valida: ({ a, b }) => { if (b <= a) throw new Error('The outer radius must be greater than the inner one'); },
      calc: ({ N1, N2, a, b, h }) => {
        const M = (MU0 * N1 * N2 * h * Math.log(b / a)) / (2 * Math.PI), L1 = (MU0 * N1 * N1 * h * Math.log(b / a)) / (2 * Math.PI), L2 = (MU0 * N2 * N2 * h * Math.log(b / a)) / (2 * Math.PI);
        return { M, L1, L2, pasos: [
          { t: 'Field of the toroid', html: `$B(r) = {μ_0 N_1 I_1}/{2π r}$ inside the core.` },
          { t: 'Flux in the coil', html: `The coil surrounds the whole core: $Φ_21 = N_2 {μ_0 N_1 I_1 h}/{2π} ln(b/a)$.` },
          { t: 'Mutual inductance coefficient', html: `$M = {μ_0 N_1 N_2 h}/{2π} ln(b/a)$ = <b>${u(M, 'H')}</b>. The two coils share all the flux, so $k = M/√(L_1 L_2)$ = <b>1</b> (L<sub>1</sub> = ${u(L1, 'H')}, L<sub>2</sub> = ${u(L2, 'H')}).` },
        ], letras: 'M = {μ_0 N_1 N_2 h}/{2π} ln(b/a)' };
      },
    },
    acoplamiento: {
      nombre: 'From L₁, L₂ and k', campos: [['L1', 'L<sub>1</sub>', 'mH', 1e-3], ['L2', 'L<sub>2</sub>', 'mH', 1e-3], ['k', 'Coupling coefficient k', '', 1]],
      valida: ({ k }) => { if (k > 1) throw new Error('The coupling coefficient cannot be greater than 1'); },
      calc: ({ L1, L2, k }) => {
        const M = k * Math.sqrt(L1 * L2);
        return { M, L1, L2, pasos: [{ t: 'Mutual inductance coefficient', html: `$M = k √(L_1 L_2) = ${f(k)} · √(${f(L1)} · ${f(L2)})$ = <b>${u(M, 'H')}</b>` }], letras: 'M = k √(L_1 L_2)' };
      },
    },
  };

  function leerGeo(G, sc) {
    const p = {};
    for (const [k, nom, un, fac] of G.campos) {
      const n = nom.replace(/<[^>]+>/g, '');
      p[k] = lee(sc, k, n.toLowerCase(), { cero: k === 'th' }) * fac;
      if ((k === 'N' || k === 'N1' || k === 'N2') && !Number.isInteger(p[k])) throw new Error(`${n} must be an integer`);
    }
    if (G.interior) p.macizo = sc.interior === 'macizo';
    if (G.valida) G.valida(p);
    return p;
  }

  function autoinduccion(sc) {
    const G = GEO_L[sc.geo] || GEO_L.solenoide, p = leerGeo(G, sc);
    const r = G.calc(p), { L } = r, pasos = [...r.pasos], res = { L };
    const I = lee(sc, 'I', 'the current', { opcional: true, signo: true }), dI = lee(sc, 'dIdt', 'dI/dt', { opcional: true, signo: true });
    if (I !== null) {
      res.flujo = L * I; res.U = 0.5 * L * I * I;
      pasos.push({ t: `With I = ${f(I)} A`, html: `Self flux $Φ = L I$ = <b>${u(res.flujo, 'Wb')}</b> · magnetic energy $U = 1/2 L I^2 = 1/2 · ${f(L)} · ${f(I)}^2$ = <b>${u(res.U, 'J')}</b>${r.B1 ? `<br>Field ${sc.geo === 'entrehierro' ? 'in the core and in the gap' : 'inside'}: ${sc.geo === 'entrehierro' ? '$B = {N I}/{ℛ S}$' : '$B = {μ_0 μ_r N I}/l$'} = ${u(r.B1 * I, 'T')}; the energy also comes from $u = B^2/(2μ)$ times the volume.` : ''}` });
    }
    if (dI !== null) {
      res.fem = -L * dI;
      pasos.push({ t: `If the current changes at dI/dt = ${f(dI)} A/s`, html: `$ε = −L {dI}/{dt} = −${f(L)} · ${f(dI)}$ = <b>${f(res.fem)} V</b>${dI ? `, which opposes the ${dI > 0 ? 'increase' : 'decrease'} of the current (Lenz's law)` : ''}.` });
    }
    return { G, p, res, pasos, letras: r.letras };
  }

  function mutua(sc) {
    const G = GEO_M[sc.geo] || GEO_M.solenoides, p = leerGeo(G, sc);
    const r = G.calc(p), { M } = r, pasos = [...r.pasos], res = { M, L1: r.L1, L2: r.L2 };
    const I1 = lee(sc, 'I1', 'the current I₁', { opcional: true, signo: true }), dI = lee(sc, 'dI1dt', 'dI₁/dt', { opcional: true, signo: true });
    if (I1 !== null) { res.flujo = M * I1; pasos.push({ t: `With I<sub>1</sub> = ${f(I1)} A`, html: `Flux in circuit 2: $Φ_21 = M I_1$ = <b>${u(res.flujo, 'Wb')}</b>` }); }
    if (dI !== null) { res.fem = -M * dI; pasos.push({ t: `If I<sub>1</sub> changes at ${f(dI)} A/s`, html: `induced emf in circuit 2: $ε_2 = −M {dI_1}/{dt} = −${f(M)} · ${f(dI)}$ = <b>${f(res.fem)} V</b>` }); }
    if (r.L1 !== undefined) {
      const { L1, L2 } = r, D = L1 * L2 - M * M;
      Object.assign(res, { Ls: L1 + L2 + 2 * M, Lso: L1 + L2 - 2 * M, Lp: D / (L1 + L2 - 2 * M), Lpo: D / (L1 + L2 + 2 * M) });
      pasos.push({ t: 'Coils connected in series', html: `With the fluxes adding (like terminals in sequence): $L = L_1 + L_2 + 2M$ = <b>${u(res.Ls, 'H')}</b>. With opposing fluxes: $L = L_1 + L_2 − 2M$ = <b>${u(res.Lso, 'H')}</b>. Measuring both gives $M = {L_added − L_opposed}/4$.` });
      pasos.push({ t: 'Coils connected in parallel', html: `$L = {L_1 L_2 − M^2}/{L_1 + L_2 ∓ 2M}$: with the fluxes adding, <b>${u(res.Lp, 'H')}</b>; with opposing fluxes, <b>${u(res.Lpo, 'H')}</b>.${Math.abs(D) < 1e-12 * L1 * L2 ? ' With k = 1 the numerator is 0: in parallel and perfectly coupled they behave as a single coil with no extra L opposing.' : ''}` });
    }
    const I2 = lee(sc, 'I2', 'the current I₂', { opcional: true, signo: true });
    if (I1 !== null && I2 !== null && r.L1 !== undefined) {
      const s = sc.sentido === 'opuesto' ? -1 : 1;
      res.U = 0.5 * r.L1 * I1 * I1 + 0.5 * r.L2 * I2 * I2 + s * M * I1 * I2;
      pasos.push({ t: 'Energy of the two circuits', html: `$U = 1/2 L_1 I_1^2 + 1/2 L_2 I_2^2 ${s > 0 ? '+' : '−'} M I_1 I_2$ (${s > 0 ? 'adding' : 'opposing'} fluxes) = <b>${u(res.U, 'J')}</b>` });
    }
    return { G, p, res, pasos, letras: r.letras };
  }


  function elip(k) {
    let a = 1, b = Math.sqrt(1 - k * k), s = 0.5 * k * k, pw = 0.5;
    for (let i = 0; i < 40; i++) { const an = (a + b) / 2, c = (a - b) / 2; b = Math.sqrt(a * b); a = an; pw *= 2; s += pw * c * c; if (Math.abs(c) < 1e-17) break; }
    const K = Math.PI / (2 * a); return { K, E: K * (1 - s) };
  }
  function mutuaExacta(R, r, z) {
    const k2 = (4 * R * r) / ((R + r) ** 2 + z * z), k = Math.sqrt(k2), { K, E } = elip(k);
    return MU0 * Math.sqrt(R * r) * ((2 / k - k) * K - (2 / k) * E);
  }
  const dMdz = (R, r, z) => { const h = Math.max(z, R) * 1e-4, d = (a) => (mutuaExacta(R, r, z + a) - mutuaExacta(R, r, z - a)) / (2 * a); return (4 * d(h) - d(2 * h)) / 3; };
  function fuerza(sc) {
    const G = { campos: [['N1', 'Turns of the large one N<sub>1</sub>', '', 1], ['R', 'Radius of the large one R', 'cm', 1e-2], ['N2', 'Turns of the small one N<sub>2</sub>', '', 1], ['r', 'Radius of the small one r', 'cm', 1e-2], ['z', 'Distance z between the planes', 'cm', 1e-2]] };
    const p = leerGeo(G, sc), I1 = lee(sc, 'I1', 'the current I₁', { signo: true }), I2 = lee(sc, 'I2', 'the current I₂', { signo: true });
    const { N1, R, N2, r, z } = p, N = N1 * N2, k2 = (4 * R * r) / ((R + r) ** 2 + z * z), M = N * mutuaExacta(R, r, z), dM = N * dMdz(R, r, z), F = I1 * I2 * dM;
    const Md = (MU0 * N * Math.PI * R * R * r * r) / (2 * Math.pow(R * R + z * z, 1.5)), dMd = (-3 * MU0 * N * Math.PI * R * R * r * r * z) / (2 * Math.pow(R * R + z * z, 2.5)), Fd = I1 * I2 * dMd;
    const curva = (n = 200) => { const zm = 4 * Math.max(R, z); return Array.from({ length: n + 1 }, (_, i) => { const zz = 1e-3 * R + (zm * i) / n; return [zz, I1 * I2 * N * dMdz(R, r, zz)]; }); };
    let zmax = 0, Fm = 0; for (const [zz, ff] of curva(400)) if (Math.abs(ff) > Fm) { Fm = Math.abs(ff); zmax = zz; }
    const sentido = F === 0 ? 'there is no force' : F < 0 ? 'they attract' : 'they repel';
    const pasos = [
      { t: 'Energy and force', html: `The interaction energy of two circuits with fixed currents is $U = M I_1 I_2$ and the force that keeps the currents is $F = I_1 I_2 {dM}/{dz}$ (with imposed currents, the work of the sources doubles the energy change and the result is $F = +∇U$). If the currents are parallel M decreases when moving apart (dM/dz < 0) and the loops <b>attract</b>; if they are opposite, they <b>repel</b>.` },
      { t: 'Exact mutual inductance', html: `For two coaxial loops (Neumann), with $k^2 = {4Rr}/{(R + r)^2 + z^2}$ = ${f(k2)}: $M = μ_0 √(R r) [(2/k − k) K(k) − (2/k) E(k)]$ per pair of turns. With N<sub>1</sub>N<sub>2</sub> = ${f(N)} turns, $M$ = <b>${u(M, 'H')}</b>.` },
      { t: 'Derivative of M', html: `$dM/dz$ = <b>${f(dM)} H/m</b> (derivative of the exact formula).` },
      { t: 'Force', html: `$F = I_1 I_2 dM/dz = ${f(I1)} · ${f(I2)} · (${f(dM)})$ = <b>${u(F, 'N')}</b>: the loops <b>${sentido}</b>.` },
      { t: 'Comparison with the dipole', html: `If the small one is treated as a dipole $m_2 = N_2 I_2 π r^2$ in the field on the axis of the large one, $M ≈ {μ_0 π N_1 N_2 R^2 r^2}/{2(R^2 + z^2)^{3/2}}$ = ${u(Md, 'H')} and $F ≈ −{3 μ_0 π N_1 N_2 I_1 I_2 R^2 r^2 z}/{2(R^2 + z^2)^{5/2}}$ = ${u(Fd, 'N')}, ${f(Math.abs(Fd / F - 1) * 100, 3)} % ${Math.abs(Fd) >= Math.abs(F) ? 'more' : 'less'} than the exact value.` },
      { t: 'Where it is maximum', html: `In the graph the force is maximum at $z$ ≈ <b>${f(zmax * 100)} cm</b> (${u(Fm, 'N')}); for a small loop it occurs near $z = R/2$ and at large distance it falls as $1/z^4$.` },
    ];
    return { p: { ...p, I1, I2 }, res: { M, dM, F, Md, Fd, zmax, Fmax: Fm, sentido }, pasos, curva, letras: 'F = I_1 I_2 {dM}/{dz}' };
  }

  function rl(sc) {
    const E = lee(sc, 'E', 'the emf of the source'), R = lee(sc, 'R', 'the resistance'), L = lee(sc, 'L', 'the self-inductance') * 1e-3;
    const t = lee(sc, 't', 'the instant', { opcional: true, cero: true }), carga = sc.modo !== 'descarga';
    if (sc.modo === 'pulsos') return pulsos(sc, E, R, L, t);
    const tau = L / R, I0 = E / R;
    const I = (s) => (carga ? I0 * (1 - Math.exp(-s / tau)) : I0 * Math.exp(-s / tau));
    const VL = (s) => (carga ? E * Math.exp(-s / tau) : -E * Math.exp(-s / tau));
    const pasos = [
      { t: 'Circuit equation', html: carga ? `When the switch is closed: $ε = R I + L {dI}/{dt} ⇒ I(t) = ε/R (1 − e^{−t/τ})$` : `When the source is removed (the coil discharges through R): $0 = R I + L {dI}/{dt} ⇒ I(t) = I_0 e^{−t/τ}$, with $I_0 = ε/R$` },
      { t: 'Time constant', html: `$τ = L/R = ${f(L)}/${f(R)}$ = <b>${u(tau, 's')}</b>. ${carga ? 'Final current' : 'Initial current'}: ε / R = <b>${u(I0, 'A')}</b>. Energy in the coil with that current: $1/2 L I^2$ = ${u(0.5 * L * I0 * I0, 'J')}.` },
      { t: 'Characteristic times', html: `At t = τ the current ${carga ? 'reaches 63.2 %' : 'drops to 36.8 %'}; at 5τ = ${u(5 * tau, 's')} ${carga ? 'it is at 99.3 % of the final value' : '0.7 % remains'}. Time to ${carga ? 'reach half' : 'drop to half'}: $τ ln 2$ = ${u(tau * Math.LN2, 's')}.` },
    ];
    const res = { tau, I0 };
    if (t !== null) {
      const s = t * 1e-3, i = I(s);
      Object.assign(res, { It: i, VLt: VL(s), VRt: R * i, Ut: 0.5 * L * i * i });
      pasos.push({ t: `At t = ${f(t)} ms`, html: `$I = ${carga ? `${f(I0)} (1 − e^{−${f(s)}/${f(tau)}})` : `${f(I0)} e^{−${f(s)}/${f(tau)}}`}$ = <b>${u(i, 'A')}</b> · $V_R = R I$ = ${u(R * i, 'V')} · $V_L = L {dI}/{dt}$ = ${u(VL(s), 'V')} · $U = 1/2 L I^2$ = ${u(0.5 * L * i * i, 'J')}` });
      if (carga) {
        const Wf = E * I0 * (s - tau * (1 - Math.exp(-s / tau))), U = 0.5 * L * i * i;
        Object.assign(res, { Wf, WR: Wf - U });
        pasos.push({ t: 'Energy balance up to t', html: `The source has supplied $W_ε = ∫ε I dt = ε I_0 (t − τ (1 − e^{−t/τ}))$ = <b>${u(Wf, 'J')}</b>. Of it, $1/2 L I^2$ = ${u(U, 'J')} stays in the coil and the rest, $W_R = ∫R I^2 dt$ = <b>${u(Wf - U, 'J')}</b>, is dissipated in the resistance.` });
      } else {
        const WR = 0.5 * L * I0 * I0 * (1 - Math.exp((-2 * s) / tau));
        res.WR = WR;
        pasos.push({ t: 'Energy dissipated up to t', html: `$W_R = ∫_0^t R I^2 dt = 1/2 L I_0^2 (1 − e^{−2t/τ})$ = <b>${u(WR, 'J')}</b>. In the end all the energy the coil had is dissipated, $1/2 L I_0^2$ = ${u(0.5 * L * I0 * I0, 'J')}.` });
      }
    }
    return { p: { E, R, L, carga, t }, res, I, VL, tau, pasos, letras: carga ? 'I(t) = ε/R (1 − e^{−t/τ}), τ = L/R' : 'I(t) = ε/R e^{−t/τ}, τ = L/R' };
  }

  function pulsos(sc, E, R, L, t) {
    const ton = lee(sc, 'ton', 'the time switched on') * 1e-3, toff = lee(sc, 'toff', 'the time switched off') * 1e-3;
    const tau = L / R, I0 = E / R, P = ton + toff, a = Math.exp(-ton / tau), b = Math.exp(-toff / tau), A = a * b;
    const Imax = (I0 * (1 - a)) / (1 - A), Imin = Imax * b, Imed = (I0 * ton) / P;
    const inicio = (k) => Imin * (1 - Math.pow(A, k));
    const I = (s) => { const k = Math.floor(s / P), x = s - k * P, i0 = inicio(k); if (x < ton) return I0 + (i0 - I0) * Math.exp(-x / tau); return (I0 + (i0 - I0) * a) * Math.exp(-(x - ton) / tau); };
    const VL = (s) => { const x = s - Math.floor(s / P) * P; return x < ton ? E - R * I(s) : -R * I(s); };
    const pasos = [
      { t: 'Each stage', html: `While on, I tends to ε/R = ${u(I0, 'A')} with $τ = L/R$ = <b>${u(tau, 's')}</b>: $I = ε/R + (I_start − ε/R) e^{−t/τ}$. When the source is removed, the coil discharges through R: $I = I_end e^{−t/τ}$. Each stage starts with the current the previous one ended with, because the current in a coil cannot jump.` },
      { t: 'Steady state', html: `After a few cycles, the current always rises and falls between the same values. Requiring a cycle to end as it starts: $I_max = ε/R {1 − e^{−t_on/τ}}/{1 − e^{−T/τ}}$ = <b>${u(Imax, 'A')}</b> and $I_min = I_max e^{−t_off/τ}$ = <b>${u(Imin, 'A')}</b>, with T = ${u(P, 's')}.` },
      { t: 'Mean current', html: `Over a cycle the mean voltage across the coil is 0, so $R I_mean = ε t_on/T$: I<sub>mean</sub> = <b>${u(Imed, 'A')}</b> (${f((100 * ton) / P, 3)} % of the time switched on). This is the idea of PWM regulation. The ripple is $I_max − I_min$ = ${u(Imax - Imin, 'A')}${tau > 3 * P ? ', small because τ is much greater than the period' : ''}.` },
    ];
    const res = { tau, I0, Imax, Imin, Imed };
    if (t !== null) { const s = t * 1e-3, i = I(s); Object.assign(res, { It: i, VLt: VL(s), VRt: R * i, Ut: 0.5 * L * i * i }); pasos.push({ t: `At t = ${f(t)} ms`, html: `It is in cycle ${Math.floor(s / P) + 1}, ${s - Math.floor(s / P) * P < ton ? 'on' : 'off'}: I = <b>${u(i, 'A')}</b>, V<sub>L</sub> = ${u(VL(s), 'V')} and $U = 1/2 L I^2$ = ${u(0.5 * L * i * i, 'J')}.` }); }
    return { p: { E, R, L, carga: true, pulsos: true, ton, toff, t }, res, I, VL, tau, pasos, letras: 'I_media = {ε t_on}/{R T}' };
  }

  const cx = { s: (a, b) => [a[0] + b[0], a[1] + b[1]], m: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], d: (a, b) => { const q = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / q, (a[1] * b[0] - a[0] * b[1]) / q]; }, abs: (a) => Math.hypot(a[0], a[1]), fase: (a) => (Math.atan2(a[1], a[0]) * 180) / Math.PI };
  function trafoPunto(p, RL) {
    const w = 2 * Math.PI * p.fr, Z1 = [p.R1, w * p.L1], Z2 = [p.R2 + RL, w * p.L2], X = w * p.M;
    const Zin = cx.s(Z1, cx.d([X * X, 0], Z2)), I1 = cx.d([p.V1, 0], Zin), I2 = cx.d(cx.m([0, X], I1), Z2), V2 = [RL * I2[0], RL * I2[1]];
    const Pin = p.V1 * I1[0], Pout = RL * (I2[0] ** 2 + I2[1] ** 2);
    return { Zin, I1, I2, V2, Pin, Pout, eta: Pin > 0 ? Pout / Pin : 0 };
  }
  function transformador(sc) {
    const N1 = lee(sc, 'N1', 'the primary turns'), N2 = lee(sc, 'N2', 'the secondary turns'), L1 = lee(sc, 'L1', 'the self-inductance of the primary') * 1e-3;
    const k = lee(sc, 'k', 'the coupling coefficient'), V1 = lee(sc, 'V1', 'the primary voltage'), fr = lee(sc, 'fr', 'the frequency');
    const R1 = lee(sc, 'R1', 'the primary resistance', { cero: true }), R2 = lee(sc, 'R2', 'the secondary resistance', { cero: true }), RL = lee(sc, 'RL', 'the load resistance');
    if (k > 1) throw new Error('The coupling coefficient k cannot be greater than 1');
    const n = N2 / N1, L2 = L1 * n * n, M = k * Math.sqrt(L1 * L2), w = 2 * Math.PI * fr;
    const p = { N1, N2, L1, L2, M, k, V1, fr, R1, R2, RL }, r = trafoPunto(p, RL);
    const V1c = [V1, 0], vacio0 = cx.abs(cx.d([w * M * V1, 0], [R1, w * L1])), Vid = V1 * n, V2m = cx.abs(r.V2);
    const reg = (vacio0 - V2m) / vacio0, Pcu1 = R1 * cx.abs(r.I1) ** 2, Pcu2 = R2 * cx.abs(r.I2) ** 2, fp = r.Pin / (V1 * cx.abs(r.I1));
    const pasos = [
      { t: 'Inductances and coupling', html: `With the same geometry $L ∝ N^2$, so $L_2 = L_1 (N_2/N_1)^2$ = ${u(L2, 'H')} and $M = k √(L_1 L_2)$ = <b>${u(M, 'H')}</b>. Leakage flux: ${f(100 * (1 - k), 3)} % of the flux of each coil does not reach the other (L<sub>σ1</sub> = (1 − k) L<sub>1</sub> = ${u((1 - k) * L1, 'H')}).` },
      { t: 'Phasor equations (ω = 2πf = ' + f(w) + ' rad/s)', html: `Primary: $V_1 = (R_1 + jωL_1) I_1 − jωM I_2$. Secondary, with the load: $jωM I_1 = (R_2 + R_L + jωL_2) I_2$ and $V_2 = R_L I_2$.` },
      { t: 'Impedance seen from the primary', html: `$Z_e = R_1 + jωL_1 + {ω^2 M^2}/{R_2 + R_L + jωL_2}$ = ${f(r.Zin[0])} ${r.Zin[1] < 0 ? '−' : '+'} j ${f(Math.abs(r.Zin[1]))} Ω (|Z<sub>e</sub>| = ${f(cx.abs(r.Zin))} Ω, ${f(cx.fase(r.Zin), 3)}°). $I_1 = V_1/Z_e$ = <b>${u(cx.abs(r.I1), 'A')}</b>.` },
      { t: 'Secondary', html: `$I_2 = {jωM I_1}/{R_2 + R_L + jωL_2}$ = <b>${u(cx.abs(r.I2), 'A')}</b> and $V_2 = R_L I_2$ = <b>${u(V2m, 'V')}</b>, with phase ${f(cx.fase(r.V2) - 0, 4)}° relative to V<sub>1</sub>. Real ratio $V_2/V_1$ = ${f(V2m / V1)} versus the ideal $N_2/N_1$ = ${f(n)} (ideal V<sub>2</sub> = ${u(Vid, 'V')}).` },
      { t: 'Regulation', html: `On no load ($R_L → ∞$) the secondary gives $V_{20} = {ωM V_1}/{|R_1 + jωL_1|}$ = ${u(vacio0, 'V')}. Regulation $= (V_{20} − V_2)/V_{20}$ = <b>${f(100 * reg, 3)} %</b>: how much the voltage drops when the load is connected.` },
      { t: 'Powers and efficiency', html: `$P_1 = V_1 |I_1| cos φ$ = ${u(r.Pin, 'W')} (cos φ = ${f(fp)}); $P_2 = R_L |I_2|^2$ = ${u(r.Pout, 'W')}. Copper losses: ${u(Pcu1, 'W')} in the primary and ${u(Pcu2, 'W')} in the secondary. Efficiency $η = P_2/P_1$ = <b>${f(100 * r.eta, 4)} %</b>.` },
    ];
    const curva = () => { const pts = []; for (let i = 0; i <= 120; i++) { const RLx = RL * Math.pow(10, -1.5 + (3 * i) / 120), q = trafoPunto(p, RLx); pts.push([RLx, cx.abs(q.V2) / vacio0, q.eta]); } return pts; };
    const res = { M, L2, n, I1: cx.abs(r.I1), I2: cx.abs(r.I2), V2: V2m, Vid, relacion: V2m / V1, V20: vacio0, reg, eta: r.eta, Pin: r.Pin, Pout: r.Pout, Pcu1, Pcu2, fp, Zin: cx.abs(r.Zin) };
    return { p, res, pasos, curva, letras: 'η = {R_L |I_2|^2}/{V_1 |I_1| cos φ}' };
  }

  const ejemplos = {
    L: [
      { clave: 'solenoide', nombre: '500-turn solenoid', sc: { geo: 'solenoide', N: '500', l: '20', r: '1', mur: '1', I: '2', dIdt: '100' } },
      { clave: 'solenoide-hierro', nombre: 'Solenoid with core (μr = 800)', sc: { geo: 'solenoide', N: '300', l: '15', r: '1.5', mur: '800', I: '0.5' } },
      { clave: 'toroide-rect', nombre: 'Toroid of rectangular cross-section', sc: { geo: 'toroide-rect', N: '1000', a: '5', b: '8', h: '2', mur: '1', I: '1' } },
      { clave: 'toroide-circ', nombre: 'Toroid of circular cross-section', sc: { geo: 'toroide-circ', N: '200', R: '10', r: '2', mur: '1' } },
      { clave: 'coaxial', nombre: 'Coaxial cable, solid inner conductor', sc: { geo: 'coaxial', l: '1', a: '1', b: '4', interior: 'macizo' } },
      { clave: 'entrehierro', nombre: 'Iron toroid with air gap', sc: { geo: 'entrehierro', N: '500', R: '10', S: '4', mur: '2000', g: '2', I: '1' } },
      { clave: 'bifilar', nombre: 'Twin-wire line', sc: { geo: 'bifilar', l: '1', d: '10', a: '1', interior: 'hueco' } },
    ],
    M: [
      { clave: 'solenoides', nombre: 'Solenoid inside another', sc: { geo: 'solenoides', N1: '200', r1: '1', N2: '1000', r2: '2', l: '40', dI1dt: '50' } },
      { clave: 'espiras', nombre: 'Small loop at the centre of a large one', sc: { geo: 'espiras', N1: '1', R: '20', N2: '10', r: '1', dI1dt: '1000' } },
      { clave: 'espiras-coaxiales', nombre: 'Two coaxial loops at a distance', sc: { geo: 'espiras-coaxiales', N1: '100', R: '10', N2: '20', r: '1', z: '10', dI1dt: '50' } },
      { clave: 'espira-solenoide', nombre: 'Coil rotated inside a solenoid', sc: { geo: 'espira-solenoide', N1: '1000', l: '50', N2: '30', r: '1', th: '60', dI1dt: '100' } },
      { clave: 'hilo-espira', nombre: 'Wire and rectangular loop', sc: { geo: 'hilo-espira', d: '5', w: '10', h: '20', N2: '1', dI1dt: '200' } },
      { clave: 'toroide-bobina', nombre: 'Coil on a toroid (k = 1)', sc: { geo: 'toroide-bobina', N1: '500', N2: '50', a: '4', b: '6', h: '2', I1: '2', I2: '1', sentido: 'aditivo' } },
      { clave: 'acoplamiento', nombre: 'Coupled coils in series and in parallel', sc: { geo: 'acoplamiento', L1: '2', L2: '8', k: '0.5' } },
    ],
    F: [
      { clave: 'f-atraen', nombre: 'Two loops with parallel currents: they attract', sc: { N1: '1', R: '10', N2: '1', r: '5', z: '5', I1: '100', I2: '50' } },
      { clave: 'f-repelen', nombre: 'Opposite currents: they repel (levitating ring)', sc: { N1: '200', R: '10', N2: '1', r: '5', z: '3', I1: '10', I2: '-300' } },
      { clave: 'f-lejos', nombre: 'Small loop far away: dipole limit', sc: { N1: '100', R: '10', N2: '20', r: '1', z: '40', I1: '2', I2: '1' } },
    ],
    T: [
      { clave: 't-red', nombre: 'Mains transformer 230 V → 23 V', sc: { N1: '1000', N2: '100', L1: '10000', k: '0.98', V1: '230', fr: '50', R1: '2', R2: '0.02', RL: '5' } },
      { clave: 't-flojo', nombre: 'Loose coupling (k = 0.6), like a wireless charger', sc: { N1: '20', N2: '20', L1: '0.024', k: '0.6', V1: '5', fr: '100000', R1: '0.5', R2: '0.5', RL: '10' } },
      { clave: 't-vacio', nombre: 'Almost no load: regulation and efficiency', sc: { N1: '500', N2: '1500', L1: '4000', k: '0.99', V1: '100', fr: '50', R1: '1', R2: '9', RL: '5000' } },
    ],
    RL: [
      { clave: 'carga', nombre: 'The switch is closed', sc: { E: '12', R: '6', L: '300', modo: 'carga', t: '50' } },
      { clave: 'descarga', nombre: 'The coil discharges through the resistance', sc: { E: '10', R: '100', L: '500', modo: 'descarga', t: '2' } },
      { clave: 'pulsos', nombre: 'Switched on and off again and again', sc: { E: '12', R: '10', L: '50', modo: 'pulsos', ton: '5', toff: '5', t: '' } },
    ],
  };

  return { autoinduccion, mutua, rl, fuerza, transformador, mutuaExacta, elip, GEO_L, GEO_M, ejemplos, f, u, MU0 };
})();

