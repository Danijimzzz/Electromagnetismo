/* Comprobación de disoluciones: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo disoluciones ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Disoluciones = require(path.join(fuente, 'quimica', 'disoluciones.js'));
  {
    // valores calculados aquí a mano a partir de las masas molares, y vuelta atrás desde cada forma
    const antes = fallos, cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
    const Mm = (x) => Formulas.masaMolar(x).M, W = Mm('H2O');
    const ESP = {
      sulfurico: { M: (1840 * 0.98) / Mm('H2SO4'), m: (98 / Mm('H2SO4')) / 0.002, x: (98 / Mm('H2SO4')) / (98 / Mm('H2SO4') + 2 / W) },
      clorhidrico: { M: (1190 * 0.37) / Mm('HCl') },
      suero: { M: 9 / Mm('NaCl'), mm: 0.9 / 1.005 },
      glucosa: { mm: (100 * 0.5 * Mm('C6H12O6')) / (1000 + 0.5 * Mm('C6H12O6')) },
      etanol: { mm: (100 * 0.1 * Mm('C2H5OH')) / (0.1 * Mm('C2H5OH') + 0.9 * W) },
    };
    for (const e of Disoluciones.ejemplos) {
      const r = Disoluciones.concentracion(e.sc);
      for (const [k, v] of Object.entries(ESP[e.clave] || {})) if (!cerca(r.valores[k], v)) mal(`Disoluciones · ${e.clave}: ${k} = ${r.valores[k]}, se esperaba ${v}`);
      if (e.clave === 'glucosa' && r.faltan.join() !== 'M,gL,mv') mal(`Disoluciones · glucosa: sin densidad deberían faltar M, g/L y % m/v, faltan ${r.faltan}`);
      // partiendo de cualquiera de las otras formas sale la misma disolución
      for (const k of Object.keys(Disoluciones.TIPOS)) {
        if (!(k in r.valores) || k === e.sc.tipo) continue;
        const otra = Disoluciones.concentracion({ ...e.sc, tipo: k, valor: String(r.valores[k]) }).valores;
        for (const q of Object.keys(r.valores)) if (!cerca(otra[q], r.valores[q], 1e-8)) mal(`Disoluciones · ${e.clave}: desde ${k}, ${q} = ${otra[q]} en vez de ${r.valores[q]}`);
      }
    }
    const P = Object.fromEntries(Disoluciones.ejemplosPreparar.map((e) => [e.clave, Disoluciones.preparar(e.sc)]));
    if (!cerca(P.nacl.mPesar, (0.025 * Mm('NaCl')) / 0.995)) mal(`Disoluciones · preparar NaCl: ${P.nacl.mPesar} g`);
    if (!cerca(P.hcl.Vcomercial, (0.25 * Mm('HCl')) / 0.37 / 1.19)) mal(`Disoluciones · preparar HCl: ${P.hcl.Vcomercial} mL`);
    if (!cerca(P.hcl.Mcomercial * P.hcl.Vcomercial, 0.5 * 500)) mal('Disoluciones · preparar HCl: no cumple C₁V₁ = C₂V₂');
    if (!cerca(Disoluciones.diluir({ C1: '12', V1: '', C2: '0,5', V2: '250' }).V1, (0.5 * 250) / 12)) mal('Disoluciones: la dilución no da V₁ = 10,42 mL');
    if (!cerca(Disoluciones.diluir({ C1: '2', V1: '50', C2: '', V2: '200' }).C2, 0.5)) mal('Disoluciones: la dilución no da C₂ = 0,5');
    if (!cerca(Disoluciones.mezclar({ C1: '1', V1: '100', C2: '0.25', V2: '300' }).C, 0.4375)) mal('Disoluciones: la mezcla no da 0,4375');
    const malas = [() => Disoluciones.concentracion({ soluto: 'NaCl', tipo: 'mm', valor: '120' }), () => Disoluciones.concentracion({ soluto: '', tipo: 'M', valor: '1' }),
      () => Disoluciones.concentracion({ soluto: 'Xx', tipo: 'M', valor: '1' }), () => Disoluciones.concentracion({ soluto: 'HCl', tipo: 'M', valor: '18', densidad: '0.5' }),
      () => Disoluciones.diluir({ C1: '1', V1: '', C2: '', V2: '1' }), () => Disoluciones.diluir({ C1: '1', V1: '10', C2: '2', V2: '' }),
      () => Disoluciones.preparar({ soluto: 'HCl', M: '15', V: '100', origen: 'comercial', riqueza: '37', densidad: '1.19' })];
    malas.forEach((fn, i) => { let ok = false; try { fn(); } catch (e) { ok = true; } if (!ok) mal(`Disoluciones: el caso erróneo ${i + 1} debería dar un error`); });
    if (fallos === antes) console.log(`  ✓ Disoluciones: ${Disoluciones.ejemplos.length} concentraciones con los valores esperados y la vuelta desde cada forma, ${Disoluciones.ejemplosPreparar.length} preparaciones, diluciones, mezclas y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'quimica', 'disoluciones', 'index.html'));
      await page.waitForFunction(() => window.DisolApp);
      const antes = fallos;
      const verD = (await page.locator('#ver').textContent()).trim();
      if (verD !== Version.de('disoluciones').current) mal(`Disoluciones: la página muestra la versión «${verD}», se esperaba ${Version.de('disoluciones').current}`);
      for (const e of Disoluciones.ejemplos) {
        await page.evaluate((c) => DisolApp.abrirEjemplo(c), e.clave);
        if ((await page.locator('#valores .valor').count()) < 7 || (await page.locator('#pasos-conc li').count()) < 3) mal(`Disoluciones · ${e.clave}: faltan los valores o el desarrollo`);
      }
      await page.evaluate(() => DisolApp.abrirEjemplo('sulfurico'));
      if (!(await page.locator('#valores').textContent()).includes('18,39 mol/L')) mal('Disoluciones: el sulfúrico del 98 % no da 18,39 mol/L');
      await page.fill('#c-valor', '150');
      if (await page.locator('#error-conc').isHidden()) mal('Disoluciones: un 150 % no muestra el error');
      for (const e of Disoluciones.ejemplosPreparar) {
        await page.evaluate((c) => DisolApp.abrirEjemploP(c), e.clave);
        if ((await page.locator('#pasos-prep li').count()) < 3) mal(`Disoluciones · preparar ${e.clave}: no aparece el desarrollo`);
      }
      await page.evaluate(() => DisolApp.pestana('dil'));
      await page.fill('#d-C1', '2'); await page.fill('#d-V1', '50'); await page.fill('#d-C2', ''); await page.fill('#d-V2', '200');
      if (!(await page.locator('#res-dil').textContent()).includes('0,5')) mal('Disoluciones: la dilución en la página no da C₂ = 0,5');
      await page.close();
      if (consola.length) mal('Disoluciones: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Disoluciones: ${Disoluciones.ejemplos.length} concentraciones, ${Disoluciones.ejemplosPreparar.length} preparaciones y una dilución sin errores de consola`);
    }
  };
};
