/* Comprobación de ondas-em: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo ondas-em ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const OeC = require(path.join(fuente, 'ondas-em', 'fisica.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Ondas EM · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => OeC.resolver(OeC.ejemplos.find((e) => e.clave === c).sc), c0 = 299792458;
    for (const x of OeC.ejemplos) { try { const s = OeC.resolver(x.sc); if (s.pasos.length < 2) mal(`Ondas EM · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Ondas EM · ${x.clave}: ${err.message}`); } }
    const fm = r('fm'); cerca(fm.F.lam, c0 / 1e8, 1e-9, 'λ de la FM'); cerca(fm.B0, 0.05 / c0, 1e-9, 'B₀ = E₀/c'); cerca(fm.I, 0.05 ** 2 / (2 * 376.730313), 1e-6, 'intensidad');
    if (fm.Bv.join() !== '0,1,0') mal('Ondas EM: con k̂ = +z y Ê = +x, B̂ no sale +y');
    const ex = r('expresion'); if (ex.Bv.join() !== '-1,0,0') mal('Ondas EM: con k̂ = −y y Ê = +z, B̂ no sale −x'); if (!ex.Eexp.includes('+')) mal('Ondas EM: hacia −y la fase no es ky + ωt');
    const ag = r('agua'); cerca(ag.M.n, Math.sqrt(1.77), 1e-12, 'índice del agua'); cerca(ag.F.lam, c0 / Math.sqrt(1.77) / 5e14, 1e-9, 'λ en el agua');
    if (!OeC.banda(5e14).includes('visible') || OeC.banda(1e8) !== 'ondas de radio' || OeC.banda(1e18) !== 'rayos X') mal('Ondas EM: la zona del espectro no cuadra');
    cerca(r('bombilla').I, 100 / (4 * Math.PI * 4), 1e-12, 'I de una fuente puntual'); cerca(r('sol').E0, Math.sqrt(2 * 376.730313 * 1361), 1e-6, 'E₀ del Sol');
    const cu = r('cobre'); cerca(cu.delta, 1 / Math.sqrt(Math.PI * 1e6 * 1.25663706212e-6 * 5.8e7), 1e-6, 'profundidad de penetración del cobre'); cerca(cu.th, Math.PI / 4, 1e-6, 'fase de η en un buen conductor');
    const ba = r('baquelita'); cerca(ba.alfa, (1e-6 / 2) * Math.sqrt(1.25663706212e-6 / (4.9 * 8.8541878128e-12)), 1e-3, 'α con pocas pérdidas');
    const dg = r('diagonal'), k3 = (2 * Math.PI * 3e9) / c0; cerca(dg.F.k, k3, 1e-9, 'k en diagonal'); if (!dg.Eexp.includes(OeC.f(k3 / Math.SQRT2) + 'x + ' + OeC.f(k3 / Math.SQRT2) + 'y') || !dg.Eexp.includes('+ 1,047')) mal(`Ondas EM: la fase de la onda en diagonal no sale: ${dg.Eexp}`);
    if (Math.abs(dg.Bv[0] - Math.SQRT1_2) > 1e-12 || Math.abs(dg.Bv[1] + Math.SQRT1_2) > 1e-12) mal('Ondas EM: B̂ de la onda en diagonal no es (î − ĵ)/√2');
    cerca(r('circular').I, (2 * 400) / (2 * 376.730313), 1e-6, 'intensidad con polarización circular'); cerca(r('eliptica').I, (900 + 225) / (2 * 376.730313), 1e-6, 'intensidad con polarización elíptica');
    if (!r('circular').pasos.some((p) => /antihorario/.test(p.html)) || !r('eliptica').pasos.some((p) => /elipse/.test(p.html) && /horario/.test(p.html))) mal('Ondas EM: la polarización no dice la forma o el sentido de giro');
    if (r('fm').pasos.some((p) => /\(k̂\)|\(î\)/.test(p.html))) mal('Ondas EM: siguen saliendo paréntesis alrededor de k̂ o î');
    const xe = r('expr-E'); if (xe.Bv.join() !== '-1,0,0' || xe.K.v.join() !== '0,-1,0' || xe.M.vacioM !== true) mal('Ondas EM: la expresión de E no da la dirección o el medio'); cerca(xe.F.w, 6.283e8, 1e-9, 'ω leída');
    const xb = r('expr-B'); cerca(xb.M.n, 299792458 / 2e8, 1e-6, 'índice desde la expresión de B'); cerca(xb.E0, 2e-7 * 2e8, 1e-6, 'E₀ = v B₀'); if (xb.Ed.v.join() !== '1,0,0') mal('Ondas EM: desde B según ĵ y k̂ = +z, E no sale según î');
    const L = OeC.leeExpresion('E = 5 sin(3x - 9e8 t + π/4) (0, 1, 1)'); if (L.func !== 'sen' || L.c.x !== 3 || L.c.t !== -9e8 || Math.abs(L.c[''] - Math.PI / 4) > 1e-12 || L.dv.join() !== '0,1,1') mal(`Ondas EM: no lee bien la expresión: ${JSON.stringify(L)}`);
    const co = r('conductor'); if (co.r !== -1 || co.R !== 1) mal('Ondas EM: un conductor perfecto no refleja todo'); cerca(co.K, (2 * 50) / (299792458 * 1.25663706212e-6), 1e-6, 'corriente superficial');
    const vi = r('vidrio'); cerca(vi.r, -0.2, 1e-9, 'r aire-vidrio'); cerca(vi.R + vi.T, 1, 1e-12, 'R + T'); cerca(vi.R, 0.04, 1e-9, 'R aire-vidrio');
    cerca(r('malus').I, 100 * Math.cos(Math.PI / 6) ** 2, 1e-9, 'Malus a 30°'); cerca(r('tres-polarizadores').frac, 1 / 8, 1e-9, 'natural por 0°, 45°, 90° = I₀/8'); if (r('cruzados').I !== 0) mal('Ondas EM: dos polarizadores cruzados dejan pasar luz');
    { const h = r('poy-hilo'), R = 2 / (5.8e7 * Math.PI * 1e-6); cerca(h.R, R, 1e-9, 'R del hilo'); cerca(h.flujo, 100 * R, 1e-9, 'flujo de S = I²R'); cerca(h.S, 87.3458, 1e-5, 'S del hilo');
      const c = r('poy-condensador'); cerca(c.flujo, 50, 1e-9, 'flujo de S en el condensador = V·I'); const k = r('poy-coaxial'); cerca(k.P, 100, 1e-12, 'P = V I en el coaxial'); cerca(k.S, (50 * 2) / (2 * Math.PI * 1e-6 * Math.log(3.5)), 1e-9, 'S del coaxial en r = a'); }
    for (const [q, sc] of [['polarizadores sin ángulos', { modo: 'polarizadores', luz: 'natural', I0: '10', angulos: '' }], ['un coaxial con b < a', { modo: 'poynting', sis: 'coaxial', a: '2', b: '1', V: '1', I: '1' }], ['una expresión más rápida que la luz', { modo: 'expresion', campo: 'E', expr: '1 cos(z - 1e9t) i' }], ['una expresión sin t', { modo: 'expresion', campo: 'E', expr: '1 cos(2z) i' }], ['E no perpendicular en la expresión', { modo: 'expresion', campo: 'E', expr: '1 cos(2z - 6e8t) k' }], ['E en otra dirección no perpendicular', { modo: 'onda', dato: 'f', valor: '1e6', E0: '1', prop: 'otra', kx: '1', ky: '1', kz: '0', pol: '+x' }], ['E paralelo a k', { modo: 'onda', dato: 'f', valor: '1e6', E0: '1', prop: '+z', pol: '-z' }], ['frecuencia negativa', { modo: 'onda', dato: 'f', valor: '-5', E0: '1', prop: '+z', pol: '+x' }], ['E₀ vacía', { modo: 'onda', dato: 'f', valor: '1e6', E0: '', prop: '+z', pol: '+x' }], ['σ que no es un número', { modo: 'perdidas', er: '1', sigma: 'abc', valor: '1e6' }]]) {
      let ok = false; try { OeC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Ondas EM: ${q} no da error`);
    }
    // OE-1: plasma e ionosfera
    { const QE = 1.602176634e-19, ME = 9.1093837015e-31, E0 = 8.8541878128e-12, io = r('plasma-iono'), ob = r('plasma-obl'), me = r('plasma-metal');
      cerca(io.wp, Math.sqrt((1e12 * QE * QE) / (E0 * ME)), 1e-6, 'ω_p de la ionosfera'); cerca(io.fp, 8.98 * Math.sqrt(1e12), 2e-3, 'f_p ≈ 8,98 √n_e'); cerca(io.fcrit, io.fp, 1e-12, 'f crítica vertical');
      if (io.propaga || io.reflejada === false) mal('Ondas EM: 5 MHz con n_e = 10¹² m⁻³ está por debajo de f_p = 9 MHz y debería reflejarse sin propagarse'); cerca(io.delta, 1 / ((io.wp / c0) * Math.sqrt(1 - (2 * Math.PI * 5e6 / io.wp) ** 2)), 1e-9, 'profundidad de penetración evanescente');
      cerca(ob.n, Math.sqrt(1 - (io.fp / 15e6) ** 2), 1e-6, 'n(ω) del plasma'); cerca(ob.vf * ob.vg, c0 * c0, 1e-12, 'v_f · v_g = c²'); if (!(ob.vf > c0 && ob.vg < c0)) mal('Ondas EM: en un plasma v_f > c y v_g < c'); cerca(ob.k, Math.sqrt((2 * Math.PI * 15e6) ** 2 - ob.wp ** 2) / c0, 1e-9, 'k de la relación de dispersión');
      cerca(ob.fcrit, ob.fp / Math.cos(Math.PI / 3), 1e-12, 'ley de la secante a 60°'); if (!ob.reflejada) mal('Ondas EM: 15 MHz a 60° (f máx 17,96 MHz) debería reflejarse'); if (OeC.resolver({ modo: 'plasma', ne: '1e12', valor: '20e6', ang: '60' }).reflejada) mal('Ondas EM: 20 MHz a 60° no debería reflejarse');
      cerca(me.fp, 8.98 * Math.sqrt(2.5e28), 2e-3, 'f_p del sodio'); if (!me.propaga) mal('Ondas EM: 2·10¹⁵ Hz supera f_p del sodio y debería propagarse');
      for (const mala of [{ ne: '0' }, { ne: '' }, { ang: '90' }, { valor: '-1' }]) { let ok = false; try { OeC.resolver({ modo: 'plasma', ne: '1e12', valor: '5e6', ang: '', ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Ondas EM: plasma ${JSON.stringify(mala)} debería dar error`); } }
    // OE-2: suma de dos ondas
    { const b = r('suma-batido'), est = r('suma-estacionaria'), ci = r('suma-circular'), el = r('suma-eliptica');
      cerca(b.df, 10, 1e-12, 'frecuencia de batido'); cerca(b.fm, 105, 1e-12, 'frecuencia media'); cerca(b.Emax, 2, 1e-12, 'amplitud máxima'); cerca(b.env(0), 2, 1e-12, 'envolvente a t = 0'); cerca(b.env(0.05) + 1, 1, 1e-9, 'la envolvente se anula medio batido después'); cerca(b.E(0.1), b.E(0), 1e-9, 'E se repite cada T_b con f1, f2 enteras');
      cerca(est.ROE, 14 / 6, 1e-12, 'ROE = (A₁ + A₂)/(A₁ − A₂)'); cerca(est.lam, c0 / 1e9, 1e-12, 'λ de la estacionaria'); cerca(est.env(0), 6, 1e-12, 'nodo con δ = 180° en z = 0'); cerca(est.env(est.lam / 4), 14, 1e-12, 'vientre a λ/4'); cerca(est.Pr, 0.16, 1e-12, 'potencia reflejada (A₂/A₁)²');
      cerca(ci.estado.b / ci.estado.a, 1, 1e-9, 'δ = 90° con A iguales es circular'); if (ci.estado.tipo !== 'circular' || ci.estado.giro !== 'antihorario') mal('Ondas EM: A₁ = A₂ y δ = +90° debería ser circular antihoraria');
      cerca(el.estado.a ** 2 + el.estado.b ** 2, 136, 1e-9, 'a² + b² = A₁² + A₂²'); cerca(el.estado.a * el.estado.b, 60 * Math.sin(Math.PI / 3), 1e-9, 'a·b = A₁ A₂ |sen δ|'); if (el.estado.tipo !== 'elíptica') mal('Ondas EM: 10, 6 y 60° debería ser elíptica');
      if (OeC.resolver({ modo: 'suma', caso: 'polarizacion', A1: '3', A2: '4', delta: '180' }).estado.tipo !== 'lineal') mal('Ondas EM: δ = 180° debería dar polarización lineal');
      cerca(OeC.resolver({ modo: 'suma', caso: 'estacionaria', A1: '5', A2: '5', f1: '1e8', delta: '180' }).Emin + 1, 1, 1e-9, 'nodos nulos con A₁ = A₂'); if (OeC.resolver({ modo: 'suma', caso: 'estacionaria', A1: '5', A2: '5', f1: '1e8', delta: '180' }).ROE !== Infinity) mal('Ondas EM: ROE debería ser infinita con A₁ = A₂');
      for (const mala of [{ A1: '0', A2: '0' }, { A1: '', A2: '1' }, { caso: 'batido', f1: '', f2: '5' }, { delta: 'x' }]) { let ok = false; try { OeC.resolver({ modo: 'suma', caso: 'batido', A1: '1', A2: '1', f1: '100', f2: '110', delta: '', ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Ondas EM: suma ${JSON.stringify(mala)} debería dar error`); } }
    // OE-3: láminas de retardo con el cálculo de Jones
    { const J = (luz, alfa, els) => OeC.resolver({ modo: 'retardo', luz, alfa: String(alfa), ...Object.fromEntries(els.flatMap(([t, a], i) => [['e' + (i + 1), t], ['a' + (i + 1), String(a)]])) });
      const l4 = J('lineal', 0, [['l4', 45]]); if (l4.estado.tipo !== 'circular') mal('Ondas EM: λ/4 a 45° de luz lineal debería dar luz circular'); cerca(l4.I, 1, 1e-12, 'la lámina no absorbe');
      const l2 = J('lineal', 20, [['l2', 50]]); cerca(l2.estado.psi, 80, 1e-9, 'λ/2 gira la polarización 2θ − α'); if (l2.estado.tipo !== 'lineal') mal('Ondas EM: λ/2 mantiene la polarización lineal');
      cerca(J('lineal', 0, [['pol', 0], ['l2', 45], ['pol', 90]]).I, 1, 1e-12, 'P0 + λ/2 a 45° + P90 deja pasar todo'); cerca(J('lineal', 0, [['pol', 0], ['pol', 90]]).I + 1, 1, 1e-12, 'polarizadores cruzados');
      const dos = J('lineal', 0, [['l4', 30], ['l4', 30]]); cerca(dos.estado.psi, 60, 1e-9, 'dos λ/4 iguales = λ/2'); const un = J('lineal', 0, [['l2', 30]]); cerca(dos.etapas[2].J[0][0], un.etapas[1].J[0][0], 1e-9, 'λ/4 + λ/4 = λ/2 (componente x)');
      const ci = J('circI', 0, [['l4', 0], ['pol', 135]]); cerca(ci.I, 1, 1e-12, 'luz circular por λ/4 y analizador a 135°'); cerca(J('circI', 0, [['l4', 0], ['pol', 45]]).I + 1, 1, 1e-12, 'analizador cruzado a 45°'); cerca(J('circI', 0, [['pol', 17]]).I, 0.5, 1e-12, 'la luz circular pierde la mitad en un polarizador');
      if (J('circI', 0, [['l4', 0]]).estado.tipo !== 'lineal') mal('Ondas EM: circular + λ/4 debería dar lineal'); if (J('circI', 0, [['l2', 0]]).estado.giro !== 'horario') mal('Ondas EM: λ/2 invierte el sentido de giro de la luz circular');
      for (const mala of [{ e1: '', e2: '', e3: '', e4: '' }, { a1: 'x' }, { e1: 'otro' }, { luz: 'lineal', alfa: 'x' }]) { let ok = false; try { OeC.resolver({ modo: 'retardo', luz: 'lineal', alfa: '0', e1: 'l4', a1: '45', e2: '', e3: '', e4: '', ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Ondas EM: retardo ${JSON.stringify(mala)} debería dar error`); } }
    if (fallos === antes) console.log(`  ✓ Ondas EM planas: ${OeC.ejemplos.length} ejemplos, λ, k, B₀, dirección de B, fase, índice, espectro, intensidad, fuente puntual, profundidad de penetración, dirección cualquiera, polarización, expresiones, incidencia normal y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'electromagnetismo', 'ondas-em', 'index.html'));
      await page.waitForFunction(() => window.OndasEMApp);
      const antes = fallos;
      const verO = (await page.locator('#ver').textContent()).trim();
      if (verO !== Version.de('ondas-em').current) mal(`Ondas EM: la página muestra la versión «${verO}», se esperaba ${Version.de('ondas-em').current}`);
      for (const e of OeC.ejemplos) {
        await page.evaluate((c) => OndasEMApp.abrirEjemplo(c), e.clave);
        await page.waitForTimeout(60);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
        if (r.err || r.pasos < 2 || r.res < 1) mal(`Ondas EM · ${e.clave}: falta el resultado o el desarrollo`);
        if (r.modo !== e.sc.modo) mal(`Ondas EM · ${e.clave}: el modo no cuadra`);
      }
      await page.evaluate(() => OndasEMApp.abrirEjemplo('fm'));
      if (!(await page.locator('#res').textContent()).includes('2,998 m')) mal('Ondas EM: λ = 2,998 m no sale en la página');
      await page.fill('#f-valor', '200e6');
      if (!(await page.locator('#res').textContent()).includes('1,499 m')) mal('Ondas EM: con el doble de frecuencia λ no se reduce a la mitad');
      await page.selectOption('#f-pol', '+z');
      if ((await page.locator('#f-prop').inputValue()).slice(-1) === 'z' || !(await page.locator('#error').isHidden())) mal('Ondas EM: al poner E paralelo a k no se corrige la propagación o da error');
      await page.selectOption('#f-medio', 'medio');
      if ((await page.locator('#f-er').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Ondas EM: al elegir un material no sale εr o da error');
      await page.fill('#f-E0', 'abc');
      if (await page.locator('#error').isHidden()) mal('Ondas EM: una E₀ que no es un número no da error');
      await page.selectOption('#f-modo', 'perdidas');
      if (!(await page.locator('#res').textContent()).includes('buen conductor')) mal('Ondas EM: el cobre no sale buen conductor');
      await page.click('#play');
      if ((await page.locator('#play').textContent()).trim() !== '▶ Seguir') mal('Ondas EM: el botón de pausa no cambia');
      for (let i = 0; i < 12; i++) { await page.evaluate(() => OndasEMApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Ondas EM: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => OndasEMApp.estado()))}`); }
      // copiar la solución como texto o LaTeX e imprimirla (compartir.js)
      if ((await page.locator('.compartir button').count()) !== 4 || !/Resultados[\s\S]*Desarrollo/.test(await page.evaluate(() => Compartir.ejercicio(false)))) mal('Ondas EM: faltan los botones para copiar o imprimir la solución');
      // plasma, suma de ondas, láminas de retardo y paso a Fresnel
      for (const c of ['plasma-iono', 'plasma-obl', 'plasma-metal', 'suma-batido', 'suma-estacionaria', 'suma-circular', 'suma-eliptica', 'ret-circular', 'ret-media', 'ret-analizador']) {
        await page.evaluate((k) => OndasEMApp.abrirEjemplo(k), c);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, res: document.querySelector('#res').textContent.length, px: document.querySelector('#escena').toDataURL().length, ley: document.querySelector('#leyenda').textContent.length, en: OndasEMApp.enunciado().length }));
        if (r.err || r.res < 40 || r.px < 4000 || r.ley < 30 || r.en < 40) mal(`Ondas EM · ${c}: la página no sale bien (${JSON.stringify(r)})`);
      }
      await page.selectOption('#f-modo', 'suma'); await page.selectOption('#f-caso', 'polarizacion'); if (await page.locator('#error').isVisible() || !(await page.locator('#res').textContent()).includes('Semieje')) mal('Ondas EM: al elegir polarización en la suma no salen los semiejes');
      await page.selectOption('#f-modo', 'retardo'); await page.selectOption('#f-e2', 'l2'); if ((await page.locator('#f-a2').count()) !== 1 || await page.locator('#error').isVisible()) mal('Ondas EM: al elegir un segundo elemento no sale su ángulo');
      await page.selectOption('#f-e1', ''); await page.selectOption('#f-e2', ''); if (await page.locator('#error').isHidden()) mal('Ondas EM: sin ningún elemento debería dar error');
      await page.selectOption('#f-modo', 'plasma'); await page.fill('#f-ne', '0'); if (await page.locator('#error').isHidden()) mal('Ondas EM: n_e = 0 debería dar error');
      await page.evaluate(() => OndasEMApp.abrirEjemplo('vidrio'));
      if (await page.locator('#abrir-fresnel').isHidden()) mal('Ondas EM: falta el botón «Abrir en Fresnel» con un dieléctrico');
      await page.evaluate(() => OndasEMApp.abrirEjemplo('conductor')); if (await page.locator('#abrir-fresnel').isVisible()) mal('Ondas EM: «Abrir en Fresnel» no tiene sentido con un conductor');
      await page.evaluate(() => OndasEMApp.abrirEjemplo('vidrio'));
      await page.click('#abrir-fresnel'); await page.waitForTimeout(500);
      { const g = await page.evaluate(() => localStorage.getItem('fresnel-v1')); if (!g || !/"n2":"2,25"|"n2":"1,5"/.test(g)) mal('Ondas EM: «Abrir en Fresnel» no guarda los índices (' + g + ')'); }
      await page.close();
      if (consola.length) mal('Ondas EM: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Ondas EM planas: ${OeC.ejemplos.length} ejemplos, cambio de frecuencia, E perpendicular a k, material, pérdidas, errores y ejercicios al azar sin errores de consola`);
    }
  };
};
