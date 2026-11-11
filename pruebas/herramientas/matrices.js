/* Comprobación de matrices: cálculos en Node y la página en Chromium. La carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo matrices ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const Matrices = require(path.join(fuente, 'matrices', 'calculo.js'));
  {
    // resultados resueltos a mano y comprobaciones cruzadas (A·A⁻¹ = I, A v = λ v, mismos determinantes por los dos métodos)
    const antes = fallos, Al = Algebra, L = (...f) => Al.leerMatriz(f.map((x) => x.split(' ')));
    const R = Object.fromEntries(Matrices.ejemplos.map((e) => [e.clave, Matrices.resolver(e.sc)]));
    const esp = { det3: '−19', det4: '30', 'det-gauss': '30' };
    for (const [k, v] of Object.entries(esp)) if (Al.txt(R[k].valor) !== v) mal(`Matrices · ${k}: |A| = ${Al.txt(R[k].valor)}, se esperaba ${v}`);
    for (const e of Matrices.ejemplos.filter((x) => x.sc.op === 'det' && !R[x.clave].letra)) {
      const otro = Matrices.resolver({ ...e.sc, metodo: e.sc.metodo === 'gauss' ? 'directo' : 'gauss' }).valor;
      if (!Al.igual(otro, R[e.clave].valor)) mal(`Matrices · ${e.clave}: Gauss y Sarrus/Laplace no dan lo mismo`);
    }
    if (!Al.iguales(R.inv3.valor, L('-24 18 5', '20 -15 -4', '-5 4 1'))) mal('Matrices · inv3: la inversa no es la esperada');
    for (const e of Matrices.ejemplos.filter((x) => x.sc.op === 'inversa' && !R[x.clave].letra)) {
      const A = Al.leerMatriz(e.sc.A), inv = R[e.clave].valor;
      if (!inv || !Al.iguales(Al.producto(A, inv), Al.identidad(A.length))) mal(`Matrices · ${e.clave}: A·A⁻¹ no es la identidad`);
      const otro = Matrices.resolver({ ...e.sc, metodo: e.sc.metodo === 'gauss' ? 'adjuntos' : 'gauss' }).valor;
      if (!Al.iguales(otro, inv)) mal(`Matrices · ${e.clave}: Gauss-Jordan y adjuntos no dan la misma inversa`);
    }
    if (!Al.iguales(R['inv-complejos'].valor, L('2 -i', 'i 1'))) mal('Matrices · inversa compleja incorrecta');
    if (R.rango.valor !== 2) mal(`Matrices · rango: ${R.rango.valor}, se esperaba 2`);
    if (!Al.iguales(R.reducida.valor, L('1 0 -1 0', '0 1 2 0', '0 0 0 1'))) mal('Matrices · escalonada reducida incorrecta');
    if (Matrices.resolver({ op: 'inversa', A: [['1', '2'], ['2', '4']] }).valor !== null) mal('Matrices: una matriz singular no debería tener inversa');
    const propios = { propios2: ['2', '5'], diagonalizar: ['−5', '2', '5'], rotacion: ['i', '−i'] };
    for (const [k, v] of Object.entries(propios)) {
      const vals = R[k].valor.map((x) => Al.txt(x.valor));
      if (vals.join() !== v.join()) mal(`Matrices · ${k}: λ = ${vals}, se esperaba ${v}`);
      if (!R[k].diag) mal(`Matrices · ${k}: debería ser diagonalizable`);
    }
    for (const k of Object.keys(propios)) {
      const A = Al.leerMatriz(Matrices.ejemplos.find((e) => e.clave === k).sc.A);
      for (const v of R[k].valor) { const N = Al.nucleo(Al.restaM(A, Al.escalar(v.valor, Al.identidad(A.length)))); for (const b of N.base) { const Av = Al.producto(A, b.map((x) => [x])), lv = b.map((x) => [Al.mul(v.valor, x)]); if (!Al.iguales(Av, lv)) mal(`Matrices · ${k}: A v ≠ λ v`); } }
    }
    if (Matrices.resolver({ op: 'propios', A: [['2', '1'], ['0', '2']] }).diag !== false) mal('Matrices: [[2,1],[0,2]] no es diagonalizable');
    if (!Matrices.resolver({ op: 'propios', A: [['1', '2'], ['3', '4']] }).res.includes('(5 + √33)/2')) mal('Matrices: los valores propios de [[1,2],[3,4]] deberían salir con radicales');
    if (!Al.iguales(R.producto.valor, L('2 -1', '6 2')) || !Al.iguales(R.potencia.valor, L('1 5', '0 1'))) mal('Matrices: producto o potencia incorrectos');
    for (const [s, v] of [['-1/2', '−1/2'], ['0,25', '1/4'], ['(1+i)/2', '1/2 + 1/2·i'], ['3(1-i)', '3 − 3i'], ['1/(1+i)', '1/2 − 1/2·i']]) if (Al.txt(Al.leer(s)) !== v) mal(`Matrices: «${s}» se lee como ${Al.txt(Al.leer(s))}`);
    const malas = [{ op: 'det', A: [['1', '2', '3'], ['4', '5', '6']] }, { op: 'producto', A: [['1', '2']], B: [['1', '2']] }, { op: 'det', A: [['1', 'x y'], ['2', '3']] }, { op: 'suma', A: [['1']], B: [['1', '2']] }, { op: 'potencia', A: [['1', '2'], ['2', '4']], n: '-1' }];
    for (const m of malas) { let ok = false; try { Matrices.resolver(m); } catch (e) { ok = true; } if (!ok) mal(`Matrices: ${JSON.stringify(m)} debería dar un error`); }
    // MA-4 · entrada flexible en las casillas: √4 = 2, e^(iπ) = −1, cos π = −1 ⇒ |2 1; −1 −1| = −1; √(−4) = 2i; √2 no es racional
    {
      const d1 = Matrices.resolver({ op: 'det', A: [['sqrt(4)', '1'], ['e^(iπ)', 'cos(π)']] });
      if (Al.txt(d1.valor) !== '−1' || d1.leidos !== 3 || d1.pasos[0].t !== 'Valores leídos') mal(`Matrices: det con casillas calculadas da ${Al.txt(d1.valor)} (${d1.leidos} leídas)`);
      if (Al.txt(Matrices.resolver({ op: 'det', A: [['sqrt(-4)', '1'], ['1', '(1+i)^2']] }).valor) !== '−5') mal('Matrices: √(−4)·(1 + i)² − 1 no da −5');
      if (Al.txt(Matrices.resolver({ op: 'escalar', A: [['2']], k: 'sqrt(9)/2' }).valor[0][0]) !== '3') mal('Matrices: k = √9/2 no se lee como 3/2');
      let aviso = ''; try { Matrices.resolver({ op: 'det', A: [['sqrt(2)', '1'], ['1', '2']] }); } catch (e) { aviso = e.message; }
      if (!/1,41421/.test(aviso) || !/fracción exacta/.test(aviso)) mal(`Matrices: √2 en una casilla no avisa bien («${aviso}»)`);
      // los parámetros y lo que ya se leía no pasan por aquí
      for (const A of [[['k', '1'], ['1', 'k']], [['k^2', '1'], ['1', 'k']], [['2^3', '1/2+1/3'], ['0,5', '1']], [['1', 'i'], ['-i', '2']]]) if (Matrices.resolver({ op: 'det', A }).leidos) mal(`Matrices: ${JSON.stringify(A)} pasa por la entrada flexible`);
    }
    // MX-3 · núcleo e imagen. A mano, con A = (1 2 −1 3; 2 4 1 0; 3 6 0 3): reducida (1 2 0 1; 0 0 1 −2; 0 0 0 0), rango 2,
    // núcleo de dimensión 2 con base (2, −1, 0, 0) y (1, 0, −2, −1)·(−1), imagen = columnas 1 y 3, implícita y₁ + y₂ − y₃ = 0
    {
      const S = R.subespacios.valor, A = L('1 2 -1 3', '2 4 1 0', '3 6 0 3'), nulo = (v) => v.every((x) => Al.esCero(x));
      if (S.rango !== 2 || S.dimNucleo !== 2 || S.imagen.length !== 2) mal(`Matrices · subespacios: rango ${S.rango}, núcleo de dimensión ${S.dimNucleo}`);
      for (const b of S.nucleo) if (!nulo(Al.producto(A, b.map((x) => [x])).map((f) => f[0]))) mal('Matrices · subespacios: un vector de la base del núcleo no cumple A·x = 0');
      if (Al.escalonar(S.nucleo).rango !== 2) mal('Matrices · subespacios: la base del núcleo no es independiente');
      if (S.imagen.map((c) => c.map(Al.txt).join(' ')).join('|') !== '1 2 3|−1 1 0') mal(`Matrices · subespacios: la base de la imagen es ${S.imagen.map((c) => c.map(Al.txt).join(' ')).join('|')}`);
      if (S.implicitasImagen.length !== 1 || S.implicitasImagen[0].map(Al.txt).join(' ') !== '1 1 −1') mal(`Matrices · subespacios: la ecuación implícita de la imagen es ${S.implicitasImagen.map((w) => w.map(Al.txt).join(' '))}`);
      // cada columna de A cumple las implícitas de la imagen, y cada fila de la reducida es ortogonal al núcleo
      for (const w of S.implicitasImagen) for (let j = 0; j < 4; j++) if (!Al.esCero(w.reduce((t, x, i) => Al.suma(t, Al.mul(x, A[i][j])), Al.c0))) mal('Matrices · subespacios: una columna de A no cumple la ecuación implícita de la imagen');
      for (const f of S.filas) for (const b of S.nucleo) if (!Al.esCero(f.reduce((t, x, i) => Al.suma(t, Al.mul(x, b[i])), Al.c0))) mal('Matrices · subespacios: una fila no es ortogonal al núcleo');
      const tx = R.subespacios.pasos.map((q) => q.html).join(' ').replace(/<sub>(\d)<\/sub>/g, '$1').replace(/<[^>]+>/g, '');
      for (const q of ['x1 + 2x2 + x4 = 0', 'x3 − 2x4 = 0', 'y1 + y2 − y3 = 0', '2 + 2 = 4']) if (!tx.includes(q)) mal(`Matrices · subespacios: falta «${q}» en el desarrollo`);
      // casos límite: inyectiva (3×2 de rango 2), sobreyectiva (2×3), nula e identidad
      const cs = [[['1 0', '0 1', '1 1'], 2, 0, 1], [['1 2 3', '0 1 1'], 2, 1, 0], [['0 0', '0 0'], 0, 2, 2], [['1 0', '0 1'], 2, 0, 0], [['1 i', 'i -1'], 1, 1, 1]];
      for (const [f, rg, dk, ni] of cs) { const q = Matrices.resolver({ op: 'subespacios', A: f.map((x) => x.split(' ')) }).valor; if (q.rango !== rg || q.dimNucleo !== dk || q.implicitasImagen.length !== ni) mal(`Matrices · subespacios de ${f.join('; ')}: rango ${q.rango}, núcleo ${q.dimNucleo}, ${q.implicitasImagen.length} implícitas`); }
    }
    // MX-1 · vectores propios no racionales: A v = λ v con 4 cifras; (1 1; 1 0) ⇒ λ = (1 ± √5)/2 y v = (1, −1/2 ± √5/2)
    {
      for (const c of ['propios-raiz', 'propios-num']) {
        const r = R[c], A = r.A.map((f) => f.map((x) => Al.aFloat(x)));
        const ne = r.valor.filter((v) => !v.exacto);
        if (ne.length !== 2 || ne.some((v) => !v.vector)) { mal(`Matrices · ${c}: faltan los vectores propios numéricos`); continue; }
        for (const v of ne) A.forEach((f, i) => { const s = f.reduce((t, x, j) => ({ re: t.re + x.re * v.vector[j].re - x.im * v.vector[j].im, im: t.im + x.re * v.vector[j].im + x.im * v.vector[j].re }), { re: 0, im: 0 }); const e = { re: v.valor.re * v.vector[i].re - v.valor.im * v.vector[i].im, im: v.valor.re * v.vector[i].im + v.valor.im * v.vector[i].re }; if (Math.hypot(s.re - e.re, s.im - e.im) > 1e-9) mal(`Matrices · ${c}: A v ≠ λ v en la fila ${i + 1}`); });
      }
      const tr = R['propios-raiz'].pasos.find((q) => q.t.startsWith('Vectores propios de los valores no racionales'))?.html.replace(/<[^>]+>/g, '') || '';
      if (!tr.includes('1,618') || !tr.includes('√5') || R['propios-raiz'].valor.some((v) => !v.vectorRad)) mal(`Matrices · propios-raiz: falta el vector con radicales o el numérico (${tr.slice(0, 200)})`);
      // complejos no racionales: (1 −3; 1 1) ⇒ λ = 1 ± √3 i, v = (−3, ±√3 i) (o un múltiplo)
      const cx = Matrices.resolver({ op: 'propios', A: [['1', '-3'], ['1', '1']] }), vc = cx.valor.filter((v) => !v.exacto);
      if (vc.length !== 2 || vc.some((v) => !v.vector || !v.vectorRad.includes('√3 i') || Math.abs(Math.abs(v.vector[0].im) - Math.sqrt(3)) > 1e-9)) mal(`Matrices: vectores propios complejos con radicales, ${JSON.stringify(vc.map((v) => [v.vector, v.vectorRad]))}`);
    }
    if (fallos === antes) console.log(`  ✓ Matrices: ${Matrices.ejemplos.length} ejemplos con el resultado esperado, inversas y determinantes por los dos métodos, A v = λ v, lectura de números y errores`);
  }

  return async (browser) => {
    {
      const { page, consola } = await pagina(browser, 1200, 900);
      await page.goto('file://' + path.join(publico, 'matematicas', 'matrices', 'index.html'));
      await page.waitForFunction(() => window.MatricesApp);
      const antes = fallos;
      const verM = (await page.locator('#ver').textContent()).trim();
      if (verM !== Version.de('matrices').current) mal(`Matrices: la página muestra la versión «${verM}», se esperaba ${Version.de('matrices').current}`);
      for (const e of Matrices.ejemplos) {
        await page.evaluate((c) => MatricesApp.abrirEjemplo(c), e.clave);
        if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 1) mal(`Matrices · ${e.clave}: falta el resultado o el desarrollo`);
      }
      await page.evaluate(() => MatricesApp.abrirEjemplo('det3'));
      if (!(await page.locator('#res').textContent()).includes('−19')) mal('Matrices: el determinante de ejemplo no da −19 en la página');
      await page.selectOption('#ed-A select[data-d="n"]', '2');
      await page.fill('#ed-A input[data-i="0"][data-j="1"]', '1/2+i');
      if (!(await page.locator('#error').isHidden())) mal('Matrices: un complejo en una casilla da error: ' + (await page.locator('#error').textContent()));
      await page.fill('#ed-A input[data-i="0"][data-j="0"]', 'abc');
      if (await page.locator('#error').isHidden()) mal('Matrices: una casilla con texto no muestra el error');
      await page.selectOption('#op', 'producto');
      if (await page.locator('#ed-B').isHidden()) mal('Matrices: el producto no muestra la matriz B');
      await page.close();
      if (consola.length) mal('Matrices: consola del navegador:\n      ' + consola.join('\n      '));
      if (fallos === antes) console.log(`  ✓ Matrices: ${Matrices.ejemplos.length} ejemplos, cambio de tamaño, complejos y errores sin errores de consola`);
    }
  };
};
