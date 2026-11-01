/* Comprobación de Teoría de juegos: cálculos a mano en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo teoria-juegos). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Teoría de juegos';
  const C = require(path.join(fuente, 'teoria-juegos', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    const nash = (r) => r.nash.map((t) => t.join('')).join(',');
    const igual = (a, b, q) => { if (a !== b) mal(`${N} · ${q}: «${a}» en vez de «${b}»`); };
    // prisionero: confesar domina (0 > −1 y −5 > −10); Nash único en (1,1) con (−5, −5); (−1, −1) mejora a los dos; q = (−5 + 10)/4 = 1,25 no vale
    let r = ej('prisionero');
    igual(nash(r), '11', 'prisionero: Nash'); igual(r.domF.i + '' + r.domC.i + r.domF.fuerte, '11true', 'prisionero: dominantes');
    if (r.mixto) mal(`${N}: el dilema del prisionero no tiene equilibrio mixto`);
    if (!/^Dilema del prisionero/.test(r.tipo)) mal(`${N}: no reconoce el dilema del prisionero (${r.tipo})`);
    igual(r.pareto.flat().join(), 'true,true,true,false', 'prisionero: Pareto');
    // coordinación: Nash en (0,0) y (1,1); q = (1 − 0)/(2 − 0 − 0 + 1) = 1/3 = p; u = 2/3
    r = ej('coordinacion'); igual(nash(r), '00,11', 'coordinación: Nash'); cerca(r.mixto.p, 1 / 3, 1e-12, 'coordinación: p'); cerca(r.mixto.q, 1 / 3, 1e-12, 'coordinación: q'); cerca(r.mixto.u1, 2 / 3, 1e-12, 'coordinación: u1');
    if (!/^Juego de coordinación/.test(r.tipo)) mal(`${N}: no reconoce la coordinación`);
    // gallina: Nash en (0,1) y (1,0); q = (1 − 2)/(−10 − 2 − 0 + 1) = 1/11; u1 = 10/11
    r = ej('gallina'); igual(nash(r), '01,10', 'gallina: Nash'); cerca(r.mixto.p, 1 / 11, 1e-12, 'gallina: p'); cerca(r.mixto.q, 1 / 11, 1e-12, 'gallina: q'); cerca(r.mixto.u1, 10 / 11, 1e-12, 'gallina: u1');
    if (!/^Juego de la gallina/.test(r.tipo)) mal(`${N}: no reconoce la gallina`);
    // cara o cruz: ningún Nash puro; p = q = 1/2; pago esperado 0
    r = ej('pares'); igual(nash(r), '', 'cara o cruz: Nash'); cerca(r.mixto.p, 0.5, 1e-12, 'cara o cruz: p'); cerca(r.mixto.q, 0.5, 1e-12, 'cara o cruz: q'); cerca(r.mixto.u1, 0, 1e-12, 'cara o cruz: u1');
    // batalla de los sexos: q = (2 − 0)/5 = 0,4; p = (3 − 0)/5 = 0,6; u1 = 0,4·3 = 1,2 = u2 = 0,6·2
    r = ej('batalla'); igual(nash(r), '00,11', 'batalla: Nash'); cerca(r.mixto.q, 0.4, 1e-12, 'batalla: q'); cerca(r.mixto.p, 0.6, 1e-12, 'batalla: p'); cerca(r.mixto.u1, 1.2, 1e-12, 'batalla: u1'); cerca(r.mixto.u2, 1.2, 1e-12, 'batalla: u2');
    // empresas: bajar domina; Nash (1,1) con (6, 6) y (10, 10) mejora a las dos
    r = ej('cuota'); igual(nash(r), '11', 'empresas: Nash'); if (!/^Dilema/.test(r.tipo)) mal(`${N}: las empresas son un dilema`);
    // dominancia débil: A = [[1,1],[1,0]] ⇒ la fila 0 domina débilmente
    r = C.resolver({ ...C.ejemplos[0].sc, a11: '1', a12: '1', a21: '1', a22: '0' });
    if (!r.domF || r.domF.i !== 0 || r.domF.fuerte) mal(`${N}: no detecta la dominancia débil`);
    error({ ...C.ejemplos[0].sc, a12: '' }, 'un pago vacío');
    error({ ...C.ejemplos[0].sc, b22: 'x' }, 'un pago que no es número');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (Nash puro y mixto, dominancia, Pareto y tipo de juego) y errores`);
  }
  return Com.navegador({ publico, carpeta: 'teoria-juegos', nombre: N, app: 'TeoriaJuegosApp', C, pagina, mal, malo: { k: 'a11', v: 'x' } });
};
