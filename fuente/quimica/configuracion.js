/* =====================================================================
   Configuración electrónica (sin DOM): a partir de un elemento y su carga,
   la configuración por orden de llenado (diagrama de Moeller) y por capas,
   el diagrama de orbitales con la regla de Hund, los electrones
   desapareados y los números cuánticos del electrón diferenciador.
   Usa Elementos (elementos.js).
   ===================================================================== */
const Configuracion = (() => {
  const LETRA = 'spdf';
  const SUP = (k) => String(k).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // orden de llenado n + l, a igualdad el de menor n (regla de Madelung, diagrama de Moeller)
  const ORDEN = [];
  for (let s = 1; s <= 8; s++) for (let l = Math.min(s - 1, 3); l >= 0; l--) { const n = s - l; if (n > l) ORDEN.push(`${n}${LETRA[l]}`); }

  // «Fe», «hierro», «26», «Fe2+», «Fe^3+», «Cl-», «O2−» → { el, carga }
  function leer(texto, carga = null) {
    let t = String(texto).trim().replace(/[⁺]/g, '+').replace(/[⁻−]/g, '-').replace(/[⁰-⁹]/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c));
    if (!t) throw new Error('Escribe un elemento: símbolo, nombre o número atómico');
    let q = 0;
    const m = t.match(/^(.*?)\s*\^?\(?(\d*)([+-])(\d*)\)?$/);
    if (m && m[1]) { q = (m[3] === '+' ? 1 : -1) * +(m[2] || m[4] || 1); t = m[1].trim(); }
    let el = /^\d+$/.test(t) ? Elementos.lista[+t - 1] : Elementos.porSimbolo[t[0].toUpperCase() + t.slice(1).toLowerCase()];
    if (!el) el = Elementos.lista.find((e) => sinTildes(e.nombre) === sinTildes(t));
    if (!el) throw new Error(`No encuentro el elemento «${t}»`);
    if (carga !== null && carga !== '' && isFinite(+carga)) q = +carga;
    if (q >= el.Z) throw new Error(`Un ion ${el.simbolo}${q}+ no tendría electrones`);
    if (q < -4) throw new Error('Un anión con más de 4 cargas negativas no existe');
    return { el, carga: q };
  }

  function analizar(texto, carga = null) {
    const { el, carga: q } = leer(texto, carga);
    const Z = el.Z, ne = Z - q;
    const conf = Elementos.configuracion(Z, q);
    const porCapas = Elementos.texto(conf);
    const porLlenado = ORDEN.filter((o) => conf.some((c) => c.nombre === o)).map((o) => o + SUP(conf.find((c) => c.nombre === o).e)).join(' ');
    // ¿es una excepción a Madelung? (solo tiene sentido en el átomo neutro y en sus cationes)
    const madelung = {};
    let resto = Z;
    for (const o of ORDEN) { if (!resto) break; const cap = 2 * (2 * LETRA.indexOf(o[o.length - 1]) + 1); madelung[o] = Math.min(cap, resto); resto -= madelung[o]; }
    const neutro = Elementos.configuracion(Z, 0);
    const excepcion = neutro.some((c) => madelung[c.nombre] !== c.e) || Object.keys(madelung).some((o) => !neutro.some((c) => c.nombre === o));
    const esperada = ORDEN.filter((o) => madelung[o]).map((o) => o + SUP(madelung[o])).join(' ');
    // abreviada con el gas noble anterior al número de electrones
    const g = [...Elementos.NOBLES].reverse().find((n) => (q ? n <= ne : n < ne));
    let abreviada = porLlenado;
    if (g) {
      const base = Elementos.configuracion(g);
      const resto2 = conf.filter((c) => { const b = base.find((x) => x.nombre === c.nombre); return !b || b.e !== c.e; });
      abreviada = `[${Elementos.lista[g - 1].simbolo}] ` + ORDEN.filter((o) => resto2.some((c) => c.nombre === o)).map((o) => o + SUP(resto2.find((c) => c.nombre === o).e)).join(' ');
      if (!resto2.length) abreviada = `[${Elementos.lista[g - 1].simbolo}]`;
    } else if (ne === 0) abreviada = '';
    // diagrama de orbitales (Hund): primero un electrón ↑ en cada orbital, luego ↓
    const cajas = ORDEN.filter((o) => conf.some((c) => c.nombre === o)).map((o) => {
      const l = LETRA.indexOf(o[o.length - 1]), k = conf.find((c) => c.nombre === o).e, nOrb = 2 * l + 1;
      const orbitales = Array.from({ length: nOrb }, (_, i) => (i < k ? 1 : 0) + (i < k - nOrb ? 1 : 0));
      return { nombre: o, n: +o.slice(0, -1), l, e: k, orbitales };
    });
    const desapareados = cajas.reduce((s, c) => s + c.orbitales.filter((x) => x === 1).length, 0);
    // electrón diferenciador: el último que entra según el orden de llenado
    let diferenciador = null;
    const ult = cajas[cajas.length - 1];
    if (ult) {
      const nOrb = 2 * ult.l + 1, k = ult.e;
      const i = k <= nOrb ? k - 1 : k - nOrb - 1;
      diferenciador = { orbital: ult.nombre, n: ult.n, l: ult.l, ml: i - ult.l, ms: k <= nOrb ? '+½' : '−½' };
    }
    // capa de valencia: la de mayor n
    const nMax = conf.length ? Math.max(...conf.map((c) => c.n)) : 0;
    const valencia = conf.filter((c) => c.n === nMax).reduce((s, c) => s + c.e, 0);
    return {
      el, carga: q, Z, electrones: ne, porLlenado, porCapas, abreviada, capas: capasDe(conf), cajas, desapareados,
      magnetismo: desapareados ? 'paramagnético' : 'diamagnético', diferenciador, excepcion: excepcion && q >= 0, esperada,
      capaValencia: nMax, electronesValencia: valencia, bloque: Elementos.bloque(Z),
    };
  }
  const capasDe = (conf) => { const c = []; for (const o of conf) c[o.n - 1] = (c[o.n - 1] || 0) + o.e; return Array.from(c, (x) => x || 0); };

  const ejemplos = ['Fe', 'Cr', 'Cu', 'Fe^2+', 'Cl-', 'O', 'Gd', 'Ag'];
  return { leer, analizar, ORDEN, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = Configuracion;
