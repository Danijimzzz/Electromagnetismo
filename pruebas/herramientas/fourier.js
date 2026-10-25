/* Comprobación de fourier: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fourier ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const FourierC = require(path.join(fuente, 'fourier', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Fourier · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => FourierC.resolver(FourierC.ejemplos.find((e) => e.clave === c).sc), PI = Math.PI;
    for (const e of FourierC.ejemplos) { try { const x = FourierC.resolver(e.sc); if (x.pasos.length < 6) mal(`Fourier · ${e.clave}: desarrollo corto`); if (!(x.parcial <= x.energia * (1 + 1e-9))) mal(`Fourier · ${e.clave}: los armónicos suman más energía que f (Parseval)`); } catch (err) { mal(`Fourier · ${e.clave}: ${err.message}`); } }
    // coeficientes calculados a mano
    const cu = r('cuadrada'); for (let n = 1; n <= 12; n++) { cerca(cu.bn[n], n % 2 ? 4 / (n * PI) : 0, 1e-12, `b${n} de la onda cuadrada`); cerca(cu.an[n], 0, 1e-12, `a${n} de la onda cuadrada`); }
    if (cu.gB !== '{2 (1 − (−1)^n)}/{n π}' || !cu.impar || cu.saltos.length !== 2) mal(`Fourier: la onda cuadrada sale con bn = «${cu.gB}», impar ${cu.impar}, ${cu.saltos.length} saltos`);
    const si = r('sierra'); for (let n = 1; n <= 10; n++) cerca(si.bn[n], (2 * (n % 2 ? 1 : -1)) / n, 1e-12, `b${n} del diente de sierra`);
    if (si.gB !== '{2 (−1)^{n+1}}/{n}') mal(`Fourier: el diente de sierra sale con bn = «${si.gB}»`);
    const pa = r('parabola'); cerca(pa.an[0], (2 * PI * PI) / 3, 1e-12, 'a0 de x²'); for (let n = 1; n <= 10; n++) cerca(pa.an[n], (4 * (n % 2 ? -1 : 1)) / (n * n), 1e-12, `a${n} de x²`);
    if (pa.gA !== '{4 (−1)^{n}}/{n^{2}}' || !pa.par || pa.saltos.length) mal(`Fourier: x² sale con an = «${pa.gA}», par ${pa.par}, ${pa.saltos.length} saltos`);
    cerca(r('triangular').an[3], -4 / (9 * PI), 1e-12, 'a3 de |x|');
    for (let n = 0; n <= 9; n++) cerca(r('cosenos').an[n], r('triangular').an[n], 1e-12, `a${n} de la extensión par de x frente a |x|`);
    for (let n = 1; n <= 9; n++) { cerca(r('senos').bn[n], cu.bn[n], 1e-12, `b${n} de la extensión impar de 1`); cerca(r('cuadrada-T2').bn[n], cu.bn[n], 1e-12, `b${n} de la cuadrada de periodo 2`); }
    const sp = r('senos-parabola'); if (sp.gB !== '{4 (1 − (−1)^n)}/{n^{3} π}') mal(`Fourier: x(π − x) en senos sale con bn = «${sp.gB}»`);
    const pu = r('pulso'); cerca(pu.an[0], 1, 1e-12, 'a0 del pulso'); cerca(pu.bn[1], 2 / PI, 1e-12, 'b1 del pulso'); if (pu.saltos.some((s) => Math.abs(s.media - 0.5) > 1e-9)) mal('Fourier: en los saltos del pulso la serie no converge a 1/2');
    const re = r('rectificada'); cerca(re.an[0], 4 / PI, 1e-12, 'a0 de |sen x|'); cerca(re.an[2], -4 / (3 * PI), 1e-12, 'a2 de |sen x|'); cerca(re.an[1], 0, 1e-12, 'a1 de |sen x|');
    cerca(r('media-onda').bn[1], 0.5, 1e-12, 'b1 de la media onda'); cerca(r('sierra-0-2pi').an[0], 2 * PI, 1e-12, 'a0 de x en [0, 2π]');
    // Parseval de x²: 2π⁴/5
    cerca(pa.energia, (2 * PI ** 4) / 5, 1e-9, 'Parseval de x²');
    // x² en x = π: la serie converge a π² y la suma parcial se acerca
    if (!(Math.abs(pa.sx0 - PI * PI) < 0.5)) mal('Fourier: la suma parcial de x² en π no se acerca a π²');
    for (const [sc, q] of [[{ tramos: [{ f: '', a: '0', b: '1' }], N: '5' }, 'sin función'], [{ tramos: [{ f: '1', a: '1', b: '0' }], N: '5' }, 'tramo al revés'], [{ tramos: [{ f: '1', a: '0', b: '2' }, { f: '0', a: '1', b: '3' }], N: '5' }, 'tramos que se solapan'], [{ tramos: [{ f: '1', a: '0', b: 'π' }], N: '0' }, 'N = 0'], [{ tramos: [{ f: '1', a: '0', b: 'π' }], N: '101' }, 'N = 101'], [{ ext: 'par', tramos: [{ f: 'x', a: '1', b: '2' }], N: '5' }, 'extensión que no empieza en 0'], [{ tramos: [{ f: 'ln x', a: '-1', b: '1' }], N: '5' }, 'ln x con negativos']]) {
      let ok = false; try { FourierC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Fourier: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Series de Fourier: ${FourierC.ejemplos.length} ejemplos, coeficientes a mano, términos generales, paridad, extensiones par e impar, saltos, Parseval y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'matematicas', 'fourier', 'index.html'));
      await page.waitForFunction(() => window.FourierApp);
      const antes = fallos;
      const verF = (await page.locator('#ver').textContent()).trim();
      if (verF !== Version.de('fourier').current) mal(`Fourier: la página muestra la versión «${verF}», se esperaba ${Version.de('fourier').current}`);
      for (const e of FourierC.ejemplos) {
        await page.evaluate((c) => FourierApp.abrirEjemplo(c), e.clave);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, serie: !!document.querySelector('#resumen .ancho math'), dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, tramos: document.querySelectorAll('#tramos .tramo').length }));
        if (r.err || r.pasos < 6 || r.res < 2 || !r.serie) mal(`Fourier · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`Fourier · ${e.clave}: el desarrollo no sale en MathML`);
        if (r.tramos !== e.sc.tramos.length) mal(`Fourier · ${e.clave}: salen ${r.tramos} tramos en vez de ${e.sc.tramos.length}`);
      }
      await page.evaluate(() => FourierApp.abrirEjemplo('cuadrada'));
      if (!(await page.locator('#resumen').textContent()).includes('1,273')) mal('Fourier: b1 = 4/π de la onda cuadrada no sale en la página');
      await page.click('#mas');
      if ((await page.locator('#tramos .tramo').count()) !== 3 || (await page.locator('#error').isHidden())) mal('Fourier: al añadir un tramo vacío no aparece o no pide su extremo');
      await page.fill('#tramos [data-i="2"][data-c="b"]', '2π');
      if (!(await page.locator('#error').isHidden())) mal('Fourier: con un tercer tramo bien escrito da error');
      await page.click('#tramos [data-quita="2"]');
      if ((await page.locator('#tramos .tramo').count()) !== 2) mal('Fourier: quitar un tramo no lo quita');
      await page.selectOption('#ext', 'impar');
      if (await page.locator('#error').isHidden()) mal('Fourier: la extensión impar de una función que no empieza en 0 no da error');
      await page.selectOption('#ext', 'periodica');
      await page.click('#animar'); await page.waitForTimeout(800);
      if (+(await page.locator('#vk').textContent()) < 2) mal('Fourier: la animación no suma armónicos');
      await page.click('#animar');
      for (let i = 0; i < 8; i++) { await page.evaluate(() => FourierApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Fourier: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => FourierApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Fourier: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Series de Fourier: ${FourierC.ejemplos.length} ejemplos con MathML, tramos que se añaden y quitan, extensiones, errores, animación y ejercicios al azar sin errores de consola`);
    }
  };
};
