/* Comprobación del motor del Simulador de circuitos (sin navegador): equivalencia con Continua y Alterna,
   circuitos calculados a mano y coherencia entre continua, fasores y transitorio.
   node pruebas/simulador/motor.js */
const path = require('path'), fuente = path.join(__dirname, '..', '..', 'fuente');
global.Herramienta = require(path.join(fuente, 'herramienta.js'));
const S = require(path.join(fuente, 'simulador', 'motor.js'));
const Continua = require(path.join(fuente, 'circuitos', 'fisica.js'));
const Alterna = require(path.join(fuente, 'alterna', 'fisica.js'));
let fallos = 0;
const mal = (m) => { fallos++; console.log('✗ ' + m); };
const cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)))) mal(`${q}: ${a} en vez de ${b}`); };
const cc = (v) => ({ tipo: 'cc', v });

// adaptador: ejemplo de Continua → circuito del simulador
function deContinua(sc) {
  const s = Continua.resolver(sc);
  return s.els.map((e) => {
    const base = { id: e.n, t: e.t, p: [e.a, e.b] };
    switch (e.t) {
      case 'R': return { ...base, R: e.v };
      case 'V': case 'I': return { ...base, onda: cc(e.v) };
      case 'C': return { ...base, C: e.v };
      case 'L': return { ...base, L: e.v };
      case 'VV': return { ...base, p: [e.a, e.b, e.c, e.d], k: e.v };
      case 'IV': return { ...base, p: [e.a, e.b, e.c, e.d], g: e.v };
      case 'VI': return { ...base, r: e.v, ctrl: e.x };
      case 'II': return { ...base, beta: e.v, ctrl: e.x };
      default: throw new Error(e.t);
    }
  });
}
const conTierra = (els) => els; // Continua ya usa el nudo 0

// 1. Equivalencia con Continua en todos sus ejemplos
for (const ej of Continua.ejemplos) {
  const ref = Continua.resolver(ej.sc);
  if (ref.ref !== '0') continue; // los ejemplos usan el nudo 0
  const r = S.operacion({ elementos: conTierra(deContinua(ej.sc)) });
  for (const n of ref.nudos) if (n !== ref.ref) cerca(r.V[n].re, ref.V[n], 1e-8, `${ej.clave}: V_${n}`);
  for (const e of ref.els) { cerca(r.I[e.n].re, e.I, 1e-7, `${ej.clave}: I de ${e.n}`); cerca(r.P[e.n].re, e.P, 1e-6, `${ej.clave}: P de ${e.n}`); }
  cerca(r.balance, 0, 1e-8, `${ej.clave}: balance de potencias`);
}

// 2. Alterna: RLC en serie de los ejemplos, con la tensión eficaz y la fase como en Alterna
for (const clave of ['rlc-serie', 'resonancia', 'rl', 'rc']) {
  const sc = Alterna.ejemplos.find((e) => e.clave === clave).sc, ref = Alterna.circuito(sc);
  const el = [{ id: 'E', t: 'V', p: ['a', '0'], onda: { tipo: 'seno', A: +sc.V, eficaz: true, f: +sc.f, fase: 0 } }, { id: 'R', t: 'R', p: ['a', 'b'], R: +sc.R }];
  let ult = 'b';
  if (sc.L) { el.push({ id: 'L', t: 'L', p: [ult, 'c'], L: +sc.L * 1e-3 }); ult = 'c'; }
  if (sc.C) el.push({ id: 'C', t: 'C', p: [ult, '0'], C: +sc.C * 1e-6 }); else el[el.length - 1].p[1] === '0' || el.push({ id: 'Rr', t: 'R', p: [ult, '0'], R: 1e-9 });
  const f = S.fasores({ elementos: el })[0];
  cerca(S.mod(f.I.R) / Math.SQRT2, Alterna.mod(ref.I), 1e-6, `Alterna ${clave}: corriente eficaz`);
  cerca(S.arg(f.U.E) - S.arg(f.I.R), ref.fi, 1e-6, `Alterna ${clave}: desfase`);
}
// paralelo: R ∥ L ∥ C a 60 Hz
{
  const sc = Alterna.ejemplos.find((e) => e.clave === 'paralelo').sc, ref = Alterna.circuito(sc);
  const f = S.fasores({ elementos: [{ id: 'E', t: 'V', p: ['a', '0'], onda: { tipo: 'seno', A: +sc.V, eficaz: true, f: +sc.f, fase: 0 } }, { id: 'R', t: 'R', p: ['a', '0'], R: +sc.R }, { id: 'L', t: 'L', p: ['a', '0'], L: +sc.L * 1e-3 }, { id: 'C', t: 'C', p: ['a', '0'], C: +sc.C * 1e-6 }] })[0];
  cerca(S.mod(f.I.E) / Math.SQRT2, Alterna.mod(ref.I), 1e-6, 'Alterna paralelo: corriente total');
}
// red con dos fuentes (red-bobina-real): corrientes por la bobina real
{
  const ej = Alterna.ejemplos.find((e) => e.clave === 'red-bobina-real').sc, ref = Alterna.red(ej);
  const el = ej.elementos.map((e, i) => ({ id: ref.els[i].n, t: e.t, p: [e.a, e.b], ...(e.t === 'V' ? { onda: { tipo: 'seno', A: +e.v, eficaz: true, f: +ej.f, fase: +e.fase || 0 } } : e.t === 'R' ? { R: +e.v } : e.t === 'L' ? { L: +e.v * 1e-3 } : { C: +e.v * 1e-6 }) }));
  const f = S.fasores({ elementos: el })[0];
  for (const e of ref.els) if (e.t !== 'V') cerca(S.mod(f.I[e.n]) / Math.SQRT2, Alterna.mod(e.I), 1e-6, `Alterna red: corriente de ${e.n}`);
}

// 3. A mano: RC, RL, RLC, resonancia, transformador, amplificador operacional, diodo
const V5 = { id: 'E', t: 'V', p: ['a', '0'], onda: { tipo: 'escalon', v1: 0, v2: 5, t0: 0 } };
{ const tr = S.transitorio({ elementos: [V5, { id: 'R', t: 'R', p: ['a', 'b'], R: 1000 }, { id: 'C', t: 'C', p: ['b', '0'], C: 1e-6 }] }, { tfin: 5e-3 });
  for (const k of [200, 500, 1000, 2000]) cerca(tr.V.b[k], 5 * (1 - Math.exp(-tr.t[k] / 1e-3)), 2e-4, `RC: v_C en t = ${tr.t[k]}`); }
{ const tr = S.transitorio({ elementos: [V5, { id: 'R', t: 'R', p: ['a', 'b'], R: 10 }, { id: 'L', t: 'L', p: ['b', '0'], L: 0.01 }] }, { tfin: 5e-3 });
  for (const k of [200, 1000, 2000]) cerca(tr.I.L[k], 0.5 * (1 - Math.exp(-tr.t[k] / 1e-3)), 2e-4, `RL: i_L en t = ${tr.t[k]}`); }
{ // RLC en serie subamortiguado: v_C(t) = 5·[1 − e^{−αt}(cos ωd t + α/ωd sen ωd t)]
  const R = 20, L = 0.01, C = 1e-6, a = R / (2 * L), w0 = 1 / Math.sqrt(L * C), wd = Math.sqrt(w0 * w0 - a * a);
  const tr = S.transitorio({ elementos: [V5, { id: 'R', t: 'R', p: ['a', 'b'], R }, { id: 'L', t: 'L', p: ['b', 'c'], L }, { id: 'C', t: 'C', p: ['c', '0'], C }] }, { tfin: 3e-3, puntos: 6000 });
  for (const k of [300, 900, 1800, 3000]) { const t = tr.t[k]; cerca(tr.V.c[k], 5 * (1 - Math.exp(-a * t) * (Math.cos(wd * t) + a / wd * Math.sin(wd * t))), 2e-3, `RLC subamortiguado en t = ${t}`); } }
{ // transformador ideal 10:1 con carga de 10 Ω: 230 V → 23 V
  const f = S.fasores({ elementos: [{ id: 'E', t: 'V', p: ['a', '0'], onda: { tipo: 'seno', A: 230, eficaz: true, f: 50, fase: 0 } }, { id: 'T', t: 'TR', p: ['a', '0', 'b', '0'], n: 10 }, { id: 'R', t: 'R', p: ['b', '0'], R: 10 }] })[0];
  cerca(S.mod(f.V.b) / Math.SQRT2, 23, 1e-9, 'transformador: tensión secundaria'); cerca(S.mod(f.I.E) / Math.SQRT2, 0.23, 1e-6, 'transformador: corriente primaria'); }
{ // operacional inversor: ganancia −R2/R1 = −5
  const r = S.operacion({ elementos: [{ id: 'E', t: 'V', p: ['e', '0'], onda: cc(1) }, { id: 'R1', t: 'R', p: ['e', 'n'], R: 1000 }, { id: 'R2', t: 'R', p: ['n', 's'], R: 5000 }, { id: 'A', t: 'AO', p: ['0', 'n', 's'] }] });
  cerca(r.V.s.re, -5, 1e-6, 'operacional inversor'); }
{ // diodo con 5 V y 1 kΩ: ≈ 4,3 V en la carga
  const r = S.operacion({ elementos: [{ id: 'E', t: 'V', p: ['a', '0'], onda: cc(5) }, { id: 'D', t: 'D', p: ['a', 'b'] }, { id: 'R', t: 'R', p: ['b', '0'], R: 1000 }] });
  if (!(r.V.b.re > 4.2 && r.V.b.re < 4.5)) mal(`diodo: V_R = ${r.V.b.re}`); cerca(r.balance, 0, 1e-6, 'diodo: balance'); }
{ // interruptor que cierra en 1 ms: el condensador se carga después
  const tr = S.transitorio({ elementos: [{ id: 'E', t: 'V', p: ['a', '0'], onda: cc(5) }, { id: 'S', t: 'SW', p: ['a', 'b'], estado: 'abierto', tc: 1e-3 }, { id: 'R', t: 'R', p: ['b', 'c'], R: 1000 }, { id: 'C', t: 'C', p: ['c', '0'], C: 1e-6 }] }, { tfin: 5e-3 });
  const k0 = tr.t.findIndex((t) => t >= 0.9e-3), k1 = tr.t.findIndex((t) => t >= 2e-3);
  cerca(tr.V.c[k0], 0, 1e-6, 'interruptor: antes de cerrar'); cerca(tr.V.c[k1], 5 * (1 - Math.exp(-1)), 3e-3, 'interruptor: 1 τ después de cerrar'); }

// 4. Coherencia: transitorio en régimen estacionario = fasores, y continua + alterna a la vez
{
  const el = [{ id: 'E', t: 'V', p: ['a', '0'], onda: { tipo: 'seno', A: 2, f: 1000, fase: 0, off: 5 } }, { id: 'R', t: 'R', p: ['a', 'b'], R: 1000 }, { id: 'C', t: 'C', p: ['b', '0'], C: 159e-9 }];
  const op = S.operacion({ elementos: el }), fa = S.fasores({ elementos: el })[0];
  cerca(op.V.b.re, 5, 1e-6, 'continua + alterna: la parte de continua es 5 V');
  cerca(S.mod(fa.V.b), 2 / Math.hypot(1, 2 * Math.PI * 1000 * 1000 * 159e-9), 1e-9, 'continua + alterna: amplitud en el condensador');
  const tr = S.transitorio({ elementos: el }, { tfin: 0.02, puntos: 40000 }), n = tr.t.length, ult = tr.V.b.slice(n - 2001);
  cerca(Math.max(...ult) - 5, S.mod(fa.V.b), 2e-3, 'transitorio estacionario = fasor (pico)');
  cerca(S.estadistica(tr.t.slice(n - 2001), ult).media, 5, 2e-3, 'transitorio: media = 5 V');
}
// 5. Errores claros
for (const [els, re, q] of [[[{ id: 'R', t: 'R', p: ['a', 'b'], R: 5 }], /tierra/, 'sin tierra'], [[{ id: 'V1', t: 'V', p: ['a', '0'], onda: cc(5) }, { id: 'V2', t: 'V', p: ['a', '0'], onda: cc(6) }], /solución única/, 'dos fuentes en paralelo'], [[{ id: 'R', t: 'R', p: ['a', '0'], R: 5 }, { id: 'R2', t: 'R', p: ['b', 'c'], R: 5 }], /partido/, 'circuito partido'], [[{ id: 'R', t: 'R', p: ['a', '0'], R: 0 }], /mayor que 0/, 'R = 0'], [[{ id: 'R', t: 'R', p: ['a', ''], R: 5 }], /sin conectar/, 'patilla suelta']]) {
  let ok = false; try { S.operacion({ elementos: els }); } catch (e) { ok = re.test(e.message); }
  if (!ok) mal(`errores: ${q} no da el aviso esperado`);
}
console.log(fallos ? `✗ ${fallos} fallos en el motor del simulador` : '✓ Motor del simulador: equivalencia con Continua y Alterna, RC, RL, RLC, transformador, operacional, diodo, interruptor y errores');
process.exit(fallos ? 1 : 0);
