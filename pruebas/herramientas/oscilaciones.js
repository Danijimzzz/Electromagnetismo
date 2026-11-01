/* Comprobación de Oscilaciones: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo oscilaciones). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Oscilaciones';
  const C = require(path.join(fuente, 'oscilaciones', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // muelle: ω = √(200/0,5) = 20 rad/s; T = 0,31416 s; vmáx = 2 m/s; amáx = 40 m/s²; E = ½·200·0,1² = 1 J; x(0,05) = 0,1 cos 1 = 0,054030; v = −2 sin 1 = −1,68294
    const m = ej('muelle'); cerca(m.w, 20, 1e-12, 'ω'); cerca(m.T, 0.314159, 1e-6, 'T'); cerca(m.vmax, 2, 1e-12, 'v máx'); cerca(m.amax, 40, 1e-12, 'a máx'); cerca(m.E, 1, 1e-12, 'E');
    cerca(m.x, 0.0540302, 1e-6, 'x(t)'); cerca(m.v, -1.682942, 1e-5, 'v(t)'); cerca(m.Ep + m.Ec, 1, 1e-9, 'Ep + Ec = E');
    // x₀ = 0,04, v₀ = 0,6, ω = 20: A = √(0,04² + 0,03²) = 0,05 m
    cerca(ej('muelle-xv').A, 0.05, 1e-12, 'amplitud desde x₀ y v₀');
    // péndulo de 1 m con g = 9,8: ω = 3,130495; T₀ = 2,00709 s; exacto ≈ T₀(1 + θ²/16 + 11θ⁴/3072) con θ = 10° = 0,174533 rad → 2,01092 s
    const p = ej('pendulo'); cerca(p.w, Math.sqrt(9.8), 1e-12, 'ω del péndulo'); cerca(p.T, 2.007092, 1e-5, 'T del péndulo'); cerca(p.Texacto, 2.007092 * (1 + 0.174533 ** 2 / 16 + 11 * 0.174533 ** 4 / 3072), 1e-4, 'periodo exacto');
    // subamortiguado: ω₀ = 10, γ = 1, ω_d = √99 = 9,949874, Q = 5, δ = 2π/9,949874 = 0,631479, τ = 1 s
    const s = ej('sub'); cerca(s.wd, 9.949874, 1e-6, 'ω_d'); cerca(s.Q, 5, 1e-12, 'Q'); cerca(s.dl, 0.631479, 1e-5, 'decremento'); cerca(s.tau, 1, 1e-12, 'τ'); cerca(s.x(0), 0.2, 1e-12, 'x(0)');
    cerca(s.x(1), Math.exp(-1) * (0.2 * Math.cos(Math.sqrt(99)) + (0.2 / Math.sqrt(99)) * Math.sin(Math.sqrt(99))), 1e-9, 'x(1)');
    // crítico: x = 0,2 (1 + 10 t) e^(−10 t) → x(0,1) = 0,4/e = 0,147152
    const c = ej('critico'); if (c.caso !== 'crit') mal(`${N}: b = 20 debería ser crítico`); cerca(c.x(0.1), 0.4 / Math.E, 1e-9, 'x crítico');
    // sobreamortiguado: γ = 25, √(625 − 100) = 22,912878 → r₁ = −2,087122, r₂ = −47,912878; x(0) = 0,2 y x′(0) = 0
    const o = ej('sobre'); if (o.caso !== 'sobre') mal(`${N}: b = 50 debería ser sobreamortiguado`); cerca(o.r1, -2.087122, 1e-6, 'r₁'); cerca(o.r2, -47.912878, 1e-6, 'r₂'); cerca(o.x(0), 0.2, 1e-12, 'x(0) sobre'); cerca((o.x(1e-6) - o.x(0)) / 1e-6, 0, 1e-3, 'x′(0) sobre');
    // forzado en resonancia: A = (5/1)/√(0 + 20²) = 0,25 m, δ = 90°; ω_r = √98 = 9,899495, A_máx = 5/(2·√99) = 0,251259
    const r = ej('resonancia'); cerca(r.A, 0.25, 1e-12, 'A en resonancia'); cerca(r.delta, Math.PI / 2, 1e-12, 'δ = 90°'); cerca(r.wr, 9.899495, 1e-6, 'ω_r'); cerca(r.Amax, 0.251259, 1e-6, 'A máx'); cerca(r.Q, 5, 1e-12, 'Q forzado');
    // ω = 5: A = 5/√(75² + 10²) = 0,066079; δ = atan(10/75) = 0,132552
    const l = ej('fuera'); cerca(l.A, 5 / Math.hypot(75, 10), 1e-12, 'A fuera'); cerca(l.delta, Math.atan(10 / 75), 1e-12, 'δ fuera');
    error({ modo: 'mas', sistema: 'muelle', m: '0', k: '100', ini: 'af', A: '1' }, 'masa cero'); error({ modo: 'mas', sistema: 'pendulo', m: '1', L: '1', g: '9,8', A: '180' }, 'péndulo a 180°');
    error({ modo: 'amortiguado', m: '1', k: '100', b: '0', x0: '1' }, 'rozamiento cero'); error({ modo: 'forzado', m: '1', k: '100', b: '2', F0: '1', w: '-3' }, 'ω negativa');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (MAS, péndulo, tres amortiguamientos y resonancia) y errores`);
  }
  return Com.navegador({ publico, asignatura: 'fisica', carpeta: 'oscilaciones', nombre: N, app: 'OscilacionesApp', C, pagina, mal, malo: { k: 'm', v: '0' } });
};
