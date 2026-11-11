/* Comprobación de taylor: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo taylor ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Expr = require(path.join(fuente, 'matematicas', 'expresion.js'));
  const TaylorC = require(path.join(fuente, 'taylor', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Taylor · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => TaylorC.resolver(TaylorC.ejemplos.find((e) => e.clave === c).sc);
    for (const e of TaylorC.ejemplos) {
      try { const x = TaylorC.resolver(e.sc); if (x.pasos.length < 4) mal(`Taylor · ${e.clave}: desarrollo corto`); if (x.cota != null && !(x.err <= x.cota * (1 + 1e-9) + 1e-15)) mal(`Taylor · ${e.clave}: el error ${x.err} supera la cota ${x.cota}`); }
      catch (err) { mal(`Taylor · ${e.clave}: ${err.message}`); }
    }
    // valores calculados a mano
    const ex = r('exp'); [1, 1, 1 / 2, 1 / 6, 1 / 24].forEach((c, k) => cerca(ex.coef[k], c, 1e-14, `coeficiente ${k} de e^x`));
    cerca(ex.px0, 1 + 0.5 + 0.125 + 0.5 ** 3 / 6 + 0.5 ** 4 / 24, 1e-14, 'P4(0,5) de e^x'); cerca(ex.fx0, Math.sqrt(Math.E), 1e-14, '√e');
    if (ex.pol !== '1 + x + {x^{2}}/{2} + {x^{3}}/{6} + {x^{4}}/{24}') mal(`Taylor: el polinomio de e^x sale «${ex.pol}»`);
    if (r('seno').pol !== 'x − {x^{3}}/{6} + {x^{5}}/{120}') mal('Taylor: el polinomio de sen x no es x − x³/6 + x⁵/120');
    if (!r('seno-pi6').pol.includes('{√3}/{2} (x − {π}/{6})')) mal('Taylor: en π/6 el coeficiente de sen x no sale √3/2');
    cerca(r('raiz').px0, 2 + 0.1 / 4 - 0.01 / 64, 1e-12, '√4,1 con grado 2');
    cerca(r('tangente').coef[5], 2 / 15, 1e-12, 'coeficiente de x⁵ de tg x');
    cerca(r('polinomio').err, 0, 1e-12, 'un polinomio es su propio Taylor');
    for (const c of ['exp', 'seno', 'coseno', 'ln1x', 'geometrica', 'binomica', 'arctg']) if (!r(c).conocido) mal(`Taylor · ${c}: no reconoce el desarrollo conocido`);
    if (r('gauss').conocido || r('tangente').conocido) mal('Taylor: reconoce un desarrollo conocido que no lo es');
    // derivadas simbólicas
    const D = (s, k = 1) => { let n = Expr.lee(s); for (let i = 0; i < k; i++) n = Expr.deriva(n); return Expr.texto(n); };
    const DS = [['x^2 e^x', 1, '2 x e^{x} + x^{2} e^{x}'], ['ln(1+x)', 2, '−{1}/{(1 + x)^{2}}'], ['sen^2 x', 1, '2 sen x cos x'], ['√x', 1, '{1}/{2 √x}'], ['1/(1-x)', 3, '{6}/{(1 − x)^{4}}'], ['x sen x', 2, '2 cos x − x sen x'], ['e^(-x^2)', 1, '−2 x e^{−x^{2}}'], ['tg x', 1, '{1}/{cos^{2} x}'], ['x^3 - 2x + 1', 1, '3 x^{2} − 2']];
    for (const [s, k, t] of DS) { const v = D(s, k); if (v !== t) mal(`Taylor: la derivada ${k} de ${s} sale «${v}» y no «${t}»`); }
    // la serie y la derivada simbólica dan lo mismo que una derivada numérica
    for (const s of ['e^x sen x', 'ln(2 + cos x)', 'arcsen(x/2)', 'x^x', 'senh x / (1 + x^2)', '∛(1 + x)', 'arctg(x^2) - 3 tg x', '2^x', '|x - 3|', 'sec x']) {
      const n = Expr.lee(s), a = 0.7, h = 1e-5, dn = (Expr.valor(n, a + h) - Expr.valor(n, a - h)) / (2 * h);
      cerca(Expr.serie(n, a, 2)[1], dn, 1e-6 * Math.max(1, Math.abs(dn)), `serie de ${s}`);
      cerca(Expr.valor(Expr.deriva(n), a), dn, 1e-6 * Math.max(1, Math.abs(dn)), `derivada de ${s}`);
      cerca(Expr.serie(n, a, 2)[2] * 2, (Expr.valor(n, a + 1e-3) - 2 * Expr.valor(n, a) + Expr.valor(n, a - 1e-3)) / 1e-6, 1e-3 * Math.max(1, Math.abs(dn)), `segunda derivada de ${s}`);
    }
    if (Expr.valor(Expr.lee('2x sen x + 3,5'), 1) !== 2 * Math.sin(1) + 3.5 || Expr.valor(Expr.lee('sen 2x cos x'), 1) !== Math.sin(2) * Math.cos(1)) mal('Taylor: no lee el producto implícito o la coma decimal');
    for (const [sc, q] of [[{ f: '', a: '0', n: '3' }, 'sin función'], [{ f: 'y + 1', a: '0', n: '3' }, 'otra letra'], [{ f: 'ln x', a: '0', n: '3' }, 'ln x en 0'], [{ f: 'sen x', a: '0', n: '26' }, 'grado 26'], [{ f: 'sen x', a: 'x', n: '2' }, 'a con x'], [{ f: '(x + 1', a: '0', n: '2' }, 'paréntesis sin cerrar'], [{ f: '√x', a: '1', n: '2', x0: '−1' }, 'x₀ fuera del dominio']]) {
      let ok = false; try { TaylorC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Taylor: ${q} no da error`);
    }
    // MAT.TA-2 · radio e intervalo de convergencia. A mano: el radio es la distancia de a a la singularidad más cercana (también compleja)
    {
      const S5 = Math.sqrt(5), S2 = Math.SQRT2, PI = Math.PI;
      // [f, a, R, texto de R, intervalo, singularidad (re, |im|)]
      const RAD = [['1/(1+x^2)', '0', 1, 'R = 1', '(−1, 1)', [0, 1]], ['1/(1+x^2)', '1', S2, 'R = √{2}', null, [0, 1]], ['1/(1+x^2)', '2', S5, 'R = √{5}', '(2 − √{5}, 2 + √{5})', [0, 1]], ['1/(1+x^2)', '3', Math.sqrt(10), 'R = √{10}', null, [0, 1]],
        ['1/(x^2-2x+5)', '0', S5, 'R = √{5}', '(−√{5}, √{5})', [1, 2]], ['1/(x^2+2x+10)', '0', Math.sqrt(10), 'R = √{10}', null, [-1, 3]], ['1/(1+x+x^2)', '0', 1, 'R = 1', '(−1, 1)', [-0.5, Math.sqrt(3) / 2]],
        ['ln(x)', '2', 2, 'R = 2', '(0, 4]', [0, 0]], ['ln(1+x)', '0', 1, 'R = 1', '(−1, 1]', [-1, 0]], ['ln(1-x)', '0', 1, 'R = 1', '[−1, 1)', [1, 0]], ['sqrt(x)', '4', 4, 'R = 4', '[0, 8]', [0, 0]], ['sqrt(1+x)', '0', 1, 'R = 1', '[−1, 1]', [-1, 0]],
        ['arctg(x)', '0', 1, 'R = 1', '[−1, 1]', [0, 1]], ['arcsen(x)', '0', 1, 'R = 1', '[−1, 1]', null], ['1/(1-x)', '0', 1, 'R = 1', '(−1, 1)', [1, 0]], ['1/(2-x)', '0', 2, 'R = 2', '(−2, 2)', [2, 0]], ['1/(x-3)', '1', 2, 'R = 2', '(−1, 3)', [3, 0]],
        ['1/(1-x)^3', '0', 1, 'R = 1', '(−1, 1)', [1, 0]], ['x/(1-x)^2', '0', 1, 'R = 1', '(−1, 1)', [1, 0]], ['tg(x)', '0', PI / 2, 'R = {π}/{2}', '(−{π}/{2}, {π}/{2})', null], ['1/cos(x)', '0', PI / 2, 'R = {π}/{2}', '(−{π}/{2}, {π}/{2})', null],
        ['x/(e^x-1)', '0', 2 * PI, 'R = 2 π', '(−2 π, 2 π)', [0, 2 * PI]], ['1/(e^x+1)', '0', PI, 'R = π', '(−π, π)', [0, PI]], ['x/(x^2-x-1)', '0', (S5 - 1) / 2, 'R ≈ 0,618034', '(−0,618034, 0,618034)', [(1 - S5) / 2, 0]], ['ln(1+x^2)', '0', 1, 'R = 1', '[−1, 1]', [0, 1]]];
      for (const [fx, a, R, Rt, itv, sg] of RAD) {
        const r = TaylorC.resolver({ f: fx, a, n: '4' }), q = `Taylor · radio de ${fx} en ${a}`;
        if (r.R === null || Math.abs(r.R - R) > 1e-9 * R) { mal(`${q}: sale ${r.R} y no ${R}`); continue; }
        if (r.Rtxt !== Rt) mal(`${q}: se escribe «${r.Rtxt}» y no «${Rt}»`);
        if (itv && r.intervalo.txt !== itv) mal(`${q}: intervalo ${r.intervalo.txt} y no ${itv}`);
        if (sg && (!r.singularidad || Math.abs(r.singularidad.re - sg[0]) > 2e-6 || Math.abs(r.singularidad.im - sg[1]) > 2e-6)) mal(`${q}: singularidad en ${JSON.stringify(r.singularidad)} y no en ${sg}`);
        if (!r.pasos.some((p) => p.t === 'Radio e intervalo de convergencia')) mal(`${q}: falta el paso`);
      }
      // radio infinito: enteras y polinomios; y con singularidad compleja y signos sin patrón los extremos no se deciden a ciegas
      for (const [fx, a] of [['e^x', '1'], ['sen(x)/x', '0'], ['x^3-2x+1', '1'], ['e^(-x^2)', '0'], ['cos(x)', '1'], ['e^x sen(x)', '0']]) if (TaylorC.resolver({ f: fx, a, n: '4' }).R !== Infinity) mal(`Taylor: el radio de ${fx} en ${a} no sale infinito`);
      const at = TaylorC.resolver({ f: 'arctg(x)', a: '1', n: '3' }).intervalo; if (at.izq !== null || at.der !== null) mal('Taylor: arctg x en a = 1 decide un extremo sin poder');
    }
    // MAT.TA-1 · límites en el infinito y potencias con exponente variable. A mano (con t = 1/x o e^(g ln f)):
    {
      const LIM = [['(1+1/x)^x', 'inf', Math.E, 'e'], ['(1+1/x)^x', '-inf', Math.E, 'e'], ['x sen(1/x)', 'inf', 1, '1'], ['x sen(1/x)', '∞', 1, '1'], ['x(e^(1/x)-1)', '+∞', 1, '1'], ['(1+x)^(1/x)', '0', Math.E, 'e'], ['(cos x)^(1/x^2)', '0', Math.exp(-0.5), null],
        ['(x^2+1)/(2x^2-3)', 'inf', 0.5, '{1}/{2}'], ['x^2(1-cos(1/x))', 'inf', 0.5, '{1}/{2}'], ['(1+2/x)^(3x)', '-inf', Math.exp(6), null], ['x tg(1/x)', '−∞', 1, '1'], ['(1+3/x)^x', 'infinito', Math.exp(3), null], ['(2x^3-x)/(x^3+5)', '-inf', 2, '2'], ['(1+x^2)^(1/x^2)', '0', Math.E, 'e']];
      for (const [fx, a, v, t] of LIM) {
        let r; try { r = TaylorC.resolver({ modo: 'limite', f: fx, a }); } catch (e) { mal(`Taylor · límite de ${fx} en ${a}: ${e.message}`); continue; }
        cerca(r.val, v, 1e-9 * Math.max(1, Math.abs(v)), `límite de ${fx} en ${a}`);
        if (t && r.txt !== t) mal(`Taylor · límite de ${fx} en ${a}: se escribe «${r.txt}» y no «${t}»`);
        if (/inf|∞/.test(a) && (isFinite(r.a) || !/∞/.test(r.aTxt))) mal(`Taylor · límite de ${fx}: a = ${a} no se lee como infinito`);
      }
      // lo que no sale por Taylor lo dice claro
      for (const [fx, a] of [['x ln(x)', '0'], ['sqrt(x^2+x)-x', 'inf'], ['x^x', '0']]) { let m = ''; try { TaylorC.resolver({ modo: 'limite', f: fx, a }); } catch (e) { m = e.message; } if (!/no sale por Taylor/.test(m)) mal(`Taylor: el límite de ${fx} en ${a} debería avisar de que no sale por Taylor («${m}»)`); }
    }
    if (fallos === antes) console.log(`  ✓ Series de Taylor: ${TaylorC.ejemplos.length} ejemplos, coeficientes exactos, radio e intervalo de convergencia, límites en el infinito, error por debajo de la cota de Lagrange, desarrollos conocidos, derivadas simbólicas y numéricas y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'matematicas', 'taylor', 'index.html'));
      await page.waitForFunction(() => window.TaylorApp);
      await require('./comun/exportar.js')(page, mal, 'taylor', { lienzo: '#grafica', datos: true });
      const antes = fallos;
      const verT = (await page.locator('#ver').textContent()).trim();
      if (verT !== Version.de('taylor').current) mal(`Taylor: la página muestra la versión «${verT}», se esperaba ${Version.de('taylor').current}`);
      for (const e of TaylorC.ejemplos) {
        await page.evaluate((c) => TaylorApp.abrirEjemplo(c), e.clave);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, pol: !!document.querySelector('#resumen .ancho math'), dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, max: document.querySelector('#grado').max }));
        if (r.err || r.pasos < 4 || r.res < (e.sc.modo === 'limite' ? 1 : 3) || !r.pol) mal(`Taylor · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`Taylor · ${e.clave}: el desarrollo no sale en MathML`);
        if (e.sc.modo !== 'limite' && +r.max !== +e.sc.n) mal(`Taylor · ${e.clave}: el selector de grado no llega a ${e.sc.n}`);
      }
      await page.evaluate(() => TaylorApp.abrirEjemplo('exp'));
      if (!(await page.locator('#resumen').textContent()).includes('1,648438')) mal('Taylor: P4(0,5) de e^x no sale 1,648438');
      await page.fill('#f-f', 'cos(2x)');
      await page.fill('#f-n', '6');
      if (!(await page.locator('#error').isHidden()) || !(await page.locator('#resumen').textContent()).includes('0,5403')) mal('Taylor: al cambiar a cos(2x) no recalcula');
      await page.fill('#f-f', 'ln x');
      if (await page.locator('#error').isHidden()) mal('Taylor: ln x en 0 no muestra el error');
      await page.fill('#f-f', 'sen x');
      await page.fill('#grado', '2');
      await page.click('#animar'); await page.waitForTimeout(1300);
      if (+(await page.locator('#vgrado').textContent()) < 1) mal('Taylor: la animación no sube el grado');
      await page.click('#animar');
      for (let i = 0; i < 8; i++) { await page.evaluate(() => TaylorApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Taylor: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => TaylorApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Taylor: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Series de Taylor: ${TaylorC.ejemplos.length} ejemplos con MathML, cambio de datos, errores, animación del grado y ejercicios al azar sin errores de consola`);
    }
  };
};
