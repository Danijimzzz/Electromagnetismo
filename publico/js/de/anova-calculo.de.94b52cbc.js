const Anova = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const IN = typeof Inferencia !== 'undefined' ? Inferencia : require('../estadistica/inferencia.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista } = K, D = ES.DIST, suma = IN.suma;
  const MODOS = { uno: 'Un factor', dos: 'Zwei Faktoren (ausgewogener Versuchsplan)' };
  const POST = { no: 'No', tukey: 'Tukey (HSD)', bonferroni: 'Bonferroni', holm: 'Holm', scheffe: 'Scheffé', gh: 'Games-Howell (verschiedene Varianzen)' };
  const POST_DOS = ['no', 'tukey', 'bonferroni', 'holm', 'scheffe'];
  const PRUEBA = { f: 'Klassisches F (gleiche Varianzen)', welch: 'Welch-F (verschiedene Varianzen)' };
  const sumaTxt = (t) => (t.length > 4 ? [...t.slice(0, 2), '…', t[t.length - 1]] : t).join(' + ');
  const limpia = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tq = (nu, p) => ES.cuantil(D.t, { nu }, p), fq = (d1, d2, p) => ES.cuantil(D.f, { d1, d2 }, p);
  const pT2 = (nu, t) => Math.min(1, 2 * D.t.sf({ nu }, Math.abs(t)));

  function grupos(texto) {
    const g = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim();
      if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'), nom = j > 0 ? limpia(l.slice(0, j).trim()) : `Gruppe ${g.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `die Zeile ${i + 1}`);
      if (x.length < 1) throw new Error(`Die Zeile ${i + 1} hat keine Werte`);
      g.push({ nom, x });
    });
    if (g.length < 2) throw new Error('Schreibe mindestens zwei Gruppen, eine pro Zeile');
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
    if (g.some((q) => q.n < 2)) throw new Error('Games-Howell braucht mindestens zwei Werte in jeder Gruppe');
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      const vi = g[i].s2 / g[i].n, vj = g[j].s2 / g[j].n, se = Math.sqrt(vi + vj), dif = g[i].m - g[j].m, gl = (vi + vj) ** 2 / (vi ** 2 / (g[i].n - 1) + vj ** 2 / (g[j].n - 1));
      if (!(se > 0)) throw new Error('Games-Howell braucht, dass die Gruppen irgendeine Variation haben');
      const q = Math.abs(dif) / (se / Math.SQRT2), p = Math.max(0, 1 - IN.ptukey(q, k, gl)), c = IN.qtukey(1 - alfa, k, gl) * se / Math.SQRT2;
      filas.push({ a: g[i].nom, b: g[j].nom, dif, est: q, etq: 'q', p, lo: dif - c, hi: dif + c, gl, sig: p < alfa });
    }
    return filas;
  }

  function contrastes(texto, g, MSW, glW, alfa) {
    const out = [], k = g.length;
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim(); if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'), nom = j > 0 ? limpia(l.slice(0, j).trim()) : `Kontrast ${out.length + 1}`, c = lista(j > 0 ? l.slice(j + 1) : l, `der Kontrast der Zeile ${i + 1}`);
      if (c.length !== k) throw new Error(`Der Kontrast „${nom}“ hat ${c.length} Koeffizienten, und es gibt ${k} Gruppen`);
      const s = suma(c); if (Math.abs(s) > 1e-9 * Math.max(1, ...c.map(Math.abs))) throw new Error(`Die Koeffizienten des Kontrasts „${nom}“ summieren sich zu ${f(s)}: Sie müssen sich zu 0 summieren`);
      if (c.every((v) => v === 0)) throw new Error(`Der Kontrast „${nom}“ hat lauter Koeffizienten 0`);
      const psi = suma(c.map((v, q) => v * g[q].m)), ee = Math.sqrt(MSW * suma(c.map((v, q) => (v * v) / g[q].n))), t = psi / ee, p = pT2(glW, t), h = tq(glW, 1 - alfa / 2) * ee;
      out.push({ nom, c, psi, ee, t, p, lo: psi - h, hi: psi + h, sig: p < alfa });
    });
    return out;
  }

  function resolverUno(sc, alfa) {
    const g = grupos(sc.datos), k = g.length, N = suma(g.map((q) => q.x.length)), post = POST[sc.post] && sc.post !== 'no' ? sc.post : 'no', welchSel = sc.prueba === 'welch';
    if (N <= k) throw new Error('Es braucht eine Gruppe mit mehr als einem Wert, um die Variabilität innerhalb der Gruppen zu schätzen');
    for (const q of g) { q.n = q.x.length; q.m = suma(q.x) / q.n; q.ss = suma(q.x.map((v) => (v - q.m) ** 2)); q.s2 = q.n > 1 ? q.ss / (q.n - 1) : NaN; }
    const media = suma(g.map((q) => q.n * q.m)) / N;
    const SSB = suma(g.map((q) => q.n * (q.m - media) ** 2)), SSW = suma(g.map((q) => q.ss)), SST = SSB + SSW;
    const glB = k - 1, glW = N - k, MSB = SSB / glB, MSW = SSW / glW;
    if (!(MSW > 0)) throw new Error('Innerhalb aller Gruppen sind die Werte gleich (Varianz 0): F ist nicht definiert');
    const F = MSB / MSW, P = { d1: glB, d2: glW }, pvF = D.f.sf(P, F), critF = fq(glB, glW, 1 - alfa);
    const eta2 = SSB / SST, om2 = Math.max(0, (SSB - glB * MSW) / (SST + MSW)), fC = Math.sqrt(eta2 / (1 - eta2));
    const wel = IN.welch(g.map((q) => q.x)), sup = IN.supuestos(g.map((q) => q.x), alfa);
    if (welchSel && !wel) throw new Error('Das Welch-F braucht mindestens zwei Werte in jeder Gruppe und keine konstante Gruppe');
    const usaW = welchSel && wel, Fp = usaW ? wel.F : F, p = usaW ? wel.p : pvF, g1 = usaW ? wel.gl1 : glB, g2 = usaW ? wel.gl2 : glW, crit = usaW ? fq(g1, g2, 1 - alfa) : critF, rechaza = p < alfa;
    const tcrit = tq(glW, 1 - alfa / 2);
    for (const q of g) { const h = tcrit * Math.sqrt(MSW / q.n); q.lo = q.m - h; q.hi = q.m + h; q.s = Math.sqrt(q.s2); }
    const pares = post === 'gh' ? gamesHowell(g, alfa) : post !== 'no' ? parejas(g.map((q) => ({ nom: q.nom, m: q.m, r: q.n })), MSW, glW, post, alfa) : [];
    const contr = String(sc.contrastes ?? '').trim() ? contrastes(sc.contrastes, g, MSW, glW, alfa) : [];
    const avisos = [];
    if (sup.levene && isFinite(sup.levene.p) && sup.levene.p < alfa) avisos.push(`Levene verwirft, dass die Varianzen gleich sind (p = ${ES.prob(sup.levene.p)}): Das Welch-F und, für Paarvergleiche, Games-Howell sind angebracht.`);
    if (sup.shapiro && isFinite(sup.shapiro.p) && sup.shapiro.p < alfa) avisos.push(`Shapiro-Wilk verwirft die Normalität der Residuen (p = ${ES.prob(sup.shapiro.p)}): Sieh dir Kruskal-Wallis unter Nichtparametrische Tests an.`);
    if (k >= 2 && Math.max(...g.map((q) => q.n)) / Math.min(...g.map((q) => q.n)) > 1.5) avisos.push('Die Gruppen haben verschiedene Umfänge: Die ANOVA ist weniger robust gegenüber unterschiedlichen Varianzen.');
    const pasos = [];
    pasos.push({ t: 'Hypothesen', html: `$H_0$: $μ_1 = μ_2 = ⋯ = μ_{${k}}$ (alle Mittelwerte sind gleich), gegen $H_1$: Mindestens zwei Mittelwerte sind verschieden; mit $α = ${f(alfa)}$, $k = ${k}$ Gruppen und $N = ${N}$ Beobachtungen.` });
    pasos.push({ t: 'Mittelwerte', html: `${g.slice(0, 4).map((q, i) => `$x̄_{${i + 1}} = ${f(q.m)}$ ($n_{${i + 1}} = ${q.n}$)`).join(', ')}${k > 4 ? ', …' : ''}.<br>Gesamtmittelwert: $x̄ = {∑ n_i x̄_i}/N = ${f(media)}$.` });
    pasos.push({ t: 'Variabilität zwischen den Gruppen', html: `$SC_E = ∑ n_i (x̄_i − x̄)^2 = ${sumaTxt(g.map((q) => `${q.n}(${f(q.m)} − ${f(media)})^2`))} = ${f(SSB)}$<br>$CM_E = {SC_E}/{k − 1} = {${f(SSB)}}/{${glB}} = ${f(MSB)}$` });
    pasos.push({ t: 'Variabilität innerhalb der Gruppen', html: `$SC_D = ∑∑ (x_{ij} − x̄_i)^2 = ${sumaTxt(g.map((q) => f(q.ss)))} = ${f(SSW)}$<br>$CM_D = {SC_D}/{N − k} = {${f(SSW)}}/{${glW}} = ${f(MSW)}$` });
    pasos.push({ t: 'Teststatistik F', html: `$F = {CM_E}/{CM_D} = {${f(MSB)}}/{${f(MSW)}} = ${f(F)}$, das unter $H_0$ einer F-Verteilung mit $${glB}$ und $${glW}$ Freiheitsgraden folgt.<br>Probe: $SC_T = SC_E + SC_D = ${f(SSB)} + ${f(SSW)} = ${f(SST)}$.` });
    pasos.push({ t: 'Voraussetzungen', html: `Levene (mit dem Median): $W = ${f(sup.levene.W)}$, $p = ${ES.prob(sup.levene.p)}$ → ${sup.varianzasOk === false ? 'die Varianzen können <b>nicht</b> als gleich gelten' : 'es gibt keinen Hinweis, dass sich die Varianzen unterscheiden'}.<br>Shapiro-Wilk der Residuen $x_{ij} − x̄_i$: ${sup.shapiro && isFinite(sup.shapiro.W) ? `$W = ${f(sup.shapiro.W, 4)}$, $p = ${ES.prob(sup.shapiro.p)}$ → ${sup.normalidadOk === false ? 'die Normalität hält <b>nicht</b>' : 'es gibt keinen Hinweis gegen die Normalität'}` : 'nicht berechenbar (es braucht mindestens 3 nicht konstante Residuen)'}.${avisos.length ? `<br><b>Hinweis:</b> ${avisos.join(' ')}` : ''}` });
    if (usaW) pasos.push({ t: 'Welch-F', html: `Bei verschiedenen Varianzen wird jede Gruppe mit $w_i = n_i/s_i^2$ gewichtet (Welch, 1951): $F^* = ${f(wel.F)}$ mit $${f(wel.gl1)}$ und $${f(wel.gl2)}$ Freiheitsgraden (letztere näherungsweise); der kritische Wert ist $${f(crit)}$ und der p-Wert $${ES.prob(wel.p)}$.` });
    pasos.push({ t: 'Kritischer Bereich und p-Wert', html: `Der Test ist rechtsseitig: Der kritische Wert ist $F_{${f(g1)}, ${f(g2)}; ${f(1 - alfa)}} = ${f(crit)}$ und der p-Wert $P(F ≥ ${f(Fp)}) = ${ES.prob(p)}$${usaW ? '' : ` (zum Vergleich: Das Welch-F ergibt $${wel ? ES.prob(wel.p) : '—'}$)`}.` });
    pasos.push({ t: 'Effektstärke', html: `$η^2 = {SC_E}/{SC_T} = ${f(eta2, 3)}$: Der Faktor erklärt ${f(100 * eta2, 3)} % der Variabilität.<br>$ω^2 = {SC_E − (k − 1) CM_D}/{SC_T + CM_D} = ${f(om2, 3)}$ (weniger verzerrt als $η^2$ bei wenigen Daten); $f = √{η^2/(1 − η^2)} = ${f(fC, 3)}$ (Cohen: 0,10 klein, 0,25 mittel, 0,40 groß).` });
    pasos.push({ t: 'Schlussfolgerung', html: rechaza ? `<b>$H_0$ wird verworfen</b> auf dem Signifikanzniveau von ${f(100 * alfa)} %: Es gibt Unterschiede zwischen den Mittelwerten.` : `<b>$H_0$ wird nicht verworfen</b> auf dem Signifikanzniveau von ${f(100 * alfa)} %: Es gibt keinen Hinweis, dass die Mittelwerte verschieden sind.` });
    pasos.push({ t: 'Intervall jedes Mittelwerts', html: `Mit der gemeinsamen Varianz, $x̄_i ± t_{${glW}; ${f(1 - alfa / 2)}} √{CM_D/n_i}$, mit $t = ${f(tcrit)}$. Zum Beispiel Gruppe 1: $(${f(g[0].lo)}; ${f(g[0].hi)})$.` });
    if (pares.length) {
      const e = pares[0], m = pares.length;
      const txt = { bonferroni: `Für jedes Paar $t = {x̄_i − x̄_j}/√(CM_D (1/n_i + 1/n_j))$ mit $${glW}$ Freiheitsgraden, und der p-Wert wird mit der Zahl der Paare multipliziert, $m = k(k − 1)/2 = ${m}$ (Bonferroni).`,
        holm: `Für jedes Paar $t = {x̄_i − x̄_j}/√(CM_D (1/n_i + 1/n_j))$ mit $${glW}$ Freiheitsgraden. Die $m = ${m}$ p-Werte werden von klein nach groß geordnet, und der an Position $r$ wird mit $m − r + 1$ multipliziert (Holm), wobei er nicht unter den vorherigen sinken darf: Es ist stärker als Bonferroni bei gleicher Kontrolle des Gesamtfehlers.`,
        scheffe: `Für jedes Paar $F = {(x̄_i − x̄_j)^2}/{(k − 1) CM_D (1/n_i + 1/n_j)}$ mit $${glB}$ und $${glW}$ Freiheitsgraden (Scheffé): Es ist das konservativste, gilt aber für jeden Kontrast, nicht nur für Paare.`,
        tukey: `Für jedes Paar $q = {|x̄_i − x̄_j|}/√(CM_D/2 · (1/n_i + 1/n_j))$, das unter $H_0$ der studentisierten Spannweite mit $k = ${k}$ und $${glW}$ Freiheitsgraden folgt (Tukey-Kramer bei verschieden großen Gruppen). Es kontrolliert den Gesamtfehler <i>aller</i> Paare zugleich und ist der übliche Vergleich.`,
        gh: `Für jedes Paar $q = {|x̄_i − x̄_j|}/√{(s_i^2/n_i + s_j^2/n_j)/2}$ mit den Welch-Satterthwaite-Freiheitsgraden dieses Paares (Games-Howell): Es setzt keine gleichen Varianzen voraus.` }[post];
      pasos.push({ t: `Paarweise Vergleiche (${POST[post].replace(/ \(.*/, '')})`, html: `${txt}<br>Zum Beispiel ${e.a} − ${e.b}: $${e.etq} = ${f(e.est)}$, $p = ${ES.prob(e.p)}$.${rechaza ? '' : ' Da das F nicht signifikant ist, sind diese Vergleiche nur orientierend.'}` });
    }
    contr.forEach((c) => pasos.push({ t: `Kontrast: ${c.nom}`, html: `$ψ = ∑ c_i x̄_i = ${sumaTxt(c.c.map((v, q) => `(${f(v)})(${f(g[q].m)})`))} = ${f(c.psi)}$; $EE = √(CM_D ∑ c_i^2/n_i) = ${f(c.ee)}$; $t = ψ/EE = ${f(c.t)}$ mit $${glW}$ Freiheitsgraden; $p = ${ES.prob(c.p)}$; KI ${f(100 * (1 - alfa))} %: $(${f(c.lo)}; ${f(c.hi)})$. ${c.sig ? '<b>Signifikant</b>' : 'Nicht signifikant'}.` }));
    return { modo: 'uno', g, k, N, media, SSB, SSW, SST, glB, glW, MSB, MSW, F, pvF, Fp, p, pv: p, g1, g2, crit, critF, rechaza, alfa, eta2, om2, fC, wel, usaW, sup, pares, post, contr, avisos, pasos };
  }

  function casillas(texto) {
    const A = [], B = [], cel = new Map();
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim(); if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'); if (j < 1) throw new Error(`Die Zeile ${i + 1} muss „Stufe A / Stufe B: Werte“ sein`);
      const nombres = l.slice(0, j).split('/').map((s) => s.trim()); if (nombres.length !== 2 || !nombres[0] || !nombres[1]) throw new Error(`Die Zeile ${i + 1} muss eine Stufe jedes Faktors nennen, „Stufe A / Stufe B: Werte“`);
      const [a, b] = nombres.map(limpia), x = lista(l.slice(j + 1), `die Zeile ${i + 1}`); if (!x.length) throw new Error(`Die Zeile ${i + 1} hat keine Werte`);
      if (!A.includes(a)) A.push(a); if (!B.includes(b)) B.push(b);
      const key = `${a}\u0000${b}`; if (cel.has(key)) throw new Error(`Die Kombination „${a} / ${b}“ kommt zweimal vor: Schreibe sie in eine einzige Zeile`);
      cel.set(key, x);
    });
    if (A.length < 2 || B.length < 2) throw new Error('Jeder Faktor braucht mindestens zwei Stufen');
    let n = null;
    for (const a of A) for (const b of B) {
      const x = cel.get(`${a}\u0000${b}`); if (!x) throw new Error(`Die Kombination „${a} / ${b}“ fehlt: Der Versuchsplan muss ausgewogen sein (alle Kombinationen, mit gleich vielen Wiederholungen)`);
      if (n === null) n = x.length; else if (x.length !== n) throw new Error(`Die Felder haben verschieden viele Daten (${n} und ${x.length}): Der Versuchsplan muss ausgewogen sein`);
    }
    return { A, B, n, cel };
  }
  function resolverDos(sc, alfa) {
    const { A, B, n, cel } = casillas(sc.datos), a = A.length, b = B.length, N = a * b * n, nomA = limpia(String(sc.nomA || 'Faktor A').trim() || 'Faktor A'), nomB = limpia(String(sc.nomB || 'Faktor B').trim() || 'Faktor B');
    const post = POST_DOS.includes(sc.post) ? sc.post : 'no', M = A.map((u) => B.map((v) => { const x = cel.get(`${u}\u0000${v}`); return suma(x) / n; }));
    const mA = M.map((r) => suma(r) / b), mB = B.map((_, j) => suma(M.map((r) => r[j])) / a), mg = suma(mA) / a;
    const SSA = b * n * suma(mA.map((v) => (v - mg) ** 2)), SSB = a * n * suma(mB.map((v) => (v - mg) ** 2));
    let SSAB = 0, SSE = 0;
    A.forEach((u, i) => B.forEach((v, j) => { SSAB += n * (M[i][j] - mA[i] - mB[j] + mg) ** 2; SSE += suma(cel.get(`${u}\u0000${v}`).map((y) => (y - M[i][j]) ** 2)); }));
    const SST = SSA + SSB + SSAB + SSE, glA = a - 1, glB = b - 1, glAB = glA * glB;
    const repl = n > 1, glE = repl ? a * b * (n - 1) : glAB, SCe = repl ? SSE : SSAB, MSE = SCe / glE;
    if (!(MSE > 0)) throw new Error(repl ? 'Innerhalb aller Felder sind die Werte gleich (Varianz 0): F ist nicht definiert' : 'Ohne Wiederholungen dient die Wechselwirkung als Fehler und ist hier 0: F ist nicht definiert');
    const filasEf = [{ nom: nomA, SS: SSA, gl: glA }, { nom: nomB, SS: SSB, gl: glB }, ...(repl ? [{ nom: `${nomA} × ${nomB}`, SS: SSAB, gl: glAB }] : [])];
    for (const e of filasEf) { e.MS = e.SS / e.gl; e.F = e.MS / MSE; e.p = D.f.sf({ d1: e.gl, d2: glE }, e.F); e.crit = fq(e.gl, glE, 1 - alfa); e.eta2p = e.SS / (e.SS + SCe); e.om2p = Math.max(0, (e.gl * (e.F - 1)) / (e.gl * (e.F - 1) + N)); e.sig = e.p < alfa; }
    const todo = []; const res = [];
    A.forEach((u, i) => B.forEach((v, j) => { const x = cel.get(`${u}\u0000${v}`); todo.push(x); res.push(...x.map((y) => y - M[i][j])); }));
    const sh = repl && res.length >= 3 ? IN.shapiro(res) : null, lev = repl ? IN.levene(todo, 'mediana') : null;
    const margA = A.map((nm, i) => ({ nom: nm, m: mA[i], r: b * n })), margB = B.map((nm, j) => ({ nom: nm, m: mB[j], r: a * n }));
    const paresA = post !== 'no' ? parejas(margA, MSE, glE, post, alfa) : [], paresB = post !== 'no' ? parejas(margB, MSE, glE, post, alfa) : [];
    const avisos = [];
    if (!repl) avisos.push('Mit nur einem Wert pro Feld lässt sich die Wechselwirkung nicht vom Fehler trennen: Es wird keine Wechselwirkung angenommen und ihre Variabilität als Fehler verwendet.');
    if (lev && isFinite(lev.p) && lev.p < alfa) avisos.push(`Levene verwirft, dass die Varianzen der Felder gleich sind (p = ${ES.prob(lev.p)}): Die p-Werte sind orientierend.`);
    if (sh && isFinite(sh.p) && sh.p < alfa) avisos.push(`Shapiro-Wilk verwirft die Normalität der Residuen (p = ${ES.prob(sh.p)}).`);
    const ef = filasEf, inter = repl ? ef[2] : null;
    const pasos = [];
    pasos.push({ t: 'Modell und Hypothesen', html: `$x_{ijk} = μ + α_i + β_j + (αβ)_{ij} + ε_{ijk}$ mit $a = ${a}$ Stufen von „${nomA}“, $b = ${b}$ von „${nomB}“ und $n = ${n}$ Wiederholungen pro Feld ($N = ${N}$). Es werden drei Nullhypothesen getestet: Es gibt keinen Effekt von „${nomA}“, keinen Effekt von „${nomB}“${repl ? ' und keine Wechselwirkung' : ''}; $α = ${f(alfa)}$.` });
    pasos.push({ t: 'Mittelwerte', html: `Gesamtmittelwert $x̄ = ${f(mg)}$. Mittelwerte von „${nomA}“: ${A.map((nm, i) => `${nm} = ${f(mA[i])}`).join(', ')}. Mittelwerte von „${nomB}“: ${B.map((nm, j) => `${nm} = ${f(mB[j])}`).join(', ')}.` });
    pasos.push({ t: 'Quadratsummen', html: `$SC_A = b n ∑ (x̄_{i··} − x̄)^2 = ${f(SSA)}$; $SC_B = a n ∑ (x̄_{·j·} − x̄)^2 = ${f(SSB)}$; $SC_{AB} = n ∑∑ (x̄_{ij·} − x̄_{i··} − x̄_{·j·} + x̄)^2 = ${f(SSAB)}$${repl ? `; $SC_E = ∑∑∑ (x_{ijk} − x̄_{ij·})^2 = ${f(SSE)}$` : ''}.<br>Probe: $SC_T = ${f(SST)}$.` });
    pasos.push({ t: 'Mittlere Quadrate und F', html: `${ef.map((e) => `${e.nom}: $CM = ${f(e.SS)}/${e.gl} = ${f(e.MS)}$, $F = ${f(e.MS)}/${f(MSE)} = ${f(e.F)}$, $p = ${ES.prob(e.p)}$`).join('<br>')}<br>Der Fehler hat $${glE}$ Freiheitsgrade und $CM_E = ${f(MSE)}$.` });
    pasos.push({ t: 'Voraussetzungen', html: `${lev ? `Levene zwischen den Feldern: $W = ${f(lev.W)}$, $p = ${ES.prob(lev.p)}$.` : 'Mit einem Wert pro Feld lassen sich die Varianzen nicht prüfen.'}${sh && isFinite(sh.W) ? ` Shapiro-Wilk der Residuen: $W = ${f(sh.W, 4)}$, $p = ${ES.prob(sh.p)}$.` : ''}${avisos.length ? `<br><b>Hinweis:</b> ${avisos.join(' ')}` : ''}` });
    pasos.push({ t: 'Schlussfolgerung', html: `${ef.map((e) => `${e.nom}: ${e.sig ? '<b>signifikanter Effekt</b>' : 'kein signifikanter Effekt'} ($F = ${f(e.F)}$, $p = ${ES.prob(e.p)}$; $η^2_p = ${f(e.eta2p, 3)}$)`).join('<br>')}${inter && inter.sig ? '<br>Bei signifikanter Wechselwirkung sind die Haupteffekte mit Vorsicht zu lesen: Der Effekt eines Faktors hängt von der Stufe des anderen ab (sieh dir die Linien im Diagramm an: Sind sie nicht parallel, gibt es eine Wechselwirkung).' : ''}` });
    const par = (ps, tit) => ps.length && pasos.push({ t: `Vergleiche von „${tit}“ (${POST[post].replace(/ \(.*/, '')})`, html: `Jeder Mittelwert von „${tit}“ beruht auf $${tit === nomA ? b * n : a * n}$ Daten, und es wird $CM_E$ mit $${glE}$ Freiheitsgraden verwendet.<br>Zum Beispiel ${ps[0].a} − ${ps[0].b}: $${ps[0].etq} = ${f(ps[0].est)}$, $p = ${ES.prob(ps[0].p)}$.` });
    par(paresA, nomA); par(paresB, nomB);
    return { modo: 'dos', A, B, n, a, b, N, nomA, nomB, M, mA, mB, mg, SSA, SSB, SSAB, SSE, SST, ef, inter, repl, glE, MSE, sh, lev, paresA, paresB, post, alfa, avisos, pasos, F: ef[0].F, pv: ef[0].p, rechaza: ef.some((e) => e.sig) };
  }

  function resolver(sc) {
    const alfa = lee(sc, 'alfa', 'das Signifikanzniveau α', { min: 0, minEx: true, max: 0.5, maxEx: true });
    return sc.modo === 'dos' ? resolverDos(sc, alfa) : resolverUno(sc, alfa);
  }

  const ejemplos = [
    { clave: 'abonos', nombre: 'Drei Düngemittel: Ertrag der Pflanzen', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'tukey', contrastes: 'A gegen den Mittelwert von B und C: 2 -1 -1', datos: 'A: 20 21 23 19 22\nB: 24 26 25 27 23\nC: 29 28 31 27 30' } },
    { clave: 'iguales', nombre: 'Ohne Unterschiede: vier Maschinen', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'no', contrastes: '', datos: 'M1: 10,2 9,8 10,1 10,0\nM2: 10,1 10,3 9,9 10,2\nM3: 9,9 10,0 10,2 10,1\nM4: 10,0 10,1 9,8 10,3' } },
    { clave: 'dos', nombre: 'Zwei Gruppen (entspricht dem t-Test für zwei Mittelwerte)', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'no', contrastes: '', datos: '12 14 15 13 16\n18 17 19 20 16' } },
    { clave: 'varianzas', nombre: 'Sehr verschiedene Varianzen: Welch und Games-Howell', sc: { modo: 'uno', alfa: '0,05', prueba: 'welch', post: 'gh', contrastes: '', datos: 'Schnell: 20 21 23 19 22\nMittel: 24 26 25 27 23 30\nLangsam: 29 28 31 27 30 40 12' } },
    { clave: 'bonferroni', nombre: 'Drei Diäten: Bonferroni, Holm und Scheffé', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'holm', contrastes: '', datos: 'Diät 1: 8,2 7,9 9,1 8,6 8,0\nDiät 2: 9,8 10,4 9,5 10,1\nDiät 3: 8,9 9,2 8,4 9,6 9,0 8,7' } },
    { clave: 'dos-factores', nombre: 'Zwei Faktoren: Dünger und Bewässerung, mit Wechselwirkung', sc: { modo: 'dos', alfa: '0,05', post: 'tukey', nomA: 'Dünger', nomB: 'Bewässerung', datos: 'A1 / Wenig: 20 22 21\nA1 / Viel: 25 27 26\nA2 / Wenig: 24 23 25\nA2 / Viel: 38 36 37\nA3 / Wenig: 18 20 19\nA3 / Viel: 21 22 20' } },
    { clave: 'sin-replicas', nombre: 'Zwei Faktoren ohne Wiederholungen (Blöcke)', sc: { modo: 'dos', alfa: '0,05', post: 'no', nomA: 'Behandlung', nomB: 'Block', datos: 'T1 / B1: 12\nT1 / B2: 15\nT1 / B3: 11\nT2 / B1: 14\nT2 / B2: 18\nT2 / B3: 13\nT3 / B1: 19\nT3 / B2: 21\nT3 / B3: 18' } },
  ];
  return { resolver, ejemplos, POST, POST_DOS, MODOS, PRUEBA, grupos, casillas, parejas };
})();

