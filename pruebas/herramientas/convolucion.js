/* Comprobación de convolucion: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo convolucion ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'convolucion', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Convolución · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    for (const e of C.ejemplos) { try { const x = C.resolver(e.sc); if (x.pasos.length < 5) mal(`Convolución · ${e.clave}: desarrollo corto`); } catch (err) { mal(`Convolución · ${e.clave}: ${err.message}`); } }
    // valores calculados a mano
    let s = r('rect-rect');
    cerca(s.ymax, 2, 1e-9, 'dos pulsos de 1×2: pico A·B·T = 2'); cerca(s.tymax, 2, 1e-2, 'pico en t = 2'); cerca(s.areaY, 4, 1e-12, 'área 2·2');
    s = r('rect-imp');
    cerca(s.ymax, 1.5, 1e-12, 'pulso desplazado por δ: altura 1,5'); cerca(s.tmin, 2, 1e-12, 'empieza en t = 2'); cerca(s.tmaxT, 4, 1e-12, 'acaba en t = 4');
    s = r('exp-exp');
    cerca(s.ymax, 1 / Math.E, 1e-4, 't·e^(−t): máximo 1/e'); cerca(s.tymax, 1, 5e-3, 'máximo en t = 1');
    s = r('esc-exp');
    cerca(s.final, 1, 1e-12, 'escalón con e^(−t): valor final 1'); cerca(s.ymax, 1, 1e-3, 'carga hasta 1');
    s = r('rc-pulso'); // 5 V durante 2 ms con τ = 1 ms: 5(1 − e^(−2))
    cerca(s.ymax, 5 * (1 - Math.exp(-2)), 1e-3, 'RC con pulso de 2 ms'); cerca(s.tymax, 2e-3, 1e-2, 'máximo al acabar el pulso');
    s = r('rc-escalon'); // τ = 10k · 100n = 1 ms
    cerca(s.esc.subida, Math.log(9) * 1e-3, 2e-3, 'tiempo de subida RC = 2,197 τ'); cerca(s.esc.establecimiento, Math.log(50) * 1e-3, 2e-3, 'establecimiento RC = 3,912 τ');
    cerca(s.esc.sobre, 0, 1e-9, 'el RC no se pasa'); cerca(s.esc.final, 1, 1e-9, 'ganancia 1');
    s = r('rlc-escalon'); // R = 20, L = 10 mH, C = 10 µF: ω0 = 3162,3, ζ = 0,3162
    cerca(s.h.w0, 1 / Math.sqrt(10e-3 * 10e-6), 1e-12, 'ω0'); cerca(s.h.z, 10 * Math.sqrt(10e-6 / 10e-3), 1e-12, 'ζ');
    cerca(s.esc.sobre, Math.exp((-Math.PI * s.h.z) / Math.sqrt(1 - s.h.z ** 2)), 2e-3, 'sobreoscilación RLC');
    cerca(s.esc.tpico, Math.PI / (s.h.w0 * Math.sqrt(1 - s.h.z ** 2)), 5e-3, 'instante del pico RLC');
    cerca(s.ymax, 1 + s.esc.sobre, 2e-3, 'el máximo de la salida es el del escalón');
    // CV-2: RL, paso alto y paso banda
    s = r('rl-escalon'); // τ = L/R = 1 ms
    cerca(s.esc.subida, Math.log(9) * 1e-3, 2e-3, 'RL: tiempo de subida 2,197 τ'); cerca(s.h.tau, 1e-3, 1e-12, 'RL: τ = L/R');
    s = r('ph-pulso'); // pulso de 5 V y 4 ms, τ = 1 ms: salta a 5, decae como 5e^(−t/τ) y al acabar cae a −5(1 − e^(−4))·...
    cerca(s.ymax, 5, 1e-3, 'paso alto: el pulso pasa entero al principio'); cerca(s.valorEn(2e-3), 5 * Math.exp(-2), 5e-3, 'paso alto: 5·e^(−t/τ)');
    cerca(s.valorEn(5e-3), -5 * (1 - Math.exp(-4)) * Math.exp(-1), 5e-3, 'paso alto: tras el pulso la salida es negativa y se apaga');
    cerca(s.areaH, 0, 1e-12, 'paso alto: área de h = 0'); cerca(s.esc.final, 0, 1e-9, 'paso alto: bloquea la continua'); cerca(s.esc.pico, 1, 1e-3, 'paso alto: la respuesta al escalón arranca en 1');
    s = r('bp-escalon'); // R = 20, L = 10 mH, C = 10 µF: s(t) = (2ζω0/ωd) e^(−σt) sen(ωd t)
    { const w0 = s.h.w0, z = s.h.z, wd = w0 * Math.sqrt(1 - z * z), pico = ((2 * z * w0) / wd) * Math.exp(-z * w0 * Math.atan(wd / (z * w0)) / wd) * Math.sin(Math.atan(wd / (z * w0)));
      cerca(s.esc.pico, pico, 2e-3, 'paso banda: pico de la respuesta al escalón'); cerca(s.esc.final, 0, 1e-9, 'paso banda: sin ganancia en continua'); cerca(s.areaH, 0, 1e-12, 'paso banda: área de h = 0'); }
    // CV-1: discreta
    s = r('disc-basico'); // {1,2,3} * {1,1} = {1,3,5,3}
    for (const [i, v] of [1, 3, 5, 3].entries()) cerca(s.y[i], v, 1e-12, `discreta: y[${i}]`);
    cerca(s.sumaY, 6 * 2, 1e-12, 'discreta: ∑y = ∑x·∑h'); cerca(s.L, 4, 0, 'discreta: longitud 3 + 2 − 1'); cerca(s.n0, 0, 0, 'discreta: empieza en n = 0');
    s = C.resolver({ ...C.ejemplos[0].sc, modo: 'disc', dx: '1 -1 2', dh: '2 0 1', dnx: '-1', dnh: '3' }); // {2, −2, 5, −1, 2} desde n = 2
    for (const [i, v] of [2, -2, 5, -1, 2].entries()) cerca(s.y[i], v, 1e-12, `discreta con índices: y[${i}]`);
    cerca(s.n0, 2, 0, 'discreta: origen -1 + 3 = 2');
    s = C.resolver({ ...C.ejemplos[0].sc, modo: 'disc', dx: '5', dh: '1,5 2' }); cerca(s.y[0], 7.5, 1e-12, 'discreta: coma decimal'); cerca(s.y[1], 10, 1e-12, 'discreta: un solo valor escala');
    // la numérica coincide con la exacta y con la propiedad de las áreas
    for (const e of C.ejemplos) {
      const x = C.resolver(e.sc);
      if (x.exacta) { let m = 0; for (let i = 0; i < x.t.length; i++) m = Math.max(m, Math.abs(x.y[i] - x.exacta.f(x.t[i]))); cerca(m, 0, 2e-3 * Math.max(1, Math.abs(x.ymax)), `${e.clave}: diferencia con la solución exacta`); }
      if (Number.isFinite(x.areaY) && !x.infinitaX && !x.infinitaH) { let a = 0; for (let i = 1; i < x.t.length; i++) a += 0.5 * (x.y[i] + x.y[i - 1]) * (x.t[i] - x.t[i - 1]); if (x.areaY === 0) cerca(a, 0, 5e-3 * Math.abs(x.ymax) * (x.t[x.t.length - 1] - x.t[0]), `${e.clave}: ∫y = 0 (paso alto)`); else cerca(a / x.areaY, 1, 5e-3, `${e.clave}: ∫y = ∫x·∫h`); }
    }
    // conmutativa
    const a = { ...C.ejemplos[1].sc }, b = { ...a, xt: a.ht, xA: a.hA, xT: a.hT, xa: a.ha, xtau: a.htau, ht: a.xt, hA: a.xA, hT: a.xT, ha: a.xa, htau: a.xtau };
    cerca(C.resolver(a).ymax, C.resolver(b).ymax, 1e-6, 'x*h = h*x');
    for (const [sc, q] of [[{ ...C.ejemplos[0].sc, xT: '' }, 'falta la duración'], [{ ...C.ejemplos[0].sc, hT: '0' }, 'duración cero'], [{ ...C.ejemplos[0].sc, xt: 'imp', ht: 'imp' }, 'dos impulsos'], [{ ...C.ejemplos[5].sc, R: '-1' }, 'resistencia negativa'], [{ ...C.ejemplos[0].sc, xA: 'a' }, 'amplitud no numérica'], [{ ...C.ejemplos[0].sc, modo: 'disc', dx: '' }, 'lista vacía'], [{ ...C.ejemplos[0].sc, modo: 'disc', dx: '1 a' }, 'lista con texto'], [{ ...C.ejemplos[0].sc, modo: 'disc', dx: '0 0' }, 'lista de ceros'], [{ ...C.ejemplos[0].sc, modo: 'disc', dnx: '1,5' }, 'índice no entero'], [{ ...C.ejemplos[0].sc, modo: 'sistema', xt: 'imp', sis: 'ph', R: '1k', C: '1µ' }, 'impulso en paso alto']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Convolución: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Convolución: ${C.ejemplos.length} ejemplos, solución exacta, áreas, RC y RLC y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'circuitos', 'convolucion', 'index.html'));
    await page.waitForFunction(() => window.ConvolucionApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('convolucion').current) mal(`Convolución: la página muestra la versión «${ver}», se esperaba ${Version.de('convolucion').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => ConvolucionApp.abrirEjemplo(c), e.clave);
      await page.evaluate(() => ConvolucionApp.fijar(ConvolucionApp.resultado().tymax));
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div.num').length, pinta: [...document.querySelectorAll('canvas')].map((c) => { const v = document.createElement('canvas'); v.width = c.width; v.height = c.height; return c.toDataURL().length - v.toDataURL().length; }) }));
      if (r.err || r.pasos < 5 || r.res < 3) mal(`Convolución · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Convolución · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.pinta.some((n) => n < 800)) mal(`Convolución · ${e.clave}: una gráfica sale vacía (${r.pinta})`);
    }
    // cambiar de tipo de señal reconstruye los campos
    await page.evaluate(() => ConvolucionApp.abrirEjemplo('rect-rect'));
    await page.selectOption('#f-ht', 'exp');
    if (!(await page.locator('#f-htau').count())) mal('Convolución: al elegir una exponencial no sale la constante de tiempo');
    await page.fill('#f-xT', '0');
    if (await page.locator('#error').isHidden()) mal('Convolución: una duración cero no muestra el error');
    // la animación avanza sola y se para
    await page.evaluate(() => ConvolucionApp.abrirEjemplo('rect-rect'));
    await page.click('#play');
    const v0 = await page.inputValue('#t0'); await page.waitForTimeout(700); const v1 = await page.inputValue('#t0');
    if (+v1 <= +v0) mal(`Convolución: la animación no avanza (${v0} → ${v1})`);
    await page.click('#play'); const p0 = await page.inputValue('#t0'); await page.waitForTimeout(400);
    if ((await page.inputValue('#t0')) !== p0) mal('Convolución: la animación no se para');
    { const Exp = require('./comun/exportar-grafica.js'); Exp.csv(mal);
      await page.evaluate(() => ConvolucionApp.abrirEjemplo('disc-basico'));
      if ((await page.locator('.modos button[aria-selected=true]').getAttribute('data-modo')) !== 'disc') mal('Convolución: el modo discreto no queda seleccionado');
      await Exp.pagina(page, '#grafica', mal, 'Convolución · señales'); await Exp.pagina(page, '#salida', mal, 'Convolución · salida');
      await page.fill('#f-dx', '2 4'); const r2 = await page.evaluate(() => ConvolucionApp.resultado());
      if (!r2 || r2.y.join() !== '2,6,4') mal(`Convolución: al editar la lista discreta sale ${r2 && r2.y}`);
      await page.fill('#f-dx', '1 x'); if (await page.locator('#error').isHidden()) mal('Convolución: una lista discreta con texto no da error');
      await page.click('.modos button[data-modo=conv]'); if (!(await page.locator('#error').isHidden())) mal('Convolución: al volver a «Dos señales» queda un error');
    }
    await page.close();
    if (consola.length) mal('Convolución: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Convolución: ${C.ejemplos.length} ejemplos en la página con MathML, gráficas, animación y errores, sin errores de consola`);
  };
};
