/* =====================================================================
   VAN, TIR y payback (sin DOM): evaluación de una inversión con desembolso
   inicial A y flujos de caja Q₁ … Qₙ al final de cada año. Saca el valor
   actual neto a una tasa k, la tasa interna de rentabilidad (bisección
   sobre el VAN, con aviso si los flujos cambian de signo más de una vez),
   el plazo de recuperación simple y descontado (interpolado dentro del año)
   y el índice de rentabilidad, con la decisión. Formato en euros de
   economia/comun.js; interfaz en van-tir/app.js.
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
    const pasos = [];
    pasos.push({ t: 'Valor actual neto', html: `Se lleva cada flujo al momento inicial dividiendo por $(1 + k)^t$ y se resta el desembolso:<br>$VAN = −A + ∑ {Q_t}/{(1 + k)^t} = −${e(A)} ${Q.slice(0, 4).map((q, t) => `${q < 0 ? '−' : '+'} {${e(Math.abs(q))}}/{${f(1 + k, 6)}^{${t + 1}}}`).join(' ')}${n > 4 ? ' + …' : ''}$<br>$VAN = −${e(A)} + ${e(van + A)} = ${e(van)}$ €` });
    pasos.push({ t: 'Decisión por el VAN', html: van > 0 ? `VAN &gt; 0: la inversión devuelve lo invertido, paga el ${tp(k)} exigido y además genera ${e(van)} € de hoy. <b>Conviene hacerla.</b>` : van < 0 ? `VAN &lt; 0: con una rentabilidad exigida del ${tp(k)}, la inversión no llega a recuperar su coste. <b>No conviene.</b>` : 'VAN = 0: la inversión rinde justo la tasa exigida; es indiferente.' });
    pasos.push({ t: 'Tasa interna de rentabilidad', html: tir === null ? 'No hay ninguna tasa que haga el VAN igual a 0 (los flujos no llegan a recuperar el desembolso con ninguna tasa razonable).' : `La TIR es la tasa con $VAN = 0$: $−${e(A)} + ∑ Q_t/(1 + r)^t = 0$. Se resuelve por tanteo (bisección): <b>TIR = ${tp(tir)}</b>.<br>${tir > k ? `Como TIR &gt; k (${tp(tir)} &gt; ${tp(k)}), la inversión es rentable.` : tir < k ? `Como TIR &lt; k (${tp(tir)} &lt; ${tp(k)}), no es rentable a esa tasa.` : 'TIR = k: es indiferente.'}${cambios > 1 ? '<br>Ojo: los flujos cambian de signo más de una vez y puede haber varias TIR; en ese caso, decide por el VAN.' : ''}` });
    pasos.push({ t: 'Plazo de recuperación (payback)', html: `Simple: se suman los flujos hasta cubrir el desembolso. ${pb === null ? 'No se llega a recuperar.' : `Se recupera en <b>${f(pb, 4)} años</b> (${anosMeses(pb)}).`}<br>Descontado, con los flujos actualizados al ${tp(k)}: ${pbD === null ? 'no se llega a recuperar.' : `<b>${f(pbD, 4)} años</b> (${anosMeses(pbD)}).`}<br>El payback mide el riesgo y la liquidez, pero no tiene en cuenta lo que llega después de recuperar.` });
    pasos.push({ t: 'Índice de rentabilidad', html: `$IR = {∑ Q_t/(1 + k)^t}/A = ${e(van + A)}/${e(A)} = ${f(ir, 5)}$: cada euro invertido devuelve ${f(ir, 4)} € de hoy${ir > 1 ? ' (mayor que 1, rentable)' : ' (menor que 1, no rentable)'}.` });
    return { A, Q, k, n, van, tir, pb, pbD, ir, filas, cambios, curva: (x) => vanDe(A, Q, x), pasos };
  }

  const ejemplos = [
    { clave: 'maquina', nombre: 'Nueva máquina: 10.000 € con flujos de 4 años', sc: { a: '10000', flujos: '3000 4000 5000 2000', k: '8' } },
    { clave: 'constantes', nombre: 'Flujos constantes: 50.000 € y 15.000 € al año', sc: { a: '50000', flujos: '15000 15000 15000 15000 15000', k: '10' } },
    { clave: 'no-rentable', nombre: 'Una inversión que no compensa', sc: { a: '20000', flujos: '4500 4500 4500 4500 4500', k: '7' } },
    { clave: 'residual', nombre: 'Local con valor residual al final', sc: { a: '120000', flujos: '18000 20000 22000 22000 22000 22000 70000', k: '6' } },
    { clave: 'tienda', nombre: 'Abrir una tienda: pérdidas el primer año', sc: { a: '30000', flujos: '-5000 10000 15000 15000 15000', k: '9' } },
  ];

  return { resolver, ejemplos, vanDe, tirDe };
})();
if (typeof module !== 'undefined') module.exports = VanTir;
