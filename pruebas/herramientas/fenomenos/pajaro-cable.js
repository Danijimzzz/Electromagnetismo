/* Comprobación de El pájaro posado en un cable («Física en la vida real»): los números del modelo y el circuito que se abre
   en Circuitos de continua, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/pajaro-cable ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'pajaro-cable', 'escena.js'));
  const C = require(path.join(fuente, 'circuitos', 'fisica.js'));
  {
    // a mano: R = 0,1 Ω/km · 5 cm = 5 µΩ; ΔV = 500 A · 5 µΩ = 2,5 mV; I = 2,5 mV / 10 kΩ = 0,25 µA; 400 kV / 10 kΩ = 40 A
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Pájaro · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.Rcable * 1e6, 5, 1e-9, 'R del cable (µΩ)'); cerca(F.datos.dV * 1e3, 2.5, 1e-9, 'ΔV (mV)'); cerca(F.datos.Iave * 1e6, 0.25, 1e-9, 'I por el pájaro (µA)');
    cerca(F.datos.Ipeligro, 40, 1e-9, 'I tocando la torre (A)'); cerca(F.datos.Rcarga, 800, 1e-9, 'carga (Ω)');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Pájaro: faltan pasos, textos o datos');
    // el circuito de Circuitos de continua: 2,5 mV entre a y b, 0,25 µA por R2 y la línea a 400 kV
    const s = C.resolver(F.ejercicio()), [, R1, R2] = s.els;
    cerca(R1.U * 1e3, 2.5, 1e-6, 'Circuitos: ΔV entre las patas (mV)'); cerca(R2.I * 1e6, 0.25, 1e-6, 'Circuitos: I por el pájaro (µA)'); cerca(R1.I, 500, 1e-3, 'Circuitos: I por el cable (A)'); cerca(s.els[3].U / 1e3, 400, 1e-6, 'Circuitos: tensión de la línea (kV)');
    if (fallos === antes) console.log('  ✓ Pájaro en el cable: R entre las patas, ΔV, corriente por el pájaro y de peligro, 6 pasos y el circuito de Circuitos de continua');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Pájaro en el cable', clave: 'pajaro-cable',
      nombres: ['Línea', 'Corriente', 'Patas', 'Paralelo', 'Diferencia', 'Peligro'],
      prueba: { paso: 3, valor: 20, espera: '20 cm → ΔV = 10,0 mV, por el pájaro 1,00 µA' },
      destino: { href: '../../circuitos/continua/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#res').innerText, e = document.querySelector('#error'); return /400000 V/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 200); }) } });
    if (fallos === antes) console.log('  ✓ Pájaro en el cable: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Circuitos de continua con los datos, modo oscuro y 390 px');
  };
};
