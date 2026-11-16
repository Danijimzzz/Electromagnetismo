const Contrastes = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const IN = typeof Inferencia !== 'undefined' ? Inferencia : require('../estadistica/inferencia.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista } = K, D = ES.DIST;
  const TIPOS = { media: 'Una media μ', proporcion: 'Una proporción p', varianza: 'Una varianza σ²', dosmedias: 'Dos medias μ₁ − μ₂', dosprop: 'Dos proporciones p₁ − p₂', dosvar: 'Dos varianzas σ₁²/σ₂²', apareados: 'Datos apareados (media de las diferencias)', varios: 'Varias varianzas (Levene y Bartlett)', normalidad: 'Normalidad de una muestra (Shapiro-Wilk)' };
  const ENTRADA = { resumen: 'Resumen (n, x̄, s)', datos: 'Lista de datos' };
  const METODOS = { levene: 'Levene (con la mediana, robusto)', bartlett: 'Bartlett (si los datos son normales)' };
  const TIPOS_VAR = ['media', 'varianza', 'dosmedias', 'apareados'];
  const H1 = { distinto: 'Bilateral: ≠', mayor: 'Unilateral: >', menor: 'Unilateral: <' };
  const CASOS = { conocidas: 'σ₁ y σ₂ conocidas (z)', iguales: 'Desconocidas pero iguales (t)', distintas: 'Desconocidas y distintas (Welch)' };
  const p4 = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const SIGNO = { distinto: '≠', mayor: '>', menor: '<' };

  const dist = { z: () => [D.normal, { mu: 0, sigma: 1 }, 'N(0, 1)'], t: (nu) => [D.t, { nu }, `t de Student con ${f(nu, 5)} grados de libertad`], chi2: (k) => [D.chi2, { k }, `χ² con ${k} grados de libertad`], f: (d1, d2) => [D.f, { d1, d2 }, `F de Snedecor con (${d1}, ${d2}) grados de libertad`] };
  const nomEst = { z: 'Z', t: 'T', chi2: 'χ²', f: 'F' };

  function decide(T, [Dd, P], h1, alfa, simetrica) {
    const q = (p) => ES.cuantil(Dd, P, p), cdf = Dd.cdf(P, T), sf = Dd.sf ? Dd.sf(P, T) : 1 - cdf;
    let crit, rechaza, pv;
    if (h1 === 'mayor') { crit = [q(1 - alfa)]; rechaza = T > crit[0]; pv = sf; }
    else if (h1 === 'menor') { crit = [q(alfa)]; rechaza = T < crit[0]; pv = cdf; }
    else if (simetrica) { const c = q(1 - alfa / 2); crit = [-c, c]; rechaza = Math.abs(T) > c; pv = 2 * Math.min(cdf, sf); }
    else { crit = [q(alfa / 2), q(1 - alfa / 2)]; rechaza = T < crit[0] || T > crit[1]; pv = 2 * Math.min(cdf, sf); }
    return { crit, rechaza, pv: Math.min(1, pv) };
  }
  const regionTxt = (crit, h1, e) => h1 === 'mayor' ? `$${e} > ${f(crit[0])}$` : h1 === 'menor' ? `$${e} < ${p4(crit[0])}$` : crit[0] === -crit[1] ? `$|${e}| > ${f(crit[1])}$` : `$${e} < ${f(crit[0])}$ o $${e} > ${f(crit[1])}$`;

  function media(sc) {
    const n = lee(sc, 'n', 'el tamaño de la muestra n', { min: 2, entero: true }), xm = lee(sc, 'xm', 'la media muestral x̄'), mu0 = lee(sc, 'mu0', 'el valor de H₀ μ₀');
    const conocida = sc.sigmaC === 'si', s = lee(sc, 's', conocida ? 'la σ de la población' : 'la desviación típica muestral s', { min: 0, minEx: true });
    const se = s / Math.sqrt(n), T = (xm - mu0) / se;
    return { par: 'μ', v0: mu0, est: T, d: conocida ? dist.z() : dist.t(n - 1), e: conocida ? 'Z' : 'T', sim: true, estimado: xm,
      formula: `$${conocida ? 'Z' : 'T'} = {x̄ − μ_0}/{${conocida ? 'σ' : 's'}/√n} = {${f(xm, 6)} − ${p4(mu0)}}/{${f(s)}/√${n}} = {${f(xm - mu0)}}/{${f(se)}} = ${f(T)}$`,
      porque: conocida ? 'Con σ conocida, la media muestral es normal y se tipifica con la z.' : `Con σ desconocida se usa la s de la muestra, y el estadístico sigue una t de Student con $n − 1 = ${n - 1}$ grados de libertad.` };
  }
  function proporcion(sc) {
    const n = lee(sc, 'n', 'el tamaño de la muestra n', { min: 1, entero: true }), x = lee(sc, 'x', 'el número de éxitos x', { min: 0, max: n, entero: true }), p0 = lee(sc, 'p0', 'la proporción de H₀ p₀', { min: 0, minEx: true, max: 1, maxEx: true });
    const ph = x / n, se = Math.sqrt((p0 * (1 - p0)) / n), T = (ph - p0) / se;
    return { par: 'p', v0: p0, est: T, d: dist.z(), e: 'Z', sim: true, estimado: ph,
      formula: `$p̂ = x/n = ${x}/${n} = ${f(ph)}$<br>$Z = {p̂ − p_0}/{√(p_0 (1 − p_0)/n)} = {${f(ph)} − ${f(p0)}}/{√(${f(p0)} · ${f(1 - p0)}/${n})} = {${f(ph - p0)}}/{${f(se)}} = ${f(T)}$`,
      porque: `Con n grande, $p̂$ es aproximadamente normal; en $H_0$ se usa $p_0$ para el error típico${n * p0 < 5 || n * (1 - p0) < 5 ? '. Ojo: $n p_0$ o $n (1 − p_0)$ es menor que 5 y la aproximación normal no es buena' : ` ($n p_0 = ${f(n * p0)}$ y $n (1 − p_0) = ${f(n * (1 - p0))}$, los dos al menos 5)`}.` };
  }
  function varianza(sc) {
    const n = lee(sc, 'n', 'el tamaño de la muestra n', { min: 2, entero: true }), s = lee(sc, 's', 'la desviación típica muestral s', { min: 0, minEx: true }), s0 = lee(sc, 's0', 'la σ₀ de H₀', { min: 0, minEx: true });
    const T = ((n - 1) * s * s) / (s0 * s0);
    return { par: 'σ²', v0: s0 * s0, est: T, d: dist.chi2(n - 1), e: 'χ^2', sim: false, estimado: s * s,
      formula: `$χ^2 = {(n − 1) s^2}/{σ_0^2} = {${n - 1} · ${f(s)}^2}/{${f(s0)}^2} = {${f((n - 1) * s * s)}}/{${f(s0 * s0)}} = ${f(T)}$`,
      porque: `Si la población es normal, $(n − 1) s^2/σ^2$ sigue una χ² con $n − 1 = ${n - 1}$ grados de libertad. No es simétrica: en el bilateral los dos valores críticos son distintos.` };
  }
  function dosMedias(sc) {
    const n1 = lee(sc, 'n1', 'n₁', { min: 2, entero: true }), x1 = lee(sc, 'xm1', 'x̄₁'), s1 = lee(sc, 's1', sc.caso === 'conocidas' ? 'σ₁' : 's₁', { min: 0, minEx: true });
    const n2 = lee(sc, 'n2', 'n₂', { min: 2, entero: true }), x2 = lee(sc, 'xm2', 'x̄₂'), s2 = lee(sc, 's2', sc.caso === 'conocidas' ? 'σ₂' : 's₂', { min: 0, minEx: true });
    const d0 = lee(sc, 'd0', 'la diferencia de H₀', { def: 0 }), caso = CASOS[sc.caso] ? sc.caso : 'iguales', dif = x1 - x2;
    let se, d, extra = '';
    if (caso === 'conocidas') { se = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2); d = dist.z(); extra = `Error típico: $√(σ_1^2/n_1 + σ_2^2/n_2) = √(${f(s1)}^2/${n1} + ${f(s2)}^2/${n2}) = ${f(se)}$`; }
    else if (caso === 'iguales') {
      const sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2); se = Math.sqrt(sp2 * (1 / n1 + 1 / n2)); d = dist.t(n1 + n2 - 2);
      extra = `Varianza conjunta: $s_p^2 = {(n_1 − 1) s_1^2 + (n_2 − 1) s_2^2}/{n_1 + n_2 − 2} = {${n1 - 1} · ${f(s1)}^2 + ${n2 - 1} · ${f(s2)}^2}/{${n1 + n2 - 2}} = ${f(sp2)}$<br>Error típico: $s_p √(1/n_1 + 1/n_2) = ${f(Math.sqrt(sp2))} · √(1/${n1} + 1/${n2}) = ${f(se)}$`;
    } else {
      const a = s1 * s1 / n1, b = s2 * s2 / n2, nu = (a + b) ** 2 / (a * a / (n1 - 1) + b * b / (n2 - 1)); se = Math.sqrt(a + b); d = dist.t(nu);
      extra = `Error típico: $√(s_1^2/n_1 + s_2^2/n_2) = ${f(se)}$<br>Grados de libertad de Welch: $ν = {(s_1^2/n_1 + s_2^2/n_2)^2}/{{(s_1^2/n_1)^2}/{n_1 − 1} + {(s_2^2/n_2)^2}/{n_2 − 1}} = ${f(nu, 5)}$`;
    }
    const e = caso === 'conocidas' ? 'Z' : 'T', T = (dif - d0) / se;
    return { par: 'μ₁ − μ₂', v0: d0, est: T, d, e, sim: true, estimado: dif,
      formula: `${extra}<br>$${e} = {(x̄_1 − x̄_2) − ${f(d0)}}/{"error típico"} = {${f(x1, 6)} − ${p4(x2)}${d0 ? ` − ${p4(d0)}` : ''}}/{${f(se)}} = ${f(T)}$`,
      porque: { conocidas: 'Con las dos σ conocidas, la diferencia de medias es normal.', iguales: 'Con las varianzas desconocidas pero iguales, se juntan en una varianza conjunta y se usa la t con $n_1 + n_2 − 2$ grados de libertad.', distintas: 'Con las varianzas desconocidas y distintas se usa la aproximación de Welch, con unos grados de libertad que no tienen por qué ser enteros.' }[caso] };
  }
  function dosProp(sc) {
    const n1 = lee(sc, 'n1', 'n₁', { min: 1, entero: true }), x1 = lee(sc, 'x1', 'x₁', { min: 0, max: n1, entero: true }), n2 = lee(sc, 'n2', 'n₂', { min: 1, entero: true }), x2 = lee(sc, 'x2', 'x₂', { min: 0, max: n2, entero: true });
    const p1 = x1 / n1, p2 = x2 / n2, pc = (x1 + x2) / (n1 + n2), se = Math.sqrt(pc * (1 - pc) * (1 / n1 + 1 / n2));
    if (!(se > 0)) throw new Error('Con todos éxitos o ningún éxito en las dos muestras no hay variación: no se puede contrastar');
    const T = (p1 - p2) / se;
    return { par: 'p₁ − p₂', v0: 0, est: T, d: dist.z(), e: 'Z', sim: true, estimado: p1 - p2,
      formula: `$p̂_1 = ${x1}/${n1} = ${f(p1)}$, $p̂_2 = ${x2}/${n2} = ${f(p2)}$ y, como en $H_0$ son iguales, la proporción conjunta $p̂ = {x_1 + x_2}/{n_1 + n_2} = ${x1 + x2}/${n1 + n2} = ${f(pc)}$<br>$Z = {p̂_1 − p̂_2}/{√(p̂ (1 − p̂) (1/n_1 + 1/n_2))} = {${f(p1 - p2)}}/{${f(se)}} = ${f(T)}$`,
      porque: 'Con muestras grandes, la diferencia de proporciones es aproximadamente normal.' };
  }
  function dosVar(sc) {
    const n1 = lee(sc, 'n1', 'n₁', { min: 2, entero: true }), s1 = lee(sc, 's1', 's₁', { min: 0, minEx: true }), n2 = lee(sc, 'n2', 'n₂', { min: 2, entero: true }), s2 = lee(sc, 's2', 's₂', { min: 0, minEx: true });
    const T = (s1 * s1) / (s2 * s2);
    return { par: 'σ₁²/σ₂²', v0: 1, est: T, d: dist.f(n1 - 1, n2 - 1), e: 'F', sim: false, estimado: T,
      formula: `$F = s_1^2/s_2^2 = ${f(s1)}^2/${f(s2)}^2 = ${f(s1 * s1)}/${f(s2 * s2)} = ${f(T)}$`,
      porque: `Si las dos poblaciones son normales y $σ_1 = σ_2$, el cociente de las varianzas muestrales sigue una F con $(n_1 − 1, n_2 − 1) = (${n1 - 1}, ${n2 - 1})$ grados de libertad.` };
  }
  const CALC = { media, proporcion, varianza, dosmedias: dosMedias, dosprop: dosProp, dosvar: dosVar };

  function resolverBase(sc, alfa, tipo, h1) {
    const r = CALC[tipo](sc), { crit, rechaza, pv } = decide(r.est, r.d, h1, alfa, r.sim);
    const v0 = tipo === 'varianza' ? `${f(r.v0)} (σ_0 = ${f(Math.sqrt(r.v0))})` : f(r.v0), par = (sc.__apareados ? 'μ_d' : r.par).replace(/₁/g, '_1').replace(/₂/g, '_2').replace(/²/g, '^2');
    const pasos = [];
    pasos.push({ t: 'Hipótesis', html: `$H_0: ${par} ${h1 === 'distinto' ? '=' : h1 === 'mayor' ? '≤' : '≥'} ${v0}$ &ensp; frente a &ensp; $H_1: ${par} ${SIGNO[h1]} ${f(r.v0)}$, con $α = ${f(alfa)}$.` });
    pasos.push({ t: 'Estadístico de contraste', html: `${r.porque}<br>${r.formula}` });
    pasos.push({ t: 'Región crítica', html: `Bajo $H_0$ el estadístico sigue una ${r.d[2]}. ${h1 === 'distinto' ? `Se deja $α/2 = ${f(alfa / 2)}$ en cada cola` : `Se deja $α = ${f(alfa)}$ en la cola de la ${h1 === 'mayor' ? 'derecha' : 'izquierda'}`}: se rechaza $H_0$ si ${regionTxt(crit, h1, r.e)}.<br>El estadístico vale $${r.e} = ${f(r.est)}$: ${rechaza ? '<b>cae en la región crítica</b>' : '<b>no cae en la región crítica</b>'}.` });
    const pvTxt = h1 === 'mayor' ? `P(${r.e} ≥ ${f(r.est)})` : h1 === 'menor' ? `P(${r.e} ≤ ${f(r.est)})` : r.sim ? `2 P(${r.e} ≥ ${f(Math.abs(r.est))})` : `2 mín(P(${r.e} ≤ ${f(r.est)}), P(${r.e} ≥ ${f(r.est)}))`;
    pasos.push({ t: 'p-valor', html: `$p = ${pvTxt} = ${f(pv)}$, ${pv < alfa ? `menor que $α = ${f(alfa)}$` : `mayor que $α = ${f(alfa)}$`}: ${pv < alfa ? 'se rechaza' : 'no se rechaza'} $H_0$, igual que con la región crítica. El p-valor es la probabilidad de sacar un resultado tan raro como este, o más, si $H_0$ fuera cierta.` });
    pasos.push({ t: 'Conclusión', html: rechaza ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: los datos dan pruebas de que $${par} ${SIGNO[h1]} ${f(r.v0)}$.` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: los datos no dan pruebas suficientes de que $${par} ${SIGNO[h1]} ${f(r.v0)}$ (no quiere decir que $H_0$ sea verdad, solo que no se puede descartar).` });
    return { tipo, h1, alfa, ...r, crit, rechaza, pv, pasos };
  }



  const prom = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const desv = (v) => { const m = prom(v); return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1)); };
  const num = (x) => String(x);
  function deriva(sc, tipo) {
    const conoc = sc.sigmaC === 'si' || sc.caso === 'conocidas';
    if (tipo === 'apareados') {
      const x = lista(sc.datos1, 'los datos de «antes» (muestra 1)'), y = lista(sc.datos2, 'los datos de «después» (muestra 2)');
      if (x.length !== y.length) throw new Error(`Los datos apareados tienen que ser pares: hay ${x.length} valores en la muestra 1 y ${y.length} en la 2`);
      if (x.length < 3) throw new Error('Hacen falta al menos 3 pares para contrastar la media de las diferencias');
      const d = x.map((v, i) => v - y[i]);
      if (!(desv(d) > 0)) throw new Error('Todas las diferencias son iguales (desviación 0): el estadístico t no está definido');
      return { sc: { ...sc, tipo: 'media', sigmaC: 'no', n: num(d.length), xm: num(prom(d)), s: num(desv(d)), mu0: vacio(sc.mu0) ? '0' : sc.mu0, __apareados: 1 }, pre: `Diferencias $d_i = x_i − y_i$: $n = ${d.length}$, $d̄ = ${f(prom(d))}$, $s_d = ${f(desv(d))}$.`, muestras: [{ nom: 'las diferencias', x: d }] };
    }
    if (sc.entrada !== 'datos' || !['media', 'varianza', 'dosmedias'].includes(tipo)) return { sc, pre: '', muestras: [] };
    const una = (k, nom) => { const x = lista(sc[k], nom); if (x.length < 2) throw new Error(`Hacen falta al menos 2 datos en ${nom}`); return x; };
    if (tipo === 'dosmedias') {
      const x = una('datos1', 'la muestra 1'), y = una('datos2', 'la muestra 2');
      return { sc: { ...sc, n1: num(x.length), xm1: num(prom(x)), s1: conoc ? sc.s1 : num(desv(x)), n2: num(y.length), xm2: num(prom(y)), s2: conoc ? sc.s2 : num(desv(y)) }, pre: `Muestra 1: $n_1 = ${x.length}$, $x̄_1 = ${f(prom(x))}$, $s_1 = ${f(desv(x))}$. Muestra 2: $n_2 = ${y.length}$, $x̄_2 = ${f(prom(y))}$, $s_2 = ${f(desv(y))}$.`, muestras: [{ nom: 'la muestra 1', x }, { nom: 'la muestra 2', x: y }] };
    }
    const x = una('datos', 'los datos');
    return { sc: { ...sc, n: num(x.length), xm: num(prom(x)), s: tipo === 'media' && conoc ? sc.s : num(desv(x)) }, pre: `De los datos: $n = ${x.length}$, $x̄ = ${f(prom(x))}$, $s = ${f(desv(x))}$.`, muestras: [{ nom: 'los datos', x }] };
  }
  const vacio = K.vacio || ((v) => v === undefined || v === null || String(v).trim() === '');
  const normalidad = (muestras, alfa) => muestras.map((m) => { const sh = m.x.length >= 3 ? IN.shapiro(m.x) : null; return { nom: m.nom, n: m.x.length, W: sh ? sh.W : NaN, p: sh ? sh.p : NaN, ok: sh && isFinite(sh.p) ? sh.p >= alfa : null }; });

  const lim = (v) => { const a = Math.abs(v); return a < 0.2 ? 'despreciable' : a < 0.5 ? 'pequeño' : a < 0.8 ? 'mediano' : 'grande'; };
  const asn = (p) => 2 * Math.asin(Math.sqrt(p));
  function efecto(sc, tipo, r) {
    if (tipo === 'media') { const s = lee(sc, 's', 's'), d = (r.estimado - r.v0) / s; return { nom: sc.__apareados ? 'd de Cohen de las diferencias' : 'd de Cohen', sim: 'd', val: d, txt: `$d = {x̄ − μ_0}/s = {${f(r.estimado)} − ${f(r.v0)}}/{${f(s)}} = ${f(d)}$` }; }
    if (tipo === 'dosmedias') {
      const n1 = lee(sc, 'n1', 'n1'), n2 = lee(sc, 'n2', 'n2'), s1 = lee(sc, 's1', 's1'), s2 = lee(sc, 's2', 's2'), sp = Math.sqrt(sc.caso === 'conocidas' ? (s1 * s1 + s2 * s2) / 2 : ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2)), d = (r.estimado - r.v0) / sp, J = 1 - 3 / (4 * (n1 + n2) - 9);
      return { nom: 'd de Cohen', sim: 'd', val: d, g: d * J, txt: `$d = {(x̄_1 − x̄_2) − d_0}/s_p = ${f(r.estimado - r.v0)}/${f(sp)} = ${f(d)}$ (con la corrección de Hedges para muestras pequeñas, $g = ${f(d * J)}$)` };
    }
    if (tipo === 'proporcion') { const p0 = r.v0, h = asn(r.estimado) - asn(p0); return { nom: 'h de Cohen', sim: 'h', val: h, txt: `$h = 2 \\arcsin √{p̂} − 2 \\arcsin √{p_0} = ${f(asn(r.estimado))} − ${f(asn(p0))} = ${f(h)}$` }; }
    if (tipo === 'dosprop') { const p1 = lee(sc, 'x1', 'x1') / lee(sc, 'n1', 'n1'), p2 = lee(sc, 'x2', 'x2') / lee(sc, 'n2', 'n2'), h = asn(p1) - asn(p2); return { nom: 'h de Cohen', sim: 'h', val: h, txt: `$h = 2 \\arcsin √{p̂_1} − 2 \\arcsin √{p̂_2} = ${f(asn(p1))} − ${f(asn(p2))} = ${f(h)}$` }; }
    return null;
  }

  const MODELO = {
    media: (sc, real, n) => { const conoc = sc.sigmaC === 'si', s = lee(sc, 's', 's', { min: 0, minEx: true }), mu0 = lee(sc, 'mu0', 'μ0'), dl = (real - mu0) / (s / Math.sqrt(n)); return conoc ? { d: dist.z(), sim: true, k: 'z', mu: dl, sg: 1 } : { d: dist.t(n - 1), sim: true, k: 't', nu: n - 1, delta: dl }; },
    proporcion: (sc, p1, n) => { const p0 = lee(sc, 'p0', 'p0'), se0 = Math.sqrt((p0 * (1 - p0)) / n); return { d: dist.z(), sim: true, k: 'z', mu: (p1 - p0) / se0, sg: Math.sqrt((p1 * (1 - p1)) / n) / se0 }; },
    varianza: (sc, sr, n) => { const s0 = lee(sc, 's0', 's0'); return { d: dist.chi2(n - 1), sim: false, k: 'chi2', kk: n - 1, esc: (sr * sr) / (s0 * s0) }; },
    dosmedias: (sc, real, n1, n2) => {
      const s1 = lee(sc, 's1', 's1'), s2 = lee(sc, 's2', 's2'), d0 = lee(sc, 'd0', 'd0', { def: 0 }), caso = CASOS[sc.caso] ? sc.caso : 'iguales';
      if (caso === 'conocidas') { const se = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2); return { d: dist.z(), sim: true, k: 'z', mu: (real - d0) / se, sg: 1 }; }
      if (caso === 'iguales') { const sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2), se = Math.sqrt(sp2 * (1 / n1 + 1 / n2)), nu = n1 + n2 - 2; return { d: dist.t(nu), sim: true, k: 't', nu, delta: (real - d0) / se }; }
      const a = s1 * s1 / n1, b = s2 * s2 / n2, nu = (a + b) ** 2 / (a * a / (n1 - 1) + b * b / (n2 - 1)); return { d: dist.t(nu), sim: true, k: 't', nu, delta: (real - d0) / Math.sqrt(a + b) };
    },
    dosprop: (sc, dif, n1, n2) => {
      const p2 = lee(sc, 'x2', 'x2') / lee(sc, 'n2', 'n2'), p1 = p2 + dif; if (!(p1 > 0 && p1 < 1)) throw new Error(`Con p₂ = ${f(p2)} observada, una diferencia real de ${f(dif)} da una proporción p₁ = ${f(p1)} fuera de (0, 1)`);
      const pc = (n1 * p1 + n2 * p2) / (n1 + n2), se0 = Math.sqrt(pc * (1 - pc) * (1 / n1 + 1 / n2)), se1 = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
      return { d: dist.z(), sim: true, k: 'z', mu: dif / se0, sg: se1 / se0 };
    },
    dosvar: (sc, ratio, n1, n2) => ({ d: dist.f(n1 - 1, n2 - 1), sim: false, k: 'f', d1: n1 - 1, d2: n2 - 1, esc: ratio }),
  };
  const cdfAlt = (m, c) => (m.k === 'z' ? ES.Phi((c - m.mu) / m.sg) : m.k === 't' ? IN.nctCdf(c, m.nu, m.delta) : m.k === 'chi2' ? D.chi2.cdf({ k: m.kk }, c / m.esc) : D.f.cdf({ d1: m.d1, d2: m.d2 }, c / m.esc));
  const potDe = (m, h1, alfa) => {
    const c = decide(0, m.d, h1, alfa, m.sim).crit;
    const pw = h1 === 'mayor' ? 1 - cdfAlt(m, c[0]) : h1 === 'menor' ? cdfAlt(m, c[0]) : 1 - cdfAlt(m, c[1]) + cdfAlt(m, c[0]);
    return Math.min(1, Math.max(0, pw));
  };
  const PARAM = {
    media: { campo: 'real', nom: 'μ real', n: 'n' }, proporcion: { nom: 'p real', n: 'n' }, varianza: { nom: 'σ real', n: 'n' },
    dosmedias: { nom: 'μ₁ − μ₂ real', n: 'n1', n2: 'n2' }, dosprop: { nom: 'p₁ − p₂ real', n: 'n1', n2: 'n2' }, dosvar: { nom: 'σ₁²/σ₂² real', n: 'n1', n2: 'n2' },
  };
  function potencia(sc, tipo, h1, alfa, r) {
    const P = PARAM[tipo]; if (!P || vacio(sc.real)) return null;
    const real = lee(sc, 'real', 'el valor real del parámetro'), n = lee(sc, P.n, 'n', { entero: true }), n2 = P.n2 ? lee(sc, P.n2, 'n2', { entero: true }) : 0;
    if (tipo === 'varianza' && !(real > 0)) throw new Error('La σ real tiene que ser positiva');
    if (tipo === 'dosvar' && !(real > 0)) throw new Error('El cociente real σ₁²/σ₂² tiene que ser positivo');
    const mod = (rv, a, b) => (MODELO[tipo].length === 4 ? MODELO[tipo](sc, rv, a, b) : MODELO[tipo](sc, rv, a)), pw = (rv, a = n, b = n2) => potDe(mod(rv, a, b), h1, alfa);
    const potencia = pw(real), objetivo = vacio(sc.pot) ? 0.8 : lee(sc, 'pot', 'la potencia deseada', { min: 0, minEx: true, max: 1, maxEx: true });
    const tam = (k) => [Math.max(P.n2 ? 2 : 2, Math.ceil(k * n)), P.n2 ? Math.max(2, Math.ceil(k * n2)) : 0];
    let nec = null, a = 1, ya = pw(real) >= objetivo;
    if (!ya) { let b = 2, ok = false; for (let q = 0; q < 24; q++, b *= 2) { const [x, y] = tam(b); if (pw(real, x, y) >= objetivo) { ok = true; break; } } if (ok) { a = b / 2; for (let it = 0; it < 40 && b - a > 1e-3; it++) { const mdl = (a + b) / 2, [x, y] = tam(mdl); if (pw(real, x, y) >= objetivo) b = mdl; else a = mdl; } nec = tam(b); /* el menor entero n */ let [x, y] = nec; while (x > 2 && pw(real, x - 1, P.n2 ? Math.max(2, Math.ceil((x - 1) * n2 / n)) : 0) >= objetivo) { x--; y = P.n2 ? Math.max(2, Math.ceil(x * n2 / n)) : 0; } nec = [x, P.n2 ? Math.max(2, Math.ceil(x * n2 / n)) : 0]; } }
    else { let x = n, y = n2; while (x > 2 && pw(real, x - 1, P.n2 ? Math.max(2, Math.ceil((x - 1) * n2 / n)) : 0) >= objetivo) x--; nec = [x, P.n2 ? Math.max(2, Math.ceil(x * n2 / n)) : 0]; }
    const v0 = r.v0, centro = tipo === 'varianza' ? Math.sqrt(v0) : v0, amp = Math.max(Math.abs(real - centro) * 1.6, tipo === 'dosvar' ? 0.5 : 1e-9, tipo === 'proporcion' ? 0.05 : 0, Math.abs(centro) * 0.05, tipo === 'varianza' ? 0.3 * centro : 0);
    let lo = centro - amp, hi = centro + amp;
    if (tipo === 'proporcion') { lo = Math.max(0.001, lo); hi = Math.min(0.999, hi); } else if (tipo === 'varianza') lo = Math.max(centro * 0.2, lo); else if (tipo === 'dosvar') { lo = Math.max(0.05, lo); }
    const curva = []; for (let i = 0; i <= 60; i++) { const rv = lo + ((hi - lo) * i) / 60; try { curva.push([rv, pw(rv)]); } catch (e) { /* fuera de rango */ } }
    const alt = mod(real, n, n2);
    return { real, potencia, beta: 1 - potencia, objetivo, nec, necAlcanza: nec !== null, nom: P.nom, curva, alt, n, n2: P.n2 ? n2 : 0, centro };
  }

  function resolverNormalidad(sc, alfa) {
    const x = lista(sc.datos, 'los datos'); if (x.length < 3) throw new Error('Hacen falta al menos 3 datos'); if (x.length > 5000) throw new Error('Shapiro-Wilk vale hasta 5000 datos');
    const sh = IN.shapiro(x); if (!isFinite(sh.W)) throw new Error('Todos los datos son iguales: no hay nada que contrastar');
    const jb = x.length >= 4 ? IN.jarqueBera(x) : null, m = prom(x), s = desv(x), ord = [...x].sort((a, b) => a - b), rechaza = sh.p < alfa;
    const q = ord.map((v, i) => [IN.ppnd((i + 1 - 0.375) / (x.length + 0.25)), v]);
    const pasos = [
      { t: 'Hipótesis', html: `$H_0$: los datos proceden de una población normal, frente a $H_1$: no son normales; $α = ${f(alfa)}$, $n = ${x.length}$, $x̄ = ${f(m)}$, $s = ${f(s)}$.` },
      { t: 'Shapiro-Wilk', html: `$W = {(∑ a_i x_{(i)})^2}/{∑ (x_i − x̄)^2} = ${f(sh.W, 5)}$ (los coeficientes $a_i$ salen de los cuantiles de una normal; Royston, 1995). $W$ vale 1 si los datos son perfectamente normales y baja si no lo son. El p-valor es $p = ${ES.prob(sh.p)}$.` },
      ...(jb ? [{ t: 'Jarque-Bera', html: `Con la asimetría $g_1 = ${f(jb.g1)}$ y la curtosis en exceso $g_2 = ${f(jb.g2)}$: $JB = {n}/6 (g_1^2 + g_2^2/4) = ${f(jb.JB)}$, que para $n$ grande sigue una $χ^2$ con 2 grados de libertad: $p = e^{−JB/2} = ${ES.prob(jb.p)}$.${x.length < 30 ? ' Con pocos datos es poco fiable: manda Shapiro-Wilk.' : ''}` }] : []),
      { t: 'Gráfico cuantil-cuantil', html: 'Cada dato ordenado se dibuja frente al cuantil que le tocaría en una normal, $Φ^{-1}((i − 0,375)/(n + 0,25))$: si los puntos siguen la recta, los datos son compatibles con una normal.' },
      { t: 'Conclusión', html: rechaza ? `<b>Se rechaza $H_0$</b>: con $α = ${f(alfa)}$ hay pruebas de que los datos no son normales ($p = ${ES.prob(sh.p)}$).` : `<b>No se rechaza $H_0$</b>: no hay pruebas contra la normalidad ($p = ${ES.prob(sh.p)}$). Con pocos datos esto no prueba que sean normales, solo que no se ve lo contrario.` },
    ];
    return { tipo: 'normalidad', alfa, x, sh, jb, m, s, q, rechaza, est: sh.W, pv: sh.p, pasos };
  }
  function resolverVarios(sc, alfa) {
    const grupos = []; String(sc.datos ?? '').split(/\r?\n/).forEach((lin, i) => { const l = lin.trim(); if (!l || l.startsWith('#')) return; const j = l.indexOf(':'), nom = j > 0 ? l.slice(0, j).trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : `Grupo ${grupos.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `la línea ${i + 1}`); if (x.length < 2) throw new Error(`La línea ${i + 1} necesita al menos 2 valores`); grupos.push({ nom, x, n: x.length, s: desv(x) }); });
    if (grupos.length < 2) throw new Error('Escribe al menos dos grupos, uno por línea');
    if (grupos.some((g) => !(g.s > 0))) throw new Error('Algún grupo tiene todos los valores iguales (varianza 0): no se pueden comparar varianzas');
    const xs = grupos.map((g) => g.x), lev = IN.levene(xs, 'mediana'), levM = IN.levene(xs, 'media'), bar = IN.bartlett(xs), k = grupos.length, N = grupos.reduce((a, g) => a + g.n, 0);
    const met = sc.metodo === 'bartlett' ? 'bartlett' : 'levene', p = met === 'bartlett' ? bar.p : lev.p, rechaza = p < alfa;
    const pasos = [
      { t: 'Hipótesis', html: `$H_0$: $σ_1^2 = σ_2^2 = ⋯ = σ_{${k}}^2$ (las varianzas son iguales), frente a $H_1$: alguna difiere; $α = ${f(alfa)}$, $k = ${k}$ grupos, $N = ${N}$.<br>Desviaciones típicas: ${grupos.slice(0, 6).map((g, i) => `$s_{${i + 1}} = ${f(g.s)}$`).join(', ')}${k > 6 ? ', …' : ''}.` },
      { t: 'Levene (Brown-Forsythe)', html: `Se sustituye cada dato por su distancia a la mediana de su grupo, $z_{ij} = |x_{ij} − \\tilde x_i|$, y se hace un ANOVA sobre ellas: $W = ${f(lev.W)}$ con $${lev.gl1}$ y $${lev.gl2}$ grados de libertad, $p = ${ES.prob(lev.p)}$. Con la media en vez de la mediana: $W = ${f(levM.W)}$, $p = ${ES.prob(levM.p)}$. Es robusto frente a la falta de normalidad.` },
      { t: 'Bartlett', html: `$B = {(N − k) \\ln s_p^2 − ∑ (n_i − 1) \\ln s_i^2}/{1 + [∑ 1/(n_i − 1) − 1/(N − k)]/(3(k − 1))} = ${f(bar.B)}$, que bajo $H_0$ sigue una $χ^2$ con $${bar.gl}$ grados de libertad: $p = ${ES.prob(bar.p)}$. Es más potente que Levene si los datos son normales, pero muy sensible a que no lo sean.` },
      { t: 'Conclusión', html: `Con ${met === 'bartlett' ? 'Bartlett' : 'Levene'}, $p = ${ES.prob(p)}$: ${rechaza ? '<b>se rechaza $H_0$</b>, las varianzas no pueden darse por iguales (en un ANOVA, usa la F de Welch y Games-Howell)' : '<b>no se rechaza $H_0$</b>, no hay pruebas de que las varianzas difieran (se puede usar el ANOVA clásico)'}.` },
    ];
    return { tipo: 'varios', alfa, grupos, k, N, lev, levM, bar, met, p, rechaza, est: met === 'bartlett' ? bar.B : lev.W, pv: p, pasos };
  }

  function resolver(sc) {
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'media', h1 = H1[sc.h1] ? sc.h1 : 'distinto';
    const alfa = lee(sc, 'alfa', 'el nivel de significación α', { min: 0, minEx: true, max: 0.5, maxEx: true });
    if (tipo === 'normalidad') return resolverNormalidad(sc, alfa);
    if (tipo === 'varios') return resolverVarios(sc, alfa);
    const dv = deriva(sc, tipo), sc2 = dv.sc, tb = sc2.tipo && sc2.tipo !== tipo ? sc2.tipo : tipo;
    const r = resolverBase(sc2, alfa, tb, h1), norm = normalidad(dv.muestras, alfa), ef = efecto(sc2, tb, r), pot = potencia(sc2, tb, h1, alfa, r);
    if (dv.pre) r.pasos.unshift({ t: 'Datos', html: dv.pre });
    if (norm.length) { const w = norm.filter((q) => q.ok === false); r.pasos.splice(r.pasos.length - 1, 0, { t: 'Normalidad de los datos', html: `Shapiro-Wilk: ${norm.map((q) => (isFinite(q.W) ? `${q.nom}: $W = ${f(q.W, 4)}$, $p = ${ES.prob(q.p)}$` : `${q.nom}: no se puede calcular (hacen falta 3 datos no constantes)`)).join('; ')}. ${w.length ? '<b>Aviso:</b> se rechaza la normalidad de ' + w.map((q) => q.nom).join(' y ') + (['media', 'dosmedias'].includes(tb) ? '; con pocos datos la t pierde fiabilidad (mira los contrastes no paramétricos)' : '') + '.' : 'No hay pruebas contra la normalidad.'}` }); }
    if (ef) r.pasos.splice(r.pasos.length - 1, 0, { t: 'Tamaño del efecto', html: `${ef.txt}. Según Cohen (0,2 pequeño, 0,5 mediano, 0,8 grande), el efecto es <b>${lim(ef.val)}</b>. Un p-valor pequeño dice que la diferencia no es casualidad; el tamaño del efecto dice si es grande.` });
    if (pot) {
      const pp = pot, af = h1 === 'distinto' ? 'bilateral' : 'unilateral';
      r.pasos.splice(r.pasos.length - 1, 0, { t: 'Potencia y error de tipo II', html: `Si el valor real fuera $${pp.nom.replace(' real', '')} = ${f(pp.real)}$, el estadístico ya no seguiría la distribución de $H_0$ sino otra desplazada, y la probabilidad de caer en la región crítica (contraste ${af}, $α = ${f(alfa)}$) es la <b>potencia</b> $1 − β = ${f(pp.potencia, 4)}$. El <b>error de tipo II</b> es $β = ${f(pp.beta, 4)}$: no detectar esa diferencia aunque exista.${tb === 'media' && sc2.sigmaC !== 'si' || tb === 'dosmedias' && sc2.caso !== 'conocidas' ? ' Con la $t$, el estadístico bajo la alternativa sigue una t no central.' : ''}<br>Para una potencia de ${f(100 * pp.objetivo)} % ${pp.necAlcanza ? `hacen falta $n = ${pp.nec[0]}$${pp.n2 ? ` y $n_2 = ${pp.nec[1]}$` : ''} (ahora ${pp.n}${pp.n2 ? ` y ${pp.n2}` : ''}).` : 'no basta con ningún tamaño de muestra razonable (¿el valor real está en el lado contrario de H₁?).'}` });
    }
    return { ...r, norm, efecto: ef, pot, mod: tb };
  }

  const ejemplos = [
    { clave: 'paquetes', nombre: 'Una media, σ conocida: peso de paquetes', sc: { tipo: 'media', h1: 'distinto', alfa: '0,05', sigmaC: 'si', n: '25', xm: '496', s: '10', mu0: '500' } },
    { clave: 'pilas', nombre: 'Una media, σ desconocida (t): duración de pilas', sc: { tipo: 'media', h1: 'mayor', alfa: '0,05', sigmaC: 'no', n: '16', xm: '12,6', s: '1,2', mu0: '12' } },
    { clave: 'encuesta', nombre: 'Una proporción: intención de voto', sc: { tipo: 'proporcion', h1: 'mayor', alfa: '0,05', n: '200', x: '58', p0: '0,25' } },
    { clave: 'maquina', nombre: 'Una varianza: precisión de una máquina', sc: { tipo: 'varianza', h1: 'mayor', alfa: '0,05', n: '20', s: '2,5', s0: '2' } },
    { clave: 'metodos', nombre: 'Dos medias: dos métodos de enseñanza', sc: { tipo: 'dosmedias', h1: 'distinto', alfa: '0,05', caso: 'iguales', n1: '10', xm1: '85', s1: '4', n2: '12', xm2: '80', s2: '5', d0: '0' } },
    { clave: 'tratamiento', nombre: 'Dos proporciones: curación con dos tratamientos', sc: { tipo: 'dosprop', h1: 'distinto', alfa: '0,05', n1: '150', x1: '45', n2: '150', x2: '30' } },
    { clave: 'proveedores', nombre: 'Dos varianzas (F): dos proveedores', sc: { tipo: 'dosvar', h1: 'distinto', alfa: '0,05', n1: '11', s1: '3', n2: '13', s2: '2' } },
    { clave: 'potencia', nombre: 'Potencia y tamaño de muestra: duración de pilas', sc: { tipo: 'media', h1: 'mayor', alfa: '0,05', sigmaC: 'no', n: '16', xm: '12,6', s: '1,2', mu0: '12', real: '12,5', pot: '0,9' } },
    { clave: 'potencia-dos', nombre: 'Potencia de dos medias: métodos de enseñanza', sc: { tipo: 'dosmedias', h1: 'distinto', alfa: '0,05', caso: 'iguales', n1: '10', xm1: '85', s1: '4', n2: '12', xm2: '80', s2: '5', d0: '0', real: '4', pot: '0,8' } },
    { clave: 'datos', nombre: 'Una media con la lista de datos (y su normalidad)', sc: { tipo: 'media', h1: 'distinto', alfa: '0,05', entrada: 'datos', sigmaC: 'no', mu0: '500', datos: '498 502 495 497 501 496 494 499 503 492 497 500' } },
    { clave: 'apareados', nombre: 'Datos apareados: antes y después de un curso', sc: { tipo: 'apareados', h1: 'mayor', alfa: '0,05', mu0: '0', datos1: '6,2 5,8 7,1 4,9 6,5 5,2 7,4 6,0', datos2: '5,6 5,9 6,4 4,5 6,1 4,8 6,9 5,5' } },
    { clave: 'normalidad', nombre: 'Normalidad de una muestra (Shapiro-Wilk)', sc: { tipo: 'normalidad', alfa: '0,05', datos: '2,1 3,4 1,9 5,6 4,4 3,8 2,7 9,1 3,3 4 2,2 3,1 6,5' } },
    { clave: 'varios', nombre: 'Varias varianzas: tres máquinas (Levene y Bartlett)', sc: { tipo: 'varios', alfa: '0,05', metodo: 'levene', datos: 'M1: 10,1 9,9 10,0 10,2 9,8\nM2: 10,5 9,2 10,9 9,0 10,3\nM3: 10,0 10,1 9,9 10,1 9,9' } },
  ];

  return { resolver, ejemplos, TIPOS, H1, CASOS, ENTRADA, METODOS, TIPOS_VAR, PARAM, MODELO, potDe, lim };
})();

