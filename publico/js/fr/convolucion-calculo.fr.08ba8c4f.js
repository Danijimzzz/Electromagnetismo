const Convolucion = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const U = [[1, 's'], [1e-3, 'ms'], [1e-6, 'µs'], [1e-9, 'ns'], [1e-12, 'ps']];
  const unidad = (ref) => { const a = Math.abs(ref); return !(a > 0) || !isFinite(a) ? U[0] : U.find(([k]) => a >= k * 0.9999) || U[U.length - 1]; };
  const ft = (t, ref = t, mates = false) => { const [k, u] = unidad(ref); const v = Math.abs(t / k) < 1e-9 ? 0 : t / k; return mates ? `${f(v)} "${u}"` : `${f(v)} ${u}`; };

  const TIPOS = {
    rect: { nom: 'Impulsion rectangulaire', par: ['A', 'T', 'a'] },
    tri: { nom: 'Impulsion triangulaire', par: ['A', 'T', 'a'] },
    sen: { nom: 'Impulsion sinusoïdale (demi-sinus)', par: ['A', 'T', 'a'] },
    esc: { nom: 'Échelon', par: ['A', 'a'] },
    exp: { nom: 'Exponentielle décroissante', par: ['A', 'tau', 'a'] },
    imp: { nom: 'Impulsion de Dirac (delta)', par: ['A', 'a'] },
  };
  const SISTEMAS = {
    rc: { nom: 'Filtre RC passe-bas', par: ['R', 'C'] },
    rlc: { nom: 'Filtre RLC série (passe-bas)', par: ['R', 'L', 'C'] },
    rl: { nom: 'Filtre RL passe-bas (sortie sur R)', par: ['R', 'L'] },
    ph: { nom: 'Filtre RC passe-haut (sortie sur R)', par: ['R', 'C'] },
    bp: { nom: 'Filtre RLC passe-bande (sortie sur R)', par: ['R', 'L', 'C'] },
    media: { nom: 'Moyenne glissante', par: ['mT'] },
    ret: { nom: 'Retard pur', par: ['ma'] },
  };
  const ETIQ = { A: 'Amplitude', T: 'Durée', a: 'Retard', tau: 'Constante de temps τ', R: 'Résistance R', L: 'Inductance L', C: 'Capacité C', mT: 'Fenêtre T', ma: 'Retard' };
  const UNID = { A: '', T: 's', a: 's', tau: 's', R: 'Ω', L: 'H', C: 'F', mT: 's', ma: 's' };
  const HORIZONTE = 10; // un escalón o una exponencial se cortan a 10 veces su escala de tiempo

  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom, pos = false, base = 1) {
    if (vacio(sc[k])) throw new Error(`Il manque : ${nom}`);
    const v = Herramienta.leeSI(sc[k], base);
    const N = nom[0].toUpperCase() + nom.slice(1);
    if (!isFinite(v)) throw new Error(`${N} doit être un nombre`);
    if (pos && v <= 0) throw new Error(`${N} doit être supérieur à 0`);
    return v;
  }
  const nombreDe = (k) => (k === 'A' ? 'la amplitud' : k === 'T' || k === 'mT' ? 'la durée' : k === 'a' || k === 'ma' ? 'el retraso' : k === 'tau' ? 'la constante de temps τ' : k === 'R' ? 'la resistencia R' : k === 'L' ? 'la inductancia L' : 'la capacidad C');

  function señal(tipo, p, ini, esc) {
    const n = p.n, A = p.A, a = p.a ?? 0, T = p.T, tau = p.tau;
    const s = { tipo, n, A, a, T, tau, delta: false, esc: false };
    if (tipo === 'rect') Object.assign(s, { ini: a, fin: a + T, val: (t) => (t >= a && t <= a + T ? A : 0), area: A * T, car: T });
    else if (tipo === 'tri') Object.assign(s, { ini: a, fin: a + T, val: (t) => (t >= a && t <= a + T ? A * (1 - Math.abs((2 * (t - a)) / T - 1)) : 0), area: (A * T) / 2, car: T });
    else if (tipo === 'sin') Object.assign(s, { ini: a, fin: a + T, val: (t) => (t >= a && t <= a + T ? A * Math.sin((Math.PI * (t - a)) / T) : 0), area: (2 * A * T) / Math.PI, car: T });
    else if (tipo === 'esc') Object.assign(s, { ini: a, fin: a + HORIZONTE * esc, val: (t) => (t >= a ? A : 0), area: A > 0 ? Infinity : -Infinity, car: 0, esc: true });
    else if (tipo === 'exp') Object.assign(s, { ini: a, fin: a + HORIZONTE * tau, val: (t) => (t >= a ? A * Math.exp(-(t - a) / tau) : 0), area: A * tau, car: tau, inf: true });
    else if (tipo === 'imp') Object.assign(s, { ini: a, fin: a, val: () => 0, area: A, car: 0, delta: true });
    else if (tipo === 'ph') Object.assign(s, { ini: 0, fin: HORIZONTE * p.tau, val: (t) => (t >= 0 ? -Math.exp(-t / p.tau) / p.tau : 0), area: 0, car: p.tau, inf: true, directo: 1, tau: p.tau });
    else if (tipo === 'bp') {
      const { w0, z } = p, d = bpImpulso(w0, z);
      Object.assign(s, { ini: 0, fin: p.fin, val: (t) => (t >= 0 ? d(t) : 0), area: 0, car: p.car, w0, z, inf: true });
    } else if (tipo === 'rlc') {
      const { w0, z } = p, val = rlcImpulso(w0, z);
      Object.assign(s, { ini: 0, fin: p.fin, val: (t) => (t >= 0 ? val(t) : 0), area: 1, car: p.car, w0, z, inf: true });
    }
    s.n = n;
    return s;
  }
  function rlcImpulso(w0, z) {
    if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return (t) => ((w0 * w0) / wd) * Math.exp(-z * w0 * t) * Math.sin(wd * t); }
    if (z === 1) return (t) => w0 * w0 * t * Math.exp(-w0 * t);
    const r = Math.sqrt(z * z - 1), p1 = w0 * (z - r), p2 = w0 * (z + r);
    return (t) => ((w0 * w0) / (p2 - p1)) * (Math.exp(-p1 * t) - Math.exp(-p2 * t));
  }

  function bpImpulso(w0, z) {
    const k = (2 * z) / w0;
    if (z < 1) { const sg = z * w0, wd = w0 * Math.sqrt(1 - z * z); return (t) => k * ((w0 * w0) / wd) * Math.exp(-sg * t) * (wd * Math.cos(wd * t) - sg * Math.sin(wd * t)); }
    if (z === 1) return (t) => k * w0 * w0 * (1 - w0 * t) * Math.exp(-w0 * t);
    const r = Math.sqrt(z * z - 1), p1 = w0 * (z - r), p2 = w0 * (z + r);
    return (t) => k * ((w0 * w0) / (p2 - p1)) * (p2 * Math.exp(-p2 * t) - p1 * Math.exp(-p1 * t));
  }

  function leeBiblioteca(sc, p) {
    const tipo = sc[p + 't'];
    if (!TIPOS[tipo]) throw new Error(`Choisissez le signal ${p === 'x' ? 'x(t)' : 'h(t)'}`);
    const q = { n: p }, nom = (k) => `${nombreDe(k)} de ${p}(t)`;
    for (const k of TIPOS[tipo].par) q[k] = lee(sc, p + k, nom(k), k === 'T' || k === 'tau');
    if (q.A === 0) throw new Error(`L'amplitude de ${p}(t) ne peut pas être 0`);
    return { tipo, q };
  }
  function leeSistema(sc) {
    const sis = sc.sis;
    if (!SISTEMAS[sis]) throw new Error('Choisissez le système');
    const q = { n: 'h' };
    for (const k of SISTEMAS[sis].par) q[k] = lee(sc, k, nombreDe(k), k !== 'ma');
    if (sis === 'rc') { const tau = q.R * q.C; return { tipo: 'exp', q: { n: 'h', A: 1 / tau, a: 0, tau, R: q.R, C: q.C }, sis }; }
    if (sis === 'rl') { const tau = q.L / q.R; return { tipo: 'exp', q: { n: 'h', A: 1 / tau, a: 0, tau, R: q.R, L: q.L }, sis }; }
    if (sis === 'ph') { const tau = q.R * q.C; return { tipo: 'ph', q: { n: 'h', tau, R: q.R, C: q.C }, sis }; }
    if (sis === 'media') return { tipo: 'rect', q: { n: 'h', A: 1 / q.mT, a: 0, T: q.mT }, sis };
    if (sis === 'ret') return { tipo: 'imp', q: { n: 'h', A: 1, a: q.ma }, sis };
    const w0 = 1 / Math.sqrt(q.L * q.C), z = (q.R / 2) * Math.sqrt(q.C / q.L);
    const lento = z < 1 ? z * w0 : w0 * (z - Math.sqrt(z * z - 1));
    return { tipo: sis,  q: { n: 'h', w0, z, fin: Math.min(HORIZONTE / lento, 400 / w0), car: Math.min(1 / lento, 40 / w0), R: q.R, L: q.L, C: q.C }, sis };
  }

  const N_SAL = 1600, N_ENT = 900;
  function convolucionar(x, h) {
    const t0 = x.ini + h.ini, t1 = Math.min(x.esc ? x.fin + h.ini : Infinity, h.esc ? h.fin + x.ini : Infinity, x.fin + h.fin), N = N_SAL, dt = (t1 - t0) / N;
    const t = new Float64Array(N + 1), y = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) t[i] = t0 + i * dt;
    if (x.delta || h.delta) {
      const d = x.delta ? x : h, o = x.delta ? h : x;
      const lo = o.ini + d.a, hi = o.fin + d.a, dd = (hi - lo) / N;
      for (let i = 0; i <= N; i++) { t[i] = lo + i * dd; y[i] = d.A * o.val(t[i] - d.a); }
      return { t, y };
    }
    const M = N_ENT;
    for (let i = 0; i <= N; i++) {
      const lo = Math.max(x.ini, t[i] - h.fin), hi = Math.min(x.fin, t[i] - h.ini);
      if (hi <= lo) continue;
      const dtau = (hi - lo) / M; let s = 0;
      for (let j = 0; j < M; j++) { const tau = lo + (j + 0.5) * dtau; s += x.val(tau) * h.val(t[i] - tau); }
      y[i] = s * dtau;
    }
    if (h.directo) for (let i = 0; i <= N; i++) y[i] += h.directo * x.val(t[i]);
    return { t, y };
  }
  function valorEn(sol, tt) {
    const { t, y } = sol, n = t.length - 1;
    if (tt <= t[0]) return y[0]; if (tt >= t[n]) return y[n];
    const u = ((tt - t[0]) / (t[n] - t[0])) * n, i = Math.min(n - 1, Math.floor(u)), r = u - i;
    return y[i] * (1 - r) + y[i + 1] * r;
  }

  function escalon(h, ganancia) {
    if (h.delta) return null;
    const M = 6000, dt = (h.fin - h.ini) / M, t = new Float64Array(M + 1), s = new Float64Array(M + 1);
    t[0] = h.ini; let acum = h.directo || 0; s[0] = acum;
    for (let i = 1; i <= M; i++) { t[i] = h.ini + i * dt; acum += 0.5 * (h.val(t[i - 1]) + h.val(t[i])) * dt; s[i] = acum; }
    const g = ganancia;
    if (Math.abs(g) < 1e-9 * (Math.abs(s[0]) + Math.max(...s.map(Math.abs)) + 1e-300)) {   // sin ganancia en continua (paso alto, paso banda): se mide contra el pico
      let pico = 0, tp = h.ini; for (let i = 0; i <= M; i++) if (Math.abs(s[i]) > Math.abs(pico)) { pico = s[i]; tp = t[i]; }
      let ult = 0; for (let i = M; i >= 0; i--) if (Math.abs(s[i]) > 0.02 * Math.abs(pico)) { ult = t[i]; break; }
      return { t, s, final: 0, cero: true, pico, tpico: tp, subida: NaN, sobre: NaN, establecimiento: ult - h.ini };
    }
    const cruce = (nivel) => { for (let i = 1; i <= M; i++) if (s[i] >= nivel) return t[i - 1] + ((nivel - s[i - 1]) / (s[i] - s[i - 1])) * dt; return NaN; };
    const t10 = cruce(0.1 * g), t90 = cruce(0.9 * g);
    let smax = 0, tmax = 0; for (let i = 0; i <= M; i++) if (s[i] > smax) { smax = s[i]; tmax = t[i]; }
    let ult = 0; for (let i = M; i >= 0; i--) if (Math.abs(s[i] - g) > 0.02 * g) { ult = t[i]; break; }
    return { t, s, final: g, subida: t90 - t10, sobre: Math.max(0, (smax - g) / g), tpico: tmax, establecimiento: ult - h.ini, t10, t90 };
  }

  function cerrada(x, h, un) {
    const T0 = (a) => ft(a, un, true), K = (v) => f(v);
    if (x.delta || h.delta) {
      const d = x.delta ? x : h, o = x.delta ? h : x;
      return { f: (t) => d.A * o.val(t - d.a), html: `Convoluer avec une impulsion $${d.n}(t) = ${K(d.A)} δ(t − ${T0(d.a)})$ ne change pas le signal : il est <b>décalé</b> de ${T0(d.a)} et multiplié par ${K(d.A)}, $y(t) = ${K(d.A)} ${o.n}(t − ${T0(d.a)})$.` };
    }
    const par = (a, b) => (x.tipo === a && h.tipo === b ? [x, h] : x.tipo === b && h.tipo === a ? [h, x] : null);
    let p;
    if (x.tipo === 'rect' && h.tipo === 'rect') {
      const [p1, p2] = x.T <= h.T ? [x, h] : [h, x], k = p1.A * p2.A, t0 = x.a + h.a;
      return { f: (t) => { const s = t - t0; return s < 0 ? 0 : s < p1.T ? k * s : s < p2.T ? k * p1.T : s < p1.T + p2.T ? k * (p1.T + p2.T - s) : 0; },
        html: `Deux impulsions rectangulaires donnent un <b>trapèze</b> (un triangle si elles ont la même durée). Avec $s = t − ${T0(t0)}$, $T_1 = ${T0(p1.T)}$ et $T_2 = ${T0(p2.T)}$ : il monte en droite de 0 à $${K(k)}·T_1 = ${K(k * p1.T)}$ pour $0 ≤ s ≤ T_1$, reste là jusqu'à $s = T_2$ et redescend à 0 en $s = T_1 + T_2 = ${T0(p1.T + p2.T)}$.` };
    }
    if ((p = par('esc', 'rect'))) {
      const [e, r] = p, k = e.A * r.A, t0 = e.a + r.a;
      return { f: (t) => { const s = t - t0; return s < 0 ? 0 : s < r.T ? k * s : k * r.T; }, html: `Un échelon avec une impulsion rectangulaire donne une <b>rampe</b> coupée : $y = ${K(k)}·s$ pour $0 ≤ s ≤ ${T0(r.T)}$ puis elle reste à $${K(k * r.T)}$ (avec $s = t − ${T0(t0)}$).` };
    }
    if ((p = par('esc', 'exp'))) {
      const [e, q] = p, k = e.A * q.A * q.tau, t0 = e.a + q.a;
      return { f: (t) => (t < t0 ? 0 : k * (1 - Math.exp(-(t - t0) / q.tau))), html: `$y(t) = ${K(k)} (1 − e^{−s/τ})$ avec $s = t − ${T0(t0)}$ et $τ = ${T0(q.tau)}$ : il monte de 0 à $${K(k)}$ (63 % en $s = τ$).` };
    }
    if (x.tipo === 'exp' && h.tipo === 'exp') {
      const t0 = x.a + h.a, k = x.A * h.A;
      if (Math.abs(x.tau - h.tau) < 1e-9 * x.tau) return { f: (t) => (t < t0 ? 0 : k * (t - t0) * Math.exp(-(t - t0) / x.tau)), html: `Avec la même constante $τ = ${T0(x.tau)}$ : $y(t) = ${K(k)}·s·e^{−s/τ}$ avec $s = t − ${T0(t0)}$. Son maximum est en $s = τ$, de valeur $${K(k * x.tau / Math.E)}$.` };
      const k2 = (k * x.tau * h.tau) / (x.tau - h.tau);
      return { f: (t) => (t < t0 ? 0 : k2 * (Math.exp(-(t - t0) / x.tau) - Math.exp(-(t - t0) / h.tau))), html: `Avec $τ_1 = ${T0(x.tau)}$ et $τ_2 = ${T0(h.tau)}$ : $y(t) = ${K(k2)} (e^{−s/τ_1} − e^{−s/τ_2})$ avec $s = t − ${T0(t0)}$.` };
    }
    if ((p = par('rect', 'exp'))) {
      const [r, q] = p, k = r.A * q.A * q.tau, t0 = r.a + q.a, c = 1 - Math.exp(-r.T / q.tau);
      return { f: (t) => { const s = t - t0; return s < 0 ? 0 : s <= r.T ? k * (1 - Math.exp(-s / q.tau)) : k * c * Math.exp(-(s - r.T) / q.tau); },
        html: `Avec $s = t − ${T0(t0)}$ : pendant l'impulsion ($0 ≤ s ≤ ${T0(r.T)}$), la sortie <b>monte</b> selon $y = ${K(k)} (1 − e^{−s/τ})$ jusqu'à $${K(k * c)}$, puis <b>redescend</b> selon $y = ${K(k * c)}·e^{−(s − ${T0(r.T)})/τ}$, avec $τ = ${T0(q.tau)}$.` };
    }
    return null;
  }

  function describe(s, un) {
    const T0 = (a) => ft(a, un, true), n = s.n, A = f(s.A);
    if (s.tipo === 'rect') return `$${n}(t) = ${A}$ pour $${T0(s.ini)} ≤ t ≤ ${T0(s.fin)}$ et 0 ailleurs (impulsion rectangulaire de durée ${ft(s.T, un)}).`;
    if (s.tipo === 'tri') return `$${n}(t)$ est un triangle de hauteur $${A}$ et de base ${ft(s.T, un)}, de $t = ${T0(s.ini)}$ à $t = ${T0(s.fin)}$ (pic en $t = ${T0(s.ini + s.T / 2)}$).`;
    if (s.tipo === 'sin') return `$${n}(t) = ${A} sin(π (t − ${T0(s.a)})/${T0(s.T)})$ pour $${T0(s.ini)} ≤ t ≤ ${T0(s.fin)}$ et 0 en dehors (un demi-sinus).`;
    if (s.tipo === 'esc') return `$${n}(t) = ${A} u(t − ${T0(s.a)})$ : vaut 0 avant $t = ${T0(s.a)}$ et $${A}$ après (échelon).`;
    if (s.tipo === 'exp') return `$${n}(t) = ${A} e^{−(t − ${T0(s.a)})/τ} u(t − ${T0(s.a)})$ avec $τ = ${T0(s.tau)}$ (exponentielle décroissante).`;
    if (s.tipo === 'imp') return `$${n}(t) = ${A} δ(t − ${T0(s.a)})$ (une impulsion d'aire ${A}).`;
    return '';
  }
  function describeSistema(sis, q, h, un) {
    const T0 = (a) => ft(a, un, true);
    if (sis === 'rc') return `Filtre RC avec $R = ${f(q.R)} "Ω"$ et $C = ${f(q.C)} "F"$ : constante de temps $τ = RC = ${T0(h.tau)}$. Sa fonction de transfert est $H(s) = 1/(1 + sτ)$ et sa réponse impulsionnelle $h(t) = {1}/{τ} e^{−t/τ} u(t)$, d'aire 1.`;
    if (sis === 'rlc') return `Filtre RLC série (sortie aux bornes du condensateur) avec $R = ${f(q.R)} "Ω"$, $L = ${f(q.L)} "H"$ et $C = ${f(q.C)} "F"$ : $ω_0 = 1/√(L C) = ${f(h.w0)} "rad/s"$ et $ζ = {R}/{2} √(C/L) = ${f(h.z)}$ (${h.z < 1 ? 'sous-amorti' : h.z === 1 ? 'à amortissement critique' : 'suramorti'}). $H(s) = ω_0^2/(s^2 + 2 ζ ω_0 s + ω_0^2)$.`;
    if (sis === 'rl') return `Filtre RL (sortie aux bornes de la résistance) avec $R = ${f(q.R)} "Ω"$ et $L = ${f(q.L)} "H"$ : constante de temps $τ = L/R = ${T0(h.tau)}$. C'est un passe-bas, $H(s) = 1/(1 + sτ)$, et $h(t) = {1}/{τ} e^{−t/τ} u(t)$, d'aire 1.`;
    if (sis === 'ph') return `Filtre RC passe-haut (sortie aux bornes de la résistance) avec $R = ${f(q.R)} "Ω"$ et $C = ${f(q.C)} "F"$ : $τ = RC = ${T0(h.tau)}$. $H(s) = sτ/(1 + sτ) = 1 − 1/(1 + sτ)$, donc $h(t) = δ(t) − {1}/{τ} e^{−t/τ} u(t)$ : il laisse passer ce qui change vite et bloque le continu (aire 0).`;
    if (sis === 'bp') return `Filtre RLC passe-bande (sortie aux bornes de la résistance) avec $R = ${f(q.R)} "Ω"$, $L = ${f(q.L)} "H"$ et $C = ${f(q.C)} "F"$ : $ω_0 = ${f(h.w0)} "rad/s"$ et $ζ = ${f(h.z)}$. $H(s) = 2 ζ ω_0 s/(s^2 + 2 ζ ω_0 s + ω_0^2)$ : il laisse passer autour de $ω_0$ et bloque le continu (aire 0).`;
    if (sis === 'media') return `Moyenne glissante de fenêtre ${ft(h.T, un)} : $h(t) = 1/T$ pour $0 ≤ t ≤ ${T0(h.T)}$ (elle fait la moyenne de ce qui vient de se passer, et son aire est 1).`;
    return `Retard pur de ${ft(h.a, un)} : $h(t) = δ(t − ${T0(h.a)})$, la sortie est l'entrée retardée.`;
  }

  function resolver(sc) {
    if (sc.modo === 'disc') return resolverDisc(sc);
    const modo = sc.modo === 'sistema' ? 'sistema' : 'conv';
    const lecturas = [leeBiblioteca(sc, 'x'), modo === 'sistema' ? leeSistema(sc) : leeBiblioteca(sc, 'h')];
    if (lecturas[0].tipo === 'imp' && lecturas[1].tipo === 'imp') throw new Error('Une impulsion de Dirac avec une autre donne une autre impulsion : choisissez un signal qui ne soit pas une impulsion');
    if (lecturas[1].sis === 'ph' && lecturas[0].tipo === 'imp') throw new Error('Une impulsion de Dirac entrant dans un passe-haut donne une impulsion plus une queue exponentielle : choisissez une autre entrée (un échelon ou une impulsion)');
    const prueba = lecturas.map((l) => señal(l.tipo, l.q, 0, 1));
    const escala = Math.max(...prueba.map((s) => s.car || 0), ...prueba.map((s) => (s.delta || s.esc || s.inf ? 0 : s.fin - s.ini)), 0) || 1;
    const x = señal(lecturas[0].tipo, lecturas[0].q, 0, escala), h = señal(lecturas[1].tipo, lecturas[1].q, 0, escala);
    const sis = lecturas[1].sis, hq = lecturas[1].q;
    const { t, y } = convolucionar(x, h);
    const un = Math.max(Math.abs(t[0]), Math.abs(t[t.length - 1]), escala / 4);
    let ymax = 0, tymax = t[0]; for (let i = 0; i < y.length; i++) if (Math.abs(y[i]) > Math.abs(ymax)) { ymax = y[i]; tymax = t[i]; }
    const infinita = (s) => s.esc;
    const areaX = x.area, areaH = h.area;
    const areaY = Number.isFinite(areaX) && Number.isFinite(areaH) ? areaX * areaH : Infinity;
    let final = NaN;
    if (x.esc && !h.esc && Number.isFinite(areaH)) final = x.A * areaH; else if (h.esc && !x.esc && Number.isFinite(areaX)) final = h.A * areaX;
    const exacta = cerrada(x, h, un);
    const sol = { modo, sis, x, h, hq, t, y, ymax, tymax, areaX, areaH, areaY, final, escala, un, exacta, infinitaX: infinita(x), infinitaH: infinita(h), tmin: t[0], tmaxT: t[t.length - 1] };
    if (modo === 'sistema') sol.esc = escalon(h, areaH);
    sol.valorEn = (tt) => valorEn(sol, tt);

    const pasos = [];
    pasos.push({ t: modo === 'sistema' ? 'L’entrée et le système' : 'Les deux signaux', html: `${describe(x, un)}<br>${modo === 'sistema' ? describeSistema(sis, hq, h, un) : describe(h, un)}` });
    pasos.push({ t: 'Définition de la convolution', html: `$y(t) = (x * h)(t) = ∫_{−∞}^{∞} x(τ) h(t − τ) dτ$<br>Pour chaque instant $t$, on <b>retourne</b> $h$ (on obtient $h(−τ)$), on la <b>décale</b> de $t$ vers la droite (on obtient $h(t − τ)$), on la <b>multiplie</b> par $x(τ)$ et on mesure l'<b>aire</b> du produit. C'est ce qu'anime le graphique ci-dessus : ${modo === 'sistema' ? 'la sortie du système est la somme des impulsions passées de l\'entrée, chacune pondérée par la réponse impulsionnelle' : 'la valeur de $y$ à chaque instant est l\'aire ombrée'}.` });
    const finito = !(x.esc || h.esc || x.inf || h.inf);
    pasos.push({ t: 'Où il y a recouvrement', html: `$y(t)$ commence là où les deux signaux commencent à se recouvrir, en $t = ${ft(x.ini, un, true)} + ${ft(h.ini, un, true)} = ${ft(x.ini + h.ini, un, true)}$.` + (finito ? ` Elle se termine en $t = ${ft(x.fin, un, true)} + ${ft(h.fin, un, true)} = ${ft(x.fin + h.fin, un, true)}$, donc elle dure $${ft((x.fin - x.ini) + (h.fin - h.ini), un, true)}$ (la somme des durées).` : ` Comme ${x.esc || h.esc ? 'un échelon ne s\'arrête jamais' : 'une exponentielle met du temps à s\'éteindre'}, le graphique va jusqu'à $t = ${ft(t[t.length - 1], un, true)}$ (${HORIZONTE} fois l'échelle de temps).`) });
    pasos.push({ t: 'Résultat', html: exacta ? exacta.html : `Avec ces deux signaux, il n'y a pas de formule courte, donc l'intégrale est calculée numériquement (${N_ENT} échantillons de $τ$ pour chacun des ${N_SAL} instants tracés).` });
    pasos.push({ t: 'Valeurs principales', html: `Maximum : $y_{max} = ${f(ymax)}$ en $t = ${ft(tymax, un, true)}$.` + (Number.isFinite(final) ? ` Pour $t → ∞$, elle tend vers $${f(final)}$.` : '') });
    pasos.push({ t: 'Vérification avec les aires', html: Number.isFinite(areaY) ? `L'aire d'une convolution est le produit des aires : $∫ y = (∫ x)(∫ h) = ${f(areaX)}·${f(areaH)} = ${f(areaY)}$.` : `L'aire du produit n'est pas finie (un échelon ne s'arrête jamais), donc cette propriété ne peut pas servir ; ce que l'on vérifie, c'est la valeur finale.` });
    if (modo === 'sistema' && sol.esc) {
      const e = sol.esc, rc = sis === 'rc' || sis === 'rl', rlc = sis === 'rlc';
      let extra = '';
      if (rc) extra = `Pour un RC, la réponse à l'échelon est $s(t) = 1 − e^{−t/τ}$ : il met $τ ln 9 = ${f(Math.log(9) * h.tau)}$ pour aller de 10 % à 90 % (2,197 τ) et $τ ln 50 = ${f(Math.log(50) * h.tau)}$ pour être à 2 % (3,912 τ) ; il ne dépasse jamais.`;
      else if (rlc) {
        const z = h.z, w0 = h.w0;
        extra = z < 1 ? `Il est sous-amorti : le dépassement est $e^{−πζ/√(1 − ζ^2)} = ${f(100 * Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z)))} %$, le pic arrive en $t_p = π/ω_d = ${ft(Math.PI / (w0 * Math.sqrt(1 - z * z)), un, true)}$ et s'amortit comme $e^{−ζ ω_0 t}$ (établissement à 2 % ≈ $4/(ζ ω_0) = ${ft(4 / (z * w0), un, true)}$).` : z === 1 ? 'Il est à amortissement critique : la réponse la plus rapide sans dépasser la valeur finale.' : 'Il est suramorti : il ne dépasse jamais et est plus lent qu\'un RC ayant la constante du pôle lent.';
      } else if (sis === 'media') extra = `Pour une moyenne glissante, la réponse à l'échelon est une rampe qui monte linéairement pendant $T$ puis reste à 1.`;
      if (e.cero) pasos.push({ t: 'Réponse à l\'échelon', html: `La réponse à l'échelon est l'intégrale de la réponse impulsionnelle plus sa partie instantanée, $s(t) = 1·u(t) + ∫_{0}^{t} h_c(τ) dτ$ (le Dirac saute d'un coup). Ici $s(∞) = H(0) = 0$ : le filtre bloque le continu, donc la sortie revient à 0. ${sis === 'ph' ? `Elle vaut 1 à l'instant initial et décroît comme $e^{−t/τ}$ : elle est à 2 % en $τ ln 50 = ${ft(Math.log(50) * h.tau, un, true)}$.` : `Le pic de la réponse à l'échelon est $${f(e.pico)}$ en $t = ${ft(e.tpico, un, true)}$ et passe sous 2 % du pic en $${ft(e.establecimiento, un, true)}$.`}` });
      else pasos.push({ t: 'Réponse à l\'échelon', html: `La réponse à l'échelon est l'intégrale de la réponse impulsionnelle, $s(t) = ∫_{0}^{t} h(τ) dτ$ (et inversement, $h = ds/dt$). Ici $s(∞) = ∫ h = ${f(e.final)}$ (gain en continu), avec un temps de montée (10 %–90 %) de $${ft(e.subida, un, true)}$, un dépassement de $${f(100 * e.sobre)} %$ et un établissement à 2 % en $${ft(e.establecimiento, un, true)}$.${extra ? '<br>' + extra : ''}` });
    } else if (modo === 'sistema') pasos.push({ t: 'Réponse à l\'échelon', html: 'Un retard pur répond à un échelon par un autre échelon identique, retardé ; il n\'y a ni temps de montée ni dépassement.' });
    sol.pasos = pasos;
    return sol;
  }

  function leeLista(txt, nom) {
    if (vacio(txt)) throw new Error(`La liste de ${nom} est absente`);
    const v = String(txt).split(/[\s;]+/).filter(Boolean).map((u) => Herramienta.leeSI(u, 1));
    if (v.some((z) => !isFinite(z))) throw new Error(`La liste de ${nom} contient quelque chose qui n'est pas un nombre`);
    if (v.length > 64) throw new Error(`La liste de ${nom} accepte au plus 64 valeurs`);
    if (v.every((z) => z === 0)) throw new Error(`La liste de ${nom} ne peut pas être entièrement nulle`);
    return v;
  }
  function leeIndice(sc, k, nom) {
    if (vacio(sc[k])) return 0;
    const v = Herramienta.leeSI(sc[k], 1);
    if (!Number.isInteger(v) || Math.abs(v) > 1000) throw new Error(`L'indice de ${nom} doit être un entier`);
    return v;
  }
  function resolverDisc(sc) {
    const x = leeLista(sc.dx, 'x[n]'), h = leeLista(sc.dh, 'h[n]'), nx = leeIndice(sc, 'dnx', 'x[n]'), nh = leeIndice(sc, 'dnh', 'h[n]'), n0 = nx + nh, L = x.length + h.length - 1;
    const y = Array(L).fill(0), terminos = Array.from({ length: L }, () => []);
    for (let i = 0; i < x.length; i++) for (let j = 0; j < h.length; j++) { y[i + j] += x[i] * h[j]; terminos[i + j].push([i, j]); }
    const ye = y.map((v) => (Math.abs(v) < 1e-12 ? 0 : v));
    let ymax = 0, k = 0; ye.forEach((v, i) => { if (Math.abs(v) > Math.abs(ymax)) { ymax = v; k = i; } });
    const suma = (a) => a.reduce((p, q) => p + q, 0), sx = suma(x), sh = suma(h), sy = suma(ye);
    const filas = ye.map((v, i) => [n0 + i, v]);
    const fila = (i) => terminos[i].map(([a, b]) => `${f(x[a])}·${f(h[b])}`).join(' + ');
    const pasos = [
      { t: 'Les deux séquences', html: `$x[n] = {${x.map((v) => f(v)).join(', ')}}$ commence en $n = ${nx}$ (${x.length} valeurs) et $h[n] = {${h.map((v) => f(v)).join(', ')}}$ commence en $n = ${nh}$ (${h.length} valeurs).` },
      { t: 'Définition', html: `$y[n] = ∑_{k} x[k] h[n − k]$. C'est la même chose qu'en continu avec l'intégrale remplacée par une somme : on retourne $h$, on la décale de $n$ positions, on multiplie terme à terme avec $x$ et on somme.` },
      { t: 'Longueur et position', html: `La séquence $y$ a $${x.length} + ${h.length} − 1 = ${L}$ valeurs et commence en $n = ${nx} + ${nh} = ${n0}$ (elle se termine en $n = ${n0 + L - 1}$).` },
      { t: 'Tableau de la somme', html: `Chaque valeur est la somme des produits dont les indices ont pour somme $n$ :<br>` + ye.map((v, i) => `$y[${n0 + i}] = ${fila(i)} = ${f(v)}$`).join('<br>') },
      { t: 'Résultat', html: `$y[n] = {${ye.map((v) => f(v)).join(', ')}}$ à partir de $n = ${n0}$. Maximum $|y| = ${f(Math.abs(ymax))}$ en $n = ${n0 + k}$.` },
      { t: 'Vérification avec les sommes', html: `La somme d'une convolution est le produit des sommes : $∑ y = (∑ x)(∑ h) = ${f(sx)}·${f(sh)} = ${f(sx * sh)}$, et la somme des $y$ calculés donne $${f(sy)}$.` },
    ];
    return { modo: 'disc', x, h, nx, nh, n0, y: ye, L, ymax, tymax: n0 + k, tmin: n0, tmaxT: n0 + L - 1, sumaX: sx, sumaH: sh, sumaY: sy, filas, terminos, pasos };
  }

  const base = { modo: 'conv', xt: 'rect', xA: '1', xT: '2', xa: '0', xtau: '1', ht: 'rect', hA: '1', hT: '2', ha: '0', htau: '1', sis: 'rc', R: '1k', L: '10m', C: '1µ', mT: '1m', ma: '1m', dx: '1 2 3', dh: '1 1', dnx: '0', dnh: '0' };
  const ej = (clave, nombre, o) => ({ clave, nombre, sc: { ...base, ...o } });
  const ejemplos = [
    ej('rect-rect', 'Deux impulsions identiques donnent un triangle', {}),
    ej('rect-tri', 'Impulsion rectangulaire avec une triangulaire', { ht: 'tri', hA: '2', hT: '3', xT: '1,5' }),
    ej('rect-imp', 'Une impulsion avec un Dirac : elle est décalée', { ht: 'imp', hA: '1,5', ha: '2' }),
    ej('exp-exp', 'Deux exponentielles identiques : t·e^(−t)', { xt: 'exp', xA: '1', xtau: '1', ht: 'exp', hA: '1', htau: '1' }),
    ej('esc-exp', 'Échelon avec une exponentielle (charge d\'un RC)', { xt: 'esc', xA: '1', ht: 'exp', hA: '1', htau: '1' }),
    ej('rc-pulso', 'Impulsion de 2 ms dans un filtre RC de 1 ms', { modo: 'sistema', xt: 'rect', xA: '5', xT: '2m', xa: '0', sis: 'rc', R: '1k', C: '1µ' }),
    ej('rc-escalon', 'Réponse à l\'échelon d\'un filtre RC', { modo: 'sistema', xt: 'esc', xA: '1', xa: '0', sis: 'rc', R: '10k', C: '100n' }),
    ej('rlc-escalon', 'Réponse à l\'échelon d\'un RLC sous-amorti', { modo: 'sistema', xt: 'esc', xA: '1', xa: '0', sis: 'rlc', R: '20', L: '10m', C: '10µ' }),
    ej('rl-escalon', 'Réponse à l\'échelon d\'un filtre RL', { modo: 'sistema', xt: 'esc', xA: '1', xa: '0', sis: 'rl', R: '100', L: '100m' }),
    ej('ph-pulso', 'Impulsion dans un filtre RC passe-haut', { modo: 'sistema', xt: 'rect', xA: '5', xT: '4m', xa: '0', sis: 'ph', R: '1k', C: '1µ' }),
    ej('bp-escalon', 'Échelon dans un RLC passe-bande', { modo: 'sistema', xt: 'esc', xA: '1', xa: '0', sis: 'bp', R: '20', L: '10m', C: '10µ' }),
    ej('disc-basico', 'Discrète : {1, 2, 3} avec {1, 1}', { modo: 'disc' }),
    ej('disc-media', 'Discrète : moyenne de trois échantillons', { modo: 'disc', dx: '3 6 9 12 9 6 3', dh: '0,3333 0,3333 0,3333' }),
    ej('media-sen', 'Moyenne glissante d\'une impulsion sinusoïdale', { modo: 'sistema', xt: 'sin', xA: '2', xT: '4m', xa: '0', sis: 'media', mT: '1m' }),
  ];

  return { resolver, ejemplos, f, ft, TIPOS, SISTEMAS, ETIQ, UNID, unidad, valorEn, HORIZONTE };
})();

