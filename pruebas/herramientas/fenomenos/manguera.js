/* Comprobación de Tapar la manguera con el dedo («Física en la vida real»): los números del modelo y el ejercicio que se
   abre en Fluidos, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/manguera ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'manguera', 'escena.js'));
  const Fl = require(path.join(fuente, 'fluidos', 'fisica.js'));
  {
    // a mano: A₁ = π·0,008² = 2,0106 cm²; v₁ = 0,2·10⁻³/A₁ = 0,9947 m/s; v₂ = v₁·(16/7)² = 5,1969 m/s; t = √(2/9,8) = 0,4518 s;
    // x = v t: 0,449 m y 2,348 m; Δp = 500·(v₂² − v₁²) = 13009 Pa; a 45° desde el suelo v²/g = 2,756 m
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Manguera · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.A1 * 1e4, 2.0106, 1e-4, 'A₁ (cm²)'); cerca(F.datos.v1, 0.9947, 1e-4, 'v₁ (m/s)'); cerca(F.datos.v2, 5.1969, 1e-4, 'v₂ (m/s)');
    cerca(F.datos.vuelo, 0.4518, 1e-4, 'tiempo de caída (s)'); cerca(F.datos.x1, 0.4494, 1e-4, 'alcance sin dedo (m)'); cerca(F.datos.x2, 2.3477, 1e-4, 'alcance con el dedo (m)');
    cerca(F.datos.dp, 13009.1, 0.1, 'Δp (Pa)'); cerca(F.datos.r45, 2.7559, 1e-4, 'alcance a 45° (m)'); cerca(F.datos.hmax, 1.3779, 1e-4, 'altura vertical (m)');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Manguera: faltan pasos, textos o datos');
    // el ejercicio de Fluidos: Bernoulli con el caudal, y el agua sale a la presión del aire
    const s = Fl.resolver(F.ejercicio());
    cerca(s.v2, F.datos.v2, 1e-9, 'Fluidos: v₂'); cerca(s.p1 - s.p2, F.datos.dp, 1e-6, 'Fluidos: Δp'); cerca(s.p2, 1e5, 20, 'Fluidos: presión a la salida');
    if (fallos === antes) console.log('  ✓ Manguera: secciones, velocidades, tiempo de caída, alcances, Δp de Bernoulli, alcance a 45°, 6 pasos y el ejercicio de Fluidos');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Manguera', clave: 'manguera',
      nombres: ['Manguera', 'Caudal', 'Dedo', 'Alcance', 'Presión', 'Ángulo'],
      prueba: { paso: 3, valor: 5, espera: '5,0 mm → v = 10,19 m/s, alcance 4,60 m' },
      destino: { href: '../../fisica/fluidos/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#resumen').innerText, e = document.querySelector('#error'); return /5,197/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 200); }) } });
    if (fallos === antes) console.log('  ✓ Manguera: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Fluidos con los datos, modo oscuro y 390 px');
  };
};
