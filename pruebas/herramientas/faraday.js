/* Comprobación de faraday: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo faraday ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Faraday = require(path.join(fuente, 'faraday', 'fisica.js'));
  {
    // valores calculados a mano
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.abs(b || 1))) mal(`Faraday · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => Faraday.resolver(Faraday.ejemplos.find((e) => e.clave === c).sc);
    const b = r('barra');
    cerca(b.eps, 0.4, 1e-12, 'ε = BLv'); cerca(b.I, 0.2, 1e-12, 'I = ε/R'); cerca(b.F, 0.02, 1e-12, 'F = B²L²v/R'); cerca(b.P, 0.08, 1e-12, 'P = ε²/R');
    if (b.sentido !== 'antihorario') mal('Faraday: B entrante y el área que crece deberían dar corriente antihoraria');
    if (r('barra-izq').sentido !== 'antihorario') mal('Faraday: B saliente y el área que decrece deberían dar corriente antihoraria');
    if (Faraday.barra({ B: '1', sentidoB: 'saliente', L: '1', v: '1' }).sentido !== 'horario') mal('Faraday: B saliente y el área que crece deberían dar corriente horaria');
    const al = r('alternador');
    cerca(al.em, 100 * 0.5 * 0.02 * 100 * Math.PI, 1e-12, 'ε_máx = NBSω'); cerca(al.Pm, (al.em / Math.SQRT2) ** 2 / 50, 1e-12, 'potencia media');
    cerca(r('rpm').w, 100 * Math.PI, 1e-12, '3000 rpm en rad/s');
    const fl = r('campo-crece');
    cerca(fl.em, -(50 * 0.4 * Math.PI * 0.0025) / 0.1, 1e-12, 'ε media = −ΔΦ/Δt'); cerca(fl.q, (50 * 0.4 * Math.PI * 0.0025) / 5, 1e-12, 'q = ΔΦ/R');
    const g9 = r('gira-90');
    cerca(g9.F2, 0, 1e-12, 'flujo a 90°'); cerca(g9.em, 0.6 * 0.06 / 0.2, 1e-12, 'ε al girar 90°');
    if (g9.sentido !== 'antihorario') mal('Faraday: el flujo saliente que disminuye debería dar corriente antihoraria');
    const cr = r('cruza');
    cerca(cr.eps, 0.1, 1e-12, 'ε = Bav'); cerca(cr.tramos[0].t1, 0.05, 1e-12, 'tiempo en entrar'); cerca(cr.Q, 0.01, 1e-12, 'calor total');
    if (cr.tramos[0].sentido !== 'antihorario' || cr.tramos[2].sentido !== 'horario') mal('Faraday: sentidos al entrar y al salir');
    const ha = r('hilo-aleja');
    cerca(ha.eps, (4e-7 * Math.PI * 10 * 0.2 * 0.1 * 2) / (2 * Math.PI * 0.05 * 0.15), 1e-9, 'ε = μ₀Ihwv/(2πd(d+w))');
    if (ha.sentido !== 'horario') mal('Faraday: la espira que se aleja de un hilo con I hacia arriba debería tener corriente horaria');
    const hd = r('hilo-dIdt');
    cerca(hd.eps, 2e-7 * 100 * 0.1 * Math.log(5) * 200, 1e-9, 'ε = M dI/dt hilo-espira');
    if (hd.sentido !== 'antihorario') mal('Faraday: la corriente del hilo que crece debería inducir corriente antihoraria');
    const bs = r('B-seno');
    cerca(bs.eps, -200 * Math.PI * 9e-4 * 0.05 * 314 * Math.cos(0.628), 1e-9, 'ε de B₀ sen ωt');
    const bc = r('B-cuadratica');
    cerca(bc.eps, -0.06 * 2 * 0.4 * 2, 1e-12, 'ε de B = kt²');
    if (bc.sentido !== 'horario') mal('Faraday: el campo saliente que crece debería dar corriente horaria');
    const vl = r('velocidad-limite');
    cerca(vl.vL, (0.02 * 9.8 * 0.2) / (0.25 * 0.16), 1e-12, 'velocidad límite mgR/(B²L²)'); cerca(vl.tau, (0.02 * 0.2) / 0.04, 1e-12, 'τ = mR/(B²L²)');
    cerca(r('barra-lanzada').vf(0.8), 5 * Math.exp(-1), 1e-12, 'v(τ) de la barra lanzada');
    cerca(r('disco').eps, 0.5 * 0.8 * 100 * Math.PI * 0.01, 1e-12, 'ε = ½BωR² del disco');
    cerca(r('alternador').par, r('alternador').Pm / (100 * Math.PI), 1e-12, 'par medio del alternador');
    for (const [sc, q] of [[{ modo: 'hilo', I: '1', d: '1', w: '1', h: '1', N: '1' }, 'hilo sin nada que cambie'], [{ modo: 'barra', B: '1', L: '1', v: '0' }, 'barra quieta'], [{ modo: 'flujo', N: '1', forma: 'area', S: '1', B1: '1', B2: '1', dt: '1' }, 'flujo que no cambia'], [{ modo: 'giratoria', N: '2.5', B: '1', forma: 'area', S: '1', w: '1' }, 'N no entero'], [{ modo: 'cruza', N: '1', a: '0', D: '1', v: '1', B: '1' }, 'lado 0']]) {
      let ok = false; try { Faraday.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Faraday: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Faraday: ${Faraday.ejemplos.length} ejemplos, barra, alternador con par, flujo variable, espira que cruza, hilo y espira, B(t), velocidad límite, disco de Faraday, sentidos de Lenz y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'electromagnetismo', 'faraday', 'index.html'));
      await page.waitForFunction(() => window.FaradayApp);
      const antes = fallos;
      const verF = (await page.locator('#ver').textContent()).trim();
      if (verF !== Version.de('faraday').current) mal(`Faraday: la página muestra la versión «${verF}», se esperaba ${Version.de('faraday').current}`);
      for (const e of Faraday.ejemplos) {
        await page.evaluate((c) => FaradayApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(80);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 3) mal(`Faraday · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => FaradayApp.abrirEjemplo('barra'));
      if (!(await page.locator('#res').textContent()).includes('0,4 V')) mal('Faraday: la fem de la barra no sale en la página');
      // copiar la solución como texto o LaTeX e imprimirla (compartir.js)
      if ((await page.locator('.compartir button').count()) !== 4 || !/Resultados[\s\S]*Desarrollo/.test(await page.evaluate(() => Compartir.ejercicio(false)))) mal('Faraday: faltan los botones para copiar o imprimir la solución');
      await page.selectOption('#f-modo', 'giratoria');
      await page.selectOption('#f-forma', 'area');
      if ((await page.locator('#f-S').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Faraday: la forma «superficie» no pide S');
      await page.fill('#f-B', '');
      if (await page.locator('#error').isHidden()) mal('Faraday: sin B no muestra el error');
      await page.click('#play');
      await page.close();
      if (consola.length) mal('Faraday: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Faraday: ${Faraday.ejemplos.length} ejemplos, animación, cambio de forma y errores sin errores de consola`);
    }
  };
};
