/* Comprobación de La resonancia magnética («Física en la vida real»): los números del modelo (campo del solenoide,
   frecuencia de Larmor, exceso de protones, gradiente) y el ejercicio que se abre en Magnetostática, en Node, y la
   página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/resonancia-magnetica ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'resonancia-magnetica', 'escena.js'));
  {
    // a mano: n = 4775 / 2 = 2387,5 esp/m ⇒ B₀ = 4π·10⁻⁷ · 2387,5 · 500 = 1,50011 T; f = 42,577 479 MHz/T · 1,50011 = 63,871 MHz;
    // a 3 T: 127,732 MHz; exceso = tanh(h f / 2kT) con h f = 6,626·10⁻³⁴ · 63,871·10⁶ = 4,2322·10⁻²⁶ J y 2kT = 2 · 1,3806·10⁻²³ · 310 = 8,5602·10⁻²¹ J
    //   ⇒ 4,944·10⁻⁶; gradiente de 10 mT/m: 42,577·10⁶ · 0,010 · 0,01 = 4257,7 Hz por cm; a ±20 cm: ±85,15 kHz (63,7858 y 63,9561 MHz)
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Resonancia magnética · ${q}: ${a} en vez de ${b}`); };
    const d = F.datos;
    cerca(d.B0, 1.50011, 1e-5, 'B₀ (T)'); cerca(d.FL / 1e6, 63.871, 0.001, 'frecuencia de Larmor (MHz)'); cerca(d.larmor(3) / 1e6, 127.732, 0.001, 'Larmor a 3 T (MHz)');
    cerca(d.P * 1e6, 4.944, 0.002, 'exceso de protones (por millón)'); cerca(d.HZ_CM, 4257.7, 0.1, 'gradiente de 10 mT/m (Hz por cm)');
    cerca(d.fx(0.2) / 1e6, 63.9561, 0.0001, 'f a +20 cm (MHz)'); cerca(d.fx(-0.2) / 1e6, 63.7858, 0.0001, 'f a −20 cm (MHz)'); cerca(d.veces, 30002, 1, 'B₀ frente al campo terrestre de 50 µT');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Resonancia magnética: faltan pasos, textos o datos');
    // el ejercicio: Magnetostática da el mismo campo en el centro del solenoide ideal
    global.Engine = require(path.join(fuente, 'engine.js'));
    const Mag = require(path.join(fuente, 'magnetostatica', 'fisica.js')), o = Mag.run(F.ejercicio());
    if (o.errors.length || o.results.length !== 1 || o.results[0].error) falla(`Resonancia magnética: Magnetostática no resuelve el ejercicio (${JSON.stringify(o.errors)})`);
    else if (!/\(0, 0, 1,5\) <span class="unit">T/.test(o.results[0].res)) falla(`Resonancia magnética: Magnetostática no da 1,5 T: ${o.results[0].res}`);
    if (fallos === antes) console.log('  ✓ Resonancia magnética: B₀ del solenoide, Larmor a 1,5 y 3 T, exceso de protones, gradiente, 6 pasos y el ejercicio de Magnetostática');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Resonancia magnética', clave: 'resonancia-magnetica',
      nombres: ['Imán', 'Larmor', 'Resonancia', 'Señal', 'Gradientes', 'Cálculo'],
      prueba: { paso: 1, valor: 3, espera: '3,0 T → frecuencia de Larmor 127,73 MHz' },
      destino: { href: '../../electromagnetismo/magnetostatica/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText.replace(/\s/g, ''); return /\(0,0,1,5\)T/.test(r) && /Imán/.test(r) && !document.querySelector('.result .warn') ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Resonancia magnética: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Magnetostática con los datos, modo oscuro y 390 px');
  };
};
