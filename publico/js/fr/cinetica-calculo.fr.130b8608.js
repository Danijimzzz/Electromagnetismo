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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} manque`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} doit être un nombre`);
    if (!negativo && (cero ? v < 0 : v <= 0)) throw new Error(`${Mayus(nom)} doit être ${cero ? 'positif ou nul' : 'supérieur à 0'}`);
    return v;
  }
  const UT = { s: 's', min: 'min', h: 'h', d: 'd', a: 'an' };
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
    if (![0, 1, 2].includes(n)) throw new Error('L’ordre doit être 0, 1 ou 2');
    const u = ut(sc), A0 = lee(sc, 'A0', 'la concentration initiale'), t = lee(sc, 't', 'el tiempo', { cero: true });
    const a = vacio(sc.a) ? 1 : lee(sc, 'a', 'le coefficient de A'), kde = ['t12', 'pct', 'med'].includes(sc.kde) ? sc.kde : 'k';
    const C = lee(sc, 'C', 'la concentration finale', { opcional: true });
    if (C !== null && !(C < A0)) throw new Error('La concentration à atteindre doit être inférieure à la concentration initiale');
    const pasos = [], kS = a === 1 ? 'k' : 'k_A', L = LEY[n], conK = (x) => x.replace(/\bk\b/g, kS);
    let kA, k, pasoK = null;
    if (kde === 'k') { k = lee(sc, 'k', 'la constante k'); kA = a * k; }
    else if (kde === 't12') {
      const h = lee(sc, 't12', 'le temps de demi-réaction');
      kA = n === 0 ? A0 / (2 * h) : n === 1 ? Math.LN2 / h : 1 / (h * A0);
      pasoK = `En l’isolant dans le temps de demi-réaction : $${kS} = ${['{[A]_0}/{2 t_{1/2}}', '{ln 2}/{t_{1/2}}', '{1}/{t_{1/2} [A]_0}'][n]} = ${[`{${m(A0)}}/{2 · ${m(h)}}`, `{0,693}/{${m(h)}}`, `{1}/{${m(h)} · ${m(A0)}}`][n]} = ${m(kA, 4)}$ ${unidK(n, u)}`;
    } else if (kde === 'pct') {
      const p = lee(sc, 'pct', 'le pourcentage ayant réagi'), tp = lee(sc, 'tp', 'le temps de ce pourcentage');
      if (p >= 100) throw new Error('Le pourcentage ayant réagi doit être inférieur à 100');
      const Cp = A0 * (1 - p / 100);
      kA = kDos(n, 0, A0, tp, Cp);
      pasoK = `Si ${f(p)} % ont réagi en ${f(tp)} ${u}, il reste $[A] = ${m(A0)} · ${m(1 - p / 100)} = ${m(Cp, 4)}$ mol/L, et d’après la loi intégrée $${kS} = ${DOS[n](m(A0), m(Cp, 4), '0', m(tp))} = ${m(kA, 4)}$ ${unidK(n, u)}${n === 1 ? '. À l’ordre 1, [A]₀ n’est pas nécessaire : seule compte la fraction restante' : ''}`;
    } else {
      const t1 = lee(sc, 't1', 'le temps de la première mesure', { cero: true }), A1 = lee(sc, 'A1', 'la première concentration'), t2 = lee(sc, 't2', 'le temps de la deuxième mesure'), A2 = lee(sc, 'A2', 'la deuxième concentration');
      if (!(t2 > t1)) throw new Error('La deuxième mesure doit être postérieure à la première');
      if (!(A2 < A1)) throw new Error('À la deuxième mesure, il doit rester moins de A qu’à la première');
      kA = kDos(n, t1, A1, t2, A2);
      pasoK = `Avec les deux mesures, la loi intégrée entre $t_1$ et $t_2$ donne $${kS} = ${DOS[n](m(A1), m(A2), m(t1), m(t2 - t1))} = ${m(kA, 4)}$ ${unidK(n, u)}`;
    }
    if (kde !== 'k') k = kA / a;
    if (pasoK) pasos.push({ t: 'La constante', html: pasoK + (a === 1 ? '.' : `, et celle de la réaction, $k = k_A/${f(a)} = ${m(k, 4)}$.`) });
    if (a !== 1) pasos.push({ t: 'Coefficient de A', html: `Dans $${f(a)} A → produits$, la vitesse de réaction est $v = −{1}/{${f(a)}} {d[A]}/{dt} = k [A]^{${n}}$, donc A disparaît avec $−{d[A]}/{dt} = ${f(a)} k [A]^{${n}}$ : dans les lois intégrées, on a $k_A = a k = ${m(kA, 4)}$ ${unidK(n, u)}. Certains manuels appellent directement k la constante $k_A$ ; si votre donnée est déjà la constante de disparition de A, laissez a = 1.` });
    const A = conc(n, kA, A0, t), t12 = vidaMedia(n, kA, A0);
    pasos.push({ t: 'Loi de vitesse', html: `Pour une réaction d’${ORD[n]}, $${a === 1 ? L.dif : conK(L.dif).replace(/^v = /, '')}$, avec $${kS} = ${m(kA)}$ ${unidK(n, u)}. En intégrant entre 0 et t : $${conK(L.int)}$` });
    const sust = n === 0 ? `$[A] = ${m(A0)} − ${m(kA)} · ${m(t)}$` : n === 1 ? `$[A] = [A]_0 e^{−${kS} t} = ${m(A0)} · e^{−${m(kA)} · ${m(t)}}$` : `$${'{1}/{[A]}'} = {1}/{${m(A0)}} + ${m(kA)} · ${m(t)} = ${m(1 / A)}$`;
    const agot = n === 0 && A0 - kA * t <= 0;
    pasos.push({ t: `Concentration à t = ${f(t)} ${u}`, html: `${sust}${agot ? `, qui serait négative : le réactif s’épuise en $t = [A]_0/${kS} = ${m(A0 / kA)}$ ${u}, donc` : ''} → $[A] = ${m(A, 4)}$ mol/L (il reste ${f((100 * A) / A0, 3)} %)` });
    pasos.push({ t: 'Temps de demi-réaction', html: `C’est le temps au bout duquel [A] tombe à la moitié : $${conK(L.t12)} = ${m(t12, 4)}$ ${u}. ${n === 1 ? 'À l’ordre 1, il ne dépend pas de la concentration : chaque demi-réaction divise par deux ce qui reste.' : n === 0 ? 'À l’ordre 0, il est proportionnel à [A]₀ : chaque demi-réaction est la moitié de la précédente.' : 'À l’ordre 2, il est inversement proportionnel à [A]₀ : chaque demi-réaction dure le double de la précédente.'}` });
    let tC = null;
    if (C !== null) {
      tC = tiempo(n, kA, A0, C);
      const d = n === 0 ? `$t = {[A]_0 − [A]}/{${kS}} = {${m(A0)} − ${m(C)}}/{${m(kA)}}$` : n === 1 ? `$t = {ln([A]_0/[A])}/{${kS}} = {ln {${m(A0)}}/{${m(C)}}}/{${m(kA)}}$` : `$t = {1/[A] − 1/[A]_0}/{${kS}} = {{1}/{${m(C)}} − {1}/{${m(A0)}}}/{${m(kA)}}$`;
      pasos.push({ t: `Temps jusqu’à [A] = ${f(C)} mol/L`, html: `En l’isolant dans la loi intégrée : ${d} = <b>${f(tC, 4)} ${u}</b>` });
    }
    const v0 = k * A0 ** n, v = A > 0 ? k * A ** n : 0;
    pasos.push({ t: 'Vitesse', html: `Au début, $v_0 = k${n ? ` [A]_0${n === 2 ? '^2' : ''}` : ''} = ${m(v0)}$ mol·L⁻¹·${u}⁻¹ et à t = ${f(t)} ${u}, $v = ${m(v)}$ mol·L⁻¹·${u}⁻¹. Le graphique qui donne une droite est ${L.recta} en fonction de t.` });
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
    if (xs.some((v) => !isFinite(v))) throw new Error(`${Mayus(nom)} : une valeur n’est pas un nombre (séparez-les par des espaces ou des ;)`);
    return xs;
  };
  function datos(sc) {
    const u = ut(sc), ts = leeLista(sc.ts, 'les temps'), As = leeLista(sc.As, 'les concentrations');
    if (ts.length !== As.length) throw new Error(`Il y a ${ts.length} temps et ${As.length} concentrations : ils doivent être en même nombre`);
    if (ts.length < 3) throw new Error('Il faut au moins trois mesures');
    if (ts.length > 20) throw new Error('20 mesures au maximum');
    if (As.some((v) => v <= 0)) throw new Error('Les concentrations doivent être supérieures à 0');
    if (ts.some((t, i) => i && t <= ts[i - 1])) throw new Error('Les temps doivent aller du plus petit au plus grand');
    const ys = [As, As.map(Math.log), As.map((v) => 1 / v)], fits = ys.map((y) => recta(ts, y));
    const n = fits.reduce((a, q, i) => (q.r2 > fits[a].r2 ? i : a), 0), F = fits[n];
    const k = n === 2 ? F.b : -F.b, A0 = n === 0 ? F.a : n === 1 ? Math.exp(F.a) : 1 / F.a;
    const pasos = [];
    pasos.push({ t: 'Les trois droites', html: `Chaque ordre donne une droite différente en fonction du temps : [A] à l’ordre 0, ln [A] à l’ordre 1 et 1/[A] à l’ordre 2. En ajustant les trois par les moindres carrés :<br>${fits.map((q, i) => `${ORD[i]}: $${['[A]', 'ln [A]', '1/[A]'][i]} = ${m(q.a, 4)} ${q.b < 0 ? '−' : '+'} ${m(Math.abs(q.b), 4)} t$, &ensp; $R^2 = ${q.r2.toFixed(5).replace('.', ',')}$`).join('<br>')}` });
    const seg = [0, 1, 2].filter((i) => i !== n).reduce((a, i) => (fits[i].r2 > fits[a].r2 ? i : a), n === 0 ? 1 : 0);
    const aviso = F.r2 - fits[seg].r2 < 0.002 ? `Les droites de ${['[A]', 'ln [A]', '1/[A]'][n]} et de ${['[A]', 'ln [A]', '1/[A]'][seg]} s’ajustent presque aussi bien (R² = ${F.r2.toFixed(4).replace('.', ',')} et ${fits[seg].r2.toFixed(4).replace('.', ',')}) : avec si peu d’avancement de la réaction, on ne distingue pas les ordres. Il faut des mesures jusqu’à ce que [A] baisse bien davantage, ou regarder les résidus.` : null;
    pasos.push({ t: 'L’ordre', html: `Celle qui s’ajuste le mieux à une droite (R² le plus proche de 1) est celle de ${['[A]', 'ln [A]', '1/[A]'][n]} : la réaction est d’<b>${ORD[n]}</b>.${aviso ? ` <b>Attention :</b> ${aviso}` : ''}` });
    pasos.push({ t: 'La constante', html: `${n === 2 ? 'La pente est +k' : 'La pente est −k'} : $k = ${m(k, 4)}$ ${unidK(n, u)}, et l’ordonnée à l’origine donne $[A]_0 ≈ ${m(A0, 4)}$ mol/L.` });
    const t12 = vidaMedia(n, k, A0);
    pasos.push({ t: 'Temps de demi-réaction', html: `$${LEY[n].t12} = ${m(t12, 4)}$ ${u}${n === 1 ? ', la même quel que soit le point de départ' : ` (avec [A]₀ = ${f(A0, 4)} mol/L)`}.` });
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
    if (filas.length < nr + 1) throw new Error(`Il faut au moins ${nom}`);
    const E = filas.map((e, i) => { const x = { v: 0 }; for (const L of LETRAS) x[L] = Ls.includes(L) ? lee(e, L, `[${L}] de l’expérience ${i + 1}`) : 1; x.v = lee(e, 'v', `la vitesse de l’expérience ${i + 1}`); return x; });
    const X = E.map((e) => [1, ...Ls.map((L) => Math.log(e[L]))]), Y = E.map((e) => Math.log(e.v)), q = X[0].length;
    const XtX = Array.from({ length: q }, (_, i) => Array.from({ length: q }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0))), XtY = Array.from({ length: q }, (_, i) => X.reduce((s, r, k) => s + r[i] * Y[k], 0));
    const sol = resuelveN(XtX, XtY);
    if (!sol) throw new Error(nr > 1 ? `Avec ces expériences, on ne peut pas séparer les ${nr === 2 ? 'deux' : 'trois'} ordres : changez chaque réactif séparément dans l’une d’elles` : 'Les concentrations de A doivent être différentes');
    const o = { A: 0, B: 0, C: 0 }; Ls.forEach((L, i) => { o[L] = redondea(sol[i + 1]); });
    const pasos = [];
    pasos.push({ t: 'Loi de vitesse', html: `On écrit $v = k${Ls.map((L, i) => ` [${L}]^${EXPO[i]}`).join('')}$ et on compare des expériences où ${nr > 1 ? 'un seul réactif change' : '[A] change'} : en divisant leurs vitesses, k disparaît.` });
    const igual = (x, y) => Math.abs(x - y) <= 1e-9 * Math.abs(x);
    const par = (cambia, fijas) => { for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) if (!igual(E[i][cambia], E[j][cambia]) && fijas.every((F) => igual(E[i][F], E[j][F]))) return [i, j]; return null; };
    const paso = (L, letra) => {
      const fijas = Ls.filter((x) => x !== L), q = par(L, fijas), fT = fijas.map((F) => `[${F}]`).join(' y ');
      if (!q) return `Aucune paire d’expériences ne laisse ${fT} identique, donc $${letra}$ vient de l’ajustement de toutes à la fois : $${letra} ≈ ${oTxt(o[L])}$.`;
      const [i, j] = q, a = E[j][L] / E[i][L], b = E[j].v / E[i].v, ex = Math.log(b) / Math.log(a);
      return `Expériences ${i + 1} et ${j + 1}${fijas.length ? ` (${fT} identique${fijas.length > 1 ? 's' : ''})` : ''} : $${'{v_' + (j + 1) + '}/{v_' + (i + 1) + '}'} = ({[${L}]_${j + 1}}/{[${L}]_${i + 1}})^${letra}$, &ensp; $${m(b, 4)} = ${m(a, 4)}^${letra}$, &ensp; $${letra} = {ln ${m(b, 4)}}/{ln ${m(a, 4)}} = ${m(ex, 3)}$ → <b>${letra} = ${oTxt(o[L])}</b>`;
    };
    Ls.forEach((L, i) => pasos.push({ t: `Ordre par rapport à ${L}`, html: paso(L, EXPO[i]) }));
    const vLey = (e) => e.A ** o.A * e.B ** o.B * e.C ** o.C, ks = E.map((e) => e.v / vLey(e)), k = ks.reduce((a, b) => a + b, 0) / ks.length, tot = o.A + o.B + o.C;
    const den = Ls.map((L) => (o[L] === 1 ? `[${L}]` : `[${L}]^{${oTxt(o[L])}}`)).join(' ');
    pasos.push({ t: 'La constante', html: `Avec chaque expérience, $k = v/(${den})$ : ${ks.map((q) => m(q, 4)).join(' ; ')}. La moyenne est $k = ${m(k, 4)}$ ${unidK(tot, u)}.` });
    const ley = `v = ${m(k, 4)}${Ls.map((L) => pot(L, o[L])).join('')}`;
    pasos.push({ t: 'Résultat', html: `$${ley}$ : ordre ${Ls.map((L) => `${oTxt(o[L])} par rapport à ${L}`).join(', ')}${nr > 1 ? ` et ordre global ${oTxt(tot)}` : ''}.` });
    return { modo: 'iniciales', E, nr, conB: nr > 1, oA: o.A, oB: o.B, oC: o.C, tot, k, ks, ley, vLey: (e) => k * vLey(e), u, unidad: unidK(tot, u), pasos };
  }

  function arrhenius(sc) {
    const C = sc.uT === 'C', aK = (v, nom) => { const K = C ? v + 273.15 : v; if (!(K > 0)) throw new Error(`${Mayus(nom)} doit être au-dessus du zéro absolu`); return K; };
    const T = (k, nom) => aK(lee(sc, k, nom, { negativo: C }), nom), tipo = ['k2', 'ajuste'].includes(sc.tipo) ? sc.tipo : 'ea';
    const pasos = [], tK = (v) => `${m(v, 5)} K`;
    let Ea, k1, k2, T1, T2, A, pts = null, r2 = null;
    if (tipo === 'ajuste') {
      const Ts = leeLista(sc.Ts, 'les températures').map((v, i) => aK(v, `la temperatura ${i + 1}`)), ks = leeLista(sc.ks, 'les constantes');
      if (Ts.length !== ks.length) throw new Error(`Il y a ${Ts.length} températures et ${ks.length} constantes : elles doivent être en même nombre`);
      if (Ts.length < 3) throw new Error('Il faut au moins trois températures (avec deux, choisissez « L’énergie d’activation »)');
      if (Ts.length > 20) throw new Error('20 mesures au maximum');
      if (ks.some((v) => v <= 0)) throw new Error('Les constantes doivent être supérieures à 0');
      if (new Set(Ts.map((v) => v.toFixed(6))).size !== Ts.length) throw new Error('Il y a des températures répétées');
      const F = recta(Ts.map((v) => 1 / v), ks.map(Math.log));
      Ea = -F.b * R; A = Math.exp(F.a); r2 = F.r2;
      pts = Ts.map((v, i) => ({ T: v, k: ks[i] }));
      const ord = [...pts].sort((a, b) => a.T - b.T); [T1, k1, T2, k2] = [ord[0].T, ord[0].k, ord[ord.length - 1].T, ord[ord.length - 1].k];
      pasos.push({ t: 'Équation d’Arrhenius', html: `En prenant les logarithmes, $ln k = ln A − {E_a}/{R} · {1}/{T}$ : ln k en fonction de 1/T est une droite de pente $−E_a/R$, avec $R = ${Aj.texto(R)}$ J/(mol·K)${C ? '. Les températures passent en kelvin en ajoutant 273,15' : ''}.` });
      pasos.push({ t: 'Tableau', html: `<table class="tabla"><tr><th>T (K)</th><th>1/T (K⁻¹)</th><th>ln k</th></tr>${pts.map((q) => `<tr><td>${f(q.T, 5)}</td><td>${f(1 / q.T, 4)}</td><td>${f(Math.log(q.k), 4)}</td></tr>`).join('')}</table>` });
      pasos.push({ t: 'Droite des moindres carrés', html: `$ln k = ${m(F.a, 4)} ${F.b < 0 ? '−' : '+'} ${m(Math.abs(F.b), 4)} · {1}/{T}$, &ensp; $R^2 = ${F.r2.toFixed(5).replace('.', ',')}$${F.r2 < 0.98 ? ' (les points s’écartent nettement de la droite : vérifiez les mesures)' : ''}.` });
      pasos.push({ t: 'Énergie d’activation', html: `$E_a = −R · pente = ${Aj.texto(R)} · ${m(-F.b, 4)} = ${m(Ea, 4)}$ J/mol = <b>${f(Ea / 1000, 4)} kJ/mol</b>${Ea < 0 ? '. Elle est négative : la constante baisse en chauffant, ce qui est étrange pour une réaction élémentaire' : ''}` });
      pasos.push({ t: 'Facteur de fréquence', html: `$A = e^{ordonnée} = e^{${m(F.a, 4)}} = ${m(A, 4)}$ (mêmes unités que k).` });
    } else {
      k1 = lee(sc, 'k1', 'la constante k₁'); T1 = T('T1', 'la température T₁'); T2 = T('T2', 'la température T₂');
      if (Math.abs(T1 - T2) < 1e-9) throw new Error('Les deux températures doivent être différentes');
      pasos.push({ t: 'Équation d’Arrhenius', html: `$k = A e^{−E_a/(RT)}$, et en divisant pour deux températures : $ln {k_2}/{k_1} = −{E_a}/{R} ({1}/{T_2} − {1}/{T_1})$, avec $R = ${Aj.texto(R)}$ J/(mol·K)${C ? '. Les températures passent en kelvin : ' + `$T_1 = ${tK(T1)}$, $T_2 = ${tK(T2)}$` : ''}.` });
      if (tipo === 'k2') {
        Ea = lee(sc, 'Ea', 'l’énergie d’activation') * 1000;
        k2 = k1 * Math.exp((-Ea / R) * (1 / T2 - 1 / T1));
        pasos.push({ t: 'Constante à T₂', html: `$ln {k_2}/{${m(k1)}} = −{${m(Ea, 4)}}/{${Aj.texto(R)}} ({1}/{${m(T2, 5)}} − {1}/{${m(T1, 5)}}) = ${m(Math.log(k2 / k1), 4)}$ → $k_2 = ${m(k1)} · e^{${m(Math.log(k2 / k1), 4)}}$ = <b>${f(k2, 4)}</b>` });
      } else {
        k2 = lee(sc, 'k2', 'la constante k₂');
        Ea = (-R * Math.log(k2 / k1)) / (1 / T2 - 1 / T1);
        pasos.push({ t: 'Énergie d’activation', html: `$E_a = {−R ln(k_2/k_1)}/{1/T_2 − 1/T_1} = {−${Aj.texto(R)} · ln {${m(k2)}}/{${m(k1)}}}/{{1}/{${m(T2, 5)}} − {1}/{${m(T1, 5)}}} = ${m(Ea, 4)}$ J/mol = <b>${f(Ea / 1000, 4)} kJ/mol</b>${Ea < 0 ? '. Elle est négative : la constante baisse en chauffant, ce qui est étrange pour une réaction élémentaire' : ''}` });
      }
      A = k1 / Math.exp(-Ea / (R * T1));
      pasos.push({ t: 'Facteur de fréquence', html: `$A = k_1 e^{E_a/(R T_1)} = ${m(A, 4)}$ (mêmes unités que k).` });
    }
    const r = k2 / k1, tC = (v) => `${f(C ? v - 273.15 : v, 4)} ${C ? '°C' : 'K'}`;
    pasos.push({ t: 'De combien elle change', html: `De ${tC(T1)} à ${tC(T2)}, la constante est multipliée par ${f(r, 4)}. Sur le graphique de ln k en fonction de 1/T, on obtient une droite de pente $−E_a/R = ${m(-Ea / R, 4)}$ K.` });
    const Eac = lee(sc, 'Eac', 'l’énergie d’activation avec catalyseur', { opcional: true });
    let fcat = null;
    if (Eac !== null) {
      if (!(Eac * 1000 < Ea)) throw new Error('Avec catalyseur, l’énergie d’activation doit être inférieure à celle sans catalyseur');
      fcat = Math.exp((Ea - Eac * 1000) / (R * T1));
      pasos.push({ t: 'Avec catalyseur', html: `Le catalyseur ouvre un autre chemin avec une barrière plus faible et, si A ne change pas, $${'{k_{cat}}/{k}'} = e^{(E_a − E_{a,cat})/(R T)} = e^{${m(Ea - Eac * 1000, 4)}/(${Aj.texto(R)} · ${m(T1, 5)})}$ = <b>${f(fcat, 4)}</b> à ${tC(T1)}. Il ne change ni ΔH ni l’équilibre : il accélère autant la réaction directe que l’inverse.` });
    }
    const dH = lee(sc, 'dH', 'l’enthalpie de réaction', { opcional: true, negativo: true });
    if (dH !== null) {
      const Ei = Ea / 1000 - dH;
      pasos.push({ t: 'Diagramme d’énergie', html: `Les produits sont ${f(Math.abs(dH), 4)} kJ/mol ${dH < 0 ? 'en dessous' : 'au-dessus'} des réactifs (réaction ${dH < 0 ? 'exothermique' : dH > 0 ? 'endothermique' : 'sans chaleur de réaction'}). La réaction inverse doit monter depuis les produits : $E_{a,inv} = E_a − ΔH = ${m(Ea / 1000, 4)} − (${m(dH, 4)}) = ${m(Ei, 4)}$ kJ/mol${Ei <= 0 ? '. Elle est inférieure ou égale à 0 : ΔH ne peut pas être supérieure à Eₐ' : ''}.` });
      if (Ei <= 0) throw new Error('L’enthalpie de réaction ne peut pas être supérieure à l’énergie d’activation');
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
    { clave: 'primer-orden', nombre: 'Ordre 1 : décomposition du N₂O₅', sc: { modo: 'orden', n: '1', k: '5,1e-4', A0: '0,25', t: '3600', C: '0,05', ut: 's' } },
    { clave: 'orden-cero', nombre: 'Ordre 0 : décomposition catalysée', sc: { modo: 'orden', n: '0', k: '0,002', A0: '0,5', t: '120', C: '0,1', ut: 's' } },
    { clave: 'segundo-orden', nombre: 'Ordre 2 : 2 NO₂ → 2 NO + O₂', sc: { modo: 'orden', n: '2', k: '0,54', A0: '0,05', t: '60', C: '0,01', ut: 's' } },
    { clave: 'farmaco', nombre: 'Ordre 1 avec le temps en heures', sc: { modo: 'orden', n: '1', k: '0,173', A0: '20', t: '8', C: '2', ut: 'h' } },
    { clave: 'datos-1', nombre: 'Données : H₂O₂ qui se décompose', sc: { modo: 'datos', ts: '0 10 20 30 40 50', As: '1 0,707 0,5 0,354 0,25 0,177', ut: 'min' } },
    { clave: 'datos-2', nombre: 'Données : réaction du second ordre', sc: { modo: 'datos', ts: '0 50 100 150 200 300', As: '0,1 0,0667 0,05 0,04 0,0333 0,025', ut: 's' } },
    { clave: 'coef-2', nombre: 'Ordre 2 avec 2 A → produits', sc: { modo: 'orden', n: '2', a: '2', k: '0,27', A0: '0,05', t: '60', C: '0,01', ut: 's' } },
    { clave: 'k-vida-media', nombre: 'k à partir du temps de demi-réaction (C-14)', sc: { modo: 'orden', n: '1', kde: 't12', t12: '5730', A0: '100', t: '10000', C: '25', ut: 'a' } },
    { clave: 'k-porcentaje', nombre: 'k à partir de 75 % ayant réagi', sc: { modo: 'orden', n: '1', kde: 'pct', pct: '75', tp: '40', A0: '0,2', t: '60', C: '', ut: 'min' } },
    { clave: 'k-dos-medidas', nombre: 'k à partir de deux mesures (ordre 2)', sc: { modo: 'orden', n: '2', kde: 'med', t1: '10', A1: '0,08', t2: '50', A2: '0,04', A0: '0,1', t: '100', C: '', ut: 's' } },
    { clave: 'datos-0', nombre: 'Données : ordre 0', sc: { modo: 'datos', ts: '0 5 10 15 20', As: '0,8 0,7 0,6 0,5 0,4', ut: 'min' } },
    { clave: 'iniciales-2', nombre: 'Vitesses initiales : 2 NO + O₂', sc: { modo: 'iniciales', conB: true, ut: 's', exps: [{ A: '0,01', B: '0,01', v: '2,5e-5' }, { A: '0,02', B: '0,01', v: '1e-4' }, { A: '0,01', B: '0,02', v: '5e-5' }] } },
    { clave: 'iniciales-abc', nombre: 'Vitesses initiales avec trois réactifs', sc: { modo: 'iniciales', nr: '3', ut: 's', exps: [{ A: '0,1', B: '0,1', C: '0,1', v: '2e-3' }, { A: '0,2', B: '0,1', C: '0,1', v: '4e-3' }, { A: '0,1', B: '0,2', C: '0,1', v: '8e-3' }, { A: '0,1', B: '0,1', C: '0,2', v: '2e-3' }] } },
    { clave: 'iniciales-1', nombre: 'Vitesses initiales avec un réactif', sc: { modo: 'iniciales', conB: false, ut: 's', exps: [{ A: '0,1', v: '0,004' }, { A: '0,2', v: '0,008' }, { A: '0,4', v: '0,016' }] } },
    { clave: 'iniciales-3', nombre: 'Vitesses initiales : ordre 1 et 2', sc: { modo: 'iniciales', conB: true, ut: 's', exps: [{ A: '0,1', B: '0,1', v: '0,02' }, { A: '0,2', B: '0,1', v: '0,04' }, { A: '0,1', B: '0,2', v: '0,08' }, { A: '0,3', B: '0,3', v: '0,54' }] } },
    { clave: 'arrhenius-ea', nombre: 'Arrhenius : énergie d’activation', sc: { modo: 'arrhenius', tipo: 'ea', uT: 'K', k1: '3,46e-5', T1: '298', k2: '9,63e-4', T2: '328' } },
    { clave: 'arrhenius-k2', nombre: 'Arrhenius : k à une autre température', sc: { modo: 'arrhenius', tipo: 'k2', uT: 'C', Ea: '50', k1: '0,01', T1: '25', T2: '35' } },
    { clave: 'arrhenius-ajuste', nombre: 'Arrhenius : ajustement à cinq températures', sc: { modo: 'arrhenius', tipo: 'ajuste', uT: 'K', Ts: '300 310 320 330 340', ks: '7,9e-4 2,1e-3 5,3e-3 1,25e-2 2,8e-2' } },
    { clave: 'arrhenius-cat', nombre: 'Arrhenius : catalyseur et diagramme d’énergie', sc: { modo: 'arrhenius', tipo: 'k2', uT: 'K', Ea: '75', k1: '2e-4', T1: '298', T2: '318', Eac: '50', dH: '-40' } },
  ];

  ejemplos.push(...Mec.ejemplos);
  return { resolver, orden, datos, iniciales, arrhenius, conc, vidaMedia, tiempo, recta, ejemplos, f, unidK, unidT: (u) => UT[u] || 's', R };
})();

