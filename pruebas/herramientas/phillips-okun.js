/* Comprobación de Curva de Phillips y ley de Okun: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo phillips-okun). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Phillips y Okun';
  const C = require(path.join(fuente, 'phillips-okun', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: Δu = −0,5 · (−1 − 2) = 1,5 → 15,5 %; para bajar 2 puntos, g = 2 + 2/0,5 = 6 %
    cerca(ej('recesion').u1, 15.5, 1e-12, 'paro tras la recesión'); cerca(ej('bajar-paro').g, 6, 1e-12, 'crecimiento necesario');
    // brecha: −2 · (9 − 6) = −6 %; 1400 · 0,94 = 1316
    const b = ej('brecha'); cerca(b.br, -6, 1e-12, 'brecha'); cerca(b.Y, 1316, 1e-9, 'PIB');
    // Phillips: 2 − 0,5 · (3 − 5) = 3 %; con shock 2 − 0,5 + 4 = 5,5 %
    cerca(ej('phillips').pi, 3, 1e-12, 'inflación'); cerca(ej('estanflacion').pi, 5.5, 1e-12, 'estanflación');
    // datos: medias 6,3 y 3,48; Suu = 5,29 + 1,69 + … + 7,29 = 23,1 → b = Suπ/Suu
    const d = ej('datos'), u = [4, 5, 6.5, 8, 7, 5.5, 4.5, 6, 7.5, 9], p = [5.1, 4.2, 3.4, 2.3, 3.1, 3.9, 4.9, 3.2, 2.9, 1.8];
    const mu = 6.3, mp = 3.48, suu = u.reduce((s, x) => s + (x - mu) ** 2, 0), sup = u.reduce((s, x, i) => s + (x - mu) * (p[i] - mp), 0);
    cerca(suu, 23.1, 1e-9, 'Suu'); cerca(d.b, sup / suu, 1e-12, 'pendiente'); cerca(d.a, mp - (sup / suu) * mu, 1e-12, 'ordenada');
    if (!(d.r < -0.95)) mal(`${N}: la correlación de los datos debería ser muy negativa (${d.r})`);
    error({ modo: 'okun', busca: 'paro', u0: '14', g: '', gp: '2', beta: '0,5' }, 'sin crecimiento');
    error({ modo: 'okun', busca: 'paro', u0: '1', g: '20', gp: '2', beta: '0,5' }, 'paro negativo');
    error({ modo: 'datos', datos: '5 3\n6 2' }, 'solo dos años');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, Okun en los dos sentidos, brecha, Phillips con shock, ajuste a datos y errores`);
  }
  return Com.navegador({ publico, carpeta: 'phillips-okun', nombre: N, app: 'PhillipsOkunApp', C, pagina, mal, malo: { k: 'beta', v: '0' } });
};
