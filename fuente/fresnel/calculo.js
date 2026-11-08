/* =====================================================================
   Reflexión y transmisión de Fresnel (sin DOM): una onda plana llega con
   un ángulo θi a la frontera plana entre dos medios dieléctricos (n1 y n2,
   o ε y μ relativas). Da el ángulo de refracción (ley de Snell), los
   coeficientes r y t de las dos polarizaciones (⊥ = TE, E perpendicular al
   plano de incidencia; ∥ = TM, E en el plano), las reflectancias R y
   transmitancias T, el ángulo de Brewster, el ángulo crítico y, si hay
   reflexión total, los desfases y la profundidad de la onda evanescente.
   Convenio de signos: los dos campos E se miden como en la figura, de modo
   que con incidencia normal r⊥ = r∥ = (n1 − n2)/(n1 + n2) en medios no
   magnéticos. La interfaz está en app.js y la prueba en
   pruebas/herramientas/fresnel.js.
     resolver(sc)  datos del formulario (texto) → { …resultados, pasos }; lanza
                   un Error con un mensaje para el usuario si falta o falla algo
     curva(sol, grados)  { Rp, Rl } (⊥ y ∥) a cualquier ángulo, para la gráfica
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     f(x)          número con coma decimal y ·10<sup>n</sup>
   ===================================================================== */
const Fresnel = (() => {
  const RAD = Math.PI / 180;
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // acepta coma decimal, 3e8 y 3·10^8
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const mayus = (t) => t[0].toUpperCase() + t.slice(1);
  function lee(sc, k, nom, { opcional = false, defecto = null, positivo = true } = {}) {
    if (vacio(sc[k])) { if (opcional) return defecto; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${mayus(nom)} debe ser un número`);
    if (positivo && v <= 0) throw new Error(`${mayus(nom)} debe ser mayor que 0`);
    return v;
  }

  // medio: índice n = √(εr μr) e impedancia relativa e = η/η0 = √(μr/εr)
  function medio(sc, i) {
    if ((sc.dato || 'n') === 'n') { const n = lee(sc, 'n' + i, `el índice de refracción n${i}`); return { n, e: 1 / n, er: n * n, mr: 1 }; }
    const er = lee(sc, 'er' + i, `la permitividad relativa ε${i}`), mr = lee(sc, 'mr' + i, `la permeabilidad relativa μ${i}`, { opcional: true, defecto: 1 });
    return { n: Math.sqrt(er * mr), e: Math.sqrt(mr / er), er, mr };
  }

  // coeficientes reales (sin reflexión total) con admitancias e1 y e2 (η/η0), cosenos ci y ct
  function coef(e1, e2, ci, ct) {
    const dp = e2 * ci + e1 * ct, dl = e2 * ct + e1 * ci;
    const rp = (e2 * ci - e1 * ct) / dp, tp = (2 * e2 * ci) / dp, rl = (e2 * ct - e1 * ci) / dl, tl = (2 * e2 * ci) / dl;
    const k = (e1 * ct) / (e2 * ci);
    return { rp, tp, rl, tl, Rp: rp * rp, Rl: rl * rl, Tp: k * tp * tp, Tl: k * tl * tl };
  }
  // sen²θ en la que se anula r (⊥ o ∥) o null si no existe entre 0° y 90°
  function brewster(m1, m2, pol) {
    const k = (m1.n * m1.n) / (m2.n * m2.n), a = m2.e * m2.e - m1.e * m1.e;
    const den = pol === 'p' ? m2.e * m2.e - m1.e * m1.e * k : m2.e * m2.e * k - m1.e * m1.e;
    if (Math.abs(a) < 1e-12 || Math.abs(den) < 1e-12) return null;
    const S = a / den;
    if (!(S > 1e-9 && S < 1 - 1e-9) || k * S > 1) return null;
    return Math.asin(Math.sqrt(S)) / RAD;
  }
  // reflectancias a cualquier ángulo (en grados), para dibujar las curvas
  function curva(sol, g) {
    const m1 = sol.m1, m2 = sol.m2, ci = Math.cos(g * RAD), s = (m1.n / m2.n) * Math.sin(g * RAD);
    if (s >= 1) return { Rp: 1, Rl: 1 };
    const c = coef(m1.e, m2.e, ci, Math.sqrt(1 - s * s));
    return { Rp: c.Rp, Rl: c.Rl };
  }

  // R, T y fase de la reflexión (grados) de las dos polarizaciones a cualquier ángulo: gráficas de FR-3
  function curvaFull(sol, g) {
    const m1 = sol.m1, m2 = sol.m2, ci = Math.cos(g * RAD), s = (m1.n / m2.n) * Math.sin(g * RAD);
    if (s >= 1) {
      const q = Math.sqrt(s * s - 1), a = Math.atan((m1.e * q) / (m2.e * ci)), b = Math.atan((m2.e * q) / (m1.e * ci));
      return { Rp: 1, Rl: 1, Tp: 0, Tl: 0, fp: (-2 * a) / RAD, fl: 180 - (2 * b) / RAD, tot: true };
    }
    const c = coef(m1.e, m2.e, ci, Math.sqrt(1 - s * s));
    return { Rp: c.Rp, Rl: c.Rl, Tp: c.Tp, Tl: c.Tl, fp: c.rp < 0 ? 180 : 0, fl: c.rl < 0 ? 180 : 0, tot: false };
  }

  /* ---- Capas delgadas (FR-1): matriz característica de cada capa, medios sin pérdidas y no magnéticos ---- */
  const Cx = { sum: (a, b) => [a[0] + b[0], a[1] + b[1]], mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; }, abs2: (a) => a[0] * a[0] + a[1] * a[1] };
  const cosC = (n1, nj, sinI) => { const q = 1 - ((n1 * sinI) / nj) ** 2; return q >= 0 ? [Math.sqrt(q), 0] : [0, Math.sqrt(-q)]; };
  const chC = (z) => [Math.cos(z[0]) * Math.cosh(z[1]), -Math.sin(z[0]) * Math.sinh(z[1])], shC = (z) => [Math.sin(z[0]) * Math.cosh(z[1]), Math.cos(z[0]) * Math.sinh(z[1])];
  // capas [{ n, d (nm) }] entre n1 y n2; { Rp, Rl, Tp, Tl } a la longitud de onda lam (nm) y al ángulo th (grados)
  function capasRT(n1, n2, capas, lam, th) {
    const si = Math.sin(th * RAD), out = {};
    for (const pol of ['p', 'l']) {
      const eta = (n, ct) => (pol === 'p' ? [n * ct[0], n * ct[1]] : Cx.div([n, 0], ct)); // ⊥: n cos θ; ∥: n / cos θ
      const e1 = eta(n1, cosC(n1, n1, si)), es = eta(n2, cosC(n1, n2, si)), j = [0, 1];
      let M = [[[1, 0], [0, 0]], [[0, 0], [1, 0]]];
      for (const cp of capas) {
        const ct = cosC(n1, cp.n, si), ej = eta(cp.n, ct), k = (2 * Math.PI * cp.n * cp.d) / lam, dC = [k * ct[0], k * ct[1]];
        const cs = chC(dC), ss = shC(dC), m12 = Cx.mul(Cx.div(j, ej), ss), m21 = Cx.mul(Cx.mul(j, ej), ss);
        M = [[Cx.sum(Cx.mul(M[0][0], cs), Cx.mul(M[0][1], m21)), Cx.sum(Cx.mul(M[0][0], m12), Cx.mul(M[0][1], cs))], [Cx.sum(Cx.mul(M[1][0], cs), Cx.mul(M[1][1], m21)), Cx.sum(Cx.mul(M[1][0], m12), Cx.mul(M[1][1], cs))]];
      }
      const B = Cx.sum(M[0][0], Cx.mul(M[0][1], es)), Cc = Cx.sum(M[1][0], Cx.mul(M[1][1], es)), eB = Cx.mul(e1, B);
      const num = [eB[0] - Cc[0], eB[1] - Cc[1]], den = [eB[0] + Cc[0], eB[1] + Cc[1]];
      out['R' + pol] = Math.min(1, Math.max(0, Cx.abs2(num) / Cx.abs2(den))); out['T' + pol] = Math.min(1, Math.max(0, (4 * e1[0] * es[0]) / Cx.abs2(den)));
    }
    return out;
  }
  // capas del formulario: nc (0 a 3), c1n, c1d, … («λ/4» = cuarto de onda a la λ dada y a incidencia normal)
  function leeCapas(sc, lam) {
    const nc = Math.min(3, Math.max(0, Math.round(vacio(sc.nc) ? 0 : leeNum(sc.nc)) || 0)), out = [];
    for (let i = 1; i <= nc; i++) {
      const n = lee(sc, 'c' + i + 'n', 'el índice de la capa ' + i), t = String(sc['c' + i + 'd'] ?? '').trim().toLowerCase().replace(/\s/g, '');
      let d;
      if (/^(λ|l)\/4$/.test(t)) d = lam ? lam / (4 * n) : NaN; else if (/^(λ|l)\/2$/.test(t)) d = lam ? lam / (2 * n) : NaN; else d = lee(sc, 'c' + i + 'd', 'el espesor de la capa ' + i + ' (nm)');
      out.push({ n, d });
    }
    return out;
  }

  function resolver(sc) {
    const m1 = medio(sc, 1), m2 = medio(sc, 2);
    const th = lee(sc, 'theta', 'el ángulo de incidencia', { positivo: false });
    if (th < 0 || th >= 90) throw new Error('El ángulo de incidencia debe estar entre 0° y 90° (sin llegar a 90°)');
    const E0 = lee(sc, 'E0', 'la amplitud incidente', { opcional: true });
    const lam0 = lee(sc, 'lambda', 'la longitud de onda en el vacío', { opcional: true });
    const ci = Math.cos(th * RAD), si = Math.sin(th * RAD), s = (m1.n / m2.n) * si, tot = s > 1 + 1e-12;
    const thc = m2.n < m1.n ? Math.asin(m2.n / m1.n) / RAD : null;
    const thBl = brewster(m1, m2, 'l'), thBp = brewster(m1, m2, 'p');
    const rN = (m2.e - m1.e) / (m2.e + m1.e), RN = rN * rN;
    const sol = { m1, m2, th, E0, lam0, tot, thc, thBl, thBp, RN, rN };
    const pasos = [];
    const dat = sc.dato === 'er' ? `$ε_1 = ${f(m1.er)}$, $μ_1 = ${f(m1.mr)}$, $ε_2 = ${f(m2.er)}$, $μ_2 = ${f(m2.mr)}$` : `$n_1 = ${f(m1.n)}$, $n_2 = ${f(m2.n)}$`;
    pasos.push({ t: 'Datos', html: `${dat}, $θ_i = ${f(th)}°$${E0 ? `, $E_0 = ${f(E0)} "V/m"$` : ''}. El plano de incidencia es el que forman el rayo y la normal; ⊥ (TE) es E perpendicular a él y ∥ (TM) es E dentro de él.` });
    if (sc.dato === 'er') pasos.push({ t: 'Índice e impedancias', html: `$n = √(ε_r μ_r)$: $n_1 = ${f(m1.n)}$, $n_2 = ${f(m2.n)}$. $η/η_0 = √(μ_r/ε_r)$: $η_1 = ${f(m1.e)} η_0$, $η_2 = ${f(m2.e)} η_0$ (con $η_0 = 376,7 "Ω"$).` });
    pasos.push({ t: 'Ley de Snell', html: `$n_1 sen θ_i = n_2 sen θ_t$ ⇒ $sen θ_t = ${f(m1.n)}/${f(m2.n)} · sen ${f(th)}° = ${f(s)}$${tot ? ', que es mayor que 1: no hay ángulo de refracción real, hay <b>reflexión total</b>.' : ` ⇒ <b>$θ_t = ${f(Math.asin(Math.min(1, s)) / RAD)}°$</b>`}` });
    if (!tot) {
      const ct = Math.sqrt(Math.max(0, 1 - s * s)), c = coef(m1.e, m2.e, ci, ct), tt = Math.asin(Math.min(1, s)) / RAD;
      Object.assign(sol, c, { tt, ci, ct, Rm: (c.Rp + c.Rl) / 2, Tm: (c.Tp + c.Tl) / 2 });
      pasos.push({ t: 'Coeficientes de Fresnel ⊥ (TE)', html: `$r_⊥ = {η_2 cos θ_i − η_1 cos θ_t}/{η_2 cos θ_i + η_1 cos θ_t} = {${f(m2.e)}·${f(ci)} − ${f(m1.e)}·${f(ct)}}/{${f(m2.e)}·${f(ci)} + ${f(m1.e)}·${f(ct)}}$ = <b>${f(c.rp)}</b><br>$t_⊥ = {2 η_2 cos θ_i}/{η_2 cos θ_i + η_1 cos θ_t}$ = <b>${f(c.tp)}</b>` });
      pasos.push({ t: 'Coeficientes de Fresnel ∥ (TM)', html: `$r_∥ = {η_2 cos θ_t − η_1 cos θ_i}/{η_2 cos θ_t + η_1 cos θ_i} = {${f(m2.e)}·${f(ct)} − ${f(m1.e)}·${f(ci)}}/{${f(m2.e)}·${f(ct)} + ${f(m1.e)}·${f(ci)}}$ = <b>${f(c.rl)}</b><br>$t_∥ = {2 η_2 cos θ_i}/{η_2 cos θ_t + η_1 cos θ_i}$ = <b>${f(c.tl)}</b>` });
      pasos.push({ t: 'Reflectancia y transmitancia', html: `$R = r^2$ y $T = {η_1 cos θ_t}/{η_2 cos θ_i} t^2$ (la potencia depende de la sección que ve el haz).<br>⊥: $R_⊥ = ${f(c.Rp)}$ = <b>${f(100 * c.Rp, 3)} %</b>, $T_⊥ = ${f(c.Tp)}$ = <b>${f(100 * c.Tp, 3)} %</b><br>∥: $R_∥ = ${f(c.Rl)}$ = <b>${f(100 * c.Rl, 3)} %</b>, $T_∥ = ${f(c.Tl)}$ = <b>${f(100 * c.Tl, 3)} %</b><br>Se cumple $R + T = 1$ en las dos. Luz natural (sin polarizar): $R = {R_⊥ + R_∥}/2 = ${f(100 * sol.Rm, 3)} %$.` });
      if (E0) {
        sol.amp = { rp: c.rp * E0, tp: c.tp * E0, rl: c.rl * E0, tl: c.tl * E0 };
        pasos.push({ t: 'Amplitudes de los campos', html: `⊥: $E_r = r_⊥ E_0 = ${f(sol.amp.rp)} "V/m"$, $E_t = t_⊥ E_0 = ${f(sol.amp.tp)} "V/m"$<br>∥: $E_r = r_∥ E_0 = ${f(sol.amp.rl)} "V/m"$, $E_t = t_∥ E_0 = ${f(sol.amp.tl)} "V/m"$<br>Un signo negativo quiere decir que el campo reflejado está en oposición de fase con el incidente (cambia de sentido en la frontera).` });
      }
    } else {
      const g = Math.sqrt(s * s - 1), a = Math.atan((m1.e * g) / (m2.e * ci)), b = Math.atan((m2.e * g) / (m1.e * ci));
      const fp = -2 * a / RAD, fl = 180 - 2 * b / RAD;
      Object.assign(sol, { g, fp, fl, dif: fl - fp, Rp: 1, Rl: 1, Tp: 0, Tl: 0, Rm: 1, Tm: 0 });
      const num = (m2.e * ci) ** 2 + (m1.e * g) ** 2, num2 = (m1.e * ci) ** 2 + (m2.e * g) ** 2;
      sol.tpAbs = (2 * m2.e * ci) / Math.sqrt(num); sol.tlAbs = (2 * m2.e * ci) / Math.sqrt(num2);
      pasos.push({ t: 'Reflexión total', html: `Ahora $cos θ_t = ±j √(sen^2 θ_t − 1) = ±j ${f(g)}$ es imaginario: la onda del segundo medio no se propaga, decae con la profundidad (onda evanescente). Los coeficientes son números complejos de módulo 1: $|r_⊥| = |r_∥| = 1$, así que <b>$R = 100 %$</b> y <b>$T = 0$</b> (no pasa energía).` });
      pasos.push({ t: 'Desfase de la reflexión', html: `$r_⊥ = {η_2 cos θ_i − j η_1 ${f(g)}}/{η_2 cos θ_i + j η_1 ${f(g)}}$ ⇒ fase <b>$φ_⊥ = −2 arctg {η_1 ${f(g)}}/{η_2 cos θ_i} = ${f(fp)}°$</b><br>$r_∥ = {j η_2 ${f(g)} − η_1 cos θ_i}/{j η_2 ${f(g)} + η_1 cos θ_i}$ ⇒ fase <b>$φ_∥ = 180° − 2 arctg {η_2 ${f(g)}}/{η_1 cos θ_i} = ${f(fl)}°$</b><br>Diferencia entre las dos polarizaciones: <b>$φ_∥ − φ_⊥ = ${f(sol.dif)}°$</b> (con ella la luz linealmente polarizada se vuelve elíptica o circular).` });
      if (lam0) {
        sol.prof = lam0 * 1e-9 / (2 * Math.PI * m2.n * g);
        pasos.push({ t: 'Onda evanescente', html: `En el segundo medio el campo cae como $e^{−z/d}$ con $d = {λ_0}/{2π n_2 √(sen^2 θ_t − 1)} = {${f(lam0)} "nm"}/{2π · ${f(m2.n)} · ${f(g)}}$ = <b>${f(sol.prof * 1e9)} nm</b>. En la frontera su amplitud es $|t_⊥| E_0$ y $|t_∥| E_0$ (${f(sol.tpAbs)} y ${f(sol.tlAbs)} veces la incidente).` });
      }
    }
    // ángulos característicos
    const car = [];
    if (thBl !== null) car.push(`ángulo de Brewster (∥): $tg θ_B = n_2/n_1$ ⇒ <b>$θ_B = ${f(thBl)}°$</b>; con ese ángulo $r_∥ = 0$ y la luz reflejada sale polarizada ⊥`);
    if (thBp !== null) car.push(`ángulo de Brewster (⊥): <b>$θ_B = ${f(thBp)}°$</b> (solo ocurre con $μ_r ≠ 1$)`);
    if (thBl === null && thBp === null) car.push('no hay ángulo de Brewster en esta frontera (los dos medios tienen la misma impedancia o no existe antes de la reflexión total)');
    car.push(thc !== null ? `ángulo crítico: $sen θ_c = n_2/n_1 = ${f(m2.n)}/${f(m1.n)}$ ⇒ <b>$θ_c = ${f(thc)}°$</b>; a partir de él hay reflexión total` : 'no hay ángulo crítico: hay reflexión total solo al pasar a un medio de menor índice');
    pasos.push({ t: 'Ángulos característicos', html: car.join('.<br>') + '.' });
    pasos.push({ t: 'Incidencia normal', html: `Con $θ_i = 0$ las dos polarizaciones coinciden: $r = {η_2 − η_1}/{η_2 + η_1} = ${f(rN)}$ y $R = r^2 = ${f(100 * RN, 3)} %$.` });
    const capas = leeCapas(sc, lam0);
    if (capas.length) {
      if (!lam0) throw new Error('Con capas delgadas hace falta la longitud de onda en el vacío (nm)');
      const rt = capasRT(m1.n, m2.n, capas, lam0, th), rN0 = capasRT(m1.n, m2.n, capas, lam0, 0), s0 = capasRT(m1.n, m2.n, [], lam0, th);
      sol.cap = { capas, ...rt, Rm: (rt.Rp + rt.Rl) / 2, Tm: (rt.Tp + rt.Tl) / 2, RN: rN0.Rp, lam: lam0, sin: s0 };
      const lista = capas.map((c, i) => `capa ${i + 1}: $n = ${f(c.n)}$, $d = ${f(c.d)} "nm"$ ($n d = ${f(c.n * c.d / lam0)} λ$)`).join('; ');
      pasos.push({ t: 'Capas delgadas (matriz de transferencia)', html: `${lista}. Cada capa aporta $M_j = [[cos δ_j, j sen δ_j/η_j],[j η_j sen δ_j, cos δ_j]]$ con $δ_j = {2π n_j d_j cos θ_j}/{λ}$ y $η_j = n_j cos θ_j$ (⊥) o $n_j/cos θ_j$ (∥). Con $[B, C]^T = M_1 M_2 ⋯ [1, η_s]^T$: $r = {η_0 B − C}/{η_0 B + C}$ y $T = {4 η_0 "Re"(η_s)}/{|η_0 B + C|^2}$.` });
      pasos.push({ t: 'Resultado con las capas', html: `A $λ = ${f(lam0)} "nm"$ y $θ_i = ${f(th)}°$: $R_⊥ = ${f(rt.Rp)}$, $R_∥ = ${f(rt.Rl)}$, $T_⊥ = ${f(rt.Tp)}$, $T_∥ = ${f(rt.Tl)}$; luz natural $R = ${f(100 * sol.cap.Rm, 4)} %$ frente a $${f(100 * (s0.Rp + s0.Rl) / 2, 4)} %$ sin capas. Con incidencia normal $R = ${f(100 * rN0.Rp, 4)} %$.` });
      if (capas.length === 1) {
        const nopt = Math.sqrt(m1.n * m2.n), dopt = lam0 / (4 * capas[0].n), Rc = ((m1.n * m2.n - capas[0].n ** 2) / (m1.n * m2.n + capas[0].n ** 2)) ** 2;
        sol.cap.nopt = nopt; sol.cap.dopt = dopt; sol.cap.Rcuarto = Rc;
        pasos.push({ t: 'Capa de cuarto de onda', html: `Con espesor $n d = λ/4$ ($d = ${f(dopt)} "nm"$) y incidencia normal, $R = ({n_1 n_2 − n^2}/{n_1 n_2 + n^2})^2 = ${f(100 * Rc, 4)} %$; se anula con el índice óptimo $n = √(n_1 n_2) = ${f(nopt)}$.` });
      }
    }
    sol.pasos = pasos;
    return sol;
  }

  const ejemplos = [
    { clave: 'aire-vidrio', nombre: 'Aire → vidrio (n = 1,5), 30°', sc: { dato: 'n', n1: '1', n2: '1,5', theta: '30', E0: '', lambda: '' } },
    { clave: 'normal', nombre: 'Incidencia normal, aire → vidrio', sc: { dato: 'n', n1: '1', n2: '1,5', theta: '0', E0: '10', lambda: '' } },
    { clave: 'brewster', nombre: 'Ángulo de Brewster, aire → vidrio', sc: { dato: 'n', n1: '1', n2: '1,5', theta: '56,31', E0: '', lambda: '' } },
    { clave: 'vidrio-aire', nombre: 'Vidrio → aire, 30° (sin reflexión total)', sc: { dato: 'n', n1: '1,5', n2: '1', theta: '30', E0: '', lambda: '' } },
    { clave: 'agua-aire', nombre: 'Agua → aire, 60° (reflexión total)', sc: { dato: 'n', n1: '1,33', n2: '1', theta: '60', E0: '', lambda: '600' } },
    { clave: 'radio-agua', nombre: 'Onda de radio sobre el agua (εr = 81)', sc: { dato: 'er', er1: '1', mr1: '1', er2: '81', mr2: '1', theta: '45', E0: '', lambda: '' } },
    { clave: 'antirreflejante', nombre: 'Antirreflejante de MgF₂ (n = 1,38, λ/4) sobre vidrio, 550 nm', sc: { dato: 'n', n1: '1', n2: '1,52', theta: '0', E0: '', lambda: '550', nc: '1', c1n: '1,38', c1d: 'λ/4', c2n: '', c2d: '', c3n: '', c3d: '' } },
    { clave: 'espejo-dielectrico', nombre: 'Espejo dieléctrico de 3 capas ZnS/MgF₂/ZnS (λ/4) a 550 nm', sc: { dato: 'n', n1: '1', n2: '1,52', theta: '0', E0: '', lambda: '550', nc: '3', c1n: '2,35', c1d: 'λ/4', c2n: '1,38', c2d: 'λ/4', c3n: '2,35', c3d: 'λ/4' } },
  ];

  return { resolver, curva, curvaFull, capasRT, ejemplos, f };
})();
if (typeof module !== 'undefined') module.exports = Fresnel;
