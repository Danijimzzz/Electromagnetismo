/* Comprobación de La olla a presión y el agua en la montaña («Física en la vida real»): los números del modelo de
   Clausius-Clapeyron y el ejercicio que se abre en Calorimetría, en Node, y la página en Chromium con fenomenos/comun.js.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/olla-presion ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'olla-presion', 'escena.js'));
  const Calor = require(path.join(fuente, 'calorimetria', 'fisica.js'));
  {
    // a mano: ΔH = 2257e3 · 0,018015 = 40 660 J/mol; 1/T = 1/373,15 − (8,314/40 660) ln(P/101,325)
    // 2 atm: 1/T = 2,67989e-3 − 2,0448e-4 · 0,693147 = 2,53816e-3 ⇒ T = 393,98 K = 120,8 °C
    // Everest: P = 101,325 e^(−8849/7600) = 31,63 kPa ⇒ 69,6 °C; a 3000 m: 68,3 kPa y 89,1 °C; 1 atm: 100 °C justo
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Olla a presión · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.DH, 40660, 1, 'ΔH de vaporización (J/mol)');
    cerca(F.datos.ebullicion(101.325), 100, 1e-9, 'ebullición a 1 atm (°C)');
    cerca(F.datos.T_OLLA, 120.84, 0.05, 'ebullición a 2 atm (°C)');
    cerca(F.datos.P_EVEREST, 31.63, 0.05, 'presión en el Everest (kPa)'); cerca(F.datos.T_EVEREST, 69.54, 0.05, 'ebullición en el Everest (°C)');
    cerca(F.datos.presionAltura(3000), 68.3, 0.05, 'presión a 3000 m (kPa)'); cerca(F.datos.ebullicion(F.datos.presionAltura(3000)), 89.09, 0.05, 'ebullición a 3000 m (°C)');
    // Q = 1 · 4180 · (121 − 20) = 422 180 J; t = Q/(0,9 · 2000) = 234,54 s; en el cazo abierto 334 400 J ⇒ 185,78 s; 2^2,1 = 4,287
    cerca(F.datos.Q, 422180, 1e-6, 'calor para llegar a 121 °C (J)'); cerca(F.datos.tOlla, 234.54, 0.01, 'tiempo en la olla (s)'); cerca(F.datos.tAbierta, 185.78, 0.01, 'tiempo en el cazo abierto (s)');
    cerca(F.datos.veces, 4.287, 0.001, 'veces más rápido');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Olla a presión: faltan pasos, textos o datos');
    // el ejercicio de Calorimetría: el calentador tarda lo mismo que a mano
    const s = Calor.resolver(F.ejercicio());
    const calentador = s.cuerpos.find((x) => x.b.calentador);
    cerca(calentador.b.t, 234.54, 0.01, 'Calorimetría: tiempo del calentador (s)'); cerca(s.Te, 121, 1e-6, 'Calorimetría: temperatura final (°C)');
    if (fallos === antes) console.log('  ✓ Olla a presión: ΔH, ebullición a 1 y 2 atm, presión y ebullición en el Everest y a 3000 m, calor y tiempo de calentamiento, 6 pasos y el ejercicio de Calorimetría');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Olla a presión', clave: 'olla-presion',
      nombres: ['Ebullición', 'Montaña', 'Olla', 'Cocción', 'Curva', 'Cálculo'],
      prueba: { paso: 1, valor: 3000, espera: '3 000 m → 68 kPa, el agua hierve a 89 °C' },
      destino: { href: '../../fisica/calorimetria/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText, e = document.querySelector('#error'); return /422/.test(r.replace(/\s/g, '')) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Olla a presión: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Calorimetría con los datos, modo oscuro y 390 px');
  };
};
