const TransformadaZ = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function leeNum(s) {
    const t = String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-');
    const m = t.match(/^([+-]?[\d.]*)\*?(?:π|pi)(?:\/([\d.]+))?$/i);
    if (m) { const c = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : +m[1]; return (c * Math.PI) / (m[2] ? +m[2] : 1); }
    return +t.replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  }
  function lee(sc, k, nom, { min, minEx, max, entero, def } = {}) {
    if (vacio(sc[k])) { if (def !== undefined) return def; throw new Error(`${nom} is missing`); }
    const v = leeNum(sc[k]), N = mayus(nom);
    if (!isFinite(v)) throw new Error(`${N} must be a number`);
    if (entero && v !== Math.round(v)) throw new Error(`${N} must be an integer`);
    if (min !== undefined && v < min) throw new Error(`${N} must be at least ${f(min)}`);
    if (minEx !== undefined && v <= minEx) throw new Error(`${N} must be greater than ${f(minEx)}`);
    if (max !== undefined && v > max) throw new Error(`${N} must be at most ${f(max)}`);
    return v;
  }
  function lista(txt, nom) {
    if (vacio(txt)) throw new Error(`The ${nom} are missing`);
    const xs = String(txt).trim().split(/[\s;]+/).filter(Boolean).map(leeNum);
    if (!xs.length || xs.some((x) => !isFinite(x))) throw new Error(`The ${nom} must be numbers separated by spaces`);
    if (xs.length > 64 && nom !== 'signal values') throw new Error(`Too many ${nom} (at most 64)`);
    return xs;
  }

  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const cabs = (a) => Math.hypot(a[0], a[1]);
  const carg = (a) => Math.atan2(a[1], a[0]);
  const horner = (c, z) => c.reduce((s, x) => { const p = cmul(s, z); return [p[0] + x, p[1]]; }, [0, 0]);
  const fc = (a, d = 4) => {
    const re = Math.abs(a[0]) < 1e-9 ? 0 : a[0], im = Math.abs(a[1]) < 1e-9 ? 0 : a[1];
    if (!im) return f(re, d);
    const i = (Math.abs(im) === 1 ? '' : f(Math.abs(im), d) + '·') + 'j';
    return re ? `${f(re, d)} ${im < 0 ? '−' : '+'} ${i}` : `${im < 0 ? '−' : ''}${i}`;
  };

  function raices(c) {
    const n = c.length - 1;
    if (n < 1) return [];
    const a = c.map((x) => x / c[0]), R = 1 + Math.max(...a.slice(1).map(Math.abs));
    let z = a.slice(1).map((_, i) => [R * 0.7 * Math.cos(2.4 * i + 0.4), R * 0.7 * Math.sin(2.4 * i + 0.4)]);
    for (let it = 0; it < 800; it++) {
      let dm = 0;
      for (let i = 0; i < n; i++) {
        let q = [1, 0];
        for (let j = 0; j < n; j++) if (j !== i) q = cmul(q, csub(z[i], z[j]));
        if (cabs(q) < 1e-300) q = [1e-12, 0];
        const d = cdiv(horner(a, z[i]), q);
        z[i] = csub(z[i], d); dm = Math.max(dm, cabs(d));
      }
      if (dm < 1e-15) break;
    }
    z = z.map((r) => (Math.abs(r[1]) < 1e-7 * Math.max(1, Math.abs(r[0])) ? [r[0], 0] : r));
    const gr = [];
    for (const r of z) {
      const g = gr.find((x) => cabs(csub(x.p, r)) < 1e-4);
      if (g) { g.p = [(g.p[0] * g.m + r[0]) / (g.m + 1), (g.p[1] * g.m + r[1]) / (g.m + 1)]; g.m++; } else gr.push({ p: r, m: 1 });
    }
    for (const g of gr) if (Math.abs(g.p[1]) < 1e-7) g.p = [g.p[0], 0];
    return gr.sort((u, v) => cabs(v.p) - cabs(u.p) || v.p[1] - u.p[1]);
  }
  function raicesZ(b, M) {
    const c = Array.from({ length: M + 1 }, (_, k) => b[k] || 0);
    let ceros = 0;
    while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-14) { c.pop(); ceros++; }
    while (c.length > 1 && Math.abs(c[0]) < 1e-14) c.shift();
    const r = Math.abs(c[0]) < 1e-14 ? [] : raices(c);
    if (ceros) r.push({ p: [0, 0], m: ceros });
    return r.sort((u, v) => cabs(v.p) - cabs(u.p) || v.p[1] - u.p[1]);
  }
  const lugar = (rs) => rs.flatMap((r) => Array(r.m).fill(r.p));

  function polinomio(c, v = 'z') {
    let s = '';
    c.forEach((x, k) => {
      if (Math.abs(x) < 1e-12) return;
      const a = Math.abs(x), neg = x < 0, m = k === 0 ? '' : k === 1 ? `${v}^{-1}` : `${v}^{-${k}}`;
      const t = k === 0 ? f(a) : Math.abs(a - 1) < 1e-12 ? m : `${f(a)}·${m}`;
      s += s === '' ? (neg ? '−' : '') + t : (neg ? ' − ' : ' + ') + t;
    });
    return s || '0';
  }
  const frac = (n, d) => (d === '1' ? n : `(${n})/(${d})`);
  const conjuntos = (rs) => rs.map((r) => `${fc(r.p)}${r.m > 1 ? ` (×${r.m})` : ''}`).join(';  ');

  function analiza(bb, aa, { Nn = 16, fs = null, cerrada = true } = {}) {
    if (!aa.length || Math.abs(aa[0]) < 1e-14) throw new Error('The first coefficient of the denominator (a₀) cannot be 0');
    const a0 = aa[0], b = bb.map((x) => x / a0), a = aa.map((x) => x / a0);
    while (a.length > 1 && Math.abs(a[a.length - 1]) < 1e-14) a.pop();
    while (b.length > 1 && Math.abs(b[b.length - 1]) < 1e-14) b.pop();
    const M = Math.max(a.length, b.length) - 1;
    const polos = raicesZ(a, M), ceros = raicesZ(b, M);
    const cancel = [];
    for (const p of polos) {
      const c = ceros.find((q) => cabs(csub(q.p, p.p)) <= 1e-5 * Math.max(1, cabs(p.p)));
      if (c) cancel.push({ p: p.p, m: Math.min(p.m, c.m) });
    }
    const polosEf = polos.map((r) => { const c = cancel.find((q) => cabs(csub(q.p, r.p)) <= 1e-5 * Math.max(1, cabs(r.p))); return c ? { p: r.p, m: r.m - c.m } : r; }).filter((r) => r.m > 0);
    const nulo = bb.every((x) => Math.abs(x) < 1e-14);
    const rmax = Math.max(0, ...polosEf.map((r) => cabs(r.p)));
    const estado = nulo ? 'estable' : rmax > 1 + 1e-6 ? 'inestable' : rmax > 1 - 1e-6 && polosEf.length ? 'marginal' : 'estable';
    const repetidoEnCirc = polosEf.some((r) => r.m > 1 && Math.abs(cabs(r.p) - 1) < 1e-6);
    const estab = estado === 'marginal' && repetidoEnCirc ? 'inestable' : estado;
    const h = [];
    for (let n = 0; n < Nn; n++) { let s = n < b.length ? b[n] : 0; for (let k = 1; k < a.length && k <= n; k++) s -= a[k] * h[n - k]; h.push(s); }
    let cerr = null;
    const pl = lugar(polos);
    if (cerrada && !cancel.length && !nulo && b.length <= a.length && polos.length && polos.every((r) => r.m === 1 && cabs(r.p) > 1e-9) && pl.length === a.length - 1) {
      const R = pl.map((p, i) => {
        const inv = cdiv([1, 0], p);
        let den = [1, 0];
        pl.forEach((q, j) => { if (j !== i) den = cmul(den, csub([1, 0], cdiv(q, p))); });
        return cdiv(horner([...b].reverse(), inv), den);
      });
      const d = h[0] - R.reduce((s, r) => s + r[0], 0);
      cerr = { R, p: pl, d: Math.abs(d) < 1e-9 ? 0 : d, valor: (n) => (n === 0 ? cerr.d : 0) + R.reduce((s, r, i) => { const pn = [Math.pow(cabs(pl[i]), n) * Math.cos(n * carg(pl[i])), Math.pow(cabs(pl[i]), n) * Math.sin(n * carg(pl[i]))]; return s + cmul(r, pn)[0]; }, 0) };
    }
    const NP = 512, w = [], mag = [], fase = [];
    for (let i = 0; i <= NP; i++) {
      const om = (Math.PI * i) / NP, ev = (c) => c.reduce((s, x, k) => [s[0] + x * Math.cos(om * k), s[1] - x * Math.sin(om * k)], [0, 0]);
      const H = cdiv(ev(b), ev(a)); w.push(om); mag.push(cabs(H)); fase.push(carg(H));
    }
    const ev1 = (s) => cdiv([b.reduce((t, x, k) => t + x * s ** k, 0), 0], [a.reduce((t, x, k) => t + x * s ** k, 0), 0]);
    const H1 = a.reduce((t, x) => t + x, 0) === 0 ? [Infinity, 0] : ev1(1);
    const alt = (c) => c.reduce((t, x, k) => t + x * (k % 2 ? -1 : 1), 0);
    const Hn = alt(a) === 0 ? [Infinity, 0] : [alt(b) / alt(a), 0];
    let ip = 0; mag.forEach((m, i) => { if (m > mag[ip]) ip = i; });
    return { b, a, M, polos, ceros, polosEf, cancel, nulo, rmax, estab, h, cerr, resp: { w, mag, fase }, H1: H1[0], Hn: Hn[0], pico: { w: w[ip], mag: mag[ip] }, fs };
  }

  function pasosAnalisis(S, { entrada = false } = {}) {
    const { b, a, M } = S, pasos = [];
    const num = polinomio(b), den = polinomio(a);
    if (!entrada) {
      const y = ['y[n] = ' + b.map((x, k) => (Math.abs(x) < 1e-12 ? null : `${k === 0 && Math.abs(x - 1) < 1e-12 ? '' : f(x) + '·'}x[n${k ? '−' + k : ''}]`)).filter(Boolean).join(' + ')]
        .concat(a.slice(1).map((x, k) => (Math.abs(x) < 1e-12 ? '' : ` ${x > 0 ? '−' : '+'} ${Math.abs(Math.abs(x) - 1) < 1e-12 ? '' : f(Math.abs(x)) + '·'}y[n−${k + 1}]`))).join('');
      pasos.push({ t: 'Difference equation', html: `With $a_0 = 1$ (everything is divided by $a_0$): $${y}$` });
      pasos.push({ t: 'Transfer function', html: `The z-transform of each term is taken ($x[n-k] → z^{-k}X(z)$): $H(z) = Y(z)/X(z) = ${frac(num, den)}$` });
    }
    if (M > 0) {
      const pz = (c) => c.map((x, k) => [x, M - k]).concat(Array.from({ length: Math.max(0, M + 1 - c.length) }, (_, k) => [0, M - c.length - k])).filter(([x]) => Math.abs(x) > 1e-12).map(([x, e], i) => { const m = e === 0 ? '' : e === 1 ? 'z' : `z^${e}`, v = Math.abs(x), t = e === 0 ? f(v) : Math.abs(v - 1) < 1e-12 ? m : `${f(v)}·${m}`; return (i ? (x < 0 ? ' − ' : ' + ') : x < 0 ? '−' : '') + t; }).join('') || '0';
      pasos.push({ t: 'In powers of z', html: `Multiplying numerator and denominator by $z^{${M}}$: $H(z) = ${frac(pz(b), pz(a))}$` });
    }
    pasos.push({ t: 'Zeros and poles', html: `Zeros (roots of the numerator): ${S.ceros.length ? `$${conjuntos(S.ceros)}$` : 'none'}. Poles (roots of the denominator): ${S.polos.length ? `$${conjuntos(S.polos)}$` : 'none (the system is FIR: its impulse response is finite)'}.` });
    if (S.polos.length) {
      pasos.push({ t: 'Magnitude of the poles', html: S.polos.map((r) => `$|${fc(r.p)}| = ${f(cabs(r.p), 5)}$`).join(',  ') + (S.polos.some((r) => Math.abs(r.p[1]) > 1e-9) ? `; in polar form, ${S.polos.filter((r) => r.p[1] > 1e-9).map((r) => `$${f(cabs(r.p), 4)}∠${f((carg(r.p) * 180) / Math.PI, 4)}°$`).join(',  ')}.` : '.') });
    }
    if (S.nulo) pasos.push({ t: 'Zero system', html: 'The numerator is 0: $H(z) = 0$, the output is always 0 and $h[n] = 0$ for all $n$. There is no response to analyze; check the coefficients of $b$.' });
    if (S.cancel.length) pasos.push({ t: 'Pole-zero cancellation', html: `${S.cancel.map((c) => `The pole $${fc(c.p)}$ coincides with a zero (${c.m} ${c.m === 1 ? 'time' : 'times'}): they cancel`).join('; ')}. The stability and $h[n]$ are those of the remaining system${S.polosEf.length ? `, with the poles $${conjuntos(S.polosEf)}$` : ', with no poles (an FIR system remains)'}. Careful: in a real system the cancellation is exact only on paper; a canceled unstable pole is still dangerous.` });
    const lec = { estable: 'All the poles are inside the unit circle ($|p| < 1$): the causal system is <b>stable</b> and the impulse response decays.', marginal: 'The pole of largest magnitude is on the unit circle ($|p| = 1$): the system is <b>marginally stable</b> (the response neither grows nor vanishes).', inestable: 'Some pole is outside the unit circle (or repeated on it): the causal system is <b>unstable</b> and the response grows without bound.' };
    pasos.push({ t: 'Stability', html: `$|p|_{"max"} = ${f(S.rmax, 5)}$. ${lec[S.estab]}` });
    if (S.cerr) {
      const c = S.cerr, trozos = [];
      if (c.d) trozos.push(`${f(c.d)}·δ[n]`);
      const hechos = new Set();
      c.p.forEach((p, i) => {
        if (hechos.has(i)) return;
        if (Math.abs(p[1]) < 1e-9) { const r = c.R[i][0]; trozos.push(`${Math.abs(r - 1) < 1e-12 ? '' : f(r) + '·'}(${fc(p)})^n·u[n]`); hechos.add(i); }
        else { const j = c.p.findIndex((q, jj) => jj !== i && !hechos.has(jj) && Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] + p[1]) < 1e-9); if (j >= 0) { hechos.add(i); hechos.add(j); const r = cabs(c.R[i]); trozos.push(`${f(2 * r)}·${f(cabs(p), 5)}^n·cos(${f(Math.abs(carg(p)), 5)}·n ${carg(c.R[i]) * Math.sign(carg(p)) < 0 ? '−' : '+'} ${f(Math.abs(carg(c.R[i])), 4)})·u[n]`); } }
      });
      pasos.push({ t: 'Partial fractions (inverse transform)', html: `With simple poles, $H(z) = ${c.d ? f(c.d) + ' + ' : ''}Σ R_k/(1 − p_k z^{-1})$ and each term returns to the time domain as $R_k p_k^n u[n]$: $h[n] = ${trozos.join(' + ')}$` });
    } else {
      pasos.push({ t: 'Inverse transform', html: 'The closed form with partial fractions needs distinct nonzero poles; here $h[n]$ is obtained by long division (recursion of the difference equation).' });
    }
    pasos.push({ t: 'First values of h[n]', html: `$h[n]$ for $n = 0, 1, 2, …$: $${S.h.slice(0, 8).map((x) => f(x, 5)).join(';  ')}${S.h.length > 8 ? ';  …' : ''}$` });
    const gH = (x) => (isFinite(x) ? f(x, 5) : '∞');
    pasos.push({ t: 'Frequency response', html: `$H(z)$ is evaluated at $z = e^{jω}$. DC: $H(1) = ${gH(S.H1)}$; Nyquist frequency ($ω = π$): $H(−1) = ${gH(S.Hn)}$; maximum $|H| = ${f(S.pico.mag, 5)}$ at $ω = ${f(S.pico.w, 4)}$ rad/sample.` });
    return pasos;
  }

  const TIPOS_DIRECTA = {
    finita: 'Finite sequence (values of x[0], x[1], …)',
    exp: 'Exponential aⁿ·u[n]',
    escalon: 'Step u[n]',
    rampa: 'Ramp n·u[n]',
    coseno: 'Damped cosine aⁿ·cos(Ω₀n)·u[n]',
  };
  function directa(sc) {
    const tipo = TIPOS_DIRECTA[sc.tipo] ? sc.tipo : 'finita';
    let b, a, xn, X, roc, nombre;
    if (tipo === 'finita') {
      const xs = lista(sc.x, 'valores de x[n]');
      b = xs; a = [1]; nombre = 'x[n]';
      xn = 'x[n] = ' + xs.map((v, k) => (Math.abs(v) < 1e-12 ? null : `${f(v)}·δ[n${k ? '−' + k : ''}]`)).filter(Boolean).join(' + ');
      X = polinomio(xs); roc = 'toda $z$ salvo $z = 0$';
    } else if (tipo === 'exp') {
      const A = lee(sc, 'a', 'la base a'); b = [1]; a = [1, -A]; nombre = `${f(A)}^n·u[n]`;
      xn = `x[n] = (${f(A)})^n·u[n]`; X = `1/(1 − ${f(A)}·z^{-1}) = z/(z − ${f(A)})`; roc = `$|z| > ${f(Math.abs(A))}$`;
    } else if (tipo === 'escalon') {
      b = [1]; a = [1, -1]; xn = 'x[n] = u[n]'; X = '1/(1 − z^{-1}) = z/(z − 1)'; roc = '$|z| > 1$';
    } else if (tipo === 'rampa') {
      b = [0, 1]; a = [1, -2, 1]; xn = 'x[n] = n·u[n]'; X = 'z^{-1}/(1 − z^{-1})^2 = z/(z − 1)^2'; roc = '$|z| > 1$';
    } else {
      const A = lee(sc, 'a', 'la base a', { min: 0 }), W = lee(sc, 'w', 'the frequency Ω₀'), c = Math.cos(W);
      b = [1, -A * c]; a = [1, -2 * A * c, A * A];
      xn = `x[n] = (${f(A)})^n·cos(${f(W)}·n)·u[n]`; X = `(1 − ${f(A * c)}·z^{-1})/(1 − ${f(2 * A * c)}·z^{-1} + ${f(A * A)}·z^{-2})`; roc = `$|z| > ${f(A)}$`;
    }
    const Nn = lee(sc, 'Nn', 'the number of terms', { min: 2, max: 64, entero: true, def: 12 });
    const S = analiza(b, a, { Nn, cerrada: tipo !== 'finita' && tipo !== 'rampa' });
    const pas = [{ t: 'Definition', html: `$X(z) = Σ_{n=0}^{∞} x[n]·z^{-n}$, for $${xn}$` }, { t: 'Transform X(z)', html: `$X(z) = ${X}$, with region of convergence ${roc}.` }];
    if (tipo === 'finita') pas.push({ t: 'Region of convergence', html: 'A finite sequence has only powers $z^{-n}$ with finite $n$, so it converges on the whole plane except at $z = 0$ (and its inverse transform is just reading off the coefficients).' });
    const resto = pasosAnalisis(S, { entrada: true });
    return { modo: 'directa', tipo, nombre, X, roc, ...S, pasos: [...pas, ...resto] };
  }

  function fft(re, im) {
    const N = re.length, R = Float64Array.from(re), I = Float64Array.from(im);
    for (let i = 1, j = 0; i < N; i++) { let bit = N >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [R[i], R[j]] = [R[j], R[i]]; [I[i], I[j]] = [I[j], I[i]]; } }
    for (let len = 2; len <= N; len <<= 1) {
      const ang = (-2 * Math.PI) / len;
      for (let i = 0; i < N; i += len) for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k), wi = Math.sin(ang * k), u = i + k, v = i + k + len / 2;
        const tr = R[v] * wr - I[v] * wi, ti = R[v] * wi + I[v] * wr;
        R[v] = R[u] - tr; I[v] = I[u] - ti; R[u] += tr; I[u] += ti;
      }
    }
    return { re: Array.from(R), im: Array.from(I) };
  }
  function dft(re, im) {
    const N = re.length, R = [], I = [];
    for (let k = 0; k < N; k++) { let sr = 0, si = 0; for (let n = 0; n < N; n++) { const ang = (-2 * Math.PI * k * n) / N, c = Math.cos(ang), s = Math.sin(ang); sr += re[n] * c - im[n] * s; si += re[n] * s + im[n] * c; } R.push(sr); I.push(si); }
    return { re: R, im: I };
  }
  const VENTANAS = {
    rect: { nombre: 'Rectangular (no window)', w: () => 1, lob: 'narrow main lobe, but high leakage (−13 dB)' },
    hann: { nombre: 'Hann', w: (n, N) => 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / N), lob: 'low leakage (−31 dB) with a main lobe 2 times wider' },
    hamming: { nombre: 'Hamming', w: (n, N) => 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / N), lob: 'very low first side lobe (−43 dB)' },
    blackman: { nombre: 'Blackman', w: (n, N) => 0.42 - 0.5 * Math.cos((2 * Math.PI * n) / N) + 0.08 * Math.cos((4 * Math.PI * n) / N), lob: 'very low leakage (−58 dB) with a main lobe 3 times wider' },
  };
  const esPot2 = (n) => n >= 2 && (n & (n - 1)) === 0;

  function resolverFFT(sc) {
    const fs = lee(sc, 'fs', 'the sampling frequency', { minEx: 0 });
    const vent = VENTANAS[sc.ventana] ? sc.ventana : 'rect', V = VENTANAS[vent];
    let x, tonos = [], nota = '';
    if (sc.senal === 'muestras') {
      x = lista(sc.x, 'signal values');
      if (x.length < 2) throw new Error('At least 2 samples are needed');
      if (x.length > 4096) throw new Error('At most 4096 samples');
      let N = 2; while (N < x.length) N *= 2;
      if (N !== x.length) { nota = `There are ${x.length} samples: they are padded with zeros up to ${N} (a power of 2) to use the radix-2 FFT.`; x = x.concat(Array(N - x.length).fill(0)); }
    } else {
      const N = lee(sc, 'N', 'the number of samples N', { min: 2, max: 4096, entero: true });
      if (!esPot2(N)) throw new Error('N must be a power of 2 (8, 16, 32, 64…) for the radix-2 FFT');
      for (const i of [1, 2, 3]) {
        if (vacio(sc['f' + i]) && vacio(sc['a' + i])) continue;
        const fr = lee(sc, 'f' + i, `the frequency of tone ${i}`, { min: 0 }), am = lee(sc, 'a' + i, `the amplitude of tone ${i}`, { def: 1 }), fa = vacio(sc['p' + i]) ? 0 : lee(sc, 'p' + i, `the phase of tone ${i}`);
        tonos.push({ f: fr, a: am, fase: (fa * Math.PI) / 180 });
      }
      const dc = lee(sc, 'dc', 'the DC level', { def: 0 });
      if (!tonos.length && !dc) throw new Error('Add at least one tone (amplitude and frequency)');
      x = Array.from({ length: N }, (_, n) => dc + tonos.reduce((s, t) => s + t.a * Math.cos(2 * Math.PI * t.f * n / fs + t.fase), 0));
    }
    const N = x.length, w = x.map((_, n) => V.w(n, N)), xw = x.map((v, n) => v * w[n]);
    const cg = w.reduce((s, v) => s + v, 0) / N;
    const Mt = vacio(sc.pad) ? N : lee(sc, 'pad', 'the zero-padded size', { min: N, max: 16384, entero: true });
    if (!esPot2(Mt)) throw new Error('The zero-padded size must be a power of 2 (64, 128, 256…)');
    const X = fft(xw.concat(Array(Mt - N).fill(0)), Array(Mt).fill(0));
    const mod = X.re.map((r, k) => Math.hypot(r, X.im[k]));
    const H = Mt / 2, amp = [], frec = [], fase = [];
    for (let k = 0; k <= H; k++) { amp.push((k === 0 || k === H ? 1 : 2) * mod[k] / (N * cg)); frec.push((k * fs) / Mt); }
    const mx = Math.max(...amp);
    for (let k = 0; k <= H; k++) fase.push(amp[k] > 1e-6 * mx ? (Math.atan2(X.im[k], X.re[k]) * 180) / Math.PI : 0);   // la fase de un bin casi nulo es ruido numérico: se pone 0
    const picos = [];
    for (let k = 0; k <= H; k++) {
      if (amp[k] < 0.01 * mx || amp[k] < 1e-12) continue;
      const l = k > 0 ? amp[k - 1] : -1, r = k < H ? amp[k + 1] : -1;
      if (!(amp[k] >= l && amp[k] > r)) continue;
      const den = l - 2 * amp[k] + r, d = k > 0 && k < H && Math.abs(den) > 1e-12 ? (0.5 * (l - r)) / den : 0;
      picos.push({ k, f: ((k + d) * fs) / Mt, fk: frec[k], amp: amp[k] - 0.25 * (l - r) * d, ampk: amp[k], d });
    }
    picos.sort((u, v) => v.ampk - u.ampk);
    const pk = picos.slice(0, 5);
    const alias = tonos.filter((t) => t.f > fs / 2 + 1e-9).map((t) => ({ f: t.f, alias: Math.abs(t.f - fs * Math.round(t.f / fs)) }));
    const en = xw.reduce((s, v) => s + v * v, 0), enF = mod.reduce((s, v) => s + v * v, 0) / Mt;
    const etapas = Math.log2(Mt), dftMul = Mt * Mt, fftMul = (Mt / 2) * etapas;
    const pasos = [];
    pasos.push({ t: 'Definition (DFT)', html: `$X[k] = Σ_{n=0}^{N-1} x[n]·e^{-j2πkn/N}$, with $N = ${N}$ samples at $f_s = ${f(fs)}$ Hz. Bin $k$ corresponds to the frequency $f_k = k·f_s/N$.` });
    pasos.push({ t: 'Resolution and range', html: `Frequency resolution: $Δf = f_s/N = ${f(fs)}/${N} = ${f(fs / N)}$ Hz. Observed duration: $T = N/f_s = ${f(N / fs)}$ s. Maximum frequency without aliasing (Nyquist): $f_s/2 = ${f(fs / 2)}$ Hz.` });
    if (nota) pasos.push({ t: 'Zero padding', html: nota });
    if (Mt > N) pasos.push({ t: 'Zero padding', html: `${Mt - N} zeros are added after the ${N} windowed samples: the FFT becomes $${Mt}$ points and the bins are spaced $f_s/${Mt} = ${f(fs / Mt)}$ Hz apart. It is an interpolation of the same spectrum: it draws the peaks with more points, but it does <b>not</b> separate two tones closer than the real resolution $f_s/N = ${f(fs / N)}$ Hz (only observing for longer, with more samples, achieves that).` });
    if (tonos.length) pasos.push({ t: 'Signal', html: `$x[n] = ${(sc.dc && lee(sc, 'dc', '', { def: 0 }) ? f(lee(sc, 'dc', '', { def: 0 })) + ' + ' : '') + tonos.map((t) => `${f(t.a)}·cos(2π·${f(t.f)}·n/${f(fs)}${t.fase ? ' + ' + f(t.fase) : ''})`).join(' + ')}$` });
    pasos.push({ t: 'Window', html: `${V.nombre}${vent === 'rect' ? '' : `: $w[n]$ is multiplied by $x[n]$; coherent gain $${f(cg, 4)}$ (it is divided by it so that the amplitude of a tone is still read correctly)`}. ${mayus(V.lob)}.` });
    pasos.push({ t: 'FFT radix-2', html: `With $N = 2^{${etapas}}$ the DFT is split into even/odd parts: $X[k] = E[k] + W_N^{k}·O[k]$ with $W_N = e^{-j2π/N}$. That is $log_2 N = ${etapas}$ stages of $N/2 = ${H}$ butterflies: ${f(fftMul, 6)} complex multiplications instead of $N^2 = ${f(dftMul, 6)}$ (${f(dftMul / fftMul, 4)} times fewer).` });
    pasos.push({ t: 'Amplitude of each bin', html: `For $0 < k < N/2$: $A_k = 2|X[k]|/(N·${vent === 'rect' ? '1' : f(cg, 4)})$; at $k = 0$ and $k = N/2$ it is not doubled.` });
    const mv = Math.min(H, 8), filas = [];
    for (let k = 0; k <= mv; k++) filas.push(`<tr><td>${k}</td><td>${f(frec[k])}</td><td>${fc([X.re[k], X.im[k]], 4)}</td><td>${f(mod[k], 4)}</td><td>${f(amp[k], 4)}</td></tr>`);
    pasos.push({ t: `First bins`, html: '', tabla: `<div class="tabla-scroll"><table class="tabla"><thead><tr><th>k</th><th>f<sub>k</sub> (Hz)</th><th>X[k]</th><th>|X[k]|</th><th>Amplitude</th></tr></thead><tbody>${filas.join('')}</tbody></table></div>` });
    if (pk.length) pasos.push({ t: 'Peaks', html: pk.map((p) => `$f ≈ ${f(p.f, 5)}$ Hz (bin ${p.k}, $f_k = ${f(p.fk)}$ Hz): amplitude $≈ ${f(p.amp, 4)}$`).join(';  ') + '.' });
    if (alias.length) pasos.push({ t: 'Aliasing', html: alias.map((a) => `The $${f(a.f)}$ Hz tone exceeds $f_s/2 = ${f(fs / 2)}$ Hz and appears as $${f(a.alias)}$ Hz`).join('; ') + '.' });
    pasos.push({ t: 'Parseval check', html: `$Σ|x_w[n]|^2 = ${f(en, 6)}$ and $(1/N)Σ|X[k]|^2 = ${f(enF, 6)}$: the energy is the same in time and in frequency.` });
    const fugas = vent === 'rect' && tonos.some((t) => Math.abs(t.f / (fs / N) - Math.round(t.f / (fs / N))) > 1e-6);
    return { modo: 'fft', N, M: Mt, dfBin: fs / Mt, fase, fs, x, xw, w, ventana: vent, cg, frec, amp, mod, X, pk, alias, tonos, df: fs / N, dftMul, fftMul, etapas, parseval: [en, enF], fugas, nota, pasos };
  }

  function resuelveC(A, y) {
    const n = y.length, M = A.map((fila, i) => [...fila.map((z) => [z[0], z[1]]), [y[i][0], y[i][1]]]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (cabs(M[r][c]) > cabs(M[p][c])) p = r;
      if (cabs(M[p][c]) < 1e-13) return null;
      [M[c], M[p]] = [M[p], M[c]];
      for (let r = c + 1; r < n; r++) { const q = cdiv(M[r][c], M[c][c]); for (let k = c; k <= n; k++) M[r][k] = csub(M[r][k], cmul(q, M[c][k])); }
    }
    const x = Array(n).fill(null);
    for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let k = i + 1; k < n; k++) s = csub(s, cmul(M[i][k], x[k])); x[i] = cdiv(s, M[i][i]); }
    return x;
  }
  const binom = (n, k) => { let r = 1; for (let j = 1; j <= k; j++) r = (r * (n - k + j)) / j; return r; };   // C(n, k) con n entero cualquiera (polinomio en n)
  const polo = (p, n) => { const r = cabs(p), a = carg(p); return r === 0 ? (n === 0 ? [1, 0] : [0, 0]) : [Math.pow(r, n) * Math.cos(n * a), Math.pow(r, n) * Math.sin(n * a)]; };
  function regiones(polos) {
    const rs = [];
    for (const r of polos.map((q) => cabs(q.p)).sort((u, v) => u - v)) if (!rs.length || r > rs[rs.length - 1] * (1 + 1e-6) + 1e-12) rs.push(r);
    const cad = (x) => f(x, 4);
    if (!rs.length) return { rs, ops: ['The whole z-plane (except z = 0)'] };
    const ops = [`|z| < ${cad(rs[0])} (all the poles to the right of the region: anticausal signal)`];
    for (let i = 0; i + 1 < rs.length; i++) ops.push(`${cad(rs[i])} < |z| < ${cad(rs[i + 1])} (two-sided signal)`);
    ops.push(`|z| > ${cad(rs[rs.length - 1])} (causal signal)`);
    return { rs, ops };
  }
  function opcionesRoc(sc) {
    try {
      const aa = lista(sc.a, 'denominator coefficients'); if (Math.abs(aa[0]) < 1e-14) return ['|z| > pole of largest magnitude (causal signal)'];
      const a = aa.map((x) => x / aa[0]); while (a.length > 1 && Math.abs(a[a.length - 1]) < 1e-14) a.pop();
      return regiones(raicesZ(a, a.length - 1)).ops;
    } catch (e) { return ['|z| > pole of largest magnitude (causal signal)']; }
  }
  function inversa(sc) {
    const bb = lista(sc.b, 'numerator coefficients'), aa = lista(sc.a, 'denominator coefficients');
    if (bb.length > 12 || aa.length > 12) throw new Error('At most 12 coefficients');
    if (!aa.length || Math.abs(aa[0]) < 1e-14) throw new Error('The first coefficient of the denominator (a₀) cannot be 0');
    if (bb.every((x) => Math.abs(x) < 1e-14)) throw new Error('The numerator cannot be all zeros: X(z) = 0 and x[n] = 0');
    const Nn = lee(sc, 'Nn', 'the number of terms', { min: 2, max: 64, entero: true, def: 10 });
    const b = bb.map((x) => x / aa[0]), a = aa.map((x) => x / aa[0]);
    while (a.length > 1 && Math.abs(a[a.length - 1]) < 1e-14) a.pop();
    while (b.length > 1 && Math.abs(b[b.length - 1]) < 1e-14) b.pop();
    const Ma = a.length - 1, Mb = b.length - 1;
    const polos = Ma ? raicesZ(a, Ma) : [], { rs, ops } = regiones(polos);
    const idx = Math.max(0, Math.min(ops.length - 1, Math.round(vacio(sc.roc) ? ops.length - 1 : +sc.roc)));
    const NS = 80, xc = [];
    for (let n = 0; n < NS; n++) { let v = n < b.length ? b[n] : 0; for (let k = 1; k < a.length && k <= n; k++) v -= a[k] * xc[n - k]; xc.push(v); }
    const npoly = Math.max(0, Mb - Ma + 1), cols = [];
    polos.forEach((r, i) => { for (let k = 1; k <= r.m; k++) cols.push({ i, k }); });
    const nun = npoly + cols.length;
    let R = [], Q = [];
    if (nun) {
      const Am = [], y = [];
      for (let n = 0; n < nun; n++) {
        Am.push([...Array(npoly).fill(0).map((_, j) => (n === j ? [1, 0] : [0, 0])), ...cols.map(({ i, k }) => { const pn = polo(polos[i].p, n), c = binom(n + k - 1, k - 1); return [pn[0] * c, pn[1] * c]; })]);
        y.push([xc[n], 0]);
      }
      const sol = resuelveC(Am, y);
      if (!sol) throw new Error('It could not be decomposed into partial fractions (poles too close to each other)');
      Q = sol.slice(0, npoly).map((z) => z[0]);
      R = cols.map((c, j) => ({ ...c, R: sol[npoly + j] }));
    }
    const lo = idx === 0 ? 0 : rs[idx - 1], hi = idx >= rs.length ? Infinity : rs[idx];
    const causal = (i) => idx > 0 && cabs(polos[i].p) <= lo * (1 + 1e-6) + 1e-12;
    const valor = (n) => {
      let v = 0;
      if (n >= 0 && n < npoly) v += Q[n];
      for (const c of R) {
        const pn = polo(polos[c.i].p, n);
        if (causal(c.i)) { if (n >= 0) { const t = cmul(c.R, pn), g = binom(n + c.k - 1, c.k - 1); v += t[0] * g; } }
        else if (n <= -1) { const t = cmul(c.R, pn), g = binom(n + c.k - 1, c.k - 1); v -= t[0] * g; }
      }
      return v;
    };
    const lado = !rs.length ? 'finita' : idx === rs.length ? 'causal' : idx === 0 ? 'anticausal' : 'bilateral';
    let n0, n1;
    if (lado === 'causal' || lado === 'finita') { n0 = 0; n1 = Nn - 1; } else if (lado === 'anticausal') { n0 = -(Nn - 1); n1 = Math.max(npoly - 1, 0); } else { n0 = -Math.floor(Nn / 2); n1 = n0 + Nn - 1; }
    const ns = [], xs = []; for (let n = n0; n <= n1; n++) { ns.push(n); xs.push(valor(n)); }
    const contieneCirc = lo < 1 - 1e-9 && hi > 1 + 1e-9;
    const pasos = [];
    const num = polinomio(b), den = polinomio(a);
    pasos.push({ t: 'Transform to invert', html: `$X(z) = ${frac(num, den)}$ with region of convergence (ROC) <b>${ops[idx]}</b>. The ROC decides how to return to the time domain: the same $X(z)$ gives different signals in different regions.` });
    if (!polos.length) pasos.push({ t: 'No poles', html: `$X(z)$ is a polynomial in $z^{-1}$: each term $c_k z^{-k}$ is an impulse $c_k·δ[n−k]$, so $x[n]$ is a finite sequence: ${b.map((c, k) => `$x[${k}] = ${f(c)}$`).join(', ')}. It converges on the whole plane except at $z = 0$ (and $z = ∞$ if there are delays).` });
    else {
      pasos.push({ t: 'Poles and possible regions', html: `Poles (roots of $A$): $${conjuntos(polos)}$. There ${ops.length === 1 ? 'is' : 'are'} ${ops.length} possible ${ops.length === 1 ? 'region' : 'regions'} of convergence, separated by the magnitudes of the poles: ${ops.map((o, i) => `${i === idx ? '<b>' : ''}${o}${i === idx ? '</b>' : ''}`).join('; ')}.` });
      const polyTxt = npoly ? `${Q.map((c, j) => (Math.abs(c) < 1e-12 ? '' : `${f(c)}·z^{-${j}}`)).filter(Boolean).join(' + ') || '0'} + ` : '';
      const fr = R.map((c) => { const p = polos[c.i].p; return `${fc(c.R)}/(1 − (${fc(p)}) z^{-1})${c.k > 1 ? '^' + c.k : ''}`; }).join(' + ');
      pasos.push({ t: 'Partial fractions', html: `$X(z) = ${npoly ? 'Q(z^{-1}) + ' : ''}Σ_i Σ_k R_{ik}/(1 − p_i z^{-1})^k$ is decomposed (with a polynomial $Q$ only if the numerator has a higher degree than the denominator). The coefficients come from matching with the series expansion (long division): $X(z) = ${polyTxt}${fr}$.` });
      const izq = polos.filter((_, i) => !causal(i)), der = polos.filter((_, i) => causal(i));
      pasos.push({ t: 'Which transform pairs are used', html: `With poles <b>inside</b> the ROC (right-sided signal): $p^n u[n] ↔ 1/(1 − p z^{-1})$ and $C(n+k−1, k−1)·p^n u[n] ↔ 1/(1 − p z^{-1})^k$. With poles <b>outside</b> (left-sided): $−p^n u[−n−1] ↔ 1/(1 − p z^{-1})$ and, in general, $−C(n+k−1, k−1)·p^n u[−n−1]$. Here ${der.length ? `right: $${conjuntos(der)}$` : 'no right-sided pole'}; ${izq.length ? `left: $${conjuntos(izq)}$` : 'no left-sided pole'}.` });
      const trozos = [], coef = (v) => (Math.abs(v - 1) < 1e-12 ? '' : Math.abs(v + 1) < 1e-12 ? '−' : f(v) + '·');
      Q.forEach((c, j) => { if (Math.abs(c) > 1e-12) trozos.push(`${f(c)}·δ[n${j ? '−' + j : ''}]`); });
      const u = (i) => (causal(i) ? 'u[n]' : 'u[−n−1]');
      for (const c of R) {
        const i = c.i, p = polos[i].p, sg = causal(i) ? 1 : -1, bin = c.k === 1 ? '' : c.k === 2 ? '(n+1)·' : `C(n+${c.k - 1}, ${c.k - 1})·`;
        if (Math.abs(p[1]) < 1e-9) trozos.push(`${coef(sg * c.R[0])}${bin}(${fc(p)})^n·${u(i)}`);
        else if (p[1] > 0) trozos.push(`${coef(sg * 2 * cabs(c.R))}${bin}${f(cabs(p), 5)}^n·cos(${f(carg(p), 5)}·n ${carg(c.R) < 0 ? '−' : '+'} ${f(Math.abs(carg(c.R)), 5)})·${u(i)}`);
      }
      pasos.push({ t: 'Result x[n]', html: `$x[n] = ${trozos.join(' + ').replace(/\+ −/g, '− ') || '0'}$` });
    }
    const quien = lado === 'causal' ? 'Since the signal is causal (ROC outside the largest pole), $x[n] = 0$ for $n < 0$.' : lado === 'anticausal' ? 'Since the signal is anticausal (ROC inside the smallest pole), $x[n] = 0$ for $n ≥ 1$ except the impulses of the quotient.' : lado === 'bilateral' ? 'The signal is two-sided: the inner poles contribute the causal part and the outer ones the anticausal part.' : 'The signal is finite.';
    pasos.push({ t: 'First terms', html: `${quien} Values of $x[n]$ for $n = ${n0}, …, ${n1}$: $${ns.map((n, i) => `x[${n}] = ${f(xs[i], 5)}`).slice(0, 14).join(';  ')}${ns.length > 14 ? ';  …' : ''}$` });
    if (lado === 'causal' || (lado === 'finita')) pasos.push({ t: 'Check by long division', html: `Dividing $B(z^{-1})$ by $A(z^{-1})$ in powers of $z^{-1}$ (the recursion $x[n] = b_n − Σ a_k x[n−k]$) gives $${xc.slice(0, 8).map((x) => f(x, 5)).join(';  ')}$: they are the same coefficients.` });
    pasos.push({ t: 'Stability and Fourier transform', html: contieneCirc ? 'The ROC <b>contains the unit circle</b>: $x[n]$ is absolutely summable and its Fourier transform $X(e^{jω})$ exists. If $x[n]$ is the impulse response of a system, the system is stable.' : 'The ROC <b>does not contain the unit circle</b>: $x[n]$ is not absolutely summable (it grows or does not decay) and $X(e^{jω})$ does not exist; if it were the response of a system, the system would be unstable.' });
    const ceros = Mb ? raicesZ(b, Math.max(Ma, Mb)) : [];
    return { modo: 'inversa', b, a, M: Math.max(Ma, Mb), polos, ceros, lado, roc: ops[idx], rocOps: ops, rocIdx: idx, rocRango: [lo, hi], contieneCirc, R, Q, valor, ns, xs, xc, rmax: Math.max(0, ...polos.map((r) => cabs(r.p))), estab: contieneCirc ? 'estable' : 'inestable', pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'fft') return resolverFFT(sc);
    if (sc.modo === 'inversa') return inversa(sc);
    if (sc.modo === 'directa') return directa(sc);
    const b = lista(sc.b, 'numerator coefficients'), a = lista(sc.a, 'denominator coefficients');
    if (b.length > 12 || a.length > 12) throw new Error('At most 12 coefficients');
    const Nn = lee(sc, 'Nn', 'the number of terms', { min: 2, max: 64, entero: true, def: 12 });
    const S = analiza(b, a, { Nn });
    return { modo: 'sistema', ...S, pasos: pasosAnalisis(S) };
  }

  const ejemplos = [
    { clave: 'paso-bajo', nombre: '1st-order system: y[n] = x[n] + 0.5·y[n−1]', sc: { modo: 'sistema', b: '1', a: '1 -0,5', Nn: '12' } },
    { clave: 'resonador', nombre: '2nd-order system with complex poles', sc: { modo: 'sistema', b: '1', a: '1 -1,2 0,72', Nn: '16' } },
    { clave: 'inestable', nombre: 'Unstable system (a pole at z = 2)', sc: { modo: 'sistema', b: '1', a: '1 -2,5 1', Nn: '12' } },
    { clave: 'media-movil', nombre: '4-sample moving average (FIR)', sc: { modo: 'sistema', b: '0,25 0,25 0,25 0,25', a: '1', Nn: '10' } },
    { clave: 'exp', nombre: 'Transform of aⁿ·u[n] with a = 0.8', sc: { modo: 'directa', tipo: 'exp', a: '0,8', Nn: '12' } },
    { clave: 'coseno', nombre: 'Transform of 0.9ⁿ·cos(πn/4)·u[n]', sc: { modo: 'directa', tipo: 'coseno', a: '0,9', w: 'π/4', Nn: '16' } },
    { clave: 'inversa-causal', nombre: 'Inverse: X(z) = 1/((1 − 0.5z⁻¹)(1 − 0.25z⁻¹)), causal', sc: { modo: 'inversa', b: '1', a: '1 -0,75 0,125', roc: '2', Nn: '10' } },
    { clave: 'inversa-bilateral', nombre: 'Two-sided inverse: poles 0.5 and 2, ROC between them', sc: { modo: 'inversa', b: '1', a: '1 -2,5 1', roc: '1', Nn: '12' } },
    { clave: 'inversa-doble', nombre: 'Inverse with a double pole: 1/(1 − 0.5z⁻¹)²', sc: { modo: 'inversa', b: '1', a: '1 -1 0,25', roc: '1', Nn: '10' } },
    { clave: 'dos-tonos', nombre: 'FFT of two tones (50 Hz and 120 Hz)', sc: { modo: 'fft', senal: 'tonos', fs: '640', N: '64', a1: '1', f1: '50', a2: '0,5', f2: '120', a3: '', f3: '', dc: '', ventana: 'rect' } },
    { clave: 'fugas', nombre: 'Spectral leakage: 55 Hz between two bins', sc: { modo: 'fft', senal: 'tonos', fs: '640', N: '64', a1: '1', f1: '55', a2: '', f2: '', a3: '', f3: '', dc: '', ventana: 'hann' } },
    { clave: 'aliasing', nombre: 'Aliasing: 130 Hz sampled at 100 Hz', sc: { modo: 'fft', senal: 'tonos', fs: '100', N: '32', a1: '1', f1: '130', a2: '', f2: '', a3: '', f3: '', dc: '', ventana: 'rect' } },
    { clave: 'muestras', nombre: 'DFT of the samples 1, 2, 3, 4', sc: { modo: 'fft', senal: 'muestras', fs: '4', x: '1 2 3 4', ventana: 'rect' } },
  ];

  return { resolver, ejemplos, f, fc, fft, dft, raices, analiza, leeNum, opcionesRoc, VENTANAS, TIPOS_DIRECTA, cabs, carg };
})();

