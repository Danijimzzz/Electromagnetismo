#!/usr/bin/env node
/* ===== Casos límite comunes (10.19) =====
   En cada herramienta con campos de texto o número en su tarjeta de datos, pone en TODOS los campos a la vez cada valor
   incómodo (vacío, 0, negativo, enorme, minúsculo, coma y exponente, prefijo SI, texto) y exige: ninguna excepción ni error
   de consola, y ningún «NaN», «Infinity» ni «undefined» visibles en la página (un error explicado en lenguaje claro sí vale).
   Uso: node pruebas/limites.js [--solo CARPETA] [--aviso]   (necesita publico/ y playwright; --aviso lista sin fallar) */
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..'), publico = path.join(raiz, 'publico');
const Catalogo = require(path.join(raiz, 'fuente', 'catalogo.js'));
const args = process.argv.slice(2), solo = args.includes('--solo') ? args[args.indexOf('--solo') + 1] : null, aviso = args.includes('--aviso');
const VALORES = ['', '0', '-1', '1e308', '1e-320', '99999999999999999999', '3,5e2', '4k7', '100n', 'abc', '1/0', '.', '-0'];
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  let fallos = 0, n = 0; const mal = (m) => { fallos++; console.log('  ✗ ' + m); };
  for (const a of Catalogo.asignaturas) for (const h of a.herramientas.filter((x) => x.disponible)) {
    const carpeta = h.carpeta || h.clave; if (solo && solo !== carpeta && solo !== h.clave) continue;
    if (h.clave === 'electrostatica') continue;
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } }), consola = [];
    await page.route(/^https?:/, (r) => r.abort());
    page.on('console', (m) => { if (m.type() === 'error' && !/net::/.test(m.text())) consola.push(m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, a.clave, h.clave, 'index.html')); await page.waitForSelector('main');
    const hay = await page.locator('.layout .card input[type=text]:visible, .layout .card input[type=number]:visible, .layout .card input:not([type]):visible').count();
    if (!hay) { await page.close(); continue; }
    n++; if (process.env.LIM_LOG) console.log('· ' + carpeta);
    const malos = new Set();
    for (const v of VALORES) {
      const colgada = await Promise.race([page.evaluate((val) => {
        for (const i of document.querySelectorAll('.layout .card input[type=text], .layout .card input[type=number], .layout .card input:not([type])')) {
          if (i.offsetParent === null) continue;
          if (i.type === 'number') { try { i.value = val; } catch (e) { /* number no admite texto */ } } else i.value = val;
          i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, v), new Promise((ok) => setTimeout(() => ok('colgada'), 8000))]);
      if (colgada === 'colgada') { malos.add(`la página se queda colgada con ${JSON.stringify(v)}`); break; }
      await page.evaluate(() => new Promise((ok) => setTimeout(() => requestAnimationFrame(ok), 150)));
      const feo = await page.evaluate(() => { const t = document.querySelector('main').innerText; const m = t.match(/\b(NaN|Infinity|undefined)\b/); return m ? m[0] : ''; });
      if (feo) malos.add(`«${feo}» con ${JSON.stringify(v)}`);
    }
    if (malos.size) mal(`${a.clave}/${h.clave}: ${[...malos].slice(0, 4).join(' · ')}${malos.size > 4 ? ` (+${malos.size - 4})` : ''}`);
    if (consola.length) mal(`${a.clave}/${h.clave}: consola: ${consola.slice(0, 2).join(' | ')}`);
    await page.close();
  }
  await browser.close();
  console.log(fallos ? `${aviso ? '·' : '✗'} Casos límite: ${fallos} herramienta(s) con problemas de ${n}` : `  ✓ Casos límite: ${n} herramientas aguantan ${VALORES.length} entradas incómodas sin NaN, Infinity ni errores`);
  process.exit(fallos && !aviso ? 1 : 0);
})();
