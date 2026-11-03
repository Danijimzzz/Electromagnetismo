/* Comprobación de La pantalla táctil («Física en la vida real»): los números del modelo (capacidad del dedo, carga,
   centro de gravedad, guante) y el ejercicio que se abre en Dieléctricos y condensadores, en Node, y la página en Chromium
   con fenomenos/comun.js. La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/pantalla-tactil ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(`Pantalla táctil: ${m}`); };
  const F = require(path.join(fuente, 'fenomenos', 'pantalla-tactil', 'escena.js'));
  const K = require(path.join(fuente, 'condensadores', 'fisica.js'));
  {
    // a mano (ε₀ = 8,8541878128·10⁻¹²): C = ε₀ εr S/d = 8,854·10⁻¹²·7·25·10⁻⁶/0,7·10⁻³ = 2,2135 pF; Q = C V = 7,305 pC con 3,3 V;
    // en paralelo con 10 pF: 12,2135 pF ⇒ +22,1 % y Q de 33,0 a 40,30 pC; con un guante de 1 mm (εr = 3) en serie: d_ef = 0,7/7 + 1/3 = 0,43333 mm ⇒ C = 0,5108 pF
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.Cd * 1e12, 2.2135, 1e-3, 'C del dedo (pF)'); cerca(F.datos.dQ * 1e12, 7.305, 1e-3, 'carga añadida (pC)'); cerca(F.datos.subida, 0.2214, 1e-4, 'subida relativa de la capacidad');
    cerca(F.datos.Q0 * 1e12, 33, 1e-9, 'Q sin dedo (pC)'); cerca(F.datos.Q1 * 1e12, 40.30, 0.01, 'Q con dedo (pC)'); cerca(F.datos.C1mm * 1e12, 0.5108, 1e-3, 'C con un guante de 1 mm (pF)');
    if (!(F.datos.C1mm < F.datos.UMBRAL && F.datos.Cd > F.datos.UMBRAL)) falla('el dedo desnudo debe superar el umbral y el guante de 1 mm no');
    // la posición calculada con electrodos cada 5 mm se equivoca menos de 1 mm; en un electrodo o a medio camino es exacta
    let peor = 0; for (let x = 2; x <= 18; x += 0.5) peor = Math.max(peor, Math.abs(F.posicion(x) - x));
    if (!(peor < 1)) falla(`el centro de gravedad falla ${peor} mm`);
    cerca(F.posicion(5), 5, 1e-9, 'posición sobre un electrodo'); cerca(F.posicion(7.5), 7.5, 1e-9, 'posición a medio camino');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('faltan pasos, textos o datos');
    // el ejercicio de Condensadores da lo mismo que el modelo
    const r = K.resolver(F.ejercicio());
    cerca(r.C, F.datos.Cd, 1e-15, 'Condensadores: C'); cerca(r.Q, F.datos.dQ, 1e-15, 'Condensadores: Q');
    // el guante: la capa extra de 1 mm con εr = 3 en serie da la capacidad del modelo
    const e = F.ejercicio(); e.d = '1,7 mm'; e.capas = [{ t: '0,7 mm', er: '7' }, { t: '1 mm', er: '3' }];
    cerca(K.resolver(e).C, F.datos.C1mm, 1e-15, 'Condensadores: C con guante');
    if (fallos === antes) console.log('  ✓ Pantalla táctil: C = 2,21 pF, Q = 7,3 pC, +22 % (33,0 → 40,3 pC), posición con error < 1 mm, 0,51 pF con guante, 6 pasos y el ejercicio de Condensadores');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Pantalla táctil', clave: 'pantalla-tactil',
      nombres: ['Rejilla', 'Dedo', 'Condensador', 'Señal', 'Posición', 'Guantes'],
      prueba: { paso: 2, valor: 1.4, espera: 'cristal de 1,4 mm → C = 1,11 pF' },
      destino: { href: '../../electromagnetismo/condensadores/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText; return /2,21\d pF/.test(r) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Pantalla táctil: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Condensadores con los datos, modo oscuro y 390 px');
  };
};
