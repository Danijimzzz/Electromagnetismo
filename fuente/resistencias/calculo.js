/* =====================================================================
   Código de colores de resistencias (sin DOM): de los colores al valor
   (3, 4, 5 y 6 bandas, IEC 60062), del valor a los colores con el valor
   normalizado más cercano de las series E6 a E96, y los códigos SMD de
   3 y 4 cifras, con R, y EIA-96.
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
  const TOL_SERIE = { E6: 20, E12: 10, E24: 5, E48: 2, E96: 1 };

  // 4700 → '4,7 kΩ'
  function ohm(x, cifras = 4) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0 Ω';
    const pref = [[1e9, 'GΩ'], [1e6, 'MΩ'], [1e3, 'kΩ'], [1, 'Ω'], [1e-3, 'mΩ']];
    const [div, u] = pref.find(([d]) => Math.abs(x) >= d * 0.9999999) || pref[pref.length - 1];
    return `${String(+(x / div).toPrecision(cifras)).replace('.', ',')} ${u}`;
  }
  const num = (x, c = 4) => String(+(+x).toPrecision(c)).replace('.', ',').replace('-', '−');
  const pct = (x) => `${num(x)} %`;

  /* ---------- De los colores al valor ---------- */
  // sc: { bandas: 3|4|5|6, b1..b6 } (claves de color)
  function colores(sc) {
    const n = +sc.bandas || 4;
    if (![3, 4, 5, 6].includes(n)) throw new Error('Una resistencia tiene 3, 4, 5 o 6 bandas');
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
      { t: 'Cómo se lee', html: `${n === 3 ? 'Tres bandas: dos cifras y el multiplicador; sin banda de tolerancia es ±20 %.' : n === 4 ? 'Cuatro bandas: dos cifras, el multiplicador y la tolerancia.' : n === 5 ? 'Cinco bandas (resistencias de precisión): tres cifras, el multiplicador y la tolerancia.' : 'Seis bandas: tres cifras, el multiplicador, la tolerancia y el coeficiente de temperatura.'} Se empieza por el lado contrario a la banda de tolerancia, que suele estar más separada.` },
      { t: 'Cifras', html: cif.map((c, i) => `banda ${i + 1}: ${c.n.toLowerCase()} = ${c.d}`).join(', ') + ` → <b>${base}</b>` },
      { t: 'Multiplicador', html: `${cm.n.toLowerCase()} = $×10^{${cm.m < 0 ? '−' + -cm.m : cm.m}}$ → $R = ${base} · 10^{${cm.m < 0 ? '−' + -cm.m : cm.m}}$ = <b>${num(Rr, 12)} Ω = ${ohm(Rr)}</b>` },
      { t: 'Tolerancia', html: `${ct === C.ninguno ? 'sin banda' : ct.n.toLowerCase()} = ±${pct(tol)} → el valor real está entre $${num(Rr, 12)} · (1 − ${num(tol / 100)})$ = <b>${ohm(min, 5)}</b> y $${num(Rr, 12)} · (1 + ${num(tol / 100)})$ = <b>${ohm(max, 5)}</b>` },
    ];
    if (ctc) pasos.push({ t: 'Coeficiente de temperatura', html: `${ctc.n.toLowerCase()} = ${ctc.tc} ppm/K: por cada grado que sube la temperatura, R cambia ${ctc.tc}·10<sup>−6</sup> de su valor, unos ${ohm((Rr * ctc.tc) / 1e6, 3)} por grado.` });
    const serie = normalizado(Rr);
    pasos.push({ t: 'Serie normalizada', html: serie.exacta ? `${ohm(Rr)} es un valor de la serie <b>${serie.exacta}</b> (y de las mayores).` : `${ohm(Rr)} no es un valor normalizado de las series E6 a E96: comprueba que has leído bien los colores.` });
    return { modo: 'colores', n, R: Rr, tol, min, max, tc: ctc ? ctc.tc : null, bandas: [...cif, cm, ...(n === 3 ? [] : [ct]), ...(ctc ? [ctc] : [])].map((c) => c.k), serie: serie.exacta, pasos };
  }

  // las series que contienen el valor (por sus cifras significativas)
  function normalizado(R) {
    const e = Math.floor(Math.log10(R) + 1e-9), m2 = Math.round((R / 10 ** (e - 1)) * 1e6) / 1e6, m3 = Math.round((R / 10 ** (e - 2)) * 1e6) / 1e6;
    for (const s of ['E6', 'E12', 'E24']) if (SERIES[s].includes(m2)) return { exacta: s };
    for (const s of ['E48', 'E96']) if (SERIES[s].includes(m3)) return { exacta: s };
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

  function resolver(sc) {
    if (sc.modo === 'valor') return valor(sc);
    if (sc.modo === 'smd') return smd(sc);
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
  ];

  return { resolver, colores, valor, smd, leeValor, normalizado, ohm, COLORES, CIFRAS, MULTS, TOLS, TCS, SERIES, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = Resistencias;
