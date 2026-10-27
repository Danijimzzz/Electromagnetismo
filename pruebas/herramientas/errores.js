/* Comprobación de Propagación de errores: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo errores). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Propagación de errores';
  const C = require(path.join(fuente, 'errores', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // péndulo: g = 4π²·1/2,006² = 9,8107; ∂g/∂l = g/l, ∂g/∂T = −2g/T ⇒ Δg = √((9,8107·0,001)² + (9,7813·0,005)²) = 0,0499 ⇒ (9,81 ± 0,05)
    const g = 4 * Math.PI ** 2 / 2.006 ** 2, p = ej('pendulo');
    cerca(p.v, g, 1e-9, 'g del péndulo'); cerca(p.d, Math.hypot(g * 0.001, (2 * g / 2.006) * 0.005), 1e-12, 'Δg');
    if (p.R.txt !== '9,81 ± 0,05') mal(`${N}: el péndulo da ${p.R.txt}`);
    // Ohm con cota lineal: ΔR = 0,1/0,25 + 12·0,005/0,25² = 0,4 + 0,96 = 1,36 ⇒ (48,0 ± 1,4)
    const o = ej('ohm'); cerca(o.d, 1.36, 1e-12, 'ΔR lineal'); if (o.R.txt !== '48,0 ± 1,4') mal(`${N}: Ohm da ${o.R.txt}`);
    // densidad: ρ = 4·45,32/(π·1,25²·4,3) = 8,588; error relativo √(… + (2·0,005/1,25)² + (0,05/4,3)²)
    const d = ej('densidad'), rel = Math.hypot(0.01 / 45.32, 2 * 0.005 / 1.25, 0.05 / 4.3);
    cerca(d.v, 4 * 45.32 / (Math.PI * 1.25 ** 2 * 4.3), 1e-9, 'densidad'); cerca(d.rel, rel, 1e-12, 'error relativo de la densidad');
    // serie de medidas: media 2,003; Δ = √((s/√10)² + 0,01²)
    const xs = [2.01, 1.98, 2.03, 2.00, 1.97, 2.02, 1.99, 2.04, 2.00, 1.99], m = xs.reduce((a, x) => a + x) / 10, s = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / 9);
    const t = ej('tiempos'); cerca(t.m, 2.003, 1e-12, 'media'); cerca(t.d, Math.hypot(s / Math.sqrt(10), 0.01), 1e-12, 'error de la serie');
    // redondeo: 0,0996 → 0,10; 0,0149 → 0,015; 0,0196 → 0,02; 234 ± 17,2 → 234 ± 17
    for (const [v, e, txt] of [[1.23456, 0.0996, '1,23 ± 0,10'], [1.23456, 0.0149, '1,235 ± 0,015'], [1.23456, 0.0196, '1,23 ± 0,02'], [234.4, 17.2, '234 ± 17'], [5432, 260, '5400 ± 300']]) {
      const r = C.redondea(v, e).txt; if (r !== txt) mal(`${N}: redondear ${v} ± ${e} da ${r} y no ${txt}`);
    }
    error({ modo: 'formula', f: 'x y', vars: 'x 1 0,1' }, 'una variable sin dar');
    error({ modo: 'formula', f: 'x', vars: 'x 1' }, 'una variable sin incertidumbre');
    error({ modo: 'formula', f: 'x', vars: 'x 1 0,1\nx 2 0,1' }, 'una variable repetida');
    error({ modo: 'medidas', datos: '3' }, 'una sola medida');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, cuadrática y lineal, serie de medidas, redondeo y errores`);
  }
  return Com.navegador({ publico, asignatura: 'estadistica', carpeta: 'errores', nombre: N, app: 'ErroresApp', C, pagina, mal, malo: { k: 'vars', v: 'l 1' } });
};
