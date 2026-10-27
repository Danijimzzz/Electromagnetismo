/* =====================================================================
   Común de las herramientas de Economía (Eco): lo de Calculadora
   (calculadora.js: formato, lectura de campos, listas, tablas y gráfica)
   más euros y porcentajes. Va en «scripts» de catalogo.js después de
   calculadora.js; en Node, cada calculo.js lo pide con require.
     dinero(x, dec)   «1.234,56 €»
     pct(x, dec)      fracción → «3,25 %»
   ===================================================================== */
const Eco = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const dinero = (x, dec = 2) => `${K.num(x, dec)} €`;
  const pct = (x, dec = 2) => `${K.num(100 * x, dec)} %`;
  return { ...K, dinero, pct };
})();
if (typeof module !== 'undefined') module.exports = Eco;
