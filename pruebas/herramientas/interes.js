/* Comprobación de Interés simple y compuesto: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo interes). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Interés';
  const C = require(path.join(fuente, 'interes', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: 10.000·1,03⁵ = 11.592,74; 5.000·1,002²⁴ = 5.245,60; 2.000·(1 + 0,04·0,75) = 2.060
    cerca(ej('deposito').cn, 11592.74, 0.005, 'depósito a 5 años'); cerca(ej('mensual').cn, 5245.60, 0.005, 'depósito mensual'); cerca(ej('simple').cn, 2060, 1e-9, 'interés simple');
    cerca(ej('actual').c0, 13511.28, 0.005, 'capital inicial'); cerca(ej('duplicar').t, Math.log(2) / Math.log(1.05), 1e-9, 'tiempo para duplicar');
    cerca(ej('tipo').i, 1.25 ** 0.25 - 1, 1e-12, 'tipo de 8.000 a 10.000 en 4 años'); cerca(ej('tae').tae, 1.005 ** 12 - 1, 1e-12, 'TAE de un 6 % mensual');
    cerca(C.resolver({ modo: 'tae', conocido: 'tae', tae: '6,1678', m: '12' }).tin, 0.06, 1e-6, 'TIN a partir de la TAE');
    cerca(C.resolver({ modo: 'tiempo', regimen: 'simple', c0: '100', cn: '150', i: '10' }).t, 5, 1e-12, 'tiempo en simple');
    // 10.000·(1 + 0,02·90/365); 1.000·e^0,5; TAE continua = e^0,06 − 1; tiempo en días con base 360
    cerca(ej('dias').cn, 10000 * (1 + 0.02 * 90 / 365), 1e-9, 'depósito a 90 días');
    cerca(C.resolver({ modo: 'final', regimen: 'simple', c0: '10000', i: '2', t: '90', tu: 'd', base: '360', m: '1' }).cn, 10000 * (1 + 0.02 * 0.25), 1e-9, 'año comercial de 360 días');
    cerca(C.resolver({ modo: 'final', regimen: 'compuesto', c0: '1000', i: '6', t: '24', tu: 'm', m: '1' }).cn, 1000 * 1.06 ** 2, 1e-9, 'tiempo en meses');
    cerca(ej('continua').cn, 1000 * Math.exp(0.5), 1e-9, 'capitalización continua'); cerca(C.resolver({ modo: 'tae', conocido: 'tin', i: '6', m: '0' }).tae, Math.exp(0.06) - 1, 1e-12, 'TAE continua');
    cerca(C.resolver({ modo: 'tiempo', regimen: 'compuesto', c0: '1', cn: '2', i: '5', m: '0' }).t, Math.log(2) / 0.05, 1e-12, 'tiempo en continua');
    cerca(C.resolver({ modo: 'tipo', regimen: 'compuesto', c0: '1', cn: '2', t: '10', m: '0' }).i, Math.log(2) / 10, 1e-12, 'tipo en continua');
    error({ modo: 'final', regimen: 'compuesto', c0: '', i: '3', t: '5', m: '1' }, 'sin capital');
    error({ modo: 'tipo', regimen: 'compuesto', c0: '100', cn: '50', t: '2', m: '1' }, 'un capital final menor');
    error({ modo: 'final', regimen: 'compuesto', c0: '100', i: 'abc', t: '2', m: '1' }, 'un tipo que no es un número');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, TIN y TAE, simple y compuesto, y errores`);
  }
  return Com.navegador({ publico, carpeta: 'interes', nombre: N, app: 'InteresApp', C, pagina, mal, malo: { k: 'c0', v: '-5' } });
};
