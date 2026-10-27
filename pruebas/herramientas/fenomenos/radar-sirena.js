/* Comprobación de El radar de tráfico y la sirena («Física en la vida real»): los números del modelo y el eco que se abre
   en Efecto Doppler, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/radar-sirena ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'radar-sirena', 'escena.js'));
  const D = require(path.join(fuente, 'doppler', 'fisica.js'));
  {
    // a mano: 700·340/315 = 755,56 Hz; 700·340/365 = 652,05 Hz; 315/700 = 0,45 m; Δf = 2·33·24·10⁹/(3·10⁸ − 33) ≈ 5280 Hz; 1 km/h ≈ 44,4 Hz
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Radar y sirena · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.f1, 755.556, 1e-3, 'f al acercarse (Hz)'); cerca(F.datos.f2, 652.055, 1e-3, 'f al alejarse (Hz)'); cerca(F.datos.lam1, 0.45, 1e-12, 'λ delante (m)');
    cerca(F.datos.f1 - F.datos.f2, 103.5, 0.05, 'salto al pasar (Hz)'); cerca(F.datos.semitonos, 2.55, 0.01, 'semitonos');
    cerca(F.datos.df, 5280, 0.01, 'Δf del eco (Hz)'); cerca(F.datos.porKmh, 44.44, 0.01, 'Hz por km/h'); cerca(F.datos.lamR, 0.0125, 1e-12, 'λ del radar (m)');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Radar y sirena: faltan pasos, textos o datos');
    // el ejercicio de Efecto Doppler: el eco en el coche
    const s = D.resolver(F.ejercicio());
    cerca(s.df, 5280, 0.01, 'Doppler: Δf del eco (Hz)');
    if (fallos === antes) console.log('  ✓ Radar y sirena: frecuencias al acercarse y al alejarse, λ, semitonos, Δf del eco, 6 pasos y el ejercicio de Efecto Doppler');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Radar y sirena', clave: 'radar-sirena',
      nombres: ['Sirena', 'Delante', 'Detrás', 'Radar', 'Eco', 'Velocidad'],
      prueba: { paso: 4, valor: 72, espera: '72 km/h → Δf = 3200 Hz' },
      destino: { href: '../../fisica/doppler/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#resumen').innerText, e = document.querySelector('#error'); return /5280/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 200); }) } });
    if (fallos === antes) console.log('  ✓ Radar y sirena: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Efecto Doppler con los datos, modo oscuro y 390 px');
  };
};
