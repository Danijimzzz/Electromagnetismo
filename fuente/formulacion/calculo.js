/* =====================================================================
   Formulación inorgánica: el cálculo (sin DOM). Genera de una vez todos los
   compuestos que sabe nombrar (óxidos, peróxidos, hidruros, hidróxidos,
   hidrácidos, oxoácidos, sales binarias, oxisales, sales ácidas y los
   compuestos binarios entre no metales) y los indexa por fórmula y por cada
   nombre posible. Así «nombre → fórmula» y «fórmula → nombre» son una
   búsqueda, y el desarrollo sale del mismo compuesto: catión (o elemento
   menos electronegativo) + anión, cargas cruzadas y simplificadas.
   Tres nomenclaturas: sistemática (prefijos numerales), de Stock (estado de
   oxidación en romanos) y tradicional (-oso/-ico, -ito/-ato, hipo-/per-).
     resolver(sc)  sc = { modo: 'f2n' | 'n2f', texto } → { c, lineas, pasos, … };
                   lanza un Error (con .sugerencias) si no lo reconoce
     ejemplos      [{ clave, grupo, nombre, sc }] para el desplegable y Mis ejercicios
     todos()       todos los compuestos (para las pruebas y el modo práctica)
     aceptadas(c, modo)  respuestas válidas en el modo práctica
   La interfaz está en app.js y la prueba en pruebas/herramientas/formulacion.js.
   ===================================================================== */
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

  /* ---------- Datos ---------- */
  // símbolo, nombre, estados de oxidación (sales), solo en óxidos, nombre tradicional por estado, común (modo práctica)
  const METALES = [
    ['Li', 'litio', [1], [], {}, 1], ['Na', 'sodio', [1], [], {}, 1], ['K', 'potasio', [1], [], {}, 1], ['Rb', 'rubidio', [1]], ['Cs', 'cesio', [1]], ['Ag', 'plata', [1], [], {}, 1],
    ['Be', 'berilio', [2]], ['Mg', 'magnesio', [2], [], {}, 1], ['Ca', 'calcio', [2], [], {}, 1], ['Sr', 'estroncio', [2]], ['Ba', 'bario', [2], [], {}, 1],
    ['Zn', 'zinc', [2], [], {}, 1], ['Cd', 'cadmio', [2]], ['Al', 'aluminio', [3], [], {}, 1],
    ['Cu', 'cobre', [1, 2], [], { 1: 'cuproso', 2: 'cúprico' }, 1], ['Hg', 'mercurio', [1, 2], [], { 1: 'mercurioso', 2: 'mercúrico' }, 1],
    ['Au', 'oro', [1, 3], [], { 1: 'auroso', 3: 'áurico' }, 1], ['Fe', 'hierro', [2, 3], [], { 2: 'ferroso', 3: 'férrico' }, 1],
    ['Co', 'cobalto', [2, 3], [], { 2: 'cobaltoso', 3: 'cobáltico' }, 1], ['Ni', 'níquel', [2, 3], [], { 2: 'niqueloso', 3: 'niquélico' }, 1],
    ['Sn', 'estaño', [2, 4], [], { 2: 'estannoso', 4: 'estánnico' }, 1], ['Pb', 'plomo', [2, 4], [], { 2: 'plumboso', 4: 'plúmbico' }, 1],
    ['Pt', 'platino', [2, 4], [], { 2: 'platinoso', 4: 'platínico' }],
    ['Cr', 'cromo', [2, 3], [6], { 2: 'cromoso', 3: 'crómico' }, 1], ['Mn', 'manganeso', [2, 3], [4, 7], { 2: 'manganoso', 3: 'mangánico' }, 1],
    ['Ti', 'titanio', [3, 4]], ['Bi', 'bismuto', [3]],
  ];
  const PEROXIDOS = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Mg', 'Ca', 'Sr', 'Ba', 'Zn', 'Cd', 'Cu', 'Ag'];
  // no metales como elemento menos electronegativo: símbolo, nombre, con O, con F, con Cl/Br/I, con S, común
  const NOMETALES = [
    ['N', 'nitrógeno', [1, 2, 3, 4, 5], [3], [3], [], 1], ['P', 'fósforo', [3, 5], [3, 5], [3, 5], [3, 5], 1], ['As', 'arsénico', [3, 5], [3, 5], [3, 5], [3, 5]], ['Sb', 'antimonio', [3, 5], [3, 5], [3, 5], [3, 5]],
    ['C', 'carbono', [2, 4], [4], [4], [4], 1], ['Si', 'silicio', [4], [4], [4], [4], 1], ['B', 'boro', [3], [3], [3], [3], 1],
    ['S', 'azufre', [4, 6], [4, 6], [2], [], 1], ['Se', 'selenio', [4, 6], [4, 6], [4], []], ['Te', 'telurio', [4, 6], [4, 6], [4], []],
    ['Cl', 'cloro', [1, 3, 5, 7], [1, 3, 5], [], [], 1], ['Br', 'bromo', [1, 3, 5, 7], [1, 3, 5], [], []], ['I', 'yodo', [1, 3, 5, 7], [1, 3, 5, 7], [], []],
  ];
  // aniones monoatómicos: símbolo, nombre, carga, hidrácido, común
  const MONO = [
    ['F', 'fluoruro', 1, 'fluorhídrico', 1], ['Cl', 'cloruro', 1, 'clorhídrico', 1], ['Br', 'bromuro', 1, 'bromhídrico', 1], ['I', 'yoduro', 1, 'yodhídrico', 1],
    ['S', 'sulfuro', 2, 'sulfhídrico', 1], ['Se', 'seleniuro', 2, 'selenhídrico'], ['Te', 'telururo', 2, 'telurhídrico'],
    ['N', 'nitruro', 3], ['P', 'fosfuro', 3], ['As', 'arseniuro', 3], ['C', 'carburo', 4], ['Si', 'siliciuro', 4], ['B', 'boruro', 3],
  ];
  // oxoácidos: centro, estado de oxidación, nº de O, nº de H, átomos del centro, ácido (tradicional), anión (tradicional), común
  const OXO = [
    ['Cl', 1, 1, 1, 1, 'hipocloroso', 'hipoclorito', 1], ['Cl', 3, 2, 1, 1, 'cloroso', 'clorito', 1], ['Cl', 5, 3, 1, 1, 'clórico', 'clorato', 1], ['Cl', 7, 4, 1, 1, 'perclórico', 'perclorato', 1],
    ['Br', 1, 1, 1, 1, 'hipobromoso', 'hipobromito'], ['Br', 3, 2, 1, 1, 'bromoso', 'bromito'], ['Br', 5, 3, 1, 1, 'brómico', 'bromato'], ['Br', 7, 4, 1, 1, 'perbrómico', 'perbromato'],
    ['I', 1, 1, 1, 1, 'hipoyodoso', 'hipoyodito'], ['I', 3, 2, 1, 1, 'yodoso', 'yodito'], ['I', 5, 3, 1, 1, 'yódico', 'yodato'], ['I', 7, 4, 1, 1, 'peryódico', 'peryodato'],
    ['S', 4, 3, 2, 1, 'sulfuroso', 'sulfito', 1], ['S', 6, 4, 2, 1, 'sulfúrico', 'sulfato', 1],
    ['Se', 4, 3, 2, 1, 'selenioso', 'selenito'], ['Se', 6, 4, 2, 1, 'selénico', 'selenato'], ['Te', 4, 3, 2, 1, 'teluroso', 'telurito'], ['Te', 6, 4, 2, 1, 'telúrico', 'telurato'],
    ['N', 3, 2, 1, 1, 'nitroso', 'nitrito', 1], ['N', 5, 3, 1, 1, 'nítrico', 'nitrato', 1],
    ['P', 3, 3, 3, 1, 'fosforoso', 'fosfito'], ['P', 5, 4, 3, 1, 'fosfórico', 'fosfato', 1],
    ['As', 3, 3, 3, 1, 'arsenioso', 'arsenito'], ['As', 5, 4, 3, 1, 'arsénico', 'arseniato'],
    ['C', 4, 3, 2, 1, 'carbónico', 'carbonato', 1], ['Si', 4, 3, 2, 1, 'silícico', 'silicato'], ['B', 3, 3, 3, 1, 'bórico', 'borato'],
    ['Cr', 6, 4, 2, 1, 'crómico', 'cromato', 1], ['Cr', 6, 7, 2, 2, 'dicrómico', 'dicromato', 1],
    ['Mn', 7, 4, 1, 1, 'permangánico', 'permanganato', 1],
    ['P', 5, 7, 4, 2, 'difosfórico', 'difosfato'], ['S', 6, 7, 2, 2, 'disulfúrico', 'disulfato'],
    ['Si', 4, 4, 4, 1, 'ortosilícico', 'ortosilicato'], ['B', 3, 2, 1, 1, 'metabórico', 'metaborato'],
  ];
  // nombres alternativos (meta, orto, piro…) de compuestos que ya salen de las tablas
  const ALIAS_EXTRA = [['H2SiO3', ['ácido metasilícico']], ['Na2SiO3', ['metasilicato de sodio']], ['H3BO3', ['ácido ortobórico']], ['H3PO4', ['ácido ortofosfórico']], ['H4P2O7', ['ácido pirofosfórico']], ['H2S2O7', ['ácido pirosulfúrico']], ['Na2S2O7', ['pirosulfato de sodio']], ['Na4P2O7', ['pirofosfato de sodio']], ['H2O2', ['agua oxigenada']], ['NH3', ['azano']]];
  const ATO = { Cl: 'clorato', Br: 'bromato', I: 'yodato', S: 'sulfato', Se: 'selenato', Te: 'telurato', N: 'nitrato', P: 'fosfato', As: 'arsenato', C: 'carbonato', Si: 'silicato', B: 'borato', Cr: 'cromato', Mn: 'manganato' };
  const ICO = { Cl: 'clórico', Br: 'brómico', I: 'yódico', S: 'sulfúrico', Se: 'selénico', Te: 'telúrico', N: 'nítrico', P: 'fosfórico', As: 'arsénico', C: 'carbónico', Si: 'silícico', B: 'bórico', Cr: 'crómico', Mn: 'mangánico' };
  // hidruros y otros compuestos con nombre propio: fórmula, tipo, nombres [etiqueta, nombre]
  const ESPECIALES = [
    ['H2O', 'Agua', [['Sistemática', 'óxido de dihidrógeno'], ['Nombre común', 'agua']], 1],
    ['NH3', 'Hidruro no metálico', [['Sistemática', 'trihidruro de nitrógeno'], ['IUPAC (hidruros)', 'azano'], ['Nombre común', 'amoniaco']], 1],
    ['PH3', 'Hidruro no metálico', [['Sistemática', 'trihidruro de fósforo'], ['IUPAC (hidruros)', 'fosfano'], ['Nombre común', 'fosfina']]],
    ['AsH3', 'Hidruro no metálico', [['Sistemática', 'trihidruro de arsénico'], ['IUPAC (hidruros)', 'arsano'], ['Nombre común', 'arsina']]],
    ['SbH3', 'Hidruro no metálico', [['Sistemática', 'trihidruro de antimonio'], ['IUPAC (hidruros)', 'estibano'], ['Nombre común', 'estibina']]],
    ['CH4', 'Hidruro no metálico', [['Sistemática', 'tetrahidruro de carbono'], ['IUPAC (hidruros)', 'metano']], 1],
    ['SiH4', 'Hidruro no metálico', [['Sistemática', 'tetrahidruro de silicio'], ['IUPAC (hidruros)', 'silano']], 1],
    ['BH3', 'Hidruro no metálico', [['Sistemática', 'trihidruro de boro'], ['IUPAC (hidruros)', 'borano']]],
    ['H2MnO4', 'Oxoácido', [['Tradicional', 'ácido mangánico'], ['Sistemática', 'tetraoxidomanganato de dihidrógeno']]], ['K2MnO4', 'Oxisal', [['Tradicional', 'manganato de potasio'], ['Sistemática', 'tetraoxidomanganato de dipotasio']]], ['Na2MnO4', 'Oxisal', [['Tradicional', 'manganato de sodio']]],
    ['HPO3', 'Oxoácido', [['Tradicional', 'ácido metafosfórico'], ['Sistemática', 'trioxidofosfato de hidrógeno']]],
    // elementos con nombre propio
    ['O3', 'Elemento', [['Sistemática', 'trioxígeno'], ['Nombre común', 'ozono']], 1], ['O2', 'Elemento', [['Sistemática', 'dioxígeno'], ['Nombre común', 'oxígeno']], 1], ['H2', 'Elemento', [['Sistemática', 'dihidrógeno'], ['Nombre común', 'hidrógeno']], 1],
    ['N2', 'Elemento', [['Sistemática', 'dinitrógeno'], ['Nombre común', 'nitrógeno']], 1], ['F2', 'Elemento', [['Sistemática', 'diflúor'], ['Nombre común', 'flúor']]], ['Cl2', 'Elemento', [['Sistemática', 'dicloro'], ['Nombre común', 'cloro']], 1],
    ['Br2', 'Elemento', [['Sistemática', 'dibromo'], ['Nombre común', 'bromo']]], ['I2', 'Elemento', [['Sistemática', 'diyodo'], ['Nombre común', 'yodo']]], ['P4', 'Elemento', [['Sistemática', 'tetrafósforo'], ['Nombre común', 'fósforo blanco']]], ['S8', 'Elemento', [['Sistemática', 'octaazufre'], ['Nombre común', 'azufre']]],
    // oxoácidos y sales con nombre propio
    ['H3PO2', 'Oxoácido', [['Tradicional', 'ácido hipofosforoso'], ['IUPAC', 'ácido fosfínico']]],
    ['H2S2O3', 'Tioácido', [['Tradicional', 'ácido tiosulfúrico'], ['Sistemática', 'trioxidosulfidosulfato de dihidrógeno']]], ['Na2S2O3', 'Tiosulfato', [['Tradicional', 'tiosulfato de sodio'], ['Sistemática', 'trioxidosulfidosulfato de disodio']]], ['K2S2O3', 'Tiosulfato', [['Tradicional', 'tiosulfato de potasio']]],
    ['HSCN', 'Tioácido', [['Tradicional', 'ácido tiociánico'], ['IUPAC', 'tiocianato de hidrógeno']]], ['KSCN', 'Tiocianato', [['Tradicional', 'tiocianato de potasio']]], ['NaSCN', 'Tiocianato', [['Tradicional', 'tiocianato de sodio']]], ['NH4SCN', 'Tiocianato', [['Tradicional', 'tiocianato de amonio']]],
    ['H2SO5', 'Peroxoácido', [['Tradicional', 'ácido peroxosulfúrico'], ['Sistemática', 'peroxidotrioxidosulfato de dihidrógeno']]], ['H2S2O8', 'Peroxoácido', [['Tradicional', 'ácido peroxodisulfúrico']]], ['HNO4', 'Peroxoácido', [['Tradicional', 'ácido peroxonítrico']]],
    ['K2S2O8', 'Peroxosal', [['Tradicional', 'peroxodisulfato de potasio']]], ['Na2S2O8', 'Peroxosal', [['Tradicional', 'peroxodisulfato de sodio']]], ['(NH4)2S2O8', 'Peroxosal', [['Tradicional', 'peroxodisulfato de amonio']]],
    ['CaC2', 'Carburo', [['Tradicional', 'carburo de calcio'], ['Sistemática', 'dicarburo de calcio'], ['IUPAC', 'acetiluro de calcio']]],
    // sales dobles
    ['KAl(SO4)2', 'Sal doble', [['Tradicional', 'sulfato de aluminio y potasio'], ['Sistemática', 'bis(tetraoxidosulfato) de aluminio y potasio']]], ['NaKCO3', 'Sal doble', [['Tradicional', 'carbonato de potasio y sodio']]],
    ['CaMg(CO3)2', 'Sal doble', [['Tradicional', 'carbonato de calcio y magnesio']]], ['MgNH4PO4', 'Sal doble', [['Tradicional', 'fosfato de amonio y magnesio']]], ['KNaSO4', 'Sal doble', [['Tradicional', 'sulfato de potasio y sodio']]],
  ];

  /* ---------- Fórmulas ---------- */
  // «Fe2(SO4)3» → { Fe: 2, S: 3, O: 12 }
  function leeFormula(texto) {
    const s = String(texto ?? '').replace(/\s+/g, '').replace(/[₀-₉]/g, (c) => SUBS.indexOf(c)).replace(/[[{]/g, '(').replace(/[\]}]/g, ')');
    if (!s) throw new Error('Escribe una fórmula, por ejemplo Fe2O3 o H2SO4.');
    let i = 0;
    const numero = () => { let t = ''; while (/\d/.test(s[i] || '')) t += s[i++]; return t ? +t : 1; };
    function grupo(dentro) {
      const c = {};
      const suma = (g, k) => { for (const e in g) c[e] = (c[e] || 0) + g[e] * k; };
      while (i < s.length) {
        const ch = s[i];
        if (ch === '(') { i++; const g = grupo(true); suma(g, numero()); }
        else if (ch === ')') { if (!dentro) throw new Error('Hay un paréntesis de cierre sin abrir.'); i++; return c; }
        else if (/[A-Z]/.test(ch)) {
          let sim = ch; i++;
          if (/[a-z]/.test(s[i] || '')) sim += s[i++];
          if (!SIMBOLOS.has(sim)) throw new Error(`«${sim}» no es el símbolo de ningún elemento. Los símbolos llevan la primera letra en mayúscula y la segunda en minúscula (Co es cobalto, CO es monóxido de carbono).`);
          suma({ [sim]: 1 }, numero());
        } else throw new Error(`No entiendo el carácter «${ch}» de la fórmula. Usa símbolos de elementos, números y paréntesis.`);
      }
      if (dentro) throw new Error('Falta cerrar un paréntesis.');
      return c;
    }
    const r = grupo(false);
    if (!Object.keys(r).length) throw new Error('Escribe una fórmula, por ejemplo Fe2O3 o H2SO4.');
    return r;
  }
  const claveCuenta = (c) => Object.keys(c).sort().map((e) => e + c[e]).join('');

  /* ---------- Iones ---------- */
  const cationes = [], aniones = [];
  for (const [sim, nombre, vs, ox = [], trad = {}, comun] of METALES) {
    const multi = vs.length + ox.length > 1;
    for (const v of vs) cationes.push({ cl: 'm', f: sim, nombre, v, multi, trad: trad[v] || null, comun: !!comun, peroxido: PEROXIDOS.includes(sim) });
    for (const v of ox) cationes.push({ cl: 'm', f: sim, nombre, v, multi, trad: trad[v] || null, comun: !!comun, soloOxido: true });
  }
  const CAT_NH4 = { cl: 'am', f: 'NH4', poli: true, nombre: 'amonio', v: 1, multi: false, trad: null, comun: true };
  const CAT_H = { cl: 'h', f: 'H', nombre: 'hidrógeno', v: 1, multi: false, trad: null, comun: true };

  for (const [sim, base, w, hidra, comun] of MONO) aniones.push({ cl: 'mono', f: sim, w, base, hidra, comun: !!comun, hidracido: !!hidra });
  const AN_O = { cl: 'mono', f: 'O', w: 2, base: 'óxido', comun: true, esO: true }, AN_H = { cl: 'mono', f: 'H', w: 1, base: 'hidruro', comun: true, esH: true };
  const AN_OH = { cl: 'mono', f: 'OH', w: 1, base: 'hidróxido', poli: true, comun: true, esOH: true }, AN_O2 = { cl: 'per', f: 'O2', w: 2, poli: true, comun: true };
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

  /* ---------- Nombres ---------- */
  // líneas de nombre [{ et, nombre, regla, nota }] y alias que también se reconocen
  function nombres(cat, n, an, m) {
    const L = [], alias = [];
    const ca = (k) => pre(k) + cat.nombre; // dihierro
    const stockCat = cat.nombre + (cat.multi ? `(${ROM[cat.v]})` : '');
    const uno = (et, nombre, regla, nota) => { if (nombre) L.push({ et, nombre, regla, nota }); };
    const RS = 'Los prefijos numerales (mono-, di-, tri-, tetra-, penta-, hexa-, hepta-…) dicen cuántos átomos o grupos hay de cada uno.';
    if (cat.cl === 'h' && an.cl === 'oxo') {
      uno('Sistemática', `${an.sist} de ${ca(n)}`, `${RS} Los oxígenos se nombran como «${pOxido(an.nO)}», el elemento central termina en -ato y, como es un ácido, el catión es el hidrógeno${n > 1 ? ' (' + PREF[n] + 'hidrógeno por los ' + n + ' átomos)' : ''}.`);
      uno('Stock', `ácido ${an.acidoStock}`, `Se escribe «ácido», los prefijos de oxígenos con «oxo», la raíz del elemento central con -ico y su estado de oxidación en romanos: ${ROM[an.v]}.`);
      uno('Tradicional', `ácido ${an.acidoTrad}`, tradOxoRegla(an));
      alias.push(`${an.stockSal} de hidrógeno`);
    } else if (cat.cl === 'h' && an.cl === 'mono') {
      uno('Sistemática', `${pre(m)}${an.base} de ${ca(n)}`, `Se nombra el anión con -uro y luego «de hidrógeno»${n > 1 ? ', con el prefijo ' + PREF[n] + '- por los ' + n + ' hidrógenos' : ''}.`);
      uno('Stock', `${an.base} de hidrógeno`, 'El hidrógeno siempre actúa con +1: no hace falta indicar su estado de oxidación.');
      uno('Tradicional', `ácido ${an.hidra}`, 'En disolución acuosa se llama «ácido» + raíz del elemento + «-hídrico».', 'en disolución acuosa');
    } else if (cat.cl === 'h' && an.cl === 'per') {
      uno('Sistemática', `${PREF[2 * m]}óxido de ${ca(n)}`, `${RS} Son ${2 * m} oxígenos y ${n} hidrógenos.`);
      uno('Stock', 'peróxido de hidrógeno', 'El grupo O₂²⁻ se llama peróxido.');
      uno('Nombre común', 'agua oxigenada', null, 'en disolución');
    } else if (cat.cl === 'nm') {
      const anh = an.esO ? OXO.find((o) => o[0] === cat.f && o[1] === cat.v && o[4] === 1) : null;
      uno('Sistemática', `${PREF[m]}${an.base} de ${ca(n)}`, `${RS} Aquí ${PREF[m]}- para el ${an.base.replace('uro', 'uro')} (${m} átomos)${n > 1 ? ' y ' + PREF[n] + '- para el ' + cat.nombre + ' (' + n + ' átomos)' : ' y ninguno para el ' + cat.nombre + ' (solo hay uno)'}.`);
      uno('Stock', `${an.base} de ${stockCat}`, `Se pone entre paréntesis, en romanos, el estado de oxidación del ${cat.nombre}: ${ROM[cat.v]}${cat.multi ? '' : ' (aquí solo tiene uno y se puede omitir)'}.`);
      if (anh) uno('Tradicional', `anhídrido ${anh[5]}`, `Los óxidos de los no metales se llamaban «anhídridos» (del ácido ${anh[5]}).`);
      alias.push(...L.filter((l) => l.et === 'Sistemática').flatMap((l) => (m === 1 && n === 1 ? [l.nombre.replace(/^mono/, '')] : [])));
    } else if (an.cl === 'per') {
      uno('Sistemática', `${PREF[2 * m]}óxido de ${ca(n)}`, `${RS} Hay ${2 * m} átomos de oxígeno (${m} grupo${m > 1 ? 's' : ''} O₂)${n > 1 ? ' y ' + n + ' de ' + cat.nombre : ''}.`);
      uno('Stock', `peróxido de ${stockCat}`, `El grupo O₂²⁻ se llama peróxido${cat.multi ? '; el estado de oxidación del ' + cat.nombre + ' va en romanos' : ''}.`);
      uno('Tradicional', cat.trad ? `peróxido ${cat.trad}` : cat.multi ? null : `peróxido de ${cat.nombre}`, cat.trad ? tradMetalRegla(cat) : 'Con un solo estado de oxidación basta «peróxido de …».');
    } else if (an.cl === 'mono') {
      const monoEn = cat.multi || cat.cl === 'nm';
      const grupo = an.grupo ? (m > 1 ? `${PREFG[m]}(${an.base})` : an.base) : pre(m, monoEn) + an.base;
      uno('Sistemática', `${grupo} de ${ca(n)}`, `${RS}${an.grupo ? ' Con grupos de varios átomos se usan bis-, tris-… y paréntesis.' : ''} ${prefijosTxt(cat, n, an, m, monoEn)}`);
      uno('Stock', `${an.base} de ${stockCat}`, stockRegla(cat));
      uno('Tradicional', cat.trad ? `${an.base} ${cat.trad}` : cat.multi ? null : `${an.base} de ${cat.nombre}`, cat.trad ? tradMetalRegla(cat) : 'Con un solo estado de oxidación basta «' + an.base + ' de …».');
      if (!an.grupo) alias.push(`${PREF[m]}${an.base} de ${ca(n)}`, `${pre(m)}${an.base} de ${ca(n)}`);
      if (an.esO && m >= 4) alias.push(`${PREF[m].slice(0, -1)}óxido de ${ca(n)}`);
    } else if (an.cl === 'oxo') {
      const w = m > 1 ? `${PREFG[m]}(${an.sist})` : an.sist;
      uno('Sistemática', `${w} de ${ca(n)}`, `${RS} ${m > 1 ? `El anión se repite ${m} veces y va entre paréntesis con ${PREFG[m]}-. ` : ''}Los oxígenos se nombran como «${pOxido(an.nO)}»${an.j ? ' y los hidrógenos del anión con «hidrogeno»' : ''}, y el elemento central termina en -ato.`);
      uno('Stock', `${an.stock} de ${stockCat}`, `Los oxígenos con «${pOxo(an.nO)}», el central con -ato y su estado de oxidación entre paréntesis (${ROM[an.v]}); además el del ${cat.nombre === 'amonio' ? 'amonio' : 'metal'}${cat.multi ? ' (' + ROM[cat.v] + ')' : ''}.`);
      uno('Tradicional', `${an.trad} de ${stockCat}`, tradOxoRegla(an, true));
      if (cat.trad) L[L.length - 1].otros = [`${an.trad} ${cat.trad}`];
    }
    const mo = (t) => (t && t.replace ? t.replace(/monoóxido/g, 'monóxido') : t);
    for (const l of L) l.nombre = mo(l.nombre);
    return { L, alias: alias.map(mo) };
  }
  const prefijosTxt = (cat, n, an, m, monoEn) => `Aquí: ${m === 1 && !monoEn ? 'un solo ' + an.base + ' (mono- se omite)' : PREF[m] + '- para el ' + an.base}${n > 1 ? ' y ' + PREF[n] + '- para el ' + cat.nombre : ''}.`;
  const stockRegla = (cat) => (cat.multi ? `El ${cat.nombre} tiene varios estados de oxidación: se indica el que usa aquí entre paréntesis, en números romanos (${ROM[cat.v]}).` : `El ${cat.nombre} solo actúa con +${cat.v}: no hace falta número romano.`);
  const tradMetalRegla = (cat) => `En la nomenclatura tradicional el metal con dos estados de oxidación lleva la terminación -oso (el menor) o -ico (el mayor): con +${cat.v} es «${cat.trad}».`;
  function tradOxoRegla(an, sal) {
    const t = sal ? an.tAn : an.acidoTrad;
    const sufijo = sal ? (/ito$/.test(t) ? '-ito (estado de oxidación menor)' : '-ato (estado de oxidación mayor)') : (/oso$/.test(t) ? '-oso (estado de oxidación menor)' : '-ico (estado de oxidación mayor)');
    const pf = /^hipo/.test(t) ? ', con hipo- (el estado más bajo de los cuatro)' : /^per/.test(t) ? ', con per- (el estado más alto de los cuatro)' : '';
    return `El elemento central (${an.centro}) actúa con +${an.v}: ${sal ? 'el anión' : 'el ácido'} termina en ${sufijo}${pf}.${sal && an.j ? ' Los hidrógenos que conserva se indican con «hidrogeno» delante.' : ''}`;
  }

  /* ---------- Compuestos ---------- */
  const compuestos = [];
  function tipoDe(cat, an) {
    if (cat.cl === 'h') return an.cl === 'oxo' ? 'Oxoácido' : an.cl === 'per' ? 'Peróxido' : 'Hidrácido';
    if (an.cl === 'per') return 'Peróxido';
    if (an.esOH) return 'Hidróxido';
    if (an.esO) return cat.cl === 'nm' ? 'Óxido no metálico' : 'Óxido';
    if (an.esH) return 'Hidruro metálico';
    if (an.cl === 'oxo') return an.j ? 'Sal ácida' : 'Oxisal';
    if (an.hs) return 'Sal ácida';
    return cat.cl === 'nm' ? 'Compuesto binario no metálico' : 'Sal binaria';
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
  // 1. óxidos (metálicos y no metálicos) y peróxidos
  for (const c of cationes) crea(c, AN_O);
  for (const [sim, , vO, , , , comun] of NOMETALES) {
    const multi = unicos(sim).length > 1, nombre = NOMETALES.find((x) => x[0] === sim)[1];
    for (const v of vO) crea({ cl: 'nm', f: sim, nombre, v, multi, comun: !!comun }, AN_O);
  }
  function unicos(sim) { const f = NOMETALES.find((x) => x[0] === sim); return [...new Set([...f[2], ...f[3], ...f[4], ...f[5]])]; }
  for (const c of cationes) if (c.peroxido) crea(c, AN_O2);
  crea(CAT_H, AN_O2);
  // 2. hidróxidos e hidruros
  for (const c of cationes) if (metalesComb(c)) crea(c, AN_OH);
  crea(CAT_NH4, AN_OH);
  for (const c of cationes) if (metalesComb(c)) crea(c, AN_H);
  // 3. ácidos: hidrácidos y oxoácidos
  for (const an of aniones) if ((an.cl === 'mono' && an.hidracido) || (an.cl === 'oxo' && an.j === 0)) crea(CAT_H, an);
  // 4. sales binarias, oxisales y sales ácidas de los metales y del amonio
  for (const c of cationes) {
    if (!metalesComb(c)) continue;
    for (const an of aniones) if ((an.cl === 'mono' && !an.esO && !an.esH && !an.esOH) || an.cl === 'oxo') crea(c, an);
  }
  for (const an of aniones) if ((an.cl === 'mono' && (an.hidracido || an.hs)) || an.cl === 'oxo') crea(CAT_NH4, an);
  // 5. compuestos binarios entre no metales
  for (const [sim, nombre, , vF, vR, vS, comun] of NOMETALES) {
    const multi = unicos(sim).length > 1, cat = (v) => ({ cl: 'nm', f: sim, nombre, v, multi, comun: !!comun });
    for (const [x, vs] of [['F', vF], ['Cl', vR], ['Br', vR], ['I', vR], ['S', vS]]) {
      const an = aniones.find((a) => a.cl === 'mono' && a.f === x);
      for (const v of vs) crea(cat(v), an);
    }
  }
  // 6. hidruros no metálicos y agua, con nombre propio
  for (const [formula, tipo, lin, comun] of ESPECIALES) {
    compuestos.push({ formula, tipo, esp: true, lineas: lin.map(([et, nombre]) => ({ et, nombre })), alias: [], comun: !!comun });
  }
  for (const [formula, al] of ALIAS_EXTRA) { const c = compuestos.find((x) => x.formula === formula); if (c) c.alias.push(...al); }
  // el tipo, el html y la cuenta de átomos de cada uno
  for (const c of compuestos) { c.html = fh(c.formula); c.texto = ft(c.formula); c.cuenta = leeFormula(c.formula); c.clave = claveCuenta(c.cuenta); }

  /* ---------- Índices ---------- */
  let porFormula = null, porNombre = null;
  function indice() {
    if (porFormula) return;
    porFormula = new Map(); porNombre = new Map();
    for (const c of compuestos) {
      if (!porFormula.has(c.clave)) porFormula.set(c.clave, []);
      porFormula.get(c.clave).push(c);
      for (const l of c.lineas) for (const nom of [l.nombre, ...(l.otros || [])]) añade(nom, c, l.et);
      for (const nom of c.alias) añade(nom, c, 'Sistemática');
    }
  }
  function añade(nombre, c, et) { const k = norm(nombre); if (!porNombre.has(k) || (c.esp && !porNombre.get(k).c.esp && c.formula === "CaC2")) porNombre.set(k, { c, et, nombre }); }
  const todos = () => compuestos;

  /* ---------- Desarrollo ---------- */
    const anionTxt = (an) => (an.cl === 'oxo' ? `ion ${an.trad} ${ionH(an.f, -an.w)}` : an.cl === 'per' ? `ion peróxido ${ionH('O2', -2)}` : `ion ${an.base} ${ionH(an.f, -an.w)}`);
  function tipoTxt(c) {
    const { cat, an } = c;
    switch (c.tipo) {
      case 'Óxido': return `Combina oxígeno con un metal (${cat.f}): es un <b>óxido</b>. El oxígeno actúa con −2 (ion óxido ${ionH('O', -2)}).`;
      case 'Óxido no metálico': return `Combina oxígeno con un no metal (${cat.f}): es un <b>óxido no metálico</b>. Se escribe primero el menos electronegativo y el oxígeno actúa con −2.`;
      case 'Peróxido': return `Contiene el grupo ${ionH('O2', -2)} (dos oxígenos unidos, cada uno con −1): es un <b>peróxido</b>.`;
      case 'Hidruro metálico': return `Combina hidrógeno con un metal (${cat.f}): es un <b>hidruro</b>. Aquí el hidrógeno actúa con −1 (ion hidruro ${ionH('H', -1)}).`;
      case 'Hidróxido': return `Contiene el grupo ${ionH('OH', -1)} unido a ${cat.cl === 'am' ? 'el ion amonio' : 'un metal (' + cat.f + ')'}: es un <b>hidróxido</b>.`;
      case 'Hidrácido': return `Hidrógeno con un halógeno o con S, Se, Te: se nombra con la terminación -uro (en disolución acuosa es un <b>hidrácido</b>). El hidrógeno actúa con +1.`;
      case 'Oxoácido': return `Empieza por hidrógeno y tiene un grupo con oxígeno (${fh(an.f)}, el ${an.trad}): es un <b>oxoácido</b>. El hidrógeno actúa con +1.`;
      case 'Sal binaria': return `Combina un ${cat.cl === 'am' ? 'ion amonio' : 'metal (' + cat.f + ')'} con un no metal sin oxígeno (${an.f}): es una <b>sal binaria</b> y el no metal lleva la terminación -uro.`;
      case 'Compuesto binario no metálico': return `Combina dos no metales (${cat.f} y ${an.f}); el menos electronegativo va primero y el otro termina en -uro.`;
      case 'Oxisal': return `Un ${cat.cl === 'am' ? 'ion amonio' : 'metal (' + cat.f + ')'} unido a un grupo con oxígeno (${fh(an.f)}, el ${an.trad}): es una <b>oxisal</b>, la sal de un oxoácido.`;
      case 'Sal ácida': return `Un ${cat.cl === 'am' ? 'ion amonio' : 'metal (' + cat.f + ')'} unido a un anión que conserva ${an.j || 1} hidrógeno${(an.j || 1) > 1 ? 's' : ''} del ácido (${fh(an.f)}): es una <b>sal ácida</b> y el nombre empieza por «hidrogeno».`;
      default: return '';
    }
  }
  function oxTxt(c) {
    const { cat, an, n, m } = c, tot = m * an.w;
    const el = cat.cl === 'h' ? 'hidrógeno' : cat.nombre;
    const sumas = `${n > 1 ? n : ''}x ${m > 1 || an.w > 1 ? '+ ' + (m > 1 ? m + '·' : '') + '(−' + an.w + ')' : '+ (−1)'}`;
    const quien = anionTxt(an);
    return `El anión es el ${quien}, de carga ${an.w}−${m > 1 ? `; hay ${m}, en total ${tot}−` : ''}. Para que el compuesto sea neutro, ${n > 1 ? `los ${n} átomos de ${el}` : `el ${el}`} tienen que aportar +${tot}: $${sumas} = 0 ⇒ x = +${cat.v}$. ${cat.cl === 'h' ? '' : cat.multi ? `El ${cat.nombre} puede actuar con varios estados de oxidación; aquí lo hace con +${cat.v}.` : `El ${cat.nombre} solo actúa con +${cat.v}.`}`;
  }
  function pasosFN(c) {
    if (c.esp) {
      return [{ t: 'Reconoce el compuesto', html: `${c.html} es ${c.tipo === 'Agua' ? 'el <b>agua</b>' : c.tipo === 'Hidruro no metálico' ? 'un <b>hidruro no metálico</b>: de los hidruros del grupo 13–15 se usan sobre todo los nombres comunes y los de la IUPAC' : `un compuesto de tipo <b>${c.tipo.toLowerCase()}</b> que tiene su propio nombre y no sale de las reglas generales`}. Se escribe $${c.formula.replace(/\d+/g, (d) => '_{' + d + '}')}$ y los nombres de la lista son los de uso habitual.` },
        { t: 'Nombres', html: c.lineas.map((l) => `${l.et}: <b>${l.nombre}</b>`).join('<br>') }];
    }
    const p = [{ t: 'Reconoce el tipo de compuesto', html: tipoTxt(c) }, { t: 'Calcula el estado de oxidación', html: oxTxt(c) }];
    for (const l of c.lineas) p.push({ t: `Nomenclatura ${l.et.toLowerCase().replace(/ · /g, ', ')}`, html: `${l.regla} → <b>${l.nombre}</b>${l.otros ? ` (también «${l.otros.join('», «')}»)` : ''}${l.nota ? ` <small>(${l.nota})</small>` : ''}` });
    return p;
  }
  function pasosNF(c, usada) {
    if (c.esp) return [{ t: 'Reconoce el nombre', html: `«${usada.nombre}» es un nombre ${c.tipo === 'Agua' ? 'del agua' : `de un compuesto de tipo ${c.tipo.toLowerCase()}`}: su fórmula es $${c.formula.replace(/\d+/g, (d) => '_{' + d + '}')}$.` }, { t: 'Escribe la fórmula', html: `Su fórmula es <b>${c.html}</b>.` }];
    const { cat, an, n, m, g } = c, sist = /Sistem/.test(usada.et);
    const p = [];
    p.push({ t: 'Interpreta el nombre', html: `«${usada.nombre}» está en nomenclatura ${usada.et.toLowerCase().replace(/ · /g, ', ')}. ${tipoTxt(c)}` });
    p.push({ t: 'Anota las cargas', html: `${cat.cl === 'nm' ? 'El' : 'El'} ${cat.nombre} actúa con +${cat.v}${cat.multi && !sist ? ` (el número romano ${ROM[cat.v]} o la terminación ${cat.trad ? '«' + cat.trad + '»' : ''} lo indican)` : ''}: ${ionH(cat.f, cat.v)}. El ${anionTxt(an)} tiene carga ${an.w}−.` });
    if (sist) p.push({ t: 'Lee los prefijos', html: `En la nomenclatura sistemática los prefijos dan los subíndices directamente: ${n} ${n > 1 ? 'átomos' : 'átomo'} de ${cat.nombre} y ${m} ${an.cl === 'oxo' || an.poli ? (m > 1 ? 'grupos' : 'grupo') : (m > 1 ? 'átomos' : 'átomo')} de ${an.cl === 'oxo' ? an.trad : an.f}.` });
    else p.push({ t: 'Cruza las cargas', html: `La carga del catión (${cat.v}) pasa al anión como subíndice y la del anión (${an.w}) pasa al catión: ${fh(cat.f)}<sub>${an.w}</sub> ${fh(an.f)}<sub>${cat.v}</sub>${g > 1 ? `. Como ${an.w} y ${cat.v} se pueden dividir entre ${g}, se simplifica y los subíndices quedan ${n} y ${m}` : ''}${n === 1 && m === 1 ? '. El subíndice 1 no se escribe' : ''}.` });
    p.push({ t: 'Escribe y comprueba la fórmula', html: `Primero el catión${cat.cl === 'nm' ? ' (el menos electronegativo)' : ''} y después el anión${an.poli && m > 1 ? '; el grupo ' + fh(an.f) + ' se repite y va entre paréntesis' : ''}: <b>${c.html}</b>. Comprobación: $${n}·(+${cat.v}) + ${m}·(−${an.w}) = 0$.` });
    return p;
  }

  /* ---------- Resolver ---------- */
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
  // hidratos: «CuSO4·5H2O» ↔ «sulfato de cobre(II) pentahidrato»
  function hidrato(base, n, usadaBase) {
    const r = base, pf = PREFH[n] || `${n}-`, c0 = r.c;
    const lineas = r.lineas.filter((l) => l.et !== 'Nombre común').map((l) => ({ ...l, nombre: `${l.nombre} ${pf}hidrato`, regla: `${l.regla || ''} El agua de cristalización se añade con el prefijo ${pf}- y la palabra «hidrato».` }));
    const formula = `${c0.formula}·${n === 1 ? '' : n}H2O`, html = `${c0.html}·${n === 1 ? '' : n}H<sub>2</sub>O`;
    const c = { ...c0, formula, html, texto: ft(c0.formula) + `·${n === 1 ? '' : n}H₂O`, tipo: 'Hidrato', lineas, alias: [], esp: true, hidrato: n };
    const pasos = [...r.pasos, { t: 'Agua de cristalización', html: `La fórmula acaba en <b>·${n === 1 ? '' : n}H<sub>2</sub>O</b>: por cada unidad de ${c0.html} hay ${n} molécula${n > 1 ? 's' : ''} de agua en el cristal. Se nombra el compuesto y se termina con <b>${pf}hidrato</b>.` }];
    return { modo: r.modo, c, formula, html, tipo: 'Hidrato', lineas, alt: [], pasos, usada: usadaBase || null };
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
    if (!texto) throw new Error(modo === 'f2n' ? 'Escribe una fórmula, por ejemplo Fe2O3, H2SO4 o Ca(OH)2.' : 'Escribe un nombre, por ejemplo «óxido de hierro(III)» o «ácido sulfúrico».');
    if (modo === 'f2n') {
      const cuenta = leeFormula(texto), cs = porFormula.get(claveCuenta(cuenta));
      if (!cs) {
        const els = Object.keys(cuenta), sug = compuestos.filter((c) => els.every((e) => e in c.cuenta) && Object.keys(c.cuenta).length === els.length).slice(0, 6).map((c) => ft(c.formula));
        throw errorConSug(`No reconozco «${texto}» entre los compuestos que sabe nombrar la herramienta (óxidos, peróxidos, hidruros, hidróxidos, ácidos, sales y compuestos binarios). Revisa los subíndices y las cargas: la suma tiene que ser cero.`, sug);
      }
      const c = cs[0];
      return { modo, c, formula: c.formula, html: c.html, tipo: c.tipo, lineas: c.lineas, alt: cs.slice(1), pasos: pasosFN(c), usada: null };
    }
    const k = norm(romanos(texto)), e = porNombre.get(k);
    if (!e) { let f = null; try { f = CompL.porNombre(k); } catch (err) { f = null; } if (f) return { ...resolver({ modo: 'f2n', texto: f }), modo, usada: { et: 'Libros de texto', nombre: texto } }; }
    if (!e) throw errorConSug(`No reconozco el nombre «${texto}». Revisa los acentos, los prefijos y el número romano entre paréntesis; por ejemplo «óxido de hierro(III)», «trióxido de dihierro» o «ácido nítrico».`, sugerenciasNombre(k));
    const c = e.c;
    return { modo, c, formula: c.formula, html: c.html, tipo: c.tipo, lineas: c.lineas, alt: [], pasos: pasosNF(c, e), usada: e };
  }

  /* ---------- Modo práctica ---------- */
  // respuestas válidas: todos los nombres (con y sin tilde, con y sin paréntesis) o la fórmula
  function aceptadas(c, modo) {
    if (modo === 'n2f') return [...new Set([c.formula, c.texto])];
    const base = [...c.lineas.flatMap((l) => [l.nombre, ...(l.otros || [])]), ...c.alias];
    const todas = new Set();
    for (const b of base) { todas.add(b); todas.add(sa(b)); todas.add(b.replace(/\(([IVX]+)\)/g, ' $1')); todas.add(sa(b).replace(/\(([IVX]+)\)/g, ' $1')); }
    return [...todas];
  }
  const nombreEnunciado = (c, i) => { const l = c.lineas.filter((x) => x.et !== 'Nombre común'); return l[i % l.length].nombre; };

  const ejemplos = [];
  const ej = (grupo, modo, texto, nombre) => ejemplos.push({ clave: `${modo}-${norm(texto)}`, grupo, nombre: nombre || (modo === 'f2n' ? `${ft(texto)}` : texto), sc: { modo, texto } });
  for (const [g, fs] of [['De fórmula a nombre · Óxidos e hidruros', ['Fe2O3', 'CO2', 'Na2O', 'H2O2', 'CaH2', 'NH3']], ['De fórmula a nombre · Hidróxidos y ácidos', ['Ca(OH)2', 'Fe(OH)3', 'HCl', 'H2S', 'H2SO4', 'HNO3', 'H3PO4', 'HClO4']], ['De fórmula a nombre · Sales', ['NaCl', 'FeCl3', 'Cu2S', 'PCl5', 'CaCO3', 'Al2(SO4)3', 'KMnO4', 'NaClO', 'NaHCO3', 'Ca(H2PO4)2', '(NH4)2SO4']]]) for (const f of fs) ej(g, 'f2n', f);
  for (const [g, ns] of [['De nombre a fórmula', ['óxido de hierro(III)', 'trióxido de dihierro', 'dióxido de carbono', 'hidróxido de aluminio', 'ácido sulfúrico', 'ácido clorhídrico', 'dicloruro de calcio', 'sulfato de aluminio', 'carbonato de calcio', 'nitrato de plata', 'hidrogenocarbonato de sodio', 'tetraoxosulfato(VI) de cobre(II)', 'sulfuro de hidrógeno', 'ácido perclórico']]]) for (const t of ns) ej(g, 'n2f', t);

  for (const [g, m, ts] of [['Complejos e hidratos · de fórmula a nombre', 'f2n', ['[Cu(NH3)4]SO4', 'K3[Fe(CN)6]', 'Na[Al(OH)4]', 'CuSO4·5H2O', 'O3']], ['Complejos e hidratos · de nombre a fórmula', 'n2f', ['hexacianoferrato(III) de potasio', 'sulfato de calcio dihidrato', 'ácido tiosulfúrico']]]) for (const t of ts) ej(g, m, t);
  return { resolver, ejemplos, todos, aceptadas, nombreEnunciado, leeFormula, norm, ft, fh, ionH, porFormula: () => { indice(); return porFormula; }, porNombre: () => { indice(); return porNombre; } };
})();
if (typeof module !== 'undefined') module.exports = Formulacion;
