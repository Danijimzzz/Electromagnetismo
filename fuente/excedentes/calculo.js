/* =====================================================================
   Excedentes, impuestos y eficiencia (sin DOM): con una demanda
   Qd = a − bP y una oferta Qs = c + dP lineales, el excedente del
   consumidor y del productor en el equilibrio y tras una intervención
   (un impuesto o una subvención por unidad, o un precio máximo o mínimo),
   la recaudación o el gasto público, quién soporta el impuesto y la
   pérdida irrecuperable de eficiencia. El equilibrio sin intervención
   está explicado en oferta-demanda/; formato de economia/comun.js;
   interfaz en excedentes/app.js.
     resolver(sc)  { a, b, c, d, interv, v } → { p, q, ec, ep, w, des?: { pc, pv, q, ec, ep, estado, w, pi }, pasos }
   ===================================================================== */
const Excedentes = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const n = (x) => f(x, 6), par = (x) => (x < 0 ? `(${n(x)})` : n(x));
  const INTERV = { ninguna: 'Ninguna (solo el equilibrio)', advalorem: 'Impuesto en % del precio (IVA)', impuesto: 'Impuesto por unidad', subvencion: 'Subvención por unidad', maximo: 'Precio máximo', minimo: 'Precio mínimo' };

  function resolver(sc) {
    const { a, b, c, d, conv } = K.curvas(sc);
    const p = (a - c) / (b + d), q = a - b * p;
    if (!(p > 0) || !(q > 0)) throw new Error('Con estas curvas no hay un equilibrio con precio y cantidad positivos: revisa los signos (la demanda baja con el precio y la oferta sube)');
    const pd = (Q) => (a - Q) / b, ps = (Q) => Math.max(0, (Q - c) / d), pMax = a / b, p0 = Math.max(0, -c / d), q0 = Math.max(c, 0);
    // excedentes cuando se intercambian Q unidades, pagando Pc los compradores y cobrando Pv los vendedores
    const EC = (Q, Pc) => Q * (pMax - Pc) - (Q * Q) / (2 * b);
    const coste = (Q) => (Q <= q0 ? 0 : ((Q - c) ** 2 - (q0 - c) ** 2) / (2 * d)), EP = (Q, Pv) => Pv * Q - coste(Q);
    const ec = EC(q, p), ep = EP(q, p), w = ec + ep, pasos = [];
    // cómo se escribe el excedente del productor con Q sobre la oferta: triángulo si la oferta sale del eje de precios, trapecio si sale del de cantidades
    const ecTxt = (Q, Pc) => Math.abs(Q - (a - b * Pc)) < 1e-9 * (1 + Q) ? `$EC = 1/2 · (${n(pMax)} − ${n(Pc)}) · ${n(Q)} = ${n(EC(Q, Pc))}$` : `$EC = {(${n(pMax)} − ${n(Pc)}) + (${n(pd(Q))} − ${n(Pc)})}/2 · ${n(Q)} = ${n(EC(Q, Pc))}$ (un trapecio: hasta $Q = ${n(Q)}$, donde la demanda vale ${n(pd(Q))})`;
    const epTxt = (Q, Pv) => Math.abs(Q - (c + d * Pv)) > 1e-9 * (1 + Q) ? `$EP = P · Q − "coste mínimo de producir" Q = ${n(Pv * Q)} − ${n(coste(Q))} = ${n(EP(Q, Pv))}$ (solo hasta $Q = ${n(Q)}$, donde la oferta vale ${n(ps(Q))})` : c > 0 ? `$EP = {(c + Q) · P}/2 = {(${n(c)} + ${n(Q)}) · ${n(Pv)}}/2 = ${n(EP(Q, Pv))}$ (un trapecio, porque a precio 0 ya se ofrecen ${n(c)})` : `$EP = 1/2 · (${n(Pv)} − ${n(p0)}) · ${n(Q)} = ${n(EP(Q, Pv))}$${p0 ? `, con ${n(p0)} el precio al que la oferta empieza` : ''}`;
    if (conv) pasos.push({ t: 'Conversión de las curvas', html: conv });
    pasos.push({ t: 'Equilibrio', html: `$${n(a)} − ${n(b)} P = ${n(c)} + ${n(d)} P ⇒ P^* = {${n(a)} − ${par(c)}}/{${n(b + d)}} = ${n(p)}$ &ensp; y &ensp; $Q^* = ${n(q)}$` });
    pasos.push({ t: 'Excedentes en el equilibrio', html: `Consumidor: lo que estarían dispuestos a pagar por encima de lo que pagan, el triángulo entre la demanda y el precio. La demanda corta el eje de precios en $a/b = ${n(pMax)}$:<br>${ecTxt(q, p)}<br>Productor: lo que cobran por encima de lo mínimo que aceptarían, entre el precio y la oferta:<br>${epTxt(q, p)}<br>Excedente total: $ET = EC + EP = ${n(w)}$, el máximo posible: el mercado competitivo es <b>eficiente</b>.` });
    const interv = INTERV[sc.interv] ? sc.interv : 'ninguna';
    let des = null;
    if (interv !== 'ninguna') {
      const nomV = { advalorem: 'el tipo del impuesto', impuesto: 'el impuesto por unidad', subvencion: 'la subvención por unidad', maximo: 'el precio máximo', minimo: 'el precio mínimo' }[interv];
      const v = lee(sc, 'v', nomV, { min: 0, minEx: true, ...(interv === 'advalorem' ? { max: 1000 } : {}) });
      let pc, pv, Q, pi = 0, txt, vu = v;
      if (interv === 'impuesto' || interv === 'subvencion' || interv === 'advalorem') {
        // ad valorem: un tipo τ sobre el precio que cobran los vendedores, P_c = (1 + τ)·P_v; equivale al impuesto por unidad t = τ·P_v
        const tau = v / 100, pvAd = (a - c) / (b * (1 + tau) + d);
        if (interv === 'advalorem') vu = tau * pvAd;
        const t = interv === 'subvencion' ? -v : vu;
        pc = (a - c + d * t) / (b + d); pv = pc - t; Q = a - b * pc;
        if (!(Q > 0) || !(pv > p0 - 1e-12)) throw new Error('Con un impuesto tan alto no se vende nada: prueba con uno menor');
        pi = t * Q;
        const cuota = d / (b + d);
        txt = interv === 'advalorem'
          ? `Un impuesto del ${n(v)} % se aplica al precio que cobran los vendedores: los compradores pagan $P_c = (1 + τ)·P_v = ${n(1 + tau)}·P_v$. En el mercado, $${n(a)} − ${n(b)}·${n(1 + tau)}·P_v = ${n(c)} + ${n(d)}·P_v$, así que $P_v = {${n(a)} − ${par(c)}}/{${n(b)}·${n(1 + tau)} + ${n(d)}} = ${n(pvAd)}$, &ensp; $P_c = ${n(pc)}$ &ensp; y &ensp; $Q_t = ${n(Q)}$.<br>Por unidad, el impuesto es $t = τ·P_v = ${n(tau)}·${n(pvAd)} = ${n(vu)}$ €: el mismo resultado que un impuesto por unidad de esa cuantía. Los compradores soportan ${n(100 * (pc - p) / vu)} % del impuesto y los vendedores ${n(100 * (p - pv) / vu)} %.`
          : interv === 'impuesto'
          ? `Con un impuesto de ${n(v)} por unidad, lo que pagan los compradores ($P_c$) y lo que cobran los vendedores ($P_v$) se separan: $P_c = P_v + ${n(v)}$. En el mercado, $${n(a)} − ${n(b)} P_c = ${n(c)} + ${n(d)} (P_c − ${n(v)})$, así que<br>$P_c = {${n(a)} − ${par(c)} + ${n(d)} · ${n(v)}}/{${n(b + d)}} = ${n(pc)}$, &ensp; $P_v = ${n(pc)} − ${n(v)} = ${n(pv)}$ &ensp; y &ensp; $Q_t = ${n(Q)}$<br>Los compradores pagan ${n(pc - p)} más que antes y los vendedores cobran ${n(p - pv)} menos: los consumidores soportan el ${f(100 * cuota, 3)} % del impuesto y los productores el ${f(100 * (1 - cuota), 3)} %. Lo soporta más el lado <b>menos elástico</b>, da igual a quién se lo cobre Hacienda.`
          : `Con una subvención de ${n(v)} por unidad, los vendedores cobran ${n(v)} más de lo que pagan los compradores: $P_v = P_c + ${n(v)}$. En el mercado, $${n(a)} − ${n(b)} P_c = ${n(c)} + ${n(d)} (P_c + ${n(v)})$, así que<br>$P_c = {${n(a)} − ${par(c)} − ${n(d)} · ${n(v)}}/{${n(b + d)}} = ${n(pc)}$, &ensp; $P_v = ${n(pc)} + ${n(v)} = ${n(pv)}$ &ensp; y &ensp; $Q_s = ${n(Q)}$<br>Los compradores pagan ${n(p - pc)} menos y los vendedores cobran ${n(pv - p)} más: el ${f(100 * cuota, 3)} % de la subvención va a los consumidores y el ${f(100 * (1 - cuota), 3)} % a los productores.`;
        if (!(pc > 0)) throw new Error('Con una subvención tan alta el precio para los compradores sale negativo: prueba con una menor');
      } else {
        const ok = interv === 'maximo' ? v < p : v > p;
        if (!ok) { pc = pv = p; Q = q; txt = `Un precio ${interv === 'maximo' ? 'máximo de' : 'mínimo de'} ${n(v)} está ${interv === 'maximo' ? 'por encima' : 'por debajo'} del de equilibrio (${n(p)}): <b>no tiene efecto</b> y el mercado se queda en el equilibrio.`; }
        else if (interv === 'maximo') {
          pc = pv = v; Q = Math.max(0, c + d * v);
          txt = `A $P = ${n(v)}$ los vendedores solo ofrecen $Q_s = ${n(c)} + ${n(d)} · ${n(v)} = ${n(Q)}$, aunque se pidan $${n(a - b * v)}$: se venden ${n(Q)} unidades. Se supone que las compran los que más las valoran; si no, la pérdida es aún mayor.`;
        } else {
          pc = pv = v; Q = a - b * v;
          txt = `A $P = ${n(v)}$ los compradores solo piden $Q_d = ${n(a)} − ${n(b)} · ${n(v)} = ${n(Q)}$, aunque se ofrezcan $${n(c + d * v)}$: se venden ${n(Q)} unidades. Se supone que las producen los que tienen menos costes.`;
        }
        if (!(Q > 0)) throw new Error('Con ese precio no se vende nada: prueba con otro');
      }
      const ec2 = EC(Q, pc), ep2 = EP(Q, pv), w2 = ec2 + ep2 + pi, pie = w - w2;
      des = { interv, v, vu, pc, pv, q: Q, ec: ec2, ep: ep2, pi, w: w2, pie };
      pasos.push({ t: INTERV[interv], html: txt });
      pasos.push({ t: 'Excedentes tras la intervención', html: `${ecTxt(Q, pc)}<br>${epTxt(Q, pv)}<br>${pi > 0 ? `Recaudación: $T = ${n(vu)} · ${n(Q)} = ${n(pi)}$ (vuelve a la sociedad, así que suma)<br>` : pi < 0 ? `Gasto en la subvención: $${n(v)} · ${n(Q)} = ${n(-pi)}$ (lo pagan los contribuyentes, así que resta)<br>` : ''}$ET = ${n(ec2)} + ${n(ep2)}${pi ? ` ${pi > 0 ? '+' : '−'} ${n(Math.abs(pi))}` : ''} = ${n(w2)}$` });
      pasos.push({ t: 'Pérdida irrecuperable de eficiencia', html: pie > 1e-9 ? `$PIE = ET^* − ET = ${n(w)} − ${n(w2)} = ${n(pie)}$${interv === 'impuesto' || interv === 'subvencion' || interv === 'advalorem' ? `, el triángulo entre las dos curvas: $1/2 · ${n(vu)} · |${n(q)} − ${n(Q)}| = ${n(0.5 * vu * Math.abs(q - Q))}$` : ''}. Son ${interv === 'subvencion' ? 'unidades de más que cuestan más de lo que valen para quien las compra' : 'intercambios que convenían a las dos partes y ya no se hacen'}: nadie se queda ese excedente.` : 'No hay pérdida de eficiencia: el mercado sigue en el equilibrio.' });
    }
    return { a, b, c, d, p, q, ec, ep, w, pMax, p0, interv, des, pasos };
  }

  const ejemplos = [
    { clave: 'equilibrio', nombre: 'Excedentes en el equilibrio: Qd = 100 − 2P y Qs = −20 + 2P', sc: { a: '100', b: '2', c: '-20', d: '2', interv: 'ninguna', v: '' } },
    { clave: 'impuesto', nombre: 'Un impuesto de 10 € por unidad', sc: { a: '100', b: '2', c: '-20', d: '2', interv: 'impuesto', v: '10' } },
    { clave: 'tabaco', nombre: 'Impuesto sobre el tabaco: demanda muy inelástica', sc: { a: '120', b: '1', c: '-40', d: '4', interv: 'impuesto', v: '5' } },
    { clave: 'subvencion', nombre: 'Subvención de 6 € a los paneles solares', sc: { a: '100', b: '2', c: '-20', d: '2', interv: 'subvencion', v: '6' } },
    { clave: 'alquiler', nombre: 'Precio máximo del alquiler', sc: { a: '100', b: '2', c: '-20', d: '2', interv: 'maximo', v: '24' } },
    { clave: 'minimo', nombre: 'Precio mínimo de garantía', sc: { a: '100', b: '2', c: '20', d: '2', interv: 'minimo', v: '25' } },
    { clave: 'iva', nombre: 'IVA del 21 % sobre el precio', sc: { a: '100', b: '2', c: '-20', d: '2', interv: 'advalorem', v: '21' } },
    { clave: 'puntos', nombre: 'Curvas por dos puntos y un impuesto de 5 €', sc: { forma: 'puntos', dp1: '10', dq1: '80', dp2: '20', dq2: '60', sp1: '10', sq1: '40', sp2: '20', sq2: '60', interv: 'impuesto', v: '5' } },
  ];

  return { resolver, ejemplos, INTERV };
})();
if (typeof module !== 'undefined') module.exports = Excedentes;
