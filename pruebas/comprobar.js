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
const PUBLICABLES = ['index.html', 'novedades/index.html', 'foro/index.html', 'og.png', 'apple-touch-icon.png', 'legal.css', 'aviso-legal.html', 'privacidad.html', 'cookies.html', 'contacto.html', 'fuentes/stix-two-math.woff2', 'fuentes/OFL-STIX-Two.txt',
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

const DopplerF = require(path.join(fuente, 'doppler', 'fisica.js'));
{
  // valores calculados a mano
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Doppler · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => DopplerF.resolver(DopplerF.ejemplos.find((e) => e.clave === c).sc);
  cerca(r('ambulancia').fp, (700 * 340) / 315, 1e-9, 'fuente que se acerca');
  cerca(r('dos-coches').fp, (500 * 325) / 360, 1e-9, 'los dos se alejan');
  cerca(r('viento').fp, (1000 * 365) / 355, 1e-9, 'viento a favor (v + w)');
  const tren = r('tren');
  cerca(tren.f1, (440 * 343) / 313, 1e-9, 'f₁ al acercarse'); cerca(tren.f2, (440 * 343) / 373, 1e-9, 'f₂ al alejarse');
  if (!tren.curva || Math.abs(tren.curva.puntos[100].fp - 440) > 1e-9) mal('Doppler: enfrente del observador no se oye la frecuencia emitida');
  const moto = r('moto');
  cerca(moto.u, (340 * 80) / 960, 1e-9, 'velocidad a partir de f₁ y f₂'); cerca(moto.fr, (2 * 520 * 440) / 960, 1e-9, 'frecuencia emitida a partir de f₁ y f₂');
  // al revés: con la velocidad y la frecuencia que salen se vuelven a oír f₁ y f₂
  const ida = DopplerF.paso({ datos: 'fuente', f: String(moto.fr), v: '340', vF: String(moto.u) });
  cerca(ida.f1, 520, 1e-9, 'f₁ de vuelta'); cerca(ida.f2, 440, 1e-9, 'f₂ de vuelta');
  cerca(r('radar').df, (24e9 * 66) / (3e8 - 33), 1e-3, 'pulsaciones del radar');
  cerca(r('murcielago').fpp, (40000 * 346) / 334, 1e-9, 'eco del murciélago');
  const eco = r('ecografia');
  cerca(DopplerF.eco({ buscar: 'frecuencia', f: '5e6', v: '1540', vE: '0', u: String(eco.u) }).df, 1300, 1e-6, 'velocidad de la sangre (ida y vuelta)');
  const av = r('avion');
  cerca(av.gr, 30, 1e-9, 'semiángulo del cono con M = 2'); cerca(av.x, 8000 * Math.sqrt(3), 1e-6, 'distancia del estampido'); cerca(av.t, (8000 * Math.sqrt(3)) / 680, 1e-9, 'tiempo del estampido');
  if (DopplerF.fq(24000005280) !== '2,400000528·10<sup>10</sup>') mal(`Doppler: la frecuencia del radar sale «${DopplerF.fq(24000005280)}»`);
  for (const [sc, q] of [[{ modo: 'recta', f: '500', v: '340', vF: '340' }, 'fuente a la velocidad del sonido'], [{ modo: 'recta', f: '500', v: '340', w: '-340' }, 'viento en contra igual al sonido'], [{ modo: 'paso', datos: 'oidas', f1: '400', f2: '450', v: '340' }, 'f₂ mayor que f₁'], [{ modo: 'choque', v: '340', vF: '300' }, 'onda de choque subsónica'], [{ modo: 'eco', f: '100', v: '340', u: '400' }, 'obstáculo supersónico']]) {
    let ok = false; try { DopplerF.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Doppler: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Efecto Doppler: ${DopplerF.ejemplos.length} ejemplos, viento, fuente que pasa y al revés, eco, cono de Mach y errores`);
}

const ResistenciasC = require(path.join(fuente, 'resistencias', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Resistencias · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => ResistenciasC.resolver(ResistenciasC.ejemplos.find((e) => e.clave === c).sc);
  cerca(r('cuatro').R, 4700, 0, 'amarillo violeta rojo'); cerca(r('cuatro').min, 4465, 1e-9, 'mínimo con ±5 %'); cerca(r('cuatro').max, 4935, 1e-9, 'máximo con ±5 %');
  cerca(r('baja').R, 2.2, 1e-12, 'multiplicador oro'); cerca(r('cinco').R, 1000, 0, '5 bandas'); cerca(r('tres').tol, 20, 0, '3 bandas: ±20 %');
  if (r('seis').tc !== 100) mal('Resistencias: la sexta banda marrón no da 100 ppm/K');
  if (r('cuatro').serie !== 'E6' || ResistenciasC.normalizado(4990).exacta !== 'E96' || ResistenciasC.normalizado(5000).exacta !== null) mal('Resistencias: las series normalizadas no se reconocen bien');
  // ida y vuelta: del valor a los colores y de los colores al valor
  for (const [v, n] of [['4k7', 4], ['0R47', 4], ['2M2', 4], ['12,4k', 5], ['332', 5], ['1', 4]]) {
    const ida = ResistenciasC.valor({ valor: v, bandas: String(n) }), sc = { modo: 'colores', bandas: String(n) };
    ida.bandas.forEach((k, i) => { sc[`b${i + 1}`] = k; });
    cerca(ResistenciasC.colores(sc).R, ResistenciasC.leeValor(v), 1e-9 * ida.R, `ida y vuelta de ${v}`);
  }
  const raro = r('valor-raro');
  cerca(raro.Rn, 4700, 0, '5000 Ω en la E12'); cerca(raro.err, -6, 1e-9, 'diferencia con el normalizado');
  cerca(ResistenciasC.valor({ valor: '5000', bandas: '5', serie: 'E96' }).Rn, 4990, 0, '5000 Ω en la E96');
  cerca(ResistenciasC.valor({ valor: '980', bandas: '4', serie: 'E12' }).Rn, 1000, 0, '980 Ω pasa a la década siguiente');
  if (ResistenciasC.SERIES.E96.length !== 96 || ResistenciasC.SERIES.E48.length !== 48) mal('Resistencias: las series E48 y E96 no tienen 48 y 96 valores');
  cerca(r('smd-472').R, 4700, 0, 'SMD 472'); cerca(r('smd-4r7').R, 4.7, 1e-12, 'SMD 4R7'); cerca(r('smd-eia').R, 10000, 0, 'EIA-96 01C');
  cerca(ResistenciasC.smd({ codigo: '1002' }).R, 10000, 0, 'SMD 1002'); cerca(ResistenciasC.smd({ codigo: '68X' }).R, 49.9, 1e-9, 'EIA-96 68X');
  for (const [sc, q] of [[{ modo: 'colores', bandas: '4', b1: 'negro', b2: 'rojo', b3: 'rojo', b4: 'oro' }, 'primera banda negra'], [{ modo: 'colores', bandas: '4', b1: 'oro', b2: 'rojo', b3: 'rojo', b4: 'oro' }, 'oro como cifra'], [{ modo: 'colores', bandas: '4', b1: 'rojo', b2: 'rojo', b3: 'rojo', b4: 'blanco' }, 'blanco como tolerancia'], [{ modo: 'valor', valor: 'abc' }, 'valor sin sentido'], [{ modo: 'smd', codigo: 'XYZ' }, 'código SMD sin sentido']]) {
    let ok = false; try { ResistenciasC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Resistencias: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Código de colores: ${ResistenciasC.ejemplos.length} ejemplos, 3 a 6 bandas, ida y vuelta valor ↔ colores, series E, SMD y errores`);
}

const RegresionC = require(path.join(fuente, 'regresion', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Regresión · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => RegresionC.resolver(RegresionC.ejemplos.find((e) => e.clave === c).sc);
  for (const e of RegresionC.ejemplos) { try { const s = RegresionC.resolver(e.sc); if (!s.pasos.length || !isFinite(s.R2)) mal(`Regresión · ${e.clave}: sin resultado`); } catch (err) { mal(`Regresión · ${e.clave}: ${err.message}`); } }
  const n = r('notas');
  cerca(n.m.mx, 4, 1e-12, 'media de x'); cerca(n.m.vx, 4, 1e-12, 'varianza de x'); cerca(n.m.cxy, 4, 1e-12, 'covarianza'); cerca(n.lineal.b, 1, 1e-12, 'pendiente'); cerca(n.lineal.a, 43 / 7 - 4, 1e-12, 'ordenada');
  cerca(n.r, 4 / (2 * Math.sqrt(292.5 / 7 - (43 / 7) ** 2)), 1e-12, 'r de las notas'); cerca(n.yx0, 43 / 7 - 4 + 4.5, 1e-12, 'estimación para x = 4,5');
  const pa = r('peso-altura'); cerca(pa.lineal.b * pa.xSobreY.b, pa.r * pa.r, 1e-12, 'producto de las pendientes = r²');
  if (r('inversa').r >= -0.9) mal('Regresión: el ejemplo inverso no da una correlación negativa fuerte');
  if (r('frecuencias').m.N !== 24) mal('Regresión: la tabla con frecuencias no suma N = 24');
  if (!(r('debil').pval > 0.05)) mal('Regresión: los datos sin relación salen significativos');
  const k = r('kepler'); cerca(k.coef.b, 1.5, 0.01, 'exponente de Kepler'); cerca(k.coef.a, 1, 0.01, 'coeficiente de Kepler');
  cerca(r('bacterias').coef.b, 0.5, 0.01, 'tasa de crecimiento');
  const fr = r('frenada'); for (const [g, q] of [[() => 1, '∑e'], [(x) => x, '∑ex'], [(x) => x * x, '∑ex²']]) cerca(fr.residuos.reduce((s, p) => s + p.e * g(p.x), 0), 0, 1e-6, `parábola: ${q} = 0`);
  if (RegresionC.leeDatos('x;y\n1;2,5\n# nota\n3\t4').length !== 2) mal('Regresión: no se salta la cabecera y el comentario o no lee «;» y tabuladores');
  for (const [sc, q] of [[{ datos: '1 2' }, 'un punto'], [{ datos: '2 1\n2 3' }, 'misma x'], [{ datos: '1 2\nhola 3' }, 'texto'], [{ datos: '-1 2\n2 3', modelo: 'potencial' }, 'potencial con x negativa'], [{ datos: '1 2\n1 3\n2 4', modelo: 'parabolica' }, 'parábola con dos x'], [{ datos: '1 2 0\n2 3' }, 'frecuencia 0']]) {
    let ok = false; try { RegresionC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Regresión: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Regresión: ${RegresionC.ejemplos.length} ejemplos, medias, covarianza, r, las dos rectas, frecuencias, ajustes no lineales, parábola y errores`);
}

const ComplejosC = require(path.join(fuente, 'complejos', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Complejos · ${q}: ${a} en vez de ${b}`); };
  const cz = (z, re, im, q) => { cerca(z.re, re, 1e-9, `${q} (parte real)`); cerca(z.im, im, 1e-9, `${q} (parte imaginaria)`); };
  const r = (c) => ComplejosC.resolver(ComplejosC.ejemplos.find((e) => e.clave === c).sc);
  const A_ = require(path.join(fuente, 'matematicas', 'algebra.js'));
  for (const e of ComplejosC.ejemplos) { try { if (!ComplejosC.resolver(e.sc).pasos.length) mal(`Complejos · ${e.clave}: sin desarrollo`); } catch (err) { mal(`Complejos · ${e.clave}: ${err.message}`); } }
  const fo = r('formas'); cerca(fo.formas.r, 5, 1e-12, 'módulo de 3 + 4i'); cerca(fo.formas.t * 180 / Math.PI, 53.130102354, 1e-6, 'argumento de 3 + 4i');
  if (A_.txt(A_.div(A_.c1, fo.ex)) !== '3/25 − 4/25·i') mal('Complejos: el inverso de 3 + 4i no es 3/25 − 4/25 i');
  cerca(r('tercero').formas.t, -3 * Math.PI / 4, 1e-12, 'argumento de −2 − 2i (tercer cuadrante)');
  if (r('tercero').formas.rT !== '2√2 ≈ 2,828') mal('Complejos: el módulo de −2 − 2i no sale 2√2');
  if (A_.txt(r('suma').ex) !== '4 − 3i' || A_.txt(r('producto').ex) !== '5 + i' || A_.txt(r('cociente').ex) !== '1/2 + 5/2·i') mal('Complejos: suma, producto o cociente exactos mal');
  cz(r('polar').z, 0, 6, '2∠30° · 3∠60°'); cz(r('moivre').z, 16, 0, '(1 + i)⁸');
  const rc = r('raices-cubicas'); if (rc.raices.length !== 3) mal('Complejos: −8 no tiene 3 raíces cúbicas');
  cz(rc.raices[1].z, -2, 0, 'raíz cúbica real de −8'); cz(rc.raices[0].z, 1, Math.sqrt(3), 'primera raíz cúbica de −8');
  for (const q of r('raices-unidad').raices) cerca(ComplejosC.mod(q.z), 1, 1e-12, 'raíces de la unidad en la circunferencia');
  const ec = r('ecuacion'); cz(ec.z1, 1, 2, 'z² − 2z + 5 = 0 (z₁)'); cz(ec.z2, 1, -2, 'z² − 2z + 5 = 0 (z₂)');
  const eq = r('ecuacion-compleja'); for (const z of [eq.z1, eq.z2]) { const z2 = { re: z.re * z.re - z.im * z.im, im: 2 * z.re * z.im }; cz({ re: z2.re + 3 * z.im - 3, im: z2.im - 3 * z.re + 1 }, 0, 0, 'la solución cumple la ecuación compleja'); }
  cz(r('exponencial').z, 1, Math.sqrt(3), '2e^(iπ/3)');
  cz(ComplejosC.leeZ('2(cos 60° + i sen 60°)', 'grados', 'z').z, 1, Math.sqrt(3), 'forma trigonométrica'); cz(ComplejosC.leeZ('√2_45', 'grados', 'z').z, 1, 1, 'polar √2_45'); cz(ComplejosC.leeZ('2∠π/2', 'grados', 'z').z, 0, 2, 'polar con π');
  for (const [sc, q] of [[{ op: 'formas', z1: 'hola' }, 'un texto'], [{ op: 'cociente', z1: '1', z2: '0' }, 'dividir entre 0'], [{ op: 'raices', z1: '8', n: '1' }, 'raíz de índice 1'], [{ op: 'ecuacion', a: '0', b: '1', c: '1' }, 'a = 0'], [{ op: 'formas', z1: '2(cos 30° + i sen 60°)' }, 'ángulos distintos en la trigonométrica'], [{ op: 'formas', z1: '-2∠30°' }, 'módulo negativo']]) {
    let ok = false; try { ComplejosC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Complejos: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Números complejos: ${ComplejosC.ejemplos.length} ejemplos, cuatro formas, cuadrantes, operaciones exactas, De Moivre, raíces, ecuaciones y errores`);
}

const FluidosF = require(path.join(fuente, 'fluidos', 'fisica.js'));
{
  // valores calculados a mano
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Fluidos · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => FluidosF.resolver(FluidosF.ejemplos.find((e) => e.clave === c).sc);
  const bu = r('buceo');
  cerca(bu.pm, 1025 * 9.8 * 20, 1e-6, 'presión manométrica a 20 m'); cerca(bu.pa, 101325 + 1025 * 9.8 * 20, 1e-6, 'presión absoluta (con la atmósfera)');
  cerca(r('piscina').F, 1000 * 9.8 * 2 * 50, 1e-6, 'fuerza sobre el fondo');
  cerca(r('barometro').pa, 13600 * 9.8 * 0.76, 1e-6, 'barómetro con vacío encima');
  const tu = r('tubo-aceite');
  cerca(tu.h1, 0.08, 1e-12, 'tubo en U: altura del agua'); cerca(tu.dh, 0.02, 1e-12, 'tubo en U: desnivel');
  cerca(r('tubo-densidad').rho2, 850, 1e-9, 'tubo en U: densidad');
  const el = r('elevador');
  cerca(el.F1, (1500 * 9.8) / 100, 1e-9, 'prensa: fuerza para levantar 1500 kg'); cerca(el.x2, 0.2, 1e-12, 'prensa: recorrido del émbolo grande');
  cerca(r('prensa').F2, 200 * 225, 1e-6, 'prensa: fuerza que se consigue');
  const ma = r('madera');
  if (!ma.flota) mal('Fluidos: la madera no flota'); cerca(ma.Vs, 0.0012, 1e-12, 'volumen sumergido de la madera');
  cerca(1 - r('iceberg').Vs / 1000, 1 - 917 / 1025, 1e-12, 'parte visible del iceberg');
  const fe = r('hierro');
  if (fe.flota !== false) mal('Fluidos: el hierro no se hunde');
  cerca(fe.Pa, (7870 - 1000) * 1e-4 * 9.8, 1e-9, 'peso aparente del hierro'); cerca(fe.a, 9.8 * (1 - 1000 / 7870), 1e-9, 'aceleración al soltar el hierro');
  const co = r('corona');
  cerca(co.E, 0.6, 1e-9, 'empuje de la corona'); cerca(co.rhoC, (1000 * 10) / 0.6, 1e-6, 'densidad de la corona'); cerca(co.V, 0.6 / 9800, 1e-12, 'volumen de la corona');
  // al revés: con esa densidad y ese volumen vuelve a salir el peso aparente
  cerca(FluidosF.empuje({ datos: 'cuerpo', rhoC: String(co.rhoC), V: String(co.V), rhoF: '1000', g: '9.8' }).Pa, 9.4, 1e-9, 'peso aparente de vuelta');
  const ve = r('venturi');
  cerca(ve.v2, 8, 1e-12, 'Venturi: velocidad en el estrechamiento'); cerca(ve.p2, 1.5e5 - 500 * 60, 1e-6, 'Venturi: presión en el estrechamiento');
  const ca = r('casa'), v1 = 0.0015 / (Math.PI * 0.02 ** 2);
  cerca(ca.v1, v1, 1e-12, 'velocidad a partir del caudal'); cerca(ca.v2, 4 * v1, 1e-12, 'continuidad con la mitad de diámetro');
  cerca(ca.p2, 4e5 + 500 * (v1 * v1 - 16 * v1 * v1) - 1000 * 9.8 * 6, 1e-6, 'Bernoulli subiendo 6 m');
  const de = r('deposito');
  cerca(de.v, Math.sqrt(2 * 9.8 * 2), 1e-12, 'Torricelli: velocidad'); cerca(de.x, 2 * Math.sqrt(2), 1e-12, 'Torricelli: alcance'); cerca(de.tv, 2500 * Math.sqrt(4 / 9.8), 1e-9, 'Torricelli: tiempo de vaciado');
  if (FluidosF.f(302225) !== '3,022·10<sup>5</sup>') mal(`Fluidos: 302225 Pa sale «${FluidosF.f(302225)}»`);
  for (const [sc, q] of [[{ modo: 'tuboU', rho1: '1000', rho2: '13600', h2: '0.1' }, 'líquido añadido más denso'], [{ modo: 'tuboU', buscar: 'densidad', rho1: '1000', h1: '0.2', h2: '0.1' }, 'columna añadida más baja'], [{ modo: 'prensa', F1: '10', d1: '20', d2: '5' }, 'émbolo grande más estrecho'], [{ modo: 'empuje', datos: 'pesadas', P: '5', Pa: '6', rhoF: '1000' }, 'pesa más dentro del agua'], [{ modo: 'torricelli', H: '2', D: '1' }, 'depósito sin agujero'], [{ modo: 'presion', rho: '1000', h: '-3' }, 'profundidad negativa'], [{ modo: 'bernoulli', rho: '1000', d1: '10', d2: '5', v1: '2' }, 'sin la presión en 1']]) {
    let ok = false; try { FluidosF.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Fluidos: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Fluidos: ${FluidosF.ejemplos.length} ejemplos, presión, tubo en U, prensa, Arquímedes, Bernoulli, Torricelli y errores`);
}

const PHC = require(path.join(fuente, 'ph', 'calculo.js'));
{
  // valores calculados a mano
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`pH · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => PHC.resolver(PHC.ejemplos.find((e) => e.clave === c).sc), lg = Math.log10, pKa = -lg(1.8e-5);
  cerca(r('hcl').pH, 2, 1e-12, 'HCl 0,01 M'); cerca(r('baoh2').pH, 12, 1e-12, 'Ba(OH)₂ con dos OH⁻');
  cerca(r('diluido').pH, -lg((1e-8 + Math.sqrt(1e-16 + 4e-14)) / 2), 1e-12, 'ácido muy diluido con el agua');
  const ac = r('acetico'), x = (-1.8e-5 + Math.sqrt(1.8e-5 ** 2 + 4 * 1.8e-6)) / 2;
  cerca(ac.pH, -lg(x), 1e-12, 'ácido acético'); cerca(ac.alfa, x / 0.1, 1e-12, 'grado de disociación');
  cerca(ac.pH, PHC.exacto({ ca: 0.1, Ka: 1.8e-5 }), 1e-3, 'ácido acético con el balance de cargas');
  const am = r('amoniaco'), y = (-1.8e-5 + Math.sqrt(1.8e-5 ** 2 + 4 * 3.6e-6)) / 2;
  cerca(am.pH, 14 + lg(y), 1e-12, 'amoniaco');
  if (!(r('hf').alfa > 0.05)) mal('pH: el HF 0,01 M debería tener α > 5 %');
  cerca(r('tampon-acetato').pH, pKa, 1e-12, 'tampón con las dos formas iguales');
  cerca(r('tampon-hcl').pH, pKa + lg(0.009 / 0.011), 1e-12, 'tampón al añadir HCl');
  cerca(r('tampon-amonio').pH, 14 - pKa + lg(0.15 / 0.1), 1e-12, 'tampón amoniaco/amonio');
  cerca(r('mezcla').pH, 14 + lg(0.001 / 0.08), 1e-12, 'mezcla con exceso de base');
  const vf = r('val-fuerte');
  cerca(vf.Veq, 25, 1e-12, 'volumen de equivalencia'); cerca(vf.pHv, -lg(0.0005 / 0.045), 1e-12, 'pH antes de la equivalencia'); cerca(vf.ph(25), 7, 1e-6, 'pH 7 en la equivalencia fuerte-fuerte');
  const va = r('val-acetico');
  cerca(va.pHv, pKa, 1e-12, 'pH = pKa a mitad'); cerca(va.ph(25), va.pHeq, 0.01, 'pH de equivalencia exacto y de clase'); cerca(va.ph(12.5), pKa, 0.01, 'curva exacta a mitad');
  if (va.ind[0] !== 'fenolftaleína') mal(`pH: para el acético con NaOH sale ${va.ind[0]}`);
  if (va.curva.some((q, i) => i && q[1] < va.curva[i - 1][1] - 1e-9)) mal('pH: la curva de valoración de un ácido no sube siempre');
  const vb = r('val-amoniaco');
  cerca(vb.pHv, -lg(0.001 / 0.05), 1e-12, 'pasada la equivalencia con HCl'); cerca(vb.ph(20), vb.pHeq, 0.01, 'equivalencia del amoniaco');
  // un tampón que se agota no da error y el pH cae
  const ag = PHC.tampon({ especie: 'acido', K: '1.8e-5', Cd: '0.1', Cs: '0.1', V: '100', anade: 'acido', Cad: '1', Vad: '20' });
  cerca(ag.pH, PHC.exacto({ ca: 0.02 / 0.12, Ka: 1.8e-5, na: 0.01 / 0.12, cl: 0.02 / 0.12 }), 1e-9, 'tampón agotado');
  if (PHC.f2(2.875) !== '2,88' && PHC.f2(2.875) !== '2,87') mal(`pH: 2,875 sale «${PHC.f2(2.875)}»`);
  for (const [sc, q] of [[{ modo: 'debil', C: '0.1' }, 'sin Ka'], [{ modo: 'fuerte', C: '-1' }, 'concentración negativa'], [{ modo: 'valoracion', tipo: 'ad-bf', C: '0.1', V: '25', Ct: '0.1' }, 'valoración débil sin Ka'], [{ modo: 'mezcla', Ca: '0.1', Va: '10', Cb: '0.1' }, 'mezcla sin volumen de base']]) {
    let ok = false; try { PHC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`pH: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ pH y valoraciones: ${PHC.ejemplos.length} ejemplos, fuertes, débiles, tampones, mezclas, curvas e indicador`);
}

const CiclosF = require(path.join(fuente, 'ciclos', 'fisica.js'));
{
  // valores calculados a mano
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Ciclos · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => CiclosF.resolver(CiclosF.ejemplos.find((e) => e.clave === c).sc), R = 8.314;
  const ca = r('carnot');
  cerca(ca.eta, 0.5, 1e-12, 'rendimiento de Carnot'); cerca(ca.Qabs, R * 600 * Math.log(2), 1e-9, 'calor de la isoterma caliente'); cerca(ca.W, 0.5 * R * 600 * Math.log(2), 1e-9, 'trabajo de Carnot');
  cerca(ca.est[2].V, 0.02 * 2 ** 2.5, 1e-12, 'volumen tras la adiabática');
  cerca(r('carnot-mono').eta, 1 - 350 / 500, 1e-12, 'Carnot monoatómico');
  const ot = r('otto');
  cerca(ot.eta, 1 - 8 ** -0.4, 1e-12, 'rendimiento del Otto'); cerca(ot.est[1].T, 300 * 8 ** 0.4, 1e-9, 'temperatura tras la compresión'); cerca(ot.est[3].T, 1800 * 8 ** -0.4, 1e-9, 'temperatura tras la expansión');
  const n = (100e3 * 0.5e-3) / (R * 300);
  cerca(ot.Qabs, n * 2.5 * R * (1800 - 300 * 8 ** 0.4), 1e-9, 'calor de la combustión');
  cerca(r('otto-calor').Qabs, 800, 1e-9, 'Otto con el calor dado');
  const di = r('diesel'), g = 1.4;
  cerca(di.eta, 1 - (2 ** g - 1) / (g * 18 ** (g - 1)), 1e-12, 'rendimiento del Diesel');
  // en todos los ciclos la suma de ΔU es 0 y W neto = Q neto
  for (const c of ['carnot', 'otto', 'diesel']) { const x = r(c); cerca(x.tramos.reduce((s, t) => s + t.U, 0), 0, 1e-9 * x.Qabs, `ΔU del ciclo ${c}`); cerca(x.tramos.reduce((s, t) => s + t.Q, 0), x.W, 1e-9 * x.Qabs, `Q neto del ciclo ${c}`); if (x.eta > x.etaC) mal(`Ciclos: el ${c} supera a Carnot`); }
  const mo = r('motor');
  cerca(mo.Qf, 650, 1e-12, 'calor cedido de la máquina'); cerca(mo.ef, 0.35, 1e-12, 'rendimiento de la máquina'); if (!mo.posible || !(mo.dS > 0)) mal('Ciclos: la máquina del 35 % debería ser posible con ΔS > 0');
  const im = r('imposible');
  if (im.posible !== false || !(im.dS < 0)) mal('Ciclos: la máquina del 60 % entre 600 y 300 K debería ser imposible');
  const fr = r('frigorifico');
  cerca(fr.ef, 3, 1e-12, 'COP del frigorífico'); cerca(fr.efC, 268 / 30, 1e-12, 'COP de Carnot del frigorífico');
  cerca(r('bomba').ef, 3.5, 1e-12, 'COP de la bomba de calor');
  for (const [sc, q] of [[{ modo: 'carnot', Tc: '300', Tf: '400', n: '1', V1: '1', V2: '2' }, 'foco frío más caliente'], [{ modo: 'carnot', Tc: '600', Tf: '300', n: '1', V1: '2', V2: '1' }, 'isoterma que comprime'], [{ modo: 'otto', r: '8', T1: '300', P1: '100', V1: '1', T3: '400' }, 'T₃ menor que T₂'], [{ modo: 'diesel', r: '10', rc: '12', T1: '300', P1: '100', V1: '1' }, 'corte mayor que la compresión'], [{ modo: 'maquina', Qc: '1000' }, 'máquina con un solo dato'], [{ modo: 'maquina', Qc: '1000', Qf: '500', W: '300' }, 'datos que no cumplen el primer principio']]) {
    let ok = false; try { CiclosF.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Ciclos: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Ciclos termodinámicos: ${CiclosF.ejemplos.length} ejemplos, Carnot, Otto, Diesel, balances, máquinas posibles e imposibles y errores`);
}

const Expr = require(path.join(fuente, 'matematicas', 'expresion.js'));
const TaylorC = require(path.join(fuente, 'taylor', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Taylor · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => TaylorC.resolver(TaylorC.ejemplos.find((e) => e.clave === c).sc);
  for (const e of TaylorC.ejemplos) {
    try { const x = TaylorC.resolver(e.sc); if (x.pasos.length < 4) mal(`Taylor · ${e.clave}: desarrollo corto`); if (x.cota !== null && !(x.err <= x.cota * (1 + 1e-9) + 1e-15)) mal(`Taylor · ${e.clave}: el error ${x.err} supera la cota ${x.cota}`); }
    catch (err) { mal(`Taylor · ${e.clave}: ${err.message}`); }
  }
  // valores calculados a mano
  const ex = r('exp'); [1, 1, 1 / 2, 1 / 6, 1 / 24].forEach((c, k) => cerca(ex.coef[k], c, 1e-14, `coeficiente ${k} de e^x`));
  cerca(ex.px0, 1 + 0.5 + 0.125 + 0.5 ** 3 / 6 + 0.5 ** 4 / 24, 1e-14, 'P4(0,5) de e^x'); cerca(ex.fx0, Math.sqrt(Math.E), 1e-14, '√e');
  if (ex.pol !== '1 + x + {x^{2}}/{2} + {x^{3}}/{6} + {x^{4}}/{24}') mal(`Taylor: el polinomio de e^x sale «${ex.pol}»`);
  if (r('seno').pol !== 'x − {x^{3}}/{6} + {x^{5}}/{120}') mal('Taylor: el polinomio de sen x no es x − x³/6 + x⁵/120');
  if (!r('seno-pi6').pol.includes('{√3}/{2} (x − {π}/{6})')) mal('Taylor: en π/6 el coeficiente de sen x no sale √3/2');
  cerca(r('raiz').px0, 2 + 0.1 / 4 - 0.01 / 64, 1e-12, '√4,1 con grado 2');
  cerca(r('tangente').coef[5], 2 / 15, 1e-12, 'coeficiente de x⁵ de tg x');
  cerca(r('polinomio').err, 0, 1e-12, 'un polinomio es su propio Taylor');
  for (const c of ['exp', 'seno', 'coseno', 'ln1x', 'geometrica', 'binomica', 'arctg']) if (!r(c).conocido) mal(`Taylor · ${c}: no reconoce el desarrollo conocido`);
  if (r('gauss').conocido || r('tangente').conocido) mal('Taylor: reconoce un desarrollo conocido que no lo es');
  // derivadas simbólicas
  const D = (s, k = 1) => { let n = Expr.lee(s); for (let i = 0; i < k; i++) n = Expr.deriva(n); return Expr.texto(n); };
  const DS = [['x^2 e^x', 1, '2 x e^{x} + x^{2} e^{x}'], ['ln(1+x)', 2, '−{1}/{(1 + x)^{2}}'], ['sen^2 x', 1, '2 sen x cos x'], ['√x', 1, '{1}/{2 √x}'], ['1/(1-x)', 3, '{6}/{(1 − x)^{4}}'], ['x sen x', 2, '2 cos x − x sen x'], ['e^(-x^2)', 1, '−2 x e^{−x^{2}}'], ['tg x', 1, '{1}/{cos^{2} x}'], ['x^3 - 2x + 1', 1, '3 x^{2} − 2']];
  for (const [s, k, t] of DS) { const v = D(s, k); if (v !== t) mal(`Taylor: la derivada ${k} de ${s} sale «${v}» y no «${t}»`); }
  // la serie y la derivada simbólica dan lo mismo que una derivada numérica
  for (const s of ['e^x sen x', 'ln(2 + cos x)', 'arcsen(x/2)', 'x^x', 'senh x / (1 + x^2)', '∛(1 + x)', 'arctg(x^2) - 3 tg x', '2^x', '|x - 3|', 'sec x']) {
    const n = Expr.lee(s), a = 0.7, h = 1e-5, dn = (Expr.valor(n, a + h) - Expr.valor(n, a - h)) / (2 * h);
    cerca(Expr.serie(n, a, 2)[1], dn, 1e-6 * Math.max(1, Math.abs(dn)), `serie de ${s}`);
    cerca(Expr.valor(Expr.deriva(n), a), dn, 1e-6 * Math.max(1, Math.abs(dn)), `derivada de ${s}`);
    cerca(Expr.serie(n, a, 2)[2] * 2, (Expr.valor(n, a + 1e-3) - 2 * Expr.valor(n, a) + Expr.valor(n, a - 1e-3)) / 1e-6, 1e-3 * Math.max(1, Math.abs(dn)), `segunda derivada de ${s}`);
  }
  if (Expr.valor(Expr.lee('2x sen x + 3,5'), 1) !== 2 * Math.sin(1) + 3.5 || Expr.valor(Expr.lee('sen 2x cos x'), 1) !== Math.sin(2) * Math.cos(1)) mal('Taylor: no lee el producto implícito o la coma decimal');
  for (const [sc, q] of [[{ f: '', a: '0', n: '3' }, 'sin función'], [{ f: 'y + 1', a: '0', n: '3' }, 'otra letra'], [{ f: 'ln x', a: '0', n: '3' }, 'ln x en 0'], [{ f: 'sen x', a: '0', n: '16' }, 'grado 16'], [{ f: 'sen x', a: 'x', n: '2' }, 'a con x'], [{ f: '(x + 1', a: '0', n: '2' }, 'paréntesis sin cerrar'], [{ f: '√x', a: '1', n: '2', x0: '−1' }, 'x₀ fuera del dominio']]) {
    let ok = false; try { TaylorC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Taylor: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Series de Taylor: ${TaylorC.ejemplos.length} ejemplos, coeficientes exactos, error por debajo de la cota de Lagrange, desarrollos conocidos, derivadas simbólicas y numéricas y errores`);
}

const FourierC = require(path.join(fuente, 'fourier', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol)) mal(`Fourier · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => FourierC.resolver(FourierC.ejemplos.find((e) => e.clave === c).sc), PI = Math.PI;
  for (const e of FourierC.ejemplos) { try { const x = FourierC.resolver(e.sc); if (x.pasos.length < 6) mal(`Fourier · ${e.clave}: desarrollo corto`); if (!(x.parcial <= x.energia * (1 + 1e-9))) mal(`Fourier · ${e.clave}: los armónicos suman más energía que f (Parseval)`); } catch (err) { mal(`Fourier · ${e.clave}: ${err.message}`); } }
  // coeficientes calculados a mano
  const cu = r('cuadrada'); for (let n = 1; n <= 12; n++) { cerca(cu.bn[n], n % 2 ? 4 / (n * PI) : 0, 1e-12, `b${n} de la onda cuadrada`); cerca(cu.an[n], 0, 1e-12, `a${n} de la onda cuadrada`); }
  if (cu.gB !== '{2 (1 − (−1)^n)}/{n π}' || !cu.impar || cu.saltos.length !== 2) mal(`Fourier: la onda cuadrada sale con bn = «${cu.gB}», impar ${cu.impar}, ${cu.saltos.length} saltos`);
  const si = r('sierra'); for (let n = 1; n <= 10; n++) cerca(si.bn[n], (2 * (n % 2 ? 1 : -1)) / n, 1e-12, `b${n} del diente de sierra`);
  if (si.gB !== '{2 (−1)^{n+1}}/{n}') mal(`Fourier: el diente de sierra sale con bn = «${si.gB}»`);
  const pa = r('parabola'); cerca(pa.an[0], (2 * PI * PI) / 3, 1e-12, 'a0 de x²'); for (let n = 1; n <= 10; n++) cerca(pa.an[n], (4 * (n % 2 ? -1 : 1)) / (n * n), 1e-12, `a${n} de x²`);
  if (pa.gA !== '{4 (−1)^{n}}/{n^{2}}' || !pa.par || pa.saltos.length) mal(`Fourier: x² sale con an = «${pa.gA}», par ${pa.par}, ${pa.saltos.length} saltos`);
  cerca(r('triangular').an[3], -4 / (9 * PI), 1e-12, 'a3 de |x|');
  for (let n = 0; n <= 9; n++) cerca(r('cosenos').an[n], r('triangular').an[n], 1e-12, `a${n} de la extensión par de x frente a |x|`);
  for (let n = 1; n <= 9; n++) { cerca(r('senos').bn[n], cu.bn[n], 1e-12, `b${n} de la extensión impar de 1`); cerca(r('cuadrada-T2').bn[n], cu.bn[n], 1e-12, `b${n} de la cuadrada de periodo 2`); }
  const sp = r('senos-parabola'); if (sp.gB !== '{4 (1 − (−1)^n)}/{n^{3} π}') mal(`Fourier: x(π − x) en senos sale con bn = «${sp.gB}»`);
  const pu = r('pulso'); cerca(pu.an[0], 1, 1e-12, 'a0 del pulso'); cerca(pu.bn[1], 2 / PI, 1e-12, 'b1 del pulso'); if (pu.saltos.some((s) => Math.abs(s.media - 0.5) > 1e-9)) mal('Fourier: en los saltos del pulso la serie no converge a 1/2');
  const re = r('rectificada'); cerca(re.an[0], 4 / PI, 1e-12, 'a0 de |sen x|'); cerca(re.an[2], -4 / (3 * PI), 1e-12, 'a2 de |sen x|'); cerca(re.an[1], 0, 1e-12, 'a1 de |sen x|');
  cerca(r('media-onda').bn[1], 0.5, 1e-12, 'b1 de la media onda'); cerca(r('sierra-0-2pi').an[0], 2 * PI, 1e-12, 'a0 de x en [0, 2π]');
  // Parseval de x²: 2π⁴/5
  cerca(pa.energia, (2 * PI ** 4) / 5, 1e-9, 'Parseval de x²');
  // x² en x = π: la serie converge a π² y la suma parcial se acerca
  if (!(Math.abs(pa.sx0 - PI * PI) < 0.5)) mal('Fourier: la suma parcial de x² en π no se acerca a π²');
  for (const [sc, q] of [[{ tramos: [{ f: '', a: '0', b: '1' }], N: '5' }, 'sin función'], [{ tramos: [{ f: '1', a: '1', b: '0' }], N: '5' }, 'tramo al revés'], [{ tramos: [{ f: '1', a: '0', b: '1' }, { f: '0', a: '2', b: '3' }], N: '5' }, 'hueco entre tramos'], [{ tramos: [{ f: '1', a: '0', b: 'π' }], N: '0' }, 'N = 0'], [{ tramos: [{ f: '1', a: '0', b: 'π' }], N: '101' }, 'N = 101'], [{ ext: 'par', tramos: [{ f: 'x', a: '1', b: '2' }], N: '5' }, 'extensión que no empieza en 0'], [{ tramos: [{ f: 'ln x', a: '-1', b: '1' }], N: '5' }, 'ln x con negativos']]) {
    let ok = false; try { FourierC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Fourier: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Series de Fourier: ${FourierC.ejemplos.length} ejemplos, coeficientes a mano, términos generales, paridad, extensiones par e impar, saltos, Parseval y errores`);
}

const EDOsC = require(path.join(fuente, 'edos', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`EDOs · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => EDOsC.resolver(EDOsC.ejemplos.find((e) => e.clave === c).sc);
  for (const e of EDOsC.ejemplos) { try { const x = EDOsC.resolver(e.sc); if (x.pasos.length < 3) mal(`EDOs · ${e.clave}: desarrollo corto`); } catch (err) { mal(`EDOs · ${e.clave}: ${err.message}`); } }
  // y′ = x + y, y(0) = 1: y = 2eˣ − x − 1; Euler con h = 0,1 a mano: y₁₀ = 3,187485
  const eu = r('euler');
  if (eu.exacta?.txt !== '2 e^{x} − 1 − x') mal(`EDOs: y′ = x + y sale «${eu.exacta?.txt}»`);
  cerca(eu.yEx, 2 * Math.E - 2, 1e-12, 'y(1) exacta'); cerca(eu.yEu, 3.1874849202, 1e-9, 'y(1) con Euler'); cerca(eu.yRK, 2 * Math.E - 2, 1e-7, 'y(1) con RK4');
  if (r('enfriamiento').exacta?.txt !== '70 e^{−{x}/{10}} + 20') mal('EDOs: la ley de enfriamiento no sale 70 e^(−x/10) + 20');
  if (r('forzada').exacta?.txt !== '{e^{−x}}/{2} − {cos x}/{2} + {sen x}/{2}') mal(`EDOs: y′ + y = sen x sale «${r('forzada').exacta?.txt}»`);
  if (r('logistica').exacta || r('riccati').exacta) mal('EDOs: da solución exacta de una ecuación no lineal');
  // segundo orden: soluciones a mano y que cumplen la ecuación
  if (r('resonancia').txt !== '{x sen x}/{2}') mal(`EDOs: y″ + y = cos x sale «${r('resonancia').txt}»`);
  if (r('critico').txt !== '2 e^{−x} + x e^{−x} − 2 + x') mal(`EDOs: y″ + 2y′ + y = x sale «${r('critico').txt}»`);
  if (r('mas').txt !== 'cos (2 x)') mal(`EDOs: y″ + 4y = 0 sale «${r('mas').txt}»`);
  for (const e of EDOsC.ejemplos.filter((q) => q.sc.modo === 'segundo')) {
    const x = EDOsC.resolver(e.sc), g = Expr.lee(e.sc.g);
    cerca(x.y(x.x0), x.y0, 1e-9, `${e.clave}: y(x₀)`); cerca(x.y(x.x0, 1), x.v0, 1e-9, `${e.clave}: y′(x₀)`);
    for (const t of [0.3, 1.1, 2.4]) cerca(x.a * x.y(t, 2) + x.b * x.y(t, 1) + x.c * x.y(t), Expr.valor(g, t), 1e-8, `${e.clave}: la solución no cumple la ecuación en x = ${t}`);
  }
  // sistemas: autovalores y tipo de cada punto crítico
  const si = r('silla').puntos[0]; if (si.tp.nom !== 'punto de silla' || Math.max(...si.ev.l) !== 3 || Math.min(...si.ev.l) !== -1) mal('EDOs: el punto de silla no tiene autovalores 3 y −1');
  if (!r('centro').puntos[0].tp.nom.startsWith('centro') || !r('foco').puntos[0].tp.nom.startsWith('foco estable') || r('nodo').puntos[0].tp.nom !== 'nodo estable') mal('EDOs: no distingue centro, foco y nodo');
  const lv = r('lotka').puntos; if (lv.length !== 2 || lv[1].x !== 3 || lv[1].y !== 2 || !lv[1].tp.nom.startsWith('centro') || lv[0].tp.nom !== 'punto de silla') mal('EDOs: Lotka-Volterra no da la silla en (0, 0) y el centro en (3, 2)');
  if (r('pendulo').puntos.length !== 3) mal('EDOs: el péndulo no da los tres puntos críticos −π, 0 y π');
  for (const c of ['silla', 'centro', 'foco', 'nodo']) { const x = r(c), fin = x.tray[x.tray.length - 1], X = x.sol.X(fin.t); cerca(X[0], fin.Y[0], 1e-6, `${c}: x(t) exacta frente a RK4`); cerca(X[1], fin.Y[1], 1e-6, `${c}: y(t) exacta frente a RK4`); }
  // derivadas parciales de Expresion
  const dy = Expr.deriva(Expr.lee('x y^2 - 2y + sen(x y)', 'f', ['x', 'y']), 'y');
  cerca(Expr.valor(dy, 0.7, { y: 1.3 }), 2 * 0.7 * 1.3 - 2 + 0.7 * Math.cos(0.7 * 1.3), 1e-12, '∂/∂y de x y² − 2y + sen(xy)');
  for (const [sc, q] of [[{ modo: 'primer', f: '', x0: '0', y0: '1', x1: '1', h: '0,1' }, 'sin función'], [{ modo: 'primer', f: 'x', x0: '0', y0: '1', x1: '1', h: '0' }, 'h = 0'], [{ modo: 'primer', f: 'x', x0: '2', y0: '1', x1: '1', h: '0,1' }, 'intervalo al revés'], [{ modo: 'primer', f: 'z + 1', x0: '0', y0: '1', x1: '1', h: '0,1' }, 'otra letra'], [{ modo: 'segundo', a: '0', b: '1', c: '1', g: '0', x0: '0', y0: '1', v0: '0', x1: '5' }, 'a = 0'], [{ modo: 'segundo', a: '1', b: '0', c: '1', g: 'tg x', x0: '0', y0: '1', v0: '0', x1: '5' }, 'g que no es de coeficientes indeterminados'], [{ modo: 'sistema', f: 'y', g: '-x', x0: '1', y0: '0', t1: '0' }, 't = 0'], [{ modo: 'sistema', f: 'ln x', g: 'y', x0: '-1', y0: '0', t1: '2' }, 'punto inicial fuera del dominio']]) {
    let ok = false; try { EDOsC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`EDOs: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Ecuaciones diferenciales: ${EDOsC.ejemplos.length} ejemplos, Euler a mano, soluciones exactas, segundo orden que cumple la ecuación, puntos críticos con su tipo, sistemas lineales exactos frente a RK4 y errores`);
}

const CinC = require(path.join(fuente, 'cinetica', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Cinética · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => CinC.resolver(CinC.ejemplos.find((e) => e.clave === c).sc);
  for (const e of CinC.ejemplos) { try { const x = CinC.resolver(e.sc); if (x.pasos.length < 3) mal(`Cinética · ${e.clave}: desarrollo corto`); } catch (err) { mal(`Cinética · ${e.clave}: ${err.message}`); } }
  // leyes integradas a mano
  const p1 = r('primer-orden'); cerca(p1.A, 0.25 * Math.exp(-5.1e-4 * 3600), 1e-12, '[A] de orden 1'); cerca(p1.t12, Math.LN2 / 5.1e-4, 1e-12, 't½ de orden 1'); cerca(p1.tC, Math.log(5) / 5.1e-4, 1e-12, 'tiempo hasta 0,05 M');
  const p0 = r('orden-cero'); cerca(p0.A, 0.26, 1e-12, '[A] de orden 0'); cerca(p0.t12, 125, 1e-12, 't½ de orden 0'); cerca(p0.tC, 200, 1e-12, 'tiempo de orden 0');
  const p2 = r('segundo-orden'); cerca(p2.A, 1 / (20 + 0.54 * 60), 1e-12, '[A] de orden 2'); cerca(p2.t12, 1 / (0.54 * 0.05), 1e-12, 't½ de orden 2');
  if (p0.unidad !== 'mol·L⁻¹·s⁻¹' || p1.unidad !== 's⁻¹' || p2.unidad !== 'L·mol⁻¹·s⁻¹') mal(`Cinética: unidades de k «${p0.unidad}», «${p1.unidad}», «${p2.unidad}»`);
  // orden 0 que se agota: no sale negativa
  if (CinC.orden({ n: '0', k: '0,01', A0: '0,5', t: '100' }).A !== 0) mal('Cinética: en orden 0 la concentración sale negativa al agotarse');
  // datos: cada ejemplo da su orden
  for (const [c, n, k] of [['datos-0', 0, 0.02], ['datos-1', 1, Math.LN2 / 20], ['datos-2', 2, 0.1]]) { const x = r(c); if (x.n !== n) mal(`Cinética: ${c} sale de orden ${x.n}`); cerca(x.k, k, 0.01, `k de ${c}`); }
  // datos exactos de orden 1: R² = 1
  const ts = [0, 5, 10, 15, 20], ex = CinC.datos({ ts: ts.join(' '), As: ts.map((t) => 0.8 * Math.exp(-0.07 * t)).join(' ') }); if (ex.n !== 1 || Math.abs(ex.fits[1].r2 - 1) > 1e-12) mal('Cinética: datos exactos de orden 1 no dan R² = 1'); cerca(ex.k, 0.07, 1e-9, 'k de datos exactos');
  // velocidades iniciales
  const i2 = r('iniciales-2'); if (i2.oA !== 2 || i2.oB !== 1 || i2.ley !== 'v = 25 [A]^{2} [B]') mal(`Cinética: 2 NO + O₂ sale «${i2.ley}»`); cerca(i2.k, 25, 1e-9, 'k de 2 NO + O₂');
  const i3 = r('iniciales-3'); if (i3.oA !== 1 || i3.oB !== 2) mal('Cinética: el ejemplo de órdenes 1 y 2 no sale'); if (r('iniciales-1').oA !== 1) mal('Cinética: el ejemplo de un reactivo no sale de orden 1');
  if (i2.unidad !== 'L²·mol⁻²·s⁻¹') mal(`Cinética: unidades de k de orden 3 «${i2.unidad}»`);
  // Arrhenius: Ea con dos temperaturas y vuelta atrás
  const a1 = r('arrhenius-ea'); cerca(a1.Ea, (-8.314 * Math.log(9.63e-4 / 3.46e-5)) / (1 / 328 - 1 / 298), 1e-12, 'Ea');
  const a2 = CinC.arrhenius({ tipo: 'k2', uT: 'K', Ea: String(a1.Ea / 1000), k1: '3,46e-5', T1: '298', T2: '328' }); cerca(a2.k2, 9.63e-4, 1e-9, 'k₂ de vuelta');
  const a3 = r('arrhenius-k2'); cerca(a3.k2, 0.01 * Math.exp((-50000 / 8.314) * (1 / 308.15 - 1 / 298.15)), 1e-12, 'k₂ con °C');
  for (const [sc, q] of [[{ modo: 'orden', n: '3', k: '1', A0: '1', t: '1' }, 'orden 3'], [{ modo: 'orden', n: '1', k: '', A0: '1', t: '1' }, 'sin k'], [{ modo: 'orden', n: '1', k: '1', A0: '0,5', t: '1', C: '0,8' }, 'concentración final mayor'], [{ modo: 'datos', ts: '0 1 2', As: '1 0,5' }, 'listas de distinto tamaño'], [{ modo: 'datos', ts: '0 2 1', As: '1 0,5 0,7' }, 'tiempos desordenados'], [{ modo: 'datos', ts: '0 1 2', As: '1 0 0,5' }, 'concentración 0'], [{ modo: 'iniciales', conB: true, exps: [{ A: '0,1', B: '0,1', v: '1' }, { A: '0,2', B: '0,2', v: '4' }, { A: '0,3', B: '0,3', v: '9' }] }, 'A y B que cambian a la vez'], [{ modo: 'arrhenius', tipo: 'ea', uT: 'K', k1: '1', T1: '300', k2: '2', T2: '300' }, 'misma temperatura'], [{ modo: 'arrhenius', tipo: 'ea', uT: 'C', k1: '1', T1: '-300', k2: '2', T2: '30' }, 'bajo el cero absoluto']]) {
    let ok = false; try { CinC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Cinética: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Cinética química: ${CinC.ejemplos.length} ejemplos, leyes integradas y vidas medias a mano, unidades de k, orden a partir de datos, velocidades iniciales, Arrhenius de ida y vuelta y errores`);
}

const CamC = require(path.join(fuente, 'campos', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Campos · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => CamC.resolver(CamC.ejemplos.find((e) => e.clave === c).sc);
  for (const e of CamC.ejemplos) { try { const x = CamC.resolver(e.sc); if (x.pasos.length < 3) mal(`Campos · ${e.clave}: desarrollo corto`); if (/\{\d{4,}\}\/\{\d{4,}\}/.test(x.pasos.map((q) => q.html).join(' '))) mal(`Campos · ${e.clave}: una fracción rara en el desarrollo`); } catch (err) { mal(`Campos · ${e.clave}: ${err.message}`); } }
  const p = r('paraboloide'); cerca(p.g0[0], 2, 1e-12, 'gradiente'); cerca(p.g0[1], 4, 1e-12, 'gradiente'); cerca(p.du, 3 * Math.SQRT2, 1e-12, 'derivada direccional'); cerca(p.lap, 4, 1e-12, 'laplaciano');
  const x3 = r('xyz'); cerca(x3.du, 16 / 3, 1e-12, 'derivada direccional en 3D'); if (!x3.armonica || !r('armonica').armonica || p.armonica) mal('Campos: no reconoce bien las funciones armónicas');
  if (CamC.ex(2 * Math.PI) !== '2 π' || CamC.ex(Math.LN2 / 2) !== '{ln 2}/{2}' || CamC.ex(5 / 3) !== '{5}/{3}') mal(`Campos: valores exactos «${CamC.ex(2 * Math.PI)}», «${CamC.ex(Math.LN2 / 2)}»`);
  const fu = r('fuente'); cerca(fu.div, 2, 1e-12, 'divergencia de (x, y)'); if (!fu.cons) mal('Campos: (x, y) no sale conservativo'); cerca(fu.phi, 1, 1e-9, 'potencial de (x, y)');
  const re = r('remolino'); cerca(re.rot0[2], 2, 1e-12, 'rotacional de (−y, x)'); if (re.cons) mal('Campos: (−y, x) sale conservativo');
  cerca(r('cizalla').rot0[2], -1, 1e-12, 'rotacional de la cizalla');
  const co = r('conservativo'); if (!co.cons) mal('Campos: (yz, xz, xy) no sale conservativo'); cerca(co.phi, 6, 1e-9, 'potencial xyz');
  const ca = r('carga'); if (!ca.cons || Math.abs(ca.div) > 1e-12) mal('Campos: el campo de una carga no sale con divergencia 0 y conservativo'); cerca(ca.phi, Math.LN2 / 2, 1e-9, 'potencial de la carga');
  cerca(r('circulo').W, 2 * Math.PI, 1e-9, 'trabajo en una vuelta'); cerca(r('circulo').L, 2 * Math.PI, 1e-9, 'longitud de la circunferencia');
  const pa = r('parabola'); cerca(pa.W, 1, 1e-9, 'trabajo por la parábola'); cerca(pa.dphi, 1, 1e-9, 'Δφ por la parábola');
  cerca(r('helice').W, 2 * Math.PI + 2 * Math.PI ** 2, 1e-9, 'trabajo por la hélice'); cerca(r('segmento').W, 5 / 3, 1e-9, 'trabajo por el segmento');
  const g1 = r('green-circulo'); cerca(g1.circula, 2 * Math.PI, 1e-9, 'circulación'); cerca(g1.dobleR, 2 * Math.PI, 1e-6, 'Green'); cerca(g1.flujo, 0, 1e-9, 'flujo');
  const g2 = r('green-rect'); cerca(g2.circula, 2, 1e-9, 'circulación en el rectángulo'); cerca(g2.dobleR, 2, 1e-9, 'Green en el rectángulo'); cerca(g2.flujo, 1, 1e-9, 'flujo en el rectángulo'); cerca(g2.dobleD, 1, 1e-9, 'divergencia en el rectángulo');
  const g3 = r('green-flujo'); cerca(g3.flujo, 8 * Math.PI, 1e-9, 'flujo de (x, y)'); cerca(g3.dobleD, 8 * Math.PI, 1e-6, 'divergencia de (x, y)');
  const ag = r('green-agujero'); cerca(ag.circula, 2 * Math.PI, 1e-9, 'circulación alrededor del origen'); if (!ag.singular || g1.singular || g2.singular || g3.singular) mal('Campos: no se avisa (o se avisa sin motivo) de que Green no vale con una singularidad dentro');
  const sc0 = CamC.ejemplos.find((e) => e.clave === 'paraboloide').sc;
  for (const [q, sc] of [['una f vacía', { ...sc0, f: '' }], ['un punto que no es un número', { ...sc0, x0: 'abc' }], ['la dirección cero', { ...sc0, u: '0, 0' }], ['un campo vacío', { modo: 'vectorial', P: '', Q: '', R: '', x0: '1', y0: '1' }], ['t final menor que el inicial', { modo: 'linea', P: 'y', Q: 'x', cx: 't', cy: 't', a: '1', b: '0' }], ['un radio negativo', { modo: 'green', P: 'y', Q: 'x', region: 'circulo', cx: '0', cy: '0', rad: '-1' }]]) {
    let ok = false; try { CamC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Campos: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Campos vectoriales: ${CamC.ejemplos.length} ejemplos, gradiente, derivada direccional, laplaciano, divergencia, rotacional, potencial, trabajo, Green y errores`);
}

const FzC = require(path.join(fuente, 'fuerza', 'fisica.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Fuerza magnética · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => FzC.resolver(FzC.ejemplos.find((e) => e.clave === c).sc), e = 1.602176634e-19, mp = 1.67262192e-27, me = 9.1093837e-31;
  for (const x of FzC.ejemplos) { try { const s = FzC.resolver(x.sc); if (s.pasos.length < 2) mal(`Fuerza magnética · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Fuerza magnética · ${x.clave}: ${err.message}`); } }
  const p = r('proton'); cerca(p.F, e * 2e6 * 0.5, 1e-12, 'F del protón'); cerca(p.r, (mp * 2e6) / (e * 0.5), 1e-12, 'radio del protón'); cerca(p.T, (2 * Math.PI * mp) / (e * 0.5), 1e-12, 'periodo');
  if (p.giro !== 'antihorario' || r('electron').giro !== 'antihorario' || FzC.carga({ ...p0(), sentidoB: 'saliente' }).giro !== 'horario') mal('Fuerza magnética: el sentido de giro no cuadra con F = q v × B');
  function p0() { return { ...FzC.ejemplos[0].sc }; }
  cerca(r('electron').v, Math.sqrt((2 * e * 1000) / me), 1e-12, 'v del electrón acelerado');
  const he = r('helice'); cerca(he.paso, 5e5 * 0.5 * he.T, 1e-9, 'paso de la hélice'); cerca(he.r, (mp * 5e5 * Math.sin(Math.PI / 3)) / (e * 0.2), 1e-9, 'radio de la hélice');
  if (FzC.carga({ ...p0(), th: '0' }).F !== 0) mal('Fuerza magnética: con v paralela a B debería salir F = 0');
  const vp = r('vec-proton'); cerca(vp.Fm[0], e * 1.5e5, 1e-9, 'Fx'); cerca(vp.Fm[1], -e * 1e5, 1e-9, 'Fy'); if (vp.Fm[2] !== 0) mal('Fuerza magnética: Fz del protón no es 0');
  const ve = r('vec-electron'); cerca(ve.Fm[1], e * 3e5, 1e-9, 'Fy del electrón'); if (Math.abs(ve.Fm.reduce((s, x, i) => s + x * ve.v[i], 0)) > 1e-30) mal('Fuerza magnética: F no es perpendicular a v');
  const vl = r('vec-lorentz'); cerca(vl.F[2], 2e-6 * (50 - 40), 1e-9, 'Lorentz con E');
  const se = r('selector'); cerca(se.vs, 5e5, 1e-12, 'v del selector'); cerca(se.r2, (mp * 5e5) / (e * 0.5), 1e-9, 'radio en el espectrómetro');
  if (r('selector-rapido').hacia !== 'abajo' || FzC.selector({ ...r0('selector-rapido'), part: 'proton' }).hacia !== 'arriba') mal('Fuerza magnética: el sentido de desviación en el selector no cuadra');
  function r0(c) { return { ...FzC.ejemplos.find((x) => x.clave === c).sc }; }
  const ci = r('ciclotron'); cerca(ci.fr, (e * 1.5) / (2 * Math.PI * mp), 1e-12, 'frecuencia del ciclotrón'); cerca(ci.Ec, (e * 1.5 * 0.5) ** 2 / (2 * mp), 1e-12, 'energía del ciclotrón'); cerca(ci.n, ci.Ec / (2 * e * 5e4), 1e-12, 'vueltas');
  const hi = r('hilo'); cerca(hi.F, 1, 1e-12, 'F sobre el hilo'); if (hi.arriba !== true || r('hilo-flota').arriba !== true || FzC.hilo({ ...r0('hilo'), sentidoI: 'izquierda' }).arriba !== false) mal('Fuerza magnética: el sentido de la fuerza sobre el hilo no cuadra');
  cerca(r('hilo-flota').Iflota, (0.01 * 9.8) / (0.2 * 0.5), 1e-12, 'corriente para que flote');
  const pa = r('paralelos'); cerca(pa.FL, 1e-4, 1e-9, 'F/L entre hilos'); if (!pa.mismo || r('antiparalelos').mismo) mal('Fuerza magnética: atracción y repulsión al revés');
  for (const [q, sc] of [['una B vacía', { ...p0(), B: '' }], ['una velocidad que no es un número', { ...p0(), v: 'abc' }], ['un ángulo de 200°', { ...p0(), th: '200' }], ['una carga 0', { ...p0(), part: 'otra', q: '0', m: '1e-27' }], ['vectores sin B', { ...r0('vec-proton'), Bx: '', By: '', Bz: '' }], ['un selector sin E', { ...r0('selector'), E: '' }], ['dos hilos a distancia 0', { ...r0('paralelos'), d: '0' }]]) {
    let ok = false; try { FzC.resolver(sc); } catch (err) { ok = true; }
    if (!ok) mal(`Fuerza magnética: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Fuerza magnética: ${FzC.ejemplos.length} ejemplos, radio, periodo, hélice, sentido de giro, v × B, selector, espectrómetro, ciclotrón, hilos y errores`);
}

const TrC = require(path.join(fuente, 'transitorios', 'fisica.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Transitorios · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => TrC.resolver(TrC.ejemplos.find((e) => e.clave === c).sc);
  for (const x of TrC.ejemplos) { try { const s = TrC.resolver(x.sc); if (s.pasos.length < 2) mal(`Transitorios · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Transitorios · ${x.clave}: ${err.message}`); } }
  const c = r('carga'); cerca(c.tau, 1, 1e-12, 'τ = RC'); cerca(c.Vct, 12 * (1 - Math.exp(-1)), 1e-12, 'V_C(τ)'); cerca(c.It, 1.2e-3 * Math.exp(-1), 1e-12, 'i(τ)');
  const d = r('descarga'); cerca(d.tObj, 0.94 * Math.log(3), 1e-12, 'tiempo de descarga hasta V₀/3');
  const v0 = r('carga-v0'); cerca(v0.Vct, 10 - 6 * Math.exp(-0.5), 1e-12, 'carga con V₀'); cerca(v0.tObj, Math.log(6), 1e-12, 'tiempo con V₀');
  const ls = r('rl-sube'); cerca(ls.tau, 0.05, 1e-12, 'τ = L/R'); cerca(ls.It, 2 * (1 - Math.exp(-1)), 1e-12, 'i(τ) en RL'); cerca(ls.E, 0.6, 1e-12, 'energía ½LI²');
  cerca(r('rl-baja').tObj, 0.05 * Math.log(4), 1e-12, 'tiempo de bajada en RL');
  if (r('rlc-sub').tipo !== 'sub' || r('rlc-critico').tipo !== 'critico' || r('rlc-sobre').tipo !== 'sobre') mal('Transitorios: el tipo de amortiguamiento del RLC no cuadra');
  const sb = r('rlc-sub'); cerca(sb.a, 100, 1e-12, 'α'); cerca(sb.w0, 1000, 1e-12, 'ω₀'); cerca(sb.Rc, 200, 1e-12, 'resistencia crítica');
  // V_C del RLC cumple LC V'' + RC V' + V = V_fuente y las condiciones iniciales
  for (const k of ['rlc-sub', 'rlc-critico', 'rlc-sobre', 'lc']) {
    const x = r(k), L = x.L, C = x.C, R = x.R, h = 1e-7, t = x.T / 7, V = x.Vc;
    const res = L * C * (V(t + h) - 2 * V(t) + V(t - h)) / (h * h) + R * C * (V(t + h) - V(t - h)) / (2 * h) + V(t) - x.V;
    if (Math.abs(res) > 1e-3 * Math.max(1, Math.abs(x.V), Math.abs(x.V0 || 0))) mal(`Transitorios · ${k}: V_C(t) no cumple la ecuación (residuo ${res})`);
    if (Math.abs(V(0) - (x.V0 || 0)) > 1e-9 * Math.max(1, Math.abs(x.V0 || 0))) mal(`Transitorios · ${k}: V_C(0) no es V₀`);
  }
  for (const [q, sc] of [['R negativa', { modo: 'rc', proceso: 'carga', V: '10', R: '-5', C: '10' }], ['C vacía', { modo: 'rc', proceso: 'carga', V: '10', R: '5', C: '' }], ['L que no es un número', { modo: 'rl', proceso: 'subida', V: '10', R: '5', L: 'abc' }], ['una tensión que no se alcanza', { modo: 'rc', proceso: 'carga', V: '10', R: '5', C: '10', Vobj: '12' }]]) {
    let ok = false; try { TrC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Transitorios: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Transitorios: ${TrC.ejemplos.length} ejemplos, τ, carga y descarga, tiempo hasta un valor, RL, energía, tipo de amortiguamiento, ecuación del RLC y errores`);
}

const IcC = require(path.join(fuente, 'intervalos', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Intervalos · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => IcC.resolver(IcC.ejemplos.find((e) => e.clave === c).sc);
  for (const x of IcC.ejemplos) { try { const s = IcC.resolver(x.sc); if (s.pasos.length < 2) mal(`Intervalos · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Intervalos · ${x.clave}: ${err.message}`); } }
  cerca(IcC.zc(0.025), 1.959964, 1e-6, 'z₀,₀₂₅'); cerca(IcC.zc(0.005), 2.575829, 1e-6, 'z₀,₀₀₅'); cerca(IcC.tc(15, 0.005), 2.946713, 1e-6, 't₁₅; ₀,₀₀₅'); cerca(IcC.xc(19, 0.025), 32.85233, 1e-6, 'χ²₁₉; ₀,₀₂₅'); cerca(IcC.xc(19, 0.975), 8.906516, 1e-6, 'χ²₁₉; ₀,₉₇₅');
  const al = r('altura'); cerca(al.a, 172 - 1.959964 * 8 / 6, 1e-6, 'IC de la estatura'); cerca(al.err, 1.959964 * 8 / 6, 1e-6, 'error máximo');
  const bo = r('bombillas'); cerca(bo.b - bo.a, 2 * 2.946713 * 90 / 4, 1e-6, 'anchura con la t');
  const li = r('lista'); cerca(li.M.m, 10.01, 1e-12, 'media de la lista'); if (li.gl !== 9) mal('Intervalos: con 10 datos no salen 9 grados de libertad');
  const mu = r('muestral'); cerca(mu.M.sc, 3.2 * Math.sqrt(12 / 11), 1e-12, 'cuasidesviación desde la desviación con n');
  const en = r('encuesta'); cerca(en.err, 1.959964 * Math.sqrt(0.42 * 0.58 / 500), 1e-6, 'error de la proporción');
  const va = r('varianza'); cerca(va.a, 19 * 6.25 / 32.85233, 1e-6, 'extremo inferior de σ²'); cerca(va.b, 19 * 6.25 / 8.906516, 1e-6, 'extremo superior de σ²');
  const ig = r('dif-iguales'); cerca(ig.sp ** 2, (9 * 1.8 ** 2 + 11 * 2.1 ** 2) / 20, 1e-12, 'cuasivarianza ponderada'); if (ig.gl !== 20) mal('Intervalos: varianzas iguales sin n₁ + n₂ − 2 grados de libertad');
  if (r('dif-welch').gl !== 27) mal('Intervalos: los grados de libertad de Welch no salen 27');
  if (r('n-media').n !== 97 || r('n-prop').n !== 1068) mal('Intervalos: el tamaño de muestra no sale 97 y 1068');
  // la simulación acierta más o menos el nivel de confianza
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const k of ['altura', 'encuesta', 'varianza']) { const s = r(k), g = IcC.simula(s, rnd); let d = 0; for (let i = 0; i < 2000; i++) { const [a, b] = g.una(); if (a <= g.real && g.real <= b) d++; } if (Math.abs(d / 2000 - s.c) > 0.025) mal(`Intervalos · ${k}: la simulación acierta un ${d / 20} % en vez del ${100 * s.c} %`); }
  for (const [q, sc] of [['n = 1', { modo: 'media', sigmaC: 'no', xm: '5', s: '1', n: '1', nivel: '95' }], ['nivel 100 %', { modo: 'media', sigmaC: 'si', sigma: '1', xm: '5', n: '10', nivel: '100' }], ['más éxitos que n', { modo: 'proporcion', n: '10', x: '12', nivel: '95' }], ['un dato que no es un número', { modo: 'media', fuente: 'datos', sigmaC: 'no', datos: '1 2 x 4', nivel: '95' }], ['error de proporción ≥ 1', { modo: 'tamano', de: 'proporcion', E: '2', nivel: '95' }]]) {
    let ok = false; try { IcC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Intervalos: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Intervalos de confianza: ${IcC.ejemplos.length} ejemplos, z, t y χ², media, proporción, varianza, diferencias, Welch, tamaño de muestra, simulación y errores`);
}

const OeC = require(path.join(fuente, 'ondas-em', 'fisica.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Ondas EM · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => OeC.resolver(OeC.ejemplos.find((e) => e.clave === c).sc), c0 = 299792458;
  for (const x of OeC.ejemplos) { try { const s = OeC.resolver(x.sc); if (s.pasos.length < 2) mal(`Ondas EM · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Ondas EM · ${x.clave}: ${err.message}`); } }
  const fm = r('fm'); cerca(fm.F.lam, c0 / 1e8, 1e-9, 'λ de la FM'); cerca(fm.B0, 0.05 / c0, 1e-9, 'B₀ = E₀/c'); cerca(fm.I, 0.05 ** 2 / (2 * 376.730313), 1e-6, 'intensidad');
  if (fm.Bv.join() !== '0,1,0') mal('Ondas EM: con k̂ = +z y Ê = +x, B̂ no sale +y');
  const ex = r('expresion'); if (ex.Bv.join() !== '-1,0,0') mal('Ondas EM: con k̂ = −y y Ê = +z, B̂ no sale −x'); if (!ex.Eexp.includes('+')) mal('Ondas EM: hacia −y la fase no es ky + ωt');
  const ag = r('agua'); cerca(ag.M.n, Math.sqrt(1.77), 1e-12, 'índice del agua'); cerca(ag.F.lam, c0 / Math.sqrt(1.77) / 5e14, 1e-9, 'λ en el agua');
  if (!OeC.banda(5e14).includes('visible') || OeC.banda(1e8) !== 'ondas de radio' || OeC.banda(1e18) !== 'rayos X') mal('Ondas EM: la zona del espectro no cuadra');
  cerca(r('bombilla').I, 100 / (4 * Math.PI * 4), 1e-12, 'I de una fuente puntual'); cerca(r('sol').E0, Math.sqrt(2 * 376.730313 * 1361), 1e-6, 'E₀ del Sol');
  const cu = r('cobre'); cerca(cu.delta, 1 / Math.sqrt(Math.PI * 1e6 * 1.25663706212e-6 * 5.8e7), 1e-6, 'profundidad de penetración del cobre'); cerca(cu.th, Math.PI / 4, 1e-6, 'fase de η en un buen conductor');
  const ba = r('baquelita'); cerca(ba.alfa, (1e-6 / 2) * Math.sqrt(1.25663706212e-6 / (4.9 * 8.8541878128e-12)), 1e-3, 'α con pocas pérdidas');
  for (const [q, sc] of [['E paralelo a k', { modo: 'onda', dato: 'f', valor: '1e6', E0: '1', prop: '+z', pol: '-z' }], ['frecuencia negativa', { modo: 'onda', dato: 'f', valor: '-5', E0: '1', prop: '+z', pol: '+x' }], ['E₀ vacía', { modo: 'onda', dato: 'f', valor: '1e6', E0: '', prop: '+z', pol: '+x' }], ['σ que no es un número', { modo: 'perdidas', er: '1', sigma: 'abc', valor: '1e6' }]]) {
    let ok = false; try { OeC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Ondas EM: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Ondas EM planas: ${OeC.ejemplos.length} ejemplos, λ, k, B₀, dirección de B, fase, índice, espectro, intensidad, fuente puntual, profundidad de penetración y errores`);
}

const IfC = require(path.join(fuente, 'interferencia', 'fisica.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Interferencia · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => IfC.resolver(IfC.ejemplos.find((e) => e.clave === c).sc);
  for (const x of IfC.ejemplos) { try { const s = IfC.resolver(x.sc); if (s.pasos.length < 2) mal(`Interferencia · ${x.clave}: desarrollo corto`); } catch (err) { mal(`Interferencia · ${x.clave}: ${err.message}`); } }
  const y = r('young'); cerca(y.dy, 633e-9 * 1.5 / 0.25e-3, 1e-12, 'interfranja'); cerca(y.ym, 1.5 * Math.tan(Math.asin(3 * 633e-9 / 0.25e-3)), 1e-12, 'posición del tercer máximo');
  if (r('young-y').Iy > 1e-6) mal('Interferencia: a media interfranja no sale una franja oscura');
  const ya = r('young-a'); if (!ya.pasos.at(-1).html.includes('±3') || !ya.pasos.at(-1).html.includes('5 franjas')) mal('Interferencia: con d = 3a no faltan los órdenes ±3 o no salen 5 franjas centrales');
  cerca(r('young-agua').dy, (589e-9 / 1.33) / 0.2e-3, 1e-12, 'interfranja en el agua');
  const re = r('rendija'); cerca(re.ym, 1.2 * Math.tan(Math.asin(500e-9 / 0.05e-3)), 1e-12, 'primer mínimo de la rendija'); cerca(re.ancho, 2 * re.ym, 1e-12, 'anchura del máximo central');
  const rd = r('red'); if (rd.mmax !== 3) mal('Interferencia: la red de 600 líneas/mm con 500 nm no llega al orden 3'); cerca(rd.ords[0].th, Math.asin(0.3), 1e-12, 'ángulo del primer orden');
  if (r('sodio').pasos.at(-1).html.indexOf('se resuelven') < 0 || r('sodio').pasos.at(-1).html.includes('no se resuelven')) mal('Interferencia: el doblete del sodio con 1500 líneas no se resuelve');
  const po = r('pompa'); if (po.refuerzan.map(Math.round).join() !== '709,426' || po.anulan.map(Math.round).join() !== '532') mal(`Interferencia: los colores de la pompa no cuadran: ${po.refuerzan} / ${po.anulan}`);
  const ar = r('antirreflejo'); if (ar.medio) mal('Interferencia: en el antirreflectante sale un desfase extra'); cerca(ar.tmin2, 550 / (4 * 1.38), 1e-12, 'espesor antirreflectante');
  if (Math.abs(r('aceite').refuerzan[0] - 580) > 1e-9) mal('Interferencia: la mancha de aceite no refuerza 580 nm');
  for (const [q, sc] of [['un orden que no existe', { modo: 'young', lambda: '600', d: '0,001', L: '1', m: '5' }], ['a mayor que d', { modo: 'young', lambda: '600', d: '0,1', L: '1', a: '0,2' }], ['una red sin primer orden', { modo: 'red', lambda: '700', N: '2000' }], ['lámina sin t ni λ', { modo: 'lamina', nl: '1,3' }], ['λ que no es un número', { modo: 'rendija', lambda: 'x', a: '0,1', L: '1' }]]) {
    let ok = false; try { IfC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Interferencia: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Interferencia y difracción: ${IfC.ejemplos.length} ejemplos, interfranja, máximos, intensidad, órdenes que faltan, rendija, red, resolución, láminas y errores`);
}

const LapC = require(path.join(fuente, 'laplace', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Laplace · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => LapC.resolver(LapC.ejemplos.find((e) => e.clave === c).sc);
  for (const e of LapC.ejemplos) { try { const x = LapC.resolver(e.sc); if (x.pasos.length < 3) mal(`Laplace · ${e.clave}: desarrollo corto`); } catch (err) { mal(`Laplace · ${e.clave}: ${err.message}`); } }
  // resultados como en clase
  const igual = (a, b, q) => { if (a !== b) mal(`Laplace · ${q}: sale «${a}», se esperaba «${b}»`); };
  igual(r('basica').Ftxt, '{6}/{s^{3}} + {2}/{s + 4} − {5}/{s}', '3t² + 2e^(−4t) − 5');
  igual(r('tsen').Ffact, '{2 s}/{(s^{2} + 1)^{2}}', 't sen t');
  igual(r('hiper').Ftxt, '{2}/{(s − 3)^{3}} + {s}/{s^{2} − 4}', 't² e^(3t) + cosh 2t');
  igual(r('simples').txt, 'e^{−3 t} + 2 e^{−t}', 'polos simples');
  igual(r('doble').txt, '−5 e^{−t} − 4 t e^{−t} + 5', 'polo doble');
  igual(r('complejos').txt, '2 e^{−2 t} cos (3 t) − {1}/{3} e^{−2 t} sen (3 t)', 'polos complejos');
  igual(r('escalon').txt, '1 − cos (2 t)', '4/(s(s² + 4))');
  igual(r('edo-resonancia').txt, '{1}/{2} sen t − {1}/{2} t cos t', 'resonancia');
  igual(r('edo-1').txt, '2 e^{−2 t} − 1 + 2 t', 'y′ + 2y = 4t');
  if (r('doble').lim.fin !== 5 || r('simples').lim.ini !== 3 || r('escalon').lim.fin !== null) mal('Laplace: valores inicial y final mal');
  // la directa es la integral de e^(−st) f(t), y su inversa vuelve a f(t)
  for (const e of LapC.ejemplos.filter((q) => q.sc.modo === 'directa')) {
    const x = LapC.resolver(e.sc), s0 = x.conv + 1.5, T = 40 / (s0 - x.conv), n = 20000;
    let I = 0; for (let i = 0; i <= n; i++) { const t = (T * i) / n, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; I += w * Math.exp(-s0 * t) * x.f(t); }
    cerca((I * T) / n / 3, LapC.pVal(x.F.n, s0) / LapC.pVal(x.F.d, s0), 1e-6, `${e.clave}: F(${s0}) frente a la integral`);
    const inv = LapC.inversa({ F: x.Fcomun.replace(/\{/g, '(').replace(/\}/g, ')').replace(/−/g, '-') });
    for (const t of [0.2, 1.1, 2.5]) cerca(inv.f(t), x.f(t), 1e-8, `${e.clave}: la inversa no vuelve a f(${t})`);
  }
  for (const F of ['(6s^2 - 2)/(s^2 + 1)^3', '6/(s + 2)^4', '(s + 1)/((s + 1)^2 + 4)^2', '(2s^2 + 3)/(s^3 - s)', '1/(s^2 (s - 1)^2)']) {
    // f(t) cumple que su transformada numérica es F(s)
    const x = LapC.inversa({ F }), s0 = 3, T = 40, n = 40000, Fs = LapC.racional(Expr.lee(F, 'F', ['s']));
    let I = 0; for (let i = 0; i <= n; i++) { const t = (T * i) / n, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; I += w * Math.exp(-s0 * t) * x.f(t); }
    cerca((I * T) / n / 3, LapC.pVal(Fs.n, s0) / LapC.pVal(Fs.d, s0), 1e-6, `inversa de ${F}`);
  }
  // las soluciones de las EDOs cumplen la ecuación y las condiciones iniciales
  for (const e of LapC.ejemplos.filter((q) => q.sc.modo === 'edo')) {
    const x = LapC.resolver(e.sc), h = 1e-4, d1 = (t) => (x.f(t + h) - x.f(t - h)) / (2 * h), d2 = (t) => (x.f(t + h) - 2 * x.f(t) + x.f(t - h)) / (h * h);
    cerca(x.f(0), x.y0, 1e-9, `${e.clave}: y(0)`);
    if (x.orden === 2) cerca((x.f(h) - x.f(0)) / h, x.v0, 1e-3, `${e.clave}: y′(0)`);
    for (const t of [0.4, 1.3, 2.2]) cerca(x.a * d2(t) + x.b * d1(t) + x.c * x.f(t), x.g(t), 1e-5, `${e.clave}: la solución no cumple la ecuación en t = ${t}`);
  }
  for (const [sc, q] of [[{ modo: 'directa', f: '' }, 'sin f'], [{ modo: 'directa', f: 'tg(t)' }, 'tg t'], [{ modo: 'directa', f: 's t' }, 'f con s'], [{ modo: 'inversa', F: '(s^2 + 1)/(s + 1)' }, 'F impropia'], [{ modo: 'inversa', F: 's + 3' }, 'F sin denominador'], [{ modo: 'inversa', F: '1/(s + t)' }, 'F con t'], [{ modo: 'edo', orden: '2', a: '0', b: '1', c: '1', g: '0', y0: '1', v0: '0' }, 'a = 0'], [{ modo: 'edo', orden: '2', a: '1', b: '0', c: '1', g: 'ln(t)', y0: '1', v0: '0' }, 'g sin transformada de la tabla']]) {
    let ok = false; try { LapC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Laplace: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Transformada de Laplace: ${LapC.ejemplos.length} ejemplos, resultados como en clase, directa frente a la integral, inversa de ida y vuelta (polos dobles y complejos), EDOs que cumplen la ecuación y errores`);
}

const DerC = require(path.join(fuente, 'derivadas', 'calculo.js'));
{
  const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`Derivadas · ${q}: ${a} en vez de ${b}`); };
  const r = (c) => DerC.resolver(DerC.ejemplos.find((e) => e.clave === c).sc);
  for (const e of DerC.ejemplos) { try { const x = DerC.resolver(e.sc); if (x.pasos.length < 3) mal(`Derivadas · ${e.clave}: desarrollo corto`); } catch (err) { mal(`Derivadas · ${e.clave}: ${err.message}`); } }
  const igual = (a, b, q) => { if (a !== b) mal(`Derivadas · ${q}: sale «${a}», se esperaba «${b}»`); };
  // derivadas como en clase
  igual(r('producto').txt[0], '2 x sen x + x^{2} cos x', '(x² sen x)′');
  igual(r('cociente').txt[0], '{x^{2} − 2 x − 1}/{(x − 1)^{2}}', '((x² + 1)/(x − 1))′');
  igual(r('cadena').txt[0], '−2 x e^{−x^{2}}', '(e^(−x²))′');
  igual(r('raiz').txt[0], '{x}/{x^{2} + 1}', '(ln √(x² + 1))′');
  igual(r('arctg').txt[2], '{16 (12 x^{2} − 1)}/{(1 + 4 x^{2})^{3}}', '(arctg 2x)‴');
  igual(r('tangente').tangente, 'y = 9 x − 16', 'tangente a x³ − 3x en 2');
  const cr = r('tangente').crit; if (cr.length !== 2 || cr[0].tipo !== 'máximo' || cr[1].tipo !== 'mínimo' || cr[0].x !== -1 || cr[1].x !== 1) mal('Derivadas: x³ − 3x no da el máximo en −1 y el mínimo en 1');
  // todas las derivadas cumplen el cociente incremental
  for (const e of DerC.ejemplos.filter((q) => q.sc.modo === 'derivada')) {
    const x = DerC.resolver(e.sc), h = 1e-5;
    for (const t of [0.4, 1.3, 2.2]) for (let k = 1; k <= x.orden; k++) { const a = x.d(k - 1), b = x.d(k); cerca(b(t), (a(t + h) - a(t - h)) / (2 * h), 1e-4, `${e.clave}: derivada ${k} en x = ${t}`); }
  }
  // primitivas: todas se encuentran y al derivarlas sale f
  const prims = { 'x^2 cos(2x)': 0, 'x^3 e^(2x)': 0, 'sen(3x)cos(3x)': 0, 'x sen(x)': 0, 'x e^(-x)': 0, 'sen(x)^3': 0, 'cos(x)^5': 0, 'tg(x)': 0, 'tg(x)^2': 0, 'ln(x)': 0, 'ln(x)^2': 0, 'arctg(x)': 0, 'x arctg(x)': 0, '2^x': 0, '1/sqrt(1-x^2)': 0, 'x/sqrt(1+x^2)': 0, 'e^(2x) sen(3x)': 0, 'x^2 ln(x)': 0, 'sqrt(x) ln(x)': 0, 'ln(x)/x': 0, '1/(x ln(x))': 0, 'cos(ln(x))/x': 0, 'e^x/(1+e^x)': 0, 'x (x^2+1)^3': 0, '(x+1)^5': 0, 'sqrt(2x+1)': 0, '1/(x^2 sqrt(x))': 0, '1/(x^2-1)': 0, 'x^4/(x^2-1)': 0, '1/(x(x+1)^2)': 0, '(2x+3)/(x^2+3x+5)': 0, '1/(x^2+x+1)': 0, '(x+2)/(x^2+2x+2)': 0, 'senh(x) cosh(x)': 0, 'sen(x)/cos(x)^2': 0 };
  for (const fx of Object.keys(prims)) {
    const x = DerC.integral({ f: fx });
    if (!x.F) { mal(`Derivadas: no encuentra la primitiva de ${fx}`); continue; }
    if (!DerC.igualNum(Expr.deriva(x.F), x.ast, 1e-7)) mal(`Derivadas: la primitiva de ${fx} no vuelve a f al derivarla`);
  }
  igual(DerC.integral({ f: '1/(x^2+x+1)' }).Ftxt, '{2 arctg ({2 x + 1}/{√3})}/{√3}', '∫ 1/(x² + x + 1)');
  igual(DerC.integral({ f: 'x (x^2+1)^3' }).Ftxt, '{(x^{2} + 1)^{4}}/{8}', '∫ x (x² + 1)³');
  igual(r('racional').Ftxt, 'ln |x + 3| + 2 ln |x − 1|', '∫ (3x + 5)/(x² + 2x − 3)');
  // integrales definidas
  cerca(r('partes').val, Math.E - 2, 1e-12, '∫₀¹ x² eˣ'); cerca(r('sustitucion').val, (Math.E - 1) / 2, 1e-12, '∫₀¹ x e^(x²)');
  cerca(r('racional').val, Math.log(63 / 5), 1e-12, '∫₂⁴ racional'); cerca(r('arcotangente').val, Math.PI / 8, 1e-12, '∫₀² 1/(x² + 4)');
  cerca(r('trig').val, Math.PI / 2, 1e-12, '∫₀^π sen² x'); cerca(r('cicliclica').val, (Math.exp(Math.PI / 2) - 1) / 2, 1e-12, '∫ eˣ cos x');
  cerca(r('partes-ln').val, (Math.E ** 2 + 1) / 4, 1e-12, '∫₁^e x ln x'); cerca(r('gauss').val, 0.746824132812427, 1e-9, '∫₀¹ e^(−x²) numérica');
  if (r('gauss').F) mal('Derivadas: da una primitiva elemental de e^(−x²)');
  const ar = DerC.integral({ f: 'sen(x)', a: '0', b: '2pi' }); cerca(ar.val, 0, 1e-9, '∫₀^{2π} sen x'); cerca(ar.area, 4, 1e-5, 'área de sen x en [0, 2π]');
  for (const [sc, q] of [[{ modo: 'derivada', f: '', orden: '1' }, 'sin f'], [{ modo: 'derivada', f: 'x + y', orden: '1' }, 'otra letra'], [{ modo: 'derivada', f: 'ln(x)', orden: '1', x0: '-1' }, 'x₀ fuera del dominio'], [{ modo: 'integral', f: 'x', a: '1', b: '1' }, 'a = b'], [{ modo: 'integral', f: '1/x', a: '-1', b: '1' }, 'integral impropia'], [{ modo: 'integral', f: 'x', a: '0', b: '' }, 'falta b']]) {
    let ok = false; try { DerC.resolver(sc); } catch (e) { ok = true; }
    if (!ok) mal(`Derivadas: ${q} no da error`);
  }
  if (fallos === antes) console.log(`  ✓ Derivadas e integrales: ${DerC.ejemplos.length} ejemplos, derivadas como en clase y frente al cociente incremental, tangente y extremos, ${Object.keys(prims).length} primitivas comprobadas derivándolas, Barrow, numérica, área y errores`);
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
  // todas las herramientas llevan la cabecera común (diseno.js), con «Inicio» y su asignatura marcada, y la miga
  // «Asignatura › Herramienta», también el simulador de electrostática, con su propia maqueta
  const antes = fallos, pags = Catalogo.asignaturas.flatMap((a) => a.herramientas.filter((h) => h.disponible).map((h) => [a, `${a.clave}/${h.clave}/index.html`]));
  for (const [a, f] of pags) {
    const html = fs.readFileSync(path.join(publico, f), 'utf8');
    if (!html.includes('<header class="top"><a class="logo" href="../../">') || !html.includes('<a href="../../">Inicio</a>')) mal(`${f}: falta la cabecera común con «Inicio»`);
    if (!html.includes(`<a href="../../${a.clave}/" aria-current="page">`)) mal(`${f}: la cabecera no marca ${a.nombre}`);
    if (!html.includes(`<a href="../">${a.nombre}</a>`) || !html.includes('class="miga-izq"')) mal(`${f}: falta la miga «${a.nombre} › …»`);
    if (!html.includes(`--accent:${a.color}`)) mal(`${f}: no usa el color de ${a.nombre}`);    if (!html.includes('<a class="foro" href="../../foro/">')) mal(`${f}: la cabecera no tiene el enlace al Foro`);
  }
  if (fallos === antes) console.log(`  ✓ Cabecera común, miga y color de la asignatura en las ${pags.length} herramientas`);
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
    await page.goto('file://' + path.join(publico, 'fisica', 'doppler', 'index.html'));
    await page.waitForFunction(() => window.DopplerApp);
    const antes = fallos;
    const verD = (await page.locator('#ver').textContent()).trim();
    if (verD !== Version.de('doppler').current) mal(`Doppler: la página muestra la versión «${verD}», se esperaba ${Version.de('doppler').current}`);
    for (const e of DopplerF.ejemplos) {
      await page.evaluate((c) => DopplerApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(120);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, graf: !document.querySelector('#grafica').hidden }));
      if (r.err || r.pasos < 3 || r.res < 2) mal(`Doppler · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Doppler · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.graf !== (e.clave === 'tren')) mal(`Doppler · ${e.clave}: la gráfica del paso ${r.graf ? 'sale y no debería' : 'no sale'}`);
    }
    await page.evaluate(() => DopplerApp.abrirEjemplo('ambulancia'));
    if (!(await page.locator('#resumen').textContent()).includes('755,6')) mal('Doppler: la frecuencia de la ambulancia no sale en la página');
    if (await page.locator('#oir').isHidden()) mal('Doppler: no sale el botón de escuchar con frecuencias audibles');
    await page.evaluate(() => DopplerApp.abrirEjemplo('murcielago'));
    if (!(await page.locator('#oir').isHidden())) mal('Doppler: el botón de escuchar sale con ultrasonidos');
    await page.selectOption('#f-modo', 'paso');
    await page.selectOption('#f-datos', 'oidas');
    if ((await page.locator('#f-f1').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Doppler: al elegir lo que se oye no pide f₁ o da error');
    await page.fill('#f-f2', '600');
    if (await page.locator('#error').isHidden()) mal('Doppler: f₂ > f₁ no muestra el error');
    await page.selectOption('#f-modo', 'choque');
    await page.fill('#f-vF', '200');
    if (await page.locator('#error').isHidden()) mal('Doppler: una onda de choque subsónica no muestra el error');
    await page.click('#play');
    await page.close();
    if (consola.length) mal('Doppler: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Efecto Doppler: ${DopplerF.ejemplos.length} ejemplos con MathML, gráfica del paso, sonido solo si se oye, cambio de datos y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'circuitos', 'resistencias', 'index.html'));
    await page.waitForFunction(() => window.ResistenciasApp);
    const antes = fallos;
    const verR = (await page.locator('#ver').textContent()).trim();
    if (verR !== Version.de('resistencias').current) mal(`Resistencias: la página muestra la versión «${verR}», se esperaba ${Version.de('resistencias').current}`);
    for (const e of ResistenciasC.ejemplos) {
      await page.evaluate((c) => ResistenciasApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, svg: !!document.querySelector('#dibujo svg') }));
      if (r.err || !r.pasos || r.res < 2 || r.dolar) mal(`Resistencias · ${e.clave}: falta el resultado o el desarrollo`);
      if (r.svg !== (e.sc.modo !== 'smd')) mal(`Resistencias · ${e.clave}: el dibujo de la resistencia ${r.svg ? 'sale y no debería' : 'no sale'}`);
    }
    // elegir colores con los botones
    await page.evaluate(() => ResistenciasApp.abrirEjemplo('mil'));
    await page.click('.chip[data-b="b3"][data-c="naranja"]');
    if (!(await page.locator('#resumen').textContent()).includes('10 kΩ')) mal('Resistencias: al pulsar naranja en el multiplicador no sale 10 kΩ');
    if ((await page.locator('#dibujo rect').count()) !== 4) mal('Resistencias: el dibujo no tiene 4 bandas');
    await page.selectOption('#f-bandas', '6');
    if ((await page.locator('.banda').count()) !== 6 || !(await page.locator('#error').isHidden())) mal('Resistencias: al pasar a 6 bandas no salen 6 o da error');
    await page.selectOption('#f-modo', 'valor');
    await page.fill('#f-valor', '2k2');
    if (!(await page.locator('#colores-res').textContent()).includes('rojo rojo rojo oro')) mal('Resistencias: 2k2 no sale rojo, rojo, rojo, oro');
    await page.fill('#f-valor', 'hola');
    if (await page.locator('#error').isHidden()) mal('Resistencias: un valor sin sentido no muestra el error');
    await page.close();
    if (consola.length) mal('Resistencias: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Código de colores: ${ResistenciasC.ejemplos.length} ejemplos, dibujo, botones de colores, 6 bandas, valor a colores y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'estadistica', 'regresion', 'index.html'));
    await page.waitForFunction(() => window.RegresionApp);
    const antes = fallos;
    const verG = (await page.locator('#ver').textContent()).trim();
    if (verG !== Version.de('regresion').current) mal(`Regresión: la página muestra la versión «${verG}», se esperaba ${Version.de('regresion').current}`);
    for (const e of RegresionC.ejemplos) {
      await page.evaluate((c) => RegresionApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, tabla: document.querySelectorAll('#pasos table').length, math: document.querySelectorAll('#pasos math').length }));
      if (r.err || r.pasos < 5 || r.res < 4 || r.dolar || !r.tabla || !r.math) mal(`Regresión · ${e.clave}: falta el resultado, la tabla o el desarrollo`);
    }
    // escribir los datos a mano
    await page.evaluate(() => RegresionApp.abrirEjemplo('notas'));
    await page.fill('#f-datos', '1 2\n2 4\n3 6');
    if (!(await page.locator('#resumen').textContent()).includes('r = 1')) mal('Regresión: tres puntos alineados no dan r = 1');
    // añadir un punto pulsando en la gráfica
    await page.click('#marcar');
    const caja = await page.locator('#grafica').boundingBox();
    await page.mouse.click(caja.x + caja.width * 0.6, caja.y + caja.height * 0.3);
    if ((await page.inputValue('#f-datos')).trim().split('\n').length !== 4) mal('Regresión: pulsar en la gráfica no añade un punto');
    await page.selectOption('#f-modelo', 'parabolica');
    if (!(await page.locator('#error').isHidden())) mal('Regresión: el ajuste parabólico da error con cuatro puntos');
    await page.fill('#f-datos', '1 2\nhola');
    if (await page.locator('#error').isHidden()) mal('Regresión: unos datos sin sentido no muestran el error');
    await page.evaluate(() => RegresionApp.azar());
    if (!(await page.locator('#error').isHidden()) || !(await page.inputValue('#f-datos')).includes('\n')) mal('Regresión: los datos al azar dan error');
    await page.close();
    if (consola.length) mal('Regresión: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Regresión: ${RegresionC.ejemplos.length} ejemplos con tablas y MathML, datos a mano, puntos con el ratón, parábola, datos al azar y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'matematicas', 'complejos', 'index.html'));
    await page.waitForFunction(() => window.ComplejosApp);
    const antes = fallos;
    const verC = (await page.locator('#ver').textContent()).trim();
    if (verC !== Version.de('complejos').current) mal(`Complejos: la página muestra la versión «${verC}», se esperaba ${Version.de('complejos').current}`);
    for (const e of ComplejosC.ejemplos) {
      await page.evaluate((c) => ComplejosApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div').length, math: document.querySelectorAll('#pasos math').length }));
      if (r.err || r.pasos < 2 || r.res < 2 || r.dolar || !r.math) mal(`Complejos · ${e.clave}: falta el resultado o el desarrollo, o se ve un $`);
    }
    await page.selectOption('#f-op', 'producto');
    await page.fill('#f-z1', '1+i'); await page.fill('#f-z2', '1-i');
    if (!(await page.locator('#resumen').textContent()).includes('2')) mal('Complejos: (1 + i)(1 − i) no da 2');
    await page.fill('#f-z2', 'hola');
    if (await page.locator('#error').isHidden()) mal('Complejos: un complejo sin sentido no muestra el error');
    for (let i = 0; i < 8; i++) { await page.evaluate(() => ComplejosApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Complejos: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => ComplejosApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Complejos: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Números complejos: ${ComplejosC.ejemplos.length} ejemplos con MathML, cambio de operación, errores y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'fisica', 'fluidos', 'index.html'));
    await page.waitForFunction(() => window.FluidosApp);
    const antes = fallos;
    const verF = (await page.locator('#ver').textContent()).trim();
    if (verF !== Version.de('fluidos').current) mal(`Fluidos: la página muestra la versión «${verF}», se esperaba ${Version.de('fluidos').current}`);
    for (const e of FluidosF.ejemplos) {
      await page.evaluate((c) => FluidosApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(120);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length }));
      if (r.err || r.pasos < 3 || r.res < 2) mal(`Fluidos · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Fluidos · ${e.clave}: el desarrollo no sale en MathML`);
    }
    await page.evaluate(() => FluidosApp.abrirEjemplo('elevador'));
    if (!(await page.locator('#resumen').textContent()).includes('147')) mal('Fluidos: la fuerza del elevador no sale en la página');
    await page.selectOption('#f-modo', 'tuboU');
    await page.fill('#f-rho2', '1200');
    if (await page.locator('#error').isHidden()) mal('Fluidos: un líquido añadido más denso no muestra el error');
    await page.selectOption('#f-modo', 'empuje');
    await page.selectOption('#f-datos', 'pesadas');
    if ((await page.locator('#f-Pa').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Fluidos: al elegir las pesadas no pide el peso en el fluido o da error');
    await page.selectOption('#f-modo', 'bernoulli');
    await page.waitForTimeout(300);
    await page.click('#play');
    await page.close();
    if (consola.length) mal('Fluidos: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Fluidos: ${FluidosF.ejemplos.length} ejemplos con MathML, cambio de datos y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'quimica', 'ph', 'index.html'));
    await page.waitForFunction(() => window.PHApp);
    const antes = fallos;
    const verP = (await page.locator('#ver').textContent()).trim();
    if (verP !== Version.de('ph').current) mal(`pH: la página muestra la versión «${verP}», se esperaba ${Version.de('ph').current}`);
    for (const e of PHC.ejemplos) {
      await page.evaluate((c) => PHApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(120);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, graf: !document.querySelector('#grafica').hidden }));
      if (r.err || r.pasos < 3 || r.res < 2) mal(`pH · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`pH · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.graf !== (e.sc.modo === 'valoracion')) mal(`pH · ${e.clave}: la curva de valoración ${r.graf ? 'sale y no debería' : 'no sale'}`);
    }
    await page.evaluate(() => PHApp.abrirEjemplo('acetico'));
    if (!(await page.locator('#resumen').textContent()).includes('2,88')) mal('pH: el pH del acético no sale en la página');
    // al escribir el pKa se vacía Ka y sale lo mismo
    await page.fill('#f-pK', '4.74');
    if ((await page.inputValue('#f-K')) !== '' || !(await page.locator('#error').isHidden())) mal('pH: al escribir el pKa no se vacía Ka o da error');
    await page.selectOption('#f-modo', 'tampon');
    await page.selectOption('#f-anade', 'base');
    if ((await page.locator('#f-Vad').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('pH: al añadir una base al tampón no pide el volumen o da error');
    await page.selectOption('#f-modo', 'valoracion');
    await page.selectOption('#f-tipo', 'ad-bf');
    if (!(await page.locator('#error').isHidden())) mal('pH: al elegir una valoración de ácido débil da error');
    await page.fill('#f-C', '');
    if (await page.locator('#error').isHidden()) mal('pH: sin concentración no muestra el error');
    await page.click('#play');
    await page.close();
    if (consola.length) mal('pH: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ pH y valoraciones: ${PHC.ejemplos.length} ejemplos con MathML, curva solo en las valoraciones, K o pK, cambio de datos y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'fisica', 'ciclos', 'index.html'));
    await page.waitForFunction(() => window.CiclosApp);
    const antes = fallos;
    const verC = (await page.locator('#ver').textContent()).trim();
    if (verC !== Version.de('ciclos').current) mal(`Ciclos: la página muestra la versión «${verC}», se esperaba ${Version.de('ciclos').current}`);
    for (const e of CiclosF.ejemplos) {
      await page.evaluate((c) => CiclosApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(120);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#resumen > div').length, tablas: !document.querySelector('#tablas').hidden, filas: document.querySelectorAll('#tramos tr').length }));
      if (r.err || r.pasos < 3 || r.res < 2) mal(`Ciclos · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Ciclos · ${e.clave}: el desarrollo no sale en MathML`);
      const ciclo = e.sc.modo !== 'maquina';
      if (r.tablas !== ciclo || (ciclo && r.filas !== 6)) mal(`Ciclos · ${e.clave}: la tabla de estados y tramos ${r.tablas ? 'sale mal o no debería salir' : 'no sale'}`);
    }
    await page.evaluate(() => CiclosApp.abrirEjemplo('otto'));
    if (!(await page.locator('#resumen').textContent()).includes('56,5')) mal('Ciclos: el rendimiento del Otto no sale en la página');
    await page.selectOption('#f-datos', 'Q');
    if ((await page.locator('#f-Q').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Ciclos: al elegir el calor de la combustión no lo pide o da error');
    await page.selectOption('#f-modo', 'maquina');
    await page.fill('#f-Qf', '500');
    await page.fill('#f-W', '100');
    if (await page.locator('#error').isHidden()) mal('Ciclos: tres datos incompatibles no muestran el error');
    await page.click('#play');
    await page.close();
    if (consola.length) mal('Ciclos: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Ciclos termodinámicos: ${CiclosF.ejemplos.length} ejemplos con MathML, tablas solo en los ciclos, cambio de datos y errores sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'matematicas', 'taylor', 'index.html'));
    await page.waitForFunction(() => window.TaylorApp);
    const antes = fallos;
    const verT = (await page.locator('#ver').textContent()).trim();
    if (verT !== Version.de('taylor').current) mal(`Taylor: la página muestra la versión «${verT}», se esperaba ${Version.de('taylor').current}`);
    for (const e of TaylorC.ejemplos) {
      await page.evaluate((c) => TaylorApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, pol: !!document.querySelector('#resumen .ancho math'), dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, max: document.querySelector('#grado').max }));
      if (r.err || r.pasos < 4 || r.res < 3 || !r.pol) mal(`Taylor · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Taylor · ${e.clave}: el desarrollo no sale en MathML`);
      if (+r.max !== +e.sc.n) mal(`Taylor · ${e.clave}: el selector de grado no llega a ${e.sc.n}`);
    }
    await page.evaluate(() => TaylorApp.abrirEjemplo('exp'));
    if (!(await page.locator('#resumen').textContent()).includes('1,648438')) mal('Taylor: P4(0,5) de e^x no sale 1,648438');
    await page.fill('#f-f', 'cos(2x)');
    await page.fill('#f-n', '6');
    if (!(await page.locator('#error').isHidden()) || !(await page.locator('#resumen').textContent()).includes('0,5403')) mal('Taylor: al cambiar a cos(2x) no recalcula');
    await page.fill('#f-f', 'ln x');
    if (await page.locator('#error').isHidden()) mal('Taylor: ln x en 0 no muestra el error');
    await page.fill('#f-f', 'sen x');
    await page.fill('#grado', '2');
    await page.click('#animar'); await page.waitForTimeout(1300);
    if (+(await page.locator('#vgrado').textContent()) < 1) mal('Taylor: la animación no sube el grado');
    await page.click('#animar');
    for (let i = 0; i < 8; i++) { await page.evaluate(() => TaylorApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Taylor: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => TaylorApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Taylor: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Series de Taylor: ${TaylorC.ejemplos.length} ejemplos con MathML, cambio de datos, errores, animación del grado y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'matematicas', 'fourier', 'index.html'));
    await page.waitForFunction(() => window.FourierApp);
    const antes = fallos;
    const verF = (await page.locator('#ver').textContent()).trim();
    if (verF !== Version.de('fourier').current) mal(`Fourier: la página muestra la versión «${verF}», se esperaba ${Version.de('fourier').current}`);
    for (const e of FourierC.ejemplos) {
      await page.evaluate((c) => FourierApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, serie: !!document.querySelector('#resumen .ancho math'), dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, tramos: document.querySelectorAll('#tramos .tramo').length }));
      if (r.err || r.pasos < 6 || r.res < 2 || !r.serie) mal(`Fourier · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Fourier · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.tramos !== e.sc.tramos.length) mal(`Fourier · ${e.clave}: salen ${r.tramos} tramos en vez de ${e.sc.tramos.length}`);
    }
    await page.evaluate(() => FourierApp.abrirEjemplo('cuadrada'));
    if (!(await page.locator('#resumen').textContent()).includes('1,273')) mal('Fourier: b1 = 4/π de la onda cuadrada no sale en la página');
    await page.click('#mas');
    if ((await page.locator('#tramos .tramo').count()) !== 3 || (await page.locator('#error').isHidden())) mal('Fourier: al añadir un tramo vacío no aparece o no pide su extremo');
    await page.fill('#tramos [data-i="2"][data-c="b"]', '2π');
    if (!(await page.locator('#error').isHidden())) mal('Fourier: con un tercer tramo bien escrito da error');
    await page.click('#tramos [data-quita="2"]');
    if ((await page.locator('#tramos .tramo').count()) !== 2) mal('Fourier: quitar un tramo no lo quita');
    await page.selectOption('#ext', 'impar');
    if (await page.locator('#error').isHidden()) mal('Fourier: la extensión impar de una función que no empieza en 0 no da error');
    await page.selectOption('#ext', 'periodica');
    await page.click('#animar'); await page.waitForTimeout(800);
    if (+(await page.locator('#vk').textContent()) < 2) mal('Fourier: la animación no suma armónicos');
    await page.click('#animar');
    for (let i = 0; i < 8; i++) { await page.evaluate(() => FourierApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Fourier: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => FourierApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Fourier: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Series de Fourier: ${FourierC.ejemplos.length} ejemplos con MathML, tramos que se añaden y quitan, extensiones, errores, animación y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'matematicas', 'edos', 'index.html'));
    await page.waitForFunction(() => window.EDOsApp);
    const antes = fallos;
    const verE = (await page.locator('#ver').textContent()).trim();
    if (verE !== Version.de('edos').current) mal(`EDOs: la página muestra la versión «${verE}», se esperaba ${Version.de('edos').current}`);
    for (const e of EDOsC.ejemplos) {
      await page.evaluate((c) => EDOsApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, modo: document.querySelector('#modo').value, tiempo: !document.querySelector('#tiempo').hidden }));
      if (r.err || r.pasos < 3 || r.res < 1) mal(`EDOs · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`EDOs · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.modo !== e.sc.modo || r.tiempo !== (e.sc.modo === 'sistema')) mal(`EDOs · ${e.clave}: el modo o la gráfica de x(t), y(t) no cuadran`);
    }
    await page.evaluate(() => EDOsApp.abrirEjemplo('euler'));
    if (!(await page.locator('#resumen').textContent()).includes('3,18748')) mal('EDOs: el Euler de y′ = x + y no sale 3,18748 en la página');
    if ((await page.locator('#pasos table.tabla tr').count()) < 9) mal('EDOs: falta la tabla de Euler');
    await page.fill('#f-h', '0,05');
    if (!(await page.locator('#resumen').textContent()).includes('3,3')) mal('EDOs: con h = 0,05 Euler no se acerca a la exacta');
    await page.fill('#f-f', 'x +');
    if (await page.locator('#error').isHidden()) mal('EDOs: una función mal escrita no da error');
    await page.selectOption('#modo', 'sistema');
    if ((await page.locator('#f-g').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('EDOs: al pasar a sistema no salen sus campos o da error');
    const box = await page.locator('#grafica').boundingBox();
    const x0 = await page.locator('#f-x0').inputValue();
    await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.3);
    if ((await page.locator('#f-x0').inputValue()) === x0 || !(await page.locator('#error').isHidden())) mal('EDOs: tocar el diagrama no cambia el punto inicial');
    await page.click('#animar'); await page.waitForTimeout(500); await page.click('#animar');
    for (let i = 0; i < 10; i++) { await page.evaluate(() => EDOsApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`EDOs: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => EDOsApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('EDOs: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Ecuaciones diferenciales: ${EDOsC.ejemplos.length} ejemplos con MathML, tabla de Euler, cambio de paso y de modo, errores, toque en el diagrama, animación y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'quimica', 'cinetica', 'index.html'));
    await page.waitForFunction(() => window.CineticaApp);
    const antes = fallos;
    const verC = (await page.locator('#ver').textContent()).trim();
    if (verC !== Version.de('cinetica').current) mal(`Cinética: la página muestra la versión «${verC}», se esperaba ${Version.de('cinetica').current}`);
    for (const e of CinC.ejemplos) {
      await page.evaluate((c) => CineticaApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, modo: document.querySelector('#f-modo').value, vaso: !document.querySelector('#escena').hidden }));
      if (r.err || r.pasos < 3 || r.res < 1) mal(`Cinética · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Cinética · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.modo !== e.sc.modo || r.vaso !== (e.sc.modo === 'orden' || e.sc.modo === 'datos')) mal(`Cinética · ${e.clave}: el modo o el vaso no cuadran`);
    }
    await page.evaluate(() => CineticaApp.abrirEjemplo('primer-orden'));
    if (!(await page.locator('#resumen').textContent()).includes('1359')) mal('Cinética: la vida media del N₂O₅ (1359 s) no sale en la página');
    await page.selectOption('#f-n', '2');
    if (!(await page.locator('#resumen').textContent()).includes('7843')) mal('Cinética: al pasar a orden 2 la vida media no cambia a 1/(k[A]₀)');
    await page.fill('#f-k', 'abc');
    if (await page.locator('#error').isHidden()) mal('Cinética: una k que no es un número no da error');
    await page.evaluate(() => CineticaApp.abrirEjemplo('datos-2'));
    await page.click('#vistas [data-v="0"]');
    if ((await page.locator('#vistas [aria-pressed="true"]').getAttribute('data-v')) !== '0') mal('Cinética: los botones de las tres rectas no cambian de gráfica');
    await page.evaluate(() => CineticaApp.abrirEjemplo('iniciales-1'));
    await page.click('#mas');
    if ((await page.locator('#campos [data-c="A"]').count()) !== 4 || !(await page.locator('#error').isHidden())) mal('Cinética: añadir un experimento vacío no aparece o no se deja sin contar');
    await page.fill('#campos [data-i="3"][data-c="A"]', '0,8');
    if (await page.locator('#error').isHidden()) mal('Cinética: un experimento sin velocidad no da error');
    await page.fill('#campos [data-i="3"][data-c="A"]', '0,8'); await page.fill('#campos [data-i="3"][data-c="v"]', '0,032');
    if (!(await page.locator('#error').isHidden())) mal('Cinética: con el cuarto experimento bien escrito da error');
    await page.click('#campos [data-quita="3"]');
    if ((await page.locator('#campos [data-c="A"]').count()) !== 3) mal('Cinética: quitar un experimento no lo quita');
    await page.selectOption('#f-conB', '1');
    if ((await page.locator('#campos [data-c="B"]').count()) !== 3) mal('Cinética: al pasar a dos reactivos no sale la columna de [B]');
    await page.selectOption('#f-modo', 'arrhenius');
    await page.selectOption('#f-tipo', 'k2');
    if ((await page.locator('#f-Ea').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Cinética: al pedir k₂ no sale el campo de Eₐ o da error');
    for (let i = 0; i < 10; i++) { await page.evaluate(() => CineticaApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Cinética: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => CineticaApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Cinética: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Cinética química: ${CinC.ejemplos.length} ejemplos con MathML, cambio de orden, errores, las tres rectas, experimentos que se añaden y quitan, Arrhenius y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'matematicas', 'campos', 'index.html'));
    await page.waitForFunction(() => window.CamposApp);
    const antes = fallos;
    const verC = (await page.locator('#ver').textContent()).trim();
    if (verC !== Version.de('campos').current) mal(`Campos: la página muestra la versión «${verC}», se esperaba ${Version.de('campos').current}`);
    for (const e of CamC.ejemplos) {
      await page.evaluate((c) => CamposApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(30);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, modo: document.querySelector('#f-modo').value }));
      if (r.err || r.pasos < 3 || r.res < 1) mal(`Campos · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Campos · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.modo !== e.sc.modo) mal(`Campos · ${e.clave}: el modo no cuadra`);
    }
    await page.evaluate(() => CamposApp.abrirEjemplo('circulo'));
    if (!(await page.locator('#resumen').textContent()).includes('6,2832')) mal('Campos: el trabajo de (−y, x) en una vuelta (2π) no sale en la página');
    await page.fill('#f-P', 'y');
    if (!/^0$/.test((await page.locator('#resumen > div.num b').first().textContent()).trim())) mal('Campos: con F = (y, x) el trabajo en una vuelta no sale 0');
    await page.fill('#f-b', 'abc');
    if (await page.locator('#error').isHidden()) mal('Campos: un t final que no es un número no da error');
    await page.evaluate(() => CamposApp.abrirEjemplo('remolino'));
    const caja = await page.locator('#grafica').boundingBox();
    await page.mouse.click(caja.x + caja.width * 0.25, caja.y + caja.height * 0.25);
    const est = await page.evaluate(() => CamposApp.estado());
    if (!(parseFloat(est.x0.replace(',', '.')) < 0 && parseFloat(est.y0.replace(',', '.')) > 0)) mal(`Campos: tocar la gráfica no mueve el punto (${est.x0}, ${est.y0})`);
    await page.evaluate(() => CamposApp.abrirEjemplo('green-circulo'));
    await page.selectOption('#f-region', 'rectangulo');
    if ((await page.locator('#f-x2').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Campos: al pasar a un rectángulo no salen sus campos o da error');
    await page.selectOption('#f-modo', 'escalar');
    if ((await page.locator('#f-f').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Campos: al pasar a campo escalar no sale el campo de f o da error');
    await page.click('#animar');
    if ((await page.locator('#animar').textContent()).trim() !== '▶ Animar') mal('Campos: el botón de parar no cambia');
    for (let i = 0; i < 10; i++) { await page.evaluate(() => CamposApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Campos: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => CamposApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Campos: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Campos vectoriales: ${CamC.ejemplos.length} ejemplos con MathML, cambio de campo, errores, tocar la gráfica, regiones de Green, cambio de modo y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'fuerza', 'index.html'));
    await page.waitForFunction(() => window.FuerzaApp);
    const antes = fallos;
    const verC = (await page.locator('#ver').textContent()).trim();
    if (verC !== Version.de('fuerza').current) mal(`Fuerza magnética: la página muestra la versión «${verC}», se esperaba ${Version.de('fuerza').current}`);
    for (const e of FzC.ejemplos) {
      await page.evaluate((c) => FuerzaApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
      if (r.err || r.pasos < 2 || r.res < 1) mal(`Fuerza magnética · ${e.clave}: falta el resultado o el desarrollo`);
      if (r.modo !== e.sc.modo) mal(`Fuerza magnética · ${e.clave}: el modo no cuadra`);
    }
    await page.evaluate(() => FuerzaApp.abrirEjemplo('proton'));
    if (!(await page.locator('#res').textContent()).includes('0,04176')) mal('Fuerza magnética: el radio del protón (0,04176 m) no sale en la página');
    await page.fill('#f-B', '1');
    if (!(await page.locator('#res').textContent()).includes('0,02088')) mal('Fuerza magnética: con el doble de campo el radio no se reduce a la mitad');
    await page.selectOption('#f-part', 'electron');
    if (!(await page.locator('#res').textContent()).includes('horario')) mal('Fuerza magnética: al cambiar a un electrón no cambia el sentido de giro');
    await page.selectOption('#f-part', 'otra');
    if ((await page.locator('#f-q').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Fuerza magnética: al elegir otra partícula no salen q y m o da error');
    await page.selectOption('#f-uv', 'V');
    if (!(await page.locator('#error').isHidden())) mal('Fuerza magnética: al dar la ddp en vez de la velocidad da error');
    await page.fill('#f-B', 'abc');
    if (await page.locator('#error').isHidden()) mal('Fuerza magnética: una B que no es un número no da error');
    await page.selectOption('#f-modo', 'vectorial');
    if ((await page.locator('#f-vx').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Fuerza magnética: al pasar a vectores no salen las componentes o da error');
    await page.fill('#f-Ez', '1e5');
    if (!(await page.locator('#res').textContent()).includes('Lorentz')) mal('Fuerza magnética: con E no sale la fuerza de Lorentz completa');
    await page.click('#play');
    if ((await page.locator('#play').textContent()).trim() !== '▶ Seguir') mal('Fuerza magnética: el botón de pausa no cambia');
    for (let i = 0; i < 12; i++) { await page.evaluate(() => FuerzaApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Fuerza magnética: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => FuerzaApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Fuerza magnética: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Fuerza magnética: ${FzC.ejemplos.length} ejemplos, cambio de campo y de partícula, sentido de giro, ddp, errores, vectores con E y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'circuitos', 'transitorios', 'index.html'));
    await page.waitForFunction(() => window.TransitoriosApp);
    const antes = fallos;
    const verT = (await page.locator('#ver').textContent()).trim();
    if (verT !== Version.de('transitorios').current) mal(`Transitorios: la página muestra la versión «${verT}», se esperaba ${Version.de('transitorios').current}`);
    for (const e of TrC.ejemplos) {
      await page.evaluate((c) => TransitoriosApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
      if (r.err || r.pasos < 2 || r.res < 1) mal(`Transitorios · ${e.clave}: falta el resultado o el desarrollo`);
      if (r.modo !== e.sc.modo) mal(`Transitorios · ${e.clave}: el modo no cuadra`);
    }
    await page.evaluate(() => TransitoriosApp.abrirEjemplo('carga'));
    if (!(await page.locator('#res').textContent()).includes('7,585')) mal('Transitorios: V_C(τ) = 7,585 V no sale en la página');
    await page.fill('#f-R', '20000');
    if (!(await page.locator('#res').textContent()).includes('2 s')) mal('Transitorios: con el doble de R no sale τ = 2 s');
    await page.selectOption('#f-proceso', 'descarga');
    if ((await page.locator('#f-V').count()) !== 0 || !(await page.locator('#error').isHidden())) mal('Transitorios: en la descarga sigue saliendo la fuente o da error');
    await page.fill('#f-C', 'abc');
    if (await page.locator('#error').isHidden()) mal('Transitorios: una C que no es un número no da error');
    await page.selectOption('#f-modo', 'rlc');
    if ((await page.locator('#f-L').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Transitorios: al pasar a RLC no sale L o da error');
    await page.fill('#f-R', '1000');
    if (!(await page.locator('#res').textContent()).includes('sobreamortiguado')) mal('Transitorios: con R grande el RLC no sale sobreamortiguado');
    await page.click('#play');
    if ((await page.locator('#play').textContent()).trim() !== '▶ Seguir') mal('Transitorios: el botón de pausa no cambia');
    for (let i = 0; i < 12; i++) { await page.evaluate(() => TransitoriosApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Transitorios: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => TransitoriosApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Transitorios: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Transitorios: ${TrC.ejemplos.length} ejemplos, cambio de R, descarga, RLC sobreamortiguado, errores y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'estadistica', 'intervalos', 'index.html'));
    await page.waitForFunction(() => window.IntervalosApp);
    const antes = fallos;
    const verI = (await page.locator('#ver').textContent()).trim();
    if (verI !== Version.de('intervalos').current) mal(`Intervalos: la página muestra la versión «${verI}», se esperaba ${Version.de('intervalos').current}`);
    for (const e of IcC.ejemplos) {
      await page.evaluate((c) => IntervalosApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
      if (r.err || r.pasos < 2 || r.res < 1) mal(`Intervalos · ${e.clave}: falta el resultado o el desarrollo`);
      if (r.modo !== e.sc.modo) mal(`Intervalos · ${e.clave}: el modo no cuadra`);
    }
    await page.evaluate(() => IntervalosApp.abrirEjemplo('altura'));
    if (!(await page.locator('#res').textContent()).includes('169,39; 174,61')) mal('Intervalos: el intervalo (169,39; 174,61) no sale en la página');
    await page.fill('#f-nivel', '99');
    if (!(await page.locator('#res').textContent()).includes('2,576')) mal('Intervalos: al 99 % no sale z = 2,576');
    await page.selectOption('#f-sigmaC', 'no');
    if ((await page.locator('#f-s').count()) !== 1) mal('Intervalos: con σ desconocida no sale la desviación de la muestra');
    await page.fill('#f-s', '8');
    if (!(await page.locator('#res').textContent()).includes('t35')) mal('Intervalos: con σ desconocida no se usa la t con 35 grados de libertad');
    await page.selectOption('#f-fuente', 'datos');
    if ((await page.locator('#f-datos').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Intervalos: al elegir la lista de datos no sale o da error');
    await page.fill('#f-datos', '1 2 abc');
    if (await page.locator('#error').isHidden()) mal('Intervalos: un dato que no es un número no da error');
    await page.selectOption('#f-modo', 'tamano');
    if (!(await page.locator('#simcard').isHidden())) mal('Intervalos: en el tamaño de muestra sigue saliendo la simulación');
    await page.selectOption('#f-modo', 'proporcion');
    await page.waitForTimeout(4500);
    const sim = await page.evaluate(() => ({ s: IntervalosApp.simulacion(), t: document.querySelector('#cuenta').textContent }));
    if (!sim.s || !sim.t.includes('de 100') || sim.s.dentro < 80) mal(`Intervalos: la simulación no saca 100 intervalos o acierta muy pocos: ${JSON.stringify(sim)}`);
    await page.click('#otra');
    if ((await page.locator('#play').textContent()).trim() !== '⏸ Pausa') mal('Intervalos: tras otras 100 muestras la animación no sigue');
    for (let i = 0; i < 12; i++) { await page.evaluate(() => IntervalosApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Intervalos: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => IntervalosApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Intervalos: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Intervalos de confianza: ${IcC.ejemplos.length} ejemplos, nivel, σ desconocida, lista de datos, errores, tamaño de muestra, simulación y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'ondas-em', 'index.html'));
    await page.waitForFunction(() => window.OndasEMApp);
    const antes = fallos;
    const verO = (await page.locator('#ver').textContent()).trim();
    if (verO !== Version.de('ondas-em').current) mal(`Ondas EM: la página muestra la versión «${verO}», se esperaba ${Version.de('ondas-em').current}`);
    for (const e of OeC.ejemplos) {
      await page.evaluate((c) => OndasEMApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
      if (r.err || r.pasos < 2 || r.res < 1) mal(`Ondas EM · ${e.clave}: falta el resultado o el desarrollo`);
      if (r.modo !== e.sc.modo) mal(`Ondas EM · ${e.clave}: el modo no cuadra`);
    }
    await page.evaluate(() => OndasEMApp.abrirEjemplo('fm'));
    if (!(await page.locator('#res').textContent()).includes('2,998 m')) mal('Ondas EM: λ = 2,998 m no sale en la página');
    await page.fill('#f-valor', '200e6');
    if (!(await page.locator('#res').textContent()).includes('1,499 m')) mal('Ondas EM: con el doble de frecuencia λ no se reduce a la mitad');
    await page.selectOption('#f-pol', '+z');
    if ((await page.locator('#f-prop').inputValue()).slice(-1) === 'z' || !(await page.locator('#error').isHidden())) mal('Ondas EM: al poner E paralelo a k no se corrige la propagación o da error');
    await page.selectOption('#f-medio', 'medio');
    if ((await page.locator('#f-er').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Ondas EM: al elegir un material no sale εr o da error');
    await page.fill('#f-E0', 'abc');
    if (await page.locator('#error').isHidden()) mal('Ondas EM: una E₀ que no es un número no da error');
    await page.selectOption('#f-modo', 'perdidas');
    if (!(await page.locator('#res').textContent()).includes('buen conductor')) mal('Ondas EM: el cobre no sale buen conductor');
    await page.click('#play');
    if ((await page.locator('#play').textContent()).trim() !== '▶ Seguir') mal('Ondas EM: el botón de pausa no cambia');
    for (let i = 0; i < 12; i++) { await page.evaluate(() => OndasEMApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Ondas EM: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => OndasEMApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Ondas EM: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Ondas EM planas: ${OeC.ejemplos.length} ejemplos, cambio de frecuencia, E perpendicular a k, material, pérdidas, errores y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'fisica', 'interferencia', 'index.html'));
    await page.waitForFunction(() => window.InterferenciaApp);
    const antes = fallos;
    const verF = (await page.locator('#ver').textContent()).trim();
    if (verF !== Version.de('interferencia').current) mal(`Interferencia: la página muestra la versión «${verF}», se esperaba ${Version.de('interferencia').current}`);
    for (const e of IfC.ejemplos) {
      await page.evaluate((c) => InterferenciaApp.abrirEjemplo(c), e.clave);
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#f-modo').value }));
      if (r.err || r.pasos < 2 || r.res < 1) mal(`Interferencia · ${e.clave}: falta el resultado o el desarrollo`);
      if (r.modo !== e.sc.modo) mal(`Interferencia · ${e.clave}: el modo no cuadra`);
    }
    await page.evaluate(() => InterferenciaApp.abrirEjemplo('young'));
    if (!(await page.locator('#res').textContent()).includes('3,798 mm')) mal('Interferencia: la interfranja de 3,798 mm no sale en la página');
    await page.fill('#f-d', '0,5');
    if (!(await page.locator('#res').textContent()).includes('1,899 mm')) mal('Interferencia: con el doble de d la interfranja no baja a la mitad');
    await page.fill('#f-m', '9999');
    if (await page.locator('#error').isHidden()) mal('Interferencia: un orden que no existe no da error');
    await page.selectOption('#f-modo', 'lamina');
    if ((await page.locator('#f-nl').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Interferencia: al pasar a lámina delgada no sale n o da error');
    await page.click('#play');
    if ((await page.locator('#play').textContent()).trim() !== '▶ Seguir') mal('Interferencia: el botón de pausa no cambia');
    for (let i = 0; i < 12; i++) { await page.evaluate(() => InterferenciaApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Interferencia: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => InterferenciaApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Interferencia: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Interferencia y difracción: ${IfC.ejemplos.length} ejemplos, interfranja, cambio de d, orden imposible, lámina y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'matematicas', 'laplace', 'index.html'));
    await page.waitForFunction(() => window.LaplaceApp);
    const antes = fallos;
    const verL = (await page.locator('#ver').textContent()).trim();
    if (verL !== Version.de('laplace').current) mal(`Laplace: la página muestra la versión «${verL}», se esperaba ${Version.de('laplace').current}`);
    for (const e of LapC.ejemplos) {
      await page.evaluate((c) => LaplaceApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length + document.querySelectorAll('#resumen math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div.num').length, modo: document.querySelector('#modo').value }));
      if (r.err || r.pasos < 3 || r.res < 1) mal(`Laplace · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Laplace · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.modo !== e.sc.modo) mal(`Laplace · ${e.clave}: el modo no cuadra`);
    }
    await page.evaluate(() => LaplaceApp.abrirEjemplo('doble'));
    if (!(await page.locator('#resumen').textContent()).includes('1,68909')) mal('Laplace: f(1) del polo doble no sale 1,68909 en la página');
    await page.fill('#f-F', '(s^2 + 1)/(s + 1)');
    if (await page.locator('#error').isHidden()) mal('Laplace: una F(s) impropia no da error');
    await page.fill('#f-F', '1/(s^2 + 2s + 2)');
    if (!(await page.locator('#error').isHidden()) || !(await page.locator('#resumen').textContent()).includes('sen')) mal('Laplace: 1/(s² + 2s + 2) no da un seno amortiguado');
    await page.selectOption('#modo', 'edo');
    if ((await page.locator('#f-v0').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Laplace: al pasar a EDO no salen sus campos o da error');
    await page.selectOption('#f-orden', '1');
    if ((await page.locator('#f-v0').count()) !== 0 || !(await page.locator('#error').isHidden())) mal('Laplace: en primer orden sigue pidiendo y′(0) o da error');
    await page.click('#animar'); await page.waitForTimeout(500); await page.click('#animar');
    for (let i = 0; i < 15; i++) { await page.evaluate(() => LaplaceApp.azar()); if (!(await page.locator('#error').isHidden())) mal(`Laplace: un ejercicio al azar da error: ${JSON.stringify(await page.evaluate(() => LaplaceApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Laplace: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Transformada de Laplace: ${LapC.ejemplos.length} ejemplos con MathML, F(s) impropia, cambio de modo y de orden, animación y ejercicios al azar sin errores de consola`);
  }
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', (e) => consola.push('excepción: ' + e.message));
    await page.goto('file://' + path.join(publico, 'matematicas', 'derivadas', 'index.html'));
    await page.waitForFunction(() => window.DerivadasApp);
    const antes = fallos;
    const verD = (await page.locator('#ver').textContent()).trim();
    if (verD !== Version.de('derivadas').current) mal(`Derivadas: la página muestra la versión «${verD}», se esperaba ${Version.de('derivadas').current}`);
    for (const e of DerC.ejemplos) {
      await page.evaluate((c) => DerivadasApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent + document.querySelector('#resumen').textContent), res: document.querySelectorAll('#resumen > div').length, modo: document.querySelector('#modo').value }));
      if (r.err || r.pasos < 3 || r.res < 1) mal(`Derivadas · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Derivadas · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.modo !== e.sc.modo) mal(`Derivadas · ${e.clave}: el modo no cuadra`);
    }
    await page.evaluate(() => DerivadasApp.abrirEjemplo('partes'));
    if (!(await page.locator('#resumen').textContent()).includes('0,718282')) mal('Derivadas: ∫₀¹ x² eˣ no sale 0,718282 en la página');
    await page.fill('#f-b', '1');
    await page.fill('#f-a', '1');
    if (await page.locator('#error').isHidden()) mal('Derivadas: a = b no da error');
    await page.selectOption('#modo', 'derivada');
    if ((await page.locator('#f-x0').count()) !== 1 || !(await page.locator('#error').isHidden())) mal('Derivadas: al pasar a derivada no salen sus campos o da error');
    const box = await page.locator('#grafica').boundingBox();
    const x0 = await page.locator('#f-x0').inputValue();
    await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.4);
    if ((await page.locator('#f-x0').inputValue()) === x0 || !(await page.locator('#error').isHidden())) mal('Derivadas: tocar la gráfica no cambia x₀');
    await page.click('#animar'); await page.waitForTimeout(500); await page.click('#animar');
    for (let i = 0; i < 15; i++) { await page.evaluate(() => DerivadasApp.azar()); if (!(await page.locator('#error').isHidden()) || !(await page.locator('#resumen > div.num').count())) mal(`Derivadas: un ejercicio al azar da error o no tiene resultado numérico: ${JSON.stringify(await page.evaluate(() => DerivadasApp.estado()))}`); }
    await page.close();
    if (consola.length) mal('Derivadas: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Derivadas e integrales: ${DerC.ejemplos.length} ejemplos con MathML, a = b, cambio de modo, tocar la gráfica, animación y ejercicios al azar sin errores de consola`);
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
    for (const pag of ['circuitos/alterna', 'circuitos/continua', 'electromagnetismo/condensadores', 'fisica/dinamica', 'estadistica/distribuciones', 'electromagnetismo/faraday', 'fisica/gases', 'electromagnetismo/induccion', 'matematicas/matrices', 'fisica/ondas', 'fisica/doppler', 'circuitos/resistencias', 'estadistica/regresion', 'matematicas/complejos', 'fisica/fluidos', 'quimica/ph', 'fisica/ciclos', 'matematicas/taylor', 'matematicas/fourier', 'matematicas/edos', 'matematicas/laplace', 'matematicas/derivadas', 'quimica/cinetica', 'matematicas/campos', 'electromagnetismo/fuerza', 'matematicas/sistemas', 'fisica/solido-rigido']) {
      await page.goto('file://' + path.join(publico, ...pag.split('/'), 'index.html'));
      await page.waitForFunction(() => document.querySelectorAll('.teoria .f[data-m]').length > 0);
      const r = await page.evaluate(() => [...document.querySelectorAll('.teoria .f')].map((e) => e.querySelectorAll('math').length > 0 && !/\$/.test(e.textContent)));
      if (!r.length || r.includes(false)) mal(`${pag}: alguna caja de la teoría no sale en MathML`);
      // y ninguna fórmula suelta en el texto de la teoría se queda con sus $
      if (await page.evaluate(() => /\$/.test(document.querySelector('.teoria').textContent))) mal(`${pag}: hay una fórmula de la teoría que se ve con $`);
    }
    await page.close();
    if (consola.length) mal('Arreglo 2: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log('  ✓ Fórmulas MathML: desarrollo y teoría de Tiro parabólico, Trabajo y energía y Calorimetría, y la teoría de otras 25 herramientas, sin $ sueltos');
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
      // los ejemplos se abren desde la barra («Ejercicios de ejemplo»); el desplegable de la página está oculto
      const ej = (await page.$$('.bib .bib-ej')).length >= 2;
      if (ej) await page.click('.bib .bib-ej >> nth=0');
      await page.click('.bib [data-acc=nuevo]'); await page.fill('#bib-t', 'Prueba'); await page.fill('#bib-c', 'Tema 1'); await page.click('.bib [data-acc=guardar]');
      const guardado = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).items, `simu-ejercicios:${dir}`);
      if (guardado.length !== 1 || typeof guardado[0].datos !== 'string' || guardado[0].carpeta !== 'Tema 1') { mal(`${pag}: «Guardar el actual» no guarda el ejercicio`); await page.close(); continue; }
      if (!(await page.$('.bib-carp'))) mal(`${pag}: no aparece la carpeta`);
      if (ej) await page.click('.bib .bib-ej >> nth=1');
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
    if (probadas < 38) mal(`Mis ejercicios: solo se ha probado en ${probadas} herramientas`);
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
    if (probadas < 38) mal(`Modo práctica: solo se ha probado en ${probadas} herramientas`);
    if (fallos === antes) console.log(`  ✓ Modo práctica: ${ejercicios} ejercicios al azar en ${probadas} herramientas, corregidos bien y mal, con la solución y la vuelta a los datos de antes`);
  }
  // portada y páginas de asignatura: sin errores de consola y sin enlaces internos rotos
  const portal = ['index.html', 'novedades/index.html', 'foro/index.html', ...Catalogo.asignaturas.map((a) => `${a.clave}/index.html`), 'electromagnetismo/magnetostatica/index.html', 'quimica/tabla-periodica/index.html', 'fisica/trabajo-y-energia/index.html', 'quimica/masa-molar/index.html', 'quimica/configuracion-electronica/index.html', 'electromagnetismo/condensadores/index.html', 'fisica/tiro-parabolico/index.html', 'quimica/disoluciones/index.html', 'fisica/calorimetria/index.html', 'electromagnetismo/induccion/index.html', 'matematicas/matrices/index.html', 'matematicas/sistemas/index.html', 'estadistica/distribuciones/index.html', 'circuitos/alterna/index.html', 'fisica/dinamica/index.html', 'circuitos/continua/index.html', 'fisica/solido-rigido/index.html', 'fisica/ondas/index.html', 'fisica/doppler/index.html', 'circuitos/resistencias/index.html', 'estadistica/regresion/index.html', 'matematicas/complejos/index.html', 'fisica/fluidos/index.html', 'quimica/ph/index.html', 'fisica/ciclos/index.html', 'matematicas/taylor/index.html', 'matematicas/fourier/index.html', 'matematicas/edos/index.html', 'quimica/cinetica/index.html', 'matematicas/campos/index.html', 'electromagnetismo/fuerza/index.html', 'circuitos/transitorios/index.html', 'estadistica/intervalos/index.html', 'electromagnetismo/ondas-em/index.html', 'fisica/interferencia/index.html', 'matematicas/laplace/index.html', 'matematicas/derivadas/index.html', 'fisica/gases/index.html', 'electromagnetismo/faraday/index.html'];
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
      await page.fill('#buscar', '');
      // barra lateral: un enlace por asignatura que lleva a su sección y queda marcado
      const lado = await page.locator('.lado a[href^="#"]').evaluateAll((as) => as.map((a) => a.hash.slice(1)));
      for (const a of Catalogo.asignaturas) if (!lado.includes(a.clave)) mal(`portada: la barra lateral no enlaza ${a.nombre}`);
      for (const id of lado) if (!(await page.locator(`[id="${id}"]`).count())) mal(`portada: la barra lateral enlaza #${id}, que no existe`);
      await page.click('.lado a[href="#quimica"]');
      if (!(await page.locator('.lado a.on[href="#quimica"]').count())) mal('portada: pulsar Química en la barra lateral no la marca');
      // las herramientas que vienen después salen como «Próximamente», sin enlace
      const pronto = Catalogo.asignaturas.flatMap((x) => x.herramientas.filter((h) => !h.disponible)).length;
      const off = await page.locator('.mini .off').evaluateAll((ds) => ds.filter((d) => !d.closest('a') && !d.querySelector('a') && d.textContent.includes('Próximamente')).length);
      if (off !== pronto) mal(`portada: ${off} herramientas «Próximamente» sin enlace, se esperaban ${pronto}`);
    }
    const asig = Catalogo.asignaturas.find((y) => f === `${y.clave}/index.html`);
    if (asig) {
      const x = asig, pronto = x.herramientas.filter((h) => !h.disponible).length;
      if ((await page.locator('.cards div.card.off').count()) !== pronto || (await page.locator('.cards a.card').count()) !== x.herramientas.length - pronto) mal(`${f}: las tarjetas «Próximamente» no coinciden con el catálogo o tienen enlace`);
    }
    if (f === 'foro/index.html') {
      if (!(await page.locator('h1').textContent()).includes('en construcción')) mal('foro: la página no dice que está en construcción');
    }
    if (!(await page.locator('header.top a.foro:visible').count())) mal(`${f}: la cabecera no tiene el enlace al Foro`);
    if (f === 'novedades/index.html') {
      // una tarjeta por versión con todos sus cambios dentro, y cada herramienta nueva enlazada
      const log = require(path.join(fuente, 'version.js')).de('web').log;
      const tarjetas = await page.locator('.vers').evaluateAll((vs) => vs.map((v) => ({ v: v.querySelector('h2').textContent, n: v.querySelectorAll('li').length })));
      if (tarjetas.length !== log.length) mal(`novedades: ${tarjetas.length} versiones, se esperaban ${log.length}`);
      log.forEach((r, i) => { if (tarjetas[i]?.v !== r.v || tarjetas[i]?.n !== r.cambios.length) mal(`novedades: la versión ${r.v} no tiene sus ${r.cambios.length} cambios juntos`); });
      const nuevas = log.flatMap((r) => r.cambios).filter((c) => c.startsWith('Nueva herramienta:')).length, enlazadas = await page.locator('.vers a.ir').count();
      if (enlazadas !== nuevas) mal(`novedades: ${enlazadas} herramientas nuevas con enlace, se esperaban ${nuevas}`);
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
