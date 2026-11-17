const Faraday = (() => {
  const Ex = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-60) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function num(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be a number`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be ${cero ? 'positive or 0' : 'greater than 0'}`);
    return v;
  }
  const entero = (sc, k, nom) => { const v = vacio(sc[k]) ? 1 : num(sc, k, nom); if (!Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be an integer`); return v; };
  const SIMB = { entrante: '⊗ incoming', saliente: '⊙ outgoing' };
  const sentido = (B, crece) => ((B === 'saliente') === crece ? 'clockwise' : 'anticlockwise');

  function superficie(sc, pasos) {
    if (sc.forma === 'circulo') { const r = num(sc, 'r', 'the radius'); const S = Math.PI * r * r; pasos.push({ t: 'Area of the loop', html: `$S = π r^2 = π·${f(r)}^2$ = <b>${f(S)} m<sup>2</sup></b>` }); return { S, r }; }
    if (sc.forma === 'rectangulo') { const a = num(sc, 'a', 'the side a'), b = num(sc, 'b', 'the side b'); const S = a * b; pasos.push({ t: 'Area of the loop', html: `$S = a b = ${f(a)}·${f(b)}$ = <b>${f(S)} m<sup>2</sup></b>` }); return { S, a, b }; }
    return { S: num(sc, 'S', 'the area') };
  }

  function barra(sc) {
    const B = num(sc, 'B', 'the B field'), L = num(sc, 'L', 'the length of the bar'), v = num(sc, 'v', 'the speed', { signo: true }), R = num(sc, 'R', 'the resistance', { opcional: true });
    if (v === 0) throw new Error('With the bar at rest the flux does not change and there is no induced emf');
    const eps = B * L * Math.abs(v), crece = v > 0, sen = sentido(sc.sentidoB, crece);
    const pasos = [
      { t: 'Flux through the circuit', html: `The circuit is the rectangle closed by the rails with the bar; if the bar is at a distance x, $Φ = B L x$ and, since $ {dx}/{dt} = v$, $ {dΦ}/{dt} = B L v$. The bar moves to the ${crece ? 'right: the area and the flux increase' : 'left: the area and the flux decrease'}.` },
      { t: 'Faraday\'s law', html: `$|ε| = |{dΦ}/{dt}| = B L v = ${f(B)}·${f(L)}·${f(Math.abs(v))}$ = <b>${f(eps)} V</b>` },
      { t: 'Lenz\'s law', html: `The ${SIMB[sc.sentidoB].split(' ')[1]} flux ${crece ? 'increases' : 'decreases'}, so the induced current creates an ${crece !== (sc.sentidoB === 'saliente') ? 'outgoing' : 'incoming'} field inside the circuit: it flows <b>${sen}</b> (in the bar, ${sen === 'anticlockwise' ? 'upward' : 'downward'}).` },
    ];
    let I = null, F = null, P = null;
    if (R) {
      I = eps / R; F = B * I * L; P = eps * I;
      pasos.push({ t: 'Induced current', html: `$I = ε/R = ${f(eps)}/${f(R)}$ = <b>${f(I)} A</b>` });
      pasos.push({ t: 'Force on the bar', html: `$F = I L B = ${f(I)}·${f(L)}·${f(B)}$ = <b>${f(F)} N</b> $= {B^2 L^2 v}/R$, opposite to the velocity (to the ${crece ? 'left' : 'right'}). To keep v constant you have to push with an equal force in the opposite direction.` });
      pasos.push({ t: 'Power', html: `$P = F v = ε I = ε^2/R$ = <b>${f(P)} W</b>: the mechanical power of whoever pushes is dissipated in the resistance by the Joule effect.` });
    }
    return { modo: 'barra', B, L, v, R, eps, I, F, P, sentido: sen, sentidoB: sc.sentidoB, pasos };
  }

  function giratoria(sc) {
    const pasos = [], N = entero(sc, 'N', 'the number of turns'), B = num(sc, 'B', 'the B field'), sup = superficie(sc, pasos), S = sup.S;
    const x = num(sc, 'w', 'the rotation speed'), uw = sc.uw || 'Hz';
    const w = uw === 'rad/s' ? x : uw === 'rpm' ? (2 * Math.PI * x) / 60 : 2 * Math.PI * x, fr = w / (2 * Math.PI);
    if (uw !== 'rad/s') pasos.push({ t: 'Angular velocity', html: `$ω = ${uw === 'rpm' ? `{2π·${f(x)}}/60` : `2π f = 2π·${f(x)}`}$ = <b>${f(w)} rad/s</b>${uw === 'rpm' ? ` (f = ${f(fr)} Hz)` : ''}` });
    const Fm = N * B * S, em = Fm * w, ef = em / Math.SQRT2, R = num(sc, 'R', 'the resistance', { opcional: true });
    pasos.push({ t: 'Flux', html: `If at t = 0 the normal of the loop is parallel to B, the angle is θ = ωt and $Φ(t) = N B S cos(ω t)$, with $Φ_max = N B S = ${N}·${f(B)}·${f(S)}$ = <b>${f(Fm)} Wb</b>` });
    pasos.push({ t: 'Faraday\'s law', html: `$ε(t) = −{dΦ}/{dt} = N B S ω sin(ω t)$ ⇒ $ε_max = ${f(Fm)}·${f(w)}$ = <b>${f(em)} V</b>; rms value $ε_rms = {ε_max}/√2$ = <b>${f(ef)} V</b>. The emf is alternating, with frequency ${f(fr)} Hz.` });
    let Im = null, Pm = null, et = null;
    const t = num(sc, 't', 'the instant t', { opcional: true, cero: true });
    if (t !== null) { et = em * Math.sin(w * t); pasos.push({ t: `At t = ${f(t)} s`, html: `$ε = ${f(em)}·sin(${f(w)}·${f(t)})$ = <b>${f(et)} V</b>; Φ = ${f(Fm * Math.cos(w * t))} Wb` }); }
    if (R) { Im = em / R; Pm = (ef * ef) / R; pasos.push({ t: 'With a resistance R', html: `$I_max = {ε_max}/R$ = <b>${f(Im)} A</b>, I<sub>rms</sub> = ${f(Im / Math.SQRT2)} A; mean power $P = {ε_rms^2}/R$ = <b>${f(Pm)} W</b>` }); pasos.push({ t: 'Torque to keep it rotating', html: `The field brakes the coil with a torque $M = Φ_max I sin(ω t) = {ε I}/ω$. To make it rotate at constant ω a mean torque $M_mean = P/ω = ${f(Pm)}/${f(w)}$ = <b>${f(Pm / w)} N·m</b> must be applied (maximum ${f((em * Im) / w)} N·m). In each turn P·T = <b>${f(Pm / fr)} J</b> are dissipated.` }); }
    return { modo: 'giratoria', N, B, S, w, fr, Fm, em, ef, R, Im, Pm, par: Pm === null ? null : Pm / w, t, et, pasos };
  }

  function flujo(sc) {
    const pasos = [], N = entero(sc, 'N', 'the number of turns'), sup = superficie(sc, pasos), S = sup.S;
    const B1 = num(sc, 'B1', 'the initial field', { signo: true }), B2 = vacio(sc.B2) ? B1 : num(sc, 'B2', 'the final field', { signo: true });
    const th1 = vacio(sc.th1) ? 0 : num(sc, 'th1', 'the initial angle', { signo: true }), th2 = vacio(sc.th2) ? th1 : num(sc, 'th2', 'the final angle', { signo: true });
    const dt = num(sc, 'dt', 'the time interval'), R = num(sc, 'R', 'the resistance', { opcional: true });
    const cosG = (th) => { const c = Math.cos((th * Math.PI) / 180); return Math.abs(c) < 1e-12 ? 0 : c; }, c1 = cosG(th1), c2 = cosG(th2);
    const F1 = N * B1 * S * c1, F2 = N * B2 * S * c2, dF = F2 - F1;
    if (Math.abs(dF) < 1e-15 * (Math.abs(F1) + Math.abs(F2) + 1e-30)) throw new Error('The flux does not change: neither the field nor the angle varies, so there is no induced emf');
    const cos = (th, c) => (th ? `cos ${f(th)}°` : '1');
    pasos.push({ t: 'Initial and final flux', html: `$Φ = N B S cos θ$ (θ, angle between B and the normal)<br>$Φ_1 = ${N}·${f(B1)}·${f(S)}·${cos(th1, c1)}$ = <b>${f(F1)} Wb</b>, &nbsp; $Φ_2 = ${N}·${f(B2)}·${f(S)}·${cos(th2, c2)}$ = <b>${f(F2)} Wb</b>` });
    const em = -dF / dt;
    pasos.push({ t: 'Mean emf (Faraday)', html: `$ε = −{ΔΦ}/{Δt} = −{${f(F2)} − ${f(F1)}}/{${f(dt)}}$ = <b>${f(em)} V</b>` });
    const sen = sentido(sc.sentidoB, dF > 0);
    pasos.push({ t: 'Lenz\'s law', html: `The ${SIMB[sc.sentidoB].split(' ')[1]} flux ${dF > 0 ? 'increases' : 'decreases'}: the induced current creates an ${(dF > 0) !== (sc.sentidoB === 'saliente') ? 'outgoing' : 'incoming'} field that opposes the change, so it flows <b>${sen}</b> seen from the screen side.` });
    let I = null, q = null;
    if (R) { I = Math.abs(em) / R; q = Math.abs(dF) / R; pasos.push({ t: 'Current and charge', html: `$I = |ε|/R = ${f(Math.abs(em))}/${f(R)}$ = <b>${f(I)} A</b>; charge that flows: $q = |ΔΦ|/R$ = <b>${f(q)} C</b> (it does not depend on how fast the flux changes)` }); }
    return { modo: 'flujo', N, S, B1, B2, th1, th2, dt, F1, F2, dF, em, R, I, q, sentido: sen, sentidoB: sc.sentidoB, forma: sc.forma, pasos };
  }

  function cruza(sc) {
    const N = entero(sc, 'N', 'the number of turns'), a = num(sc, 'a', 'the side of the loop'), D = num(sc, 'D', 'the width of the region'), v = num(sc, 'v', 'the speed'), B = num(sc, 'B', 'the B field'), R = num(sc, 'R', 'the resistance', { opcional: true });
    const eps = N * B * a * v, m = Math.min(a, D), M = Math.max(a, D);
    const t1 = m / v, t2 = M / v, t3 = (a + D) / v;
    const tramos = [
      { t0: 0, t1, eps, sentido: sentido(sc.sentidoB, true), q: 'entra' },
      { t0: t1, t1: t2, eps: 0, sentido: null, q: a <= D ? 'dentro' : 'tapa' },
      { t0: t2, t1: t3, eps: -eps, sentido: sentido(sc.sentidoB, false), q: 'sale' },
    ];
    const pasos = [
      { t: 'Flux versus position', html: `If x is how far the leading side has entered, Φ = N B a·(part of the loop inside the field). While it enters, Φ = N B a x grows; with ${a <= D ? 'the whole loop inside' : 'the whole region covered by the loop'} it does not change (Φ<sub>max</sub> = N B a·${f(m)} = ${f(N * B * a * m)} Wb), and while it leaves it decreases.` },
      { t: 'Emf on entering and leaving', html: `$|ε| = N B a v = ${N}·${f(B)}·${f(a)}·${f(v)}$ = <b>${f(eps)} V</b> for t = ${f(t1)} s on entering and another ${f(t1)} s on leaving; ε = 0 ${t2 > t1 ? `during the ${f(t2 - t1)} s in between` : 'at the instant in between'}.` },
      { t: 'Lenz\'s law', html: `On entering the ${SIMB[sc.sentidoB].split(' ')[1]} flux increases: current <b>${tramos[0].sentido}</b>. On leaving it decreases: <b>${tramos[2].sentido}</b>.` },
    ];
    let I = null, F = null, Q = null;
    if (R) {
      I = eps / R; F = N * B * I * a; Q = 2 * eps * I * t1;
      pasos.push({ t: 'Current, force and heat', html: `$I = ε/R$ = <b>${f(I)} A</b>; while entering or leaving, the field brakes the loop with $F = N I a B$ = <b>${f(F)} N</b> (backwards). Total heat dissipated (entering and leaving): $Q = 2 ε I t = 2·${f(eps)}·${f(I)}·${f(t1)}$ = <b>${f(Q)} J</b>` });
    }
    return { modo: 'cruza', N, a, D, v, B, R, eps, I, F, Q, tramos, t3, sentidoB: sc.sentidoB, pasos };
  }


  const MU0 = 4e-7 * Math.PI;

  function hilo(sc) {
    const I = num(sc, 'I', 'the wire current', { signo: true, cero: true }), d = num(sc, 'd', 'the distance from the wire to the loop'), w = num(sc, 'w', 'the width of the loop'), h = num(sc, 'h', 'the height of the loop'), N = entero(sc, 'N', 'the number of turns');
    const v = num(sc, 'v', 'the speed', { opcional: true, signo: true }) ?? 0, dI = num(sc, 'dIdt', 'dI/dt', { opcional: true, signo: true }) ?? 0, R = num(sc, 'R', 'the resistance', { opcional: true });
    const sentidoB = (sc.sentidoI === 'abajo') === (I >= 0) ? 'saliente' : 'entrante', ln = Math.log((d + w) / d), k = (MU0 * N * h) / (2 * Math.PI);
    const Phi = k * Math.abs(I) * ln, dPhi = k * (Math.sign(I || 1) * dI * ln + Math.abs(I) * v * (1 / (d + w) - 1 / d));
    const pasos = [
      { t: 'Field of the wire', html: `$B(x) = {μ_0 I}/{2π x}$, at a distance x from the wire; in the loop it is <b>${SIMB[sentidoB]}</b> (right-hand rule) and it is not uniform: you have to integrate.` },
      { t: 'Flux in the loop', html: `$Φ = N ∫_d^{d+w} {μ_0 I h}/{2π x} dx = {μ_0 N I h}/{2π} ln({d + w}/d) = 2·10^{−7}·${N}·${f(Math.abs(I))}·${f(h)}·ln(${f((d + w) / d)})$ = <b>${f(Phi)} Wb</b>` },
    ];
    if (!v && !dI) throw new Error('Type the velocity of the loop or how the current changes (dI/dt): if nothing changes there is no emf');
    const partes = [];
    if (dI) partes.push(`from the changing current: $ {μ_0 N h}/{2π} ln({d + w}/d) {dI}/{dt} = ${f(k * ln)}·${f(dI)}$ = ${f(k * ln * dI * Math.sign(I || 1))} Wb/s`);
    if (v) partes.push(`from the motion: with x = d, $ {dx}/{dt} = v$, $ {dΦ}/{dt} = {μ_0 N I h}/{2π} (1/{d + w} − 1/d) v = −{μ_0 N I h w v}/{2π d (d + w)}$ = ${f(Math.abs(I) * k * v * (1 / (d + w) - 1 / d))} Wb/s`);
    pasos.push({ t: 'Rate of change of the flux', html: partes.join('<br>') + (partes.length > 1 ? `<br>In total $ {dΦ}/{dt}$ = ${f(dPhi)} Wb/s` : '') });
    const eps = Math.abs(dPhi), crece = dPhi > 0, sen = sentido(sentidoB, crece);
    pasos.push({ t: 'Faraday\'s law', html: `$|ε| = |{dΦ}/{dt}|$ = <b>${f(eps)} V</b>${v ? ` (at the instant when the loop is at d = ${f(d)} m)` : ''}` });
    pasos.push({ t: 'Lenz\'s law', html: `The ${SIMB[sentidoB].split(' ')[1]} flux ${crece ? 'increases' : 'decreases'}: the induced current flows <b>${sen}</b>.` });
    let Ii = null, F = null;
    if (R) {
      Ii = eps / R; pasos.push({ t: 'Induced current', html: `$I_ind = ε/R$ = <b>${f(Ii)} A</b>` });
      F = (MU0 * Math.abs(I) * Ii * h * N / (2 * Math.PI)) * (1 / d - 1 / (d + w));
      pasos.push({ t: 'Force on the loop', html: `The sides parallel to the wire carry opposite currents and are in different fields: $F = {μ_0 N I I_ind h}/{2π} (1/d − 1/{d + w})$ = <b>${f(F)} N</b>, which opposes the change (${crece ? 'it pushes the loop away from the wire' : 'it pulls the loop toward the wire'}).` });
    }
    return { modo: 'hilo', I, d, w, h, N, v, dI, R, Phi, dPhi, eps, Ii, F, sentido: sen, sentidoB, pasos };
  }

  const FUNCB = {
    lineal: { nombre: 'B = B₀ + k t', B: (p, t) => p.B0 + p.k * t, dB: (p) => p.k, tex: (p) => `B(t) = ${f(p.B0)} + ${f(p.k)} t`, dtex: (p) => `{dB}/{dt} = k = ${f(p.k)} "T/s"` },
    cuadratica: { nombre: 'B = B₀ + k t²', B: (p, t) => p.B0 + p.k * t * t, dB: (p, t) => 2 * p.k * t, tex: (p) => `B(t) = ${f(p.B0)} + ${f(p.k)} t^2`, dtex: (p) => `{dB}/{dt} = 2 k t = ${f(2 * p.k)} t` },
    seno: { nombre: 'B = B₀ sen(ωt)', B: (p, t) => p.B0 * Math.sin(p.w * t), dB: (p, t) => p.B0 * p.w * Math.cos(p.w * t), tex: (p) => `B(t) = ${f(p.B0)} sen(${f(p.w)} t)`, dtex: (p) => `{dB}/{dt} = B_0 ω cos(ω t) = ${f(p.B0 * p.w)} cos(${f(p.w)} t)` },
    exp: { nombre: 'B = B₀ e^(−t/τ)', B: (p, t) => p.B0 * Math.exp(-t / p.tau), dB: (p, t) => (-p.B0 / p.tau) * Math.exp(-t / p.tau), tex: (p) => `B(t) = ${f(p.B0)} e^{−t/${f(p.tau)}}`, dtex: (p) => `{dB}/{dt} = −{B_0}/τ e^{−t/τ} = ${f(-p.B0 / p.tau)} e^{−t/${f(p.tau)}}` },
  };
  FUNCB.libre = { nombre: 'You write B(t)', B: (p, t) => Ex.valor(p.ast, 0, { t }), dB: (p, t) => Ex.valor(p.dast, 0, { t }), tex: (p) => `B(t) = ${Ex.texto(p.ast)}`, dtex: (p) => `{dB}/{dt} = ${Ex.texto(p.dast)}` };
  function tramosLenz(Bf, dBf, tf, sentidoB) {
    const escala = Math.max(...Array.from({ length: 401 }, (_, i) => Math.abs(dBf((tf * i) / 400))), 1e-300);
    const est = (t) => { const B = Bf(t), dB = dBf(t); if (Math.abs(dB) <= 1e-9 * escala) return 'no current'; const Bpos = (B >= 0) === (sentidoB !== 'saliente') ? 'entrante' : 'saliente'; return sentido(Bpos, B >= 0 ? dB > 0 : dB < 0); };
    const n = 4000, out = []; let t0 = 0, e0 = est(0);
    for (let i = 1; i <= n; i++) {
      const t = (tf * i) / n, e = est(t);
      if (e !== e0) { let a = (tf * (i - 1)) / n, b = t; for (let k = 0; k < 45; k++) { const m = (a + b) / 2; if (est(m) === e0) a = m; else b = m; } const tc = (a + b) / 2; out.push({ t0, t1: tc, sentido: e0 }); t0 = tc; e0 = e; }
    }
    out.push({ t0, t1: tf, sentido: e0 });
    const lim = tf * 1e-6, fin = [];
    for (const q of out.filter((x) => x.t1 - x.t0 > lim || out.length === 1)) {
      const u = fin[fin.length - 1];
      if (u && u.sentido === q.sentido) u.t1 = q.t1; else fin.push({ ...q });
    }
    if (fin.length) { fin[0].t0 = 0; for (let i = 1; i < fin.length; i++) fin[i].t0 = fin[i - 1].t1 = (fin[i - 1].t1 + fin[i].t0) / 2; fin[fin.length - 1].t1 = tf; }
    return fin.length ? fin : out;
  }
  function funcion(sc) {
    const pasos = [], N = entero(sc, 'N', 'the number of turns'), sup = superficie(sc, pasos), S = sup.S, tipo = FUNCB[sc.tipoB] ? sc.tipoB : 'lineal', Fb = FUNCB[tipo];
    const p = tipo === 'libre' ? {} : { B0: num(sc, 'B0', 'B₀', { signo: true, cero: true }) };
    if (tipo === 'libre') { p.ast = Ex.lee(sc.expr, 'B(t)', ['t']); p.dast = Ex.deriva(p.ast, 't'); if (!Ex.tieneX(p.ast, 't')) throw new Error('B(t) must depend on t: otherwise the field does not change'); }
    if (tipo === 'lineal' || tipo === 'cuadratica') p.k = num(sc, 'k', 'the constant k', { signo: true });
    if (tipo === 'seno') p.w = num(sc, 'w', 'the angular frequency ω');
    if (tipo === 'exp') p.tau = num(sc, 'tau', 'the time constant τ');
    if (tipo === 'seno' && !p.B0) throw new Error('With B₀ = 0 the field does not change');
    const th = vacio(sc.th) ? 0 : num(sc, 'th', 'the angle θ', { signo: true, cero: true }), c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180);
    if (!c) throw new Error('With θ = 90° the field is parallel to the loop and there is no flux');
    const t = num(sc, 't', 'the instant t', { cero: true }), R = num(sc, 'R', 'the resistance', { opcional: true });
    const Bt = Fb.B(p, t), dBt = Fb.dB(p, t), Phi = N * Bt * S * c, eps = -N * S * c * dBt, cc = th ? ` cos ${f(th)}°` : '';
    pasos.push({ t: 'Field', html: `$${Fb.tex(p)}$ (in T, with t in s)` });
    pasos.push({ t: 'Flux', html: `$Φ(t) = N B(t) S cos θ = ${N}·${f(S)}${cc}·B(t)$; at t = ${f(t)} s, B = ${f(Bt)} T and Φ = <b>${f(Phi)} Wb</b>` });
    pasos.push({ t: 'Faraday\'s law', html: `$ε(t) = −{dΦ}/{dt} = −N S cos θ {dB}/{dt}$, with $${Fb.dtex(p)}$<br>At t = ${f(t)} s: $ε = −${N}·${f(S)}${cc}·${f(dBt)}$ = <b>${f(eps)} V</b>` });
    const crece = Bt >= 0 ? dBt > 0 : dBt < 0, Bpos = (Bt >= 0) === (sc.sentidoB !== 'saliente') ? 'entrante' : 'saliente';
    let sen = null;
    if (Math.abs(dBt) > 1e-15) { sen = sentido(Bpos, Math.abs(Bt) < 1e-15 ? true : crece); pasos.push({ t: 'Lenz\'s law', html: `At that instant the flux ${Math.abs(Bt) < 1e-15 ? 'starts to grow' : crece ? 'increases' : 'decreases'}: the induced current flows <b>${sen}</b> seen from the screen.` }); }
    else pasos.push({ t: 'Lenz\'s law', html: 'At that instant the flux does not change: there is no induced current.' });
    let I = null;
    if (R) { I = eps / R; pasos.push({ t: 'Current', html: `$I = ε/R$ = <b>${f(I)} A</b>` }); }
    let tramos = null, tf = null;
    if (tipo === 'libre') {
      tf = vacio(sc.tf) ? Math.max(t * 1.6, 1) : num(sc, 'tf', 'the end of the time window');
      tramos = tramosLenz((x) => Fb.B(p, x), (x) => Fb.dB(p, x), tf, sc.sentidoB);
      pasos.push({ t: 'Lenz\'s law by stages', html: `The direction of the current changes when $dB/dt$ changes sign or when B passes through 0 (the field reverses). Between 0 and ${f(tf)} s:<br>` + tramos.map((q) => `from ${f(q.t0)} to ${f(q.t1)} s: <b>${q.sentido === 'no current' ? 'no current (the flux does not change)' : 'current ' + q.sentido}</b>`).join('<br>') });
    }
    return { modo: 'funcion', tramos, tf, tipo, p, N, S, c, th, t, Bt, Phi, eps, R, I, sentido: sen, sentidoB: Bpos, forma: sc.forma, Bf: (x) => Fb.B(p, x), Ef: (x) => -N * S * c * Fb.dB(p, x), pasos };
  }

  function dinamica(sc) {
    const caso = ['fuerza', 'cae', 'lanzada'].includes(sc.caso) ? sc.caso : 'fuerza', B = num(sc, 'B', 'the B field'), L = num(sc, 'L', 'the length of the bar'), R = num(sc, 'R', 'the resistance'), m = num(sc, 'm', 'the mass of the bar');
    const g = String(sc.g ?? '').replace(',', '.') === '9.80665' ? 9.80665 : 9.8, ang = caso === 'cae' && !vacio(sc.ang) ? num(sc, 'ang', 'the angle of the rails', { signo: true }) : 90;
    if (ang <= 0 || ang > 90) throw new Error('The angle of the rails must be between 0° (exclusive) and 90°');
    const sn = ang === 90 ? 1 : Math.sin((ang * Math.PI) / 180), mg = m * g * sn, Fx = caso === 'fuerza' ? num(sc, 'F', 'the force') : caso === 'cae' ? mg : 0, v0 = caso === 'lanzada' ? num(sc, 'v0', 'the initial velocity') : 0;
    const t = num(sc, 't', 'the instant t', { opcional: true, cero: true }), b = (B * B * L * L) / R, tau = m / b, vL = Fx / b;
    const v = (x) => vL + (v0 - vL) * Math.exp(-x / tau), I = (x) => (B * L * v(x)) / R, pasos = [], mgT = ang === 90 ? 'm g' : 'm g sin θ';
    pasos.push({ t: 'Magnetic force', html: `${caso === 'cae' && ang !== 90 ? `The rails make ${f(ang)}° with the horizontal and B is perpendicular to their plane: the weight contributes along the rails $m g sin θ$ = ${f(mg)} N. ` : ''}With velocity v the emf is $ε = B L v$, the current $I = {B L v}/R$ and the field brakes the bar with $F_m = I L B = {B^2 L^2 v}/R$ = ${f(b)}·v N.` });
    if (caso === 'lanzada') pasos.push({ t: 'Equation of motion', html: `$m {dv}/{dt} = −{B^2 L^2 v}/R ⇒ v(t) = v_0 e^{−t/τ}$, with $τ = {m R}/{B^2 L^2}$ = <b>${f(tau)} s</b>.` });
    else pasos.push({ t: 'Equation of motion', html: `$m {dv}/{dt} = ${caso === 'cae' ? mgT : 'F'} − {B^2 L^2 v}/R ⇒ v(t) = v_L (1 − e^{−t/τ})$, with $τ = {m R}/{B^2 L^2}$ = <b>${f(tau)} s</b>.` });
    if (caso !== 'lanzada') pasos.push({ t: 'Terminal velocity', html: `When the magnetic force equals ${caso === 'cae' ? 'the weight' : 'the applied force'}: $ {B^2 L^2 v_L}/R = ${caso === 'cae' ? mgT : 'F'} ⇒ v_L = {${caso === 'cae' ? mgT : 'F'} R}/{B^2 L^2} = {${f(Fx)}·${f(R)}}/{${f(B)}^2·${f(L)}^2}$ = <b>${f(vL)} m/s</b>. Then all the power ${caso === 'cae' ? 'of the weight' : 'of the force'} (${f(Fx * vL)} W) is dissipated in the resistance.` });
    else pasos.push({ t: 'Distance until it stops', html: `$x = ∫ v dt = v_0 τ = ${f(v0)}·${f(tau)}$ = <b>${f(v0 * tau)} m</b>; all the kinetic energy, $1/2 m v_0^2$ = ${f(0.5 * m * v0 * v0)} J, ends up as heat in the resistance.` });
    let vt = null, It = null;
    if (t !== null) { vt = v(t); It = (B * L * vt) / R; pasos.push({ t: `At t = ${f(t)} s`, html: `$v = ${caso === 'lanzada' ? `${f(v0)} e^{−${f(t)}/${f(tau)}}` : `${f(vL)} (1 − e^{−${f(t)}/${f(tau)}})`}$ = <b>${f(vt)} m/s</b>; $ε = B L v$ = ${f(B * L * vt)} V e I = <b>${f(It)} A</b>` }); }
    const IL = (B * L * vL) / R;
    return { modo: 'dinamica', caso, B, L, R, m, g, ang, Fx, v0, tau, vL, IL, PL: Fx * vL, t, vt, It, vf: v, If: I, pasos };
  }

  function gira(sc) {
    const pasos = [], disco = sc.cuerpo === 'disco', B = num(sc, 'B', 'the B field'), L = num(sc, 'L', disco ? 'the radius of the disc' : 'the length of the rod');
    const x = num(sc, 'w', 'the rotation speed'), uw = sc.uw || 'rad/s', w = uw === 'rad/s' ? x : uw === 'rpm' ? (2 * Math.PI * x) / 60 : 2 * Math.PI * x, R = num(sc, 'R', 'the resistance', { opcional: true });
    if (uw !== 'rad/s') pasos.push({ t: 'Angular velocity', html: `$ω = ${uw === 'rpm' ? `{2π·${f(x)}}/60` : `2π·${f(x)}`}$ = <b>${f(w)} rad/s</b>` });
    const eps = 0.5 * B * w * L * L;
    pasos.push({ t: 'Motional emf', html: `A piece dr at a distance r from the axis moves at v = ω r, so $dε = B v dr = B ω r dr$. Integrating ${disco ? 'from the axis to the rim' : 'along the rod'}: $ε = ∫_0^${disco ? 'R' : 'L'} B ω r dr = 1/2 B ω ${disco ? 'R' : 'L'}^2 = 1/2·${f(B)}·${f(w)}·${f(L)}^2$ = <b>${f(eps)} V</b>` });
    pasos.push({ t: 'Another way: the swept area', html: `In a time dt ${disco ? 'each radius' : 'the rod'} sweeps a sector of area $1/2 ${disco ? 'R' : 'L'}^2 ω dt$, so $ {dΦ}/{dt} = 1/2 B ω ${disco ? 'R' : 'L'}^2$: the same result.${disco ? ' The emf appears between the axis and the rim of the disc, which are connected with brushes.' : ''}` });
    let I = null, P = null;
    if (R) { I = eps / R; P = eps * I; pasos.push({ t: 'With a resistance R', html: `$I = ε/R$ = <b>${f(I)} A</b>; power $P = ε I$ = <b>${f(P)} W</b> and the torque needed to keep it rotating, $M = P/ω$ = <b>${f(P / w)} N·m</b>` }); }
    return { modo: 'gira', cuerpo: disco ? 'disco' : 'varilla', B, L, w, eps, R, I, P, sentidoB: sc.sentidoB, pasos };
  }

  function foucault(sc) {
    const pasos = [], lamina = sc.geo === 'lamina', sg = num(sc, 'sigma', 'the conductivity σ') * 1e6, B0 = num(sc, 'B0', 'the amplitude B₀'), fr = num(sc, 'fr', 'the frequency'), w = 2 * Math.PI * fr, MU0 = 4e-7 * Math.PI;
    const delta = Math.sqrt(2 / (w * MU0 * sg)), Bdot = B0 * w;
    pasos.push({ t: 'Field and Faraday\'s law', html: `$B(t) = B_0 sin ωt$ with $ω = 2π f = ${f(w)} "rad/s"$, so $dB/dt = B_0 ω cos ωt$ and its amplitude is $B_0 ω = ${f(Bdot)} "T/s"$. A changing field creates an electric field that drives currents in the conductor.` });
    let P, Pp, pv, geom, Jmax, Emax, aviso = null, comp = null, N = 1;
    if (!lamina) {
      const a = num(sc, 'a', 'the radius of the disc') * 1e-2, d = num(sc, 'd', 'the thickness of the disc') * 1e-3, Vol = Math.PI * a * a * d;
      Emax = (a * Bdot) / 2; Jmax = sg * Emax; P = (Math.PI * sg * d * a ** 4 * Bdot * Bdot) / 16; Pp = 2 * P; pv = P / Vol;
      geom = { a, d, Vol };
      pasos.push({ t: 'Induced electric field', html: `By symmetry the field $E$ is tangent to circles: $E · 2π r = −π r^2 dB/dt$, so $E(r) = {r}/{2} |dB/dt|$ and at the rim $E = {a B_0 ω}/{2} = ${f(Emax)} "V/m"$. The current density is $J = σ E$: it grows linearly with $r$ up to $J_{max} = ${f(Jmax)} "A/m"^2$.` });
      pasos.push({ t: 'Dissipated power', html: `The power per unit volume is $σ E^2$; integrating over the disc: $P = ∫ σ E^2 dV = {π σ d a^4}/{8} (dB/dt)^2$. Its mean value, with $⟨cos^2 ωt⟩ = 1/2$, is $⟨P⟩ = {π σ d a^4 B_0^2 ω^2}/{16} = ${f(P)} "W"$ (peak ${f(Pp)} W).` });
      if (a > 0.5 * delta) aviso = `The radius (${f(a * 100)} cm) is not small compared with the penetration depth δ = ${f(delta * 100)} cm: the field does not penetrate equally throughout the disc and this model overestimates the power.`;
    } else {
      const D = num(sc, 'D', 'the total thickness of the core') * 1e-3, Vol = num(sc, 'V', 'the volume of the core') * 1e-6; N = vacio(sc.N) ? 1 : num(sc, 'N', 'the number of laminations');
      if (!Number.isInteger(N)) throw new Error('The number of laminations must be an integer');
      const dl = D / N; Emax = (dl / 2) * Bdot; Jmax = sg * Emax; pv = (sg * w * w * B0 * B0 * dl * dl) / 24; P = pv * Vol; Pp = 2 * P;
      const pv1 = (sg * w * w * B0 * B0 * D * D) / 24; comp = { P1: pv1 * Vol, N, dl, reduccion: N * N };
      geom = { D, dl, Vol };
      pasos.push({ t: 'Induced electric field', html: `With $B$ in the plane of a lamination of thickness $d = ${f(dl * 1000)} "mm"$, the currents circulate in the plane perpendicular to $B$: at a height $z$ from the centre, $E(z) = z |dB/dt|$. At the surface $E = {d B_0 ω}/{2} = ${f(Emax)} "V/m"$ and $J_{max} = σ E = ${f(Jmax)} "A/m"^2$.` });
      pasos.push({ t: 'Power per unit volume', html: `Average over the thickness: $⟨σ E^2⟩_z = σ (dB/dt)^2 d^2/12$ and average over time: $p = {σ B_0^2 ω^2 d^2}/{24} = ${f(pv)} "W/m"^3$. With the volume $${f(Vol * 1e6)} "cm"^3$: $⟨P⟩ = ${f(P)} "W"$.` });
      pasos.push({ t: 'Effect of laminating the core', html: `The total thickness $D = ${f(D * 1000)} "mm"$ is split into $N = ${N}$ insulated laminations of $d = D/N$: the power falls with $d^2$, that is $N^2$ times. Without lamination it would be $${f(comp.P1)} "W"$; laminated, ${f(P)} W: ${f(N * N)} times less.` });
      if (dl > 0.5 * delta) aviso = `The thickness of each lamination (${f(dl * 1000)} mm) is not small compared with the penetration depth δ = ${f(delta * 1000)} mm: the field is attenuated inside the lamination (skin effect) and this model overestimates the power.`;
    }
    pasos.push({ t: 'Penetration depth and limits of the model', html: `$δ = √{2/{ω μ_0 σ}} = ${f(delta * 1000)} "mm"$. The model assumes a uniform field throughout the piece and does not take into account the field created by the currents themselves (which weakens it) or the permeability of the material: it holds when the piece is small compared with δ.${aviso ? ' <b>Warning:</b> ' + aviso : ''}` });
    return { modo: 'foucault', geo: lamina ? 'lamina' : 'disco', sigma: sg, B0, fr, w, delta, Bdot, Emax, Jmax, P, Pp, pv, geom, aviso, comp, N, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'foucault') return foucault(sc);
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
    { clave: 'barra', nombre: 'Bar sliding on rails', sc: { modo: 'barra', B: '0.5', sentidoB: 'entrante', L: '0.2', v: '4', R: '2' } },
    { clave: 'barra-izq', nombre: 'Bar moving to the left', sc: { modo: 'barra', B: '0.8', sentidoB: 'saliente', L: '0.5', v: '-3', R: '0.5' } },
    { clave: 'alternador', nombre: 'Coil rotating at 50 Hz (alternator)', sc: { modo: 'giratoria', N: '100', B: '0.5', forma: 'rectangulo', a: '0.1', b: '0.2', w: '50', uw: 'Hz', R: '50', t: '' } },
    { clave: 'rpm', nombre: 'Circular loop at 3000 rpm', sc: { modo: 'giratoria', N: '200', B: '0.2', forma: 'circulo', r: '0.05', w: '3000', uw: 'rpm', R: '', t: '0.002' } },
    { clave: 'campo-crece', nombre: 'Increasing field in a coil', sc: { modo: 'flujo', N: '50', forma: 'circulo', r: '0.05', B1: '0', B2: '0.4', th1: '0', th2: '', dt: '0.1', sentidoB: 'entrante', R: '5' } },
    { clave: 'gira-90', nombre: 'Loop rotated 90° in a field', sc: { modo: 'flujo', N: '1', forma: 'rectangulo', a: '0.3', b: '0.2', B1: '0.6', B2: '', th1: '0', th2: '90', dt: '0.2', sentidoB: 'saliente', R: '0.2' } },
    { clave: 'cruza', nombre: 'Square loop crossing a field', sc: { modo: 'cruza', N: '1', a: '0.1', D: '0.3', v: '2', B: '0.5', sentidoB: 'entrante', R: '0.1' } },
    { clave: 'hilo-aleja', nombre: 'Loop moving away from a wire', sc: { modo: 'hilo', I: '10', sentidoI: 'arriba', d: '0.05', w: '0.1', h: '0.2', N: '1', v: '2', dIdt: '', R: '0.5' } },
    { clave: 'hilo-dIdt', nombre: 'Wire with growing current and loop at rest', sc: { modo: 'hilo', I: '5', sentidoI: 'arriba', d: '0.02', w: '0.08', h: '0.1', N: '100', v: '', dIdt: '200', R: '10' } },
    { clave: 'B-seno', nombre: 'Field B₀ sin(ωt) in a coil', sc: { modo: 'funcion', N: '200', forma: 'circulo', r: '0.03', tipoB: 'seno', B0: '0.05', w: '314', th: '0', t: '0.002', sentidoB: 'entrante', R: '20' } },
    { clave: 'B-libre', nombre: 'Hand-written field B(t), with a change of direction', sc: { modo: 'funcion', N: '100', forma: 'circulo', r: '0.05', tipoB: 'libre', expr: '0.2 sen(2 pi t)', tf: '1', th: '0', t: '0.3', sentidoB: 'entrante', R: '4' } },
    { clave: 'B-cuadratica', nombre: 'Field growing as t²', sc: { modo: 'funcion', N: '1', forma: 'rectangulo', a: '0.2', b: '0.3', tipoB: 'cuadratica', B0: '0', k: '0.4', th: '0', t: '2', sentidoB: 'saliente', R: '0.4' } },
    { clave: 'velocidad-limite', nombre: 'Bar falling on vertical rails', sc: { modo: 'dinamica', caso: 'cae', B: '0.5', L: '0.4', R: '0.2', m: '0.02', t: '0.1' } },
    { clave: 'barra-lanzada', nombre: 'Launched bar that brakes by itself', sc: { modo: 'dinamica', caso: 'lanzada', B: '1', L: '0.5', R: '2', m: '0.1', v0: '5', t: '1' } },
    { clave: 'foucault-disco', nombre: 'Copper disc in a 0.1 T field at 50 Hz (eddy currents)', sc: { modo: 'foucault', geo: 'disco', sigma: '58', B0: '0,1', fr: '50', a: '5', d: '2' } },
    { clave: 'foucault-nucleo', nombre: 'Transformer core: 100 laminations instead of a single one', sc: { modo: 'foucault', geo: 'lamina', sigma: '2', B0: '1', fr: '50', D: '20', N: '100', V: '500' } },
    { clave: 'disco', nombre: 'Faraday disc', sc: { modo: 'gira', cuerpo: 'disco', B: '0.8', L: '0.1', w: '3000', uw: 'rpm', R: '0.05', sentidoB: 'entrante' } },
    { clave: 'varilla-gira', nombre: 'Rod rotating about one end', sc: { modo: 'gira', cuerpo: 'varilla', B: '0.5', L: '1', w: '20', uw: 'rad/s', R: '2', sentidoB: 'entrante' } },
  ];

  return { resolver, foucault, barra, giratoria, flujo, cruza, hilo, funcion, dinamica, gira, FUNCB, ejemplos, f };
})();

