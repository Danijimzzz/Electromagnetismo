/* Comprobación de Física moderna: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo fisica-moderna). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Física moderna';
  const C = require(path.join(fuente, 'fisica-moderna', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: E = 6,626·10⁻³⁴ · 3·10⁸/4·10⁻⁷ = 4,9695·10⁻¹⁹ J = 3,1021 eV; Ec = 3,1021 − 2,28 = 0,8221 eV; v = √(2 · 1,317·10⁻¹⁹/9,109·10⁻³¹) = 5,377·10⁵ m/s
    const s = ej('sodio'); cerca(s.Ef, 4.9695e-19, 1e-23, 'energía del fotón'); cerca(s.Ec, 0.82206, 1e-4, 'Ec máx (eV)'); cerca(s.vmax, 5.377e5, 100, 'v máx'); cerca(s.lam0 * 1e9, 544.2, 0.1, 'λ umbral (nm)');
    if (ej('cobre').emite) mal(`${N}: la luz roja no debería arrancar electrones del cobre`);
    // De Broglie: λ = h/√(2 m e V) = 6,626·10⁻³⁴/√(2 · 9,109·10⁻³¹ · 1,602·10⁻¹⁷) = 1,2265·10⁻¹⁰ m (con la corrección relativista, 1,2264)
    cerca(ej('electron').lam, 6.626e-34 / Math.sqrt(2 * 9.109e-31 * 1.602e-17), 2e-14, 'λ del electrón'); cerca(ej('pelota').lam, 6.626e-34 / 6, 1e-40, 'λ de la pelota'); cerca(ej('pelota').Ec, 120, 1e-9, 'Ec de la pelota');
    // muones: γ = 1/√(1 − 0,998²) = 15,819; Δt = 34,80 µs; d = 0,998 · 3·10⁸ · 34,80·10⁻⁶ = 10,42 km
    const m = ej('muon'); cerca(m.g, 15.8193, 1e-4, 'γ del muon'); cerca(m.t * 1e6, 34.8025, 1e-3, 'Δt (µs)'); cerca(m.d, 10419.86, 0.1, 'distancia (m)');
    cerca(ej('nave').L, 60, 1e-9, 'longitud de la nave');
    // satélite GPS: β = 3874/3·10⁸ = 1,2913·10⁻⁵; γ − 1 = β²/2 = 8,3375·10⁻¹¹; en 86400 s se atrasa 7,2036·10⁻⁶ s
    const gps = C.resolver({ modo: 'dilatacion', uv: 'ms', v: '3874', t0: '86400' }); cerca(gps.dif * 1e6, 7.2038, 1e-3, 'diferencia del satélite GPS (µs)');
    // protón a 0,9c: γ = 2,2942; E0 = 1,673·10⁻²⁷ · 9·10¹⁶ = 1,5057·10⁻¹⁰ J; Ec = 1,2942 · E0
    const p = ej('proton'); cerca(p.E0, 1.5057e-10, 1e-15, 'E0'); cerca(p.Ec, (1 / Math.sqrt(1 - 0.81) - 1) * 1.5057e-10, 1e-15, 'Ec del protón');
    error({ modo: 'dilatacion', uv: 'c', v: '1', t0: '1' }, 'v = c'); error({ modo: 'contraccion', uv: 'ms', v: '4e8', L0: '1' }, 'más rápido que la luz');
    error({ modo: 'debroglie', particula: 'neutron', dato: 'V', valor: '100' }, 'neutrón acelerado con tensión');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, fotoeléctrico con y sin emisión, De Broglie, dilatación, contracción, energía y errores`);
  }
  return Com.navegador({ publico, asignatura: 'fisica', carpeta: 'fisica-moderna', nombre: N, app: 'FisicaModernaApp', C, pagina, mal, malo: { k: 'valor', v: '0' } });
};
