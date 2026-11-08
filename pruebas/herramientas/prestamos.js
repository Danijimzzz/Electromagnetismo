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
    // amortización anticipada: deuda tras la cuota 60 de la hipoteca = saldo teórico − 20.000; reduciendo el plazo se mantiene la cuota y el préstamo acaba antes
    { const i = 0.0025, a0 = 711.3169708, saldo60 = 150000 * 1.0025 ** 60 - a0 * (1.0025 ** 60 - 1) / i;
      const ac = ej('amortiza-cuota'); cerca(ac.filas[59].pend, saldo60 - 20000, 0.01, 'deuda tras amortizar 20.000 €'); cerca(ac.filas.length, 300, 0, 'mismo plazo al reducir la cuota'); cerca(ac.filas[100].cuota, (saldo60 - 20000) * i / (1 - 1.0025 ** -240), 0.01, 'nueva cuota');
      cerca(ac.filas[299].pend, 0, 1e-6, 'deuda final tras amortizar'); cerca(ac.filas.reduce((x, r) => x + r.A + r.x, 0), 150000, 1e-6, 'se devuelve todo el capital');
      const ap = ej('amortiza-plazo'); cerca(ap.filas[100].cuota, a0, 1e-6, 'misma cuota al reducir el plazo'); if (!(ap.filas.length < 300 && ap.filas.length > 240)) mal(`${N}: reducir el plazo debe acortarlo`);
      if (!(ap.ahorro > ac.ahorro && ac.ahorro > 0)) mal(`${N}: reducir el plazo ahorra más intereses que reducir la cuota`); cerca(ap.interesesBase, ej('hipoteca').intereses, 1e-6, 'intereses sin amortizar'); cerca(ap.filas[ap.filas.length - 1].pend, 0, 1e-6, 'deuda final reduciendo el plazo');
      // carencia de 12 cuotas: solo intereses (375 €) y luego cuota sobre 288 cuotas
      const ca = ej('carencia'); cerca(ca.filas[0].cuota, 375, 1e-9, 'cuota solo de intereses en carencia'); cerca(ca.filas[11].pend, 150000, 1e-9, 'la deuda no baja en carencia'); cerca(ca.cuota, 150000 * i / (1 - 1.0025 ** -288), 1e-6, 'cuota tras la carencia'); cerca(ca.filas[299].pend, 0, 1e-6, 'deuda final con carencia'); }
    error({ sistema: 'frances', c: '1000', i: '5', anos: '1', m: '12', car: '12' }, 'carencia igual al plazo'); error({ sistema: 'americano', c: '1000', i: '5', anos: '2', m: '12', ext: '100', pe: '3' }, 'amortización anticipada en el americano'); error({ sistema: 'frances', c: '1000', i: '5', anos: '2', m: '12', ext: '100', pe: '24' }, 'amortizar en la última cuota'); error({ sistema: 'frances', c: '1000', i: '5', anos: '2', m: '12', ext: '100', pe: '' }, 'sin la cuota de la amortización');
    error({ sistema: 'frances', c: '1000', i: '5', anos: '1,3', m: '12' }, 'un plazo que no es un número entero de meses');
    error({ sistema: 'frances', c: '', i: '5', anos: '1', m: '12' }, 'sin capital');
    error({ sistema: 'frances', c: '1000', i: '5', anos: '100', m: '12' }, 'más de 600 cuotas');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, tres sistemas, TAE con comisión y errores`);
  }
  return Com.navegador({ publico, carpeta: 'prestamos', nombre: N, app: 'PrestamosApp', C, pagina, mal, malo: { k: 'anos', v: '0' } });
};
