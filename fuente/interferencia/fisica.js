/* =====================================================================
   Interferencia y difracción (sin DOM): doble rendija de Young (con la
   envolvente de difracción si se da la anchura de las rendijas), rendija
   simple, abertura circular con el criterio de Rayleigh, red de difracción,
   láminas delgadas (pompas de jabón, antirreflectantes), cuña de aire y
   anillos de Newton. Posiciones de máximos y mínimos, interfranja,
   órdenes, ángulos, intensidad en un punto, poder de resolución y colores.
   Unidades: λ en nm, rendijas y aberturas en mm, distancia a la pantalla
   en m, posiciones en la pantalla en mm, espesores en nm.
   Los pasos llevan fórmulas $…$ que la página pasa a MathML (mates.js).
   ===================================================================== */
const Interferencia = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false, entero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (!signo && v <= 0) throw new Error(`${may(nom)} debe ser mayor que 0`);
    if (entero && !Number.isInteger(v)) throw new Error(`${may(nom)} debe ser un número entero`);
    return v;
  }
  const grados = (r) => (r * 180) / Math.PI;
  const sinc2 = (b) => (Math.abs(b) < 1e-9 ? 1 : (Math.sin(b) / b) ** 2);
  // color aproximado de una longitud de onda visible (nm), para dibujar las franjas
  function color(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else if (nm <= 780) r = 1;
    const k = nm < 380 || nm > 780 ? 0 : nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1;
    if (nm < 380 || nm > 780) return [150, 150, 150];
    return [r, g, b].map((c) => Math.round(255 * (c * k) ** 0.8));
  }
  const nombreColor = (nm) => (nm < 380 ? 'ultravioleta' : nm < 450 ? 'violeta' : nm < 495 ? 'azul' : nm < 570 ? 'verde' : nm < 590 ? 'amarillo' : nm < 620 ? 'naranja' : nm <= 750 ? 'rojo' : 'infrarrojo');
  // número agrupado para que una fracción no lo parta: {6,33·10⁻⁷}
  const G = (x, d) => `{${f(x, d)}}`;
  // función de Bessel J₁ (integral de Bessel), para el disco de Airy
  const J1 = (x) => { let s = 0; const N = 64; for (let k = 0; k < N; k++) { const t = ((k + 0.5) * Math.PI) / N; s += Math.cos(t - x * Math.sin(t)); } return s / N; };
  const airy = (u) => (Math.abs(u) < 1e-6 ? 1 : ((2 * J1(u)) / u) ** 2);
  const ord = (m) => (m === 0 ? 'central' : `de orden ${m}`);

  /* ---------- Doble rendija de Young ---------- */
  function young(sc) {
    const l0 = lee(sc, 'lambda', 'la longitud de onda λ'), d = lee(sc, 'd', 'la separación entre rendijas d') * 1e-3, L = lee(sc, 'L', 'la distancia a la pantalla L');
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'el índice del medio n'), lam = (l0 * 1e-9) / n, a = lee(sc, 'a', 'la anchura de cada rendija a', { opcional: true });
    const aa = a === null ? null : a * 1e-3, pasos = [];
    if (aa !== null && aa >= d) throw new Error('La anchura de cada rendija tiene que ser menor que la separación entre ellas');
    const dy = (lam * L) / d, mmax = Math.floor(d / lam - 1e-12);
    pasos.push({ t: 'Datos', html: `$λ = ${f(l0)}$ nm${n !== 1 ? `, en un medio de índice $n = ${f(n)}$: $λ_n = λ/n = ${f(lam * 1e9)}$ nm` : ''} (${nombreColor(l0)}), $d = ${f(d * 1e3)}$ mm, $L = ${f(L)}$ m${aa !== null ? `, anchura de las rendijas $a = ${f(a)}$ mm` : ''}` });
    pasos.push({ t: 'Condición de interferencia', html: `La diferencia de caminos de las dos rendijas a un punto de la pantalla es $Δ = d sen θ$. Hay un máximo (franja brillante) cuando $Δ = mλ$ y un mínimo (franja oscura) cuando $Δ = (m + ½)λ$, con m = 0, ±1, ±2…<br>Para ángulos pequeños $sen θ ≈ tg θ = y/L$, así que los máximos están en $y_m = mλL/d$.` });
    pasos.push({ t: 'Interfranja', html: `Distancia entre dos franjas brillantes (o dos oscuras) seguidas: $Δy = λL/d = {${f(lam)} · ${f(L)}}/${G(d)}$ = <b>${f(dy * 1e3)} mm</b>` });
    const m = lee(sc, 'm', 'el orden m', { opcional: true, signo: true, entero: true });
    let ym = null, th = null;
    if (m !== null) {
      if (Math.abs(m) > mmax) throw new Error(`No hay máximo de orden ${m}: como mucho m = ${mmax} (sen θ = mλ/d no puede pasar de 1)`);
      th = Math.asin((m * lam) / d); ym = L * Math.tan(th);
      pasos.push({ t: `Máximo ${ord(m)}`, html: `$sen θ_{${m}} = mλ/d = {${m} · ${f(lam)}}/${G(d)} = ${f(Math.sin(th))}$ ⇒ θ = <b>${f(grados(th))}°</b><br>$y_{${m}} = L tg θ$ = <b>${f(ym * 1e3)} mm</b>${Math.abs(th) < 0.1 ? ` (con la aproximación, $m Δy = ${f(m * dy * 1e3)}$ mm)` : ''}<br>El mínimo siguiente está en $y = {(m + ½)λL}/d = ${f((m + 0.5) * dy * 1e3)}$ mm.` });
    }
    const y = lee(sc, 'y', 'la posición y en la pantalla', { opcional: true, signo: true });
    let Iy = null;
    if (y !== null) {
      const yy = y * 1e-3, s = yy / Math.hypot(yy, L), delta = (2 * Math.PI * d * s) / lam, beta = aa !== null ? (Math.PI * aa * s) / lam : 0;
      Iy = Math.cos(delta / 2) ** 2 * sinc2(beta);
      pasos.push({ t: `Intensidad en y = ${f(y)} mm`, html: `Diferencia de caminos $Δ = d sen θ = ${f(d * s * 1e9)}$ nm $= ${f((d * s) / lam)} λ$, desfase $δ = 2πΔ/λ = ${f(delta)}$ rad<br>$I/I_{"máx"} = cos^2(δ/2)${aa !== null ? ' · (sen β/β)^2' : ''}$ = <b>${f(Iy)}</b>${Iy > 0.95 ? ' (franja brillante)' : Iy < 0.05 ? ' (franja oscura)' : ''}` });
    }
    let h = `El orden máximo que se ve es $m_{"máx"} = ⌊d/λ⌋$ = <b>${mmax}</b> (en total ${2 * mmax + 1} máximos si la pantalla fuera infinita).`;
    if (aa !== null) {
      const ya = (lam * L) / aa, perd = [], q = d / aa, nc = Math.abs(q - Math.round(q)) < 1e-6 ? 2 * Math.round(q) - 1 : 2 * Math.floor(q) + 1;
      for (let k = 1; k * aa < d * 1.0000001 && k < 50; k++) if (Math.abs(((k * d) / aa) - Math.round((k * d) / aa)) < 1e-6) perd.push(Math.round((k * d) / aa));
      h += `<br>Cada rendija difracta: la envolvente tiene su primer mínimo en $a sen θ = λ$, $y = λL/a = ${f(ya * 1e3)}$ mm, así que dentro del máximo central de difracción hay <b>${nc} franjas brillantes</b> ($d/a = ${f(d / aa)}$).${perd.length ? ` Faltan los órdenes ${perd.map((q) => `±${q}`).join(', ')}, que caen justo en un mínimo de difracción.` : ''}`;
    }
    pasos.push({ t: 'Cuántas franjas', html: h });
    return { modo: 'young', l0, lam, d, L, n, a: aa, dy, mmax, m, th, ym, y, Iy, I: (yy) => { const s = yy / Math.hypot(yy, L); return Math.cos((Math.PI * d * s) / lam) ** 2 * (aa !== null ? sinc2((Math.PI * aa * s) / lam) : 1); }, ancho: aa !== null ? (2 * lam * L) / aa * 1.3 : 10 * dy, pasos };
  }

  /* ---------- Rendija simple ---------- */
  function rendija(sc) {
    const l0 = lee(sc, 'lambda', 'la longitud de onda λ'), a = lee(sc, 'a', 'la anchura de la rendija a') * 1e-3, L = lee(sc, 'L', 'la distancia a la pantalla L');
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'el índice del medio n'), lam = (l0 * 1e-9) / n, pasos = [];
    pasos.push({ t: 'Datos', html: `$λ = ${f(l0)}$ nm${n !== 1 ? ` (en el medio $λ/n = ${f(lam * 1e9)}$ nm)` : ''}, $a = ${f(a * 1e3)}$ mm, $L = ${f(L)}$ m` });
    pasos.push({ t: 'Mínimos de difracción', html: `Dividiendo la rendija en dos mitades, la luz de cada punto de una mitad se anula con la del punto correspondiente de la otra cuando $a sen θ = mλ$, con m = ±1, ±2… (m = 0 es el máximo central, no un mínimo).` });
    const m = vacio(sc.m) ? 1 : lee(sc, 'm', 'el orden m', { entero: true });
    if (m * lam > a) throw new Error(`No hay mínimo de orden ${m}: a sen θ = mλ pide sen θ = ${f((m * lam) / a)} > 1`);
    const th = Math.asin((m * lam) / a), ym = L * Math.tan(th), th1 = Math.asin(Math.min(1, lam / a)), ancho = 2 * L * Math.tan(th1);
    pasos.push({ t: `Mínimo de orden ${m}`, html: `$sen θ_{${m}} = mλ/a = {${m} · ${f(lam)}}/${G(a)} = ${f(Math.sin(th))}$ ⇒ θ = <b>${f(grados(th))}°</b>, $y_{${m}} = L tg θ$ = <b>${f(ym * 1e3)} mm</b>` });
    pasos.push({ t: 'Anchura del máximo central', html: `Va del mínimo −1 al +1: $2L tg θ_1 ≈ 2λL/a$ = <b>${f(ancho * 1e3)} mm</b>. Los máximos secundarios miden la mitad y son mucho más débiles (el primero tiene el 4,7 % de la intensidad central). Cuanto más estrecha es la rendija, más se abre la luz.` });
    const y = lee(sc, 'y', 'la posición y', { opcional: true, signo: true });
    let Iy = null;
    if (y !== null) { const s = (y * 1e-3) / Math.hypot(y * 1e-3, L), b = (Math.PI * a * s) / lam; Iy = sinc2(b); pasos.push({ t: `Intensidad en y = ${f(y)} mm`, html: `$β = πa sen θ/λ = ${f(b)}$ rad ⇒ $I/I_0 = (sen β/β)^2$ = <b>${f(Iy)}</b>` }); }
    return { modo: 'rendija', l0, lam, a, L, n, m, th, ym, ancho, y, Iy, I: (yy) => sinc2((Math.PI * a * (yy / Math.hypot(yy, L))) / lam), anchoV: Math.min(3.2 * ancho, 4 * L), pasos };
  }

  /* ---------- Abertura circular y criterio de Rayleigh ---------- */
  // sc: { lambda (nm), D (mm), L (m, opcional: pantalla o distancia focal), dist (m, opcional: distancia a los objetos), sep (mm, opcional: separación de los dos objetos), n (opcional) }
  function circular(sc) {
    const l0 = lee(sc, 'lambda', 'la longitud de onda λ'), D = lee(sc, 'D', 'el diámetro de la abertura D') * 1e-3;
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'el índice del medio n'), lam = (l0 * 1e-9) / n, pasos = [];
    const L = lee(sc, 'L', 'la distancia a la pantalla L', { opcional: true }), dist = lee(sc, 'dist', 'la distancia a los objetos', { opcional: true }), sep = lee(sc, 'sep', 'la separación de los objetos', { opcional: true });
    if (1.22 * lam >= D) throw new Error('La abertura es más pequeña que la longitud de onda: no hay disco de Airy (1,22 λ/D > 1)');
    const thR = Math.asin((1.22 * lam) / D);
    pasos.push({ t: 'Disco de Airy', html: `Una abertura circular de diámetro D difracta la luz en un disco central brillante rodeado de anillos. El primer mínimo está en $sen θ = 1,22 λ/D = {1,22 · ${f(lam)}}/${G(D)} = ${f(Math.sin(thR))}$ ⇒ θ = <b>${f(thR)} rad</b> (${f(grados(thR))}°)${n !== 1 ? `, con $λ/n = ${f(lam * 1e9)}$ nm dentro del medio` : ''}.` });
    let r = null;
    if (L !== null) { r = L * Math.tan(thR); pasos.push({ t: 'Tamaño del disco', html: `En una pantalla (o en el plano focal) a $L = ${f(L)}$ m, el radio del disco central es $r = L tg θ ≈ 1,22 λL/D$ = <b>${f(r * 1e3)} mm</b>.` }); }
    pasos.push({ t: 'Criterio de Rayleigh', html: `Dos puntos se distinguen si el máximo de uno cae, como poco, sobre el primer mínimo del otro: la separación angular mínima es $θ_{"mín"} ≈ 1,22 λ/D$ = <b>${f(thR)} rad</b>. Es el límite de resolución del instrumento: cuanto mayor el diámetro y menor la longitud de onda, más detalle se ve.` });
    let smin = null, res = null, thS = null;
    if (dist !== null) {
      smin = dist * thR;
      pasos.push({ t: `Objetos a ${f(dist)} m`, html: `La separación mínima que se distingue es $s_{"mín"} = θ_{"mín"} · d = ${f(thR)} · ${f(dist)}$ = <b>${f(smin * 1e3)} mm</b>${smin > 1 ? ` (${f(smin / 1e3)} km)` : ''}.` });
      if (sep !== null) { thS = (sep * 1e-3) / dist; res = thS >= thR; pasos.push({ t: 'Se distinguen?', html: `Los dos objetos se ven bajo un ángulo $θ = s/d = ${f(sep * 1e-3)}/${f(dist)} = ${f(thS)}$ rad, ${res ? 'mayor' : 'menor'} que $θ_{"mín"}$: <b>${res ? 'se distinguen' : 'no se distinguen'}</b>${res ? '' : ', se ven como un solo punto'}.` }); }
    }
    // perfil en la pantalla (o en ángulo si no hay pantalla): uno o dos discos de Airy
    const esc = L ?? 1, k = (Math.PI * D) / lam, s2 = thS !== null ? thS / 2 : null;
    const un = (y) => airy(k * Math.sin(Math.atan(y / esc)));
    const dos = s2 === null ? null : (y) => (airy(k * Math.sin(Math.atan(y / esc) - s2)) + airy(k * Math.sin(Math.atan(y / esc) + s2)));
    let norma = 1;
    if (dos) { norma = 0; for (let i = 0; i <= 400; i++) norma = Math.max(norma, dos(((i / 400) - 0.5) * 2 * esc * Math.tan(thR + 2 * s2))); }
    const ancho = 2 * esc * Math.tan(Math.min(1.4, 2.6 * thR + (s2 ?? 0) * 2));
    return { modo: 'circular', l0, lam, D, n, L, dist, sep, thR, r, smin, thS, res, eje: L !== null ? 'y (mm)' : 'θ (mrad)', I: dos ? (y) => dos(y) / norma : un, Iuno: un, s2, ancho, ym: null, y: null, pasos };
  }

  /* ---------- Red de difracción ---------- */
  function red(sc) {
    const l0 = lee(sc, 'lambda', 'la longitud de onda λ'), N = lee(sc, 'N', 'el número de líneas por mm'), d = 1e-3 / N, lam = l0 * 1e-9, pasos = [];
    const L = lee(sc, 'L', 'la distancia a la pantalla L', { opcional: true }), l2 = lee(sc, 'lambda2', 'la segunda longitud de onda', { opcional: true }), W = lee(sc, 'W', 'la anchura iluminada', { opcional: true });
    pasos.push({ t: 'Paso de la red', html: `Con ${f(N)} líneas por mm, la distancia entre rendijas es $d = 1/N = ${f(d * 1e3)}$ mm $= ${f(d * 1e9)}$ nm` });
    const mmax = Math.floor(d / lam - 1e-12);
    if (mmax < 1) throw new Error('Con esta red y esta λ no hay ni el primer orden (λ > d)');
    const ords = [];
    for (let m = 1; m <= mmax; m++) { const th = Math.asin((m * lam) / d); ords.push({ m, th, y: L !== null && th < 1.5 ? L * Math.tan(th) : null }); }
    pasos.push({ t: 'Ecuación de la red', html: `Las rendijas interfieren de forma constructiva cuando $d sen θ = mλ$. Con muchas rendijas los máximos son muy finos y brillantes.<br>${ords.map((o) => `m = ${o.m}: $sen θ = ${f((o.m * lam) / d)}$ ⇒ θ = <b>${f(grados(o.th))}°</b>${o.y !== null ? `, $y = L tg θ = ${f(o.y * 100)}$ cm` : ''}`).join('<br>')}` });
    pasos.push({ t: 'Orden máximo', html: `$sen θ ≤ 1$ ⇒ $m ≤ d/λ = ${f(d / lam)}$ ⇒ <b>m<sub>máx</sub> = ${mmax}</b>, así que se ven ${2 * mmax + 1} máximos contando el central.` });
    let sep = null, R = null, dlmin = null;
    if (W !== null) {
      const Nt = W * N; R = Nt * mmax; dlmin = l0 / Nt;
      pasos.push({ t: 'Poder de resolución (Rayleigh)', html: `Con $N = ${f(Nt)}$ rendijas iluminadas, cada máximo es tan fino que dos longitudes de onda se separan si $λ/Δλ ≤ R = mN$. En primer orden $R = ${f(Nt)}$ y se distingue $Δλ_{"mín"} = λ/(mN) = ${f(l0)}/${G(Nt)}$ = <b>${f(dlmin, 3)} nm</b>; en el orden ${mmax}, $R = ${f(R)}$ y $Δλ_{"mín"} = ${f(l0 / R, 3)}$ nm.` });
    }
    if (l2 !== null) {
      const t1 = Math.asin(lam / d), t2 = (l2 * 1e-9) / d <= 1 ? Math.asin((l2 * 1e-9) / d) : NaN;
      sep = grados(t2 - t1);
      let h = `En primer orden, $λ_2 = ${f(l2)}$ nm sale a θ = ${isFinite(t2) ? `${f(grados(t2))}°` : 'ninguno'}: separación angular $Δθ$ = <b>${f(Math.abs(sep))}°</b>${L !== null && isFinite(t2) ? `, en la pantalla ${f(Math.abs(L * (Math.tan(t2) - Math.tan(t1))) * 1000)} mm` : ''}.`;
      if (W !== null) { const Nt = W * N, dl = Math.abs(l2 - l0), lm = (l0 + l2) / 2; h += `<br>Para separarlas en primer orden hace falta $λ/Δλ = ${f(lm)}/${G(dl)} = ${f(lm / dl)}$ y la red da $R = ${f(Nt)}$: ${Nt >= lm / dl ? '<b>se resuelven</b>' : '<b>no se resuelven</b>'}.`; }
      pasos.push({ t: 'Dos longitudes de onda', html: h });
    }
    return { modo: 'red', l0, lam, N, d, L, mmax, ords, l2, sep, R, dlmin, W, pasos };
  }

  /* ---------- Lámina delgada ---------- */
  // reflexión en una lámina de índice n y espesor t entre dos medios n1 (arriba) y n2 (abajo), incidencia normal
  function lamina(sc) {
    const nf = lee(sc, 'nl', 'el índice de la lámina n'), n1 = vacio(sc.n1) ? 1 : lee(sc, 'n1', 'el índice del medio de arriba'), n2 = vacio(sc.n2) ? 1 : lee(sc, 'n2', 'el índice del medio de abajo'), pasos = [];
    const salto1 = nf > n1, salto2 = n2 > nf, medio = salto1 !== salto2;
    pasos.push({ t: 'Cambios de fase al reflejarse', html: `Una onda que se refleja en un medio de índice mayor cambia de fase π (como media longitud de onda); si es de índice menor, no.<br>Arriba (${f(n1)} → ${f(nf)}): ${salto1 ? 'cambia π' : 'no cambia'}. &ensp; Abajo (${f(nf)} → ${f(n2)}): ${salto2 ? 'cambia π' : 'no cambia'}.<br>${medio ? 'Solo una de las dos cambia: hay un desfase extra de media longitud de onda.' : 'Las dos igual: no hay desfase extra.'}` });
    const condC = medio ? '$2nt = (m + ½)λ$' : '$2nt = mλ$', condD = medio ? '$2nt = mλ$' : '$2nt = (m + ½)λ$';
    pasos.push({ t: 'Condición', html: `El rayo que entra en la lámina recorre 2t de más, un camino óptico 2nt. En reflexión:<br>refuerzo (se ve brillante): ${condC}; &ensp; anulación: ${condD}, con m = ${medio ? '0, 1, 2…' : '1, 2, 3…'}` });
    const t = lee(sc, 't', 'el espesor t', { opcional: true }), l0 = lee(sc, 'lambda', 'la longitud de onda λ', { opcional: true });
    let refuerzan = [], anulan = [], tmin = null, tmin2 = null;
    if (t !== null) {
      const op = 2 * nf * t;
      for (let m = 0; m < 200; m++) { const lc = op / (medio ? m + 0.5 : m), ld = op / (medio ? m : m + 0.5); if (isFinite(lc) && lc >= 380 && lc <= 750) refuerzan.push(lc); if (isFinite(ld) && ld > 0 && ld >= 380 && ld <= 750) anulan.push(ld); }
      pasos.push({ t: `Con t = ${f(t)} nm`, html: `Camino óptico extra $2nt = 2 · ${f(nf)} · ${f(t)} = ${f(op)}$ nm<br>Se refuerzan en el visible: ${refuerzan.length ? refuerzan.map((l) => `<b>${f(l)} nm</b> (${nombreColor(l)})`).join(', ') : 'ninguna'}<br>Se anulan: ${anulan.length ? anulan.map((l) => `${f(l)} nm (${nombreColor(l)})`).join(', ') : 'ninguna'}${t < 30 ? '<br>Con un espesor tan pequeño frente a λ, la lámina se ve oscura en reflexión si hay desfase extra (como la parte de arriba de una pompa a punto de romperse).' : ''}` });
    }
    if (l0 !== null) {
      tmin = medio ? l0 / (4 * nf) : l0 / (2 * nf); tmin2 = medio ? l0 / (2 * nf) : l0 / (4 * nf);
      pasos.push({ t: `Espesores para λ = ${f(l0)} nm`, html: `Mínimo espesor con refuerzo: $t = ${medio ? 'λ/(4n)' : 'λ/(2n)'}$ = <b>${f(tmin)} nm</b><br>Mínimo espesor que anula la reflexión (antirreflectante): $t = ${medio ? 'λ/(2n)' : 'λ/(4n)'}$ = <b>${f(tmin2)} nm</b>${!medio && n1 < nf && nf < n2 ? `<br>Para anularla del todo, $n = √(n_1 n_2) = ${f(Math.sqrt(n1 * n2))}$ iguala las dos reflexiones.` : ''}` });
    }
    if (t === null && l0 === null) throw new Error('Da el espesor t, la longitud de onda λ o las dos');
    return { modo: 'lamina', nf, n1, n2, medio, t, l0, refuerzan, anulan, tmin, tmin2, pasos, R: (lnm, tt = t) => { const d = (2 * Math.PI * 2 * nf * tt) / lnm + (medio ? Math.PI : 0); return Math.cos(d / 2) ** 2; } };
  }

  /* ---------- Cuña de aire ---------- */
  // dos placas de vidrio de longitud Lc (cm) que se tocan en un extremo y en el otro las separa un espesor h (µm); o la interfranja dx (mm) medida
  function cuna(sc) {
    const l0 = lee(sc, 'lambda', 'la longitud de onda λ'), Lc = lee(sc, 'Lc', 'la longitud de las placas') * 1e-2;
    const n = vacio(sc.n) ? 1 : lee(sc, 'n', 'el índice de lo que hay en la cuña'), lam = l0 * 1e-9, pasos = [];
    const h0 = lee(sc, 'h', 'el espesor del separador', { opcional: true }), dx0 = lee(sc, 'dx', 'la interfranja medida', { opcional: true });
    if (h0 === null && dx0 === null) throw new Error('Da el espesor del separador h o la interfranja medida');
    pasos.push({ t: 'Por qué salen franjas', html: `La luz se refleja arriba y abajo de la capa de ${n === 1 ? 'aire' : `índice ${f(n)}`}; la reflexión de abajo cambia de fase π, así que a una distancia x del contacto, con espesor $t = αx$, hay franja oscura si $2nt = mλ$ y brillante si $2nt = (m + ½)λ$. Justo en el contacto (t = 0) la franja es oscura.` });
    let h, dx;
    if (h0 !== null) {
      h = h0 * 1e-6; dx = (lam * Lc) / (2 * n * h);
      pasos.push({ t: 'Interfranja', html: `El ángulo de la cuña es $α ≈ h/L = ${f(h)}/${f(Lc)} = ${f(h / Lc)}$ rad. Entre dos franjas oscuras el espesor crece λ/(2n): $Δx = λ/(2nα) = λL/(2nh) = {${f(lam)} · ${f(Lc)}}/{2 · ${f(n)} · ${f(h)}}$ = <b>${f(dx * 1e3)} mm</b>` });
    } else {
      dx = dx0 * 1e-3; h = (lam * Lc) / (2 * n * dx);
      pasos.push({ t: 'Espesor a partir de las franjas', html: `De $Δx = λL/(2nh)$ se despeja $h = λL/(2nΔx) = {${f(lam)} · ${f(Lc)}}/{2 · ${f(n)} · ${f(dx)}}$ = <b>${f(h * 1e6)} µm</b>. Así se mide el grosor de un pelo o de una hoja de papel.` });
    }
    const N = Math.floor((2 * n * h) / lam + 1e-9) + 1;
    pasos.push({ t: 'Cuántas franjas', html: `En el extremo $2nh/λ = ${f((2 * n * h) / lam)}$, así que se ven <b>${N} franjas oscuras</b> contando la del contacto (una cada ${f(dx * 1e3)} mm).` });
    const alfa = h / Lc;
    return { modo: 'cuna', l0, lam, Lc, n, h, dx, N, alfa, eje: 'x (mm)', desde0: true, I: (x) => Math.sin((2 * Math.PI * n * alfa * Math.max(0, x)) / lam) ** 2, ancho: Math.min(Lc, 12 * dx), ym: null, y: null, pasos };
  }

  /* ---------- Anillos de Newton ---------- */
  // lente de radio de curvatura R (m) apoyada en un vidrio plano; o el radio rm (mm) medido del anillo oscuro m para hallar R
  function anillos(sc) {
    const l0 = lee(sc, 'lambda', 'la longitud de onda λ'), lam = l0 * 1e-9, n = vacio(sc.n) ? 1 : lee(sc, 'n', 'el índice de lo que hay entre la lente y el vidrio');
    const m = vacio(sc.m) ? 5 : lee(sc, 'm', 'el número del anillo m', { entero: true });
    const R0 = lee(sc, 'R', 'el radio de curvatura de la lente', { opcional: true }), rm0 = lee(sc, 'rm', 'el radio medido del anillo', { opcional: true }), pasos = [];
    if (R0 === null && rm0 === null) throw new Error('Da el radio de curvatura R o el radio medido de un anillo');
    pasos.push({ t: 'Espesor de la capa', html: `Entre la lente y el vidrio queda una capa de ${n === 1 ? 'aire' : `índice ${f(n)}`} que a una distancia r del centro mide $t ≈ r^2/(2R)$. Como en la cuña, la reflexión de abajo cambia de fase π: anillo oscuro si $2nt = mλ$ y brillante si $2nt = (m + ½)λ$. El centro es oscuro.` });
    let R;
    if (R0 !== null) R = R0;
    else { const rm = rm0 * 1e-3; R = (n * rm * rm) / (m * lam); pasos.push({ t: 'Radio de curvatura', html: `De $r_m^2 = mλR/n$ se despeja $R = n r_m^2/(mλ) = {${f(n)} · (${f(rm)})^2}/{${m} · ${f(lam)}}$ = <b>${f(R)} m</b>` }); }
    const ro = Math.sqrt((m * lam * R) / n), rb = Math.sqrt(((m - 0.5) * lam * R) / n);
    pasos.push({ t: `Anillo ${m}`, html: `Oscuro: $r_m = √(mλR/n) = √({${m} · ${f(lam)} · ${f(R)}}/${G(n)})$ = <b>${f(ro * 1e3)} mm</b><br>El brillante de antes: $r = √({(m − ½)λR}/n)$ = <b>${f(rb * 1e3)} mm</b><br>Los anillos se juntan hacia fuera porque el radio crece como $√m$.` });
    return { modo: 'anillos', l0, lam, n, m, R, ro, rb, eje: 'r (mm)', I: (r) => Math.sin((Math.PI * n * r * r) / (lam * R)) ** 2, ancho: 2 * Math.sqrt(((m + 3) * lam * R) / n), ym: ro, y: null, pasos };
  }

  const MODOS = { young, rendija, circular, red, lamina, cuna, anillos };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : young(sc); }

  const ejemplos = [
    { clave: 'young', nombre: 'Young con un láser rojo', sc: { modo: 'young', lambda: '633', d: '0,25', L: '1,5', n: '', a: '', m: '3', y: '' } },
    { clave: 'young-y', nombre: 'Intensidad en un punto de la pantalla', sc: { modo: 'young', lambda: '550', d: '0,1', L: '2', n: '', a: '', m: '', y: '5,5' } },
    { clave: 'young-a', nombre: 'Doble rendija con difracción (faltan órdenes)', sc: { modo: 'young', lambda: '600', d: '0,3', L: '1', n: '', a: '0,1', m: '1', y: '' } },
    { clave: 'young-agua', nombre: 'Young dentro del agua', sc: { modo: 'young', lambda: '589', d: '0,2', L: '1', n: '1,33', a: '', m: '1', y: '' } },
    { clave: 'rendija', nombre: 'Rendija simple', sc: { modo: 'rendija', lambda: '500', a: '0,05', L: '1,2', n: '', m: '1', y: '' } },
    { clave: 'rendija-2', nombre: 'Segundo mínimo de una rendija estrecha', sc: { modo: 'rendija', lambda: '633', a: '0,02', L: '2', n: '', m: '2', y: '10' } },
    { clave: 'ojo', nombre: 'Los faros de un coche: ¿se ven dos o uno?', sc: { modo: 'circular', lambda: '550', D: '5', L: '', dist: '10000', sep: '1400', n: '' } },
    { clave: 'telescopio', nombre: 'Telescopio de 10 cm y su disco de Airy', sc: { modo: 'circular', lambda: '550', D: '100', L: '1', dist: '', sep: '', n: '' } },
    { clave: 'red', nombre: 'Red de 600 líneas/mm', sc: { modo: 'red', lambda: '500', N: '600', L: '1', lambda2: '', W: '' } },
    { clave: 'sodio', nombre: 'Doblete del sodio (589,0 y 589,6 nm)', sc: { modo: 'red', lambda: '589', N: '300', L: '2', lambda2: '589,6', W: '5' } },
    { clave: 'pompa', nombre: 'Pompa de jabón', sc: { modo: 'lamina', nl: '1,33', n1: '1', n2: '1', t: '400', lambda: '' } },
    { clave: 'antirreflejo', nombre: 'Capa antirreflectante en unas gafas', sc: { modo: 'lamina', nl: '1,38', n1: '1', n2: '1,52', t: '', lambda: '550' } },
    { clave: 'aceite', nombre: 'Mancha de aceite sobre agua', sc: { modo: 'lamina', nl: '1,45', n1: '1', n2: '1,33', t: '300', lambda: '' } },
    { clave: 'cuna', nombre: 'Cuña de aire con un papel de separador', sc: { modo: 'cuna', lambda: '589', Lc: '10', h: '50', dx: '', n: '' } },
    { clave: 'pelo', nombre: 'Grosor de un pelo por las franjas', sc: { modo: 'cuna', lambda: '633', Lc: '8', h: '', dx: '0,5', n: '' } },
    { clave: 'newton', nombre: 'Anillos de Newton', sc: { modo: 'anillos', lambda: '589', R: '1', m: '5', rm: '', n: '' } },
    { clave: 'newton-r', nombre: 'Radio de una lente por sus anillos', sc: { modo: 'anillos', lambda: '546', R: '', m: '10', rm: '2,5', n: '' } },
  ];
  return { resolver, color, nombreColor, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Interferencia;
