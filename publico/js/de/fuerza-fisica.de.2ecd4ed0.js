const Fuerza = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-−]?\d+)\)?/i, (_, e) => `e${e.replace('−', '-')}`);
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function num(sc, k, nom, { opcional = false, signo = false, cero = false, def = null } = {}) {
    if (vacio(sc[k])) { if (def !== null) return def; if (opcional) return null; throw new Error(`${nom} fehlt`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} muss eine Zahl sein`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${may(nom)} muss ${cero ? 'positiv oder 0' : 'größer als 0'} sein`);
    return v;
  }
  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const E0 = SI.e, U = 1.66053907e-27, C = SI.c, MU0 = 4 * Math.PI * 1e-7, G = 9.8;
  const PART = {
    proton: { nom: 'Proton', art: 'der', q: E0, m: 1.67262192e-27 },
    electron: { nom: 'Elektron', art: 'der', q: -E0, m: 9.1093837e-31 },
    alfa: { nom: 'α-Teilchen', art: 'die', q: 2 * E0, m: 6.6446573e-27 },
    deuteron: { nom: 'Deuteron', art: 'der', q: E0, m: 3.3435838e-27 },
  };
  function particula(sc, conM = true) {
    const p = PART[sc.part];
    if (p) return { ...p, pre: true };
    const q = num(sc, 'q', 'die Ladung q', { signo: true });
    if (q === 0) throw new Error('Bei Ladung 0 gibt es keine magnetische Kraft');
    return { nom: 'Teilchen', q, m: conM ? num(sc, 'm', 'die Masse m') : num(sc, 'm', 'die Masse m', { opcional: true }), pre: false };
  }
  const datosP = (P) => (P.pre ? `Für ${P.art} ${P.nom} gilt q = ${f(P.q)} C und m = ${f(P.m)} kg.` : '');
  function velocidad(sc, P, pasos, opcional = false) {
    const uv = sc.uv || 'ms';
    const x = num(sc, 'v', uv === 'ms' ? 'die Geschwindigkeit' : uv === 'eV' ? 'die kinetische Energie' : 'die Potentialdifferenz', { opcional });
    if (x === null) return null;
    if (uv === 'ms') return x;
    const Ec = uv === 'eV' ? x * E0 : Math.abs(P.q) * x, v = Math.sqrt((2 * Ec) / P.m);
    pasos.push({ t: 'Geschwindigkeit', html: `${uv === 'eV' ? `E<sub>c</sub> = ${f(x)} eV = ${f(x)}·${f(E0)} = ${f(Ec)} J` : `Beim Beschleunigen aus der Ruhe mit einer Spannung von ${f(x)} V gewinnt es $E_c = |q| ΔV = ${f(Math.abs(P.q))}·${f(x)}$ = ${f(Ec)} J`}, also $v = √({2E_c}/m) = √({2·${f(Ec)}}/{${f(P.m)}})$ = <b>${f(v)} m/s</b>${v > 0.1 * C ? `. Das sind mehr als 10 % der Lichtgeschwindigkeit: Das klassische Ergebnis ist nicht mehr genau (man müsste die Relativitätstheorie verwenden).` : ''}` });
    return v;
  }
  const giro = (q, sentidoB) => ((q > 0) === (sentidoB === 'entrante') ? 'gegen den Uhrzeigersinn' : 'im Uhrzeigersinn');

  function carga(sc) {
    const pasos = [], P = particula(sc), v = velocidad(sc, P, pasos), B = num(sc, 'B', 'das Feld B'), th = num(sc, 'th', 'der Winkel zwischen v und B', { cero: true, def: 90 });
    if (th > 180) throw new Error('Der Winkel zwischen v und B muss zwischen 0° und 180° liegen');
    const s = Math.abs(Math.sin((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.sin((th * Math.PI) / 180), c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180);
    const aq = Math.abs(P.q), F = aq * v * B * s, vp = v * s, va = v * c, w = (aq * B) / P.m, T = (2 * Math.PI) / w, r = vp / w, paso = va * T, Ec = 0.5 * P.m * v * v;
    if (P.pre) pasos.unshift({ t: 'Daten des Teilchens', html: datosP(P) });
    pasos.push({ t: 'Lorentzkraft', html: `$F = |q| v B sin θ = ${f(aq)}·${f(v)}·${f(B)}${th === 90 ? '' : `·sin ${f(th)}°`}$ = <b>${f(F)} N</b>. Sie steht senkrecht auf v und B und verrichtet daher keine Arbeit: Der Betrag der Geschwindigkeit und die kinetische Energie (${f(Ec)} J = ${f(Ec / E0)} eV) ändern sich nicht.` });
    if (s === 0) {
      pasos.push({ t: 'Bewegung', html: 'Die Geschwindigkeit ist parallel zum Feld: Es gibt keine magnetische Kraft, und das Teilchen bleibt auf einer Geraden mit konstanter Geschwindigkeit.' });
      return { modo: 'carga', P, v, B, th, F: 0, r: Infinity, T, f: 1 / T, w, paso: Infinity, va, vp: 0, Ec, giro: null, sentidoB: sc.sentidoB, pasos };
    }
    pasos.push({ t: 'Radius der Bahn', html: `Die magnetische Kraft wirkt als Zentripetalkraft: $|q| v${th === 90 ? '' : '_⊥'} B = {m v${th === 90 ? '' : '_⊥'}^2}/r$, ${th === 90 ? '' : `mit $v_⊥ = v sin θ$ = ${f(vp)} m/s, `}woraus $r = {m v${th === 90 ? '' : '_⊥'}}/{|q| B} = {${f(P.m)}·${f(vp)}}/{${f(aq)}·${f(B)}}$ = <b>${f(r)} m</b> folgt` });
    pasos.push({ t: 'Umlaufzeit und Frequenz', html: `$T = {2π r}/{v${th === 90 ? '' : '_⊥'}} = {2π m}/{|q| B}$ = <b>${f(T)} s</b>; $f = 1/T$ = <b>${f(1 / T)} Hz</b> und $ω = {|q| B}/m$ = ${f(w)} rad/s. Sie hängen nicht von der Geschwindigkeit ab (darauf beruht das Zyklotron).` });
    const gi = giro(P.q, th === 90 ? sc.sentidoB : 'entrante');
    if (th !== 90) pasos.push({ t: 'Schraubenlinie', html: `Die Komponente parallel zu B, $v_∥ = v cos θ$ = ${f(va)} m/s, ändert sich nicht: Das Teilchen bewegt sich entlang des Feldes, während es kreist, und beschreibt eine Schraubenlinie mit Radius ${f(r)} m und Ganghöhe $p = v_∥ T = ${f(Math.abs(va))}·${f(T)}$ = <b>${f(Math.abs(paso))} m</b>.` });
    pasos.push({ t: 'Drehsinn', html: th === 90 ? `Mit B ${sc.sentidoB === 'saliente' ? 'herauskommend (⊙)' : 'hineingehend (⊗)'} und der ${P.q > 0 ? 'positiven' : 'negativen'} Ladung zeigt F = q v × B zum Mittelpunkt, und das Teilchen kreist auf dem Bildschirm im <b>${gi}</b>.` : `In Richtung von B gesehen kreist eine ${P.q > 0 ? 'positive Ladung gegen den Uhrzeigersinn' : 'negative Ladung im Uhrzeigersinn'} (F = q v × B).` });
    return { modo: 'carga', P, v, B, th, F, r, T, f: 1 / T, w, paso: Math.abs(paso), va, vp, Ec, giro: gi, sentidoB: sc.sentidoB, pasos };
  }

  const comp = (sc, p, nom, opcional = false) => ['x', 'y', 'z'].map((e) => num(sc, p + e, `die ${e}-Komponente von ${nom}`, { signo: true, def: opcional || !vacio(sc[p + 'x']) || !vacio(sc[p + 'y']) || !vacio(sc[p + 'z']) ? 0 : null }));
  const ijk = (u, un) => { const t = u.map((x, i) => (Math.abs(x) < 1e-300 ? '' : `${x < 0 ? '−' : '+'} ${f(Math.abs(x))} <i class="uv">${'ijk'[i]}</i>`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−'); return t ? `(${t}) ${un}` : `0 ${un}`; };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]].map((x) => (Math.abs(x) < 1e-300 ? 0 : x));
  const mod = (u) => Math.hypot(...u);
  function vectorial(sc) {
    const pasos = [], P = particula(sc, false), v = comp(sc, 'v', 'v'), B = comp(sc, 'B', 'B'), hayE = ['x', 'y', 'z'].some((e) => !vacio(sc['E' + e])), E = hayE ? comp(sc, 'E', 'E', true) : [0, 0, 0];
    if (mod(B) === 0 && !hayE) throw new Error('Gib mindestens eine Komponente von B ein');
    if (P.pre) pasos.push({ t: 'Daten des Teilchens', html: datosP(P) });
    const vB = cruz(v, B), Fm = vB.map((x) => P.q * x), Fe = E.map((x) => P.q * x), F = Fm.map((x, i) => x + Fe[i]);
    const det = `<span class="det"><table><tr><td><i class="uv">i</i></td><td><i class="uv">j</i></td><td><i class="uv">k</i></td></tr><tr>${v.map((x) => `<td>${f(x)}</td>`).join('')}</tr><tr>${B.map((x) => `<td>${f(x)}</td>`).join('')}</tr></table></span>`;
    pasos.push({ t: 'Vektorprodukt', html: `v × B = ${det} = ${ijk(vB, 'T·m/s')}<br>Jede Komponente ist eine 2×2-Determinante: $(v_y B_z − v_z B_y, v_z B_x − v_x B_z, v_x B_y − v_y B_x)$.` });
    pasos.push({ t: 'Magnetische Kraft', html: `$F_m = q (v × B)$ = ${f(P.q)}·${ijk(vB, '')} = <b>${ijk(Fm, 'N')}</b>, mit Betrag |F<sub>m</sub>| = ${f(mod(Fm))} N.` });
    const cv = mod(v) && mod(B) ? (v[0] * B[0] + v[1] * B[1] + v[2] * B[2]) / (mod(v) * mod(B)) : 1, ang = (Math.acos(Math.max(-1, Math.min(1, cv))) * 180) / Math.PI;
    if (mod(v) && mod(B)) pasos.push({ t: 'Kontrolle', html: `Der Winkel zwischen v und B beträgt ${f(ang)}°, und $|q| v B sin θ$ = ${f(Math.abs(P.q) * mod(v) * mod(B) * Math.sin((ang * Math.PI) / 180))} N, dasselbe. F<sub>m</sub> steht senkrecht auf v ($F_m · v = 0$) und auf B.` });
    if (hayE) {
      pasos.push({ t: 'Elektrische Kraft', html: `$F_e = q E$ = ${f(P.q)}·${ijk(E, 'V/m')} = ${ijk(Fe, 'N')}` });
      pasos.push({ t: 'Lorentzkraft', html: `$F = q (E + v × B)$ = <b>${ijk(F, 'N')}</b>, mit Betrag <b>${f(mod(F))} N</b>.` });
    }
    let a = null;
    if (P.m) { a = F.map((x) => x / P.m); pasos.push({ t: 'Beschleunigung', html: `$a = F/m$ = ${ijk(a, 'm/s<sup>2</sup>')}, mit Betrag ${f(mod(a))} m/s<sup>2</sup>.` }); }
    return { modo: 'vectorial', P, v, B, E, hayE, vB, Fm, Fe, F, Fmod: mod(F), Fmmod: mod(Fm), ang, a, pasos };
  }

  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function rk4(P, Ef, Bf, r0, v0, tmax, dt0, parar = null, nmax = 1600) {
    const n = Math.ceil(tmax / dt0), dt = tmax / n, q = P.q, m = P.m, acc = (r, v, t) => { const e = Ef(r, t), c = cruz(v, Bf(r, t)); return [(q * (e[0] + c[0])) / m, (q * (e[1] + c[1])) / m, (q * (e[2] + c[2])) / m]; };
    const paso = Math.max(1, Math.ceil(n / nmax)), out = [[0, ...r0, ...v0]];
    let r = r0.slice(), v = v0.slice(), t = 0, parada = null;
    for (let i = 1; i <= n; i++) {
      const a1 = acc(r, v, t), r2 = r.map((x, k) => x + (v[k] * dt) / 2), v2 = v.map((x, k) => x + (a1[k] * dt) / 2), a2 = acc(r2, v2, t + dt / 2);
      const r3 = r.map((x, k) => x + (v2[k] * dt) / 2), v3 = v.map((x, k) => x + (a2[k] * dt) / 2), a3 = acc(r3, v3, t + dt / 2);
      const r4 = r.map((x, k) => x + v3[k] * dt), v4 = v.map((x, k) => x + a3[k] * dt), a4 = acc(r4, v4, t + dt);
      r = r.map((x, k) => x + ((v[k] + 2 * v2[k] + 2 * v3[k] + v4[k]) * dt) / 6); v = v.map((x, k) => x + ((a1[k] + 2 * a2[k] + 2 * a3[k] + a4[k]) * dt) / 6); t += dt;
      if (i % paso === 0 || i === n) out.push([t, ...r, ...v]);
      if (parar && parar(r, v, t)) { parada = { t, r: r.slice(), v: v.slice() }; if (out[out.length - 1][0] !== t) out.push([t, ...r, ...v]); break; }
    }
    return { m: out, parada };
  }

  function trayectoria(sc) {
    const pasos = [], P = particula(sc, true), v0 = comp(sc, 'v', 'v'), B = comp(sc, 'B', 'B', true), hayE = ['x', 'y', 'z'].some((e) => !vacio(sc['E' + e])), E = hayE ? comp(sc, 'E', 'E', true) : [0, 0, 0];
    const Bm = mod(B);
    if (!Bm && !hayE) throw new Error('Gib mindestens eine Komponente von B oder E ein');
    if (!mod(v0) && !mod(E)) throw new Error('Ohne Anfangsgeschwindigkeit und ohne elektrisches Feld bewegt sich das Teilchen nicht');
    const aq = Math.abs(P.q), b = Bm ? B.map((x) => x / Bm) : [0, 0, 1], Epar = dot(E, b), Eperp = E.map((x, i) => x - Epar * b[i]);
    const vd = Bm ? cruz(Eperp, B).map((x) => x / (Bm * Bm)) : [0, 0, 0], vpar = dot(v0, b), vperp = v0.map((x, i) => x - vpar * b[i] - vd[i]), vpm = mod(vperp);
    const w = Bm ? (aq * Bm) / P.m : 0, Tc = Bm ? (2 * Math.PI) / w : Infinity, rL = Bm ? (P.m * vpm) / (aq * Bm) : Infinity, apar = (P.q * Epar) / P.m;
    if (Bm && mod(vd) >= C) throw new Error('E/B darf nicht gleich oder größer als c sein: Das nichtrelativistische Modell gilt nicht');
    const tt = vacio(sc.tt) ? (Bm ? 5 * Tc : null) : num(sc, 'tt', 'die Integrationszeit');
    if (tt === null) throw new Error('Ohne B muss die Integrationszeit angegeben werden');
    const dt = Bm ? Math.min(Tc / 400, tt / 200) : tt / 400;
    if (tt / dt > 400000) throw new Error('Zu viele Integrationsschritte: Verkürze die Zeit');
    const run = rk4(P, () => E, () => B, [0, 0, 0], v0, tt, dt), M = run.m, ult = M[M.length - 1], KE = (r) => 0.5 * P.m * (r[4] * r[4] + r[5] * r[5] + r[6] * r[6]);
    const KE0 = KE(M[0]), KE1 = KE(ult), WE = P.q * dot(E, [ult[1], ult[2], ult[3]]);
    if (P.pre) pasos.push({ t: 'Daten des Teilchens', html: datosP(P) });
    pasos.push({ t: 'Bewegungsgleichung', html: `$m {dv}/{dt} = q (E + v × B)$ mit $E = ${ijk(E, 'V/m')}$ und $B = ${ijk(B, 'T')}$. Sie hat im Allgemeinen keine geschlossene Lösung, daher wird sie mit Runge-Kutta 4. Ordnung in ${Math.round(tt / dt)} Schritten von $${f(dt)} "s"$ bis $t = ${f(tt)} "s"$ integriert.` });
    if (Bm) pasos.push({ t: 'Kreisen um B', html: `$ω_c = {|q| B}/m = ${f(w)} "rad/s"$, Umlaufzeit $T_c = 2π/ω_c = ${f(Tc)} "s"$ und, im mit der Drift bewegten System, Radius $r_L = {m v_⊥}/{|q| B} = ${f(rL)} "m"$ mit $v_⊥ = ${f(vpm)} "m/s"$ (die Geschwindigkeit senkrecht zu B minus der Drift).` });
    if (hayE && Bm) pasos.push({ t: 'E × B-Drift', html: `Der zu B senkrechte Anteil von E, $E_⊥ = ${ijk(Eperp, 'V/m')}$, lässt das Teilchen, gleich welcher Ladung, mit $v_d = {E × B}/{B^2} = ${ijk(vd, 'm/s')}$ driften (Betrag ${f(mod(vd))} m/s).` });
    if (hayE) pasos.push({ t: 'Beschleunigung entlang B', html: Bm ? `Der parallele Anteil, $E_∥ = ${f(Epar)} "V/m"$, beschleunigt das Teilchen entlang des Feldes: $a_∥ = {q E_∥}/m = ${f(apar)} "m/s"^2$ und $v_∥ = ${f(vpar)} + a_∥ t$.` : `Ohne B ist die Beschleunigung $a = qE/m = ${ijk(E.map((x) => (P.q * x) / P.m), 'm/s²')}$.` });
    pasos.push({ t: 'Energie', html: `Das Magnetfeld verrichtet keine Arbeit; das elektrische schon: $ΔE_c = q E·Δr = ${f(WE)} "J"$. Bei der Integration geht $E_c$ von ${f(KE0)} J auf ${f(KE1)} J (${f(KE1 - KE0)} J).` });
    return { modo: 'trayectoria', P, v0, B, E, hayE, Bm, w, Tc, rL, vd, vpar, vpm, apar, tt, dt, muestras: M, KE0, KE1, WE, rf: [ult[1], ult[2], ult[3]], vf: [ult[4], ult[5], ult[6]], Kmax: Math.max(...M.map(KE)), pasos };
  }

  function espejo(sc) {
    const pasos = [], P = particula(sc, true), v = velocidad(sc, P, pasos), B0 = num(sc, 'B0', 'das Feld B₀ in der Mitte'), Rm = num(sc, 'Rm', 'das Spiegelverhältnis Bmax/B₀'), L = num(sc, 'L', 'die charakteristische Länge L'), al = num(sc, 'zum', 'der Winkel α₀', { signo: true });
    if (!(Rm > 1)) throw new Error('Das Spiegelverhältnis muss größer als 1 sein');
    if (!(al > 0 && al <= 90)) throw new Error('Der Winkel α₀ zwischen v und B muss zwischen 0° (ausgeschlossen) und 90° liegen');
    const a0 = (al * Math.PI) / 180, s0 = Math.sin(a0), c0 = Math.abs(Math.cos(a0)) < 1e-12 ? 0 : Math.cos(a0), aq = Math.abs(P.q), zm = L * Math.sqrt(Rm - 1), ac = Math.asin(1 / Math.sqrt(Rm)), atrapada = s0 > 1 / Math.sqrt(Rm) + 1e-12;
    const vp = v * s0, va = v * c0, mu = (P.m * vp * vp) / (2 * B0), w0 = (aq * B0) / P.m, rL = (P.m * vp) / (aq * B0), Tc0 = (2 * Math.PI) / w0, zt = c0 === 0 ? 0 : L * (c0 / s0), Tb = (2 * Math.PI * L) / vp;
    const Bf = (r) => [(-B0 * r[0] * r[2]) / (L * L), (-B0 * r[1] * r[2]) / (L * L), B0 * (1 + (r[2] * r[2]) / (L * L))];
    const tt = atrapada ? 3 * Tb : Math.min(3 * Tb, (2 * zm) / Math.max(va, 1e-30) * 1.5 + Tb), dt = Math.min(Tc0 / 200, tt / 400);
    if (rL > 0.3 * L) throw new Error(`Der Gyrationsradius (${f(rL)} m) ist nicht klein gegenüber L (${f(L)} m): Das magnetische Moment bleibt nicht gut erhalten. Verringere die Energie, erhöhe B₀ oder vergrößere L`);
    if (tt / dt > 500000) throw new Error('Zu viele Integrationsschritte: Der Gyrationsradius ist sehr klein gegenüber L; erhöhe die Energie oder senke B₀');
    const run = rk4(P, () => [0, 0, 0], (r) => Bf(r), [0, 0, 0], [vp, 0, va], tt, dt, (r) => Math.abs(r[2]) >= zm), M = run.m;
    const muT = M.map((q) => { const r = [q[1], q[2], q[3]], Bv = Bf(r), Bn = mod(Bv), vv = [q[4], q[5], q[6]], vpar = dot(vv, Bv) / Bn, v2 = dot(vv, vv); return [q[0], (P.m * (v2 - vpar * vpar)) / (2 * Bn)]; });
    const dev = Math.max(...muT.map((x) => Math.abs(x[1] / mu - 1))), zmax = Math.max(...M.map((q) => Math.abs(q[3])));
    const cruces = []; for (let i = 1; i < M.length; i++) if (M[i - 1][3] < 0 && M[i][3] >= 0) cruces.push(M[i - 1][0] + ((M[i][0] - M[i - 1][0]) * -M[i - 1][3]) / (M[i][3] - M[i - 1][3]));
    const TbSim = cruces.length >= 2 ? (cruces[cruces.length - 1] - cruces[0]) / (cruces.length - 1) : null;
    if (P.pre) pasos.unshift({ t: 'Daten des Teilchens', html: datosP(P) });
    pasos.push({ t: 'Das Feld', html: `$B(z) = B_0 (1 + z^2/L^2)$ auf der Achse, mit $B_0 = ${f(B0)} "T"$ und $L = ${f(L)} "m"$; abseits der Achse tritt eine radiale Komponente $B_ρ = −{ρ}/{2} {dB}/{dz} = −B_0 {ρ z}/{L^2}$ auf (damit gilt $∇·B = 0$). Bei $z = ±z_m = ±${f(zm)} "m"$ beträgt das Feld $R_m B_0 = ${f(Rm * B0)} "T"$, mit $R_m = ${f(Rm)}$ als Spiegelverhältnis.` });
    pasos.push({ t: 'Magnetisches Moment', html: `Ändert sich das Feld über einen Umlauf wenig, ist $μ = {m v_⊥^2}/{2B}$ konstant, und da das Feld keine Arbeit verrichtet, auch $v^2 = v_⊥^2 + v_∥^2$. In der Mitte ist $v_⊥ = v sin α_0 = ${f(vp)} "m/s"$, $v_∥ = ${f(va)} "m/s"$ und $μ = ${f(mu)} "J/T"$.` });
    pasos.push({ t: 'Umkehrpunkt', html: `Das Teilchen wird dort gebremst, wo $v_∥ = 0$ ist, also $B(z_t) = B_0/sin^2 α_0$: ${c0 === 0 ? 'bei α₀ = 90° kommt es entlang der Achse nicht voran.' : `$z_t = L cot α_0 = ${f(zt)} "m"$.`} Es erreicht das Ende der Flasche, wenn $z_t ≥ z_m$.` });
    pasos.push({ t: 'Verlustkegel', html: `Es entkommt, wer $z_m$ erreicht: $sin^2 α_0 < B_0/B_{max} = 1/R_m$, also $α_c = arcsin(1/√R_m) = ${f((ac * 180) / Math.PI)}°$. Mit $α_0 = ${f(al)}°$ ${atrapada ? 'bleibt das Teilchen <b>gefangen</b>' : 'liegt das Teilchen <b>im Verlustkegel</b> und entkommt'}${run.parada ? ` (die Simulation sieht es bei $t = ${f(run.parada.t)} "s"$ austreten)` : ''}.` });
    if (atrapada) pasos.push({ t: 'Reflexionsperiode', html: `$T_b = 4 ∫_0^{z_t} {dz}/{v_∥(z)}$ mit $v_∥ = √{v^2 − v_⊥0^2 B(z)/B_0}$ ergibt genau $T_b = {2π L}/{v_⊥0} = ${f(Tb)} "s"$${TbSim ? `; die Simulation liefert ${f(TbSim)} s` : ''}.` });
    pasos.push({ t: 'Gültigkeitsbedingung', html: `Der Gyrationsradius $r_L = ${f(rL)} "m"$ ist das ${f(rL / L)}-Fache von $L$ (nötig ist $r_L ≪ L$). Bei der Integration schwankt $μ$ entlang der Strecke höchstens um ${f(dev * 100)} %.` });
    return { modo: 'espejo', P, v, B0, Rm, L, al, atrapada, ac, zm, vp, va, mu, rL, Tc0, zt, Tb, TbSim, tt, dt, muestras: M, mut: muT, dev, zmax, escapa: !!run.parada, tEscapa: run.parada ? run.parada.t : null, Bz: (z) => B0 * (1 + (z * z) / (L * L)), pasos };
  }

  function selector(sc) {
    const pasos = [], P = particula(sc), E = num(sc, 'E', 'das elektrische Feld E'), B = num(sc, 'B', 'das Feld B des Filters'), vs = E / B, aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Daten des Teilchens', html: datosP(P) });
    const v0 = velocidad(sc, P, pasos, true), v = v0 ?? vs;
    pasos.push({ t: 'Geschwindigkeit, die ohne Ablenkung passiert', html: `Im Filter wirken die elektrische Kraft (|q|E) und die magnetische (|q|vB) in entgegengesetzte Richtungen. Sie heben sich auf, wenn $|q| E = |q| v B$, also $v = E/B = ${f(E)}/${f(B)}$ = <b>${f(vs)} m/s</b>, gleich welcher Ladung oder Masse.` });
    const FE = aq * E, FB = aq * v * B, rel = (v - vs) / vs;
    let des = 'nein', hacia = null;
    if (v0 !== null) {
      if (Math.abs(rel) < 1e-6) pasos.push({ t: 'Dieses Teilchen', html: `Bei v = ${f(v)} m/s sind F<sub>e</sub> = ${f(FE)} N und F<sub>m</sub> = ${f(FB)} N gleich: Es fliegt geradeaus durch.` });
      else {
        des = 'si'; hacia = (v > vs) === (P.q > 0) ? 'oben' : 'unten';
        pasos.push({ t: 'Dieses Teilchen', html: `Bei v = ${f(v)} m/s ist $F_e = |q| E$ = ${f(FE)} N und $F_m = |q| v B$ = ${f(FB)} N. ${v > vs ? 'Es ist schneller als nötig, und die magnetische Kraft gewinnt' : 'Es ist langsamer als nötig, und die elektrische Kraft gewinnt'}: Es wird nach <b>${hacia}</b> abgelenkt (zur ${hacia === 'arriba' ? 'positiven' : 'negativen'} Platte) und tritt nicht durch den Spalt aus.` });
      }
    }
    const B2 = num(sc, 'B2', 'das Feld B des Spektrometers', { opcional: true });
    let r2 = null;
    if (B2 !== null) {
      r2 = (P.m * v) / (aq * B2);
      pasos.push({ t: 'Massenspektrometer', html: `Beim Austritt gelangt es in ein Feld B′ = ${f(B2)} T ohne elektrisches Feld und beschreibt einen Halbkreis vom Radius $r = {m v}/{|q| B′} = {${f(P.m)}·${f(v)}}/{${f(aq)}·${f(B2)}}$ = <b>${f(r2)} m</b>. Es trifft die Platte in 2r = <b>${f(2 * r2)} m</b> Abstand vom Spalt. Da v für alle austretenden Teilchen gleich ist, ist r proportional zu m/q: So werden die Isotope getrennt.` });
    }
    const m2 = num(sc, 'm2', 'die Masse des zweiten Isotops', { opcional: true });
    let rb = null, sepa = null;
    if (m2 !== null) {
      if (B2 === null) throw new Error('Um zwei Isotope zu trennen, wird das Feld B′ des Spektrometers benötigt');
      const mb = m2 * U; rb = (mb * vs) / (aq * B2); sepa = 2 * Math.abs(rb - (P.m * vs) / (aq * B2));
      pasos.push({ t: 'Zweites Isotop', html: `Ein Isotop von ${f(m2)} u (m′ = ${f(m2)}·${f(U)} = ${f(mb)} kg) mit derselben Ladung verlässt den Filter mit derselben v = ${f(vs)} m/s und beschreibt $r′ = {m′ v}/{|q| B′}$ = <b>${f(rb)} m</b>. Die Auftreffpunkte sind um $Δx = 2|r′ − r| = {2 v |m′ − m|}/{|q| B′}$ = <b>${f(sepa)} m</b> getrennt.` });
    }
    return { modo: 'selector', P, E, B, vs, v, dado: v0 !== null, FE, FB, des, hacia, B2, r2, m2, rb, sepa, pasos };
  }

  function ciclotron(sc) {
    const pasos = [], P = particula(sc), B = num(sc, 'B', 'das Feld B'), R = num(sc, 'R', 'der Radius der Duanten'), V = num(sc, 'V', 'die Potentialdifferenz', { opcional: true }), aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Daten des Teilchens', html: datosP(P) });
    const fr = (aq * B) / (2 * Math.PI * P.m), vmax = (aq * B * R) / P.m, Ec = 0.5 * P.m * vmax * vmax;
    pasos.push({ t: 'Frequenz des Oszillators', html: `In den Duanten macht das Teilchen halbe Umläufe mit $T = {2π m}/{|q| B}$, unabhängig vom Radius. Die Spannung zwischen den Duanten muss mit dieser Frequenz das Vorzeichen wechseln: $f = {|q| B}/{2π m} = {${f(aq)}·${f(B)}}/{2π·${f(P.m)}}$ = <b>${f(fr)} Hz</b>` });
    pasos.push({ t: 'Geschwindigkeit und Energie beim Austritt', html: `Es tritt aus, wenn sein Radius dem der Duanten entspricht: $R = {m v}/{|q| B} ⇒ v_max = {|q| B R}/m$ = <b>${f(vmax)} m/s</b>${vmax > 0.1 * C ? ' (mehr als 10 % von c: Die klassische Rechnung ist nicht mehr genau)' : ''}. $E_c = 1/2 m v_max^2 = {q^2 B^2 R^2}/{2m}$ = <b>${f(Ec)} J</b> = ${f(Ec / E0 / 1e6)} MeV` });
    let n = null, t = null;
    if (V !== null) {
      n = Ec / (2 * aq * V); t = n / fr;
      pasos.push({ t: 'Umläufe', html: `Bei jedem Umlauf durchquert es den Spalt zwischen den Duanten zweimal und gewinnt 2|q|ΔV = ${f(2 * aq * V)} J. Es braucht $n = {E_c}/{2|q|ΔV}$ = <b>${f(n)} Umläufe</b>, die $t = n T$ = <b>${f(t)} s</b> dauern.` });
    }
    return { modo: 'ciclotron', P, B, R, V, fr, T: 1 / fr, vmax, Ec, n, t, pasos };
  }

  function hilo(sc) {
    const I = num(sc, 'I', 'der Strom I'), L = num(sc, 'L', 'die Länge L'), B = num(sc, 'B', 'das Feld B'), th = num(sc, 'th', 'der Winkel zwischen Draht und B', { cero: true, def: 90 }), m = num(sc, 'm', 'die Masse', { opcional: true });
    if (th > 180) throw new Error('Der Winkel zwischen Draht und B muss zwischen 0° und 180° liegen');
    const s = Math.abs(Math.sin((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.sin((th * Math.PI) / 180), F = I * L * B * s;
    const arriba = (sc.sentidoI !== 'izquierda') === (sc.sentidoB !== 'saliente'), pasos = [];
    pasos.push({ t: 'Kraft auf den Draht', html: `$F = I L B sin θ = ${f(I)}·${f(L)}·${f(B)}${th === 90 ? '' : `·sin ${f(th)}°`}$ = <b>${f(F)} N</b> (${f(F / L)} N pro Meter). Es ist $F = I L × B$, mit L in Stromrichtung.` });
    if (s) pasos.push({ t: 'Richtung', html: `Bei Strom nach ${sc.sentidoI === 'izquierda' ? 'links' : 'rechts'} und B ${sc.sentidoB === 'saliente' ? 'herauskommend (⊙)' : 'hineingehend (⊗)'} zeigt L × B nach <b>${arriba ? 'oben' : 'unten'}</b> (Rechte-Hand-Regel: Finger von L nach B, der Daumen gibt F).` });
    else pasos.push({ t: 'Richtung', html: 'Der Draht ist parallel zum Feld: Es gibt keine Kraft.' });
    let Iflota = null;
    if (m !== null) {
      const P = m * G;
      if (!s) pasos.push({ t: 'Damit er schwebt', html: 'Parallel zum Feld gibt es keine magnetische Kraft, die das Gewicht ausgleicht.' });
      else { Iflota = P / (L * B * s); pasos.push({ t: 'Damit er schwebt', html: `Das Gewicht ist $m g = ${f(m)}·9,8$ = ${f(P)} N. Die magnetische Kraft muss gleich groß und nach oben gerichtet sein: $I = {m g}/{L B sin θ}$ = <b>${f(Iflota)} A</b>${arriba ? '' : ', mit umgekehrtem Strom (jetzt drückt sie nach unten)'}. ${F >= P - 1e-12 ? (arriba ? `Mit ${f(I)} A steigt der Draht.` : '') : `Mit ${f(I)} A reicht es nicht.`}` }); }
    }
    return { modo: 'hilo', I, L, B, th, F, arriba: s ? arriba : null, m, Iflota, sentidoB: sc.sentidoB, sentidoI: sc.sentidoI, pasos };
  }

  function paralelos(sc) {
    const I1 = num(sc, 'I1', 'der Strom I₁'), I2 = num(sc, 'I2', 'der Strom I₂'), d = num(sc, 'd', 'der Abstand d'), L = num(sc, 'L', 'die Länge L', { opcional: true }), mismo = sc.sentido !== 'opuesto';
    const B1 = (MU0 * I1) / (2 * Math.PI * d), B2 = (MU0 * I2) / (2 * Math.PI * d), FL = B1 * I2, F = L !== null ? FL * L : null, pasos = [];
    pasos.push({ t: 'Feld des einen Drahtes am anderen', html: `Draht 1 erzeugt am Draht 2 ein Feld $B_1 = {μ_0 I_1}/{2π d} = {4π·10^{−7}·${f(I1)}}/{2π·${f(d)}}$ = <b>${f(B1)} T</b>, senkrecht zu Draht 2 (und Draht 2 erzeugt an Draht 1 B<sub>2</sub> = ${f(B2)} T).` });
    pasos.push({ t: 'Kraft pro Längeneinheit', html: `$F/L = I_2 B_1 = {μ_0 I_1 I_2}/{2π d}$ = <b>${f(FL)} N/m</b>, auf jeden Draht gleich (Wirkung und Gegenwirkung).${F !== null ? ` Auf ${f(L)} m: F = <b>${f(F)} N</b>.` : ''}` });
    pasos.push({ t: 'Richtung', html: mismo ? 'Die Ströme fließen in dieselbe Richtung: Die Drähte <b>ziehen sich an</b>.' : 'Die Ströme fließen in entgegengesetzte Richtungen: Die Drähte <b>stoßen sich ab</b>.' });
    return { modo: 'paralelos', I1, I2, d, L, B1, B2, FL, F, mismo, pasos };
  }

  function franja(sc) {
    const pasos = [], P = particula(sc), v = velocidad(sc, P, pasos), B = num(sc, 'B', 'das Feld B'), d = num(sc, 'd', 'die Breite d des Streifens'), aq = Math.abs(P.q);
    if (P.pre) pasos.unshift({ t: 'Daten des Teilchens', html: datosP(P) });
    const r = (P.m * v) / (aq * B), w = (aq * B) / P.m, T = (2 * Math.PI) / w, gi = giro(P.q, sc.sentidoB), hacia = gi === 'gegen den Uhrzeigersinn' ? 'oben' : 'unten';
    pasos.push({ t: 'Radius im Feld', html: `Im Streifen beschreibt es einen Kreisbogen vom Radius $r = {m v}/{|q| B} = {${f(P.m)}·${f(v)}}/{${f(aq)}·${f(B)}}$ = <b>${f(r)} m</b>, der sich nach <b>${hacia}</b> krümmt (F = q v × B mit B ${sc.sentidoB === 'saliente' ? 'herauskommend' : 'hineingehend'} und der ${P.q > 0 ? 'positiven' : 'negativen'} Ladung).` });
    if (r > d) {
      const a = Math.asin(d / r), y = r * (1 - Math.cos(a)), t = a / w;
      pasos.push({ t: 'Es tritt auf der anderen Seite aus', html: `Da r > d, durchquert es ihn. Der Mittelpunkt des Bogens liegt am Eintrittsrand, daher gilt beim Austritt $sin α = d/r = ${f(d)}/${f(r)}$ = ${f(d / r)}, und die Geschwindigkeit wurde um <b>α = ${f((a * 180) / Math.PI)}°</b> abgelenkt.` });
      pasos.push({ t: 'Versatz und Zeit', html: `Es tritt ${hacia === 'arriba' ? 'oberhalb' : 'unterhalb'} der Eintrittsstelle aus, bei $y = r (1 − cos α)$ = <b>${f(y)} m</b>, und braucht für die Durchquerung $t = α/ω = {α m}/{|q| B}$ = <b>${f(t)} s</b>. Mit gleichem Betrag der Geschwindigkeit: Das Feld ändert den Betrag von v nicht.` });
      return { modo: 'franja', P, v, B, d, r, T, cruza: true, alfa: (a * 180) / Math.PI, y, t, hacia, sentidoB: sc.sentidoB, pasos };
    }
    pasos.push({ t: 'Es kehrt um', html: `Da r ≤ d, erreicht es den anderen Rand nicht: Es beschreibt einen Halbkreis und tritt am selben Rand in Gegenrichtung aus, in 2r = <b>${f(2 * r)} m</b> Abstand ${hacia === 'arriba' ? 'oberhalb' : 'unterhalb'} des Eintrittspunkts. Es braucht eine halbe Umlaufzeit, $t = {π m}/{|q| B}$ = <b>${f(T / 2)} s</b>, und dringt bis ${f(r)} m vom Rand vor.` });
    return { modo: 'franja', P, v, B, d, r, T, cruza: false, alfa: 180, y: 2 * r, t: T / 2, hacia, sentidoB: sc.sentidoB, pasos };
  }

  function cruzados(sc) {
    const pasos = [], P = particula(sc), E = num(sc, 'E', 'das elektrische Feld E'), B = num(sc, 'B', 'das Feld B'), v0 = num(sc, 'v0', 'die Anfangsgeschwindigkeit', { signo: true, def: 0 }), aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Daten des Teilchens', html: datosP(P) });
    const vd = E / B, w = (aq * B) / P.m, T = (2 * Math.PI) / w, u = v0 - vd, R = Math.abs(u) / w, sube = u * P.q < 0;
    pasos.push({ t: 'Driftgeschwindigkeit', html: `Bei E ⊥ B würden sich elektrische und magnetische Kraft aufheben, wenn das Teilchen mit $v_d = E/B$ flöge. Deshalb betrachtet man es am besten aus einem System, das sich mit $v_d = ${f(E)}/${f(B)}$ = <b>${f(vd)} m/s</b> in Richtung E × B (nach rechts) bewegt, gleich welches Vorzeichen die Ladung hat.` });
    if (Math.abs(u) < 1e-9 * vd) {
      pasos.push({ t: 'Bewegung', html: `Seine Anfangsgeschwindigkeit ist genau E/B: Beide Kräfte heben sich auf, und es fliegt geradeaus (es ist der Geschwindigkeitsfilter).` });
      return { modo: 'cruzados', P, E, B, v0, vd, w, T, u: 0, R: 0, h: 0, vmax: vd, avance: vd * T, sube, pasos };
    }
    pasos.push({ t: 'Im mitbewegten System', html: `Dort hat das Teilchen die Geschwindigkeit $u = v_0 − v_d$ = ${f(u)} m/s und spürt nur das Feld B: Es kreist auf einem Kreis vom Radius $R = {m |u|}/{|q| B}$ = <b>${f(R)} m</b> mit $ω = {|q| B}/m$ = ${f(w)} rad/s und der Umlaufzeit T = <b>${f(T)} s</b>.` });
    const h = 2 * R, vmax = vd + Math.abs(u), avance = vd * T;
    pasos.push({ t: 'Bahn', html: `Addiert man den Vorschub, ${Math.abs(Math.abs(u) - vd) < 1e-9 * vd ? `${v0 === 0 ? 'startet es aus der Ruhe und ' : ''}beschreibt es eine <b>Zykloide</b> (mit Spitzen, an denen es stehen bleibt)` : Math.abs(u) > vd ? 'beschreibt es eine <b>Trochoide mit Schleifen</b> (zeitweise läuft es rückwärts)' : 'beschreibt es eine <b>verkürzte Zykloide</b>, wellenförmig und ohne anzuhalten'}: $x(t) = v_d t + u/ω sin(ω t)$, $y(t) = u/ω (cos(ω t) − 1)$, mit ω = qB/m mit seinem Vorzeichen. Es entfernt sich höchstens $h = 2R$ = <b>${f(h)} m</b> ${sube ? 'nach oben' : 'nach unten'} von der Ausgangsgeraden, kommt pro Periode ${f(avance)} m voran, und seine Höchstgeschwindigkeit ist $v_d + |u|$ = <b>${f(vmax)} m/s</b>.` });
    if (v0 === 0) pasos.push({ t: 'Kontrolle mit der Energie', html: `Am höchsten Punkt hat es $E_c = |q| E h = ${f(aq)}·${f(E)}·${f(h)}$ = ${f(aq * E * h)} J gewonnen, und $1/2 m (2E/B)^2$ = ${f(0.5 * P.m * vmax * vmax)} J: dasselbe, weil B keine Arbeit verrichtet.` });
    return { modo: 'cruzados', P, E, B, v0, vd, w, T, u, R, h, vmax, avance, sube, pasos };
  }

  function hall(sc) {
    const pasos = [], I = num(sc, 'I', 'der Strom I'), B = num(sc, 'B', 'das Feld B'), t = num(sc, 't', 'die Dicke t'), w = num(sc, 'w', 'die Breite', { opcional: true }), e = sc.portador === 'huecos';
    let n, VH;
    if (sc.dato === 'VH') { VH = num(sc, 'VH', 'die Hall-Spannung'); n = (I * B) / (E0 * t * VH); pasos.push({ t: 'Dichte der Ladungsträger', html: `Aus $V_H = {I B}/{n e t}$ folgt $n = {I B}/{e t V_H} = {${f(I)}·${f(B)}}/{${f(E0)}·${f(t)}·${f(VH)}}$ = <b>${f(n)} m<sup>−3</sup></b>.` }); }
    else { n = num(sc, 'n', 'die Dichte der Ladungsträger n'); VH = (I * B) / (n * E0 * t); pasos.push({ t: 'Hall-Spannung', html: `Im Gleichgewicht hebt die elektrische Kraft des Hall-Feldes die magnetische auf: $e E_H = e v_d B$. Mit $I = n e v_d w t$ und $V_H = E_H w$ ergibt sich $V_H = {I B}/{n e t} = {${f(I)}·${f(B)}}/{${f(n)}·${f(E0)}·${f(t)}}$ = <b>${f(VH)} V</b>. Sie hängt nicht von der Breite ab.` }); }
    const RH = (e ? 1 : -1) / (n * E0);
    pasos.push({ t: 'Hall-Koeffizient', html: `$R_H = 1/{n q}$ = <b>${f(RH)} m<sup>3</sup>/C</b>, ${e ? 'positiv, weil die Ladungsträger Löcher sind' : 'negativ, weil die Ladungsträger Elektronen sind'}.` });
    let vd = null, EH = null;
    if (w !== null) { vd = I / (n * E0 * w * t); EH = VH / w; pasos.push({ t: 'Driftgeschwindigkeit und Hall-Feld', html: `$v_d = I/{n e w t}$ = <b>${f(vd)} m/s</b> y $E_H = {V_H}/w = v_d B$ = <b>${f(EH)} V/m</b>.` }); }
    const arriba = sc.sentidoB !== 'saliente', alta = (e === arriba) ? 'von oben' : 'von unten';
    pasos.push({ t: 'Welche Seite auf höherem Potential liegt', html: `Bei Strom nach rechts und B ${arriba ? 'hineingehend (⊗)' : 'herauskommend (⊙)'} lenkt F = q v × B die Ladungsträger nach ${arriba ? 'oben' : 'unten'}, ob es Elektronen (q < 0 und v nach links) oder Löcher sind. Dort sammeln sie sich: ${e ? 'Die Löcher machen' : 'Die Elektronen machen'} diese Seite ${e ? 'positiv' : 'negativ'}, und die <b>${alta}</b> Seite liegt auf höherem Potential. So erkennt man das Vorzeichen der Ladungsträger.` });
    return { modo: 'hall', I, B, t, w, n, VH, RH, vd, EH, huecos: e, arriba, alta, sentidoB: sc.sentidoB, pasos };
  }

  function espira(sc) {
    const pasos = [], N = num(sc, 'N', 'die Windungszahl N', { def: 1 }), I = num(sc, 'I', 'der Strom I'), B = num(sc, 'B', 'das Feld B'), th = num(sc, 'th', 'der Winkel zwischen der Normalen und B', { cero: true, def: 90 }), circ = sc.forma === 'circ';
    if (th > 180) throw new Error('Der Winkel zwischen der Normalen und B muss zwischen 0° und 180° liegen');
    let S, a, b, R;
    if (circ) { R = num(sc, 'R', 'der Radius R'); S = Math.PI * R * R; }
    else { a = num(sc, 'a', 'die Seite a'); b = num(sc, 'b', 'die Seite b'); S = a * b; }
    const rad = (th * Math.PI) / 180, s = Math.abs(Math.sin(rad)) < 1e-12 ? 0 : Math.sin(rad), c = Math.abs(Math.cos(rad)) < 1e-12 ? 0 : Math.cos(rad), m = N * I * S, tau = m * B * s, Ue = -m * B * c, W = m * B * (1 - c);
    pasos.push({ t: 'Magnetisches Moment', html: `$S = ${circ ? `π R^2 = π·${f(R)}^2` : `a b = ${f(a)}·${f(b)}`}$ = ${f(S)} m<sup>2</sup> und $m = N I S = ${f(N)}·${f(I)}·${f(S)}$ = <b>${f(m)} A·m<sup>2</sup></b>, senkrecht zur Schleife (Rechte-Hand-Regel mit dem Strom).` });
    if (!circ) pasos.push({ t: 'Kräfte auf die Seiten', html: `Die Seiten a (senkrecht zu B) erfahren $F = N I a B$ = ${f(N * I * a * B)} N, gleich groß und entgegengesetzt: Sie verschieben die Schleife nicht, bilden aber ein Drehmoment mit Hebelarm b sin θ. Die Kräfte auf die Seiten b heben sich auf derselben Geraden auf.` });
    pasos.push({ t: 'Drehmoment', html: `$τ = m × B$, $|τ| = m B sin θ = N I S B sin θ = ${f(m)}·${f(B)}${th === 90 ? '' : `·sin ${f(th)}°`}$ = <b>${f(tau)} N·m</b>. ${s ? 'Es dreht die Schleife so, dass m parallel zu B steht.' : 'Es ist null: m ist parallel (oder antiparallel) zu B.'} Das maximale Drehmoment, bei zu B senkrechter Normalen, beträgt ${f(m * B)} N·m.` });
    pasos.push({ t: 'Energie', html: `$U = −m · B = −m B cos θ$ = <b>${f(Ue)} J</b>. Das stabile Gleichgewicht ist θ = 0° (U = −mB) und das instabile θ = 180°. Um sie von θ = 0° bis ${f(th)}° zu drehen, muss $W = m B (1 − cos θ)$ = <b>${f(W)} J</b> aufgebracht werden.` });
    return { modo: 'espira', N, I, B, th, circ, a, b, R, S, m, tau, U: Ue, W, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'vectorial') return vectorial(sc);
    if (sc.modo === 'trayectoria') return trayectoria(sc);
    if (sc.modo === 'espejo') return espejo(sc);
    if (sc.modo === 'selector') return selector(sc);
    if (sc.modo === 'ciclotron') return ciclotron(sc);
    if (sc.modo === 'franja') return franja(sc);
    if (sc.modo === 'cruzados') return cruzados(sc);
    if (sc.modo === 'hall') return hall(sc);
    if (sc.modo === 'espira') return espira(sc);
    if (sc.modo === 'hilo') return hilo(sc);
    if (sc.modo === 'paralelos') return paralelos(sc);
    return carga(sc);
  }

  const P0 = { q: '', m: '' };
  const ejemplos = [
    { clave: 'proton', nombre: 'Proton, das senkrecht zu B eintritt', sc: { modo: 'carga', part: 'proton', ...P0, uv: 'ms', v: '2e6', B: '0,5', th: '90', sentidoB: 'entrante' } },
    { clave: 'electron', nombre: 'Elektron, durch 1000 V beschleunigt', sc: { modo: 'carga', part: 'electron', ...P0, uv: 'V', v: '1000', B: '0,01', th: '90', sentidoB: 'saliente' } },
    { clave: 'helice', nombre: 'Proton unter 60° zum Feld: Schraubenlinie', sc: { modo: 'carga', part: 'proton', ...P0, uv: 'ms', v: '5e5', B: '0,2', th: '60', sentidoB: 'entrante' } },
    { clave: 'alfa', nombre: '5-MeV-α-Teilchen', sc: { modo: 'carga', part: 'alfa', ...P0, uv: 'eV', v: '5e6', B: '1', th: '90', sentidoB: 'entrante' } },
    { clave: 'vec-proton', nombre: 'F = q v × B eines Protons', sc: { modo: 'vectorial', part: 'proton', ...P0, vx: '2e5', vy: '3e5', vz: '0', Bx: '0', By: '0', Bz: '0,5', Ex: '', Ey: '', Ez: '' } },
    { clave: 'vec-electron', nombre: 'Elektron mit B in zwei Richtungen', sc: { modo: 'vectorial', part: 'electron', ...P0, vx: '1e6', vy: '0', vz: '0', Bx: '0', By: '0,2', Bz: '0,3', Ex: '', Ey: '', Ez: '' } },
    { clave: 'vec-lorentz', nombre: 'Lorentzkraft mit E und B', sc: { modo: 'vectorial', part: 'otra', q: '2e-6', m: '1e-9', vx: '0', vy: '400', vz: '0', Bx: '0,1', By: '0', Bz: '0', Ex: '0', Ey: '0', Ez: '50' } },
    { clave: 'tray-helice', nombre: 'Proton mit parallelen E und B: beschleunigende Schraubenlinie (FU-1)', sc: { modo: 'trayectoria', part: 'proton', ...P0, vx: '1e5', vy: '0', vz: '1e5', Bx: '0', By: '0', Bz: '0,1', Ex: '0', Ey: '0', Ez: '50', tt: '' } },
    { clave: 'tray-deriva', nombre: 'Elektron mit gekreuzten und geneigten E und B: Drift (FU-1)', sc: { modo: 'trayectoria', part: 'electron', ...P0, vx: '2e5', vy: '0', vz: '1e5', Bx: '0', By: '0', Bz: '0,01', Ex: '300', Ey: '0', Ez: '0', tt: '' } },
    { clave: 'tray-general', nombre: 'Teilchen mit B und E in beliebigen Richtungen (FU-1)', sc: { modo: 'trayectoria', part: 'alfa', ...P0, vx: '1e5', vy: '2e5', vz: '5e4', Bx: '0,05', By: '0,02', Bz: '0,1', Ex: '200', Ey: '-100', Ez: '300', tt: '' } },
    { clave: 'espejo-atrapada', nombre: 'In einer magnetischen Flasche gefangenes Elektron (FU-3)', sc: { modo: 'espejo', part: 'electron', ...P0, uv: 'eV', v: '100', B0: '0,01', Rm: '4', L: '0,5', al: '45' } },
    { clave: 'espejo-escapa', nombre: 'Elektron, das durch den Verlustkegel entkommt (FU-3)', sc: { modo: 'espejo', part: 'electron', ...P0, uv: 'eV', v: '100', B0: '0,01', Rm: '4', L: '0,5', al: '20' } },
    { clave: 'selector', nombre: 'Geschwindigkeitsfilter und Spektrometer', sc: { modo: 'selector', part: 'proton', ...P0, uv: 'ms', v: '', E: '1e5', B: '0,2', B2: '0,5' } },
    { clave: 'isotopos', nombre: 'Spektrometer: Trennung zweier Isotope', sc: { modo: 'selector', part: 'otra', q: '1,602e-19', m: '1,993e-26', uv: 'ms', v: '', E: '4e4', B: '0,1', B2: '0,5', m2: '13' } },
    { clave: 'selector-rapido', nombre: 'Zu schnelles Elektron im Filter', sc: { modo: 'selector', part: 'electron', ...P0, uv: 'ms', v: '3e6', E: '2e4', B: '0,01', B2: '' } },
    { clave: 'ciclotron', nombre: 'Protonenzyklotron', sc: { modo: 'ciclotron', part: 'proton', ...P0, B: '1,5', R: '0,5', V: '5e4' } },
    { clave: 'ciclotron-d', nombre: 'Deuteronenzyklotron', sc: { modo: 'ciclotron', part: 'deuteron', ...P0, B: '1', R: '0,6', V: '1e4' } },
    { clave: 'franja-cruza', nombre: 'Proton, das einen Feldstreifen durchquert', sc: { modo: 'franja', part: 'proton', ...P0, uv: 'ms', v: '1e6', B: '0,2', sentidoB: 'entrante', d: '0,03' } },
    { clave: 'franja-vuelve', nombre: 'Elektron, das den Streifen nicht durchquert', sc: { modo: 'franja', part: 'electron', ...P0, uv: 'eV', v: '500', B: '0,002', sentidoB: 'entrante', d: '0,05' } },
    { clave: 'cicloide', nombre: 'Ruhendes Proton in gekreuzten E und B: Zykloide', sc: { modo: 'cruzados', part: 'proton', ...P0, E: '1000', B: '0,01', v0: '' } },
    { clave: 'trocoide', nombre: 'Elektron mit Anfangsgeschwindigkeit in gekreuzten E und B', sc: { modo: 'cruzados', part: 'electron', ...P0, E: '2000', B: '0,001', v0: '5e6' } },
    { clave: 'hall-cobre', nombre: 'Hall-Spannung in einem Kupferplättchen', sc: { modo: 'hall', portador: 'electrones', I: '20', B: '1,5', sentidoB: 'entrante', t: '1e-4', w: '0,02', dato: 'n', n: '8,5e28', VH: '' } },
    { clave: 'hall-semi', nombre: 'Löcherdichte eines Halbleiters', sc: { modo: 'hall', portador: 'huecos', I: '0,01', B: '0,5', sentidoB: 'entrante', t: '1e-3', w: '5e-3', dato: 'VH', n: '', VH: '3e-3' } },
    { clave: 'espira-rect', nombre: 'Drehmoment auf eine rechteckige Spule', sc: { modo: 'espira', N: '50', I: '2', forma: 'rect', a: '0,1', b: '0,05', R: '', B: '0,4', th: '30' } },
    { clave: 'espira-circ', nombre: 'Kreisförmige Leiterschleife mit der Normalen senkrecht zu B', sc: { modo: 'espira', N: '1', I: '5', forma: 'circ', a: '', b: '', R: '0,1', B: '0,2', th: '90' } },
    { clave: 'hilo', nombre: 'Stromführender Draht im Feld', sc: { modo: 'hilo', I: '5', L: '0,5', B: '0,4', th: '90', sentidoB: 'entrante', sentidoI: 'derecha', m: '' } },
    { clave: 'hilo-flota', nombre: 'Strom, damit ein Draht schwebt', sc: { modo: 'hilo', I: '2', L: '0,2', B: '0,5', th: '90', sentidoB: 'saliente', sentidoI: 'izquierda', m: '0,01' } },
    { clave: 'paralelos', nombre: 'Zwei Drähte mit gleichgerichteten Strömen', sc: { modo: 'paralelos', I1: '10', I2: '5', d: '0,1', L: '1', sentido: 'mismo' } },
    { clave: 'antiparalelos', nombre: 'Zwei Drähte mit entgegengesetzten Strömen', sc: { modo: 'paralelos', I1: '20', I2: '20', d: '0,05', L: '', sentido: 'opuesto' } },
  ];

  return { resolver, rk4, carga, vectorial, trayectoria, espejo, selector, ciclotron, franja, cruzados, hall, espira, hilo, paralelos, ejemplos, f, PART, E0, U, MU0 };
})();

