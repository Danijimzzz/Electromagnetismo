/* Comprobación de Black-Scholes: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo black-scholes). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Black-Scholes';
  const C = require(path.join(fuente, 'black-scholes', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // valores de referencia: S = K = 100, T = 1, r = 5 %, σ = 20 % → d₁ = 0,35, d₂ = 0,15, call 10,4506, put 5,5735
    const b = ej('base'); cerca(b.d1, 0.35, 1e-12, 'd₁'); cerca(b.d2, 0.15, 1e-12, 'd₂'); cerca(b.call, 10.4506, 5e-5, 'call'); cerca(b.put, 5.5735, 5e-5, 'put');
    cerca(b.deltaC, 0.63683, 5e-6, 'delta de la call (N(0,35))'); cerca(b.gamma, 0.018762, 5e-6, 'gamma'); cerca(b.vega, 0.37524, 5e-5, 'vega por punto'); cerca(b.thetaC * 365, -6.414, 5e-3, 'theta anual de la call');
    // Hull (S = 42, K = 40, T = 0,5, r = 10 %, σ = 20 %): call 4,76, put 0,81
    const h = ej('hull'); cerca(h.call, 4.76, 5e-3, 'call de Hull'); cerca(h.put, 0.81, 5e-3, 'put de Hull');
    // paridad call-put y relación entre las deltas, también con dividendo
    for (const c of ['base', 'hull', 'put', 'dividendo', 'volatil']) {
      const r = ej(c); cerca(r.call - r.put, r.S * Math.exp(-r.q * r.T) - r.X * Math.exp(-r.r * r.T), 1e-9, `paridad call-put (${c})`); cerca(r.deltaC - r.deltaP, Math.exp(-r.q * r.T), 1e-9, `delta call − delta put (${c})`);
    }
    // las griegas son las derivadas del precio (diferencias finitas)
    const d = ej('dividendo'), e = 1e-4, P = (S, T, sg, r) => C.calcula(S, d.X, T, r, sg, d.q).call;
    cerca(d.deltaC, (P(d.S + e, d.T, d.sg, d.r) - P(d.S - e, d.T, d.sg, d.r)) / (2 * e), 1e-6, 'delta como derivada'); cerca(d.vega, (P(d.S, d.T, d.sg + e, d.r) - P(d.S, d.T, d.sg - e, d.r)) / (2 * e) / 100, 1e-6, 'vega como derivada');
    cerca(d.rhoC, (P(d.S, d.T, d.sg, d.r + e) - P(d.S, d.T, d.sg, d.r - e)) / (2 * e) / 100, 1e-6, 'rho como derivada'); cerca(d.thetaC * 365, -(P(d.S, d.T + e, d.sg, d.r) - P(d.S, d.T - e, d.sg, d.r)) / (2 * e), 1e-6, 'theta como derivada');
    cerca(d.gamma, (P(d.S + e, d.T, d.sg, d.r) - 2 * P(d.S, d.T, d.sg, d.r) + P(d.S - e, d.T, d.sg, d.r)) / (e * e), 1e-4, 'gamma como derivada segunda');
    error({ ...C.ejemplos[0].sc, S: '0' }, 'acción a precio 0'); // vencimiento y volatilidad cero: pago seguro
    { const v = C.resolver({ ...C.ejemplos[0].sc, T: '0', S: '105' }); cerca(v.call, 5, 1e-12, 'call con T = 0'); cerca(v.put, 0, 1e-12, 'put con T = 0'); cerca(v.deltaC, 1, 1e-12, 'delta con T = 0'); cerca(v.deltaP, 0, 1e-12, 'delta put con T = 0'); cerca(v.gamma, 0, 1e-12, 'gamma con T = 0');
      const w = C.resolver({ ...C.ejemplos[0].sc, S: '100', K: '95', sigma: '0' }); cerca(w.call, 100 - 95 * Math.exp(-0.05), 1e-12, 'call con σ = 0'); cerca(w.put, 0, 1e-12, 'put con σ = 0'); cerca(w.call - w.put, 100 - 95 * Math.exp(-0.05), 1e-12, 'paridad con σ = 0');
      const lim = C.calcula(100, 95, 1, 0.05, 1e-7, 0); cerca(lim.call, C.calcula(100, 95, 1, 0.05, 1e-7, 0).call, 1e-12, 'estable'); cerca(C.calcula(100, 95, 1, 0.05, 1e-4, 0).call, w.call, 1e-6, 'σ → 0 tiende al caso σ = 0'); cerca(C.calcula(100, 95, 1e-6, 0.05, 0.2, 0).call, 5, 1e-3, 'T → 0 tiende al caso T = 0'); }
    // volatilidad implícita: devuelve la σ que dio el precio
    for (const [S, X, T, r, sg, q, t] of [[100, 100, 1, 0.05, 0.2, 0, 'call'], [50, 45, 0.25, 0.03, 0.3, 0, 'put'], [80, 85, 2, 0.04, 0.25, 0.03, 'call'], [30, 30, 0.75, 0.02, 0.6, 0, 'put']]) {
      const o = C.calcula(S, X, T, r, sg, q), P = t === 'call' ? o.call : o.put, iv = C.sigmaImplicita(S, X, T, r, q, t, P); cerca(iv, sg, 1e-9, `σ implícita de la ${t} (S = ${S})`);
    }
    { const v = C.resolver({ modo: 'iv', S: '100', K: '100', T: '1', r: '5', q: '0', tipo: 'call', precio: '10,4506' }); cerca(v.sg, 0.2, 1e-6, 'σ implícita desde la página'); }
    error({ modo: 'iv', S: '100', K: '100', T: '1', r: '5', q: '0', tipo: 'call', precio: '1000' }, 'precio de la call mayor que la acción'); error({ modo: 'iv', S: '100', K: '90', T: '1', r: '5', q: '0', tipo: 'call', precio: '1' }, 'precio por debajo del valor intrínseco (arbitraje)'); error({ modo: 'iv', S: '100', K: '100', T: '0', r: '5', q: '0', tipo: 'call', precio: '5' }, 'σ implícita con T = 0'); error({ modo: 'iv', S: '100', K: '100', T: '1', r: '5', q: '0', tipo: 'call', precio: '' }, 'sin precio de mercado');
    error({ ...C.ejemplos[0].sc, T: '-1' }, 'vencimiento negativo'); error({ ...C.ejemplos[0].sc, sigma: '-5' }, 'volatilidad negativa'); error({ ...C.ejemplos[0].sc, K: '' }, 'sin precio de ejercicio');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, call, put, paridad y griegas (frente a derivadas numéricas), y errores`);
  }
  return Com.navegador({ publico, carpeta: 'black-scholes', nombre: N, app: 'BlackScholesApp', C, pagina, mal, malo: { k: 'sigma', v: '-5' } });
};
