/* Comprobación de magnetostatica: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo magnetostatica ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  // magnetostática: los ejemplos contra pruebas/esperados-magnetostatica.json
  const Magneto = require(path.join(fuente, 'magnetostatica', 'fisica.js')), MagEjemplos = require(path.join(fuente, 'magnetostatica', 'ejemplos.js'));
  const resolverMag = (M, E) => Object.fromEntries(E.lista.map((e) => { const o = M.run({ modo: 'sym', ...e.escena() }); return [e.clave, { titulo: e.titulo, errores: o.errors, resultados: o.results.map((r) => (r.error ? 'ERROR: ' + r.error : r.res)) }]; }));
  const espMagF = path.join(__dirname, 'esperados-magnetostatica.json');
  const magNodo = resolverMag(Magneto, MagEjemplos);
  if (args.includes('--actualizar') || !fs.existsSync(espMagF)) { fs.writeFileSync(espMagF, JSON.stringify(magNodo, null, 1) + '\n'); console.log('  ✓ esperados-magnetostatica.json reescrito'); }
  const espMag = JSON.parse(fs.readFileSync(espMagF, 'utf8'));
  function compararMag(obt, donde) {
    const antes = fallos;
    for (const [k, e] of Object.entries(espMag)) {
      const o = obt[k];
      if (!o) { mal(`${donde}: falta el ejemplo ${e.titulo}`); continue; }
      if (o.errores.length) mal(`${donde} · ${e.titulo}: ${o.errores.join(' · ')}`);
      e.resultados.forEach((r, i) => { if (o.resultados[i] !== r) mal(`${donde} · ${e.titulo} (pregunta ${i + 1})\n      esperado: ${r}\n      obtenido: ${o.resultados[i]}`); });
      o.resultados.forEach((r, i) => { if (r.startsWith('ERROR: ')) mal(`${donde} · ${e.titulo} (pregunta ${i + 1}): ${r}`); });
    }
    if (fallos === antes) console.log(`  ✓ ${donde}: ${Object.keys(espMag).length} ejemplos de magnetostática iguales a esperados-magnetostatica.json`);
  }
  compararMag(magNodo, 'Node · Magnetostática');

  // MG-2: dipolo magnético y potencial vector (μ₀ = 1, I = 1)
  {
    const antes = fallos, V = Engine.V3, P4 = 4 * Math.PI, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Magnetostática · ${q}: ${a} en vez de ${b}`); };
    const lazo = (o) => ({ id: 'x', nombre: 'Lazo', k: 1, s: 'I', C: [0, 0, 0], sentido: 1, ...o }), P = (a) => a;
    const esp = lazo({ tipo: 'espira', plano: 'xy', R: 1 }), rect = lazo({ tipo: 'rectangular', plano: 'xy', a: 2, b: 1.2 }), sol = lazo({ tipo: 'solenoide', eje: 'z', R: 1, L: 3, N: 3, ideal: false }), solI = { ...sol, ideal: true };
    const rot = (f, Pt) => { const h = 1e-4, d = (i, j) => { const a = [...Pt], b = [...Pt]; a[j] += h; b[j] -= h; const Aa = Magneto.POT[f.tipo](f, a, true).A, Ab = Magneto.POT[f.tipo](f, b, true).A; return (Aa[i] - Ab[i]) / (2 * h); }; return [d(2, 1) - d(1, 2), d(0, 2) - d(2, 0), d(1, 0) - d(0, 1)]; };
    // ∇ × A = B para cada lazo, dentro y fuera del eje
    for (const [f, pts] of [[esp, [[0.4, 0.3, 0.5], [2, 1, -1]]], [rect, [[0.3, 0.2, 0.7], [2.5, 1.5, 0.4]]], [sol, [[0.3, 0.2, 0.4], [2, 0, 1]]], [solI, [[0.5, 0, 0.3], [2, 0.5, 0]]]]) for (const Pt of pts) {
      const B = Magneto.SOURCES[f.tipo].campo(f, Pt, true).B, R = rot(f, Pt), tam = Math.max(V.norm(B), 1e-3);
      if (V.norm(V.sub(R, B)) > 2e-3 * tam + 1e-6) mal(`Magnetostática · rot A ≠ B en ${f.tipo}${f.ideal ? ' ideal' : ''} ${JSON.stringify(Pt)}: ${R.map((x) => x.toFixed(5))} frente a ${B.map((x) => x.toFixed(5))}`);
    }
    // en el eje A = 0; lejos A → (μ₀/4π) m × r / r³
    if (V.norm(Magneto.POT.espira(esp, [0, 0, 0.7]).A) > 1e-12) mal('Magnetostática · A en el eje de la espira no es 0');
    { const r = [30, 0, 40], m = Magneto.momentoLazo(esp), Ad = V.sc(V.cross(m, r), 1 / (P4 * Math.pow(V.norm(r), 3))), A = Magneto.POT.espira(esp, r).A; if (V.norm(V.sub(A, Ad)) > 1e-3 * V.norm(Ad)) mal('Magnetostática · A de la espira lejos no es el del dipolo'); }
    // momento dipolar y campo en el eje y en el plano
    cerca(V.norm(Magneto.momentoLazo(esp)), Math.PI, 1e-12, 'm de una espira = π R²'); cerca(V.norm(Magneto.momentoLazo(rect)), 2.4, 1e-12, 'm de una espira rectangular = a b'); cerca(V.norm(Magneto.momentoLazo(sol)), 3 * Math.PI, 1e-12, 'm del solenoide = N π R²');
    { const m = Magneto.momentoLazo(esp), zz = 50; cerca(Magneto.campoDipolo(m, [0, 0, zz])[2], (2 * Math.PI) / (P4 * zz ** 3), 1e-12, 'dipolo en el eje: μ₀m/(2πr³)'); cerca(Magneto.campoDipolo(m, [zz, 0, 0])[2], -Math.PI / (P4 * zz ** 3), 1e-12, 'dipolo en el plano: −μ₀m/(4πr³)');
      const exacto = Magneto.SOURCES.espira.campo(esp, [0, 0, zz], true).B[2]; cerca(exacto, Magneto.campoDipolo(m, [0, 0, zz])[2], 1e-3, 'espira lejos = dipolo (eje)'); const ex2 = Magneto.SOURCES.espira.campo(esp, [zz, 0, 0], true).B[2]; cerca(ex2, Magneto.campoDipolo(m, [zz, 0, 0])[2], 1e-3, 'espira lejos = dipolo (plano)'); }
    // solenoide ideal: A = nρ/2 dentro, nR²/(2ρ) fuera y el flujo de A (Stokes) es el de B
    { const n = 3 / 3, A1 = Magneto.POT.solenoide(solI, [0.5, 0, 0]).A, A2 = Magneto.POT.solenoide(solI, [2, 0, 0]).A; cerca(A1[1], n * 0.5 / 2, 1e-12, 'A dentro del solenoide ideal'); cerca(A2[1], (n * 1) / (2 * 2), 1e-12, 'A fuera del solenoide ideal'); cerca(2 * Math.PI * 2 * A2[1], n * Math.PI, 1e-12, '∮A·dl = flujo de B'); if (V.norm(Magneto.SOURCES.solenoide.campo(solI, [2, 0, 0], true).B) !== 0) mal('Magnetostática · B fuera del solenoide ideal debería ser 0'); }
    // preguntas completas: errores y avisos
    const vv = (x, y, z) => [String(x), String(y), String(z)], run = (fs, q, modo = 'sym') => Magneto.run({ modo, fuentes: fs, preguntas: [q] }).results[0];
    const fEsp = { id: 'e', tipo: 'espira', nombre: 'Espira', I: '1', s: 'I', C: vv(0, 0, 0), plano: 'xy', R: '1', sentido: 1 }, fHilo = { id: 'h', tipo: 'hilo', nombre: 'Hilo', I: '1', s: 'I', A: vv(1, 0, 0), u: vv(0, 0, 1) };
    for (const [fs, q, que] of [[[fHilo], { tipo: 'dipolo', P: vv(0, 0, 3) }, 'dipolo sin lazos'], [[fEsp], { tipo: 'dipolo', P: vv(0, 0, 0) }, 'dipolo en el centro'], [[fHilo], { tipo: 'potencial', P: vv(0, 0, 3) }, 'potencial sin lazos'], [[fEsp], { tipo: 'potencial', P: vv(1, 0, 0) }, 'potencial sobre la espira']]) if (!run(fs, q).error) mal(`Magnetostática · ${que} debería dar error`);
    const r1 = run([fEsp, fHilo], { tipo: 'dipolo', P: vv(0, 0, 6) }); if (r1.error || !/No se tienen en cuenta/.test(r1.res)) mal('Magnetostática · el dipolo con un hilo debería avisar de que lo ignora');
    const rs = run([{ ...fEsp, R: '0,05', I: '2' }], { tipo: 'dipolo', P: vv(0, 0, 1) }, 'si'); if (rs.error || !/0,01571/.test(rs.res.replace(/<[^>]+>/g, ''))) mal('Magnetostática · m = I π R² en SI no sale 0,01571 A·m²: ' + (rs.error || rs.res));
    if (fallos === antes) console.log('  ✓ Magnetostática: momento dipolar, campo del dipolo frente a Biot-Savart, rot A = B en espira, rectángulo y solenoide, A del solenoide ideal y errores');
  }

  // MG-3: modo guiado de Ampère, con B calculado a mano (μ₀/2π = 2·10⁻⁷)
  {
    const antes = fallos, Ampere = require(path.join(fuente, 'magnetostatica', 'ampere.js')), cerca = (x, y, q) => { if (!(Math.abs(x - y) <= 1e-9 * Math.max(1e-300, Math.abs(y)) + (y === 0 ? 1e-300 : 0))) mal(`Magnetostática · Ampère ${q}: ${x} en vez de ${y}`); };
    const ev = (caso, sim, curva, q, d) => { const C = Ampere.CASOS[caso], st = { caso, sim, curva, d: Object.fromEntries(C.datos.map(([k, , , v]) => [k, v])), q: Object.fromEntries(C.curvaCampos.map(([k, , , v]) => [k, v])) }; Object.assign(st.q, q || {}); Object.assign(st.d, d || {}); return Ampere.evalua(st); };
    const bien = (caso, q, d) => ev(caso, Ampere.CASOS[caso].sim, Ampere.CASOS[caso].curva, q, d).res;
    cerca(bien('cilindro', { r: '1' }).B, 2e-7 * 2.5 / 0.01, 'cilindro dentro'); cerca(bien('cilindro', { r: '4' }).B, 2e-7 * 10 / 0.04, 'cilindro fuera');
    cerca(bien('coaxial', { r: '2' }).B, 2e-7 * 10 / 0.02, 'coaxial entre conductores'); cerca(bien('coaxial', { r: '3.5' }).B, 2e-7 * 10 * (1 - 3.25 / 7) / 0.035, 'coaxial en la malla'); cerca(bien('coaxial', { r: '5' }).B, 0, 'coaxial fuera');
    cerca(bien('lamina').B, 4e-7 * Math.PI * 25, 'lámina'); cerca(bien('lamina', { L: '30', h: '1' }).B, 4e-7 * Math.PI * 25, 'lámina: B no depende de L ni de h');
    cerca(bien('solenoide').B, 4e-7 * Math.PI * 4000, 'solenoide'); cerca(bien('solenoide').Ienc, 400, 'solenoide: corriente enlazada');
    cerca(bien('toroide').B, 2e-7 * 500 / 0.065, 'toroide dentro'); cerca(bien('toroide', { r: '3' }).B, 0, 'toroide hueco'); cerca(bien('toroide', { r: '10' }).B, 0, 'toroide fuera');
    for (const c of Object.keys(Ampere.CASOS)) { const r = bien(c); if (Math.abs(r.circ / (4e-7 * Math.PI * r.Ienc) - 1) > 1e-9) mal(`Magnetostática · Ampère ${c}: la circulación no es μ₀ I_enc`); }
    // elecciones equivocadas: no hay resultado y se explica por qué
    for (const [caso, sim, curva] of [['cilindro', 'esferica', 'circulo'], ['cilindro', 'cilindrica', 'cualquiera'], ['cilindro', 'cilindrica', 'desc'], ['lamina', 'plana', 'circulo'], ['solenoide', 'cilindrica', 'circulo'], ['toroide', 'cilindrica', 'rect']]) { const e = ev(caso, sim, curva); if (e.res || e.mensajes.length < 2 || !e.mensajes.some((m) => /no|Sí hay|hace falta|no se puede|no sirve|no encaja/i.test(m))) mal(`Magnetostática · Ampère ${caso}/${sim}/${curva}: debería rechazarse con una explicación`); }
    for (const mala of [{ r: '' }, { r: '-1' }, { r: 'x' }]) { let ok = false; try { ev('cilindro', 'cilindrica', 'circulo', mala); } catch (er) { ok = true; } if (!ok) mal(`Magnetostática · Ampère: ${JSON.stringify(mala)} debería dar error`); }
    { let ok = false; try { ev('coaxial', 'cilindrica', 'circulo', {}, { b: '0.5' }); } catch (er) { ok = true; } if (!ok) mal('Magnetostática · Ampère: coaxial con a > b debería dar error'); }
    if (fallos === antes) console.log('  ✓ Magnetostática: modo guiado de Ampère con 5 casos (B a mano, elecciones equivocadas explicadas y errores)');
  }

  return async (browser) => {
    // magnetostática: mismos resultados en la página, cada ejemplo abierto sin errores de consola
    {
      const { page, consola } = await pagina(browser, 1300, 900);
      await page.goto('file://' + path.join(publico, 'electromagnetismo', 'magnetostatica', 'index.html'));
      await page.waitForFunction(() => window.MagApp);
      compararMag(await page.evaluate(`(${resolverMag})(Magneto, MagEjemplos)`), 'Chromium · Magnetostática');
      for (const k of Object.keys(espMag)) {
        await page.evaluate((c) => MagApp.abrirEjemplo(c), k);
        const warn = await page.locator('.result .warn').allTextContents();
        if (warn.length) mal(`Magnetostática · ${k}: ${warn.join(' · ')}`);
      }
      // perfil de |B|, mapa de color y líneas de campo
      await page.evaluate(() => MagApp.abrirEjemplo('cilindro'));
      if ((await page.locator('svg.perfil path').count()) < 1) mal('Magnetostática: el perfil de |B| del cilindro no sale');
      await page.check('#lineas'); await page.selectOption('#plano', 'xz'); await page.check('#mapa'); await page.uncheck('#flechas');
      await page.evaluate(() => MagApp.abrirEjemplo('disco')); await page.check('#mapa');
      if (!(await page.evaluate(() => MagApp.escena.vista.mapa && MagApp.escena.vista.lineas))) mal('Magnetostática: el mapa de color o las líneas de campo no se guardan en la vista');
      // vista 3D de las líneas de B con descripción en texto y giro con el teclado
      for (const c of ['espira', 'solenoide', 'dos-hilos', 'toroide', 'rectangular', 'dipolo']) {
        await page.evaluate((k) => MagApp.abrirEjemplo(k), c); await page.waitForTimeout(350);
        const r = await page.evaluate(() => ({ px: document.querySelector('#vista3d').toDataURL().length, desc: document.querySelector('#desc3d').textContent.length, aria: document.querySelector('#vista3d').getAttribute('aria-label').length, tab: document.querySelector('#vista3d').tabIndex, rol: document.querySelector('#vista3d').getAttribute('role') }));
        if (r.px < 4000 || r.desc < 80 || r.aria < 80 || r.tab !== 0 || r.rol !== 'img') mal(`Magnetostática · ${c}: la vista 3D, su descripción o su acceso con teclado no salen bien (${JSON.stringify(r)})`);
      }
      await page.focus('#vista3d'); { const a3 = await page.evaluate(() => document.querySelector('#vista3d').toDataURL()); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); if ((await page.evaluate(() => document.querySelector('#vista3d').toDataURL())) === a3) mal('Magnetostática: las flechas no giran la vista 3D'); }
      await page.evaluate(() => MagApp.abrirEjemplo('potencial')); if ((await page.locator('.result .warn').count()) || !(await page.locator('#preguntas').textContent()).includes('A')) mal('Magnetostática: el ejemplo del potencial vector no sale');
      const ver = await page.locator('#ver').textContent();
      if (ver !== Version.de('magnetostatica').current) mal(`Magnetostática: la página muestra la versión «${ver}», se esperaba ${Version.de('magnetostatica').current}`);
      // copiar la solución como texto o LaTeX e imprimirla (compartir.js)
      if ((await page.locator('.compartir button').count()) !== 4 || !/Resultados[\s\S]*Desarrollo/.test(await page.evaluate(() => Compartir.ejercicio(false)))) mal('Magnetostática: faltan los botones para copiar o imprimir la solución');
      // MG-3: el modo guiado de Ampère en la página
      await page.evaluate(() => document.querySelector('#ampere').scrollIntoView());
      if ((await page.locator('#ampere #am-caso').count()) !== 1) mal('Magnetostática: no sale el modo guiado de Ampère');
      else {
        await page.check('input[name="am-sim"][value="cilindrica"]'); await page.check('input[name="am-curva"][value="cualquiera"]');
        if ((await page.locator('#am-res .am-resumen').count()) !== 0 || !(await page.locator('#am-msg .am-m.mal').count())) mal('Magnetostática: una curva amperiana cualquiera debería rechazarse con explicación');
        await page.check('input[name="am-curva"][value="circulo"]');
        if (!(await page.locator('#am-res').textContent()).includes('5·10') && !(await page.locator('#am-res').textContent()).includes('50')) mal('Magnetostática: el cilindro de Ampère no da B = 50 μT');
        for (const c of ['coaxial', 'lamina', 'solenoide', 'toroide']) { await page.selectOption('#am-caso', c); const C = await page.evaluate((k) => Ampere.CASOS[k], c).catch(() => null); await page.evaluate((k) => AmpApp.poner({ sim: Ampere.CASOS[k].sim, curva: Ampere.CASOS[k].curva }), c); if ((await page.locator('#am-res .am-pasos li').count()) < 3 || (await page.locator('#am-dib svg').count()) !== 1) mal(`Magnetostática · Ampère ${c}: faltan el desarrollo o el dibujo`); }
      }
      await page.close();
      if (consola.length) mal('Magnetostática: consola del navegador:\n      ' + consola.join('\n      '));
    }
  };
};
