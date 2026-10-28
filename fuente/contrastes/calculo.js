/* =====================================================================
   Contrastes de hipótesis (sin DOM): una media (z con σ conocida o t de
   Student), una proporción (z), una varianza (χ²), dos medias (z, t con
   varianzas iguales o Welch), dos proporciones (z con la proporción
   conjunta) y dos varianzas (F). Bilaterales o unilaterales, con el
   estadístico, la región crítica, el p-valor, la decisión y la conclusión
   en palabras. Las distribuciones y sus cuantiles salen de
   estadistica/calculo.js; formato y lectura en calculadora.js; interfaz en
   contrastes/app.js.
   ===================================================================== */
const Contrastes = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee } = K, D = ES.DIST;
  const TIPOS = { media: 'Una media μ', proporcion: 'Una proporción p', varianza: 'Una varianza σ²', dosmedias: 'Dos medias μ₁ − μ₂', dosprop: 'Dos proporciones p₁ − p₂', dosvar: 'Dos varianzas σ₁²/σ₂²' };
  const H1 = { distinto: 'Bilateral: ≠', mayor: 'Unilateral: >', menor: 'Unilateral: <' };
  const CASOS = { conocidas: 'σ₁ y σ₂ conocidas (z)', iguales: 'Desconocidas pero iguales (t)', distintas: 'Desconocidas y distintas (Welch)' };
  const p4 = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const SIGNO = { distinto: '≠', mayor: '>', menor: '<' };

  // distribución del estadístico bajo H₀: [D, parámetros, nombre]
  const dist = { z: () => [D.normal, { mu: 0, sigma: 1 }, 'N(0, 1)'], t: (nu) => [D.t, { nu }, `t de Student con ${f(nu, 5)} grados de libertad`], chi2: (k) => [D.chi2, { k }, `χ² con ${k} grados de libertad`], f: (d1, d2) => [D.f, { d1, d2 }, `F de Snedecor con (${d1}, ${d2}) grados de libertad`] };
  const nomEst = { z: 'Z', t: 'T', chi2: 'χ²', f: 'F' };

  // región crítica y p-valor para un estadístico T con distribución [Dd, P]
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

  // cada tipo devuelve { par, valor0, H, est, tipoD, d, formula, extra }
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

  function resolver(sc) {
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'media', h1 = H1[sc.h1] ? sc.h1 : 'distinto';
    const alfa = lee(sc, 'alfa', 'el nivel de significación α', { min: 0, minEx: true, max: 0.5, maxEx: true });
    const r = CALC[tipo](sc), { crit, rechaza, pv } = decide(r.est, r.d, h1, alfa, r.sim);
    const v0 = tipo === 'varianza' ? `${f(r.v0)} (σ_0 = ${f(Math.sqrt(r.v0))})` : f(r.v0), par = r.par.replace(/₁/g, '_1').replace(/₂/g, '_2').replace(/²/g, '^2');
    const pasos = [];
    pasos.push({ t: 'Hipótesis', html: `$H_0: ${par} ${h1 === 'distinto' ? '=' : h1 === 'mayor' ? '≤' : '≥'} ${v0}$ &ensp; frente a &ensp; $H_1: ${par} ${SIGNO[h1]} ${f(r.v0)}$, con $α = ${f(alfa)}$.` });
    pasos.push({ t: 'Estadístico de contraste', html: `${r.porque}<br>${r.formula}` });
    pasos.push({ t: 'Región crítica', html: `Bajo $H_0$ el estadístico sigue una ${r.d[2]}. ${h1 === 'distinto' ? `Se deja $α/2 = ${f(alfa / 2)}$ en cada cola` : `Se deja $α = ${f(alfa)}$ en la cola de la ${h1 === 'mayor' ? 'derecha' : 'izquierda'}`}: se rechaza $H_0$ si ${regionTxt(crit, h1, r.e)}.<br>El estadístico vale $${r.e} = ${f(r.est)}$: ${rechaza ? '<b>cae en la región crítica</b>' : '<b>no cae en la región crítica</b>'}.` });
    const pvTxt = h1 === 'mayor' ? `P(${r.e} ≥ ${f(r.est)})` : h1 === 'menor' ? `P(${r.e} ≤ ${f(r.est)})` : r.sim ? `2 P(${r.e} ≥ ${f(Math.abs(r.est))})` : `2 mín(P(${r.e} ≤ ${f(r.est)}), P(${r.e} ≥ ${f(r.est)}))`;
    pasos.push({ t: 'p-valor', html: `$p = ${pvTxt} = ${f(pv)}$, ${pv < alfa ? `menor que $α = ${f(alfa)}$` : `mayor que $α = ${f(alfa)}$`}: ${pv < alfa ? 'se rechaza' : 'no se rechaza'} $H_0$, igual que con la región crítica. El p-valor es la probabilidad de sacar un resultado tan raro como este, o más, si $H_0$ fuera cierta.` });
    pasos.push({ t: 'Conclusión', html: rechaza ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: los datos dan pruebas de que $${par} ${SIGNO[h1]} ${f(r.v0)}$.` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: los datos no dan pruebas suficientes de que $${par} ${SIGNO[h1]} ${f(r.v0)}$ (no quiere decir que $H_0$ sea verdad, solo que no se puede descartar).` });
    return { tipo, h1, alfa, ...r, crit, rechaza, pv, pasos };
  }

  const ejemplos = [
    { clave: 'paquetes', nombre: 'Una media, σ conocida: peso de paquetes', sc: { tipo: 'media', h1: 'distinto', alfa: '0,05', sigmaC: 'si', n: '25', xm: '496', s: '10', mu0: '500' } },
    { clave: 'pilas', nombre: 'Una media, σ desconocida (t): duración de pilas', sc: { tipo: 'media', h1: 'mayor', alfa: '0,05', sigmaC: 'no', n: '16', xm: '12,6', s: '1,2', mu0: '12' } },
    { clave: 'encuesta', nombre: 'Una proporción: intención de voto', sc: { tipo: 'proporcion', h1: 'mayor', alfa: '0,05', n: '200', x: '58', p0: '0,25' } },
    { clave: 'maquina', nombre: 'Una varianza: precisión de una máquina', sc: { tipo: 'varianza', h1: 'mayor', alfa: '0,05', n: '20', s: '2,5', s0: '2' } },
    { clave: 'metodos', nombre: 'Dos medias: dos métodos de enseñanza', sc: { tipo: 'dosmedias', h1: 'distinto', alfa: '0,05', caso: 'iguales', n1: '10', xm1: '85', s1: '4', n2: '12', xm2: '80', s2: '5', d0: '0' } },
    { clave: 'tratamiento', nombre: 'Dos proporciones: curación con dos tratamientos', sc: { tipo: 'dosprop', h1: 'distinto', alfa: '0,05', n1: '150', x1: '45', n2: '150', x2: '30' } },
    { clave: 'proveedores', nombre: 'Dos varianzas (F): dos proveedores', sc: { tipo: 'dosvar', h1: 'distinto', alfa: '0,05', n1: '11', s1: '3', n2: '13', s2: '2' } },
  ];

  return { resolver, ejemplos, TIPOS, H1, CASOS };
})();
if (typeof module !== 'undefined') module.exports = Contrastes;
