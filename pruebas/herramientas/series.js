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
    for (const [an, v] of [['1/(n ln n)', 'diverge'], ['1/n^1,5', 'converge'], ['1/sqrt(n)', 'diverge'], ['n^2/2^n', 'converge'], ['(1+1/n)^n', 'diverge'], ['3^n/n!', 'converge']]) {
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
    // SE-1 · criterio de la integral. A mano: ∫₂^∞ dx/(x ln x) = [ln ln x] = ∞; ∫₂^∞ dx/(x ln²x) = [−1/ln x] = 1/ln 2;
    // ∫₁^∞ x e^(−x²) dx = [−e^(−x²)/2] = 1/(2e); ∫₁^∞ dx/(x² + 1) = π/2 − π/4; ∫₃^∞ dx/(x ln x (ln ln x)²) = 1/ln ln 3
    const ig = (an, n0) => C.resolver({ an, n0: String(n0) });
    for (const [an, n0, v, I, S, tol] of [['1/(n ln(n))', 2, 'diverge'], ['1/(n ln(n)^2)', 2, 'converge', 1 / Math.LN2, 2.10974280123689, 1e-9], ['n e^(-n^2)', 1, 'converge', 1 / (2 * Math.E), 0.404881398571, 1e-10],
      ['1/(n^2+1)', 1, 'converge', Math.PI / 4, (Math.PI / Math.tanh(Math.PI) - 1) / 2, 1e-6], ['1/(n ln(n) ln(ln(n))^2)', 3, 'converge', 1 / Math.log(Math.log(3))], ['1/(n ln(n) ln(ln(n)))', 3, 'diverge'], ['1/(n sqrt(ln(n)))', 2, 'diverge'], ['-1/(n ln(n))', 2, 'diverge'], ['ln(n)/n', 1, 'diverge'], ['1/(n ln(n)^1.01)', 2, 'converge']]) {
      const x = ig(an, n0), q = x.integral;
      if (x.veredicto !== v || !q || q.v !== v || !q.exacta) mal(`Series · integral de ${an}: sale «${x.veredicto}» (${JSON.stringify(q)}) en vez de «${v}»`);
      if (I !== undefined) cerca(q.I, I, 1e-9, `integral de ${an}`);
      if (S !== undefined) cerca(x.suma, S, tol, `suma de ${an}`);
      if (!x.pasos.some((ps) => ps.t === 'Criterio de la integral' && ps.html.includes('Primitiva'))) mal(`Series · ${an}: falta el paso del criterio de la integral con la primitiva`);
    }
    // el resto queda entre las dos integrales: la suma de 1/(n ln² n) no se alcanza sumando términos (hasta 20 000 faltan 0,1)
    { let t = 0; for (let n = 2; n <= 20000; n++) t += 1 / (n * Math.log(n) ** 2); if (!(2.10974280123689 - t > 0.09)) mal('Series: la suma parcial de 1/(n ln² n) ya llega sola'); }
    // la integral no pisa a los criterios que ya decidían ni se aplica donde no toca; una cuenta que se desborda (ln x − ln(x² + 1)/2) no es un infinito
    cerca(ig('1/(n^3+n)', 1).suma, 0.671865985524, 1e-6, 'suma de 1/(n³ + n)');
    for (const [an, n0, v] of [['1/(n^3+n)', 1, 'converge'], ['ln(n)/n^2', 1, 'converge'], ['1/ln(n)', 2, 'diverge'], ['n^2 e^(-n)', 1, 'converge'], ['2^n/n!', 0, 'converge'], ['(-1)^n/n', 1, 'converge']]) { const x = ig(an, n0); if (x.veredicto !== v) mal(`Series · ${an}: sale «${x.veredicto}» en vez de «${v}»`); }
    if (ig('2^n/n!', 0).integral || ig('(-1)^n/n', 1).integral || ig('1/2^n', 1).integral) mal('Series: el criterio de la integral se aplica con factoriales, signos alternos o una geométrica');
    // sin primitiva elemental: estimación numérica con aviso, y no se presenta como exacta
    const ne = ig('sen(1/n)^2', 1);
    if (!ne.integral || ne.integral.exacta || !ne.pasos.some((ps) => ps.html.includes('estima numéricamente'))) mal('Series · sen²(1/n): la integral sin primitiva no avisa de que es una estimación');
    if (fallos === antes) console.log(`  ✓ Series: ${C.ejemplos.length} ejemplos, criterio de la integral y errores`);
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
