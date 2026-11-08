/* Comprobación de series: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo series ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'series', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Series · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    const ver = (c, v, ab, S, tol, q) => { const x = r(c); if (x.veredicto !== v) mal(`Series · ${q}: sale «${x.veredicto}» en vez de «${v}»`); if (ab !== undefined && x.absoluta !== ab) mal(`Series · ${q}: absoluta ${x.absoluta} en vez de ${ab}`); if (S !== undefined && !(Math.abs((x.suma ?? NaN) - S) <= tol)) mal(`Series · ${q}: suma ${x.suma} en vez de ${S}`); };
    // calculado a mano: Σ1/2ⁿ = 1; ζ(2) = π²/6; −ln 2; e² (desde n = 0); −π²/12
    ver('geometrica', 'converge', true, 1, 1e-12, 'geométrica');
    ver('armonica', 'diverge', false, undefined, 0, 'armónica');
    ver('basilea', 'converge', true, Math.PI ** 2 / 6, 1e-6, 'Σ1/n²');
    ver('alterna', 'converge', false, -Math.LN2, 1e-5, 'armónica alternada');
    ver('cociente', 'converge', true, Math.E ** 2, 1e-12, 'Σ2ⁿ/n!');
    ver('necesaria', 'diverge', false, undefined, 0, 'n/(2n+1)');
    ver('factorial-potencia', 'converge', true, 1.8798538621, 1e-9, 'Σn!/nⁿ');
    ver('alterna-abs', 'converge', true, -(Math.PI ** 2) / 12, 1e-6, 'Σ(−1)ⁿ/n²');
    for (const [an, v] of [['1/(n ln n)', 'indeterminado'], ['1/n^1,5', 'converge'], ['1/sqrt(n)', 'diverge'], ['n^2/2^n', 'converge'], ['(1+1/n)^n', 'diverge'], ['3^n/n!', 'converge']]) {
      const x = C.resolver({ an, n0: '2' });
      if (x.veredicto !== v) mal(`Series · ${an}: sale «${x.veredicto}» en vez de «${v}»`);
    }
    // SE-2: serie p con exponente muy cerca de 1 (potencia exacta) y casos que solo se estiman
    for (const [an, v] of [['1/n^1.0001', 'converge'], ['1/n^1.01', 'converge'], ['1/n^0.9999', 'diverge'], ['1/(n+1)', 'diverge'], ['1/(n^1.01+1)', 'indeterminado'], ['1/(n^2+n)', 'converge']]) {
      const x = C.resolver({ an, n0: '1' });
      if (x.veredicto !== v) mal(`Series · ${an}: sale «${x.veredicto}» en vez de «${v}»`);
    }
    if (!(Math.abs(C.resolver({ an: '1/n^2', n0: '1' }).suma - Math.PI ** 2 / 6) < 1e-6)) mal('Series · Σ1/n² ya no suma π²/6');
    if (Math.abs(C.resolver({ an: 'n^2/2^n', n0: '2' }).suma - 5.5) > 1e-9) mal('Series · Σ n²/2ⁿ desde 2 debería sumar 5,5');
    for (const [sc, q] of [[{ an: '', n0: '1' }, 'falta aₙ'], [{ an: '1/(n-3)', n0: '1' }, 'aₙ no definido en n = 3'], [{ an: '1/n', n0: '1,5' }, 'n0 no entero'], [{ an: '1/z', n0: '1' }, 'variable desconocida']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Series: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Series: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'matematicas', 'series', 'index.html'));
    await page.waitForFunction(() => window.SeriesApp);
    await require('./comun/exportar.js')(page, mal, 'series', { lienzo: '#grafica', datos: true });
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('series').current) mal(`Series: la página muestra la versión «${ver}», se esperaba ${Version.de('series').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => SeriesApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Series · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Series · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.fill('#f-an', '');
    if (await page.locator('#error').isHidden()) mal('Series: un término general vacío no muestra el error');
    await page.close();
    if (consola.length) mal('Series: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Series: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
