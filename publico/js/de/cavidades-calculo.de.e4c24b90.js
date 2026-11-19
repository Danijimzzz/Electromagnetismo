const Cavidades = (() => {
  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const C0 = SI.c, MU0 = 4e-7 * Math.PI, ETA0 = 376.730313, PI = Math.PI;
  const f = (x, d = 4) => {
    if (x === Infinity) return '∞';
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, min = 0, estricto = true) {
    if (vacio(sc[k])) throw new Error(`${nom} fehlt`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} muss eine Zahl sein`);
    if (estricto ? v <= min : v < min) throw new Error(`${may(nom)} muss ${estricto ? 'größer als' : 'mindestens'} ${min} sein`);
    return v;
  }
  const entero = (sc, k, nom) => {
    if (vacio(sc[k])) throw new Error(`${nom} fehlt`);
    const v = leeNum(sc[k]);
    if (!Number.isInteger(v) || v < 0 || v > 10) throw new Error(`${may(nom)} muss eine ganze Zahl zwischen 0 und 10 sein`);
    return v;
  };

  const Jn = (n, x) => { let s = 0; const N = 160; for (let k = 0; k < N; k++) { const t = 2 * PI * (k + 0.5) / N; s += Math.cos(n * t - x * Math.sin(t)); } return s / N; };
  const dJ = (n, x) => (Jn(n - 1, x) - Jn(n + 1, x)) / 2;
  function jn(n, x) {
    if (x < 1e-9) return n ? 0 : 1;
    if (x <= n) {
      let t = Math.pow(x, n), s = 1; for (let k = 1; k <= 2 * n + 1; k += 2) t /= k;
      let suma = t; for (let k = 1; k < 60; k++) { t *= -x * x / (2 * k * (2 * n + 2 * k + 1)); suma += t; if (Math.abs(t) < 1e-18 * Math.abs(suma)) break; }
      return suma * s;
    }
    let a = Math.sin(x) / x; if (n === 0) return a;
    let b = Math.sin(x) / (x * x) - Math.cos(x) / x;
    for (let k = 1; k < n; k++) [a, b] = [b, (2 * k + 1) / x * b - a];
    return b;
  }
  const gn = (n, x) => x * jn(n - 1, x) - n * jn(n, x);
  function legendre(n, t) {
    let p0 = 1, p1 = t, d0 = 0, d1 = 1;
    if (n === 0) return [1, 0];
    for (let k = 1; k < n; k++) { const p2 = ((2 * k + 1) * t * p1 - k * p0) / (k + 1), d2 = d0 + (2 * k + 1) * p1; [p0, p1, d0, d1] = [p1, p2, d1, d2]; }
    return [p1, d1];
  }
  const memoria = {};
  function ceros(clave, g, cuantos) {
    const c = memoria[clave] || (memoria[clave] = []);
    let x = c.length ? c[c.length - 1] + 0.02 : 0.1;
    while (c.length < cuantos && x < 300) {
      const x2 = x + 0.02, a = g(x), b = g(x2);
      if (a !== 0 && (a > 0) !== (b > 0)) {
        let lo = x, hi = x2, fl = a;
        for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2, fm = g(m); if ((fm > 0) === (fl > 0)) { lo = m; fl = fm; } else hi = m; }
        c.push((lo + hi) / 2); x = hi + 0.02;
      } else x = x2;
    }
    return c;
  }
  const cerosJ = (n, k) => ceros('J' + n, (x) => Jn(n, x), k)[k - 1];
  const cerosJp = (n, k) => ceros('Jp' + n, (x) => dJ(n, x), k)[k - 1];
  const cerosj = (n, k) => ceros('j' + n, (x) => jn(n, x), k)[k - 1];
  const cerosg = (n, k) => ceros('g' + n, (x) => gn(n, x), k)[k - 1];
  function simpson(fn, a, b, N = 1200) { const h = (b - a) / N; let s = fn(a) + fn(b); for (let i = 1; i < N; i++) s += fn(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }

  const Ie = (t, i, L) => t === 's' ? (i ? L / 2 : 0) : (i ? L / 2 : L);
  const pared = (t) => t === 'c' ? 1 : 0;
  const RECT = {
    valida(t, [m, n, p]) {
      if (t === 'TE') { if (!m && !n) throw new Error('Bei den TE-Moden dürfen m und n nicht beide 0 sein'); if (p < 1) throw new Error('Bei den TE-Moden muss p mindestens 1 sein'); }
      else if (m < 1 || n < 1) throw new Error('Bei den TM-Moden müssen m und n mindestens 1 sein');
    },
    ks(D, [m, n, p]) { return [m * PI / D.a, n * PI / D.b, p * PI / D.d]; },
    frec(D, t, i, v) { const k = RECT.ks(D, i); return v * Math.hypot(...k) / (2 * PI); },
    comps(D, t, i) {
      const [kx, ky, be] = RECT.ks(D, i), kc2 = kx * kx + ky * ky, kc = Math.sqrt(kc2);
      return t === 'TE' ? [{ A: -kx * be / kc2, t: 'scc' }, { A: -ky * be / kc2, t: 'csc' }, { A: 1, t: 'ccs' }] : [{ A: -ky / kc, t: 'scc' }, { A: kx / kc, t: 'csc' }, { A: 0, t: 'ccs' }];
    },
    gamma(D, t, i) {
      const L = [D.a, D.b, D.d], cs = RECT.comps(D, t, i);
      let vol = 0, sup = 0;
      for (const c of cs) vol += c.A * c.A * [0, 1, 2].reduce((p, k) => p * Ie(c.t[k], i[k], L[k]), 1);
      for (let k = 0; k < 3; k++) for (let q = 0; q < 3; q++) if (q !== k) {
        const c = cs[q]; sup += 2 * c.A * c.A * pared(c.t[k]) * [0, 1, 2].filter((j) => j !== k).reduce((p, j) => p * Ie(c.t[j], i[j], L[j]), 1);
      }
      return vol / sup;
    },
    campo(D, t, i) {
      const [kx, ky, be] = RECT.ks(D, i), cs = RECT.comps(D, t, i), F = (u, s, k) => (u === 's' ? Math.sin : Math.cos)(k * s);
      return (x, y, z) => cs.map((c) => c.A * F(c.t[0], x, kx) * F(c.t[1], y, ky) * F(c.t[2], z, be));
    },
    lims: (D) => [[0, D.a], [0, D.b], [0, D.d]],
    dentro: (D) => (x, y, z) => x >= 0 && x <= D.a && y >= 0 && y <= D.b && z >= 0 && z <= D.d,
    listaIdx() { const l = []; for (let m = 0; m <= 5; m++) for (let n = 0; n <= 5; n++) for (let p = 0; p <= 5; p++) { if ((m || n) && p) l.push(['TE', [m, n, p]]); if (m && n) l.push(['TM', [m, n, p]]); } return l; },
    nom: (t, [m, n, p]) => `${t}<sub>${m}${n}${p}</sub>`, mnom: (t, [m, n, p]) => `"${t}"_{${m}${n}${p}}`,
  };

  const CIL = {
    valida(t, [n, m, p]) {
      if (m < 1) throw new Error('Der radiale Index m muss mindestens 1 sein');
      if (t === 'TE' && p < 1) throw new Error('Bei den TE-Moden muss p mindestens 1 sein');
    },
    x(t, [n, m]) { return t === 'TM' ? cerosJ(n, m) : cerosJp(n, m); },
    frec(D, t, i, v) { return v / (2 * PI) * Math.hypot(CIL.x(t, i) / D.R, i[2] * PI / D.L); },
    gamma(D, t, [n, m, p]) {
      const x = CIL.x(t, [n, m]), kc = x / D.R, be = p * PI / D.L, rho = be / kc, R = D.R, L = D.L;
      const Af = n ? PI : 2 * PI, As = n ? PI : 0, Zc = p ? L / 2 : L, Zs = p ? L / 2 : 0;
      const nJu = (u) => u < 1e-9 ? (n === 1 ? 0.5 : 0) : n * Jn(n, u) / u;
      const tr = (r) => { const u = kc * r, a = dJ(n, u), b = nJu(u); return a * a * Af + b * b * As; };   // |Hr, Hφ|² sin la parte axial
      let vol, lat, tapas;
      if (t === 'TM') {
        vol = simpson((r) => r * tr(r) * Zc, 0, R); lat = R * dJ(n, x) ** 2 * Af * Zc; tapas = 2 * simpson((r) => r * tr(r), 0, R);
      } else {
        vol = simpson((r) => r * (rho * rho * tr(r) * Zc + Jn(n, kc * r) ** 2 * Af * Zs), 0, R);
        lat = R * (rho * rho * nJu(x) ** 2 * As * Zc + Jn(n, x) ** 2 * Af * Zs); tapas = 2 * simpson((r) => r * rho * rho * tr(r), 0, R);
      }
      return vol / (lat + tapas);
    },
    campo(D, t, [n, m, p]) {
      const x = CIL.x(t, [n, m]), kc = x / D.R, be = p * PI / D.L, rho = be / kc;
      return (X, Y, Z) => {
        const r = Math.hypot(X, Y), ph = Math.atan2(Y, X), u = kc * r, cp = Math.cos(ph), sp = Math.sin(ph), cn = Math.cos(n * ph), sn = Math.sin(n * ph);
        const nJu = u < 1e-9 ? (n === 1 ? 0.5 : 0) : n * Jn(n, u) / u, cz = Math.cos(be * Z), sz = Math.sin(be * Z);
        let Hr, Hp, Hz;
        if (t === 'TM') { Hr = nJu * sn * cz; Hp = dJ(n, u) * cn * cz; Hz = 0; }
        else { Hr = rho * dJ(n, u) * cn * cz; Hp = -rho * nJu * sn * cz; Hz = Jn(n, u) * cn * sz; }
        return [Hr * cp - Hp * sp, Hr * sp + Hp * cp, Hz];
      };
    },
    lims: (D) => [[-D.R, D.R], [-D.R, D.R], [0, D.L]],
    dentro: (D) => (x, y, z) => x * x + y * y <= D.R * D.R && z >= 0 && z <= D.L,
    listaIdx() { const l = []; for (let n = 0; n <= 4; n++) for (let m = 1; m <= 3; m++) for (let p = 0; p <= 4; p++) { l.push(['TM', [n, m, p]]); if (p) l.push(['TE', [n, m, p]]); } return l; },
    nom: (t, [n, m, p]) => `${t}<sub>${n}${m}${p}</sub>`, mnom: (t, [n, m, p]) => `"${t}"_{${n}${m}${p}}`,
  };

  const ESF = {
    valida(t, [n, l]) { if (n < 1) throw new Error('Die Ordnung n muss mindestens 1 sein'); if (l < 1) throw new Error('Der radiale Index l muss mindestens 1 sein'); },
    x(t, [n, l]) { return t === 'TE' ? cerosj(n, l) : cerosg(n, l); },
    frec(D, t, i, v) { return v * ESF.x(t, i) / (2 * PI * D.R); },
    gamma(D, t, [n, l]) {
      const x = ESF.x(t, [n, l]), R = D.R, k = x / R, N = n * (n + 1);
      if (t === 'TE') return simpson((r) => N * jn(n, k * r) ** 2 + gn(n, k * r) ** 2, 0, R) / gn(n, x) ** 2;
      return simpson((r) => r * r * jn(n, k * r) ** 2, 0, R) / (R * R * jn(n, x) ** 2);
    },
    campo(D, t, [n, l]) {
      const x = ESF.x(t, [n, l]), k = x / D.R, N = n * (n + 1);
      return (X, Y, Z) => {
        const r = Math.max(Math.hypot(X, Y, Z), 1e-9 * D.R), ct = Z / r, st = Math.hypot(X, Y) / r, ph = Math.atan2(Y, X), cp = Math.cos(ph), sp = Math.sin(ph), s = k * r;
        const [P, dP] = legendre(n, ct);
        if (t === 'TM') { const Hp = -jn(n, s) * st * dP; return [-Hp * sp, Hp * cp, 0]; }
        const Hr = -N * jn(n, s) * P / r, Ht = gn(n, s) * st * dP / r;
        return [Hr * st * cp + Ht * ct * cp, Hr * st * sp + Ht * ct * sp, Hr * ct - Ht * st];
      };
    },
    lims: (D) => [[-D.R, D.R], [-D.R, D.R], [-D.R, D.R]],
    dentro: (D) => (x, y, z) => x * x + y * y + z * z <= D.R * D.R,
    listaIdx() { const l = []; for (let n = 1; n <= 4; n++) for (let q = 1; q <= 3; q++) { l.push(['TE', [n, q]]); l.push(['TM', [n, q]]); } return l; },
    nom: (t, [n, l]) => `${t}<sub>${n}${l}</sub>`, mnom: (t, [n, l]) => `"${t}"_{${n}${l}}`,
  };
  const GEOS = { rect: RECT, cil: CIL, esf: ESF };

  function lectura(sc) {
    const geo = GEOS[sc.geo] ? sc.geo : 'rect', G = GEOS[geo];
    const D = geo === 'rect' ? { a: lee(sc, 'a', 'die Seite a') / 1000, b: lee(sc, 'b', 'die Seite b') / 1000, d: lee(sc, 'd', 'die Länge d') / 1000 }
      : geo === 'cil' ? { R: lee(sc, 'R', 'der Radius R') / 1000, L: lee(sc, 'L', 'die Länge L') / 1000 } : { R: lee(sc, 'R', 'der Radius R') / 1000 };
    const er = lee(sc, 'er', 'εr'), tand = vacio(sc.tand) ? 0 : lee(sc, 'tand', 'tg δ', 0, false), sigma = lee(sc, 'sigma', 'die Leitfähigkeit σ');
    const tipo = sc.tipo === 'TM' ? 'TM' : 'TE', nI = geo === 'esf' ? 2 : 3;
    const i = [entero(sc, 'i1', 'der erste Index'), entero(sc, 'i2', 'der zweite Index'), nI === 3 ? entero(sc, 'i3', 'der dritte Index') : 0];
    G.valida(tipo, i);
    return { geo, G, D, er, tand, sigma, tipo, i };
  }
  const cuerpo = (geo, D, G, tipo, i, v) => ({ lims: G.lims(D), dentro: G.dentro(D), H: G.campo(D, tipo, i) });

  const vacio2 = (v) => v === undefined || v === null || String(v).trim() === '';
  const gammaCurva = (Q0, beta, d) => { const x = 2 * Q0 * d; return Math.sqrt(((beta - 1) ** 2 + x * x) / ((beta + 1) ** 2 + x * x)); };
  function curva(sol, n = 401) {
    const pts = [], span = Math.max(4 / sol.QL, 1e-9);
    for (let i = 0; i < n; i++) { const d = -span + (2 * span * i) / (n - 1), g = gammaCurva(sol.Q, sol.beta, d); pts.push({ f: sol.f0 * (1 + d), s11: 20 * Math.log10(Math.max(g, 1e-6)) }); }
    return pts;
  }
  function resolver(sc) {
    const { geo, G, D, er, tand, sigma, tipo, i } = lectura(sc);
    const v = C0 / Math.sqrt(er), eta = ETA0 / Math.sqrt(er);
    const f0 = G.frec(D, tipo, i, v), w0 = 2 * PI * f0, lam = v / f0, k = w0 / v;
    const delta = 1 / Math.sqrt(PI * f0 * MU0 * sigma), Rs = 1 / (sigma * delta);
    const gam = G.gamma(D, tipo, i), Qc = 2 * gam / delta, Qd = tand > 0 ? 1 / tand : Infinity, Q = 1 / (1 / Qc + (tand > 0 ? tand : 0)), df = f0 / Q;
    const modos = G.listaIdx().map(([t, ix]) => ({ tipo: t, i: ix, f: G.frec(D, t, ix, v), nombre: G.nom(t, ix) })).sort((p, q) => p.f - q.f || (p.tipo < q.tipo ? -1 : 1)).slice(0, 12);
    const beta = vacio2(sc.beta) ? 1 : leeNum(sc.beta);
    if (!(beta > 0) || !isFinite(beta)) throw new Error('Der Kopplungsfaktor β muss größer als 0 sein');
    const QL = Q / (1 + beta), dfL = f0 / QL, gam0 = Math.abs(beta - 1) / (beta + 1), s11min = 20 * Math.log10(Math.max(gam0, 1e-6)), tipoAcoplo = Math.abs(beta - 1) < 1e-9 ? 'kritisch' : beta < 1 ? 'subacoplado' : 'sobreacoplado';
    const mn = G.mnom(tipo, i), nm = G.nom(tipo, i);
    const mm = (x) => f(x * 1000);
    let dat, form, cerrada = null;
    if (geo === 'rect') {
      dat = `Rechteckhohlraum $a = ${mm(D.a)} "mm"$, $b = ${mm(D.b)} "mm"$, $d = ${mm(D.d)} "mm"$`;
      form = `$f_0 = v/2 √({(m/a)^2 + (n/b)^2 + (p/d)^2}) = ${f(v / 2)}·√({(${i[0]}/${f(D.a)})^2 + (${i[1]}/${f(D.b)})^2 + (${i[2]}/${f(D.d)})^2}) = ${f(f0 / 1e9)} "GHz"$`;
      if (tipo === 'TE' && i[0] === 1 && i[1] === 0 && i[2] === 1) {
        const { a, b, d } = D, Qf = (k * a * d) ** 3 * b * eta / (2 * PI * PI * Rs) / (2 * a ** 3 * b + 2 * b * d ** 3 + a ** 3 * d + a * d ** 3);
        cerrada = { t: 'Geschlossene Formel der Mode TE101', html: `$Q_c = {(k a d)^3 b η}/{2π^2 R_s} · 1/{2a^3 b + 2b d^3 + a^3 d + a d^3} = ${f(Qf)}$`, valor: Qf };
      }
    } else if (geo === 'cil') {
      const x = G.x(tipo, i);
      dat = `Zylindrischer Hohlraum mit Radius $R = ${mm(D.R)} "mm"$ und Länge $L = ${mm(D.L)} "mm"$`;
      form = `$f_0 = v/{2π} √({(${tipo === 'TM' ? 'x_{nm}' : 'x′_{nm}'}/R)^2 + (p π/L)^2})$, mit $${tipo === 'TM' ? 'x_{nm}' : "x′_{nm}"} = ${f(x)}$ (${tipo === 'TM' ? `${i[1]}. Nullstelle von $J_${i[0]}$` : `${i[1]}. Nullstelle von $J′_${i[0]}$`}): $f_0 = ${f(v / (2 * PI))}·√({(${f(x)}/${f(D.R)})^2 + (${i[2]}π/${f(D.L)})^2}) = ${f(f0 / 1e9)} "GHz"$`;
      if (tipo === 'TM' && i[0] === 0 && i[1] === 1 && i[2] === 0) { const Qf = (D.R / delta) / (1 + D.R / D.L); cerrada = { t: 'Geschlossene Formel der Mode TM010', html: `$Q_c = {R/δ}/{1 + R/L} = ${f(Qf)}$`, valor: Qf }; }
    } else {
      const x = G.x(tipo, i);
      dat = `Kugelhohlraum mit Radius $R = ${mm(D.R)} "mm"$`;
      form = `$f_0 = {v x_{nl}}/{2π R}$, mit $x_{nl} = ${f(x)}$ (${tipo === 'TE' ? `${i[1]}. Nullstelle von $j_${i[0]}$` : `${i[1]}. Nullstelle von $(x j_${i[0]})′$`}): $f_0 = ${f(v)}·${f(x)}/(2π·${f(D.R)}) = ${f(f0 / 1e9)} "GHz"$`;
      if (tipo === 'TE') cerrada = { t: 'Geschlossene Formel der TE-Moden der Kugel', html: `$Q_c = R/δ = ${f(D.R / delta)}$`, valor: D.R / delta };
    }
    const pasos = [
      { t: 'Daten', html: `${dat}, gefüllt mit $ε_r = ${f(er)}$, $"tan" δ = ${f(tand)}$ und Wänden mit $σ = ${f(sigma)} "S/m"$. Mode ${mn}.` },
      { t: 'Geschwindigkeit und Wellenlänge in der Füllung', html: `$v = c/√(ε_r) = ${f(v)} "m/s"$, $η = η_0/√(ε_r) = ${f(eta)} "Ω"$` },
      { t: 'Resonanzfrequenz', html: `${form}, und $λ_0 = v/f_0 = ${f(lam * 1000)} "mm"$` },
      { t: 'Eindringtiefe und Oberflächenwiderstand der Wände', html: `$δ = 1/√(π f_0 μ_0 σ) = ${f(delta * 1e6)} "μm"$, $R_s = 1/(σ δ) = ${f(Rs)} "Ω"$` },
      { t: 'Gütefaktor der Wände', html: `$Q_c = {ω_0 μ_0 ∫|H|^2 dV}/{R_s ∮|H_t|^2 dS} = 2Γ/δ$, mit $Γ = ∫|H|^2 dV/∮|H_t|^2 dS = ${f(gam * 1000)} "mm"$: $Q_c = ${f(Qc)}$` },
    ];
    if (cerrada) pasos.push({ t: cerrada.t, html: `${cerrada.html} (stimmt mit der vorherigen Rechnung überein)` });
    pasos.push(
      { t: 'Gütefaktor des Dielektrikums', html: tand > 0 ? `$Q_d = 1/{"tan" δ} = ${f(Qd)}$` : 'Ohne Verluste in der Füllung ($"tan" δ = 0$): $Q_d = ∞$' },
      { t: 'Gesamtgütefaktor und Bandbreite', html: `$1/Q = 1/Q_c + 1/Q_d$ → $Q = ${f(Q)}$, und $Δf = f_0/Q = ${f(df / 1e3)} "kHz"$` },
      { t: 'Kopplung und Resonanzkurve', html: `Mit dem Kopplungsfaktor $β = ${f(beta)}$ (${tipoAcoplo}): $Q_L = {Q_0}/{1 + β} = ${f(QL)}$, belastete Bandbreite $Δf_L = f_0/Q_L = ${f(dfL / 1e3)} "kHz"$. In der Resonanz gilt $|Γ| = {|β − 1|}/{β + 1} = ${f(gam0)}$, also $|S_{11}| = ${f(s11min)} "dB"$` + (Math.abs(beta - 1) < 1e-9 ? ' (angepasst: Es wird nichts reflektiert).' : '.') });
    return { beta, QL, dfL, gam0, s11min, tipoAcoplo, geo, D, er, tand, sigma, tipo, i, v, eta, f0, w0, lam, k, delta, Rs, gam, Qc, Qd, Q, df, modos, nombre: nm, mnombre: mn, cerrada: cerrada && cerrada.valor, pasos, G, cuerpo: cuerpo(geo, D, G, tipo, i, v) };
  }
  const modoCampo = (sc) => { const s = resolver(sc); return { H: s.cuerpo.H, k: s.k, lims: s.cuerpo.lims, dentro: s.cuerpo.dentro, f0: s.f0 }; };

  const rot = (H, p, h) => {
    const d = (a, j) => { const p1 = p.slice(), p2 = p.slice(); p1[j] += h; p2[j] -= h; return (H(...p1)[a] - H(...p2)[a]) / (2 * h); };
    return [d(2, 1) - d(1, 2), d(0, 2) - d(2, 0), d(1, 0) - d(0, 1)];
  };
  const EJES = { xz: [0, 2, 1], yz: [1, 2, 0], xy: [0, 1, 2] };   // [eje horizontal, eje vertical, eje normal]
  function mapa(sol, plano, pos, que = 'E', n = 56) {
    const [iu, iv, iw] = EJES[plano] || EJES.xz, lims = sol.cuerpo.lims, H = sol.cuerpo.H, dentro = sol.cuerpo.dentro;
    const pp = Math.min(0.98, Math.max(0.02, pos)), c = lims[iw][0] + pp * (lims[iw][1] - lims[iw][0]);
    let perfil, u0 = lims[iu][0], u1 = lims[iu][1], v0 = lims[iv][0], v1 = lims[iv][1];
    if (sol.geo === 'esf' || (sol.geo === 'cil' && iw === 2)) {
      const r = sol.geo === 'esf' ? Math.sqrt(Math.max(0, sol.D.R ** 2 - c * c)) : sol.D.R; perfil = { t: 'circ', r }; u0 = v0 = -r; u1 = v1 = r;
    } else {
      if (sol.geo === 'cil') { const w = Math.sqrt(Math.max(0, sol.D.R ** 2 - c * c)); u0 = -w; u1 = w; }
      perfil = { t: 'rect', u0, u1, v0, v1 };
    }
    const h = 1e-5 * Math.max(...lims.map((l) => l[1] - l[0])), mag = new Float64Array(n * n).fill(NaN), vu = new Float64Array(n * n), vv = new Float64Array(n * n);
    const eta = sol.eta, kk = sol.k;
    let max = 0;
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      const u = u0 + (a + 0.5) / n * (u1 - u0), v = v0 + (b + 0.5) / n * (v1 - v0), p = [0, 0, 0]; p[iu] = u; p[iv] = v; p[iw] = c;
      if (!dentro(...p)) continue;
      const F = que === 'H' ? H(...p) : rot(H, p, h).map((q) => q * eta / kk), id = a * n + b;
      mag[id] = Math.hypot(...F); vu[id] = F[iu]; vv[id] = F[iv]; if (mag[id] > max) max = mag[id];
    }
    return { n, u0, u1, v0, v1, mag, vu, vv, max, perfil, plano, c };
  }

  const ejemplos = [
    { clave: 'rect-te101', nombre: 'Rechteckiger Kupferhohlraum (22,86 × 10,16 × 30 mm): Mode TE101', sc: { geo: 'rect', a: '22,86', b: '10,16', d: '30', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '1', i2: '0', i3: '1' } },
    { clave: 'cubo', nombre: 'Würfelförmiger Hohlraum mit 40 mm: Mode TE101', sc: { geo: 'rect', a: '40', b: '40', d: '40', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '1', i2: '0', i3: '1' } },
    { clave: 'teflon', nombre: 'Mit Teflon gefüllter Hohlraum (εr = 2,1, tan δ = 3·10⁻⁴): Mode TE101', sc: { geo: 'rect', a: '30', b: '15', d: '30', er: '2,1', tand: '3e-4', sigma: '5,8e7', tipo: 'TE', i1: '1', i2: '0', i3: '1' } },
    { clave: 'cil-tm010', nombre: 'Zylindrischer Hohlraum mit R = 25 mm und L = 40 mm: Mode TM010', sc: { geo: 'cil', R: '25', L: '40', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TM', i1: '0', i2: '1', i3: '0' } },
    { clave: 'cil-te011', nombre: 'Zylindrischer Hohlraum mit R = 20 mm und L = 40 mm: Mode TE011', sc: { geo: 'cil', R: '20', L: '40', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '0', i2: '1', i3: '1' } },
    { clave: 'cil-te111', nombre: 'Zylindrischer Hohlraum mit R = 20 mm und L = 40 mm: Mode TE111', sc: { geo: 'cil', R: '20', L: '40', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '1', i2: '1', i3: '1' } },
    { clave: 'esf-tm11', nombre: 'Kugelhohlraum mit R = 50 mm: Mode TM11', sc: { geo: 'esf', R: '50', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TM', i1: '1', i2: '1', i3: '0' } },
    { clave: 'esf-te11', nombre: 'Kugelhohlraum mit R = 50 mm: Mode TE11', sc: { geo: 'esf', R: '50', er: '1', tand: '0', sigma: '5,8e7', tipo: 'TE', i1: '1', i2: '1', i3: '0' } },
  ];

  return { resolver, curva, gammaCurva, modoCampo, mapa, ejemplos, f, Jn, jn, cerosJ, cerosJp, cerosj, cerosg, C0, MU0 };
})();

