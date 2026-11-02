/* Comprobación de Balance y cuenta de resultados: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo balance). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Balance y cuenta de resultados';
  const C = require(path.join(fuente, 'balance', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano (pyme): EBITDA = 500−200−120−50 = 130.000; explotación 100.000; financiero −10.000; BAI 90.000; impuesto 22.500; neto 67.500
    // activo = 350.000 + 170.000 = 520.000; PN = 150.000 + 80.000 + 67.500 = 297.500; PC = 102.500; FM = 67.500
    const q = ej('taller');
    cerca(q.ebitda, 130000, 1e-9, 'EBITDA'); cerca(q.rexp, 100000, 1e-9, 'resultado de explotación'); cerca(q.rfin, -10000, 1e-9, 'resultado financiero');
    cerca(q.bai, 90000, 1e-9, 'BAI'); cerca(q.imp, 22500, 1e-9, 'impuesto'); cerca(q.bn, 67500, 1e-9, 'resultado del ejercicio');
    cerca(q.at, 520000, 1e-9, 'activo total'); cerca(q.pn, 297500, 1e-9, 'patrimonio neto'); cerca(q.pc, 102500, 1e-9, 'pasivo corriente'); cerca(q.fm, 67500, 1e-9, 'fondo de maniobra');
    // pérdidas: BAI = −15.000 − 18.000 = −33.000, sin impuesto; PN = 200.000 + 20.000 − 33.000 = 187.000
    const p = ej('perdidas'); cerca(p.bai, -33000, 1e-9, 'BAI negativo'); cerca(p.imp, 0, 1e-9, 'sin impuesto con pérdidas'); cerca(p.pn, 187000, 1e-9, 'PN con pérdidas'); cerca(p.fm, 60000 - 53000, 1e-9, 'FM de las pérdidas');
    // comercio: BAI 115.000, impuesto 28.750, neto 86.250; FM = 490.000 − 243.750
    const c = ej('comercio'); cerca(c.bn, 86250, 1e-9, 'beneficio del comercio'); cerca(c.fm, 246250, 1e-9, 'FM del comercio');
    // empresa nueva: EBITDA −5.000, explotación −13.000, neto −15.000
    const s = ej('startup'); cerca(s.ebitda, -5000, 1e-9, 'EBITDA negativo'); cerca(s.rexp, -13000, 1e-9, 'explotación negativa'); cerca(s.bn, -15000, 1e-9, 'pérdida de la empresa nueva');
    error({ ...C.ejemplos[0].sc, cap: '100' }, 'balance que no cuadra');
    error({ ...C.ejemplos[0].sc, ventas: '' }, 'sin ventas');
    error({ ...C.ejemplos[0].sc, t: '120' }, 'impuesto superior al 100 %');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (EBITDA, BAI, impuesto, balance, fondo de maniobra) y errores`);
  }
  return Com.navegador({ publico, carpeta: 'balance', nombre: N, app: 'BalanceApp', C, pagina, mal, malo: { k: 'cap', v: '5' } });
};
