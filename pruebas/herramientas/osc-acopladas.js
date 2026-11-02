/* Comprobación de Oscilaciones acopladas: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo osc-acopladas). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Oscilaciones acopladas';
  const C = require(path.join(fuente, 'osc-acopladas', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // iguales: A = D = 110, B = C = −10 → ω² = 100 y 120; modos (1, 1) y (1, −1); soltando x₁ = 0,1: q₁ = q₂ = 0,05
    const a = ej('iguales'); cerca(a.w1, 10, 1e-12, 'ω₁'); cerca(a.w2, Math.sqrt(120), 1e-12, 'ω₂'); cerca(a.r1, 1, 1e-12, 'modo 1'); cerca(a.r2, -1, 1e-12, 'modo 2');
    cerca(a.q1, 0.05, 1e-12, 'q₁'); cerca(a.q2, 0.05, 1e-12, 'q₂');
    const w2 = Math.sqrt(120), c1 = Math.cos(10 * 0.5), c2 = Math.cos(w2 * 0.5);
    cerca(a.xa, 0.05 * (c1 + c2), 1e-12, 'x₁(t)'); cerca(a.xb, 0.05 * (c1 - c2), 1e-12, 'x₂(t)');
    cerca(a.E, 0.55, 1e-12, 'energía'); cerca(a.Ttrans, Math.PI / (w2 - 10), 1e-9, 'tiempo de transferencia'); cerca(a.Tbat, (2 * Math.PI) / (w2 - 10), 1e-9, 'periodo del batido');
    // modos puros: la razón x₂/x₁ no cambia
    const m1 = ej('modo1'); cerca(m1.xb, m1.xa, 1e-12, 'modo 1 puro'); cerca(m1.xa, 0.1 * Math.cos(10 * 0.3), 1e-12, 'x₁ del modo 1');
    const m2 = ej('modo2'); cerca(m2.xb, -m2.xa, 1e-12, 'modo 2 puro'); cerca(m2.xa, 0.1 * Math.cos(w2 * 0.3), 1e-12, 'x₁ del modo 2');
    // carros (2 kg y 1 kg, k₁ = 100, kc = 50, k₂ = 0): A = 75, B = −25, C = −50, D = 50 → ω² = 25 y 100, modos (1, 2) y (1, −1)
    const c = ej('carros'); cerca(c.w1, 5, 1e-12, 'ω₁ carros'); cerca(c.w2, 10, 1e-12, 'ω₂ carros'); cerca(c.r1, 2, 1e-12, 'modo 1 carros'); cerca(c.r2, -1, 1e-12, 'modo 2 carros');
    cerca(c.q1, 0.1 / 3, 1e-12, 'q₁ carros'); cerca(c.q2, 0.2 / 3, 1e-12, 'q₂ carros'); cerca(c.E, 0.75, 1e-12, 'energía carros'); cerca(c.x(0)[0], 0.1, 1e-12, 'x₁(0)'); cerca(c.x(0)[1], 0, 1e-12, 'x₂(0)');
    // golpe: parte de x = 0 con v₂ = 1; la velocidad en 0 coincide con la dada y la energía es la inicial, ½·1·1² = 0,5
    const g = ej('golpe'); cerca(g.v(0)[0], 0, 1e-12, 'v₁(0)'); cerca(g.v(0)[1], 1, 1e-12, 'v₂(0)'); cerca(g.x(0)[1], 0, 1e-12, 'x₂(0) golpe'); cerca(g.E, 0.5, 1e-12, 'energía golpe');
    const E = (t) => { const [x1, x2] = g.x(t), [v1, v2] = g.v(t); return 0.5 * g.m1 * v1 * v1 + 0.5 * g.m2 * v2 * v2 + 0.5 * g.k1 * x1 * x1 + 0.5 * g.kc * (x2 - x1) ** 2 + 0.5 * g.k2 * x2 * x2; };
    cerca(E(0.37), 0.5, 1e-9, 'la energía se conserva');
    error({ m1: '1', m2: '1', k1: '0', kc: '10', k2: '0', x10: '0,1' }, 'sin muelles a la pared'); error({ m1: '0', m2: '1', k1: '1', kc: '10', k2: '1', x10: '0,1' }, 'masa cero');
    error({ m1: '1', m2: '1', k1: '1', kc: '0', k2: '1', x10: '0,1' }, 'sin acoplo'); error({ m1: '1', m2: '1', k1: '1', kc: '1', k2: '1' }, 'todo en reposo');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (modos, batido, modos puros, carros y energía) y errores`);
  }
  return Com.navegador({ publico, asignatura: 'fisica', carpeta: 'osc-acopladas', nombre: N, app: 'OscAcopladasApp', C, pagina, mal, malo: { k: 'm1', v: '0' } });
};
