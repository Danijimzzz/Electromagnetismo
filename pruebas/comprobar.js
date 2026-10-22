#!/usr/bin/env node
/* Comprobación antes de publicar o fusionar un cambio:
   1. regenera index.html con fuente/build.sh;
   2. resuelve los 12 ejercicios en Node y compara cada resultado con pruebas/esperados.json
      (la forma escrita del solucionario, no solo el valor);
   3. abre index.html en Chromium, repite el cálculo dentro de la página, abre cada ejercicio
      desde la barra lateral y la guía, y falla si hay errores en la consola.
   Uso: node pruebas/comprobar.js [--actualizar] [--sin-navegador]
   --actualizar reescribe esperados.json con los resultados actuales (solo si el cambio de forma es intencionado). */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const raiz = path.join(__dirname, '..'), fuente = path.join(raiz, 'fuente'), fEsperados = path.join(__dirname, 'esperados.json');
const args = process.argv.slice(2);
let fallos = 0;
const mal = (m) => { fallos++; console.log('  ✗ ' + m); };

console.log('1 · Compilando index.html');
execFileSync('sh', [path.join(fuente, 'build.sh')], { stdio: 'inherit' });
const pagina = path.join(raiz, 'index.html');
console.log(`  ✓ ${(fs.statSync(pagina).size / 1024).toFixed(0)} KB`);

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
  }
}

console.log('2 · Ejercicios del Tema 3 en Node');
for (const m of ['version', 'engine', 'fmt', 'physics', 'presets']) {
  const g = { version: 'Version', engine: 'Engine', fmt: 'Fmt', physics: 'Physics', presets: 'Presets' }[m];
  global[g] = require(path.join(fuente, m + '.js'));
}
const nodo = resolver(Physics, Presets);
if (args.includes('--actualizar') || !fs.existsSync(fEsperados)) {
  fs.writeFileSync(fEsperados, JSON.stringify(nodo, null, 1) + '\n');
  console.log(`  ✓ esperados.json reescrito con ${Object.keys(nodo).length} ejercicios`);
}
const esperados = JSON.parse(fs.readFileSync(fEsperados, 'utf8'));
const antes = fallos;
comparar(nodo, esperados, 'Node');
if (fallos === antes) console.log(`  ✓ ${Object.keys(esperados).length} ejercicios iguales al solucionario`);
console.log(`  · versión ${Version.current}`);

async function navegador() {
  console.log('3 · Página en Chromium');
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) {
    try { ({ chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'))); } catch (e2) { mal('no se encuentra playwright (npm i playwright)'); return; }
  }
  const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const consola = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
  await page.goto('file://' + pagina);
  await page.waitForSelector('#side-list .item');
  const enPagina = await page.evaluate(`(${resolver})(Physics, Presets)`);
  const antes = fallos;
  comparar(enPagina, esperados, 'Chromium');
  const ver = await page.locator('#ver .ver-n').textContent();
  if (ver !== Version.current) mal(`la página muestra la versión «${ver}», se esperaba ${Version.current}`);
  for (const e of Object.values(esperados)) {
    await page.locator('#side-list .item .it', { hasText: e.titulo }).first().click();
    await page.waitForTimeout(150);
    const err = await page.evaluate(() => { const x = document.querySelector('#errors'); return x && !x.hidden ? x.textContent : ''; });
    if (err) mal(`${e.titulo}: ${err}`);
    const warn = await page.locator('.warn').allTextContents();
    if (warn.length) mal(`${e.titulo}: ${warn.join(' · ')}`);
  }
  await page.click('#help');
  await page.waitForSelector('#guide[open]');
  const sinImg = await page.evaluate(() => [...document.querySelectorAll('#guide img[data-img]')].filter((i) => !i.src).length);
  if (sinImg) mal(`la guía tiene ${sinImg} capturas sin cargar`);
  await page.keyboard.press('Escape');
  await page.click('#ver');
  if (!(await page.locator('#ver-log li').count())) mal('el apartado Novedades está vacío');
  await browser.close();
  if (consola.length) mal('consola del navegador:\n      ' + consola.join('\n      '));
  if (fallos === antes) console.log('  ✓ mismos resultados, 12 ejercicios abiertos, guía y novedades sin errores de consola');
}

(args.includes('--sin-navegador') ? Promise.resolve() : navegador()).then(() => {
  console.log(fallos ? `\n✗ ${fallos} fallo(s)` : '\n✓ Todo correcto');
  process.exit(fallos ? 1 : 0);
}, (e) => { console.error(e); process.exit(1); });
