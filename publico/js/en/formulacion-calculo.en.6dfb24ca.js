const Formulacion = (() => {
  const SUBS = '₀₁₂₃₄₅₆₇₈₉', ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const PREF = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
  const PREFG = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis', 'heptakis'];
  const SIMBOLOS = new Set('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' '));
  const IDI = 'en';
  const ajusta = (t) => {
    if (!t || !t.replace) return t;
    if (IDI === 'fr') return t.replace(/(^|[\s(])de (?=[aeiouyhéèêAEIOUYH])/g, '$1d’');
    if (IDI === 'de') return t.toLowerCase().replace(/^./, (c) => c.toUpperCase()).replace(/\(([ivx]+)\)/g, (m, r) => '(' + r.toUpperCase() + ')').replace(/ säure/g, ' Säure');
    return t;
  };
  const ordTrad = (a, m) => (IDI === 'en' ? `${m} ${a}` : `${a} ${m}`);
  const MONOXIDO = ['monooxide', 'monoxide']; // «monoóxido» se escribe «monóxido»
  const mcd = (a, b) => (b ? mcd(b, a % b) : a);
  const sa = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const norm = (s) => sa(String(s).toLowerCase()).replace(/[^a-z0-9]/g, '');
  const fh = (f) => String(f).replace(/\d+/g, '<sub>$&</sub>'); // fórmula en HTML
  const ft = (f) => String(f).replace(/\d/g, (d) => SUBS[d]); // fórmula en texto con subíndices
  const pre = (n, mono = false) => (n === 1 && !mono ? '' : PREF[n]);
  const ionH = (f, z) => `${fh(f)}<sup>${Math.abs(z) > 1 ? Math.abs(z) : ''}${z > 0 ? '+' : '−'}</sup>`;

  const METALES = [
    ['Li', 'lithium', [1], [], {}, 1], ['Na', 'sodium', [1], [], {}, 1], ['K', 'potassium', [1], [], {}, 1], ['Rb', 'rubidium', [1]], ['Cs', 'caesium', [1]], ['Ag', 'silver', [1], [], {}, 1],
    ['Be', 'beryllium', [2]], ['Mg', 'magnesium', [2], [], {}, 1], ['Ca', 'calcium', [2], [], {}, 1], ['Sr', 'strontium', [2]], ['Ba', 'barium', [2], [], {}, 1],
    ['Zn', 'zinc', [2], [], {}, 1], ['Cd', 'cadmium', [2]], ['Al', 'aluminium', [3], [], {}, 1],
    ['Cu', 'copper', [1, 2], [], { 1: 'cuprous', 2: 'cupric' }, 1], ['Hg', 'mercury', [1, 2], [], { 1: 'mercurous', 2: 'mercuric' }, 1],
    ['Au', 'gold', [1, 3], [], { 1: 'aurous', 3: 'auric' }, 1], ['Fe', 'iron', [2, 3], [], { 2: 'ferrous', 3: 'ferric' }, 1],
    ['Co', 'cobalt', [2, 3], [], { 2: 'cobaltous', 3: 'cobaltic' }, 1], ['Ni', 'nickel', [2, 3], [], { 2: 'nickelous', 3: 'nickelic' }, 1],
    ['Sn', 'tin', [2, 4], [], { 2: 'stannous', 4: 'stannic' }, 1], ['Pb', 'lead', [2, 4], [], { 2: 'plumbous', 4: 'plumbic' }, 1],
    ['Pt', 'platinum', [2, 4], [], { 2: 'platinous', 4: 'platinic' }],
    ['Cr', 'chromium', [2, 3], [6], { 2: 'chromous', 3: 'chromic' }, 1], ['Mn', 'manganese', [2, 3], [4, 7], { 2: 'manganous', 3: 'manganic' }, 1],
    ['Ti', 'titanium', [3, 4]], ['Bi', 'bismuth', [3]],
  ];
  const PEROXIDOS = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Zn', 'Cd', 'Cu', 'Ag'];
  const NOMETALES = [
    ['N', 'nitrogen', [1, 2, 3, 4, 5], [3], [3], [], 1], ['P', 'phosphorus', [3, 5], [3, 5], [3, 5], [3, 5], 1], ['As', 'arsenic', [3, 5], [3, 5], [3, 5], [3, 5]], ['Sb', 'antimony', [3, 5], [3, 5], [3, 5], [3, 5]],
    ['C', 'carbon', [2, 4], [4], [4], [4], 1], ['Si', 'silicon', [4], [4], [4], [4], 1], ['B', 'boron', [3], [3], [3], [3], 1],
    ['S', 'sulfur', [4, 6], [4, 6], [2], [], 1], ['Se', 'selenium', [4, 6], [4, 6], [4], []], ['Te', 'tellurium', [4, 6], [4, 6], [4], []],
    ['Cl', 'chlorine', [1, 3, 5, 7], [1, 3, 5], [], [], 1], ['Br', 'bromine', [1, 3, 5, 7], [1, 3, 5], [], []], ['I', 'iodine', [1, 3, 5, 7], [1, 3, 5, 7], [], []],
  ];
  const MONO = [
    ['F', 'fluoride', 1, 'hydrofluoric', 1], ['Cl', 'chloride', 1, 'hydrochloric', 1], ['Br', 'bromide', 1, 'hydrobromic', 1], ['I', 'iodide', 1, 'hydroiodic', 1],
    ['S', 'sulfide', 2, 'hydrosulfuric', 1], ['Se', 'selenide', 2, 'hydroselenic'], ['Te', 'telluride', 2, 'hydrotelluric'],
    ['N', 'nitride', 3], ['P', 'phosphide', 3], ['As', 'arsenide', 3], ['C', 'carbide', 4], ['Si', 'silicide', 4], ['B', 'boride', 3],
  ];
  const OXO = [
    ['Cl', 1, 1, 1, 1, 'hypochlorous', 'hypochlorite', 1], ['Cl', 3, 2, 1, 1, 'chlorous', 'chlorite', 1], ['Cl', 5, 3, 1, 1, 'chloric', 'chlorate', 1], ['Cl', 7, 4, 1, 1, 'perchloric', 'perchlorate', 1],
    ['Br', 1, 1, 1, 1, 'hypobromous', 'hypobromite'], ['Br', 3, 2, 1, 1, 'bromous', 'bromite'], ['Br', 5, 3, 1, 1, 'bromic', 'bromate'], ['Br', 7, 4, 1, 1, 'perbromic', 'perbromate'],
    ['I', 1, 1, 1, 1, 'hypoiodous', 'hypoiodite'], ['I', 3, 2, 1, 1, 'iodous', 'iodite'], ['I', 5, 3, 1, 1, 'iodic', 'iodate'], ['I', 7, 4, 1, 1, 'periodic', 'periodate'],
    ['S', 4, 3, 2, 1, 'sulfurous', 'sulfite', 1], ['S', 6, 4, 2, 1, 'sulfuric', 'sulfate', 1],
    ['Se', 4, 3, 2, 1, 'selenious', 'selenite'], ['Se', 6, 4, 2, 1, 'selenic', 'selenate'], ['Te', 4, 3, 2, 1, 'tellurous', 'tellurite'], ['Te', 6, 4, 2, 1, 'telluric', 'tellurate'],
    ['N', 3, 2, 1, 1, 'nitrous', 'nitrite', 1], ['N', 5, 3, 1, 1, 'nitric', 'nitrate', 1],
    ['P', 3, 3, 3, 1, 'phosphorous', 'phosphite'], ['P', 5, 4, 3, 1, 'phosphoric', 'phosphate', 1],
    ['As', 3, 3, 3, 1, 'arsenous', 'arsenite'], ['As', 5, 4, 3, 1, 'arsen' + 'ic', 'arsenate'],
    ['C', 4, 3, 2, 1, 'carbonic', 'carbonate', 1], ['Si', 4, 3, 2, 1, 'silicic', 'silicate'], ['B', 3, 3, 3, 1, 'boric', 'borate'],
    ['Cr', 6, 4, 2, 1, 'chromic', 'chromate', 1], ['Cr', 6, 7, 2, 2, 'dichromic', 'dichromate', 1],
    ['Mn', 7, 4, 1, 1, 'permanganic', 'permanganate', 1],
    ['P', 5, 7, 4, 2, 'diphosphoric', 'diphosphate'], ['S', 6, 7, 2, 2, 'disulfuric', 'disulfate'],
    ['Si', 4, 4, 4, 1, 'orthosilicic', 'orthosilicate'], ['B', 3, 2, 1, 1, 'metaboric', 'metaborate'],
  ];
  const ALIAS_EXTRA = [['H2SiO3', ['metasilicic acid']], ['Na2SiO3', ['sodium metasilicate']], ['H3BO3', ['orthoboric acid']], ['H3PO4', ['orthophosphoric acid']], ['H4P2O7', ['pyrophosphoric acid']], ['H2S2O7', ['pyrosulfuric acid']], ['Na2S2O7', ['sodium pyrosulfate']], ['Na4P2O7', ['sodium pyrophosphate']], ['H2O2', ['hydrogen peroxide solution']], ['NH3', ['azane']]];
  const ATO = { Cl: 'chlorate', Br: 'bromate', I: 'iodate', S: 'sulfate', Se: 'selenate', Te: 'tellurate', N: 'nitrate', P: 'phosphate', As: 'arsenate', C: 'carbonate', Si: 'silicate', B: 'borate', Cr: 'chromate', Mn: 'manganate' };
  const ICO = { Cl: 'chloric', Br: 'bromic', I: 'iodic', S: 'sulfuric', Se: 'selenic', Te: 'telluric', N: 'nitric', P: 'phosphoric', As: 'arsen' + 'ic', C: 'carbonic', Si: 'silicic', B: 'boric', Cr: 'chromic', Mn: 'manganic' };
  const ESPECIALES = [
    ['H2O', 'Water', [['Systematic', 'dihydrogen oxide'], ['Common name', 'water']], 1],
    ['NH3', 'Nonmetal hydride', [['Systematic', 'nitrogen trihydride'], ['IUPAC (hydrides)', 'azane'], ['Common name', 'ammonia']], 1],
    ['PH3', 'Nonmetal hydride', [['Systematic', 'phosphorus trihydride'], ['IUPAC (hydrides)', 'phosphane'], ['Common name', 'phosphine']]],
    ['AsH3', 'Nonmetal hydride', [['Systematic', 'arsenic trihydride'], ['IUPAC (hydrides)', 'arsane'], ['Common name', 'arsine']]],
    ['SbH3', 'Nonmetal hydride', [['Systematic', 'antimony trihydride'], ['IUPAC (hydrides)', 'stibane'], ['Common name', 'stibine']]],
    ['CH4', 'Nonmetal hydride', [['Systematic', 'carbon tetrahydride'], ['IUPAC (hydrides)', 'methane']], 1],
    ['SiH4', 'Nonmetal hydride', [['Systematic', 'silicon tetrahydride'], ['IUPAC (hydrides)', 'silane']], 1],
    ['BH3', 'Nonmetal hydride', [['Systematic', 'boron trihydride'], ['IUPAC (hydrides)', 'borane']]],
    ['H2MnO4', 'Oxoacid', [['Traditional', 'manganic acid'], ['Systematic', 'dihydrogen tetraoxidomanganate']]], ['K2MnO4', 'Oxysalt', [['Traditional', 'potassium manganate'], ['Systematic', 'dipotassium tetraoxidomanganate']]], ['Na2MnO4', 'Oxysalt', [['Traditional', 'sodium manganate']]],
    ['HPO3', 'Oxoacid', [['Traditional', 'metaphosphoric acid'], ['Systematic', 'hydrogen trioxidophosphate']]],
    ['O3', 'Element', [['Systematic', 'trioxygen'], ['Common name', 'ozone']], 1], ['O2', 'Element', [['Systematic', 'dioxygen'], ['Common name', 'oxygen']], 1], ['H2', 'Element', [['Systematic', 'dihydrogen'], ['Common name', 'hydrogen']], 1],
    ['N2', 'Element', [['Systematic', 'dinitrogen'], ['Common name', 'nitrogen']], 1], ['F2', 'Element', [['Systematic', 'difluorine'], ['Common name', 'fluorine']]], ['Cl2', 'Element', [['Systematic', 'dichlorine'], ['Common name', 'chlorine']], 1],
    ['Br2', 'Element', [['Systematic', 'dibromine'], ['Common name', 'bromine']]], ['I2', 'Element', [['Systematic', 'diiodine'], ['Common name', 'iodine']]], ['P4', 'Element', [['Systematic', 'tetraphosphorus'], ['Common name', 'white phosphorus']]], ['S8', 'Element', [['Systematic', 'octasulfur'], ['Common name', 'sulfur']]],
    ['H3PO2', 'Oxoacid', [['Traditional', 'hypophosphorous acid'], ['IUPAC', 'phosphinic acid']]],
    ['H2S2O3', 'Thioacid', [['Traditional', 'thiosulfuric acid'], ['Systematic', 'dihydrogen trioxidosulfidosulfate']]], ['Na2S2O3', 'Thiosulfate', [['Traditional', 'sodium thiosulfate'], ['Systematic', 'disodium trioxidosulfidosulfate']]], ['K2S2O3', 'Thiosulfate', [['Traditional', 'potassium thiosulfate']]],
    ['HSCN', 'Thioacid', [['Traditional', 'thiocyanic acid'], ['IUPAC', 'hydrogen thiocyanate']]], ['KSCN', 'Thiocyanate', [['Traditional', 'potassium thiocyanate']]], ['NaSCN', 'Thiocyanate', [['Traditional', 'sodium thiocyanate']]], ['NH4SCN', 'Thiocyanate', [['Traditional', 'ammonium thiocyanate']]],
    ['H2SO5', 'Peroxoacid', [['Traditional', 'peroxosulfuric acid'], ['Systematic', 'dihydrogen peroxidotrioxidosulfate']]], ['H2S2O8', 'Peroxoacid', [['Traditional', 'peroxodisulfuric acid']]], ['HNO4', 'Peroxoacid', [['Traditional', 'peroxonitric acid']]],
    ['K2S2O8', 'Peroxosalt', [['Traditional', 'potassium peroxodisulfate']]], ['Na2S2O8', 'Peroxosalt', [['Traditional', 'sodium peroxodisulfate']]], ['(NH4)2S2O8', 'Peroxosalt', [['Traditional', 'ammonium peroxodisulfate']]],
    ['CaC2', 'Carbide', [['Traditional', 'calcium carbide'], ['Systematic', 'calcium dicarbide'], ['IUPAC', 'calcium acetylide']]],
    ['KAl(SO4)2', 'Double salt', [['Traditional', 'aluminium potassium sulfate'], ['Systematic', 'aluminium potassium bis(tetraoxidosulfate)']]], ['NaKCO3', 'Double salt', [['Traditional', 'potassium sodium carbonate']]],
    ['CaMg(CO3)2', 'Double salt', [['Traditional', 'calcium magnesium carbonate']]], ['MgNH4PO4', 'Double salt', [['Traditional', 'ammonium magnesium phosphate']]], ['KNaSO4', 'Double salt', [['Traditional', 'potassium sodium sulfate']]],
  ];

  function leeFormula(texto) {
    const s = String(texto ?? '').replace(/\s+/g, '').replace(/[₀-₉]/g, (c) => SUBS.indexOf(c)).replace(/[[{]/g, '(').replace(/[\]}]/g, ')');
    if (!s) throw new Error('Type a formula, for example Fe2O3 or H2SO4.');
    let i = 0;
    const numero = () => { let t = ''; while (/\d/.test(s[i] || '')) t += s[i++]; return t ? +t : 1; };
    function grupo(dentro) {
      const c = {};
      const suma = (g, k) => { for (const e in g) c[e] = (c[e] || 0) + g[e] * k; };
      while (i < s.length) {
        const ch = s[i];
        if (ch === '(') { i++; const g = grupo(true); suma(g, numero()); }
        else if (ch === ')') { if (!dentro) throw new Error('There is a closing parenthesis that was never opened.'); i++; return c; }
        else if (/[A-Z]/.test(ch)) {
          let sim = ch; i++;
          if (/[a-z]/.test(s[i] || '')) sim += s[i++];
          if (!SIMBOLOS.has(sim)) throw new Error(`“${sim}” is not the symbol of any element. Symbols have the first letter in capitals and the second in lowercase (Co is cobalt, CO is carbon monoxide).`);
          suma({ [sim]: 1 }, numero());
        } else throw new Error(`I don't understand the character “${ch}” in the formula. Use element symbols, numbers and parentheses.`);
      }
      if (dentro) throw new Error('A parenthesis is not closed.');
      return c;
    }
    const r = grupo(false);
    if (!Object.keys(r).length) throw new Error('Type a formula, for example Fe2O3 or H2SO4.');
    return r;
  }
  const claveCuenta = (c) => Object.keys(c).sort().map((e) => e + c[e]).join('');

  const cationes = [], aniones = [];
  for (const [sim, nombre, vs, ox = [], trad = {}, comun] of METALES) {
    const multi = vs.length + ox.length > 1;
    for (const v of vs) cationes.push({ cl: 'm', f: sim, nombre, v, multi, trad: (IDI !== 'de' && trad[v]) || null, comun: !!comun, peroxido: PEROXIDOS.includes(sim) });
    for (const v of ox) cationes.push({ cl: 'm', f: sim, nombre, v, multi, trad: (IDI !== 'de' && trad[v]) || null, comun: !!comun, soloOxido: true });
  }
  const CAT_NH4 = { cl: 'am', f: 'NH4', poli: true, nombre: 'ammonium', v: 1, multi: false, trad: null, comun: true };
  const CAT_H = { cl: 'h', f: 'H', nombre: 'hydrogen', v: 1, multi: false, trad: null, comun: true };

  for (const [sim, base, w, hidra, comun] of MONO) aniones.push({ cl: 'mono', f: sim, w, base, hidra, comun: !!comun, hidracido: !!hidra });
  const AN_O = { cl: 'mono', f: 'O', w: 2, base: 'oxide', comun: true, esO: true }, AN_H = { cl: 'mono', f: 'H', w: 1, base: 'hydride', comun: true, esH: true };
  const AN_OH = { cl: 'mono', f: 'OH', w: 1, base: 'hydroxide', poli: true, comun: true, esOH: true }, AN_O2 = { cl: 'per', f: 'O2', w: 2, poli: true, comun: true };
  aniones.push(AN_O, AN_H, AN_OH, AN_O2);
  for (const sim of ['S', 'Se', 'Te']) aniones.push({ cl: 'mono', f: 'H' + sim, w: 1, base: 'hydrogen' + MONO.find((m) => m[0] === sim)[1], poli: true, grupo: true, comun: false, hs: true });
  const pOxido = (k) => (k === 1 ? '' : PREF[k]) + 'oxido', pOxo = (k) => (k === 1 ? '' : PREF[k]) + 'oxo';
  for (const [centro, v, nO, h, k, tAc, tAn, comun] of OXO) {
    const ato = (k === 2 ? 'di' : '') + ATO[centro], ico = (k === 2 ? 'di' : '') + ICO[centro];
    const baseF = `${centro}${k > 1 ? k : ''}O${nO > 1 ? nO : ''}`;
    for (let j = 0; j < h; j++) {
      const ph = j ? (j > 1 ? PREF[j] : '') + 'hydrogen' : '';
      aniones.push({
        cl: 'oxo', f: (j ? 'H' + (j > 1 ? j : '') : '') + baseF, w: h - j, poli: true, grupo: true, comun: !!comun && (j === 0 || ['SO4', 'CO3', 'PO4', 'SO3'].includes(baseF)),
        centro, v, nO, h, j, tAn, bajo: OXO.some((o) => o[0] === centro && o[4] === k && o[1] > v), hipo: v === 1 && ['Cl', 'Br', 'I'].includes(centro), per: v === 7 && ['Cl', 'Br', 'I', 'Mn'].includes(centro),
        sist: `${ph}${pOxido(nO)}${ato}`, stock: `${ph}${pOxo(nO)}${ato}(${ROM[v]})`, trad: `${ph}${tAn}`,
        stockSal: `${pOxo(nO)}${ato}(${ROM[v]})`,
        acidoStock: `${pOxo(nO)}${ico}(${ROM[v]})`, acidoTrad: tAc,
      });
    }
  }

  function nombres(cat, n, an, m) {
    const L = [], alias = [];
    const ca = (k) => pre(k) + cat.nombre; // dihierro
    const stockCat = cat.nombre + (cat.multi ? `(${ROM[cat.v]})` + (IDI === 'de' ? '-' : '') : '');
    const uno = (et, nombre, regla, nota) => { if (nombre) L.push({ et, nombre, regla, nota }); };
    const RS = 'Numerical prefixes (mono-, di-, tri-, tetra-, penta-, hexa-, hepta-…) say how many atoms or groups there are of each.';
    if (cat.cl === 'h' && an.cl === 'oxo') {
      uno('Systematic', `${ca(n)} ${an.sist}`, `${RS} The oxygens are named as “${pOxido(an.nO)}”, the central element ends in -ate and, since it is an acid, the cation is hydrogen${n > 1 ? ' (' + PREF[n] + 'hydrogen for the ' + n + ' atoms)' : ''}.`);
      uno('Stock', `${an.acidoStock} acid`, `“acid” is written, the oxygen prefixes with “oxo”, the root of the central element with -ic and its oxidation state in Roman numerals: ${ROM[an.v]}.`);
      uno('Traditional', `${an.acidoTrad} acid`, tradOxoRegla(an));
      alias.push(`hydrogen ${an.stockSal}`);
    } else if (cat.cl === 'h' && an.cl === 'mono') {
      uno('Systematic', `${ca(n)} ${pre(m)}${an.base}`, `The anion is named with -ide and hydrogen goes first${n > 1 ? ', with the prefix ' + PREF[n] + '- for the ' + n + ' hydrogens' : ''}.`);
      uno('Stock', `hydrogen ${an.base}`, 'Hydrogen always acts with +1: there is no need to indicate its oxidation state.');
      uno('Traditional', `${an.hidra} acid`, 'In aqueous solution it is called the root of the element + “hydro…ic” + “acid”.', 'in aqueous solution');
    } else if (cat.cl === 'h' && an.cl === 'per') {
      uno('Systematic', `${ca(n)} ${PREF[2 * m]}oxide`, `${RS} There are ${2 * m} oxygens and ${n} hydrogens.`);
      uno('Stock', 'hydrogen peroxide', 'The O₂²⁻ group is called peroxide.');
      uno('Common name', 'hydrogen peroxide solution', null, 'in solution');
    } else if (cat.cl === 'nm') {
      const anh = an.esO ? OXO.find((o) => o[0] === cat.f && o[1] === cat.v && o[4] === 1) : null;
      uno('Systematic', `${ca(n)} ${PREF[m]}${an.base}`, `${RS} Here ${PREF[m]}- for the ${an.base.replace('uro', 'uro')} (${m} atoms)${n > 1 ? ' and ' + PREF[n] + '- for the ' + cat.nombre + ' (' + n + ' atoms)' : ' and none for the ' + cat.nombre + ' (there is only one)'}.`);
      uno('Stock', `${stockCat} ${an.base}`, `The oxidation state of ${cat.nombre} is put in parentheses, in Roman numerals: ${ROM[cat.v]}${cat.multi ? '' : ' (here it has only one and it can be omitted)'}.`);
      if (anh) uno('Traditional', `${anh[5]} anhydride`, `The oxides of nonmetals used to be called “anhydrides” (of ${anh[5]} acid).`);
      alias.push(...L.filter((l) => l.et === 'Systematic').flatMap((l) => (m === 1 && n === 1 ? [l.nombre.replace(new RegExp('^' + PREF[1], 'i'), '')] : [])));
    } else if (an.cl === 'per') {
      uno('Systematic', `${ca(n)} ${PREF[2 * m]}oxide`, `${RS} There are ${2 * m} oxygen atoms (${m} O₂ group${m > 1 ? 's' : ''})${n > 1 ? ' and ' + n + ' of ' + cat.nombre : ''}.`);
      uno('Stock', `${stockCat} peroxide`, `The O₂²⁻ group is called peroxide${cat.multi ? '; the oxidation state of ' + cat.nombre + ' goes in Roman numerals' : ''}.`);
      uno('Traditional', cat.trad ? `${cat.trad} peroxide` : cat.multi ? null : `${cat.nombre} peroxide`, cat.trad ? tradMetalRegla(cat) : 'With a single oxidation state “… peroxide” is enough.');
    } else if (an.cl === 'mono') {
      const monoEn = cat.multi || cat.cl === 'nm';
      const grupo = an.grupo ? (m > 1 ? `${PREFG[m]}(${an.base})` : an.base) : pre(m, monoEn) + an.base;
      uno('Systematic', `${ca(n)} ${grupo}`, `${RS}${an.grupo ? ' With groups of several atoms bis-, tris-… and parentheses are used.' : ''} ${prefijosTxt(cat, n, an, m, monoEn)}`);
      uno('Stock', `${stockCat} ${an.base}`, stockRegla(cat));
      uno('Traditional', cat.trad ? ordTrad(an.base, cat.trad) : cat.multi ? null : `${cat.nombre} ${an.base}`, cat.trad ? tradMetalRegla(cat) : 'With a single oxidation state “' + an.base + ' …” is enough.');
      if (!an.grupo) alias.push(`${ca(n)} ${PREF[m]}${an.base}`, `${ca(n)} ${pre(m)}${an.base}`);
      if (an.esO && m >= 4) alias.push(`${ca(n)} ${PREF[m].slice(0, -1)}oxide`);
    } else if (an.cl === 'oxo') {
      const w = m > 1 ? `${PREFG[m]}(${an.sist})` : an.sist;
      uno('Systematic', `${ca(n)} ${w}`, `${RS} ${m > 1 ? `The anion is repeated ${m} times and goes in parentheses with ${PREFG[m]}-. ` : ''}The oxygens are named as “${pOxido(an.nO)}”${an.j ? ' and the hydrogens of the anion with “hydrogen”' : ''}, and the central element ends in -ate.`);
      uno('Stock', `${stockCat} ${an.stock}`, `The oxygens with “${pOxo(an.nO)}”, the central one with -ate and its oxidation state in parentheses (${ROM[an.v]}); also that of ${cat.nombre === 'amonio' ? 'ammonium' : 'the metal'}${cat.multi ? ' (' + ROM[cat.v] + ')' : ''}.`);
      uno('Traditional', `${stockCat} ${an.trad}`, tradOxoRegla(an, true));
      if (cat.trad) L[L.length - 1].otros = [ordTrad(an.trad, cat.trad)];
    }
    const mo = (t) => ajusta(t && t.replace ? t.replace(new RegExp(MONOXIDO[0], 'g'), MONOXIDO[1]) : t);
    for (const l of L) { l.nombre = mo(l.nombre); if (l.otros) l.otros = l.otros.map(mo); }
    return { L, alias: alias.map(mo) };
  }
  const prefijosTxt = (cat, n, an, m, monoEn) => `Here: ${m === 1 && !monoEn ? 'a single ' + an.base + ' (mono- is omitted)' : PREF[m] + '- for the ' + an.base}${n > 1 ? ' and ' + PREF[n] + '- for the ' + cat.nombre : ''}.`;
  const stockRegla = (cat) => (cat.multi ? `${cat.nombre} has several oxidation states: the one it uses here is indicated in parentheses, in Roman numerals (${ROM[cat.v]}).` : `${cat.nombre} only acts with +${cat.v}: no Roman numeral is needed.`);
  const tradMetalRegla = (cat) => `In traditional nomenclature the metal with two oxidation states takes the ending -ous (the lower) or -ic (the higher): with +${cat.v} it is “${cat.trad}”.`;
  function tradOxoRegla(an, sal) {
    const t = sal ? an.tAn : an.acidoTrad;
    const sufijo = sal ? (an.bajo ? '-ite (lower oxidation state)' : '-ate (higher oxidation state)') : (an.bajo ? '-ous (lower oxidation state)' : '-ic (higher oxidation state)');
    const pf = an.hipo ? ', with hypo- (the lowest of the four states)' : an.per ? ', with per- (the highest of the four states)' : '';
    return `The central element (${an.centro}) acts with +${an.v}: the ${sal ? 'anion' : 'acid'} ends in ${sufijo}${pf}.${sal && an.j ? ' The hydrogens it keeps are indicated with “hydrogen” in front.' : ''}`;
  }

  const compuestos = [];
  function tipoDe(cat, an) {
    if (cat.cl === 'h') return an.cl === 'oxo' ? 'Oxoacid' : an.cl === 'per' ? 'Peroxide' : 'Hydracid';
    if (an.cl === 'per') return 'Peroxide';
    if (an.esOH) return 'Hydroxide';
    if (an.esO) return cat.cl === 'nm' ? 'Nonmetal oxide' : 'Oxide';
    if (an.esH) return 'Metal hydride';
    if (an.cl === 'oxo') return an.j ? 'Acid salt' : 'Oxysalt';
    if (an.hs) return 'Acid salt';
    return cat.cl === 'nm' ? 'Binary nonmetal compound' : 'Binary salt';
  }
  function crea(cat, an) {
    if (cat.f === "Ca" && an.f === "C") return;
    const g = mcd(cat.v, an.w), n = an.w / g, m = cat.v / g;
    const fc = n > 1 ? (cat.poli ? `(${cat.f})${n}` : `${cat.f}${n}`) : cat.f, fa = m > 1 ? (an.poli ? `(${an.f})${m}` : `${an.f}${m}`) : an.f;
    const formula = fc + fa, { L, alias } = nombres(cat, n, an, m);
    const lineas = fusiona(L);
    compuestos.push({ formula, tipo: tipoDe(cat, an), cat, an, n, m, g, lineas, alias, comun: !!(cat.comun && an.comun) });
  }
  function fusiona(L) {
    const out = [];
    for (const l of L) {
      const e = out.find((o) => o.nombre === l.nombre);
      if (e) { e.et += ' · ' + l.et; e.regla = e.regla + ' ' + (l.regla || ''); } else out.push({ ...l });
    }
    return out;
  }
  const metalesComb = (cat) => !cat.soloOxido;
  for (const c of cationes) crea(c, AN_O);
  for (const [sim, , vO, , , , comun] of NOMETALES) {
    const multi = unicos(sim).length > 1, nombre = NOMETALES.find((x) => x[0] === sim)[1];
    for (const v of vO) crea({ cl: 'nm', f: sim, nombre, v, multi, comun: !!comun }, AN_O);
  }
  function unicos(sim) { const f = NOMETALES.find((x) => x[0] === sim); return [...new Set([...f[2], ...f[3], ...f[4], ...f[5]])]; }
  for (const c of cationes) if (c.peroxido) crea(c, AN_O2);
  crea(CAT_H, AN_O2);
  for (const c of cationes) if (metalesComb(c)) crea(c, AN_OH);
  crea(CAT_NH4, AN_OH);
  for (const c of cationes) if (metalesComb(c)) crea(c, AN_H);
  for (const an of aniones) if ((an.cl === 'mono' && an.hidracido) || (an.cl === 'oxo' && an.j === 0)) crea(CAT_H, an);
  for (const c of cationes) {
    if (!metalesComb(c)) continue;
    for (const an of aniones) if ((an.cl === 'mono' && !an.esO && !an.esH && !an.esOH) || an.cl === 'oxo') crea(c, an);
  }
  for (const an of aniones) if ((an.cl === 'mono' && (an.hidracido || an.hs)) || an.cl === 'oxo') crea(CAT_NH4, an);
  for (const [sim, nombre, , vF, vR, vS, comun] of NOMETALES) {
    const multi = unicos(sim).length > 1, cat = (v) => ({ cl: 'nm', f: sim, nombre, v, multi, comun: !!comun });
    for (const [x, vs] of [['F', vF], ['Cl', vR], ['Br', vR], ['I', vR], ['S', vS]]) {
      const an = aniones.find((a) => a.cl === 'mono' && a.f === x);
      for (const v of vs) crea(cat(v), an);
    }
  }
  for (const [formula, tipo, lin, comun] of ESPECIALES) {
    compuestos.push({ formula, tipo, esp: true, lineas: lin.map(([et, nombre]) => ({ et, nombre })), alias: [], comun: !!comun });
  }
  for (const [formula, al] of ALIAS_EXTRA) { const c = compuestos.find((x) => x.formula === formula); if (c) c.alias.push(...al); }
  for (const c of compuestos) { c.html = fh(c.formula); c.texto = ft(c.formula); c.cuenta = leeFormula(c.formula); c.clave = claveCuenta(c.cuenta); }

  let porFormula = null, porNombre = null;
  function indice() {
    if (porFormula) return;
    porFormula = new Map(); porNombre = new Map();
    for (const c of compuestos) {
      if (!porFormula.has(c.clave)) porFormula.set(c.clave, []);
      porFormula.get(c.clave).push(c);
      for (const l of c.lineas) for (const nom of [l.nombre, ...(l.otros || [])]) añade(nom, c, l.et);
      for (const nom of c.alias) añade(nom, c, 'Systematic');
    }
  }
  function añade(nombre, c, et) { const k = norm(nombre); if (!porNombre.has(k) || (c.esp && !porNombre.get(k).c.esp && c.formula === "CaC2")) porNombre.set(k, { c, et, nombre }); }
  const todos = () => compuestos;

    const anionTxt = (an) => (an.cl === 'oxo' ? `${an.trad} ion ${ionH(an.f, -an.w)}` : an.cl === 'per' ? `peroxide ion ${ionH('O2', -2)}` : `${an.base} ion ${ionH(an.f, -an.w)}`);
  function tipoTxt(c) {
    const { cat, an } = c;
    switch (c.tipo) {
      case 'Oxide': return `It combines oxygen with a metal (${cat.f}): it is an <b>oxide</b>. Oxygen acts with −2 (oxide ion ${ionH('O', -2)}).`;
      case 'Nonmetal oxide': return `It combines oxygen with a nonmetal (${cat.f}): it is a <b>nonmetal oxide</b>. The less electronegative one is written first and oxygen acts with −2.`;
      case 'Peroxide': return `It contains the ${ionH('O2', -2)} group (two oxygens bonded, each with −1): it is a <b>peroxide</b>.`;
      case 'Metal hydride': return `It combines hydrogen with a metal (${cat.f}): it is a <b>hydride</b>. Here hydrogen acts with −1 (hydride ion ${ionH('H', -1)}).`;
      case 'Hydroxide': return `It contains the ${ionH('OH', -1)} group attached to ${cat.cl === 'am' ? 'the ammonium ion' : 'a metal (' + cat.f + ')'}: it is a <b>hydroxide</b>.`;
      case 'Hydracid': return `Hydrogen with a halogen or with S, Se, Te: it is named with the ending -ide (in aqueous solution it is a <b>hydracid</b>). Hydrogen acts with +1.`;
      case 'Oxoacid': return `It starts with hydrogen and has an oxygen-containing group (${fh(an.f)}, the ${an.trad}): it is an <b>oxoacid</b>. Hydrogen acts with +1.`;
      case 'Binary salt': return `It combines ${cat.cl === 'am' ? 'an ammonium ion' : 'a metal (' + cat.f + ')'} with a nonmetal without oxygen (${an.f}): it is a <b>binary salt</b> and the nonmetal takes the ending -ide.`;
      case 'Binary nonmetal compound': return `It combines two nonmetals (${cat.f} and ${an.f}); the less electronegative one goes first and the other ends in -ide.`;
      case 'Oxysalt': return `${cat.cl === 'am' ? 'An ammonium ion' : 'A metal (' + cat.f + ')'} attached to an oxygen-containing group (${fh(an.f)}, the ${an.trad}): it is an <b>oxysalt</b>, the salt of an oxoacid.`;
      case 'Acid salt': return `${cat.cl === 'am' ? 'An ammonium ion' : 'A metal (' + cat.f + ')'} attached to an anion that keeps ${an.j || 1} hydrogen${(an.j || 1) > 1 ? 's' : ''} of the acid (${fh(an.f)}): it is an <b>acid salt</b> and the name starts with “hydrogen”.`;
      default: return '';
    }
  }
  function oxTxt(c) {
    const { cat, an, n, m } = c, tot = m * an.w;
    const el = cat.cl === 'h' ? 'hydrogen' : cat.nombre;
    const sumas = `${n > 1 ? n : ''}x ${m > 1 || an.w > 1 ? '+ ' + (m > 1 ? m + '·' : '') + '(−' + an.w + ')' : '+ (−1)'}`;
    const quien = anionTxt(an);
    return `The anion is the ${quien}, with charge ${an.w}−${m > 1 ? `; there are ${m}, ${tot}− in total` : ''}. For the compound to be neutral, ${n > 1 ? `the ${n} atoms of ${el}` : `the ${el}`} must contribute +${tot}: $${sumas} = 0 ⇒ x = +${cat.v}$. ${cat.cl === 'h' ? '' : cat.multi ? `${cat.nombre} can act with several oxidation states; here it acts with +${cat.v}.` : `${cat.nombre} only acts with +${cat.v}.`}`;
  }
  function pasosFN(c) {
    if (c.esp) {
      return [{ t: 'Recognize the compound', html: `${c.html} is ${c.tipo === 'Agua' ? '<b>water</b>' : c.tipo === 'Hidruro no metálico' ? 'a <b>nonmetal hydride</b>: for the hydrides of groups 13–15 the common names and the IUPAC ones are mostly used' : `a compound of type <b>${c.tipo.toLowerCase()}</b> that has its own name and does not follow the general rules`}. It is written $${c.formula.replace(/\d+/g, (d) => '_{' + d + '}')}$ and the names in the list are the commonly used ones.` },
        { t: 'Names', html: c.lineas.map((l) => `${l.et}: <b>${l.nombre}</b>`).join('<br>') }];
    }
    const p = [{ t: 'Recognize the type of compound', html: tipoTxt(c) }, { t: 'Calculate the oxidation state', html: oxTxt(c) }];
    for (const l of c.lineas) p.push({ t: `${l.et.toLowerCase().replace(/ · /g, ', ')} nomenclature`, html: `${l.regla} → <b>${l.nombre}</b>${l.otros ? ` (also “${l.otros.join('”, “')}”)` : ''}${l.nota ? ` <small>(${l.nota})</small>` : ''}` });
    return p;
  }
  function pasosNF(c, usada) {
    if (c.esp) return [{ t: 'Recognize the name', html: `“${usada.nombre}” is a name ${c.tipo === 'Agua' ? 'of water' : `of a compound of type ${c.tipo.toLowerCase()}`}: its formula is $${c.formula.replace(/\d+/g, (d) => '_{' + d + '}')}$.` }, { t: 'Write the formula', html: `Its formula is <b>${c.html}</b>.` }];
    const { cat, an, n, m, g } = c, sist = usada.et.includes('Systematic');
    const p = [];
    p.push({ t: 'Interpret the name', html: `“${usada.nombre}” is in ${usada.et.toLowerCase().replace(/ · /g, ', ')} nomenclature. ${tipoTxt(c)}` });
    p.push({ t: 'Write down the charges', html: `${cat.cl === 'nm' ? 'The' : 'The'} ${cat.nombre} acts with +${cat.v}${cat.multi && !sist ? ` (the Roman numeral ${ROM[cat.v]} or the ending ${cat.trad ? '“' + cat.trad + '”' : ''} indicates it)` : ''}: ${ionH(cat.f, cat.v)}. The ${anionTxt(an)} has charge ${an.w}−.` });
    if (sist) p.push({ t: 'Read the prefixes', html: `In systematic nomenclature the prefixes give the subscripts directly: ${n} ${n > 1 ? 'atoms' : 'atom'} of ${cat.nombre} and ${m} ${an.cl === 'oxo' || an.poli ? (m > 1 ? 'groups' : 'group') : (m > 1 ? 'atoms' : 'atom')} of ${an.cl === 'oxo' ? an.trad : an.f}.` });
    else p.push({ t: 'Criss-cross the charges', html: `The charge of the cation (${cat.v}) goes to the anion as a subscript and that of the anion (${an.w}) goes to the cation: ${fh(cat.f)}<sub>${an.w}</sub> ${fh(an.f)}<sub>${cat.v}</sub>${g > 1 ? `. Since ${an.w} and ${cat.v} can be divided by ${g}, it is simplified and the subscripts become ${n} and ${m}` : ''}${n === 1 && m === 1 ? '. The subscript 1 is not written' : ''}.` });
    p.push({ t: 'Write and check the formula', html: `First the cation${cat.cl === 'nm' ? ' (the less electronegative one)' : ''} and then the anion${an.poli && m > 1 ? '; the ' + fh(an.f) + ' group repeats and goes in parentheses' : ''}: <b>${c.html}</b>. Check: $${n}·(+${cat.v}) + ${m}·(−${an.w}) = 0$.` });
    return p;
  }

  function sugerenciasNombre(k) {
    if (k.length < 3) return [];
    const r = new Map();
    for (const [clave, e] of porNombre) if (clave.startsWith(k) && r.size < 6) r.set(e.nombre, e);
    if (r.size < 3) for (const [clave, e] of porNombre) if (clave.includes(k) && r.size < 6) r.set(e.nombre, e);
    return [...r.keys()];
  }
  function errorConSug(msg, sug) { const e = new Error(msg); e.sugerencias = sug || []; return e; }
  const CompL = typeof Complejos !== 'undefined' ? Complejos : require('./complejos.js');
  const HIDRATO = 'hydrate', pfh = (p) => (IDI === 'de' ? p.replace(/^./, (c) => c.toUpperCase()) : p);
  const PREFH = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
  function hidrato(base, n, usadaBase) {
    const r = base, pf = pfh(PREFH[n] || `${n}-`), c0 = r.c;
    const lineas = r.lineas.filter((l) => l.et !== 'Common name').map((l) => ({ ...l, nombre: IDI === 'de' ? `${l.nombre}-${pf}${HIDRATO}` : `${l.nombre} ${pf}${HIDRATO}`, regla: `${l.regla || ''} The water of crystallization is added with the prefix ${pf}- and the word “hydrate”.` }));
    const formula = `${c0.formula}·${n === 1 ? '' : n}H2O`, html = `${c0.html}·${n === 1 ? '' : n}H<sub>2</sub>O`;
    const c = { ...c0, formula, html, texto: ft(c0.formula) + `·${n === 1 ? '' : n}H₂O`, tipo: 'Hydrate', lineas, alias: [], esp: true, hidrato: n };
    const pasos = [...r.pasos, { t: 'Water of crystallization', html: `The formula ends in <b>·${n === 1 ? '' : n}H<sub>2</sub>O</b>: for each unit of ${c0.html} there ${n > 1 ? 'are' : 'is'} ${n} molecule${n > 1 ? 's' : ''} of water in the crystal. The compound is named and ends with <b>${pf}${HIDRATO}</b>.` }];
    return { modo: r.modo, c, formula, html, tipo: 'Hydrate', lineas, alt: [], pasos, usada: usadaBase || null };
  }
  function resolver(sc) {
    indice();
    { const t0 = String(sc?.texto ?? '').trim();
      if (sc && sc.modo !== 'n2f' && /\[/.test(t0)) { let x = null, e1 = null; try { x = CompL.leer(t0); } catch (e) { e1 = e; } if (!x) { try { return resolver({ ...sc, texto: t0.replace(/\[/g, '(').replace(/\]/g, ')') }); } catch (e2) { throw e1; } } return { modo: 'f2n', c: { formula: x.formula, html: x.html, texto: x.formula, tipo: x.tipo, lineas: x.nombres, alias: [], esp: true, complejo: x }, formula: x.formula, html: x.html, tipo: x.tipo, lineas: x.nombres, alt: [], pasos: x.pasos, usada: null }; }
      const mh = /^(.*?)\s*[·.*•]\s*(\d*)\s*H2O\s*$/i.exec(t0.replace(/[₀-₉]/g, (d) => SUBS.indexOf(d)));
      if (sc && sc.modo !== 'n2f' && mh && mh[1]) return hidrato(resolver({ modo: 'f2n', texto: mh[1] }), +mh[2] || 1);
      const mn = new RegExp('^(.*?)[\\s-]+(' + PREFH.slice(1).join('|') + ')' + HIDRATO + '\\s*$', 'i').exec(t0);
      if (sc && sc.modo === 'n2f' && mn) { const n = PREFH.indexOf(mn[2].toLowerCase()); const b = resolver({ modo: 'n2f', texto: mn[1] }); return hidrato({ ...b, modo: 'n2f' }, n, b.usada); } }
    const modo = sc && sc.modo === 'n2f' ? 'n2f' : 'f2n', texto = String(sc?.texto ?? '').trim();
    const romanos = (t) => t.replace(/\(\s*\+?([1-7])\s*\+?\s*\)/g, (_, d) => `(${ROM[d]})`);
    if (!texto) throw new Error(modo === 'f2n' ? 'Type a formula, for example Fe2O3, H2SO4 or Ca(OH)2.' : 'Type a name, for example “iron(III) oxide” or “sulfuric acid”.');
    if (modo === 'f2n') {
      const cuenta = leeFormula(texto), cs = porFormula.get(claveCuenta(cuenta));
      if (!cs) {
        const els = Object.keys(cuenta), sug = compuestos.filter((c) => els.every((e) => e in c.cuenta) && Object.keys(c.cuenta).length === els.length).slice(0, 6).map((c) => ft(c.formula));
        throw errorConSug(`I don't recognize “${texto}” among the compounds the tool can name (oxides, peroxides, hydrides, hydroxides, acids, salts and binary compounds). Check the subscripts and charges: the sum must be zero.`, sug);
      }
      const c = cs[0];
      return { modo, c, formula: c.formula, html: c.html, tipo: c.tipo, lineas: c.lineas, alt: cs.slice(1), pasos: pasosFN(c), usada: null };
    }
    const k = norm(romanos(texto)), e = porNombre.get(k);
    if (!e) { let f = null; try { f = CompL.porNombre(k); } catch (err) { f = null; } if (f) return { ...resolver({ modo: 'f2n', texto: f }), modo, usada: { et: 'Textbooks', nombre: texto } }; }
    if (!e) throw errorConSug(`I don't recognize the name “${texto}”. Check the spelling, the prefixes and the Roman numeral in parentheses; for example “iron(III) oxide”, “diiron trioxide” or “nitric acid”.`, sugerenciasNombre(k));
    const c = e.c;
    return { modo, c, formula: c.formula, html: c.html, tipo: c.tipo, lineas: c.lineas, alt: [], pasos: pasosNF(c, e), usada: e };
  }

  function aceptadas(c, modo) {
    if (modo === 'n2f') return [...new Set([c.formula, c.texto])];
    const base = [...c.lineas.flatMap((l) => [l.nombre, ...(l.otros || [])]), ...c.alias];
    const todas = new Set();
    for (const b of base) { todas.add(b); todas.add(sa(b)); todas.add(b.replace(/\(([IVX]+)\)/g, ' $1')); todas.add(sa(b).replace(/\(([IVX]+)\)/g, ' $1')); }
    return [...todas];
  }
  const nombreEnunciado = (c, i) => { const l = c.lineas.filter((x) => x.et !== 'Common name'); return l[i % l.length].nombre; };

  const ejemplos = [];
  const ej = (grupo, modo, texto, nombre) => ejemplos.push({ clave: `${modo}-${norm(texto)}`, grupo, nombre: nombre || (modo === 'f2n' ? `${ft(texto)}` : texto), sc: { modo, texto } });
  for (const [g, fs] of [['From formula to name · Oxides and hydrides', ['Fe2O3', 'CO2', 'Na2O', 'H2O2', 'CaH2', 'NH3']], ['From formula to name · Hydroxides and acids', ['Ca(OH)2', 'Fe(OH)3', 'HCl', 'H2S', 'H2SO4', 'HNO3', 'H3PO4', 'HClO4']], ['From formula to name · Salts', ['NaCl', 'FeCl3', 'Cu2S', 'PCl5', 'CaCO3', 'Al2(SO4)3', 'KMnO4', 'NaClO', 'NaHCO3', 'Ca(H2PO4)2', '(NH4)2SO4']]]) for (const f of fs) ej(g, 'f2n', f);
  for (const [g, ns] of [['From name to formula', ['iron(III) oxide', 'diiron trioxide', 'carbon dioxide', 'aluminium hydroxide', 'sulfuric acid', 'hydrochloric acid', 'calcium dichloride', 'aluminium sulfate', 'calcium carbonate', 'silver nitrate', 'sodium hydrogencarbonate', 'copper(II) tetraoxosulfate(VI)', 'hydrogen sulfide', 'perchloric acid']]]) for (const t of ns) ej(g, 'n2f', t);

  for (const [g, m, ts] of [['Complexes and hydrates · from formula to name', 'f2n', ['[Cu(NH3)4]SO4', 'K3[Fe(CN)6]', 'Na[Al(OH)4]', 'CuSO4·5H2O', 'O3']], ['Complexes and hydrates · from name to formula', 'n2f', ['potassium hexacyanoferrate(III)', 'calcium sulfate dihydrate', 'thiosulfuric acid']]]) for (const t of ts) ej(g, m, t);
  return { resolver, ejemplos, todos, aceptadas, nombreEnunciado, leeFormula, norm, ft, fh, ionH, porFormula: () => { indice(); return porFormula; }, porNombre: () => { indice(); return porNombre; } };
})();

