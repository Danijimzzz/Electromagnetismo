/* =====================================================================
   Propagación de errores (sin DOM): la incertidumbre de una magnitud
   calculada f(x, y, …) a partir de las de sus variables, con las
   derivadas parciales (suma cuadrática si los errores son independientes,
   o cota lineal con los valores absolutos), la contribución de cada
   variable y el resultado redondeado como en el laboratorio: la
   incertidumbre con una cifra significativa (dos si la primera es un 1) y
   el valor hasta esa misma cifra. También el error de una serie de
   medidas repetidas (media, desviación, error de la media y del aparato),
   las variables correlacionadas (el término cruzado con el coeficiente de
   correlación o la covarianza), la media ponderada de varias medidas de lo
   mismo con pesos 1/σ² y su χ² reducido, y la comparación con un valor
   aceptado (discrepancia en σ).
   Lee las expresiones con Expresion (matematicas/expresion.js), que deriva
   simbólicamente; formato y lectura en calculadora.js; interfaz en
   errores/app.js.
   ===================================================================== */
const Errores = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, leeNum, vacio } = K;
  const MODOS = { formula: 'Una magnitud calculada f(x, y, …)', medidas: 'Una serie de medidas repetidas', ponderada: 'Varias medidas de lo mismo (media ponderada)' };
  const METODOS = { cuadratica: 'Suma cuadrática (errores independientes)', lineal: 'Cota lineal (suma de valores absolutos)' };

  /* ---------- Redondeo del laboratorio ---------- */
  // incertidumbre con 1 cifra significativa (2 si empieza por 1) y el valor hasta esa cifra
  function redondea(v, d) {
    if (!(d > 0) || !isFinite(d)) return { v, d, dec: null, txt: f(v, 6) };
    let e = Math.floor(Math.log10(d)), c = d / 10 ** e;
    // 0,0996 se redondea a 0,10: hay que mirar la primera cifra después de redondear
    let cifras = c < 1.95 ? 2 : 1, r = Math.round(d / 10 ** (e - cifras + 1)) * 10 ** (e - cifras + 1);
    if (r >= 10 ** (e + 1) - 1e-12 * 10 ** e) { e += 1; cifras = 2; r = 10 ** e; }
    const pos = e - cifras + 1, vr = Math.round(v / 10 ** pos) * 10 ** pos, dec = Math.max(0, -pos);
    const t = (x) => (dec ? x.toFixed(dec) : String(Math.round(x))).replace('.', ',').replace('-', '−');
    return { v: vr, d: r, dec, pos, txt: `${t(vr)} ± ${t(r)}` };
  }

  /* ---------- Variables ---------- */
  // una fila por variable: «l 1,250 0,002» (también «l = 1,250 ± 0,002»)
  function variables(texto) {
    const out = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim().replace(/±|\+\/-|\+-/g, ' ').replace(/=/g, ' ').replace(/;/g, ' ');
      if (!l || l.startsWith('#')) return;
      const tk = l.split(/\s+/);
      if (tk.length !== 3) throw new Error(`Variables, fila ${i + 1}: escribe el nombre, el valor y su incertidumbre («l 1,250 0,002»)`);
      const [n, a, b] = tk, v = leeNum(a), d = leeNum(b);
      if (!/^[a-zA-Zα-ωΑ-Ω]$/.test(n)) throw new Error(`Variables, fila ${i + 1}: el nombre «${n}» tiene que ser una sola letra`);
      if (!isFinite(v) || !isFinite(d)) throw new Error(`Variables, fila ${i + 1}: «${a}» o «${b}» no es un número`);
      if (d < 0) throw new Error(`Variables, fila ${i + 1}: la incertidumbre no puede ser negativa`);
      if (out.some((q) => q.k === n.toLowerCase())) throw new Error(`La variable ${n} está repetida`);
      if (n.toLowerCase() === 'e') throw new Error('No llames e a una variable: e es el número e = 2,718…');
      out.push({ n, k: n.toLowerCase(), v, d });
    });
    if (!out.length) throw new Error('Escribe al menos una variable con su valor y su incertidumbre');
    return out;
  }
  // el árbol con los nombres como los escribió el alumno (el lector los pasa a minúscula)
  const nombres = (n, vs) => {
    if (n.t === 'x') { const k = n.n || 'x', q = vs.find((x) => x.k === k); return q && q.n !== k ? { t: 'x', n: q.n } : n; }
    return { ...n, ...(n.a ? { a: nombres(n.a, vs) } : {}), ...(n.b ? { b: nombres(n.b, vs) } : {}) };
  };

  // correlaciones entre pares (EST.ER-1): una fila por par, «l T 0,8» (coeficiente r) o «cov l T 0,00002» (covarianza)
  function correlaciones(texto, vs) {
    const out = [];
    String(texto ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim().replace(/[=;()]/g, ' ').replace(/,\s*(?=[a-zA-Zα-ωΑ-Ω])/g, ' ').replace(/[−–]/g, '-').trim();
      if (!l || l.startsWith('#')) return;
      let tk = l.split(/\s+/), cov = false;
      if (tk.length === 4 && /^cov$/i.test(tk[0])) { cov = true; tk = tk.slice(1); } else if (tk.length === 4 && /^(r|ρ|corr)$/i.test(tk[0])) tk = tk.slice(1);
      if (tk.length !== 3) throw new Error(`Correlaciones, fila ${i + 1}: escribe las dos variables y su coeficiente de correlación («l T 0,8») o su covarianza («cov l T 0,00002»)`);
      const a = vs.find((q) => q.k === tk[0].toLowerCase()), b = vs.find((q) => q.k === tk[1].toLowerCase()), x = leeNum(tk[2]);
      if (!a || !b) throw new Error(`Correlaciones, fila ${i + 1}: la variable ${!a ? tk[0] : tk[1]} no está en la lista de variables`);
      if (a === b) throw new Error(`Correlaciones, fila ${i + 1}: hacen falta dos variables distintas`);
      if (!isFinite(x)) throw new Error(`Correlaciones, fila ${i + 1}: «${tk[2]}» no es un número`);
      if (out.some((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a))) throw new Error(`La correlación entre ${a.n} y ${b.n} está repetida`);
      let r = x, c = x;
      if (cov) { if (!(a.d > 0 && b.d > 0)) throw new Error(`Correlaciones, fila ${i + 1}: con una incertidumbre nula no puede haber covarianza`); r = x / (a.d * b.d); } else c = x * a.d * b.d;
      if (Math.abs(r) > 1 + 1e-9) throw new Error(cov ? `Correlaciones, fila ${i + 1}: esa covarianza da un coeficiente de correlación de ${f(r, 4)}, y tiene que estar entre −1 y 1 (|cov| ≤ Δ${a.n}·Δ${b.n} = ${f(a.d * b.d, 3)})` : `Correlaciones, fila ${i + 1}: el coeficiente de correlación tiene que estar entre −1 y 1`);
      out.push({ a, b, r: Math.max(-1, Math.min(1, r)), cov: c, dada: cov ? 'cov' : 'r' });
    });
    return out;
  }
  // comparación con un valor aceptado (EST.ER-2): discrepancia y cuántas σ son
  function compara(sc, nom, v, d, un, pasos) {
    if (vacio(sc.acept)) return null;
    const v0 = leeNum(sc.acept), d0 = vacio(sc.dacept) ? 0 : leeNum(sc.dacept);
    if (!isFinite(v0)) throw new Error('El valor aceptado tiene que ser un número');
    if (!isFinite(d0) || d0 < 0) throw new Error('La incertidumbre del valor aceptado tiene que ser un número positivo o cero');
    const dif = v - v0, sig = Math.hypot(d, d0), z = sig > 0 ? Math.abs(dif) / sig : (dif === 0 ? 0 : Infinity);
    const nivel = z <= 1 ? 'compatible' : z <= 2 ? 'compatible a 2σ' : z <= 3 ? 'dudoso' : 'incompatible';
    const frase = z <= 1 ? 'la diferencia es menor que una σ: el resultado es <b>compatible</b> con el valor aceptado' : z <= 2 ? 'la diferencia está entre 1 y 2 σ: el resultado es <b>compatible a 2σ</b>, lo normal en una de cada tres medidas correctas' : z <= 3 ? 'la diferencia está entre 2 y 3 σ: el resultado es <b>dudoso</b>; por puro azar solo pasa en un 5 % de las medidas, así que conviene buscar un error sistemático' : 'la diferencia pasa de 3 σ: el resultado es <b>incompatible</b> con el valor aceptado; hay un error sistemático o la incertidumbre está subestimada';
    pasos.push({ t: 'Comparación con el valor aceptado', html: `Discrepancia: $${nom} − ${nom}_{"ac"} = ${f(v, 6)} − ${f(v0, 6)} = ${f(dif, 3)}$${un} (${f(100 * Math.abs(dif) / Math.abs(v0), 3)} % del valor aceptado). Se mide en incertidumbres: $z = {|${nom} − ${nom}_{"ac"}|}/{${d0 > 0 ? `√(Δ${nom}^2 + Δ${nom}_{"ac"}^2)` : `Δ${nom}`}} = {${f(Math.abs(dif), 3)}}/{${f(sig, 3)}} = ${f(z, 3)}$. Como ${frase}.` });
    return { v0, d0, dif, sig, z, nivel, relPct: 100 * Math.abs(dif) / Math.abs(v0) };
  }

  function formula(sc) {
    const vs = variables(sc.vars), met = METODOS[sc.metodo] ? sc.metodo : 'cuadratica';
    const nom = vacio(sc.nombre) ? 'f' : String(sc.nombre).trim();
    const ast = nombres(E.simp(E.lee(sc.f, 'La fórmula', vs.map((q) => q.k))), vs);
    const env = Object.fromEntries(vs.map((q) => [q.n, q.v])), val = (n) => E.valor(n, env.x ?? NaN, env);
    const v = val(ast);
    if (!isFinite(v)) throw new Error('La fórmula no se puede evaluar con esos valores');
    const usadas = vs.filter((q) => E.tieneX(ast, q.n));
    if (!usadas.length) throw new Error('La fórmula no usa ninguna de las variables');
    for (const q of usadas) { q.der = E.simp(E.deriva(ast, q.n)); q.dv = val(q.der); q.c = Math.abs(q.dv) * q.d; if (!isFinite(q.dv)) throw new Error(`La derivada respecto de ${q.n} no se puede evaluar ahí`); }
    // término cruzado de las variables correlacionadas: 2·(∂f/∂a)(∂f/∂b)·cov(a, b), con el signo de las derivadas
    const cors = met === 'lineal' ? [] : correlaciones(sc.corr, vs).filter((c) => usadas.includes(c.a) && usadas.includes(c.b));
    for (const c of cors) c.t = 2 * c.a.dv * c.b.dv * c.cov;
    const cruz = cors.reduce((s, c) => s + c.t, 0), indep2 = usadas.reduce((s, q) => s + q.c * q.c, 0), var2 = indep2 + cruz;
    if (var2 < -1e-12 * indep2) throw new Error('Esas correlaciones no pueden darse a la vez: la incertidumbre al cuadrado sale negativa');
    const d = met === 'lineal' ? usadas.reduce((s, q) => s + q.c, 0) : (var2 < 1e-12 * indep2 ? 0 : Math.sqrt(var2)), dIndep = Math.sqrt(indep2);
    const tot = usadas.reduce((s, q) => s + (met === 'lineal' ? q.c : q.c * q.c), 0);
    for (const q of usadas) q.peso = tot ? (met === 'lineal' ? q.c : q.c * q.c) / tot : 0;
    const R = redondea(v, d), un = vacio(sc.unidad) ? '' : ` ${String(sc.unidad).trim()}`;
    const pasos = [];
    const sv = `${nom}(${usadas.map((q) => q.n).join(', ')})`, D = (n) => `{∂${nom}}/{∂${n}}`;
    pasos.push({ t: 'Valor de la magnitud', html: `$${nom} = ${E.texto(ast)} = ${f(v, 6)}$${un}<br>con ${usadas.map((q) => `$${q.n} = ${f(q.v, 6)} ± ${f(q.d, 3)}$`).join(', ')}.` });
    pasos.push({ t: 'Derivadas parciales', html: usadas.map((q) => `$${D(q.n)} = ${E.texto(q.der)} = ${f(q.dv, 5)}$, &ensp; $|${D(q.n)}| · Δ${q.n} = ${f(Math.abs(q.dv), 5)} · ${f(q.d, 3)} = ${f(q.c, 4)}$`).join('<br>') });
    pasos.push({ t: 'Incertidumbre', html: met === 'lineal'
      ? `Cota lineal (el peor caso): $Δ${nom} = ${usadas.map((q) => `|${D(q.n)}| Δ${q.n}`).join(' + ')}$<br>$Δ${nom} = ${usadas.map((q) => f(q.c, 4)).join(' + ')} = ${f(d, 4)}$`
      : `Con errores independientes se suman en cuadratura: $Δ${nom} = √(${usadas.map((q) => `(${D(q.n)} Δ${q.n})^2`).join(' + ')})$<br>$Δ${nom} = √(${usadas.map((q) => `${f(q.c, 4)}^2`).join(' + ')}) = ${f(d, 4)}$` });
    if (cors.length) pasos.push({ t: 'Variables correlacionadas', html: `Si dos variables no son independientes hay que añadir el término cruzado $2 · {∂${nom}}/{∂a} · {∂${nom}}/{∂b} · "cov"(a, b)$, con $"cov"(a, b) = r · Δa · Δb$:<br>${cors.map((c) => `$${c.a.n}$ y $${c.b.n}$: $r = ${f(c.r, 4)}$, $"cov" = ${f(c.cov, 4)}$ ⇒ $2 · ${f(c.a.dv, 5)} · ${c.b.dv < 0 ? `(${f(c.b.dv, 5)})` : f(c.b.dv, 5)} · ${c.cov < 0 ? `(${f(c.cov, 4)})` : f(c.cov, 4)} = ${f(c.t, 4)}$`).join('<br>')}<br>$Δ${nom} = √(${f(indep2, 4)} ${cruz < 0 ? '−' : '+'} ${f(Math.abs(cruz), 4)}) = ${f(d, 4)}$, frente a $${f(dIndep, 4)}$ si fueran independientes: la correlación ${Math.abs(d - dIndep) < 1e-12 * dIndep ? 'no cambia' : d > dIndep ? 'aumenta' : 'reduce'} el error.` });
    if (met === 'lineal' && !vacio(sc.corr)) pasos.push({ t: 'Correlaciones', html: 'La cota lineal ya es el peor caso posible (como si todo estuviera correlacionado en contra): las correlaciones solo se usan con la suma cuadrática.' });
    pasos.push({ t: 'Error relativo', html: `$ε = {Δ${nom}}/{|${nom}|} = ${f(d, 4)}/${f(Math.abs(v), 6)} = ${f(d / Math.abs(v), 3)}$ (${f((100 * d) / Math.abs(v), 3)} %). Pesa más ${usadas.slice().sort((a, b) => b.peso - a.peso)[0].n} (${f(100 * usadas.slice().sort((a, b) => b.peso - a.peso)[0].peso, 3)} % de ${met === 'lineal' ? 'la cota' : '$Δ' + nom + '^2$'}): es la medida que conviene mejorar.` });
    pasos.push({ t: 'Resultado redondeado', html: redTxt(nom, v, d, R, un) });
    const comp = compara(sc, nom, v, d, un, pasos);
    return { modo: 'formula', met, nom, ast, sv, vs: usadas, v, d, dIndep, cors, cruz, comp, rel: d / Math.abs(v), R, un, pasos };
  }
  const redTxt = (nom, v, d, R, un) => R.dec === null ? `$${nom} = ${f(v, 6)}$${un} (sin incertidumbre)` : `La incertidumbre se deja con ${/^1/.test(String(R.d / 10 ** R.pos)) ? 'dos cifras significativas (empieza por 1)' : 'una cifra significativa'}: $Δ${nom} = ${f(d, 4)} → ${R.txt.split(' ± ')[1]}$, y el valor se redondea hasta esa misma cifra: $${f(v, 8)} → ${R.txt.split(' ± ')[0]}$.<br><b>${nom} = (${R.txt})${un}</b>`;

  function medidas(sc) {
    const xs = K.lista(sc.datos, 'las medidas');
    if (xs.length < 2) throw new Error('Hacen falta al menos 2 medidas');
    const n = xs.length, m = xs.reduce((a, x) => a + x, 0) / n, s = Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1)), sm = s / Math.sqrt(n);
    const ins = lee(sc, 'inst', 'el error del aparato', { min: 0, def: 0 }), k = lee(sc, 'k', 'el factor de cobertura', { min: 0, minEx: true, def: 1 });
    const ale = k * sm, d = Math.sqrt(ale * ale + ins * ins);
    const nom = vacio(sc.nombre) ? 'x' : String(sc.nombre).trim(), un = vacio(sc.unidad) ? '' : ` ${String(sc.unidad).trim()}`, R = redondea(m, d);
    const pasos = [];
    pasos.push({ t: 'Media', html: `$x̄ = {∑ x_i}/n = ${f(xs.reduce((a, x) => a + x, 0), 8)}/${n} = ${f(m, 8)}$${un}` });
    pasos.push({ t: 'Desviación típica y error de la media', html: `$s = √({∑ (x_i − x̄)^2}/{n − 1}) = ${f(s, 4)}$, y el error de la media (lo que se separa la media de las medidas del valor verdadero) es $s/√n = ${f(s, 4)}/√${n} = ${f(sm, 4)}$${k !== 1 ? `, que con el factor de cobertura $k = ${f(k)}$ da $${f(ale, 4)}$` : ''}.` });
    pasos.push({ t: 'Error total', html: `Se suma en cuadratura con el error del aparato (su resolución): $Δ${nom} = √(${f(ale, 4)}^2 + ${f(ins, 4)}^2) = ${f(d, 4)}$. ${ins > ale ? 'Manda el aparato: repetir más medidas casi no mejora el resultado.' : 'Manda la dispersión de las medidas: con más medidas el error bajaría como $1/√n$.'}` });
    pasos.push({ t: 'Resultado redondeado', html: redTxt(nom, m, d, R, un) });
    const comp = compara(sc, nom, m, d, un, pasos);
    return { modo: 'medidas', nom, xs, n, m, s, sm, ins, k, ale, d, v: m, comp, rel: d / Math.abs(m), R, un, pasos };
  }

  /* ---------- Media ponderada (EST.ER-3) ---------- */
  // una fila por medida: «9,79 0,03» o «9,79 ± 0,03»
  function ponderada(sc) {
    const ms = [];
    String(sc.pond ?? '').split(/\r?\n/).forEach((lin, i) => {
      const l = lin.trim().replace(/±|\+\/-|\+-/g, ' ').replace(/;/g, ' ');
      if (!l || l.startsWith('#')) return;
      const tk = l.split(/\s+/);
      if (tk.length !== 2) throw new Error(`Medidas, fila ${i + 1}: escribe el valor y su incertidumbre («9,79 0,03»)`);
      const x = leeNum(tk[0]), d = leeNum(tk[1]);
      if (!isFinite(x) || !isFinite(d)) throw new Error(`Medidas, fila ${i + 1}: «${tk[0]}» o «${tk[1]}» no es un número`);
      if (!(d > 0)) throw new Error(`Medidas, fila ${i + 1}: la incertidumbre tiene que ser mayor que cero (el peso es 1/σ²)`);
      ms.push({ x, d, w: 1 / (d * d) });
    });
    if (ms.length < 2) throw new Error('Hacen falta al menos 2 medidas, cada una con su incertidumbre');
    const n = ms.length, W = ms.reduce((a, q) => a + q.w, 0), m = ms.reduce((a, q) => a + q.w * q.x, 0) / W, dInt = 1 / Math.sqrt(W);
    const chi2 = ms.reduce((a, q) => a + ((q.x - m) / q.d) ** 2, 0), gl = n - 1, red = chi2 / gl, dExt = dInt * Math.sqrt(red);
    for (const q of ms) { q.peso = q.w / W; q.z = (q.x - m) / q.d; }
    const simple = ms.reduce((a, q) => a + q.x, 0) / n;
    // si las medidas se dispersan más de lo que dicen sus errores (χ² reducido > 1) se da el error ampliado
    const amplia = red > 1, d = amplia ? dExt : dInt;
    const nom = vacio(sc.nombre) ? 'x' : String(sc.nombre).trim(), un = vacio(sc.unidad) ? '' : ` ${String(sc.unidad).trim()}`, R = redondea(m, d);
    const corta = (ts) => (ts.length > 6 ? [...ts.slice(0, 3), '…', ...ts.slice(-1)] : ts).join(' + ');
    const pasos = [];
    pasos.push({ t: 'Pesos', html: `Cada medida pesa $w_i = 1/σ_i^2$, así que la más precisa manda: ${(n > 6 ? [...ms.slice(0, 3), null, ...ms.slice(-1)] : ms).map((q) => (q ? `$1/${f(q.d, 3)}^2 = ${f(q.w, 4)}$` : '…')).join(', ')}; suman $∑ w_i = ${f(W, 5)}$.` });
    pasos.push({ t: 'Media ponderada', html: `$x̄ = {∑ w_i x_i}/{∑ w_i} = {${corta(ms.map((q) => `${f(q.w, 4)}·${f(q.x, 6)}`))}}/{${f(W, 5)}} = ${f(m, 8)}$${un} (la media sin pesos sería $${f(simple, 6)}$).` });
    pasos.push({ t: 'Incertidumbre de la media', html: `$σ_{x̄} = 1/√{∑ w_i} = 1/√{${f(W, 5)}} = ${f(dInt, 4)}$${un}: es menor que la de la mejor medida ($${f(Math.min(...ms.map((q) => q.d)), 3)}$).` });
    pasos.push({ t: 'χ² reducido: ¿son compatibles entre sí?', html: `$χ^2 = ∑ ({x_i − x̄}/{σ_i})^2 = ${f(chi2, 4)}$ con $n − 1 = ${gl}$ grados de libertad: $χ^2_"red" = ${f(red, 4)}$. ${red > 2 ? `Es bastante mayor que 1: las medidas se separan más de lo que dicen sus incertidumbres (alguna está subestimada o hay un error sistemático). La incertidumbre se amplía con $√{χ^2_"red"}$: $${f(dInt, 4)} · ${f(Math.sqrt(red), 4)} = ${f(dExt, 4)}$.` : red > 1 ? `Es algo mayor que 1: las medidas son compatibles, pero por prudencia la incertidumbre se amplía con $√{χ^2_"red"}$: $${f(dInt, 4)} · ${f(Math.sqrt(red), 4)} = ${f(dExt, 4)}$.` : `No pasa de 1: las medidas son compatibles entre sí y se deja la incertidumbre $${f(dInt, 4)}$${red < 0.3 && n > 2 ? ' (es muy pequeño: puede que las incertidumbres estén sobreestimadas)' : ''}.`}` });
    pasos.push({ t: 'Resultado redondeado', html: redTxt(nom, m, d, R, un) });
    const comp = compara(sc, nom, m, d, un, pasos);
    return { modo: 'ponderada', nom, ms, n, m, W, dInt, dExt, chi2, gl, red, amplia, simple, d, v: m, comp, rel: d / Math.abs(m), R, un, pasos };
  }

  const resolver = (sc) => (sc.modo === 'medidas' ? medidas : sc.modo === 'ponderada' ? ponderada : formula)(sc);

  const ejemplos = [
    { clave: 'pendulo', nombre: 'g con un péndulo: g = 4π² l / T²', sc: { modo: 'formula', nombre: 'g', f: '4 pi^2 l / T^2', vars: 'l 1,000 0,001\nT 2,006 0,005', metodo: 'cuadratica', unidad: 'm/s²' } },
    { clave: 'densidad', nombre: 'Densidad de un cilindro: ρ = 4m / (π d² h)', sc: { modo: 'formula', nombre: 'ρ', f: '4 m / (pi d^2 h)', vars: 'm 45,32 0,01\nd 1,250 0,005\nh 4,30 0,05', metodo: 'cuadratica', unidad: 'g/cm³' } },
    { clave: 'ohm', nombre: 'Resistencia por la ley de Ohm, cota lineal', sc: { modo: 'formula', nombre: 'R', f: 'V / I', vars: 'V 12,0 0,1\nI 0,250 0,005', metodo: 'lineal', unidad: 'Ω' } },
    { clave: 'potencia', nombre: 'Energía cinética: E = m v² / 2', sc: { modo: 'formula', nombre: 'K', f: 'm v^2 / 2', vars: 'm 0,500 0,001\nv 3,20 0,05', metodo: 'cuadratica', unidad: 'J' } },
    { clave: 'correlacion', nombre: 'Variables correlacionadas: perímetro P = 2(a + b)', sc: { modo: 'formula', nombre: 'P', f: '2 (a + b)', vars: 'a 12,40 0,05\nb 8,20 0,05', corr: 'a b 0,9', metodo: 'cuadratica', unidad: 'cm' } },
    { clave: 'aceptado', nombre: 'g con un péndulo, comparada con 9,80665 m/s²', sc: { modo: 'formula', nombre: 'g', f: '4 pi^2 l / T^2', vars: 'l 1,000 0,001\nT 2,006 0,005', metodo: 'cuadratica', unidad: 'm/s²', acept: '9,80665', dacept: '' } },
    { clave: 'ponderada', nombre: 'Media ponderada de tres medidas de g', sc: { modo: 'ponderada', nombre: 'g', pond: '9,79 0,03\n9,83 0,02\n9,76 0,05', unidad: 'm/s²', acept: '', dacept: '' } },
    { clave: 'tiempos', nombre: 'Serie de medidas del periodo con cronómetro', sc: { modo: 'medidas', nombre: 'T', datos: '2,01 1,98 2,03 2,00 1,97 2,02 1,99 2,04 2,00 1,99', inst: '0,01', k: '1', unidad: 's' } },
  ];

  return { resolver, ejemplos, redondea, MODOS, METODOS };
})();
if (typeof module !== 'undefined') module.exports = Errores;
