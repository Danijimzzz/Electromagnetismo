/* =====================================================================
   Propagación de errores (sin DOM): la incertidumbre de una magnitud
   calculada f(x, y, …) a partir de las de sus variables, con las
   derivadas parciales (suma cuadrática si los errores son independientes,
   o cota lineal con los valores absolutos), la contribución de cada
   variable y el resultado redondeado como en el laboratorio: la
   incertidumbre con una cifra significativa (dos si la primera es un 1) y
   el valor hasta esa misma cifra. También el error de una serie de
   medidas repetidas (media, desviación, error de la media y del aparato).
   Lee las expresiones con Expresion (matematicas/expresion.js), que deriva
   simbólicamente; formato y lectura en calculadora.js; interfaz en
   errores/app.js.
   ===================================================================== */
const Errores = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const { f, lee, leeNum, vacio } = K;
  const MODOS = { formula: 'Una magnitud calculada f(x, y, …)', medidas: 'Una serie de medidas repetidas' };
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
    const d = met === 'lineal' ? usadas.reduce((s, q) => s + q.c, 0) : Math.sqrt(usadas.reduce((s, q) => s + q.c * q.c, 0));
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
    pasos.push({ t: 'Error relativo', html: `$ε = {Δ${nom}}/{|${nom}|} = ${f(d, 4)}/${f(Math.abs(v), 6)} = ${f(d / Math.abs(v), 3)}$ (${f((100 * d) / Math.abs(v), 3)} %). Pesa más ${usadas.slice().sort((a, b) => b.peso - a.peso)[0].n} (${f(100 * usadas.slice().sort((a, b) => b.peso - a.peso)[0].peso, 3)} % de ${met === 'lineal' ? 'la cota' : '$Δ' + nom + '^2$'}): es la medida que conviene mejorar.` });
    pasos.push({ t: 'Resultado redondeado', html: redTxt(nom, v, d, R, un) });
    return { modo: 'formula', met, nom, ast, sv, vs: usadas, v, d, rel: d / Math.abs(v), R, un, pasos };
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
    return { modo: 'medidas', nom, xs, n, m, s, sm, ins, k, ale, d, v: m, rel: d / Math.abs(m), R, un, pasos };
  }

  const resolver = (sc) => (sc.modo === 'medidas' ? medidas : formula)(sc);

  const ejemplos = [
    { clave: 'pendulo', nombre: 'g con un péndulo: g = 4π² l / T²', sc: { modo: 'formula', nombre: 'g', f: '4 pi^2 l / T^2', vars: 'l 1,000 0,001\nT 2,006 0,005', metodo: 'cuadratica', unidad: 'm/s²' } },
    { clave: 'densidad', nombre: 'Densidad de un cilindro: ρ = 4m / (π d² h)', sc: { modo: 'formula', nombre: 'ρ', f: '4 m / (pi d^2 h)', vars: 'm 45,32 0,01\nd 1,250 0,005\nh 4,30 0,05', metodo: 'cuadratica', unidad: 'g/cm³' } },
    { clave: 'ohm', nombre: 'Resistencia por la ley de Ohm, cota lineal', sc: { modo: 'formula', nombre: 'R', f: 'V / I', vars: 'V 12,0 0,1\nI 0,250 0,005', metodo: 'lineal', unidad: 'Ω' } },
    { clave: 'potencia', nombre: 'Energía cinética: E = m v² / 2', sc: { modo: 'formula', nombre: 'K', f: 'm v^2 / 2', vars: 'm 0,500 0,001\nv 3,20 0,05', metodo: 'cuadratica', unidad: 'J' } },
    { clave: 'tiempos', nombre: 'Serie de medidas del periodo con cronómetro', sc: { modo: 'medidas', nombre: 'T', datos: '2,01 1,98 2,03 2,00 1,97 2,02 1,99 2,04 2,00 1,99', inst: '0,01', k: '1', unidad: 's' } },
  ];

  return { resolver, ejemplos, redondea, MODOS, METODOS };
})();
if (typeof module !== 'undefined') module.exports = Errores;
