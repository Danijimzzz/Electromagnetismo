#!/usr/bin/env node
/* =====================================================================
   Datos estructurados para los buscadores (schema.org en JSON-LD), escondidos
   en la cabeza de cada página: qué es (una aplicación educativa gratis en
   español, o un recurso explicativo en los fenómenos) la ruta
   Inicio › Asignatura › Herramienta, que Google puede enseñar en el resultado, y las
   preguntas frecuentes (FAQPage, de preguntas.js).
   Lo usan herramientas.js (cada herramienta y fenómeno) y build.sh (Electrostática):
     node seo.js ASIGNATURA CLAVE "DESCRIPCIÓN"
   La canonical, el sitemap y el robots.txt están en portal.js y herramientas.js;
   los enlaces a herramientas relacionadas, en diseno.js.
   ===================================================================== */
const Catalogo = require('./catalogo.js'), Preguntas = require('./preguntas.js');
const V = Catalogo.fenomenos;

function datos(asignatura, clave, descripcion) {
  const a = asignatura === V.clave ? V : Catalogo.asignaturas.find((x) => x.clave === asignatura);
  const h = (a === V ? a.lista : a.herramientas).find((x) => x.clave === clave);
  if (!h) throw new Error(`seo.js: no hay «${asignatura}/${clave}» en catalogo.js`);
  const url = `${Catalogo.web}/${asignatura}/${clave}/`, comun = { name: h.nombre, description: descripcion, url, inLanguage: 'es', isAccessibleForFree: true };
  const pagina = a === V
    ? { '@type': 'LearningResource', ...comun, learningResourceType: 'Animación explicada paso a paso' }
    : { '@type': 'WebApplication', ...comun, applicationCategory: 'EducationalApplication', operatingSystem: 'Navegador web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' } };
  const miga = { '@type': 'BreadcrumbList', itemListElement: [['Inicio', `${Catalogo.web}/`], [a.nombre, `${Catalogo.web}/${asignatura}/`], [h.nombre, url]]
    .map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) };
  // «<» escapado para que el texto no pueda cerrar el <script>
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [pagina, miga, ...(a === V ? [] : [Preguntas.jsonld(clave)].filter(Boolean))] }).replace(/</g, '\\u003c')}</script>\n`;
}

// la descripción de una pagina.html (su <meta name="description">), tal cual
const descripcion = (html) => ((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

if (typeof module !== 'undefined') module.exports = { datos, descripcion };
if (typeof require !== 'undefined' && require.main === module) process.stdout.write(datos(process.argv[2], process.argv[3], process.argv[4] || ''));
