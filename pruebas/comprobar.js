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
const Catalogo = require(path.join(fuente, 'catalogo.js')), Biblioteca = require(path.join(fuente, 'biblioteca.js'));
const PUBLICABLES = ['index.html', 'og.png', 'apple-touch-icon.png', 'legal.css', 'aviso-legal.html', 'privacidad.html', 'cookies.html', 'contacto.html', 'fuentes/stix-two-math.woff2', 'fuentes/OFL-STIX-Two.txt',
  ...Catalogo.asignaturas.flatMap((a) => [`${a.clave}/index.html`, ...a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}/index.html`)]),
  // direcciones antiguas: una página que redirige a la nueva y las reglas 301 de Cloudflare
  ...Object.keys(Catalogo.redirecciones).map((v) => `${v}index.html`), '_redirects'];
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

const Estadistica = require(path.join(fuente, 'estadistica', 'calculo.js'));
{
  // valores de las tablas y fórmulas cerradas
  const antes = fallos, Es = Estadistica, cerca = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
  const tabla = [[Es.Phi(0), 0.5], [Es.Phi(1), 0.841344746], [Es.Phi(1.96), 0.975002105], [Es.Phi(-2.33), 0.009903076], [Es.Phi(3), 0.998650102]];
  for (const [v, e] of tabla) if (!cerca(v, e, 1e-8)) mal(`Estadística: Φ = ${v}, se esperaba ${e}`);
  const R = Object.fromEntries(Es.ejemplos.map((e) => [e.clave, Es.calcular(e.sc)]));
  const esp = {
    'normal-menor': R['normal-menor'].p - 0.655421742, 'normal-entre': R['normal-entre'].p - 0.682689492, 'normal-cuantil': R['normal-cuantil'].x - (6 + 1.5 * 1.281551566),
    'z-critico': R['z-critico'].c - 1.959963985, 't-critico': R['t-critico'].c - 2.228138852, chi2: R.chi2.p - (2 * (1 - Es.Phi(Math.sqrt(11.07))) + Math.sqrt((2 * 11.07) / Math.PI) * Math.exp(-11.07 / 2) * (1 + 11.07 / 3)), exponencial: R.exponencial.p - Math.exp(-1.5),
    'binomial-igual': R['binomial-igual'].p - 120 / 1024, 'binomial-menor': R['binomial-menor'].p - (0.95 ** 20 + 20 * 0.05 * 0.95 ** 19 + 190 * 0.05 ** 2 * 0.95 ** 18), poisson: R.poisson.p - (1 - 4 * Math.exp(-3)),
  };
  for (const [k, d] of Object.entries(esp)) if (Math.abs(d) > 2e-6) mal(`Estadística · ${k}: diferencia ${d}`);
  // binomial y Poisson acumuladas frente a la suma directa
  for (const [d, P] of [['binomial', { n: 30, p: 0.37 }], ['poisson', { lambda: 7.5 }]]) {
    let s = 0;
    for (let k = 0; k <= 20; k++) { s += Es.DIST[d].pmf(P, k); if (!cerca(Es.DIST[d].cdf(P, k), s, 1e-10)) mal(`Estadística · ${d}: F(${k}) no coincide con la suma`); }
  }
  // cuantil y probabilidad son inversos; P(X < k) = P(X ≤ k − 1)
  for (const p of [0.01, 0.3, 0.95]) for (const [d, P] of [['normal', { mu: 2, sigma: 3 }], ['t', { nu: 4 }], ['chi2', { k: 7 }]]) if (!cerca(Es.DIST[d].cdf(P, Es.cuantil(Es.DIST[d], P, p)), p, 1e-9)) mal(`Estadística · ${d}: cuantil(${p}) no es inverso`);
  if (!cerca(Es.calcular({ dist: 'poisson', lambda: '3', tipo: 'menorE', a: '4' }).p, Es.calcular({ dist: 'poisson', lambda: '3', tipo: 'menor', a: '3' }).p, 1e-12)) mal('Estadística: P(X < 4) ≠ P(X ≤ 3)');
  const malas = [{ dist: 'normal', mu: '0', sigma: '0', tipo: 'menor', a: '1' }, { dist: 'binomial', n: '10', p: '1.2', tipo: 'igual', a: '1' }, { dist: 'binomial', n: '10.5', p: '0.5', tipo: 'igual', a: '1' }, { dist: 'poisson', lambda: '2', tipo: 'igual', a: '1.5' }, { dist: 'normal', mu: '0', sigma: '1', tipo: 'cuantil', p: '1' }, { dist: 'normal', mu: '0', sigma: '1', tipo: 'entre', a: '2', b: '1' }];
  for (const m of malas) { let ok = false; try { Es.calcular(m); } catch (e) { ok = true; } if (!ok) mal(`Estadística: ${JSON.stringify(m)} debería dar un error`); }
  if (fallos === antes) console.log(`  ✓ Estadística: tabla de Φ, ${Es.ejemplos.length} ejemplos con el valor esperado, binomial y Poisson acumuladas, cuantiles inversos y errores`);
}

const Alterna = require(path.join(fuente, 'alterna', 'fisica.js'));
{
  // valores calculados a mano
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Alterna · ${q}: ${a} en vez de ${b}`); };
  const ej = (c) => Alterna.ejemplos.find((e) => e.clave === c).sc;
  const rl = Alterna.circuito(ej('rl'));
  cerca(Alterna.mod(rl.Zt), 50, 0.05, 'bobina real |Z|'); cerca(rl.fi * Alterna.GRAD, 53.13, 0.02, 'bobina real φ'); cerca(Alterna.mod(rl.I), 4.6, 0.01, 'bobina real I');
  cerca(rl.P, rl.R * Alterna.mod(rl.I) ** 2, 1e-6, 'P = I²R');
  const res = Alterna.circuito(ej('resonancia'));
  cerca(res.fp, 1, 1e-6, 'resonancia cos φ'); cerca(Alterna.mod(res.Zt), 10, 1e-4, 'resonancia Z = R'); cerca(res.res.f0, 159.1549, 1e-3, 'f0'); cerca(res.res.Q, 10, 1e-4, 'factor de calidad');
  const s = Alterna.circuito(ej('rlc-serie')), suma = s.partes.reduce((z, p) => Alterna.suma(z, p.V), Alterna.Z(0));
  cerca(suma.re, 230, 1e-9, 'suma fasorial de tensiones (real)'); cerca(suma.im, 0, 1e-9, 'suma fasorial de tensiones (imaginaria)');
  cerca(s.S ** 2, s.P ** 2 + s.Q ** 2, 1e-6, 'S² = P² + Q²');
  const par = Alterna.circuito(ej('paralelo'));
  cerca(Alterna.mod(par.Zt), 53.67, 0.01, 'paralelo |Z|'); cerca(par.fi * Alterna.GRAD, 26.57, 0.02, 'paralelo φ');
  const fp = Alterna.correccion(ej('fp'));
  cerca(fp.C * 1e6, 137.6, 0.05, 'condensador de corrección'); cerca(fp.I2, 26.316, 0.001, 'corriente corregida');
  for (const [sc, q] of [[{ V: '230', f: '50' }, 'sin elementos'], [{ V: '230', f: '50', R: '-5' }, 'R negativa'], [{ V: '', f: '50', R: '5' }, 'sin tensión'], [{ conexion: 'paralelo', V: '230', f: '50', R: '0' }, 'cortocircuito en paralelo']]) {
    let ok = false; try { Alterna.circuito(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Alterna: ${q} no da error`);
  }
  let ok = false; try { Alterna.correccion({ V: '400', f: '50', P: '10', fp1: '0.9', fp2: '0.8' }); } catch (e) { ok = true; }
  if (!ok) mal('Alterna: un cos φ deseado menor que el inicial no da error');
  if (!Alterna.circuito(ej('rc')).pasos[1].html.includes('R − jX<sub>C</sub>')) mal('Alterna: la impedancia RC no se escribe R − jX_C');
  if (fallos === antes) console.log(`  ✓ Corriente alterna: ${Alterna.ejemplos.length} ejemplos, Z, φ, potencias, resonancia y corrección del factor de potencia`);
}

const Dinamica = require(path.join(fuente, 'dinamica', 'fisica.js'));
{
  // valores calculados a mano con g = 9,8
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Dinámica · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => Dinamica.resolver(Dinamica.ejemplos.find((e) => e.clave === c).sc);
  const hz = r('horizontal');
  cerca(hz.N, 146, 1e-9, 'normal con la cuerda inclinada'); cerca(hz.a, (100 * Math.cos(Math.PI / 6) - 0.3 * 146) / 20, 1e-9, 'aceleración horizontal');
  const baja = r('inclinado-baja');
  cerca(baja.a, -(9.8 * 0.5 - 0.2 * 9.8 * Math.cos(Math.PI / 6)), 1e-9, 'bloque que baja: a = −g(sen θ − μ cos θ)');
  const quieto = r('inclinado-quieto');
  if (quieto.estado !== 'reposo' || quieto.a !== 0) mal('Dinámica: con tg 20° < 0,5 el bloque debería quedarse quieto');
  cerca(Math.abs(quieto.Fr), 5 * 9.8 * Math.sin(20 * Math.PI / 180), 1e-9, 'rozamiento estático = P sen θ');
  const mesa = r('mesa-polea');
  cerca(mesa.a, (2 * 9.8 - 0.25 * 4 * 9.8) / 6, 1e-9, 'mesa y polea a'); cerca(mesa.T, 2 * (9.8 - mesa.a), 1e-9, 'mesa y polea T');
  cerca(r('atwood').a, 2.45, 1e-9, 'Atwood a'); cerca(r('atwood').T1, 36.75, 1e-9, 'Atwood T');
  const ap = r('atwood-polea');
  cerca(ap.a, 2 * 9.8 / 9, 1e-9, 'Atwood con polea a'); cerca(ap.T2 - ap.T1, 0.5 * 2 * ap.a, 1e-9, 'T2 − T1 = ½ mp a');
  cerca(r('horizontal').cin.v, Math.sqrt(2 * hz.a * 5), 1e-9, 'velocidad tras 5 m');
  for (const [sc, q] of [[{ tipo: 'plano', g: '9.8', m1: '0', theta: '10' }, 'masa 0'], [{ tipo: 'plano', g: '9.8', m1: '1', theta: '100' }, 'ángulo de 100°'], [{ tipo: 'plano', g: '9.8', m1: '1', theta: '0', mus: '0.2', muk: '0.3' }, 'μd > μe'], [{ tipo: 'plano', g: '9.8', m1: '1', theta: '0', F: '50', alfa: '90' }, 'fuerza que levanta el bloque']]) {
    let ok = false; try { Dinamica.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Dinámica: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Dinámica: ${Dinamica.ejemplos.length} ejemplos, normal, reposo o deslizamiento, poleas, Atwood y errores`);
}

const Continua = require(path.join(fuente, 'circuitos', 'fisica.js'));
{
  // valores calculados a mano
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Circuitos · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => Continua.resolver(Continua.ejemplos.find((e) => e.clave === c).sc);
  cerca(r('divisor').V.b, 8, 1e-9, 'divisor de tensión');
  cerca(r('dos-mallas').V.b, 80 / 13, 1e-9, 'dos mallas V_b = 80/13');
  const ws = r('wheatstone');
  cerca(ws.V.b, 108 / 17, 1e-9, 'Wheatstone V_b = 108/17'); cerca(ws.V.c, 104 / 17, 1e-9, 'Wheatstone V_c = 104/17');
  cerca(r('corriente').V.a, 10, 1e-9, 'fuente de corriente V_a');
  cerca(r('mixto').V.b, 9.6, 1e-9, 'mixto V_b');
  for (const c of Continua.ejemplos) { const s = Continua.resolver(c.sc); cerca(s.ent, s.abs, 1e-9 * Math.max(1, s.ent), `balance de potencias en ${c.clave}`); }
  const t = r('thevenin').thev;
  cerca(t.Vth, 8, 1e-9, 'V_th'); cerca(t.Rth, 2, 1e-9, 'R_th'); cerca(t.IN, 4, 1e-9, 'I_N'); cerca(t.IL, 2, 1e-9, 'corriente en la carga'); cerca(t.Pmax, 8, 1e-9, 'P_máx');
  cerca(t.IL, r('thevenin').els[3].I, 1e-9, 'Thévenin da la misma corriente que el circuito completo');
  const E = (a, b, v) => ({ t: 'V', a, b, v }), R = (a, b, v) => ({ t: 'R', a, b, v }), J = (a, b, v) => ({ t: 'I', a, b, v });
  for (const [els, q] of [[[E('a', '0', '5'), E('a', '0', '6'), R('a', '0', '1')], 'dos fuentes de tensión distintas en paralelo'], [[R('a', '0', '0')], 'resistencia de 0 Ω'], [[E('a', '0', '5'), R('a', '0', '1'), R('x', 'y', '1')], 'circuito partido'], [[J('0', 'a', '1'), J('a', 'b', '2'), R('b', '0', '1')], 'fuentes de corriente en serie distintas'], [[R('a', 'a', '1')], 'elemento entre el mismo nudo']]) {
    let ok = false; try { Continua.resolver({ elementos: els, carga: '' }); } catch (e) { ok = true; }
    if (!ok) mal(`Circuitos: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Circuitos de continua: ${Continua.ejemplos.length} circuitos con los potenciales esperados, balance de potencias, Thévenin y Norton, y errores`);
}

const Solido = require(path.join(fuente, 'solido-rigido', 'fisica.js'));
{
  // valores calculados a mano con g = 9,8
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Sólido rígido · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => Solido.resolver(Solido.ejemplos.find((e) => e.clave === c).sc);
  cerca(r('varilla-extremo').I, (1 / 3) * 2 * 1.2 ** 2, 1e-12, 'varilla por un extremo = ML²/3');
  cerca(r('disco').I, 0.5 * 5 * 0.09, 1e-12, 'disco ½MR²');
  cerca(r('placa').I, (3 * (0.16 + 0.09)) / 12, 1e-12, 'placa M(a² + b²)/12');
  const es = r('esfera-rueda');
  cerca(es.a, (9.8 * 0.5) / 1.4, 1e-12, 'esfera que rueda a = 5/7 g sen θ'); cerca(es.v, Math.sqrt((10 / 7) * 9.8 * 1.5), 1e-12, 'v = √(10gh/7)');
  cerca(es.muMin, (2 / 7) * Math.tan(Math.PI / 6), 1e-12, 'μ mínimo = (2/7) tg θ'); if (!es.rueda) mal('Sólido rígido: la esfera con μ = 0,2 debería rodar sin deslizar');
  const aro = r('aro-desliza');
  if (aro.rueda || !aro.desliza) mal('Sólido rígido: el aro con μ = 0,3 a 40° debería deslizar');
  else cerca(aro.desliza.Q, 0.3 * aro.N * (aro.d - (aro.desliza.w * aro.R ** 2 * 0 + 0.5 * aro.desliza.al * aro.R * aro.desliza.t ** 2)), 1e-9, 'calor = μN · distancia de deslizamiento');
  const t = r('esfera-rueda').carrera.map((q) => q.t);
  if (!(t[0] < t[2] && t[2] < t[1] && t[1] < t[3])) mal('Sólido rígido: la carrera debería ganarla la esfera maciza, luego el cilindro, la esfera hueca y el aro');
  const po = r('polea');
  cerca(po.a, 4.9, 1e-12, 'polea a'); cerca(po.T, 9.8, 1e-12, 'polea T');
  const pa = r('patinadora');
  cerca(pa.w2, 180, 1e-9, 'patinadora ω₂'); cerca(pa.K2 / pa.K1, 3, 1e-9, 'patinadora K₂/K₁ = I₁/I₂');
  for (const [sc, q] of [[{ modo: 'inercia', cuerpo: 'esfera', M: '-1', L: '1' }, 'masa negativa'], [{ modo: 'rodadura', cuerpo: 'varilla', g: '9.8', M: '1', L: '1', theta: '10', d: '1' }, 'una varilla que rueda'], [{ modo: 'rodadura', cuerpo: 'esfera', g: '9.8', M: '1', L: '1', theta: '95', d: '1' }, 'ángulo de 95°'], [{ modo: 'momento', I1: '1', w1: '10', I2: '0' }, 'I₂ = 0']]) {
    let ok = false; try { Solido.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Sólido rígido: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Sólido rígido: ${Solido.ejemplos.length} ejemplos, Steiner, rodadura con y sin deslizamiento, polea, momento angular y errores`);
}

const Ondas = require(path.join(fuente, 'ondas', 'fisica.js'));
{
  // valores calculados a mano
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Ondas · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => Ondas.resolver(Ondas.ejemplos.find((e) => e.clave === c).sc);
  const a = r('armonica');
  if (a.ec !== 'y(x, t) = 0,05 sen(4πt − πx)') mal(`Ondas: la ecuación sale «${a.ec}»`);
  cerca(a.punto.y, 0.05, 1e-12, 'y en el punto (cresta)'); cerca(a.punto.vy, 0, 1e-12, 'v_y en la cresta');
  if (r('armonica-izq').ec !== 'y(x, t) = 0,02 sen(100πt + πx + π/2)') mal(`Ondas: la ecuación hacia la izquierda sale «${r('armonica-izq').ec}»`);
  cerca(r('guitarra').fn, (3 * Math.sqrt(70 / 0.0011)) / 1.3, 1e-9, 'tercer armónico de la cuerda');
  cerca(r('tubo-abierto').fn, 400, 1e-9, 'tubo abierto n = 2'); cerca(r('tubo-cerrado').fn, 300, 1e-9, 'tubo cerrado modo 2 (3v/4L)');
  if (r('guitarra').nodos.length !== 4 || r('tubo-cerrado').nodos.length !== 2) mal('Ondas: número de nodos incorrecto');
  cerca(r('ambulancia').fp, (700 * 340) / 315, 1e-9, 'Doppler fuente que se acerca'); cerca(r('cruce').fp, (500 * 348) / 370, 1e-9, 'Doppler los dos moviéndose');
  const so = r('altavoz');
  cerca(so.b1, 10 * Math.log10(0.1 / (16 * Math.PI) / 1e-12), 1e-9, 'nivel sonoro'); cerca(so.b1 - so.b2, 20 * Math.log10(4), 1e-9, 'Δβ = 20 log(r₂/r₁)');
  cerca(Ondas.sonido({ P: '0.1', r1: '2', N: '2' }).b1 - so.b1, 10 * Math.log10(2), 1e-9, 'dos fuentes: +3 dB');
  for (const [sc, q] of [[{ modo: 'doppler', f: '500', vs: '340', vF: '340' }, 'fuente supersónica'], [{ modo: 'estacionaria', medio: 'cuerda', L: '1', tension: '10', mu: '0.01', n: '0' }, 'armónico 0'], [{ modo: 'armonica', A: '1', f: '-2', v: '3' }, 'frecuencia negativa']]) {
    let ok = false; try { Ondas.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Ondas: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Ondas: ${Ondas.ejemplos.length} ejemplos, ecuación con π, armónicos y nodos, Doppler, decibelios y errores`);
}

const Gases = require(path.join(fuente, 'gases', 'fisica.js'));
{
  // valores calculados a mano
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.abs(b || 1))) mal(`Gases · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => Gases.resolver(Gases.ejemplos.find((e) => e.clave === c).sc);
  cerca(r('volumen').V, (0.5 * 8.314 * 300.15) / 202650, 1e-9, 'V = nRT/P');
  cerca(r('normales').V * 1000, 22.41, 1e-3, 'volumen molar en condiciones normales');
  const iso = r('isoterma');
  cerca(iso.Wt, 405300 * 0.005 * Math.log(4), 1e-9, 'W isoterma = PV ln 4'); cerca(iso.Ut, 0, 1e-9, 'ΔU isoterma');
  const ad = r('adiabatica');
  cerca(ad.est[1].P, 101325 * 5 ** 1.4, 1e-9, 'P final adiabática'); cerca(ad.Qt, 0, 1e-9, 'Q adiabática'); cerca(ad.Ut, -ad.Wt, 1e-9, 'ΔU = −W en la adiabática');
  const rect = r('ciclo-rect');
  if (!rect.ciclo) mal('Gases: el ciclo rectangular no cierra');
  cerca(rect.Wt, 800, 1e-9, 'W neto = ΔP·ΔV'); cerca(rect.Qabs, 3600, 1e-9, 'Q absorbido del ciclo rectangular'); cerca(rect.rend, 800 / 3600, 1e-9, 'rendimiento del ciclo rectangular');
  const ca = r('carnot');
  if (!ca.ciclo) mal('Gases: el ciclo de Carnot no cierra');
  cerca(ca.rend, 0.5, 1e-5, 'rendimiento de Carnot 1 − 300/600');
  if (ca.tramos[3].a !== 'A') mal('Gases: el último tramo del ciclo no acaba en A');
  cerca(r('cinetica').vrms, Math.sqrt((3 * 8.314 * 300) / 0.032), 1e-9, 'v_cm del O₂ a 300 K');
  for (const [sc, q] of [[{ modo: 'estado', P: '1', V: '', T: '', n: '1' }, 'dos incógnitas'], [{ modo: 'estado', P: '1', V: '1', T: '300', n: '5' }, 'cuatro datos incoherentes'], [{ modo: 'estado', uT: 'C', P: '1', V: '', T: '-300', n: '1' }, 'T bajo el cero absoluto'], [{ modo: 'procesos', gas: 'diatomico', P: '1', V: '1', T: '300', n: '', procesos: [{ tipo: 'isoterma', dato: 'V', valor: '2' }, { tipo: 'isobara', dato: 'V', valor: 'A' }] }, 'ciclo que no cierra'], [{ modo: 'procesos', gas: 'diatomico', P: '1', V: '1', T: '300', n: '', procesos: [{ tipo: 'isocora', dato: 'V', valor: '2' }] }, 'isocora con V'], [{ modo: 'procesos', gas: 'diatomico', P: '1', V: '1', T: '300', n: '', procesos: [] }, 'sin transformaciones']]) {
    let ok = false; try { Gases.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Gases: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Gases: ${Gases.ejemplos.length} ejemplos, PV = nRT, isoterma, adiabática, ciclos con rendimiento, teoría cinética y errores`);
}

const Faraday = require(path.join(fuente, 'faraday', 'fisica.js'));
{
  // valores calculados a mano
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.abs(b || 1))) mal(`Faraday · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => Faraday.resolver(Faraday.ejemplos.find((e) => e.clave === c).sc);
  const b = r('barra');
  cerca(b.eps, 0.4, 1e-12, 'ε = BLv'); cerca(b.I, 0.2, 1e-12, 'I = ε/R'); cerca(b.F, 0.02, 1e-12, 'F = B²L²v/R'); cerca(b.P, 0.08, 1e-12, 'P = ε²/R');
  if (b.sentido !== 'antihorario') mal('Faraday: B entrante y el área que crece deberían dar corriente antihoraria');
  if (r('barra-izq').sentido !== 'antihorario') mal('Faraday: B saliente y el área que decrece deberían dar corriente antihoraria');
  if (Faraday.barra({ B: '1', sentidoB: 'saliente', L: '1', v: '1' }).sentido !== 'horario') mal('Faraday: B saliente y el área que crece deberían dar corriente horaria');
  const al = r('alternador');
  cerca(al.em, 100 * 0.5 * 0.02 * 100 * Math.PI, 1e-12, 'ε_máx = NBSω'); cerca(al.Pm, (al.em / Math.SQRT2) ** 2 / 50, 1e-12, 'potencia media');
  cerca(r('rpm').w, 100 * Math.PI, 1e-12, '3000 rpm en rad/s');
  const fl = r('campo-crece');
  cerca(fl.em, -(50 * 0.4 * Math.PI * 0.0025) / 0.1, 1e-12, 'ε media = −ΔΦ/Δt'); cerca(fl.q, (50 * 0.4 * Math.PI * 0.0025) / 5, 1e-12, 'q = ΔΦ/R');
  const g9 = r('gira-90');
  cerca(g9.F2, 0, 1e-12, 'flujo a 90°'); cerca(g9.em, 0.6 * 0.06 / 0.2, 1e-12, 'ε al girar 90°');
  if (g9.sentido !== 'antihorario') mal('Faraday: el flujo saliente que disminuye debería dar corriente antihoraria');
  const cr = r('cruza');
  cerca(cr.eps, 0.1, 1e-12, 'ε = Bav'); cerca(cr.tramos[0].t1, 0.05, 1e-12, 'tiempo en entrar'); cerca(cr.Q, 0.01, 1e-12, 'calor total');
  if (cr.tramos[0].sentido !== 'antihorario' || cr.tramos[2].sentido !== 'horario') mal('Faraday: sentidos al entrar y al salir');
  for (const [sc, q] of [[{ modo: 'barra', B: '1', L: '1', v: '0' }, 'barra quieta'], [{ modo: 'flujo', N: '1', forma: 'area', S: '1', B1: '1', B2: '1', dt: '1' }, 'flujo que no cambia'], [{ modo: 'giratoria', N: '2.5', B: '1', forma: 'area', S: '1', w: '1' }, 'N no entero'], [{ modo: 'cruza', N: '1', a: '0', D: '1', v: '1', B: '1' }, 'lado 0']]) {
    let ok = false; try { Faraday.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Faraday: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Faraday: ${Faraday.ejemplos.length} ejemplos, barra, alternador, flujo variable, espira que cruza, sentidos de Lenz y errores`);
}

const Mates = require(path.join(fuente, 'mates.js'));
{
  const antes = fallos, m = (x) => Mates.mathml(x);
  if (!m('v_0y^2/(2g)').includes('<mfrac><msubsup><mi>v</mi><mi mathvariant="normal">0y</mi><mn>2</mn></msubsup><mrow><mn>2</mn><mi>g</mi></mrow></mfrac>')) mal('Mates: la fracción v_0y²/(2g) no sale bien');
  if (!m('√(v_x^2 + v_y^2)').includes('<msqrt><mrow><msubsup>')) mal('Mates: la raíz no quita los paréntesis');
  if (!m('e^{−bt/m}').includes('<msup><mi>e</mi><mrow><mo')) mal('Mates: el exponente entre llaves no sale');
  if (!m('x = 1,2·10<sup>−5</sup> "m/s"').includes('<mtext>m/s</mtext>')) mal('Mates: las unidades entre comillas no salen como texto');
  if (!m('cos^2 α').includes('<msup><mi mathvariant="normal">cos</mi><mn>2</mn></msup>')) mal('Mates: cos² no sale');
  if (!m('ΔT').includes('<mi mathvariant="normal">Δ</mi>')) mal('Mates: Δ debería ir recta');
  if (Mates.html('a $x$ b $y$').split('<math>').length !== 3) mal('Mates: no sustituye cada $…$');
  if (fallos === antes) console.log('  ✓ Mates: fracciones, raíces, exponentes, subíndices, unidades y funciones en MathML');
}

{
  // arreglo 3: reducción, igualación y sustitución dan la solución de Gauss
  const antes = fallos, X = require(path.join(fuente, 'sistemas', 'calculo.js'));
  const txt = (h) => h.replace(/<[^>]+>/g, '');
  for (const [M, esp] of [[[['3', '2', '7'], ['5', '-3', '-1']], 'x = 1, y = 2'], [[['1', '1', '1', '6'], ['2', '-1', '1', '3'], ['1', '2', '-1', '2']], 'x = 1, y = 2, z = 3'], [[['2', '1', '-1', '8'], ['-3', '-1', '2', '-11'], ['-2', '1', '2', '-3']], 'x = 2, y = 3, z = −1'], [[['1+i', '2', '3+i'], ['1', '-i', '1']], null]]) {
    const g = txt(X.resolver({ metodo: 'gauss', M }).res).replace(/ |&nbsp;/g, ' ').replace(/\s+/g, ' ');
    if (esp && g !== esp) mal(`Sistemas: Gauss da «${g}» en vez de «${esp}»`);
    for (const metodo of ['reduccion', 'igualacion', 'sustitucion']) {
      const r = X.resolver({ metodo, M });
      if (txt(r.res).replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ') !== g) mal(`Sistemas · ${metodo}: no coincide con Gauss`);
      if (r.pasos.some((p) => /^F<sub>/.test(p.t))) mal(`Sistemas · ${metodo}: usa pasos de Gauss en un sistema en el que se puede usar`);
    }
  }
  const sci = X.resolver({ metodo: 'sustitucion', M: [['1', '1', '1', '6'], ['2', '-1', '1', '3'], ['3', '0', '2', '9']] });
  if (!sci.pasos.some((p) => /No se usa sustitución/.test(p.t))) mal('Sistemas: en un indeterminado debería avisar de que no usa sustitución');
  const red = X.resolver({ metodo: 'reduccion', M: [['3', '2', '7'], ['5', '-3', '-1']] });
  if (!red.pasos.some((p) => /3·\(2\) − 5·\(1\)/.test(txt(p.html)))) mal('Sistemas: la reducción 2×2 no combina 3·(2) − 5·(1)');
  if (fallos === antes) console.log('  ✓ Sistemas: reducción, igualación y sustitución en 2×2, 3×3 y complejos coinciden con Gauss');
}

{
  // direcciones antiguas: cada una lleva a una página que existe, con aviso, 301 en Cloudflare y en Vercel
  const antes = fallos, red = fs.readFileSync(path.join(publico, '_redirects'), 'utf8'), vj = JSON.parse(fs.readFileSync(path.join(raiz, 'vercel.json'), 'utf8'));
  for (const [v, n] of Object.entries(Catalogo.redirecciones)) {
    if (!fs.existsSync(path.join(publico, n, 'index.html'))) mal(`Redirección ${v}: ${n} no existe`);
    const stub = fs.readFileSync(path.join(publico, v, 'index.html'), 'utf8'), destino = '../'.repeat(v.split('/').filter(Boolean).length) + n;
    if (!stub.includes(`url=${destino}`) || !stub.includes('noindex')) mal(`Redirección ${v}: la página de aviso no lleva a ${destino}`);
    if (!red.includes(`/${v} /${n} 301`)) mal(`Redirección ${v}: falta en _redirects`);
    if (!(vj.redirects || []).some((r) => r.source === `/${v.replace(/\/$/, '')}` && r.destination === `/${n}`)) mal(`Redirección ${v}: falta en vercel.json`);
  }
  if (fallos === antes) console.log(`  ✓ ${Object.keys(Catalogo.redirecciones).length} direcciones antiguas redirigen a su nueva sección`);
}

{
  // todas las herramientas (y el simulador de electrostática) tienen el botón «← Inicio» que lleva a la portada
  const antes = fallos, pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}/index.html`));
  for (const f of pags) {
    const html = fs.readFileSync(path.join(publico, f), 'utf8');
    if (!/<a [^>]*class="[^"]*a-inicio[^"]*"[^>]*href="\.\.\/\.\.\/"|<a [^>]*href="\.\.\/\.\.\/"[^>]*class="[^"]*a-inicio/.test(html)) mal(`${f}: falta el botón «← Inicio»`);
  }
  if (fallos === antes) console.log(`  ✓ Botón «← Inicio» en las ${pags.length} herramientas`);
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
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'estadistica', 'distribuciones', 'index.html'));
    await page.waitForFunction(() => window.EstadisticaApp);
    const antes = fallos;
    const verE = (await page.locator('#ver').textContent()).trim();
    if (verE !== Version.de('estadistica').current) mal(`Estadística: la página muestra la versión «${verE}», se esperaba ${Version.de('estadistica').current}`);
    for (const e of Estadistica.ejemplos) {
      await page.evaluate((c) => EstadisticaApp.abrirEjemplo(c), e.clave);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 2) mal(`Estadística · ${e.clave}: falta el resultado o el desarrollo`);
    }
    await page.evaluate(() => EstadisticaApp.abrirEjemplo('normal-menor'));
    if (!(await page.locator('#res').textContent()).includes('0,6554')) mal('Estadística: N(50, 5) no da 0,6554 en la página');
    await page.selectOption('#f-dist', 'binomial');
    if ((await page.locator('#f-n').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Estadística: al cambiar a binomial no aparecen n y p');
    await page.fill('#f-p', '2');
    if (await page.locator('#error').isHidden()) mal('Estadística: p = 2 no muestra el error');
    await page.close();
    if (consola.length) mal('Estadística: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Estadística: ${Estadistica.ejemplos.length} ejemplos, cambio de distribución y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'circuitos', 'alterna', 'index.html'));
    await page.waitForFunction(() => window.AlternaApp);
    const antes = fallos;
    const verA = (await page.locator('#ver').textContent()).trim();
    if (verA !== Version.de('alterna').current) mal(`Alterna: la página muestra la versión «${verA}», se esperaba ${Version.de('alterna').current}`);
    for (const e of Alterna.ejemplos) {
      await page.evaluate((c) => AlternaApp.abrirEjemplo(c), e.clave);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 3) mal(`Alterna · ${e.clave}: falta el resultado o el desarrollo`);
    }
    await page.evaluate(() => AlternaApp.abrirEjemplo('rl'));
    if (!(await page.locator('#res').textContent()).includes('53,13°')) mal('Alterna: la bobina real no da φ = 53,13° en la página');
    await page.selectOption('#f-conexion', 'paralelo');
    if (!(await page.locator('#error').isHidden()) || !(await page.locator('#pasos').textContent()).includes('Admitancia')) mal('Alterna: al pasar a paralelo no se calcula con admitancias');
    await page.fill('#f-V', 'abc');
    if (await page.locator('#error').isHidden()) mal('Alterna: una tensión no numérica no muestra el error');
    await page.selectOption('#f-modo', 'correccion');
    if ((await page.locator('#f-fp1').count()) !== 1) mal('Alterna: el modo de corrección no muestra cos φ inicial');
    await page.close();
    if (consola.length) mal('Alterna: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Corriente alterna: ${Alterna.ejemplos.length} ejemplos, serie y paralelo, corrección y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'fisica', 'dinamica', 'index.html'));
    await page.waitForFunction(() => window.DinamicaApp);
    const antes = fallos;
    const verD = (await page.locator('#ver').textContent()).trim();
    if (verD !== Version.de('dinamica').current) mal(`Dinámica: la página muestra la versión «${verD}», se esperaba ${Version.de('dinamica').current}`);
    for (const e of Dinamica.ejemplos) {
      await page.evaluate((c) => DinamicaApp.abrirEjemplo(c), e.clave);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 3) mal(`Dinámica · ${e.clave}: falta el resultado o el desarrollo`);
    }
    await page.evaluate(() => DinamicaApp.abrirEjemplo('atwood'));
    if (!(await page.locator('#res').textContent()).includes('2,45')) mal('Dinámica: Atwood no da a = 2,45 m/s² en la página');
    await page.evaluate(() => DinamicaApp.abrirEjemplo('inclinado-quieto'));
    if (!(await page.locator('#res').textContent()).includes('En reposo')) mal('Dinámica: el bloque sujeto por el rozamiento no sale en reposo');
    await page.fill('#f-m1', '-3');
    if (await page.locator('#error').isHidden()) mal('Dinámica: una masa negativa no muestra el error');
    await page.selectOption('#f-tipo', 'atwood');
    if ((await page.locator('#f-mp').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Dinámica: al cambiar a Atwood no aparece la masa de la polea');
    await page.close();
    if (consola.length) mal('Dinámica: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Dinámica: ${Dinamica.ejemplos.length} ejemplos, reposo, Atwood y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'circuitos', 'continua', 'index.html'));
    await page.waitForFunction(() => window.CircuitosApp);
    const antes = fallos;
    const verC = (await page.locator('#ver').textContent()).trim();
    if (verC !== Version.de('circuitos').current) mal(`Circuitos: la página muestra la versión «${verC}», se esperaba ${Version.de('circuitos').current}`);
    for (const e of Continua.ejemplos) {
      await page.evaluate((c) => CircuitosApp.abrirEjemplo(c), e.clave);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 4) mal(`Circuitos · ${e.clave}: falta el resultado o el desarrollo`);
    }
    await page.evaluate(() => CircuitosApp.abrirEjemplo('thevenin'));
    if (!(await page.locator('#res').textContent()).includes('8 V')) mal('Circuitos: el ejemplo de Thévenin no da V_th = 8 V en la página');
    await page.evaluate(() => CircuitosApp.abrirEjemplo('divisor'));
    const n0 = await page.locator('#lista input').count();
    await page.click('[data-add="R"]');
    if ((await page.locator('#lista input').count()) !== n0 + 3) mal('Circuitos: el botón de añadir resistencia no añade una fila');
    await page.locator('#lista input[data-k="v"]').last().fill('-4');
    if (await page.locator('#error').isHidden()) mal('Circuitos: una resistencia negativa no muestra el error');
    await page.locator('[data-quita]').last().click();
    if (!(await page.locator('#error').isHidden())) mal('Circuitos: al quitar la resistencia mala sigue el error');
    await page.close();
    if (consola.length) mal('Circuitos: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Circuitos de continua: ${Continua.ejemplos.length} circuitos, añadir y quitar elementos y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'fisica', 'solido-rigido', 'index.html'));
    await page.waitForFunction(() => window.SolidoApp);
    const antes = fallos;
    const verS = (await page.locator('#ver').textContent()).trim();
    if (verS !== Version.de('solido-rigido').current) mal(`Sólido rígido: la página muestra la versión «${verS}», se esperaba ${Version.de('solido-rigido').current}`);
    for (const e of Solido.ejemplos) {
      await page.evaluate((c) => SolidoApp.abrirEjemplo(c), e.clave);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 2) mal(`Sólido rígido · ${e.clave}: falta el resultado o el desarrollo`);
    }
    await page.evaluate(() => SolidoApp.abrirEjemplo('esfera-rueda'));
    if (!(await page.locator('#res').textContent()).includes('3,5')) mal('Sólido rígido: la esfera no da a = 3,5 m/s² en la página');
    await page.selectOption('#f-modo', 'inercia');
    await page.selectOption('#f-cuerpo', 'placa');
    if ((await page.locator('#f-b').count()) !== 1) mal('Sólido rígido: la placa no pide el lado b');
    await page.fill('#f-M', 'x');
    if (await page.locator('#error').isHidden()) mal('Sólido rígido: una masa no numérica no muestra el error');
    await page.close();
    if (consola.length) mal('Sólido rígido: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Sólido rígido: ${Solido.ejemplos.length} ejemplos, cambio de modo y de cuerpo y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'fisica', 'ondas', 'index.html'));
    await page.waitForFunction(() => window.OndasApp);
    const antes = fallos;
    const verO = (await page.locator('#ver').textContent()).trim();
    if (verO !== Version.de('ondas').current) mal(`Ondas: la página muestra la versión «${verO}», se esperaba ${Version.de('ondas').current}`);
    for (const e of Ondas.ejemplos) {
      await page.evaluate((c) => OndasApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(60);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 2) mal(`Ondas · ${e.clave}: falta el resultado o el desarrollo`);
    }
    await page.evaluate(() => OndasApp.abrirEjemplo('armonica'));
    if (!(await page.locator('#res').textContent()).includes('4πt − πx')) mal('Ondas: la ecuación no sale en la página');
    await page.selectOption('#f-modo', 'estacionaria');
    await page.selectOption('#f-medio', 'cerrado');
    if ((await page.locator('#f-vs').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Ondas: el tubo cerrado no pide la velocidad del sonido');
    await page.fill('#f-L', '0');
    if (await page.locator('#error').isHidden()) mal('Ondas: L = 0 no muestra el error');
    await page.click('#play');
    await page.close();
    if (consola.length) mal('Ondas: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Ondas: ${Ondas.ejemplos.length} ejemplos, animación, cambio de medio y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'fisica', 'gases', 'index.html'));
    await page.waitForFunction(() => window.GasesApp);
    const antes = fallos;
    const verG = (await page.locator('#ver').textContent()).trim();
    if (verG !== Version.de('gases').current) mal(`Gases: la página muestra la versión «${verG}», se esperaba ${Version.de('gases').current}`);
    for (const e of Gases.ejemplos) {
      await page.evaluate((c) => GasesApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(60);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 2) mal(`Gases · ${e.clave}: falta el resultado o el desarrollo`);
    }
    await page.evaluate(() => GasesApp.abrirEjemplo('ciclo-rect'));
    if (!(await page.locator('#res').textContent()).includes('22,2 %')) mal('Gases: el rendimiento del ciclo no sale en la página');
    // quitar el último tramo deja un proceso abierto; añadir uno que vuelve a A lo cierra
    await page.click('[data-quita="3"]');
    if ((await page.evaluate(() => GasesApp.resultado().ciclo)) !== false) mal('Gases: al quitar un tramo sigue siendo un ciclo');
    await page.click('[data-add="1"]');
    await page.selectOption('[data-i="3"][data-c="tipo"]', 'isobara');
    await page.fill('[data-i="3"][data-c="valor"]', 'A');
    if (!(await page.evaluate(() => GasesApp.resultado().ciclo))) mal('Gases: el tramo añadido no cierra el ciclo');
    await page.fill('[data-i="3"][data-c="valor"]', '9');
    await page.selectOption('[data-i="3"][data-c="tipo"]', 'isocora');
    if ((await page.locator('[data-i="3"][data-c="dato"]').inputValue()) !== 'P') mal('Gases: al pasar a isocora el dato no cambia a P');
    await page.selectOption('#f-modo', 'cinetica');
    await page.selectOption('#f-molecula', 'otra');
    if ((await page.locator('#f-M').count()) !== 1) mal('Gases: «otro gas» no pide la masa molar');
    await page.close();
    if (consola.length) mal('Gases: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Gases: ${Gases.ejemplos.length} ejemplos, editor de tramos, cierre del ciclo y teoría cinética sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'faraday', 'index.html'));
    await page.waitForFunction(() => window.FaradayApp);
    const antes = fallos;
    const verF = (await page.locator('#ver').textContent()).trim();
    if (verF !== Version.de('faraday').current) mal(`Faraday: la página muestra la versión «${verF}», se esperaba ${Version.de('faraday').current}`);
    for (const e of Faraday.ejemplos) {
      await page.evaluate((c) => FaradayApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(80);
      if (!(await page.locator('#error').isHidden()) || (await page.locator('#pasos li').count()) < 3) mal(`Faraday · ${e.clave}: falta el resultado o el desarrollo`);
    }
    await page.evaluate(() => FaradayApp.abrirEjemplo('barra'));
    if (!(await page.locator('#res').textContent()).includes('0,4 V')) mal('Faraday: la fem de la barra no sale en la página');
    await page.selectOption('#f-modo', 'giratoria');
    await page.selectOption('#f-forma', 'area');
    if ((await page.locator('#f-S').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Faraday: la forma «superficie» no pide S');
    await page.fill('#f-B', '');
    if (await page.locator('#error').isHidden()) mal('Faraday: sin B no muestra el error');
    await page.click('#play');
    await page.close();
    if (consola.length) mal('Faraday: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Faraday: ${Faraday.ejemplos.length} ejemplos, animación, cambio de forma y errores sin errores de consola`);
  }
  {
    // arreglo 1: resultados destacados arriba y lectura de ancho fijo mientras corre el tiempo
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    const antes = fallos;
    for (const [dir, lectura, rango, res] of [['tiro-parabolico', '#lectura', '#tiempo', '#resumen'], ['trabajo-y-energia', '#lectura', '#tiempo', '#resumen']]) {
      await page.goto('file://' + path.join(publico, 'fisica', dir, 'index.html'));
      await page.waitForSelector(`${res} > div`);
      if ((await page.locator(`.destacado ${res} > div`).count()) < 2) mal(`${dir}: los resultados no están en la tarjeta destacada`);
      const largos = new Set();
      for (const v of ['0', '137', '420', '777', '1000']) {
        await page.$eval(rango, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
        // la parte numérica (antes de «en la rampa…») no cambia de largo
        largos.add((await page.locator(lectura).textContent()).split(' · ').slice(0, dir === 'tiro-parabolico' ? 4 : 2).join(' · ').length);
      }
      if (largos.size !== 1) mal(`${dir}: la lectura cambia de ancho al mover el tiempo (${[...largos].join(', ')} caracteres)`);
    }
    await page.goto('file://' + path.join(publico, 'fisica', 'calorimetria', 'index.html'));
    await page.waitForFunction(() => document.querySelector('#te') && document.querySelector('#te').textContent.length > 0);
    if ((await page.locator('.destacado #te').count()) !== 1) mal('Calorimetría: la temperatura de equilibrio no está en la tarjeta destacada');
    await page.close();
    if (consola.length) mal('Arreglo 1: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log('  ✓ Tiro parabólico, Trabajo y energía y Calorimetría: resultados destacados y lectura de ancho fijo');
  }
  {
    // arreglo 2: fórmulas en MathML en el desarrollo y en la teoría
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    const antes = fallos;
    for (const dir of ['tiro-parabolico', 'trabajo-y-energia', 'calorimetria']) {
      await page.goto('file://' + path.join(publico, 'fisica', dir, 'index.html'));
      await page.waitForSelector('#pasos li');
      await page.waitForTimeout(100);
      const r = await page.evaluate(() => ({ pasos: document.querySelectorAll('#pasos math').length, teoria: document.querySelectorAll('.teoria math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('.teoria').textContent), ancho: Math.min(...[...document.querySelectorAll('#pasos math')].map((m) => m.getBoundingClientRect().width)) }));
      if (r.pasos < 3 || r.teoria < 2) mal(`${dir}: faltan fórmulas MathML (desarrollo ${r.pasos}, teoría ${r.teoria})`);
      if (r.dolar) mal(`${dir}: queda algún $ sin convertir en una fórmula`);
      if (!(r.ancho > 0)) mal(`${dir}: alguna fórmula MathML no se dibuja`);
    }
    // las cajas de fórmulas de la teoría del resto de herramientas
    for (const pag of ['circuitos/alterna', 'circuitos/continua', 'electromagnetismo/condensadores', 'fisica/dinamica', 'estadistica/distribuciones', 'electromagnetismo/faraday', 'fisica/gases', 'electromagnetismo/induccion', 'matematicas/matrices', 'fisica/ondas', 'matematicas/sistemas', 'fisica/solido-rigido']) {
      await page.goto('file://' + path.join(publico, ...pag.split('/'), 'index.html'));
      await page.waitForFunction(() => document.querySelectorAll('.teoria .f[data-m]').length > 0);
      const r = await page.evaluate(() => [...document.querySelectorAll('.teoria .f')].map((e) => e.querySelectorAll('math').length > 0 && !/\$/.test(e.textContent)));
      if (!r.length || r.includes(false)) mal(`${pag}: alguna caja de la teoría no sale en MathML`);
    }
    await page.close();
    if (consola.length) mal('Arreglo 2: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log('  ✓ Fórmulas MathML: desarrollo y teoría de Tiro parabólico, Trabajo y energía y Calorimetría, y la teoría de otras 12 herramientas');
  }
  {
    // arreglo 6: barra lateral «Mis ejercicios» en todas las herramientas con estado (guardar, carpeta, fijar, abrir, exportar, borrar e importar)
    const antes = fallos, consola = [];
    const pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}`));
    let probadas = 0;
    for (const pag of pags) {
      const html = fs.readFileSync(path.join(publico, ...pag.split('/'), 'index.html'), 'utf8'), dir = (html.match(/Biblioteca\.monta\('([^']+)'\)/) || [])[1];
      if (!dir) continue;
      const clave = Biblioteca.CLAVES[dir];
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
      page.on('console', (m) => { if (m.type() === 'error') consola.push(`${pag}: ${m.text()}`); });
      page.on('pageerror', (e) => consola.push(`${pag}: excepción: ${e.message}`));
      await page.goto('file://' + path.join(publico, ...pag.split('/'), 'index.html'));
      if (!clave) { if (await page.$('.bib')) mal(`${pag}: tiene «Mis ejercicios» sin estado que guardar`); await page.close(); continue; }
      await page.waitForSelector('.bib .bib-acc');
      const ej = await page.evaluate(() => { const s = [...document.querySelectorAll('select')].find((x) => x.offsetParent && x.options.length > 2 && /ejemplo/i.test(x.id + x.options[0].textContent)); return s ? s.id : null; });
      if (ej) await page.selectOption('#' + ej, { index: 1 });
      await page.click('.bib [data-acc=nuevo]'); await page.fill('#bib-t', 'Prueba'); await page.fill('#bib-c', 'Tema 1'); await page.click('.bib [data-acc=guardar]');
      const guardado = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).items, `simu-ejercicios:${dir}`);
      if (guardado.length !== 1 || typeof guardado[0].datos !== 'string' || guardado[0].carpeta !== 'Tema 1') { mal(`${pag}: «Guardar el actual» no guarda el ejercicio`); await page.close(); continue; }
      if (!(await page.$('.bib-carp'))) mal(`${pag}: no aparece la carpeta`);
      if (ej) await page.selectOption('#' + ej, { index: 2 });
      await page.click('.bib [data-acc=fijar]');
      if (!(await page.evaluate(() => /Fijados/.test(document.querySelector('.bib-lista').textContent)))) mal(`${pag}: fijar no lo pone en Fijados`);
      await Promise.all([page.waitForEvent('load'), page.click('.bib .bib-abre')]);
      await page.waitForSelector('.bib .bib-it.activo');
      if ((await page.evaluate((k) => localStorage.getItem(k), clave)) !== guardado[0].datos) mal(`${pag}: abrir no recupera los datos guardados`);
      const [descarga] = await Promise.all([page.waitForEvent('download'), page.click('.bib [data-acc=exportar-todo]')]);
      const arch = path.join(tmp, `bib-${dir}.simu.json`); await descarga.saveAs(arch);
      const d = JSON.parse(fs.readFileSync(arch, 'utf8'));
      if (d.formato !== Biblioteca.FORMATO || d.herramienta !== dir || d.ejercicios[0].datos !== guardado[0].datos) mal(`${pag}: el archivo exportado no es correcto`);
      await page.click('.bib [data-acc=borrar]'); await page.click('.bib [data-acc=si-borrar]');
      if (await page.$('.bib-it')) mal(`${pag}: borrar no quita el ejercicio`);
      await page.setInputFiles('.bib ~ input[type=file]', arch);
      await page.waitForSelector('.bib .bib-it');
      const imp = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).items, `simu-ejercicios:${dir}`);
      if (imp.length !== 1 || imp[0].titulo !== 'Prueba' || imp[0].datos !== guardado[0].datos || !imp[0].fijado) mal(`${pag}: importar no recupera el ejercicio`);
      await page.close(); probadas++;
    }
    // en el móvil se abre por encima, sin ensanchar la página
    const movil = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await movil.goto('file://' + path.join(publico, 'fisica', 'tiro-parabolico', 'index.html'));
    await movil.waitForSelector('.bib-btn');
    if (await movil.evaluate(() => document.querySelector('.bib').classList.contains('abierta'))) mal('Mis ejercicios: en el móvil no debería empezar abierta');
    await movil.click('.bib-btn');
    const m = await movil.evaluate(() => ({ ab: document.querySelector('.bib').classList.contains('abierta'), scrim: !document.querySelector('.bib-scrim').hidden, ancho: document.documentElement.scrollWidth }));
    if (!m.ab || !m.scrim || m.ancho > 390) mal(`Mis ejercicios en el móvil: ${JSON.stringify(m)}`);
    await movil.close();
    if (consola.length) mal('Arreglo 6: consola del navegador:\n      ' + consola.join('\n      '));
    if (probadas < 19) mal(`Mis ejercicios: solo se ha probado en ${probadas} herramientas`);
    if (fallos === antes) console.log(`  ✓ Mis ejercicios: guardar, carpeta, fijar, abrir, exportar, borrar e importar en ${probadas} herramientas, y en el móvil`);
  }
  {
    // arreglo 7: modo práctica (datos al azar, se tapan los resultados, se corrigen las respuestas y se destapa la solución)
    const antes = fallos, consola = [];
    const pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => `${a.clave}/${h.clave}`));
    let probadas = 0, ejercicios = 0;
    for (const pag of pags) {
      const html = fs.readFileSync(path.join(publico, ...pag.split('/'), 'index.html'), 'utf8'), dir = (html.match(/Practica\.monta\('([^']+)'/) || [])[1];
      if (!dir || dir === 'tabla-periodica') continue;
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
      page.on('console', (m) => { if (m.type() === 'error') consola.push(`${pag}: ${m.text()}`); });
      page.on('pageerror', (e) => consola.push(`${pag}: excepción: ${e.message}`));
      await page.goto('file://' + path.join(publico, ...pag.split('/'), 'index.html'));
      await page.waitForSelector('.prac-btn');
      const clave = Biblioteca.CLAVES[dir], previo = await page.evaluate((k) => localStorage.getItem(k), clave);
      await page.click('.prac-btn');
      for (let n = 0; n < 5; n++) {
        if (n) await page.click('.prac [data-a=otro]');
        const r = await page.evaluate(() => ({ huecos: document.querySelectorAll('.prac-in').length, tapados: document.querySelectorAll('.prac-tapa').length, resp: window.PracticaApp.respuestas() }));
        if (!r.huecos || !r.tapados) { mal(`${pag}: el modo práctica no pregunta nada o no tapa la solución (${r.huecos} huecos, ${r.tapados} tapados)`); break; }
        const ins = await page.$$('.prac-in');
        for (let k = 0; k < ins.length; k++) await ins[k].fill(r.resp[k]);
        await page.click('.prac [data-a=comprobar]');
        if (!(await page.$('.prac-nota.bien'))) { mal(`${pag}: las respuestas correctas no salen bien: ${r.resp.join(' · ')}`); break; }
        ejercicios++;
      }
      await (await page.$('.prac-in')).fill('123456789');
      await page.click('.prac [data-a=comprobar]');
      if (!(await page.$('.prac-nota.mal'))) mal(`${pag}: una respuesta equivocada sale bien`);
      await page.click('.prac [data-a=solucion]');
      if (await page.$('.prac-tapa')) mal(`${pag}: «Ver la solución» no destapa el desarrollo`);
      if (!(await page.$('.prac-sol'))) mal(`${pag}: «Ver la solución» no pone el valor correcto junto al hueco equivocado`);
      await Promise.all([page.waitForEvent('load'), page.click('.prac-btn')]);
      if ((await page.evaluate((k) => localStorage.getItem(k), clave)) !== previo) mal(`${pag}: al salir del modo práctica no vuelven los datos de antes`);
      await page.close(); probadas++;
    }
    if (consola.length) mal('Arreglo 7: consola del navegador:\n      ' + consola.join('\n      '));
    if (probadas < 19) mal(`Modo práctica: solo se ha probado en ${probadas} herramientas`);
    if (fallos === antes) console.log(`  ✓ Modo práctica: ${ejercicios} ejercicios al azar en ${probadas} herramientas, corregidos bien y mal, con la solución y la vuelta a los datos de antes`);
  }
  // portada y páginas de asignatura: sin errores de consola y sin enlaces internos rotos
  const portal = ['index.html', ...Catalogo.asignaturas.map((a) => `${a.clave}/index.html`), 'electromagnetismo/magnetostatica/index.html', 'quimica/tabla-periodica/index.html', 'fisica/trabajo-y-energia/index.html', 'quimica/masa-molar/index.html', 'quimica/configuracion-electronica/index.html', 'electromagnetismo/condensadores/index.html', 'fisica/tiro-parabolico/index.html', 'quimica/disoluciones/index.html', 'fisica/calorimetria/index.html', 'electromagnetismo/induccion/index.html', 'matematicas/matrices/index.html', 'matematicas/sistemas/index.html', 'estadistica/distribuciones/index.html', 'circuitos/alterna/index.html', 'fisica/dinamica/index.html', 'circuitos/continua/index.html', 'fisica/solido-rigido/index.html', 'fisica/ondas/index.html', 'fisica/gases/index.html', 'electromagnetismo/faraday/index.html'];
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
