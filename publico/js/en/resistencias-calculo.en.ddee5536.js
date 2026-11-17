const Resistencias = (() => {
  const COLORES = [
    { k: 'negro', n: 'Black', d: 0, m: 0, tc: 250, hex: '#1b1b1b' },
    { k: 'marron', n: 'Brown', d: 1, m: 1, tol: 1, tc: 100, hex: '#7b4a26' },
    { k: 'rojo', n: 'Red', d: 2, m: 2, tol: 2, tc: 50, hex: '#d0302a' },
    { k: 'naranja', n: 'Orange', d: 3, m: 3, tol: 0.05, tc: 15, hex: '#ef7d1a' },
    { k: 'amarillo', n: 'Yellow', d: 4, m: 4, tol: 0.02, tc: 25, hex: '#f2cf1d' },
    { k: 'verde', n: 'Green', d: 5, m: 5, tol: 0.5, tc: 20, hex: '#2e9a48' },
    { k: 'azul', n: 'Blue', d: 6, m: 6, tol: 0.25, tc: 10, hex: '#2a63c4' },
    { k: 'violeta', n: 'Violet', d: 7, m: 7, tol: 0.1, tc: 5, hex: '#8a4fc2' },
    { k: 'gris', n: 'Grey', d: 8, m: 8, tol: 0.01, tc: 1, hex: '#8d8f93' },
    { k: 'blanco', n: 'White', d: 9, m: 9, hex: '#f4f4f0' },
    { k: 'oro', n: 'Gold', m: -1, tol: 5, hex: '#c8a03c' },
    { k: 'plata', n: 'Silver', m: -2, tol: 10, hex: '#c4c6c9' },
    { k: 'ninguno', n: 'No band', tol: 20, hex: null },
  ];
  const C = Object.fromEntries(COLORES.map((c) => [c.k, c]));
  const CIFRAS = COLORES.filter((c) => c.d !== undefined), MULTS = COLORES.filter((c) => c.m !== undefined), TOLS = COLORES.filter((c) => c.tol !== undefined), TCS = COLORES.filter((c) => c.tc !== undefined);

  const SERIES = {
    E6: [10, 15, 22, 33, 47, 68],
    E12: [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82],
    E24: [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91],
    E96: [100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140, 143, 147, 150, 154, 158, 162, 165, 169, 174, 178, 182, 187, 191, 196, 200, 205, 210, 215, 221, 226, 232, 237, 243, 249, 255, 261, 267, 274, 280, 287, 294, 301, 309, 316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412, 422, 432, 442, 453, 464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590, 604, 619, 634, 649, 665, 681, 698, 715, 732, 750, 768, 787, 806, 825, 845, 866, 887, 909, 931, 953, 976],
  };
  SERIES.E48 = SERIES.E96.filter((_, i) => i % 2 === 0);
  SERIES.E3 = [10, 22, 47];   // ±40 % (RE-2)
  SERIES.E192 = [100, 101, 102, 104, 105, 106, 107, 109, 110, 111, 113, 114, 115, 117, 118, 120, 121, 123, 124, 126, 127, 129, 130, 132, 133, 135, 137, 138, 140, 142, 143, 145, 147, 149, 150, 152, 154, 156, 158, 160, 162, 164, 165, 167, 169, 172, 174, 176, 178, 180, 182, 184, 187, 189, 191, 193, 196, 198, 200, 203, 205, 208, 210, 213, 215, 218, 221, 223, 226, 229, 232, 234, 237, 240, 243, 246, 249, 252, 255, 258, 261, 264, 267, 271, 274, 277, 280, 284, 287, 291, 294, 298, 301, 305, 309, 312, 316, 320, 324, 328, 332, 336, 340, 344, 348, 352, 357, 361, 365, 370, 374, 379, 383, 388, 392, 397, 402, 407, 412, 417, 422, 427, 432, 437, 442, 448, 453, 459, 464, 470, 475, 481, 487, 493, 499, 505, 511, 517, 523, 530, 536, 542, 549, 556, 562, 569, 576, 583, 590, 597, 604, 612, 619, 626, 634, 642, 649, 657, 665, 673, 681, 690, 698, 706, 715, 723, 732, 741, 750, 759, 768, 777, 787, 796, 806, 816, 825, 835, 845, 856, 866, 876, 887, 897, 909, 919, 931, 942, 953, 965, 976, 988];   // ±0,5 %: las de tres cifras de las series de precisión (RE-2)
  const TOL_SERIE = { E3: 40, E6: 20, E12: 10, E24: 5, E48: 2, E96: 1, E192: 0.5 };

  function ohm(x, cifras = 4) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0 Ω';
    const pref = [[1e9, 'GΩ'], [1e6, 'MΩ'], [1e3, 'kΩ'], [1, 'Ω'], [1e-3, 'mΩ']];
    const [div, u] = pref.find(([d]) => Math.abs(x) >= d * 0.9999999) || pref[pref.length - 1];
    return `${String(+(x / div).toPrecision(cifras)).replace('.', '.')} ${u}`;
  }
  function henrio(x, cifras = 4) {
    const pref = [[1e6, 'H'], [1e3, 'mH'], [1, 'μH'], [1e-3, 'nH']];
    const [div, u] = pref.find(([d]) => Math.abs(x) >= d * 0.9999999) || pref[pref.length - 1];
    return `${String(+(x / div).toPrecision(cifras)).replace('.', '.')} ${u}`;
  }
  function faradio(x, cifras = 4) {
    const pref = [[1, 'F'], [1e-3, 'mF'], [1e-6, 'μF'], [1e-9, 'nF'], [1e-12, 'pF']];
    const [div, u] = pref.find(([d]) => Math.abs(x) >= d * 0.9999999) || pref[pref.length - 1];
    return `${String(+(x / div).toPrecision(cifras)).replace('.', '.')} ${u}`;
  }
  const num = (x, c = 4) => String(+(+x).toPrecision(c)).replace('.', '.').replace('-', '−');
  const pct = (x) => `${num(x)} %`;

  function colores(sc) {
    const n = +sc.bandas || 4, bob = sc.comp === 'L', un = bob ? henrio : ohm;
    if (![3, 4, 5, 6].includes(n)) throw new Error('A resistor has 3, 4, 5 or 6 bands');
    if (bob && n !== 4) throw new Error('Inductors with a colour code have 4 bands');
    if (n !== 3 && ['oro', 'plata'].includes(sc.b1)) throw new Error('The first band cannot be gold or silver: you are reading the resistor backwards, start from the other end');
    const nc = n >= 5 ? 3 : 2, b = (i) => C[sc[`b${i}`]];
    const cif = [];
    for (let i = 1; i <= nc; i++) {
      const c = b(i);
      if (!c || c.d === undefined) throw new Error(`Band ${i} is a digit: it cannot be ${c ? c.n.toLowerCase() : 'empty'}`);
      cif.push(c);
    }
    if (cif[0].d === 0) throw new Error('The first band cannot be black: if it is, you are reading the resistor backwards');
    const cm = b(nc + 1);
    if (!cm || cm.m === undefined) throw new Error(`Band ${nc + 1} is the multiplier: it cannot be ${cm ? cm.n.toLowerCase() : 'empty'}`);
    let ct = n === 3 ? C.ninguno : b(nc + 2);
    if (!ct || ct.tol === undefined) throw new Error(`Band ${nc + 2} is the tolerance: it cannot be ${ct ? ct.n.toLowerCase() : 'empty'}`);
    const ctc = n === 6 ? b(6) : null;
    if (n === 6 && (!ctc || ctc.tc === undefined)) throw new Error('The sixth band is the temperature coefficient: it must be black, brown, red, orange, yellow, green, blue, violet or grey');
    const base = +cif.map((c) => c.d).join(''), R = base * 10 ** cm.m;
    const Rr = +R.toPrecision(12), tol = ct.tol, min = Rr * (1 - tol / 100), max = Rr * (1 + tol / 100);
    const pasos = [
      ...(bob ? [{ t: 'Inductor', html: 'Inductors use the same code as resistors, but the value comes out in microhenries (μH): gold as the multiplier is ×0.1 μH.' }] : []),
      { t: 'How it is read', html: `${n === 3 ? 'Three bands: two digits and the multiplier; with no tolerance band it is ±20 %.' : n === 4 ? 'Four bands: two digits, the multiplier and the tolerance.' : n === 5 ? 'Five bands (precision resistors): three digits, the multiplier and the tolerance.' : 'Six bands: three digits, the multiplier, the tolerance and the temperature coefficient.'} You start from the side opposite the tolerance band, which is usually set further apart.` },
      { t: 'Digits', html: cif.map((c, i) => `banda ${i + 1}: ${c.n.toLowerCase()} = ${c.d}`).join(', ') + ` → <b>${base}</b>` },
      { t: 'Multiplier', html: `${cm.n.toLowerCase()} = $×10^{${cm.m < 0 ? '−' + -cm.m : cm.m}}$ → $${bob ? 'L' : 'R'} = ${base} · 10^{${cm.m < 0 ? '−' + -cm.m : cm.m}}$ = <b>${num(Rr, 12)} ${bob ? 'μH' : 'Ω'} = ${un(Rr)}</b>` },
      { t: 'Tolerance', html: `${ct === C.ninguno ? 'no band' : ct.n.toLowerCase()} = ±${pct(tol)} → the real value lies between $${num(Rr, 12)} · (1 − ${num(tol / 100)})$ = <b>${un(min, 5)}</b> and $${num(Rr, 12)} · (1 + ${num(tol / 100)})$ = <b>${un(max, 5)}</b>` },
    ];
    if (bob) { pasos.push({ t: 'Standard series', html: normalizado(Rr).exacta ? `${un(Rr)} is a value of the <b>${normalizado(Rr).exacta}</b> series.` : `${un(Rr)} is not a value of the E series: check the colours.` }); return { modo: 'colores', comp: 'L', n, R: Rr, L: Rr * 1e-6, tol, min, max, tc: null, bandas: [...cif, cm, ct].map((c) => c.k), serie: normalizado(Rr).exacta, aviso: null, pasos }; }
    if (ctc) pasos.push({ t: 'Temperature coefficient', html: `${ctc.n.toLowerCase()} = ${ctc.tc} ppm/K: for each degree the temperature rises, R changes by ${ctc.tc}·10<sup>−6</sup> of its value, about ${ohm((Rr * ctc.tc) / 1e6, 3)} per degree.` });
    const serie = normalizado(Rr);
    pasos.push({ t: 'Standard series', html: serie.exacta ? `${ohm(Rr)} is a value of the <b>${serie.exacta}</b> series (and of the larger ones).` : `${ohm(Rr)} is not a standard value of the E6 to E96 series: check that you have read the colours correctly.` });
    let aviso = null;
    const rev = (n === 4 || n === 5) && !sc.sinReves ? alReves(sc, n) : null;
    if (rev) {
      if (!serie.exacta && rev.serie) aviso = `As it stands it is not a standard value, but read backwards it would be ${ohm(rev.R)} ±${pct(rev.tol)}, which is: you are probably reading it backwards.`;
      pasos.push({ t: 'Read backwards', html: `Starting from the other end it would be ${rev.bandas.map((k) => C[k].n.toLowerCase()).join(', ')}: ${ohm(rev.R)} ±${pct(rev.tol)}${rev.serie ? ` (from the ${rev.serie} series)` : ' (not standard)'}. ${aviso ? '<b>This reading is more likely.</b>' : serie.exacta && !rev.serie ? 'Since it is not standard, the first reading is the right one.' : 'Both readings are possible: the right one starts from the end opposite the band set furthest apart.'}` });
    }
    return { modo: 'colores', n, R: Rr, tol, min, max, tc: ctc ? ctc.tc : null, bandas: [...cif, cm, ...(n === 3 ? [] : [ct]), ...(ctc ? [ctc] : [])].map((c) => c.k), serie: serie.exacta, aviso, reves: rev ? rev.R : null, pasos };
  }
  function alReves(sc, n) {
    const r = { bandas: String(n), sinReves: true };
    for (let i = 1; i <= n; i++) r[`b${i}`] = sc[`b${n + 1 - i}`];
    try { return colores(r); } catch (e) { return null; }
  }

  function normalizado(R) {
    const e = Math.floor(Math.log10(R) + 1e-9), m2 = Math.round((R / 10 ** (e - 1)) * 1e6) / 1e6, m3 = Math.round((R / 10 ** (e - 2)) * 1e6) / 1e6;
    for (const s of ['E6', 'E12', 'E24']) if (SERIES[s].includes(m2)) return { exacta: s };
    for (const s of ['E48', 'E96', 'E192']) if (SERIES[s].includes(m3)) return { exacta: s };
    return { exacta: null };
  }

  function leeValor(s) {
    let t = String(s ?? '').trim().replace(/\s/g, '').replace(/Ω|ohm(ios|s)?|ohmio/gi, '').replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
    if (!t) return null;
    const mult = { R: 1, r: 1, k: 1e3, K: 1e3, M: 1e6, G: 1e9, m: 1e-3 };
    let m = t.match(/^(\d*)([RrkKMGm])(\d+)$/);
    if (m) return +`${m[1] || 0}.${m[3]}` * mult[m[2]];
    m = t.match(/^(\d*\.?\d+(?:e[+-]?\d+)?)([RrkKMGm]?)$/i);
    if (m) return +m[1] * (m[2] ? mult[m[2]] : 1);
    return NaN;
  }
  function bandasDe(R, nc) {
    const e = Math.floor(Math.log10(R) + 1e-9), m = e - nc + 1, cif = Math.round(R / 10 ** m);
    if (cif >= 10 ** nc) return bandasDe(10 ** (e + 1), nc);
    return { cifras: String(cif).padStart(nc, '0').split('').map(Number), m, exacto: Math.abs(cif * 10 ** m - R) <= 1e-9 * R };
  }
  function valor(sc) {
    const R = leeValor(sc.valor);
    if (R === null) throw new Error('Enter the resistance value, for example 4k7 or 4700');
    if (!isFinite(R)) throw new Error('I do not understand the value: write it as 4700, 4.7k, 4k7, 2M2 or 470R');
    if (R < 0.1 || R >= 1e11) throw new Error('With colours only values between 0.1 Ω and 99 GΩ can be written');
    const n = +sc.bandas === 5 ? 5 : 4, nc = n === 5 ? 3 : 2;
    const ser = SERIES[sc.serie] ? sc.serie : n === 5 ? 'E96' : 'E24';
    const e = Math.floor(Math.log10(R) + 1e-9), lista = SERIES[ser], dig = lista[0] >= 100 ? 3 : 2;
    let mejor = null;
    for (const k of [e - 1, e, e + 1]) for (const v of lista) { const x = +(v * 10 ** (k - dig + 1)).toPrecision(12), d = Math.abs(Math.log(x / R)); if (!mejor || d < mejor.d) mejor = { x, d }; }
    const Rn = mejor.x, err = (100 * (Rn - R)) / R;
    const b = bandasDe(R, nc), bn = bandasDe(Rn, nc);
    const col = (bb) => [...bb.cifras.map((d) => CIFRAS[d].k), MULTS.find((c) => c.m === bb.m)?.k ?? null];
    const tolK = TOLS.some((c) => c.k === sc.tol) ? sc.tol : n === 5 ? 'marron' : 'oro';
    const bandas = col(b), bandasN = col(bn);
    if (bandas.includes(null)) throw new Error('That value cannot be written with a colour multiplier');
    const nombre = (ks) => ks.map((k) => C[k].n.toLowerCase()).join(' – ');
    const pasos = [
      { t: 'Value', html: `R = <b>${num(R, 12)} Ω</b> = ${ohm(R)}` },
      { t: `Significant figures (${nc})`, html: `$${num(R, 12)} = ${b.cifras.join('')} · 10^{${b.m < 0 ? '−' + -b.m : b.m}}$${b.exacto ? '' : ` (rounded: it cannot be written exactly with ${nc} figures)`} → digits ${b.cifras.join(', ')} and multiplier $10^{${b.m < 0 ? '−' + -b.m : b.m}}$` },
      { t: 'Colours', html: `<b>${nombre([...bandas, tolK])}</b> (${b.cifras.map((d) => `${d} = ${CIFRAS[d].n.toLowerCase()}`).join(', ')}, $×10^{${b.m < 0 ? '−' + -b.m : b.m}}$ = ${C[bandas[nc]].n.toLowerCase()}, ±${pct(C[tolK].tol)} = ${C[tolK].n.toLowerCase()})` },
      { t: `Nearest standard value (${ser} series, ±${TOL_SERIE[ser]} %)`, html: Math.abs(err) < 1e-9 ? `${ohm(R)} is already a value of the ${ser} series.` : `<b>${ohm(Rn)}</b>, ${num(Math.abs(err), 3)} % ${err > 0 ? 'above' : 'below'}. Its colours: ${nombre([...bandasN, tolK])}.` },
    ];
    return { modo: 'valor', R, n, serie: ser, Rn, err, bandas: [...bandas, tolK], bandasN: [...bandasN, tolK], tol: C[tolK].tol, exacto: b.exacto, pasos };
  }

  const EIA_MULT = { Z: -3, Y: -2, R: -2, X: -1, S: -1, A: 0, B: 1, H: 1, C: 2, D: 3, E: 4, F: 5 };
  function smd(sc) {
    const t = String(sc.codigo ?? '').trim().toUpperCase().replace(/\s/g, '');
    if (!t) throw new Error('Enter the code printed on the resistor, for example 472, 4702, 4R7 or 01C');
    let R, como, pasos = [];
    let m;
    if ((m = t.match(/^(\d{2})([ZYRXSABHCDEF])$/)) && +m[1] >= 1 && +m[1] <= 96) {
      const base = SERIES.E96[+m[1] - 1], e = EIA_MULT[m[2]];
      R = +(base * 10 ** e).toPrecision(12); como = 'EIA-96 (1 % resistors)';
      pasos.push({ t: 'EIA-96 code', html: `Two digits giving the position in the E96 series and a letter that is the multiplier: ${m[1]} → ${base} (value number ${+m[1]} of the series), ${m[2]} → $×10^{${e < 0 ? '−' + -e : e}}$` });
      pasos.push({ t: 'Value', html: `$R = ${base} · 10^{${e < 0 ? '−' + -e : e}}$ = <b>${ohm(R)}</b>` });
    } else if (/^\d*R\d+$|^\d+R\d*$/.test(t)) {
      R = +t.replace('R', '.'); como = 'with R (the R is the decimal point)';
      pasos.push({ t: 'Code with R', html: `The R marks where the decimal point goes: ${t} → <b>${ohm(R)}</b>` });
    } else if (/^\d{3,4}$/.test(t)) {
      const c = t.length - 1, cif = t.slice(0, c), e = +t[c];
      R = +cif * 10 ** e; como = t.length === 3 ? '3-digit (5 %)' : '4-digit (1 %)';
      pasos.push({ t: `${t.length}-digit code`, html: `The first ${c} are the digits and the last is how many zeros are added: ${cif} and ${e} zero${e === 1 ? '' : 's'} → $R = ${+cif} · 10^${e}$ = <b>${ohm(R)}</b>${R === 0 ? ' (a 0 Ω jumper)' : ''}` });
    } else if (/^0+$/.test(t)) {
      R = 0; como = 'puente'; pasos.push({ t: '0 Ω jumper', html: 'A 0, 00 or 000 is a jumper: a 0 Ω resistor that only serves to join two tracks.' });
    } else throw new Error('I do not recognize the code: try 3 or 4 digits (472, 4702), with R (4R7, R10) or EIA-96 (01C)');
    return { modo: 'smd', codigo: t, R, como, pasos };
  }


  const TOL_C = { B: '±0,1 pF', C: '±0,25 pF', D: '±0,5 pF', F: '±1 %', G: '±2 %', J: '±5 %', K: '±10 %', M: '±20 %', Z: '+80 % / −20 %' };
  const VOLT_C = { '0G': 4, '0L': 5.5, '0J': 6.3, '1A': 10, '1C': 16, '1D': 20, '1E': 25, '1V': 35, '1H': 50, '1J': 63, '1K': 80, '2A': 100, '2Q': 110, '2B': 125, '2C': 160, '2Z': 180, '2D': 200, '2P': 220, '2E': 250, '2F': 315, '2V': 350, '2G': 400, '2W': 450, '2H': 500, '2J': 630, '3A': 1000 };
  function condensador(sc) {
    const crudo = String(sc.codigo ?? '').trim();
    if (!crudo) throw new Error('Enter the code printed on the capacitor, for example 104, 104K 2A, 4n7 or 47p');
    let V = null, como, C, tol = null;
    const trozos = [];
    for (const t of crudo.split(/\s+/)) {
      if (VOLT_C[t.toUpperCase()] && /^\d[A-Z]$/i.test(t)) V = { v: VOLT_C[t.toUpperCase()], codigo: t.toUpperCase() };
      else if (/^\d+([.,]\d+)?V$/i.test(t)) V = { v: +t.slice(0, -1).replace(',', '.') };
      else trozos.push(t);
    }
    let t = trozos.join('');
    const mt = t.match(/^(.*\d)([BCDFGJKMZ])$/);
    if (mt) { t = mt[1]; tol = mt[2]; }
    const pasos = [];
    if (/^\d{3}$/.test(t)) {
      const e = +t[2], pot = e === 8 ? -2 : e === 9 ? -1 : e;
      if (e === 6 || e === 7) throw new Error(`A ${t[2]} as the third digit is not used: the multiplier goes from 0 to 5 (or 8 and 9 for ×0.01 and ×0.1)`);
      C = +(+t.slice(0, 2) * 10 ** pot).toPrecision(12) * 1e-12; como = '3-digit code in pF';
      pasos.push({ t: '3-digit code', html: `Same as in SMD resistors, but in picofarads: the first two are the digits and the third the zeros. ${t.slice(0, 2)} and ${pot >= 0 ? `${pot} zero${pot === 1 ? '' : 's'}` : `×10<sup>${pot}</sup>`} → $C = ${+t.slice(0, 2)} · 10^{${pot < 0 ? '−' + -pot : pot}}$ pF = <b>${faradio(C)}</b>` });
    } else if (/^\d{1,2}$/.test(t)) {
      C = +t * 1e-12; como = 'valor en pF';
      pasos.push({ t: 'One or two digits', html: `With only one or two digits it is directly the value in picofarads: <b>${faradio(C)}</b>` });
    } else {
      C = Herramienta.leeSI(t.replace(/F$/i, '').replace(/^(\d*)([pnuµμ])$/, '$1$2'), 1e-12);
      if (!(C > 0)) throw new Error('I do not recognize the code: try 3 digits (104, 472J), a letter as the decimal point (4n7, 2u2) or the value with its prefix (47p, 100nF)');
      como = /\d[pnuµμ]\d/i.test(t) ? 'the prefix letter acts as the decimal point' : 'value with prefix';
      pasos.push({ t: como === 'value with prefix' ? 'Value with prefix' : 'Letter as decimal point', html: `${como === 'value with prefix' ? 'The value is written with its prefix' : 'As in 4k7, the letter (p, n or u = μ) is the prefix and marks where the decimal point goes'}: ${esc(t)} → <b>${faradio(C)}</b>` });
    }
    if (tol) pasos.push({ t: 'Tolerance', html: `The letter ${tol} is ${TOL_C[tol]}${/[BCD]/.test(tol) ? ' (in pF: it is used in small capacitors)' : ''}${/%/.test(TOL_C[tol]) && !/Z/.test(tol) ? `: the real value lies between ${faradio(C * (1 - parseFloat(TOL_C[tol].slice(1).replace(',', '.')) / 100))} and ${faradio(C * (1 + parseFloat(TOL_C[tol].slice(1).replace(',', '.')) / 100))}` : ''}.` });
    if (V) pasos.push({ t: 'Maximum voltage', html: V.codigo ? `${V.codigo} is the EIA voltage code: <b>${num(V.v)} V</b> at most.` : `It withstands at most <b>${num(V.v)} V</b>.` });
    pasos.push({ t: 'In other units', html: `${faradio(C)} = ${num(C * 1e12, 6)} pF = ${num(C * 1e9, 6)} nF = ${num(C * 1e6, 6)} μF` });
    return { modo: 'condensador', C, como, tol: tol ? TOL_C[tol] : null, V: V ? V.v : null, pasos };
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function arbol(texto) {
    const t = String(texto ?? '').replace(/\|\||\/\/|∥/g, '‖').replace(/Ω|ohmios?|ohms?/gi, ''), toks = [];
    for (let i = 0; i < t.length;) {
      const c = t[i];
      if (/\s/.test(c)) { i++; continue; }
      if ('+‖()'.includes(c)) { toks.push(c); i++; continue; }
      const m = t.slice(i).match(/^[\d.,]+(?:e[+-]?\d+)?[RrkKMGm]?\d*/);
      if (!m) throw new Error(`I do not understand “${t.slice(i, i + 6)}”: use numbers (100, 4k7, 2.2k), + for series, ‖ or || for parallel and parentheses`);
      const v = leeValor(m[0]);
      if (!(v >= 0)) throw new Error(`“${m[0]}” is not a resistance value`);
      toks.push({ v, t: m[0] }); i += m[0].length;
    }
    if (!toks.length) throw new Error('Enter the combination, for example 100 + (220 ‖ 330)');
    let k = 0;
    const ve = () => toks[k], come = (x) => { if (toks[k] !== x) throw new Error(`“${x}” is missing${toks[k] ? ` before “${typeof toks[k] === 'string' ? toks[k] : toks[k].t}”` : ' at the end'}`); k++; };
    const prim = () => { const x = ve(); if (x === '(') { k++; const e = suma(); come(')'); return e; } if (x && typeof x === 'object') { k++; return { v: x.v }; } throw new Error(x ? `Extra “${x}”` : 'The expression ends in an operator'); };
    const par = () => { const h = [prim()]; while (ve() === '‖') { k++; h.push(prim()); } return h.length === 1 ? h[0] : { op: '‖', h }; };
    function suma() { const h = [par()]; while (ve() === '+') { k++; h.push(par()); } return h.length === 1 ? h[0] : { op: '+', h }; }
    const e = suma();
    if (k < toks.length) throw new Error(`Extra “${typeof toks[k] === 'string' ? toks[k] : toks[k].t}”`);
    return e;
  }
  function asociacion(sc) {
    const raiz = arbol(sc.expr), pasos = [];
    const evalua = (n) => {
      if (n.v !== undefined) return n.v;
      const vs = n.h.map(evalua);
      let r, como;
      if (n.op === '+') { r = vs.reduce((a, b) => a + b, 0); como = `${vs.map((x) => ohm(x)).join(' + ')} = <b>${ohm(r)}</b>`; }
      else if (vs.some((x) => x === 0)) { r = 0; como = `${vs.map((x) => ohm(x)).join(' ‖ ')}: a 0 Ω one short-circuits the others → <b>0 Ω</b>`; }
      else if (vs.every((x) => Math.abs(x - vs[0]) < 1e-12 * vs[0])) { r = vs[0] / vs.length; como = `${vs.length} equal ${ohm(vs[0])} in parallel: R/${vs.length} = <b>${ohm(r)}</b>`; }
      else if (vs.length === 2) { r = (vs[0] * vs[1]) / (vs[0] + vs[1]); como = `${ohm(vs[0])} ‖ ${ohm(vs[1])} = $(${num(vs[0])} · ${num(vs[1])})/(${num(vs[0])} + ${num(vs[1])})$ = <b>${ohm(r)}</b> (product over sum)`; }
      else { r = 1 / vs.reduce((a, b) => a + 1 / b, 0); como = `${vs.map((x) => ohm(x)).join(' ‖ ')} = 1/(${vs.map((x) => `1/${num(x)}`).join(' + ')}) = <b>${ohm(r)}</b>`; }
      pasos.push({ t: n.op === '+' ? 'En serie: se suman' : 'In parallel: the inverses are added', html: como });
      return r;
    };
    const R = evalua(raiz);
    if (!pasos.length) pasos.push({ t: 'A single resistor', html: `There is nothing to combine: <b>${ohm(R)}</b>` });
    const V = vacio(sc.V) ? null : Herramienta.leeSI(sc.V);
    if (V !== null && !isFinite(V)) throw new Error('The voltage must be a number');
    let I = null, P = null;
    if (V !== null) {
      if (R === 0) throw new Error('With 0 Ω the current would be infinite: it is a short circuit');
      I = V / R; P = V * I;
      pasos.push({ t: `With ${num(V)} V applied`, html: `I = V/R = ${num(V)}/${num(R)} = <b>${amp(I)}</b> and the total power, P = V·I = V<sup>2</sup>/R = <b>${vatio(P)}</b>` });
    }
    return { modo: 'asociacion', R, V, I, P, pasos };
  }
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const conPref = (u) => (x, c = 4) => { if (!isFinite(x)) return '—'; if (x === 0) return `0 ${u}`; const p = [[1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n']].find(([d]) => Math.abs(x) >= d * 0.9999999) || [1e-9, 'n']; return `${String(+(x / p[0]).toPrecision(c)).replace('.', '.').replace('-', '−')} ${p[1]}${u}`; };
  const amp = conPref('A'), vatio = conPref('W'), voltio = conPref('V');

  const DE_SERIE = {};
  function valoresDe(ser) {
    if (DE_SERIE[ser]) return DE_SERIE[ser];
    const l = SERIES[ser], dig = l[0] >= 100 ? 3 : 2, out = [];
    for (let k = 0; k <= 7; k++) for (const v of l) out.push(+(v * 10 ** (k - dig + 1)).toPrecision(12));
    return (DE_SERIE[ser] = out);
  }
  const serieDe = (sc, def = 'E12') => (SERIES[sc.serie] ? sc.serie : def);
  const leePos = (v, nom, base = 1) => { if (vacio(v)) throw new Error(`${nom} is missing`); const x = Herramienta.leeSI(v, base); if (!(x > 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be a number greater than 0`); return x; };
  const leeTol = (v) => { const x = Herramienta.leeSI(v, 1); if (!(x >= 0 && x <= 50)) throw new Error('The tolerance must be a percentage between 0 and 50'); return x; };
  const rel = (x, R) => (100 * (x - R)) / R;
  const dif = (e) => (Math.abs(e) < 1e-9 ? 'exacto' : `${e > 0 ? '+' : '−'}${num(Math.abs(e), 3)} %`);

  function pareja(sc) {
    const R = leePos(sc.R, 'the value you want'), ser = serieDe(sc), vals = valoresDe(ser);
    if (R < 2 || R > 1e7) throw new Error('Look for values between 2 Ω and 10 MΩ');
    const cerca = (x) => Math.abs(Math.log(x / R));
    let uno = null, s = null, p = null;
    for (const a of vals) {
      if (!uno || cerca(a) < cerca(uno.x)) uno = { x: a };
      for (const b of vals) {
        if (b > a) break;
        if (a < R) { const x = a + b; if (!s || cerca(x) < cerca(s.x) - 1e-12) s = { a, b, x }; }
        if (b > R) { const x = (a * b) / (a + b); if (!p || cerca(x) < cerca(p.x) - 1e-12) p = { a, b, x }; }
      }
    }
    for (const o of [uno, s, p]) if (o) o.err = rel(o.x, R);
    const cand = [['una sola', uno], ['en serie', s], ['en paralelo', p]].filter(([, o]) => o), mejor = cand.reduce((m, c) => (Math.abs(c[1].err) < Math.abs(m[1].err) - 1e-9 ? c : m));
    const pasos = [
      { t: `A single one from the ${ser} series`, html: `The closest is <b>${ohm(uno.x)}</b> (${dif(uno.err)}).` },
      ...(s ? [{ t: 'Two in series', html: `All the pairs smaller than ${ohm(R)} are tried: the best is ${ohm(s.a)} + ${ohm(s.b)} = <b>${ohm(s.x)}</b> (${dif(s.err)}).` }] : []),
      ...(p ? [{ t: 'Two in parallel', html: `And all the larger pairs: the best is ${ohm(p.a)} ‖ ${ohm(p.b)} = $(${num(p.a)} · ${num(p.b)})/(${num(p.a)} + ${num(p.b)})$ = <b>${ohm(p.x)}</b> (${dif(p.err)}).` }] : []),
      { t: 'La mejor', html: `<b>${mejor[0] === 'una sola' ? ohm(mejor[1].x) : `${ohm(mejor[1].a)} ${mejor[0] === 'en serie' ? '+' : '‖'} ${ohm(mejor[1].b)}`}</b> ${mejor[0]}, with an error of ${num(Math.abs(mejor[1].err), 3)} %${Math.abs(mejor[1].err) < TOL_SERIE[ser] / 2 ? `, less than the series tolerance (±${TOL_SERIE[ser]} %)` : ''}.` },
    ];
    return { modo: 'pareja', R, serie: ser, uno, s, p, mejor: mejor[0], pasos };
  }

  const POTENCIAS = [0.125, 0.25, 0.5, 1, 2, 5, 10];
  const potencia = (P) => POTENCIAS.find((x) => x >= 2 * P) ?? null;
  const nomP = (x) => ({ 0.125: '1/8 W', 0.25: '1/4 W', 0.5: '1/2 W' }[x] || `${num(x)} W`);
  function led(sc) {
    const Vs = leePos(sc.Vs, 'the source voltage'), Vl = leePos(sc.Vled, 'the LED voltage'), I = leePos(sc.I, 'the LED current', 1e-3), ser = serieDe(sc, 'E12');
    if (Vs <= Vl) throw new Error(`With ${num(Vs)} V a ${num(Vl)} V LED does not light: the source must supply more voltage than the LED`);
    const R = (Vs - Vl) / I, Rn = valoresDe(ser).find((x) => x >= R * (1 - 1e-9));
    if (!Rn) throw new Error('The resistance comes out too large');
    const In = (Vs - Vl) / Rn, P = In * In * Rn, Pn = potencia(P);
    const pasos = [
      { t: 'Ohm\'s law in the resistor', html: `The resistor takes the leftover voltage: $R = (V_s − V_{LED})/I = (${num(Vs)} − ${num(Vl)})/${num(I)}$ = <b>${ohm(R)}</b>` },
      { t: `Standard value (${ser} series)`, html: Math.abs(Rn - R) < 1e-9 * R ? `${ohm(R)} ya es normalizado.` : `The next value up is taken, <b>${ohm(Rn)}</b>, so as not to exceed the maximum current: I = (${num(Vs)} − ${num(Vl)})/${num(Rn)} = <b>${amp(In)}</b>.` },
      { t: 'Power', html: `In the resistor: P = I<sup>2</sup>R = <b>${vatio(P)}</b>. With a safety factor of two, ${Pn ? `a <b>${nomP(Pn)}</b> one is enough` : 'more than 10 W is needed: better lower the current or use a smaller source'}. The LED consumes V·I = ${vatio(Vl * In)} and the source supplies ${vatio(Vs * In)} (efficiency of ${num((100 * Vl) / Vs, 3)} %).` },
    ];
    const aviso = !Pn ? `The resistor dissipates ${vatio(P)}: that is too much. Lower the current or use a smaller source.` : Pn > 0.25 ? `Careful: the resistor dissipates ${vatio(P)} and with a safety factor of two a ${nomP(Pn)} one is needed; a 1/4 W one would not withstand it.` : null;
    return { modo: 'led', R, Rn, I: In, P, Pn, serie: ser, aviso, pasos };
  }

  function divisor(sc) {
    const Vi = leePos(sc.Vin, 'the input voltage'), Vo = leePos(sc.Vout, 'the output voltage'), Rt = vacio(sc.Rt) ? 1e4 : leePos(sc.Rt, 'the total resistance'), ser = serieDe(sc, 'E12');
    const tol = vacio(sc.tol) ? TOL_SERIE[ser] : leeTol(sc.tol);
    if (Vo >= Vi) throw new Error('A divider only lowers the voltage: the output must be smaller than the input');
    const RL = vacio(sc.RL) ? null : leePos(sc.RL, 'la carga');
    const vals = valoresDe(ser).filter((x) => x >= Rt / 30 && x <= Rt * 3);
    let m = null;
    for (const r1 of vals) for (const r2 of vals) {
      const t = r1 + r2;
      if (t < Rt / 3 || t > Rt * 3) continue;
      const v = (Vi * r2) / t, e = Math.abs(v - Vo) / Vo + 1e-4 * Math.abs(Math.log(t / Rt));
      if (!m || e < m.e) m = { r1, r2, v, e };
    }
    if (!m) throw new Error('There is no standard pair for that total resistance');
    const R2i = (Rt * Vo) / Vi, R1i = Rt - R2i, I = Vi / (m.r1 + m.r2), err = rel(m.v, Vo);
    const pasos = [
      { t: 'Divider formula', html: `$V_{out} = V_{in} R_2/(R_1 + R_2)$ ⇒ $R_2/(R_1 + R_2) = ${num(Vo)}/${num(Vi)}$ = ${num(Vo / Vi)}. With R<sub>1</sub> + R<sub>2</sub> = ${ohm(Rt)} we would get R<sub>1</sub> = ${ohm(R1i)} and R<sub>2</sub> = ${ohm(R2i)}.` },
      { t: `With values from the ${ser} series`, html: `The closest pair is <b>R<sub>1</sub> = ${ohm(m.r1)}</b> and <b>R<sub>2</sub> = ${ohm(m.r2)}</b>: V<sub>out</sub> = ${num(Vi)} · ${num(m.r2)}/${num(m.r1 + m.r2)} = <b>${voltio(m.v)}</b> (${dif(err)}).` },
      { t: 'Current and power', html: `I = V<sub>in</sub>/(R<sub>1</sub> + R<sub>2</sub>) = ${amp(I)}; P<sub>1</sub> = ${vatio(I * I * m.r1)} and P<sub>2</sub> = ${vatio(I * I * m.r2)}${potencia(Math.max(I * I * m.r1, I * I * m.r2)) ? `: ${nomP(potencia(Math.max(I * I * m.r1, I * I * m.r2)))} ones will do` : ''}.` },
    ];
    const k = tol / 100, Vmin = (Vi * m.r2 * (1 - k)) / (m.r2 * (1 - k) + m.r1 * (1 + k)), Vmax = (Vi * m.r2 * (1 + k)) / (m.r2 * (1 + k) + m.r1 * (1 - k));
    pasos.push({ t: `With the tolerance of ±${num(tol)} %`, html: `In the worst case the resistors deviate ±${num(tol)} % in opposite directions and the output lies between <b>${voltio(Vmin)}</b> (R<sub>2</sub> at its minimum, R<sub>1</sub> at its maximum) and <b>${voltio(Vmax)}</b> (the other way round), that is, ${dif(rel(Vmin, Vo))} and ${dif(rel(Vmax, Vo))} with respect to the requested value. ${Vmin <= Vo && Vo <= Vmax ? 'The requested value falls within that range.' : 'The requested value falls outside the range: use a series with a lower tolerance.'}` });
    const Pm = Math.max(I * I * m.r1, I * I * m.r2), Pnom = potencia(Pm);
    let aviso = null;
    if (!Pnom) aviso = `Each resistor dissipates up to ${vatio(Pm)}: that is more than a single one can withstand (10 W with a safety factor of two). Raise the total resistance to lower the current.`;
    else if (Pnom > 0.25) aviso = `Careful: each resistor dissipates up to ${vatio(Pm)}, and with a safety factor of two ${nomP(Pnom)} ones are needed; the usual 1/4 W ones would burn out. Raise the total resistance or use higher-power resistors.`;
    let Vc = null;
    if (RL !== null) {
      const Rp = (m.r2 * RL) / (m.r2 + RL); Vc = (Vi * Rp) / (m.r1 + Rp);
      pasos.push({ t: `With a load of ${ohm(RL)}`, html: `The load sits in parallel with R<sub>2</sub>: ${ohm(m.r2)} ‖ ${ohm(RL)} = ${ohm(Rp)}, and the output drops to <b>${voltio(Vc)}</b> (${dif(rel(Vc, Vo))}). ${RL < 10 * m.r2 ? 'For the load not to change it, R<sub>2</sub> must be much smaller than the load (about 10 times).' : 'Since the load is much larger than R<sub>2</sub>, it hardly changes.'}` });
    }
    return { modo: 'divisor', R1: m.r1, R2: m.r2, V: m.v, err, I, Vc, serie: ser, tol, Vmin, Vmax, Pm, Pnom, aviso, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'valor') return valor(sc);
    if (sc.modo === 'smd') return smd(sc);
    if (sc.modo === 'condensador') return condensador(sc);
    if (sc.modo === 'asociacion') return asociacion(sc);
    if (sc.modo === 'pareja') return pareja(sc);
    if (sc.modo === 'led') return led(sc);
    if (sc.modo === 'divisor') return divisor(sc);
    return colores(sc);
  }

  const ejemplos = [
    { clave: 'cuatro', nombre: '4 bandas: amarillo, violeta, rojo, oro', sc: { modo: 'colores', bandas: '4', b1: 'amarillo', b2: 'violeta', b3: 'rojo', b4: 'oro' } },
    { clave: 'mil', nombre: '4 bands: brown, black, red, gold', sc: { modo: 'colores', bandas: '4', b1: 'marron', b2: 'negro', b3: 'rojo', b4: 'oro' } },
    { clave: 'baja', nombre: '4 bands under 10 Ω: red, red, gold, gold', sc: { modo: 'colores', bandas: '4', b1: 'rojo', b2: 'rojo', b3: 'oro', b4: 'oro' } },
    { clave: 'cinco', nombre: '5 bands: brown, black, black, brown, brown', sc: { modo: 'colores', bandas: '5', b1: 'marron', b2: 'negro', b3: 'negro', b4: 'marron', b5: 'marron' } },
    { clave: 'seis', nombre: '6 bandas: 10 kΩ ±1 % y 100 ppm/K', sc: { modo: 'colores', bandas: '6', b1: 'marron', b2: 'negro', b3: 'negro', b4: 'rojo', b5: 'marron', b6: 'marron' } },
    { clave: 'tres', nombre: '3 bands: brown, black, orange', sc: { modo: 'colores', bandas: '3', b1: 'marron', b2: 'negro', b3: 'naranja' } },
    { clave: 'valor-4k7', nombre: 'Colours of 4k7', sc: { modo: 'valor', valor: '4k7', bandas: '4', serie: 'E24', tol: 'oro' } },
    { clave: 'valor-raro', nombre: 'Non-standard value: 5000 Ω', sc: { modo: 'valor', valor: '5000', bandas: '4', serie: 'E12', tol: 'oro' } },
    { clave: 'valor-precision', nombre: 'Precision: 12.4 kΩ with 5 bands', sc: { modo: 'valor', valor: '12,4k', bandas: '5', serie: 'E96', tol: 'marron' } },
    { clave: 'smd-472', nombre: 'SMD 472', sc: { modo: 'smd', codigo: '472' } },
    { clave: 'smd-4r7', nombre: 'SMD 4R7', sc: { modo: 'smd', codigo: '4R7' } },
    { clave: 'smd-eia', nombre: 'SMD EIA-96: 01C', sc: { modo: 'smd', codigo: '01C' } },
    { clave: 'reves', nombre: '5 bands read backwards: brown, brown, white, white, yellow', sc: { modo: 'colores', bandas: '5', b1: 'marron', b2: 'marron', b3: 'blanco', b4: 'blanco', b5: 'amarillo' } },
    { clave: 'bobina', nombre: 'Inductor: brown, black, black, silver (10 μH)', sc: { modo: 'colores', comp: 'L', bandas: '4', b1: 'marron', b2: 'negro', b3: 'negro', b4: 'plata' } },
    { clave: 'cond-104', nombre: 'Capacitor 104K 2A', sc: { modo: 'condensador', codigo: '104K 2A' } },
    { clave: 'cond-4n7', nombre: 'Capacitor 4n7J', sc: { modo: 'condensador', codigo: '4n7J' } },
    { clave: 'asoc', nombre: 'Combination: 100 + (220 ‖ 330)', sc: { modo: 'asociacion', expr: '100 + (220 || 330)', V: '12' } },
    { clave: 'asoc-iguales', nombre: 'Combination: three 1 kΩ in parallel and in series with 4k7', sc: { modo: 'asociacion', expr: '(1k || 1k || 1k) + 4k7', V: '' } },
    { clave: 'pareja', nombre: '5 kΩ with two from the E12', sc: { modo: 'pareja', R: '5k', serie: 'E12' } },
    { clave: 'led', nombre: 'LED rojo a 9 V y 20 mA', sc: { modo: 'led', Vs: '9', Vled: '2', I: '20', serie: 'E12' } },
    { clave: 'divisor', nombre: 'Divider from 12 V to 5 V', sc: { modo: 'divisor', Vin: '12', Vout: '5', Rt: '10k', serie: 'E12', RL: '' } },
  ];

  return { resolver, colores, valor, smd, condensador, asociacion, pareja, led, divisor, leeValor, normalizado, ohm, henrio, faradio, COLORES, CIFRAS, MULTS, TOLS, TCS, SERIES, ejemplos };
})();

