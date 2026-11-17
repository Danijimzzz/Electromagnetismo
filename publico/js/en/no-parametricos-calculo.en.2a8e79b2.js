const NoParametricos = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const IN = typeof Inferencia !== 'undefined' ? Inferencia : require('../estadistica/inferencia.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista, filas } = K, N01 = { mu: 0, sigma: 1 };
  const suma = (v) => v.reduce((a, b) => a + b, 0);
  const TIPOS = { mw: 'Mann-Whitney U (two independent samples)', pares: 'Wilcoxon for paired data', mediana: 'Wilcoxon for the median of one sample', kw: 'Kruskal-Wallis (three or more groups) with Dunn', signos: 'Sign test (paired data)', signosmed: 'Sign test for the median', correlacion: 'Spearman and Kendall (rank correlation)' };
  const POST = { no: 'No', holm: 'Dunn with Holm', bonferroni: 'Dunn with Bonferroni' };
  const H1 = { dos: 'Different (two-sided)', mayor: 'The first is greater (one-sided)', menor: 'The first is smaller (one-sided)' };
  const sumaTxt = (t) => (t.length > 5 ? [...t.slice(0, 3), '…', t[t.length - 1]] : t).join(' + ');

  function rangos(v) {
    const idx = v.map((_, i) => i).sort((a, b) => v[a] - v[b]), r = new Array(v.length), t = [];
    for (let i = 0; i < idx.length;) {
      let j = i; while (j + 1 < idx.length && v[idx[j + 1]] === v[idx[i]]) j++;
      const m = (i + j) / 2 + 1; for (let q = i; q <= j; q++) r[idx[q]] = m;
      if (j > i) t.push(j - i + 1);
      i = j + 1;
    }
    return { r, t, corr: suma(t.map((x) => x ** 3 - x)) };
  }
  function cuentaSumas(N, n) {
    const c = Array.from({ length: n + 1 }, () => new Map()); c[0].set(0, 1);
    for (let v = 1; v <= N; v++) for (let j = Math.min(n, v); j >= 1; j--) for (const [s, q] of [...c[j - 1]]) c[j].set(s + v, (c[j].get(s + v) || 0) + q);
    return c[n];
  }
  function colas(cuentas, x) {
    let tot = 0, le = 0, ge = 0;
    for (const [s, q] of cuentas) { tot += q; if (s <= x + 1e-9) le += q; if (s >= x - 1e-9) ge += q; }
    return { le: le / tot, ge: ge / tot };
  }
  const alfaDe = (sc) => lee(sc, 'alfa', 'the significance level α', { min: 0, minEx: true, max: 0.5, maxEx: true });

  function pvalor(h1, le, ge) { return h1 === 'mayor' ? ge : h1 === 'menor' ? le : Math.min(1, 2 * Math.min(le, ge)); }
  function pnormal(h1, d, sigma, cc) {
    const dc = cc ? (h1 === 'dos' ? Math.sign(d) * Math.max(0, Math.abs(d) - 0.5) : h1 === 'mayor' ? d - 0.5 : d + 0.5) : d;
    const z = dc / sigma;
    return { z, p: h1 === 'mayor' ? ES.DIST.normal.sf(N01, z) : h1 === 'menor' ? ES.DIST.normal.cdf(N01, z) : Math.min(1, 2 * ES.DIST.normal.sf(N01, Math.abs(z))) };
  }


  function cuantilCuentas(cuentas, p) {
    const ks = [...cuentas.keys()].sort((a, b) => a - b), tot = suma([...cuentas.values()]); let acu = 0;
    for (const k of ks) { acu += cuentas.get(k) / tot; if (acu >= p - 1e-12) return k; }
    return ks[ks.length - 1];
  }
  const mediana = (v) => { const o = [...v].sort((a, b) => a - b), m = o.length >> 1; return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };
  function hodges(difs, M, mu, sigma, exacto, cuentas, alfa) {
    const o = [...difs].sort((a, b) => a - b); let qu;
    if (exacto) qu = cuantilCuentas(cuentas, alfa / 2); else qu = Math.round(mu + sigma * IN.ppnd(alfa / 2));
    if (qu <= 0) qu = 1;
    const ql = M - qu;
    if (ql + 1 > M || qu > M || ql + 1 < 1) return { est: mediana(o), lo: NaN, hi: NaN };
    return { est: mediana(o), lo: o[qu - 1], hi: o[ql], exacto };
  }
  const nivel = (alfa) => f(100 * (1 - alfa));

  function mannWhitney(sc, alfa) {
    const x = lista(sc.datos1, 'la muestra 1'), y = lista(sc.datos2, 'la muestra 2'), n1 = x.length, n2 = y.length, N = n1 + n2, h1 = H1[sc.h1] ? sc.h1 : 'dos';
    if (n1 < 1 || n2 < 1) throw new Error('Enter data in both samples');
    const todos = [...x, ...y], { r, t, corr } = rangos(todos);
    const R1 = suma(r.slice(0, n1)), R2 = suma(r.slice(n1)), U1 = R1 - (n1 * (n1 + 1)) / 2, U2 = n1 * n2 - U1, mu = (n1 * n2) / 2;
    const exacto = sc.exacto !== 'no' && !t.length && n1 <= 20 && n2 <= 20, cc = sc.cc !== 'no';
    let p, z = null, sigma = null;
    if (exacto) {
      const cs = new Map([...cuentaSumas(N, n1)].map(([s, q]) => [s - (n1 * (n1 + 1)) / 2, q])), c = colas(cs, U1);
      p = pvalor(h1, c.le, c.ge);
    } else {
      sigma = Math.sqrt(((n1 * n2) / 12) * (N + 1 - corr / (N * (N - 1))));
      if (!(sigma > 0)) throw new Error('All the data are equal: the test cannot be carried out');
      ({ z, p } = pnormal(h1, U1 - mu, sigma, cc));
    }
    const orden = todos.map((v, i) => ({ v, g: i < n1 ? 1 : 2, r: r[i] })).sort((a, b) => a.v - b.v || a.g - b.g);
    const pasos = [];
    pasos.push({ t: 'Hypotheses', html: `$H_0$: the two populations are equal (neither tends to give larger values), against $H_1$: ${{ dos: 'the distribution of sample 1 is shifted relative to that of sample 2', mayor: 'sample 1 tends to give larger values than sample 2', menor: 'sample 1 tends to give smaller values than sample 2' }[h1]}; with $α = ${f(alfa)}$, $n_1 = ${n1}$ and $n_2 = ${n2}$.` });
    pasos.push({ t: 'Ranks', html: `The ${N} data points are ordered together and given their rank (1 to the smallest${t.length ? '; ties get the mean of the ranks they occupy' : ''}). Adding those of each sample: $R_1 = ${sumaTxt(r.slice(0, n1).map((v) => f(v)))} = ${f(R1)}$ and $R_2 = ${f(R2)}$ (check: $R_1 + R_2 = N(N + 1)/2 = ${f(R1 + R2)}$).` });
    pasos.push({ t: 'U statistic', html: `$U_1 = R_1 − {n_1(n_1 + 1)}/2 = ${f(R1)} − ${f((n1 * (n1 + 1)) / 2)} = ${f(U1)}$ and $U_2 = n_1 n_2 − U_1 = ${f(U2)}$. If $H_0$ is true, $U_1$ is around $n_1 n_2/2 = ${f(mu)}$.` });
    if (exacto) pasos.push({ t: 'p-valor exacto', html: `There are no ties and the samples are small: the $\\binom{${N}}{${n1}}$ ways of distributing the ranks between the two samples are counted. ${h1 === 'mayor' ? `$p = P(U_1 ≥ ${f(U1)}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(U_1 ≤ ${f(U1)}) = ${ES.prob(p)}$` : `$p = 2 · P(\\text{smaller tail}) = ${ES.prob(p)}$`}.` });
    else pasos.push({ t: 'Normal approximation', html: `Under $H_0$, $U_1$ is almost normal with mean $${f(mu)}$ and $σ = √({n_1 n_2}/12 · (N + 1${t.length ? ' − {∑ (t^3 − t)}/{N(N − 1)}' : ''})) = ${f(sigma)}$${t.length ? ' (with the tie correction)' : ''}.<br>$z = {U_1 − μ${cc ? ' ∓ 0,5' : ''}}/σ = ${f(z)}$ y $p = ${ES.prob(p)}$.` });
    const zEf = (U1 - mu) / Math.sqrt(((n1 * n2) / 12) * (N + 1 - corr / (N * (N - 1)))), rEf = Math.abs(zEf) / Math.sqrt(N), psup = U1 / (n1 * n2);
    const difs = []; for (const a of x) for (const b of y) difs.push(a - b);
    const M = n1 * n2, hl = hodges(difs, M, mu, Math.sqrt(((n1 * n2) / 12) * (N + 1)), exacto, exacto ? new Map([...cuentaSumas(N, n1)].map(([q, c]) => [q - (n1 * (n1 + 1)) / 2, c])) : null, alfa);
    pasos.push({ t: 'Effect size', html: `Probability of superiority: $P(X > Y) + ½ P(X = Y) = U_1/(n_1 n_2) = ${f(U1)}/${f(n1 * n2)} = ${f(psup)}$ (0.5 = no difference). Rank-biserial correlation: $r_b = 2 U_1/(n_1 n_2) − 1 = ${f(2 * psup - 1)}$. Effect size $r = |z|/√N = ${f(rEf)}$ (0.1 small, 0.3 medium, 0.5 large).` });
    pasos.push({ t: 'Hodges-Lehmann estimator', html: `The typical difference between the two samples is the median of the $n_1 n_2 = ${M}$ differences $x_i − y_j$: <b>${f(hl.est)}</b>${isFinite(hl.lo) ? `, with a ${nivel(alfa)} % confidence interval of $(${f(hl.lo)}, ${f(hl.hi)})$ (${exacto ? 'exact' : 'by the normal approximation'}, taking the ordered differences that leave $α/2$ on each side)` : ''}.` });
    pasos.push({ t: 'Conclusion', html: p < alfa ? `<b>$H_0$ is rejected</b> at a significance level of ${f(100 * alfa)} %: there are differences between the two samples.` : `<b>$H_0$ is not rejected</b> at a significance level of ${f(100 * alfa)} %: there is no evidence of differences between the two samples.` });
    return { tipo: 'mw', h1, x, y, n1, n2, R1, R2, U1, U2, mu, z, sigma, p, exacto, rEf, psup, hl, zEf, empates: t.length > 0, orden, rechaza: p < alfa, alfa, pasos, est: U1 };
  }

  function wilcoxon(sc, alfa, pares) {
    const h1 = H1[sc.h1] ? sc.h1 : 'dos';
    let ds, filasT;
    if (pares) {
      filasT = filas(sc.datos, 2, 'the paired data');
      if (!filasT.length) throw new Error('The table of “before after” pairs is missing');
      ds = filasT.map(([a, b]) => ({ a, b, d: a - b }));
    } else {
      const x = lista(sc.datos, 'la muestra'), m0 = lee(sc, 'm0', 'the H₀ median');
      if (!x.length) throw new Error('The sample is missing');
      ds = x.map((a) => ({ a, b: m0, d: a - m0 })); filasT = null;
    }
    const nTotal = ds.length, nz = ds.filter((q) => q.d !== 0), n = nz.length;
    if (n < 1) throw new Error('All the differences are 0: the test cannot be carried out');
    const { r, t, corr } = rangos(nz.map((q) => Math.abs(q.d)));
    nz.forEach((q, i) => { q.r = r[i]; });
    const Wp = suma(nz.filter((q) => q.d > 0).map((q) => q.r)), Wm = suma(nz.filter((q) => q.d < 0).map((q) => q.r)), mu = (n * (n + 1)) / 4;
    const exacto = sc.exacto !== 'no' && !t.length && n <= 25, cc = sc.cc !== 'no';
    let p, z = null, sigma = null;
    if (exacto) {
      let cs = new Map([[0, 1]]);
      for (let v = 1; v <= n; v++) { const nu = new Map(cs); for (const [s, q] of cs) nu.set(s + v, (nu.get(s + v) || 0) + q); cs = nu; }
      const c = colas(cs, Wp); p = pvalor(h1, c.le, c.ge);
    } else {
      sigma = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - corr / 48);
      ({ z, p } = pnormal(h1, Wp - mu, sigma, cc));
    }
    const pasos = [], dif = pares ? 'd_i = x_i − y_i' : 'd_i = x_i − m_0';
    pasos.push({ t: 'Hypotheses', html: pares
      ? `$H_0$: the median of the differences is 0 (there is no change between the two measurements), against $H_1$: ${{ dos: 'it differs from 0', mayor: 'the first measurement tends to be larger', menor: 'the first measurement tends to be smaller' }[h1]}; with $α = ${f(alfa)}$ and ${nTotal} pairs.`
      : `$H_0$: the median is $m_0 = ${f(ds[0].b)}$, against $H_1$: ${{ dos: 'it differs', mayor: 'it is greater', menor: 'it is smaller' }[h1]}; with $α = ${f(alfa)}$ and ${nTotal} data points.` });
    pasos.push({ t: 'Differences', html: `$${dif}$ are calculated${nz.length < nTotal ? ` and the ${nTotal - n} that equal 0 are discarded, leaving $n = ${n}$` : `, with $n = ${n}$`}. The $|d_i|$ are ranked${t.length ? ' (ties get the mean of the ranks they occupy)' : ''}.` });
    pasos.push({ t: 'Sum of ranks', html: `$W^+ = ${sumaTxt(nz.filter((q) => q.d > 0).map((q) => f(q.r)))} = ${f(Wp)}$ (positive differences) and $W^− = ${f(Wm)}$ (negative); check: $W^+ + W^− = n(n + 1)/2 = ${f(Wp + Wm)}$. Under $H_0$, $W^+$ is around $n(n + 1)/4 = ${f(mu)}$.` });
    if (exacto) pasos.push({ t: 'p-valor exacto', html: `Without ties and with $n ≤ 25$, $W^+$ is the sum of any subset of $\\{1, …, ${n}\\}$ (the $2^{${n}}$ sign assignments are equally likely). ${h1 === 'mayor' ? `$p = P(W^+ ≥ ${f(Wp)}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(W^+ ≤ ${f(Wp)}) = ${ES.prob(p)}$` : `$p = 2 · P(\\text{smaller tail}) = ${ES.prob(p)}$`}.` });
    else pasos.push({ t: 'Normal approximation', html: `$W^+$ is almost normal with mean $${f(mu)}$ and $σ = √({n(n + 1)(2n + 1)}/24${t.length ? ' − {∑ (t^3 − t)}/48' : ''}) = ${f(sigma)}$.<br>$z = {W^+ − μ${cc ? ' ∓ 0,5' : ''}}/σ = ${f(z)}$ y $p = ${ES.prob(p)}$.` });
    const sg = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - corr / 48), zEf = (Wp - mu) / sg, rEf = Math.abs(zEf) / Math.sqrt(n), rb = (Wp - Wm) / (Wp + Wm);
    const walsh = []; for (let i = 0; i < n; i++) for (let j = i; j < n; j++) walsh.push((nz[i].d + nz[j].d) / 2);
    let cw = null; if (exacto) { cw = new Map([[0, 1]]); for (let v = 1; v <= n; v++) { const nu = new Map(cw); for (const [q, c] of cw) nu.set(q + v, (nu.get(q + v) || 0) + c); cw = nu; } }
    const hl = hodges(walsh, (n * (n + 1)) / 2, mu, sg, exacto, cw, alfa);
    pasos.push({ t: 'Effect size', html: `Rank-biserial correlation: $r_b = (W^+ − W^−)/(W^+ + W^−) = ${f(rb)}$ (from −1 to 1; 0 = no effect). Effect size $r = |z|/√n = ${f(rEf)}$ (0.1 small, 0.3 medium, 0.5 large).` });
    pasos.push({ t: 'Hodges-Lehmann estimator', html: `The typical shift is the median of the $n(n + 1)/2$ Walsh averages $(d_i + d_j)/2$: <b>${f(hl.est)}</b>${isFinite(hl.lo) ? `, with a ${nivel(alfa)} % confidence interval of $(${f(hl.lo)}, ${f(hl.hi)})$ (${exacto ? 'exact' : 'by the normal approximation'})` : ''}.` });
    pasos.push({ t: 'Conclusion', html: p < alfa ? `<b>$H_0$ is rejected</b> at a significance level of ${f(100 * alfa)} %.` : `<b>$H_0$ is not rejected</b> at a significance level of ${f(100 * alfa)} %: there is not enough evidence.` });
    return { tipo: pares ? 'pares' : 'mediana', h1, ds, nz, nTotal, n, Wp, Wm, mu, z, sigma, p, exacto, rEf, rb, hl, zEf, empates: t.length > 0, rechaza: p < alfa, alfa, pasos, est: Wp };
  }


  function kruskal(sc, alfa) {
    const g = []; String(sc.datos ?? '').split(/\r?\n/).forEach((lin, i) => { const l = lin.trim(); if (!l || l.startsWith('#')) return; const j = l.indexOf(':'), nom = j > 0 ? l.slice(0, j).trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : `Group ${g.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `line ${i + 1}`); if (!x.length) throw new Error(`Line ${i + 1} has no values`); g.push({ nom, x, n: x.length }); });
    if (g.length < 2) throw new Error('Enter at least two groups, one per line');
    const k = g.length, todos = g.flatMap((q) => q.x), N = todos.length, { r, t, corr } = rangos(todos);
    if (corr >= N * N * N - N) throw new Error('All the data are equal: the test cannot be carried out');
    let pos = 0; for (const q of g) { q.R = suma(r.slice(pos, pos + q.n)); q.Rm = q.R / q.n; q.rangos = r.slice(pos, pos + q.n); pos += q.n; }
    const Hs = (12 / (N * (N + 1))) * suma(g.map((q) => (q.R * q.R) / q.n)) - 3 * (N + 1), C = 1 - corr / (N * N * N - N), H = Hs / C, gl = k - 1, p = ES.DIST.chi2.sf({ k: gl }, H), crit = ES.cuantil(ES.DIST.chi2, { k: gl }, 1 - alfa), eps2 = H / (N - 1);
    const post = POST[sc.post] && sc.post !== 'no' ? sc.post : 'no', pares = [];
    if (post !== 'no') {
      const v = N * (N + 1) / 12 - corr / (12 * (N - 1));
      for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) { const z = (g[i].Rm - g[j].Rm) / Math.sqrt(v * (1 / g[i].n + 1 / g[j].n)); pares.push({ a: g[i].nom, b: g[j].nom, dif: g[i].Rm - g[j].Rm, z, p0: Math.min(1, 2 * ES.Phi(-Math.abs(z))) }); }
      const aj = post === 'holm' ? IN.holm(pares.map((q) => q.p0)) : IN.bonferroni(pares.map((q) => q.p0));
      pares.forEach((q, i) => { q.p = aj[i]; q.sig = q.p < alfa; });
    }
    const pasos = [
      { t: 'Hypotheses', html: `$H_0$: the ${k} groups come from the same distribution (none tends to give larger values), against $H_1$: some tend to give different values; $α = ${f(alfa)}$, $N = ${N}$ data points.` },
      { t: 'Ranks', html: `The ${N} data points are ordered together and given their rank (1 to the smallest${t.length ? '; ties get the mean of the ranks they occupy' : ''}). Rank sums: ${g.slice(0, 6).map((q, i) => `$R_{${i + 1}} = ${f(q.R)}$ ($n_{${i + 1}} = ${q.n}$)`).join(', ')}${k > 6 ? ', …' : ''}. Check: $∑ R_i = N(N + 1)/2 = ${f(suma(g.map((q) => q.R)))}$.` },
      { t: 'H statistic', html: `$H = {12}/{N(N + 1)} ∑ {R_i^2}/{n_i} − 3(N + 1) = ${f(Hs)}$${t.length ? `; with the tie correction $C = 1 − {∑ (t^3 − t)}/{N^3 − N} = ${f(C, 5)}$ it becomes $H = ${f(H)}$` : ''}. Under $H_0$ it follows (approximately) a $χ^2$ with $k − 1 = ${gl}$ degrees of freedom${g.some((q) => q.n < 5) ? '; with groups of fewer than 5 data points the approximation is rough' : ''}.` },
      { t: 'Critical region and p-value', html: `The critical value is $χ^2_{${gl}; ${f(1 - alfa)}} = ${f(crit)}$ and the p-value, $P(χ^2_{${gl}} ≥ ${f(H)}) = ${ES.prob(p)}$.` },
      { t: 'Effect size', html: `$ε^2 = H/(N − 1) = ${f(eps2, 3)}$: the share of the variability of the ranks explained by the groups (0.01 small, 0.08 medium, 0.26 large).` },
      { t: 'Conclusion', html: p < alfa ? `<b>$H_0$ is rejected</b> at a significance level of ${f(100 * alfa)} %: some group differs from the others.` : `<b>$H_0$ is not rejected</b> at a significance level of ${f(100 * alfa)} %: there is no evidence that the groups differ.` },
    ];
    if (pares.length) pasos.push({ t: `Dunn comparisons (${post === 'holm' ? 'Holm' : 'Bonferroni'})`, html: `For each pair, $z = {R̄_i − R̄_j}/√({N(N + 1)}/12 · (1/n_i + 1/n_j))$${t.length ? ' (with the tie correction)' : ''}, and the p-value is adjusted for the $m = ${pares.length}$ comparisons (${post === 'holm' ? 'Holm: more powerful' : 'Bonferroni: multiplied by m'}). For example, ${pares[0].a} − ${pares[0].b}: $z = ${f(pares[0].z)}$, $p = ${ES.prob(pares[0].p)}$.${p < alfa ? '' : ' With a non-significant H, these comparisons are only indicative.'}` });
    return { tipo: 'kw', g, k, N, H, Hs, C, gl, p, crit, eps2, pares, post, rechaza: p < alfa, alfa, pasos, est: H };
  }

  function signos(sc, alfa, pares) {
    const h1 = H1[sc.h1] ? sc.h1 : 'dos';
    let ds; if (pares) { const ft = filas(sc.datos, 2, 'the paired data'); if (!ft.length) throw new Error('The table of “before after” pairs is missing'); ds = ft.map(([a, b]) => ({ a, b, d: a - b })); } else { const x = lista(sc.datos, 'la muestra'), m0 = lee(sc, 'm0', 'the H₀ median'); if (!x.length) throw new Error('The sample is missing'); ds = x.map((a) => ({ a, b: m0, d: a - m0 })); }
    const mas = ds.filter((q) => q.d > 0).length, menos = ds.filter((q) => q.d < 0).length, n = mas + menos, ceros = ds.length - n;
    if (n < 1) throw new Error('All the differences are 0: the test cannot be carried out');
    const pb = (k) => { let s = 0, c = 1; for (let i = 0; i <= k; i++) { s += c; c = (c * (n - i)) / (i + 1); } return Math.min(1, s / 2 ** n); };
    const le = pb(mas), ge = pb(menos);   // P(X ≤ n⁺) y P(X ≥ n⁺) = P(X ≤ n⁻)
    const p = pvalor(h1, le, ge), mu = n / 2, z = (mas - mu) / Math.sqrt(n / 4);
    const pasos = [
      { t: 'Hypotheses', html: pares ? `$H_0$: the median of the differences is 0, that is, each difference is positive or negative with probability $1/2$; against $H_1$: ${{ dos: 'no', mayor: 'the first measurement tends to be larger', menor: 'the first measurement tends to be smaller' }[h1] === 'no' ? 'the probabilities are not equal' : { mayor: 'the first measurement tends to be larger', menor: 'the first measurement tends to be smaller' }[h1]}; $α = ${f(alfa)}$.` : `$H_0$: the median is $m_0 = ${f(ds[0].b)}$ (each data point is above or below with probability $1/2$), against $H_1$: ${{ dos: 'it differs', mayor: 'it is greater', menor: 'it is smaller' }[h1]}; $α = ${f(alfa)}$.` },
      { t: 'Signs', html: `The signs of $d_i$ are counted (the $0$s are discarded${ceros ? `: ${ceros}` : ''}): $n^+ = ${mas}$ positive and $n^− = ${menos}$ negative, $n = ${n}$.` },
      { t: 'p-valor exacto', html: `If $H_0$ is true, $n^+$ follows a binomial $B(${n}, 1/2)$. ${h1 === 'mayor' ? `$p = P(X ≥ ${mas}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(X ≤ ${mas}) = ${ES.prob(p)}$` : `$p = 2 · P(X ≤ ${Math.min(mas, menos)}) = ${ES.prob(p)}$ (capped at 1)`}. Normal approximation for comparison: $z = (n^+ − n/2)/√(n/4) = ${f(z)}$.` },
      { t: 'Conclusion', html: p < alfa ? `<b>$H_0$ is rejected</b> at a significance level of ${f(100 * alfa)} %.` : `<b>$H_0$ is not rejected</b> at a significance level of ${f(100 * alfa)} %: there is not enough evidence. The sign test only uses the sign, which is why it is the least powerful of the rank tests.` },
    ];
    return { tipo: pares ? 'signos' : 'signosmed', h1, ds, mas, menos, n, ceros, p, z, rechaza: p < alfa, alfa, pasos, est: mas };
  }

  function correlacion(sc, alfa) {
    const ft = filas(sc.datos, 2, 'los datos'); if (ft.length < 3) throw new Error('At least 3 “x y” pairs are needed');
    const x = ft.map((q) => q[0]), y = ft.map((q) => q[1]), n = ft.length, h1 = H1[sc.h1] ? sc.h1 : 'dos';
    const sp = IN.spearman(x, y), ke = IN.kendall(x, y);
    if (!isFinite(sp.rho) || !isFinite(ke.tau)) throw new Error('One of the two variables is constant (or has only one value): there is no correlation to test');
    const un = (est, p2) => (h1 === 'dos' ? p2 : (h1 === 'mayor' ? est > 0 : est < 0) ? p2 / 2 : 1 - p2 / 2), pS = un(sp.rho, sp.p), pK = un(ke.tau, ke.p);
    const rx = IN.rangosDe(x).r, ry = IN.rangosDe(y).r;
    const pasos = [
      { t: 'Hypotheses', html: `$H_0$: there is no monotonic association between the two variables ($ρ_s = 0$, $τ = 0$), against $H_1$: ${{ dos: 'there is one', mayor: 'the association is positive', menor: 'the association is negative' }[h1]}; $α = ${f(alfa)}$, $n = ${n}$.` },
      { t: 'Ranks', html: `Each variable is replaced by its ranks (${n} pairs; ties get the mean of the ranks).` },
      { t: 'Spearman', html: `$ρ_s$ is the Pearson correlation of the ranks: $ρ_s = ${f(sp.rho, 5)}$. Test: $t = ρ_s √{(n − 2)/(1 − ρ_s^2)} = ${f(sp.t)}$ with $${n - 2}$ d.f., $p = ${ES.prob(pS)}$.${n < 10 ? ' With fewer than 10 pairs this approximation is rough.' : ''}` },
      { t: 'Kendall', html: `The concordant pairs $C = ${ke.C}$ and discordant pairs $D = ${ke.D}$ are counted (between each two points, whether $x$ and $y$ grow together or not): $τ_b = {C − D}/√{(n_0 − n_1)(n_0 − n_2)} = ${f(ke.tau, 5)}$ (corrected with ties; without them, $τ = (C − D)/(n(n − 1)/2)$). ${ke.exacto ? `Without ties and with $n ≤ 40$ the p-value is exact (the permutations are counted by their number of inversions): $p = ${ES.prob(pK)}$.` : `With the normal approximation (with the variance corrected for ties): $z = ${f(ke.z)}$, $p = ${ES.prob(pK)}$.`}` },
      { t: 'Conclusion', html: `${pS < alfa ? '<b>$H_0$ is rejected with Spearman</b>' : '<b>$H_0$ is not rejected with Spearman</b>'} and ${pK < alfa ? '<b>rejected with Kendall</b>' : '<b>not rejected with Kendall</b>'} at ${f(100 * alfa)} %. Kendall is more reliable with little data and many ties; Spearman is closer to Pearson's coefficient.` },
    ];
    return { tipo: 'correlacion', h1, x, y, n, sp, ke, pS, pK, rx, ry, rechaza: pS < alfa || pK < alfa, alfa, pasos, est: sp.rho };
  }

  function resolver(sc) {
    const alfa = alfaDe(sc), tipo = TIPOS[sc.tipo] ? sc.tipo : 'mw';
    if (tipo === 'kw') return kruskal(sc, alfa);
    if (tipo === 'signos' || tipo === 'signosmed') return signos(sc, alfa, tipo === 'signos');
    if (tipo === 'correlacion') return correlacion(sc, alfa);
    return tipo === 'mw' ? mannWhitney(sc, alfa) : wilcoxon(sc, alfa, tipo === 'pares');
  }

  const ejemplos = [
    { clave: 'metodos', nombre: 'Mann-Whitney: two study methods (exact)', sc: { tipo: 'mw', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', datos1: '14 17 16 19 22', datos2: '10 12 15 11 13 9' } },
    { clave: 'empates', nombre: 'Mann-Whitney with ties (normal approximation)', sc: { tipo: 'mw', h1: 'mayor', alfa: '0,05', exacto: 'si', cc: 'si', datos1: '3 4 4 5 5 5 6 7', datos2: '2 3 3 4 4 5 5 6' } },
    { clave: 'dieta', nombre: 'Paired Wilcoxon: weight before and after a diet', sc: { tipo: 'pares', h1: 'mayor', alfa: '0,05', exacto: 'si', cc: 'si', datos: '82 78\n91 85\n77 75\n88 89\n95 88\n79 79\n84 76\n90 79' } },
    { clave: 'mediana', nombre: 'Wilcoxon for the median: is it 50?', sc: { tipo: 'mediana', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', m0: '50', datos: '54 61 48 58 66 53 63 57 49 60' } },
    { clave: 'kruskal', nombre: 'Kruskal-Wallis and Dunn: three study methods', sc: { tipo: 'kw', alfa: '0,05', post: 'holm', datos: 'Method A: 14 17 16 19 22\nMethod B: 10 12 15 11 13 9\nMethod C: 20 24 21 26 23 25' } },
    { clave: 'kruskal-empates', nombre: 'Kruskal-Wallis with ties', sc: { tipo: 'kw', alfa: '0,05', post: 'bonferroni', datos: 'Mild: 3 4 4 5 5\nModerate: 4 5 6 6 7 7\nSevere: 6 7 7 8 9 9 9' } },
    { clave: 'signos', nombre: 'Sign test: before and after', sc: { tipo: 'signos', h1: 'mayor', alfa: '0,05', datos: '82 78\n91 85\n77 75\n88 89\n95 88\n79 79\n84 76\n90 79' } },
    { clave: 'signos-mediana', nombre: 'Sign test for the median', sc: { tipo: 'signosmed', h1: 'dos', alfa: '0,05', m0: '50', datos: '54 61 48 58 66 53 63 57 49 60' } },
    { clave: 'correlacion', nombre: 'Spearman and Kendall: marks in two exams', sc: { tipo: 'correlacion', h1: 'dos', alfa: '0,05', datos: '1 2\n2 1\n3 4\n4 3\n5 7\n6 8\n7 5\n8 6' } },
    { clave: 'correlacion-empates', nombre: 'Kendall with ties', sc: { tipo: 'correlacion', h1: 'dos', alfa: '0,05', datos: '1 1\n2 3\n2 2\n3 2\n4 5\n4 6\n5 6' } },
  ];
  return { resolver, ejemplos, TIPOS, H1, POST, rangos };
})();

