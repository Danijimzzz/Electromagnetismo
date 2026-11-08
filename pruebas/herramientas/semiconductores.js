/* Comprobación de semiconductores: cálculos en Node y la página en Chromium. Prueba de semiconductores.
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo semiconductores ejecuta solo esta).
   Los valores de los ejemplos están calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'semiconductores', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Semiconductores · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano
    const q = (c) => r(c).Q;
    cerca(q('bjt-fija').y, 0.0024042553, 1e-9, 'IC de la polarización fija');   // IB = 11,3 V / 470 kΩ = 24,04 µA; IC = 100·IB
    cerca(q('bjt-fija').x, 6.7106383, 1e-6, 'VCE de la polarización fija');      // 12 − 2,404 mA · 2,2 kΩ
    cerca(q('bjt-divisor').y, 0.0013236752, 1e-9, 'IC del divisor');            // VBB = 2,105 V; RBB = 8,246 kΩ
    cerca(q('bjt-divisor').x, 6.2993720, 1e-6, 'VCE del divisor');
    cerca(q('bjt-saturacion').x, 0.2, 1e-12, 'VCE en saturación');
    cerca(q('bjt-saturacion').y, 5.3636364e-3, 1e-9, 'IC en saturación');       // (12 − 0,2)/2,2 kΩ
    cerca(q('mosfet-saturacion').y, 1e-3, 1e-12, 'ID del MOSFET en saturación'); // VGS − Vt = 1 V; ½·2 mA/V²·1²
    cerca(q('mosfet-saturacion').x, 6.3, 1e-9, 'VDS del MOSFET en saturación');
    cerca(q('mosfet-triodo').x, (81 - Math.sqrt(81 * 81 - 480)) / 20, 1e-9, 'VDS del MOSFET en triodo'); // 10V² − 81V + 12 = 0
    // el punto Q cumple la ecuación del diodo y la recta de carga
    for (const c of ['diodo-5v', 'led-3v3']) { const d = r(c), e = d.sc; cerca(C.shockley(d.sc.Is.includes('A') ? 1e-18 : 1e-11, +d.sc.n, d.Vd), d.Id, 1e-9, `Shockley en ${c}`); }
    cerca(r('diodo-5v').Vd, 0.5149689, 1e-6, 'VD del diodo de 5 V');
    for (const [c, reg] of [['bjt-fija', 'activa'], ['bjt-saturacion', 'saturación'], ['mosfet-saturacion', 'saturación'], ['mosfet-triodo', 'triodo (óhmica)']]) if (r(c).region !== reg) mal(`Semiconductores · ${c}: región «${r(c).region}» en vez de «${reg}»`);
    { const corte = C.resolver({ modo: 'bjt', conf: 'fija', Vcc: '12', RB: '10M', RC: '1k', RE: '0', beta: '100', VBE: '13', VCEsat: '0,2' }); if (corte.region !== 'corte' || corte.IC !== 0) mal('Semiconductores: VBB < VBE no da corte'); }
    for (const [sc, q] of [[{ modo: 'diodo', Vs: '', R: '1k', Is: '10', n: '1' }, 'falta la tensión'], [{ modo: 'diodo', Vs: '5', R: '0', Is: '10', n: '1' }, 'resistencia cero'], [{ modo: 'bjt', conf: 'fija', Vcc: '12', RB: '1k', RC: '1k', RE: '0', beta: '1', VBE: '0,7', VCEsat: '0,2' }, 'β demasiado baja']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Semiconductores: ${q} no da error`);
    }
    // SE-6: extremos de las tres pestañas (probados a mano)
    {
      const cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Semiconductores · ${q}: ${a} en vez de ${b}`); };
      const err = (sc, re, q) => { let m = ''; try { C.resolver(sc); } catch (e) { m = e.message; } if (!re.test(m)) mal(`Semiconductores · ${q}: mensaje «${m}», se esperaba ${re}`); };
      // R enorme: no pasa corriente; la tensión del diodo es la de la fuente
      { const d = C.resolver({ modo: 'diodo', Vs: '5', R: '1e12', Is: '10', n: '1' }); cerca(d.Id, 0, 1e-9, 'diodo con R = 10¹² Ω: corriente ≈ 0'); if (!(d.Vd > 0 && d.Vd < 0.1)) mal(`Semiconductores · R enorme: Vd = ${d.Vd} (con tan poca corriente el diodo apenas tiene tensión)`); }
      // Vs negativa: polarización inversa, sin corriente
      { const d = C.resolver({ modo: 'diodo', Vs: '-5', R: '1k', Is: '10', n: '1' }); if (!/inversa/.test(d.region) || Math.abs(d.Id + 10e-12) > 1e-12) mal(`Semiconductores · Vs < 0: región «${d.region}» e Id = ${d.Id}`); }
      // Is sin unidad se entiende en pA (la ayuda lo dice); con unidad, la que sea
      cerca(C.resolver({ modo: 'diodo', Vs: '5', R: '1k', Is: '10', n: '1' }).Vd, C.resolver({ modo: 'diodo', Vs: '5', R: '1k', Is: '10p', n: '1' }).Vd, 1e-9, 'Is = 10 y 10p son lo mismo (pA)');
      cerca(C.resolver({ modo: 'diodo', Vs: '5', R: '1k', Is: '1e-11A', n: '1' }).Vd, C.resolver({ modo: 'diodo', Vs: '5', R: '1k', Is: '10', n: '1' }).Vd, 1e-9, 'Is = 1e-11 A es 10 pA');
      err({ modo: 'diodo', Vs: '5', R: '1k', Is: '10', n: '5' }, /entre 1 y 2/, 'n fuera de rango');
      err({ modo: 'diodo', Vs: '5', R: '0', Is: '10', n: '1' }, /mayor que 0/, 'R cero');
      err({ modo: 'diodo', Vs: '5', R: '1k', Is: '0', n: '1' }, /mayor que 0/, 'Is cero');
      err({ modo: 'diodo', Vs: 'abc', R: '1k', Is: '10', n: '1' }, /número/, 'Vs no numérica');
      // BJT: Vcc menor que VBE → corte; β = 1 → error; R enorme → corte
      { const b = C.resolver({ modo: 'bjt', conf: 'fija', Vcc: '0,5', RB: '470k', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' }); if (b.region !== 'corte' || b.IC !== 0) mal('Semiconductores · BJT con Vcc < VBE: debía estar en corte'); cerca(b.VCE, 0.5, 1e-12, 'BJT en corte: VCE = Vcc'); }
      { const b = C.resolver({ modo: 'bjt', conf: 'fija', Vcc: '12', RB: '1e12', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' }); if (b.region !== 'corte' && b.IC > 1e-6) mal('Semiconductores · BJT con RB enorme: IC debería ser casi 0'); }
      err({ modo: 'bjt', conf: 'fija', Vcc: '12', RB: '470k', RC: '2k2', RE: '0', beta: '1', VBE: '0,7', VCEsat: '0,2' }, /al menos 5/, 'β = 1');
      err({ modo: 'bjt', conf: 'fija', Vcc: '12', RB: '', RC: '2k2', RE: '0', beta: '100', VBE: '0,7', VCEsat: '0,2' }, /Falta la resistencia de base/, 'falta RB');
      err({ modo: 'bjt', conf: 'fija', Vcc: '12', RB: '470k', RC: '2k2', RE: '-1', beta: '100', VBE: '0,7', VCEsat: '0,2' }, /negativa/, 'RE negativa');
      // MOSFET: Vgg menor que Vt → corte
      { const m = C.resolver({ modo: 'mosfet', Vdd: '12', R1: '10M', R2: '1M', RD: '4k7', RS: '1k', K: '2', Vt: '2' }); if (m.region !== 'corte' || m.ID !== 0) mal('Semiconductores · MOSFET con VGG < Vt: debía estar en corte'); }
      err({ modo: 'mosfet', Vdd: '12', R1: '2M', R2: '1M', RD: '4k7', RS: '1k', K: '0', Vt: '2' }, /mayor que 0/, 'K cero');
    }
    // SE-1: pnp y canal p son el espejo del npn y del canal n (se intercambian R1 y R2)
    {
      const cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Semiconductores · ${q}: ${a} en vez de ${b}`); };
      const n = { modo: 'bjt', conf: 'divisor', Vcc: '12', R1: '47k', R2: '10k', RC: '3k3', RE: '1k', beta: '150', VBE: '0,7', VCEsat: '0,2' }, p = { ...n, pol: 'p', R1: '10k', R2: '47k' };
      const a = C.resolver(n), b = C.resolver(p);
      cerca(b.IC, a.IC, 1e-12, 'pnp: IC igual que el npn espejo'); cerca(b.VEC, a.VCE, 1e-12, 'pnp: VEC = VCE del npn'); if (b.region !== a.region) mal('Semiconductores · pnp: la región no coincide con la del espejo');
      if (!b.pasos.some((q) => /Transistor pnp/.test(q.t)) || !b.pasos.some((q) => /V_"EC"/.test(q.html)) || b.graf.xl !== 'V_EC') mal('Semiconductores · pnp: etiquetas V_EC y explicación');
      const m = { modo: 'mosfet', Vdd: '12', R1: '2M', R2: '1M', RD: '4k7', RS: '1k', K: '2', Vt: '2' }, mp = { ...m, pol: 'p', R1: '1M', R2: '2M' };
      cerca(C.resolver(mp).ID, C.resolver(m).ID, 1e-12, 'canal p: ID igual que el canal n espejo'); cerca(C.resolver(mp).VSD, C.resolver(m).VDS, 1e-12, 'canal p: VSD');
      // a mano: VGG = 4 V, VGS − Vt = u con u + (K RS/2)·u² ... ID = ½·K·u² y VGS = 4 − ID·RS → u = 2,0 → ID = 1 mA, VDS = 12 − 5,7 = 6,3 V
      cerca(C.resolver(m).ID, 1e-3, 1e-9, 'canal n a mano: ID = 1 mA'); cerca(C.resolver(m).VDS, 6.3, 1e-9, 'canal n a mano: VDS = 6,3 V');
    }
    // SE-2: pequeña señal a mano
    {
      const cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Semiconductores · ${q}: ${a} en vez de ${b}`); };
      const b = C.resolver(C.ejemplos.find((e) => e.clave === 'bjt-senal').sc), a = b.ac, VT = C.VT;
      cerca(a.gm, b.IC / VT, 1e-12, 'gm = IC/VT'); cerca(a.rpi, 150 / a.gm, 1e-12, 'rπ = β/gm'); cerca(a.ro, (100 + b.VCE) / b.IC, 1e-12, 'ro = (VA + VCE)/IC');
      const rc = 1 / (1 / 3300 + 1 / 10000 + 1 / a.ro); cerca(a.rc, rc, 1e-12, 'carga de alterna rc = RC ∥ RL ∥ ro'); cerca(a.AvP, -a.gm * rc, 1e-12, 'Av con RE puenteada = −gm·rc');
      cerca(a.AvS, -(150 * (3300 * 10000 / 13300)) / (a.rpi + 151 * 1000), 1e-12, 'Av sin puentear');
      cerca(a.RinP, 1 / (1 / (47e3 * 10e3 / 57e3) + 1 / a.rpi), 1e-12, 'Rin puenteada = RBB ∥ rπ');
      cerca(b.graf.rectaAC[1][0], b.VCE + b.IC * rc, 1e-12, 'recta de alterna: corte en VCE + IC·rc'); cerca(b.graf.rectaAC[0][1], b.IC + b.VCE / rc, 1e-12, 'recta de alterna: IC + VCE/rc');
      const m = C.resolver(C.ejemplos.find((e) => e.clave === 'mosfet-saturacion').sc).ac;   // ID = 1 mA, Vov = 2 V → gm = 2·ID/Vov = 1 mS... K·Vov = 2m·1 = 2 mS con Vov = 1
      cerca(m.gm, 2e-3, 1e-9, 'MOSFET: gm = K·(VGS − Vt) = 2 mS'); cerca(m.AvP, -2e-3 * 4700, 1e-9, 'MOSFET: Av = −gm·RD'); cerca(m.Rin, 2e6 * 1e6 / 3e6, 1e-9, 'MOSFET: Rin = R1 ∥ R2');
      const c = C.resolver(C.ejemplos.find((e) => e.clave === 'bjt-saturacion').sc); if (c.ac !== null || !c.pasos.some((q) => /solo vale en la región activa/.test(q.html))) mal('Semiconductores · pequeña señal en saturación: debía decir que no aplica');
    }
    // SE-3: la estabilidad con β y con la temperatura (a mano: el divisor con RE casi no cambia; la polarización fija sí)
    {
      const rango = (sc) => { const q = C.resolver(sc), tb = q.pasos.find((p) => /Estabilidad del punto Q con β/.test(p.t)); return tb ? /cambia un ([\d,]+) %/.exec(tb.html.replace(/<[^>]+>/g, '')) : null; };
      const fija = rango(C.ejemplos.find((e) => e.clave === 'bjt-fija').sc), div = rango(C.ejemplos.find((e) => e.clave === 'bjt-divisor').sc);
      if (!fija || !div || !(parseFloat(fija[1].replace(',', '.')) > 5 * parseFloat(div[1].replace(',', '.')))) mal(`Semiconductores · estabilidad: fija ${fija && fija[1]} % frente a divisor ${div && div[1]} %: el divisor debía ser mucho más estable`);
      const b = C.resolver(C.ejemplos.find((e) => e.clave === 'bjt-divisor').sc), n0 = C.nucleoBJT({ VBB: 12 * 10 / 57, RBB: 47 * 10 / 57 * 1000, Vcc: 12, RC: 3300, RE: 1000, beta: 150, VBE: 0.7, VCEsat: 0.2 });
      if (Math.abs(n0.IC - b.IC) > 1e-12) mal('Semiconductores · nucleoBJT no da el mismo Q que resolver');
      const tT = b.pasos.find((p) => /con la temperatura/.test(p.t)); if (!tT || !/<table/.test(tT.html) || (tT.html.match(/<tr>/g) || []).length < 7) mal('Semiconductores · falta la tabla de temperatura');
    }
    // SE-4: Zener y resistencia dinámica del diodo
    {
      const cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Semiconductores · ${q}: ${a} en vez de ${b}`); };
      const z = C.resolver(C.ejemplos.find((e) => e.clave === 'zener-5v1').sc);   // Vth = 12·1000/1470, Rth = 470·1000/1470
      const Vth = 12 * 1000 / 1470, Rth = 470 * 1000 / 1470, Iz = (Vth - 5.1) / (Rth + 10);
      cerca(z.Iz, Iz, 1e-12, 'Zener: IZ'); cerca(z.Vo, 5.1 + 10 * Iz, 1e-12, 'Zener: Vo = Vz + rz·IZ'); cerca(z.IR, z.IL + z.Iz, 1e-12, 'Zener: IR = IL + IZ');
      cerca(z.regLinea, (10 / (Rth + 10)) * (1000 / 1470), 1e-12, 'Zener: regulación de línea'); cerca(z.Rout, 470 * 10 / 480, 1e-12, 'Zener: Rout = R ∥ rz'); cerca(z.Vsmin, 5.1 * 1470 / 1000, 1e-12, 'Zener: entrada mínima');
      // la variación real de Vo al cambiar Vs coincide con la regulación de línea
      const z2 = C.resolver({ modo: 'zener', Vs: '13', R: '470', RL: '1k', Vz: '5,1', rz: '10' }); cerca((z2.Vo - z.Vo) / 1, z.regLinea, 1e-9, 'Zener: ΔVo/ΔVs medido');
      // y la de carga: más corriente de carga → baja Vo en Rout·ΔIL
      const nr = C.resolver({ modo: 'zener', Vs: '3', R: '470', RL: '1k', Vz: '5,1', rz: '10' }); if (nr.reg || Math.abs(nr.Vo - 3 * 1000 / 1470) > 1e-9 || nr.Iz !== 0) mal('Semiconductores · Zener sin ruptura: Vo debía seguir a la entrada');
      const id = C.resolver({ modo: 'zener', Vs: '12', R: '470', RL: '1k', Vz: '5,1' }); cerca(id.Vo, 5.1, 1e-12, 'Zener ideal (rz = 0): Vo = Vz'); cerca(id.regLinea, 0, 1e-12, 'Zener ideal: regulación de línea nula');
      for (const [sc, q] of [[{ modo: 'zener', Vs: '-5', R: '470', RL: '1k', Vz: '5,1' }, 'Vs negativa'], [{ modo: 'zener', Vs: '12', R: '470', RL: '', Vz: '5,1' }, 'falta la carga'], [{ modo: 'zener', Vs: '12', R: '470', RL: '1k', Vz: '0' }, 'Vz cero']]) { let ok = false; try { C.resolver(sc); } catch (e) { ok = true; } if (!ok) mal(`Semiconductores · Zener: ${q} no da error`); }
      const d = C.resolver(C.ejemplos[0].sc); cerca(d.rd, C.VT / d.Id, 1e-12, 'diodo: rd = n·VT/ID');
    }
    if (fallos === antes) console.log(`  ✓ Semiconductores: ${C.ejemplos.length} ejemplos, extremos, pnp/canal p, pequeña señal, estabilidad y Zener a mano`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'circuitos', 'semiconductores', 'index.html'));
    await page.waitForFunction(() => window.SemiconductoresApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('semiconductores').current) mal(`Semiconductores: la página muestra la versión «${ver}», se esperaba ${Version.de('semiconductores').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => SemiconductoresApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Semiconductores · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Semiconductores · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.evaluate(() => SemiconductoresApp.abrirEjemplo('diodo-5v'));
    await page.fill('#f-R', '0');
    if (await page.locator('#error').isHidden()) mal('Semiconductores: una resistencia cero no muestra el error');
    { const Exp = require('./comun/exportar-grafica.js'); Exp.csv(mal);
      for (const c of ['diodo-5v', 'bjt-senal', 'zener-5v1']) { await page.evaluate((k) => SemiconductoresApp.abrirEjemplo(k), c); await Exp.pagina(page, '#grafica', mal, 'Semiconductores · ' + c); }
      await page.evaluate(() => SemiconductoresApp.abrirEjemplo('bjt-divisor')); await page.selectOption('#f-pol', 'p');
      { const t = await page.locator('#pasos').textContent(); if (!/pnp/.test(t)) mal('Semiconductores: al elegir pnp el desarrollo no lo explica'); }
    }
    await page.close();
    if (consola.length) mal('Semiconductores: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Semiconductores: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
