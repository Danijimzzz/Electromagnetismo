/* Comprobación de χ² de bondad de ajuste e independencia: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo chi2-bondad). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'χ² de bondad de ajuste';
  const C = require(path.join(fuente, 'chi2-bondad', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    const mira = (c, chi, gl, crit, rechaza, tol = 1e-3) => { const r = ej(c); cerca(r.chi, chi, tol, `${c}: χ²`); if (r.gl !== gl) mal(`${N} · ${c}: ${r.gl} grados de libertad en vez de ${gl}`); cerca(r.crit, crit, 2e-3, `${c}: valor crítico`); if (r.rechaza !== rechaza) mal(`${N} · ${c}: la decisión sale al revés`); return r; };
    // dado: E = 20; χ² = (64 + 16 + 0 + 4 + 4 + 144)/20 = 11,6 con 5 g. l.; χ²₅;₀,₉₅ = 11,070
    cerca(mira('dado', 11.6, 5, 11.07, true).pv, 0.0407, 5e-4, 'dado: p-valor');
    // Mendel: N = 556, E = 312,75; 104,25; 104,25; 34,75; χ² = 0,0162 + 0,1349 + 0,1013 + 0,2176 = 0,470 con 3 g. l.
    mira('mendel', 0.47, 3, 7.815, false, 2e-3);
    // coces: λ̂ = 122/200 = 0,61; E₀ = 200·e^−0,61 = 108,67; E₁ = 66,29; x ≥ 2 junta 2, 3 y 4: 200 − 108,67 − 66,29 = 25,04
    const l = 0.61, e0 = 200 * Math.exp(-l), e1 = e0 * l, e2 = 200 - e0 - e1;
    const co = mira('coces', (109 - e0) ** 2 / e0 + (65 - e1) ** 2 / e1 + (26 - e2) ** 2 / e2, 1, 3.841, false, 1e-9);
    if (co.celdas.length !== 3 || !co.junto) mal(`${N} · coces: no junta las clases x = 2, 3 y 4`);
    // familias: p̂ = (33 + 102 + 111 + 48)/(140·4) = 294/560 = 0,525; E = 140·C(4, k)·0,525^k·0,475^(4−k); ν = 5 − 1 − 1 = 3
    const p = 0.525, E = [0, 1, 2, 3, 4].map((k) => 140 * [1, 4, 6, 4, 1][k] * p ** k * (1 - p) ** (4 - k)), O = [7, 33, 51, 37, 12];
    mira('familias', O.reduce((a, o, k) => a + (o - E[k]) ** 2 / E[k], 0), 3, 7.815, false, 1e-9);
    // alturas: x̄ = 174,6 y σ̂ = √(∑ nᵢ (mᵢ − x̄)²/100) = 10,34; 5 clases − 1 − 2 = 2 g. l.
    const al = mira('alturas', 0.5906, 2, 5.991, false, 2e-3);
    cerca(al.celdas[0].e, 100 * 0.0809, 0.05, 'alturas: E del primer intervalo');
    // preferencia: E = 25, 30, 45 en las dos filas; χ² = 1 + 0 + 0,5556 + 1 + 0 + 0,5556 = 3,1111 con 2 g. l.
    mira('preferencia', 28 / 9, 2, 5.991, false, 1e-9);
    // curación: el mismo caso que dos proporciones con z = 2, y χ² = z² = 4 con 1 g. l.; con Yates, 2·49/37,5 + 2·49/112,5 = 3,4844
    const cu = mira('curacion', 4, 1, 3.841, true, 1e-9); cerca(cu.pv, 0.0455, 2e-4, 'curación: p-valor'); cerca(cu.V, Math.sqrt(4 / 300), 1e-9, 'curación: V de Cramér');
    cerca(C.resolver({ ...C.ejemplos[6].sc, yates: 'si' }).chi, 98 / 37.5 + 98 / 112.5, 1e-9, 'corrección de Yates');
    error({ modo: 'bondad', modelo: 'uniforme', alfa: '0,05', datos: '10' }, 'una sola clase');
    error({ modo: 'bondad', modelo: 'poisson', alfa: '0,05', datos: '0 10\n2 5' }, 'valores x no seguidos');
    error({ modo: 'independencia', alfa: '0,05', datos: '1 2 3' }, 'una sola fila');
    error({ modo: 'bondad', modelo: 'uniforme', alfa: '0,05', datos: '3 4,5 6' }, 'frecuencias no enteras');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos (uniforme, proporciones, Poisson, binomial, normal, contingencia y Yates) y errores`);
  }
  return Com.navegador({ publico, asignatura: 'estadistica', carpeta: 'chi2-bondad', nombre: N, app: 'Chi2BondadApp', C, pagina, mal, malo: { k: 'datos', v: '10' } });
};
