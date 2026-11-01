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
    await page.close();
    if (consola.length) mal('Guías de onda: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Guías de onda: ${C.ejemplos.length} ejemplos en la página con MathML, lienzo, ejercicio al azar y errores, sin errores de consola`);
  };
};
