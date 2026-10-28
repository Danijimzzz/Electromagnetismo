/* Comprobación de El airbag y el cinturón («Física en la vida real»): los números del modelo y el ejercicio que se
   abre en Trabajo y energía, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/airbag ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'airbag', 'escena.js'));
  const En = require(path.join(fuente, 'trabajo-y-energia', 'fisica.js'));
  {
    // a mano: Ec = ½·75·14² = 7350 J; F = Ec/d: 147 000 N (5 cm) y 14 700 N (50 cm); peso 735 N ⇒ 200 y 20 veces;
    // Δt = 2d/v: 7,14 ms y 71,4 ms; impulso m v = 1050 N·s
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Airbag · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.Ec, 7350, 1e-9, 'Ec (J)'); cerca(F.datos.Fsin, 147000, 1e-6, 'F sin cinturón (N)'); cerca(F.datos.Fcon, 14700, 1e-6, 'F con cinturón (N)');
    cerca(F.datos.gSin, 200, 1e-9, 'veces el peso sin cinturón'); cerca(F.datos.gCon, 20, 1e-9, 'veces el peso con cinturón');
    cerca(F.datos.tSin * 1000, 7.1429, 1e-4, 'Δt sin cinturón (ms)'); cerca(F.datos.tCon * 1000, 71.429, 1e-3, 'Δt con cinturón (ms)'); cerca(F.datos.p, 1050, 1e-9, 'impulso (N·s)');
    cerca(F.datos.kmh, 50.4, 1e-9, 'velocidad (km/h)');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Airbag: faltan pasos, textos o datos');
    // el ejercicio de Trabajo y energía: W = −7350 J y se para justo al final
    const s = En.resolver(F.ejercicio());
    cerca(s.res.W, -7350, 1e-9, 'Trabajo y energía: W'); cerca(s.res.v, 0, 1e-9, 'Trabajo y energía: velocidad final');
    if (fallos === antes) console.log('  ✓ Airbag: energía cinética, fuerza media con y sin cinturón, veces el peso, duración, impulso, 6 pasos y el ejercicio de Trabajo y energía');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Airbag', clave: 'airbag',
      nombres: ['Choque', 'Inercia', 'Sin cinturón', 'Cinturón', 'Airbag', 'Cálculo'],
      prueba: { paso: 3, valor: 25, espera: '25 cm → F = 29 400 N, 40,0 veces tu peso' },
      destino: { href: '../../fisica/trabajo-y-energia/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText, e = document.querySelector('#error'); return /−7350|-7350/.test(r.replace(/\s/g, '')) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 200); }) } });
    if (fallos === antes) console.log('  ✓ Airbag: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Trabajo y energía con los datos, modo oscuro y 390 px');
  };
};
