/* Comprobación de ondas: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo ondas ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Ondas = require(path.join(fuente, 'ondas', 'fisica.js'));
  {
    // valores calculados a mano
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Ondas · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => Ondas.resolver(Ondas.ejemplos.find((e) => e.clave === c).sc);
    const a = r('armonica');
    if (a.ec !== 'y(x, t) = 0,05 sen(4πt − πx)') mal(`Ondas: la ecuación sale «${a.ec}»`);
    cerca(a.punto.y, 0.05, 1e-12, 'y en el punto (cresta)'); cerca(a.punto.vy, 0, 1e-12, 'v_y en la cresta');
    if (r('armonica-izq').ec !== 'y(x, t) = 0,02 sen(100πt + πx + π/2)') mal(`Ondas: la ecuación hacia la izquierda sale «${r('armonica-izq').ec}»`);
    cerca(r('guitarra').fn, (3 * Math.sqrt(70 / 0.0011)) / 1.3, 1e-9, 'tercer armónico de la cuerda');
    cerca(r('tubo-abierto').fn, 400, 1e-9, 'tubo abierto n = 2'); cerca(r('tubo-cerrado').fn, 300, 1e-9, 'tubo cerrado modo 2 (3v/4L)');
    if (r('guitarra').nodos.length !== 4 || r('tubo-cerrado').nodos.length !== 2) mal('Ondas: número de nodos incorrecto');
    cerca(r('ambulancia').fp, (700 * 340) / 315, 1e-9, 'Doppler fuente que se acerca'); cerca(r('cruce').fp, (500 * 348) / 370, 1e-9, 'Doppler los dos moviéndose');
    const so = r('altavoz');
    cerca(so.b1, 10 * Math.log10(0.1 / (16 * Math.PI) / 1e-12), 1e-9, 'nivel sonoro'); cerca(so.b1 - so.b2, 20 * Math.log10(4), 1e-9, 'Δβ = 20 log(r₂/r₁)');
    cerca(Ondas.sonido({ P: '0.1', r1: '2', N: '2' }).b1 - so.b1, 10 * Math.log10(2), 1e-9, 'dos fuentes: +3 dB');
    for (const [sc, q] of [[{ modo: 'doppler', f: '500', vs: '340', vF: '340' }, 'fuente supersónica'], [{ modo: 'estacionaria', medio: 'cuerda', L: '1', tension: '10', mu: '0.01', n: '0' }, 'armónico 0'], [{ modo: 'armonica', A: '1', f: '-2', v: '3' }, 'frecuencia negativa']]) {
      let ok = false; try { Ondas.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Ondas: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Ondas: ${Ondas.ejemplos.length} ejemplos, ecuación con π, armónicos y nodos, Doppler, decibelios y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'ondas', 'index.html'));
      await page.waitForFunction(() => window.OndasApp);
      const antes = fallos;
      const verO = (await page.locator('#ver').textContent()).trim();
      if (verO !== Version.de('ondas').current) mal(`Ondas: la página muestra la versión «${verO}», se esperaba ${Version.de('ondas').current}`);
      for (const e of Ondas.ejemplos) {
        await page.evaluate((c) => OndasApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(60);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 2) mal(`Ondas · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => OndasApp.abrirEjemplo('armonica'));
      if (!(await page.locator('#res').textContent()).includes('4πt − πx')) mal('Ondas: la ecuación no sale en la página');
      await page.selectOption('#f-modo', 'estacionaria');
      await page.selectOption('#f-medio', 'cerrado');
      if ((await page.locator('#f-vs').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Ondas: el tubo cerrado no pide la velocidad del sonido');
      await page.fill('#f-L', '0');
      if (await page.locator('#error').isHidden()) mal('Ondas: L = 0 no muestra el error');
      await page.click('#play');
      await page.close();
      if (consola.length) mal('Ondas: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Ondas: ${Ondas.ejemplos.length} ejemplos, animación, cambio de medio y errores sin errores de consola`);
    }
  };
};
