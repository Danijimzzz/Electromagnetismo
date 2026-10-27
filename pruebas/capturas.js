#!/usr/bin/env node
/* Regenera las capturas de la guía de uso (fuente/guia/*.webp) a partir de publico/index.html,
   con los ejercicios de ejemplo. editar.webp se hace a mano y no se toca.
   Uso: node pruebas/capturas.js && sh fuente/build.sh   (necesita playwright y python3 con Pillow) */
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const raiz = path.join(__dirname, '..'), guia = path.join(raiz, 'fuente', 'guia');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'))); }
const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'capturas-'));

// png → webp, con un ancho máximo
function webp(png, nombre, ancho) {
  execFileSync('python3', ['-c', `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB'); w = int(sys.argv[3])
if im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
im.save(sys.argv[2], 'WEBP', quality=82, method=6)`, png, path.join(guia, nombre + '.webp'), String(ancho)]);
  console.log('  ✓ ' + nombre + '.webp');
}

(async () => {
  execFileSync('sh', [path.join(raiz, 'fuente', 'build.sh')]);
  const browser = require('./sin-anuncios.js')(await chromium.launch(exe ? { executablePath: exe } : {}));
  const page = await browser.newPage({ viewport: { width: 1300, height: 836 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(raiz, 'publico', 'index.html'));
  // biblioteca de ejemplo para la barra lateral: tres problemas propios, dos en una carpeta
  await page.evaluate(() => {
    const it = (key, folder, tags) => { const p = Presets.list.find((x) => x.key === key); return { id: 'g' + key, title: p.title, statement: p.statement, scene: p.make(), origin: 'mio', folder, tags, updated: Date.now() }; };
    localStorage.setItem('electro-sim-lib-v2', JSON.stringify({ items: [it('p5', '', ['gauss']), it('p3', 'Parcial 1', ['dipolos']), it('p7', 'Parcial 1', ['dipolos', 'examen'])] }));
    localStorage.removeItem('electro-sim-cur-v2'); localStorage.removeItem('electro-sim-ui-v2');
  });
  await page.reload();
  await page.waitForSelector('#side-list .item');
  const abrir = async (titulo) => { await page.locator('.sec', { hasText: 'Ejercicios de ejemplo' }).locator('.item .it', { hasText: titulo }).first().click(); await page.waitForTimeout(400); };
  const foto = async (loc, nombre, ancho, alto) => {
    const f = path.join(tmp, nombre + '.png');
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox();
    await page.screenshot({ path: f, clip: { x: b.x, y: b.y, width: b.width, height: Math.min(b.height, alto || b.height) } });
    webp(f, nombre, ancho);
  };

  // 1 · visión general con las cinco zonas numeradas
  await abrir('3 · Dipolo en equilibrio a 60°');
  await page.evaluate(() => {
    const zonas = [['#side-list', 0.78, 0.02], ['.top', 0.62, 0.5], ['.stmt', 0.97, 0.18], ['#sources', 0.93, -0.06], ['#cv', 0.9, 0.12]];
    zonas.forEach(([sel, fx, fy], i) => {
      const r = document.querySelector(sel).getBoundingClientRect(), d = document.createElement('div');
      d.textContent = i + 1;
      Object.assign(d.style, { position: 'fixed', left: r.left + r.width * fx - 15 + 'px', top: r.top + Math.min(r.height * fy, 70) - 15 + 'px', width: '30px', height: '30px', borderRadius: '50%', background: '#c0392b', color: '#fff', font: '700 16px system-ui, sans-serif', display: 'grid', placeItems: 'center', zIndex: 99, boxShadow: '0 0 0 3px rgba(255,255,255,.85)' });
      d.className = 'badge-guia';
      document.body.append(d);
    });
  });
  { const f = path.join(tmp, 'vista.png'); await page.screenshot({ path: f }); webp(f, 'vista', 1300); }
  await page.evaluate(() => document.querySelectorAll('.badge-guia').forEach((d) => d.remove()));

  // el resto son trozos de la página: con una ventana alta caben enteros
  await page.setViewportSize({ width: 1300, height: 2400 });
  await page.waitForTimeout(400);

  // 2 · barra lateral
  await foto(page.locator('#side'), 'lateral', 414, 560);

  // 3 · resultado con el desarrollo desplegado
  await page.evaluate(() => { document.querySelector('#steps-0').open = true; });
  await page.waitForTimeout(200);
  await foto(page.locator('.card.an[data-i="0"]'), 'solucion', 1023, 546);

  // 4 · lienzo con mapa de potencial, plano XZ
  await abrir('1 · Cuadrado de cuatro cargas');
  await page.check('#t-cmap');
  for (const [b, fx, fy] of [['#probe-p', 0.08, 0.25], ['#probe-n', 0.45, 0.72]]) {
    await page.click(b);
    const c = await page.locator('#cv').boundingBox();
    await page.mouse.click(c.x + c.width * fx, c.y + c.height * fy);
  }
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1500);
  await foto(page.locator('.stage'), 'lienzo', 1038);
  await page.uncheck('#t-cmap');
  await page.click('#probe-x');

  // 5 · gráfica de un perfil
  await foto(page.locator('.card.an[data-i="1"]'), 'grafica', 1023);

  // 6 · modo práctica con una respuesta comprobada
  await page.check('#practice');
  await page.waitForTimeout(300);
  const tarjeta = page.locator('.card.an[data-i="0"]');
  await tarjeta.locator('input').first().fill('(4+sqrt(2))*q^2/(8*pi*eps0*a)');
  await tarjeta.getByRole('button', { name: 'Comprobar' }).click();
  await page.waitForTimeout(200);
  await foto(tarjeta, 'practica', 1023);
  await page.uncheck('#practice');

  // 7 · menú de exportar
  await page.click('#export');
  await page.waitForTimeout(200);
  { const b = await page.locator('#save-cur').boundingBox(), m = await page.locator('#export-w .menu, #export-w [role=menu], #export-w div').last().boundingBox(), f = path.join(tmp, 'exportar.png');
    await page.screenshot({ path: f, clip: { x: b.x + b.width + 8 - 560, y: b.y - 10, width: 560, height: m.y + m.height + 10 - (b.y - 10) } }); webp(f, 'exportar', 1100); }
  await page.keyboard.press('Escape');

  // 8 · vista 3D
  await abrir('12 · Varilla finita y dipolo en YZ');
  await page.selectOption('#plane', '3d');
  await page.check('#t-grid');
  await page.waitForTimeout(600);
  await foto(page.locator('.stage'), 'vista3d', 1038);

  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch((e) => { console.error(e); process.exit(1); });
