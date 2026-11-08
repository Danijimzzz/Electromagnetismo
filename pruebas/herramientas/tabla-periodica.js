/* Comprobación de tabla-periodica: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo tabla-periodica ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  // tabla periódica: 118 elementos, cada uno en su casilla, y configuraciones de referencia
  const Elementos = require(path.join(fuente, 'quimica', 'elementos.js'));
  {
    const antes = fallos, L = Elementos.lista;
    if (L.length !== 118 || L.some((e, i) => e.Z !== i + 1)) mal('Elementos: la lista no tiene los 118 elementos en orden');
    if (new Set(L.map((e) => e.fila + ',' + e.col)).size !== 118) mal('Elementos: hay dos elementos en la misma casilla');
    L.forEach((e) => { const n = Elementos.configuracion(e.Z).reduce((s, o) => s + o.e, 0); if (n !== e.Z) mal(`Elementos · ${e.simbolo}: la configuración tiene ${n} electrones`); });
    const REF = { H: '1s¹', O: '[He] 2s² 2p⁴', Cr: '[Ar] 3d⁵ 4s¹', Fe: '[Ar] 3d⁶ 4s²', Cu: '[Ar] 3d¹⁰ 4s¹', Pd: '[Kr] 4d¹⁰', Ag: '[Kr] 4d¹⁰ 5s¹', Gd: '[Xe] 4f⁷ 5d¹ 6s²', Au: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', U: '[Rn] 5f³ 6d¹ 7s²' };
    for (const [s, c] of Object.entries(REF)) { const o = Elementos.abreviada(Elementos.porSimbolo[s].Z); if (o !== c) mal(`Elementos · ${s}: configuración ${o}, se esperaba ${c}`); }
    const fe2 = Elementos.texto(Elementos.configuracion(26, 2));
    if (fe2 !== '1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶') mal(`Elementos · Fe²⁺: ${fe2}`);
    const g = (s) => Elementos.porSimbolo[s];
    if (g('Fe').grupo !== 8 || g('Fe').periodo !== 4 || g('Rn').grupo !== 18 || g('Ba').grupo !== 2 || g('Lu').grupo !== null) mal('Elementos: grupos o periodos mal colocados');
    // propiedades físicas: valores de tabla de referencia
    const P = { Fe: [1538, 2862, 7.874, 15.7], O: [-218.79, -182.96, 0.001429, 141], Hg: [-38.83, 356.73, 13.534, 0], Cl: [-101.5, -34.04, 0.003214, 348.6] };
    for (const [s, [tf, te, d, ae]] of Object.entries(P)) { const e = g(s); if (e.fusion !== tf || e.ebullicion !== te || e.densidad !== d || e.ae !== ae) mal(`Elementos · ${s}: propiedades físicas ${e.fusion}, ${e.ebullicion}, ${e.densidad}, ${e.ae}`); }
    if (!g('He').aeInestable || !(g('Cl').ae > g('F').ae)) mal('Elementos: afinidades del He o del Cl mal');
    if (g('Fe').oxidacion !== '+2, +3' || g('Os').densidad !== 22.59 || L.filter((e) => e.Z <= 99 && e.Z !== 85 && e.Z !== 87 && e.densidad == null).length) mal('Elementos: faltan estados de oxidación o densidades');
    if (L.some((e) => e.fusion != null && e.ebullicion != null && e.ebullicion <= e.fusion)) mal('Elementos: algún elemento hierve por debajo de su punto de fusión');
    if (fallos === antes) console.log('  ✓ Tabla periódica: 118 elementos en su casilla, configuraciones de referencia y propiedades físicas correctas');
  }

  return async (browser) => {
    // tabla periódica: todos los modos de color y la ficha de varios elementos sin errores de consola
    {
      const { page, consola } = await pagina(browser, 1400, 900);
      await page.goto('file://' + path.join(publico, 'quimica', 'tabla-periodica', 'index.html') + '#Cu');
      await page.waitForFunction(() => window.TablaApp);
      const antes = fallos;
      if (!(await page.locator('#ficha').textContent()).includes('Cobre')) mal('Tabla periódica: #Cu no abre la ficha del cobre');
      const verT = (await page.locator('#ver').textContent()).trim();
      if (verT !== Version.de('tabla-periodica').current) mal(`Tabla periódica: la página muestra la versión «${verT}», se esperaba ${Version.de('tabla-periodica').current}`);
      if ((await page.locator('.el:not(.hueco)').count()) !== 118) mal('Tabla periódica: no se dibujan las 118 casillas');
      for (const m of ['en', 'ei', 'radio', 'ae', 'masa', 'densidad', 'fusion', 'ebullicion', 'bloque', 'estado', 'cat']) await page.evaluate((m) => TablaApp.colorea(m), m);
      for (const z of [1, 26, 57, 92, 118]) await page.evaluate((z) => TablaApp.elige(z), z);
      await page.fill('#buscar', 'hierro');
      if (!(await page.locator('#ficha').textContent()).includes('Hierro')) mal('Tabla periódica: buscar «hierro» no abre su ficha');
      await page.fill('#buscar', '');
      const fe = await page.locator('#ficha').textContent();
      if (!fe.includes('1538 °C') || !fe.includes('+2, +3') || !fe.includes('7,874 g/cm³')) mal('Tabla periódica: la ficha del hierro no tiene fusión, oxidación o densidad');
      if ((await page.locator('#ficha a[href="../configuracion-electronica/#Fe"]').count()) !== 1 || (await page.locator('#ficha a[href="../masa-molar/#Fe"]').count()) !== 1) mal('Tabla periódica: faltan los botones a Configuración y Masa molar');
      await page.click('#comparar'); await page.evaluate(() => TablaApp.elige(29)); await page.click('#comparar'); await page.evaluate(() => TablaApp.elige(47)); await page.click('#comparar');
      if ((await page.locator('#comparacion th').count()) !== 4 || (await page.locator('#comparacion td.max').count()) < 5) mal('Tabla periódica: la comparación de Fe, Cu y Ag no sale');
      await page.click('#comparacion [data-quita="29"]');
      if ((await page.locator('#comparacion th').count()) !== 3) mal('Tabla periódica: quitar un elemento de la comparación no lo quita');
      await page.evaluate(() => TablaApp.elige(71));
      if (!(await page.locator('#ficha').textContent()).includes('IUPAC')) mal('Tabla periódica: el lutecio no lleva la nota del grupo 3');
      for (let i = 0; i < 25; i++) {
        const q = await page.evaluate(() => TablaApp.pregunta());
        if (!(await page.evaluate((r) => TablaApp.responde(r), q.solucion.replace(/^grupo (\d+), periodo (\d+)$/, '$1 y $2').replace(/ \(.*$/, '')))) mal(`Tabla periódica: la solución no se da por buena en «${q.texto}» (${q.solucion})`);
        if (await page.evaluate(() => TablaApp.responde('zzz'))) mal(`Tabla periódica: «zzz» se da por bueno en «${q.texto}»`);
      }
      // TP-1: estado según la temperatura (Hg líquido a 298 K, sólido a 200 K, gas a 700 K; Fe líquido a 2000 K; W sólido a 3000 K y gas a 6000 K)
      await page.evaluate(() => TablaApp.temperatura(298));
      const estT = (s, K) => page.evaluate(([s, K]) => TablaApp.estadoA(Elementos.porSimbolo[s], K), [s, K]);
      for (const [s, K, st] of [['Hg', 298, 'líquido'], ['Hg', 200, 'sólido'], ['Hg', 700, 'gas'], ['Fe', 2000, 'líquido'], ['W', 3000, 'sólido'], ['W', 6000, 'gas'], ['Br', 270, 'líquido'], ['Br', 250, 'sólido'], ['Ga', 303, 'líquido'], ['H', 10, 'sólido'], ['H', 18, 'líquido'], ['O', 100, 'gas'], ['O', 80, 'líquido'], ['Og', 300, null]]) { const o = await estT(s, K); if (o !== st) mal(`Tabla periódica · estado de ${s} a ${K} K: ${o}, se esperaba ${st}`); }
      if ((await page.locator('#ctl-temp').isHidden())) mal('Tabla periódica: el control de temperatura no aparece al elegir «Estado según la temperatura»');
      await page.fill('#temp-n', '1500');
      const cel = async (s) => (await page.locator(`.el:has(.s:text-is("${s}")) .v`).textContent()).trim();
      if ((await cel('Fe')) !== 'S · sólido' || (await cel('Hg')) !== 'G · gas' || (await cel('Ga')) !== 'L · líquido') mal(`Tabla periódica: a 1500 K se esperaba Fe sólido, Hg gas y Ga líquido (sale ${await cel('Fe')}, ${await cel('Hg')}, ${await cel('Ga')})`);
      if (!(await page.locator('#temp-txt').textContent()).includes('1226,85')) mal('Tabla periódica: la temperatura en °C no sale (1500 K = 1226,85 °C)');
      if ((await page.locator('#leyenda').textContent()).includes('NaN')) mal('Tabla periódica: la leyenda de temperatura sale mal');
      await page.evaluate(() => TablaApp.colorea('cat'));
      // TP-3: capa de valencia, desapareados e iones habituales
      await page.evaluate(() => TablaApp.elige(26));
      const f26 = await page.locator('#ficha').textContent();
      if (!f26.includes('3d⁶ 4s²') || !f26.includes('Electrones de valencia8') || !f26.includes('Desapareados4 (paramagnético)') || !f26.includes('Fe2+')) mal('Tabla periódica: la ficha del hierro no resume la capa de valencia');
      const ion = async (z) => { await page.evaluate((z) => TablaApp.elige(z), z); return (await page.locator('#ficha dt:text-is("Iones habituales") + dd').textContent()).replace(/\s+/g, ' '); };
      const i26 = await ion(26), i17 = await ion(17), i10 = await ion(10), i11 = await ion(11);
      if (!i26.includes('[Ar] 3d⁶ ·') || !i26.includes('[Ar] 3d⁵') || !i17.includes('[Ar]') || !i11.includes('[He] 2s² 2p⁶') && !i11.includes('[Ne]') || !i10.includes('no forma')) mal(`Tabla periódica: iones habituales mal (Fe: ${i26}; Cl: ${i17}; Ne: ${i10}; Na: ${i11})`);
      await page.setViewportSize({ width: 390, height: 800 });
      if (await page.locator('.el .v').first().isVisible()) mal('Tabla periódica: en el móvil las casillas siguen mostrando el valor');
      const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
      if (ancho > 392) mal(`Tabla periódica: a 390 px la página se sale de ancho (${ancho} px)`);
      // los botones abren el elemento en las otras herramientas
      await page.goto('file://' + path.join(publico, 'quimica', 'masa-molar', 'index.html') + '#Fe');
      await page.waitForFunction(() => window.MasaApp);
      if ((await page.locator('#formula').inputValue()) !== 'Fe') mal('Masa molar: #Fe en la dirección no abre el hierro');
      await page.goto('file://' + path.join(publico, 'quimica', 'configuracion-electronica', 'index.html') + '#Cu');
      await page.waitForFunction(() => window.ConfigApp);
      if ((await page.locator('#entrada').inputValue()) !== 'Cu' || (await page.locator('#s-el').isHidden())) mal('Configuración: #Cu en la dirección no abre el cobre en su pestaña');
      await page.close();
      if (consola.length) mal('Tabla periódica: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log('  ✓ Tabla periódica: 118 casillas, colores (también por afinidad, densidad y fusión), fichas, buscador, enlaces a otras herramientas, comparación, preguntas que se corrigen y móvil sin errores de consola');
    }
  };
};
