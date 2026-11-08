/* =====================================================================
   Ratios financieros (sin DOM): a partir del balance (activo no corriente,
   existencias, realizable, disponible, patrimonio neto, pasivo no corriente
   y corriente) y de la cuenta de resultados (ventas, BAII, gastos
   financieros y tipo del impuesto) saca el fondo de maniobra, los ratios
   de liquidez, solvencia y endeudamiento con su valor recomendado, la
   rentabilidad económica (ROA, como margen por rotación) y la financiera
   (ROE), y el efecto del apalancamiento financiero. Formato en euros de
   economia/comun.js; interfaz en ratios/app.js.
   Con comparar = 'si' se dan dos situaciones (A, y B con las mismas claves terminadas en 2: otra
   empresa u otro año) y se comparan ratio a ratio.
     resolver(sc)  { anc, ex, re, di, pn, pnc, pc, ventas, baii, gf, t, comparar } → { ratios, roa, roe, b, pasos }
   ===================================================================== */
const Ratios = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  const r3 = (x) => f(x, 4), tp = (x) => `${f(100 * x, 4)} %`;
  // [mínimo, máximo] recomendados (null si no hay) y lo que se dice en cada caso
  const valora = (x, [a, b], bajo, alto, bien) => (a !== null && x < a ? ['bajo', bajo] : b !== null && x > b ? ['alto', alto] : ['bien', bien]);

  const CLAVES = ['anc', 'ex', 're', 'di', 'pn', 'pnc', 'pc', 'ventas', 'baii', 'gf', 't'];
  function resolver(sc) {
    const a = uno(sc);
    if (sc.comparar !== 'si') return a;
    const sc2 = {}; for (const k of CLAVES) sc2[k] = sc[k + '2'];
    let b;
    try { b = uno(sc2); } catch (err) { throw new Error(`En la situación B: ${err.message.charAt(0).toLowerCase()}${err.message.slice(1)}`); }
    const mejor = (x, y, alto = true) => (Math.abs(x - y) < 1e-12 ? 'igual' : (x > y) === alto ? 'A' : 'B');
    const filas = [['Fondo de maniobra', a.fm, b.fm, true, 'e'], ...a.ratios.map((x, k) => [x.nombre, x.val, b.ratios[k].val, null, 'r']), ['Rentabilidad económica (ROA)', a.roa, b.roa, true, 'p'], ['Rentabilidad financiera (ROE)', a.roe, b.roe, true, 'p']];
    const lin = filas.filter((x) => x[1] !== null && x[2] !== null && isFinite(x[1]) && isFinite(x[2])).map(([n, x, y, alto, tipo]) => {
      const fm = tipo === 'e' ? e : tipo === 'p' ? tp : r3, sube = y - x;
      return `${n}: A ${tipo === 'e' ? fm(x) + ' €' : fm(x)} → B ${tipo === 'e' ? fm(y) + ' €' : fm(y)} (${sube > 0 ? 'B es mayor' : sube < 0 ? 'B es menor' : 'igual'}${alto === true ? `; mejor ${mejor(x, y)}` : ''})`;
    });
    const pasos = [{ t: 'Comparación de A y B', html: `Las dos situaciones calculadas con los mismos criterios:<br>${lin.join('<br>')}` }];
    const dROA = b.roa - a.roa, dROE = a.roe !== null && b.roe !== null ? b.roe - a.roe : null;
    pasos.push({ t: 'Qué cambia y por qué', html: `La rentabilidad económica pasa del ${tp(a.roa)} al ${tp(b.roa)} (${dROA >= 0 ? '+' : '−'}${f(100 * Math.abs(dROA), 4)} puntos): ${Math.abs(b.margen - a.margen) > Math.abs(b.rot - a.rot) * 0.1 ? `el margen va del ${tp(a.margen)} al ${tp(b.margen)} y la rotación de ${f(a.rot, 4)} a ${f(b.rot, 4)} veces` : 'cambia sobre todo por la rotación'}.${dROE !== null ? ` La financiera, del ${tp(a.roe)} al ${tp(b.roe)}: ${Math.sign(dROA) !== Math.sign(dROE) && Math.abs(dROA) > 1e-9 ? 'se mueve en sentido contrario a la económica porque cambia el endeudamiento y el coste de la deuda' : 'el endeudamiento y el coste de la deuda amplían o reducen el cambio'}.` : ''}` });
    return { ...a, b, comparar: true, pasosA: a.pasos, pasos: [...a.pasos, ...pasos] };
  }
  function uno(sc) {
    const m = (k, nom) => lee(sc, k, nom, { min: 0 });
    const anc = m('anc', 'el activo no corriente'), ex = m('ex', 'las existencias'), re = m('re', 'el realizable'), di = m('di', 'el disponible');
    const pn = lee(sc, 'pn', 'el patrimonio neto'), pnc = m('pnc', 'el pasivo no corriente'), pc = m('pc', 'el pasivo corriente');
    const ac = ex + re + di, at = anc + ac, pt = pnc + pc;
    if (at <= 0) throw new Error('El activo total tiene que ser mayor que 0');
    if (Math.abs(at - (pn + pt)) > 0.005 * at) throw new Error(`El balance no cuadra: el activo suma ${f(at, 10)} € y el patrimonio neto más el pasivo, ${f(pn + pt, 10)} €`);
    if (pc <= 0) throw new Error('Pon el pasivo corriente: hace falta para los ratios de liquidez');
    const ventas = lee(sc, 'ventas', 'las ventas', { min: 0, minEx: true }), baii = lee(sc, 'baii', 'el BAII'), gf = lee(sc, 'gf', 'los gastos financieros', { min: 0 });
    const t = lee(sc, 't', 'el tipo del impuesto', { min: 0, max: 100, def: 25 }) / 100;
    const bai = baii - gf, imp = bai > 0 ? bai * t : 0, bn = bai - imp;
    const fm = ac - pc, pasos = [];
    pasos.push({ t: 'Masas patrimoniales', html: `Activo corriente, existencias más realizable más disponible: $AC = ${e(ex)} + ${e(re)} + ${e(di)} = ${e(ac)}$ €. Activo total: $AT = ${e(anc)} + ${e(ac)} = ${e(at)}$ €, igual que patrimonio neto más pasivo, $${e(pn)} + ${e(pnc)} + ${e(pc)}$. Pasivo exigible: $PT = ${e(pnc)} + ${e(pc)} = ${e(pt)}$ €.` });
    pasos.push({ t: 'Fondo de maniobra', html: `$FM = AC − PC = ${e(ac)} − ${e(pc)} = ${e(fm)}$ €. ${Math.abs(fm) < 0.005 ? 'Es cero: el activo corriente cubre justo las deudas a corto, sin ningún margen; cualquier retraso en un cobro deja a la empresa sin poder pagar.' : fm > 0 ? 'Es positivo: parte del activo corriente está financiada con recursos a largo plazo, y la empresa puede pagar sus deudas a corto con lo que va a cobrar y vender.' : 'Es negativo: el activo corriente no llega para pagar las deudas a corto. Hay riesgo de no poder atender los pagos (suspensión de pagos) si no se renegocia la deuda o entran fondos a largo plazo.'}` });
    const R = [];
    const ratio = (grupo, nombre, formula, val, rango, txt) => { const [estado, dice] = valora(val, rango, ...txt); R.push({ grupo, nombre, formula, val, rango, estado, dice }); };
    ratio('Liquidez', 'Liquidez general', 'AC/PC', ac / pc, [1.5, 2], ['puede tener problemas para pagar a corto plazo', 'tiene activo corriente ocioso, que podría rendir más', 'puede pagar sus deudas a corto con holgura']);
    ratio('Liquidez', 'Tesorería (prueba ácida)', '(realizable + disponible)/PC', (re + di) / pc, [0.75, 1], ['depende de vender las existencias para pagar', 'tiene más cobros y dinero de los que necesita', 'paga lo que debe a corto sin vender existencias']);
    ratio('Liquidez', 'Disponibilidad', 'disponible/PC', di / pc, [0.1, 0.3], ['tiene poco dinero en caja y bancos para los pagos inmediatos', 'tiene demasiado dinero parado', 'tiene el dinero justo para los pagos inmediatos']);
    ratio('Solvencia', 'Garantía (solvencia total)', 'AT/PT', pt > 0 ? at / pt : Infinity, [1.5, 2.5], ['sus bienes cubren con poco margen todas sus deudas', 'tiene muchas garantías; podría endeudarse más', 'sus bienes cubren de sobra todas sus deudas']);
    ratio('Endeudamiento', 'Endeudamiento', 'PT/(PN + PT)', pt / at, [0.4, 0.6], ['se financia sobre todo con fondos propios', 'depende demasiado de la deuda', 'reparte bien fondos propios y deuda']);
    ratio('Endeudamiento', 'Autonomía', 'PN/PT', pt > 0 ? pn / pt : Infinity, [0.7, 1.5], ['depende mucho de los acreedores', 'es muy independiente de los acreedores', 'tiene una independencia financiera razonable']);
    ratio('Endeudamiento', 'Calidad de la deuda', 'PC/PT', pt > 0 ? pc / pt : 0, [null, 0.5], ['', 'la mayor parte de la deuda vence a corto plazo, la más exigente', 'la mayor parte de la deuda es a largo plazo']);
    pasos.push({ t: 'Liquidez', html: R.filter((x) => x.grupo === 'Liquidez').map((x) => `${x.nombre}: $${x.formula} = ${r3(x.val)}$ (recomendado de ${r3(x.rango[0])} a ${r3(x.rango[1])}): ${x.dice}.`).join('<br>') });
    pasos.push({ t: 'Solvencia y endeudamiento', html: R.filter((x) => x.grupo !== 'Liquidez').map((x) => `${x.nombre}: $${x.formula} = ${isFinite(x.val) ? r3(x.val) : '∞'}$${x.rango[0] !== null ? ` (recomendado de ${r3(x.rango[0])} a ${r3(x.rango[1])})` : ''}: ${x.dice}.`).join('<br>') });
    const roa = baii / at, margen = baii / ventas, rot = ventas / at, roe = pn > 0 ? bn / pn : null, i = pt > 0 ? gf / pt : 0;
    pasos.push({ t: 'Rentabilidad económica (ROA)', html: `Lo que rinden los activos, se financien como se financien: $ROA = {"BAII"}/{AT} = ${e(baii)}/${e(at)} = ${f(roa, 6)}$, un <b>${tp(roa)}</b>.<br>Se descompone en margen por rotación: $"BAII"/"ventas" · {"ventas"}/{AT} = ${f(margen, 6)} · ${f(rot, 6)}$: gana ${tp(margen)} de cada euro vendido y vende ${f(rot, 4)} veces su activo al año.` });
    pasos.push({ t: 'Resultado del ejercicio', html: `$"BAI" = "BAII" − "gastos financieros" = ${e(baii)} − ${e(gf)} = ${e(bai)}$ €. ${bai > 0 ? `Impuesto del ${f(100 * t)} %: $${e(bai)} · ${f(t, 4)} = ${e(imp)}$ €, y el resultado neto es $${e(bai)} − ${e(imp)} = ${e(bn)}$ €.` : 'Con pérdidas no se paga impuesto: el resultado neto es el mismo BAI.'}` });
    if (roe !== null) pasos.push({ t: 'Rentabilidad financiera (ROE)', html: `Lo que rinde el dinero de los socios: $ROE = {"resultado neto"}/{PN} = ${e(bn)}/${e(pn)} = ${f(roe, 6)}$, un <b>${tp(roe)}</b>.` });
    if (roe !== null && bai > 0 && pt > 0) {
      const ap = roa > i;
      pasos.push({ t: 'Apalancamiento financiero', html: `La deuda cuesta $i = {"gastos financieros"}/{PT} = ${e(gf)}/${e(pt)} = ${tp(i)}$. Entonces<br>$ROE = [ROA + (ROA − i) · PT/PN] · (1 − t)$<br>$ROE = [${f(roa, 6)} + (${f(roa, 6)} − ${f(i, 6)}) · ${f(pt / pn, 6)}] · ${f(1 - t, 4)} = ${f(roe, 6)}$.<br>${ap ? `Como el activo rinde más (${tp(roa)}) de lo que cuesta la deuda (${tp(i)}), endeudarse aumenta la rentabilidad de los socios: apalancamiento positivo.` : `La deuda cuesta más (${tp(i)}) de lo que rinde el activo (${tp(roa)}): cada euro prestado reduce la rentabilidad de los socios (apalancamiento negativo).`}` });
    }
    return { anc, ex, re, di, ac, at, pn, pnc, pc, pt, fm, ventas, baii, gf, t, bai, imp, bn, ratios: R, roa, margen, rot, roe, i, pasos };
  }

  const ejemplos = [
    { clave: 'equilibrada', nombre: 'Una empresa equilibrada', sc: { anc: '400000', ex: '80000', re: '70000', di: '50000', pn: '300000', pnc: '150000', pc: '150000', ventas: '900000', baii: '72000', gf: '9000', t: '25' } },
    { clave: 'apalancada', nombre: 'Mucha deuda que rinde: apalancamiento positivo', sc: { anc: '700000', ex: '100000', re: '120000', di: '80000', pn: '200000', pnc: '500000', pc: '300000', ventas: '1500000', baii: '150000', gf: '40000', t: '25' } },
    { clave: 'suspension', nombre: 'Fondo de maniobra negativo y pérdidas', sc: { anc: '500000', ex: '40000', re: '30000', di: '10000', pn: '200000', pnc: '180000', pc: '200000', ventas: '400000', baii: '20000', gf: '24000', t: '25' } },
    { clave: 'comparar', nombre: 'Comparar dos años: la deuda sube y el ROE también', sc: { comparar: 'si', anc: '400000', ex: '80000', re: '70000', di: '50000', pn: '300000', pnc: '150000', pc: '150000', ventas: '900000', baii: '72000', gf: '9000', t: '25', anc2: '500000', ex2: '90000', re2: '80000', di2: '30000', pn2: '300000', pnc2: '300000', pc2: '100000', ventas2: '1000000', baii2: '90000', gf2: '15000', t2: '25' } },
    { clave: 'tienda', nombre: 'Una tienda pequeña con mucha caja', sc: { anc: '60000', ex: '30000', re: '5000', di: '15000', pn: '70000', pnc: '20000', pc: '20000', ventas: '250000', baii: '25000', gf: '1000', t: '25' } },
  ];

  return { resolver, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = Ratios;
