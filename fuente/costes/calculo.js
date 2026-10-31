/* =====================================================================
   Costes de producción (sin DOM): a partir de la función de costes
   CT(Q) = CF + a·Q + b·Q² + c·Q³ saca, para una producción Q, el coste
   variable, el total, los medios (fijo, variable y total) y el marginal; y
   en toda la curva el mínimo de explotación (mínimo del coste variable
   medio, por debajo del cual conviene cerrar) y el óptimo de explotación
   (mínimo del coste medio, el umbral de rentabilidad), donde CMg = CMe.
   Formato en euros de economia/comun.js; interfaz en costes/app.js.
     resolver(sc)  { cf, a, b, c, q } → { cv, ct, cfme, cvme, cme, cmg,
                   qc, pc, qm, pm, pasos, fn }
   ===================================================================== */
const Costes = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  // polinomio «a·Q + b·Q² + c·Q³» con sus signos
  const poli = (a, b, c) => [[a, 'Q'], [b, 'Q^2'], [c, 'Q^3']].filter(([k]) => k !== 0).map(([k, t], i) => `${k < 0 ? '−' : i ? '+' : ''} ${Math.abs(k) === 1 ? '' : f(Math.abs(k), 6) + ' · '}${t}`.trim()).join(' ');

  // función de costes y derivadas, para dibujar y para las pruebas
  const funciones = (cf, a, b, c) => ({
    cv: (q) => a * q + b * q * q + c * q ** 3, ct: (q) => cf + a * q + b * q * q + c * q ** 3,
    cvme: (q) => a + b * q + c * q * q, cme: (q) => cf / q + a + b * q + c * q * q, cmg: (q) => a + 2 * b * q + 3 * c * q * q,
  });

  function resolver(sc) {
    const cf = lee(sc, 'cf', 'los costes fijos', { min: 0, minEx: true });
    const a = lee(sc, 'a', 'el coeficiente a (coste variable de la primera unidad)', { min: 0, minEx: true });
    const b = lee(sc, 'b', 'el coeficiente b', { def: 0 }), c = lee(sc, 'c', 'el coeficiente c', { min: 0, def: 0 });
    const q = lee(sc, 'q', 'la producción Q', { min: 0, minEx: true });
    if (c === 0 && b <= 0) throw new Error('Con c = 0 hace falta b > 0: si no, el coste medio no tiene mínimo (los rendimientos no serían decrecientes)');
    if (c > 0 && b < 0 && b * b >= 3 * a * c) throw new Error('Con estos coeficientes el coste marginal llegaría a ser negativo o nulo (hace falta b² < 3·a·c); cambia b, a o c');
    const F = funciones(cf, a, b, c);
    // mínimo del coste variable medio: CVMe' = b + 2cQ = 0
    const qc = c > 0 && b < 0 ? -b / (2 * c) : 0, pc = F.cvme(qc);
    // mínimo del coste medio: CMe' = 0 ⇒ 2cQ³ + bQ² − CF = 0
    let qm;
    if (c === 0) qm = Math.sqrt(cf / b);
    else { let lo = 0, hi = 1; const h = (x) => 2 * c * x ** 3 + b * x * x - cf; while (h(hi) < 0) hi *= 2; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (h(m) < 0) lo = m; else hi = m; } qm = (lo + hi) / 2; }
    const pm = F.cme(qm);
    const cv = F.cv(q), ct = cf + cv, cfme = cf / q, cvme = cv / q, cme = ct / q, cmg = F.cmg(q), pasos = [];
    const pol = poli(a, b, c);
    pasos.push({ t: 'La función de costes', html: `Los costes fijos no dependen de lo que se produzca y los variables sí: $CT(Q) = CF + CV(Q) = ${e(cf)} + (${pol})$ €.` });
    const sust = () => `${a !== 0 ? f(a, 6) + ' · ' + f(q, 6) : ''}${b !== 0 ? (b < 0 ? ' − ' : ' + ') + f(Math.abs(b), 6) + ' · ' + f(q, 6) + '^2' : ''}${c !== 0 ? ' + ' + f(c, 6) + ' · ' + f(q, 6) + '^3' : ''}`;
    pasos.push({ t: 'Coste variable y total con Q', html: `$CV = ${sust()} = ${e(cv)}$ €, y $CT = CF + CV = ${e(cf)} + ${e(cv)} = ${e(ct)}$ €.` });
    pasos.push({ t: 'Costes medios', html: `Se dividen entre la producción: $CFMe = {CF}/Q = ${e(cfme)}$ €, $CVMe = {CV}/Q = ${e(cvme)}$ € y $CMe = {CT}/Q = CFMe + CVMe = ${e(cme)}$ € por unidad.` });
    const deriv = `${f(a, 6)}${b !== 0 ? (b < 0 ? ' − ' : ' + ') + f(2 * Math.abs(b), 6) + ' · ' + f(q, 6) : ''}${c !== 0 ? ' + ' + f(3 * c, 6) + ' · ' + f(q, 6) + '^2' : ''}`;
    pasos.push({ t: 'Coste marginal', html: `Lo que cuesta producir una unidad más es la derivada del coste: $CMg = {dCT}/{dQ} = ${f(a, 6)}${b !== 0 ? (b < 0 ? ' − ' : ' + ') + f(2 * Math.abs(b), 6) + ' · Q' : ''}${c !== 0 ? ' + ' + f(3 * c, 6) + ' · Q^2' : ''}$, que en Q = ${f(q, 6)} vale $${deriv} = ${e(cmg)}$ €.` });
    pasos.push({ t: 'Relación entre el marginal y el medio', html: `Como $CMg ${cmg < cme ? '<' : cmg > cme ? '>' : '='} CMe$, ${cmg < cme ? 'el coste medio está bajando: producir una unidad más cuesta menos que lo que cuesta de media' : cmg > cme ? 'el coste medio está subiendo: la unidad extra cuesta más que la media' : 'estás justo en el mínimo del coste medio'}.` });
    pasos.push({ t: 'Mínimo de explotación (cierre)', html: c > 0 && b < 0
      ? `El coste variable medio es mínimo donde su derivada se anula: $b + 2 · c · Q = 0$, es decir $Q = {−b}/{2 · c} = ${f(qc, 6)}$ unidades, y vale $CVMe = ${e(pc)}$ €. Si el precio no llega a ese valor, ni siquiera se cubren los costes variables y conviene cerrar.`
      : `Con estos coeficientes el coste variable medio, $a + b · Q + c · Q^2$, no baja de $a = ${e(a)}$ € (su valor con la primera unidad) y crece al producir más. Si el precio es menor que ${e(a)} €, no se cubren ni los costes variables y conviene cerrar.` });
    pasos.push({ t: 'Óptimo de explotación (umbral de rentabilidad)', html: `El coste medio es mínimo donde cumple $CMe = CMg$, o sea donde se anula su derivada: $${c !== 0 ? '2 · c · Q^3 + b · Q^2 − CF = 0' : 'b · Q^2 = CF'}$${c !== 0 ? ', que se resuelve numéricamente' : `, de donde $Q = √(CF/b)$`}. Sale $Q = ${f(qm, 6)}$ unidades y $CMe = CMg = ${e(pm)}$ €. Con un precio de ${e(pm)} € o más se cubren todos los costes (beneficio no negativo).` });
    return { cf, a, b, c, q, cv, ct, cfme, cvme, cme, cmg, qc, pc, qm, pm, pasos, F };
  }

  const ejemplos = [
    { clave: 'clasico', nombre: 'Curva en U: CV = Q³ − 6Q² + 15Q y CF = 32', sc: { cf: '32', a: '15', b: '-6', c: '1', q: '5' } },
    { clave: 'cuadratico', nombre: 'Costes cuadráticos: CT = 450 + 20Q + 0,5Q²', sc: { cf: '450', a: '20', b: '0,5', c: '0', q: '20' } },
    { clave: 'optimo', nombre: 'Producir justo en el mínimo del coste medio', sc: { cf: '32', a: '15', b: '-6', c: '1', q: '4' } },
  ];

  return { resolver, ejemplos, funciones };
})();
if (typeof module !== 'undefined') module.exports = Costes;
