/* Comprobación de campos: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo campos ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const CamC = require(path.join(fuente, 'campos', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Campos · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => CamC.resolver(CamC.ejemplos.find((e) => e.clave === c).sc);
    for (const e of CamC.ejemplos) { try { const x = CamC.resolver(e.sc); if (x.pasos.length < 3) mal(`Campos · ${e.clave}: desarrollo corto`); if (/\{\d{4,}\}\/\{\d{4,}\}/.test(x.pasos.map((q) => q.html).join(' '))) mal(`Campos · ${e.clave}: una fracción rara en el desarrollo`); } catch (err) { mal(`Campos · ${e.clave}: ${err.message}`); } }
    const p = r('paraboloide'); cerca(p.g0[0], 2, 1e-12, 'gradiente'); cerca(p.g0[1], 4, 1e-12, 'gradiente'); cerca(p.du, 3 * Math.SQRT2, 1e-12, 'derivada direccional'); cerca(p.lap, 4, 1e-12, 'laplaciano');
    const x3 = r('xyz'); cerca(x3.du, 16 / 3, 1e-12, 'derivada direccional en 3D'); if (!x3.armonica || !r('armonica').armonica || p.armonica) mal('Campos: no reconoce bien las funciones armónicas');
    if (CamC.ex(2 * Math.PI) !== '2 π' || CamC.ex(Math.LN2 / 2) !== '{ln 2}/{2}' || CamC.ex(5 / 3) !== '{5}/{3}') mal(`Campos: valores exactos «${CamC.ex(2 * Math.PI)}», «${CamC.ex(Math.LN2 / 2)}»`);
    const fu = r('fuente'); cerca(fu.div, 2, 1e-12, 'divergencia de (x, y)'); if (!fu.cons) mal('Campos: (x, y) no sale conservativo'); cerca(fu.phi, 1, 1e-9, 'potencial de (x, y)');
    const re = r('remolino'); cerca(re.rot0[2], 2, 1e-12, 'rotacional de (−y, x)'); if (re.cons) mal('Campos: (−y, x) sale conservativo');
    cerca(r('cizalla').rot0[2], -1, 1e-12, 'rotacional de la cizalla');
    const co = r('conservativo'); if (!co.cons) mal('Campos: (yz, xz, xy) no sale conservativo'); cerca(co.phi, 6, 1e-9, 'potencial xyz');
    const ca = r('carga'); if (!ca.cons || Math.abs(ca.div) > 1e-12) mal('Campos: el campo de una carga no sale con divergencia 0 y conservativo'); cerca(ca.phi, Math.LN2 / 2, 1e-9, 'potencial de la carga');
    cerca(r('circulo').W, 2 * Math.PI, 1e-9, 'trabajo en una vuelta'); cerca(r('circulo').L, 2 * Math.PI, 1e-9, 'longitud de la circunferencia');
    const pa = r('parabola'); cerca(pa.W, 1, 1e-9, 'trabajo por la parábola'); cerca(pa.dphi, 1, 1e-9, 'Δφ por la parábola');
    cerca(r('helice').W, 2 * Math.PI + 2 * Math.PI ** 2, 1e-9, 'trabajo por la hélice'); cerca(r('segmento').W, 5 / 3, 1e-9, 'trabajo por el segmento');
    const g1 = r('green-circulo'); cerca(g1.circula, 2 * Math.PI, 1e-9, 'circulación'); cerca(g1.dobleR, 2 * Math.PI, 1e-6, 'Green'); cerca(g1.flujo, 0, 1e-9, 'flujo');
    const g2 = r('green-rect'); cerca(g2.circula, 2, 1e-9, 'circulación en el rectángulo'); cerca(g2.dobleR, 2, 1e-9, 'Green en el rectángulo'); cerca(g2.flujo, 1, 1e-9, 'flujo en el rectángulo'); cerca(g2.dobleD, 1, 1e-9, 'divergencia en el rectángulo');
    const g3 = r('green-flujo'); cerca(g3.flujo, 8 * Math.PI, 1e-9, 'flujo de (x, y)'); cerca(g3.dobleD, 8 * Math.PI, 1e-6, 'divergencia de (x, y)');
    const ag = r('green-agujero'); cerca(ag.circula, 2 * Math.PI, 1e-9, 'circulación alrededor del origen'); if (!ag.singular || g1.singular || g2.singular || g3.singular) mal('Campos: no se avisa (o se avisa sin motivo) de que Green no vale con una singularidad dentro');
    // potencial simbólico: ∇φ = F y su valor
    const pot = (c, txt, v) => { const x = r(c); if (x.phiTxt !== txt) mal(`Campos · ${c}: el potencial sale «${x.phiTxt}» en vez de «${txt}»`); cerca(x.phi, v, 1e-12, `potencial de ${c}`); };
    pot('potencial-2d', 'x^{2} y + y^{3}', 10); pot('potencial-3d', 'x y^{2} + x^{2} z + y z', 5); pot('conservativo', 'x y z', 6);
    if (r('remolino').phiTxt) mal('Campos: (−y, x) tiene potencial');
    // poligonales e ∫ f ds
    cerca(r('poligonal-triangulo').W, 1, 1e-12, 'trabajo de (−y, x) por el triángulo (el doble del área)'); const pc = r('poligonal-camino'); cerca(pc.W, 2, 1e-12, 'trabajo por dos segmentos'); cerca(pc.dphi, 2, 1e-12, 'Δφ por dos segmentos');
    const ms = r('masa-semicirculo'); cerca(ms.I, 2, 1e-9, 'masa del semicírculo'); cerca(ms.L, Math.PI, 1e-9, 'longitud del semicírculo'); cerca(ms.cm[0], 0, 1e-9, 'x̄'); cerca(ms.cm[1], Math.PI / 4, 1e-9, 'ȳ');
    cerca(r('cicloide').I, 8, 1e-9, 'longitud de la cicloide'); cerca(r('masa-helice').I, 2 * Math.SQRT2 * Math.PI ** 2, 1e-9, 'masa de la hélice'); cerca(r('masa-triangulo').I, 1.5 + Math.SQRT1_2, 1e-12, '∫ x ds por el triángulo');
    { const Cv = require('../../fuente/campos/curvilineas.js'); const por = (c) => Cv.calcula(Cv.ejemplos.find((e) => e.clave === c).sc);
      if (por('cil-radial').divTxt !== '2') mal('Campos curvilíneas: ∇·(ρ ρ̂) en cilíndricas debe valer 2'); if (por('cil-giro').rotTxt[2] !== '2') mal('Campos curvilíneas: ∇×(ρ φ̂) debe valer 2 ẑ');
      if (por('esf-radial').divTxt !== '3') mal('Campos curvilíneas: ∇·(r r̂) en esféricas debe valer 3'); if (por('esf-dipolo').divTxt !== '0' || por('cil-carga-lineal').divTxt !== '0' || por('esf-carga').divTxt !== '0') mal('Campos curvilíneas: los campos de carga puntual, lineal y dipolo tienen divergencia 0');
      if (!por('esf-carga').grTxt[0].includes('r^{2}')) mal('Campos curvilíneas: ∇(1/r) debe llevar 1/r²'); }
    { const x = CamC.resolver({ modo: 'masa', f: 'x', curva: 'param', cx: 'cos t', cy: 'sen t', a: '0', b: '2π' }); if (x.cm) mal('Campos: una f con valores negativos sale como densidad'); cerca(x.I, 0, 1e-9, '∫ x ds en la circunferencia'); }
    // Green en polígonos y entre curvas (incluido un polígono horario y uno no convexo)
    cerca(r('green-triangulo').circula, 2, 1e-9, 'Green en el triángulo'); cerca(r('green-triangulo').area, 1, 1e-12, 'área del triángulo');
    const gp = r('green-poligono'); cerca(gp.circula, gp.dobleR, 1e-9, 'Green en el pentágono'); cerca(gp.area, 5, 1e-12, 'área del pentágono');
    { const a = CamC.resolver({ modo: 'green', P: 'x y', Q: 'x^2', region: 'poligono', vertices: '(0,0), (0,2), (3,2), (3,0)' }); cerca(a.circula, 9, 1e-9, 'Green en un rectángulo horario'); cerca(a.dobleR, 9, 1e-9, '∬ x dA');
      const b = CamC.resolver({ modo: 'green', P: 'x y', Q: 'x^2', region: 'poligono', vertices: '0 0; 2 0; 2 2; 1 1; 0 2' }); cerca(b.circula, b.dobleR, 1e-9, 'Green en un polígono no convexo'); cerca(b.area, 3, 1e-12, 'área del polígono no convexo'); }
    const gc = r('green-curvas'); cerca(gc.circula, 1 / 3, 1e-9, 'circulación entre y = x² e y = x'); cerca(gc.dobleR, 1 / 3, 1e-9, 'Green entre curvas'); cerca(gc.area, 1 / 6, 1e-9, 'área entre curvas');
    const gs = r('green-semicirculo'); cerca(gs.circula, 2 / 3, 1e-9, 'circulación en el semicírculo'); cerca(gs.dobleR, 2 / 3, 1e-9, 'Green en el semicírculo'); cerca(gs.area, Math.PI / 2, 1e-9, 'área del semicírculo');
    { const d = CamC.resolver({ modo: 'green', P: 'x', Q: 'y', region: 'curvas', g1: '-√(4 - x^2)', g2: '√(4 - x^2)', a: '-2', b: '2' }); cerca(d.flujo, 8 * Math.PI, 1e-6, 'flujo por el disco hecho con dos curvas'); if (d.singular) mal('Campos: el disco hecho con dos curvas sale singular'); }
    // superficies y Stokes
    const fe = r('flujo-esfera'); cerca(fe.flujo, 4 * Math.PI, 1e-9, 'flujo de (x, y, z) por la esfera'); cerca(fe.area, 4 * Math.PI, 1e-9, 'área de la esfera'); if (!fe.cerrada || fe.borde.length) mal('Campos: la esfera no sale cerrada');
    cerca(r('flujo-plano').flujo, 2, 1e-9, 'flujo por el cuadrado');
    const sp = r('stokes-paraboloide'); cerca(sp.rotFlujo, 2 * Math.PI, 1e-9, 'flujo del rotacional por el paraboloide'); cerca(sp.circula, 2 * Math.PI, 1e-9, 'circulación por el borde del paraboloide'); if (!sp.stokes || sp.cerrada || sp.borde.length !== 1) mal('Campos: el borde del paraboloide no es una sola circunferencia');
    const sh = r('stokes-hemisferio'); cerca(sh.rotFlujo, -2 * Math.PI, 1e-9, 'Stokes en media esfera'); cerca(sh.circula, -2 * Math.PI, 1e-9, 'circulación por el ecuador');
    // Gauss
    cerca(r('gauss-caja').flujo, 18, 1e-9, 'flujo por la caja'); cerca(r('gauss-caja').vol, 18, 1e-9, '∭ div en la caja');
    const ge = r('gauss-esfera'); cerca(ge.flujo, 12 * Math.PI / 5, 1e-9, 'flujo de (x³, y³, z³)'); cerca(ge.vol, 12 * Math.PI / 5, 1e-9, '∭ 3(x² + y² + z²)');
    const gz = r('gauss-cilindro'); cerca(gz.flujo, 8 * Math.PI, 1e-9, 'flujo por el cilindro'); cerca(gz.vol, 8 * Math.PI, 1e-9, '∭ div en el cilindro');
    const gq = r('gauss-carga'); cerca(gq.flujo, 4 * Math.PI, 1e-7, 'flujo del campo de una carga'); if (!gq.singular || ge.singular || gz.singular) mal('Campos: no se avisa (o se avisa sin motivo) de que Gauss no vale con una carga dentro');
    const sc0 = CamC.ejemplos.find((e) => e.clave === 'paraboloide').sc;
    for (const [q, sc] of [['un vértice con una coordenada', { modo: 'linea', P: 'y', Q: 'x', curva: 'poligonal', vertices: '0 0; 1' }], ['un polígono de vértices alineados', { modo: 'green', P: 'y', Q: 'x', region: 'poligono', vertices: '0 0; 1 1; 2 2' }], ['curvas cruzadas', { modo: 'green', P: 'y', Q: 'x', region: 'curvas', g1: 'x', g2: 'x^2', a: '0', b: '1' }], ['una superficie que no depende de v', { modo: 'superficie', P: 'x', Q: 'y', R: 'z', sx: 'u', sy: 'u', sz: '0', u1: '0', u2: '1', v1: '0', v2: '1' }], ['una caja al revés', { modo: 'gauss', P: 'x', Q: 'y', R: 'z', solido: 'caja', x1: '1', x2: '0', y1: '0', y2: '1', z1: '0', z2: '1' }], ['una f vacía', { ...sc0, f: '' }], ['un punto que no es un número', { ...sc0, x0: 'abc' }], ['la dirección cero', { ...sc0, u: '0, 0' }], ['un campo vacío', { modo: 'vectorial', P: '', Q: '', R: '', x0: '1', y0: '1' }], ['t final menor que el inicial', { modo: 'linea', P: 'y', Q: 'x', cx: 't', cy: 't', a: '1', b: '0' }], ['un radio negativo', { modo: 'green', P: 'y', Q: 'x', region: 'circulo', cx: '0', cy: '0', rad: '-1' }]]) {
      let ok = false; try { CamC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Campos: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Campos vectoriales: ${CamC.ejemplos.length} ejemplos, gradiente, derivada direccional, laplaciano, divergencia, rotacional, potencial simbólico, trabajo por curvas y poligonales, ∫ f ds y centro de masas, Green en polígonos y entre curvas, flujo, Stokes, Gauss y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'matematicas', 'campos', 'index.html'));
      await page.waitForFunction(() => window.CamposApp);
      await require('./comun/exportar.js')(page, mal, 'campos', { lienzo: '#grafica', datos: false });
      const antes = fallos;
      const verC = (await page.locator('#ver').textContent()).trim();
      if (verC !== Version.de('campos').current) mal(`Campos: la página muestra la versión «${verC}», se esperaba ${Version.de('campos').current}`);
      for (const e of CamC.ejemplos) {
        await page.evaluate((c) => CamposApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(30);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, modo: document.querySelector('#f-modo').value }));
        if (r.err || r.pasos < 3 || r.res < 1) mal(`Campos · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`Campos · ${e.clave}: el desarrollo no sale en MathML`);
        if (r.modo !== e.sc.modo) mal(`Campos · ${e.clave}: el modo no cuadra`);
      }
      await page.evaluate(() => CamposApp.abrirEjemplo('circulo'));
      if (!(await page.locator('#resumen').textContent()).includes('6,2832')) mal('Campos: el trabajo de (−y, x) en una vuelta (2π) no sale en la página');
      await page.fill('#f-P', 'y');
      if (!/^0$/.test((await page.locator('#resumen > div.num b').first().textContent()).trim())) mal('Campos: con F = (y, x) el trabajo en una vuelta no sale 0');
      await page.fill('#f-b', 'abc');
      if (await page.locator('#error').isHidden()) mal('Campos: un t final que no es un número no da error');
      await page.evaluate(() => CamposApp.abrirEjemplo('remolino'));
      const caja = await page.locator('#grafica').boundingBox();
      await page.mouse.click(caja.x + caja.width * 0.25, caja.y + caja.height * 0.25);
      const est = await page.evaluate(() => CamposApp.estado());
      if (!(parseFloat(est.x0.replace(',', '.')) < 0 && parseFloat(est.y0.replace(',', '.')) > 0)) mal(`Campos: tocar la gráfica no mueve el punto (${est.x0}, ${est.y0})`);
      await page.evaluate(() => CamposApp.abrirEjemplo('green-circulo'));
      await page.selectOption('#f-region', 'rectangulo');
      if ((await page.locator('#f-x2').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Campos: al pasar a un rectángulo no salen sus campos o da error');
      await page.selectOption('#f-region', 'poligono');
      if ((await page.locator('#f-vertices').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Campos: al pasar a un polígono no salen los vértices o da error');
      await page.selectOption('#f-region', 'curvas');
      if ((await page.locator('#f-g2').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Campos: al pasar a la región entre curvas no salen sus campos o da error');
      await page.selectOption('#f-modo', 'linea'); await page.selectOption('#f-curva', 'poligonal');
      if ((await page.locator('#f-vertices').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Campos: al pasar a una poligonal no salen los vértices o da error');
      await page.selectOption('#f-modo', 'gauss');
      for (const so of ['esfera', 'cilindro', 'caja']) { await page.selectOption('#f-solido', so); if (!(await page.locator('#error').isHidden())) mal(`Campos: Gauss en un sólido «${so}» da error`); }
      await page.selectOption('#f-modo', 'superficie');
      if ((await page.locator('#f-sz').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Campos: al pasar a superficie no salen sus campos o da error');
      await page.evaluate(() => CamposApp.abrirEjemplo('potencial-2d'));
      if (!(await page.locator('#resumen').textContent()).includes('φ')) mal('Campos: no sale el potencial φ(x, y) en los resultados');
      await page.selectOption('#f-modo', 'escalar');
      if ((await page.locator('#f-f').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Campos: al pasar a campo escalar no sale el campo de f o da error');
      await page.click('#animar');
      if ((await page.locator('#animar').textContent()).trim() !== '▶ Animar') mal('Campos: el botón de parar no cambia');
      for (let i = 0; i < 10; i++) { await page.evaluate(() => CamposApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Campos: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => CamposApp.estado()))}`); }
      // compartir: el enlace abre el mismo ejercicio en otro navegador; copiar en texto y en LaTeX; imprimir
      await page.evaluate(() => CamposApp.abrirEjemplo('potencial-3d'));
      if ((await page.locator('.compartir button').count()) !== 4 || !(await page.locator('#nota-log').count())) mal('Campos: faltan los botones de compartir o el aviso de log');
      const co = await page.evaluate(() => ({ url: Compartir.enlace(), txt: Compartir.ejercicio(false), tex: Compartir.ejercicio(true), pasos: document.querySelector('#pasos').innerText }));
      if (!/#d=[\w-]+$/.test(co.url)) mal(`Campos: el enlace para compartir no lleva los datos: ${co.url}`);
      if (!co.txt.includes('φ = x y^2 + x^2 z + y z + K') || !co.txt.includes('Desarrollo')) mal('Campos: el texto copiado no trae el potencial o el desarrollo');
      if (!co.tex.includes('\\begin{enumerate}') || !co.tex.includes('\\frac{\\partial \\varphi}{\\partial y}') || /\$\$/.test(co.tex)) mal('Campos: el LaTeX copiado no sale bien');
      { const ctx = await browser.newContext(), p2 = await ctx.newPage(); await p2.goto(co.url); await p2.waitForFunction(() => window.CamposApp);
        if ((await p2.evaluate(() => document.querySelector('#pasos').innerText)) !== co.pasos || (await p2.evaluate(() => CamposApp.estado().P)) !== 'y^2 + 2x z') mal('Campos: el enlace compartido no abre el mismo ejercicio');
        await ctx.close(); }
      await page.emulateMedia({ media: 'print' });
      if (await page.locator('.teoria').isVisible() || await page.locator('.compartir').isVisible() || !(await page.locator('#pasos').isVisible())) mal('Campos: al imprimir no se quitan la teoría y los botones (o se quita el desarrollo)');
      await page.emulateMedia({ media: 'screen' });
      await page.close();
      if (consola.length) mal('Campos: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Campos vectoriales: ${CamC.ejemplos.length} ejemplos con MathML, cambio de campo, errores, tocar la gráfica, regiones de Green, cambio de modo y ejercicios al azar sin errores de consola`);
    }
  };
};
