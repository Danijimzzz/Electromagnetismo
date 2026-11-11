/* Comprobación de Amortización del inmovilizado: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo amortizacion-inmovilizado). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Amortización del inmovilizado';
  const C = require(path.join(fuente, 'amortizacion-inmovilizado', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // cuotas calculadas a mano (base 45.000 € en 5 años; suma de dígitos 15; degresivo al 40 %; furgoneta a 0,14 €/km)
    const ESP = { lineal: [9000, 9000, 9000, 9000, 9000], digitos: [15000, 12000, 9000, 6000, 3000], degresivo: [20000, 12000, 7200, 4320, 1480], furgoneta: [7000, 8400, 5600, 4200, 2800], ordenador: [400, 400, 400] };
    for (const [k, v] of Object.entries(ESP)) { const r = ej(k), c = r.filas.map((x) => x.c); if (c.length !== v.length || c.some((x, i) => Math.abs(x - v[i]) > 1e-6)) mal(`${N} · ${k}: cuotas ${c.map((x) => x.toFixed(2))}, se esperaban ${v}`); }
    if (Math.abs(ej('degresivo').filas[4].vnc - 5000) > 1e-6) mal(`${N}: el degresivo no acaba en el valor residual`);
    // venta a mano: lineal 9.000/año → al final del año 3, acumulada 27.000 y VNC 23.000; por 20.000 € → pérdida de 3.000 (671). Degresivo t = 0,4: 20.000 + 12.000 = 32.000, VNC 18.000; por 35.000 → beneficio de 17.000 (771)
    const vp = ej('venta-perdida').venta, vb = ej('venta-beneficio').venta;
    cerca(vp.ac, 27000, 1e-6, 'amortización acumulada a la venta'); cerca(vp.vnc, 23000, 1e-6, 'VNC a la venta'); cerca(vp.res, -3000, 1e-6, 'pérdida de la venta'); if (vp.tipo !== 'pérdida') mal(N + ': la venta del año 3 debería dar pérdida');
    cerca(vb.ac, 32000, 1e-6, 'acumulada degresivo'); cerca(vb.res, 17000, 1e-6, 'beneficio de la venta'); if (!/\(771\)/.test(ej('venta-beneficio').pasos.map((p) => p.html).join(' ')) || !/\(671\)/.test(ej('venta-perdida').pasos.map((p) => p.html).join(' '))) mal(N + ': el asiento de la venta debe usar 771 (beneficio) o 671 (pérdida)');
    cerca(C.resolver({ metodo: 'lineal', v0: '1000', vr: '0', n: '2', tventa: '5', pventa: '100' }).venta.vnc, 0, 1e-9, 'venta de un bien ya amortizado');
    error({ metodo: 'lineal', v0: '1000', vr: '0', n: '2', tventa: '1' }, 'venta sin precio'); error({ metodo: 'lineal', v0: '1000', vr: '0', n: '2', tventa: '0', pventa: '1' }, 'venta en el año 0');
    error({ metodo: 'lineal', v0: '1000', vr: '1500', n: '5' }, 'un valor residual mayor que el precio');
    error({ metodo: 'unidades', v0: '1000', vr: '0', total: '100', unidades: '60 50' }, 'más unidades que las previstas');
    error({ metodo: 'degresivo', v0: '1000', vr: '0', n: '2', coef: '2' }, 'un porcentaje del 100 %');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano por los cuatro métodos y errores`);
  }
  return Com.navegador({ publico, carpeta: 'amortizacion-inmovilizado', nombre: N, app: 'AmortizacionApp', C, pagina, mal, malo: { k: 'vr', v: '90000' } });
};
