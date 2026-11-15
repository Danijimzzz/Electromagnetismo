/* ===== Coherencia de diseño (TRV.10.21) =====
   Captura las herramientas de las fases 8 y 9 en claro, oscuro y 390 px y comprueba reglas de DISENO.md que se
   miden sin ojos: sin desborde horizontal, campos con etiqueta, gráficas con aria-label, colores fijos fuera de
   variables en el CSS propio, y que .layout/.card/section.teoria estén. Uso: node pruebas/coherencia-diseno.js [carpeta de capturas]
   (necesita publico/ compilado). Manual: no entra en comprobar.js. */
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const Catalogo = require('../fuente/catalogo.js');
const HERR = ['osc-acopladas', 'relatividad', 'solubilidad', 'series', 'lagrange', 'anova', 'regresion-multiple', 'no-parametricos', 'solow', 'bonos', 'black-scholes', 'transformada-z', 'control', 'semiconductores', 'cavidades', 'termo-estadistica', 'organica', 'markowitz'];
const RAIZ = path.join(__dirname, '..'), PUB = path.join(RAIZ, 'publico'), SAL = process.argv[2];
const asig = (c) => Catalogo.asignaturas.find((a) => a.herramientas.some((h) => h.clave === c)).clave;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/json' };
(async () => {
  const srv = http.createServer((q, r) => { let f = path.join(PUB, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
  const avisos = [];
  for (const c of HERR) {
    const url = `${base}/${asig(c)}/${c}/`;
    const fuente = fs.readFileSync(path.join(RAIZ, 'fuente', c, 'pagina.html'), 'utf8');
    const css = (fuente.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];
    const raiz = (css.match(/:root\s*\{[^}]*\}/g) || []).join('') + (css.match(/@media[^{]*dark[^{]*\{[\s\S]*?\}\s*\}/g) || []).join('');
    const fuera = css.replace(/:root\s*\{[^}]*\}/g, '').replace(/@media[^{]*dark[^{]*\{[\s\S]*?\}\s*\}/g, '').replace(/:root\[data-theme[^{]*\{[^}]*\}/g, '');
    const fijos = [...new Set((fuera.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) || []))].filter((x) => !/^#(0{3,6}|f{3,6})$/i.test(x) && !/rgba?\(\s*0\s*,\s*0\s*,\s*0/.test(x));
    if (fijos.length) avisos.push(`${c}: colores fijos fuera de :root → ${fijos.slice(0, 6).join(' ')}`);
    for (const [vista, opc] of [['claro', { viewport: { width: 1280, height: 900 }, colorScheme: 'light' }], ['oscuro', { viewport: { width: 1280, height: 900 }, colorScheme: 'dark' }], ['movil', { viewport: { width: 390, height: 844 }, colorScheme: 'light' }]]) {
      const ctx = await b.newContext(opc), p = await ctx.newPage(); await p.route(/google|doubleclick/, (r) => r.abort());
      await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(500);
      const r = await p.evaluate(() => {
        const out = { ancho: document.documentElement.scrollWidth, vp: innerWidth, sinEtiqueta: [], graficaSinAria: [], falta: [] };
        for (const e of document.querySelectorAll('main input:not([type=hidden]):not([type=checkbox]):not([type=radio]), main select, main textarea')) if (!e.labels?.length && !e.getAttribute('aria-label') && !e.closest('label') && !e.getAttribute('aria-labelledby')) out.sinEtiqueta.push(e.id || e.name || e.tagName);
        for (const e of document.querySelectorAll('main canvas, main svg[id]')) if (!e.getAttribute('aria-label') && !e.getAttribute('aria-hidden') && !e.getAttribute('aria-labelledby') && e.getBoundingClientRect().width > 120) out.graficaSinAria.push(e.id || e.tagName);
        for (const s of ['main.wrap h1', '.lead', '.layout', '.layout .card', 'section.teoria', 'footer #ver']) if (!document.querySelector(s)) out.falta.push(s);
        return out;
      });
      if (r.ancho > r.vp + 1) avisos.push(`${c} (${vista}): desborde horizontal ${r.ancho} > ${r.vp}`);
      if (vista === 'claro') { if (r.sinEtiqueta.length) avisos.push(`${c}: campos sin etiqueta → ${r.sinEtiqueta.join(', ')}`); if (r.graficaSinAria.length) avisos.push(`${c}: gráficas sin aria-label → ${r.graficaSinAria.join(', ')}`); if (r.falta.length) avisos.push(`${c}: falta ${r.falta.join(', ')}`); }
      if (SAL) { fs.mkdirSync(SAL, { recursive: true }); await p.screenshot({ path: path.join(SAL, `${c}-${vista}.png`), fullPage: false }); }
      await ctx.close();
    }
  }
  await b.close(); srv.close();
  console.log(avisos.length ? avisos.join('\n') : '✓ sin desvíos'); console.log(`${HERR.length} herramientas × 3 vistas`);
})();
