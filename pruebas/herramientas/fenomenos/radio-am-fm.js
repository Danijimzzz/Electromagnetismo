/* Comprobación de La radio AM y FM («Física en la vida real»): los números del modelo (resonancia, Q, atenuación de la
   emisora vecina, longitudes de onda y constante RC del detector) y el ejercicio que se abre en Diagramas de Bode y filtros,
   en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/radio-am-fm ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  global.Herramienta = global.Herramienta || require(path.join(fuente, 'herramienta.js'));
  const R = require(path.join(fuente, 'fenomenos', 'radio-am-fm', 'escena.js'));
  const Bo = require(path.join(fuente, 'bode', 'calculo.js'));
  {
    // a mano: f₀ = 1/(2π√(253,3·10⁻⁶ · 10⁻¹⁰)) = 1/(2π·1,59155·10⁻⁷) = 1000,006 kHz; Q = ω₀L/R = 2π·1,000006·10⁶·253,3·10⁻⁶/10 = 159,154;
    // Δf = f₀/Q = 6,2833 kHz; a f₀ + 9 kHz: x = 1009,006/1000,006 − 1000,006/1009,006 = 0,017920, Q·x = 2,8521, |H| = 1/√(1 + 8,1345) = 0,33086 (−9,607 dB);
    // λ = c/f: 3·10⁸/10⁶ = 300 m, /10³ = 300 km, /98,5·10⁶ = 3,0457 m; τ = 10⁴ · 2,2·10⁻⁹ = 22 µs; con C = 356 pF: f₀ = 1000,006·√(100/356) = 530,0 kHz
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Radio AM/FM · ${q}: ${a} en vez de ${b}`); };
    cerca(R.datos.f0, 1000.006, 0.01, 'f₀ (kHz)'); cerca(R.datos.Q0, 159.154, 0.01, 'Q'); cerca(R.datos.BW0, 6.2833, 1e-3, 'ancho de banda (kHz)');
    cerca(R.datos.g9, 0.33086, 1e-4, 'ganancia a 9 kHz'); cerca(R.datos.g9dB, -9.607, 0.005, 'atenuación a 9 kHz (dB)');
    cerca(R.datos.lamAM, 300, 1e-9, 'λ de 1 MHz (m)'); cerca(R.datos.lamAudio, 3e5, 1e-6, 'λ de 1 kHz (m)'); cerca(R.datos.lamFM, 3.0457, 1e-3, 'λ a 98,5 MHz (m)');
    cerca(R.datos.tau * 1e6, 22, 1e-9, 'RC del detector (µs)'); cerca(R.f0De(356), 530.0, 0.1, 'f₀ con 356 pF (kHz)'); cerca(R.f0De(100), 1000.006, 0.01, 'f₀ con 100 pF (kHz)');
    if (R.cercana(R.f0De(100))?.n !== 'B' || R.cercana(R.f0De(200))) falla('Radio AM/FM: la emisora sintonizada no sale bien');
    if (R.pasos.length !== 6 || R.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Radio AM/FM: faltan pasos, textos o datos');
    // el ejercicio de Bode: el mismo f₀, la misma Q y la misma atenuación a 1009 kHz
    const s = Bo.resolver(R.ejercicio());
    cerca(s.f0 / 1e3, R.datos.f0, 0.01, 'Bode: f₀'); cerca(s.Q, R.datos.Q0, 0.01, 'Bode: Q'); cerca(s.punto.mod, R.datos.g9, 2e-3, 'Bode: |H| a 1009 kHz'); cerca(s.punto.dB, R.datos.g9dB, 0.02, 'Bode: dB a 1009 kHz');
    if (fallos === antes) console.log('  ✓ Radio AM y FM: resonancia f₀ = 1/2π√LC, Q, atenuación de la vecina, λ = c/f, RC del detector, 6 pasos y el ejercicio de Bode');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Radio AM y FM', clave: 'radio-am-fm',
      nombres: ['Emisoras', 'Portadora', 'AM', 'FM', 'Sintonía', 'Detector'],
      prueba: { paso: 4, valor: 356, espera: 'C = 356 pF → 530 kHz' },
      destino: { href: '../../circuitos/bode/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText, e = document.querySelector('#error'); return /159,2/.test(r) && /9,60/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Radio AM y FM: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Bode con los datos, modo oscuro y 390 px');
  };
};
