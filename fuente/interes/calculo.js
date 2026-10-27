/* =====================================================================
   Interés simple y compuesto (sin DOM): capital final, capital inicial,
   tipo de interés y tiempo en capitalización simple, Cₙ = C₀(1 + i·t), y
   compuesta, Cₙ = C₀(1 + i/m)^(m·t), con m capitalizaciones al año; y el
   paso del TIN a la TAE y al revés. Saca también la comparación de los dos
   regímenes año a año. Formato en euros de economia/comun.js; interfaz en
   interes/app.js.
     resolver(sc)  { modo, regimen, c0, cn, i, t, m, tae } → { c0, cn, i, t, tae, filas, pasos }
   ===================================================================== */
const Interes = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, num, dinero, pct, lee } = K;
  const MODOS = { final: 'Capital final', inicial: 'Capital inicial (valor actual)', tipo: '¿Qué tipo de interés?', tiempo: '¿Cuánto tiempo?', tae: 'Del TIN a la TAE (y al revés)' };
  const PERIODOS = { 1: 'anual', 2: 'semestral', 4: 'trimestral', 12: 'mensual', 365: 'diaria' };
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  // % con hasta 4 decimales, sin ceros de más
  const tp = (x) => `${f(100 * x, 6)} %`;

  function resolver(sc) {
    const modo = MODOS[sc.modo] ? sc.modo : 'final', simple = sc.regimen === 'simple' && modo !== 'tae';
    const m = PERIODOS[sc.m] ? +sc.m : 1, per = PERIODOS[m];
    const pasos = [];
    if (modo === 'tae') {
      const desde = sc.conocido === 'tae' ? 'tae' : 'tin';
      let tin, tae;
      if (desde === 'tin') { tin = lee(sc, 'i', 'el TIN', { min: 0, minEx: true }) / 100; tae = (1 + tin / m) ** m - 1; }
      else { tae = lee(sc, 'tae', 'la TAE', { min: 0, minEx: true }) / 100; tin = m * ((1 + tae) ** (1 / m) - 1); }
      pasos.push({ t: 'Tipo de cada periodo', html: `Con capitalización ${per} hay $m = ${m}$ periodos al año. ${desde === 'tin' ? `$i_{${m}} = TIN/m = ${f(100 * tin, 6)} %/${m} = ${tp(tin / m)}$` : `De la TAE: $i_{${m}} = (1 + TAE)^{1/m} − 1 = (1 + ${f(tae, 6)})^{1/${m}} − 1 = ${tp(tin / m)}$`}` });
      pasos.push({ t: desde === 'tin' ? 'TAE' : 'TIN', html: desde === 'tin' ? `$TAE = (1 + i_{${m}})^m − 1 = (1 + ${f(tin / m, 6)})^{${m}} − 1 = ${tp(tae)}$` : `$TIN = m · i_{${m}} = ${m} · ${f(tin / m, 6)} = ${tp(tin)}$` });
      pasos.push({ t: 'Qué significa', html: `El TIN es el tipo nominal que se reparte entre los periodos; la TAE es lo que rinde de verdad un año, porque los intereses de cada periodo también generan intereses. ${m === 1 ? 'Con un solo periodo al año coinciden.' : `Con capitalización ${per}, la TAE (${tp(tae)}) supera al TIN (${tp(tin)}).`}` });
      return { modo, m, tin, tae, filas: [], pasos };
    }

    const leeC = (k, nom) => lee(sc, k, nom, { min: 0, minEx: true });
    let c0, cn, i, t;
    const fac = () => (simple ? 1 + i * t : (1 + i / m) ** (m * t));
    const forma = simple ? '$C_n = C_0 (1 + i · t)$' : `$C_n = C_0 (1 + i/m)^{m · t}$, con $m = ${m}$ (capitalización ${per})`;
    if (modo === 'final' || modo === 'inicial') {
      i = lee(sc, 'i', 'el tipo de interés', { min: 0 }) / 100; t = lee(sc, 't', 'el tiempo', { min: 0, minEx: true });
      if (modo === 'final') { c0 = leeC('c0', 'el capital inicial'); cn = c0 * fac(); }
      else { cn = leeC('cn', 'el capital final'); c0 = cn / fac(); }
      const sus = simple ? `${e(c0)} · (1 + ${f(i, 6)} · ${f(t)})` : `${e(c0)} · (1 + ${f(i, 6)}/${m})^{${m} · ${f(t)}}`;
      pasos.push({ t: 'Fórmula', html: `En capitalización ${simple ? 'simple los intereses se calculan siempre sobre el capital inicial' : 'compuesta los intereses de cada periodo se suman al capital y generan a su vez intereses'}: ${forma}.` });
      pasos.push(modo === 'final'
        ? { t: 'Capital final', html: `$C_n = ${sus} = ${e(c0)} · ${f(fac(), 8)} = ${e(cn)}$ €` }
        : { t: 'Capital inicial', html: `Se despeja $C_0 = C_n/${simple ? '(1 + i · t)' : '(1 + i/m)^{m · t}'}$ (actualizar o descontar): $C_0 = ${e(cn)}/${f(fac(), 8)} = ${e(c0)}$ €` });
    } else if (modo === 'tipo') {
      c0 = leeC('c0', 'el capital inicial'); cn = leeC('cn', 'el capital final'); t = lee(sc, 't', 'el tiempo', { min: 0, minEx: true });
      if (cn < c0) throw new Error('El capital final tiene que ser mayor que el inicial para que el tipo sea positivo');
      i = simple ? (cn / c0 - 1) / t : m * ((cn / c0) ** (1 / (m * t)) - 1);
      pasos.push({ t: 'Fórmula', html: forma });
      pasos.push({ t: 'Tipo de interés', html: simple ? `$i = (C_n/C_0 − 1)/t = (${e(cn)}/${e(c0)} − 1)/${f(t)} = ${f(i, 6)}$ → <b>${tp(i)}</b> anual` : `$i/m = (C_n/C_0)^{1/(m · t)} − 1 = (${e(cn)}/${e(c0)})^{1/${f(m * t)}} − 1 = ${f(i / m, 6)}$ ⇒ $i = ${m} · ${f(i / m, 6)} = ${f(i, 6)}$ → <b>${tp(i)}</b> nominal anual` });
    } else {
      c0 = leeC('c0', 'el capital inicial'); cn = leeC('cn', 'el capital final'); i = lee(sc, 'i', 'el tipo de interés', { min: 0, minEx: true }) / 100;
      if (cn <= c0) throw new Error('El capital final tiene que ser mayor que el inicial');
      t = simple ? (cn / c0 - 1) / i : Math.log(cn / c0) / (m * Math.log(1 + i / m));
      pasos.push({ t: 'Fórmula', html: forma });
      pasos.push({ t: 'Tiempo', html: simple ? `$t = (C_n/C_0 − 1)/i = (${e(cn)}/${e(c0)} − 1)/${f(i, 6)} = ${f(t, 6)}$ años` : `Tomando logaritmos: $t = {ln(C_n/C_0)}/{m · ln(1 + i/m)} = {ln(${f(cn / c0, 6)})}/{${m} · ln(1 + ${f(i / m, 6)})} = ${f(t, 6)}$ años` });
      const a = Math.floor(t), d = (t - a) * 12;
      pasos.push({ t: 'En años y meses', html: `${a} años y ${f(d, 3)} meses${simple ? '' : `. Regla del 72: se duplica en unos 72/${f(100 * i)} ≈ ${f(72 / (100 * i), 3)} años`}.` });
    }
    const I = cn - c0, tae = simple ? null : (1 + i / m) ** m - 1;
    pasos.push({ t: 'Intereses', html: `$I = C_n − C_0 = ${e(cn)} − ${e(c0)} = ${e(I)}$ €${tae !== null ? `. Rentabilidad efectiva anual: $TAE = (1 + i/m)^m − 1 = ${tp(tae)}$` : ''}` });
    // el otro régimen, para comparar
    const cnS = c0 * (1 + i * t), cnC = c0 * (1 + i / m) ** (m * t);
    pasos.push({ t: 'Simple frente a compuesta', html: `Con los mismos datos, en simple $C_n = ${e(cnS)}$ € y en compuesta $C_n = ${e(cnC)}$ €: ${t > 1 / m + 1e-9 ? 'la compuesta da más porque cobra intereses sobre los intereses' : t < 1 / m - 1e-9 ? 'en menos de un periodo la simple da más' : 'en un solo periodo dan lo mismo'}.` });
    // tabla año a año (como mucho 60 filas)
    const n = Math.min(60, Math.ceil(t - 1e-9)), filas = [];
    for (let k = 0; k <= n; k++) { const x = Math.min(k, t); filas.push({ t: x, s: c0 * (1 + i * x), c: c0 * (1 + i / m) ** (m * x) }); }
    return { modo, simple, m, c0, cn, i, t, I, tae, cnS, cnC, filas, pasos };
  }

  const ejemplos = [
    { clave: 'deposito', nombre: '10.000 € al 3 % durante 5 años', sc: { modo: 'final', regimen: 'compuesto', c0: '10000', i: '3', t: '5', m: '1' } },
    { clave: 'mensual', nombre: 'Depósito al 2,4 % con intereses mensuales', sc: { modo: 'final', regimen: 'compuesto', c0: '5000', i: '2,4', t: '2', m: '12' } },
    { clave: 'simple', nombre: 'Interés simple: 2.000 € al 4 % durante 9 meses', sc: { modo: 'final', regimen: 'simple', c0: '2000', i: '4', t: '0,75', m: '1' } },
    { clave: 'actual', nombre: '¿Cuánto hay que ingresar hoy para tener 20.000 €?', sc: { modo: 'inicial', regimen: 'compuesto', cn: '20000', i: '4', t: '10', m: '1' } },
    { clave: 'duplicar', nombre: '¿Cuánto tarda en duplicarse un capital al 5 %?', sc: { modo: 'tiempo', regimen: 'compuesto', c0: '1000', cn: '2000', i: '5', m: '1' } },
    { clave: 'tipo', nombre: '¿Qué tipo convierte 8.000 € en 10.000 € en 4 años?', sc: { modo: 'tipo', regimen: 'compuesto', c0: '8000', cn: '10000', t: '4', m: '1' } },
    { clave: 'tae', nombre: 'TAE de un TIN del 6 % con pagos mensuales', sc: { modo: 'tae', conocido: 'tin', i: '6', m: '12' } },
  ];

  return { resolver, ejemplos, MODOS, PERIODOS };
})();
if (typeof module !== 'undefined') module.exports = Interes;
