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

  const MODOS = { uno: 'Un producto', varios: 'Varios productos (mezcla de ventas)' };
  // con varios productos: precio, coste variable y unidades previstas de cada uno; todo se reduce a un producto «medio»
  // ponderado por la mezcla de ventas (p̄ = ∑ w·p, c̄ᵥ = ∑ w·cᵥ, con w = Q_i/∑Q)
  function mezcla(sc) {
    const d = K.filas(sc.productos, 3, 'los productos');
    if (d.length < 2) throw new Error('Escribe al menos dos productos, uno por línea: precio, coste variable unitario y unidades previstas');
    if (d.some((r) => r[0] <= 0 || r[1] < 0 || r[2] <= 0)) throw new Error('En cada producto, el precio y las unidades tienen que ser positivos y el coste variable no puede ser negativo');
    const Q = d.reduce((s, r) => s + r[2], 0), w = d.map((r) => r[2] / Q);
    return { d, Q, w, p: d.reduce((s, r, k) => s + w[k] * r[0], 0), cv: d.reduce((s, r, k) => s + w[k] * r[1], 0) };
  }
  // sensibilidad: cada dato un 20 % y un 10 % abajo y arriba, de uno en uno; punto muerto y beneficio con Q
  function sensibilidad(cf, p, cv, q) {
    const out = [];
    for (const [v, nom] of [['p', 'Precio'], ['cv', 'Coste variable'], ['cf', 'Costes fijos']]) {
      for (const dl of [-0.2, -0.1, 0, 0.1, 0.2]) {
        const P = p * (v === 'p' ? 1 + dl : 1), V = cv * (v === 'cv' ? 1 + dl : 1), F = cf * (v === 'cf' ? 1 + dl : 1), m = P - V;
        out.push({ v, nom, dl, q0: m > 0 ? F / m : null, b: q === null ? null : m * q - F });
      }
    }
    return out;
  }

  function resolver(sc) {
    const cf = lee(sc, 'cf', 'los costes fijos', { min: 0, minEx: true });
    const modo = sc.modo === 'varios' ? 'varios' : 'uno', M = modo === 'varios' ? mezcla(sc) : null;
    const p = M ? M.p : lee(sc, 'p', 'el precio de venta', { min: 0, minEx: true });
    const cv = M ? M.cv : lee(sc, 'cv', 'el coste variable unitario', { min: 0 });
    if (cv >= p) throw new Error(M ? 'Con esta mezcla de ventas el margen medio no es positivo: el coste variable medio supera al precio medio y no hay punto muerto' : 'El precio tiene que ser mayor que el coste variable unitario: si no, cada venta pierde dinero y no hay punto muerto');
    const q = M ? M.Q : vacio(sc.q) ? null : lee(sc, 'q', 'las ventas previstas', { min: 0, minEx: true });
    const obj = vacio(sc.objetivo) ? null : lee(sc, 'objetivo', 'el beneficio objetivo', { min: 0 });
    const m = p - cv, rm = m / p, q0 = cf / m, i0 = p * q0, pasos = [];
    if (M) {
      pasos.push({ t: 'Mezcla de ventas', html: `Se venden ${M.d.length} productos en una proporción fija. Cada uno pesa lo que vende del total, $w_i = Q_i/∑Q$: ${M.d.map((r, k) => `producto ${k + 1}, ${u(r[2])}/${u(M.Q)} = ${f(100 * M.w[k], 4)} %`).join('; ')}.` });
      pasos.push({ t: 'Producto medio', html: `Precio medio $\p_{med} = ∑ w_i p_i = ${e(p)}$ € y coste variable medio $\c_{v,med} = ∑ w_i c_{v,i} = ${e(cv)}$ €. Margen de contribución medio ponderado: $m = \p_{med} − \c_{v,med} = ${e(p)} − ${e(cv)} = ${e(p - cv)}$ € por unidad vendida, que es $∑ w_i m_i$ con $m_i = p_i − c_{v,i}$ (${M.d.map((r, k) => `${e(r[0] - r[1])}`).join('; ')}).` });
      const flojos = M.d.map((r, k) => ({ k, mi: r[0] - r[1] })).filter((x) => x.mi <= 0);
      if (flojos.length) pasos.push({ t: 'Aviso', html: `El producto ${flojos.map((x) => x.k + 1).join(', ')} no deja margen (precio igual o menor que su coste variable): la mezcla lo arrastra, pero cada unidad que se vende de él resta al margen medio.` });
    }
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
    if (M) pasos.push({ t: 'Punto muerto de cada producto', html: `Con la mezcla constante, ${u(q0)} unidades en total se reparten así: ${M.d.map((r, k) => `producto ${k + 1}, ${u(q0 * M.w[k])} unidades (${e(r[0] * q0 * M.w[k])} €)`).join('; ')}. Si cambia la mezcla, cambia el punto muerto.` });
    const sens = sensibilidad(cf, p, cv, q);
    pasos.push({ t: 'Sensibilidad', html: 'La tabla de sensibilidad cambia un dato cada vez (±10 % y ±20 %) y deja los demás: se ve que el punto muerto depende sobre todo de los datos que más pesan en el margen, p − c<sub>v</sub>.' });
    return { modo, prod: M ? M.d.map((r, k) => ({ p: r[0], cv: r[1], q: r[2], w: M.w[k], q0: q0 * M.w[k] })) : null, cf, p, cv, q, obj, m, rm, q0, i0, b, ms, gao, qObj, sens, pasos };
  }

  const ejemplos = [
    { clave: 'fabrica', nombre: 'Taller: 30.000 € de costes fijos y 2.000 unidades', sc: { cf: '30000', p: '50', cv: '30', q: '2000', objetivo: '' } },
    { clave: 'cafeteria', nombre: 'Cafetería: cuántos cafés al mes para no perder', sc: { cf: '4000', p: '2,5', cv: '0,9', q: '3000', objetivo: '' } },
    { clave: 'objetivo', nombre: 'Unidades para ganar 40.000 €', sc: { cf: '120000', p: '200', cv: '120', q: '1800', objetivo: '40000' } },
    { clave: 'perdidas', nombre: 'Una empresa que no llega al punto muerto', sc: { cf: '50000', p: '25', cv: '15', q: '4000', objetivo: '' } },
    { clave: 'tres-productos', nombre: 'Tienda con tres productos y una mezcla de ventas', sc: { modo: 'varios', cf: '12000', productos: '10 6 1000\n25 15 600\n40 22 400', q: '', objetivo: '' } },
    { clave: 'dos-productos-objetivo', nombre: 'Dos productos: unidades para ganar 8.000 €', sc: { modo: 'varios', cf: '20000', productos: '50 30 500\n80 60 250', q: '', objetivo: '8000' } },
  ];

  // modo práctica: datos redondos al azar
  const AZ = K.az, azar = AZ.desde(ejemplos, () => {
    const cf = AZ.toma([10000, 20000, 30000, 50000]), p = AZ.toma([20, 25, 50, 100]), cv = Math.round(p * AZ.toma([0.4, 0.5, 0.6]) * 100) / 100;
    return { cf: String(cf), p: String(p), cv: AZ.t(cv, 2), q: String(Math.max(50, Math.round((cf / (p - cv)) * AZ.toma([0.8, 1.2, 1.5]) / 50) * 50)), objetivo: '' };
  }, (sc) => sc.modo !== 'varios' && !sc.objetivo, (sc) => resolver(sc));
  const enunciado = (sc) => `Una empresa tiene costes fijos de ${sc.cf} €, vende a ${sc.p} € la unidad y el coste variable unitario es de ${sc.cv} €. Calcula el punto muerto en unidades y en euros, el margen de contribución y, vendiendo ${sc.q} unidades, el beneficio, el margen de seguridad y el apalancamiento operativo.`;

  return { azar, enunciado, resolver, ejemplos, MODOS };
})();
if (typeof module !== 'undefined') module.exports = PuntoMuerto;
