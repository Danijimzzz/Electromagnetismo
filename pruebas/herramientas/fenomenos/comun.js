/* Comprobación en Chromium común a los fenómenos de «Física en la vida real» (no es la prueba de ningún fenómeno: la usan
   chispa-pomo.js y pajaro-cable.js). Recorre los pasos con los controles y la línea de tiempo, mira el dato destacado, la
   historia, el deslizador «Pruébalo tú» (prueba = { paso, valor, espera }), el enlace que abre la herramienta con los datos
   (destino = { href, comprueba(page) → texto de error o '' }), el modo oscuro y los 390 px. Devuelve los fallos. */
module.exports = async ({ path, publico, pagina, browser, mal, nombre, clave, nombres, prueba, destino }) => {
  let fallos = 0;
  const falla = (m) => { fallos++; mal(`${nombre}: ${m}`); };
  const { page, consola } = await pagina(browser, 1300, 900);
  const url = 'file://' + path.join(publico, 'fenomenos', clave, 'index.html');
  await page.goto(url);
  await page.waitForFunction(() => window.FenomenoApp);
  const lee = () => page.evaluate(() => ({ paso: FenomenoApp.paso(), t: document.querySelector('#paso-t').textContent, dolar: /\$/.test(document.querySelector('#paso-x').textContent), dato: document.querySelectorAll('#paso-x .fen-dato').length, sig: document.querySelector('#sig').disabled, play: document.querySelector('#play').textContent }));
  let r = await lee();
  const n = await page.evaluate(() => FenomenoApp.pasos);
  if (r.paso !== 0 || !r.t.includes(`Paso 1 de ${n}`) || !r.play.includes('Parar')) falla(`no empieza en el paso 1 avanzando solo (${JSON.stringify(r)})`);
  const vistos = await page.evaluate(() => [...document.querySelectorAll('#puntos button span')].map((x) => x.textContent).join(','));
  if (vistos !== nombres.join(',')) falla(`la línea de tiempo tiene los nombres «${vistos}»`);
  if (await page.$('.prac-btn, .bib-btn')) falla('no debería tener Mis ejercicios ni Modo práctica');
  if ((await page.locator('.fen-historia li').count()) < 3) falla('falta «Un poco de historia»');
  await page.click('#play');
  for (let i = 0; i < n; i++) {
    if (i) await page.click('#sig');
    r = await lee();
    if (r.paso !== i || !r.t.includes(`Paso ${i + 1} de ${n}`)) falla(`«Siguiente» no lleva al paso ${i + 1}`);
    if (r.dolar) falla(`el paso ${i + 1} tiene fórmulas sin convertir`);
    if (r.dato !== 1) falla(`al paso ${i + 1} le falta el dato destacado`);
  }
  if (!r.sig) falla('«Siguiente» debería apagarse en el último paso');
  await page.click('#puntos button >> nth=1'); if ((await lee()).paso !== 1) falla('el botón del paso 2 no lleva a él');
  if (prueba) {
    await page.evaluate((k) => FenomenoApp.ve(k), prueba.paso);
    await page.fill('#prueba', String(prueba.valor));
    const o = await page.textContent('#prueba-v');
    if (!o.includes(prueba.espera)) falla(`con el deslizador en ${prueba.valor}, «Pruébalo tú» dice «${o}»`);
  }
  await page.waitForTimeout(400);
  // el enlace deja los datos en la herramienta (con file:// se apunta al index.html para seguirlo)
  if ((await page.getAttribute('#abrir', 'href')) !== destino.href) falla(`el enlace no lleva a ${destino.href}`);
  await page.$eval('#abrir', (a) => a.setAttribute('href', a.getAttribute('href') + 'index.html'));
  await Promise.all([page.waitForEvent('load'), page.click('#abrir')]);
  await page.waitForTimeout(500);
  const e = await destino.comprueba(page);
  if (e) falla(`la herramienta no abre con los datos: ${e}`);
  if (!(await page.locator(`.vida-real a[href="../../fenomenos/${clave}/"]`).count())) falla('la herramienta no enlaza el fenómeno en «En la vida real»');
  await page.evaluate(() => localStorage.clear());
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(url);
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => ({ ancho: document.documentElement.scrollWidth, fondo: getComputedStyle(document.body).backgroundColor, alto: document.querySelector('#escena').getBoundingClientRect().height }));
  if (m.ancho > 390) falla(`a 390 px la página se sale (${m.ancho} px)`);
  if (m.fondo === 'rgb(238, 241, 238)') falla('el modo oscuro no cambia el fondo');
  if (!(m.alto >= 200)) falla(`la animación mide ${m.alto} px de alto en el móvil`);
  await page.close();
  if (consola.length) falla('consola del navegador:\n      ' + consola.join('\n      '));
  return fallos;
};
