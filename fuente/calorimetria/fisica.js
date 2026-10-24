/* =====================================================================
   Calorimetría (sin DOM): temperatura de equilibrio al mezclar cuerpos,
   con cambios de fase. Cada cuerpo tiene una entalpía H(T) que crece con la
   temperatura y salta en la fusión y en la ebullición; el equilibrio es la
   temperatura en la que la suma de los calores es cero. Entre dos
   temperaturas de cambio de fase H es lineal, así que la solución es exacta.
   Masas en g, temperaturas en °C, c en J/(kg·K), L en J/kg.
   ===================================================================== */
const Calor = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-9) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
  // un número negativo entre paréntesis, para restarlo: 0 − (−10)
  const par = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

  // c en J/(kg·K) de sólido, líquido y gas; Tf y Tv en °C; Lf y Lv en J/kg
  const SUSTANCIAS = {
    agua: { nombre: 'Agua', cs: 2090, cl: 4180, cg: 2010, Tf: 0, Tv: 100, Lf: 334e3, Lv: 2257e3, fases: ['hielo', 'agua', 'vapor'] },
    etanol: { nombre: 'Etanol', cs: 1960, cl: 2440, cg: 1420, Tf: -114, Tv: 78, Lf: 108e3, Lv: 855e3 },
    aluminio: { nombre: 'Aluminio', cs: 900, cl: 1180, Tf: 660, Lf: 397e3 },
    cobre: { nombre: 'Cobre', cs: 385, cl: 494, Tf: 1085, Lf: 205e3 },
    hierro: { nombre: 'Hierro', cs: 450, cl: 820, Tf: 1538, Lf: 247e3 },
    plomo: { nombre: 'Plomo', cs: 128, cl: 142, Tf: 327.5, Lf: 23e3 },
    estano: { nombre: 'Estaño', cs: 227, cl: 255, Tf: 231.9, Lf: 59e3 },
    vidrio: { nombre: 'Vidrio', cs: 840 },
    calorimetro: { nombre: 'Calorímetro' },
    otra: { nombre: 'Otra (con tus datos)' },
  };
  const FASES = ['sólido', 'líquido', 'gas'];

  // pasa un cuerpo de la pantalla a números: { nombre, m (kg), T0, estado0 (0|1|2), cs, cl, cg, Tf, Tv, Lf, Lv } o { C }
  function leerCuerpo(c, i) {
    const S = SUSTANCIAS[c.sustancia] || SUSTANCIAS.agua, quien = `Cuerpo ${i + 1}`;
    const n = (k, nom, { opcional = false, positivo = false } = {}) => {
      if (vacio(c[k])) { if (opcional) return null; throw new Error(`${quien}: falta ${nom}`); }
      const v = leeNum(c[k]);
      if (!isFinite(v)) throw new Error(`${quien}: ${nom} debe ser un número`);
      if (positivo && v <= 0) throw new Error(`${quien}: ${nom} debe ser mayor que 0`);
      return v;
    };
    const T0 = n('T0', 'la temperatura inicial');
    if (T0 < -273.15) throw new Error(`${quien}: la temperatura no puede bajar del cero absoluto (−273,15 °C)`);
    if (c.sustancia === 'calorimetro') return { i, clave: 'calorimetro', nombre: 'Calorímetro', C: n('C', 'la capacidad calorífica', { positivo: true }), T0, m: 0 };
    const p = c.sustancia === 'otra'
      ? { nombre: vacio(c.nombre) ? `Cuerpo ${i + 1}` : String(c.nombre), cs: n('cs', 'el calor específico del sólido', { opcional: true }), cl: n('cl', 'el calor específico del líquido', { opcional: true }), cg: n('cg', 'el calor específico del gas', { opcional: true }),
        Tf: n('Tf', 'la temperatura de fusión', { opcional: true }), Tv: n('Tv', 'la temperatura de ebullición', { opcional: true }), Lf: n('Lf', 'el calor latente de fusión', { opcional: true }), Lv: n('Lv', 'el calor latente de vaporización', { opcional: true }) }
      : { ...S };
    const m = n('m', 'la masa', { positivo: true }) / 1000;
    // sin temperatura de fusión el cuerpo es siempre la misma fase
    if (p.Tf === null || p.Tf === undefined) { p.Tf = -Infinity; p.Lf = 0; }
    if (p.Tv === null || p.Tv === undefined) { p.Tv = Infinity; p.Lv = 0; }
    if (p.Tv <= p.Tf) throw new Error(`${quien}: la ebullición debe estar por encima de la fusión`);
    for (const [k, nom] of [['cs', 'del sólido'], ['cl', 'del líquido'], ['cg', 'del gas']]) if (p[k] != null && p[k] <= 0) throw new Error(`${quien}: el calor específico ${nom} debe ser positivo`);
    // estado inicial: el que toca por la temperatura; justo en un cambio de fase lo dice el usuario
    let e = T0 < p.Tf ? 0 : T0 > p.Tv ? 2 : T0 > p.Tf && T0 < p.Tv ? 1 : null;
    const pedido = { solido: 0, liquido: 1, gas: 2 }[c.estado];
    if (e === null) e = pedido !== undefined ? pedido : 1;
    else if (pedido !== undefined && pedido !== e) throw new Error(`${quien}: a ${f(T0)} °C no puede estar en estado ${FASES[pedido]}`);
    if ((T0 === p.Tf && e === 2) || (T0 === p.Tv && e === 0)) throw new Error(`${quien}: a ${f(T0)} °C no puede estar en estado ${FASES[e]}`);
    if (p.cs == null && p.cl == null && p.cg == null) throw new Error(`${quien}: falta el calor específico`);
    if (isFinite(p.Tf) && (p.Lf == null || p.Lf < 0)) throw new Error(`${quien}: falta el calor latente de fusión`);
    if (isFinite(p.Tv) && (p.Lv == null || p.Lv < 0)) throw new Error(`${quien}: falta el calor latente de vaporización`);
    return { i, clave: c.sustancia, ...p, m, T0, e0: e };
  }

  /* ---------- Entalpía de un cuerpo ---------- */
  // tramos ordenados de menor a mayor entalpía (J), con H = 0 en el cero absoluto. En los tramos
  // sensibles H(T) = Ha + k (T − Ta), con k = m c; en los latentes H sube m L a temperatura fija.
  function tramos(b) {
    const T0K = -273.15;
    if (b.C !== undefined) return [{ tipo: 'sensible', fase: 0, Ta: T0K, Tb: Infinity, k: b.C, Ha: 0, Hb: Infinity }];
    const { m, Tf, Tv, Lf, Lv } = b;
    const cs = b.cs ?? b.cl ?? b.cg, cl = b.cl ?? b.cs ?? b.cg, cg = b.cg ?? b.cl ?? b.cs;
    const t = [];
    if (isFinite(Tf)) t.push({ tipo: 'sensible', fase: 0, Ta: T0K, Tb: Tf, k: m * cs }, { tipo: 'latente', fase: 0, T: Tf, L: Lf, m });
    t.push({ tipo: 'sensible', fase: 1, Ta: isFinite(Tf) ? Tf : T0K, Tb: Tv, k: m * cl });
    if (isFinite(Tv)) t.push({ tipo: 'latente', fase: 1, T: Tv, L: Lv, m }, { tipo: 'sensible', fase: 2, Ta: Tv, Tb: Infinity, k: m * cg });
    let Hc = 0;
    for (const s of t) {
      s.Ha = Hc;
      s.Hb = s.tipo === 'latente' ? Hc + s.m * s.L : isFinite(s.Tb) ? Hc + s.k * (s.Tb - s.Ta) : Infinity;
      Hc = s.Hb;
    }
    return t;
  }
  // H en el estado (T, e); en una temperatura de cambio de fase, e elige el lado del salto
  function H(b, T, e) {
    const s = tramos(b).find((x) => x.tipo === 'sensible' && x.fase === e && T >= x.Ta - 1e-9 && T <= x.Tb + 1e-9);
    return s ? s.Ha + s.k * (T - s.Ta) : NaN;
  }
  const faseEn = (b, T, alto) => (b.C !== undefined ? 0 : T < b.Tf || (T === b.Tf && !alto) ? 0 : T < b.Tv || (T === b.Tv && !alto) ? 1 : 2);
  const Hbajo = (b, T) => H(b, T, faseEn(b, T, false)), Halto = (b, T) => H(b, T, faseEn(b, T, true));

  /* ---------- Equilibrio ---------- */
  function equilibrio(sc) {
    const lista = (sc.cuerpos || []).filter((c) => c && !c.quitar);
    if (lista.length < 2) throw new Error('Hacen falta al menos dos cuerpos');
    const B = lista.map(leerCuerpo);
    if (B.every((b) => b.C !== undefined)) throw new Error('Además del calorímetro hace falta algo dentro');
    const H0 = B.map((b) => H(b, b.T0, b.C !== undefined ? 0 : b.e0));

    for (const [j, b] of B.entries()) if (!isFinite(H0[j])) throw new Error(`Cuerpo ${j + 1}: faltan datos de la fase en la que está`);
    const total = (T, alto) => B.reduce((s, b, j) => s + (alto ? Halto(b, T) : Hbajo(b, T)) - H0[j], 0);
    const Tmin = Math.min(...B.map((b) => b.T0)), Tmax = Math.max(...B.map((b) => b.T0));
    // temperaturas donde alguien cambia de fase, dentro del intervalo
    const cortes = [...new Set(B.flatMap((b) => (b.C !== undefined ? [] : [b.Tf, b.Tv])).filter((T) => isFinite(T) && T >= Tmin && T <= Tmax))].sort((a, b) => a - b);
    const nodos = [...new Set([Tmin, ...cortes, Tmax])].sort((a, b) => a - b);
    let Te = null, enCambio = null;
    for (const T of nodos) {
      const lo = total(T, false), hi = total(T, true);
      if (lo <= 1e-9 && hi >= -1e-9) { Te = T; if (hi - lo > 1e-9 && cortes.includes(T)) enCambio = { T, lo, hi }; break; }
    }
    if (Te === null) {
      for (let k = 0; k + 1 < nodos.length; k++) {
        const a = nodos[k], z = nodos[k + 1], Fa = total(a, true), Fz = total(z, false);
        if (Fa <= 0 && Fz >= 0) { Te = a + ((z - a) * -Fa) / (Fz - Fa); break; }
      }
    }
    if (Te === null) throw new Error('No encuentro la temperatura de equilibrio: revisa los datos');
    // estado final de cada cuerpo; en un cambio de fase la energía que sobra se reparte entre los que cambian ahí
    const finales = B.map((b, j) => {
      const lo = Hbajo(b, Te), hi = Halto(b, Te);
      return { lo, hi, salto: hi - lo, j };
    });
    // cada cuerpo se queda lo más cerca posible de su estado inicial; lo que sobra (o falta) cambia de fase
    // en los que pueden: si sobra energía, funden o hierven los que venían de abajo; si falta, se solidifican
    // o condensan los que venían de arriba
    const Hf = finales.map((x, j) => Math.min(x.hi, Math.max(x.lo, H0[j])));
    let R = H0.reduce((s, v) => s + v, 0) - Hf.reduce((s, v) => s + v, 0);
    if (Math.abs(R) > 1e-9) {
      const cap = finales.map((x, j) => (R > 0 ? x.hi - Hf[j] : Hf[j] - x.lo)), tot = cap.reduce((s, v) => s + v, 0);
      if (tot > 0) Hf.forEach((_, j) => { Hf[j] += Math.sign(R) * Math.min(cap[j], (cap[j] / tot) * Math.abs(R)); });
    }
    const cuerpos = B.map((b, j) => {
      const Q = Hf[j] - H0[j], fr = finales[j].salto > 0 ? (Hf[j] - finales[j].lo) / finales[j].salto : null;
      const etapas = camino(b, H0[j], Hf[j]);
      let estado;
      if (b.C !== undefined) estado = `a ${f(Te)} °C`;
      else if (fr !== null && fr > 1e-9 && fr < 1 - 1e-9) {
        const e = faseEn(b, Te, false), nom = nombreFase(b, e), nom2 = nombreFase(b, e + 1);
        estado = `${f((1 - fr) * b.m * 1000)} g de ${nom} y ${f(fr * b.m * 1000)} g de ${nom2}`;
      } else estado = `${f(b.m * 1000)} g de ${nombreFase(b, fr === null ? faseEn(b, Te, false) : fr >= 1 - 1e-9 ? faseEn(b, Te, true) : faseEn(b, Te, false))}`;
      const nombre = b.fases ? b.fases[b.e0][0].toUpperCase() + b.fases[b.e0].slice(1) : b.nombre;
      return { b, nombre, Q, etapas, estado, fraccion: fr };
    });
    const pasos = [];
    for (const c of cuerpos) pasos.push({ t: `${c.nombre}${c.b.C === undefined ? ` (${f(c.b.m * 1000)} g a ${f(c.b.T0)} °C)` : ` (C = ${f(c.b.C)} J/K a ${f(c.b.T0)} °C)`}`, html: c.etapas.length ? c.etapas.map((e) => e.html).join('<br>') + (c.etapas.length > 1 ? `<br>$Q$ = <b>${f(c.Q)} J</b>` : '') : 'No intercambia calor: ya está a la temperatura final.' });
    const cedido = -cuerpos.filter((c) => c.Q < 0).reduce((s, c) => s + c.Q, 0), absorbido = cuerpos.filter((c) => c.Q > 0).reduce((s, c) => s + c.Q, 0);
    if (enCambio) {
      const cambian = cuerpos.filter((c) => c.fraccion !== null && c.fraccion > 1e-9 && c.fraccion < 1 - 1e-9);
      pasos.push({ t: '¿Llega para cambiar de fase?', html: `Si todo acabara a ${f(Te)} °C antes del cambio de fase, sobrarían ${f(-enCambio.lo)} J; si acabara después, faltarían ${f(enCambio.hi)} J. La energía no llega para completar el cambio de fase, así que el equilibrio se queda en <b>T<sub>e</sub> = ${f(Te)} °C</b>${cambian.length ? ` con ${cambian.map((c) => c.estado).join(' y ')}` : ''}.` });
    } else {
      const Ce = B.reduce((s, b) => s + (b.C !== undefined ? b.C : b.m * cEn(b, Te)), 0);
      pasos.push({ t: 'Temperatura de equilibrio', html: `$Σ Q = 0$ ⇒ la suma de todos los calores, con $T_e$ como incógnita, se anula en <b>$T_e$ = ${f(Te)} °C</b>. (Capacidad calorífica total a esa temperatura: ${f(Ce)} J/K.)` });
    }
    pasos.push({ t: 'Comprobación', html: `Calor cedido ${f(cedido)} J = calor absorbido ${f(absorbido)} J ⇒ $Σ Q = ${f(absorbido - cedido)} "J"$.` });
    return { Te, cuerpos, cedido, absorbido, enCambio: !!enCambio, pasos };
  }
  const cEn = (b, T) => { const e = faseEn(b, T, false); return e === 0 ? b.cs : e === 1 ? b.cl : b.cg; };
  const nombreFase = (b, e) => (b.fases ? b.fases[e] : !isFinite(b.Tf) && !isFinite(b.Tv) ? b.nombre.toLowerCase() : `${b.nombre.toLowerCase()} ${FASES[e]}`);

  // etapas que recorre un cuerpo de H0 a Hf: calentamientos (m c ΔT) y cambios de fase (m L)
  function camino(b, H0, Hf) {
    const sube = Hf >= H0, lo = Math.min(H0, Hf), hi = Math.max(H0, Hf), out = [];
    if (hi - lo < 1e-9) return out;
    let lista = tramos(b).map((s) => ({ ...s })).filter((s) => Math.min(hi, s.Hb) - Math.max(lo, s.Ha) > 1e-9);
    if (!sube) lista = lista.reverse();
    for (const s of lista) {
      const a = Math.max(lo, s.Ha), z = Math.min(hi, s.Hb), Q = (z - a) * (sube ? 1 : -1);
      if (s.tipo === 'latente') {
        const dm = (z - a) / s.L, nom = s.fase === 0 ? (sube ? 'Fusión' : 'Solidificación') : sube ? 'Vaporización' : 'Condensación';
        out.push({ tipo: 'latente', Q, T: s.T, dm, html: `${nom} a ${f(s.T)} °C: $Q = ${sube ? '' : '−'}m L = ${sube ? '' : '−'}${f(dm)} "kg" · ${f(s.L)} "J/kg"$ = <b>${f(Q)} J</b>` });
      } else {
        const Tde = (Hx) => s.Ta + (Hx - s.Ha) / s.k;
        const Ti = Tde(sube ? a : z), Tf_ = Tde(sube ? z : a), c = b.C !== undefined ? null : s.k / b.m;
        const fase = b.C !== undefined ? 'calorímetro' : nombreFase(b, s.fase);
        out.push({ tipo: 'sensible', Q, Ti, Tf: Tf_, html: `${sube ? 'Se calienta' : 'Se enfría'} ${b.C !== undefined ? 'el calorímetro' : `(${fase})`} de ${f(Ti)} a ${f(Tf_)} °C: $Q = ${b.C !== undefined ? `C ΔT = ${f(b.C)} · (${f(Tf_)} − ${par(Ti)})` : `m c ΔT = ${f(b.m)} · ${f(c)} · (${f(Tf_)} − ${par(Ti)})`}$ = <b>${f(Q)} J</b>` });
      }
    }
    return out;
  }

  // curva T(Q) de cada cuerpo para la gráfica: puntos (Q acumulado, T)
  function curva(c) {
    const pts = [[0, c.b.T0]];
    let Q = 0;
    for (const e of c.etapas) { Q += e.Q; pts.push([Q, e.tipo === 'latente' ? e.T : e.Tf]); }
    return pts;
  }

  const ejemplos = [
    { clave: 'hielo-agua', nombre: 'Hielo a −10 °C en agua templada: se funde todo', cuerpos: [{ sustancia: 'agua', m: '50', T0: '-10' }, { sustancia: 'agua', m: '200', T0: '40' }] },
    { clave: 'sobra-hielo', nombre: 'Mucho hielo: el equilibrio se queda a 0 °C', cuerpos: [{ sustancia: 'agua', m: '100', T0: '0', estado: 'solido' }, { sustancia: 'agua', m: '100', T0: '20' }] },
    { clave: 'cobre-agua', nombre: 'Cobre caliente en agua', cuerpos: [{ sustancia: 'cobre', m: '200', T0: '100' }, { sustancia: 'agua', m: '300', T0: '20' }] },
    { clave: 'calorimetro', nombre: 'Aluminio en un calorímetro con agua', cuerpos: [{ sustancia: 'aluminio', m: '150', T0: '90' }, { sustancia: 'agua', m: '250', T0: '18' }, { sustancia: 'calorimetro', C: '125', T0: '18' }] },
    { clave: 'vapor', nombre: 'Vapor a 100 °C que se condensa en agua', cuerpos: [{ sustancia: 'agua', m: '10', T0: '100', estado: 'gas' }, { sustancia: 'agua', m: '200', T0: '20' }] },
    { clave: 'plomo-fundido', nombre: 'Plomo fundido que se solidifica en agua', cuerpos: [{ sustancia: 'plomo', m: '500', T0: '400' }, { sustancia: 'agua', m: '1000', T0: '15' }] },
  ];

  return { equilibrio, curva, SUSTANCIAS, ejemplos, f, leeNum };
})();
if (typeof module !== 'undefined') module.exports = Calor;
