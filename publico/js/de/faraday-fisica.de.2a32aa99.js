const Faraday = (() => {
  const Ex = typeof Expresion !== 'undefined' ? Expresion : require('../matematicas/expresion.js');
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-60) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function num(sc, k, nom, { opcional = false, signo = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} fehlt`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine Zahl sein`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss ${cero ? 'positiv oder 0' : 'größer als 0'} sein`);
    return v;
  }
  const entero = (sc, k, nom) => { const v = vacio(sc[k]) ? 1 : num(sc, k, nom); if (!Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine ganze Zahl sein`); return v; };
  const SIMB = { entrante: '⊗ eintretend', saliente: '⊙ austretend' };
  const sentido = (B, crece) => ((B === 'saliente') === crece ? 'im Uhrzeigersinn' : 'gegen den Uhrzeigersinn');

  function superficie(sc, pasos) {
    if (sc.forma === 'circulo') { const r = num(sc, 'r', 'der Radius'); const S = Math.PI * r * r; pasos.push({ t: 'Fläche der Schleife', html: `$S = π r^2 = π·${f(r)}^2$ = <b>${f(S)} m<sup>2</sup></b>` }); return { S, r }; }
    if (sc.forma === 'rectangulo') { const a = num(sc, 'a', 'die Seite a'), b = num(sc, 'b', 'die Seite b'); const S = a * b; pasos.push({ t: 'Fläche der Schleife', html: `$S = a b = ${f(a)}·${f(b)}$ = <b>${f(S)} m<sup>2</sup></b>` }); return { S, a, b }; }
    return { S: num(sc, 'S', 'die Fläche') };
  }

  function barra(sc) {
    const B = num(sc, 'B', 'das Feld B'), L = num(sc, 'L', 'die Länge des Stabes'), v = num(sc, 'v', 'die Geschwindigkeit', { signo: true }), R = num(sc, 'R', 'der Widerstand', { opcional: true });
    if (v === 0) throw new Error('Bei ruhendem Stab ändert sich der Fluss nicht, und es gibt keine induzierte EMK');
    const eps = B * L * Math.abs(v), crece = v > 0, sen = sentido(sc.sentidoB, crece);
    const pasos = [
      { t: 'Fluss durch den Stromkreis', html: `Der Stromkreis ist das Rechteck, das die Schienen mit dem Stab schließen; liegt der Stab im Abstand x, ist $Φ = B L x$ und, da $ {dx}/{dt} = v$, $ {dΦ}/{dt} = B L v$. Der Stab bewegt sich nach ${crece ? 'rechts: Fläche und Fluss nehmen zu' : 'links: Fläche und Fluss nehmen ab'}.` },
      { t: 'Faradaysches Gesetz', html: `$|ε| = |{dΦ}/{dt}| = B L v = ${f(B)}·${f(L)}·${f(Math.abs(v))}$ = <b>${f(eps)} V</b>` },
      { t: 'Lenzsche Regel', html: `Der ${SIMB[sc.sentidoB].split(' ')[1]} Fluss ${crece ? 'nimmt zu' : 'nimmt ab'}, daher erzeugt der induzierte Strom im Stromkreis ein ${crece !== (sc.sentidoB === 'saliente') ? 'austretendes' : 'eintretendes'} Feld: Er fließt <b>${sen}</b> (im Stab nach ${sen === 'gegen den Uhrzeigersinn' ? 'oben' : 'unten'}).` },
    ];
    let I = null, F = null, P = null;
    if (R) {
      I = eps / R; F = B * I * L; P = eps * I;
      pasos.push({ t: 'Induzierter Strom', html: `$I = ε/R = ${f(eps)}/${f(R)}$ = <b>${f(I)} A</b>` });
      pasos.push({ t: 'Kraft auf den Stab', html: `$F = I L B = ${f(I)}·${f(L)}·${f(B)}$ = <b>${f(F)} N</b> $= {B^2 L^2 v}/R$, der Geschwindigkeit entgegengerichtet (nach ${crece ? 'links' : 'rechts'}). Um v konstant zu halten, muss mit einer gleich großen, entgegengesetzt gerichteten Kraft geschoben werden.` });
      pasos.push({ t: 'Leistung', html: `$P = F v = ε I = ε^2/R$ = <b>${f(P)} W</b>: Die mechanische Leistung des Schiebenden wird durch Joulesche Wärme im Widerstand verbraucht.` });
    }
    return { modo: 'barra', B, L, v, R, eps, I, F, P, sentido: sen, sentidoB: sc.sentidoB, pasos };
  }

  function giratoria(sc) {
    const pasos = [], N = entero(sc, 'N', 'die Windungszahl'), B = num(sc, 'B', 'das Feld B'), sup = superficie(sc, pasos), S = sup.S;
    const x = num(sc, 'w', 'die Drehgeschwindigkeit'), uw = sc.uw || 'Hz';
    const w = uw === 'rad/s' ? x : uw === 'rpm' ? (2 * Math.PI * x) / 60 : 2 * Math.PI * x, fr = w / (2 * Math.PI);
    if (uw !== 'rad/s') pasos.push({ t: 'Winkelgeschwindigkeit', html: `$ω = ${uw === 'rpm' ? `{2π·${f(x)}}/60` : `2π f = 2π·${f(x)}`}$ = <b>${f(w)} rad/s</b>${uw === 'rpm' ? ` (f = ${f(fr)} Hz)` : ''}` });
    const Fm = N * B * S, em = Fm * w, ef = em / Math.SQRT2, R = num(sc, 'R', 'der Widerstand', { opcional: true });
    pasos.push({ t: 'Fluss', html: `Ist die Normale der Schleife bei t = 0 parallel zu B, ist der Winkel θ = ωt und $Φ(t) = N B S cos(ω t)$, mit $Φ_max = N B S = ${N}·${f(B)}·${f(S)}$ = <b>${f(Fm)} Wb</b>` });
    pasos.push({ t: 'Faradaysches Gesetz', html: `$ε(t) = −{dΦ}/{dt} = N B S ω sin(ω t)$ ⇒ $ε_max = ${f(Fm)}·${f(w)}$ = <b>${f(em)} V</b>; Effektivwert $ε_ef = {ε_max}/√2$ = <b>${f(ef)} V</b>. Die EMK ist eine Wechselspannung mit der Frequenz ${f(fr)} Hz.` });
    let Im = null, Pm = null, et = null;
    const t = num(sc, 't', 'der Zeitpunkt t', { opcional: true, cero: true });
    if (t !== null) { et = em * Math.sin(w * t); pasos.push({ t: `Bei t = ${f(t)} s`, html: `$ε = ${f(em)}·sin(${f(w)}·${f(t)})$ = <b>${f(et)} V</b>; Φ = ${f(Fm * Math.cos(w * t))} Wb` }); }
    if (R) { Im = em / R; Pm = (ef * ef) / R; pasos.push({ t: 'Mit einem Widerstand R', html: `$I_max = {ε_max}/R$ = <b>${f(Im)} A</b>, I<sub>ef</sub> = ${f(Im / Math.SQRT2)} A; mittlere Leistung $P = {ε_ef^2}/R$ = <b>${f(Pm)} W</b>` }); pasos.push({ t: 'Drehmoment zum Aufrechterhalten der Drehung', html: `Das Feld bremst die Spule mit einem Drehmoment $M = Φ_max I sin(ω t) = {ε I}/ω$. Damit sie sich mit konstantem ω dreht, muss ein mittleres Drehmoment $M_media = P/ω = ${f(Pm)}/${f(w)}$ = <b>${f(Pm / w)} N·m</b> aufgebracht werden (Maximum ${f((em * Im) / w)} N·m). In jeder Umdrehung werden P·T = <b>${f(Pm / fr)} J</b> verbraucht.` }); }
    return { modo: 'giratoria', N, B, S, w, fr, Fm, em, ef, R, Im, Pm, par: Pm === null ? null : Pm / w, t, et, pasos };
  }

  function flujo(sc) {
    const pasos = [], N = entero(sc, 'N', 'die Windungszahl'), sup = superficie(sc, pasos), S = sup.S;
    const B1 = num(sc, 'B1', 'das Anfangsfeld', { signo: true }), B2 = vacio(sc.B2) ? B1 : num(sc, 'B2', 'das Endfeld', { signo: true });
    const th1 = vacio(sc.th1) ? 0 : num(sc, 'th1', 'der Anfangswinkel', { signo: true }), th2 = vacio(sc.th2) ? th1 : num(sc, 'th2', 'der Endwinkel', { signo: true });
    const dt = num(sc, 'dt', 'das Zeitintervall'), R = num(sc, 'R', 'der Widerstand', { opcional: true });
    const cosG = (th) => { const c = Math.cos((th * Math.PI) / 180); return Math.abs(c) < 1e-12 ? 0 : c; }, c1 = cosG(th1), c2 = cosG(th2);
    const F1 = N * B1 * S * c1, F2 = N * B2 * S * c2, dF = F2 - F1;
    if (Math.abs(dF) < 1e-15 * (Math.abs(F1) + Math.abs(F2) + 1e-30)) throw new Error('Der Fluss ändert sich nicht: Weder das Feld noch der Winkel ändern sich, also gibt es keine induzierte EMK');
    const cos = (th, c) => (th ? `cos ${f(th)}°` : '1');
    pasos.push({ t: 'Anfangs- und Endfluss', html: `$Φ = N B S cos θ$ (θ, Winkel zwischen B und der Normalen)<br>$Φ_1 = ${N}·${f(B1)}·${f(S)}·${cos(th1, c1)}$ = <b>${f(F1)} Wb</b>, &nbsp; $Φ_2 = ${N}·${f(B2)}·${f(S)}·${cos(th2, c2)}$ = <b>${f(F2)} Wb</b>` });
    const em = -dF / dt;
    pasos.push({ t: 'Mittlere EMK (Faraday)', html: `$ε = −{ΔΦ}/{Δt} = −{${f(F2)} − ${f(F1)}}/{${f(dt)}}$ = <b>${f(em)} V</b>` });
    const sen = sentido(sc.sentidoB, dF > 0);
    pasos.push({ t: 'Lenzsche Regel', html: `Der ${SIMB[sc.sentidoB].split(' ')[1]} Fluss ${dF > 0 ? 'nimmt zu' : 'nimmt ab'}: Der induzierte Strom erzeugt ein ${(dF > 0) !== (sc.sentidoB === 'saliente') ? 'austretendes' : 'eintretendes'} Feld, das der Änderung entgegenwirkt, daher fließt er <b>${sen}</b>, von der Bildschirmseite aus gesehen.` });
    let I = null, q = null;
    if (R) { I = Math.abs(em) / R; q = Math.abs(dF) / R; pasos.push({ t: 'Strom und Ladung', html: `$I = |ε|/R = ${f(Math.abs(em))}/${f(R)}$ = <b>${f(I)} A</b>; fließende Ladung: $q = |ΔΦ|/R$ = <b>${f(q)} C</b> (hängt nicht davon ab, wie schnell sich der Fluss ändert)` }); }
    return { modo: 'flujo', N, S, B1, B2, th1, th2, dt, F1, F2, dF, em, R, I, q, sentido: sen, sentidoB: sc.sentidoB, forma: sc.forma, pasos };
  }

  function cruza(sc) {
    const N = entero(sc, 'N', 'die Windungszahl'), a = num(sc, 'a', 'die Seite der Schleife'), D = num(sc, 'D', 'die Breite des Bereichs'), v = num(sc, 'v', 'die Geschwindigkeit'), B = num(sc, 'B', 'das Feld B'), R = num(sc, 'R', 'der Widerstand', { opcional: true });
    const eps = N * B * a * v, m = Math.min(a, D), M = Math.max(a, D);
    const t1 = m / v, t2 = M / v, t3 = (a + D) / v;
    const tramos = [
      { t0: 0, t1, eps, sentido: sentido(sc.sentidoB, true), q: 'entra' },
      { t0: t1, t1: t2, eps: 0, sentido: null, q: a <= D ? 'dentro' : 'tapa' },
      { t0: t2, t1: t3, eps: -eps, sentido: sentido(sc.sentidoB, false), q: 'sale' },
    ];
    const pasos = [
      { t: 'Fluss je nach Position', html: `Ist x der bereits eingetretene Teil der vorderen Seite, gilt Φ = N B a·(Teil der Schleife im Feld). Beim Eintreten wächst Φ = N B a x; bei ${a <= D ? 'ganz im Feld liegender Schleife' : 'vollständig von der Schleife bedecktem Bereich'} ändert er sich nicht (Φ<sub>max</sub> = N B a·${f(m)} = ${f(N * B * a * m)} Wb), und beim Austreten nimmt er ab.` },
      { t: 'EMK beim Ein- und Austreten', html: `$|ε| = N B a v = ${N}·${f(B)}·${f(a)}·${f(v)}$ = <b>${f(eps)} V</b> während t = ${f(t1)} s beim Eintreten und weiteren ${f(t1)} s beim Austreten; ε = 0 ${t2 > t1 ? `während der dazwischenliegenden ${f(t2 - t1)} s` : 'im dazwischenliegenden Augenblick'}.` },
      { t: 'Lenzsche Regel', html: `Beim Eintreten nimmt der ${SIMB[sc.sentidoB].split(' ')[1]} Fluss zu: Strom <b>${tramos[0].sentido}</b>. Beim Austreten nimmt er ab: <b>${tramos[2].sentido}</b>.` },
    ];
    let I = null, F = null, Q = null;
    if (R) {
      I = eps / R; F = N * B * I * a; Q = 2 * eps * I * t1;
      pasos.push({ t: 'Strom, Kraft und Wärme', html: `$I = ε/R$ = <b>${f(I)} A</b>; beim Ein- oder Austreten bremst das Feld die Schleife mit $F = N I a B$ = <b>${f(F)} N</b> (nach hinten). Insgesamt verbrauchte Wärme (beim Ein- und Austreten): $Q = 2 ε I t = 2·${f(eps)}·${f(I)}·${f(t1)}$ = <b>${f(Q)} J</b>` });
    }
    return { modo: 'cruza', N, a, D, v, B, R, eps, I, F, Q, tramos, t3, sentidoB: sc.sentidoB, pasos };
  }


  const MU0 = 4e-7 * Math.PI;

  function hilo(sc) {
    const I = num(sc, 'I', 'der Strom des Drahtes', { signo: true, cero: true }), d = num(sc, 'd', 'der Abstand vom Draht zur Schleife'), w = num(sc, 'w', 'die Breite der Schleife'), h = num(sc, 'h', 'die Höhe der Schleife'), N = entero(sc, 'N', 'die Windungszahl');
    const v = num(sc, 'v', 'die Geschwindigkeit', { opcional: true, signo: true }) ?? 0, dI = num(sc, 'dIdt', 'dI/dt', { opcional: true, signo: true }) ?? 0, R = num(sc, 'R', 'der Widerstand', { opcional: true });
    const sentidoB = (sc.sentidoI === 'abajo') === (I >= 0) ? 'saliente' : 'entrante', ln = Math.log((d + w) / d), k = (MU0 * N * h) / (2 * Math.PI);
    const Phi = k * Math.abs(I) * ln, dPhi = k * (Math.sign(I || 1) * dI * ln + Math.abs(I) * v * (1 / (d + w) - 1 / d));
    const pasos = [
      { t: 'Feld des Drahtes', html: `$B(x) = {μ_0 I}/{2π x}$, im Abstand x vom Draht; in der Schleife ist es <b>${SIMB[sentidoB]}</b> (Rechte-Hand-Regel) und nicht gleichförmig: Es muss integriert werden.` },
      { t: 'Fluss in der Schleife', html: `$Φ = N ∫_d^{d+w} {μ_0 I h}/{2π x} dx = {μ_0 N I h}/{2π} ln({d + w}/d) = 2·10^{−7}·${N}·${f(Math.abs(I))}·${f(h)}·ln(${f((d + w) / d)})$ = <b>${f(Phi)} Wb</b>` },
    ];
    if (!v && !dI) throw new Error('Schreibe die Geschwindigkeit der Schleife oder wie sich der Strom ändert (dI/dt): Ändert sich nichts, gibt es keine EMK');
    const partes = [];
    if (dI) partes.push(`durch den sich ändernden Strom: $ {μ_0 N h}/{2π} ln({d + w}/d) {dI}/{dt} = ${f(k * ln)}·${f(dI)}$ = ${f(k * ln * dI * Math.sign(I || 1))} Wb/s`);
    if (v) partes.push(`durch die Bewegung: mit x = d, $ {dx}/{dt} = v$, $ {dΦ}/{dt} = {μ_0 N I h}/{2π} (1/{d + w} − 1/d) v = −{μ_0 N I h w v}/{2π d (d + w)}$ = ${f(Math.abs(I) * k * v * (1 / (d + w) - 1 / d))} Wb/s`);
    pasos.push({ t: 'Änderungsrate des Flusses', html: partes.join('<br>') + (partes.length > 1 ? `<br>Insgesamt $ {dΦ}/{dt}$ = ${f(dPhi)} Wb/s` : '') });
    const eps = Math.abs(dPhi), crece = dPhi > 0, sen = sentido(sentidoB, crece);
    pasos.push({ t: 'Faradaysches Gesetz', html: `$|ε| = |{dΦ}/{dt}|$ = <b>${f(eps)} V</b>${v ? ` (in dem Augenblick, in dem die Schleife bei d = ${f(d)} m liegt)` : ''}` });
    pasos.push({ t: 'Lenzsche Regel', html: `Der ${SIMB[sentidoB].split(' ')[1]} Fluss ${crece ? 'nimmt zu' : 'nimmt ab'}: Der induzierte Strom fließt <b>${sen}</b>.` });
    let Ii = null, F = null;
    if (R) {
      Ii = eps / R; pasos.push({ t: 'Induzierter Strom', html: `$I_ind = ε/R$ = <b>${f(Ii)} A</b>` });
      F = (MU0 * Math.abs(I) * Ii * h * N / (2 * Math.PI)) * (1 / d - 1 / (d + w));
      pasos.push({ t: 'Kraft auf die Schleife', html: `Die zum Draht parallelen Seiten führen entgegengesetzte Ströme und liegen in unterschiedlichen Feldern: $F = {μ_0 N I I_ind h}/{2π} (1/d − 1/{d + w})$ = <b>${f(F)} N</b>, die der Änderung entgegenwirkt (${crece ? 'sie drückt die Schleife vom Draht weg' : 'sie zieht die Schleife zum Draht hin'}).` });
    }
    return { modo: 'hilo', I, d, w, h, N, v, dI, R, Phi, dPhi, eps, Ii, F, sentido: sen, sentidoB, pasos };
  }

  const FUNCB = {
    lineal: { nombre: 'B = B₀ + k t', B: (p, t) => p.B0 + p.k * t, dB: (p) => p.k, tex: (p) => `B(t) = ${f(p.B0)} + ${f(p.k)} t`, dtex: (p) => `{dB}/{dt} = k = ${f(p.k)} "T/s"` },
    cuadratica: { nombre: 'B = B₀ + k t²', B: (p, t) => p.B0 + p.k * t * t, dB: (p, t) => 2 * p.k * t, tex: (p) => `B(t) = ${f(p.B0)} + ${f(p.k)} t^2`, dtex: (p) => `{dB}/{dt} = 2 k t = ${f(2 * p.k)} t` },
    seno: { nombre: 'B = B₀ sen(ωt)', B: (p, t) => p.B0 * Math.sin(p.w * t), dB: (p, t) => p.B0 * p.w * Math.cos(p.w * t), tex: (p) => `B(t) = ${f(p.B0)} sen(${f(p.w)} t)`, dtex: (p) => `{dB}/{dt} = B_0 ω cos(ω t) = ${f(p.B0 * p.w)} cos(${f(p.w)} t)` },
    exp: { nombre: 'B = B₀ e^(−t/τ)', B: (p, t) => p.B0 * Math.exp(-t / p.tau), dB: (p, t) => (-p.B0 / p.tau) * Math.exp(-t / p.tau), tex: (p) => `B(t) = ${f(p.B0)} e^{−t/${f(p.tau)}}`, dtex: (p) => `{dB}/{dt} = −{B_0}/τ e^{−t/τ} = ${f(-p.B0 / p.tau)} e^{−t/${f(p.tau)}}` },
  };
  FUNCB.libre = { nombre: 'B(t) gibst du selbst ein', B: (p, t) => Ex.valor(p.ast, 0, { t }), dB: (p, t) => Ex.valor(p.dast, 0, { t }), tex: (p) => `B(t) = ${Ex.texto(p.ast)}`, dtex: (p) => `{dB}/{dt} = ${Ex.texto(p.dast)}` };
  function tramosLenz(Bf, dBf, tf, sentidoB) {
    const escala = Math.max(...Array.from({ length: 401 }, (_, i) => Math.abs(dBf((tf * i) / 400))), 1e-300);
    const est = (t) => { const B = Bf(t), dB = dBf(t); if (Math.abs(dB) <= 1e-9 * escala) return 'kein Strom'; const Bpos = (B >= 0) === (sentidoB !== 'saliente') ? 'entrante' : 'saliente'; return sentido(Bpos, B >= 0 ? dB > 0 : dB < 0); };
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
    const pasos = [], N = entero(sc, 'N', 'die Windungszahl'), sup = superficie(sc, pasos), S = sup.S, tipo = FUNCB[sc.tipoB] ? sc.tipoB : 'lineal', Fb = FUNCB[tipo];
    const p = tipo === 'libre' ? {} : { B0: num(sc, 'B0', 'B₀', { signo: true, cero: true }) };
    if (tipo === 'libre') { p.ast = Ex.lee(sc.expr, 'B(t)', ['t']); p.dast = Ex.deriva(p.ast, 't'); if (!Ex.tieneX(p.ast, 't')) throw new Error('B(t) muss von t abhängen: sonst ändert sich das Feld nicht'); }
    if (tipo === 'lineal' || tipo === 'cuadratica') p.k = num(sc, 'k', 'die Konstante k', { signo: true });
    if (tipo === 'seno') p.w = num(sc, 'w', 'die Kreisfrequenz ω');
    if (tipo === 'exp') p.tau = num(sc, 'tau', 'die Zeitkonstante τ');
    if (tipo === 'seno' && !p.B0) throw new Error('Mit B₀ = 0 ändert sich das Feld nicht');
    const th = vacio(sc.th) ? 0 : num(sc, 'th', 'der Winkel θ', { signo: true, cero: true }), c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180);
    if (!c) throw new Error('Bei θ = 90° liegt das Feld parallel zur Leiterschleife und es gibt keinen Fluss');
    const t = num(sc, 't', 'der Zeitpunkt t', { cero: true }), R = num(sc, 'R', 'der Widerstand', { opcional: true });
    const Bt = Fb.B(p, t), dBt = Fb.dB(p, t), Phi = N * Bt * S * c, eps = -N * S * c * dBt, cc = th ? ` cos ${f(th)}°` : '';
    pasos.push({ t: 'Feld', html: `$${Fb.tex(p)}$ (in T, mit t in s)` });
    pasos.push({ t: 'Fluss', html: `$Φ(t) = N B(t) S cos θ = ${N}·${f(S)}${cc}·B(t)$; bei t = ${f(t)} s ist B = ${f(Bt)} T und Φ = <b>${f(Phi)} Wb</b>` });
    pasos.push({ t: 'Faradaysches Gesetz', html: `$ε(t) = −{dΦ}/{dt} = −N S cos θ {dB}/{dt}$, mit $${Fb.dtex(p)}$<br>Bei t = ${f(t)} s: $ε = −${N}·${f(S)}${cc}·${f(dBt)}$ = <b>${f(eps)} V</b>` });
    const crece = Bt >= 0 ? dBt > 0 : dBt < 0, Bpos = (Bt >= 0) === (sc.sentidoB !== 'saliente') ? 'entrante' : 'saliente';
    let sen = null;
    if (Math.abs(dBt) > 1e-15) { sen = sentido(Bpos, Math.abs(Bt) < 1e-15 ? true : crece); pasos.push({ t: 'Lenzsche Regel', html: `In diesem Moment ${Math.abs(Bt) < 1e-15 ? 'empieza a crecer' : crece ? 'aumenta' : 'disminuye'} der Fluss: Der induzierte Strom fließt, vom Bildschirm aus gesehen, <b>${sen}</b>.` }); }
    else pasos.push({ t: 'Lenzsche Regel', html: 'In diesem Moment ändert sich der Fluss nicht: Es fließt kein induzierter Strom.' });
    let I = null;
    if (R) { I = eps / R; pasos.push({ t: 'Strom', html: `$I = ε/R$ = <b>${f(I)} A</b>` }); }
    let tramos = null, tf = null;
    if (tipo === 'libre') {
      tf = vacio(sc.tf) ? Math.max(t * 1.6, 1) : num(sc, 'tf', 'das Ende des Zeitfensters');
      tramos = tramosLenz((x) => Fb.B(p, x), (x) => Fb.dB(p, x), tf, sc.sentidoB);
      pasos.push({ t: 'Lenz\'sche Regel abschnittsweise', html: `Die Stromrichtung wechselt, wenn $dB/dt$ das Vorzeichen wechselt oder B durch 0 geht (das Feld kehrt sich um). Zwischen 0 und ${f(tf)} s:<br>` + tramos.map((q) => `von ${f(q.t0)} bis ${f(q.t1)} s: <b>${q.sentido === 'sin corriente' ? 'kein Strom (der Fluss ändert sich nicht)' : 'Strom in Richtung ' + q.sentido}</b>`).join('<br>') });
    }
    return { modo: 'funcion', tramos, tf, tipo, p, N, S, c, th, t, Bt, Phi, eps, R, I, sentido: sen, sentidoB: Bpos, forma: sc.forma, Bf: (x) => Fb.B(p, x), Ef: (x) => -N * S * c * Fb.dB(p, x), pasos };
  }

  function dinamica(sc) {
    const caso = ['fuerza', 'cae', 'lanzada'].includes(sc.caso) ? sc.caso : 'fuerza', B = num(sc, 'B', 'das Feld B'), L = num(sc, 'L', 'die Länge des Stabes'), R = num(sc, 'R', 'der Widerstand'), m = num(sc, 'm', 'die Masse des Stabs');
    const g = String(sc.g ?? '').replace(',', '.') === '9.80665' ? 9.80665 : 9.8, ang = caso === 'cae' && !vacio(sc.ang) ? num(sc, 'ang', 'der Winkel der Schienen', { signo: true }) : 90;
    if (ang <= 0 || ang > 90) throw new Error('Der Winkel der Schienen muss zwischen 0° (ausgeschlossen) und 90° liegen');
    const sn = ang === 90 ? 1 : Math.sin((ang * Math.PI) / 180), mg = m * g * sn, Fx = caso === 'fuerza' ? num(sc, 'F', 'die Kraft') : caso === 'cae' ? mg : 0, v0 = caso === 'lanzada' ? num(sc, 'v0', 'die Anfangsgeschwindigkeit') : 0;
    const t = num(sc, 't', 'der Zeitpunkt t', { opcional: true, cero: true }), b = (B * B * L * L) / R, tau = m / b, vL = Fx / b;
    const v = (x) => vL + (v0 - vL) * Math.exp(-x / tau), I = (x) => (B * L * v(x)) / R, pasos = [], mgT = ang === 90 ? 'm g' : 'm g sin θ';
    pasos.push({ t: 'Magnetische Kraft', html: `${caso === 'cae' && ang !== 90 ? `Die Schienen schließen ${f(ang)}° mit der Horizontalen ein und B steht senkrecht auf ihrer Ebene: Das Gewicht trägt entlang der Schienen $m g sin θ$ = ${f(mg)} N bei. ` : ''}Bei der Geschwindigkeit v ist die EMK $ε = B L v$, der Strom $I = {B L v}/R$ und das Feld bremst den Stab mit $F_m = I L B = {B^2 L^2 v}/R$ = ${f(b)}·v N.` });
    if (caso === 'lanzada') pasos.push({ t: 'Bewegungsgleichung', html: `$m {dv}/{dt} = −{B^2 L^2 v}/R ⇒ v(t) = v_0 e^{−t/τ}$, mit $τ = {m R}/{B^2 L^2}$ = <b>${f(tau)} s</b>.` });
    else pasos.push({ t: 'Bewegungsgleichung', html: `$m {dv}/{dt} = ${caso === 'cae' ? mgT : 'F'} − {B^2 L^2 v}/R ⇒ v(t) = v_L (1 − e^{−t/τ})$, mit $τ = {m R}/{B^2 L^2}$ = <b>${f(tau)} s</b>.` });
    if (caso !== 'lanzada') pasos.push({ t: 'Grenzgeschwindigkeit', html: `Wenn die magnetische Kraft ${caso === 'cae' ? 'der Gewichtskraft' : 'der angewandten Kraft'} gleich wird: $ {B^2 L^2 v_L}/R = ${caso === 'cae' ? mgT : 'F'} ⇒ v_L = {${caso === 'cae' ? mgT : 'F'} R}/{B^2 L^2} = {${f(Fx)}·${f(R)}}/{${f(B)}^2·${f(L)}^2}$ = <b>${f(vL)} m/s</b>. Dann wird die gesamte Leistung ${caso === 'cae' ? 'des Gewichts' : 'der Kraft'} (${f(Fx * vL)} W) im Widerstand verbraucht.` });
    else pasos.push({ t: 'Strecke bis zum Stillstand', html: `$x = ∫ v dt = v_0 τ = ${f(v0)}·${f(tau)}$ = <b>${f(v0 * tau)} m</b>; die gesamte kinetische Energie, $1/2 m v_0^2$ = ${f(0.5 * m * v0 * v0)} J, endet als Wärme im Widerstand.` });
    let vt = null, It = null;
    if (t !== null) { vt = v(t); It = (B * L * vt) / R; pasos.push({ t: `Bei t = ${f(t)} s`, html: `$v = ${caso === 'lanzada' ? `${f(v0)} e^{−${f(t)}/${f(tau)}}` : `${f(vL)} (1 − e^{−${f(t)}/${f(tau)}})`}$ = <b>${f(vt)} m/s</b>; $ε = B L v$ = ${f(B * L * vt)} V e I = <b>${f(It)} A</b>` }); }
    const IL = (B * L * vL) / R;
    return { modo: 'dinamica', caso, B, L, R, m, g, ang, Fx, v0, tau, vL, IL, PL: Fx * vL, t, vt, It, vf: v, If: I, pasos };
  }

  function gira(sc) {
    const pasos = [], disco = sc.cuerpo === 'disco', B = num(sc, 'B', 'das Feld B'), L = num(sc, 'L', disco ? 'der Radius der Scheibe' : 'die Länge des Stabs');
    const x = num(sc, 'w', 'die Drehgeschwindigkeit'), uw = sc.uw || 'rad/s', w = uw === 'rad/s' ? x : uw === 'rpm' ? (2 * Math.PI * x) / 60 : 2 * Math.PI * x, R = num(sc, 'R', 'der Widerstand', { opcional: true });
    if (uw !== 'rad/s') pasos.push({ t: 'Winkelgeschwindigkeit', html: `$ω = ${uw === 'rpm' ? `{2π·${f(x)}}/60` : `2π·${f(x)}`}$ = <b>${f(w)} rad/s</b>` });
    const eps = 0.5 * B * w * L * L;
    pasos.push({ t: 'Bewegungs-EMK', html: `Ein Stück dr im Abstand r von der Achse hat die Geschwindigkeit v = ω r, also $dε = B v dr = B ω r dr$. Integriert ${disco ? 'von der Achse bis zum Rand' : 'entlang des Stabs'}: $ε = ∫_0^${disco ? 'R' : 'L'} B ω r dr = 1/2 B ω ${disco ? 'R' : 'L'}^2 = 1/2·${f(B)}·${f(w)}·${f(L)}^2$ = <b>${f(eps)} V</b>` });
    pasos.push({ t: 'Anders gerechnet: die überstrichene Fläche', html: `In der Zeit dt überstreicht ${disco ? 'jeder Radius' : 'der Stab'} einen Sektor mit der Fläche $1/2 ${disco ? 'R' : 'L'}^2 ω dt$, also $ {dΦ}/{dt} = 1/2 B ω ${disco ? 'R' : 'L'}^2$: dasselbe Ergebnis.${disco ? ' Die EMK entsteht zwischen der Achse und dem Rand der Scheibe, die über Schleifkontakte angeschlossen werden.' : ''}` });
    let I = null, P = null;
    if (R) { I = eps / R; P = eps * I; pasos.push({ t: 'Mit einem Widerstand R', html: `$I = ε/R$ = <b>${f(I)} A</b>; Leistung $P = ε I$ = <b>${f(P)} W</b> und das Drehmoment, das zum Aufrechterhalten der Drehung nötig ist, $M = P/ω$ = <b>${f(P / w)} N·m</b>` }); }
    return { modo: 'gira', cuerpo: disco ? 'disco' : 'varilla', B, L, w, eps, R, I, P, sentidoB: sc.sentidoB, pasos };
  }

  function foucault(sc) {
    const pasos = [], lamina = sc.geo === 'lamina', sg = num(sc, 'sigma', 'die Leitfähigkeit σ') * 1e6, B0 = num(sc, 'B0', 'die Amplitude B₀'), fr = num(sc, 'fr', 'die Frequenz'), w = 2 * Math.PI * fr, MU0 = 4e-7 * Math.PI;
    const delta = Math.sqrt(2 / (w * MU0 * sg)), Bdot = B0 * w;
    pasos.push({ t: 'Feld und Faraday\'sches Gesetz', html: `$B(t) = B_0 sin ωt$ mit $ω = 2π f = ${f(w)} "rad/s"$, also $dB/dt = B_0 ω cos ωt$ und seine Amplitude ist $B_0 ω = ${f(Bdot)} "T/s"$. Ein sich änderndes Feld erzeugt ein elektrisches Feld, das im Leiter Ströme fließen lässt.` });
    let P, Pp, pv, geom, Jmax, Emax, aviso = null, comp = null, N = 1;
    if (!lamina) {
      const a = num(sc, 'a', 'der Radius der Scheibe') * 1e-2, d = num(sc, 'd', 'die Dicke der Scheibe') * 1e-3, Vol = Math.PI * a * a * d;
      Emax = (a * Bdot) / 2; Jmax = sg * Emax; P = (Math.PI * sg * d * a ** 4 * Bdot * Bdot) / 16; Pp = 2 * P; pv = P / Vol;
      geom = { a, d, Vol };
      pasos.push({ t: 'Induziertes elektrisches Feld', html: `Aus Symmetriegründen ist das Feld $E$ tangential zu Kreisen: $E · 2π r = −π r^2 dB/dt$, also $E(r) = {r}/{2} |dB/dt|$ und am Rand $E = {a B_0 ω}/{2} = ${f(Emax)} "V/m"$. Die Stromdichte ist $J = σ E$: Sie wächst linear mit $r$ bis $J_{max} = ${f(Jmax)} "A/m"^2$.` });
      pasos.push({ t: 'Verlustleistung', html: `Die Leistung pro Volumeneinheit ist $σ E^2$; über die Scheibe integriert: $P = ∫ σ E^2 dV = {π σ d a^4}/{8} (dB/dt)^2$. Ihr Mittelwert mit $⟨cos^2 ωt⟩ = 1/2$ ist $⟨P⟩ = {π σ d a^4 B_0^2 ω^2}/{16} = ${f(P)} "W"$ (Spitze ${f(Pp)} W).` });
      if (a > 0.5 * delta) aviso = `Der Radius (${f(a * 100)} cm) ist nicht klein gegenüber der Eindringtiefe δ = ${f(delta * 100)} cm: Das Feld dringt nicht gleichmäßig in die ganze Scheibe ein und dieses Modell überschätzt die Leistung.`;
    } else {
      const D = num(sc, 'D', 'die Gesamtdicke des Kerns') * 1e-3, Vol = num(sc, 'V', 'das Volumen des Kerns') * 1e-6; N = vacio(sc.N) ? 1 : num(sc, 'N', 'die Anzahl der Bleche');
      if (!Number.isInteger(N)) throw new Error('Die Anzahl der Bleche muss ganzzahlig sein');
      const dl = D / N; Emax = (dl / 2) * Bdot; Jmax = sg * Emax; pv = (sg * w * w * B0 * B0 * dl * dl) / 24; P = pv * Vol; Pp = 2 * P;
      const pv1 = (sg * w * w * B0 * B0 * D * D) / 24; comp = { P1: pv1 * Vol, N, dl, reduccion: N * N };
      geom = { D, dl, Vol };
      pasos.push({ t: 'Induziertes elektrisches Feld', html: `Mit $B$ in der Ebene eines Blechs der Dicke $d = ${f(dl * 1000)} "mm"$ kreisen die Ströme in der Ebene senkrecht zu $B$: In der Höhe $z$ von der Mitte gilt $E(z) = z |dB/dt|$. An der Oberfläche ist $E = {d B_0 ω}/{2} = ${f(Emax)} "V/m"$ und $J_{max} = σ E = ${f(Jmax)} "A/m"^2$.` });
      pasos.push({ t: 'Leistung pro Volumeneinheit', html: `Mittelwert über die Dicke: $⟨σ E^2⟩_z = σ (dB/dt)^2 d^2/12$ und zeitlicher Mittelwert: $p = {σ B_0^2 ω^2 d^2}/{24} = ${f(pv)} "W/m"^3$. Mit dem Volumen $${f(Vol * 1e6)} "cm"^3$: $⟨P⟩ = ${f(P)} "W"$.` });
      pasos.push({ t: 'Wirkung der Kernblechung', html: `Die Gesamtdicke $D = ${f(D * 1000)} "mm"$ wird in $N = ${N}$ isolierte Bleche mit $d = D/N$ aufgeteilt: Die Leistung sinkt mit $d^2$, also um den Faktor $N^2$. Ohne Blechung wären es $${f(comp.P1)} "W"$; mit Blechung ${f(P)} W: ${f(N * N)}-mal weniger.` });
      if (dl > 0.5 * delta) aviso = `Die Dicke jedes Blechs (${f(dl * 1000)} mm) ist nicht klein gegenüber der Eindringtiefe δ = ${f(delta * 1000)} mm: Das Feld wird im Blech abgeschwächt (Skin-Effekt) und dieses Modell überschätzt die Leistung.`;
    }
    pasos.push({ t: 'Eindringtiefe und Grenzen des Modells', html: `$δ = √{2/{ω μ_0 σ}} = ${f(delta * 1000)} "mm"$. Das Modell setzt ein im ganzen Bauteil homogenes Feld voraus und berücksichtigt weder das Feld der Ströme selbst (das es schwächt) noch die Permeabilität des Materials: Es gilt, wenn das Bauteil klein gegenüber δ ist.${aviso ? ' <b>Hinweis:</b> ' + aviso : ''}` });
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
    { clave: 'barra', nombre: 'Stab, der auf Schienen gleitet', sc: { modo: 'barra', B: '0.5', sentidoB: 'entrante', L: '0.2', v: '4', R: '2' } },
    { clave: 'barra-izq', nombre: 'Stab, der sich nach links bewegt', sc: { modo: 'barra', B: '0.8', sentidoB: 'saliente', L: '0.5', v: '-3', R: '0.5' } },
    { clave: 'alternador', nombre: 'Spule, die sich mit 50 Hz dreht (Wechselstromgenerator)', sc: { modo: 'giratoria', N: '100', B: '0.5', forma: 'rectangulo', a: '0.1', b: '0.2', w: '50', uw: 'Hz', R: '50', t: '' } },
    { clave: 'rpm', nombre: 'Kreisförmige Leiterschleife bei 3000 U/min', sc: { modo: 'giratoria', N: '200', B: '0.2', forma: 'circulo', r: '0.05', w: '3000', uw: 'rpm', R: '', t: '0.002' } },
    { clave: 'campo-crece', nombre: 'Wachsendes Feld in einer Spule', sc: { modo: 'flujo', N: '50', forma: 'circulo', r: '0.05', B1: '0', B2: '0.4', th1: '0', th2: '', dt: '0.1', sentidoB: 'entrante', R: '5' } },
    { clave: 'gira-90', nombre: 'Leiterschleife, die in einem Feld um 90° gedreht wird', sc: { modo: 'flujo', N: '1', forma: 'rectangulo', a: '0.3', b: '0.2', B1: '0.6', B2: '', th1: '0', th2: '90', dt: '0.2', sentidoB: 'saliente', R: '0.2' } },
    { clave: 'cruza', nombre: 'Quadratische Leiterschleife, die ein Feld durchquert', sc: { modo: 'cruza', N: '1', a: '0.1', D: '0.3', v: '2', B: '0.5', sentidoB: 'entrante', R: '0.1' } },
    { clave: 'hilo-aleja', nombre: 'Leiterschleife, die sich von einem Draht entfernt', sc: { modo: 'hilo', I: '10', sentidoI: 'arriba', d: '0.05', w: '0.1', h: '0.2', N: '1', v: '2', dIdt: '', R: '0.5' } },
    { clave: 'hilo-dIdt', nombre: 'Draht mit wachsendem Strom und ruhende Leiterschleife', sc: { modo: 'hilo', I: '5', sentidoI: 'arriba', d: '0.02', w: '0.08', h: '0.1', N: '100', v: '', dIdt: '200', R: '10' } },
    { clave: 'B-seno', nombre: 'Feld B₀ sin(ωt) in einer Spule', sc: { modo: 'funcion', N: '200', forma: 'circulo', r: '0.03', tipoB: 'seno', B0: '0.05', w: '314', th: '0', t: '0.002', sentidoB: 'entrante', R: '20' } },
    { clave: 'B-libre', nombre: 'Von Hand eingegebenes Feld B(t) mit Richtungswechsel', sc: { modo: 'funcion', N: '100', forma: 'circulo', r: '0.05', tipoB: 'libre', expr: '0.2 sen(2 pi t)', tf: '1', th: '0', t: '0.3', sentidoB: 'entrante', R: '4' } },
    { clave: 'B-cuadratica', nombre: 'Feld, das wie t² wächst', sc: { modo: 'funcion', N: '1', forma: 'rectangulo', a: '0.2', b: '0.3', tipoB: 'cuadratica', B0: '0', k: '0.4', th: '0', t: '2', sentidoB: 'saliente', R: '0.4' } },
    { clave: 'velocidad-limite', nombre: 'Stab, der auf senkrechten Schienen fällt', sc: { modo: 'dinamica', caso: 'cae', B: '0.5', L: '0.4', R: '0.2', m: '0.02', t: '0.1' } },
    { clave: 'barra-lanzada', nombre: 'Angestoßener Stab, der von selbst abbremst', sc: { modo: 'dinamica', caso: 'lanzada', B: '1', L: '0.5', R: '2', m: '0.1', v0: '5', t: '1' } },
    { clave: 'foucault-disco', nombre: 'Kupferscheibe in einem Feld von 0,1 T bei 50 Hz (Wirbelströme)', sc: { modo: 'foucault', geo: 'disco', sigma: '58', B0: '0,1', fr: '50', a: '5', d: '2' } },
    { clave: 'foucault-nucleo', nombre: 'Transformatorkern: 100 Bleche statt eines einzigen', sc: { modo: 'foucault', geo: 'lamina', sigma: '2', B0: '1', fr: '50', D: '20', N: '100', V: '500' } },
    { clave: 'disco', nombre: 'Faraday-Scheibe', sc: { modo: 'gira', cuerpo: 'disco', B: '0.8', L: '0.1', w: '3000', uw: 'rpm', R: '0.05', sentidoB: 'entrante' } },
    { clave: 'varilla-gira', nombre: 'Stab, der sich um ein Ende dreht', sc: { modo: 'gira', cuerpo: 'varilla', B: '0.5', L: '1', w: '20', uw: 'rad/s', R: '2', sentidoB: 'entrante' } },
  ];

  return { resolver, foucault, barra, giratoria, flujo, cruza, hilo, funcion, dinamica, gira, FUNCB, ejemplos, f };
})();

