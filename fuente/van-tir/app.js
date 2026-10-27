/* =====================================================================
   Interfaz de VAN, TIR y payback: la inversión, la curva del VAN según la
   tasa de descuento (corta el eje en la TIR), la tabla de flujos y el
   desarrollo. Se monta con Calculadora.monta (calculadora.js); el cálculo
   está en van-tir/calculo.js (VanTir).
   ===================================================================== */
(() => {
  const V = VanTir, { f, dinero, num } = Eco;
  const tp = (x) => `${f(100 * x, 5)} %`, anos = (x) => (x === null ? 'no se recupera' : `${f(x, 4)} años`);
  Calculadora.monta({
    C: V, carpeta: 'van-tir', app: 'VanTirApp',
    nota: 'Los flujos de caja van al final de cada año (cobros menos pagos), separados por espacios; uno negativo es un año con pérdidas. Si el bien se vende al final, suma ese valor al último flujo.',
    campos: () => [
      { k: 'a', nom: 'Desembolso inicial A', un: '€' },
      { k: 'flujos', nom: 'Flujos de caja Q₁, Q₂…', tipo: 'area', filas: 3, ayuda: 'en €, separados por espacios' },
      { k: 'k', nom: 'Tasa de descuento k', un: '%' },
    ],
    resumen: (s) => [['VAN', dinero(s.van)], ['TIR', s.tir === null ? 'no hay' : tp(s.tir)], ['Payback simple', anos(s.pb)], ['Payback descontado', anos(s.pbD)], ['Índice de rentabilidad', f(s.ir, 4)]],
    tabla: (s) => `<table class="tabla-eco"><thead><tr><th>Año</th><th>Flujo</th><th>1/(1 + k)ᵗ</th><th>Actualizado</th><th>Acumulado</th><th>Acum. actualizado</th></tr></thead><tbody><tr><td>0</td><td>${num(-s.A)}</td><td>1</td><td>${num(-s.A)}</td><td>${num(-s.A)}</td><td>${num(-s.A)}</td></tr>${s.filas.map((r) => `<tr><td>${r.t}</td><td>${num(r.q)}</td><td>${r.fa.toFixed(6).replace('.', ',')}</td><td>${num(r.qa)}</td><td>${num(r.ac)}</td><td>${num(r.acD)}</td></tr>`).join('')}</tbody><tfoot><tr><td>VAN</td><td></td><td></td><td>${num(s.van)}</td><td></td><td></td></tr></tfoot></table>`,
    grafica: (s) => {
      const top = Math.max(0.2, 2 * s.k, s.tir !== null && s.tir > 0 ? 1.6 * s.tir : 0), bajo = Math.min(0, s.tir ?? 0, s.k) - (s.tir !== null && s.tir < 0 ? 0.05 : 0);
      const pts = Array.from({ length: 161 }, (_, i) => { const x = bajo + ((top - bajo) * i) / 160; return [100 * x, s.curva(x)]; });
      return { x: [100 * bajo, 100 * top], y: Eco.rango(pts.map((p) => p[1]).concat(0)), fx: (v) => `${Herramienta.txt(f(v))} %`, fy: (v) => num(v, 0), ejeX: 'Tasa de descuento', ejeY: 'VAN (€)',
        series: [{ pts, color: '--serie-1' }, { tipo: 'puntos', pts: [[100 * s.k, s.van]], color: '--serie-2', radio: 5 }, ...(s.tir === null ? [] : [{ tipo: 'puntos', pts: [[100 * s.tir, 0]], color: '--serie-3', radio: 5 }])],
        verticales: s.tir === null ? [] : [{ x: 100 * s.tir, color: '--serie-3', texto: `TIR = ${Herramienta.txt(tp(s.tir))}` }] };
    },
    leyenda: () => '<b>Curva</b>: el VAN con cada tasa de descuento; baja al exigir más rentabilidad. <b>Punto rojo</b>: el VAN con tu tasa k. <b>Punto morado</b>: la TIR, donde el VAN vale 0.',
  });
})();
