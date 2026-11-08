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
    // IVA del 21 %: Pv = (100 + 20)/(2·1,21 + 2) = 27,2727; Pc = 33,0; Q = 33,9; equivale al impuesto por unidad t = 0,21·Pv
    { const r = ej('iva'), pv = 120 / (2 * 1.21 + 2), t = 0.21 * pv; cerca(r.des.pv, pv, 1e-9, 'Pv con IVA'); cerca(r.des.pc, 1.21 * pv, 1e-9, 'Pc con IVA'); cerca(r.des.vu, t, 1e-12, 'impuesto por unidad equivalente');
      const u = C.resolver({ a: '100', b: '2', c: '-20', d: '2', interv: 'impuesto', v: String(t).replace('.', ',') }); cerca(r.des.q, u.des.q, 1e-9, 'Q con IVA = Q con el impuesto por unidad equivalente'); cerca(r.des.pie, u.des.pie, 1e-9, 'PIE con IVA = la del impuesto equivalente'); cerca(r.des.pi, u.des.pi, 1e-9, 'recaudación con IVA'); cerca(r.des.pi, t * r.des.q, 1e-9, 'recaudación = t·Q'); }
    // curvas por dos puntos: demanda (10, 80) y (20, 60) → Qd = 100 − 2P; oferta (10, 40) y (20, 60) → Qs = 20 + 2P
    { const r = ej('puntos'), q0 = C.resolver({ a: '100', b: '2', c: '20', d: '2', interv: 'impuesto', v: '5' }); cerca(r.a, 100, 1e-12, 'a por dos puntos'); cerca(r.b, 2, 1e-12, 'b por dos puntos'); cerca(r.c, 20, 1e-12, 'c por dos puntos'); cerca(r.d, 2, 1e-12, 'd por dos puntos'); cerca(r.des.pie, q0.des.pie, 1e-12, 'mismos resultados que en forma Q'); }
    error({ forma: 'puntos', dp1: '10', dq1: '60', dp2: '20', dq2: '80', sp1: '10', sq1: '40', sp2: '20', sq2: '60', interv: 'ninguna' }, 'demanda creciente por dos puntos'); error({ forma: 'puntos', dp1: '10', dq1: '80', dp2: '10', dq2: '60', sp1: '10', sq1: '40', sp2: '20', sq2: '60', interv: 'ninguna' }, 'dos puntos con el mismo precio');
    error({ a: '100', b: '2', c: '-20', d: '2', interv: 'impuesto', v: '60' }, 'impuesto que vacía el mercado');
    error({ a: '100', b: '2', c: '-20', d: '2', interv: 'impuesto', v: '' }, 'impuesto vacío');
    error({ a: '10', b: '2', c: '20', d: '2', interv: 'ninguna' }, 'sin equilibrio');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (equilibrio, impuestos, subvención, precio máximo y mínimo) y errores`);
  }
  return Com.navegador({ publico, carpeta: 'excedentes', nombre: N, app: 'ExcedentesApp', C, pagina, mal, malo: { k: 'b', v: '0' } });
};
