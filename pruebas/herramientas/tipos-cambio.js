/* Comprobación de Tipos de cambio y PPA: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo tipos-cambio). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Tipos de cambio';
  const C = require(path.join(fuente, 'tipos-cambio', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: 500 · 1,08 = 540 $, menos el 2 % = 529,2 $; 20.000 ¥ / 160 = 125 €
    cerca(ej('viaje').neto, 529.2, 1e-9, 'cambio con comisión'); cerca(ej('vuelta').neto, 125, 1e-9, 'yenes a euros');
    // cruzado: 0,85/1,08 = 0,787037 £ por dólar
    cerca(ej('cruzado').t, 0.85 / 1.08, 1e-12, 'tipo cruzado');
    // el euro baja de 1,10 a 1,05: −4,545 %; el dólar sube 1,10/1,05 − 1 = +4,762 %
    const v = ej('cae'); cerca(v.ve, -1 / 22, 1e-12, 'depreciación del euro'); cerca(v.vo, 1 / 21, 1e-12, 'apreciación del dólar');
    // Big Mac: E_PPA = 480/5,40 = 88,89 ¥/€; q = 160 · 5,40/480 = 1,8 → sobrevalorado un 80 %; 480 ¥ = 3 €
    const b = ej('bigmac'); cerca(b.Eppa, 480 / 5.4, 1e-9, 'tipo de la PPA'); cerca(b.q, 1.8, 1e-12, 'tipo real'); cerca(b.PeEur, 3, 1e-12, 'precio de fuera en euros');
    // PPA relativa: 1,08 · (1,02/1,03)^5 = 1,02858
    cerca(ej('inflacion').En, 1.08 * (1.02 / 1.03) ** 5, 1e-12, 'PPA relativa');
    // paridad cubierta: F = 1,08 · 1,05/1,03 = 1,100971; con F de mercado 1,12, invertir fuera rinde 1,08·1,05/1,12 = 1,0125 frente a 1,03 aquí
    const p = ej('paridad'); cerca(p.F, 1.08 * 1.05 / 1.03, 1e-12, 'tipo a plazo (paridad cubierta)'); cerca(p.prima, 1.05 / 1.03 - 1, 1e-12, 'prima del euro a plazo'); if (p.arb) mal(`${N}: sin tipo de mercado no hay arbitraje`);
    const ar = ej('arbitraje'); cerca(ar.arb.cubierta, 1.08 * 1.05 / 1.12, 1e-12, 'rendimiento cubierto fuera'); cerca(ar.arb.dg, 1.08 * 1.05 / 1.12 - 1.03, 1e-12, 'ganancia del arbitraje'); if (!(ar.arb.dg < 0)) mal(`${N}: con F mayor que el teórico conviene invertir aquí`);
    cerca(C.resolver({ ...C.ejemplos.find((e) => e.clave === 'paridad').sc, Fm: String(p.F).replace('.', ',') }).arb.dg, 0, 1e-9, 'sin arbitraje si el mercado da el tipo teórico');
    cerca(C.resolver({ ...C.ejemplos.find((e) => e.clave === 'paridad').sc, n: '2', i: '2', ie: '2' }).F, 1.08, 1e-12, 'mismos tipos de interés: F = E');
    error({ modo: 'paridad', mon: 'USD', E: '1,08', i: '3', ie: '5', n: '0' }, 'plazo cero'); error({ modo: 'paridad', mon: 'USD', E: '1,08', i: '3', ie: '', n: '1' }, 'sin tipo de interés fuera');
    error({ modo: 'cruzado', mon: 'USD', mon2: 'USD', E: '1', E2: '1' }, 'la misma moneda dos veces');
    error({ modo: 'convertir', mon: 'USD', sentido: 'aOtra', E: '0', x: '10', c: '' }, 'tipo de cambio 0');
    error({ modo: 'relativa', mon: 'USD', E: '1,08', pi: '3', pe: '2', n: '0' }, 'cero años');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano, comisión, tipo cruzado, apreciación, PPA, tipo real y errores`);
  }
  return Com.navegador({ publico, carpeta: 'tipos-cambio', nombre: N, app: 'TiposCambioApp', C, pagina, mal, malo: { k: 'E', v: '0' } });
};
