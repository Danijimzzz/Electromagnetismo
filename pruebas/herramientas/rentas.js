/* Comprobación de Rentas y anualidades: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo rentas). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Rentas';
  const C = require(path.join(fuente, 'rentas', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: a₁₀¬₅% = 7,721735 ⇒ 7.721,73 €; cuota = 20.000·0,04/(1 − 1,04⁻⁵) = 4.492,54 €; 600/0,04 = 15.000 €
    cerca(ej('va').va, 7721.73, 0.005, 'valor actual a 10 años'); cerca(ej('cuota').c, 4492.54, 0.005, 'cuota del préstamo'); cerca(ej('perpetua').va, 15000, 1e-6, 'perpetua');
    // diferida: 1.500·a₈¬₆%·1,06⁻³ = 1.500·6,209794·0,839619
    cerca(ej('diferida').va, 1500 * 6.2097938 * 0.8396193, 0.01, 'renta diferida');
    // plan mensual prepagable: i₁₂ = 1,03^(1/12) − 1 y Vₙ = 200·s₆₀·(1 + i₁₂)
    const i = 1.03 ** (1 / 12) - 1; cerca(ej('plan').vf, 200 * ((1 + i) ** 60 - 1) / i * (1 + i), 1e-6, 'plan de ahorro mensual');
    cerca(ej('cuantos').n, -Math.log(1 - 0.375) / Math.log(1.05), 1e-9, 'número de anualidades');
    cerca(C.resolver({ modo: 'termino', pago: 'pos', duracion: 'temporal', conocido: 'vf', vf: '12577,89', n: '10', i: '5', m: '1' }).c, 1000, 0.001, 'término a partir del valor final');
    // aritmética: suma directa de C + (k−1)h descontada; geométrica igual con C·q^(k−1)
    { const i5 = 0.05, suma = (t) => Array.from({ length: 10 }, (_, k) => t(k + 1) / (1 + i5) ** (k + 1)).reduce((x, y) => x + y, 0);
      cerca(ej('aritmetica').va, suma((k) => 1000 + 100 * (k - 1)), 1e-6, 'renta aritmética');
      cerca(ej('geometrica').vf, suma((k) => 1000 * 1.03 ** (k - 1)) * 1.05 ** 10, 1e-6, 'renta geométrica (valor final)');
      cerca(C.resolver({ modo: 'va', pago: 'pre', duracion: 'temporal', variacion: 'geom', g: '5', c: '1000', n: '10', i: '5', m: '1', d: '2' }).va, 1000 * 10 / 1.05 * 1.05 / 1.05 ** 2, 1e-6, 'geométrica con q = 1 + i, prepagable y diferida');
      error({ modo: 'va', pago: 'pos', variacion: 'arit', h: '-200', c: '1000', n: '10', i: '5', m: '1' }, 'términos negativos'); }
    error({ modo: 'n', pago: 'pos', c: '100', va: '5000', i: '5', m: '1' }, 'un término que no cubre los intereses');
    error({ modo: 'va', pago: 'pos', duracion: 'temporal', c: '100', n: '2,5', i: '5', m: '1' }, 'un número de términos no entero');
    error({ modo: 'va', pago: 'pos', duracion: 'temporal', c: '100', n: '5', i: '0', m: '1' }, 'un tipo cero');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, prepagable, diferida, perpetua y errores`);
  }
  return Com.navegador({ publico, carpeta: 'rentas', nombre: N, app: 'RentasApp', C, pagina, mal, malo: { k: 'c', v: 'abc' } });
};
