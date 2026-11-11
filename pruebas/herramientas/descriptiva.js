/* Comprobación de Estadística descriptiva: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo descriptiva). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Estadística descriptiva';
  const C = require(path.join(fuente, 'descriptiva', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // notas ordenadas: 3 4 4 5 5 5 5 6 6 6 6 6 7 7 7 7 8 8 9 10 (N = 20, suma 124, suma de cuadrados 826)
    const n = ej('notas'); cerca(n.media, 6.2, 1e-12, 'media de las notas'); cerca(n.varz, 826 / 20 - 6.2 ** 2, 1e-9, 'varianza de las notas');
    cerca(n.Me, 6, 0, 'mediana'); cerca(n.Q1, 5, 0, 'Q1'); cerca(n.Q3, 7, 0, 'Q3'); cerca(n.P, 8.5, 0, 'P90 (18 coincide con Nᵢ: media de 8 y 9)');
    if (n.moda.join() !== '6') mal(`${N}: la moda de las notas es ${n.moda}, no 6`);
    // hijos: N = 40, 3·N/4 = 30 coincide con N = 30 del 2 ⇒ Q3 = (2 + 3)/2
    const h = ej('hijos'); cerca(h.Q3, 2.5, 0, 'Q3 de los hijos'); cerca(h.media, 71 / 40, 1e-12, 'media de los hijos');
    // estaturas: mediana 165 + (25 − 22)/15·5 = 166; moda de Czuber 165 + 3/(3 + 6)·5
    const a = ej('alturas'); cerca(a.Me, 166, 1e-9, 'mediana agrupada'); cerca(a.moda[0], 165 + 5 / 3, 1e-9, 'moda de Czuber'); cerca(a.media, 165.7, 1e-9, 'media agrupada');
    // salarios: 4800 es atípico; cuasivarianza (entre N − 1)
    const s = ej('salarios'); if (s.atipicos.join() !== '4800') mal(`${N}: los atípicos de los salarios son ${s.atipicos}`);
    const v = [1350, 1420, 1380, 1500, 1460, 1390, 1410, 1550, 1440, 4800], m = v.reduce((x, y) => x + y) / 10;
    cerca(s.varz, v.reduce((x, y) => x + (y - m) ** 2, 0) / 9, 1e-6, 'cuasivarianza de los salarios');
    // ponderada por créditos: (7,5·6 + 6·6 + 9·4,5 + 5,5·9 + 8·3)/28,5 = 195/28,5
    const ex = ej('expediente'); cerca(ex.mp, 195 / 28.5, 1e-12, 'media ponderada'); cerca(ex.media, 7.2, 1e-12, 'media sin pesos');
    // geométrica y armónica: 2 y 8 ⇒ G = 4, H = 3,2; los factores de crecimiento ⇒ (1,05·1,12·0,97·1,08)^(1/4)
    const ga = C.resolver({ formato: 'lista', datos: '2 8' }); cerca(ga.mg, 4, 1e-12, 'media geométrica'); cerca(ga.mh, 3.2, 1e-12, 'media armónica');
    cerca(ej('crecimiento').mg, (1.05 * 1.12 * 0.97 * 1.08) ** 0.25, 1e-12, 'geométrica de los factores');
    // con frecuencias: 1 (×2) y 4 (×1) ⇒ G = ∛4, H = 3/(2 + 1/4)
    const gt = C.resolver({ formato: 'tabla', datos: '1 2\n4 1' }); cerca(gt.mg, Math.cbrt(4), 1e-12, 'geométrica con frecuencias'); cerca(gt.mh, 3 / 2.25, 1e-12, 'armónica con frecuencias');
    if (C.resolver({ formato: 'lista', datos: '0 2 4' }).mg !== null) mal(`${N}: da media geométrica con un cero`);
    error({ formato: 'lista', datos: '5 6 7', pesos: '1 2' }, 'menos pesos que datos');
    error({ formato: 'lista', datos: '5 6 7', pesos: '0 0 0' }, 'pesos todos cero');
    error({ formato: 'lista', datos: '5 6 7', pesos: '1 −2 3' }, 'peso negativo');
    error({ formato: 'lista', datos: '5' }, 'un solo dato');
    error({ formato: 'lista', datos: '5 a 6' }, 'una letra');
    error({ formato: 'intervalos', datos: '0 10 3\n5 15 2' }, 'intervalos solapados');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, cuartiles con y sin agrupar, Czuber, cuasivarianza, medias geométrica, armónica y ponderada, atípicos y errores`);
  }
  return Com.navegador({ publico, asignatura: 'estadistica', carpeta: 'descriptiva', nombre: N, app: 'DescriptivaApp', C, pagina, mal, malo: { k: 'datos', v: '5' } });
};
