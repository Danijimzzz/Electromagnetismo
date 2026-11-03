/* Comprobación de la nomenclatura orgánica e isomería en 3D: cálculos en Node y la página en Chromium. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo organica ejecuta solo esta).
   Los nombres, las configuraciones R/S y E/Z y los recuentos de estereoisómeros están hechos a mano (reglas IUPAC y CIP). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'organica', 'calculo.js'));
  const nombre = (s) => { const r = C.resolver({ smiles: s }); return r.nombre || '!! ' + r.errorNombre; };
  {
    const antes = fallos;
    // [SMILES, nombre IUPAC]
    const nombres = `CC(C)CC(C)(C)C|2,2,4-trimetilpentano
CC(C)=CC|2-metilbut-2-eno
OCC(O)CO|propano-1,2,3-triol
CC(O)C(C)C|3-metilbutan-2-ol
CCCCC(=O)C|hexan-2-ona
OC(=O)CC(=O)O|ácido propanodioico
C=CC(O)C|but-3-en-2-ol
ClCC(Cl)C|1,2-dicloropropano
CC(Br)C(Cl)C|2-bromo-3-clorobutano
CC(C)C(C)C(C)C|2,3,4-trimetilpentano
CCC(C)(C)CC|3,3-dimetilpentano
C=C(C)C|2-metilprop-1-eno
C=C(CC)CC|2-etilbut-1-eno
CCOCC|etoxietano
COC(C)C|2-metoxipropano
C=CCl|cloroeteno
CC(Cl)Cl|1,1-dicloroetano
OCCO|etano-1,2-diol
CCCC#N|butanonitrilo
NCCCCN|butano-1,4-diamina
CC(C)CC(=O)O|ácido 3-metilbutanoico
O=CC=O|etanodial
CC(=O)CC(=O)C|pentano-2,4-diona
BrCCBr|1,2-dibromoetano
CCCC(C(C)C)CCC|4-(1-metiletil)heptano
C=CC=CC|penta-1,3-dieno
CC#CC|but-2-ino
C#CCC|but-1-ino
C=CC#C|but-1-en-3-ino
CCC(CC)CC(C)C|4-etil-2-metilhexano
C=O|metanal
OC=O|ácido metanoico
CO|metanol
C|metano
CCl|clorometano
CC(C)(C)O|2-metilpropan-2-ol
CC(=O)CC(=O)O|ácido 3-oxobutanoico
OCC(=O)C|1-hidroxipropan-2-ona
ClC(Cl)(Cl)Cl|tetraclorometano
CC(C)(C)CC|2,2-dimetilbutano
CC(C)CC|2-metilbutano
CCCC(C)(C)C|2,2-dimetilpentano
CC(CC)CCC|3-metilhexano
C=CCO|prop-2-en-1-ol
CCCCCCC=O|heptanal
CC(C)C(=O)OC|2-metilpropanoato de metilo
CCCC(C)(CC)CC|3-etil-3-metilhexano
CC(C)(C)C(C)(C)C|2,2,3,3-tetrametilbutano
CCS|etanotiol
CCCSC|1-(metiltio)propano
CC(N)C(=O)O|ácido 2-aminopropanoico
NC(=O)CC|propanamida
CC(C)C(C)C|2,3-dimetilbutano
CCC(=O)CC|pentan-3-ona
OCC=CCO|but-2-eno-1,4-diol
CC(=O)C=C|but-3-en-2-ona`.split('\n').map((l) => l.split('|'));
    for (const [s, esperado] of nombres) {
      let n; try { n = nombre(s); } catch (e) { n = 'ERROR ' + e.message; }
      if (n !== esperado) mal(`Orgánica · ${s}: «${n}» en vez de «${esperado}»`);
    }
    // con estereoquímica
    const est = [
      ['CC[C@H](C)O', '(2S)-butan-2-ol'], ['CC[C@@H](C)O', '(2R)-butan-2-ol'], ['C[C@H](O)C(=O)O', 'ácido (2S)-2-hidroxipropanoico'],
      ['N[C@@H](C)C(=O)O', 'ácido (2S)-2-aminopropanoico'], ['C/C=C/C', '(2E)-but-2-eno'], ['C/C=C\\C', '(2Z)-but-2-eno'],
      ['O=C(O)[C@H](O)[C@@H](O)C(=O)O', 'ácido (2R,3R)-2,3-dihidroxibutanodioico'], ['O=C(O)[C@H](O)[C@H](O)C(=O)O', 'ácido (2R,3S)-2,3-dihidroxibutanodioico'],
      ['C/C=C/C=C/C', '(2E,4E)-hexa-2,4-dieno'], ['C/C=C\\C=C\\C', '(2Z,4E)-hexa-2,4-dieno'],
    ];
    for (const [s, esperado] of est) { const n = nombre(s); if (n !== esperado) mal(`Orgánica · ${s}: «${n}» en vez de «${esperado}»`); }
    // fórmula y masa molar
    const f = (s) => C.resolver({ smiles: s });
    if (f('CCO').formulaPlano !== 'C2H6O' || Math.abs(f('CCO').masa - 46.069) > 0.01) mal('Orgánica: fórmula o masa del etanol');
    if (f('N[C@@H](C)C(=O)O').formulaPlano !== 'C3H7NO2' || Math.abs(f('N[C@@H](C)C(=O)O').masa - 89.094) > 0.01) mal('Orgánica: fórmula o masa de la alanina');
    // número de estereoisómeros (a mano): 2-butanol 2; 2,3-diclorobutano 3 (R,R; S,S y meso); tartárico 3; but-2-eno 2; hexa-2,4-dieno 3; 3-metilpentan-2-ol 4; butano 0
    for (const [s, n, quiral] of [['CC[C@H](C)O', 2, true], ['C[C@H](Cl)[C@@H](Cl)C', 3, true], ['O=C(O)[C@H](O)[C@@H](O)C(=O)O', 3, true], ['O=C(O)[C@H](O)[C@H](O)C(=O)O', 3, false],
      ['C/C=C/C', 2, false], ['C/C=C/C=C/C', 3, false], ['CC[C@H](C)[C@H](C)O', 4, true]]) {
      const r = f(s); const l = r.estereo.lista;
      if (!l || l.length !== n) mal(`Orgánica · ${s}: ${l ? l.length : 'sin lista'} estereoisómeros en vez de ${n}`);
      if (r.estereo.quiral !== quiral) mal(`Orgánica · ${s}: quiral=${r.estereo.quiral} en vez de ${quiral}`);
    }
    if (f('CCCC').estereo.lista.length !== 0) mal('Orgánica: el butano no tiene estereoisómeros');
    // el enantiómero invierte R/S
    if (f(C.enantiomero('CC[C@H](C)O')).estereo.centros[0].label !== 'R') mal('Orgánica: el enantiómero del (S)-butan-2-ol debería ser R');
    // la geometría 3D coincide con R/S y E/Z (medidos en las coordenadas)
    const geo = ['CC[C@H](C)O', 'CC[C@@H](C)O', 'F[C@](Cl)(Br)I', 'F[C@@](Cl)(Br)I', 'N[C@@H](C)C(=O)O', 'OC[C@H](O)[C@@H](O)[C@H](O)C=O', 'CC[C@](C)(Cl)Br', 'C[C@H](Cl)[C@@H](Cl)C', 'C/C=C/C', 'C/C=C\\C', 'C/C=C/C=C/C', 'CC/C=C/C(C)=O', 'C/C(Cl)=C(/F)Br', 'CC(=O)/C=C\\Cl', 'CCC(CC)C(C)C'];
    for (const s of geo) {
      const M = C.leer(s), g = C.coordenadas(M), e = C.estereo(M);
      let dmin = 9;
      for (let a = 0; a < g.atomos.length; a++) for (let b = a + 1; b < g.atomos.length; b++) dmin = Math.min(dmin, C.v3.norm(C.v3.sub(g.atomos[a].p, g.atomos[b].p)));
      if (!(dmin > 0.85)) mal(`Orgánica · ${s}: dos átomos casi en el mismo sitio (${dmin.toFixed(2)} Å)`);
      for (const c of e.centros) if (c.label && C.etiquetaGeometrica(M, g, c.i, c.rg) !== c.label) mal(`Orgánica · ${s}: el centro ${c.i} es ${c.label} pero en 3D sale al revés`);
      for (const d of e.dobles) {
        if (!d.label) continue;
        const ix = (t, x) => (t === 'H' ? g.atomos.findIndex((a) => a.de === x) : t), di = C.diedro(g, ix(d.ra[0], d.a), d.a, d.b, ix(d.rb[0], d.b));
        if ((Math.abs(di) < 90 ? 'Z' : 'E') !== d.label) mal(`Orgánica · ${s}: el doble enlace es ${d.label} pero el diedro 3D mide ${di.toFixed(0)}°`);
      }
    }
    // errores con mensaje
    for (const [s, q] of [['', 'vacío'], ['CC(', 'paréntesis'], ['C1CCCCC1', 'anillo'], ['c1ccccc1', 'aromático'], ['CC=', 'enlace colgando'], ['C(C)(C)(C)(C)C', 'valencia'], ['CX', 'elemento'], ['[Na+]', 'carga'], ['C=C=C', 'aleno']]) {
      let ok = false; try { C.leer(s); } catch (e) { ok = !!e.message; }
      if (!ok) mal(`Orgánica: «${s}» (${q}) no da error`);
    }
    for (const [s, q] of [['CNC', 'amina secundaria'], ['CC(=O)NC', 'amida N-sustituida'], ['O', 'sin carbono']]) {
      const r = C.resolver({ smiles: s });
      if (r.nombre || !r.errorNombre) mal(`Orgánica: «${s}» (${q}) debería avisar de que no sabe nombrarla`);
    }
    // isómeros constitucionales: cada SMILES de la lista tiene la fórmula de su clave
    for (const [fo, lista] of Object.entries(C.ISOMEROS)) for (const s of lista) { const x = C.formulaDe(C.leer(s)).plano; if (x !== fo) mal(`Orgánica: ${s} no es ${fo} sino ${x}`); }
    if (fallos === antes) console.log(`  ✓ Orgánica: ${nombres.length + est.length} nombres, fórmulas, estereoisómeros, 3D coherente con R/S y E/Z y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'quimica', 'organica', 'index.html'));
    await page.waitForFunction(() => window.OrganicaApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('organica').current) mal(`Orgánica: la página muestra la versión «${ver}», se esperaba ${Version.de('organica').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => OrganicaApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#resumen > div').length, nombre: document.querySelector('#titulo-mol').textContent }));
      if (r.err || !r.pasos || !r.res || !r.nombre) mal(`Orgánica · ${e.clave}: falta el resultado o el desarrollo`);
      const n = await page.evaluate(() => { const c = document.querySelector('#molecula'), b = document.createElement('canvas'); b.width = c.width; b.height = c.height; return c.toDataURL().length - b.toDataURL().length; });
      if (n < 2000) mal(`Orgánica · ${e.clave}: el lienzo 3D está vacío`);
    }
    // escribir una molécula, ver la tabla de estereoisómeros y pasar al enantiómero
    await page.fill('#smiles', 'CC[C@H](C)O');
    if (!/\(2S\)-butan-2-ol/.test(await page.locator('#titulo-mol').textContent())) mal('Orgánica: no nombra el (S)-butan-2-ol escrito a mano');
    await page.click('#b-espejo');
    if (!/\(2R\)-butan-2-ol/.test(await page.locator('#titulo-mol').textContent())) mal('Orgánica: «Ver el enantiómero» no cambia a R');
    if ((await page.locator('#t-estereo tbody tr').count()) !== 2) mal('Orgánica: la tabla de estereoisómeros del butan-2-ol debería tener 2 filas');
    await page.click('#t-estereo tbody tr:not(.activa) button');
    if (!/\(2S\)/.test(await page.locator('#titulo-mol').textContent())) mal('Orgánica: «Ver en 3D» de la tabla no cambia de estereoisómero');
    await page.fill('#smiles', 'CC(');
    if (await page.locator('#error').isHidden()) mal('Orgánica: un SMILES mal escrito no muestra el error');
    await page.close();
    if (consola.length) mal('Orgánica: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Orgánica: ${C.ejemplos.length} ejemplos en la página con 3D, tabla de estereoisómeros y errores, sin errores de consola`);
  };
};
