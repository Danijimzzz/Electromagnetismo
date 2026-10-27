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
    error({ a: '0', flujos: '100', k: '5' }, 'sin desembolso');
    error({ a: '100', flujos: '', k: '5' }, 'sin flujos');
    error({ a: '100', flujos: '50 x', k: '5' }, 'un flujo con letras');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, TIR, payback e índice de rentabilidad, y errores`);
  }
  return Com.navegador({ publico, carpeta: 'van-tir', nombre: N, app: 'VanTirApp', C, pagina, mal, malo: { k: 'a', v: '-3' } });
};
