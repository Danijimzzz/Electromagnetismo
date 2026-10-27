/* Comprobación de Préstamos y amortización: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo prestamos). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Préstamos';
  const C = require(path.join(fuente, 'prestamos', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: hipoteca 150.000·0,0025/(1 − 1,0025⁻³⁰⁰) = 711,32 €; francés anual 10.000·0,08/(1 − 1,08⁻⁴) = 3.019,21 €
    const h = ej('hipoteca'); cerca(h.cuota, 711.32, 0.005, 'cuota de la hipoteca'); cerca(h.filas[0].I, 375, 1e-9, 'intereses del primer mes'); cerca(h.filas[299].pend, 0, 1e-9, 'deuda al final');
    cerca(h.intereses, 711.3169708 * 300 - 150000, 0.01, 'intereses de la hipoteca');
    const fr = ej('frances'); cerca(fr.cuota, 3019.21, 0.005, 'cuota anual'); cerca(fr.filas[1].I, 7780.79 * 0.08, 0.005, 'intereses del segundo año');
    const l = ej('lineal'); cerca(l.filas[0].cuota, 3300, 1e-9, 'primera cuota lineal'); cerca(l.filas[3].cuota, 2700, 1e-9, 'última cuota lineal'); cerca(l.intereses, 2000, 1e-9, 'intereses lineal');
    const a = ej('americano'); cerca(a.filas[3].cuota, 10800, 1e-9, 'última cuota americana'); cerca(a.intereses, 3200, 1e-9, 'intereses americano');
    // TAE sin comisión = (1 + i)ᵐ − 1; con comisión del 1 %, la tasa r cumple 14.850 = ∑ 289,99·(1 + r)⁻ᵏ
    cerca(ej('hipoteca').tae, 1.0025 ** 12 - 1, 1e-12, 'TAE de la hipoteca');
    const co = ej('coche'); const va = Array.from({ length: 60 }, (_, k) => co.cuota * (1 + ((1 + co.tae) ** (1 / 12) - 1)) ** -(k + 1)).reduce((x, y) => x + y);
    cerca(va, 14850, 1e-4, 'la TAE con comisión iguala lo recibido');
    error({ sistema: 'frances', c: '1000', i: '5', anos: '1,3', m: '12' }, 'un plazo que no es un número entero de meses');
    error({ sistema: 'frances', c: '', i: '5', anos: '1', m: '12' }, 'sin capital');
    error({ sistema: 'frances', c: '1000', i: '5', anos: '100', m: '12' }, 'más de 600 cuotas');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, tres sistemas, TAE con comisión y errores`);
  }
  return Com.navegador({ publico, carpeta: 'prestamos', nombre: N, app: 'PrestamosApp', C, pagina, mal, malo: { k: 'anos', v: '0' } });
};
