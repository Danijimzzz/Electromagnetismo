/* Comprobación de La chispa al tocar el pomo («Física en la vida real»): los números del modelo y el ejercicio que se abre
   en Transitorios, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/chispa-pomo ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'chispa-pomo', 'escena.js'));
  const T = require(path.join(fuente, 'transitorios', 'fisica.js'));
  {
    // a mano: Q = CV = 150 pF · 10 kV = 1,5 µC; τ = RC = 330 · 150 pF = 49,5 ns; I₀ = V/R = 30,30 A; U = ½CV² = 7,5 mJ; d = V/E = 3,33 mm
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Chispa · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.Q * 1e6, 1.5, 1e-9, 'carga (µC)'); cerca(F.datos.tau * 1e9, 49.5, 1e-9, 'τ (ns)'); cerca(F.datos.I0, 30.303, 1e-3, 'I₀ (A)');
    cerca(F.datos.U * 1e3, 7.5, 1e-9, 'energía (mJ)'); cerca(F.datos.d * 1e3, 3.333, 1e-3, 'distancia de la chispa (mm)'); cerca(F.datos.electrones / 1e12, 9.36, 0.01, 'electrones (·10¹²)');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Chispa: faltan pasos, textos o datos');
    // el ejercicio de Transitorios: descarga RC desde 10 kV; en t = 100 ns, V = 10 000·e^(−100/49,5) = 1326,3 V
    const s = T.resolver(F.ejercicio());
    cerca(s.tau * 1e9, 49.5, 1e-6, 'Transitorios: τ (ns)'); cerca(s.I0, -30.303, 1e-3, 'Transitorios: I₀ (A)'); cerca(s.Vct, 1326.29, 0.01, 'Transitorios: V en 100 ns'); cerca(s.Ed * 1e3, 7.5, 1e-6, 'Transitorios: energía (mJ)');
    if (fallos === antes) console.log('  ✓ Chispa del pomo: carga, τ, I₀, energía y distancia de la chispa, 6 pasos y el ejercicio de Transitorios (τ, I₀ y V a los 100 ns)');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Chispa del pomo', clave: 'chispa-pomo',
      nombres: ['Frotamiento', 'Condensador', 'Acercarse', 'Chispa', 'Energía', 'Truco'],
      prueba: { paso: 5, valor: 2, espera: '2,0 kV → la chispa salta a 0,7 mm, con 0,3 mJ: no la notas' },
      destino: { href: '../../circuitos/transitorios/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#res').innerText; return /49,5 ns/.test(r) && /−30,3 A/.test(r) && /1326 V/.test(r) ? '' : r.slice(0, 200); }) } });
    if (fallos === antes) console.log('  ✓ Chispa del pomo: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Transitorios con los datos, modo oscuro y 390 px');
  };
};
