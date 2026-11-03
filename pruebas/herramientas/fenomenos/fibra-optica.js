/* Comprobación de La fibra óptica («Física en la vida real»): los números del modelo (ángulo crítico, apertura numérica,
   atenuación) y el ejercicio que se abre en Reflexión y transmisión (Fresnel), en Node, y la página en Chromium con
   fenomenos/comun.js. La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/fibra-optica ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(`Fibra óptica: ${m}`); };
  const F = require(path.join(fuente, 'fenomenos', 'fibra-optica', 'escena.js'));
  const Fr = require(path.join(fuente, 'fresnel', 'calculo.js'));
  {
    // a mano: sen θc = 1,46/1,48 = 0,986486 ⇒ θc = 80,570°; AN = √(1,48² − 1,46²) = √0,0588 = 0,24249 ⇒ α máx = asin(0,24249) = 14,033°;
    // ángulo con el eje dentro = 90° − θc = 9,430°; vidrio → aire a 30°: sen θ₂ = 1,48·0,5 = 0,74 ⇒ 47,73°;
    // con θ = 85°: n₁ sen θ/n₂ = 1,009850 ⇒ √(s² − 1) = 0,14015 ⇒ d = 1550/(2π·1,46·0,14015) = 1 201 nm;
    // 100 km a 0,2 dB/km = 20 dB ⇒ P = 1 mW · 10⁻² = 10 µW; 4,937 µs/km (1,48/299 792,458 km/s)
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.thc, 80.570, 2e-3, 'ángulo crítico'); cerca(F.datos.AN, 0.24249, 2e-5, 'apertura numérica'); cerca(F.datos.aMax, 14.033, 2e-3, 'semiángulo de aceptación');
    cerca(F.datos.betaMax, 90 - F.datos.thc, 1e-9, 'el ángulo con el eje es 90° − θc'); cerca(F.datos.r0, 47.73, 5e-3, 'refracción vidrio → aire a 30°');
    cerca(F.datos.prof85, 1201, 2, 'profundidad de la onda evanescente (nm)'); cerca(F.datos.dB100, 20, 1e-9, 'pérdidas a 100 km (dB)'); cerca(F.datos.P100, 0.01, 1e-12, 'potencia a 100 km (mW)');
    cerca(F.datos.usPorKm, 4.937, 2e-3, 'retardo por kilómetro (µs)');
    if (F.refl(85) !== 1 || F.refl(81) !== 1) falla('por encima del ángulo crítico la reflectancia debe ser 1');
    if (!(F.refl(78) < 1 && F.refl(60) < 0.01)) falla('por debajo del ángulo crítico debe escaparse luz');
    // el ángulo de entrada máximo da justo el crítico dentro de la fibra: n₁ sen(90° − θc) = sen α máx
    cerca(1.48 * Math.sin((F.datos.betaMax * Math.PI) / 180), Math.sin((F.datos.aMax * Math.PI) / 180), 1e-12, 'apertura: n₁ sen β = sen α');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('faltan pasos, textos o datos');
    // el ejercicio de Fresnel: núcleo → cubierta a 85° es reflexión total con el mismo ángulo crítico
    const s = Fr.resolver(F.ejercicio());
    if (!s.tot) falla('Fresnel: debería haber reflexión total a 85°');
    cerca(s.thc, F.datos.thc, 1e-9, 'Fresnel: ángulo crítico'); cerca(s.prof * 1e9, F.datos.prof85, 0.5, 'Fresnel: profundidad evanescente (nm)');
    if (fallos === antes) console.log('  ✓ Fibra óptica: θc = 80,57°, AN = 0,2425 (±14,03°), onda evanescente de 1,2 µm, 20 dB y 10 µW a 100 km, 6 pasos y el ejercicio de Fresnel');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Fibra óptica', clave: 'fibra-optica',
      nombres: ['Hilo', 'Refracción', 'Crítico', 'Reflexión total', 'Apertura', 'Distancia'],
      prueba: { paso: 3, valor: 70, espera: 'θ = 70° < 80,6°' },
      destino: { href: '../../electromagnetismo/fresnel/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#res').innerText, e = document.querySelector('#error'); return /80,57/.test(r) && /total/i.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Fibra óptica: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Fresnel con los datos, modo oscuro y 390 px');
  };
};
