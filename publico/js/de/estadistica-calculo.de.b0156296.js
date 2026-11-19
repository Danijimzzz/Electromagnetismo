const Estadistica = (() => {
  const LANCZOS = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lnGamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lnGamma(1 - x);
    x -= 1;
    let a = 0.99999999999980993;
    const t = x + 7.5;
    LANCZOS.forEach((c, i) => { a += c / (x + i + 1); });
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
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

  const num = (x, d = 4, cero = 1e-15) => {
    if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
    if (x === 0 || Math.abs(x) < cero) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-4 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(Math.max(d, Math.ceil(Math.log10(a + 1)) + 1)));
    return s.replace('.', ',').replace('-', '−');
  };
  const prob = (p) => (p !== 0 && Math.abs(p) < 1e-4 ? num(p, 4, 0) : p.toFixed(4).replace('.', ',').replace('-', '−'));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom, { entero = false, min = -Infinity, minEx = false, max = Infinity, maxEx = false } = {}) {
    if (vacio(sc[k])) throw new Error(`${nom} fehlt`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine Zahl sein`);
    if (entero && !Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine ganze Zahl sein`);
    if (minEx ? v <= min : v < min) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss ${minEx ? 'größer als' : 'mindestens'} ${num(min)} sein`);
    if (maxEx ? v >= max : v > max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss ${maxEx ? 'kleiner als' : 'höchstens'} ${num(max)} sein`);
    return v;
  }


  function combBig(n, k) { k = Math.min(k, n - k); let r = 1n; for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i); return r; }
  const combTxt = (n, k) => { const c = combBig(n, k); return c < 10n ** 15n ? c.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : num(Number(c)); };
  const lnC = (n, k) => lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1);
  const fCdf = ({ d1, d2 }, x) => (x <= 0 ? 0 : betaI((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2));
  const hSop = ({ N, K, n }) => [Math.max(0, n - (N - K)), Math.min(n, K)];
  const hPmf = (P, k) => { const [lo, hi] = hSop(P); return !Number.isInteger(k) || k < lo || k > hi ? 0 : Math.exp(lnC(P.K, k) + lnC(P.N - P.K, P.n - k) - lnC(P.N, P.n)); };
  const hSuma = (P, a, b) => { const [lo, hi] = hSop(P); let s = 0; for (let k = Math.max(lo, Math.ceil(a)); k <= Math.min(hi, Math.floor(b)); k++) s += hPmf(P, k); return Math.min(1, s); };

  const DIST = {
    normal: {
      nombre: 'Normal N(μ, σ)', continua: true, params: [['mu', 'Mittelwert μ', {}], ['sigma', 'Standardabweichung σ', { min: 0, minEx: true }]],
      pdf: ({ mu, sigma }, x) => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)),
      cdf: ({ mu, sigma }, x) => Phi((x - mu) / sigma),
      sf: ({ mu, sigma }, x) => Phi(-(x - mu) / sigma),
      momentos: ({ mu, sigma }) => ({ media: mu, varianza: sigma * sigma }),
      rango: ({ mu, sigma }) => [mu - 4 * sigma, mu + 4 * sigma],
      simetrica: true, nombreX: 'X', etiqueta: (p) => `N(${num(p.mu)}, ${num(p.sigma)})`,
    },
    t: {
      nombre: 'Student-t', continua: true, params: [['nu', 'Freiheitsgrade ν', { min: 0, minEx: true }]],
      pdf: ({ nu }, x) => Math.exp(lnGamma((nu + 1) / 2) - lnGamma(nu / 2) - 0.5 * Math.log(nu * Math.PI) - ((nu + 1) / 2) * Math.log(1 + (x * x) / nu)),
      cdf: ({ nu }, x) => { const c = 0.5 * betaI(nu / (nu + x * x), nu / 2, 0.5); return x > 0 ? 1 - c : c; },
      sf: ({ nu }, x) => { const c = 0.5 * betaI(nu / (nu + x * x), nu / 2, 0.5); return x > 0 ? c : 1 - c; },
      momentos: ({ nu }) => ({ media: nu > 1 ? 0 : NaN, varianza: nu > 2 ? nu / (nu - 2) : nu > 1 ? Infinity : NaN }),
      rango: ({ nu }) => { const r = nu < 3 ? 8 : 5; return [-r, r]; },
      simetrica: true, nombreX: 'T', critico: (P) => `t<sub>${num(P.nu)}</sub>`, etiqueta: (p) => `t<sub>${num(p.nu)}</sub>`,
    },
    chi2: {
      nombre: 'Chi-Quadrat χ²', continua: true, params: [['k', 'Freiheitsgrade k', { min: 0, minEx: true }]],
      pdf: ({ k }, x) => (x <= 0 ? (x === 0 && k === 2 ? 0.5 : 0) : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lnGamma(k / 2))),
      cdf: ({ k }, x) => (x <= 0 ? 0 : gammaP(k / 2, x / 2)),
      sf: ({ k }, x) => (x <= 0 ? 1 : gammaQ(k / 2, x / 2)),
      momentos: ({ k }) => ({ media: k, varianza: 2 * k }),
      rango: ({ k }) => [0, k + 5 * Math.sqrt(2 * k) + 2],
      nombreX: 'χ²', critico: (P) => `χ<sup>2</sup><sub>${num(P.k)}</sub>`, etiqueta: (p) => `χ²<sub>${num(p.k)}</sub>`,
    },
    f: {
      nombre: 'F-Verteilung', continua: true, params: [['d1', 'Freiheitsgrade des Zählers d₁', { min: 0, minEx: true }], ['d2', 'Freiheitsgrade des Nenners d₂', { min: 0, minEx: true }]],
      pdf: ({ d1, d2 }, x) => (x <= 0 ? 0 : Math.exp(0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) - Math.log(x) - (lnGamma(d1 / 2) + lnGamma(d2 / 2) - lnGamma((d1 + d2) / 2)))),
      cdf: fCdf,
      sf: ({ d1, d2 }, x) => (x <= 0 ? 1 : betaI(d2 / (d2 + d1 * x), d2 / 2, d1 / 2)),
      momentos: ({ d1, d2 }) => ({ media: d2 > 2 ? d2 / (d2 - 2) : NaN, varianza: d2 > 4 ? (2 * d2 * d2 * (d1 + d2 - 2)) / (d1 * (d2 - 2) ** 2 * (d2 - 4)) : d2 > 2 ? Infinity : NaN }),
      rango: (P) => { let hi = 2; while (fCdf(P, hi) < 0.995 && hi < 1e5) hi *= 2; return [0, hi]; },
      nombreX: 'F', critico: (P) => `F<sub>${num(P.d1)}, ${num(P.d2)}</sub>`, etiqueta: (p) => `F<sub>${num(p.d1)}, ${num(p.d2)}</sub>`,
      nota: () => 'F = (χ²<sub>d₁</sub>/d₁)/(χ²<sub>d₂</sub>/d₂): Sie wird zum Vergleich zweier Varianzen und in der ANOVA verwendet.',
    },
    exponencial: {
      nombre: 'Exponential Exp(λ)', continua: true, params: [['lambda', 'Rate λ', { min: 0, minEx: true }]],
      pdf: ({ lambda }, x) => (x < 0 ? 0 : lambda * Math.exp(-lambda * x)),
      cdf: ({ lambda }, x) => (x <= 0 ? 0 : -Math.expm1(-lambda * x)),
      sf: ({ lambda }, x) => (x <= 0 ? 1 : Math.exp(-lambda * x)),
      inv: ({ lambda }, p) => -Math.log1p(-p) / lambda,
      invTxt: () => '1 − e<sup>−λa</sup> = p ⇒ a = −ln(1 − p)/λ',
      momentos: ({ lambda }) => ({ media: 1 / lambda, varianza: 1 / (lambda * lambda) }),
      rango: ({ lambda }) => [0, 6 / lambda],
      nombreX: 'X', etiqueta: (p) => `Exp(${num(p.lambda)})`, nota: () => 'F(x) = 1 − e<sup>−λx</sup>. Sie hat kein Gedächtnis: P(X ≥ s + t | X ≥ s) = P(X ≥ t).',
    },
    uniforme: {
      nombre: 'Stetige Gleichverteilung U(a, b)', continua: true, params: [['lo', 'Minimum (Endpunkt a)', {}], ['hi', 'Maximum (Endpunkt b)', {}]],
      valida: ({ lo, hi }) => (hi > lo ? '' : 'Das Maximum muss größer als das Minimum sein'),
      pdf: ({ lo, hi }, x) => (x < lo || x > hi ? 0 : 1 / (hi - lo)),
      cdf: ({ lo, hi }, x) => Math.min(1, Math.max(0, (x - lo) / (hi - lo))),
      inv: ({ lo, hi }, p) => lo + p * (hi - lo),
      invTxt: () => '(a − min)/(max − min) = p ⇒ a = min + p·(max − min)',
      momentos: ({ lo, hi }) => ({ media: (lo + hi) / 2, varianza: (hi - lo) ** 2 / 12 }),
      rango: ({ lo, hi }) => [lo - 0.15 * (hi - lo), hi + 0.15 * (hi - lo)],
      nombreX: 'X', etiqueta: (p) => `U(${num(p.lo)}, ${num(p.hi)})`, nota: (P) => `F(x) = (x − ${num(P.lo)})/(${num(P.hi)} − ${num(P.lo)}) zwischen den beiden Endpunkten: Die Wahrscheinlichkeit ist proportional zur Länge des Abschnitts.`,
    },
    binomial: {
      nombre: 'Binomial B(n, p)', continua: false, params: [['n', 'Anzahl der Versuche n', { entero: true, min: 1, max: 100000 }], ['p', 'Erfolgswahrscheinlichkeit p', { min: 0, max: 1 }]],
      pmf: ({ n, p }, k) => {
        if (k < 0 || k > n || !Number.isInteger(k)) return 0;
        if (p === 0) return k === 0 ? 1 : 0;
        if (p === 1) return k === n ? 1 : 0;
        return Math.exp(lnC(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
      },
      cdf: (P, k) => { const { n, p } = P; if (k < 0) return 0; if (k >= n) return 1; if (p === 0) return 1; if (p === 1) return 0; return betaI(1 - p, n - Math.floor(k), Math.floor(k) + 1); },
      cola: ({ n, p }, k) => { k = Math.ceil(k); if (k <= 0) return 1; if (k > n) return 0; if (p === 0) return 0; if (p === 1) return 1; return betaI(p, k, n - k + 1); },
      soporte: ({ n }) => [0, n],
      momentos: ({ n, p }) => ({ media: n * p, varianza: n * p * (1 - p) }),
      rango: ({ n, p }) => { const m = n * p, s = Math.sqrt(n * p * (1 - p)); return [Math.max(0, Math.floor(m - 5 * s - 1)), Math.min(n, Math.ceil(m + 5 * s + 1))]; },
      nombreX: 'X', etiqueta: (p) => `B(${num(p.n)}, ${num(p.p)})`,
      formula: ({ n, p }, k) => `P(X = ${k}) = C(${n}, ${k})·${num(p)}<sup>${k}</sup>·${num(1 - p)}<sup>${n - k}</sup> = ${combTxt(n, k)}·${num(p)}<sup>${k}</sup>·${num(1 - p)}<sup>${n - k}</sup>`,
      general: ({ p }) => `P(X = k) = C(n, k)·p<sup>k</sup>·q<sup>n−k</sup>, mit q = 1 − p = ${num(1 - p)} und C(n, k) = n! / (k! (n − k)!)`,
    },
    poisson: {
      nombre: 'Poisson P(λ)', continua: false, params: [['lambda', 'Mittelwert λ', { min: 0, minEx: true, max: 1e6 }]],
      pmf: ({ lambda }, k) => (k < 0 || !Number.isInteger(k) ? 0 : Math.exp(-lambda + k * Math.log(lambda) - lnGamma(k + 1))),
      cdf: ({ lambda }, k) => (k < 0 ? 0 : gammaQ(Math.floor(k) + 1, lambda)),
      cola: ({ lambda }, k) => { k = Math.ceil(k); return k <= 0 ? 1 : gammaP(k, lambda); },
      momentos: ({ lambda }) => ({ media: lambda, varianza: lambda }),
      rango: ({ lambda }) => [Math.max(0, Math.floor(lambda - 5 * Math.sqrt(lambda) - 1)), Math.ceil(lambda + 5 * Math.sqrt(lambda) + 3)],
      nombreX: 'X', etiqueta: (p) => `P(${num(p.lambda)})`,
      formula: ({ lambda }, k) => `P(X = ${k}) = e<sup>−${num(lambda)}</sup>·${num(lambda)}<sup>${k}</sup> / ${k}!`,
      general: () => 'P(X = k) = e<sup>−λ</sup>·λ<sup>k</sup> / k!, für k = 0, 1, 2…',
    },
    geometrica: {
      nombre: 'Geometrisch G(p)', continua: false, params: [['p', 'Erfolgswahrscheinlichkeit p', { min: 0, minEx: true, max: 1 }]],
      pmf: ({ p }, k) => (k < 0 || !Number.isInteger(k) ? 0 : p === 1 ? (k === 0 ? 1 : 0) : Math.exp(k * Math.log1p(-p)) * p),
      cdf: ({ p }, k) => (k < 0 ? 0 : p === 1 ? 1 : -Math.expm1((Math.floor(k) + 1) * Math.log1p(-p))),
      cola: ({ p }, k) => { k = Math.ceil(k); return k <= 0 ? 1 : p === 1 ? 0 : Math.exp(k * Math.log1p(-p)); },
      momentos: ({ p }) => ({ media: (1 - p) / p, varianza: (1 - p) / (p * p) }),
      rango: ({ p }) => [0, p === 1 ? 3 : Math.max(5, Math.ceil(Math.log(0.002) / Math.log1p(-p)))],
      nombreX: 'X', etiqueta: (p) => `G(${num(p.p)})`,
      formula: ({ p }, k) => `P(X = ${k}) = ${num(1 - p)}<sup>${k}</sup>·${num(p)}`,
      general: ({ p }) => `X = Anzahl der Misserfolge vor dem ersten Erfolg: P(X = k) = q<sup>k</sup>·p, mit q = 1 − p = ${num(1 - p)}, für k = 0, 1, 2… Zählt man die Versuche bis zum ersten Erfolg (einschließlich), ist Y = X + 1.`,
    },
    hipergeometrica: {
      nombre: 'Hypergeometrisch H(N, K, n)', continua: false,
      params: [['N', 'Umfang der Grundgesamtheit N', { entero: true, min: 1, max: 1e6 }], ['K', 'Erfolge in der Grundgesamtheit K', { entero: true, min: 0 }], ['n', 'Ziehungen ohne Zurücklegen n', { entero: true, min: 1 }]],
      valida: ({ N, K, n }) => (K > N ? 'Die Erfolge K dürfen nicht mehr sein als die Grundgesamtheit N' : n > N ? 'Es können nicht mehr Elemente (n) gezogen werden, als vorhanden sind (N)' : ''),
      pmf: hPmf,
      cdf: (P, k) => hSuma(P, -Infinity, k),
      cola: (P, k) => hSuma(P, k, Infinity),
      soporte: hSop,
      momentos: ({ N, K, n }) => ({ media: (n * K) / N, varianza: N > 1 ? n * (K / N) * (1 - K / N) * ((N - n) / (N - 1)) : 0 }),
      rango: hSop,
      nombreX: 'X', etiqueta: (p) => `H(${num(p.N)}, ${num(p.K)}, ${num(p.n)})`,
      formula: ({ N, K, n }, k) => `P(X = ${k}) = C(${K}, ${k})·C(${N - K}, ${n - k}) / C(${N}, ${n}) = ${combTxt(K, k)}·${combTxt(N - K, n - k)} / ${combTxt(N, n)}`,
      general: () => 'X = Anzahl der Erfolge beim Ziehen von n Elementen ohne Zurücklegen aus einer Grundgesamtheit von N mit K Erfolgen: P(X = k) = C(K, k)·C(N − K, n − k) / C(N, n)',
    },
    gamma: {
      nombre: 'Gamma Γ(α, β)', continua: true, params: [['forma', 'Form α', { min: 0, minEx: true }], ['tasa', 'Rate β', { min: 0, minEx: true }]],
      pdf: ({ forma, tasa }, x) => (x < 0 ? 0 : x === 0 ? (forma < 1 ? Infinity : forma === 1 ? tasa : 0) : Math.exp(forma * Math.log(tasa) + (forma - 1) * Math.log(x) - tasa * x - lnGamma(forma))),
      cdf: ({ forma, tasa }, x) => (x <= 0 ? 0 : gammaP(forma, tasa * x)),
      sf: ({ forma, tasa }, x) => (x <= 0 ? 1 : gammaQ(forma, tasa * x)),
      momentos: ({ forma, tasa }) => ({ media: forma / tasa, varianza: forma / (tasa * tasa) }),
      rango: ({ forma, tasa }) => [0, (forma + 6 * Math.sqrt(forma) + 2) / tasa],
      nombreX: 'X', etiqueta: (p) => `Γ(${num(p.forma)}, ${num(p.tasa)})`,
      nota: () => 'f(x) = β<sup>α</sup>x<sup>α−1</sup>e<sup>−βx</sup>/Γ(α). Für ganzzahliges α ist sie die Zeit bis zum α-ten Ereignis eines Poisson-Prozesses mit Rate β; mit α = 1 ist sie die Exponentialverteilung; die χ² ist eine Gamma mit α = k/2 und β = 1/2.',
    },
    beta: {
      nombre: 'Beta Β(α, β)', continua: true, params: [['al', 'Form α', { min: 0, minEx: true }], ['be', 'Form β', { min: 0, minEx: true }]],
      pdf: ({ al, be }, x) => (x < 0 || x > 1 ? 0 : x === 0 ? (al < 1 ? Infinity : al === 1 ? be : 0) : x === 1 ? (be < 1 ? Infinity : be === 1 ? al : 0) : Math.exp(lnGamma(al + be) - lnGamma(al) - lnGamma(be) + (al - 1) * Math.log(x) + (be - 1) * Math.log1p(-x))),
      cdf: ({ al, be }, x) => (x <= 0 ? 0 : x >= 1 ? 1 : betaI(x, al, be)),
      sf: ({ al, be }, x) => (x <= 0 ? 1 : x >= 1 ? 0 : betaI(1 - x, be, al)),
      momentos: ({ al, be }) => ({ media: al / (al + be), varianza: (al * be) / ((al + be) ** 2 * (al + be + 1)) }),
      rango: () => [0, 1],
      nombreX: 'X', etiqueta: (p) => `Β(${num(p.al)}, ${num(p.be)})`,
      nota: () => 'Sie lebt auf [0, 1]: Sie eignet sich zur Modellierung von Anteilen und unbekannten Wahrscheinlichkeiten. Mit α = β = 1 ist sie die Gleichverteilung.',
    },
    lognormal: {
      nombre: 'Lognormal LN(μ, σ)', continua: true, params: [['mu', 'Mittelwert μ von ln X', {}], ['sigma', 'Standardabweichung σ von ln X', { min: 0, minEx: true }]],
      pdf: ({ mu, sigma }, x) => (x <= 0 ? 0 : Math.exp(-0.5 * ((Math.log(x) - mu) / sigma) ** 2) / (x * sigma * Math.sqrt(2 * Math.PI))),
      cdf: ({ mu, sigma }, x) => (x <= 0 ? 0 : Phi((Math.log(x) - mu) / sigma)),
      sf: ({ mu, sigma }, x) => (x <= 0 ? 1 : Phi(-(Math.log(x) - mu) / sigma)),
      momentos: ({ mu, sigma }) => ({ media: Math.exp(mu + (sigma * sigma) / 2), varianza: Math.expm1(sigma * sigma) * Math.exp(2 * mu + sigma * sigma) }),
      rango: ({ mu, sigma }) => [0, Math.exp(mu + 3 * sigma)],
      nombreX: 'X', etiqueta: (p) => `LN(${num(p.mu)}, ${num(p.sigma)})`,
      nota: () => 'X ist lognormalverteilt, wenn ln X normalverteilt ist N(μ, σ): P(X ≤ a) = Φ((ln a − μ)/σ). Sie tritt bei Partikelgrößen, Einkommen oder Reparaturzeiten auf. Die Parameter μ und σ sind die von ln X, nicht Mittelwert und Standardabweichung von X.',
    },
    weibull: {
      nombre: 'Weibull W(k, λ)', continua: true, params: [['forma', 'Form k', { min: 0, minEx: true }], ['escala', 'Skala λ', { min: 0, minEx: true }]],
      pdf: ({ forma, escala }, x) => (x < 0 ? 0 : x === 0 ? (forma < 1 ? Infinity : forma === 1 ? 1 / escala : 0) : (forma / escala) * (x / escala) ** (forma - 1) * Math.exp(-((x / escala) ** forma))),
      cdf: ({ forma, escala }, x) => (x <= 0 ? 0 : -Math.expm1(-((x / escala) ** forma))),
      sf: ({ forma, escala }, x) => (x <= 0 ? 1 : Math.exp(-((x / escala) ** forma))),
      inv: ({ forma, escala }, p) => escala * (-Math.log1p(-p)) ** (1 / forma),
      invTxt: () => '1 − e<sup>−(a/λ)<sup>k</sup></sup> = p ⇒ a = λ·(−ln(1 − p))<sup>1/k</sup>',
      momentos: ({ forma, escala }) => { const g = (z) => Math.exp(lnGamma(z)); return { media: escala * g(1 + 1 / forma), varianza: escala * escala * (g(1 + 2 / forma) - g(1 + 1 / forma) ** 2) }; },
      rango: ({ forma, escala }) => [0, escala * Math.max(1.5, (-Math.log(0.002)) ** (1 / forma))],
      nombreX: 'X', etiqueta: (p) => `W(${num(p.forma)}, ${num(p.escala)})`,
      nota: () => 'F(x) = 1 − e<sup>−(x/λ)<sup>k</sup></sup>. Sie ist die Verteilung von Lebensdauern und Ausfällen: k &lt; 1 Frühausfälle, k = 1 Exponential (gedächtnislos), k &gt; 1 Verschleiß.',
    },
    nbinomial: {
      nombre: 'Negativ binomial NB(r, p)', continua: false, params: [['r', 'Erwartete Erfolge r', { entero: true, min: 1, max: 100000 }], ['p', 'Erfolgswahrscheinlichkeit p', { min: 0, minEx: true, max: 1 }]],
      pmf: ({ r, p }, k) => (k < 0 || !Number.isInteger(k) ? 0 : p === 1 ? (k === 0 ? 1 : 0) : Math.exp(lnC(k + r - 1, k) + r * Math.log(p) + k * Math.log1p(-p))),
      cdf: ({ r, p }, k) => (k < 0 ? 0 : p === 1 ? 1 : betaI(p, r, Math.floor(k) + 1)),
      cola: ({ r, p }, k) => { k = Math.ceil(k); return k <= 0 ? 1 : p === 1 ? 0 : betaI(1 - p, k, r); },
      momentos: ({ r, p }) => ({ media: (r * (1 - p)) / p, varianza: (r * (1 - p)) / (p * p) }),
      rango: ({ r, p }) => { const m = (r * (1 - p)) / p, s = Math.sqrt((r * (1 - p)) / (p * p)); return [Math.max(0, Math.floor(m - 4 * s)), Math.ceil(m + 6 * s + 3)]; },
      nombreX: 'X', etiqueta: (p) => `BN(${num(p.r)}, ${num(p.p)})`,
      formula: ({ r, p }, k) => `P(X = ${k}) = C(${k + r - 1}, ${k})·${num(p)}<sup>${r}</sup>·${num(1 - p)}<sup>${k}</sup> = ${combTxt(k + r - 1, k)}·${num(p)}<sup>${r}</sup>·${num(1 - p)}<sup>${k}</sup>`,
      general: ({ r, p }) => `X = Anzahl der Misserfolge vor dem ${r}. Erfolg: P(X = k) = C(k + r − 1, k)·p<sup>r</sup>·q<sup>k</sup>, mit q = 1 − p = ${num(1 - p)}, für k = 0, 1, 2… Mit r = 1 ist sie die geometrische Verteilung.`,
    },
  };
  const CRITICOS =['normal', 't', 'chi2', 'f'];
  const TIPOS_C = [['menor', 'P(X ≤ a)'], ['mayor', 'P(X ≥ a)'], ['entre', 'P(a ≤ X ≤ b)'], ['centro', 'P(|X − μ| ≤ c): im Abstand c vom Mittelwert'], ['cuantil', 'Quantil: a mit P(X ≤ a) = p'], ['critico', 'Zweiseitiger kritischer Wert (α)'], ['criticoU', 'Einseitiger kritischer Wert (α im rechten Rand)'], ['inverso', 'μ oder σ aus einer Wahrscheinlichkeit bestimmen'], ['tcl', 'Zentraler Grenzwertsatz: Stichprobenmittel']];
  const TIPOS_D = [['igual', 'P(X = k)'], ['menor', 'P(X ≤ k)'], ['menorE', 'P(X < k)'], ['mayor', 'P(X ≥ k)'], ['mayorE', 'P(X > k)'], ['entre', 'P(a ≤ X ≤ b)'], ['centro', 'P(|X − μ| ≤ c): im Abstand c vom Mittelwert'], ['cuantil', 'Quantil: kleinstes k mit P(X ≤ k) ≥ p'], ['tcl', 'Zentraler Grenzwertsatz: Stichprobenmittel']];
  const tipos = (d) => (DIST[d].continua ? TIPOS_C.filter(([k]) => (k !== 'critico' && k !== 'criticoU') || CRITICOS.includes(d)).filter(([k]) => k !== 'inverso' || d === 'normal') : TIPOS_D);

  function cuantil(D, P, p) {
    if (D.inv) return D.inv(P, p);
    let [lo, hi] = D.rango(P);
    while (D.cdf(P, lo) > p) lo -= Math.max(1, Math.abs(hi - lo));
    while (D.cdf(P, hi) < p) hi += Math.max(1, Math.abs(hi - lo));
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (D.cdf(P, m) < p) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  const N01 = { mu: 0, sigma: 1 };
  const probCuantil = (sc, D) => lee(vacio(sc.q) && !D.params.some(([k]) => k === 'p') ? { q: sc.p } : sc, 'q', 'la probabilidad p', { min: 0, minEx: true, max: 1, maxEx: true });

  function inverso(sc, P, incog, pasos) {
    const a = lee(sc, 'a', 'el valor a'), q = probCuantil(sc, DIST.normal), mayor = sc.cola === 'mayor', pIzq = mayor ? 1 - q : q, z = cuantil(DIST.normal, N01, pIzq);
    const ev = `P(X ${mayor ? '≥' : '≤'} ${num(a)}) = ${num(q)}`;
    let h = `${ev}${mayor ? ` ⇒ P(X ≤ ${num(a)}) = 1 − ${num(q)} = ${num(pIzq)}` : ''}.<br>Durch Standardisieren, Φ((a − μ)/σ) = ${num(pIzq)} ⇒ (a − μ)/σ = z = ${num(z)}.<br>`;
    if (incog === 'mu') { P.mu = a - z * P.sigma; h += `Auflösen ergibt μ = a − zσ = ${num(a)} − ${num(z)}·${num(P.sigma)} = <b>${num(P.mu)}</b>`; }
    else {
      if (Math.abs(z) < 1e-12) throw new Error('Mit dieser Wahrscheinlichkeit ist a genau der Mittelwert: σ kann beliebig sein');
      const s = (a - P.mu) / z;
      if (!(s > 0)) throw new Error(`Es gibt kein mögliches σ: Mit ${ev.replace(/<[^>]+>/g, '')} muss a ${z > 0 ? 'größer' : 'kleiner'} als μ = ${num(P.mu).replace(/<[^>]+>/g, '')} sein`);
      P.sigma = s; h += `Auflösen ergibt σ = (a − μ)/z = (${num(a)} − ${num(P.mu)})/${num(z)} = <b>${num(s)}</b>`;
    }
    pasos.push({ t: `${incog === 'mu' ? 'μ' : 'σ'} bestimmen`, html: h });
    return { a, q, z, mayor };
  }

  function tabla(D, P, enEv, centro) {
    const [r0, r1] = D.rango(P), [s0, s1] = D.soporte ? D.soporte(P) : [0, Infinity];
    let lo = Math.max(s0, Math.floor(r0)), hi = Math.min(s1, Math.ceil(r1));
    if (hi - lo > 40) { const c = Math.round(isFinite(centro) ? Math.min(Math.max(centro, lo), hi) : (lo + hi) / 2); lo = Math.max(lo, c - 20); hi = lo + 40; }
    const G = (k) => (D.cola ? D.cola(P, k) : 1 - D.cdf(P, k - 1));
    const filas = []; for (let k = lo; k <= hi; k++) { const b = (x) => (enEv(k) ? `<b>${x}</b>` : x); filas.push(`<tr><td>${b(k)}</td><td>${b(prob(D.pmf(P, k)))}</td><td>${prob(D.cdf(P, k))}</td><td>${prob(G(k))}</td></tr>`); }
    return `<div class="tabla-scroll"><table class="tabla"><thead><tr><th>k</th><th>P(X = k)</th><th>P(X ≤ k)</th><th>P(X ≥ k)</th></tr></thead><tbody>${filas.join('')}</tbody></table></div><button type="button" class="btn" data-copiar>Tabelle kopieren</button>`;
  }

  const porNormal = (m, s, a, b) => (isFinite(b) ? Phi((b + 0.5 - m) / s) : 1) - (isFinite(a) ? Phi((a - 0.5 - m) / s) : 0);
  const intervalo = (a, b) => `${isFinite(a) ? `${num(a)} ≤ X` : 'X'}${isFinite(b) ? ` ≤ ${num(b)}` : ''}`;

  const sinCorreccion = (m, s, a, b) => (isFinite(b) ? Phi((b - m) / s) : 1) - (isFinite(a) ? Phi((a - m) / s) : 0);
  function comparaAprox(r, exacta, filas) {
    r.aprox = (r.aprox || []).concat(filas.map(([nombre, p]) => ({ nombre, p, error: p - exacta })));
    return `<div class="tabla-scroll"><table class="tabla"><thead><tr><th></th><th>Wahrscheinlichkeit</th><th>Fehler</th><th>Relativer Fehler</th></tr></thead><tbody><tr><td>Exakt</td><td><b>${prob(exacta)}</b></td><td>—</td><td>—</td></tr>${filas.map(([nombre, p]) => `<tr><td>${nombre}</td><td>${prob(p)}</td><td>${prob(p - exacta)}</td><td>${exacta > 0 ? `${num((100 * (p - exacta)) / exacta, 3)} %` : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  const azarCon = (semilla) => { let a = (semilla >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  function generador(D, P, r) {
    if (D.continua) { const M = 1000, Q = Array.from({ length: M }, (_, i) => cuantil(D, P, (i + 0.5) / M)); return () => Q[Math.floor(r() * M)]; }
    const [s0] = D.soporte ? D.soporte(P) : [0], ks = [], Fs = [];
    for (let k = s0, F = 0; ks.length < 20000; k++) { F += D.pmf(P, k); ks.push(k); Fs.push(F); if (F > 1 - 1e-10) break; }
    return () => { const u = r() * Fs[Fs.length - 1]; let lo = 0, hi = Fs.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (Fs[m] < u) lo = m + 1; else hi = m; } return ks[lo]; };
  }
  const MUESTRAS = 2000;
  function tcl(sc, D, P, r) {
    const { media, varianza, pasos } = r, X = D.nombreX;
    if (!isFinite(media) || !isFinite(varianza)) throw new Error('Der zentrale Grenzwertsatz setzt voraus, dass die Verteilung endlichen Mittelwert und endliche Varianz hat, und diese hat sie nicht');
    const n = lee(sc, 'nm', 'der Umfang jeder Stichprobe n', { entero: true, min: 1, max: 500 }), sigma = Math.sqrt(varianza), et = sigma / Math.sqrt(n);
    const semilla = Number.isFinite(+sc.semilla) ? Math.floor(+sc.semilla) : 1, una = generador(D, P, azarCon(semilla + 1));
    const medias = Array.from({ length: MUESTRAS }, () => { let t = 0; for (let i = 0; i < n; i++) t += una(); return t / n; });
    const mSim = medias.reduce((a, b) => a + b, 0) / MUESTRAS, sSim = Math.sqrt(medias.reduce((a, b) => a + (b - mSim) ** 2, 0) / (MUESTRAS - 1));
    const dentro = medias.filter((m) => Math.abs(m - media) <= 1.96 * et).length / MUESTRAS;
    pasos.push({ t: 'Mittelwert einer Stichprobe', html: `Es werden Stichproben von ${n} Werten von ${X} gezogen und von jeder der Mittelwert X̄ berechnet. Der Mittelwert von X̄ ist derselbe, μ = ${num(media)}, und seine Standardabweichung (der Standardfehler) ist σ/√n = ${num(sigma)}/√${n} = <b>${num(et)}</b>: Je größer die Stichprobe, desto weniger weicht ihr Mittelwert von μ ab.` });
    pasos.push({ t: 'Zentraler Grenzwertsatz', html: D === DIST.normal
      ? `Da ${X} bereits normalverteilt ist, ist das Stichprobenmittel für jedes n exakt normalverteilt: X̄ ~ N(${num(media)}, ${num(et)}).`
      : `Welche Form ${X} auch hat: Ist n groß, ist das Stichprobenmittel näherungsweise normalverteilt: X̄ ≈ N(μ, σ/√n) = <b>N(${num(media)}, ${num(et)})</b>. ${n >= 30 ? 'Mit n ≥ 30 gilt die Näherung im Unterricht meist als gut.' : 'Mit n &lt; 30 ist die Näherung nur gut, wenn die Ausgangsverteilung nicht stark schief ist: Erhöhe n und beobachte, wie sich das Histogramm der Glockenkurve annähert.'}` });
    pasos.push({ t: `Simulation von ${MUESTRAS} Stichproben`, html: `Mittelwert der ${MUESTRAS} Mittelwerte: ${num(mSim)} (Theorie: ${num(media)}).<br>Standardabweichung der Mittelwerte: ${num(sSim)} (Theorie: ${num(et)}).<br>Mittelwerte innerhalb von μ ± 1,96·σ/√n = [${num(media - 1.96 * et)}, ${num(media + 1.96 * et)}]: ${num(100 * dentro, 3)} % (bei der Normalverteilung 95 %).` });
    Object.assign(r, { tcl: { n, et, medias, mSim, sSim, dentro, semilla }, sombra: [media - 1.96 * et, media + 1.96 * et] });
    return terminar(D, r);
  }

  function comparacion(sc, r, D) {
    const d2 = sc.comp, D2 = DIST[d2], P2 = {}, lee2 = Object.fromEntries(D2.params.map(([k]) => [k, sc[`c_${k}`]]));
    try { for (const [k, nom, op] of D2.params) P2[k] = lee(lee2, k, nom.toLowerCase(), op); const malo = D2.valida?.(P2); if (malo) throw new Error(malo); } catch (e) { throw new Error(`In der Vergleichsverteilung: ${e.message[0].toLowerCase() + e.message.slice(1)}`); }
    const m2 = D2.momentos(P2), dt = (v) => (isFinite(v) ? num(Math.sqrt(v)) : 'no definida'), mm = (v) => (isNaN(v) ? 'no definida' : num(v));
    let h = `<div class="tabla-scroll"><table class="tabla"><thead><tr><th></th><th>${D.etiqueta(r.P)}</th><th>${D2.etiqueta(P2)}</th></tr></thead><tbody><tr><td>Mittelwert</td><td>${mm(r.media)}</td><td>${mm(m2.media)}</td></tr><tr><td>Varianz</td><td>${mm(r.varianza)}</td><td>${mm(m2.varianza)}</td></tr><tr><td>Standardabweichung</td><td>${dt(r.varianza)}</td><td>${dt(m2.varianza)}</td></tr>`;
    const c = { dist: d2, P: P2, media: m2.media, varianza: m2.varianza };
    if (['igual', 'menor', 'menorE', 'mayor', 'mayorE', 'entre', 'centro'].includes(r.tipo)) {
      const [a, b] = r.sombra;
      if (D2.continua) c.p = (isFinite(b) ? D2.cdf(P2, b) : 1) - (isFinite(a) ? D2.cdf(P2, a) : 0);
      else c.p = (isFinite(b) ? D2.cdf(P2, Math.floor(b + 1e-9)) : 1) - (isFinite(a) ? D2.cdf(P2, Math.ceil(a - 1e-9) - 1) : 0);
      h += `<tr><td>P(${isFinite(a) ? `${num(a)} ≤ ` : ''}X${isFinite(b) ? ` ≤ ${num(b)}` : ''})</td><td><b>${prob(r.p)}</b></td><td>${prob(c.p)}</td></tr>`;
    }
    r.pasos.push({ t: `Vergleich mit ${D2.etiqueta(P2)}`, html: `${h}</tbody></table></div>${!D.continua && D2.continua && c.p !== undefined ? 'Die zweite ist stetig und wird hier ohne Stetigkeitskorrektur zwischen denselben Werten verwendet.' : ''}` });
    r.comp = c;
  }

  function calcular(sc) {
    const d = DIST[sc.dist] ? sc.dist : 'normal', D = DIST[d];
    const lista = tipos(d), tipo = lista.some(([k]) => k === sc.tipo) ? sc.tipo : lista[0][0];
    const incog = tipo === 'inverso' ? (sc.incog === 'sigma' ? 'sigma' : 'mu') : null, P = {}, pasos = [];
    for (const [k, nom, op] of D.params) if (k !== incog) P[k] = lee(sc, k, nom.toLowerCase(), op);
    const malo = D.valida?.(P); if (malo) throw new Error(malo);
    const inv = incog ? inverso(sc, P, incog, pasos) : null;
    const { media, varianza } = D.momentos(P), X = D.nombreX;
    pasos.push({ t: 'Verteilung', html: `${X} ~ ${D.etiqueta(P)}: Mittelwert ${isNaN(media) ? 'nicht definiert' : num(media)}, Varianz ${isNaN(varianza) ? 'nicht definiert' : num(varianza)}${isFinite(varianza) ? `, Standardabweichung ${num(Math.sqrt(varianza))}` : ''}` });
    const r = { dist: d, tipo, P, media, varianza, pasos };
    if (tipo === 'tcl') return tcl(sc, D, P, r);
    const leeC = () => { if (!isFinite(media)) throw new Error('Diese Verteilung hat keinen Mittelwert: Der Abstand zu ihm kann nicht gemessen werden'); return lee(sc, 'cc', 'la distancia c', { min: 0 }); };
    const cheb = (c) => (isFinite(varianza) && c > Math.sqrt(varianza) ? `<br>Zum Vergleich garantiert die Tschebyscheff-Ungleichung mindestens 1 − σ²/c² = 1 − ${num(varianza)}/${num(c)}<sup>2</sup> = ${prob(1 - varianza / (c * c))} für jede Verteilung.` : '');
    if (D.continua) {
      const F = (x) => D.cdf(P, x), S = (x) => (D.sf ? D.sf(P, x) : 1 - D.cdf(P, x)), nota = D.nota ? ` &nbsp;(${D.nota(P)})` : '';
      if (inv) {
        Object.assign(r, { p: inv.q, a: inv.a, incog, valor: P[incog], sombra: inv.mayor ? [inv.a, Infinity] : [-Infinity, inv.a] });
        pasos.push({ t: 'Kontrolle', html: `Mit ${incog === 'mu' ? `μ = ${num(P.mu)}` : `σ = ${num(P.sigma)}`} ist P(X ${inv.mayor ? '≥' : '≤'} ${num(inv.a)}) = ${prob(inv.mayor ? S(inv.a) : F(inv.a))}` });
      } else if (tipo === 'menor' || tipo === 'mayor') {
        const a = lee(sc, 'a', 'el valor a');
        const pa = F(a), res = tipo === 'menor' ? pa : S(a);
        const zz = d === 'normal' ? (a - P.mu) / P.sigma : null;
        pasos.push({ t: tipo === 'menor' ? `P(${X} ≤ ${num(a)})` : `P(${X} ≥ ${num(a)})`, html: d === 'normal'
          ? `Durch Standardisieren, Z = (X − μ)/σ = (${num(a)} − ${num(P.mu)})/${num(P.sigma)} = ${num(zz)}<br>${tipo === 'menor' ? `P(Z ≤ ${num(zz)}) = Φ(${num(zz)})` : `P(Z ≥ ${num(zz)}) = 1 − Φ(${num(zz)})${zz < 0 ? ` = Φ(${num(-zz)})` : ''}`} = <b>${prob(res)}</b>`
          : `${tipo === 'menor' ? `F(${num(a)})` : `1 − F(${num(a)}) = 1 − ${prob(pa)}`} = <b>${prob(res)}</b>${nota}` });
        pasos.push({ t: 'Bei einer stetigen Verteilung', html: `P(${X} = a) = 0, also ist es egal, ob man ≤ oder &lt; schreibt (und ≥ oder &gt;).` });
        Object.assign(r, { p: res, a, sombra: tipo === 'menor' ? [-Infinity, a] : [a, Infinity] });
      } else if (tipo === 'entre' || tipo === 'centro') {
        let a, b, c = null;
        if (tipo === 'centro') { c = leeC(); a = media - c; b = media + c; } else { a = lee(sc, 'a', 'el valor a'); b = lee(sc, 'b', 'el valor b'); }
        if (b < a) throw new Error('b muss größer oder gleich a sein');
        const res = a > media ? S(a) - S(b) : F(b) - F(a), za = d === 'normal' ? (a - P.mu) / P.sigma : 0, zb = d === 'normal' ? (b - P.mu) / P.sigma : 0;
        const tit = tipo === 'centro' ? `P(|${X} − μ| ≤ ${num(c)}) = P(${num(a)} ≤ ${X} ≤ ${num(b)})` : `P(${num(a)} ≤ ${X} ≤ ${num(b)}) = F(${num(b)}) − F(${num(a)})`;
        pasos.push({ t: tit, html: (d === 'normal'
          ? (tipo === 'centro' ? `P(−${num(zb)} ≤ Z ≤ ${num(zb)}) = 2Φ(${num(zb)}) − 1 = 2·${prob(Phi(zb))} − 1 = <b>${prob(res)}</b>` : `Z<sub>a</sub> = ${num(za)}, &nbsp;Z<sub>b</sub> = ${num(zb)}<br>Φ(${num(zb)}) − Φ(${num(za)}) = ${prob(F(b))} − ${prob(F(a))} = <b>${prob(res)}</b>`)
          : `F(${num(b)}) − F(${num(a)}) = ${prob(F(b))} − ${prob(F(a))} = <b>${prob(res)}</b>${nota}`) + (c !== null ? cheb(c) : '') });
        Object.assign(r, { p: res, a, b, c, sombra: [a, b] });
      } else if (tipo === 'cuantil') {
        const p = probCuantil(sc, D), x = cuantil(D, P, p);
        let h = `Gesucht ist a mit P(${X} ≤ a) = ${num(p)}`;
        if (d === 'normal') { const zq = cuantil(DIST.normal, N01, p); h += `.<br>In der Standardnormalverteilung ist Φ(z) = ${num(p)} ⇒ z = ${num(zq)}.<br>Rücktransformiert, a = μ + zσ = ${num(P.mu)} + ${num(zq)}·${num(P.sigma)} = <b>${num(x)}</b>`; }
        else if (D.invTxt) h += `: ${D.invTxt()} = <b>${num(x)}</b>`;
        else h += `: a = <b>${num(x)}</b>`;
        pasos.push({ t: 'Quantil', html: h });
        Object.assign(r, { p, x, sombra: [-Infinity, x] });
      } else {
        const alfa = lee(sc, 'alfa', 'das Signifikanzniveau α', { min: 0, minEx: true, max: 1, maxEx: true }), bil = tipo === 'critico';
        const Q = d === 'normal' ? N01 : P, nor = d === 'normal', k = nor ? P.sigma : 1, m0 = nor ? P.mu : 0;
        const nom = nor ? 'z' : D.critico(P), V = nor ? 'Z' : X, enX = (c) => (nor && (P.mu !== 0 || P.sigma !== 1) ? `<br>In X: μ ${bil ? '±' : '+'} cσ = ${bil ? `${num(P.mu - c * P.sigma)} und ` : ''}${num(P.mu + c * P.sigma)}` : '');
        if (bil && D.simetrica) {
          const c = cuantil(D, Q, 1 - alfa / 2);
          pasos.push({ t: 'Zweiseitiger kritischer Wert', html: `Gesucht ist c mit P(−c ≤ ${V} ≤ c) = 1 − α = ${num(1 - alfa)}: Jeder Rand lässt α/2 = ${num(alfa / 2)} übrig, also P(${V} ≤ c) = ${num(1 - alfa / 2)}.<br>${nor ? 'z' : 't'}<sub>α/2</sub> = <b>±${num(c)}</b>${enX(c)}` });
          Object.assign(r, { p: 1 - alfa, alfa, c, sombra: [m0 - c * k, m0 + c * k] });
        } else if (bil) {
          const c1 = cuantil(D, Q, alfa / 2), c2 = cuantil(D, Q, 1 - alfa / 2);
          pasos.push({ t: 'Zweiseitige kritische Werte', html: `${D.nombreX === 'F' ? 'Die F-Verteilung' : 'Die χ²-Verteilung'} ist nicht symmetrisch: Man braucht zwei Werte, einen, der links α/2 = ${num(alfa / 2)} übrig lässt, und einen, der rechts α/2 übrig lässt.<br>c₁ = ${nom}<sub>; 1−α/2</sub> = <b>${num(c1)}</b> &nbsp;(P(${X} ≤ c₁) = ${num(alfa / 2)})<br>c₂ = ${nom}<sub>; α/2</sub> = <b>${num(c2)}</b> &nbsp;(P(${X} ≥ c₂) = ${num(alfa / 2)})${d === 'f' ? `<br>Es gilt c₁ = 1/F<sub>${num(P.d2)}, ${num(P.d1)}; α/2</sub>, wie in den Tabellen.` : ''}` });
          Object.assign(r, { p: 1 - alfa, alfa, c: c2, c1, sombra: [c1, c2] });
        } else {
          const c = cuantil(D, Q, 1 - alfa);
          pasos.push({ t: 'Einseitiger kritischer Wert', html: `Das ganze α geht in den rechten Rand: Gesucht ist c mit P(${V} ≥ c) = α = ${num(alfa)}, also P(${V} ≤ c) = ${num(1 - alfa)}.<br>${nom}<sub>${nor ? '' : '; '}α</sub> = <b>${num(c)}</b>${D.simetrica ? `<br>Für den linken Rand, aus Symmetrie: −${num(c)}.` : d === 'f' ? `<br>Für den linken Rand: F<sub>${num(P.d1)}, ${num(P.d2)}; 1−α</sub> = 1/F<sub>${num(P.d2)}, ${num(P.d1)}; α</sub> = ${num(cuantil(D, P, alfa))}.` : `<br>Für den linken Rand (P(${X} ≤ c) = α): ${num(cuantil(D, P, alfa))}.`}${enX(c)}` });
          Object.assign(r, { p: alfa, alfa, c, sombra: [m0 + c * k, Infinity] });
        }
      }
    } else {
      const f = (k) => D.pmf(P, k), F = (k) => D.cdf(P, k), G = (k) => (D.cola ? D.cola(P, k) : 1 - F(k - 1));
      pasos.push({ t: 'Wahrscheinlichkeitsfunktion', html: D.general(P) });
      const entero = (k, nom) => lee(sc, k, nom, { entero: true }), [s0, s1] = D.soporte ? D.soporte(P) : [0, Infinity];
      const detalle = (k0, k1) => {
        k0 = Math.max(k0, s0); k1 = Math.min(k1, s1);
        if (k1 - k0 > 6 || k1 < k0) return '';
        return '<br>' + Array.from({ length: k1 - k0 + 1 }, (_, i) => k0 + i).map((k) => `${D.formula(P, k)} = ${prob(f(k))}`).join('<br>');
      };
      let a, b, res, desc;
      if (tipo === 'igual') { a = b = entero('a', 'el valor k'); res = f(a); desc = `P(X = ${a})`; pasos.push({ t: desc, html: `${a < s0 || a > s1 ? `${desc} = 0, weil X nicht den Wert ${a} annehmen kann` : `${D.formula(P, a)} = <b>${prob(res)}</b>`}` }); }
      else if (tipo === 'entre' || tipo === 'centro') {
        if (tipo === 'centro') { const c = leeC(); a = Math.ceil(media - c - 1e-9); b = Math.floor(media + c + 1e-9); r.c = c; desc = `P(|X − μ| ≤ ${num(c)}) = P(${num(media - c)} ≤ X ≤ ${num(media + c)}) = P(${a} ≤ X ≤ ${b})`; }
        else { a = entero('a', 'el valor a'); b = entero('b', 'el valor b'); desc = `P(${a} ≤ X ≤ ${b})`; }
        if (b < a) throw new Error(tipo === 'centro' ? 'Es gibt keinen ganzzahligen Wert in diesem Abstand vom Mittelwert' : 'b muss größer oder gleich a sein');
        res = a > media ? G(a) - G(b + 1) : F(b) - F(a - 1);
        pasos.push({ t: desc, html: `= P(X ≤ ${b}) − P(X ≤ ${a - 1}) = ${prob(F(b))} − ${prob(F(a - 1))} = <b>${prob(res)}</b>${detalle(a, b)}${tipo === 'centro' ? cheb(r.c) : ''}` });
      } else if (tipo === 'cuantil') {
        const p = probCuantil(sc, D);
        let k = Math.max(s0, Math.floor(D.rango(P)[0]));
        while (F(k) < p && k < 1e7) k++;
        while (k > s0 && F(k - 1) >= p) k--;
        pasos.push({ t: 'Quantil', html: `P(X ≤ ${k - 1}) = ${prob(F(k - 1))} &lt; ${num(p)} und P(X ≤ ${k}) = ${prob(F(k))} ≥ ${num(p)} ⇒ k = <b>${k}</b>` });
        pasos.push({ t: 'Wertetabelle', html: tabla(D, P, (j) => j <= k, k) });
        Object.assign(r, { p, x: k, sombra: [-Infinity, k], discreta: true });
        return terminar(D, r, sc);
      } else {
        a = entero('a', 'el valor k');
        const T = { menor: [-Infinity, a, `P(X ≤ ${a})`], menorE: [-Infinity, a - 1, `P(X < ${a}) = P(X ≤ ${a - 1})`], mayor: [a, Infinity, `P(X ≥ ${a}) = 1 − P(X ≤ ${a - 1})`], mayorE: [a + 1, Infinity, `P(X > ${a}) = 1 − P(X ≤ ${a})`] }[tipo];
        [a, b, desc] = T;
        res = isFinite(b) ? F(b) : G(a);
        const cuerpo = isFinite(b) ? `${b < 0 ? '' : `= Σ<sub>k=${s0}</sub><sup>${b}</sup> P(X = k) `}= <b>${prob(res)}</b>${b >= 0 ? detalle(0, b) : ''}` : `= 1 − ${prob(F(a - 1))} = <b>${prob(res)}</b>${a - 1 >= 0 ? detalle(0, a - 1) : ''}`;
        pasos.push({ t: desc, html: cuerpo });
      }
      const ev = intervalo(a, b), conSin = (m, sg) => [['Normal mit Stetigkeitskorrektur', porNormal(m, sg, a, b)], ['Normal ohne Korrektur', sinCorreccion(m, sg, a, b)]];
      const corr = `Mit der Stetigkeitskorrektur (±0,5) nimmt jede ganze Zahl k den Abschnitt von k − 0,5 bis k + 0,5 ein: ${intervalo(a - 0.5, b + 0.5)}. Ohne sie geht an jedem Ende ein halber Balken verloren.`;
      if (d === 'binomial' && P.n * P.p >= 5 && P.n * (1 - P.p) >= 5) {
        const sg = Math.sqrt(varianza);
        pasos.push({ t: 'Näherung durch die Normalverteilung (np ≥ 5 und nq ≥ 5)', html: `X ≈ N(np, √(npq)) = N(${num(media)}, ${num(sg)}). ${corr}${comparaAprox(r, res, conSin(media, sg))}` });
      }
      if (d === 'binomial' && P.n >= 30 && P.p <= 0.1) {
        const L = { lambda: media }, Po = DIST.poisson, ap = (isFinite(b) ? Po.cdf(L, b) : 1) - (isFinite(a) ? Po.cdf(L, a - 1) : 0);
        pasos.push({ t: 'Näherung durch die Poisson-Verteilung (n ≥ 30 und p ≤ 0,1)', html: `X ≈ P(λ = np = ${num(media)}), für P(${ev}):${comparaAprox(r, res, [['Poisson', ap]])}` });
      }
      if (d === 'poisson' && P.lambda >= 10) {
        const sg = Math.sqrt(P.lambda);
        pasos.push({ t: 'Näherung durch die Normalverteilung (λ ≥ 10)', html: `X ≈ N(λ, √λ) = N(${num(P.lambda)}, ${num(sg)}). ${corr}${comparaAprox(r, res, conSin(P.lambda, sg))}` });
      }
      if (d === 'hipergeometrica' && P.n <= 0.1 * P.N) {
        const B = { n: P.n, p: P.K / P.N }, Bi = DIST.binomial, ap = (isFinite(b) ? Bi.cdf(B, b) : 1) - (isFinite(a) ? Bi.cdf(B, a - 1) : 0);
        pasos.push({ t: 'Näherung durch die Binomialverteilung (n ≤ 0,1·N)', html: `Es wird so wenig aus der Grundgesamtheit gezogen, dass es fast egal ist, ob man zurücklegt oder nicht: X ≈ B(n, K/N) = B(${num(P.n)}, ${num(B.p)}), für P(${ev}):${comparaAprox(r, res, [['Binomial', ap]])}` });
      }
      pasos.push({ t: 'Wertetabelle', html: tabla(D, P, (k) => k >= a && k <= b, isFinite(a) ? a : b) });
      Object.assign(r, { p: res, a, b, sombra: [a, b], discreta: true });
    }
    return terminar(D, r, sc);
  }
  function terminar(D, r, sc) {
    if (sc && sc.comp && DIST[sc.comp]) comparacion(sc, r, D);
    r.res = r.tipo === 'tcl' ? `X̄ ≈ N(${num(r.media)}, ${num(r.tcl.et)})` : r.tipo === 'inverso' ? `${r.incog === 'mu' ? 'μ' : 'σ'} = ${num(r.valor)}` : r.tipo === 'cuantil' ? `${r.discreta ? 'k' : 'a'} = ${num(r.x)}` : r.tipo === 'critico' ? (r.c1 !== undefined ? `c₁ = ${num(r.c1)}, c₂ = ${num(r.c)}` : `c = ±${num(r.c)}`) : r.tipo === 'criticoU' ? `c = ${num(r.c)}` : `P = ${prob(r.p)}`;
    r.pct = ['cuantil', 'critico', 'criticoU', 'inverso', 'tcl'].includes(r.tipo) ? '' : `${num(100 * r.p, 4, 0)} %`;
    return r;
  }

  const ejemplos = [
    { clave: 'normal-menor', nombre: 'Normal: P(X ≤ 52) mit N(50, 5)', sc: { dist: 'normal', mu: '50', sigma: '5', tipo: 'menor', a: '52' } },
    { clave: 'normal-entre', nombre: 'Normal: P(μ − σ ≤ X ≤ μ + σ)', sc: { dist: 'normal', mu: '0', sigma: '1', tipo: 'entre', a: '-1', b: '1' } },
    { clave: 'normal-centro', nombre: 'Normal: Intelligenzquotient weniger als 15 Punkte vom Mittelwert entfernt', sc: { dist: 'normal', mu: '100', sigma: '15', tipo: 'centro', cc: '15' } },
    { clave: 'normal-cuantil', nombre: 'Normal: Note, die 90 % übertrifft', sc: { dist: 'normal', mu: '6', sigma: '1.5', tipo: 'cuantil', q: '0.9' } },
    { clave: 'normal-inverso', nombre: 'Normal: welches σ sorgt dafür, dass nur 5 % über 80 liegen', sc: { dist: 'normal', mu: '70', sigma: '5', tipo: 'inverso', incog: 'sigma', cola: 'mayor', a: '80', q: '0.05' } },
    { clave: 'z-critico', nombre: 'Kritischer Wert z für α = 0,05', sc: { dist: 'normal', mu: '0', sigma: '1', tipo: 'critico', alfa: '0.05' } },
    { clave: 'z-unilateral', nombre: 'Einseitiger kritischer Wert z für α = 0,05', sc: { dist: 'normal', mu: '0', sigma: '1', tipo: 'criticoU', alfa: '0.05' } },
    { clave: 't-critico', nombre: 'Student-t: kritischer Wert bei 10 Freiheitsgraden', sc: { dist: 't', nu: '10', tipo: 'critico', alfa: '0.05' } },
    { clave: 'chi2', nombre: 'χ² mit 5 Freiheitsgraden: P(χ² ≥ 11,07)', sc: { dist: 'chi2', k: '5', tipo: 'mayor', a: '11.07' } },
    { clave: 'chi2-critico', nombre: 'χ² mit 10 Freiheitsgraden: die beiden kritischen Werte', sc: { dist: 'chi2', k: '10', tipo: 'critico', alfa: '0.05' } },
    { clave: 'f-critico', nombre: 'F-Verteilung: kritischer Wert F(5, 10)', sc: { dist: 'f', d1: '5', d2: '10', tipo: 'criticoU', alfa: '0.05' } },
    { clave: 'exponencial', nombre: 'Exponential: hält länger als 3 Stunden', sc: { dist: 'exponencial', lambda: '0.5', tipo: 'mayor', a: '3' } },
    { clave: 'uniforme', nombre: 'Gleichverteilung: mehr als 7 Minuten warten zwischen 0 und 10', sc: { dist: 'uniforme', lo: '0', hi: '10', tipo: 'mayor', a: '7' } },
    { clave: 'gamma', nombre: 'Gamma: Warten auf 3 Ankünfte mit Rate 2 pro Minute', sc: { dist: 'gamma', forma: '3', tasa: '2', tipo: 'menor', a: '2' } },
    { clave: 'beta', nombre: 'Beta: Anteil mit α = 2 und β = 5', sc: { dist: 'beta', al: '2', be: '5', tipo: 'entre', a: '0.1', b: '0.4' } },
    { clave: 'lognormal', nombre: 'Lognormal: Reparaturzeit über 5 Stunden', sc: { dist: 'lognormal', mu: '1', sigma: '0.5', tipo: 'mayor', a: '5' } },
    { clave: 'weibull', nombre: 'Weibull: mittlere Lebensdauer eines Bauteils mit Verschleiß', sc: { dist: 'weibull', forma: '2', escala: '1000', tipo: 'cuantil', q: '0.5' } },
    { clave: 'nbinomial', nombre: 'Negativ binomial: Misserfolge vor dem 3. Erfolg', sc: { dist: 'nbinomial', r: '3', p: '0.4', tipo: 'menor', a: '4' } },
    { clave: 'binomial-igual', nombre: 'Binomial: 3-mal Kopf bei 10 Würfen', sc: { dist: 'binomial', n: '10', p: '0.5', tipo: 'igual', a: '3' } },
    { clave: 'binomial-menor', nombre: 'Binomial: höchstens 2 Defekte', sc: { dist: 'binomial', n: '20', p: '0.05', tipo: 'menor', a: '2' } },
    { clave: 'binomial-normal', nombre: 'Große Binomialverteilung und ihre Normalnäherung', sc: { dist: 'binomial', n: '100', p: '0.3', tipo: 'entre', a: '25', b: '35' } },
    { clave: 'binomial-poisson', nombre: 'Binomial mit kleinem p und ihre Poisson-Näherung', sc: { dist: 'binomial', n: '200', p: '0.02', tipo: 'menor', a: '3' } },
    { clave: 'poisson', nombre: 'Poisson: mindestens 2 Anrufe', sc: { dist: 'poisson', lambda: '3', tipo: 'mayor', a: '2' } },
    { clave: 'poisson-normal', nombre: 'Poisson mit großem λ und ihre Normalnäherung', sc: { dist: 'poisson', lambda: '25', tipo: 'entre', a: '20', b: '30' } },
    { clave: 'geometrica', nombre: 'Geometrisch: 3 Misserfolge vor dem ersten Erfolg', sc: { dist: 'geometrica', p: '0.2', tipo: 'igual', a: '3' } },
    { clave: 'hipergeometrica', nombre: 'Hypergeometrisch: 2 Defekte beim Ziehen von 4 aus 20', sc: { dist: 'hipergeometrica', N: '20', K: '5', n: '4', tipo: 'igual', a: '2' } },
    { clave: 'hiper-binomial', nombre: 'Hypergeometrisch mit großer Grundgesamtheit und ihre Binomialnäherung', sc: { dist: 'hipergeometrica', N: '500', K: '100', n: '20', tipo: 'menor', a: '3' } },
    { clave: 'compara-t', nombre: 'Vergleichen: die Student-t mit 5 Freiheitsgraden gegenüber der Normalverteilung', sc: { dist: 't', nu: '5', tipo: 'mayor', a: '2', comp: 'normal', c_mu: '0', c_sigma: '1' } },
    { clave: 'compara-binomial', nombre: 'Vergleichen: B(30; 0,4) mit der Normalverteilung, die sie annähert', sc: { dist: 'binomial', n: '30', p: '0.4', tipo: 'entre', a: '10', b: '14', comp: 'normal', c_mu: '12', c_sigma: '2.683' } },
    { clave: 'tcl-exponencial', nombre: 'Zentraler Grenzwertsatz: Mittelwerte von 30 Exponentialverteilungen', sc: { dist: 'exponencial', lambda: '1', tipo: 'tcl', nm: '30', semilla: 1 } },
    { clave: 'tcl-pocos', nombre: 'Zentraler Grenzwertsatz: mit n = 2 ist es noch keine Glockenkurve', sc: { dist: 'exponencial', lambda: '1', tipo: 'tcl', nm: '2', semilla: 1 } },
    { clave: 'tcl-binomial', nombre: 'Zentraler Grenzwertsatz: Mittelwerte von 40 Ziehungen einer Binomialverteilung', sc: { dist: 'binomial', n: '5', p: '0.2', tipo: 'tcl', nm: '40', semilla: 1 } },
  ];

  function ejercicio(r = Math.random) {
    const ent = (a, b) => a + Math.floor(r() * (b - a + 1)), de = (l) => l[ent(0, l.length - 1)], c = (x) => String(+x.toFixed(3)).replace('.', ',');
    const T = [
      () => { const mu = ent(5, 7), s = de([1, 1.5, 2]), a = c(mu + de([-1.5, -1, -0.5, 0.5, 1, 1.5, 2])); return { sc: { dist: 'normal', mu: String(mu), sigma: c(s), tipo: 'menor', a }, enunciado: `Die Noten einer Prüfung folgen einer Normalverteilung mit Mittelwert ${mu} und Standardabweichung ${c(s)}. Welcher Anteil der Studierenden erreicht weniger als ${a}?` }; },
      () => { const mu = ent(20, 60) * 10, s = ent(2, 6) * 5, a = String(mu + ent(1, 4) * 5); return { sc: { dist: 'normal', mu: String(mu), sigma: String(s), tipo: 'mayor', a }, enunciado: `Das Gewicht einiger Teile folgt einer Normalverteilung mit Mittelwert ${mu} g und Standardabweichung ${s} g. Mit welcher Wahrscheinlichkeit wiegt ein Teil mehr als ${a} g?` }; },
      () => { const mu = ent(160, 180), s = ent(5, 10), a = mu - ent(2, 10), b = mu + ent(2, 10); return { sc: { dist: 'normal', mu: String(mu), sigma: String(s), tipo: 'entre', a: String(a), b: String(b) }, enunciado: `Die Körpergröße der Studierenden folgt einer Normalverteilung N(${mu}, ${s}) in cm. Wie viel Prozent sind zwischen ${a} und ${b} cm groß?` }; },
      () => { const mu = ent(5, 7), s = de([1, 1.5, 2]), q = de([0.8, 0.9, 0.95]); return { sc: { dist: 'normal', mu: String(mu), sigma: c(s), tipo: 'cuantil', q: c(q) }, enunciado: `Die Noten folgen einer Normalverteilung N(${mu}; ${c(s)}). Welche Note muss man erreichen, um über ${Math.round(100 * q)} % der Klasse zu liegen?` }; },
      () => { const mu = ent(50, 100) * 10, a = mu + ent(2, 6) * 5, q = de([0.01, 0.02, 0.05]); return { sc: { dist: 'normal', mu: String(mu), sigma: '10', tipo: 'inverso', incog: 'sigma', cola: 'mayor', a: String(a), q: c(q) }, enunciado: `Eine Maschine füllt Flaschen mit durchschnittlich ${mu} ml. Welche Standardabweichung darf sie höchstens haben, damit nur ${Math.round(100 * q)} % der Flaschen mehr als ${a} ml enthalten?` }; },
      () => { const p = de([0.05, 0.1, 0.2, 0.25, 0.3]), n = ent(8, 20), k = ent(0, Math.min(4, n)); return { sc: { dist: 'binomial', n: String(n), p: c(p), tipo: 'igual', a: String(k) }, enunciado: `${Math.round(100 * p)} % der Teile einer Fabrik sind defekt. Wenn man ${n} Teile zufällig auswählt, mit welcher Wahrscheinlichkeit sind genau ${k} davon defekt?` }; },
      () => { const p = de([0.05, 0.1, 0.2]), n = ent(10, 25), k = ent(1, 3); return { sc: { dist: 'binomial', n: String(n), p: c(p), tipo: 'menor', a: String(k) }, enunciado: `Ein Multiple-Choice-Test hat ${n} Fragen, und die Wahrscheinlichkeit, eine zufällig richtig zu raten, beträgt ${c(p)}. Mit welcher Wahrscheinlichkeit rät man höchstens ${k} richtig?` }; },
      () => { const l = ent(2, 8), k = ent(1, 4); return { sc: { dist: 'poisson', lambda: String(l), tipo: 'mayor', a: String(k) }, enunciado: `In einer Telefonzentrale gehen durchschnittlich ${l} Anrufe pro Minute ein (Poisson). Mit welcher Wahrscheinlichkeit kommen in einer Minute mindestens ${k} an?` }; },
      () => { const m = ent(2, 10), t = ent(1, 12); return { sc: { dist: 'exponencial', lambda: c(1 / m), tipo: 'mayor', a: String(t) }, enunciado: `Die Lebensdauer einer Glühbirne folgt einer Exponentialverteilung mit Mittelwert ${m} Jahren (λ = 1/${m}). Mit welcher Wahrscheinlichkeit hält sie länger als ${t} Jahre?` }; },
      () => { const nu = ent(5, 30), a = de([0.01, 0.05, 0.1]); return { sc: { dist: 't', nu: String(nu), tipo: 'critico', alfa: c(a) }, enunciado: `Bestimme den zweiseitigen kritischen Wert der Student-t-Verteilung mit ${nu} Freiheitsgraden für α = ${c(a)}.` }; },
      () => { const k = ent(3, 20), a = de([0.01, 0.05, 0.1]); return { sc: { dist: 'chi2', k: String(k), tipo: 'criticoU', alfa: c(a) }, enunciado: `Bestimme den Wert der χ²-Verteilung mit ${k} Freiheitsgraden, der ${c(a)} rechts von sich lässt.` }; },
      () => { const N = ent(15, 30), K = ent(3, 8), n = ent(3, 6), k = ent(0, Math.min(2, K)); return { sc: { dist: 'hipergeometrica', N: String(N), K: String(K), n: String(n), tipo: 'igual', a: String(k) }, enunciado: `In einer Kiste liegen ${N} Glühbirnen, von denen ${K} durchgebrannt sind. Es werden ${n} ohne Zurücklegen gezogen. Mit welcher Wahrscheinlichkeit zieht man genau ${k} durchgebrannte?` }; },
    ];
    return de(T)();
  }

  return { DIST, tipos, calcular, ejemplos, MUESTRAS, ejercicio, Phi, gammaP, gammaQ, betaI, lnGamma, num, prob, cuantil, fCdf };
})();

