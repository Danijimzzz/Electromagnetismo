/* =====================================================================
   Versión del simulador y novedades. Sube el número con cada cambio publicado:
   el primero si hay algo nuevo (7.0), el segundo si es solo un arreglo (6.1).
   ===================================================================== */
const Version = (() => {
  const log = [
    { v: '6.2', fecha: '2026-10-22', cambios: ['Arreglo: en la vista 3D las esferas, cascarones y conductores tienen volumen (sombreado, ecuador y meridianos) y ya no parecen círculos planos.', 'Las notas de cada versión se abren y cierran por separado; solo la actual aparece abierta.'] },
    { v: '6.1', fecha: '2026-10-22', cambios: ['Arreglo: en la vista 3D los cilindros cargados se dibujan con su radio real (antes eran una línea gruesa) y las superficies de Gauss, cilíndricas o esféricas, también aparecen.'] },
    { v: '6.0', fecha: '2026-10-22', cambios: ['Número de versión visible y este apartado de novedades.', 'Comprobación automática de los 12 ejercicios antes de publicar cada cambio.'] },
    { v: '5.0', fecha: '2026-10-22', cambios: ['Los resultados de los 12 ejercicios se escriben con la misma forma que el solucionario oficial.', 'Perfiles por tramos, factor común en logaritmos y radicales, y la pregunta V_A − V_B.'] },
    { v: '4.0', fecha: '2026-10-22', cambios: ['Guía de uso con capturas (botón ?, barra lateral o F1).'] },
    { v: '3.0', fecha: '2026-10-22', cambios: ['Anillos, discos, cortezas y conductores.', 'Varias incógnitas, modo numérico SI, flujo de Gauss y gráficas E(z) y V(z).', 'Modo práctica, exportar la solución, deshacer y rehacer, mapa de color y vista 3D.', 'Búsqueda, carpetas y etiquetas en la barra lateral.'] },
    { v: '2.0', fecha: '2026-10-22', cambios: ['Barra lateral con Mis problemas, Importados y Ejercicios del Tema 3.', 'Título y enunciado editables; archivos .emsim.json.'] },
    { v: '1.0', fecha: '2026-10-22', cambios: ['Primera versión con los 12 ejercicios del Tema 3.'] },
  ];
  return { current: log[0].v, log };
})();
if (typeof module !== 'undefined') module.exports = Version;
