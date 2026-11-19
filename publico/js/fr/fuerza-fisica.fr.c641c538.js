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
    if (vacio(sc[k])) { if (def !== null) return def; if (opcional) return null; throw new Error(`${nom} manquant`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} doit être un nombre`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${may(nom)} doit être ${cero ? 'positif ou nul' : 'supérieur à 0'}`);
    return v;
  }
  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const E0 = SI.e, U = 1.66053907e-27, C = SI.c, MU0 = 4 * Math.PI * 1e-7, G = 9.8;
  const PART = {
    proton: { nom: 'proton', art: 'le', q: E0, m: 1.67262192e-27 },
    electron: { nom: 'électron', art: 'le', q: -E0, m: 9.1093837e-31 },
    alfa: { nom: 'particule α', art: 'la', q: 2 * E0, m: 6.6446573e-27 },
    deuteron: { nom: 'deutéron', art: 'le', q: E0, m: 3.3435838e-27 },
  };
  function particula(sc, conM = true) {
    const p = PART[sc.part];
    if (p) return { ...p, pre: true };
    const q = num(sc, 'q', 'la charge q', { signo: true });
    if (q === 0) throw new Error('Avec une charge nulle, il n\'y a pas de force magnétique');
    return { nom: 'particule', q, m: conM ? num(sc, 'm', 'la masse m') : num(sc, 'm', 'la masse m', { opcional: true }), pre: false };
  }
  const datosP = (P) => (P.pre ? `Pour ${P.art} ${P.nom}, q = ${f(P.q)} C et m = ${f(P.m)} kg.` : '');
  function velocidad(sc, P, pasos, opcional = false) {
    const uv = sc.uv || 'ms';
    const x = num(sc, 'v', uv === 'ms' ? 'la vitesse' : uv === 'eV' ? 'l\'énergie cinétique' : 'la différence de potentiel', { opcional });
    if (x === null) return null;
    if (uv === 'ms') return x;
    const Ec = uv === 'eV' ? x * E0 : Math.abs(P.q) * x, v = Math.sqrt((2 * Ec) / P.m);
    pasos.push({ t: 'Vitesse', html: `${uv === 'eV' ? `E<sub>c</sub> = ${f(x)} eV = ${f(x)}·${f(E0)} = ${f(Ec)} J` : `Accélérée depuis le repos sous une ddp de ${f(x)} V, elle gagne $E_c = |q| ΔV = ${f(Math.abs(P.q))}·${f(x)}$ = ${f(Ec)} J`}, donc $v = √({2E_c}/m) = √({2·${f(Ec)}}/{${f(P.m)}})$ = <b>${f(v)} m/s</b>${v > 0.1 * C ? `. C'est plus de 10 % de la vitesse de la lumière : le résultat classique n'est plus exact (il faudrait utiliser la relativité).` : ''}` });
    return v;
  }
  const giro = (q, sentidoB) => ((q > 0) === (sentidoB === 'entrante') ? 'antihoraire' : 'horaire');

  function carga(sc) {
    const pasos = [], P = particula(sc), v = velocidad(sc, P, pasos), B = num(sc, 'B', 'le champ B'), th = num(sc, 'th', 'l\'angle entre v et B', { cero: true, def: 90 });
    if (th > 180) throw new Error('L\'angle entre v et B doit être compris entre 0° et 180°');
    const s = Math.abs(Math.sin((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.sin((th * Math.PI) / 180), c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180);
    const aq = Math.abs(P.q), F = aq * v * B * s, vp = v * s, va = v * c, w = (aq * B) / P.m, T = (2 * Math.PI) / w, r = vp / w, paso = va * T, Ec = 0.5 * P.m * v * v;
    if (P.pre) pasos.unshift({ t: 'Données de la particule', html: datosP(P) });
    pasos.push({ t: 'Force de Lorentz', html: `$F = |q| v B sin θ = ${f(aq)}·${f(v)}·${f(B)}${th === 90 ? '' : `·sen ${f(th)}°`}$ = <b>${f(F)} N</b>. Elle est perpendiculaire à v et à B, donc elle ne travaille pas : le module de la vitesse et l'énergie cinétique (${f(Ec)} J = ${f(Ec / E0)} eV) ne changent pas.` });
    if (s === 0) {
      pasos.push({ t: 'Mouvement', html: 'La vitesse est parallèle au champ : il n\'y a pas de force magnétique et la particule continue en ligne droite à vitesse constante.' });
      return { modo: 'carga', P, v, B, th, F: 0, r: Infinity, T, f: 1 / T, w, paso: Infinity, va, vp: 0, Ec, giro: null, sentidoB: sc.sentidoB, pasos };
    }
    pasos.push({ t: 'Rayon de la trajectoire', html: `La force magnétique joue le rôle de force centripète : $|q| v${th === 90 ? '' : '_⊥'} B = {m v${th === 90 ? '' : '_⊥'}^2}/r$, ${th === 90 ? '' : `avec $v_⊥ = v sen θ$ = ${f(vp)} m/s, `}d'où $r = {m v${th === 90 ? '' : '_⊥'}}/{|q| B} = {${f(P.m)}·${f(vp)}}/{${f(aq)}·${f(B)}}$ = <b>${f(r)} m</b>` });
    pasos.push({ t: 'Période et fréquence', html: `$T = {2π r}/{v${th === 90 ? '' : '_⊥'}} = {2π m}/{|q| B}$ = <b>${f(T)} s</b> ; $f = 1/T$ = <b>${f(1 / T)} Hz</b> et $ω = {|q| B}/m$ = ${f(w)} rad/s. Elles ne dépendent pas de la vitesse (c'est le principe du cyclotron).` });
    const gi = giro(P.q, th === 90 ? sc.sentidoB : 'entrante');
    if (th !== 90) pasos.push({ t: 'Hélice', html: `La composante parallèle à B, $v_∥ = v cos θ$ = ${f(va)} m/s, ne change pas : la particule avance le long du champ tout en tournant, et décrit une hélice de rayon ${f(r)} m et de pas $p = v_∥ T = ${f(Math.abs(va))}·${f(T)}$ = <b>${f(Math.abs(paso))} m</b>.` });
    pasos.push({ t: 'Sens de rotation', html: th === 90 ? `Avec B ${sc.sentidoB === 'saliente' ? 'sortant (⊙)' : 'entrant (⊗)'} et la charge ${P.q > 0 ? 'positive' : 'négative'}, F = q v × B pointe vers le centre et la particule tourne dans le sens <b>${gi}</b> sur l'écran.` : `En regardant dans le sens de B, une charge ${P.q > 0 ? 'positive tourne dans le sens antihoraire' : 'négative tourne dans le sens horaire'} (F = q v × B).` });
    return { modo: 'carga', P, v, B, th, F, r, T, f: 1 / T, w, paso: Math.abs(paso), va, vp, Ec, giro: gi, sentidoB: sc.sentidoB, pasos };
  }

  const comp = (sc, p, nom, opcional = false) => ['x', 'y', 'z'].map((e) => num(sc, p + e, `la composante ${e} de ${nom}`, { signo: true, def: opcional || !vacio(sc[p + 'x']) || !vacio(sc[p + 'y']) || !vacio(sc[p + 'z']) ? 0 : null }));
  const ijk = (u, un) => { const t = u.map((x, i) => (Math.abs(x) < 1e-300 ? '' : `${x < 0 ? '−' : '+'} ${f(Math.abs(x))} <i class="uv">${'ijk'[i]}</i>`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−'); return t ? `(${t}) ${un}` : `0 ${un}`; };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]].map((x) => (Math.abs(x) < 1e-300 ? 0 : x));
  const mod = (u) => Math.hypot(...u);
  function vectorial(sc) {
    const pasos = [], P = particula(sc, false), v = comp(sc, 'v', 'v'), B = comp(sc, 'B', 'B'), hayE = ['x', 'y', 'z'].some((e) => !vacio(sc['E' + e])), E = hayE ? comp(sc, 'E', 'E', true) : [0, 0, 0];
    if (mod(B) === 0 && !hayE) throw new Error('Saisissez au moins une composante de B');
    if (P.pre) pasos.push({ t: 'Données de la particule', html: datosP(P) });
    const vB = cruz(v, B), Fm = vB.map((x) => P.q * x), Fe = E.map((x) => P.q * x), F = Fm.map((x, i) => x + Fe[i]);
    const det = `<span class="det"><table><tr><td><i class="uv">i</i></td><td><i class="uv">j</i></td><td><i class="uv">k</i></td></tr><tr>${v.map((x) => `<td>${f(x)}</td>`).join('')}</tr><tr>${B.map((x) => `<td>${f(x)}</td>`).join('')}</tr></table></span>`;
    pasos.push({ t: 'Produit vectoriel', html: `v × B = ${det} = ${ijk(vB, 'T·m/s')}<br>Chaque composante est un déterminant 2×2 : $(v_y B_z − v_z B_y, v_z B_x − v_x B_z, v_x B_y − v_y B_x)$.` });
    pasos.push({ t: 'Force magnétique', html: `$F_m = q (v × B)$ = ${f(P.q)}·${ijk(vB, '')} = <b>${ijk(Fm, 'N')}</b>, de module |F<sub>m</sub>| = ${f(mod(Fm))} N.` });
    const cv = mod(v) && mod(B) ? (v[0] * B[0] + v[1] * B[1] + v[2] * B[2]) / (mod(v) * mod(B)) : 1, ang = (Math.acos(Math.max(-1, Math.min(1, cv))) * 180) / Math.PI;
    if (mod(v) && mod(B)) pasos.push({ t: 'Vérification', html: `L'angle entre v et B est de ${f(ang)}°, et $|q| v B sen θ$ = ${f(Math.abs(P.q) * mod(v) * mod(B) * Math.sin((ang * Math.PI) / 180))} N, ce qui est identique. F<sub>m</sub> est perpendiculaire à v ($F_m · v = 0$) et à B.` });
    if (hayE) {
      pasos.push({ t: 'Force électrique', html: `$F_e = q E$ = ${f(P.q)}·${ijk(E, 'V/m')} = ${ijk(Fe, 'N')}` });
      pasos.push({ t: 'Force de Lorentz', html: `$F = q (E + v × B)$ = <b>${ijk(F, 'N')}</b>, de module <b>${f(mod(F))} N</b>.` });
    }
    let a = null;
    if (P.m) { a = F.map((x) => x / P.m); pasos.push({ t: 'Accélération', html: `$a = F/m$ = ${ijk(a, 'm/s<sup>2</sup>')}, de module ${f(mod(a))} m/s<sup>2</sup>.` }); }
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
    if (!Bm && !hayE) throw new Error('Saisissez au moins une composante de B ou de E');
    if (!mod(v0) && !mod(E)) throw new Error('Sans vitesse initiale et sans champ électrique, la particule ne bouge pas');
    const aq = Math.abs(P.q), b = Bm ? B.map((x) => x / Bm) : [0, 0, 1], Epar = dot(E, b), Eperp = E.map((x, i) => x - Epar * b[i]);
    const vd = Bm ? cruz(Eperp, B).map((x) => x / (Bm * Bm)) : [0, 0, 0], vpar = dot(v0, b), vperp = v0.map((x, i) => x - vpar * b[i] - vd[i]), vpm = mod(vperp);
    const w = Bm ? (aq * Bm) / P.m : 0, Tc = Bm ? (2 * Math.PI) / w : Infinity, rL = Bm ? (P.m * vpm) / (aq * Bm) : Infinity, apar = (P.q * Epar) / P.m;
    if (Bm && mod(vd) >= C) throw new Error('E/B ne peut pas être égal ou supérieur à c : le modèle non relativiste n\'est pas valable');
    const tt = vacio(sc.tt) ? (Bm ? 5 * Tc : null) : num(sc, 'tt', 'le temps d\'intégration');
    if (tt === null) throw new Error('Sans B, il faut saisir le temps d\'intégration');
    const dt = Bm ? Math.min(Tc / 400, tt / 200) : tt / 400;
    if (tt / dt > 400000) throw new Error('Trop de pas d\'intégration : réduisez le temps');
    const run = rk4(P, () => E, () => B, [0, 0, 0], v0, tt, dt), M = run.m, ult = M[M.length - 1], KE = (r) => 0.5 * P.m * (r[4] * r[4] + r[5] * r[5] + r[6] * r[6]);
    const KE0 = KE(M[0]), KE1 = KE(ult), WE = P.q * dot(E, [ult[1], ult[2], ult[3]]);
    if (P.pre) pasos.push({ t: 'Données de la particule', html: datosP(P) });
    pasos.push({ t: 'Équation du mouvement', html: `$m {dv}/{dt} = q (E + v × B)$ avec $E = ${ijk(E, 'V/m')}$ et $B = ${ijk(B, 'T')}$. Elle n'a pas de solution analytique en général, on l'intègre donc par Runge-Kutta d'ordre 4 avec ${Math.round(tt / dt)} pas de $${f(dt)} "s"$ jusqu'à $t = ${f(tt)} "s"$.` });
    if (Bm) pasos.push({ t: 'Rotation autour de B', html: `$ω_c = {|q| B}/m = ${f(w)} "rad/s"$, période $T_c = 2π/ω_c = ${f(Tc)} "s"$ et, dans le référentiel qui se déplace avec la dérive, rayon $r_L = {m v_⊥}/{|q| B} = ${f(rL)} "m"$ avec $v_⊥ = ${f(vpm)} "m/s"$ (la vitesse perpendiculaire à B moins la dérive).` });
    if (hayE && Bm) pasos.push({ t: 'Dérive E × B', html: `La partie de E perpendiculaire à B, $E_⊥ = ${ijk(Eperp, 'V/m')}$, fait dériver la particule, quelle que soit sa charge, avec $v_d = {E × B}/{B^2} = ${ijk(vd, 'm/s')}$ (module ${f(mod(vd))} m/s).` });
    if (hayE) pasos.push({ t: 'Accélération le long de B', html: Bm ? `La partie parallèle, $E_∥ = ${f(Epar)} "V/m"$, accélère la particule le long du champ : $a_∥ = {q E_∥}/m = ${f(apar)} "m/s"^2$, et $v_∥ = ${f(vpar)} + a_∥ t$.` : `Sans B, l'accélération est $a = qE/m = ${ijk(E.map((x) => (P.q * x) / P.m), 'm/s²')}$.` });
    pasos.push({ t: 'Énergie', html: `Le champ magnétique ne travaille pas ; le champ électrique, si : $ΔE_c = q E·Δr = ${f(WE)} "J"$. Avec l'intégration, $E_c$ passe de ${f(KE0)} J à ${f(KE1)} J (${f(KE1 - KE0)} J).` });
    return { modo: 'trayectoria', P, v0, B, E, hayE, Bm, w, Tc, rL, vd, vpar, vpm, apar, tt, dt, muestras: M, KE0, KE1, WE, rf: [ult[1], ult[2], ult[3]], vf: [ult[4], ult[5], ult[6]], Kmax: Math.max(...M.map(KE)), pasos };
  }

  function espejo(sc) {
    const pasos = [], P = particula(sc, true), v = velocidad(sc, P, pasos), B0 = num(sc, 'B0', 'le champ B₀ au centre'), Rm = num(sc, 'Rm', 'le rapport de miroir Bmax/B₀'), L = num(sc, 'L', 'la longueur caractéristique L'), al = num(sc, 'au', 'l\'angle α₀', { signo: true });
    if (!(Rm > 1)) throw new Error('Le rapport de miroir doit être supérieur à 1');
    if (!(al > 0 && al <= 90)) throw new Error('L\'angle α₀ entre v et B doit être compris entre 0° (exclu) et 90°');
    const a0 = (al * Math.PI) / 180, s0 = Math.sin(a0), c0 = Math.abs(Math.cos(a0)) < 1e-12 ? 0 : Math.cos(a0), aq = Math.abs(P.q), zm = L * Math.sqrt(Rm - 1), ac = Math.asin(1 / Math.sqrt(Rm)), atrapada = s0 > 1 / Math.sqrt(Rm) + 1e-12;
    const vp = v * s0, va = v * c0, mu = (P.m * vp * vp) / (2 * B0), w0 = (aq * B0) / P.m, rL = (P.m * vp) / (aq * B0), Tc0 = (2 * Math.PI) / w0, zt = c0 === 0 ? 0 : L * (c0 / s0), Tb = (2 * Math.PI * L) / vp;
    const Bf = (r) => [(-B0 * r[0] * r[2]) / (L * L), (-B0 * r[1] * r[2]) / (L * L), B0 * (1 + (r[2] * r[2]) / (L * L))];
    const tt = atrapada ? 3 * Tb : Math.min(3 * Tb, (2 * zm) / Math.max(va, 1e-30) * 1.5 + Tb), dt = Math.min(Tc0 / 200, tt / 400);
    if (rL > 0.3 * L) throw new Error(`Le rayon de giration (${f(rL)} m) n'est pas petit devant L (${f(L)} m) : le moment magnétique ne se conserve pas bien. Réduisez l'énergie, augmentez B₀ ou augmentez L`);
    if (tt / dt > 500000) throw new Error('Trop de pas d\'intégration : le rayon de giration est très petit devant L ; augmentez l\'énergie ou diminuez B₀');
    const run = rk4(P, () => [0, 0, 0], (r) => Bf(r), [0, 0, 0], [vp, 0, va], tt, dt, (r) => Math.abs(r[2]) >= zm), M = run.m;
    const muT = M.map((q) => { const r = [q[1], q[2], q[3]], Bv = Bf(r), Bn = mod(Bv), vv = [q[4], q[5], q[6]], vpar = dot(vv, Bv) / Bn, v2 = dot(vv, vv); return [q[0], (P.m * (v2 - vpar * vpar)) / (2 * Bn)]; });
    const dev = Math.max(...muT.map((x) => Math.abs(x[1] / mu - 1))), zmax = Math.max(...M.map((q) => Math.abs(q[3])));
    const cruces = []; for (let i = 1; i < M.length; i++) if (M[i - 1][3] < 0 && M[i][3] >= 0) cruces.push(M[i - 1][0] + ((M[i][0] - M[i - 1][0]) * -M[i - 1][3]) / (M[i][3] - M[i - 1][3]));
    const TbSim = cruces.length >= 2 ? (cruces[cruces.length - 1] - cruces[0]) / (cruces.length - 1) : null;
    if (P.pre) pasos.unshift({ t: 'Données de la particule', html: datosP(P) });
    pasos.push({ t: 'Le champ', html: `$B(z) = B_0 (1 + z^2/L^2)$ sur l'axe, avec $B_0 = ${f(B0)} "T"$ et $L = ${f(L)} "m"$ ; hors de l'axe apparaît une composante radiale $B_ρ = −{ρ}/{2} {dB}/{dz} = −B_0 {ρ z}/{L^2}$ (ainsi $∇·B = 0$). En $z = ±z_m = ±${f(zm)} "m"$, le champ vaut $R_m B_0 = ${f(Rm * B0)} "T"$, avec $R_m = ${f(Rm)}$ le rapport de miroir.` });
    pasos.push({ t: 'Moment magnétique', html: `Si le champ varie peu sur un tour, $μ = {m v_⊥^2}/{2B}$ est constant, et comme le champ ne travaille pas, $v^2 = v_⊥^2 + v_∥^2$ l'est aussi. Au centre, $v_⊥ = v sin α_0 = ${f(vp)} "m/s"$, $v_∥ = ${f(va)} "m/s"$ et $μ = ${f(mu)} "J/T"$.` });
    pasos.push({ t: 'Point de rebroussement', html: `La particule s'arrête là où $v_∥ = 0$, c'est-à-dire $B(z_t) = B_0/sin^2 α_0$ : ${c0 === 0 ? 'avec α₀ = 90° elle ne progresse pas le long de l’axe.' : `$z_t = L cot α_0 = ${f(zt)} "m"$.`} Elle atteint le bout de la bouteille si $z_t ≥ z_m$.` });
    pasos.push({ t: 'Cône de perte', html: `S'échappe celle qui atteint $z_m$ : $sin^2 α_0 < B_0/B_{max} = 1/R_m$, soit $α_c = arcsen(1/√R_m) = ${f((ac * 180) / Math.PI)}°$. Avec $α_0 = ${f(al)}°$, la particule ${atrapada ? 'reste <b>piégée</b>' : 'se trouve <b>dans le cône de perte</b> et s’échappe'}${run.parada ? ` (la simulation la voit sortir à $t = ${f(run.parada.t)} "s"$)` : ''}.` });
    if (atrapada) pasos.push({ t: 'Période de rebond', html: `$T_b = 4 ∫_0^{z_t} {dz}/{v_∥(z)}$ avec $v_∥ = √{v^2 − v_⊥0^2 B(z)/B_0}$ donne exactement $T_b = {2π L}/{v_⊥0} = ${f(Tb)} "s"$${TbSim ? `; la simulation donne ${f(TbSim)} s` : ''}.` });
    pasos.push({ t: 'Condition de validité', html: `Le rayon de giration $r_L = ${f(rL)} "m"$ vaut ${f(rL / L)} fois $L$ (il faut $r_L ≪ L$). Avec l'intégration, $μ$ varie au plus de ${f(dev * 100)}% le long du parcours.` });
    return { modo: 'espejo', P, v, B0, Rm, L, al, atrapada, ac, zm, vp, va, mu, rL, Tc0, zt, Tb, TbSim, tt, dt, muestras: M, mut: muT, dev, zmax, escapa: !!run.parada, tEscapa: run.parada ? run.parada.t : null, Bz: (z) => B0 * (1 + (z * z) / (L * L)), pasos };
  }

  function selector(sc) {
    const pasos = [], P = particula(sc), E = num(sc, 'E', 'le champ électrique E'), B = num(sc, 'B', 'le champ B du sélecteur'), vs = E / B, aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Données de la particule', html: datosP(P) });
    const v0 = velocidad(sc, P, pasos, true), v = v0 ?? vs;
    pasos.push({ t: 'Vitesse qui passe sans déviation', html: `À l'intérieur du sélecteur, la force électrique (|q|E) et la force magnétique (|q|vB) ont des sens contraires. Elles s'annulent si $|q| E = |q| v B$, c'est-à-dire $v = E/B = ${f(E)}/${f(B)}$ = <b>${f(vs)} m/s</b>, quelle que soit la charge ou la masse.` });
    const FE = aq * E, FB = aq * v * B, rel = (v - vs) / vs;
    let des = 'non', hacia = null;
    if (v0 !== null) {
      if (Math.abs(rel) < 1e-6) pasos.push({ t: 'Cette particule', html: `Avec v = ${f(v)} m/s, F<sub>e</sub> = ${f(FE)} N et F<sub>m</sub> = ${f(FB)} N sont égales : elle passe en ligne droite.` });
      else {
        des = 'si'; hacia = (v > vs) === (P.q > 0) ? 'haut' : 'bas';
        pasos.push({ t: 'Cette particule', html: `Avec v = ${f(v)} m/s, $F_e = |q| E$ = ${f(FE)} N et $F_m = |q| v B$ = ${f(FB)} N. ${v > vs ? 'Sa vitesse est supérieure à celle requise et la force magnétique domine' : 'Sa vitesse est inférieure à celle requise et la force électrique domine'} : elle est déviée vers le <b>${hacia}</b> (la plaque ${hacia === 'haut' ? 'positive' : 'négative'}) et ne sort pas par la fente.` });
      }
    }
    const B2 = num(sc, 'B2', 'le champ B du spectromètre', { opcional: true });
    let r2 = null;
    if (B2 !== null) {
      r2 = (P.m * v) / (aq * B2);
      pasos.push({ t: 'Spectromètre de masse', html: `À la sortie, elle entre dans un champ B′ = ${f(B2)} T sans champ électrique et décrit une demi-circonférence de rayon $r = {m v}/{|q| B′} = {${f(P.m)}·${f(v)}}/{${f(aq)}·${f(B2)}}$ = <b>${f(r2)} m</b>. Elle heurte la plaque à 2r = <b>${f(2 * r2)} m</b> de la fente. Comme v est la même pour toutes celles qui sortent, r est proportionnel à m/q : c'est ainsi que les isotopes sont séparés.` });
    }
    const m2 = num(sc, 'm2', 'la masse du second isotope', { opcional: true });
    let rb = null, sepa = null;
    if (m2 !== null) {
      if (B2 === null) throw new Error('Pour séparer deux isotopes, le champ B′ du spectromètre est nécessaire');
      const mb = m2 * U; rb = (mb * vs) / (aq * B2); sepa = 2 * Math.abs(rb - (P.m * vs) / (aq * B2));
      pasos.push({ t: 'Second isotope', html: `Un isotope de ${f(m2)} u (m′ = ${f(m2)}·${f(U)} = ${f(mb)} kg) de même charge sort du sélecteur avec la même v = ${f(vs)} m/s et décrit $r′ = {m′ v}/{|q| B′}$ = <b>${f(rb)} m</b>. Les impacts sont séparés de $Δx = 2|r′ − r| = {2 v |m′ − m|}/{|q| B′}$ = <b>${f(sepa)} m</b>.` });
    }
    return { modo: 'selector', P, E, B, vs, v, dado: v0 !== null, FE, FB, des, hacia, B2, r2, m2, rb, sepa, pasos };
  }

  function ciclotron(sc) {
    const pasos = [], P = particula(sc), B = num(sc, 'B', 'le champ B'), R = num(sc, 'R', 'le rayon des dees'), V = num(sc, 'V', 'la différence de potentiel', { opcional: true }), aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Données de la particule', html: datosP(P) });
    const fr = (aq * B) / (2 * Math.PI * P.m), vmax = (aq * B * R) / P.m, Ec = 0.5 * P.m * vmax * vmax;
    pasos.push({ t: 'Fréquence de l\'oscillateur', html: `À l'intérieur des dees, la particule fait des demi-tours avec $T = {2π m}/{|q| B}$, qui ne dépend pas du rayon. La tension entre les dees doit changer de signe à cette fréquence : $f = {|q| B}/{2π m} = {${f(aq)}·${f(B)}}/{2π·${f(P.m)}}$ = <b>${f(fr)} Hz</b>` });
    pasos.push({ t: 'Vitesse et énergie à la sortie', html: `Elle sort lorsque son rayon est celui des dees : $R = {m v}/{|q| B} ⇒ v_max = {|q| B R}/m$ = <b>${f(vmax)} m/s</b>${vmax > 0.1 * C ? ' (plus de 10 % de c : le calcul classique n’est plus exact)' : ''}. $E_c = 1/2 m v_max^2 = {q^2 B^2 R^2}/{2m}$ = <b>${f(Ec)} J</b> = ${f(Ec / E0 / 1e6)} MeV` });
    let n = null, t = null;
    if (V !== null) {
      n = Ec / (2 * aq * V); t = n / fr;
      pasos.push({ t: 'Tours', html: `À chaque tour, elle traverse deux fois l'intervalle entre les dees et gagne 2|q|ΔV = ${f(2 * aq * V)} J. Il lui faut $n = {E_c}/{2|q|ΔV}$ = <b>${f(n)} tours</b>, ce qui dure $t = n T$ = <b>${f(t)} s</b>.` });
    }
    return { modo: 'ciclotron', P, B, R, V, fr, T: 1 / fr, vmax, Ec, n, t, pasos };
  }

  function hilo(sc) {
    const I = num(sc, 'I', 'le courant I'), L = num(sc, 'L', 'la longueur L'), B = num(sc, 'B', 'le champ B'), th = num(sc, 'th', 'l\'angle entre le fil et B', { cero: true, def: 90 }), m = num(sc, 'm', 'la masse', { opcional: true });
    if (th > 180) throw new Error('L\'angle entre le fil et B doit être compris entre 0° et 180°');
    const s = Math.abs(Math.sin((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.sin((th * Math.PI) / 180), F = I * L * B * s;
    const arriba = (sc.sentidoI !== 'izquierda') === (sc.sentidoB !== 'saliente'), pasos = [];
    pasos.push({ t: 'Force sur le fil', html: `$F = I L B sin θ = ${f(I)}·${f(L)}·${f(B)}${th === 90 ? '' : `·sen ${f(th)}°`}$ = <b>${f(F)} N</b> (${f(F / L)} N par mètre). C'est $F = I L × B$, avec L dans le sens du courant.` });
    if (s) pasos.push({ t: 'Sens', html: `Avec le courant vers la ${sc.sentidoI === 'izquierda' ? 'gauche' : 'droite'} et B ${sc.sentidoB === 'saliente' ? 'sortant (⊙)' : 'entrant (⊗)'}, L × B pointe vers le <b>${arriba ? 'haut' : 'bas'}</b> (règle de la main droite : les doigts de L vers B, le pouce donne F).` });
    else pasos.push({ t: 'Sens', html: 'Le fil est parallèle au champ : il n\'y a pas de force.' });
    let Iflota = null;
    if (m !== null) {
      const P = m * G;
      if (!s) pasos.push({ t: 'Pour qu\'il flotte', html: 'Parallèlement au champ, il n\'y a pas de force magnétique pour équilibrer le poids.' });
      else { Iflota = P / (L * B * s); pasos.push({ t: 'Pour qu\'il flotte', html: `Le poids est $m g = ${f(m)}·9,8$ = ${f(P)} N. La force magnétique doit lui être égale et dirigée vers le haut : $I = {m g}/{L B sin θ}$ = <b>${f(Iflota)} A</b>${arriba ? '' : ', avec le courant inversé (il pousse maintenant vers le bas)'}. ${F >= P - 1e-12 ? (arriba ? `Avec ${f(I)} A, le fil monte.` : '') : `${f(I)} A ne suffisent pas.`}` }); }
    }
    return { modo: 'hilo', I, L, B, th, F, arriba: s ? arriba : null, m, Iflota, sentidoB: sc.sentidoB, sentidoI: sc.sentidoI, pasos };
  }

  function paralelos(sc) {
    const I1 = num(sc, 'I1', 'le courant I₁'), I2 = num(sc, 'I2', 'le courant I₂'), d = num(sc, 'd', 'la distance d'), L = num(sc, 'L', 'la longueur L', { opcional: true }), mismo = sc.sentido !== 'opuesto';
    const B1 = (MU0 * I1) / (2 * Math.PI * d), B2 = (MU0 * I2) / (2 * Math.PI * d), FL = B1 * I2, F = L !== null ? FL * L : null, pasos = [];
    pasos.push({ t: 'Champ d\'un fil sur l\'autre', html: `Le fil 1 crée au niveau du fil 2 un champ $B_1 = {μ_0 I_1}/{2π d} = {4π·10^{−7}·${f(I1)}}/{2π·${f(d)}}$ = <b>${f(B1)} T</b>, perpendiculaire au fil 2 (et le 2 crée au niveau du 1 B<sub>2</sub> = ${f(B2)} T).` });
    pasos.push({ t: 'Force par unité de longueur', html: `$F/L = I_2 B_1 = {μ_0 I_1 I_2}/{2π d}$ = <b>${f(FL)} N/m</b>, la même sur chaque fil (action et réaction).${F !== null ? ` Sur ${f(L)} m : F = <b>${f(F)} N</b>.` : ''}` });
    pasos.push({ t: 'Sens', html: mismo ? 'Les courants circulent dans le même sens : les fils <b>s\'attirent</b>.' : 'Les courants circulent en sens contraires : les fils <b>se repoussent</b>.' });
    return { modo: 'paralelos', I1, I2, d, L, B1, B2, FL, F, mismo, pasos };
  }

  function franja(sc) {
    const pasos = [], P = particula(sc), v = velocidad(sc, P, pasos), B = num(sc, 'B', 'le champ B'), d = num(sc, 'd', 'la largeur d de la bande'), aq = Math.abs(P.q);
    if (P.pre) pasos.unshift({ t: 'Données de la particule', html: datosP(P) });
    const r = (P.m * v) / (aq * B), w = (aq * B) / P.m, T = (2 * Math.PI) / w, gi = giro(P.q, sc.sentidoB), hacia = gi === 'antihoraire' ? 'haut' : 'bas';
    pasos.push({ t: 'Rayon dans le champ', html: `Dans la bande, elle décrit un arc de cercle de rayon $r = {m v}/{|q| B} = {${f(P.m)}·${f(v)}}/{${f(aq)}·${f(B)}}$ = <b>${f(r)} m</b>, qui se courbe vers le <b>${hacia}</b> (F = q v × B avec B ${sc.sentidoB === 'saliente' ? 'sortant' : 'entrant'} et la charge ${P.q > 0 ? 'positive' : 'négative'}).` });
    if (r > d) {
      const a = Math.asin(d / r), y = r * (1 - Math.cos(a)), t = a / w;
      pasos.push({ t: 'Elle sort de l\'autre côté', html: `Comme r > d, elle la traverse. Le centre de l'arc est sur le bord d'entrée, donc à la sortie $sin α = d/r = ${f(d)}/${f(r)}$ = ${f(d / r)} et la vitesse a été déviée de <b>α = ${f((a * 180) / Math.PI)}°</b>.` });
      pasos.push({ t: 'Déplacement et temps', html: `Elle sort ${hacia === 'haut' ? 'au-dessus' : 'au-dessous'} de son point d'entrée, à $y = r (1 − cos α)$ = <b>${f(y)} m</b>, et met $t = α/ω = {α m}/{|q| B}$ = <b>${f(t)} s</b> pour traverser. Avec la même vitesse scalaire : le champ ne change pas le module de v.` });
      return { modo: 'franja', P, v, B, d, r, T, cruza: true, alfa: (a * 180) / Math.PI, y, t, hacia, sentidoB: sc.sentidoB, pasos };
    }
    pasos.push({ t: 'Elle revient en arrière', html: `Comme r ≤ d, elle n'atteint pas l'autre bord : elle décrit une demi-circonférence et ressort par le même bord, en sens contraire, à 2r = <b>${f(2 * r)} m</b> ${hacia === 'haut' ? 'au-dessus' : 'au-dessous'} du point d'entrée. Elle met une demi-période, $t = {π m}/{|q| B}$ = <b>${f(T / 2)} s</b>, et arrive à ${f(r)} m du bord.` });
    return { modo: 'franja', P, v, B, d, r, T, cruza: false, alfa: 180, y: 2 * r, t: T / 2, hacia, sentidoB: sc.sentidoB, pasos };
  }

  function cruzados(sc) {
    const pasos = [], P = particula(sc), E = num(sc, 'E', 'le champ électrique E'), B = num(sc, 'B', 'le champ B'), v0 = num(sc, 'v0', 'la vitesse initiale', { signo: true, def: 0 }), aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Données de la particule', html: datosP(P) });
    const vd = E / B, w = (aq * B) / P.m, T = (2 * Math.PI) / w, u = v0 - vd, R = Math.abs(u) / w, sube = u * P.q < 0;
    pasos.push({ t: 'Vitesse de dérive', html: `Avec E ⊥ B, si la particule allait à $v_d = E/B$, les forces électrique et magnétique s'annuleraient. Il convient donc de l'observer depuis un référentiel qui avance à $v_d = ${f(E)}/${f(B)}$ = <b>${f(vd)} m/s</b>, dans le sens de E × B (vers la droite), quel que soit le signe de la charge.` });
    if (Math.abs(u) < 1e-9 * vd) {
      pasos.push({ t: 'Mouvement', html: `Sa vitesse initiale est exactement E/B : les deux forces s'annulent et elle continue en ligne droite (c'est le sélecteur de vitesses).` });
      return { modo: 'cruzados', P, E, B, v0, vd, w, T, u: 0, R: 0, h: 0, vmax: vd, avance: vd * T, sube, pasos };
    }
    pasos.push({ t: 'Dans le référentiel qui avance', html: `Là, la particule a la vitesse $u = v_0 − v_d$ = ${f(u)} m/s et ne ressent que le champ B : elle tourne sur un cercle de rayon $R = {m |u|}/{|q| B}$ = <b>${f(R)} m</b> avec $ω = {|q| B}/m$ = ${f(w)} rad/s et période T = <b>${f(T)} s</b>.` });
    const h = 2 * R, vmax = vd + Math.abs(u), avance = vd * T;
    pasos.push({ t: 'Trajectoire', html: `En ajoutant l'avance, ${Math.abs(Math.abs(u) - vd) < 1e-9 * vd ? `${v0 === 0 ? 'part du repos et ' : ''}décrit une <b>cycloïde</b> (avec des points de rebroussement où elle s'arrête)` : Math.abs(u) > vd ? 'décrit une <b>trochoïde à boucles</b> (par moments elle recule)' : 'décrit une <b>cycloïde raccourcie</b>, ondulée, sans arrêt'} : $x(t) = v_d t + u/ω sin(ω t)$, $y(t) = u/ω (cos(ω t) − 1)$, avec ω = qB/m avec son signe. Elle s'écarte au plus de $h = 2R$ = <b>${f(h)} m</b> ${sube ? 'vers le haut' : 'vers le bas'} de la droite initiale, avance de ${f(avance)} m à chaque période et sa vitesse maximale est $v_d + |u|$ = <b>${f(vmax)} m/s</b>.` });
    if (v0 === 0) pasos.push({ t: 'Vérification avec l\'énergie', html: `Au point le plus haut, elle a gagné $E_c = |q| E h = ${f(aq)}·${f(E)}·${f(h)}$ = ${f(aq * E * h)} J, et $1/2 m (2E/B)^2$ = ${f(0.5 * P.m * vmax * vmax)} J : la même valeur, car B ne travaille pas.` });
    return { modo: 'cruzados', P, E, B, v0, vd, w, T, u, R, h, vmax, avance, sube, pasos };
  }

  function hall(sc) {
    const pasos = [], I = num(sc, 'I', 'le courant I'), B = num(sc, 'B', 'le champ B'), t = num(sc, 't', 'l\'épaisseur t'), w = num(sc, 'w', 'la largeur', { opcional: true }), e = sc.portador === 'huecos';
    let n, VH;
    if (sc.dato === 'VH') { VH = num(sc, 'VH', 'la tension de Hall'); n = (I * B) / (E0 * t * VH); pasos.push({ t: 'Densité de porteurs', html: `De $V_H = {I B}/{n e t}$ on tire $n = {I B}/{e t V_H} = {${f(I)}·${f(B)}}/{${f(E0)}·${f(t)}·${f(VH)}}$ = <b>${f(n)} m<sup>−3</sup></b>.` }); }
    else { n = num(sc, 'n', 'la densité de porteurs n'); VH = (I * B) / (n * E0 * t); pasos.push({ t: 'Tension de Hall', html: `À l'équilibre, la force électrique du champ de Hall annule la force magnétique : $e E_H = e v_d B$. Avec $I = n e v_d w t$ et $V_H = E_H w$, il vient $V_H = {I B}/{n e t} = {${f(I)}·${f(B)}}/{${f(n)}·${f(E0)}·${f(t)}}$ = <b>${f(VH)} V</b>. Elle ne dépend pas de la largeur.` }); }
    const RH = (e ? 1 : -1) / (n * E0);
    pasos.push({ t: 'Coefficient de Hall', html: `$R_H = 1/{n q}$ = <b>${f(RH)} m<sup>3</sup>/C</b>, ${e ? 'positif car les porteurs sont des trous' : 'négatif car les porteurs sont des électrons'}.` });
    let vd = null, EH = null;
    if (w !== null) { vd = I / (n * E0 * w * t); EH = VH / w; pasos.push({ t: 'Vitesse de dérive et champ de Hall', html: `$v_d = I/{n e w t}$ = <b>${f(vd)} m/s</b> y $E_H = {V_H}/w = v_d B$ = <b>${f(EH)} V/m</b>.` }); }
    const arriba = sc.sentidoB !== 'saliente', alta = (e === arriba) ? 'du haut' : 'du bas';
    pasos.push({ t: 'Quelle face est au potentiel le plus élevé', html: `Avec le courant vers la droite et B ${arriba ? 'entrant (⊗)' : 'sortant (⊙)'}, F = q v × B pousse les porteurs vers ${arriba ? 'le haut' : 'le bas'}, qu'ils soient des électrons (q < 0 et v vers la gauche) ou des trous. Ils s'y accumulent : ${e ? 'les trous rendent positive' : 'les électrons rendent négative'} cette face, et la face <b>${alta}</b> est au potentiel le plus élevé. C'est ainsi que l'on connaît le signe des porteurs.` });
    return { modo: 'hall', I, B, t, w, n, VH, RH, vd, EH, huecos: e, arriba, alta, sentidoB: sc.sentidoB, pasos };
  }

  function espira(sc) {
    const pasos = [], N = num(sc, 'N', 'le nombre de spires N', { def: 1 }), I = num(sc, 'I', 'le courant I'), B = num(sc, 'B', 'le champ B'), th = num(sc, 'th', 'l\'angle entre la normale et B', { cero: true, def: 90 }), circ = sc.forma === 'circ';
    if (th > 180) throw new Error('L\'angle entre la normale et B doit être compris entre 0° et 180°');
    let S, a, b, R;
    if (circ) { R = num(sc, 'R', 'le rayon R'); S = Math.PI * R * R; }
    else { a = num(sc, 'a', 'le côté a'); b = num(sc, 'b', 'le côté b'); S = a * b; }
    const rad = (th * Math.PI) / 180, s = Math.abs(Math.sin(rad)) < 1e-12 ? 0 : Math.sin(rad), c = Math.abs(Math.cos(rad)) < 1e-12 ? 0 : Math.cos(rad), m = N * I * S, tau = m * B * s, Ue = -m * B * c, W = m * B * (1 - c);
    pasos.push({ t: 'Moment magnétique', html: `$S = ${circ ? `π R^2 = π·${f(R)}^2` : `a b = ${f(a)}·${f(b)}`}$ = ${f(S)} m<sup>2</sup> et $m = N I S = ${f(N)}·${f(I)}·${f(S)}$ = <b>${f(m)} A·m<sup>2</sup></b>, perpendiculaire à la spire (règle de la main droite avec le courant).` });
    if (!circ) pasos.push({ t: 'Forces sur les côtés', html: `Les côtés a (perpendiculaires à B) subissent $F = N I a B$ = ${f(N * I * a * B)} N, égales et opposées : elles ne déplacent pas la spire, mais forment un couple de bras b sen θ. Celles des côtés b s'annulent sur la même droite.` });
    pasos.push({ t: 'Couple', html: `$τ = m × B$, $|τ| = m B sin θ = N I S B sin θ = ${f(m)}·${f(B)}${th === 90 ? '' : `·sen ${f(th)}°`}$ = <b>${f(tau)} N·m</b>. ${s ? 'Elle tend à faire tourner la spire pour mettre m parallèle à B.' : 'Il est nul : m est parallèle (ou antiparallèle) à B.'} Le couple maximal, avec la normale perpendiculaire à B, est de ${f(m * B)} N·m.` });
    pasos.push({ t: 'Énergie', html: `$U = −m · B = −m B cos θ$ = <b>${f(Ue)} J</b>. L'équilibre stable est θ = 0° (U = −mB) et l'équilibre instable θ = 180°. Pour l'amener de θ = 0° à ${f(th)}°, il faut fournir le travail $W = m B (1 − cos θ)$ = <b>${f(W)} J</b>.` });
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
    { clave: 'proton', nombre: 'Proton qui entre perpendiculairement à B', sc: { modo: 'carga', part: 'proton', ...P0, uv: 'ms', v: '2e6', B: '0,5', th: '90', sentidoB: 'entrante' } },
    { clave: 'electron', nombre: 'Électron accéléré par 1000 V', sc: { modo: 'carga', part: 'electron', ...P0, uv: 'V', v: '1000', B: '0,01', th: '90', sentidoB: 'saliente' } },
    { clave: 'helice', nombre: 'Proton à 60° du champ : hélice', sc: { modo: 'carga', part: 'proton', ...P0, uv: 'ms', v: '5e5', B: '0,2', th: '60', sentidoB: 'entrante' } },
    { clave: 'alfa', nombre: 'Particule α de 5 MeV', sc: { modo: 'carga', part: 'alfa', ...P0, uv: 'eV', v: '5e6', B: '1', th: '90', sentidoB: 'entrante' } },
    { clave: 'vec-proton', nombre: 'F = q v × B d\'un proton', sc: { modo: 'vectorial', part: 'proton', ...P0, vx: '2e5', vy: '3e5', vz: '0', Bx: '0', By: '0', Bz: '0,5', Ex: '', Ey: '', Ez: '' } },
    { clave: 'vec-electron', nombre: 'Électron avec B dans deux directions', sc: { modo: 'vectorial', part: 'electron', ...P0, vx: '1e6', vy: '0', vz: '0', Bx: '0', By: '0,2', Bz: '0,3', Ex: '', Ey: '', Ez: '' } },
    { clave: 'vec-lorentz', nombre: 'Force de Lorentz avec E et B', sc: { modo: 'vectorial', part: 'otra', q: '2e-6', m: '1e-9', vx: '0', vy: '400', vz: '0', Bx: '0,1', By: '0', Bz: '0', Ex: '0', Ey: '0', Ez: '50' } },
    { clave: 'tray-helice', nombre: 'Proton avec E et B parallèles : hélice qui accélère (FU-1)', sc: { modo: 'trayectoria', part: 'proton', ...P0, vx: '1e5', vy: '0', vz: '1e5', Bx: '0', By: '0', Bz: '0,1', Ex: '0', Ey: '0', Ez: '50', tt: '' } },
    { clave: 'tray-deriva', nombre: 'Électron avec E et B croisés et inclinés : dérive (FU-1)', sc: { modo: 'trayectoria', part: 'electron', ...P0, vx: '2e5', vy: '0', vz: '1e5', Bx: '0', By: '0', Bz: '0,01', Ex: '300', Ey: '0', Ez: '0', tt: '' } },
    { clave: 'tray-general', nombre: 'Particule avec B et E dans des directions quelconques (FU-1)', sc: { modo: 'trayectoria', part: 'alfa', ...P0, vx: '1e5', vy: '2e5', vz: '5e4', Bx: '0,05', By: '0,02', Bz: '0,1', Ex: '200', Ey: '-100', Ez: '300', tt: '' } },
    { clave: 'espejo-atrapada', nombre: 'Électron piégé dans une bouteille magnétique (FU-3)', sc: { modo: 'espejo', part: 'electron', ...P0, uv: 'eV', v: '100', B0: '0,01', Rm: '4', L: '0,5', al: '45' } },
    { clave: 'espejo-escapa', nombre: 'Électron qui s\'échappe par le cône de perte (FU-3)', sc: { modo: 'espejo', part: 'electron', ...P0, uv: 'eV', v: '100', B0: '0,01', Rm: '4', L: '0,5', al: '20' } },
    { clave: 'selector', nombre: 'Sélecteur de vitesses et spectromètre', sc: { modo: 'selector', part: 'proton', ...P0, uv: 'ms', v: '', E: '1e5', B: '0,2', B2: '0,5' } },
    { clave: 'isotopos', nombre: 'Spectromètre : séparation de deux isotopes', sc: { modo: 'selector', part: 'otra', q: '1,602e-19', m: '1,993e-26', uv: 'ms', v: '', E: '4e4', B: '0,1', B2: '0,5', m2: '13' } },
    { clave: 'selector-rapido', nombre: 'Électron trop rapide dans le sélecteur', sc: { modo: 'selector', part: 'electron', ...P0, uv: 'ms', v: '3e6', E: '2e4', B: '0,01', B2: '' } },
    { clave: 'ciclotron', nombre: 'Cyclotron de protons', sc: { modo: 'ciclotron', part: 'proton', ...P0, B: '1,5', R: '0,5', V: '5e4' } },
    { clave: 'ciclotron-d', nombre: 'Cyclotron de deutérons', sc: { modo: 'ciclotron', part: 'deuteron', ...P0, B: '1', R: '0,6', V: '1e4' } },
    { clave: 'franja-cruza', nombre: 'Proton qui traverse une bande de champ', sc: { modo: 'franja', part: 'proton', ...P0, uv: 'ms', v: '1e6', B: '0,2', sentidoB: 'entrante', d: '0,03' } },
    { clave: 'franja-vuelve', nombre: 'Électron qui ne parvient pas à traverser la bande', sc: { modo: 'franja', part: 'electron', ...P0, uv: 'eV', v: '500', B: '0,002', sentidoB: 'entrante', d: '0,05' } },
    { clave: 'cicloide', nombre: 'Proton au repos dans E et B croisés : cycloïde', sc: { modo: 'cruzados', part: 'proton', ...P0, E: '1000', B: '0,01', v0: '' } },
    { clave: 'trocoide', nombre: 'Électron avec vitesse initiale dans E et B croisés', sc: { modo: 'cruzados', part: 'electron', ...P0, E: '2000', B: '0,001', v0: '5e6' } },
    { clave: 'hall-cobre', nombre: 'Tension de Hall dans une plaque de cuivre', sc: { modo: 'hall', portador: 'electrones', I: '20', B: '1,5', sentidoB: 'entrante', t: '1e-4', w: '0,02', dato: 'n', n: '8,5e28', VH: '' } },
    { clave: 'hall-semi', nombre: 'Densité de trous d\'un semi-conducteur', sc: { modo: 'hall', portador: 'huecos', I: '0,01', B: '0,5', sentidoB: 'entrante', t: '1e-3', w: '5e-3', dato: 'VH', n: '', VH: '3e-3' } },
    { clave: 'espira-rect', nombre: 'Couple sur une bobine rectangulaire', sc: { modo: 'espira', N: '50', I: '2', forma: 'rect', a: '0,1', b: '0,05', R: '', B: '0,4', th: '30' } },
    { clave: 'espira-circ', nombre: 'Spire circulaire avec la normale perpendiculaire à B', sc: { modo: 'espira', N: '1', I: '5', forma: 'circ', a: '', b: '', R: '0,1', B: '0,2', th: '90' } },
    { clave: 'hilo', nombre: 'Fil parcouru par un courant dans un champ', sc: { modo: 'hilo', I: '5', L: '0,5', B: '0,4', th: '90', sentidoB: 'entrante', sentidoI: 'derecha', m: '' } },
    { clave: 'hilo-flota', nombre: 'Courant pour qu\'un fil flotte', sc: { modo: 'hilo', I: '2', L: '0,2', B: '0,5', th: '90', sentidoB: 'saliente', sentidoI: 'izquierda', m: '0,01' } },
    { clave: 'paralelos', nombre: 'Deux fils avec des courants de même sens', sc: { modo: 'paralelos', I1: '10', I2: '5', d: '0,1', L: '1', sentido: 'mismo' } },
    { clave: 'antiparalelos', nombre: 'Deux fils avec des courants opposés', sc: { modo: 'paralelos', I1: '20', I2: '20', d: '0,05', L: '', sentido: 'opuesto' } },
  ];

  return { resolver, rk4, carga, vectorial, trayectoria, espejo, selector, ciclotron, franja, cruzados, hall, espira, hilo, paralelos, ejemplos, f, PART, E0, U, MU0 };
})();

