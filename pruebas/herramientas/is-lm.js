/* Comprobación del Modelo IS-LM: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo is-lm). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Modelo IS-LM';
  const C = require(path.join(fuente, 'is-lm', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // A = 100 − 0,75·200 + 300 + 150 = 400; m = 400; den = 0,25 + 30·0,5/20 = 1; Y = 400 + 600 = 1000; i = (500 − 400)/20 = 5
    const e = ej('equilibrio'); cerca(e.y, 1000, 1e-9, 'renta'); cerca(e.i, 5, 1e-9, 'tipo'); cerca(e.c, 700, 1e-9, 'consumo'); cerca(e.inv, 150, 1e-9, 'inversión');
    cerca(e.c + e.inv + e.G, e.y, 1e-9, 'C + I + G = Y'); cerca(e.mf, 1, 1e-12, 'multiplicador fiscal'); cerca(e.mm, 1.5, 1e-12, 'multiplicador monetario');
    // ΔG = 50: ΔY = 50, Δi = 0,5·50/20 = 1,25; simple 4·50 = 200 → expulsión 150
    const g = ej('fiscal'); cerca(g.y1, 1050, 1e-9, 'renta tras ΔG'); cerca(g.i1, 6.25, 1e-9, 'tipo tras ΔG'); cerca(g.ex, 150, 1e-9, 'expulsión');
    // ΔM = 200: Δ(M/P) = 100, ΔY = 1,5·100 = 150, i = (0,5·1150 − 500)/20 = 3,75
    const m = ej('monetaria'); cerca(m.y1, 1150, 1e-9, 'renta tras ΔM'); cerca(m.i1, 3.75, 1e-9, 'tipo tras ΔM'); cerca(m.ex, 0, 1e-12, 'sin expulsión');
    // ΔT = −50: ΔA = 0,75·50 = 37,5; ΔY = 37,5
    const t = ej('impuestos'); cerca(t.y1, 1037.5, 1e-9, 'renta tras bajar impuestos'); cerca(t.i1, 5 + 0.5 * 37.5 / 20, 1e-9, 'tipo tras bajar impuestos');
    const x = ej('mixta'); cerca(x.y1, 1200, 1e-9, 'renta con política mixta'); cerca(x.i1, 5, 1e-9, 'el tipo no cambia'); cerca(x.yf + x.ym, x.dy, 1e-9, 'fiscal + monetario = ΔY');
    // LM casi plana: el multiplicador fiscal tiende al keynesiano 4
    const l = ej('trampa'); cerca(l.mf, 4, 0.01, 'trampa de liquidez: multiplicador fiscal ≈ 4'); cerca(l.dy, 200, 0.5, 'trampa: ΔY ≈ 200');
    error({ ...C.ejemplos[0].sc, c1: '1' }, 'c₁ = 1');
    error({ ...C.ejemplos[0].sc, h: '0' }, 'h = 0');
    error({ ...C.ejemplos[0].sc, b: '-5' }, 'b negativa');
    error({ ...C.ejemplos[0].sc, P: '0' }, 'precios cero');
    error({ ...C.ejemplos[0].sc, dT: '-300' }, 'impuestos negativos');
    error({ ...C.ejemplos[0].sc, c0: '' }, 'falta c₀');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, multiplicadores, expulsión y errores`);
  }
  return Com.navegador({ publico, carpeta: 'is-lm', nombre: N, app: 'IsLmApp', C, pagina, mal, malo: { k: 'c1', v: '1' } });
};
