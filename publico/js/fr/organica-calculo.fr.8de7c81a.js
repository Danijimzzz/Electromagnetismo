const Organica = (() => {
  const VAL = { C: 4, N: 3, O: 2, S: 2, F: 1, Cl: 1, Br: 1, I: 1 };
  const ZA = { H: 1, C: 6, N: 7, O: 8, F: 9, S: 16, Cl: 17, Br: 35, I: 53 };
  const MASA = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, F: 18.998, S: 32.06, Cl: 35.453, Br: 79.904, I: 126.904 };
  const masaDe = (e) => (typeof Elementos !== 'undefined' && Elementos.porSimbolo[e]?.masa) || MASA[e];
  const coma = (x, d = 2) => String(+x.toFixed(d)).replace('.', ',').replace('-', '−');
  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (n) => (n === 1 ? '' : String(n).split('').map((c) => SUB[+c]).join(''));
  const IDI = 'fr';
  const NUM_ES = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec', 'undec', 'dodec', 'tridec', 'tetradec', 'pentadec', 'hexadec', 'heptadec', 'octadec', 'nonadec', 'icos'];
  const LX = {
    es: {
      NUM: NUM_ES, tetra: 'tetra', deca: 'deca', hal: { F: 'fluoro', Cl: 'cloro', Br: 'bromo', I: 'yodo' }, vo: 'o', eno: 'en', ino: 'in', il: 'il', oxi: 'oxi', tio: 'tio', carbonil: 'carbonil',
      oxo: 'oxo', hidroxi: 'hidroxi', amino: 'amino', mercapto: 'mercapto', carboxi: 'carboxi', formil: 'formil', carbamoil: 'carbamoil', ciano: 'ciano', fenil: 'fenil', metil: 'metil',
      ciclo: 'ciclo', benc: 'benc', bencen: 'bencen', benceno: 'benceno', tolueno: 'tolueno',
      suf: { cooh: 'oico', coor: 'oato', conh2: 'amide', cn: 'nitrile', cho: 'al', ceto: 'ona', oh: 'ol', sh: 'thiol', nh2: 'amine' },
      pos: { cooh: 'carboxylique', coor: 'carboxilato', conh2: 'carboxamida', cn: 'carbonitrilo', cho: 'carbaldéhyde' },
      bz: { oh: 'fenol', nh2: 'anilina', cooh: 'benzoico', cho: 'benzaldéhyde', conh2: 'benzamida', cn: 'benzonitrilo', coor: 'benzoato' },
      acido: (p, c) => `ácido ${p}${c}`, ester: (p, c, a) => `${p}${c} de ${a}o`,
    },
    en: {
      NUM: ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec', 'undec', 'dodec', 'tridec', 'tetradec', 'pentadec', 'hexadec', 'heptadec', 'octadec', 'nonadec', 'eicos'],
      tetra: 'tetra', deca: 'deca', hal: { F: 'fluoro', Cl: 'chloro', Br: 'bromo', I: 'iodo' }, vo: 'e', eno: 'en', ino: 'yn', il: 'yl', oxi: 'oxy', tio: 'sulfanyl', carbonil: 'carbonyl',
      oxo: 'oxo', hidroxi: 'hydroxy', amino: 'amino', mercapto: 'sulfanyl', carboxi: 'carboxy', formil: 'formyl', carbamoil: 'carbamoyl', ciano: 'cyano', fenil: 'phenyl', metil: 'methyl',
      ciclo: 'cyclo', benc: 'benz', bencen: 'benzen', benceno: 'benzene', tolueno: 'toluene',
      suf: { cooh: 'oic', coor: 'oate', conh2: 'amide', cn: 'nitrile', cho: 'al', ceto: 'one', oh: 'ol', sh: 'thiol', nh2: 'amine' },
      pos: { cooh: 'carboxylic', coor: 'carboxylate', conh2: 'carboxamide', cn: 'carbonitrile', cho: 'carbaldehyde' },
      bz: { oh: 'phenol', nh2: 'aniline', cooh: 'benzoic', cho: 'benzaldehyde', conh2: 'benzamide', cn: 'benzonitrile', coor: 'benzoate' },
      acido: (p, c) => `${p}${c} acid`, ester: (p, c, a) => `${a} ${p}${c}`,
    },
    fr: {
      NUM: ['', 'méth', 'éth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'déc', 'undéc', 'dodéc', 'tridéc', 'tétradéc', 'pentadéc', 'hexadéc', 'heptadéc', 'octadéc', 'nonadéc', 'eicos'],
      tetra: 'tétra', deca: 'déca', hal: { F: 'fluoro', Cl: 'chloro', Br: 'bromo', I: 'iodo' }, vo: 'e', eno: 'èn', ino: 'yn', il: 'yl', oxi: 'oxy', tio: 'sulfanyl', carbonil: 'carbonyl',
      oxo: 'oxo', hidroxi: 'hydroxy', amino: 'amino', mercapto: 'sulfanyl', carboxi: 'carboxy', formil: 'formyl', carbamoil: 'carbamoyl', ciano: 'cyano', fenil: 'phényl', metil: 'méthyl',
      ciclo: 'cyclo', benc: 'benz', bencen: 'benzèn', benceno: 'benzène', tolueno: 'toluène',
      suf: { cooh: 'oïque', coor: 'oate', conh2: 'amide', cn: 'nitrile', cho: 'al', ceto: 'one', oh: 'ol', sh: 'thiol', nh2: 'amine' },
      pos: { cooh: 'carboxylique', coor: 'carboxylate', conh2: 'carboxamide', cn: 'carbonitrile', cho: 'carbaldéhyde' },
      bz: { oh: 'phénol', nh2: 'aniline', cooh: 'benzoïque', cho: 'benzaldéhyde', conh2: 'benzamide', cn: 'benzonitrile', coor: 'benzoate' },
      acido: (p, c) => `acide ${p}${c}`, ester: (p, c, a) => `${p}${c} ${/^[aeiouyéèêh]/i.test(a) ? 'd’' : 'de '}${a}e`,
    },
    de: {
      NUM: ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec', 'undec', 'dodec', 'tridec', 'tetradec', 'pentadec', 'hexadec', 'heptadec', 'octadec', 'nonadec', 'eicos'],
      tetra: 'tetra', deca: 'deca', hal: { F: 'fluor', Cl: 'chlor', Br: 'brom', I: 'iod' }, vo: '', eno: 'en', ino: 'in', il: 'yl', oxi: 'oxy', tio: 'sulfanyl', carbonil: 'carbonyl',
      oxo: 'oxo', hidroxi: 'hydroxy', amino: 'amino', mercapto: 'sulfanyl', carboxi: 'carboxy', formil: 'formyl', carbamoil: 'carbamoyl', ciano: 'cyano', fenil: 'phenyl', metil: 'methyl',
      ciclo: 'cyclo', benc: 'benz', bencen: 'benzen', benceno: 'benzol', tolueno: 'toluol',
      suf: { cooh: 'säure', coor: 'säure', conh2: 'amid', cn: 'nitril', cho: 'al', ceto: 'on', oh: 'ol', sh: 'thiol', nh2: 'amin' },
      pos: { cooh: 'carbonsäure', coor: 'carbonsäure', conh2: 'carbonsäureamid', cn: 'carbonitril', cho: 'carbaldehyd' },
      bz: { oh: 'phenol', nh2: 'anilin', cooh: 'benzoesäure', cho: 'benzaldehyd', conh2: 'benzamid', cn: 'benzonitril', coor: 'benzoesäure' },
      acido: (p, c) => `${p}${c}`, ester: (p, c, a) => `${p}${c}${a}ester`,
    },
  };
  const LI = LX[IDI] || LX.es;
  const NUM = LI.NUM;
  const MULT = ['', '', 'di', 'tri', LI.tetra, 'penta', 'hexa', 'hepta', 'octa', 'nona', LI.deca];
  const BIS = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis', 'heptakis', 'octakis', 'nonakis', 'decakis'];
  const HAL = LI.hal;
  const ajusta = (t) => (IDI === 'de' && t ? t.replace(/^(\([^)]*\)-)?((?:cis|trans)-)?([^a-zäöüß]*)([a-zäöüß])/, (m, d = '', ct = '', pre, l) => d + ct + pre + l.toUpperCase()) : t);

  function leer(txt) {
    const s = String(txt ?? '').replace(/\s+/g, '');
    if (!s) throw new Error('Écrivez la molécule en notation SMILES, par exemple CC(O)C');
    const at = [], pila = [], abiertos = {};
    let k = 0, actual = -1, ord = 1, marca = null, pendiente = false, nCierres = 0;
    const nuevo = (el, h, chir, aro = false) => {
      if (!(el in VAL)) throw new Error(`Je ne sais pas traiter l’élément ${el} : seulement C, H, N, O, S, F, Cl, Br et I`);
      const arom = aro && actual >= 0 && at[actual].aro && !pendiente;
      at.push({ el, h, chir, auto: h === null, aro, arom, padre: actual, ord: actual < 0 ? 0 : ord, marca: actual < 0 ? null : marca, hijos: [], cierres: [] });
      if (actual >= 0) at[actual].hijos.push(at.length - 1);
      actual = at.length - 1; ord = 1; marca = null; pendiente = false;
    };
    const cierre = (n) => {
      if (actual < 0) throw new Error('Un numéro de cycle doit venir après un atome');
      const o = pendiente ? ord : null; ord = 1; marca = null; pendiente = false;
      if (!(n in abiertos)) { abiertos[n] = { i: actual, o, pos: at[actual].cierres.length }; at[actual].cierres.push({ n, j: -1, ord: 1 }); return; }
      const ab = abiertos[n]; delete abiertos[n];
      if (ab.i === actual) throw new Error(`Le cycle ${n} se ferme sur le même atome`);
      if (at[actual].padre === ab.i || at[ab.i].padre === actual || at[actual].cierres.some((c) => c.j === ab.i)) throw new Error('Un cycle ne peut pas se fermer sur un atome auquel il est déjà lié');
      const orden2 = o ?? ab.o ?? 1, arom = at[ab.i].aro && at[actual].aro && o === null && ab.o === null;
      at[ab.i].cierres[ab.pos] = { n, j: actual, ord: orden2, arom };
      at[actual].cierres.push({ n, j: ab.i, ord: orden2, arom });
      if (++nCierres > 1) throw new Error('Pour l’instant, un seul cycle par molécule : pas de bicycliques, de spiro ni de deux cycles');
    };
    while (k < s.length) {
      const c = s[k];
      if (c === '(') { if (actual < 0) throw new Error('Une parenthèse ne peut pas être au début'); pila.push(actual); k++; }
      else if (c === ')') { if (!pila.length) throw new Error('Il y a une parenthèse fermante en trop'); actual = pila.pop(); ord = 1; marca = null; pendiente = false; k++; }
      else if (c === '=') { ord = 2; pendiente = true; k++; }
      else if (c === '#') { ord = 3; pendiente = true; k++; }
      else if (c === '-') { ord = 1; pendiente = true; k++; }
      else if (c === '/' || c === '\\') { marca = c; pendiente = true; k++; }
      else if (/[0-9]/.test(c)) { cierre(+c); k++; }
      else if (c === '%') { const m = /^%(\d\d)/.exec(s.slice(k)); if (!m) throw new Error('Un grand numéro de cycle s’écrit avec deux chiffres : %10'); cierre(+m[1]); k += 3; }
      else if (c === '.') throw new Error('Une seule molécule à la fois : retirez le point');
      else if (c === '[') {
        const f = s.indexOf(']', k); if (f < 0) throw new Error('Il manque la fermeture d’un crochet ]');
        const m = /^(\d+)?([A-Z][a-z]?)(@@?)?(?:H(\d*))?(.*)$/.exec(s.slice(k + 1, f));
        if (!m) throw new Error(`L’atome [${s.slice(k + 1, f)}] n’est pas compris`);
        if (m[5]) throw new Error('Les atomes chargés ou avec d’autres données entre crochets ne sont pas encore pris en charge');
        nuevo(m[2], m[4] === undefined ? 0 : (m[4] === '' ? 1 : +m[4]), m[3] || null);
        k = f + 1;
      } else if (c === 'c') nuevo('C', null, null, true), k++;
      else if (/[a-z]/.test(c)) throw new Error('Parmi les atomes aromatiques, seul le carbone du benzène (c) est pris en charge : les hétérocycles aromatiques (pyridine, furane…) ne le sont pas encore');
      else if (/[A-Z]/.test(c)) {
        const dos = s.slice(k, k + 2);
        if (dos === 'Cl' || dos === 'Br') { nuevo(dos, null, null); k += 2; } else { nuevo(c, null, null); k++; }
      } else throw new Error(`Le symbole « ${c} » n’est pas compris`);
    }
    if (pila.length) throw new Error('Il manque une parenthèse fermante');
    if (pendiente) throw new Error('Le SMILES se termine par une liaison sans atome');
    if (!at.length) throw new Error('Il n’y a aucun atome');
    const sinCerrar = Object.keys(abiertos);
    if (sinCerrar.length) throw new Error(`Il manque la fermeture du cycle ${sinCerrar[0]} : le numéro doit se répéter sur l’atome qui le ferme`);
    if (!nCierres && at.some((a) => a.aro)) throw new Error('Un atome aromatique (c) doit être dans le cycle du benzène : c1ccccc1');
    const M = { at, anillo: null, enAnillo: new Set(), aromatico: false };
    if (nCierres) anilloDe(M);
    for (const [i, a] of at.entries()) {
      const suma = (a.padre >= 0 ? a.ord : 0) + a.hijos.reduce((t, h) => t + at[h].ord, 0) + a.cierres.reduce((t, c) => t + c.ord, 0);
      if (a.auto) a.h = VAL[a.el] - suma;
      if (a.h < 0 || suma + a.h > VAL[a.el]) throw new Error(`L’atome ${a.el} (n° ${i + 1}) a trop de liaisons : sa valence est ${VAL[a.el]}`);
      if (a.chir && a.h > 1) a.chir = null;
    }
    if (at.some((a, i) => vec(M, i).filter((v) => v.o === 2).length >= 2)) throw new Error('Les diènes cumulés (allènes) ne sont pas encore pris en charge');
    return M;
  }
  function anilloDe(M) {
    const at = M.at;
    let p = -1, q = -1;
    at.forEach((a, i) => a.cierres.forEach((c) => { if (c.j > i) { p = i; q = c.j; } }));
    const arriba = (x) => { const r = [x]; while (at[r[r.length - 1]].padre >= 0) r.push(at[r[r.length - 1]].padre); return r; };
    const ap = arriba(p), aq = arriba(q), comun = ap.find((x) => aq.includes(x));
    const anillo = [...ap.slice(0, ap.indexOf(comun) + 1), ...aq.slice(0, aq.indexOf(comun)).reverse()];
    if (anillo.length < 3) throw new Error('Un cycle a besoin d’au moins trois atomes');
    M.anillo = anillo; M.enAnillo = new Set(anillo);
    const aro = at.map((a, i) => (a.aro ? i : -1)).filter((i) => i >= 0);
    if (aro.length) {
      if (aro.length !== 6 || anillo.length !== 6 || !aro.every((i) => M.enAnillo.has(i))) throw new Error('Parmi les cycles aromatiques, seul le benzène est pris en charge : six carbones « c » formant un cycle, sans autres cycles liés');
      const ponOrd = (a, b, o) => { if (at[b].padre === a) at[b].ord = o; else if (at[a].padre === b) at[a].ord = o; else { at[a].cierres.find((c) => c.j === b).ord = o; at[b].cierres.find((c) => c.j === a).ord = o; } };
      anillo.forEach((x, k) => ponOrd(x, anillo[(k + 1) % 6], k % 2 ? 1 : 2));
      M.aromatico = true;
    } else {
      const bs = anillo.map((x, k) => orden(M, x, anillo[(k + 1) % anillo.length]));
      M.aromatico = anillo.length === 6 && anillo.every((x) => at[x].el === 'C') && (bs.every((o, k) => (o === 2) === (k % 2 === 0)) || bs.every((o, k) => (o === 2) === (k % 2 === 1)));
    }
  }
  const vec = (M, i) => { const a = M.at[i]; return [...(a.padre >= 0 ? [{ j: a.padre, o: a.ord }] : []), ...a.hijos.map((c) => ({ j: c, o: M.at[c].ord })), ...a.cierres.map((c) => ({ j: c.j, o: c.ord, cierre: true }))]; };
  const fichas = (M, i) => { const a = M.at[i]; return [...(a.padre >= 0 ? [a.padre] : []), ...Array(a.h).fill('H'), ...a.cierres.map((c) => c.j), ...a.hijos]; };
  const orden = (M, a, b) => { if (M.at[b].padre === a) return M.at[b].ord; if (M.at[a].padre === b) return M.at[a].ord; return M.at[a].cierres.find((c) => c.j === b).ord; };

  function escribe(M, opc = {}) {
    const chir = opc.chir || {}, marcas = opc.marcas || {};
    const rec = (i) => {
      const a = M.at[i], ch = i in chir ? chir[i] : a.chir;
      let t = ch ? `[${a.el}${ch}${a.h ? 'H' + (a.h > 1 ? a.h : '') : ''}]` : a.el;
      for (const c of a.cierres) t += (c.j > i ? (c.ord === 2 ? '=' : c.ord === 3 ? '#' : '') : '') + '1';
      a.hijos.forEach((c, n) => {
        const m = c in marcas ? marcas[c] : (opc.sinMarcas ? null : M.at[c].marca);
        const e = (M.at[c].ord === 2 ? '=' : M.at[c].ord === 3 ? '#' : '') + (M.at[c].ord === 1 && m ? m : '');
        t += n < a.hijos.length - 1 ? `(${e}${rec(c)})` : e + rec(c);
      });
      return t;
    };
    return rec(0);
  }

  const formulaDe = (M) => {
    const c = {};
    for (const a of M.at) { c[a.el] = (c[a.el] || 0) + 1; c.H = (c.H || 0) + a.h; }
    const resto = Object.keys(c).filter((e) => e !== 'C' && e !== 'H').sort();
    const orden = c.C ? ['C', ...(c.H ? ['H'] : []), ...resto] : [...Object.keys(c).sort()];
    return { c, orden, txt: orden.map((e) => e + sub(c[e])).join(''), plano: orden.map((e) => e + (c[e] > 1 ? c[e] : '')).join('') };
  };

  function clases(M) {
    let cl = M.at.map((a) => a.el + a.h);
    for (let r = 0; r < M.at.length; r++) {
      const nu = M.at.map((a, i) => `${cl[i]}(${vec(M, i).map((v) => v.o + cl[v.j]).sort().join(',')})`);
      const mapa = [...new Set(nu)].sort();
      cl = nu.map((x) => 'k' + mapa.indexOf(x));
    }
    return cl;
  }

  function hijosCIP(M, n) {
    if (n.a < 0) return [];
    const a = M.at[n.a], res = [];
    for (const { j, o } of vec(M, n.a)) {
      if (j === n.desde) continue;
      if (n.ruta && n.ruta.includes(j)) { res.push({ z: ZA[M.at[j].el], a: -1, desde: -1, dup: [] }); continue; }
      res.push({ z: ZA[M.at[j].el], a: j, desde: n.a, dup: Array(o - 1).fill(ZA[a.el]), ruta: n.ruta && [...n.ruta, j] });
      for (let q = 1; q < o; q++) res.push({ z: ZA[M.at[j].el], a: -1, desde: -1, dup: [] });
    }
    for (let q = 0; q < a.h; q++) res.push({ z: 1, a: -1, desde: -1, dup: [] });
    for (const z of n.dup) res.push({ z, a: -1, desde: -1, dup: [] });
    return res;
  }
  function ordenados(M, n) {
    const llave = n.a < 0 ? null : `${n.a},${n.desde}${n.ruta ? ',' + n.ruta.join('.') : ''}`;
    M.cache = M.cache || new Map();
    if (llave && M.cache.has(llave)) return M.cache.get(llave);
    const r = hijosCIP(M, n).sort((p, q) => cmpNodo(M, q, p));
    if (llave) M.cache.set(llave, r);
    return r;
  }
  function cmpNodo(M, X, Y) {
    if (X.z !== Y.z) return X.z - Y.z;
    let fx = [X], fy = [Y];
    for (let nivel = 0; nivel < 14; nivel++) {
      const gx = fx.map((n) => ordenados(M, n)), gy = fy.map((n) => ordenados(M, n));
      for (let k = 0; k < gx.length; k++) {
        const L = Math.max(gx[k].length, gy[k].length);
        for (let m = 0; m < L; m++) { const za = gx[k][m]?.z ?? 0, zb = gy[k][m]?.z ?? 0; if (za !== zb) return za - zb; }
      }
      fx = gx.flat(); fy = gy.flat();
      if (!fx.length && !fy.length) return 0;
    }
    return 0;
  }
  const nodoDe = (M, centro, ficha) => {
    if (ficha === 'H') return { z: 1, a: -1, desde: -1, dup: [], ficha };
    const o = orden(M, centro, ficha);
    return { z: ZA[M.at[ficha].el], a: ficha, desde: centro, dup: Array(o - 1).fill(ZA[M.at[centro].el]), ficha, ruta: M.anillo ? [centro, ficha] : undefined };
  };
  function rangos(M, centro, lista) {
    const ns = lista.map((f) => nodoDe(M, centro, f)).sort((p, q) => cmpNodo(M, q, p));
    for (let k = 0; k < ns.length - 1; k++) if (cmpNodo(M, ns[k], ns[k + 1]) === 0) return null;
    return ns.map((n) => n.ficha);
  }
  const centroEstereo = (M, i) => {
    const a = M.at[i];
    if (a.el !== 'C' || vec(M, i).some((v) => v.o !== 1)) return null;
    const f = fichas(M, i);
    if (f.length !== 4) return null;
    return rangos(M, i, f);
  };
  const paridad = (arr) => { let inv = 0; for (let x = 0; x < arr.length; x++) for (let y = x + 1; y < arr.length; y++) if (arr[x] > arr[y]) inv++; return inv % 2; };
  function etiquetaCentro(M, i, rg, chir) {
    const ch = chir === undefined ? M.at[i].chir : chir;
    if (!ch) return null;
    const f = fichas(M, i), seq = f.map((t) => { const r = rg.indexOf(t) + 1; return r === 4 ? 0 : r; });
    const p = paridad(seq);
    return (ch === '@') === (p === 0) ? 'R' : 'S';
  }

  function lado(M, d, s) {
    if (s === 'H' || M.at[d].cierres.some((c) => c.j === s)) return 0;
    if (M.at[s].padre === d) { const m = M.at[s].marca; return m === '/' ? 1 : m === '\\' ? -1 : 0; }
    const m = M.at[d].marca; return m === '/' ? -1 : m === '\\' ? 1 : 0;
  }
  const dobles = (M) => {
    const r = [];
    for (let b = 1; b < M.at.length; b++) {
      const a = M.at[b].padre;
      if (M.at[b].ord === 2 && M.at[a].el === 'C' && M.at[b].el === 'C' && !(M.enAnillo.has(a) && M.enAnillo.has(b))) {
        const extremo = (x, otro) => { const f = fichas(M, x).filter((t) => t !== otro); return f.length === 2 && f.every((t) => t !== undefined) ? f : null; };
        const fa = extremo(a, b), fb = extremo(b, a);
        if (!fa || !fb) continue;
        const ra = rangos(M, a, fa), rb = rangos(M, b, fb);
        if (!ra || !rb) continue;
        r.push({ a, b, ra, rb });
      }
    }
    return r;
  };
  const ladosExtremo = (M, x, r) => {
    const sa = lado(M, x, r[0]), sb = lado(M, x, r[1]);
    if (sa) return [sa, -sa];
    if (sb) return [-sb, sb];
    return null;
  };
  function etiquetaDoble(M, d) {
    const A = ladosExtremo(M, d.a, d.ra), B = ladosExtremo(M, d.b, d.rb);
    if (!A || !B) return null;
    return A[0] === B[0] ? 'Z' : 'E';
  }

  function carasAnillo(M) {
    if (!M.anillo || M.aromatico) return null;
    const R = M.anillo, n = R.length, S = [];
    R.forEach((i, k) => {
      const a = M.at[i];
      if (a.el !== 'C' || a.h !== 1 || vec(M, i).some((v) => v.o !== 1)) return;
      const T = fichas(M, i), ext = T.filter((t) => t !== 'H' && !M.enAnillo.has(t));
      if (ext.length !== 1) return;
      const ref = [R[(k + n - 1) % n], R[(k + 1) % n], ext[0], 'H'];
      let cara = 0;
      if (a.chir) cara = (paridad(T.map((t) => ref.indexOf(t))) === 0) === (a.chir === '@') ? 1 : -1;
      S.push({ i, k, cara, sub: ext[0] });
    });
    return S.length >= 2 ? S : null;
  }

  function estereo(M) {
    const cl = clases(M), centros = [], ds = dobles(M), S = carasAnillo(M), enS = new Set(S ? S.map((x) => x.i) : []);
    for (let i = 0; i < M.at.length; i++) { const rg = centroEstereo(M, i); if (rg) centros.push({ i, rg, label: etiquetaCentro(M, i, rg) }); }
    const dd = ds.map((d) => ({ ...d, label: etiquetaDoble(M, d) }));
    const claveAnillo = (inv) => {
      if (!S) return '';
      const n = M.anillo.length, porPos = new Map(S.map((x) => [x.k, x]));
      let mejor = null;
      for (let k = 0; k < n; k++) for (const d of [1, -1]) {
        const t = [];
        for (let p = 0; p < n; p++) { const pos = (((k + d * p) % n) + n) % n, x = porPos.get(pos); t.push(`${cl[M.anillo[pos]]}:${x ? (x.cara ? x.cara * d * (inv ? -1 : 1) : '?') : 0}`); }
        const c = t.join(','); if (mejor === null || c < mejor) mejor = c;
      }
      return 'cycle ' + mejor;
    };
    const clave = (invierte) => [
      ...centros.filter((c) => !enS.has(c.i)).map((c) => `${cl[c.i]}:${c.label ? (invierte ? (c.label === 'R' ? 'S' : 'R') : c.label) : '?'}`),
      ...dd.map((d) => `${[cl[d.a], cl[d.b]].sort().join('=')}:${d.label || '?'}`),
      ...(S ? [claveAnillo(invierte)] : []),
    ].sort().join('|');
    const completo = centros.every((c) => c.label) && dd.every((d) => d.label) && (!S || S.every((x) => x.cara));
    const relacion = S && S.length === 2 && S.every((x) => x.cara) ? (S[0].cara === S[1].cara ? 'cis' : 'trans') : null;
    const nTog = new Set([...centros.map((c) => c.i), ...(S ? S.map((x) => x.i) : [])]).size;
    return { centros, dobles: dd, clave: clave(false), claveEspejo: clave(true), completo, quiral: completo && clave(false) !== clave(true), anillo: S ? { caras: S, relacion } : null, nTog };
  }

  const PRIO = ['cooh', 'coor', 'conh2', 'cn', 'cho', 'ceto', 'oh', 'sh', 'nh2'];
  const TERMINAL = ['cooh', 'coor', 'conh2', 'cn', 'cho'];
  const SUFIJO = LI.suf;
  const GRUPO = { cooh: 'acide carboxylique', coor: 'ester', conh2: 'amide', cn: 'nitrile', cho: 'aldéhyde', ceto: 'cétone', oh: 'alcool', sh: 'thiol', nh2: 'amine' };
  const cmpClave = (a, b) => {
    if (Array.isArray(a)) {
      for (let k = 0; k < Math.min(a.length, b.length); k++) { const c = cmpClave(a[k], b[k]); if (c) return c; }
      return a.length - b.length;
    }
    return a - b;
  };
  const soloLetras = (t) => t.replace(/[^a-záéíóúñàâçèêëîïôùûüäöß]/gi, '').toLowerCase();

  function nombrar(M, est) {
    const n = M.at.length, V = M.at.map((_, i) => vec(M, i)), el = (i) => M.at[i].el;
    const tipoC = new Array(n).fill(null);
    for (let i = 0; i < n; i++) {
      for (const { j, o } of V[i]) {
        if (o === 2 && !((el(i) === 'C' && (el(j) === 'C' || el(j) === 'O')) || (el(j) === 'C' && el(i) === 'O'))) throw new Error('Je ne sais nommer que des doubles liaisons C=C et C=O');
        if (o === 3 && !(el(i) === 'C' && (el(j) === 'C' || el(j) === 'N')) && !(el(j) === 'C' && el(i) === 'N')) throw new Error('Je ne sais nommer que des triples liaisons C≡C et C≡N');
      }
      const a = M.at[i];
      if (a.el === 'O' && V[i].length === 2 && V[i].some((v) => el(v.j) !== 'C')) throw new Error('Les peroxydes et autres liaisons O–O ou O–hétéroatome ne sont pas encore nommés');
      if (a.el === 'N' && !(V[i].length === 1 && (a.h === 2 || V[i][0].o === 3))) throw new Error('Les amines secondaires et tertiaires, les imides et d’autres composés azotés ne sont pas encore nommés : seulement amines primaires, amides primaires et nitriles');
      if (a.el === 'S' && V[i].length === 2 && V[i].some((v) => el(v.j) !== 'C')) throw new Error('Ce composé soufré n’est pas encore nommé');
    }
    if (M.at.some((a, i) => V[i].filter((v) => v.o === 2).length >= 2)) throw new Error('Les diènes cumulés (allènes) ne sont pas encore nommés');
    if (!M.at.some((a) => a.el === 'C')) throw new Error('Cet outil nomme des composés organiques (avec du carbone)');
    if (M.anillo) {
      if (M.anillo.some((i) => el(i) !== 'C')) throw new Error('Les hétérocycles (cycles avec O, N ou S, comme l’oxirane ou le tétrahydrofurane) ne sont pas encore nommés');
      for (const i of M.anillo) for (const { j, o } of V[i]) if (!M.enAnillo.has(j) && o >= 2 && el(j) === 'C') throw new Error('Les doubles liaisons entre un cycle et une chaîne (groupes « -ylidène ») ne sont pas encore nommées');
      if (M.anillo.some((x, k) => orden(M, x, M.anillo[(k + 1) % M.anillo.length]) === 3)) throw new Error('Les cycloalcynes ne sont pas encore nommés');
      if (!M.aromatico && M.anillo.length > 12) throw new Error('Les cycles de plus de 12 carbones ne sont pas encore nommés');
    }
    for (let i = 0; i < n; i++) {
      if (el(i) !== 'C') continue;
      const nb = V[i], oD = nb.find((v) => v.o === 2 && el(v.j) === 'O'), nT = nb.find((v) => v.o === 3 && el(v.j) === 'N');
      if (nT) tipoC[i] = 'cn';
      else if (oD) {
        const otros = nb.filter((v) => v !== oD), oh = otros.find((v) => el(v.j) === 'O'), nn = otros.find((v) => el(v.j) === 'N');
        const cs = otros.filter((v) => el(v.j) === 'C');
        if (otros.some((v) => ['F', 'Cl', 'Br', 'I', 'S'].includes(el(v.j)))) throw new Error('Les halogénures d’acyle et les thioacides ne sont pas encore nommés');
        if (oh) tipoC[i] = V[oh.j].length === 1 ? 'cooh' : 'coor';
        else if (nn) { if (!(V[nn.j].length === 1 && M.at[nn.j].h === 2)) throw new Error('Les amides N-substitués ne sont pas encore nommés'); tipoC[i] = 'conh2'; }
        else tipoC[i] = cs.length === 2 ? 'ceto' : 'cho';
      }
    }
    const gk = (j) => { const a = M.at[j]; if (V[j].length !== 1 || V[j][0].o !== 1) return null; if (a.el === 'O' && a.h === 1) return 'oh'; if (a.el === 'S' && a.h === 1) return 'sh'; if (a.el === 'N' && a.h === 2) return 'nh2'; return null; };
    const presentes = new Set();
    for (let i = 0; i < n; i++) {
      if (el(i) !== 'C') continue;
      if (tipoC[i]) presentes.add(tipoC[i]);
      if (!TERMINAL.includes(tipoC[i])) for (const { j } of V[i]) { const g = gk(j); if (g) presentes.add(g); }
    }
    const principal = PRIO.find((t) => presentes.has(t)) || null;
    if (principal === 'coor' && tipoC.filter((t) => t === 'coor').length > 1) throw new Error('Les diesters ne sont pas encore nommés');
    const elegible = (i) => el(i) === 'C' && !M.enAnillo.has(i) && (!tipoC[i] || tipoC[i] === 'ceto' || tipoC[i] === principal);

    const memo = new Map();
    function nombreSub(raiz, desde) {
      const llave = raiz + ',' + desde;
      if (memo.has(llave)) return memo.get(llave);
      const r = nombreSub0(raiz, desde); memo.set(llave, r); return r;
    }
    function nombreSub0(raiz, desde) {
      const e = el(raiz), o = orden(M, desde, raiz), nb = V[raiz].filter((v) => v.j !== desde);
      if (HAL[e]) return { txt: HAL[e], complejo: false };
      if (e === 'O') {
        if (o === 2) return { txt: LI.oxo, complejo: false };
        if (!nb.length) return { txt: LI.hidroxi, complejo: false };
        const q = nombreSub(nb[0].j, raiz);
        return { txt: q.txt.replace(new RegExp(LI.il + '$'), LI.oxi), complejo: q.complejo };
      }
      if (e === 'N') return { txt: LI.amino, complejo: false };
      if (e === 'S') {
        if (!nb.length) return { txt: LI.mercapto, complejo: false };
        const q = nombreSub(nb[0].j, raiz);
        return { txt: q.txt + LI.tio, complejo: true };
      }
      if (M.enAnillo.has(raiz)) return nombreAnillo(true, desde);
      const t = tipoC[raiz];
      if (t === 'cooh') return { txt: LI.carboxi, complejo: false };
      if (t === 'cho') return { txt: LI.formil, complejo: false };
      if (t === 'conh2') return { txt: LI.carbamoil, complejo: false };
      if (t === 'cn') return { txt: LI.ciano, complejo: false };
      if (t === 'coor') {
        const oo = V[raiz].find((v) => el(v.j) === 'O' && v.o === 1 && v.j !== desde), q = nombreSub(V[oo.j].find((v) => v.j !== raiz).j, oo.j);
        return { txt: q.txt.replace(new RegExp(LI.il + '$'), LI.oxi) + LI.carbonil, complejo: q.complejo };
      }
      if (t === 'ceto') throw new Error('Un groupe acyle (comme l’acétyle) comme substituant n’est pas encore nommé');
      return cadena(null, raiz, desde);
    }

    function rutas(inicios, prohibido) {
      const res = [];
      const sigue = (p) => {
        const u = p[p.length - 1];
        if (!inicios.fijo && p[0] <= u) res.push([...p]);
        if (inicios.fijo) res.push([...p]);
        for (const { j } of V[u]) if (!p.includes(j) && j !== prohibido && elegible(j)) { p.push(j); sigue(p); p.pop(); }
      };
      for (const s of inicios.lista) if (elegible(s)) sigue([s]);
      return res;
    }
    function evalua(P, ctx) {
      const largo = P.length, enP = new Set(P), usados = new Set();
      const princ = [];   // posiciones (0..) con el grupo principal
      const grupoDe = (k) => {
        const c = P[k], t = tipoC[c], r = [];
        if (principal && TERMINAL.includes(principal)) { if (t === principal) { princ.push(k); for (const { j } of V[c]) if (el(j) === 'O' || el(j) === 'N') usados.add(j); } }
        else if (principal === 'ceto') { if (t === 'ceto') { princ.push(k); const o = V[c].find((v) => v.o === 2 && el(v.j) === 'O'); usados.add(o.j); } }
        else if (principal) for (const { j } of V[c]) if (!enP.has(j) && gk(j) === principal) { princ.push(k); usados.add(j); }
        return r;
      };
      if (!ctx.sub) for (let k = 0; k < largo; k++) grupoDe(k);
      const subs = [], dob = [], tri = [];
      for (let k = 0; k < largo; k++) {
        for (const { j } of V[P[k]]) if (!enP.has(j) && !usados.has(j) && j !== ctx.desde) subs.push({ k, j });
        if (k < largo - 1) { const o = orden(M, P[k], P[k + 1]); if (o === 2) dob.push(k); else if (o === 3) tri.push(k); }
      }
      const orient = (dir) => {
        const loc = (k) => (dir ? k + 1 : largo - k), locB = (k) => (dir ? k + 1 : largo - k - 1);
        const L = {
          princ: princ.map(loc).sort((a, b) => a - b), mult: [...dob.map(locB), ...tri.map(locB)].sort((a, b) => a - b),
          dob: dob.map(locB).sort((a, b) => a - b), tri: tri.map(locB).sort((a, b) => a - b),
          subs: subs.map((s) => ({ loc: loc(s.k), j: s.j, desde: P[s.k] })),
        };
        const sl = L.subs.map((s) => s.loc).sort((a, b) => a - b);
        const alfa = [...L.subs].sort((p, q) => soloLetras(nombreSub(p.j, p.desde).txt).localeCompare(soloLetras(nombreSub(q.j, q.desde).txt)))[0];
        L.clave = [L.princ, L.mult, L.dob, sl, alfa ? alfa.loc : 0];
        L.loc = loc; L.locB = locB;
        return L;
      };
      const o1 = orient(true), o2 = ctx.sub ? null : orient(false);
      const mejor = o2 && cmpClave(o2.clave, o1.clave) < 0 ? o2 : o1;
      const dir = mejor === o1;
      return { P, dir, L: mejor, clave: [-princ.length, -(dob.length + tri.length), -largo, -subs.length, mejor.clave], nPrinc: princ.length };
    }
    function cadena(inicioPrincipal, raiz, desde) {
      const sub = raiz !== null && !inicioPrincipal;
      let cand;
      if (sub) cand = rutas({ lista: [raiz], fijo: true }, desde).filter((p) => p[0] === raiz);
      else cand = rutas({ lista: [...Array(n).keys()] }, -1);
      if (!cand.length) throw new Error('Je ne trouve pas de chaîne de carbones');
      let mejor = null;
      if (!sub && principal) {   // solo cuentan las cadenas con más grupos principales (así no se nombran cadenas descartadas)
        const cuenta = (P) => P.reduce((t, c) => t + (TERMINAL.includes(principal) || principal === 'ceto' ? (tipoC[c] === principal ? 1 : 0) : V[c].filter((v) => !P.includes(v.j) && gk(v.j) === principal).length), 0);
        const mx = Math.max(...cand.map(cuenta)); cand = cand.filter((P) => cuenta(P) === mx);
      }
      for (const P of cand) { const e = evalua(P, { sub, desde: sub ? desde : -1 }); if (!mejor || cmpClave(e.clave, mejor.clave) < 0) mejor = e; }
      return componer(mejor, sub);
    }
    function componer(E, esSub) {
      const { P, L } = E, largo = P.length, orient = L;
      if (largo > 20) throw new Error('La chaîne est trop longue (plus de 20 carbones)');
      const stem = NUM[largo];
      const grupos = new Map();
      for (const s of orient.subs) {
        const nm = nombreSub(s.j, s.desde), key = nm.txt;
        if (!grupos.has(key)) grupos.set(key, { nm, locs: [] });
        grupos.get(key).locs.push(s.loc);
      }
      const lista = [...grupos.values()].sort((p, q) => soloLetras(p.nm.txt).localeCompare(soloLetras(q.nm.txt)));
      const nSub = orient.subs.length, locsSuf = E.nPrinc ? orient.princ : [];
      const tipoSuf = !esSub && principal && E.nPrinc ? principal : null;
      const terminal = tipoSuf && TERMINAL.includes(tipoSuf);
      const items = nSub + (tipoSuf && !terminal ? locsSuf.length : 0);
      const omiteTodo = largo === 1 || (!esSub && largo === 2 && items <= 1);
      const nIns = orient.dob.length + orient.tri.length;
      const omiteIns = largo <= 2 || (largo === 3 && !tipoSuf && nSub === 0 && nIns === 1);
      const prefijo = lista.map(({ nm, locs }) => {
        locs.sort((a, b) => a - b);
        const m = locs.length, ls = omiteTodo ? '' : locs.join(',') + '-';
        const nombre = nm.complejo ? (m > 1 ? BIS[m] : '') + `(${nm.txt})` : (m > 1 ? MULT[m] : '') + nm.txt;
        return ls + nombre;
      }).join('-');
      let base;
      if (!nIns) base = esSub ? stem : stem + 'an';
      else {
        const partes = [];
        if (orient.dob.length) partes.push((omiteIns ? '' : orient.dob.join(',') + '-') + (orient.dob.length > 1 ? MULT[orient.dob.length] : '') + LI.eno);
        if (orient.tri.length) partes.push((omiteIns ? '' : orient.tri.join(',') + '-') + (orient.tri.length > 1 ? MULT[orient.tri.length] : '') + LI.ino);
        const a = (orient.dob.length || orient.tri.length) > 1 && (orient.dob.length ? orient.dob.length > 1 : orient.tri.length > 1) ? 'a' : '';
        base = stem + a + (omiteIns ? '' : '-') + partes.join(omiteIns ? '' : '-');
      }
      let cuerpo;
      if (esSub) cuerpo = base + LI.il;
      else if (!tipoSuf) cuerpo = base + LI.vo;
      else {
        const m = locsSuf.length, suf = SUFIJO[tipoSuf], vocal = /^[aeiou]/.test(suf);
        const omiteSuf = terminal || omiteTodo || (tipoSuf === 'ceto' && largo === 3 && items === 1 && !nIns);
        const ls = omiteSuf ? '' : locsSuf.join(',');
        const mu = m > 1 ? MULT[m] : '';
        if (m === 1 && vocal) cuerpo = base + (ls ? `-${ls}-` : '') + suf;
        else cuerpo = base + LI.vo + (ls ? `-${ls}-` : '') + mu + suf;
      }
      const res = { txt: (prefijo ? prefijo : '') + cuerpo, complejo: /[\d,(]/.test(prefijo + cuerpo) || nSub > 0, E, prefijo, cuerpo, tipoSuf };
      return res;
    }


    const POS_PRINC = LI.pos;
    const BENCENO = LI.bz;
    const gruposAnillo = (x) => {
      const r = [];
      if (!principal) return r;
      if (principal === 'ceto') { if (tipoC[x] === 'ceto') r.push(V[x].find((v) => v.o === 2 && el(v.j) === 'O').j); return r; }
      for (const { j } of V[x]) {
        if (M.enAnillo.has(j)) continue;
        if (TERMINAL.includes(principal) ? tipoC[j] === principal : gk(j) === principal) r.push(j);
      }
      return r;
    };
    function nombreAnillo(esSub, desde) {
      const R = M.anillo, nR = R.length, aro = M.aromatico;
      const usados = new Set(), princ = [], subs = [], dob = [];
      const enlaceDesde = esSub ? R.findIndex((x) => V[x].some((v) => v.j === desde && !M.enAnillo.has(v.j))) : -1;
      R.forEach((x, k) => {
        if (!esSub) for (const j of gruposAnillo(x)) { princ.push(k); usados.add(j); if (TERMINAL.includes(principal)) for (const w of V[j]) if (el(w.j) === 'O' || el(w.j) === 'N') usados.add(w.j); }
        for (const { j } of V[x]) if (!M.enAnillo.has(j) && !usados.has(j) && j !== desde) subs.push({ k, j });
        if (!aro && orden(M, x, R[(k + 1) % nR]) === 2) dob.push(k);
      });
      const candidatos = [];
      for (const d of [1, -1]) for (let s0 = 0; s0 < nR; s0++) {
        if (esSub && s0 !== enlaceDesde) continue;
        const pos = (k) => ((((k - s0) * d) % nR) + nR) % nR + 1;
        const locB = (k) => { const a = pos(k), b = pos((k + 1) % nR); return a === 1 && b === nR || a === nR && b === 1 ? nR : Math.min(a, b); };
        const L = { princ: princ.map(pos).sort((a, b) => a - b), dob: dob.map(locB).sort((a, b) => a - b), subs: subs.map((q) => ({ loc: pos(q.k), j: q.j, desde: R[q.k] })), pos };
        const sl = L.subs.map((q) => q.loc).sort((a, b) => a - b);
        const alfa = [...L.subs].sort((p, q) => soloLetras(nombreSub(p.j, p.desde).txt).localeCompare(soloLetras(nombreSub(q.j, q.desde).txt)) || p.loc - q.loc)[0];
        L.clave = [L.princ, L.dob, sl, alfa ? alfa.loc : 0];
        L.desc = est.centros.filter((c) => c.label && M.enAnillo.has(c.i)).map((c) => ({ l: pos(R.indexOf(c.i)), t: c.label })).sort((p, q) => p.l - q.l).map((x) => x.t).join('');
        candidatos.push(L);
      }
      const L = candidatos.reduce((m, c) => { const q = cmpClave(c.clave, m.clave); return q < 0 || (q === 0 && c.desc < m.desc) ? c : m; });
      const nPrinc = princ.length, tipoSuf = !esSub && nPrinc ? principal : null, nDob = dob.length, nSub = subs.length;
      const stem = aro ? LI.benc : LI.ciclo + NUM[nR];
      const grupos = new Map();
      for (const q of L.subs) { const nm = nombreSub(q.j, q.desde); if (!grupos.has(nm.txt)) grupos.set(nm.txt, { nm, locs: [] }); grupos.get(nm.txt).locs.push(q.loc); }
      const lista = [...grupos.values()].sort((p, q) => soloLetras(p.nm.txt).localeCompare(soloLetras(q.nm.txt)));
      const omiteSubs = !esSub && nSub === 1 && !nPrinc && !nDob;
      const prefijoDe = (omite) => lista.map(({ nm, locs }) => {
        locs.sort((a, b) => a - b);
        const m = locs.length, ls = omite ? '' : locs.join(',') + '-';
        return ls + (nm.complejo ? (m > 1 ? BIS[m] : '') + `(${nm.txt})` : (m > 1 ? MULT[m] : '') + nm.txt);
      }).join('-');
      const items = nSub + nPrinc + nDob;
      const compon = (sistematico) => {
        const especial = aro && !esSub && !sistematico;
        let prefijo = prefijoDe(omiteSubs), cuerpo;
        if (esSub) {
          cuerpo = aro ? LI.fenil : !nDob ? stem + LI.il : stem + (nDob > 1 ? 'a-' + L.dob.join(',') + '-' + MULT[nDob] + LI.eno : '-' + L.dob[0] + '-' + LI.eno) + '-1-' + LI.il;
          return { prefijo, cuerpo };
        }
        let base;
        if (aro) base = LI.bencen;
        else if (!nDob) base = stem + 'an';
        else if (nDob === 1) base = stem + (tipoSuf ? '-' + L.dob[0] + '-' : '') + LI.eno;
        else base = stem + 'a-' + L.dob.join(',') + '-' + MULT[nDob] + LI.eno;
        if (!tipoSuf) {
          if (especial && !nSub) return { prefijo: '', cuerpo: LI.benceno };
          if (especial && nSub === 1 && lista[0].nm.txt === LI.metil) return { prefijo: '', cuerpo: LI.tolueno };
          return { prefijo, cuerpo: base + LI.vo };
        }
        if (especial && nPrinc === 1 && BENCENO[tipoSuf]) {
          const b = BENCENO[tipoSuf];
          return { prefijo, cuerpo: b };
        }
        const m = L.princ.length, locs = L.princ.join(','), mu = m > 1 ? MULT[m] : '', ponLoc = m > 1 || items > 1;
        if (TERMINAL.includes(tipoSuf)) return { prefijo, cuerpo: base + LI.vo + (ponLoc ? `-${locs}-` : '') + mu + POS_PRINC[tipoSuf] };
        const suf = SUFIJO[tipoSuf], vocal = /^[aeiou]/.test(suf);
        if (m === 1 && vocal) return { prefijo, cuerpo: base + (ponLoc ? `-${locs}-` : '') + suf };
        return { prefijo, cuerpo: base + LI.vo + (ponLoc ? `-${locs}-` : '') + mu + suf };
      };
      const A = compon(false), B = compon(true);
      const txt = A.prefijo + A.cuerpo, sist = B.prefijo + B.cuerpo;
      const E = { P: R, L: { loc: (k) => L.pos(k), princ: L.princ }, aro };
      return { txt, alias: sist !== txt ? sist : '', complejo: /[\d,(]/.test(txt) || nSub > 0 || nDob > 0, E, prefijo: A.prefijo, cuerpo: A.cuerpo, tipoSuf, anillo: true };
    }
    function anilloEsPadre() {
      const nR = M.anillo.length, cand = rutas({ lista: [...Array(n).keys()] }, -1);
      if (!cand.length) return true;
      const cuentaC = (P) => P.reduce((t, c) => t + (TERMINAL.includes(principal) || principal === 'ceto' ? (tipoC[c] === principal ? 1 : 0) : V[c].filter((v) => !P.includes(v.j) && gk(v.j) === principal).length), 0);
      const cA = principal ? M.anillo.reduce((t, x) => t + gruposAnillo(x).length, 0) : 0;
      const cC = principal ? Math.max(...cand.map(cuentaC)) : 0;
      if (cA !== cC) return cA > cC;
      const largoC = Math.max(...cand.filter((P) => !principal || cuentaC(P) === cC).map((P) => P.length));
      return nR >= largoC;
    }

    const R = M.anillo && anilloEsPadre() ? nombreAnillo(false, -1) : cadena(true, null, -1);
    const { P, L } = R.E;
    const locAt = (a) => { const k = P.indexOf(a); return k < 0 ? null : L.loc(k); };
    const desc = [];
    for (const c of est.centros) { const l = locAt(c.i); if (c.label && l) desc.push({ l, t: c.label }); }
    for (const d of est.dobles) {
      const ka = P.indexOf(d.a), kb = P.indexOf(d.b);
      if (d.label && ka >= 0 && kb >= 0) desc.push({ l: Math.min(L.loc(ka), L.loc(kb)), t: d.label });
    }
    desc.sort((p, q) => p.l - q.l || p.t.localeCompare(q.t));
    const omiteLoc = P.length === 1;
    let pre = desc.length ? `(${desc.map((x) => (omiteLoc ? '' : x.l) + x.t).join(',')})-` : '';
    if (R.anillo && !desc.length && est.anillo && est.anillo.relacion) pre = `${est.anillo.relacion}-`;
    const monta = (cuerpo) => {
      if (R.tipoSuf === 'cooh') return ajusta(LI.acido(pre, cuerpo));
      if (R.tipoSuf === 'coor') {
        const c = R.anillo ? M.at.findIndex((_, a) => tipoC[a] === 'coor') : P.find((a) => tipoC[a] === 'coor'), oo = V[c].find((v) => el(v.j) === 'O' && v.o === 1), alq = nombreSub(V[oo.j].find((v) => v.j !== c).j, oo.j);
        return ajusta(LI.ester(pre, cuerpo, alq.txt));
      }
      return ajusta(pre + cuerpo);
    };
    const txt = monta(R.txt), alias = R.alias ? monta(R.alias) : '';
    const fuera = [...est.centros.filter((c) => c.label && locAt(c.i) === null).map((c) => `${c.label} (centre)`), ...est.dobles.filter((d) => d.label && (P.indexOf(d.a) < 0 || P.indexOf(d.b) < 0)).map((d) => `${d.label} (double liaison)`)];
    return { txt, alias, fuera, principal: R.tipoSuf, cadena: P, locAt, tipoC, pre, base: R.txt, E: R.E, anillo: !!R.anillo, aromatico: !!(R.anillo && M.aromatico) };
  }

  function grupos(M) {
    const V = M.at.map((_, i) => vec(M, i)), el = (i) => M.at[i].el, r = new Set();
    const enA = (i) => M.enAnillo.has(i), arom = (i) => M.aromatico && enA(i);
    if (M.anillo) {
      const nR = M.anillo.length, dob = M.anillo.some((x, k) => orden(M, x, M.anillo[(k + 1) % nR]) === 2);
      r.add(M.anillo.some((x) => el(x) !== 'C') ? 'hétérocycle' : M.aromatico ? 'cycle aromatique (benzène)' : dob ? 'cycloalcène' : 'cycloalcane');
    }
    for (let i = 0; i < M.at.length; i++) {
      const a = M.at[i];
      for (const { j, o } of V[i]) if (j > i || M.at[j].padre === i) { /* cada enlace una vez */ }
      if (a.el === 'C') {
        for (const v of V[i]) {
          if (v.o === 2 && el(v.j) === 'C' && v.j > i && !(enA(i) && enA(v.j))) r.add('alcène');
          if (v.o === 3 && el(v.j) === 'C' && v.j > i) r.add('alcyne');
        }
        const oD = V[i].find((v) => v.o === 2 && el(v.j) === 'O');
        const nT = V[i].find((v) => v.o === 3 && el(v.j) === 'N');
        if (nT) r.add('nitrile');
        else if (oD) {
          const otros = V[i].filter((v) => v !== oD), oo = otros.find((v) => el(v.j) === 'O'), nn = otros.find((v) => el(v.j) === 'N'), cs = otros.filter((v) => el(v.j) === 'C').length;
          if (oo) r.add(V[oo.j].length === 1 ? 'acide carboxylique' : 'ester');
          else if (nn) r.add('amide');
          else r.add(cs === 2 ? 'cétone' : 'aldéhyde');
        }
      } else if (a.el === 'O' && V[i].length === 2 && V[i].every((v) => el(v.j) === 'C')) {
        const esEster = V[i].some((v) => M.at[v.j].el === 'C' && V[v.j].some((w) => w.o === 2 && el(w.j) === 'O'));
        if (!esEster) r.add('éther');
      } else if (a.el === 'O' && a.h === 1 && V[i].length === 1 && el(V[i][0].j) === 'C') {
        const c = V[i][0].j; if (!V[c].some((w) => w.o === 2 && el(w.j) === 'O')) r.add(arom(c) ? 'fenol' : 'alcool');
      } else if (a.el === 'N' && V[i].length === 1 && V[i][0].o === 1 && a.h === 2) {
        const c = V[i][0].j; if (!V[c].some((w) => w.o === 2 && el(w.j) === 'O')) r.add(arom(c) ? 'amine aromatique (aniline)' : 'amine');
      } else if (a.el === 'S') r.add(a.h ? 'thiol' : 'thioéther');
      else if (HAL[a.el]) r.add(`halogénure ${arom(V[i][0].j) ? 'd’aryle' : 'd’alkyle'} (${HAL[a.el]})`);
    }
    return [...r];
  }

  const v3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: (a) => Math.hypot(a[0], a[1], a[2]), unit: (a) => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; },
  };
  const perp = (v, a) => v3.sub(v, v3.mul(a, v3.dot(v, a)));
  const LARGOS = { 'C-C': [0, 1.54, 1.34, 1.2], 'C-O': [0, 1.43, 1.21], 'C-N': [0, 1.47, 1.28, 1.16], 'C-S': [0, 1.82], 'C-F': [0, 1.35], 'C-Cl': [0, 1.77], 'Br-C': [0, 1.94], 'C-I': [0, 2.14], 'C-H': [0, 1.09], 'H-O': [0, 0.96], 'H-N': [0, 1.01], 'H-S': [0, 1.34] };
  const largo = (a, b, o) => (LARGOS[[a, b].sort().join('-')] || [0, 1.5])[o] || 1.5;
  const rad = (g) => (g * Math.PI) / 180;

  const tagGeo = (c, a, b, d, e) => (v3.dot(v3.cross(v3.sub(b, c), v3.sub(d, c)), v3.sub(e, c)) < 0 ? '@' : '@@');

  function coordenadas(M) {
    const n = M.at.length, V = M.at.map((_, i) => vec(M, i)), pos = new Array(n).fill(null), fp = new Array(n), Hs = [];
    const hib = (i) => { const v = V[i]; if (v.some((x) => x.o === 3) || v.filter((x) => x.o === 2).length >= 2) return 'sp'; if (v.some((x) => x.o === 2)) return 'sp2'; return 'sp3'; };
    const baseAz = (e1, u) => ({ e1, e2: v3.cross(u, e1) });
    const aFichas = (T, Tfull, pt) => {
      const usado = new Array(T.length).fill(false);
      return Tfull.map((t) => { const q = T.findIndex((x, k) => x === t && !usado[k]); usado[q] = true; return pt[q]; });
    };
    function situa(i, desde, u, eref, modoB) {
      const a = M.at[i], Tfull = fichas(M, i), tipo = hib(i), p0 = pos[i];
      let T = Tfull, flip = 1;
      if (desde >= 0) { const k = Tfull.indexOf(desde); T = [desde, ...Tfull.filter((_, q) => q !== k)]; flip = k % 2 ? -1 : 1; }
      const R = T.slice(1), pt = new Array(T.length);
      const { e1, e2 } = baseAz(eref, u);
      const dir = (polar, az) => v3.add(v3.mul(u, Math.cos(polar)), v3.mul(v3.add(v3.mul(e1, Math.cos(az)), v3.mul(e2, Math.sin(az))), Math.sin(polar)));
      const poner = (idx, d) => {
        const t = T[idx];
        const p = v3.add(p0, v3.mul(d, largo(a.el, t === 'H' ? 'H' : M.at[t].el, t === 'H' ? 1 : orden(M, i, t))));
        pt[idx] = p;
        if (t === 'H') Hs.push({ de: i, p }); else if (pos[t] === null) pos[t] = p;
      };
      if (desde >= 0) pt[0] = pos[desde]; else poner(0, u);
      const pesado = (t) => t !== 'H';
      if (modoB) {
        const A = desde, TA = fichas(M, A), ptA = fp[A], axis = v3.unit(v3.sub(pos[i], pos[A]));
        const iB = TA.indexOf(i), otros = TA.map((t, k) => k).filter((k) => k !== iB);
        const lA = otros.map((k) => (TA[k] === 'H' ? 0 : lado(M, A, TA[k])));
        let w = null, sA0 = 1;
        for (let q = 0; q < otros.length; q++) if (lA[q]) { w = v3.mul(v3.unit(perp(v3.sub(ptA[otros[q]], pos[A]), axis)), lA[q]); sA0 = q === 0 ? lA[q] : -lA[q]; break; }
        if (!w) w = v3.unit(perp(v3.sub(ptA[otros[0]], pos[A]), axis));
        const lB = R.map((t) => (t === 'H' ? 0 : lado(M, i, t)));
        let sig = lB.findIndex((x) => x), lados;
        if (sig >= 0) lados = R.map((_, q) => (q === sig ? lB[q] : -lB[sig]));
        else lados = R.map((_, q) => (q === 0 ? -sA0 : sA0));
        R.forEach((t, q) => poner(q + 1, v3.add(v3.mul(axis, Math.cos(rad(60))), v3.mul(w, lados[q] * Math.sin(rad(60))))));
      } else if (tipo === 'sp') {
        if (R.length) poner(1, v3.mul(u, -1));
      } else if (tipo === 'sp2') {
        let anc = R.findIndex((t) => pesado(t) && orden(M, i, t) === 2); if (anc < 0) anc = R.findIndex(pesado); if (anc < 0) anc = 0;
        R.forEach((t, q) => poner(q + 1, dir(rad(120), q === anc ? 0 : Math.PI)));
      } else {
        let anc = R.findIndex(pesado); if (anc < 0) anc = 0;
        const s = a.chir && T.length === 4 && a.chir === '@@' ? -flip : flip;
        const colocados = [...pos.filter((p, j) => p && j !== i && j !== desde), ...Hs.filter((h) => h.de !== desde).map((h) => h.p)];
        let mejorK = 0, mejorPen = Infinity;
        for (const kk of [0, 1, 2]) {
          let pen = 0;
          R.forEach((t, q) => {
            const d = dir(rad(109.47), s * rad(120) * (q - anc + kk)), p = v3.add(p0, v3.mul(d, largo(a.el, t === 'H' ? 'H' : M.at[t].el, 1)));
            for (const o of colocados) { const dd = v3.norm(v3.sub(p, o)); if (dd < 2.4) pen += (2.4 - dd) ** 2; }
          });
          if (pen < mejorPen - 1e-9) { mejorPen = pen; mejorK = kk; }
        }
        R.forEach((t, q) => poner(q + 1, dir(rad(109.47), s * rad(120) * (q - anc + mejorK))));
      }
      fp[i] = aFichas(T, Tfull, pt);
      bajan(i, T, pt, desde >= 0 ? 1 : 0);
    }
    function bajan(i, T, pt, desdeQ) {
      const a = M.at[i], p0 = pos[i];
      for (let q = desdeQ; q < T.length; q++) {
        const c = T[q]; if (c === 'H' || colocado.has(c)) continue;
        const axis = v3.unit(v3.sub(pos[c], p0)), g = pt.find((p, k) => k !== q && p);
        let e = g ? perp(v3.sub(g, p0), axis) : [0, 0, 0];
        if (v3.norm(e) < 1e-6) e = perp(Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], axis);
        const dB = orden(M, i, c) === 2 && a.el === 'C' && M.at[c].el === 'C' && fichas(M, c).length === 3 && !M.enAnillo.has(c);
        colocado.add(c);
        situa(c, i, v3.mul(axis, -1), v3.mul(v3.unit(e), -1), dB);
      }
    }
    const colocado = new Set();
    function anillo3D() {
      const Rg = M.anillo, nR = Rg.length, aro = M.aromatico, bl = aro ? 1.4 : 1.53;
      const amp = aro || nR <= 5 ? 0 : nR === 6 ? 0.25 : 0.35;
      const zs = Rg.map((_, k) => (nR % 2 && k === nR - 1 ? 0 : k % 2 ? -amp : amp));
      const lat = Math.sqrt(bl * bl - (2 * amp) ** 2), rad0 = lat / (2 * Math.sin(Math.PI / nR));
      Rg.forEach((x, k) => { pos[x] = [rad0 * Math.cos((2 * Math.PI * k) / nR), rad0 * Math.sin((2 * Math.PI * k) / nR), zs[k]]; colocado.add(x); });
      const pendientes = [];
      Rg.forEach((x, k) => {
        const a = M.at[x], T = fichas(M, x), p0 = pos[x], ext = T.map((t, q) => q).filter((q) => !(typeof T[q] === 'number' && M.enAnillo.has(T[q])));
        const fuera = v3.unit([p0[0], p0[1], 0]), pt = new Array(T.length);
        T.forEach((t, q) => { if (!ext.includes(q)) pt[q] = pos[t]; });
        const coloca = (q, d) => {
          const t = T[q], p = v3.add(p0, v3.mul(d, largo(a.el, t === 'H' ? 'H' : M.at[t].el, t === 'H' ? 1 : orden(M, x, t))));
          pt[q] = p; if (t === 'H') Hs.push({ de: x, p }); else pos[t] = p;
        };
        if (hib(x) !== 'sp3' || ext.length !== 2) ext.forEach((q) => coloca(q, fuera));
        else {
          const c = Math.cos(rad(54.75)), sn = Math.sin(rad(54.75)), arriba = v3.add(v3.mul(fuera, c), [0, 0, sn]), abajo = v3.add(v3.mul(fuera, c), [0, 0, -sn]);
          let [qa, qb] = ext;
          if (a.chir && T.length === 4) {
            const prueba = (u1, u2) => { const P = T.map((t, q) => (ext.includes(q) ? v3.add(p0, q === qa ? u1 : u2) : pos[t])); return tagGeo(p0, P[0], P[1], P[2], P[3]); };
            if (prueba(arriba, abajo) !== a.chir) [qa, qb] = [qb, qa];
          }
          coloca(qa, arriba); coloca(qb, abajo);
        }
        fp[x] = pt;
        pendientes.push({ x, T, pt });
      });
      for (const { x, T, pt } of pendientes) bajan(x, T, pt, 0);
    }
    if (M.anillo) anillo3D();
    else { pos[0] = [0, 0, 0]; colocado.add(0); situa(0, -1, [0, 0, 1], [1, 0, 0], false); }
    {
      const D = M.at.map(() => new Array(n).fill(99));
      for (let s0 = 0; s0 < n; s0++) { D[s0][s0] = 0; const cola = [s0]; for (let q = 0; q < cola.length; q++) for (const { j } of V[cola[q]]) if (D[s0][j] === 99) { D[s0][j] = D[s0][cola[q]] + 1; cola.push(j); } }
      const P = [...pos, ...Hs.map((h) => h.p)], host = [...Array(n).keys(), ...Hs.map((h) => h.de)], ex = P.map((_, k) => (k < n ? 0 : 1));
      const topo = (x, y) => (host[x] === host[y] ? (ex[x] && ex[y] ? 2 : ex[x] + ex[y]) : D[host[x]][host[y]] + ex[x] + ex[y]);
      const pen = () => { let t = 0; for (let x = 0; x < P.length; x++) for (let y = x + 1; y < P.length; y++) if (topo(x, y) >= 3) { const d = v3.norm(v3.sub(P[x], P[y])); if (d < 2.3) t += (2.3 - d) ** 2; } return t; };
      const rama = (c) => { const r = [c]; for (let q = 0; q < r.length; q++) r.push(...M.at[r[q]].hijos); return r; };
      const gira = (ids, o, ax, ang) => {
        const co = Math.cos(ang), si = Math.sin(ang);
        for (const k of ids) { const v = v3.sub(P[k], o), r = v3.add(v3.add(v3.mul(v, co), v3.mul(v3.cross(ax, v), si)), v3.mul(ax, v3.dot(ax, v) * (1 - co))); P[k] = v3.add(o, r); }
      };
      for (let pasada = 0; pasada < 3; pasada++) {
        let cambio = false;
        for (let c = 1; c < n; c++) {
          const pd = M.at[c].padre; if (M.at[c].ord !== 1 || (M.at[c].hijos.length === 0)) continue;
          if (M.enAnillo.has(c) && M.enAnillo.has(pd)) continue;
          const hs = rama(c), ids = [...hs, ...Hs.map((h, q) => (hs.includes(h.de) ? n + q : -1)).filter((k) => k >= 0)].filter((k) => k !== c);
          const ax = v3.unit(v3.sub(P[c], P[pd])), base = P.map((p) => p), p0 = pen();
          let mejor = p0, mejorAng = 0;
          for (const ang of [rad(60), rad(120), rad(180), rad(240), rad(300)]) {
            for (let k = 0; k < P.length; k++) P[k] = base[k];
            gira(ids, P[c], ax, ang); const q = pen();
            if (q < mejor - 1e-6) { mejor = q; mejorAng = ang; }
          }
          for (let k = 0; k < P.length; k++) P[k] = base[k];
          if (mejorAng) { gira(ids, P[c], ax, mejorAng); cambio = true; }
        }
        if (!cambio) break;
      }
      for (let k = 0; k < n; k++) pos[k] = P[k];
      Hs.forEach((h, q) => { h.p = P[n + q]; });
    }
    const todos = [...pos, ...Hs.map((h) => h.p)], c = todos.reduce((t, p) => v3.add(t, p), [0, 0, 0]).map((x) => x / todos.length);
    const atomos = [...M.at.map((a, i) => ({ sim: a.el, p: v3.sub(pos[i], c), i })), ...Hs.map((h) => ({ sim: 'H', p: v3.sub(h.p, c), de: h.de }))];
    const enlaces = [];
    M.at.forEach((a, i) => { if (a.padre >= 0) enlaces.push({ a: a.padre, b: i, o: a.ord }); a.cierres.forEach((x) => { if (x.j > i) enlaces.push({ a: i, b: x.j, o: x.ord }); }); });
    Hs.forEach((h, q) => enlaces.push({ a: h.de, b: n + q, o: 1 }));
    const radio = Math.max(...atomos.map((x) => v3.norm(x.p))) + 1;
    return { atomos, enlaces, radio };
  }

  function etiquetaGeometrica(M, geo, i, rg) {
    const idx = (t) => (t === 'H' ? geo.atomos.findIndex((x) => x.de === i) : t);
    const p = (t) => geo.atomos[idx(t)].p, c = geo.atomos[i].p;
    const va = v3.sub(p(rg[0]), c), vb = v3.sub(p(rg[1]), c), vc = v3.sub(p(rg[2]), c);
    return v3.dot(va, v3.cross(vb, vc)) < 0 ? 'R' : 'S';
  }
  const diedro = (geo, a, b, c, d) => {
    const P = (i) => geo.atomos[i].p, b1 = v3.sub(P(b), P(a)), b2 = v3.sub(P(c), P(b)), b3 = v3.sub(P(d), P(c));
    const n1 = v3.cross(b1, b2), n2 = v3.cross(b2, b3), m1 = v3.cross(n1, v3.unit(b2));
    return (Math.atan2(v3.dot(m1, n2), v3.dot(n1, n2)) * 180) / Math.PI;
  };

  function variantes(M, est) {
    const cs = est.centros, ds = est.dobles, tog = [...new Set([...cs.map((c) => c.i), ...(est.anillo ? est.anillo.caras.map((x) => x.i) : [])])];
    if (!tog.length && !ds.length) return [];
    const aristas = [];
    for (const d of ds) {
      const hijoA = M.at[d.a].hijos.find((h) => h !== d.b), hijoB = M.at[d.b].hijos[0];
      for (const k of [hijoA !== undefined ? hijoA : d.a, hijoB]) if (k !== undefined && !aristas.includes(k)) aristas.push(k);
    }
    if (tog.length + aristas.length > 8) return null;
    const total = 2 ** (tog.length + aristas.length), res = [], vistas = new Set();
    for (let mask = 0; mask < total; mask++) {
      const chir = {}, marcas = {};
      tog.forEach((i, q) => { chir[i] = mask & (1 << q) ? '@' : '@@'; });
      aristas.forEach((k, q) => { marcas[k] = mask & (1 << (tog.length + q)) ? '/' : '\\'; });
      const s = escribe(M, { chir, marcas, sinMarcas: true });
      const N = leer(s), e2 = estereo(N);
      if (vistas.has(e2.clave)) continue;
      vistas.add(e2.clave);
      res.push({ smiles: s, est: e2, M: N });
    }
    return res;
  }

  const ISOMEROS = {
    C4H10: ['CCCC', 'CC(C)C'], C5H12: ['CCCCC', 'CCC(C)C', 'CC(C)(C)C'], C2H6O: ['CCO', 'COC'], C3H8O: ['CCCO', 'CC(O)C', 'CCOC'],
    C3H6O: ['CCC=O', 'CC(C)=O', 'C=CCO', 'C=COC'], C3H6: ['C=CC', 'C1CC1'], C4H8: ['C=CCC', 'CC=CC', 'CC(C)=C', 'C1CCC1', 'CC1CC1'], C2H4O2: ['CC(=O)O', 'COC=O'],
    C3H6O2: ['CCC(=O)O', 'CC(=O)OC', 'COCC=O'.replace('COCC=O', 'CCOC=O')],
    C4H10O: ['CCCCO', 'CCC(C)O', 'CC(C)CO', 'CC(C)(C)O', 'CCCOC', 'CC(C)OC', 'CCOCC'],
    C4H8O: ['CCCC=O', 'CCC(C)=O', 'CC(C)C=O'], C3H7N: ['C=CCN'],
    C7H8O: ['Cc1ccccc1O', 'Cc1cccc(O)c1', 'Cc1ccc(O)cc1', 'OCc1ccccc1', 'COc1ccccc1'], C8H10: ['CCc1ccccc1', 'Cc1ccccc1C', 'Cc1cccc(C)c1', 'Cc1ccc(C)cc1'],
    C5H10: ['C=CCCC', 'CC=CCC', 'CC(C)=CC', 'C=C(C)CC', 'C=CC(C)C', 'C1CCCC1', 'CC1CCC1', 'CCC1CC1', 'CC1CC1C'],
  };
  function isomerosDe(formulaPlano) {
    const lista = ISOMEROS[formulaPlano];
    if (!lista) return null;
    return lista.map((s) => { const M = leer(s); let nombre = ''; try { nombre = nombrar(M, estereo(M)).txt; } catch (e) { nombre = ''; } return { smiles: s, nombre }; });
  }
  const esc2 = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function posicionAreno(M) {
    if (!M.aromatico) return null;
    const R = M.anillo, ks = R.map((x, k) => k).filter((k) => fichas(M, R[k]).some((t) => t !== 'H' && !M.enAnillo.has(t)));
    if (ks.length !== 2) return null;
    const d = Math.min((ks[1] - ks[0]) % 6, 6 - ((ks[1] - ks[0]) % 6));
    return { tipo: ['', 'ortho', 'méta', 'para'][d], locs: [1, d + 1] };
  }
  const ALCANOS = [1, 1, 1, 2, 3, 5, 9, 18, 35, 75];   // C1…C10

  function resolver(sc) {
    const M = leer(sc.smiles), f = formulaDe(M), est = estereo(M), gr = grupos(M);
    const masa = Object.entries(f.c).reduce((t, [e, q]) => t + q * masaDe(e), 0);
    let nom = null, errorNombre = '';
    try { nom = nombrar(M, est); } catch (e) { errorNombre = e.message; }
    const geo = coordenadas(M);
    const lista = variantes(M, est);
    let vars = null;
    if (lista) {
      vars = lista.map((v) => {
        let nombre = ''; try { nombre = nombrar(v.M, v.est).txt; } catch (e) { nombre = ''; }
        const desc = v.est.centros.map((c) => c.label || '?').join('');
        const rel = !est.completo ? '' : v.est.clave === est.clave ? 'este' : (v.est.clave === est.claveEspejo ? 'énantiomère' : 'diastéréoisomère');
        return { smiles: v.smiles, nombre, quiral: v.est.quiral, rel, desc, anillo: (v.est.anillo && v.est.anillo.relacion) || '' };
      });
    }
    const pasos = [];
    pasos.push({ t: 'Structure', html: `La molécule a ${M.at.length} atomes autres que H et ${f.c.H || 0} hydrogènes : formule moléculaire <b>${f.txt}</b> et masse molaire ${coma(masa, 2)} g/mol.` });
    pasos.push({ t: 'Groupes fonctionnels', html: gr.length ? `Je trouve : ${gr.join(', ')}.` : 'Il n’y a que des liaisons simples entre carbones et hydrogènes : c’est un alcane.' });
    if (nom) {
      const P = nom.cadena, tc = nom.tipoC;
      if (nom.anillo) pasos.push({ t: 'Cycle ou chaîne', html: `Il y a un cycle de ${M.anillo.length} carbones. Il est le composé parent s’il a plus de groupes principaux que la chaîne et, en cas d’égalité, s’il a autant de carbones que la plus longue chaîne ou plus : ici le parent est <b>${nom.aromatico ? 'le benzène' : 'le cycle'}</b>.` });
      else if (M.anillo) pasos.push({ t: 'Cycle ou chaîne', html: `Il y a un cycle de ${M.anillo.length} carbones, mais c’est la chaîne qui commande (plus de groupes principaux ou plus de carbones que le cycle) : le cycle devient un substituant (<b>${nom.aromatico || M.aromatico ? 'phényle' : 'cyclo…yle'}</b>).` });
      pasos.push({ t: 'Groupe principal', html: nom.principal ? `Le groupe de plus haute priorité est <b>${GRUPO[nom.principal]}</b> : il devient le suffixe du nom (ordre : acide > ester > amide > nitrile > aldéhyde > cétone > alcool > thiol > amine).` : 'Il n’y a aucun groupe à suffixe : on le nomme comme un hydrocarbure et tout le reste devient préfixes.' });
      if (nom.anillo) {
        pasos.push({ t: 'Numérotation du cycle', html: `On numérote en donnant 1 à l’atome portant le groupe principal ; s’il n’y en a pas, à un carbone de la double liaison (cycloalcènes) ou à celui qui donne les indices les plus bas à l’ensemble des substituants ; en cas d’égalité, à celui qui vient en premier par ordre alphabétique.` });
        const pos = posicionAreno(M);
        if (pos) pasos.push({ t: 'Ortho, méta ou para', html: `Les deux substituants du benzène sont aux positions ${pos.locs.join(' et ')} : on l’appelle <b>${pos.tipo}</b> (ortho = positions 1,2 ; méta = 1,3 ; para = 1,4). Dans le nom IUPAC, on utilise les chiffres.` });
        pasos.push({ t: 'Nom', html: `Les substituants sont classés par ordre alphabétique (sans compter di-, tri-…) et se placent devant : <b>${nom.txt}</b>${nom.alias ? ` (forme systématique : ${esc2(nom.alias)})` : ''}.` });
        if (nom.fuera.length) pasos.push({ t: 'Configuration dans un substituant', html: `Il y a ${nom.fuera.join(' et ')} dans un substituant : sa configuration n’apparaît pas dans le nom ci-dessus, mais elle est calculée dans les étapes suivantes.` });
      } else {
      pasos.push({ t: 'Chaîne principale', html: `La chaîne principale est celle qui contient le plus de groupes principaux, puis le plus de liaisons multiples et ensuite le plus de carbones : <b>${P.length} carbone${P.length > 1 ? 's' : ''}</b> (${NUM[P.length]}an…).` });
      pasos.push({ t: 'Numérotation', html: `On numérote par l’extrémité qui donne les indices les plus bas, dans cet ordre : groupe principal, liaisons multiples et substituants.` });
      pasos.push({ t: 'Nom', html: `Les substituants sont classés par ordre alphabétique (sans compter di-, tri-…) et se placent devant : <b>${nom.txt}</b>.` });
      if (nom.fuera.length) pasos.push({ t: 'Configuration dans un substituant', html: `Il y a ${nom.fuera.join(' et ')} dans un substituant : sa configuration n’apparaît pas dans le nom ci-dessus, mais elle est calculée dans les étapes suivantes.` });
      }
    } else pasos.push({ t: 'Nom', html: `Je ne peux pas la nommer : ${errorNombre}.` });
    for (const c of est.centros) {
      const loc = nom ? nom.locAt(c.i) : null;
      const prio = c.rg.map((t, q) => `${q + 1}. ${t === 'H' ? 'H' : M.at[t].el + (M.at[t].h ? `(${M.at[t].h}H)` : '')}`).join(' &gt; ');
      pasos.push({ t: `Centre chiral${loc ? ' C' + loc : ''}`, html: `Il a quatre substituants différents. Priorités CIP : ${prio}. ${c.label ? `Avec celui de plus faible priorité à l’arrière, les trois autres tournent ${c.label === 'R' ? 'dans le sens horaire : <b>R</b>' : 'dans le sens antihoraire : <b>S</b>'}.` : 'La configuration manque : écrivez @ ou @@ dans le SMILES (par exemple [C@H]).'}` });
    }
    if (est.anillo) {
      const an = est.anillo, locs = an.caras.map((x) => (nom && nom.locAt(x.i)) || '?');
      pasos.push({ t: 'Isomérie cis/trans du cycle', html: an.relacion ? `Les substituants de ${locs.join(' et ')} sont sur la ${an.relacion === 'cis' ? '<b>même face</b> du cycle : <b>cis</b>' : '<b>face opposée</b> du cycle : <b>trans</b>'}.` : `Le cycle a ${an.caras.length} substituants qui peuvent aller au-dessus ou en dessous du plan (cis ou trans). Marquez chacun avec @ ou @@ dans le SMILES (par exemple C[C@H]1CCCC[C@H]1C).` });
    }
    for (const d of est.dobles) pasos.push({ t: 'Double liaison avec isomérie géométrique', html: d.label ? `Les substituants de plus haute priorité de chaque carbone sont ${d.label === 'Z' ? 'du même côté : <b>Z</b>' : 'de côtés opposés : <b>E</b>'}.` : 'Chaque carbone a deux substituants différents, donc il y a des isomères E et Z. Marquez le côté avec / et \\ dans le SMILES (par exemple C/C=C\\C).' });
    return {
      smiles: sc.smiles.replace(/\s+/g, ''), M, formula: f.txt, formulaPlano: f.plano, masa, grupos: gr, nombre: nom ? nom.txt : '', errorNombre, nom,
      estereo: { centros: est.centros, dobles: est.dobles, anillo: est.anillo, quiral: est.quiral, completo: est.completo, lista: vars, nTeorico: 2 ** (est.nTog + est.dobles.length) },
      anillo: M.anillo ? { n: M.anillo.length, aromatico: M.aromatico, relacion: est.anillo ? est.anillo.relacion : null, posicion: posicionAreno(M) } : null, alias: nom ? nom.alias : '',
      atomos: geo.atomos, enlaces: geo.enlaces, radio: geo.radio, geo,
      isomeros: isomerosDe(f.plano), pasos,
    };
  }
  function enantiomero(smiles) {
    const M = leer(smiles), chir = {};
    for (let i = 0; i < M.at.length; i++) if (M.at[i].chir) chir[i] = M.at[i].chir === '@' ? '@@' : '@';
    return escribe(M, { chir });
  }

  const ejemplos = [
    { clave: 'butano', nombre: 'Butane', sc: { smiles: 'CCCC' } },
    { clave: 'isobutano', nombre: '2-Méthylpropane (isobutane)', sc: { smiles: 'CC(C)C' } },
    { clave: 'dimetilbutano', nombre: '3-Éthyl-2-méthylpentane', sc: { smiles: 'CCC(CC)C(C)C' } },
    { clave: 'but1eno', nombre: 'But-1-ène', sc: { smiles: 'C=CCC' } },
    { clave: 'but2eno-e', nombre: '(E)-but-2-ène', sc: { smiles: 'C/C=C/C' } },
    { clave: 'but2eno-z', nombre: '(Z)-but-2-ène', sc: { smiles: 'C/C=C\\C' } },
    { clave: 'dieno', nombre: 'Buta-1,3-diène', sc: { smiles: 'C=CC=C' } },
    { clave: 'propino', nombre: 'Propyne', sc: { smiles: 'C#CC' } },
    { clave: 'etanol', nombre: 'Éthanol', sc: { smiles: 'CCO' } },
    { clave: 'propan2ol', nombre: 'Propan-2-ol', sc: { smiles: 'CC(O)C' } },
    { clave: 'butan2ol-s', nombre: '(S)-butan-2-ol', sc: { smiles: 'CC[C@H](C)O' } },
    { clave: 'butan2ol-r', nombre: '(R)-butan-2-ol', sc: { smiles: 'CC[C@@H](C)O' } },
    { clave: 'eter', nombre: 'Méthoxyéthane (éther)', sc: { smiles: 'COCC' } },
    { clave: 'propanona', nombre: 'Propanone (acétone)', sc: { smiles: 'CC(C)=O' } },
    { clave: 'propanal', nombre: 'Propanal', sc: { smiles: 'CCC=O' } },
    { clave: 'acetico', nombre: 'Acide éthanoïque (acétique)', sc: { smiles: 'CC(=O)O' } },
    { clave: 'lactico', nombre: 'Acide L-lactique', sc: { smiles: 'C[C@H](O)C(=O)O' } },
    { clave: 'alanina', nombre: 'L-Alanine', sc: { smiles: 'N[C@@H](C)C(=O)O' } },
    { clave: 'acetato', nombre: 'Éthanoate d’éthyle (acétate d’éthyle)', sc: { smiles: 'CC(=O)OCC' } },
    { clave: 'amide', nombre: 'Éthanamide', sc: { smiles: 'CC(=O)N' } },
    { clave: 'nitrile', nombre: 'Éthanenitrile', sc: { smiles: 'CC#N' } },
    { clave: 'etilamina', nombre: 'Éthanamine', sc: { smiles: 'CCN' } },
    { clave: 'cloroalcano', nombre: '2-Chlorobutane (chiral)', sc: { smiles: 'CC[C@H](C)Cl' } },
    { clave: 'tartarico-meso', nombre: 'Acide tartrique méso', sc: { smiles: 'O=C(O)[C@H](O)[C@@H](O)C(=O)O' } },
    { clave: 'tartarico-l', nombre: 'Acide L-(+)-tartrique', sc: { smiles: 'O=C(O)[C@H](O)[C@H](O)C(=O)O' } },
    { clave: 'dicloropentano', nombre: '2,3-Dichlorobutane (2 centres)', sc: { smiles: 'C[C@H](Cl)[C@@H](Cl)C' } },
    { clave: 'ciclopropano', nombre: 'Cyclopropane', sc: { smiles: 'C1CC1' } },
    { clave: 'ciclohexano', nombre: 'Cyclohexane', sc: { smiles: 'C1CCCCC1' } },
    { clave: 'metilciclohexano', nombre: 'Méthylcyclohexane', sc: { smiles: 'CC1CCCCC1' } },
    { clave: 'ciclohexanol', nombre: 'Cyclohexanol', sc: { smiles: 'OC1CCCCC1' } },
    { clave: 'ciclohexeno', nombre: 'Cyclohexène', sc: { smiles: 'C1=CCCCC1' } },
    { clave: 'ciclohexilmetanol', nombre: 'Cyclohexylméthanol (le cycle est un substituant)', sc: { smiles: 'OCC1CCCCC1' } },
    { clave: 'cis12', nombre: 'cis-1,2-Diméthylcyclohexane (méso)', sc: { smiles: 'C[C@H]1CCCC[C@H]1C' } },
    { clave: 'trans12', nombre: 'trans-1,2-Diméthylcyclohexane (chiral)', sc: { smiles: 'C[C@H]1CCCC[C@@H]1C' } },
    { clave: 'cis14', nombre: 'cis-1,4-Diméthylcyclohexane', sc: { smiles: 'C[C@H]1CC[C@@H](C)CC1' } },
    { clave: 'benceno', nombre: 'Benzène', sc: { smiles: 'c1ccccc1' } },
    { clave: 'tolueno', nombre: 'Toluène (méthylbenzène)', sc: { smiles: 'Cc1ccccc1' } },
    { clave: 'fenol', nombre: 'Phénol', sc: { smiles: 'Oc1ccccc1' } },
    { clave: 'anilina', nombre: 'Aniline', sc: { smiles: 'Nc1ccccc1' } },
    { clave: 'benzoico', nombre: 'Acide benzoïque', sc: { smiles: 'OC(=O)c1ccccc1' } },
    { clave: 'benzaldehido', nombre: 'Benzaldéhyde', sc: { smiles: 'O=Cc1ccccc1' } },
    { clave: 'xileno-o', nombre: '1,2-Diméthylbenzène (ortho)', sc: { smiles: 'Cc1ccccc1C' } },
    { clave: 'xileno-m', nombre: '1,3-Diméthylbenzène (méta)', sc: { smiles: 'Cc1cccc(C)c1' } },
    { clave: 'xileno-p', nombre: '1,4-Diméthylbenzène (para)', sc: { smiles: 'Cc1ccc(C)cc1' } },
    { clave: 'cresol', nombre: '4-Méthylphénol (p-crésol)', sc: { smiles: 'Cc1ccc(O)cc1' } },
    { clave: 'salicilico', nombre: 'Acide 2-hydroxybenzoïque (salicylique)', sc: { smiles: 'OC(=O)c1ccccc1O' } },
    { clave: 'fenilbutano', nombre: 'sec-Butylbenzène (centre S dans le substituant)', sc: { smiles: 'CC[C@H](C)c1ccccc1' } },
  ];

  return { resolver, leer, escribe, nombrar, estereo, coordenadas, etiquetaGeometrica, diedro, centroEstereo, enantiomero, isomerosDe, variantes, formulaDe, ejemplos, ISOMEROS, ALCANOS, NUM, v3 };
})();

