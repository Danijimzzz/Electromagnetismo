/* Comprobación de Excedentes, impuestos y eficiencia: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo excedentes). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Excedentes, impuestos y eficiencia';
  const C = require(path.join(fuente, 'excedentes', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    const mira = (c, q) => { const r = ej(c), D = r.des; for (const [k, v] of Object.entries(q)) cerca(k in r && !(k in (D || {})) ? r[k] : D[k], v, 1e-9, `${c}: ${k}`); return r; };
    // 100 − 2P = −20 + 2P ⇒ P* = 30, Q* = 40; EC = ½·(50 − 30)·40 = 400; EP = ½·(30 − 10)·40 = 400
    mira('equilibrio', { p: 30, q: 40, ec: 400, ep: 400, w: 800 });
    // t = 10: Pc = (120 + 20)/4 = 35, Pv = 25, Q = 30; EC = EP = ½·15·30 = 225; T = 300; PIE = ½·10·10 = 50
    mira('impuesto', { pc: 35, pv: 25, q: 30, ec: 225, ep: 225, pi: 300, pie: 50 });
    // tabaco: 120 − P = −40 + 4P ⇒ P* = 32, Q* = 88; t = 5: Pc = 180/5 = 36, Pv = 31, Q = 84; PIE = ½·5·4 = 10 (80 % lo pagan los consumidores)
    mira('tabaco', { pc: 36, pv: 31, q: 84, pie: 10, pi: 420 });
    // subvención 6: Pc = (120 − 12)/4 = 27, Pv = 33, Q = 46; EC = EP = ½·23·46 = 529; gasto 276; PIE = ½·6·6 = 18
    mira('subvencion', { pc: 27, pv: 33, q: 46, ec: 529, ep: 529, pi: -276, pie: 18 });
    // máximo 24: Qs = 28; demanda en 28: 36; EC = (26 + 12)/2·28 = 532; EP = ½·14·28 = 196; PIE = ½·(36 − 24)·12 = 72
    mira('alquiler', { q: 28, ec: 532, ep: 196, pie: 72 });
    // c = 20: P* = 20, Q* = 60, EC = 900, EP = (20 + 60)·20/2 = 800; mínimo 25: Qd = 50; EP = 25·50 − 30²/4 = 1025; EC = ½·25·50 = 625; PIE = ½·10·10 = 50
    mira('minimo', { ec: 625, ep: 1025, pie: 50 }); cerca(ej('minimo').ep, 800, 1e-9, 'minimo: EP en el equilibrio');
    const sin = C.resolver({ ...C.ejemplos[4].sc, v: '35' }); if (sin.des.pie > 1e-9) mal(`${N}: un precio máximo por encima del equilibrio da pérdida`);
    error({ a: '100', b: '2', c: '-20', d: '2', interv: 'impuesto', v: '60' }, 'impuesto que vacía el mercado');
    error({ a: '100', b: '2', c: '-20', d: '2', interv: 'impuesto', v: '' }, 'impuesto vacío');
    error({ a: '10', b: '2', c: '20', d: '2', interv: 'ninguna' }, 'sin equilibrio');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (equilibrio, impuestos, subvención, precio máximo y mínimo) y errores`);
  }
  return Com.navegador({ publico, carpeta: 'excedentes', nombre: N, app: 'ExcedentesApp', C, pagina, mal, malo: { k: 'b', v: '0' } });
};
