/* Comprobación de La datación por carbono 14 («Física en la vida real»): los números del modelo y el ejercicio que se abre
   en Cinética química, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/carbono-14 ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'carbono-14', 'escena.js'));
  const Ci = require(path.join(fuente, 'cinetica', 'calculo.js'));
  {
    // a mano: k = ln 2/5730 = 1,2097·10⁻⁴ años⁻¹; con el 25 %, t = ln 4/k = 2·5730 = 11 460 años; 13,6·0,25 = 3,4; 2⁻¹⁰ = 0,098 %
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Carbono 14 · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.k, 1.2097e-4, 1e-8, 'k (años⁻¹)'); cerca(F.datos.edad, 11460, 1e-6, 'edad con el 25 % (años)'); cerca(F.datos.actividad, 3.4, 1e-12, 'actividad del hueso');
    cerca(F.datos.quedaLimite, 2 ** -10, 1e-12, 'lo que queda a las 10 vidas medias'); cerca(F.queda(5730), 0.5, 1e-12, 'la mitad a los 5730 años');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Carbono 14: faltan pasos, textos o datos');
    // el ejercicio de Cinética química: orden 1 con la vida media, cuándo queda el 25 %
    const s = Ci.resolver(F.ejercicio());
    cerca(s.k, F.datos.k, 1e-12, 'Cinética: k'); cerca(s.tC, 11460, 1e-6, 'Cinética: tiempo hasta el 25 %');
    if (fallos === antes) console.log('  ✓ Carbono 14: constante de desintegración, edad con el 25 %, actividad, límite, 6 pasos y el ejercicio de Cinética química');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Carbono 14', clave: 'carbono-14',
      nombres: ['Origen', 'Vivo', 'Reloj', 'Semivida', 'Datación', 'Límite'],
      prueba: { paso: 3, valor: 17200, espera: '17 200 años → queda el 12,5 %' },
      destino: { href: '../../quimica/cinetica/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#resumen').innerText, e = document.querySelector('#error'); return /1146|11\.460|11 460/.test(r.replace(/\s/g, ' ')) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Carbono 14: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Cinética química con los datos, modo oscuro y 390 px');
  };
};
