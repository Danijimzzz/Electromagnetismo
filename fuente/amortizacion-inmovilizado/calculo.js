/* =====================================================================
   Amortización del inmovilizado (sin DOM): cuadro de amortización de un
   bien por el método lineal, el de suma de dígitos (decreciente), el
   degresivo de porcentaje constante sobre el valor pendiente (con su
   coeficiente, y el último año se lleva justo al valor residual) y el de
   unidades de producción. Cada fila: cuota del año, amortización acumulada
   y valor neto contable. Formato en euros de economia/comun.js; interfaz en
   amortizacion-inmovilizado/app.js.
     resolver(sc)  { metodo, v0, vr, n, coef, total, unidades } → { base, filas, pasos }
   ===================================================================== */
const AmortizacionInmovilizado = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const METODOS = { lineal: 'Lineal (cuotas constantes)', digitos: 'Suma de dígitos (decreciente)', degresivo: 'Degresivo (porcentaje constante)', unidades: 'Unidades de producción' };
  // euros dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');

  function resolver(sc) {
    const met = METODOS[sc.metodo] ? sc.metodo : 'lineal';
    const v0 = lee(sc, 'v0', 'el precio de adquisición', { min: 0, minEx: true });
    const vr = lee(sc, 'vr', 'el valor residual', { min: 0, def: 0 });
    if (vr >= v0) throw new Error('El valor residual tiene que ser menor que el precio de adquisición');
    const base = v0 - vr, pasos = [];
    pasos.push({ t: 'Base amortizable', html: `Lo que pierde el bien a lo largo de su vida: precio de adquisición menos valor residual, $${e(v0)} − ${e(vr)} = ${e(base)}$ €.` });
    let cuotas = [], t = null;
    if (met === 'unidades') {
      const U = lee(sc, 'total', 'la producción total prevista', { min: 0, minEx: true });
      const u = K.lista(sc.unidades, 'las unidades de cada año');
      if (!u.length) throw new Error('Escribe las unidades producidas (o los km) de cada año');
      if (u.some((x) => x < 0)) throw new Error('Las unidades de cada año no pueden ser negativas');
      const su = u.reduce((s, x) => s + x, 0);
      if (su > U + 1e-9) throw new Error(`Las unidades de los años suman ${f(su, 8)}, más que la producción total prevista (${f(U, 8)})`);
      const q = base / U;
      pasos.push({ t: 'Coste por unidad', html: `$${e(base)}/${f(U, 10)} = ${f(q, 6)}$ € por unidad. Cada año se amortiza lo que se ha usado: cuota = unidades del año · ${f(q, 6)} €.` });
      cuotas = u.map((x) => x * q);
    } else {
      const n = lee(sc, 'n', 'la vida útil', { min: 1, max: 100, entero: true });
      if (met === 'lineal') {
        const c = base / n;
        pasos.push({ t: 'Cuota lineal', html: `La misma cada año: $${e(base)}/${n} = ${e(c)}$ €, un coeficiente del $100/${n} = ${f(100 / n, 4)} %$ anual sobre la base.` });
        cuotas = Array(n).fill(c);
      } else if (met === 'digitos') {
        const S = (n * (n + 1)) / 2;
        pasos.push({ t: 'Suma de dígitos', html: `Se suman los años de vida: $1 + 2 + … + ${n} = ${n}·${n + 1}/2 = ${S}$. El primer año se amortizan ${n}/${S} de la base, el segundo ${n - 1}/${S}, y así hasta 1/${S}: cada dígito vale $${e(base)}/${S} = ${e(base / S)}$ €.` });
        cuotas = Array.from({ length: n }, (_, k) => (base * (n - k)) / S);
      } else {
        const coef = lee(sc, 'coef', 'el coeficiente', { min: 0, minEx: true, def: 2 }); t = coef / n;
        if (t >= 1) throw new Error('Coeficiente / vida útil tiene que ser menor que 1');
        pasos.push({ t: 'Porcentaje constante', html: `Cada año se amortiza el mismo porcentaje del valor pendiente: $t = "coeficiente"/n = ${f(coef)}/${n} = ${f(t, 6)}$ (${f(100 * t, 5)} %). Así las cuotas bajan año a año, y el último año se amortiza lo que falta para llegar al valor residual.` });
        let vnc = v0;
        for (let k = 1; k <= n; k++) {
          let c = k === n ? vnc - vr : vnc * t;
          if (vnc - c < vr) c = vnc - vr;
          cuotas.push(Math.max(0, c)); vnc -= Math.max(0, c);
        }
      }
    }
    const filas = []; let ac = 0;
    cuotas.forEach((c, k) => { ac += c; filas.push({ k: k + 1, c, ac, vnc: v0 - ac }); });
    if (met === 'degresivo') pasos.push({ t: 'Primeros años', html: filas.slice(0, 3).map((r) => `Año ${r.k}: $${e(r.vnc + r.c)} · ${f(t, 6)} = ${e(r.c)}$ €`).join('<br>') + (filas.length > 1 ? `<br>Último año: lo que queda hasta el valor residual, $${e(filas[filas.length - 1].vnc + filas[filas.length - 1].c)} − ${e(vr)} = ${e(filas[filas.length - 1].c)}$ €` : '') });
    pasos.push({ t: 'Cuadro de amortización', html: `Cada año: amortización acumulada = la de antes más la cuota, y valor neto contable = precio de adquisición − amortización acumulada. Al final ${Math.abs(ac - base) < 0.005 ? `el bien queda en su valor residual, ${e(vr)} €` : `quedan ${e(v0 - ac)} € por amortizar (el bien no se ha usado entero)`}.` });
    pasos.push({ t: 'En la contabilidad', html: 'Cada año se carga la cuota en la cuenta (681) Amortización del inmovilizado material, que es un gasto, con abono a la (281) Amortización acumulada, que resta del valor del bien en el balance.' });
    return { met, v0, vr, base, filas, total: ac, pasos };
  }

  const ejemplos = [
    { clave: 'lineal', nombre: 'Máquina de 50.000 € a 5 años, método lineal', sc: { metodo: 'lineal', v0: '50000', vr: '5000', n: '5' } },
    { clave: 'digitos', nombre: 'La misma máquina por suma de dígitos', sc: { metodo: 'digitos', v0: '50000', vr: '5000', n: '5' } },
    { clave: 'degresivo', nombre: 'La misma máquina, degresivo con coeficiente 2', sc: { metodo: 'degresivo', v0: '50000', vr: '5000', n: '5', coef: '2' } },
    { clave: 'furgoneta', nombre: 'Furgoneta por kilómetros recorridos', sc: { metodo: 'unidades', v0: '30000', vr: '2000', total: '200000', unidades: '50000 60000 40000 30000 20000' } },
    { clave: 'ordenador', nombre: 'Ordenador de 1.200 € a 3 años sin valor residual', sc: { metodo: 'lineal', v0: '1200', vr: '0', n: '3' } },
  ];

  // modo práctica: datos redondos al azar
  const AZ = K.az, azar = AZ.desde(ejemplos, (sc) => {
    const v0 = AZ.toma([10000, 30000, 50000, 80000]), cambia = { v0: String(v0), vr: String(Math.round(v0 * AZ.toma([0, 0.1]))), n: String(AZ.toma([3, 4, 5, 6])) };
    return sc.coef ? { ...cambia, coef: AZ.t(AZ.toma([1.5, 2])) } : cambia;
  }, (sc) => sc.metodo !== 'unidades', (sc) => resolver(sc));
  const enunciado = (sc) => `Un activo cuesta ${sc.v0} € y se espera usarlo durante ${sc.n} años, con un valor residual de ${sc.vr} €. Con el método ${{ lineal: 'lineal', digitos: 'de los números dígitos decrecientes', degresivo: `degresivo (coeficiente ${sc.coef})` }[sc.metodo]}, calcula la base amortizable, la cuota del primer y del último año y el valor neto contable al final.`;

  return { azar, enunciado, resolver, ejemplos, METODOS };
})();
if (typeof module !== 'undefined') module.exports = AmortizacionInmovilizado;
