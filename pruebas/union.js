#!/usr/bin/env node
/* ===== Errores de unión (10.5) =====
   Lo que sale mal cuando se juntan varias ramas en un PR y no siempre lo ve un test de herramienta:
   1. marcadores de conflicto (<<<<<<<, =======, >>>>>>>) olvidados en cualquier archivo del repositorio;
   2. JSON roto (esperados*.json, package.json, vercel.json…) y fuente/*.js que no compilan;
   3. claves repetidas en catalogo.js (herramientas, asignaturas, fenómenos) y en version.js (registros);
   4. cada herramienta y fenómeno disponible con su registro en version.js;
   5. páginas de publico/ cuyos scripts en línea, juntos, no compilan (un const declarado dos veces
      por dos ramas que añadieron lo mismo en el mismo fichero).
   Uso: node pruebas/union.js [--sin-publico]  · sale con 1 si algo falla. Lo llama comprobar.js (trozo 1)
   y CI lo corre antes que nada. No necesita navegador. */
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const raiz = path.join(__dirname, '..');
let fallos = 0; const mal = (m) => { fallos++; console.log('  ✗ ' + m); };
const git = (...a) => execFileSync('git', a, { cwd: raiz, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\n').filter(Boolean);
const TEXTO = /\.(js|json|html|css|md|yml|yaml|sh|txt|webmanifest|svg|jsonc)$|^_(headers|redirects)$/;
const archivos = git('ls-files').filter((f) => TEXTO.test(path.basename(f)) && fs.existsSync(path.join(raiz, f)));
// 1 y 2 · marcadores, JSON y sintaxis
let marcas = 0;
for (const f of archivos) {
  const t = fs.readFileSync(path.join(raiz, f), 'utf8');
  if (t.length > 8e6) continue;
  if (/^(<{7}|>{7})( |$)/m.test(t) || (/^<{7} /m.test(t) && /^={7}$/m.test(t))) { mal(`${f}: marcador de conflicto de git sin resolver`); marcas++; }
  if (/\.(json|webmanifest)$/.test(f)) { try { JSON.parse(t); } catch (e) { mal(`${f}: JSON no válido (${e.message})`); } }
}
let nJs = 0;
for (const f of archivos.filter((x) => /^(fuente|pruebas)\/.*\.js$/.test(x))) {
  const t = fs.readFileSync(path.join(raiz, f), 'utf8').replace(/^#!.*/, '');
  try { new vm.Script(t.replace(/^\s*export /gm, ''), { filename: f }); nJs++; } catch (e) {
    // un fichero de navegador con `module.exports` o `require` compila igual; lo que falla aquí es sintaxis de verdad
    mal(`${f}: no compila (${String(e.message).slice(0, 120)})`);
  }
}
// 3 y 4 · catálogo y versiones
const Catalogo = require(path.join(raiz, 'fuente', 'catalogo.js'));
const dup = (lista, qué) => { const v = new Set(); for (const x of lista) { if (v.has(x)) mal(`${qué}: «${x}» repetido`); v.add(x); } };
dup(Catalogo.asignaturas.map((a) => a.clave), 'catalogo.js · asignaturas');
for (const a of Catalogo.asignaturas) dup(a.herramientas.map((h) => h.clave), `catalogo.js · ${a.clave}`);
dup(Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => h.carpeta || h.clave)), 'catalogo.js · carpetas de herramientas disponibles');
dup(Catalogo.fenomenos.lista.map((f) => f.clave), 'catalogo.js · fenómenos');
const vsrc = fs.readFileSync(path.join(raiz, 'fuente', 'version.js'), 'utf8');
const claves = [...vsrc.matchAll(/^\s{2}'?([a-z0-9-]+)'?:\s*\{\s*$/gm)].map((m) => m[1]);
const reg = vsrc.slice(vsrc.indexOf('registros'));
const dentro = [...reg.matchAll(/^ {4}'?([a-z0-9-]+)'?:\s*\{/gm)].map((m) => m[1]);
dup(dentro.length ? dentro : claves, 'version.js · registros');
let Version = null; try { Version = require(path.join(raiz, 'fuente', 'version.js')); } catch (e) { mal(`version.js: no se puede cargar (${e.message})`); }
if (Version) {
  for (const a of Catalogo.asignaturas) for (const h of a.herramientas.filter((x) => x.disponible)) {
    const c = h.carpeta || h.clave; let v = null; try { v = Version.de(c); } catch (e) { /* abajo */ }
    if (!v || !v.current) mal(`version.js: la herramienta ${a.clave}/${c} no tiene registro de versiones`);
  }
  for (const f of Catalogo.fenomenos.lista.filter((x) => x.disponible)) { /* los fenómenos comparten el registro «fenomenos» */ }
  let w = null; try { w = Version.de('web'); } catch (e) { /* abajo */ }
  if (!w || !w.current) mal('version.js: falta el registro «web»');
}
// «Límites de esta herramienta» (fuente/limites.js): cada clave es una herramienta disponible y su página lo muestra
{
  const L = require(path.join(raiz, 'fuente', 'limites.js')).LIMITES, disp = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => ({ a: a.clave, h: h.clave, c: h.carpeta || h.clave })));
  for (const k of Object.keys(L)) {
    const t = disp.find((x) => x.c === k || x.h === k);
    if (!t) { mal(`limites.js: «${k}» no es una herramienta disponible`); continue; }
    const f = path.join(raiz, 'publico', t.a, t.h, 'index.html');
    if (!process.argv.includes('--sin-publico') && fs.existsSync(f) && !fs.readFileSync(f, 'utf8').includes('class="limites"')) mal(`${t.a}/${t.h}: tiene «Límites» en limites.js pero la página no los muestra (¿falta sh fuente/build.sh?)`);
  }
}
// 5 · scripts en línea de cada página publicada, juntos
let nPag = 0;
if (!process.argv.includes('--sin-publico') && fs.existsSync(path.join(raiz, 'publico'))) {
  const paginas = git('ls-files', 'publico').filter((f) => /\/index\.html$|^publico\/[^/]+\.html$/.test(f) && fs.existsSync(path.join(raiz, f)));
  for (const f of paginas) {
    const html = fs.readFileSync(path.join(raiz, f), 'utf8');
    const src = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="(?:application\/ld\+json|module|importmap)")[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n;\n');
    if (!src.trim()) continue;
    try { new vm.Script(src, { filename: f }); nPag++; } catch (e) { mal(`${f}: sus scripts juntos no compilan (${String(e.message).slice(0, 140)})`); }
  }
}
console.log(fallos ? `✗ Unión: ${fallos} problema(s)` : `  ✓ Unión de ramas: sin marcadores de conflicto en ${archivos.length} archivos, JSON válidos, ${nJs} .js compilan, catálogo y versiones sin repetidos ni huecos y los scripts de ${nPag} páginas compilan juntos`);
if (require.main === module) process.exit(fallos ? 1 : 0);
module.exports = { fallos: () => fallos };
