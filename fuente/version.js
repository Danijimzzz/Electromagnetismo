/* =====================================================================
   Versión del simulador y novedades. Sube el número con cada cambio publicado:
   el primero si hay algo nuevo (7.0), el segundo si es solo un arreglo (6.1).
   ===================================================================== */
const Version = (() => {
  const log = [
    { v: '6.7', fecha: '2026-10-23', cambios: ['Páginas de aviso legal, privacidad, cookies y contacto, enlazadas al pie de la barra lateral.'] },
    { v: '6.6', fecha: '2026-10-23', cambios: ['Doce ejercicios de ejemplo nuevos, con enunciados propios, en lugar de los del PDF de la asignatura: los mismos tipos de pregunta con otras figuras y otros números.', 'La guía de uso tiene capturas nuevas hechas con esos ejercicios.', 'La web publica solo la página, sin el código fuente, y está preparada para Cloudflare Pages además de Vercel.'] },
    { v: '6.5', fecha: '2026-10-22', cambios: ['Las novedades se agrupan por versión mayor (6, 5, 4…) y dentro de cada una se despliegan sus subversiones, como un índice con subíndices.'] },
    { v: '6.4', fecha: '2026-10-22', cambios: ['La web tiene icono propio: un dipolo con sus líneas de campo, en la pestaña del navegador, en la pantalla de inicio del móvil y en la vista previa al compartir el enlace.'] },
    { v: '6.3', fecha: '2026-10-22', cambios: ['Arreglo: las esferas de la vista 3D ya no tienen reflejo; el volumen lo dan la sombra del borde, el ecuador y los meridianos.'] },
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
