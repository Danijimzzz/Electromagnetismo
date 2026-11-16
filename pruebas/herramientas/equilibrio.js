/* Comprobación de Equilibrio químico y Le Chatelier: cálculos a mano en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo equilibrio ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'equilibrio', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Equilibrio · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // H2 + I2 ⇌ 2HI, 1 M cada uno, Kc = 50: 2x/(1−x) = √50 ⇒ x = √50/(2+√50)
    { const s = r('hi'), x = Math.sqrt(50) / (2 + Math.sqrt(50));
      cerca(s.x, x, 1e-9, 'avance de H2 + I2'); cerca(s.ceq[2], 2 * x, 1e-9, '[HI]'); cerca(s.ceq[0], 1 - x, 1e-9, '[H2]'); cerca(s.Kp, 50, 1e-9, 'Kp con Δn = 0'); cerca(s.alfa, x, 1e-9, 'conversión'); }
    // N2O4 ⇌ 2NO2, 0,1 M, Kc = 0,2: 4x² + 0,2x − 0,02 = 0 ⇒ x = 0,05; Kp = 0,2·(0,082·400) = 6,56
    { const s = r('n2o4'); cerca(s.x, 0.05, 1e-9, 'avance del N2O4'); cerca(s.ceq[0], 0.05, 1e-9, '[N2O4]'); cerca(s.ceq[2], 0.1, 1e-9, '[NO2]'); cerca(s.alfa, 0.5, 1e-9, 'grado de disociación'); cerca(s.Kp, 6.56, 1e-9, 'Kp'); cerca(s.dn, 1, 0, 'Δn'); }
    // Kc a partir de [HI] = 1,2: x = 0,6, [H2] = [I2] = 0,4 ⇒ Kc = 1,44/0,16 = 9
    { const s = r('calcular-k'); cerca(s.K, 9, 1e-9, 'Kc desde el equilibrio'); cerca(s.alfa, 0.6, 1e-9, 'conversión desde Kc'); }
    // Q = 0,4²/0,1 = 1,6 > 0,2: izquierda; acaba en 0,2 y 0,2 (x = −0,1)
    { const s = r('q'); cerca(s.Q, 1.6, 1e-9, 'Q'); if (s.s0 !== 'izq') mal(`Equilibrio · sentido de Q: ${s.s0}`); cerca(s.x, -0.1, 1e-9, 'avance hacia la izquierda'); cerca(s.ceq[0], 0.2, 1e-9, '[N2O4] final'); }
    // añadir H2 al equilibrio: hacia la derecha, y el nuevo equilibrio cumple K
    { const s = r('lc-anadir'); if (s.s0 !== 'der') mal(`Equilibrio · añadir H2: ${s.s0}`); cerca(Math.pow(s.ceq[2], 2) / (s.ceq[0] * s.ceq[1]), 50, 1e-9, 'Kc tras añadir H2'); if (!(s.ceq[0] > s.c1[0])) mal('Equilibrio · añadir H2: no queda más H2'); }
    // comprimir a la mitad: c' = (0,1; 0,2), 4x² − x + 0,02 = 0 ⇒ x = (1 − √0,68)/8 hacia la izquierda
    { const s = r('lc-volumen'), x = (1 - Math.sqrt(0.68)) / 8; if (s.s0 !== 'izq') mal(`Equilibrio · comprimir: ${s.s0}`); cerca(s.Q, 0.4, 1e-9, 'Q tras comprimir'); cerca(s.x, -x, 1e-8, 'avance tras comprimir'); cerca(s.ceq[2], 0.2 - 2 * x, 1e-8, '[NO2] tras comprimir'); }
    // Van't Hoff: ln(K2/K1) = −ΔH/R·(1/T2 − 1/T1) con ΔH = 57,2 kJ/mol de 298 a 350 K ⇒ K2 ≈ 0,1420
    { const s = r('lc-temperatura'); cerca(s.K2, 4.6e-3 * Math.exp((57200 / 8.314) * (1 / 298 - 1 / 350)), 1e-9, 'K2 de Van\'t Hoff'); cerca(s.K2, 0.142, 3e-3, 'K2 a mano'); if (s.s0 !== 'der') mal(`Equilibrio · calentar una endotérmica: ${s.s0}`); }
    // sin desplazamiento: Δn = 0 al cambiar el volumen, gas inerte y catalizador
    for (const [sc, q] of [[{ tipo: 'volumen', rv: '0,5' }, 'volumen con Δn = 0'], [{ tipo: 'inerte' }, 'gas inerte'], [{ tipo: 'catalizador' }, 'catalizador']]) {
      const s = C.resolver(Object.assign({}, C.ejemplos.find((e) => e.clave === 'lc-anadir').sc, sc));
      if (s.s0 !== 'eq') mal(`Equilibrio · ${q} debería no desplazar y da ${s.s0}`);
    }
    // una ecuación de tercer grado: A ⇌ 2B + C (0,5 M, Kc = 0,1) cumple Kc
    { const s = C.resolver({ modo: 'eq', nA: 'A', nB: '', nC: 'B', nD: 'C', a: '1', b: '', c: '2', d: '1', cA: '0,5', K: '0,1' }); cerca(s.ceq[2] ** 2 * s.ceq[3] / s.ceq[0], 0.1, 1e-9, 'Kc con coeficiente 2 (tercer grado)'); }
    // EQ-2 · fases: CaCO3(s) ⇌ CaO(s) + CO2(g): Kc = [CO2] y Kp = Kc·RT; C(s) + CO2 ⇌ 2CO con 4x² + 0,2x − 0,2 = 0 ⇒ x = 0,2
    { const s = r('carbonato'); cerca(s.ceq[3], 0.0025, 1e-9, '[CO2] con sólidos fuera de K'); cerca(s.Kp, 0.0025 * 0.082 * 1000, 1e-9, 'Kp con un solo gas'); if (!/\(s\)/.test(s.reaccion)) mal('Equilibrio · la reacción no muestra (s)');
      const t = r('carbono-co2'); cerca(t.x, 0.2, 1e-9, 'avance de C + CO2'); cerca(t.ceq[1], 0.8, 1e-9, '[CO2]'); cerca(t.ceq[2], 0.4, 1e-9, '[CO]'); cerca(t.Kp, 0.2 * 0.082 * 1100, 1e-9, 'Kp con Δn = 1');
      // los sólidos no cambian el resultado: con o sin fase marcada en un reactivo disuelto da lo mismo que sin marcar
      const u = C.resolver({ modo: 'eq', nA: 'A', nC: 'B', a: '1', c: '2', fA: 'aq', fC: 'aq', cA: '1', K: '0,5' }); if (u.Kp !== undefined) mal('Equilibrio · con especies disueltas no debe salir Kp');
      // un sólido con poca cantidad se agota antes del equilibrio
      const v = C.resolver({ modo: 'eq', nA: 'CaCO3', nC: 'CaO', nD: 'CO2', a: '1', c: '1', d: '1', fA: 's', fC: 's', fD: 'g', cA: '0,001', cD: '0', K: '0,0025' }); if (!v.agotado || Math.abs(v.ceq[3] - 0.001) > 1e-12) mal('Equilibrio · el sólido que se agota no se detecta: ' + v.ceq[3]); }
    // EQ-1 · K desde ΔG°: Kp = e^(33000/(8,314·298)) ≈ 5,6·10⁵ y el equilibrio cumple Kc = Kp·(R·T)^−Δn
    { // el ajuste común de Química (QU-3): con R exacta cambia K desde ΔG°
      const Aj = require(path.join(fuente, 'quimica', 'ajuste.js')), guarda = global.localStorage;
      global.localStorage = { getItem: () => JSON.stringify({ masas: false, constantes: false }) };
      const e = r('dg-amoniaco'); global.localStorage = guarda;
      cerca(e.Kp0, Math.exp(32800 / (8.314462618 * 298)), 1e-9, 'K desde ΔG° con R exacta'); cerca(Aj.valores().R, 8.314, 0, 'R de clase por defecto'); }
    { const s = r('dg-amoniaco'), Kp = Math.exp(32800 / (8.314 * 298)); cerca(s.Kp0, Kp, 1e-9, 'K desde ΔG°'); cerca(s.Kp, Kp, 1e-9, 'Kp de vuelta'); cerca(Math.pow(s.ceq[2], 2) / (s.ceq[0] * Math.pow(s.ceq[1], 3)), Kp * Math.pow(0.083145 * 298, 2), 1e-8, 'Kc desde ΔG°');
      for (const [sc, q] of [[{ dG: '-5000' }, 'ΔG° enorme'], [{ dG: '' }, 'falta ΔG°'], [{ T: '' }, 'falta T']]) { let ok = false; try { C.resolver(Object.assign({}, C.ejemplos.find((e) => e.clave === 'dg-amoniaco').sc, sc)); } catch (e) { ok = true; } if (!ok) mal(`Equilibrio · ${q} no da error`); } }
    // EQ-3 · dos equilibrios: A ⇌ B (K₁ = 2) y B ⇌ C (K₂ = 0,5), 1 M de A ⇒ [A] = 1/4, [B] = 1/2, [C] = 1/4
    { const s = r('dos-cadena'); cerca(s.ceq[0], 0.25, 1e-9, '[A] de los dos equilibrios'); cerca(s.ceq[1], 0.5, 1e-9, '[B]'); cerca(s.ceq[2], 0.25, 1e-9, '[C]'); cerca(s.x1, 0.75, 1e-9, 'avance x₁'); cerca(s.x2, 0.25, 1e-9, 'avance x₂'); }
    // con especies compartidas (PCl5/PCl3/Cl2/CO/COCl2) se cumplen las dos K y el balance de átomos
    { const s = r('dos-cloro'); cerca(s.Q1, 0.04, 1e-9, 'Q₁ = K₁'); cerca(s.Q2, 20, 1e-9, 'Q₂ = K₂'); cerca(s.ceq[0] + s.ceq[1], 0.5, 1e-9, 'balance de P'); cerca(s.ceq[3] + s.ceq[4], 1, 1e-9, 'balance de C'); cerca(s.ceq[0] * 5 + s.ceq[2] * 2 + s.ceq[1] * 3 + s.ceq[4] * 2 - 0.5 * 5, 0, 1e-9, 'balance de Cl'); }
    // un caso sin simetría: tres especies, 2A ⇌ B y B + C ⇌ D; lo comprueba la propia ley de acción de masas
    { const s = C.resolver({ modo: 'dos', r1A: '-2', r1B: '1', r2B: '-1', r2C: '-1', r2D: '1', cA: '2', cC: '1', K1: '3', K2: '7' }); cerca(s.ceq[1] / (s.ceq[0] ** 2), 3, 1e-8, 'K₁ con coeficiente 2'); cerca(s.ceq[3] / (s.ceq[1] * s.ceq[2]), 7, 1e-8, 'K₂'); }
    for (const [sc, q] of [[{ modo: 'dos', r1A: '-1', r1B: '1', r2A: '-2', r2B: '2', cA: '1', K1: '1', K2: '1' }, 'dos reacciones proporcionales'], [{ modo: 'dos', r1A: '1', r1B: '1', r2B: '-1', r2C: '1', cA: '1', K1: '1', K2: '1' }, 'reacción sin reactivo'], [{ modo: 'dos', r1A: '-1', r1B: '1', r2B: '-1', r2C: '1', cA: '', cB: '', K1: '1', K2: '1' }, 'todo a cero'], [{ modo: 'eq', fA: 's', fB: 's', fC: 's', fD: 's', K: '1' }, 'todo sólido']]) {
      let ok = false; try { C.resolver(Object.assign({}, C.ejemplos[0].sc, sc)); } catch (e) { ok = true; }
      if (!ok) mal(`Equilibrio: ${q} no da error`);
    }
    for (const [sc, q] of [[{ a: '' }, 'falta el coeficiente de A'], [{ modo: 'eq', K: '0' }, 'Kc cero'], [{ modo: 'eq', cA: '0', cB: '0', cC: '0', K: '1' }, 'todo a cero'], [{ modo: 'K', ceq: '5' }, 'concentración de equilibrio imposible'], [{ modo: 'lc', tipo: 'quitar', esp: 'A', cant: '5' }, 'quitar más de lo que hay']]) {
      let ok = false; try { C.resolver(Object.assign({}, C.ejemplos[0].sc, { K: '50' }, sc)); } catch (e) { ok = true; }
      if (!ok) mal(`Equilibrio: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Equilibrio: ${C.ejemplos.length} ejemplos a mano (ICE, Kp, Q, Le Chatelier y Van't Hoff) y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'quimica', 'equilibrio', 'index.html'));
    await page.waitForFunction(() => window.EquilibrioApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('equilibrio').current) mal(`Equilibrio: la página muestra la versión «${ver}», se esperaba ${Version.de('equilibrio').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => EquilibrioApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, tablas: document.querySelectorAll('#pasos table').length }));
      if (r.err || !r.pasos || !r.res) mal(`Equilibrio · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Equilibrio · ${e.clave}: el desarrollo no sale en MathML`);
      if (!r.tablas) mal(`Equilibrio · ${e.clave}: falta la tabla del desarrollo`);
    }
    // fases, ΔG°, dos equilibrios, la gráfica de Q y los botones de exportar
    { const a0 = fallos;
      await page.evaluate(() => EquilibrioApp.abrirEjemplo('carbonato'));
      const f1 = await page.evaluate(() => ({ sel: [...document.querySelectorAll('#reac select.fase')].map((x) => x.value).join(), r: EquilibrioApp.resultado() }));
      if (f1.sel !== 's,g,s,g') mal('Equilibrio · los selectores de fase no reflejan el ejemplo: ' + f1.sel);
      await page.selectOption('#reac select.fase[data-k=fA]', 'g'); await page.fill('#f-cA', '1');
      if (!(await page.evaluate(() => EquilibrioApp.resultado().Kp > 0))) mal('Equilibrio · al pasar un sólido a gas deja de salir Kp');
      await page.evaluate(() => EquilibrioApp.abrirEjemplo('dg-amoniaco'));
      const g1 = await page.evaluate(() => EquilibrioApp.resultado()); if (!(g1.Kp > 5e5)) mal('Equilibrio · ΔG° en la página: Kp = ' + g1.Kp);
      await page.evaluate(() => EquilibrioApp.abrirEjemplo('dos-cadena'));
      const d1 = await page.evaluate(() => ({ r: EquilibrioApp.resultado(), filas: document.querySelectorAll('#reac .fila5').length, campos: !!document.querySelector('#f-K1') && !!document.querySelector('#f-K2') }));
      if (d1.filas !== 3 || !d1.campos || Math.abs(d1.r.ceq[1] - 0.5) > 1e-9) mal('Equilibrio · el modo de dos equilibrios en la página: ' + JSON.stringify(d1));
      await page.fill('#f-K2', '2');
      const d2 = await page.evaluate(() => EquilibrioApp.resultado()); // B = 2A, C = 2B ⇒ A + 2A + 4A = 1 ⇒ A = 1/7
      if (Math.abs(d2.ceq[0] - 1 / 7) > 1e-9) mal('Equilibrio · cambiar K₂ no recalcula: [A] = ' + d2.ceq[0]);
      const ex = await page.evaluate(() => ({ btn: [...document.querySelectorAll('.exportar button')].map((b) => b.textContent).join('|'), q: document.querySelector('#grafica-q').getAttribute('aria-label'), alto: document.querySelector('#grafica-q').getBoundingClientRect().height }));
      if (!/Descargar PNG/.test(ex.btn) || !/Copiar datos/.test(ex.btn) || !ex.q || ex.alto < 100) mal('Equilibrio · falta la gráfica de Q o los botones de exportar: ' + JSON.stringify(ex));
      if (fallos === a0) console.log('  ✓ Equilibrio · fases, ΔG°, dos equilibrios, gráfica de Q y exportar en la página');
    }
    // cambiar de modo, de tipo de cambio y de dato y verlo en el resultado
    await page.evaluate(() => EquilibrioApp.abrirEjemplo('n2o4'));
    await page.fill('#f-K', '0,8');
    const k = await page.evaluate(() => EquilibrioApp.resultado());
    if (Math.abs(k.K - 0.8) > 1e-12 || !(k.alfa > 0.5)) mal('Equilibrio: cambiar Kc no cambia el resultado');
    await page.selectOption('#f-modo', 'lc'); await page.selectOption('#f-tipo', 'temperatura');
    if (!(await page.locator('#f-dH').count())) mal('Equilibrio: el cambio de temperatura no pide ΔH');
    await page.fill('#f-K', '0'); 
    if (await page.locator('#error').isHidden()) mal('Equilibrio: Kc = 0 no muestra el error');
    // el modo práctica prepara un ejercicio con resultados que se corrigen
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => EquilibrioApp.azar());
      const p = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, n: document.querySelectorAll('#resumen > div.num').length, en: EquilibrioApp.enunciado().length }));
      if (p.err || !p.n || p.en < 30) mal('Equilibrio: el ejercicio al azar no sale bien');
    }
    // QU-3 · ajuste común «de clase / exactas»: R cambia en el desarrollo y en K, y Masa molar lo sigue
    { const a0 = fallos;
      await page.evaluate(() => { localStorage.removeItem('simu-ajuste'); });
      await page.reload(); await page.waitForFunction(() => window.EquilibrioApp);
      await page.evaluate(() => EquilibrioApp.abrirEjemplo('dg-amoniaco'));
      if (!(await page.isChecked('#aj-const')) || !/R = 8,314 J/.test(await page.textContent('#aj-valor'))) mal('Equilibrio · por defecto debería usar las constantes de clase: ' + await page.textContent('#aj-valor'));
      const k1 = await page.evaluate(() => EquilibrioApp.resultado().Kp);
      await page.uncheck('#aj-const');
      const k2 = await page.evaluate(() => EquilibrioApp.resultado().Kp), txt = await page.textContent('#aj-valor'), pasos = await page.textContent('#pasos');
      if (!/8,314462618/.test(txt)) mal('Equilibrio · el valor exacto de R no sale en «En uso»: ' + txt);
      if (!(Math.abs(k1 / Math.exp(32800 / (8.314 * 298)) - 1) < 1e-3) || !(Math.abs(k2 / Math.exp(32800 / (8.314462618 * 298)) - 1) < 1e-3)) mal(`Equilibrio · K con R de clase (${k1}) y exacta (${k2}) no coinciden con e^(−ΔG°/RT)`);
      if (!/8\.314462618|8,314462618/.test(pasos)) mal('Equilibrio · el desarrollo no muestra la R exacta');
      // Masa molar sigue el ajuste de masas
      await page.check('#aj-const');
      const guard = await page.evaluate(() => localStorage.getItem('simu-ajuste'));
      if (JSON.parse(guard).constantes !== true) mal('Equilibrio · el ajuste no se guarda: ' + guard);
      await page.evaluate(() => localStorage.setItem('simu-ajuste', JSON.stringify({ masas: true, constantes: true })));
      await page.goto('file://' + path.join(publico, 'quimica', 'masa-molar', 'index.html'));
      await page.waitForFunction(() => window.MasaApp);
      if ((await page.inputValue('#modo')) !== 'redondeadas') mal('Equilibrio · Masa molar no sigue el ajuste «masas de clase»');
      await page.evaluate(() => localStorage.removeItem('simu-ajuste'));
      if (fallos === a0) console.log('  ✓ Equilibrio · ajuste común de Química: R de clase por defecto, R exacta al desmarcar (K = e^(−ΔG°/RT) con cada una) y Masa molar sigue las masas de clase');
    }
    await page.close();
    if (consola.length) mal('Equilibrio: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Equilibrio: ${C.ejemplos.length} ejemplos en la página con MathML, modos, errores y ejercicios al azar, sin errores de consola`);
  };
};
