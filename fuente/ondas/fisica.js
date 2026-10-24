/* =====================================================================
   Ondas mecánicas (sin DOM): onda armónica y su ecuación, ondas
   estacionarias en cuerdas y tubos (armónicos, nodos y vientres), efecto
   Doppler e intensidad y nivel sonoro.
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
      { t: 'Periodo, pulsación y longitud de onda', html: `T = 1/f = <b>${f(T)} s</b>, &nbsp; ω = 2πf = <b>${fpi(w)} rad/s</b>${fpi(w) !== f(w) ? ` ≈ ${f(w)}` : ''}<br>λ = v/f = ${f(v)}/${f(fr)} = <b>${f(lam)} m</b>, &nbsp; k = 2π/λ = <b>${fpi(k)} rad/m</b>${fpi(k) !== f(k) ? ` ≈ ${f(k)}` : ''} (comprobación: v = ω/k = ${f(w / k)} m/s)` },
      { t: 'Ecuación de la onda', html: `Viaja hacia ${mas ? 'x positivas' : 'x negativas'}, así que el signo entre ωt y kx es ${mas ? '−' : '+'}:<br><b>${ec}</b> (SI)` },
      { t: 'Velocidad y aceleración de un punto del medio', html: `v<sub>y</sub> = ∂y/∂t = Aω cos(ωt ${sg} kx + φ), &nbsp; máxima: Aω = <b>${f(A * w)} m/s</b><br>a<sub>y</sub> = −ω<sup>2</sup>y, &nbsp; máxima: Aω<sup>2</sup> = <b>${f(A * w * w)} m/s<sup>2</sup></b><br>No hay que confundirla con la velocidad de propagación, v = ${f(v)} m/s.` },
    ];
    let punto = null;
    const x0 = lee(sc, 'x0', 'la posición x', { opcional: true, signo: true }), t0 = lee(sc, 't0', 'el instante t', { opcional: true, signo: true });
    if (x0 !== null && t0 !== null) {
      const ph = w * t0 + (mas ? -1 : 1) * k * x0 + fase, y = A * Math.sin(ph), vy = A * w * Math.cos(ph), ay = -w * w * y;
      punto = { x0, t0, y, vy, ay, ph };
      pasos.push({ t: `En x = ${f(x0)} m y t = ${f(t0)} s`, html: `Fase: ωt ${sg} kx + φ = ${fpi(w)}·${f(t0)} ${sg} ${fpi(k)}·${f(x0)}${fase ? ` + ${fpi(fase)}` : ''} = ${fpi(ph)} rad<br>y = <b>${f(y)} m</b>, &nbsp; v<sub>y</sub> = <b>${f(vy)} m/s</b>, &nbsp; a<sub>y</sub> = <b>${f(ay)} m/s<sup>2</sup></b>` });
    }
    const dx = lee(sc, 'dx', 'la distancia entre dos puntos', { opcional: true });
    if (dx) pasos.push({ t: `Desfase entre dos puntos separados ${f(dx)} m`, html: `Δφ = kΔx = 2πΔx/λ = <b>${f(k * dx)} rad</b> ${fpi(k * dx) !== f(k * dx) ? `(= ${fpi(k * dx)} rad)` : ''}${Math.abs(((dx / lam) % 1)) < 1e-9 || Math.abs(((dx / lam) % 1) - 1) < 1e-9 ? ': están en fase' : Math.abs(((dx / lam) % 1) - 0.5) < 1e-9 ? ': están en oposición de fase' : ''}` });
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
      pasos.push({ t: 'Velocidad de las ondas en la cuerda', html: `v = √(T/μ) = √(${f(T)}/${f(mu)}) = <b>${f(v)} m/s</b>` });
    } else v = lee(sc, 'vs', 'la velocidad del sonido');
    // modo n: cuerda y tubo abierto, λ = 2L/n; tubo cerrado, solo impares, λ = 4L/(2n − 1)
    const m = medio === 'cerrado' ? 2 * n - 1 : n, lam = medio === 'cerrado' ? (4 * L) / m : (2 * L) / m, fn = v / lam;
    const freq = (j) => (medio === 'cerrado' ? ((2 * j - 1) * v) / (4 * L) : (j * v) / (2 * L));
    const cond = medio === 'cuerda' ? 'Los dos extremos fijos son nodos: caben un número entero de medias longitudes de onda, L = nλ/2.'
      : medio === 'abierto' ? 'Los dos extremos abiertos son vientres de desplazamiento: también L = nλ/2.'
      : 'El extremo cerrado es un nodo y el abierto un vientre: L = (2n − 1)λ/4, así que solo hay armónicos impares.';
    pasos.push({ t: 'Condición de onda estacionaria', html: cond });
    pasos.push({ t: medio === 'cerrado' ? `Modo ${n} (armónico ${m})` : `Armónico ${n}`, html: medio === 'cerrado'
      ? `λ = 4L/(2n − 1) = 4·${f(L)}/${m} = <b>${f(lam)} m</b>, &nbsp; f = v/λ = (2n − 1)v/(4L) = <b>${f(fn)} Hz</b>`
      : `λ<sub>${n}</sub> = 2L/n = 2·${f(L)}/${n} = <b>${f(lam)} m</b>, &nbsp; f<sub>${n}</sub> = nv/(2L) = ${n}·${f(v)}/(2·${f(L)}) = <b>${f(fn)} Hz</b>` });
    pasos.push({ t: 'Primeras frecuencias', html: [1, 2, 3, 4, 5].map((j) => `${f(freq(j))} Hz`).join(', ') + ` … (fundamental ${f(freq(1))} Hz${medio === 'cerrado' ? '; solo múltiplos impares' : '; todas las múltiplos'})` });
    // nodos de desplazamiento medidos desde x = 0 (en el tubo cerrado, el cerrado está en x = 0)
    let nodos = [], vientres = [];
    if (medio === 'cuerda') { for (let j = 0; j <= n; j++) nodos.push((j * lam) / 2); for (let j = 0; j < n; j++) vientres.push(((j + 0.5) * lam) / 2); }
    else if (medio === 'abierto') { for (let j = 0; j < n; j++) nodos.push(((j + 0.5) * lam) / 2); for (let j = 0; j <= n; j++) vientres.push((j * lam) / 2); }
    else { for (let j = 0; j < n; j++) nodos.push((j * lam) / 2); for (let j = 0; j < n; j++) vientres.push(((j + 0.5) * lam) / 2); }
    pasos.push({ t: 'Nodos y vientres (de desplazamiento)', html: `${nodos.length} nodo${nodos.length === 1 ? '' : 's'} en x = ${nodos.map((x) => f(x, 3)).join(', ')} m<br>${vientres.length} vientre${vientres.length === 1 ? '' : 's'} en x = ${vientres.map((x) => f(x, 3)).join(', ')} m<br>Distancia entre nodos consecutivos: λ/2 = ${f(lam / 2)} m` });
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
      { t: 'Frecuencia que se percibe', html: `f′ = f (v + v<sub>O</sub>)/(v − v<sub>F</sub>) = ${f(fr)}·(${f(v)} + ${vO < 0 ? `(${f(vO)})` : f(vO)})/(${f(v)} − ${vF < 0 ? `(${f(vF)})` : f(vF)}) = <b>${f(fp)} Hz</b><br>${fp > fr ? 'Más aguda: se acercan.' : fp < fr ? 'Más grave: se alejan.' : 'Igual: no hay movimiento relativo a lo largo de la línea que los une.'}` },
      { t: 'Longitud de onda', html: `Delante de la fuente: λ′ = (v − v<sub>F</sub>)/f = <b>${f((v - vF) / fr)} m</b> (sin moverse sería ${f(v / fr)} m)` },
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
      { t: 'Intensidad (fuente puntual que emite igual en todas direcciones)', html: `I = ${N > 1 ? 'N·' : ''}P/(4πr<sup>2</sup>) = ${N > 1 ? `${N}·` : ''}${f(P)}/(4π·${f(r1)}<sup>2</sup>) = <b>${f(I1)} W/m<sup>2</sup></b>` },
      { t: 'Nivel de intensidad sonora', html: `β = 10 log(I/I<sub>0</sub>), con I<sub>0</sub> = 10<sup>−12</sup> W/m<sup>2</sup> (umbral de audición): β = 10 log(${f(I1)}/10<sup>−12</sup>) = <b>${f(b1)} dB</b>${N > 1 ? `<br>Con ${N} fuentes iguales el nivel sube 10 log ${N} = ${f(10 * Math.log10(N))} dB respecto a una sola, no ${N} veces.` : ''}` },
    ];
    let I2 = null, b2 = null;
    if (r2) {
      I2 = (N * P) / (4 * Math.PI * r2 * r2); b2 = 10 * Math.log10(I2 / I0);
      pasos.push({ t: `A ${f(r2)} m`, html: `I va con 1/r<sup>2</sup>: I<sub>2</sub> = I<sub>1</sub>(r<sub>1</sub>/r<sub>2</sub>)<sup>2</sup> = <b>${f(I2)} W/m<sup>2</sup></b>, β<sub>2</sub> = <b>${f(b2)} dB</b><br>Δβ = 20 log(r<sub>1</sub>/r<sub>2</sub>) = ${f(b2 - b1)} dB (cada vez que se dobla la distancia baja unos 6 dB)` });
    }
    return { modo: 'sonido', P, r1, r2, N, I1, b1, I2, b2, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'estacionaria') return estacionaria(sc);
    if (sc.modo === 'doppler') return doppler(sc);
    if (sc.modo === 'sonido') return sonido(sc);
    return armonica(sc);
  }

  const ejemplos = [
    { clave: 'armonica', nombre: 'Onda en una cuerda: ecuación y un punto', sc: { modo: 'armonica', A: '0.05', f: '2', v: '4', sentido: '+', fase: '', x0: '0.5', t0: '0.25', dx: '1' } },
    { clave: 'armonica-izq', nombre: 'Onda que viaja hacia la izquierda', sc: { modo: 'armonica', A: '0.02', f: '50', v: '100', sentido: '-', fase: 'π/2', x0: '', t0: '', dx: '' } },
    { clave: 'guitarra', nombre: 'Cuerda de guitarra (tercer armónico)', sc: { modo: 'estacionaria', medio: 'cuerda', L: '0.65', tension: '70', mu: '0.0011', n: '3' } },
    { clave: 'tubo-abierto', nombre: 'Tubo abierto por los dos extremos', sc: { modo: 'estacionaria', medio: 'abierto', L: '0.85', vs: '340', n: '2' } },
    { clave: 'tubo-cerrado', nombre: 'Tubo cerrado por un extremo', sc: { modo: 'estacionaria', medio: 'cerrado', L: '0.85', vs: '340', n: '2' } },
    { clave: 'ambulancia', nombre: 'Ambulancia que se acerca', sc: { modo: 'doppler', f: '700', vs: '340', vF: '25', vO: '0' } },
    { clave: 'cruce', nombre: 'Coche que se aleja de un ciclista que va hacia él', sc: { modo: 'doppler', f: '500', vs: '340', vF: '-30', vO: '8' } },
    { clave: 'altavoz', nombre: 'Nivel sonoro de un altavoz', sc: { modo: 'sonido', P: '0.1', r1: '2', r2: '8', N: '' } },
  ];

  return { resolver, armonica, estacionaria, doppler, sonido, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Ondas;
