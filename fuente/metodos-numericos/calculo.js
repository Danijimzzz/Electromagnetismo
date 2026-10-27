/* =====================================================================
   Métodos numéricos (sin DOM): raíces de f(x) = 0 por bisección,
   Newton-Raphson (derivada simbólica con Expresion), secante y punto
   fijo x = g(x), con la tabla de iteraciones; integrales definidas por
   trapecios y Simpson; y EDO y′ = f(x, y) por Euler, Heun (Euler
   mejorado) y Runge-Kutta 4. Las expresiones las lee
   matematicas/expresion.js; formato y campos, calculadora.js; interfaz en
   metodos-numericos/app.js.
     resolver(sc)  { modo: 'biseccion' | 'newton' | 'secante' | 'puntofijo' | 'integral' | 'edo', … } → { …, filas, pasos }
   ===================================================================== */
const MetodosNumericos = (() => {
  const K = typeof Calculadora !== 'undefined' ? Calculadora : require('../calculadora.js');
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const { f } = K, vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const MODOS = { biseccion: 'Raíz por bisección', newton: 'Raíz por Newton-Raphson', secante: 'Raíz por la secante', puntofijo: 'Punto fijo x = g(x)', integral: 'Integral: trapecios y Simpson', edo: 'EDO: Euler, Heun y Runge-Kutta 4' };
  const METODOS = { euler: 'Euler', heun: 'Heun (Euler mejorado)', rk4: 'Runge-Kutta 4' };
  const n6 = (x) => f(x, 6), n8 = (x) => f(x, 9);

  // un número que puede ser una expresión sin x: 3, 1e-6, π/2, √2
  function num(sc, k, nom) {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const ex = E.lee(sc[k], nom[0].toUpperCase() + nom.slice(1));
    if (E.tieneX(ex)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} no puede llevar x`);
    const v = E.valor(ex, 0);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} no es un número`);
    return v;
  }
  // la función: árbol, texto para Mates y evaluador que avisa si no está definida
  function funcion(sc, k, nom, vars = ['x']) {
    const ex = E.lee(sc[k], nom, vars);
    const ev = vars.length > 1 ? (x, y) => E.valor(ex, x, { y }) : (x) => E.valor(ex, x);
    return { ex, tx: E.texto(ex), ev };
  }
  const definida = (v, donde) => { if (!isFinite(v)) throw new Error(`La función no está definida en ${donde}`); return v; };
  const comun = (sc) => ({ tol: K.lee(sc, 'tol', 'la tolerancia', { min: 0, minEx: true, def: 1e-6 }), nmax: K.lee(sc, 'nmax', 'el máximo de iteraciones', { min: 1, max: 500, entero: true, def: 50 }) });
  const parada = (tol) => `Se para cuando $|x_{n+1} − x_n| < ${f(tol)}$ (la tolerancia).`;

  /* ---------- Raíces ---------- */
  function biseccion(sc) {
    const F = funcion(sc, 'fx', 'La función'), { tol, nmax } = comun(sc);
    let a = num(sc, 'a', 'el extremo a'), b = num(sc, 'b', 'el extremo b');
    if (a >= b) throw new Error('El extremo a tiene que ser menor que b');
    let fa = definida(F.ev(a), `x = ${f(a)}`); const fb = definida(F.ev(b), `x = ${f(b)}`);
    if (fa * fb > 0) throw new Error(`f(a) = ${f(fa)} y f(b) = ${f(fb)} tienen el mismo signo: el intervalo no encierra un cambio de signo`);
    const a0 = a, b0 = b, filas = [];
    let c = a, fc = fa, err = b - a, conv = false;
    for (let k = 0; k < nmax; k++) {
      c = (a + b) / 2; fc = definida(F.ev(c), `x = ${f(c)}`); err = (b - a) / 2;
      filas.push({ n: k + 1, a, b, c, fc, err });
      if (fc === 0 || err < tol) { conv = true; break; }
      if (fa * fc < 0) b = c; else { a = c; fa = fc; }
    }
    const nTeor = Math.ceil(Math.log2((b0 - a0) / tol));
    const r1 = filas[0], pasos = [
      { t: 'Cambio de signo', html: `$f(x) = ${F.tx}$. En los extremos, $f(${f(a0)}) = ${n6(F.ev(a0))}$ y $f(${f(b0)}) = ${n6(fb)}$: tienen signo distinto y, si $f$ es continua, hay una raíz entre ellos (teorema de Bolzano).` },
      { t: 'Primera iteración', html: `Punto medio: $c_1 = {${f(a0)} + ${f(b0)}}/{2} = ${n6(r1.c)}$, con $f(c_1) = ${n6(r1.fc)}$. Nos quedamos con la mitad en la que $f$ cambia de signo: $[${n6(filas[1] ? filas[1].a : r1.a)}, ${n6(filas[1] ? filas[1].b : r1.b)}]$.` },
      { t: 'Iteraciones necesarias', html: `Cada paso parte el intervalo por la mitad, así que tras $n$ pasos el error es como mucho $(b − a)/2^n$. Para que baje de ${f(tol)}: $n ≥ log_2({${f(b0 - a0)}}/{${f(tol)}}) = ${f(Math.log2((b0 - a0) / tol), 4)}$, es decir, ${nTeor} iteraciones.` },
      conv ? { t: 'Resultado', html: `Tras ${filas.length} iteraciones, $x ≈ ${n8(c)}$, con un error de como mucho $${f(err)}$ y $f(x) = ${n6(fc)}$.` }
        : { t: 'Sin terminar', html: `Con ${nmax} iteraciones el error aún es ${f(err)}: sube el máximo de iteraciones o la tolerancia. De momento, $x ≈ ${n8(c)}$.` },
    ];
    return { modo: 'biseccion', F, x: c, fx: fc, err, conv, filas, a0, b0, nTeor, pasos };
  }

  // Newton, secante y punto fijo comparten el bucle: siguiente(x, xAnt) → { x1, …columnas }
  function itera(x0, x1ini, siguiente, { tol, nmax }) {
    const filas = []; let x = x0, xa = x1ini, conv = false, motivo = '';
    for (let k = 0; k < nmax; k++) {
      const r = siguiente(x, xa);
      if (r.para) { motivo = r.para; break; }
      const err = Math.abs(r.x1 - x);
      filas.push({ n: k, x, ...r, err });
      if (!isFinite(r.x1) || Math.abs(r.x1) > 1e12) { motivo = 'las iteraciones se disparan: el método diverge desde ese punto'; break; }
      xa = x; x = r.x1;
      if (err < tol) { conv = true; break; }
    }
    if (!conv && !motivo) motivo = `no converge en ${nmax} iteraciones`;
    return { filas, x, conv, motivo, err: filas.length ? filas[filas.length - 1].err : NaN };
  }
  const final = (it, F) => it.conv ? { t: 'Resultado', html: `Converge en ${it.filas.length} iteraciones: $x ≈ ${n8(it.x)}$, con $f(x) = ${n6(F.ev(it.x))}$.` }
    : { t: 'Sin converger', html: `El método se para porque ${it.motivo}. Prueba con otro punto inicial o con más iteraciones.` };

  function newton(sc) {
    const F = funcion(sc, 'fx', 'La función'), cfg = comun(sc), x0 = num(sc, 'x0', 'el punto inicial x₀');
    definida(F.ev(x0), `x₀ = ${f(x0)}`);
    const D = E.deriva(F.ex), dtx = E.texto(D), dv = (x) => E.valor(D, x);
    const it = itera(x0, null, (x) => {
      const fx = F.ev(x), dx = dv(x);
      if (!isFinite(fx) || !isFinite(dx)) return { para: `la función no está definida en x = ${f(x)}` };
      if (dx === 0) return { para: `la derivada se anula en x = ${f(x)} y la tangente no corta el eje` };
      return { fx, dx, x1: x - fx / dx };
    }, cfg);
    const r = it.filas[0], pasos = [
      { t: 'Derivada', html: `$f(x) = ${F.tx}$, así que $f′(x) = ${dtx}$.` },
      { t: 'Fórmula de Newton', html: `Se sustituye la curva por su tangente en $x_n$ y se toma el corte con el eje: $x_{n+1} = x_n − {f(x_n)}/{f′(x_n)}$. ${parada(cfg.tol)}` },
      ...(r ? [{ t: 'Primera iteración', html: `$x_1 = ${n6(x0)} − {${n6(r.fx)}}/{${n6(r.dx)}} = ${n8(r.x1)}$` }] : []),
      final(it, F),
    ];
    if (it.conv && it.filas.length > 2) pasos.push({ t: 'Convergencia cuadrática', html: `Cerca de una raíz simple, el número de cifras correctas se duplica más o menos en cada paso: los errores van ${it.filas.filter((q) => q.err > 0).slice(-3).map((q) => f(q.err, 2)).join(', ')}.` });
    return { modo: 'newton', F, dtx, x0, ...it, fx: F.ev(it.x), pasos };
  }

  function secante(sc) {
    const F = funcion(sc, 'fx', 'La función'), cfg = comun(sc), x0 = num(sc, 'x0', 'el punto x₀'), x1 = num(sc, 'x1', 'el punto x₁');
    if (x0 === x1) throw new Error('x₀ y x₁ tienen que ser distintos');
    definida(F.ev(x0), `x₀ = ${f(x0)}`); definida(F.ev(x1), `x₁ = ${f(x1)}`);
    // la tabla empieza en x₁, con x₀ como punto anterior
    const it = itera(x1, x0, (x, xa) => {
      const fx = F.ev(x), fa = F.ev(xa);
      if (!isFinite(fx) || !isFinite(fa)) return { para: `la función no está definida en x = ${f(isFinite(fx) ? xa : x)}` };
      if (fx === fa) return { para: `f(xₙ) = f(xₙ₋₁) y la secante es horizontal` };
      return { xa, fx, x1: x - (fx * (x - xa)) / (fx - fa) };
    }, cfg);
    it.filas.forEach((q) => { q.n += 1; });
    const r = it.filas[0], pasos = [
      { t: 'Fórmula de la secante', html: `$f(x) = ${F.tx}$. Como Newton, pero la derivada se cambia por la pendiente de la recta que pasa por los dos últimos puntos: $x_{n+1} = x_n − f(x_n) {x_n − x_{n−1}}/{f(x_n) − f(x_{n−1})}$. No hace falta derivar. ${parada(cfg.tol)}` },
      ...(r ? [{ t: 'Primera iteración', html: `Con $x_0 = ${n6(x0)}$ y $x_1 = ${n6(x1)}$: $f(x_0) = ${n6(F.ev(x0))}$, $f(x_1) = ${n6(r.fx)}$ y $x_2 = ${n6(x1)} − ${n6(r.fx)} · {${n6(x1 - x0)}}/{${n6(r.fx - F.ev(x0))}} = ${n8(r.x1)}$` }] : []),
      final(it, F),
    ];
    return { modo: 'secante', F, x0, x1, ...it, fx: F.ev(it.x), pasos };
  }

  function puntofijo(sc) {
    const G = funcion(sc, 'gx', 'La función g'), cfg = comun(sc), x0 = num(sc, 'x0', 'el punto inicial x₀');
    definida(G.ev(x0), `x₀ = ${f(x0)}`);
    const it = itera(x0, null, (x) => { const g = G.ev(x); return isFinite(g) ? { g, x1: g } : { para: `g no está definida en x = ${f(x)}` }; }, cfg);
    const D = E.deriva(G.ex), dg = E.valor(D, it.x), r = it.filas[0];
    const F = { ev: (x) => G.ev(x) - x };
    const pasos = [
      { t: 'Iteración', html: `Se escribe la ecuación como $x = g(x)$, con $g(x) = ${G.tx}$, y se itera $x_{n+1} = g(x_n)$ desde $x_0 = ${n6(x0)}$. ${parada(cfg.tol)}` },
      ...(r ? [{ t: 'Primera iteración', html: `$x_1 = g(${n6(x0)}) = ${n8(r.x1)}$` }] : []),
      it.conv ? { t: 'Resultado', html: `Converge en ${it.filas.length} iteraciones: $x ≈ ${n8(it.x)}$, y $g(x) − x = ${n6(F.ev(it.x))}$.` } : final(it, F),
      { t: 'Criterio de convergencia', html: `$g′(x) = ${E.texto(D)}$, que en el punto vale $g′(${n6(it.x)}) = ${n6(dg)}$. ${Math.abs(dg) < 1 ? `Como $|g′| < 1$, el punto fijo atrae las iteraciones; cuanto más cerca de 0, más rápido (aquí el error se multiplica por unos ${f(Math.abs(dg), 3)} en cada paso).` : 'Como $|g′| ≥ 1$, el punto fijo repele las iteraciones: hay que despejar x de otra forma.'}` },
    ];
    return { modo: 'puntofijo', G, F, x0, ...it, dg, pasos };
  }

  /* ---------- Integrales ---------- */
  function simpson(ev, a, b, n) { const h = (b - a) / n; let s = ev(a) + ev(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * ev(a + i * h); return (s * h) / 3; }
  function integral(sc) {
    const F = funcion(sc, 'fx', 'La función'), a = num(sc, 'a', 'el límite a'), b = num(sc, 'b', 'el límite b');
    const n = K.lee(sc, 'n', 'el número de subintervalos', { min: 1, max: 1000, entero: true });
    if (a === b) throw new Error('Los límites a y b tienen que ser distintos');
    const h = (b - a) / n, filas = [];
    for (let i = 0; i <= n; i++) { const x = a + i * h, y = definida(F.ev(x), `x = ${f(x)}`); filas.push({ i, x, y, wt: i === 0 || i === n ? 1 : 2, ws: i === 0 || i === n ? 1 : i % 2 ? 4 : 2 }); }
    const T = (h / 2) * filas.reduce((s, q) => s + q.wt * q.y, 0), par = n % 2 === 0, S = par ? (h / 3) * filas.reduce((s, q) => s + q.ws * q.y, 0) : NaN;
    // referencia: Simpson con muchos subintervalos
    let ref = NaN; try { ref = simpson((x) => definida(F.ev(x), `x = ${f(x)}`), a, b, 20000); } catch (e) { /* sin referencia */ }
    const ext = (q) => `${n6(q.y)}`, med = filas.slice(1, -1);
    const sumaT = med.reduce((s, q) => s + q.y, 0), impar = med.filter((q) => q.i % 2).reduce((s, q) => s + q.y, 0), parS = med.filter((q) => !(q.i % 2)).reduce((s, q) => s + q.y, 0);
    const pasos = [
      { t: 'Paso', html: `$f(x) = ${F.tx}$ en $[${f(a)}, ${f(b)}]$ con $n = ${n}$ subintervalos: $h = {b − a}/{n} = {${f(b - a)}}/{${n}} = ${n6(h)}$. Los nodos son $x_i = a + i h$ y sus valores están en la tabla.` },
      { t: 'Regla de los trapecios', html: `Se une cada par de nodos con una recta: $T = h/2 [f(x_0) + 2 Σ f(x_i) + f(x_n)]$, que aquí da $T = {${n6(h)}}/{2} [${ext(filas[0])} + 2 · ${n6(sumaT)} + ${ext(filas[n])}] = ${n8(T)}$` },
      par ? { t: 'Regla de Simpson', html: `Se pasa una parábola por cada tres nodos (pesos 1, 4, 2, 4, …, 4, 1): $S = h/3 [f(x_0) + 4 Σ_{"impares"} f(x_i) + 2 Σ_{"pares"} f(x_i) + f(x_n)]$, que aquí da $S = {${n6(h)}}/{3} [${ext(filas[0])} + 4 · ${n6(impar)} + 2 · ${n6(parS)} + ${ext(filas[n])}] = ${n8(S)}$` }
        : { t: 'Regla de Simpson', html: `Simpson necesita un número par de subintervalos (va de dos en dos) y aquí $n = ${n}$: pon un $n$ par para verla.` },
    ];
    if (isFinite(ref)) pasos.push({ t: 'Error', html: `Con 20 000 subintervalos, $∫ f(x) dx ≈ ${n8(ref)}$. Error de los trapecios: ${f(Math.abs(T - ref), 3)}${par ? `; de Simpson: ${f(Math.abs(S - ref), 3)}` : ''}. Al doblar $n$, el de los trapecios se divide más o menos entre 4 (va con $h^2$) y el de Simpson entre 16 (va con $h^4$).` });
    return { modo: 'integral', F, a, b, n, h, filas, T, S, par, ref, pasos };
  }

  /* ---------- EDO y′ = f(x, y) ---------- */
  const PASO = {
    euler: (F, x, y, h) => { const k1 = F(x, y); return { k: [k1], y1: y + h * k1 }; },
    heun: (F, x, y, h) => { const k1 = F(x, y), k2 = F(x + h, y + h * k1); return { k: [k1, k2], y1: y + (h / 2) * (k1 + k2) }; },
    rk4: (F, x, y, h) => { const k1 = F(x, y), k2 = F(x + h / 2, y + (h / 2) * k1), k3 = F(x + h / 2, y + (h / 2) * k2), k4 = F(x + h, y + h * k3); return { k: [k1, k2, k3, k4], y1: y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4) }; },
  };
  function edo(sc) {
    const F = funcion(sc, 'fxy', 'La función f(x, y)', ['x', 'y']), x0 = num(sc, 'x0', 'x₀'), y0 = num(sc, 'y0', 'y₀'), h = num(sc, 'h', 'el paso h'), xf = num(sc, 'xf', 'el punto final');
    if (!(h > 0)) throw new Error('El paso h tiene que ser positivo');
    if (xf <= x0) throw new Error('El punto final tiene que ser mayor que x₀');
    const N = Math.round((xf - x0) / h);
    if (Math.abs(N * h - (xf - x0)) > 1e-9 * Math.max(1, Math.abs(xf - x0))) throw new Error(`El paso h = ${f(h)} no cabe un número entero de veces entre x₀ y el punto final`);
    if (N > 2000) throw new Error('Son más de 2000 pasos: usa un paso h mayor');
    const met = METODOS[sc.metodo] ? sc.metodo : 'rk4';
    const ex = vacio(sc.exacta) ? null : funcion(sc, 'exacta', 'La solución exacta');
    const Fd = (x, y) => definida(F.ev(x, y), `(x, y) = (${f(x)}, ${f(y)})`);
    const ys = {}; for (const m of Object.keys(PASO)) { let y = y0; ys[m] = [y0]; for (let i = 0; i < N; i++) { y = PASO[m](Fd, x0 + i * h, y, h).y1; ys[m].push(y); } }
    const filas = ys.euler.map((_, i) => ({ i, x: x0 + i * h, euler: ys.euler[i], heun: ys.heun[i], rk4: ys.rk4[i], ex: ex ? ex.ev(x0 + i * h) : NaN }));
    const p1 = PASO[met](Fd, x0, y0, h), k = p1.k.map(n6), yN = ys[met][N], yex = ex ? ex.ev(xf) : NaN;
    const formula = {
      euler: `$y_{n+1} = y_n + h f(x_n, y_n)$: se avanza por la tangente.`,
      heun: `$k_1 = f(x_n, y_n)$, $k_2 = f(x_n + h, y_n + h k_1)$ y $y_{n+1} = y_n + h/2 (k_1 + k_2)$: la media de la pendiente al principio y al final.`,
      rk4: `$k_1 = f(x_n, y_n)$, $k_2 = f(x_n + h/2, y_n + h/2 k_1)$, $k_3 = f(x_n + h/2, y_n + h/2 k_2)$, $k_4 = f(x_n + h, y_n + h k_3)$ y $y_{n+1} = y_n + h/6 (k_1 + 2 k_2 + 2 k_3 + k_4)$.`,
    }[met];
    const primero = {
      euler: `$y_1 = ${n6(y0)} + ${n6(h)} · ${k[0]} = ${n8(p1.y1)}$`,
      heun: `$k_1 = ${k[0]}$, $k_2 = ${k[1]}$; $y_1 = ${n6(y0)} + {${n6(h)}}/{2} (${k[0]} + ${k[1]}) = ${n8(p1.y1)}$`,
      rk4: `$k_1 = ${k[0]}$, $k_2 = ${k[1]}$, $k_3 = ${k[2]}$, $k_4 = ${k[3]}$; $y_1 = ${n6(y0)} + {${n6(h)}}/{6} (${k[0]} + 2 · ${k[1]} + 2 · ${k[2]} + ${k[3]}) = ${n8(p1.y1)}$`,
    }[met];
    const pasos = [
      { t: 'Problema', html: `$y′ = ${F.tx}$, con $y(${f(x0)}) = ${f(y0)}$, paso $h = ${f(h)}$ hasta $x = ${f(xf)}$: ${N} pasos.` },
      { t: `Método de ${METODOS[met]}`, html: formula },
      { t: 'Primer paso', html: `En $x_0 = ${f(x0)}$: ${primero}, en $x_1 = ${n6(x0 + h)}$.` },
      { t: 'Resultado', html: `Repitiendo ${N} veces, $y(${f(xf)}) ≈ ${n8(yN)}$.${ex ? ` La solución exacta, $y = ${ex.tx}$, da $${n8(yex)}$: error ${f(Math.abs(yN - yex), 3)}.` : ''}` },
      { t: 'Los tres métodos', html: `Euler: ${n8(ys.euler[N])}; Heun: ${n8(ys.heun[N])}; Runge-Kutta 4: ${n8(ys.rk4[N])}.${ex ? ` Errores: ${f(Math.abs(ys.euler[N] - yex), 3)}, ${f(Math.abs(ys.heun[N] - yex), 3)} y ${f(Math.abs(ys.rk4[N] - yex), 3)}.` : ''} Al partir $h$ por la mitad, el error de Euler se divide más o menos entre 2 (orden 1), el de Heun entre 4 (orden 2) y el de Runge-Kutta 4 entre 16 (orden 4).` },
    ];
    return { modo: 'edo', F, ex, met, x0, y0, h, xf, N, ys, filas, y: yN, yex, pasos };
  }

  const R = { biseccion, newton, secante, puntofijo, integral, edo };
  const resolver = (sc) => (R[sc.modo] || biseccion)(sc);

  const ejemplos = [
    { clave: 'biseccion', nombre: 'Bisección: x³ − 2x − 5 = 0 en [2, 3]', sc: { modo: 'biseccion', fx: 'x^3 - 2x - 5', a: '2', b: '3', tol: '1e-4', nmax: '50' } },
    { clave: 'newton', nombre: 'Newton: x³ − 2x − 5 = 0 desde x₀ = 2', sc: { modo: 'newton', fx: 'x^3 - 2x - 5', x0: '2', tol: '1e-10', nmax: '50' } },
    { clave: 'coseno', nombre: 'Newton: cos x = x', sc: { modo: 'newton', fx: 'cos x - x', x0: '1', tol: '1e-10', nmax: '50' } },
    { clave: 'raiz2', nombre: 'Secante: √2 como raíz de x² − 2', sc: { modo: 'secante', fx: 'x^2 - 2', x0: '1', x1: '2', tol: '1e-10', nmax: '50' } },
    { clave: 'puntofijo', nombre: 'Punto fijo: x = cos x', sc: { modo: 'puntofijo', gx: 'cos x', x0: '1', tol: '1e-6', nmax: '100' } },
    { clave: 'gauss', nombre: 'Integral de e^(−x²) entre 0 y 1', sc: { modo: 'integral', fx: 'e^(-x^2)', a: '0', b: '1', n: '10' } },
    { clave: 'seno', nombre: 'Integral de sen x entre 0 y π con 4 trozos', sc: { modo: 'integral', fx: 'sen x', a: '0', b: 'pi', n: '4' } },
    { clave: 'exponencial', nombre: 'EDO y′ = y, y(0) = 1, con h = 0,1', sc: { modo: 'edo', fxy: 'y', x0: '0', y0: '1', h: '0,1', xf: '1', metodo: 'euler', exacta: 'e^x' } },
    { clave: 'lineal', nombre: 'EDO y′ = x − y, y(0) = 1, con Runge-Kutta 4', sc: { modo: 'edo', fxy: 'x - y', x0: '0', y0: '1', h: '0,2', xf: '2', metodo: 'rk4', exacta: 'x - 1 + 2e^(-x)' } },
  ];

  return { resolver, ejemplos, MODOS, METODOS, f };
})();
if (typeof module !== 'undefined') module.exports = MetodosNumericos;
