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
      { v: '0.9', fecha: '2026-10-23', cambios: ['Nueva herramienta: Calorimetría y cambios de fase, en Física general.'] },
      { v: '0.8', fecha: '2026-10-23', cambios: ['Nueva herramienta: Disoluciones y concentraciones, en Química.'] },
      { v: '0.7', fecha: '2026-10-23', cambios: ['Nueva herramienta: Tiro parabólico y cinemática, en Física general.'] },
      { v: '0.6', fecha: '2026-10-23', cambios: ['Nueva herramienta: Condensadores con dieléctricos, en Electromagnetismo.'] },
      { v: '0.5', fecha: '2026-10-23', cambios: ['Nueva herramienta: Configuración electrónica, en Química.'] },
      { v: '0.4', fecha: '2026-10-23', cambios: ['Nueva herramienta: Masa molar y estequiometría, en Química.'] },
      { v: '0.3', fecha: '2026-10-23', cambios: ['Nueva herramienta: Trabajo y energía, en Física general.'] },
      { v: '0.2', fecha: '2026-10-23', cambios: ['Nueva herramienta: Tabla periódica interactiva, en Química.'] },
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
    'tabla-periodica': [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: cada elemento tiene su ficha con la masa atómica y molar, el grupo, el periodo, el bloque, la configuración electrónica (abreviada, completa y por capas), la electronegatividad, la energía de ionización, el radio y el estado.', 'La tabla se puede colorear por categoría, electronegatividad, energía de ionización, radio, masa, bloque o estado, y tiene un buscador por nombre, símbolo o número atómico.'] },
    ],
    'trabajo-y-energia': [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: un bloque baja por una rampa con rozamiento, recorre un tramo horizontal y comprime un muelle. Animación con barras de energía cinética, gravitatoria, elástica y calor, gráfica de las energías en el tiempo y el desarrollo paso a paso con la velocidad al pie de la rampa, al llegar al muelle y la compresión máxima.', 'Seis ejemplos: sin rozamiento, se para antes del muelle, el rozamiento lo sujeta, con empujón inicial y muelle duro.'] },
    ],
    'masa-molar': [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: masa molar y composición centesimal de cualquier fórmula, con paréntesis, hidratos e iones, y conversor entre gramos, moles, partículas y litros de gas.', 'Estequiometría: ajusta la reacción sola (también las iónicas), calcula el reactivo limitante, lo que se forma con el rendimiento que digas y lo que sobra, paso a paso.', 'Masas atómicas de la IUPAC o redondeadas como en clase.'] },
    ],
    'configuracion-electronica': [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: configuración electrónica de cualquier elemento o ion por orden de llenado, abreviada y por capas, con el diagrama de Moeller, el diagrama de orbitales con la regla de Hund, los electrones desapareados y los números cuánticos del electrón diferenciador.', 'Avisa de las excepciones como el cromo o el cobre, y en los cationes quita primero los electrones de la capa más externa.'] },
    ],
    condensadores: [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: condensadores planos, cilíndricos y esféricos con capas de dieléctrico en serie o, en el plano, ocupando parte del área. Capacidad, carga, tensión y energía; campos E, D y P en cada capa y cargas de polarización, con el desarrollo paso a paso.', 'Compara con el condensador vacío: qué pasa al meter el dieléctrico con la batería conectada o con el condensador aislado.', 'Dibujo del corte con las líneas de campo y gráfica de E a lo largo del condensador.'] },
    ],
    'tiro-parabolico': [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: tiro parabólico desde cualquier altura hasta cualquier altura, con el tiempo de vuelo, la altura máxima, el alcance y la velocidad al caer, y el desarrollo paso a paso. Trayectoria animada con los vectores de velocidad y gráficas de posición, velocidad y aceleración frente al tiempo.', 'Rozamiento del aire lineal o cuadrático, comparado con la trayectoria sin rozamiento.', 'Blanco: dice si el proyectil pasa por un punto y con qué dos ángulos se acierta.', 'Movimiento rectilíneo (MRU y MRUA): posición y velocidad en un instante, cuándo pasa por un punto y cuándo se para, con las gráficas x(t), v(t) y a(t).'] },
    ],
    disoluciones: [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: da la concentración de una disolución como molaridad, molalidad, fracción molar, % en masa, % masa/volumen, g/L o ppm y obtén todas las demás, con la densidad para pasar de masa a volumen y el desarrollo con su base de cálculo.', 'Preparar una disolución: los gramos de sólido (con su pureza) o los mililitros de reactivo comercial (con su riqueza y densidad) que hay que medir.', 'Diluciones con C₁V₁ = C₂V₂, despejando el dato que falte, y mezcla de dos disoluciones del mismo soluto.'] },
    ],
    calorimetria: [
      { v: '0.1', fecha: '2026-10-23', cambios: ['Primera versión: temperatura de equilibrio al mezclar hasta cinco cuerpos de agua, hielo, vapor, metales, etanol, vidrio, un calorímetro o una sustancia con tus datos, con los cambios de fase que hagan falta.', 'Si la energía no llega para fundir todo el hielo o condensar todo el vapor, dice cuántos gramos quedan de cada fase.', 'Tabla con el calor de cada cuerpo, el desarrollo etapa por etapa (m c ΔT y m L) y la curva de calentamiento de cada uno.'] },
    ],
  };
  const de = (h) => ({ current: registros[h][0].v, log: registros[h] });
  // Version.current y Version.log son los del simulador de electrostática
  return { registros, de, ...de('electrostatica') };
})();
if (typeof module !== 'undefined') module.exports = Version;
