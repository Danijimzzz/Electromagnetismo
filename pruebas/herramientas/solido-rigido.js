/* Comprobación de solido-rigido: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo solido-rigido ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Solido = require(path.join(fuente, 'solido-rigido', 'fisica.js'));
  {
    // valores calculados a mano con g = 9,8
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Sólido rígido · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => Solido.resolver(Solido.ejemplos.find((e) => e.clave === c).sc);
    cerca(r('varilla-extremo').I, (1 / 3) * 2 * 1.2 ** 2, 1e-12, 'varilla por un extremo = ML²/3');
    cerca(r('disco').I, 0.5 * 5 * 0.09, 1e-12, 'disco ½MR²');
    cerca(r('placa').I, (3 * (0.16 + 0.09)) / 12, 1e-12, 'placa M(a² + b²)/12');
    const es = r('esfera-rueda');
    cerca(es.a, (9.8 * 0.5) / 1.4, 1e-12, 'esfera que rueda a = 5/7 g sen θ'); cerca(es.v, Math.sqrt((10 / 7) * 9.8 * 1.5), 1e-12, 'v = √(10gh/7)');
    cerca(es.muMin, (2 / 7) * Math.tan(Math.PI / 6), 1e-12, 'μ mínimo = (2/7) tg θ'); if (!es.rueda) mal('Sólido rígido: la esfera con μ = 0,2 debería rodar sin deslizar');
    const aro = r('aro-desliza');
    if (aro.rueda || !aro.desliza) mal('Sólido rígido: el aro con μ = 0,3 a 40° debería deslizar');
    else cerca(aro.desliza.Q, 0.3 * aro.N * (aro.d - (aro.desliza.w * aro.R ** 2 * 0 + 0.5 * aro.desliza.al * aro.R * aro.desliza.t ** 2)), 1e-9, 'calor = μN · distancia de deslizamiento');
    const t = r('esfera-rueda').carrera.map((q) => q.t);
    if (!(t[0] < t[2] && t[2] < t[1] && t[1] < t[3])) mal('Sólido rígido: la carrera debería ganarla la esfera maciza, luego el cilindro, la esfera hueca y el aro');
    const po = r('polea');
    cerca(po.a, 4.9, 1e-12, 'polea a'); cerca(po.T, 9.8, 1e-12, 'polea T');
    const pa = r('patinadora');
    cerca(pa.w2, 180, 1e-9, 'patinadora ω₂'); cerca(pa.K2 / pa.K1, 3, 1e-9, 'patinadora K₂/K₁ = I₁/I₂');
    for (const [sc, q] of [[{ modo: 'inercia', cuerpo: 'esfera', M: '-1', L: '1' }, 'masa negativa'], [{ modo: 'rodadura', cuerpo: 'varilla', g: '9.8', M: '1', L: '1', theta: '10', d: '1' }, 'una varilla que rueda'], [{ modo: 'rodadura', cuerpo: 'esfera', g: '9.8', M: '1', L: '1', theta: '95', d: '1' }, 'ángulo de 95°'], [{ modo: 'momento', I1: '1', w1: '10', I2: '0' }, 'I₂ = 0']]) {
      let ok = false; try { Solido.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Sólido rígido: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Sólido rígido: ${Solido.ejemplos.length} ejemplos, Steiner, rodadura con y sin deslizamiento, polea, momento angular y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'solido-rigido', 'index.html'));
      await page.waitForFunction(() => window.SolidoApp);
      const antes = fallos;
      const verS = (await page.locator('#ver').textContent()).trim();
      if (verS !== Version.de('solido-rigido').current) mal(`Sólido rígido: la página muestra la versión «${verS}», se esperaba ${Version.de('solido-rigido').current}`);
      for (const e of Solido.ejemplos) {
        await page.evaluate((c) => SolidoApp.abrirEjemplo(c), e.clave);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 2) mal(`Sólido rígido · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => SolidoApp.abrirEjemplo('esfera-rueda'));
      if (!(await page.locator('#res').textContent()).includes('3,5')) mal('Sólido rígido: la esfera no da a = 3,5 m/s² en la página');
      await page.selectOption('#f-modo', 'inercia');
      await page.selectOption('#f-cuerpo', 'placa');
      if ((await page.locator('#f-b').count()) !== 1) mal('Sólido rígido: la placa no pide el lado b');
      await page.fill('#f-M', 'x');
      if (await page.locator('#error').isHidden()) mal('Sólido rígido: una masa no numérica no muestra el error');
      await page.close();
      if (consola.length) mal('Sólido rígido: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Sólido rígido: ${Solido.ejemplos.length} ejemplos, cambio de modo y de cuerpo y errores sin errores de consola`);
    }
  };
};
