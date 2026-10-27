/* Comprobación de Números índice y tasas de variación: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo numeros-indice). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Números índice';
  const C = require(path.join(fuente, 'numeros-indice', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: 350/250 = 1,4 → índice 140, acumulada 40 %, media 1,4^(1/5) − 1; 2020: 240/270 − 1
    const v = ej('ventas'); cerca(v.filas[5].i, 140, 1e-9, 'índice 2023'); cerca(v.ta, 0.4, 1e-12, 'tasa acumulada'); cerca(v.tm, 1.4 ** 0.2 - 1, 1e-12, 'tasa media'); cerca(v.filas[2].tv, 240 / 270 - 1, 1e-12, 'tasa 2020');
    cerca(ej('cambio-base').filas[0].i, 10000 / 102.8, 1e-9, 'cambio de base');
    // cesta: ∑p0q0 = 360, ∑p1q0 = 460, ∑p1q1 = 417, ∑p0q1 = 333
    const c = ej('cesta'); cerca(c.L, 46000 / 360, 1e-9, 'Laspeyres'); cerca(c.P, 41700 / 333, 1e-9, 'Paasche'); cerca(c.F, Math.sqrt((46000 / 360) * (41700 / 333)), 1e-9, 'Fisher'); cerca(c.V, 41700 / 360, 1e-9, 'valor');
    error({ modo: 'serie', datos: '2020 100', base: '2020' }, 'un solo periodo');
    error({ modo: 'serie', datos: '2020 100\n2021 110', base: '2019' }, 'base que no está');
    error({ modo: 'cesta', cesta: '1 2 3' }, 'faltan columnas');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, cambio de base, tasas, Laspeyres, Paasche, Fisher y errores`);
  }
  return Com.navegador({ publico, carpeta: 'numeros-indice', nombre: N, app: 'NumerosIndiceApp', C, pagina, mal, malo: { k: 'base', v: '1990' } });
};
