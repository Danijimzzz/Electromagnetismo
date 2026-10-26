/* =====================================================================
   Ondas mecánicas (sin DOM): onda armónica y su ecuación, ondas
   estacionarias en cuerdas y tubos (armónicos, nodos y vientres), efecto
   Doppler, intensidad y nivel sonoro, superposición (pulsaciones y dos
   ondas desfasadas), energía y potencia de una onda en una cuerda, y
   reflexión y transmisión entre dos cuerdas.
   Unidades del SI; la fase en radianes.
   ===================================================================== */
const Ondas = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => leePi(s);
  const leeSimple = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  // admite 'pi', 'π', 'pi/2', '3π/4'
  function leePi(s) {
    const t = String(s ?? '').trim().replace(/\s/g, '').replace(/pi/gi, 'π');
    const m = t.match(/^([+\-−]?\d*(?:[.,]\d+)?)π(?:\/(\d+(?:[.,]\d+)?))?$/);
    if (m) { const c = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' || m[1] === '−' ? -1 : leeSimple(m[1]); return (c * Math.PI) / (m[2] ? leeSimple(m[2]) : 1); }
    return leeSimple(t);
  }
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    return v;
  }
  const PI = 'π';
  // múltiplo sencillo de π (4π, π/2, 3π/4…) si lo es; si no, el número
  function fpi(x) {
    const r = x / Math.PI;
    for (let q = 1; q <= 12; q++) {
      const pn = Math.round(r * q);
      if (pn && Math.abs(r * q - pn) < 1e-9 * Math.max(1, Math.abs(r * q))) {
        const g = (a, b) => (b ? g(b, a % b) : a), d = g(Math.abs(pn), q), nn = pn / d, qq = q / d;
        const num = `${nn < 0 ? '−' : ''}${Math.abs(nn) === 1 ? '' : Math.abs(nn)}π`;
        return qq === 1 ? num : `${num}/${qq}`;
      }
    }
    return f(x);
  }

  /* ---------- Onda armónica ---------- */
  // sc: { A (m), f (Hz), v (m/s), sentido: '+'|'-', fase (rad), x0, t0 }
  function armonica(sc) {
    const A = lee(sc, 'A', 'la amplitud'), fr = lee(sc, 'f', 'la frecuencia'), v = lee(sc, 'v', 'la velocidad de propagación');
    const fase = lee(sc, 'fase', 'la fase inicial', { opcional: true, signo: true }) ?? 0, mas = sc.sentido !== '-';
    const T = 1 / fr, w = 2 * Math.PI * fr, lam = v / fr, k = (2 * Math.PI) / lam;
    const sg = mas ? '−' : '+';
    const ec = `y(x, t) = ${f(A)} sen(${fpi(w)}t ${sg} ${fpi(k)}x${fase ? ` ${fase < 0 ? '−' : '+'} ${fpi(Math.abs(fase))}` : ''})`;
    const pasos = [
      { t: 'Periodo, pulsación y longitud de onda', html: `$T = 1/f$ = <b>${f(T)} s</b>, &nbsp; $ω = 2π f$ = <b>${fpi(w)} rad/s</b>${fpi(w) !== f(w) ? ` ≈ ${f(w)}` : ''}<br>$λ = v/f = ${f(v)}/${f(fr)}$ = <b>${f(lam)} m</b>, &nbsp; $k = 2π/λ$ = <b>${fpi(k)} rad/m</b>${fpi(k) !== f(k) ? ` ≈ ${f(k)}` : ''} (comprobación: $v = ω/k$ = ${f(w / k)} m/s)` },
      { t: 'Ecuación de la onda', html: `Viaja hacia ${mas ? 'x positivas' : 'x negativas'}, así que el signo entre ωt y kx es ${mas ? '−' : '+'}:<br>$${ec}$ (SI)` },
      { t: 'Velocidad y aceleración de un punto del medio', html: `$v_y = ∂y/∂t = A ω cos(ω t ${sg} k x + φ)$, máxima: $A ω$ = <b>${f(A * w)} m/s</b><br>$a_y = −ω^2 y$, máxima: $A ω^2$ = <b>${f(A * w * w)} m/s²</b><br>No hay que confundirla con la velocidad de propagación, v = ${f(v)} m/s.` },
    ];
    let punto = null;
    const x0 = lee(sc, 'x0', 'la posición x', { opcional: true, signo: true }), t0 = lee(sc, 't0', 'el instante t', { opcional: true, signo: true });
    if (x0 !== null && t0 !== null) {
      const ph = w * t0 + (mas ? -1 : 1) * k * x0 + fase, y = A * Math.sin(ph), vy = A * w * Math.cos(ph), ay = -w * w * y;
      punto = { x0, t0, y, vy, ay, ph };
      pasos.push({ t: `En x = ${f(x0)} m y t = ${f(t0)} s`, html: `Fase: $ω t ${sg} k x + φ = ${fpi(w)} · ${f(t0)} ${sg} ${fpi(k)} · ${f(x0)}${fase ? ` + ${fpi(fase)}` : ''} = ${fpi(ph)}$ rad<br>y = <b>${f(y)} m</b>, &nbsp; v<sub>y</sub> = <b>${f(vy)} m/s</b>, &nbsp; a<sub>y</sub> = <b>${f(ay)} m/s²</b>` });
    }
    const dx = lee(sc, 'dx', 'la distancia entre dos puntos', { opcional: true });
    if (dx) pasos.push({ t: `Desfase entre dos puntos separados ${f(dx)} m`, html: `$Δφ = k Δx = 2π Δx/λ$ = <b>${f(k * dx)} rad</b> ${fpi(k * dx) !== f(k * dx) ? `(= ${fpi(k * dx)} rad)` : ''}${Math.abs(((dx / lam) % 1)) < 1e-9 || Math.abs(((dx / lam) % 1) - 1) < 1e-9 ? ': están en fase' : Math.abs(((dx / lam) % 1) - 0.5) < 1e-9 ? ': están en oposición de fase' : ''}` });
    return { modo: 'armonica', A, fr, v, T, w, lam, k, fase, mas, ec, punto, pasos };
  }

  /* ---------- Ondas estacionarias ---------- */
  // sc: { medio: 'cuerda'|'abierto'|'cerrado', L, tension, mu (kg/m), vs (m/s, tubos), n }
  function estacionaria(sc) {
    const medio = ['cuerda', 'abierto', 'cerrado'].includes(sc.medio) ? sc.medio : 'cuerda', L = lee(sc, 'L', 'la longitud');
    const n = Math.round(lee(sc, 'n', 'el número de armónico'));
    if (n < 1 || n > 30) throw new Error('El armónico tiene que estar entre 1 y 30');
    const pasos = [];
    let v;
    if (medio === 'cuerda') {
      const T = lee(sc, 'tension', 'la tensión'), mu = lee(sc, 'mu', 'la densidad lineal');
      v = Math.sqrt(T / mu);
      pasos.push({ t: 'Velocidad de las ondas en la cuerda', html: `$v = √(T/μ) = √(${f(T)}/${f(mu)})$ = <b>${f(v)} m/s</b>` });
    } else v = lee(sc, 'vs', 'la velocidad del sonido');
    // modo n: cuerda y tubo abierto, λ = 2L/n; tubo cerrado, solo impares, λ = 4L/(2n − 1)
    const m = medio === 'cerrado' ? 2 * n - 1 : n, lam = medio === 'cerrado' ? (4 * L) / m : (2 * L) / m, fn = v / lam;
    const freq = (j) => (medio === 'cerrado' ? ((2 * j - 1) * v) / (4 * L) : (j * v) / (2 * L));
    const cond = medio === 'cuerda' ? 'Los dos extremos fijos son nodos: caben un número entero de medias longitudes de onda, $L = n λ/2$.'
      : medio === 'abierto' ? 'Los dos extremos abiertos son vientres de desplazamiento: también $L = n λ/2$.'
      : 'El extremo cerrado es un nodo y el abierto un vientre: $L = (2n − 1) λ/4$, así que solo hay armónicos impares.';
    pasos.push({ t: 'Condición de onda estacionaria', html: cond });
    pasos.push({ t: medio === 'cerrado' ? `Modo ${n} (armónico ${m})` : `Armónico ${n}`, html: medio === 'cerrado'
      ? `$λ = {4L}/{2n − 1} = {4 · ${f(L)}}/${m}$ = <b>${f(lam)} m</b>, &nbsp; $f = v/λ = {(2n − 1) v}/{4L}$ = <b>${f(fn)} Hz</b>`
      : `$λ_${n} = {2L}/n = {2 · ${f(L)}}/${n}$ = <b>${f(lam)} m</b>, &nbsp; $f_${n} = {n v}/{2L} = {${n} · ${f(v)}}/{2 · ${f(L)}}$ = <b>${f(fn)} Hz</b>` });
    pasos.push({ t: 'Primeras frecuencias', html: [1, 2, 3, 4, 5].map((j) => `${f(freq(j))} Hz`).join(', ') + ` … (fundamental ${f(freq(1))} Hz${medio === 'cerrado' ? '; solo múltiplos impares' : '; todas las múltiplos'})` });
    // nodos de desplazamiento medidos desde x = 0 (en el tubo cerrado, el cerrado está en x = 0)
    let nodos = [], vientres = [];
    if (medio === 'cuerda') { for (let j = 0; j <= n; j++) nodos.push((j * lam) / 2); for (let j = 0; j < n; j++) vientres.push(((j + 0.5) * lam) / 2); }
    else if (medio === 'abierto') { for (let j = 0; j < n; j++) nodos.push(((j + 0.5) * lam) / 2); for (let j = 0; j <= n; j++) vientres.push((j * lam) / 2); }
    else { for (let j = 0; j < n; j++) nodos.push((j * lam) / 2); for (let j = 0; j < n; j++) vientres.push(((j + 0.5) * lam) / 2); }
    pasos.push({ t: 'Nodos y vientres (de desplazamiento)', html: `${nodos.length} nodo${nodos.length === 1 ? '' : 's'} en x = ${nodos.map((x) => f(x, 3)).join(', ')} m<br>${vientres.length} vientre${vientres.length === 1 ? '' : 's'} en x = ${vientres.map((x) => f(x, 3)).join(', ')} m<br>Distancia entre nodos consecutivos: $λ/2$ = ${f(lam / 2)} m` });
    return { modo: 'estacionaria', medio, L, v, n, m, lam, fn, nodos, vientres, freqs: [1, 2, 3, 4, 5].map(freq), pasos };
  }

  /* ---------- Efecto Doppler ---------- */
  // sc: { f, vs (sonido), vF (fuente, + hacia el observador), vO (observador, + hacia la fuente) }
  function doppler(sc) {
    const fr = lee(sc, 'f', 'la frecuencia emitida'), v = lee(sc, 'vs', 'la velocidad del sonido');
    const vF = lee(sc, 'vF', 'la velocidad de la fuente', { opcional: true, signo: true }) ?? 0, vO = lee(sc, 'vO', 'la velocidad del observador', { opcional: true, signo: true }) ?? 0;
    if (vF >= v) throw new Error('La fuente va a la velocidad del sonido o más deprisa hacia el observador: se forma una onda de choque y la fórmula de Doppler no vale');
    if (-vO >= v) throw new Error('El observador se aleja a la velocidad del sonido o más: no le llega la onda');
    const fp = (fr * (v + vO)) / (v - vF);
    const pasos = [
      { t: 'Convenio de signos', html: `Velocidades positivas cuando fuente y observador se acercan el uno al otro: fuente ${vF > 0 ? 'se acerca' : vF < 0 ? 'se aleja' : 'quieta'} (v<sub>F</sub> = ${f(vF)} m/s), observador ${vO > 0 ? 'se acerca' : vO < 0 ? 'se aleja' : 'quieto'} (v<sub>O</sub> = ${f(vO)} m/s).` },
      { t: 'Frecuencia que se percibe', html: `$f′ = f {v + v_O}/{v − v_F} = ${f(fr)} · {${f(v)} + ${vO < 0 ? `(${f(vO)})` : f(vO)}}/{${f(v)} − ${vF < 0 ? `(${f(vF)})` : f(vF)}}$ = <b>${f(fp)} Hz</b><br>${fp > fr ? 'Más aguda: se acercan.' : fp < fr ? 'Más grave: se alejan.' : 'Igual: no hay movimiento relativo a lo largo de la línea que los une.'}` },
      { t: 'Longitud de onda', html: `Delante de la fuente: $λ′ = {v − v_F}/f$ = <b>${f((v - vF) / fr)} m</b> (sin moverse sería ${f(v / fr)} m)` },
    ];
    return { modo: 'doppler', fr, v, vF, vO, fp, pasos };
  }

  /* ---------- Intensidad y nivel sonoro ---------- */
  // sc: { P (W), r1 (m), r2 (m, opcional), N (fuentes iguales, opcional) }
  const I0 = 1e-12;
  function sonido(sc) {
    const P = lee(sc, 'P', 'la potencia'), r1 = lee(sc, 'r1', 'la distancia'), r2 = lee(sc, 'r2', 'la segunda distancia', { opcional: true });
    const N = vacio(sc.N) ? 1 : Math.round(lee(sc, 'N', 'el número de fuentes'));
    const I1 = (N * P) / (4 * Math.PI * r1 * r1), b1 = 10 * Math.log10(I1 / I0);
    const pasos = [
      { t: 'Intensidad (fuente puntual que emite igual en todas direcciones)', html: `$I = ${N > 1 ? 'N ' : ''}P/(4π r^2) = ${N > 1 ? `${N} · ` : ''}${f(P)}/(4π · ${f(r1)}^2)$ = <b>${f(I1)} W/m²</b>` },
      { t: 'Nivel de intensidad sonora', html: `$β = 10 log(I/I_0)$, con $I_0 = 10^{−12} "W/m²"$ (umbral de audición): $β = 10 log(${f(I1)}/10^{−12})$ = <b>${f(b1)} dB</b>${N > 1 ? `<br>Con ${N} fuentes iguales el nivel sube $10 log ${N}$ = ${f(10 * Math.log10(N))} dB respecto a una sola, no ${N} veces.` : ''}` },
    ];
    let I2 = null, b2 = null;
    if (r2) {
      I2 = (N * P) / (4 * Math.PI * r2 * r2); b2 = 10 * Math.log10(I2 / I0);
      pasos.push({ t: `A ${f(r2)} m`, html: `I va con $1/r^2$: $I_2 = I_1 (r_1/r_2)^2$ = <b>${f(I2)} W/m²</b>, β<sub>2</sub> = <b>${f(b2)} dB</b><br>$Δβ = 20 log(r_1/r_2)$ = ${f(b2 - b1)} dB (cada vez que se dobla la distancia baja unos 6 dB)` });
    }
    return { modo: 'sonido', P, r1, r2, N, I1, b1, I2, b2, pasos };
  }

  /* ---------- Superposición ---------- */
  // pulsaciones: { tipo: 'pulsaciones', A1, f1, A2, f2 }; fase: { tipo: 'fase', A1, A2, f, v, delta (rad) o dr (diferencia de caminos, m) }
  function superposicion(sc) {
    const A1 = lee(sc, 'A1', 'la amplitud de la onda 1'), A2 = lee(sc, 'A2', 'la amplitud de la onda 2'), pasos = [];
    if (sc.tipo === 'fase') {
      const fr = lee(sc, 'f', 'la frecuencia'), v = lee(sc, 'v', 'la velocidad de propagación'), lam = v / fr;
      const dr = lee(sc, 'dr', 'la diferencia de caminos', { opcional: true, signo: true });
      let delta = lee(sc, 'delta', 'el desfase', { opcional: true, signo: true });
      if (dr === null && delta === null) throw new Error('Falta el desfase o la diferencia de caminos');
      if (dr !== null) { delta = (2 * Math.PI * dr) / lam; pasos.push({ t: 'Desfase por la diferencia de caminos', html: `$λ = v/f$ = ${f(lam)} m ⇒ $δ = 2π Δr/λ = 2π · ${f(dr)}/${f(lam)}$ = <b>${fpi(delta)} rad</b>${fpi(delta) !== f(delta) ? ` ≈ ${f(delta)}` : ''} (Δr = ${f(dr / lam, 3)} λ)` }); }
      const A = Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(delta)), phi = Math.atan2(A2 * Math.sin(delta), A1 + A2 * Math.cos(delta));
      const red = ((delta / (2 * Math.PI)) % 1 + 1) % 1, tipo = Math.abs(red) < 1e-9 || Math.abs(red - 1) < 1e-9 ? 'constructiva' : Math.abs(red - 0.5) < 1e-9 ? 'destructiva' : null;
      pasos.push({ t: 'Amplitud de la suma', html: `Dos ondas de la misma frecuencia desfasadas δ dan otra onda de esa frecuencia con $A = √(A_1^2 + A_2^2 + 2 A_1 A_2 cos δ) = √(${f(A1)}^2 + ${f(A2)}^2 + 2 · ${f(A1)} · ${f(A2)} · cos ${f(delta)})$ = <b>${f(A)} m</b>${tipo ? ` (interferencia <b>${tipo}</b>: ${tipo === 'constructiva' ? '$A = A_1 + A_2$' : '$A = |A_1 − A_2|$'})` : ''}` });
      pasos.push({ t: 'Fase de la suma', html: `$tg φ = {A_2 sen δ}/{A_1 + A_2 cos δ}$ ⇒ φ = ${f(phi)} rad. Máxima amplitud si $δ = 2π n$ ($Δr = n λ$); mínima si $δ = (2n + 1) π$ ($Δr = (n + 1/2) λ$).` });
      return { modo: 'superposicion', tipo: 'fase', A1, A2, fr, v, lam, k: (2 * Math.PI) / lam, delta, A, phi, interferencia: tipo, pasos };
    }
    const f1 = lee(sc, 'f1', 'la frecuencia 1'), f2 = lee(sc, 'f2', 'la frecuencia 2');
    if (f1 === f2) throw new Error('Con las dos frecuencias iguales no hay pulsaciones: usa «dos ondas desfasadas»');
    const fb = Math.abs(f1 - f2), fm = (f1 + f2) / 2;
    pasos.push({ t: 'Suma de dos frecuencias cercanas', html: A1 === A2 ? `$y = A sen(ω_1 t) + A sen(ω_2 t) = 2A cos({ω_1 − ω_2}/2 t) sen({ω_1 + ω_2}/2 t)$: una oscilación de frecuencia media $f = {f_1 + f_2}/2$ = <b>${f(fm)} Hz</b> con una amplitud que sube y baja entre 0 y $2A$ = ${f(2 * A1)} m.`
      : `Con amplitudes distintas la suma oscila a la frecuencia media $f = {f_1 + f_2}/2$ = <b>${f(fm)} Hz</b> y su amplitud va de $|A_1 − A_2|$ = ${f(Math.abs(A1 - A2))} m a $A_1 + A_2$ = ${f(A1 + A2)} m.` });
    pasos.push({ t: 'Pulsaciones', html: `El oído percibe un máximo de intensidad cada vez que la envolvente pasa por su máximo: $f_pulsación = |f_1 − f_2| = |${f(f1)} − ${f(f2)}|$ = <b>${f(fb)} Hz</b>, una cada ${f(1 / fb)} s. Así se afinan instrumentos: se ajusta hasta que dejan de oírse.` });
    return { modo: 'superposicion', tipo: 'pulsaciones', A1, A2, f1, f2, fb, fm, pasos };
  }

  /* ---------- Energía y potencia de una onda en una cuerda ---------- */
  // sc: { mu, A, f, tension o v }
  function energia(sc) {
    const mu = lee(sc, 'mu', 'la densidad lineal'), A = lee(sc, 'A', 'la amplitud'), fr = lee(sc, 'f', 'la frecuencia'), pasos = [];
    const T = lee(sc, 'tension', 'la tensión', { opcional: true });
    let v = lee(sc, 'v', 'la velocidad de propagación', { opcional: true });
    if (T !== null) { v = Math.sqrt(T / mu); pasos.push({ t: 'Velocidad de propagación', html: `$v = √(T/μ) = √(${f(T)}/${f(mu)})$ = <b>${f(v)} m/s</b>` }); }
    if (v === null) throw new Error('Falta la tensión o la velocidad de propagación');
    const w = 2 * Math.PI * fr, u = 0.5 * mu * w * w * A * A, P = u * v, lam = v / fr;
    pasos.push({ t: 'Energía por unidad de longitud', html: `Cada trozo de cuerda oscila con un MAS de velocidad máxima $A ω$: $u = 1/2 μ ω^2 A^2 = 1/2 · ${f(mu)} · ${f(w)}^2 · ${f(A)}^2$ = <b>${f(u)} J/m</b> (en una longitud de onda, ${f(u * lam)} J)` });
    pasos.push({ t: 'Potencia que transporta', html: `$P = u v = 1/2 μ ω^2 A^2 v$ = <b>${f(P)} W</b>. Va con el cuadrado de la amplitud y de la frecuencia: al doblar A o f, la potencia se multiplica por 4.` });
    return { modo: 'energia', mu, A, fr, T, v, w, u, P, lam, k: (2 * Math.PI) / lam, pasos };
  }

  /* ---------- Reflexión y transmisión entre dos cuerdas ---------- */
  // sc: { tension, mu1, mu2, A, f }
  function reflexion(sc) {
    const T = lee(sc, 'tension', 'la tensión'), mu1 = lee(sc, 'mu1', 'la densidad de la cuerda 1'), mu2 = lee(sc, 'mu2', 'la densidad de la cuerda 2');
    const A = lee(sc, 'A', 'la amplitud', { opcional: true }) ?? 1, fr = lee(sc, 'f', 'la frecuencia', { opcional: true });
    const v1 = Math.sqrt(T / mu1), v2 = Math.sqrt(T / mu2), Z1 = Math.sqrt(T * mu1), Z2 = Math.sqrt(T * mu2);
    const r = (Z1 - Z2) / (Z1 + Z2), t = (2 * Z1) / (Z1 + Z2), R = r * r, Tt = (Z2 / Z1) * t * t;
    const pasos = [
      { t: 'Velocidades e impedancias', html: `$v = √(T/μ)$: v<sub>1</sub> = <b>${f(v1)} m/s</b>, v<sub>2</sub> = <b>${f(v2)} m/s</b>. Impedancia $Z = √(T μ)$: Z<sub>1</sub> = ${f(Z1)}, Z<sub>2</sub> = ${f(Z2)} kg/s` },
      { t: 'Amplitudes reflejada y transmitida', html: `$r = {Z_1 − Z_2}/{Z_1 + Z_2}$ = <b>${f(r)}</b> ⇒ A<sub>r</sub> = ${f(r * A)} m${r < 0 ? ' (la reflejada sale <b>invertida</b>: la segunda cuerda es más pesada)' : r > 0 ? ' (la reflejada sale derecha: la segunda cuerda es más ligera)' : ''}<br>$t = {2 Z_1}/{Z_1 + Z_2}$ = <b>${f(t)}</b> ⇒ A<sub>t</sub> = ${f(t * A)} m (nunca invertida)` },
      { t: 'Reparto de la potencia', html: `Reflejada $R = r^2$ = <b>${f(100 * R, 3)} %</b>; transmitida $T = Z_2/Z_1 · t^2$ = <b>${f(100 * Tt, 3)} %</b>; suman el 100 %.` },
    ];
    if (fr !== null) pasos.push({ t: 'Frecuencia y longitud de onda', html: `La frecuencia no cambia al pasar (la impone el punto de unión): λ<sub>1</sub> = $v_1/f$ = ${f(v1 / fr)} m, λ<sub>2</sub> = $v_2/f$ = ${f(v2 / fr)} m.` });
    return { modo: 'reflexion', T, mu1, mu2, A, fr, v1, v2, Z1, Z2, r, t, R, Tt, pasos };
  }

  function resolver(sc) {
    const fn = { estacionaria, doppler, sonido, superposicion, energia, reflexion }[sc.modo];
    return fn ? fn(sc) : armonica(sc);
  }

  const ejemplos = [
    { clave: 'armonica', nombre: 'Onda en una cuerda: ecuación y un punto', sc: { modo: 'armonica', A: '0,05', f: '2', v: '4', sentido: '+', fase: '', x0: '0,5', t0: '0,25', dx: '1' } },
    { clave: 'armonica-izq', nombre: 'Onda que viaja hacia la izquierda', sc: { modo: 'armonica', A: '0,02', f: '50', v: '100', sentido: '-', fase: 'π/2', x0: '', t0: '', dx: '' } },
    { clave: 'guitarra', nombre: 'Cuerda de guitarra (tercer armónico)', sc: { modo: 'estacionaria', medio: 'cuerda', L: '0,65', tension: '70', mu: '0,0011', n: '3' } },
    { clave: 'tubo-abierto', nombre: 'Tubo abierto por los dos extremos', sc: { modo: 'estacionaria', medio: 'abierto', L: '0,85', vs: '340', n: '2' } },
    { clave: 'tubo-cerrado', nombre: 'Tubo cerrado por un extremo', sc: { modo: 'estacionaria', medio: 'cerrado', L: '0,85', vs: '340', n: '2' } },
    { clave: 'ambulancia', nombre: 'Ambulancia que se acerca', sc: { modo: 'doppler', f: '700', vs: '340', vF: '25', vO: '0' } },
    { clave: 'cruce', nombre: 'Coche que se aleja de un ciclista que va hacia él', sc: { modo: 'doppler', f: '500', vs: '340', vF: '-30', vO: '8' } },
    { clave: 'altavoz', nombre: 'Nivel sonoro de un altavoz', sc: { modo: 'sonido', P: '0,1', r1: '2', r2: '8', N: '' } },
    { clave: 'pulsaciones', nombre: 'Pulsaciones: dos diapasones casi iguales', sc: { modo: 'superposicion', tipo: 'pulsaciones', A1: '1', f1: '440', A2: '1', f2: '444' } },
    { clave: 'desfase', nombre: 'Dos altavoces: interferencia por la diferencia de caminos', sc: { modo: 'superposicion', tipo: 'fase', A1: '0,02', A2: '0,01', f: '170', v: '340', dr: '1', delta: '' } },
    { clave: 'energia', nombre: 'Potencia de una onda en una cuerda tensa', sc: { modo: 'energia', mu: '0,05', A: '0,01', f: '60', tension: '80', v: '' } },
    { clave: 'reflexion', nombre: 'Cuerda ligera unida a una pesada', sc: { modo: 'reflexion', tension: '50', mu1: '0,01', mu2: '0,09', A: '0,02', f: '20' } },
    { clave: 'reflexion-ligera', nombre: 'Cuerda pesada unida a una ligera', sc: { modo: 'reflexion', tension: '50', mu1: '0,09', mu2: '0,01', A: '0,02', f: '20' } },
  ];

  return { resolver, armonica, estacionaria, doppler, sonido, superposicion, energia, reflexion, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Ondas;
