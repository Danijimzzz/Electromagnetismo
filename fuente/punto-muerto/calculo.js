/* =====================================================================
   Punto muerto (sin DOM): umbral de rentabilidad de una empresa con costes
   fijos CF, precio de venta p y coste variable unitario cv. Saca el margen
   de contribución, el punto muerto en unidades y en euros, el beneficio con
   las ventas previstas, el margen de seguridad, el grado de apalancamiento
   operativo y las unidades que hacen falta para un beneficio objetivo.
   Formato en euros de economia/comun.js; interfaz en punto-muerto/app.js.
     resolver(sc)  { cf, p, cv, q, objetivo } → { m, q0, i0, b, ms, gao, qObj, pasos }
   ===================================================================== */
const PuntoMuerto = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee, vacio } = K;
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  const u = (x) => f(x, 8).replace(/\./g, '');

  function resolver(sc) {
    const cf = lee(sc, 'cf', 'los costes fijos', { min: 0, minEx: true });
    const p = lee(sc, 'p', 'el precio de venta', { min: 0, minEx: true });
    const cv = lee(sc, 'cv', 'el coste variable unitario', { min: 0 });
    if (cv >= p) throw new Error('El precio tiene que ser mayor que el coste variable unitario: si no, cada venta pierde dinero y no hay punto muerto');
    const q = vacio(sc.q) ? null : lee(sc, 'q', 'las ventas previstas', { min: 0, minEx: true });
    const obj = vacio(sc.objetivo) ? null : lee(sc, 'objetivo', 'el beneficio objetivo', { min: 0 });
    const m = p - cv, rm = m / p, q0 = cf / m, i0 = p * q0, pasos = [];
    pasos.push({ t: 'Margen de contribución', html: `Lo que deja cada unidad vendida para pagar los costes fijos: $m = p − c_v = ${e(p)} − ${e(cv)} = ${e(m)}$ €, un ${f(100 * rm, 4)} % del precio.` });
    pasos.push({ t: 'Punto muerto en unidades', html: `En el punto muerto los ingresos igualan a los costes, $p · Q = CF + c_v · Q$, así que<br>$Q^* = {CF}/{p − c_v} = {${e(cf)}}/{${e(m)}} = ${u(q0)}$ unidades${Number.isInteger(+q0.toFixed(9)) ? '' : ` (hay que vender ${Math.ceil(q0 - 1e-9)} para no perder)`}.` });
    pasos.push({ t: 'Punto muerto en euros', html: `$p · Q^* = ${e(p)} · ${u(q0)} = ${e(i0)}$ €, o dividiendo los costes fijos entre el margen sobre ventas: $${e(cf)}/${f(rm, 6)} = ${e(i0)}$ € de facturación.` });
    let b = null, ms = null, gao = null, qObj = null;
    if (q !== null) {
      b = m * q - cf;
      pasos.push({ t: 'Beneficio con las ventas previstas', html: `$B = m · Q − CF = ${e(m)} · ${u(q)} − ${e(cf)} = ${e(b)}$ € ${b > 0 ? '(beneficio)' : b < 0 ? '(pérdidas: no se llega al punto muerto)' : '(justo el punto muerto)'}.` });
      ms = (q - q0) / q;
      pasos.push({ t: 'Margen de seguridad', html: `Cuánto pueden bajar las ventas antes de entrar en pérdidas: $(Q − Q^*)/Q = (${u(q)} − ${u(q0)})/${u(q)} = ${f(ms, 6)}$, un ${f(100 * ms, 4)} %${ms < 0 ? ' (negativo: ya hay pérdidas)' : ''}.` });
      if (Math.abs(b) > 1e-9) { gao = (m * q) / b; pasos.push({ t: 'Apalancamiento operativo', html: `$GAO = {m · Q}/B = {${e(m * q)}}/{${e(b)}} = ${f(gao, 5)}$: ${gao > 0 ? `si las ventas suben un 1 %, el beneficio sube un ${f(gao, 4)} %. Cuanto más cerca del punto muerto, más sensible es el beneficio a las ventas.` : 'con pérdidas, el GAO sale negativo y no se interpreta igual.'}` }); }
    }
    if (obj !== null) {
      qObj = (cf + obj) / m;
      pasos.push({ t: 'Ventas para el beneficio objetivo', html: `Hay que cubrir los costes fijos y además el beneficio: $Q = {CF + B}/m = {${e(cf)} + ${e(obj)}}/{${e(m)}} = ${u(qObj)}$ unidades, que son ${e(p * qObj)} € de ventas.` });
    }
    return { cf, p, cv, q, obj, m, rm, q0, i0, b, ms, gao, qObj, pasos };
  }

  const ejemplos = [
    { clave: 'fabrica', nombre: 'Taller: 30.000 € de costes fijos y 2.000 unidades', sc: { cf: '30000', p: '50', cv: '30', q: '2000', objetivo: '' } },
    { clave: 'cafeteria', nombre: 'Cafetería: cuántos cafés al mes para no perder', sc: { cf: '4000', p: '2,5', cv: '0,9', q: '3000', objetivo: '' } },
    { clave: 'objetivo', nombre: 'Unidades para ganar 40.000 €', sc: { cf: '120000', p: '200', cv: '120', q: '1800', objetivo: '40000' } },
    { clave: 'perdidas', nombre: 'Una empresa que no llega al punto muerto', sc: { cf: '50000', p: '25', cv: '15', q: '4000', objetivo: '' } },
  ];

  // modo práctica: datos redondos al azar
  const AZ = K.az, azar = AZ.desde(ejemplos, () => {
    const cf = AZ.toma([10000, 20000, 30000, 50000]), p = AZ.toma([20, 25, 50, 100]), cv = Math.round(p * AZ.toma([0.4, 0.5, 0.6]) * 100) / 100;
    return { cf: String(cf), p: String(p), cv: AZ.t(cv, 2), q: String(Math.max(50, Math.round((cf / (p - cv)) * AZ.toma([0.8, 1.2, 1.5]) / 50) * 50)), objetivo: '' };
  }, (sc) => !sc.objetivo, (sc) => resolver(sc));
  const enunciado = (sc) => `Una empresa tiene costes fijos de ${sc.cf} €, vende a ${sc.p} € la unidad y el coste variable unitario es de ${sc.cv} €. Calcula el punto muerto en unidades y en euros, el margen de contribución y, vendiendo ${sc.q} unidades, el beneficio, el margen de seguridad y el apalancamiento operativo.`;

  return { azar, enunciado, resolver, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = PuntoMuerto;
