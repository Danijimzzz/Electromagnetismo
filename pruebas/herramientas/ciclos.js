/* Comprobación de ciclos: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo ciclos ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const CiclosF = require(path.join(fuente, 'ciclos', 'fisica.js'));
  {
    // valores calculados a mano
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Ciclos · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => CiclosF.resolver(CiclosF.ejemplos.find((e) => e.clave === c).sc), R = 8.314;
    const ca = r('carnot');
    cerca(ca.eta, 0.5, 1e-12, 'rendimiento de Carnot'); cerca(ca.Qabs, R * 600 * Math.log(2), 1e-9, 'calor de la isoterma caliente'); cerca(ca.W, 0.5 * R * 600 * Math.log(2), 1e-9, 'trabajo de Carnot');
    cerca(ca.est[2].V, 0.02 * 2 ** 2.5, 1e-12, 'volumen tras la adiabática');
    cerca(r('carnot-mono').eta, 1 - 350 / 500, 1e-12, 'Carnot monoatómico');
    const ot = r('otto');
    cerca(ot.eta, 1 - 8 ** -0.4, 1e-12, 'rendimiento del Otto'); cerca(ot.est[1].T, 300 * 8 ** 0.4, 1e-9, 'temperatura tras la compresión'); cerca(ot.est[3].T, 1800 * 8 ** -0.4, 1e-9, 'temperatura tras la expansión');
    const n = (100e3 * 0.5e-3) / (R * 300);
    cerca(ot.Qabs, n * 2.5 * R * (1800 - 300 * 8 ** 0.4), 1e-9, 'calor de la combustión');
    cerca(r('otto-calor').Qabs, 800, 1e-9, 'Otto con el calor dado');
    const di = r('diesel'), g = 1.4;
    cerca(di.eta, 1 - (2 ** g - 1) / (g * 18 ** (g - 1)), 1e-12, 'rendimiento del Diesel');
    // en todos los ciclos la suma de ΔU es 0 y W neto = Q neto
    for (const c of ['carnot', 'otto', 'diesel']) { const x = r(c); cerca(x.tramos.reduce((s, t) => s + t.U, 0), 0, 1e-9 * x.Qabs, `ΔU del ciclo ${c}`); cerca(x.tramos.reduce((s, t) => s + t.Q, 0), x.W, 1e-9 * x.Qabs, `Q neto del ciclo ${c}`); if (x.eta > x.etaC) mal(`Ciclos: el ${c} supera a Carnot`); }
    const mo = r('motor');
    cerca(mo.Qf, 650, 1e-12, 'calor cedido de la máquina'); cerca(mo.ef, 0.35, 1e-12, 'rendimiento de la máquina'); if (!mo.posible || !(mo.dS > 0)) mal('Ciclos: la máquina del 35 % debería ser posible con ΔS > 0');
    const im = r('imposible');
    if (im.posible !== false || !(im.dS < 0)) mal('Ciclos: la máquina del 60 % entre 600 y 300 K debería ser imposible');
    const fr = r('frigorifico');
    cerca(fr.ef, 3, 1e-12, 'COP del frigorífico'); cerca(fr.efC, 268 / 30, 1e-12, 'COP de Carnot del frigorífico');
    cerca(r('bomba').ef, 3.5, 1e-12, 'COP de la bomba de calor');
    for (const [sc, q] of [[{ modo: 'carnot', Tc: '300', Tf: '400', n: '1', V1: '1', V2: '2' }, 'foco frío más caliente'], [{ modo: 'carnot', Tc: '600', Tf: '300', n: '1', V1: '2', V2: '1' }, 'isoterma que comprime'], [{ modo: 'otto', r: '8', T1: '300', P1: '100', V1: '1', T3: '400' }, 'T₃ menor que T₂'], [{ modo: 'diesel', r: '10', rc: '12', T1: '300', P1: '100', V1: '1' }, 'corte mayor que la compresión'], [{ modo: 'maquina', Qc: '1000' }, 'máquina con un solo dato'], [{ modo: 'maquina', Qc: '1000', Qf: '500', W: '300' }, 'datos que no cumplen el primer principio']]) {
      let ok = false; try { CiclosF.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Ciclos: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Ciclos termodinámicos: ${CiclosF.ejemplos.length} ejemplos, Carnot, Otto, Diesel, balances, máquinas posibles e imposibles y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'ciclos', 'index.html'));
      await page.waitForFunction(() => window.CiclosApp);
      const antes = fallos;
      const verC = (await page.locator('#ver').textContent()).trim();
      if (verC !== Version.de('ciclos').current) mal(`Ciclos: la página muestra la versión «${verC}», se esperaba ${Version.de('ciclos').current}`);
      for (const e of CiclosF.ejemplos) {
        await page.evaluate((c) => CiclosApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(120);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, tablas: !document.querySelector('#tablas').hidden, filas: document.querySelectorAll('#tramos tr').length }));
        if (r.err || r.pasos < 3 || r.res < 2) mal(`Ciclos · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`Ciclos · ${e.clave}: el desarrollo no sale en MathML`);
        const ciclo = e.sc.modo !== 'maquina';
        if (r.tablas !== ciclo || (ciclo && r.filas !== 6)) mal(`Ciclos · ${e.clave}: la tabla de estados y tramos ${r.tablas ? 'sale mal o no debería salir' : 'no sale'}`);
      }
      await page.evaluate(() => CiclosApp.abrirEjemplo('otto'));
      if (!(await page.locator('#resumen').textContent()).includes('56,5')) mal('Ciclos: el rendimiento del Otto no sale en la página');
      await page.selectOption('#f-datos', 'Q');
      if ((await page.locator('#f-Q').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Ciclos: al elegir el calor de la combustión no lo pide o da error');
      await page.selectOption('#f-modo', 'maquina');
      await page.fill('#f-Qf', '500');
      await page.fill('#f-W', '100');
      if (await page.locator('#error').isHidden()) mal('Ciclos: tres datos incompatibles no muestran el error');
      await page.click('#play');
      await page.close();
      if (consola.length) mal('Ciclos: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Ciclos termodinámicos: ${CiclosF.ejemplos.length} ejemplos con MathML, tablas solo en los ciclos, cambio de datos y errores sin errores de consola`);
    }
  };
};
