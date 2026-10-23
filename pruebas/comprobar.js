#!/usr/bin/env node
/* Comprobación antes de publicar o fusionar un cambio. Hay dos juegos de ejercicios:
   - los 12 de ejemplo de la web pública (fuente/presets.js), contra pruebas/esperados-ejemplos.json;
   - los 12 del Tema 3 de la versión privada (privado/tema3-pdf.js), contra pruebas/esperados.json,
     que es la forma escrita del solucionario oficial, no solo el valor.
   Pasos:
   1. regenera la web pública (portada, asignaturas y simulador) y la versión privada con
      fuente/build.sh, y comprueba que publico/ solo contiene lo que se publica y ningún enunciado del Tema 3;
   2. resuelve los dos juegos en Node y compara cada resultado con su archivo de esperados;
   3. abre las dos páginas en Chromium, repite el cálculo dentro de la página, abre cada ejercicio
      desde la barra lateral y la guía, y falla si hay errores en la consola; abre también la portada
      y las páginas de asignatura y comprueba sus enlaces.
   Uso: node pruebas/comprobar.js [--actualizar] [--sin-navegador]
   --actualizar reescribe los esperados con los resultados actuales (solo si el cambio de forma es intencionado). */
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const raiz = path.join(__dirname, '..'), fuente = path.join(raiz, 'fuente'), publico = path.join(raiz, 'publico');
const args = process.argv.slice(2);
let fallos = 0;
const mal = (m) => { fallos++; console.log('  ✗ ' + m); };

// lo único que puede haber en publico/ (lo que sirven Vercel y Cloudflare): los archivos sueltos,
// la portada, una página por asignatura y una por herramienta disponible del catálogo
const Catalogo = require(path.join(fuente, 'catalogo.js'));
const PUBLICABLES = ['index.html', 'og.png', 'apple-touch-icon.png', 'legal.css', 'aviso-legal.html', 'privacidad.html', 'cookies.html', 'contacto.html',
  ...Catalogo.asignaturas.flatMap((a) => [`${a.clave}/index.html`, ...a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}/index.html`)])];
const listar = (dir, pre = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? listar(path.join(dir, e.name), pre + e.name + '/') : [pre + e.name]));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'emsim-'));
const juegos = [
  { nombre: 'Ejemplos', presets: path.join(fuente, 'presets.js'), esperados: path.join(__dirname, 'esperados-ejemplos.json'), pagina: path.join(publico, 'electromagnetismo', 'electrostatica', 'index.html') },
  { nombre: 'Tema 3', presets: path.join(raiz, 'privado', 'tema3-pdf.js'), esperados: path.join(__dirname, 'esperados.json'), pagina: path.join(tmp, 'privado.html') },
];

console.log('1 · Compilando las páginas');
execFileSync('sh', [path.join(fuente, 'build.sh')], { stdio: 'inherit' });
execFileSync('sh', [path.join(fuente, 'build.sh'), 'privado', path.join(tmp, 'cuerpo.html')], { stdio: 'inherit' });
// el artifact añade el esqueleto; aquí se añade el mínimo para abrirla en el navegador
fs.writeFileSync(juegos[1].pagina, '<!doctype html>\n<meta charset="utf-8">\n' + fs.readFileSync(path.join(tmp, 'cuerpo.html'), 'utf8'));
console.log(`  ✓ simulador ${(fs.statSync(juegos[0].pagina).size / 1024).toFixed(0)} KB · privada ${(fs.statSync(juegos[1].pagina).size / 1024).toFixed(0)} KB`);
const hay = listar(publico), sobran = hay.filter((f) => !PUBLICABLES.includes(f)), faltan = PUBLICABLES.filter((f) => !hay.includes(f));
if (sobran.length) mal(`publico/ contiene archivos que no deberían publicarse: ${sobran.join(', ')}`);
if (faltan.length) mal(`publico/ no tiene: ${faltan.join(', ')}`);
const web = fs.readFileSync(juegos[0].pagina, 'utf8');

// resultados de todos los ejercicios: { clave: { titulo, incognita, resultados: [html…] } }
function resolver(Physics, Presets) {
  const r = {};
  for (const p of Presets.list) {
    const out = Physics.run(p.make());
    r[p.key] = {
      titulo: p.title,
      errores: out.ctx.errors,
      incognita: out.unknown ? (out.unknown.error ? 'ERROR: ' + out.unknown.error : out.unknown.html) : null,
      resultados: out.results.map((x) => (x.error ? 'ERROR: ' + x.error : x.res)),
    };
  }
  return r;
}
function comparar(obtenidos, esperados, donde) {
  for (const [k, e] of Object.entries(esperados)) {
    const o = obtenidos[k];
    if (!o) { mal(`${donde}: falta el ejercicio ${e.titulo}`); continue; }
    if (o.errores.length) mal(`${donde} · ${e.titulo}: ${o.errores.join(' · ')}`);
    if (o.incognita !== e.incognita) mal(`${donde} · ${e.titulo} (incógnita)\n      esperado: ${e.incognita}\n      obtenido: ${o.incognita}`);
    if (o.resultados.length !== e.resultados.length) mal(`${donde} · ${e.titulo}: ${o.resultados.length} preguntas, se esperaban ${e.resultados.length}`);
    e.resultados.forEach((r, i) => { if (o.resultados[i] !== r) mal(`${donde} · ${e.titulo} (pregunta ${i + 1})\n      esperado: ${r}\n      obtenido: ${o.resultados[i]}`); });
    o.resultados.forEach((r, i) => { if (r.startsWith('ERROR: ')) mal(`${donde} · ${e.titulo} (pregunta ${i + 1}): ${r}`); });
    if (o.incognita?.startsWith('ERROR: ')) mal(`${donde} · ${e.titulo} (incógnita): ${o.incognita}`);
  }
}

console.log('2 · Ejercicios en Node');
for (const m of ['version', 'engine', 'fmt', 'physics']) {
  const g = { version: 'Version', engine: 'Engine', fmt: 'Fmt', physics: 'Physics' }[m];
  global[g] = require(path.join(fuente, m + '.js'));
}
for (const j of juegos) {
  j.Presets = require(j.presets);
  const nodo = resolver(Physics, j.Presets);
  if (args.includes('--actualizar') || !fs.existsSync(j.esperados)) {
    fs.writeFileSync(j.esperados, JSON.stringify(nodo, null, 1) + '\n');
    console.log(`  ✓ ${path.basename(j.esperados)} reescrito con ${Object.keys(nodo).length} ejercicios`);
  }
  j.esp = JSON.parse(fs.readFileSync(j.esperados, 'utf8'));
  const antes = fallos;
  comparar(nodo, j.esp, `Node · ${j.nombre}`);
  if (fallos === antes) console.log(`  ✓ ${j.nombre}: ${Object.keys(j.esp).length} ejercicios iguales a ${path.basename(j.esperados)}`);
}
// la web pública no puede llevar nada del PDF de la asignatura
const textos = hay.filter((f) => f.endsWith('.html')).map((f) => [f, fs.readFileSync(path.join(publico, f), 'utf8')]);
const delPdf = juegos[1].Presets.list.flatMap((p) => [p.statement, p.title]).flatMap((t) => textos.filter(([, x]) => x.includes(t)).map(([f]) => `${f}: ${t}`));
if (delPdf.length) mal(`publico/ contiene enunciados o títulos del Tema 3:\n      ${delPdf.join('\n      ')}`);
else console.log('  ✓ publico/ no contiene ningún enunciado ni título del Tema 3');
console.log(`  · versiones: ${Object.keys(Version.registros).map((k) => `${k} ${Version.de(k).current}`).join(' · ')}`);

// magnetostática: los ejemplos contra pruebas/esperados-magnetostatica.json
const Magneto = require(path.join(fuente, 'magnetostatica', 'fisica.js')), MagEjemplos = require(path.join(fuente, 'magnetostatica', 'ejemplos.js'));
const resolverMag = (M, E) => Object.fromEntries(E.lista.map((e) => { const o = M.run({ modo: 'sym', ...e.escena() }); return [e.clave, { titulo: e.titulo, errores: o.errors, resultados: o.results.map((r) => (r.error ? 'ERROR: ' + r.error : r.res)) }]; }));
const espMagF = path.join(__dirname, 'esperados-magnetostatica.json');
const magNodo = resolverMag(Magneto, MagEjemplos);
if (args.includes('--actualizar') || !fs.existsSync(espMagF)) { fs.writeFileSync(espMagF, JSON.stringify(magNodo, null, 1) + '\n'); console.log('  ✓ esperados-magnetostatica.json reescrito'); }
const espMag = JSON.parse(fs.readFileSync(espMagF, 'utf8'));
function compararMag(obt, donde) {
  const antes = fallos;
  for (const [k, e] of Object.entries(espMag)) {
    const o = obt[k];
    if (!o) { mal(`${donde}: falta el ejemplo ${e.titulo}`); continue; }
    if (o.errores.length) mal(`${donde} · ${e.titulo}: ${o.errores.join(' · ')}`);
    e.resultados.forEach((r, i) => { if (o.resultados[i] !== r) mal(`${donde} · ${e.titulo} (pregunta ${i + 1})\n      esperado: ${r}\n      obtenido: ${o.resultados[i]}`); });
    o.resultados.forEach((r, i) => { if (r.startsWith('ERROR: ')) mal(`${donde} · ${e.titulo} (pregunta ${i + 1}): ${r}`); });
  }
  if (fallos === antes) console.log(`  ✓ ${donde}: ${Object.keys(espMag).length} ejemplos de magnetostática iguales a esperados-magnetostatica.json`);
}
compararMag(magNodo, 'Node · Magnetostática');

// tabla periódica: 118 elementos, cada uno en su casilla, y configuraciones de referencia
const Elementos = require(path.join(fuente, 'quimica', 'elementos.js'));
{
  const antes = fallos, L = Elementos.lista;
  if (L.length !== 118 || L.some((e, i) => e.Z !== i + 1)) mal('Elementos: la lista no tiene los 118 elementos en orden');
  if (new Set(L.map((e) => e.fila + ',' + e.col)).size !== 118) mal('Elementos: hay dos elementos en la misma casilla');
  L.forEach((e) => { const n = Elementos.configuracion(e.Z).reduce((s, o) => s + o.e, 0); if (n !== e.Z) mal(`Elementos · ${e.simbolo}: la configuración tiene ${n} electrones`); });
  const REF = { H: '1s¹', O: '[He] 2s² 2p⁴', Cr: '[Ar] 3d⁵ 4s¹', Fe: '[Ar] 3d⁶ 4s²', Cu: '[Ar] 3d¹⁰ 4s¹', Pd: '[Kr] 4d¹⁰', Ag: '[Kr] 4d¹⁰ 5s¹', Gd: '[Xe] 4f⁷ 5d¹ 6s²', Au: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', U: '[Rn] 5f³ 6d¹ 7s²' };
  for (const [s, c] of Object.entries(REF)) { const o = Elementos.abreviada(Elementos.porSimbolo[s].Z); if (o !== c) mal(`Elementos · ${s}: configuración ${o}, se esperaba ${c}`); }
  const fe2 = Elementos.texto(Elementos.configuracion(26, 2));
  if (fe2 !== '1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶') mal(`Elementos · Fe²⁺: ${fe2}`);
  const g = (s) => Elementos.porSimbolo[s];
  if (g('Fe').grupo !== 8 || g('Fe').periodo !== 4 || g('Rn').grupo !== 18 || g('Ba').grupo !== 2 || g('Lu').grupo !== null) mal('Elementos: grupos o periodos mal colocados');
  if (fallos === antes) console.log('  ✓ Tabla periódica: 118 elementos en su casilla, configuraciones de referencia correctas');
}
const Energia = require(path.join(fuente, 'trabajo-y-energia', 'fisica.js'));
{
  // resultados comprobados a mano; la simulación debe conservar E = K + Ug + Ue + Q y llegar a la misma compresión
  const ESP = {
    'rampa-muelle': { vB: 9.0014, vC: 8.0837, x: 0.78901 },
    'sin-rozamiento': { vB: 6.2610, vC: 6.2610, x: 0.62610 },
    'para-llano': { vB: 9.0014, paraLlano: 8.2679 },
    'no-arranca': { quieto: true },
    'empujon': { vB: 1.2941, paraLlano: 0.42722 },
    'muelle-duro': { vB: 7.4361, vC: 7.3032, x: 0.18227 },
  };
  const antes = fallos;
  for (const e of Energia.ejemplos) {
    const r = Energia.resolver(e.sc).res, esp = ESP[e.clave];
    if (!esp) { mal(`Trabajo y energía: falta el resultado esperado de ${e.clave}`); continue; }
    for (const [k, v] of Object.entries(esp)) if (typeof v === 'number' ? !(Math.abs(r[k] - v) < 1e-4 * Math.max(1, Math.abs(v))) : r[k] !== v) mal(`Trabajo y energía · ${e.clave}: ${k} = ${r[k]}, se esperaba ${v}`);
    const sim = Energia.simular(e.sc, 20);
    const deriva = Math.max(...sim.puntos.map((q) => Math.abs(q.K + q.Ug + q.Ue + q.Q - sim.E0)));
    if (deriva > 1e-6 * Math.max(1, sim.E0)) mal(`Trabajo y energía · ${e.clave}: la simulación no conserva la energía (desvío ${deriva} J)`);
    if (esp.x !== undefined) { const xs = Math.max(...sim.puntos.map((q) => q.x)); if (Math.abs(xs - esp.x) > 1e-4) mal(`Trabajo y energía · ${e.clave}: compresión simulada ${xs}, analítica ${esp.x}`); }
  }
  if (fallos === antes) console.log(`  ✓ Trabajo y energía: ${Energia.ejemplos.length} ejemplos con los resultados esperados y la energía conservada en la simulación`);
}
global.Elementos = Elementos;
const Formulas = require(path.join(fuente, 'quimica', 'formulas.js'));
{
  // masas molares y ajustes de referencia, y el reactivo limitante de cada ejemplo
  const antes = fallos;
  const MASAS = { H2O: 18.015, 'Ca(OH)2': 74.092, 'K4[Fe(CN)6]': 368.345, 'CuSO4·5H2O': 249.677, 'Al2(SO4)3': 342.132, 'SO4^2-': 96.056 };
  for (const [f, M] of Object.entries(MASAS)) { const o = Formulas.masaMolar(f).M; if (Math.abs(o - M) > 2e-3) mal(`Masa molar · ${f}: ${o}, se esperaba ${M}`); }
  if (Formulas.masaMolar('H2SO4', 'redondeadas').M !== 98) mal('Masa molar · H2SO4 con masas de clase debería dar 98');
  const AJ = { propano: '1,5,3,4', 'alto-horno': '1,3,2,3', aluminio: '2,6,2,3', permanganato: '2,16,2,2,5,8', 'cobre-nitrico': '3,8,3,2,4', 'redox-ionica': '1,5,8,1,5,4' };
  const LIM = { propano: 'O2', 'alto-horno': 'Fe2O3', aluminio: 'HCl', permanganato: 'KMnO4', 'cobre-nitrico': 'Cu', 'redox-ionica': 'Fe^2+' };
  for (const e of Formulas.ejemplos) {
    const c = Formulas.ajustar(e.ecuacion).especies.map((s) => s.coef).join(',');
    if (c !== AJ[e.clave]) mal(`Estequiometría · ${e.clave}: coeficientes ${c}, se esperaban ${AJ[e.clave]}`);
    const r = Formulas.estequiometria(e.ecuacion, e.cantidades);
    if (r.especies[r.limitante].texto !== LIM[e.clave]) mal(`Estequiometría · ${e.clave}: limitante ${r.especies[r.limitante].texto}, se esperaba ${LIM[e.clave]}`);
  }
  const co2 = Formulas.estequiometria('C3H8 + O2 -> CO2 + H2O', [{ valor: 44, unidad: 'g' }, { valor: 100, unidad: 'g' }]).especies[2];
  if (Math.abs(co2.masa - 82.52) > 0.01) mal(`Estequiometría · propano: CO2 ${co2.masa} g, se esperaban 82,52 g`);
  for (const mala of ['H2O -> H2 + O2 + O3', 'NaCl -> Na', 'Xx -> X', 'H2 + O2']) { let ok = false; try { Formulas.ajustar(mala); } catch (e) { ok = true; } if (!ok) mal(`Estequiometría: «${mala}» debería dar un error`); }
  if (fallos === antes) console.log(`  ✓ Masa molar y estequiometría: masas de referencia, ${Formulas.ejemplos.length} reacciones ajustadas con su limitante y errores de entrada`);
}
const Configuracion = require(path.join(fuente, 'quimica', 'configuracion.js'));
{
  // configuraciones, desapareados y números cuánticos de referencia (convenio m_l de −l a +l, primero s = +½)
  const antes = fallos;
  const REF = {
    Fe: ['[Ar] 4s² 3d⁶', 4, '3,2,-2,−½'], Cr: ['[Ar] 4s¹ 3d⁵', 6, '3,2,2,+½'], Cu: ['[Ar] 4s¹ 3d¹⁰', 1, '3,2,2,−½'],
    'Fe^2+': ['[Ar] 3d⁶', 4, '3,2,-2,−½'], 'Cu+': ['[Ar] 3d¹⁰', 0, '3,2,2,−½'], 'Cl-': ['[Ar]', 0, '3,1,1,−½'],
    O: ['[He] 2s² 2p⁴', 2, '2,1,-1,−½'], N: ['[He] 2s² 2p³', 3, '2,1,1,+½'], Ar: ['[Ne] 3s² 3p⁶', 0, '3,1,1,−½'], hierro: ['[Ar] 4s² 3d⁶', 4, '3,2,-2,−½'],
  };
  for (const [x, [ab, d, qn]] of Object.entries(REF)) {
    const r = Configuracion.analizar(x), q = r.diferenciador;
    if (r.abreviada !== ab) mal(`Configuración · ${x}: ${r.abreviada}, se esperaba ${ab}`);
    if (r.desapareados !== d) mal(`Configuración · ${x}: ${r.desapareados} desapareados, se esperaban ${d}`);
    if ([q.n, q.l, q.ml, q.ms].join(',') !== qn) mal(`Configuración · ${x}: números cuánticos ${[q.n, q.l, q.ml, q.ms]}, se esperaban ${qn}`);
  }
  if (!Configuracion.analizar('Cr').excepcion || Configuracion.analizar('Fe').excepcion) mal('Configuración: el cromo es una excepción y el hierro no');
  for (const z of [1, 26, 57, 92, 118]) { const r = Configuracion.analizar(String(z)); if (r.capas.reduce((a, b) => a + b, 0) !== z) mal(`Configuración · Z = ${z}: las capas no suman ${z} electrones`); }
  for (const mala of ['Xx', 'Na11+', '']) { let ok = false; try { Configuracion.analizar(mala); } catch (e) { ok = true; } if (!ok) mal(`Configuración: «${mala}» debería dar un error`); }
  if (fallos === antes) console.log(`  ✓ Configuración electrónica: ${Object.keys(REF).length} elementos e iones de referencia, excepciones y errores de entrada`);
}

async function navegador() {
  console.log('3 · Páginas en Chromium');
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) {
    try { ({ chromium } = require(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright'))); } catch (e2) { mal('no se encuentra playwright (npm i playwright)'); return; }
  }
  const exe = process.env.CHROMIUM || ['/opt/pw-browsers/chromium'].find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  for (const j of juegos) {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + j.pagina);
    await page.waitForSelector('#side-list .item');
    const enPagina = await page.evaluate(`(${resolver})(Physics, Presets)`);
    const antes = fallos;
    comparar(enPagina, j.esp, `Chromium · ${j.nombre}`);
    const ver = await page.locator('#ver .ver-n').textContent();
    if (ver !== Version.current) mal(`${j.nombre}: la página muestra la versión «${ver}», se esperaba ${Version.current}`);
    const sec = await page.locator('#side-list .sec-h span').allTextContents();
    if (!sec.includes(j.Presets.section)) mal(`${j.nombre}: la barra lateral no muestra la sección «${j.Presets.section}»`);
    for (const e of Object.values(j.esp)) {
      await page.locator('#side-list .item .it', { hasText: e.titulo }).first().click();
      await page.waitForTimeout(150);
      const err = await page.evaluate(() => { const x = document.querySelector('#errors'); return x && !x.hidden ? x.textContent : ''; });
      if (err) mal(`${j.nombre} · ${e.titulo}: ${err}`);
      const warn = await page.locator('.warn').allTextContents();
      if (warn.length) mal(`${j.nombre} · ${e.titulo}: ${warn.join(' · ')}`);
    }
    await page.click('#help');
    await page.waitForSelector('#guide[open]');
    const sinImg = await page.evaluate(() => [...document.querySelectorAll('#guide img[data-img]')].filter((i) => !i.src).length);
    if (sinImg) mal(`${j.nombre}: la guía tiene ${sinImg} capturas sin cargar`);
    await page.keyboard.press('Escape');
    await page.click('#ver');
    if (!(await page.locator('#ver-log li').count())) mal(`${j.nombre}: el apartado Novedades está vacío`);
    await page.close();
    if (consola.length) mal(`${j.nombre}: consola del navegador:\n      ` + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ ${j.nombre}: mismos resultados, ${Object.keys(j.esp).length} ejercicios abiertos, guía y novedades sin errores de consola`);
  }
  // magnetostática: mismos resultados en la página, cada ejemplo abierto sin errores de consola
  {
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'magnetostatica', 'index.html'));
    await page.waitForFunction(() => window.MagApp);
    compararMag(await page.evaluate(`(${resolverMag})(Magneto, MagEjemplos)`), 'Chromium · Magnetostática');
    for (const k of Object.keys(espMag)) {
      await page.evaluate((c) => MagApp.abrirEjemplo(c), k);
      const warn = await page.locator('.result .warn').allTextContents();
      if (warn.length) mal(`Magnetostática · ${k}: ${warn.join(' · ')}`);
    }
    const ver = await page.locator('#ver').textContent();
    if (ver !== Version.de('magnetostatica').current) mal(`Magnetostática: la página muestra la versión «${ver}», se esperaba ${Version.de('magnetostatica').current}`);
    await page.close();
    if (consola.length) mal('Magnetostática: consola del navegador:\n      ' + consola.join('\n      '));
  }
  // tabla periódica: todos los modos de color y la ficha de varios elementos sin errores de consola
  {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'quimica', 'tabla-periodica', 'index.html') + '#Cu');
    await page.waitForFunction(() => window.TablaApp);
    const antes = fallos;
    if (!(await page.locator('#ficha').textContent()).includes('Cobre')) mal('Tabla periódica: #Cu no abre la ficha del cobre');
    const verT = (await page.locator('#ver').textContent()).trim();
    if (verT !== Version.de('tabla-periodica').current) mal(`Tabla periódica: la página muestra la versión «${verT}», se esperaba ${Version.de('tabla-periodica').current}`);
    if ((await page.locator('.el:not(.hueco)').count()) !== 118) mal('Tabla periódica: no se dibujan las 118 casillas');
    for (const m of ['en', 'ei', 'radio', 'masa', 'bloque', 'estado', 'cat']) await page.evaluate((m) => TablaApp.colorea(m), m);
    for (const z of [1, 26, 57, 92, 118]) await page.evaluate((z) => TablaApp.elige(z), z);
    await page.fill('#buscar', 'hierro');
    if (!(await page.locator('#ficha').textContent()).includes('Hierro')) mal('Tabla periódica: buscar «hierro» no abre su ficha');
    await page.close();
    if (consola.length) mal('Tabla periódica: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log('  ✓ Tabla periódica: 118 casillas, colores, fichas y buscador sin errores de consola');
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'fisica', 'trabajo-y-energia', 'index.html'));
    await page.waitForFunction(() => window.EnergiaApp);
    const antes = fallos;
    const verE = (await page.locator('#ver').textContent()).trim();
    if (verE !== Version.de('trabajo-y-energia').current) mal(`Trabajo y energía: la página muestra la versión «${verE}», se esperaba ${Version.de('trabajo-y-energia').current}`);
    for (const e of Energia.ejemplos) {
      await page.evaluate((c) => { EnergiaApp.abrirEjemplo(c); EnergiaApp.ir(EnergiaApp.fin() / 2); EnergiaApp.ir(EnergiaApp.fin()); }, e.clave);
      if ((await page.locator('#pasos li').count()) < 2) mal(`Trabajo y energía · ${e.clave}: no aparece el desarrollo`);
    }
    await page.click('#play'); await page.waitForTimeout(300); await page.click('#play');
    await page.fill('#c-m', 'x');
    if (await page.locator('#error').isHidden()) mal('Trabajo y energía: una masa no numérica no muestra el error');
    await page.close();
    if (consola.length) mal('Trabajo y energía: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Trabajo y energía: ${Energia.ejemplos.length} ejemplos, animación y errores de datos sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'quimica', 'masa-molar', 'index.html'));
    await page.waitForFunction(() => window.MasaApp);
    const antes = fallos;
    const verM = (await page.locator('#ver').textContent()).trim();
    if (verM !== Version.de('masa-molar').current) mal(`Masa molar: la página muestra la versión «${verM}», se esperaba ${Version.de('masa-molar').current}`);
    await page.evaluate(() => MasaApp.pestana('masa'));
    await page.fill('#formula', 'H2SO4');
    if (!(await page.locator('#res-masa').textContent()).includes('98,072')) mal('Masa molar: H2SO4 no da 98,072 g/mol');
    await page.fill('#cv-g', '49');
    if ((await page.inputValue('#cv-mol')) !== '0,4996') mal(`Masa molar: 49 g de H2SO4 dan ${await page.inputValue('#cv-mol')} mol, se esperaba 0,4996`);
    for (const e of Formulas.ejemplos) {
      await page.evaluate((c) => MasaApp.abrirEjemplo(c), e.clave);
      if (!(await page.locator('#tabla-este tr.lim').count())) mal(`Estequiometría · ${e.clave}: no se marca el reactivo limitante`);
    }
    await page.fill('#ecuacion', 'Co + O2 ->');
    if (await page.locator('#error-este').isHidden()) mal('Estequiometría: una reacción incompleta no muestra el error');
    await page.close();
    if (consola.length) mal('Masa molar: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Masa molar y estequiometría: fórmula, conversor y ${Formulas.ejemplos.length} reacciones sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'quimica', 'configuracion-electronica', 'index.html') + '#Cu');
    await page.waitForFunction(() => window.ConfigApp);
    const antes = fallos;
    const verC = (await page.locator('#ver').textContent()).trim();
    if (verC !== Version.de('configuracion-electronica').current) mal(`Configuración: la página muestra la versión «${verC}», se esperaba ${Version.de('configuracion-electronica').current}`);
    if ((await page.locator('#abreviada').textContent()) !== '[Ar] 4s¹ 3d¹⁰' || (await page.locator('#excepcion').isHidden())) mal('Configuración: #Cu no muestra el cobre con su excepción');
    for (const x of [...Configuracion.ejemplos, '118', 'H']) await page.evaluate((x) => ConfigApp.muestra(x), x);
    await page.evaluate(() => ConfigApp.muestra('Fe'));
    if ((await page.locator('#orbitales .caja').count()) !== 15) mal('Configuración: el hierro debería tener 15 orbitales dibujados');
    await page.fill('#entrada', 'Qq');
    if (await page.locator('#error').isHidden()) mal('Configuración: un símbolo que no existe no muestra el error');
    await page.close();
    if (consola.length) mal('Configuración: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log('  ✓ Configuración electrónica: dirección #Cu, ejemplos y errores sin errores de consola');
  }
  // portada y páginas de asignatura: sin errores de consola y sin enlaces internos rotos
  const portal = ['index.html', ...Catalogo.asignaturas.map((a) => `${a.clave}/index.html`), 'electromagnetismo/magnetostatica/index.html', 'quimica/tabla-periodica/index.html', 'fisica/trabajo-y-energia/index.html', 'quimica/masa-molar/index.html', 'quimica/configuracion-electronica/index.html'];
  const antes = fallos;
  for (const f of portal) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, f));
    const enlaces = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href).filter((u) => u.startsWith('file:')));
    for (const u of enlaces) {
      const destino = decodeURIComponent(new URL(u).pathname), archivo = destino.endsWith('/') ? destino + 'index.html' : destino;
      if (!fs.existsSync(archivo)) mal(`${f}: enlace roto a ${path.relative(publico, archivo)}`);
    }
    if (f === 'index.html') {
      await page.fill('#buscar', 'biot savart');
      const vis = await page.locator('[data-buscar]:visible').count();
      if (vis !== 1) mal(`portada: buscar «biot savart» deja ${vis} herramientas, se esperaba 1`);
    }
    await page.close();
    if (consola.length) mal(`${f}: consola del navegador:\n      ` + consola.join('\n      '));
  }
  if (fallos === antes) console.log(`  ✓ Portada, ${Catalogo.asignaturas.length} asignaturas y las herramientas sin errores de consola ni enlaces rotos`);
  await browser.close();
}

(args.includes('--sin-navegador') ? Promise.resolve() : navegador()).then(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fallos ? `\n✗ ${fallos} fallo(s)` : '\n✓ Todo correcto');
  process.exit(fallos ? 1 : 0);
}, (e) => { console.error(e); process.exit(1); });
