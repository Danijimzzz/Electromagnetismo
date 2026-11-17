const Chi2Bondad = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista, filas } = K, D = ES.DIST;
  const MODOS = { bondad: 'Goodness of fit', independencia: 'Independence or homogeneity (contingency table)', fisher: 'Fisher\'s exact test (2 × 2 table with little data)', mcnemar: 'McNemar (paired 2 × 2 data)' };
  const H1 = { distinto: 'Two-sided: the proportions differ', mayor: 'One-sided: odds ratio > 1', menor: 'One-sided: odds ratio < 1' };
  const MODELOS = { uniforme: 'Uniform (all classes equally likely)', dadas: 'Given proportions', binomial: 'Binomial B(n, p)', poisson: 'Poisson P(λ)', normal: 'Normal N(μ, σ) by intervals' };
  const COLUMNAS = { uniforme: 1, dadas: 2, binomial: 2, poisson: 2, normal: 3 };
  const suma = (v) => v.reduce((a, b) => a + b, 0);

  function tabla(texto, nom) {
    const lin = String(texto ?? '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !/[a-zñáéíóú]/i.test(l.replace(/e[+-]?\d/gi, '')));
    if (!lin.length) throw new Error(`${nom} is missing`);
    return filas(texto, (/[;\t]/.test(lin[0]) ? lin[0].split(/\s*[;\t]\s*/) : lin[0].split(/\s+/)).filter(Boolean).length, nom);
  }
  const frec = (o, nom) => { if (o.some((x) => x < 0 || !Number.isInteger(x))) throw new Error(`The observed frequencies of ${nom} must be integers from 0 upwards`); };

  function discretas(sc, modelo) {
    const t = tabla(sc.datos, 'the table of x values and frequencies');
    if (t[0].length !== 2) throw new Error('Enter in each row the value x and its observed frequency');
    const x = t.map((r) => r[0]), o = t.map((r) => r[1]);
    frec(o, 'la tabla');
    if (x.some((v, i) => !Number.isInteger(v) || v < 0 || (i && v !== x[i - 1] + 1))) throw new Error('The x values must be consecutive integers from smallest to largest (0, 1, 2…)');
    const N = suma(o), m = suma(x.map((v, i) => v * o[i])) / N, est = sc.estima !== 'no';
    let P, Dd, par, estTxt;
    if (modelo === 'binomial') {
      const n = lee(sc, 'nb', 'the number of trials n', { min: 1, entero: true });
      if (x[x.length - 1] > n) throw new Error(`There are x values greater than n = ${n}`);
      const p = est ? m / n : lee(sc, 'pb', 'the probability of success p', { min: 0, minEx: true, max: 1, maxEx: true });
      Dd = D.binomial; P = { n, p }; par = est ? 1 : 0;
      estTxt = est ? `$x̄ = {∑ x_i O_i}/N = ${f(m * N)}/${N} = ${f(m)}$ and, since the mean of a binomial is $n p$, $p̂ = x̄/n = ${f(m)}/${n} = ${f(p)}$` : '';
    } else {
      const l = est ? m : lee(sc, 'lambda', 'the mean λ', { min: 0, minEx: true });
      Dd = D.poisson; P = { lambda: l }; par = est ? 1 : 0;
      estTxt = est ? `The mean of a Poisson is λ: $λ̂ = x̄ = {∑ x_i O_i}/N = ${f(m * N)}/${N} = ${f(l)}$` : '';
    }
    if (!(est ? P.p ?? P.lambda : 1) && est) throw new Error('With all the frequencies at x = 0 the parameter cannot be estimated');
    const ult = x.length - 1, hasta = modelo === 'binomial' ? P.n : Infinity;
    const cl = x.map((v, i) => {
      const abajo = i === 0 && v > 0, arriba = i === ult && v < hasta;
      const p = abajo ? Dd.cdf(P, v) : arriba ? Dd.cola(P, v) : Dd.pmf(P, v);
      return { lo: abajo ? -Infinity : v, hi: arriba ? Infinity : v, o: o[i], p };
    });
    if (cl.length === 1) cl[0].p = 1;
    const nomD = modelo === 'binomial' ? `B(${P.n}, ${f(P.p)})` : `P(${f(P.lambda)})`;
    return { cl, N, par, Dd, P, nomD, estTxt, nomCl: (c) => c.lo === c.hi ? `x = ${c.lo}` : c.lo === -Infinity ? `x ≤ ${c.hi}` : c.hi === Infinity ? `x ≥ ${c.lo}` : `x = ${c.lo}–${c.hi}`, formP: (c) => c.lo === c.hi ? `P(X = ${c.lo})` : c.lo === -Infinity ? `P(X ≤ ${c.hi})` : c.hi === Infinity ? `P(X ≥ ${c.lo})` : `P(${c.lo} ≤ X ≤ ${c.hi})` };
  }
  function normal(sc) {
    const t = tabla(sc.datos, 'the table of intervals and frequencies');
    if (t[0].length !== 3) throw new Error('Enter in each row the lower end, the upper end and the observed frequency of the interval');
    const o = t.map((r) => r[2]);
    frec(o, 'la tabla');
    t.forEach((r, i) => { if (!(r[1] > r[0])) throw new Error(`In row ${i + 1}, the upper end must be greater than the lower`); if (i && Math.abs(r[0] - t[i - 1][1]) > 1e-9) throw new Error(`The intervals must be consecutive: row ${i + 1} starts at ${f(r[0])} and the previous one ends at ${f(t[i - 1][1])}`); });
    const N = suma(o), mc = t.map((r) => (r[0] + r[1]) / 2), est = sc.estima !== 'no';
    const mu = est ? suma(mc.map((v, i) => v * o[i])) / N : lee(sc, 'mu', 'the mean μ');
    const sigma = est ? Math.sqrt(suma(mc.map((v, i) => o[i] * (v - mu) ** 2)) / N) : lee(sc, 'sigma', 'the standard deviation σ', { min: 0, minEx: true });
    if (!(sigma > 0)) throw new Error('All the data are in a single interval: σ cannot be estimated');
    const P = { mu, sigma }, ult = t.length - 1;
    const cl = t.map((r, i) => ({ lo: i === 0 ? -Infinity : r[0], hi: i === ult ? Infinity : r[1], o: o[i] }));
    for (const c of cl) c.p = (c.hi === Infinity ? 1 : D.normal.cdf(P, c.hi)) - (c.lo === -Infinity ? 0 : D.normal.cdf(P, c.lo));
    return { cl, N, par: est ? 2 : 0, Dd: D.normal, P, nomD: `N(${f(mu)}, ${f(sigma)})`,
      estTxt: est ? `With the class marks $m_i$: $μ̂ = x̄ = {∑ m_i O_i}/N = ${f(mu)}$ and $σ̂ = √({∑ O_i (m_i − x̄)^2}/N) = ${f(sigma)}$` : '',
      nomCl: (c) => c.lo === -Infinity && c.hi === Infinity ? 'todo' : c.lo === -Infinity ? `x < ${f(c.hi)}` : c.hi === Infinity ? `x ≥ ${f(c.lo)}` : `${f(c.lo)}–${f(c.hi)}`,
      formP: (c) => c.lo === -Infinity ? `P(X < ${f(c.hi)})` : c.hi === Infinity ? `P(X ≥ ${f(c.lo)})` : `P(${f(c.lo)} ≤ X < ${f(c.hi)})` };
  }
  function sencillas(sc, modelo) {
    let o, w;
    if (modelo === 'uniforme') { o = lista(sc.datos, 'the observed frequencies'); w = o.map(() => 1); }
    else { const t = tabla(sc.datos, 'the table of frequencies and proportions'); if (t[0].length !== 2) throw new Error('Enter in each row the observed frequency and the expected proportion of the class'); o = t.map((r) => r[0]); w = t.map((r) => r[1]); }
    frec(o, 'las clases');
    if (w.some((v) => !(v > 0))) throw new Error('The expected proportions must be greater than 0');
    const W = suma(w), N = suma(o);
    return { cl: o.map((v, i) => ({ lo: i + 1, hi: i + 1, o: v, p: w[i] / W })), N, par: 0, nomD: modelo === 'uniforme' ? 'uniforme' : 'the given proportions', estTxt: '', W, w,
      nomCl: (c) => c.lo === c.hi ? `Class ${c.lo}` : `Classes ${c.lo}–${c.hi}`, formP: (c) => modelo === 'uniforme' ? `1/${o.length}` : c.lo === c.hi ? `${f(w[c.lo - 1])}/${f(W)}` : `p_{${c.lo}–${c.hi}}` };
  }
  function agrupa(cl, N) {
    const out = cl.map((c) => ({ ...c })); let junto = false;
    for (;;) {
      if (out.length < 2) break;
      let i = -1; out.forEach((c, j) => { if (N * c.p < 5 && (i < 0 || c.p < out[i].p)) i = j; });
      if (i < 0) break;
      const j = i === 0 ? 1 : i === out.length - 1 ? i - 1 : out[i - 1].p <= out[i + 1].p ? i - 1 : i + 1, [a, b] = [Math.min(i, j), Math.max(i, j)];
      out.splice(a, 2, { lo: out[a].lo, hi: out[b].hi, o: out[a].o + out[b].o, p: out[a].p + out[b].p, junta: true });
      junto = true;
    }
    return { cl: out, junto };
  }

  function decide(chi, gl, alfa) {
    const P = { k: gl }, crit = ES.cuantil(D.chi2, P, 1 - alfa), pv = D.chi2.sf(P, chi);
    return { crit, pv, rechaza: chi > crit };
  }
  const sumaTxt = (t) => (t.length > 4 ? [...t.slice(0, 2), '…', t[t.length - 1]] : t).join(' + ');

  function bondad(sc, alfa) {
    const modelo = MODELOS[sc.modelo] ? sc.modelo : 'uniforme';
    const r = modelo === 'normal' ? normal(sc) : modelo === 'binomial' || modelo === 'poisson' ? discretas(sc, modelo) : sencillas(sc, modelo);
    if (!(r.N > 0)) throw new Error('The total number of observations must be greater than 0');
    let cl = r.cl, junto = false;
    if (sc.agrupa === 'si') ({ cl, junto } = agrupa(cl, r.N));
    const celdas = cl.map((c) => { const e = r.N * c.p; return { nom: r.nomCl(c), o: c.o, e, c: (c.o - e) ** 2 / e, p: c.p, fp: r.formP(c), junta: c.junta }; });
    const chi = suma(celdas.map((c) => c.c)), gl = celdas.length - 1 - r.par;
    if (gl < 1) throw new Error(`${celdas.length} classes remain and ${r.par ? `${r.par} parameters are estimated` : 'no parameter is estimated'}: there are no degrees of freedom. More classes are needed${junto ? ' (try without merging the classes with a small expected frequency)' : ''}`);
    const pocos = celdas.filter((c) => c.e < 5).length, { crit, pv, rechaza } = decide(chi, gl, alfa);
    const h0 = modelo === 'uniforme' ? 'all the classes are equally likely' : modelo === 'dadas' ? 'the proportions are the given ones' : `the data follow a ${{ binomial: 'binomial', poisson: 'Poisson', normal: 'normal' }[modelo]}${r.par ? '' : ` ${r.nomD}`}`;
    const pasos = [];
    pasos.push({ t: 'Hypotheses', html: `$H_0$: ${h0}, against $H_1$: ${modelo === 'uniforme' || modelo === 'dadas' ? 'it is not so' : 'they do not follow it'}; with $α = ${f(alfa)}$ and $N = ${r.N}$ observations.` });
    if (r.estTxt) pasos.push({ t: 'Estimated parameters', html: `${r.estTxt}. Se ajusta a una ${r.nomD}; cada parámetro estimado resta un grado de libertad.` });
    const ej = celdas.slice(0, 3).map((c) => `$E = N · ${c.fp} = ${r.N} · ${f(c.p)} = ${f(c.e)}$`).join('<br>');
    pasos.push({ t: 'Expected frequencies', html: `$E_i = N p_i$, with $p_i$ the probability of each class if $H_0$ is true${modelo === 'normal' ? ' (the first interval is extended to −∞ and the last to +∞, so that they add up to 1)' : modelo === 'binomial' || modelo === 'poisson' ? ' (the first and last class take the tails, so that they add up to 1)' : ''}:<br>${ej}${celdas.length > 3 ? '<br>and likewise for the others (in the table).' : ''}${junto ? '<br>Classes with an expected frequency below 5 have been <b>merged</b> with their neighbour.' : ''}${pocos ? `<br><b>Careful:</b> ${pocos === 1 ? 'one class has' : `${pocos} classes have`} an expected frequency below 5 and the χ² approximation may not be good${sc.agrupa === 'si' ? '' : ': it is advisable to merge classes'}.` : ''}` });
    pasos.push({ t: 'Test statistic', html: `$χ^2 = ∑ {(O_i − E_i)^2}/{E_i} = ${sumaTxt(celdas.map((c) => `{(${c.o} − ${f(c.e)})^2}/{${f(c.e)}}`))}$<br>$χ^2 = ${sumaTxt(celdas.map((c) => f(c.c)))} = ${f(chi)}$` });
    pasos.push({ t: 'Degrees of freedom', html: `$ν = k − 1 − m = ${celdas.length} − 1${r.par ? ` − ${r.par}` : ''} = ${gl}$, with $k = ${celdas.length}$ classes${r.par ? ` and $m = ${r.par}$ ${r.par === 1 ? 'estimated parameter' : 'estimated parameters'}` : ''}.` });
    return { modo: 'bondad', modelo, celdas, chi, gl, crit, pv, rechaza, pocos, junto, N: r.N, nomD: r.nomD, pasos, h0 };
  }

  function independencia(sc) {
    const t = tabla(sc.datos, 'the contingency table'), r = t.length, c = t[0].length;
    if (r < 2 || c < 2) throw new Error('The contingency table needs at least 2 rows and 2 columns');
    t.forEach((fl) => frec(fl, 'la tabla'));
    const F = t.map(suma), C = t[0].map((_, j) => suma(t.map((fl) => fl[j]))), N = suma(F);
    if (F.some((v) => !v) || C.some((v) => !v)) throw new Error('An entire row or column is zero: remove it from the table');
    const yates = sc.yates === 'si' && r === 2 && c === 2, celdas = [];
    t.forEach((fl, i) => fl.forEach((o, j) => { const e = (F[i] * C[j]) / N, d = yates ? Math.max(0, Math.abs(o - e) - 0.5) : o - e; celdas.push({ nom: `Row ${i + 1}, column ${j + 1}`, i, j, o, e, c: (d * d) / e }); }));
    const chi = suma(celdas.map((x) => x.c)), gl = (r - 1) * (c - 1), pocos = celdas.filter((x) => x.e < 5).length, V = Math.sqrt(chi / (N * (Math.min(r, c) - 1)));
    const pasos = [];
    pasos.push({ t: 'Hypotheses', html: `$H_0$: the two variables are <b>independent</b> (or, if each row is a population, all have the same proportions), against $H_1$: they are related; with $α = ${f(alfa(sc))}$.` });
    pasos.push({ t: 'Expected frequencies', html: `If they are independent, $E_{ij} = {F_i · C_j}/N$, with $F_i$ and $C_j$ the totals of row $i$ and column $j$ and $N = ${N}$:<br>${celdas.slice(0, 2).map((x) => `$E_{${x.i + 1}${x.j + 1}} = {${F[x.i]} · ${C[x.j]}}/${N} = ${f(x.e)}$`).join(', &ensp; ')}, and likewise for the others (in the table).${pocos ? `<br><b>Careful:</b> ${pocos === 1 ? 'one cell has' : `${pocos} cells have`} an expected frequency below 5 and the χ² approximation may not be good.` : ''}` });
    pasos.push({ t: 'Test statistic', html: `${yates ? 'In a 2 × 2 table Yates\' correction is applied: ' : ''}$χ^2 = ∑ {(${yates ? '|O_{ij} − E_{ij}| − 0,5' : 'O_{ij} − E_{ij}'})^2}/{E_{ij}} = ${sumaTxt(celdas.map((x) => yates ? `{(|${x.o} − ${f(x.e)}| − 0,5)^2}/{${f(x.e)}}` : `{(${x.o} − ${f(x.e)})^2}/{${f(x.e)}}`))}$<br>$χ^2 = ${sumaTxt(celdas.map((x) => f(x.c)))} = ${f(chi)}$` });
    pasos.push({ t: 'Degrees of freedom', html: `$ν = (r − 1)(c − 1) = (${r} − 1)(${c} − 1) = ${gl}$, with $r = ${r}$ rows and $c = ${c}$ columns.` });
    celdas.forEach((x) => { x.rp = (x.o - x.e) / Math.sqrt(x.e); x.rs = (x.o - x.e) / Math.sqrt(x.e * (1 - F[x.i] / N) * (1 - C[x.j] / N)); x.marca = Math.abs(x.rs) > 2; });
    const mayores = celdas.filter((x) => x.marca);
    pasos.push({ t: 'Standardized residuals', html: `To see <i>where</i> the association is: $r_{ij} = {O_{ij} − E_{ij}}/√{E_{ij}(1 − F_i/N)(1 − C_j/N)}$, which under $H_0$ is approximately $N(0, 1)$: a value beyond $±2$ marks a cell with more (or fewer) cases than expected.<br>${celdas.slice(0, 2).map((x) => `$r_{${x.i + 1}${x.j + 1}} = ${f(x.rs)}$`).join(', &ensp; ')}${celdas.length > 2 ? ', …' : ''}. ${mayores.length ? `Standing out: ${mayores.map((x) => `row ${x.i + 1}, column ${x.j + 1} (${f(x.rs)}: ${x.rs > 0 ? 'more' : 'less'} than expected)`).join('; ')}.` : 'No cell goes beyond ±2.'}` });
    const dc = decide(chi, gl, alfa(sc));
    return { modo: 'independencia', celdas, chi, gl, ...dc, pocos, N, t, F, C, V, yates, pasos, h0: 'the variables are independent', mayores };
  }
  const alfa = (sc) => lee(sc, 'alfa', 'the significance level α', { min: 0, minEx: true, max: 0.5, maxEx: true });


  const lnFact = (n) => ES.lnGamma(n + 1);
  const lnC = (n, k) => lnFact(n) - lnFact(k) - lnFact(n - k);
  function fisher(sc, a) {
    const t = tabla(sc.datos, 'the 2 × 2 table'); if (t.length !== 2 || t[0].length !== 2) throw new Error('Fisher\'s test needs a 2 × 2 table: two rows with two numbers each');
    t.forEach((fl) => frec(fl, 'la tabla'));
    const [[n11, n12], [n21, n22]] = t, r1 = n11 + n12, r2 = n21 + n22, c1 = n11 + n21, N = r1 + r2, h1 = H1[sc.h1] ? sc.h1 : 'distinto';
    if (!r1 || !r2 || !c1 || !(n12 + n22)) throw new Error('An entire row or column is zero: remove it from the table');
    const lo = Math.max(0, c1 - r2), hi = Math.min(r1, c1), pr = (k) => Math.exp(lnC(r1, k) + lnC(r2, c1 - k) - lnC(N, c1)), obs = pr(n11);
    let le = 0, ge = 0, bil = 0; for (let k = lo; k <= hi; k++) { const q = pr(k); if (k <= n11) le += q; if (k >= n11) ge += q; if (q <= obs * (1 + 1e-7)) bil += q; }
    const p = Math.min(1, h1 === 'mayor' ? ge : h1 === 'menor' ? le : bil), or = n12 * n21 === 0 ? (n11 * n22 === 0 ? NaN : Infinity) : (n11 * n22) / (n12 * n21);
    const esp = [r1 * c1 / N, r1 * (N - c1) / N, r2 * c1 / N, r2 * (N - c1) / N], pocos = esp.filter((e) => e < 5).length;
    const pasos = [
      { t: 'Hypotheses', html: `$H_0$: the two rows have the same probability of “success” (column 1), that is, the odds ratio is 1; against $H_1$: ${{ distinto: 'it differs from 1', mayor: 'it is greater than 1', menor: 'it is less than 1' }[h1]}. With fixed margins ($F_1 = ${r1}$, $F_2 = ${r2}$, $C_1 = ${c1}$, $N = ${N}$).` },
      { t: 'Exact distribution', html: `With fixed margins, the number $X$ of cases in cell (1, 1) follows a <b>hypergeometric</b>: $P(X = k) = {\\binom{${r1}}{k}\\binom{${r2}}{${c1} − k}}/{\\binom{${N}}{${c1}}}$, with $k$ from $${lo}$ to $${hi}$. The observed table has $k = ${n11}$ and $P(X = ${n11}) = ${ES.prob(obs)}$.${pocos ? ` (That is why the χ² is not valid: ${pocos === 1 ? 'one cell has' : `${pocos} cells have`} an expected frequency below 5.)` : ''}` },
      { t: 'p-valor exacto', html: h1 === 'mayor' ? `$p = P(X ≥ ${n11}) = ${ES.prob(ge)}$` : h1 === 'menor' ? `$p = P(X ≤ ${n11}) = ${ES.prob(le)}$` : `Two-sided: the probabilities of all tables as unlikely as the observed one or less are added, $p = ∑_{P(X = k) ≤ ${ES.prob(obs)}} P(X = k) = ${ES.prob(bil)}$.` },
      { t: 'Odds ratio', html: `Sample odds ratio: $OR = {n_{11} n_{22}}/{n_{12} n_{21}} = {${n11} · ${n22}}/{${n12} · ${n21}} = ${isFinite(or) ? f(or) : or === Infinity ? '∞' : 'undefined'}$ (1 = no association).` },
      { t: 'Conclusion', html: p < a ? `<b>$H_0$ is rejected</b> at a significance level of ${f(100 * a)} %: there is an association between the row and the column.` : `<b>$H_0$ is not rejected</b> at a significance level of ${f(100 * a)} %: there is no evidence of association.` },
    ];
    return { modo: 'fisher', t, N, h1, p, pv: p, le, ge, bil, obs, or, lo, hi, dist: Array.from({ length: hi - lo + 1 }, (_, i) => [lo + i, pr(lo + i)]), n11, pocos, esp, rechaza: p < a, chi: NaN, gl: 0, crit: NaN, pasos, alfa: a };
  }

  function mcnemar(sc, a) {
    const t = tabla(sc.datos, 'the 2 × 2 table of pairs'); if (t.length !== 2 || t[0].length !== 2) throw new Error('McNemar needs a 2 × 2 table: two rows with two numbers each');
    t.forEach((fl) => frec(fl, 'la tabla'));
    const [[A, b], [c, d]] = t, n = b + c; if (n < 1) throw new Error('There are no discordant pairs (b + c = 0): the test cannot be carried out');
    const corr = sc.yates !== 'no', chi = ((corr ? Math.max(0, Math.abs(b - c) - 1) : Math.abs(b - c)) ** 2) / n, pChi = D.chi2.sf({ k: 1 }, chi);
    let s = 0, cb = 1; for (let i = 0; i <= Math.min(b, c); i++) { s += cb; cb = (cb * (n - i)) / (i + 1); } const pEx = Math.min(1, (2 * s) / 2 ** n);
    const usaEx = sc.metodo === 'exacto', p = usaEx ? pEx : pChi;
    const pasos = [
      { t: 'Hypotheses', html: `Each individual is measured twice (before and after). Only the <b>discordant</b> ones matter: $b = ${b}$ (yes → no) and $c = ${c}$ (no → yes). $H_0$: both changes are equally likely ($b$ and $c$ should be similar), against $H_1$: they are not; $α = ${f(a)}$.` },
      { t: 'Statistic', html: `$χ^2 = {(${corr ? '|b − c| − 1' : 'b − c'})^2}/{b + c} = {(${corr ? `|${b} − ${c}| − 1` : `${b} − ${c}`})^2}/{${n}} = ${f(chi)}$ with 1 degree of freedom${corr ? ' (with the continuity correction)' : ''}: $p = ${ES.prob(pChi)}$.` },
      { t: 'Exact version', html: `If $H_0$ is true, $b$ is a binomial $B(${n}, 1/2)$ and $p = 2 · P(X ≤ ${Math.min(b, c)}) = ${ES.prob(pEx)}$ (capped at 1). It is preferable if $b + c$ is small (fewer than about 25).` },
      { t: 'Conclusion', html: `With ${usaEx ? 'the exact version' : 'the χ²'}, $p = ${ES.prob(p)}$: ${p < a ? `<b>$H_0$ is rejected</b> at a significance level of ${f(100 * a)} %: the change is not due to chance` : `<b>$H_0$ is not rejected</b> at a significance level of ${f(100 * a)} %: there is no evidence of change`}.` },
    ];
    return { modo: 'mcnemar', t, A, b, c, d, n, corr, chi, pChi, pEx, usaEx, p, pv: p, rechaza: p < a, gl: 1, crit: ES.cuantil(D.chi2, { k: 1 }, 1 - a), pasos, alfa: a, N: A + b + c + d };
  }

  function resolver(sc) {
    const a = alfa(sc), modo = MODOS[sc.modo] ? sc.modo : 'bondad';
    if (modo === 'fisher') return fisher(sc, a);
    if (modo === 'mcnemar') return mcnemar(sc, a);
    const r = modo === 'independencia' ? independencia(sc) : bondad(sc, a);
    if (modo === 'bondad') Object.assign(r, decide(r.chi, r.gl, a));
    r.alfa = a;
    r.pasos.push({ t: 'Critical region and p-value', html: `The test is always right-tailed (the further the observed are from the expected, the larger χ² is). With $ν = ${r.gl}$, the critical value is $χ^2_{${r.gl}; ${f(1 - a)}} = ${f(r.crit)}$: $H_0$ is rejected if $χ^2 > ${f(r.crit)}$.<br>$χ^2 = ${f(r.chi)}$ ${r.rechaza ? '<b>falls in the critical region</b>' : '<b>does not fall in the critical region</b>'}, and the p-value is $p = P(χ^2_{${r.gl}} ≥ ${f(r.chi)}) = ${f(r.pv)}$, ${r.pv < a ? 'less' : 'greater'} than $α$.` });
    r.pasos.push({ t: 'Conclusion', html: r.rechaza ? `<b>$H_0$ is rejected</b> at a significance level of ${f(100 * a)} %: ${modo === 'independencia' ? `there is a relationship between the two variables (Cramér's V = ${f(r.V, 3)}, ${r.V < 0.1 ? 'very weak' : r.V < 0.3 ? 'weak' : r.V < 0.5 ? 'moderate' : 'strong'})` : 'the data do not fit the model'}.` : `<b>$H_0$ is not rejected</b> at a significance level of ${f(100 * a)} %: ${modo === 'independencia' ? 'the data give no evidence of a relationship between the variables' : 'the differences between the observed and the expected may be due to chance, and the model is acceptable'}.` });
    return r;
  }

  const ejemplos = [
    { clave: 'dado', nombre: 'Uniform: is the die loaded? (120 rolls)', sc: { modo: 'bondad', modelo: 'uniforme', alfa: '0,05', agrupa: 'no', datos: '12\n16\n20\n18\n22\n32' } },
    { clave: 'mendel', nombre: 'Given proportions: Mendel\'s peas (9 : 3 : 3 : 1)', sc: { modo: 'bondad', modelo: 'dadas', alfa: '0,05', agrupa: 'no', datos: '315 9\n108 3\n101 3\n32 1' } },
    { clave: 'coces', nombre: 'Poisson: deaths from horse kicks (Bortkiewicz)', sc: { modo: 'bondad', modelo: 'poisson', estima: 'si', alfa: '0,05', agrupa: 'si', datos: '0 109\n1 65\n2 22\n3 3\n4 1' } },
    { clave: 'familias', nombre: 'Binomial: number of boys in families of 4 children', sc: { modo: 'bondad', modelo: 'binomial', estima: 'si', nb: '4', alfa: '0,05', agrupa: 'si', datos: '0 7\n1 33\n2 51\n3 37\n4 12' } },
    { clave: 'alturas', nombre: 'Normal: heights by intervals (cm)', sc: { modo: 'bondad', modelo: 'normal', estima: 'si', alfa: '0,05', agrupa: 'si', datos: '150 160 8\n160 170 25\n170 180 40\n180 190 20\n190 200 7' } },
    { clave: 'preferencia', nombre: 'Independence: sex and preferred sport (2 × 3)', sc: { modo: 'independencia', alfa: '0,05', yates: 'no', datos: '20 30 50\n30 30 40' } },
    { clave: 'fisher', nombre: 'Fisher: tea with milk (small 2 × 2 table)', sc: { modo: 'fisher', h1: 'mayor', alfa: '0,05', datos: '3 1\n1 3' } },
    { clave: 'fisher-bilateral', nombre: 'Two-sided Fisher: a drug with few cases', sc: { modo: 'fisher', h1: 'distinto', alfa: '0,05', datos: '8 2\n1 5' } },
    { clave: 'mcnemar', nombre: 'McNemar: opinion before and after a campaign', sc: { modo: 'mcnemar', alfa: '0,05', yates: 'si', metodo: 'chi2', datos: '59 6\n16 80' } },
    { clave: 'mcnemar-exacto', nombre: 'Exact McNemar with few discordant pairs', sc: { modo: 'mcnemar', alfa: '0,05', yates: 'si', metodo: 'exacto', datos: '20 9\n2 15' } },
    { clave: 'curacion', nombre: '2 × 2 homogeneity: cure with two treatments', sc: { modo: 'independencia', alfa: '0,05', yates: 'no', datos: '45 105\n30 120' } },
  ];

  return { resolver, ejemplos, MODOS, MODELOS, COLUMNAS, H1 };
})();

