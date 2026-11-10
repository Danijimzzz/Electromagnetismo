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
    // correlación: P = 2(a + b), ∂P/∂a = ∂P/∂b = 2 ⇒ ΔP² = 2·(2·0,05)² + 2·2·2·0,9·0,05² = 0,02 + 0,018
    const co = ej('correlacion'); cerca(co.d, Math.sqrt(0.038), 1e-12, 'ΔP con correlación'); cerca(co.dIndep, Math.sqrt(0.02), 1e-12, 'ΔP independiente'); if (co.R.txt !== '41,20 ± 0,19') mal(`${N}: el perímetro correlacionado da ${co.R.txt}`);
    // una resta con r = 1 y errores iguales se compensa del todo; con r = −1 se suman: 0,1 + 0,1
    cerca(C.resolver({ modo: 'formula', f: 'a - b', vars: 'a 10 0,1\nb 4 0,1', corr: 'a b 1' }).d, 0, 1e-12, 'resta con r = 1');
    cerca(C.resolver({ modo: 'formula', f: 'a - b', vars: 'a 10 0,1\nb 4 0,1', corr: 'r(a, b) = −1' }).d, 0.2, 1e-12, 'resta con r = −1');
    // la covarianza dada directamente: cov = 0,005 = 0,5·0,1·0,1 ⇒ Δ(a + b)² = 0,02 + 2·0,005
    cerca(C.resolver({ modo: 'formula', f: 'a + b', vars: 'a 10 0,1\nb 4 0,1', corr: 'cov a b 0,005' }).d, Math.sqrt(0.03), 1e-12, 'suma con covarianza');
    // comparación con el aceptado: z = (g − 9,80665)/Δg = 0,080 ⇒ compatible; con 9,60 ± 0,03: (9,8107 − 9,60)/√(0,0499² + 0,03²) = 3,6 ⇒ incompatible
    const ac = ej('aceptado'); cerca(ac.comp.z, (g - 9.80665) / p.d, 1e-9, 'z con el valor aceptado'); if (ac.comp.nivel !== 'compatible') mal(`${N}: g del péndulo sale «${ac.comp.nivel}»`);
    const inc = C.resolver({ ...C.ejemplos.find((e) => e.clave === 'aceptado').sc, acept: '9,60', dacept: '0,03' }); cerca(inc.comp.z, (g - 9.6) / Math.hypot(p.d, 0.03), 1e-9, 'z con incertidumbre del aceptado'); if (inc.comp.nivel !== 'incompatible') mal(`${N}: 3,6 σ sale «${inc.comp.nivel}»`);
    // media ponderada: pesos 1/0,03², 1/0,02², 1/0,05² = 1111,1; 2500; 400 ⇒ x̄ = 39356,4/4011,1 = 9,8119; σ = 1/√4011,1 = 0,01579
    const W = 1 / 0.0009 + 1 / 0.0004 + 1 / 0.0025, mp = (9.79 / 0.0009 + 9.83 / 0.0004 + 9.76 / 0.0025) / W, chi = ((9.79 - mp) / 0.03) ** 2 + ((9.83 - mp) / 0.02) ** 2 + ((9.76 - mp) / 0.05) ** 2;
    const po = ej('ponderada'); cerca(po.m, mp, 1e-12, 'media ponderada'); cerca(po.dInt, 1 / Math.sqrt(W), 1e-12, 'σ de la media ponderada'); cerca(po.red, chi / 2, 1e-9, 'χ² reducido'); cerca(po.d, Math.sqrt(chi / 2 / W), 1e-12, 'σ ampliada');
    if (po.R.txt !== '9,812 ± 0,017') mal(`${N}: la media ponderada da ${po.R.txt}`);
    // medidas iguales en error: la ponderada es la media normal y, si concuerdan, no se amplía
    const ig = C.resolver({ modo: 'ponderada', pond: '10,0 ± 0,2\n10,1 ± 0,2' }); cerca(ig.m, 10.05, 1e-12, 'ponderada con errores iguales'); cerca(ig.d, 0.2 / Math.SQRT2, 1e-12, 'σ sin ampliar'); if (ig.amplia) mal(`${N}: amplía el error con χ² reducido ${ig.red}`);
    error({ modo: 'formula', f: 'a + b', vars: 'a 1 0,1\nb 1 0,1', corr: 'a b 1,5' }, 'correlación mayor que 1');
    error({ modo: 'formula', f: 'a + b', vars: 'a 1 0,1\nb 1 0,1', corr: 'a c 0,5' }, 'correlación con una variable que no existe');
    error({ modo: 'formula', f: 'a + b', vars: 'a 1 0,1\nb 1 0,1', corr: 'cov a b 0,5' }, 'covarianza imposible');
    error({ modo: 'ponderada', pond: '9,8 0,1' }, 'una sola medida ponderada');
    error({ modo: 'ponderada', pond: '9,8 0,1\n9,7 0' }, 'medida ponderada sin error');
    error({ modo: 'medidas', datos: '3 4 5', acept: 'x' }, 'valor aceptado que no es un número');
    error({ modo: 'formula', f: 'x y', vars: 'x 1 0,1' }, 'una variable sin dar');
    error({ modo: 'formula', f: 'x', vars: 'x 1' }, 'una variable sin incertidumbre');
    error({ modo: 'formula', f: 'x', vars: 'x 1 0,1\nx 2 0,1' }, 'una variable repetida');
    error({ modo: 'medidas', datos: '3' }, 'una sola medida');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, cuadrática y lineal, correlaciones, media ponderada, valor aceptado, serie de medidas, redondeo y errores`);
  }
  return Com.navegador({ publico, asignatura: 'estadistica', carpeta: 'errores', nombre: N, app: 'ErroresApp', C, pagina, mal, malo: { k: 'vars', v: 'l 1' } });
};
