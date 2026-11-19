const NoParametricos = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const IN = typeof Inferencia !== 'undefined' ? Inferencia : require('../estadistica/inferencia.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista, filas } = K, N01 = { mu: 0, sigma: 1 };
  const suma = (v) => v.reduce((a, b) => a + b, 0);
  const TIPOS = { mw: 'Mann-Whitney-U (zwei unabhängige Stichproben)', pares: 'Wilcoxon für gepaarte Daten', mediana: 'Wilcoxon für den Median einer Stichprobe', kw: 'Kruskal-Wallis (drei oder mehr Gruppen) mit Dunn', signos: 'Vorzeichentest (gepaarte Daten)', signosmed: 'Vorzeichentest für den Median', correlacion: 'Spearman und Kendall (Rangkorrelation)' };
  const POST = { no: 'No', holm: 'Dunn mit Holm', bonferroni: 'Dunn mit Bonferroni' };
  const H1 = { dos: 'Verschieden (zweiseitig)', mayor: 'Die erste ist größer (einseitig)', menor: 'Die erste ist kleiner (einseitig)' };
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
  const alfaDe = (sc) => lee(sc, 'alfa', 'das Signifikanzniveau α', { min: 0, minEx: true, max: 0.5, maxEx: true });

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
    if (n1 < 1 || n2 < 1) throw new Error('Schreibe Daten in die beiden Stichproben');
    const todos = [...x, ...y], { r, t, corr } = rangos(todos);
    const R1 = suma(r.slice(0, n1)), R2 = suma(r.slice(n1)), U1 = R1 - (n1 * (n1 + 1)) / 2, U2 = n1 * n2 - U1, mu = (n1 * n2) / 2;
    const exacto = sc.exacto !== 'no' && !t.length && n1 <= 20 && n2 <= 20, cc = sc.cc !== 'no';
    let p, z = null, sigma = null;
    if (exacto) {
      const cs = new Map([...cuentaSumas(N, n1)].map(([s, q]) => [s - (n1 * (n1 + 1)) / 2, q])), c = colas(cs, U1);
      p = pvalor(h1, c.le, c.ge);
    } else {
      sigma = Math.sqrt(((n1 * n2) / 12) * (N + 1 - corr / (N * (N - 1))));
      if (!(sigma > 0)) throw new Error('Alle Daten sind gleich: Der Test lässt sich nicht durchführen');
      ({ z, p } = pnormal(h1, U1 - mu, sigma, cc));
    }
    const orden = todos.map((v, i) => ({ v, g: i < n1 ? 1 : 2, r: r[i] })).sort((a, b) => a.v - b.v || a.g - b.g);
    const pasos = [];
    pasos.push({ t: 'Hypothesen', html: `$H_0$: Die beiden Grundgesamtheiten sind gleich (keine tendiert zu größeren Werten), gegen $H_1$: ${{ dos: 'die Verteilung der Stichprobe 1 ist gegenüber der 2 verschoben', mayor: 'die Stichprobe 1 tendiert zu größeren Werten als die 2', menor: 'die Stichprobe 1 tendiert zu kleineren Werten als die 2' }[h1]}; mit $α = ${f(alfa)}$, $n_1 = ${n1}$ und $n_2 = ${n2}$.` });
    pasos.push({ t: 'Ränge', html: `Die ${N} Daten werden gemeinsam geordnet und erhalten ihren Rang (1 dem kleinsten${t.length ? '; bei Bindungen der Mittelwert der belegten Ränge' : ''}). Summiert man die jeder Stichprobe: $R_1 = ${sumaTxt(r.slice(0, n1).map((v) => f(v)))} = ${f(R1)}$ und $R_2 = ${f(R2)}$ (Probe: $R_1 + R_2 = N(N + 1)/2 = ${f(R1 + R2)}$).` });
    pasos.push({ t: 'U-Statistik', html: `$U_1 = R_1 − {n_1(n_1 + 1)}/2 = ${f(R1)} − ${f((n1 * (n1 + 1)) / 2)} = ${f(U1)}$ und $U_2 = n_1 n_2 − U_1 = ${f(U2)}$. Stimmt $H_0$, liegt $U_1$ um $n_1 n_2/2 = ${f(mu)}$.` });
    if (exacto) pasos.push({ t: 'p-valor exacto', html: `Es gibt keine Bindungen, und die Stichproben sind klein: Gezählt werden die $\\binom{${N}}{${n1}}$ Möglichkeiten, die Ränge auf die beiden Stichproben zu verteilen. ${h1 === 'mayor' ? `$p = P(U_1 ≥ ${f(U1)}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(U_1 ≤ ${f(U1)}) = ${ES.prob(p)}$` : `$p = 2 · P(\\text{kleinerer Rand}) = ${ES.prob(p)}$`}.` });
    else pasos.push({ t: 'Normalnäherung', html: `Unter $H_0$ ist $U_1$ nahezu normalverteilt mit Erwartungswert $${f(mu)}$ und $σ = √({n_1 n_2}/12 · (N + 1${t.length ? ' − {∑ (t^3 − t)}/{N(N − 1)}' : ''})) = ${f(sigma)}$${t.length ? ' (mit Bindungskorrektur)' : ''}.<br>$z = {U_1 − μ${cc ? ' ∓ 0,5' : ''}}/σ = ${f(z)}$ y $p = ${ES.prob(p)}$.` });
    const zEf = (U1 - mu) / Math.sqrt(((n1 * n2) / 12) * (N + 1 - corr / (N * (N - 1)))), rEf = Math.abs(zEf) / Math.sqrt(N), psup = U1 / (n1 * n2);
    const difs = []; for (const a of x) for (const b of y) difs.push(a - b);
    const M = n1 * n2, hl = hodges(difs, M, mu, Math.sqrt(((n1 * n2) / 12) * (N + 1)), exacto, exacto ? new Map([...cuentaSumas(N, n1)].map(([q, c]) => [q - (n1 * (n1 + 1)) / 2, c])) : null, alfa);
    pasos.push({ t: 'Effektstärke', html: `Überlegenheitswahrscheinlichkeit: $P(X > Y) + ½ P(X = Y) = U_1/(n_1 n_2) = ${f(U1)}/${f(n1 * n2)} = ${f(psup)}$ (0,5 = kein Unterschied). Biseriale Rangkorrelation: $r_b = 2 U_1/(n_1 n_2) − 1 = ${f(2 * psup - 1)}$. Effektstärke $r = |z|/√N = ${f(rEf)}$ (0,1 klein, 0,3 mittel, 0,5 groß).` });
    pasos.push({ t: 'Hodges-Lehmann-Schätzer', html: `Der typische Unterschied zwischen den beiden Stichproben ist der Median der $n_1 n_2 = ${M}$ Differenzen $x_i − y_j$: <b>${f(hl.est)}</b>${isFinite(hl.lo) ? `, mit einem ${nivel(alfa)}-%-Konfidenzintervall von $(${f(hl.lo)}; ${f(hl.hi)})$ (${exacto ? 'exakt' : 'nach der Normalnäherung'}, wobei die geordneten Differenzen genommen werden, die auf jeder Seite $α/2$ übrig lassen)` : ''}.` });
    pasos.push({ t: 'Schlussfolgerung', html: p < alfa ? `<b>$H_0$ wird verworfen</b> auf dem Signifikanzniveau von ${f(100 * alfa)} %: Es gibt Unterschiede zwischen den beiden Stichproben.` : `<b>$H_0$ wird nicht verworfen</b> auf dem Signifikanzniveau von ${f(100 * alfa)} %: Es gibt keinen Hinweis auf Unterschiede zwischen den beiden Stichproben.` });
    return { tipo: 'mw', h1, x, y, n1, n2, R1, R2, U1, U2, mu, z, sigma, p, exacto, rEf, psup, hl, zEf, empates: t.length > 0, orden, rechaza: p < alfa, alfa, pasos, est: U1 };
  }

  function wilcoxon(sc, alfa, pares) {
    const h1 = H1[sc.h1] ? sc.h1 : 'dos';
    let ds, filasT;
    if (pares) {
      filasT = filas(sc.datos, 2, 'die gepaarten Daten');
      if (!filasT.length) throw new Error('Die Tabelle der Paare „vorher nachher“ fehlt');
      ds = filasT.map(([a, b]) => ({ a, b, d: a - b }));
    } else {
      const x = lista(sc.datos, 'la muestra'), m0 = lee(sc, 'm0', 'der Median von H₀');
      if (!x.length) throw new Error('Die Stichprobe fehlt');
      ds = x.map((a) => ({ a, b: m0, d: a - m0 })); filasT = null;
    }
    const nTotal = ds.length, nz = ds.filter((q) => q.d !== 0), n = nz.length;
    if (n < 1) throw new Error('Alle Differenzen sind 0: Der Test lässt sich nicht durchführen');
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
    pasos.push({ t: 'Hypothesen', html: pares
      ? `$H_0$: Der Median der Differenzen ist 0 (es gibt keine Änderung zwischen den beiden Messungen), gegen $H_1$: ${{ dos: 'er ist ungleich 0', mayor: 'die erste Messung tendiert zu größeren Werten', menor: 'die erste Messung tendiert zu kleineren Werten' }[h1]}; mit $α = ${f(alfa)}$ und ${nTotal} Paaren.`
      : `$H_0$: Der Median ist $m_0 = ${f(ds[0].b)}$, gegen $H_1$: ${{ dos: 'er ist verschieden', mayor: 'er ist größer', menor: 'er ist kleiner' }[h1]}; mit $α = ${f(alfa)}$ und ${nTotal} Daten.` });
    pasos.push({ t: 'Differenzen', html: `Berechnet wird $${dif}$${nz.length < nTotal ? ` und die ${nTotal - n} mit dem Wert 0 werden verworfen, sodass $n = ${n}$ bleibt` : `, mit $n = ${n}$`}. Die $|d_i|$ werden geordnet und erhalten ihren Rang${t.length ? ' (bei Bindungen der Mittelwert der belegten Ränge)' : ''}.` });
    pasos.push({ t: 'Rangsumme', html: `$W^+ = ${sumaTxt(nz.filter((q) => q.d > 0).map((q) => f(q.r)))} = ${f(Wp)}$ (positive Differenzen) und $W^− = ${f(Wm)}$ (negative); Probe: $W^+ + W^− = n(n + 1)/2 = ${f(Wp + Wm)}$. Unter $H_0$ liegt $W^+$ um $n(n + 1)/4 = ${f(mu)}$.` });
    if (exacto) pasos.push({ t: 'p-valor exacto', html: `Ohne Bindungen und mit $n ≤ 25$ ist $W^+$ die Summe einer beliebigen Teilmenge von $\\{1, …, ${n}\\}$ (die $2^{${n}}$ Vorzeichenverteilungen sind gleich wahrscheinlich). ${h1 === 'mayor' ? `$p = P(W^+ ≥ ${f(Wp)}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(W^+ ≤ ${f(Wp)}) = ${ES.prob(p)}$` : `$p = 2 · P(\\text{kleinerer Rand}) = ${ES.prob(p)}$`}.` });
    else pasos.push({ t: 'Normalnäherung', html: `$W^+$ ist nahezu normalverteilt mit Erwartungswert $${f(mu)}$ und $σ = √({n(n + 1)(2n + 1)}/24${t.length ? ' − {∑ (t^3 − t)}/48' : ''}) = ${f(sigma)}$.<br>$z = {W^+ − μ${cc ? ' ∓ 0,5' : ''}}/σ = ${f(z)}$ y $p = ${ES.prob(p)}$.` });
    const sg = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - corr / 48), zEf = (Wp - mu) / sg, rEf = Math.abs(zEf) / Math.sqrt(n), rb = (Wp - Wm) / (Wp + Wm);
    const walsh = []; for (let i = 0; i < n; i++) for (let j = i; j < n; j++) walsh.push((nz[i].d + nz[j].d) / 2);
    let cw = null; if (exacto) { cw = new Map([[0, 1]]); for (let v = 1; v <= n; v++) { const nu = new Map(cw); for (const [q, c] of cw) nu.set(q + v, (nu.get(q + v) || 0) + c); cw = nu; } }
    const hl = hodges(walsh, (n * (n + 1)) / 2, mu, sg, exacto, cw, alfa);
    pasos.push({ t: 'Effektstärke', html: `Biseriale Rangkorrelation: $r_b = (W^+ − W^−)/(W^+ + W^−) = ${f(rb)}$ (von −1 bis 1; 0 = kein Effekt). Effektstärke $r = |z|/√n = ${f(rEf)}$ (0,1 klein, 0,3 mittel, 0,5 groß).` });
    pasos.push({ t: 'Hodges-Lehmann-Schätzer', html: `Die typische Verschiebung ist der Median der $n(n + 1)/2$ Walsh-Mittelwerte $(d_i + d_j)/2$: <b>${f(hl.est)}</b>${isFinite(hl.lo) ? `, mit einem ${nivel(alfa)}-%-Konfidenzintervall von $(${f(hl.lo)}; ${f(hl.hi)})$ (${exacto ? 'exakt' : 'nach der Normalnäherung'})` : ''}.` });
    pasos.push({ t: 'Schlussfolgerung', html: p < alfa ? `<b>$H_0$ wird verworfen</b> auf dem Signifikanzniveau von ${f(100 * alfa)} %.` : `<b>$H_0$ wird nicht verworfen</b> auf dem Signifikanzniveau von ${f(100 * alfa)} %: Es gibt keinen ausreichenden Hinweis.` });
    return { tipo: pares ? 'pares' : 'mediana', h1, ds, nz, nTotal, n, Wp, Wm, mu, z, sigma, p, exacto, rEf, rb, hl, zEf, empates: t.length > 0, rechaza: p < alfa, alfa, pasos, est: Wp };
  }


  function kruskal(sc, alfa) {
    const g = []; String(sc.datos ?? '').split(/\r?\n/).forEach((lin, i) => { const l = lin.trim(); if (!l || l.startsWith('#')) return; const j = l.indexOf(':'), nom = j > 0 ? l.slice(0, j).trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : `Gruppe ${g.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `die Zeile ${i + 1}`); if (!x.length) throw new Error(`Die Zeile ${i + 1} hat keine Werte`); g.push({ nom, x, n: x.length }); });
    if (g.length < 2) throw new Error('Schreibe mindestens zwei Gruppen, eine pro Zeile');
    const k = g.length, todos = g.flatMap((q) => q.x), N = todos.length, { r, t, corr } = rangos(todos);
    if (corr >= N * N * N - N) throw new Error('Alle Daten sind gleich: Der Test lässt sich nicht durchführen');
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
      { t: 'Hypothesen', html: `$H_0$: Die ${k} Gruppen stammen aus derselben Verteilung (keine tendiert zu größeren Werten), gegen $H_1$: Eine tendiert zu anderen Werten; $α = ${f(alfa)}$, $N = ${N}$ Daten.` },
      { t: 'Ränge', html: `Die ${N} Daten werden gemeinsam geordnet und erhalten ihren Rang (1 dem kleinsten${t.length ? '; bei Bindungen der Mittelwert der belegten Ränge' : ''}). Rangsummen: ${g.slice(0, 6).map((q, i) => `$R_{${i + 1}} = ${f(q.R)}$ ($n_{${i + 1}} = ${q.n}$)`).join(', ')}${k > 6 ? ', …' : ''}. Probe: $∑ R_i = N(N + 1)/2 = ${f(suma(g.map((q) => q.R)))}$.` },
      { t: 'Teststatistik H', html: `$H = {12}/{N(N + 1)} ∑ {R_i^2}/{n_i} − 3(N + 1) = ${f(Hs)}$${t.length ? `; mit der Bindungskorrektur $C = 1 − {∑ (t^3 − t)}/{N^3 − N} = ${f(C, 5)}$ ergibt sich $H = ${f(H)}$` : ''}. Unter $H_0$ folgt sie (näherungsweise) einer $χ^2$-Verteilung mit $k − 1 = ${gl}$ Freiheitsgraden${g.some((q) => q.n < 5) ? '; bei Gruppen mit weniger als 5 Daten ist die Näherung ungenau' : ''}.` },
      { t: 'Kritischer Bereich und p-Wert', html: `Der kritische Wert ist $χ^2_{${gl}; ${f(1 - alfa)}} = ${f(crit)}$ und der p-Wert $P(χ^2_{${gl}} ≥ ${f(H)}) = ${ES.prob(p)}$.` },
      { t: 'Effektstärke', html: `$ε^2 = H/(N − 1) = ${f(eps2, 3)}$: der Anteil der Variabilität der Ränge, den die Gruppen erklären (0,01 klein, 0,08 mittel, 0,26 groß).` },
      { t: 'Schlussfolgerung', html: p < alfa ? `<b>$H_0$ wird verworfen</b> auf dem Signifikanzniveau von ${f(100 * alfa)} %: Eine Gruppe unterscheidet sich von den anderen.` : `<b>$H_0$ wird nicht verworfen</b> auf dem Signifikanzniveau von ${f(100 * alfa)} %: Es gibt keinen Hinweis, dass sich die Gruppen unterscheiden.` },
    ];
    if (pares.length) pasos.push({ t: `Dunn-Vergleiche (${post === 'holm' ? 'Holm' : 'Bonferroni'})`, html: `Für jedes Paar $z = {R̄_i − R̄_j}/√({N(N + 1)}/12 · (1/n_i + 1/n_j))$${t.length ? ' (mit Bindungskorrektur)' : ''}, und der p-Wert wird um die $m = ${pares.length}$ Vergleiche angepasst (${post === 'holm' ? 'Holm: stärker' : 'Bonferroni: mit m multipliziert'}). Zum Beispiel ${pares[0].a} − ${pares[0].b}: $z = ${f(pares[0].z)}$, $p = ${ES.prob(pares[0].p)}$.${p < alfa ? '' : ' Da H nicht signifikant ist, sind diese Vergleiche nur orientierend.'}` });
    return { tipo: 'kw', g, k, N, H, Hs, C, gl, p, crit, eps2, pares, post, rechaza: p < alfa, alfa, pasos, est: H };
  }

  function signos(sc, alfa, pares) {
    const h1 = H1[sc.h1] ? sc.h1 : 'dos';
    let ds; if (pares) { const ft = filas(sc.datos, 2, 'die gepaarten Daten'); if (!ft.length) throw new Error('Die Tabelle der Paare „vorher nachher“ fehlt'); ds = ft.map(([a, b]) => ({ a, b, d: a - b })); } else { const x = lista(sc.datos, 'la muestra'), m0 = lee(sc, 'm0', 'der Median von H₀'); if (!x.length) throw new Error('Die Stichprobe fehlt'); ds = x.map((a) => ({ a, b: m0, d: a - m0 })); }
    const mas = ds.filter((q) => q.d > 0).length, menos = ds.filter((q) => q.d < 0).length, n = mas + menos, ceros = ds.length - n;
    if (n < 1) throw new Error('Alle Differenzen sind 0: Der Test lässt sich nicht durchführen');
    const pb = (k) => { let s = 0, c = 1; for (let i = 0; i <= k; i++) { s += c; c = (c * (n - i)) / (i + 1); } return Math.min(1, s / 2 ** n); };
    const le = pb(mas), ge = pb(menos);   // P(X ≤ n⁺) y P(X ≥ n⁺) = P(X ≤ n⁻)
    const p = pvalor(h1, le, ge), mu = n / 2, z = (mas - mu) / Math.sqrt(n / 4);
    const pasos = [
      { t: 'Hypothesen', html: pares ? `$H_0$: Der Median der Differenzen ist 0, das heißt, jede Differenz ist mit Wahrscheinlichkeit $1/2$ positiv oder negativ; gegen $H_1$: ${{ dos: 'no', mayor: 'die erste Messung tendiert zu größeren Werten', menor: 'die erste Messung tendiert zu kleineren Werten' }[h1] === 'no' ? 'die Wahrscheinlichkeiten sind nicht gleich' : { mayor: 'die erste Messung tendiert zu größeren Werten', menor: 'die erste Messung tendiert zu kleineren Werten' }[h1]}; $α = ${f(alfa)}$.` : `$H_0$: Der Median ist $m_0 = ${f(ds[0].b)}$ (jeder Wert liegt mit Wahrscheinlichkeit $1/2$ darüber oder darunter), gegen $H_1$: ${{ dos: 'er ist verschieden', mayor: 'er ist größer', menor: 'er ist kleiner' }[h1]}; $α = ${f(alfa)}$.` },
      { t: 'Vorzeichen', html: `Es werden die Vorzeichen der $d_i$ gezählt (die $0$ werden verworfen${ceros ? `: ${ceros}` : ''}): $n^+ = ${mas}$ positive und $n^− = ${menos}$ negative, $n = ${n}$.` },
      { t: 'p-valor exacto', html: `Stimmt $H_0$, ist $n^+$ binomialverteilt $B(${n}, 1/2)$. ${h1 === 'mayor' ? `$p = P(X ≥ ${mas}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(X ≤ ${mas}) = ${ES.prob(p)}$` : `$p = 2 · P(X ≤ ${Math.min(mas, menos)}) = ${ES.prob(p)}$ (auf 1 begrenzt)`}. Normalnäherung zum Vergleich: $z = (n^+ − n/2)/√(n/4) = ${f(z)}$.` },
      { t: 'Schlussfolgerung', html: p < alfa ? `<b>$H_0$ wird verworfen</b> auf dem Signifikanzniveau von ${f(100 * alfa)} %.` : `<b>$H_0$ wird nicht verworfen</b> auf dem Signifikanzniveau von ${f(100 * alfa)} %: Es gibt keinen ausreichenden Hinweis. Der Vorzeichentest verwendet nur das Vorzeichen und ist deshalb der schwächste der Rangtests.` },
    ];
    return { tipo: pares ? 'signos' : 'signosmed', h1, ds, mas, menos, n, ceros, p, z, rechaza: p < alfa, alfa, pasos, est: mas };
  }

  function correlacion(sc, alfa) {
    const ft = filas(sc.datos, 2, 'los datos'); if (ft.length < 3) throw new Error('Es braucht mindestens 3 Paare „x y“');
    const x = ft.map((q) => q[0]), y = ft.map((q) => q[1]), n = ft.length, h1 = H1[sc.h1] ? sc.h1 : 'dos';
    const sp = IN.spearman(x, y), ke = IN.kendall(x, y);
    if (!isFinite(sp.rho) || !isFinite(ke.tau)) throw new Error('Eine der beiden Variablen ist konstant (oder hat nur einen Wert): Es gibt keine Korrelation zu testen');
    const un = (est, p2) => (h1 === 'dos' ? p2 : (h1 === 'mayor' ? est > 0 : est < 0) ? p2 / 2 : 1 - p2 / 2), pS = un(sp.rho, sp.p), pK = un(ke.tau, ke.p);
    const rx = IN.rangosDe(x).r, ry = IN.rangosDe(y).r;
    const pasos = [
      { t: 'Hypothesen', html: `$H_0$: Es gibt keinen monotonen Zusammenhang zwischen den beiden Variablen ($ρ_s = 0$, $τ = 0$), gegen $H_1$: ${{ dos: 'es gibt ihn', mayor: 'der Zusammenhang ist positiv', menor: 'der Zusammenhang ist negativ' }[h1]}; $α = ${f(alfa)}$, $n = ${n}$.` },
      { t: 'Ränge', html: `Jede Variable wird durch ihre Ränge ersetzt (${n} Paare; bei Bindungen der Mittelwert der Ränge).` },
      { t: 'Spearman', html: `$ρ_s$ ist die Pearson-Korrelation der Ränge: $ρ_s = ${f(sp.rho, 5)}$. Test: $t = ρ_s √{(n − 2)/(1 − ρ_s^2)} = ${f(sp.t)}$ mit $${n - 2}$ Freiheitsgraden, $p = ${ES.prob(pS)}$.${n < 10 ? ' Bei weniger als 10 Paaren ist diese Näherung ungenau.' : ''}` },
      { t: 'Kendall', html: `Gezählt werden die konkordanten Paare $C = ${ke.C}$ und diskordanten $D = ${ke.D}$ (zwischen je zwei Punkten, ob $x$ und $y$ gemeinsam wachsen oder nicht): $τ_b = {C − D}/√{(n_0 − n_1)(n_0 − n_2)} = ${f(ke.tau, 5)}$ (bei Bindungen wird korrigiert; ohne sie $τ = (C − D)/(n(n − 1)/2)$). ${ke.exacto ? `Ohne Bindungen und mit $n ≤ 40$ ist der p-Wert exakt (die Permutationen werden nach ihrer Inversionszahl gezählt): $p = ${ES.prob(pK)}$.` : `Mit der Normalnäherung (mit der um Bindungen korrigierten Varianz): $z = ${f(ke.z)}$, $p = ${ES.prob(pK)}$.`}` },
      { t: 'Schlussfolgerung', html: `${pS < alfa ? '<b>$H_0$ wird mit Spearman verworfen</b>' : '<b>$H_0$ wird mit Spearman nicht verworfen</b>'} und ${pK < alfa ? '<b>mit Kendall verworfen</b>' : '<b>mit Kendall nicht verworfen</b>'} auf dem ${f(100 * alfa)}-%-Niveau. Kendall ist bei wenigen Daten und vielen Bindungen zuverlässiger; Spearman ähnelt eher dem Pearson-Koeffizienten.` },
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
    { clave: 'metodos', nombre: 'Mann-Whitney: zwei Lernmethoden (exakt)', sc: { tipo: 'mw', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', datos1: '14 17 16 19 22', datos2: '10 12 15 11 13 9' } },
    { clave: 'empates', nombre: 'Mann-Whitney mit Bindungen (Normalnäherung)', sc: { tipo: 'mw', h1: 'mayor', alfa: '0,05', exacto: 'si', cc: 'si', datos1: '3 4 4 5 5 5 6 7', datos2: '2 3 3 4 4 5 5 6' } },
    { clave: 'dieta', nombre: 'Gepaarter Wilcoxon: Gewicht vor und nach einer Diät', sc: { tipo: 'pares', h1: 'mayor', alfa: '0,05', exacto: 'si', cc: 'si', datos: '82 78\n91 85\n77 75\n88 89\n95 88\n79 79\n84 76\n90 79' } },
    { clave: 'mediana', nombre: 'Wilcoxon für den Median: Ist er 50?', sc: { tipo: 'mediana', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', m0: '50', datos: '54 61 48 58 66 53 63 57 49 60' } },
    { clave: 'kruskal', nombre: 'Kruskal-Wallis und Dunn: drei Lernmethoden', sc: { tipo: 'kw', alfa: '0,05', post: 'holm', datos: 'Methode A: 14 17 16 19 22\nMethode B: 10 12 15 11 13 9\nMethode C: 20 24 21 26 23 25' } },
    { clave: 'kruskal-empates', nombre: 'Kruskal-Wallis mit Bindungen', sc: { tipo: 'kw', alfa: '0,05', post: 'bonferroni', datos: 'Leicht: 3 4 4 5 5\nMittel: 4 5 6 6 7 7\nSchwer: 6 7 7 8 9 9 9' } },
    { clave: 'signos', nombre: 'Vorzeichentest: vorher und nachher', sc: { tipo: 'signos', h1: 'mayor', alfa: '0,05', datos: '82 78\n91 85\n77 75\n88 89\n95 88\n79 79\n84 76\n90 79' } },
    { clave: 'signos-mediana', nombre: 'Vorzeichentest für den Median', sc: { tipo: 'signosmed', h1: 'dos', alfa: '0,05', m0: '50', datos: '54 61 48 58 66 53 63 57 49 60' } },
    { clave: 'correlacion', nombre: 'Spearman und Kendall: Noten zweier Prüfungen', sc: { tipo: 'correlacion', h1: 'dos', alfa: '0,05', datos: '1 2\n2 1\n3 4\n4 3\n5 7\n6 8\n7 5\n8 6' } },
    { clave: 'correlacion-empates', nombre: 'Kendall mit Bindungen', sc: { tipo: 'correlacion', h1: 'dos', alfa: '0,05', datos: '1 1\n2 3\n2 2\n3 2\n4 5\n4 6\n5 6' } },
  ];
  return { resolver, ejemplos, TIPOS, H1, POST, rangos };
})();

