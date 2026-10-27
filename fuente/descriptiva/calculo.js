/* =====================================================================
   Estadística descriptiva (sin DOM): una variable dada como lista de datos,
   como tabla de valores con su frecuencia o agrupada en intervalos. Saca la
   tabla de frecuencias (absolutas, relativas y acumuladas), media, mediana,
   moda, cuartiles y percentiles, rango y rango intercuartílico, varianza y
   desviación típica (entre N o N − 1), coeficiente de variación, asimetría
   y curtosis, los datos atípicos y las cuentas del diagrama de caja.
   Mediana y cuartiles sin agrupar: se busca k·N/4 en las frecuencias
   acumuladas; si coincide justo con una Nᵢ, la media de ese valor y el
   siguiente. Agrupados: interpolación lineal en el intervalo (y la moda con
   la fórmula de Czuber). Formato y lectura en calculadora.js; interfaz en
   descriptiva/app.js.
   ===================================================================== */
const Descriptiva = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, vacio } = K;
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const FORMATOS = { lista: 'Lista de datos', tabla: 'Valores y frecuencias (x n)', intervalos: 'Datos agrupados en intervalos (Lᵢ Lₛ n)' };

  // filas { x, n } (o { li, ls, x = marca, n }) ordenadas, con las acumuladas
  function lee_(sc) {
    const fmt = FORMATOS[sc.formato] ? sc.formato : 'lista';
    let fil;
    if (fmt === 'lista') {
      const v = K.lista(sc.datos, 'los datos');
      const m = new Map(); for (const x of v) m.set(x, (m.get(x) || 0) + 1);
      fil = [...m].map(([x, n]) => ({ x, n }));
    } else if (fmt === 'tabla') {
      fil = K.filas(sc.datos, 2, 'la tabla').map(([x, n]) => ({ x, n }));
      if (new Set(fil.map((r) => r.x)).size !== fil.length) throw new Error('Hay valores repetidos en la tabla: junta sus frecuencias en una fila');
    } else {
      fil = K.filas(sc.datos, 3, 'la tabla').map(([li, ls, n]) => ({ li, ls, x: (li + ls) / 2, n, a: ls - li }));
      if (fil.some((r) => !(r.ls > r.li))) throw new Error('En cada intervalo, el extremo superior tiene que ser mayor que el inferior');
      fil.sort((a, b) => a.li - b.li);
      for (let i = 1; i < fil.length; i++) if (fil[i].li < fil[i - 1].ls - 1e-12) throw new Error('Los intervalos se solapan: cada uno tiene que empezar donde acaba el anterior (o después)');
    }
    if (fil.some((r) => !(r.n >= 0) || !Number.isFinite(r.n))) throw new Error('Las frecuencias tienen que ser números positivos');
    fil = fil.filter((r) => r.n > 0);
    if (fmt !== 'intervalos') fil.sort((a, b) => a.x - b.x);
    const N = fil.reduce((s, r) => s + r.n, 0);
    if (N < 2) throw new Error('Hacen falta al menos 2 datos');
    let ac = 0; for (const r of fil) { ac += r.n; r.N = ac; r.fr = r.n / N; r.F = ac / N; }
    return { fmt, fil, N };
  }

  // cuantil de orden q (0 < q < 1)
  function cuantil(fil, N, q, agrupados) {
    const pos = q * N;
    if (agrupados) {
      const i = fil.findIndex((r) => r.N >= pos - 1e-9), r = fil[i], Nant = i ? fil[i - 1].N : 0;
      return { v: r.li + ((pos - Nant) / r.n) * r.a, pos, i, Nant };
    }
    const i = fil.findIndex((r) => r.N >= pos - 1e-9), r = fil[i];
    if (Math.abs(r.N - pos) < 1e-9 && i < fil.length - 1 && Number.isInteger(pos)) return { v: (r.x + fil[i + 1].x) / 2, pos, i, justo: true };
    return { v: r.x, pos, i };
  }

  function resolver(sc) {
    const { fmt, fil, N } = lee_(sc), ag = fmt === 'intervalos';
    const div = sc.div === 'n1' ? 'n1' : 'n', D = div === 'n1' ? N - 1 : N;
    const sx = fil.reduce((s, r) => s + r.x * r.n, 0), sx2 = fil.reduce((s, r) => s + r.x * r.x * r.n, 0);
    const media = sx / N;
    const m2 = fil.reduce((s, r) => s + r.n * (r.x - media) ** 2, 0) / N, m3 = fil.reduce((s, r) => s + r.n * (r.x - media) ** 3, 0) / N, m4 = fil.reduce((s, r) => s + r.n * (r.x - media) ** 4, 0) / N;
    const varz = (m2 * N) / D, sd = Math.sqrt(varz), cv = media !== 0 ? sd / Math.abs(media) : NaN;
    const g1 = m2 > 0 ? m3 / m2 ** 1.5 : 0, g2 = m2 > 0 ? m4 / (m2 * m2) - 3 : 0;
    const Q1 = cuantil(fil, N, 0.25, ag), Me = cuantil(fil, N, 0.5, ag), Q3 = cuantil(fil, N, 0.75, ag);
    const pk = vacio(sc.pk) ? null : lee(sc, 'pk', 'el percentil', { min: 0, minEx: true, max: 100, maxEx: true });
    const P = pk === null ? null : cuantil(fil, N, pk / 100, ag);
    // moda: el valor (o los valores) de más frecuencia; agrupados, por Czuber en el intervalo modal (con amplitudes iguales)
    const nmax = Math.max(...fil.map((r) => r.n));
    let moda, modaTxt;
    if (ag) {
      const i = fil.findIndex((r) => r.n === nmax), r = fil[i], d1 = r.n - (i ? fil[i - 1].n : 0), d2 = r.n - (i < fil.length - 1 ? fil[i + 1].n : 0);
      moda = [d1 + d2 > 0 ? r.li + (d1 / (d1 + d2)) * r.a : r.x];
      modaTxt = `Intervalo modal [${f(r.li)}, ${f(r.ls)}), el de mayor frecuencia (n = ${f(r.n)}). Con la fórmula de Czuber: $Mo = L_i + {Δ_1}/{Δ_1 + Δ_2} · a = ${f(r.li)} + ${f(d1)}/(${f(d1)} + ${f(d2)}) · ${f(r.a)} = ${f(moda[0])}$, donde $Δ_1$ y $Δ_2$ son lo que supera su frecuencia a la del intervalo anterior y a la del siguiente.`;
    } else {
      moda = fil.filter((r) => r.n === nmax).map((r) => r.x);
      modaTxt = moda.length === fil.length ? 'Todos los valores se repiten las mismas veces: no hay moda.' : `El valor${moda.length > 1 ? 'es' : ''} con más frecuencia (n = ${f(nmax)}): <b>${moda.map((v) => f(v)).join(', ')}</b>${moda.length > 1 ? ` (distribución ${moda.length === 2 ? 'bimodal' : 'multimodal'})` : ''}.`;
      if (moda.length === fil.length) moda = [];
    }
    const min = ag ? fil[0].li : fil[0].x, max = ag ? fil[fil.length - 1].ls : fil[fil.length - 1].x;
    const ric = Q3.v - Q1.v, bi = Q1.v - 1.5 * ric, bs = Q3.v + 1.5 * ric;
    const atipicos = ag ? [] : fil.filter((r) => r.x < bi - 1e-12 || r.x > bs + 1e-12).map((r) => r.x);
    const dentro = fil.filter((r) => !atipicos.includes(r.x)), bigoteI = ag ? min : Math.min(...dentro.map((r) => r.x)), bigoteS = ag ? max : Math.max(...dentro.map((r) => r.x));

    const X = ag ? 'x_i' : 'x_i', vs = div === 'n1' ? 'N − 1' : 'N', sim = div === 'n1' ? 's' : 'σ';
    const pasos = [];
    pasos.push({ t: 'Tabla de frecuencias', html: `${ag ? 'Con datos agrupados se usa la marca de clase $x_i = (L_i + L_s)/2$ de cada intervalo. ' : ''}En la tabla: $n_i$ frecuencia absoluta, $f_i = n_i/N$ relativa, y $N_i$ y $F_i$ las acumuladas. Hay <b>N = ${f(N, 6)}</b> datos.` });
    pasos.push({ t: 'Media', html: `$x̄ = {∑ ${X} n_i}/N = ${f(sx, 6)}/${f(N, 6)} = ${f(media)}$` });
    const cuTxt = (nom, q, c) => {
      if (ag) { const r = fil[c.i]; return `${nom}: $${f(q)} · N = ${f(c.pos)}$ cae en [${f(r.li)}, ${f(r.ls)}) ($N_{i−1} = ${f(c.Nant)}$, $n_i = ${f(r.n)}$): $${f(r.li)} + {${f(c.pos)} − ${f(c.Nant)}}/{${f(r.n)}} · ${f(r.a)} = ${f(c.v)}$`; }
      return `${nom}: $${f(q)} · N = ${f(c.pos)}$ ${c.justo ? `coincide con $N_i = ${f(c.pos)}$, así que es la media de ${f(fil[c.i].x)} y ${f(fil[c.i + 1].x)}` : `→ el primer valor con $N_i ≥ ${f(c.pos)}$ es ${f(fil[c.i].x)}`}: <b>${f(c.v)}</b>`;
    };
    pasos.push({ t: 'Mediana y cuartiles', html: `${ag ? 'Se interpola en el intervalo donde cae $k·N/4$: $L_i + {k·N/4 − N_{i−1}}/{n_i} · a_i$.<br>' : 'Se busca la posición $k·N/4$ en las frecuencias acumuladas $N_i$.<br>'}` + [cuTxt('Q<sub>1</sub>', 0.25, Q1), cuTxt('Mediana (Q<sub>2</sub>)', 0.5, Me), cuTxt('Q<sub>3</sub>', 0.75, Q3), ...(P ? [cuTxt(`P<sub>${f(pk)}</sub>`, pk / 100, P)] : [])].join('<br>') });
    pasos.push({ t: 'Moda', html: modaTxt });
    pasos.push({ t: 'Dispersión', html: `Rango: $${f(max)} − ${p(min)} = ${f(max - min)}$; rango intercuartílico: $RIC = Q_3 − Q_1 = ${f(Q3.v)} − ${p(Q1.v)} = ${f(ric)}$<br>Varianza${div === 'n1' ? ' muestral (cuasivarianza)' : ''}: $${sim}^2 = {∑ (x_i − x̄)^2 n_i}/{${vs}} = ${f(m2 * N)}/${f(D, 6)} = ${f(varz)}$${div === 'n' ? ` (o también $${sim}^2 = {∑ x_i^2 n_i}/N − x̄^2 = ${f(sx2 / N)} − ${f(media)}^2$)` : ''}<br>Desviación típica: $${sim} = √(${f(varz)}) = ${f(sd)}$${isFinite(cv) ? `<br>Coeficiente de variación: $CV = {${sim}}/{|x̄|} = ${f(sd)}/${f(Math.abs(media))} = ${f(cv)}$ (${f(100 * cv, 3)} %)${cv < 0.3 ? ', la media es bastante representativa' : ', mucha dispersión: la media representa mal los datos'}` : ''}` });
    pasos.push({ t: 'Forma', html: `Asimetría de Fisher: $g_1 = m_3/σ^3 = ${f(g1)}$ ${Math.abs(g1) < 0.1 ? '(prácticamente simétrica)' : g1 > 0 ? '(asimétrica a la derecha: cola larga hacia los valores altos, media por encima de la mediana)' : '(asimétrica a la izquierda: cola larga hacia los valores bajos)'}.<br>Curtosis: $g_2 = m_4/σ^4 − 3 = ${f(g2)}$ ${Math.abs(g2) < 0.1 ? '(mesocúrtica, como la normal)' : g2 > 0 ? '(leptocúrtica: más apuntada que la normal)' : '(platicúrtica: más aplanada que la normal)'}.<br>Aquí $m_k = {∑ (x_i − x̄)^k n_i}/N$ son los momentos centrales (siempre entre N).` });
    if (!ag) pasos.push({ t: 'Datos atípicos y diagrama de caja', html: `Vallas: $Q_1 − 1,5 · RIC = ${f(bi)}$ y $Q_3 + 1,5 · RIC = ${f(bs)}$. ${atipicos.length ? `Quedan fuera, y son atípicos: <b>${atipicos.map((v) => f(v)).join(', ')}</b>.` : 'Ningún dato queda fuera: no hay atípicos.'}<br>La caja va de Q<sub>1</sub> a Q<sub>3</sub> con la mediana dentro, y los bigotes hasta el dato más pequeño y el más grande que no son atípicos (${f(bigoteI)} y ${f(bigoteS)}).` });
    return { fmt, fil, N, div, media, varz, sd, cv, g1, g2, Q1: Q1.v, Me: Me.v, Q3: Q3.v, pk, P: P && P.v, moda, min, max, ric, atipicos, bigoteI, bigoteS, pasos };
  }

  const ejemplos = [
    { clave: 'notas', nombre: 'Notas de un examen (lista)', sc: { formato: 'lista', datos: '4 5 7 6 8 5 9 6 5 7\n3 6 7 8 5 6 10 6 7 4', div: 'n', pk: '90' } },
    { clave: 'hijos', nombre: 'Número de hijos por familia (tabla)', sc: { formato: 'tabla', datos: 'Hijos Familias\n0 6\n1 10\n2 14\n3 7\n4 3', div: 'n', pk: '' } },
    { clave: 'alturas', nombre: 'Estaturas agrupadas en intervalos', sc: { formato: 'intervalos', datos: 'Li Ls n\n150 155 3\n155 160 7\n160 165 12\n165 170 15\n170 175 9\n175 180 4', div: 'n', pk: '10' } },
    { clave: 'salarios', nombre: 'Salarios con un dato atípico (muestra)', sc: { formato: 'lista', datos: '1350 1420 1380 1500 1460 1390 1410 1550 1440 4800', div: 'n1', pk: '' } },
    { clave: 'tiempos', nombre: 'Tiempos de espera en minutos (agrupados)', sc: { formato: 'intervalos', datos: '0 5 18\n5 10 25\n10 15 14\n15 20 8\n20 30 5', div: 'n', pk: '' } },
  ];

  return { resolver, ejemplos, FORMATOS, cuantil };
})();
if (typeof module !== 'undefined') module.exports = Descriptiva;
