/* Comprobación de transitorios: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo transitorios ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  // el circuito cualquiera de primer orden se resuelve con Continua, que en la página va antes
  global.Continua = require(path.join(fuente, 'circuitos', 'fisica.js'));
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
    // tres valores a mano: 12 V con 4 kΩ y C = 100 μF; después se conecta otra de 4 kΩ en paralelo con C ⇒ de 12 V a 6 V con R_th = 2 kΩ
    const p1 = r('primer-rc'); cerca(p1.x0, 12, 1e-12, 'primer orden: V_C(0)'); cerca(p1.xf, 6, 1e-12, 'primer orden: V_C(∞)'); cerca(p1.Rth, 2000, 1e-9, 'primer orden: R_th'); cerca(p1.tau, 0.2, 1e-9, 'primer orden: τ = R_th C');
    // la bobina llevaba 10 V / 2 Ω = 5 A y se descarga por 2 + 10 Ω
    const p2 = r('primer-rl'); cerca(p2.x0, 5, 1e-12, 'primer orden RL: i(0)'); if (Math.abs(p2.xf) > 1e-12) mal('Transitorios · primer orden RL: i(∞) no es 0'); cerca(p2.Rth, 12, 1e-9, 'primer orden RL: R_th'); cerca(p2.tau, 0.1 / 12, 1e-9, 'primer orden RL: τ = L/R_th');
    cerca(p2.I(p2.tau), 5 * Math.exp(-1), 1e-9, 'primer orden RL: i(τ)');
    for (const [q, els] of [['dos condensadores', [{ t: 'V', a: 'a', b: '0', v: '10' }, { t: 'R', a: 'a', b: 'b', v: '1k' }, { t: 'C', a: 'b', b: '0', v: '10' }, { t: 'C', a: 'a', b: 'b', v: '10' }]], ['un condensador que se desconecta', [{ t: 'V', a: 'a', b: '0', v: '10' }, { t: 'R', a: 'a', b: 'b', v: '1k' }, { t: 'C', a: 'b', b: '0', v: '10', cuando: 'antes' }]], ['nada que cambie', [{ t: 'V', a: 'a', b: '0', v: '10' }, { t: 'R', a: 'a', b: 'b', v: '1k' }, { t: 'C', a: 'b', b: '0', v: '10' }]]]) {
      let ok = false; try { TrC.resolver({ modo: 'primer', elementos: els }); } catch (e) { ok = true; }
      if (!ok) mal(`Transitorios: un circuito de primer orden con ${q} no da error`);
    }
    // conmutación: carga 2τ con τ = 0,1 s y descarga por 4,7 kΩ; la bobina se abre a los 4τ por 1 kΩ
    const cm = r('rc-conmuta'); cerca(cm.V1, 12 * (1 - Math.exp(-2)), 1e-12, 'V_C(t₁)'); cerca(cm.tau2, 0.47, 1e-12, 'τ₂ = R₂C'); cerca(cm.Vc(0.2 + 0.47), cm.V1 * Math.exp(-1), 1e-9, 'descarga tras t₁');
    const ch = r('rl-chispa'), I1 = 2 * (1 - Math.exp(-4)); cerca(ch.I1, I1, 1e-12, 'i(t₁) en RL'); cerca(ch.pico, -I1 * 1000, 1e-12, 'pico −i·R₂ al abrir'); cerca(ch.tau2, 0.3e-3, 1e-12, 'τ₂ = L/R₂');
    const i0 = r('rl-i0'); cerca(i0.I(0), 0.5, 1e-12, 'RL con I₀'); cerca(i0.tObj, 0.05 * Math.log(3), 1e-12, 'tiempo con I₀');
    const rt = r('rlc-tiempo'); cerca(rt.Vc(rt.tObj), 12, 1e-9, 'RLC: V_C(t) = 12 V'); if (rt.Vc(rt.tObj * 0.99) >= 12) mal('Transitorios: el tiempo del RLC no es la primera vez');
    if (r('rlcp-sub').tipo !== 'sub' || r('rlcp-sobre').tipo !== 'sobre') mal('Transitorios: el tipo de amortiguamiento del RLC en paralelo no cuadra');
    cerca(r('rlcp-sub').a, 250, 1e-12, 'α = 1/(2RC) en paralelo'); cerca(r('rlcp-sub').Rc, 50, 1e-12, 'resistencia crítica ½√(L/C)');
    // i_L del RLC en paralelo cumple LC i″ + (L/R) i′ + i = I, e i_L(0) = I₀; v = L di/dt
    for (const sc of [r('rlcp-sub'), r('rlcp-sobre'), TrC.rlcp({ I: '0', L: '100', C: '10', V0: '5', I0: '0,2' })]) {
      const { L, C, R } = sc, h = 1e-7, t = sc.T / 7, F = sc.I;
      const res = L * C * (F(t + h) - 2 * F(t) + F(t - h)) / (h * h) + (R === null ? 0 : L / R) * (F(t + h) - F(t - h)) / (2 * h) + F(t) - sc.Ig;
      if (Math.abs(res) > 1e-3 * Math.max(1, Math.abs(sc.Ig))) mal(`Transitorios: i_L del RLC en paralelo no cumple la ecuación (residuo ${res})`);
      if (Math.abs(F(0) - sc.I0) > 1e-9 || Math.abs(sc.v(0) - sc.V0) > 1e-9 * Math.max(1, Math.abs(sc.V0))) mal('Transitorios: el RLC en paralelo no empieza en I₀ y V₀');
    }
    if (fallos === antes) console.log(`  ✓ Transitorios: ${TrC.ejemplos.length} ejemplos, τ, carga y descarga, tiempo hasta un valor, RL, energía, tipo de amortiguamiento, ecuación del RLC en serie y en paralelo, tres valores, conmutación y errores`);
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
      // circuito cualquiera: quitar la R de después deja el circuito sin transitorio; volver a añadirla con los botones
      await page.evaluate(() => TransitoriosApp.abrirEjemplo('primer-rc'));
      if (!(await page.locator('#res').textContent()).includes('200 ms')) mal('Transitorios: el circuito de primer orden no da τ = 200 ms');
      await page.click('#campos [data-quita="3"]');
      if (await page.locator('#error').isHidden()) mal('Transitorios: sin la resistencia de después no avisa de que no hay transitorio');
      await page.click('#campos [data-add="R"]');
      const filas = await page.locator('#campos .lista select').count();
      await page.locator('#campos .lista select').nth(filas - 1).selectOption('despues');
      await page.locator('#campos .lista input[data-i="3"][data-k="a"]').fill('b');
      await page.locator('#campos .lista input[data-i="3"][data-k="v"]').fill('4k');
      if (!(await page.locator('#error').isHidden()) || !(await page.locator('#res').textContent()).includes('200 ms')) mal(`Transitorios: al volver a añadir la resistencia no sale τ = 200 ms: ${await page.locator('#error').textContent()}`);
      // cursor sobre la gráfica: en t = τ, V_C = 6 + 6/e = 8,207 V
      await page.evaluate(() => TransitoriosApp.cursor(0.2));
      if (!(await page.locator('#lectura').textContent()).includes('8,207')) mal(`Transitorios: el cursor en t = τ no lee V_C = 8,207 V: «${await page.locator('#lectura').textContent()}»`);
      await page.evaluate(() => TransitoriosApp.cursor(null));
      const caja = await page.locator('#grafica').boundingBox();
      await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
      if (!(await page.locator('#lectura').textContent()).includes('t =')) mal('Transitorios: al pasar el ratón por la gráfica no se leen los valores');
      // conmutar desde el desplegable carga el ejemplo con R₂ y t₁
      await page.selectOption('#f-modo', 'rl'); await page.selectOption('#f-proceso', 'conmuta');
      if ((await page.locator('#f-R2').count()) !== 1 || (await page.locator('#f-t1').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Transitorios: al conmutar no salen R₂ y t₁ o da error');
      await page.selectOption('#f-modo', 'rlcp');
      if (!(await page.locator('#error').isHidden()) || !(await page.locator('#res').textContent()).includes('subamortiguado')) mal('Transitorios: el RLC en paralelo no sale subamortiguado');
      for (let i = 0; i < 12; i++) { await page.evaluate(() => TransitoriosApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Transitorios: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => TransitoriosApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Transitorios: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Transitorios: ${TrC.ejemplos.length} ejemplos, cambio de R, descarga, RLC sobreamortiguado, errores y ejercicios al azar sin errores de consola`);
    }
  };
};
