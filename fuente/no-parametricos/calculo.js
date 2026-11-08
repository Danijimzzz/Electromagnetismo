/* =====================================================================
   Contrastes no paramétricos (sin DOM): la U de Mann-Whitney para dos
   muestras independientes y el test de Wilcoxon de los rangos con signo
   para datos apareados o para la mediana de una muestra. Trabajan con los
   rangos (con la media de los rangos en los empates). El p-valor sale
   exacto, contando todas las ordenaciones, si no hay empates y las
   muestras son pequeñas; si no, con la aproximación normal, con la
   corrección de empates y, si se pide, la de continuidad. Además: Kruskal-Wallis
   con las comparaciones de Dunn (Bonferroni o Holm), el test de los signos,
   Spearman y Kendall como contrastes, y para Mann-Whitney y Wilcoxon el tamaño
   del efecto (r, probabilidad de superioridad) y el estimador de Hodges-Lehmann
   con su intervalo (como wilcox.test de R). La normal sale de
   estadistica/calculo.js, Spearman y Kendall de estadistica/inferencia.js;
   formato y lectura en calculadora.js; interfaz en no-parametricos/app.js.
   ===================================================================== */
const NoParametricos = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const IN = typeof Inferencia !== 'undefined' ? Inferencia : require('../estadistica/inferencia.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista, filas } = K, N01 = { mu: 0, sigma: 1 };
  const suma = (v) => v.reduce((a, b) => a + b, 0);
  const TIPOS = { mw: 'U de Mann-Whitney (dos muestras independientes)', pares: 'Wilcoxon de datos apareados', mediana: 'Wilcoxon para la mediana de una muestra', kw: 'Kruskal-Wallis (tres o más grupos) con Dunn', signos: 'Test de los signos (datos apareados)', signosmed: 'Test de los signos para la mediana', correlacion: 'Spearman y Kendall (correlación por rangos)' };
  const POST = { no: 'No', holm: 'Dunn con Holm', bonferroni: 'Dunn con Bonferroni' };
  const H1 = { dos: 'Distintas (bilateral)', mayor: 'La primera es mayor (unilateral)', menor: 'La primera es menor (unilateral)' };
  const sumaTxt = (t) => (t.length > 5 ? [...t.slice(0, 3), '…', t[t.length - 1]] : t).join(' + ');

  // rangos de v (1 = el menor) con la media de los rangos en los empates; t: tamaños de los empates
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
  // cuántos subconjuntos de {1..N} de tamaño n tienen suma s (n1 = tamaño); devuelve las cuentas por suma
  function cuentaSumas(N, n) {
    const c = Array.from({ length: n + 1 }, () => new Map()); c[0].set(0, 1);
    for (let v = 1; v <= N; v++) for (let j = Math.min(n, v); j >= 1; j--) for (const [s, q] of [...c[j - 1]]) c[j].set(s + v, (c[j].get(s + v) || 0) + q);
    return c[n];
  }
  // P(X ≤ x) y P(X ≥ x) de una distribución de cuentas (Map suma → casos)
  function colas(cuentas, x) {
    let tot = 0, le = 0, ge = 0;
    for (const [s, q] of cuentas) { tot += q; if (s <= x + 1e-9) le += q; if (s >= x - 1e-9) ge += q; }
    return { le: le / tot, ge: ge / tot };
  }
  const alfaDe = (sc) => lee(sc, 'alfa', 'el nivel de significación α', { min: 0, minEx: true, max: 0.5, maxEx: true });

  // p-valor a partir de las colas exactas o de z
  function pvalor(h1, le, ge) { return h1 === 'mayor' ? ge : h1 === 'menor' ? le : Math.min(1, 2 * Math.min(le, ge)); }
  function pnormal(h1, d, sigma, cc) {
    // d = estadístico − media; la corrección de continuidad acerca d a 0 en medio punto
    const dc = cc ? (h1 === 'dos' ? Math.sign(d) * Math.max(0, Math.abs(d) - 0.5) : h1 === 'mayor' ? d - 0.5 : d + 0.5) : d;
    const z = dc / sigma;
    return { z, p: h1 === 'mayor' ? ES.DIST.normal.sf(N01, z) : h1 === 'menor' ? ES.DIST.normal.cdf(N01, z) : Math.min(1, 2 * ES.DIST.normal.sf(N01, Math.abs(z))) };
  }


  // menor q con P(X ≤ q) ≥ p en una distribución de cuentas (qwilcox / qsignrank de R)
  function cuantilCuentas(cuentas, p) {
    const ks = [...cuentas.keys()].sort((a, b) => a - b), tot = suma([...cuentas.values()]); let acu = 0;
    for (const k of ks) { acu += cuentas.get(k) / tot; if (acu >= p - 1e-12) return k; }
    return ks[ks.length - 1];
  }
  const mediana = (v) => { const o = [...v].sort((a, b) => a - b), m = o.length >> 1; return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };
  // estimador de Hodges-Lehmann: la mediana de las diferencias x_i − y_j (dos muestras) o de las medias de Walsh (una muestra); IC como wilcox.test de R
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
    if (n1 < 1 || n2 < 1) throw new Error('Escribe datos en las dos muestras');
    const todos = [...x, ...y], { r, t, corr } = rangos(todos);
    const R1 = suma(r.slice(0, n1)), R2 = suma(r.slice(n1)), U1 = R1 - (n1 * (n1 + 1)) / 2, U2 = n1 * n2 - U1, mu = (n1 * n2) / 2;
    const exacto = sc.exacto !== 'no' && !t.length && n1 <= 20 && n2 <= 20, cc = sc.cc !== 'no';
    let p, z = null, sigma = null;
    if (exacto) {
      const cs = new Map([...cuentaSumas(N, n1)].map(([s, q]) => [s - (n1 * (n1 + 1)) / 2, q])), c = colas(cs, U1);
      p = pvalor(h1, c.le, c.ge);
    } else {
      sigma = Math.sqrt(((n1 * n2) / 12) * (N + 1 - corr / (N * (N - 1))));
      if (!(sigma > 0)) throw new Error('Todos los datos son iguales: no se puede hacer el contraste');
      ({ z, p } = pnormal(h1, U1 - mu, sigma, cc));
    }
    const orden = todos.map((v, i) => ({ v, g: i < n1 ? 1 : 2, r: r[i] })).sort((a, b) => a.v - b.v || a.g - b.g);
    const pasos = [];
    pasos.push({ t: 'Hipótesis', html: `$H_0$: las dos poblaciones son iguales (ninguna tiende a dar valores mayores), frente a $H_1$: ${{ dos: 'la distribución de la muestra 1 está desplazada respecto de la 2', mayor: 'la muestra 1 tiende a dar valores mayores que la 2', menor: 'la muestra 1 tiende a dar valores menores que la 2' }[h1]}; con $α = ${f(alfa)}$, $n_1 = ${n1}$ y $n_2 = ${n2}$.` });
    pasos.push({ t: 'Rangos', html: `Se ordenan los ${N} datos juntos y se les da su rango (1 al menor${t.length ? '; a los empates, la media de los rangos que ocupan' : ''}). Sumando los de cada muestra: $R_1 = ${sumaTxt(r.slice(0, n1).map((v) => f(v)))} = ${f(R1)}$ y $R_2 = ${f(R2)}$ (comprobación: $R_1 + R_2 = N(N + 1)/2 = ${f(R1 + R2)}$).` });
    pasos.push({ t: 'Estadístico U', html: `$U_1 = R_1 − {n_1(n_1 + 1)}/2 = ${f(R1)} − ${f((n1 * (n1 + 1)) / 2)} = ${f(U1)}$ y $U_2 = n_1 n_2 − U_1 = ${f(U2)}$. Si $H_0$ es cierta, $U_1$ ronda $n_1 n_2/2 = ${f(mu)}$.` });
    if (exacto) pasos.push({ t: 'p-valor exacto', html: `No hay empates y las muestras son pequeñas: se cuentan las $\\binom{${N}}{${n1}}$ formas de repartir los rangos entre las dos muestras. ${h1 === 'mayor' ? `$p = P(U_1 ≥ ${f(U1)}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(U_1 ≤ ${f(U1)}) = ${ES.prob(p)}$` : `$p = 2 · P(\\text{cola más pequeña}) = ${ES.prob(p)}$`}.` });
    else pasos.push({ t: 'Aproximación normal', html: `Con $H_0$, $U_1$ es casi normal de media $${f(mu)}$ y $σ = √({n_1 n_2}/12 · (N + 1${t.length ? ' − {∑ (t^3 − t)}/{N(N − 1)}' : ''})) = ${f(sigma)}$${t.length ? ' (con la corrección de empates)' : ''}.<br>$z = {U_1 − μ${cc ? ' ∓ 0,5' : ''}}/σ = ${f(z)}$ y $p = ${ES.prob(p)}$.` });
    const zEf = (U1 - mu) / Math.sqrt(((n1 * n2) / 12) * (N + 1 - corr / (N * (N - 1)))), rEf = Math.abs(zEf) / Math.sqrt(N), psup = U1 / (n1 * n2);
    const difs = []; for (const a of x) for (const b of y) difs.push(a - b);
    const M = n1 * n2, hl = hodges(difs, M, mu, Math.sqrt(((n1 * n2) / 12) * (N + 1)), exacto, exacto ? new Map([...cuentaSumas(N, n1)].map(([q, c]) => [q - (n1 * (n1 + 1)) / 2, c])) : null, alfa);
    pasos.push({ t: 'Tamaño del efecto', html: `Probabilidad de superioridad: $P(X > Y) + ½ P(X = Y) = U_1/(n_1 n_2) = ${f(U1)}/${f(n1 * n2)} = ${f(psup)}$ (0,5 = sin diferencia). Correlación biserial de rangos: $r_b = 2 U_1/(n_1 n_2) − 1 = ${f(2 * psup - 1)}$. Tamaño del efecto $r = |z|/√N = ${f(rEf)}$ (0,1 pequeño, 0,3 mediano, 0,5 grande).` });
    pasos.push({ t: 'Estimador de Hodges-Lehmann', html: `La diferencia típica entre las dos muestras es la mediana de las $n_1 n_2 = ${M}$ diferencias $x_i − y_j$: <b>${f(hl.est)}</b>${isFinite(hl.lo) ? `, con un intervalo de confianza del ${nivel(alfa)} % de $(${f(hl.lo)}; ${f(hl.hi)})$ (${exacto ? 'exacto' : 'por la aproximación normal'}, tomando las diferencias ordenadas que dejan $α/2$ a cada lado)` : ''}.` });
    pasos.push({ t: 'Conclusión', html: p < alfa ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: hay diferencias entre las dos muestras.` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: no hay evidencia de diferencias entre las dos muestras.` });
    return { tipo: 'mw', h1, x, y, n1, n2, R1, R2, U1, U2, mu, z, sigma, p, exacto, rEf, psup, hl, zEf, empates: t.length > 0, orden, rechaza: p < alfa, alfa, pasos, est: U1 };
  }

  function wilcoxon(sc, alfa, pares) {
    const h1 = H1[sc.h1] ? sc.h1 : 'dos';
    let ds, filasT;
    if (pares) {
      filasT = filas(sc.datos, 2, 'los datos apareados');
      if (!filasT.length) throw new Error('Falta la tabla de pares «antes después»');
      ds = filasT.map(([a, b]) => ({ a, b, d: a - b }));
    } else {
      const x = lista(sc.datos, 'la muestra'), m0 = lee(sc, 'm0', 'la mediana de H₀');
      if (!x.length) throw new Error('Falta la muestra');
      ds = x.map((a) => ({ a, b: m0, d: a - m0 })); filasT = null;
    }
    const nTotal = ds.length, nz = ds.filter((q) => q.d !== 0), n = nz.length;
    if (n < 1) throw new Error('Todas las diferencias son 0: no se puede hacer el contraste');
    const { r, t, corr } = rangos(nz.map((q) => Math.abs(q.d)));
    nz.forEach((q, i) => { q.r = r[i]; });
    const Wp = suma(nz.filter((q) => q.d > 0).map((q) => q.r)), Wm = suma(nz.filter((q) => q.d < 0).map((q) => q.r)), mu = (n * (n + 1)) / 4;
    const exacto = sc.exacto !== 'no' && !t.length && n <= 25, cc = sc.cc !== 'no';
    let p, z = null, sigma = null;
    if (exacto) {
      // W⁺ vale la suma de un subconjunto cualquiera de {1..n}: 2ⁿ casos igual de probables
      let cs = new Map([[0, 1]]);
      for (let v = 1; v <= n; v++) { const nu = new Map(cs); for (const [s, q] of cs) nu.set(s + v, (nu.get(s + v) || 0) + q); cs = nu; }
      const c = colas(cs, Wp); p = pvalor(h1, c.le, c.ge);
    } else {
      sigma = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - corr / 48);
      ({ z, p } = pnormal(h1, Wp - mu, sigma, cc));
    }
    const pasos = [], dif = pares ? 'd_i = x_i − y_i' : 'd_i = x_i − m_0';
    pasos.push({ t: 'Hipótesis', html: pares
      ? `$H_0$: la mediana de las diferencias es 0 (no hay cambio entre las dos medidas), frente a $H_1$: ${{ dos: 'es distinta de 0', mayor: 'la primera medida tiende a ser mayor', menor: 'la primera medida tiende a ser menor' }[h1]}; con $α = ${f(alfa)}$ y ${nTotal} pares.`
      : `$H_0$: la mediana es $m_0 = ${f(ds[0].b)}$, frente a $H_1$: ${{ dos: 'es distinta', mayor: 'es mayor', menor: 'es menor' }[h1]}; con $α = ${f(alfa)}$ y ${nTotal} datos.` });
    pasos.push({ t: 'Diferencias', html: `Se calculan $${dif}$${nz.length < nTotal ? ` y se descartan las ${nTotal - n} que valen 0, quedando $n = ${n}$` : `, con $n = ${n}$`}. Se ordenan los $|d_i|$ y se les da su rango${t.length ? ' (a los empates, la media de los rangos que ocupan)' : ''}.` });
    pasos.push({ t: 'Suma de rangos', html: `$W^+ = ${sumaTxt(nz.filter((q) => q.d > 0).map((q) => f(q.r)))} = ${f(Wp)}$ (diferencias positivas) y $W^− = ${f(Wm)}$ (negativas); comprobación: $W^+ + W^− = n(n + 1)/2 = ${f(Wp + Wm)}$. Con $H_0$, $W^+$ ronda $n(n + 1)/4 = ${f(mu)}$.` });
    if (exacto) pasos.push({ t: 'p-valor exacto', html: `Sin empates y con $n ≤ 25$, $W^+$ es la suma de un subconjunto cualquiera de $\\{1, …, ${n}\\}$ (los $2^{${n}}$ reparto de signos son igual de probables). ${h1 === 'mayor' ? `$p = P(W^+ ≥ ${f(Wp)}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(W^+ ≤ ${f(Wp)}) = ${ES.prob(p)}$` : `$p = 2 · P(\\text{cola más pequeña}) = ${ES.prob(p)}$`}.` });
    else pasos.push({ t: 'Aproximación normal', html: `$W^+$ es casi normal de media $${f(mu)}$ y $σ = √({n(n + 1)(2n + 1)}/24${t.length ? ' − {∑ (t^3 − t)}/48' : ''}) = ${f(sigma)}$.<br>$z = {W^+ − μ${cc ? ' ∓ 0,5' : ''}}/σ = ${f(z)}$ y $p = ${ES.prob(p)}$.` });
    const sg = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24 - corr / 48), zEf = (Wp - mu) / sg, rEf = Math.abs(zEf) / Math.sqrt(n), rb = (Wp - Wm) / (Wp + Wm);
    const walsh = []; for (let i = 0; i < n; i++) for (let j = i; j < n; j++) walsh.push((nz[i].d + nz[j].d) / 2);
    let cw = null; if (exacto) { cw = new Map([[0, 1]]); for (let v = 1; v <= n; v++) { const nu = new Map(cw); for (const [q, c] of cw) nu.set(q + v, (nu.get(q + v) || 0) + c); cw = nu; } }
    const hl = hodges(walsh, (n * (n + 1)) / 2, mu, sg, exacto, cw, alfa);
    pasos.push({ t: 'Tamaño del efecto', html: `Correlación biserial de rangos: $r_b = (W^+ − W^−)/(W^+ + W^−) = ${f(rb)}$ (de −1 a 1; 0 = sin efecto). Tamaño del efecto $r = |z|/√n = ${f(rEf)}$ (0,1 pequeño, 0,3 mediano, 0,5 grande).` });
    pasos.push({ t: 'Estimador de Hodges-Lehmann', html: `El desplazamiento típico es la mediana de las $n(n + 1)/2$ medias de Walsh $(d_i + d_j)/2$: <b>${f(hl.est)}</b>${isFinite(hl.lo) ? `, con un intervalo de confianza del ${nivel(alfa)} % de $(${f(hl.lo)}; ${f(hl.hi)})$ (${exacto ? 'exacto' : 'por la aproximación normal'})` : ''}.` });
    pasos.push({ t: 'Conclusión', html: p < alfa ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %.` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: no hay evidencia suficiente.` });
    return { tipo: pares ? 'pares' : 'mediana', h1, ds, nz, nTotal, n, Wp, Wm, mu, z, sigma, p, exacto, rEf, rb, hl, zEf, empates: t.length > 0, rechaza: p < alfa, alfa, pasos, est: Wp };
  }


  /* ---------- Kruskal-Wallis con Dunn ---------- */
  function kruskal(sc, alfa) {
    const g = []; String(sc.datos ?? '').split(/\r?\n/).forEach((lin, i) => { const l = lin.trim(); if (!l || l.startsWith('#')) return; const j = l.indexOf(':'), nom = j > 0 ? l.slice(0, j).trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : `Grupo ${g.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `la línea ${i + 1}`); if (!x.length) throw new Error(`La línea ${i + 1} no tiene valores`); g.push({ nom, x, n: x.length }); });
    if (g.length < 2) throw new Error('Escribe al menos dos grupos, uno por línea');
    const k = g.length, todos = g.flatMap((q) => q.x), N = todos.length, { r, t, corr } = rangos(todos);
    if (corr >= N * N * N - N) throw new Error('Todos los datos son iguales: no se puede hacer el contraste');
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
      { t: 'Hipótesis', html: `$H_0$: los ${k} grupos proceden de la misma distribución (ninguno tiende a dar valores mayores), frente a $H_1$: alguno tiende a dar valores distintos; $α = ${f(alfa)}$, $N = ${N}$ datos.` },
      { t: 'Rangos', html: `Se ordenan los ${N} datos juntos y se les da su rango (1 al menor${t.length ? '; a los empates, la media de los rangos que ocupan' : ''}). Sumas de rangos: ${g.slice(0, 6).map((q, i) => `$R_{${i + 1}} = ${f(q.R)}$ ($n_{${i + 1}} = ${q.n}$)`).join(', ')}${k > 6 ? ', …' : ''}. Comprobación: $∑ R_i = N(N + 1)/2 = ${f(suma(g.map((q) => q.R)))}$.` },
      { t: 'Estadístico H', html: `$H = {12}/{N(N + 1)} ∑ {R_i^2}/{n_i} − 3(N + 1) = ${f(Hs)}$${t.length ? `; con la corrección por empates $C = 1 − {∑ (t^3 − t)}/{N^3 − N} = ${f(C, 5)}$ queda $H = ${f(H)}$` : ''}. Bajo $H_0$ sigue (aproximadamente) una $χ^2$ con $k − 1 = ${gl}$ grados de libertad${g.some((q) => q.n < 5) ? '; con grupos de menos de 5 datos la aproximación es poco fina' : ''}.` },
      { t: 'Región crítica y p-valor', html: `El valor crítico es $χ^2_{${gl}; ${f(1 - alfa)}} = ${f(crit)}$ y el p-valor, $P(χ^2_{${gl}} ≥ ${f(H)}) = ${ES.prob(p)}$.` },
      { t: 'Tamaño del efecto', html: `$ε^2 = H/(N − 1) = ${f(eps2, 3)}$: la parte de la variabilidad de los rangos que explican los grupos (0,01 pequeño, 0,08 mediano, 0,26 grande).` },
      { t: 'Conclusión', html: p < alfa ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: algún grupo difiere de los demás.` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: no hay evidencia de que los grupos difieran.` },
    ];
    if (pares.length) pasos.push({ t: `Comparaciones de Dunn (${post === 'holm' ? 'Holm' : 'Bonferroni'})`, html: `Para cada pareja, $z = {R̄_i − R̄_j}/√({N(N + 1)}/12 · (1/n_i + 1/n_j))$${t.length ? ' (con la corrección de empates)' : ''}, y el p-valor se ajusta por las $m = ${pares.length}$ comparaciones (${post === 'holm' ? 'Holm: más potente' : 'Bonferroni: se multiplica por m'}). Por ejemplo, ${pares[0].a} − ${pares[0].b}: $z = ${f(pares[0].z)}$, $p = ${ES.prob(pares[0].p)}$.${p < alfa ? '' : ' Con H no significativo, estas comparaciones son solo orientativas.'}` });
    return { tipo: 'kw', g, k, N, H, Hs, C, gl, p, crit, eps2, pares, post, rechaza: p < alfa, alfa, pasos, est: H };
  }

  /* ---------- Test de los signos ---------- */
  function signos(sc, alfa, pares) {
    const h1 = H1[sc.h1] ? sc.h1 : 'dos';
    let ds; if (pares) { const ft = filas(sc.datos, 2, 'los datos apareados'); if (!ft.length) throw new Error('Falta la tabla de pares «antes después»'); ds = ft.map(([a, b]) => ({ a, b, d: a - b })); } else { const x = lista(sc.datos, 'la muestra'), m0 = lee(sc, 'm0', 'la mediana de H₀'); if (!x.length) throw new Error('Falta la muestra'); ds = x.map((a) => ({ a, b: m0, d: a - m0 })); }
    const mas = ds.filter((q) => q.d > 0).length, menos = ds.filter((q) => q.d < 0).length, n = mas + menos, ceros = ds.length - n;
    if (n < 1) throw new Error('Todas las diferencias son 0: no se puede hacer el contraste');
    const pb = (k) => { let s = 0, c = 1; for (let i = 0; i <= k; i++) { s += c; c = (c * (n - i)) / (i + 1); } return Math.min(1, s / 2 ** n); };
    const le = pb(mas), ge = pb(menos);   // P(X ≤ n⁺) y P(X ≥ n⁺) = P(X ≤ n⁻)
    const p = pvalor(h1, le, ge), mu = n / 2, z = (mas - mu) / Math.sqrt(n / 4);
    const pasos = [
      { t: 'Hipótesis', html: pares ? `$H_0$: la mediana de las diferencias es 0, es decir, que cada diferencia es positiva o negativa con probabilidad $1/2$; frente a $H_1$: ${{ dos: 'no', mayor: 'la primera medida tiende a ser mayor', menor: 'la primera medida tiende a ser menor' }[h1] === 'no' ? 'las probabilidades no son iguales' : { mayor: 'la primera medida tiende a ser mayor', menor: 'la primera medida tiende a ser menor' }[h1]}; $α = ${f(alfa)}$.` : `$H_0$: la mediana es $m_0 = ${f(ds[0].b)}$ (cada dato queda por encima o por debajo con probabilidad $1/2$), frente a $H_1$: ${{ dos: 'es distinta', mayor: 'es mayor', menor: 'es menor' }[h1]}; $α = ${f(alfa)}$.` },
      { t: 'Signos', html: `Se cuentan los signos de $d_i$ (los $0$ se descartan${ceros ? `: ${ceros}` : ''}): $n^+ = ${mas}$ positivos y $n^− = ${menos}$ negativos, $n = ${n}$.` },
      { t: 'p-valor exacto', html: `Si $H_0$ es cierta, $n^+$ sigue una binomial $B(${n}, 1/2)$. ${h1 === 'mayor' ? `$p = P(X ≥ ${mas}) = ${ES.prob(p)}$` : h1 === 'menor' ? `$p = P(X ≤ ${mas}) = ${ES.prob(p)}$` : `$p = 2 · P(X ≤ ${Math.min(mas, menos)}) = ${ES.prob(p)}$ (limitado a 1)`}. Aproximación normal para comparar: $z = (n^+ − n/2)/√(n/4) = ${f(z)}$.` },
      { t: 'Conclusión', html: p < alfa ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %.` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: no hay evidencia suficiente. El test de los signos usa solo el signo, por eso es el menos potente de los de rangos.` },
    ];
    return { tipo: pares ? 'signos' : 'signosmed', h1, ds, mas, menos, n, ceros, p, z, rechaza: p < alfa, alfa, pasos, est: mas };
  }

  /* ---------- Spearman y Kendall ---------- */
  function correlacion(sc, alfa) {
    const ft = filas(sc.datos, 2, 'los datos'); if (ft.length < 3) throw new Error('Hacen falta al menos 3 pares «x y»');
    const x = ft.map((q) => q[0]), y = ft.map((q) => q[1]), n = ft.length, h1 = H1[sc.h1] ? sc.h1 : 'dos';
    const sp = IN.spearman(x, y), ke = IN.kendall(x, y);
    if (!isFinite(sp.rho) || !isFinite(ke.tau)) throw new Error('Una de las dos variables es constante (o solo tiene un valor): no hay correlación que contrastar');
    const un = (est, p2) => (h1 === 'dos' ? p2 : (h1 === 'mayor' ? est > 0 : est < 0) ? p2 / 2 : 1 - p2 / 2), pS = un(sp.rho, sp.p), pK = un(ke.tau, ke.p);
    const rx = IN.rangosDe(x).r, ry = IN.rangosDe(y).r;
    const pasos = [
      { t: 'Hipótesis', html: `$H_0$: no hay asociación monótona entre las dos variables ($ρ_s = 0$, $τ = 0$), frente a $H_1$: ${{ dos: 'sí la hay', mayor: 'la asociación es positiva', menor: 'la asociación es negativa' }[h1]}; $α = ${f(alfa)}$, $n = ${n}$.` },
      { t: 'Rangos', html: `Cada variable se sustituye por sus rangos (${n} pares; a los empates, la media de los rangos).` },
      { t: 'Spearman', html: `$ρ_s$ es la correlación de Pearson de los rangos: $ρ_s = ${f(sp.rho, 5)}$. Contraste: $t = ρ_s √{(n − 2)/(1 − ρ_s^2)} = ${f(sp.t)}$ con $${n - 2}$ g. l., $p = ${ES.prob(pS)}$.${n < 10 ? ' Con menos de 10 pares esta aproximación es poco fina.' : ''}` },
      { t: 'Kendall', html: `Se cuentan los pares concordantes $C = ${ke.C}$ y discordantes $D = ${ke.D}$ (entre cada dos puntos, si $x$ e $y$ crecen a la vez o no): $τ_b = {C − D}/√{(n_0 − n_1)(n_0 − n_2)} = ${f(ke.tau, 5)}$ (con empates se corrige; sin ellos, $τ = (C − D)/(n(n − 1)/2)$). ${ke.exacto ? `Sin empates y con $n ≤ 40$ el p-valor es exacto (se cuentan las permutaciones por su número de inversiones): $p = ${ES.prob(pK)}$.` : `Con la aproximación normal (con la varianza corregida por empates): $z = ${f(ke.z)}$, $p = ${ES.prob(pK)}$.`}` },
      { t: 'Conclusión', html: `${pS < alfa ? '<b>Se rechaza $H_0$ con Spearman</b>' : '<b>No se rechaza $H_0$ con Spearman</b>'} y ${pK < alfa ? '<b>se rechaza con Kendall</b>' : '<b>no se rechaza con Kendall</b>'} al ${f(100 * alfa)} %. Kendall es más fiable con pocos datos y muchos empates; Spearman se parece más al coeficiente de Pearson.` },
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
    { clave: 'metodos', nombre: 'Mann-Whitney: dos métodos de estudio (exacto)', sc: { tipo: 'mw', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', datos1: '14 17 16 19 22', datos2: '10 12 15 11 13 9' } },
    { clave: 'empates', nombre: 'Mann-Whitney con empates (aproximación normal)', sc: { tipo: 'mw', h1: 'mayor', alfa: '0,05', exacto: 'si', cc: 'si', datos1: '3 4 4 5 5 5 6 7', datos2: '2 3 3 4 4 5 5 6' } },
    { clave: 'dieta', nombre: 'Wilcoxon apareado: peso antes y después de una dieta', sc: { tipo: 'pares', h1: 'mayor', alfa: '0,05', exacto: 'si', cc: 'si', datos: '82 78\n91 85\n77 75\n88 89\n95 88\n79 79\n84 76\n90 79' } },
    { clave: 'mediana', nombre: 'Wilcoxon para la mediana: ¿vale 50?', sc: { tipo: 'mediana', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', m0: '50', datos: '54 61 48 58 66 53 63 57 49 60' } },
    { clave: 'kruskal', nombre: 'Kruskal-Wallis y Dunn: tres métodos de estudio', sc: { tipo: 'kw', alfa: '0,05', post: 'holm', datos: 'Método A: 14 17 16 19 22\nMétodo B: 10 12 15 11 13 9\nMétodo C: 20 24 21 26 23 25' } },
    { clave: 'kruskal-empates', nombre: 'Kruskal-Wallis con empates', sc: { tipo: 'kw', alfa: '0,05', post: 'bonferroni', datos: 'Leve: 3 4 4 5 5\nMedio: 4 5 6 6 7 7\nGrave: 6 7 7 8 9 9 9' } },
    { clave: 'signos', nombre: 'Test de los signos: antes y después', sc: { tipo: 'signos', h1: 'mayor', alfa: '0,05', datos: '82 78\n91 85\n77 75\n88 89\n95 88\n79 79\n84 76\n90 79' } },
    { clave: 'signos-mediana', nombre: 'Test de los signos para la mediana', sc: { tipo: 'signosmed', h1: 'dos', alfa: '0,05', m0: '50', datos: '54 61 48 58 66 53 63 57 49 60' } },
    { clave: 'correlacion', nombre: 'Spearman y Kendall: notas de dos exámenes', sc: { tipo: 'correlacion', h1: 'dos', alfa: '0,05', datos: '1 2\n2 1\n3 4\n4 3\n5 7\n6 8\n7 5\n8 6' } },
    { clave: 'correlacion-empates', nombre: 'Kendall con empates', sc: { tipo: 'correlacion', h1: 'dos', alfa: '0,05', datos: '1 1\n2 3\n2 2\n3 2\n4 5\n4 6\n5 6' } },
  ];
  return { resolver, ejemplos, TIPOS, H1, POST, rangos };
})();
if (typeof module !== 'undefined') module.exports = NoParametricos;
