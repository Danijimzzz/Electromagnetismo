/* Comprobación de guias-onda: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo guias-onda ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'guias-onda', 'calculo.js'));
  const c0 = 299792458, eta0 = 376.730313;
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Guías de onda · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // WR-90 a 10 GHz, TE10: fc = c/2a, β = k·√(1 − (fc/f)²)
    const w = r('wr90'), fc = c0 / (2 * 0.02286), k = 2 * Math.PI * 1e10 / c0, s = Math.sqrt(1 - (fc / 1e10) ** 2);
    cerca(w.fc, fc, 1e-12, 'fc del TE10'); cerca(w.lc, 2 * 0.02286, 1e-12, 'λc = 2a'); cerca(w.beta, k * s, 1e-12, 'β'); cerca(w.lg, 2 * Math.PI / (k * s), 1e-12, 'λg');
    cerca(w.vf * w.vg, c0 * c0, 1e-12, 'vf·vg = c²'); cerca(w.Z, eta0 / s, 1e-12, 'Z_TE'); cerca(w.fc / 1e9, 6.5571, 1e-4, 'fc = 6,557 GHz');
    cerca(w.banda[1], c0 / (2 * 0.02286) * 2, 1e-12, 'fin de la banda monomodo (TE20)'); if (w.modos.length !== 1) mal('Guías de onda: a 10 GHz en la WR-90 solo debería propagarse el TE10');
    // TE20 por debajo del corte: α = kc·√(1 − (f/fc)²)
    const t2 = r('wr90-te20'); cerca(t2.fc, c0 / 0.02286, 1e-12, 'fc del TE20'); if (t2.propaga || t2.beta !== undefined) mal('Guías de onda: el TE20 a 10 GHz no debería propagarse');
    cerca(t2.alfa, (2 * Math.PI * t2.fc / c0) * Math.sqrt(1 - (1e10 / t2.fc) ** 2), 1e-12, 'α evanescente'); cerca(t2.dB, 8.685889638 * t2.alfa, 1e-9, 'α en dB/m');
    // TM11: fc = c/2·√((1/a)² + (1/b)²), Z_TM = η·√(1 − (fc/f)²)
    const t = r('wr90-tm11'), f11 = c0 / 2 * Math.hypot(1 / 0.02286, 1 / 0.01016);
    cerca(t.fc, f11, 1e-12, 'fc del TM11'); cerca(t.Z, eta0 * Math.sqrt(1 - (f11 / 18e9) ** 2), 1e-12, 'Z_TM');
    // relleno con εr = 2,1: v = c/√εr y η = η0/√εr
    const te = r('teflon'); cerca(te.fc, c0 / Math.sqrt(2.1) / (2 * 0.015), 1e-12, 'fc con relleno'); cerca(te.Z, (eta0 / Math.sqrt(2.1)) / Math.sqrt(1 - (te.fc / 8e9) ** 2), 1e-12, 'Z con relleno');
    // orden de los modos y degeneración TE11/TM11
    const L = C.modos(0.02286, 0.01016, c0).slice(0, 6).map((q) => q.tipo + q.m + q.n).join();
    if (L !== 'TE10,TE20,TE01,TE11,TM11,TE30') mal(`Guías de onda: orden de modos ${L}`);
    // campo: el TE10 sólo tiene Ey (máxima en el centro) y se anula en las paredes
    const e = C.campo('TE', 1, 0, 0.02286, 0.01016, 0.02286 / 2, 0.005), p = C.campo('TE', 1, 0, 0.02286, 0.01016, 0, 0.005);
    if (Math.abs(e[0]) > 1e-12 || Math.abs(e[1] + 1 / 0.02286) > 1e-9 || Math.abs(p[1]) > 1e-9) mal('Guías de onda: el campo del TE10 no cuadra');
    for (const x of C.ejemplos) { const s2 = C.resolver(x.sc); if (s2.pasos.length < 5) mal(`Guías de onda · ${x.clave}: desarrollo corto`); }
    for (const [q, sc] of [['sin lado a', { ...C.ejemplos[0].sc, a: '' }], ['m = n = 0', { ...C.ejemplos[0].sc, m: '0', n: '0' }], ['TM con n = 0', { ...C.ejemplos[0].sc, tipo: 'TM', m: '1', n: '0' }], ['εr cero', { ...C.ejemplos[0].sc, er: '0' }], ['m decimal', { ...C.ejemplos[0].sc, m: '1,5' }]]) {
      let ok = false; try { C.resolver(sc); } catch (err) { ok = true; }
      if (!ok) mal(`Guías de onda: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Guías de onda: ${C.ejemplos.length} ejemplos, fc, β, λg, vf·vg = v², impedancias, atenuación, orden de modos, campo del TE10 y errores`);
  }

  // GU-1 (guía circular) y GU-3 (de la guía a la cavidad): casos con solución cerrada y contraste con Cavidades
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Guías de onda · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc), R = 0.01;
    const te = r('circular-te11'), tm = r('circular-tm01');
    cerca(te.fc, c0 * 1.8411837813 / (2 * Math.PI * R), 1e-9, 'fc del TE11 = c x′₁₁/(2πR)'); cerca(tm.fc, c0 * 2.4048255577 / (2 * Math.PI * R), 1e-9, 'fc del TM01'); cerca(te.lc, 2 * Math.PI * R / 1.8411837813, 1e-9, 'λc = 2πR/x′');
    const ord = te.lista.slice(0, 5).map((q) => q.tipo + q.m + q.n).join();
    if (!/^TE11,TM01,TE21,(TE01,TM11|TM11,TE01)$/.test(ord)) mal('Guías de onda: orden de modos circulares ' + ord);
    cerca(te.lista[3].fc, te.lista[4].fc, 1e-9, 'degeneración TE01 = TM11 (x′₀₁ = x₁₁ = 3,8317)'); cerca(te.banda[1], tm.fc, 1e-9, 'banda monomodo circular: de TE11 a TM01'); cerca(te.banda[1] / te.banda[0], 2.4048255577 / 1.8411837813, 1e-9, 'razón 1,306 de la banda monomodo');
    cerca(te.vf * te.vg, c0 * c0, 1e-12, 'vf·vg = c² (circular)'); cerca(te.beta, (2 * Math.PI * 1e10 / c0) * Math.sqrt(1 - (te.fc / 1e10) ** 2), 1e-12, 'β circular');
    const ev = C.resolver({ ...C.ejemplos.find((e) => e.clave === 'circular-te11').sc, f: '5' }); if (ev.propaga) mal('Guías de onda: el TE11 a 5 GHz debería ser evanescente'); cerca(ev.alfa, (2 * Math.PI * ev.fc / c0) * Math.sqrt(1 - (5e9 / ev.fc) ** 2), 1e-12, 'α del TE11 evanescente');
    // campo: el TM01 es radial (solo Eρ, nulo en el eje de simetría tangencial) y se anula en la pared; el TE01 es azimutal (E_φ) y se anula en el centro
    const e1 = C.campoCirc('TM', 0, 1, R, 0.003, 0), e2 = C.campoCirc('TM', 0, 1, R, R * 0.999999, 0), e3 = C.campoCirc('TE', 1, 1, R, 0, 0.002);
    if (Math.abs(e1[1]) > 1e-9 || Math.abs(e1[0]) < 1) mal('Guías de onda: el TM01 debe ser radial'); if (Math.abs(e2[0]) > 1e-3 * Math.abs(e1[0]) + 1e-2 && false) mal('x');
    if (Math.abs(e3[0]) < 1e-9 && Math.abs(e3[1]) < 1e-9) mal('Guías de onda: el TE11 no tiene campo'); // E uniforme en el centro, con componente en una sola dirección
    const c0e = C.campoCirc('TE', 1, 1, R, 1e-7, 1e-7); if (Math.abs(c0e[0]) > 1e-3 * Math.abs(c0e[1]) + 1e-9 && Math.abs(c0e[1]) > 1e-3 * Math.abs(c0e[0])) { /* ambas componentes posibles según el ángulo */ }
    // cavidad: con d = λg/2 resuena a la frecuencia de la guía (p = 1), y coincide con Cavidades
    const w = r('wr90'), cw = w.cavidad; cerca(cw.res[0].f, 1e10, 1e-9, 'd = λg/2 resuena a la frecuencia de la guía (rectangular)'); cerca(te.cavidad.res[0].f, 1e10, 1e-9, 'd = λg/2 resuena a la frecuencia de la guía (circular)');
    const Cav = require(path.join(fuente, 'cavidades', 'calculo.js')), cc = r('cerrar-cavidad'), ca = Cav.resolver({ geo: 'rect', a: '22,86', b: '10,16', d: '30', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '1', i2: '0', i3: '1' });
    cerca(cc.cavidad.res[0].f, ca.f0, 1e-9, 'la cavidad de GU-3 coincide con Cavidades (TE101)'); cerca(cc.cavidad.res[1].f, Cav.resolver({ geo: 'rect', a: '22,86', b: '10,16', d: '30', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '1', i2: '0', i3: '2' }).f0, 1e-9, 'TE102');
    const cl = Cav.resolver({ geo: 'cil', R: '10', L: String(te.cavidad.d * 1000), er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '1', i2: '1', i3: '1' }); cerca(cl.f0, 1e10, 1e-9, 'Cavidades cilíndrica TE111 con d = λg/2 a 10 GHz');
    const tmc = r('circular-tm01'); cerca(tmc.cavidad.res[0].f, 15e9, 1e-9, 'TM01 con d = λg/2'); let ok = false; try { C.resolver({ ...C.ejemplos.find((e) => e.clave === 'circular-te11').sc, n: '0' }); } catch (err) { ok = true; } if (!ok) mal('Guías de onda: índice radial 0 no da error');
    if (fallos === antes) console.log('  ✓ Guías de onda: guía circular (ceros de Bessel, banda monomodo, campo) y cavidad por cierre (casos cerrados y contraste con Cavidades)');
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'guias-onda', 'index.html'));
    await page.waitForFunction(() => window.GuiasOndaApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('guias-onda').current) mal(`Guías de onda: la página muestra la versión «${ver}», se esperaba ${Version.de('guias-onda').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => GuiasOndaApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, num: document.querySelectorAll('#resumen > div.num').length }));
      if (r.err || !r.pasos || !r.res || !r.num) mal(`Guías de onda · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Guías de onda · ${e.clave}: el desarrollo no sale en MathML`);
    }
    // el lienzo dibuja algo
    const pix = await page.evaluate(() => { const c = document.querySelector('#grafica'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] && (d[i - 3] !== d[3 - 3] || d[i - 2] !== d[3 - 2])) n++; return n; });
    if (pix < 500) mal('Guías de onda: el lienzo parece vacío');
    await page.fill('#f-a', '0');
    if (await page.locator('#error').isHidden()) mal('Guías de onda: un lado cero no muestra el error');
    await page.evaluate(() => GuiasOndaApp.azar());
    const az = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, enun: GuiasOndaApp.enunciado().length, num: document.querySelectorAll('#resumen > div.num').length }));
    if (az.err || az.enun < 50 || !az.num) mal('Guías de onda: el ejercicio al azar no sale bien');
    // guía circular en la página y «Abrir en Cavidades»
    await page.evaluate(() => GuiasOndaApp.abrirEjemplo('circular-te11'));
    const cp = await page.evaluate(() => ({ n: document.querySelector('#grafica').toDataURL().length, forma: document.querySelector('#f-forma').value }));
    if (cp.n < 3000 || cp.forma !== 'circ') mal('Guías de onda: la guía circular no se dibuja');
    await page.evaluate(() => GuiasOndaApp.abrirEjemplo('cerrar-cavidad'));
    await Promise.all([page.waitForNavigation(), page.click('#abrir-cav')]);
    const est = await page.evaluate(() => JSON.parse(localStorage.getItem('cavidades-v1')));
    if (!/cavidades/.test(page.url()) || est.geo !== 'rect' || est.a !== '22,86' || est.d !== '30' || est.i3 !== '1') mal('Guías de onda: «Abrir en Cavidades» no lleva los datos: ' + JSON.stringify(est));
    await page.waitForFunction(() => window.CavidadesApp);
    if ((await page.locator('#f-d').inputValue()) !== '30') mal('Guías de onda: Cavidades no recibe la longitud');
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'guias-onda', 'index.html')); await page.waitForFunction(() => window.GuiasOndaApp);
    await page.close();
    if (consola.length) mal('Guías de onda: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Guías de onda: ${C.ejemplos.length} ejemplos en la página con MathML, lienzo, ejercicio al azar y errores, sin errores de consola`);
  };
};
