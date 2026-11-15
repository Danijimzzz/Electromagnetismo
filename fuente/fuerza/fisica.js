/* =====================================================================
   Fuerza magnética sobre cargas y corrientes (sin DOM): carga en un
   campo uniforme (circunferencia o hélice), fuerza de Lorentz con
   vectores, selector de velocidades y espectrómetro de masas (con dos
   isótopos), ciclotrón, carga que cruza una franja de campo, campos E y B
   cruzados (cicloide), efecto Hall, par sobre una espira, fuerza sobre un
   hilo y fuerza entre dos hilos paralelos. Todo en el SI.
   Fase 10: trayectoria numérica (RK4) con E y B uniformes en cualquier dirección (FU-1) y espejo magnético con
   conservación del momento magnético y cono de pérdidas (FU-3); ambas con la vista 3D de vista3d.js.
   En los dibujos B entrante es ⊗ (hacia dentro de la pantalla) y
   saliente ⊙; la carga y la corriente van hacia la derecha.
   ===================================================================== */
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
    if (vacio(sc[k])) { if (def !== null) return def; if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (!signo && (cero ? v < 0 : v <= 0)) throw new Error(`${may(nom)} debe ser ${cero ? 'positivo o 0' : 'mayor que 0'}`);
    return v;
  }
  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const E0 = SI.e, U = 1.66053907e-27, C = SI.c, MU0 = 4 * Math.PI * 1e-7, G = 9.8;
  const PART = {
    proton: { nom: 'protón', art: 'el', q: E0, m: 1.67262192e-27 },
    electron: { nom: 'electrón', art: 'el', q: -E0, m: 9.1093837e-31 },
    alfa: { nom: 'partícula α', art: 'la', q: 2 * E0, m: 6.6446573e-27 },
    deuteron: { nom: 'deuterón', art: 'el', q: E0, m: 3.3435838e-27 },
  };
  // la partícula: una de las de la lista o q y m a mano
  function particula(sc, conM = true) {
    const p = PART[sc.part];
    if (p) return { ...p, pre: true };
    const q = num(sc, 'q', 'la carga q', { signo: true });
    if (q === 0) throw new Error('Con carga 0 no hay fuerza magnética');
    return { nom: 'partícula', q, m: conM ? num(sc, 'm', 'la masa m') : num(sc, 'm', 'la masa m', { opcional: true }), pre: false };
  }
  const datosP = (P) => (P.pre ? `Para ${P.art} ${P.nom}, q = ${f(P.q)} C y m = ${f(P.m)} kg.` : '');
  // la velocidad: en m/s, por su energía cinética (eV) o acelerada desde el reposo por una ddp (V)
  function velocidad(sc, P, pasos, opcional = false) {
    const uv = sc.uv || 'ms';
    const x = num(sc, 'v', uv === 'ms' ? 'la velocidad' : uv === 'eV' ? 'la energía cinética' : 'la diferencia de potencial', { opcional });
    if (x === null) return null;
    if (uv === 'ms') return x;
    const Ec = uv === 'eV' ? x * E0 : Math.abs(P.q) * x, v = Math.sqrt((2 * Ec) / P.m);
    pasos.push({ t: 'Velocidad', html: `${uv === 'eV' ? `E<sub>c</sub> = ${f(x)} eV = ${f(x)}·${f(E0)} = ${f(Ec)} J` : `Al acelerarse desde el reposo con una ddp de ${f(x)} V gana $E_c = |q| ΔV = ${f(Math.abs(P.q))}·${f(x)}$ = ${f(Ec)} J`}, así que $v = √({2E_c}/m) = √({2·${f(Ec)}}/{${f(P.m)}})$ = <b>${f(v)} m/s</b>${v > 0.1 * C ? `. Es más del 10 % de la velocidad de la luz: el resultado clásico ya no es exacto (habría que usar la relatividad).` : ''}` });
    return v;
  }
  // giro en la pantalla: con B entrante la carga positiva gira en sentido antihorario
  const giro = (q, sentidoB) => ((q > 0) === (sentidoB === 'entrante') ? 'antihorario' : 'horario');

  /* ---------- Carga en un campo uniforme ---------- */
  // sc: { part, q, m, uv, v, B, th (grados entre v y B), sentidoB }
  function carga(sc) {
    const pasos = [], P = particula(sc), v = velocidad(sc, P, pasos), B = num(sc, 'B', 'el campo B'), th = num(sc, 'th', 'el ángulo entre v y B', { cero: true, def: 90 });
    if (th > 180) throw new Error('El ángulo entre v y B tiene que estar entre 0° y 180°');
    const s = Math.abs(Math.sin((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.sin((th * Math.PI) / 180), c = Math.abs(Math.cos((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.cos((th * Math.PI) / 180);
    const aq = Math.abs(P.q), F = aq * v * B * s, vp = v * s, va = v * c, w = (aq * B) / P.m, T = (2 * Math.PI) / w, r = vp / w, paso = va * T, Ec = 0.5 * P.m * v * v;
    if (P.pre) pasos.unshift({ t: 'Datos de la partícula', html: datosP(P) });
    pasos.push({ t: 'Fuerza de Lorentz', html: `$F = |q| v B sen θ = ${f(aq)}·${f(v)}·${f(B)}${th === 90 ? '' : `·sen ${f(th)}°`}$ = <b>${f(F)} N</b>. Es perpendicular a v y a B, así que no hace trabajo: el módulo de la velocidad y la energía cinética (${f(Ec)} J = ${f(Ec / E0)} eV) no cambian.` });
    if (s === 0) {
      pasos.push({ t: 'Movimiento', html: 'La velocidad es paralela al campo: no hay fuerza magnética y la partícula sigue en línea recta con velocidad constante.' });
      return { modo: 'carga', P, v, B, th, F: 0, r: Infinity, T, f: 1 / T, w, paso: Infinity, va, vp: 0, Ec, giro: null, sentidoB: sc.sentidoB, pasos };
    }
    pasos.push({ t: 'Radio de la trayectoria', html: `La fuerza magnética hace de fuerza centrípeta: $|q| v${th === 90 ? '' : '_⊥'} B = {m v${th === 90 ? '' : '_⊥'}^2}/r$, ${th === 90 ? '' : `con $v_⊥ = v sen θ$ = ${f(vp)} m/s, `}de donde $r = {m v${th === 90 ? '' : '_⊥'}}/{|q| B} = {${f(P.m)}·${f(vp)}}/{${f(aq)}·${f(B)}}$ = <b>${f(r)} m</b>` });
    pasos.push({ t: 'Periodo y frecuencia', html: `$T = {2π r}/{v${th === 90 ? '' : '_⊥'}} = {2π m}/{|q| B}$ = <b>${f(T)} s</b>; $f = 1/T$ = <b>${f(1 / T)} Hz</b> y $ω = {|q| B}/m$ = ${f(w)} rad/s. No dependen de la velocidad (en eso se basa el ciclotrón).` });
    const gi = giro(P.q, th === 90 ? sc.sentidoB : 'entrante');
    if (th !== 90) pasos.push({ t: 'Hélice', html: `La componente paralela a B, $v_∥ = v cos θ$ = ${f(va)} m/s, no cambia: la partícula avanza a lo largo del campo mientras gira, y describe una hélice de radio ${f(r)} m y paso $p = v_∥ T = ${f(Math.abs(va))}·${f(T)}$ = <b>${f(Math.abs(paso))} m</b>.` });
    pasos.push({ t: 'Sentido de giro', html: th === 90 ? `Con B ${sc.sentidoB === 'saliente' ? 'saliente (⊙)' : 'entrante (⊗)'} y la carga ${P.q > 0 ? 'positiva' : 'negativa'}, F = q v × B apunta hacia el centro y la partícula gira en sentido <b>${gi}</b> en la pantalla.` : `Mirando en el sentido de B, una carga ${P.q > 0 ? 'positiva gira en sentido antihorario' : 'negativa gira en sentido horario'} (F = q v × B).` });
    return { modo: 'carga', P, v, B, th, F, r, T, f: 1 / T, w, paso: Math.abs(paso), va, vp, Ec, giro: gi, sentidoB: sc.sentidoB, pasos };
  }

  /* ---------- Fuerza de Lorentz con vectores ---------- */
  // sc: { part, q, m, vx, vy, vz, Bx, By, Bz, Ex, Ey, Ez }
  const comp = (sc, p, nom, opcional = false) => ['x', 'y', 'z'].map((e) => num(sc, p + e, `la componente ${e} de ${nom}`, { signo: true, def: opcional || !vacio(sc[p + 'x']) || !vacio(sc[p + 'y']) || !vacio(sc[p + 'z']) ? 0 : null }));
  const ijk = (u, un) => { const t = u.map((x, i) => (Math.abs(x) < 1e-300 ? '' : `${x < 0 ? '−' : '+'} ${f(Math.abs(x))} <i class="uv">${'ijk'[i]}</i>`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−'); return t ? `(${t}) ${un}` : `0 ${un}`; };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]].map((x) => (Math.abs(x) < 1e-300 ? 0 : x));
  const mod = (u) => Math.hypot(...u);
  function vectorial(sc) {
    const pasos = [], P = particula(sc, false), v = comp(sc, 'v', 'v'), B = comp(sc, 'B', 'B'), hayE = ['x', 'y', 'z'].some((e) => !vacio(sc['E' + e])), E = hayE ? comp(sc, 'E', 'E', true) : [0, 0, 0];
    if (mod(B) === 0 && !hayE) throw new Error('Escribe al menos una componente de B');
    if (P.pre) pasos.push({ t: 'Datos de la partícula', html: datosP(P) });
    const vB = cruz(v, B), Fm = vB.map((x) => P.q * x), Fe = E.map((x) => P.q * x), F = Fm.map((x, i) => x + Fe[i]);
    const det = `<span class="det"><table><tr><td><i class="uv">i</i></td><td><i class="uv">j</i></td><td><i class="uv">k</i></td></tr><tr>${v.map((x) => `<td>${f(x)}</td>`).join('')}</tr><tr>${B.map((x) => `<td>${f(x)}</td>`).join('')}</tr></table></span>`;
    pasos.push({ t: 'Producto vectorial', html: `v × B = ${det} = ${ijk(vB, 'T·m/s')}<br>Cada componente es un determinante 2×2: $(v_y B_z − v_z B_y, v_z B_x − v_x B_z, v_x B_y − v_y B_x)$.` });
    pasos.push({ t: 'Fuerza magnética', html: `$F_m = q (v × B)$ = ${f(P.q)}·${ijk(vB, '')} = <b>${ijk(Fm, 'N')}</b>, de módulo |F<sub>m</sub>| = ${f(mod(Fm))} N.` });
    const cv = mod(v) && mod(B) ? (v[0] * B[0] + v[1] * B[1] + v[2] * B[2]) / (mod(v) * mod(B)) : 1, ang = (Math.acos(Math.max(-1, Math.min(1, cv))) * 180) / Math.PI;
    if (mod(v) && mod(B)) pasos.push({ t: 'Comprobación', html: `El ángulo entre v y B es ${f(ang)}°, y $|q| v B sen θ$ = ${f(Math.abs(P.q) * mod(v) * mod(B) * Math.sin((ang * Math.PI) / 180))} N, lo mismo. F<sub>m</sub> es perpendicular a v ($F_m · v = 0$) y a B.` });
    if (hayE) {
      pasos.push({ t: 'Fuerza eléctrica', html: `$F_e = q E$ = ${f(P.q)}·${ijk(E, 'V/m')} = ${ijk(Fe, 'N')}` });
      pasos.push({ t: 'Fuerza de Lorentz', html: `$F = q (E + v × B)$ = <b>${ijk(F, 'N')}</b>, de módulo <b>${f(mod(F))} N</b>.` });
    }
    let a = null;
    if (P.m) { a = F.map((x) => x / P.m); pasos.push({ t: 'Aceleración', html: `$a = F/m$ = ${ijk(a, 'm/s<sup>2</sup>')}, de módulo ${f(mod(a))} m/s<sup>2</sup>.` }); }
    return { modo: 'vectorial', P, v, B, E, hayE, vB, Fm, Fe, F, Fmod: mod(F), Fmmod: mod(Fm), ang, a, pasos };
  }

  /* ---------- Integración numérica (RK4): m dv/dt = q (E + v × B) ---------- */
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // E(r, t) y B(r, t) devuelven vectores; parar(r, v, t) corta la integración. Devuelve muestras [t, x, y, z, vx, vy, vz] (≤ nmax)
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

  /* ---------- FU-1: trayectoria con E y B uniformes en cualquier dirección ---------- */
  // sc: { part, q, m, vx.., Bx.., Ex.. (opcional), tt (s, opcional; vacío = 5 periodos de giro) }
  function trayectoria(sc) {
    const pasos = [], P = particula(sc, true), v0 = comp(sc, 'v', 'v'), B = comp(sc, 'B', 'B', true), hayE = ['x', 'y', 'z'].some((e) => !vacio(sc['E' + e])), E = hayE ? comp(sc, 'E', 'E', true) : [0, 0, 0];
    const Bm = mod(B);
    if (!Bm && !hayE) throw new Error('Escribe al menos una componente de B o de E');
    if (!mod(v0) && !mod(E)) throw new Error('Sin velocidad inicial y sin campo eléctrico la partícula no se mueve');
    const aq = Math.abs(P.q), b = Bm ? B.map((x) => x / Bm) : [0, 0, 1], Epar = dot(E, b), Eperp = E.map((x, i) => x - Epar * b[i]);
    const vd = Bm ? cruz(Eperp, B).map((x) => x / (Bm * Bm)) : [0, 0, 0], vpar = dot(v0, b), vperp = v0.map((x, i) => x - vpar * b[i] - vd[i]), vpm = mod(vperp);
    const w = Bm ? (aq * Bm) / P.m : 0, Tc = Bm ? (2 * Math.PI) / w : Infinity, rL = Bm ? (P.m * vpm) / (aq * Bm) : Infinity, apar = (P.q * Epar) / P.m;
    if (Bm && mod(vd) >= C) throw new Error('E/B no puede ser igual o mayor que c: el modelo no relativista no vale');
    const tt = vacio(sc.tt) ? (Bm ? 5 * Tc : null) : num(sc, 'tt', 'el tiempo de integración');
    if (tt === null) throw new Error('Sin B hay que escribir el tiempo de integración');
    const dt = Bm ? Math.min(Tc / 400, tt / 200) : tt / 400;
    if (tt / dt > 400000) throw new Error('Demasiados pasos de integración: reduce el tiempo');
    const run = rk4(P, () => E, () => B, [0, 0, 0], v0, tt, dt), M = run.m, ult = M[M.length - 1], KE = (r) => 0.5 * P.m * (r[4] * r[4] + r[5] * r[5] + r[6] * r[6]);
    const KE0 = KE(M[0]), KE1 = KE(ult), WE = P.q * dot(E, [ult[1], ult[2], ult[3]]);
    if (P.pre) pasos.push({ t: 'Datos de la partícula', html: datosP(P) });
    pasos.push({ t: 'Ecuación del movimiento', html: `$m {dv}/{dt} = q (E + v × B)$ con $E = ${ijk(E, 'V/m')}$ y $B = ${ijk(B, 'T')}$. No tiene solución cerrada en general, así que se integra con Runge-Kutta de orden 4 con ${Math.round(tt / dt)} pasos de $${f(dt)} "s"$ hasta $t = ${f(tt)} "s"$.` });
    if (Bm) pasos.push({ t: 'Giro alrededor de B', html: `$ω_c = {|q| B}/m = ${f(w)} "rad/s"$, periodo $T_c = 2π/ω_c = ${f(Tc)} "s"$ y, en el sistema que se mueve con la deriva, radio $r_L = {m v_⊥}/{|q| B} = ${f(rL)} "m"$ con $v_⊥ = ${f(vpm)} "m/s"$ (la velocidad perpendicular a B menos la deriva).` });
    if (hayE && Bm) pasos.push({ t: 'Deriva E × B', html: `La parte de E perpendicular a B, $E_⊥ = ${ijk(Eperp, 'V/m')}$, hace derivar la partícula, sea cual sea su carga, con $v_d = {E × B}/{B^2} = ${ijk(vd, 'm/s')}$ (módulo ${f(mod(vd))} m/s).` });
    if (hayE) pasos.push({ t: 'Aceleración a lo largo de B', html: Bm ? `La parte paralela, $E_∥ = ${f(Epar)} "V/m"$, acelera la partícula a lo largo del campo: $a_∥ = {q E_∥}/m = ${f(apar)} "m/s"^2$, y $v_∥ = ${f(vpar)} + a_∥ t$.` : `Sin B la aceleración es $a = qE/m = ${ijk(E.map((x) => (P.q * x) / P.m), 'm/s²')}$.` });
    pasos.push({ t: 'Energía', html: `El campo magnético no hace trabajo; el eléctrico sí: $ΔE_c = q E·Δr = ${f(WE)} "J"$. Con la integración, $E_c$ pasa de ${f(KE0)} J a ${f(KE1)} J (${f(KE1 - KE0)} J).` });
    return { modo: 'trayectoria', P, v0, B, E, hayE, Bm, w, Tc, rL, vd, vpar, vpm, apar, tt, dt, muestras: M, KE0, KE1, WE, rf: [ult[1], ult[2], ult[3]], vf: [ult[4], ult[5], ult[6]], Kmax: Math.max(...M.map(KE)), pasos };
  }

  /* ---------- FU-3: espejo magnético B(z) = B₀ (1 + z²/L²) ---------- */
  // sc: { part, q, m, uv, v, B0 (T), Rm (relación de espejo), L (m), al (°, ángulo entre v y B en el centro) }
  function espejo(sc) {
    const pasos = [], P = particula(sc, true), v = velocidad(sc, P, pasos), B0 = num(sc, 'B0', 'el campo B₀ del centro'), Rm = num(sc, 'Rm', 'la relación de espejo Bmáx/B₀'), L = num(sc, 'L', 'la longitud característica L'), al = num(sc, 'al', 'el ángulo α₀', { signo: true });
    if (!(Rm > 1)) throw new Error('La relación de espejo tiene que ser mayor que 1');
    if (!(al > 0 && al <= 90)) throw new Error('El ángulo α₀ entre v y B tiene que estar entre 0° (exclusive) y 90°');
    const a0 = (al * Math.PI) / 180, s0 = Math.sin(a0), c0 = Math.abs(Math.cos(a0)) < 1e-12 ? 0 : Math.cos(a0), aq = Math.abs(P.q), zm = L * Math.sqrt(Rm - 1), ac = Math.asin(1 / Math.sqrt(Rm)), atrapada = s0 > 1 / Math.sqrt(Rm) + 1e-12;
    const vp = v * s0, va = v * c0, mu = (P.m * vp * vp) / (2 * B0), w0 = (aq * B0) / P.m, rL = (P.m * vp) / (aq * B0), Tc0 = (2 * Math.PI) / w0, zt = c0 === 0 ? 0 : L * (c0 / s0), Tb = (2 * Math.PI * L) / vp;
    const Bf = (r) => [(-B0 * r[0] * r[2]) / (L * L), (-B0 * r[1] * r[2]) / (L * L), B0 * (1 + (r[2] * r[2]) / (L * L))];
    const tt = atrapada ? 3 * Tb : Math.min(3 * Tb, (2 * zm) / Math.max(va, 1e-30) * 1.5 + Tb), dt = Math.min(Tc0 / 200, tt / 400);
    if (rL > 0.3 * L) throw new Error(`El radio de giro (${f(rL)} m) no es pequeño frente a L (${f(L)} m): el momento magnético no se conserva bien. Reduce la energía, sube B₀ o aumenta L`);
    if (tt / dt > 500000) throw new Error('Demasiados pasos de integración: el radio de giro es muy pequeño frente a L; aumenta la energía o baja B₀');
    const run = rk4(P, () => [0, 0, 0], (r) => Bf(r), [0, 0, 0], [vp, 0, va], tt, dt, (r) => Math.abs(r[2]) >= zm), M = run.m;
    const muT = M.map((q) => { const r = [q[1], q[2], q[3]], Bv = Bf(r), Bn = mod(Bv), vv = [q[4], q[5], q[6]], vpar = dot(vv, Bv) / Bn, v2 = dot(vv, vv); return [q[0], (P.m * (v2 - vpar * vpar)) / (2 * Bn)]; });
    const dev = Math.max(...muT.map((x) => Math.abs(x[1] / mu - 1))), zmax = Math.max(...M.map((q) => Math.abs(q[3])));
    // periodo de rebote medido: cruces de z = 0 hacia arriba
    const cruces = []; for (let i = 1; i < M.length; i++) if (M[i - 1][3] < 0 && M[i][3] >= 0) cruces.push(M[i - 1][0] + ((M[i][0] - M[i - 1][0]) * -M[i - 1][3]) / (M[i][3] - M[i - 1][3]));
    const TbSim = cruces.length >= 2 ? (cruces[cruces.length - 1] - cruces[0]) / (cruces.length - 1) : null;
    if (P.pre) pasos.unshift({ t: 'Datos de la partícula', html: datosP(P) });
    pasos.push({ t: 'El campo', html: `$B(z) = B_0 (1 + z^2/L^2)$ sobre el eje, con $B_0 = ${f(B0)} "T"$ y $L = ${f(L)} "m"$; fuera del eje aparece una componente radial $B_ρ = −{ρ}/{2} {dB}/{dz} = −B_0 {ρ z}/{L^2}$ (así $∇·B = 0$). En $z = ±z_m = ±${f(zm)} "m"$ el campo vale $R_m B_0 = ${f(Rm * B0)} "T"$, con $R_m = ${f(Rm)}$ la relación de espejo.` });
    pasos.push({ t: 'Momento magnético', html: `Si el campo cambia poco en una vuelta, $μ = {m v_⊥^2}/{2B}$ es constante, y como el campo no hace trabajo $v^2 = v_⊥^2 + v_∥^2$ también. En el centro $v_⊥ = v sen α_0 = ${f(vp)} "m/s"$, $v_∥ = ${f(va)} "m/s"$ y $μ = ${f(mu)} "J/T"$.` });
    pasos.push({ t: 'Punto de retorno', html: `La partícula se frena donde $v_∥ = 0$, es decir, $B(z_t) = B_0/sen^2 α_0$: ${c0 === 0 ? 'con α₀ = 90° no avanza a lo largo del eje.' : `$z_t = L cot α_0 = ${f(zt)} "m"$.`} Llega al final de la botella si $z_t ≥ z_m$.` });
    pasos.push({ t: 'Cono de pérdidas', html: `Escapa quien llega a $z_m$: $sen^2 α_0 < B_0/B_{máx} = 1/R_m$, o sea $α_c = arcsen(1/√R_m) = ${f((ac * 180) / Math.PI)}°$. Con $α_0 = ${f(al)}°$ la partícula ${atrapada ? 'queda <b>atrapada</b>' : 'está <b>dentro del cono de pérdidas</b> y escapa'}${run.parada ? ` (la simulación la ve salir en $t = ${f(run.parada.t)} "s"$)` : ''}.` });
    if (atrapada) pasos.push({ t: 'Periodo de rebote', html: `$T_b = 4 ∫_0^{z_t} {dz}/{v_∥(z)}$ con $v_∥ = √{v^2 − v_⊥0^2 B(z)/B_0}$ da exactamente $T_b = {2π L}/{v_⊥0} = ${f(Tb)} "s"$${TbSim ? `; la simulación da ${f(TbSim)} s` : ''}.` });
    pasos.push({ t: 'Condición de validez', html: `El radio de giro $r_L = ${f(rL)} "m"$ es ${f(rL / L)} veces $L$ (hace falta $r_L ≪ L$). Con la integración, $μ$ varía como máximo un ${f(dev * 100)}% a lo largo del recorrido.` });
    return { modo: 'espejo', P, v, B0, Rm, L, al, atrapada, ac, zm, vp, va, mu, rL, Tc0, zt, Tb, TbSim, tt, dt, muestras: M, mut: muT, dev, zmax, escapa: !!run.parada, tEscapa: run.parada ? run.parada.t : null, Bz: (z) => B0 * (1 + (z * z) / (L * L)), pasos };
  }

  /* ---------- Selector de velocidades y espectrómetro ---------- */
  // sc: { part, q, m, uv, v (opcional), E, B, B2 (opcional) }; E hacia abajo (placa + arriba) y B entrante
  function selector(sc) {
    const pasos = [], P = particula(sc), E = num(sc, 'E', 'el campo eléctrico E'), B = num(sc, 'B', 'el campo B del selector'), vs = E / B, aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Datos de la partícula', html: datosP(P) });
    const v0 = velocidad(sc, P, pasos, true), v = v0 ?? vs;
    pasos.push({ t: 'Velocidad que pasa sin desviarse', html: `Dentro del selector la fuerza eléctrica (|q|E) y la magnética (|q|vB) tienen sentidos contrarios. Se anulan si $|q| E = |q| v B$, es decir, $v = E/B = ${f(E)}/${f(B)}$ = <b>${f(vs)} m/s</b>, sea cual sea la carga o la masa.` });
    const FE = aq * E, FB = aq * v * B, rel = (v - vs) / vs;
    let des = 'no', hacia = null;
    if (v0 !== null) {
      if (Math.abs(rel) < 1e-6) pasos.push({ t: 'Esta partícula', html: `Con v = ${f(v)} m/s, F<sub>e</sub> = ${f(FE)} N y F<sub>m</sub> = ${f(FB)} N son iguales: pasa en línea recta.` });
      else {
        des = 'si'; hacia = (v > vs) === (P.q > 0) ? 'arriba' : 'abajo';
        pasos.push({ t: 'Esta partícula', html: `Con v = ${f(v)} m/s, $F_e = |q| E$ = ${f(FE)} N y $F_m = |q| v B$ = ${f(FB)} N. ${v > vs ? 'Va más deprisa de lo necesario y gana la fuerza magnética' : 'Va más despacio de lo necesario y gana la fuerza eléctrica'}: se desvía hacia <b>${hacia}</b> (la placa ${hacia === 'arriba' ? 'positiva' : 'negativa'}) y no sale por la rendija.` });
      }
    }
    const B2 = num(sc, 'B2', 'el campo B del espectrómetro', { opcional: true });
    let r2 = null;
    if (B2 !== null) {
      r2 = (P.m * v) / (aq * B2);
      pasos.push({ t: 'Espectrómetro de masas', html: `Al salir entra en un campo B′ = ${f(B2)} T sin campo eléctrico y describe media circunferencia de radio $r = {m v}/{|q| B′} = {${f(P.m)}·${f(v)}}/{${f(aq)}·${f(B2)}}$ = <b>${f(r2)} m</b>. Choca con la placa a 2r = <b>${f(2 * r2)} m</b> de la rendija. Como v es la misma para todas las que salen, r es proporcional a m/q: así se separan los isótopos.` });
    }
    const m2 = num(sc, 'm2', 'la masa del segundo isótopo', { opcional: true });
    let rb = null, sepa = null;
    if (m2 !== null) {
      if (B2 === null) throw new Error('Para separar dos isótopos hace falta el campo B′ del espectrómetro');
      const mb = m2 * U; rb = (mb * vs) / (aq * B2); sepa = 2 * Math.abs(rb - (P.m * vs) / (aq * B2));
      pasos.push({ t: 'Segundo isótopo', html: `Un isótopo de ${f(m2)} u (m′ = ${f(m2)}·${f(U)} = ${f(mb)} kg) con la misma carga sale del selector con la misma v = ${f(vs)} m/s y describe $r′ = {m′ v}/{|q| B′}$ = <b>${f(rb)} m</b>. Los impactos quedan separados $Δx = 2|r′ − r| = {2 v |m′ − m|}/{|q| B′}$ = <b>${f(sepa)} m</b>.` });
    }
    return { modo: 'selector', P, E, B, vs, v, dado: v0 !== null, FE, FB, des, hacia, B2, r2, m2, rb, sepa, pasos };
  }

  /* ---------- Ciclotrón ---------- */
  // sc: { part, q, m, B, R (radio de las des), V (ddp entre las des, opcional) }
  function ciclotron(sc) {
    const pasos = [], P = particula(sc), B = num(sc, 'B', 'el campo B'), R = num(sc, 'R', 'el radio de las des'), V = num(sc, 'V', 'la diferencia de potencial', { opcional: true }), aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Datos de la partícula', html: datosP(P) });
    const fr = (aq * B) / (2 * Math.PI * P.m), vmax = (aq * B * R) / P.m, Ec = 0.5 * P.m * vmax * vmax;
    pasos.push({ t: 'Frecuencia del oscilador', html: `Dentro de las des la partícula da medias vueltas con $T = {2π m}/{|q| B}$, que no depende del radio. La tensión entre las des tiene que cambiar de signo con esa frecuencia: $f = {|q| B}/{2π m} = {${f(aq)}·${f(B)}}/{2π·${f(P.m)}}$ = <b>${f(fr)} Hz</b>` });
    pasos.push({ t: 'Velocidad y energía al salir', html: `Sale cuando su radio es el de las des: $R = {m v}/{|q| B} ⇒ v_máx = {|q| B R}/m$ = <b>${f(vmax)} m/s</b>${vmax > 0.1 * C ? ' (más del 10 % de c: el cálculo clásico ya no es exacto)' : ''}. $E_c = 1/2 m v_máx^2 = {q^2 B^2 R^2}/{2m}$ = <b>${f(Ec)} J</b> = ${f(Ec / E0 / 1e6)} MeV` });
    let n = null, t = null;
    if (V !== null) {
      n = Ec / (2 * aq * V); t = n / fr;
      pasos.push({ t: 'Vueltas', html: `En cada vuelta cruza dos veces el hueco entre las des y gana 2|q|ΔV = ${f(2 * aq * V)} J. Necesita $n = {E_c}/{2|q|ΔV}$ = <b>${f(n)} vueltas</b>, que tarda $t = n T$ = <b>${f(t)} s</b>.` });
    }
    return { modo: 'ciclotron', P, B, R, V, fr, T: 1 / fr, vmax, Ec, n, t, pasos };
  }

  /* ---------- Fuerza sobre un hilo ---------- */
  // sc: { I, L, B, th (grados entre el hilo y B), sentidoB, sentidoI ('derecha'|'izquierda'), m (opcional, para que flote) }
  function hilo(sc) {
    const I = num(sc, 'I', 'la corriente I'), L = num(sc, 'L', 'la longitud L'), B = num(sc, 'B', 'el campo B'), th = num(sc, 'th', 'el ángulo entre el hilo y B', { cero: true, def: 90 }), m = num(sc, 'm', 'la masa', { opcional: true });
    if (th > 180) throw new Error('El ángulo entre el hilo y B tiene que estar entre 0° y 180°');
    const s = Math.abs(Math.sin((th * Math.PI) / 180)) < 1e-12 ? 0 : Math.sin((th * Math.PI) / 180), F = I * L * B * s;
    // I a la derecha y B entrante: F hacia arriba
    const arriba = (sc.sentidoI !== 'izquierda') === (sc.sentidoB !== 'saliente'), pasos = [];
    pasos.push({ t: 'Fuerza sobre el hilo', html: `$F = I L B sen θ = ${f(I)}·${f(L)}·${f(B)}${th === 90 ? '' : `·sen ${f(th)}°`}$ = <b>${f(F)} N</b> (${f(F / L)} N por metro). Es $F = I L × B$, con L en el sentido de la corriente.` });
    if (s) pasos.push({ t: 'Sentido', html: `Con la corriente hacia la ${sc.sentidoI === 'izquierda' ? 'izquierda' : 'derecha'} y B ${sc.sentidoB === 'saliente' ? 'saliente (⊙)' : 'entrante (⊗)'}, L × B apunta hacia <b>${arriba ? 'arriba' : 'abajo'}</b> (regla de la mano derecha: dedos de L a B, el pulgar da F).` });
    else pasos.push({ t: 'Sentido', html: 'El hilo es paralelo al campo: no hay fuerza.' });
    let Iflota = null;
    if (m !== null) {
      const P = m * G;
      if (!s) pasos.push({ t: 'Para que flote', html: 'Paralelo al campo no hay fuerza magnética que equilibre el peso.' });
      else { Iflota = P / (L * B * s); pasos.push({ t: 'Para que flote', html: `El peso es $m g = ${f(m)}·9,8$ = ${f(P)} N. La fuerza magnética tiene que ser igual y hacia arriba: $I = {m g}/{L B sen θ}$ = <b>${f(Iflota)} A</b>${arriba ? '' : ', con la corriente al revés (ahora empuja hacia abajo)'}. ${F >= P - 1e-12 ? (arriba ? `Con ${f(I)} A el hilo sube.` : '') : `Con ${f(I)} A no basta.`}` }); }
    }
    return { modo: 'hilo', I, L, B, th, F, arriba: s ? arriba : null, m, Iflota, sentidoB: sc.sentidoB, sentidoI: sc.sentidoI, pasos };
  }

  /* ---------- Dos hilos paralelos ---------- */
  // sc: { I1, I2, d, L (opcional), sentido: 'mismo'|'opuesto' }
  function paralelos(sc) {
    const I1 = num(sc, 'I1', 'la corriente I₁'), I2 = num(sc, 'I2', 'la corriente I₂'), d = num(sc, 'd', 'la distancia d'), L = num(sc, 'L', 'la longitud L', { opcional: true }), mismo = sc.sentido !== 'opuesto';
    const B1 = (MU0 * I1) / (2 * Math.PI * d), B2 = (MU0 * I2) / (2 * Math.PI * d), FL = B1 * I2, F = L !== null ? FL * L : null, pasos = [];
    pasos.push({ t: 'Campo de un hilo en el otro', html: `El hilo 1 crea en el hilo 2 un campo $B_1 = {μ_0 I_1}/{2π d} = {4π·10^{−7}·${f(I1)}}/{2π·${f(d)}}$ = <b>${f(B1)} T</b>, perpendicular al hilo 2 (y el 2 crea en el 1 B<sub>2</sub> = ${f(B2)} T).` });
    pasos.push({ t: 'Fuerza por unidad de longitud', html: `$F/L = I_2 B_1 = {μ_0 I_1 I_2}/{2π d}$ = <b>${f(FL)} N/m</b>, la misma sobre cada hilo (acción y reacción).${F !== null ? ` En ${f(L)} m: F = <b>${f(F)} N</b>.` : ''}` });
    pasos.push({ t: 'Sentido', html: mismo ? 'Las corrientes van en el mismo sentido: los hilos se <b>atraen</b>.' : 'Las corrientes van en sentidos contrarios: los hilos se <b>repelen</b>.' });
    return { modo: 'paralelos', I1, I2, d, L, B1, B2, FL, F, mismo, pasos };
  }

  /* ---------- Carga que entra en una franja de campo ---------- */
  // sc: { part, q, m, uv, v, B, sentidoB, d }: entra perpendicular al borde de una franja de anchura d
  function franja(sc) {
    const pasos = [], P = particula(sc), v = velocidad(sc, P, pasos), B = num(sc, 'B', 'el campo B'), d = num(sc, 'd', 'la anchura d de la franja'), aq = Math.abs(P.q);
    if (P.pre) pasos.unshift({ t: 'Datos de la partícula', html: datosP(P) });
    const r = (P.m * v) / (aq * B), w = (aq * B) / P.m, T = (2 * Math.PI) / w, gi = giro(P.q, sc.sentidoB), hacia = gi === 'antihorario' ? 'arriba' : 'abajo';
    pasos.push({ t: 'Radio dentro del campo', html: `Dentro de la franja describe un arco de circunferencia de radio $r = {m v}/{|q| B} = {${f(P.m)}·${f(v)}}/{${f(aq)}·${f(B)}}$ = <b>${f(r)} m</b>, que se curva hacia <b>${hacia}</b> (F = q v × B con B ${sc.sentidoB === 'saliente' ? 'saliente' : 'entrante'} y la carga ${P.q > 0 ? 'positiva' : 'negativa'}).` });
    if (r > d) {
      const a = Math.asin(d / r), y = r * (1 - Math.cos(a)), t = a / w;
      pasos.push({ t: 'Sale por el otro lado', html: `Como r > d, la atraviesa. El centro del arco está en el borde de entrada, así que al salir $sen α = d/r = ${f(d)}/${f(r)}$ = ${f(d / r)} y la velocidad se ha desviado <b>α = ${f((a * 180) / Math.PI)}°</b>.` });
      pasos.push({ t: 'Desplazamiento y tiempo', html: `Sale ${hacia === 'arriba' ? 'por encima' : 'por debajo'} de donde entró, a $y = r (1 − cos α)$ = <b>${f(y)} m</b>, y tarda $t = α/ω = {α m}/{|q| B}$ = <b>${f(t)} s</b> en cruzar. Con la misma rapidez: el campo no cambia el módulo de v.` });
      return { modo: 'franja', P, v, B, d, r, T, cruza: true, alfa: (a * 180) / Math.PI, y, t, hacia, sentidoB: sc.sentidoB, pasos };
    }
    pasos.push({ t: 'Vuelve hacia atrás', html: `Como r ≤ d, no llega al otro borde: describe media circunferencia y sale por el mismo borde, en sentido contrario, a 2r = <b>${f(2 * r)} m</b> ${hacia === 'arriba' ? 'por encima' : 'por debajo'} del punto de entrada. Tarda medio periodo, $t = {π m}/{|q| B}$ = <b>${f(T / 2)} s</b>, y llega a ${f(r)} m del borde.` });
    return { modo: 'franja', P, v, B, d, r, T, cruza: false, alfa: 180, y: 2 * r, t: T / 2, hacia, sentidoB: sc.sentidoB, pasos };
  }

  /* ---------- Campos E y B cruzados: cicloide ---------- */
  // sc: { part, q, m, E, B, v0 }: E hacia arriba, B saliente (⊙), v0 hacia la derecha (0 = parte del reposo)
  function cruzados(sc) {
    const pasos = [], P = particula(sc), E = num(sc, 'E', 'el campo eléctrico E'), B = num(sc, 'B', 'el campo B'), v0 = num(sc, 'v0', 'la velocidad inicial', { signo: true, def: 0 }), aq = Math.abs(P.q);
    if (P.pre) pasos.push({ t: 'Datos de la partícula', html: datosP(P) });
    const vd = E / B, w = (aq * B) / P.m, T = (2 * Math.PI) / w, u = v0 - vd, R = Math.abs(u) / w, sube = u * P.q < 0;
    pasos.push({ t: 'Velocidad de deriva', html: `Con E ⊥ B, si la partícula fuera a $v_d = E/B$ las fuerzas eléctrica y magnética se anularían. Por eso conviene mirarla desde un sistema que avanza con $v_d = ${f(E)}/${f(B)}$ = <b>${f(vd)} m/s</b>, en el sentido de E × B (hacia la derecha), sea cual sea el signo de la carga.` });
    if (Math.abs(u) < 1e-9 * vd) {
      pasos.push({ t: 'Movimiento', html: `Su velocidad inicial es justo E/B: las dos fuerzas se anulan y sigue en línea recta (es el selector de velocidades).` });
      return { modo: 'cruzados', P, E, B, v0, vd, w, T, u: 0, R: 0, h: 0, vmax: vd, avance: vd * T, sube, pasos };
    }
    pasos.push({ t: 'En el sistema que avanza', html: `Allí la partícula tiene velocidad $u = v_0 − v_d$ = ${f(u)} m/s y solo nota el campo B: gira en una circunferencia de radio $R = {m |u|}/{|q| B}$ = <b>${f(R)} m</b> con $ω = {|q| B}/m$ = ${f(w)} rad/s y periodo T = <b>${f(T)} s</b>.` });
    const h = 2 * R, vmax = vd + Math.abs(u), avance = vd * T;
    pasos.push({ t: 'Trayectoria', html: `Sumando el avance, ${Math.abs(Math.abs(u) - vd) < 1e-9 * vd ? `${v0 === 0 ? 'parte del reposo y ' : ''}describe una <b>cicloide</b> (con picos en los que se para)` : Math.abs(u) > vd ? 'describe una <b>trocoide con bucles</b> (a ratos va hacia atrás)' : 'describe una <b>cicloide acortada</b>, ondulada y sin pararse'}: $x(t) = v_d t + u/ω sen(ω t)$, $y(t) = u/ω (cos(ω t) − 1)$, con ω = qB/m con su signo. Se aleja como mucho $h = 2R$ = <b>${f(h)} m</b> ${sube ? 'hacia arriba' : 'hacia abajo'} de la recta inicial, avanza ${f(avance)} m en cada periodo y su rapidez máxima es $v_d + |u|$ = <b>${f(vmax)} m/s</b>.` });
    if (v0 === 0) pasos.push({ t: 'Comprobación con la energía', html: `En lo más alto ha ganado $E_c = |q| E h = ${f(aq)}·${f(E)}·${f(h)}$ = ${f(aq * E * h)} J, y $1/2 m (2E/B)^2$ = ${f(0.5 * P.m * vmax * vmax)} J: lo mismo, porque B no hace trabajo.` });
    return { modo: 'cruzados', P, E, B, v0, vd, w, T, u, R, h, vmax, avance, sube, pasos };
  }

  /* ---------- Efecto Hall ---------- */
  // sc: { portador: 'electrones'|'huecos', I, B, sentidoB, t (grosor, en la dirección de B), w (anchura, opcional), dato: 'n'|'VH', n, VH }
  function hall(sc) {
    const pasos = [], I = num(sc, 'I', 'la corriente I'), B = num(sc, 'B', 'el campo B'), t = num(sc, 't', 'el grosor t'), w = num(sc, 'w', 'la anchura', { opcional: true }), e = sc.portador === 'huecos';
    let n, VH;
    if (sc.dato === 'VH') { VH = num(sc, 'VH', 'la tensión Hall'); n = (I * B) / (E0 * t * VH); pasos.push({ t: 'Densidad de portadores', html: `De $V_H = {I B}/{n e t}$ se despeja $n = {I B}/{e t V_H} = {${f(I)}·${f(B)}}/{${f(E0)}·${f(t)}·${f(VH)}}$ = <b>${f(n)} m<sup>−3</sup></b>.` }); }
    else { n = num(sc, 'n', 'la densidad de portadores n'); VH = (I * B) / (n * E0 * t); pasos.push({ t: 'Tensión Hall', html: `En equilibrio la fuerza eléctrica del campo Hall anula la magnética: $e E_H = e v_d B$. Con $I = n e v_d w t$ y $V_H = E_H w$ queda $V_H = {I B}/{n e t} = {${f(I)}·${f(B)}}/{${f(n)}·${f(E0)}·${f(t)}}$ = <b>${f(VH)} V</b>. No depende de la anchura.` }); }
    const RH = (e ? 1 : -1) / (n * E0);
    pasos.push({ t: 'Coeficiente de Hall', html: `$R_H = 1/{n q}$ = <b>${f(RH)} m<sup>3</sup>/C</b>, ${e ? 'positivo porque los portadores son huecos' : 'negativo porque los portadores son electrones'}.` });
    let vd = null, EH = null;
    if (w !== null) { vd = I / (n * E0 * w * t); EH = VH / w; pasos.push({ t: 'Velocidad de arrastre y campo Hall', html: `$v_d = I/{n e w t}$ = <b>${f(vd)} m/s</b> y $E_H = {V_H}/w = v_d B$ = <b>${f(EH)} V/m</b>.` }); }
    // corriente hacia la derecha: la fuerza magnética lleva a los portadores arriba con B entrante (sean electrones o huecos)
    const arriba = sc.sentidoB !== 'saliente', alta = (e === arriba) ? 'de arriba' : 'de abajo';
    pasos.push({ t: 'Qué cara queda a más potencial', html: `Con la corriente hacia la derecha y B ${arriba ? 'entrante (⊗)' : 'saliente (⊙)'}, F = q v × B lleva a los portadores hacia ${arriba ? 'arriba' : 'abajo'} tanto si son electrones (q < 0 y v hacia la izquierda) como huecos. Allí se acumulan: ${e ? 'los huecos dejan positiva' : 'los electrones dejan negativa'} esa cara, y la cara <b>${alta}</b> queda a más potencial. Así se sabe el signo de los portadores.` });
    return { modo: 'hall', I, B, t, w, n, VH, RH, vd, EH, huecos: e, arriba, alta, sentidoB: sc.sentidoB, pasos };
  }

  /* ---------- Par sobre una espira ---------- */
  // sc: { N, I, forma: 'rect'|'circ', a, b, R, B, th (ángulo entre la normal y B) }
  function espira(sc) {
    const pasos = [], N = num(sc, 'N', 'el número de vueltas N', { def: 1 }), I = num(sc, 'I', 'la corriente I'), B = num(sc, 'B', 'el campo B'), th = num(sc, 'th', 'el ángulo entre la normal y B', { cero: true, def: 90 }), circ = sc.forma === 'circ';
    if (th > 180) throw new Error('El ángulo entre la normal y B tiene que estar entre 0° y 180°');
    let S, a, b, R;
    if (circ) { R = num(sc, 'R', 'el radio R'); S = Math.PI * R * R; }
    else { a = num(sc, 'a', 'el lado a'); b = num(sc, 'b', 'el lado b'); S = a * b; }
    const rad = (th * Math.PI) / 180, s = Math.abs(Math.sin(rad)) < 1e-12 ? 0 : Math.sin(rad), c = Math.abs(Math.cos(rad)) < 1e-12 ? 0 : Math.cos(rad), m = N * I * S, tau = m * B * s, Ue = -m * B * c, W = m * B * (1 - c);
    pasos.push({ t: 'Momento magnético', html: `$S = ${circ ? `π R^2 = π·${f(R)}^2` : `a b = ${f(a)}·${f(b)}`}$ = ${f(S)} m<sup>2</sup> y $m = N I S = ${f(N)}·${f(I)}·${f(S)}$ = <b>${f(m)} A·m<sup>2</sup></b>, perpendicular a la espira (regla de la mano derecha con la corriente).` });
    if (!circ) pasos.push({ t: 'Fuerzas sobre los lados', html: `Los lados a (perpendiculares a B) sufren $F = N I a B$ = ${f(N * I * a * B)} N, iguales y opuestas: no desplazan la espira, pero forman un par de brazo b sen θ. Las de los lados b se anulan en la misma recta.` });
    pasos.push({ t: 'Par', html: `$τ = m × B$, $|τ| = m B sen θ = N I S B sen θ = ${f(m)}·${f(B)}${th === 90 ? '' : `·sen ${f(th)}°`}$ = <b>${f(tau)} N·m</b>. ${s ? 'Tiende a girar la espira para poner m paralelo a B.' : 'Es nulo: m es paralelo (o antiparalelo) a B.'} El par máximo, con la normal perpendicular a B, es ${f(m * B)} N·m.` });
    pasos.push({ t: 'Energía', html: `$U = −m · B = −m B cos θ$ = <b>${f(Ue)} J</b>. El equilibrio estable es θ = 0° (U = −mB) y el inestable θ = 180°. Para llevarla desde θ = 0° hasta ${f(th)}° hay que hacer $W = m B (1 − cos θ)$ = <b>${f(W)} J</b>.` });
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
    { clave: 'proton', nombre: 'Protón que entra perpendicular a B', sc: { modo: 'carga', part: 'proton', ...P0, uv: 'ms', v: '2e6', B: '0,5', th: '90', sentidoB: 'entrante' } },
    { clave: 'electron', nombre: 'Electrón acelerado por 1000 V', sc: { modo: 'carga', part: 'electron', ...P0, uv: 'V', v: '1000', B: '0,01', th: '90', sentidoB: 'saliente' } },
    { clave: 'helice', nombre: 'Protón a 60° del campo: hélice', sc: { modo: 'carga', part: 'proton', ...P0, uv: 'ms', v: '5e5', B: '0,2', th: '60', sentidoB: 'entrante' } },
    { clave: 'alfa', nombre: 'Partícula α de 5 MeV', sc: { modo: 'carga', part: 'alfa', ...P0, uv: 'eV', v: '5e6', B: '1', th: '90', sentidoB: 'entrante' } },
    { clave: 'vec-proton', nombre: 'F = q v × B de un protón', sc: { modo: 'vectorial', part: 'proton', ...P0, vx: '2e5', vy: '3e5', vz: '0', Bx: '0', By: '0', Bz: '0,5', Ex: '', Ey: '', Ez: '' } },
    { clave: 'vec-electron', nombre: 'Electrón con B en dos direcciones', sc: { modo: 'vectorial', part: 'electron', ...P0, vx: '1e6', vy: '0', vz: '0', Bx: '0', By: '0,2', Bz: '0,3', Ex: '', Ey: '', Ez: '' } },
    { clave: 'vec-lorentz', nombre: 'Fuerza de Lorentz con E y B', sc: { modo: 'vectorial', part: 'otra', q: '2e-6', m: '1e-9', vx: '0', vy: '400', vz: '0', Bx: '0,1', By: '0', Bz: '0', Ex: '0', Ey: '0', Ez: '50' } },
    { clave: 'tray-helice', nombre: 'Protón con E y B paralelos: hélice que acelera (FU-1)', sc: { modo: 'trayectoria', part: 'proton', ...P0, vx: '1e5', vy: '0', vz: '1e5', Bx: '0', By: '0', Bz: '0,1', Ex: '0', Ey: '0', Ez: '50', tt: '' } },
    { clave: 'tray-deriva', nombre: 'Electrón con E y B cruzados e inclinados: deriva (FU-1)', sc: { modo: 'trayectoria', part: 'electron', ...P0, vx: '2e5', vy: '0', vz: '1e5', Bx: '0', By: '0', Bz: '0,01', Ex: '300', Ey: '0', Ez: '0', tt: '' } },
    { clave: 'tray-general', nombre: 'Partícula con B y E en direcciones cualesquiera (FU-1)', sc: { modo: 'trayectoria', part: 'alfa', ...P0, vx: '1e5', vy: '2e5', vz: '5e4', Bx: '0,05', By: '0,02', Bz: '0,1', Ex: '200', Ey: '-100', Ez: '300', tt: '' } },
    { clave: 'espejo-atrapada', nombre: 'Electrón atrapado en una botella magnética (FU-3)', sc: { modo: 'espejo', part: 'electron', ...P0, uv: 'eV', v: '100', B0: '0,01', Rm: '4', L: '0,5', al: '45' } },
    { clave: 'espejo-escapa', nombre: 'Electrón que escapa por el cono de pérdidas (FU-3)', sc: { modo: 'espejo', part: 'electron', ...P0, uv: 'eV', v: '100', B0: '0,01', Rm: '4', L: '0,5', al: '20' } },
    { clave: 'selector', nombre: 'Selector de velocidades y espectrómetro', sc: { modo: 'selector', part: 'proton', ...P0, uv: 'ms', v: '', E: '1e5', B: '0,2', B2: '0,5' } },
    { clave: 'isotopos', nombre: 'Espectrómetro: separación de dos isótopos', sc: { modo: 'selector', part: 'otra', q: '1,602e-19', m: '1,993e-26', uv: 'ms', v: '', E: '4e4', B: '0,1', B2: '0,5', m2: '13' } },
    { clave: 'selector-rapido', nombre: 'Electrón demasiado rápido en el selector', sc: { modo: 'selector', part: 'electron', ...P0, uv: 'ms', v: '3e6', E: '2e4', B: '0,01', B2: '' } },
    { clave: 'ciclotron', nombre: 'Ciclotrón de protones', sc: { modo: 'ciclotron', part: 'proton', ...P0, B: '1,5', R: '0,5', V: '5e4' } },
    { clave: 'ciclotron-d', nombre: 'Ciclotrón de deuterones', sc: { modo: 'ciclotron', part: 'deuteron', ...P0, B: '1', R: '0,6', V: '1e4' } },
    { clave: 'franja-cruza', nombre: 'Protón que cruza una franja de campo', sc: { modo: 'franja', part: 'proton', ...P0, uv: 'ms', v: '1e6', B: '0,2', sentidoB: 'entrante', d: '0,03' } },
    { clave: 'franja-vuelve', nombre: 'Electrón que no logra cruzar la franja', sc: { modo: 'franja', part: 'electron', ...P0, uv: 'eV', v: '500', B: '0,002', sentidoB: 'entrante', d: '0,05' } },
    { clave: 'cicloide', nombre: 'Protón en reposo en E y B cruzados: cicloide', sc: { modo: 'cruzados', part: 'proton', ...P0, E: '1000', B: '0,01', v0: '' } },
    { clave: 'trocoide', nombre: 'Electrón con velocidad inicial en E y B cruzados', sc: { modo: 'cruzados', part: 'electron', ...P0, E: '2000', B: '0,001', v0: '5e6' } },
    { clave: 'hall-cobre', nombre: 'Tensión Hall en una lámina de cobre', sc: { modo: 'hall', portador: 'electrones', I: '20', B: '1,5', sentidoB: 'entrante', t: '1e-4', w: '0,02', dato: 'n', n: '8,5e28', VH: '' } },
    { clave: 'hall-semi', nombre: 'Densidad de huecos de un semiconductor', sc: { modo: 'hall', portador: 'huecos', I: '0,01', B: '0,5', sentidoB: 'entrante', t: '1e-3', w: '5e-3', dato: 'VH', n: '', VH: '3e-3' } },
    { clave: 'espira-rect', nombre: 'Par sobre una bobina rectangular', sc: { modo: 'espira', N: '50', I: '2', forma: 'rect', a: '0,1', b: '0,05', R: '', B: '0,4', th: '30' } },
    { clave: 'espira-circ', nombre: 'Espira circular con la normal perpendicular a B', sc: { modo: 'espira', N: '1', I: '5', forma: 'circ', a: '', b: '', R: '0,1', B: '0,2', th: '90' } },
    { clave: 'hilo', nombre: 'Hilo con corriente en un campo', sc: { modo: 'hilo', I: '5', L: '0,5', B: '0,4', th: '90', sentidoB: 'entrante', sentidoI: 'derecha', m: '' } },
    { clave: 'hilo-flota', nombre: 'Corriente para que un hilo flote', sc: { modo: 'hilo', I: '2', L: '0,2', B: '0,5', th: '90', sentidoB: 'saliente', sentidoI: 'izquierda', m: '0,01' } },
    { clave: 'paralelos', nombre: 'Dos hilos con corrientes en el mismo sentido', sc: { modo: 'paralelos', I1: '10', I2: '5', d: '0,1', L: '1', sentido: 'mismo' } },
    { clave: 'antiparalelos', nombre: 'Dos hilos con corrientes contrarias', sc: { modo: 'paralelos', I1: '20', I2: '20', d: '0,05', L: '', sentido: 'opuesto' } },
  ];

  return { resolver, rk4, carga, vectorial, trayectoria, espejo, selector, ciclotron, franja, cruzados, hall, espira, hilo, paralelos, ejemplos, f, PART, E0, U, MU0 };
})();
if (typeof module !== 'undefined') module.exports = Fuerza;
