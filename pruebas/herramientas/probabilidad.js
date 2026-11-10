/* Comprobación de probabilidad: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo probabilidad ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'probabilidad', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Probabilidad · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    const val = (c, t) => +r(c).res.find((x) => x.t === t).v.replace(/\u202f/g, '').replace(',', '.');
    // combinatoria, a mano
    const v = (c) => r(c).res[0].v.replace(/\u202f/g, '');
    if (v('podio') !== '720') mal('Probabilidad · podio: 10·9·8 = 720, sale ' + v('podio'));
    if (v('loteria') !== '13983816') mal('Probabilidad · primitiva: C(49,6) = 13 983 816, sale ' + v('loteria'));
    if (v('clave') !== '10000') mal('Probabilidad · clave: 10^4 = 10 000, sale ' + v('clave'));
    if (v('mississippi') !== '34650') mal('Probabilidad · MISSISSIPPI: 11!/(1!4!4!2!) = 34 650, sale ' + v('mississippi'));
    if (v('helados') !== '21') mal('Probabilidad · helados: C(7,5) = 21, sale ' + v('helados'));
    if (!/10<sup>/.test(C.resolver({ modo: 'comb', ctipo: 'perm', n: '30' }).res[0].v)) mal('Probabilidad · 30! debería salir con potencia de 10');
    // sucesos: P(A)=0,6, P(B)=0,5, P(A∪B)=0,85 → P(A∩B)=0,25
    cerca(val('union', 'P(A ∩ B)'), 0.25, 1e-9, 'intersección');
    cerca(val('union', 'P(A | B)'), 0.5, 1e-9, 'P(A|B)');
    cerca(val('union', 'P(B | A)'), 0.4167, 1e-4, 'P(B|A)');
    cerca(val('union', 'P(Ā ∩ B̄)'), 0.15, 1e-9, 'De Morgan');
    if (r('union').indep || !r('independientes').indep) mal('Probabilidad · independencia mal decidida');
    cerca(val('independientes', 'P(A ∪ B)'), 0.7, 1e-9, 'unión de independientes');
    // total y Bayes: 0,5·0,01 + 0,3·0,02 + 0,2·0,03 = 0,017
    cerca(val('fabrica', 'P(D)'), 0.017, 1e-12, 'probabilidad total');
    cerca(val('fabrica', 'P(Máquina 1 | D)'), 0.005 / 0.017, 1e-4, 'Bayes máquina 1');
    cerca(val('fabrica', 'P(Máquina 2 | D)'), 0.006 / 0.017, 1e-4, 'Bayes máquina 2');
    cerca(val('diagnostico', 'P(Enfermo | +)'), 0.0095 / 0.059, 1e-3, 'Bayes diagnóstico');
    cerca(val('sin-defecto', 'P(Máquina 1 | D̄)'), 0.495 / 0.983, 1e-4, 'Bayes con el suceso contrario');
    // variable aleatoria discreta, a mano: caras en tres monedas, E = 1,5 y Var = 3·½·½ = 0,75
    const va = (c) => r(c);
    cerca(va('caras').mu, 1.5, 1e-12, 'esperanza de las caras'); cerca(va('caras').v, 0.75, 1e-12, 'varianza de las caras');
    cerca(va('caras').pk.menorIgual, 0.5, 1e-12, 'P(X ≤ 1) de las caras'); cerca(va('caras').pk.mayorIgual, 0.875, 1e-12, 'P(X ≥ 1) de las caras'); cerca(va('caras').med, 1.5, 1e-12, 'mediana de las caras');
    // un dado: E = 3,5, Var = 35/12; Y = 2X − 5: E = 2, Var = 4·35/12 = 35/3
    cerca(va('dado').mu, 3.5, 1e-12, 'esperanza del dado'); cerca(va('dado').v, 35 / 12, 1e-12, 'varianza del dado');
    cerca(va('dado').Y.mu, 2, 1e-12, 'E[2X − 5]'); cerca(va('dado').Y.v, 35 / 3, 1e-12, 'Var(2X − 5)'); cerca(va('dado').Y.sd, 2 * Math.sqrt(35 / 12), 1e-12, 'σ de 2X − 5');
    // falta una probabilidad: 1 − 0,2 − 0,35 − 0,15 = 0,3; E = −0,2 + 0,6 + 0,75 = 1,15; E[X²] = 0,2 + 1,2 + 3,75 = 5,15
    cerca(va('incognita').ps[2], 0.3, 1e-12, 'la probabilidad que falta'); cerca(va('incognita').mu, 1.15, 1e-12, 'esperanza con incógnita'); cerca(va('incognita').v, 5.15 - 1.15 ** 2, 1e-12, 'varianza con incógnita');
    if (JSON.stringify(va('caras').F) !== JSON.stringify([0.125, 0.5, 0.875, 1])) mal('Probabilidad · F(x) de las caras: ' + va('caras').F);
    // los valores desordenados se ordenan
    cerca(C.resolver({ modo: 'va', vax: '3; 1; 2', vap: '0,5; 0,2; 0,3' }).F[0], 0.2, 1e-12, 'F con valores desordenados');
    // tabla 2 × 2: 100 personas, 10 deporte y fuma, 50 deporte y no, 20 no deporte y fuma, 20 ninguno
    cerca(va('encuesta').pa, 0.6, 1e-12, 'P(Deporte)'); cerca(va('encuesta').pb, 0.3, 1e-12, 'P(Fuma)'); cerca(va('encuesta').pu, 0.8, 1e-12, 'unión de la tabla');
    cerca(val('encuesta', 'P(Deporte | Fuma)'), 0.3333, 1e-4, 'P(Deporte | Fuma)'); cerca(val('encuesta', 'P(Deporte | no Fuma)'), 0.7143, 1e-4, 'P(Deporte | no Fuma)');
    if (va('encuesta').indep || !va('tabla-indep').indep) mal('Probabilidad · independencia en la tabla 2 × 2 mal decidida');
    // errores
    const mala = C.ejemplos.find((e) => e.clave === 'fabrica').sc;
    for (const [sc, q] of [
      [{ modo: 'comb', ctipo: 'comb', n: '5', k: '7' }, 'k mayor que n sin repetición'],
      [{ modo: 'comb', ctipo: 'comb', n: '', k: '2' }, 'falta n'],
      [{ modo: 'suc', pa: '0,3', pb: '0,3', rel: 'inter', pc: '0,5' }, 'intersección imposible'],
      [{ modo: 'suc', pa: '1,3', pb: '0,3', rel: 'indep' }, 'probabilidad mayor que 1'],
      [{ ...mala, filas: [{ n: 'a', p: '0,5', l: '0,1' }, { n: 'b', p: '0,3', l: '0,1' }] }, 'causas que no suman 1'],
      [{ ...mala, filas: [{ n: 'a', p: '1', l: '0,1' }] }, 'una sola causa'],
      [{ modo: 'va', vax: '0; 1; 2', vap: '0,5; 0,5' }, 'más valores que probabilidades'],
      [{ modo: 'va', vax: '0; 1', vap: '0,5; 0,6' }, 'probabilidades que no suman 1'],
      [{ modo: 'va', vax: '0; 1; 2', vap: '?; ?; 0,6' }, 'dos probabilidades sin dar'],
      [{ modo: 'va', vax: '0; 1; 2', vap: '0,7; 0,6; ?' }, 'las dadas ya pasan de 1'],
      [{ modo: 'va', vax: '0; 0', vap: '0,5; 0,5' }, 'valores repetidos'],
      [{ modo: 'tabla', t11: '0', t12: '0', t21: '0', t22: '0' }, 'tabla vacía'],
      [{ modo: 'tabla', t11: '3', t12: '−1', t21: '2', t22: '4' }, 'casilla negativa'],
      [{ ...mala, filas: [{ n: 'a', p: '0,5', l: '0' }, { n: 'b', p: '0,5', l: '0' }] }, 'suceso imposible'],
    ]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Probabilidad: ${q} no da error`);
    }
    const az = C.azar(), ra = C.resolver(az);
    cerca(ra.filas.reduce((a, x) => a + x.post, 0), 1, 1e-9, 'el ejercicio al azar suma 1');
    if (fallos === antes) console.log(`  ✓ Probabilidad: ${C.ejemplos.length} ejemplos (combinatoria, sucesos, Bayes, variable aleatoria y tabla 2 × 2) y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'estadistica', 'probabilidad', 'index.html'));
    await page.waitForFunction(() => window.ProbabilidadApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('probabilidad').current) mal(`Probabilidad: la página muestra la versión «${ver}», se esperaba ${Version.de('probabilidad').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => ProbabilidadApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Probabilidad · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Probabilidad · ${e.clave}: el desarrollo no sale en MathML`);
    }
    // un error: causas que no suman 1
    await page.evaluate(() => ProbabilidadApp.abrirEjemplo('fabrica'));
    await page.fill('[data-fila="0"][data-c="p"]', '0,9');
    if (await page.locator('#error').isHidden()) mal('Probabilidad: causas que no suman 1 no muestran el error');
    // cambiar de pestaña y de tipo de combinatoria
    await page.click('.modos button[data-modo="comb"]');
    await page.selectOption('#f-ctipo', 'permrep');
    await page.fill('#f-grupos', '1, 4, 4, 2');
    const t = (await page.locator('#resumen .pr b').first().textContent()).replace(/\s/g, '');
    if (t !== '34650') mal('Probabilidad: MISSISSIPPI en la página da «' + t + '»');
    if (await page.locator('#tarjeta-grafica').isVisible()) mal('Probabilidad: la combinatoria no debería mostrar diagrama');
    // el árbol se dibuja (el lienzo no queda en blanco)
    await page.evaluate(() => ProbabilidadApp.abrirEjemplo('fabrica'));
    const pintado = await page.evaluate(() => { const c = document.querySelector('#grafica'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
    if (pintado < 500) mal('Probabilidad: el diagrama de árbol sale en blanco');
    // variable aleatoria: tabla con una fila por valor, gráfica pintada y la probabilidad que falta
    await page.evaluate(() => ProbabilidadApp.abrirEjemplo('incognita'));
    const va = await page.evaluate(() => { const n = document.querySelector('#grafica').toDataURL().length; return { n, filas: document.querySelectorAll('#tabla tbody tr').length, visible: !document.querySelector('#tarjeta-tabla').hidden, mu: document.querySelector('#resumen .pr b').textContent }; });
    if (va.n < 6000 || va.filas !== 4 || !va.visible || va.mu !== '1,15') mal('Probabilidad: la variable aleatoria no sale bien en la página: ' + JSON.stringify(va));
    await page.fill('#f-vap', '0,2; 0,35; 0,5; 0,15');
    if (await page.locator('#error').isHidden()) mal('Probabilidad: probabilidades que no suman 1 no muestran el error');
    // tabla 2 × 2: al cambiar el nombre del suceso cambian las cabeceras y los resultados
    await page.evaluate(() => ProbabilidadApp.abrirEjemplo('encuesta'));
    await page.fill('#f-tb', 'Bebe');
    const tb = await page.evaluate(() => ({ cab: document.querySelectorAll('#casillas span')[1].textContent, res: document.querySelector('#resumen').textContent, tabla: document.querySelectorAll('#tabla tr').length }));
    if (tb.cab !== 'Bebe' || !/P\(Deporte \| Bebe\)/.test(tb.res) || tb.tabla !== 4) mal('Probabilidad: la tabla 2 × 2 no sigue el nombre del suceso: ' + JSON.stringify(tb));
    // el modo práctica genera un ejercicio con enunciado
    await page.evaluate(() => ProbabilidadApp.azar());
    if (!/máquinas/.test(await page.evaluate(() => ProbabilidadApp.enunciado()))) mal('Probabilidad: el enunciado de práctica está vacío');
    await page.close();
    if (consola.length) mal('Probabilidad: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Probabilidad: ${C.ejemplos.length} ejemplos en la página con MathML, diagrama y errores, sin errores de consola`);
  };
};
