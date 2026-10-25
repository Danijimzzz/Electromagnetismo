/* Comprobación de dinamica: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo dinamica ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Dinamica = require(path.join(fuente, 'dinamica', 'fisica.js'));
  {
    // valores calculados a mano con g = 9,8
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Dinámica · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => Dinamica.resolver(Dinamica.ejemplos.find((e) => e.clave === c).sc);
    const hz = r('horizontal');
    cerca(hz.N, 146, 1e-9, 'normal con la cuerda inclinada'); cerca(hz.a, (100 * Math.cos(Math.PI / 6) - 0.3 * 146) / 20, 1e-9, 'aceleración horizontal');
    const baja = r('inclinado-baja');
    cerca(baja.a, -(9.8 * 0.5 - 0.2 * 9.8 * Math.cos(Math.PI / 6)), 1e-9, 'bloque que baja: a = −g(sen θ − μ cos θ)');
    const quieto = r('inclinado-quieto');
    if (quieto.estado !== 'reposo' || quieto.a !== 0) mal('Dinámica: con tg 20° < 0,5 el bloque debería quedarse quieto');
    cerca(Math.abs(quieto.Fr), 5 * 9.8 * Math.sin(20 * Math.PI / 180), 1e-9, 'rozamiento estático = P sen θ');
    const mesa = r('mesa-polea');
    cerca(mesa.a, (2 * 9.8 - 0.25 * 4 * 9.8) / 6, 1e-9, 'mesa y polea a'); cerca(mesa.T, 2 * (9.8 - mesa.a), 1e-9, 'mesa y polea T');
    cerca(r('atwood').a, 2.45, 1e-9, 'Atwood a'); cerca(r('atwood').T1, 36.75, 1e-9, 'Atwood T');
    const ap = r('atwood-polea');
    cerca(ap.a, 2 * 9.8 / 9, 1e-9, 'Atwood con polea a'); cerca(ap.T2 - ap.T1, 0.5 * 2 * ap.a, 1e-9, 'T2 − T1 = ½ mp a');
    cerca(r('horizontal').cin.v, Math.sqrt(2 * hz.a * 5), 1e-9, 'velocidad tras 5 m');
    for (const [sc, q] of [[{ tipo: 'plano', g: '9.8', m1: '0', theta: '10' }, 'masa 0'], [{ tipo: 'plano', g: '9.8', m1: '1', theta: '100' }, 'ángulo de 100°'], [{ tipo: 'plano', g: '9.8', m1: '1', theta: '0', mus: '0.2', muk: '0.3' }, 'μd > μe'], [{ tipo: 'plano', g: '9.8', m1: '1', theta: '0', F: '50', alfa: '90' }, 'fuerza que levanta el bloque']]) {
      let ok = false; try { Dinamica.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Dinámica: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Dinámica: ${Dinamica.ejemplos.length} ejemplos, normal, reposo o deslizamiento, poleas, Atwood y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'dinamica', 'index.html'));
      await page.waitForFunction(() => window.DinamicaApp);
      const antes = fallos;
      const verD = (await page.locator('#ver').textContent()).trim();
      if (verD !== Version.de('dinamica').current) mal(`Dinámica: la página muestra la versión «${verD}», se esperaba ${Version.de('dinamica').current}`);
      for (const e of Dinamica.ejemplos) {
        await page.evaluate((c) => DinamicaApp.abrirEjemplo(c), e.clave);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 3) mal(`Dinámica · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => DinamicaApp.abrirEjemplo('atwood'));
      if (!(await page.locator('#res').textContent()).includes('2,45')) mal('Dinámica: Atwood no da a = 2,45 m/s² en la página');
      await page.evaluate(() => DinamicaApp.abrirEjemplo('inclinado-quieto'));
      if (!(await page.locator('#res').textContent()).includes('En reposo')) mal('Dinámica: el bloque sujeto por el rozamiento no sale en reposo');
      await page.fill('#f-m1', '-3');
      if (await page.locator('#error').isHidden()) mal('Dinámica: una masa negativa no muestra el error');
      await page.selectOption('#f-tipo', 'atwood');
      if ((await page.locator('#f-mp').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Dinámica: al cambiar a Atwood no aparece la masa de la polea');
      await page.close();
      if (consola.length) mal('Dinámica: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Dinámica: ${Dinamica.ejemplos.length} ejemplos, reposo, Atwood y errores sin errores de consola`);
    }
  };
};
