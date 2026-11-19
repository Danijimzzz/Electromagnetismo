const SistemasNumericos = (() => {
  const BASES = { dec: 'decimal', bin: 'binario', c2: 'complemento a 2', oct: 'octal', hex: 'hexadecimal', bcd: 'BCD', gray: 'Gray-Code' };
  const SUB = { dec: '10', bin: '2', c2: 'C2', oct: '8', hex: '16', bcd: 'BCD', gray: 'Gray' };
  const BITS = [4, 8, 16, 32];
  const grupos = (b) => b.padStart(Math.ceil(b.length / 4) * 4, '0').replace(/(.{4})(?=.)/g, '$1 ');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const sub = (txt, base) => `${txt}_{${SUB[base]}}`;

  function lee(sc) {
    const base = BASES[sc.base] ? sc.base : 'dec', n = +sc.bits || 8;
    if (!BITS.includes(n)) throw new Error('Die Bitanzahl muss 4, 8, 16 oder 32 sein');
    let t = String(sc.valor ?? '').trim().replace(/[\s_]/g, '').replace(/[−–]/g, '-');
    if (!t) throw new Error('Gib eine Zahl ein');
    let v, w = 0;
    if (base === 'dec') {
      if (!/^[+-]?\d+$/.test(t)) throw new Error('Im Dezimalsystem sind nur die Ziffern 0 bis 9 erlaubt, bei negativen Zahlen mit − davor (hier gibt es keine Nachkommastellen)');
      if (t.replace(/^[+-]/, '').length > 15) throw new Error('Die Zahl ist zu groß (höchstens 15 Stellen)');
      v = +t;
    } else if (base === 'oct') {
      t = t.replace(/^0o/i, '');
      if (!/^[0-7]+$/.test(t)) throw new Error('Im Oktalsystem sind nur die Ziffern 0 bis 7 erlaubt');
      if (t.length > 17) throw new Error('Die Zahl ist zu groß (höchstens 17 Oktalstellen)');
      v = parseInt(t, 8);
    } else if (base === 'hex') {
      t = t.replace(/^0x/i, '');
      if (!/^[0-9a-f]+$/i.test(t)) throw new Error('Im Hexadezimalsystem sind nur die Ziffern 0–9 und A–F erlaubt');
      if (t.length > 13) throw new Error('Die Zahl ist zu groß (höchstens 13 Hexadezimalstellen)');
      v = parseInt(t, 16);
    } else {
      t = t.replace(/^0b/i, '');
      if (!/^[01]+$/.test(t)) throw new Error(`Bei ${BASES[base]} sind nur die Bits 0 und 1 erlaubt`);
      if (t.length > (base === 'bcd' ? 60 : 52)) throw new Error(`Die Zahl ist zu groß (höchstens ${base === 'bcd' ? '15 BCD-Ziffern' : '52 Bit'})`);
      if (base === 'bin') v = parseInt(t, 2);
      else if (base === 'gray') { let b = 0, bin = ''; for (const g of t) { b ^= +g; bin += b; } v = parseInt(bin, 2); }
      else if (base === 'c2') {
        if (t.length > n) throw new Error(`Das Muster hat ${t.length} Bit, aber nur ${n} passen: Erhöhe die Bitanzahl`);
        w = t.length; v = parseInt(t, 2) - (t[0] === '1' ? 2 ** w : 0);
      } else {
        t = t.padStart(Math.ceil(t.length / 4) * 4, '0');
        const ds = t.match(/.{4}/g).map((g) => parseInt(g, 2)), mal = ds.findIndex((d) => d > 9);
        if (mal >= 0) throw new Error(`Die Gruppe ${t.slice(4 * mal, 4 * mal + 4)} ist keine BCD-Ziffer (erlaubt sind nur 0000 bis 1001)`);
        if (ds.length > 15) throw new Error('Die Zahl ist zu groß (höchstens 15 BCD-Ziffern)');
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
      return { t: `De ${BASES[base]} a decimal`, html: `Jedes Bit hat das Gewicht einer Zweierpotenz${un ? ', und das linke (das Vorzeichenbit) hat ein negatives Gewicht' : ''}${idx.length > 12 ? ' (nur die Bits mit Wert 1 werden geschrieben)' : ''}: $${sub(t, base)} = ${cuerpo} = ${String(v).replace('-', '−')}$` };
    }
    if (base === 'oct') {
      const cs = [...t], L = cs.length;
      return { t: 'De octal a decimal', html: `Jede Ziffer hat das Gewicht einer Achterpotenz: $${sub(t, 'oct')} = ${cs.map((c, i) => `${c}·8^{${L - 1 - i}}`).join(' + ')} = ${v}$` };
    }
    if (base === 'gray') {
      let b = 0, bin = ''; for (const g of t) { b ^= +g; bin += b; }
      return { t: 'Von Gray nach Binär und nach Dezimal', html: `Das erste Bit wird übernommen, und jedes weitere Binärbit ist das vorherige Binärbit XOR dem Gray-Bit: ${[...t].map((g, i) => `$${i ? bin[i - 1] + ' ⊕ ' + g : g} = ${bin[i]}$`).join(', ')}. Es ergibt sich $${sub(bin, 'bin')} = ${v}$.` };
    }
    if (base === 'hex') {
      const cs = [...t], L = cs.length;
      const cuerpo = cs.map((c, i) => `${parseInt(c, 16)}·16^{${L - 1 - i}}`).join(' + ');
      return { t: 'De hexadecimal a decimal', html: `Jede Ziffer hat das Gewicht einer Sechzehnerpotenz (A = 10, B = 11, C = 12, D = 13, E = 14, F = 15): $${sub(t.toUpperCase(), 'hex')} = ${cuerpo} = ${v}$` };
    }
    const gs = t.match(/.{4}/g), ds = gs.map((g) => parseInt(g, 2));
    return { t: 'De BCD a decimal', html: `Jede Gruppe aus 4 Bit ist eine Dezimalziffer: ${gs.map((g, i) => `$${g} → ${ds[i]}$`).join(', ')}, also $${v}$` };
  }

  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const BASE_DEST = { 2: 'binario', 8: 'octal', 16: 'hexadecimal' };
  function leeRacional(txt) {
    let t = String(txt ?? '').trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(',', '.'), neg = false;
    if (!t) throw new Error('Gib eine Zahl ein');
    if (t[0] === '-' || t[0] === '+') { neg = t[0] === '-'; t = t.slice(1); }
    let m = t.match(/^(\d{1,9})\/(\d{1,9})$/), p, q;
    if (m) { p = +m[1]; q = +m[2]; if (q === 0) throw new Error('Der Nenner darf nicht 0 sein'); }
    else {
      m = t.match(/^(\d*)\.?(\d*)$/);
      if (!m || !(m[1] + m[2])) throw new Error('Gib eine Dezimalzahl mit Komma (12,375) oder einen Bruch (1/3) ein');
      if (m[1].length > 6 || m[2].length > 9) throw new Error('Zu viele Stellen: bis zu 6 vor dem Komma und 9 danach');
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
    if (!BASE_DEST[b]) throw new Error('Wähle binär, oktal oder hexadezimal');
    const nom = BASE_DEST[b], bs = Math.log2(b);
    if (sc.dir === 'de') {   // de la base a decimal, exacto
      let t = String(sc.valor ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/^0[box]/i, '');
      if (!t) throw new Error('Gib eine Zahl ein');
      const m = t.match(/^([0-9A-F]*)\.?([0-9A-F]*)$/i);
      if (!m || !(m[1] + m[2])) throw new Error(`Gib eine Zahl in ${nom} mit Komma ein, zum Beispiel ${b === 2 ? '101,011' : b === 8 ? '5,3' : 'A,8'}`);
      const malo = [...(m[1] + m[2])].find((c) => parseInt(c, 16) >= b);
      if (malo) throw new Error(`„${malo}“ ist keine ${nom}e Ziffer${b === 2 ? ' (nur 0 und 1)' : b === 8 ? ' (von 0 bis 7)' : ''}`);
      if (m[1].length > 12 || m[2].length > 24) throw new Error('Zu viele Stellen: bis zu 12 vor dem Komma und 24 danach');
      const k = m[2].length;
      let Nb = 0n; for (const c of m[1] + m[2]) Nb = Nb * BigInt(b) + BigInt(parseInt(c, 16));
      const sh = bs * k, X = (Nb * 5n ** BigInt(sh)).toString().padStart(sh + 1, '0'), ent = sh ? X.slice(0, X.length - sh) : X, fr = sh ? X.slice(X.length - sh).replace(/0+$/, '') : '';
      const dec = ent + (fr ? ',' + fr : '');
      const terminos = [...(m[1])].map((c, i) => `${parseInt(c, 16)}·${b}^{${m[1].length - 1 - i}}`).concat([...(m[2])].map((c, i) => `${parseInt(c, 16)}·${b}^{−${i + 1}}`)).join(' + ');
      const pasos = [
        { t: 'Ausgangszahl', html: `$${m[1] || '0'},${m[2] || '0'}_{${b}}$ in ${nom}: ${m[1].length} ganze Stellen und ${k} Nachkommastellen.` },
        { t: 'Jede Ziffer mit ihrem Gewicht', html: `Die Ziffern rechts vom Komma haben negative Potenzen von ${b} als Gewicht: $${terminos}$` },
        { t: 'Exaktes Ergebnis', html: `$${m[1] || '0'},${m[2] || '0'}_{${b}} = ${dec}$. Da ${b} eine Zweierpotenz ist, ist ein endlicher Bruch in ${nom} im Dezimalsystem immer endlich (mit höchstens ${bs * k} Nachkommastellen).` },
      ];
      return { modo: 'fraccion', dir: 'de', dest: b, v: Number(`${ent}.${fr || '0'}`), texto: dec, filas: [{ k: 'dec', t: 'Dezimal', v: dec }], pasos };
    }
    const { p, q, neg } = leeRacional(sc.valor), nd = vacio(sc.nf) ? 12 : Number(sc.nf);
    if (!Number.isInteger(nd) || nd < 1 || nd > 32) throw new Error('Die Ziffern nach dem Komma müssen eine ganze Zahl von 1 bis 32 sein');
    const ip = Math.floor(p / q); let r = p % q;
    const vistos = new Map(), digs = [], filas = []; let ini = -1;
    while (r !== 0 && digs.length < 400) {
      if (vistos.has(r)) { ini = vistos.get(r); break; }
      vistos.set(r, digs.length);
      const prod = r * b, d = Math.floor(prod / q), rn = prod % q;
      if (filas.length < 12) filas.push(`$${r}/${q} · ${b} = ${prod}/${q}$ → Ziffer $${DIG[d]}$, es bleibt $${rn}/${q}$`);
      digs.push(DIG[d]); r = rn;
    }
    const periodico = ini >= 0, pre = periodico ? digs.slice(0, ini).join('') : digs.join(''), per = periodico ? digs.slice(ini).join('') : '';
    const sg = neg ? '−' : '', ent = ip.toString(b).toUpperCase();
    const texto = `${sg}${ent}${pre || per ? ',' : ''}${pre}${periodico ? `(${per})` : ''}`;
    const exacto = !periodico && digs.length <= 400;
    let largo = pre; while (largo.length < nd && per) largo += per; const corte = [...(periodico ? largo : digs.join(''))].slice(0, nd); let aprox = ip; corte.forEach((c, i) => { aprox += parseInt(c, 16) / b ** (i + 1); });
    const exactoV = p / q, err = (neg ? -1 : 1) * (aprox - exactoV);
    const pasos = [
      { t: 'Die Zahl', html: `$${sg}${p}/${q}$ ${q === 1 ? '(ganze Zahl)' : `= ${sg}${String(exactoV).replace('.', ',')}`}; ganzzahliger Anteil $${ip}$ und gebrochener Anteil $${p % q}/${q}$.` },
      { t: 'Ganzzahliger Anteil', html: `$${ip} = ${ent}_{${b}}$ (fortgesetzte Division durch ${b}).` },
    ];
    if (digs.length) pasos.push({ t: `Gebrochener Anteil: mit ${b} multiplizieren`, html: `Man multipliziert den Bruch mit ${b}, der ganzzahlige Anteil ist die nächste Ziffer, und man macht mit dem Rest weiter (der Rest wird als exakter Bruch gespeichert):<br>${filas.join('<br>')}${digs.length > 12 ? '<br>…' : ''}` });
    pasos.push({ t: 'Ergebnis', html: periodico ? `Der Rest wiederholt sich (${[...vistos.keys()][ini]}/${q}), die Entwicklung ist also <b>periodisch</b>: $${texto}_{${b}}$, wobei die Klammer die sich wiederholende Gruppe angibt (Periode von ${per.length} ${per.length === 1 ? 'Ziffer' : 'Ziffern'}).` : `Die Entwicklung bricht ab: $${texto}_{${b}}$ (${digs.length} ${digs.length === 1 ? 'Ziffer' : 'Ziffern'} nach dem Komma).` });
    if (periodico || digs.length > nd) pasos.push({ t: `Mit ${nd} Stellen nach dem Komma`, html: `Werden nur ${nd} Stellen gespeichert (abgeschnitten), ist der Wert $${String(+aprox.toPrecision(12)).replace('.', ',')}$ statt $${String(+exactoV.toPrecision(12)).replace('.', ',')}$: Fehler von $${(err < 0 ? '−' : '') + Math.abs(err).toExponential(2).replace('.', ',').replace(/e([+-]?)(\d+)/, '·10^{$1$2}').replace('{-', '{−').replace('{+', '{')}$. Deshalb wird 0,1 in einer binären Maschine nicht exakt gespeichert.` });
    filas.length = 0;
    const filasR = [{ k: 'dec', t: nom[0].toUpperCase() + nom.slice(1), v: texto }, { k: 'tipo', t: 'Art der Entwicklung', v: periodico ? `periodisch (Periode ${per.length})` : 'finita' }];
    if (periodico || digs.length > nd) filasR.push({ k: 'err', t: `Fehler beim Abschneiden auf ${nd} Stellen`, v: `${err < 0 ? '−' : ''}${potTxt(Math.abs(err))}` });
    return { modo: 'fraccion', dir: 'a', dest: b, v: (neg ? -1 : 1) * exactoV, texto, periodico, pre, per, ent, exacto, err, filas: filasR, pasos };
  }

  function ieee(sc) {
    const n = +sc.prec === 64 ? 64 : 32, E = n === 64 ? 11 : 8, M = n === 64 ? 52 : 23, sesgo = 2 ** (E - 1) - 1;
    const dv = new DataView(new ArrayBuffer(8));
    let t = String(sc.valor ?? '').trim().replace(/\s|_/g, '').replace(/[−–]/g, '-').replace(',', '.'), desde = null;
    if (!t) throw new Error('Gib eine Dezimalzahl (0,1; −118,625; 1e-5) oder ein Muster in Hexadezimal (0x40490FDB) ein');
    let x;
    if (/^0x[0-9a-f]+$/i.test(t)) {
      const h = t.slice(2); if (h.length !== n / 4) throw new Error(`Ein Muster mit ${n} Bit hat ${n / 4} Hexadezimalstellen (0x…)`);
      for (let i = 0; i < n / 8; i++) dv.setUint8(i, parseInt(h.slice(2 * i, 2 * i + 2), 16));
      x = n === 64 ? dv.getFloat64(0) : dv.getFloat32(0); desde = 'hex';
    } else {
      if (/^[+-]?inf(inity)?$/i.test(t)) x = t[0] === '-' ? -Infinity : Infinity;
      else if (/^nan$/i.test(t)) x = NaN;
      else if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) x = Number(t);
      else throw new Error('Ich verstehe die Zahl nicht: Gib eine Dezimalzahl (0,1; −118,625; 1e-5), inf, nan oder ein Muster 0x… ein');
      if (n === 64) dv.setFloat64(0, x); else dv.setFloat32(0, x);
      desde = 'dec';
    }
    const bytes = []; for (let i = 0; i < n / 8; i++) bytes.push(dv.getUint8(i).toString(2).padStart(8, '0'));
    const bits = bytes.join(''), sg = bits[0], ex = bits.slice(1, 1 + E), ma = bits.slice(1 + E), eBias = parseInt(ex, 2), tope = 2 ** E - 1;
    const guardado = n === 64 ? dv.getFloat64(0) : dv.getFloat32(0), hex = '0x' + bytes.map((b) => parseInt(b, 2).toString(16).toUpperCase().padStart(2, '0')).join('');
    const clase = eBias === tope ? (/1/.test(ma) ? 'NaN (keine Zahl)' : (sg === '1' ? '−∞' : '+∞')) : eBias === 0 ? (/1/.test(ma) ? 'subnormal (denormal)' : (sg === '1' ? '−0' : '+0')) : 'normal';
    const fmt = (z) => (Number.isFinite(z) ? String(+z.toPrecision(n === 64 ? 17 : 9)).replace('.', ',').replace('-', '−') : Number.isNaN(z) ? 'NaN' : (z < 0 ? '−∞' : '∞'));
    const pasos = [
      { t: `${n}-Bit-Format`, html: `1 Vorzeichenbit, ${E} Exponentenbits (Bias $2^{${E - 1}} − 1 = ${sesgo}$) und ${M} Mantissenbits: $${n} = 1 + ${E} + ${M}$.` },
    ];
    const fin = Number.isFinite(guardado);
    if (desde === 'dec' && fin && guardado !== 0) {
      const a = Math.abs(x); let e = Math.floor(Math.log2(a)); if (2 ** e > a) e--; if (2 ** (e + 1) <= a) e++;
      const ee = Math.max(e, 1 - sesgo);
      pasos.push({ t: 'Vorzeichen', html: `Die Zahl ist ${x < 0 ? 'negativ: Vorzeichenbit 1' : 'positiv: Vorzeichenbit 0'}.` });
      if (e >= 1 - sesgo) pasos.push({ t: 'Normalisieren', html: `$|x| = ${fmt(a)} = 1,f · 2^{${e}}$ mit $1,f = ${fmt(a / 2 ** e)}$ (die normalisierte Mantisse liegt zwischen 1 und 2).` }, { t: 'Verschobener Exponent', html: `$E = e + ${sesgo} = ${e} + ${sesgo} = ${e + sesgo}$, was in ${E} Bit $${ex}$ ist.` }, { t: 'Mantisse', html: `Gespeichert werden die ${M} Bit nach dem Komma von $1,f$ (die führende 1 ist implizit): $${ma}$. Es wird zum nächstgelegenen Wert gerundet; was nicht passt, geht verloren.` });
      else pasos.push({ t: 'Subnormale Zahl', html: `Sie ist kleiner als die kleinste normale Zahl ($2^{${1 - sesgo}}$): Der Exponent wird als 0 gespeichert und die Mantisse trägt keine implizite 1, $|x| = 0,f · 2^{${1 - sesgo}}$, mit $f$ = $${ma}$.` });
      const errAbs = guardado - x;
      pasos.push({ t: 'Tatsächlich gespeicherter Wert', html: `Der gespeicherte Wert ist $${fmt(guardado)}$ und der gewünschte war $${fmt(x)}$: Fehler $${errAbs === 0 ? '0 (exakt)' : (errAbs < 0 ? '−' : '') + Math.abs(errAbs).toExponential(2).replace('.', ',').replace(/e([+-]?)(\d+)/, '·10^{$1$2}').replace('{-', '{−').replace('{+', '{')}$, was höchstens ein halbes ULP ist: ${n === 32 ? '≈ 6·10^{−8}' : '≈ 1,1·10^{−16}'} relativ zum Wert.` });
      void ee;
    } else if (desde === 'hex' || !fin || guardado === 0) {
      pasos.push({ t: 'Felder', html: `Vorzeichen $${sg}$, Exponent $${ex}$ ($E = ${eBias}$) und Mantisse $${ma}$. Es ist eine <b>${clase}</b> Zahl.` });
      if (clase === 'normal') pasos.push({ t: 'Wert', html: `$(−1)^{${sg}} · 1,f · 2^{E − ${sesgo}} = ${sg === '1' ? '−' : ''}1,f · 2^{${eBias - sesgo}} = ${fmt(guardado)}$.` });
    }
    const filas = [
      { k: 'dec', t: 'Gespeicherter Wert', v: fmt(guardado) },
      { k: 'sg', t: 'Vorzeichen', v: sg },
      { k: 'ex', t: `Exponent (${E} Bit)`, v: `${ex} (E = ${eBias}${eBias > 0 && eBias < tope ? `, e = ${eBias - sesgo}` : ''})` },
      { k: 'ma', t: `Mantisse (${M} Bit)`, v: ma },
      { k: 'hex', t: 'Hexadezimal', v: hex },
      { k: 'clase', t: 'Klasse', v: clase },
    ];
    return { modo: 'ieee', n, E, M, v: guardado, signo: sg, exponente: ex, mantisa: ma, hex, clase, bits, filas, pasos };
  }

  function aritmetica(sc) {
    const w = +sc.bits || 8; if (!BITS.includes(w)) throw new Error('Die Bitanzahl muss 4, 8, 16 oder 32 sein');
    const op = sc.op === '-' ? '-' : '+', min = -(2 ** (w - 1)), max = 2 ** (w - 1) - 1;
    const leeOp = (k, nom) => { const t = String(sc[k] ?? '').trim().replace(/[−–]/g, '-'); if (!/^[+-]?\d+$/.test(t)) throw new Error(`${nom} muss eine ganze Dezimalzahl sein`); const v = +t; if (v < min || v > max) throw new Error(`${nom} = ${String(v).replace('-', '−')} passt nicht in ${w} Bit (von ${String(min).replace('-', '−')} bis ${max}): Erhöhe die Bitanzahl`); return v; };
    const a = leeOp('a', 'Die erste Zahl'), b = leeOp('b', 'Die zweite Zahl'), M = 2 ** w;
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
      { t: 'Die Operanden im Zweierkomplement', html: `Mit ${w} Bit passen die Zahlen von $${sig(min)}$ bis $${max}$. $${sig(a)} → ${grupo(pa)}$ und $${sig(b)} → ${grupo(pb)}$.` },
    ];
    if (op === '-') pasos.push({ t: 'Die Subtraktion ist eine Addition', html: `$a − b = a + (−b)$: $b$ wird negiert, indem man seine Bits invertiert und 1 addiert. $${grupo(pb)} → ${grupo([...pb].map((x) => (x === '1' ? '0' : '1')).join(''))} + 1 = ${grupo(pb2)}$${b === min ? ' (beim kleinsten Wert passt $−b$ nicht, und es ergibt sich wieder dasselbe Muster)' : ''}.` });
    pasos.push({ t: 'Bitweise Addition', html: `Es wird von rechts nach links addiert; die Zeile der Überträge zeigt den Übertrag in die nächste Spalte:<br>${linea('acarreo', [...acarreos.slice(1)].join('') )}<br>${linea('', pa)}<br>${linea(op === '-' ? '+ (−b)' : '+', pb2)}<br>${linea('resultado', res)}` });
    pasos.push({ t: 'Ergebnis', html: `Das Muster $${grupo(res)}_{C2}$ hat den Wert $${sig(vr)}$. ${desborda ? `Aber die wahre Summe ist $${sig(a)} ${op === '+' ? '+' : '−'} ${b < 0 ? '(' + sig(b) + ')' : b} = ${sig(vt)}$, die nicht passt: Es gibt einen <b>Überlauf</b> und das Ergebnis ist falsch.` : `Es stimmt mit $${sig(a)} ${op === '+' ? '+' : '−'} ${b < 0 ? '(' + sig(b) + ')' : b} = ${sig(vt)}$ überein: Es gibt keinen Überlauf.`}` });
    pasos.push({ t: 'Wie man den Überlauf erkennt', html: `Im Zweierkomplement gibt es einen Überlauf, wenn der Übertrag, der in das Vorzeichenbit <b>hineingeht</b> (${entraMSB}), vom Übertrag verschieden ist, der es <b>verlässt</b> (${sale}): Hier ${entraMSB !== sale ? 'sind sie verschieden' : 'sind sie gleich'}. Er tritt auch auf, wenn zwei positive Zahlen addiert werden und das Ergebnis negativ ist, oder zwei negative und das Ergebnis positiv ist. Der ausgehende Übertrag (${sale}) zeigt nur dann einen Überlauf an, wenn die Muster vorzeichenlos interpretiert werden.` });
    const filas = [
      { k: 'dec', t: 'Ergebnis (mit Vorzeichen)', v: sig(vr) },
      { k: 'pat', t: `${w}-Bit-Muster`, v: grupo(res) },
      { k: 'verd', t: 'Wahres Ergebnis', v: sig(vt) },
      { k: 'des', t: 'Überlauf', v: desborda ? 'ja' : 'no' },
      { k: 'acs', t: 'Ausgehender Übertrag (vorzeichenlos)', v: String(sale) },
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

    pasos.push({ t: 'Ausgangszahl', html: `Die Zahl ist <b>${base === 'dec' ? String(sc.valor).trim() : t}</b> und steht in ${BASES[base]}${base === 'c2' ? ` (${w} Bit)` : ''}. Ihr Dezimalwert ist $${String(v).replace('-', '−')}$.` });
    if (base !== 'dec') pasos.push(aDecimal(base, t, v, w));
    if (neg && base !== 'c2') pasos.push({ t: 'Das Vorzeichen', html: `Um eine negative Zahl in Binär, Hexadezimal oder BCD umzuwandeln, wird ihr Betrag $${m}$ umgewandelt und das Vorzeichen $−$ davorgesetzt.` });

    if (base !== 'bin') {
      const filas = []; let q = m;
      if (q === 0) filas.push('$0 = 0_2$');
      else { while (q > 0) { filas.push(`$${q} ÷ 2 = ${Math.floor(q / 2)}$, Rest $${q % 2}$`); q = Math.floor(q / 2); } }
      pasos.push({ t: 'In Binär: Divisionen durch 2', html: `Man teilt $${m}$ durch 2, bis man bei 0 ankommt, und liest die Reste von unten nach oben:<br>${filas.join('<br>')}<br>Ergebnis: $${m} = ${sub(grupos(bm), 'bin')}$` });
    }
    if (base !== 'hex') {
      const gs = grupos(bm).split(' ');
      pasos.push({ t: 'In Hexadezimal: Gruppen von 4 Bit', html: `Die Bits werden von rechts in Vierergruppen zusammengefasst, und jede Gruppe ist eine Hexadezimalziffer: ${gs.map((g) => `$${g} → ${parseInt(g, 2).toString(16).toUpperCase()}$`).join(', ')}, also $${sub(hexm, 'hex')}$` });
    }
    if (base !== 'oct') {
      const bo = bm.padStart(Math.ceil(bm.length / 3) * 3, '0'), gs = bo.match(/.{3}/g);
      pasos.push({ t: 'In Oktal: Gruppen von 3 Bit', html: `Die Bits werden von rechts in Dreiergruppen zusammengefasst: ${gs.map((g) => `$${g} → ${parseInt(g, 2)}$`).join(', ')}, also $${sub(octm, 'oct')}$` });
    }
    if (base !== 'gray') {
      const gr = (BigInt(m) ^ (BigInt(m) >> 1n)).toString(2).padStart(bm.length, '0');
      pasos.push({ t: 'In Gray-Code', html: `Jedes Gray-Bit ist das Binärbit XOR dem Bit links davon (das erste wird übernommen): $${bm} → ${gr}$. Zwischen einer Zahl und der nächsten ändert sich nur ein Bit.` });
    }
    if (cabe) {
      if (!neg) pasos.push({ t: `Zweierkomplement mit ${n} Bit`, html: `Eine positive Zahl wird wie in Binär geschrieben und links mit Nullen auf ${n} Bit aufgefüllt: $${sub(grupos(c2), 'c2')}$` });
      else {
        const dir = m.toString(2).padStart(n, '0'), inv = [...dir].map((b) => (b === '1' ? '0' : '1')).join('');
        pasos.push({ t: `Zweierkomplement mit ${n} Bit`, html: `Für eine negative Zahl: $${m}$ wird in ${n} Bit geschrieben ($${grupos(dir)}$), die Bits werden invertiert ($${grupos(inv)}$) und 1 wird addiert ($${grupos(c2)}$). Kontrolle: $2^{${n}} − ${m} = ${2 ** n - m}$.` });
      }
    } else pasos.push({ t: `Zweierkomplement mit ${n} Bit`, html: `Mit ${n} Bit passen nur die Zahlen ${rango} ($−2^{${n - 1}}$ bis $2^{${n - 1}} − 1$), und $${String(v).replace('-', '−')}$ liegt außerhalb: Die Bitanzahl muss erhöht werden.` });
    if (base !== 'bcd') pasos.push({ t: 'In BCD: jede Dezimalziffer in 4 Bit', html: `Jede Dezimalziffer wird mit 4 Bit geschrieben (die ganze Zahl wird nicht umgewandelt): ${dig.map((d) => `$${d} → ${(+d).toString(2).padStart(4, '0')}$`).join(', ')}` });

    const filas = [
      { k: 'dec', t: 'Dezimal', v: String(v).replace('-', '−') },
      { k: 'bin', t: 'Binär', v: bin },
      { k: 'c2', t: `Zweierkomplement (${n} Bit)`, v: c2 ? grupos(c2) : `no cabe (rango ${rango})` },
      { k: 'oct', t: 'Oktal', v: sg + octm },
      { k: 'hex', t: 'Hexadezimal', v: hex },
    ];
    if (hexC2) filas.push({ k: 'hexc2', t: `Hexadezimal des Zweierkomplements`, v: hexC2 });
    filas.push({ k: 'bcd', t: 'BCD', v: bcd }, { k: 'gray', t: 'Gray-Code', v: gray });
    return { base, n, v, neg, m, bin, hex, oct: sg + octm, gray, bcd, c2, hexC2, cabe, rango, bm, filas, pasos };
  }

  const ejemplos = [
    { clave: 'negativo', nombre: 'Dezimal −45 in 8 Bit', sc: { base: 'dec', valor: '−45', bits: '8' } },
    { clave: 'binario', nombre: 'Binär 10110111 (passt nicht ins 8-Bit-Zweierkomplement)', sc: { base: 'bin', valor: '10110111', bits: '8' } },
    { clave: 'c2', nombre: 'Zweierkomplement-Muster 11101100', sc: { base: 'c2', valor: '11101100', bits: '8' } },
    { clave: 'hex', nombre: 'Hexadezimal 3F', sc: { base: 'hex', valor: '3F', bits: '8' } },
    { clave: 'bcd', nombre: 'BCD 1001 0111 0101 en 16 bits', sc: { base: 'bcd', valor: '100101110101', bits: '16' } },
    { clave: 'octal', nombre: 'Oktal 755 (Berechtigungen einer Datei)', sc: { base: 'oct', valor: '755', bits: '16' } },
    { clave: 'gray', nombre: 'Gray 1101', sc: { base: 'gray', valor: '1101', bits: '8' } },
    { clave: 'fraccion-01', nombre: '0,1 in Binär: periodisch', sc: { modo: 'fraccion', dir: 'a', valor: '0,1', dest: '2', nf: '12', bits: '8' } },
    { clave: 'fraccion-hex', nombre: '13,625 en binario y hexadecimal', sc: { modo: 'fraccion', dir: 'a', valor: '13,625', dest: '2', nf: '12', bits: '8' } },
    { clave: 'fraccion-de', nombre: '101,011 binario a decimal', sc: { modo: 'fraccion', dir: 'de', valor: '101,011', dest: '2', nf: '12', bits: '8' } },
    { clave: 'ieee-01', nombre: 'IEEE 754: 0,1 en 32 bits', sc: { modo: 'ieee', valor: '0,1', prec: '32', bits: '8' } },
    { clave: 'ieee-hex', nombre: 'IEEE 754: Muster 0x40490FDB (π)', sc: { modo: 'ieee', valor: '0x40490FDB', prec: '32', bits: '8' } },
    { clave: 'suma-desborda', nombre: 'Addition 100 + 50 mit 8 Bit: Überlauf', sc: { modo: 'aritmetica', a: '100', b: '50', op: '+', bits: '8' } },
    { clave: 'resta-c2', nombre: 'Subtraktion 25 − 60 mit 8 Bit', sc: { modo: 'aritmetica', a: '25', b: '60', op: '-', bits: '8' } },
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

