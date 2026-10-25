/* =====================================================================
   Series de Taylor (sin DOM): polinomio de Taylor de grado n de f en
   x = a con las derivadas (simbólicas mientras se pueden leer) y sus
   valores exactos, los coeficientes, la aproximación de f(x₀), el error
   y la cota de Lagrange, y los desarrollos conocidos de Maclaurin con
   su término general y dónde convergen. Las expresiones las lee
   Expresion (matematicas/expresion.js).
   ===================================================================== */
const Taylor = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const { numTxt, dec4, exacto } = E;
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const FACT = [1]; for (let k = 1; k <= 40; k++) FACT[k] = FACT[k - 1] * k;
  const MAXN = 15;
  const f = (x, d = 4) => dec4(x, d);

  // un número que no depende de x: a, x₀
  function leeNum(s, nom) {
    const n = E.lee(s, nom);
    if (E.tieneX(n)) throw new Error(`${nom} no puede llevar x`);
    const v = E.valor(n, 0);
    if (!isFinite(v)) throw new Error(`${nom} no es un número`);
    return v;
  }
  // nombre de la derivada k-ésima: f, f′, f″, f^{(3)}
  const fk = (k) => (k === 0 ? 'f' : k === 1 ? 'f′' : k === 2 ? 'f″' : `f^{(${k})}`);
  // un valor exacto con su decimal si no es entero: {√3}/{2} ≈ 0,866
  function valTxt(v) {
    const e = exacto(v), t = numTxt(v);
    return e && e.s ? `${t} ≈ ${f(v, 5)}` : t;
  }

  // (x − a)^k con a escrito como en los libros: (x − 1)^2, (x + {π}/{2})^3
  function base(a) {
    if (Math.abs(a) < 1e-14) return { b: 'x', par: false };
    return { b: `(x ${a > 0 ? '−' : '+'} ${numTxt(Math.abs(a))})`, par: true };
  }
  const potTxt = (B, k) => (k === 0 ? '' : k === 1 ? B.b : `${B.b}^{${k}}`);
  // un término c (x − a)^k sin el signo: { neg, s }
  // exacto, o una potencia de un logaritmo entre k!: los de aˣ, c_k = (ln a)^k/k!
  function exactoC(c, k) {
    const e = exacto(c);
    if ((e && (e.s || e.q <= 1000)) || k < 1) return e;
    // una fracción con denominador enorme suele ser casualidad: antes se prueba con ln 2, ln 3…
    for (const b of [2, 3, 5, 10]) { const L = Math.log(b) ** k, r = exacto(c / L, 1000); if (r && !r.s) return { p: r.p, q: r.q, s: k === 1 ? `ln ${b}` : `(ln ${b})^{${k}}` }; }
    return e;
  }
  function termino(c, k, B) {
    const pw = potTxt(B, k), e = exactoC(c, k);
    if (!e) return { neg: c < 0, s: [f(Math.abs(c), 6), pw].filter(Boolean).join(' ') };
    const P = Math.abs(e.p);
    // en x = 0 la potencia va en el numerador ({x^2}/{2}); en otro punto, detrás del coeficiente ({1}/{4} (x − 4))
    // con un logaritmo la x va delante (x ln 2, no ln 2 x, que se lee ln(2x))
    if (pw && /ln/.test(e.s)) {
      const arriba = [P !== 1 ? String(P) : '', pw, e.s].filter(Boolean).join(' ');
      return { neg: e.p < 0, s: e.q === 1 ? arriba : `{${arriba}}/{${e.q}}` };
    }
    if (B.par && pw) {
      const cf = [P !== 1 || (!e.s && e.q !== 1) ? String(P) : '', e.s].filter(Boolean).join(' ');
      return { neg: e.p < 0, s: [e.q === 1 ? cf : `{${cf}}/{${e.q}}`, pw].filter(Boolean).join(' ') };
    }
    const arriba = [P !== 1 || (!e.s && !pw) ? String(P) : '', e.s, pw].filter(Boolean).join(' ');
    return { neg: e.p < 0, s: e.q === 1 ? arriba : `{${arriba}}/{${e.q}}` };
  }
  function polinomio(cs, a) {
    const B = base(a), ts = [];
    cs.forEach((c, k) => { if (Math.abs(c) > 1e-13 * Math.max(1, ...cs.map(Math.abs))) ts.push(termino(c, k, B)); });
    if (!ts.length) return '0';
    return ts.map((t, i) => (i ? `${t.neg ? '−' : '+'} ${t.s}` : `${t.neg ? '−' : ''}${t.s}`)).join(' ');
  }

  /* ---------- Desarrollos conocidos (en x = 0) ---------- */
  const alt = (k) => (k % 2 ? -1 : 1);
  const CONOCIDOS = [
    { f: 'e^{x}', c: (k) => 1 / FACT[k], gen: 'Σ_{k=0}^{∞} {x^k}/{k!}', conv: 'para todo x', R: Infinity },
    { f: 'sen x', c: (k) => (k % 2 ? alt((k - 1) / 2) / FACT[k] : 0), gen: 'Σ_{k=0}^{∞} {(−1)^k x^{2k+1}}/{(2k+1)!}', conv: 'para todo x', R: Infinity },
    { f: 'cos x', c: (k) => (k % 2 ? 0 : alt(k / 2) / FACT[k]), gen: 'Σ_{k=0}^{∞} {(−1)^k x^{2k}}/{(2k)!}', conv: 'para todo x', R: Infinity },
    { f: 'senh x', c: (k) => (k % 2 ? 1 / FACT[k] : 0), gen: 'Σ_{k=0}^{∞} {x^{2k+1}}/{(2k+1)!}', conv: 'para todo x', R: Infinity },
    { f: 'cosh x', c: (k) => (k % 2 ? 0 : 1 / FACT[k]), gen: 'Σ_{k=0}^{∞} {x^{2k}}/{(2k)!}', conv: 'para todo x', R: Infinity },
    { f: 'ln (1 + x)', c: (k) => (k ? alt(k + 1) / k : 0), gen: 'Σ_{k=1}^{∞} {(−1)^{k+1} x^k}/{k}', conv: 'para −1 < x ≤ 1', R: 1 },
    { f: '{1}/{1 − x}', c: () => 1, gen: 'Σ_{k=0}^{∞} x^k', conv: 'para |x| < 1 (serie geométrica)', R: 1 },
    { f: '{1}/{1 + x}', c: (k) => alt(k), gen: 'Σ_{k=0}^{∞} (−1)^k x^k', conv: 'para |x| < 1 (serie geométrica)', R: 1 },
    { f: 'arctg x', c: (k) => (k % 2 ? alt((k - 1) / 2) / k : 0), gen: 'Σ_{k=0}^{∞} {(−1)^k x^{2k+1}}/{2k+1}', conv: 'para −1 ≤ x ≤ 1', R: 1 },
  ];
  const binom = (al, k) => { let r = 1; for (let j = 0; j < k; j++) r *= (al - j) / (j + 1); return r; };
  function conocido(cs0) {
    const iguales = (g) => cs0.every((c, k) => Math.abs(c - g(k)) <= 1e-9 * Math.max(1, Math.abs(g(k))));
    const k = CONOCIDOS.find((q) => iguales(q.c));
    if (k) return k;
    // binomial (1 + x)^α: c₀ = 1 y c₁ = α
    if (Math.abs(cs0[0] - 1) < 1e-12 && Math.abs(cs0[1]) > 1e-12) {
      const al = cs0[1], ent = Number.isInteger(+al.toPrecision(12)) && al > 0;
      if (!ent && cs0.length > 3 && iguales((j) => binom(al, j))) return { f: `(1 + x)^{${numTxt(al)}}`, c: (j) => binom(al, j), gen: `Σ_{k=0}^{∞} binom(${numTxt(al)}, k) x^k`, conv: 'para |x| < 1 (serie binómica)', R: 1 };
    }
    return null;
  }

  function resolver(sc) {
    const ast = E.lee(sc.f, 'La función');
    if (vacio(sc.a)) throw new Error('Falta el punto a');
    const a = leeNum(sc.a, 'El punto a');
    if (vacio(sc.n)) throw new Error('Falta el grado n');
    const n = +String(sc.n).trim();
    if (!Number.isInteger(n) || n < 0 || n > MAXN) throw new Error(`El grado n tiene que ser un número entero entre 0 y ${MAXN}`);
    const hayX0 = !vacio(sc.x0), x0 = hayX0 ? leeNum(sc.x0, 'El punto x₀') : null;
    let cs;
    try { cs = [...E.serie(ast, a, n + 1)].map((c) => (Math.abs(c) < 1e-14 ? 0 : c)); } catch (e) { throw new Error(e.message.replace('x = a', `x = ${f(a)}`)); }
    const der = cs.map((c, k) => c * FACT[k]);
    const coef = cs.slice(0, n + 1);
    const P = (x, k = n) => { let s = 0; for (let j = Math.min(k, n); j >= 0; j--) s = s * (x - a) + coef[j]; return s; };
    const fv = (x) => E.valor(ast, x);
    const fTxt = E.texto(E.simp(ast)), B = base(a), Pn = `P_{${n}}`;
    const pol = polinomio(coef, a);
    const pasos = [];
    const aTxt = numTxt(a);

    pasos.push({ t: 'Fórmula de Taylor', html: `El polinomio de Taylor de grado ${n} de f en x = ${'$' + aTxt + '$'} es $${Pn}(x) = Σ_{k=0}^{${n}} {f^{(k)}(${aTxt})}/{k!} ${potTxt(B, 1)}^k$, así que hacen falta f y sus derivadas hasta la de orden ${n} en ese punto.${Math.abs(a) < 1e-14 ? ' Como a = 0, también se llama polinomio de Maclaurin.' : ''}` });

    // derivadas: escritas mientras sean cortas, y su valor en a
    const lineas = [];
    let d = ast, escrita = true;
    for (let k = 0; k <= n; k++) {
      if (k) { if (escrita && k <= 6) { try { d = E.deriva(d); } catch (e) { escrita = false; } } else escrita = false; }
      const txt = escrita ? E.texto(k ? d : E.simp(d)) : null;
      if (txt && txt.length > 90) escrita = false;
      const izq = escrita ? `$${fk(k)}(x) = ${txt}$ &ensp;⇒&ensp; ` : '';
      lineas.push(`${izq}$${fk(k)}(${aTxt}) = ${valTxt(der[k])}$`);
    }
    pasos.push({ t: `Derivadas en x = ${'$' + aTxt + '$'}`, html: lineas.join('<br>') + (escrita ? '' : '<br><small>(las derivadas más largas solo se dan en el punto)</small>') });

    pasos.push({ t: 'Coeficientes', html: coef.map((c, k) => `$c_{${k}} = {${fk(k)}(${aTxt})}/{${k}!} = ${numTxt(c)}$`).join('<br>') });
    pasos.push({ t: `Polinomio de Taylor de grado ${n}`, html: `$${Pn}(x) = ${pol}$` });

    // desarrollo conocido de Maclaurin
    let con = null;
    if (Math.abs(a) < 1e-14) {
      try { con = conocido([...E.serie(ast, 0, 14)]); } catch (e) { con = null; }
      if (con) pasos.push({ t: 'Desarrollo conocido', html: `Es el desarrollo de Maclaurin de $${con.f} = ${con.gen}$, que converge ${con.conv}.${con.R < Infinity && hayX0 && Math.abs(x0) > con.R ? ` Ojo: x₀ = ${f(x0)} está fuera, así que al subir el grado el polinomio no se acerca a f(x₀).` : ''}` });
    }

    let fx0 = null, px0 = null, err = null, cota = null, M = null, cotaNota = '';
    if (hayX0) {
      fx0 = fv(x0); px0 = P(x0);
      if (!isFinite(fx0)) throw new Error(`f no está definida en x₀ = ${f(x0)}`);
      err = Math.abs(fx0 - px0);
      const h = x0 - a, vals = coef.map((c, k) => c * h ** k);
      const sumandos = vals.filter((v) => Math.abs(v) > 1e-15).map((v, i) => (i ? `${v < 0 ? '−' : '+'} ${f(Math.abs(v), 5)}` : f(v, 5))).join(' ') || '0';
      pasos.push({ t: `Aproximación de f(${f(x0)})`, html: `$${Pn}(${f(x0, 6)}) = ${sumandos} = ${f(px0, 7)}$<br>El valor exacto es $f(${f(x0, 6)}) = ${f(fx0, 7)}$, así que el error cometido es $|f(x_0) − ${Pn}(x_0)| = ${f(err, 3)}$.` });
      // cota de Lagrange: M = máx |f^(n+1)| entre a y x₀
      if (Math.abs(h) > 1e-14) {
        let ok = true; M = 0;
        for (let i = 0; i <= 200; i++) {
          const t = a + (h * i) / 200;
          try { const s = E.serie(ast, t, n + 1); M = Math.max(M, Math.abs(s[n + 1] * FACT[n + 1])); } catch (e) { ok = false; break; }
        }
        if (ok && M < 1e-12) { cota = 0; pasos.push({ t: 'Cota del error (resto de Lagrange)', html: `La derivada de orden ${n + 1} es 0, así que el resto de Lagrange es 0: el polinomio de Taylor coincide con f.` }); }
        else if (ok && isFinite(M)) {
          cota = (M * Math.abs(h) ** (n + 1)) / FACT[n + 1];
          pasos.push({ t: 'Cota del error (resto de Lagrange)', html: `$R_{${n}}(x) = {${fk(n + 1)}(ξ)}/{${n + 1}!} ${potTxt(B, n + 1)}$, con ξ entre ${'$' + aTxt + '$'} y x. Entre a y x₀ el máximo de $|${fk(n + 1)}|$ es $M ≈ ${f(M, 4)}$, así que<br>$|R_{${n}}(${f(x0, 6)})| ≤ {M |x_0 − a|^{${n + 1}}}/{${n + 1}!} = {${f(M, 4)} · ${f(Math.abs(h), 4)}^{${n + 1}}}/{${FACT[n + 1]}} = ${f(cota, 3)}$` + (err <= cota * (1 + 1e-9) + 1e-15 ? ', y el error de verdad está por debajo.' : '.') });
        } else { cotaNota = 'La derivada siguiente no está acotada entre a y x₀ (f no es derivable en algún punto), así que no hay cota de Lagrange.'; pasos.push({ t: 'Cota del error', html: cotaNota }); }
      }
    }
    return { f: fTxt, a, n, x0, coef, der, pol, Pn, P, fv, fx0, px0, err, cota, M, conocido: con, pasos, aTxt };
  }

  const ejemplos = [
    { clave: 'exp', nombre: 'e^x en 0: aproximar √e', sc: { f: 'e^x', a: '0', n: '4', x0: '0,5' } },
    { clave: 'seno', nombre: 'sen x en 0, grado 5', sc: { f: 'sen x', a: '0', n: '5', x0: '0,5' } },
    { clave: 'coseno', nombre: 'cos x en 0: cos 0,2', sc: { f: 'cos x', a: '0', n: '4', x0: '0,2' } },
    { clave: 'ln1x', nombre: 'ln(1 + x) en 0: ln 1,1', sc: { f: 'ln(1+x)', a: '0', n: '4', x0: '0,1' } },
    { clave: 'raiz', nombre: '√x en 4: aproximar √4,1', sc: { f: '√x', a: '4', n: '2', x0: '4,1' } },
    { clave: 'lnx', nombre: 'ln x en 1, grado 3', sc: { f: 'ln x', a: '1', n: '3', x0: '1,2' } },
    { clave: 'gauss', nombre: 'e^(−x²) en 0', sc: { f: 'e^(-x^2)', a: '0', n: '4', x0: '0,3' } },
    { clave: 'arctg', nombre: 'arctg x en 0', sc: { f: 'arctg x', a: '0', n: '5', x0: '0,5' } },
    { clave: 'seno-pi6', nombre: 'sen x en π/6', sc: { f: 'sen x', a: 'π/6', n: '3', x0: '0,6' } },
    { clave: 'geometrica', nombre: '1/(1 − x): la serie geométrica', sc: { f: '1/(1-x)', a: '0', n: '5', x0: '0,1' } },
    { clave: 'binomica', nombre: '√(1 + x): serie binómica', sc: { f: '√(1+x)', a: '0', n: '3', x0: '0,2' } },
    { clave: 'tangente', nombre: 'tg x en 0', sc: { f: 'tg x', a: '0', n: '5', x0: '0,3' } },
    { clave: 'polinomio', nombre: 'Un polinomio en x = 1', sc: { f: 'x^3 - 2x + 1', a: '1', n: '3', x0: '1,5' } },
    { clave: 'producto', nombre: 'e^x sen x en 0', sc: { f: 'e^x sen x', a: '0', n: '3', x0: '0,2' } },
  ];

  return { resolver, ejemplos, conocido, polinomio, f, MAXN, CONOCIDOS };
})();
if (typeof module !== 'undefined') module.exports = Taylor;
