/* =====================================================================
   Transformada z y FFT · cálculo (sin DOM). Tres modos:
     'sistema'  H(z) = B(z⁻¹)/A(z⁻¹) con los coeficientes de la ecuación en diferencias:
                polos y ceros, estabilidad, respuesta al impulso h[n] (por recursión y,
                con polos simples, en forma cerrada) y respuesta en frecuencia H(e^{jω}).
     'directa'  x[n] → X(z) (secuencia finita, aⁿu[n], escalón, rampa o aⁿcos(Ω₀n)u[n]) con
                su región de convergencia; luego se analiza igual que un sistema.
     'fft'      señal (suma de tonos o muestras escritas) → ventana → FFT radix-2:
                espectro de amplitud, picos, resolución y recuento de operaciones.
   La interfaz está en app.js y la prueba en pruebas/herramientas/transformada-z.js.
     resolver(sc)  datos del formulario (texto) → resultados y pasos; lanza un Error
                   con un mensaje para el usuario si falta o falla algo
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     fft(re, im)   FFT radix-2 (longitud potencia de 2); dft(re, im) la definición
     raices(c)     raíces de un polinomio (coeficientes de mayor a menor grado)
   Los números complejos son [re, im]; la unidad imaginaria se escribe j.
   ===================================================================== */
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
  // acepta coma decimal, 3e8, 3·10^8 y múltiplos de π (π/4, 0,25π, 2pi/3)
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
  // números separados por espacios, «;» o saltos de línea (la coma es decimal)
  function lista(txt, nom) {
    if (vacio(txt)) throw new Error(`Faltan ${nom}`);
    const xs = String(txt).trim().split(/[\s;]+/).filter(Boolean).map(leeNum);
    if (!xs.length || xs.some((x) => !isFinite(x))) throw new Error(`Los ${nom} deben ser números separados por espacios`);
    if (xs.length > 64 && nom !== 'valores de la señal') throw new Error(`Demasiados ${nom} (como mucho 64)`);
    return xs;
  }

  /* ---------- Complejos ---------- */
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

  // raíces de c[0]·zⁿ + … + c[n] (Durand-Kerner); las repetidas se agrupan: [{ p, m }]
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
    // un par de conjugados se queda como conjugados exactos
    for (const g of gr) if (Math.abs(g.p[1]) < 1e-7) g.p = [g.p[0], 0];
    return gr.sort((u, v) => cabs(v.p) - cabs(u.p) || v.p[1] - u.p[1]);
  }
  // raíces de B(z⁻¹) = Σ b_k z⁻ᵏ vista como polinomio en z de grado M (las de z = 0 se cuentan aparte)
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

  /* ---------- Textos ---------- */
  // Σ c_k v^{-k} escrito para Mates
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

  /* ---------- Sistema H(z) = B/A ---------- */
  function analiza(bb, aa, { Nn = 16, fs = null, cerrada = true } = {}) {
    if (!aa.length || Math.abs(aa[0]) < 1e-14) throw new Error('El primer coeficiente del denominador (a₀) no puede ser 0');
    const a0 = aa[0], b = bb.map((x) => x / a0), a = aa.map((x) => x / a0);
    while (a.length > 1 && Math.abs(a[a.length - 1]) < 1e-14) a.pop();
    while (b.length > 1 && Math.abs(b[b.length - 1]) < 1e-14) b.pop();
    const M = Math.max(a.length, b.length) - 1;
    const polos = raicesZ(a, M), ceros = raicesZ(b, M);
    const rmax = Math.max(0, ...polos.map((r) => cabs(r.p)));
    const estado = rmax > 1 + 1e-6 ? 'inestable' : rmax > 1 - 1e-6 && polos.length ? 'marginal' : 'estable';
    // marginal con polo repetido sobre la circunferencia: también inestable
    const repetidoEnCirc = polos.some((r) => r.m > 1 && Math.abs(cabs(r.p) - 1) < 1e-6);
    const estab = estado === 'marginal' && repetidoEnCirc ? 'inestable' : estado;
    // respuesta al impulso por recursión: y[n] = Σ b_k x[n−k] − Σ a_k y[n−k]
    const h = [];
    for (let n = 0; n < Nn; n++) { let s = n < b.length ? b[n] : 0; for (let k = 1; k < a.length && k <= n; k++) s -= a[k] * h[n - k]; h.push(s); }
    // forma cerrada con polos simples y distintos de 0
    let cerr = null;
    const pl = lugar(polos);
    if (cerrada && b.length <= a.length && polos.length && polos.every((r) => r.m === 1 && cabs(r.p) > 1e-9) && pl.length === a.length - 1) {
      const R = pl.map((p, i) => {
        const inv = cdiv([1, 0], p);
        let den = [1, 0];
        pl.forEach((q, j) => { if (j !== i) den = cmul(den, csub([1, 0], cdiv(q, p))); });
        return cdiv(horner([...b].reverse(), inv), den);
      });
      const d = h[0] - R.reduce((s, r) => s + r[0], 0);
      cerr = { R, p: pl, d: Math.abs(d) < 1e-9 ? 0 : d, valor: (n) => (n === 0 ? cerr.d : 0) + R.reduce((s, r, i) => { const pn = [Math.pow(cabs(pl[i]), n) * Math.cos(n * carg(pl[i])), Math.pow(cabs(pl[i]), n) * Math.sin(n * carg(pl[i]))]; return s + cmul(r, pn)[0]; }, 0) };
    }
    // respuesta en frecuencia en [0, π]
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
    return { b, a, M, polos, ceros, rmax, estab, h, cerr, resp: { w, mag, fase }, H1: H1[0], Hn: Hn[0], pico: { w: w[ip], mag: mag[ip] }, fs };
  }

  // pasos del análisis (comunes a los modos «sistema» y «directa»)
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

  /* ---------- Modo «directa»: x[n] → X(z) ---------- */
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

  /* ---------- FFT ---------- */
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
    const X = fft(xw, Array(N).fill(0));
    const mod = X.re.map((r, k) => Math.hypot(r, X.im[k]));
    const H = N / 2, amp = [], frec = [];
    for (let k = 0; k <= H; k++) { amp.push((k === 0 || k === H ? 1 : 2) * mod[k] / (N * cg)); frec.push((k * fs) / N); }
    const mx = Math.max(...amp);
    // picos: máximos locales por encima del 1 % del mayor, con interpolación parabólica
    const picos = [];
    for (let k = 0; k <= H; k++) {
      if (amp[k] < 0.01 * mx || amp[k] < 1e-12) continue;
      const l = k > 0 ? amp[k - 1] : -1, r = k < H ? amp[k + 1] : -1;
      if (!(amp[k] >= l && amp[k] > r)) continue;
      const den = l - 2 * amp[k] + r, d = k > 0 && k < H && Math.abs(den) > 1e-12 ? (0.5 * (l - r)) / den : 0;
      picos.push({ k, f: ((k + d) * fs) / N, fk: frec[k], amp: amp[k] - 0.25 * (l - r) * d, ampk: amp[k], d });
    }
    picos.sort((u, v) => v.ampk - u.ampk);
    const pk = picos.slice(0, 5);
    const alias = tonos.filter((t) => t.f > fs / 2 + 1e-9).map((t) => ({ f: t.f, alias: Math.abs(t.f - fs * Math.round(t.f / fs)) }));
    const en = xw.reduce((s, v) => s + v * v, 0), enF = mod.reduce((s, v) => s + v * v, 0) / N;
    const etapas = Math.log2(N), dftMul = N * N, fftMul = (N / 2) * etapas;
    const pasos = [];
    pasos.push({ t: 'Definición (DFT)', html: `$X[k] = Σ_{n=0}^{N-1} x[n]·e^{-j2πkn/N}$, con $N = ${N}$ muestras a $f_s = ${f(fs)}$ Hz. El bin $k$ corresponde a la frecuencia $f_k = k·f_s/N$.` });
    pasos.push({ t: 'Resolución y rango', html: `Resolución en frecuencia: $Δf = f_s/N = ${f(fs)}/${N} = ${f(fs / N)}$ Hz. Duración observada: $T = N/f_s = ${f(N / fs)}$ s. Frecuencia máxima sin aliasing (Nyquist): $f_s/2 = ${f(fs / 2)}$ Hz.` });
    if (nota) pasos.push({ t: 'Relleno con ceros', html: nota });
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
    return { modo: 'fft', N, fs, x, xw, w, ventana: vent, cg, frec, amp, mod, X, pk, alias, tonos, df: fs / N, dftMul, fftMul, etapas, parseval: [en, enF], fugas, nota, pasos };
  }

  /* ---------- Entrada ---------- */
  function resolver(sc) {
    if (sc.modo === 'fft') return resolverFFT(sc);
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
    { clave: 'dos-tonos', nombre: 'FFT de dos tonos (50 Hz y 120 Hz)', sc: { modo: 'fft', senal: 'tonos', fs: '640', N: '64', a1: '1', f1: '50', a2: '0,5', f2: '120', a3: '', f3: '', dc: '', ventana: 'rect' } },
    { clave: 'fugas', nombre: 'Fuga espectral: 55 Hz entre dos bins', sc: { modo: 'fft', senal: 'tonos', fs: '640', N: '64', a1: '1', f1: '55', a2: '', f2: '', a3: '', f3: '', dc: '', ventana: 'hann' } },
    { clave: 'aliasing', nombre: 'Aliasing: 130 Hz muestreado a 100 Hz', sc: { modo: 'fft', senal: 'tonos', fs: '100', N: '32', a1: '1', f1: '130', a2: '', f2: '', a3: '', f3: '', dc: '', ventana: 'rect' } },
    { clave: 'muestras', nombre: 'DFT de las muestras 1, 2, 3, 4', sc: { modo: 'fft', senal: 'muestras', fs: '4', x: '1 2 3 4', ventana: 'rect' } },
  ];

  return { resolver, ejemplos, f, fc, fft, dft, raices, analiza, leeNum, VENTANAS, TIPOS_DIRECTA, cabs, carg };
})();
if (typeof module !== 'undefined') module.exports = TransformadaZ;
