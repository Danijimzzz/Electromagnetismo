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
    // formas de escribir que se aceptan: estados, cargas sin ^, + pegado, doble flecha y electrones
    const LEE = { 'H2O(l)': [{ H: 2, O: 1 }, 0, 'l'], 'NaCl(aq)': [{ Na: 1, Cl: 1 }, 0, 'aq'], 'Fe3+': [{ Fe: 1 }, 3, null], 'NO3-': [{ N: 1, O: 3 }, -1, null], 'NH4+': [{ N: 1, H: 4 }, 1, null], 'SO42-': [{ S: 1, O: 4 }, -2, null], 'SO4 2-': [{ S: 1, O: 4 }, -2, null], 'SO₄²⁻': [{ S: 1, O: 4 }, -2, null], 'Cr2O72-': [{ Cr: 2, O: 7 }, -2, null], 'Fe^3+(aq)': [{ Fe: 1 }, 3, 'aq'] };
    for (const [f, [at, q, e]] of Object.entries(LEE)) { const r = Formulas.leer(f); if (JSON.stringify(r.atomos) !== JSON.stringify(at) || r.carga !== q || r.estado !== e) mal(`Fórmulas · «${f}» se lee como ${JSON.stringify([r.atomos, r.carga, r.estado])}`); }
    const AJ2 = { 'CH4+O2->CO2+H2O': '1,2,1,2', 'N2(g) + H2(g) ⇌ NH3(g)': '1,3,2', 'N2 + H2 <-> NH3': '1,3,2', 'Fe2++MnO4-+H+->Fe3++Mn2++H2O': '5,1,8,5,1,4', 'MnO4- + H+ + e- -> Mn2+ + H2O': '1,8,5,1,4' };
    for (const [e, c] of Object.entries(AJ2)) { const o = Formulas.ajustar(e).especies.map((x) => x.coef).join(','); if (o !== c) mal(`Estequiometría · «${e}»: ${o}, se esperaba ${c}`); }
    // pureza, disolución, gas a 25 °C y rendimiento real (a mano: 9 g de Zn = 0,13766 mol; 0,2 mol de HCl, limitante; 0,1 mol de H2)
    const z = Formulas.estequiometria('Zn(s) + HCl(aq) -> ZnCl2(aq) + H2(g)', [{ valor: '10', unidad: 'g', extra: '90' }, { valor: '100', unidad: 'disol', extra: '2' }], { T: 298.15, P: 1, real: { i: 3, masa: '0,16' } });
    if (z.especies[z.limitante].texto !== 'HCl(aq)') mal('Estequiometría: con 10 g de Zn al 90 % y 100 mL de HCl 2 M el limitante es el HCl');
    if (Math.abs(z.renReal - (100 * 0.16) / (0.1 * 2.016)) > 1e-6) mal(`Estequiometría: rendimiento real ${z.renReal}`);
    if (Math.abs(z.especies[3].volumen - z.especies[3].formado * 0.082 * 298.15) > 1e-9) mal('Estequiometría: el volumen del H2 a 25 °C no es nRT/P');
    // fórmula empírica y molecular
    const EMP = [[{ composicion: 'C 40; H 6,7; O 53,3', M: '180' }, 'CH2O', 'C6H12O6'], [{ composicion: 'Fe 69,9; O 30,1' }, 'Fe2O3', null], [{ composicion: 'K 26,6; Cr 35,4; O 38,0' }, 'K2Cr2O7', null], [{ composicion: 'C 92,3; H 7,7', M: '78' }, 'CH', 'C6H6'], [{ tipo: 'combustion', muestra: '0,2', co2: '0,2934', h2o: '0,1201', M: '60' }, 'CH2O', 'C2H4O2']];
    for (const [sc, e, m] of EMP) { const r = Formulas.empirica(sc); if (r.empirica !== e || r.molecular !== m) mal(`Fórmula empírica · ${JSON.stringify(sc)}: ${r.empirica} y ${r.molecular}`); }
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
