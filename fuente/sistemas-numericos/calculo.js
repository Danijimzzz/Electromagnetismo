/* =====================================================================
   Sistemas de numeración (sin DOM): pasa un número entero entre decimal,
   binario, complemento a 2, hexadecimal y BCD, con el desarrollo paso a paso.
   La interfaz está en app.js y la prueba en pruebas/herramientas/sistemas-numericos.js.
     resolver(sc)  { base, valor, bits } (texto) → { v, bin, hex, bcd, c2, hexC2,
                   filas, pasos, … }; lanza un Error con un mensaje para el usuario
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     azar()        sc al azar (bin, c2, hex o bcd) para el modo práctica
   Convenciones: binario, hexadecimal y BCD se leen sin signo; en C2 el bit de
   la izquierda es el de signo (pesa −2^(w−1)). Al pasar un negativo a binario,
   hexadecimal o BCD se escribe el valor absoluto con el signo − delante.
   ===================================================================== */
const SistemasNumericos = (() => {
  const BASES = { dec: 'decimal', bin: 'binario', c2: 'complemento a 2', hex: 'hexadecimal', bcd: 'BCD' };
  const SUB = { dec: '10', bin: '2', c2: 'C2', hex: '16', bcd: 'BCD' };
  const BITS = [4, 8, 16, 32];
  const grupos = (b) => b.padStart(Math.ceil(b.length / 4) * 4, '0').replace(/(.{4})(?=.)/g, '$1 ');
  const sub = (txt, base) => `${txt}_{${SUB[base]}}`;

  /* ---------- Lectura del número según su sistema ---------- */
  function lee(sc) {
    const base = BASES[sc.base] ? sc.base : 'dec', n = +sc.bits || 8;
    if (!BITS.includes(n)) throw new Error('El número de bits debe ser 4, 8, 16 o 32');
    let t = String(sc.valor ?? '').trim().replace(/[\s_]/g, '').replace(/[−–]/g, '-');
    if (!t) throw new Error('Escribe un número');
    let v, w = 0;
    if (base === 'dec') {
      if (!/^[+-]?\d+$/.test(t)) throw new Error('En decimal solo caben dígitos del 0 al 9, con − delante si es negativo (aquí no hay decimales)');
      if (t.replace(/^[+-]/, '').length > 15) throw new Error('El número es demasiado grande (máximo 15 cifras)');
      v = +t;
    } else if (base === 'hex') {
      t = t.replace(/^0x/i, '');
      if (!/^[0-9a-f]+$/i.test(t)) throw new Error('En hexadecimal solo caben los dígitos 0-9 y A-F');
      if (t.length > 13) throw new Error('El número es demasiado grande (máximo 13 cifras hexadecimales)');
      v = parseInt(t, 16);
    } else {
      t = t.replace(/^0b/i, '');
      if (!/^[01]+$/.test(t)) throw new Error(`En ${BASES[base]} solo caben los bits 0 y 1`);
      if (t.length > 52) throw new Error('El número es demasiado grande (máximo 52 bits)');
      if (base === 'bin') v = parseInt(t, 2);
      else if (base === 'c2') {
        if (t.length > n) throw new Error(`El patrón tiene ${t.length} bits y solo caben ${n}: sube el número de bits`);
        w = t.length; v = parseInt(t, 2) - (t[0] === '1' ? 2 ** w : 0);
      } else {
        t = t.padStart(Math.ceil(t.length / 4) * 4, '0');
        const ds = t.match(/.{4}/g).map((g) => parseInt(g, 2)), mal = ds.findIndex((d) => d > 9);
        if (mal >= 0) throw new Error(`El grupo ${t.slice(4 * mal, 4 * mal + 4)} no es un dígito BCD (solo valen de 0000 a 1001)`);
        if (ds.length > 15) throw new Error('El número es demasiado grande (máximo 15 dígitos BCD)');
        v = +ds.join('');
      }
    }
    return { base, n, t, v, w };
  }

  /* ---------- Desarrollo: del número de entrada a decimal ---------- */
  function aDecimal(base, t, v, w) {
    if (base === 'bin' || base === 'c2') {
      const bs = [...t], L = bs.length, un = base === 'c2';
      const term = (b, i) => `${un && i === 0 ? '−' : ''}${b}·2^{${L - 1 - i}}`;
      let idx = bs.map((b, i) => [b, i]);
      let suma = idx.length > 12 ? idx.filter(([b]) => b === '1') : idx;
      const cuerpo = (suma.length ? suma : idx.slice(-1)).map(([b, i]) => term(b, i)).join(' + ').replace(/\+ −/g, '− ');
      return { t: `De ${BASES[base]} a decimal`, html: `Cada bit pesa una potencia de 2${un ? ', y el de la izquierda (el de signo) pesa en negativo' : ''}${idx.length > 12 ? ' (solo se escriben los bits a 1)' : ''}: $${sub(t, base)} = ${cuerpo} = ${String(v).replace('-', '−')}$` };
    }
    if (base === 'hex') {
      const cs = [...t], L = cs.length;
      const cuerpo = cs.map((c, i) => `${parseInt(c, 16)}·16^{${L - 1 - i}}`).join(' + ');
      return { t: 'De hexadecimal a decimal', html: `Cada cifra pesa una potencia de 16 (A = 10, B = 11, C = 12, D = 13, E = 14, F = 15): $${sub(t.toUpperCase(), 'hex')} = ${cuerpo} = ${v}$` };
    }
    // bcd
    const gs = t.match(/.{4}/g), ds = gs.map((g) => parseInt(g, 2));
    return { t: 'De BCD a decimal', html: `Cada grupo de 4 bits es un dígito decimal: ${gs.map((g, i) => `$${g} → ${ds[i]}$`).join(', ')}, es decir, $${v}$` };
  }

  /* ---------- Resolver ---------- */
  function resolver(sc) {
    const { base, n, t, v, w } = lee(sc), neg = v < 0, m = Math.abs(v), sg = neg ? '−' : '';
    const bm = m.toString(2), bin = sg + grupos(bm), hexm = m.toString(16).toUpperCase(), hex = sg + hexm;
    const dig = String(m).split(''), bcd = sg + dig.map((d) => (+d).toString(2).padStart(4, '0')).join(' ');
    const min = -(2 ** (n - 1)), max = 2 ** (n - 1) - 1, cabe = v >= min && v <= max;
    const c2 = cabe ? (v < 0 ? v + 2 ** n : v).toString(2).padStart(n, '0') : null;
    const hexC2 = cabe && neg ? parseInt(c2, 2).toString(16).toUpperCase().padStart(n / 4, '0') : null;
    const rango = `de ${String(min).replace('-', '−')} a ${max}`;
    const pasos = [];

    pasos.push({ t: 'Número de partida', html: `El número es <b>${base === 'dec' ? sc.valor.trim() : t}</b> y está en ${BASES[base]}${base === 'c2' ? ` (${w} bits)` : ''}. Su valor decimal es $${String(v).replace('-', '−')}$.` });
    if (base !== 'dec') pasos.push(aDecimal(base, t, v, w));
    if (neg && base !== 'c2') pasos.push({ t: 'El signo', html: `Para pasar un número negativo a binario, hexadecimal o BCD se convierte su valor absoluto $${m}$ y se escribe el signo $−$ delante.` });

    if (base !== 'bin') {
      const filas = []; let q = m;
      if (q === 0) filas.push('$0 = 0_2$');
      else { while (q > 0) { filas.push(`$${q} ÷ 2 = ${Math.floor(q / 2)}$, resto $${q % 2}$`); q = Math.floor(q / 2); } }
      pasos.push({ t: 'A binario: divisiones entre 2', html: `Se divide $${m}$ entre 2 hasta llegar a 0 y se leen los restos de abajo arriba:<br>${filas.join('<br>')}<br>Resultado: $${m} = ${sub(grupos(bm), 'bin')}$` });
    }
    if (base !== 'hex') {
      const gs = grupos(bm).split(' ');
      pasos.push({ t: 'A hexadecimal: grupos de 4 bits', html: `Se agrupan los bits de 4 en 4 desde la derecha y cada grupo es una cifra hexadecimal: ${gs.map((g) => `$${g} → ${parseInt(g, 2).toString(16).toUpperCase()}$`).join(', ')}, es decir, $${sub(hexm, 'hex')}$` });
    }
    if (cabe) {
      if (!neg) pasos.push({ t: `Complemento a 2 con ${n} bits`, html: `Un número positivo se escribe igual que en binario, rellenando con ceros a la izquierda hasta ${n} bits: $${sub(grupos(c2), 'c2')}$` });
      else {
        const dir = m.toString(2).padStart(n, '0'), inv = [...dir].map((b) => (b === '1' ? '0' : '1')).join('');
        pasos.push({ t: `Complemento a 2 con ${n} bits`, html: `Para un negativo: se escribe $${m}$ en ${n} bits ($${grupos(dir)}$), se invierten los bits ($${grupos(inv)}$) y se suma 1 ($${grupos(c2)}$). Comprobación: $2^{${n}} − ${m} = ${2 ** n - m}$.` });
      }
    } else pasos.push({ t: `Complemento a 2 con ${n} bits`, html: `Con ${n} bits solo caben los números ${rango} ($−2^{${n - 1}}$ a $2^{${n - 1}} − 1$), y $${String(v).replace('-', '−')}$ queda fuera: hace falta subir el número de bits.` });
    if (base !== 'bcd') pasos.push({ t: 'A BCD: cada cifra decimal en 4 bits', html: `Se escribe cada dígito decimal con 4 bits (no se convierte el número entero): ${dig.map((d) => `$${d} → ${(+d).toString(2).padStart(4, '0')}$`).join(', ')}` });

    const filas = [
      { k: 'dec', t: 'Decimal', v: String(v).replace('-', '−') },
      { k: 'bin', t: 'Binario', v: bin },
      { k: 'c2', t: `Complemento a 2 (${n} bits)`, v: c2 ? grupos(c2) : `no cabe (rango ${rango})` },
      { k: 'hex', t: 'Hexadecimal', v: hex },
    ];
    if (hexC2) filas.push({ k: 'hexc2', t: `Hexadecimal del C2`, v: hexC2 });
    filas.push({ k: 'bcd', t: 'BCD', v: bcd });
    return { base, n, v, neg, m, bin, hex, bcd, c2, hexC2, cabe, rango, bm, filas, pasos };
  }

  const ejemplos = [
    { clave: 'negativo', nombre: 'Decimal −45 en 8 bits', sc: { base: 'dec', valor: '−45', bits: '8' } },
    { clave: 'binario', nombre: 'Binario 10110111 (no cabe en C2 de 8 bits)', sc: { base: 'bin', valor: '10110111', bits: '8' } },
    { clave: 'c2', nombre: 'Patrón C2 11101100', sc: { base: 'c2', valor: '11101100', bits: '8' } },
    { clave: 'hex', nombre: 'Hexadecimal 3F', sc: { base: 'hex', valor: '3F', bits: '8' } },
    { clave: 'bcd', nombre: 'BCD 1001 0111 0101 en 16 bits', sc: { base: 'bcd', valor: '100101110101', bits: '16' } },
  ];

  // un ejercicio al azar para el modo práctica: pasar a decimal desde bin, c2, hex o bcd
  const azar = () => {
    const base = ['bin', 'c2', 'hex', 'bcd'][Math.floor(Math.random() * 4)], r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    if (base === 'bin') return { base, valor: r(10, 250).toString(2), bits: '16' };
    if (base === 'c2') return { base, valor: r(0, 255).toString(2).padStart(8, '0'), bits: '8' };
    if (base === 'hex') return { base, valor: r(16, 4095).toString(16).toUpperCase(), bits: '16' };
    return { base, valor: String(r(10, 999)).split('').map((d) => (+d).toString(2).padStart(4, '0')).join(''), bits: '16' };
  };

  return { resolver, ejemplos, azar, BASES, BITS };
})();
if (typeof module !== 'undefined') module.exports = SistemasNumericos;
