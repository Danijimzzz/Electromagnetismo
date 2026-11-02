/* =====================================================================
   Black-Scholes (sin DOM): valoración de una opción europea sobre una acción
   que paga un dividendo continuo. Saca d₁ y d₂, el precio de la call y de la
   put (con la paridad call-put como comprobación) y las griegas: delta, gamma,
   vega, theta y rho. Usa la normal de estadistica/calculo.js (Phi). Formato en
   euros de economia/comun.js; interfaz en black-scholes/app.js.
     resolver(sc)  { S, K, T, r, sigma, q, tipo } → { d1, d2, call, put, delta, gamma, vega, theta, rho, ... }
   Vega y rho van por cada punto porcentual; theta, por día natural (365).
   ===================================================================== */
const BlackScholes = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { Phi } = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const { f, lee } = K;
  const e = (x) => x.toFixed(4).replace('.', ',').replace('-', '−');
  const tp = (x) => `${f(100 * x, 5)} %`;
  const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);

  // valor y griegas con los datos ya leídos
  function calcula(S, X, T, r, sg, q) {
    const st = sg * Math.sqrt(T), d1 = (Math.log(S / X) + (r - q + sg * sg / 2) * T) / st, d2 = d1 - st;
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
    const T = lee(sc, 'T', 'el tiempo hasta el vencimiento', { min: 0, minEx: true, max: 100 });
    const r = lee(sc, 'r', 'el tipo sin riesgo', { min: -50, max: 100 }) / 100;
    const sg = lee(sc, 'sigma', 'la volatilidad σ', { min: 0, minEx: true, max: 1000 }) / 100;
    const q = lee(sc, 'q', 'el dividendo q', { min: -50, max: 100, def: 0 }) / 100;
    const tipo = sc.tipo === 'put' ? 'put' : 'call';
    const b = calcula(S, X, T, r, sg, q);
    const par = b.call - b.put - (S * b.eq - X * b.er);
    const mon = (tipo === 'call' ? S - X : X - S) / X;
    const situacion = Math.abs(mon) < 0.005 ? 'en el dinero' : mon > 0 ? 'dentro del dinero' : 'fuera del dinero';
    const opc = tipo === 'call' ? 'call' : 'put', V = tipo === 'call' ? b.call : b.put;
    const intr = Math.max(0, tipo === 'call' ? S - X : X - S);
    const pasos = [];
    pasos.push({ t: 'd₁ y d₂', html: `$d_1 = {ln(S/K) + (r − q + σ^2/2)·T}/{σ√T} = {ln(${f(S, 5)}/${f(X, 5)}) + (${f(r, 4)} − ${f(q, 4)} + ${f(sg * sg / 2, 4)})·${f(T, 4)}}/{${f(sg, 4)}·${f(Math.sqrt(T), 5)}} = ${e(b.d1)}$<br>$d_2 = d_1 − σ√T = ${e(b.d1)} − ${e(b.st)} = ${e(b.d2)}$<br>$N(d_1) = ${f(Phi(b.d1), 6)}$ · $N(d_2) = ${f(Phi(b.d2), 6)}$` });
    pasos.push({ t: 'Precio de la call', html: `$C = S·e^{−qT}·N(d_1) − K·e^{−rT}·N(d_2) = ${f(S * b.eq, 6)}·${f(Phi(b.d1), 5)} − ${f(X * b.er, 6)}·${f(Phi(b.d2), 5)} = ${e(b.call)}$ €<br>Es el valor esperado, descontado y en un mundo neutral al riesgo, de $máx(S_T − K, 0)$.` });
    pasos.push({ t: 'Precio de la put', html: `$P = K·e^{−rT}·N(−d_2) − S·e^{−qT}·N(−d_1) = ${f(X * b.er, 6)}·${f(Phi(-b.d2), 5)} − ${f(S * b.eq, 6)}·${f(Phi(-b.d1), 5)} = ${e(b.put)}$ €<br>Paridad call-put: $C − P = S·e^{−qT} − K·e^{−rT}$ → $${e(b.call - b.put)} = ${e(S * b.eq - X * b.er)}$ ✓` });
    pasos.push({ t: 'Delta y gamma', html: `$Δ_C = e^{−qT}N(d_1) = ${f(b.deltaC, 5)}$ · $Δ_P = e^{−qT}(N(d_1) − 1) = ${f(b.deltaP, 5)}$: lo que cambia la opción por cada euro que sube la acción.<br>$Γ = {e^{−qT}·φ(d_1)}/{S·σ√T} = ${f(b.gamma, 5)}$: lo que cambia la delta por euro.` });
    pasos.push({ t: 'Vega, theta y rho', html: `$ν = S·e^{−qT}·φ(d_1)·√T = ${f(b.vega * 100, 5)}$ por unidad de σ, es decir <b>${f(b.vega, 5)} € por punto</b> de volatilidad (igual para call y put).<br>$Θ_C = ${f(b.thetaC * 365, 5)}$ y $Θ_P = ${f(b.thetaP * 365, 5)}$ al año, o ${f(b.thetaC, 4)} € y ${f(b.thetaP, 4)} € por día.<br>$ρ_C = K·T·e^{−rT}·N(d_2) = ${f(b.rhoC * 100, 5)}$ y $ρ_P = −K·T·e^{−rT}·N(−d_2) = ${f(b.rhoP * 100, 5)}$ por unidad de tipo, o ${f(b.rhoC, 4)} € y ${f(b.rhoP, 4)} € por punto.` });
    pasos.push({ t: `Tu ${opc}`, html: `Vale <b>${e(V)} €</b>: ${e(intr)} € de valor intrínseco y ${e(V - intr)} € de valor temporal. Está ${situacion}.` });
    return { S, X, T, r, sg, q, tipo, ...b, par, V, intr, mon, situacion, opc, valor: (s, t = T) => { if (t <= 0) return Math.max(0, tipo === 'call' ? s - X : X - s); const o = calcula(s, X, t, r, sg, q); return tipo === 'call' ? o.call : o.put; }, pasos };
  }

  const ejemplos = [
    { clave: 'base', nombre: 'Clásico: S = K = 100, 1 año, σ = 20 %', sc: { S: '100', K: '100', T: '1', r: '5', sigma: '20', q: '0', tipo: 'call' } },
    { clave: 'hull', nombre: 'Call sobre 42 € con ejercicio 40 € a 6 meses', sc: { S: '42', K: '40', T: '0,5', r: '10', sigma: '20', q: '0', tipo: 'call' } },
    { clave: 'put', nombre: 'Put fuera del dinero, 3 meses', sc: { S: '50', K: '45', T: '0,25', r: '3', sigma: '30', q: '0', tipo: 'put' } },
    { clave: 'dividendo', nombre: 'Acción con dividendo del 3 %', sc: { S: '80', K: '85', T: '2', r: '4', sigma: '25', q: '3', tipo: 'call' } },
    { clave: 'volatil', nombre: 'Muy volátil: σ = 60 %', sc: { S: '30', K: '30', T: '0,75', r: '2', sigma: '60', q: '0', tipo: 'put' } },
  ];

  return { resolver, ejemplos, calcula };
})();
if (typeof module !== 'undefined') module.exports = BlackScholes;
