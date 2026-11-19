const Chi2Bondad = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista, filas } = K, D = ES.DIST;
  const MODOS = { bondad: 'Anpassungstest', independencia: 'Unabhängigkeit oder Homogenität (Kontingenztafel)', fisher: 'Exakter Fisher-Test (2 × 2-Tafel mit wenigen Daten)', mcnemar: 'McNemar (gepaarte 2 × 2-Daten)' };
  const H1 = { distinto: 'Zweiseitig: Die Anteile unterscheiden sich', mayor: 'Einseitig: Odds-Ratio > 1', menor: 'Einseitig: Odds-Ratio < 1' };
  const MODELOS = { uniforme: 'Gleichverteilung (alle Klassen gleich wahrscheinlich)', dadas: 'Gegebene Anteile', binomial: 'Binomialverteilung B(n, p)', poisson: 'Poisson-Verteilung P(λ)', normal: 'Normalverteilung N(μ, σ) nach Intervallen' };
  const COLUMNAS = { uniforme: 1, dadas: 2, binomial: 2, poisson: 2, normal: 3 };
  const suma = (v) => v.reduce((a, b) => a + b, 0);

  function tabla(texto, nom) {
    const lin = String(texto ?? '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !/[a-zñáéíóú]/i.test(l.replace(/e[+-]?\d/gi, '')));
    if (!lin.length) throw new Error(`${nom} fehlt`);
    return filas(texto, (/[;\t]/.test(lin[0]) ? lin[0].split(/\s*[;\t]\s*/) : lin[0].split(/\s+/)).filter(Boolean).length, nom);
  }
  const frec = (o, nom) => { if (o.some((x) => x < 0 || !Number.isInteger(x))) throw new Error(`Die beobachteten Häufigkeiten von ${nom} müssen ganze Zahlen ab 0 sein`); };

  function discretas(sc, modelo) {
    const t = tabla(sc.datos, 'die Tabelle der Werte x und Häufigkeiten');
    if (t[0].length !== 2) throw new Error('Schreibe in jede Zeile den Wert x und seine beobachtete Häufigkeit');
    const x = t.map((r) => r[0]), o = t.map((r) => r[1]);
    frec(o, 'la tabla');
    if (x.some((v, i) => !Number.isInteger(v) || v < 0 || (i && v !== x[i - 1] + 1))) throw new Error('Die Werte x müssen aufeinanderfolgende ganze Zahlen von klein nach groß sein (0, 1, 2…)');
    const N = suma(o), m = suma(x.map((v, i) => v * o[i])) / N, est = sc.estima !== 'no';
    let P, Dd, par, estTxt;
    if (modelo === 'binomial') {
      const n = lee(sc, 'nb', 'die Anzahl der Versuche n', { min: 1, entero: true });
      if (x[x.length - 1] > n) throw new Error(`Es gibt Werte x größer als n = ${n}`);
      const p = est ? m / n : lee(sc, 'pb', 'die Erfolgswahrscheinlichkeit p', { min: 0, minEx: true, max: 1, maxEx: true });
      Dd = D.binomial; P = { n, p }; par = est ? 1 : 0;
      estTxt = est ? `$x̄ = {∑ x_i O_i}/N = ${f(m * N)}/${N} = ${f(m)}$ und, da der Erwartungswert einer Binomialverteilung $n p$ ist, $p̂ = x̄/n = ${f(m)}/${n} = ${f(p)}$` : '';
    } else {
      const l = est ? m : lee(sc, 'lambda', 'der Erwartungswert λ', { min: 0, minEx: true });
      Dd = D.poisson; P = { lambda: l }; par = est ? 1 : 0;
      estTxt = est ? `Der Erwartungswert einer Poisson-Verteilung ist λ: $λ̂ = x̄ = {∑ x_i O_i}/N = ${f(m * N)}/${N} = ${f(l)}$` : '';
    }
    if (!(est ? P.p ?? P.lambda : 1) && est) throw new Error('Wenn alle Häufigkeiten bei x = 0 liegen, lässt sich der Parameter nicht schätzen');
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
    const t = tabla(sc.datos, 'die Tabelle der Intervalle und Häufigkeiten');
    if (t[0].length !== 3) throw new Error('Schreibe in jede Zeile die Untergrenze, die Obergrenze und die beobachtete Häufigkeit des Intervalls');
    const o = t.map((r) => r[2]);
    frec(o, 'la tabla');
    t.forEach((r, i) => { if (!(r[1] > r[0])) throw new Error(`In Zeile ${i + 1} muss die Obergrenze größer als die Untergrenze sein`); if (i && Math.abs(r[0] - t[i - 1][1]) > 1e-9) throw new Error(`Die Intervalle müssen aneinander anschließen: Zeile ${i + 1} beginnt bei ${f(r[0])} und die vorherige endet bei ${f(t[i - 1][1])}`); });
    const N = suma(o), mc = t.map((r) => (r[0] + r[1]) / 2), est = sc.estima !== 'no';
    const mu = est ? suma(mc.map((v, i) => v * o[i])) / N : lee(sc, 'mu', 'der Erwartungswert μ');
    const sigma = est ? Math.sqrt(suma(mc.map((v, i) => o[i] * (v - mu) ** 2)) / N) : lee(sc, 'sigma', 'die Standardabweichung σ', { min: 0, minEx: true });
    if (!(sigma > 0)) throw new Error('Alle Daten liegen in einem einzigen Intervall: σ lässt sich nicht schätzen');
    const P = { mu, sigma }, ult = t.length - 1;
    const cl = t.map((r, i) => ({ lo: i === 0 ? -Infinity : r[0], hi: i === ult ? Infinity : r[1], o: o[i] }));
    for (const c of cl) c.p = (c.hi === Infinity ? 1 : D.normal.cdf(P, c.hi)) - (c.lo === -Infinity ? 0 : D.normal.cdf(P, c.lo));
    return { cl, N, par: est ? 2 : 0, Dd: D.normal, P, nomD: `N(${f(mu)}, ${f(sigma)})`,
      estTxt: est ? `Mit den Klassenmitten $m_i$: $μ̂ = x̄ = {∑ m_i O_i}/N = ${f(mu)}$ und $σ̂ = √({∑ O_i (m_i − x̄)^2}/N) = ${f(sigma)}$` : '',
      nomCl: (c) => c.lo === -Infinity && c.hi === Infinity ? 'todo' : c.lo === -Infinity ? `x < ${f(c.hi)}` : c.hi === Infinity ? `x ≥ ${f(c.lo)}` : `${f(c.lo)}–${f(c.hi)}`,
      formP: (c) => c.lo === -Infinity ? `P(X < ${f(c.hi)})` : c.hi === Infinity ? `P(X ≥ ${f(c.lo)})` : `P(${f(c.lo)} ≤ X < ${f(c.hi)})` };
  }
  function sencillas(sc, modelo) {
    let o, w;
    if (modelo === 'uniforme') { o = lista(sc.datos, 'die beobachteten Häufigkeiten'); w = o.map(() => 1); }
    else { const t = tabla(sc.datos, 'die Tabelle der Häufigkeiten und Anteile'); if (t[0].length !== 2) throw new Error('Schreibe in jede Zeile die beobachtete Häufigkeit und den erwarteten Anteil der Klasse'); o = t.map((r) => r[0]); w = t.map((r) => r[1]); }
    frec(o, 'las clases');
    if (w.some((v) => !(v > 0))) throw new Error('Die erwarteten Anteile müssen größer als 0 sein');
    const W = suma(w), N = suma(o);
    return { cl: o.map((v, i) => ({ lo: i + 1, hi: i + 1, o: v, p: w[i] / W })), N, par: 0, nomD: modelo === 'uniforme' ? 'uniforme' : 'die gegebenen Anteile', estTxt: '', W, w,
      nomCl: (c) => c.lo === c.hi ? `Klasse ${c.lo}` : `Klassen ${c.lo}–${c.hi}`, formP: (c) => modelo === 'uniforme' ? `1/${o.length}` : c.lo === c.hi ? `${f(w[c.lo - 1])}/${f(W)}` : `p_{${c.lo}–${c.hi}}` };
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
    if (!(r.N > 0)) throw new Error('Die Gesamtzahl der Beobachtungen muss größer als 0 sein');
    let cl = r.cl, junto = false;
    if (sc.agrupa === 'si') ({ cl, junto } = agrupa(cl, r.N));
    const celdas = cl.map((c) => { const e = r.N * c.p; return { nom: r.nomCl(c), o: c.o, e, c: (c.o - e) ** 2 / e, p: c.p, fp: r.formP(c), junta: c.junta }; });
    const chi = suma(celdas.map((c) => c.c)), gl = celdas.length - 1 - r.par;
    if (gl < 1) throw new Error(`Es bleiben ${celdas.length} Klassen und ${r.par ? `${r.par} Parameter werden geschätzt` : 'kein Parameter wird geschätzt'}: Es gibt keine Freiheitsgrade. Es braucht mehr Klassen${junto ? ' (versuche es ohne Zusammenfassen der Klassen mit kleiner erwarteter Häufigkeit)' : ''}`);
    const pocos = celdas.filter((c) => c.e < 5).length, { crit, pv, rechaza } = decide(chi, gl, alfa);
    const h0 = modelo === 'uniforme' ? 'alle Klassen sind gleich wahrscheinlich' : modelo === 'dadas' ? 'die Anteile sind die gegebenen' : `die Daten folgen einer ${{ binomial: 'Binomialverteilung', poisson: 'Poisson-Verteilung', normal: 'Normalverteilung' }[modelo]}${r.par ? '' : ` ${r.nomD}`}`;
    const pasos = [];
    pasos.push({ t: 'Hypothesen', html: `$H_0$: ${h0}, gegen $H_1$: ${modelo === 'uniforme' || modelo === 'dadas' ? 'das trifft nicht zu' : 'sie folgen ihr nicht'}; mit $α = ${f(alfa)}$ und $N = ${r.N}$ Beobachtungen.` });
    if (r.estTxt) pasos.push({ t: 'Geschätzte Parameter', html: `${r.estTxt}. Se ajusta a una ${r.nomD}; cada parámetro estimado resta un grado de libertad.` });
    const ej = celdas.slice(0, 3).map((c) => `$E = N · ${c.fp} = ${r.N} · ${f(c.p)} = ${f(c.e)}$`).join('<br>');
    pasos.push({ t: 'Erwartete Häufigkeiten', html: `$E_i = N p_i$, mit $p_i$ als Wahrscheinlichkeit jeder Klasse, wenn $H_0$ stimmt${modelo === 'normal' ? ' (das erste Intervall wird bis −∞ und das letzte bis +∞ verlängert, damit sie sich zu 1 summieren)' : modelo === 'binomial' || modelo === 'poisson' ? ' (die erste und die letzte Klasse übernehmen die Ränder, damit sie sich zu 1 summieren)' : ''}:<br>${ej}${celdas.length > 3 ? '<br>und so die übrigen (in der Tabelle).' : ''}${junto ? '<br>Klassen mit erwarteter Häufigkeit unter 5 wurden mit ihrer Nachbarklasse <b>zusammengefasst</b>.' : ''}${pocos ? `<br><b>Achtung:</b> ${pocos === 1 ? 'Eine Klasse hat' : `${pocos} Klassen haben`} eine erwartete Häufigkeit unter 5, und die χ²-Näherung ist möglicherweise nicht gut${sc.agrupa === 'si' ? '' : ': Es empfiehlt sich, Klassen zusammenzufassen'}.` : ''}` });
    pasos.push({ t: 'Teststatistik', html: `$χ^2 = ∑ {(O_i − E_i)^2}/{E_i} = ${sumaTxt(celdas.map((c) => `{(${c.o} − ${f(c.e)})^2}/{${f(c.e)}}`))}$<br>$χ^2 = ${sumaTxt(celdas.map((c) => f(c.c)))} = ${f(chi)}$` });
    pasos.push({ t: 'Freiheitsgrade', html: `$ν = k − 1 − m = ${celdas.length} − 1${r.par ? ` − ${r.par}` : ''} = ${gl}$, mit $k = ${celdas.length}$ Klassen${r.par ? ` und $m = ${r.par}$ ${r.par === 1 ? 'geschätztem Parameter' : 'geschätzten Parametern'}` : ''}.` });
    return { modo: 'bondad', modelo, celdas, chi, gl, crit, pv, rechaza, pocos, junto, N: r.N, nomD: r.nomD, pasos, h0 };
  }

  function independencia(sc) {
    const t = tabla(sc.datos, 'die Kontingenztafel'), r = t.length, c = t[0].length;
    if (r < 2 || c < 2) throw new Error('Die Kontingenztafel braucht mindestens 2 Zeilen und 2 Spalten');
    t.forEach((fl) => frec(fl, 'la tabla'));
    const F = t.map(suma), C = t[0].map((_, j) => suma(t.map((fl) => fl[j]))), N = suma(F);
    if (F.some((v) => !v) || C.some((v) => !v)) throw new Error('Eine ganze Zeile oder Spalte ist null: Entferne sie aus der Tabelle');
    const yates = sc.yates === 'si' && r === 2 && c === 2, celdas = [];
    t.forEach((fl, i) => fl.forEach((o, j) => { const e = (F[i] * C[j]) / N, d = yates ? Math.max(0, Math.abs(o - e) - 0.5) : o - e; celdas.push({ nom: `Zeile ${i + 1}, Spalte ${j + 1}`, i, j, o, e, c: (d * d) / e }); }));
    const chi = suma(celdas.map((x) => x.c)), gl = (r - 1) * (c - 1), pocos = celdas.filter((x) => x.e < 5).length, V = Math.sqrt(chi / (N * (Math.min(r, c) - 1)));
    const pasos = [];
    pasos.push({ t: 'Hypothesen', html: `$H_0$: Die beiden Variablen sind <b>unabhängig</b> (oder, wenn jede Zeile eine Grundgesamtheit ist, haben alle dieselben Anteile), gegen $H_1$: Es gibt einen Zusammenhang; mit $α = ${f(alfa(sc))}$.` });
    pasos.push({ t: 'Erwartete Häufigkeiten', html: `Sind sie unabhängig, ist $E_{ij} = {F_i · C_j}/N$, mit $F_i$ und $C_j$ als Summen der Zeile $i$ und der Spalte $j$ und $N = ${N}$:<br>${celdas.slice(0, 2).map((x) => `$E_{${x.i + 1}${x.j + 1}} = {${F[x.i]} · ${C[x.j]}}/${N} = ${f(x.e)}$`).join(', &ensp; ')}, und so die übrigen (in der Tabelle).${pocos ? `<br><b>Achtung:</b> ${pocos === 1 ? 'Ein Feld hat' : `${pocos} Felder haben`} eine erwartete Häufigkeit unter 5, und die χ²-Näherung ist möglicherweise nicht gut.` : ''}` });
    pasos.push({ t: 'Teststatistik', html: `${yates ? 'Bei einer 2 × 2-Tafel wird die Yates-Korrektur angewendet: ' : ''}$χ^2 = ∑ {(${yates ? '|O_{ij} − E_{ij}| − 0,5' : 'O_{ij} − E_{ij}'})^2}/{E_{ij}} = ${sumaTxt(celdas.map((x) => yates ? `{(|${x.o} − ${f(x.e)}| − 0,5)^2}/{${f(x.e)}}` : `{(${x.o} − ${f(x.e)})^2}/{${f(x.e)}}`))}$<br>$χ^2 = ${sumaTxt(celdas.map((x) => f(x.c)))} = ${f(chi)}$` });
    pasos.push({ t: 'Freiheitsgrade', html: `$ν = (r − 1)(c − 1) = (${r} − 1)(${c} − 1) = ${gl}$, mit $r = ${r}$ Zeilen und $c = ${c}$ Spalten.` });
    celdas.forEach((x) => { x.rp = (x.o - x.e) / Math.sqrt(x.e); x.rs = (x.o - x.e) / Math.sqrt(x.e * (1 - F[x.i] / N) * (1 - C[x.j] / N)); x.marca = Math.abs(x.rs) > 2; });
    const mayores = celdas.filter((x) => x.marca);
    pasos.push({ t: 'Standardisierte Residuen', html: `Um zu sehen, <i>wo</i> die Assoziation liegt: $r_{ij} = {O_{ij} − E_{ij}}/√{E_{ij}(1 − F_i/N)(1 − C_j/N)}$, das unter $H_0$ näherungsweise $N(0, 1)$ ist: Ein Wert außerhalb von $±2$ markiert ein Feld mit mehr (oder weniger) Fällen als erwartet.<br>${celdas.slice(0, 2).map((x) => `$r_{${x.i + 1}${x.j + 1}} = ${f(x.rs)}$`).join(', &ensp; ')}${celdas.length > 2 ? ', …' : ''}. ${mayores.length ? `Auffällig: ${mayores.map((x) => `Zeile ${x.i + 1}, Spalte ${x.j + 1} (${f(x.rs)}: ${x.rs > 0 ? 'mehr' : 'weniger'} als erwartet)`).join('; ')}.` : 'Kein Feld liegt außerhalb von ±2.'}` });
    const dc = decide(chi, gl, alfa(sc));
    return { modo: 'independencia', celdas, chi, gl, ...dc, pocos, N, t, F, C, V, yates, pasos, h0: 'die Variablen sind unabhängig', mayores };
  }
  const alfa = (sc) => lee(sc, 'alfa', 'das Signifikanzniveau α', { min: 0, minEx: true, max: 0.5, maxEx: true });


  const lnFact = (n) => ES.lnGamma(n + 1);
  const lnC = (n, k) => lnFact(n) - lnFact(k) - lnFact(n - k);
  function fisher(sc, a) {
    const t = tabla(sc.datos, 'die 2 × 2-Tafel'); if (t.length !== 2 || t[0].length !== 2) throw new Error('Der Fisher-Test braucht eine 2 × 2-Tafel: zwei Zeilen mit je zwei Zahlen');
    t.forEach((fl) => frec(fl, 'la tabla'));
    const [[n11, n12], [n21, n22]] = t, r1 = n11 + n12, r2 = n21 + n22, c1 = n11 + n21, N = r1 + r2, h1 = H1[sc.h1] ? sc.h1 : 'distinto';
    if (!r1 || !r2 || !c1 || !(n12 + n22)) throw new Error('Eine ganze Zeile oder Spalte ist null: Entferne sie aus der Tabelle');
    const lo = Math.max(0, c1 - r2), hi = Math.min(r1, c1), pr = (k) => Math.exp(lnC(r1, k) + lnC(r2, c1 - k) - lnC(N, c1)), obs = pr(n11);
    let le = 0, ge = 0, bil = 0; for (let k = lo; k <= hi; k++) { const q = pr(k); if (k <= n11) le += q; if (k >= n11) ge += q; if (q <= obs * (1 + 1e-7)) bil += q; }
    const p = Math.min(1, h1 === 'mayor' ? ge : h1 === 'menor' ? le : bil), or = n12 * n21 === 0 ? (n11 * n22 === 0 ? NaN : Infinity) : (n11 * n22) / (n12 * n21);
    const esp = [r1 * c1 / N, r1 * (N - c1) / N, r2 * c1 / N, r2 * (N - c1) / N], pocos = esp.filter((e) => e < 5).length;
    const pasos = [
      { t: 'Hypothesen', html: `$H_0$: Die beiden Zeilen haben dieselbe „Erfolgs“-Wahrscheinlichkeit (Spalte 1), das heißt, das Odds-Ratio ist 1; gegen $H_1$: es ${{ distinto: 'ist ungleich 1', mayor: 'ist größer als 1', menor: 'ist kleiner als 1' }[h1]}. Mit festen Randsummen ($F_1 = ${r1}$, $F_2 = ${r2}$, $C_1 = ${c1}$, $N = ${N}$).` },
      { t: 'Exakte Verteilung', html: `Bei festen Randsummen folgt die Anzahl $X$ der Fälle im Feld (1, 1) einer <b>hypergeometrischen Verteilung</b>: $P(X = k) = {\\binom{${r1}}{k}\\binom{${r2}}{${c1} − k}}/{\\binom{${N}}{${c1}}}$, mit $k$ von $${lo}$ bis $${hi}$. Die beobachtete Tafel hat $k = ${n11}$ und $P(X = ${n11}) = ${ES.prob(obs)}$.${pocos ? ` (Deshalb gilt das χ² nicht: ${pocos === 1 ? 'Ein Feld hat' : `${pocos} Felder haben`} eine erwartete Häufigkeit unter 5.)` : ''}` },
      { t: 'p-valor exacto', html: h1 === 'mayor' ? `$p = P(X ≥ ${n11}) = ${ES.prob(ge)}$` : h1 === 'menor' ? `$p = P(X ≤ ${n11}) = ${ES.prob(le)}$` : `Zweiseitig: Es werden die Wahrscheinlichkeiten aller Tafeln summiert, die so unwahrscheinlich sind wie die beobachtete oder unwahrscheinlicher, $p = ∑_{P(X = k) ≤ ${ES.prob(obs)}} P(X = k) = ${ES.prob(bil)}$.` },
      { t: 'Odds-Ratio', html: `Stichproben-Odds-Ratio: $OR = {n_{11} n_{22}}/{n_{12} n_{21}} = {${n11} · ${n22}}/{${n12} · ${n21}} = ${isFinite(or) ? f(or) : or === Infinity ? '∞' : 'unbestimmt'}$ (1 = keine Assoziation).` },
      { t: 'Schlussfolgerung', html: p < a ? `<b>$H_0$ wird verworfen</b> auf dem Signifikanzniveau von ${f(100 * a)} %: Es gibt eine Assoziation zwischen Zeile und Spalte.` : `<b>$H_0$ wird nicht verworfen</b> auf dem Signifikanzniveau von ${f(100 * a)} %: Es gibt keinen Hinweis auf eine Assoziation.` },
    ];
    return { modo: 'fisher', t, N, h1, p, pv: p, le, ge, bil, obs, or, lo, hi, dist: Array.from({ length: hi - lo + 1 }, (_, i) => [lo + i, pr(lo + i)]), n11, pocos, esp, rechaza: p < a, chi: NaN, gl: 0, crit: NaN, pasos, alfa: a };
  }

  function mcnemar(sc, a) {
    const t = tabla(sc.datos, 'die 2 × 2-Tafel der Paare'); if (t.length !== 2 || t[0].length !== 2) throw new Error('McNemar braucht eine 2 × 2-Tafel: zwei Zeilen mit je zwei Zahlen');
    t.forEach((fl) => frec(fl, 'la tabla'));
    const [[A, b], [c, d]] = t, n = b + c; if (n < 1) throw new Error('Es gibt keine diskordanten Paare (b + c = 0): Der Test lässt sich nicht durchführen');
    const corr = sc.yates !== 'no', chi = ((corr ? Math.max(0, Math.abs(b - c) - 1) : Math.abs(b - c)) ** 2) / n, pChi = D.chi2.sf({ k: 1 }, chi);
    let s = 0, cb = 1; for (let i = 0; i <= Math.min(b, c); i++) { s += cb; cb = (cb * (n - i)) / (i + 1); } const pEx = Math.min(1, (2 * s) / 2 ** n);
    const usaEx = sc.metodo === 'exacto', p = usaEx ? pEx : pChi;
    const pasos = [
      { t: 'Hypothesen', html: `Jedes Individuum wird zweimal gemessen (vorher und nachher). Nur die <b>diskordanten</b> zählen: $b = ${b}$ (ja → nein) und $c = ${c}$ (nein → ja). $H_0$: Beide Wechsel sind gleich wahrscheinlich ($b$ und $c$ müssen ähnlich sein), gegen $H_1$: Sie sind es nicht; $α = ${f(a)}$.` },
      { t: 'Teststatistik', html: `$χ^2 = {(${corr ? '|b − c| − 1' : 'b − c'})^2}/{b + c} = {(${corr ? `|${b} − ${c}| − 1` : `${b} − ${c}`})^2}/{${n}} = ${f(chi)}$ mit 1 Freiheitsgrad${corr ? ' (mit Stetigkeitskorrektur)' : ''}: $p = ${ES.prob(pChi)}$.` },
      { t: 'Exakte Version', html: `Stimmt $H_0$, ist $b$ binomialverteilt $B(${n}, 1/2)$ und $p = 2 · P(X ≤ ${Math.min(b, c)}) = ${ES.prob(pEx)}$ (auf 1 begrenzt). Sie ist vorzuziehen, wenn $b + c$ klein ist (unter etwa 25).` },
      { t: 'Schlussfolgerung', html: `Mit ${usaEx ? 'der exakten Version' : 'dem χ²'} ist $p = ${ES.prob(p)}$: ${p < a ? `<b>$H_0$ wird verworfen</b> auf dem Signifikanzniveau von ${f(100 * a)} %: Die Änderung ist kein Zufall` : `<b>$H_0$ wird nicht verworfen</b> auf dem Signifikanzniveau von ${f(100 * a)} %: Es gibt keinen Hinweis auf eine Änderung`}.` },
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
    r.pasos.push({ t: 'Kritischer Bereich und p-Wert', html: `Der Test ist immer rechtsseitig (je weiter die beobachteten von den erwarteten Werten abweichen, desto größer wird χ²). Mit $ν = ${r.gl}$ ist der kritische Wert $χ^2_{${r.gl}; ${f(1 - a)}} = ${f(r.crit)}$: $H_0$ wird verworfen, wenn $χ^2 > ${f(r.crit)}$.<br>$χ^2 = ${f(r.chi)}$ ${r.rechaza ? '<b>liegt im kritischen Bereich</b>' : '<b>liegt nicht im kritischen Bereich</b>'}, und der p-Wert ist $p = P(χ^2_{${r.gl}} ≥ ${f(r.chi)}) = ${f(r.pv)}$, ${r.pv < a ? 'kleiner' : 'größer'} als $α$.` });
    r.pasos.push({ t: 'Schlussfolgerung', html: r.rechaza ? `<b>$H_0$ wird verworfen</b> auf dem Signifikanzniveau von ${f(100 * a)} %: ${modo === 'independencia' ? `Es gibt einen Zusammenhang zwischen den beiden Variablen (Cramér-V = ${f(r.V, 3)}, ${r.V < 0.1 ? 'sehr schwach' : r.V < 0.3 ? 'schwach' : r.V < 0.5 ? 'mäßig' : 'stark'})` : 'Die Daten passen nicht zum Modell'}.` : `<b>$H_0$ wird nicht verworfen</b> auf dem Signifikanzniveau von ${f(100 * a)} %: ${modo === 'independencia' ? 'Die Daten liefern keine Hinweise auf einen Zusammenhang zwischen den Variablen' : 'Die Unterschiede zwischen Beobachtetem und Erwartetem können auf Zufall beruhen, und das Modell ist akzeptabel'}.` });
    return r;
  }

  const ejemplos = [
    { clave: 'dado', nombre: 'Gleichverteilung: Ist der Würfel gezinkt? (120 Würfe)', sc: { modo: 'bondad', modelo: 'uniforme', alfa: '0,05', agrupa: 'no', datos: '12\n16\n20\n18\n22\n32' } },
    { clave: 'mendel', nombre: 'Gegebene Anteile: Mendels Erbsen (9 : 3 : 3 : 1)', sc: { modo: 'bondad', modelo: 'dadas', alfa: '0,05', agrupa: 'no', datos: '315 9\n108 3\n101 3\n32 1' } },
    { clave: 'coces', nombre: 'Poisson: Todesfälle durch Pferdetritte (Bortkiewicz)', sc: { modo: 'bondad', modelo: 'poisson', estima: 'si', alfa: '0,05', agrupa: 'si', datos: '0 109\n1 65\n2 22\n3 3\n4 1' } },
    { clave: 'familias', nombre: 'Binomial: Anzahl der Jungen in Familien mit 4 Kindern', sc: { modo: 'bondad', modelo: 'binomial', estima: 'si', nb: '4', alfa: '0,05', agrupa: 'si', datos: '0 7\n1 33\n2 51\n3 37\n4 12' } },
    { clave: 'alturas', nombre: 'Normal: Körpergrößen nach Intervallen (cm)', sc: { modo: 'bondad', modelo: 'normal', estima: 'si', alfa: '0,05', agrupa: 'si', datos: '150 160 8\n160 170 25\n170 180 40\n180 190 20\n190 200 7' } },
    { clave: 'preferencia', nombre: 'Unabhängigkeit: Geschlecht und bevorzugte Sportart (2 × 3)', sc: { modo: 'independencia', alfa: '0,05', yates: 'no', datos: '20 30 50\n30 30 40' } },
    { clave: 'fisher', nombre: 'Fisher: Tee mit Milch (kleine 2 × 2-Tafel)', sc: { modo: 'fisher', h1: 'mayor', alfa: '0,05', datos: '3 1\n1 3' } },
    { clave: 'fisher-bilateral', nombre: 'Zweiseitiger Fisher: ein Medikament mit wenigen Fällen', sc: { modo: 'fisher', h1: 'distinto', alfa: '0,05', datos: '8 2\n1 5' } },
    { clave: 'mcnemar', nombre: 'McNemar: Meinung vor und nach einer Kampagne', sc: { modo: 'mcnemar', alfa: '0,05', yates: 'si', metodo: 'chi2', datos: '59 6\n16 80' } },
    { clave: 'mcnemar-exacto', nombre: 'Exakter McNemar mit wenigen diskordanten Paaren', sc: { modo: 'mcnemar', alfa: '0,05', yates: 'si', metodo: 'exacto', datos: '20 9\n2 15' } },
    { clave: 'curacion', nombre: 'Homogenität 2 × 2: Heilung mit zwei Behandlungen', sc: { modo: 'independencia', alfa: '0,05', yates: 'no', datos: '45 105\n30 120' } },
  ];

  return { resolver, ejemplos, MODOS, MODELOS, COLUMNAS, H1 };
})();

