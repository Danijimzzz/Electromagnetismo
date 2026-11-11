/* Comprobación de derivadas: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo derivadas ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const DerC = require(path.join(fuente, 'derivadas', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Derivadas · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => DerC.resolver(DerC.ejemplos.find((e) => e.clave === c).sc);
    for (const e of DerC.ejemplos) { try { const x = DerC.resolver(e.sc); if (x.pasos.length < 3) mal(`Derivadas · ${e.clave}: desarrollo corto`); } catch (err) { mal(`Derivadas · ${e.clave}: ${err.message}`); } }
    const igual = (a, b, q) => { if (a !== b) mal(`Derivadas · ${q}: sale «${a}», se esperaba «${b}»`); };
    // derivadas como en clase
    igual(r('producto').txt[0], '2 x sen x + x^{2} cos x', '(x² sen x)′');
    igual(r('cociente').txt[0], '{x^{2} − 2 x − 1}/{(x − 1)^{2}}', '((x² + 1)/(x − 1))′');
    igual(r('cadena').txt[0], '−2 x e^{−x^{2}}', '(e^(−x²))′');
    igual(r('raiz').txt[0], '{x}/{x^{2} + 1}', '(ln √(x² + 1))′');
    igual(r('arctg').txt[2], '{16 (12 x^{2} − 1)}/{(1 + 4 x^{2})^{3}}', '(arctg 2x)‴');
    igual(r('tangente').tangente, 'y = 9 x − 16', 'tangente a x³ − 3x en 2');
    const cr = r('tangente').crit; if (cr.length !== 2 || cr[0].tipo !== 'máximo' || cr[1].tipo !== 'mínimo' || cr[0].x !== -1 || cr[1].x !== 1) mal('Derivadas: x³ − 3x no da el máximo en −1 y el mínimo en 1');
    // todas las derivadas cumplen el cociente incremental
    for (const e of DerC.ejemplos.filter((q) => q.sc.modo === 'derivada')) {
      const x = DerC.resolver(e.sc), h = 1e-5;
      for (const t of [0.4, 1.3, 2.2]) for (let k = 1; k <= x.orden; k++) { const a = x.d(k - 1), b = x.d(k); cerca(b(t), (a(t + h) - a(t - h)) / (2 * h), 1e-4, `${e.clave}: derivada ${k} en x = ${t}`); }
    }
    // primitivas: todas se encuentran y al derivarlas sale f
    const prims = { 'x^2 cos(2x)': 0, 'x^3 e^(2x)': 0, 'sen(3x)cos(3x)': 0, 'x sen(x)': 0, 'x e^(-x)': 0, 'sen(x)^3': 0, 'cos(x)^5': 0, 'tg(x)': 0, 'tg(x)^2': 0, 'ln(x)': 0, 'ln(x)^2': 0, 'arctg(x)': 0, 'x arctg(x)': 0, '2^x': 0, '1/sqrt(1-x^2)': 0, 'x/sqrt(1+x^2)': 0, 'e^(2x) sen(3x)': 0, 'x^2 ln(x)': 0, 'sqrt(x) ln(x)': 0, 'ln(x)/x': 0, '1/(x ln(x))': 0, 'cos(ln(x))/x': 0, 'e^x/(1+e^x)': 0, 'x (x^2+1)^3': 0, '(x+1)^5': 0, 'sqrt(2x+1)': 0, '1/(x^2 sqrt(x))': 0, '1/(x^2-1)': 0, 'x^4/(x^2-1)': 0, '1/(x(x+1)^2)': 0, '(2x+3)/(x^2+3x+5)': 0, '1/(x^2+x+1)': 0, '(x+2)/(x^2+2x+2)': 0, 'senh(x) cosh(x)': 0, 'sen(x)/cos(x)^2': 0, 'sen(3x)cos(2x)': 0, 'sen(x)sen(4x)': 0, 'cos(2x)cos(5x)': 0, 'cos(x)sen(3x)': 0, 'sqrt(4-9x^2)': 0, 'sqrt(1-x^2)': 0, 'sqrt(x^2+1)': 0, '1/sqrt(x^2+4)': 0, 'sqrt(x^2-1)': 0, '1/sqrt(9x^2-4)': 0 };
    for (const fx of Object.keys(prims)) {
      const x = DerC.integral({ f: fx });
      if (!x.F) { mal(`Derivadas: no encuentra la primitiva de ${fx}`); continue; }
      if (!DerC.igualNum(Expr.deriva(x.F), x.ast, 1e-7)) mal(`Derivadas: la primitiva de ${fx} no vuelve a f al derivarla`);
    }
    igual(DerC.integral({ f: '1/(x^2+x+1)' }).Ftxt, '{2 arctg ({2 x + 1}/{√3})}/{√3}', '∫ 1/(x² + x + 1)');
    igual(DerC.integral({ f: 'x (x^2+1)^3' }).Ftxt, '{(x^{2} + 1)^{4}}/{8}', '∫ x (x² + 1)³');
    igual(r('racional').Ftxt, 'ln |x + 3| + 2 ln |x − 1|', '∫ (3x + 5)/(x² + 2x − 3)');
    // DE-4 · 30 límites de examen, con el valor hecho a mano (null = no existe). Derivadas los calcula con L'Hôpital, y los 0/0 también salen por Taylor (ver taylor.js);
    // no hace falta orden de infinitésimos: lo que L'Hôpital no resuelve limpio se contrasta con f cerca de a
    {
      const LIM = [['(sen(x)-x)/x^3', '0', -1 / 6], ['(1-cos(x))/x^2', '0', 0.5], ['(e^x-1-x)/x^2', '0', 0.5], ['(tg(x)-x)/x^3', '0', 1 / 3], ['(x-sen(x))/(x-tg(x))', '0', -0.5], ['ln(1+x)/x', '0', 1], ['(e^x-e^(-x))/(2x)', '0', 1], ['(1-cos(2x))/(x sen(x))', '0', 2],
        ['(sqrt(1+x)-1)/x', '0', 0.5], ['(1+1/x)^x', 'inf', Math.E], ['x sen(1/x)', 'inf', 1], ['x(e^(1/x)-1)', 'inf', 1], ['(x^2+3x)/(2x^2-1)', 'inf', 0.5], ['sqrt(x^2+x)-x', 'inf', 0.5], ['x ln(x)', '0', 0], ['x^x', '0', 1], ['(cos x)^(1/x^2)', '0', Math.exp(-0.5)],
        ['(1+2x)^(1/x)', '0', Math.exp(2)], ['(sen(x)/x)^(1/x^2)', '0', Math.exp(-1 / 6)], ['ln(x)/(x-1)', '1', 1], ['(x^3-1)/(x-1)', '1', 3], ['(arctg(x)-x)/x^3', '0', -1 / 3], ['(e^x-cos(x)-x)/x^2', '0', 1], ['1/x-1/sen(x)', '0', 0], ['(2^x-1)/x', '0', Math.log(2)],
        ['(x-1)/ln(x)', '1', 1], ['x^2 e^(-x)', 'inf', 0], ['1/x', '0', null], ['abs(x)/x', '0', null], ['e^x/x^3', 'inf', Infinity]];
      for (const [f, a, v] of LIM) {
        let r; try { r = DerC.limite({ f, a }); } catch (e) { mal(`Derivadas · límite de ${f} en ${a}: ${e.message}`); continue; }
        if (v === null ? r.existe : v === Infinity ? r.val !== Infinity : !r.existe || Math.abs(r.val - v) > 1e-6) mal(`Derivadas · límite de ${f} en ${a}: sale ${r.txt} y no ${v}`);
      }
    }
    // DE-3 · banco de 51 integrales más de libro (partes, racionales, trigonométricas, radicales, hiperbólicas…): cada primitiva F se comprueba derivándola
    // numéricamente (cociente incremental centrado) en 5 puntos y comparándola con f
    {
      const banco = ['x e^(3x)', 'x^2 e^(-x)', 'x^2 sen(x)', 'x cos(2x)', 'e^(-x) sen(2x)', 'e^(3x) cos(x)', 'ln(x^2+1)', 'arcsen(x)', 'arccos(x)', 'x^2 arctg(x)', '1/(x^2+2x+5)', 'x/(x^2+4x+5)', '(3x+1)/(x^2-x-6)', '1/(x^3+x)', '(x^2+1)/(x^3-x)', '1/(x^2(x-1))', 'x^3/(x^2+1)', '1/cos(x)', 'cotg(x)', 'sen(x)^2', 'cos(x)^3', 'sen(2x)cos(x)', 'sen(x)^5', 'x senh(x)', 'e^x/(e^(2x)+1)', 'e^x sen(x)', 'sqrt(x)/(x+1)', '1/(sqrt(x)+1)', 'x/sqrt(x+1)', '1/(x sqrt(x+1))', 'x^2 e^(x^3)', 'sen(sqrt(x))', '1/(x^2+6x+13)', '1/sqrt(x^2+2x+5)', 'sqrt(x^2+2x+5)', '1/sqrt(3-2x-x^2)', 'sqrt(4x-x^2)', 'arctg(x)/x^2', 'ln(x)/x^2', 'ln(1+x)/sqrt(x)', '(x^2+x+1)/((x+1)^2(x+2))', '1/(x^4-1)', '1/(x^4+1)', 'x/(x^4+1)', 'x^2/(x^4+1)', 'e^(2x) cos(3x)', 'sen(x)cos(x)^2', 'tg(x)/cos(x)^2', '1/(x^2-4x+3)', '1/(e^x-1)', 'ln(sen(x)) cos(x)/sen(x)'];
      for (const fx of banco) {
        const x = DerC.integral({ f: fx });
        if (!x.F) { mal(`Derivadas · banco ∫ ${fx}: no encuentra la primitiva`); continue; }
        let ok = 0;
        for (const t of [0.35, 0.7, 1.4, 1.9, 2.6]) { const h = 1e-5, d = (x.Ff(t + h) - x.Ff(t - h)) / (2 * h), v = x.f(t); if (isFinite(d) && isFinite(v)) { ok++; if (Math.abs(d - v) > 1e-5 * Math.max(1, Math.abs(v))) mal(`Derivadas · banco ∫ ${fx}: F′(${t}) = ${d}, f(${t}) = ${v}`); } }
        if (ok < 2) mal(`Derivadas · banco ∫ ${fx}: no hay puntos donde comprobar`);
      }
      // lo que aún no sale (huecos conocidos de la herramienta) no debe dar una primitiva falsa ni romperse: o sale bien o no sale
      for (const fx of ['x ln(x)^2', 'tg(x)^3', 'sec(x)^3', 'sec(x)tg(x)', 'cotg(x)^2', '1/(1+cos(x))', '1/(2+cos(x))', '1/(1+sen(x))', 'senh(x)^2', 'cosh(x)^2', 'x^3 e^(x^2)', 'x^2/(1-x^2)^(3/2)', '2^x e^x', 'x 2^x', 'abs(x)', 'x^5 e^(x^2)']) {
        let x; try { x = DerC.integral({ f: fx }); } catch (e) { mal(`Derivadas · ∫ ${fx}: da error en vez de «no sale» (${e.message})`); continue; }
        if (x.F) for (const t of [0.35, 1.4, 2.6]) { const hh = 1e-5, d = (x.Ff(t + hh) - x.Ff(t - hh)) / (2 * hh), v = x.f(t); if (isFinite(d) && isFinite(v) && Math.abs(d - v) > 1e-5 * Math.max(1, Math.abs(v))) mal(`Derivadas · ∫ ${fx}: primitiva falsa`); }
      }
    }
    // DE-1/DE-3: integrales de libro (las 9 que antes no salían y más); cada primitiva se comprueba con un cociente incremental propio
    {
      const libro = ['x sqrt(x+1)', 'sen(x)^2 cos(x)^3', '1/sen(x)', 'x/sqrt(1-x^2)', '1/(x sqrt(x^2-1))', '1/(1+e^x)', 'x arcsen(x)', 'e^sqrt(x)', 'x^2/(x^2+1)^2',
        'cos(x)^4', 'sen(x)^2 cos(x)^2', 'x^2 sqrt(x^2+1)', 'sqrt(x)/(1+sqrt(x))', 'sqrt(1+3x)', 'x/(x^2+1)^3', '1/(x sqrt(4-x^2))', 'x^2/sqrt(4-x^2)', 'sqrt(9-x^2)', 'sen(x)^3 cos(x)^2',
        'cos(2x)^3', 'x^2 sqrt(x+2)', '1/(e^x+e^(-x))', 'e^(2x)/(1+e^x)', '(x+1)/sqrt(x)', 'x^3/(x^2+1)^2', '1/(x^2+1)^2', 'cosec(x)', 'sen(x)^4', 'sqrt(x) ln(x)', '1/(x sqrt(x^2+4))', 'e^(cbrt(x))', 'x/(x^2+2x+2)^2'];
      for (const fx of libro) {
        const x = DerC.integral({ f: fx });
        if (!x.F) { mal(`Derivadas · ∫ ${fx}: no encuentra la primitiva`); continue; }
        let ok = 0;
        for (const t of [0.35, 0.7, 1.4, 1.9, 2.6]) { const h = 1e-5, d = (x.Ff(t + h) - x.Ff(t - h)) / (2 * h), v = x.f(t); if (isFinite(d) && isFinite(v)) { ok++; if (Math.abs(d - v) > 1e-5 * Math.max(1, Math.abs(v))) mal(`Derivadas · ∫ ${fx}: F′(${t}) = ${d}, f(${t}) = ${v}`); } }
        if (ok < 2) mal(`Derivadas · ∫ ${fx}: no hay puntos donde comprobar`);
      }
      // sin primitiva elemental: se dice y no se inventa nada, y con límites sale el valor numérico
      for (const [fx, nom] of [['e^(-x^2)', 'erf'], ['sen(x)/x', 'Si'], ['cos(x)/x', 'Ci'], ['1/ln(x)', 'li'], ['e^x/x', 'Ei'], ['sen(x^2)', 'S'], ['e^(x^2)', 'erfi']]) {
        const x = DerC.integral({ f: fx });
        if (x.F || x.noElemental !== nom || !x.pasos.some((q) => /no tiene primitiva elemental/.test(q.html))) mal(`Derivadas · ∫ ${fx}: debería decir que no tiene primitiva elemental (${nom}): ${x.noElemental}`);
      }
      cerca(DerC.integral({ f: 'sen(x)/x', a: '1', b: '2' }).val, 0.6593299064, 1e-8, '∫₁² sen x / x numérica');
      // DE-2: valor absoluto, partido en sus ceros, con Barrow exacto
      for (const [fx, a, b, v, trozos] of [['abs(x)', '-1', '2', 2.5, 2], ['abs(x^2-1)', '-2', '2', 4, 3], ['abs(x-1)+x', '0', '3', 7, 2], ['abs(sen(x))', '0', '2pi', 4, 2], ['abs(x)', '2', '-1', -2.5, 2]]) {
        const x = DerC.integral({ f: fx, a, b });
        cerca(x.val, v, 1e-9, `∫ ${fx} de ${a} a ${b}`);
        if (x.trozos !== trozos || !x.pasos.some((q) => q.t === 'Valor absoluto')) mal(`Derivadas · ∫ ${fx}: debería partirse en ${trozos} trozos (${x.trozos})`);
      }
    }
    // integrales definidas
    cerca(r('partes').val, Math.E - 2, 1e-12, '∫₀¹ x² eˣ'); cerca(r('sustitucion').val, (Math.E - 1) / 2, 1e-12, '∫₀¹ x e^(x²)');
    cerca(r('racional').val, Math.log(63 / 5), 1e-12, '∫₂⁴ racional'); cerca(r('arcotangente').val, Math.PI / 8, 1e-12, '∫₀² 1/(x² + 4)');
    cerca(r('trig').val, Math.PI / 2, 1e-12, '∫₀^π sen² x'); cerca(r('cicliclica').val, (Math.exp(Math.PI / 2) - 1) / 2, 1e-12, '∫ eˣ cos x');
    cerca(r('partes-ln').val, (Math.E ** 2 + 1) / 4, 1e-12, '∫₁^e x ln x'); cerca(r('gauss').val, 0.746824132812427, 1e-9, '∫₀¹ e^(−x²) numérica');
    if (r('gauss').F) mal('Derivadas: da una primitiva elemental de e^(−x²)');
    const ar = DerC.integral({ f: 'sen(x)', a: '0', b: '2pi' }); cerca(ar.val, 0, 1e-9, '∫₀^{2π} sen x'); cerca(ar.area, 4, 1e-5, 'área de sen x en [0, 2π]');
    for (const [sc, q] of [[{ modo: 'derivada', f: '', orden: '1' }, 'sin f'], [{ modo: 'derivada', f: 'x + y', orden: '1' }, 'otra letra'], [{ modo: 'derivada', f: 'ln(x)', orden: '1', x0: '-1' }, 'x₀ fuera del dominio'], [{ modo: 'integral', f: 'x', a: '1', b: '1' }, 'a = b'], [{ modo: 'integral', f: 'x', a: '0', b: '' }, 'falta b'], [{ modo: 'limite', f: 'sen(x)/x', a: '' }, 'límite sin punto'], [{ modo: 'area', f: 'x^2 + 1', g: '0', a: '', b: '' }, 'curvas que no se cortan'], [{ modo: 'volumen', f: 'x', g: '', a: '-1', b: '1', eje: 'y' }, 'capas con x < 0'], [{ modo: 'implicita', ec: 'x^2 + y^2 = 25', x0: '1', y0: '1' }, 'punto fuera de la curva'], [{ modo: 'implicita', ec: 'x^2 = 4', x0: '', y0: '' }, 'ecuación sin y']]) {
      let ok = false; try { DerC.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Derivadas: ${q} no da error`);
    }
    // impropias, límites, área, volumen, estudio, implícita y parciales
    cerca(r('impropia').val, 1, 1e-12, '∫₁^∞ 1/x²'); if (!r('impropia-diverge').diverge) mal('Derivadas: ∫₁^∞ 1/x no diverge');
    cerca(r('impropia-asintota').val, 2, 1e-12, '∫₀¹ 1/√x'); cerca(r('impropia-dentro').val, 4.5, 1e-9, '∫₋₁⁸ 1/∛x'); cerca(r('impropia-gauss').val, Math.sqrt(Math.PI) / 2, 1e-9, '∫₀^∞ e^(−x²)');
    if (!DerC.integral({ f: '1/x', a: '-1', b: '1' }).diverge) mal('Derivadas: ∫₋₁¹ 1/x no diverge'); if (!DerC.integral({ f: 'sen(x)', a: '0', b: '∞' }).diverge) mal('Derivadas: ∫₀^∞ sen x no diverge');
    cerca(DerC.integral({ f: '1/(1+x^2)', a: '-∞', b: '∞' }).val, Math.PI, 1e-9, '∫ 1/(1 + x²) en ℝ'); cerca(DerC.integral({ f: 'x e^(-x)', a: '0', b: 'inf' }).val, 1, 1e-9, '∫₀^∞ x e^(−x)');
    cerca(r('prod-trig').val, 0.6, 1e-12, '∫ sen 3x cos 2x'); cerca(r('semicirculo').val, 2 * Math.PI, 1e-12, '∫ √(4 − x²)');
    for (const [c, v] of [['lh-sen', 1], ['lh-dos', 0.5], ['lh-cero-inf', 0], ['lh-uno-inf', Math.E], ['lh-resta', 0]]) { const x = r(c); cerca(x.val, v, 1e-9, `límite ${c}`); if (!x.lhopital) mal(`Derivadas · ${c}: no usa L'Hôpital`); }
    cerca(DerC.limite({ f: '(1+2x)^(1/x)', a: '0' }).val, Math.E ** 2, 1e-9, '(1 + 2x)^(1/x)'); cerca(DerC.limite({ f: 'x^x', a: '0' }).val, 1, 1e-9, 'x^x en 0'); if (DerC.limite({ f: '1/x', a: '0' }).existe) mal('Derivadas: lím 1/x en 0 existe');
    cerca(r('area').val, 1 / 6, 1e-12, 'área entre x y x²'); cerca(r('area-cruce').val, 0.5, 1e-12, 'área entre x³ y x');
    cerca(r('volumen').val, 8 * Math.PI, 1e-12, 'volumen de √x'); cerca(r('esfera').val, (4 * Math.PI) / 3, 1e-12, 'volumen de la esfera'); cerca(r('capas').val, Math.PI / 6, 1e-12, 'capas entre x y x²');
    igual(r('volumen').txt, '8 π', 'V = 8π'); igual(r('circunferencia').txt, '−{x}/{y}', 'y′ en la circunferencia'); cerca(r('folium').m, -1, 1e-12, 'pendiente del folium en (3, 3)');
    { const x = r('estudio'); if (x.asV.join() !== '1' || x.asO.length !== 2 || x.asO[0].m !== 1 || x.asO[0].n !== 1 || x.extremos.map((q) => q.tipo).join() !== 'máximo,mínimo' || x.dom !== 'ℝ − \\{1\\}') mal('Derivadas: el estudio de (x² + 1)/(x − 1) no da la asíntota x = 1, la oblicua y = x + 1 y el máximo y el mínimo'); }
    { const x = r('estudio-ln'); if (x.dom !== '(0, ∞)' || x.asV.join() !== '0' || x.asH[0].y !== 0 || Math.abs(x.extremos[0].x - Math.E) > 1e-9) mal('Derivadas: el estudio de ln x / x no cuadra'); }
    { const x = r('silla'); if (x.crit.map((q) => `${q.x},${q.y},${q.tipo}`).join(' ') !== '-1,0,punto de silla 1,0,mínimo') mal('Derivadas: x³ − 3x + y² no da la silla en (−1, 0) y el mínimo en (1, 0)'); }
    { const x = r('parciales'); if (x.crit.length !== 4 || x.punto.gx !== 4 || x.punto.gy !== 10) mal('Derivadas: los puntos críticos o el gradiente de x² y + y³ − 3y no cuadran'); }
    if (fallos === antes) console.log(`  ✓ Derivadas e integrales: ${DerC.ejemplos.length} ejemplos, derivadas como en clase y frente al cociente incremental, tangente y extremos, ${Object.keys(prims).length} primitivas comprobadas derivándolas, Barrow, numérica, área, impropias, L'Hôpital, área entre curvas, volúmenes, estudio completo, implícita, parciales y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'matematicas', 'derivadas', 'index.html'));
      await page.waitForFunction(() => window.DerivadasApp);
      await require('./comun/exportar.js')(page, mal, 'derivadas', { lienzo: '#grafica', datos: false });
      const antes = fallos;
      const verD = (await page.locator('#ver').textContent()).trim();
      if (verD !== Version.de('derivadas').current) mal(`Derivadas: la página muestra la versión «${verD}», se esperaba ${Version.de('derivadas').current}`);
      for (const e of DerC.ejemplos) {
        await page.evaluate((c) => DerivadasApp.abrirEjemplo(c), e.clave);
        const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div').length, modo: document.querySelector('#modo').value }));
        if (r.err || r.pasos < 3 || r.res < 1) mal(`Derivadas · ${e.clave}: falta el resultado o el desarrollo`);
        if (!r.mathml || r.dolar) mal(`Derivadas · ${e.clave}: el desarrollo no sale en MathML`);
        if (r.modo !== e.sc.modo) mal(`Derivadas · ${e.clave}: el modo no cuadra`);
      }
      await page.evaluate(() => DerivadasApp.abrirEjemplo('partes'));
      if (!(await page.locator('#resumen').textContent()).includes('0,718282')) mal('Derivadas: ∫₀¹ x² eˣ no sale 0,718282 en la página');
      await page.fill('#f-b', '1');
      await page.fill('#f-a', '1');
      if (await page.locator('#error').isHidden()) mal('Derivadas: a = b no da error');
      await page.selectOption('#modo', 'derivada');
      if ((await page.locator('#f-x0').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Derivadas: al pasar a derivada no salen sus campos o da error');
      const box = await page.locator('#grafica').boundingBox();
      const x0 = await page.locator('#f-x0').inputValue();
      await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.4);
      if ((await page.locator('#f-x0').inputValue()) === x0 || !(await page.locator('#error').isHidden())) mal('Derivadas: tocar la gráfica no cambia x₀');
      await page.click('#animar'); await page.waitForTimeout(500); await page.click('#animar');
      for (let i = 0; i < 15; i++) { await page.evaluate(() => DerivadasApp.azar()); if (!(await page.locator('#error').isHidden()) || !(await page.locator('#resumen > div.num').count())) mal(`Derivadas: un ejercicio al azar da error o no tiene resultado numérico: ${JSON.stringify(await page.evaluate(() => DerivadasApp.estado()))}`); }
      await page.close();
      if (consola.length) mal('Derivadas: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Derivadas e integrales: ${DerC.ejemplos.length} ejemplos con MathML, a = b, cambio de modo, tocar la gráfica, animación y ejercicios al azar sin errores de consola`);
    }
  };
};
