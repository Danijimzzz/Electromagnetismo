/* Comprobación de laplace: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo laplace ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const LapC = require(path.join(fuente, 'laplace', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Laplace · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => LapC.resolver(LapC.ejemplos.find((e) => e.clave === c).sc);
    for (const e of LapC.ejemplos) { try { const x = LapC.resolver(e.sc); if (x.pasos.length < 3) mal(`Laplace · ${e.clave}: desarrollo corto`); } catch (err) { mal(`Laplace · ${e.clave}: ${err.message}`); } }
    // resultados como en clase
    const igual = (a, b, q) => { if (a !== b) mal(`Laplace · ${q}: sale «${a}», se esperaba «${b}»`); };
    igual(r('basica').Ftxt, '{6}/{s^{3}} + {2}/{s + 4} − {5}/{s}', '3t² + 2e^(−4t) − 5');
    igual(r('tsen').Ffact, '{2 s}/{(s^{2} + 1)^{2}}', 't sen t');
    igual(r('hiper').Ftxt, '{2}/{(s − 3)^{3}} + {s}/{s^{2} − 4}', 't² e^(3t) + cosh 2t');
    igual(r('simples').txt, 'e^{−3 t} + 2 e^{−t}', 'polos simples');
    igual(r('doble').txt, '−5 e^{−t} − 4 t e^{−t} + 5', 'polo doble');
    igual(r('complejos').txt, '2 e^{−2 t} cos (3 t) − {1}/{3} e^{−2 t} sen (3 t)', 'polos complejos');
    igual(r('escalon').txt, '1 − cos (2 t)', '4/(s(s² + 4))');
    igual(r('edo-resonancia').txt, '{1}/{2} sen t − {1}/{2} t cos t', 'resonancia');
    igual(r('edo-1').txt, '2 e^{−2 t} − 1 + 2 t', 'y′ + 2y = 4t');
    if (r('doble').lim.fin !== 5 || r('simples').lim.ini !== 3 || r('escalon').lim.fin !== null) mal('Laplace: valores inicial y final mal');
    // la directa es la integral de e^(−st) f(t), y su inversa vuelve a f(t)
    for (const e of LapC.ejemplos.filter((q) => q.sc.modo === 'directa')) {
      const x = LapC.resolver(e.sc), s0 = x.conv + 1.5, T = 40 / (s0 - x.conv), n = 20000;
      let I = 0; for (let i = 0; i <= n; i++) { const t = (T * i) / n, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; I += w * Math.exp(-s0 * t) * x.f(t); }
      // las deltas suman su e^{−as} aparte
      const dl = (x.deltas || []).reduce((v, q) => v + q.c * Math.exp(-q.a * s0), 0);
      cerca((I * T) / n / 3 + dl, x.Fval ? x.Fval(s0) : LapC.pVal(x.F.n, s0) / LapC.pVal(x.F.d, s0), x.saltos ? 1e-4 : 1e-6, `${e.clave}: F(${s0}) frente a la integral`);
      const inv = LapC.inversa({ F: x.Fcomun.replace(/\{/g, '(').replace(/\}/g, ')').replace(/−/g, '-') });
      for (const t of [0.2, 1.1, 2.5]) cerca(inv.f(t), x.f(t), 1e-8, `${e.clave}: la inversa no vuelve a f(${t})`);
    }
    for (const F of ['(6s^2 - 2)/(s^2 + 1)^3', '6/(s + 2)^4', '(s + 1)/((s + 1)^2 + 4)^2', '(2s^2 + 3)/(s^3 - s)', '1/(s^2 (s - 1)^2)']) {
      // f(t) cumple que su transformada numérica es F(s)
      const x = LapC.inversa({ F }), s0 = 3, T = 40, n = 40000, Fs = LapC.racional(Expr.lee(F, 'F', ['s']));
      let I = 0; for (let i = 0; i <= n; i++) { const t = (T * i) / n, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; I += w * Math.exp(-s0 * t) * x.f(t); }
      cerca((I * T) / n / 3, LapC.pVal(Fs.n, s0) / LapC.pVal(Fs.d, s0), 1e-6, `inversa de ${F}`);
    }
    // las soluciones de las EDOs cumplen la ecuación y las condiciones iniciales
    for (const e of LapC.ejemplos.filter((q) => q.sc.modo === 'edo')) {
      const x = LapC.resolver(e.sc), h = 1e-4, d1 = (t) => (x.f(t + h) - x.f(t - h)) / (2 * h), d2 = (t) => (x.f(t + h) - 2 * x.f(t) + x.f(t - h)) / (h * h);
      cerca(x.f(0), x.y0, 1e-9, `${e.clave}: y(0)`);
      if (x.orden === 2) cerca((x.f(h) - x.f(0)) / h, x.v0, 1e-3, `${e.clave}: y′(0)`);
      if (/δ/.test(e.sc.g)) continue;
      for (const t of [0.4, 1.3, 2.2]) cerca(x.a * d2(t) + x.b * d1(t) + x.c * x.f(t), x.g(t), 1e-5, `${e.clave}: la solución no cumple la ecuación en t = ${t}`);
    }
    // escalones, deltas, trozos, convolución y sistemas
    igual(r('trozos').Ftxt, '{1}/{s^{2}} − 2 {e^{−2 s}}/{s^{2}} + {e^{−4 s}}/{s^{2}}', 'triángulo a trozos');
    igual(r('retrasada').Ftxt, '{e^{−s}}/{s^{2}} + 2 {e^{−3 s}}/{s}', '(t − 1) u(t − 1) + 2 u(t − 3)');
    igual(r('delta').Ftxt, '3 e^{−s} + e^{−2} {e^{−2 s}}/{s + 1}', '3δ(t − 1) + e^(−t) u(t − 2)');
    igual(r('pulso').txt, 't − (t − 1) u(t − 1)', '(1 − e^(−s))/s²');
    igual(r('con-delta').txt, '2 e^{−t} + δ(t)', '(s + 3)/(s + 1)');
    igual(r('edo-impulso').txt, 'cos t + sen (t − π) u(t − π)', 'y″ + y = δ(t − π)');
    igual(r('conv-sen').txt, '{1}/{2} t sen t', 'sen t * cos t');
    igual(r('sis-oscila').txt + ' | ' + r('sis-oscila').txt2, 'cos t | −sen t', 'x′ = y, y′ = −x');
    igual(r('edo-1').htxt, 'e^{−2 t}', 'respuesta al impulso de y′ + 2y');
    {
      const x = r('edo-impulso');
      // tras el impulso, y′ salta en 1: y′(π⁺) − y′(π⁻) = 1
      const h = 1e-5, d = (t) => (x.f(t + h) - x.f(t - h)) / (2 * h);
      cerca(d(Math.PI + 1e-3) - d(Math.PI - 1e-3), 1, 1e-2, 'edo-impulso: el salto de y′ en t = π');
    }
    for (const e of LapC.ejemplos.filter((q) => q.sc.modo === 'convolucion')) {
      // (f * g)(t) = ∫₀ᵗ f(τ) g(t − τ) dτ por Simpson
      const x = LapC.resolver(e.sc);
      for (const t of [0.7, 1.6, 2.5]) { const n = 4000; let I = 0; for (let i = 0; i <= n; i++) { const u = (t * i) / n, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; I += w * x.f1(u) * x.g1(t - u); } cerca(x.f(t), (I * t) / n / 3, 1e-4, `${e.clave}: la convolución en t = ${t}`); }
    }
    for (const e of LapC.ejemplos.filter((q) => q.sc.modo === 'sistema')) {
      const x = LapC.resolver(e.sc), h = 1e-5, d = (f, t) => (f(t + h) - f(t - h)) / (2 * h);
      cerca(x.f(0), x.x0, 1e-9, `${e.clave}: x(0)`); cerca(x.f2(0), x.y0, 1e-9, `${e.clave}: y(0)`);
      for (const t of [0.3, 1.1]) { cerca(d(x.f, t), x.a * x.f(t) + x.b * x.f2(t) + x.fx(t), 1e-5, `${e.clave}: x′ en t = ${t}`); cerca(d(x.f2, t), x.c * x.f(t) + x.d * x.f2(t) + x.gy(t), 1e-5, `${e.clave}: y′ en t = ${t}`); }
    }
    for (const [sc, q] of [[{ modo: 'directa', f: '' }, 'sin f'], [{ modo: 'directa', f: 'tg(t)' }, 'tg t'], [{ modo: 'directa', f: 's t' }, 'f con s'], [{ modo: 'inversa', F: '(s^2 + 1)/(s + 1)' }, 'F impropia'], [{ modo: 'inversa', F: 's + 3' }, 'F sin denominador'], [{ modo: 'inversa', F: '1/(s + t)' }, 'F con t'], [{ modo: 'edo', orden: '2', a: '0', b: '1', c: '1', g: '0', y0: '1', v0: '0' }, 'a = 0'], [{ modo: 'edo', orden: '2', a: '1', b: '0', c: '1', g: 'ln(t)', y0: '1', v0: '0' }, 'g sin transformada de la tabla'], [{ modo: 'directa', f: 'u(2 - t)' }, 'u(a − t)'], [{ modo: 'inversa', F: 'e^(2s)/s' }, 'e^(as) con a > 0'], [{ modo: 'directa', f: 't si 2 ≤ t < 1' }, 'trozo al revés'], [{ modo: 'sistema', a11: '1', a12: 'x', a21: '0', a22: '1', f: '0', g: '0', x0: '1', y0: '0' }, 'sistema con letra']]) {
      let ok = false; try { LapC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Laplace: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Transformada de Laplace: ${LapC.ejemplos.length} ejemplos, resultados como en clase, directa frente a la integral, inversa de ida y vuelta (polos dobles y complejos), EDOs que cumplen la ecuación, escalones, deltas y trozos, convolución frente a la integral, sistemas que cumplen sus ecuaciones y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'matematicas', 'laplace', 'index.html'));
      await page.waitForFunction(() => window.LaplaceApp);
      const antes = fallos;
      const verL = (await page.locator('#ver').textContent()).trim();
      if (verL !== Version.de('laplace').current) mal(`Laplace: la página muestra la versión «${verL}», se esperaba ${Version.de('laplace').current}`);
      for (const e of LapC.ejemplos) {
        await page.evaluate((c) => LaplaceApp.abrirEjemplo(c), e.clave);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length + document.querySelectorAll('#resumen math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, modo: document.querySelector('#modo').value }));
        if (r.err || r.pasos < 3 || r.res < 1) mal(`Laplace · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`Laplace · ${e.clave}: el desarrollo no sale en MathML`);
        if (r.modo !== e.sc.modo) mal(`Laplace · ${e.clave}: el modo no cuadra`);
      }
      await page.evaluate(() => LaplaceApp.abrirEjemplo('doble'));
      if (!(await page.locator('#resumen').textContent()).includes('1,68909')) mal('Laplace: f(1) del polo doble no sale 1,68909 en la página');
      await page.fill('#f-F', '(s^2 + 1)/(s + 1)');
      if (await page.locator('#error').isHidden()) mal('Laplace: una F(s) impropia no da error');
      await page.fill('#f-F', '1/(s^2 + 2s + 2)');
      if (!(await page.locator('#error').isHidden()) || !(await page.locator('#resumen').textContent()).includes('sen')) mal('Laplace: 1/(s² + 2s + 2) no da un seno amortiguado');
      await page.selectOption('#modo', 'edo');
      if ((await page.locator('#f-v0').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Laplace: al pasar a EDO no salen sus campos o da error');
      await page.selectOption('#f-orden', '1');
      if ((await page.locator('#f-v0').count()) !== 0 || !(await page.locator('#error').isHidden())) mal('Laplace: en primer orden sigue pidiendo y′(0) o da error');
      await page.click('#animar'); await page.waitForTimeout(500); await page.click('#animar');
      for (let i = 0; i < 15; i++) { await page.evaluate(() => LaplaceApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Laplace: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => LaplaceApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Laplace: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Transformada de Laplace: ${LapC.ejemplos.length} ejemplos con MathML, F(s) impropia, cambio de modo y de orden, animación y ejercicios al azar sin errores de consola`);
    }
  };
};
