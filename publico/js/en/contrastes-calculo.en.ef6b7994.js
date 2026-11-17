const Contrastes = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const IN = typeof Inferencia !== 'undefined' ? Inferencia : require('../estadistica/inferencia.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista } = K, D = ES.DIST;
  const TIPOS = { media: 'One mean μ', proporcion: 'One proportion p', varianza: 'One variance σ²', dosmedias: 'Two means μ₁ − μ₂', dosprop: 'Two proportions p₁ − p₂', dosvar: 'Two variances σ₁²/σ₂²', apareados: 'Paired data (mean of the differences)', varios: 'Several variances (Levene and Bartlett)', normalidad: 'Normality of a sample (Shapiro-Wilk)' };
  const ENTRADA = { resumen: 'Summary (n, x̄, s)', datos: 'List of data' };
  const METODOS = { levene: 'Levene (with the median, robust)', bartlett: 'Bartlett (if the data are normal)' };
  const TIPOS_VAR = ['media', 'varianza', 'dosmedias', 'apareados'];
  const H1 = { distinto: 'Two-tailed: ≠', mayor: 'One-tailed: >', menor: 'One-tailed: <' };
  const CASOS = { conocidas: 'σ₁ and σ₂ known (z)', iguales: 'Unknown but equal (t)', distintas: 'Unknown and unequal (Welch)' };
  const p4 = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const SIGNO = { distinto: '≠', mayor: '>', menor: '<' };

  const dist = { z: () => [D.normal, { mu: 0, sigma: 1 }, 'N(0, 1)'], t: (nu) => [D.t, { nu }, `Student's t with ${f(nu, 5)} degrees of freedom`], chi2: (k) => [D.chi2, { k }, `χ² with ${k} degrees of freedom`], f: (d1, d2) => [D.f, { d1, d2 }, `Snedecor's F with (${d1}, ${d2}) degrees of freedom`] };
  const nomEst = { z: 'Z', t: 'T', chi2: 'χ²', f: 'F' };

  function decide(T, [Dd, P], h1, alfa, simetrica) {
    const q = (p) => ES.cuantil(Dd, P, p), cdf = Dd.cdf(P, T), sf = Dd.sf ? Dd.sf(P, T) : 1 - cdf;
    let crit, rechaza, pv;
    if (h1 === 'mayor') { crit = [q(1 - alfa)]; rechaza = T > crit[0]; pv = sf; }
    else if (h1 === 'menor') { crit = [q(alfa)]; rechaza = T < crit[0]; pv = cdf; }
    else if (simetrica) { const c = q(1 - alfa / 2); crit = [-c, c]; rechaza = Math.abs(T) > c; pv = 2 * Math.min(cdf, sf); }
    else { crit = [q(alfa / 2), q(1 - alfa / 2)]; rechaza = T < crit[0] || T > crit[1]; pv = 2 * Math.min(cdf, sf); }
    return { crit, rechaza, pv: Math.min(1, pv) };
  }
  const regionTxt = (crit, h1, e) => h1 === 'mayor' ? `$${e} > ${f(crit[0])}$` : h1 === 'menor' ? `$${e} < ${p4(crit[0])}$` : crit[0] === -crit[1] ? `$|${e}| > ${f(crit[1])}$` : `$${e} < ${f(crit[0])}$ o $${e} > ${f(crit[1])}$`;

  function media(sc) {
    const n = lee(sc, 'n', 'the sample size n', { min: 2, entero: true }), xm = lee(sc, 'xm', 'the sample mean x̄'), mu0 = lee(sc, 'mu0', 'the H₀ value μ₀');
    const conocida = sc.sigmaC === 'si', s = lee(sc, 's', conocida ? 'the population σ' : 'the sample standard deviation s', { min: 0, minEx: true });
    const se = s / Math.sqrt(n), T = (xm - mu0) / se;
    return { par: 'μ', v0: mu0, est: T, d: conocida ? dist.z() : dist.t(n - 1), e: conocida ? 'Z' : 'T', sim: true, estimado: xm,
      formula: `$${conocida ? 'Z' : 'T'} = {x̄ − μ_0}/{${conocida ? 'σ' : 's'}/√n} = {${f(xm, 6)} − ${p4(mu0)}}/{${f(s)}/√${n}} = {${f(xm - mu0)}}/{${f(se)}} = ${f(T)}$`,
      porque: conocida ? 'With known σ, the sample mean is normal and is standardized with z.' : `With unknown σ the sample s is used, and the statistic follows Student's t with $n − 1 = ${n - 1}$ degrees of freedom.` };
  }
  function proporcion(sc) {
    const n = lee(sc, 'n', 'the sample size n', { min: 1, entero: true }), x = lee(sc, 'x', 'the number of successes x', { min: 0, max: n, entero: true }), p0 = lee(sc, 'p0', 'the H₀ proportion p₀', { min: 0, minEx: true, max: 1, maxEx: true });
    const ph = x / n, se = Math.sqrt((p0 * (1 - p0)) / n), T = (ph - p0) / se;
    return { par: 'p', v0: p0, est: T, d: dist.z(), e: 'Z', sim: true, estimado: ph,
      formula: `$p̂ = x/n = ${x}/${n} = ${f(ph)}$<br>$Z = {p̂ − p_0}/{√(p_0 (1 − p_0)/n)} = {${f(ph)} − ${f(p0)}}/{√(${f(p0)} · ${f(1 - p0)}/${n})} = {${f(ph - p0)}}/{${f(se)}} = ${f(T)}$`,
      porque: `With large n, $p̂$ is approximately normal; under $H_0$, $p_0$ is used for the standard error${n * p0 < 5 || n * (1 - p0) < 5 ? '. Careful: $n p_0$ or $n (1 − p_0)$ is less than 5 and the normal approximation is not good' : ` ($n p_0 = ${f(n * p0)}$ and $n (1 − p_0) = ${f(n * (1 - p0))}$, both at least 5)`}.` };
  }
  function varianza(sc) {
    const n = lee(sc, 'n', 'the sample size n', { min: 2, entero: true }), s = lee(sc, 's', 'the sample standard deviation s', { min: 0, minEx: true }), s0 = lee(sc, 's0', 'the H₀ value σ₀', { min: 0, minEx: true });
    const T = ((n - 1) * s * s) / (s0 * s0);
    return { par: 'σ²', v0: s0 * s0, est: T, d: dist.chi2(n - 1), e: 'χ^2', sim: false, estimado: s * s,
      formula: `$χ^2 = {(n − 1) s^2}/{σ_0^2} = {${n - 1} · ${f(s)}^2}/{${f(s0)}^2} = {${f((n - 1) * s * s)}}/{${f(s0 * s0)}} = ${f(T)}$`,
      porque: `If the population is normal, $(n − 1) s^2/σ^2$ follows a χ² with $n − 1 = ${n - 1}$ degrees of freedom. It is not symmetric: in the two-tailed case the two critical values are different.` };
  }
  function dosMedias(sc) {
    const n1 = lee(sc, 'n1', 'n₁', { min: 2, entero: true }), x1 = lee(sc, 'xm1', 'x̄₁'), s1 = lee(sc, 's1', sc.caso === 'conocidas' ? 'σ₁' : 's₁', { min: 0, minEx: true });
    const n2 = lee(sc, 'n2', 'n₂', { min: 2, entero: true }), x2 = lee(sc, 'xm2', 'x̄₂'), s2 = lee(sc, 's2', sc.caso === 'conocidas' ? 'σ₂' : 's₂', { min: 0, minEx: true });
    const d0 = lee(sc, 'd0', 'the H₀ difference', { def: 0 }), caso = CASOS[sc.caso] ? sc.caso : 'iguales', dif = x1 - x2;
    let se, d, extra = '';
    if (caso === 'conocidas') { se = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2); d = dist.z(); extra = `Standard error: $√(σ_1^2/n_1 + σ_2^2/n_2) = √(${f(s1)}^2/${n1} + ${f(s2)}^2/${n2}) = ${f(se)}$`; }
    else if (caso === 'iguales') {
      const sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2); se = Math.sqrt(sp2 * (1 / n1 + 1 / n2)); d = dist.t(n1 + n2 - 2);
      extra = `Pooled variance: $s_p^2 = {(n_1 − 1) s_1^2 + (n_2 − 1) s_2^2}/{n_1 + n_2 − 2} = {${n1 - 1} · ${f(s1)}^2 + ${n2 - 1} · ${f(s2)}^2}/{${n1 + n2 - 2}} = ${f(sp2)}$<br>Standard error: $s_p √(1/n_1 + 1/n_2) = ${f(Math.sqrt(sp2))} · √(1/${n1} + 1/${n2}) = ${f(se)}$`;
    } else {
      const a = s1 * s1 / n1, b = s2 * s2 / n2, nu = (a + b) ** 2 / (a * a / (n1 - 1) + b * b / (n2 - 1)); se = Math.sqrt(a + b); d = dist.t(nu);
      extra = `Standard error: $√(s_1^2/n_1 + s_2^2/n_2) = ${f(se)}$<br>Welch degrees of freedom: $ν = {(s_1^2/n_1 + s_2^2/n_2)^2}/{{(s_1^2/n_1)^2}/{n_1 − 1} + {(s_2^2/n_2)^2}/{n_2 − 1}} = ${f(nu, 5)}$`;
    }
    const e = caso === 'conocidas' ? 'Z' : 'T', T = (dif - d0) / se;
    return { par: 'μ₁ − μ₂', v0: d0, est: T, d, e, sim: true, estimado: dif,
      formula: `${extra}<br>$${e} = {(x̄_1 − x̄_2) − ${f(d0)}}/{"error típico"} = {${f(x1, 6)} − ${p4(x2)}${d0 ? ` − ${p4(d0)}` : ''}}/{${f(se)}} = ${f(T)}$`,
      porque: { conocidas: 'With both σ known, the difference of means is normal.', iguales: 'With unknown but equal variances, they are pooled into a single variance and the t with $n_1 + n_2 − 2$ degrees of freedom is used.', distintas: 'With unknown and unequal variances the Welch approximation is used, with degrees of freedom that need not be integers.' }[caso] };
  }
  function dosProp(sc) {
    const n1 = lee(sc, 'n1', 'n₁', { min: 1, entero: true }), x1 = lee(sc, 'x1', 'x₁', { min: 0, max: n1, entero: true }), n2 = lee(sc, 'n2', 'n₂', { min: 1, entero: true }), x2 = lee(sc, 'x2', 'x₂', { min: 0, max: n2, entero: true });
    const p1 = x1 / n1, p2 = x2 / n2, pc = (x1 + x2) / (n1 + n2), se = Math.sqrt(pc * (1 - pc) * (1 / n1 + 1 / n2));
    if (!(se > 0)) throw new Error('With all successes or no successes in both samples there is no variation: the test cannot be carried out');
    const T = (p1 - p2) / se;
    return { par: 'p₁ − p₂', v0: 0, est: T, d: dist.z(), e: 'Z', sim: true, estimado: p1 - p2,
      formula: `$p̂_1 = ${x1}/${n1} = ${f(p1)}$, $p̂_2 = ${x2}/${n2} = ${f(p2)}$ and, since under $H_0$ they are equal, the pooled proportion $p̂ = {x_1 + x_2}/{n_1 + n_2} = ${x1 + x2}/${n1 + n2} = ${f(pc)}$<br>$Z = {p̂_1 − p̂_2}/{√(p̂ (1 − p̂) (1/n_1 + 1/n_2))} = {${f(p1 - p2)}}/{${f(se)}} = ${f(T)}$`,
      porque: 'With large samples, the difference of proportions is approximately normal.' };
  }
  function dosVar(sc) {
    const n1 = lee(sc, 'n1', 'n₁', { min: 2, entero: true }), s1 = lee(sc, 's1', 's₁', { min: 0, minEx: true }), n2 = lee(sc, 'n2', 'n₂', { min: 2, entero: true }), s2 = lee(sc, 's2', 's₂', { min: 0, minEx: true });
    const T = (s1 * s1) / (s2 * s2);
    return { par: 'σ₁²/σ₂²', v0: 1, est: T, d: dist.f(n1 - 1, n2 - 1), e: 'F', sim: false, estimado: T,
      formula: `$F = s_1^2/s_2^2 = ${f(s1)}^2/${f(s2)}^2 = ${f(s1 * s1)}/${f(s2 * s2)} = ${f(T)}$`,
      porque: `If both populations are normal and $σ_1 = σ_2$, the ratio of the sample variances follows an F with $(n_1 − 1, n_2 − 1) = (${n1 - 1}, ${n2 - 1})$ degrees of freedom.` };
  }
  const CALC = { media, proporcion, varianza, dosmedias: dosMedias, dosprop: dosProp, dosvar: dosVar };

  function resolverBase(sc, alfa, tipo, h1) {
    const r = CALC[tipo](sc), { crit, rechaza, pv } = decide(r.est, r.d, h1, alfa, r.sim);
    const v0 = tipo === 'varianza' ? `${f(r.v0)} (σ_0 = ${f(Math.sqrt(r.v0))})` : f(r.v0), par = (sc.__apareados ? 'μ_d' : r.par).replace(/₁/g, '_1').replace(/₂/g, '_2').replace(/²/g, '^2');
    const pasos = [];
    pasos.push({ t: 'Hypotheses', html: `$H_0: ${par} ${h1 === 'distinto' ? '=' : h1 === 'mayor' ? '≤' : '≥'} ${v0}$ &ensp; against &ensp; $H_1: ${par} ${SIGNO[h1]} ${f(r.v0)}$, with $α = ${f(alfa)}$.` });
    pasos.push({ t: 'Test statistic', html: `${r.porque}<br>${r.formula}` });
    pasos.push({ t: 'Critical region', html: `Under $H_0$ the statistic follows a ${r.d[2]}. ${h1 === 'distinto' ? `$α/2 = ${f(alfa / 2)}$ is left in each tail` : `$α = ${f(alfa)}$ is left in the ${h1 === 'mayor' ? 'right' : 'left'} tail`}: $H_0$ is rejected if ${regionTxt(crit, h1, r.e)}.<br>The statistic is $${r.e} = ${f(r.est)}$: ${rechaza ? '<b>it falls in the critical region</b>' : '<b>it does not fall in the critical region</b>'}.` });
    const pvTxt = h1 === 'mayor' ? `P(${r.e} ≥ ${f(r.est)})` : h1 === 'menor' ? `P(${r.e} ≤ ${f(r.est)})` : r.sim ? `2 P(${r.e} ≥ ${f(Math.abs(r.est))})` : `2 min(P(${r.e} ≤ ${f(r.est)}), P(${r.e} ≥ ${f(r.est)}))`;
    pasos.push({ t: 'p-valor', html: `$p = ${pvTxt} = ${f(pv)}$, ${pv < alfa ? `less than $α = ${f(alfa)}$` : `greater than $α = ${f(alfa)}$`}: $H_0$ is ${pv < alfa ? 'rejected' : 'not rejected'}, the same as with the critical region. The p-value is the probability of obtaining a result as unusual as this one, or more, if $H_0$ were true.` });
    pasos.push({ t: 'Conclusion', html: rechaza ? `<b>$H_0$ is rejected</b> at a significance level of ${f(100 * alfa)} %: the data give evidence that $${par} ${SIGNO[h1]} ${f(r.v0)}$.` : `<b>$H_0$ is not rejected</b> at a significance level of ${f(100 * alfa)} %: the data do not give enough evidence that $${par} ${SIGNO[h1]} ${f(r.v0)}$ (this does not mean $H_0$ is true, only that it cannot be ruled out).` });
    return { tipo, h1, alfa, ...r, crit, rechaza, pv, pasos };
  }



  const prom = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const desv = (v) => { const m = prom(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)); };
  const num = (x) => String(x);
  function deriva(sc, tipo) {
    const conoc = sc.sigmaC === 'si' || sc.caso === 'conocidas';
    if (tipo === 'apareados') {
      const x = lista(sc.datos1, 'the “before” data (sample 1)'), y = lista(sc.datos2, 'the “after” data (sample 2)');
      if (x.length !== y.length) throw new Error(`Paired data must come in pairs: there are ${x.length} values in sample 1 and ${y.length} in sample 2`);
      if (x.length < 3) throw new Error('At least 3 pairs are needed to test the mean of the differences');
      const d = x.map((v, i) => v - y[i]);
      if (!(desv(d) > 0)) throw new Error('All the differences are equal (deviation 0): the t statistic is not defined');
      return { sc: { ...sc, tipo: 'media', sigmaC: 'no', n: num(d.length), xm: num(prom(d)), s: num(desv(d)), mu0: vacio(sc.mu0) ? '0' : sc.mu0, __apareados: 1 }, pre: `Differences $d_i = x_i − y_i$: $n = ${d.length}$, $d̄ = ${f(prom(d))}$, $s_d = ${f(desv(d))}$.`, muestras: [{ nom: 'las diferencias', x: d }] };
    }
    if (sc.entrada !== 'datos' || !['media', 'varianza', 'dosmedias'].includes(tipo)) return { sc, pre: '', muestras: [] };
    const una = (k, nom) => { const x = lista(sc[k], nom); if (x.length < 2) throw new Error(`At least 2 data points are needed in ${nom}`); return x; };
    if (tipo === 'dosmedias') {
      const x = una('datos1', 'la muestra 1'), y = una('datos2', 'la muestra 2');
      return { sc: { ...sc, n1: num(x.length), xm1: num(prom(x)), s1: conoc ? sc.s1 : num(desv(x)), n2: num(y.length), xm2: num(prom(y)), s2: conoc ? sc.s2 : num(desv(y)) }, pre: `Sample 1: $n_1 = ${x.length}$, $x̄_1 = ${f(prom(x))}$, $s_1 = ${f(desv(x))}$. Sample 2: $n_2 = ${y.length}$, $x̄_2 = ${f(prom(y))}$, $s_2 = ${f(desv(y))}$.`, muestras: [{ nom: 'la muestra 1', x }, { nom: 'la muestra 2', x: y }] };
    }
    const x = una('datos', 'los datos');
    return { sc: { ...sc, n: num(x.length), xm: num(prom(x)), s: tipo === 'media' && conoc ? sc.s : num(desv(x)) }, pre: `From the data: $n = ${x.length}$, $x̄ = ${f(prom(x))}$, $s = ${f(desv(x))}$.`, muestras: [{ nom: 'los datos', x }] };
  }
  const vacio = K.vacio || ((v) => v === undefined || v === null || String(v).trim() === '');
  const normalidad = (muestras, alfa) => muestras.map((m) => { const sh = m.x.length >= 3 ? IN.shapiro(m.x) : null; return { nom: m.nom, n: m.x.length, W: sh ? sh.W : NaN, p: sh ? sh.p : NaN, ok: sh && isFinite(sh.p) ? sh.p >= alfa : null }; });

  const lim = (v) => { const a = Math.abs(v); return a < 0.2 ? 'despreciable' : a < 0.5 ? 'small' : a < 0.8 ? 'mediano' : 'grande'; };
  const asn = (p) => 2 * Math.asin(Math.sqrt(p));
  function efecto(sc, tipo, r) {
    if (tipo === 'media') { const s = lee(sc, 's', 's'), d = (r.estimado - r.v0) / s; return { nom: sc.__apareados ? 'Cohen\'s d of the differences' : 'Cohen\'s d', sim: 'd', val: d, txt: `$d = {x̄ − μ_0}/s = {${f(r.estimado)} − ${f(r.v0)}}/{${f(s)}} = ${f(d)}$` }; }
    if (tipo === 'dosmedias') {
      const n1 = lee(sc, 'n1', 'n1'), n2 = lee(sc, 'n2', 'n2'), s1 = lee(sc, 's1', 's1'), s2 = lee(sc, 's2', 's2'), sp = Math.sqrt(sc.caso === 'conocidas' ? (s1 * s1 + s2 * s2) / 2 : ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2)), d = (r.estimado - r.v0) / sp, J = 1 - 3 / (4 * (n1 + n2) - 9);
      return { nom: 'Cohen\'s d', sim: 'd', val: d, g: d * J, txt: `$d = {(x̄_1 − x̄_2) − d_0}/s_p = ${f(r.estimado - r.v0)}/${f(sp)} = ${f(d)}$ (with Hedges' correction for small samples, $g = ${f(d * J)}$)` };
    }
    if (tipo === 'proporcion') { const p0 = r.v0, h = asn(r.estimado) - asn(p0); return { nom: 'Cohen\'s h', sim: 'h', val: h, txt: `$h = 2 \\arcsin √{p̂} − 2 \\arcsin √{p_0} = ${f(asn(r.estimado))} − ${f(asn(p0))} = ${f(h)}$` }; }
    if (tipo === 'dosprop') { const p1 = lee(sc, 'x1', 'x1') / lee(sc, 'n1', 'n1'), p2 = lee(sc, 'x2', 'x2') / lee(sc, 'n2', 'n2'), h = asn(p1) - asn(p2); return { nom: 'Cohen\'s h', sim: 'h', val: h, txt: `$h = 2 \\arcsin √{p̂_1} − 2 \\arcsin √{p̂_2} = ${f(asn(p1))} − ${f(asn(p2))} = ${f(h)}$` }; }
    return null;
  }

  const MODELO = {
    media: (sc, real, n) => { const conoc = sc.sigmaC === 'si', s = lee(sc, 's', 's', { min: 0, minEx: true }), mu0 = lee(sc, 'mu0', 'μ0'), dl = (real - mu0) / (s / Math.sqrt(n)); return conoc ? { d: dist.z(), sim: true, k: 'z', mu: dl, sg: 1 } : { d: dist.t(n - 1), sim: true, k: 't', nu: n - 1, delta: dl }; },
    proporcion: (sc, p1, n) => { const p0 = lee(sc, 'p0', 'p0'), se0 = Math.sqrt((p0 * (1 - p0)) / n); return { d: dist.z(), sim: true, k: 'z', mu: (p1 - p0) / se0, sg: Math.sqrt((p1 * (1 - p1)) / n) / se0 }; },
    varianza: (sc, sr, n) => { const s0 = lee(sc, 's0', 's0'); return { d: dist.chi2(n - 1), sim: false, k: 'chi2', kk: n - 1, esc: (sr * sr) / (s0 * s0) }; },
    dosmedias: (sc, real, n1, n2) => {
      const s1 = lee(sc, 's1', 's1'), s2 = lee(sc, 's2', 's2'), d0 = lee(sc, 'd0', 'd0', { def: 0 }), caso = CASOS[sc.caso] ? sc.caso : 'iguales';
      if (caso === 'conocidas') { const se = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2); return { d: dist.z(), sim: true, k: 'z', mu: (real - d0) / se, sg: 1 }; }
      if (caso === 'iguales') { const sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2), se = Math.sqrt(sp2 * (1 / n1 + 1 / n2)), nu = n1 + n2 - 2; return { d: dist.t(nu), sim: true, k: 't', nu, delta: (real - d0) / se }; }
      const a = s1 * s1 / n1, b = s2 * s2 / n2, nu = (a + b) ** 2 / (a * a / (n1 - 1) + b * b / (n2 - 1)); return { d: dist.t(nu), sim: true, k: 't', nu, delta: (real - d0) / Math.sqrt(a + b) };
    },
    dosprop: (sc, dif, n1, n2) => {
      const p2 = lee(sc, 'x2', 'x2') / lee(sc, 'n2', 'n2'), p1 = p2 + dif; if (!(p1 > 0 && p1 < 1)) throw new Error(`With p₂ = ${f(p2)} observed, a true difference of ${f(dif)} gives a proportion p₁ = ${f(p1)} outside (0, 1)`);
      const pc = (n1 * p1 + n2 * p2) / (n1 + n2), se0 = Math.sqrt(pc * (1 - pc) * (1 / n1 + 1 / n2)), se1 = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
      return { d: dist.z(), sim: true, k: 'z', mu: dif / se0, sg: se1 / se0 };
    },
    dosvar: (sc, ratio, n1, n2) => ({ d: dist.f(n1 - 1, n2 - 1), sim: false, k: 'f', d1: n1 - 1, d2: n2 - 1, esc: ratio }),
  };
  const cdfAlt = (m, c) => (m.k === 'z' ? ES.Phi((c - m.mu) / m.sg) : m.k === 't' ? IN.nctCdf(c, m.nu, m.delta) : m.k === 'chi2' ? D.chi2.cdf({ k: m.kk }, c / m.esc) : D.f.cdf({ d1: m.d1, d2: m.d2 }, c / m.esc));
  const potDe = (m, h1, alfa) => {
    const c = decide(0, m.d, h1, alfa, m.sim).crit;
    const pw = h1 === 'mayor' ? 1 - cdfAlt(m, c[0]) : h1 === 'menor' ? cdfAlt(m, c[0]) : 1 - cdfAlt(m, c[1]) + cdfAlt(m, c[0]);
    return Math.min(1, Math.max(0, pw));
  };
  const PARAM = {
    media: { campo: 'real', nom: 'μ real', n: 'n' }, proporcion: { nom: 'p real', n: 'n' }, varianza: { nom: 'σ real', n: 'n' },
    dosmedias: { nom: 'μ₁ − μ₂ real', n: 'n1', n2: 'n2' }, dosprop: { nom: 'p₁ − p₂ real', n: 'n1', n2: 'n2' }, dosvar: { nom: 'σ₁²/σ₂² real', n: 'n1', n2: 'n2' },
  };
  function potencia(sc, tipo, h1, alfa, r) {
    const P = PARAM[tipo]; if (!P || vacio(sc.real)) return null;
    const real = lee(sc, 'real', 'the true value of the parameter'), n = lee(sc, P.n, 'n', { entero: true }), n2 = P.n2 ? lee(sc, P.n2, 'n2', { entero: true }) : 0;
    if (tipo === 'varianza' && !(real > 0)) throw new Error('The true σ must be positive');
    if (tipo === 'dosvar' && !(real > 0)) throw new Error('The true ratio σ₁²/σ₂² must be positive');
    const mod = (rv, a, b) => (MODELO[tipo].length === 4 ? MODELO[tipo](sc, rv, a, b) : MODELO[tipo](sc, rv, a)), pw = (rv, a = n, b = n2) => potDe(mod(rv, a, b), h1, alfa);
    const potencia = pw(real), objetivo = vacio(sc.pot) ? 0.8 : lee(sc, 'pot', 'the desired power', { min: 0, minEx: true, max: 1, maxEx: true });
    const tam = (k) => [Math.max(P.n2 ? 2 : 2, Math.ceil(k * n)), P.n2 ? Math.max(2, Math.ceil(k * n2)) : 0];
    let nec = null, a = 1, ya = pw(real) >= objetivo;
    if (!ya) { let b = 2, ok = false; for (let q = 0; q < 24; q++, b *= 2) { const [x, y] = tam(b); if (pw(real, x, y) >= objetivo) { ok = true; break; } } if (ok) { a = b / 2; for (let it = 0; it < 40 && b - a > 1e-3; it++) { const mdl = (a + b) / 2, [x, y] = tam(mdl); if (pw(real, x, y) >= objetivo) b = mdl; else a = mdl; } nec = tam(b); /* el menor entero n */ let [x, y] = nec; while (x > 2 && pw(real, x - 1, P.n2 ? Math.max(2, Math.ceil((x - 1) * n2 / n)) : 0) >= objetivo) { x--; y = P.n2 ? Math.max(2, Math.ceil(x * n2 / n)) : 0; } nec = [x, P.n2 ? Math.max(2, Math.ceil(x * n2 / n)) : 0]; } }
    else { let x = n, y = n2; while (x > 2 && pw(real, x - 1, P.n2 ? Math.max(2, Math.ceil((x - 1) * n2 / n)) : 0) >= objetivo) x--; nec = [x, P.n2 ? Math.max(2, Math.ceil(x * n2 / n)) : 0]; }
    const v0 = r.v0, centro = tipo === 'varianza' ? Math.sqrt(v0) : v0, amp = Math.max(Math.abs(real - centro) * 1.6, tipo === 'dosvar' ? 0.5 : 1e-9, tipo === 'proporcion' ? 0.05 : 0, Math.abs(centro) * 0.05, tipo === 'varianza' ? 0.3 * centro : 0);
    let lo = centro - amp, hi = centro + amp;
    if (tipo === 'proporcion') { lo = Math.max(0.001, lo); hi = Math.min(0.999, hi); } else if (tipo === 'varianza') lo = Math.max(centro * 0.2, lo); else if (tipo === 'dosvar') { lo = Math.max(0.05, lo); }
    const curva = []; for (let i = 0; i <= 60; i++) { const rv = lo + ((hi - lo) * i) / 60; try { curva.push([rv, pw(rv)]); } catch (e) { /* fuera de rango */ } }
    const alt = mod(real, n, n2);
    return { real, potencia, beta: 1 - potencia, objetivo, nec, necAlcanza: nec !== null, nom: P.nom, curva, alt, n, n2: P.n2 ? n2 : 0, centro };
  }

  function resolverNormalidad(sc, alfa) {
    const x = lista(sc.datos, 'los datos'); if (x.length < 3) throw new Error('At least 3 data points are needed'); if (x.length > 5000) throw new Error('Shapiro-Wilk is valid up to 5000 data points');
    const sh = IN.shapiro(x); if (!isFinite(sh.W)) throw new Error('All the data are equal: there is nothing to test');
    const jb = x.length >= 4 ? IN.jarqueBera(x) : null, m = prom(x), s = desv(x), ord = [...x].sort((a, b) => a - b), rechaza = sh.p < alfa;
    const q = ord.map((v, i) => [IN.ppnd((i + 1 - 0.375) / (x.length + 0.25)), v]);
    const pasos = [
      { t: 'Hypotheses', html: `$H_0$: the data come from a normal population, against $H_1$: they are not normal; $α = ${f(alfa)}$, $n = ${x.length}$, $x̄ = ${f(m)}$, $s = ${f(s)}$.` },
      { t: 'Shapiro-Wilk', html: `$W = {(∑ a_i x_{(i)})^2}/{∑ (x_i − x̄)^2} = ${f(sh.W, 5)}$ (the coefficients $a_i$ come from the quantiles of a normal; Royston, 1995). $W$ equals 1 if the data are perfectly normal and drops if they are not. The p-value is $p = ${ES.prob(sh.p)}$.` },
      ...(jb ? [{ t: 'Jarque-Bera', html: `With skewness $g_1 = ${f(jb.g1)}$ and excess kurtosis $g_2 = ${f(jb.g2)}$: $JB = {n}/6 (g_1^2 + g_2^2/4) = ${f(jb.JB)}$, which for large $n$ follows a $χ^2$ with 2 degrees of freedom: $p = e^{−JB/2} = ${ES.prob(jb.p)}$.${x.length < 30 ? ' With little data it is unreliable: Shapiro-Wilk takes precedence.' : ''}` }] : []),
      { t: 'Quantile-quantile plot', html: 'Each ordered data point is plotted against the quantile it would have in a normal, $Φ^{-1}((i − 0.375)/(n + 0.25))$: if the points follow the line, the data are compatible with a normal.' },
      { t: 'Conclusion', html: rechaza ? `<b>$H_0$ is rejected</b>: with $α = ${f(alfa)}$ there is evidence that the data are not normal ($p = ${ES.prob(sh.p)}$).` : `<b>$H_0$ is not rejected</b>: there is no evidence against normality ($p = ${ES.prob(sh.p)}$). With little data this does not prove they are normal, only that nothing to the contrary is seen.` },
    ];
    return { tipo: 'normalidad', alfa, x, sh, jb, m, s, q, rechaza, est: sh.W, pv: sh.p, pasos };
  }
  function resolverVarios(sc, alfa) {
    const grupos = []; String(sc.datos ?? '').split(/\r?\n/).forEach((lin, i) => { const l = lin.trim(); if (!l || l.startsWith('#')) return; const j = l.indexOf(':'), nom = j > 0 ? l.slice(0, j).trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : `Group ${grupos.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `line ${i + 1}`); if (x.length < 2) throw new Error(`Line ${i + 1} needs at least 2 values`); grupos.push({ nom, x, n: x.length, s: desv(x) }); });
    if (grupos.length < 2) throw new Error('Enter at least two groups, one per line');
    if (grupos.some((g) => !(g.s > 0))) throw new Error('Some group has all its values equal (variance 0): the variances cannot be compared');
    const xs = grupos.map((g) => g.x), lev = IN.levene(xs, 'mediana'), levM = IN.levene(xs, 'media'), bar = IN.bartlett(xs), k = grupos.length, N = grupos.reduce((a, g) => a + g.n, 0);
    const met = sc.metodo === 'bartlett' ? 'bartlett' : 'levene', p = met === 'bartlett' ? bar.p : lev.p, rechaza = p < alfa;
    const pasos = [
      { t: 'Hypotheses', html: `$H_0$: $σ_1^2 = σ_2^2 = ⋯ = σ_{${k}}^2$ (the variances are equal), against $H_1$: at least one differs; $α = ${f(alfa)}$, $k = ${k}$ groups, $N = ${N}$.<br>Standard deviations: ${grupos.slice(0, 6).map((g, i) => `$s_{${i + 1}} = ${f(g.s)}$`).join(', ')}${k > 6 ? ', …' : ''}.` },
      { t: 'Levene (Brown-Forsythe)', html: `Each data point is replaced by its distance to the median of its group, $z_{ij} = |x_{ij} − \\tilde x_i|$, and an ANOVA is run on them: $W = ${f(lev.W)}$ with $${lev.gl1}$ and $${lev.gl2}$ degrees of freedom, $p = ${ES.prob(lev.p)}$. With the mean instead of the median: $W = ${f(levM.W)}$, $p = ${ES.prob(levM.p)}$. It is robust to non-normality.` },
      { t: 'Bartlett', html: `$B = {(N − k) \\ln s_p^2 − ∑ (n_i − 1) \\ln s_i^2}/{1 + [∑ 1/(n_i − 1) − 1/(N − k)]/(3(k − 1))} = ${f(bar.B)}$, which under $H_0$ follows a $χ^2$ with $${bar.gl}$ degrees of freedom: $p = ${ES.prob(bar.p)}$. It is more powerful than Levene if the data are normal, but very sensitive to their not being so.` },
      { t: 'Conclusion', html: `With ${met === 'bartlett' ? 'Bartlett' : 'Levene'}, $p = ${ES.prob(p)}$: ${rechaza ? '<b>$H_0$ is rejected</b>, the variances cannot be considered equal (in an ANOVA, use Welch\'s F and Games-Howell)' : '<b>$H_0$ is not rejected</b>, there is no evidence that the variances differ (the classical ANOVA can be used)'}.` },
    ];
    return { tipo: 'varios', alfa, grupos, k, N, lev, levM, bar, met, p, rechaza, est: met === 'bartlett' ? bar.B : lev.W, pv: p, pasos };
  }

  function resolver(sc) {
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'media', h1 = H1[sc.h1] ? sc.h1 : 'distinto';
    const alfa = lee(sc, 'alfa', 'the significance level α', { min: 0, minEx: true, max: 0.5, maxEx: true });
    if (tipo === 'normalidad') return resolverNormalidad(sc, alfa);
    if (tipo === 'varios') return resolverVarios(sc, alfa);
    const dv = deriva(sc, tipo), sc2 = dv.sc, tb = sc2.tipo && sc2.tipo !== tipo ? sc2.tipo : tipo;
    const r = resolverBase(sc2, alfa, tb, h1), norm = normalidad(dv.muestras, alfa), ef = efecto(sc2, tb, r), pot = potencia(sc2, tb, h1, alfa, r);
    if (dv.pre) r.pasos.unshift({ t: 'Data', html: dv.pre });
    if (norm.length) { const w = norm.filter((q) => q.ok === false); r.pasos.splice(r.pasos.length - 1, 0, { t: 'Normality of the data', html: `Shapiro-Wilk: ${norm.map((q) => (isFinite(q.W) ? `${q.nom}: $W = ${f(q.W, 4)}$, $p = ${ES.prob(q.p)}$` : `${q.nom}: cannot be calculated (3 non-constant data points are needed)`)).join('; ')}. ${w.length ? '<b>Warning:</b> normality is rejected for ' + w.map((q) => q.nom).join(' and ') + (['media', 'dosmedias'].includes(tb) ? '; with little data the t becomes unreliable (see the non-parametric tests)' : '') + '.' : 'There is no evidence against normality.'}` }); }
    if (ef) r.pasos.splice(r.pasos.length - 1, 0, { t: 'Effect size', html: `${ef.txt}. According to Cohen (0.2 small, 0.5 medium, 0.8 large), the effect is <b>${lim(ef.val)}</b>. A small p-value says the difference is not chance; the effect size says whether it is large.` });
    if (pot) {
      const pp = pot, af = h1 === 'distinto' ? 'bilateral' : 'unilateral';
      r.pasos.splice(r.pasos.length - 1, 0, { t: 'Power and type II error', html: `If the true value were $${pp.nom.replace(' real', '')} = ${f(pp.real)}$, the statistic would no longer follow the $H_0$ distribution but another, shifted one, and the probability of falling in the critical region (${af} test, $α = ${f(alfa)}$) is the <b>power</b> $1 − β = ${f(pp.potencia, 4)}$. The <b>type II error</b> is $β = ${f(pp.beta, 4)}$: failing to detect that difference even though it exists.${tb === 'media' && sc2.sigmaC !== 'si' || tb === 'dosmedias' && sc2.caso !== 'conocidas' ? ' With the $t$, the statistic under the alternative follows a non-central t.' : ''}<br>For a power of ${f(100 * pp.objetivo)} % ${pp.necAlcanza ? `$n = ${pp.nec[0]}$${pp.n2 ? ` and $n_2 = ${pp.nec[1]}$` : ''} are needed (now ${pp.n}${pp.n2 ? ` and ${pp.n2}` : ''}).` : 'no reasonable sample size is enough (is the true value on the opposite side of H₁?).'}` });
    }
    return { ...r, norm, efecto: ef, pot, mod: tb };
  }

  const ejemplos = [
    { clave: 'paquetes', nombre: 'One mean, σ known: weight of packages', sc: { tipo: 'media', h1: 'distinto', alfa: '0,05', sigmaC: 'si', n: '25', xm: '496', s: '10', mu0: '500' } },
    { clave: 'pilas', nombre: 'One mean, σ unknown (t): battery life', sc: { tipo: 'media', h1: 'mayor', alfa: '0,05', sigmaC: 'no', n: '16', xm: '12,6', s: '1,2', mu0: '12' } },
    { clave: 'encuesta', nombre: 'One proportion: voting intention', sc: { tipo: 'proporcion', h1: 'mayor', alfa: '0,05', n: '200', x: '58', p0: '0,25' } },
    { clave: 'maquina', nombre: 'One variance: precision of a machine', sc: { tipo: 'varianza', h1: 'mayor', alfa: '0,05', n: '20', s: '2,5', s0: '2' } },
    { clave: 'metodos', nombre: 'Two means: two teaching methods', sc: { tipo: 'dosmedias', h1: 'distinto', alfa: '0,05', caso: 'iguales', n1: '10', xm1: '85', s1: '4', n2: '12', xm2: '80', s2: '5', d0: '0' } },
    { clave: 'tratamiento', nombre: 'Two proportions: cure rate with two treatments', sc: { tipo: 'dosprop', h1: 'distinto', alfa: '0,05', n1: '150', x1: '45', n2: '150', x2: '30' } },
    { clave: 'proveedores', nombre: 'Two variances (F): two suppliers', sc: { tipo: 'dosvar', h1: 'distinto', alfa: '0,05', n1: '11', s1: '3', n2: '13', s2: '2' } },
    { clave: 'potencia', nombre: 'Power and sample size: battery life', sc: { tipo: 'media', h1: 'mayor', alfa: '0,05', sigmaC: 'no', n: '16', xm: '12,6', s: '1,2', mu0: '12', real: '12,5', pot: '0,9' } },
    { clave: 'potencia-dos', nombre: 'Power of two means: teaching methods', sc: { tipo: 'dosmedias', h1: 'distinto', alfa: '0,05', caso: 'iguales', n1: '10', xm1: '85', s1: '4', n2: '12', xm2: '80', s2: '5', d0: '0', real: '4', pot: '0,8' } },
    { clave: 'datos', nombre: 'One mean with the list of data (and its normality)', sc: { tipo: 'media', h1: 'distinto', alfa: '0,05', entrada: 'datos', sigmaC: 'no', mu0: '500', datos: '498 502 495 497 501 496 494 499 503 492 497 500' } },
    { clave: 'apareados', nombre: 'Paired data: before and after a course', sc: { tipo: 'apareados', h1: 'mayor', alfa: '0,05', mu0: '0', datos1: '6,2 5,8 7,1 4,9 6,5 5,2 7,4 6,0', datos2: '5,6 5,9 6,4 4,5 6,1 4,8 6,9 5,5' } },
    { clave: 'normalidad', nombre: 'Normality of a sample (Shapiro-Wilk)', sc: { tipo: 'normalidad', alfa: '0,05', datos: '2,1 3,4 1,9 5,6 4,4 3,8 2,7 9,1 3,3 4 2,2 3,1 6,5' } },
    { clave: 'varios', nombre: 'Several variances: three machines (Levene and Bartlett)', sc: { tipo: 'varios', alfa: '0,05', metodo: 'levene', datos: 'M1: 10,1 9,9 10,0 10,2 9,8\nM2: 10,5 9,2 10,9 9,0 10,3\nM3: 10,0 10,1 9,9 10,1 9,9' } },
  ];

  return { resolver, ejemplos, TIPOS, H1, CASOS, ENTRADA, METODOS, TIPOS_VAR, PARAM, MODELO, potDe, lim };
})();

