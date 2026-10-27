/* Comprobación de Por qué la luz viaja en alta tensión («Física en la vida real»): los números del modelo y el circuito
   que se abre en Circuitos de continua, en Node, y la página en Chromium con fenomenos/comun.js. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/transporte-alta-tension ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'transporte-alta-tension', 'escena.js'));
  const C = require(path.join(fuente, 'circuitos', 'fisica.js'));
  {
    // a mano: R = 2,8·10⁻⁸ · 5·10⁴/5,6·10⁻⁴ = 2,5 Ω por cable; a 230 V, I = 10⁷/230 = 43 478 A y Pp = I²·5 = 9,45 GW;
    // a 20 kV, 500 A y 1,25 MW; a 400 kV, 25 A y 25²·5 = 3125 W
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Alta tensión · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.Rcable, 2.5, 1e-12, 'R de un cable'); cerca(F.datos.I230, 43478.26, 0.01, 'I a 230 V'); cerca(F.datos.P230 / 1e9, 9.4518, 1e-4, 'pérdidas a 230 V (GW)');
    cerca(F.datos.P20k, 1.25e6, 1e-6, 'pérdidas a 20 kV'); cerca(F.datos.I400k, 25, 1e-12, 'I a 400 kV'); cerca(F.datos.P400k, 3125, 1e-9, 'pérdidas a 400 kV');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Alta tensión: faltan pasos, textos o datos');
    // el circuito: 400 kV / 16 005 Ω = 24,99 A; 24,99² · 2,5 = 1561,5 W en cada cable
    const s = C.resolver(F.ejercicio()), [, R1, Rc, R2] = s.els, I = 400e3 / 16005;
    cerca(R1.I, I, 1e-6, 'Circuitos: corriente'); cerca(R1.P + R2.P, I * I * 5, 1e-3, 'Circuitos: pérdidas'); cerca(Rc.P / 1e6, 9.9938, 1e-4, 'Circuitos: potencia de la ciudad (MW)');
    if (fallos === antes) console.log('  ✓ Alta tensión: R de los cables, corriente y pérdidas a 230 V, 20 kV y 400 kV, 6 pasos y el circuito de Circuitos de continua');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Alta tensión', clave: 'transporte-alta-tension',
      nombres: ['Línea', 'Cables', '230 V', '400 kV', 'Transformador', 'Red'],
      prueba: { paso: 3, valor: 20, espera: '20 kV → I = 500 A, se pierde el 12,5 %' },
      destino: { href: '../../circuitos/continua/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#res').innerText, e = document.querySelector('#error'); return /399900 V/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Alta tensión: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Circuitos de continua con los datos, modo oscuro y 390 px');
  };
};
