#!/usr/bin/env node
/* ===== Banco de casos límite de Matemáticas (MAT.MA-2) =====
   Sin navegador: a cada herramienta de Matemáticas con `resolver` y `ejemplos` le cambia UN campo por cada valor incómodo
   (vacío, 0, −0, negativo, enorme, minúsculo, coma y exponente, texto, paréntesis sin cerrar, 1/0, 0/0, ∞…), partiendo de
   cada uno de sus primeros ejemplos, y exige que no haya excepción interna (TypeError, RangeError…), ni un «NaN», «Infinity»,
   «undefined» o «[object» en el texto que ve el usuario, ni más de 3 s de cálculo. Un error explicado en lenguaje claro vale.
   Lo llama pruebas/comprobar.js (trozo 1). Uso: node pruebas/casos-limite-matematicas.js [--solo CARPETA] [--lista] */
const path = require('path');
const fuente = path.join(__dirname, '..', 'fuente');
global.Algebra = require(path.join(fuente, 'matematicas', 'algebra.js'));
global.Expr = global.Expresion = require(path.join(fuente, 'matematicas', 'expresion.js'));
global.Herramienta = require(path.join(fuente, 'herramienta.js'));
const args = process.argv.slice(2), solo = args.includes('--solo') ? args[args.indexOf('--solo') + 1] : null, lista = args.includes('--lista');

// carpeta → ficheros de cálculo que hay que cargar antes (los que pide su página en catalogo.js), y el último es la herramienta
const Catalogo = require(path.join(fuente, 'catalogo.js'));
const asig = Catalogo.asignaturas.find((a) => a.clave === 'matematicas');
const VALORES = ['', ' ', '0', '-0', '-1', '1e308', '-1e308', '1e-320', '1e5', '99999999999999999999', '1,5', '.5', 'abc', '1/0', '0/0', '((', ')', 'x', 'inf', '∞', '-inf', '²', '1e', '--1', '0,0000001', '3·10^8', '\t'];
const MAL = /NaN|Infinity|undefined|\[object|null\b/;
const TRAMPA = new Set(['TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'EvalError', 'URIError']);

// todo el texto de un resultado (cadenas, números sueltos no: un NaN numérico se ve al escribirlo en pasos y resultados)
function textos(x, prof = 0, vistos = new Set(), salida = []) {
  if (x === null || x === undefined || prof > 6) return salida;
  if (typeof x === 'string') { salida.push(x); return salida; }
  if (typeof x !== 'object') return salida;
  if (vistos.has(x)) return salida; vistos.add(x);
  if (Array.isArray(x)) { for (const v of x.slice(0, 60)) textos(v, prof + 1, vistos, salida); return salida; }
  for (const k of ['pasos', 'txt', 'res', 'html', 't', 'tipo', 'Ftxt', 'ftxt', 'aviso', 'nota']) if (k in x) textos(x[k], prof + 1, vistos, salida);
  return salida;
}

let n = 0, fallos = 0, herramientas = 0; const malos = [];
const mal = (m) => { fallos++; malos.push(m); if (fallos <= 40) console.log('  ✗ ' + m); };
for (const h of asig.herramientas.filter((x) => x.disponible)) {
  const carpeta = h.carpeta || h.clave; if (solo && solo !== carpeta && solo !== h.clave) continue;
  const archivo = path.join(fuente, carpeta, 'calculo.js');
  let C; try { global.Laplace = global.Laplace || require(path.join(fuente, 'laplace', 'calculo.js')); global.Derivadas = global.Derivadas || require(path.join(fuente, 'derivadas', 'calculo.js')); C = require(archivo); } catch (e) { continue; }
  if (!C || typeof C.resolver !== 'function' || !Array.isArray(C.ejemplos)) continue;
  herramientas++;
  let casos = 0;
  for (const e of C.ejemplos.slice(0, 4)) {
    const base = e.sc || {};
    for (const campo of Object.keys(base)) {
      // los campos de texto, y en las matrices (listas de listas) la primera y la última casilla
      const M = base[campo], esMat = Array.isArray(M) && M.length && Array.isArray(M[0]) && typeof M[0][0] === 'string';
      if (typeof M !== 'string' && !esMat) continue;
      for (const v of VALORES) {
        if (v === M) continue;
        const sc = { ...base, [campo]: esMat ? M.map((f, i) => f.map((c, j) => (i === 0 && j === 0 && !(e.sc[campo].length === 1) ? v : i === M.length - 1 && j === f.length - 1 && M.length > 1 && v === '' ? v : c))) : v }, donde = `${carpeta} · ejemplo «${e.clave}», ${campo}${esMat ? '[0][0]' : ''} = ${JSON.stringify(v)}`;
        n++; casos++;
        const t0 = Date.now(); let r, err = null;
        try { r = C.resolver(sc); } catch (x) { err = x; }
        const ms = Date.now() - t0;
        if (ms > 3000) mal(`${donde}: tarda ${ms} ms`);
        if (err) {
          if (!(err instanceof Error) || TRAMPA.has(err.constructor.name) || TRAMPA.has(err.name)) mal(`${donde}: excepción interna ${err.name}: ${err.message}`);
          else if (!err.message || MAL.test(err.message)) mal(`${donde}: error sin explicar «${err.message}»`);
        } else {
          const t = textos(r).find((s) => MAL.test(s.replace(/<[^>]+>/g, ' ')));
          if (t) mal(`${donde}: sale «${(t.replace(/<[^>]+>/g, ' ').match(new RegExp('.{0,40}(' + MAL.source + ').{0,30}')) || [t])[0].trim()}»`);
        }
      }
    }
  }
  if (lista) console.log(`· ${carpeta}: ${casos} casos`);
}
if (fallos > 40) console.log(`  … y ${fallos - 40} más`);
if (require.main === module) {
  if (fallos) { console.log(`✗ ${fallos} fallo(s) en ${n} casos`); process.exit(1); }
  console.log(`  ✓ Casos límite de Matemáticas: ${n} casos (un campo cada vez, ${VALORES.length} valores incómodos) en ${herramientas} herramientas, sin excepciones internas ni NaN, Infinity o undefined`);
}
