/* Comprobación de transitorios: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo transitorios ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const TrC = require(path.join(fuente, 'transitorios', 'fisica.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Transitorios · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => TrC.resolver(TrC.ejemplos.find((e) => e.clave === c).sc);
    for (const x of TrC.ejemplos) { try { const s = TrC.resolver(x.sc); if (s.pasos.length < 2) mal(`Transitorios · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Transitorios · ${x.clave}: ${err.message}`); } }
    const c = r('carga'); cerca(c.tau, 1, 1e-12, 'τ = RC'); cerca(c.Vct, 12 * (1 - Math.exp(-1)), 1e-12, 'V_C(τ)'); cerca(c.It, 1.2e-3 * Math.exp(-1), 1e-12, 'i(τ)');
    const d = r('descarga'); cerca(d.tObj, 0.94 * Math.log(3), 1e-12, 'tiempo de descarga hasta V₀/3');
    const v0 = r('carga-v0'); cerca(v0.Vct, 10 - 6 * Math.exp(-0.5), 1e-12, 'carga con V₀'); cerca(v0.tObj, Math.log(6), 1e-12, 'tiempo con V₀');
    const ls = r('rl-sube'); cerca(ls.tau, 0.05, 1e-12, 'τ = L/R'); cerca(ls.It, 2 * (1 - Math.exp(-1)), 1e-12, 'i(τ) en RL'); cerca(ls.E, 0.6, 1e-12, 'energía ½LI²');
    cerca(r('rl-baja').tObj, 0.05 * Math.log(4), 1e-12, 'tiempo de bajada en RL');
    if (r('rlc-sub').tipo !== 'sub' || r('rlc-critico').tipo !== 'critico' || r('rlc-sobre').tipo !== 'sobre') mal('Transitorios: el tipo de amortiguamiento del RLC no cuadra');
    const sb = r('rlc-sub'); cerca(sb.a, 100, 1e-12, 'α'); cerca(sb.w0, 1000, 1e-12, 'ω₀'); cerca(sb.Rc, 200, 1e-12, 'resistencia crítica');
    // V_C del RLC cumple LC V'' + RC V' + V = V_fuente y las condiciones iniciales
    for (const k of ['rlc-sub', 'rlc-critico', 'rlc-sobre', 'lc']) {
      const x = r(k), L = x.L, C = x.C, R = x.R, h = 1e-7, t = x.T / 7, V = x.Vc;
      const res = L * C * (V(t + h) - 2 * V(t) + V(t - h)) / (h * h) + R * C * (V(t + h) - V(t - h)) / (2 * h) + V(t) - x.V;
      if (Math.abs(res) > 1e-3 * Math.max(1, Math.abs(x.V), Math.abs(x.V0 || 0))) mal(`Transitorios · ${k}: V_C(t) no cumple la ecuación (residuo ${res})`);
      if (Math.abs(V(0) - (x.V0 || 0)) > 1e-9 * Math.max(1, Math.abs(x.V0 || 0))) mal(`Transitorios · ${k}: V_C(0) no es V₀`);
    }
    for (const [q, sc] of [['R negativa', { modo: 'rc', proceso: 'carga', V: '10', R: '-5', C: '10' }], ['C vacía', { modo: 'rc', proceso: 'carga', V: '10', R: '5', C: '' }], ['L que no es un número', { modo: 'rl', proceso: 'subida', V: '10', R: '5', L: 'abc' }], ['una tensión que no se alcanza', { modo: 'rc', proceso: 'carga', V: '10', R: '5', C: '10', Vobj: '12' }]]) {
      let ok = false; try { TrC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Transitorios: ${q} no da error`);
    }
    // primer pico del RLC subamortiguado también con corriente inicial: ahí i = 0 por primera vez
    for (const I0 of ['', '0,5', '-0,5']) {
      const x = TrC.rlc({ V: '10', R: '20', L: '100', C: '10', V0: '', I0, t: '' }), n = 20000;
      let t0 = null; for (let k = 1, prev = x.I(1e-12); k <= n; k++) { const t = (x.T * k) / n, c = x.I(t); if (c * prev < 0) { t0 = t; break; } prev = c; }
      if (!x.pico || t0 === null || Math.abs(x.pico.t - t0) > x.T / n) mal(`Transitorios: el primer pico del RLC con I₀ = ${I0 || 0} no está donde i = 0 (${x.pico && x.pico.t} en vez de ${t0})`);
    }
    { const a = TrC.rc({ proceso: 'carga', V: '12', R: '10000', C: '100' }), b = TrC.rc({ proceso: 'carga', V: '12V', R: '10k', C: '100µF' }); cerca(b.tau, a.tau, 1e-12, 'τ con prefijos'); }
    if (fallos === antes) console.log(`  ✓ Transitorios: ${TrC.ejemplos.length} ejemplos, τ, carga y descarga, tiempo hasta un valor, RL, energía, tipo de amortiguamiento, ecuación del RLC y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'circuitos', 'transitorios', 'index.html'));
      await page.waitForFunction(() => window.TransitoriosApp);
      const antes = fallos;
      const verT = (await page.locator('#ver').textContent()).trim();
      if (verT !== Version.de('transitorios').current) mal(`Transitorios: la página muestra la versión «${verT}», se esperaba ${Version.de('transitorios').current}`);
      for (const e of TrC.ejemplos) {
        await page.evaluate((c) => TransitoriosApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(60);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
        if (r.err || r.pasos < 2 || r.res < 1) mal(`Transitorios · ${e.clave}: falta el resultado o el desarrollo`);
        if (r.modo !== e.sc.modo) mal(`Transitorios · ${e.clave}: el modo no cuadra`);
      }
      await page.evaluate(() => TransitoriosApp.abrirEjemplo('carga'));
      if (!(await page.locator('#res').textContent()).includes('7,585')) mal('Transitorios: V_C(τ) = 7,585 V no sale en la página');
      await page.fill('#f-R', '20000');
      if (!(await page.locator('#res').textContent()).includes('2 s')) mal('Transitorios: con el doble de R no sale τ = 2 s');
      await page.selectOption('#f-proceso', 'descarga');
      if ((await page.locator('#f-V').count()) !== 0 || !(await page.locator('#error').isHidden())) mal('Transitorios: en la descarga sigue saliendo la fuente o da error');
      await page.fill('#f-C', 'abc');
      if (await page.locator('#error').isHidden()) mal('Transitorios: una C que no es un número no da error');
      await page.selectOption('#f-modo', 'rlc');
      if ((await page.locator('#f-L').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Transitorios: al pasar a RLC no sale L o da error');
      await page.fill('#f-R', '1000');
      if (!(await page.locator('#res').textContent()).includes('sobreamortiguado')) mal('Transitorios: con R grande el RLC no sale sobreamortiguado');
      await page.click('#play');
      if ((await page.locator('#play').textContent()).trim() !== '▶ Seguir') mal('Transitorios: el botón de pausa no cambia');
      for (let i = 0; i < 12; i++) { await page.evaluate(() => TransitoriosApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Transitorios: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => TransitoriosApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Transitorios: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Transitorios: ${TrC.ejemplos.length} ejemplos, cambio de R, descarga, RLC sobreamortiguado, errores y ejercicios al azar sin errores de consola`);
    }
  };
};
