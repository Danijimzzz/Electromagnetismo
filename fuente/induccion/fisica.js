/* =====================================================================
   Autoinducción e inducción mutua (sin DOM): coeficiente de autoinducción
   de solenoides, toroides (también con entrehierro), cables coaxiales y
   líneas bifilares; coeficiente de inducción mutua de pares típicos y
   bobinas acopladas en serie y en paralelo; energía magnética, flujo y fem
   inducida; y el transitorio de un circuito RL (cerrar, abrir o conectar y
   desconectar una y otra vez), con la energía disipada. Desarrollo en la forma
   simbólica (μ₀ N² S / l) y con números. Unidades del SI.
   ===================================================================== */
const Induccion = (() => {
  const MU0 = 4e-7 * Math.PI;
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // con prefijo del SI: 4,935·10⁻⁴ H → 0,4935 mH
  const PREF = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p']];
  const u = (x, unidad, d = 4) => {
    if (!isFinite(x) || x === 0) return `${f(x, d)} ${unidad}`;
    const a = Math.abs(x), p = PREF.find(([v]) => a >= v * 0.9999999) || PREF[PREF.length - 1];
    return `${String(+(x / p[0]).toPrecision(d)).replace('.', ',').replace('-', '−')} ${p[1]}${unidad}`;
  };
  const leeNum = (s) => +String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const lee = (sc, k, nom, { opcional = false, cero = false, signo = false } = {}) => {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    return v;
  };

  /* ---------- Autoinducción ---------- */
  // cada geometría: campos (clave, nombre, unidad, factor a SI) y la función que da L con su desarrollo
  const GEO_L = {
    solenoide: {
      nombre: 'Solenoide largo', campos: [['N', 'Número de espiras N', '', 1], ['l', 'Longitud l', 'cm', 1e-2], ['r', 'Radio r', 'cm', 1e-2], ['mur', 'Permeabilidad relativa μ<sub>r</sub>', '', 1]],
      calc: ({ N, l, r, mur }) => {
        const S = Math.PI * r * r, L = (MU0 * mur * N * N * S) / l;
        return { L, pasos: [
          { t: 'Campo dentro del solenoide (Ampère)', html: `B = μ<sub>0</sub> μ<sub>r</sub> N I / l, uniforme dentro y nulo fuera (si l ≫ r).` },
          { t: 'Flujo propio', html: `Φ = N B S = μ<sub>0</sub> μ<sub>r</sub> N<sup>2</sup> S I / l, con S = π r<sup>2</sup> = ${f(S)} m<sup>2</sup>.` },
          { t: 'Coeficiente de autoinducción', html: `L = Φ / I = μ<sub>0</sub> μ<sub>r</sub> N<sup>2</sup> π r<sup>2</sup> / l = 4π·10<sup>−7</sup> · ${f(mur)} · ${f(N)}<sup>2</sup> · ${f(S)} / ${f(l)} = <b>${u(L, 'H')}</b>` },
        ], B1: (MU0 * mur * N) / l };
      },
    },
    'toroide-rect': {
      nombre: 'Toroide de sección rectangular', campos: [['N', 'Número de espiras N', '', 1], ['a', 'Radio interior a', 'cm', 1e-2], ['b', 'Radio exterior b', 'cm', 1e-2], ['h', 'Altura h', 'cm', 1e-2], ['mur', 'Permeabilidad relativa μ<sub>r</sub>', '', 1]],
      valida: ({ a, b }) => { if (b <= a) throw new Error('El radio exterior debe ser mayor que el interior'); },
      calc: ({ N, a, b, h, mur }) => {
        const L = (MU0 * mur * N * N * h * Math.log(b / a)) / (2 * Math.PI);
        return { L, pasos: [
          { t: 'Campo dentro del toroide (Ampère)', html: `B(r) = μ<sub>0</sub> μ<sub>r</sub> N I / (2π r), para a < r < b.` },
          { t: 'Flujo por una espira', html: `Φ<sub>1</sub> = ∫<sub>a</sub><sup>b</sup> B h dr = μ<sub>0</sub> μ<sub>r</sub> N I h ln(b/a) / (2π), con ln(b/a) = ln(${f(b / a)}) = ${f(Math.log(b / a))}.` },
          { t: 'Coeficiente de autoinducción', html: `L = N Φ<sub>1</sub> / I = μ<sub>0</sub> μ<sub>r</sub> N<sup>2</sup> h ln(b/a) / (2π) = 2·10<sup>−7</sup> · ${f(mur)} · ${f(N)}<sup>2</sup> · ${f(h)} · ${f(Math.log(b / a))} = <b>${u(L, 'H')}</b>` },
        ] };
      },
    },
    'toroide-circ': {
      nombre: 'Toroide de sección circular', campos: [['N', 'Número de espiras N', '', 1], ['R', 'Radio medio R', 'cm', 1e-2], ['r', 'Radio de la sección r', 'cm', 1e-2], ['mur', 'Permeabilidad relativa μ<sub>r</sub>', '', 1]],
      valida: ({ R, r }) => { if (r >= R) throw new Error('El radio de la sección debe ser menor que el radio medio'); },
      calc: ({ N, R, r, mur }) => {
        const L = MU0 * mur * N * N * (R - Math.sqrt(R * R - r * r)), La = (MU0 * mur * N * N * r * r) / (2 * R);
        return { L, pasos: [
          { t: 'Campo dentro del toroide (Ampère)', html: `B(ρ) = μ<sub>0</sub> μ<sub>r</sub> N I / (2π ρ), a una distancia ρ del eje.` },
          { t: 'Coeficiente de autoinducción', html: `Integrando el flujo sobre la sección circular: L = μ<sub>0</sub> μ<sub>r</sub> N<sup>2</sup> (R − √(R<sup>2</sup> − r<sup>2</sup>)) = <b>${u(L, 'H')}</b>` },
          { t: 'Aproximación de toroide fino', html: `Si r ≪ R, B es casi uniforme y L ≈ μ<sub>0</sub> μ<sub>r</sub> N<sup>2</sup> π r<sup>2</sup> / (2π R) = ${u(La, 'H')} (difiere un ${f(100 * Math.abs(La / L - 1), 2)} %).` },
        ] };
      },
    },
    entrehierro: {
      nombre: 'Toroide con entrehierro', campos: [['N', 'Número de espiras N', '', 1], ['R', 'Radio medio R', 'cm', 1e-2], ['S', 'Sección S', 'cm²', 1e-4], ['mur', 'Permeabilidad relativa del núcleo μ<sub>r</sub>', '', 1], ['g', 'Entrehierro g', 'mm', 1e-3]],
      valida: ({ R, g }) => { if (g >= 2 * Math.PI * R) throw new Error('El entrehierro no puede ser más largo que el toroide'); },
      calc: ({ N, R, S, mur, g }) => {
        const lc = 2 * Math.PI * R - g, Rn = lc / (MU0 * mur * S), Rg = g / (MU0 * S), Rt = Rn + Rg, L = (N * N) / Rt, L0 = (MU0 * mur * N * N * S) / (2 * Math.PI * R);
        return { L, pasos: [
          { t: 'Ley de Ampère', html: `Por la línea media del toroide: H<sub>n</sub> l<sub>n</sub> + H<sub>g</sub> g = N I, con l<sub>n</sub> = 2πR − g = ${f(lc)} m de núcleo. Sin dispersión, B es el mismo en el núcleo y en el hueco: H<sub>n</sub> = B/(μ<sub>0</sub>μ<sub>r</sub>) y H<sub>g</sub> = B/μ<sub>0</sub>, así que B = μ<sub>0</sub> N I / (l<sub>n</sub>/μ<sub>r</sub> + g).` },
          { t: 'Reluctancias', html: `Como en un circuito en serie: ℛ<sub>n</sub> = l<sub>n</sub>/(μ<sub>0</sub>μ<sub>r</sub>S) = ${f(Rn)} A/Wb y ℛ<sub>g</sub> = g/(μ<sub>0</sub>S) = ${f(Rg)} A/Wb. Total ℛ = <b>${f(Rt)} A/Wb</b>${Rg > Rn ? `: el hueco de aire, aunque mide solo ${f(g * 1000)} mm, pesa más que todo el núcleo` : ''}.` },
          { t: 'Coeficiente de autoinducción', html: `Φ = N I/ℛ por espira, y L = N Φ/I = N<sup>2</sup>/ℛ = ${f(N)}<sup>2</sup> / ${f(Rt)} = <b>${u(L, 'H')}</b>. Sin entrehierro sería μ<sub>0</sub>μ<sub>r</sub>N<sup>2</sup>S/(2πR) = ${u(L0, 'H')}, ${f(L0 / L, 3)} veces más.` },
        ], B1: N / (Rt * S) };
      },
    },
    coaxial: {
      nombre: 'Cable coaxial', campos: [['l', 'Longitud l', 'm', 1], ['a', 'Radio del conductor interior a', 'mm', 1e-3], ['b', 'Radio del conductor exterior b', 'mm', 1e-3]], interior: true,
      valida: ({ a, b }) => { if (b <= a) throw new Error('El radio exterior debe ser mayor que el interior'); },
      calc: ({ l, a, b, macizo }) => {
        const Le = (MU0 * l * Math.log(b / a)) / (2 * Math.PI), Li = macizo ? (MU0 * l) / (8 * Math.PI) : 0, L = Le + Li;
        const pasos = [
          { t: 'Campo entre los conductores (Ampère)', html: `B(r) = μ<sub>0</sub> I / (2π r), para a < r < b; fuera del cable B = 0.` },
          { t: 'Parte externa', html: `Φ = ∫<sub>a</sub><sup>b</sup> B l dr = μ<sub>0</sub> I l ln(b/a) / (2π) ⇒ L<sub>ext</sub> = μ<sub>0</sub> l ln(b/a) / (2π) = 2·10<sup>−7</sup> · ${f(l)} · ln(${f(b / a)}) = <b>${u(Le, 'H')}</b>` },
        ];
        if (macizo) pasos.push({ t: 'Parte interna (conductor macizo)', html: `Dentro del conductor B = μ<sub>0</sub> I r / (2π a<sup>2</sup>). Por energía, ½ L<sub>int</sub> I<sup>2</sup> = ∫ B<sup>2</sup>/(2μ<sub>0</sub>) dV ⇒ L<sub>int</sub> = μ<sub>0</sub> l / (8π) = ${u(Li, 'H')}. Total: L = <b>${u(L, 'H')}</b>` });
        pasos.push({ t: 'Por unidad de longitud', html: `L / l = <b>${u(L / l, 'H/m')}</b>` });
        return { L, pasos };
      },
    },
    bifilar: {
      nombre: 'Línea bifilar', campos: [['l', 'Longitud l', 'm', 1], ['d', 'Distancia entre ejes d', 'mm', 1e-3], ['a', 'Radio de cada hilo a', 'mm', 1e-3]], interior: true,
      valida: ({ d, a }) => { if (d <= 2 * a) throw new Error('Los hilos se tocan: la distancia entre ejes debe ser mayor que 2a'); },
      calc: ({ l, d, a, macizo }) => {
        const Le = (MU0 * l * Math.log((d - a) / a)) / Math.PI, Li = macizo ? (MU0 * l) / (4 * Math.PI) : 0, L = Le + Li;
        const pasos = [
          { t: 'Campo entre los hilos', html: `Cada hilo crea B = μ<sub>0</sub> I / (2π r) y entre ellos los dos campos se suman: B(x) = μ<sub>0</sub> I / (2π) · (1/x + 1/(d − x)).` },
          { t: 'Flujo entre los hilos', html: `Φ = ∫<sub>a</sub><sup>d−a</sup> B l dx = μ<sub>0</sub> I l ln((d − a)/a) / π ⇒ L<sub>ext</sub> = μ<sub>0</sub> l ln((d − a)/a) / π = 4·10<sup>−7</sup> · ${f(l)} · ln(${f((d - a) / a)}) = <b>${u(Le, 'H')}</b>${d > 20 * a ? ` (≈ μ<sub>0</sub> l ln(d/a) / π, pues d ≫ a)` : ''}` },
        ];
        if (macizo) pasos.push({ t: 'Parte interna (hilos macizos)', html: `Cada hilo aporta μ<sub>0</sub> l / (8π): L<sub>int</sub> = μ<sub>0</sub> l / (4π) = ${u(Li, 'H')}. Total: L = <b>${u(L, 'H')}</b>` });
        pasos.push({ t: 'Por unidad de longitud', html: `L / l = <b>${u(L / l, 'H/m')}</b>` });
        return { L, pasos };
      },
    },
  };

  /* ---------- Inducción mutua ---------- */
  const GEO_M = {
    solenoides: {
      nombre: 'Dos solenoides coaxiales', campos: [['N1', 'Espiras del interior N<sub>1</sub>', '', 1], ['r1', 'Radio del interior r<sub>1</sub>', 'cm', 1e-2], ['N2', 'Espiras del exterior N<sub>2</sub>', '', 1], ['r2', 'Radio del exterior r<sub>2</sub>', 'cm', 1e-2], ['l', 'Longitud común l', 'cm', 1e-2]],
      valida: ({ r1, r2 }) => { if (r1 > r2) throw new Error('El solenoide interior no puede ser más ancho que el exterior'); },
      calc: ({ N1, r1, N2, r2, l }) => {
        const S1 = Math.PI * r1 * r1, M = (MU0 * N1 * N2 * S1) / l, L1 = (MU0 * N1 * N1 * S1) / l, L2 = (MU0 * N2 * N2 * Math.PI * r2 * r2) / l;
        return { M, L1, L2, pasos: [
          { t: 'Campo del exterior', html: `Con una corriente I<sub>2</sub> en el exterior, B<sub>2</sub> = μ<sub>0</sub> N<sub>2</sub> I<sub>2</sub> / l dentro de él, también dentro del interior.` },
          { t: 'Flujo en el interior', html: `Φ<sub>12</sub> = N<sub>1</sub> B<sub>2</sub> π r<sub>1</sub><sup>2</sup> = μ<sub>0</sub> N<sub>1</sub> N<sub>2</sub> π r<sub>1</sub><sup>2</sup> I<sub>2</sub> / l (solo cuenta la sección del interior).` },
          { t: 'Coeficiente de inducción mutua', html: `M = Φ<sub>12</sub> / I<sub>2</sub> = μ<sub>0</sub> N<sub>1</sub> N<sub>2</sub> π r<sub>1</sub><sup>2</sup> / l = 4π·10<sup>−7</sup> · ${f(N1)} · ${f(N2)} · ${f(S1)} / ${f(l)} = <b>${u(M, 'H')}</b>. Sale lo mismo calculando el flujo del interior en el exterior (M<sub>12</sub> = M<sub>21</sub>).` },
          { t: 'Coeficiente de acoplamiento', html: `L<sub>1</sub> = μ<sub>0</sub> N<sub>1</sub><sup>2</sup> π r<sub>1</sub><sup>2</sup> / l = ${u(L1, 'H')}, L<sub>2</sub> = μ<sub>0</sub> N<sub>2</sub><sup>2</sup> π r<sub>2</sub><sup>2</sup> / l = ${u(L2, 'H')} ⇒ k = M / √(L<sub>1</sub> L<sub>2</sub>) = r<sub>1</sub> / r<sub>2</sub> = <b>${f(M / Math.sqrt(L1 * L2))}</b>` },
        ] };
      },
    },
    espiras: {
      nombre: 'Espira pequeña en el centro de otra grande', campos: [['N1', 'Espiras de la grande N<sub>1</sub>', '', 1], ['R', 'Radio de la grande R', 'cm', 1e-2], ['N2', 'Espiras de la pequeña N<sub>2</sub>', '', 1], ['r', 'Radio de la pequeña r', 'cm', 1e-2]],
      valida: ({ R, r }) => { if (r >= R) throw new Error('La espira pequeña debe tener un radio menor que la grande'); },
      calc: ({ N1, R, N2, r }) => {
        const M = (MU0 * N1 * N2 * Math.PI * r * r) / (2 * R);
        return { M, pasos: [
          { t: 'Campo en el centro de la grande', html: `B<sub>1</sub> = μ<sub>0</sub> N<sub>1</sub> I<sub>1</sub> / (2R) (Biot-Savart en el centro de la espira).` },
          { t: 'Flujo en la pequeña', html: `Si r ≪ R el campo es casi uniforme sobre la espira pequeña: Φ<sub>21</sub> = N<sub>2</sub> B<sub>1</sub> π r<sup>2</sup>.` },
          { t: 'Coeficiente de inducción mutua', html: `M = Φ<sub>21</sub> / I<sub>1</sub> = μ<sub>0</sub> N<sub>1</sub> N<sub>2</sub> π r<sup>2</sup> / (2R) = <b>${u(M, 'H')}</b>${r > 0.2 * R ? '. Ojo: r no es mucho menor que R, así que es una aproximación gruesa.' : ''}` },
        ] };
      },
    },
    'espiras-coaxiales': {
      nombre: 'Dos espiras coaxiales separadas', campos: [['N1', 'Espiras de la grande N<sub>1</sub>', '', 1], ['R', 'Radio de la grande R', 'cm', 1e-2], ['N2', 'Espiras de la pequeña N<sub>2</sub>', '', 1], ['r', 'Radio de la pequeña r', 'cm', 1e-2], ['z', 'Distancia entre los centros z', 'cm', 1e-2]],
      valida: ({ R, r }) => { if (r > R) throw new Error('Pon como espira 1 la de radio mayor'); },
      calc: ({ N1, R, N2, r, z }) => {
        const D = Math.pow(R * R + z * z, 1.5), M = (MU0 * N1 * N2 * Math.PI * R * R * r * r) / (2 * D);
        return { M, pasos: [
          { t: 'Campo de la grande en su eje', html: `B<sub>1</sub>(z) = μ<sub>0</sub> N<sub>1</sub> I<sub>1</sub> R<sup>2</sup> / (2 (R<sup>2</sup> + z<sup>2</sup>)<sup>3/2</sup>) (Biot-Savart), con (R<sup>2</sup> + z<sup>2</sup>)<sup>3/2</sup> = ${f(D)} m<sup>3</sup>.` },
          { t: 'Flujo en la pequeña', html: `Si la pequeña es pequeña frente a la distancia a los hilos de la grande, B<sub>1</sub> es casi uniforme sobre ella: Φ<sub>21</sub> = N<sub>2</sub> B<sub>1</sub> π r<sup>2</sup>.` },
          { t: 'Coeficiente de inducción mutua', html: `M = μ<sub>0</sub> π N<sub>1</sub> N<sub>2</sub> R<sup>2</sup> r<sup>2</sup> / (2 (R<sup>2</sup> + z<sup>2</sup>)<sup>3/2</sup>) = <b>${u(M, 'H')}</b>. Con z ≫ R baja como 1/z<sup>3</sup>, igual que el campo de un dipolo.${r > 0.3 * Math.sqrt(R * R + z * z) ? ' Ojo: r no es pequeño frente a √(R² + z²), así que es una aproximación gruesa.' : ''}` },
        ] };
      },
    },
    'espira-solenoide': {
      nombre: 'Espira o bobina dentro de un solenoide', campos: [['N1', 'Espiras del solenoide N<sub>1</sub>', '', 1], ['l', 'Longitud del solenoide l', 'cm', 1e-2], ['N2', 'Espiras de la bobina N<sub>2</sub>', '', 1], ['r', 'Radio de la bobina r', 'cm', 1e-2], ['th', 'Ángulo entre los ejes θ', '°', 1]],
      valida: ({ th }) => { if (th > 180) throw new Error('El ángulo entre los ejes tiene que estar entre 0° y 180°'); },
      calc: ({ N1, l, N2, r, th }) => {
        const c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180), M = (MU0 * N1 * N2 * Math.PI * r * r * c) / l;
        return { M, pasos: [
          { t: 'Campo del solenoide', html: `B<sub>1</sub> = μ<sub>0</sub> N<sub>1</sub> I<sub>1</sub> / l, uniforme dentro (la bobina tiene que caber dentro y lejos de los extremos).` },
          { t: 'Flujo en la bobina', html: `Φ<sub>21</sub> = N<sub>2</sub> B<sub>1</sub> π r<sup>2</sup> cos θ: solo cuenta la componente de B perpendicular a la bobina.` },
          { t: 'Coeficiente de inducción mutua', html: `M = μ<sub>0</sub> N<sub>1</sub> N<sub>2</sub> π r<sup>2</sup> cos θ / l = 4π·10<sup>−7</sup> · ${f(N1)} · ${f(N2)} · π·${f(r)}<sup>2</sup>${th ? ` · cos ${f(th)}°` : ''} / ${f(l)} = <b>${u(M, 'H')}</b>${c === 0 ? ': con los ejes perpendiculares no hay acoplamiento' : ''}. Girando la bobina, M cambia como cos θ (así funciona un generador).` },
        ] };
      },
    },
    'hilo-espira': {
      nombre: 'Hilo recto y espira rectangular coplanaria', campos: [['d', 'Distancia del hilo al lado cercano d', 'cm', 1e-2], ['w', 'Ancho de la espira w', 'cm', 1e-2], ['h', 'Lado paralelo al hilo h', 'cm', 1e-2], ['N2', 'Espiras de la espira N', '', 1]],
      calc: ({ d, w, h, N2 }) => {
        const M = (MU0 * N2 * h * Math.log((d + w) / d)) / (2 * Math.PI);
        return { M, pasos: [
          { t: 'Campo del hilo', html: `B(x) = μ<sub>0</sub> I / (2π x), perpendicular al plano de la espira.` },
          { t: 'Flujo en la espira', html: `Φ = N ∫<sub>d</sub><sup>d+w</sup> μ<sub>0</sub> I h / (2π x) dx = μ<sub>0</sub> N I h ln((d + w)/d) / (2π), con ln(${f((d + w) / d)}) = ${f(Math.log((d + w) / d))}.` },
          { t: 'Coeficiente de inducción mutua', html: `M = Φ / I = μ<sub>0</sub> N h ln((d + w)/d) / (2π) = 2·10<sup>−7</sup> · ${f(N2)} · ${f(h)} · ${f(Math.log((d + w) / d))} = <b>${u(M, 'H')}</b>` },
        ] };
      },
    },
    'toroide-bobina': {
      nombre: 'Bobina enrollada sobre un toroide', campos: [['N1', 'Espiras del toroide N<sub>1</sub>', '', 1], ['N2', 'Espiras de la bobina N<sub>2</sub>', '', 1], ['a', 'Radio interior a', 'cm', 1e-2], ['b', 'Radio exterior b', 'cm', 1e-2], ['h', 'Altura h', 'cm', 1e-2]],
      valida: ({ a, b }) => { if (b <= a) throw new Error('El radio exterior debe ser mayor que el interior'); },
      calc: ({ N1, N2, a, b, h }) => {
        const M = (MU0 * N1 * N2 * h * Math.log(b / a)) / (2 * Math.PI), L1 = (MU0 * N1 * N1 * h * Math.log(b / a)) / (2 * Math.PI), L2 = (MU0 * N2 * N2 * h * Math.log(b / a)) / (2 * Math.PI);
        return { M, L1, L2, pasos: [
          { t: 'Campo del toroide', html: `B(r) = μ<sub>0</sub> N<sub>1</sub> I<sub>1</sub> / (2π r) dentro del núcleo.` },
          { t: 'Flujo en la bobina', html: `La bobina abraza todo el núcleo: Φ<sub>21</sub> = N<sub>2</sub> μ<sub>0</sub> N<sub>1</sub> I<sub>1</sub> h ln(b/a) / (2π).` },
          { t: 'Coeficiente de inducción mutua', html: `M = μ<sub>0</sub> N<sub>1</sub> N<sub>2</sub> h ln(b/a) / (2π) = <b>${u(M, 'H')}</b>. Las dos bobinas comparten todo el flujo, así que k = M / √(L<sub>1</sub> L<sub>2</sub>) = <b>1</b> (L<sub>1</sub> = ${u(L1, 'H')}, L<sub>2</sub> = ${u(L2, 'H')}).` },
        ] };
      },
    },
    acoplamiento: {
      nombre: 'A partir de L₁, L₂ y k', campos: [['L1', 'L<sub>1</sub>', 'mH', 1e-3], ['L2', 'L<sub>2</sub>', 'mH', 1e-3], ['k', 'Coeficiente de acoplamiento k', '', 1]],
      valida: ({ k }) => { if (k > 1) throw new Error('El coeficiente de acoplamiento no puede ser mayor que 1'); },
      calc: ({ L1, L2, k }) => {
        const M = k * Math.sqrt(L1 * L2);
        return { M, L1, L2, pasos: [{ t: 'Coeficiente de inducción mutua', html: `M = k √(L<sub>1</sub> L<sub>2</sub>) = ${f(k)} · √(${f(L1)} · ${f(L2)}) = <b>${u(M, 'H')}</b>` }] };
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

  // sc: { geo, ...campos, I, dIdt }
  function autoinduccion(sc) {
    const G = GEO_L[sc.geo] || GEO_L.solenoide, p = leerGeo(G, sc);
    const r = G.calc(p), { L } = r, pasos = [...r.pasos], res = { L };
    const I = lee(sc, 'I', 'la intensidad', { opcional: true, signo: true }), dI = lee(sc, 'dIdt', 'dI/dt', { opcional: true, signo: true });
    if (I !== null) {
      res.flujo = L * I; res.U = 0.5 * L * I * I;
      pasos.push({ t: `Con I = ${f(I)} A`, html: `Flujo propio Φ = L I = <b>${u(res.flujo, 'Wb')}</b> · energía magnética U = ½ L I<sup>2</sup> = ½ · ${f(L)} · ${f(I)}<sup>2</sup> = <b>${u(res.U, 'J')}</b>${r.B1 ? `<br>Campo ${sc.geo === 'entrehierro' ? 'en el núcleo y en el hueco' : 'dentro'}: B = ${sc.geo === 'entrehierro' ? 'N I/(ℛ S)' : 'μ<sub>0</sub> μ<sub>r</sub> N I / l'} = ${u(r.B1 * I, 'T')}; la energía también sale de u = B<sup>2</sup>/(2μ) por el volumen.` : ''}` });
    }
    if (dI !== null) {
      res.fem = -L * dI;
      pasos.push({ t: `Si la corriente cambia a dI/dt = ${f(dI)} A/s`, html: `ε = −L dI/dt = −${f(L)} · ${f(dI)} = <b>${f(res.fem)} V</b>${dI ? `, que se opone al ${dI > 0 ? 'aumento' : 'descenso'} de la corriente (ley de Lenz)` : ''}.` });
    }
    return { G, p, res, pasos };
  }

  // sc: { geo, ...campos, I1, dI1dt, I2, sentido: 'aditivo'|'opuesto' }
  function mutua(sc) {
    const G = GEO_M[sc.geo] || GEO_M.solenoides, p = leerGeo(G, sc);
    const r = G.calc(p), { M } = r, pasos = [...r.pasos], res = { M, L1: r.L1, L2: r.L2 };
    const I1 = lee(sc, 'I1', 'la intensidad I₁', { opcional: true, signo: true }), dI = lee(sc, 'dI1dt', 'dI₁/dt', { opcional: true, signo: true });
    if (I1 !== null) { res.flujo = M * I1; pasos.push({ t: `Con I<sub>1</sub> = ${f(I1)} A`, html: `Flujo en el circuito 2: Φ<sub>21</sub> = M I<sub>1</sub> = <b>${u(res.flujo, 'Wb')}</b>` }); }
    if (dI !== null) { res.fem = -M * dI; pasos.push({ t: `Si I<sub>1</sub> cambia a ${f(dI)} A/s`, html: `fem inducida en el circuito 2: ε<sub>2</sub> = −M dI<sub>1</sub>/dt = −${f(M)} · ${f(dI)} = <b>${f(res.fem)} V</b>` }); }
    if (r.L1 !== undefined) {
      const { L1, L2 } = r, D = L1 * L2 - M * M;
      Object.assign(res, { Ls: L1 + L2 + 2 * M, Lso: L1 + L2 - 2 * M, Lp: D / (L1 + L2 - 2 * M), Lpo: D / (L1 + L2 + 2 * M) });
      pasos.push({ t: 'Bobinas asociadas en serie', html: `Con los flujos que se suman (terminales homólogos seguidos): L = L<sub>1</sub> + L<sub>2</sub> + 2M = <b>${u(res.Ls, 'H')}</b>. Con los flujos opuestos: L = L<sub>1</sub> + L<sub>2</sub> − 2M = <b>${u(res.Lso, 'H')}</b>. Midiendo las dos se saca M = (L<sub>sumados</sub> − L<sub>opuestos</sub>)/4.` });
      pasos.push({ t: 'Bobinas asociadas en paralelo', html: `L = (L<sub>1</sub> L<sub>2</sub> − M<sup>2</sup>) / (L<sub>1</sub> + L<sub>2</sub> ∓ 2M): con los flujos que se suman, <b>${u(res.Lp, 'H')}</b>; con los flujos opuestos, <b>${u(res.Lpo, 'H')}</b>.${Math.abs(D) < 1e-12 * L1 * L2 ? ' Con k = 1 el numerador es 0: en paralelo y bien acopladas se comportan como una sola bobina sin ninguna L extra que se oponga.' : ''}` });
    }
    const I2 = lee(sc, 'I2', 'la intensidad I₂', { opcional: true, signo: true });
    if (I1 !== null && I2 !== null && r.L1 !== undefined) {
      const s = sc.sentido === 'opuesto' ? -1 : 1;
      res.U = 0.5 * r.L1 * I1 * I1 + 0.5 * r.L2 * I2 * I2 + s * M * I1 * I2;
      pasos.push({ t: 'Energía de los dos circuitos', html: `U = ½ L<sub>1</sub> I<sub>1</sub><sup>2</sup> + ½ L<sub>2</sub> I<sub>2</sub><sup>2</sup> ${s > 0 ? '+' : '−'} M I<sub>1</sub> I<sub>2</sub> (flujos ${s > 0 ? 'que se suman' : 'opuestos'}) = <b>${u(res.U, 'J')}</b>` });
    }
    return { G, p, res, pasos };
  }

  /* ---------- Circuito RL ---------- */
  // sc: { E (V), R (Ω), L (mH), modo: 'carga'|'descarga'|'pulsos', ton y toff (ms, en pulsos), t (ms) }
  function rl(sc) {
    const E = lee(sc, 'E', 'la fem de la fuente'), R = lee(sc, 'R', 'la resistencia'), L = lee(sc, 'L', 'la autoinducción') * 1e-3;
    const t = lee(sc, 't', 'el instante', { opcional: true, cero: true }), carga = sc.modo !== 'descarga';
    if (sc.modo === 'pulsos') return pulsos(sc, E, R, L, t);
    const tau = L / R, I0 = E / R;
    const I = (s) => (carga ? I0 * (1 - Math.exp(-s / tau)) : I0 * Math.exp(-s / tau));
    const VL = (s) => (carga ? E * Math.exp(-s / tau) : -E * Math.exp(-s / tau));
    const pasos = [
      { t: 'Ecuación del circuito', html: carga ? `Al cerrar el interruptor: ε = R I + L dI/dt ⇒ I(t) = (ε / R)(1 − e<sup>−t/τ</sup>)` : `Al quitar la fuente (la bobina se descarga por R): 0 = R I + L dI/dt ⇒ I(t) = I<sub>0</sub> e<sup>−t/τ</sup>, con I<sub>0</sub> = ε / R` },
      { t: 'Constante de tiempo', html: `τ = L / R = ${f(L)} / ${f(R)} = <b>${u(tau, 's')}</b>. ${carga ? 'Corriente final' : 'Corriente inicial'}: ε / R = <b>${u(I0, 'A')}</b>. Energía en la bobina con esa corriente: ½ L I<sup>2</sup> = ${u(0.5 * L * I0 * I0, 'J')}.` },
      { t: 'Tiempos característicos', html: `En t = τ la corriente ${carga ? 'llega al 63,2 %' : 'baja al 36,8 %'}; en 5τ = ${u(5 * tau, 's')} ${carga ? 'está al 99,3 % del valor final' : 'queda el 0,7 %'}. Tiempo para ${carga ? 'llegar a la mitad' : 'bajar a la mitad'}: τ ln 2 = ${u(tau * Math.LN2, 's')}.` },
    ];
    const res = { tau, I0 };
    if (t !== null) {
      const s = t * 1e-3, i = I(s);
      Object.assign(res, { It: i, VLt: VL(s), VRt: R * i, Ut: 0.5 * L * i * i });
      pasos.push({ t: `En t = ${f(t)} ms`, html: `I = ${carga ? `${f(I0)} (1 − e<sup>−${f(s)}/${f(tau)}</sup>)` : `${f(I0)} e<sup>−${f(s)}/${f(tau)}</sup>`} = <b>${u(i, 'A')}</b> · V<sub>R</sub> = R I = ${u(R * i, 'V')} · V<sub>L</sub> = L dI/dt = ${u(VL(s), 'V')} · U = ½ L I<sup>2</sup> = ${u(0.5 * L * i * i, 'J')}` });
      if (carga) {
        const Wf = E * I0 * (s - tau * (1 - Math.exp(-s / tau))), U = 0.5 * L * i * i;
        Object.assign(res, { Wf, WR: Wf - U });
        pasos.push({ t: 'Balance de energía hasta t', html: `La fuente ha dado W<sub>ε</sub> = ∫ε I dt = ε I<sub>0</sub> (t − τ (1 − e<sup>−t/τ</sup>)) = <b>${u(Wf, 'J')}</b>. De ella, ½ L I<sup>2</sup> = ${u(U, 'J')} queda en la bobina y el resto, W<sub>R</sub> = ∫R I<sup>2</sup> dt = <b>${u(Wf - U, 'J')}</b>, se disipa en la resistencia.` });
      } else {
        const WR = 0.5 * L * I0 * I0 * (1 - Math.exp((-2 * s) / tau));
        res.WR = WR;
        pasos.push({ t: 'Energía disipada hasta t', html: `W<sub>R</sub> = ∫<sub>0</sub><sup>t</sup> R I<sup>2</sup> dt = ½ L I<sub>0</sub><sup>2</sup> (1 − e<sup>−2t/τ</sup>) = <b>${u(WR, 'J')}</b>. Al final se disipa toda la energía que tenía la bobina, ½ L I<sub>0</sub><sup>2</sup> = ${u(0.5 * L * I0 * I0, 'J')}.` });
      }
    }
    return { p: { E, R, L, carga, t }, res, I, VL, tau, pasos };
  }

  // la fuente se conecta durante ton y se quita durante toff, una y otra vez (la bobina se descarga por R)
  function pulsos(sc, E, R, L, t) {
    const ton = lee(sc, 'ton', 'el tiempo conectada') * 1e-3, toff = lee(sc, 'toff', 'el tiempo desconectada') * 1e-3;
    const tau = L / R, I0 = E / R, P = ton + toff, a = Math.exp(-ton / tau), b = Math.exp(-toff / tau), A = a * b;
    const Imax = (I0 * (1 - a)) / (1 - A), Imin = Imax * b, Imed = (I0 * ton) / P;
    const inicio = (k) => Imin * (1 - Math.pow(A, k));
    const I = (s) => { const k = Math.floor(s / P), x = s - k * P, i0 = inicio(k); if (x < ton) return I0 + (i0 - I0) * Math.exp(-x / tau); return (I0 + (i0 - I0) * a) * Math.exp(-(x - ton) / tau); };
    const VL = (s) => { const x = s - Math.floor(s / P) * P; return x < ton ? E - R * I(s) : -R * I(s); };
    const pasos = [
      { t: 'Cada tramo', html: `Mientras está conectada, I tiende a ε/R = ${u(I0, 'A')} con τ = L/R = <b>${u(tau, 's')}</b>: I = ε/R + (I<sub>inicio</sub> − ε/R) e<sup>−t/τ</sup>. Al quitar la fuente, la bobina se descarga por R: I = I<sub>fin</sub> e<sup>−t/τ</sup>. Cada tramo empieza con la corriente con la que acabó el anterior, porque la corriente en una bobina no puede saltar.` },
      { t: 'Régimen permanente', html: `Tras unos ciclos, la corriente sube y baja siempre entre los mismos valores. Imponiendo que un ciclo termine como empieza: I<sub>máx</sub> = (ε/R)(1 − e<sup>−t<sub>on</sub>/τ</sup>) / (1 − e<sup>−T/τ</sup>) = <b>${u(Imax, 'A')}</b> e I<sub>mín</sub> = I<sub>máx</sub> e<sup>−t<sub>off</sub>/τ</sup> = <b>${u(Imin, 'A')}</b>, con T = ${u(P, 's')}.` },
      { t: 'Corriente media', html: `En un ciclo la tensión media en la bobina es 0, así que R I<sub>media</sub> = ε t<sub>on</sub>/T: I<sub>media</sub> = <b>${u(Imed, 'A')}</b> (${f((100 * ton) / P, 3)} % del tiempo conectada). Es la idea de la regulación por PWM. El rizado es I<sub>máx</sub> − I<sub>mín</sub> = ${u(Imax - Imin, 'A')}${tau > 3 * P ? ', pequeño porque τ es mucho mayor que el periodo' : ''}.` },
    ];
    const res = { tau, I0, Imax, Imin, Imed };
    if (t !== null) { const s = t * 1e-3, i = I(s); Object.assign(res, { It: i, VLt: VL(s), VRt: R * i, Ut: 0.5 * L * i * i }); pasos.push({ t: `En t = ${f(t)} ms`, html: `Va por el ciclo ${Math.floor(s / P) + 1}, ${s - Math.floor(s / P) * P < ton ? 'conectada' : 'desconectada'}: I = <b>${u(i, 'A')}</b>, V<sub>L</sub> = ${u(VL(s), 'V')} y U = ½ L I<sup>2</sup> = ${u(0.5 * L * i * i, 'J')}.` }); }
    return { p: { E, R, L, carga: true, pulsos: true, ton, toff, t }, res, I, VL, tau, pasos };
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
    RL: [
      { clave: 'carga', nombre: 'Se cierra el interruptor', sc: { E: '12', R: '6', L: '300', modo: 'carga', t: '50' } },
      { clave: 'descarga', nombre: 'La bobina se descarga por la resistencia', sc: { E: '10', R: '100', L: '500', modo: 'descarga', t: '2' } },
      { clave: 'pulsos', nombre: 'Se conecta y desconecta una y otra vez', sc: { E: '12', R: '10', L: '50', modo: 'pulsos', ton: '5', toff: '5', t: '' } },
    ],
  };

  return { autoinduccion, mutua, rl, GEO_L, GEO_M, ejemplos, f, u, MU0 };
})();
if (typeof module !== 'undefined') module.exports = Induccion;
