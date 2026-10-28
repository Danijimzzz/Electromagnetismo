/* =====================================================================
   χ² de bondad de ajuste e independencia (sin DOM). Bondad de ajuste de
   unas frecuencias observadas a una distribución uniforme, a unas
   proporciones dadas o a una binomial, Poisson o normal (con los
   parámetros dados o estimados de los datos, que restan grados de
   libertad), juntando si se pide las clases con frecuencia esperada menor
   que 5. Independencia u homogeneidad en una tabla de contingencia, con la
   corrección de Yates en las 2 × 2 y la V de Cramér. Las distribuciones y
   sus cuantiles salen de estadistica/calculo.js; formato y lectura en
   calculadora.js; interfaz en chi2-bondad/app.js.
   ===================================================================== */
const Chi2Bondad = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista, filas } = K, D = ES.DIST;
  const MODOS = { bondad: 'Bondad de ajuste', independencia: 'Independencia u homogeneidad (tabla de contingencia)' };
  const MODELOS = { uniforme: 'Uniforme (todas las clases igual de probables)', dadas: 'Proporciones dadas', binomial: 'Binomial B(n, p)', poisson: 'Poisson P(λ)', normal: 'Normal N(μ, σ) por intervalos' };
  const COLUMNAS = { uniforme: 1, dadas: 2, binomial: 2, poisson: 2, normal: 3 };
  const suma = (v) => v.reduce((a, b) => a + b, 0);

  // filas de la tabla: cuántas columnas tiene la primera fila de números
  function tabla(texto, nom) {
    const lin = String(texto ?? '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !/[a-zñáéíóú]/i.test(l.replace(/e[+-]?\d/gi, '')));
    if (!lin.length) throw new Error(`Falta ${nom}`);
    return filas(texto, (/[;\t]/.test(lin[0]) ? lin[0].split(/\s*[;\t]\s*/) : lin[0].split(/\s+/)).filter(Boolean).length, nom);
  }
  const frec = (o, nom) => { if (o.some((x) => x < 0 || !Number.isInteger(x))) throw new Error(`Las frecuencias observadas de ${nom} deben ser enteros de 0 en adelante`); };

  /* ---------- Bondad de ajuste: clases { nom, o, p } ---------- */
  function discretas(sc, modelo) {
    const t = tabla(sc.datos, 'la tabla de valores x y frecuencias');
    if (t[0].length !== 2) throw new Error('Escribe en cada fila el valor x y su frecuencia observada');
    const x = t.map((r) => r[0]), o = t.map((r) => r[1]);
    frec(o, 'la tabla');
    if (x.some((v, i) => !Number.isInteger(v) || v < 0 || (i && v !== x[i - 1] + 1))) throw new Error('Los valores x deben ser enteros seguidos de menor a mayor (0, 1, 2…)');
    const N = suma(o), m = suma(x.map((v, i) => v * o[i])) / N, est = sc.estima !== 'no';
    let P, Dd, par, estTxt;
    if (modelo === 'binomial') {
      const n = lee(sc, 'nb', 'el número de pruebas n', { min: 1, entero: true });
      if (x[x.length - 1] > n) throw new Error(`Hay valores x mayores que n = ${n}`);
      const p = est ? m / n : lee(sc, 'pb', 'la probabilidad de éxito p', { min: 0, minEx: true, max: 1, maxEx: true });
      Dd = D.binomial; P = { n, p }; par = est ? 1 : 0;
      estTxt = est ? `$x̄ = {∑ x_i O_i}/N = ${f(m * N)}/${N} = ${f(m)}$ y, como la media de una binomial es $n p$, $p̂ = x̄/n = ${f(m)}/${n} = ${f(p)}$` : '';
    } else {
      const l = est ? m : lee(sc, 'lambda', 'la media λ', { min: 0, minEx: true });
      Dd = D.poisson; P = { lambda: l }; par = est ? 1 : 0;
      estTxt = est ? `La media de una Poisson es λ: $λ̂ = x̄ = {∑ x_i O_i}/N = ${f(m * N)}/${N} = ${f(l)}$` : '';
    }
    if (!(est ? P.p ?? P.lambda : 1) && est) throw new Error('Con todas las frecuencias en x = 0 no se puede estimar el parámetro');
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
    const t = tabla(sc.datos, 'la tabla de intervalos y frecuencias');
    if (t[0].length !== 3) throw new Error('Escribe en cada fila el extremo inferior, el superior y la frecuencia observada del intervalo');
    const o = t.map((r) => r[2]);
    frec(o, 'la tabla');
    t.forEach((r, i) => { if (!(r[1] > r[0])) throw new Error(`En la fila ${i + 1}, el extremo superior debe ser mayor que el inferior`); if (i && Math.abs(r[0] - t[i - 1][1]) > 1e-9) throw new Error(`Los intervalos deben ir seguidos: la fila ${i + 1} empieza en ${f(r[0])} y la anterior acaba en ${f(t[i - 1][1])}`); });
    const N = suma(o), mc = t.map((r) => (r[0] + r[1]) / 2), est = sc.estima !== 'no';
    const mu = est ? suma(mc.map((v, i) => v * o[i])) / N : lee(sc, 'mu', 'la media μ');
    const sigma = est ? Math.sqrt(suma(mc.map((v, i) => o[i] * (v - mu) ** 2)) / N) : lee(sc, 'sigma', 'la desviación típica σ', { min: 0, minEx: true });
    if (!(sigma > 0)) throw new Error('Todos los datos están en un solo intervalo: no se puede estimar σ');
    const P = { mu, sigma }, ult = t.length - 1;
    const cl = t.map((r, i) => ({ lo: i === 0 ? -Infinity : r[0], hi: i === ult ? Infinity : r[1], o: o[i] }));
    for (const c of cl) c.p = (c.hi === Infinity ? 1 : D.normal.cdf(P, c.hi)) - (c.lo === -Infinity ? 0 : D.normal.cdf(P, c.lo));
    return { cl, N, par: est ? 2 : 0, Dd: D.normal, P, nomD: `N(${f(mu)}, ${f(sigma)})`,
      estTxt: est ? `Con las marcas de clase $m_i$: $μ̂ = x̄ = {∑ m_i O_i}/N = ${f(mu)}$ y $σ̂ = √({∑ O_i (m_i − x̄)^2}/N) = ${f(sigma)}$` : '',
      nomCl: (c) => c.lo === -Infinity && c.hi === Infinity ? 'todo' : c.lo === -Infinity ? `x < ${f(c.hi)}` : c.hi === Infinity ? `x ≥ ${f(c.lo)}` : `${f(c.lo)}–${f(c.hi)}`,
      formP: (c) => c.lo === -Infinity ? `P(X < ${f(c.hi)})` : c.hi === Infinity ? `P(X ≥ ${f(c.lo)})` : `P(${f(c.lo)} ≤ X < ${f(c.hi)})` };
  }
  function sencillas(sc, modelo) {
    let o, w;
    if (modelo === 'uniforme') { o = lista(sc.datos, 'las frecuencias observadas'); w = o.map(() => 1); }
    else { const t = tabla(sc.datos, 'la tabla de frecuencias y proporciones'); if (t[0].length !== 2) throw new Error('Escribe en cada fila la frecuencia observada y la proporción esperada de la clase'); o = t.map((r) => r[0]); w = t.map((r) => r[1]); }
    frec(o, 'las clases');
    if (w.some((v) => !(v > 0))) throw new Error('Las proporciones esperadas deben ser mayores que 0');
    const W = suma(w), N = suma(o);
    return { cl: o.map((v, i) => ({ lo: i + 1, hi: i + 1, o: v, p: w[i] / W })), N, par: 0, nomD: modelo === 'uniforme' ? 'uniforme' : 'las proporciones dadas', estTxt: '', W, w,
      nomCl: (c) => c.lo === c.hi ? `Clase ${c.lo}` : `Clases ${c.lo}–${c.hi}`, formP: (c) => modelo === 'uniforme' ? `1/${o.length}` : c.lo === c.hi ? `${f(w[c.lo - 1])}/${f(W)}` : `p_{${c.lo}–${c.hi}}` };
  }
  // junta la clase con menor frecuencia esperada (si es menor que 5) con su vecina más pequeña
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

  // la cola derecha de la χ²
  function decide(chi, gl, alfa) {
    const P = { k: gl }, crit = ES.cuantil(D.chi2, P, 1 - alfa), pv = D.chi2.sf(P, chi);
    return { crit, pv, rechaza: chi > crit };
  }
  const sumaTxt = (t) => (t.length > 4 ? [...t.slice(0, 2), '…', t[t.length - 1]] : t).join(' + ');

  function bondad(sc, alfa) {
    const modelo = MODELOS[sc.modelo] ? sc.modelo : 'uniforme';
    const r = modelo === 'normal' ? normal(sc) : modelo === 'binomial' || modelo === 'poisson' ? discretas(sc, modelo) : sencillas(sc, modelo);
    if (!(r.N > 0)) throw new Error('El total de observaciones debe ser mayor que 0');
    let cl = r.cl, junto = false;
    if (sc.agrupa === 'si') ({ cl, junto } = agrupa(cl, r.N));
    const celdas = cl.map((c) => { const e = r.N * c.p; return { nom: r.nomCl(c), o: c.o, e, c: (c.o - e) ** 2 / e, p: c.p, fp: r.formP(c), junta: c.junta }; });
    const chi = suma(celdas.map((c) => c.c)), gl = celdas.length - 1 - r.par;
    if (gl < 1) throw new Error(`Quedan ${celdas.length} clases y ${r.par ? `se estiman ${r.par} parámetros` : 'ningún parámetro estimado'}: no hay grados de libertad. Hacen falta más clases${junto ? ' (prueba sin juntar las de frecuencia esperada pequeña)' : ''}`);
    const pocos = celdas.filter((c) => c.e < 5).length, { crit, pv, rechaza } = decide(chi, gl, alfa);
    const h0 = modelo === 'uniforme' ? 'todas las clases son igual de probables' : modelo === 'dadas' ? 'las proporciones son las dadas' : `los datos siguen una ${{ binomial: 'binomial', poisson: 'Poisson', normal: 'normal' }[modelo]}${r.par ? '' : ` ${r.nomD}`}`;
    const pasos = [];
    pasos.push({ t: 'Hipótesis', html: `$H_0$: ${h0}, frente a $H_1$: no ${modelo === 'uniforme' || modelo === 'dadas' ? 'es así' : 'la siguen'}; con $α = ${f(alfa)}$ y $N = ${r.N}$ observaciones.` });
    if (r.estTxt) pasos.push({ t: 'Parámetros estimados', html: `${r.estTxt}. Se ajusta a una ${r.nomD}; cada parámetro estimado resta un grado de libertad.` });
    const ej = celdas.slice(0, 3).map((c) => `$E = N · ${c.fp} = ${r.N} · ${f(c.p)} = ${f(c.e)}$`).join('<br>');
    pasos.push({ t: 'Frecuencias esperadas', html: `$E_i = N p_i$, con $p_i$ la probabilidad de cada clase si $H_0$ es cierta${modelo === 'normal' ? ' (el primer intervalo se alarga hasta −∞ y el último hasta +∞, para que sumen 1)' : modelo === 'binomial' || modelo === 'poisson' ? ' (la primera y la última clase se quedan con las colas, para que sumen 1)' : ''}:<br>${ej}${celdas.length > 3 ? '<br>y así las demás (en la tabla).' : ''}${junto ? '<br>Se han <b>juntado</b> con su vecina las clases con frecuencia esperada menor que 5.' : ''}${pocos ? `<br><b>Ojo:</b> ${pocos === 1 ? 'una clase tiene' : `${pocos} clases tienen`} frecuencia esperada menor que 5 y la aproximación χ² puede no ser buena${sc.agrupa === 'si' ? '' : ': conviene juntar clases'}.` : ''}` });
    pasos.push({ t: 'Estadístico de contraste', html: `$χ^2 = ∑ {(O_i − E_i)^2}/{E_i} = ${sumaTxt(celdas.map((c) => `{(${c.o} − ${f(c.e)})^2}/{${f(c.e)}}`))}$<br>$χ^2 = ${sumaTxt(celdas.map((c) => f(c.c)))} = ${f(chi)}$` });
    pasos.push({ t: 'Grados de libertad', html: `$ν = k − 1 − m = ${celdas.length} − 1${r.par ? ` − ${r.par}` : ''} = ${gl}$, con $k = ${celdas.length}$ clases${r.par ? ` y $m = ${r.par}$ ${r.par === 1 ? 'parámetro estimado' : 'parámetros estimados'}` : ''}.` });
    return { modo: 'bondad', modelo, celdas, chi, gl, crit, pv, rechaza, pocos, junto, N: r.N, nomD: r.nomD, pasos, h0 };
  }

  function independencia(sc) {
    const t = tabla(sc.datos, 'la tabla de contingencia'), r = t.length, c = t[0].length;
    if (r < 2 || c < 2) throw new Error('La tabla de contingencia necesita al menos 2 filas y 2 columnas');
    t.forEach((fl) => frec(fl, 'la tabla'));
    const F = t.map(suma), C = t[0].map((_, j) => suma(t.map((fl) => fl[j]))), N = suma(F);
    if (F.some((v) => !v) || C.some((v) => !v)) throw new Error('Hay una fila o una columna entera a cero: quítala de la tabla');
    const yates = sc.yates === 'si' && r === 2 && c === 2, celdas = [];
    t.forEach((fl, i) => fl.forEach((o, j) => { const e = (F[i] * C[j]) / N, d = yates ? Math.max(0, Math.abs(o - e) - 0.5) : o - e; celdas.push({ nom: `Fila ${i + 1}, columna ${j + 1}`, i, j, o, e, c: (d * d) / e }); }));
    const chi = suma(celdas.map((x) => x.c)), gl = (r - 1) * (c - 1), pocos = celdas.filter((x) => x.e < 5).length, V = Math.sqrt(chi / (N * (Math.min(r, c) - 1)));
    const pasos = [];
    pasos.push({ t: 'Hipótesis', html: `$H_0$: las dos variables son <b>independientes</b> (o, si cada fila es una población, todas tienen las mismas proporciones), frente a $H_1$: hay relación entre ellas; con $α = ${f(alfa(sc))}$.` });
    pasos.push({ t: 'Frecuencias esperadas', html: `Si son independientes, $E_{ij} = {F_i · C_j}/N$, con $F_i$ y $C_j$ los totales de la fila $i$ y de la columna $j$ y $N = ${N}$:<br>${celdas.slice(0, 2).map((x) => `$E_{${x.i + 1}${x.j + 1}} = {${F[x.i]} · ${C[x.j]}}/${N} = ${f(x.e)}$`).join(', &ensp; ')}, y así las demás (en la tabla).${pocos ? `<br><b>Ojo:</b> ${pocos === 1 ? 'una casilla tiene' : `${pocos} casillas tienen`} frecuencia esperada menor que 5 y la aproximación χ² puede no ser buena.` : ''}` });
    pasos.push({ t: 'Estadístico de contraste', html: `${yates ? 'En una tabla 2 × 2 se aplica la corrección de Yates: ' : ''}$χ^2 = ∑ {(${yates ? '|O_{ij} − E_{ij}| − 0,5' : 'O_{ij} − E_{ij}'})^2}/{E_{ij}} = ${sumaTxt(celdas.map((x) => yates ? `{(|${x.o} − ${f(x.e)}| − 0,5)^2}/{${f(x.e)}}` : `{(${x.o} − ${f(x.e)})^2}/{${f(x.e)}}`))}$<br>$χ^2 = ${sumaTxt(celdas.map((x) => f(x.c)))} = ${f(chi)}$` });
    pasos.push({ t: 'Grados de libertad', html: `$ν = (r − 1)(c − 1) = (${r} − 1)(${c} − 1) = ${gl}$, con $r = ${r}$ filas y $c = ${c}$ columnas.` });
    const dc = decide(chi, gl, alfa(sc));
    return { modo: 'independencia', celdas, chi, gl, ...dc, pocos, N, t, F, C, V, yates, pasos, h0: 'las variables son independientes' };
  }
  const alfa = (sc) => lee(sc, 'alfa', 'el nivel de significación α', { min: 0, minEx: true, max: 0.5, maxEx: true });

  function resolver(sc) {
    const a = alfa(sc), modo = MODOS[sc.modo] ? sc.modo : 'bondad';
    const r = modo === 'independencia' ? independencia(sc) : bondad(sc, a);
    if (modo === 'bondad') Object.assign(r, decide(r.chi, r.gl, a));
    r.alfa = a;
    r.pasos.push({ t: 'Región crítica y p-valor', html: `El contraste es siempre por la derecha (cuanto más se alejan las observadas de las esperadas, mayor sale χ²). Con $ν = ${r.gl}$, el valor crítico es $χ^2_{${r.gl}; ${f(1 - a)}} = ${f(r.crit)}$: se rechaza $H_0$ si $χ^2 > ${f(r.crit)}$.<br>$χ^2 = ${f(r.chi)}$ ${r.rechaza ? '<b>cae en la región crítica</b>' : '<b>no cae en la región crítica</b>'}, y el p-valor es $p = P(χ^2_{${r.gl}} ≥ ${f(r.chi)}) = ${f(r.pv)}$, ${r.pv < a ? 'menor' : 'mayor'} que $α$.` });
    r.pasos.push({ t: 'Conclusión', html: r.rechaza ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * a)} %: ${modo === 'independencia' ? `hay relación entre las dos variables (V de Cramér = ${f(r.V, 3)}, ${r.V < 0.1 ? 'muy débil' : r.V < 0.3 ? 'débil' : r.V < 0.5 ? 'moderada' : 'fuerte'})` : 'los datos no se ajustan al modelo'}.` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * a)} %: ${modo === 'independencia' ? 'los datos no dan pruebas de relación entre las variables' : 'las diferencias entre lo observado y lo esperado se pueden deber al azar, y el modelo es aceptable'}.` });
    return r;
  }

  const ejemplos = [
    { clave: 'dado', nombre: 'Uniforme: ¿está trucado el dado? (120 tiradas)', sc: { modo: 'bondad', modelo: 'uniforme', alfa: '0,05', agrupa: 'no', datos: '12\n16\n20\n18\n22\n32' } },
    { clave: 'mendel', nombre: 'Proporciones dadas: guisantes de Mendel (9 : 3 : 3 : 1)', sc: { modo: 'bondad', modelo: 'dadas', alfa: '0,05', agrupa: 'no', datos: '315 9\n108 3\n101 3\n32 1' } },
    { clave: 'coces', nombre: 'Poisson: muertes por coz de caballo (Bortkiewicz)', sc: { modo: 'bondad', modelo: 'poisson', estima: 'si', alfa: '0,05', agrupa: 'si', datos: '0 109\n1 65\n2 22\n3 3\n4 1' } },
    { clave: 'familias', nombre: 'Binomial: número de chicos en familias de 4 hijos', sc: { modo: 'bondad', modelo: 'binomial', estima: 'si', nb: '4', alfa: '0,05', agrupa: 'si', datos: '0 7\n1 33\n2 51\n3 37\n4 12' } },
    { clave: 'alturas', nombre: 'Normal: alturas por intervalos (cm)', sc: { modo: 'bondad', modelo: 'normal', estima: 'si', alfa: '0,05', agrupa: 'si', datos: '150 160 8\n160 170 25\n170 180 40\n180 190 20\n190 200 7' } },
    { clave: 'preferencia', nombre: 'Independencia: sexo y deporte preferido (2 × 3)', sc: { modo: 'independencia', alfa: '0,05', yates: 'no', datos: '20 30 50\n30 30 40' } },
    { clave: 'curacion', nombre: 'Homogeneidad 2 × 2: curación con dos tratamientos', sc: { modo: 'independencia', alfa: '0,05', yates: 'no', datos: '45 105\n30 120' } },
  ];

  return { resolver, ejemplos, MODOS, MODELOS, COLUMNAS };
})();
if (typeof module !== 'undefined') module.exports = Chi2Bondad;
