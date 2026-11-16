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
    // EM.FA-3: B(t) = 0,2 sen(2πt) T en 100 espiras de 5 cm de radio, entrante; ε(t) = −N S 0,2·2π cos(2πt) y Lenz por tramos
    { const l = r('B-libre'), S = Math.PI * 0.05 ** 2, t = 0.3;
      cerca(l.eps, -100 * S * 0.4 * Math.PI * Math.cos(2 * Math.PI * t), 1e-9, 'ε(t) de B escrita a mano'); cerca(l.Bt, 0.2 * Math.sin(2 * Math.PI * t), 1e-9, 'B(t) escrita a mano'); cerca(l.I, l.eps / 4, 1e-12, 'I = ε/R con B(t) libre');
      const tr = l.tramos.map((q) => [q.t0, q.t1, q.sentido]);
      if (tr.length !== 3 || tr[0][2] !== 'antihorario' || tr[1][2] !== 'horario' || tr[2][2] !== 'antihorario') mal(`Faraday: la ley de Lenz por tramos de B = 0,2 sen(2πt) no sale (${JSON.stringify(tr)})`);
      else { cerca(tr[0][1], 0.25, 1e-6, 'primer cambio de sentido'); cerca(tr[1][1], 0.75, 1e-6, 'segundo cambio de sentido'); }
      for (const mala of [{ expr: '' }, { expr: '5' }, { expr: 'sen(' }, { tf: '-1' }]) { let ok = false; try { Faraday.resolver({ ...Faraday.ejemplos.find((e) => e.clave === 'B-libre').sc, ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Faraday: ${JSON.stringify(mala)} en B(t) libre debería dar error`); }
      const dos = Faraday.resolver({ ...Faraday.ejemplos.find((e) => e.clave === 'B-libre').sc, expr: '0.5 t', tf: '2' }).tramos; if (dos.length !== 1 || dos[0].sentido !== 'antihorario') mal('Faraday: un campo entrante que crece de forma lineal debería dar un solo tramo antihorario'); }
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
    // FA-1: raíles inclinados, corriente y potencia en el límite, g = 9,80665
    { const inc = Faraday.resolver({ modo: 'dinamica', caso: 'cae', B: '0.5', L: '0.4', R: '0.2', m: '0.02', ang: '30', g: '9,80665', t: '' });
      cerca(inc.vL, (0.02 * 9.80665 * 0.5 * 0.2) / (0.04), 1e-12, 'velocidad límite en raíles a 30°'); cerca(inc.IL, (0.02 * 9.80665 * 0.5) / (0.5 * 0.4), 1e-12, 'corriente límite I = mg sen θ/(BL)');
      cerca(inc.PL, inc.IL * inc.IL * 0.2, 1e-12, 'potencia en el límite = I²R'); cerca(inc.If(10 * inc.tau), inc.IL, 1e-4, 'I(t) tiende a I límite'); cerca(inc.If(0) + 1, 1, 1e-12, 'I(0) = 0 al caer del reposo');
      cerca(Faraday.resolver({ modo: 'dinamica', caso: 'cae', B: '0.5', L: '0.4', R: '0.2', m: '0.02' }).vL, (0.02 * 9.8 * 0.2) / 0.04, 1e-12, 'vertical por defecto con g = 9,8');
      for (const mala of [{ ang: '0' }, { ang: '120' }]) { let ok = false; try { Faraday.resolver({ modo: 'dinamica', caso: 'cae', B: '1', L: '1', R: '1', m: '1', ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Faraday: raíles ${JSON.stringify(mala)} deberían dar error`); }
      // energía: ∫ I² R dt de 0 a ∞ + ½ m vL² = ∫ F v dt (por integración numérica)
      const caer = Faraday.resolver({ modo: 'dinamica', caso: 'lanzada', B: '1', L: '0.5', R: '2', m: '0.1', v0: '5' }); let Q = 0; const n = 20000, T = 20 * caer.tau;
      for (let i = 0; i < n; i++) { const t = ((i + 0.5) * T) / n; Q += caer.If(t) ** 2 * 2 * (T / n); } cerca(Q, 0.5 * 0.1 * 25, 1e-4, 'calor disipado = energía cinética inicial'); }
    // FA-2 Foucault: disco y lámina por la integral de σE²
    { const d = Faraday.resolver(Faraday.ejemplos.find((e) => e.clave === 'foucault-disco').sc), w = 2 * Math.PI * 50, a = 0.05, th = 0.002, sg = 58e6;
      cerca(d.P, (Math.PI * sg * th * a ** 4 * (0.1 * w) ** 2) / 16, 1e-12, 'Foucault disco: potencia media');
      let I = 0; const n = 4000; for (let i = 0; i < n; i++) { const rr = ((i + 0.5) * a) / n, E = (rr / 2) * 0.1 * w; I += sg * E * E * 2 * Math.PI * rr * th * (a / n); } cerca(d.P, I / 2, 1e-5, 'Foucault disco: integral numérica de σE²/2');
      cerca(d.delta, Math.sqrt(2 / (w * 4e-7 * Math.PI * sg)), 1e-12, 'profundidad de penetración'); if (!d.aviso) mal('Faraday: el disco de cobre de 5 cm a 50 Hz debería llevar aviso de efecto pelicular');
      const l = Faraday.resolver(Faraday.ejemplos.find((e) => e.clave === 'foucault-nucleo').sc), l1 = Faraday.resolver({ ...Faraday.ejemplos.find((e) => e.clave === 'foucault-nucleo').sc, N: '1' });
      cerca(l1.P / l.P, 10000, 1e-9, 'laminar en 100 reduce la potencia 10⁴ veces'); cerca(l.comp.P1, l1.P, 1e-12, 'potencia sin laminar'); cerca(l.P, (2e6 * w * w * 1 * (0.0002) ** 2 / 24) * 500e-6, 1e-12, 'Foucault lámina: potencia');
      let J = 0; const m = 4000, dl = 0.0002; for (let i = 0; i < m; i++) { const z = -dl / 2 + ((i + 0.5) * dl) / m, E = z * w; J += 2e6 * E * E * (dl / m); } cerca(l.pv, (J / dl) / 2, 1e-5, 'lámina: media de σE² en el espesor');
      for (const mala of [{ sigma: '0' }, { B0: '' }, { a: '-1' }, { fr: '0' }]) { let ok = false; try { Faraday.resolver({ ...Faraday.ejemplos.find((e) => e.clave === 'foucault-disco').sc, ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Faraday: Foucault ${JSON.stringify(mala)} debería dar error`); }
      let ok = false; try { Faraday.resolver({ ...Faraday.ejemplos.find((e) => e.clave === 'foucault-nucleo').sc, N: '2,5' }); } catch (e) { ok = true; } if (!ok) mal('Faraday: Foucault con N no entero debería dar error'); }
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
