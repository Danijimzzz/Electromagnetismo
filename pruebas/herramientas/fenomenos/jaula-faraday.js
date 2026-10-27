/* Comprobación de La jaula de Faraday («Física en la vida real»): los números del modelo y el ejercicio que se abre en
   Ondas electromagnéticas, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/jaula-faraday ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'jaula-faraday', 'escena.js'));
  const O = require(path.join(fuente, 'ondas-em', 'fisica.js'));
  {
    // a mano: δ = 1/√(π · 9·10⁸ · 4π·10⁻⁷ · 3,5·10⁷) = 1/√(1,2435·10¹¹) = 2,836 µm; 1 mm / δ = 352,6; e^(−10/2,836) = 2,94 %
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Jaula de Faraday · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.delta * 1e6, 2.8357, 1e-3, 'δ (µm)'); cerca(F.datos.vecesDelta, 352.64, 0.01, 'chapa / δ'); cerca(F.queda(10e-6), 0.02941, 1e-4, 'lo que queda a 10 µm'); cerca(F.datos.lam, 1 / 3, 1e-12, 'λ del móvil');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Jaula de Faraday: faltan pasos, textos o datos');
    // el ejercicio de Ondas electromagnéticas: la misma δ y el campo a 10 µm
    const s = O.resolver(F.ejercicio());
    cerca(s.delta, F.datos.delta, 1e-9, 'Ondas EM: δ'); cerca(s.Ed, F.queda(10e-6), 1e-4, 'Ondas EM: campo a 10 µm');
    if (fallos === antes) console.log('  ✓ Jaula de Faraday: profundidad de penetración, chapa de 1 mm, atenuación, 6 pasos y el ejercicio de Ondas electromagnéticas');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Jaula de Faraday', clave: 'jaula-faraday',
      nombres: ['Rayo', 'Cargas', 'Corriente', 'Pantalla', 'Ascensor', 'Jaula'],
      prueba: { paso: 4, valor: 5, espera: '5 µm → queda el 17,1 % de la onda' },
      destino: { href: '../../electromagnetismo/ondas-em/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#res').innerText + document.querySelector('#pasos').innerText, e = document.querySelector('#error'); return /2,836/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Jaula de Faraday: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Ondas electromagnéticas con los datos, modo oscuro y 390 px');
  };
};
