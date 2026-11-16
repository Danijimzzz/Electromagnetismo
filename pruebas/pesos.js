#!/usr/bin/env node
/* =====================================================================
   F15.1 · Medir antes de tocar: cuánto pesa, por página, cada script incrustado y cuánto se repite entre páginas.
   Uso: node pruebas/pesos.js [--top N] [--json ruta]   (necesita publico/ al día: sh fuente/build.sh)
   Lee fuente/herramientas.js (la misma lista de scripts y el mismo recorte de comentarios que la página real).
   Tras TRV.10.15 los scripts de dos o más páginas van a publico/js/ (con huella en el nombre): «HTML» es lo que pesa la
   página sola y «1.ª visita» lo que baja un visitante nuevo (HTML + sus scripts externos); desde la segunda, solo el HTML.
   Da: peso total de publico/, páginas por encima de 250 KB, y por fichero cuántas páginas lo incrustan,
   cuánto pesa y cuánto de publico/ es solo repetición (peso × (páginas − 1)).
   ===================================================================== */
const fs = require('fs'), path = require('path');
const { lista, script, versionReducida, externos, ficherosDe } = require('../fuente/herramientas.js');
const raiz = path.join(__dirname, '..', 'publico'), LIMITE_PAGINA = 250 * 1024;
const args = process.argv.slice(2), opt = (n) => { const i = args.indexOf(n); return i < 0 ? null : args[i + 1]; };
const top = +(opt('--top') || 25);
const kb = (n) => (n / 1024).toFixed(1).padStart(8) + ' KB';

const fich = {}; // fichero → { peso, paginas: n }
const paginas = [];
for (const h of lista()) {
  const ficheros = ficherosDe(h), ext = externos();
  const f = path.join(raiz, h.asignatura, h.clave, 'index.html');
  if (!fs.existsSync(f)) continue;
  const total = fs.statSync(f).size;
  let scripts = Buffer.byteLength(versionReducida()), fuera = 0;
  for (const s of ficheros) {
    const peso = Buffer.byteLength(script(s)); scripts += peso;
    if (ext[s]) fuera += peso;
    (fich[s] = fich[s] || { peso, paginas: 0, externo: !!ext[s] }).paginas++;
  }
  paginas.push({ ruta: `${h.asignatura}/${h.clave}`, total, primera: total + fuera, scripts, resto: total - (scripts - fuera) });
}
const filas = Object.entries(fich).map(([f, d]) => ({ fichero: f, ...d, repetido: d.externo ? 0 : d.peso * (d.paginas - 1) })).sort((a, b) => b.repetido - a.repetido);
const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
let mb = 0; (function rec(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) e.isDirectory() ? rec(path.join(d, e.name)) : mb += fs.statSync(path.join(d, e.name)).size; })(raiz);

console.log(`publico/: ${(mb / 1048576).toFixed(2)} MB · ${paginas.length} páginas de herramienta · incrustados en ellas: ${(sum(paginas, 'scripts') / 1048576).toFixed(2)} MB`);
const grandes = paginas.filter((p) => p.primera > LIMITE_PAGINA).sort((a, b) => b.primera - a.primera);
console.log(`Páginas cuya primera visita pasa de 250 KB (HTML + scripts externos): ${grandes.length}; solo el HTML pasa: ${paginas.filter((p) => p.total > LIMITE_PAGINA).length}`);
for (const p of grandes.slice(0, top)) console.log(`  ${p.ruta.padEnd(40)} HTML ${kb(p.total)} · 1.ª visita ${kb(p.primera)}`);
console.log(`\nFicheros por páginas que los usan (repetido = peso × (páginas − 1) si siguen incrustados, 0 si ya son externos):`);
for (const r of filas.slice(0, top)) console.log(`  ${r.fichero.padEnd(36)} ${kb(r.peso)} en ${String(r.paginas).padStart(3)} pág. ${r.externo ? '· externo' : `→ repetido ${kb(r.repetido)}`}`);
console.log(`\nRepetición que queda incrustada: ${(sum(filas, 'repetido') / 1048576).toFixed(2)} MB`);
const j = opt('--json'); if (j) fs.writeFileSync(j, JSON.stringify({ mb, paginas, ficheros: filas }, null, 1));
