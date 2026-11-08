/* =====================================================================
   Préstamos y amortización (sin DOM): cuadro de amortización por el sistema
   francés (cuota constante), por el de cuota de amortización constante
   (alemán o lineal) y por el americano (solo intereses y todo el capital al
   final), con pagos anuales, semestrales, trimestrales o mensuales al tipo
   TIN/m. Saca la cuota, los intereses totales, lo pagado y la TAE, también
   con una comisión de apertura (la tasa que iguala lo recibido con las
   cuotas, por bisección). Formato en euros de economia/comun.js; interfaz
   en prestamos/app.js.
     resolver(sc)  { sistema, c, i, anos, m, comision, car, ext, pe, opcion } → { cuota, filas, intereses, tae, pasos }
   Periodo de carencia de capital (car cuotas solo de intereses al principio) y una
   amortización anticipada de ext € tras la cuota pe, con dos opciones: reducir la
   cuota (mismo plazo) o reducir el plazo (misma cuota). Solo en francés y lineal;
   se compara con el préstamo sin amortizar antes (intereses ahorrados).
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
    const car = lee(sc, 'car', 'las cuotas de carencia', { min: 0, entero: true, def: 0 }), ext = lee(sc, 'ext', 'la amortización anticipada', { min: 0, def: 0 }), pe = ext > 0 ? lee(sc, 'pe', 'la cuota tras la que se amortiza', { min: 1, entero: true }) : 0;
    const opcion = sc.opcion === 'plazo' ? 'plazo' : 'cuota';
    if (car >= n) throw new Error(`La carencia (${car}) tiene que ser menor que el número de cuotas (${n}): si no, no se amortiza nada`);
    if (sis === 'americano' && (car > 0 || ext > 0)) throw new Error('La carencia y la amortización anticipada no tienen sentido en el sistema americano (ya solo se pagan intereses hasta el final)');
    if (ext > 0 && pe >= n) throw new Error(`La amortización anticipada tiene que hacerse antes de la última cuota (hay ${n}): elige una cuota anterior a la ${n}`);
    if (ext > 0 && ext >= C) throw new Error('La amortización anticipada tiene que ser menor que el capital prestado');
    const nn = n - car;
    const pasos = [{ t: 'Tipo de cada periodo', html: `Pagos ${per}es: $n = ${f(anos)} · ${m} = ${n}$ cuotas, al tipo $i = TIN/${m} = ${f(tin, 6)}/${m} = ${f(i, 8)}$ (${tp(i)} por ${uno}).` }];
    let pend = C, cuota = null;
    if (sis === 'frances') {
      cuota = i === 0 ? C / nn : (C * i) / (1 - (1 + i) ** -nn);
      pasos.push({ t: 'Cuota constante', html: i === 0 ? `Sin interés, $a = C/n = ${e(C)}/${nn} = ${e(cuota)}$ €` : `La cuota hace que el valor actual de las $n$ cuotas${car ? ' que amortizan' : ''} sea el capital: $C = a · {1 − (1 + i)^{−n}}/i$, así que<br>$a = {C · i}/{1 − (1 + i)^{−n}} = {${e(C)} · ${f(i, 8)}}/{1 − (1 + ${f(i, 8)})^{−${nn}}} = ${e(cuota)}$ €` });
      pasos.push({ t: 'Cada fila del cuadro', html: `Intereses del periodo sobre lo que se debe: $I_k = C_{k−1} · i$; lo que se amortiza es el resto de la cuota: $A_k = a − I_k$; y se debe $C_k = C_{k−1} − A_k$. Al principio casi toda la cuota son intereses, y al final casi todo es capital.` });
    } else if (sis === 'lineal') {
      pasos.push({ t: 'Amortización constante', html: `Cada periodo se devuelve la misma parte del capital: $A = C/n = ${e(C)}/${nn} = ${e(C / nn)}$ €. Los intereses, $I_k = C_{k−1} · i$, bajan con la deuda, y la cuota $a_k = A + I_k$ va bajando: la primera es ${e(C / nn + C * i)} € y la última ${e(C / nn + (C / nn) * i)} €.` });
    } else {
      pasos.push({ t: 'Sistema americano', html: `Cada periodo solo se pagan los intereses, $I = C · i = ${e(C)} · ${f(i, 8)} = ${e(C * i)}$ €, y el capital entero se devuelve con la última cuota: $${e(C * i)} + ${e(C)} = ${e(C * (1 + i))}$ €.` });
    }
    // cuadro: carencia (solo intereses), cuotas ordinarias y, tras la cuota pe, una amortización anticipada
    const cuadro = (extra) => {
      const out = []; let pd = C, cu = cuota, al = C / nn;
      for (let k = 1; k <= n && pd > 1e-7; k++) {
        const I = pd * i; let A;
        if (sis === 'americano') A = k === n ? C : 0;
        else if (k <= car) A = 0;
        else { A = sis === 'frances' ? cu - I : al; if (A > pd - 1e-9) A = pd; }
        pd = k === n ? 0 : pd - A;
        let x = 0;
        if (extra && k === pe && pd > 1e-7) {
          x = Math.min(extra, pd); pd -= x;
          const R = n - Math.max(k, car);
          if (opcion === 'cuota' && pd > 1e-7 && R > 0) { cu = i === 0 ? pd / R : (pd * i) / (1 - (1 + i) ** -R); al = pd / R; }
        }
        out.push({ k, cuota: A + I, I, A, x, amort: C - pd, pend: Math.abs(pd) < 1e-7 ? 0 : pd });
      }
      return out;
    };
    const filas = cuadro(ext), base = ext > 0 || car > 0 ? cuadro(0) : filas;
    const intereses = filas.reduce((s, r) => s + r.I, 0), total = intereses + C, interesesBase = base.reduce((s, r) => s + r.I, 0);
    if (car > 0) pasos.push({ t: 'Carencia de capital', html: `Durante las primeras ${car} cuota${car === 1 ? '' : 's'} solo se pagan intereses, $I = C · i = ${e(C * i)}$ € cada ${uno}, y la deuda sigue siendo ${e(C)} €. El capital se amortiza en las ${nn} cuotas restantes, y por eso la cuota es mayor que sin carencia.` });
    if (ext > 0) {
      const f0 = filas[pe - 1], cierra = filas[filas.length - 1];
      pasos.push({ t: `Amortización anticipada de ${e(ext)} €`, html: `Tras pagar la cuota ${pe} se devuelven ${e(ext)} € de golpe y la deuda pasa de ${e(f0.pend + f0.x)} € a ${e(f0.pend)} €. ${opcion === 'cuota' ? `Se <b>reduce la cuota</b> y se mantiene el plazo: las ${n - pe} cuotas restantes se recalculan sobre la deuda nueva.` : `Se <b>reduce el plazo</b> y se mantiene la cuota: el préstamo termina en la cuota ${filas.length} en vez de la ${n} (${n - filas.length} cuota${n - filas.length === 1 ? '' : 's'} menos).`}<br>Intereses totales: ${e(intereses)} € frente a ${e(interesesBase)} € sin amortizar antes, un ahorro de <b>${e(interesesBase - intereses)} €</b>.` });
    }
    pasos.push({ t: 'Lo que cuesta el préstamo', html: `Se pagan en total ${e(total)} €: el capital (${e(C)} €) más <b>${e(intereses)} €</b> de intereses, un ${f((100 * intereses) / C, 4)} % de lo prestado.` });
    const neto = C * (1 - com), r = com > 0 ? tasa(neto, filas.map((x) => x.cuota + x.x)) : i, tae = (1 + r) ** m - 1;
    pasos.push({ t: 'TAE', html: com > 0
      ? `Con una comisión de apertura del ${f(100 * com)} %, se reciben $${e(C)} · (1 − ${f(com, 6)}) = ${e(neto)}$ € pero se paga lo mismo. La tasa por periodo $r$ que cumple $${e(neto)} = ∑ a_k (1 + r)^{−k}$ es $r = ${f(r, 8)}$, y $TAE = (1 + r)^{${m}} − 1 = ${tp(tae)}$, más que la TAE sin comisión (${tp((1 + i) ** m - 1)}).`
      : `$TAE = (1 + i)^{${m}} − 1 = (1 + ${f(i, 8)})^{${m}} − 1 = ${tp(tae)}$${m > 1 ? ', algo más que el TIN porque los intereses se pagan antes de acabar el año' : ''}.` });
    return { sis, m, per, pers, uno, C, tin, i, n, nn, car, ext, pe, opcion, cuota, filas, base, intereses, interesesBase, ahorro: interesesBase - intereses, total, com, tae, pasos };
  }

  const ejemplos = [
    { clave: 'hipoteca', nombre: 'Hipoteca de 150.000 € al 3 % a 25 años', sc: { sistema: 'frances', c: '150000', i: '3', anos: '25', m: '12', comision: '' } },
    { clave: 'amortiza-cuota', nombre: 'Amortizo 20.000 € tras 5 años y reduzco la cuota', sc: { sistema: 'frances', c: '150000', i: '3', anos: '25', m: '12', comision: '', car: '', ext: '20000', pe: '60', opcion: 'cuota' } },
    { clave: 'amortiza-plazo', nombre: 'Amortizo 20.000 € tras 5 años y reduzco el plazo', sc: { sistema: 'frances', c: '150000', i: '3', anos: '25', m: '12', comision: '', car: '', ext: '20000', pe: '60', opcion: 'plazo' } },
    { clave: 'carencia', nombre: 'Un año de carencia de capital', sc: { sistema: 'frances', c: '150000', i: '3', anos: '25', m: '12', comision: '', car: '12', ext: '', pe: '', opcion: 'cuota' } },
    { clave: 'coche', nombre: 'Préstamo para el coche con comisión de apertura', sc: { sistema: 'frances', c: '15000', i: '6', anos: '5', m: '12', comision: '1' } },
    { clave: 'frances', nombre: 'Francés anual: 10.000 € al 8 % en 4 años', sc: { sistema: 'frances', c: '10000', i: '8', anos: '4', m: '1', comision: '' } },
    { clave: 'lineal', nombre: 'Cuota de amortización constante: 10.000 € al 8 %', sc: { sistema: 'lineal', c: '10000', i: '8', anos: '4', m: '1', comision: '' } },
    { clave: 'americano', nombre: 'Americano: 10.000 € al 8 % en 4 años', sc: { sistema: 'americano', c: '10000', i: '8', anos: '4', m: '1', comision: '' } },
  ];

  return { resolver, ejemplos, SISTEMAS, PERIODOS, tasa };
})();
if (typeof module !== 'undefined') module.exports = Prestamos;
