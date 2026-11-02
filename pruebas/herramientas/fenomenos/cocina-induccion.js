/* Comprobación de La cocina de inducción («Física en la vida real»): los números del modelo y el ejercicio que se abre en
   Inducción: Faraday y Lenz, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/cocina-induccion ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const C = require(path.join(fuente, 'fenomenos', 'cocina-induccion', 'escena.js'));
  const Fa = require(path.join(fuente, 'faraday', 'fisica.js'));
  {
    // a mano: S = π·0,08² = 0,020106 m²; ω = 2π·25000 = 157 080 rad/s; ε₀ = 3·10⁻³ · 0,020106 · 157 080 = 9,4748 V; ε_ef = 6,6997 V;
    // R = 10⁻⁷ · 2π·0,08 / (2·10⁻⁶) = 0,025133 Ω; I₀ = 376,99 A; P = 6,6997² / 0,025133 = 1785,96 W; a 50 Hz: P·(50/25000)² = 7,14 mW
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Cocina de inducción · ${q}: ${a} en vez de ${b}`); };
    cerca(C.datos.S, 0.0201062, 1e-7, 'S (m²)'); cerca(C.datos.epsPico, 9.4748, 1e-3, 'fem de pico (V)'); cerca(C.datos.epsEf, 6.6997, 1e-3, 'fem eficaz (V)');
    cerca(C.datos.R, 0.025133, 1e-6, 'R (Ω)'); cerca(C.datos.Ipico, 376.99, 0.01, 'corriente de pico (A)'); cerca(C.datos.P, 1785.96, 0.05, 'potencia (W)');
    cerca(C.datos.P50 * 1e3, 7.1438, 1e-3, 'potencia a 50 Hz (mW)'); cerca(C.potencia(10), 285.75, 0.01, 'potencia a 10 kHz'); cerca(C.datos.caida, 0.3193, 1e-3, 'caída libre de 50 cm (s)');
    if (C.pasos.length !== 6 || C.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Cocina de inducción: faltan pasos, textos o datos');
    // el ejercicio de Faraday: la misma fem de pico (en t = 0) y la misma corriente
    const s = Fa.resolver(C.ejercicio());
    cerca(Math.abs(s.eps), C.datos.epsPico, 1e-3, 'Faraday: fem'); cerca(Math.abs(s.I), C.datos.Ipico, 0.2, 'Faraday: corriente');
    if (fallos === antes) console.log('  ✓ Cocina de inducción: fem, corriente de Foucault, potencia Joule (P ∝ f²), 6 pasos y el ejercicio de Faraday y Lenz');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Cocina de inducción', clave: 'cocina-induccion',
      nombres: ['Sartén', 'Bobina', 'Faraday', 'Foucault', 'Calor', 'Imán'],
      prueba: { paso: 4, valor: 10, espera: '10 kHz → 286 W de potencia en la base' },
      destino: { href: '../../electromagnetismo/faraday/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText, e = document.querySelector('#error'); return /9,47/.test(r.replace(/\s/g, '')) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Cocina de inducción: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Faraday y Lenz con los datos, modo oscuro y 390 px');
  };
};
