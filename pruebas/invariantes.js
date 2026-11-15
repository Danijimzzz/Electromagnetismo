/* ===== Invariantes (F14.3) =====
   Propiedades que se tienen que cumplir con datos al azar, con semilla fija: no comparan con un valor hecho a mano sino
   con una ley (R + T = 1, energía conservada, paridad put-call, Σ C(n,k) = 2ⁿ, Kirchhoff…). Sin navegador.
   node pruebas/invariantes.js        (lo llama comprobar.js) */
const path = require('path'), fuente = path.join(__dirname, '..', 'fuente');
global.Expr = require(path.join(fuente, 'matematicas', 'expresion.js')); global.Algebra = require(path.join(fuente, 'matematicas', 'algebra.js')); global.Herramienta = require(path.join(fuente, 'herramienta.js'));
const L = (c, f = 'calculo.js') => require(path.join(fuente, c, f));
let fallos = 0, hechos = 0;
const mal = (m) => { fallos++; if (fallos < 40) console.log('✗ ' + m); };
let semilla = 20261115; const az = () => { semilla = (semilla + 0x6D2B79F5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const entre = (a, b) => a + (b - a) * az(), entero = (a, b) => Math.floor(entre(a, b + 1));
const coma = (x) => String(+x.toPrecision(10)).replace('.', ',');
const igual = (nombre, a, b, rel = 1e-9, abs = 1e-12) => { hechos++; if (!(Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b))))) mal(`${nombre}: ${a} y ${b}`); };
const num = (v) => (typeof v === 'number' ? v : v.re !== undefined ? num(v.re) : Number(v.n) / Number(v.d));

// 1. Fresnel: lo reflejado más lo transmitido es todo (R + T = 1) en cada polarización y en la luz natural
{ const F = L('fresnel');
  for (let i = 0; i < 200; i++) {
    const n1 = entre(1, 2.5), n2 = entre(1, 2.5), cr = n1 > n2 ? Math.asin(n2 / n1) * 180 / Math.PI : 90, th = entre(0, Math.min(cr, 89.5) * 0.98);
    const r = F.resolver({ dato: 'n', n1: coma(n1), n2: coma(n2), theta: coma(th), E0: '', lambda: '' }), q = `Fresnel n1=${n1.toFixed(3)} n2=${n2.toFixed(3)} θ=${th.toFixed(2)}`;
    igual(q + ' (p)', r.Rp + r.Tp, 1, 1e-9); igual(q + ' (s)', r.Rl + r.Tl, 1, 1e-9); igual(q + ' (natural)', r.Rm + r.Tm, 1, 1e-9);
  } }
// 2. Choques: el momento se conserva siempre, y la energía cinética si e = 1 (y nunca aumenta si e < 1)
{ const C = L('choques');
  for (let i = 0; i < 200; i++) {
    const e = i % 2 ? 1 : entre(0, 0.95), sc = { tipo: 'elastico', m1: coma(entre(0.5, 9)), v1x: coma(entre(-9, 9)), v1y: coma(entre(-9, 9)), m2: coma(entre(0.5, 9)), v2x: coma(entre(-9, 9)), v2y: coma(entre(-9, 9)), th: coma(entre(0, 80)), e: coma(e) };
    let r; try { r = C.resolver(sc); } catch (x) { if (/no hay choque/.test(x.message)) continue; throw x; }
    const q = `Choques ${JSON.stringify(sc)}`;
    if (r.p0 && r.p1) { igual(q + ' px', r.p1[0], r.p0[0], 1e-9, 1e-9); igual(q + ' py', r.p1[1], r.p0[1], 1e-9, 1e-9); }
    if (e === 1) igual(q + ' energía', r.k1, r.k0, 1e-9, 1e-9); else if (r.k1 > r.k0 * (1 + 1e-9)) mal(`${q}: gana energía ${r.k0} → ${r.k1}`);
  } }
// 3. Black-Scholes: paridad put-call, C − P = S e^(−qT) − K e^(−rT)
{ const B = L('black-scholes');
  for (let i = 0; i < 200; i++) {
    const S = entre(20, 200), K = entre(20, 200), T = entre(0.1, 3), r = entre(0, 8), sg = entre(8, 80), q = entre(0, 4), sc = { S: coma(S), K: coma(K), T: coma(T), r: coma(r), sigma: coma(sg), q: coma(q), tipo: 'call' };
    const o = B.resolver(sc); igual(`Black-Scholes ${JSON.stringify(sc)} paridad`, o.call - o.put, S * Math.exp(-q / 100 * T) - K * Math.exp(-r / 100 * T), 1e-7, 1e-7);
    if (o.call < Math.max(0, S * Math.exp(-q / 100 * T) - K * Math.exp(-r / 100 * T)) - 1e-9 * S) mal(`Black-Scholes ${JSON.stringify(sc)}: call por debajo de su valor intrínseco`);
    igual(`Black-Scholes ${JSON.stringify(sc)} Δcall − Δput`, o.deltaC - o.deltaP, Math.exp(-q / 100 * T), 1e-7, 1e-9);
  } }
// 4. VAN y TIR: el VAN a la TIR es cero (flujos convencionales: una inversión y cobros)
{ const V = L('van-tir');
  for (let i = 0; i < 200; i++) {
    const n = entero(2, 8), A = entre(1000, 20000), fl = Array.from({ length: n }, () => entre(0.1, 0.6) * A), sc = { a: coma(A), flujos: fl.map(coma).join(' '), k: '8' }, r = V.resolver(sc);
    if (r.tir === null || r.tir === undefined || !isFinite(r.tir)) continue; igual(`VAN-TIR ${JSON.stringify(sc)}: VAN(TIR)`, V.vanDe(A, fl.map((x) => +coma(x).replace(',', '.')), r.tir), 0, 1, 1e-4 * A);
  } }
// 5. Préstamos: la deuda acaba en 0 y lo amortizado suma el capital, en cada sistema
{ const P = L('prestamos');
  for (const sis of ['frances', 'lineal']) for (let i = 0; i < 40; i++) {
    const C = entre(1000, 300000), sc = { sistema: sis, c: coma(C), i: coma(entre(0.5, 9)), anos: String(entero(1, 30)), m: '12', comision: '' }, r = P.resolver(sc), ult = r.filas[r.filas.length - 1];
    igual(`Préstamos ${JSON.stringify(sc)}: deuda final`, ult.pend, 0, 1, 1e-6 * C); igual(`Préstamos ${JSON.stringify(sc)}: suma de lo amortizado`, r.filas.reduce((s, f) => s + f.A, 0), C, 1e-9, 1e-6 * C);
  } }
// 6. Contrastes: intercambiar las dos muestras cambia el signo del estadístico y deja igual el valor p (bilateral)
{ const Ct = L('contrastes');
  for (let i = 0; i < 100; i++) {
    const a = [entero(5, 40), entre(40, 60), entre(1, 9)], b = [entero(5, 40), entre(40, 60), entre(1, 9)];
    const f = (x, y) => Ct.resolver({ tipo: 'dosmedias', h1: 'distinto', alfa: '0,05', caso: i % 2 ? 'iguales' : 'distintas', n1: String(x[0]), xm1: coma(x[1]), s1: coma(x[2]), n2: String(y[0]), xm2: coma(y[1]), s2: coma(y[2]), d0: '0' });
    const r1 = f(a, b), r2 = f(b, a); igual(`Contrastes dos medias ${i}: estadístico`, r1.est, -r2.est, 1e-9, 1e-9); igual(`Contrastes dos medias ${i}: valor p`, r1.pv, r2.pv, 1e-9, 1e-12);
    const n1 = entero(20, 200), n2 = entero(20, 200), x1 = entero(1, n1 - 1), x2 = entero(1, n2 - 1), g = (p, q) => Ct.resolver({ tipo: 'dosprop', h1: 'distinto', alfa: '0,05', n1: String(p[0]), x1: String(p[1]), n2: String(q[0]), x2: String(q[1]) });
    igual(`Contrastes dos proporciones ${i}: estadístico`, g([n1, x1], [n2, x2]).est, -g([n2, x2], [n1, x1]).est, 1e-9, 1e-9);
  } }
// 7. Matrices: |AB| = |A||B|, |A| = producto de los autovalores, traza = suma de los autovalores, A·A⁻¹ = I
{ const M = L('matrices');
  const mat = (n) => Array.from({ length: n }, () => Array.from({ length: n }, () => String(entero(-4, 4))));
  for (let i = 0; i < 60; i++) {
    const n = 2 + (i % 3), A = mat(n), B = mat(n), d = (X) => num(M.resolver({ op: 'det', A: X }).valor);
    const AB = A.map((f) => B[0].map((_, c) => String(f.reduce((t, x, k) => t + Number(x) * Number(B[k][c]), 0))));
    igual(`Matrices |AB| = |A||B| (n=${n}) ${JSON.stringify(A)} ${JSON.stringify(B)}`, d(AB), d(A) * d(B), 1e-9, 1e-9);
    const ev = M.resolver({ op: 'propios', A }).valor; if (!ev.length) continue;
    const tot = ev.reduce((s, e) => s + (e.mult || 1) * num(e.valor.re), 0), prod = ev.reduce((p, e) => { let q = [1, 0]; for (let k = 0; k < (e.mult || 1); k++) q = [q[0] * num(e.valor.re) - q[1] * num(e.valor.im), q[0] * num(e.valor.im) + q[1] * num(e.valor.re)]; return [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]]; }, [1, 0]);
    if (ev.reduce((s, e) => s + (e.mult || 1), 0) !== n) { mal(`Matrices ${JSON.stringify(A)}: faltan autovalores`); continue; }
    igual(`Matrices traza = Σλ ${JSON.stringify(A)}`, tot, A.reduce((s, f, k) => s + Number(f[k]), 0), 1e-8, 1e-8); igual(`Matrices |A| = Πλ ${JSON.stringify(A)}`, prod[0], d(A), 1e-8, 1e-8);
  } }
// 8. Circuitos: leyes de Kirchhoff y Tellegen en redes de resistencias al azar (corriente que sale de cada nudo = 0, potencia total = 0)
{ const S = L('simulador', 'motor.js');
  for (let i = 0; i < 100; i++) {
    const n = entero(3, 6), els = [{ id: 'V1', t: 'V', p: ['1', '0'], onda: { tipo: 'cc', v: entre(1, 24) } }];
    for (let k = 1; k <= n; k++) els.push({ id: `R${k}`, t: 'R', p: [String(k), String((k % n) + 1)], R: entre(10, 5000) });
    for (let k = 0; k < entero(1, 4); k++) { const a = entero(1, n), b = entero(0, n); if (a !== b) els.push({ id: `Rc${k}`, t: 'R', p: [String(a), String(b)], R: entre(10, 5000) }); }
    els.push({ id: 'R0', t: 'R', p: ['2', '0'], R: entre(10, 5000) });
    const r = S.operacion({ elementos: els }), sal = {};
    for (const e of els) { sal[e.p[0]] = (sal[e.p[0]] || 0) + r.I[e.id].re; sal[e.p[1]] = (sal[e.p[1]] || 0) - r.I[e.id].re; }
    const esc = Math.max(...els.map((e) => Math.abs(r.I[e.id].re)), 1e-9);
    for (const [nudo, v] of Object.entries(sal)) igual(`Kirchhoff red ${i} nudo ${nudo}`, v, 0, 1, 1e-8 * esc);
    igual(`Tellegen red ${i}`, els.reduce((s, e) => s + r.P[e.id].re, 0), 0, 1, 1e-7 * Math.max(...els.map((e) => Math.abs(r.P[e.id].re)), 1e-9));
  } }
// 9. Laplace: el valor inicial de la inversa es lím s·F(s) cuando F es propia
{ const La = L('laplace');
  for (let i = 0; i < 60; i++) {
    const a = entero(1, 6), b = entero(1, 9), c = entero(1, 9), F = `(${a}s + ${b})/(s^2 + ${entero(2, 7)}s + ${c + 8})`, r = La.resolver({ modo: 'inversa', F });
    igual(`Laplace f(0) de ${F}`, r.f(0), r.lim.ini, 1e-9, 1e-9);
  } }
// 10. Combinatoria: Σ C(n,k) = 2ⁿ y C(n,k) = C(n,n−k)
{ const Pr = L('probabilidad'), C = (n, k) => Number(String(Pr.resolver({ modo: 'comb', ctipo: 'comb', n: String(n), k: String(k) }).valor).replace(/[^\d]/g, ''));
  for (let n = 1; n <= 15; n++) { let s = 1; for (let k = 1; k <= n; k++) { const c = C(n, k); s += c; if (k < n) igual(`Combinatoria C(${n},${k}) = C(${n},${n - k})`, c, C(n, n - k), 0, 0); } igual(`Combinatoria Σ C(${n},k)`, s, 2 ** n, 0, 0); } }

console.log(`Invariantes: ${hechos} comprobaciones sobre 10 leyes (Fresnel, choques, put-call, VAN-TIR, préstamos, contrastes, matrices, Kirchhoff y Tellegen, Laplace, combinatoria); ${fallos} fallos.`);
process.exit(fallos ? 1 : 0);
