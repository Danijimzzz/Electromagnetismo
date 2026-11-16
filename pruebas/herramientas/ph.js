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
    const vi = PHC.resolver({ ...PHC.ejemplos.find((e) => e.clave === 'val-acetico').sc, Vt: '0.05' });
    cerca(vi.pHv, vi.ph(0.05), 1e-9, 'valoración débil con 0,05 mL'); if (!(vi.pHv > r('acetico').pH)) mal('pH: al empezar a valorar el acético el pH no puede bajar');
    // PH-3: capacidad tampón β = dC_b/dpH (derivada numérica del balance de cargas) y máximo C ln10/4 en pH = pKa
    { const tp = r('tampon-acetato'), C = tp.Ct, Ka = 1.8e-5, Cb = (pH) => { const h = 10 ** -pH; return (C * Ka) / (Ka + h) + 1e-14 / h - h; }, d = 1e-5;
      cerca(tp.beta / ((Cb(tp.pH0 + d) - Cb(tp.pH0 - d)) / (2 * d)), 1, 1e-6, 'β del tampón acetato frente a la derivada numérica del balance de cargas');
      cerca(tp.betaMax / (Math.LN10 * C / 4), 1, 1e-12, 'β máxima = C ln10/4'); cerca(tp.betaDe(pKa) / tp.betaMax, 1, 1e-3, 'β en pH = pKa es la máxima');
      cerca(Math.max(...tp.curvaBeta.map((q) => q[1])) >= tp.betaMax ? 1 : 0, 1, 0, 'ningún punto de la curva por debajo del máximo teórico');
      if (!(tp.betaDe(pKa) > tp.betaDe(pKa + 2) && tp.betaDe(pKa) > tp.betaDe(pKa - 2))) mal('pH: β debería ser máxima en pH = pKa'); }
    // PH-2: indicador de cada equivalencia y aviso de saltos que se solapan
    { const vp = PHC.ejemplos.find((e) => e.sc.modo === 'valoracion' && PHC.resolver(e.sc).poli); if (vp) { const txtp = PHC.resolver(vp.sc).pasos.map((q) => q.t + q.html).join(' '); if (!/indicador/.test(txtp) || !/Se distinguen/.test(txtp)) mal('pH: la valoración poliprótica debería dar el indicador de cada equivalencia y avisar de saltos solapados'); } }
    // modos nuevos, calculados a mano
    // PH-4 sales anfóteras: pH ≈ ½(pKa1 + pKa2); NaHCO3 → 8,34; NaH2PO4 → 4,68; la fórmula completa se aparta poco con C grande
    cerca(r('sal-bicarbonato').pH0, (-lg(4.5e-7) - lg(4.7e-11)) / 2, 1e-12, 'pH anfótero del NaHCO3'); cerca(r('sal-bicarbonato').pH, 8.34, 0.02, 'pH del NaHCO3 con la fórmula completa');
    cerca(r('sal-dihidrogenofosfato').pH0, (-lg(7.1e-3) - lg(6.3e-8)) / 2, 1e-12, 'pH anfótero del NaH2PO4');
    // PH-1: 12 indicadores y los que sirven para cada valoración (viran dentro del salto de la equivalencia)
    if (PHC.INDICADORES.length !== 12 || PHC.INDICADORES.some((q) => !(q[2] > q[1]))) mal('pH · los 12 indicadores deben tener un intervalo de viraje válido');
    {
      const nombres = (x) => x.adecuados.map((q) => q[0]);
      const ac = PHC.resolver({ modo: 'valoracion', tipo: 'ad-bf', C: '0.1', V: '25', Ct: '0.1', Ka: '1.8e-5', K: '1.8e-5', pK: '', Vt: '' });
      if (!nombres(ac).includes('fenolftaleína') || nombres(ac).includes('naranja de metilo')) mal('pH · en acético con NaOH sirve la fenolftaleína y no el naranja de metilo (' + nombres(ac) + ')');
      const fuerte = PHC.resolver({ modo: 'valoracion', tipo: 'af-bf', C: '0.1', V: '25', Ct: '0.1', Vt: '' });
      if (!nombres(fuerte).includes('azul de bromotimol') || !nombres(fuerte).includes('fenolftaleína')) mal('pH · en HCl con NaOH sirven el azul de bromotimol y la fenolftaleína (' + nombres(fuerte) + ')');
    }
    cerca(r('sal-acetato').pH, 14 + lg((-(1e-14 / 1.8e-5) + Math.sqrt((1e-14 / 1.8e-5) ** 2 + 4 * (1e-14 / 1.8e-5) * 0.1)) / 2), 1e-12, 'hidrólisis del acetato');
    cerca(r('sal-amonio').pH, -lg((-(1e-14 / 1.8e-5) + Math.sqrt((1e-14 / 1.8e-5) ** 2 + 4 * (1e-14 / 1.8e-5) * 0.1)) / 2), 1e-12, 'hidrólisis del amonio');
    cerca(r('ka-ph').K, 10 ** -5.74 / (0.1 - 10 ** -2.87), 1e-15, 'Ka a partir del pH');
    cerca(r('c-ph').C, 1e-6 / 1.8e-5 + 1e-3, 1e-12, 'concentración de amoniaco para pH 11');
    cerca(r('preparar-acetato').Cs, 0.1 * 10 ** (5 - pKa), 1e-12, 'sal para un tampón de pH 5');
    cerca(r('mezcla-debil').pH, pKa, 1e-12, 'acético a medio neutralizar'); { const Kh = 1e-14 / 1.8e-5; cerca(r('mezcla-amoniaco').pH, -lg((-Kh + Math.sqrt(Kh * Kh + 4 * Kh * 0.05)) / 2), 1e-6, 'amoniaco y HCl a partes iguales'); }
    cerca(r('sulfurico').pH, -lg(0.01 + (-(0.01 + 0.012) + Math.sqrt((0.01 + 0.012) ** 2 + 4 * 0.012 * 0.01)) / 2), 2e-3, 'H₂SO₄ con su Ka₂');
    cerca(r('agua-50').pH, -lg(Math.sqrt(PHC.kwDe(50))), 1e-3, 'agua neutra a 50 °C'); cerca(r('agua-50').pKw, 13.262, 0.01, 'pKw a 50 °C');
    { // diagrama de especies: fracciones que suman 1, iguales a pH = pKa y α del anión a partir de Ka
      const Ka = [7.5e-3, 6.2e-8, 4.8e-13], al = PHC.fracciones(Ka, 7), suma = al.reduce((x, y) => x + y, 0);
      cerca(suma, 1, 1e-12, 'las fracciones de especies suman 1'); const a1 = PHC.fracciones(Ka, -lg(Ka[0])); cerca(a1[0], a1[1], 1e-9 * 1e3, 'α(H₃A) = α(H₂A⁻) a pH = pKa1');
      const h = 1e-7, den = 1 + Ka[0] / h + (Ka[0] * Ka[1]) / h ** 2 + (Ka[0] * Ka[1] * Ka[2]) / h ** 3; cerca(al[1], (Ka[0] / h) / den, 1e-12, 'α(H₂A⁻) a pH 7');
      const pc = r('carbonico'); cerca(pc.alfa.reduce((x, y) => x + y, 0), 1, 1e-12, 'fracciones del carbónico'); cerca(pc.alfa[0] * 0.05, pc.conc[0], 1e-12, '[H₂A] = α·C');
    }
    { const vp = r('val-fosforico'); if (vp.Veqs.join() !== '20,40,60') mal(`pH: equivalencias del fosfórico ${vp.Veqs}`); cerca(vp.ph(20), (-lg(7.5e-3) - lg(6.2e-8)) / 2, 0.1, 'primera equivalencia del fosfórico'); }
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
      // QU-4 · botones de exportar de la curva de valoración y del diagrama de especies
      { const a0 = fallos;
        const est = () => page.evaluate(() => ({ g: document.querySelector('#grafica').hidden, bg: [...document.querySelectorAll('.exportar')].filter((x) => x.previousElementSibling && x.previousElementSibling.id === 'grafica').map((x) => [x.hidden, x.querySelectorAll('button').length]), be: [...document.querySelectorAll('.exportar')].filter((x) => x.previousElementSibling && x.previousElementSibling.id === 'especies').map((x) => [x.hidden, x.querySelectorAll('button').length]) }));
        await page.evaluate(() => PHApp.abrirEjemplo('val-acetico'));
        const e1 = await est();
        if (e1.g || !e1.bg.length || e1.bg[0][0] || e1.bg[0][1] < 2) mal('pH · la valoración no muestra los botones de exportar: ' + JSON.stringify(e1));
        await page.evaluate(() => PHApp.abrirEjemplo('hcl'));
        const e2 = await est();
        if (!e2.bg.length || !e2.bg[0][0]) mal('pH · sin valoración los botones de exportar deberían estar ocultos: ' + JSON.stringify(e2));
        await page.evaluate(() => PHApp.abrirEjemplo('carbonico'));
        const e3 = await est();
        if (!e3.be.length || e3.be[0][0] || e3.be[0][1] < 2) mal('pH · el diagrama de especies no muestra los botones de exportar: ' + JSON.stringify(e3));
        if (fallos === a0) console.log('  ✓ pH · exportar PNG y datos de la curva de valoración y del diagrama de especies (y ocultos cuando no se ven)');
      }
      await page.close();
      if (consola.length) mal('pH: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ pH y valoraciones: ${PHC.ejemplos.length} ejemplos con MathML, curva solo en las valoraciones, K o pK, cambio de datos y errores sin errores de consola`);
    }
  };
};
