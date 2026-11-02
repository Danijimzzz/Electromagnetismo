#!/usr/bin/env node
/* ===== Comprobación de la web instalable y sin conexión (PWA) =====
   Sirve publico/ en un servidor local (http://localhost: con file:// no hay service worker) y comprueba:
   el manifiesto y sus iconos, que todas las direcciones de sw.js existen, que se instala, que sin red
   funcionan las páginas ya visitadas y las que dejó «Guardar todo» (y las demás enseñan offline.html),
   que con red llega siempre la página nueva (nada de versiones viejas pegadas) y que una versión nueva
   del service worker avisa, se aplica al pulsar Actualizar, borra la caché vieja y rehace «Guardar todo».
   Uso: node pruebas/pwa.js   (comprobar.js la llama con su navegador; necesita publico/ compilado) */
const fs = require('fs'), path = require('path'), http = require('http');
const publico = path.join(__dirname, '..', 'publico'), fuente = path.join(__dirname, '..', 'fuente');
const TIPOS = { html: 'text/html; charset=utf-8', js: 'text/javascript', json: 'application/json', webmanifest: 'application/manifest+json', css: 'text/css', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', woff2: 'font/woff2', txt: 'text/plain', xml: 'application/xml' };

function servidor(estado) {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x'); let p = decodeURIComponent(u.pathname);
      estado.peticiones.push(p);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(publico, p);
      if (!f.startsWith(publico) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no existe'); }
      let cuerpo = fs.readFileSync(f);
      const ext = f.split('.').pop();
      if (estado.titulo && p === '/index.html') cuerpo = Buffer.from(cuerpo.toString().replace(/<title>[^<]*/, '<title>' + estado.titulo));
      if (estado.v2 && p === '/sw.js') cuerpo = Buffer.from(cuerpo.toString().replace("'ciencify-", "'ciencify-v2-") + '\n// versión 2\n');
      res.writeHead(200, { 'Content-Type': TIPOS[ext] || 'application/octet-stream', 'Cache-Control': p === '/sw.js' ? 'no-cache' : 'max-age=3600' });
      res.end(cuerpo);
    }).listen(0, '127.0.0.1', () => ok(s));
  });
}

async function pwa(browser, { mal } = {}) {
  mal = mal || ((m) => { console.log('  ✗ ' + m); process.exitCode = 1; });
  const antes = process.exitCode;
  // 1) manifiesto e iconos
  const m = JSON.parse(fs.readFileSync(path.join(publico, 'manifest.webmanifest'), 'utf8'));
  if (m.display !== 'standalone' || !m.name || !m.start_url || m.lang !== 'es') mal('manifiesto: faltan name, start_url, display standalone o lang es');
  if (!m.icons.some((i) => i.sizes === '192x192') || !m.icons.some((i) => i.sizes === '512x512' && i.purpose === 'any') || !m.icons.some((i) => i.purpose === 'maskable')) mal('manifiesto: faltan iconos de 192, 512 o maskable');
  for (const i of m.icons) {
    const f = path.join(publico, i.src), n = parseInt(i.sizes, 10);
    if (!fs.existsSync(f)) { mal(`manifiesto: no existe ${i.src}`); continue; }
    const b = fs.readFileSync(f); if (b.readUInt32BE(16) !== n || b.readUInt32BE(20) !== n) mal(`manifiesto: ${i.src} no mide ${i.sizes}`);
  }
  // 2) todas las direcciones del service worker existen y las páginas enganchan manifiesto y registro
  const swTxt = fs.readFileSync(path.join(publico, 'sw.js'), 'utf8');
  const lista = (nombre) => JSON.parse(swTxt.match(new RegExp('const ' + nombre + ' = (\\[.*\\]);'))[1]);
  const nucleo = lista('NUCLEO'), todas = lista('TODAS');
  const existe = (u) => { const p = path.join(publico, u); return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, 'index.html'))); };
  for (const u of [...nucleo, ...todas]) if (!existe(u)) mal(`sw.js: «${u}» no existe en publico/`);
  const Catalogo = require(path.join(fuente, 'catalogo.js'));
  const nTot = Catalogo.asignaturas.reduce((n, a) => n + a.herramientas.filter((h) => h.disponible).length, 0) + Catalogo.fenomenos.lista.filter((f) => f.disponible).length;
  if (todas.filter((u) => u.endsWith('/')).length < nTot) mal('sw.js: «Guardar todo» no incluye todas las herramientas y fenómenos');
  for (const p of ['index.html', 'fisica/tiro-parabolico/index.html', 'electromagnetismo/electrostatica/index.html', 'fenomenos/rayo/index.html'])
    if (fs.existsSync(path.join(publico, p)) && !/rel="manifest"/.test(fs.readFileSync(path.join(publico, p), 'utf8'))) mal(`${p}: no enlaza el manifiesto`);

  // 3) en el navegador
  const estado = { peticiones: [], titulo: '', v2: false }, srv = await servidor(estado), base = 'http://127.0.0.1:' + srv.address().port;
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } }), errs = [];
  const nueva = async () => { const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (c) => { if (c.type() === 'error' && !/Failed to load resource|net::ERR/.test(c.text())) errs.push(c.text()); }); return p; };
  try {
    const p = await nueva();
    await p.goto(base + '/');
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.waitForFunction(() => caches.keys().then((k) => k.length > 0));
    // la caché se crea antes de terminar de guardar el núcleo: esperar a que esté offline.html y la portada
    await p.waitForFunction(() => caches.match('offline.html').then((r) => !!r).then(async (ok) => ok && !!(await caches.match('./'))), null, { timeout: 30000 });
    await p.reload(); // ya lo controla el service worker
    if (!(await p.evaluate(() => !!navigator.serviceWorker.controller))) mal('el service worker no controla la página tras instalarse');
    // la portada enseña la franja de instalar y guardar
    if (!(await p.locator('#pwa-barra:visible #pwa-todo').count())) mal('la portada no muestra «Guardar todo para usar sin conexión»');
    // visitar una herramienta con red y luego sin red
    await p.goto(base + '/fisica/tiro-parabolico/'); await p.waitForSelector('h1');
    await ctx.setOffline(true);
    await p.reload(); await p.waitForSelector('h1');
    if (!/Tiro/i.test(await p.locator('h1').innerText())) mal('sin conexión: la herramienta ya visitada no carga desde la caché');
    await p.goto(base + '/'); if (!(await p.locator('#buscar').count())) mal('sin conexión: la portada no carga');
    await p.goto(base + '/?q=hola'); if (!(await p.locator('#buscar').count())) mal('sin conexión: la portada con ?q= no carga');
    // una herramienta nunca visitada y sin «guardar todo»: página sin conexión
    await p.goto(base + '/quimica/ph/');
    if (!/Sin conexión/.test(await p.locator('h1').innerText())) mal('sin conexión: una página no guardada debería enseñar offline.html');
    await ctx.setOffline(false);
    // con red llega la página nueva, no la guardada
    estado.titulo = 'Titulo NUEVO de prueba';
    await p.goto(base + '/'); if (!/NUEVO/.test(await p.title())) mal('con conexión: la portada sale de la caché vieja en vez de la red');
    // la copia nueva se guarda en segundo plano: esperar a que esté antes de cortar la red
    await p.waitForFunction(async () => { const r = await caches.match(location.href); return !!r && /NUEVO/.test(await r.clone().text()); }, null, { timeout: 30000 });
    estado.titulo = '';
    // sin red vale la última copia que se guardó (la nueva)
    await ctx.setOffline(true); await p.goto(base + '/'); if (!/NUEVO/.test(await p.title())) mal('sin conexión: no sale la última copia guardada de la portada');
    await ctx.setOffline(false);
    // guardar todo
    await p.goto(base + '/'); await p.waitForSelector('#pwa-todo:visible');
    await p.click('#pwa-todo');
    await p.waitForFunction(() => /Todo guardado/.test(document.getElementById('pwa-estado').textContent), null, { timeout: 90000 }).catch(() => mal('«Guardar todo» no termina ("' + '")'));
    await ctx.setOffline(true);
    for (const u of ['/quimica/ph/', '/fenomenos/rayo/', '/electromagnetismo/electrostatica/']) {
      await p.goto(base + u); const t = await p.locator('h1').first().innerText().catch(() => '');
      if (/Sin conexión/.test(t) || !t) mal(`sin conexión tras «Guardar todo»: ${u} no carga`);
    }
    await ctx.setOffline(false);
    // 4) versión nueva del service worker: avisa, se aplica al pulsar, borra la caché vieja y rehace «guardar todo»
    estado.v2 = true;
    await p.goto(base + '/');
    await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
    await p.waitForSelector('.pwa-aviso', { timeout: 15000 }).catch(() => mal('una versión nueva del service worker no avisa'));
    if (await p.locator('.pwa-aviso').count()) {
      await Promise.all([p.waitForEvent('load'), p.click('.pwa-aviso .si')]);
      await p.waitForFunction(() => caches.keys().then((k) => k.length === 1 && /ciencify-v2-/.test(k[0])), null, { timeout: 15000 }).catch(async () => mal('tras actualizar quedan cachés: ' + (await p.evaluate(() => caches.keys())).join(', ')));
      await p.waitForFunction(() => caches.keys().then(async (k) => !!(await (await caches.open(k[0])).match(new URL('guardado-todo', location.origin + '/')))), null, { timeout: 90000 }).catch(() => mal('tras actualizar no se rehace «Guardar todo» sola'));
    }
    if (errs.length) mal('consola del navegador:\n      ' + errs.join('\n      '));
  } finally { await ctx.close(); srv.close(); }
  return { ok: process.exitCode === antes };
}
module.exports = pwa;

if (require.main === module) {
  (async () => {
    const { chromium } = require('playwright'), exe = process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
    const browser = require('./sin-anuncios.js')(await chromium.launch(exe ? { executablePath: exe } : {}));
    const r = await pwa(browser); await browser.close();
    console.log(r.ok ? '  ✓ PWA: manifiesto, instalación, sin conexión y actualización' : '  ✗ PWA con fallos');
  })();
}
