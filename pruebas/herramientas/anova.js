/* Comprobación de ANOVA de un factor: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo anova). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'ANOVA de un factor';
  const C = require(path.join(fuente, 'anova', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // abonos: medias 21, 25 y 29, media global 25; SC_E = 5(16 + 0 + 16) = 160; SC_D = 10 + 10 + 10 = 30; CM_E = 80; CM_D = 2,5; F = 32
    const r = ej('abonos');
    cerca(r.SSB, 160, 1e-9, 'abonos: SC entre'); cerca(r.SSW, 30, 1e-9, 'abonos: SC dentro'); cerca(r.F, 32, 1e-9, 'abonos: F');
    if (r.glB !== 2 || r.glW !== 12) mal(`${N} · abonos: grados de libertad ${r.glB} y ${r.glW}`);
    cerca(r.eta2, 160 / 190, 1e-9, 'abonos: η²');
    cerca(r.crit, 3.8853, 1e-3, 'abonos: F crítico (tabla: F₂,₁₂;0,95 = 3,885)');
    // para d1 = 2, la cola de la F es (1 + 2F/d2)^(−d2/2) exacta
    cerca(r.pv, (1 + (2 * 32) / 12) ** -6, 1e-12, 'abonos: p-valor');
    // t = (21 − 25)/√(2,5 · 2/5) = −4 con 12 g. l.: p bilateral 0,001762; Bonferroni × 3
    cerca(r.pares[0].t, -4, 1e-9, 'abonos: t de A − B'); cerca(r.pares[0].p, 3 * 0.0017621, 2e-5, 'abonos: p de Bonferroni');
    if (!r.rechaza) mal(`${N} · abonos: debería rechazar H₀`);
    // iguales: se compara con otro cálculo (sumas de cuadrados con la fórmula corta)
    const q = ej('iguales'), g = [[10.2, 9.8, 10.1, 10.0], [10.1, 10.3, 9.9, 10.2], [9.9, 10.0, 10.2, 10.1], [10.0, 10.1, 9.8, 10.3]], todo = g.flat(), T = todo.reduce((a, b) => a + b, 0), cf = (T * T) / 16;
    const sct = todo.reduce((a, b) => a + b * b, 0) - cf, sce = g.reduce((a, v) => a + v.reduce((s, x) => s + x, 0) ** 2 / 4, 0) - cf;
    cerca(q.SSB, sce, 1e-9, 'iguales: SC entre'); cerca(q.SST, sct, 1e-9, 'iguales: SC total'); cerca(q.F, (sce / 3) / ((sct - sce) / 12), 1e-9, 'iguales: F');
    if (q.rechaza) mal(`${N} · iguales: no debería rechazar H₀`);
    // dos grupos: F = t² con t = 4 y 8 g. l.
    const d = ej('dos'); cerca(d.F, 16, 1e-9, 'dos grupos: F = t²'); cerca(d.pv, 0.0039498, 1e-6, 'dos grupos: p-valor de t = 4 con 8 g. l.');
    error({ alfa: '0,05', datos: '1 2 3' }, 'un solo grupo');
    error({ alfa: '0,05', datos: '1\n2' }, 'grupos de un dato (sin variabilidad dentro)');
    error({ alfa: '0,05', datos: '5 5 5\n6 6 6' }, 'varianza dentro nula');
    error({ alfa: '0,05', datos: '1 2 a\n3 4 5' }, 'dato que no es un número');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos y errores`);
  }
  return Com.navegador({ publico, asignatura: 'estadistica', carpeta: 'anova', nombre: N, app: 'AnovaApp', C, pagina, mal, malo: { k: 'alfa', v: '7' } });
};
