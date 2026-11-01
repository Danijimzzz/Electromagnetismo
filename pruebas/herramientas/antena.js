/* Comprobación de antena: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo antena ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'antena', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Antena · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores conocidos: media onda 73,13 Ω y D = 1,641; corto 80π²(L/λ)² y D = 1,5; λ completa ≈ 199 Ω
    const m = r('media'), c = r('corto'), o = r('onda');
    cerca(m.lam, 299792458 / 1e8, 1e-9, 'λ a 100 MHz');
    cerca(m.Rrad, 73.13, 0.1, 'Rrad de media onda'); cerca(m.D, 1.641, 0.002, 'D de media onda'); cerca(m.dBi, 2.15, 0.01, 'dBi de media onda'); cerca(m.hpbw, 78, 0.3, 'ancho de haz de media onda');
    cerca(m.Prad, 0.5 * m.Rrad * 4, 1e-9, 'Prad = ½ R I²'); cerca(m.E, 376.73 * 2 * 1 / (2 * Math.PI * 1000), 2e-3, 'E en θ = 90° (F = 1)');
    cerca(c.Rrad, 80 * Math.PI ** 2 * (0.1 / c.lam) ** 2, 2e-3, 'Rrad del dipolo corto (80π², con η = 120π)'); cerca(c.D, 1.5, 1e-4, 'D del dipolo corto'); cerca(c.hpbw, 90, 0.3, 'ancho de haz del corto');
    cerca(c.E, 376.73 * 1 * Math.PI * (0.1 / c.lam) * Math.sin(Math.PI / 3) / (2 * Math.PI * 100), 1e-6, 'E del dipolo corto en 60°');
    cerca(o.Rrad, 199, 1.5, 'Rrad del dipolo de onda completa'); cerca(r('tres-medios').thMax, 137.4, 0.5, 'dirección del máximo de 3λ/2');
    for (const [sc, q] of [[{ ...C.ejemplos[0].sc, f: '' }, 'falta la frecuencia'], [{ ...C.ejemplos[0].sc, r: '0' }, 'distancia cero'], [{ ...C.ejemplos[1].sc, L: '2' }, 'dipolo corto demasiado largo'], [{ ...C.ejemplos[0].sc, th: '200' }, 'ángulo fuera de rango']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Antena: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Antena: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'antena', 'index.html'));
    await page.waitForFunction(() => window.AntenaApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('antena').current) mal(`Antena: la página muestra la versión «${ver}», se esperaba ${Version.de('antena').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => AntenaApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Antena · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Antena · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.fill('#f-r', '0');
    if (await page.locator('#error').isHidden()) mal('Antena: una distancia cero no muestra el error');
    await page.close();
    if (consola.length) mal('Antena: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Antena: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
