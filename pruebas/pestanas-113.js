/* ===== Capturas de las pestañas nuevas de la 1.13 (TRV.10.21) =====
   Abre cada pestaña o modo y la captura en claro, oscuro y 390 px; avisa de desborde horizontal y de errores de la página.
   Uso: node pruebas/pestanas-113.js CARPETA_DE_CAPTURAS   (necesita publico/ compilado) */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const PUB = path.join(__dirname, '..', 'publico'), SAL = process.argv[2];
const CASOS = [['fisica/calorimetria', /dilataci/i], ['fisica/dinamica', /circular/i], ['electromagnetismo/induccion', /espiras/i], ['quimica/masa-molar', /emp[ií]rica/i], ['quimica/configuracion-electronica', /n[uú]meros cu[aá]nticos/i], ['quimica/configuracion-electronica', /qu[eé] elemento/i], ['fisica/doppler', /luz/i], ['circuitos/control', /escal[oó]n/i], ['circuitos/control', /bode/i], ['quimica/redox', /pilas/i], ['quimica/redox', /electr[oó]lisis/i], ['circuitos/simulador', /barrido/i], ['circuitos/simulador', /th[eé]venin/i]];
const TIPOS = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', png: 'image/png', woff2: 'font/woff2', webmanifest: 'application/json' };
(async () => {
  fs.mkdirSync(SAL, { recursive: true });
  const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(PUB, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TIPOS[f.split('.').pop()] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
  for (const [ruta, re] of CASOS) for (const [vista, opc] of [['claro', { viewport: { width: 1280, height: 900 }, colorScheme: 'light' }], ['oscuro', { viewport: { width: 1280, height: 900 }, colorScheme: 'dark' }], ['movil', { viewport: { width: 390, height: 844 }, colorScheme: 'light' }]]) {
    const ctx = await b.newContext(opc), p = await ctx.newPage(); await p.route(/google|doubleclick/, (r) => r.abort());
    const err = []; p.on('pageerror', (e) => err.push(e.message));
    await p.goto(`${base}/${ruta}/`, { waitUntil: 'load' }); await p.waitForTimeout(400);
    let como = '';
    const tab = p.getByRole('tab', { name: re }).first();
    if (await tab.count()) { await tab.click(); como = 'pestaña'; }
    else { const btn = p.locator('main button, main .tab, main [data-m], main [data-tab]').filter({ hasText: re }).first(); if (await btn.count()) { await btn.click(); como = 'botón'; } else { const sel = await p.evaluate((src) => { const r = new RegExp(src, 'i'); for (const s of document.querySelectorAll('main select')) for (const o of s.options) if (r.test(o.textContent)) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); return o.textContent; } return null; }, re.source); como = sel ? 'desplegable' : ''; } }
    await p.waitForTimeout(500);
    const ancho = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    const nombre = `${ruta.split('/')[1]}-${re.source.replace(/[^a-z]/gi, '').slice(0, 10)}-${vista}.png`;
    await p.screenshot({ path: path.join(SAL, nombre) });
    if (!como) console.log(`? ${ruta} ${re}: no encontré la pestaña`);
    if (ancho[0] > ancho[1] + 1) console.log(`✗ ${ruta} ${re} (${vista}): desborde ${ancho[0]} > ${ancho[1]}`);
    if (err.length) console.log(`✗ ${ruta} ${re} (${vista}): ${err.join(' | ')}`);
    await ctx.close();
  }
  await b.close(); srv.close(); console.log(`${CASOS.length} pestañas × 3 vistas en ${SAL}`);
})();
