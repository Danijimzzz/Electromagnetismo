/* Comprobación de imagenes: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo imagenes ejecuta solo esta). Los valores esperados se han
   calculado a mano con las fórmulas del solucionario (ε₀ = 8,854187817·10⁻¹²). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'imagenes', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(Math.abs(b), 1e-300))) mal(`Imágenes · ${q}: ${a} en vez de ${b}`); };
    const cero = (a, q, tol = 1e-6) => { if (!(Math.abs(a) <= tol)) mal(`Imágenes · ${q}: ${a} en vez de 0`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    const e0 = 8.854187817e-12, k = 1 / (4 * Math.PI * e0);
    // plano: q = 5 nC, d = 3 cm
    { const s = r('plano'), q = 5e-9, d = 0.03;
      cerca(s.imagenes[0].q, -q, 1e-12, 'plano: q′'); cerca(s.imagenes[0].z, -d, 1e-12, 'plano: posición de la imagen');
      cerca(s.Fz, -(q * q) / (16 * Math.PI * e0 * d * d), 1e-9, 'plano: fuerza'); if (!s.atractiva) mal('Imágenes · plano: la fuerza debe ser atractiva');
      cerca(s.sigmaMax, -q / (2 * Math.PI * d * d), 1e-9, 'plano: σ máxima');
      cerca(s.W, (q * q) / (16 * Math.PI * e0 * d), 1e-9, 'plano: trabajo');
      // V en (ρ = 4, z = 3) cm: q a 3 cm, imagen a 9 cm; r1 = 4, r2 = √(16 + 36)
      cerca(s.pt.V, k * q * (1 / 0.04 - 1 / Math.sqrt(0.04 ** 2 + 0.06 ** 2)), 1e-9, 'plano: potencial en un punto');
      // V = 0 y E tangencial nulo sobre el plano
      { const v = C.campo(s.cargas, 0, 0.07).V; if (Math.abs(v) > 1e-9) mal(`Imágenes · plano: V en el plano = ${v}`); }
      // integral numérica de σ: −q
      // dentro de un radio R sale −q (1 − d/√(R² + d²)); el resto, hasta el infinito, es −q d/√(R² + d²)
      let I = 0; const n = 200000, R = 40 * d; for (let i = 0; i < n; i++) { const rho = ((i + 0.5) * R) / n; I += s.sigma(rho) * 2 * Math.PI * rho * (R / n); }
      cerca(I, -q * (1 - d / Math.hypot(R, d)), 1e-4, 'plano: carga inducida dentro de un radio (integral de σ)');
    }
    // esfera a tierra: q = 10 nC, a = 30 cm, R = 10 cm
    { const s = r('esfera-tierra'), q = 1e-8, a = 0.3, R = 0.1, qi = (-q * R) / a, ai = (R * R) / a;
      cerca(s.imagenes[0].q, qi, 1e-12, 'esfera a tierra: q′'); cerca(s.imagenes[0].z, ai, 1e-12, 'esfera a tierra: a′');
      cerca(s.Fz, (-q * q * R * a) / (4 * Math.PI * e0 * (a * a - R * R) ** 2), 1e-9, 'esfera a tierra: fuerza');
      cerca(s.Qe, qi, 1e-12, 'esfera a tierra: carga total'); cero(s.V0, 'esfera a tierra: V = 0');
      cerca(s.sigmaMax, (-q * (a + R)) / (4 * Math.PI * R * (a - R) ** 2), 1e-9, 'esfera a tierra: σ en θ = 0');
      cerca(s.W, (q * q * R) / (8 * Math.PI * e0 * (a * a - R * R)), 1e-9, 'esfera a tierra: trabajo');
      cerca(s.pt.V, k * (q / 0.15 + qi / (0.15 - ai)), 1e-9, 'esfera a tierra: potencial en un punto');
      cerca(Math.abs(integraEsfera(s)), Math.abs(qi), 2e-4, 'esfera a tierra: carga inducida (integral de σ)');
      // V = 0 en la superficie, a cualquier ángulo
      for (const th of [0.3, 1, 2, 3]) cero(C.campo(s.cargas, R * Math.cos(th), R * Math.sin(th)).V, `esfera a tierra: V en θ = ${th}`, 1e-9);
      // σ = ε₀ E_n en un punto de la superficie (justo fuera, normal radial)
      { const th = 1.1, c = C.campo(s.cargas, (R + 1e-9) * Math.cos(th), (R + 1e-9) * Math.sin(th)), En = c.Ez * Math.cos(th) + c.Er * Math.sin(th); cerca(e0 * En, s.sigma(th), 1e-5, 'esfera a tierra: σ = ε₀ E_n'); }
    }
    // esfera aislada y neutra: la carga total es 0 y V = k q″/R
    { const s = r('esfera-neutra'), q = 1e-8, a = 0.3, R = 0.1, qi = (-q * R) / a, q2 = (q * R) / a;
      cerca(s.q2, q2, 1e-12, 'esfera neutra: q″'); cero(s.Qe, 'esfera neutra: Q = 0'); cerca(s.V0, (k * q2) / R, 1e-9, 'esfera neutra: potencial');
      cerca(s.Fz, k * q * (qi / (a - (R * R) / a) ** 2 + q2 / (a * a)), 1e-9, 'esfera neutra: fuerza');
      cero(integraEsfera(s), 'esfera neutra: carga total', 1e-12);
      for (const th of [0.5, 2]) cerca(C.campo(s.cargas, R * Math.cos(th), R * Math.sin(th)).V, s.V0, 1e-9, 'esfera neutra: V constante en la superficie');
    }
    // esfera a V0 = 500 V: q″ = 4π ε₀ R V₀
    { const s = r('esfera-potencial'), q = 2e-9, a = 0.2, R = 0.05, V0 = 500;
      cerca(s.q2, 4 * Math.PI * e0 * R * V0, 1e-9, 'esfera a V₀: q″'); cerca(s.V0, V0, 1e-12, 'esfera a V₀: potencial');
      cerca(s.Qe, (-q * R) / a + 4 * Math.PI * e0 * R * V0, 1e-9, 'esfera a V₀: carga total');
      cero(integraEsfera(s) - s.Qe, 'esfera a V₀: la integral de σ debe dar Q', 1e-12);
      for (const th of [0.5, 2]) cerca(C.campo(s.cargas, R * Math.cos(th), R * Math.sin(th)).V, V0, 1e-9, 'esfera a V₀: V constante en la superficie');
    }
    // cavidad: q = 5 nC, a = 6 cm, R = 10 cm
    { const s = r('cavidad'), q = 5e-9, a = 0.06, R = 0.1, qi = (-q * R) / a, ai = (R * R) / a;
      cerca(s.imagenes[0].q, qi, 1e-12, 'cavidad: q′'); cerca(s.imagenes[0].z, ai, 1e-12, 'cavidad: a′');
      cerca(s.Fmod, (q * q * R * a) / (4 * Math.PI * e0 * (R * R - a * a) ** 2), 1e-9, 'cavidad: fuerza'); if (!s.atractiva || s.Fz < 0) mal('Imágenes · cavidad: la fuerza debe ir hacia la pared (z > 0)');
      cerca(integraEsfera(s), -q, 2e-4, 'cavidad: carga inducida en la pared (integral de σ)');
      for (const th of [0.4, 1.5, 3]) cero(C.campo(s.cargas, R * Math.cos(th), R * Math.sin(th)).V, 'cavidad: V = 0 en la pared', 1e-9);
      { const th = 0.8, c = C.campo(s.cargas, (R - 1e-9) * Math.cos(th), (R - 1e-9) * Math.sin(th)), En = c.Ez * Math.cos(th) + c.Er * Math.sin(th); cerca(e0 * En, -s.sigma(th), 1e-5, 'cavidad: σ = −ε₀ E_n (la normal sale del conductor)'); }
    }
    // IM-1 cuña de 90° (n = 2): fuerza a mano con las tres imágenes; V = 0 en las dos caras
    { const s = r('cuna-90'), q = 5e-9, a = 0.05 * Math.cos(Math.PI / 6), b = 0.05 * Math.sin(Math.PI / 6), rr = Math.hypot(a, b);
      if (s.imagenes.length !== 3) mal(`Imágenes · cuña 90°: ${s.imagenes.length} imágenes en vez de 3`);
      cerca(s.Fx, k * q * q * (-1 / (4 * a * a) + a / (4 * rr ** 3)), 1e-9, 'cuña 90°: F_x'); cerca(s.Fz, k * q * q * (-1 / (4 * b * b) + b / (4 * rr ** 3)), 1e-9, 'cuña 90°: F_y');
      cerca(s.Qe, -q, 1e-12, 'cuña: carga inducida total');
      const t = r('cuna-60'); if (t.imagenes.length !== 5) mal(`Imágenes · cuña 60°: ${t.imagenes.length} imágenes en vez de 5`);
      for (const x of [0.01, 0.03, 0.2]) { cero(C.campoXZ(t.cargas, x, 0).V, 'cuña 60°: V = 0 en el primer plano', 1e-6); cero(C.campoXZ(t.cargas, x * Math.cos(Math.PI / 3), x * Math.sin(Math.PI / 3)).V, 'cuña 60°: V = 0 en el segundo plano', 1e-6); }
      cerca(t.cargas.reduce((m, c) => m + c.q, 0) + 1, 1, 1e-9, 'cuña 60°: suma de cargas nula');
      // n = 1 es un solo plano
      const u1 = C.resolver({ modo: 'cuna', n: '1', q: '5', r0: '3', ph: '90' }), pl = r('plano'); cerca(u1.Fmod, pl.Fmod, 1e-9, 'cuña n = 1 igual que el plano');
      for (const mala of [{ n: '2,5' }, { n: '0' }, { ph: '95' }, { ph: '0' }, { rp: '3', php: '120' }, { rp: '3' }]) { let ok = false; try { C.resolver({ ...C.ejemplos.find((e) => e.clave === 'cuna-90').sc, ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Imágenes · cuña: ${JSON.stringify(mala)} debería dar un error`); }
    }
    // IM-1 dos planos paralelos: límite L → ∞ = un plano, centro sin fuerza, cargas inducidas de Green y V = 0 en las placas
    { const s = r('paralelos'), q = 5e-9, L = 0.1, d = 0.03; let F = 0;
      for (let j = -200000; j <= 200000; j++) { const dd = d - (2 * j * L - d); if (dd) F += (k * q * -q * dd) / Math.abs(dd) ** 3; }
      cerca(s.Fz, F, 1e-6, 'paralelos: fuerza frente a la suma directa'); cerca(s.Qa, -q * 0.7, 1e-12, 'paralelos: carga inducida en z = 0'); cerca(s.Qb, -q * 0.3, 1e-12, 'paralelos: carga inducida en z = L');
      cerca(C.resolver({ modo: 'paralelos', q: '5', L: '100000', d: '3' }).Fz, -(q * q) / (16 * Math.PI * e0 * d * d), 1e-3, 'paralelos: límite de un solo plano');
      cero(C.resolver({ modo: 'paralelos', q: '5', L: '10', d: '5' }).Fz, 'paralelos: fuerza nula en el medio', 1e-18);
      cero(s.Vsuma(0.02, 0, 20000) / (k * q / d), 'paralelos: V = 0 en el primer plano', 1e-6); cero(s.Vsuma(0.02, L, 20000) / (k * q / d), 'paralelos: V = 0 en el segundo plano', 1e-6);
      // la carga inducida por integración de σ = ε₀E_z sobre el plano z = 0 (anillos hasta 3 L)
      let I = 0; const h = 1e-7; for (let i = 0; i < 3000; i++) { const rho = (i + 0.5) * 0.001, E = -(s.Vsuma(rho, h, 4000) - s.Vsuma(rho, 0, 4000)) / h; I += e0 * E * 2 * Math.PI * rho * 0.001; }
      cerca(I, s.Qa, 5e-3, 'paralelos: ∫σ dS en el primer plano');
      const pp = C.resolver({ ...C.ejemplos.find((e) => e.clave === 'paralelos').sc }); if (!pp.pt || !(pp.pt.E > 0)) mal('Imágenes · paralelos: sin campo en el punto');
      for (const mala of [{ d: '12' }, { d: '0' }, { z: '15' }]) { let ok = false; try { C.resolver({ ...C.ejemplos.find((e) => e.clave === 'paralelos').sc, ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Imágenes · paralelos: ${JSON.stringify(mala)} debería dar un error`); }
    }
    // IM-4 varias cargas: F = −∂U/∂z en la primera, acción y reacción dentro del plano horizontal y una carga sola = plano
    { const base = C.ejemplos.find((e) => e.clave === 'varias').sc, v = C.resolver(base), U = (z) => C.resolver({ ...base, z1: String(z * 100) }).W;
      cerca(v.F[0][1], -(U(0.04 + 1e-6) - U(0.04 - 1e-6)) / 2e-6, 1e-5, 'varias: F_z = −∂U/∂z');
      const Ux = (x) => C.resolver({ ...base, x1: String(x * 100) }).W; cerca(v.F[0][0], -(Ux(-0.03 + 1e-6) - Ux(-0.03 - 1e-6)) / 2e-6, 1e-5, 'varias: F_x = −∂U/∂x');
      const una = C.resolver({ modo: 'varias', q: '5', x1: '0', z1: '3' }); cerca(una.Fz, r('plano').Fz, 1e-9, 'varias: una carga = el plano'); cerca(una.W, -r('plano').W, 1e-9, 'varias: energía de una carga = −W');
      cerca(v.Qe, -2e-9, 1e-9, 'varias: carga inducida total'); cerca(v.Ftot[0], v.F[0][0] + v.F[1][0], 1e-12, 'varias: fuerza total');
    }
    // IM-4 dipolo: contra dos cargas ±q muy próximas (dipolo casi puntual) y energía = trabajo
    { const s = r('dipolo'), pm = 1e-10, d = 0.04, th = Math.PI / 6, l = d * 1e-4, qq = pm / l, kk = (a) => a;
      const cs = [{ q: qq, x: (l / 2) * Math.sin(th), z: d + (l / 2) * Math.cos(th) }, { q: -qq, x: -(l / 2) * Math.sin(th), z: d - (l / 2) * Math.cos(th) }];
      const Fz = (dz) => { let F = 0, Fx = 0; for (const a of cs) for (const b of cs) { const A = { q: a.q, x: a.x, z: a.z + dz }, B = { q: -b.q, x: b.x, z: -b.z }, dx = A.x - B.x, zz = A.z - B.z, rr = Math.hypot(dx, zz); F += (k * A.q * B.q * zz) / rr ** 3; Fx += (k * A.q * B.q * dx) / rr ** 3; } return [Fx, F]; };
      cerca(s.Fz, Fz(0)[1], 1e-5, 'dipolo: fuerza frente a dos cargas muy próximas');
      cerca(s.U, -(pm * pm * 1.75) / (64 * Math.PI * e0 * d ** 3), 1e-9, 'dipolo: energía');
      cerca(s.Fz, 3 * s.U / d, 1e-9, 'dipolo: F = −∂U/∂d con U ∝ d⁻³');
      cerca(s.tau, -pm * pm * Math.sin(th) * Math.cos(th) / (32 * Math.PI * e0 * d ** 3), 1e-9, 'dipolo: par');
      const t0 = C.resolver({ modo: 'dipolo', p: '10', d: '4', th: '0' }); cero(t0.tau, 'dipolo perpendicular: par nulo', 1e-30); cerca(t0.Fz, -3 * pm * pm * 2 / (64 * Math.PI * e0 * d ** 4), 1e-9, 'dipolo perpendicular: fuerza');
      const t90 = C.resolver({ modo: 'dipolo', p: '10', d: '4', th: '90' }); cero(t90.tau, 'dipolo paralelo: par nulo', 1e-22); cerca(t90.Fz, -3 * pm * pm / (64 * Math.PI * e0 * d ** 4), 1e-9, 'dipolo paralelo: fuerza');
    }
    // errores
    const malas = [{ modo: 'plano', q: '', d: '3' }, { modo: 'plano', q: '5', d: '0' }, { modo: 'plano', q: '0', d: '3' }, { modo: 'plano', q: '5', d: '3', rho: '1', z: '-2' }, { modo: 'plano', q: '5', d: '3', rho: '1' },
      { modo: 'esfera-tierra', q: '5', a: '5', R: '10' }, { modo: 'esfera-tierra', q: '5', a: '30', R: '10', r: '5', th: '0' }, { modo: 'cavidad', q: '5', a: '12', R: '10' }, { modo: 'cavidad', q: '5', a: '3', R: '10', r: '12', th: '0' }];
    for (const sc of malas) { let ok = false; try { C.resolver(sc); } catch (e) { ok = true; } if (!ok) mal(`Imágenes: ${JSON.stringify(sc)} debería dar un error`); }
    if (fallos === antes) console.log(`  ✓ Imágenes: ${C.ejemplos.length} ejemplos (plano, esfera a tierra, aislada y a potencial, cavidad), V = 0 y σ = ε₀E_n en la superficie, carga inducida por integración y errores`);
  }
  // carga total de la superficie de la esfera por integración de σ(θ) · 2πR² sen θ dθ
  function integraEsfera(s) { let I = 0; const n = 20000, R = s.R; for (let i = 0; i < n; i++) { const th = ((i + 0.5) * Math.PI) / n; I += s.sigma(th) * 2 * Math.PI * R * R * Math.sin(th) * (Math.PI / n); } return I; }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'imagenes', 'index.html'));
    await page.waitForFunction(() => window.ImagenesApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('imagenes').current) mal(`Imágenes: la página muestra la versión «${ver}», se esperaba ${Version.de('imagenes').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => ImagenesApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || r.res < 3) mal(`Imágenes · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Imágenes · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.evaluate(() => ImagenesApp.abrirEjemplo('esfera-tierra'));
    const res = await page.locator('#resumen').textContent();
    if (!res.includes('−3,333 nC') || !res.includes('4,213')) mal(`Imágenes: la esfera a tierra no muestra q′ = −3,333 nC y F = 4,213 μN en la página (${res.slice(0, 120)})`);
    // cambiar de conductor desde el desplegable rellena lo que falta y calcula
    await page.selectOption('#f-modo', 'cavidad');
    if (await page.locator('#error').isHidden()) mal('Imágenes: al cambiar a la cavidad con a > R debe avisar, no romperse');
    await page.fill('#f-a', '4'); await page.fill('#f-r', '3');
    if (!(await page.locator('#error').isHidden())) mal('Imágenes: la cavidad con a < R no debería dar error');
    await page.fill('#f-a', '40');
    if (await page.locator('#error').isHidden()) mal('Imágenes: una carga fuera de la cavidad no muestra el error');
    // los cuatro modos nuevos: se eligen en el desplegable, se calculan y se dibujan
    for (const m of ['cuna', 'paralelos', 'varias', 'dipolo']) {
      await page.selectOption('#f-modo', m);
      if (await page.locator('#error').isVisible()) mal(`Imágenes: el modo ${m} da un error al elegirlo: ` + await page.locator('#error').textContent());
      if (!(await page.locator('#f-' + (m === 'cuna' ? 'n' : m === 'varias' ? 'x1' : m === 'dipolo' ? 'th' : 'L')).count())) mal(`Imágenes: el modo ${m} no muestra sus campos`);
    }
    await page.evaluate(() => ImagenesApp.abrirEjemplo('cuna-60'));
    { const tx = await page.locator('#resumen').textContent(); if (!/Cargasimagen5/.test(tx.replace(/\s/g, ''))) mal('Imágenes: la cuña de 60° no muestra 5 cargas imagen'); }
    for (const e of ['cuna-90', 'paralelos', 'varias', 'dipolo']) {
      await page.evaluate((c) => ImagenesApp.abrirEjemplo(c), e);
      const pint = await page.evaluate(() => document.querySelector('#dibujo').toDataURL().length);
      if (pint < 4000) mal(`Imágenes: el dibujo de ${e} parece vacío (${pint} píxeles)`);
    }
    // el dibujo no queda en blanco
    await page.evaluate(() => ImagenesApp.abrirEjemplo('plano'));
    const pintado = await page.evaluate(() => { const c = document.querySelector('#dibujo'), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
    if (pintado < 2000) mal(`Imágenes: el dibujo parece vacío (${pintado} píxeles)`);
    await page.close();
    if (consola.length) mal('Imágenes: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Imágenes: ${C.ejemplos.length} ejemplos en la página con MathML, cambio de conductor, errores y dibujo, sin errores de consola`);
  };
};
