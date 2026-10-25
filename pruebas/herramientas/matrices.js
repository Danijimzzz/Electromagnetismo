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
