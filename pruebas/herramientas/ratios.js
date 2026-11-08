/* Comprobación de Ratios financieros: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo ratios). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Ratios financieros';
  const C = require(path.join(fuente, 'ratios', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: AC = 200.000, FM = 50.000, liquidez 200/150, ácida 120/150, ROA = 72/600, BN = 63.000·0,75 = 47.250, ROE = 47.250/300.000
    const q = ej('equilibrada'), v = (n) => q.ratios.find((x) => x.nombre === n).val;
    cerca(q.fm, 50000, 1e-9, 'fondo de maniobra'); cerca(v('Liquidez general'), 4 / 3, 1e-12, 'liquidez'); cerca(v('Tesorería (prueba ácida)'), 0.8, 1e-12, 'prueba ácida');
    cerca(v('Garantía (solvencia total)'), 2, 1e-12, 'garantía'); cerca(v('Endeudamiento'), 0.5, 1e-12, 'endeudamiento');
    cerca(q.roa, 0.12, 1e-12, 'ROA'); cerca(q.roe, 0.1575, 1e-12, 'ROE'); cerca(q.margen * q.rot, q.roa, 1e-12, 'margen · rotación');
    // apalancamiento: [0,15 + (0,15 − 0,05)·4]·0,75 = 0,4125
    const a = ej('apalancada'); cerca(a.roe, 0.4125, 1e-12, 'ROE apalancada'); cerca(a.i, 0.05, 1e-12, 'coste de la deuda');
    const s = ej('suspension'); cerca(s.fm, -120000, 1e-9, 'fondo de maniobra negativo'); cerca(s.bn, -4000, 1e-9, 'pérdidas sin impuesto');
    if (q.ratios[0].estado !== 'bajo' || ej('tienda').ratios[0].estado !== 'alto') mal(`${N}: la valoración de la liquidez no sale bien`);
    // comparar: A es la equilibrada; B: AC = 200.000, FM = 100.000, ROA = 90/1.000·… = 90.000/1.000.000 sobre un activo de 700.000 + …
    { const c = ej('comparar'), eq = ej('equilibrada'); cerca(c.roa, eq.roa, 1e-12, 'la parte A de la comparación coincide con la empresa sola');
      cerca(c.b.at, 700000, 1e-9, 'activo de B'); cerca(c.b.fm, 200000 - 100000, 1e-9, 'fondo de maniobra de B'); cerca(c.b.roa, 90000 / 700000, 1e-12, 'ROA de B');
      cerca(c.b.roe, (90000 - 15000) * 0.75 / 300000, 1e-12, 'ROE de B'); if (!c.pasos.some((x) => x.t === 'Comparación de A y B')) mal(`${N}: falta el paso de comparación`);
      error({ ...C.ejemplos.find((x) => x.clave === 'comparar').sc, pn2: '5' }, 'balance B que no cuadra'); }
    error({ ...C.ejemplos[0].sc, pn: '100' }, 'balance que no cuadra');
    error({ ...C.ejemplos[0].sc, pc: '0', pnc: '300000' }, 'sin pasivo corriente');
    error({ ...C.ejemplos[0].sc, ventas: '' }, 'sin ventas');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, fondo de maniobra, ratios, ROA, ROE, apalancamiento y errores`);
  }
  return Com.navegador({ publico, carpeta: 'ratios', nombre: N, app: 'RatiosApp', C, pagina, mal, malo: { k: 'pn', v: '5' } });
};
