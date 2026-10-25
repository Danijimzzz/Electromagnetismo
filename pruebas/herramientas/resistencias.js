/* Comprobación de resistencias: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo resistencias ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  global.Herramienta = global.Herramienta || require(path.join(fuente, 'herramienta.js'));
  const ResistenciasC = require(path.join(fuente, 'resistencias', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Resistencias · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => ResistenciasC.resolver(ResistenciasC.ejemplos.find((e) => e.clave === c).sc);
    cerca(r('cuatro').R, 4700, 0, 'amarillo violeta rojo'); cerca(r('cuatro').min, 4465, 1e-9, 'mínimo con ±5 %'); cerca(r('cuatro').max, 4935, 1e-9, 'máximo con ±5 %');
    cerca(r('baja').R, 2.2, 1e-12, 'multiplicador oro'); cerca(r('cinco').R, 1000, 0, '5 bandas'); cerca(r('tres').tol, 20, 0, '3 bandas: ±20 %');
    if (r('seis').tc !== 100) mal('Resistencias: la sexta banda marrón no da 100 ppm/K');
    if (r('cuatro').serie !== 'E6' || ResistenciasC.normalizado(4990).exacta !== 'E96' || ResistenciasC.normalizado(5000).exacta !== null) mal('Resistencias: las series normalizadas no se reconocen bien');
    // ida y vuelta: del valor a los colores y de los colores al valor
    for (const [v, n] of [['4k7', 4], ['0R47', 4], ['2M2', 4], ['12,4k', 5], ['332', 5], ['1', 4]]) {
      const ida = ResistenciasC.valor({ valor: v, bandas: String(n) }), sc = { modo: 'colores', bandas: String(n) };
      ida.bandas.forEach((k, i) => { sc[`b${i + 1}`] = k; });
      cerca(ResistenciasC.colores(sc).R, ResistenciasC.leeValor(v), 1e-9 * ida.R, `ida y vuelta de ${v}`);
    }
    const raro = r('valor-raro');
    cerca(raro.Rn, 4700, 0, '5000 Ω en la E12'); cerca(raro.err, -6, 1e-9, 'diferencia con el normalizado');
    cerca(ResistenciasC.valor({ valor: '5000', bandas: '5', serie: 'E96' }).Rn, 4990, 0, '5000 Ω en la E96');
    cerca(ResistenciasC.valor({ valor: '980', bandas: '4', serie: 'E12' }).Rn, 1000, 0, '980 Ω pasa a la década siguiente');
    if (ResistenciasC.SERIES.E96.length !== 96 || ResistenciasC.SERIES.E48.length !== 48) mal('Resistencias: las series E48 y E96 no tienen 48 y 96 valores');
    cerca(r('smd-472').R, 4700, 0, 'SMD 472'); cerca(r('smd-4r7').R, 4.7, 1e-12, 'SMD 4R7'); cerca(r('smd-eia').R, 10000, 0, 'EIA-96 01C');
    cerca(ResistenciasC.smd({ codigo: '1002' }).R, 10000, 0, 'SMD 1002'); cerca(ResistenciasC.smd({ codigo: '68X' }).R, 49.9, 1e-9, 'EIA-96 68X');
    for (const [sc, q] of [[{ modo: 'colores', bandas: '4', b1: 'negro', b2: 'rojo', b3: 'rojo', b4: 'oro' }, 'primera banda negra'], [{ modo: 'colores', bandas: '4', b1: 'oro', b2: 'rojo', b3: 'rojo', b4: 'oro' }, 'oro como cifra'], [{ modo: 'colores', bandas: '4', b1: 'rojo', b2: 'rojo', b3: 'rojo', b4: 'blanco' }, 'blanco como tolerancia'], [{ modo: 'valor', valor: 'abc' }, 'valor sin sentido'], [{ modo: 'smd', codigo: 'XYZ' }, 'código SMD sin sentido']]) {
      let ok = false; try { ResistenciasC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Resistencias: ${q} no da error`);
    }
    // al revés: 4,99 kΩ ±1 % leído desde el otro extremo
    const rv = r('reves'); if (!rv.aviso || rv.reves !== 4990) mal('Resistencias: no avisa de que marrón, marrón, blanco, blanco, amarillo es 4,99 kΩ al revés');
    if (r('cuatro').aviso) mal('Resistencias: avisa de lectura al revés en una resistencia normal');
    { let m = ''; try { ResistenciasC.colores({ bandas: '4', b1: 'oro', b2: 'rojo', b3: 'violeta', b4: 'amarillo' }); } catch (e) { m = e.message; } if (!/al revés/.test(m)) mal('Resistencias: oro en la primera banda no dice que está al revés'); }
    const bo = r('bobina'); cerca(bo.R, 10, 1e-12, 'bobina de 10 μH'); cerca(bo.tol, 10, 0, 'bobina ±10 %');
    cerca(r('cond-104').C, 100e-9, 1e-20, 'condensador 104'); if (r('cond-104').V !== 100 || r('cond-104').tol !== '±10 %') mal('Resistencias: 104K 2A no da ±10 % y 100 V');
    cerca(r('cond-4n7').C, 4.7e-9, 1e-20, 'condensador 4n7'); cerca(ResistenciasC.condensador({ codigo: '479' }).C, 4.7e-12, 1e-22, 'condensador 479 (×0,1)'); cerca(ResistenciasC.condensador({ codigo: '47p' }).C, 47e-12, 1e-22, '47p'); cerca(ResistenciasC.condensador({ codigo: '2,2uF' }).C, 2.2e-6, 1e-15, '2,2uF');
    // asociación a mano: 220 ‖ 330 = 132, + 100 = 232 Ω; con 12 V, I = 12/232
    const as = r('asoc'); cerca(as.R, 232, 1e-9, '100 + (220 ‖ 330)'); cerca(as.I, 12 / 232, 1e-12, 'corriente de la asociación');
    cerca(r('asoc-iguales').R, 1000 / 3 + 4700, 1e-9, 'tres iguales en paralelo + 4k7');
    cerca(ResistenciasC.asociacion({ expr: '1k + 2k || 2k' }).R, 2000, 1e-9, 'el paralelo va antes que la suma');
    for (const ex of ['100 +', '(100 + 200', '100 ** 2', '']) { let ok = false; try { ResistenciasC.asociacion({ expr: ex }); } catch (e) { ok = true; } if (!ok) mal(`Resistencias: la asociación «${ex}» no da error`); }
    const pa = r('pareja'); cerca(pa.p.x, 5000, 1e-9, '5 kΩ = 10k ‖ 10k'); if (pa.mejor !== 'en paralelo') mal('Resistencias: para 5 kΩ la mejor no es en paralelo');
    // LED: (9 − 2)/0,02 = 350 Ω → 390 Ω de la E12, I = 7/390
    const le = r('led'); cerca(le.R, 350, 1e-9, 'resistencia del LED'); cerca(le.Rn, 390, 0, 'normalizada de arriba'); cerca(le.I, 7 / 390, 1e-12, 'corriente con la normalizada');
    // divisor 12 → 5 V: 4k7 y 3k3 dan 12·3,3/8 = 4,95 V
    const dv = r('divisor'); cerca(dv.V, 12 * dv.R2 / (dv.R1 + dv.R2), 1e-12, 'salida del divisor'); if (Math.abs(dv.V - 5) > 0.06) mal(`Resistencias: el divisor de 12 a 5 V da ${dv.V} V`);
    cerca(ResistenciasC.divisor({ Vin: '12', Vout: '5', Rt: '10k', serie: 'E12', RL: '3k3' }).Vc, 12 * (1650) / (4700 + 1650), 1e-9, 'divisor con carga');
    if (fallos === antes) console.log(`  ✓ Código de colores: ${ResistenciasC.ejemplos.length} ejemplos, 3 a 6 bandas, ida y vuelta valor ↔ colores, series E, SMD, lectura al revés, bobinas, condensadores, asociación, pareja, LED, divisor y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'circuitos', 'resistencias', 'index.html'));
      await page.waitForFunction(() => window.ResistenciasApp);
      const antes = fallos;
      const verR = (await page.locator('#ver').textContent()).trim();
      if (verR !== Version.de('resistencias').current) mal(`Resistencias: la página muestra la versión «${verR}», se esperaba ${Version.de('resistencias').current}`);
      for (const e of ResistenciasC.ejemplos) {
        await page.evaluate((c) => ResistenciasApp.abrirEjemplo(c), e.clave);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, svg: !!document.querySelector('#dibujo svg') }));
        if (r.err || !r.pasos || r.res < 2 || r.dolar) mal(`Resistencias · ${e.clave}: falta el resultado o el desarrollo`);
        if (r.svg !== ['colores', 'valor'].includes(e.sc.modo)) mal(`Resistencias · ${e.clave}: el dibujo de la resistencia ${r.svg ? 'sale y no debería' : 'no sale'}`);
      }
      // elegir colores con los botones
      await page.evaluate(() => ResistenciasApp.abrirEjemplo('mil'));
      await page.click('.chip[data-b="b3"][data-c="naranja"]');
      if (!(await page.locator('#resumen').textContent()).includes('10 kΩ')) mal('Resistencias: al pulsar naranja en el multiplicador no sale 10 kΩ');
      if ((await page.locator('#dibujo rect').count()) !== 4) mal('Resistencias: el dibujo no tiene 4 bandas');
      await page.selectOption('#f-bandas', '6');
      if ((await page.locator('.banda').count()) !== 6 || !(await page.locator('#error').isHidden())) mal('Resistencias: al pasar a 6 bandas no salen 6 o da error');
      await page.selectOption('#f-modo', 'valor');
      await page.fill('#f-valor', '2k2');
      if (!(await page.locator('#colores-res').textContent()).includes('rojo rojo rojo oro')) mal('Resistencias: 2k2 no sale rojo, rojo, rojo, oro');
      await page.fill('#f-valor', 'hola');
      if (await page.locator('#error').isHidden()) mal('Resistencias: un valor sin sentido no muestra el error');
      await page.evaluate(() => ResistenciasApp.abrirEjemplo('reves'));
      if (!(await page.locator('#colores-res').textContent()).includes('al revés')) mal('Resistencias: no sale el aviso de lectura al revés');
      await page.selectOption('#f-modo', 'asociacion');
      await page.fill('#f-expr', '(10k || 10k) + 1k');
      if (!(await page.locator('#resumen').textContent()).includes('6 kΩ')) mal('Resistencias: (10k ‖ 10k) + 1k no da 6 kΩ en la página');
      await page.selectOption('#f-modo', 'colores'); await page.selectOption('#f-comp', 'L');
      if (!(await page.locator('#resumen').textContent()).includes('μH') || (await page.locator('.banda').count()) !== 4) mal('Resistencias: la bobina no sale en μH con 4 bandas');
      await page.close();
      if (consola.length) mal('Resistencias: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Código de colores: ${ResistenciasC.ejemplos.length} ejemplos, dibujo, botones de colores, 6 bandas, valor a colores y errores sin errores de consola`);
    }
  };
};
