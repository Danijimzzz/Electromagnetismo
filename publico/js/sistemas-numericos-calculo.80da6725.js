const SistemasNumericos = (() => {
  const BASES = { dec: 'decimal', bin: 'binario', c2: 'complemento a 2', oct: 'octal', hex: 'hexadecimal', bcd: 'BCD', gray: 'código Gray' };
  const SUB = { dec: '10', bin: '2', c2: 'C2', oct: '8', hex: '16', bcd: 'BCD', gray: 'Gray' };
  const BITS = [4, 8, 16, 32];
  const grupos = (b) => b.padStart(Math.ceil(b.length / 4) * 4, '0').replace(/(.{4})(?=.)/g, '$1 ');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const sub = (txt, base) => `${txt}_{${SUB[base]}}`;

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
    } else if (base === 'oct') {
      t = t.replace(/^0o/i, '');
      if (!/^[0-7]+$/.test(t)) throw new Error('En octal solo caben los dígitos del 0 al 7');
      if (t.length > 17) throw new Error('El número es demasiado grande (máximo 17 cifras octales)');
      v = parseInt(t, 8);
    } else if (base === 'hex') {
      t = t.replace(/^0x/i, '');
      if (!/^[0-9a-f]+$/i.test(t)) throw new Error('En hexadecimal solo caben los dígitos 0-9 y A-F');
      if (t.length > 13) throw new Error('El número es demasiado grande (máximo 13 cifras hexadecimales)');
      v = parseInt(t, 16);
    } else {
      t = t.replace(/^0b/i, '');
      if (!/^[01]+$/.test(t)) throw new Error(`En ${BASES[base]} solo caben los bits 0 y 1`);
      if (t.length > (base === 'bcd' ? 60 : 52)) throw new Error(`El número es demasiado grande (máximo ${base === 'bcd' ? '15 dígitos BCD' : '52 bits'})`);
      if (base === 'bin') v = parseInt(t, 2);
      else if (base === 'gray') { let b = 0, bin = ''; for (const g of t) { b ^= +g; bin += b; } v = parseInt(bin, 2); }
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

  function aDecimal(base, t, v, w) {
    if (base === 'bin' || base === 'c2') {
      const bs = [...t], L = bs.length, un = base === 'c2';
      const term = (b, i) => `${un && i === 0 ? '−' : ''}${b}·2^{${L - 1 - i}}`;
      let idx = bs.map((b, i) => [b, i]);
      let suma = idx.length > 12 ? idx.filter(([b]) => b === '1') : idx;
      const cuerpo = (suma.length ? suma : idx.slice(-1)).map(([b, i]) => term(b, i)).join(' + ').replace(/\+ −/g, '− ');
      return { t: `De ${BASES[base]} a decimal`, html: `Cada bit pesa una potencia de 2${un ? ', y el de la izquierda (el de signo) pesa en negativo' : ''}${idx.length > 12 ? ' (solo se escriben los bits a 1)' : ''}: $${sub(t, base)} = ${cuerpo} = ${String(v).replace('-', '−')}$` };
    }
    if (base === 'oct') {
      const cs = [...t], L = cs.length;
      return { t: 'De octal a decimal', html: `Cada cifra pesa una potencia de 8: $${sub(t, 'oct')} = ${cs.map((c, i) => `${c}·8^{${L - 1 - i}}`).join(' + ')} = ${v}$` };
    }
    if (base === 'gray') {
      let b = 0, bin = ''; for (const g of t) { b ^= +g; bin += b; }
      return { t: 'De Gray a binario y a decimal', html: `El primer bit se copia y cada bit siguiente del binario es el anterior del binario XOR el bit de Gray: ${[...t].map((g, i) => `$${i ? bin[i - 1] + ' ⊕ ' + g : g} = ${bin[i]}$`).join(', ')}. Queda $${sub(bin, 'bin')} = ${v}$.` };
    }
    if (base === 'hex') {
      const cs = [...t], L = cs.length;
      const cuerpo = cs.map((c, i) => `${parseInt(c, 16)}·16^{${L - 1 - i}}`).join(' + ');
      return { t: 'De hexadecimal a decimal', html: `Cada cifra pesa una potencia de 16 (A = 10, B = 11, C = 12, D = 13, E = 14, F = 15): $${sub(t.toUpperCase(), 'hex')} = ${cuerpo} = ${v}$` };
    }
    const gs = t.match(/.{4}/g), ds = gs.map((g) => parseInt(g, 2));
    return { t: 'De BCD a decimal', html: `Cada grupo de 4 bits es un dígito decimal: ${gs.map((g, i) => `$${g} → ${ds[i]}$`).join(', ')}, es decir, $${v}$` };
  }

  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const BASE_DEST = { 2: 'binario', 8: 'octal', 16: 'hexadecimal' };
  function leeRacional(txt) {
    let t = String(txt ?? '').trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(',', '.'), neg = false;
    if (!t) throw new Error('Escribe un número');
    if (t[0] === '-' || t[0] === '+') { neg = t[0] === '-'; t = t.slice(1); }
    let m = t.match(/^(\d{1,9})\/(\d{1,9})$/), p, q;
    if (m) { p = +m[1]; q = +m[2]; if (q === 0) throw new Error('El denominador no puede ser 0'); }
    else {
      m = t.match(/^(\d*)\.?(\d*)$/);
      if (!m || !(m[1] + m[2])) throw new Error('Escribe un decimal con coma (12,375) o una fracción (1/3)');
      if (m[1].length > 6 || m[2].length > 9) throw new Error('Demasiadas cifras: hasta 6 antes de la coma y 9 después');
      p = +(m[1] + m[2]); q = 10 ** m[2].length;
    }
    const g = gcd(p, q) || 1;
    return { p: p / g, q: q / g, neg };
  }
  const DIG = '0123456789ABCDEF';
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const potTxt = (z) => { if (z === 0) return '0'; const [m, e] = z.toExponential(2).split('e'); return `${m.replace('.', ',')}·10${String(+e).split('').map((c) => SUP[c]).join('')}`; };
  function fraccion(sc) {
    const b = +sc.dest || 2;
    if (!BASE_DEST[b]) throw new Error('Elige binario, octal o hexadecimal');
    const nom = BASE_DEST[b], bs = Math.log2(b);
    if (sc.dir === 'de') {   // de la base a decimal, exacto
      let t = String(sc.valor ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/^0[box]/i, '');
      if (!t) throw new Error('Escribe un número');
      const m = t.match(/^([0-9A-F]*)\.?([0-9A-F]*)$/i);
      if (!m || !(m[1] + m[2])) throw new Error(`Escribe un número en ${nom} con coma, por ejemplo ${b === 2 ? '101,011' : b === 8 ? '5,3' : 'A,8'}`);
      const malo = [...(m[1] + m[2])].find((c) => parseInt(c, 16) >= b);
      if (malo) throw new Error(`«${malo}» no es un dígito ${nom}${b === 2 ? ' (solo 0 y 1)' : b === 8 ? ' (del 0 al 7)' : ''}`);
      if (m[1].length > 12 || m[2].length > 24) throw new Error('Demasiadas cifras: hasta 12 antes de la coma y 24 después');
      const k = m[2].length;
      let Nb = 0n; for (const c of m[1] + m[2]) Nb = Nb * BigInt(b) + BigInt(parseInt(c, 16));
      const sh = bs * k, X = (Nb * 5n ** BigInt(sh)).toString().padStart(sh + 1, '0'), ent = sh ? X.slice(0, X.length - sh) : X, fr = sh ? X.slice(X.length - sh).replace(/0+$/, '') : '';
      const dec = ent + (fr ? ',' + fr : '');
      const terminos = [...(m[1])].map((c, i) => `${parseInt(c, 16)}·${b}^{${m[1].length - 1 - i}}`).concat([...(m[2])].map((c, i) => `${parseInt(c, 16)}·${b}^{−${i + 1}}`)).join(' + ');
      const pasos = [
        { t: 'Número de partida', html: `$${m[1] || '0'},${m[2] || '0'}_{${b}}$ en ${nom}: ${m[1].length} cifras enteras y ${k} fraccionarias.` },
        { t: 'Cada cifra por su peso', html: `Las cifras a la derecha de la coma pesan potencias negativas de ${b}: $${terminos}$` },
        { t: 'Resultado exacto', html: `$${m[1] || '0'},${m[2] || '0'}_{${b}} = ${dec}$. Como ${b} es potencia de 2, una fracción finita en ${nom} es siempre finita en decimal (con ${bs * k} cifras decimales como mucho).` },
      ];
      return { modo: 'fraccion', dir: 'de', dest: b, v: Number(`${ent}.${fr || '0'}`), texto: dec, filas: [{ k: 'dec', t: 'Decimal', v: dec }], pasos };
    }
    const { p, q, neg } = leeRacional(sc.valor), nd = vacio(sc.nf) ? 12 : Number(sc.nf);
    if (!Number.isInteger(nd) || nd < 1 || nd > 32) throw new Error('Los dígitos tras la coma deben ser un entero de 1 a 32');
    const ip = Math.floor(p / q); let r = p % q;
    const vistos = new Map(), digs = [], filas = []; let ini = -1;
    while (r !== 0 && digs.length < 400) {
      if (vistos.has(r)) { ini = vistos.get(r); break; }
      vistos.set(r, digs.length);
      const prod = r * b, d = Math.floor(prod / q), rn = prod % q;
      if (filas.length < 12) filas.push(`$${r}/${q} · ${b} = ${prod}/${q}$ → dígito $${DIG[d]}$, queda $${rn}/${q}$`);
      digs.push(DIG[d]); r = rn;
    }
    const periodico = ini >= 0, pre = periodico ? digs.slice(0, ini).join('') : digs.join(''), per = periodico ? digs.slice(ini).join('') : '';
    const sg = neg ? '−' : '', ent = ip.toString(b).toUpperCase();
    const texto = `${sg}${ent}${pre || per ? ',' : ''}${pre}${periodico ? `(${per})` : ''}`;
    const exacto = !periodico && digs.length <= 400;
    let largo = pre; while (largo.length < nd && per) largo += per; const corte = [...(periodico ? largo : digs.join(''))].slice(0, nd); let aprox = ip; corte.forEach((c, i) => { aprox += parseInt(c, 16) / b ** (i + 1); });
    const exactoV = p / q, err = (neg ? -1 : 1) * (aprox - exactoV);
    const pasos = [
      { t: 'El número', html: `$${sg}${p}/${q}$ ${q === 1 ? '(entero)' : `= ${sg}${String(exactoV).replace('.', ',')}`}; parte entera $${ip}$ y parte fraccionaria $${p % q}/${q}$.` },
      { t: 'Parte entera', html: `$${ip} = ${ent}_{${b}}$ (divisiones sucesivas entre ${b}).` },
    ];
    if (digs.length) pasos.push({ t: `Parte fraccionaria: multiplicar por ${b}`, html: `Se multiplica la fracción por ${b}, la parte entera es el siguiente dígito y se sigue con lo que queda (el resto se guarda como fracción exacta):<br>${filas.join('<br>')}${digs.length > 12 ? '<br>…' : ''}` });
    pasos.push({ t: 'Resultado', html: periodico ? `El resto vuelve a repetirse (${[...vistos.keys()][ini]}/${q}), así que la expansión es <b>periódica</b>: $${texto}_{${b}}$, con paréntesis el grupo que se repite (periodo de ${per.length} ${per.length === 1 ? 'dígito' : 'dígitos'}).` : `La expansión termina: $${texto}_{${b}}$ (${digs.length} ${digs.length === 1 ? 'dígito' : 'dígitos'} tras la coma).` });
    if (periodico || digs.length > nd) pasos.push({ t: `Con ${nd} dígitos tras la coma`, html: `Si solo se guardan ${nd} dígitos (truncando) el valor es $${String(+aprox.toPrecision(12)).replace('.', ',')}$ en vez de $${String(+exactoV.toPrecision(12)).replace('.', ',')}$: error de $${(err < 0 ? '−' : '') + Math.abs(err).toExponential(2).replace('.', ',').replace(/e([+-]?)(\d+)/, '·10^{$1$2}').replace('{-', '{−').replace('{+', '{')}$. Por eso 0,1 no se guarda exacto en una máquina binaria.` });
    filas.length = 0;
    const filasR = [{ k: 'dec', t: nom[0].toUpperCase() + nom.slice(1), v: texto }, { k: 'tipo', t: 'Tipo de expansión', v: periodico ? `periódica (periodo ${per.length})` : 'finita' }];
    if (periodico || digs.length > nd) filasR.push({ k: 'err', t: `Error al truncar a ${nd} dígitos`, v: `${err < 0 ? '−' : ''}${potTxt(Math.abs(err))}` });
    return { modo: 'fraccion', dir: 'a', dest: b, v: (neg ? -1 : 1) * exactoV, texto, periodico, pre, per, ent, exacto, err, filas: filasR, pasos };
  }

  function ieee(sc) {
    const n = +sc.prec === 64 ? 64 : 32, E = n === 64 ? 11 : 8, M = n === 64 ? 52 : 23, sesgo = 2 ** (E - 1) - 1;
    const dv = new DataView(new ArrayBuffer(8));
    let t = String(sc.valor ?? '').trim().replace(/\s|_/g, '').replace(/[−–]/g, '-').replace(',', '.'), desde = null;
    if (!t) throw new Error('Escribe un número decimal (0,1; −118,625; 1e-5) o un patrón en hexadecimal (0x40490FDB)');
    let x;
    if (/^0x[0-9a-f]+$/i.test(t)) {
      const h = t.slice(2); if (h.length !== n / 4) throw new Error(`Un patrón de ${n} bits tiene ${n / 4} cifras hexadecimales (0x…)`);
      for (let i = 0; i < n / 8; i++) dv.setUint8(i, parseInt(h.slice(2 * i, 2 * i + 2), 16));
      x = n === 64 ? dv.getFloat64(0) : dv.getFloat32(0); desde = 'hex';
    } else {
      if (/^[+-]?inf(inity)?$/i.test(t)) x = t[0] === '-' ? -Infinity : Infinity;
      else if (/^nan$/i.test(t)) x = NaN;
      else if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) x = Number(t);
      else throw new Error('No entiendo el número: escribe un decimal (0,1; −118,625; 1e-5), inf, nan o un patrón 0x…');
      if (n === 64) dv.setFloat64(0, x); else dv.setFloat32(0, x);
      desde = 'dec';
    }
    const bytes = []; for (let i = 0; i < n / 8; i++) bytes.push(dv.getUint8(i).toString(2).padStart(8, '0'));
    const bits = bytes.join(''), sg = bits[0], ex = bits.slice(1, 1 + E), ma = bits.slice(1 + E), eBias = parseInt(ex, 2), tope = 2 ** E - 1;
    const guardado = n === 64 ? dv.getFloat64(0) : dv.getFloat32(0), hex = '0x' + bytes.map((b) => parseInt(b, 2).toString(16).toUpperCase().padStart(2, '0')).join('');
    const clase = eBias === tope ? (/1/.test(ma) ? 'NaN (no es un número)' : (sg === '1' ? '−∞' : '+∞')) : eBias === 0 ? (/1/.test(ma) ? 'subnormal (denormal)' : (sg === '1' ? '−0' : '+0')) : 'normal';
    const fmt = (z) => (Number.isFinite(z) ? String(+z.toPrecision(n === 64 ? 17 : 9)).replace('.', ',').replace('-', '−') : Number.isNaN(z) ? 'NaN' : (z < 0 ? '−∞' : '∞'));
    const pasos = [
      { t: `Formato de ${n} bits`, html: `1 bit de signo, ${E} de exponente (sesgo $2^{${E - 1}} − 1 = ${sesgo}$) y ${M} de mantisa: $${n} = 1 + ${E} + ${M}$.` },
    ];
    const fin = Number.isFinite(guardado);
    if (desde === 'dec' && fin && guardado !== 0) {
      const a = Math.abs(x); let e = Math.floor(Math.log2(a)); if (2 ** e > a) e--; if (2 ** (e + 1) <= a) e++;
      const ee = Math.max(e, 1 - sesgo);
      pasos.push({ t: 'Signo', html: `El número es ${x < 0 ? 'negativo: bit de signo 1' : 'positivo: bit de signo 0'}.` });
      if (e >= 1 - sesgo) pasos.push({ t: 'Normalizar', html: `$|x| = ${fmt(a)} = 1,f · 2^{${e}}$ con $1,f = ${fmt(a / 2 ** e)}$ (la mantisa normalizada está entre 1 y 2).` }, { t: 'Exponente sesgado', html: `$E = e + ${sesgo} = ${e} + ${sesgo} = ${e + sesgo}$, que en ${E} bits es $${ex}$.` }, { t: 'Mantisa', html: `Se guardan los ${M} bits tras la coma de $1,f$ (el 1 inicial está implícito): $${ma}$. Se redondea al más cercano; lo que no cabe se pierde.` });
      else pasos.push({ t: 'Número subnormal', html: `Es más pequeño que el menor normal ($2^{${1 - sesgo}}$): el exponente se guarda como 0 y la mantisa no lleva el 1 implícito, $|x| = 0,f · 2^{${1 - sesgo}}$, con $f$ = $${ma}$.` });
      const errAbs = guardado - x;
      pasos.push({ t: 'Valor realmente guardado', html: `El valor guardado es $${fmt(guardado)}$ y el pedido era $${fmt(x)}$: error $${errAbs === 0 ? '0 (exacto)' : (errAbs < 0 ? '−' : '') + Math.abs(errAbs).toExponential(2).replace('.', ',').replace(/e([+-]?)(\d+)/, '·10^{$1$2}').replace('{-', '{−').replace('{+', '{')}$, que es como mucho medio ULP: ${n === 32 ? '≈ 6·10^{−8}' : '≈ 1,1·10^{−16}'} en relación con el valor.` });
      void ee;
    } else if (desde === 'hex' || !fin || guardado === 0) {
      pasos.push({ t: 'Campos', html: `Signo $${sg}$, exponente $${ex}$ ($E = ${eBias}$) y mantisa $${ma}$. Es un número <b>${clase}</b>.` });
      if (clase === 'normal') pasos.push({ t: 'Valor', html: `$(−1)^{${sg}} · 1,f · 2^{E − ${sesgo}} = ${sg === '1' ? '−' : ''}1,f · 2^{${eBias - sesgo}} = ${fmt(guardado)}$.` });
    }
    const filas = [
      { k: 'dec', t: 'Valor guardado', v: fmt(guardado) },
      { k: 'sg', t: 'Signo', v: sg },
      { k: 'ex', t: `Exponente (${E} bits)`, v: `${ex} (E = ${eBias}${eBias > 0 && eBias < tope ? `, e = ${eBias - sesgo}` : ''})` },
      { k: 'ma', t: `Mantisa (${M} bits)`, v: ma },
      { k: 'hex', t: 'Hexadecimal', v: hex },
      { k: 'clase', t: 'Clase', v: clase },
    ];
    return { modo: 'ieee', n, E, M, v: guardado, signo: sg, exponente: ex, mantisa: ma, hex, clase, bits, filas, pasos };
  }

  function aritmetica(sc) {
    const w = +sc.bits || 8; if (!BITS.includes(w)) throw new Error('El número de bits debe ser 4, 8, 16 o 32');
    const op = sc.op === '-' ? '-' : '+', min = -(2 ** (w - 1)), max = 2 ** (w - 1) - 1;
    const leeOp = (k, nom) => { const t = String(sc[k] ?? '').trim().replace(/[−–]/g, '-'); if (!/^[+-]?\d+$/.test(t)) throw new Error(`${nom} debe ser un entero decimal`); const v = +t; if (v < min || v > max) throw new Error(`${nom} = ${String(v).replace('-', '−')} no cabe en ${w} bits (de ${String(min).replace('-', '−')} a ${max}): sube el número de bits`); return v; };
    const a = leeOp('a', 'El primer número'), b = leeOp('b', 'El segundo número'), M = 2 ** w;
    const pat = (v) => (v < 0 ? v + M : v).toString(2).padStart(w, '0');
    const pa = pat(a), pb = pat(b);
    const pb2 = op === '-' ? ((M - (b < 0 ? b + M : b)) % M).toString(2).padStart(w, '0') : pb;
    const acarreos = Array(w + 1).fill(0), suma = Array(w).fill(0);
    for (let i = w - 1; i >= 0; i--) { const s = +pa[i] + +pb2[i] + acarreos[i + 1]; suma[i] = s % 2; acarreos[i] = s >= 2 ? 1 : 0; }
    const res = suma.join(''), vr = parseInt(res, 2) - (res[0] === '1' ? M : 0), vt = op === '+' ? a + b : a - b, sale = acarreos[0], entraMSB = acarreos[1];
    const desborda = vt < min || vt > max, grupo = (z) => (w > 8 ? z.replace(/(.{4})(?=.)/g, '$1 ') : z);
    const linea = (etq, z) => `<code>${etq.padEnd(11, ' ').replace(/ /g, '&nbsp;')}${grupo(z)}</code>`;
    const sig = (v) => String(v).replace('-', '−');
    const pasos = [
      { t: 'Los operandos en complemento a 2', html: `Con ${w} bits caben los números de $${sig(min)}$ a $${max}$. $${sig(a)} → ${grupo(pa)}$ y $${sig(b)} → ${grupo(pb)}$.` },
    ];
    if (op === '-') pasos.push({ t: 'La resta es una suma', html: `$a − b = a + (−b)$: se niega $b$ invirtiendo sus bits y sumando 1. $${grupo(pb)} → ${grupo([...pb].map((x) => (x === '1' ? '0' : '1')).join(''))} + 1 = ${grupo(pb2)}$${b === min ? ' (para el valor más negativo, $−b$ no cabe y vuelve a salir el mismo patrón)' : ''}.` });
    pasos.push({ t: 'Suma bit a bit', html: `Se suma de derecha a izquierda; la fila de acarreos muestra el que se lleva a la columna siguiente:<br>${linea('acarreo', [...acarreos.slice(1)].join('') )}<br>${linea('', pa)}<br>${linea(op === '-' ? '+ (−b)' : '+', pb2)}<br>${linea('resultado', res)}` });
    pasos.push({ t: 'Resultado', html: `El patrón $${grupo(res)}_{C2}$ vale $${sig(vr)}$. ${desborda ? `Pero la suma verdadera es $${sig(a)} ${op === '+' ? '+' : '−'} ${b < 0 ? '(' + sig(b) + ')' : b} = ${sig(vt)}$, que no cabe: hay <b>desbordamiento</b> y el resultado es incorrecto.` : `Coincide con $${sig(a)} ${op === '+' ? '+' : '−'} ${b < 0 ? '(' + sig(b) + ')' : b} = ${sig(vt)}$: no hay desbordamiento.`}` });
    pasos.push({ t: 'Cómo detectar el desbordamiento', html: `En complemento a 2 hay desbordamiento cuando el acarreo que <b>entra</b> en el bit de signo (${entraMSB}) es distinto del que <b>sale</b> de él (${sale}): aquí ${entraMSB !== sale ? 'son distintos' : 'son iguales'}. También ocurre si se suman dos positivos y sale negativo, o dos negativos y sale positivo. El acarreo de salida (${sale}) solo indica desbordamiento si los patrones se interpretan sin signo.` });
    const filas = [
      { k: 'dec', t: 'Resultado (con signo)', v: sig(vr) },
      { k: 'pat', t: `Patrón de ${w} bits`, v: grupo(res) },
      { k: 'verd', t: 'Resultado verdadero', v: sig(vt) },
      { k: 'des', t: 'Desbordamiento', v: desborda ? 'sí' : 'no' },
      { k: 'acs', t: 'Acarreo de salida (sin signo)', v: String(sale) },
    ];
    return { modo: 'aritmetica', v: vr, vt, patron: res, desborda, acarreoSalida: sale, acarreoEntrada: entraMSB, w, filas, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'fraccion') return fraccion(sc);
    if (sc.modo === 'ieee') return ieee(sc);
    if (sc.modo === 'aritmetica') return aritmetica(sc);
    const { base, n, t, v, w } = lee(sc), neg = v < 0, m = Math.abs(v), sg = neg ? '−' : '';
    const bm = m.toString(2), bin = sg + grupos(bm), hexm = m.toString(16).toUpperCase(), hex = sg + hexm, octm = m.toString(8), gray = sg + (BigInt(m) ^ (BigInt(m) >> 1n)).toString(2);
    const dig = String(m).split(''), bcd = sg + dig.map((d) => (+d).toString(2).padStart(4, '0')).join(' ');
    const min = -(2 ** (n - 1)), max = 2 ** (n - 1) - 1, cabe = v >= min && v <= max;
    const c2 = cabe ? (v < 0 ? v + 2 ** n : v).toString(2).padStart(n, '0') : null;
    const hexC2 = cabe && neg ? parseInt(c2, 2).toString(16).toUpperCase().padStart(n / 4, '0') : null;
    const rango = `de ${String(min).replace('-', '−')} a ${max}`;
    const pasos = [];

    pasos.push({ t: 'Número de partida', html: `El número es <b>${base === 'dec' ? String(sc.valor).trim() : t}</b> y está en ${BASES[base]}${base === 'c2' ? ` (${w} bits)` : ''}. Su valor decimal es $${String(v).replace('-', '−')}$.` });
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
    if (base !== 'oct') {
      const bo = bm.padStart(Math.ceil(bm.length / 3) * 3, '0'), gs = bo.match(/.{3}/g);
      pasos.push({ t: 'A octal: grupos de 3 bits', html: `Se agrupan los bits de 3 en 3 desde la derecha: ${gs.map((g) => `$${g} → ${parseInt(g, 2)}$`).join(', ')}, es decir, $${sub(octm, 'oct')}$` });
    }
    if (base !== 'gray') {
      const gr = (BigInt(m) ^ (BigInt(m) >> 1n)).toString(2).padStart(bm.length, '0');
      pasos.push({ t: 'A código Gray', html: `Cada bit de Gray es el bit del binario XOR el bit de su izquierda (el primero se copia): $${bm} → ${gr}$. Entre un número y el siguiente solo cambia un bit.` });
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
      { k: 'oct', t: 'Octal', v: sg + octm },
      { k: 'hex', t: 'Hexadecimal', v: hex },
    ];
    if (hexC2) filas.push({ k: 'hexc2', t: `Hexadecimal del C2`, v: hexC2 });
    filas.push({ k: 'bcd', t: 'BCD', v: bcd }, { k: 'gray', t: 'Código Gray', v: gray });
    return { base, n, v, neg, m, bin, hex, oct: sg + octm, gray, bcd, c2, hexC2, cabe, rango, bm, filas, pasos };
  }

  const ejemplos = [
    { clave: 'negativo', nombre: 'Decimal −45 en 8 bits', sc: { base: 'dec', valor: '−45', bits: '8' } },
    { clave: 'binario', nombre: 'Binario 10110111 (no cabe en C2 de 8 bits)', sc: { base: 'bin', valor: '10110111', bits: '8' } },
    { clave: 'c2', nombre: 'Patrón C2 11101100', sc: { base: 'c2', valor: '11101100', bits: '8' } },
    { clave: 'hex', nombre: 'Hexadecimal 3F', sc: { base: 'hex', valor: '3F', bits: '8' } },
    { clave: 'bcd', nombre: 'BCD 1001 0111 0101 en 16 bits', sc: { base: 'bcd', valor: '100101110101', bits: '16' } },
    { clave: 'octal', nombre: 'Octal 755 (permisos de un archivo)', sc: { base: 'oct', valor: '755', bits: '16' } },
    { clave: 'gray', nombre: 'Gray 1101', sc: { base: 'gray', valor: '1101', bits: '8' } },
    { clave: 'fraccion-01', nombre: '0,1 en binario: periódico', sc: { modo: 'fraccion', dir: 'a', valor: '0,1', dest: '2', nf: '12', bits: '8' } },
    { clave: 'fraccion-hex', nombre: '13,625 en binario y hexadecimal', sc: { modo: 'fraccion', dir: 'a', valor: '13,625', dest: '2', nf: '12', bits: '8' } },
    { clave: 'fraccion-de', nombre: '101,011 binario a decimal', sc: { modo: 'fraccion', dir: 'de', valor: '101,011', dest: '2', nf: '12', bits: '8' } },
    { clave: 'ieee-01', nombre: 'IEEE 754: 0,1 en 32 bits', sc: { modo: 'ieee', valor: '0,1', prec: '32', bits: '8' } },
    { clave: 'ieee-hex', nombre: 'IEEE 754: patrón 0x40490FDB (π)', sc: { modo: 'ieee', valor: '0x40490FDB', prec: '32', bits: '8' } },
    { clave: 'suma-desborda', nombre: 'Suma 100 + 50 con 8 bits: desbordamiento', sc: { modo: 'aritmetica', a: '100', b: '50', op: '+', bits: '8' } },
    { clave: 'resta-c2', nombre: 'Resta 25 − 60 con 8 bits', sc: { modo: 'aritmetica', a: '25', b: '60', op: '-', bits: '8' } },
  ];

  const azar = () => {
    const base = ['bin', 'c2', 'hex', 'bcd'][Math.floor(Math.random() * 4)], r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    if (base === 'bin') return { base, valor: r(10, 250).toString(2), bits: '16' };
    if (base === 'c2') return { base, valor: r(0, 255).toString(2).padStart(8, '0'), bits: '8' };
    if (base === 'hex') return { base, valor: r(16, 4095).toString(16).toUpperCase(), bits: '16' };
    return { base, valor: String(r(10, 999)).split('').map((d) => (+d).toString(2).padStart(4, '0')).join(''), bits: '16' };
  };

  return { resolver, ejemplos, azar, BASES, BITS, BASE_DEST };
})();

