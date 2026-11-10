/* Comprobación del ajustador de reacciones: cálculos en Node y la página en Chromium. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo ajustador ejecuta solo esta).
   Los coeficientes de los ejemplos están ajustados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'ajustador', 'calculo.js'));
  {
    const antes = fallos;
    const AJ = { precipitacion: '1,1,1,1', neutralizacion: '1,2,1,2', 'carbonato-acido': '1,2,1,1,1', 'carbonato-soluble': '1,2,2,1,1', propano: '1,5,3,4', glucosa: '1,6,6,6', 'oxido-hierro': '4,3,2', clorato: '2,2,3', amoniaco: '4,5,4,6', octano: '2,25,16,18', aluminio: '2,3,1,3', 'cobre-nitrico': '3,8,3,2,4', permanganato: '2,16,2,2,5,8', 'redox-ionica': '1,5,8,1,5,4' };
    for (const e of C.ejemplos) {
      const r = C.resolver(e.sc), c = r.especies.map((s) => s.coef).join(',');
      if (c !== AJ[e.clave]) mal(`Ajustador · ${e.clave}: ${c}, se esperaba ${AJ[e.clave]}`);
      if (r.tabla.some((f) => f.iz !== f.de) || (r.cargas && r.cargas.iz !== r.cargas.de)) mal(`Ajustador · ${e.clave}: la comprobación no cuadra`);
    }
    // octano: con a = 1 sale b = 25/2, y se multiplica por 2
    const oct = C.resolver({ ecuacion: 'C8H18 + O2 -> CO2 + H2O' });
    if (!oct.pasos.some((p) => p.html.includes('{25}/{2}')) || !oct.pasos.some((p) => /multiplica todo por 2/.test(p.html))) mal('Ajustador · octano: falta b = 25/2 o el paso de multiplicar por 2');
    if (!C.resolver({ ecuacion: 'MnO4- + Fe2+ + H+ -> Mn2+ + Fe3+ + H2O' }).pasos.some((p) => /^Carga/m.test(p.html.split('<br>').slice(-1)[0]))) mal('Ajustador: falta la ecuación de la carga en una reacción iónica');
    for (const [ecuacion, q] of [['', 'vacía'], ['H2 + O2', 'sin flecha'], ['NaCl -> Na', 'imposible'], ['Xx -> X', 'elemento que no existe']]) {
      let ok = false; try { C.resolver({ ecuacion }); } catch (e) { ok = true; }
      if (!ok) mal(`Ajustador: una reacción ${q} no da error`);
    }
    // AJ-1: varios ajustes independientes o ninguno dan un mensaje claro (con los ajustes independientes)
    const msg = (ecuacion) => { try { C.resolver({ ecuacion }); return ''; } catch (e) { return e.message; } };
    { const m = msg('C + O2 -> CO + CO2'); if (!/2 ajustes independientes/.test(m) || !m.includes('2 C + O2 → 2 CO') || !m.includes('C + O2 → CO2')) mal('Ajustador (AJ-1): C + O2 -> CO + CO2 debería listar los dos ajustes independientes: ' + m); }
    { const m = msg('Fe + O2 -> Fe2O3 + FeO'); if (!/independientes/.test(m) || !m.includes('FeO')) mal('Ajustador (AJ-1): Fe + O2 -> Fe2O3 + FeO sin ajustes independientes: ' + m); }
    { const m = msg('HgO + HCl -> HgCl + H2O'); if (!/no se puede ajustar/.test(m)) mal('Ajustador (AJ-1): HgO + HCl -> HgCl + H2O no se puede ajustar y no lo dice: ' + m); }
    { const m = msg('H2 + O2 -> H2O + H2O2'); if (!/varias reacciones juntas/.test(m)) mal('Ajustador (AJ-1): H2 + O2 -> H2O + H2O2 son dos reacciones juntas: ' + m); }
    // AJ-2: ecuación iónica neta, espectadores y tipo (se leen del texto sin etiquetas)
    const t = (h) => String(h).replace(/<[^>]+>/g, '');
    const IO = [
      ['AgNO3 + NaCl -> AgCl + NaNO3', 'Ag+ + Cl− → AgCl(s)', 'precipitación', ['Na+', 'NO3−']],
      ['H2SO4 + NaOH -> Na2SO4 + H2O', 'H+ + OH− → H2O(l)', 'neutralización', ['Na+', 'SO42−']],
      ['CaCO3 + HCl -> CaCl2 + CO2 + H2O', 'CaCO3(s) + 2 H+ → Ca2+ + CO2(g) + H2O(l)', 'carbonato', ['Cl−']],
      ['Zn + CuSO4 -> ZnSO4 + Cu', 'Zn(s) + Cu2+ → Zn2+ + Cu(s)', 'desplazamiento simple', ['SO42−']],
      ['BaCl2 + Na2SO4 -> BaSO4 + NaCl', 'Ba2+ + SO42− → BaSO4(s)', 'precipitación', ['Cl−', 'Na+']],
      ['Pb(NO3)2 + KI -> PbI2 + KNO3', 'Pb2+ + 2 I− → PbI2(s)', 'precipitación', ['NO3−', 'K+']],
      ['Al + HCl -> AlCl3 + H2', '2 Al(s) + 6 H+ → 2 Al3+ + 3 H2(g)', 'desplazamiento simple', ['Cl−']],
      // F12.2: carbonato o hidrogenocarbonato + ácido (desprende CO2), también con el carbonato soluble, el amonio entre paréntesis y un ácido débil
      ['Na2CO3 + HCl -> NaCl + CO2 + H2O', 'CO32− + 2 H+ → CO2(g) + H2O(l)', 'carbonato', ['Na+', 'Cl−']],
      ['NaHCO3 + HCl -> NaCl + CO2 + H2O', 'HCO3− + H+ → CO2(g) + H2O(l)', 'carbonato', ['Na+', 'Cl−']],
      ['(NH4)2CO3 + HCl -> NH4Cl + CO2 + H2O', 'CO32− + 2 H+ → CO2(g) + H2O(l)', 'carbonato', ['NH4+', 'Cl−']],
      ['Na2CO3 + CH3COOH -> CH3COONa + CO2 + H2O', 'CO32− + 2 CH3COOH(aq) → 2 CH3COO− + CO2(g) + H2O(l)', 'carbonato', ['Na+']],
      ['MgCO3 + H2SO4 -> MgSO4 + CO2 + H2O', 'MgCO3(s) + 2 H+ → Mg2+ + CO2(g) + H2O(l)', 'carbonato', ['SO42−']],
      ['(NH4)2SO4 + BaCl2 -> BaSO4 + NH4Cl', 'SO42− + Ba2+ → BaSO4(s)', 'precipitación', ['NH4+', 'Cl−']],
      ['CH3COONa + HCl -> CH3COOH + NaCl', 'CH3COO− + H+ → CH3COOH(aq)', 'doble desplazamiento', ['Na+', 'Cl−']],
    ];
    for (const [ec, neta, tipo, esp] of IO) {
      const r = C.resolver({ ecuacion: ec });
      if (!r.ionica || t(r.ionica.htmlNeta) !== neta) mal(`Ajustador (AJ-2) · ${ec}: neta «${r.ionica && t(r.ionica.htmlNeta)}», se esperaba «${neta}»`);
      if (!r.tipo.includes(tipo)) mal(`Ajustador (AJ-2) · ${ec}: tipo «${r.tipo}», se esperaba «${tipo}»`);
      if (r.ionica && !esp.every((x) => t(r.ionica.htmlEspectadores).includes(x))) mal(`Ajustador (AJ-2) · ${ec}: espectadores «${t(r.ionica.htmlEspectadores)}», faltan ${esp}`);
    }
    // F12.2: si se escribe H2CO3 como producto, se avisa de que se descompone en CO2 y agua
    if (!C.resolver({ ecuacion: 'Na2CO3 + HCl -> NaCl + H2CO3' }).pasos.some((p) => /Ecuación iónica neta/.test(p.t) && /se descompone/.test(p.html) && t(p.html).includes('CO2(g) + H2O(l)'))) mal('Ajustador (F12.2): con H2CO3 de producto falta el aviso de que se descompone en CO2 y agua');
    if (C.resolver({ ecuacion: 'NaCl + KNO3 -> NaNO3 + KCl' }).ionica.hayNeta) mal('Ajustador (AJ-2): NaCl + KNO3 no tiene reacción neta');
    if (C.resolver({ ecuacion: 'C3H8 + O2 -> CO2 + H2O' }).tipo !== 'combustión' || C.resolver({ ecuacion: 'Fe + O2 -> Fe2O3' }).tipo.indexOf('síntesis') !== 0 || C.resolver({ ecuacion: 'KClO3 -> KCl + O2' }).tipo !== 'descomposición') mal('Ajustador (AJ-2): combustión, síntesis o descomposición mal clasificadas');
    if (C.resolver({ ecuacion: 'KClO3 -> KCl + O2' }).ionica) mal('Ajustador (AJ-2): una descomposición térmica no lleva ecuación iónica');
    // estados escritos por el usuario mandan sobre las reglas
    if (t(C.resolver({ ecuacion: 'AgNO3(aq) + NaCl(aq) -> AgCl(s) + NaNO3(aq)' }).ionica.htmlNeta) !== 'Ag+ + Cl− → AgCl(s)') mal('Ajustador (AJ-2): con los estados escritos sale otra neta');
    if (fallos === antes) console.log(`  ✓ Ajustador de reacciones: ${C.ejemplos.length} reacciones ajustadas a mano, fracciones, carga y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'quimica', 'ajustador', 'index.html'));
    await page.waitForFunction(() => window.AjustadorApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('ajustador').current) mal(`Ajustador: la página muestra la versión «${ver}», se esperaba ${Version.de('ajustador').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => AjustadorApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), coefs: [...document.querySelectorAll('#coefs b')].map((b) => b.textContent).join(',') }));
      if (r.err || !r.pasos || r.coefs !== C.resolver(e.sc).especies.map((s) => s.coef).join(',')) mal(`Ajustador · ${e.clave}: faltan los coeficientes o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Ajustador · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.fill('#ecuacion', 'NaCl -> Na');
    if (await page.locator('#error').isHidden()) mal('Ajustador: una reacción imposible no muestra el error');
    // QU-2 · la ecuación ajustada pasa a la estequiometría de Masa molar
    { const a0 = fallos;
      await page.evaluate(() => AjustadorApp.abrirEjemplo('propano'));
      const href = await page.evaluate(() => document.querySelector('#u-masa')?.getAttribute('href') || '');
      if (!/^\.\.\/masa-molar\/#d=/.test(href)) mal('Ajustador · falta el enlace a Masa molar: ' + href);
      else {
        const e = await page.evaluate(`(${(h) => JSON.parse(decodeURIComponent(escape(atob(h.slice(h.indexOf('#d=') + 3).replace(/-/g, '+').replace(/_/g, '/')))))})(${JSON.stringify(href)})`);
        if (e.tab !== 'este' || !/C3H8.*->.*CO2/.test(e.ecuacion) || e.cantidades.length !== 4) mal('Ajustador · estado enviado a Masa molar: ' + JSON.stringify(e));
        await page.goto('file://' + path.join(publico, 'quimica', 'masa-molar', 'index.html') + href.slice(href.indexOf('#')));
        await page.waitForFunction(() => window.MasaApp);
        if (!(await page.evaluate(() => document.querySelector('#ecuacion').value)).includes('C3H8') || (await page.locator('#este').isHidden())) mal('Ajustador · Masa molar no abre la estequiometría con la ecuación');
      }
      if (fallos === a0) console.log('  ✓ Ajustador · «Calcular cantidades en Masa molar»: el enlace lleva la ecuación y Masa molar abre su estequiometría');
    }
    await page.close();
    if (consola.length) mal('Ajustador: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Ajustador de reacciones: ${C.ejemplos.length} reacciones en la página con MathML y errores, sin errores de consola`);
  };
};
