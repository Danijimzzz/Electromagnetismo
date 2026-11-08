/* Comprobación de antena: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo antena ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'antena', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Antena · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores conocidos: media onda 73,13 Ω y D = 1,641; corto 80π²(L/λ)² y D = 1,5; λ completa ≈ 199 Ω
    const m = r('media'), c = r('corto'), o = r('onda');
    cerca(m.lam, 299792458 / 1e8, 1e-9, 'λ a 100 MHz');
    cerca(m.Rrad, 73.13, 0.1, 'Rrad de media onda'); cerca(m.D, 1.641, 0.002, 'D de media onda'); cerca(m.dBi, 2.15, 0.01, 'dBi de media onda'); cerca(m.hpbw, 78, 0.3, 'ancho de haz de media onda');
    cerca(m.Prad, 0.5 * m.Rrad * 4, 1e-9, 'Prad = ½ R I²'); cerca(m.E, 376.73 * 2 * 1 / (2 * Math.PI * 1000), 2e-3, 'E en θ = 90° (F = 1)');
    cerca(c.Rrad, 80 * Math.PI ** 2 * (0.1 / c.lam) ** 2, 2e-3, 'Rrad del dipolo corto (80π², con η = 120π)'); cerca(c.D, 1.5, 1e-4, 'D del dipolo corto'); cerca(c.hpbw, 90, 0.3, 'ancho de haz del corto');
    cerca(c.E, 376.73 * 1 * Math.PI * (0.1 / c.lam) * Math.sin(Math.PI / 3) / (2 * Math.PI * 100), 1e-6, 'E del dipolo corto en 60°');
    cerca(o.Rrad, 199, 1.5, 'Rrad del dipolo de onda completa'); cerca(r('tres-medios').thMax, 137.4, 0.5, 'dirección del máximo de 3λ/2');
    // EM-1: casos con solución cerrada del array y de Friis
    {
      const base = { ...C.ejemplos[0].sc, N: '2', d: '0,5', modo: 'broadside', beta: '0' };
      const b = C.resolver(base); // AF = cos(ψ/2): a 60° del eje del array vale cos(π/4 · cos 60°·2)…
      cerca(C.arrayAF(2, Math.PI), 0, 1e-12, 'AF de 2 elementos en ψ = π'); cerca(C.arrayAF(4, 0), 1, 1e-12, 'AF en ψ = 0');
      cerca(b.arr.cH.hpbw, 60, 1, 'ancho de haz H de 2 elementos a λ/2 (60°)');
      const e = C.resolver({ ...base, d: '0,25', modo: 'endfire' });
      cerca(C.campoRel(e.P, Math.PI / 2, Math.PI / 2) / C.campoRel(e.P, Math.PI / 2, 0), Math.SQRT1_2, 1e-9, 'AF endfire de λ/4 a 90° (√½)');
      cerca(e.arr.cH.hpbw, 180, 1, 'ancho de haz endfire λ/4 (180°)'); cerca(C.campoRel(e.P, Math.PI / 2, Math.PI), 0, 1e-9, 'nulo endfire hacia atrás');
      const cuatro = C.resolver(C.ejemplos.find((x) => x.clave === 'array-broadside').sc);
      if (!(cuatro.arr.dBi > cuatro.dBi + 5)) mal('Antena: 4 dipolos broadside deben ganar más de 5 dB sobre uno');
      cerca(cuatro.arr.Prad, 4 * cuatro.Prad, 1e-9, 'Prad del array = N · P1');
      const w = C.resolver(C.ejemplos.find((x) => x.clave === 'enlace-wifi').sc);
      cerca(w.enlace.fspl, 32.44 - 20 + 20 * Math.log10(2400), 0.02, 'pérdida en el espacio libre a 2,4 GHz y 100 m (80,04 dB)');
      cerca(w.enlace.PrdBm, 20 + 2.151 + 2.15 - w.enlace.fspl, 0.05, 'Pr de Friis'); cerca(w.enlace.alcance, 100 * 10 ** (w.enlace.margen / 20), 1e-6 * w.enlace.alcance + 0.01, 'alcance = d · 10^(margen/20)');
      // unidades: «2,4 GHz» y «30 cm» valen lo mismo que 2,4e9 y 0,3
      const u = C.resolver({ ...C.ejemplos.find((x) => x.clave === 'corto').sc, f: '100 MHz', L: '10 cm' });
      cerca(u.Rrad, C.resolver(C.ejemplos.find((x) => x.clave === 'corto').sc).Rrad, 1e-9, 'unidades 100 MHz y 10 cm');
      if (C.malla3d(b.P).length < 500) mal('Antena: la malla 3D es demasiado pequeña');
    }
    for (const [sc, q] of [[{ ...C.ejemplos[0].sc, N: '40' }, 'más de 16 elementos'], [{ ...C.ejemplos[0].sc, N: '3', d: '' }, 'array sin separación'], [{ ...C.ejemplos[0].sc, Pt: '1', Gr: '2', dist: '' }, 'enlace sin distancia'], [{ ...C.ejemplos[0].sc, f: '' }, 'falta la frecuencia'], [{ ...C.ejemplos[0].sc, r: '0' }, 'distancia cero'], [{ ...C.ejemplos[1].sc, L: '2' }, 'dipolo corto demasiado largo'], [{ ...C.ejemplos[0].sc, th: '200' }, 'ángulo fuera de rango']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Antena: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Antena: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'antena', 'index.html'));
    await page.waitForFunction(() => window.AntenaApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('antena').current) mal(`Antena: la página muestra la versión «${ver}», se esperaba ${Version.de('antena').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => AntenaApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Antena · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Antena · ${e.clave}: el desarrollo no sale en MathML`);
    }
    // vista 3D, plano H, exportar y array en la página
    await page.evaluate(() => AntenaApp.abrirEjemplo('array-broadside'));
    const v = await page.evaluate(() => ({ d3: document.querySelector('#desc3d').textContent.length, rol: document.querySelector('#vista3d').getAttribute('role'), lab: document.querySelector('#vista3d').getAttribute('aria-label').length, btn: [...document.querySelectorAll('.exportar button')].map((b) => b.textContent), giro: document.querySelectorAll('#vista3d + .controles button').length }));
    if (v.d3 < 60 || v.rol !== 'img' || v.lab < 60) mal('Antena: la vista 3D no tiene descripción en texto');
    if (v.btn.length !== 2 || v.giro < 5) mal('Antena: faltan los botones de exportar o de girar la vista 3D');
    const antesVista = await page.evaluate(() => AntenaApp.vista());
    await page.focus('#vista3d'); await page.keyboard.press('ArrowRight');
    if ((await page.evaluate(() => AntenaApp.vista().yaw)) === antesVista.yaw) mal('Antena: las flechas no giran la vista 3D');
    await page.selectOption('#plano', 'H');
    if (!/plano h/i.test(await page.locator('#leyenda').textContent())) mal('Antena: el plano H no actualiza la leyenda');
    const tsv = await page.evaluate(() => { let t = ''; navigator.clipboard.writeText = async (x) => { t = x; }; document.querySelector('.exportar button:nth-of-type(2)').click(); return new Promise((r) => setTimeout(() => r(t), 100)); });
    if (tsv.split('\n').length !== 361 || !tsv.startsWith('φ (°)\tPotencia relativa')) mal('Antena: «Copiar datos» no copia la tabla del diagrama');
    const [descarga] = await Promise.all([page.waitForEvent('download'), page.click('.exportar button:nth-of-type(1)')]);
    if (!/\.png$/.test(descarga.suggestedFilename())) mal('Antena: el PNG exportado no tiene extensión .png');
    await page.fill('#f-N', '3'); await page.fill('#f-d', '0,5');
    if (await page.locator('#error').isVisible()) mal('Antena: un array de 3 elementos da error: ' + await page.locator('#error').textContent());
    await page.evaluate(() => AntenaApp.abrirEjemplo('media'));
    await page.fill('#f-r', '0');
    if (await page.locator('#error').isHidden()) mal('Antena: una distancia cero no muestra el error');
    await page.close();
    if (consola.length) mal('Antena: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Antena: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
