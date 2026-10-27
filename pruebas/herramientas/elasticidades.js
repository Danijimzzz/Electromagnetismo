/* Comprobación de Elasticidades: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo elasticidades). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Elasticidades';
  const C = require(path.join(fuente, 'elasticidades', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: cine −20 %/25 % = −0,8; de arco (−100/450)/(2/9) = −1 (unitaria, el ingreso no cambia)
    const c = ej('cine'); cerca(c.e, -0.8, 1e-12, 'cine sobre el inicial'); cerca(c.ea, -1, 1e-12, 'cine de arco'); cerca(c.it1 - c.it0, 0, 1e-9, 'ingreso del cine');
    cerca(ej('gasolina').ea, (-50 / 975) / (0.3 / 1.65), 1e-12, 'gasolina de arco');
    cerca(ej('lujo').e, 5, 1e-12, 'renta del lujo'); cerca(ej('inferior').e, -1, 1e-12, 'renta del inferior'); cerca(ej('cafe-te').e, 0.75, 1e-12, 'cruzada');
    // lineal: Q = 100 − 60 = 40; ε = −2·30/40 = −1,5; ingreso máximo en P = 25
    const l = ej('lineal'); cerca(l.e, -1.5, 1e-12, 'lineal'); cerca(l.pm, 25, 1e-12, 'precio de ingreso máximo'); cerca(l.itMax, 1250, 1e-9, 'ingreso máximo');
    if (ej('inferior').clase !== 'bien inferior' || ej('cafe-te').clase !== 'bienes sustitutivos' || ej('gasolina').clase !== 'inelástica') mal(`${N}: las clasificaciones no salen bien`);
    error({ tipo: 'precio', x0: '5', q0: '10', x1: '5', q1: '8' }, 'precio que no cambia');
    error({ tipo: 'lineal', a: '100', b: '2', p: '60' }, 'precio por encima de a/b');
    error({ tipo: 'renta', x0: '', q0: '10', x1: '5', q1: '8' }, 'sin renta');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, arco, clasificaciones, ingreso total, demanda lineal y errores`);
  }
  return Com.navegador({ publico, carpeta: 'elasticidades', nombre: N, app: 'ElasticidadesApp', C, pagina, mal, malo: { k: 'x1', v: '8' } });
};
