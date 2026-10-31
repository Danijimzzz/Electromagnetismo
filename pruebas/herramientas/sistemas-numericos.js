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
    await page.fill('#f-valor', '12,5');
    if (await page.locator('#error').isHidden()) mal('SistemasNumericos: un número con decimales no muestra el error');
    await page.close();
    if (consola.length) mal('SistemasNumericos: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ SistemasNumericos: ${C.ejemplos.length} ejemplos en la página con MathML y errores, sin errores de consola`);
  };
};
