/* =====================================================================
   Tipos de cambio y PPA (sin DOM): cambiar euros por otra moneda (y al
   revés) con comisión, el tipo de cambio cruzado entre dos monedas, la
   apreciación o depreciación entre dos fechas, la paridad del poder
   adquisitivo absoluta con el tipo de cambio real (el índice Big Mac) y
   la PPA relativa con la inflación de los dos países. El tipo de cambio
   E va siempre como lo publica el BCE: unidades de la otra moneda por
   1 €. Formato de economia/comun.js; interfaz en tipos-cambio/app.js.
     resolver(sc)  { modo: 'convertir' | 'cruzado' | 'variacion' | 'ppa' | 'relativa', … } → { …, pasos }
   ===================================================================== */
const TiposCambio = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, num, lee } = K;
  const MODOS = { convertir: 'Cambiar dinero', cruzado: 'Tipo de cambio cruzado', variacion: 'Apreciación o depreciación', ppa: 'PPA y tipo de cambio real', relativa: 'PPA relativa (inflación)' };
  // código → [nombre en plural, símbolo, con artículo]
  const MONEDAS = { USD: ['dólares', '$', 'el dólar'], GBP: ['libras', '£', 'la libra'], JPY: ['yenes', '¥', 'el yen'], CHF: ['francos suizos', 'CHF', 'el franco suizo'], MXN: ['pesos mexicanos', 'MXN', 'el peso mexicano'], CNY: ['yuanes', 'CNY', 'el yuan'] };
  // en los resultados va el código (USD), que no se confunde con las fórmulas $…$
  const mon = (k) => { const c = MONEDAS[k] ? k : 'USD'; return [MONEDAS[c][0], c, MONEDAS[c][2]]; };
  const n = (x) => f(x, 6).replace(/\./g, ''), pc = (x) => `${f(100 * x, 4)} %`;
  const tipo = (sc, k, nom) => lee(sc, k, nom, { min: 0, minEx: true });

  function convertir(sc) {
    const m = mon(sc.mon), E = tipo(sc, 'E', 'el tipo de cambio'), x = lee(sc, 'x', 'la cantidad', { min: 0, minEx: true });
    const c = lee(sc, 'c', 'la comisión', { min: 0, max: 100, maxEx: true, def: 0 }) / 100, aOtra = sc.sentido !== 'aEuros';
    const bruto = aOtra ? x * E : x / E, neto = bruto * (1 - c), pasos = [];
    pasos.push({ t: 'El tipo de cambio', html: `$E = ${n(E)}$ ${m[0]} por euro: 1 € = ${n(E)} ${m[1]}, o al revés, 1 ${m[1]} = 1/${n(E)} = ${f(1 / E, 5)} €.` });
    pasos.push({ t: aOtra ? 'De euros a la otra moneda: se multiplica' : 'De la otra moneda a euros: se divide', html: aOtra ? `$${n(x)} · ${n(E)} = ${n(bruto)}$ ${m[1]}` : `$${n(x)}/${n(E)} = ${n(bruto)}$ €` });
    if (c) pasos.push({ t: 'La comisión', html: `Se queda el ${f(100 * c, 4)} %: $${n(bruto)} · (1 − ${f(c, 6)}) = ${n(neto)}$ ${aOtra ? m[1] : '€'}. Es como cambiar a un tipo peor, de ${f(aOtra ? E * (1 - c) : E / (1 - c), 5)} ${m[1]} por euro.` });
    return { modo: 'convertir', m, E, x, c, aOtra, bruto, neto, inv: 1 / E, pasos };
  }

  function cruzado(sc) {
    if (sc.mon === sc.mon2) throw new Error('Elige dos monedas distintas');
    const m1 = mon(sc.mon), m2 = mon(sc.mon2), E1 = tipo(sc, 'E', `los ${m1[0]} por euro`), E2 = tipo(sc, 'E2', `los ${m2[0]} por euro`);
    const t = E2 / E1, pasos = [];
    pasos.push({ t: 'Los dos tipos frente al euro', html: `1 € = ${n(E1)} ${m1[1]} y 1 € = ${n(E2)} ${m2[1]}. Como los dos valen lo mismo (un euro), ${n(E1)} ${m1[1]} = ${n(E2)} ${m2[1]}.` });
    pasos.push({ t: 'Tipo cruzado', html: `Dividiendo entre ${n(E1)}: $1$ ${m1[1]} $= ${n(E2)}/${n(E1)} = ${f(t, 5)}$ ${m2[1]}.` });
    pasos.push({ t: 'Al revés', html: `1 ${m2[1]} $= ${n(E1)}/${n(E2)} = ${f(1 / t, 5)}$ ${m1[1]}.` });
    return { modo: 'cruzado', m1, m2, E1, E2, t, inv: 1 / t, pasos };
  }

  function variacion(sc) {
    const m = mon(sc.mon), E0 = tipo(sc, 'E', 'el tipo de cambio de antes'), E1 = tipo(sc, 'E2', 'el tipo de cambio de ahora');
    const ve = E1 / E0 - 1, vo = E0 / E1 - 1, pasos = [];
    const que = Math.abs(ve) < 1e-12 ? 'no cambia' : ve > 0 ? 'se aprecia' : 'se deprecia', que2 = Math.abs(ve) < 1e-12 ? 'no cambia' : ve > 0 ? 'se deprecia' : 'se aprecia';
    pasos.push({ t: 'El euro', html: `Un euro pasa de valer ${n(E0)} a ${n(E1)} ${m[1]}: $${n(E1)}/${n(E0)} − 1 = ${pc(ve)}$. El euro <b>${que}</b>${Math.abs(ve) < 1e-12 ? '' : ` un ${f(Math.abs(100 * ve), 4)} %`}.` });
    pasos.push({ t: 'La otra moneda', html: `${m[2][0].toUpperCase() + m[2].slice(1)}: pasa de valer $1/${n(E0)} = ${f(1 / E0, 5)}$ € a $1/${n(E1)} = ${f(1 / E1, 5)}$ €: $${n(E0)}/${n(E1)} − 1 = ${pc(vo)}$. ${Math.abs(ve) < 1e-12 ? 'Tampoco cambia.' : `Se ${ve > 0 ? 'deprecia' : 'aprecia'}, pero no en el mismo %: la base es otra.`}` });
    if (Math.abs(ve) > 1e-12) pasos.push({ t: 'Qué supone', html: ve > 0 ? 'Con un euro más fuerte, lo de fuera sale más barato (las importaciones bajan de precio y viajar fuera cuesta menos), pero lo que vende España fuera se encarece: las exportaciones pierden competitividad.' : 'Con un euro más débil, lo que vende España fuera sale más barato (las exportaciones ganan competitividad y llegan más turistas), pero lo que se compra fuera se encarece: sube el precio de las importaciones, como el petróleo.' });
    return { modo: 'variacion', m, E0, E1, ve, vo, que, que2, pasos };
  }

  function ppa(sc) {
    const m = mon(sc.mon), P = lee(sc, 'P', 'el precio en España', { min: 0, minEx: true }), Pe = lee(sc, 'Pe', 'el precio fuera', { min: 0, minEx: true }), E = tipo(sc, 'E', 'el tipo de cambio');
    const Eppa = Pe / P, q = (E * P) / Pe, dev = q - 1, PeEur = Pe / E, pasos = [];
    pasos.push({ t: 'Tipo de cambio de la PPA', html: `Si el mismo bien costara lo mismo en los dos sitios, $E_{PPA} = P_e/P = ${n(Pe)}/${n(P)} = ${f(Eppa, 5)}$ ${m[1]} por euro.` });
    pasos.push({ t: 'Precio de fuera en euros', html: `Al tipo de cambio de verdad, $P_e/E = ${n(Pe)}/${n(E)} = ${f(PeEur, 5)}$ €, frente a ${n(P)} € en España.` });
    pasos.push({ t: 'Tipo de cambio real', html: `$q = E · P/P_e = ${n(E)} · ${n(P)}/${n(Pe)} = ${f(q, 5)}$: con lo que cuesta el bien en España se compran ${f(q, 4)} fuera. Es lo mismo que $E/E_{PPA}$.` });
    pasos.push({ t: 'Sobrevalorado o infravalorado', html: Math.abs(dev) < 1e-9 ? 'Se cumple la PPA: el euro está en su valor.' : `$q − 1 = ${pc(dev)}$: según la PPA, el euro está <b>${dev > 0 ? 'sobrevalorado' : 'infravalorado'}</b> un ${f(Math.abs(100 * dev), 4)} % frente a ${m[2]} (el bien es más ${dev > 0 ? 'caro' : 'barato'} en España).` });
    return { modo: 'ppa', m, P, Pe, E, Eppa, q, dev, PeEur, pasos };
  }

  function relativa(sc) {
    const m = mon(sc.mon), E0 = tipo(sc, 'E', 'el tipo de cambio de hoy');
    const pi = lee(sc, 'pi', 'la inflación en España', { min: -100, minEx: true }) / 100, pe = lee(sc, 'pe', 'la inflación fuera', { min: -100, minEx: true }) / 100;
    const N = lee(sc, 'n', 'los años', { min: 1, max: 100, entero: true });
    const r = (1 + pe) / (1 + pi), En = E0 * r ** N, v = En / E0 - 1, filas = Array.from({ length: N + 1 }, (_, t) => ({ t, E: E0 * r ** t })), pasos = [];
    pasos.push({ t: 'PPA relativa', html: `Para que se mantenga la PPA, el tipo de cambio tiene que compensar la diferencia de inflación: cada año se multiplica por $(1 + π_e)/(1 + π) = ${f(1 + pe, 6)}/${f(1 + pi, 6)} = ${f(r, 6)}$.` });
    pasos.push({ t: `Dentro de ${N} año${N > 1 ? 's' : ''}`, html: `$E_${N} = E_0 · (${f(r, 6)})^${N} = ${n(E0)} · ${f(r ** N, 6)} = ${f(En, 5)}$ ${m[1]} por euro.` });
    pasos.push({ t: 'Qué pasa con el euro', html: Math.abs(pi - pe) < 1e-12 ? 'Con la misma inflación, el tipo de cambio no se mueve.' : `El euro se ${pi > pe ? 'deprecia' : 'aprecia'} un ${pc(Math.abs(v))} en total, porque en España los precios suben ${pi > pe ? "más" : "menos"} que fuera. Cada año, aproximadamente, $π_e − π = ${f(100 * (pe - pi), 4)}$ %.` });
    return { modo: 'relativa', m, E0, pi, pe, N, r, En, v, filas, pasos };
  }

  const R = { convertir, cruzado, variacion, ppa, relativa };
  const resolver = (sc) => (R[sc.modo] || convertir)(sc);

  const ejemplos = [
    { clave: 'viaje', nombre: 'Cambiar 500 € en dólares con un 2 % de comisión', sc: { modo: 'convertir', mon: 'USD', sentido: 'aOtra', E: '1,08', x: '500', c: '2' } },
    { clave: 'vuelta', nombre: 'Volver con 20.000 yenes', sc: { modo: 'convertir', mon: 'JPY', sentido: 'aEuros', E: '160', x: '20000', c: '0' } },
    { clave: 'cruzado', nombre: 'Dólares en libras con el euro de puente', sc: { modo: 'cruzado', mon: 'USD', mon2: 'GBP', E: '1,08', E2: '0,85' } },
    { clave: 'cae', nombre: 'El euro baja de 1,10 a 1,05 dólares', sc: { modo: 'variacion', mon: 'USD', E: '1,10', E2: '1,05' } },
    { clave: 'bigmac', nombre: 'Índice Big Mac: España y Japón', sc: { modo: 'ppa', mon: 'JPY', P: '5,40', Pe: '480', E: '160' } },
    { clave: 'inflacion', nombre: 'Inflación del 3 % aquí y del 2 % en EE. UU.', sc: { modo: 'relativa', mon: 'USD', E: '1,08', pi: '3', pe: '2', n: '5' } },
  ];

  return { resolver, ejemplos, MODOS, MONEDAS };
})();
if (typeof module !== 'undefined') module.exports = TiposCambio;
