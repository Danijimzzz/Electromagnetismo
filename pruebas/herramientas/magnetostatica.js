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
      await page.close();
      if (consola.length) mal('Magnetostática: consola del navegador:\n      ' + consola.join('\n      '));
    }
  };
};
