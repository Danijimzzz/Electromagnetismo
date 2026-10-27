/* Comprobación de La lluvia ácida y el pH del mar («Física en la vida real»): los números del modelo y el ejercicio que
   se abre en pH y valoraciones, en Node, y la página en Chromium con fenomenos/comun.js. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fenomenos/lluvia-acida ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal, pagina }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(m); };
  const F = require(path.join(fuente, 'fenomenos', 'lluvia-acida', 'escena.js'));
  const P = require(path.join(fuente, 'ph', 'calculo.js'));
  {
    // a mano: lluvia limpia x² + Ka·x − Ka·C = 0 con Ka = 4,3·10⁻⁷ y C = 1,4·10⁻⁵ → x = 2,25·10⁻⁶, pH 5,65;
    // con 30 µmol/L de H₂SO₄, [H⁺] ≈ 6·10⁻⁵ → pH 4,22; lago: 6,37 + log(10) = 7,37 y 6,37 + log(0,994/0,106) = 7,34; 10^0,1 − 1 = 25,9 %
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) falla(`Lluvia ácida · ${q}: ${a} en vez de ${b}`); };
    const Ka = 4.3e-7, C = 1.4e-5, x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2;
    cerca(F.datos.h0, x, 5e-9, '[H⁺] de la lluvia limpia'); cerca(F.datos.ph0, 5.648, 2e-3, 'pH de la lluvia limpia');
    cerca(F.datos.phAcida, -Math.log10(6e-5), 2e-3, 'pH con 30 µmol/L de H₂SO₄'); cerca(F.datos.veces, 10 ** (5.648 - 4.2218), 0.1, 'veces más H⁺');
    cerca(F.datos.lagoAntes, 7.3665, 1e-3, 'pH del lago'); cerca(F.datos.lagoDespues, -Math.log10(Ka) + Math.log10(0.994e-3 / 1.06e-4), 1e-9, 'pH del lago con la lluvia ácida');
    cerca(F.datos.aguaPura, 5.2147, 1e-3, 'el mismo ácido sin tampón'); cerca(F.datos.masH, 0.2589, 1e-4, 'H⁺ de más en el mar');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto || !p.corto || !p.dato)) falla('Lluvia ácida: faltan pasos, textos o datos');
    // el ejercicio de pH y valoraciones: ácido débil, sale el mismo pH
    cerca(P.resolver(F.ejercicio()).pH, F.datos.ph0, 2e-3, 'pH y valoraciones: pH de la lluvia');
    if (fallos === antes) console.log('  ✓ Lluvia ácida: pH de la lluvia limpia y ácida, veces más ácida, tampón del lago, mar, 6 pasos y el ejercicio de pH y valoraciones');
  }
  return async (browser) => {
    const antes = fallos;
    fallos += await require('./comun.js')({ path, publico, pagina, browser, mal, nombre: 'Lluvia ácida', clave: 'lluvia-acida',
      nombres: ['Lluvia', 'Humos', 'Nubes', 'Daños', 'Tampón', 'Mar'],
      prueba: { paso: 2, valor: 50, espera: '50 µmol/L de H₂SO₄ → pH 4,00' },
      destino: { href: '../../quimica/ph/', comprueba: (page) => page.evaluate(() => { const r = document.querySelector('#resumen, #res, .resumen'), t = r ? r.innerText : document.body.innerText; return /5,65/.test(t) ? '' : t.slice(0, 300); }) } });
    if (fallos === antes) console.log('  ✓ Lluvia ácida: pasos, línea de tiempo, datos destacados, historia, «Pruébalo tú», enlace que abre pH y valoraciones con los datos, modo oscuro y 390 px');
  };
};
