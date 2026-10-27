/* =====================================================================
   Física moderna (sin DOM): efecto fotoeléctrico (energía del fotón,
   trabajo de extracción, energía cinética máxima, potencial de frenado y
   frecuencia umbral), longitud de onda de De Broglie, y relatividad
   especial: factor de Lorentz, dilatación del tiempo, contracción de
   longitudes y energía relativista. Constantes del temario:
   h = 6,626·10⁻³⁴ J·s, c = 3·10⁸ m/s, e = 1,602·10⁻¹⁹ C. Formato y
   lectura de campos de calculadora.js; interfaz en fisica-moderna/app.js.
     resolver(sc)  { modo: 'fotoelectrico' | 'debroglie' | 'dilatacion' | 'contraccion' | 'energia', … } → { …, pasos }
   ===================================================================== */
const FisicaModerna = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { lee } = K;
  // como Calculadora.f, pero con ·10ⁿ desde 10⁵ y sin redondear a 0 los números diminutos (10⁻³⁴ J·s)
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const H = 6.626e-34, C = 3e8, E = 1.602e-19, MEV = 1.602e-13;
  const MODOS = { fotoelectrico: 'Efecto fotoeléctrico', debroglie: 'Longitud de onda de De Broglie', dilatacion: 'Dilatación del tiempo', contraccion: 'Contracción de longitudes', energia: 'Energía y momento relativistas' };
  // trabajo de extracción en eV
  const METALES = { cesio: ['Cesio', 2.14], potasio: ['Potasio', 2.3], sodio: ['Sodio', 2.28], calcio: ['Calcio', 2.87], zinc: ['Zinc', 4.33], cobre: ['Cobre', 4.7], plata: ['Plata', 4.73], platino: ['Platino', 5.65], otro: ['Otro', null] };
  // masa en kg
  const PARTICULAS = { electron: ['Electrón', 9.109e-31], proton: ['Protón', 1.673e-27], neutron: ['Neutrón', 1.675e-27], otra: ['Otra', null] };
  const n = (x, d = 4) => f(x, d);
  // β = v/c, de una velocidad en fracción de c o en m/s
  function beta(sc) {
    const ms = sc.uv === 'ms', v = lee(sc, 'v', 'la velocidad', { min: 0, minEx: true });
    const b = ms ? v / C : v;
    if (b >= 1) throw new Error(ms ? 'La velocidad tiene que ser menor que la de la luz, 3·10^8 m/s' : 'v/c tiene que ser menor que 1');
    return { b, v: b * C, ms };
  }
  const lorentz = (b) => 1 / Math.sqrt(1 - b * b);
  // γ − 1 sin restar números casi iguales (para velocidades pequeñas)
  const gm1 = (b) => { const r = Math.sqrt(1 - b * b); return (b * b) / (r * (1 + r)); };
  const pasoGamma = (b, g, ms) => ({ t: 'Factor de Lorentz', html: `${ms ? `$β = v/c = {${n(b * C, 5)}}/{3·10^8} = ${n(b, 6)}$. ` : ''}$γ = 1/√(1 − β^2) = 1/√(1 − ${n(b, 6)}^2) = ${n(g, 6)}$` });

  function fotoelectrico(sc) {
    const met = METALES[sc.metal] ? sc.metal : 'sodio', W = met === 'otro' ? lee(sc, 'W', 'el trabajo de extracción', { min: 0, minEx: true }) : METALES[met][1];
    const x = lee(sc, 'valor', sc.dato === 'f' ? 'la frecuencia' : sc.dato === 'E' ? 'la energía del fotón' : 'la longitud de onda', { min: 0, minEx: true });
    const fr = sc.dato === 'f' ? x : sc.dato === 'E' ? (x * E) / H : C / (x * 1e-9), lam = C / fr, Ef = H * fr, Ev = Ef / E, f0 = (W * E) / H, lam0 = C / f0, pasos = [];
    pasos.push({ t: 'Energía del fotón', html: sc.dato === 'f' ? `$E = h f = 6,626·10^{−34} · ${n(fr, 5)} = ${n(Ef, 5)} "J"$ = ${n(Ev, 5)} eV` : sc.dato === 'E' ? `$E = ${n(x, 5)} "eV"$ = ${n(Ef, 5)} J, con $f = E/h = ${n(fr, 5)} "Hz"$` : `$E = h c/λ = {6,626·10^{−34} · 3·10^8}/{${n(x, 5)}·10^{−9}} = ${n(Ef, 5)} "J"$ = ${n(Ev, 5)} eV` });
    pasos.push({ t: 'Umbral del metal', html: `${met === 'otro' ? 'El metal' : `El ${METALES[met][0].toLowerCase()}`} tiene $W_0 = ${n(W, 4)} "eV"$ = ${n(W * E, 4)} J. Frecuencia umbral: $f_0 = W_0/h = ${n(f0, 4)} "Hz"$; longitud de onda umbral: $λ_0 = c/f_0 = ${n(lam0 * 1e9, 4)} "nm"$.` });
    if (Ev < W) {
      pasos.push({ t: 'No hay efecto fotoeléctrico', html: `$E = ${n(Ev, 4)} "eV" < W_0 = ${n(W, 4)} "eV"$ ($f < f_0$): ningún fotón tiene energía para arrancar un electrón, por mucha intensidad que tenga la luz. Hace falta una longitud de onda menor que ${n(lam0 * 1e9, 4)} nm.` });
      return { modo: 'fotoelectrico', met, W, fr, lam, Ef, Ev, f0, lam0, emite: false, Ec: 0, pasos };
    }
    const Ec = Ev - W, EcJ = Ec * E, vmax = Math.sqrt((2 * EcJ) / PARTICULAS.electron[1]);
    pasos.push({ t: 'Energía cinética máxima', html: `Ecuación de Einstein: $E_{c,máx} = h f − W_0 = ${n(Ev, 5)} − ${n(W, 4)} = ${n(Ec, 4)} "eV"$ = ${n(EcJ, 4)} J` });
    pasos.push({ t: 'Velocidad máxima de los electrones', html: `$v_{máx} = √(2 E_{c,máx}/m_e) = √({2 · ${n(EcJ, 4)}}/{9,109·10^{−31}}) = ${n(vmax, 4)} "m/s"$` });
    pasos.push({ t: 'Potencial de frenado', html: `$e V_0 = E_{c,máx}$, así que $V_0 = ${n(Ec, 4)} "V"$: con esa tensión en contra, ni los electrones más rápidos llegan al otro electrodo.` });
    return { modo: 'fotoelectrico', met, W, fr, lam, Ef, Ev, f0, lam0, emite: true, Ec, EcJ, vmax, V0: Ec, pasos };
  }

  function debroglie(sc) {
    const pa = PARTICULAS[sc.particula] ? sc.particula : 'electron', m = pa === 'otra' ? lee(sc, 'm', 'la masa', { min: 0, minEx: true }) : PARTICULAS[pa][1], E0 = m * C * C, pasos = [];
    let p, Ec, b;
    if (sc.dato === 'v') {
      ({ b } = beta(sc)); const g = lorentz(b);
      p = g * m * b * C; Ec = gm1(b) * E0;
      pasos.push({ t: 'Momento lineal', html: b < 0.1 ? `$p = m v = ${n(m)} · ${n(b * C, 5)} = ${n(p, 5)} "kg·m/s"$` : `Con $v = ${n(b, 4)} c$ hay que usar la relatividad: $γ = ${n(g, 5)}$ y $p = γ m v = ${n(p, 5)} "kg·m/s"$` });
    } else {
      const ev = lee(sc, 'valor', sc.dato === 'V' ? 'la tensión' : 'la energía cinética', { min: 0, minEx: true });
      Ec = ev * E;
      if (pa === 'otra' && sc.dato === 'V') throw new Error('Para acelerar con una tensión hace falta la carga: elige electrón o protón');
      if (pa === 'neutron' && sc.dato === 'V') throw new Error('El neutrón no tiene carga: no se acelera con una tensión');
      p = Math.sqrt(Ec * Ec + 2 * Ec * E0) / C; b = (p * C) / (Ec + E0);
      const pc = Math.sqrt(2 * m * Ec);
      pasos.push({ t: sc.dato === 'V' ? 'Energía que gana al acelerarse' : 'Energía cinética', html: sc.dato === 'V' ? `$E_c = q V = ${n(ev, 5)} "eV"$ = ${n(Ec, 5)} J` : `$E_c = ${n(ev, 5)} "eV"$ = ${n(Ec, 5)} J` });
      pasos.push({ t: 'Momento lineal', html: Ec < 0.01 * E0 ? `$p = √(2 m E_c) = √(2 · ${n(m)} · ${n(Ec, 5)}) = ${n(p, 5)} "kg·m/s"$` : `La energía no es pequeña frente a $m c^2$ (${n(E0 / MEV, 4)} MeV): $p = √(E_c^2 + 2 E_c m c^2)/c = ${n(p, 5)} "kg·m/s"$ (sin relatividad saldría ${n(pc, 5)}).` });
    }
    const lam = H / p;
    pasos.push({ t: 'Longitud de onda de De Broglie', html: `$λ = h/p = {6,626·10^{−34}}/{${n(p, 5)}} = ${n(lam, 4)} "m"$${lam < 1e-6 && lam > 1e-12 ? ` = ${n(lam * 1e9, 4)} nm` : ''}` });
    pasos.push({ t: 'Qué significa', html: lam > 1e-11 && lam < 1e-8 ? 'Es del tamaño de la distancia entre los átomos de un cristal: estos electrones se difractan, como los rayos X. Así funciona el microscopio electrónico.' : lam < 1e-20 ? 'Es muchísimo más pequeña que un núcleo atómico: en un objeto así no se nota ningún efecto de onda.' : 'Comparada con el tamaño de lo que la rodea, decide si se notan efectos de onda (difracción) o no.' });
    return { modo: 'debroglie', pa, m, p, Ec, b, lam, pasos };
  }

  function dilatacion(sc) {
    const { b, ms } = beta(sc), g = lorentz(b), t0 = lee(sc, 't0', 'el tiempo propio', { min: 0, minEx: true }), t = g * t0, pasos = [pasoGamma(b, g, ms)];
    pasos.push({ t: 'Tiempo dilatado', html: `$Δt = γ Δt_0 = ${n(g, 6)} · ${n(t0, 5)} = ${n(t, 5)} "s"$: lo que dura en el sistema que ve moverse el reloj es ${n(g, 4)} veces lo que marca el propio reloj.` });
    const d0 = b * C * t0, d = b * C * t;
    pasos.push({ t: 'Distancia recorrida', html: `Sin relatividad recorrería $v Δt_0 = ${n(d0, 4)} "m"$; con la dilatación, $v Δt = ${n(b * C, 5)} · ${n(t, 5)} = ${n(d, 4)} "m"$.` });
    return { modo: 'dilatacion', b, g, t0, t, d0, d, pasos };
  }

  function contraccion(sc) {
    const { b, ms } = beta(sc), g = lorentz(b), L0 = lee(sc, 'L0', 'la longitud propia', { min: 0, minEx: true }), L = L0 / g, pasos = [pasoGamma(b, g, ms)];
    pasos.push({ t: 'Longitud contraída', html: `$L = L_0/γ = L_0 √(1 − β^2) = ${n(L0, 5)}/${n(g, 6)} = ${n(L, 5)} "m"$: se acorta un ${n(100 * (1 - 1 / g), 4)} %, solo en la dirección del movimiento.` });
    return { modo: 'contraccion', b, g, L0, L, pasos };
  }

  function energia(sc) {
    const pa = PARTICULAS[sc.particula] ? sc.particula : 'electron', m = pa === 'otra' ? lee(sc, 'm', 'la masa', { min: 0, minEx: true }) : PARTICULAS[pa][1];
    const { b, ms } = beta(sc), g = lorentz(b), E0 = m * C * C, Et = g * E0, Ec = gm1(b) * E0, p = g * m * b * C, Ecl = 0.5 * m * (b * C) ** 2, pasos = [pasoGamma(b, g, ms)];
    pasos.push({ t: 'Energía en reposo', html: `$E_0 = m c^2 = ${n(m)} · (3·10^8)^2 = ${n(E0, 5)} "J"$ = ${n(E0 / MEV, 5)} MeV` });
    pasos.push({ t: 'Energía total y cinética', html: `$E = γ m c^2 = ${n(Et, 5)} "J"$ y $E_c = (γ − 1) m c^2 = ${n(Ec, 5)} "J"$ = ${n(Ec / MEV, 5)} MeV. Con la fórmula clásica, $m v^2/2$, saldría ${n(Ecl, 5)} J (${n(100 * (Ecl / Ec - 1), 3)} %).` });
    pasos.push({ t: 'Momento lineal', html: `$p = γ m v = ${n(p, 5)} "kg·m/s"$, y se cumple $E^2 = (p c)^2 + (m c^2)^2$.` });
    return { modo: 'energia', pa, m, b, g, E0, Et, Ec, p, Ecl, pasos };
  }

  const R = { fotoelectrico, debroglie, dilatacion, contraccion, energia };
  const resolver = (sc) => (R[sc.modo] || fotoelectrico)(sc);

  const ejemplos = [
    { clave: 'sodio', nombre: 'Luz violeta de 400 nm sobre sodio', sc: { modo: 'fotoelectrico', dato: 'lambda', valor: '400', metal: 'sodio' } },
    { clave: 'cobre', nombre: 'Luz roja sobre cobre: no arranca electrones', sc: { modo: 'fotoelectrico', dato: 'lambda', valor: '650', metal: 'cobre' } },
    { clave: 'electron', nombre: 'Electrón acelerado con 100 V', sc: { modo: 'debroglie', particula: 'electron', dato: 'V', valor: '100' } },
    { clave: 'pelota', nombre: 'Una pelota de tenis de 150 g a 40 m/s', sc: { modo: 'debroglie', particula: 'otra', m: '0,15', dato: 'v', uv: 'ms', v: '40' } },
    { clave: 'muon', nombre: 'Muones de los rayos cósmicos a 0,998c', sc: { modo: 'dilatacion', uv: 'c', v: '0,998', t0: '2,2e-6' } },
    { clave: 'nave', nombre: 'Una nave de 100 m a 0,8c', sc: { modo: 'contraccion', uv: 'c', v: '0,8', L0: '100' } },
    { clave: 'proton', nombre: 'Protón a 0,9c', sc: { modo: 'energia', particula: 'proton', uv: 'c', v: '0,9' } },
  ];

  return { resolver, ejemplos, MODOS, METALES, PARTICULAS, H, C, E, lorentz, f };
})();
if (typeof module !== 'undefined') module.exports = FisicaModerna;
