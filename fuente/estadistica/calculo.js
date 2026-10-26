/* =====================================================================
   Estadística: distribuciones (sin DOM). Normal, t de Student, χ², F de
   Snedecor, exponencial, uniforme, binomial, Poisson, geométrica e
   hipergeométrica: probabilidades P(X ≤ a), P(X ≥ a), P(a ≤ X ≤ b),
   P(X = k), P(|X − μ| ≤ c), cuantiles, valores críticos bilaterales y
   unilaterales, la μ o la σ de una normal a partir de una probabilidad,
   aproximaciones y tabla de valores, con media, varianza y el desarrollo.
   Ejercicios al azar con enunciado para el modo práctica.
   Funciones especiales con la gamma y la beta incompletas regularizadas.
   ===================================================================== */
const Estadistica = (() => {
  /* ---------- Funciones especiales ---------- */
  const LANCZOS = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lnGamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGamma(1 - x);
    x -= 1;
    let a = 0.99999999999980993;
    const t = x + 7.5;
    LANCZOS.forEach((c, i) => { a += c / (x + i + 1); });
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  // gamma incompleta regularizada P(a, x)
  function gammaP(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) {
      let s = 1 / a, d = s, ap = a;
      for (let n = 0; n < 1000; n++) { ap += 1; d *= x / ap; s += d; if (Math.abs(d) < Math.abs(s) * 1e-16) break; }
      return s * Math.exp(-x + a * Math.log(x) - lnGamma(a));
    }
    return 1 - gammaQcf(a, x);
  }
  function gammaQcf(a, x) {
    const TINY = 1e-300;
    let b = x + 1 - a, c = 1 / TINY, d = 1 / b, h = d;
    for (let i = 1; i < 1000; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b; if (Math.abs(d) < TINY) d = TINY;
      c = b + an / c; if (Math.abs(c) < TINY) c = TINY;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-16) break;
    }
    return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
  }
  const gammaQ = (a, x) => (x <= 0 ? 1 : x < a + 1 ? 1 - gammaP(a, x) : gammaQcf(a, x));
  // beta incompleta regularizada I_x(a, b)
  function betaI(x, a, b) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? (bt * betacf(x, a, b)) / a : 1 - (bt * betacf(1 - x, b, a)) / b;
  }
  function betacf(x, a, b) {
    const TINY = 1e-300, qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - (qab * x) / qap;
    if (Math.abs(d) < TINY) d = TINY;
    d = 1 / d;
    let h = d;
    for (let m = 1; m < 1000; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY; c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY; d = 1 / d; h *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY; c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY; d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-16) break;
    }
    return h;
  }
  const Phi = (z) => (z < 0 ? 0.5 * gammaQ(0.5, (z * z) / 2) : 1 - 0.5 * gammaQ(0.5, (z * z) / 2));

  /* ---------- Formato ---------- */
  // cero: por debajo se escribe 0 (ruido de redondeo); las probabilidades usan 0 para no perder las colas lejanas
  const num = (x, d = 4, cero = 1e-15) => {
    if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
    if (x === 0 || Math.abs(x) < cero) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-4 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(Math.max(d, Math.ceil(Math.log10(a + 1)) + 1)));
    return s.replace('.', ',').replace('-', '−');
  };
  // probabilidad con 4 decimales como en las tablas (y más si es muy pequeña)
  const prob = (p) => (p !== 0 && Math.abs(p) < 1e-4 ? num(p, 4, 0) : p.toFixed(4).replace('.', ',').replace('-', '−'));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom, { entero = false, min = -Infinity, minEx = false, max = Infinity, maxEx = false } = {}) {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (entero && !Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número entero`);
    if (minEx ? v <= min : v < min) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${minEx ? 'mayor que' : 'como mínimo'} ${num(min)}`);
    if (maxEx ? v >= max : v > max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${maxEx ? 'menor que' : 'como máximo'} ${num(max)}`);
    return v;
  }


  /* ---------- Distribuciones ---------- */
  // coeficiente binomial exacto con BigInt (para escribirlo) y en coma flotante
  function combBig(n, k) { k = Math.min(k, n - k); let r = 1n; for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i); return r; }
  const combTxt = (n, k) => { const c = combBig(n, k); return c < 10n ** 15n ? c.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : num(Number(c)); };
  const lnC = (n, k) => lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);
  // F de Snedecor (también la usa intervalos/calculo.js para el cociente de varianzas)
  const fCdf = ({ d1, d2 }, x) => (x <= 0 ? 0 : betaI((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2));
  // hipergeométrica: valores posibles y suma de la función de probabilidad
  const hSop = ({ N, K, n }) => [Math.max(0, n - (N - K)), Math.min(n, K)];
  const hPmf = (P, k) => { const [lo, hi] = hSop(P); return !Number.isInteger(k) || k < lo || k > hi ? 0 : Math.exp(lnC(P.K, k) + lnC(P.N - P.K, P.n - k) - lnC(P.N, P.n)); };
  const hSuma = (P, a, b) => { const [lo, hi] = hSop(P); let s = 0; for (let k = Math.max(lo, Math.ceil(a)); k <= Math.min(hi, Math.floor(b)); k++) s += hPmf(P, k); return Math.min(1, s); };

  const DIST = {
    normal: {
      nombre: 'Normal N(μ, σ)', continua: true, params: [['mu', 'Media μ', {}], ['sigma', 'Desviación típica σ', { min: 0, minEx: true }]],
      pdf: ({ mu, sigma }, x) => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)),
      cdf: ({ mu, sigma }, x) => Phi((x - mu) / sigma),
      sf: ({ mu, sigma }, x) => Phi(-(x - mu) / sigma),
      momentos: ({ mu, sigma }) => ({ media: mu, varianza: sigma * sigma }),
      rango: ({ mu, sigma }) => [mu - 4 * sigma, mu + 4 * sigma],
      simetrica: true, nombreX: 'X', etiqueta: (p) => `N(${num(p.mu)}, ${num(p.sigma)})`,
    },
    t: {
      nombre: 't de Student', continua: true, params: [['nu', 'Grados de libertad ν', { min: 0, minEx: true }]],
      pdf: ({ nu }, x) => Math.exp(lnGamma((nu + 1) / 2) - lnGamma(nu / 2) - 0.5 * Math.log(nu * Math.PI) - ((nu + 1) / 2) * Math.log(1 + (x * x) / nu)),
      cdf: ({ nu }, x) => { const c = 0.5 * betaI(nu / (nu + x * x), nu / 2, 0.5); return x > 0 ? 1 - c : c; },
      sf: ({ nu }, x) => { const c = 0.5 * betaI(nu / (nu + x * x), nu / 2, 0.5); return x > 0 ? c : 1 - c; },
      momentos: ({ nu }) => ({ media: nu > 1 ? 0 : NaN, varianza: nu > 2 ? nu / (nu - 2) : nu > 1 ? Infinity : NaN }),
      rango: ({ nu }) => { const r = nu < 3 ? 8 : 5; return [-r, r]; },
      simetrica: true, nombreX: 'T', critico: (P) => `t<sub>${num(P.nu)}</sub>`, etiqueta: (p) => `t<sub>${num(p.nu)}</sub>`,
    },
    chi2: {
      nombre: 'Chi cuadrado χ²', continua: true, params: [['k', 'Grados de libertad k', { min: 0, minEx: true }]],
      pdf: ({ k }, x) => (x <= 0 ? (x === 0 && k === 2 ? 0.5 : 0) : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lnGamma(k / 2))),
      cdf: ({ k }, x) => (x <= 0 ? 0 : gammaP(k / 2, x / 2)),
      sf: ({ k }, x) => (x <= 0 ? 1 : gammaQ(k / 2, x / 2)),
      momentos: ({ k }) => ({ media: k, varianza: 2 * k }),
      rango: ({ k }) => [0, k + 5 * Math.sqrt(2 * k) + 2],
      nombreX: 'χ²', critico: (P) => `χ<sup>2</sup><sub>${num(P.k)}</sub>`, etiqueta: (p) => `χ²<sub>${num(p.k)}</sub>`,
    },
    f: {
      nombre: 'F de Snedecor', continua: true, params: [['d1', 'Grados de libertad del numerador d₁', { min: 0, minEx: true }], ['d2', 'Grados de libertad del denominador d₂', { min: 0, minEx: true }]],
      pdf: ({ d1, d2 }, x) => (x <= 0 ? 0 : Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (lnGamma(d1 / 2) + lnGamma(d2 / 2) - lnGamma((d1 + d2) / 2)))),
      cdf: fCdf,
      sf: ({ d1, d2 }, x) => (x <= 0 ? 1 : betaI(d2 / (d2 + d1 * x), d2 / 2, d1 / 2)),
      momentos: ({ d1, d2 }) => ({ media: d2 > 2 ? d2 / (d2 - 2) : NaN, varianza: d2 > 4 ? (2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) ** 2 * (d2 - 4)) : d2 > 2 ? Infinity : NaN }),
      rango: (P) => { let hi = 2; while (fCdf(P, hi) < 0.995 && hi < 1e5) hi *= 2; return [0, hi]; },
      nombreX: 'F', critico: (P) => `F<sub>${num(P.d1)}, ${num(P.d2)}</sub>`, etiqueta: (p) => `F<sub>${num(p.d1)}, ${num(p.d2)}</sub>`,
      nota: () => 'F = (χ²<sub>d₁</sub>/d₁)/(χ²<sub>d₂</sub>/d₂): es la que se usa para comparar dos varianzas y en el ANOVA.',
    },
    exponencial: {
      nombre: 'Exponencial Exp(λ)', continua: true, params: [['lambda', 'Tasa λ', { min: 0, minEx: true }]],
      pdf: ({ lambda }, x) => (x < 0 ? 0 : lambda * Math.exp(-lambda * x)),
      cdf: ({ lambda }, x) => (x <= 0 ? 0 : -Math.expm1(-lambda * x)),
      sf: ({ lambda }, x) => (x <= 0 ? 1 : Math.exp(-lambda * x)),
      inv: ({ lambda }, p) => -Math.log1p(-p) / lambda,
      invTxt: () => '1 − e<sup>−λa</sup> = p ⇒ a = −ln(1 − p)/λ',
      momentos: ({ lambda }) => ({ media: 1 / lambda, varianza: 1 / (lambda * lambda) }),
      rango: ({ lambda }) => [0, 6 / lambda],
      nombreX: 'X', etiqueta: (p) => `Exp(${num(p.lambda)})`, nota: () => 'F(x) = 1 − e<sup>−λx</sup>. No tiene memoria: P(X ≥ s + t | X ≥ s) = P(X ≥ t).',
    },
    uniforme: {
      nombre: 'Uniforme continua U(a, b)', continua: true, params: [['lo', 'Mínimo (extremo a)', {}], ['hi', 'Máximo (extremo b)', {}]],
      valida: ({ lo, hi }) => (hi > lo ? '' : 'El máximo tiene que ser mayor que el mínimo'),
      pdf: ({ lo, hi }, x) => (x < lo || x > hi ? 0 : 1 / (hi - lo)),
      cdf: ({ lo, hi }, x) => Math.min(1, Math.max(0, (x - lo) / (hi - lo))),
      inv: ({ lo, hi }, p) => lo + p * (hi - lo),
      invTxt: () => '(a − mín)/(máx − mín) = p ⇒ a = mín + p·(máx − mín)',
      momentos: ({ lo, hi }) => ({ media: (lo + hi) / 2, varianza: (hi - lo) ** 2 / 12 }),
      rango: ({ lo, hi }) => [lo - 0.15 * (hi - lo), hi + 0.15 * (hi - lo)],
      nombreX: 'X', etiqueta: (p) => `U(${num(p.lo)}, ${num(p.hi)})`, nota: (P) => `F(x) = (x − ${num(P.lo)})/(${num(P.hi)} − ${num(P.lo)}) entre los dos extremos: la probabilidad es proporcional a la longitud del tramo.`,
    },
    binomial: {
      nombre: 'Binomial B(n, p)', continua: false, params: [['n', 'Número de pruebas n', { entero: true, min: 1, max: 100000 }], ['p', 'Probabilidad de éxito p', { min: 0, max: 1 }]],
      pmf: ({ n, p }, k) => {
        if (k < 0 || k > n || !Number.isInteger(k)) return 0;
        if (p === 0) return k === 0 ? 1 : 0;
        if (p === 1) return k === n ? 1 : 0;
        return Math.exp(lnC(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
      },
      cdf: (P, k) => { const { n, p } = P; if (k < 0) return 0; if (k >= n) return 1; if (p === 0) return 1; if (p === 1) return 0; return betaI(1 - p, n - Math.floor(k), Math.floor(k) + 1); },
      // P(X ≥ k) sin restar de 1, para no perder las colas pequeñas
      cola: ({ n, p }, k) => { k = Math.ceil(k); if (k <= 0) return 1; if (k > n) return 0; if (p === 0) return 0; if (p === 1) return 1; return betaI(p, k, n - k + 1); },
      soporte: ({ n }) => [0, n],
      momentos: ({ n, p }) => ({ media: n * p, varianza: n * p * (1 - p) }),
      rango: ({ n, p }) => { const m = n * p, s = Math.sqrt(n * p * (1 - p)); return [Math.max(0, Math.floor(m - 5 * s - 1)), Math.min(n, Math.ceil(m + 5 * s + 1))]; },
      nombreX: 'X', etiqueta: (p) => `B(${num(p.n)}, ${num(p.p)})`,
      formula: ({ n, p }, k) => `P(X = ${k}) = C(${n}, ${k})·${num(p)}<sup>${k}</sup>·${num(1 - p)}<sup>${n - k}</sup> = ${combTxt(n, k)}·${num(p)}<sup>${k}</sup>·${num(1 - p)}<sup>${n - k}</sup>`,
      general: ({ p }) => `P(X = k) = C(n, k)·p<sup>k</sup>·q<sup>n−k</sup>, con q = 1 − p = ${num(1 - p)} y C(n, k) = n! / (k! (n − k)!)`,
    },
    poisson: {
      nombre: 'Poisson P(λ)', continua: false, params: [['lambda', 'Media λ', { min: 0, minEx: true, max: 1e6 }]],
      pmf: ({ lambda }, k) => (k < 0 || !Number.isInteger(k) ? 0 : Math.exp(-lambda + k * Math.log(lambda) - lnGamma(k + 1))),
      cdf: ({ lambda }, k) => (k < 0 ? 0 : gammaQ(Math.floor(k) + 1, lambda)),
      cola: ({ lambda }, k) => { k = Math.ceil(k); return k <= 0 ? 1 : gammaP(k, lambda); },
      momentos: ({ lambda }) => ({ media: lambda, varianza: lambda }),
      rango: ({ lambda }) => [Math.max(0, Math.floor(lambda - 5 * Math.sqrt(lambda) - 1)), Math.ceil(lambda + 5 * Math.sqrt(lambda) + 3)],
      nombreX: 'X', etiqueta: (p) => `P(${num(p.lambda)})`,
      formula: ({ lambda }, k) => `P(X = ${k}) = e<sup>−${num(lambda)}</sup>·${num(lambda)}<sup>${k}</sup> / ${k}!`,
      general: () => 'P(X = k) = e<sup>−λ</sup>·λ<sup>k</sup> / k!, para k = 0, 1, 2…',
    },
    geometrica: {
      nombre: 'Geométrica G(p)', continua: false, params: [['p', 'Probabilidad de éxito p', { min: 0, minEx: true, max: 1 }]],
      pmf: ({ p }, k) => (k < 0 || !Number.isInteger(k) ? 0 : p === 1 ? (k === 0 ? 1 : 0) : Math.exp(k * Math.log1p(-p)) * p),
      cdf: ({ p }, k) => (k < 0 ? 0 : p === 1 ? 1 : -Math.expm1((Math.floor(k) + 1) * Math.log1p(-p))),
      cola: ({ p }, k) => { k = Math.ceil(k); return k <= 0 ? 1 : p === 1 ? 0 : Math.exp(k * Math.log1p(-p)); },
      momentos: ({ p }) => ({ media: (1 - p) / p, varianza: (1 - p) / (p * p) }),
      rango: ({ p }) => [0, p === 1 ? 3 : Math.max(5, Math.ceil(Math.log(0.002) / Math.log1p(-p)))],
      nombreX: 'X', etiqueta: (p) => `G(${num(p.p)})`,
      formula: ({ p }, k) => `P(X = ${k}) = ${num(1 - p)}<sup>${k}</sup>·${num(p)}`,
      general: ({ p }) => `X = número de fracasos antes del primer éxito: P(X = k) = q<sup>k</sup>·p, con q = 1 − p = ${num(1 - p)}, para k = 0, 1, 2… Si se cuentan las pruebas hasta el primer éxito (incluido), Y = X + 1.`,
    },
    hipergeometrica: {
      nombre: 'Hipergeométrica H(N, K, n)', continua: false,
      params: [['N', 'Tamaño de la población N', { entero: true, min: 1, max: 1e6 }], ['K', 'Éxitos en la población K', { entero: true, min: 0 }], ['n', 'Extracciones sin reemplazo n', { entero: true, min: 1 }]],
      valida: ({ N, K, n }) => (K > N ? 'Los éxitos K no pueden ser más que la población N' : n > N ? 'No se pueden sacar más elementos (n) de los que hay (N)' : ''),
      pmf: hPmf,
      cdf: (P, k) => hSuma(P, -Infinity, k),
      cola: (P, k) => hSuma(P, k, Infinity),
      soporte: hSop,
      momentos: ({ N, K, n }) => ({ media: (n * K) / N, varianza: N > 1 ? n * (K / N) * (1 - K / N) * ((N - n) / (N - 1)) : 0 }),
      rango: hSop,
      nombreX: 'X', etiqueta: (p) => `H(${num(p.N)}, ${num(p.K)}, ${num(p.n)})`,
      formula: ({ N, K, n }, k) => `P(X = ${k}) = C(${K}, ${k})·C(${N - K}, ${n - k}) / C(${N}, ${n}) = ${combTxt(K, k)}·${combTxt(N - K, n - k)} / ${combTxt(N, n)}`,
      general: () => 'X = número de éxitos al sacar n elementos sin reemplazo de una población de N con K éxitos: P(X = k) = C(K, k)·C(N − K, n − k) / C(N, n)',
    },
  };
  const CRITICOS = ['normal', 't', 'chi2', 'f'];
  const TIPOS_C = [['menor', 'P(X ≤ a)'], ['mayor', 'P(X ≥ a)'], ['entre', 'P(a ≤ X ≤ b)'], ['centro', 'P(|X − μ| ≤ c): a una distancia c de la media'], ['cuantil', 'Cuantil: a con P(X ≤ a) = p'], ['critico', 'Valor crítico bilateral (α)'], ['criticoU', 'Valor crítico unilateral (α en la cola derecha)'], ['inverso', 'Hallar μ o σ a partir de una probabilidad']];
  const TIPOS_D = [['igual', 'P(X = k)'], ['menor', 'P(X ≤ k)'], ['menorE', 'P(X < k)'], ['mayor', 'P(X ≥ k)'], ['mayorE', 'P(X > k)'], ['entre', 'P(a ≤ X ≤ b)'], ['centro', 'P(|X − μ| ≤ c): a una distancia c de la media'], ['cuantil', 'Cuantil: menor k con P(X ≤ k) ≥ p']];
  const tipos = (d) => (DIST[d].continua ? TIPOS_C.filter(([k]) => (k !== 'critico' && k !== 'criticoU') || CRITICOS.includes(d)).filter(([k]) => k !== 'inverso' || d === 'normal') : TIPOS_D);

  // cuantil continuo por bisección
  function cuantil(D, P, p) {
    if (D.inv) return D.inv(P, p);
    let [lo, hi] = D.rango(P);
    while (D.cdf(P, lo) > p) lo -= Math.max(1, Math.abs(hi - lo));
    while (D.cdf(P, hi) < p) hi += Math.max(1, Math.abs(hi - lo));
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (D.cdf(P, m) < p) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  const N01 = { mu: 0, sigma: 1 };
  // la probabilidad del cuantil va en «q», para no pisar la p de la binomial (antes era «p»)
  const probCuantil = (sc, D) => lee(vacio(sc.q) && !D.params.some(([k]) => k === 'p') ? { q: sc.p } : sc, 'q', 'la probabilidad p', { min: 0, minEx: true, max: 1, maxEx: true });

  // μ o σ de una normal a partir de P(X ≤ a) o P(X ≥ a)
  function inverso(sc, P, incog, pasos) {
    const a = lee(sc, 'a', 'el valor a'), q = probCuantil(sc, DIST.normal), mayor = sc.cola === 'mayor', pIzq = mayor ? 1 - q : q, z = cuantil(DIST.normal, N01, pIzq);
    const ev = `P(X ${mayor ? '≥' : '≤'} ${num(a)}) = ${num(q)}`;
    let h = `${ev}${mayor ? ` ⇒ P(X ≤ ${num(a)}) = 1 − ${num(q)} = ${num(pIzq)}` : ''}.<br>Tipificando, Φ((a − μ)/σ) = ${num(pIzq)} ⇒ (a − μ)/σ = z = ${num(z)}.<br>`;
    if (incog === 'mu') { P.mu = a - z * P.sigma; h += `Despejando, μ = a − zσ = ${num(a)} − ${num(z)}·${num(P.sigma)} = <b>${num(P.mu)}</b>`; }
    else {
      if (Math.abs(z) < 1e-12) throw new Error('Con esa probabilidad, a es justo la media: σ puede ser cualquiera');
      const s = (a - P.mu) / z;
      if (!(s > 0)) throw new Error(`No hay ninguna σ posible: con ${ev.replace(/<[^>]+>/g, '')}, a tiene que ser ${z > 0 ? 'mayor' : 'menor'} que μ = ${num(P.mu).replace(/<[^>]+>/g, '')}`);
      P.sigma = s; h += `Despejando, σ = (a − μ)/z = (${num(a)} − ${num(P.mu)})/${num(z)} = <b>${num(s)}</b>`;
    }
    pasos.push({ t: `Hallar ${incog === 'mu' ? 'μ' : 'σ'}`, html: h });
    return { a, q, z, mayor };
  }

  // tabla de valores de una discreta alrededor de lo pedido (como mucho 41 filas)
  function tabla(D, P, enEv, centro) {
    const [r0, r1] = D.rango(P), [s0, s1] = D.soporte ? D.soporte(P) : [0, Infinity];
    let lo = Math.max(s0, Math.floor(r0)), hi = Math.min(s1, Math.ceil(r1));
    if (hi - lo > 40) { const c = Math.round(isFinite(centro) ? Math.min(Math.max(centro, lo), hi) : (lo + hi) / 2); lo = Math.max(lo, c - 20); hi = lo + 40; }
    const G = (k) => (D.cola ? D.cola(P, k) : 1 - D.cdf(P, k - 1));
    const filas = []; for (let k = lo; k <= hi; k++) { const b = (x) => (enEv(k) ? `<b>${x}</b>` : x); filas.push(`<tr><td>${b(k)}</td><td>${b(prob(D.pmf(P, k)))}</td><td>${prob(D.cdf(P, k))}</td><td>${prob(G(k))}</td></tr>`); }
    return `<div class="tabla-scroll"><table class="tabla"><thead><tr><th>k</th><th>P(X = k)</th><th>P(X ≤ k)</th><th>P(X ≥ k)</th></tr></thead><tbody>${filas.join('')}</tbody></table></div><button type="button" class="btn" data-copiar>Copiar la tabla</button>`;
  }

  // probabilidad aproximada de a ≤ X ≤ b por una normal con la corrección de continuidad
  const porNormal = (m, s, a, b) => (isFinite(b) ? Phi((b + 0.5 - m) / s) : 1) - (isFinite(a) ? Phi((a - 0.5 - m) / s) : 0);
  const intervalo = (a, b) => `${isFinite(a) ? `${num(a)} ≤ X` : 'X'}${isFinite(b) ? ` ≤ ${num(b)}` : ''}`;

  function calcular(sc) {
    const d = DIST[sc.dist] ? sc.dist : 'normal', D = DIST[d];
    const lista = tipos(d), tipo = lista.some(([k]) => k === sc.tipo) ? sc.tipo : lista[0][0];
    const incog = tipo === 'inverso' ? (sc.incog === 'sigma' ? 'sigma' : 'mu') : null, P = {}, pasos = [];
    for (const [k, nom, op] of D.params) if (k !== incog) P[k] = lee(sc, k, nom.toLowerCase(), op);
    const malo = D.valida?.(P); if (malo) throw new Error(malo);
    const inv = incog ? inverso(sc, P, incog, pasos) : null;
    const { media, varianza } = D.momentos(P), X = D.nombreX;
    pasos.push({ t: 'Distribución', html: `${X} ~ ${D.etiqueta(P)}: media ${isNaN(media) ? 'no definida' : num(media)}, varianza ${isNaN(varianza) ? 'no definida' : num(varianza)}${isFinite(varianza) ? `, desviación típica ${num(Math.sqrt(varianza))}` : ''}` });
    const r = { dist: d, tipo, P, media, varianza, pasos };
    const leeC = () => { if (!isFinite(media)) throw new Error('Esta distribución no tiene media: no se puede medir la distancia a ella'); return lee(sc, 'cc', 'la distancia c', { min: 0 }); };
    const cheb = (c) => (isFinite(varianza) && c > Math.sqrt(varianza) ? `<br>Para comparar, la desigualdad de Chebyshev asegura al menos 1 − σ²/c² = 1 − ${num(varianza)}/${num(c)}<sup>2</sup> = ${prob(1 - varianza / (c * c))} para cualquier distribución.` : '');
    if (D.continua) {
      const F = (x) => D.cdf(P, x), S = (x) => (D.sf ? D.sf(P, x) : 1 - D.cdf(P, x)), nota = D.nota ? ` &nbsp;(${D.nota(P)})` : '';
      if (inv) {
        Object.assign(r, { p: inv.q, a: inv.a, incog, valor: P[incog], sombra: inv.mayor ? [inv.a, Infinity] : [-Infinity, inv.a] });
        pasos.push({ t: 'Comprobación', html: `Con ${incog === 'mu' ? `μ = ${num(P.mu)}` : `σ = ${num(P.sigma)}`}, P(X ${inv.mayor ? '≥' : '≤'} ${num(inv.a)}) = ${prob(inv.mayor ? S(inv.a) : F(inv.a))}` });
      } else if (tipo === 'menor' || tipo === 'mayor') {
        const a = lee(sc, 'a', 'el valor a');
        const pa = F(a), res = tipo === 'menor' ? pa : S(a);
        const zz = d === 'normal' ? (a - P.mu) / P.sigma : null;
        pasos.push({ t: tipo === 'menor' ? `P(${X} ≤ ${num(a)})` : `P(${X} ≥ ${num(a)})`, html: d === 'normal'
          ? `Tipificando, Z = (X − μ)/σ = (${num(a)} − ${num(P.mu)})/${num(P.sigma)} = ${num(zz)}<br>${tipo === 'menor' ? `P(Z ≤ ${num(zz)}) = Φ(${num(zz)})` : `P(Z ≥ ${num(zz)}) = 1 − Φ(${num(zz)})${zz < 0 ? ` = Φ(${num(-zz)})` : ''}`} = <b>${prob(res)}</b>`
          : `${tipo === 'menor' ? `F(${num(a)})` : `1 − F(${num(a)}) = 1 − ${prob(pa)}`} = <b>${prob(res)}</b>${nota}` });
        pasos.push({ t: 'En una distribución continua', html: `P(${X} = a) = 0, así que da igual escribir ≤ o &lt; (y ≥ o &gt;).` });
        Object.assign(r, { p: res, a, sombra: tipo === 'menor' ? [-Infinity, a] : [a, Infinity] });
      } else if (tipo === 'entre' || tipo === 'centro') {
        let a, b, c = null;
        if (tipo === 'centro') { c = leeC(); a = media - c; b = media + c; } else { a = lee(sc, 'a', 'el valor a'); b = lee(sc, 'b', 'el valor b'); }
        if (b < a) throw new Error('b tiene que ser mayor o igual que a');
        // en la cola derecha se resta con S para no perder cifras
        const res = a > media ? S(a) - S(b) : F(b) - F(a), za = d === 'normal' ? (a - P.mu) / P.sigma : 0, zb = d === 'normal' ? (b - P.mu) / P.sigma : 0;
        const tit = tipo === 'centro' ? `P(|${X} − μ| ≤ ${num(c)}) = P(${num(a)} ≤ ${X} ≤ ${num(b)})` : `P(${num(a)} ≤ ${X} ≤ ${num(b)}) = F(${num(b)}) − F(${num(a)})`;
        pasos.push({ t: tit, html: (d === 'normal'
          ? (tipo === 'centro' ? `P(−${num(zb)} ≤ Z ≤ ${num(zb)}) = 2Φ(${num(zb)}) − 1 = 2·${prob(Phi(zb))} − 1 = <b>${prob(res)}</b>` : `Z<sub>a</sub> = ${num(za)}, &nbsp;Z<sub>b</sub> = ${num(zb)}<br>Φ(${num(zb)}) − Φ(${num(za)}) = ${prob(F(b))} − ${prob(F(a))} = <b>${prob(res)}</b>`)
          : `F(${num(b)}) − F(${num(a)}) = ${prob(F(b))} − ${prob(F(a))} = <b>${prob(res)}</b>${nota}`) + (c !== null ? cheb(c) : '') });
        Object.assign(r, { p: res, a, b, c, sombra: [a, b] });
      } else if (tipo === 'cuantil') {
        const p = probCuantil(sc, D), x = cuantil(D, P, p);
        let h = `Se busca a con P(${X} ≤ a) = ${num(p)}`;
        if (d === 'normal') { const zq = cuantil(DIST.normal, N01, p); h += `.<br>En la normal tipificada, Φ(z) = ${num(p)} ⇒ z = ${num(zq)}.<br>Destipificando, a = μ + zσ = ${num(P.mu)} + ${num(zq)}·${num(P.sigma)} = <b>${num(x)}</b>`; }
        else if (D.invTxt) h += `: ${D.invTxt()} = <b>${num(x)}</b>`;
        else h += `: a = <b>${num(x)}</b>`;
        pasos.push({ t: 'Cuantil', html: h });
        Object.assign(r, { p, x, sombra: [-Infinity, x] });
      } else {
        const alfa = lee(sc, 'alfa', 'el nivel de significación α', { min: 0, minEx: true, max: 1, maxEx: true }), bil = tipo === 'critico';
        const Q = d === 'normal' ? N01 : P, nor = d === 'normal', k = nor ? P.sigma : 1, m0 = nor ? P.mu : 0;
        const nom = nor ? 'z' : D.critico(P), V = nor ? 'Z' : X, enX = (c) => (nor && (P.mu !== 0 || P.sigma !== 1) ? `<br>En X: μ ${bil ? '±' : '+'} cσ = ${bil ? `${num(P.mu - c * P.sigma)} y ` : ''}${num(P.mu + c * P.sigma)}` : '');
        if (bil && D.simetrica) {
          const c = cuantil(D, Q, 1 - alfa / 2);
          pasos.push({ t: 'Valor crítico bilateral', html: `Se busca c con P(−c ≤ ${V} ≤ c) = 1 − α = ${num(1 - alfa)}: cada cola deja α/2 = ${num(alfa / 2)}, así que P(${V} ≤ c) = ${num(1 - alfa / 2)}.<br>${nor ? 'z' : 't'}<sub>α/2</sub> = <b>±${num(c)}</b>${enX(c)}` });
          Object.assign(r, { p: 1 - alfa, alfa, c, sombra: [m0 - c * k, m0 + c * k] });
        } else if (bil) {
          const c1 = cuantil(D, Q, alfa / 2), c2 = cuantil(D, Q, 1 - alfa / 2);
          pasos.push({ t: 'Valores críticos bilaterales', html: `${D.nombreX === 'F' ? 'La F' : 'La χ²'} no es simétrica: hacen falta dos valores, uno que deja α/2 = ${num(alfa / 2)} a la izquierda y otro que deja α/2 a la derecha.<br>c₁ = ${nom}<sub>; 1−α/2</sub> = <b>${num(c1)}</b> &nbsp;(P(${X} ≤ c₁) = ${num(alfa / 2)})<br>c₂ = ${nom}<sub>; α/2</sub> = <b>${num(c2)}</b> &nbsp;(P(${X} ≥ c₂) = ${num(alfa / 2)})${d === 'f' ? `<br>Se cumple c₁ = 1/F<sub>${num(P.d2)}, ${num(P.d1)}; α/2</sub>, como en las tablas.` : ''}` });
          Object.assign(r, { p: 1 - alfa, alfa, c: c2, c1, sombra: [c1, c2] });
        } else {
          const c = cuantil(D, Q, 1 - alfa);
          pasos.push({ t: 'Valor crítico unilateral', html: `Toda α va a la cola derecha: se busca c con P(${V} ≥ c) = α = ${num(alfa)}, es decir P(${V} ≤ c) = ${num(1 - alfa)}.<br>${nom}<sub>${nor ? '' : '; '}α</sub> = <b>${num(c)}</b>${D.simetrica ? `<br>Para la cola izquierda, por simetría: −${num(c)}.` : d === 'f' ? `<br>Para la cola izquierda, F<sub>${num(P.d1)}, ${num(P.d2)}; 1−α</sub> = 1/F<sub>${num(P.d2)}, ${num(P.d1)}; α</sub> = ${num(cuantil(D, P, alfa))}.` : `<br>Para la cola izquierda (P(${X} ≤ c) = α): ${num(cuantil(D, P, alfa))}.`}${enX(c)}` });
          Object.assign(r, { p: alfa, alfa, c, sombra: [m0 + c * k, Infinity] });
        }
      }
    } else {
      const f = (k) => D.pmf(P, k), F = (k) => D.cdf(P, k), G = (k) => (D.cola ? D.cola(P, k) : 1 - F(k - 1));
      pasos.push({ t: 'Función de probabilidad', html: D.general(P) });
      const entero = (k, nom) => lee(sc, k, nom, { entero: true }), [s0, s1] = D.soporte ? D.soporte(P) : [0, Infinity];
      const detalle = (k0, k1) => {
        // suma término a término si son pocos
        k0 = Math.max(k0, s0); k1 = Math.min(k1, s1);
        if (k1 - k0 > 6 || k1 < k0) return '';
        return '<br>' + Array.from({ length: k1 - k0 + 1 }, (_, i) => k0 + i).map((k) => `${D.formula(P, k)} = ${prob(f(k))}`).join('<br>');
      };
      let a, b, res, desc;
      if (tipo === 'igual') { a = b = entero('a', 'el valor k'); res = f(a); desc = `P(X = ${a})`; pasos.push({ t: desc, html: `${a < s0 || a > s1 ? `${desc} = 0, porque X no puede valer ${a}` : `${D.formula(P, a)} = <b>${prob(res)}</b>`}` }); }
      else if (tipo === 'entre' || tipo === 'centro') {
        if (tipo === 'centro') { const c = leeC(); a = Math.ceil(media - c - 1e-9); b = Math.floor(media + c + 1e-9); r.c = c; desc = `P(|X − μ| ≤ ${num(c)}) = P(${num(media - c)} ≤ X ≤ ${num(media + c)}) = P(${a} ≤ X ≤ ${b})`; }
        else { a = entero('a', 'el valor a'); b = entero('b', 'el valor b'); desc = `P(${a} ≤ X ≤ ${b})`; }
        if (b < a) throw new Error(tipo === 'centro' ? 'No hay ningún valor entero a esa distancia de la media' : 'b tiene que ser mayor o igual que a');
        res = a > media ? G(a) - G(b + 1) : F(b) - F(a - 1);
        pasos.push({ t: desc, html: `= P(X ≤ ${b}) − P(X ≤ ${a - 1}) = ${prob(F(b))} − ${prob(F(a - 1))} = <b>${prob(res)}</b>${detalle(a, b)}${tipo === 'centro' ? cheb(r.c) : ''}` });
      } else if (tipo === 'cuantil') {
        const p = probCuantil(sc, D);
        let k = Math.max(s0, Math.floor(D.rango(P)[0]));
        while (F(k) < p && k < 1e7) k++;
        while (k > s0 && F(k - 1) >= p) k--;
        pasos.push({ t: 'Cuantil', html: `P(X ≤ ${k - 1}) = ${prob(F(k - 1))} &lt; ${num(p)} y P(X ≤ ${k}) = ${prob(F(k))} ≥ ${num(p)} ⇒ k = <b>${k}</b>` });
        pasos.push({ t: 'Tabla de valores', html: tabla(D, P, (j) => j <= k, k) });
        Object.assign(r, { p, x: k, sombra: [-Infinity, k], discreta: true });
        return terminar(D, r);
      } else {
        a = entero('a', 'el valor k');
        const T = { menor: [-Infinity, a, `P(X ≤ ${a})`], menorE: [-Infinity, a - 1, `P(X < ${a}) = P(X ≤ ${a - 1})`], mayor: [a, Infinity, `P(X ≥ ${a}) = 1 − P(X ≤ ${a - 1})`], mayorE: [a + 1, Infinity, `P(X > ${a}) = 1 − P(X ≤ ${a})`] }[tipo];
        [a, b, desc] = T;
        res = isFinite(b) ? F(b) : G(a);
        const cuerpo = isFinite(b) ? `${b < 0 ? '' : `= Σ<sub>k=${s0}</sub><sup>${b}</sup> P(X = k) `}= <b>${prob(res)}</b>${b >= 0 ? detalle(0, b) : ''}` : `= 1 − ${prob(F(a - 1))} = <b>${prob(res)}</b>${a - 1 >= 0 ? detalle(0, a - 1) : ''}`;
        pasos.push({ t: desc, html: cuerpo });
      }
      // aproximaciones de clase
      const ev = intervalo(a, b);
      if (d === 'binomial' && P.n * P.p >= 5 && P.n * (1 - P.p) >= 5) {
        const s = Math.sqrt(varianza);
        pasos.push({ t: 'Aproximación por la normal (np ≥ 5 y nq ≥ 5)', html: `X ≈ N(np, √(npq)) = N(${num(media)}, ${num(s)}), con la corrección de continuidad (±0,5): ${intervalo(a - 0.5, b + 0.5)} ⇒ ≈ ${prob(porNormal(media, s, a, b))} (exacta: ${prob(res)})` });
      }
      if (d === 'binomial' && P.n >= 30 && P.p <= 0.1) {
        const L = { lambda: media }, Po = DIST.poisson, ap = (isFinite(b) ? Po.cdf(L, b) : 1) - (isFinite(a) ? Po.cdf(L, a - 1) : 0);
        pasos.push({ t: 'Aproximación por la Poisson (n ≥ 30 y p ≤ 0,1)', html: `X ≈ P(λ = np = ${num(media)}): P(${ev}) ≈ ${prob(ap)} (exacta: ${prob(res)})` });
      }
      if (d === 'poisson' && P.lambda >= 10) {
        const s = Math.sqrt(P.lambda);
        pasos.push({ t: 'Aproximación por la normal (λ ≥ 10)', html: `X ≈ N(λ, √λ) = N(${num(P.lambda)}, ${num(s)}), con la corrección de continuidad (±0,5): ${intervalo(a - 0.5, b + 0.5)} ⇒ ≈ ${prob(porNormal(P.lambda, s, a, b))} (exacta: ${prob(res)})` });
      }
      pasos.push({ t: 'Tabla de valores', html: tabla(D, P, (k) => k >= a && k <= b, isFinite(a) ? a : b) });
      Object.assign(r, { p: res, a, b, sombra: [a, b], discreta: true });
    }
    return terminar(D, r);
  }
  function terminar(D, r) {
    r.res = r.tipo === 'inverso' ? `${r.incog === 'mu' ? 'μ' : 'σ'} = ${num(r.valor)}` : r.tipo === 'cuantil' ? `${r.discreta ? 'k' : 'a'} = ${num(r.x)}` : r.tipo === 'critico' ? (r.c1 !== undefined ? `c₁ = ${num(r.c1)}, c₂ = ${num(r.c)}` : `c = ±${num(r.c)}`) : r.tipo === 'criticoU' ? `c = ${num(r.c)}` : `P = ${prob(r.p)}`;
    r.pct = ['cuantil', 'critico', 'criticoU', 'inverso'].includes(r.tipo) ? '' : `${num(100 * r.p, 4, 0)} %`;
    return r;
  }

  const ejemplos = [
    { clave: 'normal-menor', nombre: 'Normal: P(X ≤ 52) con N(50, 5)', sc: { dist: 'normal', mu: '50', sigma: '5', tipo: 'menor', a: '52' } },
    { clave: 'normal-entre', nombre: 'Normal: P(μ − σ ≤ X ≤ μ + σ)', sc: { dist: 'normal', mu: '0', sigma: '1', tipo: 'entre', a: '-1', b: '1' } },
    { clave: 'normal-centro', nombre: 'Normal: cociente intelectual a menos de 15 puntos de la media', sc: { dist: 'normal', mu: '100', sigma: '15', tipo: 'centro', cc: '15' } },
    { clave: 'normal-cuantil', nombre: 'Normal: nota que supera el 90 %', sc: { dist: 'normal', mu: '6', sigma: '1.5', tipo: 'cuantil', q: '0.9' } },
    { clave: 'normal-inverso', nombre: 'Normal: qué σ hace que solo el 5 % pase de 80', sc: { dist: 'normal', mu: '70', sigma: '5', tipo: 'inverso', incog: 'sigma', cola: 'mayor', a: '80', q: '0.05' } },
    { clave: 'z-critico', nombre: 'Valor crítico z para α = 0,05', sc: { dist: 'normal', mu: '0', sigma: '1', tipo: 'critico', alfa: '0.05' } },
    { clave: 'z-unilateral', nombre: 'Valor crítico unilateral z para α = 0,05', sc: { dist: 'normal', mu: '0', sigma: '1', tipo: 'criticoU', alfa: '0.05' } },
    { clave: 't-critico', nombre: 't de Student: valor crítico con 10 g. l.', sc: { dist: 't', nu: '10', tipo: 'critico', alfa: '0.05' } },
    { clave: 'chi2', nombre: 'χ² con 5 g. l.: P(χ² ≥ 11,07)', sc: { dist: 'chi2', k: '5', tipo: 'mayor', a: '11.07' } },
    { clave: 'chi2-critico', nombre: 'χ² con 10 g. l.: los dos valores críticos', sc: { dist: 'chi2', k: '10', tipo: 'critico', alfa: '0.05' } },
    { clave: 'f-critico', nombre: 'F de Snedecor: valor crítico F(5, 10)', sc: { dist: 'f', d1: '5', d2: '10', tipo: 'criticoU', alfa: '0.05' } },
    { clave: 'exponencial', nombre: 'Exponencial: dura más de 3 horas', sc: { dist: 'exponencial', lambda: '0.5', tipo: 'mayor', a: '3' } },
    { clave: 'uniforme', nombre: 'Uniforme: esperar más de 7 minutos entre 0 y 10', sc: { dist: 'uniforme', lo: '0', hi: '10', tipo: 'mayor', a: '7' } },
    { clave: 'binomial-igual', nombre: 'Binomial: 3 caras en 10 lanzamientos', sc: { dist: 'binomial', n: '10', p: '0.5', tipo: 'igual', a: '3' } },
    { clave: 'binomial-menor', nombre: 'Binomial: como mucho 2 defectuosas', sc: { dist: 'binomial', n: '20', p: '0.05', tipo: 'menor', a: '2' } },
    { clave: 'binomial-normal', nombre: 'Binomial grande y su aproximación normal', sc: { dist: 'binomial', n: '100', p: '0.3', tipo: 'entre', a: '25', b: '35' } },
    { clave: 'binomial-poisson', nombre: 'Binomial con p pequeña y su aproximación de Poisson', sc: { dist: 'binomial', n: '200', p: '0.02', tipo: 'menor', a: '3' } },
    { clave: 'poisson', nombre: 'Poisson: al menos 2 llamadas', sc: { dist: 'poisson', lambda: '3', tipo: 'mayor', a: '2' } },
    { clave: 'poisson-normal', nombre: 'Poisson con λ grande y su aproximación normal', sc: { dist: 'poisson', lambda: '25', tipo: 'entre', a: '20', b: '30' } },
    { clave: 'geometrica', nombre: 'Geométrica: 3 fallos antes del primer acierto', sc: { dist: 'geometrica', p: '0.2', tipo: 'igual', a: '3' } },
    { clave: 'hipergeometrica', nombre: 'Hipergeométrica: 2 defectuosas al sacar 4 de 20', sc: { dist: 'hipergeometrica', N: '20', K: '5', n: '4', tipo: 'igual', a: '2' } },
  ];

  /* ---------- Ejercicios al azar (modo práctica) ---------- */
  // devuelve { sc, enunciado } con números de clase; r = generador de números al azar
  function ejercicio(r = Math.random) {
    const ent = (a, b) => a + Math.floor(r() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(+x.toFixed(3)).replace('.', ',');
    const T = [
      () => { const mu = ent(5, 7), s = de([1, 1.5, 2]), a = c(mu + de([-1.5, -1, -0.5, 0.5, 1, 1.5, 2])); return { sc: { dist: 'normal', mu: String(mu), sigma: c(s), tipo: 'menor', a }, enunciado: `Las notas de un examen siguen una normal de media ${mu} y desviación típica ${c(s)}. ¿Qué proporción de alumnos saca menos de ${a}?` }; },
      () => { const mu = ent(20, 60) * 10, s = ent(2, 6) * 5, a = String(mu + ent(1, 4) * 5); return { sc: { dist: 'normal', mu: String(mu), sigma: String(s), tipo: 'mayor', a }, enunciado: `El peso de unas piezas sigue una normal de media ${mu} g y desviación típica ${s} g. ¿Qué probabilidad hay de que una pieza pese más de ${a} g?` }; },
      () => { const mu = ent(160, 180), s = ent(5, 10), a = mu - ent(2, 10), b = mu + ent(2, 10); return { sc: { dist: 'normal', mu: String(mu), sigma: String(s), tipo: 'entre', a: String(a), b: String(b) }, enunciado: `La estatura de los alumnos sigue una normal N(${mu}, ${s}) en cm. ¿Qué porcentaje mide entre ${a} y ${b} cm?` }; },
      () => { const mu = ent(5, 7), s = de([1, 1.5, 2]), q = de([0.8, 0.9, 0.95]); return { sc: { dist: 'normal', mu: String(mu), sigma: c(s), tipo: 'cuantil', q: c(q) }, enunciado: `Las notas siguen una normal N(${mu}; ${c(s)}). ¿Qué nota hay que sacar para estar por encima del ${Math.round(100 * q)} % de la clase?` }; },
      () => { const mu = ent(50, 100) * 10, a = mu + ent(2, 6) * 5, q = de([0.01, 0.02, 0.05]); return { sc: { dist: 'normal', mu: String(mu), sigma: '10', tipo: 'inverso', incog: 'sigma', cola: 'mayor', a: String(a), q: c(q) }, enunciado: `Una máquina llena botellas con una media de ${mu} ml. ¿Qué desviación típica puede tener como mucho para que solo el ${Math.round(100 * q)} % de las botellas pase de ${a} ml?` }; },
      () => { const p = de([0.05, 0.1, 0.2, 0.25, 0.3]), n = ent(8, 20), k = ent(0, Math.min(4, n)); return { sc: { dist: 'binomial', n: String(n), p: c(p), tipo: 'igual', a: String(k) }, enunciado: `El ${Math.round(100 * p)} % de las piezas de una fábrica es defectuoso. Si se eligen ${n} piezas al azar, ¿qué probabilidad hay de que exactamente ${k} sean defectuosas?` }; },
      () => { const p = de([0.05, 0.1, 0.2]), n = ent(10, 25), k = ent(1, 3); return { sc: { dist: 'binomial', n: String(n), p: c(p), tipo: 'menor', a: String(k) }, enunciado: `Un examen tipo test tiene ${n} preguntas y la probabilidad de acertar una al azar es ${c(p)}. ¿Qué probabilidad hay de acertar como mucho ${k}?` }; },
      () => { const l = ent(2, 8), k = ent(1, 4); return { sc: { dist: 'poisson', lambda: String(l), tipo: 'mayor', a: String(k) }, enunciado: `A una centralita llegan de media ${l} llamadas por minuto (Poisson). ¿Qué probabilidad hay de que en un minuto lleguen al menos ${k}?` }; },
      () => { const m = ent(2, 10), t = ent(1, 12); return { sc: { dist: 'exponencial', lambda: c(1 / m), tipo: 'mayor', a: String(t) }, enunciado: `La duración de una bombilla sigue una exponencial con media ${m} años (λ = 1/${m}). ¿Qué probabilidad hay de que dure más de ${t} años?` }; },
      () => { const nu = ent(5, 30), a = de([0.01, 0.05, 0.1]); return { sc: { dist: 't', nu: String(nu), tipo: 'critico', alfa: c(a) }, enunciado: `Halla el valor crítico bilateral de la t de Student con ${nu} grados de libertad para α = ${c(a)}.` }; },
      () => { const k = ent(3, 20), a = de([0.01, 0.05, 0.1]); return { sc: { dist: 'chi2', k: String(k), tipo: 'criticoU', alfa: c(a) }, enunciado: `Halla el valor de la χ² con ${k} grados de libertad que deja ${c(a)} a su derecha.` }; },
      () => { const N = ent(15, 30), K = ent(3, 8), n = ent(3, 6), k = ent(0, Math.min(2, K)); return { sc: { dist: 'hipergeometrica', N: String(N), K: String(K), n: String(n), tipo: 'igual', a: String(k) }, enunciado: `En una caja hay ${N} bombillas y ${K} están fundidas. Se sacan ${n} sin devolverlas. ¿Qué probabilidad hay de sacar exactamente ${k} fundidas?` }; },
    ];
    return de(T)();
  }

  return { DIST, tipos, calcular, ejemplos, ejercicio, Phi, gammaP, gammaQ, betaI, lnGamma, num, prob, cuantil, fCdf };
})();
if (typeof module !== 'undefined') module.exports = Estadistica;
