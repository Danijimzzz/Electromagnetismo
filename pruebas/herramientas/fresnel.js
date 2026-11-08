/* Comprobación de fresnel: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo fresnel ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'fresnel', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Fresnel · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc), r0 = () => C.ejemplos[0].sc;
    // valores calculados a mano (aire → vidrio a 30°: sen θt = 1/3, cos θt = √8/3)
    const a = r('aire-vidrio');
    cerca(a.tt, 19.4712, 1e-3, 'ángulo de refracción aire → vidrio');
    cerca(a.rp, -0.240408, 1e-5, 'r⊥ aire → vidrio a 30°');
    cerca(a.rl, -0.158900, 1e-5, 'r∥ aire → vidrio a 30°');
    cerca(a.Rp, 0.057796, 1e-5, 'R⊥ aire → vidrio a 30°');
    cerca(a.thBl, 56.3099, 1e-3, 'ángulo de Brewster del vidrio (arctg 1,5)');
    // incidencia normal: r = −0,2, t = 0,8, R = 4 %, y los campos con E0 = 10
    const n = r('normal');
    cerca(n.rp, -0.2, 1e-12, 'r a incidencia normal'); cerca(n.tl, 0.8, 1e-12, 't a incidencia normal'); cerca(n.Rp, 0.04, 1e-12, 'R a incidencia normal'); cerca(n.amp.rp, -2, 1e-12, 'Er a incidencia normal');
    // FR-1 (EM-1): capa λ/4 antirreflejante y espejo de 3 capas, con solución cerrada; conservación R + T = 1
    {
      const ar = r('antirreflejante').cap, Rc = ((1 * 1.52 - 1.38 ** 2) / (1 * 1.52 + 1.38 ** 2)) ** 2;
      cerca(ar.Rp, Rc, 1e-9, 'R de una capa λ/4 de MgF₂ sobre vidrio'); cerca(ar.sin.Rp, 0.04256, 1e-4, 'R del vidrio sin capa (0,52²/2,52²)'); cerca(ar.nopt, Math.sqrt(1.52), 1e-9, 'índice óptimo √(n₁n₂)');
      const Y = (2.35 ** 4) / (1.38 ** 2 * 1.52); cerca(r('espejo-dielectrico').cap.Rp, ((1 - Y) / (1 + Y)) ** 2, 1e-9, 'R de un espejo de 3 capas λ/4 (Y = nH⁴/(nL² ns))');
      const o = C.capasRT(1, 1.5, [{ n: 1.38, d: 100 }, { n: 2, d: 60 }], 550, 50); cerca(o.Rp + o.Tp, 1, 1e-9, 'R + T = 1 (⊥, oblicuo)'); cerca(o.Rl + o.Tl, 1, 1e-9, 'R + T = 1 (∥, oblicuo)');
      const s0 = C.capasRT(1, 1.5, [], 550, 30); cerca(s0.Rp, a.Rp, 1e-12, 'sin capas coincide con Fresnel ⊥'); cerca(s0.Tl, a.Tl, 1e-12, 'sin capas coincide con Fresnel ∥');
      // capa de media onda: «invisible» (R igual que sin capa)
      cerca(C.capasRT(1, 1.5, [{ n: 2, d: 550 / 4 }], 550, 0).Rp, C.capasRT(1, 1.5, [], 550, 0).Rp, 1e-9, 'capa λ/2 invisible');
      let ok = false; try { C.resolver({ ...r0(), lambda: '', nc: '1', c1n: '1,38', c1d: '100' }); } catch (e) { ok = true; } if (!ok) mal('Fresnel: las capas sin λ no dan error');
    }
    // FR-3: fases y T
    {
      const c = C.curvaFull(a, 30); cerca(c.Rp + c.Tp, 1, 1e-9, 'R + T = 1 en curvaFull'); cerca(c.fp, 180, 0, 'fase de r⊥ aire → vidrio = 180°'); cerca(C.curvaFull(a, 80).fl, 0, 0, 'fase de r∥ tras Brewster = 0°');
      const t = C.curvaFull(r('agua-aire'), 60); cerca(t.Rp, 1, 0, 'R = 1 en reflexión total'); cerca(t.fp, r('agua-aire').fp, 1e-9, 'fase ⊥ coincide con el desarrollo'); cerca(t.fl, r('agua-aire').fl, 1e-9, 'fase ∥ coincide con el desarrollo');
    }
    // con el ángulo de Brewster no se refleja la polarización ∥
    cerca(r('brewster').rl, 0, 1e-4, 'r∥ en el ángulo de Brewster');
    // vidrio → aire: sen θt = 0,75; θc = arcsen(1/1,5); θB = arctg(1/1,5)
    const v = r('vidrio-aire');
    cerca(v.tt, 48.5904, 1e-3, 'ángulo de refracción vidrio → aire'); cerca(v.thc, 41.8103, 1e-3, 'ángulo crítico del vidrio'); cerca(v.thBl, 33.6901, 1e-3, 'Brewster vidrio → aire');
    // agua → aire a 60°: sen θt = 1,33 · sen 60° = 1,152 > 1: reflexión total
    const w = r('agua-aire');
    if (!w.tot) mal('Fresnel: el agua → aire a 60° debería dar reflexión total');
    cerca(w.thc, 48.7535, 1e-3, 'ángulo crítico del agua'); cerca(w.Rp, 1, 1e-12, 'R en reflexión total'); cerca(w.Tl, 0, 1e-12, 'T en reflexión total');
    cerca(w.fp, -81.357, 1e-2, 'fase de r⊥ en reflexión total'); cerca(w.fl, 66.670, 1e-2, 'fase de r∥ en reflexión total');
    cerca(w.prof * 1e9, 600 / (2 * Math.PI * Math.sqrt(1.33 ** 2 * Math.sin(Math.PI / 3) ** 2 - 1)) , 1e-6, 'profundidad de la onda evanescente');
    // ondas de radio sobre el agua: n = 9 y Brewster = arctg 9
    cerca(r('radio-agua').thBl, 83.6598, 1e-3, 'Brewster del agua para radio');
    // en todos los ejemplos la energía se conserva
    for (const e of C.ejemplos) { const x = r(e.clave); cerca(x.Rp + x.Tp, 1, 1e-12, `R⊥ + T⊥ en ${e.clave}`); cerca(x.Rl + x.Tl, 1, 1e-12, `R∥ + T∥ en ${e.clave}`); }
    // con ε y μ iguales a los de n = 2 sale lo mismo que con el índice
    cerca(C.resolver({ dato: 'er', er1: '1', er2: '4', theta: '40' }).rp, C.resolver({ dato: 'n', n1: '1', n2: '2', theta: '40' }).rp, 1e-12, 'εr = 4 equivale a n = 2');
    for (const [sc, q] of [[{ dato: 'n', n1: '', n2: '1,5', theta: '30' }, 'falta n1'], [{ dato: 'n', n1: '1', n2: '1,5', theta: '90' }, 'ángulo de 90°'], [{ dato: 'n', n1: '1', n2: '-1', theta: '30' }, 'índice negativo'], [{ dato: 'n', n1: '1', n2: '1,5', theta: 'a' }, 'ángulo no numérico']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Fresnel: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Fresnel: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'fresnel', 'index.html'));
    await page.waitForFunction(() => window.FresnelApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('fresnel').current) mal(`Fresnel: la página muestra la versión «${ver}», se esperaba ${Version.de('fresnel').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => FresnelApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#res > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Fresnel · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Fresnel · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.evaluate(() => FresnelApp.abrirEjemplo('aire-vidrio'));
    await page.selectOption('#f-dato', 'er');
    if ((await page.inputValue('#f-er2')) !== '2,25') mal('Fresnel: al pasar de n a εr, n = 1,5 debería dar εr = 2,25');
    if (Math.abs((await page.evaluate(() => FresnelApp.resultado().rp)) + 0.2404) > 1e-3) mal('Fresnel: el cambio a εr y μr cambia el resultado');
    await page.fill('#f-theta', '95');
    if (await page.locator('#error').isHidden()) mal('Fresnel: un ángulo de 95° no muestra el error');
    await page.evaluate(() => FresnelApp.abrirEjemplo('antirreflejante'));
    const cp = await page.evaluate(() => ({ visible: !document.querySelector('#bloque-capas').hidden, ley: document.querySelector('#leyenda-capas').textContent.length, bot: document.querySelectorAll('.exportar button').length }));
    if (!cp.visible || cp.ley < 40 || cp.bot !== 4) mal('Fresnel: faltan la gráfica de capas, su leyenda o los botones de exportar');
    await page.selectOption('#cual', 'F');
    if (!/Fase/.test(await page.locator('#h-grafica').textContent())) mal('Fresnel: la gráfica no cambia a la fase');
    await page.selectOption('#eje-capas', 'angulo');
    await page.selectOption('#f-nc', '2'); await page.fill('#f-c2n', '2'); await page.fill('#f-c2d', '60');
    if (await page.locator('#error').isVisible()) mal('Fresnel: dos capas dan error: ' + await page.locator('#error').textContent());
    await page.close();
    if (consola.length) mal('Fresnel: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Fresnel: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
