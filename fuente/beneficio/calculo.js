/* =====================================================================
   Maximización del beneficio (sin DOM): una empresa con costes totales
   CT = CF + c·Q + d·Q² (coste marginal CMg = c + 2d·Q) elige la cantidad que
   iguala el ingreso marginal al coste marginal. Dos mercados:
   - competencia perfecta: toma el precio p del mercado, IMg = p;
   - monopolio: la demanda P = a − b·Q, IMg = a − 2b·Q, y se compara con lo
     que pasaría en competencia (P = CMg) para sacar la pérdida de eficiencia.
   Formato en euros de economia/comun.js; interfaz en beneficio/app.js.
     resolver(sc)  { modo, cf, c, d, p | a, b } → { q, pr, it, ct, b, pasos, … }
   ===================================================================== */
const Beneficio = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const MODOS = { competencia: 'Competencia perfecta', monopolio: 'Monopolio' };
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  const u = (x) => f(x, 8).replace(/\./g, '');
  const signo = (x) => (x < 0 ? '−' : '+');

  function resolver(sc) {
    const modo = sc.modo === 'monopolio' ? 'monopolio' : 'competencia';
    const cf = lee(sc, 'cf', 'los costes fijos', { min: 0 });
    const c = lee(sc, 'c', 'el coste variable unitario c', { min: 0 });
    const d = lee(sc, 'd', 'el coeficiente d del coste', { min: 0 });
    const pasos = [];
    pasos.push({ t: 'Costes', html: `$CT = CF + c · Q + d · Q^2 = ${e(cf)} + ${u(c)} · Q + ${u(d)} · Q^2$, y derivando, el coste marginal es $CMg = c + 2d · Q = ${u(c)} + ${u(2 * d)} · Q$.` });
    const cierre = c, pmin = c + 2 * Math.sqrt(cf * d);
    if (modo === 'competencia') {
      const p = lee(sc, 'p', 'el precio de mercado', { min: 0, minEx: true });
      if (!(d > 0)) throw new Error('En competencia perfecta el coste marginal tiene que crecer (d > 0): con d = 0 la empresa produciría todo lo que pudiera si p > c y nada si p < c');
      pasos.push({ t: 'Ingreso marginal', html: `En competencia perfecta la empresa es precio-aceptante: cada unidad se vende a $p = ${e(p)}$ €, así que $IMg = p = ${e(p)}$.` });
      const opera = p > c, q = opera ? (p - c) / (2 * d) : 0;
      pasos.push({ t: 'Cantidad que maximiza el beneficio', html: opera
        ? `Se produce hasta que $IMg = CMg$: $${e(p)} = ${u(c)} + ${u(2 * d)} · Q$, de donde $Q^* = {p − c}/{2d} = {${e(p)} − ${u(c)}}/{${u(2 * d)}} = ${u(q)}$ unidades.`
        : `Con $p = ${e(p)}$ ≤ $c = ${u(c)}$ el precio no cubre ni el coste variable de la primera unidad (el coste marginal ya empieza en ${u(c)}), así que no se produce: $Q^* = 0$.` });
      const it = p * q, ct = cf + c * q + d * q * q, b = it - ct, cvme = c + d * q, cme = q > 0 ? ct / q : null;
      pasos.push({ t: 'Ingresos, costes y beneficio', html: opera
        ? `$IT = p · Q^* = ${e(it)}$ €; $CT = ${e(cf)} + ${u(c)} · ${u(q)} + ${u(d)} · ${u(q)}^2 = ${e(ct)}$ €; $B = IT − CT = ${e(b)}$ € ${b > 0 ? '(beneficio extraordinario)' : b < 0 ? '(pérdidas)' : '(beneficio nulo: el precio iguala al coste medio)'}.`
        : `Sin producir se pagan igualmente los costes fijos: $B = −CF = ${e(-cf)}$ €.` });
      if (opera) pasos.push({ t: '¿Conviene producir o cerrar?', html: `A corto plazo se produce si el precio cubre el coste variable medio: $p = ${e(p)} ${p >= cvme ? '≥' : '<'} CVMe = c + d · Q^* = ${e(cvme)}$ €. ${b >= 0 ? 'Además cubre el coste medio, así que hay beneficio.' : `Hay pérdidas, pero menores que cerrando (${e(-cf)} €), porque el precio cubre el coste variable y aporta ${e(it - (ct - cf))} € a los fijos.`}` });
      pasos.push({ t: 'Precio de cierre y de equilibrio a largo plazo', html: `El <b>precio de cierre</b> es el mínimo del coste variable medio: $c = ${u(cierre)}$ € (por debajo no se produce). El <b>precio que da beneficio nulo</b> es el mínimo del coste medio, en $Q = √{CF/d}$: $p = c + 2√{CF · d} = ${e(pmin)}$ € (a largo plazo, con libre entrada, el precio tiende a él).` });
      return { modo, cf, c, d, p, opera, q, pr: p, it, ct, b, cvme, cme, cierre, pmin, imgq: p, cmgq: c + 2 * d * q, pasos };
    }
    const a = lee(sc, 'a', 'la ordenada de la demanda a', { min: 0, minEx: true });
    const bb = lee(sc, 'b', 'la pendiente de la demanda b', { min: 0, minEx: true });
    if (a <= c) throw new Error('La demanda no llega ni al coste marginal de la primera unidad (a ≤ c): no hay producción rentable');
    pasos.push({ t: 'Demanda e ingreso marginal', html: `El monopolista se enfrenta a toda la demanda: $P = a − b · Q = ${u(a)} − ${u(bb)} · Q$. Su ingreso total es $IT = P · Q = ${u(a)} · Q − ${u(bb)} · Q^2$ y el ingreso marginal, $IMg = a − 2b · Q = ${u(a)} − ${u(2 * bb)} · Q$ (cae el doble de rápido que el precio).` });
    const q = (a - c) / (2 * (bb + d)), pr = a - bb * q;
    pasos.push({ t: 'Cantidad que maximiza el beneficio', html: `$IMg = CMg$: $${u(a)} − ${u(2 * bb)} · Q = ${u(c)} + ${u(2 * d)} · Q$, de donde $Q^m = {a − c}/{2(b + d)} = {${u(a)} − ${u(c)}}/{${u(2 * (bb + d))}} = ${u(q)}$ unidades.` });
    pasos.push({ t: 'Precio', html: `El precio se lee en la demanda, no en el coste marginal: $P^m = a − b · Q^m = ${u(a)} − ${u(bb)} · ${u(q)} = ${e(pr)}$ €.` });
    const it = pr * q, ct = cf + c * q + d * q * q, b = it - ct, cmg = c + 2 * d * q, cvme = c + d * q;
    pasos.push({ t: 'Ingresos, costes y beneficio', html: `$IT = ${e(pr)} · ${u(q)} = ${e(it)}$ €; $CT = ${e(cf)} + ${u(c)} · ${u(q)} + ${u(d)} · ${u(q)}^2 = ${e(ct)}$ €; $B = IT − CT = ${e(b)}$ € ${b >= 0 ? '' : '(pérdidas, pero menores que cerrando: el precio cubre el coste variable medio)'}.` });
    const eps = -(pr / q) / bb, lerner = (pr - cmg) / pr;
    pasos.push({ t: 'Poder de mercado', html: `Elasticidad de la demanda en ese punto: $ε = −{1}/{b} · {P}/{Q} = ${f(eps, 5)}$. Índice de Lerner: $L = {P − CMg}/{P} = {${e(pr)} − ${e(cmg)}}/{${e(pr)}} = ${f(lerner, 5)}$, que coincide con $L = {1}/{ε} = ${f(1 / Math.abs(eps), 5)}$ (en valor absoluto): cuanto menos elástica es la demanda, más sube el monopolista el precio sobre el coste marginal.` });
    const qc = (a - c) / (bb + 2 * d), pc = a - bb * qc, bc = pc * qc - (cf + c * qc + d * qc * qc);
    const perd = 0.5 * (qc - q) * (pr - cmg);
    pasos.push({ t: 'Comparación con la competencia', html: `Si el mercado fuera competitivo, $P = CMg$: $${u(a)} − ${u(bb)} · Q = ${u(c)} + ${u(2 * d)} · Q$ → $Q^c = {a − c}/{b + 2d} = ${u(qc)}$ unidades a $P^c = ${e(pc)}$ €. El monopolio produce ${u(qc - q)} unidades menos y cobra ${e(pr - pc)} € más.` });
    pasos.push({ t: 'Pérdida irrecuperable de eficiencia', html: `Son las unidades entre $Q^m$ y $Q^c$ que a los consumidores les valen más (según la demanda) de lo que cuestan (CMg) y no se producen: el triángulo $PIE = {1}/{2} · (Q^c − Q^m) · (P^m − CMg) = {1}/{2} · ${u(qc - q)} · ${e(pr - cmg)} = ${e(perd)}$ €.` });
    return { modo, cf, c, d, a, bb, opera: true, q, pr, it, ct, b, cvme, cme: ct / q, cierre, pmin, imgq: a - 2 * bb * q, cmgq: cmg, eps, lerner, qc, pc, bc, perd, pasos };
  }

  const ejemplos = [
    { clave: 'competencia', nombre: 'Competencia perfecta: precio de 20 €', sc: { modo: 'competencia', cf: '100', c: '2', d: '0,5', p: '20', a: '', b: '' } },
    { clave: 'perdidas', nombre: 'Competencia: precio bajo y pérdidas', sc: { modo: 'competencia', cf: '100', c: '2', d: '0,5', p: '6', a: '', b: '' } },
    { clave: 'cierre', nombre: 'Competencia: el precio no cubre el coste variable', sc: { modo: 'competencia', cf: '100', c: '8', d: '0,5', p: '5', a: '', b: '' } },
    { clave: 'monopolio', nombre: 'Monopolio: demanda P = 100 − 2Q', sc: { modo: 'monopolio', cf: '200', c: '10', d: '1', p: '', a: '100', b: '2' } },
    { clave: 'monopolio-lineal', nombre: 'Monopolio con coste marginal constante', sc: { modo: 'monopolio', cf: '50', c: '20', d: '0', p: '', a: '80', b: '1' } },
  ];

  return { resolver, ejemplos, MODOS };
})();
if (typeof module !== 'undefined') module.exports = Beneficio;
