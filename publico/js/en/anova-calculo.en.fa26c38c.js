const Anova = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const IN = typeof Inferencia !== 'undefined' ? Inferencia : require('../estadistica/inferencia.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista } = K, D = ES.DIST, suma = IN.suma;
  const MODOS = { uno: 'Un factor', dos: 'Two factors (balanced design)' };
  const POST = { no: 'No', tukey: 'Tukey (HSD)', bonferroni: 'Bonferroni', holm: 'Holm', scheffe: 'Scheffé', gh: 'Games-Howell (unequal variances)' };
  const POST_DOS = ['no', 'tukey', 'bonferroni', 'holm', 'scheffe'];
  const PRUEBA = { f: 'Classical F (equal variances)', welch: 'Welch\'s F (unequal variances)' };
  const sumaTxt = (t) => (t.length > 4 ? [...t.slice(0, 2), '…', t[t.length - 1]] : t).join(' + ');
  const limpia = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tq = (nu, p) => ES.cuantil(D.t, { nu }, p), fq = (d1, d2, p) => ES.cuantil(D.f, { d1, d2 }, p);
  const pT2 = (nu, t) => Math.min(1, 2 * D.t.sf({ nu }, Math.abs(t)));

  function grupos(texto) {
    const g = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim();
      if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'), nom = j > 0 ? limpia(l.slice(0, j).trim()) : `Group ${g.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `line ${i + 1}`);
      if (x.length < 1) throw new Error(`Line ${i + 1} has no values`);
      g.push({ nom, x });
    });
    if (g.length < 2) throw new Error('Enter at least two groups, one per line');
    return g;
  }

  function parejas(m, MSE, gl, metodo, alfa) {
    const k = m.length, filas = [], np = (k * (k - 1)) / 2;
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      const dif = m[i].m - m[j].m, v = 1 / m[i].r + 1 / m[j].r, ee = Math.sqrt(MSE * v), t = dif / ee;
      const p0 = pT2(gl, t); let p, lo, hi, est = t, etq = 't';
      if (metodo === 'bonferroni') { p = Math.min(1, p0 * np); const c = tq(gl, 1 - alfa / (2 * np)); lo = dif - c * ee; hi = dif + c * ee; }
      else if (metodo === 'holm') { p = p0; lo = hi = NaN; }
      else if (metodo === 'scheffe') { est = (t * t) / (k - 1); etq = 'F'; p = D.f.sf({ d1: k - 1, d2: gl }, est); const c = Math.sqrt((k - 1) * fq(k - 1, gl, 1 - alfa)) * ee; lo = dif - c; hi = dif + c; }
      else { const q = Math.abs(dif) / (ee / Math.SQRT2); est = q; etq = 'q'; p = Math.max(0, 1 - IN.ptukey(q, k, gl)); const c = IN.qtukey(1 - alfa, k, gl) * ee / Math.SQRT2; lo = dif - c; hi = dif + c; }
      filas.push({ a: m[i].nom, b: m[j].nom, dif, est, etq, p, lo, hi });
    }
    if (metodo === 'holm') { const aj = IN.holm(filas.map((q) => q.p)); filas.forEach((q, i) => { q.p = aj[i]; }); }
    filas.forEach((q) => { q.sig = q.p < alfa; });
    return filas;
  }
  function gamesHowell(g, alfa) {
    const k = g.length, filas = [];
    if (g.some((q) => q.n < 2)) throw new Error('Games-Howell needs at least two values in each group');
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      const vi = g[i].s2 / g[i].n, vj = g[j].s2 / g[j].n, se = Math.sqrt(vi + vj), dif = g[i].m - g[j].m, gl = (vi + vj) ** 2 / (vi ** 2 / (g[i].n - 1) + vj ** 2 / (g[j].n - 1));
      if (!(se > 0)) throw new Error('Games-Howell needs the groups to have some variation');
      const q = Math.abs(dif) / (se / Math.SQRT2), p = Math.max(0, 1 - IN.ptukey(q, k, gl)), c = IN.qtukey(1 - alfa, k, gl) * se / Math.SQRT2;
      filas.push({ a: g[i].nom, b: g[j].nom, dif, est: q, etq: 'q', p, lo: dif - c, hi: dif + c, gl, sig: p < alfa });
    }
    return filas;
  }

  function contrastes(texto, g, MSW, glW, alfa) {
    const out = [], k = g.length;
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim(); if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'), nom = j > 0 ? limpia(l.slice(0, j).trim()) : `Contrast ${out.length + 1}`, c = lista(j > 0 ? l.slice(j + 1) : l, `the contrast on line ${i + 1}`);
      if (c.length !== k) throw new Error(`The contrast “${nom}” has ${c.length} coefficients and there are ${k} groups`);
      const s = suma(c); if (Math.abs(s) > 1e-9 * Math.max(1, ...c.map(Math.abs))) throw new Error(`The coefficients of the contrast “${nom}” add up to ${f(s)}: they must add up to 0`);
      if (c.every((v) => v === 0)) throw new Error(`The contrast “${nom}” has all its coefficients equal to 0`);
      const psi = suma(c.map((v, q) => v * g[q].m)), ee = Math.sqrt(MSW * suma(c.map((v, q) => (v * v) / g[q].n))), t = psi / ee, p = pT2(glW, t), h = tq(glW, 1 - alfa / 2) * ee;
      out.push({ nom, c, psi, ee, t, p, lo: psi - h, hi: psi + h, sig: p < alfa });
    });
    return out;
  }

  function resolverUno(sc, alfa) {
    const g = grupos(sc.datos), k = g.length, N = suma(g.map((q) => q.x.length)), post = POST[sc.post] && sc.post !== 'no' ? sc.post : 'no', welchSel = sc.prueba === 'welch';
    if (N <= k) throw new Error('At least one group with more than one value is needed to estimate the variability within groups');
    for (const q of g) { q.n = q.x.length; q.m = suma(q.x) / q.n; q.ss = suma(q.x.map((v) => (v - q.m) ** 2)); q.s2 = q.n > 1 ? q.ss / (q.n - 1) : NaN; }
    const media = suma(g.map((q) => q.n * q.m)) / N;
    const SSB = suma(g.map((q) => q.n * (q.m - media) ** 2)), SSW = suma(g.map((q) => q.ss)), SST = SSB + SSW;
    const glB = k - 1, glW = N - k, MSB = SSB / glB, MSW = SSW / glW;
    if (!(MSW > 0)) throw new Error('Within all groups the values are equal (variance 0): F is not defined');
    const F = MSB / MSW, P = { d1: glB, d2: glW }, pvF = D.f.sf(P, F), critF = fq(glB, glW, 1 - alfa);
    const eta2 = SSB / SST, om2 = Math.max(0, (SSB - glB * MSW) / (SST + MSW)), fC = Math.sqrt(eta2 / (1 - eta2));
    const wel = IN.welch(g.map((q) => q.x)), sup = IN.supuestos(g.map((q) => q.x), alfa);
    if (welchSel && !wel) throw new Error('Welch\'s F needs at least two values in each group and none of them constant');
    const usaW = welchSel && wel, Fp = usaW ? wel.F : F, p = usaW ? wel.p : pvF, g1 = usaW ? wel.gl1 : glB, g2 = usaW ? wel.gl2 : glW, crit = usaW ? fq(g1, g2, 1 - alfa) : critF, rechaza = p < alfa;
    const tcrit = tq(glW, 1 - alfa / 2);
    for (const q of g) { const h = tcrit * Math.sqrt(MSW / q.n); q.lo = q.m - h; q.hi = q.m + h; q.s = Math.sqrt(q.s2); }
    const pares = post === 'gh' ? gamesHowell(g, alfa) : post !== 'no' ? parejas(g.map((q) => ({ nom: q.nom, m: q.m, r: q.n })), MSW, glW, post, alfa) : [];
    const contr = String(sc.contrastes ?? '').trim() ? contrastes(sc.contrastes, g, MSW, glW, alfa) : [];
    const avisos = [];
    if (sup.levene && isFinite(sup.levene.p) && sup.levene.p < alfa) avisos.push(`Levene rejects that the variances are equal (p = ${ES.prob(sup.levene.p)}): Welch's F is advisable and, to compare pairs, Games-Howell.`);
    if (sup.shapiro && isFinite(sup.shapiro.p) && sup.shapiro.p < alfa) avisos.push(`Shapiro-Wilk rejects normality of the residuals (p = ${ES.prob(sup.shapiro.p)}): see Kruskal-Wallis in Non-parametric tests.`);
    if (k >= 2 && Math.max(...g.map((q) => q.n)) / Math.min(...g.map((q) => q.n)) > 1.5) avisos.push('The groups have different sizes: the ANOVA is less robust to differing variances.');
    const pasos = [];
    pasos.push({ t: 'Hypotheses', html: `$H_0$: $μ_1 = μ_2 = ⋯ = μ_{${k}}$ (all the means are equal), against $H_1$: at least two means are different; with $α = ${f(alfa)}$, $k = ${k}$ groups and $N = ${N}$ observations.` });
    pasos.push({ t: 'Means', html: `${g.slice(0, 4).map((q, i) => `$x̄_{${i + 1}} = ${f(q.m)}$ ($n_{${i + 1}} = ${q.n}$)`).join(', ')}${k > 4 ? ', …' : ''}.<br>Grand mean: $x̄ = {∑ n_i x̄_i}/N = ${f(media)}$.` });
    pasos.push({ t: 'Variability between groups', html: `$SC_E = ∑ n_i (x̄_i − x̄)^2 = ${sumaTxt(g.map((q) => `${q.n}(${f(q.m)} − ${f(media)})^2`))} = ${f(SSB)}$<br>$CM_E = {SC_E}/{k − 1} = {${f(SSB)}}/{${glB}} = ${f(MSB)}$` });
    pasos.push({ t: 'Variability within groups', html: `$SC_D = ∑∑ (x_{ij} − x̄_i)^2 = ${sumaTxt(g.map((q) => f(q.ss)))} = ${f(SSW)}$<br>$CM_D = {SC_D}/{N − k} = {${f(SSW)}}/{${glW}} = ${f(MSW)}$` });
    pasos.push({ t: 'F statistic', html: `$F = {MS_B}/{MS_W} = {${f(MSB)}}/{${f(MSW)}} = ${f(F)}$, which under $H_0$ follows a Snedecor F with $${glB}$ and $${glW}$ degrees of freedom.<br>Check: $SS_T = SS_B + SS_W = ${f(SSB)} + ${f(SSW)} = ${f(SST)}$.` });
    pasos.push({ t: 'Assumptions', html: `Levene (with the median): $W = ${f(sup.levene.W)}$, $p = ${ES.prob(sup.levene.p)}$ → ${sup.varianzasOk === false ? 'the variances can <b>not</b> be considered equal' : 'there is no evidence that the variances differ'}.<br>Shapiro-Wilk of the residuals $x_{ij} − x̄_i$: ${sup.shapiro && isFinite(sup.shapiro.W) ? `$W = ${f(sup.shapiro.W, 4)}$, $p = ${ES.prob(sup.shapiro.p)}$ → ${sup.normalidadOk === false ? 'normality does <b>not</b> hold' : 'there is no evidence against normality'}` : 'cannot be calculated (at least 3 non-constant residuals are needed)'}.${avisos.length ? `<br><b>Warning:</b> ${avisos.join(' ')}` : ''}` });
    if (usaW) pasos.push({ t: 'Welch\'s F', html: `With unequal variances each group is weighted by $w_i = n_i/s_i^2$ (Welch, 1951): $F^* = ${f(wel.F)}$ with $${f(wel.gl1)}$ and $${f(wel.gl2)}$ degrees of freedom (the latter approximate); the critical value is $${f(crit)}$ and the p-value, $${ES.prob(wel.p)}$.` });
    pasos.push({ t: 'Critical region and p-value', html: `The test is right-tailed: the critical value is $F_{${f(g1)}, ${f(g2)}; ${f(1 - alfa)}} = ${f(crit)}$ and the p-value, $P(F ≥ ${f(Fp)}) = ${ES.prob(p)}$${usaW ? '' : ` (for comparison, Welch's F gives $${wel ? ES.prob(wel.p) : '—'}$)`}.` });
    pasos.push({ t: 'Effect size', html: `$η^2 = {SS_B}/{SS_T} = ${f(eta2, 3)}$: the factor explains ${f(100 * eta2, 3)} % of the variability.<br>$ω^2 = {SS_B − (k − 1) MS_W}/{SS_T + MS_W} = ${f(om2, 3)}$ (less biased than $η^2$ with little data); $f = √{η^2/(1 − η^2)} = ${f(fC, 3)}$ (Cohen: 0.10 small, 0.25 medium, 0.40 large).` });
    pasos.push({ t: 'Conclusion', html: rechaza ? `<b>$H_0$ is rejected</b> at a significance level of ${f(100 * alfa)} %: there are differences between the means.` : `<b>$H_0$ is not rejected</b> at a significance level of ${f(100 * alfa)} %: there is no evidence that the means are different.` });
    pasos.push({ t: 'Interval of each mean', html: `With the common variance, $x̄_i ± t_{${glW}; ${f(1 - alfa / 2)}} √{CM_D/n_i}$, with $t = ${f(tcrit)}$. For example, group 1: $(${f(g[0].lo)}, ${f(g[0].hi)})$.` });
    if (pares.length) {
      const e = pares[0], m = pares.length;
      const txt = { bonferroni: `For each pair, $t = {x̄_i − x̄_j}/√(MS_W (1/n_i + 1/n_j))$ with $${glW}$ degrees of freedom, and the p-value is multiplied by the number of pairs, $m = k(k − 1)/2 = ${m}$ (Bonferroni).`,
        holm: `For each pair, $t = {x̄_i − x̄_j}/√(MS_W (1/n_i + 1/n_j))$ with $${glW}$ degrees of freedom. The $m = ${m}$ p-values are sorted from smallest to largest and the one in position $r$ is multiplied by $m − r + 1$ (Holm), making sure it does not drop below the previous one: it is more powerful than Bonferroni with the same control of the overall error.`,
        scheffe: `For each pair, $F = {(x̄_i − x̄_j)^2}/{(k − 1) MS_W (1/n_i + 1/n_j)}$ with $${glB}$ and $${glW}$ degrees of freedom (Scheffé): it is the most conservative, but it holds for any contrast, not just pairs.`,
        tukey: `For each pair, $q = {|x̄_i − x̄_j|}/√(MS_W/2 · (1/n_i + 1/n_j))$, which under $H_0$ follows the studentized range with $k = ${k}$ and $${glW}$ degrees of freedom (Tukey-Kramer if the groups have different sizes). It controls the overall error of <i>all</i> the pairs at once and is the usual comparison.`,
        gh: `For each pair, $q = {|x̄_i − x̄_j|}/√{(s_i^2/n_i + s_j^2/n_j)/2}$ with the Welch-Satterthwaite degrees of freedom of that pair (Games-Howell): it does not assume equal variances.` }[post];
      pasos.push({ t: `Pairwise comparisons (${POST[post].replace(/ \(.*/, '')})`, html: `${txt}<br>For example, ${e.a} − ${e.b}: $${e.etq} = ${f(e.est)}$, $p = ${ES.prob(e.p)}$.${rechaza ? '' : ' With a non-significant F, these comparisons are only indicative.'}` });
    }
    contr.forEach((c) => pasos.push({ t: `Contrast: ${c.nom}`, html: `$ψ = ∑ c_i x̄_i = ${sumaTxt(c.c.map((v, q) => `(${f(v)})(${f(g[q].m)})`))} = ${f(c.psi)}$; $SE = √(MS_W ∑ c_i^2/n_i) = ${f(c.ee)}$; $t = ψ/SE = ${f(c.t)}$ with $${glW}$ d.f.; $p = ${ES.prob(c.p)}$; CI ${f(100 * (1 - alfa))} %: $(${f(c.lo)}, ${f(c.hi)})$. ${c.sig ? '<b>Significant</b>' : 'Not significant'}.` }));
    return { modo: 'uno', g, k, N, media, SSB, SSW, SST, glB, glW, MSB, MSW, F, pvF, Fp, p, pv: p, g1, g2, crit, critF, rechaza, alfa, eta2, om2, fC, wel, usaW, sup, pares, post, contr, avisos, pasos };
  }

  function casillas(texto) {
    const A = [], B = [], cel = new Map();
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim(); if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'); if (j < 1) throw new Error(`Line ${i + 1} must be “level A / level B: values”`);
      const nombres = l.slice(0, j).split('/').map((s) => s.trim()); if (nombres.length !== 2 || !nombres[0] || !nombres[1]) throw new Error(`Line ${i + 1} must name one level of each factor, “level A / level B: values”`);
      const [a, b] = nombres.map(limpia), x = lista(l.slice(j + 1), `line ${i + 1}`); if (!x.length) throw new Error(`Line ${i + 1} has no values`);
      if (!A.includes(a)) A.push(a); if (!B.includes(b)) B.push(b);
      const key = `${a}\u0000${b}`; if (cel.has(key)) throw new Error(`The combination “${a} / ${b}” appears twice: put it on a single line`);
      cel.set(key, x);
    });
    if (A.length < 2 || B.length < 2) throw new Error('Each factor needs at least two levels');
    let n = null;
    for (const a of A) for (const b of B) {
      const x = cel.get(`${a}\u0000${b}`); if (!x) throw new Error(`The combination “${a} / ${b}” is missing: the design must be balanced (all combinations, with the same number of replicates)`);
      if (n === null) n = x.length; else if (x.length !== n) throw new Error(`The cells have different numbers of data points (${n} and ${x.length}): the design must be balanced`);
    }
    return { A, B, n, cel };
  }
  function resolverDos(sc, alfa) {
    const { A, B, n, cel } = casillas(sc.datos), a = A.length, b = B.length, N = a * b * n, nomA = limpia(String(sc.nomA || 'Factor A').trim() || 'Factor A'), nomB = limpia(String(sc.nomB || 'Factor B').trim() || 'Factor B');
    const post = POST_DOS.includes(sc.post) ? sc.post : 'no', M = A.map((u) => B.map((v) => { const x = cel.get(`${u}\u0000${v}`); return suma(x) / n; }));
    const mA = M.map((r) => suma(r) / b), mB = B.map((_, j) => suma(M.map((r) => r[j])) / a), mg = suma(mA) / a;
    const SSA = b * n * suma(mA.map((v) => (v - mg) ** 2)), SSB = a * n * suma(mB.map((v) => (v - mg) ** 2));
    let SSAB = 0, SSE = 0;
    A.forEach((u, i) => B.forEach((v, j) => { SSAB += n * (M[i][j] - mA[i] - mB[j] + mg) ** 2; SSE += suma(cel.get(`${u}\u0000${v}`).map((y) => (y - M[i][j]) ** 2)); }));
    const SST = SSA + SSB + SSAB + SSE, glA = a - 1, glB = b - 1, glAB = glA * glB;
    const repl = n > 1, glE = repl ? a * b * (n - 1) : glAB, SCe = repl ? SSE : SSAB, MSE = SCe / glE;
    if (!(MSE > 0)) throw new Error(repl ? 'Within all cells the values are equal (variance 0): F is not defined' : 'Without replicates the interaction acts as the error and here it equals 0: F is not defined');
    const filasEf = [{ nom: nomA, SS: SSA, gl: glA }, { nom: nomB, SS: SSB, gl: glB }, ...(repl ? [{ nom: `${nomA} × ${nomB}`, SS: SSAB, gl: glAB }] : [])];
    for (const e of filasEf) { e.MS = e.SS / e.gl; e.F = e.MS / MSE; e.p = D.f.sf({ d1: e.gl, d2: glE }, e.F); e.crit = fq(e.gl, glE, 1 - alfa); e.eta2p = e.SS / (e.SS + SCe); e.om2p = Math.max(0, (e.gl * (e.F - 1)) / (e.gl * (e.F - 1) + N)); e.sig = e.p < alfa; }
    const todo = []; const res = [];
    A.forEach((u, i) => B.forEach((v, j) => { const x = cel.get(`${u}\u0000${v}`); todo.push(x); res.push(...x.map((y) => y - M[i][j])); }));
    const sh = repl && res.length >= 3 ? IN.shapiro(res) : null, lev = repl ? IN.levene(todo, 'mediana') : null;
    const margA = A.map((nm, i) => ({ nom: nm, m: mA[i], r: b * n })), margB = B.map((nm, j) => ({ nom: nm, m: mB[j], r: a * n }));
    const paresA = post !== 'no' ? parejas(margA, MSE, glE, post, alfa) : [], paresB = post !== 'no' ? parejas(margB, MSE, glE, post, alfa) : [];
    const avisos = [];
    if (!repl) avisos.push('With a single data point per cell the interaction cannot be separated from the error: it is assumed there is no interaction and its variability is used as the error.');
    if (lev && isFinite(lev.p) && lev.p < alfa) avisos.push(`Levene rejects that the variances of the cells are equal (p = ${ES.prob(lev.p)}): the p-values are only indicative.`);
    if (sh && isFinite(sh.p) && sh.p < alfa) avisos.push(`Shapiro-Wilk rejects normality of the residuals (p = ${ES.prob(sh.p)}).`);
    const ef = filasEf, inter = repl ? ef[2] : null;
    const pasos = [];
    pasos.push({ t: 'Model and hypotheses', html: `$x_{ijk} = μ + α_i + β_j + (αβ)_{ij} + ε_{ijk}$ with $a = ${a}$ levels of “${nomA}”, $b = ${b}$ of “${nomB}” and $n = ${n}$ replicates per cell ($N = ${N}$). Three null hypotheses are tested: there is no effect of “${nomA}”, there is no effect of “${nomB}”${repl ? ' and there is no interaction' : ''}; $α = ${f(alfa)}$.` });
    pasos.push({ t: 'Means', html: `Grand mean $x̄ = ${f(mg)}$. Means of “${nomA}”: ${A.map((nm, i) => `${nm} = ${f(mA[i])}`).join(', ')}. Means of “${nomB}”: ${B.map((nm, j) => `${nm} = ${f(mB[j])}`).join(', ')}.` });
    pasos.push({ t: 'Sums of squares', html: `$SC_A = b n ∑ (x̄_{i··} − x̄)^2 = ${f(SSA)}$; $SC_B = a n ∑ (x̄_{·j·} − x̄)^2 = ${f(SSB)}$; $SC_{AB} = n ∑∑ (x̄_{ij·} − x̄_{i··} − x̄_{·j·} + x̄)^2 = ${f(SSAB)}$${repl ? `; $SC_E = ∑∑∑ (x_{ijk} − x̄_{ij·})^2 = ${f(SSE)}$` : ''}.<br>Check: $SS_T = ${f(SST)}$.` });
    pasos.push({ t: 'Mean squares and F', html: `${ef.map((e) => `${e.nom}: $CM = ${f(e.SS)}/${e.gl} = ${f(e.MS)}$, $F = ${f(e.MS)}/${f(MSE)} = ${f(e.F)}$, $p = ${ES.prob(e.p)}$`).join('<br>')}<br>The error has $${glE}$ degrees of freedom and $MS_E = ${f(MSE)}$.` });
    pasos.push({ t: 'Assumptions', html: `${lev ? `Levene between cells: $W = ${f(lev.W)}$, $p = ${ES.prob(lev.p)}$.` : 'With one data point per cell the variances cannot be checked.'}${sh && isFinite(sh.W) ? ` Shapiro-Wilk of the residuals: $W = ${f(sh.W, 4)}$, $p = ${ES.prob(sh.p)}$.` : ''}${avisos.length ? `<br><b>Warning:</b> ${avisos.join(' ')}` : ''}` });
    pasos.push({ t: 'Conclusion', html: `${ef.map((e) => `${e.nom}: ${e.sig ? '<b>significant effect</b>' : 'no significant effect'} ($F = ${f(e.F)}$, $p = ${ES.prob(e.p)}$; $η^2_p = ${f(e.eta2p, 3)}$)`).join('<br>')}${inter && inter.sig ? '<br>With a significant interaction, the main effects must be read with care: the effect of one factor depends on the level of the other (look at the lines in the graph: if they are not parallel, there is interaction).' : ''}` });
    const par = (ps, tit) => ps.length && pasos.push({ t: `Comparisons for “${tit}” (${POST[post].replace(/ \(.*/, '')})`, html: `Each mean of “${tit}” is based on $${tit === nomA ? b * n : a * n}$ data points and $MS_E$ with $${glE}$ degrees of freedom is used.<br>For example, ${ps[0].a} − ${ps[0].b}: $${ps[0].etq} = ${f(ps[0].est)}$, $p = ${ES.prob(ps[0].p)}$.` });
    par(paresA, nomA); par(paresB, nomB);
    return { modo: 'dos', A, B, n, a, b, N, nomA, nomB, M, mA, mB, mg, SSA, SSB, SSAB, SSE, SST, ef, inter, repl, glE, MSE, sh, lev, paresA, paresB, post, alfa, avisos, pasos, F: ef[0].F, pv: ef[0].p, rechaza: ef.some((e) => e.sig) };
  }

  function resolver(sc) {
    const alfa = lee(sc, 'alfa', 'the significance level α', { min: 0, minEx: true, max: 0.5, maxEx: true });
    return sc.modo === 'dos' ? resolverDos(sc, alfa) : resolverUno(sc, alfa);
  }

  const ejemplos = [
    { clave: 'abonos', nombre: 'Three fertilizers: plant yield', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'tukey', contrastes: 'A against the mean of B and C: 2 -1 -1', datos: 'A: 20 21 23 19 22\nB: 24 26 25 27 23\nC: 29 28 31 27 30' } },
    { clave: 'iguales', nombre: 'No differences: four machines', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'no', contrastes: '', datos: 'M1: 10,2 9,8 10,1 10,0\nM2: 10,1 10,3 9,9 10,2\nM3: 9,9 10,0 10,2 10,1\nM4: 10,0 10,1 9,8 10,3' } },
    { clave: 'dos', nombre: 'Two groups (equivalent to the two-mean t)', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'no', contrastes: '', datos: '12 14 15 13 16\n18 17 19 20 16' } },
    { clave: 'varianzas', nombre: 'Very different variances: Welch and Games-Howell', sc: { modo: 'uno', alfa: '0,05', prueba: 'welch', post: 'gh', contrastes: '', datos: 'Fast: 20 21 23 19 22\nMedium: 24 26 25 27 23 30\nSlow: 29 28 31 27 30 40 12' } },
    { clave: 'bonferroni', nombre: 'Three diets: Bonferroni, Holm and Scheffé', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'holm', contrastes: '', datos: 'Diet 1: 8.2 7.9 9.1 8.6 8.0\nDiet 2: 9.8 10.4 9.5 10.1\nDiet 3: 8.9 9.2 8.4 9.6 9.0 8.7' } },
    { clave: 'dos-factores', nombre: 'Two factors: fertilizer and irrigation, with interaction', sc: { modo: 'dos', alfa: '0,05', post: 'tukey', nomA: 'Fertilizer', nomB: 'Irrigation', datos: 'A1 / Low: 20 22 21\nA1 / High: 25 27 26\nA2 / Low: 24 23 25\nA2 / High: 38 36 37\nA3 / Low: 18 20 19\nA3 / High: 21 22 20' } },
    { clave: 'sin-replicas', nombre: 'Two factors without replicates (blocks)', sc: { modo: 'dos', alfa: '0,05', post: 'no', nomA: 'Treatment', nomB: 'Block', datos: 'T1 / B1: 12\nT1 / B2: 15\nT1 / B3: 11\nT2 / B1: 14\nT2 / B2: 18\nT2 / B3: 13\nT3 / B1: 19\nT3 / B2: 21\nT3 / B3: 18' } },
  ];
  return { resolver, ejemplos, POST, POST_DOS, MODOS, PRUEBA, grupos, casillas, parejas };
})();

