/* =====================================================================
   Lo planeado y lo futuro de la línea del tiempo (lo hecho sale solo de fuente/version.js).
   Se edita a mano. Cada punto: e = 'plan' | 'futuro', v = etiqueta corta, f = cuándo,
   t = título, i = icono, d = descripción, p = [[texto, hecho 1/0]], l = etiquetas,
   pr = PR o estado, sp = siguiente paso, pg = % a mano, curso = 1 si se está haciendo ya.
   Las herramientas que quedan «Próximamente» se leen de catalogo.js (ver generar.js).
   ===================================================================== */
module.exports = [
  { e: 'plan', curso: 1, v: 'Web 1.4.2', f: 'En curso', t: 'Modo Ecuaciones en puertas lógicas', i: '🧮',
    d: 'Un tercer modo para escribir una ecuación booleana y ver su circuito tal cual o simplificado. Está en un PR en borrador a la espera de salir junto con el simulador de circuitos.',
    p: [['Lector de ecuaciones booleanas', 1], ['Circuito tal cual y simplificado', 1], ['Salir junto al simulador de circuitos', 0]],
    l: ['Circuitos', 'PR en borrador'], pr: 'Borrador #87', sp: 'Esperar a que el simulador de circuitos esté terminado y publicar los dos cambios en un único PR.' },
  { e: 'plan', v: 'Web 1.5', f: 'Próximamente', t: 'Simulador de circuitos', i: '⚡',
    d: 'Un solo simulador de corriente continua y alterna con editor de arrastrar y soltar, que sustituye a Continua, Alterna y Transitorios.',
    p: [['Motor de cálculo con pruebas de equivalencia', 0], ['Editor de esquemas compartido', 0], ['Todos los componentes en el primer lanzamiento', 0], ['Retirar las herramientas antiguas sin romper enlaces', 0]],
    l: ['Circuitos', 'Gran cambio'], pr: 'Plan aprobado', pg: 5, sp: 'Construir el motor y comprobar que da lo mismo que las herramientas actuales.' },
  { e: 'plan', v: 'Fenómenos', f: 'Fase 2', t: 'Cinco fenómenos de la vida real', i: '⚡',
    fen: ['rayo', 'auroras', 'altavoz-motor', 'cocina-induccion', 'cargador-inalambrico'],
    d: 'Los fenómenos de «Física en la vida real» que tocan en la fase 2 de la hoja de ruta.', l: ['Física en la vida real', 'Fase 2'] },
  { e: 'futuro', v: 'Fase 3', f: 'Después', t: 'Herramientas de dificultad media', i: '📡',
    claves: ['maxwell', 'fresnel', 'gravitacion', 'optica', 'bode', 'convolucion', 'laplace-numerica', 'imagenes', 'guias-onda', 'antena'],
    fen: ['olla-presion', 'gps-relatividad', 'tension-paso', 'cielo-azul'],
    d: 'La tercera fase de la hoja de ruta, ordenada solo por dificultad de construcción.', l: ['Hoja de ruta', 'Fase 3'] },
  { e: 'futuro', v: 'Fase 4', f: 'Más adelante', t: 'Herramientas difíciles', i: '🔬',
    claves: ['lineas-transmision', 'superficies', 'balance', 'integrales-multiples', 'redox', 'vsepr', 'formulacion'],
    fen: ['arcoiris'],
    d: 'Lo más trabajoso de construir: va el último.', l: ['Hoja de ruta', 'Fase 4'] },
  { e: 'futuro', v: 'Foro', f: 'Sin fecha', t: 'Foro de la comunidad', i: '💬',
    d: 'Un foro propio dentro de la web. Hay un plan con la opción recomendada y falta contestar las decisiones.',
    p: [['Plan del foro escrito', 1], ['Elegir dónde alojarlo', 0], ['Moderación y registro', 0], ['Diseño de las páginas', 0]],
    l: ['Comunidad', 'Decisión pendiente'], pr: 'Pendiente de Dani' },
  { e: 'futuro', v: 'Dominio', f: 'Sin fecha', t: 'Dominio propio', i: '🌐',
    d: 'Comprar un dominio propio. En pausa hasta saber si hay que cambiar el nombre de la web.',
    p: [['Resolver el tema del nombre', 0], ['Comprar el dominio', 0], ['Redirigir las direcciones actuales', 0]],
    l: ['Web', 'En pausa'], pr: 'En pausa' },
];
