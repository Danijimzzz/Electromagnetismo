const Induccion = (() => {
  const MU0 = 4e-7 * Math.PI;
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const PREF = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p']];
  const u = (x, unidad, d = 4) => {
    if (!isFinite(x) || x === 0) return `${f(x, d)} ${unidad}`;
    const a = Math.abs(x), p = PREF.find(([v]) => a >= v * 0.9999999) || PREF[PREF.length - 1];
    return `${String(+(x / p[0]).toPrecision(d)).replace('.', ',').replace('-', '−')} ${p[1]}${unidad}`;
  };
  const leeNum0 = (s) => +String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const lee = (sc, k, nom, { opcional = false, cero = false, signo = false } = {}) => {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} manquant`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} doit être un nombre`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} doit être ${cero ? 'positif ou nul' : 'supérieur à 0'}`);
    return v;
  };

  const GEO_L = {
    solenoide: {
      nombre: 'Solénoïde long', campos: [['N', 'Nombre de spires N', '', 1], ['l', 'Longueur l', 'cm', 1e-2], ['r', 'Rayon r', 'cm', 1e-2], ['mur', 'Perméabilité relative μ<sub>r</sub>', '', 1]],
      calc: ({ N, l, r, mur }) => {
        const S = Math.PI * r * r, L = (MU0 * mur * N * N * S) / l;
        return { L, pasos: [
          { t: 'Champ à l\'intérieur du solénoïde (Ampère)', html: `$B = {μ_0 μ_r N I}/l$, uniforme à l'intérieur et nul à l'extérieur (si l ≫ r).` },
          { t: 'Flux propre', html: `$Φ = N B S = {μ_0 μ_r N^2 S I}/l$, avec $S = π r^2$ = ${f(S)} m<sup>2</sup>.` },
          { t: 'Coefficient d\'auto-inductance', html: `$L = Φ/I = {μ_0 μ_r N^2 π r^2}/l = {4π·10^{−7} · ${f(mur)} · ${f(N)}^2 · ${f(S)}}/{${f(l)}}$ = <b>${u(L, 'H')}</b>` },
        ], B1: (MU0 * mur * N) / l, letras: 'L = {μ_0 μ_r N^2 π r^2}/l' };
      },
    },
    'toroide-rect': {
      nombre: 'Tore de section rectangulaire', campos: [['N', 'Nombre de spires N', '', 1], ['a', 'Rayon intérieur a', 'cm', 1e-2], ['b', 'Rayon extérieur b', 'cm', 1e-2], ['h', 'Hauteur h', 'cm', 1e-2], ['mur', 'Perméabilité relative μ<sub>r</sub>', '', 1]],
      valida: ({ a, b }) => { if (b <= a) throw new Error('Le rayon extérieur doit être supérieur au rayon intérieur'); },
      calc: ({ N, a, b, h, mur }) => {
        const L = (MU0 * mur * N * N * h * Math.log(b / a)) / (2 * Math.PI);
        return { L, pasos: [
          { t: 'Champ à l\'intérieur du tore (Ampère)', html: `$B(r) = {μ_0 μ_r N I}/{2π r}$, pour a < r < b.` },
          { t: 'Flux par une spire', html: `$Φ_1 = ∫_a^b B h dr = {μ_0 μ_r N I h ln(b/a)}/{2π}$, avec ln(b/a) = ln(${f(b / a)}) = ${f(Math.log(b / a))}.` },
          { t: 'Coefficient d\'auto-inductance', html: `$L = {N Φ_1}/I = {μ_0 μ_r N^2 h ln(b/a)}/{2π} = 2·10^{−7} · ${f(mur)} · ${f(N)}^2 · ${f(h)} · ${f(Math.log(b / a))}$ = <b>${u(L, 'H')}</b>` },
        ], letras: 'L = {μ_0 μ_r N^2 h}/{2π} ln(b/a)' };
      },
    },
    'toroide-circ': {
      nombre: 'Tore de section circulaire', campos: [['N', 'Nombre de spires N', '', 1], ['R', 'Rayon moyen R', 'cm', 1e-2], ['r', 'Rayon de la section r', 'cm', 1e-2], ['mur', 'Perméabilité relative μ<sub>r</sub>', '', 1]],
      valida: ({ R, r }) => { if (r >= R) throw new Error('Le rayon de la section doit être inférieur au rayon moyen'); },
      calc: ({ N, R, r, mur }) => {
        const L = MU0 * mur * N * N * (R - Math.sqrt(R * R - r * r)), La = (MU0 * mur * N * N * r * r) / (2 * R);
        return { L, pasos: [
          { t: 'Champ à l\'intérieur du tore (Ampère)', html: `$B(ρ) = {μ_0 μ_r N I}/{2π ρ}$, à une distance ρ de l'axe.` },
          { t: 'Coefficient d\'auto-inductance', html: `En intégrant le flux sur la section circulaire : $L = μ_0 μ_r N^2 (R − √(R^2 − r^2))$ = <b>${u(L, 'H')}</b>` },
          { t: 'Approximation du tore fin', html: `Si r ≪ R, B est presque uniforme et $L ≈ {μ_0 μ_r N^2 π r^2}/{2π R}$ = ${u(La, 'H')} (écart de ${f(100 * Math.abs(La / L - 1), 2)} %).` },
        ], letras: 'L = μ_0 μ_r N^2 (R − √(R^2 − r^2))' };
      },
    },
    entrehierro: {
      nombre: 'Tore avec entrefer', campos: [['N', 'Nombre de spires N', '', 1], ['R', 'Rayon moyen R', 'cm', 1e-2], ['S', 'Section S', 'cm²', 1e-4], ['mur', 'Perméabilité relative du noyau μ<sub>r</sub>', '', 1], ['g', 'Entrefer g', 'mm', 1e-3]],
      valida: ({ R, g }) => { if (g >= 2 * Math.PI * R) throw new Error('L\'entrefer ne peut pas être plus long que le tore'); },
      calc: ({ N, R, S, mur, g }) => {
        const lc = 2 * Math.PI * R - g, Rn = lc / (MU0 * mur * S), Rg = g / (MU0 * S), Rt = Rn + Rg, L = (N * N) / Rt, L0 = (MU0 * mur * N * N * S) / (2 * Math.PI * R);
        return { L, pasos: [
          { t: 'Loi d\'Ampère', html: `Le long de la ligne moyenne du tore : $H_n l_n + H_g g = N I$, avec $l_n = 2πR − g$ = ${f(lc)} m de noyau. Sans fuites, B est le même dans le noyau et dans l'entrefer : $H_n = B/(μ_0 μ_r)$ et $H_g = B/μ_0$, donc $B = {μ_0 N I}/{l_n/μ_r + g}$.` },
          { t: 'Réluctances', html: `Comme dans un circuit en série : $ℛ_n = {l_n}/{μ_0 μ_r S}$ = ${f(Rn)} A/Wb et $ℛ_g = g/(μ_0 S)$ = ${f(Rg)} A/Wb. Total ℛ = <b>${f(Rt)} A/Wb</b>${Rg > Rn ? `: l'entrefer d'air, bien qu'il ne mesure que ${f(g * 1000)} mm, pèse plus que tout le noyau` : ''}.` },
          { t: 'Coefficient d\'auto-inductance', html: `Φ = N I/ℛ par spire, et $L = {N Φ}/I = N^2/ℛ = ${f(N)}^2/{${f(Rt)}}$ = <b>${u(L, 'H')}</b>. Sans entrefer, ce serait $ {μ_0 μ_r N^2 S}/{2π R}$ = ${u(L0, 'H')}, soit ${f(L0 / L, 3)} fois plus.` },
        ], B1: N / (Rt * S), letras: 'L = {μ_0 N^2 S}/{(2π R − g)/μ_r + g}' };
      },
    },
    coaxial: {
      nombre: 'Câble coaxial', campos: [['l', 'Longueur l', 'm', 1], ['a', 'Rayon du conducteur intérieur a', 'mm', 1e-3], ['b', 'Rayon du conducteur extérieur b', 'mm', 1e-3]], interior: true,
      valida: ({ a, b }) => { if (b <= a) throw new Error('Le rayon extérieur doit être supérieur au rayon intérieur'); },
      calc: ({ l, a, b, macizo }) => {
        const Le = (MU0 * l * Math.log(b / a)) / (2 * Math.PI), Li = macizo ? (MU0 * l) / (8 * Math.PI) : 0, L = Le + Li;
        const pasos = [
          { t: 'Champ entre les conducteurs (Ampère)', html: `$B(r) = {μ_0 I}/{2π r}$, pour a < r < b ; à l'extérieur du câble B = 0.` },
          { t: 'Partie externe', html: `$Φ = ∫_a^b B l dr = {μ_0 I l ln(b/a)}/{2π}$ ⇒ $L_ext = {μ_0 l ln(b/a)}/{2π} = 2·10^{−7} · ${f(l)} · ln(${f(b / a)})$ = <b>${u(Le, 'H')}</b>` },
        ];
        if (macizo) pasos.push({ t: 'Partie interne (conducteur plein)', html: `Dans le conducteur, $B = {μ_0 I r}/{2π a^2}$. Par l'énergie, $1/2 L_int I^2 = ∫ B^2/(2μ_0) dV$ ⇒ $L_int = {μ_0 l}/{8π}$ = ${u(Li, 'H')}. Total : L = <b>${u(L, 'H')}</b>` });
        pasos.push({ t: 'Par unité de longueur', html: `$L/l$ = <b>${u(L / l, 'H/m')}</b>` });
        return { L, pasos, letras: macizo ? 'L = {μ_0 l}/{2π} (ln(b/a) + 1/4)' : 'L = {μ_0 l}/{2π} ln(b/a)' };
      },
    },
    bifilar: {
      nombre: 'Ligne bifilaire', campos: [['l', 'Longueur l', 'm', 1], ['d', 'Distance entre axes d', 'mm', 1e-3], ['a', 'Rayon de chaque fil a', 'mm', 1e-3]], interior: true,
      valida: ({ d, a }) => { if (d <= 2 * a) throw new Error('Les fils se touchent : la distance entre axes doit être supérieure à 2a'); },
      calc: ({ l, d, a, macizo }) => {
        const Le = (MU0 * l * Math.log((d - a) / a)) / Math.PI, Li = macizo ? (MU0 * l) / (4 * Math.PI) : 0, L = Le + Li;
        const pasos = [
          { t: 'Champ entre les fils', html: `Chaque fil crée $B = {μ_0 I}/{2π r}$ et, entre eux, les deux champs s'ajoutent : $B(x) = {μ_0 I}/{2π} (1/x + 1/(d − x))$.` },
          { t: 'Flux entre les fils', html: `$Φ = ∫_a^{d−a} B l dx = {μ_0 I l}/π ln({d − a}/a)$ ⇒ $L_ext = {μ_0 l}/π ln({d − a}/a) = 4·10^{−7} · ${f(l)} · ln(${f((d - a) / a)})$ = <b>${u(Le, 'H')}</b>${d > 20 * a ? ` ($≈ {μ_0 l}/π ln(d/a)$, car d ≫ a)` : ''}` },
        ];
        if (macizo) pasos.push({ t: 'Partie interne (fils pleins)', html: `Chaque fil apporte $ {μ_0 l}/{8π}$ : $L_int = {μ_0 l}/{4π}$ = ${u(Li, 'H')}. Total : L = <b>${u(L, 'H')}</b>` });
        pasos.push({ t: 'Par unité de longueur', html: `$L/l$ = <b>${u(L / l, 'H/m')}</b>` });
        return { L, pasos, letras: macizo ? 'L = {μ_0 l}/π (ln({d − a}/a) + 1/4)' : 'L = {μ_0 l}/π ln({d − a}/a)' };
      },
    },
  };

  const GEO_M = {
    solenoides: {
      nombre: 'Deux solénoïdes coaxiaux', campos: [['N1', 'Spires de l\'intérieur N<sub>1</sub>', '', 1], ['r1', 'Rayon de l\'intérieur r<sub>1</sub>', 'cm', 1e-2], ['N2', 'Spires de l\'extérieur N<sub>2</sub>', '', 1], ['r2', 'Rayon de l\'extérieur r<sub>2</sub>', 'cm', 1e-2], ['l', 'Longueur commune l', 'cm', 1e-2]],
      valida: ({ r1, r2 }) => { if (r1 > r2) throw new Error('Le solénoïde intérieur ne peut pas être plus large que l\'extérieur'); },
      calc: ({ N1, r1, N2, r2, l }) => {
        const S1 = Math.PI * r1 * r1, M = (MU0 * N1 * N2 * S1) / l, L1 = (MU0 * N1 * N1 * S1) / l, L2 = (MU0 * N2 * N2 * Math.PI * r2 * r2) / l;
        return { M, L1, L2, pasos: [
          { t: 'Champ de l\'extérieur', html: `Avec un courant I<sub>2</sub> dans l'extérieur, $B_2 = {μ_0 N_2 I_2}/l$ à l'intérieur de celui-ci, y compris à l'intérieur du solénoïde intérieur.` },
          { t: 'Flux dans l\'intérieur', html: `$Φ_12 = N_1 B_2 π r_1^2 = {μ_0 N_1 N_2 π r_1^2 I_2}/l$ (seule compte la section de l'intérieur).` },
          { t: 'Coefficient d\'inductance mutuelle', html: `$M = {Φ_12}/{I_2} = {μ_0 N_1 N_2 π r_1^2}/l = {4π·10^{−7} · ${f(N1)} · ${f(N2)} · ${f(S1)}}/{${f(l)}}$ = <b>${u(M, 'H')}</b>. On obtient la même chose en calculant le flux de l'intérieur dans l'extérieur ($M_12 = M_21$).` },
          { t: 'Coefficient de couplage', html: `$L_1 = {μ_0 N_1^2 π r_1^2}/l$ = ${u(L1, 'H')}, $L_2 = {μ_0 N_2^2 π r_2^2}/l$ = ${u(L2, 'H')} ⇒ $k = M/√(L_1 L_2) = {r_1}/{r_2}$ = <b>${f(M / Math.sqrt(L1 * L2))}</b>` },
        ], letras: 'M = {μ_0 N_1 N_2 π r_1^2}/l' };
      },
    },
    espiras: {
      nombre: 'Petite spire au centre d\'une grande', campos: [['N1', 'Spires de la grande N<sub>1</sub>', '', 1], ['R', 'Rayon de la grande R', 'cm', 1e-2], ['N2', 'Spires de la petite N<sub>2</sub>', '', 1], ['r', 'Rayon de la petite r', 'cm', 1e-2]],
      valida: ({ R, r }) => { if (r >= R) throw new Error('La petite spire doit avoir un rayon inférieur à celui de la grande'); },
      calc: ({ N1, R, N2, r }) => {
        const M = (MU0 * N1 * N2 * Math.PI * r * r) / (2 * R);
        return { M, pasos: [
          { t: 'Champ au centre de la grande', html: `$B_1 = {μ_0 N_1 I_1}/{2R}$ (Biot-Savart au centre de la spire).` },
          { t: 'Flux dans la petite', html: `Si r ≪ R, le champ est presque uniforme sur la petite spire : $Φ_21 = N_2 B_1 π r^2$.` },
          { t: 'Coefficient d\'inductance mutuelle', html: `$M = {Φ_21}/{I_1} = {μ_0 N_1 N_2 π r^2}/{2R}$ = <b>${u(M, 'H')}</b>${r > 0.2 * R ? '. Ojo: r no es mucho menor que R, así que es una aproximación gruesa.' : ''}` },
        ], letras: 'M = {μ_0 N_1 N_2 π r^2}/{2R}' };
      },
    },
    'espiras-coaxiales': {
      nombre: 'Deux spires coaxiales séparées', campos: [['N1', 'Spires de la grande N<sub>1</sub>', '', 1], ['R', 'Rayon de la grande R', 'cm', 1e-2], ['N2', 'Spires de la petite N<sub>2</sub>', '', 1], ['r', 'Rayon de la petite r', 'cm', 1e-2], ['z', 'Distance entre les centres z', 'cm', 1e-2]],
      valida: ({ R, r }) => { if (r > R) throw new Error('Prenez pour spire 1 celle de plus grand rayon'); },
      calc: ({ N1, R, N2, r, z }) => {
        const D = Math.pow(R * R + z * z, 1.5), M = (MU0 * N1 * N2 * Math.PI * R * R * r * r) / (2 * D);
        return { M, pasos: [
          { t: 'Champ de la grande sur son axe', html: `$B_1(z) = {μ_0 N_1 I_1 R^2}/{2 (R^2 + z^2)^{3/2}}$ (Biot-Savart), avec $(R^2 + z^2)^{3/2}$ = ${f(D)} m<sup>3</sup>.` },
          { t: 'Flux dans la petite', html: `Si la petite est petite devant la distance aux fils de la grande, B<sub>1</sub> est presque uniforme sur elle : $Φ_21 = N_2 B_1 π r^2$.` },
          { t: 'Coefficient d\'inductance mutuelle', html: `$M = {μ_0 π N_1 N_2 R^2 r^2}/{2 (R^2 + z^2)^{3/2}}$ = <b>${u(M, 'H')}</b>. Avec z ≫ R, elle décroît en 1/z<sup>3</sup>, comme le champ d'un dipôle.${r > 0.3 * Math.sqrt(R * R + z * z) ? ' Attention : r est du même ordre que √(R² + z²), donc approximation grossière.' : ''}` },
        ], letras: 'M = {μ_0 π N_1 N_2 R^2 r^2}/{2 (R^2 + z^2)^{3/2}}' };
      },
    },
    'espira-solenoide': {
      nombre: 'Spire ou bobine à l\'intérieur d\'un solénoïde', campos: [['N1', 'Spires du solénoïde N<sub>1</sub>', '', 1], ['l', 'Longueur du solénoïde l', 'cm', 1e-2], ['N2', 'Spires de la bobine N<sub>2</sub>', '', 1], ['r', 'Rayon de la bobine r', 'cm', 1e-2], ['th', 'Angle entre les axes θ', '°', 1]],
      valida: ({ th }) => { if (th > 180) throw new Error('L\'angle entre les axes doit être compris entre 0° et 180°'); },
      calc: ({ N1, l, N2, r, th }) => {
        const c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180), M = (MU0 * N1 * N2 * Math.PI * r * r * c) / l;
        return { M, pasos: [
          { t: 'Champ du solénoïde', html: `$B_1 = {μ_0 N_1 I_1}/l$, uniforme à l'intérieur (la bobine doit tenir à l'intérieur et loin des extrémités).` },
          { t: 'Flux dans la bobine', html: `$Φ_21 = N_2 B_1 π r^2 cos θ$ : seule compte la composante de B perpendiculaire à la bobine.` },
          { t: 'Coefficient d\'inductance mutuelle', html: `$M = {μ_0 N_1 N_2 π r^2 cos θ}/l = {4π·10^{−7} · ${f(N1)} · ${f(N2)} · π·${f(r)}^2${th ? ` · cos ${f(th)}°` : ''}}/{${f(l)}}$ = <b>${u(M, 'H')}</b>${c === 0 ? ' : avec les axes perpendiculaires, aucun couplage' : ''}. En faisant tourner la bobine, M varie comme cos θ (c'est ainsi que fonctionne un générateur).` },
        ], letras: 'M = {μ_0 N_1 N_2 π r^2 cos θ}/l' };
      },
    },
    'hilo-espira': {
      nombre: 'Fil droit et spire rectangulaire coplanaire', campos: [['d', 'Distance du fil au côté proche d', 'cm', 1e-2], ['w', 'Largeur de la spire w', 'cm', 1e-2], ['h', 'Côté parallèle au fil h', 'cm', 1e-2], ['N2', 'Spires de la spire N', '', 1]],
      calc: ({ d, w, h, N2 }) => {
        const M = (MU0 * N2 * h * Math.log((d + w) / d)) / (2 * Math.PI);
        return { M, pasos: [
          { t: 'Champ du fil', html: `$B(x) = {μ_0 I}/{2π x}$, perpendiculaire au plan de la spire.` },
          { t: 'Flux dans la spire', html: `$Φ = N ∫_d^{d+w} {μ_0 I h}/{2π x} dx = {μ_0 N I h}/{2π} ln({d + w}/d)$, avec ln(${f((d + w) / d)}) = ${f(Math.log((d + w) / d))}.` },
          { t: 'Coefficient d\'inductance mutuelle', html: `$M = Φ/I = {μ_0 N h}/{2π} ln({d + w}/d) = 2·10^{−7} · ${f(N2)} · ${f(h)} · ${f(Math.log((d + w) / d))}$ = <b>${u(M, 'H')}</b>` },
        ], letras: 'M = {μ_0 N h}/{2π} ln({d + w}/d)' };
      },
    },
    'toroide-bobina': {
      nombre: 'Bobine enroulée sur un tore', campos: [['N1', 'Spires du tore N<sub>1</sub>', '', 1], ['N2', 'Spires de la bobine N<sub>2</sub>', '', 1], ['a', 'Rayon intérieur a', 'cm', 1e-2], ['b', 'Rayon extérieur b', 'cm', 1e-2], ['h', 'Hauteur h', 'cm', 1e-2]],
      valida: ({ a, b }) => { if (b <= a) throw new Error('Le rayon extérieur doit être supérieur au rayon intérieur'); },
      calc: ({ N1, N2, a, b, h }) => {
        const M = (MU0 * N1 * N2 * h * Math.log(b / a)) / (2 * Math.PI), L1 = (MU0 * N1 * N1 * h * Math.log(b / a)) / (2 * Math.PI), L2 = (MU0 * N2 * N2 * h * Math.log(b / a)) / (2 * Math.PI);
        return { M, L1, L2, pasos: [
          { t: 'Champ du tore', html: `$B(r) = {μ_0 N_1 I_1}/{2π r}$ à l'intérieur du noyau.` },
          { t: 'Flux dans la bobine', html: `La bobine entoure tout le noyau : $Φ_21 = N_2 {μ_0 N_1 I_1 h}/{2π} ln(b/a)$.` },
          { t: 'Coefficient d\'inductance mutuelle', html: `$M = {μ_0 N_1 N_2 h}/{2π} ln(b/a)$ = <b>${u(M, 'H')}</b>. Les deux bobines partagent tout le flux, donc $k = M/√(L_1 L_2)$ = <b>1</b> (L<sub>1</sub> = ${u(L1, 'H')}, L<sub>2</sub> = ${u(L2, 'H')}).` },
        ], letras: 'M = {μ_0 N_1 N_2 h}/{2π} ln(b/a)' };
      },
    },
    acoplamiento: {
      nombre: 'À partir de L₁, L₂ et k', campos: [['L1', 'L<sub>1</sub>', 'mH', 1e-3], ['L2', 'L<sub>2</sub>', 'mH', 1e-3], ['k', 'Coefficient de couplage k', '', 1]],
      valida: ({ k }) => { if (k > 1) throw new Error('Le coefficient de couplage ne peut pas être supérieur à 1'); },
      calc: ({ L1, L2, k }) => {
        const M = k * Math.sqrt(L1 * L2);
        return { M, L1, L2, pasos: [{ t: 'Coefficient d\'inductance mutuelle', html: `$M = k √(L_1 L_2) = ${f(k)} · √(${f(L1)} · ${f(L2)})$ = <b>${u(M, 'H')}</b>` }], letras: 'M = k √(L_1 L_2)' };
      },
    },
  };

  function leerGeo(G, sc) {
    const p = {};
    for (const [k, nom, un, fac] of G.campos) {
      const n = nom.replace(/<[^>]+>/g, '');
      p[k] = lee(sc, k, n.toLowerCase(), { cero: k === 'th' }) * fac;
      if ((k === 'N' || k === 'N1' || k === 'N2') && !Number.isInteger(p[k])) throw new Error(`${n} doit être un nombre entier`);
    }
    if (G.interior) p.macizo = sc.interior === 'macizo';
    if (G.valida) G.valida(p);
    return p;
  }

  function autoinduccion(sc) {
    const G = GEO_L[sc.geo] || GEO_L.solenoide, p = leerGeo(G, sc);
    const r = G.calc(p), { L } = r, pasos = [...r.pasos], res = { L };
    const I = lee(sc, 'I', 'la intensidad', { opcional: true, signo: true }), dI = lee(sc, 'dIdt', 'dI/dt', { opcional: true, signo: true });
    if (I !== null) {
      res.flujo = L * I; res.U = 0.5 * L * I * I;
      pasos.push({ t: `Avec I = ${f(I)} A`, html: `Flux propre $Φ = L I$ = <b>${u(res.flujo, 'Wb')}</b> · énergie magnétique $U = 1/2 L I^2 = 1/2 · ${f(L)} · ${f(I)}^2$ = <b>${u(res.U, 'J')}</b>${r.B1 ? `<br>Champ ${sc.geo === 'entrehierro' ? 'dans le noyau et dans cet entrefer' : 'dedans'} : ${sc.geo === 'entrehierro' ? '$B = {N I}/{ℛ S}$' : '$B = {μ_0 μ_r N I}/l$'} = ${u(r.B1 * I, 'T')} ; l'énergie s'obtient aussi à partir de $u = B^2/(2μ)$ multiplié par le volume.` : ''}` });
    }
    if (dI !== null) {
      res.fem = -L * dI;
      pasos.push({ t: `Si le courant varie à dI/dt = ${f(dI)} A/s`, html: `$ε = −L {dI}/{dt} = −${f(L)} · ${f(dI)}$ = <b>${f(res.fem)} V</b>${dI ? `, qui s'oppose ${dI > 0 ? 'à la hausse' : 'à la baisse'} du courant (loi de Lenz)` : ''}.` });
    }
    return { G, p, res, pasos, letras: r.letras };
  }

  function mutua(sc) {
    const G = GEO_M[sc.geo] || GEO_M.solenoides, p = leerGeo(G, sc);
    const r = G.calc(p), { M } = r, pasos = [...r.pasos], res = { M, L1: r.L1, L2: r.L2 };
    const I1 = lee(sc, 'I1', 'l\'intensité I₁', { opcional: true, signo: true }), dI = lee(sc, 'dI1dt', 'dI₁/dt', { opcional: true, signo: true });
    if (I1 !== null) { res.flujo = M * I1; pasos.push({ t: `Avec I<sub>1</sub> = ${f(I1)} A`, html: `Flux dans le circuit 2 : $Φ_21 = M I_1$ = <b>${u(res.flujo, 'Wb')}</b>` }); }
    if (dI !== null) { res.fem = -M * dI; pasos.push({ t: `Si I<sub>1</sub> varie à ${f(dI)} A/s`, html: `f.é.m. induite dans le circuit 2 : $ε_2 = −M {dI_1}/{dt} = −${f(M)} · ${f(dI)}$ = <b>${f(res.fem)} V</b>` }); }
    if (r.L1 !== undefined) {
      const { L1, L2 } = r, D = L1 * L2 - M * M;
      Object.assign(res, { Ls: L1 + L2 + 2 * M, Lso: L1 + L2 - 2 * M, Lp: D / (L1 + L2 - 2 * M), Lpo: D / (L1 + L2 + 2 * M) });
      pasos.push({ t: 'Bobines associées en série', html: `Avec des flux qui s'additionnent (bornes homologues à la suite) : $L = L_1 + L_2 + 2M$ = <b>${u(res.Ls, 'H')}</b>. Avec des flux opposés : $L = L_1 + L_2 − 2M$ = <b>${u(res.Lso, 'H')}</b>. En mesurant les deux, on obtient $M = {L_additionnés − L_opposés}/4$.` });
      pasos.push({ t: 'Bobines associées en parallèle', html: `$L = {L_1 L_2 − M^2}/{L_1 + L_2 ∓ 2M}$ : avec des flux qui s'additionnent, <b>${u(res.Lp, 'H')}</b> ; avec des flux opposés, <b>${u(res.Lpo, 'H')}</b>.${Math.abs(D) < 1e-12 * L1 * L2 ? ' Avec k = 1, le numérateur est nul : en parallèle et bien couplées, elles se comportent comme une seule bobine sans L supplémentaire opposée.' : ''}` });
    }
    const I2 = lee(sc, 'I2', 'l\'intensité I₂', { opcional: true, signo: true });
    if (I1 !== null && I2 !== null && r.L1 !== undefined) {
      const s = sc.sentido === 'opuesto' ? -1 : 1;
      res.U = 0.5 * r.L1 * I1 * I1 + 0.5 * r.L2 * I2 * I2 + s * M * I1 * I2;
      pasos.push({ t: 'Énergie des deux circuits', html: `$U = 1/2 L_1 I_1^2 + 1/2 L_2 I_2^2 ${s > 0 ? '+' : '−'} M I_1 I_2$ (flux ${s > 0 ? 'additifs' : 'opposés'}) = <b>${u(res.U, 'J')}</b>` });
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
    const G = { campos: [['N1', 'Spires de la grande N<sub>1</sub>', '', 1], ['R', 'Rayon de la grande R', 'cm', 1e-2], ['N2', 'Spires de la petite N<sub>2</sub>', '', 1], ['r', 'Rayon de la petite r', 'cm', 1e-2], ['z', 'Distance z entre les plans', 'cm', 1e-2]] };
    const p = leerGeo(G, sc), I1 = lee(sc, 'I1', 'l\'intensité I₁', { signo: true }), I2 = lee(sc, 'I2', 'l\'intensité I₂', { signo: true });
    const { N1, R, N2, r, z } = p, N = N1 * N2, k2 = (4 * R * r) / ((R + r) ** 2 + z * z), M = N * mutuaExacta(R, r, z), dM = N * dMdz(R, r, z), F = I1 * I2 * dM;
    const Md = (MU0 * N * Math.PI * R * R * r * r) / (2 * Math.pow(R * R + z * z, 1.5)), dMd = (-3 * MU0 * N * Math.PI * R * R * r * r * z) / (2 * Math.pow(R * R + z * z, 2.5)), Fd = I1 * I2 * dMd;
    const curva = (n = 200) => { const zm = 4 * Math.max(R, z); return Array.from({ length: n + 1 }, (_, i) => { const zz = 1e-3 * R + (zm * i) / n; return [zz, I1 * I2 * N * dMdz(R, r, zz)]; }); };
    let zmax = 0, Fm = 0; for (const [zz, ff] of curva(400)) if (Math.abs(ff) > Fm) { Fm = Math.abs(ff); zmax = zz; }
    const sentido = F === 0 ? 'pas de force' : F < 0 ? 'se atraen' : 'se repelen';
    const pasos = [
      { t: 'Énergie et force', html: `L'énergie d'interaction de deux circuits à courants fixés est $U = M I_1 I_2$ et la force qui maintient les courants est $F = I_1 I_2 {dM}/{dz}$ (avec des courants imposés, le travail des sources double la variation d'énergie et l'on obtient $F = +∇U$). Si les courants sont parallèles, M diminue quand on s'éloigne (dM/dz < 0) et les spires s'<b>attirent</b> ; s'ils sont opposés, elles se <b>repoussent</b>.` },
      { t: 'Inductance mutuelle exacte', html: `Pour deux spires coaxiales (Neumann), avec $k^2 = {4Rr}/{(R + r)^2 + z^2}$ = ${f(k2)} : $M = μ_0 √(R r) [(2/k − k) K(k) − (2/k) E(k)]$ par paire de tours. Avec N<sub>1</sub>N<sub>2</sub> = ${f(N)} tours, $M$ = <b>${u(M, 'H')}</b>.` },
      { t: 'Dérivée de M', html: `$dM/dz$ = <b>${f(dM)} H/m</b> (dérivée de la formule exacte).` },
      { t: 'Force', html: `$F = I_1 I_2 dM/dz = ${f(I1)} · ${f(I2)} · (${f(dM)})$ = <b>${u(F, 'N')}</b> : les spires <b>${sentido}</b>.` },
      { t: 'Comparaison avec le dipôle', html: `Si l'on traite la petite comme un dipôle $m_2 = N_2 I_2 π r^2$ dans le champ sur l'axe de la grande, $M ≈ {μ_0 π N_1 N_2 R^2 r^2}/{2(R^2 + z^2)^{3/2}}$ = ${u(Md, 'H')} et $F ≈ −{3 μ_0 π N_1 N_2 I_1 I_2 R^2 r^2 z}/{2(R^2 + z^2)^{5/2}}$ = ${u(Fd, 'N')}, soit ${f(Math.abs(Fd / F - 1) * 100, 3)} % ${Math.abs(Fd) >= Math.abs(F) ? 'de plus' : 'de moins'} que la valeur exacte.` },
      { t: 'Où elle est maximale', html: `Sur le graphique, la force est maximale en $z$ ≈ <b>${f(zmax * 100)} cm</b> (${u(Fm, 'N')}) ; pour une petite spire cela se produit près de $z = R/2$ et, à grande distance, elle décroît en $1/z^4$.` },
    ];
    return { p: { ...p, I1, I2 }, res: { M, dM, F, Md, Fd, zmax, Fmax: Fm, sentido }, pasos, curva, letras: 'F = I_1 I_2 {dM}/{dz}' };
  }

  function rl(sc) {
    const E = lee(sc, 'E', 'la f.é.m. de la source'), R = lee(sc, 'R', 'la resistencia'), L = lee(sc, 'L', 'l\'auto-inductance') * 1e-3;
    const t = lee(sc, 't', 'el instante', { opcional: true, cero: true }), carga = sc.modo !== 'descarga';
    if (sc.modo === 'pulsos') return pulsos(sc, E, R, L, t);
    const tau = L / R, I0 = E / R;
    const I = (s) => (carga ? I0 * (1 - Math.exp(-s / tau)) : I0 * Math.exp(-s / tau));
    const VL = (s) => (carga ? E * Math.exp(-s / tau) : -E * Math.exp(-s / tau));
    const pasos = [
      { t: 'Équation du circuit', html: carga ? `À la fermeture de l'interrupteur : $ε = R I + L {dI}/{dt} ⇒ I(t) = ε/R (1 − e^{−t/τ})$` : `Quand on retire la source (la bobine se décharge dans R) : $0 = R I + L {dI}/{dt} ⇒ I(t) = I_0 e^{−t/τ}$, avec $I_0 = ε/R$` },
      { t: 'Constante de temps', html: `$τ = L/R = ${f(L)}/${f(R)}$ = <b>${u(tau, 's')}</b>. ${carga ? 'Courant final' : 'Courant initial'} : ε / R = <b>${u(I0, 'A')}</b>. Énergie dans la bobine avec ce courant : $1/2 L I^2$ = ${u(0.5 * L * I0 * I0, 'J')}.` },
      { t: 'Temps caractéristiques', html: `À t = τ, le courant ${carga ? 'atteint 63,2 %' : 'tombe à 36,8 %'} ; à 5τ = ${u(5 * tau, 's')} ${carga ? 'il est à 99,3 % de la valeur finale' : 'il en reste 0,7 %'}. Temps pour ${carga ? 'atteindre la moitié' : 'tomber à la moitié'} : $τ ln 2$ = ${u(tau * Math.LN2, 's')}.` },
    ];
    const res = { tau, I0 };
    if (t !== null) {
      const s = t * 1e-3, i = I(s);
      Object.assign(res, { It: i, VLt: VL(s), VRt: R * i, Ut: 0.5 * L * i * i });
      pasos.push({ t: `En t = ${f(t)} ms`, html: `$I = ${carga ? `${f(I0)} (1 − e^{−${f(s)}/${f(tau)}})` : `${f(I0)} e^{−${f(s)}/${f(tau)}}`}$ = <b>${u(i, 'A')}</b> · $V_R = R I$ = ${u(R * i, 'V')} · $V_L = L {dI}/{dt}$ = ${u(VL(s), 'V')} · $U = 1/2 L I^2$ = ${u(0.5 * L * i * i, 'J')}` });
      if (carga) {
        const Wf = E * I0 * (s - tau * (1 - Math.exp(-s / tau))), U = 0.5 * L * i * i;
        Object.assign(res, { Wf, WR: Wf - U });
        pasos.push({ t: 'Bilan énergétique jusqu\'à t', html: `La source a fourni $W_ε = ∫ε I dt = ε I_0 (t − τ (1 − e^{−t/τ}))$ = <b>${u(Wf, 'J')}</b>. De cette énergie, $1/2 L I^2$ = ${u(U, 'J')} reste dans la bobine et le reste, $W_R = ∫R I^2 dt$ = <b>${u(Wf - U, 'J')}</b>, est dissipé dans la résistance.` });
      } else {
        const WR = 0.5 * L * I0 * I0 * (1 - Math.exp((-2 * s) / tau));
        res.WR = WR;
        pasos.push({ t: 'Énergie dissipée jusqu\'à t', html: `$W_R = ∫_0^t R I^2 dt = 1/2 L I_0^2 (1 − e^{−2t/τ})$ = <b>${u(WR, 'J')}</b>. À la fin, toute l'énergie que contenait la bobine est dissipée, $1/2 L I_0^2$ = ${u(0.5 * L * I0 * I0, 'J')}.` });
      }
    }
    return { p: { E, R, L, carga, t }, res, I, VL, tau, pasos, letras: carga ? 'I(t) = ε/R (1 − e^{−t/τ}), τ = L/R' : 'I(t) = ε/R e^{−t/τ}, τ = L/R' };
  }

  function pulsos(sc, E, R, L, t) {
    const ton = lee(sc, 'ton', 'la durée de connexion') * 1e-3, toff = lee(sc, 'toff', 'la durée de déconnexion') * 1e-3;
    const tau = L / R, I0 = E / R, P = ton + toff, a = Math.exp(-ton / tau), b = Math.exp(-toff / tau), A = a * b;
    const Imax = (I0 * (1 - a)) / (1 - A), Imin = Imax * b, Imed = (I0 * ton) / P;
    const inicio = (k) => Imin * (1 - Math.pow(A, k));
    const I = (s) => { const k = Math.floor(s / P), x = s - k * P, i0 = inicio(k); if (x < ton) return I0 + (i0 - I0) * Math.exp(-x / tau); return (I0 + (i0 - I0) * a) * Math.exp(-(x - ton) / tau); };
    const VL = (s) => { const x = s - Math.floor(s / P) * P; return x < ton ? E - R * I(s) : -R * I(s); };
    const pasos = [
      { t: 'Chaque phase', html: `Tant qu'elle est connectée, I tend vers ε/R = ${u(I0, 'A')} avec $τ = L/R$ = <b>${u(tau, 's')}</b> : $I = ε/R + (I_init − ε/R) e^{−t/τ}$. Quand on retire la source, la bobine se décharge dans R : $I = I_fin e^{−t/τ}$. Chaque phase commence avec le courant qui terminait la précédente, car le courant dans une bobine ne peut pas faire de saut.` },
      { t: 'Régime permanent', html: `Après quelques cycles, le courant monte et descend toujours entre les mêmes valeurs. En imposant qu'un cycle se termine comme il a commencé : $I_max = ε/R {1 − e^{−t_on/τ}}/{1 − e^{−T/τ}}$ = <b>${u(Imax, 'A')}</b> et $I_min = I_max e^{−t_off/τ}$ = <b>${u(Imin, 'A')}</b>, avec T = ${u(P, 's')}.` },
      { t: 'Courant moyen', html: `Sur un cycle, la tension moyenne aux bornes de la bobine est nulle, donc $R I_moy = ε t_on/T$ : I<sub>moy</sub> = <b>${u(Imed, 'A')}</b> (${f((100 * ton) / P, 3)} % du temps connectée). C'est le principe de la régulation par MLI (PWM). L'ondulation est $I_max − I_min$ = ${u(Imax - Imin, 'A')}${tau > 3 * P ? ', faible car τ est très supérieur à la période' : ''}.` },
    ];
    const res = { tau, I0, Imax, Imin, Imed };
    if (t !== null) { const s = t * 1e-3, i = I(s); Object.assign(res, { It: i, VLt: VL(s), VRt: R * i, Ut: 0.5 * L * i * i }); pasos.push({ t: `En t = ${f(t)} ms`, html: `On est au cycle ${Math.floor(s / P) + 1}, ${s - Math.floor(s / P) * P < ton ? 'connectée' : 'déconnectée'} : I = <b>${u(i, 'A')}</b>, V<sub>L</sub> = ${u(VL(s), 'V')} et $U = 1/2 L I^2$ = ${u(0.5 * L * i * i, 'J')}.` }); }
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
    const N1 = lee(sc, 'N1', 'les spires du primaire'), N2 = lee(sc, 'N2', 'les spires du secondaire'), L1 = lee(sc, 'L1', 'l\'auto-inductance du primaire') * 1e-3;
    const k = lee(sc, 'k', 'le coefficient de couplage'), V1 = lee(sc, 'V1', 'la tension du primaire'), fr = lee(sc, 'fr', 'la frecuencia');
    const R1 = lee(sc, 'R1', 'la résistance du primaire', { cero: true }), R2 = lee(sc, 'R2', 'la résistance du secondaire', { cero: true }), RL = lee(sc, 'RL', 'la résistance de charge');
    if (k > 1) throw new Error('Le coefficient de couplage k ne peut pas être supérieur à 1');
    const n = N2 / N1, L2 = L1 * n * n, M = k * Math.sqrt(L1 * L2), w = 2 * Math.PI * fr;
    const p = { N1, N2, L1, L2, M, k, V1, fr, R1, R2, RL }, r = trafoPunto(p, RL);
    const V1c = [V1, 0], vacio0 = cx.abs(cx.d([w * M * V1, 0], [R1, w * L1])), Vid = V1 * n, V2m = cx.abs(r.V2);
    const reg = (vacio0 - V2m) / vacio0, Pcu1 = R1 * cx.abs(r.I1) ** 2, Pcu2 = R2 * cx.abs(r.I2) ** 2, fp = r.Pin / (V1 * cx.abs(r.I1));
    const pasos = [
      { t: 'Inductances et couplage', html: `Avec la même géométrie, $L ∝ N^2$, donc $L_2 = L_1 (N_2/N_1)^2$ = ${u(L2, 'H')} et $M = k √(L_1 L_2)$ = <b>${u(M, 'H')}</b>. Flux de fuite : ${f(100 * (1 - k), 3)} % du flux de chaque bobine n'atteint pas l'autre (L<sub>σ1</sub> = (1 − k) L<sub>1</sub> = ${u((1 - k) * L1, 'H')}).` },
      { t: 'Équations avec phaseurs (ω = 2πf = ' + f(w) + ' rad/s)', html: `Primaire : $V_1 = (R_1 + jωL_1) I_1 − jωM I_2$. Secondaire, avec la charge : $jωM I_1 = (R_2 + R_L + jωL_2) I_2$ et $V_2 = R_L I_2$.` },
      { t: 'Impédance vue du primaire', html: `$Z_e = R_1 + jωL_1 + {ω^2 M^2}/{R_2 + R_L + jωL_2}$ = ${f(r.Zin[0])} ${r.Zin[1] < 0 ? '−' : '+'} j ${f(Math.abs(r.Zin[1]))} Ω (|Z<sub>e</sub>| = ${f(cx.abs(r.Zin))} Ω, ${f(cx.fase(r.Zin), 3)}°). $I_1 = V_1/Z_e$ = <b>${u(cx.abs(r.I1), 'A')}</b>.` },
      { t: 'Secondaire', html: `$I_2 = {jωM I_1}/{R_2 + R_L + jωL_2}$ = <b>${u(cx.abs(r.I2), 'A')}</b> et $V_2 = R_L I_2$ = <b>${u(V2m, 'V')}</b>, avec la phase ${f(cx.fase(r.V2) - 0, 4)}° par rapport à V<sub>1</sub>. Rapport réel $V_2/V_1$ = ${f(V2m / V1)} contre le rapport idéal $N_2/N_1$ = ${f(n)} (V<sub>2</sub> idéale = ${u(Vid, 'V')}).` },
      { t: 'Régulation', html: `À vide ($R_L → ∞$), le secondaire donne $V_{20} = {ωM V_1}/{|R_1 + jωL_1|}$ = ${u(vacio0, 'V')}. Régulation $= (V_{20} − V_2)/V_{20}$ = <b>${f(100 * reg, 3)} %</b> : de combien la tension chute quand on connecte la charge.` },
      { t: 'Puissances et rendement', html: `$P_1 = V_1 |I_1| cos φ$ = ${u(r.Pin, 'W')} (cos φ = ${f(fp)}) ; $P_2 = R_L |I_2|^2$ = ${u(r.Pout, 'W')}. Pertes dans le cuivre : ${u(Pcu1, 'W')} dans le primaire et ${u(Pcu2, 'W')} dans le secondaire. Rendement $η = P_2/P_1$ = <b>${f(100 * r.eta, 4)} %</b>.` },
    ];
    const curva = () => { const pts = []; for (let i = 0; i <= 120; i++) { const RLx = RL * Math.pow(10, -1.5 + (3 * i) / 120), q = trafoPunto(p, RLx); pts.push([RLx, cx.abs(q.V2) / vacio0, q.eta]); } return pts; };
    const res = { M, L2, n, I1: cx.abs(r.I1), I2: cx.abs(r.I2), V2: V2m, Vid, relacion: V2m / V1, V20: vacio0, reg, eta: r.eta, Pin: r.Pin, Pout: r.Pout, Pcu1, Pcu2, fp, Zin: cx.abs(r.Zin) };
    return { p, res, pasos, curva, letras: 'η = {R_L |I_2|^2}/{V_1 |I_1| cos φ}' };
  }

  const ejemplos = {
    L: [
      { clave: 'solenoide', nombre: 'Solénoïde de 500 spires', sc: { geo: 'solenoide', N: '500', l: '20', r: '1', mur: '1', I: '2', dIdt: '100' } },
      { clave: 'solenoide-hierro', nombre: 'Solénoïde avec noyau (μr = 800)', sc: { geo: 'solenoide', N: '300', l: '15', r: '1.5', mur: '800', I: '0.5' } },
      { clave: 'toroide-rect', nombre: 'Tore de section rectangulaire', sc: { geo: 'toroide-rect', N: '1000', a: '5', b: '8', h: '2', mur: '1', I: '1' } },
      { clave: 'toroide-circ', nombre: 'Tore de section circulaire', sc: { geo: 'toroide-circ', N: '200', R: '10', r: '2', mur: '1' } },
      { clave: 'coaxial', nombre: 'Câble coaxial, conducteur intérieur plein', sc: { geo: 'coaxial', l: '1', a: '1', b: '4', interior: 'macizo' } },
      { clave: 'entrehierro', nombre: 'Tore de fer avec entrefer', sc: { geo: 'entrehierro', N: '500', R: '10', S: '4', mur: '2000', g: '2', I: '1' } },
      { clave: 'bifilar', nombre: 'Ligne bifilaire', sc: { geo: 'bifilar', l: '1', d: '10', a: '1', interior: 'hueco' } },
    ],
    M: [
      { clave: 'solenoides', nombre: 'Solénoïde à l\'intérieur d\'un autre', sc: { geo: 'solenoides', N1: '200', r1: '1', N2: '1000', r2: '2', l: '40', dI1dt: '50' } },
      { clave: 'espiras', nombre: 'Petite spire au centre d\'une grande', sc: { geo: 'espiras', N1: '1', R: '20', N2: '10', r: '1', dI1dt: '1000' } },
      { clave: 'espiras-coaxiales', nombre: 'Deux spires coaxiales à une certaine distance', sc: { geo: 'espiras-coaxiales', N1: '100', R: '10', N2: '20', r: '1', z: '10', dI1dt: '50' } },
      { clave: 'espira-solenoide', nombre: 'Bobine inclinée à l\'intérieur d\'un solénoïde', sc: { geo: 'espira-solenoide', N1: '1000', l: '50', N2: '30', r: '1', th: '60', dI1dt: '100' } },
      { clave: 'hilo-espira', nombre: 'Fil et spire rectangulaire', sc: { geo: 'hilo-espira', d: '5', w: '10', h: '20', N2: '1', dI1dt: '200' } },
      { clave: 'toroide-bobina', nombre: 'Bobine sur un tore (k = 1)', sc: { geo: 'toroide-bobina', N1: '500', N2: '50', a: '4', b: '6', h: '2', I1: '2', I2: '1', sentido: 'aditivo' } },
      { clave: 'acoplamiento', nombre: 'Bobines couplées en série et en parallèle', sc: { geo: 'acoplamiento', L1: '2', L2: '8', k: '0.5' } },
    ],
    F: [
      { clave: 'f-atraen', nombre: 'Deux spires avec des courants parallèles : elles s\'attirent', sc: { N1: '1', R: '10', N2: '1', r: '5', z: '5', I1: '100', I2: '50' } },
      { clave: 'f-repelen', nombre: 'Courants opposés : elles se repoussent (anneau en lévitation)', sc: { N1: '200', R: '10', N2: '1', r: '5', z: '3', I1: '10', I2: '-300' } },
      { clave: 'f-lejos', nombre: 'Petite spire éloignée : limite du dipôle', sc: { N1: '100', R: '10', N2: '20', r: '1', z: '40', I1: '2', I2: '1' } },
    ],
    T: [
      { clave: 't-red', nombre: 'Transformateur secteur 230 V → 23 V', sc: { N1: '1000', N2: '100', L1: '10000', k: '0.98', V1: '230', fr: '50', R1: '2', R2: '0.02', RL: '5' } },
      { clave: 't-flojo', nombre: 'Couplage lâche (k = 0,6), comme un chargeur sans fil', sc: { N1: '20', N2: '20', L1: '0.024', k: '0.6', V1: '5', fr: '100000', R1: '0.5', R2: '0.5', RL: '10' } },
      { clave: 't-vacio', nombre: 'Presque à vide : régulation et rendement', sc: { N1: '500', N2: '1500', L1: '4000', k: '0.99', V1: '100', fr: '50', R1: '1', R2: '9', RL: '5000' } },
    ],
    RL: [
      { clave: 'carga', nombre: 'On ferme l\'interrupteur', sc: { E: '12', R: '6', L: '300', modo: 'carga', t: '50' } },
      { clave: 'descarga', nombre: 'La bobine se décharge dans la résistance', sc: { E: '10', R: '100', L: '500', modo: 'descarga', t: '2' } },
      { clave: 'pulsos', nombre: 'On connecte et déconnecte sans cesse', sc: { E: '12', R: '10', L: '50', modo: 'pulsos', ton: '5', toff: '5', t: '' } },
    ],
  };

  return { autoinduccion, mutua, rl, fuerza, transformador, mutuaExacta, elip, GEO_L, GEO_M, ejemplos, f, u, MU0 };
})();

