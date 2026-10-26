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
    // superposición, energía y reflexión
    cerca(r('pulsaciones').fb, 4, 1e-12, 'pulsaciones |f1 − f2|'); cerca(r('pulsaciones').fm, 442, 1e-12, 'frecuencia media');
    const de = r('desfase');
    cerca(de.delta, Math.PI, 1e-12, 'Δr = λ/2 ⇒ δ = π'); cerca(de.A, 0.01, 1e-12, 'interferencia destructiva |A1 − A2|');
    cerca(Ondas.resolver({ modo: 'superposicion', tipo: 'fase', A1: '3', A2: '4', f: '1', v: '1', delta: 'π/2' }).A, 5, 1e-12, 'desfase π/2: √(3² + 4²)');
    const en = r('energia'), v = Math.sqrt(80 / 0.05), w = 120 * Math.PI;
    cerca(en.v, v, 1e-12, 'v = √(T/μ)'); cerca(en.P, 0.5 * 0.05 * w * w * 1e-4 * v, 1e-9, 'P = ½ μ ω² A² v');
    const re = r('reflexion');
    cerca(re.r, -0.5, 1e-12, 'r con μ₂ = 9 μ₁'); cerca(re.t, 0.5, 1e-12, 't con μ₂ = 9 μ₁'); cerca(re.R + re.Tt, 1, 1e-12, 'R + T = 1');
    cerca(r('reflexion-ligera').r, 0.5, 1e-12, 'reflexión hacia una cuerda ligera: r > 0');
    if (fallos === antes) console.log(`  ✓ Ondas: ${Ondas.ejemplos.length} ejemplos, ecuación con π, armónicos y nodos, Doppler, decibelios, pulsaciones, interferencia, energía, reflexión y errores`);
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
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => OndasApp.azar());
        const en = await page.evaluate(() => OndasApp.enunciado());
        if (!(await page.locator('#error').isHidden()) || /undefined|NaN/.test(en)) mal(`Ondas · práctica: ejercicio al azar con error o sin enunciado: ${en}`);
      }
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
