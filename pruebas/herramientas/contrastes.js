/* Comprobación de Contrastes de hipótesis: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo contrastes). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Contrastes de hipótesis';
  const C = require(path.join(fuente, 'contrastes', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    const mira = (c, est, crit, pv, rechaza) => { const r = ej(c); cerca(r.est, est, 1e-4, `${c}: estadístico`); crit.forEach((v, i) => cerca(r.crit[i], v, 2e-3, `${c}: valor crítico ${i + 1}`)); cerca(r.pv, pv, 2e-4, `${c}: p-valor`); if (r.rechaza !== rechaza) mal(`${N} · ${c}: la decisión sale al revés`); };
    // z = (496 − 500)/(10/5) = −2; z₀,₉₇₅ = 1,96; p = 2·Φ(−2) = 0,0455
    mira('paquetes', -2, [-1.96, 1.96], 0.0455, true);
    // t = 0,6/(1,2/4) = 2 con 15 g. l.; t₀,₉₅ = 1,753; p = 0,0320 (tablas)
    mira('pilas', 2, [1.753], 0.032, true);
    // p̂ = 0,29; z = 0,04/√(0,25·0,75/200) = 1,3064; p = 0,0957
    mira('encuesta', 1.3064, [1.6449], 0.0957, false);
    // χ² = 19·6,25/4 = 29,6875; χ²₁₉;₀,₉₅ = 30,144; p ≈ 0,056
    mira('maquina', 29.6875, [30.144], 0.0559, false);
    // sp² = (9·16 + 11·25)/20 = 20,95; t = 5/(√20,95·√(1/10 + 1/12)) = 2,5513 con 20 g. l.; t₀,₉₇₅ = 2,086
    mira('metodos', 2.5513, [-2.086, 2.086], 0.019, true);
    // p̂ = 0,25 conjunta; z = 0,1/√(0,25·0,75·2/150) = 2
    mira('tratamiento', 2, [-1.96, 1.96], 0.0455, true);
    // F = 9/4 = 2,25 con (10, 12); F₀,₉₇₅ = 3,374; F₀,₀₂₅ = 1/F₀,₉₇₅(12, 10) = 1/3,621 = 0,2762
    mira('proveedores', 2.25, [0.2762, 3.3736], 0.1848, false);
    // Welch con las varianzas de «metodos»: ν = (1,6 + 2,0833)²/(1,6²/9 + 2,0833²/11) = 19,99
    const w = C.resolver({ ...C.ejemplos[4].sc, caso: 'distintas' }); cerca(w.d[1].nu, (1.6 + 25 / 12) ** 2 / (1.6 ** 2 / 9 + (25 / 12) ** 2 / 11), 1e-9, 'grados de libertad de Welch');
    error({ tipo: 'media', alfa: '0,05', n: '1', xm: '3', s: '1', mu0: '2' }, 'n = 1');
    error({ tipo: 'proporcion', alfa: '0,05', n: '10', x: '12', p0: '0,5' }, 'más éxitos que n');
    error({ tipo: 'media', alfa: '0', n: '10', xm: '3', s: '1', mu0: '2' }, 'α = 0');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos (z, t, χ², F, dos medias, dos proporciones), Welch y errores`);
  }
  return Com.navegador({ publico, asignatura: 'estadistica', carpeta: 'contrastes', nombre: N, app: 'ContrastesApp', C, pagina, mal, malo: { k: 'n', v: '1' } });
};
