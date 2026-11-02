/* Comprobación de Regresión lineal múltiple: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo regresion-multiple). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Regresión lineal múltiple';
  const C = require(path.join(fuente, 'regresion-multiple', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // otro método: ecuaciones normales con las variables sin centrar y la regla de Cramer (3 × 3)
    const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const cramer = (filas) => {
      const n = filas.length, X = filas.map((r) => [1, r[0], r[1]]), y = filas.map((r) => r[2]);
      const A = [0, 1, 2].map((i) => [0, 1, 2].map((j) => X.reduce((s, r) => s + r[i] * r[j], 0))), c = [0, 1, 2].map((i) => X.reduce((s, r, k) => s + r[i] * y[k], 0)), D = det3(A);
      return [0, 1, 2].map((j) => det3(A.map((fl, i) => fl.map((v, k) => (k === j ? c[i] : v)))) / D);
    };
    const nums = (t) => t.trim().split('\n').slice(1).map((l) => l.trim().split(/\s+/).map((v) => +v.replace(',', '.')));
    const v = ej('ventas'), bv = cramer(nums(C.ejemplos[0].sc.datos));
    bv.forEach((b, j) => cerca(v.b[j], b, 1e-9, `ventas: coeficiente ${j}`));
    // R² = 1 − SC_R/SC_T con los residuos del plano de Cramer, y R² ajustado y F a partir de él
    const fl = nums(C.ejemplos[0].sc.datos), ym = fl.reduce((s, r) => s + r[2], 0) / 8, sst = fl.reduce((s, r) => s + (r[2] - ym) ** 2, 0), sse = fl.reduce((s, r) => s + (r[2] - bv[0] - bv[1] * r[0] - bv[2] * r[1]) ** 2, 0);
    cerca(v.R2, 1 - sse / sst, 1e-9, 'ventas: R²'); cerca(v.R2aj, 1 - (sse / 5) / (sst / 7), 1e-9, 'ventas: R² ajustado'); cerca(v.Fg, ((sst - sse) / 2) / (sse / 5), 1e-6, 'ventas: F global');
    if (v.gl !== 5) mal(`${N} · ventas: ${v.gl} grados de libertad en vez de 5`);
    // el error de los coeficientes de este caso: s² (XᵀX)⁻¹; se comprueba la constante con el cofactor
    const X3 = fl.map((r) => [1, r[0], r[1]]), A3 = [0, 1, 2].map((i) => [0, 1, 2].map((j) => X3.reduce((s, r) => s + r[i] * r[j], 0))), D3 = det3(A3);
    const cof00 = A3[1][1] * A3[2][2] - A3[1][2] * A3[2][1], cof11 = A3[0][0] * A3[2][2] - A3[0][2] * A3[2][0], cof22 = A3[0][0] * A3[1][1] - A3[0][1] * A3[1][0];
    [cof00, cof11, cof22].forEach((cf, j) => cerca(v.coefs[j].se, Math.sqrt((sse / 5) * cf / D3), 1e-9, `ventas: error del coeficiente ${j}`));
    cerca(v.coefs[1].t, v.coefs[1].b / v.coefs[1].se, 1e-9, 'ventas: t'); cerca(v.coefs[1].p, 2 * 0.5 * (1 - 0), 1, 'ventas: p ≤ 1');
    // predicción para (6, 8): ŷ = b₀ + 6 b₁ + 8 b₂
    cerca(v.pred.yh, bv[0] + 6 * bv[1] + 8 * bv[2], 1e-9, 'ventas: predicción');
    if (!(v.pred.eI > v.pred.eM)) mal(`${N} · ventas: el intervalo de un valor individual debe ser más ancho que el de la media`);
    // notas (3 variables): se comprueba con el residuo de las ecuaciones normales XᵀX b = Xᵀy
    const nt = ej('notas'), fn = nums(C.ejemplos[1].sc.datos);
    for (let j = 0; j < 4; j++) { const col = (r) => (j ? r[j - 1] : 1); const g = fn.reduce((s, r) => s + col(r) * (r[3] - nt.b[0] - nt.b[1] * r[0] - nt.b[2] * r[1] - nt.b[3] * r[2]), 0); cerca(g, 0, 1e-8, `notas: ecuación normal ${j}`); }
    // años 2015–2024: la tendencia es de unos 1,95 por año; con los datos sin centrar un cálculo ingenuo falla
    const an = ej('tendencia'); cerca(an.b[1], 1.95406, 1e-4, 'tendencia: coeficiente del año'); if (!(an.R2 > 0.98)) mal(`${N} · tendencia: R² = ${an.R2}`);
    // regresión simple como caso particular: Y = 2X exacta más una perturbación conocida
    const s1 = C.resolver({ alfa: '0,05', nivel: '95', datos: 'x y\n1 2,1\n2 3,9\n3 6,2\n4 7,8' });
    cerca(s1.b[1], 1.94, 1e-9, 'simple: pendiente = Sxy/Sxx = 9,7/5'); cerca(s1.b[0], 5 - 1.94 * 2.5, 1e-9, 'simple: constante');
    error({ alfa: '0,05', nivel: '95', datos: 'x1 x2 y\n1 2 3\n2 4 5\n3 6 8\n4 8 9\n5 10 12' }, 'multicolinealidad perfecta');
    error({ alfa: '0,05', nivel: '95', datos: 'x1 x2 y\n1 2 3\n2 3 5\n3 5 8' }, 'pocas observaciones');
    error({ alfa: '0,05', nivel: '95', datos: 'x y\n1 2\n1 3\n1 4' }, 'variable constante');
    error({ alfa: '0,05', nivel: '95', datos: 'x1 x2 y\n1 2 3\n2 3\n3 5 8\n4 5 6' }, 'fila con menos números');
    error({ alfa: '0,05', nivel: '95', x0: '1', datos: 'x1 x2 y\n1 2 3\n2 4 5\n3 1 8\n4 2 9\n5 5 12' }, 'predicción con un valor de menos');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos y errores`);
  }
  return Com.navegador({ publico, asignatura: 'estadistica', carpeta: 'regresion-multiple', nombre: N, app: 'RegresionMultipleApp', C, pagina, mal, malo: { k: 'nivel', v: '150' } });
};
