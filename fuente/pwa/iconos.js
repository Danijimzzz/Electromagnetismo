#!/usr/bin/env node
/* ===== Iconos de la web instalable (PWA) =====
   Rehace icono-192.png, icono-512.png y icono-maskable-512.png en esta carpeta a partir de ../icono.svg
   (portal.js los copia a publico/). Maskable = icono al 70 % sobre fondo liso, para que Android lo recorte a su gusto.
   Uso: node fuente/pwa/iconos.js   (necesita Playwright y Chromium) */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const svg = fs.readFileSync(path.join(__dirname, '..', 'icono.svg'), 'utf8');
const dentro = svg.replace(/<svg[^>]*>/, '').replace('</svg>', '').replace(/<rect [^>]*\/>/, '');
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0d6b66"/><g transform="translate(9.6 9.6) scale(.7)">${dentro}</g></svg>`;
(async () => {
  const exe = process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  for (const [f, n, s] of [['icono-192.png', 192, svg], ['icono-512.png', 512, svg], ['icono-maskable-512.png', 512, maskable]]) {
    const p = await b.newPage({ viewport: { width: n, height: n } });
    await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${n}px;height:${n}px}</style>${s}`);
    fs.writeFileSync(path.join(__dirname, f), await p.screenshot({ omitBackground: true }));
    await p.close();
  }
  await b.close();
})();
