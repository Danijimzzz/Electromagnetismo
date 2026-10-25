/* Comprobación de plantilla: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo plantilla ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'plantilla', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Plantilla · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano
    cerca(r('coche').v, 15, 1e-12, 'velocidad del coche');
    cerca(r('luz').v, 1.496e11 / 499, 1e-3, 'velocidad de la luz');
    for (const [sc, q] of [[{ s: '', t: '1' }, 'falta la distancia'], [{ s: '1', t: '0' }, 'tiempo cero']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Plantilla: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Plantilla: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'asignatura', 'plantilla', 'index.html'));
    await page.waitForFunction(() => window.PlantillaApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('plantilla').current) mal(`Plantilla: la página muestra la versión «${ver}», se esperaba ${Version.de('plantilla').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => PlantillaApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Plantilla · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Plantilla · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.fill('#f-t', '0');
    if (await page.locator('#error').isHidden()) mal('Plantilla: un tiempo cero no muestra el error');
    await page.close();
    if (consola.length) mal('Plantilla: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Plantilla: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
