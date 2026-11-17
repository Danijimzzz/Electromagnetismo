const SistemasNumericos = (() => {
  const BASES = { dec: 'decimal', bin: 'binario', c2: 'complemento a 2', oct: 'octal', hex: 'hexadecimal', bcd: 'BCD', gray: 'Gray code' };
  const SUB = { dec: '10', bin: '2', c2: 'C2', oct: '8', hex: '16', bcd: 'BCD', gray: 'Gray' };
  const BITS = [4, 8, 16, 32];
  const grupos = (b) => b.padStart(Math.ceil(b.length / 4) * 4, '0').replace(/(.{4})(?=.)/g, '$1 ');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const sub = (txt, base) => `${txt}_{${SUB[base]}}`;

  function lee(sc) {
    const base = BASES[sc.base] ? sc.base : 'dec', n = +sc.bits || 8;
    if (!BITS.includes(n)) throw new Error('The number of bits must be 4, 8, 16 or 32');
    let t = String(sc.valor ?? '').trim().replace(/[\s_]/g, '').replace(/[−–]/g, '-');
    if (!t) throw new Error('Enter a number');
    let v, w = 0;
    if (base === 'dec') {
      if (!/^[+-]?\d+$/.test(t)) throw new Error('In decimal only the digits 0 to 9 are allowed, with − in front if negative (there are no decimals here)');
      if (t.replace(/^[+-]/, '').length > 15) throw new Error('The number is too large (maximum 15 digits)');
      v = +t;
    } else if (base === 'oct') {
      t = t.replace(/^0o/i, '');
      if (!/^[0-7]+$/.test(t)) throw new Error('In octal only the digits 0 to 7 are allowed');
      if (t.length > 17) throw new Error('The number is too large (maximum 17 octal digits)');
      v = parseInt(t, 8);
    } else if (base === 'hex') {
      t = t.replace(/^0x/i, '');
      if (!/^[0-9a-f]+$/i.test(t)) throw new Error('In hexadecimal only the digits 0-9 and A-F are allowed');
      if (t.length > 13) throw new Error('The number is too large (maximum 13 hexadecimal digits)');
      v = parseInt(t, 16);
    } else {
      t = t.replace(/^0b/i, '');
      if (!/^[01]+$/.test(t)) throw new Error(`In ${BASES[base]} only the bits 0 and 1 are allowed`);
      if (t.length > (base === 'bcd' ? 60 : 52)) throw new Error(`The number is too large (maximum ${base === 'bcd' ? '15 BCD digits' : '52 bits'})`);
      if (base === 'bin') v = parseInt(t, 2);
      else if (base === 'gray') { let b = 0, bin = ''; for (const g of t) { b ^= +g; bin += b; } v = parseInt(bin, 2); }
      else if (base === 'c2') {
        if (t.length > n) throw new Error(`The pattern has ${t.length} bits and only ${n} fit: increase the number of bits`);
        w = t.length; v = parseInt(t, 2) - (t[0] === '1' ? 2 ** w : 0);
      } else {
        t = t.padStart(Math.ceil(t.length / 4) * 4, '0');
        const ds = t.match(/.{4}/g).map((g) => parseInt(g, 2)), mal = ds.findIndex((d) => d > 9);
        if (mal >= 0) throw new Error(`The group ${t.slice(4 * mal, 4 * mal + 4)} is not a BCD digit (only 0000 to 1001 are valid)`);
        if (ds.length > 15) throw new Error('The number is too large (maximum 15 BCD digits)');
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
      return { t: `De ${BASES[base]} a decimal`, html: `Each bit weighs a power of 2${un ? ', and the leftmost one (the sign bit) weighs negatively' : ''}${idx.length > 12 ? ' (only the bits set to 1 are written)' : ''}: $${sub(t, base)} = ${cuerpo} = ${String(v).replace('-', '−')}$` };
    }
    if (base === 'oct') {
      const cs = [...t], L = cs.length;
      return { t: 'De octal a decimal', html: `Each digit weighs a power of 8: $${sub(t, 'oct')} = ${cs.map((c, i) => `${c}·8^{${L - 1 - i}}`).join(' + ')} = ${v}$` };
    }
    if (base === 'gray') {
      let b = 0, bin = ''; for (const g of t) { b ^= +g; bin += b; }
      return { t: 'From Gray to binary and to decimal', html: `The first bit is copied and each following binary bit is the previous binary bit XOR the Gray bit: ${[...t].map((g, i) => `$${i ? bin[i - 1] + ' ⊕ ' + g : g} = ${bin[i]}$`).join(', ')}. This gives $${sub(bin, 'bin')} = ${v}$.` };
    }
    if (base === 'hex') {
      const cs = [...t], L = cs.length;
      const cuerpo = cs.map((c, i) => `${parseInt(c, 16)}·16^{${L - 1 - i}}`).join(' + ');
      return { t: 'De hexadecimal a decimal', html: `Each digit weighs a power of 16 (A = 10, B = 11, C = 12, D = 13, E = 14, F = 15): $${sub(t.toUpperCase(), 'hex')} = ${cuerpo} = ${v}$` };
    }
    const gs = t.match(/.{4}/g), ds = gs.map((g) => parseInt(g, 2));
    return { t: 'De BCD a decimal', html: `Each group of 4 bits is a decimal digit: ${gs.map((g, i) => `$${g} → ${ds[i]}$`).join(', ')}, that is, $${v}$` };
  }

  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const BASE_DEST = { 2: 'binario', 8: 'octal', 16: 'hexadecimal' };
  function leeRacional(txt) {
    let t = String(txt ?? '').trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(',', '.'), neg = false;
    if (!t) throw new Error('Enter a number');
    if (t[0] === '-' || t[0] === '+') { neg = t[0] === '-'; t = t.slice(1); }
    let m = t.match(/^(\d{1,9})\/(\d{1,9})$/), p, q;
    if (m) { p = +m[1]; q = +m[2]; if (q === 0) throw new Error('The denominator cannot be 0'); }
    else {
      m = t.match(/^(\d*)\.?(\d*)$/);
      if (!m || !(m[1] + m[2])) throw new Error('Enter a decimal with a point (12.375) or a fraction (1/3)');
      if (m[1].length > 6 || m[2].length > 9) throw new Error('Too many digits: up to 6 before the point and 9 after');
      p = +(m[1] + m[2]); q = 10 ** m[2].length;
    }
    const g = gcd(p, q) || 1;
    return { p: p / g, q: q / g, neg };
  }
  const DIG = '0123456789ABCDEF';
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const potTxt = (z) => { if (z === 0) return '0'; const [m, e] = z.toExponential(2).split('e'); return `${m.replace('.', '.')}·10${String(+e).split('').map((c) => SUP[c]).join('')}`; };
  function fraccion(sc) {
    const b = +sc.dest || 2;
    if (!BASE_DEST[b]) throw new Error('Choose binary, octal or hexadecimal');
    const nom = BASE_DEST[b], bs = Math.log2(b);
    if (sc.dir === 'de') {   // de la base a decimal, exacto
      let t = String(sc.valor ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/^0[box]/i, '');
      if (!t) throw new Error('Enter a number');
      const m = t.match(/^([0-9A-F]*)\.?([0-9A-F]*)$/i);
      if (!m || !(m[1] + m[2])) throw new Error(`Enter a number in ${nom} with a point, for example ${b === 2 ? '101.011' : b === 8 ? '5.3' : 'A.8'}`);
      const malo = [...(m[1] + m[2])].find((c) => parseInt(c, 16) >= b);
      if (malo) throw new Error(`“${malo}” is not a ${nom} digit${b === 2 ? ' (only 0 and 1)' : b === 8 ? ' (0 to 7)' : ''}`);
      if (m[1].length > 12 || m[2].length > 24) throw new Error('Too many digits: up to 12 before the point and 24 after');
      const k = m[2].length;
      let Nb = 0n; for (const c of m[1] + m[2]) Nb = Nb * BigInt(b) + BigInt(parseInt(c, 16));
      const sh = bs * k, X = (Nb * 5n ** BigInt(sh)).toString().padStart(sh + 1, '0'), ent = sh ? X.slice(0, X.length - sh) : X, fr = sh ? X.slice(X.length - sh).replace(/0+$/, '') : '';
      const dec = ent + (fr ? ',' + fr : '');
      const terminos = [...(m[1])].map((c, i) => `${parseInt(c, 16)}·${b}^{${m[1].length - 1 - i}}`).concat([...(m[2])].map((c, i) => `${parseInt(c, 16)}·${b}^{−${i + 1}}`)).join(' + ');
      const pasos = [
        { t: 'Starting number', html: `$${m[1] || '0'}.${m[2] || '0'}_{${b}}$ in ${nom}: ${m[1].length} integer digits and ${k} fractional digits.` },
        { t: 'Each digit times its weight', html: `The digits to the right of the point weigh negative powers of ${b}: $${terminos}$` },
        { t: 'Exact result', html: `$${m[1] || '0'}.${m[2] || '0'}_{${b}} = ${dec}$. Since ${b} is a power of 2, a finite fraction in ${nom} is always finite in decimal (with at most ${bs * k} decimal digits).` },
      ];
      return { modo: 'fraccion', dir: 'de', dest: b, v: Number(`${ent}.${fr || '0'}`), texto: dec, filas: [{ k: 'dec', t: 'Decimal', v: dec }], pasos };
    }
    const { p, q, neg } = leeRacional(sc.valor), nd = vacio(sc.nf) ? 12 : Number(sc.nf);
    if (!Number.isInteger(nd) || nd < 1 || nd > 32) throw new Error('The digits after the point must be an integer from 1 to 32');
    const ip = Math.floor(p / q); let r = p % q;
    const vistos = new Map(), digs = [], filas = []; let ini = -1;
    while (r !== 0 && digs.length < 400) {
      if (vistos.has(r)) { ini = vistos.get(r); break; }
      vistos.set(r, digs.length);
      const prod = r * b, d = Math.floor(prod / q), rn = prod % q;
      if (filas.length < 12) filas.push(`$${r}/${q} · ${b} = ${prod}/${q}$ → digit $${DIG[d]}$, leaving $${rn}/${q}$`);
      digs.push(DIG[d]); r = rn;
    }
    const periodico = ini >= 0, pre = periodico ? digs.slice(0, ini).join('') : digs.join(''), per = periodico ? digs.slice(ini).join('') : '';
    const sg = neg ? '−' : '', ent = ip.toString(b).toUpperCase();
    const texto = `${sg}${ent}${pre || per ? ',' : ''}${pre}${periodico ? `(${per})` : ''}`;
    const exacto = !periodico && digs.length <= 400;
    let largo = pre; while (largo.length < nd && per) largo += per; const corte = [...(periodico ? largo : digs.join(''))].slice(0, nd); let aprox = ip; corte.forEach((c, i) => { aprox += parseInt(c, 16) / b ** (i + 1); });
    const exactoV = p / q, err = (neg ? -1 : 1) * (aprox - exactoV);
    const pasos = [
      { t: 'The number', html: `$${sg}${p}/${q}$ ${q === 1 ? '(integer)' : `= ${sg}${String(exactoV).replace('.', '.')}`}; integer part $${ip}$ and fractional part $${p % q}/${q}$.` },
      { t: 'Integer part', html: `$${ip} = ${ent}_{${b}}$ (successive divisions by ${b}).` },
    ];
    if (digs.length) pasos.push({ t: `Fractional part: multiply by ${b}`, html: `The fraction is multiplied by ${b}, the integer part is the next digit and you continue with what is left (the remainder is kept as an exact fraction):<br>${filas.join('<br>')}${digs.length > 12 ? '<br>…' : ''}` });
    pasos.push({ t: 'Result', html: periodico ? `The remainder repeats again (${[...vistos.keys()][ini]}/${q}), so the expansion is <b>periodic</b>: $${texto}_{${b}}$, with the repeating group in parentheses (period of ${per.length} ${per.length === 1 ? 'digit' : 'digits'}).` : `The expansion terminates: $${texto}_{${b}}$ (${digs.length} ${digs.length === 1 ? 'digit' : 'digits'} after the point).` });
    if (periodico || digs.length > nd) pasos.push({ t: `With ${nd} digits after the point`, html: `If only ${nd} digits are stored (truncating) the value is $${String(+aprox.toPrecision(12)).replace('.', '.')}$ instead of $${String(+exactoV.toPrecision(12)).replace('.', '.')}$: error of $${(err < 0 ? '−' : '') + Math.abs(err).toExponential(2).replace('.', '.').replace(/e([+-]?)(\d+)/, '·10^{$1$2}').replace('{-', '{−').replace('{+', '{')}$. That is why 0.1 is not stored exactly on a binary machine.` });
    filas.length = 0;
    const filasR = [{ k: 'dec', t: nom[0].toUpperCase() + nom.slice(1), v: texto }, { k: 'tipo', t: 'Type of expansion', v: periodico ? `periodic (period ${per.length})` : 'finita' }];
    if (periodico || digs.length > nd) filasR.push({ k: 'err', t: `Error when truncating to ${nd} digits`, v: `${err < 0 ? '−' : ''}${potTxt(Math.abs(err))}` });
    return { modo: 'fraccion', dir: 'a', dest: b, v: (neg ? -1 : 1) * exactoV, texto, periodico, pre, per, ent, exacto, err, filas: filasR, pasos };
  }

  function ieee(sc) {
    const n = +sc.prec === 64 ? 64 : 32, E = n === 64 ? 11 : 8, M = n === 64 ? 52 : 23, sesgo = 2 ** (E - 1) - 1;
    const dv = new DataView(new ArrayBuffer(8));
    let t = String(sc.valor ?? '').trim().replace(/\s|_/g, '').replace(/[−–]/g, '-').replace(',', '.'), desde = null;
    if (!t) throw new Error('Enter a decimal number (0.1; −118.625; 1e-5) or a hexadecimal pattern (0x40490FDB)');
    let x;
    if (/^0x[0-9a-f]+$/i.test(t)) {
      const h = t.slice(2); if (h.length !== n / 4) throw new Error(`A ${n}-bit pattern has ${n / 4} hexadecimal digits (0x…)`);
      for (let i = 0; i < n / 8; i++) dv.setUint8(i, parseInt(h.slice(2 * i, 2 * i + 2), 16));
      x = n === 64 ? dv.getFloat64(0) : dv.getFloat32(0); desde = 'hex';
    } else {
      if (/^[+-]?inf(inity)?$/i.test(t)) x = t[0] === '-' ? -Infinity : Infinity;
      else if (/^nan$/i.test(t)) x = NaN;
      else if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) x = Number(t);
      else throw new Error('I don\'t understand the number: enter a decimal (0.1; −118.625; 1e-5), inf, nan or a 0x… pattern');
      if (n === 64) dv.setFloat64(0, x); else dv.setFloat32(0, x);
      desde = 'dec';
    }
    const bytes = []; for (let i = 0; i < n / 8; i++) bytes.push(dv.getUint8(i).toString(2).padStart(8, '0'));
    const bits = bytes.join(''), sg = bits[0], ex = bits.slice(1, 1 + E), ma = bits.slice(1 + E), eBias = parseInt(ex, 2), tope = 2 ** E - 1;
    const guardado = n === 64 ? dv.getFloat64(0) : dv.getFloat32(0), hex = '0x' + bytes.map((b) => parseInt(b, 2).toString(16).toUpperCase().padStart(2, '0')).join('');
    const clase = eBias === tope ? (/1/.test(ma) ? 'NaN (not a number)' : (sg === '1' ? '−∞' : '+∞')) : eBias === 0 ? (/1/.test(ma) ? 'subnormal (denormal)' : (sg === '1' ? '−0' : '+0')) : 'normal';
    const fmt = (z) => (Number.isFinite(z) ? String(+z.toPrecision(n === 64 ? 17 : 9)).replace('.', '.').replace('-', '−') : Number.isNaN(z) ? 'NaN' : (z < 0 ? '−∞' : '∞'));
    const pasos = [
      { t: `${n}-bit format`, html: `1 sign bit, ${E} exponent bits (bias $2^{${E - 1}} − 1 = ${sesgo}$) and ${M} mantissa bits: $${n} = 1 + ${E} + ${M}$.` },
    ];
    const fin = Number.isFinite(guardado);
    if (desde === 'dec' && fin && guardado !== 0) {
      const a = Math.abs(x); let e = Math.floor(Math.log2(a)); if (2 ** e > a) e--; if (2 ** (e + 1) <= a) e++;
      const ee = Math.max(e, 1 - sesgo);
      pasos.push({ t: 'Sign', html: `The number is ${x < 0 ? 'negative: sign bit 1' : 'positive: sign bit 0'}.` });
      if (e >= 1 - sesgo) pasos.push({ t: 'Normalize', html: `$|x| = ${fmt(a)} = 1.f · 2^{${e}}$ with $1.f = ${fmt(a / 2 ** e)}$ (the normalized mantissa is between 1 and 2).` }, { t: 'Biased exponent', html: `$E = e + ${sesgo} = ${e} + ${sesgo} = ${e + sesgo}$, which in ${E} bits is $${ex}$.` }, { t: 'Mantissa', html: `The ${M} bits after the point of $1.f$ are stored (the leading 1 is implicit): $${ma}$. It is rounded to the nearest; whatever does not fit is lost.` });
      else pasos.push({ t: 'Subnormal number', html: `It is smaller than the smallest normal number ($2^{${1 - sesgo}}$): the exponent is stored as 0 and the mantissa has no implicit 1, $|x| = 0.f · 2^{${1 - sesgo}}$, with $f$ = $${ma}$.` });
      const errAbs = guardado - x;
      pasos.push({ t: 'Value actually stored', html: `The stored value is $${fmt(guardado)}$ and the requested one was $${fmt(x)}$: error $${errAbs === 0 ? '0 (exact)' : (errAbs < 0 ? '−' : '') + Math.abs(errAbs).toExponential(2).replace('.', '.').replace(/e([+-]?)(\d+)/, '·10^{$1$2}').replace('{-', '{−').replace('{+', '{')}$, which is at most half a ULP: ${n === 32 ? '≈ 6·10^{−8}' : '≈ 1.1·10^{−16}'} relative to the value.` });
      void ee;
    } else if (desde === 'hex' || !fin || guardado === 0) {
      pasos.push({ t: 'Fields', html: `Sign $${sg}$, exponent $${ex}$ ($E = ${eBias}$) and mantissa $${ma}$. It is a <b>${clase}</b> number.` });
      if (clase === 'normal') pasos.push({ t: 'Value', html: `$(−1)^{${sg}} · 1,f · 2^{E − ${sesgo}} = ${sg === '1' ? '−' : ''}1,f · 2^{${eBias - sesgo}} = ${fmt(guardado)}$.` });
    }
    const filas = [
      { k: 'dec', t: 'Stored value', v: fmt(guardado) },
      { k: 'sg', t: 'Sign', v: sg },
      { k: 'ex', t: `Exponent (${E} bits)`, v: `${ex} (E = ${eBias}${eBias > 0 && eBias < tope ? `, e = ${eBias - sesgo}` : ''})` },
      { k: 'ma', t: `Mantissa (${M} bits)`, v: ma },
      { k: 'hex', t: 'Hexadecimal', v: hex },
      { k: 'clase', t: 'Class', v: clase },
    ];
    return { modo: 'ieee', n, E, M, v: guardado, signo: sg, exponente: ex, mantisa: ma, hex, clase, bits, filas, pasos };
  }

  function aritmetica(sc) {
    const w = +sc.bits || 8; if (!BITS.includes(w)) throw new Error('The number of bits must be 4, 8, 16 or 32');
    const op = sc.op === '-' ? '-' : '+', min = -(2 ** (w - 1)), max = 2 ** (w - 1) - 1;
    const leeOp = (k, nom) => { const t = String(sc[k] ?? '').trim().replace(/[−–]/g, '-'); if (!/^[+-]?\d+$/.test(t)) throw new Error(`${nom} must be a decimal integer`); const v = +t; if (v < min || v > max) throw new Error(`${nom} = ${String(v).replace('-', '−')} does not fit in ${w} bits (from ${String(min).replace('-', '−')} to ${max}): increase the number of bits`); return v; };
    const a = leeOp('a', 'The first number'), b = leeOp('b', 'The second number'), M = 2 ** w;
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
      { t: 'The operands in two\'s complement', html: `With ${w} bits the numbers from $${sig(min)}$ to $${max}$ fit. $${sig(a)} → ${grupo(pa)}$ and $${sig(b)} → ${grupo(pb)}$.` },
    ];
    if (op === '-') pasos.push({ t: 'Subtraction is an addition', html: `$a − b = a + (−b)$: $b$ is negated by inverting its bits and adding 1. $${grupo(pb)} → ${grupo([...pb].map((x) => (x === '1' ? '0' : '1')).join(''))} + 1 = ${grupo(pb2)}$${b === min ? ' (for the most negative value, $−b$ does not fit and the same pattern comes out again)' : ''}.` });
    pasos.push({ t: 'Bit-by-bit addition', html: `It is added from right to left; the carry row shows the one carried to the next column:<br>${linea('acarreo', [...acarreos.slice(1)].join('') )}<br>${linea('', pa)}<br>${linea(op === '-' ? '+ (−b)' : '+', pb2)}<br>${linea('resultado', res)}` });
    pasos.push({ t: 'Result', html: `The pattern $${grupo(res)}_{C2}$ is worth $${sig(vr)}$. ${desborda ? `But the true sum is $${sig(a)} ${op === '+' ? '+' : '−'} ${b < 0 ? '(' + sig(b) + ')' : b} = ${sig(vt)}$, which does not fit: there is <b>overflow</b> and the result is incorrect.` : `It matches $${sig(a)} ${op === '+' ? '+' : '−'} ${b < 0 ? '(' + sig(b) + ')' : b} = ${sig(vt)}$: there is no overflow.`}` });
    pasos.push({ t: 'How to detect overflow', html: `In two's complement there is overflow when the carry <b>into</b> the sign bit (${entraMSB}) differs from the carry <b>out</b> of it (${sale}): here they ${entraMSB !== sale ? 'differ' : 'are equal'}. It also happens if two positives are added and the result is negative, or two negatives and the result is positive. The carry out (${sale}) only indicates overflow if the patterns are interpreted as unsigned.` });
    const filas = [
      { k: 'dec', t: 'Result (signed)', v: sig(vr) },
      { k: 'pat', t: `${w}-bit pattern`, v: grupo(res) },
      { k: 'verd', t: 'True result', v: sig(vt) },
      { k: 'des', t: 'Overflow', v: desborda ? 'yes' : 'no' },
      { k: 'acs', t: 'Carry out (unsigned)', v: String(sale) },
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

    pasos.push({ t: 'Starting number', html: `The number is <b>${base === 'dec' ? String(sc.valor).trim() : t}</b> and it is in ${BASES[base]}${base === 'c2' ? ` (${w} bits)` : ''}. Its decimal value is $${String(v).replace('-', '−')}$.` });
    if (base !== 'dec') pasos.push(aDecimal(base, t, v, w));
    if (neg && base !== 'c2') pasos.push({ t: 'The sign', html: `To convert a negative number to binary, hexadecimal or BCD, its absolute value $${m}$ is converted and the sign $−$ is written in front.` });

    if (base !== 'bin') {
      const filas = []; let q = m;
      if (q === 0) filas.push('$0 = 0_2$');
      else { while (q > 0) { filas.push(`$${q} ÷ 2 = ${Math.floor(q / 2)}$, remainder $${q % 2}$`); q = Math.floor(q / 2); } }
      pasos.push({ t: 'To binary: divisions by 2', html: `$${m}$ is divided by 2 until reaching 0 and the remainders are read from bottom to top:<br>${filas.join('<br>')}<br>Result: $${m} = ${sub(grupos(bm), 'bin')}$` });
    }
    if (base !== 'hex') {
      const gs = grupos(bm).split(' ');
      pasos.push({ t: 'To hexadecimal: groups of 4 bits', html: `The bits are grouped in fours from the right and each group is a hexadecimal digit: ${gs.map((g) => `$${g} → ${parseInt(g, 2).toString(16).toUpperCase()}$`).join(', ')}, that is, $${sub(hexm, 'hex')}$` });
    }
    if (base !== 'oct') {
      const bo = bm.padStart(Math.ceil(bm.length / 3) * 3, '0'), gs = bo.match(/.{3}/g);
      pasos.push({ t: 'To octal: groups of 3 bits', html: `The bits are grouped in threes from the right: ${gs.map((g) => `$${g} → ${parseInt(g, 2)}$`).join(', ')}, that is, $${sub(octm, 'oct')}$` });
    }
    if (base !== 'gray') {
      const gr = (BigInt(m) ^ (BigInt(m) >> 1n)).toString(2).padStart(bm.length, '0');
      pasos.push({ t: 'To Gray code', html: `Each Gray bit is the binary bit XOR the bit to its left (the first is copied): $${bm} → ${gr}$. Between one number and the next only one bit changes.` });
    }
    if (cabe) {
      if (!neg) pasos.push({ t: `Two's complement with ${n} bits`, html: `A positive number is written like in binary, padding with zeros on the left up to ${n} bits: $${sub(grupos(c2), 'c2')}$` });
      else {
        const dir = m.toString(2).padStart(n, '0'), inv = [...dir].map((b) => (b === '1' ? '0' : '1')).join('');
        pasos.push({ t: `Two's complement with ${n} bits`, html: `For a negative: $${m}$ is written in ${n} bits ($${grupos(dir)}$), the bits are inverted ($${grupos(inv)}$) and 1 is added ($${grupos(c2)}$). Check: $2^{${n}} − ${m} = ${2 ** n - m}$.` });
      }
    } else pasos.push({ t: `Two's complement with ${n} bits`, html: `With ${n} bits only the numbers ${rango} fit ($−2^{${n - 1}}$ to $2^{${n - 1}} − 1$), and $${String(v).replace('-', '−')}$ is outside: the number of bits must be increased.` });
    if (base !== 'bcd') pasos.push({ t: 'To BCD: each decimal digit in 4 bits', html: `Each decimal digit is written with 4 bits (the whole number is not converted): ${dig.map((d) => `$${d} → ${(+d).toString(2).padStart(4, '0')}$`).join(', ')}` });

    const filas = [
      { k: 'dec', t: 'Decimal', v: String(v).replace('-', '−') },
      { k: 'bin', t: 'Binary', v: bin },
      { k: 'c2', t: `Two's complement (${n} bits)`, v: c2 ? grupos(c2) : `no cabe (rango ${rango})` },
      { k: 'oct', t: 'Octal', v: sg + octm },
      { k: 'hex', t: 'Hexadecimal', v: hex },
    ];
    if (hexC2) filas.push({ k: 'hexc2', t: `Hexadecimal of the C2`, v: hexC2 });
    filas.push({ k: 'bcd', t: 'BCD', v: bcd }, { k: 'gray', t: 'Gray code', v: gray });
    return { base, n, v, neg, m, bin, hex, oct: sg + octm, gray, bcd, c2, hexC2, cabe, rango, bm, filas, pasos };
  }

  const ejemplos = [
    { clave: 'negativo', nombre: 'Decimal −45 in 8 bits', sc: { base: 'dec', valor: '−45', bits: '8' } },
    { clave: 'binario', nombre: 'Binary 10110111 (does not fit in 8-bit C2)', sc: { base: 'bin', valor: '10110111', bits: '8' } },
    { clave: 'c2', nombre: 'C2 pattern 11101100', sc: { base: 'c2', valor: '11101100', bits: '8' } },
    { clave: 'hex', nombre: 'Hexadecimal 3F', sc: { base: 'hex', valor: '3F', bits: '8' } },
    { clave: 'bcd', nombre: 'BCD 1001 0111 0101 en 16 bits', sc: { base: 'bcd', valor: '100101110101', bits: '16' } },
    { clave: 'octal', nombre: 'Octal 755 (file permissions)', sc: { base: 'oct', valor: '755', bits: '16' } },
    { clave: 'gray', nombre: 'Gray 1101', sc: { base: 'gray', valor: '1101', bits: '8' } },
    { clave: 'fraccion-01', nombre: '0.1 in binary: periodic', sc: { modo: 'fraccion', dir: 'a', valor: '0,1', dest: '2', nf: '12', bits: '8' } },
    { clave: 'fraccion-hex', nombre: '13,625 en binario y hexadecimal', sc: { modo: 'fraccion', dir: 'a', valor: '13,625', dest: '2', nf: '12', bits: '8' } },
    { clave: 'fraccion-de', nombre: '101,011 binario a decimal', sc: { modo: 'fraccion', dir: 'de', valor: '101,011', dest: '2', nf: '12', bits: '8' } },
    { clave: 'ieee-01', nombre: 'IEEE 754: 0,1 en 32 bits', sc: { modo: 'ieee', valor: '0,1', prec: '32', bits: '8' } },
    { clave: 'ieee-hex', nombre: 'IEEE 754: pattern 0x40490FDB (π)', sc: { modo: 'ieee', valor: '0x40490FDB', prec: '32', bits: '8' } },
    { clave: 'suma-desborda', nombre: 'Sum 100 + 50 with 8 bits: overflow', sc: { modo: 'aritmetica', a: '100', b: '50', op: '+', bits: '8' } },
    { clave: 'resta-c2', nombre: 'Subtraction 25 − 60 with 8 bits', sc: { modo: 'aritmetica', a: '25', b: '60', op: '-', bits: '8' } },
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

