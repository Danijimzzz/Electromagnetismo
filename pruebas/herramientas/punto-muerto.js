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
    // varios productos a mano: Q = 2.000, pesos 0,5 / 0,3 / 0,2, márgenes 4 / 10 / 18 → m = 2 + 3 + 3,6 = 8,6; Q* = 12.000/8,6; B = 8,6·2.000 − 12.000
    const v = ej('tres-productos'); cerca(v.m, 8.6, 1e-12, 'margen medio ponderado'); cerca(v.q0, 12000 / 8.6, 1e-9, 'punto muerto de la mezcla'); cerca(v.b, 5200, 1e-9, 'beneficio de la mezcla');
    cerca(v.prod[0].q0, 0.5 * 12000 / 8.6, 1e-9, 'parte del producto 1'); cerca(v.p, 0.5 * 10 + 0.3 * 25 + 0.2 * 40, 1e-12, 'precio medio');
    const w = ej('dos-productos-objetivo'); cerca(w.m, 20, 1e-12, 'margen con dos productos'); cerca(w.q0, 1000, 1e-9, 'Q* con dos'); cerca(w.b, -5000, 1e-9, 'B con dos (750 u)'); cerca(w.qObj, 1400, 1e-9, 'Q para 8.000 €');
    // sensibilidad: precio −10 % en «fábrica» → m = 45 − 30 = 15 → 30.000/15 = 2.000; B = 15·2.000 − 30.000 = 0
    const sn = ej('fabrica').sens.find((r) => r.v === 'p' && r.dl === -0.1); cerca(sn.q0, 2000, 1e-9, 'precio −10 %'); cerca(sn.b, 0, 1e-9, 'beneficio con precio −10 %');
    if (ej('fabrica').sens.find((r) => r.v === 'p' && r.dl === -0.2).q0 !== 30000 / 10) mal('precio −20 %: m = 10 → 3.000');
    error({ modo: 'varios', cf: '1000', productos: '10 5 100' }, 'un solo producto en la mezcla');
    error({ modo: 'varios', cf: '1000', productos: '10 12 100\n10 12 100' }, 'margen medio negativo');
    error({ modo: 'varios', cf: '1000', productos: '10 5 0\n10 5 100' }, 'unidades 0');
    error({ cf: '1000', p: '10', cv: '10' }, 'precio igual al coste variable');
    error({ cf: '0', p: '10', cv: '5' }, 'sin costes fijos');
    error({ cf: '1000', p: '10', cv: '5', q: '-3' }, 'ventas negativas');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, margen de seguridad, GAO, objetivo y errores`);
  }
  return Com.navegador({ publico, carpeta: 'punto-muerto', nombre: N, app: 'PuntoMuertoApp', C, pagina, mal, malo: { k: 'p', v: '1' } });
};
