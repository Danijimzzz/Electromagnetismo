const TransformadaZ = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
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
    if (vacio(sc[k])) { if (def !== undefined) return def; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]), N = mayus(nom);
    if (!isFinite(v)) throw new Error(`${N} debe ser un número`);
    if (entero && v !== Math.round(v)) throw new Error(`${N} debe ser un número entero`);
    if (min !== undefined && v < min) throw new Error(`${N} debe ser al menos ${f(min)}`);
    if (minEx !== undefined && v <= minEx) throw new Error(`${N} debe ser mayor que ${f(minEx)}`);
    if (max !== undefined && v > max) throw new Error(`${N} debe ser como mucho ${f(max)}`);
    return v;
  }
  function lista(txt, nom) {
    if (vacio(txt)) throw new Error(`Faltan ${nom}`);
    const xs = String(txt).trim().split(/[\s;]+/).filter(Boolean).map(leeNum);
    if (!xs.length || xs.some((x) => !isFinite(x))) throw new Error(`Los ${nom} deben ser números separados por espacios`);
    if (xs.length > 64 && nom !== 'valores de la señal') throw new Error(`Demasiados ${nom} (como mucho 64)`);
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
    if (!aa.length || Math.abs(aa[0]) < 1e-14) throw new Error('El primer coeficiente del denominador (a₀) no puede ser 0');
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
      pasos.push({ t: 'Ecuación en diferencias', html: `Con $a_0 = 1$ (se divide todo entre $a_0$): $${y}$` });
      pasos.push({ t: 'Función de transferencia', html: `Se toma la transformada z de cada término ($x[n-k] → z^{-k}X(z)$): $H(z) = Y(z)/X(z) = ${frac(num, den)}$` });
    }
    if (M > 0) {
      const pz = (c) => c.map((x, k) => [x, M - k]).concat(Array.from({ length: Math.max(0, M + 1 - c.length) }, (_, k) => [0, M - c.length - k])).filter(([x]) => Math.abs(x) > 1e-12).map(([x, e], i) => { const m = e === 0 ? '' : e === 1 ? 'z' : `z^${e}`, v = Math.abs(x), t = e === 0 ? f(v) : Math.abs(v - 1) < 1e-12 ? m : `${f(v)}·${m}`; return (i ? (x < 0 ? ' − ' : ' + ') : x < 0 ? '−' : '') + t; }).join('') || '0';
      pasos.push({ t: 'En potencias de z', html: `Multiplicando numerador y denominador por $z^{${M}}$: $H(z) = ${frac(pz(b), pz(a))}$` });
    }
    pasos.push({ t: 'Ceros y polos', html: `Ceros (raíces del numerador): ${S.ceros.length ? `$${conjuntos(S.ceros)}$` : 'ninguno'}. Polos (raíces del denominador): ${S.polos.length ? `$${conjuntos(S.polos)}$` : 'ninguno (el sistema es FIR: su respuesta al impulso es finita)'}.` });
    if (S.polos.length) {
      pasos.push({ t: 'Módulo de los polos', html: S.polos.map((r) => `$|${fc(r.p)}| = ${f(cabs(r.p), 5)}$`).join(',  ') + (S.polos.some((r) => Math.abs(r.p[1]) > 1e-9) ? `; en polar, ${S.polos.filter((r) => r.p[1] > 1e-9).map((r) => `$${f(cabs(r.p), 4)}∠${f((carg(r.p) * 180) / Math.PI, 4)}°$`).join(',  ')}.` : '.') });
    }
    if (S.nulo) pasos.push({ t: 'Sistema nulo', html: 'El numerador vale 0: $H(z) = 0$, la salida es siempre 0 y $h[n] = 0$ para todo $n$. No hay respuesta que analizar; revisa los coeficientes de $b$.' });
    if (S.cancel.length) pasos.push({ t: 'Cancelación polo-cero', html: `${S.cancel.map((c) => `El polo $${fc(c.p)}$ coincide con un cero (${c.m} ${c.m === 1 ? 'vez' : 'veces'}): se cancelan`).join('; ')}. La estabilidad y $h[n]$ son las del sistema que queda${S.polosEf.length ? `, con los polos $${conjuntos(S.polosEf)}$` : ', sin polos (queda un sistema FIR)'}. Ojo: en un sistema real la cancelación es exacta solo sobre el papel; un polo inestable cancelado sigue siendo peligroso.` });
    const lec = { estable: 'Todos los polos están dentro de la circunferencia unidad ($|p| < 1$): el sistema causal es <b>estable</b> y la respuesta al impulso se amortigua.', marginal: 'El polo de mayor módulo está sobre la circunferencia unidad ($|p| = 1$): el sistema es <b>marginalmente estable</b> (la respuesta no crece ni se anula).', inestable: 'Algún polo está fuera de la circunferencia unidad (o repetido sobre ella): el sistema causal es <b>inestable</b> y la respuesta crece sin límite.' };
    pasos.push({ t: 'Estabilidad', html: `$|p|_{"máx"} = ${f(S.rmax, 5)}$. ${lec[S.estab]}` });
    if (S.cerr) {
      const c = S.cerr, trozos = [];
      if (c.d) trozos.push(`${f(c.d)}·δ[n]`);
      const hechos = new Set();
      c.p.forEach((p, i) => {
        if (hechos.has(i)) return;
        if (Math.abs(p[1]) < 1e-9) { const r = c.R[i][0]; trozos.push(`${Math.abs(r - 1) < 1e-12 ? '' : f(r) + '·'}(${fc(p)})^n·u[n]`); hechos.add(i); }
        else { const j = c.p.findIndex((q, jj) => jj !== i && !hechos.has(jj) && Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] + p[1]) < 1e-9); if (j >= 0) { hechos.add(i); hechos.add(j); const r = cabs(c.R[i]); trozos.push(`${f(2 * r)}·${f(cabs(p), 5)}^n·cos(${f(Math.abs(carg(p)), 5)}·n ${carg(c.R[i]) * Math.sign(carg(p)) < 0 ? '−' : '+'} ${f(Math.abs(carg(c.R[i])), 4)})·u[n]`); } }
      });
      pasos.push({ t: 'Fracciones simples (transformada inversa)', html: `Con polos simples, $H(z) = ${c.d ? f(c.d) + ' + ' : ''}Σ R_k/(1 − p_k z^{-1})$ y cada término vuelve al tiempo como $R_k p_k^n u[n]$: $h[n] = ${trozos.join(' + ')}$` });
    } else {
      pasos.push({ t: 'Transformada inversa', html: 'La forma cerrada con fracciones simples necesita polos distintos y no nulos; aquí se obtiene $h[n]$ por división larga (recursión de la ecuación en diferencias).' });
    }
    pasos.push({ t: 'Primeros valores de h[n]', html: `$h[n]$ para $n = 0, 1, 2, …$: $${S.h.slice(0, 8).map((x) => f(x, 5)).join(';  ')}${S.h.length > 8 ? ';  …' : ''}$` });
    const gH = (x) => (isFinite(x) ? f(x, 5) : '∞');
    pasos.push({ t: 'Respuesta en frecuencia', html: `Se evalúa $H(z)$ en $z = e^{jω}$. Continua: $H(1) = ${gH(S.H1)}$; frecuencia de Nyquist ($ω = π$): $H(−1) = ${gH(S.Hn)}$; máximo $|H| = ${f(S.pico.mag, 5)}$ en $ω = ${f(S.pico.w, 4)}$ rad/muestra.` });
    return pasos;
  }

  const TIPOS_DIRECTA = {
    finita: 'Secuencia finita (valores de x[0], x[1], …)',
    exp: 'Exponencial aⁿ·u[n]',
    escalon: 'Escalón u[n]',
    rampa: 'Rampa n·u[n]',
    coseno: 'Coseno amortiguado aⁿ·cos(Ω₀n)·u[n]',
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
      const A = lee(sc, 'a', 'la base a', { min: 0 }), W = lee(sc, 'w', 'la frecuencia Ω₀'), c = Math.cos(W);
      b = [1, -A * c]; a = [1, -2 * A * c, A * A];
      xn = `x[n] = (${f(A)})^n·cos(${f(W)}·n)·u[n]`; X = `(1 − ${f(A * c)}·z^{-1})/(1 − ${f(2 * A * c)}·z^{-1} + ${f(A * A)}·z^{-2})`; roc = `$|z| > ${f(A)}$`;
    }
    const Nn = lee(sc, 'Nn', 'el número de términos', { min: 2, max: 64, entero: true, def: 12 });
    const S = analiza(b, a, { Nn, cerrada: tipo !== 'finita' && tipo !== 'rampa' });
    const pas = [{ t: 'Definición', html: `$X(z) = Σ_{n=0}^{∞} x[n]·z^{-n}$, para $${xn}$` }, { t: 'Transformada X(z)', html: `$X(z) = ${X}$, con región de convergencia ${roc}.` }];
    if (tipo === 'finita') pas.push({ t: 'Región de convergencia', html: 'Una secuencia finita tiene solo potencias $z^{-n}$ con $n$ finito, así que converge en todo el plano salvo en $z = 0$ (y su transformada inversa es leer los coeficientes).' });
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
    rect: { nombre: 'Rectangular (sin ventana)', w: () => 1, lob: 'lóbulo principal estrecho, pero fugas altas (−13 dB)' },
    hann: { nombre: 'Hann', w: (n, N) => 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / N), lob: 'fugas bajas (−31 dB) con el lóbulo 2 veces más ancho' },
    hamming: { nombre: 'Hamming', w: (n, N) => 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / N), lob: 'primer lóbulo lateral muy bajo (−43 dB)' },
    blackman: { nombre: 'Blackman', w: (n, N) => 0.42 - 0.5 * Math.cos((2 * Math.PI * n) / N) + 0.08 * Math.cos((4 * Math.PI * n) / N), lob: 'fugas muy bajas (−58 dB) con el lóbulo 3 veces más ancho' },
  };
  const esPot2 = (n) => n >= 2 && (n & (n - 1)) === 0;

  function resolverFFT(sc) {
    const fs = lee(sc, 'fs', 'la frecuencia de muestreo', { minEx: 0 });
    const vent = VENTANAS[sc.ventana] ? sc.ventana : 'rect', V = VENTANAS[vent];
    let x, tonos = [], nota = '';
    if (sc.senal === 'muestras') {
      x = lista(sc.x, 'valores de la señal');
      if (x.length < 2) throw new Error('Hacen falta al menos 2 muestras');
      if (x.length > 4096) throw new Error('Como mucho 4096 muestras');
      let N = 2; while (N < x.length) N *= 2;
      if (N !== x.length) { nota = `Hay ${x.length} muestras: se rellenan con ceros hasta ${N} (potencia de 2) para usar la FFT radix-2.`; x = x.concat(Array(N - x.length).fill(0)); }
    } else {
      const N = lee(sc, 'N', 'el número de muestras N', { min: 2, max: 4096, entero: true });
      if (!esPot2(N)) throw new Error('N debe ser una potencia de 2 (8, 16, 32, 64…) para la FFT radix-2');
      for (const i of [1, 2, 3]) {
        if (vacio(sc['f' + i]) && vacio(sc['a' + i])) continue;
        const fr = lee(sc, 'f' + i, `la frecuencia del tono ${i}`, { min: 0 }), am = lee(sc, 'a' + i, `la amplitud del tono ${i}`, { def: 1 }), fa = vacio(sc['p' + i]) ? 0 : lee(sc, 'p' + i, `la fase del tono ${i}`);
        tonos.push({ f: fr, a: am, fase: (fa * Math.PI) / 180 });
      }
      const dc = lee(sc, 'dc', 'el nivel de continua', { def: 0 });
      if (!tonos.length && !dc) throw new Error('Añade al menos un tono (amplitud y frecuencia)');
      x = Array.from({ length: N }, (_, n) => dc + tonos.reduce((s, t) => s + t.a * Math.cos(2 * Math.PI * t.f * n / fs + t.fase), 0));
    }
    const N = x.length, w = x.map((_, n) => V.w(n, N)), xw = x.map((v, n) => v * w[n]);
    const cg = w.reduce((s, v) => s + v, 0) / N;
    const Mt = vacio(sc.pad) ? N : lee(sc, 'pad', 'el tamaño con relleno de ceros', { min: N, max: 16384, entero: true });
    if (!esPot2(Mt)) throw new Error('El tamaño con relleno de ceros debe ser una potencia de 2 (64, 128, 256…)');
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
    pasos.push({ t: 'Definición (DFT)', html: `$X[k] = Σ_{n=0}^{N-1} x[n]·e^{-j2πkn/N}$, con $N = ${N}$ muestras a $f_s = ${f(fs)}$ Hz. El bin $k$ corresponde a la frecuencia $f_k = k·f_s/N$.` });
    pasos.push({ t: 'Resolución y rango', html: `Resolución en frecuencia: $Δf = f_s/N = ${f(fs)}/${N} = ${f(fs / N)}$ Hz. Duración observada: $T = N/f_s = ${f(N / fs)}$ s. Frecuencia máxima sin aliasing (Nyquist): $f_s/2 = ${f(fs / 2)}$ Hz.` });
    if (nota) pasos.push({ t: 'Relleno con ceros', html: nota });
    if (Mt > N) pasos.push({ t: 'Relleno de ceros', html: `Se añaden ${Mt - N} ceros tras las ${N} muestras ventaneadas: la FFT pasa a $${Mt}$ puntos y los bins se separan $f_s/${Mt} = ${f(fs / Mt)}$ Hz. Es una interpolación del mismo espectro: dibuja los picos con más puntos, pero <b>no</b> separa dos tonos más cercanos que la resolución real $f_s/N = ${f(fs / N)}$ Hz (eso solo lo consigue observar más tiempo, con más muestras).` });
    if (tonos.length) pasos.push({ t: 'Señal', html: `$x[n] = ${(sc.dc && lee(sc, 'dc', '', { def: 0 }) ? f(lee(sc, 'dc', '', { def: 0 })) + ' + ' : '') + tonos.map((t) => `${f(t.a)}·cos(2π·${f(t.f)}·n/${f(fs)}${t.fase ? ' + ' + f(t.fase) : ''})`).join(' + ')}$` });
    pasos.push({ t: 'Ventana', html: `${V.nombre}${vent === 'rect' ? '' : `: $w[n]$ se multiplica por $x[n]$; ganancia coherente $${f(cg, 4)}$ (se divide entre ella para que la amplitud de un tono siga leyéndose bien)`}. ${mayus(V.lob)}.` });
    pasos.push({ t: 'FFT radix-2', html: `Con $N = 2^{${etapas}}$ la DFT se parte en pares/impares: $X[k] = E[k] + W_N^{k}·O[k]$ con $W_N = e^{-j2π/N}$. Son $log_2 N = ${etapas}$ etapas de $N/2 = ${H}$ mariposas: ${f(fftMul, 6)} multiplicaciones complejas en vez de $N^2 = ${f(dftMul, 6)}$ (${f(dftMul / fftMul, 4)} veces menos).` });
    pasos.push({ t: 'Amplitud de cada bin', html: `Para $0 < k < N/2$: $A_k = 2|X[k]|/(N·${vent === 'rect' ? '1' : f(cg, 4)})$; en $k = 0$ y $k = N/2$ no se duplica.` });
    const mv = Math.min(H, 8), filas = [];
    for (let k = 0; k <= mv; k++) filas.push(`<tr><td>${k}</td><td>${f(frec[k])}</td><td>${fc([X.re[k], X.im[k]], 4)}</td><td>${f(mod[k], 4)}</td><td>${f(amp[k], 4)}</td></tr>`);
    pasos.push({ t: `Primeros bins`, html: '', tabla: `<div class="tabla-scroll"><table class="tabla"><thead><tr><th>k</th><th>f<sub>k</sub> (Hz)</th><th>X[k]</th><th>|X[k]|</th><th>Amplitud</th></tr></thead><tbody>${filas.join('')}</tbody></table></div>` });
    if (pk.length) pasos.push({ t: 'Picos', html: pk.map((p) => `$f ≈ ${f(p.f, 5)}$ Hz (bin ${p.k}, $f_k = ${f(p.fk)}$ Hz): amplitud $≈ ${f(p.amp, 4)}$`).join(';  ') + '.' });
    if (alias.length) pasos.push({ t: 'Aliasing', html: alias.map((a) => `El tono de $${f(a.f)}$ Hz supera $f_s/2 = ${f(fs / 2)}$ Hz y aparece como $${f(a.alias)}$ Hz`).join('; ') + '.' });
    pasos.push({ t: 'Comprobación de Parseval', html: `$Σ|x_w[n]|^2 = ${f(en, 6)}$ y $(1/N)Σ|X[k]|^2 = ${f(enF, 6)}$: la energía es la misma en el tiempo y en la frecuencia.` });
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
    if (!rs.length) return { rs, ops: ['Todo el plano z (salvo z = 0)'] };
    const ops = [`|z| < ${cad(rs[0])} (todos los polos a la derecha de la región: señal anticausal)`];
    for (let i = 0; i + 1 < rs.length; i++) ops.push(`${cad(rs[i])} < |z| < ${cad(rs[i + 1])} (señal bilateral)`);
    ops.push(`|z| > ${cad(rs[rs.length - 1])} (señal causal)`);
    return { rs, ops };
  }
  function opcionesRoc(sc) {
    try {
      const aa = lista(sc.a, 'coeficientes del denominador'); if (Math.abs(aa[0]) < 1e-14) return ['|z| > polo de mayor módulo (señal causal)'];
      const a = aa.map((x) => x / aa[0]); while (a.length > 1 && Math.abs(a[a.length - 1]) < 1e-14) a.pop();
      return regiones(raicesZ(a, a.length - 1)).ops;
    } catch (e) { return ['|z| > polo de mayor módulo (señal causal)']; }
  }
  function inversa(sc) {
    const bb = lista(sc.b, 'coeficientes del numerador'), aa = lista(sc.a, 'coeficientes del denominador');
    if (bb.length > 12 || aa.length > 12) throw new Error('Como mucho 12 coeficientes');
    if (!aa.length || Math.abs(aa[0]) < 1e-14) throw new Error('El primer coeficiente del denominador (a₀) no puede ser 0');
    if (bb.every((x) => Math.abs(x) < 1e-14)) throw new Error('El numerador no puede ser todo ceros: X(z) = 0 y x[n] = 0');
    const Nn = lee(sc, 'Nn', 'el número de términos', { min: 2, max: 64, entero: true, def: 10 });
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
      if (!sol) throw new Error('No se pudo descomponer en fracciones simples (polos demasiado próximos entre sí)');
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
    pasos.push({ t: 'Transformada a invertir', html: `$X(z) = ${frac(num, den)}$ con la región de convergencia (RDC) <b>${ops[idx]}</b>. La RDC decide cómo se vuelve al tiempo: la misma $X(z)$ da señales distintas en regiones distintas.` });
    if (!polos.length) pasos.push({ t: 'Sin polos', html: `$X(z)$ es un polinomio en $z^{-1}$: cada término $c_k z^{-k}$ es un impulso $c_k·δ[n−k]$, así que $x[n]$ es una secuencia finita: ${b.map((c, k) => `$x[${k}] = ${f(c)}$`).join(', ')}. Converge en todo el plano salvo en $z = 0$ (y $z = ∞$ si hay retardos).` });
    else {
      pasos.push({ t: 'Polos y regiones posibles', html: `Polos (raíces de $A$): $${conjuntos(polos)}$. Hay ${ops.length} ${ops.length === 1 ? 'región' : 'regiones'} de convergencia posible${ops.length === 1 ? '' : 's'}, separadas por los módulos de los polos: ${ops.map((o, i) => `${i === idx ? '<b>' : ''}${o}${i === idx ? '</b>' : ''}`).join('; ')}.` });
      const polyTxt = npoly ? `${Q.map((c, j) => (Math.abs(c) < 1e-12 ? '' : `${f(c)}·z^{-${j}}`)).filter(Boolean).join(' + ') || '0'} + ` : '';
      const fr = R.map((c) => { const p = polos[c.i].p; return `${fc(c.R)}/(1 − (${fc(p)}) z^{-1})${c.k > 1 ? '^' + c.k : ''}`; }).join(' + ');
      pasos.push({ t: 'Fracciones parciales', html: `Se descompone $X(z) = ${npoly ? 'Q(z^{-1}) + ' : ''}Σ_i Σ_k R_{ik}/(1 − p_i z^{-1})^k$ (con un polinomio $Q$ solo si el numerador tiene más grado que el denominador). Los coeficientes salen de igualar con el desarrollo en serie (la división larga): $X(z) = ${polyTxt}${fr}$.` });
      const izq = polos.filter((_, i) => !causal(i)), der = polos.filter((_, i) => causal(i));
      pasos.push({ t: 'Qué pares de transformadas se usan', html: `Con polos <b>dentro</b> de la RDC (señal del lado derecho): $p^n u[n] ↔ 1/(1 − p z^{-1})$ y $C(n+k−1, k−1)·p^n u[n] ↔ 1/(1 − p z^{-1})^k$. Con polos <b>fuera</b> (lado izquierdo): $−p^n u[−n−1] ↔ 1/(1 − p z^{-1})$ y, en general, $−C(n+k−1, k−1)·p^n u[−n−1]$. Aquí ${der.length ? `derecha: $${conjuntos(der)}$` : 'ningún polo del lado derecho'}; ${izq.length ? `izquierda: $${conjuntos(izq)}$` : 'ningún polo del lado izquierdo'}.` });
      const trozos = [], coef = (v) => (Math.abs(v - 1) < 1e-12 ? '' : Math.abs(v + 1) < 1e-12 ? '−' : f(v) + '·');
      Q.forEach((c, j) => { if (Math.abs(c) > 1e-12) trozos.push(`${f(c)}·δ[n${j ? '−' + j : ''}]`); });
      const u = (i) => (causal(i) ? 'u[n]' : 'u[−n−1]');
      for (const c of R) {
        const i = c.i, p = polos[i].p, sg = causal(i) ? 1 : -1, bin = c.k === 1 ? '' : c.k === 2 ? '(n+1)·' : `C(n+${c.k - 1}, ${c.k - 1})·`;
        if (Math.abs(p[1]) < 1e-9) trozos.push(`${coef(sg * c.R[0])}${bin}(${fc(p)})^n·${u(i)}`);
        else if (p[1] > 0) trozos.push(`${coef(sg * 2 * cabs(c.R))}${bin}${f(cabs(p), 5)}^n·cos(${f(carg(p), 5)}·n ${carg(c.R) < 0 ? '−' : '+'} ${f(Math.abs(carg(c.R)), 5)})·${u(i)}`);
      }
      pasos.push({ t: 'Resultado x[n]', html: `$x[n] = ${trozos.join(' + ').replace(/\+ −/g, '− ') || '0'}$` });
    }
    const quien = lado === 'causal' ? 'Como la señal es causal (RDC hacia fuera del polo mayor), $x[n] = 0$ para $n < 0$.' : lado === 'anticausal' ? 'Como la señal es anticausal (RDC hacia dentro del polo menor), $x[n] = 0$ para $n ≥ 1$ salvo los impulsos del cociente.' : lado === 'bilateral' ? 'La señal es bilateral: los polos de dentro aportan la parte causal y los de fuera la anticausal.' : 'La señal es finita.';
    pasos.push({ t: 'Primeros términos', html: `${quien} Valores de $x[n]$ para $n = ${n0}, …, ${n1}$: $${ns.map((n, i) => `x[${n}] = ${f(xs[i], 5)}`).slice(0, 14).join(';  ')}${ns.length > 14 ? ';  …' : ''}$` });
    if (lado === 'causal' || (lado === 'finita')) pasos.push({ t: 'Comprobación por división larga', html: `Dividiendo $B(z^{-1})$ entre $A(z^{-1})$ en potencias de $z^{-1}$ (la recursión $x[n] = b_n − Σ a_k x[n−k]$) salen $${xc.slice(0, 8).map((x) => f(x, 5)).join(';  ')}$: son los mismos coeficientes.` });
    pasos.push({ t: 'Estabilidad y transformada de Fourier', html: contieneCirc ? 'La RDC <b>contiene la circunferencia unidad</b>: $x[n]$ es absolutamente sumable y existe su transformada de Fourier $X(e^{jω})$. Si $x[n]$ es la respuesta al impulso de un sistema, éste es estable.' : 'La RDC <b>no contiene la circunferencia unidad</b>: $x[n]$ no es absolutamente sumable (crece o no se amortigua) y no existe $X(e^{jω})$; si fuera la respuesta de un sistema, éste sería inestable.' });
    const ceros = Mb ? raicesZ(b, Math.max(Ma, Mb)) : [];
    return { modo: 'inversa', b, a, M: Math.max(Ma, Mb), polos, ceros, lado, roc: ops[idx], rocOps: ops, rocIdx: idx, rocRango: [lo, hi], contieneCirc, R, Q, valor, ns, xs, xc, rmax: Math.max(0, ...polos.map((r) => cabs(r.p))), estab: contieneCirc ? 'estable' : 'inestable', pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'fft') return resolverFFT(sc);
    if (sc.modo === 'inversa') return inversa(sc);
    if (sc.modo === 'directa') return directa(sc);
    const b = lista(sc.b, 'coeficientes del numerador'), a = lista(sc.a, 'coeficientes del denominador');
    if (b.length > 12 || a.length > 12) throw new Error('Como mucho 12 coeficientes');
    const Nn = lee(sc, 'Nn', 'el número de términos', { min: 2, max: 64, entero: true, def: 12 });
    const S = analiza(b, a, { Nn });
    return { modo: 'sistema', ...S, pasos: pasosAnalisis(S) };
  }

  const ejemplos = [
    { clave: 'paso-bajo', nombre: 'Sistema de 1.er orden: y[n] = x[n] + 0,5·y[n−1]', sc: { modo: 'sistema', b: '1', a: '1 -0,5', Nn: '12' } },
    { clave: 'resonador', nombre: 'Sistema de 2.º orden con polos complejos', sc: { modo: 'sistema', b: '1', a: '1 -1,2 0,72', Nn: '16' } },
    { clave: 'inestable', nombre: 'Sistema inestable (un polo en z = 2)', sc: { modo: 'sistema', b: '1', a: '1 -2,5 1', Nn: '12' } },
    { clave: 'media-movil', nombre: 'Media móvil de 4 muestras (FIR)', sc: { modo: 'sistema', b: '0,25 0,25 0,25 0,25', a: '1', Nn: '10' } },
    { clave: 'exp', nombre: 'Transformada de aⁿ·u[n] con a = 0,8', sc: { modo: 'directa', tipo: 'exp', a: '0,8', Nn: '12' } },
    { clave: 'coseno', nombre: 'Transformada de 0,9ⁿ·cos(πn/4)·u[n]', sc: { modo: 'directa', tipo: 'coseno', a: '0,9', w: 'π/4', Nn: '16' } },
    { clave: 'inversa-causal', nombre: 'Inversa: X(z) = 1/((1 − 0,5z⁻¹)(1 − 0,25z⁻¹)), causal', sc: { modo: 'inversa', b: '1', a: '1 -0,75 0,125', roc: '2', Nn: '10' } },
    { clave: 'inversa-bilateral', nombre: 'Inversa bilateral: polos 0,5 y 2, RDC entre ambos', sc: { modo: 'inversa', b: '1', a: '1 -2,5 1', roc: '1', Nn: '12' } },
    { clave: 'inversa-doble', nombre: 'Inversa con polo doble: 1/(1 − 0,5z⁻¹)²', sc: { modo: 'inversa', b: '1', a: '1 -1 0,25', roc: '1', Nn: '10' } },
    { clave: 'dos-tonos', nombre: 'FFT de dos tonos (50 Hz y 120 Hz)', sc: { modo: 'fft', senal: 'tonos', fs: '640', N: '64', a1: '1', f1: '50', a2: '0,5', f2: '120', a3: '', f3: '', dc: '', ventana: 'rect' } },
    { clave: 'fugas', nombre: 'Fuga espectral: 55 Hz entre dos bins', sc: { modo: 'fft', senal: 'tonos', fs: '640', N: '64', a1: '1', f1: '55', a2: '', f2: '', a3: '', f3: '', dc: '', ventana: 'hann' } },
    { clave: 'aliasing', nombre: 'Aliasing: 130 Hz muestreado a 100 Hz', sc: { modo: 'fft', senal: 'tonos', fs: '100', N: '32', a1: '1', f1: '130', a2: '', f2: '', a3: '', f3: '', dc: '', ventana: 'rect' } },
    { clave: 'muestras', nombre: 'DFT de las muestras 1, 2, 3, 4', sc: { modo: 'fft', senal: 'muestras', fs: '4', x: '1 2 3 4', ventana: 'rect' } },
  ];

  return { resolver, ejemplos, f, fc, fft, dft, raices, analiza, leeNum, opcionesRoc, VENTANAS, TIPOS_DIRECTA, cabs, carg };
})();

