/* =====================================================================
   VAN, TIR y payback (sin DOM): evaluación de una inversión con desembolso
   inicial A y flujos de caja Q₁ … Qₙ al final de cada año. Saca el valor
   actual neto a una tasa k, la tasa interna de rentabilidad (bisección
   sobre el VAN, con aviso si los flujos cambian de signo más de una vez),
   el plazo de recuperación simple y descontado (interpolado dentro del año)
   y el índice de rentabilidad, con la decisión. Formato en euros de
   economia/comun.js; interfaz en van-tir/app.js.
   Además: todas las TIR cuando los flujos cambian de signo más de una vez (se
   rastrea el VAN en una rejilla y se bisecciona cada cambio de signo), la TIR
   modificada (TIRM: los cobros se capitalizan a la tasa de reinversión y los
   pagos se descuentan a la de financiación) y, con un segundo proyecto B, la
   comparación con la tasa de cruce de Fisher (la TIR de las diferencias B − A).
     resolver(sc)  { a, flujos, k } → { van, tir, payback, paybackD, ir, filas, pasos }
   ===================================================================== */
const VanTir = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  const tp = (x) => `${f(100 * x, 5)} %`;

  const vanDe = (A, Q, k) => -A + Q.reduce((s, q, t) => s + q * (1 + k) ** -(t + 1), 0);
  // TIR: el k con VAN = 0, por bisección en el primer cambio de signo desde −99 %
  function tirDe(A, Q) {
    const g = (k) => vanDe(A, Q, k);
    let lo = -0.99, hi = lo, glo = g(lo);
    for (const x of [-0.9, -0.5, -0.2, 0, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 50, 100]) { if (g(x) * glo <= 0) { hi = x; break; } lo = x; glo = g(x); }
    if (hi === -0.99 || g(hi) * glo > 0) return null;
    for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (g(m) * glo > 0) { lo = m; glo = g(m); } else hi = m; }
    return (lo + hi) / 2;
  }
  // VAN de unos flujos F₀ … Fₙ (el año 0 incluido) y todas sus raíces en (−99 %, 10.000 %)
  const npv = (F, k) => F.reduce((s, q, t) => s + q * (1 + k) ** -t, 0);
  function raices(F) {
    const out = [], xs = []; for (let i = 0; i <= 1000; i++) xs.push(-0.99 + (i / 1000) * 1.99); for (let j = 1; j <= 1000; j++) xs.push(100 ** (j / 1000)); // de −99 % a 100 % con paso fino y luego hasta 10.000 %
    let g0 = npv(F, xs[0]);
    for (let i = 1; i < xs.length; i++) {
      const g1 = npv(F, xs[i]);
      if (g0 === 0) out.push(xs[i - 1]);
      else if (g0 * g1 < 0) { let lo = xs[i - 1], hi = xs[i], gl = g0; for (let j = 0; j < 200; j++) { const m = (lo + hi) / 2, gm = npv(F, m); if (gm * gl > 0) { lo = m; gl = gm; } else hi = m; } out.push((lo + hi) / 2); }
      g0 = g1;
    }
    return out.filter((r, i) => !i || Math.abs(r - out[i - 1]) > 1e-9);
  }
  // TIR modificada: cobros capitalizados a kr hasta el final, pagos (el desembolso incluido) descontados a kf
  function tirm(F, kf, kr) {
    const n = F.length - 1, vn = F.reduce((s, q, t) => s + (q < 0 ? -q * (1 + kf) ** -t : 0), 0), vf = F.reduce((s, q, t) => s + (q > 0 ? q * (1 + kr) ** (n - t) : 0), 0);
    return vn > 0 && vf > 0 ? (vf / vn) ** (1 / n) - 1 : null;
  }
  // primer año en que lo acumulado llega a 0, interpolando dentro del año
  function recupera(A, Q) {
    let ac = -A;
    for (let t = 0; t < Q.length; t++) { const nuevo = ac + Q[t]; if (nuevo >= 0 && Q[t] > 0) return t + -ac / Q[t]; ac = nuevo; }
    return null;
  }
  const anosMeses = (x) => { const a = Math.floor(x + 1e-9), m = (x - a) * 12; return `${a} año${a === 1 ? '' : 's'}${m > 0.05 ? ` y ${f(m, 3)} meses` : ''}`; };

  function resolver(sc) {
    const A = lee(sc, 'a', 'el desembolso inicial', { min: 0, minEx: true });
    const Q = K.lista(sc.flujos, 'los flujos de caja');
    if (!Q.length) throw new Error('Escribe los flujos de caja de cada año, separados por espacios');
    if (Q.length > 100) throw new Error('Como mucho 100 años de flujos');
    const k = lee(sc, 'k', 'la tasa de descuento', { min: -99, minEx: true }) / 100;
    const n = Q.length, van = vanDe(A, Q, k), tir = tirDe(A, Q);
    const filas = []; let ac = -A, acD = -A;
    Q.forEach((q, t) => { const fa = (1 + k) ** -(t + 1), qa = q * fa; ac += q; acD += qa; filas.push({ t: t + 1, q, fa, qa, ac, acD }); });
    const pb = recupera(A, Q), pbD = recupera(A, Q.map((q, t) => q * (1 + k) ** -(t + 1)));
    const ir = (van + A) / A;
    const cambios = [-A, ...Q].filter((x) => x !== 0).reduce((c, x, i, v) => c + (i && Math.sign(x) !== Math.sign(v[i - 1]) ? 1 : 0), 0);
    const F = [-A, ...Q], todas = raices(F);
    const kf = lee(sc, 'kf', 'la tasa de financiación', { min: -99, minEx: true, def: k * 100 }) / 100, kr = lee(sc, 'kr', 'la tasa de reinversión', { min: -99, minEx: true, def: k * 100 }) / 100;
    const mir = tirm(F, kf, kr);
    // segundo proyecto B (opcional) y tasa de cruce de Fisher
    let B = null;
    if (!K.vacio(sc.a2) || !K.vacio(sc.flujos2)) {
      const A2 = lee(sc, 'a2', 'el desembolso inicial de B', { min: 0, minEx: true }), Q2 = K.lista(sc.flujos2, 'los flujos de B');
      if (!Q2.length) throw new Error('Escribe los flujos de caja de B, separados por espacios');
      const F2 = [-A2, ...Q2], N = Math.max(F.length, F2.length), pad = (v) => Array.from({ length: N }, (_, t) => v[t] || 0), dif = pad(F2).map((x, t) => x - pad(F)[t]);
      B = { A: A2, Q: Q2, F: F2, van: npv(F2, k), tirs: raices(F2), tirm: tirm(F2, kf, kr), fisher: raices(dif), dif, ir: (npv(F2, k) + A2) / A2 };
    }
    const pasos = [];
    pasos.push({ t: 'Valor actual neto', html: `Se lleva cada flujo al momento inicial dividiendo por $(1 + k)^t$ y se resta el desembolso:<br>$VAN = −A + ∑ {Q_t}/{(1 + k)^t} = −${e(A)} ${Q.slice(0, 4).map((q, t) => `${q < 0 ? '−' : '+'} {${e(Math.abs(q))}}/{${f(1 + k, 6)}^{${t + 1}}}`).join(' ')}${n > 4 ? ' + …' : ''}$<br>$VAN = −${e(A)} + ${e(van + A)} = ${e(van)}$ €` });
    pasos.push({ t: 'Decisión por el VAN', html: van > 0 ? `VAN &gt; 0: la inversión devuelve lo invertido, paga el ${tp(k)} exigido y además genera ${e(van)} € de hoy. <b>Conviene hacerla.</b>` : van < 0 ? `VAN &lt; 0: con una rentabilidad exigida del ${tp(k)}, la inversión no llega a recuperar su coste. <b>No conviene.</b>` : 'VAN = 0: la inversión rinde justo la tasa exigida; es indiferente.' });
    pasos.push({ t: 'Tasa interna de rentabilidad', html: tir === null ? 'No hay ninguna tasa que haga el VAN igual a 0 (los flujos no llegan a recuperar el desembolso con ninguna tasa razonable).' : `La TIR es la tasa con $VAN = 0$: $−${e(A)} + ∑ Q_t/(1 + r)^t = 0$. Se resuelve por tanteo (bisección): <b>TIR = ${tp(tir)}</b>.<br>${tir > k ? `Como TIR &gt; k (${tp(tir)} &gt; ${tp(k)}), la inversión es rentable.` : tir < k ? `Como TIR &lt; k (${tp(tir)} &lt; ${tp(k)}), no es rentable a esa tasa.` : 'TIR = k: es indiferente.'}${cambios > 1 ? '<br>Ojo: los flujos cambian de signo más de una vez y puede haber varias TIR; en ese caso, decide por el VAN.' : ''}` });
    pasos.push({ t: 'Plazo de recuperación (payback)', html: `Simple: se suman los flujos hasta cubrir el desembolso. ${pb === null ? 'No se llega a recuperar.' : `Se recupera en <b>${f(pb, 4)} años</b> (${anosMeses(pb)}).`}<br>Descontado, con los flujos actualizados al ${tp(k)}: ${pbD === null ? 'no se llega a recuperar.' : `<b>${f(pbD, 4)} años</b> (${anosMeses(pbD)}).`}<br>El payback mide el riesgo y la liquidez, pero no tiene en cuenta lo que llega después de recuperar.` });
    pasos.push({ t: 'Índice de rentabilidad', html: `$IR = {∑ Q_t/(1 + k)^t}/A = ${e(van + A)}/${e(A)} = ${f(ir, 5)}$: cada euro invertido devuelve ${f(ir, 4)} € de hoy${ir > 1 ? ' (mayor que 1, rentable)' : ' (menor que 1, no rentable)'}.` });
    if (todas.length > 1) pasos.push({ t: 'Varias TIR', html: `Los flujos cambian de signo ${cambios} veces y el VAN corta el eje en <b>${todas.length} tasas</b>: ${todas.map((x) => tp(x)).join(', ')}. Con más de una TIR, ninguna sirve para decidir: usa el VAN (o la TIR modificada). La TIR que se muestra arriba es solo la primera que aparece.` });
    pasos.push({ t: 'TIR modificada (TIRM)', html: mir === null ? 'No se puede calcular la TIR modificada: hacen falta cobros y pagos.' : `Para evitar el problema de las TIR múltiples, los cobros se capitalizan hasta el final a la tasa de reinversión (${tp(kr)}) y los pagos se descuentan al inicio a la de financiación (${tp(kf)}): $TIRM = (VF_{cobros}/VA_{pagos})^{1/n} − 1 = <b>${tp(mir)}</b>$. Siempre es única.` });
    if (B) {
      const sg = B.van > van ? 'B' : B.van < van ? 'A' : null;
      pasos.push({ t: 'Comparar A y B', html: `VAN de A: ${e(van)} €; VAN de B: ${e(B.van)} €. ${sg ? `Con $k = ${tp(k)}$ conviene <b>${sg}</b> (mayor VAN).` : 'Empatan.'}<br>${B.fisher.length ? `La <b>tasa de cruce de Fisher</b> es ${B.fisher.map((x) => tp(x)).join(' y ')}: la TIR de las diferencias de flujos B − A. Con una tasa de descuento ${B.fisher.length === 1 ? `por debajo de ella manda uno de los proyectos y por encima, el otro` : 'a un lado y otro de esas tasas puede cambiar la preferencia'}; si los dos proyectos tienen TIR distintas, la TIR puede elegir mal frente al VAN.` : 'Las curvas del VAN de A y de B no se cruzan para tasas razonables: siempre es mejor el mismo proyecto.'}` });
    }
    return { A, Q, F, todas, kf, kr, mir, B, k, n, van, tir, pb, pbD, ir, filas, cambios, curva: (x) => vanDe(A, Q, x), pasos };
  }

  const ejemplos = [
    { clave: 'maquina', nombre: 'Nueva máquina: 10.000 € con flujos de 4 años', sc: { a: '10000', flujos: '3000 4000 5000 2000', k: '8' } },
    { clave: 'constantes', nombre: 'Flujos constantes: 50.000 € y 15.000 € al año', sc: { a: '50000', flujos: '15000 15000 15000 15000 15000', k: '10' } },
    { clave: 'no-rentable', nombre: 'Una inversión que no compensa', sc: { a: '20000', flujos: '4500 4500 4500 4500 4500', k: '7' } },
    { clave: 'residual', nombre: 'Local con valor residual al final', sc: { a: '120000', flujos: '18000 20000 22000 22000 22000 22000 70000', k: '6' } },
    { clave: 'tir-multiples', nombre: 'Dos TIR: flujos que cambian de signo dos veces', sc: { a: '1000', flujos: '4000 -3200', k: '10', kf: '', kr: '', a2: '', flujos2: '' } },
    { clave: 'comparar', nombre: 'Comparar dos proyectos y la tasa de Fisher', sc: { a: '1000', flujos: '700 500 100', k: '8', kf: '', kr: '', a2: '1000', flujos2: '100 400 1000' } },
    { clave: 'tienda', nombre: 'Abrir una tienda: pérdidas el primer año', sc: { a: '30000', flujos: '-5000 10000 15000 15000 15000', k: '9' } },
  ];

  // modo práctica: datos redondos al azar
  const AZ = K.az, azar = AZ.desde(ejemplos, () => {
    const a = AZ.toma([10000, 20000, 50000, 100000]), n = AZ.toma([3, 4, 5]), fl = Array.from({ length: n }, () => Math.round((a * AZ.toma([0.3, 0.35, 0.4])) / 100) * 100);
    return { a: String(a), flujos: fl.join(' '), k: String(AZ.toma([5, 8, 10, 12])) };
  }, (sc) => !sc.a2 && !sc.kf && !/-/.test(sc.flujos), (sc) => resolver(sc));
  const enunciado = (sc) => `Un proyecto exige invertir ${sc.a} € y genera los flujos de caja anuales ${sc.flujos.split(' ').join(', ')} €. Con una tasa de descuento del ${sc.k} %, calcula el VAN, la TIR, la TIR modificada, el payback simple y el descontado y el índice de rentabilidad.`;

  return { azar, enunciado, resolver, ejemplos, vanDe, tirDe, raices, tirm, npv };
})();
if (typeof module !== 'undefined') module.exports = VanTir;
