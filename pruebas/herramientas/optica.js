/* Comprobación de optica: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo optica ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'optica', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Optica · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano (1/s + 1/s′ = 1/f, m = −s′/s)
    const v = (c, sp, m) => { cerca(r(c).sp, sp, 1e-9, `${c}: s′`); cerca(r(c).m, m, 1e-9, `${c}: aumento`); };
    v('lupa', -15, 2.5);            // 1/10 − 1/6 = −1/15
    v('proyector', 15, -0.5);       // 1/10 − 1/30 = 1/15
    v('mirilla', -120 / 11, 3 / 11); // −1/15 − 1/40 = −11/120
    v('afeitado', -24, 1.6);        // 1/40 − 1/15 = −1/24
    v('maquillaje', 100 / 3, -2 / 3); // 1/20 − 1/50 = 3/100
    v('retrovisor', -600 / 23, 3 / 23); // −1/30 − 1/200 = −23/600
    cerca(r('proyector').hp, -1, 1e-9, 'altura de la imagen del proyector');
    cerca(r('lupa').potencia, 10, 1e-9, 'potencia de la lupa (f = 10 cm → 10 D)');
    cerca(r('afeitado').radio, 80, 1e-9, 'radio del espejo de afeitar');
    if (!r('proyector').real || r('proyector').derecha || r('proyector').tam !== 'menor') mal('Optica: el proyector debe dar imagen real, invertida y menor');
    if (r('lupa').real || !r('lupa').derecha || r('lupa').tam !== 'mayor') mal('Optica: la lupa debe dar imagen virtual, derecha y mayor');
    if (!r('retrovisor').derecha || r('retrovisor').real) mal('Optica: el retrovisor debe dar imagen virtual y derecha');
    { const o = C.resolver({ tipo: 'concavo', f: '20', s: '20', h: '1' }); if (!o.enfoque || isFinite(o.sp)) mal('Optica: objeto en el foco debe dar imagen en el infinito'); }
    { const o = C.resolver({ tipo: 'convergente', f: '10', s: '20', h: '1' }); cerca(o.sp, 20, 1e-9, 's′ en 2f'); cerca(o.m, -1, 1e-9, 'aumento en 2f'); if (o.tam !== 'igual') mal('Optica: en 2f la imagen es del mismo tamaño'); }
    for (const [sc, q] of [[{ tipo: 'convergente', f: '', s: '1', h: '1' }, 'falta la focal'], [{ tipo: 'convergente', f: '1', s: '0', h: '1' }, 'objeto en 0'], [{ tipo: '', f: '1', s: '1', h: '1' }, 'sin tipo']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Optica: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Optica: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'fisica', 'optica', 'index.html'));
    await page.waitForFunction(() => window.OpticaApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('optica').current) mal(`Optica: la página muestra la versión «${ver}», se esperaba ${Version.de('optica').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => OpticaApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Optica · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Optica · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.fill('#f-s', '0');
    if (await page.locator('#error').isHidden()) mal('Optica: una distancia cero no muestra el error');
    await page.close();
    if (consola.length) mal('Optica: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Optica: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
