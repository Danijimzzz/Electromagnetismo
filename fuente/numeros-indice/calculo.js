/* =====================================================================
   Números índice y tasas de variación (sin DOM): para una serie de valores
   (año y valor), los índices simples con la base que se elija (y así el
   cambio de base), la tasa de variación de cada periodo, la acumulada y la
   media acumulativa; y para una cesta de productos (precios y cantidades
   de dos periodos), los índices de precios de Laspeyres, Paasche y Fisher,
   los de cantidades y el de valor. Formato de economia/comun.js; interfaz
   en numeros-indice/app.js.
     resolver(sc)  { modo: 'serie', datos, base } → { filas, tm, ta, pasos }
                   { modo: 'cesta', cesta } → { productos, L, P, F, V, pasos }
   ===================================================================== */
const NumerosIndice = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee, vacio } = K;
  const MODOS = { serie: 'Serie: índices y tasas', cesta: 'Cesta: Laspeyres…', empalme: 'Empalmar dos series con bases distintas' };
  const n4 = (x) => f(x, 6), pc = (x) => `${f(100 * x, 4)} %`;
  // número sin punto de miles dentro de una fórmula
  const m = (x) => f(x, 8).replace(/\./g, '');

  function serie(sc) {
    const d = K.filas(sc.datos, 2, 'los datos');
    if (d.length < 2) throw new Error('Escribe al menos dos periodos, uno por línea: «año valor»');
    if (d.some(([, x]) => x <= 0)) throw new Error('Los valores tienen que ser positivos para calcular índices');
    if (new Set(d.map(([p]) => p)).size !== d.length) throw new Error('Hay dos filas con el mismo periodo');
    const per = d.map(([p]) => p), base = vacio(sc.base) ? per[0] : lee(sc, 'base', 'el periodo base');
    const kb = per.indexOf(base);
    if (kb < 0) throw new Error(`El periodo base (${f(base)}) tiene que ser uno de los de la tabla`);
    const xb = d[kb][1], filas = d.map(([p, x], k) => ({ p, x, i: (100 * x) / xb, tv: k ? x / d[k - 1][1] - 1 : null }));
    const n = d.length - 1, ta = d[n][1] / d[0][1] - 1, tm = (1 + ta) ** (1 / n) - 1, ult = filas[n], pasos = [];
    pasos.push({ t: 'Índice simple', html: `Cada valor se compara con el del periodo base, ${f(base)}, que vale 100: $I_t = 100 · x_t/x_{${f(base)}}$. Por ejemplo, $I_{${f(ult.p)}} = 100 · ${m(ult.x)}/${m(xb)} = ${n4(ult.i)}$: ${ult.i >= 100 ? `un ${f(ult.i - 100, 4)} % más` : `un ${f(100 - ult.i, 4)} % menos`} que en ${f(base)}.` });
    if (kb > 0) pasos.push({ t: 'Cambio de base', html: `Para pasar a base ${f(base)} basta dividir todos los índices (o valores) entre el del nuevo periodo base y multiplicar por 100: los anteriores a ${f(base)} quedan ${filas.slice(0, kb).every((r) => r.i < 100) ? 'por debajo' : 'a un lado y otro'} de 100. Las tasas de variación no cambian con la base.` });
    pasos.push({ t: 'Tasa de variación', html: `De un periodo al siguiente: $T = x_t/x_{t−1} − 1$, que también sale de los índices, $T = I_t/I_{t−1} − 1$. La última: $${m(ult.x)}/${m(d[n - 1][1])} − 1 = ${n4(ult.tv)}$, un <b>${pc(ult.tv)}</b>.` });
    pasos.push({ t: 'Tasa acumulada', html: `De ${f(per[0])} a ${f(per[n])}: $${m(d[n][1])}/${m(d[0][1])} − 1 = ${n4(ta)}$, un <b>${pc(ta)}</b>. No es la suma de las tasas de cada periodo (${pc(filas.slice(1).reduce((s, r) => s + r.tv, 0))}), porque cada una se calcula sobre una base distinta: es su producto, $(1 + T_1)(1 + T_2) … − 1$.` });
    pasos.push({ t: 'Tasa media acumulativa', html: `La tasa constante que lleva del primer valor al último en ${n} periodos: $(1 + T_m)^{${n}} = 1 + ${n4(ta)}$ ⇒ $T_m = (${n4(1 + ta)})^{1/${n}} − 1 = ${n4(tm)}$, un <b>${pc(tm)}</b> por periodo.` });
    return { modo: 'serie', base, filas, ta, tm, n, pasos };
  }

  function cesta(sc) {
    const d = K.filas(sc.cesta, 4, 'la cesta');
    if (!d.length) throw new Error('Escribe un producto por línea: «p₀ q₀ p₁ q₁»');
    if (d.some((r) => r.some((x) => x < 0)) || d.some(([p0, , p1]) => p0 <= 0 || p1 <= 0)) throw new Error('Los precios tienen que ser positivos y las cantidades, positivas o cero');
    const S = (fn) => d.reduce((s, r) => s + fn(...r), 0);
    const p0q0 = S((a, b) => a * b), p1q0 = S((a, b, c) => c * b), p1q1 = S((a, b, c, e) => c * e), p0q1 = S((a, b, c, e) => a * e);
    if (p0q0 <= 0 || p0q1 <= 0) throw new Error('Alguna cantidad tiene que ser mayor que 0 en cada periodo');
    const L = (100 * p1q0) / p0q0, P = (100 * p1q1) / p0q1, F = Math.sqrt(L * P), V = (100 * p1q1) / p0q0, Lq = (100 * p0q1) / p0q0, Pq = (100 * p1q1) / p1q0;
    const productos = d.map(([p0, q0, p1, q1], k) => ({ k: k + 1, p0, q0, p1, q1, ip: (100 * p1) / p0, w: (p0 * q0) / p0q0 }));
    const pasos = [];
    pasos.push({ t: 'Gasto de cada cesta', html: `$∑p_0 q_0 = ${m(p0q0)}$ (lo que costaba la cesta del periodo 0), $∑p_1 q_0 = ${m(p1q0)}$ (la misma cesta a los precios nuevos), $∑p_1 q_1 = ${m(p1q1)}$ y $∑p_0 q_1 = ${m(p0q1)}$.` });
    pasos.push({ t: 'Laspeyres', html: `Pondera con las cantidades del periodo base: $L_p = 100 · {∑p_1 q_0}/{∑p_0 q_0} = 100 · ${m(p1q0)}/${m(p0q0)} = ${n4(L)}$. Es lo que se usa en el IPC: cuánto más cuesta hoy comprar lo mismo que se compraba antes. Equivale a la media de los índices simples de precios ponderada por el gasto de cada producto en el periodo base.` });
    pasos.push({ t: 'Paasche', html: `Pondera con las cantidades del periodo actual: $P_p = 100 · {∑p_1 q_1}/{∑p_0 q_1} = 100 · ${m(p1q1)}/${m(p0q1)} = ${n4(P)}$. ${P < L ? 'Sale menor que Laspeyres: los consumidores han comprado menos de lo que más ha subido (efecto sustitución).' : P > L ? 'Sale mayor que Laspeyres.' : 'Coincide con Laspeyres.'}` });
    pasos.push({ t: 'Fisher', html: `La media geométrica de los dos: $F = √(L_p · P_p) = √(${n4(L)} · ${n4(P)}) = ${n4(F)}$.` });
    pasos.push({ t: 'Cantidades y valor', html: `Índice de cantidades de Laspeyres: $L_q = 100 · {∑p_0 q_1}/{∑p_0 q_0} = ${n4(Lq)}$. Índice de valor (gasto): $V = 100 · {∑p_1 q_1}/{∑p_0 q_0} = ${n4(V)}$, que es el de precios por el de cantidades cruzados: $L_p · P_q/100 = ${n4((L * Pq) / 100)}$.` });
    return { modo: 'cesta', productos, p0q0, p1q0, p1q1, p0q1, L, P, F, V, Lq, Pq, pasos };
  }

  // empalme de dos series de índices con bases distintas (la antigua A y la nueva B, que se solapan en algún periodo):
  // el coeficiente k = A_t / B_t en el periodo de empalme t lleva una a la base de la otra
  function empalme(sc) {
    const leeS = (txt, nom) => {
      const d = K.filas(txt, 2, nom);
      if (d.length < 2) throw new Error(`Escribe al menos dos periodos en ${nom}, uno por línea: «año índice»`);
      if (d.some(([, x]) => x <= 0)) throw new Error(`Los índices de ${nom} tienen que ser positivos`);
      if (new Set(d.map(([p]) => p)).size !== d.length) throw new Error(`Hay dos filas con el mismo periodo en ${nom}`);
      return d.slice().sort((u, w) => u[0] - w[0]);
    };
    const A = leeS(sc.datos, 'la serie antigua (A)'), B = leeS(sc.datos2, 'la serie nueva (B)');
    const comunes = A.map(([p]) => p).filter((p) => B.some(([q]) => q === p));
    if (!comunes.length) throw new Error('Las dos series tienen que tener algún periodo en común para poder empalmarlas');
    const t = vacio(sc.empalme) ? comunes[comunes.length - 1] : lee(sc, 'empalme', 'el periodo de empalme');
    if (!comunes.includes(t)) throw new Error(`El periodo de empalme (${f(t)}) tiene que estar en las dos series (en común: ${comunes.map((p) => f(p)).join(', ')})`);
    const at = A.find(([p]) => p === t)[1], bt = B.find(([p]) => p === t)[1], k = at / bt, enB = sc.expresar === 'b';
    // hasta el periodo de empalme (incluido) valen los de A y después los de B, en la base elegida
    const per = [...new Set([...A.map(([p]) => p), ...B.map(([p]) => p)])].sort((u, w) => u - w);
    const filas = per.map((p, j) => {
      const a = A.find(([q]) => q === p), b = B.find(([q]) => q === p), usaA = p <= t && a, x = usaA ? (enB ? a[1] / k : a[1]) : b ? (enB ? b[1] : b[1] * k) : null;
      return { p, x, origen: usaA ? 'A' : 'B' };
    }).filter((r) => r.x !== null);
    if (!filas.length || filas[0].p > t) throw new Error('No hay datos de la serie antigua hasta el periodo de empalme');
    const hueco = per.filter((p) => !filas.some((r) => r.p === p));
    filas.forEach((r, j) => { r.tv = j ? r.x / filas[j - 1].x - 1 : null; });
    const n = filas.length - 1, ta = filas[n].x / filas[0].x - 1, tm = n ? (1 + ta) ** (1 / n) - 1 : 0, pasos = [];
    pasos.push({ t: 'Qué es empalmar', html: `Cuando se cambia de base, la serie antigua (A) y la nueva (B) no se pueden juntar tal cual: cada una vale 100 en su propio año base. Se empalman con un periodo que está en las dos, ${f(t)}.` });
    pasos.push({ t: 'Coeficiente de empalme', html: `$k = {A_{${f(t)}}}/{B_{${f(t)}}} = ${m(at)}/${m(bt)} = ${n4(k)}$: cuántas veces mayor es el valor de A que el de B en el periodo común.` });
    pasos.push({ t: `Serie en la base de ${enB ? 'B' : 'A'}`, html: enB
      ? `Se divide la serie antigua entre $k$ para llevarla a la base nueva, $B_t = A_t/k$ hasta ${f(t)}; desde ${f(t)} valen los de B.`
      : `Se multiplica la serie nueva por $k$ para llevarla a la base antigua, $A_t = k · B_t$ desde ${f(t)}; hasta ${f(t)} valen los de A.` });
    pasos.push({ t: 'Serie empalmada', html: `${filas.map((r) => `${f(r.p)}: ${f(r.x, 6)}`).join('; ')}.${hueco.length ? ` Sin dato en ${hueco.map((p) => f(p)).join(', ')}: ninguna de las dos series lo trae.` : ''}` });
    pasos.push({ t: 'Tasas', html: `De ${f(filas[0].p)} a ${f(filas[n].p)}: tasa acumulada $${m(filas[n].x)}/${m(filas[0].x)} − 1 = ${n4(ta)}$, un <b>${pc(ta)}</b>; media acumulativa por periodo, <b>${pc(tm)}</b>. El empalme solo cambia la escala de una de las series: las tasas de variación dentro de cada una son las mismas.` });
    return { modo: 'empalme', t, k, enB, filas, ta, tm, n, hueco, pasos };
  }

  const resolver = (sc) => (sc.modo === 'cesta' ? cesta(sc) : sc.modo === 'empalme' ? empalme(sc) : serie(sc));

  const ejemplos = [
    { clave: 'ventas', nombre: 'Ventas de una empresa en seis años', sc: { modo: 'serie', datos: '2018 250\n2019 270\n2020 240\n2021 290\n2022 320\n2023 350', base: '2018' } },
    { clave: 'cambio-base', nombre: 'Un índice de precios: cambio a base 2021', sc: { modo: 'serie', datos: '2019 100\n2020 99,7\n2021 102,8\n2022 111,4\n2023 115,0\n2024 118,4', base: '2021' } },
    { clave: 'empalme-ipc', nombre: 'Empalmar dos índices de precios de bases distintas (datos de ejemplo)', sc: { modo: 'empalme', datos: '2018 104,5\n2019 105,3\n2020 104,9\n2021 108,2', datos2: '2021 100\n2022 108,3\n2023 112,9\n2024 116,0', empalme: '2021', expresar: 'b' } },
    { clave: 'empalme-base-antigua', nombre: 'La misma unión, pero en la base de la serie antigua', sc: { modo: 'empalme', datos: '2018 104,5\n2019 105,3\n2020 104,9\n2021 108,2', datos2: '2021 100\n2022 108,3\n2023 112,9\n2024 116,0', empalme: '2021', expresar: 'a' } },
    { clave: 'cesta', nombre: 'Cesta de la compra: Laspeyres, Paasche y Fisher', sc: { modo: 'cesta', cesta: 'p0 q0 p1 q1\n1 100 1,2 90\n0,8 200 0,9 210\n5 20 8 15' } },
    { clave: 'estudiante', nombre: 'Lo que gasta un estudiante en un mes', sc: { modo: 'cesta', cesta: 'p0 q0 p1 q1\n2,5 20 3 18\n1,5 40 1,6 44\n12 2 15 1\n40 1 45 1' } },
  ];

  // modo práctica: datos redondos al azar
  const AZ = K.az, azar = AZ.desde(ejemplos, (sc) => {
    if (sc.modo === 'cesta') {
      const filas = ['p0 q0 p1 q1'];
      for (let k = AZ.toma([3, 4]); k > 0; k--) { const p0 = AZ.toma([1, 2, 5, 12, 40]), q0 = AZ.toma([10, 20, 50, 100, 200]); filas.push(`${AZ.t(p0)} ${q0} ${AZ.t(Math.round(p0 * AZ.toma([1.05, 1.1, 1.2, 1.5]) * 100) / 100, 2)} ${Math.round(q0 * AZ.toma([0.8, 0.9, 1, 1.1]))}`); }
      return { cesta: filas.join('\n') };
    }
    const a0 = AZ.toma([2016, 2018, 2020]); let v = AZ.toma([100, 250, 500]);
    return { datos: Array.from({ length: 6 }, (_, k) => { if (k) v = Math.round(v * (1 + AZ.toma([-0.05, 0.03, 0.05, 0.08]))); return `${a0 + k} ${v}`; }).join('\n'), base: String(a0 + AZ.toma([0, 0, 2])) };
  }, (sc) => sc.modo !== 'empalme', (sc) => resolver(sc));
  const enunciado = (sc) => sc.modo === 'cesta'
    ? `Con los precios y las cantidades de ${sc.cesta.split('\n').length - 1} bienes en el periodo 0 y en el periodo 1 (tabla de datos), calcula los índices de precios de Laspeyres, Paasche y Fisher, el índice de valor y la subida de precios según Laspeyres.`
    : `Con la serie de valores por año de la tabla de datos, cámbiala a base ${sc.base} = 100 y calcula el índice del último periodo, la tasa de la última variación, la tasa acumulada y la tasa media por periodo.`;

  return { azar, enunciado, resolver, ejemplos, MODOS };
})();
if (typeof module !== 'undefined') module.exports = NumerosIndice;
