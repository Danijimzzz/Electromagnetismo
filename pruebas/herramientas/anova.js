/* Comprobación de ANOVA de uno y dos factores: cálculos en Node (contra scipy y statsmodels, ver
   pruebas/referencias/estadistica.py) y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo anova). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'ANOVA';
  const C = require(path.join(fuente, 'anova', 'calculo.js')), IN = require(path.join(fuente, 'estadistica', 'inferencia.js'));
  const REF = JSON.parse(fs.readFileSync(path.join(fuente, '..', 'pruebas', 'referencias', 'estadistica.json'), 'utf8'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    const rel = (a, b, tol, q) => cerca(a / (b || 1), 1, tol, q);
    // abonos: medias 21, 25 y 29, media global 25; SC_E = 5(16 + 0 + 16) = 160; SC_D = 10 + 10 + 10 = 30; CM_E = 80; CM_D = 2,5; F = 32
    const r = ej('abonos');
    cerca(r.SSB, 160, 1e-9, 'abonos: SC entre'); cerca(r.SSW, 30, 1e-9, 'abonos: SC dentro'); cerca(r.F, 32, 1e-9, 'abonos: F');
    if (r.glB !== 2 || r.glW !== 12) mal(`${N} · abonos: grados de libertad ${r.glB} y ${r.glW}`);
    cerca(r.eta2, 160 / 190, 1e-9, 'abonos: η²');
    cerca(r.om2, (160 - 2 * 2.5) / (190 + 2.5), 1e-9, 'abonos: ω² = (SC_E − (k−1)CM_D)/(SC_T + CM_D)');
    cerca(r.fC, Math.sqrt((160 / 190) / (1 - 160 / 190)), 1e-9, 'abonos: f de Cohen');
    cerca(r.crit, 3.8853, 1e-3, 'abonos: F crítico (tabla: F₂,₁₂;0,95 = 3,885)');
    // para d1 = 2, la cola de la F es (1 + 2F/d2)^(−d2/2) exacta
    cerca(r.pv, (1 + (2 * 32) / 12) ** -6, 1e-12, 'abonos: p-valor');
    if (!r.rechaza) mal(`${N} · abonos: debería rechazar H₀`);
    // contraste 2, −1, −1: ψ = 2·21 − 25 − 29 = −12; EE = √(2,5 · 6/5) = √3; t = −12/√3
    cerca(r.contr[0].psi, -12, 1e-9, 'abonos: ψ del contraste'); cerca(r.contr[0].t, -12 / Math.sqrt(3), 1e-9, 'abonos: t del contraste'); cerca(r.contr[0].p, 1.586602024029914e-5, 1e-9, 'abonos: p del contraste (statsmodels)');
    // Tukey con tamaños iguales: q = |dif|/√(CM_D/n); A − B: 4/√0,5 = 5,657
    cerca(r.pares[0].est, 4 / Math.sqrt(0.5), 1e-9, 'abonos: q de A − B');
    // iguales: se compara con otro cálculo (sumas de cuadrados con la fórmula corta)
    const q = ej('iguales'), g = [[10.2, 9.8, 10.1, 10.0], [10.1, 10.3, 9.9, 10.2], [9.9, 10.0, 10.2, 10.1], [10.0, 10.1, 9.8, 10.3]], todo = g.flat(), T = todo.reduce((a, b) => a + b, 0), cf = (T * T) / 16;
    const sct = todo.reduce((a, b) => a + b * b, 0) - cf, sce = g.reduce((a, v) => a + v.reduce((s, x) => s + x, 0) ** 2 / 4, 0) - cf;
    cerca(q.SSB, sce, 1e-9, 'iguales: SC entre'); cerca(q.SST, sct, 1e-9, 'iguales: SC total'); cerca(q.F, (sce / 3) / ((sct - sce) / 12), 1e-9, 'iguales: F');
    if (q.rechaza) mal(`${N} · iguales: no debería rechazar H₀`);
    // dos grupos: F = t² con t = 4 y 8 g. l.
    const d = ej('dos'); cerca(d.F, 16, 1e-9, 'dos grupos: F = t²'); cerca(d.pv, 0.0039498, 1e-6, 'dos grupos: p-valor de t = 4 con 8 g. l.');

    // ---- rango studentizado contra scipy.stats.studentized_range ----
    for (const t of REF.tukey_q) rel(IN.qtukey(t.p, t.k, t.nu), t.q, 1e-8, `qtukey(${t.p}; ${t.k}, ${t.nu})`);
    for (const t of REF.tukey_p) cerca(IN.ptukey(t.q, t.k, t.nu), t.cdf, 1e-8, `ptukey(${t.q}; ${t.k}, ${t.nu})`);
    // para k = 2, q = √2·t (identidad exacta)
    cerca(IN.qtukey(0.95, 2, 10), Math.SQRT2 * 2.2281388519649385, 1e-7, 'qtukey con k = 2 es √2·t');
    // ---- grupos de tamaño distinto: Tukey-Kramer, Bonferroni, Holm, Scheffé, Games-Howell, Welch, supuestos ----
    const R = REF.anova_desiguales, datos = Object.entries(R.datos).map(([n, v]) => `${n}: ${v.join(' ')}`).join('\n');
    const base = { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'no', contrastes: '', datos };
    for (const [met, ref] of [['tukey', R.tukey_p], ['bonferroni', R.bonferroni_p], ['holm', R.holm_p], ['scheffe', R.scheffe_p], ['gh', R.gh_p]]) {
      const s = C.resolver({ ...base, post: met });
      ref.forEach((p, i) => cerca(s.pares[i].p, p, 1e-7, `${met}: p de la pareja ${i + 1}`));
      if (met === 'tukey') ref.forEach((_, i) => { cerca(s.pares[i].lo, R.tukey_lo[i], 1e-6, `tukey: extremo inferior ${i + 1}`); cerca(s.pares[i].hi, R.tukey_hi[i], 1e-6, `tukey: extremo superior ${i + 1}`); });
    }
    const s = C.resolver({ ...base, prueba: 'welch' });
    cerca(s.wel.F, R.welch.F, 1e-9, 'Welch: F'); cerca(s.wel.p, R.welch.p, 1e-9, 'Welch: p'); cerca(s.wel.gl2, R.welch.gl2, 1e-9, 'Welch: g. l.');
    if (!s.usaW || s.p !== s.wel.p) mal(`${N}: con la prueba de Welch el p-valor principal debería ser el de Welch`);
    cerca(s.sup.levene.W, R.levene_mediana[0], 1e-9, 'Levene (mediana): W'); cerca(s.sup.levene.p, R.levene_mediana[1], 1e-9, 'Levene (mediana): p');
    const lm = IN.levene(Object.values(R.datos), 'media'); cerca(lm.W, R.levene_media[0], 1e-9, 'Levene (media): W'); cerca(lm.p, R.levene_media[1], 1e-9, 'Levene (media): p');
    cerca(s.sup.bartlett.B, R.bartlett[0], 1e-9, 'Bartlett: B'); cerca(s.sup.bartlett.p, R.bartlett[1], 1e-9, 'Bartlett: p');
    // Games-Howell con dos grupos coincide con la t de Welch (q = √2·|t|)
    const dosW = C.resolver({ ...base, post: 'gh', datos: 'A: 20 21 23 19 22\nB: 29 28 31 27 30 40 12' }), tw = dosW.pares[0];
    cerca(tw.p, 2 * require(path.join(fuente, 'estadistica', 'calculo.js')).DIST.t.sf({ nu: tw.gl }, Math.abs(tw.dif / Math.sqrt(dosW.g[0].s2 / 5 + dosW.g[1].s2 / 7))), 1e-8, 'Games-Howell con 2 grupos = t de Welch');
    // supuestos: normalidad (Shapiro-Wilk de scipy y Jarque-Bera) con los 13 datos de la referencia
    const x13 = [2.1, 3.4, 1.9, 5.6, 4.4, 3.8, 2.7, 9.1, 3.3, 4.0, 2.2, 3.1, 6.5];
    for (const [nn, [W, p]] of Object.entries(REF.shapiro)) { const t = IN.shapiro(x13.slice(0, +nn)); cerca(t.W, W, 1e-9, `Shapiro-Wilk W con n = ${nn}`); cerca(t.p, p, 1e-8, `Shapiro-Wilk p con n = ${nn}`); }
    const big = IN.shapiro(REF.shapiro_grande.x); cerca(big.W, REF.shapiro_grande.res[0], 1e-9, 'Shapiro-Wilk W (n = 300)'); cerca(big.p, REF.shapiro_grande.res[1], 1e-7, 'Shapiro-Wilk p (n = 300)');
    const jb = IN.jarqueBera(x13); cerca(jb.JB, REF.jarque_bera[0], 1e-9, 'Jarque-Bera'); cerca(jb.p, REF.jarque_bera[1], 1e-9, 'Jarque-Bera: p');
    // ---- dos factores contra statsmodels (anova_lm, tipo II = tipo III en un diseño equilibrado) ----
    const dd = ej('dos-factores'), A2 = REF.anova_dos;
    dd.ef.forEach((e, i) => { cerca(e.SS, A2.SS[i], 1e-9, `dos factores: SC ${i}`); cerca(e.F, A2.F[i], 1e-9, `dos factores: F ${i}`); cerca(e.p, A2.p[i], 1e-9 + 1e-6 * A2.p[i], `dos factores: p ${i}`); });
    cerca(dd.SSE, A2.SS[3], 1e-9, 'dos factores: SC error'); cerca(dd.glE, 12, 0, 'dos factores: g. l. del error'); cerca(dd.sh.W, A2.shapiro_residuos[0], 1e-9, 'dos factores: Shapiro de los residuos');
    cerca(dd.ef[0].eta2p, A2.SS[0] / (A2.SS[0] + A2.SS[3]), 1e-9, 'dos factores: η² parcial de A');
    cerca(dd.ef[0].om2p, (2 * (A2.F[0] - 1)) / (2 * (A2.F[0] - 1) + 18), 1e-9, 'dos factores: ω² parcial de A');
    if (!dd.paresA.length) mal(`${N}: el ejemplo de dos factores debería traer las comparaciones de Tukey`);
    const sr = ej('sin-replicas'), A3 = REF.anova_dos_sin_replicas;
    cerca(sr.ef[0].F, A3.F[0], 1e-9, 'sin réplicas: F de A'); cerca(sr.ef[1].F, A3.F[1], 1e-9, 'sin réplicas: F de B'); cerca(sr.ef[0].p, A3.p[0], 1e-9, 'sin réplicas: p de A');
    if (sr.inter || sr.repl) mal(`${N}: sin réplicas no hay interacción`);
    // ---- errores claros ----
    error({ alfa: '0,05', datos: '1 2 3' }, 'un solo grupo');
    error({ alfa: '0,05', datos: '1\n2' }, 'grupos de un dato (sin variabilidad dentro)');
    error({ alfa: '0,05', datos: '5 5 5\n6 6 6' }, 'varianza dentro nula');
    error({ alfa: '0,05', datos: '1 2 a\n3 4 5' }, 'dato que no es un número');
    error({ ...base, contrastes: 'x: 1 1 1' }, 'contraste que no suma 0');
    error({ ...base, contrastes: 'x: 1 -1' }, 'contraste con menos coeficientes que grupos');
    error({ ...base, post: 'gh', datos: 'A: 1\nB: 2 3 4' }, 'Games-Howell con un grupo de un dato');
    error({ ...base, prueba: 'welch', datos: 'A: 1 1 1\nB: 2 3 4' }, 'Welch con un grupo constante');
    error({ modo: 'dos', alfa: '0,05', datos: 'A1 / B1: 1 2\nA1 / B2: 2 3\nA2 / B1: 3 4' }, 'dos factores con una casilla que falta');
    error({ modo: 'dos', alfa: '0,05', datos: 'A1 / B1: 1 2\nA1 / B2: 2 3\nA2 / B1: 3 4\nA2 / B2: 5' }, 'dos factores desequilibrado');
    error({ modo: 'dos', alfa: '0,05', datos: 'A1 / B1: 1 2\nA1 / B2: 2 3\nA1 / B1: 3 4' }, 'casilla repetida');
    error({ modo: 'dos', alfa: '0,05', datos: 'A1 B1: 1 2' }, 'línea sin barra');
    error({ modo: 'dos', alfa: '0,05', datos: 'A1 / B1: 2 2\nA1 / B2: 3 3\nA2 / B1: 4 4\nA2 / B2: 5 5' }, 'dos factores sin variación dentro de las casillas');
    // el estado antiguo (sin modo ni prueba) se sigue entendiendo
    const viejo = C.resolver({ alfa: '0,05', post: 'bonferroni', datos: 'A: 20 21 23 19 22\nB: 24 26 25 27 23\nC: 29 28 31 27 30' });
    cerca(viejo.pares[0].p, 3 * 0.0017621, 2e-5, 'estado antiguo: p de Bonferroni de A − B (t = −4 con 12 g. l., ×3)');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, Tukey/Holm/Scheffé/Games-Howell/Welch/Shapiro contra scipy y dos factores contra statsmodels, y errores`);
  }
  return Com.navegador({ publico, asignatura: 'estadistica', carpeta: 'anova', nombre: N, app: 'AnovaApp', C, pagina, mal, malo: { k: 'alfa', v: '7' } });
};
