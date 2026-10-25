/* Comprobación de ph: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo ph ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const PHC = require(path.join(fuente, 'ph', 'calculo.js'));
  {
    // valores calculados a mano
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`pH · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => PHC.resolver(PHC.ejemplos.find((e) => e.clave === c).sc), lg = Math.log10, pKa = -lg(1.8e-5);
    cerca(r('hcl').pH, 2, 1e-12, 'HCl 0,01 M'); cerca(r('baoh2').pH, 12, 1e-12, 'Ba(OH)₂ con dos OH⁻');
    cerca(r('diluido').pH, -lg((1e-8 + Math.sqrt(1e-16 + 4e-14)) / 2), 1e-12, 'ácido muy diluido con el agua');
    const ac = r('acetico'), x = (-1.8e-5 + Math.sqrt(1.8e-5 ** 2 + 4 * 1.8e-6)) / 2;
    cerca(ac.pH, -lg(x), 1e-12, 'ácido acético'); cerca(ac.alfa, x / 0.1, 1e-12, 'grado de disociación');
    cerca(ac.pH, PHC.exacto({ ca: 0.1, Ka: 1.8e-5 }), 1e-3, 'ácido acético con el balance de cargas');
    const am = r('amoniaco'), y = (-1.8e-5 + Math.sqrt(1.8e-5 ** 2 + 4 * 3.6e-6)) / 2;
    cerca(am.pH, 14 + lg(y), 1e-12, 'amoniaco');
    if (!(r('hf').alfa > 0.05)) mal('pH: el HF 0,01 M debería tener α > 5 %');
    cerca(r('tampon-acetato').pH, pKa, 1e-12, 'tampón con las dos formas iguales');
    cerca(r('tampon-hcl').pH, pKa + lg(0.009 / 0.011), 1e-12, 'tampón al añadir HCl');
    cerca(r('tampon-amonio').pH, 14 - pKa + lg(0.15 / 0.1), 1e-12, 'tampón amoniaco/amonio');
    cerca(r('mezcla').pH, 14 + lg(0.001 / 0.08), 1e-12, 'mezcla con exceso de base');
    const vf = r('val-fuerte');
    cerca(vf.Veq, 25, 1e-12, 'volumen de equivalencia'); cerca(vf.pHv, -lg(0.0005 / 0.045), 1e-12, 'pH antes de la equivalencia'); cerca(vf.ph(25), 7, 1e-6, 'pH 7 en la equivalencia fuerte-fuerte');
    const va = r('val-acetico');
    cerca(va.pHv, pKa, 1e-12, 'pH = pKa a mitad'); cerca(va.ph(25), va.pHeq, 0.01, 'pH de equivalencia exacto y de clase'); cerca(va.ph(12.5), pKa, 0.01, 'curva exacta a mitad');
    // Henderson-Hasselbalch no vale con casi nada de valorante: el pH sale del equilibrio entero
    const vi = PHC.valoracion({ ...PHC.ejemplos.find((e) => e.clave === 'val-acetico').sc, Vt: '0.05' });
    cerca(vi.pHv, vi.ph(0.05), 1e-9, 'valoración débil con 0,05 mL'); if (!(vi.pHv > r('acetico').pH)) mal('pH: al empezar a valorar el acético el pH no puede bajar');
    if (va.ind[0] !== 'fenolftaleína') mal(`pH: para el acético con NaOH sale ${va.ind[0]}`);
    if (va.curva.some((q, i) => i && q[1] < va.curva[i - 1][1] - 1e-9)) mal('pH: la curva de valoración de un ácido no sube siempre');
    const vb = r('val-amoniaco');
    cerca(vb.pHv, -lg(0.001 / 0.05), 1e-12, 'pasada la equivalencia con HCl'); cerca(vb.ph(20), vb.pHeq, 0.01, 'equivalencia del amoniaco');
    // un tampón que se agota no da error y el pH cae
    const ag = PHC.tampon({ especie: 'acido', K: '1.8e-5', Cd: '0.1', Cs: '0.1', V: '100', anade: 'acido', Cad: '1', Vad: '20' });
    cerca(ag.pH, PHC.exacto({ ca: 0.02 / 0.12, Ka: 1.8e-5, na: 0.01 / 0.12, cl: 0.02 / 0.12 }), 1e-9, 'tampón agotado');
    if (PHC.f2(2.875) !== '2,88' && PHC.f2(2.875) !== '2,87') mal(`pH: 2,875 sale «${PHC.f2(2.875)}»`);
    for (const [sc, q] of [[{ modo: 'debil', C: '0.1' }, 'sin Ka'], [{ modo: 'fuerte', C: '-1' }, 'concentración negativa'], [{ modo: 'valoracion', tipo: 'ad-bf', C: '0.1', V: '25', Ct: '0.1' }, 'valoración débil sin Ka'], [{ modo: 'mezcla', Ca: '0.1', Va: '10', Cb: '0.1' }, 'mezcla sin volumen de base']]) {
      let ok = false; try { PHC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`pH: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ pH y valoraciones: ${PHC.ejemplos.length} ejemplos, fuertes, débiles, tampones, mezclas, curvas e indicador`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'quimica', 'ph', 'index.html'));
      await page.waitForFunction(() => window.PHApp);
      const antes = fallos;
      const verP = (await page.locator('#ver').textContent()).trim();
      if (verP !== Version.de('ph').current) mal(`pH: la página muestra la versión «${verP}», se esperaba ${Version.de('ph').current}`);
      for (const e of PHC.ejemplos) {
        await page.evaluate((c) => PHApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(120);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, graf: !document.querySelector('#grafica').hidden }));
        if (r.err || r.pasos < 3 || r.res < 2) mal(`pH · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`pH · ${e.clave}: el desarrollo no sale en MathML`);
        if (r.graf !== (e.sc.modo === 'valoracion')) mal(`pH · ${e.clave}: la curva de valoración ${r.graf ? 'sale y no debería' : 'no sale'}`);
      }
      await page.evaluate(() => PHApp.abrirEjemplo('acetico'));
      if (!(await page.locator('#resumen').textContent()).includes('2,88')) mal('pH: el pH del acético no sale en la página');
      // al escribir el pKa se vacía Ka y sale lo mismo
      await page.fill('#f-pK', '4.74');
      if ((await page.inputValue('#f-K')) !== '' || !(await page.locator('#error').isHidden())) mal('pH: al escribir el pKa no se vacía Ka o da error');
      await page.selectOption('#f-modo', 'tampon');
      await page.selectOption('#f-anade', 'base');
      if ((await page.locator('#f-Vad').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('pH: al añadir una base al tampón no pide el volumen o da error');
      await page.selectOption('#f-modo', 'valoracion');
      await page.selectOption('#f-tipo', 'ad-bf');
      if (!(await page.locator('#error').isHidden())) mal('pH: al elegir una valoración de ácido débil da error');
      await page.fill('#f-C', '');
      if (await page.locator('#error').isHidden()) mal('pH: sin concentración no muestra el error');
      await page.click('#play');
      await page.close();
      if (consola.length) mal('pH: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ pH y valoraciones: ${PHC.ejemplos.length} ejemplos con MathML, curva solo en las valoraciones, K o pK, cambio de datos y errores sin errores de consola`);
    }
  };
};
