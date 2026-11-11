#!/usr/bin/env node
/* ===== Ejercicios al azar de Economía (ECO.EC-1) =====
   Sin navegador: las herramientas de Economía que generan sus propios ejercicios para el modo práctica (azar() y enunciado()
   en su calculo.js) dan 300 ejercicios cada una; todos tienen que resolverse sin error ni NaN, tener enunciado completo
   (sin «undefined» ni «NaN») y variar de verdad (al menos 8 distintos). Lo llama pruebas/comprobar.js (trozo 1).
   Uso: node pruebas/economia-practica.js [--solo CARPETA] */
const path = require('path');
const fuente = path.join(__dirname, '..', 'fuente');
global.Algebra = require(path.join(fuente, 'matematicas', 'algebra.js'));
global.Expr = global.Expresion = require(path.join(fuente, 'matematicas', 'expresion.js'));
global.Herramienta = require(path.join(fuente, 'herramienta.js'));
const Catalogo = require(path.join(fuente, 'catalogo.js'));
const args = process.argv.slice(2), solo = args.includes('--solo') ? args[args.indexOf('--solo') + 1] : null;
const MAL = /NaN|undefined|\[object|Infinity/;
const CONV = new Set(['interes', 'prestamos', 'rentas', 'ahorro', 'bonos', 'van-tir', 'amortizacion-inmovilizado', 'black-scholes', 'tipos-cambio']);
let n = 0, herramientas = 0, fallos = 0; const mal = (m) => { fallos++; console.log('  ✗ ' + m); };
for (const h of Catalogo.asignaturas.find((a) => a.clave === 'economia').herramientas.filter((x) => x.disponible)) {
  const carpeta = h.carpeta || h.clave; if (solo && solo !== carpeta && solo !== h.clave) continue;
  let C; try { C = require(path.join(fuente, carpeta, 'calculo.js')); } catch (e) { continue; }
  if (typeof C.azar !== 'function') continue;
  herramientas++; const vistos = new Set(); let errores = 0;
  for (let k = 0; k < 300; k++) {
    let sc; try { sc = C.azar(); } catch (e) { mal(`${carpeta}: azar() falla: ${e.message}`); break; }
    n++; vistos.add(JSON.stringify(sc));
    let r; try { r = C.resolver(sc); } catch (e) { errores++; if (errores <= 2) mal(`${carpeta}: el ejercicio ${JSON.stringify(sc).slice(0, 160)} no se resuelve: ${e.message}`); continue; }
    const t = (r && r.pasos ? r.pasos.map((p) => String(p.t) + ' ' + String(p.html)).join(' ') : '').replace(/<[^>]+>/g, ' ');
    if (MAL.test(t)) { errores++; if (errores <= 2) mal(`${carpeta}: el desarrollo de ${JSON.stringify(sc).slice(0, 120)} lleva «${(t.match(new RegExp('.{0,30}(' + MAL.source + ').{0,20}')) || [''])[0]}»`); }
    if (CONV.has(carpeta) && !r.pasos.some((p) => p.t === 'Convención')) { errores++; if (errores <= 2) mal(`${carpeta}: el desarrollo no trae el paso «Convención» (ECO.EC-4)`); }
    const e = typeof C.enunciado === 'function' ? C.enunciado(sc) : '';
    if (!e || e.length < 60 || MAL.test(e)) { errores++; if (errores <= 2) mal(`${carpeta}: enunciado malo «${e}» para ${JSON.stringify(sc).slice(0, 100)}`); }
  }
  if (vistos.size < 8) mal(`${carpeta}: solo ${vistos.size} ejercicios distintos en 300`);
}
if (require.main === module) {
  if (fallos) { console.log(`✗ ${fallos} fallo(s)`); process.exit(1); }
  console.log(`  ✓ Economía, ejercicios al azar: ${n} ejercicios de ${herramientas} herramientas, todos resueltos sin error ni NaN, con enunciado completo y variados`);
}
