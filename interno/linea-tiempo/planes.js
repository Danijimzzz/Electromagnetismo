/* =====================================================================
   Lo planeado y lo futuro de la línea del tiempo (lo hecho sale solo de fuente/version.js).
   Se edita a mano. Cada punto: e = 'plan' | 'futuro', v = etiqueta corta, f = cuándo,
   t = título, i = icono, d = descripción, p = [[texto, hecho 1/0]], l = etiquetas,
   pr = PR o estado, sp = siguiente paso, pg = % a mano, curso = 1 si se está haciendo ya.
   Las herramientas que quedan «Próximamente» se leen de catalogo.js (ver generar.js).
   ===================================================================== */
module.exports = [
  { e: 'plan', v: 'Fenómenos', f: 'Fase 2', t: 'Cinco fenómenos de la vida real', i: '⚡',
    fen: ['rayo', 'auroras', 'altavoz-motor', 'cocina-induccion', 'cargador-inalambrico'],
    d: 'Los fenómenos de «Física en la vida real» que tocan en la fase 2 de la hoja de ruta.', l: ['Física en la vida real', 'Fase 2'] },
  { e: 'futuro', v: 'Fase 3', f: 'Después', t: 'Herramientas de dificultad media', i: '📡',
    claves: ['maxwell', 'fresnel', 'gravitacion', 'optica', 'bode', 'convolucion', 'laplace-numerica', 'imagenes', 'guias-onda', 'antena'],
    fen: ['olla-presion', 'tension-paso', 'cielo-azul'],
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
