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
    rect: { nom: 'Rechteckpuls', par: ['A', 'T', 'a'] },
    tri: { nom: 'Dreieckpuls', par: ['A', 'T', 'a'] },
    sen: { nom: 'Sinuspuls (Halbsinus)', par: ['A', 'T', 'a'] },
    esc: { nom: 'Sprung', par: ['A', 'a'] },
    exp: { nom: 'Abklingende Exponentialfunktion', par: ['A', 'tau', 'a'] },
    imp: { nom: 'Impuls (Delta)', par: ['A', 'a'] },
  };
  const SISTEMAS = {
    rc: { nom: 'RC-Tiefpass', par: ['R', 'C'] },
    rlc: { nom: 'Reihen-RLC-Filter (Tiefpass)', par: ['R', 'L', 'C'] },
    rl: { nom: 'RL-Tiefpass (Ausgang an R)', par: ['R', 'L'] },
    ph: { nom: 'RC-Hochpass (Ausgang an R)', par: ['R', 'C'] },
    bp: { nom: 'RLC-Bandpass (Ausgang an R)', par: ['R', 'L', 'C'] },
    media: { nom: 'Gleitender Mittelwert', par: ['mT'] },
    ret: { nom: 'Reine Verzögerung', par: ['ma'] },
  };
  const ETIQ = { A: 'Amplitude', T: 'Dauer', a: 'Verzögerung', tau: 'Zeitkonstante τ', R: 'Widerstand R', L: 'Induktivität L', C: 'Kapazität C', mT: 'Fenster T', ma: 'Verzögerung' };
  const UNID = { A: '', T: 's', a: 's', tau: 's', R: 'Ω', L: 'H', C: 'F', mT: 's', ma: 's' };
  const HORIZONTE = 10; // un escalón o una exponencial se cortan a 10 veces su escala de tiempo

  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom, pos = false, base = 1) {
    if (vacio(sc[k])) throw new Error(`${nom} fehlt`);
    const v = Herramienta.leeSI(sc[k], base);
    const N = nom[0].toUpperCase() + nom.slice(1);
    if (!isFinite(v)) throw new Error(`${N} muss eine Zahl sein`);
    if (pos && v <= 0) throw new Error(`${N} muss größer als 0 sein`);
    return v;
  }
  const nombreDe = (k) => (k === 'A' ? 'la amplitud' : k === 'T' || k === 'mT' ? 'die Dauer' : k === 'a' || k === 'ma' ? 'el retraso' : k === 'tau' ? 'die Zeitkonstante τ' : k === 'R' ? 'la resistencia R' : k === 'L' ? 'la inductancia L' : 'la capacidad C');

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
    if (!TIPOS[tipo]) throw new Error(`Wähle das Signal ${p === 'x' ? 'x(t)' : 'h(t)'}`);
    const q = { n: p }, nom = (k) => `${nombreDe(k)} de ${p}(t)`;
    for (const k of TIPOS[tipo].par) q[k] = lee(sc, p + k, nom(k), k === 'T' || k === 'tau');
    if (q.A === 0) throw new Error(`Die Amplitude von ${p}(t) darf nicht 0 sein`);
    return { tipo, q };
  }
  function leeSistema(sc) {
    const sis = sc.sis;
    if (!SISTEMAS[sis]) throw new Error('Wähle das System');
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
      return { f: (t) => d.A * o.val(t - d.a), html: `Die Faltung mit einem Impuls $${d.n}(t) = ${K(d.A)} δ(t − ${T0(d.a)})$ ändert das Signal nicht: Sie <b>verschiebt</b> es um ${T0(d.a)} und multipliziert es mit ${K(d.A)}, $y(t) = ${K(d.A)} ${o.n}(t − ${T0(d.a)})$.` };
    }
    const par = (a, b) => (x.tipo === a && h.tipo === b ? [x, h] : x.tipo === b && h.tipo === a ? [h, x] : null);
    let p;
    if (x.tipo === 'rect' && h.tipo === 'rect') {
      const [p1, p2] = x.T <= h.T ? [x, h] : [h, x], k = p1.A * p2.A, t0 = x.a + h.a;
      return { f: (t) => { const s = t - t0; return s < 0 ? 0 : s < p1.T ? k * s : s < p2.T ? k * p1.T : s < p1.T + p2.T ? k * (p1.T + p2.T - s) : 0; },
        html: `Zwei Rechteckpulse ergeben ein <b>Trapez</b> (ein Dreieck, wenn sie gleich lang sind). Mit $s = t − ${T0(t0)}$, $T_1 = ${T0(p1.T)}$ und $T_2 = ${T0(p2.T)}$: Es steigt linear von 0 auf $${K(k)}·T_1 = ${K(k * p1.T)}$ für $0 ≤ s ≤ T_1$, bleibt dort bis $s = T_2$ und fällt bei $s = T_1 + T_2 = ${T0(p1.T + p2.T)}$ auf 0.` };
    }
    if ((p = par('esc', 'rect'))) {
      const [e, r] = p, k = e.A * r.A, t0 = e.a + r.a;
      return { f: (t) => { const s = t - t0; return s < 0 ? 0 : s < r.T ? k * s : k * r.T; }, html: `Ein Sprung mit einem Rechteckpuls ergibt eine <b>Rampe</b>, die abgeschnitten wird: $y = ${K(k)}·s$ für $0 ≤ s ≤ ${T0(r.T)}$ und danach bleibt sie bei $${K(k * r.T)}$ (mit $s = t − ${T0(t0)}$).` };
    }
    if ((p = par('esc', 'exp'))) {
      const [e, q] = p, k = e.A * q.A * q.tau, t0 = e.a + q.a;
      return { f: (t) => (t < t0 ? 0 : k * (1 - Math.exp(-(t - t0) / q.tau))), html: `$y(t) = ${K(k)} (1 − e^{−s/τ})$ mit $s = t − ${T0(t0)}$ und $τ = ${T0(q.tau)}$: Es steigt von 0 auf $${K(k)}$ (63 % bei $s = τ$).` };
    }
    if (x.tipo === 'exp' && h.tipo === 'exp') {
      const t0 = x.a + h.a, k = x.A * h.A;
      if (Math.abs(x.tau - h.tau) < 1e-9 * x.tau) return { f: (t) => (t < t0 ? 0 : k * (t - t0) * Math.exp(-(t - t0) / x.tau)), html: `Mit derselben Konstante $τ = ${T0(x.tau)}$: $y(t) = ${K(k)}·s·e^{−s/τ}$ mit $s = t − ${T0(t0)}$. Das Maximum liegt bei $s = τ$ mit dem Wert $${K(k * x.tau / Math.E)}$.` };
      const k2 = (k * x.tau * h.tau) / (x.tau - h.tau);
      return { f: (t) => (t < t0 ? 0 : k2 * (Math.exp(-(t - t0) / x.tau) - Math.exp(-(t - t0) / h.tau))), html: `Mit $τ_1 = ${T0(x.tau)}$ und $τ_2 = ${T0(h.tau)}$: $y(t) = ${K(k2)} (e^{−s/τ_1} − e^{−s/τ_2})$ mit $s = t − ${T0(t0)}$.` };
    }
    if ((p = par('rect', 'exp'))) {
      const [r, q] = p, k = r.A * q.A * q.tau, t0 = r.a + q.a, c = 1 - Math.exp(-r.T / q.tau);
      return { f: (t) => { const s = t - t0; return s < 0 ? 0 : s <= r.T ? k * (1 - Math.exp(-s / q.tau)) : k * c * Math.exp(-(s - r.T) / q.tau); },
        html: `Mit $s = t − ${T0(t0)}$: Solange der Puls andauert ($0 ≤ s ≤ ${T0(r.T)}$), <b>steigt</b> der Ausgang als $y = ${K(k)} (1 − e^{−s/τ})$ bis $${K(k * c)}$ und <b>fällt</b> danach als $y = ${K(k * c)}·e^{−(s − ${T0(r.T)})/τ}$, mit $τ = ${T0(q.tau)}$.` };
    }
    return null;
  }

  function describe(s, un) {
    const T0 = (a) => ft(a, un, true), n = s.n, A = f(s.A);
    if (s.tipo === 'rect') return `$${n}(t) = ${A}$ für $${T0(s.ini)} ≤ t ≤ ${T0(s.fin)}$ und 0 sonst (Rechteckpuls der Dauer ${ft(s.T, un)}).`;
    if (s.tipo === 'tri') return `$${n}(t)$ ist ein Dreieck der Höhe $${A}$ und der Basis ${ft(s.T, un)}, von $t = ${T0(s.ini)}$ bis $t = ${T0(s.fin)}$ (Spitze bei $t = ${T0(s.ini + s.T / 2)}$).`;
    if (s.tipo === 'sin') return `$${n}(t) = ${A} sin(π (t − ${T0(s.a)})/${T0(s.T)})$ für $${T0(s.ini)} ≤ t ≤ ${T0(s.fin)}$ und 0 außerhalb (ein Halbsinus).`;
    if (s.tipo === 'esc') return `$${n}(t) = ${A} u(t − ${T0(s.a)})$: Er ist 0 vor $t = ${T0(s.a)}$ und danach $${A}$ (Sprung).`;
    if (s.tipo === 'exp') return `$${n}(t) = ${A} e^{−(t − ${T0(s.a)})/τ} u(t − ${T0(s.a)})$ mit $τ = ${T0(s.tau)}$ (abklingende Exponentialfunktion).`;
    if (s.tipo === 'imp') return `$${n}(t) = ${A} δ(t − ${T0(s.a)})$ (ein Impuls mit der Fläche ${A}).`;
    return '';
  }
  function describeSistema(sis, q, h, un) {
    const T0 = (a) => ft(a, un, true);
    if (sis === 'rc') return `RC-Filter mit $R = ${f(q.R)} "Ω"$ und $C = ${f(q.C)} "F"$: Zeitkonstante $τ = RC = ${T0(h.tau)}$. Seine Übertragungsfunktion ist $H(s) = 1/(1 + sτ)$ und seine Impulsantwort $h(t) = {1}/{τ} e^{−t/τ} u(t)$ mit der Fläche 1.`;
    if (sis === 'rlc') return `Reihen-RLC-Filter (Ausgang am Kondensator) mit $R = ${f(q.R)} "Ω"$, $L = ${f(q.L)} "H"$ und $C = ${f(q.C)} "F"$: $ω_0 = 1/√(L C) = ${f(h.w0)} "rad/s"$ und $ζ = {R}/{2} √(C/L) = ${f(h.z)}$ (${h.z < 1 ? 'unterdämpft' : h.z === 1 ? 'aperiodischer Grenzfall' : 'überdämpft'}). $H(s) = ω_0^2/(s^2 + 2 ζ ω_0 s + ω_0^2)$.`;
    if (sis === 'rl') return `RL-Filter (Ausgang am Widerstand) mit $R = ${f(q.R)} "Ω"$ und $L = ${f(q.L)} "H"$: Zeitkonstante $τ = L/R = ${T0(h.tau)}$. Es ist ein Tiefpass, $H(s) = 1/(1 + sτ)$, und $h(t) = {1}/{τ} e^{−t/τ} u(t)$ mit der Fläche 1.`;
    if (sis === 'ph') return `RC-Hochpass (Ausgang am Widerstand) mit $R = ${f(q.R)} "Ω"$ und $C = ${f(q.C)} "F"$: $τ = RC = ${T0(h.tau)}$. $H(s) = sτ/(1 + sτ) = 1 − 1/(1 + sτ)$, also $h(t) = δ(t) − {1}/{τ} e^{−t/τ} u(t)$: Er lässt schnelle Änderungen durch und sperrt den Gleichanteil (Fläche 0).`;
    if (sis === 'bp') return `RLC-Bandpass (Ausgang am Widerstand) mit $R = ${f(q.R)} "Ω"$, $L = ${f(q.L)} "H"$ und $C = ${f(q.C)} "F"$: $ω_0 = ${f(h.w0)} "rad/s"$ und $ζ = ${f(h.z)}$. $H(s) = 2 ζ ω_0 s/(s^2 + 2 ζ ω_0 s + ω_0^2)$: Er lässt Frequenzen um $ω_0$ durch und sperrt den Gleichanteil (Fläche 0).`;
    if (sis === 'media') return `Gleitender Mittelwert mit Fenster ${ft(h.T, un)}: $h(t) = 1/T$ für $0 ≤ t ≤ ${T0(h.T)}$ (er mittelt das zuletzt Vergangene, und seine Fläche ist 1).`;
    return `Reine Verzögerung um ${ft(h.a, un)}: $h(t) = δ(t − ${T0(h.a)})$, der Ausgang ist der verzögerte Eingang.`;
  }

  function resolver(sc) {
    if (sc.modo === 'disc') return resolverDisc(sc);
    const modo = sc.modo === 'sistema' ? 'sistema' : 'conv';
    const lecturas = [leeBiblioteca(sc, 'x'), modo === 'sistema' ? leeSistema(sc) : leeBiblioteca(sc, 'h')];
    if (lecturas[0].tipo === 'imp' && lecturas[1].tipo === 'imp') throw new Error('Ein Impuls mit einem anderen Impuls ergibt wieder einen Impuls: Wähle ein Signal, das kein Impuls ist');
    if (lecturas[1].sis === 'ph' && lecturas[0].tipo === 'imp') throw new Error('Ein Impuls am Eingang eines Hochpasses ergibt einen Impuls plus einen exponentiellen Schweif: Wähle einen anderen Eingang (einen Sprung oder einen Puls)');
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
    pasos.push({ t: modo === 'sistema' ? 'Das Eingangssignal und das System' : 'Die beiden Signale', html: `${describe(x, un)}<br>${modo === 'sistema' ? describeSistema(sis, hq, h, un) : describe(h, un)}` });
    pasos.push({ t: 'Definition der Faltung', html: `$y(t) = (x * h)(t) = ∫_{−∞}^{∞} x(τ) h(t − τ) dτ$<br>Für jeden Zeitpunkt $t$ wird $h$ <b>gespiegelt</b> (es wird $h(−τ)$), um $t$ nach rechts <b>verschoben</b> (es wird $h(t − τ)$), mit $x(τ)$ <b>multipliziert</b> und die <b>Fläche</b> des Produkts gemessen. Das animiert die Grafik oben: ${modo === 'sistema' ? 'Der Ausgang des Systems ist die Summe der vergangenen Impulse des Eingangs, jeder gewichtet mit der Impulsantwort' : 'Der Wert von $y$ zu jedem Zeitpunkt ist die schattierte Fläche'}.` });
    const finito = !(x.esc || h.esc || x.inf || h.inf);
    pasos.push({ t: 'Wo es eine Überlappung gibt', html: `$y(t)$ beginnt dort, wo sich die beiden Signale zu überlappen beginnen, bei $t = ${ft(x.ini, un, true)} + ${ft(h.ini, un, true)} = ${ft(x.ini + h.ini, un, true)}$.` + (finito ? ` Es endet bei $t = ${ft(x.fin, un, true)} + ${ft(h.fin, un, true)} = ${ft(x.fin + h.fin, un, true)}$ und dauert somit $${ft((x.fin - x.ini) + (h.fin - h.ini), un, true)}$ (die Summe der Dauern).` : ` Da ${x.esc || h.esc ? 'ein Sprung nie endet' : 'eine Exponentialfunktion lange braucht, um abzuklingen'}, reicht die Grafik bis $t = ${ft(t[t.length - 1], un, true)}$ (${HORIZONTE}-mal die Zeitskala).`) });
    pasos.push({ t: 'Ergebnis', html: exacta ? exacta.html : `Für diese beiden Signale gibt es keine kurze Formel, daher wird das Integral numerisch berechnet (${N_ENT} Abtastwerte von $τ$ für jeden der ${N_SAL} gezeichneten Zeitpunkte).` });
    pasos.push({ t: 'Wichtigste Werte', html: `Maximum: $y_{max} = ${f(ymax)}$ bei $t = ${ft(tymax, un, true)}$.` + (Number.isFinite(final) ? ` Für $t → ∞$ bleibt er bei $${f(final)}$.` : '') });
    pasos.push({ t: 'Kontrolle mit den Flächen', html: Number.isFinite(areaY) ? `Die Fläche einer Faltung ist das Produkt der Flächen: $∫ y = (∫ x)(∫ h) = ${f(areaX)}·${f(areaH)} = ${f(areaY)}$.` : `Die Fläche des Produkts ist nicht endlich (ein Sprung endet nie), daher lässt sich diese Eigenschaft nicht verwenden; geprüft wird der Endwert.` });
    if (modo === 'sistema' && sol.esc) {
      const e = sol.esc, rc = sis === 'rc' || sis === 'rl', rlc = sis === 'rlc';
      let extra = '';
      if (rc) extra = `Für einen RC ist die Sprungantwort $s(t) = 1 − e^{−t/τ}$: Er braucht $τ ln 9 = ${f(Math.log(9) * h.tau)}$, um von 10 % auf 90 % zu steigen (2,197 τ), und $τ ln 50 = ${f(Math.log(50) * h.tau)}$, um auf 2 % anzukommen (3,912 τ); er schwingt nie über.`;
      else if (rlc) {
        const z = h.z, w0 = h.w0;
        extra = z < 1 ? `Er ist unterdämpft: Das Überschwingen beträgt $e^{−πζ/√(1 − ζ^2)} = ${f(100 * Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z)))} %$, die Spitze tritt bei $t_p = π/ω_d = ${ft(Math.PI / (w0 * Math.sqrt(1 - z * z)), un, true)}$ auf und klingt wie $e^{−ζ ω_0 t}$ ab (Einschwingzeit auf 2 % ≈ $4/(ζ ω_0) = ${ft(4 / (z * w0), un, true)}$).` : z === 1 ? 'Er ist im aperiodischen Grenzfall: die schnellste Antwort ohne Überschwingen über den Endwert.' : 'Er ist überdämpft: Er schwingt nie über und ist langsamer als ein RC mit der Konstante des langsamen Pols.';
      } else if (sis === 'media') extra = `Bei einem gleitenden Mittelwert ist die Sprungantwort eine Rampe, die während $T$ linear steigt und dann bei 1 bleibt.`;
      if (e.cero) pasos.push({ t: 'Sprungantwort', html: `Die Sprungantwort ist das Integral der Impulsantwort plus ihr unmittelbarer Anteil, $s(t) = 1·u(t) + ∫_{0}^{t} h_c(τ) dτ$ (das Delta springt sofort). Hier ist $s(∞) = H(0) = 0$: Der Filter sperrt den Gleichanteil, daher kehrt der Ausgang auf 0 zurück. ${sis === 'ph' ? `Er ist sofort 1 und klingt wie $e^{−t/τ}$ ab: Er erreicht 2 % bei $τ ln 50 = ${ft(Math.log(50) * h.tau, un, true)}$.` : `Die Spitze der Sprungantwort ist $${f(e.pico)}$ bei $t = ${ft(e.tpico, un, true)}$ und fällt unter 2 % der Spitze bei $${ft(e.establecimiento, un, true)}$.`}` });
      else pasos.push({ t: 'Sprungantwort', html: `Die Sprungantwort ist das Integral der Impulsantwort, $s(t) = ∫_{0}^{t} h(τ) dτ$ (und umgekehrt $h = ds/dt$). Hier ist $s(∞) = ∫ h = ${f(e.final)}$ (Gleichspannungsverstärkung), mit Anstiegszeit (10 %–90 %) $${ft(e.subida, un, true)}$, Überschwingen $${f(100 * e.sobre)} %$ und Einschwingzeit auf 2 % bei $${ft(e.establecimiento, un, true)}$.${extra ? '<br>' + extra : ''}` });
    } else if (modo === 'sistema') pasos.push({ t: 'Sprungantwort', html: 'Eine reine Verzögerung antwortet auf einen Sprung mit einem identischen, verzögerten Sprung; es gibt weder Anstiegszeit noch Überschwingen.' });
    sol.pasos = pasos;
    return sol;
  }

  function leeLista(txt, nom) {
    if (vacio(txt)) throw new Error(`Die Liste von ${nom} fehlt`);
    const v = String(txt).split(/[\s;]+/).filter(Boolean).map((u) => Herramienta.leeSI(u, 1));
    if (v.some((z) => !isFinite(z))) throw new Error(`Die Liste von ${nom} enthält etwas, das keine Zahl ist`);
    if (v.length > 64) throw new Error(`Die Liste von ${nom} erlaubt höchstens 64 Werte`);
    if (v.every((z) => z === 0)) throw new Error(`Die Liste von ${nom} darf nicht nur aus Nullen bestehen`);
    return v;
  }
  function leeIndice(sc, k, nom) {
    if (vacio(sc[k])) return 0;
    const v = Herramienta.leeSI(sc[k], 1);
    if (!Number.isInteger(v) || Math.abs(v) > 1000) throw new Error(`Der Index von ${nom} muss eine ganze Zahl sein`);
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
      { t: 'Die beiden Folgen', html: `$x[n] = {${x.map((v) => f(v)).join(', ')}}$ beginnt bei $n = ${nx}$ (${x.length} Werte) und $h[n] = {${h.map((v) => f(v)).join(', ')}}$ beginnt bei $n = ${nh}$ (${h.length} Werte).` },
      { t: 'Definition', html: `$y[n] = ∑_{k} x[k] h[n − k]$. Es ist dasselbe wie im Kontinuierlichen, nur wird das Integral durch eine Summe ersetzt: $h$ wird gespiegelt, um $n$ Positionen verschoben, Punkt für Punkt mit $x$ multipliziert und aufsummiert.` },
      { t: 'Länge und Lage', html: `Die Folge $y$ hat $${x.length} + ${h.length} − 1 = ${L}$ Werte und beginnt bei $n = ${nx} + ${nh} = ${n0}$ (sie endet bei $n = ${n0 + L - 1}$).` },
      { t: 'Tabelle der Summe', html: `Jeder Wert ist die Summe der Produkte, deren Indizes sich zu $n$ addieren:<br>` + ye.map((v, i) => `$y[${n0 + i}] = ${fila(i)} = ${f(v)}$`).join('<br>') },
      { t: 'Ergebnis', html: `$y[n] = {${ye.map((v) => f(v)).join(', ')}}$ ab $n = ${n0}$. Maximum $|y| = ${f(Math.abs(ymax))}$ bei $n = ${n0 + k}$.` },
      { t: 'Kontrolle mit den Summen', html: `Die Summe einer Faltung ist das Produkt der Summen: $∑ y = (∑ x)(∑ h) = ${f(sx)}·${f(sh)} = ${f(sx * sh)}$, und die Summe der berechneten $y$ ergibt $${f(sy)}$.` },
    ];
    return { modo: 'disc', x, h, nx, nh, n0, y: ye, L, ymax, tymax: n0 + k, tmin: n0, tmaxT: n0 + L - 1, sumaX: sx, sumaH: sh, sumaY: sy, filas, terminos, pasos };
  }

  const base = { modo: 'conv', xt: 'rect', xA: '1', xT: '2', xa: '0', xtau: '1', ht: 'rect', hA: '1', hT: '2', ha: '0', htau: '1', sis: 'rc', R: '1k', L: '10m', C: '1µ', mT: '1m', ma: '1m', dx: '1 2 3', dh: '1 1', dnx: '0', dnh: '0' };
  const ej = (clave, nombre, o) => ({ clave, nombre, sc: { ...base, ...o } });
  const ejemplos = [
    ej('rect-rect', 'Zwei gleiche Pulse ergeben ein Dreieck', {}),
    ej('rect-tri', 'Rechteckpuls mit Dreieckpuls', { ht: 'tri', hA: '2', hT: '3', xT: '1,5' }),
    ej('rect-imp', 'Ein Puls mit einem Impuls: Er wird verschoben', { ht: 'imp', hA: '1,5', ha: '2' }),
    ej('exp-exp', 'Zwei gleiche Exponentialfunktionen: t·e^(−t)', { xt: 'exp', xA: '1', xtau: '1', ht: 'exp', hA: '1', htau: '1' }),
    ej('esc-exp', 'Sprung mit einer Exponentialfunktion (Aufladen eines RC)', { xt: 'esc', xA: '1', ht: 'exp', hA: '1', htau: '1' }),
    ej('rc-pulso', '2-ms-Puls durch einen 1-ms-RC-Filter', { modo: 'sistema', xt: 'rect', xA: '5', xT: '2m', xa: '0', sis: 'rc', R: '1k', C: '1µ' }),
    ej('rc-escalon', 'Sprungantwort eines RC-Filters', { modo: 'sistema', xt: 'esc', xA: '1', xa: '0', sis: 'rc', R: '10k', C: '100n' }),
    ej('rlc-escalon', 'Sprungantwort eines unterdämpften RLC', { modo: 'sistema', xt: 'esc', xA: '1', xa: '0', sis: 'rlc', R: '20', L: '10m', C: '10µ' }),
    ej('rl-escalon', 'Sprungantwort eines RL-Filters', { modo: 'sistema', xt: 'esc', xA: '1', xa: '0', sis: 'rl', R: '100', L: '100m' }),
    ej('ph-pulso', 'Puls durch einen RC-Hochpass', { modo: 'sistema', xt: 'rect', xA: '5', xT: '4m', xa: '0', sis: 'ph', R: '1k', C: '1µ' }),
    ej('bp-escalon', 'Sprung an einem RLC-Bandpass', { modo: 'sistema', xt: 'esc', xA: '1', xa: '0', sis: 'bp', R: '20', L: '10m', C: '10µ' }),
    ej('disc-basico', 'Diskret: {1, 2, 3} mit {1, 1}', { modo: 'disc' }),
    ej('disc-media', 'Diskret: Mittelwert über drei Abtastwerte', { modo: 'disc', dx: '3 6 9 12 9 6 3', dh: '0,3333 0,3333 0,3333' }),
    ej('media-sen', 'Gleitender Mittelwert eines Sinuspulses', { modo: 'sistema', xt: 'sin', xA: '2', xT: '4m', xa: '0', sis: 'media', mT: '1m' }),
  ];

  return { resolver, ejemplos, f, ft, TIPOS, SISTEMAS, ETIQ, UNID, unidad, valorEn, HORIZONTE };
})();

