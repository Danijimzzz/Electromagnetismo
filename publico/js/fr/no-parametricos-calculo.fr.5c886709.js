const NoParametricos = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const IN = typeof Inferencia !== 'undefined' ? Inferencia : require('../estadistica/inferencia.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista, filas } = K, N01 = { mu: 0, sigma: 1 };
  const suma = (v) => v.reduce((a, b) => a + b, 0);
  const TIPOS = { mw: 'U de Mann-Whitney (deux échantillons indépendants)', pares: 'Wilcoxon de données appariées', mediana: 'Wilcoxon pour la médiane d’un échantillon', kw: 'Kruskal-Wallis (trois groupes ou plus) avec Dunn', signos: 'Test des signes (données appariées)', signosmed: 'Test des signes pour la médiane', correlacion: 'Spearman et Kendall (corrélation par les rangs)' };
  const POST = { no: 'No', holm: 'Dunn avec Holm', bonferroni: 'Dunn avec Bonferroni' };
  const H1 = { dos: 'Différentes (bilatéral)', mayor: 'La première est plus grande (unilatéral)', menor: 'La première est plus petite (unilatéral)' };
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
  const alfaDe = (sc) => lee(sc, 'alfa', 'le niveau de signification α', { min: 0, minEx: true, max: 0.5, maxEx: true });

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
    if (n1 < 1 || n2 < 1) throw new Error('Écrivez des données dans les deux échantillons');
    const todos = [...x, ...y], { r, t, corr } = rangos(todos);
    const R1 = suma(r.slice(0, n1)), R2 = suma(r.slice(n1)), U1 = R1 - (n1 * (n1 + 1)) / 2, U2 = n1 * n2 - U1, mu = (n1 * n2) / 2;
    const exacto = sc.exacto !== 'no' && !t.length && n1 <= 20 && n2 <= 20, cc = sc.cc !== 'no';
    let p, z = null, sigma = null;
    if (exacto) {
      const cs = new Map([...cuentaSumas(N, n1)].map(([s, q]) => [s - (n1 * (n1 + 1)) / 2, q])), c = colas(cs, U1);
      p = pvalor(h1, c.le, c.ge);
    } else {
      sigma = Math.sqrt(((n1 * n2) / 12) * (N + 1 - corr / (N * (N - 1))));
      if (!(sigma > 0)) throw new Error('Toutes les données sont égales : on ne peut pas faire le test');
      ({ z, p } = pnormal(h1, U1 - mu, sigma, cc));
    }
    const orden = todos.map((v, i) => ({ v, g: i < n1 ? 1 : 2, r: r[i] })).sort((a, b) => a.v - b.v || a.g - b.g);
    const pasos = [];
    pasos.push({ t: 'Hypothèses', html: `$H_0$ : les deux populations sont égales (aucune n’a tendance à donner des valeurs plus grandes), contre $H_1$ : ${{ dos: 'la distribution de l’échantillon 1 est décalée par rapport à celle de l’échantillon 2', mayor: 'l’échantillon 1 a tendance à donner des valeurs plus grandes que le 2', menor: 'l’échantillon 1 a tendance à donner des valeurs plus petites que le 2' }[h1]} ; avec $α = ${f(alfa)}$, $n_1 = ${n1}$ et $n_2 = ${n2}$.` });
    pasos.push({ t: 'Rangs', html: `On ordonne les ${N} données ensemble et on leur donne leur rang (1 au plus petit${t.length ? ' ; pour les ex æquo, la moyenne des rangs qu’ils occupent' : ''}). En additionnant ceux de chaque échantillon : $R_1 = ${sumaTxt(r.slice(0, n1).map((v) => f(v)))} = ${f(R1)}$ et $R_2 = ${f(R2)}$ (vérification : $R_1 + R_2 = N(N + 1)/2 = ${f(R1 + R2)}$).` });
    pasos.push({ t: 'Statistique U', html: `$U_1 = R_1 − {n_1(n_1 + 1)}/2 = ${f(R1)} − ${f((n1 * (n1 + 1)) / 2)} = ${f(U1)}$ et $U_2 = n_1 n_2 − U_1 = ${f(U2)}$. Si $H_0$ est vraie, $U_1$ est voisin de $n_1 n_2/2 = ${f(mu)}$.` });
    if (exacto) pasos.push({ t: 'p-valor exacto', html: `Il n’y a pas d’ex æquo et les échantillons sont petits : on compte les $\\binom{${N}}{${n1}}$ façons de répartir les rangs entre les deux échantillons. ${h1 === 'mayor' ? `$p = P(U_1 ≥ ${f(U1)}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(U_1 ≤ ${f(U1)}) = ${ES.prob(p)}$` : `$p = 2 · P(\\text{queue la plus petite}) = ${ES.prob(p)}$`}.` });
    else pasos.push({ t: 'Approximation normale', html: `Sous $H_0$, $U_1$ est presque normale de moyenne $${f(mu)}$ et $σ = √({n_1 n_2}/12 · (N + 1${t.length ? ' − {∑ (t^3 − t)}/{N(N − 1)}' : ''})) = ${f(sigma)}$${t.length ? ' (avec la correction d’ex æquo)' : ''}.<br>$z = {U_1 − μ${cc ? ' ∓ 0,5' : ''}}/σ = ${f(z)}$ y $p = ${ES.prob(p)}$.` });
    const zEf = (U1 - mu) / Math.sqrt(((n1 * n2) / 12) * (N + 1 - corr / (N * (N - 1)))), rEf = Math.abs(zEf) / Math.sqrt(N), psup = U1 / (n1 * n2);
    const difs = []; for (const a of x) for (const b of y) difs.push(a - b);
    const M = n1 * n2, hl = hodges(difs, M, mu, Math.sqrt(((n1 * n2) / 12) * (N + 1)), exacto, exacto ? new Map([...cuentaSumas(N, n1)].map(([q, c]) => [q - (n1 * (n1 + 1)) / 2, c])) : null, alfa);
    pasos.push({ t: 'Taille de l’effet', html: `Probabilité de supériorité : $P(X > Y) + ½ P(X = Y) = U_1/(n_1 n_2) = ${f(U1)}/${f(n1 * n2)} = ${f(psup)}$ (0,5 = pas de différence). Corrélation bisériale des rangs : $r_b = 2 U_1/(n_1 n_2) − 1 = ${f(2 * psup - 1)}$. Taille d’effet $r = |z|/√N = ${f(rEf)}$ (0,1 petit, 0,3 moyen, 0,5 grand).` });
    pasos.push({ t: 'Estimateur de Hodges-Lehmann', html: `La différence typique entre les deux échantillons est la médiane des $n_1 n_2 = ${M}$ différences $x_i − y_j$ : <b>${f(hl.est)}</b>${isFinite(hl.lo) ? `, avec un intervalle de confiance à ${nivel(alfa)} % de $(${f(hl.lo)} ; ${f(hl.hi)})$ (${exacto ? 'exact' : 'par l’approximation normale'}, en prenant les différences ordonnées qui laissent $α/2$ de chaque côté)` : ''}.` });
    pasos.push({ t: 'Conclusion', html: p < alfa ? `<b>On rejette $H_0$</b> au niveau de signification de ${f(100 * alfa)} % : il y a des différences entre les deux échantillons.` : `<b>On ne rejette pas $H_0$</b> au niveau de signification de ${f(100 * alfa)} % : il n’y a pas d’indice de différences entre les deux échantillons.` });
    return { tipo: 'mw', h1, x, y, n1, n2, R1, R2, U1, U2, mu, z, sigma, p, exacto, rEf, psup, hl, zEf, empates: t.length > 0, orden, rechaza: p < alfa, alfa, pasos, est: U1 };
  }

  function wilcoxon(sc, alfa, pares) {
    const h1 = H1[sc.h1] ? sc.h1 : 'dos';
    let ds, filasT;
    if (pares) {
      filasT = filas(sc.datos, 2, 'les données appariées');
      if (!filasT.length) throw new Error('Le tableau de paires « avant après » est manquant');
      ds = filasT.map(([a, b]) => ({ a, b, d: a - b }));
    } else {
      const x = lista(sc.datos, 'la muestra'), m0 = lee(sc, 'm0', 'la médiane de H₀');
      if (!x.length) throw new Error('L’échantillon est manquant');
      ds = x.map((a) => ({ a, b: m0, d: a - m0 })); filasT = null;
    }
    const nTotal = ds.length, nz = ds.filter((q) => q.d !== 0), n = nz.length;
    if (n < 1) throw new Error('Toutes les différences sont 0 : on ne peut pas faire le test');
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
    pasos.push({ t: 'Hypothèses', html: pares
      ? `$H_0$ : la médiane des différences est 0 (pas de changement entre les deux mesures), contre $H_1$ : ${{ dos: 'elle est différente de 0', mayor: 'la première mesure a tendance à être plus grande', menor: 'la première mesure a tendance à être plus petite' }[h1]} ; avec $α = ${f(alfa)}$ et ${nTotal} paires.`
      : `$H_0$ : la médiane est $m_0 = ${f(ds[0].b)}$, contre $H_1$ : ${{ dos: 'elle est différente', mayor: 'elle est plus grande', menor: 'elle est plus petite' }[h1]} ; avec $α = ${f(alfa)}$ et ${nTotal} données.` });
    pasos.push({ t: 'Différences', html: `On calcule $${dif}$${nz.length < nTotal ? ` et l’on écarte les ${nTotal - n} qui valent 0, ce qui laisse $n = ${n}$` : `, avec $n = ${n}$`}. On ordonne les $|d_i|$ et on leur donne leur rang${t.length ? ' (pour les ex æquo, la moyenne des rangs qu’ils occupent)' : ''}.` });
    pasos.push({ t: 'Somme des rangs', html: `$W^+ = ${sumaTxt(nz.filter((q) => q.d > 0).map((q) => f(q.r)))} = ${f(Wp)}$ (différences positives) et $W^− = ${f(Wm)}$ (négatives) ; vérification : $W^+ + W^− = n(n + 1)/2 = ${f(Wp + Wm)}$. Sous $H_0$, $W^+$ est voisin de $n(n + 1)/4 = ${f(mu)}$.` });
    if (exacto) pasos.push({ t: 'p-valor exacto', html: `Sans ex æquo et avec $n ≤ 25$, $W^+$ est la somme d’un sous-ensemble quelconque de $\\{1, …, ${n}\\}$ (les $2^{${n}}$ répartitions de signes sont équiprobables). ${h1 === 'mayor' ? `$p = P(W^+ ≥ ${f(Wp)}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(W^+ ≤ ${f(Wp)}) = ${ES.prob(p)}$` : `$p = 2 · P(\\text{queue la plus petite}) = ${ES.prob(p)}$`}.` });
    else pasos.push({ t: 'Approximation normale', html: `$W^+$ est presque normale de moyenne $${f(mu)}$ et $σ = √({n(n + 1)(2n + 1)}/24${t.length ? ' − {∑ (t^3 − t)}/48' : ''}) = ${f(sigma)}$.<br>$z = {W^+ − μ${cc ? ' ∓ 0,5' : ''}}/σ = ${f(z)}$ y $p = ${ES.prob(p)}$.` });
    const sg = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - corr / 48), zEf = (Wp - mu) / sg, rEf = Math.abs(zEf) / Math.sqrt(n), rb = (Wp - Wm) / (Wp + Wm);
    const walsh = []; for (let i = 0; i < n; i++) for (let j = i; j < n; j++) walsh.push((nz[i].d + nz[j].d) / 2);
    let cw = null; if (exacto) { cw = new Map([[0, 1]]); for (let v = 1; v <= n; v++) { const nu = new Map(cw); for (const [q, c] of cw) nu.set(q + v, (nu.get(q + v) || 0) + c); cw = nu; } }
    const hl = hodges(walsh, (n * (n + 1)) / 2, mu, sg, exacto, cw, alfa);
    pasos.push({ t: 'Taille de l’effet', html: `Corrélation bisériale des rangs : $r_b = (W^+ − W^−)/(W^+ + W^−) = ${f(rb)}$ (de −1 à 1 ; 0 = pas d’effet). Taille d’effet $r = |z|/√n = ${f(rEf)}$ (0,1 petit, 0,3 moyen, 0,5 grand).` });
    pasos.push({ t: 'Estimateur de Hodges-Lehmann', html: `Le décalage typique est la médiane des $n(n + 1)/2$ moyennes de Walsh $(d_i + d_j)/2$ : <b>${f(hl.est)}</b>${isFinite(hl.lo) ? `, avec un intervalle de confiance à ${nivel(alfa)} % de $(${f(hl.lo)} ; ${f(hl.hi)})$ (${exacto ? 'exact' : 'par l’approximation normale'})` : ''}.` });
    pasos.push({ t: 'Conclusion', html: p < alfa ? `<b>On rejette $H_0$</b> au niveau de signification de ${f(100 * alfa)} %.` : `<b>On ne rejette pas $H_0$</b> au niveau de signification de ${f(100 * alfa)} % : il n’y a pas d’indice suffisant.` });
    return { tipo: pares ? 'pares' : 'mediana', h1, ds, nz, nTotal, n, Wp, Wm, mu, z, sigma, p, exacto, rEf, rb, hl, zEf, empates: t.length > 0, rechaza: p < alfa, alfa, pasos, est: Wp };
  }


  function kruskal(sc, alfa) {
    const g = []; String(sc.datos ?? '').split(/\r?\n/).forEach((lin, i) => { const l = lin.trim(); if (!l || l.startsWith('#')) return; const j = l.indexOf(':'), nom = j > 0 ? l.slice(0, j).trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : `Groupe ${g.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `la ligne ${i + 1}`); if (!x.length) throw new Error(`La ligne ${i + 1} n’a pas de valeurs`); g.push({ nom, x, n: x.length }); });
    if (g.length < 2) throw new Error('Écrivez au moins deux groupes, un par ligne');
    const k = g.length, todos = g.flatMap((q) => q.x), N = todos.length, { r, t, corr } = rangos(todos);
    if (corr >= N * N * N - N) throw new Error('Toutes les données sont égales : on ne peut pas faire le test');
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
      { t: 'Hypothèses', html: `$H_0$ : les ${k} groupes proviennent de la même distribution (aucun n’a tendance à donner des valeurs plus grandes), contre $H_1$ : l’un au moins a tendance à donner des valeurs différentes ; $α = ${f(alfa)}$, $N = ${N}$ données.` },
      { t: 'Rangs', html: `On ordonne les ${N} données ensemble et on leur donne leur rang (1 au plus petit${t.length ? ' ; pour les ex æquo, la moyenne des rangs qu’ils occupent' : ''}). Sommes des rangs : ${g.slice(0, 6).map((q, i) => `$R_{${i + 1}} = ${f(q.R)}$ ($n_{${i + 1}} = ${q.n}$)`).join(', ')}${k > 6 ? ', …' : ''}. Vérification : $∑ R_i = N(N + 1)/2 = ${f(suma(g.map((q) => q.R)))}$.` },
      { t: 'Statistique H', html: `$H = {12}/{N(N + 1)} ∑ {R_i^2}/{n_i} − 3(N + 1) = ${f(Hs)}$${t.length ? `; avec la correction d’ex æquo $C = 1 − {∑ (t^3 − t)}/{N^3 − N} = ${f(C, 5)}$, on obtient $H = ${f(H)}$` : ''}. Sous $H_0$, elle suit (approximativement) un $χ^2$ à $k − 1 = ${gl}$ degrés de liberté${g.some((q) => q.n < 5) ? ' ; avec des groupes de moins de 5 données, l’approximation est peu fine' : ''}.` },
      { t: 'Région critique et p-valeur', html: `La valeur critique est $χ^2_{${gl}; ${f(1 - alfa)}} = ${f(crit)}$ et la p-valeur, $P(χ^2_{${gl}} ≥ ${f(H)}) = ${ES.prob(p)}$.` },
      { t: 'Taille de l’effet', html: `$ε^2 = H/(N − 1) = ${f(eps2, 3)}$ : la part de la variabilité des rangs qu’expliquent les groupes (0,01 petit, 0,08 moyen, 0,26 grand).` },
      { t: 'Conclusion', html: p < alfa ? `<b>On rejette $H_0$</b> au niveau de signification de ${f(100 * alfa)} % : un groupe au moins diffère des autres.` : `<b>On ne rejette pas $H_0$</b> au niveau de signification de ${f(100 * alfa)} % : il n’y a pas d’indice que les groupes diffèrent.` },
    ];
    if (pares.length) pasos.push({ t: `Comparaisons de Dunn (${post === 'holm' ? 'Holm' : 'Bonferroni'})`, html: `Pour chaque paire, $z = {R̄_i − R̄_j}/√({N(N + 1)}/12 · (1/n_i + 1/n_j))$${t.length ? ' (avec la correction d’ex æquo)' : ''}, et la p-valeur est ajustée pour les $m = ${pares.length}$ comparaisons (${post === 'holm' ? 'Holm : plus puissant' : 'Bonferroni : on multiplie par m'}). Par exemple, ${pares[0].a} − ${pares[0].b} : $z = ${f(pares[0].z)}$, $p = ${ES.prob(pares[0].p)}$.${p < alfa ? '' : ' Avec H non significatif, ces comparaisons ne sont qu’indicatives.'}` });
    return { tipo: 'kw', g, k, N, H, Hs, C, gl, p, crit, eps2, pares, post, rechaza: p < alfa, alfa, pasos, est: H };
  }

  function signos(sc, alfa, pares) {
    const h1 = H1[sc.h1] ? sc.h1 : 'dos';
    let ds; if (pares) { const ft = filas(sc.datos, 2, 'les données appariées'); if (!ft.length) throw new Error('Le tableau de paires « avant après » est manquant'); ds = ft.map(([a, b]) => ({ a, b, d: a - b })); } else { const x = lista(sc.datos, 'la muestra'), m0 = lee(sc, 'm0', 'la médiane de H₀'); if (!x.length) throw new Error('L’échantillon est manquant'); ds = x.map((a) => ({ a, b: m0, d: a - m0 })); }
    const mas = ds.filter((q) => q.d > 0).length, menos = ds.filter((q) => q.d < 0).length, n = mas + menos, ceros = ds.length - n;
    if (n < 1) throw new Error('Toutes les différences sont 0 : on ne peut pas faire le test');
    const pb = (k) => { let s = 0, c = 1; for (let i = 0; i <= k; i++) { s += c; c = (c * (n - i)) / (i + 1); } return Math.min(1, s / 2 ** n); };
    const le = pb(mas), ge = pb(menos);   // P(X ≤ n⁺) y P(X ≥ n⁺) = P(X ≤ n⁻)
    const p = pvalor(h1, le, ge), mu = n / 2, z = (mas - mu) / Math.sqrt(n / 4);
    const pasos = [
      { t: 'Hypothèses', html: pares ? `$H_0$ : la médiane des différences est 0, c’est-à-dire que chaque différence est positive ou négative avec la probabilité $1/2$ ; contre $H_1$ : ${{ dos: 'no', mayor: 'la première mesure a tendance à être plus grande', menor: 'la première mesure a tendance à être plus petite' }[h1] === 'no' ? 'les probabilités ne sont pas égales' : { mayor: 'la première mesure a tendance à être plus grande', menor: 'la première mesure a tendance à être plus petite' }[h1]} ; $α = ${f(alfa)}$.` : `$H_0$ : la médiane est $m_0 = ${f(ds[0].b)}$ (chaque donnée est au-dessus ou en dessous avec la probabilité $1/2$), contre $H_1$ : ${{ dos: 'elle est différente', mayor: 'elle est plus grande', menor: 'elle est plus petite' }[h1]} ; $α = ${f(alfa)}$.` },
      { t: 'Signes', html: `On compte les signes des $d_i$ (les $0$ sont écartés${ceros ? ` : ${ceros}` : ''}) : $n^+ = ${mas}$ positifs et $n^− = ${menos}$ négatifs, $n = ${n}$.` },
      { t: 'p-valor exacto', html: `Si $H_0$ est vraie, $n^+$ suit une loi binomiale $B(${n}, 1/2)$. ${h1 === 'mayor' ? `$p = P(X ≥ ${mas}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(X ≤ ${mas}) = ${ES.prob(p)}$` : `$p = 2 · P(X ≤ ${Math.min(mas, menos)}) = ${ES.prob(p)}$ (limitée à 1)`}. Approximation normale à titre de comparaison : $z = (n^+ − n/2)/√(n/4) = ${f(z)}$.` },
      { t: 'Conclusion', html: p < alfa ? `<b>On rejette $H_0$</b> au niveau de signification de ${f(100 * alfa)} %.` : `<b>On ne rejette pas $H_0$</b> au niveau de signification de ${f(100 * alfa)} % : il n’y a pas d’indice suffisant. Le test des signes n’utilise que le signe, c’est pourquoi c’est le moins puissant des tests de rangs.` },
    ];
    return { tipo: pares ? 'signos' : 'signosmed', h1, ds, mas, menos, n, ceros, p, z, rechaza: p < alfa, alfa, pasos, est: mas };
  }

  function correlacion(sc, alfa) {
    const ft = filas(sc.datos, 2, 'los datos'); if (ft.length < 3) throw new Error('Il faut au moins 3 paires « x y »');
    const x = ft.map((q) => q[0]), y = ft.map((q) => q[1]), n = ft.length, h1 = H1[sc.h1] ? sc.h1 : 'dos';
    const sp = IN.spearman(x, y), ke = IN.kendall(x, y);
    if (!isFinite(sp.rho) || !isFinite(ke.tau)) throw new Error('L’une des deux variables est constante (ou n’a qu’une valeur) : il n’y a pas de corrélation à tester');
    const un = (est, p2) => (h1 === 'dos' ? p2 : (h1 === 'mayor' ? est > 0 : est < 0) ? p2 / 2 : 1 - p2 / 2), pS = un(sp.rho, sp.p), pK = un(ke.tau, ke.p);
    const rx = IN.rangosDe(x).r, ry = IN.rangosDe(y).r;
    const pasos = [
      { t: 'Hypothèses', html: `$H_0$ : il n’y a pas d’association monotone entre les deux variables ($ρ_s = 0$, $τ = 0$), contre $H_1$ : ${{ dos: 'il y en a une', mayor: 'l’association est positive', menor: 'l’association est négative' }[h1]} ; $α = ${f(alfa)}$, $n = ${n}$.` },
      { t: 'Rangs', html: `Chaque variable est remplacée par ses rangs (${n} paires ; pour les ex æquo, la moyenne des rangs).` },
      { t: 'Spearman', html: `$ρ_s$ est la corrélation de Pearson des rangs : $ρ_s = ${f(sp.rho, 5)}$. Test : $t = ρ_s √{(n − 2)/(1 − ρ_s^2)} = ${f(sp.t)}$ avec $${n - 2}$ ddl, $p = ${ES.prob(pS)}$.${n < 10 ? ' Avec moins de 10 paires, cette approximation est peu fine.' : ''}` },
      { t: 'Kendall', html: `On compte les paires concordantes $C = ${ke.C}$ et discordantes $D = ${ke.D}$ (pour chaque couple de points, si $x$ et $y$ croissent ensemble ou non) : $τ_b = {C − D}/√{(n_0 − n_1)(n_0 − n_2)} = ${f(ke.tau, 5)}$ (avec des ex æquo, on corrige ; sans eux, $τ = (C − D)/(n(n − 1)/2)$). ${ke.exacto ? `Sans ex æquo et avec $n ≤ 40$, la p-valeur est exacte (on compte les permutations selon leur nombre d’inversions) : $p = ${ES.prob(pK)}$.` : `Avec l’approximation normale (avec la variance corrigée des ex æquo) : $z = ${f(ke.z)}$, $p = ${ES.prob(pK)}$.`}` },
      { t: 'Conclusion', html: `${pS < alfa ? '<b>On rejette $H_0$ avec Spearman</b>' : '<b>On ne rejette pas $H_0$ avec Spearman</b>'} et ${pK < alfa ? '<b>on rejette avec Kendall</b>' : '<b>on ne rejette pas avec Kendall</b>'} à ${f(100 * alfa)} %. Kendall est plus fiable avec peu de données et beaucoup d’ex æquo ; Spearman ressemble davantage au coefficient de Pearson.` },
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
    { clave: 'metodos', nombre: 'Mann-Whitney : deux méthodes d’étude (exact)', sc: { tipo: 'mw', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', datos1: '14 17 16 19 22', datos2: '10 12 15 11 13 9' } },
    { clave: 'empates', nombre: 'Mann-Whitney avec ex æquo (approximation normale)', sc: { tipo: 'mw', h1: 'mayor', alfa: '0,05', exacto: 'si', cc: 'si', datos1: '3 4 4 5 5 5 6 7', datos2: '2 3 3 4 4 5 5 6' } },
    { clave: 'dieta', nombre: 'Wilcoxon apparié : poids avant et après un régime', sc: { tipo: 'pares', h1: 'mayor', alfa: '0,05', exacto: 'si', cc: 'si', datos: '82 78\n91 85\n77 75\n88 89\n95 88\n79 79\n84 76\n90 79' } },
    { clave: 'mediana', nombre: 'Wilcoxon pour la médiane : vaut-elle 50 ?', sc: { tipo: 'mediana', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', m0: '50', datos: '54 61 48 58 66 53 63 57 49 60' } },
    { clave: 'kruskal', nombre: 'Kruskal-Wallis et Dunn : trois méthodes d’étude', sc: { tipo: 'kw', alfa: '0,05', post: 'holm', datos: 'Méthode A : 14 17 16 19 22\nMéthode B : 10 12 15 11 13 9\nMéthode C : 20 24 21 26 23 25' } },
    { clave: 'kruskal-empates', nombre: 'Kruskal-Wallis avec ex æquo', sc: { tipo: 'kw', alfa: '0,05', post: 'bonferroni', datos: 'Léger : 3 4 4 5 5\nMoyen : 4 5 6 6 7 7\nGrave : 6 7 7 8 9 9 9' } },
    { clave: 'signos', nombre: 'Test des signes : avant et après', sc: { tipo: 'signos', h1: 'mayor', alfa: '0,05', datos: '82 78\n91 85\n77 75\n88 89\n95 88\n79 79\n84 76\n90 79' } },
    { clave: 'signos-mediana', nombre: 'Test des signes pour la médiane', sc: { tipo: 'signosmed', h1: 'dos', alfa: '0,05', m0: '50', datos: '54 61 48 58 66 53 63 57 49 60' } },
    { clave: 'correlacion', nombre: 'Spearman et Kendall : notes de deux examens', sc: { tipo: 'correlacion', h1: 'dos', alfa: '0,05', datos: '1 2\n2 1\n3 4\n4 3\n5 7\n6 8\n7 5\n8 6' } },
    { clave: 'correlacion-empates', nombre: 'Kendall avec ex æquo', sc: { tipo: 'correlacion', h1: 'dos', alfa: '0,05', datos: '1 1\n2 3\n2 2\n3 2\n4 5\n4 6\n5 6' } },
  ];
  return { resolver, ejemplos, TIPOS, H1, POST, rangos };
})();

