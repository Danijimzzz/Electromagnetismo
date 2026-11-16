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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    return v;
  };

  const GEO_L = {
    solenoide: {
      nombre: 'Solenoide largo', campos: [['N', 'Número de espiras N', '', 1], ['l', 'Longitud l', 'cm', 1e-2], ['r', 'Radio r', 'cm', 1e-2], ['mur', 'Permeabilidad relativa μ<sub>r</sub>', '', 1]],
      calc: ({ N, l, r, mur }) => {
        const S = Math.PI * r * r, L = (MU0 * mur * N * N * S) / l;
        return { L, pasos: [
          { t: 'Campo dentro del solenoide (Ampère)', html: `$B = {μ_0 μ_r N I}/l$, uniforme dentro y nulo fuera (si l ≫ r).` },
          { t: 'Flujo propio', html: `$Φ = N B S = {μ_0 μ_r N^2 S I}/l$, con $S = π r^2$ = ${f(S)} m<sup>2</sup>.` },
          { t: 'Coeficiente de autoinducción', html: `$L = Φ/I = {μ_0 μ_r N^2 π r^2}/l = {4π·10^{−7} · ${f(mur)} · ${f(N)}^2 · ${f(S)}}/{${f(l)}}$ = <b>${u(L, 'H')}</b>` },
        ], B1: (MU0 * mur * N) / l, letras: 'L = {μ_0 μ_r N^2 π r^2}/l' };
      },
    },
    'toroide-rect': {
      nombre: 'Toroide de sección rectangular', campos: [['N', 'Número de espiras N', '', 1], ['a', 'Radio interior a', 'cm', 1e-2], ['b', 'Radio exterior b', 'cm', 1e-2], ['h', 'Altura h', 'cm', 1e-2], ['mur', 'Permeabilidad relativa μ<sub>r</sub>', '', 1]],
      valida: ({ a, b }) => { if (b <= a) throw new Error('El radio exterior debe ser mayor que el interior'); },
      calc: ({ N, a, b, h, mur }) => {
        const L = (MU0 * mur * N * N * h * Math.log(b / a)) / (2 * Math.PI);
        return { L, pasos: [
          { t: 'Campo dentro del toroide (Ampère)', html: `$B(r) = {μ_0 μ_r N I}/{2π r}$, para a < r < b.` },
          { t: 'Flujo por una espira', html: `$Φ_1 = ∫_a^b B h dr = {μ_0 μ_r N I h ln(b/a)}/{2π}$, con ln(b/a) = ln(${f(b / a)}) = ${f(Math.log(b / a))}.` },
          { t: 'Coeficiente de autoinducción', html: `$L = {N Φ_1}/I = {μ_0 μ_r N^2 h ln(b/a)}/{2π} = 2·10^{−7} · ${f(mur)} · ${f(N)}^2 · ${f(h)} · ${f(Math.log(b / a))}$ = <b>${u(L, 'H')}</b>` },
        ], letras: 'L = {μ_0 μ_r N^2 h}/{2π} ln(b/a)' };
      },
    },
    'toroide-circ': {
      nombre: 'Toroide de sección circular', campos: [['N', 'Número de espiras N', '', 1], ['R', 'Radio medio R', 'cm', 1e-2], ['r', 'Radio de la sección r', 'cm', 1e-2], ['mur', 'Permeabilidad relativa μ<sub>r</sub>', '', 1]],
      valida: ({ R, r }) => { if (r >= R) throw new Error('El radio de la sección debe ser menor que el radio medio'); },
      calc: ({ N, R, r, mur }) => {
        const L = MU0 * mur * N * N * (R - Math.sqrt(R * R - r * r)), La = (MU0 * mur * N * N * r * r) / (2 * R);
        return { L, pasos: [
          { t: 'Campo dentro del toroide (Ampère)', html: `$B(ρ) = {μ_0 μ_r N I}/{2π ρ}$, a una distancia ρ del eje.` },
          { t: 'Coeficiente de autoinducción', html: `Integrando el flujo sobre la sección circular: $L = μ_0 μ_r N^2 (R − √(R^2 − r^2))$ = <b>${u(L, 'H')}</b>` },
          { t: 'Aproximación de toroide fino', html: `Si r ≪ R, B es casi uniforme y $L ≈ {μ_0 μ_r N^2 π r^2}/{2π R}$ = ${u(La, 'H')} (difiere un ${f(100 * Math.abs(La / L - 1), 2)} %).` },
        ], letras: 'L = μ_0 μ_r N^2 (R − √(R^2 − r^2))' };
      },
    },
    entrehierro: {
      nombre: 'Toroide con entrehierro', campos: [['N', 'Número de espiras N', '', 1], ['R', 'Radio medio R', 'cm', 1e-2], ['S', 'Sección S', 'cm²', 1e-4], ['mur', 'Permeabilidad relativa del núcleo μ<sub>r</sub>', '', 1], ['g', 'Entrehierro g', 'mm', 1e-3]],
      valida: ({ R, g }) => { if (g >= 2 * Math.PI * R) throw new Error('El entrehierro no puede ser más largo que el toroide'); },
      calc: ({ N, R, S, mur, g }) => {
        const lc = 2 * Math.PI * R - g, Rn = lc / (MU0 * mur * S), Rg = g / (MU0 * S), Rt = Rn + Rg, L = (N * N) / Rt, L0 = (MU0 * mur * N * N * S) / (2 * Math.PI * R);
        return { L, pasos: [
          { t: 'Ley de Ampère', html: `Por la línea media del toroide: $H_n l_n + H_g g = N I$, con $l_n = 2πR − g$ = ${f(lc)} m de núcleo. Sin dispersión, B es el mismo en el núcleo y en el hueco: $H_n = B/(μ_0 μ_r)$ y $H_g = B/μ_0$, así que $B = {μ_0 N I}/{l_n/μ_r + g}$.` },
          { t: 'Reluctancias', html: `Como en un circuito en serie: $ℛ_n = {l_n}/{μ_0 μ_r S}$ = ${f(Rn)} A/Wb y $ℛ_g = g/(μ_0 S)$ = ${f(Rg)} A/Wb. Total ℛ = <b>${f(Rt)} A/Wb</b>${Rg > Rn ? `: el hueco de aire, aunque mide solo ${f(g * 1000)} mm, pesa más que todo el núcleo` : ''}.` },
          { t: 'Coeficiente de autoinducción', html: `Φ = N I/ℛ por espira, y $L = {N Φ}/I = N^2/ℛ = ${f(N)}^2/{${f(Rt)}}$ = <b>${u(L, 'H')}</b>. Sin entrehierro sería $ {μ_0 μ_r N^2 S}/{2π R}$ = ${u(L0, 'H')}, ${f(L0 / L, 3)} veces más.` },
        ], B1: N / (Rt * S), letras: 'L = {μ_0 N^2 S}/{(2π R − g)/μ_r + g}' };
      },
    },
    coaxial: {
      nombre: 'Cable coaxial', campos: [['l', 'Longitud l', 'm', 1], ['a', 'Radio del conductor interior a', 'mm', 1e-3], ['b', 'Radio del conductor exterior b', 'mm', 1e-3]], interior: true,
      valida: ({ a, b }) => { if (b <= a) throw new Error('El radio exterior debe ser mayor que el interior'); },
      calc: ({ l, a, b, macizo }) => {
        const Le = (MU0 * l * Math.log(b / a)) / (2 * Math.PI), Li = macizo ? (MU0 * l) / (8 * Math.PI) : 0, L = Le + Li;
        const pasos = [
          { t: 'Campo entre los conductores (Ampère)', html: `$B(r) = {μ_0 I}/{2π r}$, para a < r < b; fuera del cable B = 0.` },
          { t: 'Parte externa', html: `$Φ = ∫_a^b B l dr = {μ_0 I l ln(b/a)}/{2π}$ ⇒ $L_ext = {μ_0 l ln(b/a)}/{2π} = 2·10^{−7} · ${f(l)} · ln(${f(b / a)})$ = <b>${u(Le, 'H')}</b>` },
        ];
        if (macizo) pasos.push({ t: 'Parte interna (conductor macizo)', html: `Dentro del conductor $B = {μ_0 I r}/{2π a^2}$. Por energía, $1/2 L_int I^2 = ∫ B^2/(2μ_0) dV$ ⇒ $L_int = {μ_0 l}/{8π}$ = ${u(Li, 'H')}. Total: L = <b>${u(L, 'H')}</b>` });
        pasos.push({ t: 'Por unidad de longitud', html: `$L/l$ = <b>${u(L / l, 'H/m')}</b>` });
        return { L, pasos, letras: macizo ? 'L = {μ_0 l}/{2π} (ln(b/a) + 1/4)' : 'L = {μ_0 l}/{2π} ln(b/a)' };
      },
    },
    bifilar: {
      nombre: 'Línea bifilar', campos: [['l', 'Longitud l', 'm', 1], ['d', 'Distancia entre ejes d', 'mm', 1e-3], ['a', 'Radio de cada hilo a', 'mm', 1e-3]], interior: true,
      valida: ({ d, a }) => { if (d <= 2 * a) throw new Error('Los hilos se tocan: la distancia entre ejes debe ser mayor que 2a'); },
      calc: ({ l, d, a, macizo }) => {
        const Le = (MU0 * l * Math.log((d - a) / a)) / Math.PI, Li = macizo ? (MU0 * l) / (4 * Math.PI) : 0, L = Le + Li;
        const pasos = [
          { t: 'Campo entre los hilos', html: `Cada hilo crea $B = {μ_0 I}/{2π r}$ y entre ellos los dos campos se suman: $B(x) = {μ_0 I}/{2π} (1/x + 1/(d − x))$.` },
          { t: 'Flujo entre los hilos', html: `$Φ = ∫_a^{d−a} B l dx = {μ_0 I l}/π ln({d − a}/a)$ ⇒ $L_ext = {μ_0 l}/π ln({d − a}/a) = 4·10^{−7} · ${f(l)} · ln(${f((d - a) / a)})$ = <b>${u(Le, 'H')}</b>${d > 20 * a ? ` ($≈ {μ_0 l}/π ln(d/a)$, pues d ≫ a)` : ''}` },
        ];
        if (macizo) pasos.push({ t: 'Parte interna (hilos macizos)', html: `Cada hilo aporta $ {μ_0 l}/{8π}$: $L_int = {μ_0 l}/{4π}$ = ${u(Li, 'H')}. Total: L = <b>${u(L, 'H')}</b>` });
        pasos.push({ t: 'Por unidad de longitud', html: `$L/l$ = <b>${u(L / l, 'H/m')}</b>` });
        return { L, pasos, letras: macizo ? 'L = {μ_0 l}/π (ln({d − a}/a) + 1/4)' : 'L = {μ_0 l}/π ln({d − a}/a)' };
      },
    },
  };

  const GEO_M = {
    solenoides: {
      nombre: 'Dos solenoides coaxiales', campos: [['N1', 'Espiras del interior N<sub>1</sub>', '', 1], ['r1', 'Radio del interior r<sub>1</sub>', 'cm', 1e-2], ['N2', 'Espiras del exterior N<sub>2</sub>', '', 1], ['r2', 'Radio del exterior r<sub>2</sub>', 'cm', 1e-2], ['l', 'Longitud común l', 'cm', 1e-2]],
      valida: ({ r1, r2 }) => { if (r1 > r2) throw new Error('El solenoide interior no puede ser más ancho que el exterior'); },
      calc: ({ N1, r1, N2, r2, l }) => {
        const S1 = Math.PI * r1 * r1, M = (MU0 * N1 * N2 * S1) / l, L1 = (MU0 * N1 * N1 * S1) / l, L2 = (MU0 * N2 * N2 * Math.PI * r2 * r2) / l;
        return { M, L1, L2, pasos: [
          { t: 'Campo del exterior', html: `Con una corriente I<sub>2</sub> en el exterior, $B_2 = {μ_0 N_2 I_2}/l$ dentro de él, también dentro del interior.` },
          { t: 'Flujo en el interior', html: `$Φ_12 = N_1 B_2 π r_1^2 = {μ_0 N_1 N_2 π r_1^2 I_2}/l$ (solo cuenta la sección del interior).` },
          { t: 'Coeficiente de inducción mutua', html: `$M = {Φ_12}/{I_2} = {μ_0 N_1 N_2 π r_1^2}/l = {4π·10^{−7} · ${f(N1)} · ${f(N2)} · ${f(S1)}}/{${f(l)}}$ = <b>${u(M, 'H')}</b>. Sale lo mismo calculando el flujo del interior en el exterior ($M_12 = M_21$).` },
          { t: 'Coeficiente de acoplamiento', html: `$L_1 = {μ_0 N_1^2 π r_1^2}/l$ = ${u(L1, 'H')}, $L_2 = {μ_0 N_2^2 π r_2^2}/l$ = ${u(L2, 'H')} ⇒ $k = M/√(L_1 L_2) = {r_1}/{r_2}$ = <b>${f(M / Math.sqrt(L1 * L2))}</b>` },
        ], letras: 'M = {μ_0 N_1 N_2 π r_1^2}/l' };
      },
    },
    espiras: {
      nombre: 'Espira pequeña en el centro de otra grande', campos: [['N1', 'Espiras de la grande N<sub>1</sub>', '', 1], ['R', 'Radio de la grande R', 'cm', 1e-2], ['N2', 'Espiras de la pequeña N<sub>2</sub>', '', 1], ['r', 'Radio de la pequeña r', 'cm', 1e-2]],
      valida: ({ R, r }) => { if (r >= R) throw new Error('La espira pequeña debe tener un radio menor que la grande'); },
      calc: ({ N1, R, N2, r }) => {
        const M = (MU0 * N1 * N2 * Math.PI * r * r) / (2 * R);
        return { M, pasos: [
          { t: 'Campo en el centro de la grande', html: `$B_1 = {μ_0 N_1 I_1}/{2R}$ (Biot-Savart en el centro de la espira).` },
          { t: 'Flujo en la pequeña', html: `Si r ≪ R el campo es casi uniforme sobre la espira pequeña: $Φ_21 = N_2 B_1 π r^2$.` },
          { t: 'Coeficiente de inducción mutua', html: `$M = {Φ_21}/{I_1} = {μ_0 N_1 N_2 π r^2}/{2R}$ = <b>${u(M, 'H')}</b>${r > 0.2 * R ? '. Ojo: r no es mucho menor que R, así que es una aproximación gruesa.' : ''}` },
        ], letras: 'M = {μ_0 N_1 N_2 π r^2}/{2R}' };
      },
    },
    'espiras-coaxiales': {
      nombre: 'Dos espiras coaxiales separadas', campos: [['N1', 'Espiras de la grande N<sub>1</sub>', '', 1], ['R', 'Radio de la grande R', 'cm', 1e-2], ['N2', 'Espiras de la pequeña N<sub>2</sub>', '', 1], ['r', 'Radio de la pequeña r', 'cm', 1e-2], ['z', 'Distancia entre los centros z', 'cm', 1e-2]],
      valida: ({ R, r }) => { if (r > R) throw new Error('Pon como espira 1 la de radio mayor'); },
      calc: ({ N1, R, N2, r, z }) => {
        const D = Math.pow(R * R + z * z, 1.5), M = (MU0 * N1 * N2 * Math.PI * R * R * r * r) / (2 * D);
        return { M, pasos: [
          { t: 'Campo de la grande en su eje', html: `$B_1(z) = {μ_0 N_1 I_1 R^2}/{2 (R^2 + z^2)^{3/2}}$ (Biot-Savart), con $(R^2 + z^2)^{3/2}$ = ${f(D)} m<sup>3</sup>.` },
          { t: 'Flujo en la pequeña', html: `Si la pequeña es pequeña frente a la distancia a los hilos de la grande, B<sub>1</sub> es casi uniforme sobre ella: $Φ_21 = N_2 B_1 π r^2$.` },
          { t: 'Coeficiente de inducción mutua', html: `$M = {μ_0 π N_1 N_2 R^2 r^2}/{2 (R^2 + z^2)^{3/2}}$ = <b>${u(M, 'H')}</b>. Con z ≫ R baja como 1/z<sup>3</sup>, igual que el campo de un dipolo.${r > 0.3 * Math.sqrt(R * R + z * z) ? ' Ojo: r no es pequeño frente a √(R² + z²), así que es una aproximación gruesa.' : ''}` },
        ], letras: 'M = {μ_0 π N_1 N_2 R^2 r^2}/{2 (R^2 + z^2)^{3/2}}' };
      },
    },
    'espira-solenoide': {
      nombre: 'Espira o bobina dentro de un solenoide', campos: [['N1', 'Espiras del solenoide N<sub>1</sub>', '', 1], ['l', 'Longitud del solenoide l', 'cm', 1e-2], ['N2', 'Espiras de la bobina N<sub>2</sub>', '', 1], ['r', 'Radio de la bobina r', 'cm', 1e-2], ['th', 'Ángulo entre los ejes θ', '°', 1]],
      valida: ({ th }) => { if (th > 180) throw new Error('El ángulo entre los ejes tiene que estar entre 0° y 180°'); },
      calc: ({ N1, l, N2, r, th }) => {
        const c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180), M = (MU0 * N1 * N2 * Math.PI * r * r * c) / l;
        return { M, pasos: [
          { t: 'Campo del solenoide', html: `$B_1 = {μ_0 N_1 I_1}/l$, uniforme dentro (la bobina tiene que caber dentro y lejos de los extremos).` },
          { t: 'Flujo en la bobina', html: `$Φ_21 = N_2 B_1 π r^2 cos θ$: solo cuenta la componente de B perpendicular a la bobina.` },
          { t: 'Coeficiente de inducción mutua', html: `$M = {μ_0 N_1 N_2 π r^2 cos θ}/l = {4π·10^{−7} · ${f(N1)} · ${f(N2)} · π·${f(r)}^2${th ? ` · cos ${f(th)}°` : ''}}/{${f(l)}}$ = <b>${u(M, 'H')}</b>${c === 0 ? ': con los ejes perpendiculares no hay acoplamiento' : ''}. Girando la bobina, M cambia como cos θ (así funciona un generador).` },
        ], letras: 'M = {μ_0 N_1 N_2 π r^2 cos θ}/l' };
      },
    },
    'hilo-espira': {
      nombre: 'Hilo recto y espira rectangular coplanaria', campos: [['d', 'Distancia del hilo al lado cercano d', 'cm', 1e-2], ['w', 'Ancho de la espira w', 'cm', 1e-2], ['h', 'Lado paralelo al hilo h', 'cm', 1e-2], ['N2', 'Espiras de la espira N', '', 1]],
      calc: ({ d, w, h, N2 }) => {
        const M = (MU0 * N2 * h * Math.log((d + w) / d)) / (2 * Math.PI);
        return { M, pasos: [
          { t: 'Campo del hilo', html: `$B(x) = {μ_0 I}/{2π x}$, perpendicular al plano de la espira.` },
          { t: 'Flujo en la espira', html: `$Φ = N ∫_d^{d+w} {μ_0 I h}/{2π x} dx = {μ_0 N I h}/{2π} ln({d + w}/d)$, con ln(${f((d + w) / d)}) = ${f(Math.log((d + w) / d))}.` },
          { t: 'Coeficiente de inducción mutua', html: `$M = Φ/I = {μ_0 N h}/{2π} ln({d + w}/d) = 2·10^{−7} · ${f(N2)} · ${f(h)} · ${f(Math.log((d + w) / d))}$ = <b>${u(M, 'H')}</b>` },
        ], letras: 'M = {μ_0 N h}/{2π} ln({d + w}/d)' };
      },
    },
    'toroide-bobina': {
      nombre: 'Bobina enrollada sobre un toroide', campos: [['N1', 'Espiras del toroide N<sub>1</sub>', '', 1], ['N2', 'Espiras de la bobina N<sub>2</sub>', '', 1], ['a', 'Radio interior a', 'cm', 1e-2], ['b', 'Radio exterior b', 'cm', 1e-2], ['h', 'Altura h', 'cm', 1e-2]],
      valida: ({ a, b }) => { if (b <= a) throw new Error('El radio exterior debe ser mayor que el interior'); },
      calc: ({ N1, N2, a, b, h }) => {
        const M = (MU0 * N1 * N2 * h * Math.log(b / a)) / (2 * Math.PI), L1 = (MU0 * N1 * N1 * h * Math.log(b / a)) / (2 * Math.PI), L2 = (MU0 * N2 * N2 * h * Math.log(b / a)) / (2 * Math.PI);
        return { M, L1, L2, pasos: [
          { t: 'Campo del toroide', html: `$B(r) = {μ_0 N_1 I_1}/{2π r}$ dentro del núcleo.` },
          { t: 'Flujo en la bobina', html: `La bobina abraza todo el núcleo: $Φ_21 = N_2 {μ_0 N_1 I_1 h}/{2π} ln(b/a)$.` },
          { t: 'Coeficiente de inducción mutua', html: `$M = {μ_0 N_1 N_2 h}/{2π} ln(b/a)$ = <b>${u(M, 'H')}</b>. Las dos bobinas comparten todo el flujo, así que $k = M/√(L_1 L_2)$ = <b>1</b> (L<sub>1</sub> = ${u(L1, 'H')}, L<sub>2</sub> = ${u(L2, 'H')}).` },
        ], letras: 'M = {μ_0 N_1 N_2 h}/{2π} ln(b/a)' };
      },
    },
    acoplamiento: {
      nombre: 'A partir de L₁, L₂ y k', campos: [['L1', 'L<sub>1</sub>', 'mH', 1e-3], ['L2', 'L<sub>2</sub>', 'mH', 1e-3], ['k', 'Coeficiente de acoplamiento k', '', 1]],
      valida: ({ k }) => { if (k > 1) throw new Error('El coeficiente de acoplamiento no puede ser mayor que 1'); },
      calc: ({ L1, L2, k }) => {
        const M = k * Math.sqrt(L1 * L2);
        return { M, L1, L2, pasos: [{ t: 'Coeficiente de inducción mutua', html: `$M = k √(L_1 L_2) = ${f(k)} · √(${f(L1)} · ${f(L2)})$ = <b>${u(M, 'H')}</b>` }], letras: 'M = k √(L_1 L_2)' };
      },
    },
  };

  function leerGeo(G, sc) {
    const p = {};
    for (const [k, nom, un, fac] of G.campos) {
      const n = nom.replace(/<[^>]+>/g, '');
      p[k] = lee(sc, k, n.toLowerCase(), { cero: k === 'th' }) * fac;
      if ((k === 'N' || k === 'N1' || k === 'N2') && !Number.isInteger(p[k])) throw new Error(`${n} debe ser un número entero`);
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
      pasos.push({ t: `Con I = ${f(I)} A`, html: `Flujo propio $Φ = L I$ = <b>${u(res.flujo, 'Wb')}</b> · energía magnética $U = 1/2 L I^2 = 1/2 · ${f(L)} · ${f(I)}^2$ = <b>${u(res.U, 'J')}</b>${r.B1 ? `<br>Campo ${sc.geo === 'entrehierro' ? 'en el núcleo y en el hueco' : 'dentro'}: ${sc.geo === 'entrehierro' ? '$B = {N I}/{ℛ S}$' : '$B = {μ_0 μ_r N I}/l$'} = ${u(r.B1 * I, 'T')}; la energía también sale de $u = B^2/(2μ)$ por el volumen.` : ''}` });
    }
    if (dI !== null) {
      res.fem = -L * dI;
      pasos.push({ t: `Si la corriente cambia a dI/dt = ${f(dI)} A/s`, html: `$ε = −L {dI}/{dt} = −${f(L)} · ${f(dI)}$ = <b>${f(res.fem)} V</b>${dI ? `, que se opone al ${dI > 0 ? 'aumento' : 'descenso'} de la corriente (ley de Lenz)` : ''}.` });
    }
    return { G, p, res, pasos, letras: r.letras };
  }

  function mutua(sc) {
    const G = GEO_M[sc.geo] || GEO_M.solenoides, p = leerGeo(G, sc);
    const r = G.calc(p), { M } = r, pasos = [...r.pasos], res = { M, L1: r.L1, L2: r.L2 };
    const I1 = lee(sc, 'I1', 'la intensidad I₁', { opcional: true, signo: true }), dI = lee(sc, 'dI1dt', 'dI₁/dt', { opcional: true, signo: true });
    if (I1 !== null) { res.flujo = M * I1; pasos.push({ t: `Con I<sub>1</sub> = ${f(I1)} A`, html: `Flujo en el circuito 2: $Φ_21 = M I_1$ = <b>${u(res.flujo, 'Wb')}</b>` }); }
    if (dI !== null) { res.fem = -M * dI; pasos.push({ t: `Si I<sub>1</sub> cambia a ${f(dI)} A/s`, html: `fem inducida en el circuito 2: $ε_2 = −M {dI_1}/{dt} = −${f(M)} · ${f(dI)}$ = <b>${f(res.fem)} V</b>` }); }
    if (r.L1 !== undefined) {
      const { L1, L2 } = r, D = L1 * L2 - M * M;
      Object.assign(res, { Ls: L1 + L2 + 2 * M, Lso: L1 + L2 - 2 * M, Lp: D / (L1 + L2 - 2 * M), Lpo: D / (L1 + L2 + 2 * M) });
      pasos.push({ t: 'Bobinas asociadas en serie', html: `Con los flujos que se suman (terminales homólogos seguidos): $L = L_1 + L_2 + 2M$ = <b>${u(res.Ls, 'H')}</b>. Con los flujos opuestos: $L = L_1 + L_2 − 2M$ = <b>${u(res.Lso, 'H')}</b>. Midiendo las dos se saca $M = {L_sumados − L_opuestos}/4$.` });
      pasos.push({ t: 'Bobinas asociadas en paralelo', html: `$L = {L_1 L_2 − M^2}/{L_1 + L_2 ∓ 2M}$: con los flujos que se suman, <b>${u(res.Lp, 'H')}</b>; con los flujos opuestos, <b>${u(res.Lpo, 'H')}</b>.${Math.abs(D) < 1e-12 * L1 * L2 ? ' Con k = 1 el numerador es 0: en paralelo y bien acopladas se comportan como una sola bobina sin ninguna L extra que se oponga.' : ''}` });
    }
    const I2 = lee(sc, 'I2', 'la intensidad I₂', { opcional: true, signo: true });
    if (I1 !== null && I2 !== null && r.L1 !== undefined) {
      const s = sc.sentido === 'opuesto' ? -1 : 1;
      res.U = 0.5 * r.L1 * I1 * I1 + 0.5 * r.L2 * I2 * I2 + s * M * I1 * I2;
      pasos.push({ t: 'Energía de los dos circuitos', html: `$U = 1/2 L_1 I_1^2 + 1/2 L_2 I_2^2 ${s > 0 ? '+' : '−'} M I_1 I_2$ (flujos ${s > 0 ? 'que se suman' : 'opuestos'}) = <b>${u(res.U, 'J')}</b>` });
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
    const G = { campos: [['N1', 'Espiras de la grande N<sub>1</sub>', '', 1], ['R', 'Radio de la grande R', 'cm', 1e-2], ['N2', 'Espiras de la pequeña N<sub>2</sub>', '', 1], ['r', 'Radio de la pequeña r', 'cm', 1e-2], ['z', 'Distancia z entre los planos', 'cm', 1e-2]] };
    const p = leerGeo(G, sc), I1 = lee(sc, 'I1', 'la intensidad I₁', { signo: true }), I2 = lee(sc, 'I2', 'la intensidad I₂', { signo: true });
    const { N1, R, N2, r, z } = p, N = N1 * N2, k2 = (4 * R * r) / ((R + r) ** 2 + z * z), M = N * mutuaExacta(R, r, z), dM = N * dMdz(R, r, z), F = I1 * I2 * dM;
    const Md = (MU0 * N * Math.PI * R * R * r * r) / (2 * Math.pow(R * R + z * z, 1.5)), dMd = (-3 * MU0 * N * Math.PI * R * R * r * r * z) / (2 * Math.pow(R * R + z * z, 2.5)), Fd = I1 * I2 * dMd;
    const curva = (n = 200) => { const zm = 4 * Math.max(R, z); return Array.from({ length: n + 1 }, (_, i) => { const zz = 1e-3 * R + (zm * i) / n; return [zz, I1 * I2 * N * dMdz(R, r, zz)]; }); };
    let zmax = 0, Fm = 0; for (const [zz, ff] of curva(400)) if (Math.abs(ff) > Fm) { Fm = Math.abs(ff); zmax = zz; }
    const sentido = F === 0 ? 'no hay fuerza' : F < 0 ? 'se atraen' : 'se repelen';
    const pasos = [
      { t: 'Energía y fuerza', html: `La energía de interacción de dos circuitos con corrientes fijas es $U = M I_1 I_2$ y la fuerza que mantiene las corrientes es $F = I_1 I_2 {dM}/{dz}$ (con las corrientes impuestas, el trabajo de las fuentes duplica el cambio de energía y resulta $F = +∇U$). Si las corrientes son paralelas M baja al alejarse (dM/dz < 0) y las espiras se <b>atraen</b>; si son opuestas, se <b>repelen</b>.` },
      { t: 'Inducción mutua exacta', html: `Para dos espiras coaxiales (Neumann), con $k^2 = {4Rr}/{(R + r)^2 + z^2}$ = ${f(k2)}: $M = μ_0 √(R r) [(2/k − k) K(k) − (2/k) E(k)]$ por pareja de vueltas. Con N<sub>1</sub>N<sub>2</sub> = ${f(N)} vueltas, $M$ = <b>${u(M, 'H')}</b>.` },
      { t: 'Derivada de M', html: `$dM/dz$ = <b>${f(dM)} H/m</b> (derivada de la fórmula exacta).` },
      { t: 'Fuerza', html: `$F = I_1 I_2 dM/dz = ${f(I1)} · ${f(I2)} · (${f(dM)})$ = <b>${u(F, 'N')}</b>: las espiras <b>${sentido}</b>.` },
      { t: 'Comparación con el dipolo', html: `Si la pequeña se trata como un dipolo $m_2 = N_2 I_2 π r^2$ en el campo del eje de la grande, $M ≈ {μ_0 π N_1 N_2 R^2 r^2}/{2(R^2 + z^2)^{3/2}}$ = ${u(Md, 'H')} y $F ≈ −{3 μ_0 π N_1 N_2 I_1 I_2 R^2 r^2 z}/{2(R^2 + z^2)^{5/2}}$ = ${u(Fd, 'N')}, un ${f(Math.abs(Fd / F - 1) * 100, 3)} % ${Math.abs(Fd) >= Math.abs(F) ? 'más' : 'menos'} que el valor exacto.` },
      { t: 'Dónde es máxima', html: `En la gráfica la fuerza es máxima en $z$ ≈ <b>${f(zmax * 100)} cm</b> (${u(Fm, 'N')}); para una espira pequeña ocurre cerca de $z = R/2$ y a mucha distancia cae como $1/z^4$.` },
    ];
    return { p: { ...p, I1, I2 }, res: { M, dM, F, Md, Fd, zmax, Fmax: Fm, sentido }, pasos, curva, letras: 'F = I_1 I_2 {dM}/{dz}' };
  }

  function rl(sc) {
    const E = lee(sc, 'E', 'la fem de la fuente'), R = lee(sc, 'R', 'la resistencia'), L = lee(sc, 'L', 'la autoinducción') * 1e-3;
    const t = lee(sc, 't', 'el instante', { opcional: true, cero: true }), carga = sc.modo !== 'descarga';
    if (sc.modo === 'pulsos') return pulsos(sc, E, R, L, t);
    const tau = L / R, I0 = E / R;
    const I = (s) => (carga ? I0 * (1 - Math.exp(-s / tau)) : I0 * Math.exp(-s / tau));
    const VL = (s) => (carga ? E * Math.exp(-s / tau) : -E * Math.exp(-s / tau));
    const pasos = [
      { t: 'Ecuación del circuito', html: carga ? `Al cerrar el interruptor: $ε = R I + L {dI}/{dt} ⇒ I(t) = ε/R (1 − e^{−t/τ})$` : `Al quitar la fuente (la bobina se descarga por R): $0 = R I + L {dI}/{dt} ⇒ I(t) = I_0 e^{−t/τ}$, con $I_0 = ε/R$` },
      { t: 'Constante de tiempo', html: `$τ = L/R = ${f(L)}/${f(R)}$ = <b>${u(tau, 's')}</b>. ${carga ? 'Corriente final' : 'Corriente inicial'}: ε / R = <b>${u(I0, 'A')}</b>. Energía en la bobina con esa corriente: $1/2 L I^2$ = ${u(0.5 * L * I0 * I0, 'J')}.` },
      { t: 'Tiempos característicos', html: `En t = τ la corriente ${carga ? 'llega al 63,2 %' : 'baja al 36,8 %'}; en 5τ = ${u(5 * tau, 's')} ${carga ? 'está al 99,3 % del valor final' : 'queda el 0,7 %'}. Tiempo para ${carga ? 'llegar a la mitad' : 'bajar a la mitad'}: $τ ln 2$ = ${u(tau * Math.LN2, 's')}.` },
    ];
    const res = { tau, I0 };
    if (t !== null) {
      const s = t * 1e-3, i = I(s);
      Object.assign(res, { It: i, VLt: VL(s), VRt: R * i, Ut: 0.5 * L * i * i });
      pasos.push({ t: `En t = ${f(t)} ms`, html: `$I = ${carga ? `${f(I0)} (1 − e^{−${f(s)}/${f(tau)}})` : `${f(I0)} e^{−${f(s)}/${f(tau)}}`}$ = <b>${u(i, 'A')}</b> · $V_R = R I$ = ${u(R * i, 'V')} · $V_L = L {dI}/{dt}$ = ${u(VL(s), 'V')} · $U = 1/2 L I^2$ = ${u(0.5 * L * i * i, 'J')}` });
      if (carga) {
        const Wf = E * I0 * (s - tau * (1 - Math.exp(-s / tau))), U = 0.5 * L * i * i;
        Object.assign(res, { Wf, WR: Wf - U });
        pasos.push({ t: 'Balance de energía hasta t', html: `La fuente ha dado $W_ε = ∫ε I dt = ε I_0 (t − τ (1 − e^{−t/τ}))$ = <b>${u(Wf, 'J')}</b>. De ella, $1/2 L I^2$ = ${u(U, 'J')} queda en la bobina y el resto, $W_R = ∫R I^2 dt$ = <b>${u(Wf - U, 'J')}</b>, se disipa en la resistencia.` });
      } else {
        const WR = 0.5 * L * I0 * I0 * (1 - Math.exp((-2 * s) / tau));
        res.WR = WR;
        pasos.push({ t: 'Energía disipada hasta t', html: `$W_R = ∫_0^t R I^2 dt = 1/2 L I_0^2 (1 − e^{−2t/τ})$ = <b>${u(WR, 'J')}</b>. Al final se disipa toda la energía que tenía la bobina, $1/2 L I_0^2$ = ${u(0.5 * L * I0 * I0, 'J')}.` });
      }
    }
    return { p: { E, R, L, carga, t }, res, I, VL, tau, pasos, letras: carga ? 'I(t) = ε/R (1 − e^{−t/τ}), τ = L/R' : 'I(t) = ε/R e^{−t/τ}, τ = L/R' };
  }

  function pulsos(sc, E, R, L, t) {
    const ton = lee(sc, 'ton', 'el tiempo conectada') * 1e-3, toff = lee(sc, 'toff', 'el tiempo desconectada') * 1e-3;
    const tau = L / R, I0 = E / R, P = ton + toff, a = Math.exp(-ton / tau), b = Math.exp(-toff / tau), A = a * b;
    const Imax = (I0 * (1 - a)) / (1 - A), Imin = Imax * b, Imed = (I0 * ton) / P;
    const inicio = (k) => Imin * (1 - Math.pow(A, k));
    const I = (s) => { const k = Math.floor(s / P), x = s - k * P, i0 = inicio(k); if (x < ton) return I0 + (i0 - I0) * Math.exp(-x / tau); return (I0 + (i0 - I0) * a) * Math.exp(-(x - ton) / tau); };
    const VL = (s) => { const x = s - Math.floor(s / P) * P; return x < ton ? E - R * I(s) : -R * I(s); };
    const pasos = [
      { t: 'Cada tramo', html: `Mientras está conectada, I tiende a ε/R = ${u(I0, 'A')} con $τ = L/R$ = <b>${u(tau, 's')}</b>: $I = ε/R + (I_inicio − ε/R) e^{−t/τ}$. Al quitar la fuente, la bobina se descarga por R: $I = I_fin e^{−t/τ}$. Cada tramo empieza con la corriente con la que acabó el anterior, porque la corriente en una bobina no puede saltar.` },
      { t: 'Régimen permanente', html: `Tras unos ciclos, la corriente sube y baja siempre entre los mismos valores. Imponiendo que un ciclo termine como empieza: $I_máx = ε/R {1 − e^{−t_on/τ}}/{1 − e^{−T/τ}}$ = <b>${u(Imax, 'A')}</b> e $I_mín = I_máx e^{−t_off/τ}$ = <b>${u(Imin, 'A')}</b>, con T = ${u(P, 's')}.` },
      { t: 'Corriente media', html: `En un ciclo la tensión media en la bobina es 0, así que $R I_media = ε t_on/T$: I<sub>media</sub> = <b>${u(Imed, 'A')}</b> (${f((100 * ton) / P, 3)} % del tiempo conectada). Es la idea de la regulación por PWM. El rizado es $I_máx − I_mín$ = ${u(Imax - Imin, 'A')}${tau > 3 * P ? ', pequeño porque τ es mucho mayor que el periodo' : ''}.` },
    ];
    const res = { tau, I0, Imax, Imin, Imed };
    if (t !== null) { const s = t * 1e-3, i = I(s); Object.assign(res, { It: i, VLt: VL(s), VRt: R * i, Ut: 0.5 * L * i * i }); pasos.push({ t: `En t = ${f(t)} ms`, html: `Va por el ciclo ${Math.floor(s / P) + 1}, ${s - Math.floor(s / P) * P < ton ? 'conectada' : 'desconectada'}: I = <b>${u(i, 'A')}</b>, V<sub>L</sub> = ${u(VL(s), 'V')} y $U = 1/2 L I^2$ = ${u(0.5 * L * i * i, 'J')}.` }); }
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
    const N1 = lee(sc, 'N1', 'las espiras del primario'), N2 = lee(sc, 'N2', 'las espiras del secundario'), L1 = lee(sc, 'L1', 'la autoinducción del primario') * 1e-3;
    const k = lee(sc, 'k', 'el coeficiente de acoplamiento'), V1 = lee(sc, 'V1', 'la tensión del primario'), fr = lee(sc, 'fr', 'la frecuencia');
    const R1 = lee(sc, 'R1', 'la resistencia del primario', { cero: true }), R2 = lee(sc, 'R2', 'la resistencia del secundario', { cero: true }), RL = lee(sc, 'RL', 'la resistencia de carga');
    if (k > 1) throw new Error('El coeficiente de acoplamiento k no puede ser mayor que 1');
    const n = N2 / N1, L2 = L1 * n * n, M = k * Math.sqrt(L1 * L2), w = 2 * Math.PI * fr;
    const p = { N1, N2, L1, L2, M, k, V1, fr, R1, R2, RL }, r = trafoPunto(p, RL);
    const V1c = [V1, 0], vacio0 = cx.abs(cx.d([w * M * V1, 0], [R1, w * L1])), Vid = V1 * n, V2m = cx.abs(r.V2);
    const reg = (vacio0 - V2m) / vacio0, Pcu1 = R1 * cx.abs(r.I1) ** 2, Pcu2 = R2 * cx.abs(r.I2) ** 2, fp = r.Pin / (V1 * cx.abs(r.I1));
    const pasos = [
      { t: 'Inductancias y acoplamiento', html: `Con la misma geometría $L ∝ N^2$, así que $L_2 = L_1 (N_2/N_1)^2$ = ${u(L2, 'H')} y $M = k √(L_1 L_2)$ = <b>${u(M, 'H')}</b>. Flujo de dispersión: el ${f(100 * (1 - k), 3)} % del flujo de cada bobina no llega a la otra (L<sub>σ1</sub> = (1 − k) L<sub>1</sub> = ${u((1 - k) * L1, 'H')}).` },
      { t: 'Ecuaciones con fasores (ω = 2πf = ' + f(w) + ' rad/s)', html: `Primario: $V_1 = (R_1 + jωL_1) I_1 − jωM I_2$. Secundario, con la carga: $jωM I_1 = (R_2 + R_L + jωL_2) I_2$ y $V_2 = R_L I_2$.` },
      { t: 'Impedancia vista desde el primario', html: `$Z_e = R_1 + jωL_1 + {ω^2 M^2}/{R_2 + R_L + jωL_2}$ = ${f(r.Zin[0])} ${r.Zin[1] < 0 ? '−' : '+'} j ${f(Math.abs(r.Zin[1]))} Ω (|Z<sub>e</sub>| = ${f(cx.abs(r.Zin))} Ω, ${f(cx.fase(r.Zin), 3)}°). $I_1 = V_1/Z_e$ = <b>${u(cx.abs(r.I1), 'A')}</b>.` },
      { t: 'Secundario', html: `$I_2 = {jωM I_1}/{R_2 + R_L + jωL_2}$ = <b>${u(cx.abs(r.I2), 'A')}</b> y $V_2 = R_L I_2$ = <b>${u(V2m, 'V')}</b>, con la fase ${f(cx.fase(r.V2) - 0, 4)}° respecto a V<sub>1</sub>. Relación real $V_2/V_1$ = ${f(V2m / V1)} frente a la ideal $N_2/N_1$ = ${f(n)} (V<sub>2</sub> ideal = ${u(Vid, 'V')}).` },
      { t: 'Regulación', html: `En vacío ($R_L → ∞$) el secundario da $V_{20} = {ωM V_1}/{|R_1 + jωL_1|}$ = ${u(vacio0, 'V')}. Regulación $= (V_{20} − V_2)/V_{20}$ = <b>${f(100 * reg, 3)} %</b>: cuánto cae la tensión al conectar la carga.` },
      { t: 'Potencias y rendimiento', html: `$P_1 = V_1 |I_1| cos φ$ = ${u(r.Pin, 'W')} (cos φ = ${f(fp)}); $P_2 = R_L |I_2|^2$ = ${u(r.Pout, 'W')}. Pérdidas en el cobre: ${u(Pcu1, 'W')} en el primario y ${u(Pcu2, 'W')} en el secundario. Rendimiento $η = P_2/P_1$ = <b>${f(100 * r.eta, 4)} %</b>.` },
    ];
    const curva = () => { const pts = []; for (let i = 0; i <= 120; i++) { const RLx = RL * Math.pow(10, -1.5 + (3 * i) / 120), q = trafoPunto(p, RLx); pts.push([RLx, cx.abs(q.V2) / vacio0, q.eta]); } return pts; };
    const res = { M, L2, n, I1: cx.abs(r.I1), I2: cx.abs(r.I2), V2: V2m, Vid, relacion: V2m / V1, V20: vacio0, reg, eta: r.eta, Pin: r.Pin, Pout: r.Pout, Pcu1, Pcu2, fp, Zin: cx.abs(r.Zin) };
    return { p, res, pasos, curva, letras: 'η = {R_L |I_2|^2}/{V_1 |I_1| cos φ}' };
  }

  const ejemplos = {
    L: [
      { clave: 'solenoide', nombre: 'Solenoide de 500 espiras', sc: { geo: 'solenoide', N: '500', l: '20', r: '1', mur: '1', I: '2', dIdt: '100' } },
      { clave: 'solenoide-hierro', nombre: 'Solenoide con núcleo (μr = 800)', sc: { geo: 'solenoide', N: '300', l: '15', r: '1.5', mur: '800', I: '0.5' } },
      { clave: 'toroide-rect', nombre: 'Toroide de sección rectangular', sc: { geo: 'toroide-rect', N: '1000', a: '5', b: '8', h: '2', mur: '1', I: '1' } },
      { clave: 'toroide-circ', nombre: 'Toroide de sección circular', sc: { geo: 'toroide-circ', N: '200', R: '10', r: '2', mur: '1' } },
      { clave: 'coaxial', nombre: 'Cable coaxial, conductor interior macizo', sc: { geo: 'coaxial', l: '1', a: '1', b: '4', interior: 'macizo' } },
      { clave: 'entrehierro', nombre: 'Toroide de hierro con entrehierro', sc: { geo: 'entrehierro', N: '500', R: '10', S: '4', mur: '2000', g: '2', I: '1' } },
      { clave: 'bifilar', nombre: 'Línea bifilar', sc: { geo: 'bifilar', l: '1', d: '10', a: '1', interior: 'hueco' } },
    ],
    M: [
      { clave: 'solenoides', nombre: 'Solenoide dentro de otro', sc: { geo: 'solenoides', N1: '200', r1: '1', N2: '1000', r2: '2', l: '40', dI1dt: '50' } },
      { clave: 'espiras', nombre: 'Espira pequeña en el centro de una grande', sc: { geo: 'espiras', N1: '1', R: '20', N2: '10', r: '1', dI1dt: '1000' } },
      { clave: 'espiras-coaxiales', nombre: 'Dos espiras coaxiales a una distancia', sc: { geo: 'espiras-coaxiales', N1: '100', R: '10', N2: '20', r: '1', z: '10', dI1dt: '50' } },
      { clave: 'espira-solenoide', nombre: 'Bobina girada dentro de un solenoide', sc: { geo: 'espira-solenoide', N1: '1000', l: '50', N2: '30', r: '1', th: '60', dI1dt: '100' } },
      { clave: 'hilo-espira', nombre: 'Hilo y espira rectangular', sc: { geo: 'hilo-espira', d: '5', w: '10', h: '20', N2: '1', dI1dt: '200' } },
      { clave: 'toroide-bobina', nombre: 'Bobina sobre un toroide (k = 1)', sc: { geo: 'toroide-bobina', N1: '500', N2: '50', a: '4', b: '6', h: '2', I1: '2', I2: '1', sentido: 'aditivo' } },
      { clave: 'acoplamiento', nombre: 'Bobinas acopladas en serie y en paralelo', sc: { geo: 'acoplamiento', L1: '2', L2: '8', k: '0.5' } },
    ],
    F: [
      { clave: 'f-atraen', nombre: 'Dos espiras con corrientes paralelas: se atraen', sc: { N1: '1', R: '10', N2: '1', r: '5', z: '5', I1: '100', I2: '50' } },
      { clave: 'f-repelen', nombre: 'Corrientes opuestas: se repelen (anillo que levita)', sc: { N1: '200', R: '10', N2: '1', r: '5', z: '3', I1: '10', I2: '-300' } },
      { clave: 'f-lejos', nombre: 'Espira pequeña lejos: límite de dipolo', sc: { N1: '100', R: '10', N2: '20', r: '1', z: '40', I1: '2', I2: '1' } },
    ],
    T: [
      { clave: 't-red', nombre: 'Transformador de red 230 V → 23 V', sc: { N1: '1000', N2: '100', L1: '10000', k: '0.98', V1: '230', fr: '50', R1: '2', R2: '0.02', RL: '5' } },
      { clave: 't-flojo', nombre: 'Acoplamiento flojo (k = 0,6), como un cargador inalámbrico', sc: { N1: '20', N2: '20', L1: '0.024', k: '0.6', V1: '5', fr: '100000', R1: '0.5', R2: '0.5', RL: '10' } },
      { clave: 't-vacio', nombre: 'Casi en vacío: regulación y rendimiento', sc: { N1: '500', N2: '1500', L1: '4000', k: '0.99', V1: '100', fr: '50', R1: '1', R2: '9', RL: '5000' } },
    ],
    RL: [
      { clave: 'carga', nombre: 'Se cierra el interruptor', sc: { E: '12', R: '6', L: '300', modo: 'carga', t: '50' } },
      { clave: 'descarga', nombre: 'La bobina se descarga por la resistencia', sc: { E: '10', R: '100', L: '500', modo: 'descarga', t: '2' } },
      { clave: 'pulsos', nombre: 'Se conecta y desconecta una y otra vez', sc: { E: '12', R: '10', L: '50', modo: 'pulsos', ton: '5', toff: '5', t: '' } },
    ],
  };

  return { autoinduccion, mutua, rl, fuerza, transformador, mutuaExacta, elip, GEO_L, GEO_M, ejemplos, f, u, MU0 };
})();

