/* =====================================================================
   Contrastes no paramétricos (sin DOM): la U de Mann-Whitney para dos
   muestras independientes y el test de Wilcoxon de los rangos con signo
   para datos apareados o para la mediana de una muestra. Trabajan con los
   rangos (con la media de los rangos en los empates). El p-valor sale
   exacto, contando todas las ordenaciones, si no hay empates y las
   muestras son pequeñas; si no, con la aproximación normal, con la
   corrección de empates y, si se pide, la de continuidad. La normal sale
   de estadistica/calculo.js; formato y lectura en calculadora.js;
   interfaz en no-parametricos/app.js.
   ===================================================================== */
const NoParametricos = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, lista, filas } = K, N01 = { mu: 0, sigma: 1 };
  const suma = (v) => v.reduce((a, b) => a + b, 0);
  const TIPOS = { mw: 'U de Mann-Whitney (dos muestras independientes)', pares: 'Wilcoxon de datos apareados', mediana: 'Wilcoxon para la mediana de una muestra' };
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
    pasos.push({ t: 'Conclusión', html: p < alfa ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: hay diferencias entre las dos muestras.` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: no hay evidencia de diferencias entre las dos muestras.` });
    return { tipo: 'mw', h1, x, y, n1, n2, R1, R2, U1, U2, mu, z, sigma, p, exacto, empates: t.length > 0, orden, rechaza: p < alfa, alfa, pasos, est: U1 };
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
    pasos.push({ t: 'Conclusión', html: p < alfa ? `<b>Se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %.` : `<b>No se rechaza $H_0$</b> con un nivel de significación del ${f(100 * alfa)} %: no hay evidencia suficiente.` });
    return { tipo: pares ? 'pares' : 'mediana', h1, ds, nz, nTotal, n, Wp, Wm, mu, z, sigma, p, exacto, empates: t.length > 0, rechaza: p < alfa, alfa, pasos, est: Wp };
  }

  function resolver(sc) {
    const alfa = alfaDe(sc), tipo = TIPOS[sc.tipo] ? sc.tipo : 'mw';
    return tipo === 'mw' ? mannWhitney(sc, alfa) : wilcoxon(sc, alfa, tipo === 'pares');
  }

  const ejemplos = [
    { clave: 'metodos', nombre: 'Mann-Whitney: dos métodos de estudio (exacto)', sc: { tipo: 'mw', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', datos1: '14 17 16 19 22', datos2: '10 12 15 11 13 9' } },
    { clave: 'empates', nombre: 'Mann-Whitney con empates (aproximación normal)', sc: { tipo: 'mw', h1: 'mayor', alfa: '0,05', exacto: 'si', cc: 'si', datos1: '3 4 4 5 5 5 6 7', datos2: '2 3 3 4 4 5 5 6' } },
    { clave: 'dieta', nombre: 'Wilcoxon apareado: peso antes y después de una dieta', sc: { tipo: 'pares', h1: 'mayor', alfa: '0,05', exacto: 'si', cc: 'si', datos: '82 78\n91 85\n77 75\n88 89\n95 88\n79 79\n84 76\n90 79' } },
    { clave: 'mediana', nombre: 'Wilcoxon para la mediana: ¿vale 50?', sc: { tipo: 'mediana', h1: 'dos', alfa: '0,05', exacto: 'si', cc: 'si', m0: '50', datos: '54 61 48 58 66 53 63 57 49 60' } },
  ];
  return { resolver, ejemplos, TIPOS, H1, rangos };
})();
if (typeof module !== 'undefined') module.exports = NoParametricos;
