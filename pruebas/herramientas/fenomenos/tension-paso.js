/* Comprobación de La tensión de paso («Física en la vida real»): los números del modelo y la escena que se abre en
   Electrostática, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/tension-paso ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(`Tensión de paso: ${m}`); };
  const F = require(path.join(fuente, 'fenomenos', 'tension-paso', 'escena.js'));
  {
    // a mano: kq = ρI/2π = 100·1000/6,2832 = 15 915 V·m; V(1) = 15 915 V, V(2) = 7958 V → paso a 1 m = 7958 V;
    // paso a 10 m = 15 915·(1/10 − 1/11) = 144,7 V; R = 1000 + 6·100 = 1600 Ω → 4,97 A a 1 m, 90,4 mA a 10 m, 23,7 mA a 20 m;
    // q = kq/k = 15 915/8,9876·10⁹ = 1,771 µC; J a 1 m = 1000/2π = 159,2 A/m²
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.kq, 15915.5, 0.1, 'ρI/2π (V·m)'); cerca(F.datos.V1, 15915.5, 0.1, 'V(1 m)'); cerca(F.datos.paso1, 7957.7, 0.1, 'paso a 1 m (V)');
    cerca(F.datos.paso10, 144.69, 0.01, 'paso a 10 m (V)'); cerca(F.datos.Rtotal, 1600, 1e-9, 'resistencia total (Ω)');
    cerca(F.datos.I1, 4.9736, 1e-3, 'corriente a 1 m (A)'); cerca(F.datos.I10 * 1e3, 90.43, 0.01, 'corriente a 10 m (mA)'); cerca(F.datos.I20 * 1e3, 23.68, 0.01, 'corriente a 20 m (mA)');
    cerca(F.datos.q * 1e6, 1.7708, 1e-3, 'carga equivalente (µC)'); cerca(F.datos.J1, 159.15, 0.01, 'J a 1 m (A/m²)');
    cerca(F.paso(5, 0), 0, 1e-9, 'con los pies juntos no hay tensión de paso');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('faltan pasos, textos o datos');
    // la escena de Electrostática: carga de 1,771 µC; 7958 V entre 1 m y 2 m, 144,7 V entre 10 m y 11 m, 15 915 N/C a 1 m
    const out = Physics.run(F.escenaElectrostatica());
    if (out.ctx.errors.length) falla(`la escena de Electrostática da error (${out.ctx.errors.join(' · ')})`);
    else {
      const r = out.results.map((x) => x.res.replace(/<[^>]+>/g, ''));
      if (!/7958 V/.test(r[0]) || !/144\.7 V/.test(r[1]) || !/1\.592·104 N\/C/.test(r[2])) falla(`la escena de Electrostática da ${r.join(' · ')}`);
    }
    if (fallos === antes) console.log('  ✓ Tensión de paso: potencial, tensión de paso, corriente por el cuerpo, 6 pasos y la escena de Electrostática');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Tensión de paso', clave: 'tension-paso',
      nombres: ['Cable', 'Corriente', 'Potencial', 'Paso', 'Cuerpo', 'Salir'],
      prueba: { paso: 3, valor: 10, espera: '10 m → ΔV = 145 V, por el cuerpo 90 mA' },
      destino: { href: '../../electromagnetismo/electrostatica/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText; return /tensión de paso/i.test(r) ? '' : r.slice(0, 200); }) } });
    if (fallos === antes) console.log('  ✓ Tensión de paso: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Electrostática con los datos, modo oscuro y 390 px');
  };
};
