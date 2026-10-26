#!/usr/bin/env node
/* Rehace la imagen de la tarjeta de cada fenómeno disponible (fuente/fenomenos/<clave>/imagen.webp) que se ve en el
   índice /fenomenos/: abre su página de publico/, va al paso «imagen» de catalogo.js con el movimiento reducido (así
   la foto sale siempre igual) y sin rótulos, y recorta el centro de la animación a 16:9, 640 × 360 px.
   Uso: node pruebas/imagenes-fenomenos.js [clave] && sh fuente/build.sh   (necesita playwright y python3 con Pillow) */
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const raiz = path.join(__dirname, '..'), fuente = path.join(raiz, 'fuente');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'))); }
const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
const Catalogo = require(path.join(fuente, 'catalogo.js')), solo = process.argv[2];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'imagenes-'));

// png → webp de 640 × 360 recortando el centro a 16:9
function webp(png, salida) {
  execFileSync('python3', ['-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); w, h = im.size
if w * 9 > h * 16: a = h * 16 // 9; im = im.crop(((w - a) // 2, 0, (w - a) // 2 + a, h))
else: a = w * 9 // 16; im = im.crop((0, (h - a) // 2, w, (h - a) // 2 + a))
im.resize((640, 360), Image.LANCZOS).save(sys.argv[2], 'WEBP', quality=80, method=6)`, png, salida]);
}

(async () => {
  execFileSync('sh', [path.join(fuente, 'build.sh')]);
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce', colorScheme: 'light' });
  await page.addInitScript(() => { window.FenomenoFoto = true; });
  for (const f of Catalogo.fenomenos.lista.filter((x) => x.disponible && (!solo || x.clave === solo))) {
    if (!f.imagen) { console.log(`  ✗ ${f.clave}: falta «imagen» (el paso que se fotografía) en catalogo.js`); process.exitCode = 1; continue; }
    await page.goto('file://' + path.join(raiz, 'publico', 'fenomenos', f.clave, 'index.html'));
    await page.waitForFunction(() => window.FenomenoApp);
    await page.evaluate((i) => FenomenoApp.ve(i), f.imagen - 1);
    await page.waitForTimeout(500);
    const png = path.join(tmp, f.clave + '.png');
    await page.locator('#escena').screenshot({ path: png });
    webp(png, path.join(fuente, 'fenomenos', f.clave, 'imagen.webp'));
    console.log(`  ✓ fenomenos/${f.clave}/imagen.webp (paso ${f.imagen})`);
  }
  await browser.close();
})();
