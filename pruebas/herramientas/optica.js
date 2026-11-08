/* Comprobación de optica: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo optica ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'optica', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Optica · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    // valores calculados a mano (1/s + 1/s′ = 1/f, m = −s′/s)
    const v = (c, sp, m) => { cerca(r(c).sp, sp, 1e-9, `${c}: s′`); cerca(r(c).m, m, 1e-9, `${c}: aumento`); };
    v('lupa', -15, 2.5);            // 1/10 − 1/6 = −1/15
    v('proyector', 15, -0.5);       // 1/10 − 1/30 = 1/15
    v('mirilla', -120 / 11, 3 / 11); // −1/15 − 1/40 = −11/120
    v('afeitado', -24, 1.6);        // 1/40 − 1/15 = −1/24
    v('maquillaje', 100 / 3, -2 / 3); // 1/20 − 1/50 = 3/100
    v('retrovisor', -600 / 23, 3 / 23); // −1/30 − 1/200 = −23/600
    cerca(r('proyector').hp, -1, 1e-9, 'altura de la imagen del proyector');
    cerca(r('lupa').potencia, 10, 1e-9, 'potencia de la lupa (f = 10 cm → 10 D)');
    cerca(r('afeitado').radio, 80, 1e-9, 'radio del espejo de afeitar');
    if (!r('proyector').real || r('proyector').derecha || r('proyector').tam !== 'menor') mal('Optica: el proyector debe dar imagen real, invertida y menor');
    if (r('lupa').real || !r('lupa').derecha || r('lupa').tam !== 'mayor') mal('Optica: la lupa debe dar imagen virtual, derecha y mayor');
    if (!r('retrovisor').derecha || r('retrovisor').real) mal('Optica: el retrovisor debe dar imagen virtual y derecha');
    { const o = C.resolver({ tipo: 'concavo', f: '20', s: '20', h: '1' }); if (!o.enfoque || isFinite(o.sp)) mal('Optica: objeto en el foco debe dar imagen en el infinito'); }
    { const o = C.resolver({ tipo: 'convergente', f: '10', s: '20', h: '1' }); cerca(o.sp, 20, 1e-9, 's′ en 2f'); cerca(o.m, -1, 1e-9, 'aumento en 2f'); if (o.tam !== 'igual') mal('Optica: en 2f la imagen es del mismo tamaño'); }
    // sistemas de lentes: cálculos a mano y comprobación con el método de matrices ABCD
    {
      const S = (c) => r(c), cuenta = (c, sp, m, hp) => { cerca(S(c).sp, sp, 1e-9, `${c}: s′`); cerca(S(c).m, m, 1e-9, `${c}: m`); cerca(S(c).hp, hp, 1e-9, `${c}: h′`); };
      cuenta('sis-dos', 10, 0.5, 1);                 // 1/10−1/30 → 15, m₁ = −0,5; s₂ = 25−15 = 10, s′₂ = 10, m₂ = −1
      cuenta('sis-conv-div', -20, 0.5, 2);           // s′₁ = 30; s₂ = 10−30 = −20 (virtual), s′₂ = −20, m₂ = −1
      cuenta('sis-contacto', 15, -0.25, -0.5);       // 1/12 − 1/60 = 1/15
      cuenta('sis-microscopio', -7.5, -12.5, -1.25); // m₁ = −5, m₂ = 2,5
      cerca(S('sis-contacto').feq, 12, 1e-9, 'f equivalente de 20 y 30 en contacto');
      cerca(S('sis-dos').feq, -5, 1e-9, 'f equivalente: 1/10 + 1/5 − 25/50 = −1/5'); // 1/f = 0,1 + 0,2 − 0,5
      if (isFinite(S('sis-conv-div').feq)) mal('Optica: convergente 20 + divergente 10 a 10 cm es afocal (1/f = 0)');
      if (!S('sis-afocal').enfoque || isFinite(S('sis-afocal').sp)) mal('Optica: objeto en el foco de la segunda lente debe dar imagen en el infinito');
      if (!S('sis-conv-div').filas[1].objetoVirtual || !S('sis-dos').real || S('sis-dos').derecha !== true) mal('Optica: objeto virtual, imagen real o derecha mal clasificados');
      // paralelo al eje y por el centro llegan al mismo punto; y m = producto de los aumentos
      for (const c of ['sis-dos', 'sis-conv-div', 'sis-contacto', 'sis-microscopio']) { const o = S(c); cerca(o.rayoA.y + o.rayoA.th * o.sp, o.hp, 1e-9, `${c}: los dos rayos se cruzan en la imagen`); cerca(o.filas.reduce((a, q) => a * q.m, 1), o.m, 1e-9, `${c}: m = producto de aumentos`); }
      // sistema aleatorio de tres lentes frente a la matriz ABCD completa (imagen donde B = 0)
      let sem = 12345; const az = () => ((sem = (sem * 1103515245 + 12345) % 2147483648) / 2147483648);
      for (let i = 0; i < 100; i++) {
        const fs = [0, 1, 2].map(() => (az() < 0.35 ? -1 : 1) * (5 + 20 * az())), ds = [0, 4 + 20 * az(), 4 + 20 * az()], s0 = 8 + 40 * az();
        const datos = fs.map((v, k) => `${v} ${ds[k]}`).join('\n'), o = C.resolver({ modo: 'sistema', s: String(s0), h: '1', datos });
        let Mx = [1, s0, 0, 1]; const mul = (P, Q) => [P[0] * Q[0] + P[1] * Q[2], P[0] * Q[1] + P[1] * Q[3], P[2] * Q[0] + P[3] * Q[2], P[2] * Q[1] + P[3] * Q[3]];
        fs.forEach((v, k) => { if (k) Mx = mul([1, ds[k], 0, 1], Mx); Mx = mul([1, 0, -1 / v, 1], Mx); });
        const spA = -Mx[1] / Mx[3], mA = Mx[0] + spA * Mx[2];
        if (isFinite(o.sp) && (Math.abs(o.sp - spA) > 1e-6 * Math.max(1, Math.abs(spA)) || Math.abs(o.m - mA) > 1e-6 * Math.max(1, Math.abs(mA)))) { mal(`Optica: sistema ${i} (${fs.map((v) => v.toFixed(2))}; ${ds.map((v) => v.toFixed(2))}; s=${s0.toFixed(2)}): s′ ${o.sp} frente a ${spA}, m ${o.m} frente a ${mA}`); break; }
      }
      for (const [d, q] of [['', 'sin lentes'], ['convergente 10\nconvergente 5', 'falta la separación'], ['convergente 10\nconvergente 5 -3', 'separación negativa'], ['raro 10', 'tipo desconocido'], ['convergente 0', 'focal cero'], ['1\n2 1\n3 1\n4 1\n5 1\n6 1\n7 1', 'siete lentes']]) { let ok = false; try { C.resolver({ modo: 'sistema', s: '10', h: '1', datos: d }); } catch (e) { ok = true; } if (!ok) mal(`Optica: sistema ${q} no da error`); }
      // las lentes pueden escribirse solo con la focal con signo
      cerca(C.resolver({ modo: 'sistema', s: '30', h: '2', datos: '10\n5 25' }).sp, 10, 1e-9, 'sistema escrito solo con números');
      cerca(C.resolver({ modo: 'sistema', s: '30', h: '2', datos: 'convergente 10\nconvergente 5 25' }).sp, 10, 1e-9, 'sistema con tipos');
      cerca(C.resolver({ modo: 'sistema', s: '10', h: '1', datos: 'convergente 10\nconvergente 5 20' }).filas[1].sp, 5, 1e-9, 'rayos paralelos a la segunda lente: imagen en el plano focal');
    }
    for (const [sc, q] of [[{ tipo: 'convergente', f: '', s: '1', h: '1' }, 'falta la focal'], [{ tipo: 'convergente', f: '1', s: '0', h: '1' }, 'objeto en 0'], [{ tipo: '', f: '1', s: '1', h: '1' }, 'sin tipo']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Optica: ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ Optica: ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'fisica', 'optica', 'index.html'));
    await page.waitForFunction(() => window.OpticaApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('optica').current) mal(`Optica: la página muestra la versión «${ver}», se esperaba ${Version.de('optica').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => OpticaApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`Optica · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Optica · ${e.clave}: el desarrollo no sale en MathML`);
    }
    // en modo sistema: tabla, desarrollo, gráfica y cambio de modo
    await page.evaluate(() => OpticaApp.abrirEjemplo('sis-microscopio'));
    { const t = await page.evaluate(() => ({ filas: document.querySelectorAll('#tabla tbody tr').length, cap: !!document.querySelector('#tabla caption'), th: document.querySelectorAll('#tabla thead th[scope=col]').length, ml: document.querySelectorAll('#pasos math').length, aria: document.querySelector('#grafica').getAttribute('aria-label'), dolar: /\$/.test(document.querySelector('#pasos').textContent) }));
      if (t.filas !== 2 || !t.cap || t.th !== 6 || !t.ml || t.dolar || !/2 lentes/.test(t.aria)) mal(`Optica: la tabla o el desarrollo del sistema fallan ${JSON.stringify(t)}`); }
    await page.selectOption('#f-modo', 'uno');
    if ((await page.locator('#f-tipo').count()) !== 1 || (await page.locator('#tabla tbody tr').count()) !== 0) mal('Optica: al volver a un elemento no sale su formulario');
    await page.selectOption('#f-modo', 'sistema');
    await page.fill('#f-datos', 'convergente 10\nconvergente');
    if (await page.locator('#error').isHidden()) mal('Optica: una lente sin focal no muestra el error');
    await page.fill('#f-datos', 'convergente 10\nconvergente 5 25');
    if (await page.locator('#error').isVisible()) mal('Optica: el sistema correcto muestra error');
    await page.fill('#f-s', '0');
    if (await page.locator('#error').isHidden()) mal('Optica: una distancia cero no muestra el error');
    await page.close();
    if (consola.length) mal('Optica: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Optica: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
