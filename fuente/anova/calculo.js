/* =====================================================================
   ANOVA de un factor (sin DOM). Compara las medias de k ≥ 2 grupos con la
   descomposición de la variabilidad (entre grupos, dentro de los grupos y
   total), el estadístico F, su valor crítico y p-valor, el tamaño del
   efecto η² y, si se pide, las comparaciones por parejas con la corrección
   de Bonferroni. Cada línea de los datos es un grupo, con un nombre
   opcional antes de «:». La F de Snedecor sale de estadistica/calculo.js;
   formato y lectura en calculadora.js; interfaz en anova/app.js.
   ===================================================================== */
const Anova = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista } = K, D = ES.DIST;
  const suma = (v) => v.reduce((a, b) => a + b, 0);
  const POST = { no: 'No', bonferroni: 'Comparaciones por parejas (Bonferroni)' };
  const sumaTxt = (t) => (t.length > 4 ? [...t.slice(0, 2), '…', t[t.length - 1]] : t).join(' + ');

  // grupos: { nom, x }; una línea por grupo, «nombre: valores» o solo los valores
  function grupos(texto) {
    const g = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim();
      if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'), nom = j > 0 ? l.slice(0, j).trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : `Grupo ${g.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `la línea ${i + 1}`);
      if (x.length < 1) throw new Error(`La línea ${i + 1} no tiene valores`);
      g.push({ nom, x });
    });
    if (g.length < 2) throw new Error('Escribe al menos dos grupos, uno por línea');
    return g;
  }

  function resolver(sc) {
    const alfa = lee(sc, 'alfa', 'el nivel de significación α', { min: 0, minEx: true, max: 0.5, maxEx: true });
    const g = grupos(sc.datos), k = g.length, N = suma(g.map((q) => q.x.length)), post = sc.post === 'bonferroni';
    if (N <= k) throw new Error('Hace falta algún grupo con más de un valor para estimar la variabilidad dentro de los grupos');
    for (const q of g) { q.n = q.x.length; q.m = suma(q.x) / q.n; q.ss = suma(q.x.map((v) => (v - q.m) ** 2)); q.s2 = q.n > 1 ? q.ss / (q.n - 1) : NaN; }
    const media = suma(g.map((q) => q.n * q.m)) / N;
    const SSB = suma(g.map((q) => q.n * (q.m - media) ** 2)), SSW = suma(g.map((q) => q.ss)), SST = SSB + SSW;
    const glB = k - 1, glW = N - k, MSB = SSB / glB, MSW = SSW / glW;
    if (!(MSW > 0)) throw new Error('Dentro de todos los grupos los valores son iguales (varianza 0): F no está definida');
    const F = MSB / MSW, P = { d1: glB, d2: glW }, pv = D.f.sf(P, F), crit = ES.cuantil(D.f, P, 1 - alfa), rechaza = F > crit;
    const eta2 = SSB / SST, om2 = Math.max(0, (SSB - glB * MSW) / (SST + MSW));
    // comparaciones por parejas
    const pares = [];
    if (post) {
      const m = (k * (k - 1)) / 2;
      for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
        const dif = g[i].m - g[j].m, ee = Math.sqrt(MSW * (1 / g[i].n + 1 / g[j].n)), t = dif / ee, p = Math.min(1, 2 * D.t.sf({ nu: glW }, Math.abs(t)) * m);
        pares.push({ a: g[i].nom, b: g[j].nom, dif, t, p, sig: p < alfa });
      }
    }
    const pasos = [];
    pasos.push({ t: 'Hipótesis', html: `$H_0$: $μ_1 = μ_2 = ⋯ = μ_{${k}}$ (todas las medias son iguales), frente a $H_1$: al menos dos medias son distintas; con $α = ${f(alfa)}$, $k = ${k}$ grupos y $N = ${N}$ observaciones.` });
    pasos.push({ t: 'Medias', html: `${g.slice(0, 4).map((q, i) => `$x̄_{${i + 1}} = ${f(q.m)}$ ($n_{${i + 1}} = ${q.n}$)`).join(', ')}${k > 4 ? ', …' : ''}.<br>Media global: $x̄ = {∑ n_i x̄_i}/N = ${f(media)}$.` });
    pasos.push({ t: 'Variabilidad entre grupos', html: `$SC_E = ∑ n_i (x̄_i − x̄)^2 = ${sumaTxt(g.map((q) => `${q.n}(${f(q.m)} − ${f(media)})^2`))} = ${f(SSB)}$<br>$CM_E = {SC_E}/{k − 1} = {${f(SSB)}}/{${glB}} = ${f(MSB)}$` });
    pasos.push({ t: 'Variabilidad dentro de los grupos', html: `$SC_D = ∑∑ (x_{ij} − x̄_i)^2 = ${sumaTxt(g.map((q) => f(q.ss)))} = ${f(SSW)}$<br>$CM_D = {SC_D}/{N − k} = {${f(SSW)}}/{${glW}} = ${f(MSW)}$` });
    pasos.push({ t: 'Estadístico F', html: `$F = {CM_E}/{CM_D} = {${f(MSB)}}/{${f(MSW)}} = ${f(F)}$, que bajo $H_0$ sigue una F de Snedecor con $${glB}$ y $${glW}$ grados de libertad.<br>Comprobación: $SC_T = SC_E + SC_D = ${f(SSB)} + ${f(SSW)} = ${f(SST)}$.` });
    pasos.push({ t: 'Región crítica y p-valor', html: `El contraste es por la derecha: el valor crítico es $F_{${glB}, ${glW}; ${f(1 - alfa)}} = ${f(crit)}$ y el p-valor, $P(F_{${glB}, ${glW}} ≥ ${f(F)}) = ${ES.prob(pv)}$.` });
    pasos.push({ t: 'Conclusión', html: rechaza ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: hay diferencias entre las medias (η² = ${f(eta2, 3)}: el factor explica el ${f(100 * eta2, 3)} % de la variabilidad).` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: no hay evidencia de que las medias sean distintas (η² = ${f(eta2, 3)}).` });
    if (post) {
      const m = pares.length, e = pares[0];
      pasos.push({ t: 'Comparaciones por parejas', html: `Para cada pareja, $t = {x̄_i − x̄_j}/√(CM_D (1/n_i + 1/n_j))$ con $${glW}$ grados de libertad, y el p-valor se multiplica por el número de parejas, $m = k(k − 1)/2 = ${m}$ (Bonferroni), para controlar el error global.<br>Por ejemplo, ${e.a} − ${e.b}: $t = ${f(e.t)}$, $p = ${ES.prob(e.p)}$.${rechaza ? '' : ' Con la F no significativa, estas comparaciones son solo orientativas.'}` });
    }
    return { g, k, N, media, SSB, SSW, SST, glB, glW, MSB, MSW, F, pv, crit, rechaza, alfa, eta2, om2, pares, post, pasos };
  }

  const ejemplos = [
    { clave: 'abonos', nombre: 'Tres abonos: producción de las plantas', sc: { alfa: '0,05', post: 'bonferroni', datos: 'A: 20 21 23 19 22\nB: 24 26 25 27 23\nC: 29 28 31 27 30' } },
    { clave: 'iguales', nombre: 'Sin diferencias: cuatro máquinas', sc: { alfa: '0,05', post: 'no', datos: 'M1: 10,2 9,8 10,1 10,0\nM2: 10,1 10,3 9,9 10,2\nM3: 9,9 10,0 10,2 10,1\nM4: 10,0 10,1 9,8 10,3' } },
    { clave: 'dos', nombre: 'Dos grupos (equivale a la t de dos medias)', sc: { alfa: '0,05', post: 'no', datos: '12 14 15 13 16\n18 17 19 20 16' } },
  ];
  return { resolver, ejemplos, POST, grupos };
})();
if (typeof module !== 'undefined') module.exports = Anova;
