/* =====================================================================
   Simulador de circuitos · barrido de un parámetro (sin DOM). Cambia el valor
   de un campo de un componente (una resistencia, un condensador, la amplitud o
   la frecuencia de una fuente…) a lo largo de un rango, resuelve el circuito en
   cada punto con el mismo camino que la interfaz (ExtraerSim + SimCircuitos) y
   devuelve la medida pedida. La pestaña «Barrido» de app.js lo dibuja.
   Medidas: { k: 'U'|'I'|'P', id } (tensión, corriente o potencia de un
   componente) o { k: 'V', id: nudo }. Modo 'cc' (continua) o 'ca' (valor
   eficaz de la primera frecuencia de las fuentes de seno).
   Devuelve { x, y } en unidades del SI; los puntos que no se pueden resolver
   quedan en NaN.
   ===================================================================== */
const SimBarrido = (() => {
  const S = typeof SimCircuitos !== 'undefined' ? SimCircuitos : null;
  // campos numéricos de un componente que se pueden barrer (sin listas ni nombres)
  const parametros = (c) => (CompSim.C[c.t].campos || []).filter((f) => !f.op && f.k !== 'ctrl' && f.k !== 'nombre' && (!f.si || f.si(c.v)) && isFinite(Herramienta.leeSI(c.v[f.k], f.base ?? 1)) && String(c.v[f.k] ?? '').trim() !== '');
  const siUnidad = (f) => (f.base && f.base !== 1 && f.un && f.un.length > 1 ? f.un.slice(1) : f.un || '');
  const puntosDe = (desde, hasta, n, log) => Array.from({ length: n }, (_, i) => (log ? desde * (hasta / desde) ** (i / (n - 1)) : desde + ((hasta - desde) * i) / (n - 1)));

  function barre(sc, { comp, campo, desde, hasta, puntos = 60, log = false, medida, modo = 'cc' }) {
    const c0 = (sc.componentes || []).find((c) => c.id === comp), f = c0 && CompSim.C[c0.t].campos.find((q) => q.k === campo);
    if (!f) throw new Error('Elige el componente y el parámetro que quieres variar');
    if (!(isFinite(desde) && isFinite(hasta)) || desde === hasta) throw new Error('El rango del barrido no es válido');
    if (log && !(desde > 0 && hasta > 0)) throw new Error('En escala logarítmica los dos extremos tienen que ser mayores que 0');
    const base = f.base ?? 1, xs = puntosDe(desde, hasta, Math.max(2, puntos), log), ys = [];
    for (const x of xs) {
      const copia = Herramienta.copia(sc), c = copia.componentes.find((q) => q.id === comp);
      c.v[campo] = String(x / base);
      try {
        const ext = ExtraerSim.extraer(copia), net = ext.net, ids = ext.elementosDe[medida.id] || [];
        let y = NaN;
        if (modo === 'ca') {
          const fa = S.fasores(net)[0];
          if (fa) y = medida.k === 'V' ? S.mod(fa.V[medida.id] || { re: 0, im: 0 }) / Math.SQRT2 : medida.k === 'P' ? (fa.U[ids[0]].re * fa.I[ids[0]].re + fa.U[ids[0]].im * fa.I[ids[0]].im) / 2 : S.mod(fa[medida.k][ids[0]]) / Math.SQRT2;
        } else {
          const op = S.operacion(net);
          y = medida.k === 'V' ? (medida.id === '0' ? 0 : op.V[medida.id].re) : op[medida.k][ids[0]].re;
        }
        ys.push(y);
      } catch (e) { ys.push(NaN); }
    }
    return { x: xs, y: ys };
  }
  return { parametros, siUnidad, barre };
})();
if (typeof module !== 'undefined') module.exports = SimBarrido;
