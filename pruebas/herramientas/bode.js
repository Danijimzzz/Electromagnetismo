/* Comprobación de bode: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo bode ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'bode', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Bode · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano: RC paso bajo, f_c = 1/(2πRC), −3 dB y −45° en f_c
    { const s = r('rc-bajo'), fc = 1 / (2 * Math.PI * 1000 * 0.159e-6); cerca(s.f0, fc, 1e-12, 'RC: f_c'); cerca(s.cortes[0], fc, 1e-6, 'RC: corte a −3 dB');
      const h = C.Hde(s.P, fc); cerca(h.dB, -3.0103, 1e-4, 'RC: −3 dB'); cerca(h.fase, -45, 1e-9, 'RC: −45°'); cerca(C.Hde(s.P, 100 * fc).dB, -40, 1e-3, 'RC: −20 dB/dec'); }
    { const s = r('rc-alto'); cerca(s.f0, 1 / (2 * Math.PI * 10e3 * 10e-9), 1e-12, 'RC alto: f_c'); cerca(C.Hde(s.P, s.f0).fase, 45, 1e-9, 'RC alto: +45°'); cerca(C.Hde(s.P, s.f0 / 100).dB, -40, 1e-3, 'RC alto: +20 dB/dec'); }
    { const s = r('rl-bajo'); cerca(s.f0, 100 / (2 * Math.PI * 10e-3), 1e-12, 'RL: f_c = R/(2πL)'); }
    // RLC paso banda: f0 = 1/(2π√LC), Q = √(L/C)/R, f1·f2 = f0², BW = f0/Q
    { const s = r('rlc-banda'), f0 = 1 / (2 * Math.PI * Math.sqrt(15.9e-3 * 1.59e-6));
      cerca(s.f0, f0, 1e-12, 'banda: f0'); cerca(s.Q, Math.sqrt(15.9e-3 / 1.59e-6) / 10, 1e-12, 'banda: Q'); cerca(s.BW, f0 / s.Q, 1e-3, 'banda: BW');
      cerca(s.cortes[0] * s.cortes[1], f0 * f0, 1e-6, 'banda: f1·f2 = f0²'); cerca(C.Hde(s.P, f0).dB, 0, 1e-9, 'banda: 0 dB en f0'); cerca(C.Hde(s.P, f0).fase, 0, 1e-6, 'banda: fase 0 en f0'); }
    // RLC paso bajo con Q ≈ 3: pico Q/√(1 − 1/(4Q²)) en f0·√(1 − 1/(2Q²))
    { const s = r('rlc-bajo'), Q = s.Q; cerca(s.pico.dB, 20 * Math.log10(Q / Math.sqrt(1 - 1 / (4 * Q * Q))), 1e-6, 'bajo RLC: pico'); cerca(s.pico.f, s.f0 * Math.sqrt(1 - 1 / (2 * Q * Q)), 1e-9, 'bajo RLC: f del pico');
      cerca(C.Hde(s.P, s.f0).dB, 20 * Math.log10(Q), 1e-9, 'bajo RLC: |H(f0)| = Q'); cerca(C.Hde(s.P, s.f0).fase, -90, 1e-6, 'bajo RLC: −90° en f0'); cerca(C.Hde(s.P, 100 * s.f0).dB, -80, 2e-3, 'bajo RLC: −40 dB/dec'); }
    // rechazo de banda: muesca en f0
    { const s = r('rlc-rechazo'); if (C.Hde(s.P, s.f0).dB > -200) mal('Bode · rechazo: no hay muesca en f0'); cerca(s.cortes[1] - s.cortes[0], s.f0 / s.Q, 1e-3, 'rechazo: BW = f0/Q'); }
    // el punto de interés
    { const s = r('rlc-rechazo'); cerca(s.punto.mod, C.Hde(s.P, 50).mod, 1e-12, 'rechazo: valor en 50 Hz'); }
    // mismo resultado que el motor del Simulador de circuitos
    {
      global.SimCircuitos = require(path.join(fuente, 'simulador', 'motor.js'));
      for (const tipo of Object.keys(C.TIPOS)) {
        const R = 210, L = 0.1, Cc = 0.253e-6, { net, sal } = C.circuitoSimulador(tipo, R, L, Cc), b = SimCircuitos.barrido(net, { fuente: 'V1', a: sal[0], b: sal[1], fmin: 10, fmax: 1e5, puntos: 25 }), P = C.polinomios(tipo, R, L, Cc);
        b.f.forEach((fr, k) => { const h = C.Hde(P, fr); if (Math.abs(h.mod - b.mod[k]) > 1e-9 + 1e-6 * h.mod || (h.mod > 1e-2 && Math.abs(h.fase - b.fase[k]) > 1e-5)) mal(`Bode · ${tipo} a ${fr.toFixed(1)} Hz: distinto del motor del simulador`); });
      }
    }
    for (const [sc, q] of [[{ tipo: 'rc-bajo', R: '', C: '1' }, 'falta R'], [{ tipo: 'rc-bajo', R: '1k', C: '0' }, 'C cero'], [{ tipo: 'rlc-banda', R: '1', L: '1', C: '' }, 'falta C'], [{ tipo: 'xx', R: '1' }, 'tipo desconocido'], [{ tipo: 'rc-bajo', R: '1k', C: '1', fmin: '100', fmax: '10' }, 'rango al revés']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Bode: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Bode: ${C.ejemplos.length} ejemplos (a mano y contra el motor del simulador) y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'circuitos', 'bode', 'index.html'));
    await page.waitForFunction(() => window.BodeApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('bode').current) mal(`Bode: la página muestra la versión «${ver}», se esperaba ${Version.de('bode').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => BodeApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Bode · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Bode · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.fill('#f-R', '0');
    if (await page.locator('#error').isHidden()) mal('Bode: una resistencia cero no muestra el error');
    await page.selectOption('#f-tipo', 'rlc-banda');
    if (await page.locator('#f-L').count() !== 1) mal('Bode: el filtro RLC no pide la inductancia');
    await page.close();
    if (consola.length) mal('Bode: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Bode: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
