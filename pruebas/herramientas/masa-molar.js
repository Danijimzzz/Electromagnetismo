/* Comprobación de masa-molar: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo masa-molar ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Formulas = require(path.join(fuente, 'quimica', 'formulas.js'));
  {
    // masas molares y ajustes de referencia, y el reactivo limitante de cada ejemplo
    const antes = fallos;
    const MASAS = { H2O: 18.015, 'Ca(OH)2': 74.092, 'K4[Fe(CN)6]': 368.345, 'CuSO4·5H2O': 249.677, 'Al2(SO4)3': 342.132, 'SO4^2-': 96.056 };
    for (const [f, M] of Object.entries(MASAS)) { const o = Formulas.masaMolar(f).M; if (Math.abs(o - M) > 2e-3) mal(`Masa molar · ${f}: ${o}, se esperaba ${M}`); }
    if (Formulas.masaMolar('H2SO4', 'redondeadas').M !== 98) mal('Masa molar · H2SO4 con masas de clase debería dar 98');
    const AJ = { propano: '1,5,3,4', 'alto-horno': '1,3,2,3', aluminio: '2,6,2,3', permanganato: '2,16,2,2,5,8', 'cobre-nitrico': '3,8,3,2,4', 'redox-ionica': '1,5,8,1,5,4' };
    const LIM = { propano: 'O2', 'alto-horno': 'Fe2O3', aluminio: 'HCl', permanganato: 'KMnO4', 'cobre-nitrico': 'Cu', 'redox-ionica': 'Fe^2+' };
    for (const e of Formulas.ejemplos) {
      const c = Formulas.ajustar(e.ecuacion).especies.map((s) => s.coef).join(',');
      if (c !== AJ[e.clave]) mal(`Estequiometría · ${e.clave}: coeficientes ${c}, se esperaban ${AJ[e.clave]}`);
      const r = Formulas.estequiometria(e.ecuacion, e.cantidades);
      if (r.especies[r.limitante].texto !== LIM[e.clave]) mal(`Estequiometría · ${e.clave}: limitante ${r.especies[r.limitante].texto}, se esperaba ${LIM[e.clave]}`);
    }
    const co2 = Formulas.estequiometria('C3H8 + O2 -> CO2 + H2O', [{ valor: 44, unidad: 'g' }, { valor: 100, unidad: 'g' }]).especies[2];
    if (Math.abs(co2.masa - 82.52) > 0.01) mal(`Estequiometría · propano: CO2 ${co2.masa} g, se esperaban 82,52 g`);
    for (const mala of ['H2O -> H2 + O2 + O3', 'NaCl -> Na', 'Xx -> X', 'H2 + O2']) { let ok = false; try { Formulas.ajustar(mala); } catch (e) { ok = true; } if (!ok) mal(`Estequiometría: «${mala}» debería dar un error`); }
    if (fallos === antes) console.log(`  ✓ Masa molar y estequiometría: masas de referencia, ${Formulas.ejemplos.length} reacciones ajustadas con su limitante y errores de entrada`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'quimica', 'masa-molar', 'index.html'));
      await page.waitForFunction(() => window.MasaApp);
      const antes = fallos;
      const verM = (await page.locator('#ver').textContent()).trim();
      if (verM !== Version.de('masa-molar').current) mal(`Masa molar: la página muestra la versión «${verM}», se esperaba ${Version.de('masa-molar').current}`);
      await page.evaluate(() => MasaApp.pestana('masa'));
      await page.fill('#formula', 'H2SO4');
      if (!(await page.locator('#res-masa').textContent()).includes('98,072')) mal('Masa molar: H2SO4 no da 98,072 g/mol');
      await page.fill('#cv-g', '49');
      if ((await page.inputValue('#cv-mol')) !== '0,4996') mal(`Masa molar: 49 g de H2SO4 dan ${await page.inputValue('#cv-mol')} mol, se esperaba 0,4996`);
      for (const e of Formulas.ejemplos) {
        await page.evaluate((c) => MasaApp.abrirEjemplo(c), e.clave);
        if (!(await page.locator('#tabla-este tr.lim').count())) mal(`Estequiometría · ${e.clave}: no se marca el reactivo limitante`);
      }
      await page.fill('#ecuacion', 'Co + O2 ->');
      if (await page.locator('#error-este').isHidden()) mal('Estequiometría: una reacción incompleta no muestra el error');
      await page.close();
      if (consola.length) mal('Masa molar: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Masa molar y estequiometría: fórmula, conversor y ${Formulas.ejemplos.length} reacciones sin errores de consola`);
    }
  };
};
