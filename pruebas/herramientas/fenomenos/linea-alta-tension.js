/* Comprobación de La línea de alta tensión y el suelo («Física en la vida real»): los números del modelo y la escena
   que se abre en Electrostática, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/linea-alta-tension ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(`Línea de alta tensión: ${m}`); };
  const F = require(path.join(fuente, 'fenomenos', 'linea-alta-tension', 'escena.js'));
  {
    // a mano: C′ = 2π·8,854·10⁻¹² / ln(2·10/0,015) = 5,563·10⁻¹¹/7,195 = 7,732 pF/m; λ = C′·133 kV = 1,028 µC/m;
    // E = λ/(πε₀h) = 3697 V/m; tubo: λ/(2πε₀)·[ln(11,7/8,3) − ln(10,5/9,5)] = 18 485·0,2432 = 4496 V; persona: 18 485·ln(11,8/8,2) = 6728 V
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.C * 1e12, 7.7316, 1e-3, 'C′ (pF/m)'); cerca(F.datos.lambda * 1e6, 1.0283, 1e-3, 'λ (µC/m)');
    cerca(F.datos.E0, 3696.8, 0.5, 'E en el suelo (V/m)'); cerca(F.datos.tubo, 4496, 2, 'ΔV del tubo (V)'); cerca(F.datos.persona, 6728, 2, 'ΔV de la persona (V)');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('faltan pasos, textos o datos');
    // la escena de Electrostática: 133 kV entre el cable y el suelo, 3696 N/C en el suelo, 3781 N/C a 1,5 m y 4495 V en el tubo
    const out = Physics.run(F.escenaElectrostatica());
    if (out.ctx.errors.length) falla(`la escena de Electrostática da error (${out.ctx.errors.join(' · ')})`);
    else {
      const r = out.results.map((x) => x.res.replace(/<[^>]+>/g, ''));
      if (!/1\.329·105 V/.test(r[0]) || !/\|E\| = 3696 N\/C/.test(r[1]) || !/\|E\| = 3781 N\/C/.test(r[2]) || !/4495 V/.test(r[3])) falla(`la escena de Electrostática da ${r.join(' · ')}`);
    }
    if (fallos === antes) console.log('  ✓ Línea de alta tensión: C′, λ, campo en el suelo, tensión del tubo y de una persona, 6 pasos y la escena de Electrostática');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Línea de alta tensión', clave: 'linea-alta-tension',
      nombres: ['Línea', 'Condensador', 'Alterna', 'Campo', 'Fluorescente', 'Peligro'],
      prueba: { paso: 3, valor: 20, espera: '20 m → C′ = 7,1 pF/m y E en el suelo = 1,7 kV/m' },
      destino: { href: '../../electromagnetismo/electrostatica/', comprueba: (page) => page.evaluate(() => { const r = document.body.innerText; return /línea de alta tensión/i.test(r) ? '' : r.slice(0, 200); }) } });
    if (fallos === antes) console.log('  ✓ Línea de alta tensión: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre Electrostática con los datos, modo oscuro y 390 px');
  };
};
