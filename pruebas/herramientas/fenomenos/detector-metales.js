/* Comprobación de El detector de metales («Física en la vida real»): los números del modelo de inducción mutua y el
   ejercicio que se abre en Autoinducción e inducción mutua, en Node, y la página en Chromium con fenomenos/comun.js.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/detector-metales ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'detector-metales', 'escena.js'));
  const Ind = require(path.join(fuente, 'induccion', 'fisica.js'));
  {
    // a mano: M(z) = μ₀π N₁N₂ R² r² / 2(R² + z²)^1,5 con N₁ = 25, N₂ = 1, R = 0,10 m, r = 0,012 m:
    //   numerador = 4π·10⁻⁷ · π · 25 · 0,01 · 1,44·10⁻⁴ = 1,4212·10⁻¹⁰; z = 0: / (2 · 10⁻³) = 71,06 nH;
    //   z = 10 cm: (0,02)^1,5 = 2,8284·10⁻³ ⇒ M = 25,12 nH; z = 20 cm: (0,05)^1,5 = 0,011180 ⇒ 6,356 nH
    // eco ∝ M²: a 10 cm (M/M₀)² = (1/2^1,5)² = 1/8 y a 20 cm (1/5^1,5)² = 1/125
    // dI/dt máx = 2π · 10 000 · 0,5 = 31 415,9 A/s ⇒ ε = 25,124·10⁻⁹ · 31 415,9 = 0,7893 mV; Φ = M · 0,5 = 12,56 nWb
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Detector de metales · ${q}: ${a} en vez de ${b}`); };
    const d = F.datos;
    cerca(d.M0 * 1e9, 71.061, 0.001, 'M en contacto (nH)'); cerca(d.M * 1e9, 25.124, 0.001, 'M a 10 cm (nH)'); cerca(d.mutua(0.2) * 1e9, 6.356, 0.001, 'M a 20 cm (nH)');
    cerca(d.eco10, 1 / 8, 1e-12, 'eco a 10 cm'); cerca(d.eco20, 1 / 125, 1e-12, 'eco a 20 cm');
    cerca(d.DIDT, 31415.93, 0.01, 'dI/dt máx (A/s)'); cerca(d.EPS * 1e3, 0.7893, 0.0001, 'tensión de pico (mV)'); cerca(d.FLUJO * 1e9, 12.562, 0.001, 'flujo (nWb)');
    cerca(d.fem(0.10, 5e3), d.EPS / 2, 1e-12, 'la tensión es proporcional a la frecuencia');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Detector de metales: faltan pasos, textos o datos');
    // el ejercicio: la herramienta de inducción mutua da lo mismo que el fenómeno
    const s = Ind.mutua(F.ejercicio().M);
    cerca(s.res.M, d.M, 1e-12, 'Inducción: M'); cerca(s.res.fem, -d.EPS, 1e-6, 'Inducción: fem inducida (V)'); cerca(s.res.flujo, d.FLUJO, 1e-12, 'Inducción: flujo (Wb)');
    if (fallos === antes) console.log('  ✓ Detector de metales: M a 0, 10 y 20 cm, eco ∝ M² (1/8 y 1/125), tensión de pico, flujo, 6 pasos y el ejercicio de Inducción mutua');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Detector de metales', clave: 'detector-metales',
      nombres: ['Emisora', 'Foucault', 'Eco', 'Profundidad', 'Metales', 'Cálculo'],
      prueba: { paso: 3, valor: 10, espera: '10 cm → M = 25,12 nH, eco del 12,5 % del de contacto' },
      destino: { href: '../../electromagnetismo/induccion/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText.replace(/\s/g, ''), e = document.querySelector('#error'); return /25,12nH/.test(r) && /7,893/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Detector de metales: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Inducción mutua con los datos, modo oscuro y 390 px');
  };
};
