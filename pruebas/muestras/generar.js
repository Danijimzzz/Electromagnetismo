#!/usr/bin/env node
/* =====================================================================
   F15.5 · Genera las muestras de pruebas/muestras/: estados que guardó una versión ANTIGUA de cada herramienta.
   Uso: node pruebas/muestras/generar.js <carpeta con el publico/ de la versión vieja> <etiqueta> [--ejemplos N]
        p. ej.:  git worktree add /tmp/v110 dea93cf   (Web 1.10; publico/ está en el repositorio)
                 node pruebas/muestras/generar.js /tmp/v110/publico v1.10
   Abre cada herramienta de esa versión, elige sus primeros N ejemplos (2 por defecto) y guarda lo que la app deja en
   localStorage[guarda]. Escribe: <etiqueta>.json (por herramienta), <etiqueta>.copia.json (formato de «Copia de seguridad
   de todo») y <etiqueta>.simu.json (un ejercicio suelto en el formato de «Exportar», de la herramienta Derivadas).
   Esas muestras se commitean: pruebas/muestras.js las restaura en la versión actual.
   ===================================================================== */
const fs = require('fs'), path = require('path'), http = require('http');
const [, , viejo, etiqueta] = process.argv, nEj = +(process.argv.includes('--ejemplos') ? process.argv[process.argv.indexOf('--ejemplos') + 1] : 2);
if (!viejo || !etiqueta) { console.log('uso: node pruebas/muestras/generar.js <publico viejo> <etiqueta> [--ejemplos N]'); process.exit(1); }
const raiz = path.join(__dirname, '..', '..'), Catalogo = require(path.join(raiz, 'fuente', 'catalogo.js'));
const TIPOS = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', woff2: 'font/woff2', webmanifest: 'application/json' };
(async () => {
  const { chromium } = require('playwright');
  const srv = await new Promise((ok) => { const s = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(viejo, p); if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).slice(1)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(0, '127.0.0.1', () => ok(s)); });
  const base = `http://127.0.0.1:${srv.address().port}`;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
  const salida = { origen: etiqueta, generado: new Date().toISOString().slice(0, 10), herramientas: {} };
  for (const a of Catalogo.asignaturas) for (const h of a.herramientas.filter((x) => x.disponible && x.scripts)) {
    const f = path.join(viejo, a.clave, h.clave, 'index.html'); if (!fs.existsSync(f)) continue; // herramienta posterior a esa versión
    const m = fs.readFileSync(f, 'utf8').match(/Biblioteca\.monta\('([^']+)', '([^']+)'\)/); if (!m) continue;
    const [, carpeta, guarda] = m, ctx = await b.newContext(), p = await ctx.newPage(); await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    try {
      await p.goto(`${base}/${a.clave}/${h.clave}/`, { waitUntil: 'load' }); await p.waitForTimeout(300);
      const ejercicios = [];
      const ops = await p.$$eval('select#ejemplo, select[id^="ejemplo"]', (ss) => ss.flatMap((s, i) => [...s.options].filter((o) => o.value).map((o) => ({ i, v: o.value, t: o.textContent.trim() }))));
      for (const o of ops.slice(0, nEj)) {
        await p.evaluate(({ i, v }) => { const s = document.querySelectorAll('select#ejemplo, select[id^="ejemplo"]')[i]; s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, o);
        await p.waitForTimeout(250);
        const datos = await p.evaluate((k) => localStorage.getItem(k), guarda);
        if (datos && !ejercicios.some((e) => e.datos === datos)) ejercicios.push({ titulo: o.t.slice(0, 80), datos });
      }
      if (!ejercicios.length) { const datos = await p.evaluate((k) => localStorage.getItem(k), guarda); if (datos) ejercicios.push({ titulo: 'Estado inicial', datos }); }
      if (ejercicios.length) salida.herramientas[carpeta] = { asignatura: a.clave, clave: h.clave, guarda, ejercicios };
    } catch (e) { console.log(`  · ${a.clave}/${h.clave}: ${e.message.split('\n')[0]}`); }
    await ctx.close();
  }
  await b.close(); srv.close();
  const dir = __dirname, n = Object.values(salida.herramientas).reduce((s, x) => s + x.ejercicios.length, 0);
  fs.writeFileSync(path.join(dir, `${etiqueta}.json`), JSON.stringify(salida, null, 1) + '\n');
  // copia de seguridad global: igual que la que descarga «Copia de seguridad de todo»
  const copia = { formato: 'simulaciencia-copia', version: 1, guardado: salida.generado + 'T00:00:00.000Z', herramientas: Object.fromEntries(Object.entries(salida.herramientas).map(([c, x]) => [c, x.ejercicios.map((e, i) => ({ id: `${etiqueta}-${c}-${i}`, titulo: e.titulo, actualizado: 1700000000000, datos: e.datos }))])) };
  fs.writeFileSync(path.join(dir, `${etiqueta}.copia.json`), JSON.stringify(copia, null, 1) + '\n');
  // un ejercicio suelto, como el que exporta cada herramienta
  const d = salida.herramientas.derivadas; if (d) fs.writeFileSync(path.join(dir, `${etiqueta}.simu.json`), JSON.stringify({ formato: 'simulaciencia-ejercicios', version: 1, herramienta: 'derivadas', guardado: salida.generado + 'T00:00:00.000Z', ejercicios: d.ejercicios.map((e) => ({ titulo: e.titulo, datos: e.datos })) }, null, 1) + '\n');
  console.log(`${Object.keys(salida.herramientas).length} herramientas, ${n} estados guardados en pruebas/muestras/${etiqueta}*.json`);
})();
