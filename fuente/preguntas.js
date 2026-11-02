/* =====================================================================
   SEO de contenido: preguntas frecuentes de cada herramienta («¿Cómo se calcula…?»
   con un ejemplo resuelto) y enlaces entre herramientas de distintas asignaturas.
   - preguntas/<asignatura>.js: { clave: [[pregunta, respuesta], …] }, texto plano.
   - html(clave): la sección «Preguntas frecuentes» que diseno.js pone tras la teoría.
   - jsonld(clave): el FAQPage de schema.org que seo.js junta con el resto (el texto
     es el mismo que se ve en la página, como pide Google).
   - ENLACES: herramientas de OTRA asignatura que se parecen; diseno.js las pone primero
     en «Herramientas relacionadas». Formato 'asignatura/clave'.
   Una herramienta nueva sin preguntas no falla (no sale la sección), pero
   pruebas/comprobar.js avisa si falta alguna disponible.
   ===================================================================== */
const ASIGNATURAS = ['electromagnetismo', 'fisica', 'quimica', 'matematicas', 'estadistica', 'circuitos', 'economia'];
const PREGUNTAS = Object.assign({}, ...ASIGNATURAS.map((a) => require(`./preguntas/${a}.js`)));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ENLACES = {
  electrostatica: ['matematicas/campos', 'electromagnetismo/imagenes'],
  magnetostatica: ['matematicas/campos'],
  'ondas-em': ['fisica/ondas', 'fisica/optica'],
  fresnel: ['fisica/optica', 'fisica/interferencia'],
  'lineas-transmision': ['circuitos/simulador', 'matematicas/complejos'],
  'guias-onda': ['fisica/ondas'],
  'laplace-numerica': ['matematicas/metodos-numericos', 'matematicas/campos'],
  condensadores: ['circuitos/resistencias', 'circuitos/simulador'],
  induccion: ['circuitos/simulador', 'circuitos/bode'],
  faraday: ['circuitos/simulador'],
  maxwell: ['matematicas/campos', 'matematicas/integrales-multiples'],
  ondas: ['electromagnetismo/ondas-em', 'fisica/doppler'],
  doppler: ['fisica/ondas'],
  interferencia: ['electromagnetismo/fresnel', 'matematicas/fourier'],
  optica: ['electromagnetismo/fresnel'],
  oscilaciones: ['matematicas/edos', 'circuitos/bode'],
  gases: ['quimica/termoquimica', 'fisica/ciclos'],
  ciclos: ['fisica/gases', 'quimica/termoquimica'],
  calorimetria: ['quimica/termoquimica'],
  termoquimica: ['fisica/calorimetria', 'fisica/gases'],
  gravitacion: ['fisica/dinamica', 'fisica/trabajo-y-energia'],
  'tiro-parabolico': ['matematicas/graficador'],
  equilibrio: ['quimica/ph', 'quimica/termoquimica'],
  cinetica: ['matematicas/edos'],
  taylor: ['matematicas/derivadas', 'matematicas/metodos-numericos'],
  fourier: ['matematicas/laplace', 'circuitos/convolucion'],
  laplace: ['matematicas/edos', 'circuitos/bode'],
  edos: ['matematicas/laplace', 'fisica/oscilaciones'],
  derivadas: ['matematicas/taylor', 'matematicas/graficador'],
  matrices: ['matematicas/sistemas', 'matematicas/complejos'],
  complejos: ['circuitos/simulador', 'matematicas/fourier'],
  'integrales-multiples': ['matematicas/campos', 'electromagnetismo/electrostatica'],
  convolucion: ['matematicas/fourier', 'circuitos/bode'],
  bode: ['matematicas/laplace', 'circuitos/simulador'],
  simulador: ['circuitos/bode', 'circuitos/resistencias'],
  distribuciones: ['estadistica/intervalos', 'estadistica/contrastes'],
  intervalos: ['estadistica/distribuciones', 'estadistica/contrastes'],
  contrastes: ['estadistica/intervalos', 'estadistica/chi2-bondad'],
  regresion: ['economia/regresion-economia', 'estadistica/errores'],
  errores: ['estadistica/regresion', 'matematicas/derivadas'],
  descriptiva: ['estadistica/distribuciones', 'estadistica/probabilidad'],
  'regresion-economia': ['estadistica/regresion'],
  interes: ['economia/prestamos', 'economia/rentas'],
  'van-tir': ['economia/interes', 'economia/rentas'],
  'oferta-demanda': ['economia/elasticidades', 'economia/excedentes'],
  disoluciones: ['quimica/masa-molar', 'quimica/ph'],
  ph: ['quimica/equilibrio', 'quimica/disoluciones'],
  redox: ['quimica/ajustador'],
  vsepr: ['quimica/configuracion-electronica', 'quimica/tabla-periodica'],
};

const tiene = (clave) => !!PREGUNTAS[clave];
const html = (clave) => !tiene(clave) ? '' : `<section class="preguntas" aria-label="Preguntas frecuentes">\n<h2>Preguntas frecuentes</h2>\n${PREGUNTAS[clave].map(([p, r]) => `<h3>${esc(p)}</h3>\n<p>${esc(r)}</p>`).join('\n')}\n</section>\n`;
const jsonld = (clave) => !tiene(clave) ? null : { '@type': 'FAQPage', mainEntity: PREGUNTAS[clave].map(([p, r]) => ({ '@type': 'Question', name: p, acceptedAnswer: { '@type': 'Answer', text: r } })) };

if (typeof module !== 'undefined') module.exports = { PREGUNTAS, ENLACES, tiene, html, jsonld };
