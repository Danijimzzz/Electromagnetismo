/* =====================================================================
   Lo planeado y lo futuro de la línea del tiempo (lo hecho sale solo de fuente/version.js).
   Se edita a mano. Cada punto: e = 'plan' | 'futuro', v = etiqueta corta, f = cuándo,
   t = título, i = icono, d = descripción, p = [[texto, hecho 1/0]], l = etiquetas,
   pr = PR o estado, sp = siguiente paso, pg = % a mano, curso = 1 si se está haciendo ya.
   Las herramientas que quedan «Próximamente» se leen de catalogo.js (ver generar.js).
   Resume las fases 13 a 18 del plan general (planes/plan-general-por-fases.md en los ficheros
   del proyecto, que es el que manda): al cerrar una fase se quita de aquí, porque pasa a salir
   sola como hecha desde version.js, y se revisan las demás contra el plan.
   ===================================================================== */
module.exports = [
  { e: 'plan', v: 'Fase 13', f: 'Web 1.15', t: 'Terminar la Fase 10', i: '🧩',
    d: 'Lo que la Web 1.13 dejó sin hacer y los puntos de prioridad alta que no se empezaron. Seis hilos en paralelo y uno que lo une.',
    p: [['Estadística: variable aleatoria discreta, errores correlacionados, intervalos de predicción, medias y teorema central del límite', 0],
      ['Matemáticas: Taylor, Superficies, entrada flexible y botones «Usar en…»', 0],
      ['Economía: Lorenz, amortización, punto muerto, regresión, índices, juegos 3 × 3 y práctica propia', 0],
      ['Física general: constantes unificadas (g, R, c, h, G) con el valor a la vista', 0],
      ['Química: anillos en Orgánica (cicloalcanos y bencenos), en hilo propio', 0],
      ['Común de la fase: lo que comparten las asignaturas, que va primero', 0]],
    l: ['Plan general', 'Fase 13'], pr: 'Pendiente', sp: 'Visto bueno de Dani a la lista y abrir los hilos por asignatura.' },
  { e: 'futuro', v: 'Fase 16', f: 'Web 1.19 y 1.20', t: 'Profundidad, segunda pasada', i: '🔬',
    d: 'Los puntos de prioridad alta y media de cada asignatura que no entraron en la Fase 13, en dos versiones.',
    p: [['Web 1.19: Electromagnetismo, Circuitos y Química', 0],
      ['Web 1.20: Física general, Matemáticas, Estadística y Economía', 0]],
    l: ['Plan general', 'Fase 16'], pr: 'Pendiente' },
  { e: 'futuro', v: 'Fase 17', f: 'Web 1.21', t: 'Estudiar mejor', i: '🎓',
    d: 'Ideas nuevas que se apoyan en la práctica, Mis ejercicios y «Tu espacio». Es una propuesta: cada una necesita el visto bueno de Dani.',
    p: [['Modo examen con nota y repaso de los fallos', 0],
      ['Progreso de práctica en «Tu espacio»', 0],
      ['Páginas por tema', 0],
      ['Formulario imprimible por asignatura', 0],
      ['Glosario enlazado', 0],
      ['«Comprueba tu resultado»', 0],
      ['Ejercicio del día en la portada', 0]],
    l: ['Plan general', 'Fase 17', 'Propuesta'], pr: 'Pendiente de Dani' },
  { e: 'futuro', v: 'Fase 18', f: 'Sin versión fija', t: 'Fenómenos, crecimiento y negocio', i: '🌐',
    d: 'Casi todo depende de una respuesta o de una acción de Dani. Se puede intercalar con las fases 13 a 16.',
    p: [['Pasos de «Cálculo» animados en los fenómenos', 0],
      ['Rehacer las escenas planas de los fenómenos anteriores a la 1.14', 0],
      ['Pila de limón y fenómenos de Química y Economía', 0],
      ['Dominio propio de Ciencify', 0],
      ['Anuncios: comprobar la colocación cuando Google apruebe', 0],
      ['Medición sin cookies y panel interno de uso', 0],
      ['Search Console y promoción por correo', 0]],
    l: ['Plan general', 'Fase 18', 'Decisión pendiente'], pr: 'Pendiente de Dani' },
  { e: 'futuro', v: 'Foro', f: 'Aparcado', t: 'Foro de la comunidad', i: '💬',
    d: 'Un foro propio dentro de la web. Aparcado sin fecha por decisión de Dani; en la web sale como «Próximamente».',
    p: [['Plan del foro escrito', 1], ['Elegir dónde alojarlo', 0], ['Moderación y registro', 0], ['Diseño de las páginas', 0]],
    l: ['Comunidad', 'Aparcado'], pr: 'Aparcado' },
];
