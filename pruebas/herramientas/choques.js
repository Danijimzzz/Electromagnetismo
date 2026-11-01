/* Comprobación de choques: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo choques ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'choques', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Choques · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano
    const ve = (x, y, t, q) => { cerca(x[0], y[0], 1e-9, q + ' x'); cerca(x[1], y[1], 1e-9, q + ' y'); };
    ve(r('elastico-1d').w1, [1, 0], 0, 'elástico 1D, cuerpo 1'); ve(r('elastico-1d').w2, [4, 0], 0, 'elástico 1D, cuerpo 2');
    cerca(r('elastico-1d').perdida, 0, 1e-9, 'elástico: energía perdida');
    ve(r('coches').w1, [8, 0], 0, 'coches pegados'); cerca(r('coches').perdida, 120000, 1e-6, 'coches: energía perdida');
    ve(r('inelastico-1d').w1, [-0.5, 0], 0, 'inelástico e=0,5, cuerpo 1'); ve(r('inelastico-1d').w2, [2.5, 0], 0, 'inelástico e=0,5, cuerpo 2');
    cerca(r('inelastico-1d').perdida, 6.75, 1e-9, 'inelástico: energía perdida');
    ve(r('billar').w1, [0.5, -Math.sqrt(3) / 2], 0, 'billar, cuerpo 1'); ve(r('billar').w2, [1.5, Math.sqrt(3) / 2], 0, 'billar, cuerpo 2');
    cerca(r('billar').w1[0] * r('billar').w2[0] + r('billar').w1[1] * r('billar').w2[1], 0, 1e-9, 'billar: salen perpendiculares');
    for (const [sc, q] of [[{ ...C.ejemplos[0].sc, m1: '' }, 'falta la masa'], [{ ...C.ejemplos[0].sc, v1x: '-3' }, 'no se acercan'], [{ ...C.ejemplos[2].sc, e: '2' }, 'e fuera de rango']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Choques: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Choques: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'fisica', 'choques', 'index.html'));
    await page.waitForFunction(() => window.ChoquesApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('choques').current) mal(`Choques: la página muestra la versión «${ver}», se esperaba ${Version.de('choques').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => ChoquesApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Choques · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Choques · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.fill('#f-m1', '0');
    if (await page.locator('#error').isHidden()) mal('Choques: una masa cero no muestra el error');
    await page.close();
    if (consola.length) mal('Choques: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Choques: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
