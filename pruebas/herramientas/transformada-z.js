/* Comprobación de transformada-z: cálculos en Node (valores hechos a mano) y la página en Chromium.
   node pruebas/comprobar.js --solo transformada-z ejecuta solo esta. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'transformada-z', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`TransformadaZ · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // 1.er orden: H = 1/(1 − 0,5 z⁻¹): polo 0,5, h[n] = 0,5ⁿ, H(1) = 2, H(−1) = 1/1,5
    let s = r('paso-bajo');
    cerca(s.polos[0].p[0], 0.5, 1e-9, 'polo 1.er orden'); cerca(s.rmax, 0.5, 1e-9, '|p| 1.er orden');
    cerca(s.h[3], 0.125, 1e-12, 'h[3] 1.er orden'); cerca(s.H1, 2, 1e-9, 'H(1)'); cerca(s.Hn, 1 / 1.5, 1e-9, 'H(−1)');
    cerca(s.cerr.valor(5), 0.5 ** 5, 1e-9, 'forma cerrada 1.er orden');
    if (s.estab !== 'estable') mal('TransformadaZ: el sistema de 1.er orden debe ser estable');
    // 2.º orden: polos 0,6 ± 0,6j (|p| = 0,6√2); h = 1, 1,2, 0,72, 0, −0,5184
    s = r('resonador');
    cerca(s.polos[0].p[0], 0.6, 1e-8, 'parte real del polo'); cerca(Math.abs(s.polos[0].p[1]), 0.6, 1e-8, 'parte imaginaria del polo');
    cerca(s.rmax, 0.6 * Math.SQRT2, 1e-8, '|p| 2.º orden');
    [1, 1.2, 0.72, 0, -0.5184].forEach((v, n) => cerca(s.h[n], v, 1e-9, `h[${n}] 2.º orden`));
    for (let n = 0; n < 12; n++) cerca(s.cerr.valor(n), s.h[n], 1e-8, `forma cerrada = recursión en n = ${n}`);
    // inestable: z² − 2,5z + 1 = (z − 2)(z − 0,5)
    s = r('inestable');
    cerca(s.rmax, 2, 1e-8, 'polo en 2'); if (s.estab !== 'inestable') mal('TransformadaZ: debe ser inestable');
    cerca(s.h[3], 10.625, 1e-9, 'h[3] inestable');
    // FIR: media móvil de 4: 4 ceros en 0, sin polos propios salvo z = 0 (×3), H(1) = 1, H(−1) = 0
    s = r('media-movil');
    cerca(s.H1, 1, 1e-12, 'H(1) media móvil'); cerca(s.Hn, 0, 1e-12, 'H(−1) media móvil'); cerca(s.h[3], 0.25, 1e-12, 'h[3] media móvil'); cerca(s.h[4], 0, 1e-12, 'h[4] media móvil');
    cerca(s.ceros.reduce((t, z) => t + z.m, 0), 3, 0, 'tres ceros'); if (s.estab !== 'estable') mal('TransformadaZ: el FIR debe ser estable');
    // directa: aⁿ u[n] → z/(z − a)
    s = r('exp');
    cerca(s.polos[0].p[0], 0.8, 1e-9, 'polo de aⁿ·u[n]'); cerca(s.h[4], 0.4096, 1e-12, 'x[4] = 0,8⁴');
    // escalón: polo en 1 (marginal); rampa: polo doble en 1 → inestable; coseno: |p| = a
    s = C.resolver({ modo: 'directa', tipo: 'escalon' });
    if (s.estab !== 'marginal') mal(`TransformadaZ: el escalón debe ser marginal, no ${s.estab}`);
    s = C.resolver({ modo: 'directa', tipo: 'rampa' });
    if (s.estab !== 'inestable' || s.polos[0].m !== 2) mal('TransformadaZ: la rampa tiene un polo doble en 1');
    [0, 1, 2, 3, 4].forEach((n) => cerca(s.h[n], n, 1e-9, `rampa x[${n}]`));
    s = r('coseno'); cerca(s.rmax, 0.9, 1e-8, '|p| del coseno amortiguado'); cerca(s.h[2], 0, 1e-12, 'x[2] = cos(π/2)·0,81');
    s = C.resolver({ modo: 'directa', tipo: 'finita', x: '1 2 3' });
    cerca(s.h[2], 3, 1e-12, 'secuencia finita'); cerca(s.H1, 6, 1e-12, 'X(1) = suma'); if (s.polos.length !== 0 && s.polos.some((z) => z.p[0] !== 0)) mal('TransformadaZ: secuencia finita sin polos propios');
    // DFT de [1,2,3,4] = [10, −2+2j, −2, −2−2j] y FFT = DFT
    const d = C.dft([1, 2, 3, 4], [0, 0, 0, 0]), F = C.fft([1, 2, 3, 4], [0, 0, 0, 0]);
    [[10, 0], [-2, 2], [-2, 0], [-2, -2]].forEach(([re, im], k) => { cerca(d.re[k], re, 1e-12, `DFT re[${k}]`); cerca(d.im[k], im, 1e-12, `DFT im[${k}]`); cerca(F.re[k], re, 1e-12, `FFT re[${k}]`); cerca(F.im[k], im, 1e-12, `FFT im[${k}]`); });
    const x = Array.from({ length: 64 }, (_, n) => Math.sin(n * 0.37) + 0.3 * Math.cos(n * 1.9) + (n % 5)), z0 = Array(64).fill(0), a = C.dft(x, z0), b = C.fft(x, z0);
    cerca(Math.max(...a.re.map((v, k) => Math.abs(v - b.re[k]))), 0, 1e-9, 'FFT = DFT con 64 muestras');
    // dos tonos en bin exacto: fs = 640, N = 64 → Δf = 10 Hz, picos 50 Hz (1) y 120 Hz (0,5)
    s = r('dos-tonos');
    cerca(s.df, 10, 1e-12, 'resolución'); cerca(s.pk[0].f, 50, 1e-9, 'f del tono 1'); cerca(s.pk[0].amp, 1, 1e-9, 'amplitud del tono 1');
    cerca(s.pk[1].f, 120, 1e-9, 'f del tono 2'); cerca(s.pk[1].amp, 0.5, 1e-9, 'amplitud del tono 2'); cerca(s.pk.length, 2, 0, 'solo dos picos');
    cerca(s.fftMul, 192, 0, 'multiplicaciones FFT = (N/2)log₂N'); cerca(s.dftMul, 4096, 0, 'multiplicaciones DFT = N²');
    cerca(s.parseval[0], s.parseval[1], 1e-9, 'Parseval');
    // con Hann la amplitud del tono sigue siendo 1 (se divide por la ganancia coherente 0,5)
    s = C.resolver({ ...C.ejemplos.find((e) => e.clave === 'dos-tonos').sc, ventana: 'hann' });
    cerca(s.pk[0].amp, 1, 1e-9, 'amplitud con ventana de Hann'); cerca(s.cg, 0.5, 1e-12, 'ganancia coherente de Hann');
    // aliasing: 130 Hz a 100 Hz de muestreo se ve en 30 Hz
    s = r('aliasing'); cerca(s.alias[0].alias, 30, 1e-9, 'frecuencia plegada'); cerca(s.pk[0].f, 30, 1.5, 'pico cerca de 30 Hz');
    // muestras 1 2 3 4 (fs = 4): el bin 0 vale 10/4 = 2,5 y el bin 2 (Nyquist) 2/4 = 0,5
    s = r('muestras'); cerca(s.amp[0], 2.5, 1e-12, 'continua de 1 2 3 4'); cerca(s.amp[2], 0.5, 1e-12, 'Nyquist de 1 2 3 4'); cerca(s.amp[1], 2 * Math.hypot(2, 2) / 4, 1e-12, 'bin 1');
    // errores de usuario
    for (const [sc, q] of [[{ modo: 'sistema', b: '1', a: '0 1' }, 'a₀ = 0'], [{ modo: 'sistema', b: '', a: '1' }, 'numerador vacío'], [{ modo: 'sistema', b: '1 x', a: '1' }, 'texto en un coeficiente'],
      [{ modo: 'fft', senal: 'tonos', fs: '100', N: '60', a1: '1', f1: '5' }, 'N no es potencia de 2'], [{ modo: 'fft', senal: 'tonos', fs: '0', N: '8', a1: '1', f1: '5' }, 'fs = 0'], [{ modo: 'directa', tipo: 'exp', a: '' }, 'falta a']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`TransformadaZ: ${q} no da error`);
    }
    // TZ-4: polo doble, sistema nulo y cancelación polo-cero
    {
      const S = (b, a) => C.resolver({ modo: 'sistema', b, a, Nn: '8' });
      const d = S('1', '1 -2 1'); if (d.polos.length !== 1 || d.polos[0].m !== 2 || d.estab !== 'inestable') mal('TransformadaZ · polo doble en z = 1: multiplicidad o estabilidad mal');
      cerca(d.h[4], 5, 1e-9, 'polo doble: h[4] = n + 1');
      if (!d.pasos.some((p) => /×2/.test(p.html))) mal('TransformadaZ · polo doble: los pasos no muestran la multiplicidad (×2)');
      const z = S('0', '1 -0,5'); if (!z.nulo || !z.pasos.some((p) => p.t === 'Sistema nulo') || z.h.some((x) => x !== 0)) mal('TransformadaZ · b = 0: no avisa de que H(z) = 0');
      const c = S('1 -0,5', '1 -0,5'); if (c.cancel.length !== 1 || !c.pasos.some((p) => p.t === 'Cancelación polo-cero') || c.polosEf.length !== 0) mal('TransformadaZ · cancelación polo-cero no detectada'); cerca(c.h[0], 1, 1e-12, 'cancelación: h[0] = 1'); cerca(c.h[3], 0, 1e-12, 'cancelación: h[3] = 0');
      const q = S('1 -2', '1 -2'); if (q.estab !== 'estable') mal('TransformadaZ · polo inestable cancelado: debe juzgarse estable (h = δ) con el aviso');
      const m = S('1 -1', '1 -2 1'); if (m.estab !== 'marginal') mal(`TransformadaZ · (1 − z⁻¹)/(1 − z⁻¹)²: queda un polo simple en 1, marginal, y sale ${m.estab}`); cerca(m.h[5], 1, 1e-9, 'cancelación parcial: h[5] = 1');
    }
    // TZ-1: transformada inversa. La suma Σ x[n] z⁻ⁿ en un punto de la RDC debe dar B(z)/A(z)
    {
      const compr = (b, a, roc, q) => {
        const t = C.resolver({ modo: 'inversa', b, a, roc: String(roc), Nn: '10' }), [lo, hi] = t.rocRango, rad = hi === Infinity ? lo * 1.6 + 0.5 : lo === 0 ? hi * 0.6 : Math.sqrt(lo * hi), ang = 0.7;
        let Sr = 0, Si = 0; for (let n = -300; n <= 300; n++) { const v = t.valor(n), m = Math.pow(rad, -n); if (v === 0) continue; Sr += v * m * Math.cos(n * ang); Si -= v * m * Math.sin(n * ang); }
        const ev = (cs) => cs.reduce((s2, c, k) => [s2[0] + c * Math.pow(rad, -k) * Math.cos(k * ang), s2[1] - c * Math.pow(rad, -k) * Math.sin(k * ang)], [0, 0]), nb = ev(t.b), da = ev(t.a), dd = da[0] ** 2 + da[1] ** 2;
        cerca(Sr, (nb[0] * da[0] + nb[1] * da[1]) / dd, 1e-6, `inversa ${q}: parte real de la serie`); cerca(Si, (nb[1] * da[0] - nb[0] * da[1]) / dd, 1e-6, `inversa ${q}: parte imaginaria`);
        return t;
      };
      for (const [b, a, n, q] of [['1', '1 -0,75 0,125', 3, 'dos polos reales'], ['1', '1 -2,5 1', 3, 'polos 0,5 y 2'], ['1', '1 -1 0,25', 2, 'polo doble'], ['1', '1 -1,2 0,72', 2, 'polos complejos'], ['1 0,5 2', '1 -0,5', 2, 'numerador de más grado'], ['2', '1 -0,3 -0,1 0,03', 4, 'tres polos'], ['1 -2', '1 -1,5 0,5625', 2, 'polo doble 0,75']]) for (let roc = 0; roc < n; roc++) if (!(q === 'tres polos' && roc === 1)) compr(  /* en esa región los radios 0,3 y 0,316 casi coinciden y la serie converge muy despacio */ b, a, roc, `${q}, región ${roc}`);
      const t = compr('1', '1 -0,75 0,125', 2, 'causal');
      cerca(t.xs[0], 1, 1e-9, 'inversa causal: x[0] = 1'); cerca(t.xs[1], 0.75, 1e-9, 'inversa causal: x[1] = 0,75'); cerca(t.xs[2], 0.75 * 0.75 - 0.125, 1e-9, 'inversa causal: x[2]');
      cerca(t.xs[4], 2 * 0.5 ** 4 - 0.25 ** 4, 1e-12, 'inversa causal: x[n] = 2(0,5)ⁿ − (0,25)ⁿ');
      const bi = C.resolver({ modo: 'inversa', b: '1', a: '1 -2,5 1', roc: '1', Nn: '12' });   // 1/((1 − 0,5z⁻¹)(1 − 2z⁻¹)), 0,5 < |z| < 2: bilateral
      if (bi.lado !== 'bilateral' || !bi.contieneCirc || bi.estab !== 'estable') mal('TransformadaZ · inversa bilateral: lado o circunferencia unidad mal');
      cerca(bi.valor(2), -1 / 3 * 0.25, 1e-12, 'bilateral: x[2] = −(1/3)·0,5²'); cerca(bi.valor(-1), -4 / 3 * 0.5, 1e-12, 'bilateral: x[−1] = −(4/3)·2⁻¹');
      const an = C.resolver({ modo: 'inversa', b: '1', a: '1 -0,5', roc: '0', Nn: '8' });   // |z| < 0,5: x[n] = −0,5ⁿ u[−n−1]
      cerca(an.valor(-1), -2, 1e-12, 'anticausal: x[−1] = −2'); cerca(an.valor(0), 0, 1e-12, 'anticausal: x[0] = 0');
      if (C.opcionesRoc({ a: '1 -2,5 1' }).length !== 3) mal('TransformadaZ · opciones de RDC: con dos polos debe haber 3 regiones');
      for (const [sc, q] of [[{ modo: 'inversa', b: '', a: '1' }, 'sin numerador'], [{ modo: 'inversa', b: '0', a: '1 -0,5' }, 'numerador cero'], [{ modo: 'inversa', b: '1', a: '0 1' }, 'a₀ = 0']]) { let ok = false; try { C.resolver(sc); } catch (e) { ok = true; } if (!ok) mal(`TransformadaZ · inversa: ${q} no da error`); }
    }
    // TZ-3: relleno de ceros y fase en la FFT
    {
      const base = C.resolver({ ...C.ejemplos.find((e) => e.clave === 'dos-tonos').sc }), pad = C.resolver({ ...C.ejemplos.find((e) => e.clave === 'dos-tonos').sc, pad: '256' });
      if (pad.frec.length !== 129 || base.frec.length !== 33) mal(`TransformadaZ · relleno: ${pad.frec.length} y ${base.frec.length} bins`);
      cerca(pad.dfBin, 640 / 256, 1e-12, 'relleno: separación de bins'); cerca(pad.df, 640 / 64, 1e-12, 'relleno: la resolución real no cambia');
      cerca(pad.pk[0].f, 50, 0.5, 'relleno: pico principal cerca de 50 Hz (la interpolación parabólica no es exacta con tanto relleno)'); cerca(pad.parseval[0], pad.parseval[1], 1e-6 * pad.parseval[0], 'relleno: Parseval');
      cerca(base.fase[5], 0, 1e-9, 'fase de un coseno sin desfase: 0° en 50 Hz (bin 5)');
      const dos = C.resolver({ modo: 'fft', senal: 'tonos', fs: '64', N: '64', a1: '1', f1: '8', p1: '90', ventana: 'rect' }); cerca(dos.fase[8], 90, 1e-6, 'fase de cos(ωn + 90°) en su bin: +90°');
      let ok = false; try { C.resolver({ modo: 'fft', senal: 'tonos', fs: '640', N: '64', a1: '1', f1: '50', pad: '100' }); } catch (e) { ok = true; } if (!ok) mal('TransformadaZ · relleno que no es potencia de 2 no da error');
      const csv = C.resolver({ modo: 'fft', senal: 'muestras', fs: '4', x: '1\n2\n3\n4', ventana: 'rect' }); cerca(csv.amp[0], 2.5, 1e-9, 'muestras pegadas una por línea: continua 2,5');
    }
    if (fallos === antes) console.log(`  ✓ TransformadaZ: polos, h[n], estabilidad, DFT/FFT, picos, ventanas y aliasing (${C.ejemplos.length} ejemplos) a mano`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'circuitos', 'transformada-z', 'index.html'));
    await page.waitForFunction(() => window.TransformadaZApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('transformada-z').current) mal(`TransformadaZ: la página muestra la versión «${ver}», se esperaba ${Version.de('transformada-z').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => TransformadaZApp.abrirEjemplo(c), e.clave);
      const vistas = await page.locator('#vistas button').count();
      for (let i = 0; i < vistas; i++) {
        await page.locator('#vistas button').nth(i).click();
        const pix = await page.evaluate(() => { const c = document.querySelector('#grafica'), v = document.createElement('canvas'); v.width = c.width; v.height = c.height; return c.toDataURL().length - v.toDataURL().length; });
        if (pix < 300) mal(`TransformadaZ · ${e.clave}: la pestaña ${i + 1} no dibuja nada`);
      }
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`TransformadaZ · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`TransformadaZ · ${e.clave}: el desarrollo no sale en MathML`);
    }
    // cambiar un dato recalcula; un dato mal escrito muestra el error
    await page.evaluate(() => TransformadaZApp.abrirEjemplo('paso-bajo'));
    await page.fill('#f-a', '1 -0,9');
    const rm = await page.evaluate(() => TransformadaZApp.resultado().rmax);
    if (Math.abs(rm - 0.9) > 1e-9) mal(`TransformadaZ: |p| = ${rm} en vez de 0,9 tras editar a`);
    await page.fill('#f-a', '0 1');
    if (await page.locator('#error').isHidden()) mal('TransformadaZ: a₀ = 0 no muestra el error');
    // el modo FFT: cambia el formulario
    await page.selectOption('#f-modo', 'fft');
    await page.waitForSelector('#f-fs'); await page.fill('#f-fs', '640'); await page.fill('#f-N', '64'); await page.fill('#f-a1', '1'); await page.fill('#f-f1', '50');
    const pf = await page.evaluate(() => TransformadaZApp.resultado().pico);
    if (Math.abs(pf - 50) > 1e-6) mal(`TransformadaZ: pico en ${pf} Hz en vez de 50`);
    { const Exp = require('./comun/exportar-grafica.js'); Exp.csv(mal);
      await page.evaluate(() => TransformadaZApp.abrirEjemplo('inversa-bilateral'));
      if ((await page.locator('#f-roc option').count()) !== 3) mal('TransformadaZ: el modo inversa no ofrece 3 regiones de convergencia');
      await page.selectOption('#f-roc', '0');
      { const r = await page.evaluate(() => TransformadaZApp.resultado()); if (!r) mal('TransformadaZ: la inversa anticausal no da resultado'); }
      await page.selectOption('#f-roc', '1'); await Exp.pagina(page, '#grafica', mal, 'TransformadaZ · x[n]');
      await page.fill('#f-a', '1 -0,5');
      if ((await page.locator('#f-roc option').count()) !== 2) mal('TransformadaZ: al cambiar el denominador no se rehacen las regiones');
      await page.evaluate(() => TransformadaZApp.abrirEjemplo('dos-tonos')); await Exp.pagina(page, '#grafica', mal, 'TransformadaZ · espectro');
      await page.fill('#f-pad', '256'); if (!(await page.locator('#error').isHidden())) mal('TransformadaZ: relleno de ceros 256 da error');
      await page.locator('#vistas button').nth(1).click(); if (!(await page.locator('#leyenda').textContent()).includes('Fase de cada bin')) mal('TransformadaZ: la pestaña Fase de la FFT no sale');
    }
    await page.close();
    if (consola.length) mal('TransformadaZ: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ TransformadaZ: ${C.ejemplos.length} ejemplos con todas sus pestañas, MathML, edición y errores, sin errores de consola`);
  };
};
