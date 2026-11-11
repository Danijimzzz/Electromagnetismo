/* =====================================================================
   Interés simple y compuesto (sin DOM): capital final, capital inicial,
   tipo de interés y tiempo en capitalización simple, Cₙ = C₀(1 + i·t), y
   compuesta, Cₙ = C₀(1 + i/m)^(m·t), con m capitalizaciones al año; y el
   paso del TIN a la TAE y al revés. Saca también la comparación de los dos
   regímenes año a año. Formato en euros de economia/comun.js; interfaz en
   interes/app.js.
   El tiempo se da en años, meses o días (con base 365 o 360 días, como se usa en los depósitos),
   y la capitalización puede ser continua, Cₙ = C₀·e^(i·t).
     resolver(sc)  { modo, regimen, c0, cn, i, t, tu, base, m, tae } → { c0, cn, i, t, tae, filas, pasos }
   ===================================================================== */
const Interes = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, num, dinero, pct, lee } = K;
  const MODOS = { final: 'Capital final', inicial: 'Capital inicial (valor actual)', tipo: '¿Qué tipo de interés?', tiempo: '¿Cuánto tiempo?', tae: 'Del TIN a la TAE (y al revés)' };
  const PERIODOS = { 1: 'anual', 2: 'semestral', 4: 'trimestral', 12: 'mensual', 365: 'diaria', 0: 'continua' };
  const UNIDADES = { a: 'Años', m: 'Meses', d: 'Días' };
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  // % con hasta 4 decimales, sin ceros de más
  const tp = (x) => `${f(100 * x, 6)} %`;

  function resolver(sc) {
    const r = resolverBase(sc); r.pasos.push({ t: 'Convención', html: r.modo === 'tae' ? 'El TIN es nominal anual y se reparte en m periodos (i = TIN/m); la TAE es el tipo efectivo anual, (1 + TIN/m)^m − 1, sin comisiones ni gastos. No se redondea a céntimos en los pasos intermedios.' : `El tipo es anual. ${r.tu === 'd' ? `Los días se pasan a años con el año de ${r.base} días (comercial 360 o natural 365, como se elija). ` : ''}Los intereses no se redondean a céntimos en los pasos intermedios; la TAE no incluye comisiones ni gastos.` }); return r;
  }
  function resolverBase(sc) {
    const modo = MODOS[sc.modo] ? sc.modo : 'final', simple = sc.regimen === 'simple' && modo !== 'tae';
    const m = PERIODOS[sc.m] ? +sc.m : 1, per = PERIODOS[m], cont = m === 0;
    const tu = UNIDADES[sc.tu] ? sc.tu : 'a', base = +sc.base === 360 ? 360 : 365, porAno = tu === 'm' ? 12 : tu === 'd' ? base : 1;
    // factor de capitalización compuesta de un tipo nominal i durante x años
    const cap = (i, x) => (cont ? Math.exp(i * x) : (1 + i / m) ** (m * x));
    const pasos = [];
    if (modo === 'tae') {
      const desde = sc.conocido === 'tae' ? 'tae' : 'tin';
      let tin, tae;
      if (desde === 'tin') { tin = lee(sc, 'i', 'el TIN', { min: 0, minEx: true }) / 100; tae = cap(tin, 1) - 1; }
      else { tae = lee(sc, 'tae', 'la TAE', { min: 0, minEx: true }) / 100; tin = cont ? Math.log(1 + tae) : m * ((1 + tae) ** (1 / m) - 1); }
      if (cont) {
        pasos.push({ t: 'Capitalización continua', html: `Es el límite cuando el número de periodos al año $m → ∞$: $(1 + TIN/m)^m → e^{TIN}$, así que ${desde === 'tin' ? `$TAE = e^{TIN} − 1 = e^{${f(tin, 6)}} − 1 = ${tp(tae)}$` : `$TIN = ln(1 + TAE) = ln(1 + ${f(tae, 6)}) = ${tp(tin)}$`}.` });
        pasos.push({ t: 'Qué significa', html: `Es el máximo que se puede ganar con un TIN dado: la TAE (${tp(tae)}) supera al TIN (${tp(tin)}) pero ya no crece por mucho que se capitalice más a menudo.` });
        return { modo, m, tin, tae, cap, filas: [], pasos };
      }
      pasos.push({ t: 'Tipo de cada periodo', html: `Con capitalización ${per} hay $m = ${m}$ periodos al año. ${desde === 'tin' ? `$i_{${m}} = TIN/m = ${f(100 * tin, 6)} %/${m} = ${tp(tin / m)}$` : `De la TAE: $i_{${m}} = (1 + TAE)^{1/m} − 1 = (1 + ${f(tae, 6)})^{1/${m}} − 1 = ${tp(tin / m)}$`}` });
      pasos.push({ t: desde === 'tin' ? 'TAE' : 'TIN', html: desde === 'tin' ? `$TAE = (1 + i_{${m}})^m − 1 = (1 + ${f(tin / m, 6)})^{${m}} − 1 = ${tp(tae)}$` : `$TIN = m · i_{${m}} = ${m} · ${f(tin / m, 6)} = ${tp(tin)}$` });
      pasos.push({ t: 'Qué significa', html: `El TIN es el tipo nominal que se reparte entre los periodos; la TAE es lo que rinde de verdad un año, porque los intereses de cada periodo también generan intereses. ${m === 1 ? 'Con un solo periodo al año coinciden.' : `Con capitalización ${per}, la TAE (${tp(tae)}) supera al TIN (${tp(tin)}).`}` });
      return { modo, m, tin, tae, cap, filas: [], pasos };
    }
    const leeT = () => lee(sc, 't', 'el tiempo', { min: 0, minEx: true }) / porAno;

    const leeC = (k, nom) => lee(sc, k, nom, { min: 0, minEx: true });
    let c0, cn, i, t;
    const fac = () => (simple ? 1 + i * t : cap(i, t));
    const forma = simple ? '$C_n = C_0 (1 + i · t)$' : cont ? '$C_n = C_0 · e^{i · t}$ (capitalización continua)' : `$C_n = C_0 (1 + i/m)^{m · t}$, con $m = ${m}$ (capitalización ${per})`;
    if (tu !== 'a' && modo !== 'tiempo') pasos.push({ t: 'Tiempo en años', html: `El tiempo se da en ${tu === 'm' ? 'meses' : `días (año de ${base} días)`}: $t = ${f(lee(sc, 't', 'el tiempo', { min: 0, minEx: true }))}/${porAno} = ${f(leeT(), 6)}$ años.` });
    if (modo === 'final' || modo === 'inicial') {
      i = lee(sc, 'i', 'el tipo de interés', { min: 0 }) / 100; t = leeT();
      if (modo === 'final') { c0 = leeC('c0', 'el capital inicial'); cn = c0 * fac(); }
      else { cn = leeC('cn', 'el capital final'); c0 = cn / fac(); }
      const sus = simple ? `${e(c0)} · (1 + ${f(i, 6)} · ${f(t)})` : cont ? `${e(c0)} · e^{${f(i, 6)} · ${f(t)}}` : `${e(c0)} · (1 + ${f(i, 6)}/${m})^{${m} · ${f(t)}}`;
      pasos.push({ t: 'Fórmula', html: `En capitalización ${simple ? 'simple los intereses se calculan siempre sobre el capital inicial' : 'compuesta los intereses de cada periodo se suman al capital y generan a su vez intereses'}: ${forma}.` });
      pasos.push(modo === 'final'
        ? { t: 'Capital final', html: `$C_n = ${sus} = ${e(c0)} · ${f(fac(), 8)} = ${e(cn)}$ €` }
        : { t: 'Capital inicial', html: `Se despeja $C_0 = C_n/${simple ? '(1 + i · t)' : cont ? 'e^{i · t}' : '(1 + i/m)^{m · t}'}$ (actualizar o descontar): $C_0 = ${e(cn)}/${f(fac(), 8)} = ${e(c0)}$ €` });
    } else if (modo === 'tipo') {
      c0 = leeC('c0', 'el capital inicial'); cn = leeC('cn', 'el capital final'); t = leeT();
      if (cn < c0) throw new Error('El capital final tiene que ser mayor que el inicial para que el tipo sea positivo');
      i = simple ? (cn / c0 - 1) / t : cont ? Math.log(cn / c0) / t : m * ((cn / c0) ** (1 / (m * t)) - 1);
      pasos.push({ t: 'Fórmula', html: forma });
      pasos.push({ t: 'Tipo de interés', html: simple ? `$i = (C_n/C_0 − 1)/t = (${e(cn)}/${e(c0)} − 1)/${f(t)} = ${f(i, 6)}$ → <b>${tp(i)}</b> anual` : cont ? `$i = {ln(C_n/C_0)}/t = {ln(${f(cn / c0, 6)})}/${f(t)} = ${f(i, 6)}$ → <b>${tp(i)}</b> nominal anual (continuo)` : `$i/m = (C_n/C_0)^{1/(m · t)} − 1 = (${e(cn)}/${e(c0)})^{1/${f(m * t)}} − 1 = ${f(i / m, 6)}$ ⇒ $i = ${m} · ${f(i / m, 6)} = ${f(i, 6)}$ → <b>${tp(i)}</b> nominal anual` });
    } else {
      c0 = leeC('c0', 'el capital inicial'); cn = leeC('cn', 'el capital final'); i = lee(sc, 'i', 'el tipo de interés', { min: 0, minEx: true }) / 100;
      if (cn <= c0) throw new Error('El capital final tiene que ser mayor que el inicial');
      t = simple ? (cn / c0 - 1) / i : cont ? Math.log(cn / c0) / i : Math.log(cn / c0) / (m * Math.log(1 + i / m));
      pasos.push({ t: 'Fórmula', html: forma });
      pasos.push({ t: 'Tiempo', html: simple ? `$t = (C_n/C_0 − 1)/i = (${e(cn)}/${e(c0)} − 1)/${f(i, 6)} = ${f(t, 6)}$ años` : cont ? `Tomando logaritmos: $t = {ln(C_n/C_0)}/i = {ln(${f(cn / c0, 6)})}/${f(i, 6)} = ${f(t, 6)}$ años` : `Tomando logaritmos: $t = {ln(C_n/C_0)}/{m · ln(1 + i/m)} = {ln(${f(cn / c0, 6)})}/{${m} · ln(1 + ${f(i / m, 6)})} = ${f(t, 6)}$ años` });
      const a = Math.floor(t), d = (t - a) * 12;
      pasos.push({ t: 'En años y meses', html: `${a} años y ${f(d, 3)} meses (unos ${f(t * base, 4)} días con año de ${base})${simple ? '' : `. Regla del 72: se duplica en unos 72/${f(100 * i)} ≈ ${f(72 / (100 * i), 3)} años`}.` });
    }
    const I = cn - c0, tae = simple ? null : cap(i, 1) - 1;
    pasos.push({ t: 'Intereses', html: `$I = C_n − C_0 = ${e(cn)} − ${e(c0)} = ${e(I)}$ €${tae !== null ? `. Rentabilidad efectiva anual: $TAE = ${cont ? 'e^i' : '(1 + i/m)^m'} − 1 = ${tp(tae)}$` : ''}` });
    // el otro régimen, para comparar
    const cnS = c0 * (1 + i * t), cnC = c0 * cap(i, t);
    pasos.push({ t: 'Simple frente a compuesta', html: `Con los mismos datos, en simple $C_n = ${e(cnS)}$ € y en compuesta $C_n = ${e(cnC)}$ €: ${t > 1 / m + 1e-9 ? 'la compuesta da más porque cobra intereses sobre los intereses' : t < 1 / m - 1e-9 ? 'en menos de un periodo la simple da más' : 'en un solo periodo dan lo mismo'}.` });
    // tabla año a año (como mucho 60 filas)
    const n = Math.min(60, Math.ceil(t - 1e-9)), filas = [];
    for (let k = 0; k <= n; k++) { const x = Math.min(k, t); filas.push({ t: x, s: c0 * (1 + i * x), c: c0 * cap(i, x) }); }
    return { modo, simple, m, cap, tu, base, c0, cn, i, t, I, tae, cnS, cnC, filas, pasos };
  }

  const ejemplos = [
    { clave: 'deposito', nombre: '10.000 € al 3 % durante 5 años', sc: { modo: 'final', regimen: 'compuesto', c0: '10000', i: '3', t: '5', m: '1' } },
    { clave: 'mensual', nombre: 'Depósito al 2,4 % con intereses mensuales', sc: { modo: 'final', regimen: 'compuesto', c0: '5000', i: '2,4', t: '2', m: '12' } },
    { clave: 'simple', nombre: 'Interés simple: 2.000 € al 4 % durante 9 meses', sc: { modo: 'final', regimen: 'simple', c0: '2000', i: '4', t: '0,75', m: '1' } },
    { clave: 'actual', nombre: '¿Cuánto hay que ingresar hoy para tener 20.000 €?', sc: { modo: 'inicial', regimen: 'compuesto', cn: '20000', i: '4', t: '10', m: '1' } },
    { clave: 'duplicar', nombre: '¿Cuánto tarda en duplicarse un capital al 5 %?', sc: { modo: 'tiempo', regimen: 'compuesto', c0: '1000', cn: '2000', i: '5', m: '1' } },
    { clave: 'tipo', nombre: '¿Qué tipo convierte 8.000 € en 10.000 € en 4 años?', sc: { modo: 'tipo', regimen: 'compuesto', c0: '8000', cn: '10000', t: '4', m: '1' } },
    { clave: 'dias', nombre: 'Depósito de 90 días al 2 % (año de 365 días)', sc: { modo: 'final', regimen: 'simple', c0: '10000', i: '2', t: '90', tu: 'd', base: '365', m: '1' } },
    { clave: 'continua', nombre: 'Capitalización continua: 1.000 € al 5 % durante 10 años', sc: { modo: 'final', regimen: 'compuesto', c0: '1000', i: '5', t: '10', tu: 'a', base: '365', m: '0' } },
    { clave: 'tae', nombre: 'TAE de un TIN del 6 % con pagos mensuales', sc: { modo: 'tae', conocido: 'tin', i: '6', m: '12' } },
  ];

  // modo práctica: datos redondos al azar
  const AZ = K.az, azar = AZ.desde(ejemplos, (sc) => {
    const c0 = AZ.toma([1000, 5000, 10000, 20000]), i = AZ.toma([2, 3, 4, 5, 6]), t = AZ.toma([2, 3, 5, 10]), m = AZ.toma([1, 2, 4, 12]);
    if (sc.modo === 'inicial') return { regimen: 'compuesto', cn: String(c0), i: String(i), t: String(t), m: String(m) };
    if (sc.modo === 'tiempo') return { regimen: 'compuesto', c0: String(c0), cn: String(c0 * AZ.toma([1.5, 2])), i: String(AZ.toma([4, 5, 6, 8])), m: String(AZ.toma([1, 12])) };
    if (sc.modo === 'tipo') { const c = AZ.toma([5000, 8000]); return { regimen: 'compuesto', c0: String(c), cn: String(Math.round(c * AZ.toma([1.2, 1.25, 1.5]))), t: String(AZ.toma([3, 4, 5])), m: '1' }; }
    if (sc.modo === 'tae') return { conocido: 'tin', i: String(AZ.toma([3, 5, 6, 8])), m: String(AZ.toma([2, 4, 12])) };
    return { regimen: 'compuesto', c0: String(c0), i: String(i), t: String(t), m: String(m) };
  }, (sc) => !sc.tu && sc.m !== '0', (sc) => resolver(sc));
  const enunciado = (sc) => {
    const per = sc.m === '1' ? 'anualmente' : `${{ 2: 'semestralmente', 4: 'trimestralmente', 12: 'mensualmente' }[sc.m] || `${sc.m} veces al año`}`;
    if (sc.modo === 'tae') return `Un préstamo tiene un TIN del ${sc.i} % con capitalización ${per}. Calcula su TAE y el tipo de cada periodo.`;
    if (sc.modo === 'inicial') return `¿Qué capital hay que depositar hoy para tener ${sc.cn} € dentro de ${sc.t} años con un interés compuesto del ${sc.i} % anual capitalizado ${per}? Calcula también los intereses y la TAE.`;
    if (sc.modo === 'tiempo') return `Se depositan ${sc.c0} € al ${sc.i} % anual compuesto (capitalización ${per}). ¿Cuántos años tardan en convertirse en ${sc.cn} €? Calcula también los intereses y la TAE.`;
    if (sc.modo === 'tipo') return `Un depósito de ${sc.c0} € se convierte en ${sc.cn} € en ${sc.t} años con interés compuesto anual. ¿Qué tipo de interés anual ha ganado? Calcula también los intereses.`;
    return `Se depositan ${sc.c0} € durante ${sc.t} años al ${sc.i} % anual con interés compuesto (capitalización ${per}). Calcula el capital final, los intereses ganados y la TAE.`;
  };

  return { azar, enunciado, resolver, ejemplos, MODOS, PERIODOS, UNIDADES };
})();
if (typeof module !== 'undefined') module.exports = Interes;
