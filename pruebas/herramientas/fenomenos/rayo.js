/* Comprobación de El rayo («Física en la vida real»): los números del modelo y el ejercicio que se abre en Dieléctricos y
   condensadores, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/rayo ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(`Rayo: ${m}`); };
  const F = require(path.join(fuente, 'fenomenos', 'rayo', 'escena.js'));
  const K = require(path.join(fuente, 'condensadores', 'fisica.js'));
  {
    // a mano (ε₀ = 8,8541878128·10⁻¹²): C = ε₀S/d = 8,854·10⁻¹²·10⁷/2000 = 4,4271·10⁻⁸ F; Q = CV = 4,4271 C; U = ½QV = 2,2135·10⁸ J = 61,49 kWh;
    // E = V/d = 50 kV/m; Q/I = 4,4271/30 000 = 147,6 µs; 7 s de trueno → 343·7 = 2,401 km
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.C * 1e9, 44.271, 1e-3, 'C (nF)'); cerca(F.datos.Q, 4.4271, 1e-4, 'Q (C)'); cerca(F.datos.U / 1e6, 221.35, 0.01, 'U (MJ)'); cerca(F.datos.kWh, 61.49, 0.01, 'U (kWh)');
    cerca(F.datos.E, 5e4, 1e-6, 'E medio (V/m)'); cerca(F.datos.tiempo * 1e6, 147.57, 0.01, 'Q/I (µs)'); cerca(F.datos.km(7), 2.401, 1e-9, 'distancia del trueno (km)');
    if (!(F.datos.E < F.datos.AIRE)) falla('el campo medio debería ser menor que la rigidez del aire');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('faltan pasos, textos o datos');
    // el ejercicio de Condensadores da lo mismo que el modelo
    const r = K.resolver(F.ejercicio());
    cerca(r.C, F.datos.C, 1e-15, 'Condensadores: C'); cerca(r.Q, F.datos.Q, 1e-9, 'Condensadores: Q'); cerca(r.U, F.datos.U, 1, 'Condensadores: U');
    if (fallos === antes) console.log('  ✓ Rayo: C = 44,3 nF, Q = 4,43 C, U = 221 MJ (61 kWh), E = 50 kV/m, Q/I = 148 µs, trueno a 343 m/s, 6 pasos y el ejercicio de Condensadores');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Rayo', clave: 'rayo',
      nombres: ['Nube', 'Condensador', 'Tensión', 'Líder', 'Descarga', 'Trueno'],
      prueba: { paso: 5, valor: 10, espera: '10 s → el rayo ha caído a 3,4 km' },
      destino: { href: '../../electromagnetismo/condensadores/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText; return /44,27 nF/.test(r) && /221,4 MJ/.test(r) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Rayo: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Condensadores con los datos, modo oscuro y 390 px');
  };
};
