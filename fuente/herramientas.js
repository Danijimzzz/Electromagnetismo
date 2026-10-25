#!/usr/bin/env node
/* =====================================================================
   Página de cada herramienta, a partir de catalogo.js (lo llama build.sh):
   publico/<asignatura>/<clave>/index.html con la cabecera (icono y vista previa
   al compartir), fuente/<carpeta>/pagina.html pasada por diseno.js, y en un
   <script> version.js, herramienta.js, los scripts de la herramienta, biblioteca.js y
   practica.js, más las llamadas que montan Mis ejercicios y el modo práctica.
   En el catálogo, cada herramienta con página lleva:
     scripts      los suyos en orden, sin version.js (va siempre el primero)
     titulo, descripcion   lo que se ve al compartir el enlace
     carpeta      solo si no se llama como la clave (estadistica → distribuciones)
     guarda       clave de localStorage del estado: por defecto '<carpeta>-v1';
                  null si no hay estado que guardar (sin Mis ejercicios)
   ===================================================================== */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const Catalogo = require('./catalogo.js');
const publico = path.join(__dirname, '..', 'publico');
const icono = fs.readFileSync(path.join(__dirname, 'icono.svg')).toString('base64');
// como `grep -v "^if (typeof module"`: la línea que exporta para Node no va en la página
const script = (f) => {
  const ls = fs.readFileSync(path.join(__dirname, f), 'utf8').split('\n');
  if (ls[ls.length - 1] === '') ls.pop();
  return ls.filter((l) => !l.startsWith('if (typeof module')).map((l) => l + '\n').join('') + '\n';
};

const lista = () => Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible && h.scripts).map((h) => {
  const carpeta = h.carpeta || h.clave;
  return { asignatura: a.clave, ...h, carpeta, guarda: h.guarda === undefined ? `${carpeta}-v1` : h.guarda };
}));

function pagina(h) {
  let html = '<!doctype html>\n<html lang="es">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${icono}">\n`
    + '<link rel="apple-touch-icon" href="../../apple-touch-icon.png">\n'
    + `<meta property="og:title" content="${h.titulo}">\n<meta property="og:description" content="${h.descripcion}">\n`
    + '<meta property="og:image" content="https://electromagnetismo-two.vercel.app/og.png">\n<meta name="twitter:card" content="summary_large_image">\n';
  // diseño común (diseno.js): cabecera de la portada, color de la asignatura y miga con los botones
  html += execFileSync('node', [path.join(__dirname, 'diseno.js'), h.asignatura], { input: fs.readFileSync(path.join(__dirname, h.carpeta, 'pagina.html')) }).toString();
  html += '<script>\n';
  for (const f of ['version.js', 'herramienta.js', ...h.scripts, 'biblioteca.js', 'practica.js']) html += script(f);
  // barra lateral «Mis ejercicios» y modo práctica (no hacen nada en las herramientas sin datos que guardar o preguntar)
  const guarda = h.guarda === null ? 'null' : `'${h.guarda}'`;
  html += `Biblioteca.monta('${h.carpeta}', ${guarda});\nPractica.monta('${h.carpeta}', ${guarda});\n`;
  return html + '</script>\n</html>\n';
}

module.exports = { lista };
if (require.main === module) {
  for (const h of lista()) {
    const out = path.join(publico, h.asignatura, h.clave, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, pagina(h));
  }
}
