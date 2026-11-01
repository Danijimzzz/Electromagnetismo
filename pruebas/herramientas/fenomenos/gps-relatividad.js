/* Comprobación de El GPS y la relatividad («Física en la vida real»): los números del modelo y el ejercicio que se abre
   en Física moderna, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/gps-relatividad ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'gps-relatividad', 'escena.js'));
  const M = require(path.join(fuente, 'fisica-moderna', 'calculo.js'));
  {
    // a mano: v = √(3,986004·10¹⁴/2,656·10⁷) = 3873,96 m/s; v²/(2c²) = 8,3491·10⁻¹¹ → ·86400 = 7,2136 µs;
    // GM(1/RT − 1/r)/c² = 4,7557·10⁷/8,98755·10¹⁶ = 5,2915·10⁻¹⁰ → 45,718 µs; saldo 38,505 µs; c · 38,505 µs = 11,54 km;
    // 100 m / (11,54 km/día) = 12,5 min; vuelta = 2π r/v = 43 078 s = 11 h 58 min
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`GPS y relatividad · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.v, 3873.96, 0.01, 'velocidad del satélite (m/s)'); cerca(F.datos.sr, 7.2136, 1e-3, 'atraso por la velocidad (µs/día)');
    cerca(F.datos.gr, 45.718, 1e-3, 'adelanto por la gravedad (µs/día)'); cerca(F.datos.saldo, 38.505, 1e-3, 'saldo (µs/día)');
    cerca(F.datos.errKm, 11.54, 0.01, 'error al día (km)'); cerca(F.datos.minCien, 12.5, 0.05, 'minutos para 100 m'); cerca(F.datos.T / 3600, 11.966, 0.001, 'periodo (h)');
    cerca(F.datos.mU, 299.79, 0.01, 'metros por µs'); cerca(F.datos.hCero, 3185, 5, 'altura donde se compensan (km)');
    cerca(F.srDia(7748), 4 * F.srDia(3874), 0.01, 'el atraso crece con v²');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('GPS y relatividad: faltan pasos, textos o datos');
    // el ejercicio de Física moderna: Δt − Δt₀ = (γ − 1) Δt₀ con c = 3·10⁸ = 7,2038 µs
    const s = M.resolver(F.ejercicio());
    cerca(s.dif * 1e6, 7.2038, 1e-3, 'Física moderna: diferencia de los relojes (µs)');
    if (fallos === antes) console.log('  ✓ GPS y relatividad: velocidad, atraso, adelanto, saldo, error al día, periodo, 6 pasos y el ejercicio de Física moderna');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'GPS y relatividad', clave: 'gps-relatividad',
      nombres: ['GPS', 'Relojes', 'Velocidad', 'Gravedad', 'Saldo', 'Error'],
      prueba: { paso: 2, valor: 7748, espera: '28,9 µs al día' },
      destino: { href: '../../fisica/fisica-moderna/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#resumen').innerText, e = document.querySelector('#error'); return /7,204/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ GPS y relatividad: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Física moderna con los datos, modo oscuro y 390 px');
  };
};
