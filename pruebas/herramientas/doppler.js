/* Comprobación de doppler: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo doppler ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const DopplerF = require(path.join(fuente, 'doppler', 'fisica.js'));
  {
    // valores calculados a mano
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Doppler · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => DopplerF.resolver(DopplerF.ejemplos.find((e) => e.clave === c).sc);
    cerca(r('ambulancia').fp, (700 * 340) / 315, 1e-9, 'fuente que se acerca');
    cerca(r('dos-coches').fp, (500 * 325) / 360, 1e-9, 'los dos se alejan');
    cerca(r('viento').fp, (1000 * 365) / 355, 1e-9, 'viento a favor (v + w)');
    const tren = r('tren');
    cerca(tren.f1, (440 * 343) / 313, 1e-9, 'f₁ al acercarse'); cerca(tren.f2, (440 * 343) / 373, 1e-9, 'f₂ al alejarse');
    if (!tren.curva || Math.abs(tren.curva.puntos[100].fp - 440) > 1e-9) mal('Doppler: enfrente del observador no se oye la frecuencia emitida');
    const moto = r('moto');
    cerca(moto.u, (340 * 80) / 960, 1e-9, 'velocidad a partir de f₁ y f₂'); cerca(moto.fr, (2 * 520 * 440) / 960, 1e-9, 'frecuencia emitida a partir de f₁ y f₂');
    // al revés: con la velocidad y la frecuencia que salen se vuelven a oír f₁ y f₂
    const ida = DopplerF.paso({ datos: 'fuente', f: String(moto.fr), v: '340', vF: String(moto.u) });
    cerca(ida.f1, 520, 1e-9, 'f₁ de vuelta'); cerca(ida.f2, 440, 1e-9, 'f₂ de vuelta');
    cerca(r('radar').df, (24e9 * 66) / (3e8 - 33), 1e-3, 'pulsaciones del radar');
    cerca(r('murcielago').fpp, (40000 * 346) / 334, 1e-9, 'eco del murciélago');
    const eco = r('ecografia');
    cerca(DopplerF.eco({ buscar: 'frecuencia', f: '5e6', v: '1540', vE: '0', u: String(eco.u) }).df, 1300, 1e-6, 'velocidad de la sangre (ida y vuelta)');
    const av = r('avion');
    cerca(av.gr, 30, 1e-9, 'semiángulo del cono con M = 2'); cerca(av.x, 8000 * Math.sqrt(3), 1e-6, 'distancia del estampido'); cerca(av.t, (8000 * Math.sqrt(3)) / 680, 1e-9, 'tiempo del estampido');
    if (DopplerF.fq(24000005280) !== '2,400000528·10<sup>10</sup>') mal(`Doppler: la frecuencia del radar sale «${DopplerF.fq(24000005280)}»`);
    for (const [sc, q] of [[{ modo: 'recta', f: '500', v: '340', vF: '340' }, 'fuente a la velocidad del sonido'], [{ modo: 'recta', f: '500', v: '340', w: '-340' }, 'viento en contra igual al sonido'], [{ modo: 'paso', datos: 'oidas', f1: '400', f2: '450', v: '340' }, 'f₂ mayor que f₁'], [{ modo: 'choque', v: '340', vF: '300' }, 'onda de choque subsónica'], [{ modo: 'eco', f: '100', v: '340', u: '400' }, 'obstáculo supersónico']]) {
      let ok = false; try { DopplerF.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Doppler: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Efecto Doppler: ${DopplerF.ejemplos.length} ejemplos, viento, fuente que pasa y al revés, eco, cono de Mach y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'doppler', 'index.html'));
      await page.waitForFunction(() => window.DopplerApp);
      const antes = fallos;
      const verD = (await page.locator('#ver').textContent()).trim();
      if (verD !== Version.de('doppler').current) mal(`Doppler: la página muestra la versión «${verD}», se esperaba ${Version.de('doppler').current}`);
      for (const e of DopplerF.ejemplos) {
        await page.evaluate((c) => DopplerApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(120);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, graf: !document.querySelector('#grafica').hidden }));
        if (r.err || r.pasos < 3 || r.res < 2) mal(`Doppler · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`Doppler · ${e.clave}: el desarrollo no sale en MathML`);
        if (r.graf !== (e.clave === 'tren')) mal(`Doppler · ${e.clave}: la gráfica del paso ${r.graf ? 'sale y no debería' : 'no sale'}`);
      }
      await page.evaluate(() => DopplerApp.abrirEjemplo('ambulancia'));
      if (!(await page.locator('#resumen').textContent()).includes('755,6')) mal('Doppler: la frecuencia de la ambulancia no sale en la página');
      if (await page.locator('#oir').isHidden()) mal('Doppler: no sale el botón de escuchar con frecuencias audibles');
      await page.evaluate(() => DopplerApp.abrirEjemplo('murcielago'));
      if (!(await page.locator('#oir').isHidden())) mal('Doppler: el botón de escuchar sale con ultrasonidos');
      await page.selectOption('#f-modo', 'paso');
      await page.selectOption('#f-datos', 'oidas');
      if ((await page.locator('#f-f1').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Doppler: al elegir lo que se oye no pide f₁ o da error');
      await page.fill('#f-f2', '600');
      if (await page.locator('#error').isHidden()) mal('Doppler: f₂ > f₁ no muestra el error');
      await page.selectOption('#f-modo', 'choque');
      await page.fill('#f-vF', '200');
      if (await page.locator('#error').isHidden()) mal('Doppler: una onda de choque subsónica no muestra el error');
      await page.click('#play');
      await page.close();
      if (consola.length) mal('Doppler: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Efecto Doppler: ${DopplerF.ejemplos.length} ejemplos con MathML, gráfica del paso, sonido solo si se oye, cambio de datos y errores sin errores de consola`);
    }
  };
};
