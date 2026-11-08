/* Comprobación de VAN, TIR y payback: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo van-tir). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'VAN y TIR';
  const C = require(path.join(fuente, 'van-tir', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: −10.000 + 3.000/1,08 + 4.000/1,08² + 5.000/1,08³ + 2.000/1,08⁴ = 1.646,35 €
    const m = ej('maquina'); cerca(m.van, 1646.35, 0.005, 'VAN de la máquina'); cerca(m.pb, 2.6, 1e-12, 'payback (3.000 + 4.000, faltan 3.000 de 5.000)');
    cerca(C.vanDe(10000, [3000, 4000, 5000, 2000], m.tir), 0, 1e-6, 'el VAN a la TIR'); cerca(m.tir, 0.15322, 1e-5, 'TIR de la máquina');
    // constantes: VAN = −50.000 + 15.000·a₅¬₁₀% = −50.000 + 15.000·3,790787 = 6.861,80 €; payback 50/15 = 3,33 años
    const c = ej('constantes'); cerca(c.van, 6861.80, 0.005, 'VAN con flujos constantes'); cerca(c.pb, 10 / 3, 1e-12, 'payback constante');
    if (!(ej('no-rentable').van < 0) || !(ej('no-rentable').tir < 0.07)) mal(`${N}: la inversión no rentable no sale con VAN < 0 y TIR < k`);
    cerca(ej('tienda').ir, (ej('tienda').van + 30000) / 30000, 1e-12, 'índice de rentabilidad');
    // varias TIR: −1.000 + 4.000/(1+k) − 3.200/(1+k)² = 0 → 1/(1+k) = (4000 ± √3,2·10⁶)/6400
    { const m = ej('tir-multiples'), x1 = (4000 + Math.sqrt(3.2e6)) / 6400, x2 = (4000 - Math.sqrt(3.2e6)) / 6400; cerca(m.todas.length, 2, 0, 'dos TIR'); cerca(m.todas[0], 1 / x1 - 1, 1e-9, 'primera TIR'); cerca(m.todas[1], 1 / x2 - 1, 1e-9, 'segunda TIR'); m.todas.forEach((r) => cerca(C.vanDe(1000, [4000, -3200], r), 0, 1e-6, 'el VAN se anula en cada TIR'));
      if (!m.pasos.some((p) => p.t === 'Varias TIR')) mal(`${N}: falta el aviso de varias TIR`); if (ej('maquina').todas.length !== 1) mal(`${N}: la máquina tiene una sola TIR`);
      // TIRM: (VF de los cobros / VA de los pagos)^(1/n) − 1 con k = 10 %: cobros 4000 (año 1) → 4000·1,1 = 4400 al año 2 ; pagos 1000 + 3200/1,21
      const vf = 4000 * 1.1, va = 1000 + 3200 / 1.21; cerca(m.mir, (vf / va) ** 0.5 - 1, 1e-12, 'TIR modificada'); cerca(ej('maquina').mir, C.tirm([-10000, 3000, 4000, 5000, 2000], 0.08, 0.08), 1e-12, 'TIRM de la máquina');
      // con un solo cambio de signo, la TIRM está entre k y la TIR
      const q = ej('maquina'); if (!(q.mir > 0.08 && q.mir < q.tir)) mal(`${N}: la TIRM debería estar entre k y la TIR`); }
    // comparar A y B: en la tasa de Fisher los dos VAN son iguales
    { const c = ej('comparar'), r = c.B.fisher[0]; cerca(C.npv([-1000, 700, 500, 100], r), C.npv([-1000, 100, 400, 1000], r), 1e-6, 'VAN de A = VAN de B en la tasa de Fisher'); cerca(c.B.van, C.npv([-1000, 100, 400, 1000], 0.08), 1e-9, 'VAN de B');
      if (!(c.B.van > c.van)) mal(`${N}: con k = 8 % (por debajo de Fisher) debería ganar B, que cobra más tarde`); if (!(C.npv([-1000, 700, 500, 100], 0.2) > C.npv([-1000, 100, 400, 1000], 0.2))) mal(`${N}: por encima de Fisher gana A`); if (!(r > 0.08)) mal(`${N}: la tasa de Fisher es mayor que 8 %`); }
    error({ a: '1000', flujos: '500 500', k: '8', a2: '', flujos2: '100 200' }, 'B sin desembolso'); error({ a: '1000', flujos: '500 500', k: '8', a2: '1000', flujos2: '' }, 'B sin flujos');
    error({ a: '0', flujos: '100', k: '5' }, 'sin desembolso');
    error({ a: '100', flujos: '', k: '5' }, 'sin flujos');
    error({ a: '100', flujos: '50 x', k: '5' }, 'un flujo con letras');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, TIR, payback e índice de rentabilidad, y errores`);
  }
  return Com.navegador({ publico, carpeta: 'van-tir', nombre: N, app: 'VanTirApp', C, pagina, mal, malo: { k: 'a', v: '-3' } });
};
