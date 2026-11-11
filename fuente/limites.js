/* =====================================================================
   «Límites de esta herramienta» (Fase 10, 10.12): lo que una herramienta NO hace o simplifica, dicho
   en la propia página para que nadie lo descubra con un resultado raro. diseno.js pone el recuadro
   justo antes de las preguntas frecuentes de las herramientas que tienen entrada aquí; sin entrada no
   sale nada. Cada línea es texto plano (frase completa, sin HTML). La clave es la de la herramienta
   (su carpeta). Al cambiar una herramienta para que haga algo de esto, hay que quitar la línea.
   ===================================================================== */
const LIMITES = {
  organica: [
    'Solo moléculas sin anillos (cadenas y ramas) hechas de C, H, N, O, F, S, Cl, Br e I, escritas en SMILES o en fórmula semidesarrollada: los ciclos, los aromáticos y los átomos de otros elementos se rechazan con un aviso.',
    'El nombre IUPAC cubre los casos habituales de cadenas y sustituyentes; si la molécula se sale de lo que sabe nombrar, lo dice en vez de inventar un nombre.',
    'La forma 3D es una geometría aproximada para ver la disposición de los átomos, no una optimización de energía.'
  ],
  'termo-estadistica': [
    'Parte de niveles de energía discretos y de la distribución de Boltzmann (partículas distinguibles o niveles de un sistema). No incluye las estadísticas de Fermi-Dirac ni de Bose-Einstein: no vale para gases cuánticos degenerados.',
    'El sólido de Einstein da una sola frecuencia para todos los osciladores: no reproduce el modelo de Debye a baja temperatura.'
  ],
  anova: [
    'Las comparaciones por parejas (Tukey, Bonferroni, Holm, Scheffé y Games-Howell) se eligen a mano: la herramienta no decide por ti cuál corresponde. Con dos factores no hay Games-Howell.',
    'Supone que los grupos son independientes, con datos aproximadamente normales y varianzas parecidas: la herramienta no puede comprobarlo por ti con pocos datos.'
  ],
  gases: [
    'Redlich-Kwong usa los mismos Tc y Pc que Van der Waals (derivados de a y b), no valores críticos de tabla: es una comparación de modelos, no un dato experimental del gas.',
    'Los modelos de gas real solo valen en la zona de una sola fase: cerca del punto crítico o dentro de la zona de condensación los resultados dejan de ser fiables.'
  ],
  vsepr: [
    'La estructura de Lewis es para elementos de los grupos principales y moléculas con todos los electrones apareados: los metales de transición y los radicales (número impar de electrones, como NO o NO₂) se rechazan con un aviso.',
    'Con un átomo central, los átomos de alrededor pueden ser H, halógenos, O, S o Se. Las moléculas con varios centros se escriben en forma semidesarrollada y sin anillos.',
    'La geometría sale del recuento de pares de electrones (VSEPR): los ángulos son los ideales o los típicos de libro cuando hay pares libres (unos 107° o 104,5°), no el ángulo medido de cada molécula.'
  ],
  formulacion: [
    'En los compuestos de coordinación solo se admite un metal central, con los metales y ligandos de la tabla de la herramienta: no nombra complejos con varios metales, ligandos puente ni isómeros (cis/trans, fac/mer).',
    'El paso de nombre a fórmula de un complejo busca en una lista de unos 50 complejos del temario, no interpreta cualquier nombre.'
  ],
  markowitz: [
    'Trabaja con 2 a 6 activos y con las rentabilidades, volatilidades y correlaciones que tú escribes: no las estima a partir de cotizaciones históricas.',
    'Es el modelo de media y varianza de un solo periodo: no tiene en cuenta comisiones, impuestos ni límites de peso por activo (solo permitir o no las ventas en corto).'
  ],
  'teoria-juegos': [
    'Son juegos simultáneos de dos jugadores: no hay árbol de decisión secuencial (subjuego perfecto) ni más de tres estrategias por jugador.',
    'En la matriz 3 × 3 se halla el equilibrio de Nash en estrategias puras y se eliminan las estrategias estrictamente dominadas por una estrategia pura; el equilibrio mixto solo se calcula en 2 × 2.'
  ],
  'black-scholes': [
    'Valora solo opciones europeas (se ejercen al vencimiento): no vale para opciones americanas con ejercicio anticipado ni para opciones exóticas.',
    'Supone volatilidad y tipo de interés constantes y un dividendo continuo en porcentaje: no admite dividendos discretos en fechas concretas ni sonrisa de volatilidad.'
  ],
  simulador: [
    'Al importar un circuito SPICE se traduce el subconjunto que el simulador soporta; todo lo demás (subcircuitos, interruptores, fuentes con expresión, análisis propios) se omite y se lista línea por línea en los avisos de la importación.',
    'El análisis es de circuitos lineales (con los componentes ideales de la paleta): no calcula ruido ni dispersión de tolerancias (Monte Carlo).'
  ]
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const html = (herramienta) => (LIMITES[herramienta] && LIMITES[herramienta].length
  ? `<section class="limites" aria-label="Límites de esta herramienta">\n<h2>Límites de esta herramienta</h2>\n<ul>\n${LIMITES[herramienta].map((l) => `<li>${esc(l)}</li>`).join('\n')}\n</ul>\n</section>\n` : '');
if (typeof module !== 'undefined') module.exports = { LIMITES, html };
