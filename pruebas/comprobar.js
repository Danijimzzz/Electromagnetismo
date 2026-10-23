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
const Condensador = require(path.join(fuente, 'condensadores', 'fisica.js'));
{
  // capacidades comprobadas a mano (ε0 = 8,8541878128·10⁻¹² F/m) y coherencia de cada solución
  const antes = fallos;
  const C = { 'plano-lleno': 2.2135e-10, 'plano-lamina': 7.0834e-11, 'plano-mitad': 1.7708e-10, 'dos-capas': 5.3125e-11, coaxial: 1.0214e-10, esferico: 1.7974e-11 };
  for (const e of Condensador.ejemplos) {
    const r = Condensador.resolver(e.sc);
    if (!(Math.abs(r.C / C[e.clave] - 1) < 2e-4)) mal(`Condensadores · ${e.clave}: C = ${r.C}, se esperaba ${C[e.clave]}`);
    if (Math.abs(r.Q - r.C * r.V) > 1e-9 * Math.abs(r.Q)) mal(`Condensadores · ${e.clave}: Q ≠ C V`);
    if (r.g.disposicion === 'serie') {
      const sumaV = r.regiones.reduce((s, o) => s + o.V, 0);
      if (Math.abs(sumaV - r.V) > 1e-9 * r.V) mal(`Condensadores · ${e.clave}: las tensiones de las capas suman ${sumaV}, no ${r.V}`);
    } else {
      const sumaQ = r.regiones.reduce((s, o) => s + o.Q, 0);
      if (Math.abs(sumaQ - r.Q) > 1e-9 * r.Q) mal(`Condensadores · ${e.clave}: las cargas de las partes suman ${sumaQ}, no ${r.Q}`);
    }
  }
  const l = Condensador.resolver(Condensador.ejemplos[0].sc);
  if (Math.abs(l.regiones[0].E1 - 5e4) > 1e-6 || Math.abs(l.regiones[0].Qp - 0.8 * l.Q) > 1e-18) mal('Condensadores · plano lleno: E debería ser 50 kV/m y Q_p = 0,8 Q');
  for (const mala of [{ geo: 'plano', S: 'x', d: '1' }, { geo: 'esfera', a: '5', b: '3' }, { geo: 'plano', S: '1', d: '1', capas: [{ t: '2', er: '3' }] }, { geo: 'plano', S: '1', d: '1', capas: [{ t: '0.5', er: '0.5' }] }]) {
    let ok = false; try { Condensador.resolver({ ...mala, fuente: 'V', V: '1' }); } catch (e) { ok = true; } if (!ok) mal(`Condensadores: ${JSON.stringify(mala)} debería dar un error`);
  }
  if (fallos === antes) console.log(`  ✓ Condensadores: ${Condensador.ejemplos.length} ejemplos con la capacidad esperada, Q = CV y tensiones o cargas que cuadran`);
}

const Cinematica = require(path.join(fuente, 'tiro-parabolico', 'fisica.js'));
{
  // resultados con las fórmulas del tiro sin rozamiento, límites del rozamiento y MRUA
  const antes = fallos, g = 9.81, cerca = (a, b, tol = 1e-4) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  const ESP = {
    clasico: { tv: (2 * 20 * Math.SQRT1_2) / g, alcance: 400 / g, hmax: 200 / (2 * g) },
    horizontal: { tv: Math.sqrt(40 / g), alcance: 15 * Math.sqrt(40 / g), hmax: 20 },
    'caida-libre': { tv: Math.sqrt(90 / g), alcance: 0, vf: Math.sqrt(2 * g * 45) },
    plataforma: { tv: (18 * Math.sin(Math.PI / 3) + Math.sqrt((18 * Math.sin(Math.PI / 3)) ** 2 - 2 * g * 5)) / g },
  };
  for (const e of Cinematica.ejemplos) {
    const r = Cinematica.resolver(e.sc).res;
    for (const [k, v] of Object.entries(ESP[e.clave] || {})) if (!cerca(r[k], v)) mal(`Tiro · ${e.clave}: ${k} = ${r[k]}, se esperaba ${v}`);
    const tr = Cinematica.trayectoria(e.sc), fin = tr.puntos[tr.puntos.length - 1];
    if (Math.abs(fin.y - (e.sc.yf || 0)) > 1e-3) mal(`Tiro · ${e.clave}: la trayectoria acaba en y = ${fin.y}`);
    if (e.sc.modelo !== 'ninguno' && !(r.alcance < r.alcanceIdeal)) mal(`Tiro · ${e.clave}: con rozamiento debería llegar menos lejos`);
  }
  // los dos ángulos del blanco aciertan de verdad
  const bl = Cinematica.ejemplos.find((e) => e.clave === 'blanco');
  const angs = Cinematica.resolver(bl.sc).res.blanco.angulos || [];
  if (angs.length !== 2) mal('Tiro · blanco: deberían salir dos ángulos');
  for (const a of angs) { const d = Cinematica.resolver({ ...bl.sc, ang: a }).res.blanco.dif; if (Math.abs(d) > 1e-6) mal(`Tiro · blanco: con α = ${a}° falla por ${d} m`); }
  // rozamiento casi nulo ≈ sin rozamiento; caída larga → velocidad límite
  const base = { v0: 20, ang: 45, y0: 0, g };
  for (const m of [{ modelo: 'lineal', b: 1e-7 }, { modelo: 'cuadratico', c: 1e-9 }]) { const r = Cinematica.resolver({ ...base, ...m }).res; if (!cerca(r.alcance, 400 / g, 1e-5)) mal(`Tiro · ${m.modelo} casi nulo: alcance ${r.alcance}`); }
  const caida = { v0: 0, ang: 0, y0: 5000, g };
  const vl = Cinematica.resolver({ ...caida, modelo: 'lineal', b: 0.5 }).res.vf, vc = Cinematica.resolver({ ...caida, modelo: 'cuadratico', c: 0.01 }).res.vf;
  if (!cerca(vl, g / 0.5, 1e-6)) mal(`Tiro · lineal: velocidad límite ${vl}, se esperaba ${g / 0.5}`);
  if (!cerca(vc, Math.sqrt(g / 0.01), 1e-4)) mal(`Tiro · cuadrático: velocidad límite ${vc}, se esperaba ${Math.sqrt(g / 0.01)}`);
  for (const mala of [{ ...base, v0: 'x' }, { ...base, ang: 100 }, { ...base, yf: 50 }, { ...base, g: 0 }, { ...base, modelo: 'lineal', b: '' }, { v0: 10, ang: -30, y0: 0, g }]) {
    let ok = false; try { Cinematica.resolver(mala); } catch (e) { ok = true; } if (!ok) mal(`Tiro: ${JSON.stringify(mala)} debería dar un error`);
  }
  const R = Object.fromEntries(Cinematica.ejemplosRecta.map((e) => [e.clave, Cinematica.rectilineo(e.sc).res]));
  if (!cerca(R.frenada.tParada, 5) || !cerca(R.frenada.xParada, 62.5)) mal('MRUA · frenada: debería pararse en t = 5 s y x = 62,5 m');
  if (R.arranque.tEnX.length !== 1 || !cerca(R.arranque.tEnX[0], 10)) mal('MRUA · arranque: debería llegar a 100 m en t = 10 s');
  if (!cerca(R.mru.xEnT, 70) || !cerca(R.mru.vEnT, 12)) mal('MRU: en t = 5 s debería estar en x = 70 m');
  if (R.vertical.tEnX.length !== 2 || !cerca(R.vertical.tEnX[1], 40 / g)) mal('MRUA · vertical: debería volver al suelo en t = 2 v0 / g');
  if (fallos === antes) console.log(`  ✓ Tiro parabólico: ${Cinematica.ejemplos.length} tiros con los resultados de las fórmulas, el blanco, el rozamiento y ${Cinematica.ejemplosRecta.length} movimientos rectilíneos`);
}

global.Formulas = Formulas;
const Disoluciones = require(path.join(fuente, 'quimica', 'disoluciones.js'));
{
  // valores calculados aquí a mano a partir de las masas molares, y vuelta atrás desde cada forma
  const antes = fallos, cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  const Mm = (x) => Formulas.masaMolar(x).M, W = Mm('H2O');
  const ESP = {
    sulfurico: { M: (1840 * 0.98) / Mm('H2SO4'), m: (98 / Mm('H2SO4')) / 0.002, x: (98 / Mm('H2SO4')) / (98 / Mm('H2SO4') + 2 / W) },
    clorhidrico: { M: (1190 * 0.37) / Mm('HCl') },
    suero: { M: 9 / Mm('NaCl'), mm: 0.9 / 1.005 },
    glucosa: { mm: (100 * 0.5 * Mm('C6H12O6')) / (1000 + 0.5 * Mm('C6H12O6')) },
    etanol: { mm: (100 * 0.1 * Mm('C2H5OH')) / (0.1 * Mm('C2H5OH') + 0.9 * W) },
  };
  for (const e of Disoluciones.ejemplos) {
    const r = Disoluciones.concentracion(e.sc);
    for (const [k, v] of Object.entries(ESP[e.clave] || {})) if (!cerca(r.valores[k], v)) mal(`Disoluciones · ${e.clave}: ${k} = ${r.valores[k]}, se esperaba ${v}`);
    if (e.clave === 'glucosa' && r.faltan.join() !== 'M,gL,mv') mal(`Disoluciones · glucosa: sin densidad deberían faltar M, g/L y % m/v, faltan ${r.faltan}`);
    // partiendo de cualquiera de las otras formas sale la misma disolución
    for (const k of Object.keys(Disoluciones.TIPOS)) {
      if (!(k in r.valores) || k === e.sc.tipo) continue;
      const otra = Disoluciones.concentracion({ ...e.sc, tipo: k, valor: String(r.valores[k]) }).valores;
      for (const q of Object.keys(r.valores)) if (!cerca(otra[q], r.valores[q], 1e-8)) mal(`Disoluciones · ${e.clave}: desde ${k}, ${q} = ${otra[q]} en vez de ${r.valores[q]}`);
    }
  }
  const P = Object.fromEntries(Disoluciones.ejemplosPreparar.map((e) => [e.clave, Disoluciones.preparar(e.sc)]));
  if (!cerca(P.nacl.mPesar, (0.025 * Mm('NaCl')) / 0.995)) mal(`Disoluciones · preparar NaCl: ${P.nacl.mPesar} g`);
  if (!cerca(P.hcl.Vcomercial, (0.25 * Mm('HCl')) / 0.37 / 1.19)) mal(`Disoluciones · preparar HCl: ${P.hcl.Vcomercial} mL`);
  if (!cerca(P.hcl.Mcomercial * P.hcl.Vcomercial, 0.5 * 500)) mal('Disoluciones · preparar HCl: no cumple C₁V₁ = C₂V₂');
  if (!cerca(Disoluciones.diluir({ C1: '12', V1: '', C2: '0,5', V2: '250' }).V1, (0.5 * 250) / 12)) mal('Disoluciones: la dilución no da V₁ = 10,42 mL');
  if (!cerca(Disoluciones.diluir({ C1: '2', V1: '50', C2: '', V2: '200' }).C2, 0.5)) mal('Disoluciones: la dilución no da C₂ = 0,5');
  if (!cerca(Disoluciones.mezclar({ C1: '1', V1: '100', C2: '0.25', V2: '300' }).C, 0.4375)) mal('Disoluciones: la mezcla no da 0,4375');
  const malas = [() => Disoluciones.concentracion({ soluto: 'NaCl', tipo: 'mm', valor: '120' }), () => Disoluciones.concentracion({ soluto: '', tipo: 'M', valor: '1' }),
    () => Disoluciones.concentracion({ soluto: 'Xx', tipo: 'M', valor: '1' }), () => Disoluciones.concentracion({ soluto: 'HCl', tipo: 'M', valor: '18', densidad: '0.5' }),
    () => Disoluciones.diluir({ C1: '1', V1: '', C2: '', V2: '1' }), () => Disoluciones.diluir({ C1: '1', V1: '10', C2: '2', V2: '' }),
    () => Disoluciones.preparar({ soluto: 'HCl', M: '15', V: '100', origen: 'comercial', riqueza: '37', densidad: '1.19' })];
  malas.forEach((fn, i) => { let ok = false; try { fn(); } catch (e) { ok = true; } if (!ok) mal(`Disoluciones: el caso erróneo ${i + 1} debería dar un error`); });
  if (fallos === antes) console.log(`  ✓ Disoluciones: ${Disoluciones.ejemplos.length} concentraciones con los valores esperados y la vuelta desde cada forma, ${Disoluciones.ejemplosPreparar.length} preparaciones, diluciones, mezclas y errores`);
}

const Calor = require(path.join(fuente, 'calorimetria', 'fisica.js'));
{
  // equilibrios resueltos a mano (c agua 4180, hielo 2090, vapor 2010; Lf 334 kJ/kg; Lv 2257 kJ/kg) y Σ Q = 0
  const antes = fallos, cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  const R = Object.fromEntries(Calor.ejemplos.map((e) => [e.clave, Calor.equilibrio(e)]));
  const ESP = {
    'hielo-agua': (0.2 * 4180 * 40 - 0.05 * 2090 * 10 - 0.05 * 334e3) / (0.25 * 4180),
    'sobra-hielo': 0,
    'cobre-agua': (0.2 * 385 * 100 + 0.3 * 4180 * 20) / (0.2 * 385 + 0.3 * 4180),
    calorimetro: (0.15 * 900 * 90 + (0.25 * 4180 + 125) * 18) / (0.15 * 900 + 0.25 * 4180 + 125),
    vapor: (0.01 * 2257e3 + 0.01 * 4180 * 100 + 0.2 * 4180 * 20) / (0.21 * 4180),
    'plomo-fundido': (0.5 * 142 * (400 - 327.5) + 0.5 * 23e3 + 0.5 * 128 * 327.5 + 1 * 4180 * 15) / (0.5 * 128 + 4180),
  };
  for (const [k, Te] of Object.entries(ESP)) {
    const r = R[k];
    if (!cerca(r.Te, Te)) mal(`Calorimetría · ${k}: T_e = ${r.Te}, se esperaba ${Te}`);
    const suma = r.cuerpos.reduce((s, c) => s + c.Q, 0);
    if (Math.abs(suma) > 1e-6 * Math.max(1, r.absorbido)) mal(`Calorimetría · ${k}: Σ Q = ${suma} J`);
    for (const c of r.cuerpos) { const qe = c.etapas.reduce((s, e) => s + e.Q, 0); if (!cerca(qe, c.Q)) mal(`Calorimetría · ${k}: las etapas de ${c.nombre} suman ${qe}, no ${c.Q}`); }
  }
  const fundido = (0.1 * 4180 * 20) / 334e3;
  if (!cerca(R['sobra-hielo'].cuerpos[0].fraccion, fundido / 0.1)) mal(`Calorimetría · sobra-hielo: se funde una fracción ${R['sobra-hielo'].cuerpos[0].fraccion}, se esperaba ${fundido / 0.1}`);
  if (R['sobra-hielo'].cuerpos[1].fraccion !== 1) mal('Calorimetría · sobra-hielo: el agua templada no debería congelarse');
  // hielo muy frío que congela toda el agua: el equilibrio baja de 0 °C
  const frio = Calor.equilibrio({ cuerpos: [{ sustancia: 'agua', m: '500', T0: '-50' }, { sustancia: 'agua', m: '100', T0: '10' }] });
  if (!cerca(frio.Te, (0.1 * 4180 * 10 + 0.1 * 334e3 - 0.5 * 2090 * 50) / (0.6 * 2090))) mal(`Calorimetría: hielo a −50 °C con agua a 10 °C da ${frio.Te}`);
  const malas = [{ cuerpos: [{ sustancia: 'agua', m: '10', T0: '20' }] }, { cuerpos: [{ sustancia: 'agua', m: '-1', T0: '20' }, { sustancia: 'agua', m: '1', T0: '0' }] },
    { cuerpos: [{ sustancia: 'agua', m: '10', T0: '50', estado: 'solido' }, { sustancia: 'agua', m: '1', T0: '0' }] }, { cuerpos: [{ sustancia: 'agua', m: '10', T0: '-300' }, { sustancia: 'agua', m: '1', T0: '0' }] },
    { cuerpos: [{ sustancia: 'calorimetro', C: '100', T0: '20' }, { sustancia: 'calorimetro', C: '10', T0: '50' }] }];
  for (const m of malas) { let ok = false; try { Calor.equilibrio(m); } catch (e) { ok = true; } if (!ok) mal(`Calorimetría: ${JSON.stringify(m.cuerpos)} debería dar un error`); }
  if (fallos === antes) console.log(`  ✓ Calorimetría: ${Calor.ejemplos.length} equilibrios con la temperatura esperada, Σ Q = 0, fases parciales y errores`);
}

const Induccion = require(path.join(fuente, 'induccion', 'fisica.js'));
{
  // coeficientes resueltos a mano (μ0 = 4π·10⁻⁷)
  const antes = fallos, cerca = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.abs(b), m0 = 4e-7 * Math.PI;
  const L = Object.fromEntries(Induccion.ejemplos.L.map((e) => [e.clave, Induccion.autoinduccion(e.sc).res]));
  const M = Object.fromEntries(Induccion.ejemplos.M.map((e) => [e.clave, Induccion.mutua(e.sc).res]));
  const ESP = {
    'L solenoide': [L.solenoide.L, (m0 * 500 ** 2 * Math.PI * 0.01 ** 2) / 0.2], 'L energía': [L.solenoide.U, 0.5 * L.solenoide.L * 4], 'L fem': [L.solenoide.fem, -100 * L.solenoide.L],
    'L solenoide-hierro': [L['solenoide-hierro'].L, (m0 * 800 * 300 ** 2 * Math.PI * 0.015 ** 2) / 0.15],
    'L toroide-rect': [L['toroide-rect'].L, (m0 * 1e6 * 0.02 * Math.log(8 / 5)) / (2 * Math.PI)],
    'L toroide-circ': [L['toroide-circ'].L, m0 * 200 ** 2 * (0.1 - Math.sqrt(0.01 - 0.0004))],
    'L coaxial': [L.coaxial.L, (m0 * Math.log(4)) / (2 * Math.PI) + m0 / (8 * Math.PI)],
    'L bifilar': [L.bifilar.L, (m0 * Math.log(9)) / Math.PI],
    'M solenoides': [M.solenoides.M, (m0 * 200 * 1000 * Math.PI * 1e-4) / 0.4],
    'M espiras': [M.espiras.M, (m0 * 10 * Math.PI * 1e-4) / 0.4],
    'M hilo-espira': [M['hilo-espira'].M, (m0 * 0.2 * Math.log(3)) / (2 * Math.PI)],
    'M toroide-bobina k': [M['toroide-bobina'].M / Math.sqrt(M['toroide-bobina'].L1 * M['toroide-bobina'].L2), 1],
    'M acoplamiento': [M.acoplamiento.M, 0.5 * Math.sqrt(2e-3 * 8e-3)],
  };
  for (const [k, [v, e]] of Object.entries(ESP)) if (!cerca(v, e)) mal(`Inducción · ${k}: ${v}, se esperaba ${e}`);
  const c = Induccion.rl(Induccion.ejemplos.RL[0].sc).res, d = Induccion.rl(Induccion.ejemplos.RL[1].sc).res;
  if (!cerca(c.tau, 0.05) || !cerca(c.I0, 2) || !cerca(c.It, 2 * (1 - Math.exp(-1))) || !cerca(c.VLt + c.VRt, 12)) mal(`Inducción · RL carga: ${JSON.stringify(c)}`);
  if (!cerca(d.tau, 0.005) || !cerca(d.It, 0.1 * Math.exp(-0.4)) || !cerca(d.VLt, -d.VRt)) mal(`Inducción · RL descarga: ${JSON.stringify(d)}`);
  const malas = [() => Induccion.autoinduccion({ geo: 'solenoide', N: '10.5', l: '10', r: '1', mur: '1' }), () => Induccion.autoinduccion({ geo: 'coaxial', l: '1', a: '4', b: '2' }),
    () => Induccion.autoinduccion({ geo: 'bifilar', l: '1', d: '1', a: '1' }), () => Induccion.mutua({ geo: 'acoplamiento', L1: '1', L2: '1', k: '1.2' }), () => Induccion.rl({ E: '1', R: '0', L: '1' })];
  for (const m of malas) { let ok = false; try { m(); } catch (e) { ok = true; } if (!ok) mal(`Inducción: ${m} debería dar un error`); }
  if (fallos === antes) console.log(`  ✓ Inducción: ${Induccion.ejemplos.L.length} autoinducciones, ${Induccion.ejemplos.M.length} inducciones mutuas y ${Induccion.ejemplos.RL.length} circuitos RL con el valor esperado, y errores`);
}

global.Algebra = require(path.join(fuente, 'matematicas', 'algebra.js'));
const Matrices = require(path.join(fuente, 'matrices', 'calculo.js'));
{
  // resultados resueltos a mano y comprobaciones cruzadas (A·A⁻¹ = I, A v = λ v, mismos determinantes por los dos métodos)
  const antes = fallos, Al = Algebra, L = (...f) => Al.leerMatriz(f.map((x) => x.split(' ')));
  const R = Object.fromEntries(Matrices.ejemplos.map((e) => [e.clave, Matrices.resolver(e.sc)]));
  const esp = { det3: '−19', det4: '30', 'det-gauss': '30' };
  for (const [k, v] of Object.entries(esp)) if (Al.txt(R[k].valor) !== v) mal(`Matrices · ${k}: |A| = ${Al.txt(R[k].valor)}, se esperaba ${v}`);
  for (const e of Matrices.ejemplos.filter((x) => x.sc.op === 'det')) {
    const otro = Matrices.resolver({ ...e.sc, metodo: e.sc.metodo === 'gauss' ? 'directo' : 'gauss' }).valor;
    if (!Al.igual(otro, R[e.clave].valor)) mal(`Matrices · ${e.clave}: Gauss y Sarrus/Laplace no dan lo mismo`);
  }
  if (!Al.iguales(R.inv3.valor, L('-24 18 5', '20 -15 -4', '-5 4 1'))) mal('Matrices · inv3: la inversa no es la esperada');
  for (const e of Matrices.ejemplos.filter((x) => x.sc.op === 'inversa')) {
    const A = Al.leerMatriz(e.sc.A), inv = R[e.clave].valor;
    if (!inv || !Al.iguales(Al.producto(A, inv), Al.identidad(A.length))) mal(`Matrices · ${e.clave}: A·A⁻¹ no es la identidad`);
    const otro = Matrices.resolver({ ...e.sc, metodo: e.sc.metodo === 'gauss' ? 'adjuntos' : 'gauss' }).valor;
    if (!Al.iguales(otro, inv)) mal(`Matrices · ${e.clave}: Gauss-Jordan y adjuntos no dan la misma inversa`);
  }
  if (!Al.iguales(R['inv-complejos'].valor, L('2 -i', 'i 1'))) mal('Matrices · inversa compleja incorrecta');
  if (R.rango.valor !== 2) mal(`Matrices · rango: ${R.rango.valor}, se esperaba 2`);
  if (!Al.iguales(R.reducida.valor, L('1 0 -1 0', '0 1 2 0', '0 0 0 1'))) mal('Matrices · escalonada reducida incorrecta');
  if (Matrices.resolver({ op: 'inversa', A: [['1', '2'], ['2', '4']] }).valor !== null) mal('Matrices: una matriz singular no debería tener inversa');
  const propios = { propios2: ['2', '5'], diagonalizar: ['−5', '2', '5'], rotacion: ['i', '−i'] };
  for (const [k, v] of Object.entries(propios)) {
    const vals = R[k].valor.map((x) => Al.txt(x.valor));
    if (vals.join() !== v.join()) mal(`Matrices · ${k}: λ = ${vals}, se esperaba ${v}`);
    if (!R[k].diag) mal(`Matrices · ${k}: debería ser diagonalizable`);
  }
  for (const k of Object.keys(propios)) {
    const A = Al.leerMatriz(Matrices.ejemplos.find((e) => e.clave === k).sc.A);
    for (const v of R[k].valor) { const N = Al.nucleo(Al.restaM(A, Al.escalar(v.valor, Al.identidad(A.length)))); for (const b of N.base) { const Av = Al.producto(A, b.map((x) => [x])), lv = b.map((x) => [Al.mul(v.valor, x)]); if (!Al.iguales(Av, lv)) mal(`Matrices · ${k}: A v ≠ λ v`); } }
  }
  if (Matrices.resolver({ op: 'propios', A: [['2', '1'], ['0', '2']] }).diag !== false) mal('Matrices: [[2,1],[0,2]] no es diagonalizable');
  if (!Matrices.resolver({ op: 'propios', A: [['1', '2'], ['3', '4']] }).res.includes('(5 + √33)/2')) mal('Matrices: los valores propios de [[1,2],[3,4]] deberían salir con radicales');
  if (!Al.iguales(R.producto.valor, L('2 -1', '6 2')) || !Al.iguales(R.potencia.valor, L('1 5', '0 1'))) mal('Matrices: producto o potencia incorrectos');
  for (const [s, v] of [['-1/2', '−1/2'], ['0,25', '1/4'], ['(1+i)/2', '1/2 + 1/2·i'], ['3(1-i)', '3 − 3i'], ['1/(1+i)', '1/2 − 1/2·i']]) if (Al.txt(Al.leer(s)) !== v) mal(`Matrices: «${s}» se lee como ${Al.txt(Al.leer(s))}`);
  const malas = [{ op: 'det', A: [['1', '2', '3'], ['4', '5', '6']] }, { op: 'producto', A: [['1', '2']], B: [['1', '2']] }, { op: 'det', A: [['1', 'x'], ['2', '3']] }, { op: 'suma', A: [['1']], B: [['1', '2']] }, { op: 'potencia', A: [['1', '2'], ['2', '4']], n: '-1' }];
  for (const m of malas) { let ok = false; try { Matrices.resolver(m); } catch (e) { ok = true; } if (!ok) mal(`Matrices: ${JSON.stringify(m)} debería dar un error`); }
  if (fallos === antes) console.log(`  ✓ Matrices: ${Matrices.ejemplos.length} ejemplos con el resultado esperado, inversas y determinantes por los dos métodos, A v = λ v, lectura de números y errores`);
}

const Sistemas = require(path.join(fuente, 'sistemas', 'calculo.js'));
{
  // soluciones resueltas a mano; cada solución se sustituye en el sistema (también con los parámetros a 1 y a 2)
  const antes = fallos, Al = Algebra;
  const R = Object.fromEntries(Sistemas.ejemplos.map((e) => [e.clave, Sistemas.resolver(e.sc)]));
  const tipos = { scd: 'SCD', cramer: 'SCD', sci: 'SCI', sci2: 'SCI', si: 'SI', homogeneo: 'SCI', inversa: 'SCD', fracciones: 'SCD', complejo: 'SCD', mallas: 'SCD' };
  for (const [k, t] of Object.entries(tipos)) if (R[k].tipo !== t) mal(`Sistemas · ${k}: ${R[k].tipo}, se esperaba ${t}`);
  const unicas = { scd: ['2', '3', '−1'], cramer: ['5', '3', '−2'], inversa: ['1', '3'], fracciones: ['20/7', '−9/7'], complejo: ['2 + i', '1 − i'], mallas: ['25/14 − 15/14·i', '15/14 + 15/14·i'] };
  for (const [k, v] of Object.entries(unicas)) { const x = R[k].sol.map((s) => Al.txt(s.c)); if (x.join() !== v.join()) mal(`Sistemas · ${k}: (${x}), se esperaba (${v})`); }
  for (const e of Sistemas.ejemplos) {
    const r = R[e.clave];
    if (r.tipo === 'SI') continue;
    const M = Al.leerMatriz(e.sc.M), n = M[0].length - 1;
    for (const p of [0, 1, 2]) {
      const x = r.sol.map((s) => s.t.reduce((acc, [a]) => Al.suma(acc, Al.mul(a, Al.ent(p))), s.c));
      if (!M.every((f) => Al.igual(f.slice(0, n).reduce((s, a, j) => Al.suma(s, Al.mul(a, x[j])), Al.c0), f[n]))) mal(`Sistemas · ${e.clave}: la solución con parámetros = ${p} no cumple el sistema`);
    }
    for (const m of ['gauss', 'jordan', 'cramer', 'inversa']) { const o = Sistemas.resolver({ ...e.sc, metodo: m }); if (o.tipo !== r.tipo || o.res !== r.res) mal(`Sistemas · ${e.clave}: el método ${m} da otro resultado`); }
  }
  if (R.sci.param.length !== 1 || R.sci2.param.length !== 2) mal('Sistemas: número de parámetros incorrecto');
  const malas = [{ M: [['1', 'x', '2']] }, { M: [['1', '2', '3']], vars: 'a, b, c' }, { M: [['1', '2', '3']], vars: 'a, a' }];
  for (const m of malas) { let ok = false; try { Sistemas.resolver(m); } catch (e) { ok = true; } if (!ok) mal(`Sistemas: ${JSON.stringify(m)} debería dar un error`); }
  if (fallos === antes) console.log(`  ✓ Sistemas: ${Sistemas.ejemplos.length} sistemas bien clasificados, soluciones esperadas que cumplen las ecuaciones, los cuatro métodos coinciden y errores`);
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
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'condensadores', 'index.html'));
    await page.waitForFunction(() => window.CondApp);
    const antes = fallos;
    const verK = (await page.locator('#ver').textContent()).trim();
    if (verK !== Version.de('condensadores').current) mal(`Condensadores: la página muestra la versión «${verK}», se esperaba ${Version.de('condensadores').current}`);
    for (const e of Condensador.ejemplos) {
      await page.evaluate((c) => CondApp.abrirEjemplo(c), e.clave);
      if ((await page.locator('#regiones tbody tr').count()) < 1 || (await page.locator('#pasos li').count()) < 3) mal(`Condensadores · ${e.clave}: faltan la tabla o el desarrollo`);
    }
    await page.click('#anade');
    await page.selectOption('#f-geo', 'cilindro');
    await page.fill('#f-a', '3'); await page.fill('#f-b', '1');
    if (await page.locator('#error').isHidden()) mal('Condensadores: radios al revés no muestran el error');
    await page.close();
    if (consola.length) mal('Condensadores: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Condensadores: ${Condensador.ejemplos.length} ejemplos, cambio de forma y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'fisica', 'tiro-parabolico', 'index.html'));
    await page.waitForFunction(() => window.TiroApp);
    const antes = fallos;
    const verT = (await page.locator('#ver').textContent()).trim();
    if (verT !== Version.de('tiro-parabolico').current) mal(`Tiro parabólico: la página muestra la versión «${verT}», se esperaba ${Version.de('tiro-parabolico').current}`);
    for (const e of Cinematica.ejemplos) {
      await page.evaluate((c) => { TiroApp.abrirEjemplo(c); TiroApp.ir(TiroApp.fin() / 2); TiroApp.ir(TiroApp.fin()); }, e.clave);
      if ((await page.locator('#pasos li').count()) < 4 || !(await page.locator('#error').isHidden())) mal(`Tiro parabólico · ${e.clave}: no aparece el desarrollo`);
    }
    for (const q of ['pos', 'acel']) await page.selectOption('#que', q);
    await page.selectOption('#campos-modelo', 'cuadratico');
    if ((await page.locator('#pasos li').count()) < 4) mal('Tiro parabólico: al cambiar a rozamiento cuadrático no aparece el desarrollo');
    await page.fill('#campos-v0', 'abc');
    if (await page.locator('#error').isHidden()) mal('Tiro parabólico: una velocidad no numérica no muestra el error');
    for (const e of Cinematica.ejemplosRecta) {
      await page.evaluate((c) => TiroApp.abrirEjemploR(c), e.clave);
      if ((await page.locator('#pasos-r li').count()) < 1 || (await page.locator('#panel-recta').isHidden())) mal(`Movimiento rectilíneo · ${e.clave}: no aparece el desarrollo`);
    }
    await page.click('#play-r'); await page.waitForTimeout(200); await page.click('#play-r');
    await page.close();
    if (consola.length) mal('Tiro parabólico: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Tiro parabólico: ${Cinematica.ejemplos.length} tiros, ${Cinematica.ejemplosRecta.length} movimientos rectilíneos, gráficas y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'quimica', 'disoluciones', 'index.html'));
    await page.waitForFunction(() => window.DisolApp);
    const antes = fallos;
    const verD = (await page.locator('#ver').textContent()).trim();
    if (verD !== Version.de('disoluciones').current) mal(`Disoluciones: la página muestra la versión «${verD}», se esperaba ${Version.de('disoluciones').current}`);
    for (const e of Disoluciones.ejemplos) {
      await page.evaluate((c) => DisolApp.abrirEjemplo(c), e.clave);
      if ((await page.locator('#valores .valor').count()) < 7 || (await page.locator('#pasos-conc li').count()) < 3) mal(`Disoluciones · ${e.clave}: faltan los valores o el desarrollo`);
    }
    await page.evaluate(() => DisolApp.abrirEjemplo('sulfurico'));
    if (!(await page.locator('#valores').textContent()).includes('18,39 mol/L')) mal('Disoluciones: el sulfúrico del 98 % no da 18,39 mol/L');
    await page.fill('#c-valor', '150');
    if (await page.locator('#error-conc').isHidden()) mal('Disoluciones: un 150 % no muestra el error');
    for (const e of Disoluciones.ejemplosPreparar) {
      await page.evaluate((c) => DisolApp.abrirEjemploP(c), e.clave);
      if ((await page.locator('#pasos-prep li').count()) < 3) mal(`Disoluciones · preparar ${e.clave}: no aparece el desarrollo`);
    }
    await page.evaluate(() => DisolApp.pestana('dil'));
    await page.fill('#d-C1', '2'); await page.fill('#d-V1', '50'); await page.fill('#d-C2', ''); await page.fill('#d-V2', '200');
    if (!(await page.locator('#res-dil').textContent()).includes('0,5')) mal('Disoluciones: la dilución en la página no da C₂ = 0,5');
    await page.close();
    if (consola.length) mal('Disoluciones: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Disoluciones: ${Disoluciones.ejemplos.length} concentraciones, ${Disoluciones.ejemplosPreparar.length} preparaciones y una dilución sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'fisica', 'calorimetria', 'index.html'));
    await page.waitForFunction(() => window.CalorApp);
    const antes = fallos;
    const verC = (await page.locator('#ver').textContent()).trim();
    if (verC !== Version.de('calorimetria').current) mal(`Calorimetría: la página muestra la versión «${verC}», se esperaba ${Version.de('calorimetria').current}`);
    for (const e of Calor.ejemplos) {
      await page.evaluate((c) => CalorApp.abrirEjemplo(c), e.clave);
      if ((await page.locator('#tabla tbody tr').count()) !== e.cuerpos.length + 1 || (await page.locator('#pasos li').count()) < 3) mal(`Calorimetría · ${e.clave}: faltan la tabla o el desarrollo`);
    }
    await page.evaluate(() => CalorApp.abrirEjemplo('hielo-agua'));
    if (!(await page.locator('#te').textContent()).includes('15,02')) mal('Calorimetría: hielo y agua no dan 15,02 °C en la página');
    await page.click('#anade');
    await page.selectOption('#c2-sustancia', 'otra');
    await page.fill('#c2-cl', '1000'); await page.fill('#c2-m', '100'); await page.fill('#c2-T0', '60');
    if (!(await page.locator('#error').isHidden())) mal('Calorimetría: una sustancia propia con c del líquido da error: ' + (await page.locator('#error').textContent()));
    await page.fill('#c0-m', 'x');
    if (await page.locator('#error').isHidden()) mal('Calorimetría: una masa no numérica no muestra el error');
    await page.close();
    if (consola.length) mal('Calorimetría: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Calorimetría: ${Calor.ejemplos.length} equilibrios, cuerpo propio y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'induccion', 'index.html'));
    await page.waitForFunction(() => window.InducApp);
    const antes = fallos;
    const verI = (await page.locator('#ver').textContent()).trim();
    if (verI !== Version.de('induccion').current) mal(`Inducción: la página muestra la versión «${verI}», se esperaba ${Version.de('induccion').current}`);
    for (const tab of ['L', 'M', 'RL']) for (const e of Induccion.ejemplos[tab]) {
      await page.evaluate(([t, c]) => InducApp.abrirEjemplo(t, c), [tab, e.clave]);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 1 || (await page.locator('#resumen > div').count()) < 3) mal(`Inducción · ${tab} ${e.clave}: falta el resumen o el desarrollo`);
    }
    await page.evaluate(() => InducApp.abrirEjemplo('L', 'solenoide'));
    if (!(await page.locator('#resumen').textContent()).includes('493,5 μH')) mal('Inducción: el solenoide de ejemplo no da 493,5 μH en la página');
    await page.selectOption('#f-geo', 'toroide-rect');
    if ((await page.locator('#f-b').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Inducción: al cambiar a toroide no aparecen sus datos');
    await page.fill('#f-b', '1');
    if (await page.locator('#error').isHidden()) mal('Inducción: un toroide con b < a no muestra el error');
    await page.click('#tab-RL');
    await page.fill('#f-t', '');
    if (!(await page.locator('#error').isHidden())) mal('Inducción: el circuito RL sin tiempo da error');
    await page.close();
    if (consola.length) mal('Inducción: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Inducción: ${Induccion.ejemplos.L.length + Induccion.ejemplos.M.length + Induccion.ejemplos.RL.length} ejemplos, cambio de geometría y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'matematicas', 'matrices', 'index.html'));
    await page.waitForFunction(() => window.MatricesApp);
    const antes = fallos;
    const verM = (await page.locator('#ver').textContent()).trim();
    if (verM !== Version.de('matrices').current) mal(`Matrices: la página muestra la versión «${verM}», se esperaba ${Version.de('matrices').current}`);
    for (const e of Matrices.ejemplos) {
      await page.evaluate((c) => MatricesApp.abrirEjemplo(c), e.clave);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 1) mal(`Matrices · ${e.clave}: falta el resultado o el desarrollo`);
    }
    await page.evaluate(() => MatricesApp.abrirEjemplo('det3'));
    if (!(await page.locator('#res').textContent()).includes('−19')) mal('Matrices: el determinante de ejemplo no da −19 en la página');
    await page.selectOption('#ed-A select[data-d="n"]', '2');
    await page.fill('#ed-A input[data-i="0"][data-j="1"]', '1/2+i');
    if (!(await page.locator('#error').isHidden())) mal('Matrices: un complejo en una casilla da error: ' + (await page.locator('#error').textContent()));
    await page.fill('#ed-A input[data-i="0"][data-j="0"]', 'abc');
    if (await page.locator('#error').isHidden()) mal('Matrices: una casilla con texto no muestra el error');
    await page.selectOption('#op', 'producto');
    if (await page.locator('#ed-B').isHidden()) mal('Matrices: el producto no muestra la matriz B');
    await page.close();
    if (consola.length) mal('Matrices: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Matrices: ${Matrices.ejemplos.length} ejemplos, cambio de tamaño, complejos y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'matematicas', 'sistemas', 'index.html'));
    await page.waitForFunction(() => window.SistemasApp);
    const antes = fallos;
    const verS = (await page.locator('#ver').textContent()).trim();
    if (verS !== Version.de('sistemas').current) mal(`Sistemas: la página muestra la versión «${verS}», se esperaba ${Version.de('sistemas').current}`);
    for (const e of Sistemas.ejemplos) {
      await page.evaluate((c) => SistemasApp.abrirEjemplo(c), e.clave);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 3) mal(`Sistemas · ${e.clave}: falta el resultado o el desarrollo`);
    }
    await page.evaluate(() => SistemasApp.abrirEjemplo('scd'));
    if (!(await page.locator('#res').textContent()).includes('z = −1')) mal('Sistemas: el ejemplo 3×3 no da z = −1 en la página');
    await page.selectOption('#ed select[data-d="n"]', '4');
    if ((await page.locator('#ed input').count()) !== 15) mal('Sistemas: al pasar a 4 incógnitas no hay 3×5 casillas');
    await page.fill('#ed input[data-i="0"][data-j="0"]', '2-i');
    if (!(await page.locator('#error').isHidden())) mal('Sistemas: un coeficiente complejo da error: ' + (await page.locator('#error').textContent()));
    await page.fill('#vars', 'a, b');
    if (await page.locator('#error').isHidden()) mal('Sistemas: dos nombres para cuatro incógnitas no muestran el error');
    await page.close();
    if (consola.length) mal('Sistemas: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Sistemas: ${Sistemas.ejemplos.length} sistemas, cambio de tamaño, complejos y errores sin errores de consola`);
  }
  // portada y páginas de asignatura: sin errores de consola y sin enlaces internos rotos
  const portal = ['index.html', ...Catalogo.asignaturas.map((a) => `${a.clave}/index.html`), 'electromagnetismo/magnetostatica/index.html', 'quimica/tabla-periodica/index.html', 'fisica/trabajo-y-energia/index.html', 'quimica/masa-molar/index.html', 'quimica/configuracion-electronica/index.html', 'electromagnetismo/condensadores/index.html', 'fisica/tiro-parabolico/index.html', 'quimica/disoluciones/index.html', 'fisica/calorimetria/index.html', 'electromagnetismo/induccion/index.html', 'matematicas/matrices/index.html', 'matematicas/sistemas/index.html'];
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
