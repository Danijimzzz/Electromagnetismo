/* =====================================================================
   «Límites de esta herramienta» (Fase 10, 10.12): lo que una herramienta NO hace o simplifica, dicho
   en la propia página para que nadie lo descubra con un resultado raro. diseno.js pone el recuadro
   justo antes de las preguntas frecuentes de las herramientas que tienen entrada aquí; sin entrada no
   sale nada. Cada línea es texto plano (frase completa, sin HTML). La clave es la de la herramienta
   (su carpeta). Al cambiar una herramienta para que haga algo de esto, hay que quitar la línea.
   ===================================================================== */
const LIMITES = {
  organica: [
    'Solo moléculas sin anillos (cadenas y ramas) hechas de C, H, N, O, F, S, Cl, Br e I: un SMILES con ciclos, aromáticos o átomos de otros elementos se rechaza con un aviso.',
    'El nombre IUPAC cubre los casos habituales de cadenas y sustituyentes; si la molécula se sale de lo que sabe nombrar, lo dice en vez de inventar un nombre.',
    'La forma 3D es una geometría aproximada para ver la disposición de los átomos, no una optimización de energía.'
  ],
  'termo-estadistica': [
    'Parte de niveles de energía discretos y de la distribución de Boltzmann (partículas distinguibles o niveles de un sistema). No incluye las estadísticas de Fermi-Dirac ni de Bose-Einstein: no vale para gases cuánticos degenerados.',
    'El sólido de Einstein da una sola frecuencia para todos los osciladores: no reproduce el modelo de Debye a baja temperatura.'
  ],
  anova: [
    'Las comparaciones por parejas usan solo la corrección de Bonferroni; no hay Tukey ni otras pruebas post hoc.',
    'Supone que los grupos son independientes, con datos aproximadamente normales y varianzas parecidas: la herramienta no puede comprobarlo por ti con pocos datos.'
  ],
  gases: [
    'Redlich-Kwong usa los mismos Tc y Pc que Van der Waals (derivados de a y b), no valores críticos de tabla: es una comparación de modelos, no un dato experimental del gas.',
    'Los modelos de gas real solo valen en la zona de una sola fase: cerca del punto crítico o dentro de la zona de condensación los resultados dejan de ser fiables.'
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
