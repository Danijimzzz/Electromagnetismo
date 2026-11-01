/* Comprobación de lineas-transmision: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo lineas-transmision ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'lineas-transmision', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)) + 1e-12)) mal(`Líneas de transmisión · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // 100 Ω sobre 50 Ω: Γ = 1/3, ROE = 2, RL = 20 log 3, máximo en la carga, mínimo a λ/4 y Zin(λ/4) = Z0²/ZL = 25 Ω
    const a = r('resistiva');
    cerca(a.g, 1 / 3, 1e-12, '|Γ| = 1/3'); cerca(a.th, 0, 1e-12, 'θ = 0'); cerca(a.roe, 2, 1e-12, 'ROE = 2'); cerca(a.rl, 20 * Math.log10(3), 1e-12, 'pérdida de retorno');
    cerca(a.pRef, 100 / 9, 1e-12, 'potencia reflejada'); cerca(a.desad, -10 * Math.log10(8 / 9), 1e-12, 'pérdida por desadaptación');
    cerca(a.dmaxL, 0, 1e-9, 'máximo en la carga'); cerca(a.dminL, 0.25, 1e-12, 'mínimo a λ/4'); cerca(a.zin.re, 25, 1e-9, 'Zin real a λ/4'); cerca(a.zin.im, 0, 1e-9, 'Zin imaginaria a λ/4');
    cerca(a.Zmax, 100, 1e-12, 'Z en el máximo'); cerca(a.Zmin, 25, 1e-12, 'Z en el mínimo'); cerca(a.lam, 299792458 / 5e8, 1e-12, 'λ a 500 MHz');
    cerca(a.cuarto.Zt1, 50 * Math.SQRT2, 1e-12, 'transformador λ/4');
    // 25 + j25 sobre 50 Ω: Γ = −0,2 + j0,4
    const b = r('compleja');
    cerca(b.G.re, -0.2, 1e-12, 'Re Γ'); cerca(b.G.im, 0.4, 1e-12, 'Im Γ'); cerca(b.g, Math.sqrt(0.2), 1e-12, '|Γ|'); cerca(b.th * 180 / Math.PI, 116.565051, 1e-8, 'fase de Γ');
    cerca(b.roe, (1 + Math.sqrt(0.2)) / (1 - Math.sqrt(0.2)), 1e-12, 'ROE');
    // cada solución del stub deja una admitancia 1 + jb a su distancia y el stub la anula
    for (const e of C.ejemplos) {
      const s = C.resolver(e.sc);
      if (s.adaptada) continue;
      if (s.stub.length !== 2) mal(`Líneas de transmisión · ${e.clave}: debería haber dos soluciones de stub`);
      for (const q of s.stub) {
        const z = C.zEn(s, q.d), den = z.re * z.re + z.im * z.im, y = { re: z.re / den * s.Z0, im: -z.im / den * s.Z0 };
        cerca(y.re, 1, 1e-9, `${e.clave}: conductancia normalizada 1 en el stub`); cerca(y.im, q.bn, 1e-8, `${e.clave}: susceptancia del stub`);
        cerca(Math.tan(2 * Math.PI * q.lcc) * q.bn, 1, 1e-8, `${e.clave}: stub en cortocircuito cancela b`); cerca(-Math.tan(2 * Math.PI * q.lab) / q.bn, 1, 1e-8, `${e.clave}: stub en abierto cancela b`);
      }
      // la línea de λ/4 con Z_T lleva la impedancia del máximo a Z0
      cerca(s.cuarto.Zt1 ** 2 / s.Zmax, s.Z0, 1e-12, `${e.clave}: Z_T² / Z_máx = Z0`);
      cerca(C.zEn(s, s.dmaxL).re, s.Zmax, 1e-8, `${e.clave}: impedancia real Z0·ROE en el máximo`);
    }
    // carga adaptada: Γ = 0, ROE = 1, sin adaptación
    const m = r('adaptada'); if (m.g > 1e-12 || m.roe !== 1 || m.stub !== null) mal('Líneas de transmisión: la carga adaptada debería tener Γ = 0 y ROE = 1');
    // una línea de λ/2 repite la carga
    const h = C.resolver({ ...C.ejemplos[0].sc, l: '0,5', lu: 'lam' }); cerca(h.zin.re, 25, 1e-9, 'λ/2 repite R'); cerca(h.zin.im, 25, 1e-9, 'λ/2 repite X');
    // longitud en metros o en λ dan lo mismo; con εr la λ se acorta
    const e1 = C.resolver({ ...C.ejemplos[0].sc, l: '1,5', lu: 'm' }), e2 = C.resolver({ ...C.ejemplos[0].sc, l: String(1.5 / e1.lam), lu: 'lam' });
    cerca(e2.zin.re, e1.zin.re, 1e-9, 'metros y λ'); cerca(r('antena').lam, 299792458 / 1.5e8 / 1.5, 1e-12, 'λ con εr = 2,25');
    // reactancia vacía = 0, coma decimal
    cerca(C.resolver({ Z0: '50', R: '100', X: '', f: '500', er: '1', l: '0', lu: 'm' }).roe, 2, 1e-12, 'X vacía');
    for (const x of C.ejemplos) { const s2 = C.resolver(x.sc); if (s2.pasos.length < 5) mal(`Líneas de transmisión · ${x.clave}: desarrollo corto`); }
    for (const [q, sc] of [['sin Z0', { ...C.ejemplos[0].sc, Z0: '' }], ['R cero', { ...C.ejemplos[0].sc, R: '0' }], ['frecuencia negativa', { ...C.ejemplos[0].sc, f: '-5' }], ['longitud negativa', { ...C.ejemplos[0].sc, l: '-1' }], ['εr texto', { ...C.ejemplos[0].sc, er: 'abc' }]]) {
      let ok = false; try { C.resolver(sc); } catch (err) { ok = true; }
      if (!ok) mal(`Líneas de transmisión: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Líneas de transmisión: ${C.ejemplos.length} ejemplos, Γ, ROE, pérdidas, Zin, máximos y mínimos, stubs, transformador λ/4 y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'lineas-transmision', 'index.html'));
    await page.waitForFunction(() => window.LineasTransmisionApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('lineas-transmision').current) mal(`Líneas de transmisión: la página muestra la versión «${ver}», se esperaba ${Version.de('lineas-transmision').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => LineasTransmisionApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), num: document.querySelectorAll('#resumen > div.num').length }));
      if (r.err || !r.pasos || !r.num) mal(`Líneas de transmisión · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Líneas de transmisión · ${e.clave}: el desarrollo no sale en MathML`);
    }
    // los dos lienzos dibujan algo
    const pix = await page.evaluate(() => [...document.querySelectorAll('canvas')].map((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; }));
    if (pix.length !== 2 || pix.some((n) => n < 2000)) mal('Líneas de transmisión: algún lienzo parece vacío');
    await page.fill('#f-R', '0');
    if (await page.locator('#error').isHidden()) mal('Líneas de transmisión: una resistencia cero no muestra el error');
    await page.fill('#f-R', '100'); await page.fill('#f-X', '0'); await page.selectOption('#f-lu', 'lam'); await page.fill('#f-l', '0,25');
    const re = await page.evaluate(() => LineasTransmisionApp.resultado());
    if (Math.abs(re.roe - 2) > 1e-9 || Math.abs(re.zin.re - 25) > 1e-6) mal('Líneas de transmisión: cambiar los datos en la página no recalcula');
    await page.evaluate(() => LineasTransmisionApp.azar());
    const az = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, enun: LineasTransmisionApp.enunciado().length, num: document.querySelectorAll('#resumen > div.num').length }));
    if (az.err || az.enun < 50 || !az.num) mal('Líneas de transmisión: el ejercicio al azar no sale bien');
    await page.close();
    if (consola.length) mal('Líneas de transmisión: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Líneas de transmisión: ${C.ejemplos.length} ejemplos en la página con MathML, dos lienzos, cambio de datos, ejercicio al azar y errores, sin errores de consola`);
  };
};
