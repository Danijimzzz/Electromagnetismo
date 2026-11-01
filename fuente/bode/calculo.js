/* =====================================================================
   Diagramas de Bode y filtros · cálculo (sin DOM). Filtros pasivos de primer
   y segundo orden: RC y RL (paso bajo y paso alto) y RLC en serie (paso bajo,
   paso alto, paso banda y rechazo de banda). La función de transferencia se
   guarda como cociente de polinomios en s = jω (coeficientes de menor a
   mayor grado), igual que la que resuelve el Simulador de circuitos
   (fuente/simulador/motor.js); la prueba comprueba que dan lo mismo.
     resolver(sc)   → { tipo, f0, Q, fc[], punto, pasos, H(f), curva(), asintota(f) … }
     TIPOS          los ocho filtros y qué componentes llevan
     ejemplos       para el desplegable y Mis ejercicios
   Los campos aceptan prefijos y unidades (4k7, 100n, 10 µF) con Herramienta.leeSI.
   ===================================================================== */
const Bode = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const vacio = Herramienta.vacio;

  // Los ocho filtros. orden: 1 o 2; comp: componentes que llevan; salida: dónde se mide
  const TIPOS = {
    'rc-bajo': { nombre: 'RC paso bajo', orden: 1, comp: ['R', 'C'], salida: 'en el condensador', clase: 'bajo' },
    'rc-alto': { nombre: 'RC paso alto', orden: 1, comp: ['R', 'C'], salida: 'en la resistencia', clase: 'alto' },
    'rl-bajo': { nombre: 'RL paso bajo', orden: 1, comp: ['R', 'L'], salida: 'en la resistencia', clase: 'bajo' },
    'rl-alto': { nombre: 'RL paso alto', orden: 1, comp: ['R', 'L'], salida: 'en la bobina', clase: 'alto' },
    'rlc-bajo': { nombre: 'RLC paso bajo', orden: 2, comp: ['R', 'L', 'C'], salida: 'en el condensador', clase: 'bajo' },
    'rlc-alto': { nombre: 'RLC paso alto', orden: 2, comp: ['R', 'L', 'C'], salida: 'en la bobina', clase: 'alto' },
    'rlc-banda': { nombre: 'RLC paso banda', orden: 2, comp: ['R', 'L', 'C'], salida: 'en la resistencia', clase: 'banda' },
    'rlc-rechazo': { nombre: 'RLC rechazo de banda', orden: 2, comp: ['R', 'L', 'C'], salida: 'en la bobina y el condensador juntos', clase: 'rechazo' },
  };
  const UNIDAD = { R: ['la resistencia', 1, 'Ω'], L: ['la inductancia', 1e-3, 'mH'], C: ['la capacidad', 1e-6, 'µF'] };

  function lee(sc, k) {
    const [nom, base] = UNIDAD[k];
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = Herramienta.leeSI(sc[k], base);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (v <= 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser mayor que 0`);
    return v;
  }
  const leeF = (sc, k, nom) => {
    if (vacio(sc[k])) return null;
    const v = Herramienta.leeSI(sc[k], 1);
    if (!isFinite(v) || v <= 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número mayor que 0`);
    return v;
  };

  // Coeficientes [a0, a1, a2] de N(s) y D(s) de cada filtro (s = jω)
  function polinomios(tipo, R, L, C) {
    switch (tipo) {
      case 'rc-bajo': return { N: [1], D: [1, R * C] };
      case 'rc-alto': return { N: [0, R * C], D: [1, R * C] };
      case 'rl-bajo': return { N: [1], D: [1, L / R] };
      case 'rl-alto': return { N: [0, L / R], D: [1, L / R] };
      case 'rlc-bajo': return { N: [1], D: [1, R * C, L * C] };
      case 'rlc-alto': return { N: [0, 0, L * C], D: [1, R * C, L * C] };
      case 'rlc-banda': return { N: [0, R * C], D: [1, R * C, L * C] };
      default: return { N: [1, 0, L * C], D: [1, R * C, L * C] };
    }
  }
  // valor de un polinomio en s = jω: [re, im]
  function evalua(p, w) {
    let re = 0, im = 0, pot = [[1, 0], [0, w], [-w * w, 0], [0, -w * w * w]];
    p.forEach((a, k) => { re += a * pot[k][0]; im += a * pot[k][1]; });
    return [re, im];
  }
  function Hde(P, fr) {
    const w = 2 * Math.PI * fr, [nr, ni] = evalua(P.N, w), [dr, di] = evalua(P.D, w), d2 = dr * dr + di * di;
    const re = (nr * dr + ni * di) / d2, im = (ni * dr - nr * di) / d2, m = Math.hypot(re, im);
    return { re, im, mod: m, dB: 20 * Math.log10(Math.max(m, 1e-300)), fase: Math.atan2(im, re) * 180 / Math.PI };
  }

  // frecuencias en que |H| = 1/√2 (se busca por barrido en escala logarítmica y se afina por bisección)
  function corte(P, fa, fb) {
    const g = (fr) => Hde(P, fr).mod - Math.SQRT1_2, n = 1201, out = [];
    let fp = fa, gp = g(fa);
    for (let k = 1; k <= n; k++) {
      const fk = fa * Math.pow(fb / fa, k / n), gk = g(fk);
      if (gp * gk < 0) {
        let lo = fp, hi = fk;
        for (let i = 0; i < 80; i++) { const m = Math.sqrt(lo * hi); if (g(m) * g(lo) > 0) lo = m; else hi = m; }
        out.push(Math.sqrt(lo * hi));
      }
      fp = fk; gp = gk;
    }
    return out;
  }

  // Aproximación asintótica (en dB) de cada clase de filtro
  function asintotaDe(clase, orden, fref) {
    const l = (fr) => Math.log10(fr / fref);
    return (fr) => {
      const x = l(fr);
      if (clase === 'bajo') return -20 * orden * Math.max(0, x);
      if (clase === 'alto') return 20 * orden * Math.min(0, x);
      if (clase === 'banda') return -20 * Math.abs(x);
      return 0;
    };
  }

  function resolver(sc) {
    const t = TIPOS[sc.tipo];
    if (!t) throw new Error('Elige un tipo de filtro');
    const R = lee(sc, 'R'), L = t.comp.includes('L') ? lee(sc, 'L') : 0, C = t.comp.includes('C') ? lee(sc, 'C') : 0;
    const P = polinomios(sc.tipo, R, L, C), clase = t.clase;
    // frecuencia característica y factor de calidad
    let fref, Q = null, zeta = null, tau = null;
    if (t.orden === 1) { tau = sc.tipo.startsWith('rc') ? R * C : L / R; fref = 1 / (2 * Math.PI * tau); }
    else { fref = 1 / (2 * Math.PI * Math.sqrt(L * C)); Q = Math.sqrt(L / C) / R; zeta = 1 / (2 * Q); }
    const cortes = corte(P, fref / 1e3, fref * 1e3);
    const pendiente = clase === 'banda' ? 20 : clase === 'rechazo' ? 0 : 20 * t.orden;
    // resonancia (pico) de los de segundo orden bajo y alto
    let pico = null;
    if (t.orden === 2 && (clase === 'bajo' || clase === 'alto') && Q > Math.SQRT1_2) {
      const fp = clase === 'bajo' ? fref * Math.sqrt(1 - 1 / (2 * Q * Q)) : fref / Math.sqrt(1 - 1 / (2 * Q * Q));
      pico = { f: fp, dB: Hde(P, fp).dB };
    }
    const BW = (clase === 'banda' || clase === 'rechazo') && cortes.length === 2 ? cortes[1] - cortes[0] : null;
    // rango del diagrama y punto de interés
    const fmin = leeF(sc, 'fmin', 'la frecuencia mínima') ?? fref / 100, fmax = leeF(sc, 'fmax', 'la frecuencia máxima') ?? fref * 100;
    if (!(fmax > fmin)) throw new Error('La frecuencia máxima debe ser mayor que la mínima');
    const fp = leeF(sc, 'f', 'la frecuencia de interés');
    const punto = fp === null ? null : { f: fp, ...Hde(P, fp) };
    const curva = (n = 400) => {
      const o = { f: [], dB: [], fase: [] };
      for (let k = 0; k < n; k++) { const fr = fmin * Math.pow(fmax / fmin, k / (n - 1)), h = Hde(P, fr); o.f.push(fr); o.dB.push(h.dB); o.fase.push(h.fase); }
      return o;
    };
    const asintota = asintotaDe(clase, t.orden, fref);

    // desarrollo paso a paso
    const pasos = [];
    const datos = [`$R = ${f(R)} "Ω"$`, L ? `$L = ${f(L)} "H"$` : '', C ? `$C = ${f(C)} "F"$` : ''].filter(Boolean).join(', ');
    pasos.push({ t: `Filtro ${t.nombre}`, html: `Se mide la tensión ${t.salida}. Datos: ${datos}.` });
    const Hs = {
      'rc-bajo': '1/(1 + jωRC)', 'rc-alto': 'jωRC/(1 + jωRC)', 'rl-bajo': '1/(1 + jωL/R)', 'rl-alto': '(jωL/R)/(1 + jωL/R)',
      'rlc-bajo': '1/(1 − ω²LC + jωRC)', 'rlc-alto': '(−ω²LC)/(1 − ω²LC + jωRC)', 'rlc-banda': 'jωRC/(1 − ω²LC + jωRC)', 'rlc-rechazo': '(1 − ω²LC)/(1 − ω²LC + jωRC)',
    }[sc.tipo];
    pasos.push({ t: 'Función de transferencia', html: `Divisor de tensión con impedancias: $H(jω) = V_"sal"/V_"ent" = ${Hs}$` });
    if (t.orden === 1) {
      pasos.push({ t: 'Constante de tiempo y frecuencia de corte', html: `$τ = ${sc.tipo.startsWith('rc') ? 'RC' : 'L/R'} = ${f(tau)} "s"$, $f_c = 1/(2πτ) = ${f(fref)} "Hz"$ (a esa frecuencia $|H| = 1/√2$, es decir −3 dB, y la fase vale ${clase === 'bajo' ? '−45°' : '+45°'})` });
    } else {
      pasos.push({ t: 'Frecuencia propia y factor de calidad', html: `$f_0 = 1/(2π√(LC)) = ${f(fref)} "Hz"$, $Q = (1/R)√(L/C) = ${f(Q)}$, $ζ = 1/(2Q) = ${f(zeta)}$` });
      pasos.push({ t: 'Amortiguamiento', html: Q > 0.5 ? (Q > Math.SQRT1_2 && (clase === 'bajo' || clase === 'alto') ? `Como $Q > 1/√2$, hay un pico de resonancia de ${f(pico.dB)} dB en $f = ${f(pico.f)} "Hz"$.` : 'Respuesta sin pico apreciable.') : `Como $Q ≤ 1/2$ el filtro es sobreamortiguado: sus polos son reales y el diagrama se parece al de dos filtros de primer orden seguidos.` });
      if (BW !== null) pasos.push({ t: 'Ancho de banda', html: `$f_1 = ${f(cortes[0])} "Hz"$ y $f_2 = ${f(cortes[1])} "Hz"$ (−3 dB), $"BW" = f_2 − f_1 = ${f(BW)} "Hz"$ ($f_0/Q = ${f(fref / Q)} "Hz"$)` });
      else if (cortes.length) pasos.push({ t: 'Frecuencia de corte a −3 dB', html: `$f_c = ${f(cortes[0])} "Hz"$` });
    }
    pasos.push({ t: 'Pendiente de las asíntotas', html: clase === 'rechazo' ? 'Ganancia de 0 dB lejos de $f_0$, con un mínimo muy marcado en $f_0$.' : clase === 'banda' ? `$+20 "dB/dec"$ por debajo de $f_0$ y $−20 "dB/dec"$ por encima` : clase === 'bajo' ? `$0 "dB"$ hasta $${t.orden === 1 ? 'f_c' : 'f_0'}$ y $−${20 * t.orden} "dB/dec"$ después` : `$+${20 * t.orden} "dB/dec"$ hasta $${t.orden === 1 ? 'f_c' : 'f_0'}$ y $0 "dB"$ después` });
    if (punto) pasos.push({ t: `Valor en f = ${f(punto.f)} Hz`, html: `$|H| = ${f(punto.mod)}$ (${f(punto.dB)} dB), $φ = ${f(punto.fase)}°$ y $H = ${f(punto.re)} ${punto.im < 0 ? '−' : '+'} j${f(Math.abs(punto.im))}$` });
    return { sc, tipo: sc.tipo, def: t, R, L, C, P, f0: fref, Q, zeta, tau, cortes, BW, pendiente, pico, fmin, fmax, punto, curva, asintota, pasos };
  }

  // Para comprobar con el motor del simulador: tensión de salida / fuente de entrada
  function circuitoSimulador(tipo, R, L, C) {
    const e = { id: 'V1', t: 'V', p: ['in', '0'], onda: { tipo: 'seno', A: 1, f: 1 } };
    const r = { id: 'R1', t: 'R', R }, l = { id: 'L1', t: 'L', L }, c = { id: 'C1', t: 'C', C };
    const el = (x, a, b) => ({ ...x, p: [a, b] });
    switch (tipo) {
      case 'rc-bajo': return { net: { elementos: [e, el(r, 'in', 'out'), el(c, 'out', '0')] }, sal: ['out', '0'] };
      case 'rc-alto': return { net: { elementos: [e, el(c, 'in', 'out'), el(r, 'out', '0')] }, sal: ['out', '0'] };
      case 'rl-bajo': return { net: { elementos: [e, el(l, 'in', 'out'), el(r, 'out', '0')] }, sal: ['out', '0'] };
      case 'rl-alto': return { net: { elementos: [e, el(r, 'in', 'out'), el(l, 'out', '0')] }, sal: ['out', '0'] };
      case 'rlc-bajo': return { net: { elementos: [e, el(r, 'in', 'a'), el(l, 'a', 'out'), el(c, 'out', '0')] }, sal: ['out', '0'] };
      case 'rlc-alto': return { net: { elementos: [e, el(r, 'in', 'a'), el(c, 'a', 'out'), el(l, 'out', '0')] }, sal: ['out', '0'] };
      case 'rlc-banda': return { net: { elementos: [e, el(l, 'in', 'a'), el(c, 'a', 'out'), el(r, 'out', '0')] }, sal: ['out', '0'] };
      default: return { net: { elementos: [e, el(r, 'in', 'out'), el(l, 'out', 'a'), el(c, 'a', '0')] }, sal: ['out', '0'] };
    }
  }

  const ejemplos = [
    { clave: 'rc-bajo', nombre: 'RC paso bajo: 1 kΩ y 159 nF (fc ≈ 1 kHz)', sc: { tipo: 'rc-bajo', R: '1k', L: '', C: '0,159', f: '', fmin: '', fmax: '' } },
    { clave: 'rc-alto', nombre: 'RC paso alto: 10 kΩ y 10 nF (fc ≈ 1,6 kHz)', sc: { tipo: 'rc-alto', R: '10k', L: '', C: '0,01', f: '1k', fmin: '', fmax: '' } },
    { clave: 'rl-bajo', nombre: 'RL paso bajo: 100 Ω y 10 mH', sc: { tipo: 'rl-bajo', R: '100', L: '10', C: '', f: '', fmin: '', fmax: '' } },
    { clave: 'rlc-banda', nombre: 'RLC paso banda: sintonía de 1 kHz (Q ≈ 10)', sc: { tipo: 'rlc-banda', R: '10', L: '15,9', C: '1,59', f: '', fmin: '', fmax: '' } },
    { clave: 'rlc-bajo', nombre: 'RLC paso bajo con resonancia (Q ≈ 3)', sc: { tipo: 'rlc-bajo', R: '210', L: '100', C: '0,253', f: '', fmin: '', fmax: '' } },
    { clave: 'rlc-rechazo', nombre: 'RLC rechazo de banda: elimina los 50 Hz', sc: { tipo: 'rlc-rechazo', R: '100', L: '1000', C: '10', f: '50', fmin: '5', fmax: '5000' } },
  ];

  return { resolver, ejemplos, TIPOS, UNIDAD, Hde, polinomios, circuitoSimulador, f };
})();
if (typeof module !== 'undefined') module.exports = Bode;
