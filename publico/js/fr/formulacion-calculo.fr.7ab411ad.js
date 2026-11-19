const Formulacion = (() => {
  const SUBS = '₀₁₂₃₄₅₆₇₈₉', ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const PREF = ['', 'mono', 'di', 'tri', 'tétra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'déca'];
  const PREFG = ['', '', 'bis', 'tris', 'tétrakis', 'pentakis', 'hexakis', 'heptakis'];
  const SIMBOLOS = new Set('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' '));
  const IDI = 'fr';
  const ajusta = (t) => {
    if (!t || !t.replace) return t;
    if (IDI === 'fr') return t.replace(/(^|[\s(])de (?=[aeiouyhéèêAEIOUYH])/g, '$1d’');
    if (IDI === 'de') return t.toLowerCase().replace(/^./, (c) => c.toUpperCase()).replace(/\(([ivx]+)\)/g, (m, r) => '(' + r.toUpperCase() + ')').replace(/ säure/g, ' Säure');
    return t;
  };
  const ordTrad = (a, m) => (IDI === 'en' ? `${m} ${a}` : `${a} ${m}`);
  const MONOXIDO = ['monooxyde', 'monoxyde']; // «monoóxido» se escribe «monóxido»
  const mcd = (a, b) => (b ? mcd(b, a % b) : a);
  const sa = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const norm = (s) => sa(String(s).toLowerCase()).replace(/[^a-z0-9]/g, '');
  const fh = (f) => String(f).replace(/\d+/g, '<sub>$&</sub>'); // fórmula en HTML
  const ft = (f) => String(f).replace(/\d/g, (d) => SUBS[d]); // fórmula en texto con subíndices
  const pre = (n, mono = false) => (n === 1 && !mono ? '' : PREF[n]);
  const ionH = (f, z) => `${fh(f)}<sup>${Math.abs(z) > 1 ? Math.abs(z) : ''}${z > 0 ? '+' : '−'}</sup>`;

  const METALES = [
    ['Li', 'lithium', [1], [], {}, 1], ['Na', 'sodium', [1], [], {}, 1], ['K', 'potassium', [1], [], {}, 1], ['Rb', 'rubidium', [1]], ['Cs', 'césium', [1]], ['Ag', 'argent', [1], [], {}, 1],
    ['Be', 'béryllium', [2]], ['Mg', 'magnésium', [2], [], {}, 1], ['Ca', 'calcium', [2], [], {}, 1], ['Sr', 'strontium', [2]], ['Ba', 'baryum', [2], [], {}, 1],
    ['Zn', 'zinc', [2], [], {}, 1], ['Cd', 'cadmium', [2]], ['Al', 'aluminium', [3], [], {}, 1],
    ['Cu', 'cuivre', [1, 2], [], { 1: 'cuivreux', 2: 'cuivrique' }, 1], ['Hg', 'mercure', [1, 2], [], { 1: 'mercureux', 2: 'mercurique' }, 1],
    ['Au', 'or', [1, 3], [], { 1: 'aureux', 3: 'aurique' }, 1], ['Fe', 'fer', [2, 3], [], { 2: 'ferreux', 3: 'ferrique' }, 1],
    ['Co', 'cobalt', [2, 3], [], { 2: 'cobalteux', 3: 'cobaltique' }, 1], ['Ni', 'nickel', [2, 3], [], { 2: 'nickeleux', 3: 'nickélique' }, 1],
    ['Sn', 'étain', [2, 4], [], { 2: 'stanneux', 4: 'stannique' }, 1], ['Pb', 'plomb', [2, 4], [], { 2: 'plombeux', 4: 'plombique' }, 1],
    ['Pt', 'platine', [2, 4], [], { 2: 'platineux', 4: 'platinique' }],
    ['Cr', 'chrome', [2, 3], [6], { 2: 'chromeux', 3: 'chromique' }, 1], ['Mn', 'manganèse', [2, 3], [4, 7], { 2: 'manganeux', 3: 'manganique' }, 1],
    ['Ti', 'titane', [3, 4]], ['Bi', 'bismuth', [3]],
  ];
  const PEROXIDOS = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Zn', 'Cd', 'Cu', 'Ag'];
  const NOMETALES = [
    ['N', 'azote', [1, 2, 3, 4, 5], [3], [3], [], 1], ['P', 'phosphore', [3, 5], [3, 5], [3, 5], [3, 5], 1], ['As', 'arsenic', [3, 5], [3, 5], [3, 5], [3, 5]], ['Sb', 'antimoine', [3, 5], [3, 5], [3, 5], [3, 5]],
    ['C', 'carbone', [2, 4], [4], [4], [4], 1], ['Si', 'silicium', [4], [4], [4], [4], 1], ['B', 'bore', [3], [3], [3], [3], 1],
    ['S', 'soufre', [4, 6], [4, 6], [2], [], 1], ['Se', 'sélénium', [4, 6], [4, 6], [4], []], ['Te', 'tellure', [4, 6], [4, 6], [4], []],
    ['Cl', 'chlore', [1, 3, 5, 7], [1, 3, 5], [], [], 1], ['Br', 'brome', [1, 3, 5, 7], [1, 3, 5], [], []], ['I', 'iode', [1, 3, 5, 7], [1, 3, 5, 7], [], []],
  ];
  const MONO = [
    ['F', 'fluorure', 1, 'fluorhydrique', 1], ['Cl', 'chlorure', 1, 'chlorhydrique', 1], ['Br', 'bromure', 1, 'bromhydrique', 1], ['I', 'iodure', 1, 'iodhydrique', 1],
    ['S', 'sulfure', 2, 'sulfhydrique', 1], ['Se', 'séléniure', 2, 'sélénhydrique'], ['Te', 'tellurure', 2, 'tellurhydrique'],
    ['N', 'nitrure', 3], ['P', 'phosphure', 3], ['As', 'arséniure', 3], ['C', 'carbure', 4], ['Si', 'siliciure', 4], ['B', 'borure', 3],
  ];
  const OXO = [
    ['Cl', 1, 1, 1, 1, 'hypochloreux', 'hypochlorite', 1], ['Cl', 3, 2, 1, 1, 'chloreux', 'chlorite', 1], ['Cl', 5, 3, 1, 1, 'chlorique', 'chlorate', 1], ['Cl', 7, 4, 1, 1, 'perchlorique', 'perchlorate', 1],
    ['Br', 1, 1, 1, 1, 'hypobromeux', 'hypobromite'], ['Br', 3, 2, 1, 1, 'bromeux', 'bromite'], ['Br', 5, 3, 1, 1, 'bromique', 'bromate'], ['Br', 7, 4, 1, 1, 'perbromique', 'perbromate'],
    ['I', 1, 1, 1, 1, 'hypoiodeux', 'hypoiodite'], ['I', 3, 2, 1, 1, 'iodeux', 'iodite'], ['I', 5, 3, 1, 1, 'iodique', 'iodate'], ['I', 7, 4, 1, 1, 'periodique', 'periodate'],
    ['S', 4, 3, 2, 1, 'sulfureux', 'sulfite', 1], ['S', 6, 4, 2, 1, 'sulfurique', 'sulfate', 1],
    ['Se', 4, 3, 2, 1, 'sélénieux', 'sélénite'], ['Se', 6, 4, 2, 1, 'sélénique', 'sélénate'], ['Te', 4, 3, 2, 1, 'tellureux', 'tellurite'], ['Te', 6, 4, 2, 1, 'tellurique', 'tellurate'],
    ['N', 3, 2, 1, 1, 'nitreux', 'nitrite', 1], ['N', 5, 3, 1, 1, 'nitrique', 'nitrate', 1],
    ['P', 3, 3, 3, 1, 'phosphoreux', 'phosphite'], ['P', 5, 4, 3, 1, 'phosphorique', 'phosphate', 1],
    ['As', 3, 3, 3, 1, 'arsénieux', 'arsénite'], ['As', 5, 4, 3, 1, 'arsén' + 'ique', 'arséniate'],
    ['C', 4, 3, 2, 1, 'carbonique', 'carbonate', 1], ['Si', 4, 3, 2, 1, 'silicique', 'silicate'], ['B', 3, 3, 3, 1, 'borique', 'borate'],
    ['Cr', 6, 4, 2, 1, 'chromique', 'chromate', 1], ['Cr', 6, 7, 2, 2, 'dichromique', 'dichromate', 1],
    ['Mn', 7, 4, 1, 1, 'permanganique', 'permanganate', 1],
    ['P', 5, 7, 4, 2, 'diphosphorique', 'diphosphate'], ['S', 6, 7, 2, 2, 'disulfurique', 'disulfate'],
    ['Si', 4, 4, 4, 1, 'orthosilicique', 'orthosilicate'], ['B', 3, 2, 1, 1, 'métaborique', 'métaborate'],
  ];
  const ALIAS_EXTRA = [['H2SiO3', ['acide métasilicique']], ['Na2SiO3', ['métasilicate de sodium']], ['H3BO3', ['acide orthoborique']], ['H3PO4', ['acide orthophosphorique']], ['H4P2O7', ['acide pyrophosphorique']], ['H2S2O7', ['acide pyrosulfurique']], ['Na2S2O7', ['pyrosulfate de sodium']], ['Na4P2O7', ['pyrophosphate de sodium']], ['H2O2', ['eau oxygénée']], ['NH3', ['azane']]];
  const ATO = { Cl: 'chlorate', Br: 'bromate', I: 'iodate', S: 'sulfate', Se: 'sélénate', Te: 'tellurate', N: 'nitrate', P: 'phosphate', As: 'arséniate', C: 'carbonate', Si: 'silicate', B: 'borate', Cr: 'chromate', Mn: 'manganate' };
  const ICO = { Cl: 'chlorique', Br: 'bromique', I: 'iodique', S: 'sulfurique', Se: 'sélénique', Te: 'tellurique', N: 'nitrique', P: 'phosphorique', As: 'arsén' + 'ique', C: 'carbonique', Si: 'silicique', B: 'borique', Cr: 'chromique', Mn: 'manganique' };
  const ESPECIALES = [
    ['H2O', 'Eau', [['Systématique', 'oxyde de dihydrogène'], ['Nom courant', 'eau']], 1],
    ['NH3', 'Hydrure non métallique', [['Systématique', 'trihydrure d’azote'], ['IUPAC (hydrures)', 'azane'], ['Nom courant', 'ammoniac']], 1],
    ['PH3', 'Hydrure non métallique', [['Systématique', 'trihydrure de phosphore'], ['IUPAC (hydrures)', 'phosphane'], ['Nom courant', 'phosphine']]],
    ['AsH3', 'Hydrure non métallique', [['Systématique', 'trihydrure d’arsenic'], ['IUPAC (hydrures)', 'arsane'], ['Nom courant', 'arsine']]],
    ['SbH3', 'Hydrure non métallique', [['Systématique', 'trihydrure d’antimoine'], ['IUPAC (hydrures)', 'stibane'], ['Nom courant', 'stibine']]],
    ['CH4', 'Hydrure non métallique', [['Systématique', 'tétrahydrure de carbone'], ['IUPAC (hydrures)', 'méthane']], 1],
    ['SiH4', 'Hydrure non métallique', [['Systématique', 'tétrahydrure de silicium'], ['IUPAC (hydrures)', 'silane']], 1],
    ['BH3', 'Hydrure non métallique', [['Systématique', 'trihydrure de bore'], ['IUPAC (hydrures)', 'borane']]],
    ['H2MnO4', 'Oxoacide', [['Traditionnelle', 'acide manganique'], ['Systématique', 'tétraoxidomanganate de dihydrogène']]], ['K2MnO4', 'Oxysel', [['Traditionnelle', 'manganate de potassium'], ['Systématique', 'tétraoxidomanganate de dipotassium']]], ['Na2MnO4', 'Oxysel', [['Traditionnelle', 'manganate de sodium']]],
    ['HPO3', 'Oxoacide', [['Traditionnelle', 'acide métaphosphorique'], ['Systématique', 'trioxidophosphate d’hydrogène']]],
    ['O3', 'Élément', [['Systématique', 'trioxygène'], ['Nom courant', 'ozone']], 1], ['O2', 'Élément', [['Systématique', 'dioxygène'], ['Nom courant', 'oxygène']], 1], ['H2', 'Élément', [['Systématique', 'dihydrogène'], ['Nom courant', 'hydrogène']], 1],
    ['N2', 'Élément', [['Systématique', 'diazote'], ['Nom courant', 'azote']], 1], ['F2', 'Élément', [['Systématique', 'difluor'], ['Nom courant', 'fluor']]], ['Cl2', 'Élément', [['Systématique', 'dichlore'], ['Nom courant', 'chlore']], 1],
    ['Br2', 'Élément', [['Systématique', 'dibrome'], ['Nom courant', 'brome']]], ['I2', 'Élément', [['Systématique', 'diiode'], ['Nom courant', 'iode']]], ['P4', 'Élément', [['Systématique', 'tétraphosphore'], ['Nom courant', 'phosphore blanc']]], ['S8', 'Élément', [['Systématique', 'octasoufre'], ['Nom courant', 'soufre']]],
    ['H3PO2', 'Oxoacide', [['Traditionnelle', 'acide hypophosphoreux'], ['IUPAC', 'acide phosphinique']]],
    ['H2S2O3', 'Thioacide', [['Traditionnelle', 'acide thiosulfurique'], ['Systématique', 'trioxidosulfidosulfate de dihydrogène']]], ['Na2S2O3', 'Thiosulfate', [['Traditionnelle', 'thiosulfate de sodium'], ['Systématique', 'trioxidosulfidosulfate de disodium']]], ['K2S2O3', 'Thiosulfate', [['Traditionnelle', 'thiosulfate de potassium']]],
    ['HSCN', 'Thioacide', [['Traditionnelle', 'acide thiocyanique'], ['IUPAC', 'thiocyanate d’hydrogène']]], ['KSCN', 'Thiocyanate', [['Traditionnelle', 'thiocyanate de potassium']]], ['NaSCN', 'Thiocyanate', [['Traditionnelle', 'thiocyanate de sodium']]], ['NH4SCN', 'Thiocyanate', [['Traditionnelle', 'thiocyanate d’ammonium']]],
    ['H2SO5', 'Peroxoacide', [['Traditionnelle', 'acide peroxosulfurique'], ['Systématique', 'peroxidotrioxidosulfate de dihydrogène']]], ['H2S2O8', 'Peroxoacide', [['Traditionnelle', 'acide peroxodisulfurique']]], ['HNO4', 'Peroxoacide', [['Traditionnelle', 'acide peroxonitrique']]],
    ['K2S2O8', 'Peroxosel', [['Traditionnelle', 'peroxodisulfate de potassium']]], ['Na2S2O8', 'Peroxosel', [['Traditionnelle', 'peroxodisulfate de sodium']]], ['(NH4)2S2O8', 'Peroxosel', [['Traditionnelle', 'peroxodisulfate d’ammonium']]],
    ['CaC2', 'Carbure', [['Traditionnelle', 'carbure de calcium'], ['Systématique', 'dicarbure de calcium'], ['IUPAC', 'acétylure de calcium']]],
    ['KAl(SO4)2', 'Sel double', [['Traditionnelle', 'sulfate d’aluminium et de potassium'], ['Systématique', 'bis(tétraoxidosulfate) d’aluminium et de potassium']]], ['NaKCO3', 'Sel double', [['Traditionnelle', 'carbonate de potassium et de sodium']]],
    ['CaMg(CO3)2', 'Sel double', [['Traditionnelle', 'carbonate de calcium et de magnésium']]], ['MgNH4PO4', 'Sel double', [['Traditionnelle', 'phosphate d’ammonium et de magnésium']]], ['KNaSO4', 'Sel double', [['Traditionnelle', 'sulfate de potassium et de sodium']]],
  ];

  function leeFormula(texto) {
    const s = String(texto ?? '').replace(/\s+/g, '').replace(/[₀-₉]/g, (c) => SUBS.indexOf(c)).replace(/[[{]/g, '(').replace(/[\]}]/g, ')');
    if (!s) throw new Error('Écrivez une formule, par exemple Fe2O3 ou H2SO4.');
    let i = 0;
    const numero = () => { let t = ''; while (/\d/.test(s[i] || '')) t += s[i++]; return t ? +t : 1; };
    function grupo(dentro) {
      const c = {};
      const suma = (g, k) => { for (const e in g) c[e] = (c[e] || 0) + g[e] * k; };
      while (i < s.length) {
        const ch = s[i];
        if (ch === '(') { i++; const g = grupo(true); suma(g, numero()); }
        else if (ch === ')') { if (!dentro) throw new Error('Il y a une parenthèse fermante sans ouverture.'); i++; return c; }
        else if (/[A-Z]/.test(ch)) {
          let sim = ch; i++;
          if (/[a-z]/.test(s[i] || '')) sim += s[i++];
          if (!SIMBOLOS.has(sim)) throw new Error(`« ${sim} » n’est le symbole d’aucun élément. Les symboles ont la première lettre en majuscule et la seconde en minuscule (Co est le cobalt, CO est le monoxyde de carbone).`);
          suma({ [sim]: 1 }, numero());
        } else throw new Error(`Le caractère « ${ch} » de la formule n’est pas compris. Utilisez des symboles d’éléments, des nombres et des parenthèses.`);
      }
      if (dentro) throw new Error('Il manque une parenthèse fermante.');
      return c;
    }
    const r = grupo(false);
    if (!Object.keys(r).length) throw new Error('Écrivez une formule, par exemple Fe2O3 ou H2SO4.');
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
  const CAT_H = { cl: 'h', f: 'H', nombre: 'hydrogène', v: 1, multi: false, trad: null, comun: true };

  for (const [sim, base, w, hidra, comun] of MONO) aniones.push({ cl: 'mono', f: sim, w, base, hidra, comun: !!comun, hidracido: !!hidra });
  const AN_O = { cl: 'mono', f: 'O', w: 2, base: 'oxyde', comun: true, esO: true }, AN_H = { cl: 'mono', f: 'H', w: 1, base: 'hydrure', comun: true, esH: true };
  const AN_OH = { cl: 'mono', f: 'OH', w: 1, base: 'hydroxyde', poli: true, comun: true, esOH: true }, AN_O2 = { cl: 'per', f: 'O2', w: 2, poli: true, comun: true };
  aniones.push(AN_O, AN_H, AN_OH, AN_O2);
  for (const sim of ['S', 'Se', 'Te']) aniones.push({ cl: 'mono', f: 'H' + sim, w: 1, base: 'hydrogéno' + MONO.find((m) => m[0] === sim)[1], poli: true, grupo: true, comun: false, hs: true });
  const pOxido = (k) => (k === 1 ? '' : PREF[k]) + 'oxido', pOxo = (k) => (k === 1 ? '' : PREF[k]) + 'oxo';
  for (const [centro, v, nO, h, k, tAc, tAn, comun] of OXO) {
    const ato = (k === 2 ? 'di' : '') + ATO[centro], ico = (k === 2 ? 'di' : '') + ICO[centro];
    const baseF = `${centro}${k > 1 ? k : ''}O${nO > 1 ? nO : ''}`;
    for (let j = 0; j < h; j++) {
      const ph = j ? (j > 1 ? PREF[j] : '') + 'hydrogéno' : '';
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
    const RS = 'Les préfixes multiplicatifs (mono-, di-, tri-, tétra-, penta-, hexa-, hepta-…) indiquent combien d’atomes ou de groupes il y a de chacun.';
    if (cat.cl === 'h' && an.cl === 'oxo') {
      uno('Systématique', `${an.sist} de ${ca(n)}`, `${RS} Les oxygènes se nomment « ${pOxido(an.nO)} », l’élément central se termine en -ate et, comme c’est un acide, le cation est l’hydrogène${n > 1 ? ' (' + PREF[n] + 'hydrogène pour les ' + n + ' atomes)' : ''}.`);
      uno('Stock', `acide ${an.acidoStock}`, `On écrit « acide », les préfixes d’oxygènes avec « oxo », la racine de l’élément central en -ique et son nombre d’oxydation en chiffres romains : ${ROM[an.v]}.`);
      uno('Traditionnelle', `acide ${an.acidoTrad}`, tradOxoRegla(an));
      alias.push(`${an.stockSal} d’hydrogène`);
    } else if (cat.cl === 'h' && an.cl === 'mono') {
      uno('Systématique', `${pre(m)}${an.base} de ${ca(n)}`, `On nomme l’anion en -ure puis « d’hydrogène »${n > 1 ? ', avec le préfixe ' + PREF[n] + '- pour les ' + n + ' hydrogènes' : ''}.`);
      uno('Stock', `${an.base} d’hydrogène`, 'L’hydrogène agit toujours avec +1 : il n’est pas nécessaire d’indiquer son nombre d’oxydation.');
      uno('Traditionnelle', `acide ${an.hidra}`, 'En solution aqueuse, on l’appelle « acide » + racine de l’élément + « -hydrique ».', 'en solution aqueuse');
    } else if (cat.cl === 'h' && an.cl === 'per') {
      uno('Systématique', `${PREF[2 * m]}oxyde de ${ca(n)}`, `${RS} Il y a ${2 * m} oxygènes et ${n} hydrogènes.`);
      uno('Stock', 'peroxyde d’hydrogène', 'Le groupe O₂²⁻ s’appelle peroxyde.');
      uno('Nom courant', 'eau oxygénée', null, 'en solution');
    } else if (cat.cl === 'nm') {
      const anh = an.esO ? OXO.find((o) => o[0] === cat.f && o[1] === cat.v && o[4] === 1) : null;
      uno('Systématique', `${PREF[m]}${an.base} de ${ca(n)}`, `${RS} Ici ${PREF[m]}- pour le ${an.base.replace('uro', 'uro')} (${m} atomes)${n > 1 ? ' et ' + PREF[n] + '- pour le ' + cat.nombre + ' (' + n + ' atomes)' : ' et aucun pour le ' + cat.nombre + ' (il n’y en a qu’un)'}.`);
      uno('Stock', `${an.base} de ${stockCat}`, `On met entre parenthèses, en chiffres romains, le nombre d’oxydation de ${cat.nombre} : ${ROM[cat.v]}${cat.multi ? '' : ' (ici il n’en a qu’un et on peut l’omettre)'}.`);
      if (anh) uno('Traditionnelle', `anhydride ${anh[5]}`, `Les oxydes des non-métaux s’appelaient « anhydrides » (de l’acide ${anh[5]}).`);
      alias.push(...L.filter((l) => l.et === 'Systématique').flatMap((l) => (m === 1 && n === 1 ? [l.nombre.replace(new RegExp('^' + PREF[1], 'i'), '')] : [])));
    } else if (an.cl === 'per') {
      uno('Systématique', `${PREF[2 * m]}oxyde de ${ca(n)}`, `${RS} Il y a ${2 * m} atomes d’oxygène (${m} groupe${m > 1 ? 's' : ''} O₂)${n > 1 ? ' et ' + n + ' de ' + cat.nombre : ''}.`);
      uno('Stock', `peroxyde de ${stockCat}`, `Le groupe O₂²⁻ s’appelle peroxyde${cat.multi ? ' ; le nombre d’oxydation de ' + cat.nombre + ' se met en chiffres romains' : ''}.`);
      uno('Traditionnelle', cat.trad ? `peroxyde ${cat.trad}` : cat.multi ? null : `peroxyde de ${cat.nombre}`, cat.trad ? tradMetalRegla(cat) : 'Avec un seul nombre d’oxydation, « peroxyde de … » suffit.');
    } else if (an.cl === 'mono') {
      const monoEn = cat.multi || cat.cl === 'nm';
      const grupo = an.grupo ? (m > 1 ? `${PREFG[m]}(${an.base})` : an.base) : pre(m, monoEn) + an.base;
      uno('Systématique', `${grupo} de ${ca(n)}`, `${RS}${an.grupo ? ' Avec des groupes de plusieurs atomes, on utilise bis-, tris-… et des parenthèses.' : ''} ${prefijosTxt(cat, n, an, m, monoEn)}`);
      uno('Stock', `${an.base} de ${stockCat}`, stockRegla(cat));
      uno('Traditionnelle', cat.trad ? ordTrad(an.base, cat.trad) : cat.multi ? null : `${an.base} de ${cat.nombre}`, cat.trad ? tradMetalRegla(cat) : 'Avec un seul nombre d’oxydation, «' + an.base + ' de … » suffit.');
      if (!an.grupo) alias.push(`${PREF[m]}${an.base} de ${ca(n)}`, `${pre(m)}${an.base} de ${ca(n)}`);
      if (an.esO && m >= 4) alias.push(`${PREF[m].slice(0, -1)}oxyde de ${ca(n)}`);
    } else if (an.cl === 'oxo') {
      const w = m > 1 ? `${PREFG[m]}(${an.sist})` : an.sist;
      uno('Systématique', `${w} de ${ca(n)}`, `${RS} ${m > 1 ? `L’anion se répète ${m} fois et se met entre parenthèses avec ${PREFG[m]}-. ` : ''}Les oxygènes se nomment « ${pOxido(an.nO)} »${an.j ? ' et les hydrogènes de l’anion avec « hydrogéno »' : ''}, et l’élément central se termine en -ate.`);
      uno('Stock', `${an.stock} de ${stockCat}`, `Les oxygènes avec « ${pOxo(an.nO)} », le central en -ate et son nombre d’oxydation entre parenthèses (${ROM[an.v]}) ; de plus celui de ${cat.nombre === 'amonio' ? 'l’ammonium' : 'du métal'}${cat.multi ? ' (' + ROM[cat.v] + ')' : ''}.`);
      uno('Traditionnelle', `${an.trad} de ${stockCat}`, tradOxoRegla(an, true));
      if (cat.trad) L[L.length - 1].otros = [ordTrad(an.trad, cat.trad)];
    }
    const mo = (t) => ajusta(t && t.replace ? t.replace(new RegExp(MONOXIDO[0], 'g'), MONOXIDO[1]) : t);
    for (const l of L) { l.nombre = mo(l.nombre); if (l.otros) l.otros = l.otros.map(mo); }
    return { L, alias: alias.map(mo) };
  }
  const prefijosTxt = (cat, n, an, m, monoEn) => `Ici : ${m === 1 && !monoEn ? 'un seul ' + an.base + ' (mono- est omis)' : PREF[m] + '- pour le ' + an.base}${n > 1 ? ' et ' + PREF[n] + '- pour le ' + cat.nombre : ''}.`;
  const stockRegla = (cat) => (cat.multi ? `${cat.nombre} a plusieurs nombres d’oxydation : on indique entre parenthèses, en chiffres romains, celui qu’il utilise ici (${ROM[cat.v]}).` : `${cat.nombre} n’agit qu’avec +${cat.v} : le chiffre romain n’est pas nécessaire.`);
  const tradMetalRegla = (cat) => `Dans la nomenclature traditionnelle, le métal à deux nombres d’oxydation prend la terminaison -eux (le plus faible) ou -ique (le plus élevé) : avec +${cat.v}, c’est « ${cat.trad} ».`;
  function tradOxoRegla(an, sal) {
    const t = sal ? an.tAn : an.acidoTrad;
    const sufijo = sal ? (an.bajo ? '-ite (nombre d’oxydation le plus faible)' : '-ate (nombre d’oxydation le plus élevé)') : (an.bajo ? '-eux (nombre d’oxydation le plus faible)' : '-ique (nombre d’oxydation le plus élevé)');
    const pf = an.hipo ? ', avec hypo- (l’état le plus bas des quatre)' : an.per ? ', avec per- (l’état le plus haut des quatre)' : '';
    return `L’élément central (${an.centro}) agit avec +${an.v} : ${sal ? 'l’anion' : 'l’acide'} se termine en ${sufijo}${pf}.${sal && an.j ? ' Les hydrogènes qu’il conserve s’indiquent avec « hydrogéno » devant.' : ''}`;
  }

  const compuestos = [];
  function tipoDe(cat, an) {
    if (cat.cl === 'h') return an.cl === 'oxo' ? 'Oxoacide' : an.cl === 'per' ? 'Peroxyde' : 'Hydracide';
    if (an.cl === 'per') return 'Peroxyde';
    if (an.esOH) return 'Hydroxyde';
    if (an.esO) return cat.cl === 'nm' ? 'Oxyde non métallique' : 'Oxyde';
    if (an.esH) return 'Hydrure métallique';
    if (an.cl === 'oxo') return an.j ? 'Sel acide' : 'Oxysel';
    if (an.hs) return 'Sel acide';
    return cat.cl === 'nm' ? 'Composé binaire non métallique' : 'Sel binaire';
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
      for (const nom of c.alias) añade(nom, c, 'Systématique');
    }
  }
  function añade(nombre, c, et) { const k = norm(nombre); if (!porNombre.has(k) || (c.esp && !porNombre.get(k).c.esp && c.formula === "CaC2")) porNombre.set(k, { c, et, nombre }); }
  const todos = () => compuestos;

    const anionTxt = (an) => (an.cl === 'oxo' ? `ion ${an.trad} ${ionH(an.f, -an.w)}` : an.cl === 'per' ? `ion peroxyde ${ionH('O2', -2)}` : `ion ${an.base} ${ionH(an.f, -an.w)}`);
  function tipoTxt(c) {
    const { cat, an } = c;
    switch (c.tipo) {
      case 'Oxyde': return `Il combine l’oxygène avec un métal (${cat.f}) : c’est un <b>oxyde</b>. L’oxygène agit avec −2 (ion oxyde ${ionH('O', -2)}).`;
      case 'Oxyde non métallique': return `Il combine l’oxygène avec un non-métal (${cat.f}) : c’est un <b>oxyde non métallique</b>. On écrit d’abord le moins électronégatif et l’oxygène agit avec −2.`;
      case 'Peroxyde': return `Il contient le groupe ${ionH('O2', -2)} (deux oxygènes liés, chacun avec −1) : c’est un <b>peroxyde</b>.`;
      case 'Hydrure métallique': return `Il combine l’hydrogène avec un métal (${cat.f}) : c’est un <b>hydrure</b>. Ici l’hydrogène agit avec −1 (ion hydrure ${ionH('H', -1)}).`;
      case 'Hydroxyde': return `Il contient le groupe ${ionH('OH', -1)} lié à ${cat.cl === 'am' ? 'l’ion ammonium' : 'un métal (' + cat.f + ')'} : c’est un <b>hydroxyde</b>.`;
      case 'Hydracide': return `Hydrogène avec un halogène ou avec S, Se, Te : on le nomme avec la terminaison -ure (en solution aqueuse c’est un <b>hydracide</b>). L’hydrogène agit avec +1.`;
      case 'Oxoacide': return `Il commence par l’hydrogène et contient un groupe avec de l’oxygène (${fh(an.f)}, le ${an.trad}) : c’est un <b>oxoacide</b>. L’hydrogène agit avec +1.`;
      case 'Sel binaire': return `Il combine ${cat.cl === 'am' ? 'un ion ammonium' : 'un métal (' + cat.f + ')'} avec un non-métal sans oxygène (${an.f}) : c’est un <b>sel binaire</b> et le non-métal prend la terminaison -ure.`;
      case 'Composé binaire non métallique': return `Il combine deux non-métaux (${cat.f} et ${an.f}) ; le moins électronégatif va en premier et l’autre se termine en -ure.`;
      case 'Oxysel': return `${cat.cl === 'am' ? 'Un ion ammonium' : 'Un métal (' + cat.f + ')'} lié à un groupe avec de l’oxygène (${fh(an.f)}, le ${an.trad}) : c’est un <b>oxysel</b>, le sel d’un oxoacide.`;
      case 'Sel acide': return `${cat.cl === 'am' ? 'Un ion ammonium' : 'Un métal (' + cat.f + ')'} lié à un anion qui conserve ${an.j || 1} hydrogène${(an.j || 1) > 1 ? 's' : ''} de l’acide (${fh(an.f)}) : c’est un <b>sel acide</b> et le nom commence par « hydrogéno ».`;
      default: return '';
    }
  }
  function oxTxt(c) {
    const { cat, an, n, m } = c, tot = m * an.w;
    const el = cat.cl === 'h' ? 'hydrogène' : cat.nombre;
    const sumas = `${n > 1 ? n : ''}x ${m > 1 || an.w > 1 ? '+ ' + (m > 1 ? m + '·' : '') + '(−' + an.w + ')' : '+ (−1)'}`;
    const quien = anionTxt(an);
    return `L’anion est ${quien}, de charge ${an.w}−${m > 1 ? `; il y en a ${m}, soit ${tot}− au total` : ''}. Pour que le composé soit neutre, ${n > 1 ? `les ${n} atomes de ${el}` : `${el}`} doivent apporter +${tot} : $${sumas} = 0 ⇒ x = +${cat.v}$. ${cat.cl === 'h' ? '' : cat.multi ? `${cat.nombre} peut agir avec plusieurs nombres d’oxydation ; ici il agit avec +${cat.v}.` : `${cat.nombre} n’agit qu’avec +${cat.v}.`}`;
  }
  function pasosFN(c) {
    if (c.esp) {
      return [{ t: 'Reconnaissez le composé', html: `${c.html} est ${c.tipo === 'Agua' ? '<b>l’eau</b>' : c.tipo === 'Hidruro no metálico' ? 'un <b>hydrure non métallique</b> : pour les hydrures des groupes 13–15, on utilise surtout les noms courants et ceux de l’IUPAC' : `un composé de type <b>${c.tipo.toLowerCase()}</b> qui a son propre nom et ne découle pas des règles générales`}. On l’écrit $${c.formula.replace(/\d+/g, (d) => '_{' + d + '}')}$ et les noms de la liste sont ceux d’usage courant.` },
        { t: 'Noms', html: c.lineas.map((l) => `${l.et}: <b>${l.nombre}</b>`).join('<br>') }];
    }
    const p = [{ t: 'Reconnaissez le type de composé', html: tipoTxt(c) }, { t: 'Calculez le nombre d’oxydation', html: oxTxt(c) }];
    for (const l of c.lineas) p.push({ t: `Nomenclature ${l.et.toLowerCase().replace(/ · /g, ', ')}`, html: `${l.regla} → <b>${l.nombre}</b>${l.otros ? ` (aussi « ${l.otros.join(' », « ')} »)` : ''}${l.nota ? ` <small>(${l.nota})</small>` : ''}` });
    return p;
  }
  function pasosNF(c, usada) {
    if (c.esp) return [{ t: 'Reconnaissez le nom', html: `« ${usada.nombre} » est un nom ${c.tipo === 'Agua' ? 'de l’eau' : `d’un composé de type ${c.tipo.toLowerCase()}`} : sa formule est $${c.formula.replace(/\d+/g, (d) => '_{' + d + '}')}$.` }, { t: 'Écrivez la formule', html: `Sa formule est <b>${c.html}</b>.` }];
    const { cat, an, n, m, g } = c, sist = usada.et.includes('Systématique');
    const p = [];
    p.push({ t: 'Interprétez le nom', html: `« ${usada.nombre} » est en nomenclature ${usada.et.toLowerCase().replace(/ · /g, ', ')}. ${tipoTxt(c)}` });
    p.push({ t: 'Notez les charges', html: `${cat.cl === 'nm' ? 'Le' : 'Le'} ${cat.nombre} agit avec +${cat.v}${cat.multi && !sist ? ` (le chiffre romain ${ROM[cat.v]} ou la terminaison ${cat.trad ? '«' + cat.trad + '»' : ''} l’indiquent)` : ''} : ${ionH(cat.f, cat.v)}. ${anionTxt(an)} a une charge ${an.w}−.` });
    if (sist) p.push({ t: 'Lisez les préfixes', html: `Dans la nomenclature systématique, les préfixes donnent directement les indices : ${n} ${n > 1 ? 'atomes' : 'atome'} de ${cat.nombre} et ${m} ${an.cl === 'oxo' || an.poli ? (m > 1 ? 'groupes' : 'groupe') : (m > 1 ? 'atomes' : 'atome')} de ${an.cl === 'oxo' ? an.trad : an.f}.` });
    else p.push({ t: 'Croisez les charges', html: `La charge du cation (${cat.v}) devient l’indice de l’anion et celle de l’anion (${an.w}) devient celui du cation : ${fh(cat.f)}<sub>${an.w}</sub> ${fh(an.f)}<sub>${cat.v}</sub>${g > 1 ? `. Comme ${an.w} et ${cat.v} sont divisibles par ${g}, on simplifie et les indices deviennent ${n} et ${m}` : ''}${n === 1 && m === 1 ? '. L’indice 1 ne s’écrit pas' : ''}.` });
    p.push({ t: 'Écrivez et vérifiez la formule', html: `D’abord le cation${cat.cl === 'nm' ? ' (le moins électronégatif)' : ''} puis l’anion${an.poli && m > 1 ? ' ; le groupe ' + fh(an.f) + ' se répète et se met entre parenthèses' : ''} : <b>${c.html}</b>. Vérification : $${n}·(+${cat.v}) + ${m}·(−${an.w}) = 0$.` });
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
  const HIDRATO = 'hydraté', pfh = (p) => (IDI === 'de' ? p.replace(/^./, (c) => c.toUpperCase()) : p);
  const PREFH = ['', 'mono', 'di', 'tri', 'tétra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'déca'];
  function hidrato(base, n, usadaBase) {
    const r = base, pf = pfh(PREFH[n] || `${n}-`), c0 = r.c;
    const lineas = r.lineas.filter((l) => l.et !== 'Nom courant').map((l) => ({ ...l, nombre: IDI === 'de' ? `${l.nombre}-${pf}${HIDRATO}` : `${l.nombre} ${pf}${HIDRATO}`, regla: `${l.regla || ''} L’eau de cristallisation s’ajoute avec le préfixe ${pf}- et le mot « hydrate ».` }));
    const formula = `${c0.formula}·${n === 1 ? '' : n}H2O`, html = `${c0.html}·${n === 1 ? '' : n}H<sub>2</sub>O`;
    const c = { ...c0, formula, html, texto: ft(c0.formula) + `·${n === 1 ? '' : n}H₂O`, tipo: 'Hydrate', lineas, alias: [], esp: true, hidrato: n };
    const pasos = [...r.pasos, { t: 'Eau de cristallisation', html: `La formule se termine par <b>·${n === 1 ? '' : n}H<sub>2</sub>O</b> : pour chaque unité de ${c0.html}, il y a ${n} molécule${n > 1 ? 's' : ''} d’eau dans le cristal. On nomme le composé et on termine par <b>${pf}${HIDRATO}</b>.` }];
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
    if (!texto) throw new Error(modo === 'f2n' ? 'Écrivez une formule, par exemple Fe2O3, H2SO4 ou Ca(OH)2.' : 'Écrivez un nom, par exemple « oxyde de fer(III) » ou « acide sulfurique ».');
    if (modo === 'f2n') {
      const cuenta = leeFormula(texto), cs = porFormula.get(claveCuenta(cuenta));
      if (!cs) {
        const els = Object.keys(cuenta), sug = compuestos.filter((c) => els.every((e) => e in c.cuenta) && Object.keys(c.cuenta).length === els.length).slice(0, 6).map((c) => ft(c.formula));
        throw errorConSug(`« ${texto} » ne figure pas parmi les composés que l’outil sait nommer (oxydes, peroxydes, hydrures, hydroxydes, acides, sels et composés binaires). Vérifiez les indices et les charges : la somme doit être nulle.`, sug);
      }
      const c = cs[0];
      return { modo, c, formula: c.formula, html: c.html, tipo: c.tipo, lineas: c.lineas, alt: cs.slice(1), pasos: pasosFN(c), usada: null };
    }
    const k = norm(romanos(texto)), e = porNombre.get(k);
    if (!e) { let f = null; try { f = CompL.porNombre(k); } catch (err) { f = null; } if (f) return { ...resolver({ modo: 'f2n', texto: f }), modo, usada: { et: 'Manuels', nombre: texto } }; }
    if (!e) throw errorConSug(`Le nom « ${texto} » n’est pas reconnu. Vérifiez les accents, les préfixes et le chiffre romain entre parenthèses ; par exemple « oxyde de fer(III) », « trioxyde de difer » ou « acide nitrique ».`, sugerenciasNombre(k));
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
  const nombreEnunciado = (c, i) => { const l = c.lineas.filter((x) => x.et !== 'Nom courant'); return l[i % l.length].nombre; };

  const ejemplos = [];
  const ej = (grupo, modo, texto, nombre) => ejemplos.push({ clave: `${modo}-${norm(texto)}`, grupo, nombre: nombre || (modo === 'f2n' ? `${ft(texto)}` : texto), sc: { modo, texto } });
  for (const [g, fs] of [['De la formule au nom · Oxydes et hydrures', ['Fe2O3', 'CO2', 'Na2O', 'H2O2', 'CaH2', 'NH3']], ['De la formule au nom · Hydroxydes et acides', ['Ca(OH)2', 'Fe(OH)3', 'HCl', 'H2S', 'H2SO4', 'HNO3', 'H3PO4', 'HClO4']], ['De la formule au nom · Sels', ['NaCl', 'FeCl3', 'Cu2S', 'PCl5', 'CaCO3', 'Al2(SO4)3', 'KMnO4', 'NaClO', 'NaHCO3', 'Ca(H2PO4)2', '(NH4)2SO4']]]) for (const f of fs) ej(g, 'f2n', f);
  for (const [g, ns] of [['Du nom à la formule', ['oxyde de fer(III)', 'trioxyde de difer', 'dioxyde de carbone', 'hydroxyde d’aluminium', 'acide sulfurique', 'acide chlorhydrique', 'dichlorure de calcium', 'sulfate d’aluminium', 'carbonate de calcium', 'nitrate d’argent', 'hydrogénocarbonate de sodium', 'tétraoxosulfate(VI) de cuivre(II)', 'sulfure d’hydrogène', 'acide perchlorique']]]) for (const t of ns) ej(g, 'n2f', t);

  for (const [g, m, ts] of [['Complexes et hydrates · de la formule au nom', 'f2n', ['[Cu(NH3)4]SO4', 'K3[Fe(CN)6]', 'Na[Al(OH)4]', 'CuSO4·5H2O', 'O3']], ['Complexes et hydrates · du nom à la formule', 'n2f', ['hexacyanoferrate(III) de potassium', 'sulfate de calcium dihydraté', 'acide thiosulfurique']]]) for (const t of ts) ej(g, m, t);
  return { resolver, ejemplos, todos, aceptadas, nombreEnunciado, leeFormula, norm, ft, fh, ionH, porFormula: () => { indice(); return porFormula; }, porNombre: () => { indice(); return porNombre; } };
})();

