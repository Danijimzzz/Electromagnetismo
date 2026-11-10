/* Comprobación de regresion: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo regresion ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const RegresionC = require(path.join(fuente, 'regresion', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Regresión · ${q}: ${a} en vez de ${b}`); };
    const REFR = JSON.parse(fs.readFileSync(path.join(fuente, '..', 'pruebas', 'referencias', 'estadistica.json'), 'utf8')).regresion_ponderada;
    const r = (c) => RegresionC.resolver(RegresionC.ejemplos.find((e) => e.clave === c).sc);
    for (const e of RegresionC.ejemplos) { try { const s = RegresionC.resolver(e.sc); if (!s.pasos.length || !isFinite(s.R2)) mal(`Regresión · ${e.clave}: sin resultado`); } catch (err) { mal(`Regresión · ${e.clave}: ${err.message}`); } }
    const n = r('notas');
    cerca(n.m.mx, 4, 1e-12, 'media de x'); cerca(n.m.vx, 4, 1e-12, 'varianza de x'); cerca(n.m.cxy, 4, 1e-12, 'covarianza'); cerca(n.lineal.b, 1, 1e-12, 'pendiente'); cerca(n.lineal.a, 43 / 7 - 4, 1e-12, 'ordenada');
    cerca(n.r, 4 / (2 * Math.sqrt(292.5 / 7 - (43 / 7) ** 2)), 1e-12, 'r de las notas'); cerca(n.yx0, 43 / 7 - 4 + 4.5, 1e-12, 'estimación para x = 4,5');
    const pa = r('peso-altura'); cerca(pa.lineal.b * pa.xSobreY.b, pa.r * pa.r, 1e-12, 'producto de las pendientes = r²');
    // con x grandes (años) la parábola sale igual que con x desplazadas, y la a de la exponencial no se escribe 0
    { const fila = (x0) => [...Array(10)].map((_, i) => `${x0 + i} ${100 + 3 * i + ((i * 7) % 5)}`).join('\n'), pa = RegresionC.resolver({ modelo: 'parabolica', datos: fila(2015) }), pb = RegresionC.resolver({ modelo: 'parabolica', datos: fila(0) });
      cerca(pa.pred(2020), pb.pred(5), 1e-6, 'parábola con años'); cerca(pa.R2, pb.R2, 1e-9, 'R² de la parábola con años');
      if (!/10<sup>−22<\/sup>/.test(RegresionC.resolver({ modelo: 'exponencial', datos: fila(2015) }).ecuacion)) mal('Regresión: la a muy pequeña de la exponencial no sale en notación científica'); }
    // lo nuevo de la 0.2: N − 1, doble entrada, por el origen, hiperbólica, Spearman, atípicos, errores, ángulo y comparación
    { const lista = r('notas'), cu = RegresionC.resolver({ ...RegresionC.ejemplos.find((e) => e.clave === 'notas').sc, div: 'n1' });
      cerca(cu.cov, lista.m.cxy * 7 / 6, 1e-12, 'cuasicovarianza'); cerca(cu.lineal.b, lista.lineal.b, 1e-12, 'la pendiente no cambia con N − 1'); cerca(cu.r, lista.r, 1e-12, 'r no cambia con N − 1'); }
    { const d = r('doble'), l = RegresionC.resolver({ modelo: 'lineal', datos: d.pts.map((q) => `${q.x} ${q.y} ${q.n}`).join('\n') });
      cerca(d.m.N, 34, 1e-12, 'N de la tabla de doble entrada'); cerca(d.r, l.r, 1e-12, 'doble entrada igual que la lista con frecuencias'); }
    { const h = r('hooke-origen'); cerca(h.coef.b, (50 * 2.1 + 100 * 4 + 150 * 6.2 + 200 * 7.9 + 250 * 10.1) / (50 ** 2 + 100 ** 2 + 150 ** 2 + 200 ** 2 + 250 ** 2), 1e-12, 'pendiente por el origen'); }
    { const h = RegresionC.resolver({ modelo: 'hiperbolica', datos: '1 7\n2 5\n4 4\n5 3,8' }); cerca(h.coef.a, 3, 1e-9, 'a de y = 3 + 4/x'); cerca(h.coef.b, 4, 1e-9, 'b de y = 3 + 4/x'); }
    { const sp = RegresionC.resolver({ modelo: 'lineal', datos: '1 1\n2 4\n3 9\n4 16\n5 25' }); cerca(sp.rs, 1, 1e-12, 'Spearman de una relación creciente'); if (sp.r >= 1 - 1e-9) mal('Regresión: x² no debería dar r = 1'); }
    { const at = r('atipico'); if (at.atipicos.length !== 1 || at.atipicos[0].x !== 5) mal(`Regresión: el punto atípico (5, 19) no se detecta: ${JSON.stringify(at.atipicos.map((q) => q.x))}`); }
    { const ho = r('hooke'), sb = ho.inc.se / Math.sqrt(5 * ho.m.vx); cerca(ho.inc.sb, sb, 1e-15, 'error de la pendiente'); if (RegresionC.conError(ho.lineal.b, ho.inc.sb) !== '0,0398 ± 0,0008') mal(`Regresión: b con su error da «${RegresionC.conError(ho.lineal.b, ho.inc.sb)}»`);
      if (RegresionC.conError(12.345, 0.0156) !== '12,345 ± 0,016' || RegresionC.conError(1234, 56) !== '1230 ± 60') mal('Regresión: el redondeo valor ± error no es el del laboratorio');
      if (!(ho.icPred[0] < ho.icMedia[0] && ho.icMedia[1] < ho.icPred[1])) mal('Regresión: el intervalo de predicción no es más ancho que el de la media'); }
    { const d = r('debil'); if (!(d.angulo > 45)) mal('Regresión: con r ≈ −0,27 las rectas deberían cortarse con mucho ángulo'); cerca(r('notas').comparacion.length, 7, 0, 'ajustes comparados'); }
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
    // z de Fisher: con r y N del ejemplo, tanh(artanh(r) ± 1,959964/√(N − 3)); y el caso de libro r = 0,5 con N = 28: (0,156; 0,736)
    { const d = r('dos-correlaciones'), z = Math.atanh(d.r); cerca(d.fisher.a, Math.tanh(z - 1.959964 / Math.sqrt(5)), 1e-7, 'Fisher inferior'); cerca(d.fisher.b, Math.tanh(z + 1.959964 / Math.sqrt(5)), 1e-7, 'Fisher superior');
      cerca(Math.tanh(Math.atanh(0.5) - 1.959964 / 5), 0.1565, 5e-4, 'Fisher de libro'); cerca(Math.tanh(Math.atanh(0.5) + 1.959964 / 5), 0.7360, 5e-4, 'Fisher de libro');
      // comparación con r₂ = 0,62 y n₂ = 40: Z = (z₁ − artanh 0,62)/√(1/5 + 1/37)
      cerca(d.comp.z, (z - Math.atanh(0.62)) / Math.sqrt(1 / 5 + 1 / 37), 1e-9, 'Z de dos correlaciones'); cerca(d.comp.p, 2 * (1 - require(path.join(fuente, 'estadistica', 'calculo.js')).Phi(Math.abs(d.comp.z))), 1e-12, 'p de dos correlaciones');
      for (const [q, sc] of [['r₂ = 1', { r2c: '1', n2c: '20' }], ['n₂ = 3', { r2c: '0,5', n2c: '3' }], ['falta n₂', { r2c: '0,5', n2c: '' }]]) { let ok = false; try { RegresionC.resolver({ ...RegresionC.ejemplos.find((e) => e.clave === 'dos-correlaciones').sc, ...sc }); } catch (e) { ok = true; } if (!ok) mal(`Regresión: ${q} no da error`); } }
    // ajuste ponderado, por otro camino: con las medias ponderadas, b = ∑w(x − x̄)(y − ȳ)/∑w(x − x̄)², a = ȳ − b x̄, σ_b = 1/√∑w(x − x̄)²
    { const P = r('ponderado'), W = P.pond, pts = P.pts, w = pts.map((q) => 1 / q.s ** 2), S = w.reduce((a, b) => a + b), xm = pts.reduce((a, q, i) => a + w[i] * q.x, 0) / S, ym = pts.reduce((a, q, i) => a + w[i] * q.y, 0) / S;
      const sxx = pts.reduce((a, q, i) => a + w[i] * (q.x - xm) ** 2, 0), b = pts.reduce((a, q, i) => a + w[i] * (q.x - xm) * (q.y - ym), 0) / sxx, a = ym - b * xm;
      cerca(W.b, b, 1e-10, 'pendiente ponderada'); cerca(W.a, a, 1e-10, 'ordenada ponderada'); cerca(W.sb, 1 / Math.sqrt(sxx), 1e-12, 'σ_b ponderada'); cerca(W.sa, Math.sqrt(1 / S + xm * xm / sxx), 1e-12, 'σ_a ponderada');
      cerca(W.chi2, pts.reduce((t, q) => t + ((q.y - a - b * q.x) / q.s) ** 2, 0), 1e-9, 'χ² del ajuste ponderado'); cerca(P.yx0, a + 7 * b, 1e-9, 'estimación con la recta ponderada'); cerca(P.syx0, Math.sqrt(1 / S + (7 - xm) ** 2 / sxx), 1e-10, 'σ de la estimación ponderada');
      // contra numpy.polyfit(x, y, 1, w=1/σ, cov='unscaled') (pruebas/referencias/estadistica.py)
      if (REFR) { cerca(W.b, REFR.b, 1e-9, 'pendiente ponderada (numpy)'); cerca(W.a, REFR.a, 1e-9, 'ordenada ponderada (numpy)'); cerca(W.sb, REFR.sb, 1e-9, 'σ_b (numpy)'); cerca(W.sa, REFR.sa, 1e-9, 'σ_a (numpy)'); cerca(W.chi2, REFR.chi2, 1e-8, 'χ² (numpy)'); cerca(W.p, REFR.p, 1e-8, 'p del χ² (scipy)'); }
      // con todas las σ iguales, la recta ponderada es la de mínimos cuadrados de siempre
      const ig = RegresionC.resolver({ modelo: 'lineal', formato: 'sigma', datosS: '1 2 0,5\n2 4,5 0,5\n3 5,5 0,5\n4 8,5 0,5' }); cerca(ig.pond.b, ig.sinPesos.b, 1e-12, 'ponderada con σ iguales'); cerca(ig.pond.a, ig.sinPesos.a, 1e-12, 'ponderada con σ iguales');
      for (const [q, d] of [['σ = 0', '1 2 0\n2 3 0,1'], ['falta σ', '1 2\n2 3'], ['misma x', '1 2 0,1\n1 3 0,1']]) { let ok = false; try { RegresionC.resolver({ modelo: 'lineal', formato: 'sigma', datosS: d }); } catch (e) { ok = true; } if (!ok) mal(`Regresión ponderada: ${q} no da error`); } }
    if (fallos === antes) console.log(`  ✓ Regresión: ${RegresionC.ejemplos.length} ejemplos, medias, covarianza, r, las dos rectas, frecuencias, ajustes no lineales, parábola, z de Fisher, comparación de correlaciones, ajuste ponderado y errores`);
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
      // tabla de doble entrada y gráfica de residuos
      await page.evaluate(() => RegresionApp.abrirEjemplo('cuasi'));
      await page.selectOption('#f-formato', 'doble');
      if (!(await page.locator('#f-doble').count()) || !(await page.locator('#error').isHidden()) || !(await page.locator('#marcar').isHidden())) mal('Regresión: al pasar a tabla de doble entrada no aparece la tabla o da error');
      if (!(await page.evaluate(() => { const c = document.querySelector('#residuos'); return c.width > 0 && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v) => v); }))) mal('Regresión: la gráfica de residuos está vacía');
      await page.close();
      if (consola.length) mal('Regresión: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Regresión: ${RegresionC.ejemplos.length} ejemplos con tablas y MathML, datos a mano, puntos con el ratón, parábola, datos al azar y errores sin errores de consola`);
    }
  };
};
