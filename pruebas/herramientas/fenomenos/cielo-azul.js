/* Comprobación de El cielo azul («Física en la vida real»): los números del modelo y el ejercicio que se abre en
   Ondas electromagnéticas, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/cielo-azul ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'cielo-azul', 'escena.js'));
  const O = require(path.join(fuente, 'ondas-em', 'fisica.js'));
  {
    // a mano: (700/450)⁴ = 1,5556⁴ = 5,855; (700/400)⁴ = 1,75⁴ = 9,379; 450 nm / 0,3 nm = 1500; f = 2,998·10⁸/450·10⁻⁹ = 6,662·10¹⁴ Hz;
    // τ(450) = 0,097·(550/450)⁴ = 0,2165, τ(700) = 0,097·(550/700)⁴ = 0,03697; T = e^(−τ m): m = 1 → 0,805 y 0,964; m = 38 → 2,7·10⁻⁴ y 0,2455
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Cielo azul · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.azulRojo, 5.8552, 1e-3, 'azul frente a rojo'); cerca(F.datos.violetaRojo, 9.3789, 1e-3, 'violeta frente a rojo'); cerca(F.datos.veces, 1500, 1e-6, 'λ frente a la molécula');
    cerca(F.datos.fAzul / 1e14, 6.662, 1e-3, 'f del azul (10¹⁴ Hz)'); cerca(F.datos.tauAzul, 0.2165, 1e-4, 'τ del azul'); cerca(F.datos.tauRojo, 0.03697, 1e-5, 'τ del rojo');
    cerca(F.datos.azulCenit, 0.8054, 1e-3, 'azul en el cenit'); cerca(F.datos.rojoCenit, 0.9637, 1e-3, 'rojo en el cenit');
    cerca(F.datos.azulHorizonte * 1e4, 2.67, 0.05, 'azul en el horizonte (10⁻⁴)'); cerca(F.datos.rojoHorizonte, 0.2455, 1e-3, 'rojo en el horizonte');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Cielo azul: faltan pasos, textos o datos');
    // el ejercicio de Ondas electromagnéticas: λ = 450 nm, f = 6,66·10¹⁴ Hz
    const s = O.resolver(F.ejercicio());
    cerca(s.F.lam, 4.5e-7, 1e-12, 'Ondas EM: λ'); cerca(s.F.fr / 1e14, 6.662, 2e-3, 'Ondas EM: f (10¹⁴ Hz)');
    if (fallos === antes) console.log('  ✓ Cielo azul: 1/λ⁴ del azul y el violeta frente al rojo, τ de Rayleigh, luz que sobrevive en el cenit y el horizonte, 6 pasos y el ejercicio de Ondas electromagnéticas');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Cielo azul', clave: 'cielo-azul',
      nombres: ['Sol', 'Moléculas', 'Rayleigh', 'Azul', 'Atardecer', 'Cálculo'],
      prueba: { paso: 3, valor: 400, espera: 'λ = 400 nm → se dispersa 9,4 veces más que el rojo (700 nm)' },
      destino: { href: '../../electromagnetismo/ondas-em/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#res').innerText + document.querySelector('#pasos').innerText, e = document.querySelector('#error'); return /6,66/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 200); }) } });
    if (fallos === antes) console.log('  ✓ Cielo azul: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Ondas electromagnéticas con los datos, modo oscuro y 390 px');
  };
};
