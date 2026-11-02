/* ===== og.js · imagen para compartir el enlace (publico/og.png, 1200 × 630) =====
   Uso: node fuente/og.js   (necesita Playwright; ver CLAUDE.md). Lleva el nombre de la web (Catalogo.marca),
   el icono de fuente/icono.svg y el lema. Hay que volver a ejecutarlo si cambia el nombre o el icono. */
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const Catalogo = require('./catalogo.js'), [m1, m2] = Catalogo.marca;
const icono = fs.readFileSync(path.join(__dirname, 'icono.svg')).toString('base64');
const fuente = fs.readFileSync(path.join(__dirname, '..', 'publico', 'fuentes', 'stix-two-math.woff2')).toString('base64');
const html = `<style>@font-face{font-family:S;src:url(data:font/woff2;base64,${fuente})}
body{margin:0;width:1200px;height:630px;background:#101518;display:flex;align-items:center;gap:64px;padding-left:96px;box-sizing:border-box;font-family:'IBM Plex Sans','DejaVu Sans',sans-serif}
img{width:300px;height:300px}h1{font:600 150px S,'Liberation Serif',serif;color:#e8ecef;margin:0;line-height:1}h1 i{color:#4dbcb0}
p{font-size:34px;color:#9aa5ad;margin:22px 0 0;line-height:1.35;max-width:640px}</style>
<img src="data:image/svg+xml;base64,${icono}"><div><h1>${m1}<i>${m2}</i></h1><p>Simuladores y calculadoras de ciencias, paso a paso y gratis</p></div>`;
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(__dirname, '..', 'publico', 'og.png') }); await b.close();
})();
