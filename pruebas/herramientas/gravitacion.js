/* Comprobación de Gravitación y órbitas: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo gravitacion). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Gravitación';
  const C = require(path.join(fuente, 'gravitacion', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // G = 6,6743e-11; Tierra–Luna: F = G·5,972e24·7,342e22/(3,844e8)² = 1,98049e20 N; g₁ = G·5,972e24/(3,844e8)² = 2,69748e-3
    const fz = ej('tierra-luna'); cerca(fz.F / 1e20, 1.98049, 1e-4, 'F Tierra–Luna'); cerca(fz.g1 * 1e3, 2.69748, 1e-4, 'campo de la Tierra'); cerca(fz.Fr(2 * fz.r) / fz.F, 0.25, 1e-12, 'F(2r) = F/4');
    // μ = 3,98589e14; ISS: r = 6779 km, v = √(μ/r) = 7667,96 m/s, T = 2πr/v = 5554,76 s, E = −μm/2r = −1,23475e13 J
    const s = ej('iss'); cerca(s.v, 7667.96, 0.01, 'v ISS'); cerca(s.T, 5554.76, 0.01, 'T ISS'); cerca(s.E / 1e13, -1.23475, 1e-4, 'E ISS'); cerca(s.Ec + s.Ep, s.E, 1, 'Ec + Ep'); cerca(s.vesc / s.v, Math.SQRT2, 1e-12, 'v_esc = √2 v');
    // escape de la Tierra: √(2μ/R) = 11185,98 m/s; de la Luna: 2375,06 m/s
    cerca(ej('escape-tierra').vesc, 11185.98, 0.01, 'escape Tierra'); cerca(ej('escape-luna').vesc, 2375.06, 0.01, 'escape Luna');
    // geoestacionaria: r = 42163,8 km, h = 35792,8 km, v = 3074,63 m/s
    const g = ej('geoestacionaria'); cerca(g.r / 1e3, 42163.8, 0.1, 'r geoestacionaria'); cerca(g.h / 1e3, 35792.8, 0.1, 'h geoestacionaria'); cerca(g.v, 3074.63, 0.01, 'v geoestacionaria');
    cerca(ej('fobos').r / 1e3, 9373.9, 0.1, 'r de Fobos');
    // Halley: T = 2π√(a³/μ_sol) = 2,37624e9 s (75,30 años), r_p = 0,5866 UA = 8,76639e10 m, v_p = 54,579 km/s, v_a = 0,9117 km/s
    const h = ej('halley'); cerca(h.T / 3.15576e7, 75.30, 0.01, 'periodo del Halley'); cerca(h.rp / 1e9, 87.664, 1e-3, 'perihelio'); cerca(h.vp / 1e3, 54.579, 1e-3, 'v_p'); cerca(h.va, 911.72, 0.01, 'v_a');
    cerca(h.rp * h.vp, h.ra * h.va, 1e-3 * h.rp * h.vp, 'r_p v_p = r_a v_a'); cerca(h.v, Math.sqrt(h.mu * (2 / h.r - 1 / h.a)), 1e-6, 'vis-viva'); cerca(h.areal * h.T, Math.PI * h.a * h.b, 1e-4 * Math.PI * h.a * h.b, 'área de la elipse');
    // Tierra: a = 1,496e8 km, e = 0,029/1,496e... = (1,521 − 1,471)/(1,521 + 1,471) = 0,016711; T = 365,2 días
    const t = ej('tierra-sol'); cerca(t.e, 0.016711, 1e-6, 'excentricidad de la Tierra'); cerca(t.T / 86400, 365.22, 0.01, 'año de la Tierra'); cerca(t.vp / 1e3, 30.291, 1e-3, 'v en el perihelio');
    error({ modo: 'fuerza', m1: '0', m2: '1', r: '1' }, 'masa cero'); error({ modo: 'satelite', cuerpo: 'tierra', h: '-5', m: '1' }, 'altura negativa'); error({ modo: 'kepler', cuerpo: 'sol', datos: 'ae', a: '1e8', e: '1' }, 'excentricidad 1');
    error({ modo: 'kepler', cuerpo: 'sol', datos: 'pa', rp: '2e8', ra: '1e8' }, 'apoastro menor que periastro'); error({ modo: 'periodo', cuerpo: 'otro', T: '5' }, 'cuerpo sin masa');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (Newton, satélite, escape, geoestacionaria y Kepler) y errores`);
  }
  return Com.navegador({ publico, asignatura: 'fisica', carpeta: 'gravitacion', nombre: N, app: 'GravitacionApp', C, pagina, mal, malo: { k: 'r', v: '0' }, extra: undefined });
};
