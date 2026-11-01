/* Comprobación de formulacion: la nomenclatura calculada a mano en Node y la página en Chromium.
   node pruebas/comprobar.js --solo formulacion ejecuta solo esta. */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'formulacion', 'calculo.js'));
  {
    const antes = fallos;
    const nombres = (f) => { const r = C.resolver({ modo: 'f2n', texto: f }); return Object.fromEntries(r.c.lineas.flatMap((l) => l.et.split(' · ').map((e) => [e, l.nombre]))); };
    // fórmula → [sistemática, Stock, tradicional], escritas a mano
    const f2n = {
      Fe2O3: ['trióxido de dihierro', 'óxido de hierro(III)', 'óxido férrico'],
      FeO: ['monóxido de hierro', 'óxido de hierro(II)', 'óxido ferroso'],
      Cu2O: ['monóxido de dicobre', 'óxido de cobre(I)', 'óxido cuproso'],
      Na2O: ['óxido de disodio', 'óxido de sodio', 'óxido de sodio'],
      CO2: ['dióxido de carbono', 'óxido de carbono(IV)', 'anhídrido carbónico'],
      CO: ['monóxido de carbono', 'óxido de carbono(II)', null],
      N2O5: ['pentaóxido de dinitrógeno', 'óxido de nitrógeno(V)', 'anhídrido nítrico'],
      SO3: ['trióxido de azufre', 'óxido de azufre(VI)', 'anhídrido sulfúrico'],
      H2O2: ['dióxido de dihidrógeno', 'peróxido de hidrógeno', null],
      Na2O2: ['dióxido de disodio', 'peróxido de sodio', 'peróxido de sodio'],
      CaH2: ['dihidruro de calcio', 'hidruro de calcio', 'hidruro de calcio'],
      Ca: null,
      'Ca(OH)2': ['dihidróxido de calcio', 'hidróxido de calcio', 'hidróxido de calcio'],
      'Fe(OH)3': ['trihidróxido de hierro', 'hidróxido de hierro(III)', 'hidróxido férrico'],
      HCl: ['cloruro de hidrógeno', 'cloruro de hidrógeno', 'ácido clorhídrico'],
      H2S: ['sulfuro de dihidrógeno', 'sulfuro de hidrógeno', 'ácido sulfhídrico'],
      H2SO4: ['tetraoxidosulfato de dihidrógeno', 'ácido tetraoxosulfúrico(VI)', 'ácido sulfúrico'],
      H2SO3: ['trioxidosulfato de dihidrógeno', 'ácido trioxosulfúrico(IV)', 'ácido sulfuroso'],
      HNO3: ['trioxidonitrato de hidrógeno', 'ácido trioxonítrico(V)', 'ácido nítrico'],
      HNO2: ['dioxidonitrato de hidrógeno', 'ácido dioxonítrico(III)', 'ácido nitroso'],
      H3PO4: ['tetraoxidofosfato de trihidrógeno', 'ácido tetraoxofosfórico(V)', 'ácido fosfórico'],
      H2CO3: ['trioxidocarbonato de dihidrógeno', 'ácido trioxocarbónico(IV)', 'ácido carbónico'],
      HClO: ['oxidoclorato de hidrógeno', 'ácido oxoclórico(I)', 'ácido hipocloroso'],
      HClO2: ['dioxidoclorato de hidrógeno', 'ácido dioxoclórico(III)', 'ácido cloroso'],
      HClO3: ['trioxidoclorato de hidrógeno', 'ácido trioxoclórico(V)', 'ácido clórico'],
      HClO4: ['tetraoxidoclorato de hidrógeno', 'ácido tetraoxoclórico(VII)', 'ácido perclórico'],
      H2Cr2O7: ['heptaoxidodicromato de dihidrógeno', 'ácido heptaoxodicrómico(VI)', 'ácido dicrómico'],
      NaCl: ['cloruro de sodio', 'cloruro de sodio', 'cloruro de sodio'],
      CaCl2: ['dicloruro de calcio', 'cloruro de calcio', 'cloruro de calcio'],
      FeCl3: ['tricloruro de hierro', 'cloruro de hierro(III)', 'cloruro férrico'],
      Fe2S3: ['trisulfuro de dihierro', 'sulfuro de hierro(III)', 'sulfuro férrico'],
      PCl5: ['pentacloruro de fósforo', 'cloruro de fósforo(V)', null],
      CCl4: ['tetracloruro de carbono', 'cloruro de carbono(IV)', null],
      CaCO3: ['trioxidocarbonato de calcio', 'trioxocarbonato(IV) de calcio', 'carbonato de calcio'],
      'Al2(SO4)3': ['tris(tetraoxidosulfato) de dialuminio', 'tetraoxosulfato(VI) de aluminio', 'sulfato de aluminio'],
      'Fe2(SO4)3': ['tris(tetraoxidosulfato) de dihierro', 'tetraoxosulfato(VI) de hierro(III)', 'sulfato de hierro(III)'],
      KMnO4: ['tetraoxidomanganato de potasio', 'tetraoxomanganato(VII) de potasio', 'permanganato de potasio'],
      K2Cr2O7: ['heptaoxidodicromato de dipotasio', 'heptaoxodicromato(VI) de potasio', 'dicromato de potasio'],
      NaClO: ['oxidoclorato de sodio', 'oxoclorato(I) de sodio', 'hipoclorito de sodio'],
      '(NH4)2SO4': ['tetraoxidosulfato de diamonio', 'tetraoxosulfato(VI) de amonio', 'sulfato de amonio'],
      NaHCO3: ['hidrogenotrioxidocarbonato de sodio', 'hidrogenotrioxocarbonato(IV) de sodio', 'hidrogenocarbonato de sodio'],
      'Ca(H2PO4)2': ['bis(dihidrogenotetraoxidofosfato) de calcio', 'dihidrogenotetraoxofosfato(V) de calcio', 'dihidrogenofosfato de calcio'],
      NaHS: ['hidrogenosulfuro de sodio', 'hidrogenosulfuro de sodio', 'hidrogenosulfuro de sodio'],
      AgNO3: ['trioxidonitrato de plata', 'trioxonitrato(V) de plata', 'nitrato de plata'],
    };
    delete f2n.Ca;
    for (const [f, esp] of Object.entries(f2n)) {
      const n = nombres(f);
      ['Sistemática', 'Stock', 'Tradicional'].forEach((et, i) => { if (esp[i] !== null && n[et] !== esp[i]) mal(`Formulación · ${f} (${et}): «${n[et]}» en vez de «${esp[i]}»`); });
      if (esp[2] === null && n.Tradicional) mal(`Formulación · ${f}: no debería tener nombre tradicional («${n.Tradicional}»)`);
    }
    // nombre → fórmula (en cualquier nomenclatura, con o sin tildes y con el romano de varias formas)
    const n2f = {
      'óxido de hierro(III)': 'Fe2O3', 'Óxido de hierro (III)': 'Fe2O3', 'oxido de hierro(3)': 'Fe2O3', 'trióxido de dihierro': 'Fe2O3', 'óxido férrico': 'Fe2O3', 'trioxido de dihierro': 'Fe2O3',
      'monóxido de carbono': 'CO', 'ácido sulfúrico': 'H2SO4', 'acido sulfurico': 'H2SO4', 'tetraoxosulfato(VI) de hidrógeno': 'H2SO4', 'hidróxido de aluminio': 'Al(OH)3',
      'sulfato de aluminio': 'Al2(SO4)3', 'tris(tetraoxidosulfato) de dialuminio': 'Al2(SO4)3', 'carbonato de calcio': 'CaCO3', 'hidrogenocarbonato de sodio': 'NaHCO3', 'ácido clorhídrico': 'HCl',
      'cloruro de hierro(II)': 'FeCl2', 'dicloruro de calcio': 'CaCl2', 'monocloruro de sodio': 'NaCl', 'peróxido de hidrógeno': 'H2O2', 'amoniaco': 'NH3', 'agua': 'H2O',
      'permanganato de potasio': 'KMnO4', 'nitrato de plata': 'AgNO3', 'ácido perclórico': 'HClO4', 'óxido de nitrógeno(V)': 'N2O5', 'sulfato de hierro(III)': 'Fe2(SO4)3', 'sulfato férrico': 'Fe2(SO4)3',
      'dihidrogenofosfato de calcio': 'Ca(H2PO4)2', 'hidruro de sodio': 'NaH', 'tetracloruro de carbono': 'CCl4',
    };
    for (const [nom, f] of Object.entries(n2f)) {
      let r; try { r = C.resolver({ modo: 'n2f', texto: nom }); } catch (e) { mal(`Formulación · «${nom}» no se reconoce: ${e.message}`); continue; }
      if (r.formula !== f) mal(`Formulación · «${nom}»: ${r.formula} en vez de ${f}`);
    }
    // índices: cada fórmula tiene un solo compuesto y cada nombre vuelve a su compuesto
    const pf = C.porFormula(), pn = C.porNombre();
    for (const [k, v] of pf) if (v.length > 1) mal(`Formulación: la fórmula ${k} la tienen ${v.length} compuestos (${v.map((c) => c.formula).join(', ')})`);
    let cruzados = 0;
    for (const c of C.todos()) for (const l of c.lineas) for (const nom of [l.nombre, ...(l.otros || [])]) if (pn.get(C.norm(nom)).c !== c && cruzados++ < 5) mal(`Formulación: el nombre «${nom}» de ${c.formula} apunta a ${pn.get(C.norm(nom)).c.formula}`);
    if (C.todos().length < 2500) mal(`Formulación: solo hay ${C.todos().length} compuestos`);
    // la fórmula se lee igual con subíndices, corchetes y espacios
    for (const t of ['Fe₂(SO₄)₃', 'Fe2 (SO4)3', 'Fe2[SO4]3', 'O12S3Fe2']) if (C.resolver({ modo: 'f2n', texto: t }).formula !== 'Fe2(SO4)3') mal(`Formulación: «${t}» no se lee como Fe2(SO4)3`);
    // errores
    for (const [sc, q] of [[{ modo: 'f2n', texto: '' }, 'fórmula vacía'], [{ modo: 'f2n', texto: 'FeO3' }, 'FeO3 no existe'], [{ modo: 'f2n', texto: 'Xx2' }, 'símbolo inventado'], [{ modo: 'f2n', texto: 'Fe2(SO4' }, 'paréntesis sin cerrar'], [{ modo: 'f2n', texto: 'Fe2)O3' }, 'paréntesis sin abrir'], [{ modo: 'n2f', texto: '' }, 'nombre vacío'], [{ modo: 'n2f', texto: 'óxido de unobtanio' }, 'nombre inventado']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Formulación: ${q} no da error`);
    }
    try { C.resolver({ modo: 'n2f', texto: 'acido sulfur' }); } catch (e) { if (!e.sugerencias.includes('ácido sulfúrico')) mal(`Formulación: «acido sulfur» no sugiere ácido sulfúrico (${e.sugerencias})`); }
    // respuestas del modo práctica
    const c = C.resolver({ modo: 'f2n', texto: 'Fe2O3' }).c, ac = C.aceptadas(c, 'f2n');
    for (const x of ['trióxido de dihierro', 'trioxido de dihierro', 'óxido de hierro(III)', 'oxido de hierro III', 'óxido férrico']) if (!ac.includes(x)) mal(`Formulación: la respuesta «${x}» no se acepta en el modo práctica`);
    if (!C.aceptadas(c, 'n2f').includes('Fe2O3')) mal('Formulación: la fórmula no se acepta en el modo práctica');
    for (const e of C.ejemplos) { try { C.resolver(e.sc); } catch (err) { mal(`Formulación · ejemplo ${e.clave}: ${err.message}`); } }
    if (fallos === antes) console.log(`  ✓ Formulacion: ${C.todos().length} compuestos, ${Object.keys(f2n).length} fórmulas y ${Object.keys(n2f).length} nombres a mano, ${C.ejemplos.length} ejemplos y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'quimica', 'formulacion', 'index.html'));
    await page.waitForFunction(() => window.FormulacionApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('formulacion').current) mal(`Formulacion: la página muestra la versión «${ver}», se esperaba ${Version.de('formulacion').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => FormulacionApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), nombres: document.querySelectorAll('#res .nombre').length, formula: document.querySelector('#formula').textContent, ac: document.querySelectorAll('#aceptadas span').length }));
      if (r.err || !r.pasos || !r.nombres || !r.formula || !r.ac) mal(`Formulacion · ${e.clave}: falta el resultado o el desarrollo`);
      if (r.dolar || (!r.mathml && e.sc.texto !== 'NH3')) mal(`Formulacion · ${e.clave}: el desarrollo no sale en MathML`);
    }
    // fórmula → nombre en la página
    await page.click('#tab-f2n');
    await page.fill('#texto', 'Al2(SO4)3');
    if (!(await page.locator('#res').textContent()).includes('tris(tetraoxidosulfato) de dialuminio')) mal('Formulacion: Al2(SO4)3 no da su nombre sistemático');
    if ((await page.locator('#formula').textContent()) !== 'Al2(SO4)3') mal('Formulacion: la fórmula del resultado no es Al2(SO4)3');
    // cambiar de modo lleva el compuesto al otro lado
    await page.click('#tab-n2f');
    if (!/tris\(tetraoxidosulfato\)|sulfato|dialuminio/.test(await page.inputValue('#texto'))) mal('Formulacion: al cambiar de modo el nombre no pasa al campo');
    await page.fill('#texto', 'hidroxido de hierro(3)');
    if ((await page.locator('#formula').textContent()) !== 'Fe(OH)3') mal('Formulacion: «hidroxido de hierro(3)» no da Fe(OH)3');
    if (!(await page.locator('#res div.usada').count())) mal('Formulacion: no marca la nomenclatura escrita');
    // error con sugerencias que se pueden pulsar
    await page.fill('#texto', 'acido sulfur');
    if (await page.locator('#error').isHidden() || !(await page.locator('#sugs button').count())) mal('Formulacion: un nombre incompleto no da error con sugerencias');
    else { await page.click('#sugs button >> nth=0'); if (!(await page.locator('#error').isHidden())) mal('Formulacion: pulsar una sugerencia no la resuelve'); }
    await page.click('#tab-f2n'); await page.fill('#texto', 'FeO3');
    if (await page.locator('#error').isHidden()) mal('Formulacion: FeO3 no muestra el error');
    await page.close();
    if (consola.length) mal('Formulacion: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Formulacion: ${C.ejemplos.length} ejemplos en la página con MathML, los dos modos, sugerencias y errores, sin errores de consola`);
  };
};
