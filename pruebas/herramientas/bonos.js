/* Comprobación de Bonos y duración: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo bonos). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Bonos y duración';
  const C = require(path.join(fuente, 'bonos', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: 50/1,04 + 50/1,04² + 1.050/1,04³ = 48,0769 + 46,2278 + 933,4462 = 1.027,7509 €
    const b = ej('bono-tres-anos'); cerca(b.P, 1027.7509, 5e-4, 'precio a 3 años');
    // duración: (1·48,0769 + 2·46,2278 + 3·933,4462)/1.027,7509 = 2,86146 años
    cerca(b.durM, 2.86146, 1e-5, 'duración de Macaulay'); cerca(b.durMod, 2.86146 / 1.04, 1e-5, 'duración modificada');
    // forma cerrada: P = N·c·(1 − v^n)/i + N·v^n
    const v = 1.04 ** -3; cerca(b.P, 50 * (1 - v) / 0.04 + 1000 * v, 1e-9, 'precio por la fórmula cerrada');
    // con cupón = TIR, el bono vale el nominal; con cupón cero, la duración es el vencimiento
    cerca(ej('a-la-par').P, 1000, 1e-9, 'bono a la par'); cerca(ej('cupon-cero').durM, 8, 1e-12, 'duración de un cupón cero'); cerca(ej('cupon-cero').P, 1000 / 1.035 ** 8, 1e-9, 'precio del cupón cero');
    // duración modificada y convexidad = derivadas del precio respecto a la TIR (diferencias finitas)
    const h = 1e-5, P = (x) => C.precioDe(1000, 0.05, 1, 3, x);
    cerca(b.durMod, -(P(0.04 + h) - P(0.04 - h)) / (2 * h) / b.P, 1e-6, 'duración modificada como derivada');
    cerca(b.conv, (P(0.04 + h) - 2 * P(0.04) + P(0.04 - h)) / (h * h) / b.P, 1e-3, 'convexidad como derivada segunda');
    cerca(b.Pexacto, 1000, 1e-6, 'precio exacto con TIR 5 % (cupón 5 %)'); if (!(b.Pconv > b.Pdur - 1e-9)) mal(`${N}: la convexidad debe mejorar la aproximación de la duración`);
    // el precio devuelve la TIR
    const p = ej('bajo-par'); cerca(C.precioDe(1000, 0.03, 1, 5, p.y), 920, 1e-6, 'precio de la TIR obtenida'); cerca(p.y, 0.0483961, 1e-6, 'TIR de comprar por 920 €');
    cerca(ej('semestral').filas.length, 20, 0, 'periodos del bono semestral');
    error({ ...C.ejemplos[0].sc, nominal: '0' }, 'nominal nulo'); error({ ...C.ejemplos[0].sc, anos: '2,5' }, 'años que no dan pagos enteros');
    error({ ...C.ejemplos[0].sc, modo: 'precio', precio: '-5' }, 'precio negativo'); error({ ...C.ejemplos[0].sc, cupon: '-1' }, 'cupón negativo');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, precio, TIR, duración y convexidad calculados a mano, y errores`);
  }
  return Com.navegador({ publico, carpeta: 'bonos', nombre: N, app: 'BonosApp', C, pagina, mal, malo: { k: 'anos', v: '2,5' } });
};
