/* Comprobación de condensadores: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo condensadores ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Condensador = require(path.join(fuente, 'condensadores', 'fisica.js'));
  {
    // capacidades comprobadas a mano (ε0 = 8,8541878128·10⁻¹² F/m) y coherencia de cada solución
    const antes = fallos;
    const C = { 'plano-lleno': 2.2135e-10, 'plano-lamina': 7.0834e-11, 'plano-mitad': 1.7708e-10, 'dos-capas': 5.3125e-11, coaxial: 1.0214e-10, esferico: 1.7974e-11 };
    const e0 = 8.8541878128e-12;
    Object.assign(C, { 'esfera-mitades': 4 * Math.PI * e0 * 0.1 * 3, 'cilindro-sector': ((2 * Math.PI * e0) / Math.log(3)) * 2, 'eps-variable': (e0 * 0.01 * 4) / (0.002 * Math.log(3)), 'rigidez': 7.5893e-11, 'meter-lamina': 2.2135e-10 });
    // ε lineal en la esfera: 1/C = ∫ dr / (4π ε0 εr(r) r²), con la primitiva a mano: εr = 6 − 40 r (r en m)
    { const F = (r) => (1 / 6) * (-1 / r) + (40 / 36) * Math.log(r / (6 - 40 * r)); C['esfera-variable'] = (4 * Math.PI * e0) / (F(0.1) - F(0.05)); }
    for (const e of Condensador.ejemplos) {
      if (e.sc.tipo) continue;
      const r = Condensador.resolver(e.sc);
      if (!(Math.abs(r.C / C[e.clave] - 1) < 2e-4)) mal(`Condensadores · ${e.clave}: C = ${r.C}, se esperaba ${C[e.clave]}`);
      if (Math.abs(r.Q - r.C * r.V) > 1e-9 * Math.abs(r.Q)) mal(`Condensadores · ${e.clave}: Q ≠ C V`);
      if (r.g.disposicion !== 'paralelo') {
        const sumaV = r.regiones.reduce((s, o) => s + o.V, 0);
        if (Math.abs(sumaV - r.V) > 1e-9 * r.V) mal(`Condensadores · ${e.clave}: las tensiones de las capas suman ${sumaV}, no ${r.V}`);
      } else {
        const sumaQ = r.regiones.reduce((s, o) => s + o.Q, 0);
        if (Math.abs(sumaQ - r.Q) > 1e-9 * r.Q) mal(`Condensadores · ${e.clave}: las cargas de las partes suman ${sumaQ}, no ${r.Q}`);
      }
    }
    const x = (c) => Condensador.resolver(Condensador.ejemplos.find((e) => e.clave === c).sc), cerca = (a, b, q) => { if (!(Math.abs(a / b - 1) < 1e-6)) mal(`Condensadores · ${q}: ${a} en vez de ${b}`); };
    cerca(x('rigidez').Vmax, 1750, 'tensión máxima con aire y mica');
    cerca(x('meter-lamina').fuerza.dielectrico, 0.5 * 200 * 200 * e0 * 3 * 0.1 / 0.001, 'fuerza sobre el dieléctrico');
    cerca(x('plano-lleno').fuerza.placas, x('plano-lleno').Q ** 2 / (2 * e0 * 0.01), 'fuerza entre placas');
    const as = x('asoc-serie'); cerca(as.Ceq, 1e-6, 'C en serie'); cerca(as.v[0], 6, 'tensión del de 2 µF en serie');
    const am = x('asoc-mixta'); cerca(am.Ceq, 3e-6, 'C mixta'); cerca(am.v[0], 12, 'tensión de C₁ en la mixta');
    const co = x('conectar'); cerca(co.Vf, 40, 'tensión al conectar'); cerca(co.perdida, 0.012, 'energía perdida al conectar');
    // EM.CO-1: fuerza sobre la lámina y sobre las placas, calculadas a mano
    { const fb = x('fuerza-bateria'), fa = x('fuerza-aislado'), dC = e0 * 0.1 * 3 / 0.001, C = e0 * 0.1 * (4 * 0.05 + 0.05) / 0.001;
      cerca(fb.Fd, 0.5 * 100 * 100 * dC, 'fuerza sobre la lámina con la batería'); cerca(fb.Fp, 0.5 * C * 100 * 100 / 0.001, 'fuerza entre placas con la batería (U/d)');
      cerca(fa.Fd, (1e-8) ** 2 * dC / (2 * C * C), 'fuerza sobre la lámina con la carga fija');
      cerca(fb.Wbat, 2 * fb.dU, 'trabajo de la batería = 2 ΔU'); cerca(fb.Wcampo, fb.dU, 'trabajo del campo con la batería');
      cerca(fa.Wcampo, -fa.dU, 'trabajo del campo con la carga fija');
      // F = −dU/dx con Q fija, derivada numérica
      const U = (t) => (1e-8) ** 2 / (2 * fa.Cx(t)), h = 1e-7; cerca(fa.Fd, -(U(0.05 + h) - U(0.05 - h)) / (2 * h), 'F = −dU/dx por derivada numérica'); }
    { // EM.CO-4: en serie 2, 3 y 6 µF a 600 V las tensiones son 300, 200 y 100 V; con 400, 300 y 150 V de rotura se rompe antes C₁, a 800 V
      const ar = x('asoc-ruptura'); cerca(ar.ruptura.Vmax, 800, 'tensión máxima de la asociación'); if (ar.ruptura.primero !== 0) mal('Condensadores: debería romperse antes C₁'); }
    const pv = x('eps-variable'); if (Math.abs(pv.regiones[0].E1 / pv.regiones[0].E2 - 3) > 1e-9) mal('Condensadores: con ε de 2 a 6 el campo debería bajar a un tercio');
    const l = Condensador.resolver(Condensador.ejemplos[0].sc);
    if (Math.abs(l.regiones[0].E1 - 5e4) > 1e-6 || Math.abs(l.regiones[0].Qp - 0.8 * l.Q) > 1e-18) mal('Condensadores · plano lleno: E debería ser 50 kV/m y Q_p = 0,8 Q');
    for (const mala of [{ geo: 'plano', S: 'x', d: '1' }, { geo: 'esfera', a: '5', b: '3' }, { geo: 'plano', S: '1', d: '1', capas: [{ t: '2', er: '3' }] }, { geo: 'plano', S: '1', d: '1', capas: [{ t: '0.5', er: '0.5' }] }]) {
      let ok = false; try { Condensador.resolver({ ...mala, fuente: 'V', V: '1' }); } catch (e) { ok = true; } if (!ok) mal(`Condensadores: ${JSON.stringify(mala)} debería dar un error`);
    }
    if (fallos === antes) console.log(`  ✓ Condensadores: ${Condensador.ejemplos.length} ejemplos con la capacidad esperada (también sectores y ε variable), Q = CV, tensiones o cargas que cuadran, fuerzas, rigidez, asociaciones y conexión`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'electromagnetismo', 'condensadores', 'index.html'));
      await page.waitForFunction(() => window.CondApp);
      const antes = fallos;
      const verK = (await page.locator('#ver').textContent()).trim();
      if (verK !== Version.de('condensadores').current) mal(`Condensadores: la página muestra la versión «${verK}», se esperaba ${Version.de('condensadores').current}`);
      for (const e of Condensador.ejemplos) {
        await page.evaluate((c) => CondApp.abrirEjemplo(c), e.clave);
        if ((await page.locator('#regiones tbody tr').count()) < 1 || (await page.locator('#pasos li').count()) < 3) mal(`Condensadores · ${e.clave}: faltan la tabla o el desarrollo`);
      }
      // EM-3: la capacidad al conectar admite prefijos y unidades
      await page.evaluate(() => CondApp.abrirEjemplo('plano-lleno')); await page.selectOption('#f-tipo', 'conectar').catch(() => {});
      if ((await page.locator('#f-C1').count()) === 1) { await page.fill('#f-C1', '2200 nF'); await page.fill('#f-C2', '4,7 µF'); if (!(await page.locator('#error').isHidden())) mal('Condensadores: C₁ = 2200 nF y C₂ = 4,7 µF dan error: ' + await page.locator('#error').textContent()); await page.fill('#f-C1', '0 nF'); if (await page.locator('#error').isHidden()) mal('Condensadores: C₁ = 0 nF debería dar error'); }
      await page.evaluate(() => CondApp.abrirEjemplo('plano-lleno'));
      await page.click('#anade');
      await page.selectOption('#f-geo', 'cilindro');
      await page.fill('#f-a', '3'); await page.fill('#f-b', '1');
      if (await page.locator('#error').isHidden()) mal('Condensadores: radios al revés no muestran el error');
      // copiar la solución como texto o LaTeX e imprimirla (compartir.js)
      if ((await page.locator('.compartir button').count()) !== 4 || !/Resultados[\s\S]*Desarrollo/.test(await page.evaluate(() => Compartir.ejercicio(false)))) mal('Condensadores: faltan los botones para copiar o imprimir la solución');
      await page.close();
      if (consola.length) mal('Condensadores: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Condensadores: ${Condensador.ejemplos.length} ejemplos, cambio de forma y errores sin errores de consola`);
    }
  };
};
