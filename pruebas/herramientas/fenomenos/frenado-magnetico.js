/* Comprobación de El freno magnético y el tren de levitación («Física en la vida real»): los números del modelo y el
   ejercicio que se abre en Inducción: Faraday y Lenz, en Node, y la página en Chromium con fenomenos/comun.js. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/frenado-magnetico ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const C = require(path.join(fuente, 'fenomenos', 'frenado-magnetico', 'escena.js'));
  const Fa = require(path.join(fuente, 'faraday', 'fisica.js'));
  {
    // a mano: ε = B L v = 1 · 0,5 · 20 = 10 V; I = ε/R = 10 / 0,0005 = 20 000 A; F = I L B = 10 000 N = K v con K = B²L²/R = 500 N·s/m;
    // P = F v = 200 kW; a = F/m = 5 m/s²; τ = m/K = 4 s; Ec = ½ · 2000 · 400 = 400 kJ; a los 5 s v = 20 e^(−1,25) = 5,7300 m/s
    // levitación: v²/(v² + 30²): 0 a 0, 1/2 a 30 m/s, 140²/(140² + 900) = 0,95610 a 140 m/s
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Freno magnético · ${q}: ${a} en vez de ${b}`); };
    const d = C.datos;
    cerca(d.eps, 10, 1e-9, 'fem (V)'); cerca(d.I, 20000, 1e-6, 'corriente (A)'); cerca(d.F, 10000, 1e-6, 'fuerza (N)'); cerca(d.K, 500, 1e-9, 'K (N·s/m)');
    cerca(d.P, 200000, 1e-3, 'potencia (W)'); cerca(d.a, 5, 1e-9, 'deceleración (m/s²)'); cerca(d.TAU, 4, 1e-9, 'constante de tiempo (s)'); cerca(d.Ec, 400000, 1e-6, 'energía cinética (J)');
    cerca(d.v5, 5.7300, 1e-3, 'velocidad a los 5 s'); cerca(d.levita(0), 0, 1e-12, 'levitación parado'); cerca(d.levita(30), 0.5, 1e-12, 'levitación a 30 m/s'); cerca(d.levita(140), 0.95610, 1e-5, 'levitación a 140 m/s');
    cerca(d.fuerza(10), 5000, 1e-9, 'fuerza a 10 m/s');
    if (C.pasos.length !== 6 || C.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Freno magnético: faltan pasos, textos o datos');
    // el ejercicio de Faraday (barra): la misma fem, corriente, fuerza y potencia
    const s = Fa.resolver(C.ejercicio());
    cerca(s.eps, d.eps, 1e-9, 'Faraday: fem'); cerca(s.I, d.I, 1e-6, 'Faraday: corriente'); cerca(s.F, d.F, 1e-6, 'Faraday: fuerza'); cerca(s.P, d.P, 1e-3, 'Faraday: potencia');
    if (fallos === antes) console.log('  ✓ Freno magnético: fem de movimiento, corriente de Foucault, fuerza F = Kv, τ = 4 s, levitación, 6 pasos y el ejercicio de Faraday y Lenz');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Freno magnético', clave: 'frenado-magnetico',
      nombres: ['Freno', 'Campo', 'Faraday', 'Lenz', 'Parada', 'Levitación'],
      prueba: { paso: 3, valor: 10, espera: '10 m/s → 5,0 kN de fuerza de frenado' },
      destino: { href: '../../electromagnetismo/faraday/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText.replace(/\s/g, ''), e = document.querySelector('#error'); return /10V/.test(r) && /10kN|10000N|1[,.]0?·?10/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Freno magnético: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Faraday y Lenz con los datos, modo oscuro y 390 px');
  };
};
