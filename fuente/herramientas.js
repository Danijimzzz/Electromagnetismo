#!/usr/bin/env node
/* =====================================================================
   Página de cada herramienta, a partir de catalogo.js (lo llama build.sh):
   publico/<asignatura>/<clave>/index.html con la cabecera (icono y vista previa
   al compartir), fuente/<carpeta>/pagina.html pasada por diseno.js, y en un
   <script> Pagina = { carpeta, guarda }, la Version reducida, herramienta.js, los scripts de la herramienta, biblioteca.js,
   practica.js y personal.js (visitas y favoritas), más las llamadas que montan Mis ejercicios y el modo práctica.
   En el catálogo, cada herramienta con página lleva:
     scripts      los suyos en orden, sin version.js (va siempre el primero)
     titulo, descripcion   lo que se ve al compartir el enlace
     carpeta      solo si no se llama como la clave (estadistica → distribuciones)
     guarda       clave de localStorage del estado: por defecto '<carpeta>-v1';
                  null si no hay estado que guardar (sin Mis ejercicios)
   Los fenómenos disponibles de «Física en la vida real» salen igual, en
   publico/fenomenos/<clave>/ desde fuente/fenomenos/<clave>/pagina.html.
   ===================================================================== */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const Catalogo = require('./catalogo.js'), Seo = require('./seo.js');
const publico = path.join(__dirname, '..', 'publico');
const icono = fs.readFileSync(path.join(__dirname, 'icono.svg')).toString('base64');
// como `grep -v "^if (typeof module"`: la línea que exporta para Node no va en la página
const script = (f) => {
  const ls = fs.readFileSync(path.join(__dirname, f), 'utf8').split('\n');
  if (ls[ls.length - 1] === '') ls.pop();
  // MA-1: las páginas pesan menos sin los comentarios de línea completa ni las cabeceras /* … */ (el código no cambia)
  const fuera = []; let bloque = false;
  for (const l of ls) {
    if (bloque) { if (l.includes('*/')) bloque = false; continue; }
    if (/^\s*\/\*/.test(l)) { if (!l.includes('*/')) bloque = true; continue; }
    if (/^\s*\/\/(?!#)/.test(l)) continue;
    fuera.push(l);
  }
  return fuera.filter((l) => !l.startsWith('if (typeof module')).map((l) => l + '\n').join('') + '\n';
};

// Las páginas solo necesitan el número de versión de cada herramienta (`Version.de(clave).current`):
// el historial entero (version.js, más de 120 KB) solo hace falta en Novedades y en Electrostática, así que
// aquí va una Version reducida a la última versión de cada registro. Si una herramienta quiere el historial
// (`.log`, `.cambios`), debe ir por otro camino: aquí solo hay `{ v }`.
const Version = require('./version.js');
const versionReducida = () => {
  const reg = Object.fromEntries(Object.entries(Version.registros).map(([k, r]) => [k, [{ v: r[0].v }]]));
  return `const Version = (() => { const registros = ${JSON.stringify(reg)}; const de = (h) => ({ current: registros[h][0].v, log: registros[h] }); return { registros, de }; })();\n\n`;
};

const lista = () => [...Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible && h.scripts).map((h) => {
  const carpeta = h.carpeta || h.clave;
  return { asignatura: a.clave, ...h, carpeta, guarda: h.guarda === undefined ? `${carpeta}-v1` : h.guarda };
})),
  // los fenómenos de «Física en la vida real» (publico/fenomenos/<clave>/), sin estado que guardar
  ...Catalogo.fenomenos.lista.filter((f) => f.disponible).map((f) => ({ asignatura: 'fenomenos', ...f, carpeta: `fenomenos/${f.clave}`, guarda: null }))];

// F15 / TRV.10.15: los scripts que usan dos o más páginas (o pesan 20 KB o más) no se incrustan: van a publico/js/<nombre>.<hash>.js
// (el nombre lleva la huella del contenido, así que se puede cachear para siempre) y la página los llama con <script src>.
// El orden de ejecución no cambia: son scripts clásicos sin defer, intercalados con los trozos en línea.
const ficherosDe = (h) => ['herramienta.js', ...h.scripts, ...(h.asignatura === 'fenomenos' ? [] : ['biblioteca.js', 'practica.js']), 'personal.js'];
let _externos = null;
const externos = () => {
  if (_externos) return _externos;
  const usos = {};
  for (const h of lista()) for (const f of new Set(ficherosDe(h))) usos[f] = (usos[f] || 0) + 1;
  _externos = {};
  for (const [f, n] of Object.entries(usos)) {
    const codigo = script(f);
    // los de una sola página solo salen si pesan (≥ 20 KB): el HTML se recarga siempre, el fichero con huella no
    if (n < 2 && Buffer.byteLength(codigo) < 20 * 1024) continue;
    const hash = crypto.createHash('sha1').update(codigo).digest('hex').slice(0, 8);
    _externos[f] = { nombre: `${f.replace(/\.js$/, '').replace(/\//g, '-')}.${hash}.js`, codigo };
  }
  // el simulador de Electrostática (build.sh lo enlaza; su página no sale de aquí): también con huella y en caché (EM.ES-4)
  const E = require('./electrostatica-js.js').generar(); _externos['@electrostatica'] = { nombre: E.nombre, codigo: E.codigo };
  return _externos;
};

function pagina(h) {
  let html = '<!doctype html>\n<html lang="es">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${icono}">\n`
    + '<link rel="apple-touch-icon" href="../../apple-touch-icon.png">\n'
    + `<meta property="og:title" content="${h.titulo}">\n<meta property="og:description" content="${h.descripcion}">\n`
    + `<link rel="canonical" href="${Catalogo.web}/${h.asignatura}/${h.clave}/">\n`
    + `<meta property="og:image" content="${Catalogo.web}/og.png">\n<meta name="twitter:card" content="summary_large_image">\n`;
  const fuente = fs.readFileSync(path.join(__dirname, h.carpeta, 'pagina.html'));
  // datos estructurados para los buscadores (seo.js)
  html += Seo.datos(h.asignatura, h.clave, Seo.descripcion(fuente.toString()));
  // diseño común (diseno.js): cabecera de la portada, color de la asignatura, miga con los botones y herramientas relacionadas
  html += execFileSync('node', [path.join(__dirname, 'diseno.js'), h.asignatura, h.clave], { input: fuente }).toString();
  // trozos en línea y scripts externos, en el orden de ejecución
  let enLinea = '';
  const suelta = () => { if (enLinea) html += `<script>\n${enLinea}</script>\n`; enLinea = ''; };
  // datos de la página para los scripts comunes que arrancan antes que la app (compartir.js)
  enLinea += `const Pagina = { carpeta: '${h.carpeta}', guarda: ${h.guarda === null ? 'null' : `'${h.guarda}'`} };\n`;
  const fenomeno = h.asignatura === 'fenomenos', ext = externos();
  enLinea += versionReducida();
  for (const f of ficherosDe(h)) {
    if (ext[f]) { suelta(); html += `<script src="../../js/${ext[f].nombre}"></script>\n`; } else enLinea += script(f);
  }
  // barra lateral «Mis ejercicios» y modo práctica (no hacen nada en las herramientas sin datos que guardar o preguntar)
  const guarda = h.guarda === null ? 'null' : `'${h.guarda}'`;
  if (!fenomeno) enLinea += `Biblioteca.monta('${h.carpeta}', ${guarda});\nPractica.monta('${h.carpeta}', ${guarda});\n`;
  suelta();
  return html + '</html>\n';
}

module.exports = { lista, script, versionReducida, externos, ficherosDe };
if (require.main === module) {
  // publico/js/: los scripts compartidos con huella en el nombre (se vacía antes, para que no queden versiones viejas)
  fs.rmSync(path.join(publico, 'js'), { recursive: true, force: true }); fs.mkdirSync(path.join(publico, 'js'), { recursive: true });
  for (const e of Object.values(externos())) fs.writeFileSync(path.join(publico, 'js', e.nombre), e.codigo);
  for (const h of lista()) {
    const out = path.join(publico, h.asignatura, h.clave, 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, pagina(h));
    // la imagen de la tarjeta del fenómeno en el índice /fenomenos/ (pruebas/imagenes-fenomenos.js)
    if (h.asignatura === 'fenomenos') fs.copyFileSync(path.join(__dirname, h.carpeta, 'imagen.webp'), path.join(path.dirname(out), 'imagen.webp'));
  }
}
