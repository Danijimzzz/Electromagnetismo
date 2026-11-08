/* =====================================================================
   Código de colores de resistencias (sin DOM): de los colores al valor
   (3, 4, 5 y 6 bandas, IEC 60062), del valor a los colores con el valor
   normalizado más cercano de las series E6 a E96, los códigos SMD de
   3 y 4 cifras, con R, y EIA-96, el código de colores de las bobinas y
   el impreso de los condensadores, la asociación en serie y en paralelo
   escrita como expresión, la mejor pareja de normalizadas para un valor,
   la resistencia de un LED y el divisor de tensión con normalizadas.
   Los campos con números se leen con Herramienta.leeSI.
   ===================================================================== */
const Resistencias = (() => {
  // color: cifra, multiplicador (potencia de 10), tolerancia (%), coeficiente de temperatura (ppm/K), color de dibujo
  const COLORES = [
    { k: 'negro', n: 'Negro', d: 0, m: 0, tc: 250, hex: '#1b1b1b' },
    { k: 'marron', n: 'Marrón', d: 1, m: 1, tol: 1, tc: 100, hex: '#7b4a26' },
    { k: 'rojo', n: 'Rojo', d: 2, m: 2, tol: 2, tc: 50, hex: '#d0302a' },
    { k: 'naranja', n: 'Naranja', d: 3, m: 3, tol: 0.05, tc: 15, hex: '#ef7d1a' },
    { k: 'amarillo', n: 'Amarillo', d: 4, m: 4, tol: 0.02, tc: 25, hex: '#f2cf1d' },
    { k: 'verde', n: 'Verde', d: 5, m: 5, tol: 0.5, tc: 20, hex: '#2e9a48' },
    { k: 'azul', n: 'Azul', d: 6, m: 6, tol: 0.25, tc: 10, hex: '#2a63c4' },
    { k: 'violeta', n: 'Violeta', d: 7, m: 7, tol: 0.1, tc: 5, hex: '#8a4fc2' },
    { k: 'gris', n: 'Gris', d: 8, m: 8, tol: 0.01, tc: 1, hex: '#8d8f93' },
    { k: 'blanco', n: 'Blanco', d: 9, m: 9, hex: '#f4f4f0' },
    { k: 'oro', n: 'Oro', m: -1, tol: 5, hex: '#c8a03c' },
    { k: 'plata', n: 'Plata', m: -2, tol: 10, hex: '#c4c6c9' },
    { k: 'ninguno', n: 'Sin banda', tol: 20, hex: null },
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

  // 4700 → '4,7 kΩ'
  function ohm(x, cifras = 4) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0 Ω';
    const pref = [[1e9, 'GΩ'], [1e6, 'MΩ'], [1e3, 'kΩ'], [1, 'Ω'], [1e-3, 'mΩ']];
    const [div, u] = pref.find(([d]) => Math.abs(x) >= d * 0.9999999) || pref[pref.length - 1];
    return `${String(+(x / div).toPrecision(cifras)).replace('.', ',')} ${u}`;
  }
  // 4,7 μH (el valor de una bobina va en μH)
  function henrio(x, cifras = 4) {
    const pref = [[1e6, 'H'], [1e3, 'mH'], [1, 'μH'], [1e-3, 'nH']];
    const [div, u] = pref.find(([d]) => Math.abs(x) >= d * 0.9999999) || pref[pref.length - 1];
    return `${String(+(x / div).toPrecision(cifras)).replace('.', ',')} ${u}`;
  }
  // 1e-7 → '100 nF'
  function faradio(x, cifras = 4) {
    const pref = [[1, 'F'], [1e-3, 'mF'], [1e-6, 'μF'], [1e-9, 'nF'], [1e-12, 'pF']];
    const [div, u] = pref.find(([d]) => Math.abs(x) >= d * 0.9999999) || pref[pref.length - 1];
    return `${String(+(x / div).toPrecision(cifras)).replace('.', ',')} ${u}`;
  }
  const num = (x, c = 4) => String(+(+x).toPrecision(c)).replace('.', ',').replace('-', '−');
  const pct = (x) => `${num(x)} %`;

  /* ---------- De los colores al valor ---------- */
  // sc: { bandas: 3|4|5|6, b1..b6 } (claves de color)
  function colores(sc) {
    const n = +sc.bandas || 4, bob = sc.comp === 'L', un = bob ? henrio : ohm;
    if (![3, 4, 5, 6].includes(n)) throw new Error('Una resistencia tiene 3, 4, 5 o 6 bandas');
    if (bob && n !== 4) throw new Error('Las bobinas con código de colores llevan 4 bandas');
    if (n !== 3 && ['oro', 'plata'].includes(sc.b1)) throw new Error('La primera banda no puede ser oro ni plata: estás leyendo la resistencia al revés, empieza por el otro extremo');
    const nc = n >= 5 ? 3 : 2, b = (i) => C[sc[`b${i}`]];
    const cif = [];
    for (let i = 1; i <= nc; i++) {
      const c = b(i);
      if (!c || c.d === undefined) throw new Error(`La banda ${i} es una cifra: no puede ser ${c ? c.n.toLowerCase() : 'vacía'}`);
      cif.push(c);
    }
    if (cif[0].d === 0) throw new Error('La primera banda no puede ser negra: si lo es, estás leyendo la resistencia al revés');
    const cm = b(nc + 1);
    if (!cm || cm.m === undefined) throw new Error(`La banda ${nc + 1} es el multiplicador: no puede ser ${cm ? cm.n.toLowerCase() : 'vacía'}`);
    let ct = n === 3 ? C.ninguno : b(nc + 2);
    if (!ct || ct.tol === undefined) throw new Error(`La banda ${nc + 2} es la tolerancia: no puede ser ${ct ? ct.n.toLowerCase() : 'vacía'}`);
    const ctc = n === 6 ? b(6) : null;
    if (n === 6 && (!ctc || ctc.tc === undefined)) throw new Error('La sexta banda es el coeficiente de temperatura: tiene que ser negra, marrón, roja, naranja, amarilla, verde, azul, violeta o gris');
    const base = +cif.map((c) => c.d).join(''), R = base * 10 ** cm.m;
    const Rr = +R.toPrecision(12), tol = ct.tol, min = Rr * (1 - tol / 100), max = Rr * (1 + tol / 100);
    const pasos = [
      ...(bob ? [{ t: 'Bobina', html: 'Las bobinas usan el mismo código que las resistencias, pero el valor sale en microhenrios (μH): oro como multiplicador es ×0,1 μH.' }] : []),
      { t: 'Cómo se lee', html: `${n === 3 ? 'Tres bandas: dos cifras y el multiplicador; sin banda de tolerancia es ±20 %.' : n === 4 ? 'Cuatro bandas: dos cifras, el multiplicador y la tolerancia.' : n === 5 ? 'Cinco bandas (resistencias de precisión): tres cifras, el multiplicador y la tolerancia.' : 'Seis bandas: tres cifras, el multiplicador, la tolerancia y el coeficiente de temperatura.'} Se empieza por el lado contrario a la banda de tolerancia, que suele estar más separada.` },
      { t: 'Cifras', html: cif.map((c, i) => `banda ${i + 1}: ${c.n.toLowerCase()} = ${c.d}`).join(', ') + ` → <b>${base}</b>` },
      { t: 'Multiplicador', html: `${cm.n.toLowerCase()} = $×10^{${cm.m < 0 ? '−' + -cm.m : cm.m}}$ → $${bob ? 'L' : 'R'} = ${base} · 10^{${cm.m < 0 ? '−' + -cm.m : cm.m}}$ = <b>${num(Rr, 12)} ${bob ? 'μH' : 'Ω'} = ${un(Rr)}</b>` },
      { t: 'Tolerancia', html: `${ct === C.ninguno ? 'sin banda' : ct.n.toLowerCase()} = ±${pct(tol)} → el valor real está entre $${num(Rr, 12)} · (1 − ${num(tol / 100)})$ = <b>${un(min, 5)}</b> y $${num(Rr, 12)} · (1 + ${num(tol / 100)})$ = <b>${un(max, 5)}</b>` },
    ];
    if (bob) { pasos.push({ t: 'Serie normalizada', html: normalizado(Rr).exacta ? `${un(Rr)} es un valor de la serie <b>${normalizado(Rr).exacta}</b>.` : `${un(Rr)} no es un valor de las series E: comprueba los colores.` }); return { modo: 'colores', comp: 'L', n, R: Rr, L: Rr * 1e-6, tol, min, max, tc: null, bandas: [...cif, cm, ct].map((c) => c.k), serie: normalizado(Rr).exacta, aviso: null, pasos }; }
    if (ctc) pasos.push({ t: 'Coeficiente de temperatura', html: `${ctc.n.toLowerCase()} = ${ctc.tc} ppm/K: por cada grado que sube la temperatura, R cambia ${ctc.tc}·10<sup>−6</sup> de su valor, unos ${ohm((Rr * ctc.tc) / 1e6, 3)} por grado.` });
    const serie = normalizado(Rr);
    pasos.push({ t: 'Serie normalizada', html: serie.exacta ? `${ohm(Rr)} es un valor de la serie <b>${serie.exacta}</b> (y de las mayores).` : `${ohm(Rr)} no es un valor normalizado de las series E6 a E96: comprueba que has leído bien los colores.` });
    // ¿y si se está leyendo al revés? (solo con 4 y 5 bandas, que son simétricas salvo por la separación)
    let aviso = null;
    const rev = (n === 4 || n === 5) && !sc.sinReves ? alReves(sc, n) : null;
    if (rev) {
      if (!serie.exacta && rev.serie) aviso = `Así no es un valor normalizado, pero leída al revés sería ${ohm(rev.R)} ±${pct(rev.tol)}, que sí lo es: seguramente la estás leyendo al revés.`;
      pasos.push({ t: 'Leída al revés', html: `Empezando por el otro extremo serían ${rev.bandas.map((k) => C[k].n.toLowerCase()).join(', ')}: ${ohm(rev.R)} ±${pct(rev.tol)}${rev.serie ? ` (de la serie ${rev.serie})` : ' (no normalizado)'}. ${aviso ? '<b>Es más probable esta lectura.</b>' : serie.exacta && !rev.serie ? 'Como no es normalizado, la lectura buena es la primera.' : 'Las dos lecturas son posibles: la buena empieza por el extremo contrario a la banda más separada.'}` });
    }
    return { modo: 'colores', n, R: Rr, tol, min, max, tc: ctc ? ctc.tc : null, bandas: [...cif, cm, ...(n === 3 ? [] : [ct]), ...(ctc ? [ctc] : [])].map((c) => c.k), serie: serie.exacta, aviso, reves: rev ? rev.R : null, pasos };
  }
  function alReves(sc, n) {
    const r = { bandas: String(n), sinReves: true };
    for (let i = 1; i <= n; i++) r[`b${i}`] = sc[`b${n + 1 - i}`];
    try { return colores(r); } catch (e) { return null; }
  }

  // las series que contienen el valor (por sus cifras significativas)
  function normalizado(R) {
    const e = Math.floor(Math.log10(R) + 1e-9), m2 = Math.round((R / 10 ** (e - 1)) * 1e6) / 1e6, m3 = Math.round((R / 10 ** (e - 2)) * 1e6) / 1e6;
    for (const s of ['E6', 'E12', 'E24']) if (SERIES[s].includes(m2)) return { exacta: s };
    for (const s of ['E48', 'E96', 'E192']) if (SERIES[s].includes(m3)) return { exacta: s };
    return { exacta: null };
  }

  /* ---------- Del valor a los colores ---------- */
  // admite 4700, 4,7k, 4k7, 4.7 kΩ, 470R, 2M2, 0R47, 1e3
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
    // R = cifras (nc dígitos) · 10^m
    const e = Math.floor(Math.log10(R) + 1e-9), m = e - nc + 1, cif = Math.round(R / 10 ** m);
    if (cif >= 10 ** nc) return bandasDe(10 ** (e + 1), nc);
    return { cifras: String(cif).padStart(nc, '0').split('').map(Number), m, exacto: Math.abs(cif * 10 ** m - R) <= 1e-9 * R };
  }
  // sc: { valor, serie: 'E12'…, bandas: 4|5, tol: clave de color }
  function valor(sc) {
    const R = leeValor(sc.valor);
    if (R === null) throw new Error('Escribe el valor de la resistencia, por ejemplo 4k7 o 4700');
    if (!isFinite(R)) throw new Error('No entiendo el valor: escríbelo como 4700, 4,7k, 4k7, 2M2 o 470R');
    if (R < 0.1 || R >= 1e11) throw new Error('Con colores solo se pueden escribir valores entre 0,1 Ω y 99 GΩ');
    const n = +sc.bandas === 5 ? 5 : 4, nc = n === 5 ? 3 : 2;
    const ser = SERIES[sc.serie] ? sc.serie : n === 5 ? 'E96' : 'E24';
    // el valor normalizado más cercano (en escala logarítmica, que es como se reparten)
    const e = Math.floor(Math.log10(R) + 1e-9), lista = SERIES[ser], dig = lista[0] >= 100 ? 3 : 2;
    let mejor = null;
    for (const k of [e - 1, e, e + 1]) for (const v of lista) { const x = +(v * 10 ** (k - dig + 1)).toPrecision(12), d = Math.abs(Math.log(x / R)); if (!mejor || d < mejor.d) mejor = { x, d }; }
    const Rn = mejor.x, err = (100 * (Rn - R)) / R;
    const b = bandasDe(R, nc), bn = bandasDe(Rn, nc);
    const col = (bb) => [...bb.cifras.map((d) => CIFRAS[d].k), MULTS.find((c) => c.m === bb.m)?.k ?? null];
    const tolK = TOLS.some((c) => c.k === sc.tol) ? sc.tol : n === 5 ? 'marron' : 'oro';
    const bandas = col(b), bandasN = col(bn);
    if (bandas.includes(null)) throw new Error('Ese valor no se puede escribir con un multiplicador de colores');
    const nombre = (ks) => ks.map((k) => C[k].n.toLowerCase()).join(' – ');
    const pasos = [
      { t: 'Valor', html: `R = <b>${num(R, 12)} Ω</b> = ${ohm(R)}` },
      { t: `Cifras significativas (${nc})`, html: `$${num(R, 12)} = ${b.cifras.join('')} · 10^{${b.m < 0 ? '−' + -b.m : b.m}}$${b.exacto ? '' : ` (redondeado: con ${nc} cifras no se puede escribir exactamente)`} → cifras ${b.cifras.join(', ')} y multiplicador $10^{${b.m < 0 ? '−' + -b.m : b.m}}$` },
      { t: 'Colores', html: `<b>${nombre([...bandas, tolK])}</b> (${b.cifras.map((d) => `${d} = ${CIFRAS[d].n.toLowerCase()}`).join(', ')}, $×10^{${b.m < 0 ? '−' + -b.m : b.m}}$ = ${C[bandas[nc]].n.toLowerCase()}, ±${pct(C[tolK].tol)} = ${C[tolK].n.toLowerCase()})` },
      { t: `Valor normalizado más cercano (serie ${ser}, ±${TOL_SERIE[ser]} %)`, html: Math.abs(err) < 1e-9 ? `${ohm(R)} ya es un valor de la serie ${ser}.` : `<b>${ohm(Rn)}</b>, a un ${num(Math.abs(err), 3)} % ${err > 0 ? 'por encima' : 'por debajo'}. Sus colores: ${nombre([...bandasN, tolK])}.` },
    ];
    return { modo: 'valor', R, n, serie: ser, Rn, err, bandas: [...bandas, tolK], bandasN: [...bandasN, tolK], tol: C[tolK].tol, exacto: b.exacto, pasos };
  }

  /* ---------- Códigos SMD ---------- */
  const EIA_MULT = { Z: -3, Y: -2, R: -2, X: -1, S: -1, A: 0, B: 1, H: 1, C: 2, D: 3, E: 4, F: 5 };
  // sc: { codigo }
  function smd(sc) {
    const t = String(sc.codigo ?? '').trim().toUpperCase().replace(/\s/g, '');
    if (!t) throw new Error('Escribe el código que lleva impreso la resistencia, por ejemplo 472, 4702, 4R7 o 01C');
    let R, como, pasos = [];
    let m;
    if ((m = t.match(/^(\d{2})([ZYRXSABHCDEF])$/)) && +m[1] >= 1 && +m[1] <= 96) {
      const base = SERIES.E96[+m[1] - 1], e = EIA_MULT[m[2]];
      R = +(base * 10 ** e).toPrecision(12); como = 'EIA-96 (resistencias del 1 %)';
      pasos.push({ t: 'Código EIA-96', html: `Dos cifras que dan la posición en la serie E96 y una letra que es el multiplicador: ${m[1]} → ${base} (el valor número ${+m[1]} de la serie), ${m[2]} → $×10^{${e < 0 ? '−' + -e : e}}$` });
      pasos.push({ t: 'Valor', html: `$R = ${base} · 10^{${e < 0 ? '−' + -e : e}}$ = <b>${ohm(R)}</b>` });
    } else if (/^\d*R\d+$|^\d+R\d*$/.test(t)) {
      R = +t.replace('R', '.'); como = 'con R (la R es la coma decimal)';
      pasos.push({ t: 'Código con R', html: `La R marca dónde va la coma: ${t} → <b>${ohm(R)}</b>` });
    } else if (/^\d{3,4}$/.test(t)) {
      const c = t.length - 1, cif = t.slice(0, c), e = +t[c];
      R = +cif * 10 ** e; como = t.length === 3 ? 'de 3 cifras (5 %)' : 'de 4 cifras (1 %)';
      pasos.push({ t: `Código de ${t.length} cifras`, html: `Las ${c} primeras son las cifras y la última, cuántos ceros se añaden: ${cif} y ${e} cero${e === 1 ? '' : 's'} → $R = ${+cif} · 10^${e}$ = <b>${ohm(R)}</b>${R === 0 ? ' (un puente de 0 Ω)' : ''}` });
    } else if (/^0+$/.test(t)) {
      R = 0; como = 'puente'; pasos.push({ t: 'Puente de 0 Ω', html: 'Un 0, 00 o 000 es un puente: una resistencia de 0 Ω que solo sirve para unir dos pistas.' });
    } else throw new Error('No reconozco el código: prueba con 3 o 4 cifras (472, 4702), con R (4R7, R10) o EIA-96 (01C)');
    return { modo: 'smd', codigo: t, R, como, pasos };
  }


  /* ---------- Código de los condensadores ---------- */
  const TOL_C = { B: '±0,1 pF', C: '±0,25 pF', D: '±0,5 pF', F: '±1 %', G: '±2 %', J: '±5 %', K: '±10 %', M: '±20 %', Z: '+80 % / −20 %' };
  const VOLT_C = { '0G': 4, '0L': 5.5, '0J': 6.3, '1A': 10, '1C': 16, '1D': 20, '1E': 25, '1V': 35, '1H': 50, '1J': 63, '1K': 80, '2A': 100, '2Q': 110, '2B': 125, '2C': 160, '2Z': 180, '2D': 200, '2P': 220, '2E': 250, '2F': 315, '2V': 350, '2G': 400, '2W': 450, '2H': 500, '2J': 630, '3A': 1000 };
  // sc: { codigo } como 104, 104K, 104J 2A, 472 100V, 4n7, 47p o 2,2u
  function condensador(sc) {
    const crudo = String(sc.codigo ?? '').trim();
    if (!crudo) throw new Error('Escribe el código que lleva impreso el condensador, por ejemplo 104, 104K 2A, 4n7 o 47p');
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
      if (e === 6 || e === 7) throw new Error(`Un ${t[2]} como tercera cifra no se usa: el multiplicador va de 0 a 5 (o 8 y 9 para ×0,01 y ×0,1)`);
      C = +(+t.slice(0, 2) * 10 ** pot).toPrecision(12) * 1e-12; como = 'código de 3 cifras en pF';
      pasos.push({ t: 'Código de 3 cifras', html: `Igual que en las resistencias SMD, pero en picofaradios: las dos primeras son las cifras y la tercera, los ceros. ${t.slice(0, 2)} y ${pot >= 0 ? `${pot} cero${pot === 1 ? '' : 's'}` : `×10<sup>${pot}</sup>`} → $C = ${+t.slice(0, 2)} · 10^{${pot < 0 ? '−' + -pot : pot}}$ pF = <b>${faradio(C)}</b>` });
    } else if (/^\d{1,2}$/.test(t)) {
      C = +t * 1e-12; como = 'valor en pF';
      pasos.push({ t: 'Una o dos cifras', html: `Con solo una o dos cifras es directamente el valor en picofaradios: <b>${faradio(C)}</b>` });
    } else {
      C = Herramienta.leeSI(t.replace(/F$/i, '').replace(/^(\d*)([pnuµμ])$/, '$1$2'), 1e-12);
      if (!(C > 0)) throw new Error('No reconozco el código: prueba con 3 cifras (104, 472J), una letra en la coma (4n7, 2u2) o el valor con su prefijo (47p, 100nF)');
      como = /\d[pnuµμ]\d/i.test(t) ? 'la letra del prefijo hace de coma' : 'valor con prefijo';
      pasos.push({ t: como === 'valor con prefijo' ? 'Valor con prefijo' : 'Letra como coma', html: `${como === 'valor con prefijo' ? 'El valor va escrito con su prefijo' : 'Como en 4k7, la letra (p, n o u = μ) es el prefijo y marca dónde va la coma'}: ${esc(t)} → <b>${faradio(C)}</b>` });
    }
    if (tol) pasos.push({ t: 'Tolerancia', html: `La letra ${tol} es ${TOL_C[tol]}${/[BCD]/.test(tol) ? ' (en pF: se usa en condensadores pequeños)' : ''}${/%/.test(TOL_C[tol]) && !/Z/.test(tol) ? `: el valor real está entre ${faradio(C * (1 - parseFloat(TOL_C[tol].slice(1).replace(',', '.')) / 100))} y ${faradio(C * (1 + parseFloat(TOL_C[tol].slice(1).replace(',', '.')) / 100))}` : ''}.` });
    if (V) pasos.push({ t: 'Tensión máxima', html: V.codigo ? `${V.codigo} es el código EIA de la tensión: <b>${num(V.v)} V</b> como máximo.` : `Aguanta como máximo <b>${num(V.v)} V</b>.` });
    pasos.push({ t: 'En otras unidades', html: `${faradio(C)} = ${num(C * 1e12, 6)} pF = ${num(C * 1e9, 6)} nF = ${num(C * 1e6, 6)} μF` });
    return { modo: 'condensador', C, como, tol: tol ? TOL_C[tol] : null, V: V ? V.v : null, pasos };
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Asociación en serie y en paralelo ---------- */
  // «100 + (220 ‖ 330)»: + es serie y ‖ (o || o //) paralelo, que va antes que la suma
  function arbol(texto) {
    const t = String(texto ?? '').replace(/\|\||\/\/|∥/g, '‖').replace(/Ω|ohmios?|ohms?/gi, ''), toks = [];
    for (let i = 0; i < t.length;) {
      const c = t[i];
      if (/\s/.test(c)) { i++; continue; }
      if ('+‖()'.includes(c)) { toks.push(c); i++; continue; }
      const m = t.slice(i).match(/^[\d.,]+(?:e[+-]?\d+)?[RrkKMGm]?\d*/);
      if (!m) throw new Error(`No entiendo «${t.slice(i, i + 6)}»: usa números (100, 4k7, 2,2k), + para serie, ‖ o || para paralelo y paréntesis`);
      const v = leeValor(m[0]);
      if (!(v >= 0)) throw new Error(`«${m[0]}» no es un valor de resistencia`);
      toks.push({ v, t: m[0] }); i += m[0].length;
    }
    if (!toks.length) throw new Error('Escribe la asociación, por ejemplo 100 + (220 ‖ 330)');
    let k = 0;
    const ve = () => toks[k], come = (x) => { if (toks[k] !== x) throw new Error(`Falta «${x}»${toks[k] ? ` antes de «${typeof toks[k] === 'string' ? toks[k] : toks[k].t}»` : ' al final'}`); k++; };
    const prim = () => { const x = ve(); if (x === '(') { k++; const e = suma(); come(')'); return e; } if (x && typeof x === 'object') { k++; return { v: x.v }; } throw new Error(x ? `Sobra «${x}»` : 'La expresión acaba en un operador'); };
    const par = () => { const h = [prim()]; while (ve() === '‖') { k++; h.push(prim()); } return h.length === 1 ? h[0] : { op: '‖', h }; };
    function suma() { const h = [par()]; while (ve() === '+') { k++; h.push(par()); } return h.length === 1 ? h[0] : { op: '+', h }; }
    const e = suma();
    if (k < toks.length) throw new Error(`Sobra «${typeof toks[k] === 'string' ? toks[k] : toks[k].t}»`);
    return e;
  }
  // sc: { expr, V (opcional) }
  function asociacion(sc) {
    const raiz = arbol(sc.expr), pasos = [];
    const evalua = (n) => {
      if (n.v !== undefined) return n.v;
      const vs = n.h.map(evalua);
      let r, como;
      if (n.op === '+') { r = vs.reduce((a, b) => a + b, 0); como = `${vs.map((x) => ohm(x)).join(' + ')} = <b>${ohm(r)}</b>`; }
      else if (vs.some((x) => x === 0)) { r = 0; como = `${vs.map((x) => ohm(x)).join(' ‖ ')}: una de 0 Ω cortocircuita a las demás → <b>0 Ω</b>`; }
      else if (vs.every((x) => Math.abs(x - vs[0]) < 1e-12 * vs[0])) { r = vs[0] / vs.length; como = `${vs.length} iguales de ${ohm(vs[0])} en paralelo: R/${vs.length} = <b>${ohm(r)}</b>`; }
      else if (vs.length === 2) { r = (vs[0] * vs[1]) / (vs[0] + vs[1]); como = `${ohm(vs[0])} ‖ ${ohm(vs[1])} = $(${num(vs[0])} · ${num(vs[1])})/(${num(vs[0])} + ${num(vs[1])})$ = <b>${ohm(r)}</b> (producto partido por suma)`; }
      else { r = 1 / vs.reduce((a, b) => a + 1 / b, 0); como = `${vs.map((x) => ohm(x)).join(' ‖ ')} = 1/(${vs.map((x) => `1/${num(x)}`).join(' + ')}) = <b>${ohm(r)}</b>`; }
      pasos.push({ t: n.op === '+' ? 'En serie: se suman' : 'En paralelo: se suman las inversas', html: como });
      return r;
    };
    const R = evalua(raiz);
    if (!pasos.length) pasos.push({ t: 'Una sola resistencia', html: `No hay nada que asociar: <b>${ohm(R)}</b>` });
    const V = vacio(sc.V) ? null : Herramienta.leeSI(sc.V);
    if (V !== null && !isFinite(V)) throw new Error('La tensión debe ser un número');
    let I = null, P = null;
    if (V !== null) {
      if (R === 0) throw new Error('Con 0 Ω la corriente sería infinita: es un cortocircuito');
      I = V / R; P = V * I;
      pasos.push({ t: `Con ${num(V)} V aplicados`, html: `I = V/R = ${num(V)}/${num(R)} = <b>${amp(I)}</b> y la potencia total, P = V·I = V<sup>2</sup>/R = <b>${vatio(P)}</b>` });
    }
    return { modo: 'asociacion', R, V, I, P, pasos };
  }
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const conPref = (u) => (x, c = 4) => { if (!isFinite(x)) return '—'; if (x === 0) return `0 ${u}`; const p = [[1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n']].find(([d]) => Math.abs(x) >= d * 0.9999999) || [1e-9, 'n']; return `${String(+(x / p[0]).toPrecision(c)).replace('.', ',').replace('-', '−')} ${p[1]}${u}`; };
  const amp = conPref('A'), vatio = conPref('W'), voltio = conPref('V');

  /* ---------- Valores normalizados de 1 Ω a 82 MΩ ---------- */
  const DE_SERIE = {};
  function valoresDe(ser) {
    if (DE_SERIE[ser]) return DE_SERIE[ser];
    const l = SERIES[ser], dig = l[0] >= 100 ? 3 : 2, out = [];
    for (let k = 0; k <= 7; k++) for (const v of l) out.push(+(v * 10 ** (k - dig + 1)).toPrecision(12));
    return (DE_SERIE[ser] = out);
  }
  const serieDe = (sc, def = 'E12') => (SERIES[sc.serie] ? sc.serie : def);
  const leePos = (v, nom, base = 1) => { if (vacio(v)) throw new Error(`Falta ${nom}`); const x = Herramienta.leeSI(v, base); if (!(x > 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número mayor que 0`); return x; };
  const leeTol = (v) => { const x = Herramienta.leeSI(v, 1); if (!(x >= 0 && x <= 50)) throw new Error('La tolerancia debe ser un porcentaje entre 0 y 50'); return x; };
  const rel = (x, R) => (100 * (x - R)) / R;
  const dif = (e) => (Math.abs(e) < 1e-9 ? 'exacto' : `${e > 0 ? '+' : '−'}${num(Math.abs(e), 3)} %`);

  /* ---------- La mejor pareja de normalizadas ---------- */
  // sc: { R, serie }
  function pareja(sc) {
    const R = leePos(sc.R, 'el valor que quieres'), ser = serieDe(sc), vals = valoresDe(ser);
    if (R < 2 || R > 1e7) throw new Error('Busca valores entre 2 Ω y 10 MΩ');
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
      { t: `Una sola de la serie ${ser}`, html: `La más cercana es <b>${ohm(uno.x)}</b> (${dif(uno.err)}).` },
      ...(s ? [{ t: 'Dos en serie', html: `Se prueban todas las parejas menores que ${ohm(R)}: la mejor es ${ohm(s.a)} + ${ohm(s.b)} = <b>${ohm(s.x)}</b> (${dif(s.err)}).` }] : []),
      ...(p ? [{ t: 'Dos en paralelo', html: `Y todas las parejas mayores: la mejor es ${ohm(p.a)} ‖ ${ohm(p.b)} = $(${num(p.a)} · ${num(p.b)})/(${num(p.a)} + ${num(p.b)})$ = <b>${ohm(p.x)}</b> (${dif(p.err)}).` }] : []),
      { t: 'La mejor', html: `<b>${mejor[0] === 'una sola' ? ohm(mejor[1].x) : `${ohm(mejor[1].a)} ${mejor[0] === 'en serie' ? '+' : '‖'} ${ohm(mejor[1].b)}`}</b> ${mejor[0]}, con un error del ${num(Math.abs(mejor[1].err), 3)} %${Math.abs(mejor[1].err) < TOL_SERIE[ser] / 2 ? `, menor que la tolerancia de la serie (±${TOL_SERIE[ser]} %)` : ''}.` },
    ];
    return { modo: 'pareja', R, serie: ser, uno, s, p, mejor: mejor[0], pasos };
  }

  /* ---------- Resistencia para un LED ---------- */
  const POTENCIAS = [0.125, 0.25, 0.5, 1, 2, 5, 10];
  const potencia = (P) => POTENCIAS.find((x) => x >= 2 * P) ?? null;
  const nomP = (x) => ({ 0.125: '1/8 W', 0.25: '1/4 W', 0.5: '1/2 W' }[x] || `${num(x)} W`);
  // sc: { Vs, Vled, I (mA), serie }
  function led(sc) {
    const Vs = leePos(sc.Vs, 'la tensión de la fuente'), Vl = leePos(sc.Vled, 'la tensión del LED'), I = leePos(sc.I, 'la corriente del LED', 1e-3), ser = serieDe(sc, 'E12');
    if (Vs <= Vl) throw new Error(`Con ${num(Vs)} V no se enciende un LED de ${num(Vl)} V: la fuente tiene que dar más tensión que el LED`);
    const R = (Vs - Vl) / I, Rn = valoresDe(ser).find((x) => x >= R * (1 - 1e-9));
    if (!Rn) throw new Error('Sale una resistencia demasiado grande');
    const In = (Vs - Vl) / Rn, P = In * In * Rn, Pn = potencia(P);
    const pasos = [
      { t: 'Ley de Ohm en la resistencia', html: `La resistencia se queda con lo que sobra de tensión: $R = (V_s − V_{LED})/I = (${num(Vs)} − ${num(Vl)})/${num(I)}$ = <b>${ohm(R)}</b>` },
      { t: `Normalizado (serie ${ser})`, html: Math.abs(Rn - R) < 1e-9 * R ? `${ohm(R)} ya es normalizado.` : `Se toma el siguiente valor hacia arriba, <b>${ohm(Rn)}</b>, para no pasar de la corriente máxima: I = (${num(Vs)} − ${num(Vl)})/${num(Rn)} = <b>${amp(In)}</b>.` },
      { t: 'Potencia', html: `En la resistencia: P = I<sup>2</sup>R = <b>${vatio(P)}</b>. Con margen del doble, ${Pn ? `basta una de <b>${nomP(Pn)}</b>` : 'hace falta más de 10 W: mejor baja la corriente o usa una fuente menor'}. El LED consume V·I = ${vatio(Vl * In)} y la fuente da ${vatio(Vs * In)} (rendimiento del ${num((100 * Vl) / Vs, 3)} %).` },
    ];
    const aviso = !Pn ? `La resistencia disipa ${vatio(P)}: es demasiado. Baja la corriente o usa una fuente menor.` : Pn > 0.25 ? `Ojo: la resistencia disipa ${vatio(P)} y con margen del doble hace falta de ${nomP(Pn)}; una de 1/4 W no aguantaría.` : null;
    return { modo: 'led', R, Rn, I: In, P, Pn, serie: ser, aviso, pasos };
  }

  /* ---------- Divisor de tensión ---------- */
  // sc: { Vin, Vout, Rt (orientativa: R₁ + R₂), serie, RL (carga, opcional) }
  function divisor(sc) {
    const Vi = leePos(sc.Vin, 'la tensión de entrada'), Vo = leePos(sc.Vout, 'la tensión de salida'), Rt = vacio(sc.Rt) ? 1e4 : leePos(sc.Rt, 'la resistencia total'), ser = serieDe(sc, 'E12');
    const tol = vacio(sc.tol) ? TOL_SERIE[ser] : leeTol(sc.tol);
    if (Vo >= Vi) throw new Error('Un divisor solo baja la tensión: la salida tiene que ser menor que la entrada');
    const RL = vacio(sc.RL) ? null : leePos(sc.RL, 'la carga');
    const vals = valoresDe(ser).filter((x) => x >= Rt / 30 && x <= Rt * 3);
    let m = null;
    for (const r1 of vals) for (const r2 of vals) {
      const t = r1 + r2;
      if (t < Rt / 3 || t > Rt * 3) continue;
      const v = (Vi * r2) / t, e = Math.abs(v - Vo) / Vo + 1e-4 * Math.abs(Math.log(t / Rt));
      if (!m || e < m.e) m = { r1, r2, v, e };
    }
    if (!m) throw new Error('No hay ninguna pareja normalizada para esa resistencia total');
    const R2i = (Rt * Vo) / Vi, R1i = Rt - R2i, I = Vi / (m.r1 + m.r2), err = rel(m.v, Vo);
    const pasos = [
      { t: 'Fórmula del divisor', html: `$V_{out} = V_{in} R_2/(R_1 + R_2)$ ⇒ $R_2/(R_1 + R_2) = ${num(Vo)}/${num(Vi)}$ = ${num(Vo / Vi)}. Con R<sub>1</sub> + R<sub>2</sub> = ${ohm(Rt)} saldrían R<sub>1</sub> = ${ohm(R1i)} y R<sub>2</sub> = ${ohm(R2i)}.` },
      { t: `Con valores de la serie ${ser}`, html: `La pareja que más se acerca es <b>R<sub>1</sub> = ${ohm(m.r1)}</b> y <b>R<sub>2</sub> = ${ohm(m.r2)}</b>: V<sub>out</sub> = ${num(Vi)} · ${num(m.r2)}/${num(m.r1 + m.r2)} = <b>${voltio(m.v)}</b> (${dif(err)}).` },
      { t: 'Corriente y potencia', html: `I = V<sub>in</sub>/(R<sub>1</sub> + R<sub>2</sub>) = ${amp(I)}; P<sub>1</sub> = ${vatio(I * I * m.r1)} y P<sub>2</sub> = ${vatio(I * I * m.r2)}${potencia(Math.max(I * I * m.r1, I * I * m.r2)) ? `: valen de ${nomP(potencia(Math.max(I * I * m.r1, I * I * m.r2)))}` : ''}.` },
    ];
    // peor caso con la tolerancia (RE-1): R₂ al mínimo y R₁ al máximo, y al revés
    const k = tol / 100, Vmin = (Vi * m.r2 * (1 - k)) / (m.r2 * (1 - k) + m.r1 * (1 + k)), Vmax = (Vi * m.r2 * (1 + k)) / (m.r2 * (1 + k) + m.r1 * (1 - k));
    pasos.push({ t: `Con la tolerancia de ±${num(tol)} %`, html: `En el peor caso las resistencias se desvían ±${num(tol)} % en sentidos contrarios y la salida queda entre <b>${voltio(Vmin)}</b> (R<sub>2</sub> al mínimo, R<sub>1</sub> al máximo) y <b>${voltio(Vmax)}</b> (al revés), es decir, ${dif(rel(Vmin, Vo))} y ${dif(rel(Vmax, Vo))} respecto de lo pedido. ${Vmin <= Vo && Vo <= Vmax ? 'El valor pedido cae dentro de ese margen.' : 'El valor pedido queda fuera del margen: usa una serie de menos tolerancia.'}` });
    const Pm = Math.max(I * I * m.r1, I * I * m.r2), Pnom = potencia(Pm);
    let aviso = null;
    if (!Pnom) aviso = `Cada resistencia disipa hasta ${vatio(Pm)}: es más de lo que aguanta una de las corrientes (10 W con margen del doble). Sube la resistencia total para bajar la corriente.`;
    else if (Pnom > 0.25) aviso = `Ojo: cada resistencia disipa hasta ${vatio(Pm)}, y con margen del doble hacen falta de ${nomP(Pnom)}; las de 1/4 W de siempre se quemarían. Sube la resistencia total o usa resistencias de más potencia.`;
    let Vc = null;
    if (RL !== null) {
      const Rp = (m.r2 * RL) / (m.r2 + RL); Vc = (Vi * Rp) / (m.r1 + Rp);
      pasos.push({ t: `Con una carga de ${ohm(RL)}`, html: `La carga queda en paralelo con R<sub>2</sub>: ${ohm(m.r2)} ‖ ${ohm(RL)} = ${ohm(Rp)}, y la salida baja a <b>${voltio(Vc)}</b> (${dif(rel(Vc, Vo))}). ${RL < 10 * m.r2 ? 'Para que la carga no la cambie, R<sub>2</sub> tiene que ser mucho menor que la carga (unas 10 veces).' : 'Como la carga es mucho mayor que R<sub>2</sub>, apenas cambia.'}` });
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
    { clave: 'mil', nombre: '4 bandas: marrón, negro, rojo, oro', sc: { modo: 'colores', bandas: '4', b1: 'marron', b2: 'negro', b3: 'rojo', b4: 'oro' } },
    { clave: 'baja', nombre: '4 bandas de menos de 10 Ω: rojo, rojo, oro, oro', sc: { modo: 'colores', bandas: '4', b1: 'rojo', b2: 'rojo', b3: 'oro', b4: 'oro' } },
    { clave: 'cinco', nombre: '5 bandas: marrón, negro, negro, marrón, marrón', sc: { modo: 'colores', bandas: '5', b1: 'marron', b2: 'negro', b3: 'negro', b4: 'marron', b5: 'marron' } },
    { clave: 'seis', nombre: '6 bandas: 10 kΩ ±1 % y 100 ppm/K', sc: { modo: 'colores', bandas: '6', b1: 'marron', b2: 'negro', b3: 'negro', b4: 'rojo', b5: 'marron', b6: 'marron' } },
    { clave: 'tres', nombre: '3 bandas: marrón, negro, naranja', sc: { modo: 'colores', bandas: '3', b1: 'marron', b2: 'negro', b3: 'naranja' } },
    { clave: 'valor-4k7', nombre: 'Colores de 4k7', sc: { modo: 'valor', valor: '4k7', bandas: '4', serie: 'E24', tol: 'oro' } },
    { clave: 'valor-raro', nombre: 'Valor no normalizado: 5000 Ω', sc: { modo: 'valor', valor: '5000', bandas: '4', serie: 'E12', tol: 'oro' } },
    { clave: 'valor-precision', nombre: 'Precisión: 12,4 kΩ con 5 bandas', sc: { modo: 'valor', valor: '12,4k', bandas: '5', serie: 'E96', tol: 'marron' } },
    { clave: 'smd-472', nombre: 'SMD 472', sc: { modo: 'smd', codigo: '472' } },
    { clave: 'smd-4r7', nombre: 'SMD 4R7', sc: { modo: 'smd', codigo: '4R7' } },
    { clave: 'smd-eia', nombre: 'SMD EIA-96: 01C', sc: { modo: 'smd', codigo: '01C' } },
    { clave: 'reves', nombre: '5 bandas leídas al revés: marrón, marrón, blanco, blanco, amarillo', sc: { modo: 'colores', bandas: '5', b1: 'marron', b2: 'marron', b3: 'blanco', b4: 'blanco', b5: 'amarillo' } },
    { clave: 'bobina', nombre: 'Bobina: marrón, negro, negro, plata (10 μH)', sc: { modo: 'colores', comp: 'L', bandas: '4', b1: 'marron', b2: 'negro', b3: 'negro', b4: 'plata' } },
    { clave: 'cond-104', nombre: 'Condensador 104K 2A', sc: { modo: 'condensador', codigo: '104K 2A' } },
    { clave: 'cond-4n7', nombre: 'Condensador 4n7J', sc: { modo: 'condensador', codigo: '4n7J' } },
    { clave: 'asoc', nombre: 'Asociación: 100 + (220 ‖ 330)', sc: { modo: 'asociacion', expr: '100 + (220 || 330)', V: '12' } },
    { clave: 'asoc-iguales', nombre: 'Asociación: tres de 1 kΩ en paralelo y en serie con 4k7', sc: { modo: 'asociacion', expr: '(1k || 1k || 1k) + 4k7', V: '' } },
    { clave: 'pareja', nombre: '5 kΩ con dos de la E12', sc: { modo: 'pareja', R: '5k', serie: 'E12' } },
    { clave: 'led', nombre: 'LED rojo a 9 V y 20 mA', sc: { modo: 'led', Vs: '9', Vled: '2', I: '20', serie: 'E12' } },
    { clave: 'divisor', nombre: 'Divisor de 12 V a 5 V', sc: { modo: 'divisor', Vin: '12', Vout: '5', Rt: '10k', serie: 'E12', RL: '' } },
  ];

  return { resolver, colores, valor, smd, condensador, asociacion, pareja, led, divisor, leeValor, normalizado, ohm, henrio, faradio, COLORES, CIFRAS, MULTS, TOLS, TCS, SERIES, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = Resistencias;
