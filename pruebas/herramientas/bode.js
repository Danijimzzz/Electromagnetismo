/* Comprobación de bode: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo bode ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const Exp = require('./comun/exportar-grafica.js');
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
    // retardo de grupo: RC bajo τg = RC/(1+(ωRC)²) (RC en continua, RC/2 en f_c); RLC bajo en f0: 2Q/ω0
    { const s = r('rc-bajo'), tau = 1000 * 0.159e-6; cerca(C.retardo(s.P, s.f0 / 1e4) / tau, 1, 1e-6, 'RC: τg en continua = RC'); cerca(C.retardo(s.P, s.f0) / tau, 0.5, 1e-6, 'RC: τg(f_c) = RC/2');
      const w = 2 * Math.PI * 3 * s.f0; cerca(C.retardo(s.P, 3 * s.f0) / tau, 1 / (1 + (w * tau) ** 2), 1e-6, 'RC: τg a 3 f_c'); }
    { const s = r('rlc-bajo'); cerca(C.retardo(s.P, s.f0) * 2 * Math.PI * s.f0, 2 * s.Q, 1e-5, 'RLC bajo: τg(f0) = 2Q/ω0'); }
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
    // BO-1: con Q alto, el ancho de banda (f0/Q) cabe entre dos puntos de una rejilla logarítmica y el pico no llegaba a 0 dB
    for (const Q of [10, 50, 200, 1000, 5000]) {
      const L = 1e-3, Cap = 1e-6, f0 = 1 / (2 * Math.PI * Math.sqrt(L * Cap)), R = Math.sqrt(L / Cap) / Q, tx = (x) => String(x).replace('.', ',');
      for (const tipo of ['rlc-banda', 'rlc-rechazo']) {
        const s = C.resolver({ tipo, R: tx(R), L: '1', C: '1' }), c = s.curva(500);
        if (s.cortes.length !== 2) { mal(`Bode · ${tipo} Q=${Q}: ${s.cortes.length} cortes en vez de 2`); continue; }
        cerca(s.BW, f0 / Q, 1e-6, `${tipo} Q=${Q}: BW = f0/Q`);
        cerca(s.cortes[0] * s.cortes[1], f0 * f0, 1e-9, `${tipo} Q=${Q}: f1·f2 = f0²`);
        const a = 1 / (2 * Q), r = Math.sqrt(1 + a * a);
        cerca(s.cortes[0], f0 * (r - a), 1e-9, `${tipo} Q=${Q}: f1 analítica`); cerca(s.cortes[1], f0 * (r + a), 1e-9, `${tipo} Q=${Q}: f2 analítica`);
        if (tipo === 'rlc-banda') { cerca(Math.max(...c.dB), 0, 1e-9, `banda Q=${Q}: el máximo dibujado es 0 dB`); cerca(C.Hde(s.P, f0).dB, 0, 1e-9, `banda Q=${Q}: 0 dB en f0`); }
        else if (Math.min(...c.dB) > -40) mal(`Bode · rechazo Q=${Q}: la muesca dibujada solo llega a ${Math.min(...c.dB)} dB`);
        for (let k = 1; k < c.f.length; k++) if (!(c.f[k] > c.f[k - 1])) { mal(`Bode · ${tipo} Q=${Q}: frecuencias de la curva sin ordenar`); break; }
      }
      // paso bajo con pico: el máximo dibujado es el pico exacto Q/√(1 − 1/(4Q²))
      const sb = C.resolver({ tipo: 'rlc-bajo', R: tx(R), L: '1', C: '1' }), cb = sb.curva(500);
      cerca(Math.max(...cb.dB), 20 * Math.log10(Q / Math.sqrt(1 - 1 / (4 * Q * Q))), 1e-6, `bajo Q=${Q}: pico dibujado`);
      // y el mismo resultado que el motor del Simulador
      global.SimCircuitos = global.SimCircuitos || require(path.join(fuente, 'simulador', 'motor.js'));
      const { net, sal } = C.circuitoSimulador('rlc-banda', R, L, Cap), b = SimCircuitos.barrido(net, { fuente: 'V1', a: sal[0], b: sal[1], fmin: f0 * 0.9, fmax: f0 * 1.1, puntos: 15 }), P = C.polinomios('rlc-banda', R, L, Cap);
      b.f.forEach((fr, k) => { if (Math.abs(C.Hde(P, fr).mod - b.mod[k]) > 1e-9 + 1e-6 * b.mod[k]) mal(`Bode · Q=${Q} a ${fr.toFixed(1)} Hz: distinto del motor del simulador`); });
    }
    require('./comun/exportar-grafica.js').csv(mal);
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
    await Exp.pagina(page, '#grafica', mal, 'Bode · magnitud'); await Exp.pagina(page, '#grafica-fase', mal, 'Bode · fase'); await Exp.pagina(page, '#grafica-retardo', mal, 'Bode · retardo de grupo');
    await page.evaluate(() => BodeApp.abrirEjemplo('rc-bajo')); await page.selectOption('#f-unid', 'rad');
    { const t = await page.textContent('#resumen'); if (!/rad\/s/.test(t) || !/Retardo de grupo/.test(t)) mal('Bode: el interruptor rad/s o el retardo de grupo no salen en los resultados: ' + t.slice(0, 120));
      const w = 1 / (1000 * 0.159e-6), tg = await page.evaluate(() => BodeApp.resultado().tg0); if (Math.abs(tg / 0.159e-3 - 1) > 1e-4) mal('Bode: retardo en continua ≠ RC: ' + tg);
      if (!t.includes(String(Math.round(w)).slice(0, 4))) mal('Bode: ω de corte en rad/s no coincide con 1/RC'); }
    await page.selectOption('#f-unid', 'hz');
    await page.fill('#f-R', '0');
    if (await page.locator('#error').isHidden()) mal('Bode: una resistencia cero no muestra el error');
    await page.selectOption('#f-tipo', 'rlc-banda');
    if (await page.locator('#f-L').count() !== 1) mal('Bode: el filtro RLC no pide la inductancia');
    await page.close();
    if (consola.length) mal('Bode: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Bode: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
