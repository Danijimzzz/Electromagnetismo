#!/usr/bin/env node
/* ===== Mis ejercicios sin carreras =====
   Comprueba, en todas las herramientas con estado, que «Guardar el actual» recoge lo ÚLTIMO que se ha
   escrito aunque la app guarde con retraso (cálculo con espera, requestAnimationFrame…): se cambia un
   dato, se guarda al instante y lo guardado tiene que ser igual a lo que la app deja en su clave una
   vez asentada. También falla si hay errores de consola.
   Uso: node pruebas/biblioteca-carreras.js [--solo CARPETA] [--vueltas N]   (necesita publico/ compilado) */
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..'), publico = path.join(raiz, 'publico');
const Catalogo = require(path.join(raiz, 'fuente', 'catalogo.js'));
const args = process.argv.slice(2), solo = args.includes('--solo') ? args[args.indexOf('--solo') + 1] : null;
const vueltas = args.includes('--vueltas') ? +args[args.indexOf('--vueltas') + 1] : 1;
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  let fallos = 0, probadas = 0;
  const mal = (m) => { fallos++; console.log('  ✗ ' + m); };
  const pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}`));
  for (const pag of pags) {
    const fich = path.join(publico, ...pag.split('/'), 'index.html'), html = fs.readFileSync(fich, 'utf8');
    const [, dir, clave] = html.match(/Biblioteca\.monta\('([^']+)', (?:'([^']+)'|null)\)/) || [];
    if (!dir || !clave || (solo && solo !== dir && solo !== pag.split('/')[1])) continue;
    for (let v = 0; v < vueltas; v++) {
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } }), consola = [];
      await page.route(/^https?:/, (r) => r.abort()); // sin red (anuncios, fuentes): se prueba en local
      page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|ERR_BLOCKED|net::/.test(m.text())) consola.push(m.text()); });
      page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
      await page.goto('file://' + fich); await page.waitForSelector('.bib .bib-acc');
      // cambia el primer campo de la tarjeta de datos y guarda sin esperar
      const campo = await page.$('.layout .card input[type=text]:visible, .layout .card input[type=number]:visible, .layout .card input:not([type]):visible');
      if (campo) { await campo.fill('7'); await campo.dispatchEvent('input'); await campo.dispatchEvent('change'); }
      await page.click('.bib [data-acc=nuevo]'); await page.fill('#bib-t', 'Carrera'); await page.click('.bib [data-acc=guardar]');
      await page.waitForTimeout(700);
      const r = await page.evaluate(([k, c]) => ({ it: (JSON.parse(localStorage.getItem(k) || '{"items":[]}').items || [])[0], ahora: localStorage.getItem(c) }), [`simu-ejercicios:${dir}`, clave]);
      if (!r.it) mal(`${pag}: no se guardó nada`);
      else if (r.it.datos !== r.ahora) mal(`${pag}: lo guardado no es lo último que escribió la app (carrera)`);
      // abrir lo guardado con un cambio todavía sin asentar: tras recargar tiene que quedar lo guardado, no el cambio pendiente
      if (r.it && campo) {
        await Promise.all([page.waitForEvent('load'), page.evaluate(() => { const c = document.querySelector('.layout .card input[type=text]:not([hidden]), .layout .card input[type=number], .layout .card input:not([type])'); if (c) { c.value = '3'; c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); } document.querySelector('.bib .bib-abre').click(); }).catch(() => {})]);
        await page.waitForSelector('.bib .bib-it.activo'); await page.waitForTimeout(500);
        const tras = await page.evaluate((c) => localStorage.getItem(c), clave);
        if (tras !== r.it.datos) mal(`${pag}: al abrir un ejercicio con un cambio pendiente, la app lo pisa con el estado de antes`);
      }
      if (consola.length) mal(`${pag}: consola: ${consola.slice(0, 2).join(' | ')}`);
      await page.close();
    }
    probadas++;
  }
  await browser.close();
  console.log(fallos ? `✗ ${fallos} fallo(s) en ${probadas} herramientas` : `✓ Mis ejercicios sin carreras en ${probadas} herramientas`);
  process.exit(fallos ? 1 : 0);
})();
