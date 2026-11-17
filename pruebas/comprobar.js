#!/usr/bin/env node
/* Comprobación antes de publicar o fusionar un cambio. Hay dos juegos de ejercicios:
   - los 12 de ejemplo de la web pública (fuente/presets.js), contra pruebas/esperados-ejemplos.json;
   - los 12 del Tema 3 de la versión privada (privado/tema3-pdf.js), contra pruebas/esperados.json,
     que es la forma escrita del solucionario oficial, no solo el valor.
   Pasos:
   1. regenera la web pública (portada, asignaturas y simulador) y la versión privada con
      fuente/build.sh, y comprueba que publico/ solo contiene lo que se publica y ningún enunciado del Tema 3;
   2. resuelve los dos juegos en Node y compara cada resultado con su archivo de esperados;
   3. abre las dos páginas en Chromium, repite el cálculo dentro de la página, abre cada ejercicio
      desde la barra lateral y la guía, y falla si hay errores en la consola; abre también la portada
      y las páginas de asignatura y comprueba sus enlaces.
   Cada herramienta tiene lo suyo en pruebas/herramientas/<carpeta>.js; aquí queda lo común.
   Uso: node pruebas/comprobar.js [--actualizar] [--sin-navegador] [--solo CARPETA] [--parte N/M] [--tiempos]
   --solo CARPETA compila todo pero solo comprueba esa herramienta (sus cálculos, su página, su humo,
   Mis ejercicios y práctica); con --solo electrostatica, solo el simulador de electrostática.
   --tiempos mide lo que tarda la prueba de cada herramienta y lo guarda en pruebas/tiempos.json (con él se reparten los trozos).
   --parte N/M reparte las herramientas en M trozos y comprueba solo el N (de 1 a M): así CI las corre en paralelo.
   Lo común (simulador de Electrostática, portada, asignaturas, MathML…) va solo en el trozo 1.
   --actualizar reescribe los esperados con los resultados actuales (solo si el cambio de forma es intencionado). */
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const raiz = path.join(__dirname, '..'), fuente = path.join(raiz, 'fuente'), publico = path.join(raiz, 'publico');
const args = process.argv.slice(2), solo = args.includes('--solo') ? args[args.indexOf('--solo') + 1] : null;
// --parte N/M: trozo N de M (las herramientas se reparten por su posición en el catálogo)
const parte = args.includes('--parte') ? args[args.indexOf('--parte') + 1].split('/').map(Number) : null;
if (parte && !(parte.length === 2 && parte[0] >= 1 && parte[0] <= parte[1])) { console.log('✗ --parte N/M: por ejemplo --parte 2/4'); process.exit(1); }
const primera = !solo && (!parte || parte[0] === 1), completo = !solo && !parte; // lo común va solo en el trozo 1; los recuentos, solo con todo
let fallos = 0;
const mal = (m) => { fallos++; console.log('  ✗ ' + m); };
// espera a que la página se asiente (dos fotogramas pintados) en lugar de una pausa fija en milisegundos
const asienta = (page) => page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));

// lo único que puede haber en publico/ (lo que sirven Vercel y Cloudflare): los archivos sueltos,
// la portada, una página por asignatura y una por herramienta disponible del catálogo
const Catalogo = require(path.join(fuente, 'catalogo.js')), Biblioteca = require(path.join(fuente, 'biblioteca.js'));
const PUBLICABLES = ['index.html', 'novedades/index.html', 'foro/index.html', 'og.png', 'apple-touch-icon.png', 'buscador.js', 'llama.js', 'legal.css', 'aviso-legal.html', 'privacidad.html', 'cookies.html', 'contacto.html', 'fuentes/stix-two-math.woff2', 'fuentes/OFL-STIX-Two.txt', 'sitemap.xml', 'robots.txt', 'manifest.webmanifest', 'sw.js', 'pwa.js', 'offline.html', '_headers', 'icono-192.png', 'icono-512.png', 'icono-maskable-512.png',
  ...Catalogo.asignaturas.flatMap((a) => [`${a.clave}/index.html`, ...a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}/index.html`)]),
  // «Física en la vida real»: el índice y una página por fenómeno disponible
  'fenomenos/index.html', ...Catalogo.fenomenos.lista.filter((f) => f.disponible).flatMap((f) => [`fenomenos/${f.clave}/index.html`, `fenomenos/${f.clave}/imagen.webp`]),
  // capturas de la guía de Electrostática (EM.ES-4): ficheros que solo se bajan al abrir la guía
  ...require(path.join(fuente, 'electrostatica-js.js')).IMAGENES().map((f) => `electromagnetismo/electrostatica/guia/${f}`),
  // scripts compartidos con huella en el nombre (herramientas.js, TRV.10.15)
  ...Object.values(require(path.join(fuente, 'herramientas.js')).externos()).map((e) => `js/${e.nombre}`),
  // direcciones antiguas: una página que redirige a la nueva y las reglas 301 de Cloudflare
  ...Object.keys(Catalogo.redirecciones).map((v) => `${v}index.html`), '_redirects',
  // archivo de verificación de Google Search Console (catalogo.js → googleArchivo)
  ...(Catalogo.googleArchivo ? [`${Catalogo.googleArchivo}.html`] : []),
  // ads.txt solo con los anuncios activos (fuente/anuncios.js)
  ...(require(path.join(fuente, 'anuncios.js')).activos ? ['ads.txt'] : [])];
const listar = (dir, pre = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? listar(path.join(dir, e.name), pre + e.name + '/') : [pre + e.name]));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emsim-'));
const juegos = [
  { nombre: 'Ejemplos', presets: path.join(fuente, 'presets.js'), esperados: path.join(__dirname, 'esperados-ejemplos.json'), pagina: path.join(publico, 'electromagnetismo', 'electrostatica', 'index.html') },
  { nombre: 'Tema 3', presets: path.join(raiz, 'privado', 'tema3-pdf.js'), esperados: path.join(__dirname, 'esperados.json'), pagina: path.join(tmp, 'privado.html') },
];

console.log('1 · Compilando las páginas');
execFileSync('sh', [path.join(fuente, 'build.sh')], { stdio: 'inherit' });
execFileSync('sh', [path.join(fuente, 'build.sh'), 'privado', path.join(tmp, 'cuerpo.html')], { stdio: 'inherit' });
// el artifact añade el esqueleto; aquí se añade el mínimo para abrirla en el navegador
fs.writeFileSync(juegos[1].pagina, '<!doctype html>\n<meta charset="utf-8">\n' + fs.readFileSync(path.join(tmp, 'cuerpo.html'), 'utf8'));
console.log(`  ✓ simulador ${(fs.statSync(juegos[0].pagina).size / 1024).toFixed(0)} KB · privada ${(fs.statSync(juegos[1].pagina).size / 1024).toFixed(0)} KB`);
const hay = listar(publico), sobran = hay.filter((f) => !PUBLICABLES.includes(f)), faltan = PUBLICABLES.filter((f) => !hay.includes(f));
if (sobran.length) mal(`publico/ contiene archivos que no deberían publicarse: ${sobran.join(', ')}`);
if (faltan.length) mal(`publico/ no tiene: ${faltan.join(', ')}`);
// errores de unión de ramas (marcadores de conflicto, JSON y .js rotos, claves repetidas, scripts que no compilan juntos): pruebas/union.js
if (primera) { try { execFileSync('node', [path.join(__dirname, 'union.js')], { stdio: 'inherit' }); } catch (e) { mal('Unión de ramas: ver arriba'); } }
// banco de casos límite de Matemáticas (MAT.MA-2), sin navegador: pruebas/casos-limite-matematicas.js
// ejercicios al azar de Economía (ECO.EC-1): pruebas/economia-practica.js
if (primera) { try { execFileSync('node', [path.join(__dirname, 'economia-practica.js')], { stdio: 'inherit', timeout: 120000 }); } catch (e) { mal('Economía, ejercicios al azar: ver arriba'); } }
// invariantes al azar con semilla fija (F14.3): pruebas/invariantes.js
if (primera && !solo) { try { execFileSync('node', [path.join(__dirname, 'invariantes.js')], { stdio: 'inherit', timeout: 120000 }); } catch (e) { mal('Invariantes: ver arriba'); } }
// casos analíticos cerrados de Electromagnetismo, Control y z (EM.EM-1, CIR.CI-3): pruebas/casos-analiticos.js
if (primera && !solo) { try { execFileSync('node', [path.join(__dirname, 'casos-analiticos.js')], { stdio: 'inherit', timeout: 120000 }); } catch (e) { mal('Casos analíticos: ver arriba'); } }
// cifras de las preguntas frecuentes (TRV.10.7): pruebas/faq-cifras.js
if (primera && !solo) { try { execFileSync('node', [path.join(__dirname, 'faq-cifras.js')], { stdio: 'inherit', timeout: 120000 }); } catch (e) { mal('Cifras de las FAQ: ver arriba'); } }
// casos a mano de las herramientas con menos pruebas (TRV.10.18b): pruebas/casos-flojas.js
if (primera && !solo) { try { execFileSync('node', [path.join(__dirname, 'casos-flojas.js')], { stdio: 'inherit', timeout: 120000 }); } catch (e) { mal('Casos de herramientas flojas: ver arriba'); } }
// constantes comunes de Física e interruptor de g (FIS.FG-1, FIS.UN-2): pruebas/constantes.js
if (primera && !solo) { try { execFileSync('node', [path.join(__dirname, 'constantes.js'), ...(process.argv.includes('--sin-navegador') ? ['--sin-navegador'] : [])], { stdio: 'inherit', timeout: 180000 }); } catch (e) { mal('Constantes de Física: ver arriba'); } }
// referencias externas (F14.1 Química, F14.2 Matemáticas): pruebas/referencias.js, sin navegador ni Python
if (primera && !solo) { try { execFileSync('node', [path.join(__dirname, 'referencias.js')], { stdio: 'inherit', timeout: 120000 }); } catch (e) { mal('Referencias externas (Química y Matemáticas): ver arriba'); } }
if (primera && !solo) { try { execFileSync('node', [path.join(__dirname, 'casos-limite-matematicas.js')], { stdio: 'inherit', timeout: 120000 }); } catch (e) { mal('Casos límite de Matemáticas: ver arriba'); } }
const web = fs.readFileSync(juegos[0].pagina, 'utf8');

// resultados de todos los ejercicios: { clave: { titulo, incognita, resultados: [html…] } }
function resolver(Physics, Presets) {
  const r = {};
  for (const p of Presets.list) {
    const out = Physics.run(p.make());
    r[p.key] = {
      titulo: p.title,
      errores: out.ctx.errors,
      incognita: out.unknown ? (out.unknown.error ? 'ERROR: ' + out.unknown.error : out.unknown.html) : null,
      resultados: out.results.map((x) => (x.error ? 'ERROR: ' + x.error : x.res)),
    };
  }
  return r;
}
function comparar(obtenidos, esperados, donde) {
  for (const [k, e] of Object.entries(esperados)) {
    const o = obtenidos[k];
    if (!o) { mal(`${donde}: falta el ejercicio ${e.titulo}`); continue; }
    if (o.errores.length) mal(`${donde} · ${e.titulo}: ${o.errores.join(' · ')}`);
    if (o.incognita !== e.incognita) mal(`${donde} · ${e.titulo} (incógnita)\n      esperado: ${e.incognita}\n      obtenido: ${o.incognita}`);
    if (o.resultados.length !== e.resultados.length) mal(`${donde} · ${e.titulo}: ${o.resultados.length} preguntas, se esperaban ${e.resultados.length}`);
    e.resultados.forEach((r, i) => { if (o.resultados[i] !== r) mal(`${donde} · ${e.titulo} (pregunta ${i + 1})\n      esperado: ${r}\n      obtenido: ${o.resultados[i]}`); });
    o.resultados.forEach((r, i) => { if (r.startsWith('ERROR: ')) mal(`${donde} · ${e.titulo} (pregunta ${i + 1}): ${r}`); });
    if (o.incognita?.startsWith('ERROR: ')) mal(`${donde} · ${e.titulo} (incógnita): ${o.incognita}`);
  }
}

// Diseño común (DISENO.md): ninguna herramienta vuelve a definir una regla de fuente/estilos.css ni los
// colores comunes, y los colores fijos solo van en variables propias de :root (así cambian con el modo oscuro)
{
  const antes = fallos;
  // reglas de primer nivel y de dentro de @media / @container: [selectores, cuerpo]
  const reglas = (css) => {
    const r = []; let i = 0, ini = 0, prof = 0, cab = [];
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    for (; i < css.length; i++) {
      if (css[i] === '{') { const s = css.slice(ini, i).trim(); if (s.startsWith('@')) { cab.push(prof); prof++; ini = i + 1; continue; } prof++; r.push([s, i + 1]); ini = i + 1; }
      else if (css[i] === '}') { prof--; if (cab.length && cab[cab.length - 1] === prof) cab.pop(); else if (r.length && r[r.length - 1].length === 2) r[r.length - 1].push(css.slice(r[r.length - 1][1], i)); ini = i + 1; }
    }
    return r.filter((x) => x.length === 3).map(([s, , c]) => [s.split(',').map((t) => t.trim().replace(/\s+/g, ' ')), c]);
  };
  const comunes = new Set(reglas(fs.readFileSync(path.join(fuente, 'estilos.css'), 'utf8')).flatMap(([s]) => s).filter((s) => !s.startsWith(':root')));
  const TOKENS = /--(bg|panel|ink|muted|line|error|accent|accent-soft|marca|f-ui|f-math|f-mono)\s*:/;
  let n = 0;
  for (const dir of fs.readdirSync(fuente).filter((d) => fs.existsSync(path.join(fuente, d, 'pagina.html')))) {
    n++;
    const css = [...fs.readFileSync(path.join(fuente, dir, 'pagina.html'), 'utf8').matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
    for (const [sel, cuerpo] of reglas(css)) {
      const rep = sel.filter((s) => comunes.has(s));
      if (rep.length) mal(`${dir}: vuelve a definir ${rep.join(', ')}, que ya está en estilos.css (ajusta sus variables o usa una clase o un id propios)`);
      if (sel.some((s) => s.startsWith(':root')) && TOKENS.test(cuerpo)) mal(`${dir}: redefine un color o una letra comunes en :root (${cuerpo.match(TOKENS)[0]})`);
      const fijos = cuerpo.split(';').filter((d) => !/^\s*--/.test(d) && /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(d));
      if (fijos.length) mal(`${dir}: color fijo en ${sel.join(', ')} (${fijos[0].trim()}); ponlo en una variable de :root con su valor en modo oscuro`);
    }
  }
  if (fallos === antes) console.log(`  ✓ Diseño común: ${n - 1} herramientas y la plantilla usan estilos.css sin redefinir sus reglas ni poner colores fijos`);
}

console.log('2 · Ejercicios en Node');
for (const m of ['version', 'engine', 'fmt', 'physics']) {
  const g = { version: 'Version', engine: 'Engine', fmt: 'Fmt', physics: 'Physics' }[m];
  global[g] = require(path.join(fuente, m + '.js'));
}
for (const j of juegos) {
  j.Presets = require(j.presets);
  const nodo = resolver(Physics, j.Presets);
  if (args.includes('--actualizar') || !fs.existsSync(j.esperados)) {
    fs.writeFileSync(j.esperados, JSON.stringify(nodo, null, 1) + '\n');
    console.log(`  ✓ ${path.basename(j.esperados)} reescrito con ${Object.keys(nodo).length} ejercicios`);
  }
  // 10.14 · sello de los esperados: solo --actualizar los cambia. Si alguien los edita a mano (o una unión de ramas los mezcla),
  // el sello no coincide y falla, aunque el cálculo siguiera dando lo mismo que el archivo editado
  {
    const sellos = path.join(__dirname, 'esperados.sellos.json'), huella = require('crypto').createHash('sha256').update(fs.readFileSync(j.esperados)).digest('hex');
    const tabla = fs.existsSync(sellos) ? JSON.parse(fs.readFileSync(sellos, 'utf8')) : {}, k = path.basename(j.esperados);
    if (args.includes('--actualizar') || !tabla[k]) { tabla[k] = huella; fs.writeFileSync(sellos, JSON.stringify(tabla, null, 1) + '\n'); }
    else if (tabla[k] !== huella) mal(`${k} se ha cambiado sin pasar por «node pruebas/comprobar.js --actualizar» (sello distinto): si el cambio es intencionado, actualízalo; si no, recupera el archivo`);
  }
  j.esp = JSON.parse(fs.readFileSync(j.esperados, 'utf8'));
  const antes = fallos;
  comparar(nodo, j.esp, `Node · ${j.nombre}`);
  if (fallos === antes) console.log(`  ✓ ${j.nombre}: ${Object.keys(j.esp).length} ejercicios iguales a ${path.basename(j.esperados)}`);
}
// ES-3: la práctica de Electrostática avisa de las dimensiones de la respuesta
{
  const antes = fallos, out = Physics.run(juegos[0].Presets.list.find((p) => p.key === 'p1').make()), r = out.results.find((x) => x.answers && x.answers.length), ans = { ...r.answers[0], qty: 'E', vec: undefined, val: r.answers[0].val || r.answers[0].vec[0] };
  const ver = (exp, esperado, q) => { const t = Physics.checkDim(exp, { ...ans, qty: q || 'E' }, out.ctx); if (!t.includes(esperado)) mal(`Electrostática · dimensiones de «${exp}»: «${t}» no contiene «${esperado}»`); };
  ver('q/(4*pi*eps0*a^2)', 'sí cuadran'); ver('q/(4*pi*eps0*a)', 'no cuadran'); ver('q/(4*pi*eps0*a)', 'N/C'); ver('q/(4*pi*eps0*a^2) + q/(4*pi*eps0*a)', 'sumandos'); ver('q/(4*pi*eps0*a)', 'sí cuadran', 'V'); ver('q*a', 'no cuadran', 'V'); ver('sqrt(q^2)/(4*pi*eps0*a)', 'sí cuadran', 'V'); ver('q/(4*pi*eps0*a^2) + 1', '«1»');
  if (Physics.checkDim('q/(2*desconocido)', ans, out.ctx) !== '') mal('Electrostática: con un símbolo desconocido no debe opinar sobre las dimensiones');
  const bad = Physics.checkAnswer({ ...ans, qty: 'V', val: ans.val }, ['q/(4*pi*eps0*a^2)', '', ''], out.ctx);
  if (bad.ok || !/Las dimensiones no cuadran/.test(bad.msg)) mal('Electrostática: checkAnswer no avisa de las dimensiones: ' + bad.msg);
  if (fallos === antes) console.log('  ✓ Electrostática: la práctica avisa de las dimensiones de la respuesta y del sumando que falla');
}

// la web pública no puede llevar nada del PDF de la asignatura
const textos = hay.filter((f) => f.endsWith('.html')).map((f) => [f, fs.readFileSync(path.join(publico, f), 'utf8')]);
const delPdf = juegos[1].Presets.list.flatMap((p) => [p.statement, p.title]).flatMap((t) => textos.filter(([, x]) => x.includes(t)).map(([f]) => `${f}: ${t}`));
if (delPdf.length) mal(`publico/ contiene enunciados o títulos del Tema 3:\n      ${delPdf.join('\n      ')}`);
else console.log('  ✓ publico/ no contiene ningún enunciado ni título del Tema 3');
// SEO de contenido: cada herramienta disponible tiene preguntas frecuentes, visibles y en el FAQPage de su cabeza
if (primera) {
  const Preguntas = require(path.join(fuente, 'preguntas.js'));
  const dispon = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible && h.scripts).map((h) => [a.clave, h.clave]));
  const sin = dispon.filter(([, c]) => !Preguntas.tiene(c)).map(([, c]) => c);
  if (sin.length) mal(`sin preguntas frecuentes (fuente/preguntas/): ${sin.join(', ')}`);
  const raras = Object.entries(Preguntas.PREGUNTAS).filter(([, qs]) => qs.length < 2 || qs.some(([p, r]) => !p.startsWith('¿') || !p.endsWith('?') || r.length < 60)).map(([c]) => c);
  if (raras.length) mal(`preguntas frecuentes mal formadas (mínimo 2, con ¿?, respuesta de 60 letras): ${raras.join(', ')}`);
  const malas = dispon.filter(([a, c]) => { const x = textos.find(([f]) => f === `${a}/${c}/index.html`)?.[1] || ''; const ld = (x.match(/<script type="application\/ld\+json">(.*?)<\/script>/) || [])[1]; try { return !JSON.parse(ld)['@graph'].some((n) => n['@type'] === 'FAQPage' && n.mainEntity.every((q) => x.includes('<h3>' + q.name.replace(/&/g, '&amp;') + '</h3>'))); } catch (e) { return true; } }).map(([a, c]) => `${a}/${c}`);
  if (malas.length) mal(`FAQPage ausente o distinto del texto visible en: ${malas.join(', ')}`);
  else if (!sin.length && !raras.length) console.log(`  ✓ ${dispon.length} herramientas con preguntas frecuentes y FAQPage`);
}
console.log(`  · versiones: ${Object.keys(Version.registros).map((k) => `${k} ${Version.de(k).current}`).join(' · ')}`);

// lo que comparten varias herramientas al cargarse en Node
global.Elementos = require(path.join(fuente, 'quimica', 'elementos.js'));
global.Formulas = require(path.join(fuente, 'quimica', 'formulas.js'));
global.Algebra = require(path.join(fuente, 'matematicas', 'algebra.js'));
global.Expr = require(path.join(fuente, 'matematicas', 'expresion.js'));
global.Herramienta = require(path.join(fuente, 'herramienta.js'));

// cada herramienta del catálogo tiene su comprobación en pruebas/herramientas/<carpeta>.js, que devuelve la parte del navegador
const HERRAMIENTAS = require(path.join(fuente, 'herramientas.js')).lista().map((h) => h.carpeta);
for (const k of HERRAMIENTAS) if (!fs.existsSync(path.join(__dirname, 'herramientas', k + '.js'))) mal(`${k}: falta su comprobación en pruebas/herramientas/${k}.js`);
const pagina = async (browser, width, height) => {
  const page = await browser.newPage({ viewport: { width, height } }), consola = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
  return { page, consola };
};
if (solo && !HERRAMIENTAS.includes(solo) && solo !== 'electrostatica') { console.log(`✗ --solo ${solo}: no hay ninguna herramienta con esa carpeta`); process.exit(1); }
// TRV.10.17 · el reparto en trozos va por TIEMPO, no por posición: pruebas/tiempos.json guarda lo que tarda la prueba de cada
// herramienta (segundos; se rehace con --tiempos) y cada trozo recibe, de mayor a menor, la que más tarda hasta
// igualar. Sin ese fichero (o con una herramienta nueva sin medir) se usa la mediana. Cada herramienta suma además ~8 s fijos
// de las pruebas comunes (humo, accesibilidad, usar-en).
const ficheroTiempos = path.join(__dirname, 'tiempos.json');
const TIEMPOS = fs.existsSync(ficheroTiempos) ? JSON.parse(fs.readFileSync(ficheroTiempos, 'utf8')) : {};
const reparto = (() => {
  if (!parte) return null;
  const medidos = Object.values(TIEMPOS).sort((a, b) => a - b), mediana = medidos.length ? medidos[medidos.length >> 1] : 0;
  if (!medidos.length) return Object.fromEntries(HERRAMIENTAS.map((k, i) => [k, i % parte[1]]));
  const carga = Array(parte[1]).fill(0), asigna = {};
  [...HERRAMIENTAS].sort((a, b) => (TIEMPOS[b] ?? mediana) - (TIEMPOS[a] ?? mediana) || a.localeCompare(b)).forEach((k) => {
    const i = carga.indexOf(Math.min(...carga)); asigna[k] = i; carga[i] += (TIEMPOS[k] ?? mediana) + 8;
  });
  return asigna;
})();
const enParte = (k) => !parte || (reparto[k] ?? 0) === parte[0] - 1;
const mia = (k) => (!solo || solo === k) && enParte(k);
const nombresNavegador = HERRAMIENTAS.filter((k) => mia(k) && fs.existsSync(path.join(__dirname, 'herramientas', k + '.js')));
const enNavegador = nombresNavegador.map((k) => require(path.join(__dirname, 'herramientas', k + '.js'))({ fs, path, fuente, publico, args, mal, pagina }));

if (primera) {
  {
    // peso de las páginas y cobertura del modo práctica (leyendo publico/, ya compilado)
    const antes = fallos, EXCEPCIONES = { electrostatica: 'tiene su propia práctica en el simulador', 'tabla-periodica': 'tiene sus propias preguntas' }, MAX_KB = 250;
    const pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}`));
    // 10.16 · presupuesto del peso TOTAL de publico/ (pruebas/presupuesto.json, en KB): sube a propósito con --actualizar
    {
      const total = Math.round(listar(publico).reduce((n, f) => n + fs.statSync(path.join(publico, f)).size, 0) / 1024), pf = path.join(__dirname, 'presupuesto.json');
      if (args.includes('--actualizar') || !fs.existsSync(pf)) fs.writeFileSync(pf, JSON.stringify({ totalKB: Math.ceil(total * 1.03 / 100) * 100 }, null, 1) + '\n');
      const tope = JSON.parse(fs.readFileSync(pf, 'utf8')).totalKB;
      if (total > tope) mal(`publico/ pesa ${(total / 1024).toFixed(1)} MB y el presupuesto son ${(tope / 1024).toFixed(1)} MB (pruebas/presupuesto.json): reduce peso o, si es a propósito, sube el tope con --actualizar`);
      else console.log(`  ✓ Peso de publico/: ${(total / 1024).toFixed(1)} MB de ${(tope / 1024).toFixed(1)} MB de presupuesto`);
    }
    let con = 0;
    for (const pag of pags) {
      const html = fs.readFileSync(path.join(publico, ...pag.split('/'), 'index.html'), 'utf8'), clave = pag.split('/')[1];
      // cada página lleva solo la versión de cada herramienta, no todo el historial (herramientas.js); Electrostática es la excepción
      if (clave !== 'electrostatica' && html.length / 1024 > MAX_KB) mal(`${pag}: la página pesa ${Math.round(html.length / 1024)} KB (el máximo son ${MAX_KB} KB; ¿se ha colado el historial de version.js o una librería entera?)`);
      const monta = /Practica\.monta\('([^']+)', '([^']+)'\)/.test(html);
      if (monta) con++;
      else if (!(clave in EXCEPCIONES)) mal(`${pag}: no tiene modo práctica (solo lo tienen sin él ${Object.keys(EXCEPCIONES).join(' y ')}, que ${Object.values(EXCEPCIONES).join(' / ')})`);
    }
    if (fallos === antes) console.log(`  ✓ Modo práctica en ${con} de ${pags.length} herramientas (el resto tiene el suyo propio) y ninguna página pasa de ${MAX_KB} KB`);
  }
  {
    // copiar en LaTeX y en texto (compartir.js) a partir de la fuente de las fórmulas
    const antes = fallos;
    const Ma = require(path.join(fuente, 'mates.js'));
    global.Mates = Ma;
    const Co = require(path.join(fuente, 'compartir.js'));
    for (const [src, tex, txt] of [['{x^{2}}/{2} + K', '\\frac{x^{2}}{2} + K', 'x^2/2 + K'], ['√(1 − x^{2})', '\\sqrt{1 - x^{2}}', '√(1 − x^2)'], ['∫_{0}^{π} sen x dx', '\\int_{0}^{\\pi} \\operatorname{sen} x \\, dx', '∫_0^π sen x dx'], ['{1}/{s^{2} + 1}', '\\frac{1}{s^{2} + 1}', '1/(s^2 + 1)'], ['e^{x^{2}}', 'e^{x^{2}}', 'e^(x^2)']]) {
      if (Co.latex(src) !== tex) mal(`Compartir: «${src}» en LaTeX sale «${Co.latex(src)}» en vez de «${tex}»`);
      if (Co.texto(src) !== txt) mal(`Compartir: «${src}» en texto sale «${Co.texto(src)}» en vez de «${txt}»`);
    }
    if (!Ma.html('$x^2$').includes('data-src="x^2"')) mal('Mates: la fórmula no guarda su fuente');
    if (fallos === antes) console.log('  ✓ Compartir: fórmulas a LaTeX y a texto');
  }
  {
    // copia de seguridad global de «Mis ejercicios» (biblioteca.js): crea y restaura sin duplicar, con un almacén falso
    const antes = fallos, falso = () => { const m = new Map(); return { get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
    const a = falso(), b = falso();
    a.setItem('simu-ejercicios:fisica-x', JSON.stringify({ items: [{ id: 'u1', titulo: 'Uno', carpeta: 'Tema 1', fijado: true, datos: '{"a":1}', actualizado: 5 }, { id: 'u2', titulo: 'Dos', datos: '{"a":2}' }] }));
    a.setItem('simu-ejercicios:otra', JSON.stringify({ items: [{ id: 'o1', titulo: 'Otro', datos: 'x' }] }));
    a.setItem('simu-ejercicios:vacia', JSON.stringify({ items: [] }));
    a.setItem('simu-ejercicios-ui', '{}'); a.setItem('fisica-x-v1', 'estado');
    // Electrostática con la barra antigua (hasta la 1.20): su biblioteca pasa a Mis ejercicios al hacer la copia
    a.setItem('electro-sim-lib-v2', JSON.stringify({ items: [{ id: 'e1', title: 'Problema', statement: 'Enunciado', folder: 'Parcial', scene: { sources: [] }, updated: 7 }] }));
    const c = Biblioteca.copia(a), json = JSON.parse(JSON.stringify(c));
    if (c.formato !== Biblioteca.FORMATO_COPIA || c.total !== 4 || Object.keys(c.herramientas).sort().join() !== 'electrostatica,fisica-x,otra' || c.electrostatica) mal(`Copia de seguridad: contenido inesperado ${JSON.stringify(c).slice(0, 200)}`);
    if (JSON.stringify(c).includes('fisica-x-v1') || JSON.stringify(c).includes('simu-ejercicios-ui')) mal('Copia de seguridad: se cuelan claves que no son de Mis ejercicios');
    b.setItem('simu-ejercicios:fisica-x', JSON.stringify({ items: [{ id: 'z', titulo: 'Uno', datos: '{"a":1}' }, { id: 'u2', titulo: 'Propio', datos: 'otro' }] }));
    const r = Biblioteca.restaura(json, b), lx = JSON.parse(b.getItem('simu-ejercicios:fisica-x')).items;
    if (r.nuevos !== 3 || r.repetidos !== 1 || r.herramientas !== 3) mal(`Copia de seguridad: restaurar da ${JSON.stringify(r)} en vez de 3 nuevos, 1 repetido y 3 herramientas`);
    if (lx.length !== 3 || new Set(lx.map((x) => x.id)).size !== 3 || !lx.some((x) => x.titulo === 'Propio') || !lx.some((x) => x.titulo === 'Dos' && x.datos === '{"a":2}')) mal('Copia de seguridad: restaurar pierde o duplica ejercicios');
    const ee = JSON.parse(b.getItem('simu-ejercicios:electrostatica')).items[0];
    if (JSON.parse(b.getItem('simu-ejercicios:otra')).items[0].datos !== 'x' || ee.id !== 'e1' || ee.carpeta !== 'Parcial' || JSON.parse(ee.datos).statement !== 'Enunciado' || !JSON.parse(ee.datos).scene) mal('Copia de seguridad: no restaura las demás herramientas ni Electrostática');
    if (a.getItem('electro-sim-lib-v2') !== null || !a.getItem('electro-sim-lib-v2-migrada') || Biblioteca.migraElectro(a) !== 0 || JSON.parse(a.getItem('simu-ejercicios:electrostatica')).items.length !== 1) mal('Electrostática: la biblioteca antigua no se migra una sola vez a Mis ejercicios (y se guarda una copia)');
    { const r2 = Biblioteca.restaura({ formato: Biblioteca.FORMATO_COPIA, herramientas: {}, electrostatica: [{ id: 'e9', title: 'De la copia antigua', scene: { sources: [] } }] }, b); if (r2.nuevos !== 1 || !JSON.parse(b.getItem('simu-ejercicios:electrostatica')).items.some((x) => x.titulo === 'De la copia antigua')) mal('Copia de seguridad: no abre las copias hechas con la barra antigua de Electrostática'); }
    if (Biblioteca.restaura(json, b).nuevos !== 0) mal('Copia de seguridad: restaurar dos veces duplica');
    let err = ''; try { Biblioteca.restaura({ formato: 'otro', herramientas: {} }, b); } catch (e) { err = e.message; }
    if (!err) mal('Copia de seguridad: acepta un archivo que no es una copia');
    Biblioteca.restaura({ formato: Biblioteca.FORMATO_COPIA, herramientas: { '../malo': [{ titulo: 'x', datos: 'y' }], 'ok-1': [{ titulo: 'x', datos: 'y' }] } }, b);
    if (b.getItem('simu-ejercicios:../malo') || !b.getItem('simu-ejercicios:ok-1')) mal('Copia de seguridad: no filtra los nombres de herramienta');
    if (fallos === antes) console.log('  ✓ Copia de seguridad global: crea, restaura sin duplicar, respeta lo propio y filtra claves ajenas');
  }


  const Mates = require(path.join(fuente, 'mates.js'));
  {
    const antes = fallos, m = (x) => Mates.mathml(x);
    if (!m('v_0y^2/(2g)').includes('<mfrac><msubsup><mi>v</mi><mi mathvariant="normal">0y</mi><mn>2</mn></msubsup><mrow><mn>2</mn><mi>g</mi></mrow></mfrac>')) mal('Mates: la fracción v_0y²/(2g) no sale bien');
    if (!m('√(v_x^2 + v_y^2)').includes('<msqrt><mrow><msubsup>')) mal('Mates: la raíz no quita los paréntesis');
    if (!m('e^{−bt/m}').includes('<msup><mi>e</mi><mrow><mo')) mal('Mates: el exponente entre llaves no sale');
    if (!m('x = 1,2·10<sup>−5</sup> "m/s"').includes('<mtext>m/s</mtext>')) mal('Mates: las unidades entre comillas no salen como texto');
    if (!m('cos^2 α').includes('<msup><mi mathvariant="normal">cos</mi><mn>2</mn></msup>')) mal('Mates: cos² no sale');
    if (!m('ΔT').includes('<mi mathvariant="normal">Δ</mi>')) mal('Mates: Δ debería ir recta');
    if (Mates.html('a $x$ b $y$').split('<math ').length !== 3) mal('Mates: no sustituye cada $…$');
    if (fallos === antes) console.log('  ✓ Mates: fracciones, raíces, exponentes, subíndices, unidades y funciones en MathML');
  }

  {
    // arreglo 3: reducción, igualación y sustitución dan la solución de Gauss
    const antes = fallos, X = require(path.join(fuente, 'sistemas', 'calculo.js'));
    const txt = (h) => h.replace(/<[^>]+>/g, '');
    for (const [M, esp] of [[[['3', '2', '7'], ['5', '-3', '-1']], 'x = 1, y = 2'], [[['1', '1', '1', '6'], ['2', '-1', '1', '3'], ['1', '2', '-1', '2']], 'x = 1, y = 2, z = 3'], [[['2', '1', '-1', '8'], ['-3', '-1', '2', '-11'], ['-2', '1', '2', '-3']], 'x = 2, y = 3, z = −1'], [[['1+i', '2', '3+i'], ['1', '-i', '1']], null]]) {
      const g = txt(X.resolver({ metodo: 'gauss', M }).res).replace(/ |&nbsp;/g, ' ').replace(/\s+/g, ' ');
      if (esp && g !== esp) mal(`Sistemas: Gauss da «${g}» en vez de «${esp}»`);
      for (const metodo of ['reduccion', 'igualacion', 'sustitucion']) {
        const r = X.resolver({ metodo, M });
        if (txt(r.res).replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ') !== g) mal(`Sistemas · ${metodo}: no coincide con Gauss`);
        if (r.pasos.some((p) => /^F<sub>/.test(p.t))) mal(`Sistemas · ${metodo}: usa pasos de Gauss en un sistema en el que se puede usar`);
      }
    }
    const sci = X.resolver({ metodo: 'sustitucion', M: [['1', '1', '1', '6'], ['2', '-1', '1', '3'], ['3', '0', '2', '9']] });
    if (!sci.pasos.some((p) => /No se usa sustitución/.test(p.t))) mal('Sistemas: en un indeterminado debería avisar de que no usa sustitución');
    const red = X.resolver({ metodo: 'reduccion', M: [['3', '2', '7'], ['5', '-3', '-1']] });
    if (!red.pasos.some((p) => /3·\(2\) − 5·\(1\)/.test(txt(p.html)))) mal('Sistemas: la reducción 2×2 no combina 3·(2) − 5·(1)');
    if (fallos === antes) console.log('  ✓ Sistemas: reducción, igualación y sustitución en 2×2, 3×3 y complejos coinciden con Gauss');
  }

  {
    // direcciones antiguas: cada una lleva a una página que existe, con aviso, 301 en Cloudflare y en Vercel
    const antes = fallos, red = fs.readFileSync(path.join(publico, '_redirects'), 'utf8'), vj = JSON.parse(fs.readFileSync(path.join(raiz, 'vercel.json'), 'utf8'));
    for (const [v, n] of Object.entries(Catalogo.redirecciones)) {
      if (!fs.existsSync(path.join(publico, n, 'index.html'))) mal(`Redirección ${v}: ${n} no existe`);
      const stub = fs.readFileSync(path.join(publico, v, 'index.html'), 'utf8'), destino = '../'.repeat(v.split('/').filter(Boolean).length) + n;
      if (!stub.includes(`url=${destino}`) || !stub.includes('noindex')) mal(`Redirección ${v}: la página de aviso no lleva a ${destino}`);
      if (!red.includes(`/${v} /${n} 301`)) mal(`Redirección ${v}: falta en _redirects`);
      if (!(vj.redirects || []).some((r) => r.source === `/${v.replace(/\/$/, '')}` && r.destination === `/${n}`)) mal(`Redirección ${v}: falta en vercel.json`);
    }
    if (fallos === antes) console.log(`  ✓ ${Object.keys(Catalogo.redirecciones).length} direcciones antiguas redirigen a su nueva sección`);
  }

  {
    // todas las herramientas llevan la cabecera común (diseno.js), con «Inicio» y su asignatura marcada, y la miga
    // «Asignatura › Herramienta», también el simulador de electrostática, con su propia maqueta
    const antes = fallos, pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => [a, `${a.clave}/${h.clave}/index.html`]));
    for (const [a, f] of pags) {
      const html = fs.readFileSync(path.join(publico, f), 'utf8');
      if (!html.includes('<header class="top"><a class="logo" href="../../">') || !html.includes('<a href="../../">Inicio</a>')) mal(`${f}: falta la cabecera común con «Inicio»`);
      if (!html.includes(`<a href="../../${a.clave}/" aria-current="page">`)) mal(`${f}: la cabecera no marca ${a.nombre}`);
      if (!html.includes(`<a href="../">${a.nombre}</a>`) || !html.includes('class="miga-izq"')) mal(`${f}: falta la miga «${a.nombre} › …»`);
      if (!html.includes(`--accent:${a.color}`)) mal(`${f}: no usa el color de ${a.nombre}`);
      if (!html.includes(`mailto:${Catalogo.correo}?subject=`) || !html.includes('Informar de un error</a>')) mal(`${f}: falta «Informar de un error» en el pie`);    if (!html.includes('<a class="foro" href="../../foro/">')) mal(`${f}: la cabecera no tiene el enlace al Foro`);
    }
    if (fallos === antes) console.log(`  ✓ Cabecera común, miga, color e «Informar de un error» en las ${pags.length} herramientas`);
  }

}

async function navegador() {
  console.log('3 · Páginas en Chromium');
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) {
    try { ({ chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'))); } catch (e2) { mal('no se encuentra playwright (npm i playwright)'); return; }
  }
  const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  const browser = require('./sin-anuncios.js')(await chromium.launch(exe ? { executablePath: exe } : {}));
  for (const j of (solo && solo !== 'electrostatica') || !primera ? [] : juegos) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + j.pagina);
    // la web usa «Mis ejercicios» (la barra común: ejemplos en su pestaña Ejemplos); la privada, una lista propia de ejemplos
    const web = j.pagina.startsWith(publico);
    await page.waitForSelector(web ? '.bib [data-acc=pestana-ejemplos]' : '#side-list .item');
    const enPagina = await page.evaluate(`(${resolver})(Physics, Presets)`);
    const antes = fallos;
    comparar(enPagina, j.esp, `Chromium · ${j.nombre}`);
    const ver = await page.locator('#ver .ver-n').textContent();
    if (ver !== Version.current) mal(`${j.nombre}: la página muestra la versión «${ver}», se esperaba ${Version.current}`);
    if (web) {
      if (await page.locator('#side, #side-list, #tab-guardados, #hoja-dlg').count()) mal(`${j.nombre}: Electrostática conserva restos de su barra lateral propia`);
      if (!(await page.locator('.bib .bib-seg [data-acc=pestana-guardados]').count()) || !(await page.locator('.bib .bib-h [data-acc=menu-general]').count())) mal(`${j.nombre}: la barra de Electrostática no es la común (faltan sus pestañas o su ⋮)`);
    } else {
      const sec = await page.locator('#side-list .sec-h span').allTextContents();
      if (!sec.includes(j.Presets.section)) mal(`${j.nombre}: la barra lateral no muestra la sección «${j.Presets.section}»`);
    }
    for (const e of Object.values(j.esp)) {
      if (web) { await page.click('.bib [data-acc=pestana-ejemplos]'); await page.locator('.bib .bib-ej', { hasText: e.titulo }).first().click(); }
      else await page.locator('#side-list .item .it', { hasText: e.titulo }).first().click();
      await asienta(page);
      const err = await page.evaluate(() => { const x = document.querySelector('#errors'); return x && !x.hidden ? x.textContent : ''; });
      if (err) mal(`${j.nombre} · ${e.titulo}: ${err}`);
      const warn = await page.locator('.warn').allTextContents();
      if (warn.length) mal(`${j.nombre} · ${e.titulo}: ${warn.join(' · ')}`);
    }
    await page.click('#help');
    await page.waitForSelector('#guide[open]');
    const sinImg = await page.evaluate(() => [...document.querySelectorAll('#guide img[data-img]')].filter((i) => !i.src).length);
    if (sinImg) mal(`${j.nombre}: la guía tiene ${sinImg} capturas sin cargar`);
    await page.keyboard.press('Escape');
    await page.click('#ver');
    if (!(await page.locator('#ver-log li').count())) mal(`${j.nombre}: el apartado Novedades está vacío`);
    await page.close();
    if (consola.length) mal(`${j.nombre}: consola del navegador:\n      ` + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ ${j.nombre}: mismos resultados, ${Object.keys(j.esp).length} ejercicios abiertos, guía y novedades sin errores de consola`);
  }
  // Electrostática con la barra común «Mis ejercicios» (Web 1.20.1): migración de lo de antes, guardar, abrir, imprimir varios y que sea igual que la de otra herramienta
  if (!((solo && solo !== 'electrostatica') || !primera)) { const antes = fallos; await require('./electrostatica-barra.js')(browser, { publico, path, mal }); if (fallos === antes) console.log('  ✓ Electrostática: usa la barra común (mismos botones y menús que Tiro parabólico), migra lo de antes, guarda, abre, imprime varios, enlaces y móvil'); }
  const medidos = {};
  for (const [i, f] of enNavegador.entries()) { const t0 = Date.now(); await f(browser); medidos[nombresNavegador[i]] = Math.round((Date.now() - t0) / 100) / 10; }
  if (args.includes('--tiempos')) { fs.writeFileSync(ficheroTiempos, JSON.stringify(Object.fromEntries(Object.entries({ ...TIEMPOS, ...medidos }).sort(([a], [b]) => a.localeCompare(b))), null, 1) + '\n'); console.log(`  · pruebas/tiempos.json: ${Object.keys(medidos).length} herramientas medidas`); }
  { const lentas = Object.entries(medidos).sort((a, b) => b[1] - a[1]).slice(0, 5); if (lentas.length > 1) console.log('  · las más lentas: ' + lentas.map(([k, t]) => `${k} ${t} s`).join(', ')); }
  if (primera) {
    {
      // arreglo 1: resultados destacados arriba y lectura de ancho fijo mientras corre el tiempo
      const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
      const consola = [];
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
      const antes = fallos;
      for (const [dir, lectura, rango, res] of [['tiro-parabolico', '#lectura', '#tiempo', '#resumen'], ['trabajo-y-energia', '#lectura', '#tiempo', '#resumen']]) {
        await page.goto('file://' + path.join(publico, 'fisica', dir, 'index.html'));
        await page.waitForSelector(`${res} > div`);
        if ((await page.locator(`.destacado ${res} > div`).count()) < 2) mal(`${dir}: los resultados no están en la tarjeta destacada`);
        const largos = new Set();
        for (const v of ['0', '137', '420', '777', '1000']) {
          await page.$eval(rango, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
          // la parte numérica (antes de «en la rampa…») no cambia de largo
          largos.add((await page.locator(lectura).textContent()).split(' · ').slice(0, dir === 'tiro-parabolico' ? 4 : 2).join(' · ').length);
        }
        if (largos.size !== 1) mal(`${dir}: la lectura cambia de ancho al mover el tiempo (${[...largos].join(', ')} caracteres)`);
      }
      await page.goto('file://' + path.join(publico, 'fisica', 'calorimetria', 'index.html'));
      await page.waitForFunction(() => document.querySelector('#te') && document.querySelector('#te').textContent.length > 0);
      if ((await page.locator('.destacado #te').count()) !== 1) mal('Calorimetría: la temperatura de equilibrio no está en la tarjeta destacada');
      await page.close();
      if (consola.length) mal('Arreglo 1: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log('  ✓ Tiro parabólico, Trabajo y energía y Calorimetría: resultados destacados y lectura de ancho fijo');
    }
    {
      // arreglo 2: fórmulas en MathML en el desarrollo y en la teoría
      const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
      const consola = [];
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
      const antes = fallos;
      for (const dir of ['tiro-parabolico', 'trabajo-y-energia', 'calorimetria']) {
        await page.goto('file://' + path.join(publico, 'fisica', dir, 'index.html'));
        await page.waitForSelector('#pasos li'); await page.waitForSelector('#pasos math'); await page.waitForSelector('.teoria math'); await asienta(page);
        const r = await page.evaluate(() => ({ pasos: document.querySelectorAll('#pasos math').length, teoria: document.querySelectorAll('.teoria math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('.teoria').textContent), ancho: Math.min(...[...document.querySelectorAll('#pasos math')].map((m) => m.getBoundingClientRect().width)) }));
        if (r.pasos < 3 || r.teoria < 2) mal(`${dir}: faltan fórmulas MathML (desarrollo ${r.pasos}, teoría ${r.teoria})`);
        if (r.dolar) mal(`${dir}: queda algún $ sin convertir en una fórmula`);
        if (!(r.ancho > 0)) mal(`${dir}: alguna fórmula MathML no se dibuja`);
      }
      // las cajas de fórmulas de la teoría del resto de herramientas
      for (const pag of ['circuitos/simulador', 'electromagnetismo/condensadores', 'fisica/dinamica', 'estadistica/distribuciones', 'electromagnetismo/faraday', 'fisica/gases', 'electromagnetismo/induccion', 'matematicas/matrices', 'fisica/ondas', 'fisica/doppler', 'circuitos/resistencias', 'estadistica/regresion', 'matematicas/complejos', 'fisica/fluidos', 'quimica/ph', 'fisica/ciclos', 'matematicas/taylor', 'matematicas/fourier', 'matematicas/edos', 'matematicas/laplace', 'matematicas/derivadas', 'quimica/cinetica', 'matematicas/campos', 'electromagnetismo/fuerza', 'matematicas/sistemas', 'fisica/solido-rigido']) {
        await page.goto('file://' + path.join(publico, ...pag.split('/'), 'index.html'));
        await page.waitForFunction(() => document.querySelectorAll('.teoria .f[data-m]').length > 0);
        const r = await page.evaluate(() => [...document.querySelectorAll('.teoria .f')].map((e) => e.querySelectorAll('math').length > 0 && !/\$/.test(e.textContent)));
        if (!r.length || r.includes(false)) mal(`${pag}: alguna caja de la teoría no sale en MathML`);
        // y ninguna fórmula suelta en el texto de la teoría se queda con sus $
        if (await page.evaluate(() => /\$/.test(document.querySelector('.teoria').textContent))) mal(`${pag}: hay una fórmula de la teoría que se ve con $`);
      }
      await page.close();
      if (consola.length) mal('Arreglo 2: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log('  ✓ Fórmulas MathML: desarrollo y teoría de Tiro parabólico, Trabajo y energía y Calorimetría, y la teoría de otras 25 herramientas, sin $ sueltos');
    }
  }
  {
    // arreglo 6: barra lateral «Mis ejercicios» en todas las herramientas con estado (guardar, carpeta, fijar, abrir, exportar, borrar e importar)
    const antes = fallos, consola = [];
    const pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}`));
    let probadas = 0;
    for (const pag of pags) {
      const html = fs.readFileSync(path.join(publico, ...pag.split('/'), 'index.html'), 'utf8'), [, dir, clave] = html.match(/Biblioteca\.monta\('([^']+)', (?:'([^']+)'|null)\)/) || [];
      if (!dir || !mia(dir)) continue;
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
      page.on('console', (m) => { if (m.type() === 'error') consola.push(`${pag}: ${m.text()}`); });
      page.on('pageerror', (e) => consola.push(`${pag}: excepción: ${e.message}`));
      await page.goto('file://' + path.join(publico, ...pag.split('/'), 'index.html'));
      if (!clave) { if (await page.$('.bib')) mal(`${pag}: tiene «Mis ejercicios» sin estado que guardar`); await page.close(); continue; }
      await page.waitForSelector('.bib .bib-acc');
      // los ejemplos se abren desde la barra («Ejercicios de ejemplo»); el desplegable de la página está oculto
      if (await page.$('.bib [data-acc=pestana-ejemplos]')) await page.click('.bib [data-acc=pestana-ejemplos]');
      const ej = (await page.$$('.bib .bib-ej')).length >= 2;
      if (ej) await page.click('.bib .bib-ej >> nth=0');
      if (ej) await page.click('.bib [data-acc=pestana-guardados]');
      await page.click('.bib [data-acc=nuevo]'); await page.fill('#bib-t', 'Prueba'); await page.fill('#bib-c', 'Tema 1'); await page.click('.bib [data-acc=guardar]');
      const guardado = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).items, `simu-ejercicios:${dir}`);
      if (guardado.length !== 1 || typeof guardado[0].datos !== 'string' || guardado[0].carpeta !== 'Tema 1') { mal(`${pag}: «Guardar el actual» no guarda el ejercicio`); await page.close(); continue; }
      if (!(await page.$('.bib-carp'))) mal(`${pag}: no aparece la carpeta`);
      if (ej) { await page.click('.bib [data-acc=pestana-ejemplos]'); await page.click('.bib .bib-ej >> nth=1'); await page.click('.bib [data-acc=pestana-guardados]'); }
      await page.click('.bib .bib-it .bib-dots'); await page.click('.bib [data-acc=fijar]');
      if (!(await page.evaluate(() => /Fijados/.test(document.querySelector('.bib-lista').textContent)))) mal(`${pag}: fijar no lo pone en Fijados`);
      // con una escritura pendiente de la app justo después del clic (10.1): tras recargar tiene que seguir lo guardado
      await Promise.all([page.waitForEvent('load'), page.evaluate((c) => { setTimeout(() => localStorage.setItem(c, '{"pisado":true}'), 0); document.querySelector('.bib .bib-abre').click(); }, clave).catch(() => {})]);
      try { await page.waitForSelector('.bib .bib-it.activo'); } catch (e) { mal(`${pag}: al abrir lo guardado no se marca como abierto (${e.message.split('\n')[0]})`); await page.close(); continue; }
      if ((await page.evaluate((k) => localStorage.getItem(k), clave)) !== guardado[0].datos) mal(`${pag}: abrir no recupera los datos guardados`);
      await page.click('.bib [data-acc=menu-general]');
      const [descarga] = await Promise.all([page.waitForEvent('download'), page.click('.bib [data-acc=exportar-todo]')]);
      const arch = path.join(tmp, `bib-${dir}.simu.json`); await descarga.saveAs(arch);
      const d = JSON.parse(fs.readFileSync(arch, 'utf8'));
      if (d.formato !== Biblioteca.FORMATO || d.herramienta !== dir || d.ejercicios[0].datos !== guardado[0].datos) mal(`${pag}: el archivo exportado no es correcto`);
      // copia de seguridad global: se descarga con esta herramienta dentro y se restaura tras borrarlo
      await page.click('.bib [data-acc=menu-general]');
      const [dc] = await Promise.all([page.waitForEvent('download'), page.click('.bib [data-acc=copia]')]);
      const archC = path.join(tmp, `copia-${dir}.copia.json`); await dc.saveAs(archC);
      const cp = JSON.parse(fs.readFileSync(archC, 'utf8'));
      if (cp.formato !== Biblioteca.FORMATO_COPIA || cp.herramientas[dir]?.[0]?.datos !== guardado[0].datos) mal(`${pag}: la copia de seguridad no es correcta`);
      await page.click('.bib .bib-it .bib-dots'); await page.click('.bib [data-acc=borrar]'); await page.click('.bib [data-acc=si-borrar]');
      if (await page.$('.bib-it')) mal(`${pag}: borrar no quita el ejercicio`);
      await page.setInputFiles('.bib ~ input[type=file]', archC);
      await page.waitForSelector('.bib .bib-it');
      await page.click('.bib .bib-it .bib-dots'); await page.click('.bib [data-acc=borrar]'); await page.click('.bib [data-acc=si-borrar]');
      await page.setInputFiles('.bib ~ input[type=file]', arch);
      await page.waitForSelector('.bib .bib-it');
      const imp = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).items, `simu-ejercicios:${dir}`);
      if (imp.length !== 1 || imp[0].titulo !== 'Prueba' || imp[0].datos !== guardado[0].datos || !imp[0].fijado) mal(`${pag}: importar no recupera el ejercicio`);
      await page.close(); probadas++;
    }
    if (primera) {
      // en el móvil se abre por encima, sin ensanchar la página
      const movil = await browser.newPage({ viewport: { width: 390, height: 800 } });
      await movil.goto('file://' + path.join(publico, 'fisica', 'tiro-parabolico', 'index.html'));
      await movil.waitForSelector('.bib-btn');
      if (await movil.evaluate(() => document.querySelector('.bib').classList.contains('abierta'))) mal('Mis ejercicios: en el móvil no debería empezar abierta');
      await movil.click('.bib-btn');
      const m = await movil.evaluate(() => ({ ab: document.querySelector('.bib').classList.contains('abierta'), scrim: !document.querySelector('.bib-scrim').hidden, ancho: document.documentElement.scrollWidth }));
      if (!m.ab || !m.scrim || m.ancho > 390) mal(`Mis ejercicios en el móvil: ${JSON.stringify(m)}`);
      await movil.close();
    }
    if (consola.length) mal('Arreglo 6: consola del navegador:\n      ' + consola.join('\n      '));
    if (completo && probadas < 38) mal(`Mis ejercicios: solo se ha probado en ${probadas} herramientas`);
    if (fallos === antes) console.log(`  ✓ Mis ejercicios: guardar, carpeta, fijar, abrir, exportar, borrar e importar en ${probadas} herramientas, y en el móvil`);
  }
  if (primera) {
    // Fase 10: ayudante común «Herramienta.exportar» (Descargar PNG + Copiar datos) y sus partes puras
    const antes = fallos, consola = [];
    const H = global.Herramienta;
    if (H.tabla(['t (s)', 'x'], [[0.5, 1234.5678], [1, NaN], ['a\tb', null]]) !== 't (s)\tx\n0,5\t1234,5678\n1\t\na b\t') mal(`Exportar: tabla() da ${JSON.stringify(H.tabla(['t (s)', 'x'], [[0.5, 1234.5678], [1, NaN], ['a\tb', null]]))}`);
    if (H.nombreArchivo('Trayectoria · Ángulo/θ') !== 'trayectoria-angulo' || H.nombreArchivo('') !== 'grafica') mal('Exportar: nombreArchivo() no limpia el nombre');
    for (const vista of [{ ancho: 1200, tema: 'light' }, { ancho: 390, tema: 'dark' }]) {
      const page = await browser.newPage({ viewport: { width: vista.ancho, height: 900 }, acceptDownloads: true, colorScheme: vista.tema });
      page.on('console', (m) => { if (m.type() === 'error') consola.push(m.text()); });
      page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
      await page.goto('file://' + path.join(publico, 'fisica', 'tiro-parabolico', 'index.html'));
      await page.waitForSelector('#grafica');
      await page.evaluate(() => { window.__copiado = null; navigator.clipboard.writeText = async (t) => { window.__copiado = t; }; Herramienta.exportar('#grafica', { nombre: 'prueba', etiqueta: 'la prueba', datos: () => ({ cab: ['t', 'x'], filas: [[1, 2.5]] }) }); Herramienta.exportar('#grafica', { datos: () => ({ cab: ['t', 'x'], filas: [[1, 2.5]] }) }); });
      const n = await page.evaluate(() => ({ barras: document.querySelectorAll('.exportar').length, botones: [...document.querySelectorAll('.exportar button')].map((b) => b.textContent + '|' + b.getAttribute('aria-label')), aviso: document.querySelector('.exportar-aviso').getAttribute('aria-live'), ancho: document.documentElement.scrollWidth }));
      if (n.barras !== 1 || n.botones.length !== 2 || !/PNG/.test(n.botones[0]) || !/Copiar/.test(n.botones[1]) || n.aviso !== 'polite') mal(`Exportar (${vista.ancho}px): barra incorrecta ${JSON.stringify(n)}`);
      if (n.ancho > vista.ancho) mal(`Exportar (${vista.ancho}px): la página se ensancha (${n.ancho})`);
      const [d] = await Promise.all([page.waitForEvent('download'), page.click('.exportar button >> nth=0')]);
      const arch = path.join(tmp, 'exportar.png'); await d.saveAs(arch);
      const png = fs.readFileSync(arch);
      if (d.suggestedFilename() !== 'prueba.png' || png.length < 1000 || png.readUInt32BE(0) !== 0x89504e47) mal(`Exportar (${vista.ancho}px): el PNG descargado no es válido (${d.suggestedFilename()}, ${png.length} B)`);
      await page.click('.exportar button >> nth=1');
      await page.waitForFunction(() => window.__copiado);
      if ((await page.evaluate(() => window.__copiado)) !== 't\tx\n1\t2,5' || !/copiados/.test(await page.locator('.exportar-aviso').textContent())) mal(`Exportar (${vista.ancho}px): los datos copiados no son los esperados`);
      await page.close();
    }
    if (consola.length) mal('Exportar: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log('  ✓ Exportar gráfica: PNG válido y datos copiados con coma decimal, en claro (1200 px) y oscuro (390 px)');
  }
  if (primera) {
    // Fase 7: enlace con el estado, hoja de ejercicios para imprimir y «Tu espacio» de la portada (el marco de la hoja pide http, no file://)
    const antes = fallos, consola = [], http = require('http');
    const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
    const srv = http.createServer((q, r) => {
      let f = path.join(publico, decodeURIComponent(q.url.split('?')[0].split('#')[0])); if (f.endsWith(path.sep) || (fs.existsSync(f) && fs.statSync(f).isDirectory())) f = path.join(f, 'index.html');
      if (!f.startsWith(publico) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
      r.writeHead(200, { 'content-type': tipos[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f));
    });
    await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
    const web = `http://127.0.0.1:${srv.address().port}/`;
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') consola.push(m.text()); });
    page.on('pageerror', (e) => consola.push(`excepción: ${e.message}`));
    const K = 'tiro-parabolico-v1';
    await page.goto(web + 'fisica/tiro-parabolico/'); await page.waitForSelector('.bib .bib-acc');
    // favorita y últimas usadas
    await page.click('.fav-btn');
    if ((await page.getAttribute('.fav-btn', 'aria-pressed')) !== 'true') mal('Favorita: el botón no se marca');
    // dos ejercicios guardados
    for (const [i, t] of [[0, 'Uno'], [1, 'Dos']]) { await page.click('.bib [data-acc=pestana-ejemplos]'); await page.click(`.bib .bib-ej >> nth=${i}`); await page.click('.bib [data-acc=pestana-guardados]'); await page.click('.bib [data-acc=nuevo]'); await page.fill('#bib-t', t); await page.click('.bib [data-acc=guardar]'); }
    const datos = await page.evaluate((k) => localStorage.getItem(k), K);
    // enlace con el estado: copiado, y abierto en otra página lleva los mismos datos
    await page.click('.bib [data-acc=menu-general]'); await page.click('.bib [data-acc=enlace]');
    const enlace = await page.evaluate(() => navigator.clipboard.readText());
    if (!/#d=[\w-]+$/.test(enlace)) mal('Copiar enlace: no lleva los datos (#d=…)');
    else {
      const p2 = await ctx.newPage(); await p2.goto(enlace); await p2.waitForSelector('.bib .bib-acc');
      if ((await p2.evaluate((k) => localStorage.getItem(k), K)) !== datos) mal('Copiar enlace: al abrirlo no se recuperan los datos');
      if (await p2.evaluate(() => location.hash)) mal('Copiar enlace: la dirección conserva el #d=… tras abrirlo');
      await p2.close();
    }
    // hoja para imprimir: dos ejercicios con su desarrollo y el estado de antes intacto
    await page.click('.bib [data-acc=menu-general]'); await page.click('.bib [data-acc=sel-modo]'); await page.click('.bib [data-acc=sel-todos]');
    await page.evaluate(() => { window.print = () => { window.__hoja = document.getElementById('hoja-imp').innerHTML; }; });
    await page.click('.bib [data-acc=sel-imprimir]');
    await page.waitForFunction(() => window.__hoja, null, { timeout: 30000 });
    const hoja = await page.evaluate(() => window.__hoja);
    if ((hoja.match(/<section class="hoja-ej">/g) || []).length !== 2 || !/1\. Uno/.test(hoja) || !/2\. Dos/.test(hoja)) mal('Hoja: no salen los dos ejercicios');
    if (!/Desarrollo/i.test(hoja) || !/<math/.test(hoja)) mal('Hoja: faltan el desarrollo o sus fórmulas');
    if ((await page.evaluate((k) => localStorage.getItem(k), K)) !== datos) mal('Hoja: no se devuelve el estado de antes');
    await page.evaluate(() => dispatchEvent(new Event('afterprint')));
    if (await page.evaluate(() => !!document.getElementById('hoja-imp') || document.body.classList.contains('hoja-imprimiendo'))) mal('Hoja: no se limpia tras imprimir');
    // portada: «Tu espacio» con continuar, favoritas y últimas
    const por = await ctx.newPage(); await por.goto(web); await por.waitForSelector('#tu-espacio:not([hidden])');
    const tu = await por.textContent('#tu-espacio');
    if (!/Continúa donde lo dejaste/.test(tu) || !/Favoritas/.test(tu) || !/Tiro parabólico/.test(tu)) mal('Portada: «Tu espacio» no muestra continuar y favoritas');
    await por.fill('#buscar', 'gases');
    if (await por.isVisible('#tu-espacio')) mal('Portada: «Tu espacio» debería ocultarse al buscar');
    await por.fill('#buscar', ''); await por.click('#tu-espacio .olvida');
    if (!(await por.getAttribute('#tu-espacio', 'hidden') !== null)) mal('Portada: «Olvidar mis datos» no vacía «Tu espacio»');
    // la llama 🔥 de la herramienta más usada de cada asignatura (los datos de prueba hacen de contador)
    const cl = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await cl.addInitScript(() => { window.LLAMA_FUENTE = '/api-test/populares'; });
    const visitas = []; await cl.route('**/api-test/visita', (r) => { visitas.push(r.request().postData()); r.fulfill({ status: 204 }); });
    await cl.route('**/api-test/populares', (r) => r.fulfill({ json: { fisica: 'fisica/tiro-parabolico', matematicas: 'matematicas/derivadas' } }));
    const pl = await cl.newPage(); pl.on('pageerror', (e) => consola.push(`llama: ${e.message}`));
    await pl.goto(web); await pl.waitForSelector('.mini a .llama');
    if ((await pl.locator('.mini a .llama').count()) !== 2) mal('Llama: la portada debería marcar solo las dos herramientas del contador');
    await pl.goto(web + 'fisica/'); await pl.waitForSelector('a.card .llama');
    await pl.goto(web + 'fisica/tiro-parabolico/'); await pl.waitForSelector('h1 .llama');
    await pl.goto(web + 'fisica/gases/'); await asienta(pl);
    for (let i = 0; i < 40 && !visitas.includes('{"r":"fisica/gases"}'); i++) await new Promise((ok) => setTimeout(ok, 50)); // el aviso del contador sale tras cargar
    if (await pl.locator('.llama').count()) mal('Llama: Gases no debería llevar llama');
    if (!visitas.includes('{"r":"fisica/tiro-parabolico"}') || !visitas.includes('{"r":"fisica/gases"}') || visitas.length !== 2) mal(`Contador: se esperaban 2 visitas (una por herramienta y sesión) y hay ${JSON.stringify(visitas)}`);
    // el Worker del contador (worker/contador.mjs) con una D1 de mentira
    {
      const W = await import(require('url').pathToFileURL(path.join(__dirname, '..', 'worker', 'contador.mjs')).href), filas = new Map();
      const db = { prepare: (sql) => ({ bind: (...a) => ({
        run: async () => { const k = `${a[0]}|${a[1]}`; filas.set(k, (filas.get(k) || 0) + 1); },
        all: async () => { const suma = {}; for (const [k, n] of filas) { const [mes, ruta] = k.split('|'); if (a.includes(mes)) suma[ruta] = (suma[ruta] || 0) + n; } return { results: Object.entries(suma).map(([ruta, n]) => ({ ruta, n })) }; },
      }) }) };
      const web0 = 'https://electromagnetismo.aceropuro30.workers.dev', env = { VISITAS: db, ASSETS: { fetch: async () => new Response('pagina') } };
      const llama = (u, o = {}) => W.default.fetch(new Request(web0 + u, o), env, { waitUntil: () => {} });
      const post = (r, origen = web0) => llama('/api/visita', { method: 'POST', body: JSON.stringify({ r }), headers: { origin: origen } });
      for (let i = 0; i < 12; i++) await post('fisica/tiro-parabolico');
      for (let i = 0; i < 11; i++) await post('fisica/gases');
      for (let i = 0; i < 3; i++) await post('matematicas/derivadas');            // por debajo del mínimo
      for (let i = 0; i < 20; i++) await post('fisica/no-existe');                 // no es una herramienta
      for (let i = 0; i < 20; i++) await post('quimica/ph', 'https://otra-web.example'); // origen no permitido
      const pop = await (await llama('/api/populares')).json();
      if (pop.fisica !== 'fisica/tiro-parabolico' || pop.matematicas || pop.quimica || Object.keys(pop).length !== 1) mal(`Contador: populares incorrecto ${JSON.stringify(pop)}`);
      if ((await (await llama('/')).text()) !== 'pagina') mal('Contador: el resto de rutas debe servir publico/');
      if ((await llama('/api/otra')).status !== 404) mal('Contador: /api/otra debería dar 404');
    }
    await cl.close();
    await ctx.close(); srv.close();
    if (consola.length) mal('Fase 7: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log('  ✓ Fase 7: copiar enlace con el estado, hoja de ejercicios para imprimir, «Tu espacio» en la portada y la llama de la más usada');
  }
  {
    // arreglo 7: modo práctica (datos al azar, se tapan los resultados, se corrigen las respuestas y se destapa la solución)
    const antes = fallos, consola = [];
    const pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}`));
    let probadas = 0, ejercicios = 0;
    for (const pag of pags) {
      const html = fs.readFileSync(path.join(publico, ...pag.split('/'), 'index.html'), 'utf8'), [, dir, clave] = html.match(/Practica\.monta\('([^']+)', (?:'([^']+)'|null)\)/) || [];
      if (!dir || dir === 'tabla-periodica' || !mia(dir)) continue;
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
      page.on('console', (m) => { if (m.type() === 'error') consola.push(`${pag}: ${m.text()}`); });
      page.on('pageerror', (e) => consola.push(`${pag}: excepción: ${e.message}`));
      await page.goto('file://' + path.join(publico, ...pag.split('/'), 'index.html'));
      await page.waitForSelector('.prac-btn');
      const previo = await page.evaluate((k) => localStorage.getItem(k), clave);
      await page.click('.prac-btn');
      for (let n = 0; n < 5; n++) {
        if (n) await page.click('.prac [data-a=otro]');
        const r = await page.evaluate(() => ({ huecos: document.querySelectorAll('.prac-in').length, tapados: document.querySelectorAll('.prac-tapa').length, resp: window.PracticaApp.respuestas() }));
        if (!r.huecos || !r.tapados) { mal(`${pag}: el modo práctica no pregunta nada o no tapa la solución (${r.huecos} huecos, ${r.tapados} tapados)`); break; }
        const ins = await page.$$('.prac-in');
        for (let k = 0; k < ins.length; k++) await ins[k].fill(r.resp[k]);
        await page.click('.prac [data-a=comprobar]');
        if (!(await page.$('.prac-nota.bien'))) { mal(`${pag}: las respuestas correctas no salen bien: ${r.resp.join(' · ')}`); break; }
        ejercicios++;
      }
      // Herramientas con pestañas o fuentes cuyo ejercicio aún depende del estado anterior de la página (pendiente de la fase 2 de ejercicios inventados)
      const SIN_SEMILLA = ['electromagnetismo/magnetostatica', 'fisica/tiro-parabolico', 'fisica/calorimetria'];
      // ejercicios inventados (F18): el mismo código da el mismo ejercicio, y cada nivel tiene el suyo
      { const cod = await page.evaluate(() => window.PracticaApp.codigo), r1 = await page.evaluate(() => window.PracticaApp.respuestas().join('|'));
        await page.click('.prac [data-a=otro]');
        const otro = await page.evaluate(() => window.PracticaApp.codigo);
        // dos aperturas seguidas del mismo código: el resto de la página (otra pestaña, huecos de antes) ya no cambia entre una y otra
        const abre = () => page.evaluate((c) => { window.PracticaApp.abreCodigo(c); return window.PracticaApp.respuestas().join('|'); }, cod);
        const r1b = await abre(), r2 = await abre();
        if (otro === cod) mal(`${pag}: «Inventar otro ejercicio» repite el código ${cod}`);
        if (r1b !== r2 && !SIN_SEMILLA.includes(pag)) mal(`${pag}: el código ${cod} no da el mismo ejercicio (${r1b} ≠ ${r2})`);
        if (!/^[FMD]-[0-9A-Z]+$/.test(cod)) mal(`${pag}: código de ejercicio raro: ${cod}`); }
      await (await page.$('.prac-in')).fill('123456789');
      await page.click('.prac [data-a=comprobar]');
      if (!(await page.$('.prac-nota.mal'))) mal(`${pag}: una respuesta equivocada sale bien`);
      await page.click('.prac [data-a=solucion]');
      if (await page.$('.prac-tapa')) mal(`${pag}: «Ver la solución» no destapa el desarrollo`);
      if (!(await page.$('.prac-sol'))) mal(`${pag}: «Ver la solución» no pone el valor correcto junto al hueco equivocado`);
      await Promise.all([page.waitForEvent('load'), page.click('.prac-btn')]);
      if ((await page.evaluate((k) => localStorage.getItem(k), clave)) !== previo) mal(`${pag}: al salir del modo práctica no vuelven los datos de antes`);
      await page.close(); probadas++;
    }
    if (consola.length) mal('Arreglo 7: consola del navegador:\n      ' + consola.join('\n      '));
    if (completo && probadas < 38) mal(`Modo práctica: solo se ha probado en ${probadas} herramientas`);
    if (fallos === antes) console.log(`  ✓ Modo práctica: ${ejercicios} ejercicios al azar en ${probadas} herramientas, corregidos bien y mal, con la solución y la vuelta a los datos de antes`);
  }
  {
    // prueba de humo común (pruebas/humo.js): cambiar un dato, guardarlo, recargar y verlo de vuelta, modo oscuro y móvil
    const antes = fallos, r = await require('./humo.js')(browser, { mal, solo, filtro: mia });
    const total = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible)).length;
    if (completo && r.probadas < total) mal(`Humo: solo se han probado ${r.probadas} de ${total} herramientas`);
    if (fallos === antes) console.log(`  ✓ Humo: ${r.probadas} herramientas guardan un dato cambiado y lo recuperan al recargar, en modo oscuro y a 390 px, sin errores de consola`);
  }
  {
    // enunciado del ejercicio (pruebas/enunciado.js): se escribe, viaja con el estado y con Mis ejercicios, y sale al imprimir
    const antes = fallos, r = await require('./enunciado.js')(browser, { mal, solo, filtro: mia });
    if (completo && r.probadas < 100) mal(`Enunciado: solo se ha probado en ${r.probadas} herramientas`);
    if (fallos === antes) console.log(`  ✓ Enunciado: ${r.probadas} herramientas guardan el enunciado con el ejercicio (Mis ejercicios, recarga), lo sacan al imprimir y abren sin él los estados de antes`);
  }
  {
    // «Usar en…» (pruebas/usar-en.js): cada enlace entre herramientas abre su destino con los datos llevados y un resultado
    const antes = fallos, r = await require('./usar-en.js')(browser, { mal, solo, filtro: mia });
    if (completo && r.enlaces.length < 8) mal(`Usar en: solo se han probado ${r.enlaces.length} enlaces`);
    if (fallos === antes && r.enlaces.length) console.log(`  ✓ Usar en: ${r.enlaces.length} enlaces de ${r.origenes} herramientas abren la otra herramienta con los datos llevados y un resultado`);
  }
  {
    // accesibilidad (pruebas/accesibilidad.js): axe-core en todas las páginas de publico/, en claro, oscuro y a 390 px
    const antes = fallos, r = await require('./accesibilidad.js')(browser, { mal, solo });
    if (fallos === antes) console.log(`  ✓ Accesibilidad: axe-core sin infracciones en ${r.paginas} páginas, en modo claro, modo oscuro y a 390 px`);
  }
  if (primera) {
    // F15.5 · estados, copia de seguridad y .simu.json guardados con una versión antigua (pruebas/muestras/): se abren en la actual
    const antes = fallos, r = await require('./muestras.js')(browser, { mal });
    if (fallos === antes) console.log(`  ✓ Muestras de versiones antiguas: ${r.probados} estados, copia de seguridad y archivo .simu.json restaurados sin pérdidas`);
  }
  if (primera) {
    // web instalable y sin conexión (pruebas/pwa.js): manifiesto, instalación, sin red, «Guardar todo» y versión nueva
    const antes = fallos, r = await require('./pwa.js')(browser, { mal });
    if (fallos === antes) console.log('  ✓ PWA: manifiesto e iconos, se instala, sin conexión funcionan las páginas guardadas, con conexión llega la versión nueva, y una versión nueva avisa, se aplica y rehace «Guardar todo»');
  }
  // portada y páginas de asignatura: sin errores de consola y sin enlaces internos rotos
  const portal = !primera ? [] : ['index.html', 'novedades/index.html', 'foro/index.html', 'fenomenos/index.html', ...Catalogo.asignaturas.map((a) => `${a.clave}/index.html`), 'electromagnetismo/magnetostatica/index.html', 'quimica/tabla-periodica/index.html', 'fisica/trabajo-y-energia/index.html', 'quimica/masa-molar/index.html', 'quimica/configuracion-electronica/index.html', 'electromagnetismo/condensadores/index.html', 'fisica/tiro-parabolico/index.html', 'quimica/disoluciones/index.html', 'fisica/calorimetria/index.html', 'electromagnetismo/induccion/index.html', 'matematicas/matrices/index.html', 'matematicas/sistemas/index.html', 'estadistica/distribuciones/index.html', 'circuitos/simulador/index.html', 'fisica/dinamica/index.html', 'fisica/solido-rigido/index.html', 'fisica/ondas/index.html', 'fisica/doppler/index.html', 'circuitos/resistencias/index.html', 'estadistica/regresion/index.html', 'matematicas/complejos/index.html', 'fisica/fluidos/index.html', 'quimica/ph/index.html', 'fisica/ciclos/index.html', 'matematicas/taylor/index.html', 'matematicas/fourier/index.html', 'matematicas/edos/index.html', 'quimica/cinetica/index.html', 'matematicas/campos/index.html', 'electromagnetismo/fuerza/index.html', 'estadistica/intervalos/index.html', 'electromagnetismo/ondas-em/index.html', 'fisica/interferencia/index.html', 'matematicas/laplace/index.html', 'matematicas/derivadas/index.html', 'fisica/gases/index.html', 'electromagnetismo/faraday/index.html'];
  const antes = fallos;
  // buscador global (buscador.js): «/» y Ctrl+K abren la ventana, encuentra sin tildes, herramientas y fenómenos, Intro abre y Esc cierra
  {
    const Buscador = require(path.join(fuente, 'buscador.js')), ind = Buscador.indice();
    const nh = Catalogo.asignaturas.reduce((s, y) => s + y.herramientas.filter((h) => h.disponible).length, 0), nf = Catalogo.fenomenos.lista.filter((x) => x.disponible).length;
    if (ind.e.filter((x) => x[0] === 'h').length !== nh || ind.e.filter((x) => x[0] === 'f').length !== nf) mal('buscador: el índice no tiene todas las herramientas y fenómenos disponibles');
    const antes = fallos;
    const b = await browser.newPage({ viewport: { width: 1200, height: 900 } }), errs = [];
    b.on('pageerror', (e) => errs.push(e.message));
    await b.goto('file://' + path.join(publico, 'fisica/ondas/index.html'));
    await b.keyboard.press('/');
    if (!(await b.locator('.bq-fondo:visible').count())) mal('buscador: «/» no abre la ventana');
    await b.keyboard.type('magnetostatica biot');
    const primero = await b.locator('.bq a[role=option]').first().innerText();
    if (!/Magnetostática/.test(primero)) mal(`buscador: «magnetostatica biot» (sin tilde) no pone Magnetostática la primera: ${primero.replace(/\n/g, ' | ')}`);
    await b.keyboard.press('Escape');
    if (await b.locator('.bq-fondo:visible').count()) mal('buscador: Esc no cierra la ventana');
    await b.keyboard.press('Control+k');
    await b.keyboard.type('el rayo');
    if (!/Fenómeno/.test(await b.locator('.bq a[role=option]').first().innerText())) mal('buscador: «el rayo» no encuentra el fenómeno');
    await b.keyboard.press('Escape');
    await b.keyboard.press('Control+k');
    await b.keyboard.type('zzzxq');
    if (!(await b.locator('.bq-nada').count())) mal('buscador: sin resultados no avisa');
    await b.fill('#bq-campo', 'dopler');
    await b.fill('#bq-campo', 'doppler');
    await b.keyboard.press('Enter');
    await b.waitForURL(/fisica\/doppler\/$/, { timeout: 5000 }).catch(() => mal(`buscador: Intro no abre Doppler (${b.url()})`));
    await b.goto(b.url() + 'index.html'); // file:// no completa la carpeta con su index.html
    // al pulsar el campo de la cabecera también se abre
    await b.click('header.top .buscar');
    if (!(await b.locator('.bq-fondo:visible').count())) mal('buscador: el campo de la cabecera no abre la ventana');
    await b.keyboard.press('Escape');
    // en la portada «/» lleva al campo de la propia página
    await b.goto('file://' + path.join(publico, 'index.html'));
    await b.keyboard.press('/');
    if (!(await b.evaluate(() => document.activeElement.id === 'buscar')) || (await b.locator('.bq-fondo:visible').count())) mal('buscador: en la portada «/» debe enfocar #buscar');
    // en Electrostática, como en las demás herramientas, Ctrl+K y «/» abren el buscador global (ya no tiene buscador propio)
    await b.goto('file://' + path.join(publico, 'electromagnetismo/electrostatica/index.html'));
    await b.keyboard.press('Control+k');
    if (!(await b.locator('.bq-fondo:visible').count())) mal('buscador: Ctrl+K no abre la ventana en Electrostática');
    await b.keyboard.press('Escape');
    await b.locator('body').click({ position: { x: 5, y: 5 } });
    await b.keyboard.press('/');
    if (!(await b.locator('.bq-fondo:visible').count())) mal('buscador: «/» no abre la ventana en Electrostática');
    // móvil: cabe en 390 px
    await b.setViewportSize({ width: 390, height: 800 });
    const ancho = await b.evaluate(() => document.querySelector('.bq').getBoundingClientRect().width);
    if (ancho > 390) mal(`buscador: en el móvil mide ${ancho}px`);
    if (errs.length) mal(`buscador: errores en la página: ${errs.join(' · ')}`);
    await b.close();
    if (fallos === antes) console.log('  ✓ buscador global: «/», Ctrl+K, sin tildes, herramientas y fenómenos, Intro, Esc, portada, Electrostática y móvil');
  }
  for (const f of portal) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, f));
    const enlaces = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href).filter((u) => u.startsWith('file:')));
    for (const u of enlaces) {
      const destino = decodeURIComponent(new URL(u).pathname), archivo = destino.endsWith('/') ? destino + 'index.html' : destino;
      if (!fs.existsSync(archivo)) mal(`${f}: enlace roto a ${path.relative(publico, archivo)}`);
    }
    if (f === 'index.html') {
      await page.fill('#buscar', 'biot savart');
      const vis = await page.locator('[data-buscar]:visible').count();
      if (vis !== 1) mal(`portada: buscar «biot savart» deja ${vis} herramientas, se esperaba 1`);
      await page.fill('#buscar', '');
      // barra lateral: un enlace por asignatura que lleva a su sección y queda marcado
      const lado = await page.locator('.lado a[href^="#"]').evaluateAll((as) => as.map((a) => a.hash.slice(1)));
      for (const a of Catalogo.asignaturas) if (!lado.includes(a.clave)) mal(`portada: la barra lateral no enlaza ${a.nombre}`);
      for (const id of lado) if (!(await page.locator(`[id="${id}"]`).count())) mal(`portada: la barra lateral enlaza #${id}, que no existe`);
      await page.click('.lado a[href="#quimica"]');
      if (!(await page.locator('.lado a.on[href="#quimica"]').count())) mal('portada: pulsar Química en la barra lateral no la marca');
      // las herramientas que vienen después salen como «Próximamente», sin enlace
      const pronto = Catalogo.asignaturas.flatMap((x) => x.herramientas.filter((h) => !h.disponible)).length;
      const off = await page.locator('.mini .off').evaluateAll((ds) => ds.filter((d) => !d.closest('a') && !d.querySelector('a') && d.textContent.includes('Próximamente')).length);
      if (off !== pronto) mal(`portada: ${off} herramientas «Próximamente» sin enlace, se esperaban ${pronto}`);
    }
    const asig = Catalogo.asignaturas.find((y) => f === `${y.clave}/index.html`);
    if (asig) {
      const x = asig, pronto = x.herramientas.filter((h) => !h.disponible).length;
      if ((await page.locator('.cards div.card.off').count()) !== pronto || (await page.locator('.cards a.card').count()) !== x.herramientas.length - pronto) mal(`${f}: las tarjetas «Próximamente» no coinciden con el catálogo o tienen enlace`);
    }
    if (f === 'fenomenos/index.html') {
      // una tarjeta por fenómeno (los que faltan, «Próximamente» y sin enlace) y el filtro por asignatura
      const V = Catalogo.fenomenos, pronto = V.lista.filter((x) => !x.disponible).length;
      if ((await page.locator('.cards div.card.off').count()) !== pronto || (await page.locator('.cards a.card').count()) !== V.lista.length - pronto) mal('fenomenos: las tarjetas no coinciden con el catálogo');
      // los disponibles llevan su imagen (fuente/fenomenos/<clave>/imagen.webp) en vez de la letra
      const imgs = await page.evaluate(async () => Promise.all([...document.querySelectorAll('.cards a.card')].map(async (a) => { const i = a.querySelector('.img img'); if (!i) return 0; i.loading = 'eager'; await i.decode().catch(() => {}); return i.naturalWidth; })));
      if (imgs.some((w) => w !== 640)) mal(`fenomenos: hay tarjetas sin imagen o con una imagen que no carga (anchos ${imgs.join(', ')})`);
      await page.click('.filtro button[data-asig="quimica"]');
      const vis = await page.locator('.cards [data-asig]:visible').count(), esp = V.lista.filter((x) => x.asignaturas.includes('quimica')).length;
      if (vis !== esp) mal(`fenomenos: el filtro de Química deja ${vis} fenómenos, se esperaban ${esp}`);
    }
    if (asig && Catalogo.fenomenos.lista.some((x) => x.asignaturas.includes(asig.clave)) && !(await page.locator('.vida .mini > *').count())) mal(`${f}: falta el bloque «En la vida real»`);
    if (!(await page.locator('header.top nav a[href$="fenomenos/"]').count())) mal(`${f}: la cabecera no enlaza «Física en la vida real»`);
    if (f === 'foro/index.html') {
      if (!(await page.locator('h1').textContent()).includes('en construcción')) mal('foro: la página no dice que está en construcción');
    }
    if (!(await page.locator('header.top a.foro:visible').count())) mal(`${f}: la cabecera no tiene el enlace al Foro`);
    if (f === 'novedades/index.html') {
      // una tarjeta por versión con todos sus cambios dentro, y cada herramienta nueva enlazada
      const log = require(path.join(fuente, 'version.js')).de('web').log;
      const tarjetas = await page.locator('.vers').evaluateAll((vs) => vs.map((v) => ({ v: v.id.slice(1), n: v.querySelectorAll('li').length })));
      if (tarjetas.length !== log.length) mal(`novedades: ${tarjetas.length} versiones, se esperaban ${log.length}`);
      log.forEach((r, i) => { if (tarjetas[i]?.v !== r.v || tarjetas[i]?.n !== r.cambios.length) mal(`novedades: la versión ${r.v} no tiene sus ${r.cambios.length} cambios juntos`); });
      const nuevas = log.flatMap((r) => r.cambios).filter((c) => c.startsWith('Nueva herramienta:')).length, enlazadas = await page.locator('.vers a.ir').count();
      if (enlazadas !== nuevas) mal(`novedades: ${enlazadas} herramientas nuevas con enlace, se esperaban ${nuevas}`);
    }
    await page.close();
    if (consola.length) mal(`${f}: consola del navegador:\n      ` + consola.join('\n      '));
  }
  if (primera && fallos === antes) console.log(`  ✓ Portada, ${Catalogo.asignaturas.length} asignaturas y las herramientas sin errores de consola ni enlaces rotos`);
  await browser.close();
}

(args.includes('--sin-navegador') ? Promise.resolve() : navegador()).then(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fallos ? `\n✗ ${fallos} fallo(s)` : '\n✓ Todo correcto');
  process.exit(fallos ? 1 : 0);
}, (e) => { console.error(e); process.exit(1); });
