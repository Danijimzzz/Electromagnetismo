/* Comprobación de alterna: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo alterna ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Alterna = require(path.join(fuente, 'alterna', 'fisica.js'));
  {
    // valores calculados a mano
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Alterna · ${q}: ${a} en vez de ${b}`); };
    const ej = (c) => Alterna.ejemplos.find((e) => e.clave === c).sc;
    const rl = Alterna.circuito(ej('rl'));
    cerca(Alterna.mod(rl.Zt), 50, 0.05, 'bobina real |Z|'); cerca(rl.fi * Alterna.GRAD, 53.13, 0.02, 'bobina real φ'); cerca(Alterna.mod(rl.I), 4.6, 0.01, 'bobina real I');
    cerca(rl.P, rl.R * Alterna.mod(rl.I) ** 2, 1e-6, 'P = I²R');
    const res = Alterna.circuito(ej('resonancia'));
    cerca(res.fp, 1, 1e-6, 'resonancia cos φ'); cerca(Alterna.mod(res.Zt), 10, 1e-4, 'resonancia Z = R'); cerca(res.res.f0, 159.1549, 1e-3, 'f0'); cerca(res.res.Q, 10, 1e-4, 'factor de calidad');
    const s = Alterna.circuito(ej('rlc-serie')), suma = s.partes.reduce((z, p) => Alterna.suma(z, p.V), Alterna.Z(0));
    cerca(suma.re, 230, 1e-9, 'suma fasorial de tensiones (real)'); cerca(suma.im, 0, 1e-9, 'suma fasorial de tensiones (imaginaria)');
    cerca(s.S ** 2, s.P ** 2 + s.Q ** 2, 1e-6, 'S² = P² + Q²');
    const par = Alterna.circuito(ej('paralelo'));
    cerca(Alterna.mod(par.Zt), 53.67, 0.01, 'paralelo |Z|'); cerca(par.fi * Alterna.GRAD, 26.57, 0.02, 'paralelo φ');
    const fp = Alterna.correccion(ej('fp'));
    cerca(fp.C * 1e6, 137.6, 0.05, 'condensador de corrección'); cerca(fp.I2, 26.316, 0.001, 'corriente corregida');
    for (const [sc, q] of [[{ V: '230', f: '50' }, 'sin elementos'], [{ V: '230', f: '50', R: '-5' }, 'R negativa'], [{ V: '', f: '50', R: '5' }, 'sin tensión'], [{ conexion: 'paralelo', V: '230', f: '50', R: '0' }, 'cortocircuito en paralelo']]) {
      let ok = false; try { Alterna.circuito(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Alterna: ${q} no da error`);
    }
    let ok = false; try { Alterna.correccion({ V: '400', f: '50', P: '10', fp1: '0.9', fp2: '0.8' }); } catch (e) { ok = true; }
    if (!ok) mal('Alterna: un cos φ deseado menor que el inicial no da error');
    if (!Alterna.circuito(ej('rc')).pasos[1].html.includes('R − jX<sub>C</sub>')) mal('Alterna: la impedancia RC no se escribe R − jX_C');
    // prefijos: con prefijo o unidad, SI; un número solo, en mH y μF. Y R = 0 en paralelo cortocircuita la fuente
    { const a = Alterna.circuito({ conexion: 'serie', V: '230', f: '50', R: '40', L: '200', C: '100' }), b = Alterna.circuito({ conexion: 'serie', V: '230', f: '50', R: '0,04k', L: '0,2H', C: '100µ' }); cerca(Alterna.mod(b.Zt), Alterna.mod(a.Zt), 1e-9, '|Z| con prefijos'); }
    { let ok = false; try { Alterna.circuito({ conexion: 'paralelo', V: '10', f: '50', R: '0', L: '100', C: '' }); } catch (e) { ok = /cortocircuita/.test(e.message); } if (!ok) mal('Alterna: R = 0 en paralelo no avisa del cortocircuito'); }
    // fuente con pico, fase y ω; redes por nudos; trifásica; corrección con S y carga capacitiva (calculados a mano)
    { const p = Alterna.circuito(ej('fuente-pico')); cerca(p.V, 325 / Math.SQRT2, 1e-9, 'valor eficaz desde el de pico'); cerca(p.fr, 314.16 / (2 * Math.PI), 1e-9, 'f desde ω'); cerca(Alterna.arg(p.I) * Alterna.GRAD, 30 - Math.atan2(314.16 * 0.05, 20) * Alterna.GRAD, 1e-6, 'fase de la corriente con la fase de la fuente'); if (!/sen\(314,2 t \+ 30°\)/.test(p.vt)) mal('Alterna: v(t) no lleva la fase de 30°'); }
    { const b = Alterna.barrido(Alterna.circuito(ej('resonancia'))), m = b.reduce((x, y) => (y.I > x.I ? y : x)); cerca(m.f, 159.1549, 2, 'la curva de resonancia tiene el máximo en f0'); cerca(m.I, 1, 1e-3, 'corriente máxima V/R'); }
    { const r = Alterna.red(ej('red-bobina-real')), w = 100 * Math.PI, zb = Math.hypot(10, w * 0.1); cerca(Alterna.mod(r.els[1].I), 230 / zb, 1e-9, 'red: corriente por la bobina real'); cerca(Alterna.mod(r.els[3].I), 230 * w * 50e-6, 1e-9, 'red: corriente por el condensador'); cerca(r.P, 10 * (230 / zb) ** 2, 1e-6, 'red: P = I²R'); if (!r.ok) mal('Alterna: el balance de potencias de la red no cuadra'); }
    { const r = Alterna.red(ej('red-dos-fuentes')); if (!r.ok) mal('Alterna: Boucherot no cuadra con dos fuentes'); const R1 = r.els[1]; cerca(R1.S.im, 0, 1e-9, 'red: una resistencia no tiene Q'); }
    { const t = Alterna.trifasica(ej('trifasica-estrella')); cerca(t.Vf, 400 / Math.sqrt(3), 1e-9, 'estrella V_fase'); cerca(t.IL, 400 / Math.sqrt(3) / 10, 1e-9, 'estrella I_L'); cerca(t.P, 12800, 1e-6, 'estrella P'); cerca(t.Q, 9600, 1e-6, 'estrella Q'); }
    { const t = Alterna.trifasica(ej('trifasica-triangulo')); cerca(t.If, 8, 1e-9, 'triángulo I_fase'); cerca(t.IL, 8 * Math.sqrt(3), 1e-9, 'triángulo I_L'); cerca(t.P, 5760, 1e-6, 'triángulo P'); cerca(t.corr.Cy, 3 * t.corr.Cd, 1e-12, 'condensadores en estrella = 3 veces los de triángulo'); cerca(t.corr.Qc, 5760 * (4 / 3 - Math.tan(Math.acos(0.95))), 1e-6, 'Q de la batería'); }
    { const c = Alterna.correccion(ej('fp-capacitiva')); cerca(c.P, 4000, 1e-9, 'P desde S'); cerca(c.L, 230 ** 2 / (100 * Math.PI * 4000 * (0.75 - Math.tan(Math.acos(0.95)))), 1e-9, 'bobina de corrección'); if (c.C !== null) mal('Alterna: una carga capacitiva no se corrige con condensador'); }
    { const c = Alterna.correccion({ V: '400', f: '50', dato: 'I', P: '20', fp1: '0.8', fp2: '0.95' }); cerca(c.P, 400 * 20 * 0.8, 1e-9, 'P desde la corriente'); }
    for (const [sc, q] of [[{ f: '50', elementos: [{ t: 'V', a: 'a', b: '0', v: '10' }, { t: 'R', a: 'x', b: 'y', v: '1' }] }, 'red partida'], [{ f: '50', elementos: [{ t: 'V', a: 'a', b: '0', v: '10' }, { t: 'V', a: 'a', b: '0', v: '5' }] }, 'dos fuentes en paralelo']]) { let ok = false; try { Alterna.red(sc); } catch (e) { ok = true; } if (!ok) mal(`Alterna: ${q} no da error`); }
    if (fallos === antes) console.log(`  ✓ Corriente alterna: ${Alterna.ejemplos.length} ejemplos, Z, φ, potencias, resonancia y corrección del factor de potencia`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'circuitos', 'alterna', 'index.html'));
      await page.waitForFunction(() => window.AlternaApp);
      const antes = fallos;
      const verA = (await page.locator('#ver').textContent()).trim();
      if (verA !== Version.de('alterna').current) mal(`Alterna: la página muestra la versión «${verA}», se esperaba ${Version.de('alterna').current}`);
      for (const e of Alterna.ejemplos) {
        await page.evaluate((c) => AlternaApp.abrirEjemplo(c), e.clave);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 3) mal(`Alterna · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => AlternaApp.abrirEjemplo('rl'));
      if (!(await page.locator('#res').textContent()).includes('53,13°')) mal('Alterna: la bobina real no da φ = 53,13° en la página');
      await page.selectOption('#f-conexion', 'paralelo');
      if (!(await page.locator('#error').isHidden()) || !(await page.locator('#pasos').textContent()).includes('Admitancia')) mal('Alterna: al pasar a paralelo no se calcula con admitancias');
      await page.fill('#f-V', 'abc');
      if (await page.locator('#error').isHidden()) mal('Alterna: una tensión no numérica no muestra el error');
      await page.selectOption('#f-modo', 'correccion');
      if ((await page.locator('#f-fp1').count()) !== 1) mal('Alterna: el modo de corrección no muestra cos φ inicial');
      await page.selectOption('#f-modo', 'red');
      if ((await page.locator('#lista input').count()) < 4 || !(await page.locator('#error').isHidden())) mal('Alterna: el modo red no muestra la lista de elementos o da error');
      const n0 = await page.locator('#lista input').count(); await page.click('[data-add="C"]');
      if ((await page.locator('#lista input').count()) !== n0 + 3) mal('Alterna: el botón de añadir C no añade una fila');
      await page.evaluate(() => AlternaApp.abrirEjemplo('trifasica-estrella'));
      if (!(await page.locator('#res').textContent()).includes('23,09 A') || (await page.locator('#graficas2').isHidden())) mal('Alterna: la trifásica en estrella no da I_L = 23,09 A o no dibuja el triángulo de potencias');
      await page.evaluate(() => AlternaApp.abrirEjemplo('rlc-serie'));
      if ((await page.locator('#curva').isHidden())) mal('Alterna: con L y C no sale la curva de resonancia');
      await page.close();
      if (consola.length) mal('Alterna: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Corriente alterna: ${Alterna.ejemplos.length} ejemplos, serie y paralelo, corrección y errores sin errores de consola`);
    }
  };
};
