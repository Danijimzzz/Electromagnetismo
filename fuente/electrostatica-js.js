/* =====================================================================
   Los scripts del simulador de Electrostática de la web, en un solo fichero con caché (EM.ES-4):
   publico/js/electrostatica.<huella>.js. Es lo mismo que build.sh pone en línea en la versión privada (version, engine,
   fmt, physics, presets, canvas y app, sin la línea `if (typeof module`), pero sin las capturas de la guía: en la web son
   ficheros (publico/electromagnetismo/electrostatica/guia/*.webp) que solo se bajan al abrir la guía.
   herramientas.js lo escribe junto a los demás scripts compartidos; build.sh pregunta aquí el nombre:
     node fuente/electrostatica-js.js nombre
   ===================================================================== */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const FICHEROS = ['version', 'engine', 'fmt', 'physics', 'presets', 'canvas', 'app'];
const codigo = () => FICHEROS.map((f) => fs.readFileSync(path.join(__dirname, f + '.js'), 'utf8').split('\n').filter((l) => !l.startsWith('if (typeof module')).join('\n') + '\n').join('\n');
const generar = () => { const c = codigo(); return { nombre: `electrostatica.${crypto.createHash('sha1').update(c).digest('hex').slice(0, 8)}.js`, codigo: c }; };
const IMAGENES = () => fs.readdirSync(path.join(__dirname, 'guia')).filter((f) => f.endsWith('.webp')).sort();
module.exports = { generar, IMAGENES };
if (require.main === module && process.argv[2] === 'nombre') console.log(generar().nombre);
