/* =====================================================================
   Préstamos y amortización (sin DOM): cuadro de amortización por el sistema
   francés (cuota constante), por el de cuota de amortización constante
   (alemán o lineal) y por el americano (solo intereses y todo el capital al
   final), con pagos anuales, semestrales, trimestrales o mensuales al tipo
   TIN/m. Saca la cuota, los intereses totales, lo pagado y la TAE, también
   con una comisión de apertura (la tasa que iguala lo recibido con las
   cuotas, por bisección). Formato en euros de economia/comun.js; interfaz
   en prestamos/app.js.
     resolver(sc)  { sistema, c, i, anos, m, comision } → { cuota, filas, intereses, tae, pasos }
   ===================================================================== */
const Prestamos = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const SISTEMAS = { frances: 'Francés (cuota constante)', lineal: 'Cuota de amortización constante', americano: 'Americano (todo al final)' };
  const PERIODOS = { 1: ['anual', 'años', 'año'], 2: ['semestral', 'semestres', 'semestre'], 4: ['trimestral', 'trimestres', 'trimestre'], 12: ['mensual', 'meses', 'mes'] };
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  const tp = (x) => `${f(100 * x, 6)} %`;

  // tasa r por periodo con  neto = ∑ cuotaₖ (1 + r)⁻ᵏ  (bisección: el valor actual baja al subir r)
  function tasa(neto, cuotas) {
    const va = (r) => cuotas.reduce((s, c, k) => s + c * (1 + r) ** -(k + 1), 0);
    let lo = 0, hi = 1;
    while (va(hi) > neto && hi < 1e6) hi *= 2;
    for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2; if (va(mid) > neto) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  function resolver(sc) {
    const sis = SISTEMAS[sc.sistema] ? sc.sistema : 'frances';
    const m = PERIODOS[sc.m] ? +sc.m : 12, [per, pers, uno] = PERIODOS[m];
    const C = lee(sc, 'c', 'el capital prestado', { min: 0, minEx: true });
    const tin = lee(sc, 'i', 'el TIN', { min: 0 }) / 100;
    const anos = lee(sc, 'anos', 'el plazo', { min: 0, minEx: true });
    const n = Math.round(anos * m);
    if (Math.abs(n - anos * m) > 1e-6) throw new Error(`El plazo tiene que ser un número entero de ${pers}: ${f(anos)} años no lo es con pagos ${per}es`);
    if (n < 1) throw new Error(`El plazo tiene que ser al menos de una cuota (con pagos ${per}es, ${f(1 / m)} años)`);
    if (n > 600) throw new Error('Como mucho 600 cuotas');
    const com = lee(sc, 'comision', 'la comisión de apertura', { min: 0, max: 50, def: 0 }) / 100;
    const i = tin / m;
    const pasos = [{ t: 'Tipo de cada periodo', html: `Pagos ${per}es: $n = ${f(anos)} · ${m} = ${n}$ cuotas, al tipo $i = TIN/${m} = ${f(tin, 6)}/${m} = ${f(i, 8)}$ (${tp(i)} por ${uno}).` }];
    const filas = [];
    let pend = C, cuota = null;
    if (sis === 'frances') {
      cuota = i === 0 ? C / n : (C * i) / (1 - (1 + i) ** -n);
      pasos.push({ t: 'Cuota constante', html: i === 0 ? `Sin interés, $a = C/n = ${e(C)}/${n} = ${e(cuota)}$ €` : `La cuota hace que el valor actual de las $n$ cuotas sea el capital: $C = a · {1 − (1 + i)^{−n}}/i$, así que<br>$a = {C · i}/{1 − (1 + i)^{−n}} = {${e(C)} · ${f(i, 8)}}/{1 − (1 + ${f(i, 8)})^{−${n}}} = ${e(cuota)}$ €` });
      pasos.push({ t: 'Cada fila del cuadro', html: `Intereses del periodo sobre lo que se debe: $I_k = C_{k−1} · i$; lo que se amortiza es el resto de la cuota: $A_k = a − I_k$; y se debe $C_k = C_{k−1} − A_k$. Al principio casi toda la cuota son intereses, y al final casi todo es capital.` });
    } else if (sis === 'lineal') {
      pasos.push({ t: 'Amortización constante', html: `Cada periodo se devuelve la misma parte del capital: $A = C/n = ${e(C)}/${n} = ${e(C / n)}$ €. Los intereses, $I_k = C_{k−1} · i$, bajan con la deuda, y la cuota $a_k = A + I_k$ va bajando: la primera es ${e(C / n + C * i)} € y la última ${e(C / n + (C / n) * i)} €.` });
    } else {
      pasos.push({ t: 'Sistema americano', html: `Cada periodo solo se pagan los intereses, $I = C · i = ${e(C)} · ${f(i, 8)} = ${e(C * i)}$ €, y el capital entero se devuelve con la última cuota: $${e(C * i)} + ${e(C)} = ${e(C * (1 + i))}$ €.` });
    }
    for (let k = 1; k <= n; k++) {
      const I = pend * i, A = sis === 'frances' ? cuota - I : sis === 'lineal' ? C / n : k === n ? C : 0;
      pend = k === n ? 0 : pend - A;
      filas.push({ k, cuota: A + I, I, A, amort: C - pend, pend: Math.abs(pend) < 1e-7 ? 0 : pend });
    }
    const intereses = filas.reduce((s, r) => s + r.I, 0), total = intereses + C;
    pasos.push({ t: 'Lo que cuesta el préstamo', html: `Se pagan en total ${e(total)} €: el capital (${e(C)} €) más <b>${e(intereses)} €</b> de intereses, un ${f((100 * intereses) / C, 4)} % de lo prestado.` });
    const neto = C * (1 - com), r = com > 0 ? tasa(neto, filas.map((x) => x.cuota)) : i, tae = (1 + r) ** m - 1;
    pasos.push({ t: 'TAE', html: com > 0
      ? `Con una comisión de apertura del ${f(100 * com)} %, se reciben $${e(C)} · (1 − ${f(com, 6)}) = ${e(neto)}$ € pero se paga lo mismo. La tasa por periodo $r$ que cumple $${e(neto)} = ∑ a_k (1 + r)^{−k}$ es $r = ${f(r, 8)}$, y $TAE = (1 + r)^{${m}} − 1 = ${tp(tae)}$, más que la TAE sin comisión (${tp((1 + i) ** m - 1)}).`
      : `$TAE = (1 + i)^{${m}} − 1 = (1 + ${f(i, 8)})^{${m}} − 1 = ${tp(tae)}$${m > 1 ? ', algo más que el TIN porque los intereses se pagan antes de acabar el año' : ''}.` });
    return { sis, m, per, pers, uno, C, tin, i, n, cuota, filas, intereses, total, com, tae, pasos };
  }

  const ejemplos = [
    { clave: 'hipoteca', nombre: 'Hipoteca de 150.000 € al 3 % a 25 años', sc: { sistema: 'frances', c: '150000', i: '3', anos: '25', m: '12', comision: '' } },
    { clave: 'coche', nombre: 'Préstamo para el coche con comisión de apertura', sc: { sistema: 'frances', c: '15000', i: '6', anos: '5', m: '12', comision: '1' } },
    { clave: 'frances', nombre: 'Francés anual: 10.000 € al 8 % en 4 años', sc: { sistema: 'frances', c: '10000', i: '8', anos: '4', m: '1', comision: '' } },
    { clave: 'lineal', nombre: 'Cuota de amortización constante: 10.000 € al 8 %', sc: { sistema: 'lineal', c: '10000', i: '8', anos: '4', m: '1', comision: '' } },
    { clave: 'americano', nombre: 'Americano: 10.000 € al 8 % en 4 años', sc: { sistema: 'americano', c: '10000', i: '8', anos: '4', m: '1', comision: '' } },
  ];

  return { resolver, ejemplos, SISTEMAS, PERIODOS, tasa };
})();
if (typeof module !== 'undefined') module.exports = Prestamos;
