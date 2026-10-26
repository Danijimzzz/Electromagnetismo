/* Comprobación de magnetostatica: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo magnetostatica ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  // magnetostática: los ejemplos contra pruebas/esperados-magnetostatica.json
  const Magneto = require(path.join(fuente, 'magnetostatica', 'fisica.js')), MagEjemplos = require(path.join(fuente, 'magnetostatica', 'ejemplos.js'));
  const resolverMag = (M, E) => Object.fromEntries(E.lista.map((e) => { const o = M.run({ modo: 'sym', ...e.escena() }); return [e.clave, { titulo: e.titulo, errores: o.errors, resultados: o.results.map((r) => (r.error ? 'ERROR: ' + r.error : r.res)) }]; }));
  const espMagF = path.join(__dirname, 'esperados-magnetostatica.json');
  const magNodo = resolverMag(Magneto, MagEjemplos);
  if (args.includes('--actualizar') || !fs.existsSync(espMagF)) { fs.writeFileSync(espMagF, JSON.stringify(magNodo, null, 1) + '\n'); console.log('  ✓ esperados-magnetostatica.json reescrito'); }
  const espMag = JSON.parse(fs.readFileSync(espMagF, 'utf8'));
  function compararMag(obt, donde) {
    const antes = fallos;
    for (const [k, e] of Object.entries(espMag)) {
      const o = obt[k];
      if (!o) { mal(`${donde}: falta el ejemplo ${e.titulo}`); continue; }
      if (o.errores.length) mal(`${donde} · ${e.titulo}: ${o.errores.join(' · ')}`);
      e.resultados.forEach((r, i) => { if (o.resultados[i] !== r) mal(`${donde} · ${e.titulo} (pregunta ${i + 1})\n      esperado: ${r}\n      obtenido: ${o.resultados[i]}`); });
      o.resultados.forEach((r, i) => { if (r.startsWith('ERROR: ')) mal(`${donde} · ${e.titulo} (pregunta ${i + 1}): ${r}`); });
    }
    if (fallos === antes) console.log(`  ✓ ${donde}: ${Object.keys(espMag).length} ejemplos de magnetostática iguales a esperados-magnetostatica.json`);
  }
  compararMag(magNodo, 'Node · Magnetostática');

  return async (browser) => {
    // magnetostática: mismos resultados en la página, cada ejemplo abierto sin errores de consola
    {
      const { page, consola } = await pagina(browser, 1300, 900);
      await page.goto('file://' + path.join(publico, 'electromagnetismo', 'magnetostatica', 'index.html'));
      await page.waitForFunction(() => window.MagApp);
      compararMag(await page.evaluate(`(${resolverMag})(Magneto, MagEjemplos)`), 'Chromium · Magnetostática');
      for (const k of Object.keys(espMag)) {
        await page.evaluate((c) => MagApp.abrirEjemplo(c), k);
        const warn = await page.locator('.result .warn').allTextContents();
        if (warn.length) mal(`Magnetostática · ${k}: ${warn.join(' · ')}`);
      }
      // perfil de |B|, mapa de color y líneas de campo
      await page.evaluate(() => MagApp.abrirEjemplo('cilindro'));
      if ((await page.locator('svg.perfil path').count()) < 1) mal('Magnetostática: el perfil de |B| del cilindro no sale');
      await page.check('#lineas'); await page.selectOption('#plano', 'xz'); await page.check('#mapa'); await page.uncheck('#flechas');
      await page.evaluate(() => MagApp.abrirEjemplo('disco')); await page.check('#mapa');
      if (!(await page.evaluate(() => MagApp.escena.vista.mapa && MagApp.escena.vista.lineas))) mal('Magnetostática: el mapa de color o las líneas de campo no se guardan en la vista');
      const ver = await page.locator('#ver').textContent();
      if (ver !== Version.de('magnetostatica').current) mal(`Magnetostática: la página muestra la versión «${ver}», se esperaba ${Version.de('magnetostatica').current}`);
      await page.close();
      if (consola.length) mal('Magnetostática: consola del navegador:\n      ' + consola.join('\n      '));
    }
  };
};
