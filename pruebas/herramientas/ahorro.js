/* Comprobación de Ahorro e inflación: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo ahorro). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Ahorro e inflación';
  const C = require(path.join(fuente, 'ahorro', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: 1.000·1,05²⁰ + 100·s₂₄₀ al i = 1,05^(1/12) − 1, y en euros de hoy entre 1,02²⁰
    const i = 1.05 ** (1 / 12) - 1, vf = 1000 * 1.05 ** 20 + (100 * (1.05 ** 20 - 1)) / i;
    const p = ej('plan'); cerca(p.final, vf, 1e-6, 'saldo del plan'); cerca(p.real, vf / 1.02 ** 20, 1e-6, 'saldo en euros de hoy'); cerca(p.aportado, 1000 + 24000, 1e-9, 'lo aportado');
    cerca(p.rr, 1.05 / 1.02 - 1, 1e-12, 'tipo real de Fisher');
    // aportaciones anuales que suben un 3 %: ∑ 1.200·1,03^(j−1)·1,04^(30−j)
    let s = 0; for (let j = 1; j <= 30; j++) s += 1200 * 1.03 ** (j - 1) * 1.04 ** (30 - j);
    cerca(ej('jubilacion').final, s, 1e-6, 'aportaciones que suben con la inflación');
    cerca(ej('colchon').real, 7440.94, 0.005, 'el colchón (10.000/1,03¹⁰)');
    cerca(ej('poder').real, 1000 / 1.025 ** 20, 1e-9, 'poder adquisitivo de 1.000 €');
    const o = ej('objetivo'); cerca(o.real, 100000, 1e-6, 'el objetivo en euros de hoy se alcanza');
    error({ modo: 'final', c0: '0', a: '100', m: '12', r: '5', pi: '2', n: '0' }, 'plazo 0');
    error({ modo: 'objetivo', c0: '100000', objetivo: '1000', m: '12', r: '5', pi: '2', n: '10' }, 'el capital inicial ya basta');
    error({ modo: 'final', c0: '0', a: 'x', m: '12', r: '5', pi: '2', n: '10' }, 'aportación con letras');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, aportaciones indexadas, objetivo, tipo real y errores`);
  }
  return Com.navegador({ publico, carpeta: 'ahorro', nombre: N, app: 'AhorroApp', C, pagina, mal, malo: { k: 'n', v: '0' } });
};
