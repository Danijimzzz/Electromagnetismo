/* =====================================================================
   Estadística: distribuciones (sin DOM). Normal, t de Student, χ²,
   exponencial, binomial y Poisson: probabilidades P(X ≤ a), P(X ≥ a),
   P(a ≤ X ≤ b), P(X = k), cuantiles y valores críticos, con media,
   varianza y el desarrollo (tipificación, fórmula de la binomial…).
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
  const num = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-4 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(Math.max(d, Math.ceil(Math.log10(a + 1)) + 1)));
    return s.replace('.', ',').replace('-', '−');
  };
  // probabilidad con 4 decimales como en las tablas (y más si es muy pequeña)
  const prob = (p) => (p !== 0 && Math.abs(p) < 1e-4 ? num(p, 4) : p.toFixed(4).replace('.', ',').replace('-', '−'));
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

  const DIST = {
    normal: {
      nombre: 'Normal N(μ, σ)', continua: true, params: [['mu', 'Media μ', {}], ['sigma', 'Desviación típica σ', { min: 0, minEx: true }]],
      pdf: ({ mu, sigma }, x) => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)),
      cdf: ({ mu, sigma }, x) => Phi((x - mu) / sigma),
      momentos: ({ mu, sigma }) => ({ media: mu, varianza: sigma * sigma }),
      rango: ({ mu, sigma }) => [mu - 4 * sigma, mu + 4 * sigma],
      simetrica: true, nombreX: 'X', etiqueta: (p) => `N(${num(p.mu)}, ${num(p.sigma)})`,
    },
    t: {
      nombre: 't de Student', continua: true, params: [['nu', 'Grados de libertad ν', { min: 0, minEx: true }]],
      pdf: ({ nu }, x) => Math.exp(lnGamma((nu + 1) / 2) - lnGamma(nu / 2) - 0.5 * Math.log(nu * Math.PI) - ((nu + 1) / 2) * Math.log(1 + (x * x) / nu)),
      cdf: ({ nu }, x) => { const c = 0.5 * betaI(nu / (nu + x * x), nu / 2, 0.5); return x > 0 ? 1 - c : c; },
      momentos: ({ nu }) => ({ media: nu > 1 ? 0 : NaN, varianza: nu > 2 ? nu / (nu - 2) : nu > 1 ? Infinity : NaN }),
      rango: ({ nu }) => { const r = nu < 3 ? 8 : 5; return [-r, r]; },
      simetrica: true, nombreX: 'T', etiqueta: (p) => `t<sub>${num(p.nu)}</sub>`,
    },
    chi2: {
      nombre: 'Chi cuadrado χ²', continua: true, params: [['k', 'Grados de libertad k', { min: 0, minEx: true }]],
      pdf: ({ k }, x) => (x <= 0 ? (x === 0 && k === 2 ? 0.5 : 0) : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lnGamma(k / 2))),
      cdf: ({ k }, x) => (x <= 0 ? 0 : gammaP(k / 2, x / 2)),
      momentos: ({ k }) => ({ media: k, varianza: 2 * k }),
      rango: ({ k }) => [0, k + 5 * Math.sqrt(2 * k) + 2],
      nombreX: 'χ²', etiqueta: (p) => `χ²<sub>${num(p.k)}</sub>`,
    },
    exponencial: {
      nombre: 'Exponencial Exp(λ)', continua: true, params: [['lambda', 'Tasa λ', { min: 0, minEx: true }]],
      pdf: ({ lambda }, x) => (x < 0 ? 0 : lambda * Math.exp(-lambda * x)),
      cdf: ({ lambda }, x) => (x <= 0 ? 0 : -Math.expm1(-lambda * x)),
      momentos: ({ lambda }) => ({ media: 1 / lambda, varianza: 1 / (lambda * lambda) }),
      rango: ({ lambda }) => [0, 6 / lambda],
      nombreX: 'X', etiqueta: (p) => `Exp(${num(p.lambda)})`,
    },
    binomial: {
      nombre: 'Binomial B(n, p)', continua: false, params: [['n', 'Número de pruebas n', { entero: true, min: 1, max: 100000 }], ['p', 'Probabilidad de éxito p', { min: 0, max: 1 }]],
      pmf: ({ n, p }, k) => {
        if (k < 0 || k > n || !Number.isInteger(k)) return 0;
        if (p === 0) return k === 0 ? 1 : 0;
        if (p === 1) return k === n ? 1 : 0;
        return Math.exp(lnGamma(n + 1) - lnGamma(k + 1) - lnGamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log1p(-p));
      },
      cdf: (P, k) => { const { n, p } = P; if (k < 0) return 0; if (k >= n) return 1; if (p === 0) return 1; if (p === 1) return 0; return betaI(1 - p, n - Math.floor(k), Math.floor(k) + 1); },
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
      momentos: ({ lambda }) => ({ media: lambda, varianza: lambda }),
      rango: ({ lambda }) => [Math.max(0, Math.floor(lambda - 5 * Math.sqrt(lambda) - 1)), Math.ceil(lambda + 5 * Math.sqrt(lambda) + 3)],
      nombreX: 'X', etiqueta: (p) => `P(${num(p.lambda)})`,
      formula: ({ lambda }, k) => `P(X = ${k}) = e<sup>−${num(lambda)}</sup>·${num(lambda)}<sup>${k}</sup> / ${k}!`,
      general: () => 'P(X = k) = e<sup>−λ</sup>·λ<sup>k</sup> / k!, para k = 0, 1, 2…',
    },
  };
  const TIPOS_C = [['menor', 'P(X ≤ a)'], ['mayor', 'P(X ≥ a)'], ['entre', 'P(a ≤ X ≤ b)'], ['cuantil', 'Cuantil: a con P(X ≤ a) = p'], ['critico', 'Valor crítico bilateral (α)']];
  const TIPOS_D = [['igual', 'P(X = k)'], ['menor', 'P(X ≤ k)'], ['menorE', 'P(X < k)'], ['mayor', 'P(X ≥ k)'], ['mayorE', 'P(X > k)'], ['entre', 'P(a ≤ X ≤ b)'], ['cuantil', 'Cuantil: menor k con P(X ≤ k) ≥ p']];
  const tipos = (d) => (DIST[d].continua ? TIPOS_C.filter(([k]) => k !== 'critico' || DIST[d].simetrica) : TIPOS_D);

  // cuantil continuo por bisección
  function cuantil(D, P, p) {
    let [lo, hi] = D.rango(P);
    while (D.cdf(P, lo) > p) lo -= Math.max(1, Math.abs(hi - lo));
    while (D.cdf(P, hi) < p) hi += Math.max(1, Math.abs(hi - lo));
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (D.cdf(P, m) < p) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  // la probabilidad del cuantil va en «q», para no pisar la p de la binomial (antes era «p»)
  const probCuantil = (sc, D) => lee(vacio(sc.q) && !D.params.some(([k]) => k === 'p') ? { q: sc.p } : sc, 'q', 'la probabilidad p', { min: 0, minEx: true, max: 1, maxEx: true });

  function calcular(sc) {
    const d = DIST[sc.dist] ? sc.dist : 'normal', D = DIST[d];
    const P = {};
    for (const [k, nom, op] of D.params) P[k] = lee(sc, k, nom.toLowerCase(), op);
    const lista = tipos(d), tipo = lista.some(([k]) => k === sc.tipo) ? sc.tipo : lista[0][0];
    const { media, varianza } = D.momentos(P), X = D.nombreX, pasos = [];
    pasos.push({ t: 'Distribución', html: `${X} ~ ${D.etiqueta(P)}: media ${isNaN(media) ? 'no definida' : num(media)}, varianza ${isNaN(varianza) ? 'no definida' : num(varianza)}${isFinite(varianza) ? `, desviación típica ${num(Math.sqrt(varianza))}` : ''}` });
    const r = { dist: d, tipo, P, media, varianza, pasos };
    if (D.continua) {
      const F = (x) => D.cdf(P, x);
      const z = (x) => (d === 'normal' ? `<br>Tipificando, Z = (X − μ)/σ = (${num(x)} − ${num(P.mu)})/${num(P.sigma)} = ${num((x - P.mu) / P.sigma)}` : '');
      if (tipo === 'menor' || tipo === 'mayor') {
        const a = lee(sc, 'a', 'el valor a');
        const pa = F(a), res = tipo === 'menor' ? pa : 1 - pa;
        const zz = d === 'normal' ? (a - P.mu) / P.sigma : null;
        pasos.push({ t: tipo === 'menor' ? `P(${X} ≤ ${num(a)})` : `P(${X} ≥ ${num(a)})`, html: d === 'normal'
          ? `${z(a).slice(4)}<br>${tipo === 'menor' ? `P(Z ≤ ${num(zz)}) = Φ(${num(zz)})` : `P(Z ≥ ${num(zz)}) = 1 − Φ(${num(zz)})${zz < 0 ? ` = Φ(${num(-zz)})` : ''}`} = <b>${prob(res)}</b>`
          : `${tipo === 'menor' ? `F(${num(a)})` : `1 − F(${num(a)}) = 1 − ${prob(pa)}`} = <b>${prob(res)}</b>${d === 'exponencial' ? ` &nbsp;(F(x) = 1 − e<sup>−λx</sup>)` : ''}` });
        pasos.push({ t: 'En una distribución continua', html: `P(${X} = a) = 0, así que da igual escribir ≤ o &lt; (y ≥ o &gt;).` });
        Object.assign(r, { p: res, a, sombra: tipo === 'menor' ? [-Infinity, a] : [a, Infinity] });
      } else if (tipo === 'entre') {
        const a = lee(sc, 'a', 'el valor a'), b = lee(sc, 'b', 'el valor b');
        if (b < a) throw new Error('b tiene que ser mayor o igual que a');
        const res = F(b) - F(a);
        pasos.push({ t: `P(${num(a)} ≤ ${X} ≤ ${num(b)}) = F(${num(b)}) − F(${num(a)})`, html: d === 'normal'
          ? `Z<sub>a</sub> = ${num((a - P.mu) / P.sigma)}, &nbsp;Z<sub>b</sub> = ${num((b - P.mu) / P.sigma)}<br>Φ(${num((b - P.mu) / P.sigma)}) − Φ(${num((a - P.mu) / P.sigma)}) = ${prob(F(b))} − ${prob(F(a))} = <b>${prob(res)}</b>`
          : `${prob(F(b))} − ${prob(F(a))} = <b>${prob(res)}</b>` });
        Object.assign(r, { p: res, a, b, sombra: [a, b] });
      } else if (tipo === 'cuantil') {
        const p = probCuantil(sc, D);
        const x = d === 'exponencial' ? -Math.log1p(-p) / P.lambda : cuantil(D, P, p);
        let h = `Se busca a con P(${X} ≤ a) = ${num(p)}`;
        if (d === 'normal') { const zq = cuantil(DIST.normal, { mu: 0, sigma: 1 }, p); h += `.<br>En la normal tipificada, Φ(z) = ${num(p)} ⇒ z = ${num(zq)}.<br>Destipificando, a = μ + zσ = ${num(P.mu)} + ${num(zq)}·${num(P.sigma)} = <b>${num(x)}</b>`; }
        else if (d === 'exponencial') h += `: 1 − e<sup>−λa</sup> = ${num(p)} ⇒ a = −ln(1 − p)/λ = <b>${num(x)}</b>`;
        else h += `: a = <b>${num(x)}</b>`;
        pasos.push({ t: 'Cuantil', html: h });
        Object.assign(r, { p, x, sombra: [-Infinity, x] });
      } else {
        const alfa = lee(sc, 'alfa', 'el nivel de significación α', { min: 0, minEx: true, max: 1, maxEx: true });
        const c = cuantil(D, d === 'normal' ? { mu: 0, sigma: 1 } : P, 1 - alfa / 2), nombre = d === 'normal' ? 'z' : 't';
        pasos.push({ t: 'Valor crítico', html: `Se busca c con P(−c ≤ ${d === 'normal' ? 'Z' : 'T'} ≤ c) = 1 − α = ${num(1 - alfa)}: cada cola deja α/2 = ${num(alfa / 2)}, así que P(${d === 'normal' ? 'Z' : 'T'} ≤ c) = ${num(1 - alfa / 2)}.<br>${nombre}<sub>α/2</sub> = <b>±${num(c)}</b>${d === 'normal' && (P.mu !== 0 || P.sigma !== 1) ? `<br>En X: μ ± cσ = ${num(P.mu - c * P.sigma)} y ${num(P.mu + c * P.sigma)}` : ''}` });
        const k = d === 'normal' ? P.sigma : 1, m0 = d === 'normal' ? P.mu : 0;
        Object.assign(r, { p: 1 - alfa, alfa, c, sombra: [m0 - c * k, m0 + c * k] });
      }
    } else {
      const f = (k) => D.pmf(P, k), F = (k) => D.cdf(P, k);
      pasos.push({ t: 'Función de probabilidad', html: D.general(P) });
      const entero = (k, nom) => lee(sc, k, nom, { entero: true });
      const detalle = (k0, k1) => {
        // suma término a término si son pocos
        if (k1 - k0 > 6) return '';
        return '<br>' + Array.from({ length: k1 - k0 + 1 }, (_, i) => k0 + i).map((k) => `${D.formula(P, k)} = ${prob(f(k))}`).join('<br>');
      };
      let a, b, res, desc;
      if (tipo === 'igual') { a = b = entero('a', 'el valor k'); res = f(a); desc = `P(X = ${a})`; pasos.push({ t: desc, html: `${a < 0 || a > (P.n ?? Infinity) ? `${desc} = 0, porque X no puede valer ${a}` : `${D.formula(P, a)} = <b>${prob(res)}</b>`}` }); }
      else if (tipo === 'entre') {
        a = entero('a', 'el valor a'); b = entero('b', 'el valor b');
        if (b < a) throw new Error('b tiene que ser mayor o igual que a');
        res = F(b) - F(a - 1); desc = `P(${a} ≤ X ≤ ${b})`;
        pasos.push({ t: desc, html: `= P(X ≤ ${b}) − P(X ≤ ${a - 1}) = ${prob(F(b))} − ${prob(F(a - 1))} = <b>${prob(res)}</b>${detalle(Math.max(a, 0), b)}` });
      } else if (tipo === 'cuantil') {
        const p = probCuantil(sc, D);
        let k = Math.max(0, Math.floor(D.rango(P)[0]));
        while (F(k) < p && k < 1e7) k++;
        while (k > 0 && F(k - 1) >= p) k--;
        pasos.push({ t: 'Cuantil', html: `P(X ≤ ${k - 1}) = ${prob(F(k - 1))} &lt; ${num(p)} y P(X ≤ ${k}) = ${prob(F(k))} ≥ ${num(p)} ⇒ k = <b>${k}</b>` });
        Object.assign(r, { p, x: k, sombra: [-Infinity, k], discreta: true });
        return terminar(D, r);
      } else {
        a = entero('a', 'el valor k');
        const T = { menor: [-Infinity, a, `P(X ≤ ${a})`], menorE: [-Infinity, a - 1, `P(X < ${a}) = P(X ≤ ${a - 1})`], mayor: [a, Infinity, `P(X ≥ ${a}) = 1 − P(X ≤ ${a - 1})`], mayorE: [a + 1, Infinity, `P(X > ${a}) = 1 − P(X ≤ ${a})`] }[tipo];
        [a, b, desc] = T;
        res = isFinite(b) ? F(b) : 1 - F(a - 1);
        const cuerpo = isFinite(b) ? `${b < 0 ? '' : `= Σ<sub>k=0</sub><sup>${b}</sup> P(X = k) `}= <b>${prob(res)}</b>${b >= 0 ? detalle(0, b) : ''}` : `= 1 − ${prob(F(a - 1))} = <b>${prob(res)}</b>${a - 1 >= 0 ? detalle(0, a - 1) : ''}`;
        pasos.push({ t: desc, html: cuerpo });
      }
      // aproximación normal de la binomial
      if (d === 'binomial' && P.n * P.p >= 5 && P.n * (1 - P.p) >= 5 && tipo !== 'cuantil') {
        const s = Math.sqrt(varianza), lo = isFinite(a) ? a - 0.5 : -Infinity, hi = isFinite(b) ? b + 0.5 : Infinity;
        const ap = (isFinite(hi) ? Phi((hi - media) / s) : 1) - (isFinite(lo) ? Phi((lo - media) / s) : 0);
        pasos.push({ t: 'Aproximación por la normal (np ≥ 5 y nq ≥ 5)', html: `X ≈ N(np, √(npq)) = N(${num(media)}, ${num(s)}), con la corrección de continuidad (±0,5): ${isFinite(lo) ? `${num(lo)} ≤ X` : 'X'}${isFinite(hi) ? ` ≤ ${num(hi)}` : ''} ⇒ ≈ ${prob(ap)} (exacta: ${prob(res)})` });
      }
      Object.assign(r, { p: res, a, b, sombra: [a, b], discreta: true });
    }
    return terminar(D, r);
  }
  function terminar(D, r) {
    r.res = r.tipo === 'cuantil' ? `${r.discreta ? 'k' : 'a'} = ${num(r.x)}` : r.tipo === 'critico' ? `c = ±${num(r.c)}` : `P = ${prob(r.p)}`;
    r.pct = r.tipo === 'cuantil' || r.tipo === 'critico' ? '' : `${num(100 * r.p, 4)} %`;
    return r;
  }

  const ejemplos = [
    { clave: 'normal-menor', nombre: 'Normal: P(X ≤ 52) con N(50, 5)', sc: { dist: 'normal', mu: '50', sigma: '5', tipo: 'menor', a: '52' } },
    { clave: 'normal-entre', nombre: 'Normal: P(μ − σ ≤ X ≤ μ + σ)', sc: { dist: 'normal', mu: '0', sigma: '1', tipo: 'entre', a: '-1', b: '1' } },
    { clave: 'normal-cuantil', nombre: 'Normal: nota que supera el 90 %', sc: { dist: 'normal', mu: '6', sigma: '1.5', tipo: 'cuantil', q: '0.9' } },
    { clave: 'z-critico', nombre: 'Valor crítico z para α = 0,05', sc: { dist: 'normal', mu: '0', sigma: '1', tipo: 'critico', alfa: '0.05' } },
    { clave: 't-critico', nombre: 't de Student: valor crítico con 10 g. l.', sc: { dist: 't', nu: '10', tipo: 'critico', alfa: '0.05' } },
    { clave: 'chi2', nombre: 'χ² con 5 g. l.: P(χ² ≥ 11,07)', sc: { dist: 'chi2', k: '5', tipo: 'mayor', a: '11.07' } },
    { clave: 'exponencial', nombre: 'Exponencial: dura más de 3 horas', sc: { dist: 'exponencial', lambda: '0.5', tipo: 'mayor', a: '3' } },
    { clave: 'binomial-igual', nombre: 'Binomial: 3 caras en 10 lanzamientos', sc: { dist: 'binomial', n: '10', p: '0.5', tipo: 'igual', a: '3' } },
    { clave: 'binomial-menor', nombre: 'Binomial: como mucho 2 defectuosas', sc: { dist: 'binomial', n: '20', p: '0.05', tipo: 'menor', a: '2' } },
    { clave: 'binomial-normal', nombre: 'Binomial grande y su aproximación normal', sc: { dist: 'binomial', n: '100', p: '0.3', tipo: 'entre', a: '25', b: '35' } },
    { clave: 'poisson', nombre: 'Poisson: al menos 2 llamadas', sc: { dist: 'poisson', lambda: '3', tipo: 'mayor', a: '2' } },
  ];

  return { DIST, tipos, calcular, ejemplos, Phi, gammaP, betaI, lnGamma, num, prob, cuantil };
})();
if (typeof module !== 'undefined') module.exports = Estadistica;
