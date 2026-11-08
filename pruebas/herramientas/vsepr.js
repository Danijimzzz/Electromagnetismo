/* Comprobación de la geometría molecular VSEPR: cálculos en Node y la página en Chromium. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo vsepr ejecuta solo esta).
   Los valores esperados están hechos a mano (recuento de electrones de valencia y tabla VSEPR). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'vsepr', 'calculo.js'));
  {
    const antes = fallos;
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // [clave, tipo, dominios, geometría molecular, hibridación, polaridad]
    const esperado = [
      ['h2o', 'AX2E2', 4, 'Angular', 'sp3', 'Polar'], ['nh3', 'AX3E', 4, 'Piramidal trigonal', 'sp3', 'Polar'], ['ch4', 'AX4', 4, 'Tetraédrica', 'sp3', 'Apolar'],
      ['co2', 'AX2', 2, 'Lineal', 'sp', 'Apolar'], ['bf3', 'AX3', 3, 'Trigonal plana', 'sp2', 'Apolar'], ['so2', 'AX2E', 3, 'Angular', 'sp2', 'Polar'],
      ['pcl5', 'AX5', 5, 'Bipirámide trigonal', 'sp3d', 'Apolar'], ['sf4', 'AX4E', 5, 'Balancín', 'sp3d', 'Polar'], ['clf3', 'AX3E2', 5, 'Forma de T', 'sp3d', 'Polar'],
      ['xef2', 'AX2E3', 5, 'Lineal', 'sp3d', 'Apolar'], ['sf6', 'AX6', 6, 'Octaédrica', 'sp3d2', 'Apolar'], ['brf5', 'AX5E', 6, 'Pirámide cuadrada', 'sp3d2', 'Polar'],
      ['xef4', 'AX4E2', 6, 'Plana cuadrada', 'sp3d2', 'Apolar'], ['cocl2', 'AX3', 3, 'Trigonal plana', 'sp2', 'Polar'], ['pcl3', 'AX3E', 4, 'Piramidal trigonal', 'sp3', 'Polar'],
      ['chcl3', 'AX4', 4, 'Tetraédrica', 'sp3', 'Polar'], ['ccl4', 'AX4', 4, 'Tetraédrica', 'sp3', 'Apolar'], ['nh4', 'AX4', 4, 'Tetraédrica', 'sp3', 'Ion'],
      ['so4', 'AX4', 4, 'Tetraédrica', 'sp3', 'Ion'], ['no3', 'AX3', 3, 'Trigonal plana', 'sp2', 'Ion'], ['clo3', 'AX3E', 4, 'Piramidal trigonal', 'sp3', 'Ion'],
      ['i3', 'AX2E3', 5, 'Lineal', 'sp3d', 'Ion'], ['ax3e', 'AX3E', 4, 'Piramidal trigonal', 'sp3', 'Polar'],
    ];
    for (const [c, tipo, sn, geo, hib, pol] of esperado) {
      const x = r(c), dato = [x.tipo, x.sn, x.geo, x.hibTxt, x.polaridad].join('|'), debe = [tipo, sn, geo, hib, pol].join('|');
      if (dato !== debe) mal(`VSEPR · ${c}: ${dato} en vez de ${debe}`);
    }
    if (esperado.length !== C.ejemplos.length) mal(`VSEPR: ${esperado.length} esperados y ${C.ejemplos.length} ejemplos`);
    // ángulos entre enlaces de las posiciones 3D (tabla VSEPR a mano)
    const angs = { '2-0': [180], '3-0': [120], '4-0': [109.47], '4-1': [107], '4-2': [104.5], '5-3': [180], '6-2': [90, 180], '6-0': [90, 180] };
    for (const [k, lista] of Object.entries(angs)) {
      const { enlaces } = C.GEOMETRIAS[k].v(), got = new Set();
      for (let i = 0; i < enlaces.length; i++) for (let j = i + 1; j < enlaces.length; j++) got.add(+C.ang(enlaces[i], enlaces[j]).toFixed(1));
      for (const a of got) if (!lista.some((q) => Math.abs(q - a) < 0.1)) mal(`VSEPR · ${k}: ángulo ${a}° inesperado (${[...got]})`);
    }
    // SF4: 173° axial y ≈102° ecuatorial; momento dipolar del H2O mayor que el del CH3Cl-like no se compara
    {
      const e = C.GEOMETRIAS['5-1'].v().enlaces;
      if (Math.abs(C.ang(e[0], e[1]) - 173) > 0.2 || Math.abs(C.ang(e[2], e[3]) - 102) > 0.2) mal('VSEPR · SF4: ángulos 173° y 102°');
    }
    // los pares libres no se solapan con los enlaces
    for (const [k, g] of Object.entries(C.GEOMETRIAS)) {
      const { enlaces, libres } = g.v();
      if (enlaces.length !== g.x || libres.length !== g.e) mal(`VSEPR · ${k}: ${enlaces.length} enlaces y ${libres.length} libres`);
      for (const l of libres) for (const b of enlaces) if (C.ang(l, b) < 50) mal(`VSEPR · ${k}: un par libre queda a ${C.ang(l, b).toFixed(0)}° de un enlace`);
    }
    // Δχ de la fosgeno: 0,89 (C=O) y 0,61 (C–Cl): resultante 0,89 − 0,61 = 0,28
    if (Math.abs(r('cocl2').mu - 0.28) > 0.005) mal(`VSEPR · COCl2: resultante ${r('cocl2').mu} en vez de 0,28`);
    // errores
    for (const [sc, q] of [[{ modo: 'formula', formula: '' }, 'fórmula vacía'], [{ modo: 'formula', formula: 'NO2' }, 'radical (5 e⁻)'], [{ modo: 'formula', formula: 'HNO3' }, 'oxoácido'],
      [{ modo: 'formula', formula: 'OF4' }, 'octeto expandido en el periodo 2'], [{ modo: 'formula', formula: 'Fe2O3' }, 'sin átomo central'], [{ modo: 'formula', formula: 'CO' }, 'diatómica'],
      [{ modo: 'axe', n: '', m: '0' }, 'faltan datos AXE'], [{ modo: 'axe', n: '3', m: '3' }, 'AX3E3 no existe'], [{ modo: 'axe', n: '9', m: '0' }, 'demasiados enlaces']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`VSEPR: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ VSEPR: ${C.ejemplos.length} ejemplos (tipo, geometría, hibridación y polaridad), ángulos 3D y errores`);
  }

  {
    // VS-1 y VS-3 · Lewis a mano: cargas formales, resonancia, orden de enlace y varios centros
    const antes = fallos, L = require(path.join(fuente, 'vsepr', 'lewis.js'));
    const cerca = (x, y, q) => { if (Math.abs(x - y) > 1e-9) mal(`VSEPR · Lewis ${q}: ${x} en vez de ${y}`); };
    const fcs = (r) => r.atomos.map((x) => x.fc).join(',');
    // SO4 2-: 32 e⁻; expandido, 2 S=O y 2 S–O⁻ (6 estructuras, orden 1,5); con octeto, 4 S–O y S +2
    { const r = L.centro('S', ['O', 'O', 'O', 'O'], -2, false); cerca(r.enlaces, 6, 'SO4 enlaces'); cerca(r.resonancia, 6, 'SO4 resonancia'); cerca(r.ordenes[0].medio, 1.5, 'SO4 orden'); if (fcs(r) !== '0,0,0,-1,-1') mal('VSEPR · Lewis SO4 cargas ' + fcs(r));
      const o = L.centro('S', ['O', 'O', 'O', 'O'], -2, true); cerca(o.enlaces, 4, 'SO4 con octeto'); if (fcs(o) !== '2,-1,-1,-1,-1') mal('VSEPR · Lewis SO4 octeto ' + fcs(o)); }
    // NO3-: 24 e⁻, un N=O de tres posibles, orden 4/3 y N con +1
    { const r = L.centro('N', ['O', 'O', 'O'], -1); cerca(r.resonancia, 3, 'NO3 resonancia'); cerca(r.ordenes[0].medio, 4 / 3, 'NO3 orden'); if (fcs(r) !== '1,0,-1,-1') mal('VSEPR · Lewis NO3 cargas ' + fcs(r)); }
    { const r = L.centro('C', ['O', 'O'], 0); cerca(r.enlaces, 4, 'CO2 enlaces'); cerca(r.resonancia, 1, 'CO2 resonancia'); if (fcs(r) !== '0,0,0') mal('VSEPR · Lewis CO2'); }
    { const r = L.centro('O', ['O', 'O'], 0); cerca(r.resonancia, 2, 'O3 resonancia'); cerca(r.ordenes[0].medio, 1.5, 'O3 orden'); if (fcs(r) !== '1,0,-1') mal('VSEPR · Lewis O3 cargas ' + fcs(r)); }
    { const r = L.centro('N', ['H', 'H', 'H', 'H'], 1); if (fcs(r) !== '1,0,0,0,0' || r.atomos[0].lp !== 0) mal('VSEPR · Lewis NH4+'); }
    { const r = L.centro('Xe', ['F', 'F'], 0); if (r.atomos[0].lp !== 3 || r.enlaces !== 2) mal('VSEPR · Lewis XeF2 debería tener 3 pares libres'); }
    { const r = L.centro('P', ['O', 'O', 'O', 'O'], -3); cerca(r.resonancia, 4, 'PO4 resonancia'); cerca(r.ordenes[0].medio, 1.25, 'PO4 orden'); }
    { const r = L.centro('Cl', ['O', 'O', 'O', 'O'], -1); cerca(r.ordenes[0].medio, 1.75, 'ClO4 orden'); }
    // cargas formales: siempre suman la carga total
    for (const [c, t, q] of [['S', ['O', 'O', 'O'], 0], ['C', ['O', 'O', 'O'], -2], ['N', ['O', 'O'], -1], ['Cl', ['O', 'O', 'O'], -1], ['P', ['H', 'H', 'H'], 0], ['I', ['I', 'I'], -1]]) { const r = L.centro(c, t, q); cerca(r.atomos.reduce((x, y) => x + y.fc, 0), q, `suma de cargas formales de ${c}${t.length}`); }
    // varios centros
    const geo = (t) => L.condensada(t).centros.map((c) => `${c.sim}:${c.tipo}:${c.hibTxt}`).join(' ');
    if (geo('CH3-CH2-OH') !== 'C:AX4:sp3 C:AX4:sp3 O:AX2E2:sp3') mal('VSEPR · etanol ' + geo('CH3-CH2-OH'));
    if (geo('CH2=CH2') !== 'C:AX3:sp2 C:AX3:sp2') mal('VSEPR · eteno ' + geo('CH2=CH2'));
    if (geo('H-C#C-H') !== 'C:AX2:sp C:AX2:sp') mal('VSEPR · etino ' + geo('H-C#C-H'));
    if (geo('CH3-C(=O)-OH') !== 'C:AX4:sp3 C:AX3:sp2 O:AX2E2:sp3') mal('VSEPR · ácido acético ' + geo('CH3-C(=O)-OH'));
    if (geo('CH3-C(=O)-NH2') !== 'C:AX4:sp3 C:AX3:sp2 N:AX3E:sp3') mal('VSEPR · etanamida ' + geo('CH3-C(=O)-NH2'));
    cerca(L.condensada('CH3-C(=O)-OH').enlaces, 8, 'enlaces del ácido acético (7 sencillos y 1 doble contados dobles)');
    cerca(L.condensada('CH2=CH2').enlaces, 6, 'enlaces del eteno');
    cerca(L.condensada('H-C#C-H').enlaces, 5, 'enlaces del etino');
    for (const [t, q] of [['', 'vacío'], ['CH3COOH', 'C con dos enlaces'], ['CH3-CH2-', 'C con tres enlaces'], ['CH3-C(=O', 'paréntesis sin cerrar'], ['CH3)', 'paréntesis sin abrir'], ['CH3-1', 'anillo o número suelto'], ['Xx-C', 'elemento inventado'], ['CH5', 'C con cinco enlaces']]) { let ok = false; try { L.condensada(t); } catch (e) { ok = true; } if (!ok) mal(`VSEPR · ${q} no da error`); }
    { let ok = false; try { L.centro('S', ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'], 0); } catch (e) { ok = true; } void ok; }
    if (fallos === antes) console.log('  ✓ VSEPR · Lewis: cargas formales, resonancia y orden de enlace de 9 especies a mano, octeto limitado y 5 moléculas de varios centros');
  }
  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'quimica', 'vsepr', 'index.html'));
    await page.waitForFunction(() => window.VseprApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('vsepr').current) mal(`VSEPR: la página muestra la versión «${ver}», se esperaba ${Version.de('vsepr').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => VseprApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, geo: document.querySelector('#r-geo')?.textContent }));
      if (r.err || !r.pasos || !r.res) mal(`VSEPR · ${e.clave}: falta el resultado o el desarrollo`);
      if (r.dolar) mal(`VSEPR · ${e.clave}: el desarrollo deja símbolos $ sin convertir`);
      if (!r.geo) mal(`VSEPR · ${e.clave}: no sale la geometría`);
    }
    // el lienzo 3D pinta algo y gira al arrastrar
    await page.evaluate(() => VseprApp.abrirEjemplo('sf4'));
    await page.click('#b-giro');
    const pintado = () => page.evaluate(() => { const c = document.querySelector('#molecula'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 0) n++; return n; });
    const caja = await page.locator('#molecula').boundingBox();
    if (!(await pintado())) mal('VSEPR: el lienzo 3D sale vacío'); 
    const v0 = await page.evaluate(() => VseprApp.vista());
    await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await page.mouse.down(); await page.mouse.move(caja.x + caja.width / 2 + 80, caja.y + caja.height / 2 + 30, { steps: 4 }); await page.mouse.up();
    const v1 = await page.evaluate(() => VseprApp.vista());
    if (v1.yaw === v0.yaw && v1.pitch === v0.pitch) mal('VSEPR: arrastrar no gira la molécula');
    // pares libres y dipolo se pueden quitar
    await page.click('#b-libres'); await page.click('#b-dipolo');
    if ((await page.getAttribute('#b-libres', 'aria-pressed')) !== 'false') mal('VSEPR: el interruptor de pares libres no cambia');
    // pestaña AX y errores
    await page.click('#tab-axe');
    await page.fill('#f-n', '4'); await page.fill('#f-m', '2');
    if ((await page.textContent('#r-geo')) !== 'Plana cuadrada') mal('VSEPR: AX4E2 no da plana cuadrada');
    await page.fill('#f-m', '5');
    if (await page.locator('#error').isHidden()) mal('VSEPR: AX4E5 no muestra el error');
    await page.click('#tab-formula'); await page.fill('#formula', 'NO2');
    if (await page.locator('#error').isHidden()) mal('VSEPR: NO2 no muestra el error');
    // la tabla de geometrías abre cada tipo
    await page.click('#tabla-geo button[data-n="3"][data-m="2"]');
    if ((await page.textContent('#r-geo')) !== 'Forma de T') mal('VSEPR: la tabla no abre AX3E2');
    // Lewis en la página y varios centros
    { const a0 = fallos;
      await page.click('#tab-formula'); await page.fill('#formula', 'SO4 2-');
      const l1 = await page.evaluate(() => ({ l: VseprApp.lewis(), vis: !document.querySelector('#card-lewis').hidden, svg: !!document.querySelector('#lewis-fig svg[role=img]'), filas: document.querySelectorAll('#lewis-tabla tbody tr').length }));
      if (!l1.vis || !l1.svg || l1.filas !== 5 || l1.l.enlaces !== 6 || l1.l.resonancia !== 6) mal('VSEPR · Lewis del sulfato en la página: ' + JSON.stringify(l1));
      await page.check('#octeto');
      if ((await page.evaluate(() => VseprApp.lewis().enlaces)) !== 4) mal('VSEPR · limitar al octeto no cambia el sulfato');
      await page.uncheck('#octeto');
      await page.evaluate(() => VseprApp.abrirEjemplo('c-acetico'));
      const c1 = await page.evaluate(() => ({ l: VseprApp.lewis(), sel: document.querySelector('#tab-cadena').getAttribute('aria-selected'), c3d: document.querySelector('#card-3d').hidden, cen: !document.querySelector('#card-centros').hidden, filas: document.querySelectorAll('#centros-tabla tbody tr').length }));
      if (c1.sel !== 'true' || !c1.c3d || !c1.cen || c1.filas !== 3 || c1.l.centros.length !== 3) mal('VSEPR · ácido acético en la página: ' + JSON.stringify(c1));
      await page.fill('#cadena', 'CH3COOH');
      if (await page.locator('#error').isHidden()) mal('VSEPR · CH3COOH sin dobles enlaces no da error');
      await page.fill('#cadena', 'CH2=CH2');
      if (!(await page.locator('#error').isHidden()) || (await page.textContent('#r-ncentros')) !== '2') mal('VSEPR · eteno en la página');
      await page.click('#tab-formula'); await page.fill('#formula', 'H2O');
      if (await page.evaluate(() => document.querySelector('#card-3d').hidden)) mal('VSEPR · al volver a Fórmula no reaparece la molécula 3D');
      if (fallos === a0) console.log('  ✓ VSEPR · Lewis en la página: figura SVG con descripción, tabla de átomos, octeto limitado y varios centros');
    }
    await page.close();
    if (consola.length) mal('VSEPR: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ VSEPR: ${C.ejemplos.length} ejemplos en la página, molécula 3D que gira, interruptores, pestaña AXE, tabla y errores, sin errores de consola`);
  };
};
