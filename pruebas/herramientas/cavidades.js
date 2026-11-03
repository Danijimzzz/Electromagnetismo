/* Comprobación de cavidades: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo cavidades ejecuta solo esta).
   Los campos se validan sin mirar el cálculo del Q: divergencia nula, ∇×∇×H = k²H (que fija también la frecuencia),
   E tangencial nulo en las paredes y, aparte, el Q por integración directa en 3D del campo cartesiano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'cavidades', 'calculo.js'));
  const c0 = 299792458, mu0 = 4e-7 * Math.PI, PI = Math.PI;
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Cavidades · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    const delta = (f, s) => 1 / Math.sqrt(PI * f * mu0 * s);

    // ceros conocidos de Bessel y de Bessel esféricas
    cerca(C.cerosJ(0, 1), 2.404825557695773, 1e-9, 'primer cero de J0'); cerca(C.cerosJ(1, 2), 7.015586669815619, 1e-9, 'segundo cero de J1');
    cerca(C.cerosJp(1, 1), 1.841183781340659, 1e-9, 'primer cero de J′1'); cerca(C.cerosJp(0, 1), 3.831705970207512, 1e-9, 'primer cero de J′0 (= J1)');
    cerca(C.cerosj(1, 1), 4.493409457909064, 1e-9, 'primer cero de j1'); cerca(C.cerosg(1, 1), 2.743707269992269, 1e-9, 'primer cero de (x j1)′');
    cerca(C.jn(2, 3), 0.2986374970757335, 1e-9, 'j2(3)'); cerca(C.jn(3, 1.5), 0.02832464158247, 1e-9, 'j3(1,5) por serie'); cerca(C.Jn(2, 3.7), 0.428329656206576, 1e-9, 'J2(3,7)');

    // rectangular TE101: f = c/2·√(1/a² + 1/d²) y Q de Pozar
    const a = 0.02286, b = 0.01016, d = 0.03, s = 5.8e7;
    const t1 = r('rect-te101'), f1 = c0 / 2 * Math.hypot(1 / a, 1 / d), k = 2 * PI * f1 / c0, eta = 376.730313, Rs = 1 / (s * delta(f1, s));
    cerca(t1.f0, f1, 1e-12, 'f0 del TE101'); cerca(t1.lam, c0 / f1, 1e-12, 'λ0');
    cerca(t1.Qc, (k * a * d) ** 3 * b * eta / (2 * PI * PI * Rs) / (2 * a ** 3 * b + 2 * b * d ** 3 + a ** 3 * d + a * d ** 3), 1e-7, 'Q de Pozar del TE101');
    cerca(t1.Q, t1.Qc, 1e-12, 'sin pérdidas en el relleno, Q = Qc'); cerca(t1.df, t1.f0 / t1.Q, 1e-12, 'Δf = f0/Q'); cerca(t1.delta, delta(f1, s), 1e-12, 'δ');
    const cu = r('cubo'); cerca(cu.f0, c0 / (2 * 0.04) * Math.SQRT2, 1e-12, 'f0 del cubo'); if (cu.modos.slice(0, 3).map((q) => q.nombre).sort().join() !== 'TE<sub>011</sub>,TE<sub>101</sub>,TM<sub>110</sub>' || Math.abs(cu.modos[2].f - cu.modos[0].f) > 1) mal('Cavidades: los tres modos más bajos del cubo deberían ser el TE011, el TE101 y el TM110, degenerados');
    // relleno con pérdidas: 1/Q = 1/Qc + tg δ y velocidad c/√εr
    const te = r('teflon'), fT = c0 / Math.sqrt(2.1) / 2 * Math.hypot(1 / 0.03, 1 / 0.03);
    cerca(te.f0, fT, 1e-12, 'f0 con teflón'); cerca(1 / te.Q, 1 / te.Qc + 3e-4, 1e-12, '1/Q con pérdidas'); cerca(te.Qd, 1 / 3e-4, 1e-12, 'Qd'); if (te.Q >= te.Qc) mal('Cavidades: el dieléctrico debería bajar el Q');
    // cilíndrica TM010: f = c·2,405/(2πR), Q = (R/δ)/(1 + R/L)
    const c1 = r('cil-tm010'), fc = c0 * 2.404825557695773 / (2 * PI * 0.025);
    cerca(c1.f0, fc, 1e-9, 'f0 del TM010'); cerca(c1.Qc, (0.025 / delta(fc, s)) / (1 + 0.025 / 0.04), 1e-6, 'Q del TM010'); cerca(c1.cerrada, c1.Qc, 1e-12, 'fórmula cerrada del TM010');
    // cilíndrica TE011 (x′ = 3,8317): f = c/2π·√((x′/R)² + (π/L)²)
    const c2 = r('cil-te011'); cerca(c2.f0, c0 / (2 * PI) * Math.hypot(3.831705970207512 / 0.02, PI / 0.04), 1e-9, 'f0 del TE011');
    const c3 = r('cil-te111'); cerca(c3.f0, c0 / (2 * PI) * Math.hypot(1.841183781340659 / 0.02, PI / 0.04), 1e-9, 'f0 del TE111');
    // Q del TE011: crece con R/δ; comparado con el TE111 de la misma cavidad es mayor
    if (!(c2.Qc > c3.Qc)) mal('Cavidades: el TE011 debería tener más Q que el TE111');
    // esférica: TM11 (x = 2,7437), TE11 (x = 4,4934, Q = R/δ)
    const e1 = r('esf-tm11'), e2 = r('esf-te11');
    cerca(e1.f0, c0 * 2.743707269992269 / (2 * PI * 0.05), 1e-9, 'f0 del TM11 esférico'); cerca(e2.f0, c0 * 4.493409457909064 / (2 * PI * 0.05), 1e-9, 'f0 del TE11 esférico');
    cerca(e2.Qc, 0.05 / delta(e2.f0, s), 1e-6, 'Q de los modos TE esféricos = R/δ'); if (e1.modos[0].nombre !== 'TM<sub>11</sub>') mal('Cavidades: el modo más bajo de la esfera debería ser el TM11');
    // ---- campos: Maxwell y paredes ----
    const modos = [
      ...C.ejemplos.map((e) => e.sc),
      { geo: 'rect', a: '30', b: '20', d: '40', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TM', i1: '1', i2: '1', i3: '1' },
      { geo: 'rect', a: '30', b: '20', d: '40', er: '2', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '2', i2: '1', i3: '2' },
      { geo: 'rect', a: '30', b: '20', d: '40', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TM', i1: '2', i2: '1', i3: '0' },
      { geo: 'cil', R: '25', L: '40', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TM', i1: '1', i2: '1', i3: '1' },
      { geo: 'cil', R: '25', L: '40', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '2', i2: '1', i3: '2' },
      { geo: 'cil', R: '25', L: '40', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TM', i1: '0', i2: '2', i3: '1' },
      { geo: 'esf', R: '50', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TM', i1: '2', i2: '1', i3: '0' },
      { geo: 'esf', R: '50', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '3', i2: '2', i3: '0' },
    ];
    const rot = (H, p, h) => {
      const dd = (i, j) => { const p1 = p.slice(), p2 = p.slice(); p1[j] += h; p2[j] -= h; return (H(...p1)[i] - H(...p2)[i]) / (2 * h); };
      return [dd(2, 1) - dd(1, 2), dd(0, 2) - dd(2, 0), dd(1, 0) - dd(0, 1)];
    };
    const norma = (v) => Math.hypot(...v);
    let semilla = 12345; const alea = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    for (const sc of modos) {
      const nom = `${sc.geo} ${sc.tipo}${sc.i1}${sc.i2}${sc.geo === 'esf' ? '' : sc.i3}`, sol = C.resolver(sc), { H, k, lims, dentro } = C.modoCampo(sc), tam = Math.max(...lims.map((l) => l[1] - l[0])), h = 1e-3 * tam;
      const punto = () => { for (;;) { const p = lims.map((l) => l[0] + alea() * (l[1] - l[0])); if (dentro(...p)) return p; } };
      let hm = 0, em = 0, div = 0, cc = 0;
      for (let q = 0; q < 14; q++) {
        const p = punto(), Hp = H(...p), e = rot(H, p, h), ee = rot((x, y, z) => rot(H, [x, y, z], h), p, h);
        hm = Math.max(hm, norma(Hp)); em = Math.max(em, norma(e) / k);
        let dv = 0; for (let j = 0; j < 3; j++) { const p1 = p.slice(), p2 = p.slice(); p1[j] += h; p2[j] -= h; dv += (H(...p1)[j] - H(...p2)[j]) / (2 * h); }
        div = Math.max(div, Math.abs(dv) / k); cc = Math.max(cc, norma(ee.map((v, j) => v - k * k * Hp[j])) / (k * k));
      }
      if (div > 2e-4 * hm) mal(`Cavidades · ${nom}: ∇·H no es nulo (${div} frente a ${hm})`);
      if (cc > 2e-3 * hm) mal(`Cavidades · ${nom}: ∇×∇×H ≠ k²H (${cc} frente a ${hm}): campo o frecuencia mal`);
      // E tangencial nulo en las paredes
      const sup = [];
      const D = sol.D;
      if (sc.geo === 'rect') for (let q = 0; q < 18; q++) { const eje = q % 3, p = [alea() * D.a, alea() * D.b, alea() * D.d]; p[eje] = Math.floor(alea() * 2) ? [D.a, D.b, D.d][eje] : 0; const n = [0, 0, 0]; n[eje] = 1; sup.push([p, n]); }
      else if (sc.geo === 'cil') for (let q = 0; q < 18; q++) {
        if (q % 3) { const ph = alea() * 2 * PI, r = alea() * D.R; sup.push([[r * Math.cos(ph), r * Math.sin(ph), q % 2 ? D.L : 0], [0, 0, 1]]); }
        else { const ph = alea() * 2 * PI; sup.push([[D.R * Math.cos(ph), D.R * Math.sin(ph), alea() * D.L], [Math.cos(ph), Math.sin(ph), 0]]); }
      } else for (let q = 0; q < 18; q++) { let v; do v = [alea() * 2 - 1, alea() * 2 - 1, alea() * 2 - 1]; while (norma(v) > 1 || norma(v) < 0.1); const n = v.map((x) => x / norma(v)); sup.push([n.map((x) => x * D.R), n]); }
      let et = 0;
      for (const [p, n] of sup) { const e = rot(H, p, h).map((x) => x / k), en = e[0] * n[0] + e[1] * n[1] + e[2] * n[2]; et = Math.max(et, norma(e.map((x, j) => x - en * n[j]))); }
      if (et > 2e-3 * em) mal(`Cavidades · ${nom}: el campo eléctrico tangencial no se anula en las paredes (${et} frente a ${em})`);
    }

    // ---- Q por integración directa en 3D del campo cartesiano ----
    const directo = (sc) => {
      const sol = C.resolver(sc), { H, lims, dentro } = C.modoCampo(sc), D = sol.D, N = 60;
      let vol = 0, area = 0; const dV = lims.reduce((p, l) => p * (l[1] - l[0]) / N, 1);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let q = 0; q < N; q++) {
        const p = lims.map((l, m) => l[0] + ([i, j, q][m] + 0.5) / N * (l[1] - l[0]));
        if (dentro(...p)) { const h = H(...p); vol += (h[0] * h[0] + h[1] * h[1] + h[2] * h[2]) * dV; }
      }
      const tan2 = (h, n) => { const hn = h[0] * n[0] + h[1] * n[1] + h[2] * n[2]; return h[0] ** 2 + h[1] ** 2 + h[2] ** 2 - hn * hn; };
      const M = 120;
      if (sc.geo === 'rect') {
        const L = [D.a, D.b, D.d];
        for (let eje = 0; eje < 3; eje++) { const o = [0, 1, 2].filter((x) => x !== eje); for (const lado of [0, 1]) for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
          const p = [0, 0, 0]; p[eje] = lado * L[eje]; p[o[0]] = (i + 0.5) / M * L[o[0]]; p[o[1]] = (j + 0.5) / M * L[o[1]]; const n = [0, 0, 0]; n[eje] = 1; area += tan2(H(...p), n) * L[o[0]] * L[o[1]] / (M * M);
        } }
      } else if (sc.geo === 'cil') {
        for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
          const ph = (i + 0.5) / M * 2 * PI, z = (j + 0.5) / M * D.L; area += tan2(H(D.R * Math.cos(ph), D.R * Math.sin(ph), z), [Math.cos(ph), Math.sin(ph), 0]) * D.R * 2 * PI * D.L / (M * M);
          const r = (j + 0.5) / M * D.R; for (const z2 of [0, D.L]) area += tan2(H(r * Math.cos(ph), r * Math.sin(ph), z2), [0, 0, 1]) * r * D.R * 2 * PI / (M * M);
        }
      } else {
        for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
          const th = (i + 0.5) / M * PI, ph = (j + 0.5) / M * 2 * PI, n = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
          area += tan2(H(D.R * n[0], D.R * n[1], D.R * n[2]), n) * D.R * D.R * Math.sin(th) * (PI / M) * (2 * PI / M);
        }
      }
      return { gam: vol / area, sol };
    };
    for (const clave of ['rect-te101', 'cil-te011', 'cil-tm010', 'esf-tm11', 'esf-te11']) {
      const sc = C.ejemplos.find((e) => e.clave === clave).sc, dr = directo(sc);
      cerca(dr.sol.gam, dr.gam, 0.02, `Γ de ${clave} frente a la integración directa en 3D`);
    }

    for (const x of C.ejemplos) { const s2 = C.resolver(x.sc); if (s2.pasos.length < 7) mal(`Cavidades · ${x.clave}: desarrollo corto`); if (s2.modos.length < 6) mal(`Cavidades · ${x.clave}: faltan modos en la lista`); }
    // mapa de campo
    const m = C.mapa(r('esf-tm11'), 'xz', 0.5, 'E'), m2 = C.mapa(r('rect-te101'), 'xy', 0.5, 'H');
    if (!(m.max > 0) || m.perfil.t !== 'circ' || !(m2.max > 0) || m2.perfil.t !== 'rect') mal('Cavidades: el mapa de campo no sale bien');
    for (const [q, sc] of [['sin lado a', { ...C.ejemplos[0].sc, a: '' }], ['TE con p = 0', { ...C.ejemplos[0].sc, i3: '0' }], ['TM con n = 0', { ...C.ejemplos[0].sc, tipo: 'TM' }], ['TE con m = n = 0', { ...C.ejemplos[0].sc, i1: '0', i2: '0' }],
      ['cilíndrica con m = 0', { ...C.ejemplos[3].sc, i2: '0' }], ['esférica con n = 0', { ...C.ejemplos[6].sc, i1: '0' }], ['σ cero', { ...C.ejemplos[0].sc, sigma: '0' }], ['εr cero', { ...C.ejemplos[0].sc, er: '0' }], ['índice decimal', { ...C.ejemplos[0].sc, i1: '1,5' }], ['tg δ negativa', { ...C.ejemplos[0].sc, tand: '-1' }]]) {
      let ok = false; try { C.resolver(sc); } catch (err) { ok = true; }
      if (!ok) mal(`Cavidades: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Cavidades: ${C.ejemplos.length} ejemplos, f0 de las tres formas, Q de Pozar, del TM010 y de la esfera, ceros de Bessel, Maxwell y paredes en ${modos.length} modos, Q por integración directa y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'cavidades', 'index.html'));
    await page.waitForFunction(() => window.CavidadesApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('cavidades').current) mal(`Cavidades: la página muestra la versión «${ver}», se esperaba ${Version.de('cavidades').current}`);
    // píxeles distintos del vacío: tamaño del PNG del lienzo frente al de uno en blanco del mismo tamaño
    const pixeles = () => page.evaluate(() => { const c = document.querySelector('#grafica'), v = document.createElement('canvas'); v.width = c.width; v.height = c.height; return c.toDataURL().length - v.toDataURL().length; });
    for (const e of C.ejemplos) {
      await page.evaluate((c) => CavidadesApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, num: document.querySelectorAll('#resumen > div.num').length, filas: document.querySelectorAll('#modos tbody tr').length }));
      if (r.err || !r.pasos || !r.res || !r.num || r.filas < 6) mal(`Cavidades · ${e.clave}: falta el resultado, el desarrollo o la tabla de modos`);
      if (!r.mathml || r.dolar) mal(`Cavidades · ${e.clave}: el desarrollo no sale en MathML`);
      if ((await pixeles()) < 1500) mal(`Cavidades · ${e.clave}: el lienzo parece vacío`);
    }
    // cambiar de forma, de plano, de campo y de modo desde la tabla
    await page.evaluate(() => CavidadesApp.abrirEjemplo('cil-tm010'));
    await page.selectOption('#plano', 'xy'); await page.click('#que button[data-q="H"]'); await page.fill('#pos', '30'); await page.dispatchEvent('#pos', 'input');
    if ((await pixeles()) < 500) mal('Cavidades: el mapa del campo magnético en la sección no dibuja nada');
    await page.click('#modos button >> nth=2');
    const cambio = await page.evaluate(() => ({ modo: document.querySelector('#resumen .est').textContent, err: !document.querySelector('#error').hidden }));
    if (cambio.err || !cambio.modo) mal('Cavidades: elegir un modo de la tabla falla');
    await page.selectOption('#f-geo', 'esf');
    const esf = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, campos: document.querySelectorAll('#campos input[data-k]').length, plano: document.querySelector('#plano').value }));
    if (esf.err) mal('Cavidades: pasar a la esfera da error');
    await page.fill('#f-R', '0');
    if (await page.locator('#error').isHidden()) mal('Cavidades: un radio cero no muestra el error');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => CavidadesApp.azar());
      const az = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, enun: CavidadesApp.enunciado().length, num: document.querySelectorAll('#resumen > div.num').length }));
      if (az.err || az.enun < 50 || !az.num) mal('Cavidades: el ejercicio al azar no sale bien');
    }
    await page.close();
    if (consola.length) mal('Cavidades: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Cavidades: ${C.ejemplos.length} ejemplos en la página con MathML, tabla de modos, mapa de campo, cambio de forma, ejercicio al azar y errores, sin errores de consola`);
  };
};
