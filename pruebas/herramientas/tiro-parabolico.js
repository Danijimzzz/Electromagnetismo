/* Comprobación de tiro-parabolico: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo tiro-parabolico ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Cinematica = require(path.join(fuente, 'tiro-parabolico', 'fisica.js'));
  {
    // resultados con las fórmulas del tiro sin rozamiento, límites del rozamiento y MRUA
    const antes = fallos, g = 9.81, cerca = (a, b, tol = 1e-4) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
    const ESP = {
      clasico: { tv: (2 * 20 * Math.SQRT1_2) / g, alcance: 400 / g, hmax: 200 / (2 * g) },
      horizontal: { tv: Math.sqrt(40 / g), alcance: 15 * Math.sqrt(40 / g), hmax: 20 },
      'caida-libre': { tv: Math.sqrt(90 / g), alcance: 0, vf: Math.sqrt(2 * g * 45) },
      plataforma: { tv: (18 * Math.sin(Math.PI / 3) + Math.sqrt((18 * Math.sin(Math.PI / 3)) ** 2 - 2 * g * 5)) / g },
    };
    for (const e of Cinematica.ejemplos) {
      const r = Cinematica.resolver(e.sc).res;
      for (const [k, v] of Object.entries(ESP[e.clave] || {})) if (!cerca(r[k], v)) mal(`Tiro · ${e.clave}: ${k} = ${r[k]}, se esperaba ${v}`);
      const tr = Cinematica.trayectoria(e.sc), fin = tr.puntos[tr.puntos.length - 1];
      if (Math.abs(fin.y - (e.sc.yf || 0)) > 1e-3) mal(`Tiro · ${e.clave}: la trayectoria acaba en y = ${fin.y}`);
      if (e.sc.modelo !== 'ninguno' && !(r.alcance < r.alcanceIdeal)) mal(`Tiro · ${e.clave}: con rozamiento debería llegar menos lejos`);
    }
    // los dos ángulos del blanco aciertan de verdad
    const bl = Cinematica.ejemplos.find((e) => e.clave === 'blanco');
    const angs = Cinematica.resolver(bl.sc).res.blanco.angulos || [];
    if (angs.length !== 2) mal('Tiro · blanco: deberían salir dos ángulos');
    for (const a of angs) { const d = Cinematica.resolver({ ...bl.sc, ang: a }).res.blanco.dif; if (Math.abs(d) > 1e-6) mal(`Tiro · blanco: con α = ${a}° falla por ${d} m`); }
    // rozamiento casi nulo ≈ sin rozamiento; caída larga → velocidad límite
    const base = { v0: 20, ang: 45, y0: 0, g };
    for (const m of [{ modelo: 'lineal', b: 1e-7 }, { modelo: 'cuadratico', c: 1e-9 }]) { const r = Cinematica.resolver({ ...base, ...m }).res; if (!cerca(r.alcance, 400 / g, 1e-5)) mal(`Tiro · ${m.modelo} casi nulo: alcance ${r.alcance}`); }
    const caida = { v0: 0, ang: 0, y0: 5000, g };
    const vl = Cinematica.resolver({ ...caida, modelo: 'lineal', b: 0.5 }).res.vf, vc = Cinematica.resolver({ ...caida, modelo: 'cuadratico', c: 0.01 }).res.vf;
    if (!cerca(vl, g / 0.5, 1e-6)) mal(`Tiro · lineal: velocidad límite ${vl}, se esperaba ${g / 0.5}`);
    if (!cerca(vc, Math.sqrt(g / 0.01), 1e-4)) mal(`Tiro · cuadrático: velocidad límite ${vc}, se esperaba ${Math.sqrt(g / 0.01)}`);
    for (const mala of [{ ...base, v0: 'x' }, { ...base, ang: 100 }, { ...base, yf: 50 }, { ...base, g: 0 }, { ...base, modelo: 'lineal', b: '' }, { v0: 10, ang: -30, y0: 0, g }]) {
      let ok = false; try { Cinematica.resolver(mala); } catch (e) { ok = true; } if (!ok) mal(`Tiro: ${JSON.stringify(mala)} debería dar un error`);
    }
    const R = Object.fromEntries(Cinematica.ejemplosRecta.map((e) => [e.clave, Cinematica.rectilineo(e.sc).res]));
    if (!cerca(R.frenada.tParada, 5) || !cerca(R.frenada.xParada, 62.5)) mal('MRUA · frenada: debería pararse en t = 5 s y x = 62,5 m');
    if (R.arranque.tEnX.length !== 1 || !cerca(R.arranque.tEnX[0], 10)) mal('MRUA · arranque: debería llegar a 100 m en t = 10 s');
    if (!cerca(R.mru.xEnT, 70) || !cerca(R.mru.vEnT, 12)) mal('MRU: en t = 5 s debería estar en x = 70 m');
    if (R.vertical.tEnX.length !== 2 || !cerca(R.vertical.tEnX[1], 40 / g)) mal('MRUA · vertical: debería volver al suelo en t = 2 v0 / g');
    if (fallos === antes) console.log(`  ✓ Tiro parabólico: ${Cinematica.ejemplos.length} tiros con los resultados de las fórmulas, el blanco, el rozamiento y ${Cinematica.ejemplosRecta.length} movimientos rectilíneos`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'tiro-parabolico', 'index.html'));
      await page.waitForFunction(() => window.TiroApp);
      const antes = fallos;
      const verT = (await page.locator('#ver').textContent()).trim();
      if (verT !== Version.de('tiro-parabolico').current) mal(`Tiro parabólico: la página muestra la versión «${verT}», se esperaba ${Version.de('tiro-parabolico').current}`);
      for (const e of Cinematica.ejemplos) {
        await page.evaluate((c) => { TiroApp.abrirEjemplo(c); TiroApp.ir(TiroApp.fin() / 2); TiroApp.ir(TiroApp.fin()); }, e.clave);
        if ((await page.locator('#pasos li').count()) < 4 || !(await page.locator('#error').isHidden())) mal(`Tiro parabólico · ${e.clave}: no aparece el desarrollo`);
      }
      for (const q of ['pos', 'acel']) await page.selectOption('#que', q);
      await page.selectOption('#campos-modelo', 'cuadratico');
      if ((await page.locator('#pasos li').count()) < 4) mal('Tiro parabólico: al cambiar a rozamiento cuadrático no aparece el desarrollo');
      await page.fill('#campos-v0', 'abc');
      if (await page.locator('#error').isHidden()) mal('Tiro parabólico: una velocidad no numérica no muestra el error');
      for (const e of Cinematica.ejemplosRecta) {
        await page.evaluate((c) => TiroApp.abrirEjemploR(c), e.clave);
        if ((await page.locator('#pasos-r li').count()) < 1 || (await page.locator('#panel-recta').isHidden())) mal(`Movimiento rectilíneo · ${e.clave}: no aparece el desarrollo`);
      }
      await page.click('#play-r'); await page.waitForTimeout(200); await page.click('#play-r');
      await page.close();
      if (consola.length) mal('Tiro parabólico: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Tiro parabólico: ${Cinematica.ejemplos.length} tiros, ${Cinematica.ejemplosRecta.length} movimientos rectilíneos, gráficas y errores sin errores de consola`);
    }
  };
};
