const Fuerza = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-−]?\d+)\)?/i, (_, e) => `e${e.replace('−', '-')}`);
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function num(sc, k, nom, { opcional = false, signo = false, cero = false, def = null } = {}) {
    if (vacio(sc[k])) { if (def !== null) return def; if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} must be a number`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${may(nom)} must be ${cero ? 'positive or 0' : 'greater than 0'}`);
    return v;
  }
  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const E0 = SI.e, U = 1.66053907e-27, C = SI.c, MU0 = 4 * Math.PI * 1e-7, G = 9.8;
  const PART = {
    proton: { nom: 'proton', art: 'the', q: E0, m: 1.67262192e-27 },
    electron: { nom: 'electron', art: 'the', q: -E0, m: 9.1093837e-31 },
    alfa: { nom: 'α particle', art: 'the', q: 2 * E0, m: 6.6446573e-27 },
    deuteron: { nom: 'deuteron', art: 'the', q: E0, m: 3.3435838e-27 },
  };
  function particula(sc, conM = true) {
    const p = PART[sc.part];
    if (p) return { ...p, pre: true };
    const q = num(sc, 'q', 'the charge q', { signo: true });
    if (q === 0) throw new Error('With charge 0 there is no magnetic force');
    return { nom: 'particle', q, m: conM ? num(sc, 'm', 'the mass m') : num(sc, 'm', 'the mass m', { opcional: true }), pre: false };
  }
  const datosP = (P) => (P.pre ? `For ${P.art} ${P.nom}, q = ${f(P.q)} C and m = ${f(P.m)} kg.` : '');
  function velocidad(sc, P, pasos, opcional = false) {
    const uv = sc.uv || 'ms';
    const x = num(sc, 'v', uv === 'ms' ? 'the speed' : uv === 'eV' ? 'the kinetic energy' : 'the potential difference', { opcional });
    if (x === null) return null;
    if (uv === 'ms') return x;
    const Ec = uv === 'eV' ? x * E0 : Math.abs(P.q) * x, v = Math.sqrt((2 * Ec) / P.m);
    pasos.push({ t: 'Velocity', html: `${uv === 'eV' ? `E<sub>c</sub> = ${f(x)} eV = ${f(x)}·${f(E0)} = ${f(Ec)} J` : `Accelerated from rest through a potential difference of ${f(x)} V it gains $E_c = |q| ΔV = ${f(Math.abs(P.q))}·${f(x)}$ = ${f(Ec)} J`}, so $v = √({2E_c}/m) = √({2·${f(Ec)}}/{${f(P.m)}})$ = <b>${f(v)} m/s</b>${v > 0.1 * C ? `. It is more than 10 % of the speed of light: the classical result is no longer exact (relativity would be needed).` : ''}` });
    return v;
  }
  const giro = (q, sentidoB) => ((q > 0) === (sentidoB === 'entrante') ? 'anticlockwise' : 'clockwise');

  function carga(sc) {
    const pasos = [], P = particula(sc), v = velocidad(sc, P, pasos), B = num(sc, 'B', 'the B field'), th = num(sc, 'th', 'the angle between v and B', { cero: true, def: 90 });
    if (th > 180) throw new Error('The angle between v and B must be between 0° and 180°');
    const s = Math.abs(Math.sin((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.sin((th * Math.PI) / 180), c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180);
    const aq = Math.abs(P.q), F = aq * v * B * s, vp = v * s, va = v * c, w = (aq * B) / P.m, T = (2 * Math.PI) / w, r = vp / w, paso = va * T, Ec = 0.5 * P.m * v * v;
    if (P.pre) pasos.unshift({ t: 'Particle data', html: datosP(P) });
    pasos.push({ t: 'Lorentz force', html: `$F = |q| v B sin θ = ${f(aq)}·${f(v)}·${f(B)}${th === 90 ? '' : `·sin ${f(th)}°`}$ = <b>${f(F)} N</b>. It is perpendicular to v and B, so it does no work: the magnitude of the velocity and the kinetic energy (${f(Ec)} J = ${f(Ec / E0)} eV) do not change.` });
    if (s === 0) {
      pasos.push({ t: 'Motion', html: 'The velocity is parallel to the field: there is no magnetic force and the particle continues in a straight line at constant velocity.' });
      return { modo: 'carga', P, v, B, th, F: 0, r: Infinity, T, f: 1 / T, w, paso: Infinity, va, vp: 0, Ec, giro: null, sentidoB: sc.sentidoB, pasos };
    }
    pasos.push({ t: 'Radius of the path', html: `The magnetic force acts as the centripetal force: $|q| v${th === 90 ? '' : '_⊥'} B = {m v${th === 90 ? '' : '_⊥'}^2}/r$, ${th === 90 ? '' : `with $v_⊥ = v sin θ$ = ${f(vp)} m/s, `}hence $r = {m v${th === 90 ? '' : '_⊥'}}/{|q| B} = {${f(P.m)}·${f(vp)}}/{${f(aq)}·${f(B)}}$ = <b>${f(r)} m</b>` });
    pasos.push({ t: 'Period and frequency', html: `$T = {2π r}/{v${th === 90 ? '' : '_⊥'}} = {2π m}/{|q| B}$ = <b>${f(T)} s</b>; $f = 1/T$ = <b>${f(1 / T)} Hz</b> and $ω = {|q| B}/m$ = ${f(w)} rad/s. They do not depend on the velocity (the cyclotron is based on this).` });
    const gi = giro(P.q, th === 90 ? sc.sentidoB : 'entrante');
    if (th !== 90) pasos.push({ t: 'Helix', html: `The component parallel to B, $v_∥ = v cos θ$ = ${f(va)} m/s, does not change: the particle advances along the field while rotating, and describes a helix of radius ${f(r)} m and pitch $p = v_∥ T = ${f(Math.abs(va))}·${f(T)}$ = <b>${f(Math.abs(paso))} m</b>.` });
    pasos.push({ t: 'Direction of rotation', html: th === 90 ? `With B ${sc.sentidoB === 'saliente' ? 'outgoing (⊙)' : 'incoming (⊗)'} and the charge ${P.q > 0 ? 'positive' : 'negative'}, F = q v × B points toward the centre and the particle rotates <b>${gi}</b> on the screen.` : `Looking along the direction of B, a ${P.q > 0 ? 'positive charge rotates anticlockwise' : 'negative charge rotates clockwise'} (F = q v × B).` });
    return { modo: 'carga', P, v, B, th, F, r, T, f: 1 / T, w, paso: Math.abs(paso), va, vp, Ec, giro: gi, sentidoB: sc.sentidoB, pasos };
  }

  const comp = (sc, p, nom, opcional = false) => ['x', 'y', 'z'].map((e) => num(sc, p + e, `the ${e} component of ${nom}`, { signo: true, def: opcional || !vacio(sc[p + 'x']) || !vacio(sc[p + 'y']) || !vacio(sc[p + 'z']) ? 0 : null }));
  const ijk = (u, un) => { const t = u.map((x, i) => (Math.abs(x) < 1e-300 ? '' : `${x < 0 ? '−' : '+'} ${f(Math.abs(x))} <i class="uv">${'ijk'[i]}</i>`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−'); return t ? `(${t}) ${un}` : `0 ${un}`; };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]].map((x) => (Math.abs(x) < 1e-300 ? 0 : x));
  const mod = (u) => Math.hypot(...u);
  function vectorial(sc) {
    const pasos = [], P = particula(sc, false), v = comp(sc, 'v', 'v'), B = comp(sc, 'B', 'B'), hayE = ['x', 'y', 'z'].some((e) => !vacio(sc['E' + e])), E = hayE ? comp(sc, 'E', 'E', true) : [0, 0, 0];
    if (mod(B) === 0 && !hayE) throw new Error('Type at least one component of B');
    if (P.pre) pasos.push({ t: 'Particle data', html: datosP(P) });
    const vB = cruz(v, B), Fm = vB.map((x) => P.q * x), Fe = E.map((x) => P.q * x), F = Fm.map((x, i) => x + Fe[i]);
    const det = `<span class="det"><table><tr><td><i class="uv">i</i></td><td><i class="uv">j</i></td><td><i class="uv">k</i></td></tr><tr>${v.map((x) => `<td>${f(x)}</td>`).join('')}</tr><tr>${B.map((x) => `<td>${f(x)}</td>`).join('')}</tr></table></span>`;
    pasos.push({ t: 'Cross product', html: `v × B = ${det} = ${ijk(vB, 'T·m/s')}<br>Each component is a 2×2 determinant: $(v_y B_z − v_z B_y, v_z B_x − v_x B_z, v_x B_y − v_y B_x)$.` });
    pasos.push({ t: 'Magnetic force', html: `$F_m = q (v × B)$ = ${f(P.q)}·${ijk(vB, '')} = <b>${ijk(Fm, 'N')}</b>, of magnitude |F<sub>m</sub>| = ${f(mod(Fm))} N.` });
    const cv = mod(v) && mod(B) ? (v[0] * B[0] + v[1] * B[1] + v[2] * B[2]) / (mod(v) * mod(B)) : 1, ang = (Math.acos(Math.max(-1, Math.min(1, cv))) * 180) / Math.PI;
    if (mod(v) && mod(B)) pasos.push({ t: 'Check', html: `The angle between v and B is ${f(ang)}°, and $|q| v B sin θ$ = ${f(Math.abs(P.q) * mod(v) * mod(B) * Math.sin((ang * Math.PI) / 180))} N, the same. F<sub>m</sub> is perpendicular to v ($F_m · v = 0$) and to B.` });
    if (hayE) {
      pasos.push({ t: 'Electric force', html: `$F_e = q E$ = ${f(P.q)}·${ijk(E, 'V/m')} = ${ijk(Fe, 'N')}` });
      pasos.push({ t: 'Lorentz force', html: `$F = q (E + v × B)$ = <b>${ijk(F, 'N')}</b>, of magnitude <b>${f(mod(F))} N</b>.` });
    }
    let a = null;
    if (P.m) { a = F.map((x) => x / P.m); pasos.push({ t: 'Acceleration', html: `$a = F/m$ = ${ijk(a, 'm/s<sup>2</sup>')}, of magnitude ${f(mod(a))} m/s<sup>2</sup>.` }); }
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
    if (!Bm && !hayE) throw new Error('Type at least one component of B or E');
    if (!mod(v0) && !mod(E)) throw new Error('With no initial velocity and no electric field the particle does not move');
    const aq = Math.abs(P.q), b = Bm ? B.map((x) => x / Bm) : [0, 0, 1], Epar = dot(E, b), Eperp = E.map((x, i) => x - Epar * b[i]);
    const vd = Bm ? cruz(Eperp, B).map((x) => x / (Bm * Bm)) : [0, 0, 0], vpar = dot(v0, b), vperp = v0.map((x, i) => x - vpar * b[i] - vd[i]), vpm = mod(vperp);
    const w = Bm ? (aq * Bm) / P.m : 0, Tc = Bm ? (2 * Math.PI) / w : Infinity, rL = Bm ? (P.m * vpm) / (aq * Bm) : Infinity, apar = (P.q * Epar) / P.m;
    if (Bm && mod(vd) >= C) throw new Error('E/B cannot be equal to or greater than c: the non-relativistic model is not valid');
    const tt = vacio(sc.tt) ? (Bm ? 5 * Tc : null) : num(sc, 'tt', 'the integration time');
    if (tt === null) throw new Error('Without B the integration time must be typed');
    const dt = Bm ? Math.min(Tc / 400, tt / 200) : tt / 400;
    if (tt / dt > 400000) throw new Error('Too many integration steps: reduce the time');
    const run = rk4(P, () => E, () => B, [0, 0, 0], v0, tt, dt), M = run.m, ult = M[M.length - 1], KE = (r) => 0.5 * P.m * (r[4] * r[4] + r[5] * r[5] + r[6] * r[6]);
    const KE0 = KE(M[0]), KE1 = KE(ult), WE = P.q * dot(E, [ult[1], ult[2], ult[3]]);
    if (P.pre) pasos.push({ t: 'Particle data', html: datosP(P) });
    pasos.push({ t: 'Equation of motion', html: `$m {dv}/{dt} = q (E + v × B)$ with $E = ${ijk(E, 'V/m')}$ and $B = ${ijk(B, 'T')}$. It has no closed-form solution in general, so it is integrated with fourth-order Runge-Kutta with ${Math.round(tt / dt)} steps of $${f(dt)} "s"$ up to $t = ${f(tt)} "s"$.` });
    if (Bm) pasos.push({ t: 'Rotation around B', html: `$ω_c = {|q| B}/m = ${f(w)} "rad/s"$, period $T_c = 2π/ω_c = ${f(Tc)} "s"$ and, in the frame moving with the drift, radius $r_L = {m v_⊥}/{|q| B} = ${f(rL)} "m"$ with $v_⊥ = ${f(vpm)} "m/s"$ (the velocity perpendicular to B minus the drift).` });
    if (hayE && Bm) pasos.push({ t: 'E × B drift', html: `The part of E perpendicular to B, $E_⊥ = ${ijk(Eperp, 'V/m')}$, makes the particle drift, whatever its charge, with $v_d = {E × B}/{B^2} = ${ijk(vd, 'm/s')}$ (magnitude ${f(mod(vd))} m/s).` });
    if (hayE) pasos.push({ t: 'Acceleration along B', html: Bm ? `The parallel part, $E_∥ = ${f(Epar)} "V/m"$, accelerates the particle along the field: $a_∥ = {q E_∥}/m = ${f(apar)} "m/s"^2$, and $v_∥ = ${f(vpar)} + a_∥ t$.` : `Without B the acceleration is $a = qE/m = ${ijk(E.map((x) => (P.q * x) / P.m), 'm/s²')}$.` });
    pasos.push({ t: 'Energy', html: `The magnetic field does no work; the electric one does: $ΔE_c = q E·Δr = ${f(WE)} "J"$. With the integration, $E_c$ goes from ${f(KE0)} J to ${f(KE1)} J (${f(KE1 - KE0)} J).` });
    return { modo: 'trayectoria', P, v0, B, E, hayE, Bm, w, Tc, rL, vd, vpar, vpm, apar, tt, dt, muestras: M, KE0, KE1, WE, rf: [ult[1], ult[2], ult[3]], vf: [ult[4], ult[5], ult[6]], Kmax: Math.max(...M.map(KE)), pasos };
  }

  function espejo(sc) {
    const pasos = [], P = particula(sc, true), v = velocidad(sc, P, pasos), B0 = num(sc, 'B0', 'the field B₀ at the centre'), Rm = num(sc, 'Rm', 'the mirror ratio Bmax/B₀'), L = num(sc, 'L', 'the characteristic length L'), al = num(sc, 'to the', 'the angle α₀', { signo: true });
    if (!(Rm > 1)) throw new Error('The mirror ratio must be greater than 1');
    if (!(al > 0 && al <= 90)) throw new Error('The angle α₀ between v and B must be between 0° (exclusive) and 90°');
    const a0 = (al * Math.PI) / 180, s0 = Math.sin(a0), c0 = Math.abs(Math.cos(a0)) < 1e-12 ? 0 : Math.cos(a0), aq = Math.abs(P.q), zm = L * Math.sqrt(Rm - 1), ac = Math.asin(1 / Math.sqrt(Rm)), atrapada = s0 > 1 / Math.sqrt(Rm) + 1e-12;
    const vp = v * s0, va = v * c0, mu = (P.m * vp * vp) / (2 * B0), w0 = (aq * B0) / P.m, rL = (P.m * vp) / (aq * B0), Tc0 = (2 * Math.PI) / w0, zt = c0 === 0 ? 0 : L * (c0 / s0), Tb = (2 * Math.PI * L) / vp;
    const Bf = (r) => [(-B0 * r[0] * r[2]) / (L * L), (-B0 * r[1] * r[2]) / (L * L), B0 * (1 + (r[2] * r[2]) / (L * L))];
    const tt = atrapada ? 3 * Tb : Math.min(3 * Tb, (2 * zm) / Math.max(va, 1e-30) * 1.5 + Tb), dt = Math.min(Tc0 / 200, tt / 400);
    if (rL > 0.3 * L) throw new Error(`The gyroradius (${f(rL)} m) is not small compared with L (${f(L)} m): the magnetic moment is not well conserved. Reduce the energy, increase B₀ or increase L`);
    if (tt / dt > 500000) throw new Error('Too many integration steps: the gyroradius is very small compared with L; increase the energy or decrease B₀');
    const run = rk4(P, () => [0, 0, 0], (r) => Bf(r), [0, 0, 0], [vp, 0, va], tt, dt, (r) => Math.abs(r[2]) >= zm), M = run.m;
    const muT = M.map((q) => { const r = [q[1], q[2], q[3]], Bv = Bf(r), Bn = mod(Bv), vv = [q[4], q[5], q[6]], vpar = dot(vv, Bv) / Bn, v2 = dot(vv, vv); return [q[0], (P.m * (v2 - vpar * vpar)) / (2 * Bn)]; });
    const dev = Math.max(...muT.map((x) => Math.abs(x[1] / mu - 1))), zmax = Math.max(...M.map((q) => Math.abs(q[3])));
    const cruces = []; for (let i = 1; i < M.length; i++) if (M[i - 1][3] < 0 && M[i][3] >= 0) cruces.push(M[i - 1][0] + ((M[i][0] - M[i - 1][0]) * -M[i - 1][3]) / (M[i][3] - M[i - 1][3]));
    const TbSim = cruces.length >= 2 ? (cruces[cruces.length - 1] - cruces[0]) / (cruces.length - 1) : null;
    if (P.pre) pasos.unshift({ t: 'Particle data', html: datosP(P) });
    pasos.push({ t: 'The field', html: `$B(z) = B_0 (1 + z^2/L^2)$ on the axis, with $B_0 = ${f(B0)} "T"$ and $L = ${f(L)} "m"$; off the axis a radial component appears $B_ρ = −{ρ}/{2} {dB}/{dz} = −B_0 {ρ z}/{L^2}$ (so $∇·B = 0$). At $z = ±z_m = ±${f(zm)} "m"$ the field is $R_m B_0 = ${f(Rm * B0)} "T"$, with $R_m = ${f(Rm)}$ the mirror ratio.` });
    pasos.push({ t: 'Magnetic moment', html: `If the field changes little over one turn, $μ = {m v_⊥^2}/{2B}$ is constant, and since the field does no work, so is $v^2 = v_⊥^2 + v_∥^2$. At the centre $v_⊥ = v sin α_0 = ${f(vp)} "m/s"$, $v_∥ = ${f(va)} "m/s"$ and $μ = ${f(mu)} "J/T"$.` });
    pasos.push({ t: 'Turning point', html: `The particle stops where $v_∥ = 0$, that is, $B(z_t) = B_0/sin^2 α_0$: ${c0 === 0 ? 'with α₀ = 90° it does not advance along the axis.' : `$z_t = L cot α_0 = ${f(zt)} "m"$.`} It reaches the end of the bottle if $z_t ≥ z_m$.` });
    pasos.push({ t: 'Loss cone', html: `It escapes if it reaches $z_m$: $sin^2 α_0 < B_0/B_{max} = 1/R_m$, that is $α_c = arcsin(1/√R_m) = ${f((ac * 180) / Math.PI)}°$. With $α_0 = ${f(al)}°$ the particle ${atrapada ? 'is <b>trapped</b>' : 'is <b>inside the loss cone</b> and escapes'}${run.parada ? ` (the simulation sees it leave at $t = ${f(run.parada.t)} "s"$)` : ''}.` });
    if (atrapada) pasos.push({ t: 'Bounce period', html: `$T_b = 4 ∫_0^{z_t} {dz}/{v_∥(z)}$ with $v_∥ = √{v^2 − v_⊥0^2 B(z)/B_0}$ gives exactly $T_b = {2π L}/{v_⊥0} = ${f(Tb)} "s"$${TbSim ? `; the simulation gives ${f(TbSim)} s` : ''}.` });
    pasos.push({ t: 'Validity condition', html: `The gyroradius $r_L = ${f(rL)} "m"$ is ${f(rL / L)} times $L$ ($r_L ≪ L$ is needed). With the integration, $μ$ varies by at most ${f(dev * 100)}% along the path.` });
    return { modo: 'espejo', P, v, B0, Rm, L, al, atrapada, ac, zm, vp, va, mu, rL, Tc0, zt, Tb, TbSim, tt, dt, muestras: M, mut: muT, dev, zmax, escapa: !!run.parada, tEscapa: run.parada ? run.parada.t : null, Bz: (z) => B0 * (1 + (z * z) / (L * L)), pasos };
  }

  function selector(sc) {
    const pasos = [], P = particula(sc), E = num(sc, 'E', 'the electric field E'), B = num(sc, 'B', 'the selector field B'), vs = E / B, aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Particle data', html: datosP(P) });
    const v0 = velocidad(sc, P, pasos, true), v = v0 ?? vs;
    pasos.push({ t: 'Velocity that passes undeflected', html: `Inside the selector the electric force (|q|E) and the magnetic force (|q|vB) have opposite directions. They cancel if $|q| E = |q| v B$, that is, $v = E/B = ${f(E)}/${f(B)}$ = <b>${f(vs)} m/s</b>, whatever the charge or mass.` });
    const FE = aq * E, FB = aq * v * B, rel = (v - vs) / vs;
    let des = 'no', hacia = null;
    if (v0 !== null) {
      if (Math.abs(rel) < 1e-6) pasos.push({ t: 'This particle', html: `With v = ${f(v)} m/s, F<sub>e</sub> = ${f(FE)} N and F<sub>m</sub> = ${f(FB)} N are equal: it passes in a straight line.` });
      else {
        des = 'si'; hacia = (v > vs) === (P.q > 0) ? 'up' : 'down';
        pasos.push({ t: 'This particle', html: `With v = ${f(v)} m/s, $F_e = |q| E$ = ${f(FE)} N and $F_m = |q| v B$ = ${f(FB)} N. ${v > vs ? 'It goes faster than needed and the magnetic force wins' : 'It goes slower than needed and the electric force wins'}: it is deflected <b>${hacia}</b> (toward the ${hacia === 'up' ? 'positive' : 'negative'} plate) and does not exit through the slit.` });
      }
    }
    const B2 = num(sc, 'B2', 'the spectrometer field B', { opcional: true });
    let r2 = null;
    if (B2 !== null) {
      r2 = (P.m * v) / (aq * B2);
      pasos.push({ t: 'Mass spectrometer', html: `On leaving it enters a field B′ = ${f(B2)} T with no electric field and describes a semicircle of radius $r = {m v}/{|q| B′} = {${f(P.m)}·${f(v)}}/{${f(aq)}·${f(B2)}}$ = <b>${f(r2)} m</b>. It hits the plate at 2r = <b>${f(2 * r2)} m</b> from the slit. Since v is the same for all those that come out, r is proportional to m/q: this is how the isotopes are separated.` });
    }
    const m2 = num(sc, 'm2', 'the mass of the second isotope', { opcional: true });
    let rb = null, sepa = null;
    if (m2 !== null) {
      if (B2 === null) throw new Error('To separate two isotopes the spectrometer field B′ is needed');
      const mb = m2 * U; rb = (mb * vs) / (aq * B2); sepa = 2 * Math.abs(rb - (P.m * vs) / (aq * B2));
      pasos.push({ t: 'Second isotope', html: `An isotope of ${f(m2)} u (m′ = ${f(m2)}·${f(U)} = ${f(mb)} kg) with the same charge leaves the selector with the same v = ${f(vs)} m/s and describes $r′ = {m′ v}/{|q| B′}$ = <b>${f(rb)} m</b>. The impacts are separated by $Δx = 2|r′ − r| = {2 v |m′ − m|}/{|q| B′}$ = <b>${f(sepa)} m</b>.` });
    }
    return { modo: 'selector', P, E, B, vs, v, dado: v0 !== null, FE, FB, des, hacia, B2, r2, m2, rb, sepa, pasos };
  }

  function ciclotron(sc) {
    const pasos = [], P = particula(sc), B = num(sc, 'B', 'the B field'), R = num(sc, 'R', 'the radius of the dees'), V = num(sc, 'V', 'the potential difference', { opcional: true }), aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Particle data', html: datosP(P) });
    const fr = (aq * B) / (2 * Math.PI * P.m), vmax = (aq * B * R) / P.m, Ec = 0.5 * P.m * vmax * vmax;
    pasos.push({ t: 'Oscillator frequency', html: `Inside the dees the particle makes half turns with $T = {2π m}/{|q| B}$, which does not depend on the radius. The voltage between the dees has to change sign with that frequency: $f = {|q| B}/{2π m} = {${f(aq)}·${f(B)}}/{2π·${f(P.m)}}$ = <b>${f(fr)} Hz</b>` });
    pasos.push({ t: 'Exit velocity and energy', html: `It leaves when its radius is that of the dees: $R = {m v}/{|q| B} ⇒ v_max = {|q| B R}/m$ = <b>${f(vmax)} m/s</b>${vmax > 0.1 * C ? ' (more than 10 % of c: the classical calculation is no longer exact)' : ''}. $E_c = 1/2 m v_max^2 = {q^2 B^2 R^2}/{2m}$ = <b>${f(Ec)} J</b> = ${f(Ec / E0 / 1e6)} MeV` });
    let n = null, t = null;
    if (V !== null) {
      n = Ec / (2 * aq * V); t = n / fr;
      pasos.push({ t: 'Turns', html: `In each turn it crosses the gap between the dees twice and gains 2|q|ΔV = ${f(2 * aq * V)} J. It needs $n = {E_c}/{2|q|ΔV}$ = <b>${f(n)} turns</b>, which takes $t = n T$ = <b>${f(t)} s</b>.` });
    }
    return { modo: 'ciclotron', P, B, R, V, fr, T: 1 / fr, vmax, Ec, n, t, pasos };
  }

  function hilo(sc) {
    const I = num(sc, 'I', 'the current I'), L = num(sc, 'L', 'the length L'), B = num(sc, 'B', 'the B field'), th = num(sc, 'th', 'the angle between the wire and B', { cero: true, def: 90 }), m = num(sc, 'm', 'the mass', { opcional: true });
    if (th > 180) throw new Error('The angle between the wire and B must be between 0° and 180°');
    const s = Math.abs(Math.sin((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.sin((th * Math.PI) / 180), F = I * L * B * s;
    const arriba = (sc.sentidoI !== 'izquierda') === (sc.sentidoB !== 'saliente'), pasos = [];
    pasos.push({ t: 'Force on the wire', html: `$F = I L B sin θ = ${f(I)}·${f(L)}·${f(B)}${th === 90 ? '' : `·sin ${f(th)}°`}$ = <b>${f(F)} N</b> (${f(F / L)} N per metre). It is $F = I L × B$, with L in the direction of the current.` });
    if (s) pasos.push({ t: 'Direction', html: `With the current toward the ${sc.sentidoI === 'izquierda' ? 'left' : 'right'} and B ${sc.sentidoB === 'saliente' ? 'outgoing (⊙)' : 'incoming (⊗)'}, L × B points <b>${arriba ? 'up' : 'down'}</b> (right-hand rule: fingers from L to B, the thumb gives F).` });
    else pasos.push({ t: 'Direction', html: 'The wire is parallel to the field: there is no force.' });
    let Iflota = null;
    if (m !== null) {
      const P = m * G;
      if (!s) pasos.push({ t: 'To make it float', html: 'Parallel to the field there is no magnetic force to balance the weight.' });
      else { Iflota = P / (L * B * s); pasos.push({ t: 'To make it float', html: `The weight is $m g = ${f(m)}·9.8$ = ${f(P)} N. The magnetic force has to be equal and upward: $I = {m g}/{L B sin θ}$ = <b>${f(Iflota)} A</b>${arriba ? '' : ', with the current reversed (now it pushes downward)'}. ${F >= P - 1e-12 ? (arriba ? `With ${f(I)} A the wire rises.` : '') : `${f(I)} A is not enough.`}` }); }
    }
    return { modo: 'hilo', I, L, B, th, F, arriba: s ? arriba : null, m, Iflota, sentidoB: sc.sentidoB, sentidoI: sc.sentidoI, pasos };
  }

  function paralelos(sc) {
    const I1 = num(sc, 'I1', 'the current I₁'), I2 = num(sc, 'I2', 'the current I₂'), d = num(sc, 'd', 'the distance d'), L = num(sc, 'L', 'the length L', { opcional: true }), mismo = sc.sentido !== 'opuesto';
    const B1 = (MU0 * I1) / (2 * Math.PI * d), B2 = (MU0 * I2) / (2 * Math.PI * d), FL = B1 * I2, F = L !== null ? FL * L : null, pasos = [];
    pasos.push({ t: 'Field of one wire at the other', html: `Wire 1 creates at wire 2 a field $B_1 = {μ_0 I_1}/{2π d} = {4π·10^{−7}·${f(I1)}}/{2π·${f(d)}}$ = <b>${f(B1)} T</b>, perpendicular to wire 2 (and 2 creates at 1 B<sub>2</sub> = ${f(B2)} T).` });
    pasos.push({ t: 'Force per unit length', html: `$F/L = I_2 B_1 = {μ_0 I_1 I_2}/{2π d}$ = <b>${f(FL)} N/m</b>, the same on each wire (action and reaction).${F !== null ? ` In ${f(L)} m: F = <b>${f(F)} N</b>.` : ''}` });
    pasos.push({ t: 'Direction', html: mismo ? 'The currents flow in the same direction: the wires <b>attract</b>.' : 'The currents flow in opposite directions: the wires <b>repel</b>.' });
    return { modo: 'paralelos', I1, I2, d, L, B1, B2, FL, F, mismo, pasos };
  }

  function franja(sc) {
    const pasos = [], P = particula(sc), v = velocidad(sc, P, pasos), B = num(sc, 'B', 'the B field'), d = num(sc, 'd', 'the width d of the strip'), aq = Math.abs(P.q);
    if (P.pre) pasos.unshift({ t: 'Particle data', html: datosP(P) });
    const r = (P.m * v) / (aq * B), w = (aq * B) / P.m, T = (2 * Math.PI) / w, gi = giro(P.q, sc.sentidoB), hacia = gi === 'anticlockwise' ? 'up' : 'down';
    pasos.push({ t: 'Radius inside the field', html: `Inside the strip it describes an arc of a circle of radius $r = {m v}/{|q| B} = {${f(P.m)}·${f(v)}}/{${f(aq)}·${f(B)}}$ = <b>${f(r)} m</b>, which curves <b>${hacia}</b> (F = q v × B with B ${sc.sentidoB === 'saliente' ? 'outgoing' : 'incoming'} and the charge ${P.q > 0 ? 'positive' : 'negative'}).` });
    if (r > d) {
      const a = Math.asin(d / r), y = r * (1 - Math.cos(a)), t = a / w;
      pasos.push({ t: 'It leaves on the other side', html: `Since r > d, it crosses it. The centre of the arc is on the entry edge, so on leaving $sin α = d/r = ${f(d)}/${f(r)}$ = ${f(d / r)} and the velocity has been deflected <b>α = ${f((a * 180) / Math.PI)}°</b>.` });
      pasos.push({ t: 'Displacement and time', html: `It leaves ${hacia === 'up' ? 'above' : 'below'} where it entered, at $y = r (1 − cos α)$ = <b>${f(y)} m</b>, and takes $t = α/ω = {α m}/{|q| B}$ = <b>${f(t)} s</b> to cross. With the same speed: the field does not change the magnitude of v.` });
      return { modo: 'franja', P, v, B, d, r, T, cruza: true, alfa: (a * 180) / Math.PI, y, t, hacia, sentidoB: sc.sentidoB, pasos };
    }
    pasos.push({ t: 'It turns back', html: `Since r ≤ d, it does not reach the other edge: it describes a semicircle and leaves through the same edge, in the opposite direction, at 2r = <b>${f(2 * r)} m</b> ${hacia === 'up' ? 'above' : 'below'} the entry point. It takes half a period, $t = {π m}/{|q| B}$ = <b>${f(T / 2)} s</b>, and reaches ${f(r)} m from the edge.` });
    return { modo: 'franja', P, v, B, d, r, T, cruza: false, alfa: 180, y: 2 * r, t: T / 2, hacia, sentidoB: sc.sentidoB, pasos };
  }

  function cruzados(sc) {
    const pasos = [], P = particula(sc), E = num(sc, 'E', 'the electric field E'), B = num(sc, 'B', 'the B field'), v0 = num(sc, 'v0', 'the initial velocity', { signo: true, def: 0 }), aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Particle data', html: datosP(P) });
    const vd = E / B, w = (aq * B) / P.m, T = (2 * Math.PI) / w, u = v0 - vd, R = Math.abs(u) / w, sube = u * P.q < 0;
    pasos.push({ t: 'Drift velocity', html: `With E ⊥ B, if the particle moved at $v_d = E/B$ the electric and magnetic forces would cancel. So it is convenient to look at it from a frame moving with $v_d = ${f(E)}/${f(B)}$ = <b>${f(vd)} m/s</b>, in the direction of E × B (to the right), whatever the sign of the charge.` });
    if (Math.abs(u) < 1e-9 * vd) {
      pasos.push({ t: 'Motion', html: `Its initial velocity is exactly E/B: the two forces cancel and it continues in a straight line (this is the velocity selector).` });
      return { modo: 'cruzados', P, E, B, v0, vd, w, T, u: 0, R: 0, h: 0, vmax: vd, avance: vd * T, sube, pasos };
    }
    pasos.push({ t: 'In the moving frame', html: `There the particle has velocity $u = v_0 − v_d$ = ${f(u)} m/s and only feels the field B: it rotates on a circle of radius $R = {m |u|}/{|q| B}$ = <b>${f(R)} m</b> with $ω = {|q| B}/m$ = ${f(w)} rad/s and period T = <b>${f(T)} s</b>.` });
    const h = 2 * R, vmax = vd + Math.abs(u), avance = vd * T;
    pasos.push({ t: 'Path', html: `Adding the advance, ${Math.abs(Math.abs(u) - vd) < 1e-9 * vd ? `${v0 === 0 ? 'it starts from rest and ' : ''}describes a <b>cycloid</b> (with cusps where it stops)` : Math.abs(u) > vd ? 'it describes a <b>trochoid with loops</b> (at times it goes backwards)' : 'it describes a <b>curtate cycloid</b>, wavy and never stopping'}: $x(t) = v_d t + u/ω sin(ω t)$, $y(t) = u/ω (cos(ω t) − 1)$, with ω = qB/m with its sign. It moves away at most $h = 2R$ = <b>${f(h)} m</b> ${sube ? 'upward' : 'downward'} from the initial line, advances ${f(avance)} m per period and its maximum speed is $v_d + |u|$ = <b>${f(vmax)} m/s</b>.` });
    if (v0 === 0) pasos.push({ t: 'Check with energy', html: `At the highest point it has gained $E_c = |q| E h = ${f(aq)}·${f(E)}·${f(h)}$ = ${f(aq * E * h)} J, and $1/2 m (2E/B)^2$ = ${f(0.5 * P.m * vmax * vmax)} J: the same, because B does no work.` });
    return { modo: 'cruzados', P, E, B, v0, vd, w, T, u, R, h, vmax, avance, sube, pasos };
  }

  function hall(sc) {
    const pasos = [], I = num(sc, 'I', 'the current I'), B = num(sc, 'B', 'the B field'), t = num(sc, 't', 'the thickness t'), w = num(sc, 'w', 'the width', { opcional: true }), e = sc.portador === 'huecos';
    let n, VH;
    if (sc.dato === 'VH') { VH = num(sc, 'VH', 'the Hall voltage'); n = (I * B) / (E0 * t * VH); pasos.push({ t: 'Carrier density', html: `From $V_H = {I B}/{n e t}$ we get $n = {I B}/{e t V_H} = {${f(I)}·${f(B)}}/{${f(E0)}·${f(t)}·${f(VH)}}$ = <b>${f(n)} m<sup>−3</sup></b>.` }); }
    else { n = num(sc, 'n', 'the carrier density n'); VH = (I * B) / (n * E0 * t); pasos.push({ t: 'Hall voltage', html: `In equilibrium the electric force of the Hall field cancels the magnetic one: $e E_H = e v_d B$. With $I = n e v_d w t$ and $V_H = E_H w$ we get $V_H = {I B}/{n e t} = {${f(I)}·${f(B)}}/{${f(n)}·${f(E0)}·${f(t)}}$ = <b>${f(VH)} V</b>. It does not depend on the width.` }); }
    const RH = (e ? 1 : -1) / (n * E0);
    pasos.push({ t: 'Hall coefficient', html: `$R_H = 1/{n q}$ = <b>${f(RH)} m<sup>3</sup>/C</b>, ${e ? 'positive because the carriers are holes' : 'negative because the carriers are electrons'}.` });
    let vd = null, EH = null;
    if (w !== null) { vd = I / (n * E0 * w * t); EH = VH / w; pasos.push({ t: 'Drift velocity and Hall field', html: `$v_d = I/{n e w t}$ = <b>${f(vd)} m/s</b> y $E_H = {V_H}/w = v_d B$ = <b>${f(EH)} V/m</b>.` }); }
    const arriba = sc.sentidoB !== 'saliente', alta = (e === arriba) ? 'from the top' : 'from the bottom';
    pasos.push({ t: 'Which face is at the higher potential', html: `With the current to the right and B ${arriba ? 'incoming (⊗)' : 'outgoing (⊙)'}, F = q v × B drives the carriers ${arriba ? 'upward' : 'downward'} whether they are electrons (q < 0 and v to the left) or holes. They accumulate there: ${e ? 'the holes leave that face positive' : 'the electrons leave that face negative'}, and the <b>${alta}</b> face is at the higher potential. This is how the sign of the carriers is known.` });
    return { modo: 'hall', I, B, t, w, n, VH, RH, vd, EH, huecos: e, arriba, alta, sentidoB: sc.sentidoB, pasos };
  }

  function espira(sc) {
    const pasos = [], N = num(sc, 'N', 'the number of turns N', { def: 1 }), I = num(sc, 'I', 'the current I'), B = num(sc, 'B', 'the B field'), th = num(sc, 'th', 'the angle between the normal and B', { cero: true, def: 90 }), circ = sc.forma === 'circ';
    if (th > 180) throw new Error('The angle between the normal and B must be between 0° and 180°');
    let S, a, b, R;
    if (circ) { R = num(sc, 'R', 'the radius R'); S = Math.PI * R * R; }
    else { a = num(sc, 'a', 'the side a'); b = num(sc, 'b', 'the side b'); S = a * b; }
    const rad = (th * Math.PI) / 180, s = Math.abs(Math.sin(rad)) < 1e-12 ? 0 : Math.sin(rad), c = Math.abs(Math.cos(rad)) < 1e-12 ? 0 : Math.cos(rad), m = N * I * S, tau = m * B * s, Ue = -m * B * c, W = m * B * (1 - c);
    pasos.push({ t: 'Magnetic moment', html: `$S = ${circ ? `π R^2 = π·${f(R)}^2` : `a b = ${f(a)}·${f(b)}`}$ = ${f(S)} m<sup>2</sup> and $m = N I S = ${f(N)}·${f(I)}·${f(S)}$ = <b>${f(m)} A·m<sup>2</sup></b>, perpendicular to the loop (right-hand rule with the current).` });
    if (!circ) pasos.push({ t: 'Forces on the sides', html: `The sides a (perpendicular to B) experience $F = N I a B$ = ${f(N * I * a * B)} N, equal and opposite: they do not move the loop, but form a couple with arm b sin θ. Those of the sides b cancel along the same line.` });
    pasos.push({ t: 'Torque', html: `$τ = m × B$, $|τ| = m B sin θ = N I S B sin θ = ${f(m)}·${f(B)}${th === 90 ? '' : `·sin ${f(th)}°`}$ = <b>${f(tau)} N·m</b>. ${s ? 'It tends to rotate the loop to put m parallel to B.' : 'It is zero: m is parallel (or antiparallel) to B.'} The maximum torque, with the normal perpendicular to B, is ${f(m * B)} N·m.` });
    pasos.push({ t: 'Energy', html: `$U = −m · B = −m B cos θ$ = <b>${f(Ue)} J</b>. Stable equilibrium is θ = 0° (U = −mB) and unstable equilibrium θ = 180°. To take it from θ = 0° to ${f(th)}° the work $W = m B (1 − cos θ)$ = <b>${f(W)} J</b> must be done.` });
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
    { clave: 'proton', nombre: 'Proton entering perpendicular to B', sc: { modo: 'carga', part: 'proton', ...P0, uv: 'ms', v: '2e6', B: '0,5', th: '90', sentidoB: 'entrante' } },
    { clave: 'electron', nombre: 'Electron accelerated through 1000 V', sc: { modo: 'carga', part: 'electron', ...P0, uv: 'V', v: '1000', B: '0,01', th: '90', sentidoB: 'saliente' } },
    { clave: 'helice', nombre: 'Proton at 60° to the field: helix', sc: { modo: 'carga', part: 'proton', ...P0, uv: 'ms', v: '5e5', B: '0,2', th: '60', sentidoB: 'entrante' } },
    { clave: 'alfa', nombre: '5 MeV α particle', sc: { modo: 'carga', part: 'alfa', ...P0, uv: 'eV', v: '5e6', B: '1', th: '90', sentidoB: 'entrante' } },
    { clave: 'vec-proton', nombre: 'F = q v × B of a proton', sc: { modo: 'vectorial', part: 'proton', ...P0, vx: '2e5', vy: '3e5', vz: '0', Bx: '0', By: '0', Bz: '0,5', Ex: '', Ey: '', Ez: '' } },
    { clave: 'vec-electron', nombre: 'Electron with B in two directions', sc: { modo: 'vectorial', part: 'electron', ...P0, vx: '1e6', vy: '0', vz: '0', Bx: '0', By: '0,2', Bz: '0,3', Ex: '', Ey: '', Ez: '' } },
    { clave: 'vec-lorentz', nombre: 'Lorentz force with E and B', sc: { modo: 'vectorial', part: 'otra', q: '2e-6', m: '1e-9', vx: '0', vy: '400', vz: '0', Bx: '0,1', By: '0', Bz: '0', Ex: '0', Ey: '0', Ez: '50' } },
    { clave: 'tray-helice', nombre: 'Proton with parallel E and B: accelerating helix (FU-1)', sc: { modo: 'trayectoria', part: 'proton', ...P0, vx: '1e5', vy: '0', vz: '1e5', Bx: '0', By: '0', Bz: '0,1', Ex: '0', Ey: '0', Ez: '50', tt: '' } },
    { clave: 'tray-deriva', nombre: 'Electron with crossed and tilted E and B: drift (FU-1)', sc: { modo: 'trayectoria', part: 'electron', ...P0, vx: '2e5', vy: '0', vz: '1e5', Bx: '0', By: '0', Bz: '0,01', Ex: '300', Ey: '0', Ez: '0', tt: '' } },
    { clave: 'tray-general', nombre: 'Particle with B and E in any directions (FU-1)', sc: { modo: 'trayectoria', part: 'alfa', ...P0, vx: '1e5', vy: '2e5', vz: '5e4', Bx: '0,05', By: '0,02', Bz: '0,1', Ex: '200', Ey: '-100', Ez: '300', tt: '' } },
    { clave: 'espejo-atrapada', nombre: 'Electron trapped in a magnetic bottle (FU-3)', sc: { modo: 'espejo', part: 'electron', ...P0, uv: 'eV', v: '100', B0: '0,01', Rm: '4', L: '0,5', al: '45' } },
    { clave: 'espejo-escapa', nombre: 'Electron escaping through the loss cone (FU-3)', sc: { modo: 'espejo', part: 'electron', ...P0, uv: 'eV', v: '100', B0: '0,01', Rm: '4', L: '0,5', al: '20' } },
    { clave: 'selector', nombre: 'Velocity selector and spectrometer', sc: { modo: 'selector', part: 'proton', ...P0, uv: 'ms', v: '', E: '1e5', B: '0,2', B2: '0,5' } },
    { clave: 'isotopos', nombre: 'Spectrometer: separation of two isotopes', sc: { modo: 'selector', part: 'otra', q: '1,602e-19', m: '1,993e-26', uv: 'ms', v: '', E: '4e4', B: '0,1', B2: '0,5', m2: '13' } },
    { clave: 'selector-rapido', nombre: 'Electron too fast in the selector', sc: { modo: 'selector', part: 'electron', ...P0, uv: 'ms', v: '3e6', E: '2e4', B: '0,01', B2: '' } },
    { clave: 'ciclotron', nombre: 'Proton cyclotron', sc: { modo: 'ciclotron', part: 'proton', ...P0, B: '1,5', R: '0,5', V: '5e4' } },
    { clave: 'ciclotron-d', nombre: 'Deuteron cyclotron', sc: { modo: 'ciclotron', part: 'deuteron', ...P0, B: '1', R: '0,6', V: '1e4' } },
    { clave: 'franja-cruza', nombre: 'Proton crossing a strip of field', sc: { modo: 'franja', part: 'proton', ...P0, uv: 'ms', v: '1e6', B: '0,2', sentidoB: 'entrante', d: '0,03' } },
    { clave: 'franja-vuelve', nombre: 'Electron that fails to cross the strip', sc: { modo: 'franja', part: 'electron', ...P0, uv: 'eV', v: '500', B: '0,002', sentidoB: 'entrante', d: '0,05' } },
    { clave: 'cicloide', nombre: 'Proton at rest in crossed E and B: cycloid', sc: { modo: 'cruzados', part: 'proton', ...P0, E: '1000', B: '0,01', v0: '' } },
    { clave: 'trocoide', nombre: 'Electron with initial velocity in crossed E and B', sc: { modo: 'cruzados', part: 'electron', ...P0, E: '2000', B: '0,001', v0: '5e6' } },
    { clave: 'hall-cobre', nombre: 'Hall voltage in a copper sheet', sc: { modo: 'hall', portador: 'electrones', I: '20', B: '1,5', sentidoB: 'entrante', t: '1e-4', w: '0,02', dato: 'n', n: '8,5e28', VH: '' } },
    { clave: 'hall-semi', nombre: 'Hole density of a semiconductor', sc: { modo: 'hall', portador: 'huecos', I: '0,01', B: '0,5', sentidoB: 'entrante', t: '1e-3', w: '5e-3', dato: 'VH', n: '', VH: '3e-3' } },
    { clave: 'espira-rect', nombre: 'Torque on a rectangular coil', sc: { modo: 'espira', N: '50', I: '2', forma: 'rect', a: '0,1', b: '0,05', R: '', B: '0,4', th: '30' } },
    { clave: 'espira-circ', nombre: 'Circular loop with the normal perpendicular to B', sc: { modo: 'espira', N: '1', I: '5', forma: 'circ', a: '', b: '', R: '0,1', B: '0,2', th: '90' } },
    { clave: 'hilo', nombre: 'Wire with current in a field', sc: { modo: 'hilo', I: '5', L: '0,5', B: '0,4', th: '90', sentidoB: 'entrante', sentidoI: 'derecha', m: '' } },
    { clave: 'hilo-flota', nombre: 'Current to make a wire float', sc: { modo: 'hilo', I: '2', L: '0,2', B: '0,5', th: '90', sentidoB: 'saliente', sentidoI: 'izquierda', m: '0,01' } },
    { clave: 'paralelos', nombre: 'Two wires with currents in the same direction', sc: { modo: 'paralelos', I1: '10', I2: '5', d: '0,1', L: '1', sentido: 'mismo' } },
    { clave: 'antiparalelos', nombre: 'Two wires with opposite currents', sc: { modo: 'paralelos', I1: '20', I2: '20', d: '0,05', L: '', sentido: 'opuesto' } },
  ];

  return { resolver, rk4, carga, vectorial, trayectoria, espejo, selector, ciclotron, franja, cruzados, hall, espira, hilo, paralelos, ejemplos, f, PART, E0, U, MU0 };
})();

