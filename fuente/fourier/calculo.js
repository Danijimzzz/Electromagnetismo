/* =====================================================================
   Series de Fourier (sin DOM): una función periódica dada por tramos en
   un periodo (o en [0, L] con su extensión par o impar) y su serie
   f(x) ≈ a₀/2 + Σ (aₙ cos nω₀x + bₙ sen nω₀x). Los coeficientes salen
   de integrar numéricamente con mucha precisión; si siguen una ley
   (A + B(−1)ⁿ)/(nᵏ πᵐ) se da el término general como en clase. También
   la paridad, los saltos (fenómeno de Gibbs), la suma parcial en x₀ y la
   igualdad de Parseval. Las expresiones las lee Expresion.
   ===================================================================== */
const Fourier = (() => {
  const E = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const PI = Math.PI, vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const f = (x, d = 4) => E.dec4(Math.abs(x) < 1e-12 ? 0 : x, d);
  const MAXN = 100, NPAT = 14;

  // número exacto con potencias de π: {2}/{3 π}, {π^2}/{3}
  function exacto(v) {
    if (Math.abs(v) < 1e-11) return { p: 0, q: 1, k: 0 };
    for (const k of [0, 1, -1, 2, -2, 3, -3]) { const r = E.fraccion(v / PI ** k, 5000); if (r && Math.abs(r[0]) < 1e6) return { p: r[0], q: r[1], k }; }
    return null;
  }
  const piK = (k) => (Math.abs(k) === 1 ? 'π' : `π^{${Math.abs(k)}}`);
  function numF(v, d = 5) {
    const e = exacto(v);
    if (!e) return f(v, d);
    const sg = e.p < 0 ? '−' : '', P = Math.abs(e.p);
    const arriba = e.k > 0 ? (P === 1 ? piK(e.k) : `${P} ${piK(e.k)}`) : String(P), abajo = [e.q !== 1 ? e.q : '', e.k < 0 ? piK(e.k) : ''].filter(Boolean).join(' ');
    return sg + (abajo ? `{${arriba}}/{${abajo}}` : arriba);
  }
  const conDec = (v) => { const e = exacto(v); return e && (e.k || e.q !== 1) ? `${numF(v)} ≈ ${f(v, 5)}` : numF(v); };

  /* ---------- Ley de los coeficientes ---------- */
  // c_n = (A + B(−1)^n) / (n^k π^m) con A y B racionales, comprobado hasta n = NPAT
  function ley(cs) {
    const esc = Math.max(1e-12, ...cs.slice(1).map(Math.abs));
    if (cs.slice(1).every((c) => Math.abs(c) < 1e-9 * Math.max(1, esc))) return { cero: true };
    for (const m of [0, 1, 2, 3]) for (const k of [0, 1, 2, 3, 4]) {
      const g = (n) => cs[n] * n ** k * PI ** m, A = (g(1) + g(2)) / 2, B = (g(2) - g(1)) / 2;
      const ok = cs.slice(1).every((c, i) => { const n = i + 1; return Math.abs(c - (A + B * (n % 2 ? -1 : 1)) / (n ** k * PI ** m)) <= 1e-8 * esc; });
      if (!ok) continue;
      const fa = Math.abs(A) < 1e-10 ? [0, 1] : E.fraccion(A, 2000), fb = Math.abs(B) < 1e-10 ? [0, 1] : E.fraccion(B, 2000);
      if (!fa || !fb) continue;
      return { k, m, A: fa, B: fb };
    }
    return null;
  }
  // texto Mates del término general
  function leyTxt(L) {
    const [pa, qa] = L.A, [pb, qb] = L.B, q = (qa * qb) / gcd(qa, qb), a = (pa * q) / qa, b = (pb * q) / qb;
    let arriba, sg = '';
    const g = gcd(Math.abs(a), Math.abs(b)) || 1;
    if (!b) { arriba = String(Math.abs(a)); sg = a < 0 ? '−' : ''; }
    else if (!a) { arriba = `${Math.abs(b) === 1 ? '' : Math.abs(b) + ' '}(−1)^{${b < 0 ? 'n+1' : 'n'}}`; }
    else if (a === -b) { arriba = g === 1 ? '1 − (−1)^n' : `${g} (1 − (−1)^n)`; sg = a < 0 ? '−' : ''; }
    else if (a === b) { arriba = g === 1 ? '1 + (−1)^n' : `${g} (1 + (−1)^n)`; sg = a < 0 ? '−' : ''; }
    else arriba = `${a} ${b < 0 ? '−' : '+'} ${Math.abs(b)} (−1)^n`;
    const abajo = [q !== 1 ? String(q) : '', L.k ? (L.k === 1 ? 'n' : `n^{${L.k}}`) : '', L.m ? piK(L.m) : ''].filter(Boolean).join(' ');
    return sg + (abajo ? `{${arriba}}/{${abajo}}` : arriba);
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }

  /* ---------- Integración (Gauss-Legendre de 8 puntos por trozos) ---------- */
  const GX = [-0.9602898564975363, -0.7966664774136267, -0.5255324099163290, -0.1834346424956498, 0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363];
  const GW = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620, 0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
  function nodos(segs, sub = 128) {
    const xs = [], ws = [];
    for (const s of segs) {
      const h = (s.v - s.u) / sub;
      for (let i = 0; i < sub; i++) {
        const c = s.u + (i + 0.5) * h;
        for (let j = 0; j < 8; j++) {
          const x = c + (GX[j] * h) / 2, y = s.fn(x);
          if (!isFinite(y)) throw new Error(`f no está definida en x = ${f(x, 3)}: revisa ese tramo`);
          xs.push(x); ws.push((GW[j] * h * y) / 2);
        }
      }
    }
    return { xs, ws };
  }

  // la x de nω₀x: n x, 2n x, {n π x}/{2}…
  function argumento(T) {
    const w = (2 * PI) / T, r = E.fraccion(w, 1000);
    if (r) return r[1] === 1 ? (r[0] === 1 ? 'n x' : `${r[0]} n x`) : `{${r[0] === 1 ? '' : r[0] + ' '}n x}/{${r[1]}}`;
    const s = E.fraccion(w / PI, 1000);
    if (s) return s[1] === 1 ? (s[0] === 1 ? 'n π x' : `${s[0]} n π x`) : `{${s[0] === 1 ? '' : s[0] + ' '}n π x}/{${s[1]}}`;
    return `${f(w)} n x`;
  }
  const conN = (arg, n) => arg.replace(/(^|[{ ])n /, (_, a) => `${a}${n} `).replace(/^1 (?=[xπ])/, '').replace(/\{1 /, '{');

  function resolver(sc) {
    const ext = sc.ext || 'periodica';
    const tr = (sc.tramos || []).filter((t) => !vacio(t.f) || !vacio(t.a) || !vacio(t.b));
    if (!tr.length) throw new Error('Falta la función: escribe al menos un tramo');
    const leeN = (s, nom) => { const n = E.lee(s, nom); if (E.tieneX(n)) throw new Error(`${nom} no puede llevar x`); const v = E.valor(n, 0); if (!isFinite(v)) throw new Error(`${nom} no es un número`); return v; };
    const tramos = tr.map((t, i) => {
      const nom = tr.length > 1 ? ` del tramo ${i + 1}` : '';
      if (vacio(t.f)) throw new Error(`Falta la función${nom}`);
      if (vacio(t.a) || vacio(t.b)) throw new Error(`Faltan los extremos${nom}`);
      const ast = E.lee(t.f, `La función${nom}`);
      const a = leeN(t.a, `El extremo izquierdo${nom}`), b = leeN(t.b, `El extremo derecho${nom}`);
      if (!(b > a)) throw new Error(`El tramo ${i + 1} tiene que ir de menos a más (a < b)`);
      return { ast, a, b, txt: E.texto(E.simp(ast)), fn: (x) => E.valor(ast, x) };
    });
    // ¿es integrable? ∫|f| con Gauss cada vez más fino: si converge, las diferencias se van reduciendo;
    // si f se va a infinito sin ser integrable (1/x cerca de 0), siguen creciendo lo mismo
    tramos.forEach((t, i) => {
      const I = (sub) => { let s = 0; const h = (t.b - t.a) / sub; for (let k = 0; k < sub; k++) for (let j = 0; j < 8; j++) s += (GW[j] * h * Math.abs(t.fn(t.a + (k + 0.5) * h + (GX[j] * h) / 2))) / 2; return s; };
      const i1 = I(64), i2 = I(256), i3 = I(1024);
      if (isFinite(i3) && i3 - i2 > 0.01 * Math.max(1, i3) && i3 - i2 > 0.75 * (i2 - i1)) throw new Error(`La función${tramos.length > 1 ? ` del tramo ${i + 1}` : ''} se va a infinito y su integral no existe: no tiene serie de Fourier`);
    });
    for (let i = 1; i < tramos.length; i++) if (Math.abs(tramos[i].a - tramos[i - 1].b) > 1e-9 * Math.max(1, Math.abs(tramos[i].a))) throw new Error(`El tramo ${i + 1} tiene que empezar donde acaba el ${i} (${f(tramos[i - 1].b)})`);
    const a0x = tramos[0].a, b0x = tramos[tramos.length - 1].b;
    if (ext !== 'periodica' && Math.abs(a0x) > 1e-12) throw new Error('Para la extensión par o impar la función se da en [0, L]: el primer tramo tiene que empezar en 0');
    const N = vacio(sc.N) ? 10 : +String(sc.N).trim();
    if (!Number.isInteger(N) || N < 1 || N > MAXN) throw new Error(`El número de armónicos N tiene que ser un entero entre 1 y ${MAXN}`);

    // los trozos de un periodo [s, s + T)
    const segs = [];
    if (ext === 'periodica') tramos.forEach((t) => segs.push({ u: t.a, v: t.b, fn: t.fn, t }));
    else {
      const sg = ext === 'par' ? 1 : -1;
      [...tramos].reverse().forEach((t) => segs.push({ u: -t.b, v: -t.a, fn: (x) => sg * t.fn(-x), t, refl: true }));
      tramos.forEach((t) => segs.push({ u: t.a, v: t.b, fn: t.fn, t }));
    }
    const s0 = segs[0].u, T = segs[segs.length - 1].v - s0, L = T / 2, w0 = (2 * PI) / T;
    const fper = (x) => {
      let y = x - s0 - T * Math.floor((x - s0) / T);
      if (y >= T) y -= T;
      const xx = s0 + y, sgm = segs.find((s) => xx >= s.u && xx < s.v) || segs[segs.length - 1];
      return sgm.fn(xx);
    };

    // coeficientes
    const { xs, ws } = nodos(segs), nmax = Math.max(N, NPAT);
    const an = [], bn = [];
    for (let n = 0; n <= nmax; n++) {
      let sa = 0, sb = 0;
      for (let i = 0; i < xs.length; i++) { const t = n * w0 * xs[i]; sa += ws[i] * Math.cos(t); sb += ws[i] * Math.sin(t); }
      an.push((2 / T) * sa); bn.push((2 / T) * sb);
    }
    const esc = Math.max(1e-12, ...an.map(Math.abs), ...bn.map(Math.abs));
    const limpia = (c) => { if (Math.abs(c) < 1e-10 * esc) return 0; const e = exacto(c); return e ? (e.p / e.q) * PI ** e.k : c; };
    for (let n = 0; n <= nmax; n++) { an[n] = limpia(an[n]); bn[n] = limpia(bn[n]); }
    const par = bn.every((c) => c === 0), impar = an.every((c) => c === 0);
    const S = (x, k = N) => { let s = an[0] / 2; for (let n = 1; n <= Math.min(k, nmax); n++) s += an[n] * Math.cos(n * w0 * x) + bn[n] * Math.sin(n * w0 * x); return s; };

    // saltos: en los extremos de los tramos y entre un periodo y el siguiente
    const saltos = [];
    for (let i = 0; i < segs.length; i++) {
      const x = segs[i].v, izq = segs[i].fn(x - 1e-9 * Math.max(1, Math.abs(x))), sig = i + 1 < segs.length ? segs[i + 1] : segs[0], der = sig.fn((i + 1 < segs.length ? x : sig.u) + 1e-9 * Math.max(1, Math.abs(x)));
      if (isFinite(izq) && isFinite(der) && Math.abs(izq - der) > 1e-6 * Math.max(1, Math.abs(izq), Math.abs(der))) saltos.push({ x, izq, der, media: (izq + der) / 2 });
    }

    // Parseval: (2/T) ∫ f² = a₀²/2 + Σ (aₙ² + bₙ²)
    let int2 = 0; const n2 = nodos(segs.map((s) => ({ ...s, fn: (x) => s.fn(x) ** 2 })));
    for (const w of n2.ws) int2 += w;
    const energia = (2 / T) * int2;
    let parcial = an[0] ** 2 / 2; for (let n = 1; n <= N; n++) parcial += an[n] ** 2 + bn[n] ** 2;

    const arg = argumento(T), Tt = numF(T), Lt = numF(L), dosT = numF(2 / T);
    const a0t = numF(s0), b0t = numF(s0 + T);
    const pasos = [];
    const defTxt = (t) => `$f(x) = ${t.txt}$ si $${numF(t.a)} ≤ x < ${numF(t.b)}$`;
    pasos.push({ t: 'Periodo y frecuencia', html: (ext === 'periodica' ? `La función tiene periodo $T = ${Tt}$: ${tramos.map(defTxt).join('; ')}.` : `La función se da en [0, ${Lt}] (${tramos.map(defTxt).join('; ')}) y se extiende de forma <b>${ext}</b> a [−${Lt}, ${Lt}], así que $T = 2L = ${Tt}$${ext === 'par' ? ' y salen solo cosenos' : ' y salen solo senos'}.`) + ` La frecuencia fundamental es $ω_0 = {2π}/{T} = ${numF(w0)}$ y la serie es<br>$f(x) ∼ {a_0}/{2} + Σ_{n=1}^{∞} (a_n cos(${arg}) + b_n sen(${arg}))$` });
    pasos.push({ t: 'Paridad', html: par && impar ? 'f es 0 en todo el periodo.' : par ? `f es <b>par</b>, $f(−x) = f(x)$: el producto f(x) sen(nω₀x) es impar y su integral en un periodo simétrico es 0, así que todos los $b_n = 0$ (serie de cosenos).` : impar ? `f es <b>impar</b>, $f(−x) = −f(x)$: $a_0$ y todos los $a_n$ son 0 (serie de senos).` : 'f no es par ni impar: hay que calcular los $a_n$ y los $b_n$.' });
    const intDef = (q) => `${dosT} ∫_{${a0t}}^{${b0t}} f(x) ${q} dx`;
    const lA = impar ? { cero: true } : ley(an.slice(0, NPAT + 1)), lB = par ? { cero: true } : ley(bn.slice(0, NPAT + 1));
    const lista = (cs, nom) => cs.slice(1, 9).map((c, i) => `$${nom}_{${i + 1}} = ${numF(c)}$`).join(', ');
    pasos.push({ t: 'Coeficiente a₀', html: `$a_0 = ${intDef('')} = ${conDec(an[0])}$, así que el valor medio de f es $a_0/2 = ${numF(an[0] / 2)}$.` });
    const general = (L) => (L && !L.cero ? leyTxt(L) : null);
    const gA = general(lA), gB = general(lB);
    if (!impar) pasos.push({ t: 'Coeficientes aₙ', html: `$a_n = ${intDef(`cos(${arg})`)}$` + (lA?.cero ? ' = 0 para todo n ≥ 1.' : gA ? ` = <b>$${gA}$</b><br>Dando valores: ${lista(an, 'a')}…` : `<br>No siguen una fórmula sencilla; los primeros valen ${lista(an, 'a')}…`) });
    if (!par) pasos.push({ t: 'Coeficientes bₙ', html: `$b_n = ${intDef(`sen(${arg})`)}$` + (lB?.cero ? ' = 0 para todo n.' : gB ? ` = <b>$${gB}$</b><br>Dando valores: ${lista(bn, 'b')}…` : `<br>No siguen una fórmula sencilla; los primeros valen ${lista(bn, 'b')}…`) });

    // la serie con el término general y los primeros términos
    const terminos = [];
    if (Math.abs(an[0]) > 0) terminos.push({ c: an[0] / 2, s: '' });
    for (let n = 1; n <= nmax && terminos.length < 5; n++) {
      const u = conN(arg, n), ua = /^[xπ]$/.test(u) ? ` ${u}` : `(${u})`;
      if (an[n]) terminos.push({ c: an[n], s: `cos${ua}` });
      if (bn[n]) terminos.push({ c: bn[n], s: `sen${ua}` });
    }
    const unT = (t, i) => { const v = numF(Math.abs(t.c)), neg = t.c < 0, cuerpo = !t.s ? v : v === '1' ? t.s : `${v} ${t.s}`; return (i ? (neg ? ' − ' : ' + ') : neg ? '−' : '') + cuerpo; };
    const primeros = terminos.map(unT).join('') + ' + …';
    const sumaTxt = [an[0] ? numF(an[0] / 2) : '', gA && !lA.cero ? `Σ_{n=1}^{∞} ${gA.startsWith('−') ? '(' + gA + ')' : gA} cos(${arg})` : '', gB && !lB.cero ? `Σ_{n=1}^{∞} ${gB.startsWith('−') ? '(' + gB + ')' : gB} sen(${arg})` : ''].filter(Boolean).join(' + ');
    pasos.push({ t: 'Serie de Fourier', html: ((gA || lA?.cero) && (gB || lB?.cero) && sumaTxt ? `$f(x) ∼ ${sumaTxt}$<br>` : '') + `$f(x) ∼ ${primeros}$` });

    // convergencia y saltos
    pasos.push({ t: 'Convergencia', html: saltos.length ? `f tiene ${saltos.length === 1 ? 'un salto' : 'saltos'} en ${saltos.map((s) => `$x = ${numF(s.x)}$`).join(', ')}. Allí la serie converge a la media de los límites laterales, ${saltos.map((s) => `${'$'}{${f(s.izq)} ${s.der < 0 ? '−' : '+'} ${f(Math.abs(s.der))}}/{2} = ${f(s.media)}$`).join('; ')}, y cerca del salto la suma parcial se pasa un 9 % del salto (fenómeno de Gibbs) por muchos términos que tenga. En el resto de puntos converge a f(x).` : 'f es continua (también al pasar de un periodo al siguiente), así que la serie converge a f(x) en todos los puntos, y los coeficientes bajan rápido.' });

    let x0 = null, sx0 = null, fx0 = null;
    if (!vacio(sc.x0)) {
      x0 = leeN(sc.x0, 'El punto x₀');
      sx0 = S(x0);
      const sj = saltos.find((s) => { const d = (x0 - s.x) / T; return Math.abs(d - Math.round(d)) < 1e-9; });
      fx0 = sj ? sj.media : fper(x0);
      pasos.push({ t: `Suma parcial en x₀ = ${f(x0)}`, html: `Con N = ${N} armónicos, $S_{${N}}(${f(x0)}) = ${f(sx0, 6)}$, y la serie converge a ${sj ? 'la media del salto' : 'f(x₀)'} = ${f(fx0, 6)}: la diferencia es ${f(Math.abs(sx0 - fx0), 3)}.` });
    }
    pasos.push({ t: 'Igualdad de Parseval', html: `$${dosT} ∫ f(x)^2 dx = {a_0^2}/{2} + Σ_{n=1}^{∞} (a_n^2 + b_n^2) = ${conDec(energia)}$. Los ${N} primeros armónicos (con a₀) ya suman ${f(parcial, 6)}, el ${f((100 * parcial) / energia, 4)} % de la «energía» de f.` });

    return { tramos, ext, T, L, w0, N, nmax, an, bn, par, impar, saltos, S, fper, energia, parcial, x0, sx0, fx0, gA, gB, cerosA: !!lA?.cero, cerosB: !!lB?.cero, pasos, s0, primeros };
  }

  const ejemplos = [
    { clave: 'cuadrada', nombre: 'Onda cuadrada (−1 y 1)', sc: { ext: 'periodica', tramos: [{ f: '-1', a: '-π', b: '0' }, { f: '1', a: '0', b: 'π' }], N: '9', x0: 'π/2' } },
    { clave: 'sierra', nombre: 'Diente de sierra: f(x) = x en [−π, π]', sc: { ext: 'periodica', tramos: [{ f: 'x', a: '-π', b: 'π' }], N: '10', x0: 'π/2' } },
    { clave: 'parabola', nombre: 'f(x) = x² en [−π, π]', sc: { ext: 'periodica', tramos: [{ f: 'x^2', a: '-π', b: 'π' }], N: '8', x0: 'π' } },
    { clave: 'triangular', nombre: 'Onda triangular: |x| en [−π, π]', sc: { ext: 'periodica', tramos: [{ f: '|x|', a: '-π', b: 'π' }], N: '7', x0: '0' } },
    { clave: 'pulso', nombre: 'Pulso rectangular de periodo 2', sc: { ext: 'periodica', tramos: [{ f: '1', a: '0', b: '1' }, { f: '0', a: '1', b: '2' }], N: '15', x0: '0,5' } },
    { clave: 'rectificada', nombre: 'Seno rectificado: |sen x|', sc: { ext: 'periodica', tramos: [{ f: '|sen x|', a: '-π', b: 'π' }], N: '8', x0: '' } },
    { clave: 'media-onda', nombre: 'Media onda rectificada', sc: { ext: 'periodica', tramos: [{ f: 'sen x', a: '0', b: 'π' }, { f: '0', a: 'π', b: '2π' }], N: '8', x0: '' } },
    { clave: 'sierra-0-2pi', nombre: 'f(x) = x en [0, 2π]', sc: { ext: 'periodica', tramos: [{ f: 'x', a: '0', b: '2π' }], N: '10', x0: '' } },
    { clave: 'cosenos', nombre: 'Desarrollo en cosenos de x en [0, π]', sc: { ext: 'par', tramos: [{ f: 'x', a: '0', b: 'π' }], N: '7', x0: '' } },
    { clave: 'senos', nombre: 'Desarrollo en senos de 1 en [0, π]', sc: { ext: 'impar', tramos: [{ f: '1', a: '0', b: 'π' }], N: '9', x0: '' } },
    { clave: 'senos-parabola', nombre: 'Desarrollo en senos de x(π − x)', sc: { ext: 'impar', tramos: [{ f: 'x(π - x)', a: '0', b: 'π' }], N: '5', x0: 'π/2' } },
    { clave: 'cuadrada-T2', nombre: 'Onda cuadrada de periodo 2', sc: { ext: 'periodica', tramos: [{ f: '-1', a: '-1', b: '0' }, { f: '1', a: '0', b: '1' }], N: '9', x0: '' } },
  ];

  return { resolver, ejemplos, ley, leyTxt, numF, exacto, f, MAXN };
})();
if (typeof module !== 'undefined') module.exports = Fourier;
