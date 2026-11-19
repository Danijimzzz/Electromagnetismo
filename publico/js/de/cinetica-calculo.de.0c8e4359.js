const Cinetica = (() => {
  const Aj = typeof Ajuste !== 'undefined' ? Ajuste : require('../quimica/ajuste.js');
  let R = 8.314; // J/(mol·K): la de clase o la exacta, según el ajuste común de Química
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-2 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const m = (x, d = 3) => f(x, d).replace(/<sup>(.*?)<\/sup>/, '^{$1}');
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false, negativo = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} fehlt`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} muss eine Zahl sein`);
    if (!negativo && (cero ? v < 0 : v <= 0)) throw new Error(`${Mayus(nom)} muss ${cero ? 'positiv oder null' : 'größer als 0'} sein`);
    return v;
  }
  const UT = { s: 's', min: 'min', h: 'h', d: 'd', a: 'Jahr' };
  const ut = (sc) => UT[sc.ut] || 's';
  const sup = (v) => String(+v.toFixed(2)).replace('.', ',').replace('-', '−').replace(/[\d−]/g, (c) => (c === '−' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]));
  const unidK = (n, u) => {
    if (Math.abs(n - 1) < 1e-9) return `${u}⁻¹`;
    if (Math.abs(n) < 1e-9) return `mol·L⁻¹·${u}⁻¹`;
    const e = n - 1, p = (v) => (Math.abs(v - 1) < 1e-9 ? '' : sup(v));
    return e > 0 ? `L${p(e)}·mol${sup(-e)}·${u}⁻¹` : `mol${p(-e)}·L${sup(e)}·${u}⁻¹`;
  };
  const ORD = ['orden 0', 'orden 1', 'orden 2'];

  const conc = (n, k, A0, t) => (n === 0 ? Math.max(0, A0 - k * t) : n === 1 ? A0 * Math.exp(-k * t) : A0 / (1 + k * A0 * t));
  const vidaMedia = (n, k, A0) => (n === 0 ? A0 / (2 * k) : n === 1 ? Math.LN2 / k : 1 / (k * A0));
  const tiempo = (n, k, A0, C) => (n === 0 ? (A0 - C) / k : n === 1 ? Math.log(A0 / C) / k : (1 / C - 1 / A0) / k);
  const LEY = [
    { dif: 'v = −{d[A]}/{dt} = k', int: '[A] = [A]_0 − k t', recta: '[A]', t12: 't_{1/2} = {[A]_0}/{2k}' },
    { dif: 'v = −{d[A]}/{dt} = k [A]', int: 'ln [A] = ln [A]_0 − k t', recta: 'ln [A]', t12: 't_{1/2} = {ln 2}/{k}' },
    { dif: 'v = −{d[A]}/{dt} = k [A]^2', int: '{1}/{[A]} = {1}/{[A]_0} + k t', recta: '1/[A]', t12: 't_{1/2} = {1}/{k [A]_0}' },
  ];

  const kDos = (n, t1, A1, t2, A2) => (n === 0 ? (A1 - A2) / (t2 - t1) : n === 1 ? Math.log(A1 / A2) / (t2 - t1) : (1 / A2 - 1 / A1) / (t2 - t1));
  const DOS = [(a, b, ta, tb) => `{${a} − ${b}}/{${tb}}`, (a, b, ta, tb) => `{ln({${a}}/{${b}})}/{${tb}}`, (a, b, ta, tb) => `{{1}/{${b}} − {1}/{${a}}}/{${tb}}`];
  function orden(sc) {
    const n = Math.round(leeNum(sc.n));
    if (![0, 1, 2].includes(n)) throw new Error('Die Ordnung muss 0, 1 oder 2 sein');
    const u = ut(sc), A0 = lee(sc, 'A0', 'die Anfangskonzentration'), t = lee(sc, 't', 'die Zeit', { cero: true });
    const a = vacio(sc.a) ? 1 : lee(sc, 'a', 'der Koeffizient von A'), kde = ['t12', 'pct', 'med'].includes(sc.kde) ? sc.kde : 'k';
    const C = lee(sc, 'C', 'die Endkonzentration', { opcional: true });
    if (C !== null && !(C < A0)) throw new Error('Die gewünschte Konzentration muss kleiner als die anfängliche sein');
    const pasos = [], kS = a === 1 ? 'k' : 'k_A', L = LEY[n], conK = (x) => x.replace(/\bk\b/g, kS);
    let kA, k, pasoK = null;
    if (kde === 'k') { k = lee(sc, 'k', 'la constante k'); kA = a * k; }
    else if (kde === 't12') {
      const h = lee(sc, 't12', 'die Halbwertszeit');
      kA = n === 0 ? A0 / (2 * h) : n === 1 ? Math.LN2 / h : 1 / (h * A0);
      pasoK = `Aufgelöst nach der Halbwertszeit: $${kS} = ${['{[A]_0}/{2 t_{1/2}}', '{ln 2}/{t_{1/2}}', '{1}/{t_{1/2} [A]_0}'][n]} = ${[`{${m(A0)}}/{2 · ${m(h)}}`, `{0,693}/{${m(h)}}`, `{1}/{${m(h)} · ${m(A0)}}`][n]} = ${m(kA, 4)}$ ${unidK(n, u)}`;
    } else if (kde === 'pct') {
      const p = lee(sc, 'pct', 'der umgesetzte Prozentsatz'), tp = lee(sc, 'tp', 'die Zeit für diesen Prozentsatz');
      if (p >= 100) throw new Error('Der umgesetzte Prozentsatz muss kleiner als 100 sein');
      const Cp = A0 * (1 - p / 100);
      kA = kDos(n, 0, A0, tp, Cp);
      pasoK = `Wurden in ${f(tp)} ${u} ${f(p)} % umgesetzt, bleibt $[A] = ${m(A0)} · ${m(1 - p / 100)} = ${m(Cp, 4)}$ mol/L, und aus dem integrierten Gesetz folgt $${kS} = ${DOS[n](m(A0), m(Cp, 4), '0', m(tp))} = ${m(kA, 4)}$ ${unidK(n, u)}${n === 1 ? '. Bei 1. Ordnung wird [A]₀ nicht benötigt: Es zählt nur der verbleibende Anteil' : ''}`;
    } else {
      const t1 = lee(sc, 't1', 'die Zeit der ersten Messung', { cero: true }), A1 = lee(sc, 'A1', 'die erste Konzentration'), t2 = lee(sc, 't2', 'die Zeit der zweiten Messung'), A2 = lee(sc, 'A2', 'die zweite Konzentration');
      if (!(t2 > t1)) throw new Error('Die zweite Messung muss nach der ersten liegen');
      if (!(A2 < A1)) throw new Error('Bei der zweiten Messung muss weniger A übrig sein als bei der ersten');
      kA = kDos(n, t1, A1, t2, A2);
      pasoK = `Mit den beiden Messungen ergibt das integrierte Gesetz zwischen $t_1$ und $t_2$ $${kS} = ${DOS[n](m(A1), m(A2), m(t1), m(t2 - t1))} = ${m(kA, 4)}$ ${unidK(n, u)}`;
    }
    if (kde !== 'k') k = kA / a;
    if (pasoK) pasos.push({ t: 'La constante', html: pasoK + (a === 1 ? '.' : `, und die der Reaktion, $k = k_A/${f(a)} = ${m(k, 4)}$.`) });
    if (a !== 1) pasos.push({ t: 'Koeffizient von A', html: `Bei $${f(a)} A → Produkte$ ist die Reaktionsgeschwindigkeit $v = −{1}/{${f(a)}} {d[A]}/{dt} = k [A]^{${n}}$, also verschwindet A mit $−{d[A]}/{dt} = ${f(a)} k [A]^{${n}}$: In den integrierten Gesetzen steht $k_A = a k = ${m(kA, 4)}$ ${unidK(n, u)}. Manche Bücher nennen $k_A$ direkt k; ist dein Wert bereits die Verschwindungskonstante von A, lass a = 1.` });
    const A = conc(n, kA, A0, t), t12 = vidaMedia(n, kA, A0);
    pasos.push({ t: 'Geschwindigkeitsgesetz', html: `Für eine Reaktion ${ORD[n]} gilt $${a === 1 ? L.dif : conK(L.dif).replace(/^v = /, '')}$ mit $${kS} = ${m(kA)}$ ${unidK(n, u)}. Integriert zwischen 0 und t: $${conK(L.int)}$` });
    const sust = n === 0 ? `$[A] = ${m(A0)} − ${m(kA)} · ${m(t)}$` : n === 1 ? `$[A] = [A]_0 e^{−${kS} t} = ${m(A0)} · e^{−${m(kA)} · ${m(t)}}$` : `$${'{1}/{[A]}'} = {1}/{${m(A0)}} + ${m(kA)} · ${m(t)} = ${m(1 / A)}$`;
    const agot = n === 0 && A0 - kA * t <= 0;
    pasos.push({ t: `Konzentration bei t = ${f(t)} ${u}`, html: `${sust}${agot ? `, was negativ wäre: Das Edukt ist bei $t = [A]_0/${kS} = ${m(A0 / kA)}$ ${u} aufgebraucht, also` : ''} → $[A] = ${m(A, 4)}$ mol/L (es bleiben ${f((100 * A) / A0, 3)} %)` });
    pasos.push({ t: 'Halbwertszeit', html: `Das ist die Zeit, in der [A] auf die Hälfte sinkt: $${conK(L.t12)} = ${m(t12, 4)}$ ${u}. ${n === 1 ? 'Bei 1. Ordnung hängt sie nicht von der Konzentration ab: Jede Halbwertszeit halbiert, was übrig ist.' : n === 0 ? 'Bei 0. Ordnung ist sie proportional zu [A]₀: Jede Halbwertszeit ist halb so lang wie die vorherige.' : 'Bei 2. Ordnung ist sie umgekehrt proportional zu [A]₀: Jede Halbwertszeit dauert doppelt so lang wie die vorherige.'}` });
    let tC = null;
    if (C !== null) {
      tC = tiempo(n, kA, A0, C);
      const d = n === 0 ? `$t = {[A]_0 − [A]}/{${kS}} = {${m(A0)} − ${m(C)}}/{${m(kA)}}$` : n === 1 ? `$t = {ln([A]_0/[A])}/{${kS}} = {ln {${m(A0)}}/{${m(C)}}}/{${m(kA)}}$` : `$t = {1/[A] − 1/[A]_0}/{${kS}} = {{1}/{${m(C)}} − {1}/{${m(A0)}}}/{${m(kA)}}$`;
      pasos.push({ t: `Zeit bis [A] = ${f(C)} mol/L`, html: `Aufgelöst nach dem integrierten Gesetz: ${d} = <b>${f(tC, 4)} ${u}</b>` });
    }
    const v0 = k * A0 ** n, v = A > 0 ? k * A ** n : 0;
    pasos.push({ t: 'Geschwindigkeit', html: `Am Anfang ist $v_0 = k${n ? ` [A]_0${n === 2 ? '^2' : ''}` : ''} = ${m(v0)}$ mol·L⁻¹·${u}⁻¹ und bei t = ${f(t)} ${u} ist $v = ${m(v)}$ mol·L⁻¹·${u}⁻¹. Das Diagramm, das eine Gerade ergibt, ist ${L.recta} gegen t.` });
    return { modo: 'orden', n, k, kA, a, kde, A0, t, A, t12, C, tC, v0, v, u, unidad: unidK(n, u), c: (x) => conc(n, kA, A0, x), pasos };
  }

  function recta(xs, ys) {
    const N = xs.length, mx = xs.reduce((a, b) => a + b, 0) / N, my = ys.reduce((a, b) => a + b, 0) / N;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < N; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
    const b = sxy / sxx, a = my - b * mx, r2 = syy > 0 ? (sxy * sxy) / (sxx * syy) : 1;
    return { a, b, r2 };
  }
  const leeLista = (s, nom) => {
    const xs = String(s ?? '').split(/[;\s]+/).filter(Boolean).map((v) => leeNum(v));
    if (xs.some((v) => !isFinite(v))) throw new Error(`${Mayus(nom)}: Ein Wert ist keine Zahl (trenne sie mit Leerzeichen oder ;)`);
    return xs;
  };
  function datos(sc) {
    const u = ut(sc), ts = leeLista(sc.ts, 'die Zeiten'), As = leeLista(sc.As, 'die Konzentrationen');
    if (ts.length !== As.length) throw new Error(`Es gibt ${ts.length} Zeiten und ${As.length} Konzentrationen: Es müssen gleich viele sein`);
    if (ts.length < 3) throw new Error('Es werden mindestens drei Messungen benötigt');
    if (ts.length > 20) throw new Error('Höchstens 20 Messungen');
    if (As.some((v) => v <= 0)) throw new Error('Die Konzentrationen müssen größer als 0 sein');
    if (ts.some((t, i) => i && t <= ts[i - 1])) throw new Error('Die Zeiten müssen aufsteigend geordnet sein');
    const ys = [As, As.map(Math.log), As.map((v) => 1 / v)], fits = ys.map((y) => recta(ts, y));
    const n = fits.reduce((a, q, i) => (q.r2 > fits[a].r2 ? i : a), 0), F = fits[n];
    const k = n === 2 ? F.b : -F.b, A0 = n === 0 ? F.a : n === 1 ? Math.exp(F.a) : 1 / F.a;
    const pasos = [];
    pasos.push({ t: 'Die drei Geraden', html: `Jede Ordnung ergibt eine andere Gerade gegen die Zeit: [A] bei 0. Ordnung, ln [A] bei 1. Ordnung und 1/[A] bei 2. Ordnung. Passt man alle drei nach der Methode der kleinsten Quadrate an:<br>${fits.map((q, i) => `${ORD[i]}: $${['[A]', 'ln [A]', '1/[A]'][i]} = ${m(q.a, 4)} ${q.b < 0 ? '−' : '+'} ${m(Math.abs(q.b), 4)} t$, &ensp; $R^2 = ${q.r2.toFixed(5).replace('.', ',')}$`).join('<br>')}` });
    const seg = [0, 1, 2].filter((i) => i !== n).reduce((a, i) => (fits[i].r2 > fits[a].r2 ? i : a), n === 0 ? 1 : 0);
    const aviso = F.r2 - fits[seg].r2 < 0.002 ? `Die Geraden von ${['[A]', 'ln [A]', '1/[A]'][n]} und von ${['[A]', 'ln [A]', '1/[A]'][seg]} passen fast gleich gut (R² = ${F.r2.toFixed(4).replace('.', ',')} und ${fits[seg].r2.toFixed(4).replace('.', ',')}): Bei so geringem Umsatz lassen sich die Ordnungen nicht unterscheiden. Man braucht Messungen, bis [A] deutlich weiter sinkt, oder muss die Residuen betrachten.` : null;
    pasos.push({ t: 'Die Ordnung', html: `Die beste Geradenanpassung (R² am nächsten bei 1) hat die von ${['[A]', 'ln [A]', '1/[A]'][n]}: Die Reaktion ist <b>${ORD[n]}</b>.${aviso ? ` <b>Achtung:</b> ${aviso}` : ''}` });
    pasos.push({ t: 'La constante', html: `${n === 2 ? 'Die Steigung ist +k' : 'Die Steigung ist −k'}: $k = ${m(k, 4)}$ ${unidK(n, u)}, und der Achsenabschnitt liefert $[A]_0 ≈ ${m(A0, 4)}$ mol/L.` });
    const t12 = vidaMedia(n, k, A0);
    pasos.push({ t: 'Halbwertszeit', html: `$${LEY[n].t12} = ${m(t12, 4)}$ ${u}${n === 1 ? ', dieselbe, wo auch immer sie beginnt' : ` (mit [A]₀ = ${f(A0, 4)} mol/L)`}.` });
    return { modo: 'datos', n, k, A0, t12, fits, aviso, ts, As, u, unidad: unidK(n, u), c: (x) => conc(n, k, A0, x), pasos };
  }

  const LETRAS = ['A', 'B', 'C'], EXPO = ['m', 'n', 'p'];
  const numReactivos = (sc) => { const r = Math.round(leeNum(sc.nr)); return [1, 2, 3].includes(r) ? r : sc.conB ? 2 : 1; };
  function resuelveN(M, y) {
    const n = y.length, a = M.map((r, i) => [...r, y[i]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
      if (Math.abs(a[p][c]) < 1e-12) return null;
      [a[c], a[p]] = [a[p], a[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const q = a[r][c] / a[c][c]; for (let j = c; j <= n; j++) a[r][j] -= q * a[c][j]; }
    }
    return a.map((r, i) => r[n] / r[i]);
  }
  const redondea = (o) => { const h = Math.round(o * 2) / 2; return Math.abs(o - h) < 0.08 ? h : +o.toFixed(2); };
  const oTxt = (o) => String(o).replace('.', ',').replace('-', '−');
  const pot = (L, o) => (o ? ` [${L}]${o === 1 ? '' : `^{${oTxt(o)}}`}` : '');
  function iniciales(sc) {
    const u = ut(sc), nr = numReactivos(sc), Ls = LETRAS.slice(0, nr);
    const filas = (sc.exps || []).filter((e) => !vacio(e.v) || Ls.some((L) => !vacio(e[L])));
    const nom = ['dos experimentos', 'tres experimentos (dos reactivos)', 'cuatro experimentos (tres reactivos)'][nr - 1];
    if (filas.length < nr + 1) throw new Error(`Es werden mindestens ${nom} benötigt`);
    const E = filas.map((e, i) => { const x = { v: 0 }; for (const L of LETRAS) x[L] = Ls.includes(L) ? lee(e, L, `[${L}] des Experiments ${i + 1}`) : 1; x.v = lee(e, 'v', `die Geschwindigkeit von Experiment ${i + 1}`); return x; });
    const X = E.map((e) => [1, ...Ls.map((L) => Math.log(e[L]))]), Y = E.map((e) => Math.log(e.v)), q = X[0].length;
    const XtX = Array.from({ length: q }, (_, i) => Array.from({ length: q }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0))), XtY = Array.from({ length: q }, (_, i) => X.reduce((s, r, k) => s + r[i] * Y[k], 0));
    const sol = resuelveN(XtX, XtY);
    if (!sol) throw new Error(nr > 1 ? `Mit diesen Experimenten lassen sich die ${nr === 2 ? 'beiden' : 'drei'} Ordnungen nicht trennen: Ändere jedes Edukt in mindestens einem einzeln` : 'Die Konzentrationen von A müssen verschieden sein');
    const o = { A: 0, B: 0, C: 0 }; Ls.forEach((L, i) => { o[L] = redondea(sol[i + 1]); });
    const pasos = [];
    pasos.push({ t: 'Geschwindigkeitsgesetz', html: `Man schreibt $v = k${Ls.map((L, i) => ` [${L}]^${EXPO[i]}`).join('')}$ und vergleicht Experimente, bei denen ${nr > 1 ? 'sich nur ein Edukt ändert' : '[A] geändert wird'}: Beim Teilen ihrer Geschwindigkeiten fällt k heraus.` });
    const igual = (x, y) => Math.abs(x - y) <= 1e-9 * Math.abs(x);
    const par = (cambia, fijas) => { for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) if (!igual(E[i][cambia], E[j][cambia]) && fijas.every((F) => igual(E[i][F], E[j][F]))) return [i, j]; return null; };
    const paso = (L, letra) => {
      const fijas = Ls.filter((x) => x !== L), q = par(L, fijas), fT = fijas.map((F) => `[${F}]`).join(' y ');
      if (!q) return `Kein Paar von Experimenten lässt ${fT} gleich, also ergibt sich $${letra}$ aus der Anpassung aller zugleich: $${letra} ≈ ${oTxt(o[L])}$.`;
      const [i, j] = q, a = E[j][L] / E[i][L], b = E[j].v / E[i].v, ex = Math.log(b) / Math.log(a);
      return `Experimente ${i + 1} und ${j + 1}${fijas.length ? ` (${fT} gleich${fijas.length > 1 ? '' : ''})` : ''}: $${'{v_' + (j + 1) + '}/{v_' + (i + 1) + '}'} = ({[${L}]_${j + 1}}/{[${L}]_${i + 1}})^${letra}$, &ensp; $${m(b, 4)} = ${m(a, 4)}^${letra}$, &ensp; $${letra} = {ln ${m(b, 4)}}/{ln ${m(a, 4)}} = ${m(ex, 3)}$ → <b>${letra} = ${oTxt(o[L])}</b>`;
    };
    Ls.forEach((L, i) => pasos.push({ t: `Ordnung bezüglich ${L}`, html: paso(L, EXPO[i]) }));
    const vLey = (e) => e.A ** o.A * e.B ** o.B * e.C ** o.C, ks = E.map((e) => e.v / vLey(e)), k = ks.reduce((a, b) => a + b, 0) / ks.length, tot = o.A + o.B + o.C;
    const den = Ls.map((L) => (o[L] === 1 ? `[${L}]` : `[${L}]^{${oTxt(o[L])}}`)).join(' ');
    pasos.push({ t: 'La constante', html: `Mit jedem Experiment ist $k = v/(${den})$: ${ks.map((q) => m(q, 4)).join('; ')}. Der Mittelwert ist $k = ${m(k, 4)}$ ${unidK(tot, u)}.` });
    const ley = `v = ${m(k, 4)}${Ls.map((L) => pot(L, o[L])).join('')}`;
    pasos.push({ t: 'Ergebnis', html: `$${ley}$: Ordnung ${Ls.map((L) => `${oTxt(o[L])} bezüglich ${L}`).join(', ')}${nr > 1 ? ` und Gesamtordnung ${oTxt(tot)}` : ''}.` });
    return { modo: 'iniciales', E, nr, conB: nr > 1, oA: o.A, oB: o.B, oC: o.C, tot, k, ks, ley, vLey: (e) => k * vLey(e), u, unidad: unidK(tot, u), pasos };
  }

  function arrhenius(sc) {
    const C = sc.uT === 'C', aK = (v, nom) => { const K = C ? v + 273.15 : v; if (!(K > 0)) throw new Error(`${Mayus(nom)} muss über dem absoluten Nullpunkt liegen`); return K; };
    const T = (k, nom) => aK(lee(sc, k, nom, { negativo: C }), nom), tipo = ['k2', 'ajuste'].includes(sc.tipo) ? sc.tipo : 'ea';
    const pasos = [], tK = (v) => `${m(v, 5)} K`;
    let Ea, k1, k2, T1, T2, A, pts = null, r2 = null;
    if (tipo === 'ajuste') {
      const Ts = leeLista(sc.Ts, 'die Temperaturen').map((v, i) => aK(v, `la temperatura ${i + 1}`)), ks = leeLista(sc.ks, 'die Konstanten');
      if (Ts.length !== ks.length) throw new Error(`Es gibt ${Ts.length} Temperaturen und ${ks.length} Konstanten: Es müssen gleich viele sein`);
      if (Ts.length < 3) throw new Error('Es werden mindestens drei Temperaturen benötigt (bei zwei wähle „Die Aktivierungsenergie“)');
      if (Ts.length > 20) throw new Error('Höchstens 20 Messungen');
      if (ks.some((v) => v <= 0)) throw new Error('Die Konstanten müssen größer als 0 sein');
      if (new Set(Ts.map((v) => v.toFixed(6))).size !== Ts.length) throw new Error('Es gibt wiederholte Temperaturen');
      const F = recta(Ts.map((v) => 1 / v), ks.map(Math.log));
      Ea = -F.b * R; A = Math.exp(F.a); r2 = F.r2;
      pts = Ts.map((v, i) => ({ T: v, k: ks[i] }));
      const ord = [...pts].sort((a, b) => a.T - b.T); [T1, k1, T2, k2] = [ord[0].T, ord[0].k, ord[ord.length - 1].T, ord[ord.length - 1].k];
      pasos.push({ t: 'Arrhenius-Gleichung', html: `Logarithmiert ergibt sich $ln k = ln A − {E_a}/{R} · {1}/{T}$: ln k gegen 1/T ist eine Gerade mit der Steigung $−E_a/R$, mit $R = ${Aj.texto(R)}$ J/(mol·K)${C ? '. Die Temperaturen werden in Kelvin umgerechnet, indem man 273,15 addiert' : ''}.` });
      pasos.push({ t: 'Tabelle', html: `<table class="tabla"><tr><th>T (K)</th><th>1/T (K⁻¹)</th><th>ln k</th></tr>${pts.map((q) => `<tr><td>${f(q.T, 5)}</td><td>${f(1 / q.T, 4)}</td><td>${f(Math.log(q.k), 4)}</td></tr>`).join('')}</table>` });
      pasos.push({ t: 'Ausgleichsgerade nach kleinsten Quadraten', html: `$ln k = ${m(F.a, 4)} ${F.b < 0 ? '−' : '+'} ${m(Math.abs(F.b), 4)} · {1}/{T}$, &ensp; $R^2 = ${F.r2.toFixed(5).replace('.', ',')}$${F.r2 < 0.98 ? ' (die Punkte weichen deutlich von der Geraden ab: Prüfe die Messwerte)' : ''}.` });
      pasos.push({ t: 'Aktivierungsenergie', html: `$E_a = −R · Steigung = ${Aj.texto(R)} · ${m(-F.b, 4)} = ${m(Ea, 4)}$ J/mol = <b>${f(Ea / 1000, 4)} kJ/mol</b>${Ea < 0 ? '. Sie ist negativ: Die Konstante sinkt beim Erwärmen, was bei einer Elementarreaktion seltsam ist' : ''}` });
      pasos.push({ t: 'Frequenzfaktor', html: `$A = e^{Achsenabschnitt} = e^{${m(F.a, 4)}} = ${m(A, 4)}$ (gleiche Einheiten wie k).` });
    } else {
      k1 = lee(sc, 'k1', 'die Konstante k₁'); T1 = T('T1', 'die Temperatur T₁'); T2 = T('T2', 'die Temperatur T₂');
      if (Math.abs(T1 - T2) < 1e-9) throw new Error('Die beiden Temperaturen müssen verschieden sein');
      pasos.push({ t: 'Arrhenius-Gleichung', html: `$k = A e^{−E_a/(RT)}$, und durch Teilen für zwei Temperaturen: $ln {k_2}/{k_1} = −{E_a}/{R} ({1}/{T_2} − {1}/{T_1})$, mit $R = ${Aj.texto(R)}$ J/(mol·K)${C ? '. Die Temperaturen werden in Kelvin umgerechnet: ' + `$T_1 = ${tK(T1)}$, $T_2 = ${tK(T2)}$` : ''}.` });
      if (tipo === 'k2') {
        Ea = lee(sc, 'Ea', 'die Aktivierungsenergie') * 1000;
        k2 = k1 * Math.exp((-Ea / R) * (1 / T2 - 1 / T1));
        pasos.push({ t: 'Konstante bei T₂', html: `$ln {k_2}/{${m(k1)}} = −{${m(Ea, 4)}}/{${Aj.texto(R)}} ({1}/{${m(T2, 5)}} − {1}/{${m(T1, 5)}}) = ${m(Math.log(k2 / k1), 4)}$ → $k_2 = ${m(k1)} · e^{${m(Math.log(k2 / k1), 4)}}$ = <b>${f(k2, 4)}</b>` });
      } else {
        k2 = lee(sc, 'k2', 'die Konstante k₂');
        Ea = (-R * Math.log(k2 / k1)) / (1 / T2 - 1 / T1);
        pasos.push({ t: 'Aktivierungsenergie', html: `$E_a = {−R ln(k_2/k_1)}/{1/T_2 − 1/T_1} = {−${Aj.texto(R)} · ln {${m(k2)}}/{${m(k1)}}}/{{1}/{${m(T2, 5)}} − {1}/{${m(T1, 5)}}} = ${m(Ea, 4)}$ J/mol = <b>${f(Ea / 1000, 4)} kJ/mol</b>${Ea < 0 ? '. Sie ist negativ: Die Konstante sinkt beim Erwärmen, was bei einer Elementarreaktion seltsam ist' : ''}` });
      }
      A = k1 / Math.exp(-Ea / (R * T1));
      pasos.push({ t: 'Frequenzfaktor', html: `$A = k_1 e^{E_a/(R T_1)} = ${m(A, 4)}$ (gleiche Einheiten wie k).` });
    }
    const r = k2 / k1, tC = (v) => `${f(C ? v - 273.15 : v, 4)} ${C ? '°C' : 'K'}`;
    pasos.push({ t: 'Wie stark sie sich ändert', html: `Von ${tC(T1)} auf ${tC(T2)} wird die Konstante mit ${f(r, 4)} multipliziert. Im Diagramm von ln k gegen 1/T ergibt sich eine Gerade mit der Steigung $−E_a/R = ${m(-Ea / R, 4)}$ K.` });
    const Eac = lee(sc, 'Eac', 'die Aktivierungsenergie mit Katalysator', { opcional: true });
    let fcat = null;
    if (Eac !== null) {
      if (!(Eac * 1000 < Ea)) throw new Error('Mit Katalysator muss die Aktivierungsenergie kleiner sein als ohne');
      fcat = Math.exp((Ea - Eac * 1000) / (R * T1));
      pasos.push({ t: 'Mit Katalysator', html: `Der Katalysator öffnet einen anderen Weg mit niedrigerer Barriere und, wenn A sich nicht ändert, gilt $${'{k_{cat}}/{k}'} = e^{(E_a − E_{a,cat})/(R T)} = e^{${m(Ea - Eac * 1000, 4)}/(${Aj.texto(R)} · ${m(T1, 5)})}$ = <b>${f(fcat, 4)}</b> bei ${tC(T1)}. ΔH und das Gleichgewicht ändern sich nicht: Er beschleunigt Hin- und Rückreaktion gleich.` });
    }
    const dH = lee(sc, 'dH', 'die Reaktionsenthalpie', { opcional: true, negativo: true });
    if (dH !== null) {
      const Ei = Ea / 1000 - dH;
      pasos.push({ t: 'Energiediagramm', html: `Die Produkte liegen ${f(Math.abs(dH), 4)} kJ/mol ${dH < 0 ? 'unter' : 'über'} den Edukten (Reaktion ${dH < 0 ? 'exotherm' : dH > 0 ? 'endotherm' : 'ohne Reaktionswärme'}). Die Rückreaktion muss von den Produkten aus ansteigen: $E_{a,inv} = E_a − ΔH = ${m(Ea / 1000, 4)} − (${m(dH, 4)}) = ${m(Ei, 4)}$ kJ/mol${Ei <= 0 ? '. Sie ist kleiner oder gleich 0: ΔH kann nicht größer als Eₐ sein' : ''}.` });
      if (Ei <= 0) throw new Error('Die Reaktionsenthalpie kann nicht größer als die Aktivierungsenergie sein');
    }
    return { modo: 'arrhenius', tipo, k1, k2, T1, T2, Ea, A, r, r2, pts, Eac: Eac === null ? null : Eac * 1000, fcat, dH, uT: C ? 'C' : 'K', k: (T) => A * Math.exp(-Ea / (R * T)), pasos };
  }

  const Mec = typeof Mecanismo !== 'undefined' ? Mecanismo : require('./mecanismo.js');
  function resolver(sc) {
    R = Aj.valores().R;
    if (sc.modo === 'consecutivas') return Mec.consecutivas(sc);
    if (sc.modo === 'mecanismo') return Mec.mecanismo(sc);
    if (sc.modo === 'datos') return datos(sc);
    if (sc.modo === 'iniciales') return iniciales(sc);
    if (sc.modo === 'arrhenius') return arrhenius(sc);
    return orden(sc);
  }

  const ejemplos = [
    { clave: 'primer-orden', nombre: '1. Ordnung: Zersetzung von N₂O₅', sc: { modo: 'orden', n: '1', k: '5,1e-4', A0: '0,25', t: '3600', C: '0,05', ut: 's' } },
    { clave: 'orden-cero', nombre: '0. Ordnung: katalysierte Zersetzung', sc: { modo: 'orden', n: '0', k: '0,002', A0: '0,5', t: '120', C: '0,1', ut: 's' } },
    { clave: 'segundo-orden', nombre: '2. Ordnung: 2 NO₂ → 2 NO + O₂', sc: { modo: 'orden', n: '2', k: '0,54', A0: '0,05', t: '60', C: '0,01', ut: 's' } },
    { clave: 'farmaco', nombre: '1. Ordnung mit der Zeit in Stunden', sc: { modo: 'orden', n: '1', k: '0,173', A0: '20', t: '8', C: '2', ut: 'h' } },
    { clave: 'datos-1', nombre: 'Daten: sich zersetzendes H₂O₂', sc: { modo: 'datos', ts: '0 10 20 30 40 50', As: '1 0,707 0,5 0,354 0,25 0,177', ut: 'min' } },
    { clave: 'datos-2', nombre: 'Daten: Reaktion 2. Ordnung', sc: { modo: 'datos', ts: '0 50 100 150 200 300', As: '0,1 0,0667 0,05 0,04 0,0333 0,025', ut: 's' } },
    { clave: 'coef-2', nombre: '2. Ordnung mit 2 A → Produkte', sc: { modo: 'orden', n: '2', a: '2', k: '0,27', A0: '0,05', t: '60', C: '0,01', ut: 's' } },
    { clave: 'k-vida-media', nombre: 'k aus der Halbwertszeit (C-14)', sc: { modo: 'orden', n: '1', kde: 't12', t12: '5730', A0: '100', t: '10000', C: '25', ut: 'a' } },
    { clave: 'k-porcentaje', nombre: 'k aus 75 % Umsatz', sc: { modo: 'orden', n: '1', kde: 'pct', pct: '75', tp: '40', A0: '0,2', t: '60', C: '', ut: 'min' } },
    { clave: 'k-dos-medidas', nombre: 'k aus zwei Messwerten (2. Ordnung)', sc: { modo: 'orden', n: '2', kde: 'med', t1: '10', A1: '0,08', t2: '50', A2: '0,04', A0: '0,1', t: '100', C: '', ut: 's' } },
    { clave: 'datos-0', nombre: 'Daten: 0. Ordnung', sc: { modo: 'datos', ts: '0 5 10 15 20', As: '0,8 0,7 0,6 0,5 0,4', ut: 'min' } },
    { clave: 'iniciales-2', nombre: 'Anfangsgeschwindigkeiten: 2 NO + O₂', sc: { modo: 'iniciales', conB: true, ut: 's', exps: [{ A: '0,01', B: '0,01', v: '2,5e-5' }, { A: '0,02', B: '0,01', v: '1e-4' }, { A: '0,01', B: '0,02', v: '5e-5' }] } },
    { clave: 'iniciales-abc', nombre: 'Anfangsgeschwindigkeiten mit drei Edukten', sc: { modo: 'iniciales', nr: '3', ut: 's', exps: [{ A: '0,1', B: '0,1', C: '0,1', v: '2e-3' }, { A: '0,2', B: '0,1', C: '0,1', v: '4e-3' }, { A: '0,1', B: '0,2', C: '0,1', v: '8e-3' }, { A: '0,1', B: '0,1', C: '0,2', v: '2e-3' }] } },
    { clave: 'iniciales-1', nombre: 'Anfangsgeschwindigkeiten mit einem Edukt', sc: { modo: 'iniciales', conB: false, ut: 's', exps: [{ A: '0,1', v: '0,004' }, { A: '0,2', v: '0,008' }, { A: '0,4', v: '0,016' }] } },
    { clave: 'iniciales-3', nombre: 'Anfangsgeschwindigkeiten: 1. und 2. Ordnung', sc: { modo: 'iniciales', conB: true, ut: 's', exps: [{ A: '0,1', B: '0,1', v: '0,02' }, { A: '0,2', B: '0,1', v: '0,04' }, { A: '0,1', B: '0,2', v: '0,08' }, { A: '0,3', B: '0,3', v: '0,54' }] } },
    { clave: 'arrhenius-ea', nombre: 'Arrhenius: Aktivierungsenergie', sc: { modo: 'arrhenius', tipo: 'ea', uT: 'K', k1: '3,46e-5', T1: '298', k2: '9,63e-4', T2: '328' } },
    { clave: 'arrhenius-k2', nombre: 'Arrhenius: k bei einer anderen Temperatur', sc: { modo: 'arrhenius', tipo: 'k2', uT: 'C', Ea: '50', k1: '0,01', T1: '25', T2: '35' } },
    { clave: 'arrhenius-ajuste', nombre: 'Arrhenius: Anpassung an fünf Temperaturen', sc: { modo: 'arrhenius', tipo: 'ajuste', uT: 'K', Ts: '300 310 320 330 340', ks: '7,9e-4 2,1e-3 5,3e-3 1,25e-2 2,8e-2' } },
    { clave: 'arrhenius-cat', nombre: 'Arrhenius: Katalysator und Energiediagramm', sc: { modo: 'arrhenius', tipo: 'k2', uT: 'K', Ea: '75', k1: '2e-4', T1: '298', T2: '318', Eac: '50', dH: '-40' } },
  ];

  ejemplos.push(...Mec.ejemplos);
  return { resolver, orden, datos, iniciales, arrhenius, conc, vidaMedia, tiempo, recta, ejemplos, f, unidK, unidT: (u) => UT[u] || 's', R };
})();

