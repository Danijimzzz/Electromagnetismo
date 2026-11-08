/* =====================================================================
   Inferencia: lo común de ANOVA, Contrastes, No paramétricos y Regresión
   múltiple (sin DOM). Va en «scripts» tras estadistica/calculo.js.
     ptukey(q, k, nu), qtukey(p, k, nu)   rango studentizado (Tukey HSD, Games-Howell)
     levene(grupos, centro), bartlett(grupos)   igualdad de varianzas
     welch(grupos)                         ANOVA de Welch (varianzas distintas)
     shapiro(x), jarqueBera(x)             normalidad
     nctCdf(t, nu, d), nctPdf(t, nu, d)    t de Student no central (potencia)
     holm(ps), bonferroni(ps)              p-valores ajustados
     supuestos(grupos)                     resumen de los supuestos para un ANOVA
   El rango studentizado se integra con Gauss-Legendre (la fórmula de Tukey
   para la distribución del rango de k normales con una s² independiente) y se
   contrasta en pruebas/herramientas/anova.js con scipy.stats.studentized_range.
   El de Shapiro-Wilk es el algoritmo AS R94 de Royston (1995), contrastado con
   scipy.stats.shapiro. Las fórmulas están explicadas en las páginas de teoría.
   ===================================================================== */
const Inferencia = (() => {
  const ES = typeof Estadistica !== 'undefined' ? Estadistica : require('./calculo.js');
  const { Phi, lnGamma, DIST: D } = ES;
  const suma = (v) => v.reduce((a, b) => a + b, 0);
  const media = (v) => suma(v) / v.length;
  const ssq = (v) => { const m = media(v); return suma(v.map((x) => (x - m) ** 2)); };
  const mediana = (v) => { const s = [...v].sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

  // Gauss-Legendre de n nodos en [-1, 1] (Newton sobre los polinomios de Legendre)
  const GL = {};
  function gl(n) {
    if (GL[n]) return GL[n];
    const x = [], w = [];
    for (let i = 0; i < n; i++) {
      let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5)), pp = 1;
      for (let it = 0; it < 100; it++) {
        let p1 = 1, p2 = 0;
        for (let j = 0; j < n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j + 1) * z * p2 - j * p3) / (j + 1); }
        pp = (n * (z * p1 - p2)) / (z * z - 1);
        const dz = p1 / pp; z -= dz; if (Math.abs(dz) < 1e-15) break;
      }
      x.push(z); w.push(2 / ((1 - z * z) * pp * pp));
    }
    return (GL[n] = { x, w });
  }
  // integral de g en [a, b] con `paneles` trozos de 8 nodos
  function integra(g, a, b, paneles, n = 8) {
    const { x, w } = gl(n), h = (b - a) / paneles; let s = 0;
    for (let p = 0; p < paneles; p++) { const c = a + (p + 0.5) * h; for (let i = 0; i < n; i++) s += w[i] * g(c + x[i] * h * 0.5); }
    return (s * h) / 2;
  }

  /* ---------- Rango studentizado ---------- */
  const PHI_NODOS = (() => { const z = [], pz = [], Pz = []; const { x, w } = gl(8); for (let p = 0; p < 16; p++) for (let i = 0; i < 8; i++) { const v = -8 + p + 0.5 + x[i] * 0.5; z.push(v); pz.push(w[i] * 0.5 * Math.exp(-v * v / 2) / Math.sqrt(2 * Math.PI)); Pz.push(Phi(v)); } return { z, pz, Pz }; })();
  // P(rango de k normales estándar ≤ w) = k ∫ φ(z) [Φ(z) − Φ(z − w)]^(k−1) dz
  function rangoNormales(w, k) {
    if (!(w > 0)) return 0;
    const { z, pz, Pz } = PHI_NODOS; let s = 0;
    for (let i = 0; i < z.length; i++) s += pz[i] * Math.pow(Math.max(0, Pz[i] - Phi(z[i] - w)), k - 1);
    return Math.min(1, k * s);
  }
  function ptukey(q, k, nu) {
    if (!(q > 0)) return 0;
    if (!isFinite(nu) || nu > 1e5) return rangoNormales(q, k);
    const lnC = Math.log(2) + (nu / 2) * Math.log(nu / 2) - lnGamma(nu / 2);
    const dens = (s) => (s <= 0 ? 0 : Math.exp(lnC + (nu - 1) * Math.log(s) - (nu * s * s) / 2));
    const hi = Math.sqrt((nu + 7 * Math.sqrt(2 * nu) + 50) / nu), lo = nu > 120 ? Math.sqrt(Math.max(0, nu - 8 * Math.sqrt(2 * nu)) / nu) : 0;
    const p = integra((s) => dens(s) * rangoNormales(q * s, k), lo, hi, 16);
    return Math.min(1, Math.max(0, p));
  }
  function qtukey(p, k, nu) {
    if (!(p > 0 && p < 1)) return NaN;
    let a = 0, b = 3, fa = -p, fb = ptukey(b, k, nu) - p, g = 0;
    while (fb < 0 && g++ < 60) { a = b; fa = fb; b *= 1.6; fb = ptukey(b, k, nu) - p; }
    // regula falsi de Illinois
    let lado = 0;
    for (let i = 0; i < 80; i++) {
      const c = (a * fb - b * fa) / (fb - fa), fc = ptukey(c, k, nu) - p;
      if (Math.abs(fc) < 1e-13 || Math.abs(b - a) < 1e-11 * b) return c;
      if (fc * fb > 0) { b = c; fb = fc; if (lado === -1) fa /= 2; lado = -1; } else { a = c; fa = fc; if (lado === 1) fb /= 2; lado = 1; }
    }
    return (a + b) / 2;
  }


  /* ---------- t de Student no central (potencia de los contrastes con la t) ---------- */
  // T' = (Z + δ)/√(χ²_ν/ν): P(T' ≤ t) = ∫ f_S(s) Φ(t·s − δ) ds con S = √(χ²_ν/ν); la densidad es f_T(t) = ∫ f_S(s) s φ(t·s − δ) ds
  function nctInt(nu, g) {
    const lnC = Math.log(2) + (nu / 2) * Math.log(nu / 2) - lnGamma(nu / 2);
    const dens = (s) => (s <= 0 ? 0 : Math.exp(lnC + (nu - 1) * Math.log(s) - (nu * s * s) / 2));
    const hi = Math.sqrt((nu + 7 * Math.sqrt(2 * nu) + 50) / nu), lo = nu > 120 ? Math.sqrt(Math.max(0, nu - 8 * Math.sqrt(2 * nu)) / nu) : 0;
    return integra((s) => dens(s) * g(s), lo, hi, 16);
  }
  const nctCdf = (t, nu, d) => (!isFinite(nu) || nu > 1e5 ? Phi(t - d) : Math.min(1, Math.max(0, nctInt(nu, (s) => Phi(t * s - d)))));
  const nctPdf = (t, nu, d) => (!isFinite(nu) || nu > 1e5 ? Math.exp(-((t - d) ** 2) / 2) / Math.sqrt(2 * Math.PI) : nctInt(nu, (s) => (s * Math.exp(-((t * s - d) ** 2) / 2)) / Math.sqrt(2 * Math.PI)));

  /* ---------- Varianzas ---------- */
  // Levene (centro = 'media') o Brown-Forsythe (centro = 'mediana'): F de ANOVA sobre |x − centro|
  function levene(grupos, centro = 'mediana') {
    const z = grupos.map((x) => { const c = centro === 'media' ? media(x) : mediana(x); return x.map((v) => Math.abs(v - c)); });
    const k = z.length, N = suma(z.map((v) => v.length)), zb = suma(z.map(suma)) / N;
    const sb = suma(z.map((v) => v.length * (media(v) - zb) ** 2)), sw = suma(z.map(ssq));
    if (!(sw > 0)) return { W: NaN, p: NaN, gl1: k - 1, gl2: N - k };
    const W = sb / (k - 1) / (sw / (N - k)), P = { d1: k - 1, d2: N - k };
    return { W, p: D.f.sf(P, W), gl1: k - 1, gl2: N - k, centro };
  }
  // Bartlett: χ² con k − 1 g. l. (muy sensible a la falta de normalidad)
  function bartlett(grupos) {
    const k = grupos.length, n = grupos.map((x) => x.length), N = suma(n), v = grupos.map((x) => ssq(x) / (x.length - 1));
    if (n.some((m) => m < 2) || v.some((s) => !(s > 0))) return { B: NaN, p: NaN, gl: k - 1 };
    const sp = suma(n.map((m, i) => (m - 1) * v[i])) / (N - k);
    const num = (N - k) * Math.log(sp) - suma(n.map((m, i) => (m - 1) * Math.log(v[i])));
    const c = 1 + (suma(n.map((m) => 1 / (m - 1))) - 1 / (N - k)) / (3 * (k - 1)), B = num / c;
    return { B, p: D.chi2.sf({ k: k - 1 }, B), gl: k - 1 };
  }
  // ANOVA de Welch (Welch, 1951)
  function welch(grupos) {
    const k = grupos.length, n = grupos.map((x) => x.length), m = grupos.map(media), v = grupos.map((x) => ssq(x) / (x.length - 1));
    if (n.some((q) => q < 2) || v.some((s) => !(s > 0))) return null;
    const w = n.map((q, i) => q / v[i]), W = suma(w), mw = suma(w.map((q, i) => q * m[i])) / W;
    const A = suma(w.map((q, i) => q * (m[i] - mw) ** 2)) / (k - 1), L = suma(w.map((q, i) => (1 - q / W) ** 2 / (n[i] - 1)));
    const B = 1 + (2 * (k - 2) * L) / (k * k - 1), F = A / B, gl1 = k - 1, gl2 = (k * k - 1) / (3 * L);
    return { F, gl1, gl2, p: D.f.sf({ d1: gl1, d2: gl2 }, F), mw };
  }

  /* ---------- Normalidad ---------- */
  // inversa de la normal: aproximación de Abramowitz-Stegun 26.2.23 y tres pasos de Newton
  function ppnd(p) {
    const q = p < 0.5 ? p : 1 - p, t = Math.sqrt(-2 * Math.log(q));
    let x = t - (2.515517 + 0.802853 * t + 0.010328 * t * t) / (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t ** 3);
    if (p < 0.5) x = -x;
    for (let i = 0; i < 4; i++) x -= (Phi(x) - p) / (Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI));
    return x;
  }
  const poly = (c, x) => c.reduceRight((s, a) => s * x + a, 0);
  // Shapiro-Wilk, 3 ≤ n ≤ 5000 (Royston, 1995, algoritmo AS R94)
  function shapiro(datos) {
    const x = [...datos].sort((a, b) => a - b), n = x.length;
    if (n < 3 || n > 5000) return { W: NaN, p: NaN, n };
    const ss = ssq(x);
    if (!(ss > 0)) return { W: NaN, p: NaN, n, constante: true };
    const nn2 = Math.floor(n / 2), a = new Array(nn2 + 1).fill(0);
    if (n === 3) a[1] = Math.SQRT1_2;
    else {
      const m = [0]; let s2 = 0;
      for (let i = 1; i <= nn2; i++) { m[i] = ppnd((i - 0.375) / (n + 0.25)); s2 += m[i] * m[i]; }
      s2 *= 2; const sq = Math.sqrt(s2), rsn = 1 / Math.sqrt(n);
      const a1 = poly([0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056], rsn) - m[1] / sq;
      let i1, fac;
      if (n > 5) { i1 = 3; const a2 = -m[2] / sq + poly([0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633], rsn); fac = Math.sqrt((s2 - 2 * m[1] ** 2 - 2 * m[2] ** 2) / (1 - 2 * a1 * a1 - 2 * a2 * a2)); a[2] = a2; }
      else { i1 = 2; fac = Math.sqrt((s2 - 2 * m[1] ** 2) / (1 - 2 * a1 * a1)); }
      a[1] = a1;
      for (let i = i1; i <= nn2; i++) a[i] = -m[i] / fac;
    }
    let num = 0; for (let i = 1; i <= nn2; i++) num += a[i] * (x[n - i] - x[i - 1]);
    const W = Math.min(1, (num * num) / ss);
    let p;
    if (n === 3) p = Math.max(0, (6 / Math.PI) * (Math.asin(Math.sqrt(W)) - Math.asin(Math.sqrt(0.75))));
    else {
      const y = Math.log(1 - W), xx = Math.log(n);
      let mu, sg, yy = y;
      if (n <= 11) { const gm = -2.273 + 0.459 * n; if (y >= gm) return { W, p: 1e-99, n }; yy = -Math.log(gm - y); mu = poly([0.544, -0.39978, 0.025054, -6.714e-4], n); sg = Math.exp(poly([1.3822, -0.77857, 0.062767, -0.0020322], n)); }
      else { mu = poly([-1.5861, -0.31082, -0.083751, 0.0038915], xx); sg = Math.exp(poly([-0.4803, -0.082676, 0.0030302], xx)); }
      p = Phi(-(yy - mu) / sg);
    }
    return { W, p, n };
  }
  // Jarque-Bera: n/6 (g1² + g2²/4) ~ χ²₂ (n grande)
  function jarqueBera(datos) {
    const n = datos.length, m = media(datos), m2 = suma(datos.map((v) => (v - m) ** 2)) / n, m3 = suma(datos.map((v) => (v - m) ** 3)) / n, m4 = suma(datos.map((v) => (v - m) ** 4)) / n;
    if (n < 4 || !(m2 > 0)) return { JB: NaN, p: NaN, n };
    const g1 = m3 / m2 ** 1.5, g2 = m4 / (m2 * m2) - 3, JB = (n / 6) * (g1 * g1 + (g2 * g2) / 4);
    return { JB, p: Math.exp(-JB / 2), n, g1, g2 };
  }


  /* ---------- Correlación por rangos (Spearman y Kendall) ---------- */
  function rangosDe(v) {
    const idx = v.map((_, i) => i).sort((a, b) => v[a] - v[b]), r = new Array(v.length), t = [];
    for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && v[idx[j + 1]] === v[idx[i]]) j++; for (let q = i; q <= j; q++) r[idx[q]] = (i + j) / 2 + 1; if (j > i) t.push(j - i + 1); i = j + 1; }
    return { r, t };
  }
  // Spearman: r de Pearson de los rangos; p con la t de n − 2 g. l. (como scipy.stats.spearmanr)
  function spearman(x, y) {
    const n = x.length, a = rangosDe(x).r, b = rangosDe(y).r, ma = media(a), mb = media(b);
    const sab = suma(a.map((v, i) => (v - ma) * (b[i] - mb))), saa = ssq(a), sbb = ssq(b);
    if (n < 3 || !(saa > 0) || !(sbb > 0)) return { rho: NaN, p: NaN, n };
    const rho = Math.max(-1, Math.min(1, sab / Math.sqrt(saa * sbb))), t = rho * Math.sqrt((n - 2) / Math.max(1e-300, 1 - rho * rho));
    return { rho, t, p: Math.abs(rho) === 1 ? 0 : Math.min(1, 2 * D.t.sf({ nu: n - 2 }, Math.abs(t))), n };
  }
  // Kendall τ-b: exacto (inversiones) sin empates y n ≤ 40; si no, normal con la corrección de empates (como scipy.stats.kendalltau)
  function kendall(x, y) {
    const n = x.length; let C = 0, Dd = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const s = Math.sign(x[j] - x[i]) * Math.sign(y[j] - y[i]); if (s > 0) C++; else if (s < 0) Dd++; }
    const tx = rangosDe(x).t, ty = rangosDe(y).t, n0 = (n * (n - 1)) / 2, n1 = suma(tx.map((t) => (t * (t - 1)) / 2)), n2 = suma(ty.map((t) => (t * (t - 1)) / 2)), S = C - Dd;
    if (n < 3 || n0 - n1 === 0 || n0 - n2 === 0) return { tau: NaN, p: NaN, n, C, D: Dd };
    const tau = S / Math.sqrt((n0 - n1) * (n0 - n2));
    if (!tx.length && !ty.length && n <= 40) {
      // P(D = k) con n elementos: producto de (1 + q + … + q^(i−1)); S = n0 − 2D
      let c = [1]; for (let i = 2; i <= n; i++) { const nu = new Array(c.length + i - 1).fill(0); for (let k = 0; k < c.length; k++) for (let q = 0; q < i; q++) nu[k + q] += c[k]; c = nu; }
      const tot = suma(c); let p = 0; c.forEach((q, k) => { if (Math.abs(n0 - 2 * k) >= Math.abs(S)) p += q; });
      return { tau, p: Math.min(1, p / tot), S, n, C, D: Dd, exacto: true };
    }
    const v0 = n * (n - 1) * (2 * n + 5), vt = suma(tx.map((t) => t * (t - 1) * (2 * t + 5))), vu = suma(ty.map((t) => t * (t - 1) * (2 * t + 5)));
    const v1 = (suma(tx.map((t) => t * (t - 1))) * suma(ty.map((t) => t * (t - 1)))) / (2 * n * (n - 1)), v2 = n > 2 ? (suma(tx.map((t) => t * (t - 1) * (t - 2))) * suma(ty.map((t) => t * (t - 1) * (t - 2)))) / (9 * n * (n - 1) * (n - 2)) : 0;
    const vr = (v0 - vt - vu) / 18 + v1 + v2, z = S / Math.sqrt(vr);
    return { tau, z, p: Math.min(1, 2 * Phi(-Math.abs(z))), S, n, C, D: Dd, exacto: false };
  }

  /* ---------- p-valores ajustados ---------- */
  const bonferroni = (ps) => ps.map((p) => Math.min(1, p * ps.length));
  function holm(ps) {
    const m = ps.length, ord = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]), out = new Array(m); let mx = 0;
    ord.forEach(([p, i], r) => { mx = Math.max(mx, Math.min(1, (m - r) * p)); out[i] = mx; });
    return out;
  }

  /* ---------- Resumen de supuestos de un ANOVA ---------- */
  function supuestos(grupos, alfa = 0.05) {
    const res = grupos.flatMap((x) => { const m = media(x); return x.map((v) => v - m); });
    const lev = grupos.every((x) => x.length >= 1) ? levene(grupos, 'mediana') : null, sh = res.length >= 3 ? shapiro(res) : null;
    const nok = sh && isFinite(sh.p) ? sh.p >= alfa : null, vok = lev && isFinite(lev.p) ? lev.p >= alfa : null;
    return { levene: lev, shapiro: sh, bartlett: grupos.every((x) => x.length >= 2) ? bartlett(grupos) : null, normalidadOk: nok, varianzasOk: vok };
  }

  return { spearman, kendall, rangosDe, nctCdf, nctPdf, ptukey, qtukey, rangoNormales, levene, bartlett, welch, shapiro, jarqueBera, ppnd, holm, bonferroni, supuestos, media, ssq, mediana, suma, integra };
})();
if (typeof module !== 'undefined') module.exports = Inferencia;
