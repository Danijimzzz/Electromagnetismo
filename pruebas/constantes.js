#!/usr/bin/env node
/* ===== Constantes comunes de Física (FIS.FG-1 y FIS.UN-2) =====
   1) Constantes.SI coincide con la tabla CODATA de Unidades (2018 y 2022) y ninguna herramienta repite su número.
   2) El interruptor de g (fisica/constantes.js): en cada herramienta que lo lleva, elegir 9,8 / 9,81 / 9,80665 pone ese
      valor en el campo «Gravedad», recalcula, y se mantiene al recargar y en otra herramienta; «como en cada herramienta» no toca nada.
   Uso: node pruebas/constantes.js [--sin-navegador]  (la parte 2 necesita publico/ compilado y Playwright) */
const fs = require('fs'), path = require('path'), http = require('http');
const RAIZ = path.join(__dirname, '..'), fuente = path.join(RAIZ, 'fuente'), publico = path.join(RAIZ, 'publico');
let fallos = 0, hechos = 0;
const ok = (c, m) => { hechos++; if (!c) { fallos++; console.log(`✗ ${m}`); } };
const SI = require(path.join(fuente, 'fisica', 'constantes.js')).SI, U = require(path.join(fuente, 'unidades', 'calculo.js'));
for (const [ed, tabla] of Object.entries(U.EDICIONES)) for (const [k, nom] of [['c', 'Velocidad de la luz en el vacío'], ['h', 'Constante de Planck'], ['e', 'Carga elemental'], ['kB', 'Constante de Boltzmann'], ['NA', 'Número de Avogadro'], ['G', 'Constante de gravitación universal']]) {
  const t = tabla.find((x) => x.n === nom); ok(t && Math.abs(t.v - SI[k]) <= 1e-9 * SI[k], `Constantes.SI.${k} no coincide con la tabla de Unidades (${ed})`);
}
const LITERAL = /[=,]\s*(299792458|1\.380649e-23|6\.62607015e-34|1\.602176634e-19|6\.02214076e23|6\.6743e-11)\b/;
const recorre = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? recorre(path.join(d, e.name)) : /\.js$/.test(e.name) ? [path.join(d, e.name)] : []));
for (const f of recorre(fuente)) {
  if (/constantes\.js$|catalogo\.js$/.test(f)) continue;
  // fuera: la tabla CODATA de Unidades (es su dato), las escenas de «Física en la vida real» (cada una es un script suelto con sus números) y Química (formulas.js)
  if (/unidades[\\/]calculo\.js$|fenomenos[\\/]|quimica[\\/]formulas\.js$/.test(f)) continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (LITERAL.test(l) && !/^\s*(\/\/|\*)/.test(l) && !/nombre:|clave:|sc:/.test(l)) ok(false, `${path.relative(RAIZ, f)}:${i + 1} repite una constante del SI: ${l.trim().slice(0, 80)}`); });
}
console.log(`  ✓ Constantes.SI = tabla de Unidades y ninguna herramienta repite el número`);
// F15.4 · un solo ajuste «de clase»: Herramienta.ajuste guarda masas, constantes y g con una clave y un evento, y migra lo antiguo
{
  const Herr = require(path.join(fuente, 'herramienta.js')), memoria = {}; global.Herramienta = Herr;
  global.localStorage = { getItem: (k) => (k in memoria ? memoria[k] : null), setItem: (k, v) => { memoria[k] = String(v); }, removeItem: (k) => { delete memoria[k]; } };
  const eventos = []; const EventoReal = global.Event; global.dispatchEvent = (e) => eventos.push(e.type);
  const A = Herr.ajuste, Aj = require(path.join(fuente, 'quimica', 'ajuste.js')), K = require(path.join(fuente, 'fisica', 'constantes.js'));
  ok(A.CLAVE === 'simu-ajuste' && A.EVENTO === 'simu-ajuste', 'ajuste: una sola clave y un solo evento');
  ok(JSON.stringify(A.leer()) === '{}' && !Aj.guardado() && K.leer().g === null, 'ajuste: sin nada guardado, todo en su valor de partida');
  ok(Aj.leer({ masas: true }).masas === true && Aj.leer().masas === false, 'ajuste: el valor de partida de cada herramienta se respeta');
  // lo guardado con las claves antiguas se migra y se borran
  memoria['quimica-ajuste'] = JSON.stringify({ masas: true, constantes: false }); memoria['fisica-constantes'] = JSON.stringify({ g: '9,81' });
  ok(Aj.leer().masas === true && Aj.leer().constantes === false && Aj.guardado() && K.leer().g === '9,81', 'ajuste: no migra lo guardado con las claves antiguas');
  ok(!('quimica-ajuste' in memoria) && !('fisica-constantes' in memoria) && !!memoria['simu-ajuste'], 'ajuste: tras migrar quedan las claves antiguas o falta la nueva');
  // cada parte escribe la suya sin pisar la otra, y avisa con el mismo evento
  Aj.escribe({ masas: false, constantes: true }); ok(K.leer().g === '9,81', 'ajuste: escribir Química borró la gravedad');
  eventos.length = 0; Herr.ajuste.escribe({ g: '9,8' }); ok(Aj.leer().masas === false && Aj.leer().constantes === true && K.leer().g === '9,8' && eventos.join() === 'simu-ajuste', 'ajuste: escribir g pisó Química o no avisó con simu-ajuste');
  Herr.ajuste.escribe({ g: null }); ok(K.leer().g === null, 'ajuste: g null no vuelve a «como en cada herramienta»');
  memoria['simu-ajuste'] = 'no es json'; ok(JSON.stringify(A.leer()) === '{}' && K.leer().g === null, 'ajuste: un valor roto debe leerse como vacío');
  delete global.localStorage; delete global.dispatchEvent; delete global.Herramienta; global.Event = EventoReal;
}
console.log('  ✓ Ajuste común (F15.4): una clave, un evento, migración de lo antiguo y partes independientes');
const HERR = [['fisica', 'dinamica'], ['fisica', 'fluidos'], ['fisica', 'solido-rigido'], ['fisica', 'trabajo-y-energia'], ['fisica', 'tiro-parabolico']];
async function navegador() {
  const { chromium } = require('playwright');
  const TIPOS = { html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json', png: 'image/png', webmanifest: 'application/json' };
  const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(publico, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TIPOS[f.split('.').pop()] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); }).listen(0);
  const base = `http://127.0.0.1:${srv.address().port}`;
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
  const ctx = await b.newContext(); const p = await ctx.newPage(); await p.route(/google|doubleclick/, (r) => r.abort());
  const errores = []; p.on('pageerror', (e) => errores.push(e.message));
  const valoresG = () => p.$$eval('input[data-k="g"], input[id$="-g"]', (xs) => xs.map((x) => x.value));
  for (const [a, c] of HERR) {
    await p.goto(`${base}/${a}/${c}/`, { waitUntil: 'load' }); await p.waitForTimeout(300);
    if (c === 'solido-rigido') { await p.selectOption('#f-modo', 'polea'); await p.waitForTimeout(200); }
    const antes = await valoresG();
    ok(await p.$('#aj-g') !== null, `${c}: falta el interruptor de g`);
    ok(antes.length > 0, `${c}: no hay campo de gravedad con data-k="g" para probar`);
    await p.selectOption('#aj-g', ''); ok(JSON.stringify(await valoresG()) === JSON.stringify(antes), `${c}: «como en cada herramienta» cambió el campo`);
    for (const v of ['9,81', '9,80665', '9,8']) { await p.selectOption('#aj-g', v); await p.waitForTimeout(150); ok((await valoresG()).every((x) => x === v), `${c}: con ${v} el campo g vale ${(await valoresG()).join('/')}`); }
    await p.selectOption('#aj-g', '9,80665'); await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(300);
    ok((await valoresG()).every((x) => x === '9,80665') && (await p.$eval('#aj-g', (s) => s.value)) === '9,80665', `${c}: la elección no sobrevive a recargar`);
    await p.selectOption('#aj-g', '');
  }
  ok(errores.length === 0, `errores de página: ${errores.join(' | ')}`);
  await b.close(); srv.close();
  console.log('  ✓ Interruptor de g: 9,8 / 9,81 / 9,80665 en 5 herramientas, se conserva al recargar');
}
(process.argv.includes('--sin-navegador') ? Promise.resolve() : navegador()).then(() => { console.log(`Constantes de Física: ${hechos} comprobaciones; ${fallos} fallos.`); process.exit(fallos ? 1 : 0); }).catch((e) => { console.log('✗', e.message); process.exit(1); });
