/* Comprobación del ajustador de reacciones: cálculos en Node y la página en Chromium. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo ajustador ejecuta solo esta).
   Los coeficientes de los ejemplos están ajustados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'ajustador', 'calculo.js'));
  {
    const antes = fallos;
    const AJ = { propano: '1,5,3,4', glucosa: '1,6,6,6', 'oxido-hierro': '4,3,2', clorato: '2,2,3', amoniaco: '4,5,4,6', octano: '2,25,16,18', aluminio: '2,3,1,3', 'cobre-nitrico': '3,8,3,2,4', permanganato: '2,16,2,2,5,8', 'redox-ionica': '1,5,8,1,5,4' };
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
    await page.close();
    if (consola.length) mal('Ajustador: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Ajustador de reacciones: ${C.ejemplos.length} reacciones en la página con MathML y errores, sin errores de consola`);
  };
};
