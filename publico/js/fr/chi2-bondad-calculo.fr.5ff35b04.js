const Chi2Bondad = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista, filas } = K, D = ES.DIST;
  const MODOS = { bondad: 'Adéquation', independencia: 'Indépendance ou homogénéité (tableau de contingence)', fisher: 'Test exact de Fisher (tableau 2 × 2 avec peu de données)', mcnemar: 'McNemar (données appariées 2 × 2)' };
  const H1 = { distinto: 'Bilatéral : les proportions diffèrent', mayor: 'Unilatéral : odds ratio > 1', menor: 'Unilatéral : odds ratio < 1' };
  const MODELOS = { uniforme: 'Uniforme (toutes les classes équiprobables)', dadas: 'Proportions données', binomial: 'Loi binomiale B(n, p)', poisson: 'Loi de Poisson P(λ)', normal: 'Loi normale N(μ, σ) par intervalles' };
  const COLUMNAS = { uniforme: 1, dadas: 2, binomial: 2, poisson: 2, normal: 3 };
  const suma = (v) => v.reduce((a, b) => a + b, 0);

  function tabla(texto, nom) {
    const lin = String(texto ?? '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !/[a-zñáéíóú]/i.test(l.replace(/e[+-]?\d/gi, '')));
    if (!lin.length) throw new Error(`Il manque : ${nom}`);
    return filas(texto, (/[;\t]/.test(lin[0]) ? lin[0].split(/\s*[;\t]\s*/) : lin[0].split(/\s+/)).filter(Boolean).length, nom);
  }
  const frec = (o, nom) => { if (o.some((x) => x < 0 || !Number.isInteger(x))) throw new Error(`Les effectifs observés de ${nom} doivent être des entiers à partir de 0`); };

  function discretas(sc, modelo) {
    const t = tabla(sc.datos, 'le tableau de valeurs x et d’effectifs');
    if (t[0].length !== 2) throw new Error('Écrivez dans chaque ligne la valeur x et son effectif observé');
    const x = t.map((r) => r[0]), o = t.map((r) => r[1]);
    frec(o, 'la tabla');
    if (x.some((v, i) => !Number.isInteger(v) || v < 0 || (i && v !== x[i - 1] + 1))) throw new Error('Les valeurs x doivent être des entiers consécutifs, du plus petit au plus grand (0, 1, 2…)');
    const N = suma(o), m = suma(x.map((v, i) => v * o[i])) / N, est = sc.estima !== 'no';
    let P, Dd, par, estTxt;
    if (modelo === 'binomial') {
      const n = lee(sc, 'nb', 'le nombre d’épreuves n', { min: 1, entero: true });
      if (x[x.length - 1] > n) throw new Error(`Il y a des valeurs x supérieures à n = ${n}`);
      const p = est ? m / n : lee(sc, 'pb', 'la probabilité de succès p', { min: 0, minEx: true, max: 1, maxEx: true });
      Dd = D.binomial; P = { n, p }; par = est ? 1 : 0;
      estTxt = est ? `$x̄ = {∑ x_i O_i}/N = ${f(m * N)}/${N} = ${f(m)}$ et, comme la moyenne d’une binomiale est $n p$, $p̂ = x̄/n = ${f(m)}/${n} = ${f(p)}$` : '';
    } else {
      const l = est ? m : lee(sc, 'lambda', 'la moyenne λ', { min: 0, minEx: true });
      Dd = D.poisson; P = { lambda: l }; par = est ? 1 : 0;
      estTxt = est ? `La moyenne d’une loi de Poisson est λ : $λ̂ = x̄ = {∑ x_i O_i}/N = ${f(m * N)}/${N} = ${f(l)}$` : '';
    }
    if (!(est ? P.p ?? P.lambda : 1) && est) throw new Error('Avec tous les effectifs en x = 0, on ne peut pas estimer le paramètre');
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
    const t = tabla(sc.datos, 'le tableau d’intervalles et d’effectifs');
    if (t[0].length !== 3) throw new Error('Écrivez dans chaque ligne la borne inférieure, la borne supérieure et l’effectif observé de l’intervalle');
    const o = t.map((r) => r[2]);
    frec(o, 'la tabla');
    t.forEach((r, i) => { if (!(r[1] > r[0])) throw new Error(`Dans la ligne ${i + 1}, la borne supérieure doit être supérieure à la borne inférieure`); if (i && Math.abs(r[0] - t[i - 1][1]) > 1e-9) throw new Error(`Les intervalles doivent se suivre : la ligne ${i + 1} commence en ${f(r[0])} et la précédente finit en ${f(t[i - 1][1])}`); });
    const N = suma(o), mc = t.map((r) => (r[0] + r[1]) / 2), est = sc.estima !== 'no';
    const mu = est ? suma(mc.map((v, i) => v * o[i])) / N : lee(sc, 'mu', 'la moyenne μ');
    const sigma = est ? Math.sqrt(suma(mc.map((v, i) => o[i] * (v - mu) ** 2)) / N) : lee(sc, 'sigma', 'l’écart type σ', { min: 0, minEx: true });
    if (!(sigma > 0)) throw new Error('Toutes les données sont dans un seul intervalle : on ne peut pas estimer σ');
    const P = { mu, sigma }, ult = t.length - 1;
    const cl = t.map((r, i) => ({ lo: i === 0 ? -Infinity : r[0], hi: i === ult ? Infinity : r[1], o: o[i] }));
    for (const c of cl) c.p = (c.hi === Infinity ? 1 : D.normal.cdf(P, c.hi)) - (c.lo === -Infinity ? 0 : D.normal.cdf(P, c.lo));
    return { cl, N, par: est ? 2 : 0, Dd: D.normal, P, nomD: `N(${f(mu)}, ${f(sigma)})`,
      estTxt: est ? `Avec les centres de classe $m_i$ : $μ̂ = x̄ = {∑ m_i O_i}/N = ${f(mu)}$ et $σ̂ = √({∑ O_i (m_i − x̄)^2}/N) = ${f(sigma)}$` : '',
      nomCl: (c) => c.lo === -Infinity && c.hi === Infinity ? 'todo' : c.lo === -Infinity ? `x < ${f(c.hi)}` : c.hi === Infinity ? `x ≥ ${f(c.lo)}` : `${f(c.lo)}–${f(c.hi)}`,
      formP: (c) => c.lo === -Infinity ? `P(X < ${f(c.hi)})` : c.hi === Infinity ? `P(X ≥ ${f(c.lo)})` : `P(${f(c.lo)} ≤ X < ${f(c.hi)})` };
  }
  function sencillas(sc, modelo) {
    let o, w;
    if (modelo === 'uniforme') { o = lista(sc.datos, 'les effectifs observés'); w = o.map(() => 1); }
    else { const t = tabla(sc.datos, 'le tableau d’effectifs et de proportions'); if (t[0].length !== 2) throw new Error('Écrivez dans chaque ligne l’effectif observé et la proportion attendue de la classe'); o = t.map((r) => r[0]); w = t.map((r) => r[1]); }
    frec(o, 'las clases');
    if (w.some((v) => !(v > 0))) throw new Error('Les proportions attendues doivent être supérieures à 0');
    const W = suma(w), N = suma(o);
    return { cl: o.map((v, i) => ({ lo: i + 1, hi: i + 1, o: v, p: w[i] / W })), N, par: 0, nomD: modelo === 'uniforme' ? 'uniforme' : 'les proportions données', estTxt: '', W, w,
      nomCl: (c) => c.lo === c.hi ? `Classe ${c.lo}` : `Classes ${c.lo}–${c.hi}`, formP: (c) => modelo === 'uniforme' ? `1/${o.length}` : c.lo === c.hi ? `${f(w[c.lo - 1])}/${f(W)}` : `p_{${c.lo}–${c.hi}}` };
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
    if (!(r.N > 0)) throw new Error('Le total des observations doit être supérieur à 0');
    let cl = r.cl, junto = false;
    if (sc.agrupa === 'si') ({ cl, junto } = agrupa(cl, r.N));
    const celdas = cl.map((c) => { const e = r.N * c.p; return { nom: r.nomCl(c), o: c.o, e, c: (c.o - e) ** 2 / e, p: c.p, fp: r.formP(c), junta: c.junta }; });
    const chi = suma(celdas.map((c) => c.c)), gl = celdas.length - 1 - r.par;
    if (gl < 1) throw new Error(`Il reste ${celdas.length} classes et ${r.par ? `${r.par} paramètres sont estimés` : 'aucun paramètre n’est estimé'} : il n’y a pas de degrés de liberté. Il faut plus de classes${junto ? ' (essayez sans regrouper celles dont l’effectif théorique est petit)' : ''}`);
    const pocos = celdas.filter((c) => c.e < 5).length, { crit, pv, rechaza } = decide(chi, gl, alfa);
    const h0 = modelo === 'uniforme' ? 'toutes les classes sont équiprobables' : modelo === 'dadas' ? 'les proportions sont celles données' : `les données suivent la loi ${{ binomial: 'binomiale', poisson: 'de Poisson', normal: 'normale' }[modelo]}${r.par ? '' : ` ${r.nomD}`}`;
    const pasos = [];
    pasos.push({ t: 'Hypothèses', html: `$H_0$ : ${h0}, contre $H_1$ : ${modelo === 'uniforme' || modelo === 'dadas' ? 'ce n’est pas le cas' : 'elles ne la suivent pas'} ; avec $α = ${f(alfa)}$ et $N = ${r.N}$ observations.` });
    if (r.estTxt) pasos.push({ t: 'Paramètres estimés', html: `${r.estTxt}. Se ajusta a una ${r.nomD}; cada parámetro estimado resta un grado de libertad.` });
    const ej = celdas.slice(0, 3).map((c) => `$E = N · ${c.fp} = ${r.N} · ${f(c.p)} = ${f(c.e)}$`).join('<br>');
    pasos.push({ t: 'Effectifs théoriques', html: `$E_i = N p_i$, avec $p_i$ la probabilité de chaque classe si $H_0$ est vraie${modelo === 'normal' ? ' (le premier intervalle est prolongé jusqu’à −∞ et le dernier jusqu’à +∞, pour que la somme fasse 1)' : modelo === 'binomial' || modelo === 'poisson' ? ' (la première et la dernière classe récupèrent les queues, pour que la somme fasse 1)' : ''} :<br>${ej}${celdas.length > 3 ? '<br>et de même pour les autres (dans le tableau).' : ''}${junto ? '<br>Les classes dont l’effectif théorique est inférieur à 5 ont été <b>regroupées</b> avec leur voisine.' : ''}${pocos ? `<br><b>Attention :</b> ${pocos === 1 ? 'une classe a' : `${pocos} classes ont`} un effectif théorique inférieur à 5 et l’approximation du χ² peut ne pas être bonne${sc.agrupa === 'si' ? '' : ' : il convient de regrouper des classes'}.` : ''}` });
    pasos.push({ t: 'Statistique de test', html: `$χ^2 = ∑ {(O_i − E_i)^2}/{E_i} = ${sumaTxt(celdas.map((c) => `{(${c.o} − ${f(c.e)})^2}/{${f(c.e)}}`))}$<br>$χ^2 = ${sumaTxt(celdas.map((c) => f(c.c)))} = ${f(chi)}$` });
    pasos.push({ t: 'Degrés de liberté', html: `$ν = k − 1 − m = ${celdas.length} − 1${r.par ? ` − ${r.par}` : ''} = ${gl}$, avec $k = ${celdas.length}$ classes${r.par ? ` et $m = ${r.par}$ ${r.par === 1 ? 'paramètre estimé' : 'paramètres estimés'}` : ''}.` });
    return { modo: 'bondad', modelo, celdas, chi, gl, crit, pv, rechaza, pocos, junto, N: r.N, nomD: r.nomD, pasos, h0 };
  }

  function independencia(sc) {
    const t = tabla(sc.datos, 'le tableau de contingence'), r = t.length, c = t[0].length;
    if (r < 2 || c < 2) throw new Error('Le tableau de contingence nécessite au moins 2 lignes et 2 colonnes');
    t.forEach((fl) => frec(fl, 'la tabla'));
    const F = t.map(suma), C = t[0].map((_, j) => suma(t.map((fl) => fl[j]))), N = suma(F);
    if (F.some((v) => !v) || C.some((v) => !v)) throw new Error('Une ligne ou une colonne entière est à zéro : retirez-la du tableau');
    const yates = sc.yates === 'si' && r === 2 && c === 2, celdas = [];
    t.forEach((fl, i) => fl.forEach((o, j) => { const e = (F[i] * C[j]) / N, d = yates ? Math.max(0, Math.abs(o - e) - 0.5) : o - e; celdas.push({ nom: `Ligne ${i + 1}, colonne ${j + 1}`, i, j, o, e, c: (d * d) / e }); }));
    const chi = suma(celdas.map((x) => x.c)), gl = (r - 1) * (c - 1), pocos = celdas.filter((x) => x.e < 5).length, V = Math.sqrt(chi / (N * (Math.min(r, c) - 1)));
    const pasos = [];
    pasos.push({ t: 'Hypothèses', html: `$H_0$ : les deux variables sont <b>indépendantes</b> (ou, si chaque ligne est une population, toutes ont les mêmes proportions), contre $H_1$ : il y a une relation entre elles ; avec $α = ${f(alfa(sc))}$.` });
    pasos.push({ t: 'Effectifs théoriques', html: `Si elles sont indépendantes, $E_{ij} = {F_i · C_j}/N$, avec $F_i$ et $C_j$ les totaux de la ligne $i$ et de la colonne $j$ et $N = ${N}$ :<br>${celdas.slice(0, 2).map((x) => `$E_{${x.i + 1}${x.j + 1}} = {${F[x.i]} · ${C[x.j]}}/${N} = ${f(x.e)}$`).join(', &ensp; ')}, et de même pour les autres (dans le tableau).${pocos ? `<br><b>Attention :</b> ${pocos === 1 ? 'une case a' : `${pocos} cases ont`} un effectif théorique inférieur à 5 et l’approximation du χ² peut ne pas être bonne.` : ''}` });
    pasos.push({ t: 'Statistique de test', html: `${yates ? 'Dans un tableau 2 × 2, on applique la correction de Yates : ' : ''}$χ^2 = ∑ {(${yates ? '|O_{ij} − E_{ij}| − 0,5' : 'O_{ij} − E_{ij}'})^2}/{E_{ij}} = ${sumaTxt(celdas.map((x) => yates ? `{(|${x.o} − ${f(x.e)}| − 0,5)^2}/{${f(x.e)}}` : `{(${x.o} − ${f(x.e)})^2}/{${f(x.e)}}`))}$<br>$χ^2 = ${sumaTxt(celdas.map((x) => f(x.c)))} = ${f(chi)}$` });
    pasos.push({ t: 'Degrés de liberté', html: `$ν = (r − 1)(c − 1) = (${r} − 1)(${c} − 1) = ${gl}$, avec $r = ${r}$ lignes et $c = ${c}$ colonnes.` });
    celdas.forEach((x) => { x.rp = (x.o - x.e) / Math.sqrt(x.e); x.rs = (x.o - x.e) / Math.sqrt(x.e * (1 - F[x.i] / N) * (1 - C[x.j] / N)); x.marca = Math.abs(x.rs) > 2; });
    const mayores = celdas.filter((x) => x.marca);
    pasos.push({ t: 'Résidus standardisés', html: `Pour voir <i>où</i> se trouve l’association : $r_{ij} = {O_{ij} − E_{ij}}/√{E_{ij}(1 − F_i/N)(1 − C_j/N)}$, qui sous $H_0$ est approximativement $N(0, 1)$ : une valeur en dehors de $±2$ marque une case comportant plus (ou moins) de cas que prévu.<br>${celdas.slice(0, 2).map((x) => `$r_{${x.i + 1}${x.j + 1}} = ${f(x.rs)}$`).join(', &ensp; ')}${celdas.length > 2 ? ', …' : ''}. ${mayores.length ? `Se détachent : ${mayores.map((x) => `ligne ${x.i + 1}, colonne ${x.j + 1} (${f(x.rs)} : ${x.rs > 0 ? 'plus' : 'moins'} que prévu)`).join(' ; ')}.` : 'Aucune case ne sort de ±2.'}` });
    const dc = decide(chi, gl, alfa(sc));
    return { modo: 'independencia', celdas, chi, gl, ...dc, pocos, N, t, F, C, V, yates, pasos, h0: 'les variables sont indépendantes', mayores };
  }
  const alfa = (sc) => lee(sc, 'alfa', 'le niveau de signification α', { min: 0, minEx: true, max: 0.5, maxEx: true });


  const lnFact = (n) => ES.lnGamma(n + 1);
  const lnC = (n, k) => lnFact(n) - lnFact(k) - lnFact(n - k);
  function fisher(sc, a) {
    const t = tabla(sc.datos, 'le tableau 2 × 2'); if (t.length !== 2 || t[0].length !== 2) throw new Error('Le test de Fisher nécessite un tableau 2 × 2 : deux lignes de deux nombres chacune');
    t.forEach((fl) => frec(fl, 'la tabla'));
    const [[n11, n12], [n21, n22]] = t, r1 = n11 + n12, r2 = n21 + n22, c1 = n11 + n21, N = r1 + r2, h1 = H1[sc.h1] ? sc.h1 : 'distinto';
    if (!r1 || !r2 || !c1 || !(n12 + n22)) throw new Error('Une ligne ou une colonne entière est à zéro : retirez-la du tableau');
    const lo = Math.max(0, c1 - r2), hi = Math.min(r1, c1), pr = (k) => Math.exp(lnC(r1, k) + lnC(r2, c1 - k) - lnC(N, c1)), obs = pr(n11);
    let le = 0, ge = 0, bil = 0; for (let k = lo; k <= hi; k++) { const q = pr(k); if (k <= n11) le += q; if (k >= n11) ge += q; if (q <= obs * (1 + 1e-7)) bil += q; }
    const p = Math.min(1, h1 === 'mayor' ? ge : h1 === 'menor' ? le : bil), or = n12 * n21 === 0 ? (n11 * n22 === 0 ? NaN : Infinity) : (n11 * n22) / (n12 * n21);
    const esp = [r1 * c1 / N, r1 * (N - c1) / N, r2 * c1 / N, r2 * (N - c1) / N], pocos = esp.filter((e) => e < 5).length;
    const pasos = [
      { t: 'Hypothèses', html: `$H_0$ : les deux lignes ont la même probabilité de « succès » (colonne 1), c’est-à-dire que l’odds ratio vaut 1 ; contre $H_1$ : il ${{ distinto: 'est différent de 1', mayor: 'est supérieur à 1', menor: 'est inférieur à 1' }[h1]}. Avec les marges fixes ($F_1 = ${r1}$, $F_2 = ${r2}$, $C_1 = ${c1}$, $N = ${N}$).` },
      { t: 'Loi exacte', html: `Avec les marges fixes, le nombre $X$ de cas dans la case (1, 1) suit une <b>loi hypergéométrique</b> : $P(X = k) = {\\binom{${r1}}{k}\\binom{${r2}}{${c1} − k}}/{\\binom{${N}}{${c1}}}$, avec $k$ de $${lo}$ à $${hi}$. Le tableau observé a $k = ${n11}$ et $P(X = ${n11}) = ${ES.prob(obs)}$.${pocos ? ` (C’est pourquoi le χ² n’est pas valable : ${pocos === 1 ? 'une case a' : `${pocos} cases ont`} un effectif théorique inférieur à 5.)` : ''}` },
      { t: 'p-valor exacto', html: h1 === 'mayor' ? `$p = P(X ≥ ${n11}) = ${ES.prob(ge)}$` : h1 === 'menor' ? `$p = P(X ≤ ${n11}) = ${ES.prob(le)}$` : `Bilatéral : on additionne les probabilités de tous les tableaux aussi peu probables que celui observé ou moins, $p = ∑_{P(X = k) ≤ ${ES.prob(obs)}} P(X = k) = ${ES.prob(bil)}$.` },
      { t: 'Odds ratio', html: `Odds ratio de l’échantillon : $OR = {n_{11} n_{22}}/{n_{12} n_{21}} = {${n11} · ${n22}}/{${n12} · ${n21}} = ${isFinite(or) ? f(or) : or === Infinity ? '∞' : 'indéterminé'}$ (1 = pas d’association).` },
      { t: 'Conclusion', html: p < a ? `<b>On rejette $H_0$</b> au niveau de signification de ${f(100 * a)} % : il y a une association entre la ligne et la colonne.` : `<b>On ne rejette pas $H_0$</b> au niveau de signification de ${f(100 * a)} % : il n’y a pas d’indice d’association.` },
    ];
    return { modo: 'fisher', t, N, h1, p, pv: p, le, ge, bil, obs, or, lo, hi, dist: Array.from({ length: hi - lo + 1 }, (_, i) => [lo + i, pr(lo + i)]), n11, pocos, esp, rechaza: p < a, chi: NaN, gl: 0, crit: NaN, pasos, alfa: a };
  }

  function mcnemar(sc, a) {
    const t = tabla(sc.datos, 'le tableau 2 × 2 des paires'); if (t.length !== 2 || t[0].length !== 2) throw new Error('McNemar nécessite un tableau 2 × 2 : deux lignes de deux nombres chacune');
    t.forEach((fl) => frec(fl, 'la tabla'));
    const [[A, b], [c, d]] = t, n = b + c; if (n < 1) throw new Error('Il n’y a pas de paires discordantes (b + c = 0) : on ne peut pas faire le test');
    const corr = sc.yates !== 'no', chi = ((corr ? Math.max(0, Math.abs(b - c) - 1) : Math.abs(b - c)) ** 2) / n, pChi = D.chi2.sf({ k: 1 }, chi);
    let s = 0, cb = 1; for (let i = 0; i <= Math.min(b, c); i++) { s += cb; cb = (cb * (n - i)) / (i + 1); } const pEx = Math.min(1, (2 * s) / 2 ** n);
    const usaEx = sc.metodo === 'exacto', p = usaEx ? pEx : pChi;
    const pasos = [
      { t: 'Hypothèses', html: `Chaque individu est mesuré deux fois (avant et après). Seuls comptent les <b>discordants</b> : $b = ${b}$ (oui → non) et $c = ${c}$ (non → oui). $H_0$ : les deux changements sont équiprobables ($b$ et $c$ doivent être semblables), contre $H_1$ : ils ne le sont pas ; $α = ${f(a)}$.` },
      { t: 'Statistique', html: `$χ^2 = {(${corr ? '|b − c| − 1' : 'b − c'})^2}/{b + c} = {(${corr ? `|${b} − ${c}| − 1` : `${b} − ${c}`})^2}/{${n}} = ${f(chi)}$ avec 1 degré de liberté${corr ? ' (avec la correction de continuité)' : ''} : $p = ${ES.prob(pChi)}$.` },
      { t: 'Version exacte', html: `Si $H_0$ est vraie, $b$ suit une loi binomiale $B(${n}, 1/2)$ et $p = 2 · P(X ≤ ${Math.min(b, c)}) = ${ES.prob(pEx)}$ (limitée à 1). Elle est préférable si $b + c$ est petit (moins d’environ 25).` },
      { t: 'Conclusion', html: `Avec ${usaEx ? 'la version exacte' : 'le χ²'}, $p = ${ES.prob(p)}$ : ${p < a ? `<b>on rejette $H_0$</b> au niveau de signification de ${f(100 * a)} % : le changement n’est pas dû au hasard` : `<b>on ne rejette pas $H_0$</b> au niveau de signification de ${f(100 * a)} % : il n’y a pas d’indice de changement`}.` },
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
    r.pasos.push({ t: 'Région critique et p-valeur', html: `Le test est toujours unilatéral à droite (plus les effectifs observés s’écartent des effectifs théoriques, plus χ² est grand). Avec $ν = ${r.gl}$, la valeur critique est $χ^2_{${r.gl}; ${f(1 - a)}} = ${f(r.crit)}$ : on rejette $H_0$ si $χ^2 > ${f(r.crit)}$.<br>$χ^2 = ${f(r.chi)}$ ${r.rechaza ? '<b>tombe dans la région critique</b>' : '<b>ne tombe pas dans la région critique</b>'}, et la p-valeur est $p = P(χ^2_{${r.gl}} ≥ ${f(r.chi)}) = ${f(r.pv)}$, ${r.pv < a ? 'inférieure' : 'supérieure'} à $α$.` });
    r.pasos.push({ t: 'Conclusion', html: r.rechaza ? `<b>On rejette $H_0$</b> au niveau de signification de ${f(100 * a)} % : ${modo === 'independencia' ? `il y a une relation entre les deux variables (V de Cramér = ${f(r.V, 3)}, ${r.V < 0.1 ? 'très faible' : r.V < 0.3 ? 'faible' : r.V < 0.5 ? 'modérée' : 'forte'})` : 'les données ne s’ajustent pas au modèle'}.` : `<b>On ne rejette pas $H_0$</b> au niveau de signification de ${f(100 * a)} % : ${modo === 'independencia' ? 'les données n’apportent pas de preuves de relation entre les variables' : 'les différences entre l’observé et le théorique peuvent être dues au hasard, et le modèle est acceptable'}.` });
    return r;
  }

  const ejemplos = [
    { clave: 'dado', nombre: 'Uniforme : le dé est-il truqué ? (120 lancers)', sc: { modo: 'bondad', modelo: 'uniforme', alfa: '0,05', agrupa: 'no', datos: '12\n16\n20\n18\n22\n32' } },
    { clave: 'mendel', nombre: 'Proportions données : petits pois de Mendel (9 : 3 : 3 : 1)', sc: { modo: 'bondad', modelo: 'dadas', alfa: '0,05', agrupa: 'no', datos: '315 9\n108 3\n101 3\n32 1' } },
    { clave: 'coces', nombre: 'Poisson : morts par coup de sabot de cheval (Bortkiewicz)', sc: { modo: 'bondad', modelo: 'poisson', estima: 'si', alfa: '0,05', agrupa: 'si', datos: '0 109\n1 65\n2 22\n3 3\n4 1' } },
    { clave: 'familias', nombre: 'Binomiale : nombre de garçons dans des familles de 4 enfants', sc: { modo: 'bondad', modelo: 'binomial', estima: 'si', nb: '4', alfa: '0,05', agrupa: 'si', datos: '0 7\n1 33\n2 51\n3 37\n4 12' } },
    { clave: 'alturas', nombre: 'Loi normale : tailles par intervalles (cm)', sc: { modo: 'bondad', modelo: 'normal', estima: 'si', alfa: '0,05', agrupa: 'si', datos: '150 160 8\n160 170 25\n170 180 40\n180 190 20\n190 200 7' } },
    { clave: 'preferencia', nombre: 'Indépendance : sexe et sport préféré (2 × 3)', sc: { modo: 'independencia', alfa: '0,05', yates: 'no', datos: '20 30 50\n30 30 40' } },
    { clave: 'fisher', nombre: 'Fisher : thé au lait (petit tableau 2 × 2)', sc: { modo: 'fisher', h1: 'mayor', alfa: '0,05', datos: '3 1\n1 3' } },
    { clave: 'fisher-bilateral', nombre: 'Fisher bilatéral : un médicament avec peu de cas', sc: { modo: 'fisher', h1: 'distinto', alfa: '0,05', datos: '8 2\n1 5' } },
    { clave: 'mcnemar', nombre: 'McNemar : opinion avant et après une campagne', sc: { modo: 'mcnemar', alfa: '0,05', yates: 'si', metodo: 'chi2', datos: '59 6\n16 80' } },
    { clave: 'mcnemar-exacto', nombre: 'McNemar exact avec peu de discordants', sc: { modo: 'mcnemar', alfa: '0,05', yates: 'si', metodo: 'exacto', datos: '20 9\n2 15' } },
    { clave: 'curacion', nombre: 'Homogénéité 2 × 2 : guérison avec deux traitements', sc: { modo: 'independencia', alfa: '0,05', yates: 'no', datos: '45 105\n30 120' } },
  ];

  return { resolver, ejemplos, MODOS, MODELOS, COLUMNAS, H1 };
})();

