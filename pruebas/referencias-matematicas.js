/* ===== Matemáticas contra sympy (F14.2) =====
   Compara las herramientas de Matemáticas con pruebas/referencias/matematicas.json (lo escribe matematicas.py con sympy).
   Lo llama pruebas/referencias.js. Lo que una herramienta no resuelve («no sale») se cuenta, no falla; lo que da, tiene que coincidir. */
module.exports = ({ fs, path, raiz, mal }) => {
  const R = JSON.parse(fs.readFileSync(path.join(raiz, 'pruebas', 'referencias', 'matematicas.json'), 'utf8'));
  const F = (c) => path.join(raiz, 'fuente', c);
  global.Expr = global.Expr || require(F('matematicas/expresion.js')); global.Algebra = global.Algebra || require(F('matematicas/algebra.js'));
  const Der = require(F('derivadas/calculo.js')), Ser = require(F('series/calculo.js')), Mat = require(F('matrices/calculo.js')), Edo = require(F('edos/calculo.js')), Tay = require(F('taylor/calculo.js')), Lap = require(F('laplace/calculo.js'));
  const cerca = (a, b, rel = 1e-6, abs = 1e-9) => Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));
  const num = (v) => (typeof v === 'number' ? v : typeof v === 'bigint' ? Number(v) : v.re !== undefined ? num(v.re) : Number(v.n) / Number(v.d));
  const sin = {}; const nota = (k) => { sin[k] = (sin[k] || 0) + 1; };
  const prueba = (k, texto, fn) => { try { fn(); } catch (e) { mal(`Referencia sympy · ${k} ${texto}: ${e.message}`); } };
  const cuenta = {};

  // integrales: F(b) − F(a) frente a la integral definida de sympy
  for (const c of R.integrales) prueba('∫', c.f, () => {
    const r = Der.integral({ f: c.f }); if (!r.F) { nota('integrales'); return; }
    cuenta.integrales = (cuenta.integrales || 0) + 1;
    const v = r.Ff(c.b) - r.Ff(c.a); if (!cerca(v, c.v, 1e-6, 1e-8)) mal(`Referencia sympy · ∫ ${c.f} de ${c.a} a ${c.b}: la herramienta da ${v} y sympy ${c.v}`);
  });
  for (const c of R.limites) prueba('límite', c.f, () => {
    const r = Der.limite({ f: c.f, a: c.a }); if (!r.existe || !isFinite(r.val)) { nota('limites'); mal(`Referencia sympy · límite de ${c.f} en ${c.a}: la herramienta dice «${r.txt}» y sympy ${c.v}`); return; }
    cuenta.limites = (cuenta.limites || 0) + 1; if (!cerca(r.val, c.v, 1e-5, 1e-7)) mal(`Referencia sympy · límite de ${c.f} en ${c.a}: ${r.val} frente a ${c.v}`);
  });
  for (const c of R.series) prueba('serie', c.an, () => {
    const r = Ser.resolver({ an: c.an, n0: String(c.n0) }); if (r.suma === undefined || r.suma === null || !isFinite(r.suma)) { nota('series'); return; }
    cuenta.series = (cuenta.series || 0) + 1; const tol = Math.max(1e-6, 4 * (r.sumaError || 0));
    if (Math.abs(r.suma - c.v) > Math.max(tol, 1e-6 * Math.abs(c.v))) mal(`Referencia sympy · Σ ${c.an} desde ${c.n0}: ${r.suma} frente a ${c.v}`);
  });
  for (const c of R.autovalores) prueba('autovalores', JSON.stringify(c.A), () => {
    const r = Mat.resolver({ op: 'propios', A: c.A.map((f) => f.map(String)) });
    const mine = r.valor.flatMap((e) => Array(e.mult || 1).fill([num(e.valor.re), num(e.valor.im)])).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const ref = c.ev.flatMap(([re, im, m]) => Array(m).fill([re, im])).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    cuenta.autovalores = (cuenta.autovalores || 0) + 1;
    if (mine.length !== ref.length || mine.some((v, i) => !cerca(v[0], ref[i][0], 1e-8, 1e-8) || !cerca(v[1], ref[i][1], 1e-8, 1e-8))) mal(`Referencia sympy · autovalores de ${JSON.stringify(c.A)}: ${JSON.stringify(mine)} frente a ${JSON.stringify(ref)}`);
    const d = Mat.resolver({ op: 'det', A: c.A.map((f) => f.map(String)) }); if (!cerca(num(d.valor), c.det, 1e-9, 1e-9)) mal(`Referencia sympy · |A| de ${JSON.stringify(c.A)}: ${num(d.valor)} frente a ${c.det}`);
    const rg = Mat.resolver({ op: 'rango', A: c.A.map((f) => f.map(String)) }); const rv = rg.valor; if (num(rv) !== c.rango) mal(`Referencia sympy · rango de ${JSON.stringify(c.A)}: ${rv} frente a ${c.rango}`);
  });
  const c1 = (x) => String(x).replace('.', ',');
  for (const c of R.edos1) prueba('EDO', c.f, () => {
    const r = Edo.resolver({ modo: 'primer', f: c.f, x0: c1(c.x0), y0: c1(c.y0), x1: c1(c.x1), h: '0,005' });
    const v = r.yEx !== undefined && r.yEx !== null ? r.yEx : r.yRK; if (v === undefined || !isFinite(v)) { nota('edos1'); return; }
    cuenta.edos1 = (cuenta.edos1 || 0) + 1; if (!cerca(v, c.v, 1e-5, 1e-7)) mal(`Referencia sympy · y′ = ${c.f}, y(${c.x0}) = ${c.y0}, y(${c.x1}): ${v} frente a ${c.v}`);
  });
  for (const c of R.edos2) prueba('EDO 2.º', JSON.stringify(c), () => {
    const r = Edo.resolver({ modo: 'segundo', a: c1(c.a), b: c1(c.b), c: c1(c.c), g: '0', x0: c1(c.x0), y0: c1(c.y0), v0: c1(c.v0), x1: c1(c.x1) });
    const v = r.y && typeof r.y === 'function' ? r.y(c.x1) : r.y1; if (v === undefined || !isFinite(v)) { nota('edos2'); return; }
    cuenta.edos2 = (cuenta.edos2 || 0) + 1; if (!cerca(v, c.v, 1e-6, 1e-8)) mal(`Referencia sympy · ${c.a}y″ + ${c.b}y′ + ${c.c}y = 0: y(${c.x1}) = ${v} frente a ${c.v}`);
  });
  for (const c of R.taylor) prueba('Taylor', c.f, () => {
    const r = Tay.resolver({ f: c.f, a: String(c.a), n: String(c.n), x0: String(c.a) });
    cuenta.taylor = (cuenta.taylor || 0) + 1;
    c.coef.forEach((v, k) => { if (!cerca(r.coef[k], v, 1e-9, 1e-12)) mal(`Referencia sympy · Taylor de ${c.f} en ${c.a}: coeficiente ${k} = ${r.coef[k]} frente a ${v}`); });
  });
  const evalF = (F, s) => F.n.reduceRight((q, k) => q * s + k, 0) / F.d.reduceRight((q, k) => q * s + k, 0);
  for (const c of R.laplace) prueba('Laplace', c.f, () => {
    const r = Lap.resolver({ modo: 'directa', f: c.f }); cuenta.laplace = (cuenta.laplace || 0) + 1;
    for (const p of c.pts) { const v = evalF(r.F, p.s); if (!cerca(v, p.v, 1e-9, 1e-12)) mal(`Referencia sympy · L{${c.f}}(${p.s}): ${v} frente a ${p.v}`); }
  });
  for (const c of R.laplace_inv) prueba('Laplace⁻¹', c.F, () => {
    const r = Lap.resolver({ modo: 'inversa', F: c.F }); cuenta.laplace_inv = (cuenta.laplace_inv || 0) + 1;
    for (const p of c.pts) { const v = r.f(p.t); if (!cerca(v, p.v, 1e-8, 1e-10)) mal(`Referencia sympy · L⁻¹{${c.F}}(${p.t}): ${v} frente a ${p.v}`); }
  });
  const total = Object.values(cuenta).reduce((a, b) => a + b, 0);
  console.log(`Referencias de Matemáticas: ${total} resultados contrastados con sympy ${R.versiones.sympy} (${Object.entries(cuenta).map(([k, v]) => `${k} ${v}`).join(', ')})${Object.keys(sin).length ? `; sin resolver la herramienta: ${Object.entries(sin).map(([k, v]) => `${k} ${v}`).join(', ')}` : ''}.`);
};
