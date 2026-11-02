/* Comprobación de El altavoz y el motor eléctrico («Física en la vida real»): los números del altavoz y del motor y el
   ejercicio que se abre en Fuerza magnética, en Node, y la página en Chromium con fenomenos/comun.js.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/altavoz-motor ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'altavoz-motor', 'escena.js'));
  const Fz = require(path.join(fuente, 'fuerza', 'fisica.js'));
  {
    // a mano: L = 40 · 2π · 0,0125 = π = 3,14159 m; F = 1 · 0,5 · π = 1,5708 N; con 1,5 A, 4,712 N
    // motor: S = 0,04 · 0,03 = 1,2e-3 m²; m = 100 · 0,5 · 1,2e-3 = 0,06 A·m²; τ máx = 0,06 · 0,1 = 6e-3 N·m
    // fuerza en cada lado largo: 100 · 0,5 · 0,04 · 0,1 = 0,2 N; τ a 30° = 3e-3; valor medio con conmutador (2/π) · 6e-3 = 3,8197e-3
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Altavoz y motor · ${q}: ${a} en vez de ${b}`); };
    const d = F.datos;
    cerca(d.L_ALT, Math.PI, 1e-9, 'longitud de hilo de la bobina (m)'); cerca(d.F_ALT, 1.5708, 1e-4, 'fuerza en el altavoz (N)'); cerca(d.fuerza(1.5), 4.7124, 1e-4, 'fuerza con 1,5 A (N)');
    cerca(d.S_MOT, 1.2e-3, 1e-12, 'superficie de la bobina (m²)'); cerca(d.M_MOT, 0.06, 1e-12, 'momento magnético (A·m²)'); cerca(d.TAU_MAX, 6e-3, 1e-12, 'par máximo (N·m)');
    cerca(d.F_LADO, 0.2, 1e-12, 'fuerza en cada lado largo (N)'); cerca(d.par(30), 3e-3, 1e-9, 'par a 30° (N·m)'); cerca(d.par(0), 0, 1e-12, 'par a 0° (N·m)'); cerca(d.TAU_MEDIO, 3.8197e-3, 1e-7, 'par medio con conmutador (N·m)');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Altavoz y motor: faltan pasos, textos o datos');
    // el ejercicio de Fuerza magnética da lo mismo que a mano
    const s = Fz.resolver(F.ejercicio());
    cerca(s.tau, 6e-3, 1e-12, 'Fuerza magnética: par (N·m)'); cerca(s.m, 0.06, 1e-12, 'Fuerza magnética: momento magnético (A·m²)');
    const h = Fz.resolver({ modo: 'hilo', I: '0,5', L: String(d.L_ALT).replace('.', ','), B: '1', th: '90', sentidoB: 'entrante', sentidoI: 'derecha', m: '' });
    cerca(h.F, 1.5708, 1e-4, 'Fuerza magnética: fuerza sobre el hilo del altavoz (N)');
    if (fallos === antes) console.log('  ✓ Altavoz y motor: longitud de la bobina, fuerza del altavoz, par del motor, par medio con conmutador, 6 pasos y el ejercicio de Fuerza magnética');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Altavoz y motor', clave: 'altavoz-motor',
      nombres: ['Fuerza', 'Altavoz', 'Fuerza', 'Motor', 'Conmutador', 'Cálculo'],
      prueba: { paso: 2, valor: 1, espera: '1,0 A → F = 3,14 N' },
      destino: { href: '../../electromagnetismo/fuerza/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText.replace(/\s/g, ''), e = document.querySelector('#error'); return /0,006|6·10/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : document.body.innerText.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Altavoz y motor: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Fuerza magnética con los datos, modo oscuro y 390 px');
  };
};
