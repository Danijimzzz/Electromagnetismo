/* =====================================================================
   Fecha de última modificación (<lastmod>) de cada página del sitemap.xml.
   - Es la fecha del último commit de git que toca lo que SOLO usa esa página: la carpeta de la herramienta
     (fuente/<carpeta>/), el diccionario de su idioma (fuente/i18n/<idioma>/<carpeta>.json), la carpeta del
     fenómeno, el texto legal… No cuentan los cambios comunes (cabecera, pie, estilos, idiomas, licencia…), porque
     no cambian lo que la página explica, y Google ignora un lastmod que se mueve sin cambio real.
   - Las páginas que son listas dependen de lo que listan: la asignatura, de sus herramientas; la portada y
     /fenomenos/, de todas las suyas; /novedades/, de version.js.
   - Es determinista: build.sh NO llama a git (en CI y en Vercel el clon es superficial y daría fechas falsas), lee
     fuente/lastmod.json. Ese fichero lo rehace `node fuente/lastmod.js` con el historial completo de git
     (`git fetch --unshallow` si hace falta); se ejecuta DESPUÉS de commitear el cambio de contenido y se commitea
     aparte (lastmod.json no toca ninguna de las fuentes de arriba). Sin fecha de git (fichero aún sin commit),
     la página sale sin <lastmod>: nunca se inventa.
   - enlaces(): las rutas del sitemap (portal.js la usa; así lista y fechas no se desajustan).
   Prueba: pruebas/sitemap.js.
   ===================================================================== */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const Catalogo = require('./catalogo.js'), Idiomas = require('./idiomas.js');
const JSON_ARCHIVO = path.join(__dirname, 'lastmod.json');
const disponibles = (a) => a.herramientas.filter((h) => h.disponible);

// rutas en español del sitemap (sin barra inicial; '' = portada)
const enlaces = () => ['', 'novedades/', ...Catalogo.asignaturas.flatMap((a) => [`${a.clave}/`, ...disponibles(a).map((h) => `${a.clave}/${h.clave}/`)]),
  'fenomenos/', ...Catalogo.fenomenos.lista.filter((f) => f.disponible).map((f) => `fenomenos/${f.clave}/`), 'aviso-legal.html', 'privacidad.html', 'cookies.html', 'contacto.html'];

// una entrada por cada versión de idioma indexable de cada página: { ruta, idioma, loc, clave }; clave = ruta con carpeta de idioma
const paginas = () => enlaces().flatMap((e) => Idiomas.activos().filter((i) => i.indexar && Idiomas.existe(i.c, e)).map((i) => ({ ruta: e, idioma: i.c, clave: `${i.carpeta}${e}`, loc: `${Catalogo.web}/${i.carpeta}${e}` })));

// ficheros de fuente propios de cada página (relativos a fuente/); `diccionarios`: los de idioma (solo si idioma ≠ es)
const ELECTRO = ['engine.js', 'fmt.js', 'physics.js', 'presets.js', 'canvas.js', 'app.js', 'shell.html', 'electrostatica-teoria.html', 'guia'];
function fuentes(ruta) {
  const m = ruta.match(/^([^/]+)\/([^/]+)\/$/);
  if (m && m[1] === 'fenomenos') return { fuentes: [`fenomenos/${m[2]}`], dic: [`fenomenos__${m[2]}`] };
  if (m) {
    const a = Catalogo.asignaturas.find((x) => x.clave === m[1]), h = a && a.herramientas.find((x) => x.clave === m[2]);
    if (h) { const c = h.carpeta || h.clave; return { fuentes: c === 'electrostatica' ? ELECTRO : [c], dic: [c] }; }
  }
  const legal = ruta.match(/^(aviso-legal|privacidad|cookies|contacto)\.html$/);
  if (legal) return { fuentes: [`legal/${ruta}`, 'anuncios.js'], dic: ['_g-legal'] };
  if (ruta === 'novedades/') return { fuentes: ['version.js'], dic: ['_g-novedades'] };
  return null; // listas: se calculan de sus hijas
}

const git = (args) => cp.execFileSync('git', args, { cwd: __dirname, encoding: 'utf8' }).trim();
const fecha = (rutas) => { const r = rutas.filter((p) => fs.existsSync(path.join(__dirname, p))); return r.length ? git(['log', '-1', '--format=%ad', '--date=format-local:%Y-%m-%d', '--', ...r]) || null : null; };
const mayor = (fs_) => fs_.filter(Boolean).sort().pop() || null;

// calcula {clave: 'AAAA-MM-DD'} con git (historial completo)
function calcular() {
  if (git(['rev-parse', '--is-shallow-repository']) === 'true') throw new Error('Clon superficial: `git fetch --unshallow` antes de calcular las fechas.');
  process.env.TZ = 'UTC';
  const todas = paginas(), out = {}, hojas = {};
  for (const p of todas) {
    const f = fuentes(p.ruta);
    if (!f) continue;
    const es = fecha(f.fuentes);
    const dic = p.idioma === 'es' ? null : fecha(f.dic.map((d) => `i18n/${p.idioma}/${d}.json`));
    hojas[p.clave] = mayor([es, dic]);
  }
  const hijas = (p, pred) => todas.filter((q) => q.idioma === p.idioma && q.ruta !== p.ruta && pred(q.ruta)).map((q) => hojas[q.clave]);
  for (const p of todas) {
    let d = hojas[p.clave];
    if (d === undefined) { // lista: portada, asignatura o /fenomenos/
      const a = Catalogo.asignaturas.find((x) => `${x.clave}/` === p.ruta);
      d = mayor(p.ruta === '' ? hijas(p, (r) => /^[^/]+\/[^/]+\/$/.test(r)) : a ? hijas(p, (r) => r.startsWith(p.ruta) && r !== p.ruta) : hijas(p, (r) => r.startsWith('fenomenos/')));
    }
    if (d) out[p.clave] = d;
  }
  return Object.fromEntries(Object.entries(out).sort(([x], [y]) => (x < y ? -1 : 1)));
}

// lo guardado (para build.sh y portal.js); {} si aún no existe
const guardado = () => { try { return JSON.parse(fs.readFileSync(JSON_ARCHIVO, 'utf8')); } catch (e) { return {}; } };

if (typeof module !== 'undefined') module.exports = { enlaces, paginas, fuentes, calcular, guardado, JSON_ARCHIVO };
if (require.main === module) { const r = calcular(); fs.writeFileSync(JSON_ARCHIVO, JSON.stringify(r, null, 1) + '\n'); console.log(`lastmod.json: ${Object.keys(r).length} páginas`); }
