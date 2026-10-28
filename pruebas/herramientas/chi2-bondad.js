/* Comprobación de chi2-bondad: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo chi2-bondad ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'chi2-bondad', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Chi2Bondad · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano
    cerca(r('coche').v, 15, 1e-12, 'velocidad del coche');
    cerca(r('luz').v, 1.496e11 / 499, 1e-3, 'velocidad de la luz');
    for (const [sc, q] of [[{ s: '', t: '1' }, 'falta la distancia'], [{ s: '1', t: '0' }, 'tiempo cero']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Chi2Bondad: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Chi2Bondad: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'estadistica', 'chi2-bondad', 'index.html'));
    await page.waitForFunction(() => window.Chi2BondadApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('chi2-bondad').current) mal(`Chi2Bondad: la página muestra la versión «${ver}», se esperaba ${Version.de('chi2-bondad').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => Chi2BondadApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Chi2Bondad · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Chi2Bondad · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.fill('#f-t', '0');
    if (await page.locator('#error').isHidden()) mal('Chi2Bondad: un tiempo cero no muestra el error');
    await page.close();
    if (consola.length) mal('Chi2Bondad: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Chi2Bondad: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
