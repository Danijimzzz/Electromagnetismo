/* Comprobación del Fuego de San Telmo («Física en la vida real»): los números del modelo y la escena que se abre en
   Electrostática, en Node, y la página en Chromium (pasos, controles, enlace con los datos, modo oscuro y 390 px).
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo fenomenos/fuego-san-telmo ejecuta solo esta). */
module.exports = ({ path, fuente, publico, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const F = require(path.join(fuente, 'fenomenos', 'fuego-san-telmo', 'escena.js'));
  {
    // a mano: E = V/R con V = 50 kV, σ₂/σ₁ = R₁/R₂ = 100 y Q₁ = 4πε₀R₁V ≈ 5,563 µC (el ejercicio lleva 5,56 µC)
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`San Telmo · ${q}: ${a} en vez de ${b}`); };
    cerca(F.datos.Ecasco, 5e4, 1e-9, 'campo en el casco'); cerca(F.datos.Epunta, 5e6, 1e-6, 'campo en la punta'); cerca(F.datos.sigmas, 100, 1e-12, 'σ₂/σ₁');
    cerca(F.datos.Q1 * 1e6, 5.563, 1e-3, 'carga del casco (µC)');
    if (!(F.datos.Epunta > F.datos.RUPTURA && F.datos.Ecasco < F.datos.RUPTURA)) mal('San Telmo: la punta debería superar la rigidez del aire y el casco no');
    if (F.pasos.length !== 6 || F.pasos.some((p) => !p.titulo || !p.texto)) mal('San Telmo: faltan pasos o textos');
    // la escena de Electrostática: la incógnita Q₂ con V igual en las dos esferas da 5,285·10⁻⁸ C y E = 4,750 MV/m en la punta
    const out = Physics.run(F.escenaElectrostatica());
    if (out.ctx.errors.length || !out.unknown || out.unknown.error) mal(`San Telmo: la escena de Electrostática da error (${out.ctx.errors.join(' · ') || out.unknown?.error})`);
    else {
      if (!/5\.285·10<sup>−8<\/sup>/.test(out.unknown.html)) mal(`San Telmo: Q₂ sale ${out.unknown.html}`);
      if (!/4\.997·10<sup>4<\/sup>/.test(out.results[0].res) || !/4\.750·10<sup>6<\/sup>/.test(out.results[1].res)) mal('San Telmo: los campos en el casco y en la punta no salen 4,997·10⁴ y 4,750·10⁶ N/C');
    }
    if (fallos === antes) console.log('  ✓ Fuego de San Telmo: campo en el casco y en la punta, σ₂/σ₁, 6 pasos y la escena de Electrostática (Q₂ y los dos campos)');
  }

  return async (browser) => {
    const antes = fallos;
    const { page, consola } = await pagina(browser, 1300, 900);
    const url = 'file://' + path.join(publico, 'fenomenos', 'fuego-san-telmo', 'index.html');
    await page.goto(url);
    await page.waitForFunction(() => window.FenomenoApp);
    const lee = () => page.evaluate(() => ({ paso: FenomenoApp.paso(), t: document.querySelector('#paso-t').textContent, x: document.querySelector('#paso-x').textContent, mathml: document.querySelectorAll('#paso-x math').length, dolar: /\$/.test(document.querySelector('#paso-x').textContent), ant: document.querySelector('#ant').disabled, sig: document.querySelector('#sig').disabled, play: document.querySelector('#play').textContent, ver: document.querySelector('#ver').textContent }));
    let r = await lee();
    if (r.paso !== 0 || !r.t.includes('Paso 1 de 6') || !r.ant || r.sig) mal(`San Telmo: no empieza en el paso 1 (${JSON.stringify(r)})`);
    if (!r.play.includes('Parar')) mal('San Telmo: la animación no avanza sola al abrirla');
    if (r.ver !== Version.de('fenomenos').current) mal(`San Telmo: el pie muestra la versión «${r.ver}»`);
    if ((await page.locator('#puntos button').count()) !== 6) mal('San Telmo: no hay un botón por paso');
    if (await page.$('.prac-btn, .bib-btn')) mal('San Telmo: no debería tener Mis ejercicios ni Modo práctica');
    await page.click('#play');
    if (!(await lee()).play.includes('Reproducir')) mal('San Telmo: «Parar» no detiene el avance');
    for (let i = 1; i < 6; i++) {
      await page.click('#sig');
      r = await lee();
      if (r.paso !== i || !r.t.includes(`Paso ${i + 1} de 6`)) mal(`San Telmo: «Siguiente» no lleva al paso ${i + 1}`);
      if (r.dolar) mal(`San Telmo: el paso ${i + 1} tiene fórmulas sin convertir`);
    }
    if (!r.sig) mal('San Telmo: «Siguiente» debería apagarse en el último paso');
    // último paso: «Pruébalo tú» con el radio de la punta (1 cm brilla, 3 cm no)
    if (!(await page.textContent('#prueba-v')).includes('brilla') || (await page.textContent('#prueba-v')).includes('no brilla')) mal('San Telmo: el deslizador del último paso no empieza en una punta que brilla');
    await page.fill('#prueba', '3');
    if (!(await page.textContent('#prueba-v')).includes('1,7 MV/m < 3 MV/m: no brilla')) mal(`San Telmo: con una punta de 3 cm el deslizador dice «${await page.textContent('#prueba-v')}»`);
    if (await page.evaluate(() => FenomenoApp.avanza())) mal('San Telmo: mover el deslizador debería parar el avance');
    const extra = await page.evaluate(() => ({ dato: document.querySelectorAll('#paso-x .fen-dato').length, nombres: [...document.querySelectorAll('#puntos button span')].map((x) => x.textContent).join(','), sonido: FenomenoApp.sonido(), boton: document.querySelector('#sonido')?.getAttribute('aria-pressed'), etiquetas: document.querySelectorAll('.fen-etiquetas span').length }));
    if (extra.dato !== 1) mal('San Telmo: falta el dato destacado del paso');
    if (extra.nombres !== 'Tormenta,Inducción,Efecto punta,Campo,Avalancha,Brillo') mal(`San Telmo: la línea de tiempo tiene los nombres «${extra.nombres}»`);
    if (extra.sonido || extra.boton !== 'false') mal('San Telmo: el sonido debería empezar apagado');
    if (extra.etiquetas !== 3) mal('San Telmo: faltan las etiquetas sobre el título');
    if ((await page.locator('.fen-historia li').count()) < 3) mal('San Telmo: falta «Un poco de historia»');
    await page.click('#ant'); if ((await lee()).paso !== 4) mal('San Telmo: «Anterior» no vuelve atrás');
    await page.click('#puntos button >> nth=2'); r = await lee();
    if (r.paso !== 2 || !r.mathml) mal('San Telmo: el botón del paso 3 no lleva a él o el texto no tiene fórmulas');
    await page.keyboard.press('ArrowRight'); if ((await lee()).paso !== 3) mal('San Telmo: la flecha → no pasa de paso');
    // sin parar: el paso avanza solo (aquí se acorta el tiempo del paso)
    await page.click('#play');
    await page.evaluate(() => FenomenoApp.ve(0));
    await page.waitForTimeout(9400);
    if ((await lee()).paso < 1) mal('San Telmo: no pasa solo al siguiente paso');
    if ((await page.locator('.fen-rel a.fen-abrir').count()) !== 1 || (await page.locator('.fen-rel math').count()) < 2) mal('San Telmo: falta el recuadro de la herramienta con sus fórmulas y su enlace');
    // el enlace deja el ejercicio en el estado de Electrostática
    if ((await page.getAttribute('#abrir', 'href')) !== '../../electromagnetismo/electrostatica/') mal('San Telmo: el enlace no lleva a Electrostática');
    // con file:// una carpeta no abre su index.html: se apunta al archivo para seguir el enlace
    await page.$eval('#abrir', (a) => a.setAttribute('href', a.getAttribute('href') + 'index.html'));
    await Promise.all([page.waitForEvent('load'), page.click('#abrir')]);
    await page.waitForSelector('.bib .bib-acc');
    await page.waitForTimeout(300);
    const e = await page.evaluate(() => ({ titulo: document.querySelector('#title').value, inc: document.querySelector('#unknown').textContent, err: (() => { const x = document.querySelector('#errors'); return x && !x.hidden ? x.textContent : ''; })() }));
    if (!e.titulo.includes('San Telmo') || e.err) mal(`San Telmo: Electrostática no abre el ejercicio (${JSON.stringify(e)})`);
    // la página de Electrostática enlaza el fenómeno
    if (!(await page.locator('.vida-real a[href="../../fenomenos/fuego-san-telmo/"]').count())) mal('Electrostática: falta el enlace «En la vida real» al Fuego de San Telmo');
    await page.evaluate(() => localStorage.clear());
    // modo oscuro y móvil
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(url);
    await page.waitForTimeout(600);
    const m = await page.evaluate(() => ({ ancho: document.documentElement.scrollWidth, fondo: getComputedStyle(document.body).backgroundColor, alto: document.querySelector('#escena').getBoundingClientRect().height }));
    if (m.ancho > 390) mal(`San Telmo: a 390 px la página se sale (${m.ancho} px)`);
    if (m.fondo === 'rgb(238, 241, 238)') mal('San Telmo: el modo oscuro no cambia el fondo');
    if (!(m.alto >= 200)) mal(`San Telmo: la animación mide ${m.alto} px de alto en el móvil`);
    await page.close();
    if (consola.length) mal('San Telmo: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log('  ✓ Fuego de San Telmo: avance solo, parar, anterior, siguiente, línea de tiempo y flechas, dato destacado, «Pruébalo tú», sonido apagado, recuadro con enlace que abre Electrostática con los datos, modo oscuro y 390 px');
  };
};
