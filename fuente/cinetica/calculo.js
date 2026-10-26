/* =====================================================================
   Cinética química (sin DOM):
   · leyes integradas de orden 0, 1 y 2 para a A → productos: [A](t), vida
     media y tiempo para llegar a una concentración; k dada o sacada de la
     vida media, de un porcentaje que ha reaccionado o de dos medidas;
   · orden y constante a partir de datos [A] frente a t (avisa si dos rectas
     se ajustan casi igual);
   · método de las velocidades iniciales, v = k [A]^m [B]^n [C]^p;
   · ecuación de Arrhenius: energía de activación con dos temperaturas o
     ajustada a varias, la constante a otra temperatura, el efecto de un
     catalizador y los datos del diagrama de energía (Eₐ, ΔH, Eₐ inversa).
   Concentraciones en mol/L; el tiempo en la unidad que se elija.
   ===================================================================== */
const Cinetica = (() => {
  const R = 8.314;
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-2 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // dentro de $…$: 10^{−3} en vez de <sup>
  const m = (x, d = 3) => f(x, d).replace(/<sup>(.*?)<\/sup>/, '^{$1}');
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false, negativo = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} debe ser un número`);
    if (!negativo && (cero ? v < 0 : v <= 0)) throw new Error(`${Mayus(nom)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    return v;
  }
  const UT = { s: 's', min: 'min', h: 'h', d: 'd', a: 'año' };
  const ut = (sc) => UT[sc.ut] || 's';
  // unidades de k según el orden (n puede ser cualquier suma de órdenes)
  const sup = (v) => String(+v.toFixed(2)).replace('.', ',').replace('-', '−').replace(/[\d−]/g, (c) => (c === '−' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]));
  const unidK = (n, u) => {
    if (Math.abs(n - 1) < 1e-9) return `${u}⁻¹`;
    if (Math.abs(n) < 1e-9) return `mol·L⁻¹·${u}⁻¹`;
    const e = n - 1, p = (v) => (Math.abs(v - 1) < 1e-9 ? '' : sup(v));
    return e > 0 ? `L${p(e)}·mol${sup(-e)}·${u}⁻¹` : `mol${p(-e)}·L${sup(e)}·${u}⁻¹`;
  };
  const ORD = ['orden 0', 'orden 1', 'orden 2'];

  /* ---------- Leyes integradas ---------- */
  // concentración, vida media y tiempo para llegar a C
  const conc = (n, k, A0, t) => (n === 0 ? Math.max(0, A0 - k * t) : n === 1 ? A0 * Math.exp(-k * t) : A0 / (1 + k * A0 * t));
  const vidaMedia = (n, k, A0) => (n === 0 ? A0 / (2 * k) : n === 1 ? Math.LN2 / k : 1 / (k * A0));
  const tiempo = (n, k, A0, C) => (n === 0 ? (A0 - C) / k : n === 1 ? Math.log(A0 / C) / k : (1 / C - 1 / A0) / k);
  const LEY = [
    { dif: 'v = −{d[A]}/{dt} = k', int: '[A] = [A]_0 − k t', recta: '[A]', t12: 't_{1/2} = {[A]_0}/{2k}' },
    { dif: 'v = −{d[A]}/{dt} = k [A]', int: 'ln [A] = ln [A]_0 − k t', recta: 'ln [A]', t12: 't_{1/2} = {ln 2}/{k}' },
    { dif: 'v = −{d[A]}/{dt} = k [A]^2', int: '{1}/{[A]} = {1}/{[A]_0} + k t', recta: '1/[A]', t12: 't_{1/2} = {1}/{k [A]_0}' },
  ];

  // constante de desaparición de A a partir de dos puntos (t1, A1) y (t2, A2)
  const kDos = (n, t1, A1, t2, A2) => (n === 0 ? (A1 - A2) / (t2 - t1) : n === 1 ? Math.log(A1 / A2) / (t2 - t1) : (1 / A2 - 1 / A1) / (t2 - t1));
  const DOS = [(a, b, ta, tb) => `{${a} − ${b}}/{${tb}}`, (a, b, ta, tb) => `{ln({${a}}/{${b}})}/{${tb}}`, (a, b, ta, tb) => `{{1}/{${b}} − {1}/{${a}}}/{${tb}}`];
  // sc: { n: '0'|'1'|'2', a (coeficiente de A, 1 si vacío), kde: 'k'|'t12'|'pct'|'med', k | t12 | pct+tp | t1+A1+t2+A2, A0, t, C (opcional), ut }
  function orden(sc) {
    const n = Math.round(leeNum(sc.n));
    if (![0, 1, 2].includes(n)) throw new Error('El orden tiene que ser 0, 1 o 2');
    const u = ut(sc), A0 = lee(sc, 'A0', 'la concentración inicial'), t = lee(sc, 't', 'el tiempo', { cero: true });
    const a = vacio(sc.a) ? 1 : lee(sc, 'a', 'el coeficiente de A'), kde = ['t12', 'pct', 'med'].includes(sc.kde) ? sc.kde : 'k';
    const C = lee(sc, 'C', 'la concentración final', { opcional: true });
    if (C !== null && !(C < A0)) throw new Error('La concentración que se quiere alcanzar tiene que ser menor que la inicial');
    const pasos = [], kS = a === 1 ? 'k' : 'k_A', L = LEY[n], conK = (x) => x.replace(/\bk\b/g, kS);
    let kA, k, pasoK = null;
    if (kde === 'k') { k = lee(sc, 'k', 'la constante k'); kA = a * k; }
    else if (kde === 't12') {
      const h = lee(sc, 't12', 'la vida media');
      kA = n === 0 ? A0 / (2 * h) : n === 1 ? Math.LN2 / h : 1 / (h * A0);
      pasoK = `Despejando de la vida media: $${kS} = ${['{[A]_0}/{2 t_{1/2}}', '{ln 2}/{t_{1/2}}', '{1}/{t_{1/2} [A]_0}'][n]} = ${[`{${m(A0)}}/{2 · ${m(h)}}`, `{0,693}/{${m(h)}}`, `{1}/{${m(h)} · ${m(A0)}}`][n]} = ${m(kA, 4)}$ ${unidK(n, u)}`;
    } else if (kde === 'pct') {
      const p = lee(sc, 'pct', 'el porcentaje que ha reaccionado'), tp = lee(sc, 'tp', 'el tiempo de ese porcentaje');
      if (p >= 100) throw new Error('El porcentaje que ha reaccionado tiene que ser menor que 100');
      const Cp = A0 * (1 - p / 100);
      kA = kDos(n, 0, A0, tp, Cp);
      pasoK = `Si ha reaccionado el ${f(p)} % en ${f(tp)} ${u}, queda $[A] = ${m(A0)} · ${m(1 - p / 100)} = ${m(Cp, 4)}$ mol/L, y de la ley integrada $${kS} = ${DOS[n](m(A0), m(Cp, 4), '0', m(tp))} = ${m(kA, 4)}$ ${unidK(n, u)}${n === 1 ? '. En orden 1 no hace falta [A]₀: solo cuenta la fracción que queda' : ''}`;
    } else {
      const t1 = lee(sc, 't1', 'el tiempo de la primera medida', { cero: true }), A1 = lee(sc, 'A1', 'la primera concentración'), t2 = lee(sc, 't2', 'el tiempo de la segunda medida'), A2 = lee(sc, 'A2', 'la segunda concentración');
      if (!(t2 > t1)) throw new Error('La segunda medida tiene que ser posterior a la primera');
      if (!(A2 < A1)) throw new Error('En la segunda medida tiene que quedar menos A que en la primera');
      kA = kDos(n, t1, A1, t2, A2);
      pasoK = `Con las dos medidas, la ley integrada entre $t_1$ y $t_2$ da $${kS} = ${DOS[n](m(A1), m(A2), m(t1), m(t2 - t1))} = ${m(kA, 4)}$ ${unidK(n, u)}`;
    }
    if (kde !== 'k') k = kA / a;
    if (pasoK) pasos.push({ t: 'La constante', html: pasoK + (a === 1 ? '.' : `, y la de la reacción, $k = k_A/${f(a)} = ${m(k, 4)}$.`) });
    if (a !== 1) pasos.push({ t: 'Coeficiente de A', html: `En $${f(a)} A → productos$ la velocidad de reacción es $v = −{1}/{${f(a)}} {d[A]}/{dt} = k [A]^{${n}}$, así que A desaparece con $−{d[A]}/{dt} = ${f(a)} k [A]^{${n}}$: en las leyes integradas va $k_A = a k = ${m(kA, 4)}$ ${unidK(n, u)}. Hay libros que llaman k directamente a $k_A$; si tu dato ya es la constante de desaparición de A, deja a = 1.` });
    const A = conc(n, kA, A0, t), t12 = vidaMedia(n, kA, A0);
    pasos.push({ t: 'Ley de velocidad', html: `Para una reacción de ${ORD[n]}, $${a === 1 ? L.dif : conK(L.dif).replace(/^v = /, '')}$, con $${kS} = ${m(kA)}$ ${unidK(n, u)}. Integrando entre 0 y t: $${conK(L.int)}$` });
    const sust = n === 0 ? `$[A] = ${m(A0)} − ${m(kA)} · ${m(t)}$` : n === 1 ? `$[A] = [A]_0 e^{−${kS} t} = ${m(A0)} · e^{−${m(kA)} · ${m(t)}}$` : `$${'{1}/{[A]}'} = {1}/{${m(A0)}} + ${m(kA)} · ${m(t)} = ${m(1 / A)}$`;
    const agot = n === 0 && A0 - kA * t <= 0;
    pasos.push({ t: `Concentración a t = ${f(t)} ${u}`, html: `${sust}${agot ? `, que saldría negativa: el reactivo se acaba en $t = [A]_0/${kS} = ${m(A0 / kA)}$ ${u}, así que` : ''} → $[A] = ${m(A, 4)}$ mol/L (queda el ${f((100 * A) / A0, 3)} %)` });
    pasos.push({ t: 'Vida media', html: `Es el tiempo en el que [A] baja a la mitad: $${conK(L.t12)} = ${m(t12, 4)}$ ${u}. ${n === 1 ? 'En orden 1 no depende de la concentración: cada vida media se reduce a la mitad lo que quede.' : n === 0 ? 'En orden 0 es proporcional a [A]₀: cada vida media es la mitad de la anterior.' : 'En orden 2 es inversamente proporcional a [A]₀: cada vida media dura el doble que la anterior.'}` });
    let tC = null;
    if (C !== null) {
      tC = tiempo(n, kA, A0, C);
      const d = n === 0 ? `$t = {[A]_0 − [A]}/{${kS}} = {${m(A0)} − ${m(C)}}/{${m(kA)}}$` : n === 1 ? `$t = {ln([A]_0/[A])}/{${kS}} = {ln {${m(A0)}}/{${m(C)}}}/{${m(kA)}}$` : `$t = {1/[A] − 1/[A]_0}/{${kS}} = {{1}/{${m(C)}} − {1}/{${m(A0)}}}/{${m(kA)}}$`;
      pasos.push({ t: `Tiempo hasta [A] = ${f(C)} mol/L`, html: `Despejando de la ley integrada: ${d} = <b>${f(tC, 4)} ${u}</b>` });
    }
    const v0 = k * A0 ** n, v = A > 0 ? k * A ** n : 0;
    pasos.push({ t: 'Velocidad', html: `Al principio $v_0 = k${n ? ` [A]_0${n === 2 ? '^2' : ''}` : ''} = ${m(v0)}$ mol·L⁻¹·${u}⁻¹ y a t = ${f(t)} ${u}, $v = ${m(v)}$ mol·L⁻¹·${u}⁻¹. La gráfica que da una recta es ${L.recta} frente a t.` });
    return { modo: 'orden', n, k, kA, a, kde, A0, t, A, t12, C, tC, v0, v, u, unidad: unidK(n, u), c: (x) => conc(n, kA, A0, x), pasos };
  }

  /* ---------- Orden a partir de datos ---------- */
  function recta(xs, ys) {
    const N = xs.length, mx = xs.reduce((a, b) => a + b, 0) / N, my = ys.reduce((a, b) => a + b, 0) / N;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < N; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
    const b = sxy / sxx, a = my - b * mx, r2 = syy > 0 ? (sxy * sxy) / (sxx * syy) : 1;
    return { a, b, r2 };
  }
  const leeLista = (s, nom) => {
    const xs = String(s ?? '').split(/[;\s]+/).filter(Boolean).map((v) => leeNum(v));
    if (xs.some((v) => !isFinite(v))) throw new Error(`${Mayus(nom)}: hay algún valor que no es un número (sepáralos con espacios o con ;)`);
    return xs;
  };
  // sc: { ts: '0 10 20…', As: '0,5 0,4…', ut }
  function datos(sc) {
    const u = ut(sc), ts = leeLista(sc.ts, 'los tiempos'), As = leeLista(sc.As, 'las concentraciones');
    if (ts.length !== As.length) throw new Error(`Hay ${ts.length} tiempos y ${As.length} concentraciones: tienen que ser los mismos`);
    if (ts.length < 3) throw new Error('Hacen falta al menos tres medidas');
    if (ts.length > 20) throw new Error('Como mucho 20 medidas');
    if (As.some((v) => v <= 0)) throw new Error('Las concentraciones tienen que ser mayores que 0');
    if (ts.some((t, i) => i && t <= ts[i - 1])) throw new Error('Los tiempos tienen que ir de menor a mayor');
    const ys = [As, As.map(Math.log), As.map((v) => 1 / v)], fits = ys.map((y) => recta(ts, y));
    const n = fits.reduce((a, q, i) => (q.r2 > fits[a].r2 ? i : a), 0), F = fits[n];
    const k = n === 2 ? F.b : -F.b, A0 = n === 0 ? F.a : n === 1 ? Math.exp(F.a) : 1 / F.a;
    const pasos = [];
    pasos.push({ t: 'Las tres rectas', html: `Cada orden da una recta distinta frente al tiempo: [A] en orden 0, ln [A] en orden 1 y 1/[A] en orden 2. Ajustando las tres por mínimos cuadrados:<br>${fits.map((q, i) => `${ORD[i]}: $${['[A]', 'ln [A]', '1/[A]'][i]} = ${m(q.a, 4)} ${q.b < 0 ? '−' : '+'} ${m(Math.abs(q.b), 4)} t$, &ensp; $R^2 = ${q.r2.toFixed(5).replace('.', ',')}$`).join('<br>')}` });
    // si la segunda mejor recta se ajusta casi igual, los datos no deciden
    const seg = [0, 1, 2].filter((i) => i !== n).reduce((a, i) => (fits[i].r2 > fits[a].r2 ? i : a), n === 0 ? 1 : 0);
    const aviso = F.r2 - fits[seg].r2 < 0.002 ? `Las rectas de ${['[A]', 'ln [A]', '1/[A]'][n]} y de ${['[A]', 'ln [A]', '1/[A]'][seg]} se ajustan casi igual de bien (R² = ${F.r2.toFixed(4).replace('.', ',')} y ${fits[seg].r2.toFixed(4).replace('.', ',')}): con tan poco avance de la reacción no se distinguen los órdenes. Hacen falta medidas hasta que [A] baje bastante más, o mirar los residuos.` : null;
    pasos.push({ t: 'El orden', html: `La que mejor se ajusta a una recta (R² más cercano a 1) es la de ${['[A]', 'ln [A]', '1/[A]'][n]}: la reacción es de <b>${ORD[n]}</b>.${aviso ? ` <b>Ojo:</b> ${aviso}` : ''}` });
    pasos.push({ t: 'La constante', html: `${n === 2 ? 'La pendiente es +k' : 'La pendiente es −k'}: $k = ${m(k, 4)}$ ${unidK(n, u)}, y la ordenada en el origen da $[A]_0 ≈ ${m(A0, 4)}$ mol/L.` });
    const t12 = vidaMedia(n, k, A0);
    pasos.push({ t: 'Vida media', html: `$${LEY[n].t12} = ${m(t12, 4)}$ ${u}${n === 1 ? ', la misma empiece donde empiece' : ` (con [A]₀ = ${f(A0, 4)} mol/L)`}.` });
    return { modo: 'datos', n, k, A0, t12, fits, aviso, ts, As, u, unidad: unidK(n, u), c: (x) => conc(n, k, A0, x), pasos };
  }

  /* ---------- Velocidades iniciales ---------- */
  // sc: { exps: [{ A, B, C, v }], nr: '1'|'2'|'3' (o conB: true|false, de antes), ut }
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
    if (filas.length < nr + 1) throw new Error(`Hacen falta al menos ${nom}`);
    const E = filas.map((e, i) => { const x = { v: 0 }; for (const L of LETRAS) x[L] = Ls.includes(L) ? lee(e, L, `[${L}] del experimento ${i + 1}`) : 1; x.v = lee(e, 'v', `la velocidad del experimento ${i + 1}`); return x; });
    // mínimos cuadrados en logaritmos: ln v = ln k + m ln[A] + n ln[B] + p ln[C]
    const X = E.map((e) => [1, ...Ls.map((L) => Math.log(e[L]))]), Y = E.map((e) => Math.log(e.v)), q = X[0].length;
    const XtX = Array.from({ length: q }, (_, i) => Array.from({ length: q }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0))), XtY = Array.from({ length: q }, (_, i) => X.reduce((s, r, k) => s + r[i] * Y[k], 0));
    const sol = resuelveN(XtX, XtY);
    if (!sol) throw new Error(nr > 1 ? `Con estos experimentos no se pueden separar los ${nr === 2 ? 'dos' : 'tres'} órdenes: cambia cada reactivo por separado en alguno` : 'Las concentraciones de A tienen que ser distintas');
    const o = { A: 0, B: 0, C: 0 }; Ls.forEach((L, i) => { o[L] = redondea(sol[i + 1]); });
    const pasos = [];
    pasos.push({ t: 'Ley de velocidad', html: `Se escribe $v = k${Ls.map((L, i) => ` [${L}]^${EXPO[i]}`).join('')}$ y se comparan experimentos en los que ${nr > 1 ? 'solo cambia un reactivo' : 'cambia [A]'}: al dividir sus velocidades se va k.` });
    const igual = (x, y) => Math.abs(x - y) <= 1e-9 * Math.abs(x);
    const par = (cambia, fijas) => { for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) if (!igual(E[i][cambia], E[j][cambia]) && fijas.every((F) => igual(E[i][F], E[j][F]))) return [i, j]; return null; };
    const paso = (L, letra) => {
      const fijas = Ls.filter((x) => x !== L), q = par(L, fijas), fT = fijas.map((F) => `[${F}]`).join(' y ');
      if (!q) return `Ningún par de experimentos deja ${fT} igual, así que $${letra}$ sale del ajuste de todos a la vez: $${letra} ≈ ${oTxt(o[L])}$.`;
      const [i, j] = q, a = E[j][L] / E[i][L], b = E[j].v / E[i].v, ex = Math.log(b) / Math.log(a);
      return `Experimentos ${i + 1} y ${j + 1}${fijas.length ? ` (${fT} igual${fijas.length > 1 ? 'es' : ''})` : ''}: $${'{v_' + (j + 1) + '}/{v_' + (i + 1) + '}'} = ({[${L}]_${j + 1}}/{[${L}]_${i + 1}})^${letra}$, &ensp; $${m(b, 4)} = ${m(a, 4)}^${letra}$, &ensp; $${letra} = {ln ${m(b, 4)}}/{ln ${m(a, 4)}} = ${m(ex, 3)}$ → <b>${letra} = ${oTxt(o[L])}</b>`;
    };
    Ls.forEach((L, i) => pasos.push({ t: `Orden respecto de ${L}`, html: paso(L, EXPO[i]) }));
    const vLey = (e) => e.A ** o.A * e.B ** o.B * e.C ** o.C, ks = E.map((e) => e.v / vLey(e)), k = ks.reduce((a, b) => a + b, 0) / ks.length, tot = o.A + o.B + o.C;
    const den = Ls.map((L) => (o[L] === 1 ? `[${L}]` : `[${L}]^{${oTxt(o[L])}}`)).join(' ');
    pasos.push({ t: 'La constante', html: `Con cada experimento, $k = v/(${den})$: ${ks.map((q) => m(q, 4)).join('; ')}. La media es $k = ${m(k, 4)}$ ${unidK(tot, u)}.` });
    const ley = `v = ${m(k, 4)}${Ls.map((L) => pot(L, o[L])).join('')}`;
    pasos.push({ t: 'Resultado', html: `$${ley}$: orden ${Ls.map((L) => `${oTxt(o[L])} respecto de ${L}`).join(', ')}${nr > 1 ? ` y orden total ${oTxt(tot)}` : ''}.` });
    return { modo: 'iniciales', E, nr, conB: nr > 1, oA: o.A, oB: o.B, oC: o.C, tot, k, ks, ley, vLey: (e) => k * vLey(e), u, unidad: unidK(tot, u), pasos };
  }

  /* ---------- Arrhenius ---------- */
  // sc: { tipo: 'ea' (k1, T1, k2, T2) | 'k2' (Ea, k1, T1, T2) | 'ajuste' (Ts, ks), uT: 'K'|'C',
  //       dH (kJ/mol, opcional: diagrama de energía), Eac (kJ/mol, opcional: con catalizador) }
  function arrhenius(sc) {
    const C = sc.uT === 'C', aK = (v, nom) => { const K = C ? v + 273.15 : v; if (!(K > 0)) throw new Error(`${Mayus(nom)} tiene que estar por encima del cero absoluto`); return K; };
    const T = (k, nom) => aK(lee(sc, k, nom, { negativo: C }), nom), tipo = ['k2', 'ajuste'].includes(sc.tipo) ? sc.tipo : 'ea';
    const pasos = [], tK = (v) => `${m(v, 5)} K`;
    let Ea, k1, k2, T1, T2, A, pts = null, r2 = null;
    if (tipo === 'ajuste') {
      const Ts = leeLista(sc.Ts, 'las temperaturas').map((v, i) => aK(v, `la temperatura ${i + 1}`)), ks = leeLista(sc.ks, 'las constantes');
      if (Ts.length !== ks.length) throw new Error(`Hay ${Ts.length} temperaturas y ${ks.length} constantes: tienen que ser las mismas`);
      if (Ts.length < 3) throw new Error('Hacen falta al menos tres temperaturas (con dos, elige «La energía de activación»)');
      if (Ts.length > 20) throw new Error('Como mucho 20 medidas');
      if (ks.some((v) => v <= 0)) throw new Error('Las constantes tienen que ser mayores que 0');
      if (new Set(Ts.map((v) => v.toFixed(6))).size !== Ts.length) throw new Error('Hay temperaturas repetidas');
      const F = recta(Ts.map((v) => 1 / v), ks.map(Math.log));
      Ea = -F.b * R; A = Math.exp(F.a); r2 = F.r2;
      pts = Ts.map((v, i) => ({ T: v, k: ks[i] }));
      const ord = [...pts].sort((a, b) => a.T - b.T); [T1, k1, T2, k2] = [ord[0].T, ord[0].k, ord[ord.length - 1].T, ord[ord.length - 1].k];
      pasos.push({ t: 'Ecuación de Arrhenius', html: `Tomando logaritmos, $ln k = ln A − {E_a}/{R} · {1}/{T}$: ln k frente a 1/T es una recta de pendiente $−E_a/R$, con $R = 8,314$ J/(mol·K)${C ? '. Las temperaturas pasan a kelvin sumando 273,15' : ''}.` });
      pasos.push({ t: 'Tabla', html: `<table class="tabla"><tr><th>T (K)</th><th>1/T (K⁻¹)</th><th>ln k</th></tr>${pts.map((q) => `<tr><td>${f(q.T, 5)}</td><td>${f(1 / q.T, 4)}</td><td>${f(Math.log(q.k), 4)}</td></tr>`).join('')}</table>` });
      pasos.push({ t: 'Recta de mínimos cuadrados', html: `$ln k = ${m(F.a, 4)} ${F.b < 0 ? '−' : '+'} ${m(Math.abs(F.b), 4)} · {1}/{T}$, &ensp; $R^2 = ${F.r2.toFixed(5).replace('.', ',')}$${F.r2 < 0.98 ? ' (los puntos se alejan bastante de la recta: revisa las medidas)' : ''}.` });
      pasos.push({ t: 'Energía de activación', html: `$E_a = −R · pendiente = 8,314 · ${m(-F.b, 4)} = ${m(Ea, 4)}$ J/mol = <b>${f(Ea / 1000, 4)} kJ/mol</b>${Ea < 0 ? '. Sale negativa: la constante baja al calentar, algo raro en una reacción elemental' : ''}` });
      pasos.push({ t: 'Factor de frecuencia', html: `$A = e^{ordenada} = e^{${m(F.a, 4)}} = ${m(A, 4)}$ (mismas unidades que k).` });
    } else {
      k1 = lee(sc, 'k1', 'la constante k₁'); T1 = T('T1', 'la temperatura T₁'); T2 = T('T2', 'la temperatura T₂');
      if (Math.abs(T1 - T2) < 1e-9) throw new Error('Las dos temperaturas tienen que ser distintas');
      pasos.push({ t: 'Ecuación de Arrhenius', html: `$k = A e^{−E_a/(RT)}$, y dividiendo para dos temperaturas: $ln {k_2}/{k_1} = −{E_a}/{R} ({1}/{T_2} − {1}/{T_1})$, con $R = 8,314$ J/(mol·K)${C ? '. Las temperaturas pasan a kelvin: ' + `$T_1 = ${tK(T1)}$, $T_2 = ${tK(T2)}$` : ''}.` });
      if (tipo === 'k2') {
        Ea = lee(sc, 'Ea', 'la energía de activación') * 1000;
        k2 = k1 * Math.exp((-Ea / R) * (1 / T2 - 1 / T1));
        pasos.push({ t: 'Constante a T₂', html: `$ln {k_2}/{${m(k1)}} = −{${m(Ea, 4)}}/{8,314} ({1}/{${m(T2, 5)}} − {1}/{${m(T1, 5)}}) = ${m(Math.log(k2 / k1), 4)}$ → $k_2 = ${m(k1)} · e^{${m(Math.log(k2 / k1), 4)}}$ = <b>${f(k2, 4)}</b>` });
      } else {
        k2 = lee(sc, 'k2', 'la constante k₂');
        Ea = (-R * Math.log(k2 / k1)) / (1 / T2 - 1 / T1);
        pasos.push({ t: 'Energía de activación', html: `$E_a = {−R ln(k_2/k_1)}/{1/T_2 − 1/T_1} = {−8,314 · ln {${m(k2)}}/{${m(k1)}}}/{{1}/{${m(T2, 5)}} − {1}/{${m(T1, 5)}}} = ${m(Ea, 4)}$ J/mol = <b>${f(Ea / 1000, 4)} kJ/mol</b>${Ea < 0 ? '. Sale negativa: la constante baja al calentar, algo raro en una reacción elemental' : ''}` });
      }
      A = k1 / Math.exp(-Ea / (R * T1));
      pasos.push({ t: 'Factor de frecuencia', html: `$A = k_1 e^{E_a/(R T_1)} = ${m(A, 4)}$ (mismas unidades que k).` });
    }
    const r = k2 / k1, tC = (v) => `${f(C ? v - 273.15 : v, 4)} ${C ? '°C' : 'K'}`;
    pasos.push({ t: 'Cuánto cambia', html: `De ${tC(T1)} a ${tC(T2)} la constante se multiplica por ${f(r, 4)}. En la gráfica de ln k frente a 1/T sale una recta de pendiente $−E_a/R = ${m(-Ea / R, 4)}$ K.` });
    // catalizador: misma A, menor Eₐ
    const Eac = lee(sc, 'Eac', 'la energía de activación con catalizador', { opcional: true });
    let fcat = null;
    if (Eac !== null) {
      if (!(Eac * 1000 < Ea)) throw new Error('Con catalizador la energía de activación tiene que ser menor que sin él');
      fcat = Math.exp((Ea - Eac * 1000) / (R * T1));
      pasos.push({ t: 'Con catalizador', html: `El catalizador abre otro camino con menor barrera y, si A no cambia, $${'{k_{cat}}/{k}'} = e^{(E_a − E_{a,cat})/(R T)} = e^{${m(Ea - Eac * 1000, 4)}/(8,314 · ${m(T1, 5)})}$ = <b>${f(fcat, 4)}</b> a ${tC(T1)}. No cambia ΔH ni el equilibrio: acelera igual la reacción directa y la inversa.` });
    }
    const dH = lee(sc, 'dH', 'la entalpía de reacción', { opcional: true, negativo: true });
    if (dH !== null) {
      const Ei = Ea / 1000 - dH;
      pasos.push({ t: 'Diagrama de energía', html: `Los productos quedan ${f(Math.abs(dH), 4)} kJ/mol ${dH < 0 ? 'por debajo' : 'por encima'} de los reactivos (reacción ${dH < 0 ? 'exotérmica' : dH > 0 ? 'endotérmica' : 'sin calor de reacción'}). La reacción inversa tiene que subir desde los productos: $E_{a,inv} = E_a − ΔH = ${m(Ea / 1000, 4)} − (${m(dH, 4)}) = ${m(Ei, 4)}$ kJ/mol${Ei <= 0 ? '. Sale menor o igual que 0: ΔH no puede ser mayor que Eₐ' : ''}.` });
      if (Ei <= 0) throw new Error('La entalpía de reacción no puede ser mayor que la energía de activación');
    }
    return { modo: 'arrhenius', tipo, k1, k2, T1, T2, Ea, A, r, r2, pts, Eac: Eac === null ? null : Eac * 1000, fcat, dH, uT: C ? 'C' : 'K', k: (T) => A * Math.exp(-Ea / (R * T)), pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'datos') return datos(sc);
    if (sc.modo === 'iniciales') return iniciales(sc);
    if (sc.modo === 'arrhenius') return arrhenius(sc);
    return orden(sc);
  }

  const ejemplos = [
    { clave: 'primer-orden', nombre: 'Orden 1: descomposición del N₂O₅', sc: { modo: 'orden', n: '1', k: '5,1e-4', A0: '0,25', t: '3600', C: '0,05', ut: 's' } },
    { clave: 'orden-cero', nombre: 'Orden 0: descomposición catalizada', sc: { modo: 'orden', n: '0', k: '0,002', A0: '0,5', t: '120', C: '0,1', ut: 's' } },
    { clave: 'segundo-orden', nombre: 'Orden 2: 2 NO₂ → 2 NO + O₂', sc: { modo: 'orden', n: '2', k: '0,54', A0: '0,05', t: '60', C: '0,01', ut: 's' } },
    { clave: 'farmaco', nombre: 'Orden 1 con el tiempo en horas', sc: { modo: 'orden', n: '1', k: '0,173', A0: '20', t: '8', C: '2', ut: 'h' } },
    { clave: 'datos-1', nombre: 'Datos: H₂O₂ que se descompone', sc: { modo: 'datos', ts: '0 10 20 30 40 50', As: '1 0,707 0,5 0,354 0,25 0,177', ut: 'min' } },
    { clave: 'datos-2', nombre: 'Datos: reacción de segundo orden', sc: { modo: 'datos', ts: '0 50 100 150 200 300', As: '0,1 0,0667 0,05 0,04 0,0333 0,025', ut: 's' } },
    { clave: 'coef-2', nombre: 'Orden 2 con 2 A → productos', sc: { modo: 'orden', n: '2', a: '2', k: '0,27', A0: '0,05', t: '60', C: '0,01', ut: 's' } },
    { clave: 'k-vida-media', nombre: 'k a partir de la vida media (C-14)', sc: { modo: 'orden', n: '1', kde: 't12', t12: '5730', A0: '100', t: '10000', C: '25', ut: 'a' } },
    { clave: 'k-porcentaje', nombre: 'k a partir de un 75 % reaccionado', sc: { modo: 'orden', n: '1', kde: 'pct', pct: '75', tp: '40', A0: '0,2', t: '60', C: '', ut: 'min' } },
    { clave: 'k-dos-medidas', nombre: 'k a partir de dos medidas (orden 2)', sc: { modo: 'orden', n: '2', kde: 'med', t1: '10', A1: '0,08', t2: '50', A2: '0,04', A0: '0,1', t: '100', C: '', ut: 's' } },
    { clave: 'datos-0', nombre: 'Datos: orden 0', sc: { modo: 'datos', ts: '0 5 10 15 20', As: '0,8 0,7 0,6 0,5 0,4', ut: 'min' } },
    { clave: 'iniciales-2', nombre: 'Velocidades iniciales: 2 NO + O₂', sc: { modo: 'iniciales', conB: true, ut: 's', exps: [{ A: '0,01', B: '0,01', v: '2,5e-5' }, { A: '0,02', B: '0,01', v: '1e-4' }, { A: '0,01', B: '0,02', v: '5e-5' }] } },
    { clave: 'iniciales-abc', nombre: 'Velocidades iniciales con tres reactivos', sc: { modo: 'iniciales', nr: '3', ut: 's', exps: [{ A: '0,1', B: '0,1', C: '0,1', v: '2e-3' }, { A: '0,2', B: '0,1', C: '0,1', v: '4e-3' }, { A: '0,1', B: '0,2', C: '0,1', v: '8e-3' }, { A: '0,1', B: '0,1', C: '0,2', v: '2e-3' }] } },
    { clave: 'iniciales-1', nombre: 'Velocidades iniciales con un reactivo', sc: { modo: 'iniciales', conB: false, ut: 's', exps: [{ A: '0,1', v: '0,004' }, { A: '0,2', v: '0,008' }, { A: '0,4', v: '0,016' }] } },
    { clave: 'iniciales-3', nombre: 'Velocidades iniciales: orden 1 y 2', sc: { modo: 'iniciales', conB: true, ut: 's', exps: [{ A: '0,1', B: '0,1', v: '0,02' }, { A: '0,2', B: '0,1', v: '0,04' }, { A: '0,1', B: '0,2', v: '0,08' }, { A: '0,3', B: '0,3', v: '0,54' }] } },
    { clave: 'arrhenius-ea', nombre: 'Arrhenius: energía de activación', sc: { modo: 'arrhenius', tipo: 'ea', uT: 'K', k1: '3,46e-5', T1: '298', k2: '9,63e-4', T2: '328' } },
    { clave: 'arrhenius-k2', nombre: 'Arrhenius: k a otra temperatura', sc: { modo: 'arrhenius', tipo: 'k2', uT: 'C', Ea: '50', k1: '0,01', T1: '25', T2: '35' } },
    { clave: 'arrhenius-ajuste', nombre: 'Arrhenius: ajuste a cinco temperaturas', sc: { modo: 'arrhenius', tipo: 'ajuste', uT: 'K', Ts: '300 310 320 330 340', ks: '7,9e-4 2,1e-3 5,3e-3 1,25e-2 2,8e-2' } },
    { clave: 'arrhenius-cat', nombre: 'Arrhenius: catalizador y diagrama de energía', sc: { modo: 'arrhenius', tipo: 'k2', uT: 'K', Ea: '75', k1: '2e-4', T1: '298', T2: '318', Eac: '50', dH: '-40' } },
  ];

  return { resolver, orden, datos, iniciales, arrhenius, conc, vidaMedia, tiempo, recta, ejemplos, f, unidK, unidT: (u) => UT[u] || 's', R };
})();
if (typeof module !== 'undefined') module.exports = Cinetica;
