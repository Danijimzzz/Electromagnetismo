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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} manquant`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} doit être un nombre`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} doit être ${cero ? 'positif ou nul' : 'supérieur à 0'}`);
    return v;
  }
  const entero = (sc, k, nom) => { const v = vacio(sc[k]) ? 1 : num(sc, k, nom); if (!Number.isInteger(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} doit être un nombre entier`); return v; };
  const SIMB = { entrante: '⊗ entrant', saliente: '⊙ sortant' };
  const sentido = (B, crece) => ((B === 'saliente') === crece ? 'horaire' : 'antihoraire');

  function superficie(sc, pasos) {
    if (sc.forma === 'circulo') { const r = num(sc, 'r', 'le rayon'); const S = Math.PI * r * r; pasos.push({ t: 'Surface de la spire', html: `$S = π r^2 = π·${f(r)}^2$ = <b>${f(S)} m<sup>2</sup></b>` }); return { S, r }; }
    if (sc.forma === 'rectangulo') { const a = num(sc, 'a', 'le côté a'), b = num(sc, 'b', 'le côté b'); const S = a * b; pasos.push({ t: 'Surface de la spire', html: `$S = a b = ${f(a)}·${f(b)}$ = <b>${f(S)} m<sup>2</sup></b>` }); return { S, a, b }; }
    return { S: num(sc, 'S', 'l\'aire') };
  }

  function barra(sc) {
    const B = num(sc, 'B', 'le champ B'), L = num(sc, 'L', 'la longueur de la barre'), v = num(sc, 'v', 'la vitesse', { signo: true }), R = num(sc, 'R', 'la résistance', { opcional: true });
    if (v === 0) throw new Error('Avec la barre immobile, le flux ne varie pas et il n\'y a pas de f.é.m. induite');
    const eps = B * L * Math.abs(v), crece = v > 0, sen = sentido(sc.sentidoB, crece);
    const pasos = [
      { t: 'Flux à travers le circuit', html: `Le circuit est le rectangle fermé par les rails et la barre ; si la barre est à une distance x, $Φ = B L x$ et, comme $ {dx}/{dt} = v$, $ {dΦ}/{dt} = B L v$. La barre se déplace vers la ${crece ? 'droite : la surface et le flux augmentent' : 'gauche : la surface et le flux diminuent'}.` },
      { t: 'Loi de Faraday', html: `$|ε| = |{dΦ}/{dt}| = B L v = ${f(B)}·${f(L)}·${f(Math.abs(v))}$ = <b>${f(eps)} V</b>` },
      { t: 'Loi de Lenz', html: `Le flux ${SIMB[sc.sentidoB].split(' ')[1]} ${crece ? 'augmente' : 'diminue'}, donc le courant induit crée un champ ${crece !== (sc.sentidoB === 'saliente') ? 'sortant' : 'entrant'} à l'intérieur du circuit : il circule dans le sens <b>${sen}</b> (dans la barre, vers ${sen === 'antihorario' ? 'le haut' : 'le bas'}).` },
    ];
    let I = null, F = null, P = null;
    if (R) {
      I = eps / R; F = B * I * L; P = eps * I;
      pasos.push({ t: 'Courant induit', html: `$I = ε/R = ${f(eps)}/${f(R)}$ = <b>${f(I)} A</b>` });
      pasos.push({ t: 'Force sur la barre', html: `$F = I L B = ${f(I)}·${f(L)}·${f(B)}$ = <b>${f(F)} N</b> $= {B^2 L^2 v}/R$, opposée à la vitesse (vers la ${crece ? 'gauche' : 'droite'}). Pour maintenir v constante, il faut pousser avec une force égale et de sens contraire.` });
      pasos.push({ t: 'Puissance', html: `$P = F v = ε I = ε^2/R$ = <b>${f(P)} W</b> : la puissance mécanique de celui qui pousse est dissipée dans la résistance par effet Joule.` });
    }
    return { modo: 'barra', B, L, v, R, eps, I, F, P, sentido: sen, sentidoB: sc.sentidoB, pasos };
  }

  function giratoria(sc) {
    const pasos = [], N = entero(sc, 'N', 'le nombre de spires'), B = num(sc, 'B', 'le champ B'), sup = superficie(sc, pasos), S = sup.S;
    const x = num(sc, 'w', 'la vitesse de rotation'), uw = sc.uw || 'Hz';
    const w = uw === 'rad/s' ? x : uw === 'rpm' ? (2 * Math.PI * x) / 60 : 2 * Math.PI * x, fr = w / (2 * Math.PI);
    if (uw !== 'rad/s') pasos.push({ t: 'Vitesse angulaire', html: `$ω = ${uw === 'rpm' ? `{2π·${f(x)}}/60` : `2π f = 2π·${f(x)}`}$ = <b>${f(w)} rad/s</b>${uw === 'rpm' ? ` (f = ${f(fr)} Hz)` : ''}` });
    const Fm = N * B * S, em = Fm * w, ef = em / Math.SQRT2, R = num(sc, 'R', 'la résistance', { opcional: true });
    pasos.push({ t: 'Flux', html: `Si à t = 0 la normale de la spire est parallèle à B, l'angle est θ = ωt et $Φ(t) = N B S cos(ω t)$, avec $Φ_max = N B S = ${N}·${f(B)}·${f(S)}$ = <b>${f(Fm)} Wb</b>` });
    pasos.push({ t: 'Loi de Faraday', html: `$ε(t) = −{dΦ}/{dt} = N B S ω sin(ω t)$ ⇒ $ε_max = ${f(Fm)}·${f(w)}$ = <b>${f(em)} V</b> ; valeur efficace $ε_eff = {ε_max}/√2$ = <b>${f(ef)} V</b>. La f.é.m. est alternative, de fréquence ${f(fr)} Hz.` });
    let Im = null, Pm = null, et = null;
    const t = num(sc, 't', 'l\'instant t', { opcional: true, cero: true });
    if (t !== null) { et = em * Math.sin(w * t); pasos.push({ t: `À t = ${f(t)} s`, html: `$ε = ${f(em)}·sin(${f(w)}·${f(t)})$ = <b>${f(et)} V</b> ; Φ = ${f(Fm * Math.cos(w * t))} Wb` }); }
    if (R) { Im = em / R; Pm = (ef * ef) / R; pasos.push({ t: 'Avec une résistance R', html: `$I_max = {ε_max}/R$ = <b>${f(Im)} A</b>, I<sub>eff</sub> = ${f(Im / Math.SQRT2)} A ; puissance moyenne $P = {ε_efff^2}/R$ = <b>${f(Pm)} W</b>` }); pasos.push({ t: 'Couple pour maintenir la rotation', html: `Le champ freine la bobine avec un couple $M = Φ_max I sin(ω t) = {ε I}/ω$. Pour qu'elle tourne à ω constante, il faut appliquer un couple moyen $M_moy = P/ω = ${f(Pm)}/${f(w)}$ = <b>${f(Pm / w)} N·m</b> (maximum ${f((em * Im) / w)} N·m). À chaque tour, P·T = <b>${f(Pm / fr)} J</b> sont dissipés.` }); }
    return { modo: 'giratoria', N, B, S, w, fr, Fm, em, ef, R, Im, Pm, par: Pm === null ? null : Pm / w, t, et, pasos };
  }

  function flujo(sc) {
    const pasos = [], N = entero(sc, 'N', 'le nombre de spires'), sup = superficie(sc, pasos), S = sup.S;
    const B1 = num(sc, 'B1', 'le champ initial', { signo: true }), B2 = vacio(sc.B2) ? B1 : num(sc, 'B2', 'le champ final', { signo: true });
    const th1 = vacio(sc.th1) ? 0 : num(sc, 'th1', 'l\'angle initial', { signo: true }), th2 = vacio(sc.th2) ? th1 : num(sc, 'th2', 'l\'angle final', { signo: true });
    const dt = num(sc, 'dt', 'l\'intervalle de temps'), R = num(sc, 'R', 'la résistance', { opcional: true });
    const cosG = (th) => { const c = Math.cos((th * Math.PI) / 180); return Math.abs(c) < 1e-12 ? 0 : c; }, c1 = cosG(th1), c2 = cosG(th2);
    const F1 = N * B1 * S * c1, F2 = N * B2 * S * c2, dF = F2 - F1;
    if (Math.abs(dF) < 1e-15 * (Math.abs(F1) + Math.abs(F2) + 1e-30)) throw new Error('Le flux ne change pas : ni le champ ni l\'angle ne varient, donc il n\'y a pas de f.é.m. induite');
    const cos = (th, c) => (th ? `cos ${f(th)}°` : '1');
    pasos.push({ t: 'Flux initial et final', html: `$Φ = N B S cos θ$ (θ, angle entre B et la normale)<br>$Φ_1 = ${N}·${f(B1)}·${f(S)}·${cos(th1, c1)}$ = <b>${f(F1)} Wb</b>, &nbsp; $Φ_2 = ${N}·${f(B2)}·${f(S)}·${cos(th2, c2)}$ = <b>${f(F2)} Wb</b>` });
    const em = -dF / dt;
    pasos.push({ t: 'F.é.m. moyenne (Faraday)', html: `$ε = −{ΔΦ}/{Δt} = −{${f(F2)} − ${f(F1)}}/{${f(dt)}}$ = <b>${f(em)} V</b>` });
    const sen = sentido(sc.sentidoB, dF > 0);
    pasos.push({ t: 'Loi de Lenz', html: `Le flux ${SIMB[sc.sentidoB].split(' ')[1]} ${dF > 0 ? 'augmente' : 'diminue'} : le courant induit crée un champ ${(dF > 0) !== (sc.sentidoB === 'saliente') ? 'sortant' : 'entrant'} qui s'oppose à la variation, donc il circule dans le sens <b>${sen}</b> vu du côté de l'écran.` });
    let I = null, q = null;
    if (R) { I = Math.abs(em) / R; q = Math.abs(dF) / R; pasos.push({ t: 'Courant et charge', html: `$I = |ε|/R = ${f(Math.abs(em))}/${f(R)}$ = <b>${f(I)} A</b> ; charge qui passe : $q = |ΔΦ|/R$ = <b>${f(q)} C</b> (elle ne dépend pas de la rapidité de variation du flux)` }); }
    return { modo: 'flujo', N, S, B1, B2, th1, th2, dt, F1, F2, dF, em, R, I, q, sentido: sen, sentidoB: sc.sentidoB, forma: sc.forma, pasos };
  }

  function cruza(sc) {
    const N = entero(sc, 'N', 'le nombre de spires'), a = num(sc, 'a', 'le côté de la spire'), D = num(sc, 'D', 'la largeur de la région'), v = num(sc, 'v', 'la vitesse'), B = num(sc, 'B', 'le champ B'), R = num(sc, 'R', 'la résistance', { opcional: true });
    const eps = N * B * a * v, m = Math.min(a, D), M = Math.max(a, D);
    const t1 = m / v, t2 = M / v, t3 = (a + D) / v;
    const tramos = [
      { t0: 0, t1, eps, sentido: sentido(sc.sentidoB, true), q: 'entra' },
      { t0: t1, t1: t2, eps: 0, sentido: null, q: a <= D ? 'dentro' : 'tapa' },
      { t0: t2, t1: t3, eps: -eps, sentido: sentido(sc.sentidoB, false), q: 'sale' },
    ];
    const pasos = [
      { t: 'Flux selon la position', html: `Si x est la distance dont le côté avant est entré, Φ = N B a·(partie de la spire dans le champ). Pendant l'entrée, Φ = N B a x croît ; avec ${a <= D ? 'la spire entière dans la région' : 'la région entière couverte par la spire'} il ne change pas (Φ<sub>max</sub> = N B a·${f(m)} = ${f(N * B * a * m)} Wb), et pendant la sortie il décroît.` },
      { t: 'F.é.m. à l\'entrée et à la sortie', html: `$|ε| = N B a v = ${N}·${f(B)}·${f(a)}·${f(v)}$ = <b>${f(eps)} V</b> pendant t = ${f(t1)} s à l'entrée et encore ${f(t1)} s à la sortie ; ε = 0 ${t2 > t1 ? `pendant les ${f(t2 - t1)} s intermédiaires` : 'au moment intermédiaire'}.` },
      { t: 'Loi de Lenz', html: `À l'entrée, le flux ${SIMB[sc.sentidoB].split(' ')[1]} augmente : courant dans le sens <b>${tramos[0].sentido}</b>. À la sortie, il diminue : sens <b>${tramos[2].sentido}</b>.` },
    ];
    let I = null, F = null, Q = null;
    if (R) {
      I = eps / R; F = N * B * I * a; Q = 2 * eps * I * t1;
      pasos.push({ t: 'Courant, force et chaleur', html: `$I = ε/R$ = <b>${f(I)} A</b> ; pendant l'entrée ou la sortie, le champ freine la spire avec $F = N I a B$ = <b>${f(F)} N</b> (vers l'arrière). Chaleur totale dissipée (à l'entrée et à la sortie) : $Q = 2 ε I t = 2·${f(eps)}·${f(I)}·${f(t1)}$ = <b>${f(Q)} J</b>` });
    }
    return { modo: 'cruza', N, a, D, v, B, R, eps, I, F, Q, tramos, t3, sentidoB: sc.sentidoB, pasos };
  }


  const MU0 = 4e-7 * Math.PI;

  function hilo(sc) {
    const I = num(sc, 'I', 'le courant du fil', { signo: true, cero: true }), d = num(sc, 'd', 'la distance du fil à la spire'), w = num(sc, 'w', 'la largeur de la spire'), h = num(sc, 'h', 'la hauteur de la spire'), N = entero(sc, 'N', 'le nombre de spires');
    const v = num(sc, 'v', 'la vitesse', { opcional: true, signo: true }) ?? 0, dI = num(sc, 'dIdt', 'dI/dt', { opcional: true, signo: true }) ?? 0, R = num(sc, 'R', 'la résistance', { opcional: true });
    const sentidoB = (sc.sentidoI === 'abajo') === (I >= 0) ? 'saliente' : 'entrante', ln = Math.log((d + w) / d), k = (MU0 * N * h) / (2 * Math.PI);
    const Phi = k * Math.abs(I) * ln, dPhi = k * (Math.sign(I || 1) * dI * ln + Math.abs(I) * v * (1 / (d + w) - 1 / d));
    const pasos = [
      { t: 'Champ du fil', html: `$B(x) = {μ_0 I}/{2π x}$, à une distance x du fil ; dans la spire il est <b>${SIMB[sentidoB]}</b> (règle de la main droite) et n'est pas uniforme : il faut intégrer.` },
      { t: 'Flux dans la spire', html: `$Φ = N ∫_d^{d+w} {μ_0 I h}/{2π x} dx = {μ_0 N I h}/{2π} ln({d + w}/d) = 2·10^{−7}·${N}·${f(Math.abs(I))}·${f(h)}·ln(${f((d + w) / d)})$ = <b>${f(Phi)} Wb</b>` },
    ];
    if (!v && !dI) throw new Error('Saisissez la vitesse de la spire ou la variation du courant (dI/dt) : si rien ne change, il n\'y a pas de f.é.m.');
    const partes = [];
    if (dI) partes.push(`due au courant variable : $ {μ_0 N h}/{2π} ln({d + w}/d) {dI}/{dt} = ${f(k * ln)}·${f(dI)}$ = ${f(k * ln * dI * Math.sign(I || 1))} Wb/s`);
    if (v) partes.push(`due au mouvement : avec x = d, $ {dx}/{dt} = v$, $ {dΦ}/{dt} = {μ_0 N I h}/{2π} (1/{d + w} − 1/d) v = −{μ_0 N I h w v}/{2π d (d + w)}$ = ${f(Math.abs(I) * k * v * (1 / (d + w) - 1 / d))} Wb/s`);
    pasos.push({ t: 'Taux de variation du flux', html: partes.join('<br>') + (partes.length > 1 ? `<br>Au total $ {dΦ}/{dt}$ = ${f(dPhi)} Wb/s` : '') });
    const eps = Math.abs(dPhi), crece = dPhi > 0, sen = sentido(sentidoB, crece);
    pasos.push({ t: 'Loi de Faraday', html: `$|ε| = |{dΦ}/{dt}|$ = <b>${f(eps)} V</b>${v ? ` (à l'instant où la spire est à d = ${f(d)} m)` : ''}` });
    pasos.push({ t: 'Loi de Lenz', html: `Le flux ${SIMB[sentidoB].split(' ')[1]} ${crece ? 'augmente' : 'diminue'} : le courant induit circule dans le sens <b>${sen}</b>.` });
    let Ii = null, F = null;
    if (R) {
      Ii = eps / R; pasos.push({ t: 'Courant induit', html: `$I_ind = ε/R$ = <b>${f(Ii)} A</b>` });
      F = (MU0 * Math.abs(I) * Ii * h * N / (2 * Math.PI)) * (1 / d - 1 / (d + w));
      pasos.push({ t: 'Force sur la spire', html: `Les côtés parallèles au fil portent des courants opposés et se trouvent dans des champs différents : $F = {μ_0 N I I_ind h}/{2π} (1/d − 1/{d + w})$ = <b>${f(F)} N</b>, qui s'oppose à la variation (${crece ? 'elle repousse la spire loin du fil' : 'elle tire la spire vers le fil'}).` });
    }
    return { modo: 'hilo', I, d, w, h, N, v, dI, R, Phi, dPhi, eps, Ii, F, sentido: sen, sentidoB, pasos };
  }

  const FUNCB = {
    lineal: { nombre: 'B = B₀ + k t', B: (p, t) => p.B0 + p.k * t, dB: (p) => p.k, tex: (p) => `B(t) = ${f(p.B0)} + ${f(p.k)} t`, dtex: (p) => `{dB}/{dt} = k = ${f(p.k)} "T/s"` },
    cuadratica: { nombre: 'B = B₀ + k t²', B: (p, t) => p.B0 + p.k * t * t, dB: (p, t) => 2 * p.k * t, tex: (p) => `B(t) = ${f(p.B0)} + ${f(p.k)} t^2`, dtex: (p) => `{dB}/{dt} = 2 k t = ${f(2 * p.k)} t` },
    seno: { nombre: 'B = B₀ sen(ωt)', B: (p, t) => p.B0 * Math.sin(p.w * t), dB: (p, t) => p.B0 * p.w * Math.cos(p.w * t), tex: (p) => `B(t) = ${f(p.B0)} sen(${f(p.w)} t)`, dtex: (p) => `{dB}/{dt} = B_0 ω cos(ω t) = ${f(p.B0 * p.w)} cos(${f(p.w)} t)` },
    exp: { nombre: 'B = B₀ e^(−t/τ)', B: (p, t) => p.B0 * Math.exp(-t / p.tau), dB: (p, t) => (-p.B0 / p.tau) * Math.exp(-t / p.tau), tex: (p) => `B(t) = ${f(p.B0)} e^{−t/${f(p.tau)}}`, dtex: (p) => `{dB}/{dt} = −{B_0}/τ e^{−t/τ} = ${f(-p.B0 / p.tau)} e^{−t/${f(p.tau)}}` },
  };
  FUNCB.libre = { nombre: 'B(t) est à écrire par vous', B: (p, t) => Ex.valor(p.ast, 0, { t }), dB: (p, t) => Ex.valor(p.dast, 0, { t }), tex: (p) => `B(t) = ${Ex.texto(p.ast)}`, dtex: (p) => `{dB}/{dt} = ${Ex.texto(p.dast)}` };
  function tramosLenz(Bf, dBf, tf, sentidoB) {
    const escala = Math.max(...Array.from({ length: 401 }, (_, i) => Math.abs(dBf((tf * i) / 400))), 1e-300);
    const est = (t) => { const B = Bf(t), dB = dBf(t); if (Math.abs(dB) <= 1e-9 * escala) return 'pas de courant'; const Bpos = (B >= 0) === (sentidoB !== 'saliente') ? 'entrante' : 'saliente'; return sentido(Bpos, B >= 0 ? dB > 0 : dB < 0); };
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
    const pasos = [], N = entero(sc, 'N', 'le nombre de spires'), sup = superficie(sc, pasos), S = sup.S, tipo = FUNCB[sc.tipoB] ? sc.tipoB : 'lineal', Fb = FUNCB[tipo];
    const p = tipo === 'libre' ? {} : { B0: num(sc, 'B0', 'B₀', { signo: true, cero: true }) };
    if (tipo === 'libre') { p.ast = Ex.lee(sc.expr, 'B(t)', ['t']); p.dast = Ex.deriva(p.ast, 't'); if (!Ex.tieneX(p.ast, 't')) throw new Error('B(t) doit dépendre de t : sinon le champ ne change pas'); }
    if (tipo === 'lineal' || tipo === 'cuadratica') p.k = num(sc, 'k', 'la constante k', { signo: true });
    if (tipo === 'seno') p.w = num(sc, 'w', 'la fréquence angulaire ω');
    if (tipo === 'exp') p.tau = num(sc, 'tau', 'la constante de temps τ');
    if (tipo === 'seno' && !p.B0) throw new Error('Avec B₀ = 0, le champ ne change pas');
    const th = vacio(sc.th) ? 0 : num(sc, 'th', 'l\'angle θ', { signo: true, cero: true }), c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180);
    if (!c) throw new Error('Avec θ = 90°, le champ est parallèle à la spire et il n\'y a pas de flux');
    const t = num(sc, 't', 'l\'instant t', { cero: true }), R = num(sc, 'R', 'la résistance', { opcional: true });
    const Bt = Fb.B(p, t), dBt = Fb.dB(p, t), Phi = N * Bt * S * c, eps = -N * S * c * dBt, cc = th ? ` cos ${f(th)}°` : '';
    pasos.push({ t: 'Champ', html: `$${Fb.tex(p)}$ (en T, avec t en s)` });
    pasos.push({ t: 'Flux', html: `$Φ(t) = N B(t) S cos θ = ${N}·${f(S)}${cc}·B(t)$ ; à t = ${f(t)} s, B = ${f(Bt)} T et Φ = <b>${f(Phi)} Wb</b>` });
    pasos.push({ t: 'Loi de Faraday', html: `$ε(t) = −{dΦ}/{dt} = −N S cos θ {dB}/{dt}$, avec $${Fb.dtex(p)}$<br>À t = ${f(t)} s : $ε = −${N}·${f(S)}${cc}·${f(dBt)}$ = <b>${f(eps)} V</b>` });
    const crece = Bt >= 0 ? dBt > 0 : dBt < 0, Bpos = (Bt >= 0) === (sc.sentidoB !== 'saliente') ? 'entrante' : 'saliente';
    let sen = null;
    if (Math.abs(dBt) > 1e-15) { sen = sentido(Bpos, Math.abs(Bt) < 1e-15 ? true : crece); pasos.push({ t: 'Loi de Lenz', html: `À cet instant, le flux ${Math.abs(Bt) < 1e-15 ? 'commence à croître' : crece ? 'augmente' : 'diminue'} : le courant induit circule dans le sens <b>${sen}</b> vu de l'écran.` }); }
    else pasos.push({ t: 'Loi de Lenz', html: 'À cet instant, le flux ne change pas : il n\'y a pas de courant induit.' });
    let I = null;
    if (R) { I = eps / R; pasos.push({ t: 'Courant', html: `$I = ε/R$ = <b>${f(I)} A</b>` }); }
    let tramos = null, tf = null;
    if (tipo === 'libre') {
      tf = vacio(sc.tf) ? Math.max(t * 1.6, 1) : num(sc, 'tf', 'la fin de la fenêtre de temps');
      tramos = tramosLenz((x) => Fb.B(p, x), (x) => Fb.dB(p, x), tf, sc.sentidoB);
      pasos.push({ t: 'Loi de Lenz par intervalles', html: `Le sens du courant change lorsque $dB/dt$ change de signe ou lorsque B passe par 0 (le champ change de sens). Entre 0 et ${f(tf)} s :<br>` + tramos.map((q) => `de ${f(q.t0)} à ${f(q.t1)} s : <b>${q.sentido === 'sin corriente' ? 'pas de courant (le flux ne change pas)' : 'courant dans le sens ' + q.sentido}</b>`).join('<br>') });
    }
    return { modo: 'funcion', tramos, tf, tipo, p, N, S, c, th, t, Bt, Phi, eps, R, I, sentido: sen, sentidoB: Bpos, forma: sc.forma, Bf: (x) => Fb.B(p, x), Ef: (x) => -N * S * c * Fb.dB(p, x), pasos };
  }

  function dinamica(sc) {
    const caso = ['fuerza', 'cae', 'lanzada'].includes(sc.caso) ? sc.caso : 'fuerza', B = num(sc, 'B', 'le champ B'), L = num(sc, 'L', 'la longueur de la barre'), R = num(sc, 'R', 'la résistance'), m = num(sc, 'm', 'la masse de la barre');
    const g = String(sc.g ?? '').replace(',', '.') === '9.80665' ? 9.80665 : 9.8, ang = caso === 'cae' && !vacio(sc.ang) ? num(sc, 'ang', 'l\'angle des rails', { signo: true }) : 90;
    if (ang <= 0 || ang > 90) throw new Error('L\'angle des rails doit être compris entre 0° (exclu) et 90°');
    const sn = ang === 90 ? 1 : Math.sin((ang * Math.PI) / 180), mg = m * g * sn, Fx = caso === 'fuerza' ? num(sc, 'F', 'la force') : caso === 'cae' ? mg : 0, v0 = caso === 'lanzada' ? num(sc, 'v0', 'la vitesse initiale') : 0;
    const t = num(sc, 't', 'l\'instant t', { opcional: true, cero: true }), b = (B * B * L * L) / R, tau = m / b, vL = Fx / b;
    const v = (x) => vL + (v0 - vL) * Math.exp(-x / tau), I = (x) => (B * L * v(x)) / R, pasos = [], mgT = ang === 90 ? 'm g' : 'm g sin θ';
    pasos.push({ t: 'Force magnétique', html: `${caso === 'cae' && ang !== 90 ? `Les rails forment ${f(ang)}° avec l'horizontale et B est perpendiculaire à leur plan : le poids apporte le long des rails $m g sin θ$ = ${f(mg)} N. ` : ''}Avec la vitesse v, la f.é.m. est $ε = B L v$, le courant $I = {B L v}/R$ et le champ freine la barre avec $F_m = I L B = {B^2 L^2 v}/R$ = ${f(b)}·v N.` });
    if (caso === 'lanzada') pasos.push({ t: 'Équation du mouvement', html: `$m {dv}/{dt} = −{B^2 L^2 v}/R ⇒ v(t) = v_0 e^{−t/τ}$, avec $τ = {m R}/{B^2 L^2}$ = <b>${f(tau)} s</b>.` });
    else pasos.push({ t: 'Équation du mouvement', html: `$m {dv}/{dt} = ${caso === 'cae' ? mgT : 'F'} − {B^2 L^2 v}/R ⇒ v(t) = v_L (1 − e^{−t/τ})$, avec $τ = {m R}/{B^2 L^2}$ = <b>${f(tau)} s</b>.` });
    if (caso !== 'lanzada') pasos.push({ t: 'Vitesse limite', html: `Lorsque la force magnétique égale ${caso === 'cae' ? 'le poids' : 'la force appliquée'} : $ {B^2 L^2 v_L}/R = ${caso === 'cae' ? mgT : 'F'} ⇒ v_L = {${caso === 'cae' ? mgT : 'F'} R}/{B^2 L^2} = {${f(Fx)}·${f(R)}}/{${f(B)}^2·${f(L)}^2}$ = <b>${f(vL)} m/s</b>. Alors toute la puissance ${caso === 'cae' ? 'du poids' : 'de la force'} (${f(Fx * vL)} W) est dissipée dans la résistance.` });
    else pasos.push({ t: 'Distance jusqu\'à l\'arrêt', html: `$x = ∫ v dt = v_0 τ = ${f(v0)}·${f(tau)}$ = <b>${f(v0 * tau)} m</b> ; toute l'énergie cinétique, $1/2 m v_0^2$ = ${f(0.5 * m * v0 * v0)} J, finit en chaleur dans la résistance.` });
    let vt = null, It = null;
    if (t !== null) { vt = v(t); It = (B * L * vt) / R; pasos.push({ t: `À t = ${f(t)} s`, html: `$v = ${caso === 'lanzada' ? `${f(v0)} e^{−${f(t)}/${f(tau)}}` : `${f(vL)} (1 − e^{−${f(t)}/${f(tau)}})`}$ = <b>${f(vt)} m/s</b>; $ε = B L v$ = ${f(B * L * vt)} V e I = <b>${f(It)} A</b>` }); }
    const IL = (B * L * vL) / R;
    return { modo: 'dinamica', caso, B, L, R, m, g, ang, Fx, v0, tau, vL, IL, PL: Fx * vL, t, vt, It, vf: v, If: I, pasos };
  }

  function gira(sc) {
    const pasos = [], disco = sc.cuerpo === 'disco', B = num(sc, 'B', 'le champ B'), L = num(sc, 'L', disco ? 'le rayon du disque' : 'la longueur de la tige');
    const x = num(sc, 'w', 'la vitesse de rotation'), uw = sc.uw || 'rad/s', w = uw === 'rad/s' ? x : uw === 'rpm' ? (2 * Math.PI * x) / 60 : 2 * Math.PI * x, R = num(sc, 'R', 'la résistance', { opcional: true });
    if (uw !== 'rad/s') pasos.push({ t: 'Vitesse angulaire', html: `$ω = ${uw === 'rpm' ? `{2π·${f(x)}}/60` : `2π·${f(x)}`}$ = <b>${f(w)} rad/s</b>` });
    const eps = 0.5 * B * w * L * L;
    pasos.push({ t: 'F.é.m. de mouvement', html: `Un élément dr à une distance r de l'axe se déplace à v = ω r, donc $dε = B v dr = B ω r dr$. En intégrant ${disco ? 'du centre au bord' : 'le long de la tige'} : $ε = ∫_0^${disco ? 'R' : 'L'} B ω r dr = 1/2 B ω ${disco ? 'R' : 'L'}^2 = 1/2·${f(B)}·${f(w)}·${f(L)}^2$ = <b>${f(eps)} V</b>` });
    pasos.push({ t: 'Autre méthode : l\'aire balayée', html: `Pendant un temps dt, ${disco ? 'chaque rayon' : 'la tige'} balaie un secteur d'aire $1/2 ${disco ? 'R' : 'L'}^2 ω dt$, donc $ {dΦ}/{dt} = 1/2 B ω ${disco ? 'R' : 'L'}^2$ : le même résultat.${disco ? ' La f.é.m. apparaît entre le centre et le bord du disque, reliés par des balais.' : ''}` });
    let I = null, P = null;
    if (R) { I = eps / R; P = eps * I; pasos.push({ t: 'Avec une résistance R', html: `$I = ε/R$ = <b>${f(I)} A</b> ; puissance $P = ε I$ = <b>${f(P)} W</b> et couple nécessaire pour maintenir la rotation, $M = P/ω$ = <b>${f(P / w)} N·m</b>` }); }
    return { modo: 'gira', cuerpo: disco ? 'disco' : 'varilla', B, L, w, eps, R, I, P, sentidoB: sc.sentidoB, pasos };
  }

  function foucault(sc) {
    const pasos = [], lamina = sc.geo === 'lamina', sg = num(sc, 'sigma', 'la conductivité σ') * 1e6, B0 = num(sc, 'B0', 'l\'amplitude B₀'), fr = num(sc, 'fr', 'la fréquence'), w = 2 * Math.PI * fr, MU0 = 4e-7 * Math.PI;
    const delta = Math.sqrt(2 / (w * MU0 * sg)), Bdot = B0 * w;
    pasos.push({ t: 'Champ et loi de Faraday', html: `$B(t) = B_0 sin ωt$ avec $ω = 2π f = ${f(w)} "rad/s"$, donc $dB/dt = B_0 ω cos ωt$ et son amplitude est $B_0 ω = ${f(Bdot)} "T/s"$. Un champ variable crée un champ électrique qui fait circuler des courants dans le conducteur.` });
    let P, Pp, pv, geom, Jmax, Emax, aviso = null, comp = null, N = 1;
    if (!lamina) {
      const a = num(sc, 'a', 'le rayon du disque') * 1e-2, d = num(sc, 'd', 'l\'épaisseur du disque') * 1e-3, Vol = Math.PI * a * a * d;
      Emax = (a * Bdot) / 2; Jmax = sg * Emax; P = (Math.PI * sg * d * a ** 4 * Bdot * Bdot) / 16; Pp = 2 * P; pv = P / Vol;
      geom = { a, d, Vol };
      pasos.push({ t: 'Champ électrique induit', html: `Par symétrie, le champ $E$ est tangent aux cercles : $E · 2π r = −π r^2 dB/dt$, donc $E(r) = {r}/{2} |dB/dt|$ et au bord $E = {a B_0 ω}/{2} = ${f(Emax)} "V/m"$. La densité de courant est $J = σ E$ : elle croît linéairement avec $r$ jusqu'à $J_{max} = ${f(Jmax)} "A/m"^2$.` });
      pasos.push({ t: 'Puissance dissipée', html: `La puissance par unité de volume est $σ E^2$ ; on intègre sur le disque : $P = ∫ σ E^2 dV = {π σ d a^4}/{8} (dB/dt)^2$. Sa valeur moyenne, avec $⟨cos^2 ωt⟩ = 1/2$, est $⟨P⟩ = {π σ d a^4 B_0^2 ω^2}/{16} = ${f(P)} "W"$ (pic ${f(Pp)} W).` });
      if (a > 0.5 * delta) aviso = `Le rayon (${f(a * 100)} cm) n'est pas petit devant la profondeur de pénétration δ = ${f(delta * 100)} cm : le champ ne pénètre pas de la même façon dans tout le disque et ce modèle surestime la puissance.`;
    } else {
      const D = num(sc, 'D', 'l\'épaisseur totale du noyau') * 1e-3, Vol = num(sc, 'V', 'le volume du noyau') * 1e-6; N = vacio(sc.N) ? 1 : num(sc, 'N', 'le nombre de lamelles');
      if (!Number.isInteger(N)) throw new Error('Le nombre de lamelles doit être entier');
      const dl = D / N; Emax = (dl / 2) * Bdot; Jmax = sg * Emax; pv = (sg * w * w * B0 * B0 * dl * dl) / 24; P = pv * Vol; Pp = 2 * P;
      const pv1 = (sg * w * w * B0 * B0 * D * D) / 24; comp = { P1: pv1 * Vol, N, dl, reduccion: N * N };
      geom = { D, dl, Vol };
      pasos.push({ t: 'Champ électrique induit', html: `Avec $B$ dans le plan d'une lamelle d'épaisseur $d = ${f(dl * 1000)} "mm"$, les courants tournent dans le plan perpendiculaire à $B$ : à une hauteur $z$ à partir du centre, $E(z) = z |dB/dt|$. En surface, $E = {d B_0 ω}/{2} = ${f(Emax)} "V/m"$ et $J_{max} = σ E = ${f(Jmax)} "A/m"^2$.` });
      pasos.push({ t: 'Puissance par unité de volume', html: `Moyenne sur l'épaisseur : $⟨σ E^2⟩_z = σ (dB/dt)^2 d^2/12$ et moyenne dans le temps : $p = {σ B_0^2 ω^2 d^2}/{24} = ${f(pv)} "W/m"^3$. Avec le volume $${f(Vol * 1e6)} "cm"^3$ : $⟨P⟩ = ${f(P)} "W"$.` });
      pasos.push({ t: 'Effet du feuilletage du noyau', html: `On divise l'épaisseur totale $D = ${f(D * 1000)} "mm"$ en $N = ${N}$ lamelles isolées de $d = D/N$ : la puissance diminue avec $d^2$, soit $N^2$ fois. Sans feuilletage, elle serait de $${f(comp.P1)} "W"$ ; feuilleté, ${f(P)} W : ${f(N * N)} fois moins.` });
      if (dl > 0.5 * delta) aviso = `L'épaisseur de chaque lamelle (${f(dl * 1000)} mm) n'est pas petite devant la profondeur de pénétration δ = ${f(delta * 1000)} mm : le champ s'atténue à l'intérieur de la lamelle (effet de peau) et ce modèle surestime la puissance.`;
    }
    pasos.push({ t: 'Profondeur de pénétration et limites du modèle', html: `$δ = √{2/{ω μ_0 σ}} = ${f(delta * 1000)} "mm"$. Le modèle suppose un champ uniforme dans toute la pièce et ne tient compte ni du champ créé par les courants eux-mêmes (qui l'affaiblit) ni de la perméabilité du matériau : il est valable lorsque la pièce est petite devant δ.${aviso ? ' <b>Avertissement :</b> ' + aviso : ''}` });
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
    { clave: 'barra', nombre: 'Barre glissant sur des rails', sc: { modo: 'barra', B: '0.5', sentidoB: 'entrante', L: '0.2', v: '4', R: '2' } },
    { clave: 'barra-izq', nombre: 'Barre se déplaçant vers la gauche', sc: { modo: 'barra', B: '0.8', sentidoB: 'saliente', L: '0.5', v: '-3', R: '0.5' } },
    { clave: 'alternador', nombre: 'Bobine tournant à 50 Hz (alternateur)', sc: { modo: 'giratoria', N: '100', B: '0.5', forma: 'rectangulo', a: '0.1', b: '0.2', w: '50', uw: 'Hz', R: '50', t: '' } },
    { clave: 'rpm', nombre: 'Spire circulaire à 3000 tr/min', sc: { modo: 'giratoria', N: '200', B: '0.2', forma: 'circulo', r: '0.05', w: '3000', uw: 'rpm', R: '', t: '0.002' } },
    { clave: 'campo-crece', nombre: 'Champ croissant dans une bobine', sc: { modo: 'flujo', N: '50', forma: 'circulo', r: '0.05', B1: '0', B2: '0.4', th1: '0', th2: '', dt: '0.1', sentidoB: 'entrante', R: '5' } },
    { clave: 'gira-90', nombre: 'Spire tournée de 90° dans un champ', sc: { modo: 'flujo', N: '1', forma: 'rectangulo', a: '0.3', b: '0.2', B1: '0.6', B2: '', th1: '0', th2: '90', dt: '0.2', sentidoB: 'saliente', R: '0.2' } },
    { clave: 'cruza', nombre: 'Spire carrée traversant un champ', sc: { modo: 'cruza', N: '1', a: '0.1', D: '0.3', v: '2', B: '0.5', sentidoB: 'entrante', R: '0.1' } },
    { clave: 'hilo-aleja', nombre: 'Spire s\'éloignant d\'un fil', sc: { modo: 'hilo', I: '10', sentidoI: 'arriba', d: '0.05', w: '0.1', h: '0.2', N: '1', v: '2', dIdt: '', R: '0.5' } },
    { clave: 'hilo-dIdt', nombre: 'Fil avec courant croissant et spire immobile', sc: { modo: 'hilo', I: '5', sentidoI: 'arriba', d: '0.02', w: '0.08', h: '0.1', N: '100', v: '', dIdt: '200', R: '10' } },
    { clave: 'B-seno', nombre: 'Champ B₀ sin(ωt) dans une bobine', sc: { modo: 'funcion', N: '200', forma: 'circulo', r: '0.03', tipoB: 'seno', B0: '0.05', w: '314', th: '0', t: '0.002', sentidoB: 'entrante', R: '20' } },
    { clave: 'B-libre', nombre: 'Champ B(t) écrit à la main, avec changement de sens', sc: { modo: 'funcion', N: '100', forma: 'circulo', r: '0.05', tipoB: 'libre', expr: '0.2 sen(2 pi t)', tf: '1', th: '0', t: '0.3', sentidoB: 'entrante', R: '4' } },
    { clave: 'B-cuadratica', nombre: 'Champ croissant comme t²', sc: { modo: 'funcion', N: '1', forma: 'rectangulo', a: '0.2', b: '0.3', tipoB: 'cuadratica', B0: '0', k: '0.4', th: '0', t: '2', sentidoB: 'saliente', R: '0.4' } },
    { clave: 'velocidad-limite', nombre: 'Barre tombant sur des rails verticaux', sc: { modo: 'dinamica', caso: 'cae', B: '0.5', L: '0.4', R: '0.2', m: '0.02', t: '0.1' } },
    { clave: 'barra-lanzada', nombre: 'Barre lancée qui freine toute seule', sc: { modo: 'dinamica', caso: 'lanzada', B: '1', L: '0.5', R: '2', m: '0.1', v0: '5', t: '1' } },
    { clave: 'foucault-disco', nombre: 'Disque de cuivre dans un champ de 0,1 T à 50 Hz (Foucault)', sc: { modo: 'foucault', geo: 'disco', sigma: '58', B0: '0,1', fr: '50', a: '5', d: '2' } },
    { clave: 'foucault-nucleo', nombre: 'Noyau de transformateur : 100 lamelles au lieu d\'une seule', sc: { modo: 'foucault', geo: 'lamina', sigma: '2', B0: '1', fr: '50', D: '20', N: '100', V: '500' } },
    { clave: 'disco', nombre: 'Disque de Faraday', sc: { modo: 'gira', cuerpo: 'disco', B: '0.8', L: '0.1', w: '3000', uw: 'rpm', R: '0.05', sentidoB: 'entrante' } },
    { clave: 'varilla-gira', nombre: 'Tige tournant autour d\'une extrémité', sc: { modo: 'gira', cuerpo: 'varilla', B: '0.5', L: '1', w: '20', uw: 'rad/s', R: '2', sentidoB: 'entrante' } },
  ];

  return { resolver, foucault, barra, giratoria, flujo, cruza, hilo, funcion, dinamica, gira, FUNCB, ejemplos, f };
})();

