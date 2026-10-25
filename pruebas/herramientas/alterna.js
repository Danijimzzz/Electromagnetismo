/* Comprobación de alterna: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo alterna ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Alterna = require(path.join(fuente, 'alterna', 'fisica.js'));
  {
    // valores calculados a mano
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Alterna · ${q}: ${a} en vez de ${b}`); };
    const ej = (c) => Alterna.ejemplos.find((e) => e.clave === c).sc;
    const rl = Alterna.circuito(ej('rl'));
    cerca(Alterna.mod(rl.Zt), 50, 0.05, 'bobina real |Z|'); cerca(rl.fi * Alterna.GRAD, 53.13, 0.02, 'bobina real φ'); cerca(Alterna.mod(rl.I), 4.6, 0.01, 'bobina real I');
    cerca(rl.P, rl.R * Alterna.mod(rl.I) ** 2, 1e-6, 'P = I²R');
    const res = Alterna.circuito(ej('resonancia'));
    cerca(res.fp, 1, 1e-6, 'resonancia cos φ'); cerca(Alterna.mod(res.Zt), 10, 1e-4, 'resonancia Z = R'); cerca(res.res.f0, 159.1549, 1e-3, 'f0'); cerca(res.res.Q, 10, 1e-4, 'factor de calidad');
    const s = Alterna.circuito(ej('rlc-serie')), suma = s.partes.reduce((z, p) => Alterna.suma(z, p.V), Alterna.Z(0));
    cerca(suma.re, 230, 1e-9, 'suma fasorial de tensiones (real)'); cerca(suma.im, 0, 1e-9, 'suma fasorial de tensiones (imaginaria)');
    cerca(s.S ** 2, s.P ** 2 + s.Q ** 2, 1e-6, 'S² = P² + Q²');
    const par = Alterna.circuito(ej('paralelo'));
    cerca(Alterna.mod(par.Zt), 53.67, 0.01, 'paralelo |Z|'); cerca(par.fi * Alterna.GRAD, 26.57, 0.02, 'paralelo φ');
    const fp = Alterna.correccion(ej('fp'));
    cerca(fp.C * 1e6, 137.6, 0.05, 'condensador de corrección'); cerca(fp.I2, 26.316, 0.001, 'corriente corregida');
    for (const [sc, q] of [[{ V: '230', f: '50' }, 'sin elementos'], [{ V: '230', f: '50', R: '-5' }, 'R negativa'], [{ V: '', f: '50', R: '5' }, 'sin tensión'], [{ conexion: 'paralelo', V: '230', f: '50', R: '0' }, 'cortocircuito en paralelo']]) {
      let ok = false; try { Alterna.circuito(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Alterna: ${q} no da error`);
    }
    let ok = false; try { Alterna.correccion({ V: '400', f: '50', P: '10', fp1: '0.9', fp2: '0.8' }); } catch (e) { ok = true; }
    if (!ok) mal('Alterna: un cos φ deseado menor que el inicial no da error');
    if (!Alterna.circuito(ej('rc')).pasos[1].html.includes('R − jX<sub>C</sub>')) mal('Alterna: la impedancia RC no se escribe R − jX_C');
    if (fallos === antes) console.log(`  ✓ Corriente alterna: ${Alterna.ejemplos.length} ejemplos, Z, φ, potencias, resonancia y corrección del factor de potencia`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'circuitos', 'alterna', 'index.html'));
      await page.waitForFunction(() => window.AlternaApp);
      const antes = fallos;
      const verA = (await page.locator('#ver').textContent()).trim();
      if (verA !== Version.de('alterna').current) mal(`Alterna: la página muestra la versión «${verA}», se esperaba ${Version.de('alterna').current}`);
      for (const e of Alterna.ejemplos) {
        await page.evaluate((c) => AlternaApp.abrirEjemplo(c), e.clave);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 3) mal(`Alterna · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => AlternaApp.abrirEjemplo('rl'));
      if (!(await page.locator('#res').textContent()).includes('53,13°')) mal('Alterna: la bobina real no da φ = 53,13° en la página');
      await page.selectOption('#f-conexion', 'paralelo');
      if (!(await page.locator('#error').isHidden()) || !(await page.locator('#pasos').textContent()).includes('Admitancia')) mal('Alterna: al pasar a paralelo no se calcula con admitancias');
      await page.fill('#f-V', 'abc');
      if (await page.locator('#error').isHidden()) mal('Alterna: una tensión no numérica no muestra el error');
      await page.selectOption('#f-modo', 'correccion');
      if ((await page.locator('#f-fp1').count()) !== 1) mal('Alterna: el modo de corrección no muestra cos φ inicial');
      await page.close();
      if (consola.length) mal('Alterna: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Corriente alterna: ${Alterna.ejemplos.length} ejemplos, serie y paralelo, corrección y errores sin errores de consola`);
    }
  };
};
