#!/usr/bin/env node
/* Prueba del selector de idioma (fuente/idiomas.js). Sin compilar publico/: monta una cabecera mínima con el botón.
   1. Node: con un solo idioma publicado no se pinta nada (la web queda igual); con todos salen los 8, con bandera,
      nombre en su idioma y código; hreflang con x-default; noindex mientras un idioma no sea indexable; sitemap.
   2. Navegador (comprobar.js pasa el suyo): el botón cerrado solo lleva globo y código (sin bandera), la lista
      abierta lleva 8 banderas, los enlaces apuntan a la MISMA página en cada idioma (/en/fisica/choques/…),
      Esc y clic fuera cierran, la elección se guarda y no hay aviso si ya se eligió, y el aviso sale una vez con el
      idioma del navegador y ofrece cambiar sin redirigir solo.
   Uso: node pruebas/idiomas.js   (necesita Playwright) */
const Idiomas = require('../fuente/idiomas.js');

function nodo(mal) {
  const e = (c, ok) => { if (!ok) mal(`idiomas.js (Node): ${c}`); };
  e('sin una página traducida no hay botón ni hreflang (aunque haya idiomas publicados)', Idiomas.BOTON() === '' && Idiomas.BOTON({ ruta: 'x/y/' }) === '' && Idiomas.HREFLANG('x/y/', 'https://x') === '');
  e('con la página traducida (Choques) el botón sale con español e inglés', Idiomas.BOTON({ ruta: 'fisica/choques/' }).includes('hreflang="en"') && !Idiomas.BOTON({ ruta: 'fisica/choques/' }).includes('hreflang="de"'));
  const b = Idiomas.BOTON({ idioma: 'ja', raiz: '../', todos: true });
  e('con todos salen 8 enlaces con hreflang', (b.match(/hreflang="/g) || []).length === 8);
  e('con 8 banderas y 8 códigos', (b.match(/class="lg-fl"/g) || []).length === 8 && ['ES', 'EN', 'DE', 'FR', 'PT', 'IT', 'ZH', 'JA'].every((c) => b.includes(`<small>${c}</small>`)));
  e('el idioma de la página lleva aria-current y su código en el botón cerrado', /hreflang="ja"[^>]*aria-current="true"/.test(b) && /<span>JA<\/span><span aria-hidden/.test(b));
  e('el botón cerrado no lleva bandera', !/<button[^>]*>[^]*?<\/button>/.exec(b)[0].includes('lg-fl'));
  e('nombres en su idioma', ['Español', 'English', 'Deutsch', 'Français', 'Português', 'Italiano', '简体中文', '日本語'].every((n) => b.includes(n)));
  const h = Idiomas.HREFLANG('fisica/choques/', 'https://x', true);
  e('hreflang con x-default hacia el español', h.includes('hreflang="x-default" href="https://x/fisica/choques/"') && h.includes('hreflang="zh-Hans" href="https://x/zh/fisica/choques/"'));
  e('noindex en un idioma no indexable y nada en español', Idiomas.ROBOTS('de').includes('noindex') && Idiomas.ROBOTS('en') === '' && Idiomas.ROBOTS('es') === '');
  e('sitemap con xhtml:link', Idiomas.SITEMAP('a/', 'https://x', true).includes('<xhtml:link rel="alternate" hreflang="de" href="https://x/de/a/"/>'));
  e('banderas: cada idioma tiene la suya y su frase de aviso', Idiomas.IDIOMAS.every((i) => Idiomas.BANDERAS[i.c] && i.aviso.length === 3));
}

async function navegador(browser, { mal }) {
  const e = (c, ok) => { if (!ok) mal(`idiomas.js (navegador): ${c}`); };
  const html = `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--accent:#2a5bd7;--accent-soft:#e3e9f6;--ink:#1a2128;--muted:#5b6670;--line:#ccc;--bg:#fff}body{margin:0;font:14px system-ui}header{display:flex;gap:8px;padding:10px}${Idiomas.CSS(true)}.tema{margin-left:0;width:36px;height:36px}</style>
<body><header class="top"><a>Inicio</a>${Idiomas.BOTON({ idioma: 'ja', raiz: '/', todos: true })}<button class="tema">☾</button></header></body></html>`;
  const abre = async (lenguas, previo) => {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, locale: lenguas });
    if (previo) await ctx.addInitScript((v) => localStorage.setItem('simu-idioma', v), previo);
    const p = await ctx.newPage();
    await p.route('**/*', (r) => r.fulfill({ contentType: 'text/html', body: html }));
    await p.goto('http://localhost/ja/fisica/choques/?x=1');
    return { ctx, p };
  };
  // 1. botón, lista y enlaces (navegador en japonés: sin aviso porque es el idioma de la página)
  let { ctx, p } = await abre('ja-JP');
  e('cerrado: sin banderas visibles y con el código JA', await p.locator('.lg-btn .lg-fl').count() === 0 && (await p.locator('.lg-btn').innerText()).includes('JA'));
  e('la lista empieza cerrada', await p.locator('.lg-pop').isHidden());
  await p.click('.lg-btn');
  e('abierta: 8 banderas visibles', await p.locator('.lg-pop .lg-fl:visible').count() === 8);
  e('aria-expanded true', await p.getAttribute('.lg-btn', 'aria-expanded') === 'true');
  const hrefs = await p.$$eval('.lg-pop a', (as) => as.map((a) => a.getAttribute('href')));
  e('los enlaces llevan a la misma página en cada idioma', hrefs.join(' ') === ['/fisica/choques/?x=1', '/en/fisica/choques/?x=1', '/de/fisica/choques/?x=1', '/fr/fisica/choques/?x=1', '/pt/fisica/choques/?x=1', '/it/fisica/choques/?x=1', '/zh/fisica/choques/?x=1', '/ja/fisica/choques/?x=1'].join(' '));
  await p.keyboard.press('Escape');
  e('Esc cierra y devuelve el foco al botón', await p.locator('.lg-pop').isHidden() && await p.evaluate(() => document.activeElement.className) === 'lg-btn');
  await p.click('.lg-btn'); await p.click('header a'); 
  e('clic fuera cierra', await p.locator('.lg-pop').isHidden());
  await p.click('.lg-btn'); await p.evaluate(() => document.querySelector('.lg-pop a[hreflang=de]').addEventListener('click', (ev) => ev.preventDefault(), true));
  await p.click('.lg-pop a[hreflang=de]');
  e('elegir un idioma guarda simu-idioma', await p.evaluate(() => localStorage.getItem('simu-idioma')) === 'de');
  await ctx.close();
  // 2. aviso: navegador en alemán, sin elección → sale una vez, en alemán, y no redirige solo
  ({ ctx, p } = await abre('de-DE'));
  e('aviso en el idioma del navegador', (await p.locator('.lg-ban').innerText()).includes('Diese Seite ist auf Deutsch verfügbar.'));
  e('no redirige solo', new URL(p.url()).pathname === '/ja/fisica/choques/');
  await p.click('.lg-ban button:last-child');
  e('«quedarse» cierra y recuerda el idioma de la página', await p.locator('.lg-ban').count() === 0 && await p.evaluate(() => localStorage.getItem('simu-idioma')) === 'ja');
  await p.reload();
  e('y no vuelve a salir', await p.locator('.lg-ban').count() === 0);
  await ctx.close();
  // 3. con una elección guardada no hay aviso; en móvil la lista cabe
  ({ ctx, p } = await abre('fr-FR', 'ja'));
  e('con elección guardada no hay aviso', await p.locator('.lg-ban').count() === 0);
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, locale: 'it-IT' }); p = await ctx.newPage();
  await p.route('**/*', (r) => r.fulfill({ contentType: 'text/html', body: html })); await p.goto('http://localhost/ja/x/');
  e('móvil: el aviso cabe en pantalla', (await p.locator('.lg-ban').boundingBox()).x >= 0 && (await p.locator('.lg-ban').boundingBox()).width <= 390);
  await p.click('.lg-btn'); const caja = await p.locator('.lg-pop').boundingBox();
  e('móvil: la lista no se sale de la pantalla', caja.x >= 0 && caja.x + caja.width <= 390);
  await ctx.close();
}

// 3. Páginas reales de publico/: la lista abierta queda por encima de la barra de asignaturas y de todo lo demás
async function real(browser, { mal }) {
  const fs = require('fs'), path = require('path');
  const base = path.join(__dirname, '..', 'publico');
  const paginas = ['index.html', 'fisica/index.html', 'fisica/choques/index.html'].filter((f) => fs.existsSync(path.join(base, f)));
  if (!paginas.length) return;
  for (const [ancho, alto] of [[390, 800], [1200, 800]]) for (const esquema of ['light', 'dark']) for (const f of paginas) {
    const ctx = await browser.newContext({ viewport: { width: ancho, height: alto }, colorScheme: esquema });
    const p = await ctx.newPage(); await p.goto('file://' + path.join(base, f));
    if (!await p.locator('.lg-btn').count()) { await ctx.close(); continue; }
    await p.click('.lg-btn');
    const mala = await p.evaluate(() => [...document.querySelectorAll('.lg-pop a')].filter((a) => { const r = a.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, t = document.elementFromPoint(x, y); return !(t && (t === a || a.contains(t))); }).map((a) => a.textContent.trim()));
    if (mala.length) mal(`idiomas.js (real): ${f} a ${ancho}px (${esquema}): opciones tapadas por otro elemento: ${mala.join(', ')}`);
    await ctx.close();
  }
}

module.exports = async (browser, ctx) => { nodo(ctx.mal); if (browser) { await navegador(browser, ctx); await real(browser, ctx); } };
if (require.main === module) (async () => {
  let fallos = 0; const mal = (m) => { fallos++; console.error('  ✗ ' + m); };
  const { chromium } = require('playwright'); const b = await chromium.launch();
  await module.exports(b, { mal }); await b.close();
  console.log(fallos ? `${fallos} fallos` : '  ✓ Selector de idioma: botón con globo y código, lista con banderas, enlaces a la misma página, hreflang, noindex y aviso');
  process.exit(fallos ? 1 : 0);
})();
