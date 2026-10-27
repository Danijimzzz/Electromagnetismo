/* Comprobación de Regresión sobre datos económicos: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo regresion-economia). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Regresión económica';
  const C = require(path.join(fuente, 'regresion-economia', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // mínimos cuadrados a mano: b = Sxy/Sxx y a = ȳ − b·x̄, en las variables del modelo
    const mco = (u, w) => { const n = u.length, mu = u.reduce((s, v) => s + v) / n, mw = w.reduce((s, v) => s + v) / n; let sxx = 0, sxy = 0; u.forEach((v, i) => { sxx += (v - mu) ** 2; sxy += (v - mu) * (w[i] - mw); }); const b = sxy / sxx; return { b, a: mw - b * mu }; };
    // consumo: x = 10…40, Sxx = 700, Sxy = 511 ⇒ b = 0,73 exacto, a = 20,557 − 0,73·25 = 2,3071
    const c = ej('consumo'); cerca(c.b, 0.73, 1e-12, 'PMgC'); cerca(c.a, 2.30714, 1e-4, 'consumo autónomo'); cerca(c.y0, 2.30714 + 0.73 * 45, 1e-4, 'consumo con renta 45');
    cerca(c.elast, (0.73 * 25) / (143.9 / 7), 1e-9, 'elasticidad en la media');
    const dem = ej('demanda'), l = mco([2, 2.5, 3, 3.5, 4, 4.5, 5].map(Math.log), [520, 410, 330, 280, 240, 210, 185].map(Math.log));
    cerca(dem.b, l.b, 1e-12, 'elasticidad de la demanda'); cerca(dem.b, -1.1279, 1e-4, 'elasticidad de la demanda (4 cifras)'); cerca(dem.y0, Math.exp(l.a) * 6 ** l.b, 1e-9, 'demanda a 6 €');
    const pib = ej('pib'); cerca(pib.crec, Math.exp(pib.b) - 1, 1e-12, 'crecimiento'); cerca(100 * pib.crec, 1.383, 1e-3, 'crecimiento anual del PIB en %');
    // t de la pendiente del consumo con 5 grados de libertad: p muy pequeño
    if (!(c.pval < 1e-6)) mal(`${N}: el p-valor del consumo debería ser casi 0 (${c.pval})`);
    error({ modelo: 'lineal', datos: '1 2\n2 3' }, 'con 2 observaciones');
    error({ modelo: 'loglog', datos: '1 2\n0 3\n3 4' }, 'un ln de 0');
    error({ modelo: 'lineal', datos: '1 2\n1 3\n1 4' }, 'una X constante');
    error({ modelo: 'lineal', datos: '1 2\n2 a\n3 4' }, 'una letra en los datos');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, efecto marginal, elasticidad, crecimiento y errores`);
  }
  return Com.navegador({ publico, carpeta: 'regresion-economia', nombre: N, app: 'RegresionEconomiaApp', C, pagina, mal, malo: { k: 'datos', v: '1 2' } });
};
