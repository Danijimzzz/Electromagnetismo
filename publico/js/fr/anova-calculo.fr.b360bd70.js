const Anova = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const IN = typeof Inferencia !== 'undefined' ? Inferencia : require('../estadistica/inferencia.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista } = K, D = ES.DIST, suma = IN.suma;
  const MODOS = { uno: 'Un factor', dos: 'Deux facteurs (plan équilibré)' };
  const POST = { no: 'No', tukey: 'Tukey (HSD)', bonferroni: 'Bonferroni', holm: 'Holm', scheffe: 'Scheffé', gh: 'Games-Howell (variances différentes)' };
  const POST_DOS = ['no', 'tukey', 'bonferroni', 'holm', 'scheffe'];
  const PRUEBA = { f: 'F classique (variances égales)', welch: 'F de Welch (variances différentes)' };
  const sumaTxt = (t) => (t.length > 4 ? [...t.slice(0, 2), '…', t[t.length - 1]] : t).join(' + ');
  const limpia = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tq = (nu, p) => ES.cuantil(D.t, { nu }, p), fq = (d1, d2, p) => ES.cuantil(D.f, { d1, d2 }, p);
  const pT2 = (nu, t) => Math.min(1, 2 * D.t.sf({ nu }, Math.abs(t)));

  function grupos(texto) {
    const g = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim();
      if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'), nom = j > 0 ? limpia(l.slice(0, j).trim()) : `Groupe ${g.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `la ligne ${i + 1}`);
      if (x.length < 1) throw new Error(`La ligne ${i + 1} n’a pas de valeurs`);
      g.push({ nom, x });
    });
    if (g.length < 2) throw new Error('Écrivez au moins deux groupes, un par ligne');
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
    if (g.some((q) => q.n < 2)) throw new Error('Games-Howell nécessite au moins deux valeurs dans chaque groupe');
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      const vi = g[i].s2 / g[i].n, vj = g[j].s2 / g[j].n, se = Math.sqrt(vi + vj), dif = g[i].m - g[j].m, gl = (vi + vj) ** 2 / (vi ** 2 / (g[i].n - 1) + vj ** 2 / (g[j].n - 1));
      if (!(se > 0)) throw new Error('Games-Howell nécessite que les groupes présentent une certaine variation');
      const q = Math.abs(dif) / (se / Math.SQRT2), p = Math.max(0, 1 - IN.ptukey(q, k, gl)), c = IN.qtukey(1 - alfa, k, gl) * se / Math.SQRT2;
      filas.push({ a: g[i].nom, b: g[j].nom, dif, est: q, etq: 'q', p, lo: dif - c, hi: dif + c, gl, sig: p < alfa });
    }
    return filas;
  }

  function contrastes(texto, g, MSW, glW, alfa) {
    const out = [], k = g.length;
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim(); if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'), nom = j > 0 ? limpia(l.slice(0, j).trim()) : `Contraste ${out.length + 1}`, c = lista(j > 0 ? l.slice(j + 1) : l, `le contraste de la ligne ${i + 1}`);
      if (c.length !== k) throw new Error(`Le contraste « ${nom} » a ${c.length} coefficients et il y a ${k} groupes`);
      const s = suma(c); if (Math.abs(s) > 1e-9 * Math.max(1, ...c.map(Math.abs))) throw new Error(`Les coefficients du contraste « ${nom} » ont pour somme ${f(s)} : leur somme doit être 0`);
      if (c.every((v) => v === 0)) throw new Error(`Le contraste « ${nom} » a tous ses coefficients à 0`);
      const psi = suma(c.map((v, q) => v * g[q].m)), ee = Math.sqrt(MSW * suma(c.map((v, q) => (v * v) / g[q].n))), t = psi / ee, p = pT2(glW, t), h = tq(glW, 1 - alfa / 2) * ee;
      out.push({ nom, c, psi, ee, t, p, lo: psi - h, hi: psi + h, sig: p < alfa });
    });
    return out;
  }

  function resolverUno(sc, alfa) {
    const g = grupos(sc.datos), k = g.length, N = suma(g.map((q) => q.x.length)), post = POST[sc.post] && sc.post !== 'no' ? sc.post : 'no', welchSel = sc.prueba === 'welch';
    if (N <= k) throw new Error('Il faut au moins un groupe avec plus d’une valeur pour estimer la variabilité à l’intérieur des groupes');
    for (const q of g) { q.n = q.x.length; q.m = suma(q.x) / q.n; q.ss = suma(q.x.map((v) => (v - q.m) ** 2)); q.s2 = q.n > 1 ? q.ss / (q.n - 1) : NaN; }
    const media = suma(g.map((q) => q.n * q.m)) / N;
    const SSB = suma(g.map((q) => q.n * (q.m - media) ** 2)), SSW = suma(g.map((q) => q.ss)), SST = SSB + SSW;
    const glB = k - 1, glW = N - k, MSB = SSB / glB, MSW = SSW / glW;
    if (!(MSW > 0)) throw new Error('À l’intérieur de tous les groupes, les valeurs sont égales (variance 0) : F n’est pas définie');
    const F = MSB / MSW, P = { d1: glB, d2: glW }, pvF = D.f.sf(P, F), critF = fq(glB, glW, 1 - alfa);
    const eta2 = SSB / SST, om2 = Math.max(0, (SSB - glB * MSW) / (SST + MSW)), fC = Math.sqrt(eta2 / (1 - eta2));
    const wel = IN.welch(g.map((q) => q.x)), sup = IN.supuestos(g.map((q) => q.x), alfa);
    if (welchSel && !wel) throw new Error('La F de Welch nécessite au moins deux valeurs dans chaque groupe et qu’aucun ne soit constant');
    const usaW = welchSel && wel, Fp = usaW ? wel.F : F, p = usaW ? wel.p : pvF, g1 = usaW ? wel.gl1 : glB, g2 = usaW ? wel.gl2 : glW, crit = usaW ? fq(g1, g2, 1 - alfa) : critF, rechaza = p < alfa;
    const tcrit = tq(glW, 1 - alfa / 2);
    for (const q of g) { const h = tcrit * Math.sqrt(MSW / q.n); q.lo = q.m - h; q.hi = q.m + h; q.s = Math.sqrt(q.s2); }
    const pares = post === 'gh' ? gamesHowell(g, alfa) : post !== 'no' ? parejas(g.map((q) => ({ nom: q.nom, m: q.m, r: q.n })), MSW, glW, post, alfa) : [];
    const contr = String(sc.contrastes ?? '').trim() ? contrastes(sc.contrastes, g, MSW, glW, alfa) : [];
    const avisos = [];
    if (sup.levene && isFinite(sup.levene.p) && sup.levene.p < alfa) avisos.push(`Levene rejette l’égalité des variances (p = ${ES.prob(sup.levene.p)}) : la F de Welch convient et, pour comparer les paires, Games-Howell.`);
    if (sup.shapiro && isFinite(sup.shapiro.p) && sup.shapiro.p < alfa) avisos.push(`Shapiro-Wilk rejette la normalité des résidus (p = ${ES.prob(sup.shapiro.p)}) : voyez Kruskal-Wallis dans Tests non paramétriques.`);
    if (k >= 2 && Math.max(...g.map((q) => q.n)) / Math.min(...g.map((q) => q.n)) > 1.5) avisos.push('Les groupes ont des tailles différentes : l’ANOVA est moins robuste à des variances différentes.');
    const pasos = [];
    pasos.push({ t: 'Hypothèses', html: `$H_0$ : $μ_1 = μ_2 = ⋯ = μ_{${k}}$ (toutes les moyennes sont égales), contre $H_1$ : au moins deux moyennes sont différentes ; avec $α = ${f(alfa)}$, $k = ${k}$ groupes et $N = ${N}$ observations.` });
    pasos.push({ t: 'Moyennes', html: `${g.slice(0, 4).map((q, i) => `$x̄_{${i + 1}} = ${f(q.m)}$ ($n_{${i + 1}} = ${q.n}$)`).join(', ')}${k > 4 ? ', …' : ''}.<br>Moyenne globale : $x̄ = {∑ n_i x̄_i}/N = ${f(media)}$.` });
    pasos.push({ t: 'Variabilité entre les groupes', html: `$SC_E = ∑ n_i (x̄_i − x̄)^2 = ${sumaTxt(g.map((q) => `${q.n}(${f(q.m)} − ${f(media)})^2`))} = ${f(SSB)}$<br>$CM_E = {SC_E}/{k − 1} = {${f(SSB)}}/{${glB}} = ${f(MSB)}$` });
    pasos.push({ t: 'Variabilité à l’intérieur des groupes', html: `$SC_D = ∑∑ (x_{ij} − x̄_i)^2 = ${sumaTxt(g.map((q) => f(q.ss)))} = ${f(SSW)}$<br>$CM_D = {SC_D}/{N − k} = {${f(SSW)}}/{${glW}} = ${f(MSW)}$` });
    pasos.push({ t: 'Statistique F', html: `$F = {CM_E}/{CM_D} = {${f(MSB)}}/{${f(MSW)}} = ${f(F)}$, qui sous $H_0$ suit une loi de Fisher-Snedecor à $${glB}$ et $${glW}$ degrés de liberté.<br>Vérification : $SC_T = SC_E + SC_D = ${f(SSB)} + ${f(SSW)} = ${f(SST)}$.` });
    pasos.push({ t: 'Hypothèses', html: `Levene (avec la médiane) : $W = ${f(sup.levene.W)}$, $p = ${ES.prob(sup.levene.p)}$ → ${sup.varianzasOk === false ? 'les variances ne peuvent <b>pas</b> être considérées comme égales' : 'il n’y a pas d’indice que les variances diffèrent'}.<br>Shapiro-Wilk des résidus $x_{ij} − x̄_i$ : ${sup.shapiro && isFinite(sup.shapiro.W) ? `$W = ${f(sup.shapiro.W, 4)}$, $p = ${ES.prob(sup.shapiro.p)}$ → ${sup.normalidadOk === false ? 'la normalité n’est <b>pas</b> soutenable' : 'il n’y a pas d’indice contre la normalité'}` : 'calcul impossible (il faut au moins 3 résidus non constants)'}.${avisos.length ? `<br><b>Avertissement :</b> ${avisos.join(' ')}` : ''}` });
    if (usaW) pasos.push({ t: 'F de Welch', html: `Avec des variances différentes, on pondère chaque groupe par $w_i = n_i/s_i^2$ (Welch, 1951) : $F^* = ${f(wel.F)}$ avec $${f(wel.gl1)}$ et $${f(wel.gl2)}$ degrés de liberté (ces derniers approchés) ; la valeur critique est $${f(crit)}$ et la p-valeur, $${ES.prob(wel.p)}$.` });
    pasos.push({ t: 'Région critique et p-valeur', html: `Le test est unilatéral à droite : la valeur critique est $F_{${f(g1)}, ${f(g2)}; ${f(1 - alfa)}} = ${f(crit)}$ et la p-valeur, $P(F ≥ ${f(Fp)}) = ${ES.prob(p)}$${usaW ? '' : ` (à titre de comparaison, la F de Welch donne $${wel ? ES.prob(wel.p) : '—'}$)`}.` });
    pasos.push({ t: 'Taille de l’effet', html: `$η^2 = {SC_E}/{SC_T} = ${f(eta2, 3)}$ : le facteur explique ${f(100 * eta2, 3)} % de la variabilité.<br>$ω^2 = {SC_E − (k − 1) CM_D}/{SC_T + CM_D} = ${f(om2, 3)}$ (moins biaisé que $η^2$ avec peu de données) ; $f = √{η^2/(1 − η^2)} = ${f(fC, 3)}$ (Cohen : 0,10 petit, 0,25 moyen, 0,40 grand).` });
    pasos.push({ t: 'Conclusion', html: rechaza ? `<b>On rejette $H_0$</b> au niveau de signification de ${f(100 * alfa)} % : il y a des différences entre les moyennes.` : `<b>On ne rejette pas $H_0$</b> au niveau de signification de ${f(100 * alfa)} % : il n’y a pas d’indice que les moyennes soient différentes.` });
    pasos.push({ t: 'Intervalle de chaque moyenne', html: `Avec la variance commune, $x̄_i ± t_{${glW}; ${f(1 - alfa / 2)}} √{CM_D/n_i}$, avec $t = ${f(tcrit)}$. Par exemple, le groupe 1 : $(${f(g[0].lo)} ; ${f(g[0].hi)})$.` });
    if (pares.length) {
      const e = pares[0], m = pares.length;
      const txt = { bonferroni: `Pour chaque paire, $t = {x̄_i − x̄_j}/√(CM_D (1/n_i + 1/n_j))$ avec $${glW}$ degrés de liberté, et la p-valeur est multipliée par le nombre de paires, $m = k(k − 1)/2 = ${m}$ (Bonferroni).`,
        holm: `Pour chaque paire, $t = {x̄_i − x̄_j}/√(CM_D (1/n_i + 1/n_j))$ avec $${glW}$ degrés de liberté. On ordonne les $m = ${m}$ p-valeurs de la plus petite à la plus grande et celle de rang $r$ est multipliée par $m − r + 1$ (Holm), en veillant à ce qu’elle ne descende pas sous la précédente : il est plus puissant que Bonferroni avec le même contrôle de l’erreur globale.`,
        scheffe: `Pour chaque paire, $F = {(x̄_i − x̄_j)^2}/{(k − 1) CM_D (1/n_i + 1/n_j)}$ avec $${glB}$ et $${glW}$ degrés de liberté (Scheffé) : c’est le plus conservateur, mais il vaut pour n’importe quel contraste, pas seulement pour des paires.`,
        tukey: `Pour chaque paire, $q = {|x̄_i − x̄_j|}/√(CM_D/2 · (1/n_i + 1/n_j))$, qui sous $H_0$ suit l’étendue studentisée avec $k = ${k}$ et $${glW}$ degrés de liberté (Tukey-Kramer si les groupes ont des tailles différentes). Il contrôle l’erreur globale de <i>toutes</i> les paires à la fois et c’est la comparaison habituelle.`,
        gh: `Pour chaque paire, $q = {|x̄_i − x̄_j|}/√{(s_i^2/n_i + s_j^2/n_j)/2}$ avec les degrés de liberté de Welch-Satterthwaite de cette paire (Games-Howell) : il ne suppose pas des variances égales.` }[post];
      pasos.push({ t: `Comparaisons par paires (${POST[post].replace(/ \(.*/, '')})`, html: `${txt}<br>Par exemple, ${e.a} − ${e.b} : $${e.etq} = ${f(e.est)}$, $p = ${ES.prob(e.p)}$.${rechaza ? '' : ' La F n’étant pas significative, ces comparaisons ne sont qu’indicatives.'}` });
    }
    contr.forEach((c) => pasos.push({ t: `Contraste : ${c.nom}`, html: `$ψ = ∑ c_i x̄_i = ${sumaTxt(c.c.map((v, q) => `(${f(v)})(${f(g[q].m)})`))} = ${f(c.psi)}$ ; $EE = √(CM_D ∑ c_i^2/n_i) = ${f(c.ee)}$ ; $t = ψ/EE = ${f(c.t)}$ avec $${glW}$ ddl ; $p = ${ES.prob(c.p)}$ ; IC ${f(100 * (1 - alfa))} % : $(${f(c.lo)} ; ${f(c.hi)})$. ${c.sig ? '<b>Significatif</b>' : 'Non significatif'}.` }));
    return { modo: 'uno', g, k, N, media, SSB, SSW, SST, glB, glW, MSB, MSW, F, pvF, Fp, p, pv: p, g1, g2, crit, critF, rechaza, alfa, eta2, om2, fC, wel, usaW, sup, pares, post, contr, avisos, pasos };
  }

  function casillas(texto) {
    const A = [], B = [], cel = new Map();
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim(); if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'); if (j < 1) throw new Error(`La ligne ${i + 1} doit être « niveau A / niveau B : valeurs »`);
      const nombres = l.slice(0, j).split('/').map((s) => s.trim()); if (nombres.length !== 2 || !nombres[0] || !nombres[1]) throw new Error(`La ligne ${i + 1} doit nommer un niveau de chaque facteur, « niveau A / niveau B : valeurs »`);
      const [a, b] = nombres.map(limpia), x = lista(l.slice(j + 1), `la ligne ${i + 1}`); if (!x.length) throw new Error(`La ligne ${i + 1} n’a pas de valeurs`);
      if (!A.includes(a)) A.push(a); if (!B.includes(b)) B.push(b);
      const key = `${a}\u0000${b}`; if (cel.has(key)) throw new Error(`La combinaison « ${a} / ${b} » apparaît deux fois : mettez-la sur une seule ligne`);
      cel.set(key, x);
    });
    if (A.length < 2 || B.length < 2) throw new Error('Chaque facteur nécessite au moins deux niveaux');
    let n = null;
    for (const a of A) for (const b of B) {
      const x = cel.get(`${a}\u0000${b}`); if (!x) throw new Error(`La combinaison « ${a} / ${b} » est manquante : le plan doit être équilibré (toutes les combinaisons, avec les mêmes répétitions)`);
      if (n === null) n = x.length; else if (x.length !== n) throw new Error(`Les cases n’ont pas le même nombre de données (${n} et ${x.length}) : le plan doit être équilibré`);
    }
    return { A, B, n, cel };
  }
  function resolverDos(sc, alfa) {
    const { A, B, n, cel } = casillas(sc.datos), a = A.length, b = B.length, N = a * b * n, nomA = limpia(String(sc.nomA || 'Facteur A').trim() || 'Facteur A'), nomB = limpia(String(sc.nomB || 'Facteur B').trim() || 'Facteur B');
    const post = POST_DOS.includes(sc.post) ? sc.post : 'no', M = A.map((u) => B.map((v) => { const x = cel.get(`${u}\u0000${v}`); return suma(x) / n; }));
    const mA = M.map((r) => suma(r) / b), mB = B.map((_, j) => suma(M.map((r) => r[j])) / a), mg = suma(mA) / a;
    const SSA = b * n * suma(mA.map((v) => (v - mg) ** 2)), SSB = a * n * suma(mB.map((v) => (v - mg) ** 2));
    let SSAB = 0, SSE = 0;
    A.forEach((u, i) => B.forEach((v, j) => { SSAB += n * (M[i][j] - mA[i] - mB[j] + mg) ** 2; SSE += suma(cel.get(`${u}\u0000${v}`).map((y) => (y - M[i][j]) ** 2)); }));
    const SST = SSA + SSB + SSAB + SSE, glA = a - 1, glB = b - 1, glAB = glA * glB;
    const repl = n > 1, glE = repl ? a * b * (n - 1) : glAB, SCe = repl ? SSE : SSAB, MSE = SCe / glE;
    if (!(MSE > 0)) throw new Error(repl ? 'Dans toutes les cases, les valeurs sont égales (variance 0) : F n’est pas définie' : 'Sans répétitions, l’interaction joue le rôle d’erreur et vaut ici 0 : F n’est pas définie');
    const filasEf = [{ nom: nomA, SS: SSA, gl: glA }, { nom: nomB, SS: SSB, gl: glB }, ...(repl ? [{ nom: `${nomA} × ${nomB}`, SS: SSAB, gl: glAB }] : [])];
    for (const e of filasEf) { e.MS = e.SS / e.gl; e.F = e.MS / MSE; e.p = D.f.sf({ d1: e.gl, d2: glE }, e.F); e.crit = fq(e.gl, glE, 1 - alfa); e.eta2p = e.SS / (e.SS + SCe); e.om2p = Math.max(0, (e.gl * (e.F - 1)) / (e.gl * (e.F - 1) + N)); e.sig = e.p < alfa; }
    const todo = []; const res = [];
    A.forEach((u, i) => B.forEach((v, j) => { const x = cel.get(`${u}\u0000${v}`); todo.push(x); res.push(...x.map((y) => y - M[i][j])); }));
    const sh = repl && res.length >= 3 ? IN.shapiro(res) : null, lev = repl ? IN.levene(todo, 'mediana') : null;
    const margA = A.map((nm, i) => ({ nom: nm, m: mA[i], r: b * n })), margB = B.map((nm, j) => ({ nom: nm, m: mB[j], r: a * n }));
    const paresA = post !== 'no' ? parejas(margA, MSE, glE, post, alfa) : [], paresB = post !== 'no' ? parejas(margB, MSE, glE, post, alfa) : [];
    const avisos = [];
    if (!repl) avisos.push('Avec une seule donnée par case, on ne peut pas séparer l’interaction de l’erreur : on suppose qu’il n’y a pas d’interaction et l’on utilise sa variabilité comme erreur.');
    if (lev && isFinite(lev.p) && lev.p < alfa) avisos.push(`Levene rejette l’égalité des variances des cases (p = ${ES.prob(lev.p)}) : les p-valeurs sont indicatives.`);
    if (sh && isFinite(sh.p) && sh.p < alfa) avisos.push(`Shapiro-Wilk rejette la normalité des résidus (p = ${ES.prob(sh.p)}).`);
    const ef = filasEf, inter = repl ? ef[2] : null;
    const pasos = [];
    pasos.push({ t: 'Modèle et hypothèses', html: `$x_{ijk} = μ + α_i + β_j + (αβ)_{ij} + ε_{ijk}$ avec $a = ${a}$ niveaux de « ${nomA} », $b = ${b}$ de « ${nomB} » et $n = ${n}$ répétitions par case ($N = ${N}$). On teste trois hypothèses nulles : il n’y a pas d’effet de « ${nomA} », il n’y a pas d’effet de « ${nomB} »${repl ? ' et il n’y a pas d’interaction' : ''} ; $α = ${f(alfa)}$.` });
    pasos.push({ t: 'Moyennes', html: `Moyenne globale $x̄ = ${f(mg)}$. Moyennes de « ${nomA} » : ${A.map((nm, i) => `${nm} = ${f(mA[i])}`).join(', ')}. Moyennes de « ${nomB} » : ${B.map((nm, j) => `${nm} = ${f(mB[j])}`).join(', ')}.` });
    pasos.push({ t: 'Sommes des carrés', html: `$SC_A = b n ∑ (x̄_{i··} − x̄)^2 = ${f(SSA)}$; $SC_B = a n ∑ (x̄_{·j·} − x̄)^2 = ${f(SSB)}$; $SC_{AB} = n ∑∑ (x̄_{ij·} − x̄_{i··} − x̄_{·j·} + x̄)^2 = ${f(SSAB)}$${repl ? `; $SC_E = ∑∑∑ (x_{ijk} − x̄_{ij·})^2 = ${f(SSE)}$` : ''}.<br>Vérification : $SC_T = ${f(SST)}$.` });
    pasos.push({ t: 'Carrés moyens et F', html: `${ef.map((e) => `${e.nom}: $CM = ${f(e.SS)}/${e.gl} = ${f(e.MS)}$, $F = ${f(e.MS)}/${f(MSE)} = ${f(e.F)}$, $p = ${ES.prob(e.p)}$`).join('<br>')}<br>L’erreur a $${glE}$ degrés de liberté et $CM_E = ${f(MSE)}$.` });
    pasos.push({ t: 'Hypothèses', html: `${lev ? `Levene entre les cases : $W = ${f(lev.W)}$, $p = ${ES.prob(lev.p)}$.` : 'Avec une seule donnée par case, on ne peut pas vérifier les variances.'}${sh && isFinite(sh.W) ? ` Shapiro-Wilk des résidus : $W = ${f(sh.W, 4)}$, $p = ${ES.prob(sh.p)}$.` : ''}${avisos.length ? `<br><b>Avertissement :</b> ${avisos.join(' ')}` : ''}` });
    pasos.push({ t: 'Conclusion', html: `${ef.map((e) => `${e.nom}: ${e.sig ? '<b>effet significatif</b>' : 'pas d’effet significatif'} ($F = ${f(e.F)}$, $p = ${ES.prob(e.p)}$; $η^2_p = ${f(e.eta2p, 3)}$)`).join('<br>')}${inter && inter.sig ? '<br>Avec une interaction significative, les effets principaux doivent être lus avec prudence : l’effet d’un facteur dépend du niveau de l’autre (regardez les lignes du graphique : si elles ne sont pas parallèles, il y a interaction).' : ''}` });
    const par = (ps, tit) => ps.length && pasos.push({ t: `Comparaisons de « ${tit} » (${POST[post].replace(/ \(.*/, '')})`, html: `Chaque moyenne de « ${tit} » repose sur $${tit === nomA ? b * n : a * n}$ données et l’on utilise $CM_E$ avec $${glE}$ degrés de liberté.<br>Par exemple, ${ps[0].a} − ${ps[0].b} : $${ps[0].etq} = ${f(ps[0].est)}$, $p = ${ES.prob(ps[0].p)}$.` });
    par(paresA, nomA); par(paresB, nomB);
    return { modo: 'dos', A, B, n, a, b, N, nomA, nomB, M, mA, mB, mg, SSA, SSB, SSAB, SSE, SST, ef, inter, repl, glE, MSE, sh, lev, paresA, paresB, post, alfa, avisos, pasos, F: ef[0].F, pv: ef[0].p, rechaza: ef.some((e) => e.sig) };
  }

  function resolver(sc) {
    const alfa = lee(sc, 'alfa', 'le niveau de signification α', { min: 0, minEx: true, max: 0.5, maxEx: true });
    return sc.modo === 'dos' ? resolverDos(sc, alfa) : resolverUno(sc, alfa);
  }

  const ejemplos = [
    { clave: 'abonos', nombre: 'Trois engrais : production des plantes', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'tukey', contrastes: 'A contre la moyenne de B et C : 2 -1 -1', datos: 'A: 20 21 23 19 22\nB: 24 26 25 27 23\nC: 29 28 31 27 30' } },
    { clave: 'iguales', nombre: 'Sans différences : quatre machines', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'no', contrastes: '', datos: 'M1: 10,2 9,8 10,1 10,0\nM2: 10,1 10,3 9,9 10,2\nM3: 9,9 10,0 10,2 10,1\nM4: 10,0 10,1 9,8 10,3' } },
    { clave: 'dos', nombre: 'Deux groupes (équivaut au test t de deux moyennes)', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'no', contrastes: '', datos: '12 14 15 13 16\n18 17 19 20 16' } },
    { clave: 'varianzas', nombre: 'Variances très différentes : Welch et Games-Howell', sc: { modo: 'uno', alfa: '0,05', prueba: 'welch', post: 'gh', contrastes: '', datos: 'Rapide : 20 21 23 19 22\nMoyen : 24 26 25 27 23 30\nLent : 29 28 31 27 30 40 12' } },
    { clave: 'bonferroni', nombre: 'Trois régimes : Bonferroni, Holm et Scheffé', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'holm', contrastes: '', datos: 'Régime 1 : 8,2 7,9 9,1 8,6 8,0\nRégime 2 : 9,8 10,4 9,5 10,1\nRégime 3 : 8,9 9,2 8,4 9,6 9,0 8,7' } },
    { clave: 'dos-factores', nombre: 'Deux facteurs : engrais et arrosage, avec interaction', sc: { modo: 'dos', alfa: '0,05', post: 'tukey', nomA: 'Engrais', nomB: 'Arrosage', datos: 'A1 / Peu : 20 22 21\nA1 / Beaucoup : 25 27 26\nA2 / Peu : 24 23 25\nA2 / Beaucoup : 38 36 37\nA3 / Peu : 18 20 19\nA3 / Beaucoup : 21 22 20' } },
    { clave: 'sin-replicas', nombre: 'Deux facteurs sans répétitions (blocs)', sc: { modo: 'dos', alfa: '0,05', post: 'no', nomA: 'Traitement', nomB: 'Bloc', datos: 'T1 / B1: 12\nT1 / B2: 15\nT1 / B3: 11\nT2 / B1: 14\nT2 / B2: 18\nT2 / B3: 13\nT3 / B1: 19\nT3 / B2: 21\nT3 / B3: 18' } },
  ];
  return { resolver, ejemplos, POST, POST_DOS, MODOS, PRUEBA, grupos, casillas, parejas };
})();

