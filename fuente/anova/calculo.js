/* =====================================================================
   ANOVA de uno y dos factores (sin DOM). Un factor: la descomposición de la
   variabilidad (entre, dentro y total), F con su valor crítico y p-valor, el
   tamaño del efecto (η², ω² y f de Cohen), el intervalo de cada media, los
   supuestos (Levene, Bartlett y Shapiro-Wilk de los residuos), la F de Welch
   para varianzas distintas, las comparaciones por parejas (Bonferroni, Holm,
   Scheffé, Tukey y Games-Howell) y contrastes planificados. Dos factores:
   diseño equilibrado con o sin interacción. Cada línea de los datos es un
   grupo (un factor) o una casilla «A / B: valores» (dos factores). El rango
   studentizado, Levene, Welch y Shapiro-Wilk están en estadistica/inferencia.js;
   la F y la t, en estadistica/calculo.js; formato y lectura, en calculadora.js;
   la interfaz, en anova/app.js.
   ===================================================================== */
const Anova = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const IN = typeof Inferencia !== 'undefined' ? Inferencia : require('../estadistica/inferencia.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista } = K, D = ES.DIST, suma = IN.suma;
  const MODOS = { uno: 'Un factor', dos: 'Dos factores (diseño equilibrado)' };
  const POST = { no: 'No', tukey: 'Tukey (HSD)', bonferroni: 'Bonferroni', holm: 'Holm', scheffe: 'Scheffé', gh: 'Games-Howell (varianzas distintas)' };
  const POST_DOS = ['no', 'tukey', 'bonferroni', 'holm', 'scheffe'];
  const PRUEBA = { f: 'F clásica (varianzas iguales)', welch: 'F de Welch (varianzas distintas)' };
  const sumaTxt = (t) => (t.length > 4 ? [...t.slice(0, 2), '…', t[t.length - 1]] : t).join(' + ');
  const limpia = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tq = (nu, p) => ES.cuantil(D.t, { nu }, p), fq = (d1, d2, p) => ES.cuantil(D.f, { d1, d2 }, p);
  const pT2 = (nu, t) => Math.min(1, 2 * D.t.sf({ nu }, Math.abs(t)));

  // grupos: { nom, x }; una línea por grupo, «nombre: valores» o solo los valores
  function grupos(texto) {
    const g = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim();
      if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'), nom = j > 0 ? limpia(l.slice(0, j).trim()) : `Grupo ${g.length + 1}`, x = lista(j > 0 ? l.slice(j + 1) : l, `la línea ${i + 1}`);
      if (x.length < 1) throw new Error(`La línea ${i + 1} no tiene valores`);
      g.push({ nom, x });
    });
    if (g.length < 2) throw new Error('Escribe al menos dos grupos, uno por línea');
    return g;
  }

  // Comparaciones por parejas entre medias con la misma varianza residual. m: [{ nom, m, r }] (r = observaciones de cada media);
  // kF = nº de niveles del factor; gl = g. l. del error. Devuelve una fila por pareja.
  function parejas(m, MSE, gl, metodo, alfa) {
    const k = m.length, filas = [], np = (k * (k - 1)) / 2;
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      const dif = m[i].m - m[j].m, v = 1 / m[i].r + 1 / m[j].r, ee = Math.sqrt(MSE * v), t = dif / ee;
      const p0 = pT2(gl, t); let p, lo, hi, est = t, etq = 't';
      if (metodo === 'bonferroni') { p = Math.min(1, p0 * np); const c = tq(gl, 1 - alfa / (2 * np)); lo = dif - c * ee; hi = dif + c * ee; }
      else if (metodo === 'holm') { p = p0; lo = hi = NaN; }
      else if (metodo === 'scheffe') { est = (t * t) / (k - 1); etq = 'F'; p = D.f.sf({ d1: k - 1, d2: gl }, est); const c = Math.sqrt((k - 1) * fq(k - 1, gl, 1 - alfa)) * ee; lo = dif - c; hi = dif + c; }
      else { const q = Math.abs(dif) / (ee / Math.SQRT2); est = q; etq = 'q'; p = Math.max(0, 1 - IN.ptukey(q, k, gl)); const c = IN.qtukey(1 - alfa, k, gl) * ee / Math.SQRT2; lo = dif - c; hi = dif + c; }
      filas.push({ a: m[i].nom, b: m[j].nom, dif, est, etq, p, lo, hi });
    }
    if (metodo === 'holm') { const aj = IN.holm(filas.map((q) => q.p)); filas.forEach((q, i) => { q.p = aj[i]; }); }
    filas.forEach((q) => { q.sig = q.p < alfa; });
    return filas;
  }
  // Games-Howell: cada pareja con su propia varianza y sus g. l. de Welch-Satterthwaite
  function gamesHowell(g, alfa) {
    const k = g.length, filas = [];
    if (g.some((q) => q.n < 2)) throw new Error('Games-Howell necesita al menos dos valores en cada grupo');
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
      const vi = g[i].s2 / g[i].n, vj = g[j].s2 / g[j].n, se = Math.sqrt(vi + vj), dif = g[i].m - g[j].m, gl = (vi + vj) ** 2 / (vi ** 2 / (g[i].n - 1) + vj ** 2 / (g[j].n - 1));
      if (!(se > 0)) throw new Error('Games-Howell necesita que los grupos tengan alguna variación');
      const q = Math.abs(dif) / (se / Math.SQRT2), p = Math.max(0, 1 - IN.ptukey(q, k, gl)), c = IN.qtukey(1 - alfa, k, gl) * se / Math.SQRT2;
      filas.push({ a: g[i].nom, b: g[j].nom, dif, est: q, etq: 'q', p, lo: dif - c, hi: dif + c, gl, sig: p < alfa });
    }
    return filas;
  }

  // Contrastes planificados: una línea por contraste, «nombre: c1 c2 … ck» con Σcᵢ = 0
  function contrastes(texto, g, MSW, glW, alfa) {
    const out = [], k = g.length;
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim(); if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'), nom = j > 0 ? limpia(l.slice(0, j).trim()) : `Contraste ${out.length + 1}`, c = lista(j > 0 ? l.slice(j + 1) : l, `el contraste de la línea ${i + 1}`);
      if (c.length !== k) throw new Error(`El contraste «${nom}» tiene ${c.length} coeficientes y hay ${k} grupos`);
      const s = suma(c); if (Math.abs(s) > 1e-9 * Math.max(1, ...c.map(Math.abs))) throw new Error(`Los coeficientes del contraste «${nom}» suman ${f(s)}: tienen que sumar 0`);
      if (c.every((v) => v === 0)) throw new Error(`El contraste «${nom}» tiene todos los coeficientes a 0`);
      const psi = suma(c.map((v, q) => v * g[q].m)), ee = Math.sqrt(MSW * suma(c.map((v, q) => (v * v) / g[q].n))), t = psi / ee, p = pT2(glW, t), h = tq(glW, 1 - alfa / 2) * ee;
      out.push({ nom, c, psi, ee, t, p, lo: psi - h, hi: psi + h, sig: p < alfa });
    });
    return out;
  }

  /* ---------- Un factor ---------- */
  function resolverUno(sc, alfa) {
    const g = grupos(sc.datos), k = g.length, N = suma(g.map((q) => q.x.length)), post = POST[sc.post] && sc.post !== 'no' ? sc.post : 'no', welchSel = sc.prueba === 'welch';
    if (N <= k) throw new Error('Hace falta algún grupo con más de un valor para estimar la variabilidad dentro de los grupos');
    for (const q of g) { q.n = q.x.length; q.m = suma(q.x) / q.n; q.ss = suma(q.x.map((v) => (v - q.m) ** 2)); q.s2 = q.n > 1 ? q.ss / (q.n - 1) : NaN; }
    const media = suma(g.map((q) => q.n * q.m)) / N;
    const SSB = suma(g.map((q) => q.n * (q.m - media) ** 2)), SSW = suma(g.map((q) => q.ss)), SST = SSB + SSW;
    const glB = k - 1, glW = N - k, MSB = SSB / glB, MSW = SSW / glW;
    if (!(MSW > 0)) throw new Error('Dentro de todos los grupos los valores son iguales (varianza 0): F no está definida');
    const F = MSB / MSW, P = { d1: glB, d2: glW }, pvF = D.f.sf(P, F), critF = fq(glB, glW, 1 - alfa);
    const eta2 = SSB / SST, om2 = Math.max(0, (SSB - glB * MSW) / (SST + MSW)), fC = Math.sqrt(eta2 / (1 - eta2));
    const wel = IN.welch(g.map((q) => q.x)), sup = IN.supuestos(g.map((q) => q.x), alfa);
    if (welchSel && !wel) throw new Error('La F de Welch necesita al menos dos valores en cada grupo y que ninguno sea constante');
    const usaW = welchSel && wel, Fp = usaW ? wel.F : F, p = usaW ? wel.p : pvF, g1 = usaW ? wel.gl1 : glB, g2 = usaW ? wel.gl2 : glW, crit = usaW ? fq(g1, g2, 1 - alfa) : critF, rechaza = p < alfa;
    // media de cada grupo con su intervalo (varianza común)
    const tcrit = tq(glW, 1 - alfa / 2);
    for (const q of g) { const h = tcrit * Math.sqrt(MSW / q.n); q.lo = q.m - h; q.hi = q.m + h; q.s = Math.sqrt(q.s2); }
    const pares = post === 'gh' ? gamesHowell(g, alfa) : post !== 'no' ? parejas(g.map((q) => ({ nom: q.nom, m: q.m, r: q.n })), MSW, glW, post, alfa) : [];
    const contr = String(sc.contrastes ?? '').trim() ? contrastes(sc.contrastes, g, MSW, glW, alfa) : [];
    // avisos de supuestos
    const avisos = [];
    if (sup.levene && isFinite(sup.levene.p) && sup.levene.p < alfa) avisos.push(`Levene rechaza que las varianzas sean iguales (p = ${ES.prob(sup.levene.p)}): conviene la F de Welch y, para comparar parejas, Games-Howell.`);
    if (sup.shapiro && isFinite(sup.shapiro.p) && sup.shapiro.p < alfa) avisos.push(`Shapiro-Wilk rechaza la normalidad de los residuos (p = ${ES.prob(sup.shapiro.p)}): mira Kruskal-Wallis en Contrastes no paramétricos.`);
    if (k >= 2 && Math.max(...g.map((q) => q.n)) / Math.min(...g.map((q) => q.n)) > 1.5) avisos.push('Los grupos tienen tamaños distintos: el ANOVA es menos robusto a que las varianzas difieran.');
    // desarrollo
    const pasos = [];
    pasos.push({ t: 'Hipótesis', html: `$H_0$: $μ_1 = μ_2 = ⋯ = μ_{${k}}$ (todas las medias son iguales), frente a $H_1$: al menos dos medias son distintas; con $α = ${f(alfa)}$, $k = ${k}$ grupos y $N = ${N}$ observaciones.` });
    pasos.push({ t: 'Medias', html: `${g.slice(0, 4).map((q, i) => `$x̄_{${i + 1}} = ${f(q.m)}$ ($n_{${i + 1}} = ${q.n}$)`).join(', ')}${k > 4 ? ', …' : ''}.<br>Media global: $x̄ = {∑ n_i x̄_i}/N = ${f(media)}$.` });
    pasos.push({ t: 'Variabilidad entre grupos', html: `$SC_E = ∑ n_i (x̄_i − x̄)^2 = ${sumaTxt(g.map((q) => `${q.n}(${f(q.m)} − ${f(media)})^2`))} = ${f(SSB)}$<br>$CM_E = {SC_E}/{k − 1} = {${f(SSB)}}/{${glB}} = ${f(MSB)}$` });
    pasos.push({ t: 'Variabilidad dentro de los grupos', html: `$SC_D = ∑∑ (x_{ij} − x̄_i)^2 = ${sumaTxt(g.map((q) => f(q.ss)))} = ${f(SSW)}$<br>$CM_D = {SC_D}/{N − k} = {${f(SSW)}}/{${glW}} = ${f(MSW)}$` });
    pasos.push({ t: 'Estadístico F', html: `$F = {CM_E}/{CM_D} = {${f(MSB)}}/{${f(MSW)}} = ${f(F)}$, que bajo $H_0$ sigue una F de Snedecor con $${glB}$ y $${glW}$ grados de libertad.<br>Comprobación: $SC_T = SC_E + SC_D = ${f(SSB)} + ${f(SSW)} = ${f(SST)}$.` });
    pasos.push({ t: 'Supuestos', html: `Levene (con la mediana): $W = ${f(sup.levene.W)}$, $p = ${ES.prob(sup.levene.p)}$ → ${sup.varianzasOk === false ? 'las varianzas <b>no</b> pueden darse por iguales' : 'no hay evidencia de que las varianzas difieran'}.<br>Shapiro-Wilk de los residuos $x_{ij} − x̄_i$: ${sup.shapiro && isFinite(sup.shapiro.W) ? `$W = ${f(sup.shapiro.W, 4)}$, $p = ${ES.prob(sup.shapiro.p)}$ → ${sup.normalidadOk === false ? 'la normalidad <b>no</b> se sostiene' : 'no hay evidencia contra la normalidad'}` : 'no se puede calcular (hacen falta al menos 3 residuos no constantes)'}.${avisos.length ? `<br><b>Aviso:</b> ${avisos.join(' ')}` : ''}` });
    if (usaW) pasos.push({ t: 'F de Welch', html: `Con varianzas distintas se pondera cada grupo por $w_i = n_i/s_i^2$ (Welch, 1951): $F^* = ${f(wel.F)}$ con $${f(wel.gl1)}$ y $${f(wel.gl2)}$ grados de libertad (estos últimos aproximados); el valor crítico es $${f(crit)}$ y el p-valor, $${ES.prob(wel.p)}$.` });
    pasos.push({ t: 'Región crítica y p-valor', html: `El contraste es por la derecha: el valor crítico es $F_{${f(g1)}, ${f(g2)}; ${f(1 - alfa)}} = ${f(crit)}$ y el p-valor, $P(F ≥ ${f(Fp)}) = ${ES.prob(p)}$${usaW ? '' : ` (para comparar, la F de Welch da $${wel ? ES.prob(wel.p) : '—'}$)`}.` });
    pasos.push({ t: 'Tamaño del efecto', html: `$η^2 = {SC_E}/{SC_T} = ${f(eta2, 3)}$: el factor explica el ${f(100 * eta2, 3)} % de la variabilidad.<br>$ω^2 = {SC_E − (k − 1) CM_D}/{SC_T + CM_D} = ${f(om2, 3)}$ (menos sesgado que $η^2$ con pocos datos); $f = √{η^2/(1 − η^2)} = ${f(fC, 3)}$ (Cohen: 0,10 pequeño, 0,25 mediano, 0,40 grande).` });
    pasos.push({ t: 'Conclusión', html: rechaza ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: hay diferencias entre las medias.` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: no hay evidencia de que las medias sean distintas.` });
    pasos.push({ t: 'Intervalo de cada media', html: `Con la varianza común, $x̄_i ± t_{${glW}; ${f(1 - alfa / 2)}} √{CM_D/n_i}$, con $t = ${f(tcrit)}$. Por ejemplo, el grupo 1: $(${f(g[0].lo)}; ${f(g[0].hi)})$.` });
    if (pares.length) {
      const e = pares[0], m = pares.length;
      const txt = { bonferroni: `Para cada pareja, $t = {x̄_i − x̄_j}/√(CM_D (1/n_i + 1/n_j))$ con $${glW}$ grados de libertad, y el p-valor se multiplica por el número de parejas, $m = k(k − 1)/2 = ${m}$ (Bonferroni).`,
        holm: `Para cada pareja, $t = {x̄_i − x̄_j}/√(CM_D (1/n_i + 1/n_j))$ con $${glW}$ grados de libertad. Se ordenan los $m = ${m}$ p-valores de menor a mayor y el de la posición $r$ se multiplica por $m − r + 1$ (Holm), manteniendo que no baje del anterior: es más potente que Bonferroni con el mismo control del error global.`,
        scheffe: `Para cada pareja, $F = {(x̄_i − x̄_j)^2}/{(k − 1) CM_D (1/n_i + 1/n_j)}$ con $${glB}$ y $${glW}$ grados de libertad (Scheffé): es el más conservador, pero vale para cualquier contraste, no solo para parejas.`,
        tukey: `Para cada pareja, $q = {|x̄_i − x̄_j|}/√(CM_D/2 · (1/n_i + 1/n_j))$, que bajo $H_0$ sigue el rango studentizado con $k = ${k}$ y $${glW}$ grados de libertad (Tukey-Kramer si los grupos tienen distinto tamaño). Controla el error global de <i>todas</i> las parejas a la vez y es la comparación habitual.`,
        gh: `Para cada pareja, $q = {|x̄_i − x̄_j|}/√{(s_i^2/n_i + s_j^2/n_j)/2}$ con los grados de libertad de Welch-Satterthwaite de esa pareja (Games-Howell): no supone varianzas iguales.` }[post];
      pasos.push({ t: `Comparaciones por parejas (${POST[post].replace(/ \(.*/, '')})`, html: `${txt}<br>Por ejemplo, ${e.a} − ${e.b}: $${e.etq} = ${f(e.est)}$, $p = ${ES.prob(e.p)}$.${rechaza ? '' : ' Con la F no significativa, estas comparaciones son solo orientativas.'}` });
    }
    contr.forEach((c) => pasos.push({ t: `Contraste: ${c.nom}`, html: `$ψ = ∑ c_i x̄_i = ${sumaTxt(c.c.map((v, q) => `(${f(v)})(${f(g[q].m)})`))} = ${f(c.psi)}$; $EE = √(CM_D ∑ c_i^2/n_i) = ${f(c.ee)}$; $t = ψ/EE = ${f(c.t)}$ con $${glW}$ g. l.; $p = ${ES.prob(c.p)}$; IC ${f(100 * (1 - alfa))} %: $(${f(c.lo)}; ${f(c.hi)})$. ${c.sig ? '<b>Significativo</b>' : 'No significativo'}.` }));
    return { modo: 'uno', g, k, N, media, SSB, SSW, SST, glB, glW, MSB, MSW, F, pvF, Fp, p, pv: p, g1, g2, crit, critF, rechaza, alfa, eta2, om2, fC, wel, usaW, sup, pares, post, contr, avisos, pasos };
  }

  /* ---------- Dos factores ---------- */
  // casillas: «A / B: valores»; diseño equilibrado (todas las combinaciones con las mismas repeticiones)
  function casillas(texto) {
    const A = [], B = [], cel = new Map();
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim(); if (!l || l.startsWith('#')) return;
      const j = l.indexOf(':'); if (j < 1) throw new Error(`La línea ${i + 1} tiene que ser «nivel A / nivel B: valores»`);
      const nombres = l.slice(0, j).split('/').map((s) => s.trim()); if (nombres.length !== 2 || !nombres[0] || !nombres[1]) throw new Error(`La línea ${i + 1} tiene que nombrar un nivel de cada factor, «nivel A / nivel B: valores»`);
      const [a, b] = nombres.map(limpia), x = lista(l.slice(j + 1), `la línea ${i + 1}`); if (!x.length) throw new Error(`La línea ${i + 1} no tiene valores`);
      if (!A.includes(a)) A.push(a); if (!B.includes(b)) B.push(b);
      const key = `${a}\u0000${b}`; if (cel.has(key)) throw new Error(`La combinación «${a} / ${b}» aparece dos veces: ponla en una sola línea`);
      cel.set(key, x);
    });
    if (A.length < 2 || B.length < 2) throw new Error('Cada factor necesita al menos dos niveles');
    let n = null;
    for (const a of A) for (const b of B) {
      const x = cel.get(`${a}\u0000${b}`); if (!x) throw new Error(`Falta la combinación «${a} / ${b}»: el diseño tiene que ser equilibrado (todas las combinaciones, con las mismas repeticiones)`);
      if (n === null) n = x.length; else if (x.length !== n) throw new Error(`Las casillas tienen distinto número de datos (${n} y ${x.length}): el diseño tiene que ser equilibrado`);
    }
    return { A, B, n, cel };
  }
  function resolverDos(sc, alfa) {
    const { A, B, n, cel } = casillas(sc.datos), a = A.length, b = B.length, N = a * b * n, nomA = limpia(String(sc.nomA || 'Factor A').trim() || 'Factor A'), nomB = limpia(String(sc.nomB || 'Factor B').trim() || 'Factor B');
    const post = POST_DOS.includes(sc.post) ? sc.post : 'no', M = A.map((u) => B.map((v) => { const x = cel.get(`${u}\u0000${v}`); return suma(x) / n; }));
    const mA = M.map((r) => suma(r) / b), mB = B.map((_, j) => suma(M.map((r) => r[j])) / a), mg = suma(mA) / a;
    const SSA = b * n * suma(mA.map((v) => (v - mg) ** 2)), SSB = a * n * suma(mB.map((v) => (v - mg) ** 2));
    let SSAB = 0, SSE = 0;
    A.forEach((u, i) => B.forEach((v, j) => { SSAB += n * (M[i][j] - mA[i] - mB[j] + mg) ** 2; SSE += suma(cel.get(`${u}\u0000${v}`).map((y) => (y - M[i][j]) ** 2)); }));
    const SST = SSA + SSB + SSAB + SSE, glA = a - 1, glB = b - 1, glAB = glA * glB;
    const repl = n > 1, glE = repl ? a * b * (n - 1) : glAB, SCe = repl ? SSE : SSAB, MSE = SCe / glE;
    if (!(MSE > 0)) throw new Error(repl ? 'Dentro de todas las casillas los valores son iguales (varianza 0): F no está definida' : 'Sin repeticiones la interacción hace de error y aquí vale 0: F no está definida');
    const filasEf = [{ nom: nomA, SS: SSA, gl: glA }, { nom: nomB, SS: SSB, gl: glB }, ...(repl ? [{ nom: `${nomA} × ${nomB}`, SS: SSAB, gl: glAB }] : [])];
    for (const e of filasEf) { e.MS = e.SS / e.gl; e.F = e.MS / MSE; e.p = D.f.sf({ d1: e.gl, d2: glE }, e.F); e.crit = fq(e.gl, glE, 1 - alfa); e.eta2p = e.SS / (e.SS + SCe); e.om2p = Math.max(0, (e.gl * (e.F - 1)) / (e.gl * (e.F - 1) + N)); e.sig = e.p < alfa; }
    const todo = []; const res = [];
    A.forEach((u, i) => B.forEach((v, j) => { const x = cel.get(`${u}\u0000${v}`); todo.push(x); res.push(...x.map((y) => y - M[i][j])); }));
    const sh = repl && res.length >= 3 ? IN.shapiro(res) : null, lev = repl ? IN.levene(todo, 'mediana') : null;
    const margA = A.map((nm, i) => ({ nom: nm, m: mA[i], r: b * n })), margB = B.map((nm, j) => ({ nom: nm, m: mB[j], r: a * n }));
    const paresA = post !== 'no' ? parejas(margA, MSE, glE, post, alfa) : [], paresB = post !== 'no' ? parejas(margB, MSE, glE, post, alfa) : [];
    const avisos = [];
    if (!repl) avisos.push('Con un solo dato por casilla no se puede separar la interacción del error: se supone que no hay interacción y se usa su variabilidad como error.');
    if (lev && isFinite(lev.p) && lev.p < alfa) avisos.push(`Levene rechaza que las varianzas de las casillas sean iguales (p = ${ES.prob(lev.p)}): los p-valores son orientativos.`);
    if (sh && isFinite(sh.p) && sh.p < alfa) avisos.push(`Shapiro-Wilk rechaza la normalidad de los residuos (p = ${ES.prob(sh.p)}).`);
    const ef = filasEf, inter = repl ? ef[2] : null;
    const pasos = [];
    pasos.push({ t: 'Modelo e hipótesis', html: `$x_{ijk} = μ + α_i + β_j + (αβ)_{ij} + ε_{ijk}$ con $a = ${a}$ niveles de «${nomA}», $b = ${b}$ de «${nomB}» y $n = ${n}$ repeticiones por casilla ($N = ${N}$). Se contrastan tres hipótesis nulas: no hay efecto de «${nomA}», no hay efecto de «${nomB}»${repl ? ' y no hay interacción' : ''}; $α = ${f(alfa)}$.` });
    pasos.push({ t: 'Medias', html: `Media global $x̄ = ${f(mg)}$. Medias de «${nomA}»: ${A.map((nm, i) => `${nm} = ${f(mA[i])}`).join(', ')}. Medias de «${nomB}»: ${B.map((nm, j) => `${nm} = ${f(mB[j])}`).join(', ')}.` });
    pasos.push({ t: 'Sumas de cuadrados', html: `$SC_A = b n ∑ (x̄_{i··} − x̄)^2 = ${f(SSA)}$; $SC_B = a n ∑ (x̄_{·j·} − x̄)^2 = ${f(SSB)}$; $SC_{AB} = n ∑∑ (x̄_{ij·} − x̄_{i··} − x̄_{·j·} + x̄)^2 = ${f(SSAB)}$${repl ? `; $SC_E = ∑∑∑ (x_{ijk} − x̄_{ij·})^2 = ${f(SSE)}$` : ''}.<br>Comprobación: $SC_T = ${f(SST)}$.` });
    pasos.push({ t: 'Cuadrados medios y F', html: `${ef.map((e) => `${e.nom}: $CM = ${f(e.SS)}/${e.gl} = ${f(e.MS)}$, $F = ${f(e.MS)}/${f(MSE)} = ${f(e.F)}$, $p = ${ES.prob(e.p)}$`).join('<br>')}<br>El error tiene $${glE}$ grados de libertad y $CM_E = ${f(MSE)}$.` });
    pasos.push({ t: 'Supuestos', html: `${lev ? `Levene entre casillas: $W = ${f(lev.W)}$, $p = ${ES.prob(lev.p)}$.` : 'Con un dato por casilla no se pueden comprobar las varianzas.'}${sh && isFinite(sh.W) ? ` Shapiro-Wilk de los residuos: $W = ${f(sh.W, 4)}$, $p = ${ES.prob(sh.p)}$.` : ''}${avisos.length ? `<br><b>Aviso:</b> ${avisos.join(' ')}` : ''}` });
    pasos.push({ t: 'Conclusión', html: `${ef.map((e) => `${e.nom}: ${e.sig ? '<b>efecto significativo</b>' : 'sin efecto significativo'} ($F = ${f(e.F)}$, $p = ${ES.prob(e.p)}$; $η^2_p = ${f(e.eta2p, 3)}$)`).join('<br>')}${inter && inter.sig ? '<br>Con interacción significativa, los efectos principales hay que leerlos con cuidado: el efecto de un factor depende del nivel del otro (mira las líneas de la gráfica: si no son paralelas, hay interacción).' : ''}` });
    const par = (ps, tit) => ps.length && pasos.push({ t: `Comparaciones de «${tit}» (${POST[post].replace(/ \(.*/, '')})`, html: `Cada media de «${tit}» se basa en $${tit === nomA ? b * n : a * n}$ datos y se usa $CM_E$ con $${glE}$ grados de libertad.<br>Por ejemplo, ${ps[0].a} − ${ps[0].b}: $${ps[0].etq} = ${f(ps[0].est)}$, $p = ${ES.prob(ps[0].p)}$.` });
    par(paresA, nomA); par(paresB, nomB);
    return { modo: 'dos', A, B, n, a, b, N, nomA, nomB, M, mA, mB, mg, SSA, SSB, SSAB, SSE, SST, ef, inter, repl, glE, MSE, sh, lev, paresA, paresB, post, alfa, avisos, pasos, F: ef[0].F, pv: ef[0].p, rechaza: ef.some((e) => e.sig) };
  }

  function resolver(sc) {
    const alfa = lee(sc, 'alfa', 'el nivel de significación α', { min: 0, minEx: true, max: 0.5, maxEx: true });
    return sc.modo === 'dos' ? resolverDos(sc, alfa) : resolverUno(sc, alfa);
  }

  const ejemplos = [
    { clave: 'abonos', nombre: 'Tres abonos: producción de las plantas', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'tukey', contrastes: 'A frente a la media de B y C: 2 -1 -1', datos: 'A: 20 21 23 19 22\nB: 24 26 25 27 23\nC: 29 28 31 27 30' } },
    { clave: 'iguales', nombre: 'Sin diferencias: cuatro máquinas', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'no', contrastes: '', datos: 'M1: 10,2 9,8 10,1 10,0\nM2: 10,1 10,3 9,9 10,2\nM3: 9,9 10,0 10,2 10,1\nM4: 10,0 10,1 9,8 10,3' } },
    { clave: 'dos', nombre: 'Dos grupos (equivale a la t de dos medias)', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'no', contrastes: '', datos: '12 14 15 13 16\n18 17 19 20 16' } },
    { clave: 'varianzas', nombre: 'Varianzas muy distintas: Welch y Games-Howell', sc: { modo: 'uno', alfa: '0,05', prueba: 'welch', post: 'gh', contrastes: '', datos: 'Rápida: 20 21 23 19 22\nMedia: 24 26 25 27 23 30\nLenta: 29 28 31 27 30 40 12' } },
    { clave: 'bonferroni', nombre: 'Tres dietas: Bonferroni, Holm y Scheffé', sc: { modo: 'uno', alfa: '0,05', prueba: 'f', post: 'holm', contrastes: '', datos: 'Dieta 1: 8,2 7,9 9,1 8,6 8,0\nDieta 2: 9,8 10,4 9,5 10,1\nDieta 3: 8,9 9,2 8,4 9,6 9,0 8,7' } },
    { clave: 'dos-factores', nombre: 'Dos factores: abono y riego, con interacción', sc: { modo: 'dos', alfa: '0,05', post: 'tukey', nomA: 'Abono', nomB: 'Riego', datos: 'A1 / Poco: 20 22 21\nA1 / Mucho: 25 27 26\nA2 / Poco: 24 23 25\nA2 / Mucho: 38 36 37\nA3 / Poco: 18 20 19\nA3 / Mucho: 21 22 20' } },
    { clave: 'sin-replicas', nombre: 'Dos factores sin repeticiones (bloques)', sc: { modo: 'dos', alfa: '0,05', post: 'no', nomA: 'Tratamiento', nomB: 'Bloque', datos: 'T1 / B1: 12\nT1 / B2: 15\nT1 / B3: 11\nT2 / B1: 14\nT2 / B2: 18\nT2 / B3: 13\nT3 / B1: 19\nT3 / B2: 21\nT3 / B3: 18' } },
  ];
  return { resolver, ejemplos, POST, POST_DOS, MODOS, PRUEBA, grupos, casillas, parejas };
})();
if (typeof module !== 'undefined') module.exports = Anova;
