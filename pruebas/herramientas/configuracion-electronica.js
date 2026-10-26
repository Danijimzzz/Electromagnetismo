/* Comprobación de configuracion-electronica: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo configuracion-electronica ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Configuracion = require(path.join(fuente, 'quimica', 'configuracion.js'));
  {
    // configuraciones, desapareados y números cuánticos de referencia (convenio m_l de −l a +l, primero s = +½)
    const antes = fallos;
    const REF = {
      Fe: ['[Ar] 4s² 3d⁶', 4, '3,2,-2,−½'], Cr: ['[Ar] 4s¹ 3d⁵', 6, '3,2,2,+½'], Cu: ['[Ar] 4s¹ 3d¹⁰', 1, '3,2,2,−½'],
      'Fe^2+': ['[Ar] 3d⁶', 4, '3,2,-2,−½'], 'Cu+': ['[Ar] 3d¹⁰', 0, '3,2,2,−½'], 'Cl-': ['[Ar]', 0, '3,1,1,−½'],
      O: ['[He] 2s² 2p⁴', 2, '2,1,-1,−½'], N: ['[He] 2s² 2p³', 3, '2,1,1,+½'], Ar: ['[Ne] 3s² 3p⁶', 0, '3,1,1,−½'], hierro: ['[Ar] 4s² 3d⁶', 4, '3,2,-2,−½'],
    };
    for (const [x, [ab, d, qn]] of Object.entries(REF)) {
      const r = Configuracion.analizar(x), q = r.diferenciador;
      if (r.abreviada !== ab) mal(`Configuración · ${x}: ${r.abreviada}, se esperaba ${ab}`);
      if (r.desapareados !== d) mal(`Configuración · ${x}: ${r.desapareados} desapareados, se esperaban ${d}`);
      if ([q.n, q.l, q.ml, q.ms].join(',') !== qn) mal(`Configuración · ${x}: números cuánticos ${[q.n, q.l, q.ml, q.ms]}, se esperaban ${qn}`);
    }
    if (Configuracion.analizar('Cr^3+').excepcion) mal('Configuración: el aviso de excepción es solo para el átomo neutro');
    if (Configuracion.analizar('Pt').cambio.esperada !== '6s² 5d⁸' || Configuracion.analizar('Pt').cambio.real !== '6s¹ 5d⁹') mal('Configuración: la excepción del platino debería ser 6s² 5d⁸ → 6s¹ 5d⁹');
    if (!Configuracion.analizar('Cr').excepcion || Configuracion.analizar('Fe').excepcion) mal('Configuración: el cromo es una excepción y el hierro no');
    for (const z of [1, 26, 57, 92, 118]) { const r = Configuracion.analizar(String(z)); if (r.capas.reduce((a, b) => a + b, 0) !== z) mal(`Configuración · Z = ${z}: las capas no suman ${z} electrones`); }
    // electrones de valencia, Slater, isoelectrónicos, configuración al revés y números cuánticos (a mano)
    const VAL = { Fe: 8, 'Fe^2+': 6, Cl: 7, Zn: 12, Na: 1, Ce: 4 };
    for (const [x, n] of Object.entries(VAL)) if (Configuracion.analizar(x).valencia.n !== n) mal(`Configuración · ${x}: ${Configuracion.analizar(x).valencia.n} electrones de valencia, se esperaban ${n}`);
    const ZEF = { Na: 2.2, Cl: 6.1, Fe: 3.75, 'Fe^2+': 6.25, Ne: 5.85, K: 2.2 };
    for (const [x, z] of Object.entries(ZEF)) if (Math.abs(Configuracion.analizar(x).slater.Zef - z) > 1e-9) mal(`Configuración · ${x}: Z_ef ${Configuracion.analizar(x).slater.Zef}, se esperaba ${z}`);
    if (Configuracion.analizar('Ne').isoelectronicos.map((i) => i.simbolo).join(' ') !== 'N O F Ne Na Mg Al') mal('Configuración: los isoelectrónicos del neón deberían ser N³⁻ … Al³⁺');
    const ID = { '1s2 2s2 2p6 3s1': ['fundamental', 'Na'], '[Ar] 4s2 3d5': ['fundamental', 'Mn'], '1s2 2s1 2p1': ['excitada', 'Be'], '[Ar] 3d6': ['excitada', 'Cr'], '1s2 2s2 2p7': ['imposible'], '2d1': ['imposible'] };
    for (const [t, [tipo, el]] of Object.entries(ID)) { const r = Configuracion.identificar(t); if (r.tipo !== tipo || (el && r.el.simbolo !== el)) mal(`Configuración · «${t}»: ${r.tipo} ${r.el?.simbolo}`); }
    const NQ = [[{ n: 3, l: 2, ml: -2, ms: '+1/2' }, '3d'], [{ n: 2, l: 2, ml: 0, ms: '-1/2' }, null], [{ n: 1, l: 0, ml: 1, ms: '1/2' }, null], [{ n: 4, l: 3, ml: 3, ms: '−½' }, '4f'], [{ n: 4, l: 1, ml: 0, ms: '0' }, null]];
    for (const [q, o] of NQ) if (Configuracion.cuanticos(q).orbital !== o) mal(`Configuración · números cuánticos ${JSON.stringify(q)}: ${Configuracion.cuanticos(q).orbital}`);
    for (const mala of ['Xx', 'Na11+', '']) { let ok = false; try { Configuracion.analizar(mala); } catch (e) { ok = true; } if (!ok) mal(`Configuración: «${mala}» debería dar un error`); }
    if (fallos === antes) console.log(`  ✓ Configuración electrónica: ${Object.keys(REF).length} elementos e iones de referencia, excepciones y errores de entrada`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'quimica', 'configuracion-electronica', 'index.html') + '#Cu');
      await page.waitForFunction(() => window.ConfigApp);
      const antes = fallos;
      const verC = (await page.locator('#ver').textContent()).trim();
      if (verC !== Version.de('configuracion-electronica').current) mal(`Configuración: la página muestra la versión «${verC}», se esperaba ${Version.de('configuracion-electronica').current}`);
      if ((await page.locator('#abreviada').textContent()) !== '[Ar] 4s¹ 3d¹⁰' || (await page.locator('#excepcion').isHidden())) mal('Configuración: #Cu no muestra el cobre con su excepción');
      for (const x of [...Configuracion.ejemplos, '118', 'H']) await page.evaluate((x) => ConfigApp.muestra(x), x);
      await page.evaluate(() => ConfigApp.muestra('Fe'));
      if ((await page.locator('#orbitales .caja').count()) !== 15) mal('Configuración: el hierro debería tener 15 orbitales dibujados');
      await page.fill('#entrada', 'Qq');
      if (await page.locator('#error').isHidden()) mal('Configuración: un símbolo que no existe no muestra el error');
      await page.close();
      if (consola.length) mal('Configuración: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log('  ✓ Configuración electrónica: dirección #Cu, ejemplos y errores sin errores de consola');
    }
  };
};
