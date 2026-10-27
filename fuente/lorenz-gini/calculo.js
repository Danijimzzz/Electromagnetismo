/* =====================================================================
   Curva de Lorenz e índice de Gini (sin DOM): la desigualdad de la renta a
   partir de las rentas de cada persona, de tramos (personas y renta media
   de cada uno) o de grupos con su % de población y de renta (quintiles,
   deciles). Da las proporciones acumuladas p y q, el índice de Gini por el
   área (trapecios) y con la fórmula de clase Σ(p − q)/Σp, el reparto del
   20 % más pobre y más rico (S80/S20) y la curva. Formato de
   economia/comun.js; interfaz en lorenz-gini/app.js.
     resolver(sc)  { modo: 'rentas' | 'tramos' | 'grupos', datos } → { filas, G, Gc, s20, s80, pasos }
   ===================================================================== */
const LorenzGini = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, num } = K;
  const MODOS = { rentas: 'Rentas de cada persona', tramos: 'Tramos: personas y renta media', grupos: 'Grupos: % de población y de renta' };
  const n4 = (x) => f(x, 4), pc = (x) => `${f(100 * x, 4)} %`;

  // grupos [[peso de población, renta del grupo]] ordenados de más pobre a más rico (por renta por persona)
  function lee(sc) {
    if (sc.modo === 'rentas') {
      const v = K.lista(sc.datos, 'las rentas');
      if (v.length < 2) throw new Error('Escribe al menos dos rentas');
      if (v.some((x) => x < 0)) throw new Error('Las rentas no pueden ser negativas');
      return v.map((x) => [1, x]);
    }
    const fs = K.filas(sc.datos, 2, 'los datos');
    if (fs.length < 2) throw new Error('Escribe al menos dos filas');
    if (fs.some(([a, b]) => a <= 0 || b < 0)) throw new Error(sc.modo === 'tramos' ? 'Las personas tienen que ser positivas y la renta media no puede ser negativa' : 'Los % de población tienen que ser positivos y los de renta no pueden ser negativos');
    return sc.modo === 'tramos' ? fs.map(([nn, m]) => [nn, nn * m]) : fs;
  }

  function resolver(sc) {
    const modo = MODOS[sc.modo] ? sc.modo : 'rentas', gs = lee({ ...sc, modo });
    const ord = gs.map(([a, b], i) => ({ a, b, i, x: b / a })).sort((u, w) => u.x - w.x), reordena = ord.some((o, k) => o.i !== k);
    const A = ord.reduce((s, o) => s + o.a, 0), B = ord.reduce((s, o) => s + o.b, 0);
    if (B <= 0) throw new Error('La renta total es 0: no hay nada que repartir');
    let pa = 0, qa = 0;
    const filas = ord.map((o) => { pa += o.a; qa += o.b; return { ...o, p: pa / A, q: qa / B, sp: o.a / A, sq: o.b / B }; });
    // Gini por el área: 1 − Σ (p_i − p_{i−1}) (q_i + q_{i−1})
    let suma = 0; filas.forEach((r, k) => { const p0 = k ? filas[k - 1].p : 0, q0 = k ? filas[k - 1].q : 0; suma += (r.p - p0) * (r.q + q0); });
    const G = 1 - suma, sin = filas.slice(0, -1), Sp = sin.reduce((s, r) => s + r.p, 0), Gc = Sp ? sin.reduce((s, r) => s + (r.p - r.q), 0) / Sp : 0;
    // la curva de Lorenz entre los puntos (lineal), para el 20 % más pobre y el más rico
    const L = (p) => { let p0 = 0, q0 = 0; for (const r of filas) { if (p <= r.p + 1e-12) return q0 + ((r.q - q0) * (p - p0)) / (r.p - p0); p0 = r.p; q0 = r.q; } return 1; };
    const s20 = L(0.2), s80 = 1 - L(0.8), ratio = s20 > 0 ? s80 / s20 : Infinity, pasos = [];
    const que = modo === 'rentas' ? 'personas' : 'grupos', [los, dos] = modo === 'rentas' ? ['Las', 'ordenadas'] : ['Los', 'ordenados'], unidad = modo === 'grupos' ? '' : ' (en las unidades que escribas)';
    pasos.push({ t: 'Ordenar de menos a más renta', html: `${reordena ? `Se ordenan ${los.toLowerCase()} ${que} de menos a más renta${modo === 'rentas' ? '' : ' por persona'}.` : `${los} ${que} ya están ${dos} de menos a más renta${modo === 'rentas' ? '' : ' por persona'}.`} ${modo === 'grupos' ? `Población total: ${f(A, 6)}; renta total: ${f(B, 6)}.` : `Población: ${f(A, 8)} personas; renta total: ${num(B, B % 1 ? 2 : 0)}${unidad}, ${num(B / A, 2)} por persona.`}` });
    pasos.push({ t: 'Proporciones acumuladas', html: `Para cada ${modo === 'rentas' ? 'persona' : 'grupo'}, $p_i$ es la fracción de población acumulada y $q_i$ la de renta acumulada: ${filas.slice(0, 6).map((r) => `(${n4(r.p)}; ${n4(r.q)})`).join(', ')}${filas.length > 6 ? ' y así hasta (1; 1)' : ''}. La curva de Lorenz une esos puntos desde (0; 0) hasta (1; 1).` });
    pasos.push({ t: 'Índice de Gini por el área', html: `Es el doble del área entre la diagonal y la curva. Con trapecios: $G = 1 − Σ (p_i − p_{i−1})(q_i + q_{i−1}) = 1 − ${f(suma, 6)} = ${n4(G)}$.` });
    pasos.push({ t: 'Con la fórmula de clase', html: `$I_G = {Σ (p_i − q_i)}/{Σ p_i}$, sin el último punto: $${f(sin.reduce((s, r) => s + (r.p - r.q), 0), 6)}/${f(Sp, 6)} = ${n4(Gc)}$. ${Math.abs(G - Gc) > 0.005 ? `No coincide con el del área: con ${filas.length} ${que} es una aproximación, y se acercan cuando hay muchos.` : 'Coincide casi con el del área.'}` });
    pasos.push({ t: 'Los extremos', html: `El 20 % más pobre se lleva el ${pc(s20)} de la renta y el 20 % más rico, el ${pc(s80)}${isFinite(ratio) ? `: ${'$'}{"S80"}/{"S20"} = ${f(s80, 4)}/${f(s20, 4)} = ${f(ratio, 4)}$` : ''}. ${G < 0.005 ? 'Reparto igualitario: todos tienen lo mismo.' : G < 0.3 ? 'Es una desigualdad baja, como la de los países nórdicos.' : G < 0.4 ? 'Es una desigualdad media, como la de España (alrededor de 0,32).' : 'Es una desigualdad alta.'}` });
    return { modo, filas, A, B, G, Gc, s20, s80, ratio, reordena, pasos };
  }

  const ejemplos = [
    { clave: 'cinco', nombre: 'Cinco personas: 10, 20, 30, 40 y 100 mil €', sc: { modo: 'rentas', datos: '10 20 30 40 100' } },
    { clave: 'igualdad', nombre: 'Todos ganan lo mismo', sc: { modo: 'rentas', datos: '25 25 25 25' } },
    { clave: 'quintiles', nombre: 'Quintiles de un país (datos de ejemplo)', sc: { modo: 'grupos', datos: '% población  % renta\n20 7\n20 13\n20 17\n20 23\n20 40' } },
    { clave: 'tramos', nombre: 'Cuatro tramos de renta', sc: { modo: 'tramos', datos: 'personas  renta media\n40 10\n30 20\n20 35\n10 80' } },
    { clave: 'desordenado', nombre: 'Rentas sin ordenar de diez personas', sc: { modo: 'rentas', datos: '1500 900 2100 1200 3500 800 1800 6000 1100 1400' } },
  ];

  return { resolver, ejemplos, MODOS };
})();
if (typeof module !== 'undefined') module.exports = LorenzGini;
