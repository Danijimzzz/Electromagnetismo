/* Comprobación de Oferta y demanda: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo oferta-demanda). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Oferta y demanda';
  const C = require(path.join(fuente, 'oferta-demanda', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // 100 − 2P = 20 + 2P ⇒ P* = 80/4 = 20, Q* = 60; ε_d = −2·20/60 = −2/3, ε_s = 2/3
    const b = ej('basico'); cerca(b.p, 20, 1e-12, 'precio'); cerca(b.q, 60, 1e-12, 'cantidad'); cerca(b.ed, -2 / 3, 1e-12, 'ε de la demanda'); cerca(b.es, 2 / 3, 1e-12, 'ε de la oferta');
    if (b.control || b.nuevo) mal(`${N}: sin precio fijado ni desplazamientos sale una intervención`);
    // a 15 €: Qd = 70, Qs = 50 ⇒ escasez de 20 y se venden 50
    const t = ej('tope').control; cerca(t.dif, 20, 1e-12, 'escasez'); cerca(t.vendida, 50, 1e-12, 'vendida con escasez'); if (t.tipo !== 'maximo') mal(`${N}: 15 € no sale como precio máximo`);
    // 500 − 10P = −100 + 20P ⇒ P* = 20, Q* = 300; a 25 €: Qd = 250, Qs = 400 ⇒ excedente de 150
    const g = ej('garantia'); cerca(g.p, 20, 1e-12, 'precio del trigo'); cerca(g.control.dif, -150, 1e-12, 'excedente'); cerca(g.control.vendida, 250, 1e-12, 'vendida con excedente');
    // demanda + 20: P = 100/4 = 25, Q = 70
    const r = ej('renta').nuevo; cerca(r.p, 25, 1e-12, 'precio tras subir la demanda'); cerca(r.q, 70, 1e-12, 'cantidad tras subir la demanda');
    // naranjas: 200 − 10P = 50 + 20P ⇒ P = 5, Q = 150; oferta − 30 ⇒ P = 180/30 = 6, Q = 140
    const h = ej('helada'); cerca(h.p, 5, 1e-12, 'precio de las naranjas'); cerca(h.nuevo.p, 6, 1e-12, 'precio tras la helada'); cerca(h.nuevo.q, 140, 1e-12, 'cantidad tras la helada');
    // las dos + 20: P = (120 − 40)/4 = 20 (no cambia), Q = 80
    const a = ej('ambas').nuevo; cerca(a.dp, 0, 1e-12, 'precio con las dos'); cerca(a.q, 80, 1e-12, 'cantidad con las dos');
    // P = 50 − Q/2 ⇒ Qd = 100 − 2P; P = 10 + Q/2 ⇒ Qs = −20 + 2P; equilibrio P = 30, Q = 40
    { const i = ej('inversa'); cerca(i.a, 100, 1e-12, 'a desde P = α − βQ'); cerca(i.b, 2, 1e-12, 'b desde β'); cerca(i.c, -20, 1e-12, 'c desde γ'); cerca(i.d, 2, 1e-12, 'd desde δ'); cerca(i.p, 30, 1e-12, 'precio con curvas inversas'); cerca(i.q, 40, 1e-12, 'cantidad con curvas inversas');
      const d = ej('dos-puntos'); cerca(d.p, 20, 1e-12, 'precio con curvas por dos puntos'); cerca(d.q, 60, 1e-12, 'cantidad con curvas por dos puntos'); }
    error({ forma: 'puntos', dp1: '10', dq1: '60', dp2: '20', dq2: '80', sp1: '10', sq1: '40', sp2: '20', sq2: '60' }, 'demanda creciente'); error({ forma: 'p', pa: '50', pb: '0', pc: '10', pd: '0,5' }, 'β = 0');
    error({ a: '10', b: '2', c: '20', d: '2' }, 'oferta mínima por encima de la demanda máxima');
    error({ a: '100', b: '0', c: '20', d: '2' }, 'b = 0');
    error({ a: '100', b: '2', c: '20', d: '2', da: '-200' }, 'desplazamiento que deja el mercado vacío');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (equilibrio, elasticidades, precio máximo y mínimo, desplazamientos) y errores`);
  }
  return Com.navegador({ publico, carpeta: 'oferta-demanda', nombre: N, app: 'OfertaDemandaApp', C, pagina, mal, malo: { k: 'b', v: '0' } });
};
