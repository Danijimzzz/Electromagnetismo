/* Comprobación de Cinemática relativista: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo relatividad). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Cinemática relativista';
  const C = require(path.join(fuente, 'relatividad', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // β = 0,6 → γ = 1,25; (x, ct) = (4, 6): x′ = 1,25 (4 − 3,6) = 0,5; ct′ = 1,25 (6 − 2,4) = 4,5; s² = 36 − 16 = 20 = 20,25 − 0,25
    const l = ej('evento'); cerca(l.g, 1.25, 1e-12, 'γ'); cerca(l.xp, 0.5, 1e-12, "x′"); cerca(l.ctp, 4.5, 1e-12, 'ct′'); cerca(l.tp, 4.5, 1e-12, 't′'); cerca(l.s2, 20, 1e-12, 's²'); cerca(l.s2p, 20, 1e-12, 's² en S′'); if (l.tipo !== 'temporal') mal(`${N}: (4, 6) debería ser tipo tiempo`);
    // β = 0,5 → γ = 1,154701; (3, 1): x′ = γ·2,5 = 2,886751; ct′ = γ·(1 − 1,5) = −0,577350; tipo espacio
    const e = ej('simultaneo'); cerca(e.xp, 1.154700538 * 2.5, 1e-8, 'x′ simultáneo'); cerca(e.ctp, -1.154700538 * 0.5, 1e-8, 'ct′ simultáneo'); if (e.tipo !== 'espacial') mal(`${N}: (3, 1) debería ser tipo espacio`);
    // en kilómetros y segundos, c = 299 792,458: x = 0, t = 1 s a 0,6c → ct′ = 1,25 c, t′ = 1,25 s
    const k = C.resolver({ modo: 'lorentz', unidades: 'km', v: '0,6', x: '0', t: '1' }); cerca(k.tp, 1.25, 1e-12, "t′ en km y s"); cerca(k.xp, -1.25 * 0.6 * 299792.458, 1e-6, "x′ en km");
    // 0,8c lanzado desde 0,6c: 1,4/1,48 = 0,945946; la luz sigue a c; resta: 0,3/0,46 = 0,652174
    const s = ej('nave'); cerca(s.w, 1.4 / 1.48, 1e-12, 'w'); cerca(s.gal, 1.4, 1e-12, 'Galileo'); cerca(s.fw, s.fu + s.fv, 1e-12, 'las rapideces se suman');
    cerca(ej('luz').w, 1, 1e-12, 'la luz va a c'); cerca(ej('relativa').w, 0.3 / 0.46, 1e-12, 'velocidad relativa');
    // temporal: Δx = 3, cΔt = 5 → s² = 16, τ = 4, β = 0,6; espacial: Δx = 5, cΔt = 3 → s² = −16, σ = 4, β = 0,6
    const t = ej('temporal'); cerca(t.s2, 16, 1e-12, 's² temporal'); cerca(t.tau, 4, 1e-12, 'tiempo propio'); cerca(t.beta, 0.6, 1e-12, 'β temporal');
    const p = ej('espacial'); cerca(p.s2, -16, 1e-12, 's² espacial'); cerca(p.d, 4, 1e-12, 'distancia propia'); cerca(p.beta, 0.6, 1e-12, 'β simultáneo');
    if (C.resolver({ modo: 'intervalo', unidades: 'al', x1: '0', t1: '0', x2: '3', t2: '3' }).tipo !== 'luz') mal(`${N}: Δx = cΔt debería ser tipo luz`);
    error({ modo: 'lorentz', unidades: 'al', v: '1', x: '1', t: '1' }, 'v = c'); error({ modo: 'lorentz', unidades: 'al', v: '1,2', x: '1', t: '1' }, 'v > c'); error({ modo: 'velocidades', caso: 'compone', u: '1,1', v: '0,5' }, 'u > c');
    error({ modo: 'intervalo', unidades: 'al', x1: '1', t1: '2', x2: '1', t2: '2' }, 'eventos iguales'); error({ modo: 'lorentz', unidades: 'al', v: 'abc', x: '1', t: '1' }, 'v no numérica');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (Lorentz, velocidades e intervalos) y errores`);
  }
  return Com.navegador({ publico, asignatura: 'fisica', carpeta: 'relatividad', nombre: N, app: 'RelatividadApp', C, pagina, mal, malo: { k: 'v', v: '1,5' } });
};
