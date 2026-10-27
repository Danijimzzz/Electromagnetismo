/* =====================================================================
   Rentas y anualidades (sin DOM): rentas constantes, pospagables o
   prepagables, temporales o perpetuas, inmediatas o diferidas, con
   términos anuales, semestrales, trimestrales o mensuales. Calcula el valor
   actual, el valor final, el término o el número de términos, con el tipo
   de cada periodo sacado del tipo efectivo anual, iₘ = (1 + i)^(1/m) − 1, y
   los factores aₙ¬ᵢ = (1 − (1 + i)⁻ⁿ)/i y sₙ¬ᵢ = ((1 + i)ⁿ − 1)/i.
   Formato en euros de economia/comun.js; interfaz en rentas/app.js.
     resolver(sc)  { modo, pago, duracion, c, va, vf, n, i, m, d } → { va, vf, c, n, ip, filas, pasos }
   ===================================================================== */
const Rentas = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const MODOS = { va: 'Valor actual', vf: 'Valor final', termino: 'Término (cuota)', n: 'Número de términos' };
  const PERIODOS = { 1: ['anual', 'años'], 2: ['semestral', 'semestres'], 4: ['trimestral', 'trimestres'], 12: ['mensual', 'meses'] };
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  const tp = (x) => `${f(100 * x, 6)} %`;

  function resolver(sc) {
    const modo = MODOS[sc.modo] ? sc.modo : 'va', pre = sc.pago === 'pre', perpetua = sc.duracion === 'perpetua' && (modo === 'va' || modo === 'termino');
    const m = PERIODOS[sc.m] ? +sc.m : 1, [per, pers] = PERIODOS[m];
    const ia = lee(sc, 'i', 'el tipo de interés', { min: 0, minEx: true }) / 100;
    const ip = (1 + ia) ** (1 / m) - 1;
    const d = lee(sc, 'd', 'el diferimiento', { min: 0, entero: true, def: 0 });
    const v = (k) => (1 + ip) ** -k;
    const pasos = [];
    pasos.push({ t: 'Tipo de cada periodo', html: m === 1 ? `Términos anuales: $i = ${tp(ia)}$.` : `Términos ${per}es con un tipo efectivo anual del ${tp(ia)}: $i_{${m}} = (1 + i)^{1/${m}} − 1 = (1 + ${f(ia, 6)})^{1/${m}} − 1 = ${f(ip, 6)}$ (${tp(ip)} ${per === 'mensual' ? 'mensual' : 'por periodo'}).` });
    const an = (n) => (1 - v(n)) / ip, sn = (n) => ((1 + ip) ** n - 1) / ip;
    const fp = pre ? 1 + ip : 1, fd = v(d);
    const nomPago = pre ? 'prepagable (los términos se pagan al principio de cada periodo)' : 'pospagable (los términos se pagan al final de cada periodo)';
    let c, n = null, va, vf = null;
    if (modo === 'n') {
      c = lee(sc, 'c', 'el término', { min: 0, minEx: true }); va = lee(sc, 'va', 'el valor actual', { min: 0, minEx: true });
      const x = 1 - (va * ip) / (c * fp * fd);
      if (x <= 0) throw new Error('Con ese término no se llega nunca a pagar ese valor actual: el término no cubre ni los intereses');
      n = -Math.log(x) / Math.log(1 + ip);
      pasos.push({ t: 'Número de términos', html: `De $V_0 = C ${pre ? '(1 + i) ' : ''}${d ? `(1 + i)^{−${d}} ` : ''}{1 − (1 + i)^{−n}}/i$ se despeja $n = {−ln(1 − V_0 · i/(C${pre ? '(1 + i)' : ''}${d ? `(1 + i)^{−${d}}` : ''}))}/{ln(1 + i)} = {−ln(${f(x, 6)})}/{ln(1 + ${f(ip, 6)})} = ${f(n, 6)}$ ${pers}` });
      pasos.push({ t: 'Lectura', html: `Hacen falta ${Math.ceil(n - 1e-9)} términos: ${Math.floor(n + 1e-9)} completos de ${e(c)} € y ${Number.isInteger(+n.toFixed(9)) ? 'ninguno más' : 'un último pago menor (o se ajusta la cuota)'}.` });
    } else if (perpetua) {
      if (modo === 'va') { c = lee(sc, 'c', 'el término', { min: 0, minEx: true }); va = (c * fp * fd) / ip; }
      else { va = lee(sc, 'va', 'el valor actual', { min: 0, minEx: true }); c = (va * ip) / (fp * fd); }
      pasos.push({ t: 'Renta perpetua', html: `Cuando n → ∞, $(1 + i)^{−n} → 0$ y $a_{∞¬i} = 1/i$. Renta ${nomPago}${d ? `, diferida ${d} ${pers}` : ''}:<br>$V_0 = C${pre ? ' (1 + i)' : ''}/i${d ? ` · (1 + i)^{−${d}}` : ''}$` });
      pasos.push(modo === 'va' ? { t: 'Valor actual', html: `$V_0 = ${e(c)}${pre ? ` · ${f(1 + ip, 8)}` : ''}/${f(ip, 6)}${d ? ` · ${f(fd, 8)}` : ''} = ${e(va)}$ €` } : { t: 'Término', html: `$C = V_0 · i${pre ? '/(1 + i)' : ''}${d ? ` · (1 + i)^{${d}}` : ''} = ${e(va)} · ${f(ip, 6)}${pre ? `/${f(1 + ip, 8)}` : ''}${d ? ` · ${f(1 / fd, 8)}` : ''} = ${e(c)}$ €` });
    } else {
      n = lee(sc, 'n', 'el número de términos', { min: 1, entero: true });
      if (n > 1200) throw new Error('Como mucho 1.200 términos (si son muchos, usa la renta perpetua)');
      const a = an(n), s = sn(n);
      pasos.push({ t: 'Factores de la renta', html: `Renta ${nomPago}, de ${n} términos${d ? `, diferida ${d} ${pers}` : ''}.<br>$a_{${n}¬i} = {1 − (1 + i)^{−n}}/i = {1 − (1 + ${f(ip, 6)})^{−${n}}}/{${f(ip, 6)}} = ${f(a, 8)}$<br>$s_{${n}¬i} = {(1 + i)^n − 1}/i = ${f(s, 8)}$` });
      const forma = (x) => `${x}${pre ? ' (1 + i)' : ''}`;
      if (modo === 'va' || modo === 'vf') c = lee(sc, 'c', 'el término', { min: 0, minEx: true });
      else if (sc.conocido === 'vf') { vf = lee(sc, 'vf', 'el valor final', { min: 0, minEx: true }); c = vf / (s * fp); }
      else { va = lee(sc, 'va', 'el valor actual', { min: 0, minEx: true }); c = va / (a * fp * fd); }
      va = va ?? c * a * fp * fd; vf = vf ?? c * s * fp;
      if (modo === 'va') pasos.push({ t: 'Valor actual', html: `$V_0 = C · ${forma(`a_{${n}¬i}`)}${d ? ` · (1 + i)^{−${d}}` : ''} = ${e(c)} · ${f(a, 8)}${pre ? ` · ${f(1 + ip, 8)}` : ''}${d ? ` · ${f(fd, 8)}` : ''} = ${e(va)}$ €` });
      if (modo === 'vf') pasos.push({ t: 'Valor final', html: `$V_n = C · ${forma(`s_{${n}¬i}`)} = ${e(c)} · ${f(s, 8)}${pre ? ` · ${f(1 + ip, 8)}` : ''} = ${e(vf)}$ €${d ? ' (el diferimiento no cambia el valor final, que se mide al acabar los pagos)' : ''}` });
      if (modo === 'termino') pasos.push(sc.conocido === 'vf'
        ? { t: 'Término', html: `$C = V_n/(${forma(`s_{${n}¬i}`)}) = ${e(vf)}/${f(s * fp, 8)} = ${e(c)}$ €` }
        : { t: 'Término', html: `$C = V_0/(${forma(`a_{${n}¬i}`)}${d ? ` (1 + i)^{−${d}}` : ''}) = ${e(va)}/${f(a * fp * fd, 8)} = ${e(c)}$ €` });
      pasos.push({ t: modo === 'vf' ? 'Valor actual' : 'Valor final', html: modo === 'vf' ? `Llevado al origen: $V_0 = V_n (1 + i)^{−${n + d}} = ${e(va)}$ €` : `Llevado al final de los pagos: $V_n = V_0 (1 + i)^{${n + d}} = ${e(vf)}$ € (es lo mismo que $C · ${forma(`s_{${n}¬i}`)}$)` });
      pasos.push({ t: 'Intereses', html: `Se pagan ${n} términos de ${e(c)} €, en total ${e(c * n)} €. ${modo === 'vf' || sc.conocido === 'vf' ? `Los intereses ganados son $V_n − n · C = ${e(vf - c * n)}$ €.` : `Frente al valor actual, los intereses son $n · C − V_0 = ${e(c * n - va)}$ €.`}` });
    }
    // calendario de los términos (como mucho 120 filas)
    const nt = n === null ? 120 : Math.min(120, Math.ceil(n - 1e-9)), filas = [];
    for (let k = 1; k <= nt; k++) { const t = d + k - (pre ? 1 : 0); filas.push({ k, t, c, va: c * v(t) }); }
    return { modo, pre, perpetua, m, per, pers, ia, ip, d, c, n, va, vf, filas, pasos };
  }

  const ejemplos = [
    { clave: 'va', nombre: '1.000 € al año durante 10 años al 5 %', sc: { modo: 'va', pago: 'pos', duracion: 'temporal', c: '1000', n: '10', i: '5', m: '1', d: '0' } },
    { clave: 'plan', nombre: 'Ahorrar 200 € al mes durante 5 años', sc: { modo: 'vf', pago: 'pre', duracion: 'temporal', c: '200', n: '60', i: '3', m: '12', d: '0' } },
    { clave: 'cuota', nombre: 'Cuota anual de un préstamo de 20.000 €', sc: { modo: 'termino', pago: 'pos', duracion: 'temporal', conocido: 'va', va: '20000', n: '5', i: '4', m: '1', d: '0' } },
    { clave: 'perpetua', nombre: 'Renta perpetua: 600 € al año al 4 %', sc: { modo: 'va', pago: 'pos', duracion: 'perpetua', c: '600', i: '4', m: '1', d: '0' } },
    { clave: 'diferida', nombre: 'Renta diferida 3 años: 1.500 € durante 8 años', sc: { modo: 'va', pago: 'pos', duracion: 'temporal', c: '1500', n: '8', i: '6', m: '1', d: '3' } },
    { clave: 'cuantos', nombre: '¿Cuántas anualidades de 2.000 € pagan 15.000 €?', sc: { modo: 'n', pago: 'pos', duracion: 'temporal', c: '2000', va: '15000', i: '5', m: '1', d: '0' } },
  ];

  return { resolver, ejemplos, MODOS, PERIODOS };
})();
if (typeof module !== 'undefined') module.exports = Rentas;
