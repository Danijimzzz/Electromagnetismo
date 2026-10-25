/* Comprobación de regresion: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo regresion ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const RegresionC = require(path.join(fuente, 'regresion', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Regresión · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => RegresionC.resolver(RegresionC.ejemplos.find((e) => e.clave === c).sc);
    for (const e of RegresionC.ejemplos) { try { const s = RegresionC.resolver(e.sc); if (!s.pasos.length || !isFinite(s.R2)) mal(`Regresión · ${e.clave}: sin resultado`); } catch (err) { mal(`Regresión · ${e.clave}: ${err.message}`); } }
    const n = r('notas');
    cerca(n.m.mx, 4, 1e-12, 'media de x'); cerca(n.m.vx, 4, 1e-12, 'varianza de x'); cerca(n.m.cxy, 4, 1e-12, 'covarianza'); cerca(n.lineal.b, 1, 1e-12, 'pendiente'); cerca(n.lineal.a, 43 / 7 - 4, 1e-12, 'ordenada');
    cerca(n.r, 4 / (2 * Math.sqrt(292.5 / 7 - (43 / 7) ** 2)), 1e-12, 'r de las notas'); cerca(n.yx0, 43 / 7 - 4 + 4.5, 1e-12, 'estimación para x = 4,5');
    const pa = r('peso-altura'); cerca(pa.lineal.b * pa.xSobreY.b, pa.r * pa.r, 1e-12, 'producto de las pendientes = r²');
    if (r('inversa').r >= -0.9) mal('Regresión: el ejemplo inverso no da una correlación negativa fuerte');
    if (r('frecuencias').m.N !== 24) mal('Regresión: la tabla con frecuencias no suma N = 24');
    if (!(r('debil').pval > 0.05)) mal('Regresión: los datos sin relación salen significativos');
    const k = r('kepler'); cerca(k.coef.b, 1.5, 0.01, 'exponente de Kepler'); cerca(k.coef.a, 1, 0.01, 'coeficiente de Kepler');
    cerca(r('bacterias').coef.b, 0.5, 0.01, 'tasa de crecimiento');
    const fr = r('frenada'); for (const [g, q] of [[() => 1, '∑e'], [(x) => x, '∑ex'], [(x) => x * x, '∑ex²']]) cerca(fr.residuos.reduce((s, p) => s + p.e * g(p.x), 0), 0, 1e-6, `parábola: ${q} = 0`);
    if (RegresionC.leeDatos('x;y\n1;2,5\n# nota\n3\t4').length !== 2) mal('Regresión: no se salta la cabecera y el comentario o no lee «;» y tabuladores');
    for (const [sc, q] of [[{ datos: '1 2' }, 'un punto'], [{ datos: '2 1\n2 3' }, 'misma x'], [{ datos: '1 2\nhola 3' }, 'texto'], [{ datos: '-1 2\n2 3', modelo: 'potencial' }, 'potencial con x negativa'], [{ datos: '1 2\n1 3\n2 4', modelo: 'parabolica' }, 'parábola con dos x'], [{ datos: '1 2 0\n2 3' }, 'frecuencia 0']]) {
      let ok = false; try { RegresionC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Regresión: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Regresión: ${RegresionC.ejemplos.length} ejemplos, medias, covarianza, r, las dos rectas, frecuencias, ajustes no lineales, parábola y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'estadistica', 'regresion', 'index.html'));
      await page.waitForFunction(() => window.RegresionApp);
      const antes = fallos;
      const verG = (await page.locator('#ver').textContent()).trim();
      if (verG !== Version.de('regresion').current) mal(`Regresión: la página muestra la versión «${verG}», se esperaba ${Version.de('regresion').current}`);
      for (const e of RegresionC.ejemplos) {
        await page.evaluate((c) => RegresionApp.abrirEjemplo(c), e.clave);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, tabla: document.querySelectorAll('#pasos table').length, math: document.querySelectorAll('#pasos math').length }));
        if (r.err || r.pasos < 5 || r.res < 4 || r.dolar || !r.tabla || !r.math) mal(`Regresión · ${e.clave}: falta el resultado, la tabla o el desarrollo`);
      }
      // escribir los datos a mano
      await page.evaluate(() => RegresionApp.abrirEjemplo('notas'));
      await page.fill('#f-datos', '1 2\n2 4\n3 6');
      if (!(await page.locator('#resumen').textContent()).includes('r = 1')) mal('Regresión: tres puntos alineados no dan r = 1');
      // añadir un punto pulsando en la gráfica
      await page.click('#marcar');
      const caja = await page.locator('#grafica').boundingBox();
      await page.mouse.click(caja.x + caja.width * 0.6, caja.y + caja.height * 0.3);
      if ((await page.inputValue('#f-datos')).trim().split('\n').length !== 4) mal('Regresión: pulsar en la gráfica no añade un punto');
      await page.selectOption('#f-modelo', 'parabolica');
      if (!(await page.locator('#error').isHidden())) mal('Regresión: el ajuste parabólico da error con cuatro puntos');
      await page.fill('#f-datos', '1 2\nhola');
      if (await page.locator('#error').isHidden()) mal('Regresión: unos datos sin sentido no muestran el error');
      await page.evaluate(() => RegresionApp.azar());
      if (!(await page.locator('#error').isHidden()) || !(await page.inputValue('#f-datos')).includes('\n')) mal('Regresión: los datos al azar dan error');
      await page.close();
      if (consola.length) mal('Regresión: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Regresión: ${RegresionC.ejemplos.length} ejemplos con tablas y MathML, datos a mano, puntos con el ratón, parábola, datos al azar y errores sin errores de consola`);
    }
  };
};
