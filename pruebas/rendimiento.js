#!/usr/bin/env node
/* =====================================================================
   F15.3 · Presupuesto de rendimiento en móvil: portada, una asignatura y tres herramientas (las de más peso de cada tipo).
   Chromium con pantalla de 390 px, CPU 4× más lenta y servidor local sin compresión. De cada página se mide, en la
   mediana de 3 cargas en frío:
     · bytes: lo que baja (HTML + scripts + imágenes) — determinista, el límite es ajustado (+10 %)
     · interactiva: ms hasta que termina de cargar y la página responde (DOMContentLoaded + los scripts ejecutados + dos fotogramas)
       — depende de la máquina, así que el límite es holgado (×2,5 sobre lo medido al fijarlo) y solo avisa de empeoramientos grandes
   Los límites están en pruebas/presupuesto-rendimiento.json; `--fijar` los rehace con lo de ahora (solo a propósito).
   Uso: node pruebas/rendimiento.js [--fijar]   (necesita publico/ compilado y Playwright)
   ===================================================================== */
const fs = require('fs'), path = require('path'), http = require('http');
const publico = path.join(__dirname, '..', 'publico'), ficheroPresupuesto = path.join(__dirname, 'presupuesto-rendimiento.json');
const PAGINAS = ['/', '/matematicas/', '/matematicas/campos/', '/quimica/disoluciones/', '/fisica/tiro-parabolico/'];
const TIPOS = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', woff2: 'font/woff2', webmanifest: 'application/json' };
const mediana = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];

async function rendimiento(browser, { mal = (m) => { console.log('  ✗ ' + m); process.exitCode = 1; }, fijar = process.argv.includes('--fijar') } = {}) {
  const srv = await new Promise((ok) => { const s = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(publico, p); if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f).slice(1)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(0, '127.0.0.1', () => ok(s)); });
  const base = `http://127.0.0.1:${srv.address().port}`, medidas = {};
  try {
    for (const url of PAGINAS) {
      const bytes = [], ms = [];
      for (let i = 0; i < 3; i++) {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true }), p = await ctx.newPage();
        await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort()); // sin anuncios ni tipografías de fuera
        const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await cdp.send('Network.enable');
        let n = 0; cdp.on('Network.loadingFinished', (e) => { n += e.encodedDataLength; });
        await p.goto(base + url, { waitUntil: 'load' });
        await p.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
        ms.push(await p.evaluate(() => Math.round(performance.now()))); bytes.push(n);
        await ctx.close();
      }
      medidas[url] = { kb: Math.round(mediana(bytes) / 1024), ms: mediana(ms) };
    }
  } finally { srv.close(); }
  if (fijar || !fs.existsSync(ficheroPresupuesto)) {
    fs.writeFileSync(ficheroPresupuesto, JSON.stringify(Object.fromEntries(Object.entries(medidas).map(([u, m]) => [u, { kb: Math.ceil(m.kb * 1.1), ms: Math.ceil(m.ms * 2.5 / 100) * 100 }])), null, 1) + '\n');
    console.log('  · pruebas/presupuesto-rendimiento.json rehecho con lo de ahora');
  }
  const tope = JSON.parse(fs.readFileSync(ficheroPresupuesto, 'utf8')); let ok = true;
  for (const [u, m] of Object.entries(medidas)) {
    const t = tope[u]; if (!t) { mal(`rendimiento: ${u} no tiene presupuesto (--fijar)`); ok = false; continue; }
    if (m.kb > t.kb) { mal(`rendimiento: ${u} baja ${m.kb} KB y el presupuesto son ${t.kb} KB`); ok = false; }
    if (m.ms > t.ms) { mal(`rendimiento: ${u} tarda ${m.ms} ms en estar lista (CPU 4× más lenta) y el presupuesto son ${t.ms} ms`); ok = false; }
  }
  console.log(`  ${ok ? '✓' : '✗'} Rendimiento en móvil: ${Object.entries(medidas).map(([u, m]) => `${u} ${m.kb} KB / ${m.ms} ms`).join(' · ')}`);
  return { ok, medidas };
}
module.exports = rendimiento;
if (require.main === module) {
  (async () => {
    const { chromium } = require('playwright');
    const b = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
    try { const r = await rendimiento(b); process.exit(r.ok ? 0 : 1); } finally { await b.close(); }
  })();
}
