/* Comprobación de La rejilla del microondas («Física en la vida real»): los números del modelo y el ejercicio que se abre
   en Ondas electromagnéticas, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/microondas ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'microondas', 'escena.js'));
  const O = require(path.join(fuente, 'ondas-em', 'fisica.js'));
  {
    // a mano: λ = 2,998·10⁸/2,45·10⁹ = 0,12237 m; λ/2 = 6,12 cm; hf = 6,626·10⁻³⁴ · 2,45·10⁹ = 1,623·10⁻²⁴ J = 1,01·10⁻⁵ eV;
    // con d = 6,1 cm, c = 2 · 0,061 · 2,45·10⁹ = 2,989·10⁸ m/s; 136,1/5 = 27 veces
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Microondas · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.lam, 0.12237, 1e-5, 'λ (m)'); cerca(F.datos.medio * 100, 6.118, 1e-3, 'λ/2 (cm)'); cerca(F.datos.foton, 1.623e-24, 1e-27, 'energía del fotón (J)');
    cerca(F.datos.fotonEV * 1e5, 1.013, 1e-3, 'energía del fotón (10⁻⁵ eV)'); cerca(F.cDe(6.1), 2.989e8, 1e5, 'c con el chocolate'); cerca(F.datos.solVeces, 27.22, 1e-9, 'Sol frente a la fuga');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Microondas: faltan pasos, textos o datos');
    // el ejercicio de Ondas electromagnéticas: λ = 0,1224 m, r = −1
    const s = O.resolver(F.ejercicio());
    cerca(s.F.lam, 0.12236, 1e-4, 'Ondas EM: λ'); cerca(s.r, -1, 1e-12, 'Ondas EM: r');
    if (fallos === antes) console.log('  ✓ Microondas: λ, distancia entre nodos, c con el chocolate, energía del fotón, fuga, 6 pasos y el ejercicio de Ondas electromagnéticas');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Microondas', clave: 'microondas',
      nombres: ['Magnetrón', 'Agua', 'Estacionaria', 'Chocolate', 'Rejilla', 'Seguridad'],
      prueba: { paso: 3, valor: 6.5, espera: 'd = 6,5 cm → c = 2 d f = 3,19·10⁸ m/s' },
      destino: { href: '../../electromagnetismo/ondas-em/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#res').innerText + document.querySelector('#pasos').innerText, e = document.querySelector('#error'); return /0,1224/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Microondas: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Ondas electromagnéticas con los datos, modo oscuro y 390 px');
  };
};
