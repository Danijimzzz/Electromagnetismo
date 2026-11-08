/* Comprobación de Contrastes no paramétricos: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo no-parametricos). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Contrastes no paramétricos';
  const C = require(path.join(fuente, 'no-parametricos', 'calculo.js')), IN = require(path.join(fuente, 'estadistica', 'inferencia.js'));
  const REF = JSON.parse(fs.readFileSync(path.join(fuente, '..', 'pruebas', 'referencias', 'estadistica.json'), 'utf8'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // otra forma de calcular el p-valor exacto: se recorren todos los repartos de los rangos 1..N entre las dos muestras
    const exactoMW = (n1, N, u, h1) => {
      let le = 0, ge = 0, tot = 0; const rec = (i, k, s) => { if (k === 0) { const U = s - (n1 * (n1 + 1)) / 2; tot++; if (U <= u) le++; if (U >= u) ge++; return; } if (i > N) return; rec(i + 1, k - 1, s + i); rec(i + 1, k, s); };
      rec(1, n1, 0); return h1 === 'mayor' ? ge / tot : h1 === 'menor' ? le / tot : Math.min(1, (2 * Math.min(le, ge)) / tot);
    };
    // métodos: rangos de la muestra 1 = 6, 8, 9, 10, 11 → R₁ = 44, U₁ = 44 − 15 = 29, U₂ = 1; p = 2 · 2/462
    const m = ej('metodos');
    cerca(m.R1, 44, 1e-9, 'métodos: R₁'); cerca(m.U1, 29, 1e-9, 'métodos: U₁'); cerca(m.U2, 1, 1e-9, 'métodos: U₂');
    cerca(m.p, 4 / 462, 1e-12, 'métodos: p exacto'); cerca(m.p, exactoMW(5, 11, 29, 'dos'), 1e-12, 'métodos: p exacto (recuento directo)');
    if (!m.exacto || !m.rechaza) mal(`${N} · métodos: debería ser exacto y rechazar H₀`);
    // empates: rangos medios 3 (×3), 6,5 (×4), 11 (×5), 14,5 (×2); R₁ = 79,5; U₁ = 43,5; μ = 32; σ² = 64/12 · (17 − 210/240) = 86; z = (43,5 − 32 − 0,5)/σ
    const e = ej('empates');
    cerca(e.U1, 43.5, 1e-9, 'empates: U₁'); cerca(e.sigma, Math.sqrt(86), 1e-9, 'empates: σ con empates'); cerca(e.z, 11 / Math.sqrt(86), 1e-9, 'empates: z'); cerca(e.p, 0.1178, 2e-4, 'empates: p (cola derecha de z = 1,186)');
    if (e.exacto) mal(`${N} · empates: con empates no debe usar el p exacto`);
    // dieta: d = 4, 6, 2, −1, 7, 0, 8, 11 → n = 7, W⁻ = 1, W⁺ = 27; P(W⁺ ≥ 27) = 2/2⁷
    const d = ej('dieta');
    cerca(d.n, 7, 0, 'dieta: n sin la diferencia 0'); cerca(d.Wp, 27, 1e-9, 'dieta: W⁺'); cerca(d.Wm, 1, 1e-9, 'dieta: W⁻'); cerca(d.p, 2 / 128, 1e-12, 'dieta: p exacto');
    // mediana: |d| = 1…16 sin empates, negativas de rango 1 y 2: W⁻ = 3, W⁺ = 52; p = 2 · 5/1024
    const md = ej('mediana');
    cerca(md.Wm, 3, 1e-9, 'mediana: W⁻'); cerca(md.Wp, 52, 1e-9, 'mediana: W⁺'); cerca(md.p, 10 / 1024, 1e-12, 'mediana: p exacto');
    // la aproximación normal sin continuidad: z = (W⁺ − n(n + 1)/4)/√(n(n + 1)(2n + 1)/24) = (52 − 27,5)/√96,25
    const an = C.resolver({ ...C.ejemplos[3].sc, exacto: 'no', cc: 'no' });
    cerca(an.z, 24.5 / Math.sqrt(96.25), 1e-9, 'mediana normal: z'); cerca(an.p, 0.012515, 2e-5, 'mediana normal: p (2 · cola de z = 2,497; erfc independiente)');
    // mismo caso con H₁ unilateral: la cola es la mitad
    cerca(C.resolver({ ...C.ejemplos[3].sc, h1: 'mayor' }).p, 5 / 1024, 1e-12, 'mediana: p unilateral');
    // ---- contra scipy (mannwhitneyu, wilcoxon, kruskal, binomtest, spearmanr, kendalltau; ver pruebas/referencias/estadistica.py) ----
    cerca(m.U1, REF.mannwhitney.exacto[0], 1e-9, 'scipy: U de métodos'); cerca(m.p, REF.mannwhitney.exacto[1], 1e-12, 'scipy: p exacto de métodos');
    cerca(e.p, REF.mannwhitney.normal_empates[1], 1e-9, 'scipy: p con empates y continuidad');
    cerca(d.p, REF.wilcoxon.exacto_mayor[1], 1e-12, 'scipy: p exacto de Wilcoxon apareado'); cerca(md.p, REF.wilcoxon.mediana_dos[1], 1e-12, 'scipy: p exacto de Wilcoxon de la mediana');
    for (const [clave, r] of [['kruskal', REF.kruskal.tres], ['kruskal-empates', REF.kruskal.empates]]) {
      const k = ej(clave); cerca(k.H, r.H, 1e-9, `${clave}: H (scipy.kruskal)`); cerca(k.p, r.p, 1e-12, `${clave}: p (scipy.kruskal)`);
      const hz = C.resolver({ ...C.ejemplos.find((q) => q.clave === clave).sc, post: 'holm' }), bo = C.resolver({ ...C.ejemplos.find((q) => q.clave === clave).sc, post: 'bonferroni' });
      r.dunn_p.forEach((p0, i) => { cerca(hz.pares[i].p, r.holm[i], 1e-12, `${clave}: Dunn-Holm ${i + 1}`); cerca(bo.pares[i].p, r.bonferroni[i], 1e-12, `${clave}: Dunn-Bonferroni ${i + 1}`); });
    }
    cerca(ej('signos').p, REF.signos.dieta_mayor, 1e-12, 'scipy: binomtest de los signos (dieta)'); cerca(ej('signos-mediana').p, REF.signos.mediana_dos, 1e-12, 'scipy: binomtest de los signos (mediana)');
    if (ej('signos').mas !== 6 || ej('signos').menos !== 1 || ej('signos').ceros !== 1) mal(`${N}: signos de la dieta mal contados`);
    for (const [clave, r] of [['correlacion', REF.correlacion.sin_empates], ['correlacion-empates', REF.correlacion.empates]]) {
      const c = ej(clave); cerca(c.sp.rho, r.spearman[0], 1e-12, `${clave}: ρ de Spearman`); cerca(c.sp.p, r.spearman[1], 1e-10, `${clave}: p de Spearman`); cerca(c.ke.tau, r.kendall[0], 1e-12, `${clave}: τ de Kendall`); cerca(c.ke.p, r.kendall[1], 1e-10, `${clave}: p de Kendall`);
    }
    if (!ej('correlacion').ke.exacto || ej('correlacion-empates').ke.exacto) mal(`${N}: Kendall exacto solo sin empates`);
    // Hodges-Lehmann con el intervalo de wilcox.test (calculado a mano en Python con las distribuciones exactas)
    cerca(m.hl.est, REF.hodges_mw.est, 1e-12, 'Hodges-Lehmann de dos muestras'); cerca(m.hl.lo, REF.hodges_mw.lo, 1e-12, 'IC de Hodges-Lehmann (inferior)'); cerca(m.hl.hi, REF.hodges_mw.hi, 1e-12, 'IC de Hodges-Lehmann (superior)');
    cerca(md.hl.est, REF.hodges_wilcoxon.est, 1e-12, 'Hodges-Lehmann de Wilcoxon'); cerca(md.hl.lo, REF.hodges_wilcoxon.lo, 1e-12, 'IC de Wilcoxon (inferior)'); cerca(md.hl.hi, REF.hodges_wilcoxon.hi, 1e-12, 'IC de Wilcoxon (superior)');
    // efecto: probabilidad de superioridad U₁/(n₁n₂) = 29/30 y r = |z|/√N
    cerca(m.psup, 29 / 30, 1e-12, 'probabilidad de superioridad'); cerca(m.rEf, Math.abs(m.zEf) / Math.sqrt(11), 1e-12, 'r = |z|/√N');
    error({ tipo: 'kw', alfa: '0,05', post: 'no', datos: '1 2 3' }, 'Kruskal con un solo grupo'); error({ tipo: 'kw', alfa: '0,05', post: 'no', datos: '2 2 2\n2 2' }, 'Kruskal con todos los datos iguales');
    error({ tipo: 'signos', h1: 'dos', alfa: '0,05', datos: '1 1\n2 2' }, 'signos con todas las diferencias nulas'); error({ tipo: 'correlacion', h1: 'dos', alfa: '0,05', datos: '1 2\n2 2\n3 2' }, 'correlación con una variable constante'); error({ tipo: 'correlacion', h1: 'dos', alfa: '0,05', datos: '1 2\n2 3' }, 'correlación con 2 pares');
    error({ tipo: 'mw', h1: 'dos', alfa: '0,05', datos1: '1 2 3', datos2: '' }, 'muestra 2 vacía');
    error({ tipo: 'pares', h1: 'dos', alfa: '0,05', datos: '1 1\n2 2' }, 'todas las diferencias nulas');
    error({ tipo: 'pares', h1: 'dos', alfa: '0,05', datos: '1 2 3\n4 5 6' }, 'tres columnas');
    error({ tipo: 'mw', h1: 'dos', alfa: '0,05', datos1: '4 4 4', datos2: '4 4 4' }, 'todos los datos iguales');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos (Mann-Whitney, Wilcoxon, Kruskal-Wallis, signos, Spearman, Kendall) contra scipy, Hodges-Lehmann y errores`);
  }
  return Com.navegador({ publico, asignatura: 'estadistica', carpeta: 'no-parametricos', nombre: N, app: 'NoParametricosApp', C, pagina, mal, malo: { k: 'alfa', v: '7' } });
};
