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
      if (e.clave === 'glucosa' && r.faltan.join() !== 'M,gL,mv,N') mal(`Disoluciones · glucosa: sin densidad deberían faltar M, g/L, % m/v y N, faltan ${r.faltan}`);
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
    // normalidad, otros objetivos al preparar, unidades al diluir y coligativas, a mano
    if (!cerca(Disoluciones.concentracion({ soluto: 'H2SO4', tipo: 'mm', valor: '98', densidad: '1.84' }).valores.N, (2 * 1840 * 0.98) / Mm('H2SO4'))) mal('Disoluciones: la normalidad del sulfúrico no es 2 · M');
    if (!cerca(Disoluciones.concentracion({ soluto: 'Ca(OH)2', tipo: 'N', valor: '0.04', densidad: '1' }).valores.M, 0.02)) mal('Disoluciones: Ca(OH)₂ 0,04 N no da 0,02 M');
    if (!cerca(P['h2so4-normal'].mPuro, 0.0625 * Mm('H2SO4'))) mal('Disoluciones · preparar H₂SO₄ 0,5 N: no son 0,0625 mol');
    if (!cerca(P['glucosa-gl'].mPesar, 25) || !cerca(P['nacl-masa'].agua, 190) || !cerca(P['urea-molal'].mPesar, 0.125 * Mm('CO(NH2)2'))) mal('Disoluciones: preparar en g/L, % en masa o molal no da lo esperado');
    if (!/ácido sobre el agua/.test(P.nitrico.instrucciones) || /ácido sobre/.test(P.nacl.instrucciones)) mal('Disoluciones: el aviso de seguridad del ácido no sale o sale donde no toca');
    if (!cerca(Disoluciones.diluir({ C1: '12', V1: '', C2: '500', V2: '0.25', uC1: 'M', uC2: 'mM', uV1: 'mL', uV2: 'L' }).V1, 125 / 12)) mal('Disoluciones: diluir con mmol/L y L no da V₁ = 10,42 mL');
    if (!cerca(Disoluciones.diluir({ C1: '5', V1: '10', C2: '', V2: '1', uC1: 'mv', uC2: 'gL', uV1: 'mL', uV2: 'L' }).C2, 0.5)) mal('Disoluciones: diluir un 5 % m/v a 1 L no da 0,5 g/L');
    { const g = Disoluciones.coligativas(Disoluciones.ejemplosColig[0].sc), n = 18 / Mm('C6H12O6'); if (!cerca(g.dTc, 1.86 * n / 0.5) || !cerca(g.dTe, 0.512 * n / 0.5) || !cerca(g.pi, n * 0.082 * 298.15 / 0.518)) mal('Disoluciones: las coligativas de la glucosa no salen'); if (!cerca(g.P, 23.76 * (500 / W) / (500 / W + n))) mal('Disoluciones: Raoult de la glucosa no sale'); }
    { const g = Disoluciones.coligativas(Disoluciones.ejemplosColig[1].sc); if (g.i !== 2 || !cerca(g.dTc, 2 * 1.86 * (5.85 / Mm('NaCl')) / 0.1)) mal('Disoluciones: el NaCl no toma i = 2'); }
    for (const [f, i] of [['NaCl', 2], ['CaCl2', 3], ['Al2(SO4)3', 5], ['(NH4)2SO4', 3], ['C6H12O6', null], ['KNO3', 2]]) if (Disoluciones.iones(f) !== i) mal(`Disoluciones: ${f} da ${Disoluciones.iones(f)} iones en vez de ${i}`);
    if (!cerca(Disoluciones.coligativas(Disoluciones.ejemplosColig[4].sc).M, (1.86 * 3.2) / (0.33 * 0.1))) mal('Disoluciones: la masa molar por crioscopía no sale');
    if (!cerca(Disoluciones.coligativas(Disoluciones.ejemplosColig[6].sc).M, (1 * 0.082 * 298.15) / (0.0045 * 0.1))) mal('Disoluciones: la masa molar por presión osmótica no sale');
    const malas = [() => Disoluciones.diluir({ C1: '1', V1: '10', C2: '', V2: '20', uC1: 'M', uC2: 'gL' }), () => Disoluciones.preparar({ soluto: 'NaCl', obj: 'mm', M: '50', V: '1', origen: 'comercial', riqueza: '10', densidad: '1' }),() => Disoluciones.concentracion({ soluto: 'NaCl', tipo: 'mm', valor: '120' }), () => Disoluciones.concentracion({ soluto: '', tipo: 'M', valor: '1' }),
      () => Disoluciones.concentracion({ soluto: 'Xx', tipo: 'M', valor: '1' }), () => Disoluciones.concentracion({ soluto: 'HCl', tipo: 'M', valor: '18', densidad: '0.5' }),
      () => Disoluciones.diluir({ C1: '1', V1: '', C2: '', V2: '1' }), () => Disoluciones.diluir({ C1: '1', V1: '10', C2: '2', V2: '' }),
      () => Disoluciones.preparar({ soluto: 'HCl', M: '15', V: '100', origen: 'comercial', riqueza: '37', densidad: '1.19' })];
    malas.forEach((fn, i) => { let ok = false; try { fn(); } catch (e) { ok = true; } if (!ok) mal(`Disoluciones: el caso erróneo ${i + 1} debería dar un error`); });
    if (fallos === antes) console.log(`  ✓ Disoluciones: ${Disoluciones.ejemplos.length} concentraciones con los valores esperados y la vuelta desde cada forma, ${Disoluciones.ejemplosPreparar.length} preparaciones (también en N, g/L, % y molal), normalidad, diluciones con unidades, mezclas, coligativas y masa molar a mano y errores`);
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
      for (const e of Disoluciones.ejemplosColig) {
        await page.evaluate((c) => DisolApp.abrirEjemploG(c), e.clave);
        if ((await page.locator('#valores-col .valor').count()) < 2 || (await page.locator('#pasos-col li').count()) < 3 || !(await page.locator('#error-col').isHidden())) mal(`Disoluciones · coligativas ${e.clave}: faltan los valores o el desarrollo`);
      }
      await page.evaluate(() => DisolApp.abrirEjemploG('nacl-agua'));
      if (!(await page.locator('#valores-col').textContent()).includes('−3,724 °C')) mal('Disoluciones: el NaCl en agua no congela a −3,724 °C en la página');
      await page.evaluate(() => DisolApp.abrirEjemploP('nacl-masa'));
      if (!(await page.locator('#et-pV').textContent()).includes('Masa de disolución') || !(await page.locator('#valores-prep').textContent()).includes('190 g')) mal('Disoluciones: preparar en % en masa no cambia la etiqueta o no da el agua');
      await page.evaluate(() => DisolApp.pestana('dil'));
      await page.selectOption('#d-uV2', 'L'); await page.fill('#d-C1', '2'); await page.fill('#d-V1', '50'); await page.fill('#d-C2', ''); await page.fill('#d-V2', '0,2');
      if (!(await page.locator('#res-dil').textContent()).includes('0,5 mol/L')) mal('Disoluciones: la dilución con V₂ en litros no da C₂ = 0,5 mol/L');
      await page.selectOption('#d-uV2', 'mL');
      await page.fill('#d-C1', '2'); await page.fill('#d-V1', '50'); await page.fill('#d-C2', ''); await page.fill('#d-V2', '200');
      if (!(await page.locator('#res-dil').textContent()).includes('0,5')) mal('Disoluciones: la dilución en la página no da C₂ = 0,5');
      await page.close();
      if (consola.length) mal('Disoluciones: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Disoluciones: ${Disoluciones.ejemplos.length} concentraciones, ${Disoluciones.ejemplosPreparar.length} preparaciones, ${Disoluciones.ejemplosColig.length} coligativas y diluciones con unidades sin errores de consola`);
    }
  };
};
