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
    // casos límite (FM-1): v = 0 es la identidad; β ≈ 1 conserva las cifras; sucesos sobre el cono de luz; suma de dos velocidades casi c
    {
      const I = C.resolver({ modo: 'lorentz', unidades: 'al', v: '0', x: '4', t: '6' });
      cerca(I.g, 1, 0, 'γ con v = 0'); cerca(I.xp, 4, 0, 'x′ con v = 0'); cerca(I.ctp, 6, 0, 'ct′ con v = 0'); cerca(I.s2p, I.s2, 0, 'intervalo con v = 0');
      for (const v of ['0,999999999', '-0,999999999']) {
        const L = C.resolver({ modo: 'lorentz', unidades: 'al', v, x: '4', t: '6' }), b = Math.abs(+v.replace(',', '.'));
        cerca(L.g, 1 / Math.sqrt((1 - b) * (1 + b)), 1e-6 * L.g, `γ con β = ${v}`); cerca(L.s2p, L.s2, 1e-2, `el intervalo se conserva con β = ${v}`);
        if (!/0,999999999/.test(L.pasos[0].html)) mal(`${N}: con β = ${v} no se muestran las cifras de β (saldría «1»)`);
      }
      const luz = C.resolver({ modo: 'lorentz', unidades: 'al', v: '0,6', x: '3', t: '3' });
      if (luz.tipo !== 'luz') mal(`${N}: (3, 3) está sobre el cono de luz`); cerca(luz.xp, luz.ctp, 1e-12, 'sobre el cono de luz x′ = ct′'); cerca(luz.s2p, 0, 1e-12, 's² = 0 en S′');
      const W = C.resolver({ modo: 'velocidades', caso: 'compone', u: '0,999999999', v: '0,999999999' });
      cerca(W.mw, 5e-19, 1e-24, '1 − w con dos velocidades casi c (producto de las diferencias dividido por 2)'); cerca(W.g, 1e9, 1e3, 'γ del resultado'); cerca(W.fw, 2 * Math.atanh(0.999999999), 1e-12, 'rapideces');
      if (/—/.test(W.pasos.map((q) => q.html).join(' '))) mal(`${N}: la suma de dos velocidades casi c deja un «—» en el desarrollo`);
      cerca(C.resolver({ modo: 'velocidades', caso: 'compone', u: '0', v: '0' }).w, 0, 0, 'w = 0');
      cerca(C.resolver({ modo: 'velocidades', caso: 'compone', u: '0,5', v: '0' }).w, 0.5, 1e-15, 'v = 0: w = u');
      cerca(C.resolver({ modo: 'velocidades', caso: 'relativa', u: '0,7', v: '0,7' }).w, 0, 1e-15, 'velocidad relativa de dos naves iguales');
    }
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (Lorentz, velocidades e intervalos) y errores`);
  }
  return Com.navegador({ publico, asignatura: 'fisica', carpeta: 'relatividad', nombre: N, app: 'RelatividadApp', C, pagina, mal, malo: { k: 'v', v: '1,5' } });
};
