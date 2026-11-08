/* Comprobación de sistemas-numericos: cálculos en Node y la página en Chromium. node fuente/nueva.js
   la copia a pruebas/herramientas/<clave>.js; la carga pruebas/comprobar.js
   (node pruebas/comprobar.js --solo sistemas-numericos ejecuta solo esta).
   Cambia los valores de abajo por los de tus ejemplos, calculados a mano. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'sistemas-numericos', 'calculo.js'));
  {
    const antes = fallos, igual = (a, b, q) => { if (a !== b) mal(`SistemasNumericos · ${q}: «${a}» en vez de «${b}»`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc), fila = (s, k) => s.filas.find((x) => x.k === k)?.v;
    // valores calculados a mano
    let s = r('negativo');   // −45 en 8 bits: 45 = 0010 1101, invertido 1101 0010, +1 = 1101 0011 = D3
    igual(fila(s, 'dec'), '−45', '−45 decimal'); igual(fila(s, 'bin'), '−0010 1101', '−45 binario'); igual(fila(s, 'c2'), '1101 0011', '−45 C2');
    igual(fila(s, 'hex'), '−2D', '−45 hex'); igual(fila(s, 'hexc2'), 'D3', '−45 hex del C2'); igual(fila(s, 'bcd'), '−0100 0101', '−45 BCD');
    s = r('binario');        // 10110111 = 128+32+16+4+2+1 = 183; no cabe en 8 bits con signo
    igual(fila(s, 'dec'), '183', '10110111 decimal'); igual(fila(s, 'hex'), 'B7', '10110111 hex'); igual(fila(s, 'bcd'), '0001 1000 0011', '183 BCD');
    if (!/no cabe/.test(fila(s, 'c2'))) mal('SistemasNumericos · 183 debería no caber en C2 de 8 bits');
    s = r('c2');             // 11101100 = −128+64+32+8+4 = −20
    igual(fila(s, 'dec'), '−20', 'C2 11101100 decimal'); igual(fila(s, 'c2'), '1110 1100', 'C2 11101100 patrón'); igual(fila(s, 'hex'), '−14', '−20 hex'); igual(fila(s, 'hexc2'), 'EC', '−20 hex del C2');
    s = r('hex');            // 3F = 3·16+15 = 63
    igual(fila(s, 'dec'), '63', '3F decimal'); igual(fila(s, 'bin'), '0011 1111', '3F binario'); igual(fila(s, 'bcd'), '0110 0011', '63 BCD');
    s = r('bcd');            // 1001 0111 0101 → 975 = 11 1100 1111 = 3CF
    igual(fila(s, 'dec'), '975', 'BCD 975'); igual(fila(s, 'hex'), '3CF', '975 hex'); igual(fila(s, 'c2'), '0000 0011 1100 1111', '975 C2 en 16 bits');
    // límites del complemento a 2 y el cero
    const cb = (valor, bits) => C.resolver({ base: 'dec', valor, bits });
    igual(cb('-128', '8').c2, '10000000', '−128 en 8 bits'); igual(cb('127', '8').c2, '01111111', '127 en 8 bits'); igual(cb('128', '8').c2, null, '128 no cabe en 8 bits');
    igual(cb('-8', '4').c2, '1000', '−8 en 4 bits'); igual(cb('0', '4').bin, '0000', 'cero');
    igual(C.resolver({ base: 'c2', valor: '1', bits: '4' }).v, -1, 'C2 de un solo bit'); igual(C.resolver({ base: 'bin', valor: '0b1010 1010', bits: '8' }).v, 170, 'binario con 0b y espacios');
    for (const [sc, q] of [[{ base: 'dec', valor: '', bits: '8' }, 'vacío'], [{ base: 'dec', valor: '12,5', bits: '8' }, 'decimal con coma'], [{ base: 'bin', valor: '102', bits: '8' }, 'binario con un 2'],
      [{ base: 'hex', valor: '1G', bits: '8' }, 'hex con G'], [{ base: 'bcd', valor: '1010', bits: '8' }, 'BCD 1010'], [{ base: 'c2', valor: '100000000', bits: '8' }, 'C2 de 9 bits en 8'], [{ base: 'dec', valor: '5', bits: '7' }, 'bits 7']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`SistemasNumericos: ${q} no da error`);
    }
    // ida y vuelta con números al azar: cada resultado, leído de nuevo, da el mismo valor
    for (let i = 0; i < 300; i++) {
      const v = Math.floor(Math.random() * 65536) - 32768, bits = '16', t = C.resolver({ base: 'dec', valor: String(v), bits });
      if (C.resolver({ base: 'c2', valor: t.c2, bits }).v !== v) mal(`SistemasNumericos: ida y vuelta en C2 de ${v}`);
      if (C.resolver({ base: 'bcd', valor: t.bcd.replace('−', ''), bits }).v !== Math.abs(v)) mal(`SistemasNumericos: ida y vuelta en BCD de ${v}`);
      if (C.resolver({ base: 'hex', valor: t.hex.replace('−', ''), bits }).v !== Math.abs(v)) mal(`SistemasNumericos: ida y vuelta en hex de ${v}`);
    }
    // SN-2: octal y Gray
    s = r('octal'); igual(fila(s, 'dec'), '493', '755 octal = 493'); igual(fila(s, 'hex'), '1ED', '755 octal en hex'); igual(fila(s, 'oct'), '755', '755 octal vuelve a salir');
    s = r('gray'); igual(fila(s, 'dec'), '9', 'Gray 1101 = 9 (binario 1001)'); igual(fila(s, 'bin'), '1001', 'Gray 1101 en binario');
    for (let v = 0; v < 64; v++) { const g = C.resolver({ base: 'dec', valor: String(v), bits: '8' }), g2 = C.resolver({ base: 'dec', valor: String(v + 1), bits: '8' }); const a1 = fila(g, 'gray'), a2 = fila(g2, 'gray'); let d = 0; const L = Math.max(a1.length, a2.length); for (let i = 0; i < L; i++) if ((a1.padStart(L, '0')[i]) !== (a2.padStart(L, '0')[i])) d++; if (d !== 1) mal(`SistemasNumericos: Gray de ${v} y ${v + 1} difieren en ${d} bits`); if (C.resolver({ base: 'gray', valor: a1, bits: '8' }).v !== v) mal(`SistemasNumericos: ida y vuelta en Gray de ${v}`); }
    // SN-1: fracciones con coma
    const fr = (valor, dest, dir = 'a', nf = '12') => C.resolver({ modo: 'fraccion', dir, valor, dest, nf, bits: '8' });
    igual(fr('0,1', '2').texto, '0,0(0011)', '0,1 en binario es periódico'); igual(fr('0,1', '2').periodico, true, '0,1 es periódico');
    igual(fr('13,625', '2').texto, '1101,101', '13,625 en binario'); igual(fr('13,625', '16').texto, 'D,A', '13,625 en hexadecimal'); igual(fr('13,625', '8').texto, '15,5', '13,625 en octal');
    igual(fr('1/3', '2').texto, '0,(01)', '1/3 en binario'); igual(fr('1/3', '16').texto, '0,(5)', '1/3 en hexadecimal'); igual(fr('1/7', '2').texto, '0,(001)', '1/7 en binario');
    igual(fr('−0,5', '2').texto, '−0,1', '−0,5 en binario'); igual(fr('5', '2').texto, '101', 'un entero no lleva coma'); igual(fr('0,75', '2').periodico, false, '0,75 es finito');
    { const e = fr('0,1', '2', 'a', '8'); const exacto = 0.1, aprox = 0b00011001 / 256; if (Math.abs(e.err - (aprox - exacto)) > 1e-12) mal(`SistemasNumericos: error al truncar 0,1 a 8 bits: ${e.err} en vez de ${aprox - exacto}`); }
    igual(fr('101,011', '2', 'de').texto, '5,375', '101,011 a decimal'); igual(fr('A,8', '16', 'de').texto, '10,5', 'A,8 hex a decimal'); igual(fr('0,1', '2', 'de').texto, '0,5', '0,1 binario es 0,5'); igual(fr('0,0001', '2', 'de').texto, '0,0625', '0,0001 binario');
    igual(fr('0,0000000000000001', '2', 'de').texto, '0,0000152587890625', '2^−16 exacto en decimal');
    for (const [sc, q] of [[{ modo: 'fraccion', dir: 'a', valor: '1/0', dest: '2' }, 'denominador 0'], [{ modo: 'fraccion', dir: 'a', valor: 'a', dest: '2' }, 'texto'], [{ modo: 'fraccion', dir: 'de', valor: '102', dest: '2' }, 'dígito 2 en binario'], [{ modo: 'fraccion', dir: 'a', valor: '0,1', dest: '3' }, 'base 3'], [{ modo: 'fraccion', dir: 'a', valor: '0,1', dest: '2', nf: '99' }, 'demasiados dígitos']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; } if (!ok) mal(`SistemasNumericos: ${q} no da error`);
    }
    // SN-1: IEEE 754 (contra el hardware)
    const ie = (valor, prec = '32') => C.resolver({ modo: 'ieee', valor, prec });
    igual(ie('0,1').hex, '0x3DCCCCCD', '0,1 en 32 bits'); igual(ie('1').hex, '0x3F800000', '1 en 32 bits'); igual(ie('−118,625').hex, '0xC2ED4000', '−118,625 en 32 bits'); igual(ie('−118,625').signo, '1', 'signo de −118,625');
    igual(ie('0,1', '64').hex, '0x3FB999999999999A', '0,1 en 64 bits'); igual(ie('0').clase, '+0', 'cero'); igual(ie('inf').clase, '+∞', 'infinito'); igual(ie('nan').clase, 'NaN (no es un número)', 'NaN');
    igual(ie('1e-45').clase, 'subnormal (denormal)', '1e-45 es subnormal en 32 bits'); igual(ie('0x40490FDB').v, Math.fround(Math.PI), 'patrón de π'); igual(ie('0x7F800000').clase, '+∞', 'patrón de +∞');
    igual(ie('0,5').mantisa, '0'.repeat(23), 'la mantisa de 0,5 es 0'); igual(ie('0,5').exponente, '01111110', 'exponente de 0,5');
    for (let i = 0; i < 200; i++) { const x = (Math.random() - 0.5) * 10 ** Math.floor(Math.random() * 20 - 10), t = ie(String(x).replace('.', ',')); if (t.v !== Math.fround(x)) mal(`SistemasNumericos: IEEE 32 de ${x} guarda ${t.v}`); if (ie(t.hex).v !== t.v) mal(`SistemasNumericos: ida y vuelta IEEE de ${x}`); }
    for (const [sc, q] of [[{ modo: 'ieee', valor: '', prec: '32' }, 'vacío'], [{ modo: 'ieee', valor: 'abc', prec: '32' }, 'texto'], [{ modo: 'ieee', valor: '0x1234', prec: '32' }, 'patrón corto']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; } if (!ok) mal(`SistemasNumericos: IEEE ${q} no da error`);
    }
    // SN-2: suma y resta en complemento a 2
    const ar = (a, b, op = '+', bits = '8') => C.resolver({ modo: 'aritmetica', a, b, op, bits });
    s = ar('100', '50'); igual(s.desborda, true, '100 + 50 desborda en 8 bits'); igual(s.patron, '10010110', '100 + 50 patrón'); igual(s.v, -106, '100 + 50 sale −106');
    s = ar('25', '60', '-'); igual(s.desborda, false, '25 − 60 cabe'); igual(s.v, -35, '25 − 60'); igual(s.patron, '11011101', '25 − 60 patrón');
    s = ar('-100', '-50'); igual(s.desborda, true, '−100 + (−50) desborda'); igual(s.v, 106, '−100 − 50 sale +106');
    s = ar('127', '1'); igual(s.desborda, true, '127 + 1'); s = ar('-128', '1', '-'); igual(s.desborda, true, '−128 − 1'); s = ar('0', '-128', '-'); igual(s.desborda, true, '0 − (−128) desborda'); s = ar('-1', '1'); igual(s.v, 0, '−1 + 1'); igual(s.acarreoSalida, 1, '−1 + 1 saca acarreo'); igual(s.desborda, false, '−1 + 1 no desborda');
    for (let i = 0; i < 400; i++) { const a = Math.floor(Math.random() * 256) - 128, b = Math.floor(Math.random() * 256) - 128, op = i % 2 ? '-' : '+', t = ar(String(a), String(b), op), ver = op === '+' ? a + b : a - b; if (t.vt !== ver) mal(`SistemasNumericos: ${a} ${op} ${b} da ${t.vt}`); if (t.desborda !== (ver < -128 || ver > 127)) mal(`SistemasNumericos: desbordamiento de ${a} ${op} ${b}`); if (!t.desborda && t.v !== ver) mal(`SistemasNumericos: ${a} ${op} ${b} sale ${t.v} en C2`); const cs = t.acarreoEntrada !== t.acarreoSalida; if (op === '+' && cs !== t.desborda) mal(`SistemasNumericos: la regla de los acarreos falla en ${a} + ${b}`); }
    for (const [sc, q] of [[{ modo: 'aritmetica', a: '200', b: '1', op: '+', bits: '8' }, 'operando fuera de rango'], [{ modo: 'aritmetica', a: '1,5', b: '1', op: '+', bits: '8' }, 'decimal'], [{ modo: 'aritmetica', a: '1', b: '', op: '+', bits: '8' }, 'falta b']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; } if (!ok) mal(`SistemasNumericos: aritmética ${q} no da error`);
    }
    if (fallos === antes) console.log(`  ✓ SistemasNumericos: ${C.ejemplos.length} ejemplos, límites del C2, errores e ida y vuelta`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'circuitos', 'sistemas-numericos', 'index.html'));
    await page.waitForFunction(() => window.SistemasNumericosApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('sistemas-numericos').current) mal(`SistemasNumericos: la página muestra la versión «${ver}», se esperaba ${Version.de('sistemas-numericos').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => SistemasNumericosApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || !r.pasos || !r.res) mal(`SistemasNumericos · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`SistemasNumericos · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.evaluate(() => SistemasNumericosApp.abrirEjemplo('negativo'));
    await page.selectOption('#f-modo', 'fraccion'); if (!(await page.locator('#f-dest').count())) mal('SistemasNumericos: al elegir fracciones no salen los campos de la base');
    await page.fill('#f-valor', '0,1'); if ((await page.locator('#resumen').textContent()).indexOf('0,0(0011)') < 0) mal('SistemasNumericos: 0,1 en binario no sale periódico en la página');
    await page.selectOption('#f-modo', 'ieee'); await page.fill('#f-valor', '0,1'); if ((await page.locator('#resumen').textContent()).indexOf('0x3DCCCCCD') < 0) mal('SistemasNumericos: IEEE 754 de 0,1 no sale en la página');
    await page.selectOption('#f-modo', 'aritmetica'); if (!(await page.locator('#pasos').textContent()).includes('desbordamiento')) mal('SistemasNumericos: la suma 100 + 50 no avisa del desbordamiento');
    await page.selectOption('#f-modo', 'entero');
    await page.fill('#f-valor', '12,5');
    if (await page.locator('#error').isHidden()) mal('SistemasNumericos: un número con decimales no muestra el error');
    await page.close();
    if (consola.length) mal('SistemasNumericos: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ SistemasNumericos: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
