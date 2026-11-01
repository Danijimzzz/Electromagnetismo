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
    await page.close();
    if (consola.length) mal('Equilibrio: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Equilibrio: ${C.ejemplos.length} ejemplos en la página con MathML, modos, errores y ejercicios al azar, sin errores de consola`);
  };
};
