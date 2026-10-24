/* =====================================================================
   Cinética química (sin DOM):
   · leyes integradas de orden 0, 1 y 2 para A → productos: [A](t), vida
     media y tiempo para llegar a una concentración;
   · orden y constante a partir de datos [A] frente a t (las tres rectas
     [A], ln[A] y 1/[A] frente a t, con su coeficiente R²);
   · método de las velocidades iniciales, v = k [A]^m [B]^n;
   · ecuación de Arrhenius: energía de activación con dos temperaturas, o
     la constante a otra temperatura.
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
  const UT = { s: 's', min: 'min', h: 'h' };
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

  // sc: { n: '0'|'1'|'2', k, A0, t, C (opcional), ut }
  function orden(sc) {
    const n = Math.round(leeNum(sc.n));
    if (![0, 1, 2].includes(n)) throw new Error('El orden tiene que ser 0, 1 o 2');
    const u = ut(sc), k = lee(sc, 'k', 'la constante k'), A0 = lee(sc, 'A0', 'la concentración inicial'), t = lee(sc, 't', 'el tiempo', { cero: true });
    const C = lee(sc, 'C', 'la concentración final', { opcional: true });
    if (C !== null && !(C < A0)) throw new Error('La concentración que se quiere alcanzar tiene que ser menor que la inicial');
    const A = conc(n, k, A0, t), t12 = vidaMedia(n, k, A0), L = LEY[n], pasos = [];
    pasos.push({ t: 'Ley de velocidad', html: `Para una reacción de ${ORD[n]}, $${L.dif}$, con $k = ${m(k)}$ ${unidK(n, u)}. Integrando entre 0 y t: $${L.int}$` });
    const sust = n === 0 ? `$[A] = ${m(A0)} − ${m(k)} · ${m(t)}$` : n === 1 ? `$[A] = [A]_0 e^{−kt} = ${m(A0)} · e^{−${m(k)} · ${m(t)}}$` : `$${'{1}/{[A]}'} = {1}/{${m(A0)}} + ${m(k)} · ${m(t)} = ${m(1 / A)}$`;
    const agot = n === 0 && A0 - k * t <= 0;
    pasos.push({ t: `Concentración a t = ${f(t)} ${u}`, html: `${sust}${agot ? `, que saldría negativa: el reactivo se acaba en $t = [A]_0/k = ${m(A0 / k)}$ ${u}, así que` : ''} → $[A] = ${m(A, 4)}$ mol/L (queda el ${f((100 * A) / A0, 3)} %)` });
    pasos.push({ t: 'Vida media', html: `Es el tiempo en el que [A] baja a la mitad: $${L.t12} = ${m(t12, 4)}$ ${u}. ${n === 1 ? 'En orden 1 no depende de la concentración: cada vida media se reduce a la mitad lo que quede.' : n === 0 ? 'En orden 0 es proporcional a [A]₀: cada vida media es la mitad de la anterior.' : 'En orden 2 es inversamente proporcional a [A]₀: cada vida media dura el doble que la anterior.'}` });
    let tC = null;
    if (C !== null) {
      tC = tiempo(n, k, A0, C);
      const d = n === 0 ? `$t = {[A]_0 − [A]}/{k} = {${m(A0)} − ${m(C)}}/{${m(k)}}$` : n === 1 ? `$t = {ln([A]_0/[A])}/{k} = {ln {${m(A0)}}/{${m(C)}}}/{${m(k)}}$` : `$t = {1/[A] − 1/[A]_0}/{k} = {{1}/{${m(C)}} − {1}/{${m(A0)}}}/{${m(k)}}$`;
      pasos.push({ t: `Tiempo hasta [A] = ${f(C)} mol/L`, html: `Despejando de la ley integrada: ${d} = <b>${f(tC, 4)} ${u}</b>` });
    }
    const v0 = k * A0 ** n, v = A > 0 ? k * A ** n : 0;
    pasos.push({ t: 'Velocidad', html: `Al principio $v_0 = k${n ? ` [A]_0${n === 2 ? '^2' : ''}` : ''} = ${m(v0)}$ mol·L⁻¹·${u}⁻¹ y a t = ${f(t)} ${u}, $v = ${m(v)}$ mol·L⁻¹·${u}⁻¹. La gráfica que da una recta es ${L.recta} frente a t.` });
    return { modo: 'orden', n, k, A0, t, A, t12, C, tC, v0, v, u, unidad: unidK(n, u), c: (x) => conc(n, k, A0, x), pasos };
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
    pasos.push({ t: 'El orden', html: `La que mejor se ajusta a una recta (R² más cercano a 1) es la de ${['[A]', 'ln [A]', '1/[A]'][n]}: la reacción es de <b>${ORD[n]}</b>.` });
    pasos.push({ t: 'La constante', html: `${n === 2 ? 'La pendiente es +k' : 'La pendiente es −k'}: $k = ${m(k, 4)}$ ${unidK(n, u)}, y la ordenada en el origen da $[A]_0 ≈ ${m(A0, 4)}$ mol/L.` });
    const t12 = vidaMedia(n, k, A0);
    pasos.push({ t: 'Vida media', html: `$${LEY[n].t12} = ${m(t12, 4)}$ ${u}${n === 1 ? ', la misma empiece donde empiece' : ` (con [A]₀ = ${f(A0, 4)} mol/L)`}.` });
    return { modo: 'datos', n, k, A0, t12, fits, ts, As, u, unidad: unidK(n, u), c: (x) => conc(n, k, A0, x), pasos };
  }

  /* ---------- Velocidades iniciales ---------- */
  // sc: { exps: [{ A, B, v }], conB: true|false, ut }
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
  function iniciales(sc) {
    const u = ut(sc), conB = !!sc.conB, filas = (sc.exps || []).filter((e) => !vacio(e.A) || !vacio(e.v) || (conB && !vacio(e.B)));
    if (filas.length < (conB ? 3 : 2)) throw new Error(`Hacen falta al menos ${conB ? 'tres experimentos (dos reactivos)' : 'dos experimentos'}`);
    const E = filas.map((e, i) => ({ A: lee(e, 'A', `[A] del experimento ${i + 1}`), B: conB ? lee(e, 'B', `[B] del experimento ${i + 1}`) : 1, v: lee(e, 'v', `la velocidad del experimento ${i + 1}`) }));
    // mínimos cuadrados en logaritmos: ln v = ln k + m ln[A] + n ln[B]
    const X = E.map((e) => (conB ? [1, Math.log(e.A), Math.log(e.B)] : [1, Math.log(e.A)])), Y = E.map((e) => Math.log(e.v)), p = X[0].length;
    const XtX = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0))), XtY = Array.from({ length: p }, (_, i) => X.reduce((s, r, k) => s + r[i] * Y[k], 0));
    const sol = resuelveN(XtX, XtY);
    if (!sol) throw new Error(conB ? 'Con estos experimentos no se pueden separar los dos órdenes: cambia [A] y [B] por separado en alguno' : 'Las concentraciones de A tienen que ser distintas');
    const oA = redondea(sol[1]), oB = conB ? redondea(sol[2]) : 0;
    const pasos = [];
    pasos.push({ t: 'Ley de velocidad', html: `Se escribe $v = k [A]^m${conB ? ' [B]^n' : ''}$ y se comparan experimentos en los que ${conB ? 'solo cambia un reactivo' : 'cambia [A]'}: al dividir sus velocidades se va k.` });
    const par = (cambia, fija) => { for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) if (Math.abs(E[i][cambia] - E[j][cambia]) > 1e-12 * E[i][cambia] && (!fija || Math.abs(E[i][fija] - E[j][fija]) <= 1e-9 * E[i][fija])) return [i, j]; return null; };
    const paso = (L, o, cambia, fija, letra) => {
      const q = par(cambia, fija);
      if (!q) return `Ningún par de experimentos deja ${fija === 'B' ? '[B]' : '[A]'} fija, así que $${letra}$ sale del ajuste de todos a la vez: $${letra} ≈ ${oTxt(o)}$.`;
      const [i, j] = q, a = E[j][cambia] / E[i][cambia], b = E[j].v / E[i].v, ex = Math.log(b) / Math.log(a);
      return `Experimentos ${i + 1} y ${j + 1}${fija ? ` ([${fija}] igual)` : ''}: $${'{v_' + (j + 1) + '}/{v_' + (i + 1) + '}'} = ({[${L}]_${j + 1}}/{[${L}]_${i + 1}})^${letra}$, &ensp; $${m(b, 4)} = ${m(a, 4)}^${letra}$, &ensp; $${letra} = {ln ${m(b, 4)}}/{ln ${m(a, 4)}} = ${m(ex, 3)}$ → <b>${letra} = ${oTxt(o)}</b>`;
    };
    pasos.push({ t: 'Orden respecto de A', html: paso('A', oA, 'A', conB ? 'B' : null, 'm') });
    if (conB) pasos.push({ t: 'Orden respecto de B', html: paso('B', oB, 'B', 'A', 'n') });
    const ks = E.map((e) => e.v / (e.A ** oA * e.B ** oB)), k = ks.reduce((a, b) => a + b, 0) / ks.length, tot = oA + oB;
    pasos.push({ t: 'La constante', html: `Con cada experimento, $k = v/(${oA === 1 ? '[A]' : `[A]^{${oTxt(oA)}}`}${conB ? (oB === 1 ? ' [B]' : ` [B]^{${oTxt(oB)}}`) : ''})$: ${ks.map((q) => m(q, 4)).join('; ')}. La media es $k = ${m(k, 4)}$ ${unidK(tot, u)}.` });
    const ley = `v = ${m(k, 4)} ${oA ? `[A]${oA === 1 ? '' : `^{${oTxt(oA)}}`}` : ''}${oB ? ` [B]${oB === 1 ? '' : `^{${oTxt(oB)}}`}` : ''}`.replace(/ $/, '');
    pasos.push({ t: 'Resultado', html: `$${ley}$: orden ${oTxt(oA)} respecto de A${conB ? `, ${oTxt(oB)} respecto de B` : ''} y orden total ${oTxt(tot)}.` });
    return { modo: 'iniciales', E, conB, oA, oB, tot, k, ks, ley, u, unidad: unidK(tot, u), pasos };
  }

  /* ---------- Arrhenius ---------- */
  // sc: { tipo: 'ea' (k1, T1, k2, T2) | 'k2' (Ea, k1, T1, T2), uT: 'K'|'C', ... }
  function arrhenius(sc) {
    const C = sc.uT === 'C', T = (k, nom) => { const v = lee(sc, k, nom, { negativo: C }); const K = C ? v + 273.15 : v; if (!(K > 0)) throw new Error(`${Mayus(nom)} tiene que estar por encima del cero absoluto`); return K; };
    const k1 = lee(sc, 'k1', 'la constante k₁'), T1 = T('T1', 'la temperatura T₁'), T2 = T('T2', 'la temperatura T₂');
    if (Math.abs(T1 - T2) < 1e-9) throw new Error('Las dos temperaturas tienen que ser distintas');
    const pasos = [], tK = (v) => `${m(v, 5)} K`;
    pasos.push({ t: 'Ecuación de Arrhenius', html: `$k = A e^{−E_a/(RT)}$, y dividiendo para dos temperaturas: $ln {k_2}/{k_1} = −{E_a}/{R} ({1}/{T_2} − {1}/{T_1})$, con $R = 8,314$ J/(mol·K)${C ? '. Las temperaturas pasan a kelvin: ' + `$T_1 = ${tK(T1)}$, $T_2 = ${tK(T2)}$` : ''}.` });
    let Ea, k2;
    if (sc.tipo === 'k2') {
      Ea = lee(sc, 'Ea', 'la energía de activación') * 1000;
      k2 = k1 * Math.exp((-Ea / R) * (1 / T2 - 1 / T1));
      pasos.push({ t: 'Constante a T₂', html: `$ln {k_2}/{${m(k1)}} = −{${m(Ea, 4)}}/{8,314} ({1}/{${m(T2, 5)}} − {1}/{${m(T1, 5)}}) = ${m(Math.log(k2 / k1), 4)}$ → $k_2 = ${m(k1)} · e^{${m(Math.log(k2 / k1), 4)}}$ = <b>${f(k2, 4)}</b>` });
    } else {
      k2 = lee(sc, 'k2', 'la constante k₂');
      Ea = (-R * Math.log(k2 / k1)) / (1 / T2 - 1 / T1);
      pasos.push({ t: 'Energía de activación', html: `$E_a = {−R ln(k_2/k_1)}/{1/T_2 − 1/T_1} = {−8,314 · ln {${m(k2)}}/{${m(k1)}}}/{{1}/{${m(T2, 5)}} − {1}/{${m(T1, 5)}}} = ${m(Ea, 4)}$ J/mol = <b>${f(Ea / 1000, 4)} kJ/mol</b>${Ea < 0 ? '. Sale negativa: la constante baja al calentar, algo raro en una reacción elemental' : ''}` });
    }
    const A = k1 / Math.exp(-Ea / (R * T1)), r = k2 / k1;
    pasos.push({ t: 'Factor de frecuencia', html: `$A = k_1 e^{E_a/(R T_1)} = ${m(A, 4)}$ (mismas unidades que k).` });
    pasos.push({ t: 'Cuánto cambia', html: `De ${f(C ? T1 - 273.15 : T1, 4)} ${C ? '°C' : 'K'} a ${f(C ? T2 - 273.15 : T2, 4)} ${C ? '°C' : 'K'} la constante se multiplica por ${f(r, 4)}. En la gráfica de ln k frente a 1/T sale una recta de pendiente $−E_a/R = ${m(-Ea / R, 4)}$ K.` });
    return { modo: 'arrhenius', tipo: sc.tipo === 'k2' ? 'k2' : 'ea', k1, k2, T1, T2, Ea, A, r, uT: C ? 'C' : 'K', k: (T) => A * Math.exp(-Ea / (R * T)), pasos };
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
    { clave: 'datos-0', nombre: 'Datos: orden 0', sc: { modo: 'datos', ts: '0 5 10 15 20', As: '0,8 0,7 0,6 0,5 0,4', ut: 'min' } },
    { clave: 'iniciales-2', nombre: 'Velocidades iniciales: 2 NO + O₂', sc: { modo: 'iniciales', conB: true, ut: 's', exps: [{ A: '0,01', B: '0,01', v: '2,5e-5' }, { A: '0,02', B: '0,01', v: '1e-4' }, { A: '0,01', B: '0,02', v: '5e-5' }] } },
    { clave: 'iniciales-1', nombre: 'Velocidades iniciales con un reactivo', sc: { modo: 'iniciales', conB: false, ut: 's', exps: [{ A: '0,1', v: '0,004' }, { A: '0,2', v: '0,008' }, { A: '0,4', v: '0,016' }] } },
    { clave: 'iniciales-3', nombre: 'Velocidades iniciales: orden 1 y 2', sc: { modo: 'iniciales', conB: true, ut: 's', exps: [{ A: '0,1', B: '0,1', v: '0,02' }, { A: '0,2', B: '0,1', v: '0,04' }, { A: '0,1', B: '0,2', v: '0,08' }, { A: '0,3', B: '0,3', v: '0,54' }] } },
    { clave: 'arrhenius-ea', nombre: 'Arrhenius: energía de activación', sc: { modo: 'arrhenius', tipo: 'ea', uT: 'K', k1: '3,46e-5', T1: '298', k2: '9,63e-4', T2: '328' } },
    { clave: 'arrhenius-k2', nombre: 'Arrhenius: k a otra temperatura', sc: { modo: 'arrhenius', tipo: 'k2', uT: 'C', Ea: '50', k1: '0,01', T1: '25', T2: '35' } },
  ];

  return { resolver, orden, datos, iniciales, arrhenius, conc, vidaMedia, tiempo, recta, ejemplos, f, unidK, R };
})();
if (typeof module !== 'undefined') module.exports = Cinetica;
