/* =====================================================================
   Black-Scholes (sin DOM): valoración de una opción europea sobre una acción
   que paga un dividendo continuo. Saca d₁ y d₂, el precio de la call y de la
   put (con la paridad call-put como comprobación) y las griegas: delta, gamma,
   vega, theta y rho. Usa la normal de estadistica/calculo.js (Phi). Formato en
   euros de economia/comun.js; interfaz en black-scholes/app.js.
     resolver(sc)  { S, K, T, r, sigma, q, tipo } → { d1, d2, call, put, delta, gamma, vega, theta, rho, ... }
   Vega y rho van por cada punto porcentual; theta, por día natural (365).
   Casos límite: con T = 0 la opción vale su pago al vencimiento y con σ = 0
   el valor del pago seguro, descontado (delta 0 o 1; la gamma, la vega y la
   rho son 0; a T = 0 la theta no está definida). Con modo = 'iv' se da el
   precio de mercado de la opción y se busca la σ implícita por bisección
   (el precio tiene que estar entre los límites de no arbitraje).
   ===================================================================== */
const BlackScholes = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { Phi } = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const { f, lee } = K;
  const e = (x) => x.toFixed(4).replace('.', ',').replace('-', '−');
  const tp = (x) => `${f(100 * x, 5)} %`;
  const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);

  // T = 0 o σ = 0: no hay incertidumbre y el valor es el pago seguro, descontado
  function limite(S, X, T, r, q, sg) {
    const eq = Math.exp(-q * T), er = Math.exp(-r * T), m = S * eq - X * er, ya = !(T > 0), nd = m === 0 ? NaN : 1, can = m === 0 ? NaN : 0;
    const dc = m > 0 ? eq : can, dp = m < 0 ? -eq : m > 0 ? 0 : NaN;
    return {
      d1: m > 0 ? Infinity : m < 0 ? -Infinity : NaN, d2: m > 0 ? Infinity : m < 0 ? -Infinity : NaN, eq, er, st: 0, limite: ya ? 'vencimiento' : 'sin volatilidad', m,
      call: Math.max(m, 0), put: Math.max(-m, 0), deltaC: dc, deltaP: dp, gamma: m === 0 ? NaN : 0, vega: 0,
      thetaC: ya ? NaN : m > 0 ? (q * S * eq - r * X * er) / 365 : m < 0 ? 0 : NaN, thetaP: ya ? NaN : m < 0 ? (r * X * er - q * S * eq) / 365 : m > 0 ? 0 : NaN,
      rhoC: m > 0 ? X * T * er / 100 : 0, rhoP: m < 0 ? -X * T * er / 100 : 0,
    };
  }

  // σ implícita: el precio de la opción crece con σ, así que se bisecciona entre 0 y 2000 %
  function sigmaImplicita(S, X, T, r, q, tipo, P) {
    const v = (sg) => { const o = calcula(S, X, T, r, sg, q); return tipo === 'call' ? o.call : o.put; };
    const eq = Math.exp(-q * T), er = Math.exp(-r * T), inf = Math.max(0, tipo === 'call' ? S * eq - X * er : X * er - S * eq), sup = tipo === 'call' ? S * eq : X * er;
    const e = (x) => x.toFixed(4).replace('.', ',');
    if (P < inf - 1e-12) throw new Error(`Ese precio está por debajo del mínimo posible (${e(inf)} €): permitiría ganar dinero sin riesgo (arbitraje)`);
    if (P >= sup - 1e-12) throw new Error(`Ese precio es igual o mayor que el máximo posible (${e(sup)} €): ninguna volatilidad lo explica`);
    if (P <= inf + 1e-12) return 0;
    let lo = 0, hi = 20;
    if (v(hi) < P) throw new Error('Ese precio exigiría una volatilidad de más del 2.000 %');
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (v(mid) < P) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  // valor y griegas con los datos ya leídos
  function calcula(S, X, T, r, sg, q) {
    const st = sg * Math.sqrt(T);
    if (!(st > 0)) return limite(S, X, T, r, q, sg);
    const d1 = (Math.log(S / X) + (r - q + sg * sg / 2) * T) / st, d2 = d1 - st;
    const eq = Math.exp(-q * T), er = Math.exp(-r * T);
    const call = S * eq * Phi(d1) - X * er * Phi(d2), put = X * er * Phi(-d2) - S * eq * Phi(-d1);
    return {
      d1, d2, eq, er, call, put, st,
      deltaC: eq * Phi(d1), deltaP: eq * (Phi(d1) - 1), gamma: eq * phi(d1) / (S * st), vega: S * eq * phi(d1) * Math.sqrt(T) / 100,
      thetaC: (-S * eq * phi(d1) * sg / (2 * Math.sqrt(T)) - r * X * er * Phi(d2) + q * S * eq * Phi(d1)) / 365,
      thetaP: (-S * eq * phi(d1) * sg / (2 * Math.sqrt(T)) + r * X * er * Phi(-d2) - q * S * eq * Phi(-d1)) / 365,
      rhoC: X * T * er * Phi(d2) / 100, rhoP: -X * T * er * Phi(-d2) / 100,
    };
  }

  function resolver(sc) {
    const S = lee(sc, 'S', 'el precio de la acción S', { min: 0, minEx: true });
    const X = lee(sc, 'K', 'el precio de ejercicio K', { min: 0, minEx: true });
    const modo = sc.modo === 'iv' ? 'iv' : 'valor';
    const T = lee(sc, 'T', 'el tiempo hasta el vencimiento', { min: 0, minEx: modo === 'iv', max: 100 });
    const r = lee(sc, 'r', 'el tipo sin riesgo', { min: -50, max: 100 }) / 100;
    const q = lee(sc, 'q', 'el dividendo q', { min: -50, max: 100, def: 0 }) / 100;
    const tipo = sc.tipo === 'put' ? 'put' : 'call';
    let sg, Pmercado = null;
    if (modo === 'iv') { Pmercado = lee(sc, 'precio', `el precio de mercado de la ${tipo}`, { min: 0, minEx: true }); sg = sigmaImplicita(S, X, T, r, q, tipo, Pmercado); }
    else sg = lee(sc, 'sigma', 'la volatilidad σ', { min: 0, max: 1000 }) / 100;
    const b = calcula(S, X, T, r, sg, q);
    const par = b.call - b.put - (S * b.eq - X * b.er);
    const mon = (tipo === 'call' ? S - X : X - S) / X;
    const situacion = Math.abs(mon) < 0.005 ? 'en el dinero' : mon > 0 ? 'dentro del dinero' : 'fuera del dinero';
    const opc = tipo === 'call' ? 'call' : 'put', V = tipo === 'call' ? b.call : b.put;
    const intr = Math.max(0, tipo === 'call' ? S - X : X - S);
    const pasos = [];
    if (modo === 'iv') pasos.push({ t: 'Volatilidad implícita', html: `El precio de mercado de la ${opc} es ${e(Pmercado)} €. La fórmula de Black-Scholes no se puede despejar en σ, pero el precio crece siempre con la volatilidad (la vega es positiva), así que se busca por bisección la σ que da ese precio: <b>σ = ${tp(sg)}</b>.<br>Límites de no arbitraje de la ${opc}: entre ${e(tipo === 'call' ? Math.max(0, S * b.eq - X * b.er) : Math.max(0, X * b.er - S * b.eq))} € y ${e(tipo === 'call' ? S * b.eq : X * b.er)} €; fuera de ese intervalo ninguna σ lo explica.` });
    if (b.limite) {
      const m = b.m, por = b.limite === 'vencimiento' ? 'T = 0: la opción vence ahora' : 'σ = 0: el precio futuro no tiene incertidumbre';
      pasos.push({ t: b.limite === 'vencimiento' ? 'Vencimiento: la opción vale su pago' : 'Sin volatilidad: pago seguro, descontado',
        html: b.limite === 'vencimiento'
          ? `Con $T = 0$ no queda tiempo: la call vale $C = máx(S − K, 0) = máx(${f(S, 5)} − ${f(X, 5)}, 0) = ${e(b.call)}$ € y la put $P = máx(K − S, 0) = ${e(b.put)}$ €. Los logaritmos de $d_1$ y $d_2$ no se pueden calcular (dividen por $σ√T = 0$): tienden a ±∞.`
          : `Con $σ = 0$ la acción crece sin riesgo hasta $S·e^{(r − q)T} = ${e(S * Math.exp((r - q) * T))}$ €. Como el pago es seguro, se descuenta: $C = máx(S e^{−qT} − K e^{−rT}, 0) = máx(${e(S * b.eq)} − ${e(X * b.er)}, 0) = ${e(b.call)}$ € y $P = máx(K e^{−rT} − S e^{−qT}, 0) = ${e(b.put)}$ €. $d_1$ y $d_2$ tienden a ±∞.` });
      pasos.push({ t: 'Paridad call-put', html: `$C − P = S·e^{−qT} − K·e^{−rT}$ → $${e(b.call - b.put)} = ${e(S * b.eq - X * b.er)}$ ✓` });
      pasos.push({ t: 'Griegas en el límite', html: isNaN(b.deltaC) ? `Justo en el dinero (${por}) la delta no está definida: salta de 0 a 1 en la call. Gamma, vega y rho son 0 salvo ese punto.` : `Delta de la call = <b>${f(b.deltaC, 4)}</b> y de la put = <b>${f(b.deltaP, 4)}</b>: la opción o se ejerce seguro (se comporta como la acción) o no se ejerce nunca (no cambia). Gamma = 0, vega = 0${b.limite === 'vencimiento' ? ' y rho = 0. La theta no está definida porque no hay tiempo que pasar' : `; theta por día = ${f(b.thetaC, 4)} € (call) y ${f(b.thetaP, 4)} € (put); rho por punto = ${f(b.rhoC, 4)} € (call) y ${f(b.rhoP, 4)} € (put)`}.` });
    } else {
      pasos.push({ t: 'd₁ y d₂', html: `$d_1 = {ln(S/K) + (r − q + σ^2/2)·T}/{σ√T} = {ln(${f(S, 5)}/${f(X, 5)}) + (${f(r, 4)} − ${f(q, 4)} + ${f(sg * sg / 2, 4)})·${f(T, 4)}}/{${f(sg, 4)}·${f(Math.sqrt(T), 5)}} = ${e(b.d1)}$<br>$d_2 = d_1 − σ√T = ${e(b.d1)} − ${e(b.st)} = ${e(b.d2)}$<br>$N(d_1) = ${f(Phi(b.d1), 6)}$ · $N(d_2) = ${f(Phi(b.d2), 6)}$` });
      pasos.push({ t: 'Precio de la call', html: `$C = S·e^{−qT}·N(d_1) − K·e^{−rT}·N(d_2) = ${f(S * b.eq, 6)}·${f(Phi(b.d1), 5)} − ${f(X * b.er, 6)}·${f(Phi(b.d2), 5)} = ${e(b.call)}$ €<br>Es el valor esperado, descontado y en un mundo neutral al riesgo, de $máx(S_T − K, 0)$.` });
      pasos.push({ t: 'Precio de la put', html: `$P = K·e^{−rT}·N(−d_2) − S·e^{−qT}·N(−d_1) = ${f(X * b.er, 6)}·${f(Phi(-b.d2), 5)} − ${f(S * b.eq, 6)}·${f(Phi(-b.d1), 5)} = ${e(b.put)}$ €<br>Paridad call-put: $C − P = S·e^{−qT} − K·e^{−rT}$ → $${e(b.call - b.put)} = ${e(S * b.eq - X * b.er)}$ ✓` });
      pasos.push({ t: 'Delta y gamma', html: `$Δ_C = e^{−qT}N(d_1) = ${f(b.deltaC, 5)}$ · $Δ_P = e^{−qT}(N(d_1) − 1) = ${f(b.deltaP, 5)}$: lo que cambia la opción por cada euro que sube la acción.<br>$Γ = {e^{−qT}·φ(d_1)}/{S·σ√T} = ${f(b.gamma, 5)}$: lo que cambia la delta por euro.` });
      pasos.push({ t: 'Vega, theta y rho', html: `$ν = S·e^{−qT}·φ(d_1)·√T = ${f(b.vega * 100, 5)}$ por unidad de σ, es decir <b>${f(b.vega, 5)} € por punto</b> de volatilidad (igual para call y put).<br>$Θ_C = ${f(b.thetaC * 365, 5)}$ y $Θ_P = ${f(b.thetaP * 365, 5)}$ al año, o ${f(b.thetaC, 4)} € y ${f(b.thetaP, 4)} € por día.<br>$ρ_C = K·T·e^{−rT}·N(d_2) = ${f(b.rhoC * 100, 5)}$ y $ρ_P = −K·T·e^{−rT}·N(−d_2) = ${f(b.rhoP * 100, 5)}$ por unidad de tipo, o ${f(b.rhoC, 4)} € y ${f(b.rhoP, 4)} € por punto.` });
      if (T < 0.02) pasos.push({ t: 'Cerca del vencimiento', html: `Quedan ${f(T * 365, 3)} días. Al acercarse el vencimiento, y sobre todo si la opción está cerca del dinero, la gamma y la theta se disparan: no es un error, la delta pasa de 0 a 1 en un intervalo de precios cada vez más estrecho.` });
    }
    pasos.push({ t: `Tu ${opc}`, html: `Vale <b>${e(V)} €</b>: ${e(intr)} € de valor intrínseco y ${e(V - intr)} € de valor temporal. Está ${situacion}.` });
    return { S, X, T, r, sg, q, tipo, modo, Pmercado, ...b, par, V, intr, mon, situacion, opc, valor: (s, t = T) => { const o = calcula(s, X, t, r, sg, q); return tipo === 'call' ? o.call : o.put; }, pasos };
  }

  const ejemplos = [
    { clave: 'base', nombre: 'Clásico: S = K = 100, 1 año, σ = 20 %', sc: { S: '100', K: '100', T: '1', r: '5', sigma: '20', q: '0', tipo: 'call' } },
    { clave: 'hull', nombre: 'Call sobre 42 € con ejercicio 40 € a 6 meses', sc: { S: '42', K: '40', T: '0,5', r: '10', sigma: '20', q: '0', tipo: 'call' } },
    { clave: 'put', nombre: 'Put fuera del dinero, 3 meses', sc: { S: '50', K: '45', T: '0,25', r: '3', sigma: '30', q: '0', tipo: 'put' } },
    { clave: 'dividendo', nombre: 'Acción con dividendo del 3 %', sc: { S: '80', K: '85', T: '2', r: '4', sigma: '25', q: '3', tipo: 'call' } },
    { clave: 'vencimiento', nombre: 'Vence hoy: T = 0', sc: { S: '105', K: '100', T: '0', r: '5', sigma: '20', q: '0', tipo: 'call' } },
    { clave: 'sin-volatilidad', nombre: 'Sin volatilidad: σ = 0', sc: { S: '100', K: '95', T: '1', r: '5', sigma: '0', q: '0', tipo: 'call' } },
    { clave: 'implicita', nombre: 'Volatilidad implícita de una call a 10,4506 €', sc: { modo: 'iv', S: '100', K: '100', T: '1', r: '5', sigma: '', precio: '10,4506', q: '0', tipo: 'call' } },
    { clave: 'implicita-put', nombre: 'Volatilidad implícita de una put a 1,50 €', sc: { modo: 'iv', S: '50', K: '45', T: '0,25', r: '3', sigma: '', precio: '1,5', q: '0', tipo: 'put' } },
    { clave: 'volatil', nombre: 'Muy volátil: σ = 60 %', sc: { S: '30', K: '30', T: '0,75', r: '2', sigma: '60', q: '0', tipo: 'put' } },
  ];

  return { resolver, ejemplos, calcula, sigmaImplicita };
})();
if (typeof module !== 'undefined') module.exports = BlackScholes;
