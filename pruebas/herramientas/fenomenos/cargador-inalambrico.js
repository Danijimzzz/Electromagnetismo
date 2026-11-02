/* Comprobación de El cargador inalámbrico («Física en la vida real»): los números del modelo de inducción mutua y el
   ejercicio que se abre en Autoinducción e inducción mutua, en Node, y la página en Chromium con fenomenos/comun.js.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/cargador-inalambrico ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'cargador-inalambrico', 'escena.js'));
  const Ind = require(path.join(fuente, 'induccion', 'fisica.js'));
  {
    // a mano: M = 4π·10⁻⁷ · π · 20 · 20 · (0,03² · 0,01²) / (2 · (0,03² + 0,02²)^1,5)
    //   = 1,579·10⁻³ · 9·10⁻⁸ / (2 · 4,687·10⁻⁵) = 1,516 µH; en z = 0: 2,632 µH; en 5 mm: 2,526 µH; en 40 mm: 0,568 µH
    // dI/dt máx = 2π · 110 000 · 2 = 1,3823·10⁶ A/s ⇒ ε = 1,516·10⁻⁶ · 1,3823·10⁶ = 2,096 V; Φ = M · 2 = 3,032 µWb
    // f₀ = 1/(2π √(10·10⁻⁶ · 210·10⁻⁹)) = 109,83 kHz
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Cargador inalámbrico · ${q}: ${a} en vez de ${b}`); };
    const d = F.datos;
    cerca(d.M * 1e6, 1.516, 0.001, 'M a 2 cm (µH)'); cerca(d.mutua(0) * 1e6, 2.632, 0.001, 'M en contacto (µH)');
    cerca(d.mutua(0.005) * 1e6, 2.526, 0.001, 'M a 5 mm (µH)'); cerca(d.mutua(0.04) * 1e6, 0.568, 0.001, 'M a 40 mm (µH)');
    cerca(d.DIDT, 1.3823e6, 10, 'dI/dt máx (A/s)'); cerca(d.EPS, 2.096, 0.002, 'tensión de pico (V)'); cerca(d.FLUJO * 1e6, 3.032, 0.002, 'flujo (µWb)');
    cerca(d.FRES, 109827, 1, 'frecuencia de resonancia (Hz)'); cerca(1 - d.razon, 0.424, 0.001, 'caída de M a 20 mm');
    cerca(d.fem(0.02, 55e3), d.EPS / 2, 1e-9, 'la tensión es proporcional a la frecuencia');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Cargador inalámbrico: faltan pasos, textos o datos');
    // el ejercicio: la herramienta de inducción mutua da lo mismo que el fenómeno
    const s = Ind.mutua(F.ejercicio().M);
    cerca(s.res.M, d.M, 1e-12, 'Inducción: M'); cerca(s.res.fem, -d.EPS, 0.002, 'Inducción: fem inducida (V)'); cerca(s.res.flujo, d.FLUJO, 1e-9, 'Inducción: flujo (Wb)');
    if (fallos === antes) console.log('  ✓ Cargador inalámbrico: M a 0, 5, 20 y 40 mm, tensión de pico, flujo, resonancia, 6 pasos y el ejercicio de Inducción mutua');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Cargador inalámbrico', clave: 'cargador-inalambrico',
      nombres: ['Emisora', 'Flujo', 'Faraday', 'Resonancia', 'Distancia', 'Cálculo'],
      prueba: { paso: 4, valor: 20, espera: '20 mm → M = 1,52 µH, tensión de pico 2,10 V' },
      destino: { href: '../../electromagnetismo/induccion/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText.replace(/\s/g, ''), e = document.querySelector('#error'); return /1,516|1,52/.test(r) && /2,096|2,1/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Cargador inalámbrico: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Inducción mutua con los datos, modo oscuro y 390 px');
  };
};
