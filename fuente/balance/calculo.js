/* =====================================================================
   Balance y cuenta de resultados (sin DOM): con las partidas de la cuenta
   de pérdidas y ganancias (ventas, aprovisionamientos, personal, otros
   gastos, amortización, ingresos y gastos financieros e impuesto) saca el
   EBITDA, el resultado de explotación, el financiero, el BAI y el resultado
   del ejercicio; y con las del balance (activo no corriente y corriente,
   capital y reservas, pasivo no corriente y corriente) arma el balance de
   situación, que incluye ese resultado en el patrimonio neto, comprueba que
   cuadra y da el fondo de maniobra. Formato de economia/comun.js; interfaz
   en balance/app.js.
     resolver(sc)  { ventas, aprov, pers, otros, amort, ingf, gf, t, mat, inti, ifl,
                     ex, deu, teso, cap, res, dlp, prov, dcp } → { ebitda, rexp, rfin, bai, imp, bn,
                     anc, ac, at, pn, pnc, pc, pt, fm, pasos, … }
   ===================================================================== */
const Balance = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal) y sin decimales si son ,00
  
  const eu = (x) => { const s = (Math.abs(x) < 0.005 ? 0 : x).toFixed(2); return s.endsWith('.00') ? s.slice(0, -3).replace('-', '−') : s.replace('.', ',').replace('-', '−'); };

  function resolver(sc) {
    const m = (k, nom) => lee(sc, k, nom, { min: 0 });
    const ventas = lee(sc, 'ventas', 'las ventas', { min: 0, minEx: true }), aprov = m('aprov', 'los aprovisionamientos'), pers = m('pers', 'los gastos de personal');
    const otros = m('otros', 'los otros gastos de explotación'), amort = m('amort', 'la amortización');
    const ingf = m('ingf', 'los ingresos financieros'), gf = m('gf', 'los gastos financieros'), t = lee(sc, 't', 'el tipo del impuesto', { min: 0, max: 100, def: 25 }) / 100;
    const mat = m('mat', 'el inmovilizado material'), inti = m('inti', 'el inmovilizado intangible'), ifl = m('ifl', 'las inversiones financieras a largo plazo');
    const ex = m('ex', 'las existencias'), deu = m('deu', 'los deudores'), teso = m('teso', 'la tesorería');
    const cap = m('cap', 'el capital'), res = lee(sc, 'res', 'las reservas', { def: 0 }), dlp = m('dlp', 'las deudas a largo plazo');
    const prov = m('prov', 'los proveedores'), dcp = m('dcp', 'las otras deudas a corto plazo');
    // cuenta de pérdidas y ganancias
    const ebitda = ventas - aprov - pers - otros, rexp = ebitda - amort, rfin = ingf - gf, bai = rexp + rfin;
    const imp = bai > 0 ? bai * t : 0, bn = bai - imp;
    // balance
    const anc = mat + inti + ifl, ac = ex + deu + teso, at = anc + ac;
    const pn = cap + res + bn, pnc = dlp, pc = prov + dcp, pt = pnc + pc;
    const dif = at - (pn + pt);
    if (Math.abs(dif) > 0.005) throw new Error(`El balance no cuadra: el activo suma ${f(at, 10)} € y el patrimonio neto (con el resultado del ejercicio, ${f(bn, 10)} €) más el pasivo, ${f(pn + pt, 10)} €. Faltan ${f(Math.abs(dif), 10)} € ${dif > 0 ? 'en el patrimonio neto o el pasivo' : 'en el activo'}`);
    const fm = ac - pc, pasos = [];
    pasos.push({ t: 'Resultado de explotación', html: `Primero el <b>EBITDA</b>, lo que genera el negocio antes de amortizar: ventas menos aprovisionamientos, personal y otros gastos.<br>$"EBITDA" = ${eu(ventas)} − ${eu(aprov)} − ${eu(pers)} − ${eu(otros)} = ${eu(ebitda)}$ €.<br>Se resta la amortización, que es el gasto por el desgaste del inmovilizado en el año:<br>$"Resultado de explotación" = ${eu(ebitda)} − ${eu(amort)} = ${eu(rexp)}$ €${rexp < 0 ? ': el negocio, por sí solo, da pérdidas' : ''}.` });
    pasos.push({ t: 'Resultado financiero y BAI', html: `$"Resultado financiero" = "ingresos financieros" − "gastos financieros" = ${eu(ingf)} − ${eu(gf)} = ${eu(rfin)}$ €.<br>El resultado antes de impuestos es $"BAI" = ${eu(rexp)} + (${eu(rfin)}) = ${eu(bai)}$ €.` });
    pasos.push({ t: 'Impuesto y resultado del ejercicio', html: bai > 0 ? `Impuesto sobre beneficios del ${f(100 * t)} %: $${eu(bai)} · ${f(t, 4)} = ${eu(imp)}$ €.<br>$"Resultado del ejercicio" = ${eu(bai)} − ${eu(imp)} = ${eu(bn)}$ €. Es un beneficio.` : `Con un BAI ${bai === 0 ? 'de cero' : 'negativo'} no hay impuesto que pagar.<br>$"Resultado del ejercicio" = ${eu(bai)}$ €${bai < 0 ? ': son pérdidas, que restan al patrimonio neto' : ''}.` });
    pasos.push({ t: 'El activo', html: `<b>No corriente</b> (más de un año): $${eu(mat)} + ${eu(inti)} + ${eu(ifl)} = ${eu(anc)}$ €.<br><b>Corriente</b> (menos de un año): $${eu(ex)} + ${eu(deu)} + ${eu(teso)} = ${eu(ac)}$ €.<br>$"Activo total" = ${eu(anc)} + ${eu(ac)} = ${eu(at)}$ €.` });
    pasos.push({ t: 'Patrimonio neto y pasivo', html: `El resultado del ejercicio entra en el patrimonio neto: $PN = ${eu(cap)} + (${eu(res)}) + (${eu(bn)}) = ${eu(pn)}$ €.<br>Pasivo no corriente: $${eu(pnc)}$ €. Pasivo corriente: $${eu(prov)} + ${eu(dcp)} = ${eu(pc)}$ €.<br>$PN + "pasivo" = ${eu(pn)} + ${eu(pnc)} + ${eu(pc)} = ${eu(pn + pt)}$ €.` });
    pasos.push({ t: 'El balance cuadra', html: `$"Activo" = PN + "pasivo"$: $${eu(at)} = ${eu(pn + pt)}$ €. Toda la inversión de la empresa está financiada, bien por los socios, bien por deudas.` });
    pasos.push({ t: 'Fondo de maniobra', html: `$FM = AC − PC = ${eu(ac)} − ${eu(pc)} = ${eu(fm)}$ €. ${Math.abs(fm) < 0.005 ? 'Es cero: el activo corriente cubre justo las deudas a corto.' : fm > 0 ? 'Es positivo: lo que va a cobrar y vender a corto plazo cubre sus deudas a corto, con margen.' : 'Es negativo: el activo corriente no llega para pagar las deudas a corto; riesgo de tensiones de tesorería.'}` });
    const margen = ventas > 0 ? bn / ventas : 0;
    return { ventas, aprov, pers, otros, amort, ingf, gf, t, mat, inti, ifl, ex, deu, teso, cap, res, dlp, prov, dcp, ebitda, rexp, rfin, bai, imp, bn, margen, anc, ac, at, pn, pnc, pc, pt, fm, pasos };
  }

  const ejemplos = [
    { clave: 'taller', nombre: 'Una pyme con beneficios', sc: { ventas: '500000', aprov: '200000', pers: '120000', otros: '50000', amort: '30000', ingf: '2000', gf: '12000', t: '25', mat: '300000', inti: '20000', ifl: '30000', ex: '60000', deu: '70000', teso: '40000', cap: '150000', res: '80000', dlp: '120000', prov: '60000', dcp: '42500' } },
    { clave: 'perdidas', nombre: 'Pérdidas: la deuda se come el resultado', sc: { ventas: '300000', aprov: '140000', pers: '110000', otros: '40000', amort: '25000', ingf: '0', gf: '18000', t: '25', mat: '280000', inti: '0', ifl: '0', ex: '30000', deu: '25000', teso: '5000', cap: '200000', res: '20000', dlp: '100000', prov: '38000', dcp: '15000' } },
    { clave: 'comercio', nombre: 'Un comercio con mucho circulante', sc: { ventas: '1200000', aprov: '780000', pers: '190000', otros: '90000', amort: '20000', ingf: '3000', gf: '8000', t: '25', mat: '150000', inti: '10000', ifl: '0', ex: '220000', deu: '180000', teso: '90000', cap: '100000', res: '140000', dlp: '80000', prov: '200000', dcp: '43750' } },
    { clave: 'startup', nombre: 'Una empresa nueva sin existencias', sc: { ventas: '80000', aprov: '5000', pers: '60000', otros: '20000', amort: '8000', ingf: '0', gf: '2000', t: '25', mat: '40000', inti: '25000', ifl: '0', ex: '0', deu: '10000', teso: '35000', cap: '90000', res: '0', dlp: '20000', prov: '8000', dcp: '7000' } },
  ];

  return { resolver, ejemplos, eu };
})();
if (typeof module !== 'undefined') module.exports = Balance;
