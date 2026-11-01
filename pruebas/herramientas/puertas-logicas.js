/* Comprobación de puertas-logicas: cálculos en Node (minitérminos, maxitérminos, simplificación,
   puertas) y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo puertas-logicas ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'puertas-logicas', 'calculo.js'));
  {
    const antes = fallos, igual = (a, b, q) => { if (JSON.stringify(a) !== JSON.stringify(b)) mal(`PuertasLogicas · ${q}: ${JSON.stringify(a)} en vez de ${JSON.stringify(b)}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano
    const may = r('mayoria').salidas[0];
    igual(may.unos, [3, 5, 6, 7], 'mayoría: minitérminos'); igual(may.ceros, [0, 1, 2, 4], 'mayoría: maxitérminos');
    igual(may.minS.txt, 'A·B + A·C + B·C', 'mayoría: suma de productos'); igual(may.minP.txt, '(A + B)·(A + C)·(B + C)', 'mayoría: producto de sumas');
    igual(may.canS.txt, "A'·B·C + A·B'·C + A·B·C' + A·B·C", 'mayoría: forma canónica');
    const sm = r('semisumador').salidas;
    igual(sm.map((s) => s.nombre), ['F1', 'F2'], 'semisumador: nombres'); igual(sm[0].minS.txt, "A'·B + A·B'", 'semisumador: suma'); igual(sm[1].minS.txt, 'A·B', 'semisumador: acarreo');
    igual(r('sumador').salidas[0].minS.txt, "A'·B'·C + A'·B·C' + A·B'·C' + A·B·C", 'sumador: la paridad no se simplifica');
    const pr = r('primos-bcd').salidas[0];
    igual(pr.unos, [2, 3, 5, 7], 'primos: minitérminos'); igual(pr.indif, [10, 11, 12, 13, 14, 15], 'primos: indiferentes'); igual(pr.minS.txt, "B'·C + B·D", 'primos: simplificada con indiferentes');
    // desde las puertas
    const mux = r('circ-mux');
    igual(mux.salidas[0].unos, [3, 4, 6, 7], 'multiplexor: minitérminos'); igual(mux.salidas[0].minS.txt, "A·C' + B·C", 'multiplexor: simplificada');
    igual(mux.dado.map((g) => g.t), ["C'", "A·C'", 'B·C', "A·C' + B·C"], 'multiplexor: ecuación de cada puerta');
    igual(r('circ-xor-nand').salidas[0].unos, [1, 2], 'XOR con NAND');
    // todas las puertas, con 2 entradas: AND OR NAND NOR XOR XNOR
    const tipos = { AND: [0, 0, 0, 1], OR: [0, 1, 1, 1], NAND: [1, 1, 1, 0], NOR: [1, 0, 0, 0], XOR: [0, 1, 1, 0], XNOR: [1, 0, 0, 1] };
    for (const [t, v] of Object.entries(tipos)) igual(C.resolver({ modo: 'puertas', nc: '2', puertas: [{ id: 'P1', tipo: t, e: ['A', 'B'], sal: true }] }).salidas[0].v, v, `puerta ${t}`);
    igual(C.resolver({ modo: 'puertas', nc: '3', puertas: [{ id: 'P1', tipo: 'XOR', e: ['A', 'B', 'C'], sal: true }] }).salidas[0].unos, [1, 2, 4, 7], 'XOR de 3 entradas');
    // constantes y errores
    igual(C.resolver({ modo: 'tabla', n: '2', m: '1', tabla: ['1111'] }).salidas[0].minS.txt, '1', 'constante 1');
    igual(C.resolver({ modo: 'tabla', n: '2', m: '1', tabla: ['0000'] }).salidas[0].minP.txt, '0', 'constante 0');
    // el circuito normal de la mayoría: 3 AND, 1 OR
    const d = C.resolver({ ...C.ejemplos[0].sc, simp: true }).dibujo;
    igual(d.nodos.map((n) => n.tipo), ['AND', 'AND', 'AND', 'OR'], 'circuito simplificado de la mayoría');
    const dc = C.resolver(C.ejemplos[0].sc).dibujo.nodos.map((n) => n.tipo).sort();
    igual(dc, ['AND', 'AND', 'AND', 'AND', 'NOT', 'NOT', 'NOT', 'OR'], 'circuito canónico de la mayoría (sin simplificar)');
    // las puertas pueden venir en cualquier orden: se ordenan por dependencias; un lazo y una entrada sin conectar dan error
    igual(C.resolver({ modo: 'puertas', nc: '2', puertas: [{ id: 'P2', tipo: 'NOT', e: ['P1'], sal: true }, { id: 'P1', tipo: 'AND', e: ['A', 'B'] }] }).salidas[0].v, [1, 1, 1, 0], 'puertas desordenadas');
    for (const [sc, q] of [[{ modo: 'tabla', n: '6', m: '1', tabla: [''] }, 'seis variables'], [{ modo: 'puertas', nc: '2', puertas: [] }, 'sin puertas'],
      [{ modo: 'puertas', nc: '2', puertas: [{ id: 'P1', tipo: 'AND', e: ['A', ''], sal: true }] }, 'entrada sin conectar'],
      [{ modo: 'puertas', nc: '2', puertas: [{ id: 'P1', tipo: 'NOT', e: ['P2'], sal: true }, { id: 'P2', tipo: 'NOT', e: ['P1'] }] }, 'lazo'],
      [{ modo: 'puertas', nc: '2', puertas: [{ id: 'P1', tipo: 'AND', e: ['A', 'B'], sal: false }] }, 'sin salida'],
      [{ modo: 'puertas', nc: '2', puertas: [{ id: 'P1', tipo: 'AND', e: ['A', 'P2'], sal: true }] }, 'entrada que no existe']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`PuertasLogicas: ${q} no da error`);
    }
    for (const e of C.ejemplos) { const s = C.resolver(e.sc); if (!s.pasos.length || !s.dibujo.salidas.length) mal(`PuertasLogicas · ${e.clave}: faltan pasos o circuito`); }
    // por completo: Quine-McCluskey da una cobertura que reproduce la tabla en toda función de 3 variables
    for (let f = 0; f < 256; f++) {
      const v = [...f.toString(2).padStart(8, '0')].join('');
      const s = C.resolver({ modo: 'tabla', n: '3', m: '1', tabla: [v] }).salidas[0];
      for (let i = 0; i < 8; i++) {
        const sop = s.elegidosS.some((p) => (i & ~p.m) === p.v), pos = !s.elegidosP.some((p) => (i & ~p.m) === p.v);
        if (+sop !== +v[i] || +pos !== +v[i]) { mal(`PuertasLogicas: la función ${v} se simplifica mal en la fila ${i}`); break; }
      }
    }
    if (fallos === antes) console.log(`  ✓ PuertasLogicas: ${C.ejemplos.length} ejemplos, 7 puertas, errores y las 256 funciones de 3 variables`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'circuitos', 'puertas-logicas', 'index.html'));
    await page.waitForFunction(() => window.PuertasLogicasApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('puertas-logicas').current) mal(`PuertasLogicas: la página muestra la versión «${ver}», se esperaba ${Version.de('puertas-logicas').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => PuertasLogicasApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#resumen > div').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), mapa: document.querySelectorAll('#mapas .kmap').length,
        dib: document.querySelector('#c-editor').hidden ? (() => { const c = document.querySelector('#grafica'), v = document.createElement('canvas'); v.width = c.width; v.height = c.height; return c.toDataURL().length - v.toDataURL().length; })() : document.querySelectorAll('#ed .nodo').length * 1000 + document.querySelectorAll('#ed .cable').length }));
      if (r.err || !r.pasos || !r.res) mal(`PuertasLogicas · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mapa) mal(`PuertasLogicas · ${e.clave}: falta el mapa de Karnaugh`);
      if (r.dib < 300) mal(`PuertasLogicas · ${e.clave}: el circuito no se dibuja`);
      if (r.dolar) mal(`PuertasLogicas · ${e.clave}: el desarrollo enseña un «$»`);
    }
    // tabla: filas separadas de 4 en 4 y botón Simplificar
    await page.evaluate(() => PuertasLogicasApp.abrirEjemplo('mayoria'));
    if ((await page.locator('.tv tr.g4').count()) !== 1) mal('PuertasLogicas: la tabla de 8 filas debería tener una separación a mitad');
    if (await page.locator('#resumen .simp').count()) mal('PuertasLogicas: las ecuaciones salen simplificadas sin pulsar el botón');
    await page.click('#simplificar');
    const antesCirc = await page.locator('#leyenda').innerText();
    await page.click('#cambia-forma');
    if ((await page.locator('#leyenda').innerText()) === antesCirc || !/producto de sumas/.test(await page.locator('#leyenda').innerText())) mal('PuertasLogicas: el botón no cambia el circuito a producto de sumas');
    await page.click('#cambia-forma');
    if ((await page.locator('#resumen .simp').count()) !== 2) mal('PuertasLogicas: «Simplificar» no añade las ecuaciones simplificadas');
    if (!/A·B \+ A·C \+ B·C/.test(await page.locator('#resumen').innerText())) mal('PuertasLogicas: falta la ecuación simplificada de la mayoría');
    await page.click('#simplificar');
    // cambiar una casilla de la tabla
    await page.click('.cel[data-i="0"]');
    if ((await page.evaluate(() => PuertasLogicasApp.estado().tabla[0])) !== '10010111') mal('PuertasLogicas: pulsar una casilla no la cambia');
    // editor gráfico: añadir dos puertas de la paleta y unirlas con el ratón
    await page.click('#tab-puertas');
    await page.evaluate(() => { const s = PuertasLogicasApp.estado(); return s; });
    const hay = await page.evaluate(() => PuertasLogicasApp.estado().puertas?.length || 0);
    if (hay) for (let i = 0; i < hay; i++) { await page.click('#ed .nodo:not([data-id="A"]):not([data-id="B"]):not([data-id="C"])'); await page.click('#sel-barra [data-a="del"]'); }
    await page.click('.paleta [data-tipo="AND"]');
    if ((await page.locator('#ed .nodo').count()) < 4) mal('PuertasLogicas: la paleta no añade la puerta');
    const centro = async (sel) => { const b = await page.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
    const une = async (de, a) => { const p = await centro(de), q = await centro(a); await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move((p.x + q.x) / 2, (p.y + q.y) / 2); await page.mouse.move(q.x, q.y); await page.mouse.up(); };
    const id = await page.evaluate(() => PuertasLogicasApp.estado().puertas[0].id);
    await une('#ed .pin[data-k="out"][data-id="A"]', `#ed .pin[data-k="in"][data-id="${id}"][data-j="0"]`);
    await une('#ed .pin[data-k="out"][data-id="B"]', `#ed .pin[data-k="in"][data-id="${id}"][data-j="1"]`);
    let est = await page.evaluate(() => PuertasLogicasApp.estado());
    if (est.puertas[0].e.join() !== 'A,B') mal(`PuertasLogicas: unir con el ratón no conecta (${est.puertas[0].e})`);
    await page.dblclick(`#ed .nodo[data-id="${id}"]`);
    if (!(await page.locator('#error').isHidden())) mal('PuertasLogicas: el circuito A·B con salida marcada da error: ' + await page.locator('#error').innerText());
    if (!/F = A·B/.test(await page.locator('#resumen').innerText())) mal('PuertasLogicas: falta la ecuación A·B del circuito montado');
    // mover la puerta con el ratón
    const antes2 = est.puertas[0].x, c0 = await centro(`#ed .nodo[data-id="${id}"] .cuerpo`);
    await page.mouse.move(c0.x, c0.y); await page.mouse.down(); await page.mouse.move(c0.x + 60, c0.y + 20); await page.mouse.up();
    est = await page.evaluate(() => PuertasLogicasApp.estado());
    if (est.puertas[0].x === antes2) mal('PuertasLogicas: arrastrar una puerta no la mueve');
    // soltar el cable en el vacío lo quita
    const p0 = await centro(`#ed .pin[data-k="in"][data-id="${id}"][data-j="0"]`);
    await page.mouse.move(p0.x, p0.y); await page.mouse.down(); await page.mouse.move(p0.x - 40, p0.y + 60); await page.mouse.up();
    est = await page.evaluate(() => PuertasLogicasApp.estado());
    if (est.puertas[0].e[0] !== '') mal('PuertasLogicas: soltar el cable en el vacío no lo quita');
    await page.reload(); await page.waitForFunction(() => window.PuertasLogicasApp);
    if ((await page.evaluate(() => PuertasLogicasApp.estado().modo)) !== 'puertas') mal('PuertasLogicas: el modo no se guarda al recargar');
    await page.setViewportSize({ width: 390, height: 800 });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) mal('PuertasLogicas: la página se desborda en el móvil');
    await page.close();
    if (consola.length) mal('PuertasLogicas: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ PuertasLogicas: ${C.ejemplos.length} ejemplos en la página con circuito, mapa y desarrollo, edición de la tabla y de las puertas, sin errores de consola`);
  };
};
