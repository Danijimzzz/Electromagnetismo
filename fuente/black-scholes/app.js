/* =====================================================================
   Interfaz de Black-Scholes: datos de la opción europea, precios de la call y
   de la put con sus griegas, la gráfica del valor de la opción frente al precio
   de la acción (hoy y al vencimiento) y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en
   black-scholes/calculo.js (BlackScholes).
   ===================================================================== */
(() => {
  const B = BlackScholes, { f, dinero, num } = Eco;
  const inf = (x) => (isFinite(x) ? f(x, 5) : isNaN(x) ? '—' : x > 0 ? '+∞' : '−∞');
  Calculadora.monta({
    C: B, carpeta: 'black-scholes', app: 'BlackScholesApp', azar: B.azar, enunciado: B.enunciado,
    nota: 'Opción europea sobre una acción que paga un dividendo continuo q (0 si no paga). Tiempo en años (6 meses = 0,5), tipo, volatilidad y dividendo en %. La gráfica es de la opción que elijas. Admite T = 0 (la opción vale su pago) y σ = 0 (pago seguro, descontado). Con «volatilidad implícita» escribes el precio de mercado de la opción y se calcula la σ que lo explica.',
    campos: (sc) => [
      { k: 'modo', nom: 'Qué quieres calcular', tipo: 'sel', ops: [['valor', 'El precio y las griegas (conozco σ)'], ['iv', 'La volatilidad implícita (conozco el precio)']] },
      { k: 'S', nom: 'Precio de la acción S', un: '€', sep: 'Opción' }, { k: 'K', nom: 'Precio de ejercicio K', un: '€' }, { k: 'T', nom: 'Tiempo al vencimiento T', un: 'años' },
      { k: 'tipo', nom: sc.modo === 'iv' ? 'Tipo de opción' : 'Gráfica de la', tipo: 'sel', ops: [['call', 'Call (opción de compra)'], ['put', 'Put (opción de venta)']] },
      { k: 'r', nom: 'Tipo sin riesgo r', un: '%', sep: 'Mercado' }, sc.modo === 'iv' ? { k: 'precio', nom: 'Precio de mercado de la opción', un: '€' } : { k: 'sigma', nom: 'Volatilidad σ', un: '% anual' }, { k: 'q', nom: 'Dividendo q', un: '%', ayuda: 'opcional' },
    ],
    resumen: (s) => [
      ...(s.modo === 'iv' ? [['Volatilidad implícita σ', `${f(100 * s.sg, 5)} % anual`, true]] : []),
      ['Call', dinero(s.call, 4)], ['Put', dinero(s.put, 4)], ['d₁', inf(s.d1)], ['d₂', inf(s.d2)],
      ['Delta (call / put)', `${f(s.deltaC, 4)} / ${f(s.deltaP, 4)}`], ['Gamma', f(s.gamma, 4)],
      ['Vega (por punto de σ)', dinero(s.vega, 4)], ['Theta por día (call / put)', `${f(s.thetaC, 3)} / ${f(s.thetaP, 3)} €`],
      ['Rho por punto (call / put)', `${f(s.rhoC, 3)} / ${f(s.rhoP, 3)} €`], ['Paridad call-put', Math.abs(s.par) < 1e-8 ? 'se cumple' : `error ${f(s.par, 3)}`],
    ],
    grafica: (s) => {
      const lo = Math.max(0, Math.min(s.S, s.X) * 0.5), hi = Math.max(s.S, s.X) * 1.5, N = 140, xs = Array.from({ length: N + 1 }, (_, i) => lo + ((hi - lo) * i) / N);
      const ahora = xs.map((x) => [x, s.valor(x)]), fin = [[lo, s.valor(lo, 0)], [s.X, 0], [hi, s.valor(hi, 0)]];
      return { x: [lo, hi], y: Eco.rango(ahora.map((p) => p[1]).concat(fin.map((p) => p[1])), { cero: true }), fx: (v) => num(v, 0), fy: (v) => num(v, 1), ejeX: 'Precio de la acción S (€)', ejeY: `Valor de la ${s.opc} (€)`,
        series: [{ pts: fin, color: '--serie-2', discontinua: true }, { pts: ahora, color: '--serie-1' }, { tipo: 'puntos', pts: [[s.S, s.V]], color: '--ink', radio: 5 }],
        verticales: [{ x: s.X, color: '--muted', texto: 'K' }] };
    },
    leyenda: (s) => `<b style="color:var(--serie-1)">Azul</b>: lo que vale la ${s.opc} hoy según Black-Scholes, con el tiempo que le queda. <b style="color:var(--serie-2)">Rojo discontinuo</b>: lo que valdrá al vencimiento (su pago, máx(${s.tipo === 'call' ? 'S − K' : 'K − S'}, 0)). La distancia entre ambas es el valor temporal. Punto: tu opción, ${dinero(s.V, 4)}.`,
  });
})();
