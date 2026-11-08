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
    // oferta: de 2 a 2,5 € la cantidad pasa de 1.000 a 1.300 → ε = 0,3/0,25 = 1,2 (elástica); de arco: (300/1150)/(0,5/2,25)
    { const o = ej('oferta'); cerca(o.e, 1.2, 1e-12, 'elasticidad de la oferta'); cerca(o.ea, (300 / 1150) / (0.5 / 2.25), 1e-12, 'elasticidad de arco de la oferta'); if (!/elástica/.test(o.clase)) mal(`${N}: la oferta con ε = 1,2 es elástica`);
      // isoelástica: Q = 1000·P⁻² a 5 € → Q = 40, ε = −2 en cualquier punto, IT = 200 (baja al subir P); oferta 20·P^0,5 a 16 → 80, ε = 0,5
      const d = ej('isoelastica'); cerca(d.q, 40, 1e-12, 'cantidad isoelástica'); cerca(d.e, -2, 1e-12, 'elasticidad isoelástica'); cerca(d.it, 200, 1e-12, 'ingreso isoelástico');
      const h = 1e-6, Q = (P) => 1000 * P ** -2; cerca(-(Q(5 + h) - Q(5 - h)) / (2 * h) * 5 / Q(5), 2, 1e-6, 'elasticidad como derivada logarítmica');
      const s2 = ej('isoelastica-oferta'); cerca(s2.q, 80, 1e-12, 'cantidad de la oferta isoelástica'); cerca(s2.e, 0.5, 1e-12, 'elasticidad de la oferta isoelástica'); }
    error({ tipo: 'isoelastica', lado: 'demanda', A: '1000', eps: '0', p: '5' }, 'ε = 0 isoelástica'); error({ tipo: 'isoelastica', lado: 'demanda', A: '', eps: '2', p: '5' }, 'sin A');
    error({ tipo: 'precio', x0: '5', q0: '10', x1: '5', q1: '8' }, 'precio que no cambia');
    error({ tipo: 'lineal', a: '100', b: '2', p: '60' }, 'precio por encima de a/b');
    error({ tipo: 'renta', x0: '', q0: '10', x1: '5', q1: '8' }, 'sin renta');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, arco, clasificaciones, ingreso total, demanda lineal y errores`);
  }
  return Com.navegador({ publico, carpeta: 'elasticidades', nombre: N, app: 'ElasticidadesApp', C, pagina, mal, malo: { k: 'x1', v: '8' } });
};
