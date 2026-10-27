/* Comprobación de Punto muerto: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo punto-muerto). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Punto muerto';
  const C = require(path.join(fuente, 'punto-muerto', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: 30.000/(50 − 30) = 1.500 u; B(2.000) = 20·2.000 − 30.000 = 10.000 €; MS = 500/2.000; GAO = 40.000/10.000
    const t = ej('fabrica'); cerca(t.q0, 1500, 1e-9, 'punto muerto'); cerca(t.i0, 75000, 1e-9, 'en euros'); cerca(t.b, 10000, 1e-9, 'beneficio'); cerca(t.ms, 0.25, 1e-12, 'margen de seguridad'); cerca(t.gao, 4, 1e-12, 'GAO');
    cerca(ej('cafeteria').q0, 2500, 1e-9, 'cafés: 4.000/1,6');
    cerca(ej('objetivo').qObj, 2000, 1e-9, 'unidades para 40.000 € (160.000/80)');
    cerca(ej('perdidas').b, -10000, 1e-9, 'pérdidas');
    error({ cf: '1000', p: '10', cv: '10' }, 'precio igual al coste variable');
    error({ cf: '0', p: '10', cv: '5' }, 'sin costes fijos');
    error({ cf: '1000', p: '10', cv: '5', q: '-3' }, 'ventas negativas');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, margen de seguridad, GAO, objetivo y errores`);
  }
  return Com.navegador({ publico, carpeta: 'punto-muerto', nombre: N, app: 'PuntoMuertoApp', C, pagina, mal, malo: { k: 'p', v: '1' } });
};
