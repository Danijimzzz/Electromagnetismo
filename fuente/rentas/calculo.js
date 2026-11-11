/* =====================================================================
   Rentas y anualidades (sin DOM): rentas constantes, pospagables o
   prepagables, temporales o perpetuas, inmediatas o diferidas, con
   términos anuales, semestrales, trimestrales o mensuales. Calcula el valor
   actual, el valor final, el término o el número de términos, con el tipo
   de cada periodo sacado del tipo efectivo anual, iₘ = (1 + i)^(1/m) − 1, y
   los factores aₙ¬ᵢ = (1 − (1 + i)⁻ⁿ)/i y sₙ¬ᵢ = ((1 + i)ⁿ − 1)/i.
   Formato en euros de economia/comun.js; interfaz en rentas/app.js.
   También rentas variables (solo en valor actual y valor final, temporales): en progresión
   aritmética (cada término suma h al anterior) o geométrica (cada término se multiplica por 1 + g).
     resolver(sc)  { modo, pago, duracion, variacion, h, g, c, va, vf, n, i, m, d } → { va, vf, c, n, ip, filas, pasos }
   ===================================================================== */
const Rentas = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const MODOS = { va: 'Valor actual', vf: 'Valor final', termino: 'Término (cuota)', n: 'Número de términos' };
  const VARIACIONES = { cte: 'Constante', arit: 'Progresión aritmética (suma h cada término)', geom: 'Progresión geométrica (crece g % cada término)' };
  const PERIODOS = { 1: ['anual', 'años'], 2: ['semestral', 'semestres'], 4: ['trimestral', 'trimestres'], 12: ['mensual', 'meses'] };
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  const tp = (x) => `${f(100 * x, 6)} %`;

  function resolver(sc) {
    const modo = MODOS[sc.modo] ? sc.modo : 'va', pre = sc.pago === 'pre';
    const vari = (modo === 'va' || modo === 'vf') && VARIACIONES[sc.variacion] ? sc.variacion : 'cte', perpetua = vari === 'cte' && sc.duracion === 'perpetua' && (modo === 'va' || modo === 'termino');
    const m = PERIODOS[sc.m] ? +sc.m : 1, [per, pers] = PERIODOS[m];
    const ia = lee(sc, 'i', 'el tipo de interés', { min: 0, minEx: true }) / 100;
    const ip = (1 + ia) ** (1 / m) - 1;
    const d = lee(sc, 'd', 'el diferimiento', { min: 0, entero: true, def: 0 });
    const v = (k) => (1 + ip) ** -k;
    const pasos = [];
    pasos.push({ t: 'Tipo de cada periodo', html: m === 1 ? `Términos anuales: $i = ${tp(ia)}$.` : `Términos ${per}es con un tipo efectivo anual del ${tp(ia)}: $i_{${m}} = (1 + i)^{1/${m}} − 1 = (1 + ${f(ia, 6)})^{1/${m}} − 1 = ${f(ip, 6)}$ (${tp(ip)} ${per === 'mensual' ? 'mensual' : 'por periodo'}).` });
    const an = (n) => (1 - v(n)) / ip, sn = (n) => ((1 + ip) ** n - 1) / ip;
    const fp = pre ? 1 + ip : 1, fd = v(d);
    const nomPago = pre ? 'prepagable (los términos se pagan al principio de cada periodo)' : 'pospagable (los términos se pagan al final de cada periodo)';
    let c, n = null, va, vf = null, term = null;
    if (modo === 'n') {
      c = lee(sc, 'c', 'el término', { min: 0, minEx: true }); va = lee(sc, 'va', 'el valor actual', { min: 0, minEx: true });
      const x = 1 - (va * ip) / (c * fp * fd);
      if (x <= 0) throw new Error('Con ese término no se llega nunca a pagar ese valor actual: el término no cubre ni los intereses');
      n = -Math.log(x) / Math.log(1 + ip);
      pasos.push({ t: 'Número de términos', html: `De $V_0 = C ${pre ? '(1 + i) ' : ''}${d ? `(1 + i)^{−${d}} ` : ''}{1 − (1 + i)^{−n}}/i$ se despeja $n = {−ln(1 − V_0 · i/(C${pre ? '(1 + i)' : ''}${d ? `(1 + i)^{−${d}}` : ''}))}/{ln(1 + i)} = {−ln(${f(x, 6)})}/{ln(1 + ${f(ip, 6)})} = ${f(n, 6)}$ ${pers}` });
      pasos.push({ t: 'Lectura', html: `Hacen falta ${Math.ceil(n - 1e-9)} términos: ${Math.floor(n + 1e-9)} completos de ${e(c)} € y ${Number.isInteger(+n.toFixed(9)) ? 'ninguno más' : 'un último pago menor (o se ajusta la cuota)'}.` });
    } else if (perpetua) {
      if (modo === 'va') { c = lee(sc, 'c', 'el término', { min: 0, minEx: true }); va = (c * fp * fd) / ip; }
      else { va = lee(sc, 'va', 'el valor actual', { min: 0, minEx: true }); c = (va * ip) / (fp * fd); }
      pasos.push({ t: 'Renta perpetua', html: `Cuando n → ∞, $(1 + i)^{−n} → 0$ y $a_{∞¬i} = 1/i$. Renta ${nomPago}${d ? `, diferida ${d} ${pers}` : ''}:<br>$V_0 = C${pre ? ' (1 + i)' : ''}/i${d ? ` · (1 + i)^{−${d}}` : ''}$` });
      pasos.push(modo === 'va' ? { t: 'Valor actual', html: `$V_0 = ${e(c)}${pre ? ` · ${f(1 + ip, 8)}` : ''}/${f(ip, 6)}${d ? ` · ${f(fd, 8)}` : ''} = ${e(va)}$ €` } : { t: 'Término', html: `$C = V_0 · i${pre ? '/(1 + i)' : ''}${d ? ` · (1 + i)^{${d}}` : ''} = ${e(va)} · ${f(ip, 6)}${pre ? `/${f(1 + ip, 8)}` : ''}${d ? ` · ${f(1 / fd, 8)}` : ''} = ${e(c)}$ €` });
    } else {
      n = lee(sc, 'n', 'el número de términos', { min: 1, entero: true });
      if (n > 1200) throw new Error('Como mucho 1.200 términos (si son muchos, usa la renta perpetua)');
      const a = an(n), s = sn(n);
      pasos.push({ t: 'Factores de la renta', html: `Renta ${nomPago}, de ${n} términos${d ? `, diferida ${d} ${pers}` : ''}.<br>$a_{${n}¬i} = {1 − (1 + i)^{−n}}/i = {1 − (1 + ${f(ip, 6)})^{−${n}}}/{${f(ip, 6)}} = ${f(a, 8)}$<br>$s_{${n}¬i} = {(1 + i)^n − 1}/i = ${f(s, 8)}$` });
      const forma = (x) => `${x}${pre ? ' (1 + i)' : ''}`;
      if (modo === 'va' || modo === 'vf') c = lee(sc, 'c', 'el término', { min: 0, minEx: true });
      else if (sc.conocido === 'vf') { vf = lee(sc, 'vf', 'el valor final', { min: 0, minEx: true }); c = vf / (s * fp); }
      else { va = lee(sc, 'va', 'el valor actual', { min: 0, minEx: true }); c = va / (a * fp * fd); }
      if (vari !== 'cte') {
        // renta variable: el primer término es C; V₀ (pospagable) con las fórmulas cerradas y Vₙ llevándolo al final de los pagos
        const h = vari === 'arit' ? lee(sc, 'h', 'el incremento h') : 0, g = vari === 'geom' ? lee(sc, 'g', 'la variación g', { min: -99.99 }) / 100 : 0, q = 1 + g, vn = v(n);
        let v0;
        if (vari === 'arit') v0 = (c + h / ip) * a - (n * h * vn) / ip;
        else { const r = q * v(1); v0 = Math.abs(1 - r) < 1e-12 ? c * n * v(1) : c * v(1) * (1 - r ** n) / (1 - r); }
        term = (k) => (vari === 'arit' ? c + (k - 1) * h : c * q ** (k - 1));
        if (term(n) < 0 || (vari === 'arit' && c + (n - 1) * h < 0)) throw new Error('Con ese incremento algún término saldría negativo: reduce h o el número de términos');
        va = v0 * fp * fd; vf = v0 * fp * (1 + ip) ** n;
        const ult = term(n);
        pasos.push({ t: vari === 'arit' ? 'Progresión aritmética' : 'Progresión geométrica', html: vari === 'arit'
          ? `Los términos son $C, C + h, …, C + (n − 1)h$: de ${e(c)} € a ${e(ult)} € (la suma ${e(h)} € cada ${per === 'mensual' ? 'mes' : 'periodo'}).<br>$V_0 = (C + h/i) · a_{n¬i} − {n · h · (1 + i)^{−n}}/i = (${e(c)} + ${e(h)}/${f(ip, 6)}) · ${f(a, 8)} − {${n} · ${e(h)} · ${f(vn, 8)}}/{${f(ip, 6)}} = ${e(v0)}$ €`
          : `Los términos son $C, C·q, …, C·q^{n−1}$ con $q = 1 + g = ${f(q, 6)}$: de ${e(c)} € a ${e(ult)} €.<br>${Math.abs(1 - q * v(1)) < 1e-12 ? `Como $q = 1 + i$, cada término vale lo mismo hoy y $V_0 = n · C/(1 + i) = ${e(v0)}$ €.` : `$V_0 = C · {1 − (q/(1 + i))^n}/{1 + i − q} = ${e(c)} · {1 − (${f(q * v(1), 8)})^{${n}}}/{${f(1 + ip - q, 8)}} = ${e(v0)}$ €`}` });
        if (pre || d) pasos.push({ t: 'Prepagable y diferida', html: `${pre ? `Prepagable: se multiplica por $(1 + i) = ${f(1 + ip, 8)}$. ` : ''}${d ? `Diferida ${d} ${pers}: se multiplica por $(1 + i)^{−${d}} = ${f(fd, 8)}$.` : ''} Resultado: $V_0 = ${e(va)}$ €.` });
        pasos.push({ t: 'Valor final', html: `Llevado al final de los pagos: $V_n = ${e(v0 * fp)} · (1 + i)^{${n}} = ${e(vf)}$ €` });
        pasos.push({ t: 'Intereses', html: `Se pagan ${e(Array.from({ length: n }, (_, k) => term(k + 1)).reduce((x, y) => x + y, 0))} € en total en ${n} términos.` });
      } else { va = va ?? c * a * fp * fd; vf = vf ?? c * s * fp; }
      if (vari !== 'cte') { /* ya calculado */ } else if (modo === 'va') pasos.push({ t: 'Valor actual', html: `$V_0 = C · ${forma(`a_{${n}¬i}`)}${d ? ` · (1 + i)^{−${d}}` : ''} = ${e(c)} · ${f(a, 8)}${pre ? ` · ${f(1 + ip, 8)}` : ''}${d ? ` · ${f(fd, 8)}` : ''} = ${e(va)}$ €` });
      if (vari === 'cte' && modo === 'vf') pasos.push({ t: 'Valor final', html: `$V_n = C · ${forma(`s_{${n}¬i}`)} = ${e(c)} · ${f(s, 8)}${pre ? ` · ${f(1 + ip, 8)}` : ''} = ${e(vf)}$ €${d ? ' (el diferimiento no cambia el valor final, que se mide al acabar los pagos)' : ''}` });
      if (vari === 'cte' && modo === 'termino') pasos.push(sc.conocido === 'vf'
        ? { t: 'Término', html: `$C = V_n/(${forma(`s_{${n}¬i}`)}) = ${e(vf)}/${f(s * fp, 8)} = ${e(c)}$ €` }
        : { t: 'Término', html: `$C = V_0/(${forma(`a_{${n}¬i}`)}${d ? ` (1 + i)^{−${d}}` : ''}) = ${e(va)}/${f(a * fp * fd, 8)} = ${e(c)}$ €` });
      if (vari === 'cte') pasos.push({ t: modo === 'vf' ? 'Valor actual' : 'Valor final', html: modo === 'vf' ? `Llevado al origen: $V_0 = V_n (1 + i)^{−${n + d}} = ${e(va)}$ €` : `Llevado al final de los pagos: $V_n = V_0 (1 + i)^{${n + d}} = ${e(vf)}$ € (es lo mismo que $C · ${forma(`s_{${n}¬i}`)}$)` });
      if (vari === 'cte') pasos.push({ t: 'Intereses', html: `Se pagan ${n} términos de ${e(c)} €, en total ${e(c * n)} €. ${modo === 'vf' || sc.conocido === 'vf' ? `Los intereses ganados son $V_n − n · C = ${e(vf - c * n)}$ €.` : `Frente al valor actual, los intereses son $n · C − V_0 = ${e(c * n - va)}$ €.`}` });
    }
    // calendario de los términos (como mucho 120 filas)
    const nt = n === null ? 120 : Math.min(120, Math.ceil(n - 1e-9)), filas = [];
    for (let k = 1; k <= nt; k++) { const t = d + k - (pre ? 1 : 0); const ck = term ? term(k) : c; filas.push({ k, t, c: ck, va: ck * v(t) }); }
    return { modo, vari, h: sc.h, g: sc.g, pre, perpetua, m, per, pers, ia, ip, d, c, n, va, vf, filas, pasos };
  }

  const ejemplos = [
    { clave: 'va', nombre: '1.000 € al año durante 10 años al 5 %', sc: { modo: 'va', pago: 'pos', duracion: 'temporal', c: '1000', n: '10', i: '5', m: '1', d: '0' } },
    { clave: 'plan', nombre: 'Ahorrar 200 € al mes durante 5 años', sc: { modo: 'vf', pago: 'pre', duracion: 'temporal', c: '200', n: '60', i: '3', m: '12', d: '0' } },
    { clave: 'cuota', nombre: 'Cuota anual de un préstamo de 20.000 €', sc: { modo: 'termino', pago: 'pos', duracion: 'temporal', conocido: 'va', va: '20000', n: '5', i: '4', m: '1', d: '0' } },
    { clave: 'perpetua', nombre: 'Renta perpetua: 600 € al año al 4 %', sc: { modo: 'va', pago: 'pos', duracion: 'perpetua', c: '600', i: '4', m: '1', d: '0' } },
    { clave: 'diferida', nombre: 'Renta diferida 3 años: 1.500 € durante 8 años', sc: { modo: 'va', pago: 'pos', duracion: 'temporal', c: '1500', n: '8', i: '6', m: '1', d: '3' } },
    { clave: 'cuantos', nombre: '¿Cuántas anualidades de 2.000 € pagan 15.000 €?', sc: { modo: 'n', pago: 'pos', duracion: 'temporal', c: '2000', va: '15000', i: '5', m: '1', d: '0' } },
    { clave: 'aritmetica', nombre: 'Renta creciente: 1.000 € y 100 € más cada año, 10 años al 5 %', sc: { modo: 'va', pago: 'pos', duracion: 'temporal', variacion: 'arit', h: '100', c: '1000', n: '10', i: '5', m: '1', d: '0' } },
    { clave: 'geometrica', nombre: 'Renta que crece un 3 % al año: 1.000 € el primero, 10 años al 5 %', sc: { modo: 'vf', pago: 'pos', duracion: 'temporal', variacion: 'geom', g: '3', c: '1000', n: '10', i: '5', m: '1', d: '0' } },
  ];

  // modo práctica: datos redondos al azar
  const AZ = K.az, azar = AZ.desde(ejemplos, () => {
    const m = AZ.toma([1, 12]);
    return { modo: AZ.toma(['va', 'vf']), pago: AZ.toma(['pos', 'pre']), c: String(AZ.toma([200, 500, 1000, 2000])), n: String(m === 1 ? AZ.toma([5, 10, 15, 20]) : AZ.toma([24, 60, 120])), i: String(AZ.toma([3, 4, 5, 6])), m: String(m), d: '0' };
  }, (sc) => !sc.variacion && sc.duracion === 'temporal' && sc.d === '0' && (sc.modo === 'va' || sc.modo === 'vf'), (sc) => resolver(sc));
  const enunciado = (sc) => `Una renta de ${sc.c} € ${sc.m === '1' ? 'al año' : 'al mes'}, pagadera al ${sc.pago === 'pos' ? 'final' : 'principio'} de cada periodo durante ${sc.n} ${sc.m === '1' ? 'años' : 'meses'}, con un tipo de interés del ${sc.i} % anual. Calcula su valor actual y su valor final.`;

  return { azar, enunciado, resolver, ejemplos, MODOS, VARIACIONES, PERIODOS };
})();
if (typeof module !== 'undefined') module.exports = Rentas;
