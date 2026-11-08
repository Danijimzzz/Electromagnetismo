/* =====================================================================
   Oferta y demanda (sin DOM): equilibrio de mercado con una demanda
   Qd = a − bP y una oferta Qs = c + dP lineales, elasticidades en el
   equilibrio, un precio fijado (máximo o mínimo) con la escasez o el
   excedente que provoca, y el nuevo equilibrio cuando se desplaza la
   demanda, la oferta o las dos. Formato de economia/comun.js; interfaz en
   oferta-demanda/app.js. Los excedentes y los impuestos están en
   excedentes/.
     resolver(sc)  { a, b, c, d, pf?, da?, dc? } → { p, q, ed, es, control?, nuevo?, pasos }
   ===================================================================== */
const OfertaDemanda = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const n = (x) => f(x, 6), signo = (x) => (x < 0 ? `− ${n(-x)}` : `+ ${n(x)}`), par = (x) => (x < 0 ? `(${n(x)})` : n(x));
  const recta = (a, b, Q = 'Q_d') => `${Q} = ${n(a)} − ${n(b)} P`, rectaS = (c, d) => `Q_s = ${c ? `${n(c)} + ` : ''}${n(d)} P`.replace('+ −', '− ');

  // equilibrio de Qd = a − bP y Qs = c + dP
  function equilibrio(a, b, c, d) { const p = (a - c) / (b + d); return { p, q: a - b * p }; }
  const flecha = (x) => (Math.abs(x) < 1e-9 ? 'no cambia' : x > 0 ? 'sube' : 'baja');

  function resolver(sc) {
    const { a, b, c, d, conv } = K.curvas(sc);
    const { p, q } = equilibrio(a, b, c, d);
    if (!(p > 0) || !(q > 0)) throw new Error('Con estas curvas no hay un equilibrio con precio y cantidad positivos: revisa los signos (la demanda baja con el precio y la oferta sube)');
    const ed = (-b * p) / q, es = (d * p) / q, pasos = [];
    if (conv) pasos.push({ t: 'Conversión de las curvas', html: conv });
    pasos.push({ t: 'Equilibrio', html: `En el equilibrio se demanda lo mismo que se ofrece, $Q_d = Q_s$:<br>$${n(a)} − ${n(b)} P = ${n(c)} + ${n(d)} P ⇒ (${n(b)} + ${n(d)}) P = ${n(a)} − ${par(c)}$<br>$P^* = {${n(a)} − ${par(c)}}/{${n(b + d)}} = ${n(p)}$ &ensp; y &ensp; $Q^* = ${n(a)} − ${n(b)} · ${n(p)} = ${n(q)}$` });
    pasos.push({ t: 'Elasticidades en el equilibrio', html: `Demanda: $ε_d = −b · P^*/Q^* = −${n(b)} · ${n(p)}/${n(q)} = ${f(ed, 4)}$ (${Math.abs(ed) > 1 ? 'elástica' : Math.abs(ed) < 1 ? 'inelástica' : 'unitaria'}).<br>Oferta: $ε_s = d · P^*/Q^* = ${n(d)} · ${n(p)}/${n(q)} = ${f(es, 4)}$ (${es > 1 ? 'elástica' : es < 1 ? 'inelástica' : 'unitaria'}).` });
    let control = null;
    if (!K.vacio(sc.pf)) {
      const pf = lee(sc, 'pf', 'el precio fijado', { min: 0, minEx: true }), qd = Math.max(0, a - b * pf), qs = Math.max(0, c + d * pf), dif = qd - qs;
      control = { pf, qd, qs, dif, vendida: Math.min(qd, qs) };
      const tipo = Math.abs(pf - p) < 1e-9 ? 'igual' : pf < p ? 'maximo' : 'minimo';
      pasos.push({ t: 'Precio fijado', html: `A $P = ${n(pf)}$: $Q_d = ${n(a)} − ${n(b)} · ${n(pf)} = ${n(qd)}$ y $Q_s = ${n(c)} + ${n(d)} · ${n(pf)} = ${n(qs)}$.<br>${tipo === 'igual' ? 'Es el precio de equilibrio: no sobra ni falta nada.' : tipo === 'maximo' ? `Está <b>por debajo</b> del equilibrio, como un precio máximo (un tope, como en algunos alquileres): se quiere comprar más de lo que se vende y hay <b>escasez</b> (exceso de demanda) de $${n(qd)} − ${n(qs)} = ${n(dif)}$ unidades. Solo se venden ${n(control.vendida)}, lo que ofrecen los vendedores; un precio máximo por encima de ${n(p)} no tendría efecto.` : `Está <b>por encima</b> del equilibrio, como un precio mínimo (un precio de garantía o un salario mínimo): se ofrece más de lo que se compra y hay <b>excedente</b> (exceso de oferta) de $${n(qs)} − ${n(qd)} = ${n(-dif)}$ unidades. Solo se venden ${n(control.vendida)}, lo que piden los compradores; un precio mínimo por debajo de ${n(p)} no tendría efecto.`}` });
      control.tipo = tipo;
    }
    let nuevo = null;
    const da = lee(sc, 'da', 'el desplazamiento de la demanda', { def: 0 }), dc = lee(sc, 'dc', 'el desplazamiento de la oferta', { def: 0 });
    if (da || dc) {
      const a2 = a + da, c2 = c + dc, e2 = equilibrio(a2, b, c2, d);
      if (!(e2.p > 0) || !(e2.q > 0)) throw new Error('Tras el desplazamiento no queda un equilibrio con precio y cantidad positivos: prueba con un desplazamiento menor');
      nuevo = { a: a2, c: c2, ...e2, dp: e2.p - p, dq: e2.q - q };
      const que = [da && `la demanda ${da > 0 ? 'aumenta' : 'disminuye'} (se desplaza a la ${da > 0 ? 'derecha' : 'izquierda'} ${n(Math.abs(da))} unidades a cada precio)`, dc && `la oferta ${dc > 0 ? 'aumenta' : 'disminuye'} (se desplaza a la ${dc > 0 ? 'derecha' : 'izquierda'} ${n(Math.abs(dc))} unidades)`].filter(Boolean).join(' y ');
      const regla = da && dc ? (Math.sign(da) === Math.sign(dc) ? 'Si las dos curvas se mueven hacia el mismo lado, la cantidad va con ellas y lo que pase con el precio depende de cuál se mueva más.' : 'Si se mueven en sentidos contrarios, el precio va con la demanda y lo que pase con la cantidad depende de cuál se mueva más.') : da ? 'Un cambio de la demanda mueve el precio y la cantidad en el mismo sentido.' : 'Un cambio de la oferta mueve el precio y la cantidad en sentidos contrarios.';
      pasos.push({ t: 'Desplazamiento', html: `Si ${que}: $${recta(a2, b)}$ y $${rectaS(c2, d)}$.<br>$P^*_2 = {${n(a2)} − ${par(c2)}}/{${n(b + d)}} = ${n(e2.p)}$ &ensp; y &ensp; $Q^*_2 = ${n(a2)} − ${n(b)} · ${n(e2.p)} = ${n(e2.q)}$<br>El precio <b>${flecha(nuevo.dp)}</b> (${signo(nuevo.dp)}) y la cantidad <b>${flecha(nuevo.dq)}</b> (${signo(nuevo.dq)}). ${regla}` });
    }
    return { a, b, c, d, p, q, ed, es, control, nuevo, pasos };
  }

  const ejemplos = [
    { clave: 'basico', nombre: 'Equilibrio: Qd = 100 − 2P y Qs = 20 + 2P', sc: { a: '100', b: '2', c: '20', d: '2', pf: '', da: '', dc: '' } },
    { clave: 'tope', nombre: 'Precio máximo de 15 €: escasez', sc: { a: '100', b: '2', c: '20', d: '2', pf: '15', da: '', dc: '' } },
    { clave: 'garantia', nombre: 'Precio mínimo de garantía para el trigo: excedente', sc: { a: '500', b: '10', c: '-100', d: '20', pf: '25', da: '', dc: '' } },
    { clave: 'renta', nombre: 'Sube la renta: la demanda se desplaza a la derecha', sc: { a: '100', b: '2', c: '20', d: '2', pf: '', da: '20', dc: '' } },
    { clave: 'helada', nombre: 'Una helada: baja la oferta de naranjas', sc: { a: '200', b: '10', c: '50', d: '20', pf: '', da: '', dc: '-30' } },
    { clave: 'ambas', nombre: 'Suben a la vez la demanda y la oferta', sc: { a: '100', b: '2', c: '20', d: '2', pf: '', da: '20', dc: '20' } },
    { clave: 'inversa', nombre: 'Curvas como precio: P = 50 − Q/2 y P = 10 + Q/2', sc: { forma: 'p', pa: '50', pb: '0,5', pc: '10', pd: '0,5', pf: '', da: '', dc: '' } },
    { clave: 'dos-puntos', nombre: 'Curvas por dos puntos: a 10 € se piden 80 y a 20 €, 60', sc: { forma: 'puntos', dp1: '10', dq1: '80', dp2: '20', dq2: '60', sp1: '10', sq1: '40', sp2: '20', sq2: '60', pf: '', da: '', dc: '' } },
  ];

  return { resolver, ejemplos, equilibrio };
})();
if (typeof module !== 'undefined') module.exports = OfertaDemanda;
