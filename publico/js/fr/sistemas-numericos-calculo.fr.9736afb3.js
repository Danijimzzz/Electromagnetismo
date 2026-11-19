const SistemasNumericos = (() => {
  const BASES = { dec: 'decimal', bin: 'binario', c2: 'complemento a 2', oct: 'octal', hex: 'hexadecimal', bcd: 'BCD', gray: 'code Gray' };
  const SUB = { dec: '10', bin: '2', c2: 'C2', oct: '8', hex: '16', bcd: 'BCD', gray: 'Gray' };
  const BITS = [4, 8, 16, 32];
  const grupos = (b) => b.padStart(Math.ceil(b.length / 4) * 4, '0').replace(/(.{4})(?=.)/g, '$1 ');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const sub = (txt, base) => `${txt}_{${SUB[base]}}`;

  function lee(sc) {
    const base = BASES[sc.base] ? sc.base : 'dec', n = +sc.bits || 8;
    if (!BITS.includes(n)) throw new Error('Le nombre de bits doit être 4, 8, 16 ou 32');
    let t = String(sc.valor ?? '').trim().replace(/[\s_]/g, '').replace(/[−–]/g, '-');
    if (!t) throw new Error('Saisissez un nombre');
    let v, w = 0;
    if (base === 'dec') {
      if (!/^[+-]?\d+$/.test(t)) throw new Error('En décimal, seuls les chiffres de 0 à 9 sont admis, avec − devant s\'il est négatif (ici, pas de décimales)');
      if (t.replace(/^[+-]/, '').length > 15) throw new Error('Le nombre est trop grand (15 chiffres au maximum)');
      v = +t;
    } else if (base === 'oct') {
      t = t.replace(/^0o/i, '');
      if (!/^[0-7]+$/.test(t)) throw new Error('En octal, seuls les chiffres de 0 à 7 sont admis');
      if (t.length > 17) throw new Error('Le nombre est trop grand (17 chiffres octaux au maximum)');
      v = parseInt(t, 8);
    } else if (base === 'hex') {
      t = t.replace(/^0x/i, '');
      if (!/^[0-9a-f]+$/i.test(t)) throw new Error('En hexadécimal, seuls les chiffres 0-9 et A-F sont admis');
      if (t.length > 13) throw new Error('Le nombre est trop grand (13 chiffres hexadécimaux au maximum)');
      v = parseInt(t, 16);
    } else {
      t = t.replace(/^0b/i, '');
      if (!/^[01]+$/.test(t)) throw new Error(`En ${BASES[base]}, seuls les bits 0 et 1 sont admis`);
      if (t.length > (base === 'bcd' ? 60 : 52)) throw new Error(`Le nombre est trop grand (maximum ${base === 'bcd' ? '15 chiffres BCD' : '52 bits'})`);
      if (base === 'bin') v = parseInt(t, 2);
      else if (base === 'gray') { let b = 0, bin = ''; for (const g of t) { b ^= +g; bin += b; } v = parseInt(bin, 2); }
      else if (base === 'c2') {
        if (t.length > n) throw new Error(`Le motif a ${t.length} bits et seuls ${n} tiennent : augmentez le nombre de bits`);
        w = t.length; v = parseInt(t, 2) - (t[0] === '1' ? 2 ** w : 0);
      } else {
        t = t.padStart(Math.ceil(t.length / 4) * 4, '0');
        const ds = t.match(/.{4}/g).map((g) => parseInt(g, 2)), mal = ds.findIndex((d) => d > 9);
        if (mal >= 0) throw new Error(`Le groupe ${t.slice(4 * mal, 4 * mal + 4)} n'est pas un chiffre BCD (seules les valeurs de 0000 à 1001 sont valables)`);
        if (ds.length > 15) throw new Error('Le nombre est trop grand (15 chiffres BCD au maximum)');
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
      return { t: `De ${BASES[base]} a decimal`, html: `Chaque bit pèse une puissance de 2${un ? ', et celui de gauche (le bit de signe) pèse en négatif' : ''}${idx.length > 12 ? ' (seuls les bits à 1 sont écrits)' : ''} : $${sub(t, base)} = ${cuerpo} = ${String(v).replace('-', '−')}$` };
    }
    if (base === 'oct') {
      const cs = [...t], L = cs.length;
      return { t: 'De octal a decimal', html: `Chaque chiffre pèse une puissance de 8 : $${sub(t, 'oct')} = ${cs.map((c, i) => `${c}·8^{${L - 1 - i}}`).join(' + ')} = ${v}$` };
    }
    if (base === 'gray') {
      let b = 0, bin = ''; for (const g of t) { b ^= +g; bin += b; }
      return { t: 'De Gray au binaire et au décimal', html: `Le premier bit est recopié et chaque bit suivant du binaire est le précédent du binaire XOR le bit de Gray : ${[...t].map((g, i) => `$${i ? bin[i - 1] + ' ⊕ ' + g : g} = ${bin[i]}$`).join(', ')}. Cela donne $${sub(bin, 'bin')} = ${v}$.` };
    }
    if (base === 'hex') {
      const cs = [...t], L = cs.length;
      const cuerpo = cs.map((c, i) => `${parseInt(c, 16)}·16^{${L - 1 - i}}`).join(' + ');
      return { t: 'De hexadecimal a decimal', html: `Chaque chiffre pèse une puissance de 16 (A = 10, B = 11, C = 12, D = 13, E = 14, F = 15) : $${sub(t.toUpperCase(), 'hex')} = ${cuerpo} = ${v}$` };
    }
    const gs = t.match(/.{4}/g), ds = gs.map((g) => parseInt(g, 2));
    return { t: 'De BCD a decimal', html: `Chaque groupe de 4 bits est un chiffre décimal : ${gs.map((g, i) => `$${g} → ${ds[i]}$`).join(', ')}, c'est-à-dire $${v}$` };
  }

  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const BASE_DEST = { 2: 'binario', 8: 'octal', 16: 'hexadecimal' };
  function leeRacional(txt) {
    let t = String(txt ?? '').trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(',', '.'), neg = false;
    if (!t) throw new Error('Saisissez un nombre');
    if (t[0] === '-' || t[0] === '+') { neg = t[0] === '-'; t = t.slice(1); }
    let m = t.match(/^(\d{1,9})\/(\d{1,9})$/), p, q;
    if (m) { p = +m[1]; q = +m[2]; if (q === 0) throw new Error('Le dénominateur ne peut pas être 0'); }
    else {
      m = t.match(/^(\d*)\.?(\d*)$/);
      if (!m || !(m[1] + m[2])) throw new Error('Saisissez un décimal avec virgule (12,375) ou une fraction (1/3)');
      if (m[1].length > 6 || m[2].length > 9) throw new Error('Trop de chiffres : jusqu\'à 6 avant la virgule et 9 après');
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
    if (!BASE_DEST[b]) throw new Error('Choisissez binaire, octal ou hexadécimal');
    const nom = BASE_DEST[b], bs = Math.log2(b);
    if (sc.dir === 'de') {   // de la base a decimal, exacto
      let t = String(sc.valor ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/^0[box]/i, '');
      if (!t) throw new Error('Saisissez un nombre');
      const m = t.match(/^([0-9A-F]*)\.?([0-9A-F]*)$/i);
      if (!m || !(m[1] + m[2])) throw new Error(`Saisissez un nombre en ${nom} avec virgule, par exemple ${b === 2 ? '101,011' : b === 8 ? '5,3' : 'A,8'}`);
      const malo = [...(m[1] + m[2])].find((c) => parseInt(c, 16) >= b);
      if (malo) throw new Error(`« ${malo} » n'est pas un chiffre ${nom}${b === 2 ? ' (seulement 0 et 1)' : b === 8 ? ' (de 0 à 7)' : ''}`);
      if (m[1].length > 12 || m[2].length > 24) throw new Error('Trop de chiffres : jusqu\'à 12 avant la virgule et 24 après');
      const k = m[2].length;
      let Nb = 0n; for (const c of m[1] + m[2]) Nb = Nb * BigInt(b) + BigInt(parseInt(c, 16));
      const sh = bs * k, X = (Nb * 5n ** BigInt(sh)).toString().padStart(sh + 1, '0'), ent = sh ? X.slice(0, X.length - sh) : X, fr = sh ? X.slice(X.length - sh).replace(/0+$/, '') : '';
      const dec = ent + (fr ? ',' + fr : '');
      const terminos = [...(m[1])].map((c, i) => `${parseInt(c, 16)}·${b}^{${m[1].length - 1 - i}}`).concat([...(m[2])].map((c, i) => `${parseInt(c, 16)}·${b}^{−${i + 1}}`)).join(' + ');
      const pasos = [
        { t: 'Nombre de départ', html: `$${m[1] || '0'},${m[2] || '0'}_{${b}}$ en ${nom} : ${m[1].length} chiffres entiers et ${k} fractionnaires.` },
        { t: 'Chaque chiffre par son poids', html: `Les chiffres à droite de la virgule pèsent des puissances négatives de ${b} : $${terminos}$` },
        { t: 'Résultat exact', html: `$${m[1] || '0'},${m[2] || '0'}_{${b}} = ${dec}$. Comme ${b} est une puissance de 2, une fraction finie en ${nom} est toujours finie en décimal (avec ${bs * k} chiffres décimaux au plus).` },
      ];
      return { modo: 'fraccion', dir: 'de', dest: b, v: Number(`${ent}.${fr || '0'}`), texto: dec, filas: [{ k: 'dec', t: 'Décimal', v: dec }], pasos };
    }
    const { p, q, neg } = leeRacional(sc.valor), nd = vacio(sc.nf) ? 12 : Number(sc.nf);
    if (!Number.isInteger(nd) || nd < 1 || nd > 32) throw new Error('Les chiffres après la virgule doivent être un entier de 1 à 32');
    const ip = Math.floor(p / q); let r = p % q;
    const vistos = new Map(), digs = [], filas = []; let ini = -1;
    while (r !== 0 && digs.length < 400) {
      if (vistos.has(r)) { ini = vistos.get(r); break; }
      vistos.set(r, digs.length);
      const prod = r * b, d = Math.floor(prod / q), rn = prod % q;
      if (filas.length < 12) filas.push(`$${r}/${q} · ${b} = ${prod}/${q}$ → chiffre $${DIG[d]}$, il reste $${rn}/${q}$`);
      digs.push(DIG[d]); r = rn;
    }
    const periodico = ini >= 0, pre = periodico ? digs.slice(0, ini).join('') : digs.join(''), per = periodico ? digs.slice(ini).join('') : '';
    const sg = neg ? '−' : '', ent = ip.toString(b).toUpperCase();
    const texto = `${sg}${ent}${pre || per ? ',' : ''}${pre}${periodico ? `(${per})` : ''}`;
    const exacto = !periodico && digs.length <= 400;
    let largo = pre; while (largo.length < nd && per) largo += per; const corte = [...(periodico ? largo : digs.join(''))].slice(0, nd); let aprox = ip; corte.forEach((c, i) => { aprox += parseInt(c, 16) / b ** (i + 1); });
    const exactoV = p / q, err = (neg ? -1 : 1) * (aprox - exactoV);
    const pasos = [
      { t: 'Le nombre', html: `$${sg}${p}/${q}$ ${q === 1 ? '(entier)' : `= ${sg}${String(exactoV).replace('.', ',')}`} ; partie entière $${ip}$ et partie fractionnaire $${p % q}/${q}$.` },
      { t: 'Partie entière', html: `$${ip} = ${ent}_{${b}}$ (divisions successives par ${b}).` },
    ];
    if (digs.length) pasos.push({ t: `Partie fractionnaire : multiplier par ${b}`, html: `On multiplie la fraction par ${b}, la partie entière est le chiffre suivant et on continue avec ce qui reste (le reste est conservé sous forme de fraction exacte) :<br>${filas.join('<br>')}${digs.length > 12 ? '<br>…' : ''}` });
    pasos.push({ t: 'Résultat', html: periodico ? `Le reste se répète (${[...vistos.keys()][ini]}/${q}), donc le développement est <b>périodique</b> : $${texto}_{${b}}$, avec entre parenthèses le groupe qui se répète (période de ${per.length} ${per.length === 1 ? 'chiffre' : 'chiffres'}).` : `Le développement s'arrête : $${texto}_{${b}}$ (${digs.length} ${digs.length === 1 ? 'chiffre' : 'chiffres'} après la virgule).` });
    if (periodico || digs.length > nd) pasos.push({ t: `Avec ${nd} chiffres après la virgule`, html: `Si l'on ne conserve que ${nd} chiffres (par troncature), la valeur est $${String(+aprox.toPrecision(12)).replace('.', ',')}$ au lieu de $${String(+exactoV.toPrecision(12)).replace('.', ',')}$ : erreur de $${(err < 0 ? '−' : '') + Math.abs(err).toExponential(2).replace('.', ',').replace(/e([+-]?)(\d+)/, '·10^{$1$2}').replace('{-', '{−').replace('{+', '{')}$. C'est pourquoi 0,1 n'est pas stocké exactement dans une machine binaire.` });
    filas.length = 0;
    const filasR = [{ k: 'dec', t: nom[0].toUpperCase() + nom.slice(1), v: texto }, { k: 'tipo', t: 'Type de développement', v: periodico ? `périodique (période ${per.length})` : 'finita' }];
    if (periodico || digs.length > nd) filasR.push({ k: 'err', t: `Erreur de troncature à ${nd} chiffres`, v: `${err < 0 ? '−' : ''}${potTxt(Math.abs(err))}` });
    return { modo: 'fraccion', dir: 'a', dest: b, v: (neg ? -1 : 1) * exactoV, texto, periodico, pre, per, ent, exacto, err, filas: filasR, pasos };
  }

  function ieee(sc) {
    const n = +sc.prec === 64 ? 64 : 32, E = n === 64 ? 11 : 8, M = n === 64 ? 52 : 23, sesgo = 2 ** (E - 1) - 1;
    const dv = new DataView(new ArrayBuffer(8));
    let t = String(sc.valor ?? '').trim().replace(/\s|_/g, '').replace(/[−–]/g, '-').replace(',', '.'), desde = null;
    if (!t) throw new Error('Saisissez un nombre décimal (0,1 ; −118,625 ; 1e-5) ou un motif hexadécimal (0x40490FDB)');
    let x;
    if (/^0x[0-9a-f]+$/i.test(t)) {
      const h = t.slice(2); if (h.length !== n / 4) throw new Error(`Un motif de ${n} bits a ${n / 4} chiffres hexadécimaux (0x…)`);
      for (let i = 0; i < n / 8; i++) dv.setUint8(i, parseInt(h.slice(2 * i, 2 * i + 2), 16));
      x = n === 64 ? dv.getFloat64(0) : dv.getFloat32(0); desde = 'hex';
    } else {
      if (/^[+-]?inf(inity)?$/i.test(t)) x = t[0] === '-' ? -Infinity : Infinity;
      else if (/^nan$/i.test(t)) x = NaN;
      else if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) x = Number(t);
      else throw new Error('Nombre incompris : saisissez un décimal (0,1 ; −118,625 ; 1e-5), inf, nan ou un motif 0x…');
      if (n === 64) dv.setFloat64(0, x); else dv.setFloat32(0, x);
      desde = 'dec';
    }
    const bytes = []; for (let i = 0; i < n / 8; i++) bytes.push(dv.getUint8(i).toString(2).padStart(8, '0'));
    const bits = bytes.join(''), sg = bits[0], ex = bits.slice(1, 1 + E), ma = bits.slice(1 + E), eBias = parseInt(ex, 2), tope = 2 ** E - 1;
    const guardado = n === 64 ? dv.getFloat64(0) : dv.getFloat32(0), hex = '0x' + bytes.map((b) => parseInt(b, 2).toString(16).toUpperCase().padStart(2, '0')).join('');
    const clase = eBias === tope ? (/1/.test(ma) ? 'NaN (pas un nombre)' : (sg === '1' ? '−∞' : '+∞')) : eBias === 0 ? (/1/.test(ma) ? 'subnormal (denormal)' : (sg === '1' ? '−0' : '+0')) : 'normal';
    const fmt = (z) => (Number.isFinite(z) ? String(+z.toPrecision(n === 64 ? 17 : 9)).replace('.', ',').replace('-', '−') : Number.isNaN(z) ? 'NaN' : (z < 0 ? '−∞' : '∞'));
    const pasos = [
      { t: `Format de ${n} bits`, html: `1 bit de signe, ${E} d'exposant (biais $2^{${E - 1}} − 1 = ${sesgo}$) et ${M} de mantisse : $${n} = 1 + ${E} + ${M}$.` },
    ];
    const fin = Number.isFinite(guardado);
    if (desde === 'dec' && fin && guardado !== 0) {
      const a = Math.abs(x); let e = Math.floor(Math.log2(a)); if (2 ** e > a) e--; if (2 ** (e + 1) <= a) e++;
      const ee = Math.max(e, 1 - sesgo);
      pasos.push({ t: 'Signe', html: `Le nombre est ${x < 0 ? 'négatif : bit de signe 1' : 'positif : bit de signe 0'}.` });
      if (e >= 1 - sesgo) pasos.push({ t: 'Normaliser', html: `$|x| = ${fmt(a)} = 1,f · 2^{${e}}$ avec $1,f = ${fmt(a / 2 ** e)}$ (la mantisse normalisée est comprise entre 1 et 2).` }, { t: 'Exposant biaisé', html: `$E = e + ${sesgo} = ${e} + ${sesgo} = ${e + sesgo}$, ce qui sur ${E} bits donne $${ex}$.` }, { t: 'Mantisse', html: `On stocke les ${M} bits après la virgule de $1,f$ (le 1 initial est implicite) : $${ma}$. On arrondit au plus proche ; ce qui ne tient pas est perdu.` });
      else pasos.push({ t: 'Nombre dénormalisé', html: `Il est plus petit que le plus petit normal ($2^{${1 - sesgo}}$) : l'exposant est stocké à 0 et la mantisse n'a pas le 1 implicite, $|x| = 0,f · 2^{${1 - sesgo}}$, avec $f$ = $${ma}$.` });
      const errAbs = guardado - x;
      pasos.push({ t: 'Valeur réellement stockée', html: `La valeur stockée est $${fmt(guardado)}$ et la valeur demandée était $${fmt(x)}$ : erreur $${errAbs === 0 ? '0 (exact)' : (errAbs < 0 ? '−' : '') + Math.abs(errAbs).toExponential(2).replace('.', ',').replace(/e([+-]?)(\d+)/, '·10^{$1$2}').replace('{-', '{−').replace('{+', '{')}$, qui est au plus d'un demi-ULP : ${n === 32 ? '≈ 6·10^{−8}' : '≈ 1,1·10^{−16}'} par rapport à la valeur.` });
      void ee;
    } else if (desde === 'hex' || !fin || guardado === 0) {
      pasos.push({ t: 'Champs', html: `Signe $${sg}$, exposant $${ex}$ ($E = ${eBias}$) et mantisse $${ma}$. C'est un nombre <b>${clase}</b>.` });
      if (clase === 'normal') pasos.push({ t: 'Valeur', html: `$(−1)^{${sg}} · 1,f · 2^{E − ${sesgo}} = ${sg === '1' ? '−' : ''}1,f · 2^{${eBias - sesgo}} = ${fmt(guardado)}$.` });
    }
    const filas = [
      { k: 'dec', t: 'Valeur stockée', v: fmt(guardado) },
      { k: 'sg', t: 'Signe', v: sg },
      { k: 'ex', t: `Exposant (${E} bits)`, v: `${ex} (E = ${eBias}${eBias > 0 && eBias < tope ? `, e = ${eBias - sesgo}` : ''})` },
      { k: 'ma', t: `Mantisse (${M} bits)`, v: ma },
      { k: 'hex', t: 'Hexadécimal', v: hex },
      { k: 'clase', t: 'Classe', v: clase },
    ];
    return { modo: 'ieee', n, E, M, v: guardado, signo: sg, exponente: ex, mantisa: ma, hex, clase, bits, filas, pasos };
  }

  function aritmetica(sc) {
    const w = +sc.bits || 8; if (!BITS.includes(w)) throw new Error('Le nombre de bits doit être 4, 8, 16 ou 32');
    const op = sc.op === '-' ? '-' : '+', min = -(2 ** (w - 1)), max = 2 ** (w - 1) - 1;
    const leeOp = (k, nom) => { const t = String(sc[k] ?? '').trim().replace(/[−–]/g, '-'); if (!/^[+-]?\d+$/.test(t)) throw new Error(`${nom} doit être un entier décimal`); const v = +t; if (v < min || v > max) throw new Error(`${nom} = ${String(v).replace('-', '−')} ne tient pas sur ${w} bits (de ${String(min).replace('-', '−')} à ${max}) : augmentez le nombre de bits`); return v; };
    const a = leeOp('a', 'Le premier nombre'), b = leeOp('b', 'Le second nombre'), M = 2 ** w;
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
      { t: 'Les opérandes en complément à 2', html: `Avec ${w} bits, on peut représenter les nombres de $${sig(min)}$ à $${max}$. $${sig(a)} → ${grupo(pa)}$ et $${sig(b)} → ${grupo(pb)}$.` },
    ];
    if (op === '-') pasos.push({ t: 'La soustraction est une addition', html: `$a − b = a + (−b)$ : on nie $b$ en inversant ses bits et en ajoutant 1. $${grupo(pb)} → ${grupo([...pb].map((x) => (x === '1' ? '0' : '1')).join(''))} + 1 = ${grupo(pb2)}$${b === min ? ' (pour la valeur la plus négative, $−b$ ne tient pas et on retrouve le même motif)' : ''}.` });
    pasos.push({ t: 'Addition bit à bit', html: `On additionne de droite à gauche ; la ligne des retenues montre celle que l'on reporte à la colonne suivante :<br>${linea('acarreo', [...acarreos.slice(1)].join('') )}<br>${linea('', pa)}<br>${linea(op === '-' ? '+ (−b)' : '+', pb2)}<br>${linea('resultado', res)}` });
    pasos.push({ t: 'Résultat', html: `Le motif $${grupo(res)}_{C2}$ vaut $${sig(vr)}$. ${desborda ? `Mais la vraie somme est $${sig(a)} ${op === '+' ? '+' : '−'} ${b < 0 ? '(' + sig(b) + ')' : b} = ${sig(vt)}$, qui ne tient pas : il y a <b>dépassement</b> et le résultat est incorrect.` : `Il coïncide avec $${sig(a)} ${op === '+' ? '+' : '−'} ${b < 0 ? '(' + sig(b) + ')' : b} = ${sig(vt)}$ : il n'y a pas de dépassement.`}` });
    pasos.push({ t: 'Comment détecter le dépassement', html: `En complément à 2, il y a dépassement quand la retenue qui <b>entre</b> dans le bit de signe (${entraMSB}) est différente de celle qui en <b>sort</b> (${sale}) : ici, ${entraMSB !== sale ? 'elles sont différentes' : 'elles sont égales'}. Cela se produit aussi si l'on additionne deux positifs et que le résultat est négatif, ou deux négatifs et que le résultat est positif. La retenue de sortie (${sale}) n'indique un dépassement que si les motifs sont interprétés sans signe.` });
    const filas = [
      { k: 'dec', t: 'Résultat (avec signe)', v: sig(vr) },
      { k: 'pat', t: `Motif de ${w} bits`, v: grupo(res) },
      { k: 'verd', t: 'Résultat réel', v: sig(vt) },
      { k: 'des', t: 'Dépassement', v: desborda ? 'oui' : 'no' },
      { k: 'acs', t: 'Retenue de sortie (non signé)', v: String(sale) },
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

    pasos.push({ t: 'Nombre de départ', html: `Le nombre est <b>${base === 'dec' ? String(sc.valor).trim() : t}</b> et il est en ${BASES[base]}${base === 'c2' ? ` (${w} bits)` : ''}. Sa valeur décimale est $${String(v).replace('-', '−')}$.` });
    if (base !== 'dec') pasos.push(aDecimal(base, t, v, w));
    if (neg && base !== 'c2') pasos.push({ t: 'Le signe', html: `Pour convertir un nombre négatif en binaire, hexadécimal ou BCD, on convertit sa valeur absolue $${m}$ et on écrit le signe $−$ devant.` });

    if (base !== 'bin') {
      const filas = []; let q = m;
      if (q === 0) filas.push('$0 = 0_2$');
      else { while (q > 0) { filas.push(`$${q} ÷ 2 = ${Math.floor(q / 2)}$, reste $${q % 2}$`); q = Math.floor(q / 2); } }
      pasos.push({ t: 'En binaire : divisions par 2', html: `On divise $${m}$ par 2 jusqu'à arriver à 0 et on lit les restes de bas en haut :<br>${filas.join('<br>')}<br>Résultat : $${m} = ${sub(grupos(bm), 'bin')}$` });
    }
    if (base !== 'hex') {
      const gs = grupos(bm).split(' ');
      pasos.push({ t: 'En hexadécimal : groupes de 4 bits', html: `On regroupe les bits par 4 à partir de la droite et chaque groupe est un chiffre hexadécimal : ${gs.map((g) => `$${g} → ${parseInt(g, 2).toString(16).toUpperCase()}$`).join(', ')}, c'est-à-dire $${sub(hexm, 'hex')}$` });
    }
    if (base !== 'oct') {
      const bo = bm.padStart(Math.ceil(bm.length / 3) * 3, '0'), gs = bo.match(/.{3}/g);
      pasos.push({ t: 'En octal : groupes de 3 bits', html: `On regroupe les bits par 3 à partir de la droite : ${gs.map((g) => `$${g} → ${parseInt(g, 2)}$`).join(', ')}, c'est-à-dire $${sub(octm, 'oct')}$` });
    }
    if (base !== 'gray') {
      const gr = (BigInt(m) ^ (BigInt(m) >> 1n)).toString(2).padStart(bm.length, '0');
      pasos.push({ t: 'En code Gray', html: `Chaque bit de Gray est le bit du binaire XOR le bit à sa gauche (le premier est recopié) : $${bm} → ${gr}$. D'un nombre au suivant, un seul bit change.` });
    }
    if (cabe) {
      if (!neg) pasos.push({ t: `Complément à 2 sur ${n} bits`, html: `Un nombre positif s'écrit comme en binaire, en complétant avec des zéros à gauche jusqu'à ${n} bits : $${sub(grupos(c2), 'c2')}$` });
      else {
        const dir = m.toString(2).padStart(n, '0'), inv = [...dir].map((b) => (b === '1' ? '0' : '1')).join('');
        pasos.push({ t: `Complément à 2 sur ${n} bits`, html: `Pour un négatif : on écrit $${m}$ sur ${n} bits ($${grupos(dir)}$), on inverse les bits ($${grupos(inv)}$) et on ajoute 1 ($${grupos(c2)}$). Vérification : $2^{${n}} − ${m} = ${2 ** n - m}$.` });
      }
    } else pasos.push({ t: `Complément à 2 sur ${n} bits`, html: `Avec ${n} bits, seuls les nombres ${rango} tiennent ($−2^{${n - 1}}$ à $2^{${n - 1}} − 1$), et $${String(v).replace('-', '−')}$ est hors de la plage : il faut augmenter le nombre de bits.` });
    if (base !== 'bcd') pasos.push({ t: 'En BCD : chaque chiffre décimal sur 4 bits', html: `Chaque chiffre décimal s'écrit avec 4 bits (on ne convertit pas le nombre entier) : ${dig.map((d) => `$${d} → ${(+d).toString(2).padStart(4, '0')}$`).join(', ')}` });

    const filas = [
      { k: 'dec', t: 'Décimal', v: String(v).replace('-', '−') },
      { k: 'bin', t: 'Binaire', v: bin },
      { k: 'c2', t: `Complément à 2 (${n} bits)`, v: c2 ? grupos(c2) : `no cabe (rango ${rango})` },
      { k: 'oct', t: 'Octal', v: sg + octm },
      { k: 'hex', t: 'Hexadécimal', v: hex },
    ];
    if (hexC2) filas.push({ k: 'hexc2', t: `Hexadécimal du C2`, v: hexC2 });
    filas.push({ k: 'bcd', t: 'BCD', v: bcd }, { k: 'gray', t: 'Code Gray', v: gray });
    return { base, n, v, neg, m, bin, hex, oct: sg + octm, gray, bcd, c2, hexC2, cabe, rango, bm, filas, pasos };
  }

  const ejemplos = [
    { clave: 'negativo', nombre: 'Décimal −45 sur 8 bits', sc: { base: 'dec', valor: '−45', bits: '8' } },
    { clave: 'binario', nombre: 'Binaire 10110111 (ne tient pas en C2 sur 8 bits)', sc: { base: 'bin', valor: '10110111', bits: '8' } },
    { clave: 'c2', nombre: 'Motif C2 11101100', sc: { base: 'c2', valor: '11101100', bits: '8' } },
    { clave: 'hex', nombre: 'Hexadécimal 3F', sc: { base: 'hex', valor: '3F', bits: '8' } },
    { clave: 'bcd', nombre: 'BCD 1001 0111 0101 en 16 bits', sc: { base: 'bcd', valor: '100101110101', bits: '16' } },
    { clave: 'octal', nombre: 'Octal 755 (permissions d\'un fichier)', sc: { base: 'oct', valor: '755', bits: '16' } },
    { clave: 'gray', nombre: 'Gray 1101', sc: { base: 'gray', valor: '1101', bits: '8' } },
    { clave: 'fraccion-01', nombre: '0,1 en binaire : périodique', sc: { modo: 'fraccion', dir: 'a', valor: '0,1', dest: '2', nf: '12', bits: '8' } },
    { clave: 'fraccion-hex', nombre: '13,625 en binario y hexadecimal', sc: { modo: 'fraccion', dir: 'a', valor: '13,625', dest: '2', nf: '12', bits: '8' } },
    { clave: 'fraccion-de', nombre: '101,011 binario a decimal', sc: { modo: 'fraccion', dir: 'de', valor: '101,011', dest: '2', nf: '12', bits: '8' } },
    { clave: 'ieee-01', nombre: 'IEEE 754: 0,1 en 32 bits', sc: { modo: 'ieee', valor: '0,1', prec: '32', bits: '8' } },
    { clave: 'ieee-hex', nombre: 'IEEE 754 : motif 0x40490FDB (π)', sc: { modo: 'ieee', valor: '0x40490FDB', prec: '32', bits: '8' } },
    { clave: 'suma-desborda', nombre: 'Addition 100 + 50 sur 8 bits : dépassement', sc: { modo: 'aritmetica', a: '100', b: '50', op: '+', bits: '8' } },
    { clave: 'resta-c2', nombre: 'Soustraction 25 − 60 sur 8 bits', sc: { modo: 'aritmetica', a: '25', b: '60', op: '-', bits: '8' } },
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

