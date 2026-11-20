#!/usr/bin/env node
/* ===== Iconos de la web instalable (PWA) =====
   Rehace icono-192.png, icono-512.png, icono-maskable-512.png y apple-touch-icon.png (180) en esta carpeta a partir de
   ../icono.svg (marca general oscura) y ../icono-maskable.svg (a sangre y con el dibujo al 78 %, para que Android o iOS lo recorten a su gusto).
   portal.js los copia a publico/. Los SVG de fuente/icono.svg, fuente/icono-maskable.svg y fuente/iconos/<asignatura>.svg
   (el de cada asignatura, que va en la pestaña de sus páginas) son el diseño «Cf» (Figtree + ∫ sobre «Espacio»), con las letras ya
   convertidas en trazos: no dependen de ninguna fuente. Uso: node fuente/pwa/iconos.js   (necesita Playwright y Chromium) */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const leer = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const svg = leer('icono.svg'), maskable = leer('icono-maskable.svg');
(async () => {
  const exe = process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  for (const [f, n, s] of [['icono-192.png', 192, svg], ['icono-512.png', 512, svg], ['icono-maskable-512.png', 512, maskable], ['apple-touch-icon.png', 180, maskable]]) {
    const p = await b.newPage({ viewport: { width: n, height: n } });
    await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${n}px;height:${n}px}</style>${s}`);
    fs.writeFileSync(path.join(__dirname, f), await p.screenshot({ omitBackground: true }));
    await p.close();
  }
  await b.close();
  // los degradados pesan en PNG: se cuantizan a 256 colores con Pillow si está (de 300 KB a ~80 KB); si no, se dejan como salen
  try {
    require('child_process').execFileSync('python3', ['-c', `
import sys
from PIL import Image
for f in sys.argv[1:]:
    im = Image.open(f).convert('RGBA')
    opaco = im.getchannel('A').getextrema()[0] == 255
    q = (im.convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG) if opaco
         else im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG))
    q.save(f, optimize=True)
`, ...['icono-192.png', 'icono-512.png', 'icono-maskable-512.png', 'apple-touch-icon.png'].map((f) => path.join(__dirname, f))]);
  } catch (e) { console.log('Sin Pillow: PNG sin cuantizar'); }
})();
