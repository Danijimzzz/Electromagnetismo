/* Comprobación de edos: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo edos ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const EDOsC = require(path.join(fuente, 'edos', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`EDOs · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => EDOsC.resolver(EDOsC.ejemplos.find((e) => e.clave === c).sc);
    for (const e of EDOsC.ejemplos) { try { const x = EDOsC.resolver(e.sc); if (x.pasos.length < 3) mal(`EDOs · ${e.clave}: desarrollo corto`); } catch (err) { mal(`EDOs · ${e.clave}: ${err.message}`); } }
    // ED-1: y′ = √y, y(0) = 0 tiene también y = x²/4 (∂f/∂y no acotada): hay que avisar de que no es única; y′ = xy, y(0) = 0 sí lo es
    for (const [fx, noUnica, otra] of [['sqrt(y)', true, /x\}\/\{2\}\)\^\{2\}/], ['y^(1/3)', true, /2 x\}\/\{3\}\)\^\{\{3\}\/\{2\}\}/], ['sqrt(y) + x', true, null], ['x*y', false, null], ['y', false, null]]) {
      const x = EDOsC.resolver({ modo: 'primer', f: fx, x0: '0', y0: '0', x1: '3', h: '0,1' });
      if (!!x.noUnica !== noUnica) mal(`EDOs · y′ = ${fx}, y(0) = 0: noUnica = ${x.noUnica}`);
      if (noUnica && !x.pasos.some((q) => q.t === 'Aviso: la solución no es única')) mal(`EDOs · y′ = ${fx}: falta el aviso de unicidad`);
      if (!noUnica && x.pasos.some((q) => /única/.test(q.t))) mal(`EDOs · y′ = ${fx}: avisa de no unicidad sin motivo`);
      if (otra && !otra.test(x.pasos.find((q) => /única/.test(q.t)).html)) mal(`EDOs · y′ = ${fx}: falta la segunda solución`);
    }
    if (EDOsC.ejemplos.some((e) => e.sc.modo === 'primer' && EDOsC.resolver(e.sc).noUnica)) mal('EDOs: algún ejemplo de primer orden avisa de no unicidad');
    // y′ = x + y, y(0) = 1: y = 2eˣ − x − 1; Euler con h = 0,1 a mano: y₁₀ = 3,187485
    const eu = r('euler');
    if (eu.exacta?.txt !== '2 e^{x} − 1 − x') mal(`EDOs: y′ = x + y sale «${eu.exacta?.txt}»`);
    cerca(eu.yEx, 2 * Math.E - 2, 1e-12, 'y(1) exacta'); cerca(eu.yEu, 3.1874849202, 1e-9, 'y(1) con Euler'); cerca(eu.yRK, 2 * Math.E - 2, 1e-7, 'y(1) con RK4');
    if (r('enfriamiento').exacta?.txt !== '70 e^{−{x}/{10}} + 20') mal('EDOs: la ley de enfriamiento no sale 70 e^(−x/10) + 20');
    if (r('forzada').exacta?.txt !== '{e^{−x}}/{2} − {cos x}/{2} + {sen x}/{2}') mal(`EDOs: y′ + y = sen x sale «${r('forzada').exacta?.txt}»`);
    if (r('riccati').exacta) mal('EDOs: da solución exacta de y′ = x − y²');
    if (r('logistica').exacta?.txt !== '{1}/{1 + 9 e^{−x}}') mal(`EDOs: la logística sale «${r('logistica').exacta?.txt}»`);
    if (r('separable').exacta?.txt !== 'e^{{x^{2}}/{2}}') mal(`EDOs: y′ = x y sale «${r('separable').exacta?.txt}»`);
    if (r('exacta').implicita !== 'x^{2} + x y + y^{2} = 1') mal(`EDOs: la exacta sale «${r('exacta').implicita}»`);
    if (r('cauchy').txt !== '{x}/{2} − x^{2} + {x^{3}}/{2}') mal(`EDOs: la de Cauchy-Euler sale «${r('cauchy').txt}»`);
    if (r('variacion').txt !== 'ln |cos x| cos x + x sen x') mal(`EDOs: y″ + y = 1/cos x sale «${r('variacion').txt}»`);
    // segundo orden: soluciones a mano y que cumplen la ecuación
    if (r('resonancia').txt !== '{x sen x}/{2}') mal(`EDOs: y″ + y = cos x sale «${r('resonancia').txt}»`);
    if (r('critico').txt !== '2 e^{−x} + x e^{−x} − 2 + x') mal(`EDOs: y″ + 2y′ + y = x sale «${r('critico').txt}»`);
    if (r('mas').txt !== 'cos (2 x)') mal(`EDOs: y″ + 4y = 0 sale «${r('mas').txt}»`);
    for (const e of EDOsC.ejemplos.filter((q) => q.sc.modo === 'segundo')) {
      const x = EDOsC.resolver(e.sc), g = Expr.lee(e.sc.g);
      cerca(x.y(x.x0), x.y0, 1e-9, `${e.clave}: y(x₀)`); cerca(x.y(x.x0, 1), x.v0, 1e-9, `${e.clave}: y′(x₀)`);
      for (const t of [0.3, 1.1, 2.4]) cerca(x.a * x.y(t, 2) + x.b * x.y(t, 1) + x.c * x.y(t), Expr.valor(g, t), 1e-8, `${e.clave}: la solución no cumple la ecuación en x = ${t}`);
    }
    // sistemas: autovalores y tipo de cada punto crítico
    const si = r('silla').puntos[0]; if (si.tp.nom !== 'punto de silla' || Math.max(...si.ev.l) !== 3 || Math.min(...si.ev.l) !== -1) mal('EDOs: el punto de silla no tiene autovalores 3 y −1');
    if (!r('centro').puntos[0].tp.nom.startsWith('centro') || !r('foco').puntos[0].tp.nom.startsWith('foco estable') || r('nodo').puntos[0].tp.nom !== 'nodo estable') mal('EDOs: no distingue centro, foco y nodo');
    const lv = r('lotka').puntos; if (lv.length !== 2 || lv[1].x !== 3 || lv[1].y !== 2 || !lv[1].tp.nom.startsWith('centro') || lv[0].tp.nom !== 'punto de silla') mal('EDOs: Lotka-Volterra no da la silla en (0, 0) y el centro en (3, 2)');
    if (r('pendulo').puntos.length !== 3) mal('EDOs: el péndulo no da los tres puntos críticos −π, 0 y π');
    for (const c of ['silla', 'centro', 'foco', 'nodo']) { const x = r(c), fin = x.tray[x.tray.length - 1], X = x.sol.X(fin.t); cerca(X[0], fin.Y[0], 1e-6, `${c}: x(t) exacta frente a RK4`); cerca(X[1], fin.Y[1], 1e-6, `${c}: y(t) exacta frente a RK4`); }
    // derivadas parciales de Expresion
    const dy = Expr.deriva(Expr.lee('x y^2 - 2y + sen(x y)', 'f', ['x', 'y']), 'y');
    cerca(Expr.valor(dy, 0.7, { y: 1.3 }), 2 * 0.7 * 1.3 - 2 + 0.7 * Math.cos(0.7 * 1.3), 1e-12, '∂/∂y de x y² − 2y + sen(xy)');
    for (const [sc, q] of [[{ modo: 'primer', f: '', x0: '0', y0: '1', x1: '1', h: '0,1' }, 'sin función'], [{ modo: 'primer', f: 'x', x0: '0', y0: '1', x1: '1', h: '0' }, 'h = 0'], [{ modo: 'primer', f: 'x', x0: '2', y0: '1', x1: '1', h: '0,1' }, 'intervalo al revés'], [{ modo: 'primer', f: 'z + 1', x0: '0', y0: '1', x1: '1', h: '0,1' }, 'otra letra'], [{ modo: 'segundo', a: '0', b: '1', c: '1', g: '0', x0: '0', y0: '1', v0: '0', x1: '5' }, 'a = 0'], [{ modo: 'segundo', a: '1', b: '0', c: '1', g: 'tg x', x0: '0', y0: '1', v0: '0', x1: '5' }, 'g que no es de coeficientes indeterminados'], [{ modo: 'sistema', f: 'y', g: '-x', x0: '1', y0: '0', t1: '0' }, 't = 0'], [{ modo: 'sistema', f: 'ln x', g: 'y', x0: '-1', y0: '0', t1: '2' }, 'punto inicial fuera del dominio']]) {
      let ok = false; try { EDOsC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`EDOs: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Ecuaciones diferenciales: ${EDOsC.ejemplos.length} ejemplos, Euler a mano, soluciones exactas, segundo orden que cumple la ecuación, puntos críticos con su tipo, sistemas lineales exactos frente a RK4 y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'matematicas', 'edos', 'index.html'));
      await page.waitForFunction(() => window.EDOsApp);
      await require('./comun/exportar.js')(page, mal, 'edos', { lienzo: '#grafica', datos: true });
      const antes = fallos;
      const verE = (await page.locator('#ver').textContent()).trim();
      if (verE !== Version.de('edos').current) mal(`EDOs: la página muestra la versión «${verE}», se esperaba ${Version.de('edos').current}`);
      for (const e of EDOsC.ejemplos) {
        await page.evaluate((c) => EDOsApp.abrirEjemplo(c), e.clave);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, modo: document.querySelector('#modo').value, tiempo: !document.querySelector('#tiempo').hidden }));
        if (r.err || r.pasos < 3 || r.res < 1) mal(`EDOs · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`EDOs · ${e.clave}: el desarrollo no sale en MathML`);
        if (r.modo !== e.sc.modo || r.tiempo !== (e.sc.modo === 'sistema')) mal(`EDOs · ${e.clave}: el modo o la gráfica de x(t), y(t) no cuadran`);
      }
      await page.evaluate(() => EDOsApp.abrirEjemplo('euler'));
      if (!(await page.locator('#resumen').textContent()).includes('3,18748')) mal('EDOs: el Euler de y′ = x + y no sale 3,18748 en la página');
      if ((await page.locator('#pasos table.tabla tr').count()) < 9) mal('EDOs: falta la tabla de Euler');
      await page.fill('#f-h', '0,05');
      if (!(await page.locator('#resumen').textContent()).includes('3,3')) mal('EDOs: con h = 0,05 Euler no se acerca a la exacta');
      await page.fill('#f-f', 'x +');
      if (await page.locator('#error').isHidden()) mal('EDOs: una función mal escrita no da error');
      await page.selectOption('#modo', 'sistema');
      if ((await page.locator('#f-g').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('EDOs: al pasar a sistema no salen sus campos o da error');
      const box = await page.locator('#grafica').boundingBox();
      const x0 = await page.locator('#f-x0').inputValue();
      await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.3);
      if ((await page.locator('#f-x0').inputValue()) === x0 || !(await page.locator('#error').isHidden())) mal('EDOs: tocar el diagrama no cambia el punto inicial');
      await page.click('#animar'); await page.waitForTimeout(500); await page.click('#animar');
      for (let i = 0; i < 10; i++) { await page.evaluate(() => EDOsApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`EDOs: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => EDOsApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('EDOs: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Ecuaciones diferenciales: ${EDOsC.ejemplos.length} ejemplos con MathML, tabla de Euler, cambio de paso y de modo, errores, toque en el diagrama, animación y ejercicios al azar sin errores de consola`);
    }
  };
};
