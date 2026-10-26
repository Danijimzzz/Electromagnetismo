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
    // bloque lanzado plano arriba (2 kg, 30°, μd = 0,2): frena con g(sen θ + μ cos θ), se para y vuelve
    const la = r('lanzado-arriba'), c30 = Math.cos(Math.PI / 6);
    cerca(la.fase1.a, -(4.9 + 0.2 * 9.8 * c30), 1e-9, 'frenada plano arriba'); cerca(la.fase1.x, 36 / (2 * (4.9 + 0.2 * 9.8 * c30)), 1e-9, 'distancia hasta pararse');
    cerca(la.a, -(4.9 - 0.2 * 9.8 * c30), 1e-9, 'vuelve a bajar');
    const la4 = Dinamica.resolver({ ...Dinamica.ejemplos.find((e) => e.clave === 'lanzado-arriba').sc, d: '4' });
    cerca(la4.cin.t, la.fase1.t + Math.sqrt((2 * (4 - la.fase1.x)) / Math.abs(la.a)), 1e-6, 'tiempo en recorrer 4 m subiendo y bajando');
    if (r('frenada').estado !== 'reposo') mal('Dinámica: la caja que frena en el suelo debería quedarse parada');
    cerca(r('mu-medida').muk, (9.8 * Math.sin(35 * Math.PI / 180) - 3.2) / (9.8 * Math.cos(35 * Math.PI / 180)), 1e-9, 'μ a partir de la aceleración');
    cerca(hz.Fmin.F, 0.4 * 196 / (c30 + 0.4 * 0.5), 1e-9, 'fuerza mínima con α = 30°'); cerca(hz.Fmin.Fopt, 0.4 * 196 / Math.hypot(1, 0.4), 1e-9, 'fuerza mínima con el mejor ángulo');
    cerca(r('contacto').a, 3.04, 1e-9, 'dos cajas en contacto a'); cerca(r('contacto').Fi, 15, 1e-9, 'fuerza de contacto = F·m₁/M');
    const cp = r('cuerda-plano'), s20 = Math.sin(20 * Math.PI / 180), c20 = Math.cos(20 * Math.PI / 180);
    cerca(cp.a, (60 - 6 * 9.8 * s20 - 9.8 * c20 * (0.25 * 4 + 0.1 * 2)) / 6, 1e-9, 'dos bloques con cuerda a'); cerca(cp.Fi, 2 * (cp.a + 9.8 * s20 + 0.1 * 9.8 * c20), 1e-9, 'tensión entre bloques');
    const pe = r('peralte'), b15 = 15 * Math.PI / 180;
    cerca(pe.vmax, Math.sqrt(80 * 9.8 * (Math.sin(b15) + 0.5 * Math.cos(b15)) / (Math.cos(b15) - 0.5 * Math.sin(b15))), 1e-9, 'velocidad máxima en el peralte');
    cerca(pe.videal, Math.sqrt(80 * 9.8 * Math.tan(b15)), 1e-9, 'velocidad sin rozamiento'); if (pe.derrapa) mal('Dinámica: a 25 m/s el coche del peralte no debería derrapar');
    cerca(r('curva-plana').vmax, Math.sqrt(50 * 9.8 * 0.6), 1e-9, 'curva plana v = √(μgR)'); if (!r('curva-plana').derrapa) mal('Dinámica: a 20 m/s la curva plana debería derrapar');
    const co = r('conico'); cerca(co.T, 0.5 * 9.8 / c30, 1e-9, 'péndulo cónico T'); cerca(co.periodo, 2 * Math.PI * Math.sqrt(1.2 * c30 / 9.8), 1e-9, 'péndulo cónico periodo');
    cerca(r('loma').N, 900 * (9.8 - 225 / 40), 1e-9, 'normal en la loma');
    cerca(r('muelle-colgado').x0, 0.5 * 9.8 / 200, 1e-12, 'alargamiento colgado'); cerca(r('muelle-colgado').periodo, 2 * Math.PI * Math.sqrt(0.5 / 200), 1e-12, 'periodo del muelle');
    const mp = r('muelle-plano'); cerca(mp.k, 500, 1e-12, 'muelles en paralelo'); cerca(mp.xmax, 4 * 9.8 * (0.5 + 0.2 * c30) / 500, 1e-12, 'alargamiento máximo con rozamiento');
    cerca(Dinamica.resolver({ tipo: 'muelle', g: '9,8', k: '300', k2: '200', asoc: 'serie', m: '1' }).k, 120, 1e-12, 'muelles en serie');
    for (const [sc, q] of [[{ tipo: 'plano', g: '9.8', m1: '0', theta: '10' }, 'masa 0'], [{ tipo: 'plano', g: '9.8', m1: '1', theta: '100' }, 'ángulo de 100°'], [{ tipo: 'plano', g: '9.8', m1: '1', theta: '0', mus: '0.2', muk: '0.3' }, 'μd > μe'], [{ tipo: 'plano', g: '9.8', m1: '1', theta: '0', F: '50', alfa: '90' }, 'fuerza que levanta el bloque']]) {
      let ok = false; try { Dinamica.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Dinámica: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Dinámica: ${Dinamica.ejemplos.length} ejemplos, normal, reposo o deslizamiento, frenada, μ medida, fuerza mínima, poleas, dos bloques, Atwood, curvas, péndulo cónico, loma, muelles y errores`);
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
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 2) mal(`Dinámica · ${e.clave}: falta el resultado o el desarrollo`);
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
