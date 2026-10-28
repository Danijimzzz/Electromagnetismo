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
   Uso: node pruebas/comprobar.js [--actualizar] [--sin-navegador] [--solo CARPETA]
   --solo CARPETA compila todo pero solo comprueba esa herramienta (sus cálculos, su página, su humo,
   Mis ejercicios y práctica); con --solo electrostatica, solo el simulador de electrostática.
   --actualizar reescribe los esperados con los resultados actuales (solo si el cambio de forma es intencionado). */
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const raiz = path.join(__dirname, '..'), fuente = path.join(raiz, 'fuente'), publico = path.join(raiz, 'publico');
const args = process.argv.slice(2), solo = args.includes('--solo') ? args[args.indexOf('--solo') + 1] : null;
let fallos = 0;
const mal = (m) => { fallos++; console.log('  ✗ ' + m); };

// lo único que puede haber en publico/ (lo que sirven Vercel y Cloudflare): los archivos sueltos,
// la portada, una página por asignatura y una por herramienta disponible del catálogo
const Catalogo = require(path.join(fuente, 'catalogo.js')), Biblioteca = require(path.join(fuente, 'biblioteca.js'));
const PUBLICABLES = ['index.html', 'novedades/index.html', 'foro/index.html', 'og.png', 'apple-touch-icon.png', 'legal.css', 'aviso-legal.html', 'privacidad.html', 'cookies.html', 'contacto.html', 'fuentes/stix-two-math.woff2', 'fuentes/OFL-STIX-Two.txt', 'sitemap.xml', 'robots.txt',
  ...Catalogo.asignaturas.flatMap((a) => [`${a.clave}/index.html`, ...a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}/index.html`)]),
  // «Física en la vida real»: el índice y una página por fenómeno disponible
  'fenomenos/index.html', ...Catalogo.fenomenos.lista.filter((f) => f.disponible).flatMap((f) => [`fenomenos/${f.clave}/index.html`, `fenomenos/${f.clave}/imagen.webp`]),
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
  j.esp = JSON.parse(fs.readFileSync(j.esperados, 'utf8'));
  const antes = fallos;
  comparar(nodo, j.esp, `Node · ${j.nombre}`);
  if (fallos === antes) console.log(`  ✓ ${j.nombre}: ${Object.keys(j.esp).length} ejercicios iguales a ${path.basename(j.esperados)}`);
}
// la web pública no puede llevar nada del PDF de la asignatura
const textos = hay.filter((f) => f.endsWith('.html')).map((f) => [f, fs.readFileSync(path.join(publico, f), 'utf8')]);
const delPdf = juegos[1].Presets.list.flatMap((p) => [p.statement, p.title]).flatMap((t) => textos.filter(([, x]) => x.includes(t)).map(([f]) => `${f}: ${t}`));
if (delPdf.length) mal(`publico/ contiene enunciados o títulos del Tema 3:\n      ${delPdf.join('\n      ')}`);
else console.log('  ✓ publico/ no contiene ningún enunciado ni título del Tema 3');
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
const enNavegador = HERRAMIENTAS.filter((k) => (!solo || solo === k) && fs.existsSync(path.join(__dirname, 'herramientas', k + '.js'))).map((k) => require(path.join(__dirname, 'herramientas', k + '.js'))({ fs, path, fuente, publico, args, mal, pagina }));

if (!solo) {
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
      if (!html.includes(`--accent:${a.color}`)) mal(`${f}: no usa el color de ${a.nombre}`);    if (!html.includes('<a class="foro" href="../../foro/">')) mal(`${f}: la cabecera no tiene el enlace al Foro`);
    }
    if (fallos === antes) console.log(`  ✓ Cabecera común, miga y color de la asignatura en las ${pags.length} herramientas`);
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
  for (const j of solo && solo !== 'electrostatica' ? [] : juegos) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + j.pagina);
    await page.waitForSelector('#side-list .item');
    const enPagina = await page.evaluate(`(${resolver})(Physics, Presets)`);
    const antes = fallos;
    comparar(enPagina, j.esp, `Chromium · ${j.nombre}`);
    const ver = await page.locator('#ver .ver-n').textContent();
    if (ver !== Version.current) mal(`${j.nombre}: la página muestra la versión «${ver}», se esperaba ${Version.current}`);
    const sec = await page.locator('#side-list .sec-h span').allTextContents();
    if (!sec.includes(j.Presets.section)) mal(`${j.nombre}: la barra lateral no muestra la sección «${j.Presets.section}»`);
    for (const e of Object.values(j.esp)) {
      await page.locator('#side-list .item .it', { hasText: e.titulo }).first().click();
      await page.waitForTimeout(150);
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
  for (const f of enNavegador) await f(browser);
  if (!solo) {
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
        await page.waitForSelector('#pasos li');
        await page.waitForTimeout(100);
        const r = await page.evaluate(() => ({ pasos: document.querySelectorAll('#pasos math').length, teoria: document.querySelectorAll('.teoria math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('.teoria').textContent), ancho: Math.min(...[...document.querySelectorAll('#pasos math')].map((m) => m.getBoundingClientRect().width)) }));
        if (r.pasos < 3 || r.teoria < 2) mal(`${dir}: faltan fórmulas MathML (desarrollo ${r.pasos}, teoría ${r.teoria})`);
        if (r.dolar) mal(`${dir}: queda algún $ sin convertir en una fórmula`);
        if (!(r.ancho > 0)) mal(`${dir}: alguna fórmula MathML no se dibuja`);
      }
      // las cajas de fórmulas de la teoría del resto de herramientas
      for (const pag of ['circuitos/alterna', 'circuitos/continua', 'electromagnetismo/condensadores', 'fisica/dinamica', 'estadistica/distribuciones', 'electromagnetismo/faraday', 'fisica/gases', 'electromagnetismo/induccion', 'matematicas/matrices', 'fisica/ondas', 'fisica/doppler', 'circuitos/resistencias', 'estadistica/regresion', 'matematicas/complejos', 'fisica/fluidos', 'quimica/ph', 'fisica/ciclos', 'matematicas/taylor', 'matematicas/fourier', 'matematicas/edos', 'matematicas/laplace', 'matematicas/derivadas', 'quimica/cinetica', 'matematicas/campos', 'electromagnetismo/fuerza', 'matematicas/sistemas', 'fisica/solido-rigido']) {
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
      if (!dir || (solo && dir !== solo)) continue;
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
      page.on('console', (m) => { if (m.type() === 'error') consola.push(`${pag}: ${m.text()}`); });
      page.on('pageerror', (e) => consola.push(`${pag}: excepción: ${e.message}`));
      await page.goto('file://' + path.join(publico, ...pag.split('/'), 'index.html'));
      if (!clave) { if (await page.$('.bib')) mal(`${pag}: tiene «Mis ejercicios» sin estado que guardar`); await page.close(); continue; }
      await page.waitForSelector('.bib .bib-acc');
      // los ejemplos se abren desde la barra («Ejercicios de ejemplo»); el desplegable de la página está oculto
      const ej = (await page.$$('.bib .bib-ej')).length >= 2;
      if (ej) await page.click('.bib .bib-ej >> nth=0');
      await page.click('.bib [data-acc=nuevo]'); await page.fill('#bib-t', 'Prueba'); await page.fill('#bib-c', 'Tema 1'); await page.click('.bib [data-acc=guardar]');
      const guardado = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).items, `simu-ejercicios:${dir}`);
      if (guardado.length !== 1 || typeof guardado[0].datos !== 'string' || guardado[0].carpeta !== 'Tema 1') { mal(`${pag}: «Guardar el actual» no guarda el ejercicio`); await page.close(); continue; }
      if (!(await page.$('.bib-carp'))) mal(`${pag}: no aparece la carpeta`);
      if (ej) await page.click('.bib .bib-ej >> nth=1');
      await page.click('.bib [data-acc=fijar]');
      if (!(await page.evaluate(() => /Fijados/.test(document.querySelector('.bib-lista').textContent)))) mal(`${pag}: fijar no lo pone en Fijados`);
      await Promise.all([page.waitForEvent('load'), page.click('.bib .bib-abre')]);
      await page.waitForSelector('.bib .bib-it.activo');
      if ((await page.evaluate((k) => localStorage.getItem(k), clave)) !== guardado[0].datos) mal(`${pag}: abrir no recupera los datos guardados`);
      const [descarga] = await Promise.all([page.waitForEvent('download'), page.click('.bib [data-acc=exportar-todo]')]);
      const arch = path.join(tmp, `bib-${dir}.simu.json`); await descarga.saveAs(arch);
      const d = JSON.parse(fs.readFileSync(arch, 'utf8'));
      if (d.formato !== Biblioteca.FORMATO || d.herramienta !== dir || d.ejercicios[0].datos !== guardado[0].datos) mal(`${pag}: el archivo exportado no es correcto`);
      await page.click('.bib [data-acc=borrar]'); await page.click('.bib [data-acc=si-borrar]');
      if (await page.$('.bib-it')) mal(`${pag}: borrar no quita el ejercicio`);
      await page.setInputFiles('.bib ~ input[type=file]', arch);
      await page.waitForSelector('.bib .bib-it');
      const imp = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).items, `simu-ejercicios:${dir}`);
      if (imp.length !== 1 || imp[0].titulo !== 'Prueba' || imp[0].datos !== guardado[0].datos || !imp[0].fijado) mal(`${pag}: importar no recupera el ejercicio`);
      await page.close(); probadas++;
    }
    if (!solo) {
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
    if (!solo && probadas < 38) mal(`Mis ejercicios: solo se ha probado en ${probadas} herramientas`);
    if (fallos === antes) console.log(`  ✓ Mis ejercicios: guardar, carpeta, fijar, abrir, exportar, borrar e importar en ${probadas} herramientas, y en el móvil`);
  }
  {
    // arreglo 7: modo práctica (datos al azar, se tapan los resultados, se corrigen las respuestas y se destapa la solución)
    const antes = fallos, consola = [];
    const pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}`));
    let probadas = 0, ejercicios = 0;
    for (const pag of pags) {
      const html = fs.readFileSync(path.join(publico, ...pag.split('/'), 'index.html'), 'utf8'), [, dir, clave] = html.match(/Practica\.monta\('([^']+)', (?:'([^']+)'|null)\)/) || [];
      if (!dir || dir === 'tabla-periodica' || (solo && dir !== solo)) continue;
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
    if (!solo && probadas < 38) mal(`Modo práctica: solo se ha probado en ${probadas} herramientas`);
    if (fallos === antes) console.log(`  ✓ Modo práctica: ${ejercicios} ejercicios al azar en ${probadas} herramientas, corregidos bien y mal, con la solución y la vuelta a los datos de antes`);
  }
  {
    // prueba de humo común (pruebas/humo.js): cambiar un dato, guardarlo, recargar y verlo de vuelta, modo oscuro y móvil
    const antes = fallos, r = await require('./humo.js')(browser, { mal, solo });
    const total = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible)).length;
    if (!solo && r.probadas < total) mal(`Humo: solo se han probado ${r.probadas} de ${total} herramientas`);
    if (fallos === antes) console.log(`  ✓ Humo: ${r.probadas} herramientas guardan un dato cambiado y lo recuperan al recargar, en modo oscuro y a 390 px, sin errores de consola`);
  }
  // portada y páginas de asignatura: sin errores de consola y sin enlaces internos rotos
  const portal = solo ? [] : ['index.html', 'novedades/index.html', 'foro/index.html', 'fenomenos/index.html', ...Catalogo.asignaturas.map((a) => `${a.clave}/index.html`), 'electromagnetismo/magnetostatica/index.html', 'quimica/tabla-periodica/index.html', 'fisica/trabajo-y-energia/index.html', 'quimica/masa-molar/index.html', 'quimica/configuracion-electronica/index.html', 'electromagnetismo/condensadores/index.html', 'fisica/tiro-parabolico/index.html', 'quimica/disoluciones/index.html', 'fisica/calorimetria/index.html', 'electromagnetismo/induccion/index.html', 'matematicas/matrices/index.html', 'matematicas/sistemas/index.html', 'estadistica/distribuciones/index.html', 'circuitos/alterna/index.html', 'fisica/dinamica/index.html', 'circuitos/continua/index.html', 'fisica/solido-rigido/index.html', 'fisica/ondas/index.html', 'fisica/doppler/index.html', 'circuitos/resistencias/index.html', 'estadistica/regresion/index.html', 'matematicas/complejos/index.html', 'fisica/fluidos/index.html', 'quimica/ph/index.html', 'fisica/ciclos/index.html', 'matematicas/taylor/index.html', 'matematicas/fourier/index.html', 'matematicas/edos/index.html', 'quimica/cinetica/index.html', 'matematicas/campos/index.html', 'electromagnetismo/fuerza/index.html', 'circuitos/transitorios/index.html', 'estadistica/intervalos/index.html', 'electromagnetismo/ondas-em/index.html', 'fisica/interferencia/index.html', 'matematicas/laplace/index.html', 'matematicas/derivadas/index.html', 'fisica/gases/index.html', 'electromagnetismo/faraday/index.html'];
  const antes = fallos;
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
  if (!solo && fallos === antes) console.log(`  ✓ Portada, ${Catalogo.asignaturas.length} asignaturas y las herramientas sin errores de consola ni enlaces rotos`);
  await browser.close();
}

(args.includes('--sin-navegador') ? Promise.resolve() : navegador()).then(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fallos ? `\n✗ ${fallos} fallo(s)` : '\n✓ Todo correcto');
  process.exit(fallos ? 1 : 0);
}, (e) => { console.error(e); process.exit(1); });
