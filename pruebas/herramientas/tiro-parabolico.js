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
    // encuentros: 20 t = 1,5 t² ⇒ t = 40/3 s; 20 t = 1000 − 30 t ⇒ t = 20 s, x = 400 m
    if (R.persecucion.encuentros.length !== 1 || !cerca(R.persecucion.encuentros[0].t, 40 / 3) || !cerca(R.persecucion.encuentros[0].x, 800 / 3)) mal('Encuentro · persecución: debería alcanzarlo en t = 13,3 s y x = 266,7 m');
    if (R.cruce.encuentros.length !== 1 || !cerca(R.cruce.encuentros[0].t, 20) || !cerca(R.cruce.encuentros[0].x, 400)) mal('Encuentro · trenes: deberían cruzarse en t = 20 s y x = 400 m');
    if (Cinematica.rectilineo({ x0: 0, v0: 10, a: 0, x0b: 50, v0b: 10 }).res.encuentros.length) mal('Encuentro: con la misma velocidad no deberían encontrarse');
    // movimiento circular
    const K = Object.fromEntries(Cinematica.ejemplosCirculo.map((e) => [e.clave, Cinematica.circular(e.sc).res]));
    if (!cerca(K.tiovivo.w0, Math.PI / 4) || !cerca(K.tiovivo.ac, (Math.PI / 4) ** 2 * 4)) mal('MCU · tiovivo: ω = π/4 rad/s y a = ω²R');
    if (!cerca(K.centrifugadora.w0, 40 * Math.PI) || !cerca(K.centrifugadora.frec, 20)) mal('MCU · centrifugadora: 1200 rpm = 40π rad/s = 20 Hz');
    if (!cerca(K.curva.ac, 8)) mal('MCU · curva: v²/R = 400/50 = 8 m/s²');
    if (!cerca(K.frena.tParada, 15) || !cerca(K.frena.thParada, 225) || !cerca(K.frena.wEnT, 20) || !cerca(K.frena.aEnT, Math.hypot(120, 0.6))) mal('MCUA · frena: para en 15 s tras 225 rad; a los 5 s ω = 20 rad/s');
    if (!cerca(K.arranca.tVueltas, Math.sqrt(10 * Math.PI))) mal('MCUA · arranca: 10 vueltas en √(10π) s');
    if (Cinematica.circular({ R: 1, dato: 'w', val: 10, alfa: -1, nv: 100 }).res.tVueltas !== null) mal('MCUA: si se para antes no debería dar 100 vueltas');
    for (const mala of [{ R: 0, dato: 'w', val: 1 }, { R: 1, dato: 'T', val: 0 }, { R: 1, dato: 'w', val: 0, alfa: 0 }]) {
      let ok = false; try { Cinematica.circular(mala); } catch (e) { ok = true; } if (!ok) mal(`Circular: ${JSON.stringify(mala)} debería dar un error`);
    }
    // alcance máximo: 45° al mismo nivel; desde un acantilado, tg α = v0/√(v0² + 2gh) y ningún otro ángulo llega más lejos
    const ac = Cinematica.ejemplos.find((e) => e.clave === 'acantilado').sc, ra = Cinematica.resolver(ac).res;
    if (!cerca(ra.angOpt, (Math.atan(25 / Math.sqrt(625 + 2 * g * 10)) * 180) / Math.PI) || !cerca(ra.Rmax, (25 * Math.sqrt(625 + 2 * g * 10)) / g)) mal(`Tiro · acantilado: alcance máximo ${ra.Rmax} a ${ra.angOpt}°`);
    for (const d of [-2, 2]) if (Cinematica.resolver({ ...ac, ang: ra.angOpt + d }).res.alcance > ra.Rmax) mal('Tiro · acantilado: otro ángulo llega más lejos que el óptimo');
    if (!cerca(Cinematica.resolver(Cinematica.ejemplos[0].sc).res.angOpt, 45)) mal('Tiro: al mismo nivel el ángulo de alcance máximo debería ser 45°');
    // v0 para el blanco con el ángulo dado: con esa velocidad acierta
    const v0n = Cinematica.resolver(bl.sc).res.blanco.v0nec;
    if (!(v0n > 0) || Math.abs(Cinematica.resolver({ ...bl.sc, v0: v0n }).res.blanco.dif) > 1e-6) mal(`Tiro · blanco: con v0 = ${v0n} m/s no acierta`);
    // familia: la parábola de seguridad toca la trayectoria de alcance máximo y ninguna pasa por encima
    const fam = Cinematica.trayectoria({ ...ac, familia: 'si' }), kE = g / (2 * 625), env = (x) => ac.y0 + 1 / (4 * kE) - kE * x * x;
    if (!fam.familia || fam.familia.length !== 6) mal('Tiro · familia: deberían salir 6 trayectorias');
    else for (const u of fam.familia) for (const q of u.puntos) if (q.y > env(q.x) + 1e-6) mal(`Tiro · familia: el tiro a ${u.ang}° pasa por encima de la parábola de seguridad`);
    if (fam.envolvente && !cerca(fam.envolvente[fam.envolvente.length - 1].x, ra.Rmax)) mal('Tiro · familia: la parábola de seguridad debería llegar al suelo en el alcance máximo');
    if (fallos === antes) console.log(`  ✓ Tiro parabólico: ${Cinematica.ejemplos.length} tiros con los resultados de las fórmulas, el blanco, el rozamiento, el alcance máximo y la parábola de seguridad`);
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
      for (const e of Cinematica.ejemplosCirculo) {
        await page.evaluate((c) => TiroApp.abrirEjemploC(c), e.clave);
        if ((await page.locator('#pasos-c li').count()) < 2 || (await page.locator('#panel-circ').isHidden()) || !(await page.locator('#error-c').isHidden())) mal(`Movimiento circular · ${e.clave}: no aparece el desarrollo`);
      }
      await page.click('#play-c'); await page.waitForTimeout(200); await page.click('#play-c');
      await page.evaluate(() => TiroApp.abrirEjemplo('acantilado'));
      await page.selectOption('#campos-familia', 'si');
      if (!(await page.locator('#leyenda').textContent()).includes('parábola de seguridad')) mal('Tiro parabólico: al pedir varios ángulos no se dibuja la parábola de seguridad');
      for (let i = 0; i < 12; i++) {
        await page.evaluate(() => TiroApp.azar());
        const tab = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').id.slice(4));
        const err = await page.locator(tab === 'tiro' ? '#error' : tab === 'recta' ? '#error-r' : '#error-c').isHidden();
        const en = await page.evaluate(() => TiroApp.enunciado());
        if (!err || !en || /undefined|NaN/.test(en)) mal(`Tiro parabólico · práctica (${tab}): ejercicio al azar sin resolver o sin enunciado: ${en}`);
      }
      await page.close();
      if (consola.length) mal('Tiro parabólico: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Tiro parabólico: ${Cinematica.ejemplos.length} tiros, ${Cinematica.ejemplosRecta.length} movimientos rectilíneos, gráficas y errores sin errores de consola`);
    }
  };
};
