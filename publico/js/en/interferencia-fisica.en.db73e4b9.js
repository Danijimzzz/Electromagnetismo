const Interferencia = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, entero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} must be a number`);
    if (!signo && v <= 0) throw new Error(`${may(nom)} must be greater than 0`);
    if (entero && !Number.isInteger(v)) throw new Error(`${may(nom)} must be an integer`);
    return v;
  }
  const grados = (r) => (r * 180) / Math.PI;
  const sinc2 = (b) => (Math.abs(b) < 1e-9 ? 1 : (Math.sin(b) / b) ** 2);
  function color(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else if (nm <= 780) r = 1;
    const k = nm < 380 || nm > 780 ? 0 : nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1;
    if (nm < 380 || nm > 780) return [150, 150, 150];
    return [r, g, b].map((c) => Math.round(255 * (c * k) ** 0.8));
  }
  const nombreColor = (nm) => (nm < 380 ? 'ultravioleta' : nm < 450 ? 'violeta' : nm < 495 ? 'azul' : nm < 570 ? 'verde' : nm < 590 ? 'amarillo' : nm < 620 ? 'naranja' : nm <= 750 ? 'rojo' : 'infrarrojo');
  const G = (x, d) => `{${f(x, d)}}`;
  const J1 = (x) => { let s = 0; const N = 64; for (let k = 0; k < N; k++) { const t = ((k + 0.5) * Math.PI) / N; s += Math.cos(t - x * Math.sin(t)); } return s / N; };
  const airy = (u) => (Math.abs(u) < 1e-6 ? 1 : ((2 * J1(u)) / u) ** 2);
  const ord = (m) => (m === 0 ? 'central' : `of order ${m}`);

  function young(sc) {
    const l0 = lee(sc, 'lambda', 'the wavelength λ'), d = lee(sc, 'd', 'the slit separation d') * 1e-3, L = lee(sc, 'L', 'the distance to the screen L');
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'the index of the medium n'), lam = (l0 * 1e-9) / n, a = lee(sc, 'a', 'the width of each slit a', { opcional: true });
    const aa = a === null ? null : a * 1e-3, pasos = [];
    if (aa !== null && aa >= d) throw new Error('The width of each slit must be smaller than the separation between them');
    const dy = (lam * L) / d, mmax = Math.floor(d / lam - 1e-12);
    pasos.push({ t: 'Data', html: `$λ = ${f(l0)}$ nm${n !== 1 ? `, in a medium of index $n = ${f(n)}$: $λ_n = λ/n = ${f(lam * 1e9)}$ nm` : ''} (${nombreColor(l0)}), $d = ${f(d * 1e3)}$ mm, $L = ${f(L)}$ m${aa !== null ? `, slit width $a = ${f(a)}$ mm` : ''}` });
    pasos.push({ t: 'Interference condition', html: `The path difference from the two slits to a point on the screen is $Δ = d sin θ$. There is a maximum (bright fringe) when $Δ = mλ$ and a minimum (dark fringe) when $Δ = (m + ½)λ$, with m = 0, ±1, ±2…<br>For small angles $sin θ ≈ tan θ = y/L$, so the maxima are at $y_m = mλL/d$.` });
    pasos.push({ t: 'Fringe spacing', html: `Distance between two consecutive bright (or dark) fringes: $Δy = λL/d = {${f(lam)} · ${f(L)}}/${G(d)}$ = <b>${f(dy * 1e3)} mm</b>` });
    const m = lee(sc, 'm', 'the order m', { opcional: true, signo: true, entero: true });
    let ym = null, th = null;
    if (m !== null) {
      if (Math.abs(m) > mmax) throw new Error(`There is no maximum of order ${m}: at most m = ${mmax} (sin θ = mλ/d cannot exceed 1)`);
      th = Math.asin((m * lam) / d); ym = L * Math.tan(th);
      pasos.push({ t: `Maximum ${ord(m)}`, html: `$sen θ_{${m}} = mλ/d = {${m} · ${f(lam)}}/${G(d)} = ${f(Math.sin(th))}$ ⇒ θ = <b>${f(grados(th))}°</b><br>$y_{${m}} = L tan θ$ = <b>${f(ym * 1e3)} mm</b>${Math.abs(th) < 0.1 ? ` (with the approximation, $m Δy = ${f(m * dy * 1e3)}$ mm)` : ''}<br>The next minimum is at $y = {(m + ½)λL}/d = ${f((m + 0.5) * dy * 1e3)}$ mm.` });
    }
    const y = lee(sc, 'y', 'the position y on the screen', { opcional: true, signo: true });
    let Iy = null;
    if (y !== null) {
      const yy = y * 1e-3, s = yy / Math.hypot(yy, L), delta = (2 * Math.PI * d * s) / lam, beta = aa !== null ? (Math.PI * aa * s) / lam : 0;
      Iy = Math.cos(delta / 2) ** 2 * sinc2(beta);
      pasos.push({ t: `Intensity at y = ${f(y)} mm`, html: `Path difference $Δ = d sin θ = ${f(d * s * 1e9)}$ nm $= ${f((d * s) / lam)} λ$, phase difference $δ = 2πΔ/λ = ${f(delta)}$ rad<br>$I/I_{"máx"} = cos^2(δ/2)${aa !== null ? ' · (sin β/β)^2' : ''}$ = <b>${f(Iy)}</b>${Iy > 0.95 ? ' (bright fringe)' : Iy < 0.05 ? ' (dark fringe)' : ''}` });
    }
    let h = `The maximum order seen is $m_{"max"} = ⌊d/λ⌋$ = <b>${mmax}</b> (${2 * mmax + 1} maxima in total if the screen were infinite).`;
    if (aa !== null) {
      const ya = (lam * L) / aa, perd = [], q = d / aa, nc = Math.abs(q - Math.round(q)) < 1e-6 ? 2 * Math.round(q) - 1 : 2 * Math.floor(q) + 1;
      for (let k = 1; k * aa < d * 1.0000001 && k < 50; k++) if (Math.abs(((k * d) / aa) - Math.round((k * d) / aa)) < 1e-6) perd.push(Math.round((k * d) / aa));
      h += `<br>Each slit diffracts: the envelope has its first minimum at $a sin θ = λ$, $y = λL/a = ${f(ya * 1e3)}$ mm, so inside the central diffraction maximum there are <b>${nc} bright fringes</b> ($d/a = ${f(d / aa)}$).${perd.length ? ` Orders ${perd.map((q) => `±${q}`).join(', ')} are missing, because they fall exactly on a diffraction minimum.` : ''}`;
    }
    pasos.push({ t: 'How many fringes', html: h });
    return { modo: 'young', l0, lam, d, L, n, a: aa, dy, mmax, m, th, ym, y, Iy, I: (yy) => { const s = yy / Math.hypot(yy, L); return Math.cos((Math.PI * d * s) / lam) ** 2 * (aa !== null ? sinc2((Math.PI * aa * s) / lam) : 1); }, ancho: aa !== null ? (2 * lam * L) / aa * 1.3 : 10 * dy, pasos };
  }

  function rendija(sc) {
    const l0 = lee(sc, 'lambda', 'the wavelength λ'), a = lee(sc, 'a', 'the width of the slit a') * 1e-3, L = lee(sc, 'L', 'the distance to the screen L');
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'the index of the medium n'), lam = (l0 * 1e-9) / n, pasos = [];
    pasos.push({ t: 'Data', html: `$λ = ${f(l0)}$ nm${n !== 1 ? ` (in the medium $λ/n = ${f(lam * 1e9)}$ nm)` : ''}, $a = ${f(a * 1e3)}$ mm, $L = ${f(L)}$ m` });
    pasos.push({ t: 'Diffraction minima', html: `Dividing the slit into two halves, the light from each point in one half cancels with that from the corresponding point in the other when $a sin θ = mλ$, with m = ±1, ±2… (m = 0 is the central maximum, not a minimum).` });
    const m = vacio(sc.m) ? 1 : lee(sc, 'm', 'the order m', { entero: true });
    if (m * lam > a) throw new Error(`There is no minimum of order ${m}: a sin θ = mλ requires sin θ = ${f((m * lam) / a)} > 1`);
    const th = Math.asin((m * lam) / a), ym = L * Math.tan(th), th1 = Math.asin(Math.min(1, lam / a)), ancho = 2 * L * Math.tan(th1);
    pasos.push({ t: `Minimum of order ${m}`, html: `$sin θ_{${m}} = mλ/a = {${m} · ${f(lam)}}/${G(a)} = ${f(Math.sin(th))}$ ⇒ θ = <b>${f(grados(th))}°</b>, $y_{${m}} = L tan θ$ = <b>${f(ym * 1e3)} mm</b>` });
    pasos.push({ t: 'Width of the central maximum', html: `It goes from minimum −1 to +1: $2L tan θ_1 ≈ 2λL/a$ = <b>${f(ancho * 1e3)} mm</b>. The secondary maxima are half as wide and much weaker (the first has 4.7% of the central intensity). The narrower the slit, the more the light spreads.` });
    const y = lee(sc, 'y', 'the position y', { opcional: true, signo: true });
    let Iy = null;
    if (y !== null) { const s = (y * 1e-3) / Math.hypot(y * 1e-3, L), b = (Math.PI * a * s) / lam; Iy = sinc2(b); pasos.push({ t: `Intensity at y = ${f(y)} mm`, html: `$β = πa sin θ/λ = ${f(b)}$ rad ⇒ $I/I_0 = (sin β/β)^2$ = <b>${f(Iy)}</b>` }); }
    return { modo: 'rendija', l0, lam, a, L, n, m, th, ym, ancho, y, Iy, I: (yy) => sinc2((Math.PI * a * (yy / Math.hypot(yy, L))) / lam), anchoV: Math.min(3.2 * ancho, 4 * L), pasos };
  }

  function circular(sc) {
    const l0 = lee(sc, 'lambda', 'the wavelength λ'), D = lee(sc, 'D', 'the aperture diameter D') * 1e-3;
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'the index of the medium n'), lam = (l0 * 1e-9) / n, pasos = [];
    const L = lee(sc, 'L', 'the distance to the screen L', { opcional: true }), dist = lee(sc, 'dist', 'the distance to the objects', { opcional: true }), sep = lee(sc, 'sep', 'the separation of the objects', { opcional: true });
    if (1.22 * lam >= D) throw new Error('The aperture is smaller than the wavelength: there is no Airy disc (1.22 λ/D > 1)');
    const thR = Math.asin((1.22 * lam) / D);
    pasos.push({ t: 'Airy disc', html: `A circular aperture of diameter D diffracts light into a bright central disc surrounded by rings. The first minimum is at $sin θ = 1.22 λ/D = {1.22 · ${f(lam)}}/${G(D)} = ${f(Math.sin(thR))}$ ⇒ θ = <b>${f(thR)} rad</b> (${f(grados(thR))}°)${n !== 1 ? `, with $λ/n = ${f(lam * 1e9)}$ nm inside the medium` : ''}.` });
    let r = null;
    if (L !== null) { r = L * Math.tan(thR); pasos.push({ t: 'Size of the disc', html: `On a screen (or in the focal plane) at $L = ${f(L)}$ m, the radius of the central disc is $r = L tan θ ≈ 1.22 λL/D$ = <b>${f(r * 1e3)} mm</b>.` }); }
    pasos.push({ t: 'Rayleigh criterion', html: `Two points can be distinguished if the maximum of one falls at least on the first minimum of the other: the minimum angular separation is $θ_{"min"} ≈ 1.22 λ/D$ = <b>${f(thR)} rad</b>. It is the resolution limit of the instrument: the larger the diameter and the shorter the wavelength, the more detail can be seen.` });
    let smin = null, res = null, thS = null;
    if (dist !== null) {
      smin = dist * thR;
      pasos.push({ t: `Objects at ${f(dist)} m`, html: `The minimum separation that can be distinguished is $s_{"min"} = θ_{"min"} · d = ${f(thR)} · ${f(dist)}$ = <b>${f(smin * 1e3)} mm</b>${smin > 1 ? ` (${f(smin / 1e3)} km)` : ''}.` });
      if (sep !== null) { thS = (sep * 1e-3) / dist; res = thS >= thR; pasos.push({ t: 'Resolved?', html: `The two objects are seen at an angle $θ = s/d = ${f(sep * 1e-3)}/${f(dist)} = ${f(thS)}$ rad, ${res ? 'greater' : 'smaller'} than $θ_{"min"}$: <b>${res ? 'they can be distinguished' : 'they cannot be distinguished'}</b>${res ? '' : ', they look like a single point'}.` }); }
    }
    const esc = L ?? 1, k = (Math.PI * D) / lam, s2 = thS !== null ? thS / 2 : null;
    const un = (y) => airy(k * Math.sin(Math.atan(y / esc)));
    const dos = s2 === null ? null : (y) => (airy(k * Math.sin(Math.atan(y / esc) - s2)) + airy(k * Math.sin(Math.atan(y / esc) + s2)));
    let norma = 1;
    if (dos) { norma = 0; for (let i = 0; i <= 400; i++) norma = Math.max(norma, dos(((i / 400) - 0.5) * 2 * esc * Math.tan(thR + 2 * s2))); }
    const ancho = 2 * esc * Math.tan(Math.min(1.4, 2.6 * thR + (s2 ?? 0) * 2));
    return { modo: 'circular', l0, lam, D, n, L, dist, sep, thR, r, smin, thS, res, eje: L !== null ? 'y (mm)' : 'θ (mrad)', I: dos ? (y) => dos(y) / norma : un, Iuno: un, s2, ancho, ym: null, y: null, pasos };
  }

  function red(sc) {
    const l0 = lee(sc, 'lambda', 'the wavelength λ'), N = lee(sc, 'N', 'the number of lines per mm'), d = 1e-3 / N, lam = l0 * 1e-9, pasos = [];
    const L = lee(sc, 'L', 'the distance to the screen L', { opcional: true }), l2 = lee(sc, 'lambda2', 'the second wavelength', { opcional: true }), W = lee(sc, 'W', 'the illuminated width', { opcional: true });
    pasos.push({ t: 'Grating spacing', html: `With ${f(N)} lines per mm, the distance between slits is $d = 1/N = ${f(d * 1e3)}$ mm $= ${f(d * 1e9)}$ nm` });
    const mmax = Math.floor(d / lam - 1e-12);
    if (mmax < 1) throw new Error('With this grating and this λ there is not even a first order (λ > d)');
    const ords = [];
    for (let m = 1; m <= mmax; m++) { const th = Math.asin((m * lam) / d); ords.push({ m, th, y: L !== null && th < 1.5 ? L * Math.tan(th) : null }); }
    pasos.push({ t: 'Grating equation', html: `The slits interfere constructively when $d sin θ = mλ$. With many slits the maxima are very sharp and bright.<br>${ords.map((o) => `m = ${o.m}: $sen θ = ${f((o.m * lam) / d)}$ ⇒ θ = <b>${f(grados(o.th))}°</b>${o.y !== null ? `, $y = L tan θ = ${f(o.y * 100)}$ cm` : ''}`).join('<br>')}` });
    pasos.push({ t: 'Maximum order', html: `$sin θ ≤ 1$ ⇒ $m ≤ d/λ = ${f(d / lam)}$ ⇒ <b>m<sub>max</sub> = ${mmax}</b>, so ${2 * mmax + 1} maxima are seen, counting the central one.` });
    let sep = null, R = null, dlmin = null;
    if (W !== null) {
      const Nt = W * N; R = Nt * mmax; dlmin = l0 / Nt;
      pasos.push({ t: 'Resolving power (Rayleigh)', html: `With $N = ${f(Nt)}$ illuminated slits, each maximum is so sharp that two wavelengths are separated if $λ/Δλ ≤ R = mN$. In first order $R = ${f(Nt)}$ and $Δλ_{"min"} = λ/(mN) = ${f(l0)}/${G(Nt)}$ = <b>${f(dlmin, 3)} nm</b> can be distinguished; in order ${mmax}, $R = ${f(R)}$ and $Δλ_{"min"} = ${f(l0 / R, 3)}$ nm.` });
    }
    if (l2 !== null) {
      const t1 = Math.asin(lam / d), t2 = (l2 * 1e-9) / d <= 1 ? Math.asin((l2 * 1e-9) / d) : NaN;
      sep = grados(t2 - t1);
      let h = `In first order, $λ_2 = ${f(l2)}$ nm comes out at θ = ${isFinite(t2) ? `${f(grados(t2))}°` : 'none'}: angular separation $Δθ$ = <b>${f(Math.abs(sep))}°</b>${L !== null && isFinite(t2) ? `, on the screen ${f(Math.abs(L * (Math.tan(t2) - Math.tan(t1))) * 1000)} mm` : ''}.`;
      if (W !== null) { const Nt = W * N, dl = Math.abs(l2 - l0), lm = (l0 + l2) / 2; h += `<br>To separate them in first order you need $λ/Δλ = ${f(lm)}/${G(dl)} = ${f(lm / dl)}$ and the grating gives $R = ${f(Nt)}$: ${Nt >= lm / dl ? '<b>they are resolved</b>' : '<b>they are not resolved</b>'}.`; }
      pasos.push({ t: 'Two wavelengths', html: h });
    }
    return { modo: 'red', l0, lam, N, d, L, mmax, ords, l2, sep, R, dlmin, W, pasos };
  }

  function lamina(sc) {
    const nf = lee(sc, 'nl', 'the index of the film n'), n1 = vacio(sc.n1) ? 1 : lee(sc, 'n1', 'the index of the upper medium'), n2 = vacio(sc.n2) ? 1 : lee(sc, 'n2', 'the index of the lower medium'), pasos = [];
    const salto1 = nf > n1, salto2 = n2 > nf, medio = salto1 !== salto2;
    pasos.push({ t: 'Phase changes on reflection', html: `A wave reflected at a medium of higher index changes phase by π (like half a wavelength); if it is of lower index, it does not.<br>Top (${f(n1)} → ${f(nf)}): ${salto1 ? 'changes by π' : 'no change'}. &ensp; Bottom (${f(nf)} → ${f(n2)}): ${salto2 ? 'changes by π' : 'no change'}.<br>${medio ? 'Only one of the two changes: there is an extra phase difference of half a wavelength.' : 'Both the same: there is no extra phase difference.'}` });
    const condC = medio ? '$2nt = (m + ½)λ$' : '$2nt = mλ$', condD = medio ? '$2nt = mλ$' : '$2nt = (m + ½)λ$';
    pasos.push({ t: 'Condition', html: `The ray entering the film travels 2t extra, an optical path 2nt. In reflection:<br>reinforcement (looks bright): ${condC}; &ensp; cancellation: ${condD}, with m = ${medio ? '0, 1, 2…' : '1, 2, 3…'}` });
    const t = lee(sc, 't', 'the thickness t', { opcional: true }), l0 = lee(sc, 'lambda', 'the wavelength λ', { opcional: true });
    let refuerzan = [], anulan = [], tmin = null, tmin2 = null;
    if (t !== null) {
      const op = 2 * nf * t;
      for (let m = 0; m < 200; m++) { const lc = op / (medio ? m + 0.5 : m), ld = op / (medio ? m : m + 0.5); if (isFinite(lc) && lc >= 380 && lc <= 750) refuerzan.push(lc); if (isFinite(ld) && ld > 0 && ld >= 380 && ld <= 750) anulan.push(ld); }
      pasos.push({ t: `With t = ${f(t)} nm`, html: `Extra optical path $2nt = 2 · ${f(nf)} · ${f(t)} = ${f(op)}$ nm<br>Reinforced in the visible: ${refuerzan.length ? refuerzan.map((l) => `<b>${f(l)} nm</b> (${nombreColor(l)})`).join(', ') : 'none'}<br>Cancelled: ${anulan.length ? anulan.map((l) => `${f(l)} nm (${nombreColor(l)})`).join(', ') : 'none'}${t < 30 ? '<br>With such a small thickness compared with λ, the film looks dark in reflection if there is an extra phase difference (like the top of a soap bubble about to burst).' : ''}` });
    }
    if (l0 !== null) {
      tmin = medio ? l0 / (4 * nf) : l0 / (2 * nf); tmin2 = medio ? l0 / (2 * nf) : l0 / (4 * nf);
      pasos.push({ t: `Thicknesses for λ = ${f(l0)} nm`, html: `Minimum thickness with reinforcement: $t = ${medio ? 'λ/(4n)' : 'λ/(2n)'}$ = <b>${f(tmin)} nm</b><br>Minimum thickness that cancels the reflection (anti-reflective): $t = ${medio ? 'λ/(2n)' : 'λ/(4n)'}$ = <b>${f(tmin2)} nm</b>${!medio && n1 < nf && nf < n2 ? `<br>To cancel it completely, $n = √(n_1 n_2) = ${f(Math.sqrt(n1 * n2))}$ equalizes the two reflections.` : ''}` });
    }
    if (t === null && l0 === null) throw new Error('Give the thickness t, the wavelength λ or both');
    return { modo: 'lamina', nf, n1, n2, medio, t, l0, refuerzan, anulan, tmin, tmin2, pasos, R: (lnm, tt = t) => { const d = (2 * Math.PI * 2 * nf * tt) / lnm + (medio ? Math.PI : 0); return Math.cos(d / 2) ** 2; } };
  }

  function cuna(sc) {
    const l0 = lee(sc, 'lambda', 'the wavelength λ'), Lc = lee(sc, 'Lc', 'the length of the plates') * 1e-2;
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'the index of what is in the wedge'), lam = l0 * 1e-9, pasos = [];
    const h0 = lee(sc, 'h', 'the thickness of the spacer', { opcional: true }), dx0 = lee(sc, 'dx', 'the measured fringe spacing', { opcional: true });
    if (h0 === null && dx0 === null) throw new Error('Give the spacer thickness h or the measured fringe spacing');
    pasos.push({ t: 'Why fringes appear', html: `The light is reflected at the top and bottom of the ${n === 1 ? 'air' : `index ${f(n)}`} layer; the reflection at the bottom changes phase by π, so at a distance x from the contact, with thickness $t = αx$, there is a dark fringe if $2nt = mλ$ and a bright one if $2nt = (m + ½)λ$. Right at the contact (t = 0) the fringe is dark.` });
    let h, dx;
    if (h0 !== null) {
      h = h0 * 1e-6; dx = (lam * Lc) / (2 * n * h);
      pasos.push({ t: 'Fringe spacing', html: `The wedge angle is $α ≈ h/L = ${f(h)}/${f(Lc)} = ${f(h / Lc)}$ rad. Between two dark fringes the thickness grows by λ/(2n): $Δx = λ/(2nα) = λL/(2nh) = {${f(lam)} · ${f(Lc)}}/{2 · ${f(n)} · ${f(h)}}$ = <b>${f(dx * 1e3)} mm</b>` });
    } else {
      dx = dx0 * 1e-3; h = (lam * Lc) / (2 * n * dx);
      pasos.push({ t: 'Thickness from the fringes', html: `From $Δx = λL/(2nh)$ we get $h = λL/(2nΔx) = {${f(lam)} · ${f(Lc)}}/{2 · ${f(n)} · ${f(dx)}}$ = <b>${f(h * 1e6)} µm</b>. This is how the thickness of a hair or a sheet of paper is measured.` });
    }
    const N = Math.floor((2 * n * h) / lam + 1e-9) + 1;
    pasos.push({ t: 'How many fringes', html: `At the end $2nh/λ = ${f((2 * n * h) / lam)}$, so <b>${N} dark fringes</b> are seen counting the one at the contact (one every ${f(dx * 1e3)} mm).` });
    const alfa = h / Lc;
    return { modo: 'cuna', l0, lam, Lc, n, h, dx, N, alfa, eje: 'x (mm)', desde0: true, I: (x) => Math.sin((2 * Math.PI * n * alfa * Math.max(0, x)) / lam) ** 2, ancho: Math.min(Lc, 12 * dx), ym: null, y: null, pasos };
  }

  function anillos(sc) {
    const l0 = lee(sc, 'lambda', 'the wavelength λ'), lam = l0 * 1e-9, n = vacio(sc.n) ? 1 : lee(sc, 'n', 'the index of what is between the lens and the glass');
    const m = vacio(sc.m) ? 5 : lee(sc, 'm', 'the number of the ring m', { entero: true });
    const R0 = lee(sc, 'R', 'the radius of curvature of the lens', { opcional: true }), rm0 = lee(sc, 'rm', 'the measured radius of the ring', { opcional: true }), pasos = [];
    if (R0 === null && rm0 === null) throw new Error('Give the radius of curvature R or the measured radius of a ring');
    pasos.push({ t: 'Thickness of the layer', html: `Between the lens and the glass there is a layer of ${n === 1 ? 'air' : `index ${f(n)}`} which at a distance r from the centre measures $t ≈ r^2/(2R)$. As in the wedge, the reflection at the bottom changes phase by π: dark ring if $2nt = mλ$ and bright if $2nt = (m + ½)λ$. The centre is dark.` });
    let R;
    if (R0 !== null) R = R0;
    else { const rm = rm0 * 1e-3; R = (n * rm * rm) / (m * lam); pasos.push({ t: 'Radius of curvature', html: `From $r_m^2 = mλR/n$ we get $R = n r_m^2/(mλ) = {${f(n)} · (${f(rm)})^2}/{${m} · ${f(lam)}}$ = <b>${f(R)} m</b>` }); }
    const ro = Math.sqrt((m * lam * R) / n), rb = Math.sqrt(((m - 0.5) * lam * R) / n);
    pasos.push({ t: `Ring ${m}`, html: `Dark: $r_m = √(mλR/n) = √({${m} · ${f(lam)} · ${f(R)}}/${G(n)})$ = <b>${f(ro * 1e3)} mm</b><br>The bright one before: $r = √({(m − ½)λR}/n)$ = <b>${f(rb * 1e3)} mm</b><br>The rings get closer together towards the outside because the radius grows as $√m$.` });
    return { modo: 'anillos', l0, lam, n, m, R, ro, rb, eje: 'r (mm)', I: (r) => Math.sin((Math.PI * n * r * r) / (lam * R)) ** 2, ancho: 2 * Math.sqrt(((m + 3) * lam * R) / n), ym: ro, y: null, pasos };
  }

  const MODOS = { young, rendija, circular, red, lamina, cuna, anillos };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : young(sc); }

  const ejemplos = [
    { clave: 'young', nombre: 'Young with a red laser', sc: { modo: 'young', lambda: '633', d: '0,25', L: '1,5', n: '', a: '', m: '3', y: '' } },
    { clave: 'young-y', nombre: 'Intensity at a point on the screen', sc: { modo: 'young', lambda: '550', d: '0,1', L: '2', n: '', a: '', m: '', y: '5,5' } },
    { clave: 'young-a', nombre: 'Double slit with diffraction (missing orders)', sc: { modo: 'young', lambda: '600', d: '0,3', L: '1', n: '', a: '0,1', m: '1', y: '' } },
    { clave: 'young-agua', nombre: 'Young underwater', sc: { modo: 'young', lambda: '589', d: '0,2', L: '1', n: '1,33', a: '', m: '1', y: '' } },
    { clave: 'rendija', nombre: 'Single slit', sc: { modo: 'rendija', lambda: '500', a: '0,05', L: '1,2', n: '', m: '1', y: '' } },
    { clave: 'rendija-2', nombre: 'Second minimum of a narrow slit', sc: { modo: 'rendija', lambda: '633', a: '0,02', L: '2', n: '', m: '2', y: '10' } },
    { clave: 'ojo', nombre: 'Car headlights: are they seen as two or one?', sc: { modo: 'circular', lambda: '550', D: '5', L: '', dist: '10000', sep: '1400', n: '' } },
    { clave: 'telescopio', nombre: '10 cm telescope and its Airy disc', sc: { modo: 'circular', lambda: '550', D: '100', L: '1', dist: '', sep: '', n: '' } },
    { clave: 'red', nombre: '600 lines/mm grating', sc: { modo: 'red', lambda: '500', N: '600', L: '1', lambda2: '', W: '' } },
    { clave: 'sodio', nombre: 'Sodium doublet (589.0 and 589.6 nm)', sc: { modo: 'red', lambda: '589', N: '300', L: '2', lambda2: '589,6', W: '5' } },
    { clave: 'pompa', nombre: 'Soap bubble', sc: { modo: 'lamina', nl: '1,33', n1: '1', n2: '1', t: '400', lambda: '' } },
    { clave: 'antirreflejo', nombre: 'Anti-reflective coating on glasses', sc: { modo: 'lamina', nl: '1,38', n1: '1', n2: '1,52', t: '', lambda: '550' } },
    { clave: 'aceite', nombre: 'Oil slick on water', sc: { modo: 'lamina', nl: '1,45', n1: '1', n2: '1,33', t: '300', lambda: '' } },
    { clave: 'cuna', nombre: 'Air wedge with a sheet of paper as spacer', sc: { modo: 'cuna', lambda: '589', Lc: '10', h: '50', dx: '', n: '' } },
    { clave: 'pelo', nombre: 'Thickness of a hair from the fringes', sc: { modo: 'cuna', lambda: '633', Lc: '8', h: '', dx: '0,5', n: '' } },
    { clave: 'newton', nombre: 'Newton\'s rings', sc: { modo: 'anillos', lambda: '589', R: '1', m: '5', rm: '', n: '' } },
    { clave: 'newton-r', nombre: 'Radius of a lens from its rings', sc: { modo: 'anillos', lambda: '546', R: '', m: '10', rm: '2,5', n: '' } },
  ];
  return { resolver, color, nombreColor, ejemplos, f };
})();

