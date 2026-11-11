/* Comprobación de complejos: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo complejos ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const ComplejosC = require(path.join(fuente, 'complejos', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Complejos · ${q}: ${a} en vez de ${b}`); };
    const cz = (z, re, im, q) => { cerca(z.re, re, 1e-9, `${q} (parte real)`); cerca(z.im, im, 1e-9, `${q} (parte imaginaria)`); };
    const r = (c) => ComplejosC.resolver(ComplejosC.ejemplos.find((e) => e.clave === c).sc);
    const A_ = require(path.join(fuente, 'matematicas', 'algebra.js'));
    for (const e of ComplejosC.ejemplos) { try { if (!ComplejosC.resolver(e.sc).pasos.length) mal(`Complejos · ${e.clave}: sin desarrollo`); } catch (err) { mal(`Complejos · ${e.clave}: ${err.message}`); } }
    const fo = r('formas'); cerca(fo.formas.r, 5, 1e-12, 'módulo de 3 + 4i'); cerca(fo.formas.t * 180 / Math.PI, 53.130102354, 1e-6, 'argumento de 3 + 4i');
    if (A_.txt(A_.div(A_.c1, fo.ex)) !== '3/25 − 4/25·i') mal('Complejos: el inverso de 3 + 4i no es 3/25 − 4/25 i');
    cerca(r('tercero').formas.t, -3 * Math.PI / 4, 1e-12, 'argumento de −2 − 2i (tercer cuadrante)');
    if (r('tercero').formas.rT !== '2√2 ≈ 2,828') mal('Complejos: el módulo de −2 − 2i no sale 2√2');
    if (A_.txt(r('suma').ex) !== '4 − 3i' || A_.txt(r('producto').ex) !== '5 + i' || A_.txt(r('cociente').ex) !== '1/2 + 5/2·i') mal('Complejos: suma, producto o cociente exactos mal');
    cz(r('polar').z, 0, 6, '2∠30° · 3∠60°'); cz(r('moivre').z, 16, 0, '(1 + i)⁸');
    const rc = r('raices-cubicas'); if (rc.raices.length !== 3) mal('Complejos: −8 no tiene 3 raíces cúbicas');
    cz(rc.raices[1].z, -2, 0, 'raíz cúbica real de −8'); cz(rc.raices[0].z, 1, Math.sqrt(3), 'primera raíz cúbica de −8');
    for (const q of r('raices-unidad').raices) cerca(ComplejosC.mod(q.z), 1, 1e-12, 'raíces de la unidad en la circunferencia');
    const ec = r('ecuacion'); cz(ec.z1, 1, 2, 'z² − 2z + 5 = 0 (z₁)'); cz(ec.z2, 1, -2, 'z² − 2z + 5 = 0 (z₂)');
    const eq = r('ecuacion-compleja'); for (const z of [eq.z1, eq.z2]) { const z2 = { re: z.re * z.re - z.im * z.im, im: 2 * z.re * z.im }; cz({ re: z2.re + 3 * z.im - 3, im: z2.im - 3 * z.re + 1 }, 0, 0, 'la solución cumple la ecuación compleja'); }
    cz(r('exponencial').z, 1, Math.sqrt(3), '2e^(iπ/3)');
    cz(ComplejosC.leeZ('2(cos 60° + i sen 60°)', 'grados', 'z').z, 1, Math.sqrt(3), 'forma trigonométrica'); cz(ComplejosC.leeZ('√2_45', 'grados', 'z').z, 1, 1, 'polar √2_45'); cz(ComplejosC.leeZ('2∠π/2', 'grados', 'z').z, 0, 2, 'polar con π');
    for (const [sc, q] of [[{ op: 'formas', z1: 'hola' }, 'un texto'], [{ op: 'cociente', z1: '1', z2: '0' }, 'dividir entre 0'], [{ op: 'raices', z1: '8', n: '1' }, 'raíz de índice 1'], [{ op: 'ecuacion', a: '0', b: '1', c: '1' }, 'a = 0'], [{ op: 'formas', z1: '2(cos 30° + i sen 60°)' }, 'ángulos distintos en la trigonométrica'], [{ op: 'formas', z1: '-2∠30°' }, 'módulo negativo']]) {
      let ok = false; try { ComplejosC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Complejos: ${q} no da error`);
    }
    // MA-4 / CO-1 · entrada flexible: lo que no tiene una forma de siempre se calcula como expresión y se enseña el valor leído
    {
      const fz = (z1, extra = {}) => ComplejosC.resolver({ op: 'formas', z1, unidad: 'grados', ...extra });
      // a mano: √(−4) = 2i; e^(iπ) + 1 = 0; i^i = e^(−π/2); ln(−1) = πi; (1 + i)⁸ = 16; √i = (1 + i)/√2; (2 + 3i)/(1 − i) = (−1 + 5i)/2
      for (const [t, re, im, exacto] of [['sqrt(-4)', 0, 2, true], ['e^(iπ)+1', 0, 0, true], ['e^(i*pi)+1', 0, 0, true], ['i^i', Math.exp(-Math.PI / 2), 0, false], ['ln(-1)', 0, Math.PI, false], ['(1+i)^8', 16, 0, true], ['sqrt(i)', Math.SQRT1_2, Math.SQRT1_2, false], ['√(−9)', 0, 3, true], ['sen(i)', 0, Math.sinh(1), false], ['(2+3i)/(1-i)', -0.5, 2.5, true], ['abs(3+4i)', 5, 0, true]]) {
        const x = fz(t); cz(x.z, re, im, `entrada «${t}»`);
        if (t !== '(1+i)^8' && t !== '(2+3i)/(1-i)') { if (!x.leidos || x.pasos[0].t !== 'Valor leído' || x.leidos[0].exacto !== exacto) mal(`Complejos · «${t}»: falta el paso «Valor leído» o su exactitud (${JSON.stringify(x.leidos)})`); }
      }
      // lo que ya se leía sigue igual y sin el paso nuevo: binómica exacta, con raíces, polar, trigonométrica y exponencial
      for (const [t, re, im] of [['3-2i', 3, -2], ['1+sqrt(3)i', 1, Math.sqrt(3)], ['1+√3i', 1, Math.sqrt(3)], ['sqrt(2)/2+sqrt(2)/2 i', Math.SQRT1_2, Math.SQRT1_2], ['2∠60°', 1, Math.sqrt(3)], ['2(cos 60° + i sen 60°)', 1, Math.sqrt(3)], ['2e^(iπ/3)', 1, Math.sqrt(3)]]) {
        const x = fz(t); cz(x.z, re, im, `entrada «${t}»`); if (x.leidos) mal(`Complejos · «${t}» ya se leía y ahora pasa por la entrada flexible`);
      }
      if (!fz('3-2i').ex || !fz('sqrt(-4)').ex) mal('Complejos: 3 − 2i o √(−4) dejan de ser exactos');
      const pr = ComplejosC.resolver({ op: 'producto', z1: 'sqrt(-4)', z2: 'e^(iπ/2)', unidad: 'grados' }); cz(pr.z, -2, 0, '√(−4) · e^(iπ/2)');
      for (const t of ['hola', '1/0', 'ln(0)', 'x+1', '2+', 'sqrt()']) { let ok = false; try { fz(t); } catch (e) { ok = /no se entiende/.test(e.message); } if (!ok) mal(`Complejos: «${t}» debería dar el error de siempre`); }
    }
    if (fallos === antes) console.log(`  ✓ Números complejos: ${ComplejosC.ejemplos.length} ejemplos, cuatro formas, cuadrantes, operaciones exactas, De Moivre, raíces, ecuaciones y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'matematicas', 'complejos', 'index.html'));
      await page.waitForFunction(() => window.ComplejosApp);
      await require('./comun/exportar.js')(page, mal, 'complejos', { lienzo: '#plano', datos: false });
      const antes = fallos;
      const verC = (await page.locator('#ver').textContent()).trim();
      if (verC !== Version.de('complejos').current) mal(`Complejos: la página muestra la versión «${verC}», se esperaba ${Version.de('complejos').current}`);
      for (const e of ComplejosC.ejemplos) {
        await page.evaluate((c) => ComplejosApp.abrirEjemplo(c), e.clave);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div').length, math: document.querySelectorAll('#pasos math').length }));
        if (r.err || r.pasos < 2 || r.res < 2 || r.dolar || !r.math) mal(`Complejos · ${e.clave}: falta el resultado o el desarrollo, o se ve un $`);
      }
      await page.selectOption('#f-op', 'producto');
      await page.fill('#f-z1', '1+i'); await page.fill('#f-z2', '1-i');
      if (!(await page.locator('#resumen').textContent()).includes('2')) mal('Complejos: (1 + i)(1 − i) no da 2');
      await page.fill('#f-z2', 'hola');
      if (await page.locator('#error').isHidden()) mal('Complejos: un complejo sin sentido no muestra el error');
      for (let i = 0; i < 8; i++) { await page.evaluate(() => ComplejosApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Complejos: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => ComplejosApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Complejos: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Números complejos: ${ComplejosC.ejemplos.length} ejemplos con MathML, cambio de operación, errores y ejercicios al azar sin errores de consola`);
    }
  };
};
