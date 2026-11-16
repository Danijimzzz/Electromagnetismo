#!/usr/bin/env node
/* =====================================================================
   F15.5 · Copias de seguridad a prueba de versiones.
   Lo que un usuario guardó con una versión antigua (pruebas/muestras/<versión>.json, hecho con muestras/generar.js a
   partir del publico/ de esa versión) tiene que seguir abriéndose en la actual:
     1) cada estado guardado, escrito en localStorage[guarda], carga la herramienta sin errores y sin perder los datos
        (cada valor simple del estado viejo sigue igual tras arrancar la app; si un cambio renombra o quita un campo a
        propósito, se apunta en CAMBIOS con el motivo);
     2) «Restaurar copia» con el .copia.json antiguo suma todos los ejercicios (y no duplica al repetirlo);
     3) «Importar archivo» con el .simu.json antiguo lo deja en Mis ejercicios y abrirlo pone sus datos.
   Muestras nuevas: git worktree add /tmp/vX <commit>; node pruebas/muestras/generar.js /tmp/vX/publico vX.Y
   Uso: node pruebas/muestras.js [--solo CARPETA]   (necesita publico/ compilado y Playwright)
   ===================================================================== */
const fs = require('fs'), path = require('path'), http = require('http');
const raiz = path.join(__dirname, '..'), publico = path.join(raiz, 'publico'), dir = path.join(__dirname, 'muestras');
const solo = process.argv.includes('--solo') ? process.argv[process.argv.indexOf('--solo') + 1] : null;
// carpeta → { campo: motivo }: campos del estado viejo que la herramienta cambió a propósito
const CAMBIOS = {};
const TIPOS = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', woff2: 'font/woff2', webmanifest: 'application/json' };

// los valores simples (texto, número, booleano) de un estado, con su ruta: «sc.a», «filas.0.x»…
const simples = (v, ruta = '', salida = {}) => {
  if (v === null || v === undefined) return salida;
  if (typeof v === 'object') { for (const [k, x] of Object.entries(v)) simples(x, ruta ? `${ruta}.${k}` : k, salida); return salida; }
  salida[ruta] = v; return salida;
};

async function comprueba({ browser, base, aviso }) {
  let fallos = 0, probados = 0;
  const mal = (m) => { fallos++; if (aviso) aviso(m); else console.log('  ✗ ' + m); };
  const etiquetas = fs.readdirSync(dir).filter((f) => /^v[\d.]+\.json$/.test(f)).map((f) => f.slice(0, -5));
  for (const et of etiquetas) {
    const M = JSON.parse(fs.readFileSync(path.join(dir, `${et}.json`), 'utf8'));
    // 1) cada estado guardado abre y se conserva
    for (const [carpeta, x] of Object.entries(M.herramientas)) {
      if (solo && solo !== carpeta) continue;
      if (!fs.existsSync(path.join(publico, x.asignatura, x.clave, 'index.html'))) { mal(`${et}: ${x.asignatura}/${x.clave} ya no existe (¿falta una redirección?)`); continue; }
      for (const e of x.ejercicios) {
        const ctx = await browser.newContext(), p = await ctx.newPage(), errs = [];
        await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
        p.on('pageerror', (er) => errs.push(er.message)); p.on('console', (c) => { if (c.type() === 'error' && !/Failed to load resource|net::ERR/.test(c.text())) errs.push(c.text()); });
        await p.addInitScript(([k, v]) => { if (!sessionStorage.getItem('muestra')) { sessionStorage.setItem('muestra', '1'); localStorage.setItem(k, v); } }, [x.guarda, e.datos]);
        await p.goto(`${base}/${x.asignatura}/${x.clave}/`, { waitUntil: 'load' }); await p.waitForTimeout(500);
        const ahora = await p.evaluate((k) => localStorage.getItem(k), x.guarda);
        probados++;
        if (errs.length) mal(`${et} · ${carpeta} «${e.titulo}»: errores al abrir el estado viejo: ${errs[0].slice(0, 160)}`);
        else if (!ahora) mal(`${et} · ${carpeta} «${e.titulo}»: la app borró el estado guardado`);
        else {
          let viejo, nuevo; try { viejo = simples(JSON.parse(e.datos)); nuevo = simples(JSON.parse(ahora)); } catch (er) { mal(`${et} · ${carpeta}: el estado no es JSON`); await ctx.close(); continue; }
          const perdidos = Object.keys(viejo).filter((k) => !(CAMBIOS[carpeta] || {})[k.split('.')[0]] && !(CAMBIOS[carpeta] || {})[k] && String(nuevo[k]) !== String(viejo[k]));
          if (perdidos.length) mal(`${et} · ${carpeta} «${e.titulo}»: ${perdidos.length} dato(s) cambian al abrirlo (${perdidos.slice(0, 3).map((k) => `${k}: ${JSON.stringify(viejo[k])} → ${JSON.stringify(nuevo[k])}`).join('; ')})`);
        }
        await ctx.close();
      }
    }
    if (solo) continue;
    // 2) restaurar la copia de seguridad antigua (en una herramienta cualquiera) y repetirla
    const copia = JSON.parse(fs.readFileSync(path.join(dir, `${et}.copia.json`), 'utf8')), total = Object.values(copia.herramientas).reduce((s, l) => s + l.length, 0);
    const ctx = await browser.newContext(), p = await ctx.newPage(); await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    await p.goto(`${base}/fisica/tiro-parabolico/`, { waitUntil: 'load' });
    const cuenta = () => p.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('simu-ejercicios:')).reduce((s, k) => s + (JSON.parse(localStorage[k]).items || []).length, 0));
    const antes = await cuenta();
    const importa = async () => { await p.setInputFiles('input[type=file]', { name: `${et}.copia.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(copia)) }); await p.waitForTimeout(600); };
    await importa();
    const tras = await cuenta(); probados++;
    if (tras - antes !== total) mal(`${et}: «Restaurar copia» sumó ${tras - antes} de ${total} ejercicios`);
    await importa(); if ((await cuenta()) !== tras) mal(`${et}: restaurar dos veces la misma copia duplica ejercicios`);
    // lo restaurado sirve: cada herramienta tiene en su biblioteca justo lo que traía la copia
    const guardados = await p.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('simu-ejercicios:')).map((k) => [k.slice(16), JSON.parse(localStorage[k]).items.map((i) => i.datos)])));
    for (const [c, l] of Object.entries(copia.herramientas)) if (JSON.stringify((guardados[c] || []).slice(-l.length)) !== JSON.stringify(l.map((e) => e.datos))) mal(`${et}: lo restaurado de ${c} no coincide con la copia`);
    await ctx.close();
    // 3) importar un .simu.json antiguo y abrir el ejercicio
    const sf = path.join(dir, `${et}.simu.json`);
    if (fs.existsSync(sf)) {
      const simu = JSON.parse(fs.readFileSync(sf, 'utf8')), ctx2 = await browser.newContext(), q = await ctx2.newPage(); await q.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
      const x = Object.values(M.herramientas).find((h) => h.clave === simu.herramienta || h.guarda === `${simu.herramienta}-v1`);
      await q.goto(`${base}/${x.asignatura}/${x.clave}/`, { waitUntil: 'load' }); probados++;
      await q.setInputFiles('input[type=file]', { name: `${et}.simu.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(simu)) }); await q.waitForTimeout(500);
      const items = await q.evaluate((c) => (JSON.parse(localStorage['simu-ejercicios:' + c] || '{"items":[]}')).items.map((i) => i.datos), simu.herramienta);
      if (items.length !== simu.ejercicios.length || items[0] !== simu.ejercicios[0].datos) mal(`${et}: importar el .simu.json no deja sus ejercicios en Mis ejercicios`);
      else {
        await Promise.all([q.waitForEvent('load'), q.evaluate((t) => [...document.querySelectorAll('.bib-it .bib-abre')].find((b) => b.textContent.trim() === t).click(), simu.ejercicios[0].titulo)]); await q.waitForTimeout(400);
        const ahora = await q.evaluate((k) => localStorage.getItem(k), x.guarda);
        if (!ahora || JSON.stringify(simples(JSON.parse(ahora))) !== JSON.stringify(simples(JSON.parse(items[0])))) { const v = simples(JSON.parse(items[0])), n = simples(JSON.parse(ahora || '{}')); if (Object.keys(v).some((k) => String(n[k]) !== String(v[k]))) mal(`${et}: abrir el ejercicio importado no pone sus datos`); }
      }
      await ctx2.close();
    }
  }
  return { fallos, probados };
}

// arranca su servidor sobre publico/ y devuelve { fallos, probados }; `mal` (opcional) recibe cada fallo (comprobar.js)
async function muestras(browser, { mal: aviso } = {}) {
  const srv = await new Promise((ok) => { const s = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(publico, p); if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).slice(1)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(0, '127.0.0.1', () => ok(s)); });
  try { return await comprueba({ browser, base: `http://127.0.0.1:${srv.address().port}`, aviso }); } finally { srv.close(); }
}
async function principal() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
  try {
    const r = await muestras(browser);
    console.log(r.fallos ? `✗ Muestras de versiones antiguas: ${r.fallos} problema(s) en ${r.probados} comprobaciones` : `  ✓ Muestras de versiones antiguas: ${r.probados} estados, copia y archivo restaurados sin pérdidas`);
    return r.fallos === 0;
  } finally { await browser.close(); }
}
module.exports = muestras;
if (require.main === module) principal().then((ok) => process.exit(ok ? 0 : 1));
