/* Comprobación de control: cálculos a mano en Node y la página en Chromium.
   (node pruebas/comprobar.js --solo control ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'control', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Control · ${q}: ${a} en vez de ${b}`); };
    const r = (c, K) => { const e = C.ejemplos.find((x) => x.clave === c); return C.resolver(K === undefined ? e.sc : { ...e.sc, K: String(K) }); };
    const P = (t) => C.lee({ p: t }, 'p', 'x');

    // lectura de polinomios: coeficientes o expresión
    { const igual = (a, b, q) => { if (a.length !== b.length || a.some((x, i) => Math.abs(x - b[i]) > 1e-12)) mal(`Control · lectura ${q}: ${a} en vez de ${b}`); };
      igual(P('1 3 2'), [1, 3, 2], 'coeficientes'); igual(P('s^2+3s+2'), [1, 3, 2], 'expresión'); igual(P('2(s+1)(s+3)'), [2, 8, 6], 'producto'); igual(P('s(s+1)(s+2)'), [1, 3, 2, 0], 'con s delante'); igual(P('-s^3 + 2,5s'), [-1, 0, 2.5, 0], 'signo y coma'); igual(P('s²+1'), [1, 0, 1], 'potencia unicode'); }

    // Routh de 1 + K/(s(s+1)(s+2)): s³ + 3s² + 2s + K. Filas a mano: [1 2], [3 K], [(6 − K)/3], [K]; estable si 0 < K < 6, cruza en ω = √2
    { const R = r('tercer-orden').R; cerca(R.filas[2].c[0], 5 / 3, 1e-12, 'Routh: fila s¹ con K = 1'); cerca(R.cambios, 0, 0, 'Routh: sin cambios con K = 1'); if (R.estado !== 'estable') mal('Control · Routh: K = 1 debería ser estable');
      const s = r('tercer-orden-k'); cerca(s.R.filas[2].c[0], -4 / 3, 1e-12, 'Routh: fila s¹ con K = 10'); cerca(s.R.cambios, 2, 0, 'Routh: dos cambios con K = 10');
      cerca(s.rk.estables.length, 1, 0, 'rango: un intervalo'); cerca(s.rk.estables[0].a, 0, 0, 'rango: desde 0'); cerca(s.rk.estables[0].b, 6, 1e-9, 'rango: hasta K = 6'); cerca(s.rk.criticos[0].w, Math.SQRT2, 1e-9, 'rango: ω de cruce'); }
    // s⁴ + 2s³ + 3s² + 4s + K: fila s¹ = 4 − 2K, estable para 0 < K < 2 y con K = 5 dos raíces en el semiplano derecho
    { const s = r('dos-cambios'); cerca(s.R.cambios, 2, 0, 'Routh: s⁴+2s³+3s²+4s+5 tiene dos cambios'); cerca(s.rk.estables[0].b, 2, 1e-9, 'rango: K < 2'); cerca(s.rk.criticos[0].w, Math.SQRT2, 1e-9, 'rango: ω = √2'); }
    // cero en la primera columna: s⁴ + s³ + 2s² + 2s + 3 → ε en la fila s²
    { const s = r('cero-primera'); if (!s.R.filas[2].eps) mal('Control · Routh: no marca el ε de la fila s²'); cerca(s.R.cambios, 2, 0, 'Routh con ε: dos cambios'); cerca(s.polosCL.filter((z) => z[0] > 0).length, 2, 0, 'Routh con ε: coincide con las raíces'); }
    // fila de ceros: (s + 2)(s² − 1)(s² + 25) → auxiliar 2s⁴ + 48s² − 50, un cambio (s = 1) y dos raíces en ±5j
    { const s = r('fila-ceros').R; if (s.aux.length !== 1) mal('Control · Routh: debería haber una fila de ceros'); else if (s.aux[0].coef.join() !== '2,48,-50') mal(`Control · Routh: auxiliar ${s.aux[0].coef} en vez de 2,48,-50`); cerca(s.cambios, 1, 0, 'fila de ceros: un cambio'); cerca(s.eje, 2, 0, 'fila de ceros: dos raíces en el eje');
      const ys = s.raices.filter((z) => Math.abs(z[0]) < 1e-6).map((z) => z[1]).sort((a, b) => a - b); cerca(ys[1], 5, 1e-6, 'fila de ceros: raíz 5j'); cerca(s.filas[2].c[0], 8, 1e-9, 'fila de ceros: derivada 8s³'); cerca(s.filas[3].c[0], 24, 1e-9, 'fila de ceros: fila s² (24)'); cerca(s.filas[4].c[0], 2704 / 24, 1e-9, 'fila de ceros: fila s¹'); cerca(s.filas[5].c[0], -50, 1e-9, 'fila de ceros: fila s⁰'); }
    // un polinomio con raíz en el origen (fila s⁰ de ceros) y uno sin término impar
    { const a = C.routh([1, 3, 2, 0]); cerca(a.eje, 1, 0, 'Routh: raíz en s = 0'); cerca(a.cambios, 0, 0, 'Routh: s³+3s²+2s marginal'); const b = C.routh([1, 0, 1]); cerca(b.eje, 2, 0, 'Routh: s²+1 tiene ±j'); if (b.estado !== 'marginal') mal('Control · Routh: s²+1 debería ser marginal'); }
    // el número de cambios de signo coincide con el de raíces del semiplano derecho en polinomios al azar
    { let sem = 12345; const rnd = () => { sem = (sem * 1103515245 + 12345) % 2147483648; return sem / 2147483648; };
      let malos = 0; for (let t = 0; t < 400; t++) { const n = 2 + Math.floor(rnd() * 7), p = Array.from({ length: n + 1 }, () => Math.round(rnd() * 10 - 5)); if (!p[0]) p[0] = 1;
        const R = C.routh(p), rhp = C.raices(p).filter((z) => z[0] > 1e-6).length; if (R.cambios !== rhp) { malos++; if (malos < 4) mal(`Control · Routh al azar [${p}]: ${R.cambios} cambios y ${rhp} raíces en el semiplano derecho`); } } }

    // lugar de las raíces de K/(s(s+1)(s+2)): centroide −1, asíntotas ±60° y 180°, ruptura en −1 + 1/√3 con K = 2/(3√3), cruce en ±j√2 con K = 6
    { const l = r('raices-tres').lg; cerca(l.asint.centro, -1, 1e-9, 'lugar: centroide'); if (l.asint.ang.join() !== '-60,60,180') mal(`Control · lugar: ángulos ${l.asint.ang}`); cerca(l.ruptura.length, 1, 0, 'lugar: un punto de ruptura');
      cerca(l.ruptura[0].s, -1 + 1 / Math.sqrt(3), 1e-9, 'lugar: ruptura'); cerca(l.ruptura[0].K, 2 / (3 * Math.sqrt(3)), 1e-9, 'lugar: K en la ruptura'); cerca(l.cruces[0].K, 6, 1e-9, 'lugar: K crítica'); cerca(l.cruces[0].w, Math.SQRT2, 1e-9, 'lugar: ω crítica');
      cerca(l.tramos.length, 2, 0, 'lugar: dos tramos del eje real'); cerca(l.tramos[0][1], -2, 1e-9, 'lugar: tramo hasta −2'); cerca(l.tramos[1][0], -1, 1e-9, 'lugar: tramo desde −1');
      cerca(l.ramas.length, 3, 0, 'lugar: tres ramas'); for (const rama of l.ramas) { const u = rama[rama.length - 1]; if (Math.hypot(u[0], u[1]) < 5) mal('Control · lugar: una rama no se aleja al infinito'); }
      // cada punto de cada rama es raíz de D + K·N
      let peor = 0; for (const rama of l.ramas) for (const z of rama) { const v = C.polBase([1], [1, 3, 2, 0], z[2]); const e = v.reduce((s, c) => [s[0] * z[0] - s[1] * z[1] + c, s[0] * z[1] + s[1] * z[0]], [0, 0]); peor = Math.max(peor, Math.hypot(e[0], e[1]) / Math.max(1, z[2])); } if (peor > 1e-6) mal(`Control · lugar: un punto de rama no cumple la ecuación (error ${peor})`); }
    // K(s+3)/(s(s²+2s+2)): salida de −1+j a −18,43°, centroide 0,5 y cruce en K = 4, ω = √6
    { const l = r('raices-complejos').lg; cerca(l.angulos[0].ang, -18.434948822922, 1e-9, 'lugar: ángulo de salida'); cerca(l.asint.centro, 0.5, 1e-9, 'lugar: centroide 2'); cerca(l.cruces[0].K, 4, 1e-9, 'lugar: K crítica 2'); cerca(l.cruces[0].w, Math.sqrt(6), 1e-9, 'lugar: ω crítica 2'); cerca(l.ruptura.length, 0, 0, 'lugar: sin ruptura'); }
    // ángulo de llegada a un cero complejo: (s² + 2s + 2)/(s(s+3)) → cero −1+j, llega con 180° − (∠ al polo 0 = 135°) ... se comprueba con la condición de fase
    { const N = [1, 2, 2], D = [1, 3, 0], l = C.lugar(N, D), a = l.angulos.find((x) => x.tipo === 'cero'), z = a.z, e = a.ang * Math.PI / 180, s = [z[0] + 1e-6 * Math.cos(e), z[1] + 1e-6 * Math.sin(e)];
      const ev = (p) => p.reduce((t, c) => [t[0] * s[0] - t[1] * s[1] + c, t[0] * s[1] + t[1] * s[0]], [0, 0]), n = ev(N), d = ev(D), fase = Math.atan2(n[1], n[0]) - Math.atan2(d[1], d[0]); cerca(Math.cos(fase), -1, 1e-4, 'lugar: el ángulo de llegada cumple la condición de fase'); }
    // asíntotas con ganancia efectiva negativa (N con coeficiente líder negativo): ángulos 0° y 180° en vez de ±90°
    { const l = C.lugar([-1], [1, 3, 2]); if (l.asint.ang.join() !== '0,180') mal(`Control · lugar: ganancia negativa ${l.asint.ang}`); }

    // Nyquist de K/(s(s+1)(s+2)): MG = 6, ω₁₈₀ = √2, MF = 90° − atan ω − atan(ω/2) en |L| = 1
    { const s = r('nyquist-tres'), n = s.ny; cerca(s.gm.GM, 6, 1e-6, 'Nyquist: margen de ganancia'); cerca(s.gm.w, Math.SQRT2, 1e-6, 'Nyquist: ω₁₈₀'); cerca(s.gm.GMdB, 20 * Math.log10(6), 1e-6, 'Nyquist: margen en dB');
      const w = s.pm.w; cerca(w * Math.hypot(w, 1) * Math.hypot(w, 2), 1, 1e-9, 'Nyquist: |L| = 1 en ωc'); cerca(s.pm.PM, 90 - Math.atan(w) * 180 / Math.PI - Math.atan(w / 2) * 180 / Math.PI, 1e-6, 'Nyquist: margen de fase');
      cerca(n.P, 0, 0, 'Nyquist: P = 0'); cerca(n.Ncw, 0, 0, 'Nyquist: N = 0'); cerca(n.Z, 0, 0, 'Nyquist: Z = 0');
      // con K = 10 la curva rodea −1 dos veces
      const t = r('nyquist-tres', 10).ny; cerca(t.Ncw, 2, 0, 'Nyquist K = 10: N = 2'); cerca(t.Z, 2, 0, 'Nyquist K = 10: Z = 2'); cerca(r('nyquist-tres', 10).gm.GM, 0.6, 1e-6, 'Nyquist K = 10: MG = 0,6');
      // la K crítica de Nyquist coincide con la de Routh
      cerca(1 * s.gm.GM, s.rk.criticos[0].K, 1e-6, 'Nyquist y Routh dan la misma K crítica'); }
    // polo inestable K/(s − 1) con K = 2: una vuelta antihoraria (N = −1), P = 1, Z = 0
    { const n = r('nyquist-inestable').ny; cerca(n.P, 1, 0, 'Nyquist inestable: P = 1'); cerca(n.Ncw, -1, 0, 'Nyquist inestable: N = −1'); cerca(n.Z, 0, 0, 'Nyquist inestable: Z = 0');
      const u = r('nyquist-inestable', 0.5).ny; cerca(u.Ncw, 0, 0, 'K = 0,5: N = 0'); cerca(u.Z, 1, 0, 'K = 0,5: Z = 1'); cerca(r('nyquist-inestable').rk.estables[0].a, 1, 1e-9, 'rango K > 1'); }
    // el criterio de Nyquist (curva) concuerda con las raíces en una colección de sistemas, con polos en el origen y en el eje imaginario
    { const sist = [[[1], [1, 0, 0, 1]], [[1], [1, 0, 1, 0]], [[1, 1], [1, 0, 0, -1]], [[1, 2], [1, 1, 0, 0]], [[1], [1, 4, 5, 2]], [[1, 5], [1, 2, 3, 4, 0]], [[1], [1, 0, 1]], [[2, 1], [1, 1, 0, 0, 0]], [[1, 1], [1, -2, 5]], [[1, 0, 4], [1, 0, 1, 0, 0]]];
      for (const [N, D] of sist) for (const K of [0.3, 1, 3, 10]) { const y = C.nyquist(N, D, K); if (y.pasaPor) continue; if (y.Z !== y.zCL) mal(`Control · Nyquist N(s)=[${N}] D(s)=[${D}] K=${K}: Z por la curva = ${y.Z} y por las raíces = ${y.zCL}`); } }
    // errores
    for (const [sc, q] of [[{ modo: 'routh', num: '1', den: '' }, 'falta el denominador'], [{ modo: 'routh', num: '1', den: 's^2+(' }, 'paréntesis sin cerrar'], [{ modo: 'raices', num: '', den: 's+1' }, 'falta el numerador en las raíces'], [{ modo: 'raices', num: 's^3', den: 's+1' }, 'sistema no propio'], [{ modo: 'nyquist', num: '1', den: 's+1', K: '0' }, 'K cero'], [{ modo: 'routh', num: '0', den: 's+1' }, 'numerador cero'], [{ modo: 'routh', num: '1', den: '5' }, 'denominador constante'], [{ modo: 'routh', num: '1', den: 's+1', K: 'x' }, 'K no numérica']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Control: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Control: Routh (ε y fila de ceros), lugar de las raíces y Nyquist, ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'circuitos', 'control', 'index.html'));
    await page.waitForFunction(() => window.ControlApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('control').current) mal(`Control: la página muestra la versión «${ver}», se esperaba ${Version.de('control').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => ControlApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => {
        const c = document.querySelector('#grafica'), t = document.createElement('canvas'); t.width = c.width; t.height = c.height; const tg = t.getContext('2d', { willReadFrequently: true }); tg.drawImage(c, 0, 0); const d = tg.getImageData(0, 0, c.width, c.height).data; let pintados = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) pintados++;
        return { err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, pintados, modo: document.querySelector('.modos [aria-selected="true"]').dataset.modo };
      });
      if (r.err || !r.pasos || !r.res) mal(`Control · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Control · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.pintados < 500) mal(`Control · ${e.clave}: la gráfica sale vacía`);
      if (r.modo !== e.sc.modo) mal(`Control · ${e.clave}: no abre la pestaña ${e.sc.modo}`);
    }
    // las tres pestañas con los mismos datos y un resultado conocido en pantalla
    await page.evaluate(() => ControlApp.abrirEjemplo('tercer-orden'));
    for (const [modo, esperado] of [['raices', /−0,4226/], ['nyquist', /6 \(15,56 dB\)/], ['routh', /0 < K < 6/]]) {
      await page.click(`.modos [data-modo="${modo}"]`);
      const t = await page.locator('#resumen').textContent();
      if (!esperado.test(t)) mal(`Control · pestaña ${modo}: el resumen no trae ${esperado}: «${t}»`);
    }
    await page.fill('#f-den', 's^2+(');
    if (await page.locator('#error').isHidden()) mal('Control: un polinomio mal escrito no muestra el error');
    await page.close();
    if (consola.length) mal('Control: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Control: ${C.ejemplos.length} ejemplos en la página con MathML, gráfica y pestañas, sin errores de consola`);
  };
};
