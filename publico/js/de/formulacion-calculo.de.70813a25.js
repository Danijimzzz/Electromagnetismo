const Formulacion = (() => {
  const SUBS = '₀₁₂₃₄₅₆₇₈₉', ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const PREF = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
  const PREFG = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis', 'heptakis'];
  const SIMBOLOS = new Set('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' '));
  const mcd = (a, b) => (b ? mcd(b, a % b) : a);
  const sa = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const norm = (s) => sa(String(s).toLowerCase()).replace(/[^a-z0-9]/g, '');
  const fh = (f) => String(f).replace(/\d+/g, '<sub>$&</sub>'); // fórmula en HTML
  const ft = (f) => String(f).replace(/\d/g, (d) => SUBS[d]); // fórmula en texto con subíndices
  const pre = (n, mono = false) => (n === 1 && !mono ? '' : PREF[n]);
  const ionH = (f, z) => `${fh(f)}<sup>${Math.abs(z) > 1 ? Math.abs(z) : ''}${z > 0 ? '+' : '−'}</sup>`;

  const METALES = [
    ['Li', 'litio', [1], [], {}, 1], ['Na', 'sodio', [1], [], {}, 1], ['K', 'potasio', [1], [], {}, 1], ['Rb', 'rubidio', [1]], ['Cs', 'cesio', [1]], ['Ag', 'plata', [1], [], {}, 1],
    ['Be', 'berilio', [2]], ['Mg', 'magnesio', [2], [], {}, 1], ['Ca', 'calcio', [2], [], {}, 1], ['Sr', 'estroncio', [2]], ['Ba', 'bario', [2], [], {}, 1],
    ['Zn', 'zinc', [2], [], {}, 1], ['Cd', 'cadmio', [2]], ['Al', 'aluminio', [3], [], {}, 1],
    ['Cu', 'cobre', [1, 2], [], { 1: 'cuproso', 2: 'Kupfer(II)' }, 1], ['Hg', 'mercurio', [1, 2], [], { 1: 'mercurioso', 2: 'Quecksilber(II)' }, 1],
    ['Au', 'oro', [1, 3], [], { 1: 'auroso', 3: 'Gold(III)' }, 1], ['Fe', 'hierro', [2, 3], [], { 2: 'ferroso', 3: 'Eisen(III)' }, 1],
    ['Co', 'cobalto', [2, 3], [], { 2: 'cobaltoso', 3: 'Cobalt(III)' }, 1], ['Ni', 'Nickel', [2, 3], [], { 2: 'niqueloso', 3: 'Nickel(III)' }, 1],
    ['Sn', 'Zinn', [2, 4], [], { 2: 'estannoso', 4: 'Zinn(IV)' }, 1], ['Pb', 'plomo', [2, 4], [], { 2: 'plumboso', 4: 'Blei(IV)' }, 1],
    ['Pt', 'platino', [2, 4], [], { 2: 'platinoso', 4: 'Platin(IV)' }],
    ['Cr', 'cromo', [2, 3], [6], { 2: 'cromoso', 3: 'Chrom(III)' }, 1], ['Mn', 'manganeso', [2, 3], [4, 7], { 2: 'manganoso', 3: 'Mangan(III)' }, 1],
    ['Ti', 'titanio', [3, 4]], ['Bi', 'bismuto', [3]],
  ];
  const PEROXIDOS = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Zn', 'Cd', 'Cu', 'Ag'];
  const NOMETALES = [
    ['N', 'Stickstoff', [1, 2, 3, 4, 5], [3], [3], [], 1], ['P', 'Phosphor', [3, 5], [3, 5], [3, 5], [3, 5], 1], ['As', 'Arsen', [3, 5], [3, 5], [3, 5], [3, 5]], ['Sb', 'antimonio', [3, 5], [3, 5], [3, 5], [3, 5]],
    ['C', 'carbono', [2, 4], [4], [4], [4], 1], ['Si', 'silicio', [4], [4], [4], [4], 1], ['B', 'boro', [3], [3], [3], [3], 1],
    ['S', 'azufre', [4, 6], [4, 6], [2], [], 1], ['Se', 'selenio', [4, 6], [4, 6], [4], []], ['Te', 'telurio', [4, 6], [4, 6], [4], []],
    ['Cl', 'cloro', [1, 3, 5, 7], [1, 3, 5], [], [], 1], ['Br', 'bromo', [1, 3, 5, 7], [1, 3, 5], [], []], ['I', 'yodo', [1, 3, 5, 7], [1, 3, 5, 7], [], []],
  ];
  const MONO = [
    ['F', 'fluoruro', 1, 'Fluorwasserstoff', 1], ['Cl', 'cloruro', 1, 'Chlorwasserstoff', 1], ['Br', 'bromuro', 1, 'Bromwasserstoff', 1], ['I', 'yoduro', 1, 'Iodwasserstoff', 1],
    ['S', 'sulfuro', 2, 'Schwefelwasserstoff', 1], ['Se', 'seleniuro', 2, 'Selenwasserstoff'], ['Te', 'telururo', 2, 'Tellurwasserstoff'],
    ['N', 'nitruro', 3], ['P', 'fosfuro', 3], ['As', 'arseniuro', 3], ['C', 'carburo', 4], ['Si', 'siliciuro', 4], ['B', 'boruro', 3],
  ];
  const OXO = [
    ['Cl', 1, 1, 1, 1, 'hipocloroso', 'hipoclorito', 1], ['Cl', 3, 2, 1, 1, 'cloroso', 'clorito', 1], ['Cl', 5, 3, 1, 1, 'Chlor', 'clorato', 1], ['Cl', 7, 4, 1, 1, 'Perchlor', 'perclorato', 1],
    ['Br', 1, 1, 1, 1, 'hipobromoso', 'hipobromito'], ['Br', 3, 2, 1, 1, 'bromoso', 'bromito'], ['Br', 5, 3, 1, 1, 'Brom', 'bromato'], ['Br', 7, 4, 1, 1, 'Perbrom', 'perbromato'],
    ['I', 1, 1, 1, 1, 'hipoyodoso', 'hipoyodito'], ['I', 3, 2, 1, 1, 'yodoso', 'yodito'], ['I', 5, 3, 1, 1, 'Iod', 'yodato'], ['I', 7, 4, 1, 1, 'Period', 'peryodato'],
    ['S', 4, 3, 2, 1, 'sulfuroso', 'sulfito', 1], ['S', 6, 4, 2, 1, 'Schwefel', 'sulfato', 1],
    ['Se', 4, 3, 2, 1, 'selenioso', 'selenito'], ['Se', 6, 4, 2, 1, 'Selen', 'selenato'], ['Te', 4, 3, 2, 1, 'teluroso', 'telurito'], ['Te', 6, 4, 2, 1, 'Tellur', 'telurato'],
    ['N', 3, 2, 1, 1, 'nitroso', 'nitrito', 1], ['N', 5, 3, 1, 1, 'Salpeter', 'nitrato', 1],
    ['P', 3, 3, 3, 1, 'fosforoso', 'fosfito'], ['P', 5, 4, 3, 1, 'Phosphor', 'fosfato', 1],
    ['As', 3, 3, 3, 1, 'arsenioso', 'arsenito'], ['As', 5, 4, 3, 1, 'Arsen', 'arseniato'],
    ['C', 4, 3, 2, 1, 'Kohlen', 'carbonato', 1], ['Si', 4, 3, 2, 1, 'Kiesel', 'silicato'], ['B', 3, 3, 3, 1, 'Bor', 'borato'],
    ['Cr', 6, 4, 2, 1, 'Chrom(III)', 'cromato', 1], ['Cr', 6, 7, 2, 2, 'Dichrom', 'dicromato', 1],
    ['Mn', 7, 4, 1, 1, 'Permangan', 'permanganato', 1],
    ['P', 5, 7, 4, 2, 'Diphosphor', 'difosfato'], ['S', 6, 7, 2, 2, 'Dischwefel', 'disulfato'],
    ['Si', 4, 4, 4, 1, 'Orthokiesel', 'ortosilicato'], ['B', 3, 2, 1, 1, 'Metabor', 'metaborato'],
  ];
  const ALIAS_EXTRA = [['H2SiO3', ['Metakieselsäure']], ['Na2SiO3', ['metasilicato de sodio']], ['H3BO3', ['Orthoborsäure']], ['H3PO4', ['Orthophosphorsäure']], ['H4P2O7', ['Pyrophosphorsäure']], ['H2S2O7', ['Dischwefelsäure']], ['Na2S2O7', ['pirosulfato de sodio']], ['Na4P2O7', ['pirofosfato de sodio']], ['H2O2', ['agua oxigenada']], ['NH3', ['azano']]];
  const ATO = { Cl: 'clorato', Br: 'bromato', I: 'yodato', S: 'sulfato', Se: 'selenato', Te: 'telurato', N: 'nitrato', P: 'fosfato', As: 'arsenato', C: 'carbonato', Si: 'silicato', B: 'borato', Cr: 'cromato', Mn: 'manganato' };
  const ICO = { Cl: 'Chlor', Br: 'Brom', I: 'Iod', S: 'Schwefel', Se: 'Selen', Te: 'Tellur', N: 'Salpeter', P: 'Phosphor', As: 'Arsen', C: 'Kohlen', Si: 'Kiesel', B: 'Bor', Cr: 'Chrom(III)', Mn: 'Mangan(III)' };
  const ESPECIALES = [
    ['H2O', 'Wasser', [['Systematisch', 'Dihydrogenoxid'], ['Trivialname', 'agua']], 1],
    ['NH3', 'Nichtmetallhydrid', [['Systematisch', 'Stickstofftrihydrid'], ['IUPAC (hidruros)', 'azano'], ['Trivialname', 'amoniaco']], 1],
    ['PH3', 'Nichtmetallhydrid', [['Systematisch', 'Phosphortrihydrid'], ['IUPAC (hidruros)', 'fosfano'], ['Trivialname', 'fosfina']]],
    ['AsH3', 'Nichtmetallhydrid', [['Systematisch', 'Arsentrihydrid'], ['IUPAC (hidruros)', 'arsano'], ['Trivialname', 'arsina']]],
    ['SbH3', 'Nichtmetallhydrid', [['Systematisch', 'trihidruro de antimonio'], ['IUPAC (hidruros)', 'estibano'], ['Trivialname', 'estibina']]],
    ['CH4', 'Nichtmetallhydrid', [['Systematisch', 'tetrahidruro de carbono'], ['IUPAC (hidruros)', 'metano']], 1],
    ['SiH4', 'Nichtmetallhydrid', [['Systematisch', 'tetrahidruro de silicio'], ['IUPAC (hidruros)', 'silano']], 1],
    ['BH3', 'Nichtmetallhydrid', [['Systematisch', 'trihidruro de boro'], ['IUPAC (hidruros)', 'borano']]],
    ['H2MnO4', 'Oxosäure', [['Traditionell', 'Mangansäure'], ['Systematisch', 'Dihydrogentetraoxidomanganat']]], ['K2MnO4', 'Oxosalz', [['Traditionell', 'manganato de potasio'], ['Systematisch', 'tetraoxidomanganato de dipotasio']]], ['Na2MnO4', 'Oxosalz', [['Traditionell', 'manganato de sodio']]],
    ['HPO3', 'Oxosäure', [['Traditionell', 'Metaphosphorsäure'], ['Systematisch', 'Hydrogentrioxidophosphat']]],
    ['O3', 'Element', [['Systematisch', 'Trioxygen'], ['Trivialname', 'ozono']], 1], ['O2', 'Element', [['Systematisch', 'Dioxygen'], ['Trivialname', 'Sauerstoff']], 1], ['H2', 'Element', [['Systematisch', 'Dihydrogen'], ['Trivialname', 'Wasserstoff']], 1],
    ['N2', 'Element', [['Systematisch', 'Distickstoff'], ['Trivialname', 'Stickstoff']], 1], ['F2', 'Element', [['Systematisch', 'Difluor'], ['Trivialname', 'Fluor']]], ['Cl2', 'Element', [['Systematisch', 'dicloro'], ['Trivialname', 'cloro']], 1],
    ['Br2', 'Element', [['Systematisch', 'dibromo'], ['Trivialname', 'bromo']]], ['I2', 'Element', [['Systematisch', 'diyodo'], ['Trivialname', 'yodo']]], ['P4', 'Element', [['Systematisch', 'Tetraphosphor'], ['Trivialname', 'weißer Phosphor']]], ['S8', 'Element', [['Systematisch', 'octaazufre'], ['Trivialname', 'azufre']]],
    ['H3PO2', 'Oxosäure', [['Traditionell', 'Hypophosphorige Säure'], ['IUPAC', 'Phosphinsäure']]],
    ['H2S2O3', 'Thiosäure', [['Traditionell', 'Thioschwefelsäure'], ['Systematisch', 'Dihydrogentrioxidosulfidosulfat']]], ['Na2S2O3', 'Thiosulfat', [['Traditionell', 'tiosulfato de sodio'], ['Systematisch', 'trioxidosulfidosulfato de disodio']]], ['K2S2O3', 'Thiosulfat', [['Traditionell', 'tiosulfato de potasio']]],
    ['HSCN', 'Thiosäure', [['Traditionell', 'Thiocyansäure'], ['IUPAC', 'Hydrogenthiocyanat']]], ['KSCN', 'Thiocyanat', [['Traditionell', 'tiocianato de potasio']]], ['NaSCN', 'Thiocyanat', [['Traditionell', 'tiocianato de sodio']]], ['NH4SCN', 'Thiocyanat', [['Traditionell', 'tiocianato de amonio']]],
    ['H2SO5', 'Peroxosäure', [['Traditionell', 'Peroxoschwefelsäure'], ['Systematisch', 'Dihydrogenperoxidotrioxidosulfat']]], ['H2S2O8', 'Peroxosäure', [['Traditionell', 'Peroxodischwefelsäure']]], ['HNO4', 'Peroxosäure', [['Traditionell', 'Peroxosalpetersäure']]],
    ['K2S2O8', 'Peroxosalz', [['Traditionell', 'peroxodisulfato de potasio']]], ['Na2S2O8', 'Peroxosalz', [['Traditionell', 'peroxodisulfato de sodio']]], ['(NH4)2S2O8', 'Peroxosalz', [['Traditionell', 'peroxodisulfato de amonio']]],
    ['CaC2', 'Carbid', [['Traditionell', 'carburo de calcio'], ['Systematisch', 'dicarburo de calcio'], ['IUPAC', 'acetiluro de calcio']]],
    ['KAl(SO4)2', 'Doppelsalz', [['Traditionell', 'sulfato de aluminio y potasio'], ['Systematisch', 'bis(tetraoxidosulfato) de aluminio y potasio']]], ['NaKCO3', 'Doppelsalz', [['Traditionell', 'carbonato de potasio y sodio']]],
    ['CaMg(CO3)2', 'Doppelsalz', [['Traditionell', 'carbonato de calcio y magnesio']]], ['MgNH4PO4', 'Doppelsalz', [['Traditionell', 'fosfato de amonio y magnesio']]], ['KNaSO4', 'Doppelsalz', [['Traditionell', 'sulfato de potasio y sodio']]],
  ];

  function leeFormula(texto) {
    const s = String(texto ?? '').replace(/\s+/g, '').replace(/[₀-₉]/g, (c) => SUBS.indexOf(c)).replace(/[[{]/g, '(').replace(/[\]}]/g, ')');
    if (!s) throw new Error('Schreibe eine Formel, zum Beispiel Fe2O3 oder H2SO4.');
    let i = 0;
    const numero = () => { let t = ''; while (/\d/.test(s[i] || '')) t += s[i++]; return t ? +t : 1; };
    function grupo(dentro) {
      const c = {};
      const suma = (g, k) => { for (const e in g) c[e] = (c[e] || 0) + g[e] * k; };
      while (i < s.length) {
        const ch = s[i];
        if (ch === '(') { i++; const g = grupo(true); suma(g, numero()); }
        else if (ch === ')') { if (!dentro) throw new Error('Es gibt eine schließende Klammer ohne öffnende.'); i++; return c; }
        else if (/[A-Z]/.test(ch)) {
          let sim = ch; i++;
          if (/[a-z]/.test(s[i] || '')) sim += s[i++];
          if (!SIMBOLOS.has(sim)) throw new Error(`„${sim}“ ist kein Elementsymbol. Symbole haben den ersten Buchstaben groß und den zweiten klein (Co ist Cobalt, CO ist Kohlenmonoxid).`);
          suma({ [sim]: 1 }, numero());
        } else throw new Error(`Ich verstehe das Zeichen „${ch}“ in der Formel nicht. Verwende Elementsymbole, Zahlen und Klammern.`);
      }
      if (dentro) throw new Error('Es fehlt eine schließende Klammer.');
      return c;
    }
    const r = grupo(false);
    if (!Object.keys(r).length) throw new Error('Schreibe eine Formel, zum Beispiel Fe2O3 oder H2SO4.');
    return r;
  }
  const claveCuenta = (c) => Object.keys(c).sort().map((e) => e + c[e]).join('');

  const cationes = [], aniones = [];
  for (const [sim, nombre, vs, ox = [], trad = {}, comun] of METALES) {
    const multi = vs.length + ox.length > 1;
    for (const v of vs) cationes.push({ cl: 'm', f: sim, nombre, v, multi, trad: trad[v] || null, comun: !!comun, peroxido: PEROXIDOS.includes(sim) });
    for (const v of ox) cationes.push({ cl: 'm', f: sim, nombre, v, multi, trad: trad[v] || null, comun: !!comun, soloOxido: true });
  }
  const CAT_NH4 = { cl: 'am', f: 'NH4', poli: true, nombre: 'amonio', v: 1, multi: false, trad: null, comun: true };
  const CAT_H = { cl: 'h', f: 'H', nombre: 'Wasserstoff', v: 1, multi: false, trad: null, comun: true };

  for (const [sim, base, w, hidra, comun] of MONO) aniones.push({ cl: 'mono', f: sim, w, base, hidra, comun: !!comun, hidracido: !!hidra });
  const AN_O = { cl: 'mono', f: 'O', w: 2, base: 'oxid', comun: true, esO: true }, AN_H = { cl: 'mono', f: 'H', w: 1, base: 'hidruro', comun: true, esH: true };
  const AN_OH = { cl: 'mono', f: 'OH', w: 1, base: 'Hydroxid', poli: true, comun: true, esOH: true }, AN_O2 = { cl: 'per', f: 'O2', w: 2, poli: true, comun: true };
  aniones.push(AN_O, AN_H, AN_OH, AN_O2);
  for (const sim of ['S', 'Se', 'Te']) aniones.push({ cl: 'mono', f: 'H' + sim, w: 1, base: 'hidrogeno' + MONO.find((m) => m[0] === sim)[1], poli: true, grupo: true, comun: false, hs: true });
  const pOxido = (k) => (k === 1 ? '' : PREF[k]) + 'oxido', pOxo = (k) => (k === 1 ? '' : PREF[k]) + 'oxo';
  for (const [centro, v, nO, h, k, tAc, tAn, comun] of OXO) {
    const ato = (k === 2 ? 'di' : '') + ATO[centro], ico = (k === 2 ? 'di' : '') + ICO[centro];
    const baseF = `${centro}${k > 1 ? k : ''}O${nO > 1 ? nO : ''}`;
    for (let j = 0; j < h; j++) {
      const ph = j ? (j > 1 ? PREF[j] : '') + 'hidrogeno' : '';
      aniones.push({
        cl: 'oxo', f: (j ? 'H' + (j > 1 ? j : '') : '') + baseF, w: h - j, poli: true, grupo: true, comun: !!comun && (j === 0 || ['SO4', 'CO3', 'PO4', 'SO3'].includes(baseF)),
        centro, v, nO, h, j, tAn,
        sist: `${ph}${pOxido(nO)}${ato}`, stock: `${ph}${pOxo(nO)}${ato}(${ROM[v]})`, trad: `${ph}${tAn}`,
        stockSal: `${pOxo(nO)}${ato}(${ROM[v]})`,
        acidoStock: `${pOxo(nO)}${ico}(${ROM[v]})`, acidoTrad: tAc,
      });
    }
  }

  function nombres(cat, n, an, m) {
    const L = [], alias = [];
    const ca = (k) => pre(k) + cat.nombre; // dihierro
    const stockCat = cat.nombre + (cat.multi ? `(${ROM[cat.v]})` : '');
    const uno = (et, nombre, regla, nota) => { if (nombre) L.push({ et, nombre, regla, nota }); };
    const RS = 'Die Zahlpräfixe (mono-, di-, tri-, tetra-, penta-, hexa-, hepta-…) sagen, wie viele Atome oder Gruppen von jedem vorhanden sind.';
    if (cat.cl === 'h' && an.cl === 'oxo') {
      uno('Systematisch', `${an.sist} de ${ca(n)}`, `${RS} Die Sauerstoffatome werden als „${pOxido(an.nO)}“ benannt, das Zentralelement endet auf -at und, da es eine Säure ist, ist das Kation Wasserstoff${n > 1 ? ' (' + PREF[n] + 'hydrogen wegen der ' + n + ' Atome)' : ''}.`);
      uno('Stock', `${an.acidoStock}säure`, `Man schreibt die Sauerstoffpräfixe mit „oxo“, den Stamm des Zentralelements und seine Oxidationszahl in römischen Zahlen: ${ROM[an.v]}.`);
      uno('Traditionell', `${an.acidoTrad}säure`, tradOxoRegla(an));
      alias.push(`${an.stockSal}wasserstoff`);
    } else if (cat.cl === 'h' && an.cl === 'mono') {
      uno('Systematisch', `${pre(m)}${an.base} de ${ca(n)}`, `Man benennt das Anion mit -id und dann „wasserstoff“${n > 1 ? ', mit dem Präfix ' + PREF[n] + '- wegen der ' + n + ' Wasserstoffatome' : ''}.`);
      uno('Stock', `${an.base}wasserstoff`, 'Wasserstoff wirkt immer mit +1: Seine Oxidationszahl muss nicht angegeben werden.');
      uno('Traditionell', `${an.hidra}säure`, 'In wässriger Lösung heißt sie Stamm des Elements + „-wasserstoffsäure“.', 'in wässriger Lösung');
    } else if (cat.cl === 'h' && an.cl === 'per') {
      uno('Systematisch', `${ca(n)}${PREF[2 * m]}oxid`, `${RS} Es sind ${2 * m} Sauerstoffatome und ${n} Wasserstoffatome.`);
      uno('Stock', 'Wasserstoffperoxid', 'Die Gruppe O₂²⁻ heißt Peroxid.');
      uno('Trivialname', 'agua oxigenada', null, 'in Lösung');
    } else if (cat.cl === 'nm') {
      const anh = an.esO ? OXO.find((o) => o[0] === cat.f && o[1] === cat.v && o[4] === 1) : null;
      uno('Systematisch', `${PREF[m]}${an.base} de ${ca(n)}`, `${RS} Hier ${PREF[m]}- für ${an.base.replace('uro', 'uro')} (${m} Atome)${n > 1 ? ' und ' + PREF[n] + '- für ' + cat.nombre + ' (' + n + ' Atome)' : ' und keines für ' + cat.nombre + ' (es gibt nur eines)'}.`);
      uno('Stock', `${an.base} de ${stockCat}`, `In Klammern steht, in römischen Zahlen, die Oxidationszahl von ${cat.nombre}: ${ROM[cat.v]}${cat.multi ? '' : ' (hier hat es nur eine, sie kann weggelassen werden)'}.`);
      if (anh) uno('Traditionell', `${anh[5]}säureanhydrid`, `Die Oxide der Nichtmetalle hießen früher „Anhydride“ (der ${anh[5]}säure).`);
      alias.push(...L.filter((l) => l.et === 'Systematisch').flatMap((l) => (m === 1 && n === 1 ? [l.nombre.replace(/^mono/, '')] : [])));
    } else if (an.cl === 'per') {
      uno('Systematisch', `${ca(n)}${PREF[2 * m]}oxid`, `${RS} Es gibt ${2 * m} Sauerstoffatome (${m} Gruppe${m > 1 ? 'n' : ''} O₂)${n > 1 ? ' und ' + n + ' von ' + cat.nombre : ''}.`);
      uno('Stock', `${stockCat}peroxid`, `Die Gruppe O₂²⁻ heißt Peroxid${cat.multi ? '; die Oxidationszahl von ' + cat.nombre + ' steht in römischen Zahlen' : ''}.`);
      uno('Traditionell', cat.trad ? `${cat.trad}peroxid` : cat.multi ? null : `${cat.nombre}peroxid`, cat.trad ? tradMetalRegla(cat) : 'Bei nur einer Oxidationszahl genügt „… peroxid“.');
    } else if (an.cl === 'mono') {
      const monoEn = cat.multi || cat.cl === 'nm';
      const grupo = an.grupo ? (m > 1 ? `${PREFG[m]}(${an.base})` : an.base) : pre(m, monoEn) + an.base;
      uno('Systematisch', `${grupo} de ${ca(n)}`, `${RS}${an.grupo ? ' Bei Gruppen aus mehreren Atomen verwendet man bis-, tris-… und Klammern.' : ''} ${prefijosTxt(cat, n, an, m, monoEn)}`);
      uno('Stock', `${an.base} de ${stockCat}`, stockRegla(cat));
      uno('Traditionell', cat.trad ? `${an.base} ${cat.trad}` : cat.multi ? null : `${an.base} de ${cat.nombre}`, cat.trad ? tradMetalRegla(cat) : 'Bei nur einer Oxidationszahl genügt „' + an.base + ' …“.');
      if (!an.grupo) alias.push(`${PREF[m]}${an.base} de ${ca(n)}`, `${pre(m)}${an.base} de ${ca(n)}`);
      if (an.esO && m >= 4) alias.push(`${ca(n)}${PREF[m].slice(0, -1)}oxid`);
    } else if (an.cl === 'oxo') {
      const w = m > 1 ? `${PREFG[m]}(${an.sist})` : an.sist;
      uno('Systematisch', `${w} de ${ca(n)}`, `${RS} ${m > 1 ? `Das Anion kommt ${m}-mal vor und steht in Klammern mit ${PREFG[m]}-. ` : ''}Die Sauerstoffatome werden als „${pOxido(an.nO)}“ benannt${an.j ? ' und die Wasserstoffatome des Anions mit „hydrogen“' : ''}, und das Zentralelement endet auf -at.`);
      uno('Stock', `${an.stock} de ${stockCat}`, `Die Sauerstoffatome mit „${pOxo(an.nO)}“, das zentrale mit -at und seiner Oxidationszahl in Klammern (${ROM[an.v]}); außerdem die von ${cat.nombre === 'amonio' ? 'Ammonium' : 'dem Metall'}${cat.multi ? ' (' + ROM[cat.v] + ')' : ''}.`);
      uno('Traditionell', `${an.trad} de ${stockCat}`, tradOxoRegla(an, true));
      if (cat.trad) L[L.length - 1].otros = [`${an.trad} ${cat.trad}`];
    }
    const mo = (t) => (t && t.replace ? t.replace(/monoóxido/g, 'monoxid') : t);
    for (const l of L) l.nombre = mo(l.nombre);
    return { L, alias: alias.map(mo) };
  }
  const prefijosTxt = (cat, n, an, m, monoEn) => `Hier: ${m === 1 && !monoEn ? 'nur ein ' + an.base + ' (mono- entfällt)' : PREF[m] + '- für ' + an.base}${n > 1 ? ' und ' + PREF[n] + '- für ' + cat.nombre : ''}.`;
  const stockRegla = (cat) => (cat.multi ? `${cat.nombre} hat mehrere Oxidationszahlen: Die hier verwendete steht in Klammern, in römischen Zahlen (${ROM[cat.v]}).` : `${cat.nombre} wirkt nur mit +${cat.v}: Eine römische Zahl ist nicht nötig.`);
  const tradMetalRegla = (cat) => `In der traditionellen Nomenklatur bekommt das Metall mit zwei Oxidationszahlen die Endung -(o)so (die kleinere) oder -ico (die größere): Mit +${cat.v} ist es „${cat.trad}“.`;
  function tradOxoRegla(an, sal) {
    const t = sal ? an.tAn : an.acidoTrad;
    const sufijo = sal ? (/ito$/.test(t) ? '-it (niedrigere Oxidationszahl)' : '-at (höhere Oxidationszahl)') : (/oso$/.test(t) ? '-ige Säure (niedrigere Oxidationszahl)' : '-säure (höhere Oxidationszahl)');
    const pf = /^hipo/.test(t) ? ', mit Hypo- (die niedrigste der vier)' : /^per/.test(t) ? ', mit Per- (die höchste der vier)' : '';
    return `Das Zentralelement (${an.centro}) wirkt mit +${an.v}: ${sal ? 'Das Anion' : 'Die Säure'} endet auf ${sufijo}${pf}.${sal && an.j ? ' Die Wasserstoffatome, die es behält, werden mit „hydrogen“ davor angegeben.' : ''}`;
  }

  const compuestos = [];
  function tipoDe(cat, an) {
    if (cat.cl === 'h') return an.cl === 'oxo' ? 'Oxosäure' : an.cl === 'per' ? 'Peroxid' : 'Hydracid';
    if (an.cl === 'per') return 'Peroxid';
    if (an.esOH) return 'Hydroxid';
    if (an.esO) return cat.cl === 'nm' ? 'Nichtmetalloxid' : 'Oxid';
    if (an.esH) return 'Metallhydrid';
    if (an.cl === 'oxo') return an.j ? 'Saures Salz' : 'Oxosalz';
    if (an.hs) return 'Saures Salz';
    return cat.cl === 'nm' ? 'Binäre Nichtmetallverbindung' : 'Binäres Salz';
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
      for (const nom of c.alias) añade(nom, c, 'Systematisch');
    }
  }
  function añade(nombre, c, et) { const k = norm(nombre); if (!porNombre.has(k) || (c.esp && !porNombre.get(k).c.esp && c.formula === "CaC2")) porNombre.set(k, { c, et, nombre }); }
  const todos = () => compuestos;

    const anionTxt = (an) => (an.cl === 'oxo' ? `ion ${an.trad} ${ionH(an.f, -an.w)}` : an.cl === 'per' ? `Peroxidion ${ionH('O2', -2)}` : `ion ${an.base} ${ionH(an.f, -an.w)}`);
  function tipoTxt(c) {
    const { cat, an } = c;
    switch (c.tipo) {
      case 'Oxid': return `Es verbindet Sauerstoff mit einem Metall (${cat.f}): Es ist ein <b>Oxid</b>. Sauerstoff wirkt mit −2 (Oxidion ${ionH('O', -2)}).`;
      case 'Nichtmetalloxid': return `Es verbindet Sauerstoff mit einem Nichtmetall (${cat.f}): Es ist ein <b>Nichtmetalloxid</b>. Man schreibt zuerst das weniger elektronegative, und Sauerstoff wirkt mit −2.`;
      case 'Peroxid': return `Es enthält die Gruppe ${ionH('O2', -2)} (zwei verbundene Sauerstoffatome mit je −1): Es ist ein <b>Peroxid</b>.`;
      case 'Metallhydrid': return `Es verbindet Wasserstoff mit einem Metall (${cat.f}): Es ist ein <b>Hydrid</b>. Hier wirkt Wasserstoff mit −1 (Hydridion ${ionH('H', -1)}).`;
      case 'Hydroxid': return `Es enthält die Gruppe ${ionH('OH', -1)}, gebunden an ${cat.cl === 'am' ? 'das Ammoniumion' : 'ein Metall (' + cat.f + ')'}: Es ist ein <b>Hydroxid</b>.`;
      case 'Hydracid': return `Wasserstoff mit einem Halogen oder mit S, Se, Te: Es wird mit der Endung -id benannt (in wässriger Lösung ist es ein <b>Hydracid</b>). Wasserstoff wirkt mit +1.`;
      case 'Oxosäure': return `Es beginnt mit Wasserstoff und hat eine sauerstoffhaltige Gruppe (${fh(an.f)}, ${an.trad}): Es ist eine <b>Oxosäure</b>. Wasserstoff wirkt mit +1.`;
      case 'Binäres Salz': return `Es verbindet ${cat.cl === 'am' ? 'ein Ammoniumion' : 'ein Metall (' + cat.f + ')'} mit einem Nichtmetall ohne Sauerstoff (${an.f}): Es ist ein <b>binäres Salz</b>, und das Nichtmetall bekommt die Endung -id.`;
      case 'Binäre Nichtmetallverbindung': return `Es verbindet zwei Nichtmetalle (${cat.f} und ${an.f}); das weniger elektronegative steht zuerst und das andere endet auf -id.`;
      case 'Oxosalz': return `${cat.cl === 'am' ? 'Ein Ammoniumion' : 'Ein Metall (' + cat.f + ')'}, gebunden an eine sauerstoffhaltige Gruppe (${fh(an.f)}, ${an.trad}): Es ist ein <b>Oxosalz</b>, das Salz einer Oxosäure.`;
      case 'Saures Salz': return `${cat.cl === 'am' ? 'Ein Ammoniumion' : 'Ein Metall (' + cat.f + ')'}, gebunden an ein Anion, das ${an.j || 1} Wasserstoff${(an.j || 1) > 1 ? 'atome' : ''} der Säure behält (${fh(an.f)}): Es ist ein <b>saures Salz</b>, und der Name beginnt mit „Hydrogen“.`;
      default: return '';
    }
  }
  function oxTxt(c) {
    const { cat, an, n, m } = c, tot = m * an.w;
    const el = cat.cl === 'h' ? 'Wasserstoff' : cat.nombre;
    const sumas = `${n > 1 ? n : ''}x ${m > 1 || an.w > 1 ? '+ ' + (m > 1 ? m + '·' : '') + '(−' + an.w + ')' : '+ (−1)'}`;
    const quien = anionTxt(an);
    return `Das Anion ist ${quien}, mit der Ladung ${an.w}−${m > 1 ? `; es sind ${m}, insgesamt ${tot}−` : ''}. Damit die Verbindung neutral ist, müssen ${n > 1 ? `die ${n} Atome ${el}` : `${el}`} +${tot} beisteuern: $${sumas} = 0 ⇒ x = +${cat.v}$. ${cat.cl === 'h' ? '' : cat.multi ? `${cat.nombre} kann mit mehreren Oxidationszahlen wirken; hier wirkt es mit +${cat.v}.` : `${cat.nombre} wirkt nur mit +${cat.v}.`}`;
  }
  function pasosFN(c) {
    if (c.esp) {
      return [{ t: 'Die Verbindung erkennen', html: `${c.html} ist ${c.tipo === 'Agua' ? '<b>Wasser</b>' : c.tipo === 'Hidruro no metálico' ? 'ein <b>Nichtmetallhydrid</b>: Bei den Hydriden der Gruppen 13–15 verwendet man vor allem die Trivialnamen und die der IUPAC' : `eine Verbindung vom Typ <b>${c.tipo.toLowerCase()}</b>, die einen eigenen Namen hat und sich nicht aus den allgemeinen Regeln ergibt`}. Man schreibt $${c.formula.replace(/\d+/g, (d) => '_{' + d + '}')}$, und die Namen der Liste sind die gebräuchlichen.` },
        { t: 'Namen', html: c.lineas.map((l) => `${l.et}: <b>${l.nombre}</b>`).join('<br>') }];
    }
    const p = [{ t: 'Den Verbindungstyp erkennen', html: tipoTxt(c) }, { t: 'Die Oxidationszahl berechnen', html: oxTxt(c) }];
    for (const l of c.lineas) p.push({ t: `Nomenklatur ${l.et.toLowerCase().replace(/ · /g, ', ')}`, html: `${l.regla} → <b>${l.nombre}</b>${l.otros ? ` (auch „${l.otros.join('“, „')}“)` : ''}${l.nota ? ` <small>(${l.nota})</small>` : ''}` });
    return p;
  }
  function pasosNF(c, usada) {
    if (c.esp) return [{ t: 'Den Namen erkennen', html: `„${usada.nombre}“ ist ein Name ${c.tipo === 'Agua' ? 'für Wasser' : `einer Verbindung vom Typ ${c.tipo.toLowerCase()}`}: Ihre Formel ist $${c.formula.replace(/\d+/g, (d) => '_{' + d + '}')}$.` }, { t: 'Die Formel schreiben', html: `Ihre Formel ist <b>${c.html}</b>.` }];
    const { cat, an, n, m, g } = c, sist = /Sistem/.test(usada.et);
    const p = [];
    p.push({ t: 'Den Namen deuten', html: `„${usada.nombre}“ steht in der Nomenklatur ${usada.et.toLowerCase().replace(/ · /g, ', ')}. ${tipoTxt(c)}` });
    p.push({ t: 'Die Ladungen notieren', html: `${cat.cl === 'nm' ? '' : ''}${cat.nombre} wirkt mit +${cat.v}${cat.multi && !sist ? ` (die römische Zahl ${ROM[cat.v]} oder die Endung ${cat.trad ? '„' + cat.trad + '“' : ''} geben es an)` : ''}: ${ionH(cat.f, cat.v)}. ${anionTxt(an)} hat die Ladung ${an.w}−.` });
    if (sist) p.push({ t: 'Die Präfixe lesen', html: `In der systematischen Nomenklatur geben die Präfixe direkt die Indizes an: ${n} ${n > 1 ? 'Atome' : 'Atom'} ${cat.nombre} und ${m} ${an.cl === 'oxo' || an.poli ? (m > 1 ? 'Gruppen' : 'Gruppe') : (m > 1 ? 'Atome' : 'Atom')} ${an.cl === 'oxo' ? an.trad : an.f}.` });
    else p.push({ t: 'Die Ladungen überkreuzen', html: `Die Ladung des Kations (${cat.v}) wird als Index zum Anion und die des Anions (${an.w}) zum Kation: ${fh(cat.f)}<sub>${an.w}</sub> ${fh(an.f)}<sub>${cat.v}</sub>${g > 1 ? `. Da sich ${an.w} und ${cat.v} durch ${g} teilen lassen, wird gekürzt und die Indizes sind ${n} und ${m}` : ''}${n === 1 && m === 1 ? '. Der Index 1 wird nicht geschrieben' : ''}.` });
    p.push({ t: 'Die Formel schreiben und kontrollieren', html: `Zuerst das Kation${cat.cl === 'nm' ? ' (das weniger elektronegative)' : ''} und danach das Anion${an.poli && m > 1 ? '; die Gruppe ' + fh(an.f) + ' kommt mehrfach vor und steht in Klammern' : ''}: <b>${c.html}</b>. Kontrolle: $${n}·(+${cat.v}) + ${m}·(−${an.w}) = 0$.` });
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
  const PREFH = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
  function hidrato(base, n, usadaBase) {
    const r = base, pf = PREFH[n] || `${n}-`, c0 = r.c;
    const lineas = r.lineas.filter((l) => l.et !== 'Trivialname').map((l) => ({ ...l, nombre: `${l.nombre} ${pf}hidrato`, regla: `${l.regla || ''} Das Kristallwasser wird mit dem Präfix ${pf}- und dem Wort „hydrat“ angefügt.` }));
    const formula = `${c0.formula}·${n === 1 ? '' : n}H2O`, html = `${c0.html}·${n === 1 ? '' : n}H<sub>2</sub>O`;
    const c = { ...c0, formula, html, texto: ft(c0.formula) + `·${n === 1 ? '' : n}H₂O`, tipo: 'Hydrat', lineas, alias: [], esp: true, hidrato: n };
    const pasos = [...r.pasos, { t: 'Kristallwasser', html: `Die Formel endet auf <b>·${n === 1 ? '' : n}H<sub>2</sub>O</b>: Pro Einheit ${c0.html} gibt es ${n} Wassermolekül${n > 1 ? 'e' : ''} im Kristall. Man benennt die Verbindung und schließt mit <b>${pf}hydrat</b> ab.` }];
    return { modo: r.modo, c, formula, html, tipo: 'Hydrat', lineas, alt: [], pasos, usada: usadaBase || null };
  }
  function resolver(sc) {
    indice();
    { const t0 = String(sc?.texto ?? '').trim();
      if (sc && sc.modo !== 'n2f' && /\[/.test(t0)) { let x = null, e1 = null; try { x = CompL.leer(t0); } catch (e) { e1 = e; } if (!x) { try { return resolver({ ...sc, texto: t0.replace(/\[/g, '(').replace(/\]/g, ')') }); } catch (e2) { throw e1; } } return { modo: 'f2n', c: { formula: x.formula, html: x.html, texto: x.formula, tipo: x.tipo, lineas: x.nombres, alias: [], esp: true, complejo: x }, formula: x.formula, html: x.html, tipo: x.tipo, lineas: x.nombres, alt: [], pasos: x.pasos, usada: null }; }
      const mh = /^(.*?)\s*[·.*•]\s*(\d*)\s*H2O\s*$/i.exec(t0.replace(/[₀-₉]/g, (d) => SUBS.indexOf(d)));
      if (sc && sc.modo !== 'n2f' && mh && mh[1]) return hidrato(resolver({ modo: 'f2n', texto: mh[1] }), +mh[2] || 1);
      const mn = /^(.*?)\s+(mono|di|tri|tetra|penta|hexa|hepta|octa|nona|deca)hidrato\s*$/i.exec(t0);
      if (sc && sc.modo === 'n2f' && mn) { const n = PREFH.indexOf(mn[2].toLowerCase()); const b = resolver({ modo: 'n2f', texto: mn[1] }); return hidrato({ ...b, modo: 'n2f' }, n, b.usada); } }
    const modo = sc && sc.modo === 'n2f' ? 'n2f' : 'f2n', texto = String(sc?.texto ?? '').trim();
    const romanos = (t) => t.replace(/\(\s*\+?([1-7])\s*\+?\s*\)/g, (_, d) => `(${ROM[d]})`);
    if (!texto) throw new Error(modo === 'f2n' ? 'Schreibe eine Formel, zum Beispiel Fe2O3, H2SO4 oder Ca(OH)2.' : 'Schreibe einen Namen, zum Beispiel „Eisen(III)-oxid“ oder „Schwefelsäure“.');
    if (modo === 'f2n') {
      const cuenta = leeFormula(texto), cs = porFormula.get(claveCuenta(cuenta));
      if (!cs) {
        const els = Object.keys(cuenta), sug = compuestos.filter((c) => els.every((e) => e in c.cuenta) && Object.keys(c.cuenta).length === els.length).slice(0, 6).map((c) => ft(c.formula));
        throw errorConSug(`Ich erkenne „${texto}“ nicht unter den Verbindungen, die das Werkzeug benennen kann (Oxide, Peroxide, Hydride, Hydroxide, Säuren, Salze und binäre Verbindungen). Prüfe die Indizes und die Ladungen: Die Summe muss null sein.`, sug);
      }
      const c = cs[0];
      return { modo, c, formula: c.formula, html: c.html, tipo: c.tipo, lineas: c.lineas, alt: cs.slice(1), pasos: pasosFN(c), usada: null };
    }
    const k = norm(romanos(texto)), e = porNombre.get(k);
    if (!e) { let f = null; try { f = CompL.porNombre(k); } catch (err) { f = null; } if (f) return { ...resolver({ modo: 'f2n', texto: f }), modo, usada: { et: 'Lehrbücher', nombre: texto } }; }
    if (!e) throw errorConSug(`Ich erkenne den Namen „${texto}“ nicht. Prüfe die Schreibweise, die Präfixe und die römische Zahl in Klammern; zum Beispiel „Eisen(III)-oxid“, „Dieisentrioxid“ oder „Salpetersäure“.`, sugerenciasNombre(k));
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
  const nombreEnunciado = (c, i) => { const l = c.lineas.filter((x) => x.et !== 'Trivialname'); return l[i % l.length].nombre; };

  const ejemplos = [];
  const ej = (grupo, modo, texto, nombre) => ejemplos.push({ clave: `${modo}-${norm(texto)}`, grupo, nombre: nombre || (modo === 'f2n' ? `${ft(texto)}` : texto), sc: { modo, texto } });
  for (const [g, fs] of [['Von der Formel zum Namen · Oxide und Hydride', ['Fe2O3', 'CO2', 'Na2O', 'H2O2', 'CaH2', 'NH3']], ['Von der Formel zum Namen · Hydroxide und Säuren', ['Ca(OH)2', 'Fe(OH)3', 'HCl', 'H2S', 'H2SO4', 'HNO3', 'H3PO4', 'HClO4']], ['Von der Formel zum Namen · Salze', ['NaCl', 'FeCl3', 'Cu2S', 'PCl5', 'CaCO3', 'Al2(SO4)3', 'KMnO4', 'NaClO', 'NaHCO3', 'Ca(H2PO4)2', '(NH4)2SO4']]]) for (const f of fs) ej(g, 'f2n', f);
  for (const [g, ns] of [['Vom Namen zur Formel', ['Eisen(III)-oxid', 'Dieisentrioxid', 'Kohlenstoffdioxid', 'Aluminiumhydroxid', 'Schwefelsäure', 'Salzsäure', 'dicloruro de calcio', 'sulfato de aluminio', 'carbonato de calcio', 'nitrato de plata', 'hidrogenocarbonato de sodio', 'tetraoxosulfato(VI) de cobre(II)', 'Schwefelwasserstoff', 'Perchlorsäure']]]) for (const t of ns) ej(g, 'n2f', t);

  for (const [g, m, ts] of [['Komplexe und Hydrate · von der Formel zum Namen', 'f2n', ['[Cu(NH3)4]SO4', 'K3[Fe(CN)6]', 'Na[Al(OH)4]', 'CuSO4·5H2O', 'O3']], ['Komplexe und Hydrate · vom Namen zur Formel', 'n2f', ['hexacianoferrato(III) de potasio', 'Calciumsulfat-Dihydrat', 'Thioschwefelsäure']]]) for (const t of ts) ej(g, m, t);
  return { resolver, ejemplos, todos, aceptadas, nombreEnunciado, leeFormula, norm, ft, fh, ionH, porFormula: () => { indice(); return porFormula; }, porNombre: () => { indice(); return porNombre; } };
})();

