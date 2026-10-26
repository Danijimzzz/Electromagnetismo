/* Comprobación de solido-rigido: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo solido-rigido ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Solido = require(path.join(fuente, 'solido-rigido', 'fisica.js'));
  {
    // valores calculados a mano con g = 9,8
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Sólido rígido · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => Solido.resolver(Solido.ejemplos.find((e) => e.clave === c).sc);
    cerca(r('varilla-extremo').I, (1 / 3) * 2 * 1.2 ** 2, 1e-12, 'varilla por un extremo = ML²/3');
    cerca(r('disco').I, 0.5 * 5 * 0.09, 1e-12, 'disco ½MR²');
    cerca(r('placa').I, (3 * (0.16 + 0.09)) / 12, 1e-12, 'placa M(a² + b²)/12');
    const es = r('esfera-rueda');
    cerca(es.a, (9.8 * 0.5) / 1.4, 1e-12, 'esfera que rueda a = 5/7 g sen θ'); cerca(es.v, Math.sqrt((10 / 7) * 9.8 * 1.5), 1e-12, 'v = √(10gh/7)');
    cerca(es.muMin, (2 / 7) * Math.tan(Math.PI / 6), 1e-12, 'μ mínimo = (2/7) tg θ'); if (!es.rueda) mal('Sólido rígido: la esfera con μ = 0,2 debería rodar sin deslizar');
    const aro = r('aro-desliza');
    if (aro.rueda || !aro.desliza) mal('Sólido rígido: el aro con μ = 0,3 a 40° debería deslizar');
    else cerca(aro.desliza.Q, 0.3 * aro.N * (aro.d - (aro.desliza.w * aro.R ** 2 * 0 + 0.5 * aro.desliza.al * aro.R * aro.desliza.t ** 2)), 1e-9, 'calor = μN · distancia de deslizamiento');
    const t = r('esfera-rueda').carrera.map((q) => q.t);
    if (!(t[0] < t[2] && t[2] < t[1] && t[1] < t[3])) mal('Sólido rígido: la carrera debería ganarla la esfera maciza, luego el cilindro, la esfera hueca y el aro');
    const po = r('polea');
    cerca(po.a, 4.9, 1e-12, 'polea a'); cerca(po.T, 9.8, 1e-12, 'polea T');
    const pa = r('patinadora');
    cerca(pa.w2, 180, 1e-9, 'patinadora ω₂'); cerca(pa.K2 / pa.K1, 3, 1e-9, 'patinadora K₂/K₁ = I₁/I₂');
    for (const [sc, q] of [[{ modo: 'inercia', cuerpo: 'esfera', M: '-1', L: '1' }, 'masa negativa'], [{ modo: 'rodadura', cuerpo: 'varilla', g: '9.8', M: '1', L: '1', theta: '10', d: '1' }, 'una varilla que rueda'], [{ modo: 'rodadura', cuerpo: 'esfera', g: '9.8', M: '1', L: '1', theta: '95', d: '1' }, 'ángulo de 95°'], [{ modo: 'momento', I1: '1', w1: '10', I2: '0' }, 'I₂ = 0']]) {
      let ok = false; try { Solido.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Sólido rígido: ${q} no da error`);
    }
    // compuesto, choques, péndulo y equilibrio
    cerca(r('pendulo-compuesto').I, 0.64 / 3 + 0.4 * 2 * 0.01 + 2 * 0.81, 1e-12, 'varilla por un extremo + esfera a 0,9 m');
    cerca(r('mancuerna').I, 2 * 0.0625 + (0.2 * 0.25) / 12, 1e-12, 'mancuerna');
    const ba = r('bala-varilla'), Ib = 2 / 3 + 0.01 * 0.64;
    cerca(ba.W, (0.01 * 300 * 0.8) / Ib, 1e-12, 'bala: ω = m v r / I');
    cerca(Math.cos(ba.sube * Math.PI / 180), 1 - (0.5 * Ib * ba.W ** 2) / (2.01 * 9.8 * ((2 * 0.5 + 0.01 * 0.8) / 2.01)), 1e-9, 'bala: ángulo que sube');
    const pl = r('plataforma');
    cerca(pl.W2, (400 * (Math.PI / 3) + 30 * 3 * 2) / 520, 1e-12, 'plataforma: ω₂ = (I ω₁ + m v r)/(I + m r²)');
    const pf = r('pendulo-fisico');
    cerca(pf.periodo, 2 * Math.PI * Math.sqrt(2 / (3 * 9.8)), 1e-12, 'varilla por un extremo: T = 2π√(2L/3g)'); cerca(pf.Leq, 2 / 3, 1e-12, 'L_eq = 2L/3');
    cerca(r('aro-clavo').periodo, 2 * Math.PI * Math.sqrt(0.4 / 9.8), 1e-12, 'aro en un clavo: T = 2π√(2R/g)');
    const vc = r('varilla-cae');
    cerca(vc.w, Math.sqrt((3 * 9.8) / 1.5), 1e-12, 'varilla que cae: ω = √(3g/L) al llegar al suelo'); cerca(vc.al * vc.punta, 1.5 * 9.8, 1e-12, 'la punta acelera 3g/2');
    // la simulación del péndulo conserva la energía
    const E = (q) => 0.5 * pf.I * q.w ** 2 - 1 * 9.8 * 0.5 * Math.cos(q.th);
    if (Math.abs(E(pf.mov(pf.T)) - E(pf.mov(0))) > 1e-6) mal('Sólido rígido: la simulación del péndulo físico no conserva la energía');
    const es2 = r('escalera');
    cerca(es2.N2, (9.8 * 0.5 * (20 + 210)) / (4 * Math.sin(Math.PI / 3)), 1e-9, 'escalera: N₂'); if (!es2.resbala) mal('Sólido rígido: la escalera con μ = 0,4 debería resbalar');
    const vi = r('viga');
    cerca(vi.RB, (490 * 3 + 294 * 6 + 784 * 2) / 4, 1e-9, 'viga: R_B'); cerca(vi.RA + vi.RB, 9.8 * 160, 1e-9, 'viga: R_A + R_B = peso');
    if (!Solido.resolver({ modo: 'equilibrio', tipo: 'viga', g: '9,8', M: '10', L: '4', xA: '0', xB: '1', cargas: '4 50' }).vuelca) mal('Sólido rígido: una carga lejos del apoyo debería volcar la viga');
    if (fallos === antes) console.log(`  ✓ Sólido rígido: ${Solido.ejemplos.length} ejemplos, Steiner, compuestos, rodadura con y sin deslizamiento, polea, momento angular, choques, péndulo físico, equilibrio y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'fisica', 'solido-rigido', 'index.html'));
      await page.waitForFunction(() => window.SolidoApp);
      const antes = fallos;
      const verS = (await page.locator('#ver').textContent()).trim();
      if (verS !== Version.de('solido-rigido').current) mal(`Sólido rígido: la página muestra la versión «${verS}», se esperaba ${Version.de('solido-rigido').current}`);
      for (const e of Solido.ejemplos) {
        await page.evaluate((c) => SolidoApp.abrirEjemplo(c), e.clave);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 2) mal(`Sólido rígido · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => SolidoApp.abrirEjemplo('esfera-rueda'));
      if (!(await page.locator('#res').textContent()).includes('3,5')) mal('Sólido rígido: la esfera no da a = 3,5 m/s² en la página');
      await page.click('#play'); await page.waitForTimeout(150); await page.click('#play');
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => SolidoApp.azar());
        const en = await page.evaluate(() => SolidoApp.enunciado());
        if (!(await page.locator('#error').isHidden()) || /undefined|NaN/.test(en)) mal(`Sólido rígido · práctica: ejercicio al azar con error o sin enunciado: ${en}`);
      }
      await page.selectOption('#f-modo', 'inercia');
      await page.selectOption('#f-cuerpo', 'placa');
      if ((await page.locator('#f-b').count()) !== 1) mal('Sólido rígido: la placa no pide el lado b');
      await page.fill('#f-M', 'x');
      if (await page.locator('#error').isHidden()) mal('Sólido rígido: una masa no numérica no muestra el error');
      await page.close();
      if (consola.length) mal('Sólido rígido: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Sólido rígido: ${Solido.ejemplos.length} ejemplos, cambio de modo y de cuerpo y errores sin errores de consola`);
    }
  };
};
