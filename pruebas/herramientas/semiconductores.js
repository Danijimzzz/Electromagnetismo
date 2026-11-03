/* Comprobación de semiconductores: cálculos en Node y la página en Chromium. Prueba de semiconductores.
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo semiconductores ejecuta solo esta).
   Los valores de los ejemplos están calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'semiconductores', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Semiconductores · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano
    const q = (c) => r(c).Q;
    cerca(q('bjt-fija').y, 0.0024042553, 1e-9, 'IC de la polarización fija');   // IB = 11,3 V / 470 kΩ = 24,04 µA; IC = 100·IB
    cerca(q('bjt-fija').x, 6.7106383, 1e-6, 'VCE de la polarización fija');      // 12 − 2,404 mA · 2,2 kΩ
    cerca(q('bjt-divisor').y, 0.0013236752, 1e-9, 'IC del divisor');            // VBB = 2,105 V; RBB = 8,246 kΩ
    cerca(q('bjt-divisor').x, 6.2993720, 1e-6, 'VCE del divisor');
    cerca(q('bjt-saturacion').x, 0.2, 1e-12, 'VCE en saturación');
    cerca(q('bjt-saturacion').y, 5.3636364e-3, 1e-9, 'IC en saturación');       // (12 − 0,2)/2,2 kΩ
    cerca(q('mosfet-saturacion').y, 1e-3, 1e-12, 'ID del MOSFET en saturación'); // VGS − Vt = 1 V; ½·2 mA/V²·1²
    cerca(q('mosfet-saturacion').x, 6.3, 1e-9, 'VDS del MOSFET en saturación');
    cerca(q('mosfet-triodo').x, (81 - Math.sqrt(81 * 81 - 480)) / 20, 1e-9, 'VDS del MOSFET en triodo'); // 10V² − 81V + 12 = 0
    // el punto Q cumple la ecuación del diodo y la recta de carga
    for (const c of ['diodo-5v', 'led-3v3']) { const d = r(c), e = d.sc; cerca(C.shockley(d.sc.Is.includes('A') ? 1e-18 : 1e-11, +d.sc.n, d.Vd), d.Id, 1e-9, `Shockley en ${c}`); }
    cerca(r('diodo-5v').Vd, 0.5149689, 1e-6, 'VD del diodo de 5 V');
    for (const [c, reg] of [['bjt-fija', 'activa'], ['bjt-saturacion', 'saturación'], ['mosfet-saturacion', 'saturación'], ['mosfet-triodo', 'triodo (óhmica)']]) if (r(c).region !== reg) mal(`Semiconductores · ${c}: región «${r(c).region}» en vez de «${reg}»`);
    { const corte = C.resolver({ modo: 'bjt', conf: 'fija', Vcc: '12', RB: '10M', RC: '1k', RE: '0', beta: '100', VBE: '13', VCEsat: '0,2' }); if (corte.region !== 'corte' || corte.IC !== 0) mal('Semiconductores: VBB < VBE no da corte'); }
    for (const [sc, q] of [[{ modo: 'diodo', Vs: '', R: '1k', Is: '10', n: '1' }, 'falta la tensión'], [{ modo: 'diodo', Vs: '5', R: '0', Is: '10', n: '1' }, 'resistencia cero'], [{ modo: 'bjt', conf: 'fija', Vcc: '12', RB: '1k', RC: '1k', RE: '0', beta: '1', VBE: '0,7', VCEsat: '0,2' }, 'β demasiado baja']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Semiconductores: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Semiconductores: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'circuitos', 'semiconductores', 'index.html'));
    await page.waitForFunction(() => window.SemiconductoresApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('semiconductores').current) mal(`Semiconductores: la página muestra la versión «${ver}», se esperaba ${Version.de('semiconductores').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => SemiconductoresApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Semiconductores · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Semiconductores · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.evaluate(() => SemiconductoresApp.abrirEjemplo('diodo-5v'));
    await page.fill('#f-R', '0');
    if (await page.locator('#error').isHidden()) mal('Semiconductores: una resistencia cero no muestra el error');
    await page.close();
    if (consola.length) mal('Semiconductores: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Semiconductores: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
