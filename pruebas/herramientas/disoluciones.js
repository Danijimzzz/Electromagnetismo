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

  {
    // DI-1 · solubilidad frente a T y Henry, a mano con la tabla y la fórmula de k_H(T)
    const antes = fallos, ST = require(path.join(fuente, 'quimica', 'solubilidad-t.js')), DD = require(path.join(fuente, 'quimica', 'datos.js'));
    const cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Disoluciones · ${q}: ${a} en vez de ${b}`); };
    { const r = ST.sal({ modo: 'sal', sal: 'KNO3', T: '50', agua: '200', soluto: '150' }); cerca(r.S, (63.9 + 110) / 2, 1e-12, 'KNO3 a 50 °C'); cerca(r.max, 2 * (63.9 + 110) / 2, 1e-12, 'máximo en 200 g'); if (r.estado !== 'insaturada') mal('Disoluciones · 150 g de KNO3 en 200 g a 50 °C deberían ser insaturada: ' + r.estado); cerca(r.w, 86.95 / 186.95 * 100, 1e-12, '% en masa saturada');
      const r2 = ST.sal({ modo: 'sal', sal: 'KNO3', T: '50', agua: '200', soluto: '200' }); if (!/sin disolver/.test(r2.estado)) mal('Disoluciones · 200 g de KNO3 deberían dejar sólido sin disolver: ' + r2.estado); }
    { const r = ST.sal({ modo: 'sal', sal: 'NaCl', T: '20', agua: '100' }); cerca(r.m, 35.9 * 10 / 58.443, 1e-3, 'molalidad del NaCl saturado'); }
    cerca(ST.sal({ modo: 'cristal', sal: 'KNO3', T: '80', T2: '20', agua: '500', soluto: '' }).cristaliza, (169 - 31.6) * 5, 1e-12, 'KNO3 que cristaliza al enfriar');
    cerca(ST.sal({ modo: 'cristal', sal: 'NaCl', T: '100', T2: '0', agua: '100', soluto: '' }).cristaliza, 39.2 - 35.7, 1e-12, 'NaCl que cristaliza');
    { const r = ST.sal({ modo: 'cristal', sal: 'KNO3', T: '20', T2: '60', agua: '100', soluto: '' }); if (r.cristaliza !== 0 || Math.abs(r.admiteMas - (110 - 31.6)) > 1e-9) mal('Disoluciones · calentar no debe cristalizar y sí admitir más: ' + JSON.stringify([r.cristaliza, r.admiteMas])); }
    { const r = ST.sal({ modo: 'cristal', sal: 'KNO3', T: '80', T2: '20', agua: '100', soluto: '100' }); cerca(r.cristaliza, 100 - 31.6, 1e-12, 'cristaliza partiendo de 100 g disueltos'); }
    // temperaturas de saturación: K2Cr2O7 a 40 g entre 40 (26,3) y 60 °C (45,6); Na2SO4 a 45 g sube y baja
    { const r = ST.sal({ modo: 'busca', sal: 'K2Cr2O7', x: '40' }); cerca(r.T[0], 40 + 20 * (40 - 26.3) / (45.6 - 26.3), 1e-6, 'T de saturación del K2Cr2O7'); const n = ST.sal({ modo: 'busca', sal: 'Na2SO4', x: '45' }); cerca(n.T.length, 2, 0, 'dos temperaturas para el Na2SO4'); cerca(n.T[0], 20 + 20 * (45 - 19.5) / (48.8 - 19.5), 1e-6, 'primera T del Na2SO4'); cerca(n.T[1], 60 + 20 * (45 - 45.3) / (43.7 - 45.3), 1e-6, 'segunda T del Na2SO4'); cerca(ST.sal({ modo: 'busca', sal: 'KCl', x: '90' }).T.length, 0, 0, 'KCl no llega a 90 g'); }
    // Henry: O2 a 20 °C y 0,2095 atm; a más temperatura, menos gas
    { const k = 1.3e-3 * Math.exp(1700 * (1 / 293.15 - 1 / 298.15)), r = ST.gas({ gas: 'O2', Tg: '20', p: '0,2095' }); cerca(r.k, k, 1e-12, 'k_H del O2 a 20 °C'); cerca(r.c, k * 0.2095, 1e-12, 'c del O2'); cerca(r.mgL, k * 0.2095 * 31.998 * 1000, 1e-9, 'mg/L de O2'); cerca(r.mgL, 9.6, 0.02, 'O2 en agua a 20 °C ≈ 9,6 mg/L (sin presión de vapor)'); if (!(ST.gas({ gas: 'O2', Tg: '40', p: '0,2095' }).c < r.c)) mal('Disoluciones · el O2 debe disolverse menos al calentar');
      const q = ST.gas({ gas: 'CO2', Tg: '5', p: '', obj: '3000' }); cerca(q.c, 3 / 44.009, 1e-9, 'c pedida del CO2'); cerca(ST.gas({ gas: 'CO2', Tg: '5', p: String(q.p) }).mgL, 3000, 1e-9, 'ida y vuelta de Henry'); }
    // los datos: crecientes donde toca, valores coherentes con el tipo de sal y todas las fórmulas reconocidas
    for (const [id, sl] of Object.entries(DD.SOLUBILIDAD_T)) { if (sl.v.length !== 6 || sl.v.some((x) => !(x > 0))) mal(`Disoluciones · datos de solubilidad de ${id}`); }
    for (const id of ['KNO3', 'KCl', 'NH4Cl', 'NaNO3', 'CuSO4', 'K2Cr2O7', 'KClO3', 'PbNO32', 'sacarosa']) if (DD.SOLUBILIDAD_T[id].v.some((x, i, a) => i && x <= a[i - 1])) mal(`Disoluciones · ${id} debería crecer con la temperatura`);
    for (const id of ['CaOH2', 'Li2SO4']) if (DD.SOLUBILIDAD_T[id].v.some((x, i, a) => i && x >= a[i - 1])) mal(`Disoluciones · ${id} debería bajar con la temperatura`);
    if (!DD.FUENTES.solubilidadT || !DD.FUENTES.henry) mal('Disoluciones · faltan las fuentes de solubilidad y de Henry');
    for (const [sc, q] of [[{ modo: 'sal', sal: 'KNO3', T: '120', agua: '100' }, 'T fuera de 0–100 °C'], [{ modo: 'sal', sal: 'xx', T: '20', agua: '100' }, 'sal que no existe'], [{ modo: 'sal', sal: 'KNO3', T: '20', agua: '0' }, 'agua cero'], [{ modo: 'cristal', sal: 'KNO3', T: '20', T2: '10', agua: '100', soluto: '500' }, 'más soluto del que cabe'], [{ modo: 'busca', sal: 'KNO3', x: '' }, 'falta la cantidad']]) { let ok = false; try { ST.sal(sc); } catch (e) { ok = true; } if (!ok) mal(`Disoluciones · ${q} no da error`); }
    for (const [sc, q] of [[{ gas: 'O2', Tg: '80', p: '1' }, 'gas a 80 °C'], [{ gas: 'zz', Tg: '20', p: '1' }, 'gas que no existe'], [{ gas: 'O2', Tg: '20', p: '' , obj: ''}, 'falta la presión']]) { let ok = false; try { ST.gas(sc); } catch (e) { ok = true; } if (!ok) mal(`Disoluciones · ${q} no da error`); }
    if (fallos === antes) console.log(`  ✓ Disoluciones · ${DD.SOLUBILIDAD_T ? Object.keys(DD.SOLUBILIDAD_T).length : 0} sales y ${Object.keys(DD.HENRY).length} gases: solubilidad, cristalización, saturación y Henry a mano, y errores`);
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
      // solubilidad y gases en la página
      { const a0 = fallos;
        await page.evaluate(() => DisolApp.abrirEjemploS('kno3-cristal'));
        const t1 = await page.evaluate(() => ({ r: DisolApp.resultadoSol(), sel: document.querySelector('#tab-sol').getAttribute('aria-selected'), vis: !document.querySelector('#sol').hidden, b: [...document.querySelectorAll('#sol .exportar button')].length, ocultos: [...document.querySelectorAll('#sol [data-m]')].filter((n) => n.hidden).length }));
        if (Math.abs(t1.r.cristaliza - 687) > 1e-6 || t1.sel !== 'true' || !t1.vis || t1.b < 2 || t1.ocultos < 3) mal('Disoluciones · solubilidad en la página: ' + JSON.stringify(t1));
        await page.fill('#s-agua', '100');
        if (Math.abs((await page.evaluate(() => DisolApp.resultadoSol().cristaliza)) - 137.4) > 1e-6) mal('Disoluciones · cambiar la masa de agua no recalcula');
        await page.evaluate(() => DisolApp.abrirEjemploS('co2-refresco'));
        const g1 = await page.evaluate(() => ({ r: DisolApp.resultadoSol(), gas: !document.querySelector('label[for=s-gas]').hidden, sal: document.querySelector('label[for=s-sal]').hidden, tit: document.querySelector('#titulo-graf-sol').textContent }));
        if (!(g1.r.mgL > 9000) || !g1.gas || !g1.sal || !/Gas/.test(g1.tit)) mal('Disoluciones · gas en la página: ' + JSON.stringify(g1));
        await page.fill('#s-Tg', '90');
        if (await page.locator('#error-sol').isHidden()) mal('Disoluciones · un gas a 90 °C no muestra el error');
        await page.evaluate(() => DisolApp.abrirEjemploS('na2so4-pico'));
        if (!/y/.test(await page.locator('#valores-sol').innerText())) mal('Disoluciones · Na2SO4 no muestra dos temperaturas');
        if (fallos === a0) console.log('  ✓ Disoluciones · solubilidad frente a T y gases en la página, con la gráfica y los botones de exportar');
      }
      await page.close();
      if (consola.length) mal('Disoluciones: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Disoluciones: ${Disoluciones.ejemplos.length} concentraciones, ${Disoluciones.ejemplosPreparar.length} preparaciones, ${Disoluciones.ejemplosColig.length} coligativas y diluciones con unidades sin errores de consola`);
    }
  };
};
