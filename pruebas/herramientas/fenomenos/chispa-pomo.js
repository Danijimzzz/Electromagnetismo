/* Comprobación de La chispa al tocar el pomo («Física en la vida real»): los números del modelo y el ejercicio que se abre
   en Transitorios, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/chispa-pomo ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'chispa-pomo', 'escena.js'));
  const Sim = require('./simulador-nodo.js')(path, fuente);
  {
    // a mano: Q = CV = 150 pF · 10 kV = 1,5 µC; τ = RC = 330 · 150 pF = 49,5 ns; I₀ = V/R = 30,30 A; U = ½CV² = 7,5 mJ; d = V/E = 3,33 mm
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Chispa · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.Q * 1e6, 1.5, 1e-9, 'carga (µC)'); cerca(F.datos.tau * 1e9, 49.5, 1e-9, 'τ (ns)'); cerca(F.datos.I0, 30.303, 1e-3, 'I₀ (A)');
    cerca(F.datos.U * 1e3, 7.5, 1e-9, 'energía (mJ)'); cerca(F.datos.d * 1e3, 3.333, 1e-3, 'distancia de la chispa (mm)'); cerca(F.datos.electrones / 1e12, 9.36, 0.01, 'electrones (·10¹²)');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Chispa: faltan pasos, textos o datos');
    // el esquema del Simulador: el condensador parte de 10 kV, el interruptor abre en 1 ps y se descarga por 330 Ω: a 100 ns de abrir, V = 10 000·e^(−100/49,5) = 1326,3 V
    const { x, op } = Sim.calcula(F.ejercicio()); cerca(op.V[x.pinNet.C1[0]].re, 10000, 1e-3, 'Simulador: C cargado a 10 kV'); cerca(op.I.E1.re, -30.303, 1e-3, 'Simulador: corriente inicial (A)');
    const tr = Sim.Motor.transitorio(x.net, { tfin: 5e-7, puntos: 2000 }), k = x.pinNet.C1[0], j = tr.t.findIndex((t) => t >= 1.0000001e-7 + 1e-12);
    cerca(tr.V[k][j] / 10000, Math.exp(-(tr.t[j] - 1e-12) / 49.5e-9), 2e-3, 'Simulador: V del cuerpo a los 100 ns (fracción de 10 kV)');
    if (fallos === antes) console.log('  ✓ Chispa del pomo: carga, τ, I₀, energía y distancia de la chispa, 6 pasos y el esquema del Simulador (V₀, I₀ y V a los 100 ns)');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Chispa del pomo', clave: 'chispa-pomo',
      nombres: ['Frotamiento', 'Condensador', 'Acercarse', 'Chispa', 'Energía', 'Truco'],
      prueba: { paso: 5, valor: 2, espera: '2,0 kV → la chispa salta a 0,7 mm, con 0,3 mJ: no la notas' },
      destino: { href: '../../circuitos/simulador/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#panel').innerText, e = document.querySelector('#error'); return /10 kV/.test(r) && /30,3/.test(r) && (!e || e.hidden || !e.textContent.trim()) ? '' : r.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Chispa del pomo: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre el Simulador de circuitos con los datos, modo oscuro y 390 px');
  };
};
