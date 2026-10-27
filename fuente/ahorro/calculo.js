/* =====================================================================
   Ahorro e inflación a largo plazo (sin DOM): un plan de ahorro con un
   capital inicial y aportaciones al final de cada periodo (que pueden subir
   cada año con la inflación), a una rentabilidad anual efectiva; lo que se
   tiene al final en euros de entonces y en euros de hoy (descontando la
   inflación, con el tipo real de Fisher), la aportación que hace falta para
   llegar a un objetivo y lo que pierde de poder adquisitivo un dinero
   parado. Formato en euros de economia/comun.js; interfaz en ahorro/app.js.
     resolver(sc)  { modo, c0, a, m, r, pi, n, indexa, objetivo, x } → { final, real, aportado, filas, pasos }
   ===================================================================== */
const Ahorro = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const MODOS = { final: '¿Cuánto tendré?', objetivo: '¿Cuánto tengo que ahorrar?', poder: 'Poder adquisitivo de un dinero' };
  const PERIODOS = { 1: ['anual', 'año'], 4: ['trimestral', 'trimestre'], 12: ['mensual', 'mes'] };
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  const tp = (x) => `${f(100 * x, 5)} %`;

  // saldo periodo a periodo con aportación a (la del primer año); devuelve el saldo al final de cada año
  function simula(c0, a, m, ip, n, crece) {
    let s = c0, ap = c0; const anos = [{ t: 0, s, ap }];
    for (let j = 1; j <= n; j++) {
      const aj = a * crece ** (j - 1);
      for (let k = 0; k < m; k++) { s = s * (1 + ip) + aj; ap += aj; }
      anos.push({ t: j, s, ap, aj });
    }
    return anos;
  }

  function resolver(sc) {
    const modo = MODOS[sc.modo] ? sc.modo : 'final';
    const pi = lee(sc, 'pi', 'la inflación', { min: -50, max: 100 }) / 100;
    const n = lee(sc, 'n', 'el plazo', { min: 1, max: 80, entero: true });
    const def = (1 + pi) ** n, pasos = [];
    if (modo === 'poder') {
      const x = lee(sc, 'x', 'la cantidad', { min: 0, minEx: true });
      const real = x / def, filas = Array.from({ length: n + 1 }, (_, t) => ({ t, s: x, real: x / (1 + pi) ** t }));
      pasos.push({ t: 'Lo que suben los precios', html: `Con una inflación del ${tp(pi)} anual, en ${n} años los precios se multiplican por $(1 + π)^n = ${f(1 + pi, 6)}^{${n}} = ${f(def, 6)}$: lo que hoy cuesta 100 € costará ${e(100 * def)} €.` });
      pasos.push({ t: 'Poder adquisitivo', html: `${e(x)} € guardados sin rentabilidad comprarán dentro de ${n} años lo mismo que hoy $${e(x)}/${f(def, 6)} = ${e(real)}$ €: se pierde un ${f(100 * (1 - 1 / def), 4)} % del poder adquisitivo.` });
      if (pi > 0) pasos.push({ t: 'Regla del 70', html: `Los precios se duplican en unos $70/${f(100 * pi)} ≈ ${f(70 / (100 * pi), 3)}$ años (exacto: $ln 2/ln(1 + π) = ${f(Math.log(2) / Math.log(1 + pi), 4)}$ años).` });
      pasos.push({ t: 'Para no perder', html: `Hay que conseguir al menos un ${tp(pi)} de rentabilidad (después de impuestos) solo para mantener el poder adquisitivo; con eso, el tipo real es 0.` });
      return { modo, pi, n, x, def, real, final: x, filas, pasos };
    }
    const m = PERIODOS[sc.m] ? +sc.m : 12, [per, uno] = PERIODOS[m];
    const r = lee(sc, 'r', 'la rentabilidad', { min: -50, max: 100 }) / 100;
    const c0 = lee(sc, 'c0', 'el capital inicial', { min: 0, def: 0 });
    const indexa = sc.indexa === 'si', crece = indexa ? 1 + pi : 1;
    const ip = (1 + r) ** (1 / m) - 1, rr = (1 + r) / (1 + pi) - 1;
    pasos.push({ t: 'Tipo de cada periodo', html: m === 1 ? `Aportaciones anuales a una rentabilidad del ${tp(r)} anual.` : `Aportaciones ${per}es con una rentabilidad efectiva del ${tp(r)} anual: $i_{${m}} = (1 + r)^{1/${m}} − 1 = (1 + ${f(r, 6)})^{1/${m}} − 1 = ${f(ip, 8)}$ por ${uno}.` });
    const N = n * m, uno1 = simula(0, 1, m, ip, n, crece), F = uno1[n].s, Fc0 = (1 + ip) ** N;
    let a, objetivo = null;
    if (modo === 'objetivo') {
      objetivo = lee(sc, 'objetivo', 'el objetivo', { min: 0, minEx: true });
      const nom = objetivo * def;
      pasos.push({ t: 'El objetivo en euros de entonces', html: `${e(objetivo)} € de hoy serán dentro de ${n} años $${e(objetivo)} · (1 + ${f(pi, 6)})^{${n}} = ${e(nom)}$ €: eso es lo que hay que reunir.` });
      a = (nom - c0 * Fc0) / F;
      if (a <= 0) throw new Error(`El capital inicial ya basta: ${f(c0)} € al ${f(100 * r)} % llegan solos a ${f(c0 * Fc0, 2)} € en ${n} años, más de lo que hace falta`);
      pasos.push({ t: 'Aportación necesaria', html: `El capital inicial llega a $${e(c0)} · ${f(Fc0, 6)} = ${e(c0 * Fc0)}$ €; el resto lo tienen que poner las aportaciones. Una aportación de 1 € ${indexa ? 'el primer año (que sube con la inflación)' : ''} por ${uno} acaba valiendo ${f(F, 6)} €, así que<br>$a = {${e(nom)} − ${e(c0 * Fc0)}}/{${f(F, 6)}} = ${e(a)}$ € por ${uno}${indexa ? ' el primer año' : ''}.` });
    } else a = lee(sc, 'a', 'la aportación', { min: 0 });
    const anos = simula(c0, a, m, ip, n, crece), fin = anos[n], final = fin.s, real = final / def, aportado = fin.ap;
    if (modo === 'final') {
      if (c0 > 0) pasos.push({ t: 'Lo que rinde el capital inicial', html: `$C_0 (1 + r)^n = ${e(c0)} · ${f(1 + r, 6)}^{${n}} = ${e(c0 * Fc0)}$ €` });
      pasos.push({ t: 'Lo que suman las aportaciones', html: indexa
        ? `Cada año la aportación sube un ${tp(pi)}: el año $j$ se aportan $${e(a)} · (1 + π)^{j − 1}$ € por ${uno}. Sumando lo que rinde cada una hasta el final salen ${e(a * F)} €.`
        : `Es una renta pospagable de $N = ${N}$ términos: $a · s_{N¬i} = a · {(1 + i)^N − 1}/i = ${e(a)} · ${f(F, 6)} = ${e(a * F)}$ €` });
    }
    pasos.push({ t: 'Saldo final', html: `Al cabo de ${n} años hay <b>${e(final)} €</b>: ${e(aportado)} € puestos (contando el capital inicial) y ${e(final - aportado)} € de rentabilidad.` });
    pasos.push({ t: 'Tipo real (ecuación de Fisher)', html: `$1 + r_{real} = {1 + r}/{1 + π} = {${f(1 + r, 6)}}/{${f(1 + pi, 6)}}$ ⇒ $r_{real} = ${f(rr, 6)}$ (${tp(rr)} anual). Es lo que crece de verdad lo que se puede comprar; aproximadamente $r − π = ${f(100 * (r - pi), 4)} %$.` });
    pasos.push({ t: 'En euros de hoy', html: `$${e(final)}/(1 + ${f(pi, 6)})^{${n}} = ${e(final)}/${f(def, 6)} = ${e(real)}$ €: con lo ahorrado se comprará dentro de ${n} años lo mismo que hoy con ${e(real)} €. La inflación se lleva ${e(final - real)} € del saldo.` });
    const filas = anos.map((x) => ({ ...x, real: x.s / (1 + pi) ** x.t }));
    return { modo, m, per, uno, r, pi, rr, n, c0, a, indexa, objetivo, final, real, aportado, def, filas, pasos };
  }

  const ejemplos = [
    { clave: 'plan', nombre: '100 € al mes durante 20 años al 5 %', sc: { modo: 'final', c0: '1000', a: '100', m: '12', r: '5', pi: '2', n: '20', indexa: 'no' } },
    { clave: 'jubilacion', nombre: 'Plan para la jubilación con aportaciones que suben con el IPC', sc: { modo: 'final', c0: '0', a: '1200', m: '1', r: '4', pi: '3', n: '30', indexa: 'si' } },
    { clave: 'objetivo', nombre: '¿Cuánto ahorrar al mes para tener 100.000 € de hoy en 25 años?', sc: { modo: 'objetivo', c0: '5000', objetivo: '100000', m: '12', r: '6', pi: '2', n: '25', indexa: 'no' } },
    { clave: 'colchon', nombre: 'Dinero debajo del colchón: 10.000 € durante 10 años', sc: { modo: 'final', c0: '10000', a: '0', m: '1', r: '0', pi: '3', n: '10', indexa: 'no' } },
    { clave: 'poder', nombre: 'Lo que valdrán 1.000 € dentro de 20 años', sc: { modo: 'poder', x: '1000', pi: '2,5', n: '20' } },
  ];

  return { resolver, ejemplos, MODOS, PERIODOS };
})();
if (typeof module !== 'undefined') module.exports = Ahorro;
