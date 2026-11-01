/* Comprobación de Redox por ion-electrón: cálculos en Node y la página en Chromium. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo redox ejecuta solo esta).
   Los coeficientes de los ejemplos están ajustados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'redox', 'calculo.js'));
  const txt = (s) => s.html.replace(/<[^>]+>/g, '').replace('−', '-');
  const ecu = (r) => r.especies.filter((s) => s.reactivo).map((s) => s.coef + txt(s)).join(' + ') + ' > ' + r.especies.filter((s) => !s.reactivo).map((s) => s.coef + txt(s)).join(' + ');
  {
    const antes = fallos;
    // reacciones iónicas netas ajustadas a mano
    const AJ = {
      'permanganato-hierro': '1MnO4- + 5Fe2+ + 8H+ > 1Mn2+ + 5Fe3+ + 4H2O',
      'dicromato-hierro': '1Cr2O72- + 6Fe2+ + 14H+ > 2Cr3+ + 6Fe3+ + 7H2O',
      'permanganato-cloruro': '2MnO4- + 10Cl- + 16H+ > 2Mn2+ + 5Cl2 + 8H2O',
      'cobre-nitrico': '3Cu + 2NO3- + 8H+ > 3Cu2+ + 2NO + 4H2O',
      'permanganato-oxalato': '2MnO4- + 5C2O42- + 16H+ > 2Mn2+ + 10CO2 + 8H2O',
      'permanganato-agua-oxigenada': '2MnO4- + 5H2O2 + 6H+ > 2Mn2+ + 5O2 + 8H2O',
      'permanganato-yoduro': '2MnO4- + 6I- + 4H2O > 2MnO2 + 3I2 + 8OH-',
      'cromo-clorato': '2Cr(OH)3 + 1ClO3- + 4OH- > 2CrO42- + 1Cl- + 5H2O',
      'cloro-dismutacion': '1Cl2 + 2OH- > 1Cl- + 1ClO- + 1H2O',
      'dioxido-cloro': '2ClO2 + 1H2O2 + 2OH- > 2ClO2- + 1O2 + 2H2O',
    };
    for (const e of C.ejemplos) {
      const r = C.resolver(e.sc), c = ecu(r);
      if (c !== AJ[e.clave]) mal(`Redox · ${e.clave}: ${c}, se esperaba ${AJ[e.clave]}`);
      if (r.tabla.some((f) => f.iz !== f.de) || r.cargas.iz !== r.cargas.de) mal(`Redox · ${e.clave}: la comprobación no cuadra`);
      if (e.sc.medio === 'acido' && r.especies.some((s) => s.k && /^O1H1\/-1$/.test(s.k))) mal(`Redox · ${e.clave}: hay OH⁻ en medio ácido`);
      if (e.sc.medio === 'basico' && r.especies.some((s) => /^H1\/1$/.test(s.k))) mal(`Redox · ${e.clave}: hay H⁺ en medio básico`);
    }
    // números de oxidación a mano
    const ox = (t) => C.oxidacion(Formulas.leer(t));
    const igual = (a, b, q) => { for (const k of Object.keys(b)) if (Math.abs(a[k] - b[k]) > 1e-9) mal(`Redox · número de oxidación de ${q}: ${JSON.stringify(a)}`); };
    igual(ox('MnO4^-'), { Mn: 7, O: -2 }, 'MnO4-'); igual(ox('Cr2O7^2-'), { Cr: 6 }, 'Cr2O72-'); igual(ox('C2O4^2-'), { C: 3 }, 'C2O42-');
    igual(ox('H2O2'), { H: 1, O: -1 }, 'H2O2'); igual(ox('NaH'), { Na: 1, H: -1 }, 'NaH'); igual(ox('Fe3O4'), { Fe: 8 / 3 }, 'Fe3O4'); igual(ox('Cl2'), { Cl: 0 }, 'Cl2');
    // el mismo par redox da otra ecuación según el medio (permanganato y yoduro)
    const ac = ecu(C.resolver({ ecuacion: 'MnO4^- + I^- -> Mn^2+ + I2', medio: 'acido' }));
    if (ac !== '2MnO4- + 10I- + 16H+ > 2Mn2+ + 5I2 + 8H2O') mal(`Redox · permanganato y yoduro ácido: ${ac}`);
    // el agua que escribe el usuario no estorba
    if (ecu(C.resolver({ ecuacion: 'MnO4- + Fe2+ + H+ -> Mn2+ + Fe3+ + H2O', medio: 'acido' })) !== AJ['permanganato-hierro']) mal('Redox: escribir H+ y H2O cambia el resultado');
    // un ion espectador se deja fuera
    if (C.resolver({ ecuacion: 'MnO4^- + Fe^2+ + K^+ -> Mn^2+ + Fe^3+ + K^+', medio: 'acido' }).espectadores.length !== 1) mal('Redox: no detecta el espectador K+');
    // pasos: semirreacciones, electrones y paso a básico
    const b = C.resolver(C.ejemplos.find((e) => e.clave === 'permanganato-yoduro').sc);
    if (!b.pasos.some((p) => /Pasar a medio básico/.test(p.t)) || b.electrones !== 6) mal('Redox · permanganato y yoduro: falta el paso a medio básico o mcm(3, 2) = 6');
    for (const [ecuacion, q] of [['', 'vacía'], ['Fe2+ -> Fe3+', 'sin reducción'], ['Na+ + Cl- -> NaCl', 'sin cambio de oxidación'], ['KMnO4 + FeSO4 -> MnSO4 + Fe2(SO4)3', 'con sales y espectadores sin quitar'], ['Xx -> X', 'elemento que no existe']]) {
      let ok = false; try { C.resolver({ ecuacion, medio: 'acido' }); } catch (e) { ok = true; }
      if (!ok) mal(`Redox: una reacción ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Redox por ion-electrón: ${C.ejemplos.length} reacciones ajustadas a mano en medio ácido y básico, números de oxidación y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'quimica', 'redox', 'index.html'));
    await page.waitForFunction(() => window.RedoxApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('redox').current) mal(`Redox: la página muestra la versión «${ver}», se esperaba ${Version.de('redox').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => RedoxApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), coefs: [...document.querySelectorAll('#coefs b')].map((b) => b.textContent).join(','), medio: document.querySelector('#medio [aria-selected=true]').dataset.medio }));
      if (r.err || !r.pasos || r.coefs !== C.resolver(e.sc).especies.map((s) => s.coef).join(',')) mal(`Redox · ${e.clave}: faltan los coeficientes o el desarrollo`);
      if (r.medio !== e.sc.medio) mal(`Redox · ${e.clave}: el medio marcado es ${r.medio}`);
      if (!r.mathml && r.dolar) mal(`Redox · ${e.clave}: el desarrollo no sale en MathML`);
    }
    // cambiar de medio recalcula
    await page.evaluate(() => RedoxApp.abrirEjemplo('permanganato-yoduro'));
    await page.click('#medio [data-medio=acido]');
    if (await page.locator('#ajustada').innerText().then((t) => /OH/.test(t))) mal('Redox: al pasar a medio ácido sigue saliendo OH⁻');
    await page.fill('#ecuacion', 'Fe2+ -> Fe3+');
    if (await page.locator('#error').isHidden()) mal('Redox: una reacción sin reducción no muestra el error');
    await page.close();
    if (consola.length) mal('Redox: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Redox por ion-electrón: ${C.ejemplos.length} reacciones en la página, cambio de medio y errores, sin errores de consola`);
  };
};
