/* =====================================================================
   Electrostática usa la MISMA barra «Mis ejercicios» que las demás herramientas (Web 1.20.1; en la 1.20 tenía una propia y
   salía distinta). Aquí se comprueba, en Chromium y sobre publico/:
   - que no queda nada de la barra antigua (#side, #side-list, la ventana de la hoja…) y que la barra es la común,
     con los mismos botones y los mismos menús ⋮ que Tiro parabólico (se comparan los data-acc uno a uno);
   - que lo guardado con la barra antigua (electro-sim-lib-v2 y el ejercicio abierto, electro-sim-cur-v2) se pasa solo a
     Mis ejercicios, con su carpeta, su enunciado y el ejercicio abierto marcado;
   - guardar, actualizar, abrir otro (recarga), ejemplos, imprimir varios con la selección de la barra, copiar enlace
     (y abrir uno hecho con la versión de antes) y el móvil.
   Se llama desde comprobar.js con el navegador ya abierto.
   ===================================================================== */
module.exports = async function barraElectrostatica(browser, { publico, path, mal }) {
  // con un servidor local: la hoja para imprimir lee un marco de la misma página y con file:// el navegador no lo deja
  const http = require('http'), fs = require('fs');
  const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
  const srv = http.createServer((q, r) => {
    let f = path.join(publico, decodeURIComponent(q.url.split(/[?#]/)[0])); if (!f.startsWith(publico)) { r.writeHead(403).end(); return; }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) { r.writeHead(404).end(); return; }
    r.writeHead(200, { 'content-type': tipos[path.extname(f)] || 'application/octet-stream' }).end(fs.readFileSync(f));
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const URL = base + 'electromagnetismo/electrostatica/', URL_OTRA = base + 'fisica/tiro-parabolico/';
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const consola = [];
  const nueva = async (url) => {
    const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') consola.push(m.text()); });
    p.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await p.goto(url);
    return p;
  };
  const escena = { unit: 'a', mode: 'sym', view: { plane: 'xy', cut: '0' }, kinds: {}, unknown: null, sources: [], analyses: [] };

  // 1 · lo de la barra antigua pasa solo
  await ctx.addInitScript((e) => {
    if (localStorage.getItem('sembrado')) return;
    localStorage.setItem('sembrado', '1');
    localStorage.setItem('electro-sim-lib-v2', JSON.stringify({ items: [
      { id: 'm1', title: 'Mi primero', statement: 'Enunciado uno', scene: e, origin: 'mio', folder: '', tags: [], updated: 1 },
      { id: 'm2', title: 'Mi segundo', statement: 'Enunciado dos', scene: e, origin: 'mio', folder: 'Parcial 1', tags: ['dipolos'], updated: 2 },
    ] }));
    localStorage.setItem('electro-sim-cur-v2', JSON.stringify({ ref: { kind: 'lib', id: 'm2' }, title: 'Mi segundo', statement: 'Enunciado dos', folder: 'Parcial 1', tags: [], scene: e }));
  }, escena);
  let p = await nueva(URL);
  await p.waitForSelector('.bib .bib-acc');
  const resto = await p.evaluate(() => ['#side', '#side-list', '#side-open', '#tab-guardados', '#hoja-dlg', '#banner', '#meta', '#save-cur', '#folder', '#tags'].filter((s) => document.querySelector(s)));
  if (resto.length) mal(`Electrostática: quedan restos de la barra antigua: ${resto.join(', ')}`);
  const m = await p.evaluate(() => ({
    viejo: localStorage.getItem('electro-sim-lib-v2'), copia: !!localStorage.getItem('electro-sim-lib-v2-migrada'), cur: localStorage.getItem('electro-sim-cur-v2'),
    items: JSON.parse(localStorage.getItem('simu-ejercicios:electrostatica') || '{"items":[]}').items, titulo: document.getElementById('title').value, enun: document.getElementById('statement').value,
    activo: sessionStorage.getItem('simu-ejercicios-activo:electrostatica'), marcado: document.querySelector('.bib .bib-it.activo .bib-tt')?.textContent,
    carpeta: document.querySelector('.bib .bib-carp')?.textContent, estado: JSON.parse(localStorage.getItem('electrostatica-v1') || 'null'),
  }));
  if (m.viejo !== null || !m.copia || m.cur !== null) mal('Electrostática: la biblioteca antigua no se migra (queda la clave vieja o falta la copia de seguridad)');
  if (m.items.length !== 2 || !m.items.some((x) => x.id === 'm2' && x.titulo === 'Mi segundo' && x.carpeta === 'Parcial 1' && JSON.parse(x.datos).statement === 'Enunciado dos' && JSON.parse(x.datos).scene)) mal(`Electrostática: Mis ejercicios no recibe los problemas de antes: ${JSON.stringify(m.items).slice(0, 200)}`);
  if (m.titulo !== 'Mi segundo' || m.enun !== 'Enunciado dos' || m.activo !== 'm2' || m.marcado !== 'Mi segundo' || !/Parcial 1/.test(m.carpeta || '')) mal(`Electrostática: el ejercicio abierto no sigue abierto y marcado tras migrar: ${JSON.stringify({ t: m.titulo, a: m.activo, mk: m.marcado, c: m.carpeta })}`);
  if (!m.estado || m.estado.title !== 'Mi segundo' || !m.estado.scene) mal('Electrostática: el estado no queda en electrostatica-v1 como {title, statement, scene}');

  // 2 · actualizar el abierto, guardar uno nuevo, abrir otro
  await p.fill('#title', 'Segundo cambiado');
  await p.click('.bib [data-acc=actualizar]');
  const act = await p.evaluate(() => JSON.parse(localStorage.getItem('simu-ejercicios:electrostatica')).items.find((x) => x.id === 'm2'));
  if (act.titulo !== 'Mi segundo' || JSON.parse(act.datos).title !== 'Segundo cambiado') mal('Electrostática: «Guardar cambios» no guarda el título nuevo en el ejercicio abierto');
  await p.click('.bib [data-acc=nuevo]');
  if ((await p.inputValue('#bib-t')) !== 'Segundo cambiado') mal('Electrostática: «Guardar el actual» no propone el título del ejercicio');
  await p.fill('#bib-t', 'Tercero'); await p.fill('#bib-c', 'Parcial 2'); await p.click('.bib [data-acc=guardar]');
  if ((await p.evaluate(() => JSON.parse(localStorage.getItem('simu-ejercicios:electrostatica')).items.length)) !== 3) mal('Electrostática: «Guardar el actual» no añade el ejercicio');
  await Promise.all([p.waitForEvent('load'), p.locator('.bib .bib-it', { hasText: 'Mi primero' }).locator('.bib-abre').click()]);
  await p.waitForSelector('.bib .bib-acc');
  if ((await p.inputValue('#title')) !== 'Mi primero' || (await p.inputValue('#statement')) !== 'Enunciado uno') mal('Electrostática: abrir un ejercicio guardado no lo carga');

  // 3 · ejemplos en su pestaña; al tocar uno deja de figurar como elegido
  await p.click('.bib [data-acc=pestana-ejemplos]');
  const n = await p.locator('.bib .bib-ej').count(), nPres = await p.evaluate(() => Presets.list.length);
  if (n !== nPres || n < 2) mal(`Electrostática: la pestaña Ejemplos muestra ${n} y presets.js tiene ${nPres}`);
  await p.locator('.bib .bib-ej').nth(1).click();
  const t1 = await p.evaluate(() => Presets.list[1].title);
  if ((await p.inputValue('#title')) !== t1 || (await p.locator('.bib .bib-ej.activo').count()) !== 1) mal('Electrostática: abrir un ejemplo no lo carga o no lo marca');
  await p.fill('#statement', 'Otro enunciado');
  await p.waitForTimeout(100);
  if (await p.locator('.bib .bib-ej.activo').count()) mal('Electrostática: tras tocar un ejemplo sigue marcado como si no se hubiera tocado');
  await p.click('.bib [data-acc=pestana-guardados]');

  // 4 · imprimir varios con el modo selección de la barra (no hay ventana propia)
  const antes = await p.evaluate(() => localStorage.getItem('electrostatica-v1'));
  await p.click('.bib [data-acc=sel-modo]'); await p.click('.bib [data-acc=sel-todos]');
  await p.evaluate(() => { window.print = () => { window.__hoja = document.getElementById('hoja-imp').innerHTML; }; });
  await p.click('.bib [data-acc=sel-imprimir]');
  await p.waitForSelector('form.vi .vi-ok'); await p.click('form.vi .vi-ok');
  await p.waitForFunction(() => window.__hoja, null, { timeout: 40000 });
  const hoja = await p.evaluate(() => window.__hoja);
  if ((hoja.match(/<section class="hoja-ej"/g) || []).length !== 3) mal('Electrostática: la hoja no trae los tres ejercicios guardados');
  if (!/Enunciado dos|Enunciado uno/.test(hoja) || !/Datos/.test(hoja) || !/Preguntas/.test(hoja)) mal('Electrostática: la hoja no trae el enunciado, los datos y las preguntas de cada ejercicio');
  if (!/<b>1<\/b>/.test(hoja) || !/<b>2<\/b>/.test(hoja)) mal('Electrostática: la hoja no numera los ejercicios');
  if ((await p.evaluate(() => localStorage.getItem('electrostatica-v1'))) !== antes) mal('Electrostática: la hoja no devuelve el estado de antes');
  await p.evaluate(() => dispatchEvent(new Event('afterprint')));

  // 5 · enlace con los datos, y un enlace de la versión de antes ({title, statement, folder, tags, scene})
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  if (!(await p.locator('.bib.abierta').count())) await p.click('.bib-btn'); // la hoja cierra la barra para imprimir
  await p.click('.bib [data-acc=menu-general]'); await p.click('.bib [data-acc=enlace]');
  const enlace = await p.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  if (!/#d=[\w-]+$/.test(enlace)) mal('Electrostática: «Copiar enlace» no lleva los datos');
  else {
    const q = await ctx.newPage(); q.on('pageerror', (e) => consola.push('excepción: ' + e.message)); await q.goto(enlace);
    await q.waitForSelector('.bib .bib-acc');
    if ((await q.inputValue('#statement')) !== 'Otro enunciado') mal('Electrostática: abrir un enlace copiado no recupera el ejercicio');
    await q.close();
  }
  const viejo = Buffer.from(JSON.stringify({ title: 'Enlace viejo', statement: 'Del enlace de antes', folder: 'x', tags: [], scene: escena })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  { const q = await ctx.newPage(); q.on('pageerror', (e) => consola.push('excepción: ' + e.message)); await q.goto(URL + '#d=' + viejo); await q.waitForSelector('.bib .bib-acc');
    if ((await q.inputValue('#title')) !== 'Enlace viejo' || (await q.evaluate(() => location.hash))) mal('Electrostática: un enlace #d=… de la versión de antes no se abre o conserva el #d'); await q.close(); }

  // 6 · la barra es la misma que la de otra herramienta: mismos botones y mismos menús, uno a uno
  const huella = async (pg) => {
    await pg.waitForSelector('.bib .bib-acc');
    if (!(await pg.locator('.bib.abierta').count())) await pg.click('.bib-btn');
    const r = {};
    r.cab = await pg.evaluate(() => [...document.querySelectorAll('.bib .bib-h [data-acc], .bib .bib-seg [data-acc], .bib .bib-cta [data-acc]')].map((b) => b.dataset.acc));
    await pg.click('.bib [data-acc=menu-general]');
    r.general = await pg.evaluate(() => [...document.querySelectorAll('.bib .bib-pop [data-acc]')].map((b) => b.dataset.acc));
    await pg.click('.bib [data-acc=cierra-menu]', { force: true });
    if (!(await pg.locator('.bib .bib-it').count())) { await pg.click('.bib [data-acc=nuevo]'); await pg.click('.bib [data-acc=guardar]'); }
    await pg.locator('.bib .bib-it .bib-dots').first().click();
    r.fila = await pg.evaluate(() => [...document.querySelectorAll('.bib .bib-pop [data-acc]')].map((b) => b.dataset.acc));
    await pg.click('.bib [data-acc=cierra-menu]', { force: true });
    r.color = await pg.evaluate(() => { const c = (s) => document.querySelector(s) && getComputedStyle(document.querySelector(s)); const b = c('.bib'); return [b.position, b.width, b.borderRadius, c('.bib .bib-prim').borderRadius, c('.bib .bib-seg').borderRadius].join('|'); });
    return r;
  };
  const otra = await nueva(URL_OTRA), a = await huella(p), b2 = await huella(otra);
  for (const k of Object.keys(b2)) if (JSON.stringify(a[k]) !== JSON.stringify(b2[k])) mal(`Electrostática: la barra no es igual que la de Tiro parabólico en «${k}»: ${JSON.stringify(a[k])} ≠ ${JSON.stringify(b2[k])}`);
  await otra.close();

  // 7 · móvil: la barra empieza cerrada, el botón la abre y la página no se ensancha
  const ctxM = await browser.newContext({ viewport: { width: 390, height: 800 } }), movil = await ctxM.newPage(); movil.on('pageerror', (e) => consola.push('excepción: ' + e.message));
  await movil.goto(URL); await movil.waitForSelector('.bib .bib-acc');
  const mv = await movil.evaluate(() => ({ ab: document.querySelector('.bib').classList.contains('abierta'), ancho: document.documentElement.scrollWidth }));
  if (mv.ab || mv.ancho > 391) mal(`Electrostática en el móvil: ${JSON.stringify(mv)}`);
  await movil.click('.bib-btn');
  if (!(await movil.evaluate(() => document.querySelector('.bib').classList.contains('abierta'))) || (await movil.evaluate(() => document.documentElement.scrollWidth)) > 391) mal('Electrostática en el móvil: «Mis ejercicios» no se abre bien');
  await ctxM.close();
  const errs = consola.filter((c) => !/net::ERR_/.test(c));
  if (errs.length) mal(`Electrostática (barra común): errores en la consola: ${errs.join(' · ')}`);
  await ctx.close(); srv.close();
};
