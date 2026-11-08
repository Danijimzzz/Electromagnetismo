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
    // entre cupones (2,3 años, cupón anual 5 %, TIR 4 %): 3 pagos, el primero dentro de 0,3 años
    // sucio = 50·1,04^−0,3 + 50·1,04^−1,3 + 1.050·1,04^−2,3 = 1.027,7509·1,04^0,7; corrido = 50·0,7 = 35 €
    const e = ej('entre-cupones'); cerca(e.filas.length, 3, 0, 'pagos que quedan'); cerca(e.w, 0.3, 1e-12, 'parte del periodo hasta el cupón');
    cerca(e.P, 50 * 1.04 ** -0.3 + 50 * 1.04 ** -1.3 + 1050 * 1.04 ** -2.3, 1e-9, 'precio sucio entre cupones'); cerca(e.P, 1027.750925 * 1.04 ** 0.7, 5e-4, 'precio sucio = precio en el cupón anterior · (1 + i)^(1 − w)');
    cerca(e.corrido, 35, 1e-9, 'cupón corrido'); cerca(e.Pl, e.P - 35, 1e-9, 'precio limpio'); cerca(e.filas[0].t, 0.3, 1e-12, 'años al primer cupón');
    const h2 = 1e-5, Pe = (x) => C.precioDe(1000, 0.05, 1, 3, x, 0.3); cerca(e.durMod, -(Pe(0.04 + h2) - Pe(0.04 - h2)) / (2 * h2) / e.P, 1e-6, 'duración modificada entre cupones'); cerca(e.conv, (Pe(0.04 + h2) - 2 * Pe(0.04) + Pe(0.04 - h2)) / (h2 * h2) / e.P, 1e-3, 'convexidad entre cupones');
    { const s = ej('entre-cupones-semestral'); cerca(s.P, 1020 + 60 / 2 * 0.5, 1e-9, 'sucio = limpio + corrido'); cerca(s.corrido, 15, 1e-9, 'corrido semestral (0,75 años → medio periodo)'); cerca(C.precioDe(1000, 0.06, 2, 10, s.y, s.w), s.P, 1e-6, 'la TIR devuelve el precio sucio'); }
    // aviso con variaciones extremas
    if (!ej('variacion-extrema').aviso) mal(`${N}: una variación de −12 puntos debe avisar`); if (ej('bono-tres-anos').aviso) mal(`${N}: una variación de 1 punto no debe avisar`);
    error({ ...C.ejemplos[0].sc, nominal: '0' }, 'nominal nulo'); error({ ...C.ejemplos[0].sc, anos: '0' }, 'años nulos'); if (!C.resolver({ ...C.ejemplos[0].sc, shock: '-50' }).aviso) mal(`${N}: -50 puntos debe avisar`);
    error({ ...C.ejemplos[0].sc, modo: 'precio', precio: '-5' }, 'precio negativo'); error({ ...C.ejemplos[0].sc, cupon: '-1' }, 'cupón negativo');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, precio, TIR, duración y convexidad calculados a mano, y errores`);
  }
  return Com.navegador({ publico, carpeta: 'bonos', nombre: N, app: 'BonosApp', C, pagina, mal, malo: { k: 'anos', v: '0' } });
};
