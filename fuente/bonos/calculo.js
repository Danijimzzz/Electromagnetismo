/* =====================================================================
   Bonos y duración (sin DOM): valoración de un bono con cupón fijo. Con la
   rentabilidad exigida (TIR) saca el precio; con el precio, la TIR (bisección).
   Además: rentabilidad corriente, duración de Macaulay y modificada,
   convexidad y el efecto de una variación de la TIR en el precio (exacto,
   con la duración y con la duración más la convexidad). Formato en euros de
   economia/comun.js; interfaz en bonos/app.js.
     resolver(sc)  { nominal, cupon, m, anos, modo, y | precio, shock } → { precio, y, durM, durMod, conv, filas, ... }
   Se compra justo después de un cupón (sin cupón corrido); el valor de
   reembolso es el nominal. Tasas nominales anuales con m pagos al año.
   ===================================================================== */
const Bonos = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const e = (x) => x.toFixed(2).replace('.', ',').replace('-', '−');
  const tp = (x) => `${f(100 * x, 5)} %`;

  // flujos de cada periodo: cupón y, en el último, también el nominal
  const flujos = (N, c, m, n) => Array.from({ length: n }, (_, j) => N * c / m + (j === n - 1 ? N : 0));
  const precioDe = (N, c, m, n, y) => flujos(N, c, m, n).reduce((s, q, j) => s + q * (1 + y / m) ** -(j + 1), 0);
  // TIR de un precio: el precio baja al subir y, así que se bisecciona entre −m·(casi 100 %) y una tasa enorme
  function tirDe(N, c, m, n, P) {
    let lo = -0.99 * m, hi = 10;
    if (precioDe(N, c, m, n, lo) < P || precioDe(N, c, m, n, hi) > P) return null;
    for (let i = 0; i < 300; i++) { const mid = (lo + hi) / 2; if (precioDe(N, c, m, n, mid) > P) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  function resolver(sc) {
    const N = lee(sc, 'nominal', 'el valor nominal', { min: 0, minEx: true });
    const c = lee(sc, 'cupon', 'el cupón', { min: 0 }) / 100;
    const m = lee(sc, 'm', 'los pagos al año', { min: 1, entero: true, def: 1 });
    const anos = lee(sc, 'anos', 'los años hasta el vencimiento', { min: 0, minEx: true, max: 100 });
    const nr = anos * m, n = Math.round(nr);
    if (Math.abs(nr - n) > 1e-9 || n < 1) throw new Error(`Con ${m} pago${m === 1 ? '' : 's'} al año, los años hasta el vencimiento deben dar un número entero de pagos (por ejemplo, ${n < 1 ? 1 / m : n / m})`);
    const modo = sc.modo === 'precio' ? 'precio' : 'tir';
    const shock = lee(sc, 'shock', 'la variación de la TIR', { min: -50, max: 50, def: 0 }) / 100;
    let y, P;
    if (modo === 'tir') { y = lee(sc, 'y', 'la rentabilidad exigida (TIR)', { min: -99, minEx: true }) / 100; P = precioDe(N, c, m, n, y); }
    else {
      P = lee(sc, 'precio', 'el precio', { min: 0, minEx: true });
      y = tirDe(N, c, m, n, P); if (y === null) throw new Error('Ese precio no corresponde a ninguna rentabilidad razonable');
    }
    const i = y / m, F = flujos(N, c, m, n);
    const filas = F.map((q, j) => { const fa = (1 + i) ** -(j + 1), va = q * fa; return { j: j + 1, t: (j + 1) / m, q, fa, va, w: va / P, tw: (va / P) * ((j + 1) / m) }; });
    const durM = filas.reduce((s, r) => s + r.tw, 0), durMod = durM / (1 + i);
    const conv = filas.reduce((s, r) => s + r.va * r.j * (r.j + 1), 0) / (P * (1 + i) ** 2 * m * m);
    const dP = durMod * shock, Pdur = P * (1 - dP), Pconv = P * (1 - dP + 0.5 * conv * shock * shock), Pexacto = precioDe(N, c, m, n, y + shock);
    const corriente = N * c / P;
    const estado = Math.abs(P - N) < 0.005 * N / 100 ? 'a la par' : P > N ? 'sobre la par' : 'bajo la par';
    const pasos = [];
    pasos.push({ t: 'Flujos del bono', html: `Paga ${m === 1 ? 'un cupón anual' : `${m} cupones al año`} de $N·c/m = ${e(N)}·${f(c, 5)}/${m} = ${e(N * c / m)}$ € durante ${n} periodo${n === 1 ? '' : 's'}, y en el último devuelve además el nominal de ${e(N)} €. Cada periodo la tasa es $i = y/m$.` });
    pasos.push(modo === 'tir'
      ? { t: 'Precio', html: `Es el valor actual de los flujos descontados a la TIR $y = ${tp(y)}$:<br>$P = ∑ {Q_j}/{(1 + i)^j} = ${F.slice(0, 3).map((q, j) => `{${e(q)}}/{${f(1 + i, 6)}^{${j + 1}}}`).join(' + ')}${n > 3 ? ' + …' : ''} = ${e(P)}$ €<br>Cotiza ${estado}: ${f(100 * P / N, 6)} % del nominal.` }
      : { t: 'Rentabilidad (TIR) del precio', html: `La TIR es la tasa $y$ con la que el valor actual de los flujos iguala el precio pagado, $${e(P)} = ∑ Q_j/(1 + y/m)^j$. No se puede despejar y se resuelve por tanteo (bisección): <b>y = ${tp(y)}</b>.<br>Cotiza ${estado}: ${f(100 * P / N, 6)} % del nominal.` });
    pasos.push({ t: 'Rentabilidad corriente', html: `$RC = {N·c}/P = ${e(N * c)}/${e(P)} = ${tp(corriente)}$ (el cupón anual sobre lo que cuesta; no cuenta la ganancia o pérdida hasta el vencimiento).` });
    pasos.push({ t: 'Duración de Macaulay', html: `Es el plazo medio en que se recupera el dinero, con cada flujo ponderado por su valor actual: $D = ∑ t·{VA_j}/P = ${f(durM, 6)}$ años (la tabla da cada peso). Un bono cupón cero tiene $D$ igual a su vencimiento.` });
    pasos.push({ t: 'Duración modificada y convexidad', html: `$D_m = D/(1 + y/m) = ${f(durM, 6)}/${f(1 + i, 6)} = ${f(durMod, 6)}$: el precio cae aproximadamente un ${f(durMod, 4)} % por cada punto que sube la TIR.<br>$C = {1}/{P(1 + i)^2 m^2} ∑ VA_j·j(j + 1) = ${f(conv, 6)}$ mide la curvatura de la relación precio-TIR.` });
    if (shock !== 0) pasos.push({ t: `Si la TIR varía ${f(100 * shock, 4)} puntos`, html: `Con la duración: $ΔP/P ≈ −D_m·Δy = −${f(durMod, 5)}·${f(shock, 4)} = ${f(-dP * 100, 5)} %$ → ${e(Pdur)} €.<br>Añadiendo la convexidad: $ΔP/P ≈ −D_m·Δy + {1}/{2}·C·Δy^2 = ${f(100 * (-dP + 0.5 * conv * shock * shock), 5)} %$ → ${e(Pconv)} €.<br>Valorando de nuevo con la TIR ${tp(y + shock)}: <b>${e(Pexacto)} €</b> (${f(100 * (Pexacto / P - 1), 5)} %). La convexidad corrige la duración, que siempre infravalora el precio.` });
    return { N, c, m, anos, n, modo, y, P, corriente, durM, durMod, conv, shock, Pdur, Pconv, Pexacto, estado, filas, precioDe: (x) => precioDe(N, c, m, n, x), pasos };
  }

  const ejemplos = [
    { clave: 'bono-tres-anos', nombre: 'Bono a 3 años: cupón 5 %, TIR 4 %', sc: { modo: 'tir', nominal: '1000', cupon: '5', m: '1', anos: '3', y: '4', precio: '', shock: '1' } },
    { clave: 'a-la-par', nombre: 'Bono a la par: cupón igual a la TIR', sc: { modo: 'tir', nominal: '1000', cupon: '4', m: '1', anos: '10', y: '4', precio: '', shock: '1' } },
    { clave: 'bajo-par', nombre: 'Se compra por 920 €: ¿qué rentabilidad da?', sc: { modo: 'precio', nominal: '1000', cupon: '3', m: '1', anos: '5', y: '', precio: '920', shock: '1' } },
    { clave: 'semestral', nombre: 'Cupón semestral a 10 años', sc: { modo: 'tir', nominal: '5000', cupon: '6', m: '2', anos: '10', y: '5', precio: '', shock: '-1' } },
    { clave: 'cupon-cero', nombre: 'Cupón cero a 8 años', sc: { modo: 'tir', nominal: '1000', cupon: '0', m: '1', anos: '8', y: '3,5', precio: '', shock: '1' } },
  ];

  return { resolver, ejemplos, precioDe, tirDe, flujos };
})();
if (typeof module !== 'undefined') module.exports = Bonos;
