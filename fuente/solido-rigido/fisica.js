/* =====================================================================
   Sólido rígido (sin DOM): momentos de inercia con el teorema de Steiner
   (de un cuerpo o de un cuerpo compuesto), rodadura por un plano inclinado,
   polea con masa, conservación del momento angular, choques que hacen
   girar (bala en una varilla, persona que salta a una plataforma), péndulo
   físico y varilla que cae, y equilibrio estático (escalera y viga).
   Las animaciones salen de mov(t) en cada resultado.
   Masas en kg, longitudes en m, ángulos en grados, ω en rad/s o rpm.
   ===================================================================== */
const Solido = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-10) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const RAD = Math.PI / 180;
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false, max = Infinity, libre = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (!libre && (cero ? v < 0 : v <= 0)) throw new Error(`${may(nom)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    if (v > max) throw new Error(`${may(nom)} no puede pasar de ${f(max)}`);
    return v;
  }

  /* ---------- Cuerpos: I respecto a un eje por el centro de masas ---------- */
  // k = I/(M·L²) con L la medida que se indica; rueda: puede rodar
  const CUERPOS = {
    'esfera': { nombre: 'Esfera maciza', k: 2 / 5, kTxt: '2/5', formula: '2/5 M R^2', med: 'R', medNom: 'Radio R', rueda: true, eje: 'un diámetro' },
    'esfera-hueca': { nombre: 'Esfera hueca (corteza)', k: 2 / 3, kTxt: '2/3', formula: '2/3 M R^2', med: 'R', medNom: 'Radio R', rueda: true, eje: 'un diámetro' },
    'cilindro': { nombre: 'Cilindro macizo o disco', k: 1 / 2, kTxt: '1/2', formula: '1/2 M R^2', med: 'R', medNom: 'Radio R', rueda: true, eje: 'su eje' },
    'aro': { nombre: 'Aro o cilindro hueco delgado', k: 1, kTxt: '1', formula: 'M R^2', med: 'R', medNom: 'Radio R', rueda: true, eje: 'su eje' },
    'varilla': { nombre: 'Varilla delgada', k: 1 / 12, kTxt: '1/12', formula: '1/12 M L^2', med: 'L', medNom: 'Longitud L', rueda: false, eje: 'perpendicular por el centro' },
    'placa': { nombre: 'Placa rectangular (a × b)', placa: true, formula: '1/12 M(a^2 + b^2)', med: 'a', medNom: 'Lado a', rueda: false, eje: 'perpendicular por el centro' },
    'disco-diametro': { nombre: 'Disco (eje por un diámetro)', k: 1 / 4, kTxt: '1/4', formula: '1/4 M R^2', med: 'R', medNom: 'Radio R', rueda: false, eje: 'un diámetro' },
  };
  const kPor = (C) => (C.kTxt === '1' ? '' : `${C.kTxt} · `);
  // I_cm y su cuenta; b solo para la placa
  function Icm(C, M, L, b) {
    if (C.placa) return { I: (M * (L * L + b * b)) / 12, html: `$I_cm = 1/12 M(a^2 + b^2) = 1/12 · ${f(M)} · (${f(L)}^2 + ${f(b)}^2)$` };
    return { I: C.k * M * L * L, html: `$I_cm = ${C.formula} = ${kPor(C)}${f(M)} · ${f(L)}^2$` };
  }
  const kgm2 = (x) => `<b>${f(x)} kg·m²</b>`;

  function inercia(sc) {
    const C = CUERPOS[sc.cuerpo] || CUERPOS.esfera;
    const M = lee(sc, 'M', 'la masa'), L = lee(sc, 'L', C.medNom.toLowerCase()), d = lee(sc, 'd', 'la distancia del eje al centro de masas', { opcional: true, cero: true }) ?? 0;
    const b = C.placa ? lee(sc, 'b', 'el lado b') : null, ic = Icm(C, M, L, b);
    const pasos = [{ t: `Momento de inercia respecto a un eje por el centro de masas (${C.eje})`, html: `${ic.html} = ${kgm2(ic.I)}` }];
    const I = ic.I + M * d * d;
    if (d) pasos.push({ t: 'Teorema de Steiner (ejes paralelos)', html: `$I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$ = ${kgm2(I)}${sc.cuerpo === 'varilla' && Math.abs(d - L / 2) < 1e-12 ? ' (por un extremo: $1/3 M L^2$)' : ''}` });
    pasos.push({ t: 'Radio de giro', html: `$k = √(I/M) = √(${f(I)}/${f(M)})$ = <b>${f(Math.sqrt(I / M))} m</b>: es la distancia a la que habría que concentrar toda la masa para tener el mismo I.` });
    return { modo: 'inercia', C, M, L, b, d, Icm: ic.I, I, pasos };
  }

  /* ---------- Cuerpo compuesto: Σ (I_cm + M d²) ---------- */
  // sc.piezas: una por línea, «tipo M medida d» (tipo de CUERPOS o «punto M d»; la placa lleva b al final)
  function compuesto(sc) {
    const lineas = String(sc.piezas || '').split(/\n|;/).map((x) => x.trim()).filter(Boolean);
    if (!lineas.length) throw new Error('Escribe al menos una pieza: «tipo masa medida distancia»');
    const piezas = lineas.map((l, i) => {
      const [tipo, ...nums] = l.split(/\s+/), v = nums.map(leeNum), quien = `Pieza ${i + 1}`;
      if (v.some((x) => !isFinite(x))) throw new Error(`${quien}: los datos deben ser números`);
      if (tipo === 'punto') {
        if (v.length < 2) throw new Error(`${quien}: una masa puntual lleva «punto masa distancia»`);
        const [M, d] = v; if (M <= 0 || d < 0) throw new Error(`${quien}: la masa debe ser positiva y la distancia no puede ser negativa`);
        return { nombre: 'Masa puntual', M, d, Icm: 0, html: `$I = M d^2 = ${f(M)} · ${f(d)}^2$`, I: M * d * d };
      }
      const C = CUERPOS[tipo];
      if (!C) throw new Error(`${quien}: «${tipo}» no es un cuerpo (usa ${Object.keys(CUERPOS).join(', ')} o punto)`);
      if (v.length < (C.placa ? 4 : 3)) throw new Error(`${quien}: lleva «${tipo} masa medida distancia${C.placa ? ' b' : ''}»`);
      const [M, L, d, b] = v; if (M <= 0 || L <= 0 || d < 0 || (C.placa && !(b > 0))) throw new Error(`${quien}: masa y medidas positivas, distancia no negativa`);
      const ic = Icm(C, M, L, b);
      return { nombre: C.nombre, M, d, Icm: ic.I, I: ic.I + M * d * d, html: `${ic.html} = ${f(ic.I)} ⇒ $I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$` };
    });
    const I = piezas.reduce((s, p) => s + p.I, 0), M = piezas.reduce((s, p) => s + p.M, 0);
    const pasos = piezas.map((p, i) => ({ t: `${i + 1}. ${p.nombre} (${f(p.M)} kg a ${f(p.d)} m del eje)`, html: `${p.html} = ${kgm2(p.I)}` }));
    pasos.push({ t: 'Suma: el momento de inercia es aditivo', html: `$I = ${piezas.map((p) => f(p.I)).join(' + ')}$ = ${kgm2(I)}, con masa total ${f(M)} kg y radio de giro $k = √(I/M)$ = ${f(Math.sqrt(I / M))} m.` });
    return { modo: 'compuesto', piezas, I, M, pasos };
  }

  /* ---------- Rodadura por un plano inclinado ---------- */
  // sc: { cuerpo (que rueda), M, R, theta, d (m a lo largo del plano), mu (opcional), g }
  function rodadura(sc) {
    const C = CUERPOS[sc.cuerpo];
    if (!C || !C.rueda) throw new Error('Para rodar elige una esfera, un cilindro o un aro');
    const g = lee(sc, 'g', 'la gravedad'), M = lee(sc, 'M', 'la masa'), R = lee(sc, 'L', 'el radio'), th = lee(sc, 'theta', 'el ángulo del plano', { max: 89.9 }), d = lee(sc, 'd', 'la distancia recorrida');
    const mu = lee(sc, 'mu', 'el coeficiente de rozamiento estático', { opcional: true, cero: true });
    const t = th * RAD, k = C.k, a = (g * Math.sin(t)) / (1 + k), Fr = k * M * a, h = d * Math.sin(t), v = Math.sqrt(2 * a * d), tt = Math.sqrt((2 * d) / a);
    const muMin = (Math.tan(t) * k) / (1 + k), N = M * g * Math.cos(t);
    const Krot = 0.5 * k * M * v * v, Ktras = 0.5 * M * v * v;
    const pasos = [
      { t: 'Momento de inercia', html: `${C.nombre}: $I = ${C.formula}$ = ${kgm2(k * M * R * R)}, es decir $I/(M R^2) = ${C.kTxt}$` },
      { t: 'Ecuaciones del movimiento (rueda sin deslizar: a = αR)', html: `Traslación: $M g sen θ − F_r = M a$<br>Rotación respecto al centro: $F_r R = I α = I a/R ⇒ F_r = I a/R^2$<br>Sumando: $M g sen θ = (M + I/R^2) a ⇒ a = {g sen θ}/(1 + I/(M R^2)) = {${f(g)} · sen ${f(th)}°}/(1 + ${C.kTxt})$ = <b>${f(a)} m/s²</b>` },
      { t: 'Rozamiento necesario', html: `$F_r = I a/R^2 = ${kPor(C)}${f(M)} · ${f(a)}$ = <b>${f(Fr)} N</b> (estático: no hace trabajo, el punto de contacto no se mueve)<br>Para que ruede sin deslizar hace falta $μ_e ≥ F_r/N = tg θ · {I/(M R^2)}/{1 + I/(M R^2)}$ = <b>${f(muMin)}</b>${mu !== null ? `; con $μ_e = ${f(mu)}$ ${mu >= muMin ? '<b>sí rueda sin deslizar</b>' : '<b>no basta: desliza y gira a la vez</b> (lo de arriba sería si rodara; abajo está lo que pasa de verdad)'}` : ''}` },
      { t: `Por energía, tras recorrer ${f(d)} m (baja h = d sen θ = ${f(h)} m)`, html: `$M g h = 1/2 M v^2 + 1/2 I ω^2 = 1/2 (M + I/R^2) v^2 ⇒ v = √({2 g h}/{1 + I/(M R^2)})$ = <b>${f(v)} m/s</b>, $ω = v/R$ = ${f(v / R)} rad/s<br>$t = √(2d/a)$ = <b>${f(tt)} s</b>` },
      { t: 'Reparto de la energía cinética', html: `Traslación $1/2 M v^2$ = ${f(Ktras)} J; rotación $1/2 I ω^2$ = ${f(Krot)} J (un ${f((100 * k) / (1 + k), 3)} % del total). Cuanto mayor es $I/(M R^2)$, más energía se va en girar y más despacio baja: la esfera maciza gana a la hueca, al cilindro y al aro, sea cual sea su masa y su radio.` },
    ];
    let desliza = null;
    if (mu !== null && mu < muMin) {
      // rueda y desliza a la vez: el rozamiento es dinámico (tomamos μ_d = μ_e) y la ligadura a = αR ya no vale
      const a2 = g * (Math.sin(t) - mu * Math.cos(t)), I = k * M * R * R, al2 = (mu * N * R) / I, t2 = Math.sqrt((2 * d) / a2), v2 = a2 * t2, w2 = al2 * t2;
      const Q = M * g * h - 0.5 * M * v2 * v2 - 0.5 * I * w2 * w2;
      desliza = { a: a2, al: al2, t: t2, v: v2, w: w2, Q };
      pasos.push({ t: 'Como no basta el rozamiento, desliza mientras gira', html: `Rozamiento dinámico (tomamos $μ_d = μ_e$): $F_r = μ N = ${f(mu)} · ${f(N)}$ = ${f(mu * N)} N<br>Traslación: $a = g(sen θ − μ cos θ)$ = <b>${f(a2)} m/s²</b>; rotación: $α = F_r R/I$ = <b>${f(al2)} rad/s²</b>, y $α R = ${f(al2 * R)} "m/s²" < a$<br>Al final del plano: t = ${f(t2)} s, v = <b>${f(v2)} m/s</b>, ω = ${f(w2)} rad/s (menos que v/R = ${f(v2 / R)} rad/s); se pierden ${f(Q)} J en calor por el rozamiento.` });
    }
    const carrera = Object.entries(CUERPOS).filter(([, c]) => c.rueda).map(([kk, c]) => ({ k: kk, nombre: c.nombre, a: (g * Math.sin(t)) / (1 + c.k), v: Math.sqrt((2 * g * h) / (1 + c.k)), t: Math.sqrt((2 * d * (1 + c.k)) / (g * Math.sin(t))) }));
    // animación: recorrido s y ángulo girado φ
    const A = desliza ? desliza.a : a, Al = desliza ? desliza.al : a / R, T = desliza ? desliza.t : tt;
    const mov = (x) => { const u = Math.min(Math.max(x, 0), T); return { s: 0.5 * A * u * u, phi: 0.5 * Al * u * u, v: A * u }; };
    return { modo: 'rodadura', C, g, M, R, th, d, mu, a, Fr, N, v, w: v / R, t: tt, h, muMin, rueda: mu === null || mu >= muMin, desliza, Krot, Ktras, carrera, pasos, mov, T };
  }

  /* ---------- Polea con masa ---------- */
  // sc: { cuerpo (disco o aro), M (polea), L (R), m (cuelga), d (baja), g }
  function polea(sc) {
    const C = CUERPOS[sc.cuerpo] && CUERPOS[sc.cuerpo].rueda ? CUERPOS[sc.cuerpo] : CUERPOS.cilindro;
    const g = lee(sc, 'g', 'la gravedad'), M = lee(sc, 'M', 'la masa de la polea'), R = lee(sc, 'L', 'el radio de la polea'), m = lee(sc, 'm', 'la masa que cuelga'), d = lee(sc, 'd', 'la altura que baja');
    const I = C.k * M * R * R, a = (m * g) / (m + I / (R * R)), T = m * (g - a), al = a / R, v = Math.sqrt(2 * a * d), tt = Math.sqrt((2 * d) / a);
    const pasos = [
      { t: 'Momento de inercia de la polea', html: `${C.nombre}: $I = ${C.formula} = ${kPor(C)}${f(M)} · ${f(R)}^2$ = ${kgm2(I)}` },
      { t: 'Ecuaciones (la cuerda no desliza: a = αR)', html: `Cuerpo que cuelga: $m g − T = m a$<br>Polea: $T R = I α = I a/R ⇒ T = I a/R^2$<br>Sumando: $m g = (m + I/R^2) a ⇒ a = {${f(m)} · ${f(g)}}/{${f(m)} + ${f(I / (R * R))}}$ = <b>${f(a)} m/s²</b>` },
      { t: 'Tensión y aceleración angular', html: `$T = m(g − a) = ${f(m)} · (${f(g)} − ${f(a)})$ = <b>${f(T)} N</b> (menor que el peso, ${f(m * g)} N)<br>$α = a/R$ = <b>${f(al)} rad/s²</b>` },
      { t: `Tras bajar ${f(d)} m`, html: `$v = √(2 a d)$ = <b>${f(v)} m/s</b>, $ω = v/R$ = ${f(v / R)} rad/s, $t = √(2d/a)$ = ${f(tt)} s<br>Energía: $m g h$ = ${f(m * g * d)} J = $1/2 m v^2 + 1/2 I ω^2$ = ${f(0.5 * m * v * v)} + ${f(0.5 * I * (v / R) ** 2)} J` },
    ];
    const mov = (x) => { const u = Math.min(Math.max(x, 0), tt); return { y: 0.5 * a * u * u, phi: (0.5 * a * u * u) / R, v: a * u }; };
    return { modo: 'polea', C, g, M, R, m, d, I, a, T, al, v, w: v / R, t: tt, pasos, mov, T_: tt };
  }

  /* ---------- Conservación del momento angular ---------- */
  // sc: { I1, w1, I2, unidad: 'rpm'|'rad' }
  const aRad = (w, rpm) => (rpm ? (w * 2 * Math.PI) / 60 : w), deRad = (W, rpm) => (rpm ? (W * 60) / (2 * Math.PI) : W);
  function momento(sc) {
    const I1 = lee(sc, 'I1', 'el momento de inercia inicial'), I2 = lee(sc, 'I2', 'el momento de inercia final'), w1 = lee(sc, 'w1', 'la velocidad angular inicial');
    const rpm = sc.unidad !== 'rad', W1 = aRad(w1, rpm), W2 = (I1 * W1) / I2, w2 = deRad(W2, rpm);
    const L = I1 * W1, K1 = 0.5 * I1 * W1 * W1, K2 = 0.5 * I2 * W2 * W2, un = rpm ? 'rpm' : 'rad/s';
    const pasos = [
      { t: 'Sin momento de fuerzas exterior, L se conserva', html: `$I_1 ω_1 = I_2 ω_2 ⇒ ω_2 = ω_1 · I_1/I_2 = ${f(w1)} · ${f(I1)}/${f(I2)}$ = <b>${f(w2)} ${un}</b>${rpm ? ` (= ${f(W2)} rad/s)` : ''}` },
      { t: 'Momento angular', html: `$L = I_1 ω_1 = ${f(I1)} · ${f(W1)}$ = <b>${f(L)} kg·m²/s</b>${rpm ? ` (con ω₁ = ${f(w1)} rpm = ${f(W1)} rad/s)` : ''}` },
      { t: 'La energía cinética de rotación no se conserva', html: `$K_1 = 1/2 I_1 ω_1^2$ = ${f(K1)} J, $K_2 = 1/2 I_2 ω_2^2$ = ${f(K2)} J ⇒ ΔK = <b>${f(K2 - K1)} J</b> ($K_2/K_1 = I_1/I_2$ = ${f(I1 / I2)}). ${K2 > K1 ? 'Al encogerse gana energía: la pone el trabajo de los músculos o de quien tira hacia dentro.' : K2 < K1 ? 'Se pierde energía, como en un choque inelástico de rotación.' : ''}` },
    ];
    return { modo: 'momento', I1, I2, w1, w2, W1, W2, L, K1, K2, rpm, pasos };
  }

  /* ---------- Choques que hacen girar ---------- */
  // bala: { tipo: 'bala', M (varilla), L, m (bala), v, r (distancia al pivote), g }
  // plataforma: { tipo: 'plataforma', M (disco), L (R), w1 (rpm), m (persona), v (tangencial), r }
  function choque(sc) {
    const m = lee(sc, 'm', sc.tipo === 'plataforma' ? 'la masa de la persona' : 'la masa de la bala'), M = lee(sc, 'M', sc.tipo === 'plataforma' ? 'la masa de la plataforma' : 'la masa de la varilla');
    const L = lee(sc, 'L', sc.tipo === 'plataforma' ? 'el radio de la plataforma' : 'la longitud de la varilla'), r = lee(sc, 'r', 'la distancia al eje', { cero: true });
    const pasos = [];
    if (sc.tipo === 'plataforma') {
      if (r > L) throw new Error('La persona tiene que caer dentro de la plataforma (r ≤ R)');
      const w1 = lee(sc, 'w1', 'la velocidad angular de la plataforma', { cero: true }), v = lee(sc, 'v', 'la velocidad de la persona', { libre: true, opcional: true }) ?? 0;
      const Ip = 0.5 * M * L * L, W1 = aRad(w1, true), L1 = Ip * W1 + m * v * r, I2 = Ip + m * r * r, W2 = L1 / I2;
      const K1 = 0.5 * Ip * W1 * W1 + 0.5 * m * v * v, K2 = 0.5 * I2 * W2 * W2;
      pasos.push({ t: 'Momento angular antes', html: `Plataforma (disco): $I_p = 1/2 M R^2 = 1/2 · ${f(M)} · ${f(L)}^2$ = ${f(Ip)} kg·m², $ω_1$ = ${f(w1)} rpm = ${f(W1)} rad/s<br>Persona: $m v r = ${f(m)} · ${f(v)} · ${f(r)}$ = ${f(m * v * r)} kg·m²/s ${v ? '(tangente al borde, en el sentido de giro si es positiva)' : '(cae sin velocidad tangencial)'}<br>$L = I_p ω_1 + m v r$ = <b>${f(L1)} kg·m²/s</b>` });
      pasos.push({ t: 'Después giran juntos', html: `$I_2 = I_p + m r^2 = ${f(Ip)} + ${f(m)} · ${f(r)}^2$ = ${f(I2)} kg·m² ⇒ $ω_2 = L/I_2$ = <b>${f(W2)} rad/s = ${f(deRad(W2, true))} rpm</b>` });
      pasos.push({ t: 'Energía', html: `$K_1$ = ${f(K1)} J → $K_2 = 1/2 I_2 ω_2^2$ = ${f(K2)} J: se pierden <b>${f(K1 - K2)} J</b>, como en todo choque perfectamente inelástico.` });
      return { modo: 'choque', tipo: 'plataforma', M, L, m, r, v, Ip, I2, W1, W2, w2: deRad(W2, true), L1, K1, K2, pasos };
    }
    if (r > L) throw new Error('La bala tiene que dar en la varilla (r ≤ L)');
    const g = lee(sc, 'g', 'la gravedad'), v = lee(sc, 'v', 'la velocidad de la bala');
    const Iv = (M * L * L) / 3, I = Iv + m * r * r, W = (m * v * r) / I, K0 = 0.5 * m * v * v, K1 = 0.5 * I * W * W;
    const dcm = (M * L / 2 + m * r) / (M + m), c = 1 - K1 / ((M + m) * g * dcm), vuelta = c < -1;
    const sube = vuelta ? null : Math.acos(c) / RAD;
    pasos.push({ t: 'Momento angular respecto al pivote', html: `Justo antes solo se mueve la bala: $L = m v r = ${f(m)} · ${f(v)} · ${f(r)}$ = <b>${f(m * v * r)} kg·m²/s</b>. Durante el choque el pivote ejerce fuerza, pero no momento respecto a sí mismo: L se conserva (la cantidad de movimiento, no).` });
    pasos.push({ t: 'Velocidad angular tras el choque', html: `$I = 1/3 M L^2 + m r^2 = ${f(Iv)} + ${f(m)} · ${f(r)}^2$ = ${f(I)} kg·m² ⇒ $ω = {m v r}/I$ = <b>${f(W)} rad/s</b>` });
    pasos.push({ t: 'Energía que se pierde en el choque', html: `$K_0 = 1/2 m v^2$ = ${f(K0)} J → $K = 1/2 I ω^2$ = ${f(K1)} J: se pierde un <b>${f(100 * (1 - K1 / K0), 3)} %</b>.` });
    pasos.push({ t: 'Hasta dónde sube', html: `El centro de masas está a $d = {M L/2 + m r}/{M + m}$ = ${f(dcm)} m del pivote. Después del choque sí se conserva la energía: $(M + m) g d (1 − cos θ) = 1/2 I ω^2 ⇒ cos θ = ${f(c)}$ ⇒ ${vuelta ? '<b>da la vuelta completa</b> (sobra energía para pasar por arriba)' : `<b>θ = ${f(sube)}°</b>`}` });
    return { modo: 'choque', tipo: 'bala', M, L, m, r, v, g, I, W, K0, K1, dcm, sube, vuelta, pasos };
  }

  /* ---------- Péndulo físico y varilla que cae ---------- */
  // sc: { tipo: 'oscila'|'cae', cuerpo, M, L, b, d (pivote al cm), th0, th (para cae), g }
  function pendulo(sc) {
    const C = CUERPOS[sc.cuerpo] || CUERPOS.varilla;
    const g = lee(sc, 'g', 'la gravedad'), M = lee(sc, 'M', 'la masa'), L = lee(sc, 'L', C.medNom.toLowerCase()), d = lee(sc, 'd', 'la distancia del pivote al centro de masas');
    const b = C.placa ? lee(sc, 'b', 'el lado b') : null, ic = Icm(C, M, L, b), I = ic.I + M * d * d, K = (M * g * d) / I;
    const pasos = [{ t: 'Momento de inercia respecto al pivote', html: `${ic.html} = ${f(ic.I)} ⇒ $I = I_cm + M d^2 = ${f(ic.I)} + ${f(M)} · ${f(d)}^2$ = ${kgm2(I)}` }];
    // θ'' = ∓K sen θ: RK4 para la animación
    const simula = (th0, signo, tmax, hasta) => {
      const P = [{ t: 0, th: th0, w: 0 }], dt = Math.min(0.002, tmax / 4000);
      let s = P[0];
      for (let n = 0; n * dt < tmax; n++) {
        const fz = (th) => signo * K * Math.sin(th);
        const k1 = [s.w, fz(s.th)], k2 = [s.w + (dt / 2) * k1[1], fz(s.th + (dt / 2) * k1[0])], k3 = [s.w + (dt / 2) * k2[1], fz(s.th + (dt / 2) * k2[0])], k4 = [s.w + dt * k3[1], fz(s.th + dt * k3[0])];
        s = { t: s.t + dt, th: s.th + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), w: s.w + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) };
        P.push(s);
        if (hasta !== undefined && s.th >= hasta) break;
      }
      return P;
    };
    const enT = (P) => (x) => { const T = P[P.length - 1].t, u = Math.min(Math.max(x, 0), T), dt = P[1].t; const i = Math.min(P.length - 2, Math.floor(u / dt)); const a = P[i], z = P[i + 1], q = (u - a.t) / dt; return { th: a.th + (z.th - a.th) * q, w: a.w + (z.w - a.w) * q }; };
    if (sc.tipo === 'cae') {
      const th0 = lee(sc, 'th0', 'el ángulo inicial', { cero: true, max: 179 }), th = lee(sc, 'th', 'el ángulo final', { max: 180 });
      if (th <= th0) throw new Error('El ángulo final tiene que ser mayor que el inicial');
      const w = Math.sqrt(2 * K * (Math.cos(th0 * RAD) - Math.cos(th * RAD))), al = K * Math.sin(th * RAD), punta = sc.cuerpo === 'varilla' ? d + L / 2 : d;
      pasos.push({ t: 'Energía: cae desde arriba', html: `El centro de masas baja $d(cos θ_0 − cos θ)$ (ángulos desde la vertical por encima del pivote): $M g d (cos θ_0 − cos θ) = 1/2 I ω^2 ⇒ ω = √({2 M g d (cos θ_0 − cos θ)}/I)$ = <b>${f(w)} rad/s</b>` });
      pasos.push({ t: 'Aceleración angular en ese instante', html: `$τ = M g d sen θ = I α ⇒ α = {M g d sen θ}/I$ = <b>${f(al)} rad/s²</b>. ${sc.cuerpo === 'varilla' ? `El extremo libre (a ${f(punta)} m) tiene $a_t = α r$ = <b>${f(al * punta)} m/s²</b>${al * punta > g * Math.sin(th * RAD) ? `, más que la componente de g en esa dirección (${f(g * Math.sin(th * RAD))} m/s²): una moneda en la punta se quedaría atrás` : ''}.` : ''}` });
      const P = simula(Math.max(th0, 0.5) * RAD, 1, 30, th * RAD);
      return { modo: 'pendulo', tipo: 'cae', C, M, L, b, d, I, w, al, punta, th0, th, pasos, mov: enT(P), T: P[P.length - 1].t };
    }
    const th0 = lee(sc, 'th0', 'la amplitud', { opcional: true, max: 179 }) ?? 10;
    const T = 2 * Math.PI * Math.sqrt(I / (M * g * d)), Leq = I / (M * d), wmax = Math.sqrt(2 * K * (1 - Math.cos(th0 * RAD)));
    pasos.push({ t: 'Periodo de las oscilaciones pequeñas', html: `$τ = −M g d sen θ ≈ −M g d θ = I α ⇒ ω_0 = √({M g d}/I)$ = ${f(Math.sqrt(K))} rad/s ⇒ $T = 2π √(I/(M g d))$ = <b>${f(T)} s</b>` });
    pasos.push({ t: 'Longitud equivalente', html: `Oscila igual que un péndulo simple de longitud $L_eq = I/(M d)$ = <b>${f(Leq)} m</b>. Si se cuelga a $L_eq$ del pivote, por el otro lado del centro de masas, el periodo es el mismo (centro de oscilación).` });
    pasos.push({ t: `Soltado desde ${f(th0)}°`, html: `Al pasar por abajo: $1/2 I ω^2 = M g d (1 − cos θ_0) ⇒ ω_máx$ = <b>${f(wmax)} rad/s</b>${th0 > 20 ? '. Con esta amplitud el periodo real es algo mayor que el de oscilaciones pequeñas (se ve en la animación).' : '.'}` });
    const P = simula(th0 * RAD, -1, 2 * T);
    return { modo: 'pendulo', tipo: 'oscila', C, M, L, b, d, I, periodo: T, Leq, wmax, th0, pasos, mov: enT(P), T: 2 * T };
  }

  /* ---------- Equilibrio estático ---------- */
  // escalera: { tipo: 'escalera', M, L, theta (con el suelo), m (persona), s (a lo largo), mu (suelo), g }; pared lisa
  // viga: { tipo: 'viga', M, L, xA, xB, cargas: 'x m; x m', g }
  function equilibrio(sc) {
    const g = lee(sc, 'g', 'la gravedad'), M = lee(sc, 'M', 'la masa', { cero: true }), L = lee(sc, 'L', 'la longitud');
    const pasos = [];
    if (sc.tipo === 'viga') {
      const xA = lee(sc, 'xA', 'la posición del apoyo A', { libre: true }), xB = lee(sc, 'xB', 'la posición del apoyo B', { libre: true });
      if (xA === xB) throw new Error('Los dos apoyos no pueden estar en el mismo sitio');
      for (const x of [xA, xB]) if (x < 0 || x > L) throw new Error('Los apoyos tienen que estar sobre la viga (entre 0 y L)');
      const cargas = String(sc.cargas || '').split(/;|\n/).map((x) => x.trim()).filter(Boolean).map((c, i) => {
        const [x, m] = c.split(/\s+/).map(leeNum);
        if (!isFinite(x) || !isFinite(m) || m < 0) throw new Error(`Carga ${i + 1}: escribe «posición masa» con números (masa positiva)`);
        if (x < 0 || x > L) throw new Error(`Carga ${i + 1}: tiene que estar sobre la viga`);
        return { x, m };
      });
      const todas = [{ x: L / 2, m: M, nom: 'peso de la viga' }, ...cargas.map((c, i) => ({ ...c, nom: `carga ${i + 1}` }))].filter((c) => c.m > 0);
      const W = todas.reduce((s, c) => s + c.m * g, 0), mA = todas.reduce((s, c) => s + c.m * g * (c.x - xA), 0);
      const RB = mA / (xB - xA), RA = W - RB;
      pasos.push({ t: 'Momentos respecto al apoyo A', html: `$Σ τ_A = 0$: ${todas.map((c) => `${f(c.m * g)} · (${f(c.x)} − ${f(xA)})`).join(' + ')} $= R_B (${f(xB)} − ${f(xA)})$ ⇒ <b>R<sub>B</sub> = ${f(RB)} N</b>` });
      pasos.push({ t: 'Fuerzas verticales', html: `$R_A + R_B = Σ m g$ = ${f(W)} N ⇒ <b>R<sub>A</sub> = ${f(RA)} N</b>` });
      const vuelca = RA < -1e-9 || RB < -1e-9;
      if (vuelca) pasos.push({ t: '¡Vuelca!', html: `Un apoyo tendría que tirar hacia abajo (reacción negativa): la viga gira alrededor del apoyo ${RA < 0 ? 'B' : 'A'} y vuelca, salvo que esté anclada.` });
      return { modo: 'equilibrio', tipo: 'viga', M, L, xA, xB, cargas, todas, RA, RB, vuelca, pasos };
    }
    const th = lee(sc, 'theta', 'el ángulo con el suelo', { max: 89.9 }), m = lee(sc, 'm', 'la masa de la persona', { cero: true, opcional: true }) ?? 0, s = lee(sc, 's', 'dónde está la persona', { cero: true, opcional: true }) ?? 0;
    const mu = lee(sc, 'mu', 'el rozamiento con el suelo', { cero: true, opcional: true });
    if (s > L) throw new Error('La persona tiene que estar en la escalera (s ≤ L)');
    const t = th * RAD, N1 = (M + m) * g, N2 = (g * Math.cos(t) * (M * L / 2 + m * s)) / (L * Math.sin(t)), Fr = N2, muMin = Fr / N1;
    pasos.push({ t: 'Fuerzas', html: `Pared lisa: solo empuja en horizontal, $N_2$. Suelo: normal $N_1$ y rozamiento $F_r$ hacia la pared.<br>Verticales: $N_1 = (M + m) g$ = <b>${f(N1)} N</b> &nbsp; Horizontales: $F_r = N_2$` });
    pasos.push({ t: 'Momentos respecto al pie de la escalera', html: `$N_2 L sen θ = M g L/2 cos θ + m g s cos θ ⇒ N_2 = {g cos θ (M L/2 + m s)}/{L sen θ}$ = <b>${f(N2)} N</b> = $F_r$` });
    pasos.push({ t: '¿Resbala?', html: `Hace falta $μ ≥ F_r/N_1$ = <b>${f(muMin)}</b>${mu !== null ? `; con μ = ${f(mu)} ${mu >= muMin ? '<b>no resbala</b>' : '<b>resbala</b>'}` : ''}.` });
    let sMax = null;
    if (mu !== null && m > 0) {
      sMax = (mu * N1 * L * Math.tan(t)) / g / m - (M * L) / (2 * m);
      pasos.push({ t: '¿Hasta dónde puede subir?', html: `Con $F_r = μ N_1$: $s_máx = {μ N_1 L tg θ}/{m g} − {M L}/{2m}$ = ${f(sMax)} m ⇒ ${sMax >= L ? '<b>puede subir hasta arriba</b>' : sMax <= 0 ? '<b>resbala nada más subir</b>' : `<b>puede subir ${f(sMax)} m</b> de ${f(L)} m`}.` });
    }
    return { modo: 'equilibrio', tipo: 'escalera', M, L, th, m, s, mu, N1, N2, Fr, muMin, resbala: mu !== null && mu < muMin, sMax, pasos };
  }

  function resolver(sc) {
    const fn = { rodadura, polea, momento, compuesto, choque, pendulo, equilibrio }[sc.modo];
    return fn ? fn(sc) : inercia(sc);
  }

  const G = '9,8';
  const ejemplos = [
    { clave: 'varilla-extremo', nombre: 'Varilla que gira por un extremo (Steiner)', sc: { modo: 'inercia', cuerpo: 'varilla', M: '2', L: '1,2', d: '0,6' } },
    { clave: 'disco', nombre: 'Disco por su eje', sc: { modo: 'inercia', cuerpo: 'cilindro', M: '5', L: '0,3', d: '' } },
    { clave: 'placa', nombre: 'Placa rectangular', sc: { modo: 'inercia', cuerpo: 'placa', M: '3', L: '0,4', b: '0,3', d: '' } },
    { clave: 'pendulo-compuesto', nombre: 'Compuesto: varilla con una esfera en la punta', sc: { modo: 'compuesto', piezas: 'varilla 1 0,8 0,4\nesfera 2 0,1 0,9' } },
    { clave: 'mancuerna', nombre: 'Compuesto: dos masas unidas por una barra', sc: { modo: 'compuesto', piezas: 'punto 1 0,25\npunto 1 0,25\nvarilla 0,2 0,5 0' } },
    { clave: 'esfera-rueda', nombre: 'Esfera que rueda por un plano', sc: { modo: 'rodadura', cuerpo: 'esfera', g: G, M: '2', L: '0,1', theta: '30', d: '3', mu: '0,2' } },
    { clave: 'aro-desliza', nombre: 'Aro con poco rozamiento', sc: { modo: 'rodadura', cuerpo: 'aro', g: G, M: '1', L: '0,2', theta: '40', d: '2', mu: '0,3' } },
    { clave: 'polea', nombre: 'Polea maciza con un cuerpo colgando', sc: { modo: 'polea', cuerpo: 'cilindro', g: G, M: '4', L: '0,15', m: '2', d: '1,5' } },
    { clave: 'patinadora', nombre: 'Patinadora que encoge los brazos', sc: { modo: 'momento', I1: '4,5', w1: '60', I2: '1,5', unidad: 'rpm' } },
    { clave: 'bala-varilla', nombre: 'Bala que se incrusta en una varilla colgada', sc: { modo: 'choque', tipo: 'bala', g: G, M: '2', L: '1', m: '0,01', v: '300', r: '0,8' } },
    { clave: 'plataforma', nombre: 'Niño que salta a un tiovivo', sc: { modo: 'choque', tipo: 'plataforma', M: '200', L: '2', w1: '10', m: '30', v: '3', r: '2' } },
    { clave: 'pendulo-fisico', nombre: 'Péndulo físico: varilla colgada de un extremo', sc: { modo: 'pendulo', tipo: 'oscila', cuerpo: 'varilla', g: G, M: '1', L: '1', d: '0,5', th0: '20' } },
    { clave: 'aro-clavo', nombre: 'Aro colgado de un clavo', sc: { modo: 'pendulo', tipo: 'oscila', cuerpo: 'aro', g: G, M: '0,5', L: '0,2', d: '0,2', th0: '10' } },
    { clave: 'varilla-cae', nombre: 'Varilla vertical que cae girando por su base', sc: { modo: 'pendulo', tipo: 'cae', cuerpo: 'varilla', g: G, M: '1', L: '1,5', d: '0,75', th0: '0', th: '90' } },
    { clave: 'escalera', nombre: 'Escalera apoyada en una pared lisa', sc: { modo: 'equilibrio', tipo: 'escalera', g: G, M: '10', L: '4', theta: '60', m: '70', s: '3', mu: '0,4' } },
    { clave: 'viga', nombre: 'Viga sobre dos apoyos con cargas', sc: { modo: 'equilibrio', tipo: 'viga', g: G, M: '50', L: '6', xA: '0', xB: '4', cargas: '6 30; 2 80' } },
  ];

  return { resolver, inercia, compuesto, rodadura, polea, momento, choque, pendulo, equilibrio, CUERPOS, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Solido;
