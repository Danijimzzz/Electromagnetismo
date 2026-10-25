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
    if (fallos === antes) console.log('  ✓ Tabla periódica: 118 elementos en su casilla, configuraciones de referencia correctas');
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
      for (const m of ['en', 'ei', 'radio', 'masa', 'bloque', 'estado', 'cat']) await page.evaluate((m) => TablaApp.colorea(m), m);
      for (const z of [1, 26, 57, 92, 118]) await page.evaluate((z) => TablaApp.elige(z), z);
      await page.fill('#buscar', 'hierro');
      if (!(await page.locator('#ficha').textContent()).includes('Hierro')) mal('Tabla periódica: buscar «hierro» no abre su ficha');
      await page.close();
      if (consola.length) mal('Tabla periódica: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log('  ✓ Tabla periódica: 118 casillas, colores, fichas y buscador sin errores de consola');
    }
  };
};
