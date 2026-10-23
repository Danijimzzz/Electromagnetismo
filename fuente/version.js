/* =====================================================================
   Versiones y novedades: la web (portada, asignaturas, buscador) tiene su número y cada
   herramienta el suyo. Hasta el lanzamiento se numera 0.x (beta); la 1.0 de una herramienta
   llega cuando se da por terminada y la 1.0 de la web será el lanzamiento. Sube el segundo
   número si hay algo nuevo (0.6) y añade un tercero si es solo un arreglo (0.5.1).
   En las novedades de la web se anuncia también cada herramienta nueva.
   Las notas son para los usuarios: solo funciones nuevas, arreglos visibles y cambios
   en la interfaz. Lo interno (pruebas, CI, build, despliegue, refactorizaciones) no se anota;
   el historial completo para desarrolladores está en Notion.
   ===================================================================== */
const Version = (() => {
  const registros = {
    web: [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Portada para elegir asignatura y herramienta: Electromagnetismo, Física general, Química, Matemáticas y Laboratorio, con buscador. Las herramientas que vienen después aparecen como «Próximamente».', 'Nueva herramienta: Magnetostática, en Electromagnetismo.'] },
    ],
    electrostatica: [
      { v: '0.5.1', fecha: '2026-10-23', cambios: ['El simulador tiene ahora su propia dirección, /electromagnetismo/electrostatica/. Tus problemas guardados siguen ahí. El botón «Todas las herramientas» de la barra lateral vuelve a la portada.'] },
    { v: '0.5', fecha: '2026-10-23', cambios: ['Doce ejercicios de ejemplo con enunciados propios: los mismos tipos de pregunta que en clase, con otras figuras y otros números. La guía de uso tiene capturas nuevas hechas con ellos.', 'La web tiene icono propio: un dipolo con sus líneas de campo, en la pestaña del navegador, en la pantalla de inicio del móvil y en la vista previa al compartir el enlace.', 'Páginas de aviso legal, privacidad, cookies y contacto, enlazadas al pie de la barra lateral.'] },
    { v: '0.4', fecha: '2026-10-22', cambios: ['Número de versión visible y este apartado de novedades.', 'Arreglo: en la vista 3D los cilindros se dibujan con su radio real, aparecen las superficies de Gauss, y las esferas, cascarones y conductores tienen volumen en lugar de parecer círculos planos.'] },
    { v: '0.3', fecha: '2026-10-22', cambios: ['Guía de uso con capturas (botón ?, barra lateral o F1).', 'Los resultados se escriben con la misma forma que el solucionario oficial: perfiles por tramos, factor común en logaritmos y radicales, y la pregunta V_A − V_B.'] },
    { v: '0.2', fecha: '2026-10-22', cambios: ['Anillos, discos, cortezas y conductores.', 'Varias incógnitas, modo numérico SI, flujo de Gauss y gráficas E(z) y V(z).', 'Modo práctica, exportar la solución, deshacer y rehacer, mapa de color y vista 3D.', 'Búsqueda, carpetas y etiquetas en la barra lateral.'] },
    { v: '0.1', fecha: '2026-10-22', cambios: ['Primera versión: cargas, hilos, planos y esferas con el desarrollo paso a paso y 12 ejercicios resueltos.', 'Barra lateral con tus problemas, los importados y los ejercicios; título y enunciado editables; archivos .emsim.json.'] },
    ],
    magnetostatica: [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: campo magnético de hilos, segmentos, hilos semiinfinitos, espiras, arcos, solenoides y toroides con Biot-Savart, y fuerza sobre cargas en movimiento y sobre conductores, con el desarrollo paso a paso en la forma μ₀I/(πa) o en unidades del SI.', 'Dibujo del campo B en el plano XY, XZ o YZ, con puntos que se pueden arrastrar y ocho ejemplos resueltos.'] },
    ],
  };
  const de = (h) => ({ current: registros[h][0].v, log: registros[h] });
  // Version.current y Version.log son los del simulador de electrostática
  return { registros, de, ...de('electrostatica') };
})();
if (typeof module !== 'undefined') module.exports = Version;
