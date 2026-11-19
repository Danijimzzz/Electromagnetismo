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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} fehlt`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine Zahl sein`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss ${cero ? 'positiv oder null' : 'größer als 0'} sein`);
    return v;
  };

  const GEO_L = {
    solenoide: {
      nombre: 'Lange Spule (Solenoid)', campos: [['N', 'Windungszahl N', '', 1], ['l', 'Länge l', 'cm', 1e-2], ['r', 'Radius r', 'cm', 1e-2], ['mur', 'Relative Permeabilität μ<sub>r</sub>', '', 1]],
      calc: ({ N, l, r, mur }) => {
        const S = Math.PI * r * r, L = (MU0 * mur * N * N * S) / l;
        return { L, pasos: [
          { t: 'Feld im Inneren der Spule (Ampère)', html: `$B = {μ_0 μ_r N I}/l$, innen homogen und außen null (wenn l ≫ r).` },
          { t: 'Eigenfluss', html: `$Φ = N B S = {μ_0 μ_r N^2 S I}/l$, mit $S = π r^2$ = ${f(S)} m<sup>2</sup>.` },
          { t: 'Selbstinduktionskoeffizient', html: `$L = Φ/I = {μ_0 μ_r N^2 π r^2}/l = {4π·10^{−7} · ${f(mur)} · ${f(N)}^2 · ${f(S)}}/{${f(l)}}$ = <b>${u(L, 'H')}</b>` },
        ], B1: (MU0 * mur * N) / l, letras: 'L = {μ_0 μ_r N^2 π r^2}/l' };
      },
    },
    'toroide-rect': {
      nombre: 'Toroid mit rechteckigem Querschnitt', campos: [['N', 'Windungszahl N', '', 1], ['a', 'Innenradius a', 'cm', 1e-2], ['b', 'Außenradius b', 'cm', 1e-2], ['h', 'Höhe h', 'cm', 1e-2], ['mur', 'Relative Permeabilität μ<sub>r</sub>', '', 1]],
      valida: ({ a, b }) => { if (b <= a) throw new Error('Der Außenradius muss größer sein als der Innenradius'); },
      calc: ({ N, a, b, h, mur }) => {
        const L = (MU0 * mur * N * N * h * Math.log(b / a)) / (2 * Math.PI);
        return { L, pasos: [
          { t: 'Feld im Inneren des Toroids (Ampère)', html: `$B(r) = {μ_0 μ_r N I}/{2π r}$, für a < r < b.` },
          { t: 'Fluss durch eine Windung', html: `$Φ_1 = ∫_a^b B h dr = {μ_0 μ_r N I h ln(b/a)}/{2π}$, mit ln(b/a) = ln(${f(b / a)}) = ${f(Math.log(b / a))}.` },
          { t: 'Selbstinduktionskoeffizient', html: `$L = {N Φ_1}/I = {μ_0 μ_r N^2 h ln(b/a)}/{2π} = 2·10^{−7} · ${f(mur)} · ${f(N)}^2 · ${f(h)} · ${f(Math.log(b / a))}$ = <b>${u(L, 'H')}</b>` },
        ], letras: 'L = {μ_0 μ_r N^2 h}/{2π} ln(b/a)' };
      },
    },
    'toroide-circ': {
      nombre: 'Toroid mit kreisförmigem Querschnitt', campos: [['N', 'Windungszahl N', '', 1], ['R', 'Mittlerer Radius R', 'cm', 1e-2], ['r', 'Radius des Querschnitts r', 'cm', 1e-2], ['mur', 'Relative Permeabilität μ<sub>r</sub>', '', 1]],
      valida: ({ R, r }) => { if (r >= R) throw new Error('Der Radius des Querschnitts muss kleiner sein als der mittlere Radius'); },
      calc: ({ N, R, r, mur }) => {
        const L = MU0 * mur * N * N * (R - Math.sqrt(R * R - r * r)), La = (MU0 * mur * N * N * r * r) / (2 * R);
        return { L, pasos: [
          { t: 'Feld im Inneren des Toroids (Ampère)', html: `$B(ρ) = {μ_0 μ_r N I}/{2π ρ}$, im Abstand ρ von der Achse.` },
          { t: 'Selbstinduktionskoeffizient', html: `Integration des Flusses über den Kreisquerschnitt: $L = μ_0 μ_r N^2 (R − √(R^2 − r^2))$ = <b>${u(L, 'H')}</b>` },
          { t: 'Näherung für den dünnen Toroid', html: `Für r ≪ R ist B nahezu homogen und $L ≈ {μ_0 μ_r N^2 π r^2}/{2π R}$ = ${u(La, 'H')} (weicht um ${f(100 * Math.abs(La / L - 1), 2)} % ab).` },
        ], letras: 'L = μ_0 μ_r N^2 (R − √(R^2 − r^2))' };
      },
    },
    entrehierro: {
      nombre: 'Toroid mit Luftspalt', campos: [['N', 'Windungszahl N', '', 1], ['R', 'Mittlerer Radius R', 'cm', 1e-2], ['S', 'Querschnitt S', 'cm²', 1e-4], ['mur', 'Relative Permeabilität des Kerns μ<sub>r</sub>', '', 1], ['g', 'Luftspalt g', 'mm', 1e-3]],
      valida: ({ R, g }) => { if (g >= 2 * Math.PI * R) throw new Error('Der Luftspalt darf nicht länger sein als der Toroid'); },
      calc: ({ N, R, S, mur, g }) => {
        const lc = 2 * Math.PI * R - g, Rn = lc / (MU0 * mur * S), Rg = g / (MU0 * S), Rt = Rn + Rg, L = (N * N) / Rt, L0 = (MU0 * mur * N * N * S) / (2 * Math.PI * R);
        return { L, pasos: [
          { t: 'Ampère\'sches Gesetz', html: `Entlang der Mittellinie des Toroids: $H_n l_n + H_g g = N I$, mit $l_n = 2πR − g$ = ${f(lc)} m Kern. Ohne Streuung ist B im Kern und im Spalt gleich: $H_n = B/(μ_0 μ_r)$ und $H_g = B/μ_0$, also $B = {μ_0 N I}/{l_n/μ_r + g}$.` },
          { t: 'Reluktanzen', html: `Wie in einer Reihenschaltung: $ℛ_n = {l_n}/{μ_0 μ_r S}$ = ${f(Rn)} A/Wb und $ℛ_g = g/(μ_0 S)$ = ${f(Rg)} A/Wb. Gesamt ℛ = <b>${f(Rt)} A/Wb</b>${Rg > Rn ? `: der Luftspalt, obwohl er nur ${f(g * 1000)} mm misst, wiegt schwerer als der ganze Kern` : ''}.` },
          { t: 'Selbstinduktionskoeffizient', html: `Φ = N I/ℛ pro Windung, und $L = {N Φ}/I = N^2/ℛ = ${f(N)}^2/{${f(Rt)}}$ = <b>${u(L, 'H')}</b>. Ohne Luftspalt wäre es $ {μ_0 μ_r N^2 S}/{2π R}$ = ${u(L0, 'H')}, ${f(L0 / L, 3)}-mal mehr.` },
        ], B1: N / (Rt * S), letras: 'L = {μ_0 N^2 S}/{(2π R − g)/μ_r + g}' };
      },
    },
    coaxial: {
      nombre: 'Koaxialkabel', campos: [['l', 'Länge l', 'm', 1], ['a', 'Radius des Innenleiters a', 'mm', 1e-3], ['b', 'Radius des Außenleiters b', 'mm', 1e-3]], interior: true,
      valida: ({ a, b }) => { if (b <= a) throw new Error('Der Außenradius muss größer sein als der Innenradius'); },
      calc: ({ l, a, b, macizo }) => {
        const Le = (MU0 * l * Math.log(b / a)) / (2 * Math.PI), Li = macizo ? (MU0 * l) / (8 * Math.PI) : 0, L = Le + Li;
        const pasos = [
          { t: 'Feld zwischen den Leitern (Ampère)', html: `$B(r) = {μ_0 I}/{2π r}$, für a < r < b; außerhalb des Kabels ist B = 0.` },
          { t: 'Äußerer Anteil', html: `$Φ = ∫_a^b B l dr = {μ_0 I l ln(b/a)}/{2π}$ ⇒ $L_ext = {μ_0 l ln(b/a)}/{2π} = 2·10^{−7} · ${f(l)} · ln(${f(b / a)})$ = <b>${u(Le, 'H')}</b>` },
        ];
        if (macizo) pasos.push({ t: 'Innerer Anteil (massiver Leiter)', html: `Im Leiter gilt $B = {μ_0 I r}/{2π a^2}$. Über die Energie, $1/2 L_int I^2 = ∫ B^2/(2μ_0) dV$ ⇒ $L_int = {μ_0 l}/{8π}$ = ${u(Li, 'H')}. Gesamt: L = <b>${u(L, 'H')}</b>` });
        pasos.push({ t: 'Pro Längeneinheit', html: `$L/l$ = <b>${u(L / l, 'H/m')}</b>` });
        return { L, pasos, letras: macizo ? 'L = {μ_0 l}/{2π} (ln(b/a) + 1/4)' : 'L = {μ_0 l}/{2π} ln(b/a)' };
      },
    },
    bifilar: {
      nombre: 'Zweidrahtleitung', campos: [['l', 'Länge l', 'm', 1], ['d', 'Achsabstand d', 'mm', 1e-3], ['a', 'Radius jedes Drahts a', 'mm', 1e-3]], interior: true,
      valida: ({ d, a }) => { if (d <= 2 * a) throw new Error('Die Drähte berühren sich: Der Achsabstand muss größer als 2a sein'); },
      calc: ({ l, d, a, macizo }) => {
        const Le = (MU0 * l * Math.log((d - a) / a)) / Math.PI, Li = macizo ? (MU0 * l) / (4 * Math.PI) : 0, L = Le + Li;
        const pasos = [
          { t: 'Feld zwischen den Drähten', html: `Jeder Draht erzeugt $B = {μ_0 I}/{2π r}$ und zwischen ihnen addieren sich die beiden Felder: $B(x) = {μ_0 I}/{2π} (1/x + 1/(d − x))$.` },
          { t: 'Fluss zwischen den Drähten', html: `$Φ = ∫_a^{d−a} B l dx = {μ_0 I l}/π ln({d − a}/a)$ ⇒ $L_ext = {μ_0 l}/π ln({d − a}/a) = 4·10^{−7} · ${f(l)} · ln(${f((d - a) / a)})$ = <b>${u(Le, 'H')}</b>${d > 20 * a ? ` ($≈ {μ_0 l}/π ln(d/a)$, da d ≫ a)` : ''}` },
        ];
        if (macizo) pasos.push({ t: 'Innerer Anteil (massive Drähte)', html: `Jeder Draht trägt $ {μ_0 l}/{8π}$ bei: $L_int = {μ_0 l}/{4π}$ = ${u(Li, 'H')}. Gesamt: L = <b>${u(L, 'H')}</b>` });
        pasos.push({ t: 'Pro Längeneinheit', html: `$L/l$ = <b>${u(L / l, 'H/m')}</b>` });
        return { L, pasos, letras: macizo ? 'L = {μ_0 l}/π (ln({d − a}/a) + 1/4)' : 'L = {μ_0 l}/π ln({d − a}/a)' };
      },
    },
  };

  const GEO_M = {
    solenoides: {
      nombre: 'Zwei koaxiale Zylinderspulen', campos: [['N1', 'Windungen der inneren Spule N<sub>1</sub>', '', 1], ['r1', 'Radius der inneren Spule r<sub>1</sub>', 'cm', 1e-2], ['N2', 'Windungen der äußeren Spule N<sub>2</sub>', '', 1], ['r2', 'Radius der äußeren Spule r<sub>2</sub>', 'cm', 1e-2], ['l', 'Gemeinsame Länge l', 'cm', 1e-2]],
      valida: ({ r1, r2 }) => { if (r1 > r2) throw new Error('Die innere Spule darf nicht breiter sein als die äußere'); },
      calc: ({ N1, r1, N2, r2, l }) => {
        const S1 = Math.PI * r1 * r1, M = (MU0 * N1 * N2 * S1) / l, L1 = (MU0 * N1 * N1 * S1) / l, L2 = (MU0 * N2 * N2 * Math.PI * r2 * r2) / l;
        return { M, L1, L2, pasos: [
          { t: 'Feld der äußeren Spule', html: `Mit einem Strom I<sub>2</sub> in der äußeren Spule gilt $B_2 = {μ_0 N_2 I_2}/l$ in ihrem Inneren, auch innerhalb der inneren Spule.` },
          { t: 'Fluss in der inneren Spule', html: `$Φ_12 = N_1 B_2 π r_1^2 = {μ_0 N_1 N_2 π r_1^2 I_2}/l$ (nur der Querschnitt der inneren Spule zählt).` },
          { t: 'Gegeninduktionskoeffizient', html: `$M = {Φ_12}/{I_2} = {μ_0 N_1 N_2 π r_1^2}/l = {4π·10^{−7} · ${f(N1)} · ${f(N2)} · ${f(S1)}}/{${f(l)}}$ = <b>${u(M, 'H')}</b>. Dasselbe ergibt sich, wenn man den Fluss der inneren Spule in der äußeren berechnet ($M_12 = M_21$).` },
          { t: 'Kopplungsfaktor', html: `$L_1 = {μ_0 N_1^2 π r_1^2}/l$ = ${u(L1, 'H')}, $L_2 = {μ_0 N_2^2 π r_2^2}/l$ = ${u(L2, 'H')} ⇒ $k = M/√(L_1 L_2) = {r_1}/{r_2}$ = <b>${f(M / Math.sqrt(L1 * L2))}</b>` },
        ], letras: 'M = {μ_0 N_1 N_2 π r_1^2}/l' };
      },
    },
    espiras: {
      nombre: 'Kleine Leiterschleife in der Mitte einer großen', campos: [['N1', 'Windungen der großen Schleife N<sub>1</sub>', '', 1], ['R', 'Radius der großen Schleife R', 'cm', 1e-2], ['N2', 'Windungen der kleinen Schleife N<sub>2</sub>', '', 1], ['r', 'Radius der kleinen Schleife r', 'cm', 1e-2]],
      valida: ({ R, r }) => { if (r >= R) throw new Error('Die kleine Leiterschleife muss einen kleineren Radius haben als die große'); },
      calc: ({ N1, R, N2, r }) => {
        const M = (MU0 * N1 * N2 * Math.PI * r * r) / (2 * R);
        return { M, pasos: [
          { t: 'Feld im Zentrum der großen Schleife', html: `$B_1 = {μ_0 N_1 I_1}/{2R}$ (Biot-Savart im Zentrum der Schleife).` },
          { t: 'Fluss in der kleinen Schleife', html: `Für r ≪ R ist das Feld über der kleinen Schleife nahezu homogen: $Φ_21 = N_2 B_1 π r^2$.` },
          { t: 'Gegeninduktionskoeffizient', html: `$M = {Φ_21}/{I_1} = {μ_0 N_1 N_2 π r^2}/{2R}$ = <b>${u(M, 'H')}</b>${r > 0.2 * R ? '. Ojo: r no es mucho menor que R, así que es una aproximación gruesa.' : ''}` },
        ], letras: 'M = {μ_0 N_1 N_2 π r^2}/{2R}' };
      },
    },
    'espiras-coaxiales': {
      nombre: 'Zwei koaxiale Leiterschleifen im Abstand', campos: [['N1', 'Windungen der großen Schleife N<sub>1</sub>', '', 1], ['R', 'Radius der großen Schleife R', 'cm', 1e-2], ['N2', 'Windungen der kleinen Schleife N<sub>2</sub>', '', 1], ['r', 'Radius der kleinen Schleife r', 'cm', 1e-2], ['z', 'Abstand zwischen den Mittelpunkten z', 'cm', 1e-2]],
      valida: ({ R, r }) => { if (r > R) throw new Error('Nimm als Schleife 1 die mit dem größeren Radius'); },
      calc: ({ N1, R, N2, r, z }) => {
        const D = Math.pow(R * R + z * z, 1.5), M = (MU0 * N1 * N2 * Math.PI * R * R * r * r) / (2 * D);
        return { M, pasos: [
          { t: 'Feld der großen Schleife auf ihrer Achse', html: `$B_1(z) = {μ_0 N_1 I_1 R^2}/{2 (R^2 + z^2)^{3/2}}$ (Biot-Savart), mit $(R^2 + z^2)^{3/2}$ = ${f(D)} m<sup>3</sup>.` },
          { t: 'Fluss in der kleinen Schleife', html: `Ist die kleine Schleife klein gegenüber dem Abstand zu den Drähten der großen, ist B<sub>1</sub> über ihr nahezu homogen: $Φ_21 = N_2 B_1 π r^2$.` },
          { t: 'Gegeninduktionskoeffizient', html: `$M = {μ_0 π N_1 N_2 R^2 r^2}/{2 (R^2 + z^2)^{3/2}}$ = <b>${u(M, 'H')}</b>. Für z ≫ R fällt es wie 1/z<sup>3</sup> ab, genau wie das Feld eines Dipols.${r > 0.3 * Math.sqrt(R * R + z * z) ? ' Achtung: r ist nicht klein gegenüber √(R² + z²), es ist also eine grobe Näherung.' : ''}` },
        ], letras: 'M = {μ_0 π N_1 N_2 R^2 r^2}/{2 (R^2 + z^2)^{3/2}}' };
      },
    },
    'espira-solenoide': {
      nombre: 'Leiterschleife oder Spule im Inneren einer Zylinderspule', campos: [['N1', 'Windungen der Zylinderspule N<sub>1</sub>', '', 1], ['l', 'Länge der Zylinderspule l', 'cm', 1e-2], ['N2', 'Windungen der Spule N<sub>2</sub>', '', 1], ['r', 'Radius der Spule r', 'cm', 1e-2], ['th', 'Winkel zwischen den Achsen θ', '°', 1]],
      valida: ({ th }) => { if (th > 180) throw new Error('Der Winkel zwischen den Achsen muss zwischen 0° und 180° liegen'); },
      calc: ({ N1, l, N2, r, th }) => {
        const c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180), M = (MU0 * N1 * N2 * Math.PI * r * r * c) / l;
        return { M, pasos: [
          { t: 'Feld der Zylinderspule', html: `$B_1 = {μ_0 N_1 I_1}/l$, im Inneren homogen (die Spule muss hineinpassen und weit von den Enden entfernt sein).` },
          { t: 'Fluss in der Spule', html: `$Φ_21 = N_2 B_1 π r^2 cos θ$: Nur die zur Spule senkrechte Komponente von B zählt.` },
          { t: 'Gegeninduktionskoeffizient', html: `$M = {μ_0 N_1 N_2 π r^2 cos θ}/l = {4π·10^{−7} · ${f(N1)} · ${f(N2)} · π·${f(r)}^2${th ? ` · cos ${f(th)}°` : ''}}/{${f(l)}}$ = <b>${u(M, 'H')}</b>${c === 0 ? ': bei senkrechten Achsen gibt es keine Kopplung' : ''}. Beim Drehen der Spule ändert sich M wie cos θ (so funktioniert ein Generator).` },
        ], letras: 'M = {μ_0 N_1 N_2 π r^2 cos θ}/l' };
      },
    },
    'hilo-espira': {
      nombre: 'Gerader Draht und koplanare rechteckige Leiterschleife', campos: [['d', 'Abstand des Drahts zur nahen Seite d', 'cm', 1e-2], ['w', 'Breite der Leiterschleife w', 'cm', 1e-2], ['h', 'Seite parallel zum Draht h', 'cm', 1e-2], ['N2', 'Windungen der Leiterschleife N', '', 1]],
      calc: ({ d, w, h, N2 }) => {
        const M = (MU0 * N2 * h * Math.log((d + w) / d)) / (2 * Math.PI);
        return { M, pasos: [
          { t: 'Feld des Drahtes', html: `$B(x) = {μ_0 I}/{2π x}$, senkrecht zur Ebene der Leiterschleife.` },
          { t: 'Fluss in der Schleife', html: `$Φ = N ∫_d^{d+w} {μ_0 I h}/{2π x} dx = {μ_0 N I h}/{2π} ln({d + w}/d)$, mit ln(${f((d + w) / d)}) = ${f(Math.log((d + w) / d))}.` },
          { t: 'Gegeninduktionskoeffizient', html: `$M = Φ/I = {μ_0 N h}/{2π} ln({d + w}/d) = 2·10^{−7} · ${f(N2)} · ${f(h)} · ${f(Math.log((d + w) / d))}$ = <b>${u(M, 'H')}</b>` },
        ], letras: 'M = {μ_0 N h}/{2π} ln({d + w}/d)' };
      },
    },
    'toroide-bobina': {
      nombre: 'Auf einen Toroid gewickelte Spule', campos: [['N1', 'Windungen des Toroids N<sub>1</sub>', '', 1], ['N2', 'Windungen der Spule N<sub>2</sub>', '', 1], ['a', 'Innenradius a', 'cm', 1e-2], ['b', 'Außenradius b', 'cm', 1e-2], ['h', 'Höhe h', 'cm', 1e-2]],
      valida: ({ a, b }) => { if (b <= a) throw new Error('Der Außenradius muss größer sein als der Innenradius'); },
      calc: ({ N1, N2, a, b, h }) => {
        const M = (MU0 * N1 * N2 * h * Math.log(b / a)) / (2 * Math.PI), L1 = (MU0 * N1 * N1 * h * Math.log(b / a)) / (2 * Math.PI), L2 = (MU0 * N2 * N2 * h * Math.log(b / a)) / (2 * Math.PI);
        return { M, L1, L2, pasos: [
          { t: 'Feld des Toroids', html: `$B(r) = {μ_0 N_1 I_1}/{2π r}$ im Inneren des Kerns.` },
          { t: 'Fluss in der Spule', html: `Die Spule umschließt den ganzen Kern: $Φ_21 = N_2 {μ_0 N_1 I_1 h}/{2π} ln(b/a)$.` },
          { t: 'Gegeninduktionskoeffizient', html: `$M = {μ_0 N_1 N_2 h}/{2π} ln(b/a)$ = <b>${u(M, 'H')}</b>. Beide Spulen teilen sich den gesamten Fluss, also ist $k = M/√(L_1 L_2)$ = <b>1</b> (L<sub>1</sub> = ${u(L1, 'H')}, L<sub>2</sub> = ${u(L2, 'H')}).` },
        ], letras: 'M = {μ_0 N_1 N_2 h}/{2π} ln(b/a)' };
      },
    },
    acoplamiento: {
      nombre: 'Ausgehend von L₁, L₂ und k', campos: [['L1', 'L<sub>1</sub>', 'mH', 1e-3], ['L2', 'L<sub>2</sub>', 'mH', 1e-3], ['k', 'Kopplungsfaktor k', '', 1]],
      valida: ({ k }) => { if (k > 1) throw new Error('Der Kopplungsfaktor darf nicht größer als 1 sein'); },
      calc: ({ L1, L2, k }) => {
        const M = k * Math.sqrt(L1 * L2);
        return { M, L1, L2, pasos: [{ t: 'Gegeninduktionskoeffizient', html: `$M = k √(L_1 L_2) = ${f(k)} · √(${f(L1)} · ${f(L2)})$ = <b>${u(M, 'H')}</b>` }], letras: 'M = k √(L_1 L_2)' };
      },
    },
  };

  function leerGeo(G, sc) {
    const p = {};
    for (const [k, nom, un, fac] of G.campos) {
      const n = nom.replace(/<[^>]+>/g, '');
      p[k] = lee(sc, k, n.toLowerCase(), { cero: k === 'th' }) * fac;
      if ((k === 'N' || k === 'N1' || k === 'N2') && !Number.isInteger(p[k])) throw new Error(`${n} muss eine ganze Zahl sein`);
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
      pasos.push({ t: `Mit I = ${f(I)} A`, html: `Eigenfluss $Φ = L I$ = <b>${u(res.flujo, 'Wb')}</b> · magnetische Energie $U = 1/2 L I^2 = 1/2 · ${f(L)} · ${f(I)}^2$ = <b>${u(res.U, 'J')}</b>${r.B1 ? `<br>Feld ${sc.geo === 'entrehierro' ? 'im Kern und im Spalt' : 'im Inneren'}: ${sc.geo === 'entrehierro' ? '$B = {N I}/{ℛ S}$' : '$B = {μ_0 μ_r N I}/l$'} = ${u(r.B1 * I, 'T')}; die Energie ergibt sich auch aus $u = B^2/(2μ)$ mal dem Volumen.` : ''}` });
    }
    if (dI !== null) {
      res.fem = -L * dI;
      pasos.push({ t: `Wenn sich der Strom mit dI/dt = ${f(dI)} A/s ändert`, html: `$ε = −L {dI}/{dt} = −${f(L)} · ${f(dI)}$ = <b>${f(res.fem)} V</b>${dI ? `, die der ${dI > 0 ? 'Zunahme' : 'Abnahme'} des Stroms entgegenwirkt (Lenz'sche Regel)` : ''}.` });
    }
    return { G, p, res, pasos, letras: r.letras };
  }

  function mutua(sc) {
    const G = GEO_M[sc.geo] || GEO_M.solenoides, p = leerGeo(G, sc);
    const r = G.calc(p), { M } = r, pasos = [...r.pasos], res = { M, L1: r.L1, L2: r.L2 };
    const I1 = lee(sc, 'I1', 'die Stromstärke I₁', { opcional: true, signo: true }), dI = lee(sc, 'dI1dt', 'dI₁/dt', { opcional: true, signo: true });
    if (I1 !== null) { res.flujo = M * I1; pasos.push({ t: `Mit I<sub>1</sub> = ${f(I1)} A`, html: `Fluss in Stromkreis 2: $Φ_21 = M I_1$ = <b>${u(res.flujo, 'Wb')}</b>` }); }
    if (dI !== null) { res.fem = -M * dI; pasos.push({ t: `Wenn sich I<sub>1</sub> mit ${f(dI)} A/s ändert`, html: `induzierte EMK in Stromkreis 2: $ε_2 = −M {dI_1}/{dt} = −${f(M)} · ${f(dI)}$ = <b>${f(res.fem)} V</b>` }); }
    if (r.L1 !== undefined) {
      const { L1, L2 } = r, D = L1 * L2 - M * M;
      Object.assign(res, { Ls: L1 + L2 + 2 * M, Lso: L1 + L2 - 2 * M, Lp: D / (L1 + L2 - 2 * M), Lpo: D / (L1 + L2 + 2 * M) });
      pasos.push({ t: 'In Reihe geschaltete Spulen', html: `Bei sich addierenden Flüssen (gleichsinnige Anschlüsse hintereinander): $L = L_1 + L_2 + 2M$ = <b>${u(res.Ls, 'H')}</b>. Bei entgegengesetzten Flüssen: $L = L_1 + L_2 − 2M$ = <b>${u(res.Lso, 'H')}</b>. Misst man beide, erhält man $M = {L_Summe − L_Gegen}/4$.` });
      pasos.push({ t: 'Parallel geschaltete Spulen', html: `$L = {L_1 L_2 − M^2}/{L_1 + L_2 ∓ 2M}$: bei sich addierenden Flüssen <b>${u(res.Lp, 'H')}</b>; bei entgegengesetzten Flüssen <b>${u(res.Lpo, 'H')}</b>.${Math.abs(D) < 1e-12 * L1 * L2 ? ' Bei k = 1 ist der Zähler 0: Parallel geschaltet und gut gekoppelt verhalten sie sich wie eine einzige Spule ohne zusätzliche, entgegenwirkende Induktivität.' : ''}` });
    }
    const I2 = lee(sc, 'I2', 'die Stromstärke I₂', { opcional: true, signo: true });
    if (I1 !== null && I2 !== null && r.L1 !== undefined) {
      const s = sc.sentido === 'opuesto' ? -1 : 1;
      res.U = 0.5 * r.L1 * I1 * I1 + 0.5 * r.L2 * I2 * I2 + s * M * I1 * I2;
      pasos.push({ t: 'Energie der beiden Stromkreise', html: `$U = 1/2 L_1 I_1^2 + 1/2 L_2 I_2^2 ${s > 0 ? '+' : '−'} M I_1 I_2$ (Flüsse ${s > 0 ? 'sich addierend' : 'entgegengesetzt'}) = <b>${u(res.U, 'J')}</b>` });
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
    const G = { campos: [['N1', 'Windungen der großen Schleife N<sub>1</sub>', '', 1], ['R', 'Radius der großen Schleife R', 'cm', 1e-2], ['N2', 'Windungen der kleinen Schleife N<sub>2</sub>', '', 1], ['r', 'Radius der kleinen Schleife r', 'cm', 1e-2], ['z', 'Abstand z zwischen den Ebenen', 'cm', 1e-2]] };
    const p = leerGeo(G, sc), I1 = lee(sc, 'I1', 'die Stromstärke I₁', { signo: true }), I2 = lee(sc, 'I2', 'die Stromstärke I₂', { signo: true });
    const { N1, R, N2, r, z } = p, N = N1 * N2, k2 = (4 * R * r) / ((R + r) ** 2 + z * z), M = N * mutuaExacta(R, r, z), dM = N * dMdz(R, r, z), F = I1 * I2 * dM;
    const Md = (MU0 * N * Math.PI * R * R * r * r) / (2 * Math.pow(R * R + z * z, 1.5)), dMd = (-3 * MU0 * N * Math.PI * R * R * r * r * z) / (2 * Math.pow(R * R + z * z, 2.5)), Fd = I1 * I2 * dMd;
    const curva = (n = 200) => { const zm = 4 * Math.max(R, z); return Array.from({ length: n + 1 }, (_, i) => { const zz = 1e-3 * R + (zm * i) / n; return [zz, I1 * I2 * N * dMdz(R, r, zz)]; }); };
    let zmax = 0, Fm = 0; for (const [zz, ff] of curva(400)) if (Math.abs(ff) > Fm) { Fm = Math.abs(ff); zmax = zz; }
    const sentido = F === 0 ? 'es gibt keine Kraft' : F < 0 ? 'se atraen' : 'se repelen';
    const pasos = [
      { t: 'Energie und Kraft', html: `Die Wechselwirkungsenergie zweier Stromkreise mit festen Strömen ist $U = M I_1 I_2$ und die Kraft, die die Ströme aufrechterhält, ist $F = I_1 I_2 {dM}/{dz}$ (bei eingeprägten Strömen verdoppelt die Arbeit der Quellen die Energieänderung und es ergibt sich $F = +∇U$). Sind die Ströme parallel, sinkt M mit wachsendem Abstand (dM/dz < 0) und die Leiterschleifen <b>ziehen sich an</b>; sind sie entgegengesetzt, <b>stoßen sie sich ab</b>.` },
      { t: 'Exakte Gegeninduktivität', html: `Für zwei koaxiale Leiterschleifen (Neumann), mit $k^2 = {4Rr}/{(R + r)^2 + z^2}$ = ${f(k2)}: $M = μ_0 √(R r) [(2/k − k) K(k) − (2/k) E(k)]$ pro Windungspaar. Mit N<sub>1</sub>N<sub>2</sub> = ${f(N)} Windungspaaren ist $M$ = <b>${u(M, 'H')}</b>.` },
      { t: 'Ableitung von M', html: `$dM/dz$ = <b>${f(dM)} H/m</b> (Ableitung der exakten Formel).` },
      { t: 'Kraft', html: `$F = I_1 I_2 dM/dz = ${f(I1)} · ${f(I2)} · (${f(dM)})$ = <b>${u(F, 'N')}</b>: Die Leiterschleifen <b>${sentido}</b>.` },
      { t: 'Vergleich mit dem Dipol', html: `Behandelt man die kleine Schleife als Dipol $m_2 = N_2 I_2 π r^2$ im Achsenfeld der großen, ist $M ≈ {μ_0 π N_1 N_2 R^2 r^2}/{2(R^2 + z^2)^{3/2}}$ = ${u(Md, 'H')} und $F ≈ −{3 μ_0 π N_1 N_2 I_1 I_2 R^2 r^2 z}/{2(R^2 + z^2)^{5/2}}$ = ${u(Fd, 'N')}, ${f(Math.abs(Fd / F - 1) * 100, 3)} % ${Math.abs(Fd) >= Math.abs(F) ? 'mehr' : 'weniger'} als der exakte Wert.` },
      { t: 'Wo sie maximal ist', html: `Im Diagramm ist die Kraft maximal bei $z$ ≈ <b>${f(zmax * 100)} cm</b> (${u(Fm, 'N')}); für eine kleine Leiterschleife tritt das nahe $z = R/2$ auf und in großer Entfernung fällt sie wie $1/z^4$ ab.` },
    ];
    return { p: { ...p, I1, I2 }, res: { M, dM, F, Md, Fd, zmax, Fmax: Fm, sentido }, pasos, curva, letras: 'F = I_1 I_2 {dM}/{dz}' };
  }

  function rl(sc) {
    const E = lee(sc, 'E', 'die EMK der Quelle'), R = lee(sc, 'R', 'la resistencia'), L = lee(sc, 'L', 'die Selbstinduktivität') * 1e-3;
    const t = lee(sc, 't', 'el instante', { opcional: true, cero: true }), carga = sc.modo !== 'descarga';
    if (sc.modo === 'pulsos') return pulsos(sc, E, R, L, t);
    const tau = L / R, I0 = E / R;
    const I = (s) => (carga ? I0 * (1 - Math.exp(-s / tau)) : I0 * Math.exp(-s / tau));
    const VL = (s) => (carga ? E * Math.exp(-s / tau) : -E * Math.exp(-s / tau));
    const pasos = [
      { t: 'Gleichung des Stromkreises', html: carga ? `Beim Schließen des Schalters: $ε = R I + L {dI}/{dt} ⇒ I(t) = ε/R (1 − e^{−t/τ})$` : `Beim Abklemmen der Quelle (die Spule entlädt sich über R): $0 = R I + L {dI}/{dt} ⇒ I(t) = I_0 e^{−t/τ}$, mit $I_0 = ε/R$` },
      { t: 'Zeitkonstante', html: `$τ = L/R = ${f(L)}/${f(R)}$ = <b>${u(tau, 's')}</b>. ${carga ? 'Endstrom' : 'Anfangsstrom'}: ε / R = <b>${u(I0, 'A')}</b>. Energie in der Spule bei diesem Strom: $1/2 L I^2$ = ${u(0.5 * L * I0 * I0, 'J')}.` },
      { t: 'Charakteristische Zeiten', html: `Bei t = τ ${carga ? 'erreicht der Strom 63,2 %' : 'sinkt der Strom auf 36,8 %'}; bei 5τ = ${u(5 * tau, 's')} ${carga ? 'ist er bei 99,3 % des Endwerts' : 'bleiben 0,7 % übrig'}. Zeit, um ${carga ? 'die Hälfte zu erreichen' : 'auf die Hälfte zu sinken'}: $τ ln 2$ = ${u(tau * Math.LN2, 's')}.` },
    ];
    const res = { tau, I0 };
    if (t !== null) {
      const s = t * 1e-3, i = I(s);
      Object.assign(res, { It: i, VLt: VL(s), VRt: R * i, Ut: 0.5 * L * i * i });
      pasos.push({ t: `En t = ${f(t)} ms`, html: `$I = ${carga ? `${f(I0)} (1 − e^{−${f(s)}/${f(tau)}})` : `${f(I0)} e^{−${f(s)}/${f(tau)}}`}$ = <b>${u(i, 'A')}</b> · $V_R = R I$ = ${u(R * i, 'V')} · $V_L = L {dI}/{dt}$ = ${u(VL(s), 'V')} · $U = 1/2 L I^2$ = ${u(0.5 * L * i * i, 'J')}` });
      if (carga) {
        const Wf = E * I0 * (s - tau * (1 - Math.exp(-s / tau))), U = 0.5 * L * i * i;
        Object.assign(res, { Wf, WR: Wf - U });
        pasos.push({ t: 'Energiebilanz bis t', html: `Die Quelle hat $W_ε = ∫ε I dt = ε I_0 (t − τ (1 − e^{−t/τ}))$ = <b>${u(Wf, 'J')}</b> geliefert. Davon bleibt $1/2 L I^2$ = ${u(U, 'J')} in der Spule und der Rest, $W_R = ∫R I^2 dt$ = <b>${u(Wf - U, 'J')}</b>, wird im Widerstand verbraucht.` });
      } else {
        const WR = 0.5 * L * I0 * I0 * (1 - Math.exp((-2 * s) / tau));
        res.WR = WR;
        pasos.push({ t: 'Bis t verbrauchte Energie', html: `$W_R = ∫_0^t R I^2 dt = 1/2 L I_0^2 (1 − e^{−2t/τ})$ = <b>${u(WR, 'J')}</b>. Am Ende wird die gesamte Energie der Spule verbraucht, $1/2 L I_0^2$ = ${u(0.5 * L * I0 * I0, 'J')}.` });
      }
    }
    return { p: { E, R, L, carga, t }, res, I, VL, tau, pasos, letras: carga ? 'I(t) = ε/R (1 − e^{−t/τ}), τ = L/R' : 'I(t) = ε/R e^{−t/τ}, τ = L/R' };
  }

  function pulsos(sc, E, R, L, t) {
    const ton = lee(sc, 'ton', 'die Einschaltzeit') * 1e-3, toff = lee(sc, 'toff', 'die Ausschaltzeit') * 1e-3;
    const tau = L / R, I0 = E / R, P = ton + toff, a = Math.exp(-ton / tau), b = Math.exp(-toff / tau), A = a * b;
    const Imax = (I0 * (1 - a)) / (1 - A), Imin = Imax * b, Imed = (I0 * ton) / P;
    const inicio = (k) => Imin * (1 - Math.pow(A, k));
    const I = (s) => { const k = Math.floor(s / P), x = s - k * P, i0 = inicio(k); if (x < ton) return I0 + (i0 - I0) * Math.exp(-x / tau); return (I0 + (i0 - I0) * a) * Math.exp(-(x - ton) / tau); };
    const VL = (s) => { const x = s - Math.floor(s / P) * P; return x < ton ? E - R * I(s) : -R * I(s); };
    const pasos = [
      { t: 'Jeder Abschnitt', html: `Solange die Quelle verbunden ist, strebt I gegen ε/R = ${u(I0, 'A')} mit $τ = L/R$ = <b>${u(tau, 's')}</b>: $I = ε/R + (I_Anfang − ε/R) e^{−t/τ}$. Beim Abklemmen der Quelle entlädt sich die Spule über R: $I = I_Ende e^{−t/τ}$. Jeder Abschnitt beginnt mit dem Strom, mit dem der vorige endete, denn der Strom in einer Spule kann nicht springen.` },
      { t: 'Eingeschwungener Zustand', html: `Nach einigen Zyklen steigt und fällt der Strom immer zwischen denselben Werten. Verlangt man, dass ein Zyklus so endet, wie er beginnt: $I_max = ε/R {1 − e^{−t_on/τ}}/{1 − e^{−T/τ}}$ = <b>${u(Imax, 'A')}</b> und $I_min = I_max e^{−t_off/τ}$ = <b>${u(Imin, 'A')}</b>, mit T = ${u(P, 's')}.` },
      { t: 'Mittlerer Strom', html: `In einem Zyklus ist die mittlere Spannung an der Spule 0, also $R I_mittel = ε t_on/T$: I<sub>mittel</sub> = <b>${u(Imed, 'A')}</b> (${f((100 * ton) / P, 3)} % der Zeit verbunden). Das ist die Idee der PWM-Regelung. Die Welligkeit ist $I_max − I_min$ = ${u(Imax - Imin, 'A')}${tau > 3 * P ? ', klein, weil τ viel größer ist als die Periode' : ''}.` },
    ];
    const res = { tau, I0, Imax, Imin, Imed };
    if (t !== null) { const s = t * 1e-3, i = I(s); Object.assign(res, { It: i, VLt: VL(s), VRt: R * i, Ut: 0.5 * L * i * i }); pasos.push({ t: `En t = ${f(t)} ms`, html: `Es befindet sich im Zyklus ${Math.floor(s / P) + 1}, ${s - Math.floor(s / P) * P < ton ? 'eingeschaltet' : 'ausgeschaltet'}: I = <b>${u(i, 'A')}</b>, V<sub>L</sub> = ${u(VL(s), 'V')} und $U = 1/2 L I^2$ = ${u(0.5 * L * i * i, 'J')}.` }); }
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
    const N1 = lee(sc, 'N1', 'die Windungen der Primärspule'), N2 = lee(sc, 'N2', 'die Windungen der Sekundärspule'), L1 = lee(sc, 'L1', 'die Selbstinduktivität der Primärspule') * 1e-3;
    const k = lee(sc, 'k', 'der Kopplungsfaktor'), V1 = lee(sc, 'V1', 'die Spannung der Primärspule'), fr = lee(sc, 'fr', 'la frecuencia');
    const R1 = lee(sc, 'R1', 'der Widerstand der Primärspule', { cero: true }), R2 = lee(sc, 'R2', 'der Widerstand der Sekundärspule', { cero: true }), RL = lee(sc, 'RL', 'der Lastwiderstand');
    if (k > 1) throw new Error('Der Kopplungsfaktor k darf nicht größer als 1 sein');
    const n = N2 / N1, L2 = L1 * n * n, M = k * Math.sqrt(L1 * L2), w = 2 * Math.PI * fr;
    const p = { N1, N2, L1, L2, M, k, V1, fr, R1, R2, RL }, r = trafoPunto(p, RL);
    const V1c = [V1, 0], vacio0 = cx.abs(cx.d([w * M * V1, 0], [R1, w * L1])), Vid = V1 * n, V2m = cx.abs(r.V2);
    const reg = (vacio0 - V2m) / vacio0, Pcu1 = R1 * cx.abs(r.I1) ** 2, Pcu2 = R2 * cx.abs(r.I2) ** 2, fp = r.Pin / (V1 * cx.abs(r.I1));
    const pasos = [
      { t: 'Induktivitäten und Kopplung', html: `Bei gleicher Geometrie gilt $L ∝ N^2$, also $L_2 = L_1 (N_2/N_1)^2$ = ${u(L2, 'H')} und $M = k √(L_1 L_2)$ = <b>${u(M, 'H')}</b>. Streufluss: ${f(100 * (1 - k), 3)} % des Flusses jeder Spule erreicht die andere nicht (L<sub>σ1</sub> = (1 − k) L<sub>1</sub> = ${u((1 - k) * L1, 'H')}).` },
      { t: 'Gleichungen mit Zeigern (ω = 2πf = ' + f(w) + ' rad/s)', html: `Primärseite: $V_1 = (R_1 + jωL_1) I_1 − jωM I_2$. Sekundärseite mit Last: $jωM I_1 = (R_2 + R_L + jωL_2) I_2$ und $V_2 = R_L I_2$.` },
      { t: 'Von der Primärseite gesehene Impedanz', html: `$Z_e = R_1 + jωL_1 + {ω^2 M^2}/{R_2 + R_L + jωL_2}$ = ${f(r.Zin[0])} ${r.Zin[1] < 0 ? '−' : '+'} j ${f(Math.abs(r.Zin[1]))} Ω (|Z<sub>e</sub>| = ${f(cx.abs(r.Zin))} Ω, ${f(cx.fase(r.Zin), 3)}°). $I_1 = V_1/Z_e$ = <b>${u(cx.abs(r.I1), 'A')}</b>.` },
      { t: 'Sekundärseite', html: `$I_2 = {jωM I_1}/{R_2 + R_L + jωL_2}$ = <b>${u(cx.abs(r.I2), 'A')}</b> und $V_2 = R_L I_2$ = <b>${u(V2m, 'V')}</b>, mit der Phase ${f(cx.fase(r.V2) - 0, 4)}° gegenüber V<sub>1</sub>. Reales Verhältnis $V_2/V_1$ = ${f(V2m / V1)} gegenüber dem idealen $N_2/N_1$ = ${f(n)} (ideales V<sub>2</sub> = ${u(Vid, 'V')}).` },
      { t: 'Spannungsregelung', html: `Im Leerlauf ($R_L → ∞$) liefert die Sekundärseite $V_{20} = {ωM V_1}/{|R_1 + jωL_1|}$ = ${u(vacio0, 'V')}. Spannungsregelung $= (V_{20} − V_2)/V_{20}$ = <b>${f(100 * reg, 3)} %</b>: wie stark die Spannung beim Anschließen der Last einbricht.` },
      { t: 'Leistungen und Wirkungsgrad', html: `$P_1 = V_1 |I_1| cos φ$ = ${u(r.Pin, 'W')} (cos φ = ${f(fp)}); $P_2 = R_L |I_2|^2$ = ${u(r.Pout, 'W')}. Kupferverluste: ${u(Pcu1, 'W')} in der Primärseite und ${u(Pcu2, 'W')} in der Sekundärseite. Wirkungsgrad $η = P_2/P_1$ = <b>${f(100 * r.eta, 4)} %</b>.` },
    ];
    const curva = () => { const pts = []; for (let i = 0; i <= 120; i++) { const RLx = RL * Math.pow(10, -1.5 + (3 * i) / 120), q = trafoPunto(p, RLx); pts.push([RLx, cx.abs(q.V2) / vacio0, q.eta]); } return pts; };
    const res = { M, L2, n, I1: cx.abs(r.I1), I2: cx.abs(r.I2), V2: V2m, Vid, relacion: V2m / V1, V20: vacio0, reg, eta: r.eta, Pin: r.Pin, Pout: r.Pout, Pcu1, Pcu2, fp, Zin: cx.abs(r.Zin) };
    return { p, res, pasos, curva, letras: 'η = {R_L |I_2|^2}/{V_1 |I_1| cos φ}' };
  }

  const ejemplos = {
    L: [
      { clave: 'solenoide', nombre: 'Zylinderspule mit 500 Windungen', sc: { geo: 'solenoide', N: '500', l: '20', r: '1', mur: '1', I: '2', dIdt: '100' } },
      { clave: 'solenoide-hierro', nombre: 'Zylinderspule mit Kern (μr = 800)', sc: { geo: 'solenoide', N: '300', l: '15', r: '1.5', mur: '800', I: '0.5' } },
      { clave: 'toroide-rect', nombre: 'Toroid mit rechteckigem Querschnitt', sc: { geo: 'toroide-rect', N: '1000', a: '5', b: '8', h: '2', mur: '1', I: '1' } },
      { clave: 'toroide-circ', nombre: 'Toroid mit kreisförmigem Querschnitt', sc: { geo: 'toroide-circ', N: '200', R: '10', r: '2', mur: '1' } },
      { clave: 'coaxial', nombre: 'Koaxialkabel, massiver Innenleiter', sc: { geo: 'coaxial', l: '1', a: '1', b: '4', interior: 'macizo' } },
      { clave: 'entrehierro', nombre: 'Eisentoroid mit Luftspalt', sc: { geo: 'entrehierro', N: '500', R: '10', S: '4', mur: '2000', g: '2', I: '1' } },
      { clave: 'bifilar', nombre: 'Zweidrahtleitung', sc: { geo: 'bifilar', l: '1', d: '10', a: '1', interior: 'hueco' } },
    ],
    M: [
      { clave: 'solenoides', nombre: 'Zylinderspule in einer anderen', sc: { geo: 'solenoides', N1: '200', r1: '1', N2: '1000', r2: '2', l: '40', dI1dt: '50' } },
      { clave: 'espiras', nombre: 'Kleine Leiterschleife in der Mitte einer großen', sc: { geo: 'espiras', N1: '1', R: '20', N2: '10', r: '1', dI1dt: '1000' } },
      { clave: 'espiras-coaxiales', nombre: 'Zwei koaxiale Leiterschleifen im Abstand', sc: { geo: 'espiras-coaxiales', N1: '100', R: '10', N2: '20', r: '1', z: '10', dI1dt: '50' } },
      { clave: 'espira-solenoide', nombre: 'Gedrehte Spule in einer Zylinderspule', sc: { geo: 'espira-solenoide', N1: '1000', l: '50', N2: '30', r: '1', th: '60', dI1dt: '100' } },
      { clave: 'hilo-espira', nombre: 'Draht und rechteckige Leiterschleife', sc: { geo: 'hilo-espira', d: '5', w: '10', h: '20', N2: '1', dI1dt: '200' } },
      { clave: 'toroide-bobina', nombre: 'Spule auf einem Toroid (k = 1)', sc: { geo: 'toroide-bobina', N1: '500', N2: '50', a: '4', b: '6', h: '2', I1: '2', I2: '1', sentido: 'aditivo' } },
      { clave: 'acoplamiento', nombre: 'Gekoppelte Spulen in Reihe und parallel', sc: { geo: 'acoplamiento', L1: '2', L2: '8', k: '0.5' } },
    ],
    F: [
      { clave: 'f-atraen', nombre: 'Zwei Leiterschleifen mit parallelen Strömen: Sie ziehen sich an', sc: { N1: '1', R: '10', N2: '1', r: '5', z: '5', I1: '100', I2: '50' } },
      { clave: 'f-repelen', nombre: 'Entgegengesetzte Ströme: Sie stoßen sich ab (schwebender Ring)', sc: { N1: '200', R: '10', N2: '1', r: '5', z: '3', I1: '10', I2: '-300' } },
      { clave: 'f-lejos', nombre: 'Kleine Leiterschleife weit entfernt: Dipolgrenzfall', sc: { N1: '100', R: '10', N2: '20', r: '1', z: '40', I1: '2', I2: '1' } },
    ],
    T: [
      { clave: 't-red', nombre: 'Netztransformator 230 V → 23 V', sc: { N1: '1000', N2: '100', L1: '10000', k: '0.98', V1: '230', fr: '50', R1: '2', R2: '0.02', RL: '5' } },
      { clave: 't-flojo', nombre: 'Lose Kopplung (k = 0,6), wie bei einem kabellosen Ladegerät', sc: { N1: '20', N2: '20', L1: '0.024', k: '0.6', V1: '5', fr: '100000', R1: '0.5', R2: '0.5', RL: '10' } },
      { clave: 't-vacio', nombre: 'Fast im Leerlauf: Spannungsregelung und Wirkungsgrad', sc: { N1: '500', N2: '1500', L1: '4000', k: '0.99', V1: '100', fr: '50', R1: '1', R2: '9', RL: '5000' } },
    ],
    RL: [
      { clave: 'carga', nombre: 'Der Schalter wird geschlossen', sc: { E: '12', R: '6', L: '300', modo: 'carga', t: '50' } },
      { clave: 'descarga', nombre: 'Die Spule entlädt sich über den Widerstand', sc: { E: '10', R: '100', L: '500', modo: 'descarga', t: '2' } },
      { clave: 'pulsos', nombre: 'Wiederholtes Ein- und Ausschalten', sc: { E: '12', R: '10', L: '50', modo: 'pulsos', ton: '5', toff: '5', t: '' } },
    ],
  };

  return { autoinduccion, mutua, rl, fuerza, transformador, mutuaExacta, elip, GEO_L, GEO_M, ejemplos, f, u, MU0 };
})();

