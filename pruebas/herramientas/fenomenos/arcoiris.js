/* Comprobación de El arcoíris («Física en la vida real»): los números del modelo de Descartes y el ejercicio que se
   abre en Reflexión y transmisión (Fresnel), en Node, y la página en Chromium con fenomenos/comun.js. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/arcoiris ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'arcoiris', 'escena.js'));
  const Fr = require(path.join(fuente, 'fresnel', 'calculo.js'));
  {
    // a mano (n = 1,333): cos²i = (1,776889 − 1)/3 = 0,258963 ⇒ cos i = 0,508885, i = 59,410°; sen r = sen i / n = 0,860826/1,333 = 0,645766 ⇒ r = 40,225°;
    // D = 180 + 2·59,410 − 4·40,225 = 137,92° ⇒ arco 180 − D = 42,08° (rojo, n = 1,331: 42,37°; violeta, n = 1,343: 40,65°);
    // secundario (dos reflexiones, cos²i = (n² − 1)/8): D = 360 + 2i − 6r ⇒ 50,89°
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Arcoíris · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.i0, 59.410, 2e-3, 'ángulo de incidencia de desviación mínima'); cerca(F.datos.r0, 40.225, 2e-3, 'ángulo de refracción'); cerca(F.datos.D0, 137.92, 5e-3, 'desviación D');
    cerca(F.datos.a0, 42.08, 5e-3, 'ángulo del arcoíris'); cerca(F.datos.aRojo, 42.37, 5e-3, 'ángulo del rojo'); cerca(F.datos.aVioleta, 40.65, 5e-3, 'ángulo del violeta'); cerca(F.datos.a2, 50.89, 5e-3, 'arco secundario');
    // el máximo de ang(i) es el mínimo de la desviación: ningún otro i lo supera
    let mejor = 0; for (let i = 1; i < 90; i += 0.1) mejor = Math.max(mejor, F.ang(i, 1.333));
    cerca(mejor, F.datos.a0, 1e-3, 'el máximo de 180° − D(i) es el arco');
    if (!(F.datos.aRojo > F.datos.aVioleta)) falla('Arcoíris: el rojo debe quedar por fuera (ángulo mayor) del violeta');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Arcoíris: faltan pasos, textos o datos');
    // el ejercicio de Fresnel: aire → agua a 59,4° da refracción 40,2°
    const s = Fr.resolver(F.ejercicio());
    cerca(s.tt, 40.22, 0.02, 'Fresnel: ángulo de refracción'); cerca(s.th, 59.4, 1e-9, 'Fresnel: ángulo de incidencia');
    if (fallos === antes) console.log('  ✓ Arcoíris: i = 59,4°, r = 40,2°, D = 137,9° y arco a 42,1° (rojo 42,4°, violeta 40,6°, secundario 50,9°), 6 pasos y el ejercicio de Fresnel');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Arcoíris', clave: 'arcoiris',
      nombres: ['Sol', 'Entrada', 'Rebote', '42°', 'Colores', 'Cálculo'],
      prueba: { paso: 3, valor: 30, espera: 'i = 30° → el rayo sale a' },
      destino: { href: '../../electromagnetismo/fresnel/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#res').innerText, e = document.querySelector('#error'); return /40,2/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 200); }) } });
    if (fallos === antes) console.log('  ✓ Arcoíris: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Fresnel con los datos, modo oscuro y 390 px');
  };
};
