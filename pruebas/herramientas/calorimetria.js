/* Comprobación de calorimetria: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo calorimetria ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Calor = require(path.join(fuente, 'calorimetria', 'fisica.js'));
  {
    // equilibrios resueltos a mano (c agua 4180, hielo 2090, vapor 2010; Lf 334 kJ/kg; Lv 2257 kJ/kg) y Σ Q = 0
    const antes = fallos, cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
    const R = Object.fromEntries(Calor.ejemplos.map((e) => [e.clave, Calor.resolver(e)]));
    const ESP = {
      'hielo-agua': (0.2 * 4180 * 40 - 0.05 * 2090 * 10 - 0.05 * 334e3) / (0.25 * 4180),
      'sobra-hielo': 0,
      'cobre-agua': (0.2 * 385 * 100 + 0.3 * 4180 * 20) / (0.2 * 385 + 0.3 * 4180),
      calorimetro: (0.15 * 900 * 90 + (0.25 * 4180 + 125) * 18) / (0.15 * 900 + 0.25 * 4180 + 125),
      vapor: (0.01 * 2257e3 + 0.01 * 4180 * 100 + 0.2 * 4180 * 20) / (0.21 * 4180),
      'plomo-fundido': (0.5 * 142 * (400 - 327.5) + 0.5 * 23e3 + 0.5 * 128 * 327.5 + 1 * 4180 * 15) / (0.5 * 128 + 4180),
    };
    for (const [k, Te] of Object.entries(ESP)) {
      const r = R[k];
      if (!cerca(r.Te, Te)) mal(`Calorimetría · ${k}: T_e = ${r.Te}, se esperaba ${Te}`);
      const suma = r.cuerpos.reduce((s, c) => s + c.Q, 0);
      if (Math.abs(suma) > 1e-6 * Math.max(1, r.absorbido)) mal(`Calorimetría · ${k}: Σ Q = ${suma} J`);
      for (const c of r.cuerpos) { const qe = c.etapas.reduce((s, e) => s + e.Q, 0); if (!cerca(qe, c.Q)) mal(`Calorimetría · ${k}: las etapas de ${c.nombre} suman ${qe}, no ${c.Q}`); }
    }
    const fundido = (0.1 * 4180 * 20) / 334e3;
    if (!cerca(R['sobra-hielo'].cuerpos[0].fraccion, fundido / 0.1)) mal(`Calorimetría · sobra-hielo: se funde una fracción ${R['sobra-hielo'].cuerpos[0].fraccion}, se esperaba ${fundido / 0.1}`);
    if (R['sobra-hielo'].cuerpos[1].fraccion !== 1) mal('Calorimetría · sobra-hielo: el agua templada no debería congelarse');
    // hielo muy frío que congela toda el agua: el equilibrio baja de 0 °C
    const frio = Calor.equilibrio({ cuerpos: [{ sustancia: 'agua', m: '500', T0: '-50' }, { sustancia: 'agua', m: '100', T0: '10' }] });
    if (!cerca(frio.Te, (0.1 * 4180 * 10 + 0.1 * 334e3 - 0.5 * 2090 * 50) / (0.6 * 2090))) mal(`Calorimetría: hielo a −50 °C con agua a 10 °C da ${frio.Te}`);
    const malas = [{ cuerpos: [{ sustancia: 'agua', m: '10', T0: '20' }] }, { cuerpos: [{ sustancia: 'agua', m: '-1', T0: '20' }, { sustancia: 'agua', m: '1', T0: '0' }] },
      { cuerpos: [{ sustancia: 'agua', m: '10', T0: '50', estado: 'solido' }, { sustancia: 'agua', m: '1', T0: '0' }] }, { cuerpos: [{ sustancia: 'agua', m: '10', T0: '-300' }, { sustancia: 'agua', m: '1', T0: '0' }] },
      { cuerpos: [{ sustancia: 'calorimetro', C: '100', T0: '20' }, { sustancia: 'calorimetro', C: '10', T0: '50' }] }];
    for (const m of malas) { let ok = false; try { Calor.equilibrio(m); } catch (e) { ok = true; } if (!ok) mal(`Calorimetría: ${JSON.stringify(m.cuerpos)} debería dar un error`); }
    // problemas al revés y calentador, resueltos a mano
    const I = Object.fromEntries(Calor.ejemplos.filter((e) => e.Tfin || e.cuerpos.some((c) => c.sustancia === 'calentador')).map((e) => [e.clave, Calor.resolver(e)]));
    const INV = {
      'calor-especifico': (0.2 * 4180 * 4) / (0.12 * 76),
      'cuanto-hielo': (1000 * 0.33 * 4180 * 20) / (2090 * 18 + 334e3 + 4180 * 5),
      equivalente: (1000 * ((0.1 * 4180 * 35 - 0.2 * 4180 * 15) / 15)) / 4180,
      hervidor: (4180 * 80) / (0.9 * 2000),
    };
    for (const [k, v] of Object.entries(INV)) if (!I[k].incognita || !cerca(I[k].incognita.valor, v, 1e-7)) mal(`Calorimetría · ${k}: sale ${I[k].incognita && I[k].incognita.valor}, se esperaba ${v}`);
    if (!cerca(I.calentador.Te, (300e3 / 0.5 - 2090 * 10 - 334e3) / 4180)) mal(`Calorimetría · calentador: T_e = ${I.calentador.Te}`);
    for (const r of Object.values(I)) if (Math.abs(r.cuerpos.reduce((s, c) => s + c.Q, 0)) > 1e-6 * r.absorbido) mal('Calorimetría: con calentador o al revés Σ Q no es 0');
    for (const m of [{ Tfin: '20', cuerpos: [{ sustancia: 'agua', m: '?', T0: '?' }, { sustancia: 'agua', m: '1', T0: '0' }] }, { cuerpos: [{ sustancia: 'agua', m: '?', T0: '10' }, { sustancia: 'agua', m: '1', T0: '0' }] }, { Tfin: '90', cuerpos: [{ sustancia: 'agua', m: '?', T0: '10' }, { sustancia: 'agua', m: '100', T0: '50' }] }]) {
      let ok = false; try { Calor.resolver(m); } catch (e) { ok = true; } if (!ok) mal(`Calorimetría al revés: ${JSON.stringify(m)} debería dar un error`);
    }
    // dilatación
    const D = Object.fromEntries(Calor.ejemplosDil.map((e) => [e.clave, Calor.dilatacion(e.sc).res]));
    if (!cerca(D.rail.dX, 12e-6 * 25 * 50)) mal(`Dilatación · raíl: ΔL = ${D.rail.dX}`);
    if (!cerca(D.anillo.Tobjetivo, 20 + 0.0001 / (19e-6 * 0.0499))) mal(`Dilatación · anillo: T = ${D.anillo.Tobjetivo}`);
    if (!cerca(D.chapa.dX, 2 * 23e-6 * 2 * 80) || !cerca(D.cubo.dX, 3 * 17e-6 * 200)) mal('Dilatación: la superficial usa 2α y la de volumen 3α');
    if (!cerca(D.rebose.dX, (1.82e-4 - 3 * 9e-6) * 60)) mal(`Dilatación · rebose: ΔV = ${D.rebose.dX}`);
    if (fallos === antes) console.log(`  ✓ Calorimetría: ${Calor.ejemplos.length} equilibrios con la temperatura esperada, Σ Q = 0, fases parciales, problemas al revés, calentador, dilatación y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'calorimetria', 'index.html'));
      await page.waitForFunction(() => window.CalorApp);
      const antes = fallos;
      const verC = (await page.locator('#ver').textContent()).trim();
      if (verC !== Version.de('calorimetria').current) mal(`Calorimetría: la página muestra la versión «${verC}», se esperaba ${Version.de('calorimetria').current}`);
      for (const e of Calor.ejemplos) {
        await page.evaluate((c) => CalorApp.abrirEjemplo(c), e.clave);
        if ((await page.locator('#tabla tbody tr').count()) !== e.cuerpos.length + 1 || (await page.locator('#pasos li').count()) < 3) mal(`Calorimetría · ${e.clave}: faltan la tabla o el desarrollo`);
      }
      await page.evaluate(() => CalorApp.abrirEjemplo('hielo-agua'));
      if (!(await page.locator('#te').textContent()).includes('15,02')) mal('Calorimetría: hielo y agua no dan 15,02 °C en la página');
      await page.evaluate(() => CalorApp.abrirEjemplo('calor-especifico'));
      if (!(await page.locator('#te').textContent()).includes('366,7')) mal('Calorimetría: el calor específico del metal no sale 366,7 en la página');
      for (const e of Calor.ejemplosDil) {
        await page.evaluate((c) => CalorApp.abrirEjemploD(c), e.clave);
        if ((await page.locator('#pasos-d li').count()) < 1 || !(await page.locator('#error-d').isHidden()) || (await page.locator('#panel-dilatacion').isHidden())) mal(`Dilatación · ${e.clave}: no aparece el desarrollo`);
      }
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => CalorApp.azar());
        const en = await page.evaluate(() => CalorApp.enunciado());
        if (!(await page.locator('#error').isHidden()) || !(await page.locator('#error-d').isHidden()) || /undefined|NaN/.test(en)) mal(`Calorimetría · práctica: ejercicio al azar con error o sin enunciado: ${en}`);
      }
      await page.evaluate(() => CalorApp.abrirEjemplo('hielo-agua'));
      await page.click('#anade');
      await page.selectOption('#c2-sustancia', 'otra');
      await page.fill('#c2-cl', '1000'); await page.fill('#c2-m', '100'); await page.fill('#c2-T0', '60');
      if (!(await page.locator('#error').isHidden())) mal('Calorimetría: una sustancia propia con c del líquido da error: ' + (await page.locator('#error').textContent()));
      await page.fill('#c0-m', 'x');
      if (await page.locator('#error').isHidden()) mal('Calorimetría: una masa no numérica no muestra el error');
      await page.close();
      if (consola.length) mal('Calorimetría: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Calorimetría: ${Calor.ejemplos.length} equilibrios, cuerpo propio y errores sin errores de consola`);
    }
  };
};
