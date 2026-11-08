/* Comprobación de solubilidad: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo solubilidad ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'solubilidad', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Solubilidad · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano
    const rel = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.abs(b))) mal(`Solubilidad · ${q}: ${a} en vez de ${b}`); };
    rel(r('ag2cro4').Kps, 4 * 6.5e-5 ** 3, 1e-12, 'Kps del Ag₂CrO₄ = 4s³');
    rel(r('baso4-g').s, 2.4e-3 / 233.38, 1e-12, 'solubilidad molar del BaSO₄'); rel(r('baso4-g').Kps, (2.4e-3 / 233.38) ** 2, 1e-12, 'Kps del BaSO₄');
    rel(r('agcl').s, Math.sqrt(1.8e-10), 1e-12, 'solubilidad del AgCl'); rel(r('agcl').ca, Math.sqrt(1.8e-10), 1e-12, '[Ag⁺]');
    rel(r('caoh2').s, (5.5e-6 / 4) ** (1 / 3), 1e-12, 'solubilidad del Ca(OH)₂'); rel(r('caoh2').cb, 2 * (5.5e-6 / 4) ** (1 / 3), 1e-12, '[OH⁻] = 2s');
    // AgCl en NaCl 0,10 M: s(s + 0,1) = Kps
    rel(r('agcl-nacl').s, (-0.1 + Math.sqrt(0.01 + 4 * 1.8e-10)) / 2, 1e-9, 'AgCl con ion común'); rel(r('agcl-nacl').factor, Math.sqrt(1.8e-10) / 1.8e-9, 1e-6, 'veces menos soluble');
    // PbI₂: [Pb] = [I] = 0,005, Q = 0,005·0,005² = 1,25·10⁻⁷ > Kps
    const pb = r('pbi2-mezcla'); rel(pb.Q, 0.005 ** 3, 1e-12, 'Q del PbI₂'); if (!pb.precipita) mal('Solubilidad: la mezcla de Pb²⁺ e I⁻ debería precipitar');
    rel(pb.cA * pb.cB ** 2, 9.8e-9, 1e-9, 'tras precipitar, el producto iónico vale Kps'); rel(pb.cB, 0.005 - 2 * pb.x, 1e-9, 'estequiometría de I⁻ al precipitar'); rel(pb.cA, 0.005 - pb.x, 1e-9, 'estequiometría de Pb²⁺');
    // AgCl 50 mL + 50 mL de 0,10 M: [Ag] = [Cl] = 0,05; (0,05 − x)² = Kps; n = x·0,1 L; m = n·143,32
    const ag = r('agcl-mezcla'), x = 0.05 - Math.sqrt(1.8e-10);
    rel(ag.x, x, 1e-9, 'avance al precipitar AgCl'); rel(ag.mol, x * 0.1, 1e-9, 'moles de AgCl'); rel(ag.masa, x * 0.1 * 143.32, 1e-9, 'masa de AgCl');
    const no = r('sin-precipitado'); if (no.precipita || Math.abs(no.Q - 2.5e-13) > 1e-20) mal('Solubilidad: la mezcla diluida no debería precipitar (Q = 2,5·10⁻¹³)');
    // Mohr: Ag₂CrO₄ empieza con √(1,1·10⁻¹²/10⁻³) y queda Cl⁻ = Kps/[Ag⁺]
    const mo = r('mohr'), X2 = Math.sqrt(1.1e-12 / 1e-3);
    if (mo.primera !== 1) mal('Solubilidad: en el método de Mohr tiene que precipitar antes el AgCl');
    rel(mo.S[0].X, 1.8e-9, 1e-12, 'Ag⁺ para empezar el AgCl'); rel(mo.S[1].X, X2, 1e-12, 'Ag⁺ para empezar el Ag₂CrO₄'); rel(mo.resta, 1.8e-10 / X2, 1e-12, 'Cl⁻ que queda'); if (!mo.sep) mal('Solubilidad: la separación del Cl⁻ debería ser cuantitativa');
    // Fe(OH)₃ con Kps de 10⁻³⁸: la bisección logarítmica no pierde precisión
    rel(C.resolver({ modo: 'solub', a: '1', b: '3', Kps: '4e-38' }).s, (4e-38 / 27) ** 0.25, 1e-12, 'solubilidad del Fe(OH)₃');
    for (const [sc, q] of [[{ modo: 'solub', a: '1', b: '1', Kps: '' }, 'falta el Kps'], [{ modo: 'solub', a: '0', b: '1', Kps: '1e-10' }, 'a = 0'], [{ modo: 'kps', a: '1', b: '1', s: '0.001', uni: 'g' }, 'g/L sin masa molar'], [{ modo: 'precipita', a: '1', b: '1', Kps: '1e-10', c1: '1', V1: '0', c2: '1', V2: '1' }, 'volumen cero']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Solubilidad: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Solubilidad: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'quimica', 'solubilidad', 'index.html'));
    await page.waitForFunction(() => window.SolubilidadApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('solubilidad').current) mal(`Solubilidad: la página muestra la versión «${ver}», se esperaba ${Version.de('solubilidad').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => SolubilidadApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Solubilidad · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Solubilidad · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.evaluate(() => SolubilidadApp.abrirEjemplo('agcl'));
    await page.fill('#f-Kps', '0');
    if (await page.locator('#error').isHidden()) mal('Solubilidad: un Kps cero no muestra el error');
    // QU-4 · exportar la gráfica y sus datos
    { const a0 = fallos;
      for (const [c, q] of [['caoh2', 'solub'], ['mg-oh-ph', 'ph'], ['agcl-nh3', 'complejo']]) {
        await page.evaluate((x) => SolubilidadApp.abrirEjemplo(x), c);
        const n = await page.evaluate(() => [...document.querySelectorAll('.exportar')].filter((x) => x.previousElementSibling && x.previousElementSibling.id === 'grafica').map((x) => x.querySelectorAll('button').length));
        if (!n.length || n[0] < 2) mal(`Solubilidad · ${q}: faltan los botones de exportar`);
      }
      if (fallos === a0) console.log('  ✓ Solubilidad · exportar PNG y datos en los modos de solubilidad, pH y complejos');
    }
    // QU-2 · hidróxido poco soluble → pH de su disolución saturada
    { const a0 = fallos;
      await page.evaluate(() => SolubilidadApp.abrirEjemplo('caoh2'));
      const href = await page.evaluate(() => document.querySelector('#u-ph')?.getAttribute('href') || '');
      const s0 = await page.evaluate(() => SolubilidadApp.resultado().s);
      if (!/^\.\.\/ph\/#d=/.test(href)) mal('Solubilidad · falta el enlace al pH del Ca(OH)2: ' + href);
      else {
        const e = await page.evaluate(`(${(h) => JSON.parse(decodeURIComponent(escape(atob(h.slice(h.indexOf('#d=') + 3).replace(/-/g, '+').replace(/_/g, '/')))))})(${JSON.stringify(href)})`);
        if (e.modo !== 'fuerte' || e.especie !== 'base' || e.n !== '2' || Math.abs(+e.C / s0 - 1) > 1e-9) mal('Solubilidad · estado enviado a pH: ' + JSON.stringify(e));
        await page.goto('file://' + path.join(publico, 'quimica', 'ph', 'index.html') + href.slice(href.indexOf('#')));
        await page.waitForFunction(() => window.PhApp || window.PHApp);
        const pH = await page.evaluate(() => (window.PhApp || window.PHApp).resultado().pH);
        const esperado = 14 + Math.log10(2 * s0);
        if (!(Math.abs(pH - esperado) < 0.01)) mal(`Solubilidad · pH del Ca(OH)2 saturado: ${pH} en vez de ${esperado}`);
      }
      if (fallos === a0) console.log('  ✓ Solubilidad · «Calcular el pH de la disolución saturada»: el Ca(OH)2 envía s y n = 2 y la herramienta de pH da 14 + log(2s)');
    }
    await page.close();
    if (consola.length) mal('Solubilidad: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Solubilidad: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
