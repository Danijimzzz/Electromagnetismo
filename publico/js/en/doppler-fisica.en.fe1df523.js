const Doppler = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const fq = (x) => f(x, Math.min(12, Math.max(4, Math.floor(Math.log10(Math.abs(x) || 1)) + 2)));
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} must be a number`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${Mayus(nom)} must be ${cero ? 'positive or zero' : 'greater than 0'}`);
    return v;
  }
  const sentido = (v, quien) => (v > 0 ? `${quien} se acerca` : v < 0 ? `${quien} se aleja` : `${quien} is at rest`);
  const tono = (fp, fr) => (fp > fr ? 'It sounds higher than the one emitted.' : fp < fr ? 'It sounds lower than the one emitted.' : 'It sounds the same as the one emitted.');

  function recta(sc) {
    const fr = lee(sc, 'f', 'the emitted frequency'), v = lee(sc, 'v', 'the speed of sound');
    const vF0 = lee(sc, 'vF', 'the speed of the source', { opcional: true, signo: true }) ?? 0;
    const vO0 = lee(sc, 'vO', 'the speed of the observer', { opcional: true, signo: true }) ?? 0;
    const w = lee(sc, 'w', 'the speed of the wind', { opcional: true, signo: true }) ?? 0;
    const aF = lee(sc, 'aF', 'the angle of the source', { opcional: true, signo: true }) ?? 0;
    const aO = lee(sc, 'aO', 'the angle of the observer', { opcional: true, signo: true }) ?? 0;
    const cos = (a) => (Math.abs(a % 180) === 90 ? 0 : Math.cos((a * Math.PI) / 180));
    const vF = vF0 * cos(aF), vO = vO0 * cos(aO);
    const ve = v + w; // velocidad del sonido respecto al suelo, de la fuente al observador
    if (ve <= 0) throw new Error('The headwind is as strong as sound: the wave does not reach the observer');
    if (vF >= ve) throw new Error('The source moves towards the observer at the speed of sound or faster: a shock wave forms and the Doppler formula does not apply (see the “Shock wave” tab)');
    if (-vO >= ve) throw new Error('The observer moves away at the speed of sound or faster: the wave does not reach them');
    const fp = (fr * (ve + vO)) / (ve - vF), lam = ve / fr, lamp = (ve - vF) / fr;
    const pasos = [
      { t: 'Sign convention', html: `Velocities are positive when the source and the observer approach each other: ${sentido(vF, 'the source')} ($v_F = ${f(vF)}$ m/s) and ${sentido(vO, 'the observer')} ($v_O = ${f(vO)}$ m/s).` },
    ];
    if (aF || aO) pasos.unshift({ t: 'Velocities at an angle', html: `Only the component of each velocity along the line joining the source and the observer counts; the perpendicular one neither approaches nor recedes and does not change the pitch:${aF ? ` $v_F = ${f(vF0)} · cos ${f(aF)}° = ${f(vF)}$ m/s` : ''}${aF && aO ? ',' : ''}${aO ? ` $v_O = ${f(vO0)} · cos ${f(aO)}° = ${f(vO)}$ m/s` : ''}.` });
    if (w) pasos.push({ t: 'Wind', html: `The air moves ${w > 0 ? 'from the source towards the observer' : 'from the observer towards the source'}, so relative to the ground the sound travels towards the observer at $v + w = ${f(v)} ${w < 0 ? '−' : '+'} ${f(Math.abs(w))} = ${f(ve)}$ m/s. That speed replaces $v$ in the formula.` });
    const V = w ? 'v + w' : 'v', Vn = w ? `${f(ve)}` : f(v);
    pasos.push({ t: 'Frequency heard', html: `$f′ = f (${V} + v_O)/(${V} − v_F) = ${fq(fr)} · (${Vn} + ${p(vO)})/(${Vn} − ${p(vF)})$ = <b>${fq(fp)} Hz</b><br>${tono(fp, fr)} The change is ${fp >= fr ? '+' : '−'}${fq(Math.abs(fp - fr))} Hz (${f((100 * (fp - fr)) / fr, 3)}%).` });
    pasos.push({ t: 'Wavelength between the two', html: `$λ′ = (${V} − v_F)/f = (${Vn} − ${p(vF)})/${fq(fr)}$ = <b>${f(lamp)} m</b><br>With the source at rest it would be $λ = ${V}/f = ${f(lam)}$ m. The motion of the observer does not change λ: it changes how fast the wavefronts reach them.` });
    return { modo: 'recta', fr, v, vF, vO, vF0, vO0, aF, aO, w, ve, fp, lam, lamp, pasos };
  }

  function paso(sc) {
    const v = lee(sc, 'v', 'the speed of sound');
    let fr, u, f1, f2;
    const pasos = [];
    if (sc.datos === 'oidas') {
      f1 = lee(sc, 'f1', 'the frequency heard on approaching'); f2 = lee(sc, 'f2', 'the frequency heard on receding');
      if (f2 >= f1) throw new Error('On approaching, the source sounds higher than on receding: f₁ must be greater than f₂');
      u = (v * (f1 - f2)) / (f1 + f2); fr = (2 * f1 * f2) / (f1 + f2);
      pasos.push({ t: 'The two equations', html: `Approaching: $f_1 = f v/(v − u)$ &nbsp; Receding: $f_2 = f v/(v + u)$` });
      pasos.push({ t: 'Speed of the source', html: `Dividing one by the other $f$ disappears: $f_1/f_2 = (v + u)/(v − u)$, and solving $u = v (f_1 − f_2)/(f_1 + f_2) = ${f(v)} · (${fq(f1)} − ${fq(f2)})/(${fq(f1)} + ${fq(f2)})$ = <b>${f(u)} m/s</b> (${f(u * 3.6)} km/h)` });
      pasos.push({ t: 'Frequency emitted', html: `$f = f_1 (v − u)/v = 2 f_1 f_2/(f_1 + f_2) = 2 · ${fq(f1)} · ${fq(f2)}/(${fq(f1)} + ${fq(f2)})$ = <b>${fq(fr)} Hz</b>` });
    } else {
      fr = lee(sc, 'f', 'the emitted frequency'); u = lee(sc, 'vF', 'the speed of the source');
      if (u >= v) throw new Error('The source moves at the speed of sound or faster: a shock wave forms (see the “Shock wave” tab)');
      f1 = (fr * v) / (v - u); f2 = (fr * v) / (v + u);
      pasos.push({ t: 'While approaching', html: `$f_1 = f v/(v − v_F) = ${fq(fr)} · ${f(v)}/(${f(v)} − ${f(u)})$ = <b>${fq(f1)} Hz</b>` });
      pasos.push({ t: 'Once it has passed and is moving away', html: `$f_2 = f v/(v + v_F) = ${fq(fr)} · ${f(v)}/(${f(v)} + ${f(u)})$ = <b>${fq(f2)} Hz</b>` });
    }
    const salto = f1 - f2;
    pasos.push({ t: 'Frequency jump on passing', html: `$Δf = f_1 − f_2 = ${fq(f1)} − ${fq(f2)}$ = <b>${fq(salto)} Hz</b>, ${f((1200 * Math.log2(f1 / f2)) / 100, 3)} semitones (in music, a semitone is a ratio of $2^{1/12}$).` });
    const d = lee(sc, 'd', 'la distancia a la carretera', { opcional: true, cero: true }) ?? 0;
    let curva = null;
    if (d > 0) {
      const L = Math.max(8 * d, 40), xs = [];
      for (let i = 0; i <= 200; i++) { const x = -L + (2 * L * i) / 200, c = -x / Math.hypot(x, d); xs.push({ x, t: x / u, tr: x / u + Math.hypot(x, d) / v, fp: (fr * v) / (v - u * c) }); }
      curva = { d, L, puntos: xs };
      pasos.push({ t: `Observer ${f(d)} m from the road`, html: `Only the component of the source velocity in the direction of the observer counts, $v_F cos α$, with α the angle between the road and the source–observer line: $f′ = f v/(v − v_F cos α)$. Far away, cos α ≈ ±1 and $f_1$ and $f_2$ are heard; right opposite, cos α = 0 and the emitted frequency is heard, ${fq(fr)} Hz. The graph shows the gradual change against the instant at which it is heard: the sound takes $r/v$ to arrive, so the pitch heard just when the source passes opposite is already lower than $f$.` });
    }
    return { modo: 'paso', datos: sc.datos === 'oidas' ? 'oidas' : 'fuente', fr, v, u, f1, f2, salto, d, curva, pasos };
  }

  function eco(sc) {
    const fr = lee(sc, 'f', 'the emitted frequency'), v = lee(sc, 'v', 'the speed of the wave');
    const vE = lee(sc, 'vE', 'the speed of the emitter', { opcional: true, signo: true }) ?? 0;
    if (Math.abs(vE) >= v) throw new Error('The emitter moves at the speed of the wave or faster: the Doppler formula does not apply');
    let u;
    const pasos = [{ t: 'Two Doppler effects in a row', html: `1) The obstacle receives the wave as an observer: $f_R = f (v + u)/(v − v_E)$<br>2) It sends it back as a source moving with it, and the emitter hears it: $f″ = f_R (v + v_E)/(v − u)$<br>Velocities positive when approaching: $v_E$ that of the emitter, $u$ that of the obstacle.` }];
    if (sc.buscar === 'velocidad') {
      const df = lee(sc, 'df', 'the frequency difference', { signo: true });
      const r = (fr + df) / fr, k = (r * (v - vE)) / (v + vE);
      if (!(r > 0)) throw new Error('The echo frequency must come out positive: the difference is too negative');
      u = (v * (k - 1)) / (k + 1);
      pasos.push({ t: 'Speed of the obstacle', html: `The echo arrives with $f″ = f + Δf = ${fq(fr)} + ${p(df)} = ${fq(fr + df)}$ Hz. From $f″/f = (v + u)(v + v_E)/((v − u)(v − v_E))$, with $k = (f″/f)(v − v_E)/(v + v_E) = ${f(k, 6)}$, we get $u = v (k − 1)/(k + 1)$ = <b>${f(u)} m/s</b> (${f(u * 3.6)} km/h), ${u > 0 ? 'approaching' : u < 0 ? 'receding' : 'at rest'}.` });
    } else {
      u = lee(sc, 'u', 'the speed of the obstacle', { signo: true });
    }
    if (Math.abs(u) >= v) throw new Error('The obstacle moves at the speed of the wave or faster: the Doppler formula does not apply');
    const fR = (fr * (v + u)) / (v - vE), fpp = (fR * (v + vE)) / (v - u), df = fpp - fr;
    if (sc.buscar !== 'velocidad') {
      pasos.push({ t: 'Frequency received by the obstacle', html: `$f_R = ${fq(fr)} · (${f(v)} + ${p(u)})/(${f(v)} − ${p(vE)})$ = <b>${fq(fR)} Hz</b>` });
      pasos.push({ t: 'Echo frequency', html: `$f″ = ${fq(fR)} · (${f(v)} + ${p(vE)})/(${f(v)} − ${p(u)})$ = <b>${fq(fpp)} Hz</b>` });
    }
    pasos.push({ t: 'Beats', html: `Mixing the emitted wave with the echo gives (or measures) $Δf = f″ − f$ = <b>${fq(df)} Hz</b>${Math.abs(u) + Math.abs(vE) < 0.01 * v ? `<br>With velocities much smaller than v the approximation $Δf ≈ 2 (u + v_E) f/v = ${f((2 * (u + vE) * fr) / v)}$ Hz holds, the one used by traffic radars.` : ''}` });
    return { modo: 'eco', buscar: sc.buscar === 'velocidad' ? 'velocidad' : 'frecuencia', fr, v, vE, u, fR, fpp, df, pasos };
  }

  function choque(sc) {
    const v = lee(sc, 'v', 'the speed of sound'), vF = lee(sc, 'vF', 'the speed of the source');
    if (vF <= v) throw new Error('For there to be a shock wave the source has to go faster than sound (Mach number greater than 1)');
    const M = vF / v, th = Math.asin(v / vF), gr = (th * 180) / Math.PI;
    const pasos = [
      { t: 'Mach number', html: `$M = v_F/v = ${f(vF)}/${f(v)}$ = <b>${f(M)}</b>` },
      { t: 'Half-angle of the Mach cone', html: `The wavefronts fall behind and their envelope is a cone: $sin θ = v/v_F = 1/M = ${f(1 / M)}$, so θ = <b>${f(gr)}°</b>` },
    ];
    const h = lee(sc, 'h', 'la altura', { opcional: true });
    let x = null, t = null, r = null;
    if (h) {
      x = h / Math.tan(th); t = x / vF; r = h / Math.sin(th);
      pasos.push({ t: 'When the boom is heard', html: `The cone reaches the ground behind the aircraft. When you hear it, the aircraft has already passed over you and is at a horizontal distance $x = h/tan θ = ${f(h)}/tan ${f(gr)}°$ = <b>${f(x)} m</b>.<br>A time $t = x/v_F$ = <b>${f(t)} s</b> has passed since it was overhead, and it is $r = h/sin θ = ${f(r)}$ m from you.` });
    }
    return { modo: 'choque', v, vF, M, th, gr, h, x, t, r, pasos };
  }

  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const C = SI.c;
  function luz(sc) {
    const lam = lee(sc, 'lam', 'the emitted wavelength');
    const pasos = [];
    let beta, lamO, geo = sc.geo === 'transversal' ? 'transversal' : 'radial';
    if (sc.dato === 'observado') {
      geo = 'radial';
      lamO = lee(sc, 'lamO', 'the observed wavelength');
      const R = lamO / lam; beta = (R * R - 1) / (R * R + 1);
      pasos.push({ t: 'Speed from the shift', html: `For a source receding in a straight line $λ′/λ = √((1 + β)/(1 − β))$. With $R = λ′/λ = ${f(lamO)}/${f(lam)} = ${f(R, 6)}$ we get $β = (R^2 − 1)/(R^2 + 1)$ = <b>${f(beta)}</b>, that is $v = β c$ = <b>${f(beta * C)} m/s</b> ${beta > 0 ? 'receding' : beta < 0 ? 'approaching' : '(at rest)'}.` });
    } else {
      beta = lee(sc, 'beta', 'β = v/c', { signo: true });
      if (Math.abs(beta) >= 1) throw new Error('Nothing travels at the speed of light or faster: β must be between −1 and 1');
    }
    const g = 1 / Math.sqrt(1 - beta * beta);
    const k = geo === 'transversal' ? g : Math.sqrt((1 + beta) / (1 - beta)); // λ′/λ
    lamO = lam * k;
    const z = k - 1, kc = geo === 'transversal' ? 1 : 1 + beta, nu = C / (lam * 1e-9);
    if (sc.dato !== 'observado') {
      pasos.push({ t: 'Convention', html: `$β = v/c = ${f(beta)}$, positive if the source recedes and negative if it approaches. Lorentz factor $γ = 1/√(1 − β^2) = ${f(g, 6)}$.` });
      pasos.push(geo === 'transversal'
        ? { t: 'Transverse Doppler', html: `If the source moves perpendicular to the line of sight there is no classical effect, but its clock runs slower (time dilation): $λ′ = γ λ = ${f(g, 6)} · ${f(lam)}$ = <b>${f(lamO)} nm</b>. It is a purely relativistic effect.` }
        : { t: 'Relativistic Doppler', html: `$λ′ = λ √((1 + β)/(1 − β)) = ${f(lam)} · √((1 + ${p(beta)})/(1 − ${p(beta)}))$ = <b>${f(lamO)} nm</b>` });
    }
    pasos.push({ t: 'Frequency and shift', html: `$f = c/λ = ${f(nu)}$ Hz and $f′ = f λ/λ′ = ${f(nu / k)}$ Hz. Redshift $z = λ′/λ − 1$ = <b>${f(z)}</b>: ${z > 0 ? 'redshifted (the source recedes or its clock runs slow)' : z < 0 ? 'blueshifted (the source approaches)' : 'none'}.` });
    pasos.push({ t: 'Comparison with the classical formula', html: geo === 'transversal' ? `Classically a source moving perpendicular to the line of sight does not change colour: $λ′ = λ$. The difference, $${f(lamO - lam)}$ nm, is due only to time dilation.` : `For $|β| ≪ 1$, $λ′ ≈ λ (1 + β) = ${f(lam * kc)}$ nm (or $z ≈ β$) holds, which deviates from the exact value by ${f((100 * Math.abs(lam * kc - lamO)) / lamO, 3)}%.` });
    return { modo: 'luz', dato: sc.dato === 'observado' ? 'observado' : 'fuente', geo, lam, lamO, beta, g, z, k, nu, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'luz') return luz(sc);
    if (sc.modo === 'paso') return paso(sc);
    if (sc.modo === 'eco') return eco(sc);
    if (sc.modo === 'choque') return choque(sc);
    return recta(sc);
  }

  const ejemplos = [
    { clave: 'ambulancia', nombre: 'Ambulance approaching a pedestrian', sc: { modo: 'recta', f: '700', v: '340', vF: '25', vO: '0', w: '' } },
    { clave: 'dos-coches', nombre: 'Two cars moving apart', sc: { modo: 'recta', f: '500', v: '340', vF: '-20', vO: '-15', w: '' } },
    { clave: 'viento', nombre: 'Siren with a tailwind', sc: { modo: 'recta', f: '1000', v: '340', vF: '0', vO: '10', w: '15' } },
    { clave: 'tren', nombre: 'Train passing through a station', sc: { modo: 'paso', datos: 'fuente', f: '440', v: '343', vF: '30', d: '15' } },
    { clave: 'moto', nombre: 'Speed of a motorbike from how it sounds', sc: { modo: 'paso', datos: 'oidas', f1: '520', f2: '440', v: '340' } },
    { clave: 'radar', nombre: 'Traffic radar', sc: { modo: 'eco', buscar: 'frecuencia', f: '24e9', v: '3e8', vE: '0', u: '33' } },
    { clave: 'murcielago', nombre: 'Bat flying towards a wall', sc: { modo: 'eco', buscar: 'frecuencia', f: '40000', v: '340', vE: '6', u: '0' } },
    { clave: 'ecografia', nombre: 'Blood speed with a Doppler ultrasound scan', sc: { modo: 'eco', buscar: 'velocidad', f: '5e6', v: '1540', vE: '0', df: '1300' } },
    { clave: 'avion', nombre: 'Supersonic aircraft and sonic boom', sc: { modo: 'choque', v: '340', vF: '680', h: '8000' } },
    { clave: 'cruce', nombre: 'Car crossing at an angle', sc: { modo: 'recta', f: '600', v: '340', vF: '30', vO: '0', w: '', aF: '60', aO: '' } },
    { clave: 'galaxia', nombre: 'Speed of a galaxy from its redshift', sc: { modo: 'luz', dato: 'observado', lam: '656,3', lamO: '721,9' } },
    { clave: 'estrella', nombre: 'Star approaching at 0.1c', sc: { modo: 'luz', dato: 'fuente', geo: 'radial', lam: '500', beta: '-0,1' } },
    { clave: 'transversal', nombre: 'Transverse Doppler at 0.6c', sc: { modo: 'luz', dato: 'fuente', geo: 'transversal', lam: '500', beta: '0,6' } },
  ];

  return { resolver, recta, paso, eco, choque, luz, ejemplos, f, fq, C };
})();

