/* =====================================================================
   Inducción electromagnética, leyes de Faraday y Lenz (sin DOM): barra
   que se desliza sobre unos raíles, espira que gira en un campo
   (alternador), flujo que cambia en un tiempo y espira que atraviesa
   una región con campo. ε = −N dΦ/dt, todo en el SI.
   El sentido de la corriente es el que se ve en el dibujo, con B
   entrante (⊗, hacia dentro de la pantalla) o saliente (⊙).
   ===================================================================== */
const Faraday = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-60) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function num(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${cero ? 'positivo o 0' : 'mayor que 0'}`);
    return v;
  }
  const entero = (sc, k, nom) => { const v = vacio(sc[k]) ? 1 : num(sc, k, nom); if (!Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número entero`); return v; };
  const SIMB = { entrante: '⊗ entrante', saliente: '⊙ saliente' };
  // el flujo entrante que aumenta induce un campo saliente: corriente antihoraria
  const sentido = (B, crece) => ((B === 'saliente') === crece ? 'horario' : 'antihorario');

  // superficie de la espira: círculo de radio r, rectángulo a×b o S directa
  function superficie(sc, pasos) {
    if (sc.forma === 'circulo') { const r = num(sc, 'r', 'el radio'); const S = Math.PI * r * r; pasos.push({ t: 'Superficie de la espira', html: `S = πr<sup>2</sup> = π·${f(r)}<sup>2</sup> = <b>${f(S)} m<sup>2</sup></b>` }); return { S, r }; }
    if (sc.forma === 'rectangulo') { const a = num(sc, 'a', 'el lado a'), b = num(sc, 'b', 'el lado b'); const S = a * b; pasos.push({ t: 'Superficie de la espira', html: `S = a·b = ${f(a)}·${f(b)} = <b>${f(S)} m<sup>2</sup></b>` }); return { S, a, b }; }
    return { S: num(sc, 'S', 'la superficie') };
  }

  /* ---------- Barra sobre raíles ---------- */
  // sc: { B, sentidoB, L, v (con signo: + hacia la derecha), R }
  function barra(sc) {
    const B = num(sc, 'B', 'el campo B'), L = num(sc, 'L', 'la longitud de la barra'), v = num(sc, 'v', 'la velocidad', { signo: true }), R = num(sc, 'R', 'la resistencia', { opcional: true });
    if (v === 0) throw new Error('Con la barra quieta el flujo no cambia y no hay fem inducida');
    const eps = B * L * Math.abs(v), crece = v > 0, sen = sentido(sc.sentidoB, crece);
    const pasos = [
      { t: 'Flujo a través del circuito', html: `El circuito es el rectángulo que cierran los raíles con la barra; si la barra está a una distancia x, Φ = B·L·x y, como dx/dt = v, dΦ/dt = BLv. La barra se mueve hacia la ${crece ? 'derecha: el área y el flujo aumentan' : 'izquierda: el área y el flujo disminuyen'}.` },
      { t: 'Ley de Faraday', html: `|ε| = |dΦ/dt| = B L v = ${f(B)}·${f(L)}·${f(Math.abs(v))} = <b>${f(eps)} V</b>` },
      { t: 'Ley de Lenz', html: `El flujo ${SIMB[sc.sentidoB].split(' ')[1]} ${crece ? 'aumenta' : 'disminuye'}, así que la corriente inducida crea un campo ${crece !== (sc.sentidoB === 'saliente') ? 'saliente' : 'entrante'} dentro del circuito: circula en sentido <b>${sen}</b> (en la barra, hacia ${sen === 'antihorario' ? 'arriba' : 'abajo'}).` },
    ];
    let I = null, F = null, P = null;
    if (R) {
      I = eps / R; F = B * I * L; P = eps * I;
      pasos.push({ t: 'Corriente inducida', html: `I = ε/R = ${f(eps)} / ${f(R)} = <b>${f(I)} A</b>` });
      pasos.push({ t: 'Fuerza sobre la barra', html: `F = I L B = ${f(I)}·${f(L)}·${f(B)} = <b>${f(F)} N</b> = B<sup>2</sup>L<sup>2</sup>v/R, opuesta a la velocidad (hacia la ${crece ? 'izquierda' : 'derecha'}). Para mantener v constante hay que empujar con una fuerza igual y de sentido contrario.` });
      pasos.push({ t: 'Potencia', html: `P = F v = ε I = ε<sup>2</sup>/R = <b>${f(P)} W</b>: la potencia mecánica del que empuja se disipa en la resistencia por efecto Joule.` });
    }
    return { modo: 'barra', B, L, v, R, eps, I, F, P, sentido: sen, sentidoB: sc.sentidoB, pasos };
  }

  /* ---------- Espira que gira (alternador) ---------- */
  // sc: { N, B, forma, r | a, b | S, w, uw: 'Hz'|'rpm'|'rad/s', R, t (opcional) }
  function giratoria(sc) {
    const pasos = [], N = entero(sc, 'N', 'el número de espiras'), B = num(sc, 'B', 'el campo B'), sup = superficie(sc, pasos), S = sup.S;
    const x = num(sc, 'w', 'la velocidad de giro'), uw = sc.uw || 'Hz';
    const w = uw === 'rad/s' ? x : uw === 'rpm' ? (2 * Math.PI * x) / 60 : 2 * Math.PI * x, fr = w / (2 * Math.PI);
    if (uw !== 'rad/s') pasos.push({ t: 'Velocidad angular', html: `ω = 2π${uw === 'rpm' ? `·${f(x)}/60` : `f = 2π·${f(x)}`} = <b>${f(w)} rad/s</b>${uw === 'rpm' ? ` (f = ${f(fr)} Hz)` : ''}` });
    const Fm = N * B * S, em = Fm * w, ef = em / Math.SQRT2, R = num(sc, 'R', 'la resistencia', { opcional: true });
    pasos.push({ t: 'Flujo', html: `Si en t = 0 la normal de la espira es paralela a B, el ángulo es θ = ωt y Φ(t) = N B S cos(ωt), con Φ<sub>máx</sub> = N B S = ${N}·${f(B)}·${f(S)} = <b>${f(Fm)} Wb</b>` });
    pasos.push({ t: 'Ley de Faraday', html: `ε(t) = −dΦ/dt = N B S ω sen(ωt) ⇒ ε<sub>máx</sub> = ${f(Fm)}·${f(w)} = <b>${f(em)} V</b>; valor eficaz ε<sub>ef</sub> = ε<sub>máx</sub>/√2 = <b>${f(ef)} V</b>. La fem es alterna, de frecuencia ${f(fr)} Hz.` });
    let Im = null, Pm = null, et = null;
    const t = num(sc, 't', 'el instante t', { opcional: true, cero: true });
    if (t !== null) { et = em * Math.sin(w * t); pasos.push({ t: `En t = ${f(t)} s`, html: `ε = ${f(em)}·sen(${f(w)}·${f(t)}) = <b>${f(et)} V</b>; Φ = ${f(Fm * Math.cos(w * t))} Wb` }); }
    if (R) { Im = em / R; Pm = (ef * ef) / R; pasos.push({ t: 'Con una resistencia R', html: `I<sub>máx</sub> = ε<sub>máx</sub>/R = <b>${f(Im)} A</b>, I<sub>ef</sub> = ${f(Im / Math.SQRT2)} A; potencia media P = ε<sub>ef</sub><sup>2</sup>/R = <b>${f(Pm)} W</b>` }); pasos.push({ t: 'Par para mantener el giro', html: `El campo frena la bobina con un par M = Φ<sub>máx</sub> I sen(ωt) = ε I/ω. Para que gire a ω constante hay que aplicar un par medio M<sub>media</sub> = P/ω = ${f(Pm)} / ${f(w)} = <b>${f(Pm / w)} N·m</b> (máximo ${f((em * Im) / w)} N·m). En cada vuelta se disipan P·T = <b>${f(Pm / fr)} J</b>.` }); }
    return { modo: 'giratoria', N, B, S, w, fr, Fm, em, ef, R, Im, Pm, par: Pm === null ? null : Pm / w, t, et, pasos };
  }

  /* ---------- Flujo que cambia en un intervalo ---------- */
  // sc: { N, forma…, B1, B2, th1, th2 (grados entre B y la normal), dt, sentidoB, R }
  function flujo(sc) {
    const pasos = [], N = entero(sc, 'N', 'el número de espiras'), sup = superficie(sc, pasos), S = sup.S;
    const B1 = num(sc, 'B1', 'el campo inicial', { signo: true }), B2 = vacio(sc.B2) ? B1 : num(sc, 'B2', 'el campo final', { signo: true });
    const th1 = vacio(sc.th1) ? 0 : num(sc, 'th1', 'el ángulo inicial', { signo: true }), th2 = vacio(sc.th2) ? th1 : num(sc, 'th2', 'el ángulo final', { signo: true });
    const dt = num(sc, 'dt', 'el intervalo de tiempo'), R = num(sc, 'R', 'la resistencia', { opcional: true });
    const cosG = (th) => { const c = Math.cos((th * Math.PI) / 180); return Math.abs(c) < 1e-12 ? 0 : c; }, c1 = cosG(th1), c2 = cosG(th2);
    const F1 = N * B1 * S * c1, F2 = N * B2 * S * c2, dF = F2 - F1;
    if (Math.abs(dF) < 1e-15 * (Math.abs(F1) + Math.abs(F2) + 1e-30)) throw new Error('El flujo no cambia: ni el campo ni el ángulo varían, así que no hay fem inducida');
    const cos = (th, c) => (th ? `cos ${f(th)}°` : '1');
    pasos.push({ t: 'Flujo inicial y final', html: `Φ = N B S cos θ (θ, ángulo entre B y la normal)<br>Φ<sub>1</sub> = ${N}·${f(B1)}·${f(S)}·${cos(th1, c1)} = <b>${f(F1)} Wb</b>, &nbsp; Φ<sub>2</sub> = ${N}·${f(B2)}·${f(S)}·${cos(th2, c2)} = <b>${f(F2)} Wb</b>` });
    const em = -dF / dt;
    pasos.push({ t: 'Fem media (Faraday)', html: `ε = −ΔΦ/Δt = −(${f(F2)} − ${f(F1)}) / ${f(dt)} = <b>${f(em)} V</b>` });
    const sen = sentido(sc.sentidoB, dF > 0);
    pasos.push({ t: 'Ley de Lenz', html: `El flujo ${SIMB[sc.sentidoB].split(' ')[1]} ${dF > 0 ? 'aumenta' : 'disminuye'}: la corriente inducida crea un campo ${(dF > 0) !== (sc.sentidoB === 'saliente') ? 'saliente' : 'entrante'} que se opone al cambio, así que circula en sentido <b>${sen}</b> visto desde el lado de la pantalla.` });
    let I = null, q = null;
    if (R) { I = Math.abs(em) / R; q = Math.abs(dF) / R; pasos.push({ t: 'Corriente y carga', html: `I = |ε|/R = ${f(Math.abs(em))} / ${f(R)} = <b>${f(I)} A</b>; carga que pasa: q = |ΔΦ|/R = <b>${f(q)} C</b> (no depende de lo deprisa que cambie el flujo)` }); }
    return { modo: 'flujo', N, S, B1, B2, th1, th2, dt, F1, F2, dF, em, R, I, q, sentido: sen, sentidoB: sc.sentidoB, forma: sc.forma, pasos };
  }

  /* ---------- Espira que atraviesa una región con campo ---------- */
  // sc: { N, a (lado), D (anchura de la región), v, B, sentidoB, R }
  function cruza(sc) {
    const N = entero(sc, 'N', 'el número de espiras'), a = num(sc, 'a', 'el lado de la espira'), D = num(sc, 'D', 'la anchura de la región'), v = num(sc, 'v', 'la velocidad'), B = num(sc, 'B', 'el campo B'), R = num(sc, 'R', 'la resistencia', { opcional: true });
    const eps = N * B * a * v, m = Math.min(a, D), M = Math.max(a, D);
    const t1 = m / v, t2 = M / v, t3 = (a + D) / v;
    const tramos = [
      { t0: 0, t1, eps, sentido: sentido(sc.sentidoB, true), q: 'entra' },
      { t0: t1, t1: t2, eps: 0, sentido: null, q: a <= D ? 'dentro' : 'tapa' },
      { t0: t2, t1: t3, eps: -eps, sentido: sentido(sc.sentidoB, false), q: 'sale' },
    ];
    const pasos = [
      { t: 'Flujo según la posición', html: `Si x es lo que ha entrado el lado delantero, Φ = N B a·(parte de la espira dentro del campo). Mientras entra, Φ = N B a x crece; con ${a <= D ? 'la espira entera dentro' : 'la región entera tapada por la espira'} no cambia (Φ<sub>máx</sub> = N B a·${f(m)} = ${f(N * B * a * m)} Wb), y mientras sale decrece.` },
      { t: 'Fem al entrar y al salir', html: `|ε| = N B a v = ${N}·${f(B)}·${f(a)}·${f(v)} = <b>${f(eps)} V</b> durante t = ${f(t1)} s al entrar y otros ${f(t1)} s al salir; ε = 0 ${t2 > t1 ? `durante los ${f(t2 - t1)} s intermedios` : 'en el instante intermedio'}.` },
      { t: 'Ley de Lenz', html: `Al entrar el flujo ${SIMB[sc.sentidoB].split(' ')[1]} aumenta: corriente en sentido <b>${tramos[0].sentido}</b>. Al salir disminuye: sentido <b>${tramos[2].sentido}</b>.` },
    ];
    let I = null, F = null, Q = null;
    if (R) {
      I = eps / R; F = N * B * I * a; Q = 2 * eps * I * t1;
      pasos.push({ t: 'Corriente, fuerza y calor', html: `I = ε/R = <b>${f(I)} A</b>; mientras entra o sale, el campo frena la espira con F = N I a B = <b>${f(F)} N</b> (hacia atrás). Calor total disipado: Q = 2·ε I·${f(t1)} s = <b>${f(Q)} J</b>` });
    }
    return { modo: 'cruza', N, a, D, v, B, R, eps, I, F, Q, tramos, t3, sentidoB: sc.sentidoB, pasos };
  }


  const MU0 = 4e-7 * Math.PI;

  /* ---------- Hilo recto y espira rectangular ---------- */
  // sc: { I, sentidoI: 'arriba'|'abajo', d, w (perpendicular al hilo), h (paralelo), N, v (+ se aleja), dIdt, R }
  // el hilo es vertical a la izquierda de la espira; con la corriente hacia arriba, B es entrante en la espira
  function hilo(sc) {
    const I = num(sc, 'I', 'la corriente del hilo', { signo: true, cero: true }), d = num(sc, 'd', 'la distancia del hilo a la espira'), w = num(sc, 'w', 'el ancho de la espira'), h = num(sc, 'h', 'el alto de la espira'), N = entero(sc, 'N', 'el número de espiras');
    const v = num(sc, 'v', 'la velocidad', { opcional: true, signo: true }) ?? 0, dI = num(sc, 'dIdt', 'dI/dt', { opcional: true, signo: true }) ?? 0, R = num(sc, 'R', 'la resistencia', { opcional: true });
    const sentidoB = (sc.sentidoI === 'abajo') === (I >= 0) ? 'saliente' : 'entrante', ln = Math.log((d + w) / d), k = (MU0 * N * h) / (2 * Math.PI);
    const Phi = k * Math.abs(I) * ln, dPhi = k * (Math.sign(I || 1) * dI * ln + Math.abs(I) * v * (1 / (d + w) - 1 / d));
    const pasos = [
      { t: 'Campo del hilo', html: `B(x) = μ<sub>0</sub> I / (2π x), a una distancia x del hilo; en la espira es <b>${SIMB[sentidoB]}</b> (regla de la mano derecha) y no es uniforme: hay que integrar.` },
      { t: 'Flujo en la espira', html: `Φ = N ∫<sub>d</sub><sup>d+w</sup> μ<sub>0</sub> I h / (2π x) dx = μ<sub>0</sub> N I h ln((d + w)/d) / (2π) = 2·10<sup>−7</sup>·${N}·${f(Math.abs(I))}·${f(h)}·ln(${f((d + w) / d)}) = <b>${f(Phi)} Wb</b>` },
    ];
    if (!v && !dI) throw new Error('Escribe la velocidad de la espira o cómo cambia la corriente (dI/dt): si nada cambia no hay fem');
    const partes = [];
    if (dI) partes.push(`por la corriente que cambia: μ<sub>0</sub> N h ln((d + w)/d)/(2π) · dI/dt = ${f(k * ln)}·${f(dI)} = ${f(k * ln * dI * Math.sign(I || 1))} Wb/s`);
    if (v) partes.push(`por el movimiento: con x = d, dx/dt = v, dΦ/dt = μ<sub>0</sub> N I h/(2π) · (1/(d + w) − 1/d) v = −μ<sub>0</sub> N I h w v / (2π d (d + w)) = ${f(Math.abs(I) * k * v * (1 / (d + w) - 1 / d))} Wb/s`);
    pasos.push({ t: 'Ritmo de cambio del flujo', html: partes.join('<br>') + (partes.length > 1 ? `<br>En total dΦ/dt = ${f(dPhi)} Wb/s` : '') });
    const eps = Math.abs(dPhi), crece = dPhi > 0, sen = sentido(sentidoB, crece);
    pasos.push({ t: 'Ley de Faraday', html: `|ε| = |dΦ/dt| = <b>${f(eps)} V</b>${v ? ` (en el instante en que la espira está a d = ${f(d)} m)` : ''}` });
    pasos.push({ t: 'Ley de Lenz', html: `El flujo ${SIMB[sentidoB].split(' ')[1]} ${crece ? 'aumenta' : 'disminuye'}: la corriente inducida circula en sentido <b>${sen}</b>.` });
    let Ii = null, F = null;
    if (R) {
      Ii = eps / R; pasos.push({ t: 'Corriente inducida', html: `I<sub>ind</sub> = ε/R = <b>${f(Ii)} A</b>` });
      F = (MU0 * Math.abs(I) * Ii * h * N / (2 * Math.PI)) * (1 / d - 1 / (d + w));
      pasos.push({ t: 'Fuerza sobre la espira', html: `Los lados paralelos al hilo llevan corrientes opuestas y están en campos distintos: F = μ<sub>0</sub> N I I<sub>ind</sub> h/(2π) · (1/d − 1/(d + w)) = <b>${f(F)} N</b>, que se opone al cambio (${crece ? 'empuja la espira lejos del hilo' : 'tira de la espira hacia el hilo'}).` });
    }
    return { modo: 'hilo', I, d, w, h, N, v, dI, R, Phi, dPhi, eps, Ii, F, sentido: sen, sentidoB, pasos };
  }

  /* ---------- Campo que cambia con una función del tiempo ---------- */
  // sc: { N, forma…, tipoB: 'lineal'|'cuadratica'|'seno'|'exp', B0, k, w, tau, th, t, sentidoB, R }
  const FUNCB = {
    lineal: { nombre: 'B = B₀ + k t', B: (p, t) => p.B0 + p.k * t, dB: (p) => p.k, tex: (p) => `B(t) = ${f(p.B0)} + ${f(p.k)} t`, dtex: (p) => `dB/dt = k = ${f(p.k)} T/s` },
    cuadratica: { nombre: 'B = B₀ + k t²', B: (p, t) => p.B0 + p.k * t * t, dB: (p, t) => 2 * p.k * t, tex: (p) => `B(t) = ${f(p.B0)} + ${f(p.k)} t<sup>2</sup>`, dtex: (p) => `dB/dt = 2 k t = ${f(2 * p.k)} t` },
    seno: { nombre: 'B = B₀ sen(ωt)', B: (p, t) => p.B0 * Math.sin(p.w * t), dB: (p, t) => p.B0 * p.w * Math.cos(p.w * t), tex: (p) => `B(t) = ${f(p.B0)} sen(${f(p.w)} t)`, dtex: (p) => `dB/dt = B<sub>0</sub> ω cos(ωt) = ${f(p.B0 * p.w)} cos(${f(p.w)} t)` },
    exp: { nombre: 'B = B₀ e^(−t/τ)', B: (p, t) => p.B0 * Math.exp(-t / p.tau), dB: (p, t) => (-p.B0 / p.tau) * Math.exp(-t / p.tau), tex: (p) => `B(t) = ${f(p.B0)} e<sup>−t/${f(p.tau)}</sup>`, dtex: (p) => `dB/dt = −(B<sub>0</sub>/τ) e<sup>−t/τ</sup> = ${f(-p.B0 / p.tau)} e<sup>−t/${f(p.tau)}</sup>` },
  };
  function funcion(sc) {
    const pasos = [], N = entero(sc, 'N', 'el número de espiras'), sup = superficie(sc, pasos), S = sup.S, tipo = FUNCB[sc.tipoB] ? sc.tipoB : 'lineal', Fb = FUNCB[tipo];
    const p = { B0: num(sc, 'B0', 'B₀', { signo: true, cero: true }) };
    if (tipo === 'lineal' || tipo === 'cuadratica') p.k = num(sc, 'k', 'la constante k', { signo: true });
    if (tipo === 'seno') p.w = num(sc, 'w', 'la frecuencia angular ω');
    if (tipo === 'exp') p.tau = num(sc, 'tau', 'la constante de tiempo τ');
    if (tipo === 'seno' && !p.B0) throw new Error('Con B₀ = 0 el campo no cambia');
    const th = vacio(sc.th) ? 0 : num(sc, 'th', 'el ángulo θ', { signo: true, cero: true }), c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180);
    if (!c) throw new Error('Con θ = 90° el campo es paralelo a la espira y no hay flujo');
    const t = num(sc, 't', 'el instante t', { cero: true }), R = num(sc, 'R', 'la resistencia', { opcional: true });
    const Bt = Fb.B(p, t), dBt = Fb.dB(p, t), Phi = N * Bt * S * c, eps = -N * S * c * dBt, cc = th ? ` cos ${f(th)}°` : '';
    pasos.push({ t: 'Campo', html: `${Fb.tex(p)} (en T, con t en s)` });
    pasos.push({ t: 'Flujo', html: `Φ(t) = N B(t) S cos θ = ${N}·${f(S)}${cc}·B(t); en t = ${f(t)} s, B = ${f(Bt)} T y Φ = <b>${f(Phi)} Wb</b>` });
    pasos.push({ t: 'Ley de Faraday', html: `ε(t) = −dΦ/dt = −N S cos θ · dB/dt, con ${Fb.dtex(p)}<br>En t = ${f(t)} s: ε = −${N}·${f(S)}${cc}·${f(dBt)} = <b>${f(eps)} V</b>` });
    const crece = Bt >= 0 ? dBt > 0 : dBt < 0, Bpos = (Bt >= 0) === (sc.sentidoB !== 'saliente') ? 'entrante' : 'saliente';
    let sen = null;
    if (Math.abs(dBt) > 1e-15) { sen = sentido(Bpos, Math.abs(Bt) < 1e-15 ? true : crece); pasos.push({ t: 'Ley de Lenz', html: `En ese instante el flujo ${Math.abs(Bt) < 1e-15 ? 'empieza a crecer' : crece ? 'aumenta' : 'disminuye'}: la corriente inducida circula en sentido <b>${sen}</b> visto desde la pantalla.` }); }
    else pasos.push({ t: 'Ley de Lenz', html: 'En ese instante el flujo no cambia: no hay corriente inducida.' });
    let I = null;
    if (R) { I = eps / R; pasos.push({ t: 'Corriente', html: `I = ε/R = <b>${f(I)} A</b>` }); }
    return { modo: 'funcion', tipo, p, N, S, c, th, t, Bt, Phi, eps, R, I, sentido: sen, sentidoB: Bpos, forma: sc.forma, Bf: (x) => Fb.B(p, x), Ef: (x) => -N * S * c * Fb.dB(p, x), pasos };
  }

  /* ---------- Barra con masa: frenado magnético y velocidad límite ---------- */
  // sc: { caso: 'fuerza'|'cae'|'lanzada', B, L, R, m, F, v0, t }
  function dinamica(sc) {
    const caso = ['fuerza', 'cae', 'lanzada'].includes(sc.caso) ? sc.caso : 'fuerza', B = num(sc, 'B', 'el campo B'), L = num(sc, 'L', 'la longitud de la barra'), R = num(sc, 'R', 'la resistencia'), m = num(sc, 'm', 'la masa de la barra');
    const g = 9.8, Fx = caso === 'fuerza' ? num(sc, 'F', 'la fuerza') : caso === 'cae' ? m * g : 0, v0 = caso === 'lanzada' ? num(sc, 'v0', 'la velocidad inicial') : 0;
    const t = num(sc, 't', 'el instante t', { opcional: true, cero: true }), b = (B * B * L * L) / R, tau = m / b, vL = Fx / b;
    const v = (x) => vL + (v0 - vL) * Math.exp(-x / tau), pasos = [];
    pasos.push({ t: 'Fuerza magnética', html: `Con velocidad v la fem es ε = B L v, la corriente I = B L v / R y el campo frena la barra con F<sub>m</sub> = I L B = B<sup>2</sup>L<sup>2</sup>v/R = ${f(b)}·v N.` });
    if (caso === 'lanzada') pasos.push({ t: 'Ecuación del movimiento', html: `m dv/dt = −B<sup>2</sup>L<sup>2</sup>v/R ⇒ v(t) = v<sub>0</sub> e<sup>−t/τ</sup>, con τ = m R/(B<sup>2</sup>L<sup>2</sup>) = <b>${f(tau)} s</b>.` });
    else pasos.push({ t: 'Ecuación del movimiento', html: `m dv/dt = ${caso === 'cae' ? 'm g' : 'F'} − B<sup>2</sup>L<sup>2</sup>v/R ⇒ v(t) = v<sub>L</sub>(1 − e<sup>−t/τ</sup>), con τ = m R/(B<sup>2</sup>L<sup>2</sup>) = <b>${f(tau)} s</b>.` });
    if (caso !== 'lanzada') pasos.push({ t: 'Velocidad límite', html: `Cuando la fuerza magnética iguala ${caso === 'cae' ? 'al peso' : 'a la fuerza aplicada'}: B<sup>2</sup>L<sup>2</sup>v<sub>L</sub>/R = ${caso === 'cae' ? 'm g' : 'F'} ⇒ v<sub>L</sub> = ${caso === 'cae' ? 'm g' : 'F'} R/(B<sup>2</sup>L<sup>2</sup>) = ${f(Fx)}·${f(R)}/(${f(B)}<sup>2</sup>·${f(L)}<sup>2</sup>) = <b>${f(vL)} m/s</b>. Entonces toda la potencia ${caso === 'cae' ? 'del peso' : 'de la fuerza'} (${f(Fx * vL)} W) se disipa en la resistencia.` });
    else pasos.push({ t: 'Distancia hasta pararse', html: `x = ∫ v dt = v<sub>0</sub> τ = ${f(v0)}·${f(tau)} = <b>${f(v0 * tau)} m</b>; toda la energía cinética, ½ m v<sub>0</sub><sup>2</sup> = ${f(0.5 * m * v0 * v0)} J, acaba como calor en la resistencia.` });
    let vt = null, It = null;
    if (t !== null) { vt = v(t); It = (B * L * vt) / R; pasos.push({ t: `En t = ${f(t)} s`, html: `v = ${caso === 'lanzada' ? `${f(v0)} e<sup>−${f(t)}/${f(tau)}</sup>` : `${f(vL)}(1 − e<sup>−${f(t)}/${f(tau)}</sup>)`} = <b>${f(vt)} m/s</b>; ε = B L v = ${f(B * L * vt)} V e I = <b>${f(It)} A</b>` }); }
    return { modo: 'dinamica', caso, B, L, R, m, Fx, v0, tau, vL, t, vt, It, vf: v, pasos };
  }

  /* ---------- Varilla o disco que gira (disco de Faraday) ---------- */
  // sc: { cuerpo: 'varilla'|'disco', B, L, w, uw, R }
  function gira(sc) {
    const pasos = [], disco = sc.cuerpo === 'disco', B = num(sc, 'B', 'el campo B'), L = num(sc, 'L', disco ? 'el radio del disco' : 'la longitud de la varilla');
    const x = num(sc, 'w', 'la velocidad de giro'), uw = sc.uw || 'rad/s', w = uw === 'rad/s' ? x : uw === 'rpm' ? (2 * Math.PI * x) / 60 : 2 * Math.PI * x, R = num(sc, 'R', 'la resistencia', { opcional: true });
    if (uw !== 'rad/s') pasos.push({ t: 'Velocidad angular', html: `ω = 2π${uw === 'rpm' ? `·${f(x)}/60` : `·${f(x)}`} = <b>${f(w)} rad/s</b>` });
    const eps = 0.5 * B * w * L * L;
    pasos.push({ t: 'Fem de movimiento', html: `Un trozo dr a una distancia r del eje va a v = ω r, así que dε = B v dr = B ω r dr. Integrando ${disco ? 'del eje al borde' : 'a lo largo de la varilla'}: ε = ∫<sub>0</sub><sup>${disco ? 'R' : 'L'}</sup> B ω r dr = ½ B ω ${disco ? 'R' : 'L'}<sup>2</sup> = ½·${f(B)}·${f(w)}·${f(L)}<sup>2</sup> = <b>${f(eps)} V</b>` });
    pasos.push({ t: 'Otra forma: el área barrida', html: `En un tiempo dt ${disco ? 'cada radio' : 'la varilla'} barre un sector de área ½ ${disco ? 'R' : 'L'}<sup>2</sup> ω dt, así que dΦ/dt = ½ B ω ${disco ? 'R' : 'L'}<sup>2</sup>: el mismo resultado.${disco ? ' La fem aparece entre el eje y el borde del disco, que se conectan con escobillas.' : ''}` });
    let I = null, P = null;
    if (R) { I = eps / R; P = eps * I; pasos.push({ t: 'Con una resistencia R', html: `I = ε/R = <b>${f(I)} A</b>; potencia P = ε I = <b>${f(P)} W</b> y el par que hay que hacer para mantener el giro, M = P/ω = <b>${f(P / w)} N·m</b>` }); }
    return { modo: 'gira', cuerpo: disco ? 'disco' : 'varilla', B, L, w, eps, R, I, P, sentidoB: sc.sentidoB, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'giratoria') return giratoria(sc);
    if (sc.modo === 'flujo') return flujo(sc);
    if (sc.modo === 'cruza') return cruza(sc);
    if (sc.modo === 'hilo') return hilo(sc);
    if (sc.modo === 'funcion') return funcion(sc);
    if (sc.modo === 'dinamica') return dinamica(sc);
    if (sc.modo === 'gira') return gira(sc);
    return barra(sc);
  }

  const ejemplos = [
    { clave: 'barra', nombre: 'Barra que se desliza sobre unos raíles', sc: { modo: 'barra', B: '0.5', sentidoB: 'entrante', L: '0.2', v: '4', R: '2' } },
    { clave: 'barra-izq', nombre: 'Barra que se mueve hacia la izquierda', sc: { modo: 'barra', B: '0.8', sentidoB: 'saliente', L: '0.5', v: '-3', R: '0.5' } },
    { clave: 'alternador', nombre: 'Bobina que gira a 50 Hz (alternador)', sc: { modo: 'giratoria', N: '100', B: '0.5', forma: 'rectangulo', a: '0.1', b: '0.2', w: '50', uw: 'Hz', R: '50', t: '' } },
    { clave: 'rpm', nombre: 'Espira circular a 3000 rpm', sc: { modo: 'giratoria', N: '200', B: '0.2', forma: 'circulo', r: '0.05', w: '3000', uw: 'rpm', R: '', t: '0.002' } },
    { clave: 'campo-crece', nombre: 'Campo que aumenta en una bobina', sc: { modo: 'flujo', N: '50', forma: 'circulo', r: '0.05', B1: '0', B2: '0.4', th1: '0', th2: '', dt: '0.1', sentidoB: 'entrante', R: '5' } },
    { clave: 'gira-90', nombre: 'Espira que se gira 90° en un campo', sc: { modo: 'flujo', N: '1', forma: 'rectangulo', a: '0.3', b: '0.2', B1: '0.6', B2: '', th1: '0', th2: '90', dt: '0.2', sentidoB: 'saliente', R: '0.2' } },
    { clave: 'cruza', nombre: 'Espira cuadrada que atraviesa un campo', sc: { modo: 'cruza', N: '1', a: '0.1', D: '0.3', v: '2', B: '0.5', sentidoB: 'entrante', R: '0.1' } },
    { clave: 'hilo-aleja', nombre: 'Espira que se aleja de un hilo', sc: { modo: 'hilo', I: '10', sentidoI: 'arriba', d: '0.05', w: '0.1', h: '0.2', N: '1', v: '2', dIdt: '', R: '0.5' } },
    { clave: 'hilo-dIdt', nombre: 'Hilo con corriente que crece y espira quieta', sc: { modo: 'hilo', I: '5', sentidoI: 'arriba', d: '0.02', w: '0.08', h: '0.1', N: '100', v: '', dIdt: '200', R: '10' } },
    { clave: 'B-seno', nombre: 'Campo B₀ sen(ωt) en una bobina', sc: { modo: 'funcion', N: '200', forma: 'circulo', r: '0.03', tipoB: 'seno', B0: '0.05', w: '314', th: '0', t: '0.002', sentidoB: 'entrante', R: '20' } },
    { clave: 'B-cuadratica', nombre: 'Campo que crece como t²', sc: { modo: 'funcion', N: '1', forma: 'rectangulo', a: '0.2', b: '0.3', tipoB: 'cuadratica', B0: '0', k: '0.4', th: '0', t: '2', sentidoB: 'saliente', R: '0.4' } },
    { clave: 'velocidad-limite', nombre: 'Barra que cae por raíles verticales', sc: { modo: 'dinamica', caso: 'cae', B: '0.5', L: '0.4', R: '0.2', m: '0.02', t: '0.1' } },
    { clave: 'barra-lanzada', nombre: 'Barra lanzada que frena sola', sc: { modo: 'dinamica', caso: 'lanzada', B: '1', L: '0.5', R: '2', m: '0.1', v0: '5', t: '1' } },
    { clave: 'disco', nombre: 'Disco de Faraday', sc: { modo: 'gira', cuerpo: 'disco', B: '0.8', L: '0.1', w: '3000', uw: 'rpm', R: '0.05', sentidoB: 'entrante' } },
    { clave: 'varilla-gira', nombre: 'Varilla que gira por un extremo', sc: { modo: 'gira', cuerpo: 'varilla', B: '0.5', L: '1', w: '20', uw: 'rad/s', R: '2', sentidoB: 'entrante' } },
  ];

  return { resolver, barra, giratoria, flujo, cruza, hilo, funcion, dinamica, gira, FUNCB, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Faraday;
