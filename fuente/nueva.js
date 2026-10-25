#!/usr/bin/env node
/* =====================================================================
   Crea una herramienta nueva a partir de fuente/plantilla/ y la da de alta:
     node fuente/nueva.js <asignatura> <clave> "<Nombre>"
   1. fuente/<clave>/pagina.html, calculo.js y app.js (Plantilla → <Nombre en
      CamelCase>, plantilla → <clave>), que funcionan desde el principio.
   2. pruebas/herramientas/<clave>.js con la prueba de la plantilla.
   3. catalogo.js: la entrada con disponible: true y scripts, titulo y
      descripcion (si ya estaba como «Próximamente», la completa).
   4. version.js: el registro '<clave>' en 0.1.
   Luego: cambiar el cálculo, la página y la prueba por lo de verdad, añadir
   la novedad en la web de version.js, sh fuente/build.sh y
   node pruebas/comprobar.js --solo <clave>.
   ===================================================================== */
const fs = require('fs'), path = require('path');
const [asig, clave, nombre] = process.argv.slice(2);
const sal = (m) => { console.error(m); process.exit(1); };
if (!asig || !clave || !nombre) sal('Uso: node fuente/nueva.js <asignatura> <clave> "<Nombre>"');
if (!/^[a-z][a-z0-9-]*$/.test(clave)) sal(`La clave «${clave}» debe ir en minúsculas, sin tildes, con guiones`);
const raiz = path.join(__dirname, '..'), dir = path.join(__dirname, clave), prueba = path.join(raiz, 'pruebas', 'herramientas', `${clave}.js`);
const Catalogo = require('./catalogo.js'), a = Catalogo.asignaturas.find((x) => x.clave === asig);
if (!a) sal(`No hay asignatura «${asig}». Hay: ${Catalogo.asignaturas.map((x) => x.clave).join(', ')}`);
if (fs.existsSync(dir) || fs.existsSync(prueba)) sal(`Ya existe fuente/${clave}/ o pruebas/herramientas/${clave}.js`);
const previa = a.herramientas.find((h) => h.clave === clave);
if (previa?.disponible) sal(`«${clave}» ya está disponible en ${asig}`);

const Id = clave.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const cambia = (s) => s.replace(/Plantilla/g, Id).replace(/plantilla/g, clave).replace(/'asignatura'/g, `'${asig}'`);
const plantilla = (f) => fs.readFileSync(path.join(__dirname, 'plantilla', f), 'utf8');
const desc = previa?.desc || `[Qué calcula ${nombre}, en una frase.]`;

// 1 y 2: ficheros de la herramienta y su prueba
fs.mkdirSync(dir);
const pag = plantilla('pagina.html')
  .replace(/<!-- =+[\s\S]*?=+ -->\n/, '')
  .replace('[Asignatura]', a.nombre).replace(/\[Nombre corto\]/g, nombre).replace('[Título de la herramienta]', nombre)
  .replace('[Una o dos frases: qué calcula y qué se ve.]', desc)
  .replace(/\[Magnitud\] <small>\(unidad\)<\/small>/g, '').replace('[Gráfica]', 'Gráfica').replace('[Qué se dibuja]', 'Gráfica')
  .replace(/ *<div class="controles">.*\n/, '');
fs.writeFileSync(path.join(dir, 'pagina.html'), `<title>${nombre} · SimulaCiencia</title>\n<meta name="description" content="${desc}">\n` + pag);
fs.writeFileSync(path.join(dir, 'calculo.js'), cambia(plantilla('calculo.js')));
fs.writeFileSync(path.join(dir, 'app.js'), cambia(plantilla('app.js')));
fs.writeFileSync(prueba, cambia(plantilla('prueba.js')));

// 3: catalogo.js
const fc = path.join(__dirname, 'catalogo.js');
let cat = fs.readFileSync(fc, 'utf8');
const extra = `scripts: ['mates.js', '${clave}/calculo.js', '${clave}/app.js'],\n          titulo: '${nombre}', descripcion: '${desc.replace(/'/g, "\\'")}' }`;
if (previa) {
  const re = new RegExp(`(\\{ clave: '${clave}',[^\\n]*?)disponible: false([^\\n]*?) \\}`);
  if (!re.test(cat)) sal(`No encuentro la línea de «${clave}» en catalogo.js`);
  cat = cat.replace(re, (_, x, y) => `${x}disponible: true${y}, ${extra}`);
} else {
  // al final de la lista de herramientas de la asignatura
  const i = cat.indexOf(`clave: '${asig}', nombre:`), j = cat.indexOf('\n      ],', i);
  cat = cat.slice(0, j) + `\n        { clave: '${clave}', nombre: '${nombre}', icono: '${nombre[0]}', disponible: true, desc: '${desc.replace(/'/g, "\\'")}', buscar: '${nombre.toLowerCase()}', ${extra},` + cat.slice(j);
}
fs.writeFileSync(fc, cat);

// 4: version.js, justo después de las novedades de la web
const fv = path.join(__dirname, 'version.js');
let ver = fs.readFileSync(fv, 'utf8');
const k = ver.indexOf('\n    ],', ver.indexOf('    web: [')) + '\n    ],'.length;
const hoy = new Date().toISOString().slice(0, 10), nom = /-/.test(clave) ? `'${clave}'` : clave;
ver = ver.slice(0, k) + `\n    ${nom}: [\n      { v: '0.1', fecha: '${hoy}', cambios: ['Primera versión: [qué hace, para los usuarios].'] },\n    ],` + ver.slice(k);
fs.writeFileSync(fv, ver);

console.log(`Creada ${asig}/${clave}: fuente/${clave}/, pruebas/herramientas/${clave}.js, catalogo.js y version.js.
Ahora: cambia el cálculo, la página y la prueba; escribe la novedad en version.js (y en web: «Nueva herramienta: ${nombre}, en ${a.nombre}.»);
sh fuente/build.sh && node pruebas/comprobar.js --solo ${clave}`);
