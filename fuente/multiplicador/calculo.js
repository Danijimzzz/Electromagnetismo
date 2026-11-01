/* =====================================================================
   Multiplicador keynesiano (sin DOM): modelo renta-gasto de una economía
   abierta con Estado, con consumo C = C0 + c·(Y − T), impuestos
   T = T0 + t·Y e importaciones M = M0 + m·Y. Saca la renta de equilibrio
   (donde la demanda agregada DA = C + I + G + X − M iguala a la renta), el
   multiplicador del gasto, el de los impuestos fijos y el del presupuesto
   equilibrado, el efecto de un cambio de gasto o de impuestos, la brecha
   con la renta de pleno empleo y las rondas del multiplicador.
   Formato en euros de economia/comun.js; interfaz en multiplicador/app.js.
     resolver(sc)  { c0, c, t0, t, i, g, x, m0, m, dg, dt0, yp } → { a, b, k,
                   kt, keq, y, cons, imp, ahorro, saldoPublico, saldoExterior,
                   dy, y2, brecha, dgNec, dtNec, rondas, pasos }
   ===================================================================== */
const Multiplicador = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee, dinero } = K;
  const e = (x) => dinero(x).replace('-', '−');
  const sg = (x) => (x < 0 ? '−' : '+');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

  function resolver(sc) {
    const c0 = lee(sc, 'c0', 'el consumo autónomo C0', { min: 0 });
    const c = lee(sc, 'c', 'la propensión marginal a consumir c', { min: 0, max: 1 });
    const t0 = lee(sc, 't0', 'los impuestos fijos T0', { min: 0, def: 0 });
    const t = lee(sc, 't', 'el tipo impositivo t', { min: 0, max: 1, maxEx: true, def: 0 });
    const i = lee(sc, 'i', 'la inversión I', { min: 0 }), g = lee(sc, 'g', 'el gasto público G', { min: 0 });
    const x = lee(sc, 'x', 'las exportaciones X', { min: 0, def: 0 });
    const m0 = lee(sc, 'm0', 'las importaciones autónomas M0', { min: 0, def: 0 });
    const m = lee(sc, 'm', 'la propensión marginal a importar m', { min: 0, max: 1, def: 0 });
    const dg = lee(sc, 'dg', 'la variación del gasto público ΔG', { def: 0 }), dt0 = lee(sc, 'dt0', 'la variación de los impuestos fijos ΔT0', { def: 0 });
    const yp = vacio(sc.yp) ? null : lee(sc, 'yp', 'la renta de pleno empleo', { min: 0, minEx: true });
    // propensión marginal al gasto: lo que de cada euro extra de renta se vuelve a gastar en producción nacional
    const b = c * (1 - t) - m, k = 1 / (1 - b);
    if (!(b < 1)) throw new Error('Con c = 1, sin impuestos proporcionales ni importaciones, todo euro extra de renta se vuelve a gastar y el multiplicador sería infinito; baja c o añade t o m');
    const a = c0 - c * t0 + i + g + x - m0, y = a / (1 - b);
    if (!(y > 0)) throw new Error('Con estos datos la renta de equilibrio no es positiva (el gasto autónomo C0 − c·T0 + I + G + X − M0 sale ' + (a < 0 ? 'negativo' : 'nulo') + '); sube el gasto o baja las importaciones autónomas o los impuestos');
    const kt = -c * k, keq = (1 - c) * k;
    const T = t0 + t * y, cons = c0 + c * (y - T), imp = m0 + m * y, ahorro = y - T - cons;
    const da = cons + i + g + x - imp;
    const saldoPublico = T - g, saldoExterior = x - imp;
    // efecto de un cambio de gasto y de impuestos
    const da_ = dg - c * dt0, dy = k * da_, y2 = y + dy;
    const T2 = t0 + dt0 + t * y2, cons2 = c0 + c * (y2 - T2), imp2 = m0 + m * y2;
    // brecha con el pleno empleo
    const brecha = yp === null ? null : yp - y, dgNec = brecha === null ? null : brecha / k, dtNec = brecha === null || c === 0 ? null : brecha / kt;
    // rondas del multiplicador
    const rondas = []; if (da_ !== 0) { let inc = da_, ac = 0; for (let r = 0; r < 8; r++) { ac += inc; rondas.push({ r, inc, ac }); inc *= b; } }
    const pasos = [];
    const tx = t0 !== 0 || t !== 0, im = m0 !== 0 || m !== 0;
    pasos.push({ t: 'La demanda agregada', html: `Se gasta en producción nacional lo que consumen las familias, lo que invierten las empresas, lo que gasta el Estado y lo que compra el exterior, menos lo que se importa: $DA = C + I + G + X − M$. El consumo depende de la renta disponible, $C = C_0 + c · (Y − T)$${tx ? `, con los impuestos $T = T_0 + t · Y = ${f(t0, 6)} + ${f(t, 6)} · Y$` : ''}${im ? ` y las importaciones $M = M_0 + m · Y = ${f(m0, 6)} + ${f(m, 6)} · Y$` : ''}.` });
    pasos.push({ t: 'Gasto autónomo y propensión marginal al gasto', html: `Se agrupa lo que no depende de la renta: $A = C_0 − c · T_0 + I + G + X − M_0 = ${f(c0, 6)} − ${f(c, 6)} · ${f(t0, 6)} + ${f(i, 6)} + ${f(g, 6)} + ${f(x, 6)} − ${f(m0, 6)} = ${e(a)}$. De cada euro extra de renta se vuelve a gastar en producción nacional $b = c · (1 − t) − m = ${f(c, 6)} · (1 − ${f(t, 6)}) − ${f(m, 6)} = ${f(b, 6)}$, así que $DA = A + b · Y$.` });
    pasos.push({ t: 'Renta de equilibrio', html: `La renta se estabiliza cuando la producción iguala a la demanda, $Y = DA$ (la recta de 45°): $Y = A + b · Y$, de donde $Y^* = {A}/{1 − b} = {${f(a, 6)}}/{1 − ${f(b, 6)}} = ${e(y)}$.` });
    pasos.push({ t: 'Multiplicador del gasto', html: `Un euro más de gasto autónomo genera renta, que genera consumo, que genera renta…: $k = {1}/{1 − b} = {1}/{1 − ${f(b, 6)}} = ${f(k, 6)}$. Cada euro de gasto autónomo extra aumenta la renta de equilibrio en ${f(k, 4)} €.` });
    pasos.push({ t: 'Multiplicador de los impuestos fijos y del presupuesto equilibrado', html: `Un euro más de impuestos fijos baja el consumo en $c$ euros, no en uno: $k_T = −{c}/{1 − b} = ${f(kt, 6)}$. Si el Estado sube a la vez el gasto y los impuestos en la misma cantidad, la renta sube igualmente: $k_{eq} = k + k_T = {1 − c}/{1 − b} = ${f(keq, 6)}$.` });
    pasos.push({ t: 'Cuentas de la economía en el equilibrio', html: `Con $Y^* = ${e(y)}$: impuestos $T = ${e(T)}$, consumo $C = ${e(cons)}$, ahorro privado $S = Y − T − C = ${e(ahorro)}$, importaciones $M = ${e(imp)}$ y demanda agregada $DA = ${e(da)}$ (igual a $Y^*$). Se cumple $S + T + M = I + G + X$: $${f(ahorro, 6)} + ${f(T, 6)} + ${f(imp, 6)} = ${f(i + g + x, 6)}$. Saldo público $T − G = ${e(saldoPublico)}$ y saldo exterior $X − M = ${e(saldoExterior)}$.` });
    if (da_ !== 0) {
      pasos.push({ t: 'Efecto de la política fiscal', html: `El gasto autónomo cambia en $ΔA = ΔG − c · ΔT_0 = ${f(dg, 6)} − ${f(c, 6)} · ${f(dt0, 6)} = ${e(da_)}$, y la renta de equilibrio en $ΔY = k · ΔA = ${f(k, 6)} · ${f(da_, 6)} = ${e(dy)}$. La renta pasa de ${e(y)} a $Y' = ${e(y2)}$ (el consumo a ${e(cons2)} y las importaciones a ${e(imp2)}).` });
      pasos.push({ t: 'Rondas del multiplicador', html: `La renta no sube de golpe: cada ronda de gasto genera la siguiente, multiplicada por $b = ${f(b, 6)}$. Tras ${rondas.length} rondas se ha recorrido ${f(100 * (1 - b ** rondas.length), 4)} % del efecto total, $ΔY = ΔA · (1 + b + b^2 + …) = {ΔA}/{1 − b}$.` });
    }
    if (brecha !== null) {
      pasos.push({ t: 'Brecha con el pleno empleo', html: `La brecha de producción es $Y_p − Y^* = ${f(yp, 6)} − ${f(y, 6)} = ${e(brecha)}$${brecha > 0 ? ' (brecha recesiva: la economía produce menos que su nivel de pleno empleo)' : brecha < 0 ? ' (brecha inflacionista: la demanda empuja por encima del pleno empleo)' : ''}. Para cerrarla solo con gasto público haría falta $ΔG = {brecha}/k = ${e(dgNec)}$${dtNec === null ? '.' : `, o solo con impuestos fijos $ΔT_0 = {brecha}/{k_T} = ${e(dtNec)}$.`}` });
    }
    return { c0, c, t0, t, i, g, x, m0, m, dg, dt0, yp, a, b, k, kt, keq, y, T, cons, imp, ahorro, saldoPublico, saldoExterior, da, dy, y2, a2: a + da_, da_, brecha, dgNec, dtNec, rondas, pasos };
  }

  const ejemplos = [
    { clave: 'basico', nombre: 'Modelo básico: C = 100 + 0,8·Y, I = 200, G = 300', sc: { c0: '100', c: '0,8', t0: '0', t: '0', i: '200', g: '300', x: '0', m0: '0', m: '0', dg: '50', dt0: '0', yp: '' } },
    { clave: 'estado', nombre: 'Con impuestos: T = 100 + 0,25·Y y gasto de +80', sc: { c0: '200', c: '0,8', t0: '100', t: '0,25', i: '300', g: '400', x: '0', m0: '0', m: '0', dg: '80', dt0: '0', yp: '' } },
    { clave: 'abierta', nombre: 'Economía abierta y brecha con el pleno empleo', sc: { c0: '150', c: '0,75', t0: '100', t: '0,2', i: '250', g: '350', x: '200', m0: '50', m: '0,1', dg: '0', dt0: '0', yp: '2500' } },
  ];

  return { resolver, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = Multiplicador;
