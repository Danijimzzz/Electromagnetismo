const Dinamica = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-9) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const RAD = Math.PI / 180;
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, min = 0, estricto = false, max = Infinity, signo = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} must be a number`);
    if (!signo && (estricto ? v <= min : v < min)) throw new Error(`${may(nom)} must be ${estricto ? 'greater than' : 'at least'} ${f(min)}`);
    if (v > max) throw new Error(`${may(nom)} cannot exceed ${f(max)}`);
    return v;
  }
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  function enTramos(tramos, t) {
    let x = 0, v = 0;
    for (const s of tramos) {
      const tt = Math.min(Math.max(t - s.t0, 0), s.dur);
      x = s.x0 + s.v0 * tt + 0.5 * s.a * tt * tt; v = s.v0 + s.a * tt;
      if (t < s.t0 + s.dur) break;
    }
    return { x, v };
  }

  function plano(sc) {
    const g = lee(sc, 'g', 'gravity', { estricto: true });
    const m1 = lee(sc, 'm1', 'the mass of the block', { estricto: true }), th = lee(sc, 'theta', 'the angle of the plane', { max: 90 });
    const mus = lee(sc, 'mus', 'the coefficient of static friction', { opcional: true }) ?? 0;
    let muk = lee(sc, 'muk', 'the coefficient of kinetic friction', { opcional: true }) ?? 0;
    const amed = lee(sc, 'amed', 'the measured acceleration', { opcional: true });
    if (amed === null && muk > mus) throw new Error('The kinetic coefficient cannot be greater than the static one');
    const F = lee(sc, 'F', 'the applied force', { opcional: true }) ?? 0, al = vacio(sc.alfa) ? 0 : leeNum(sc.alfa);
    if (!isFinite(al) || al < -90 || al > 90) throw new Error('The angle of the force must be between −90° and 90°');
    const m2 = lee(sc, 'm2', 'the hanging mass', { opcional: true, estricto: true }), d = lee(sc, 'd', 'the distance', { opcional: true, estricto: true });
    const v0 = lee(sc, 'v0', 'the initial speed', { opcional: true, signo: true }) ?? 0;
    const t = th * RAD, a = al * RAD, P1 = m1 * g, Px = P1 * Math.sin(t), Py = P1 * Math.cos(t), Fx = F * Math.cos(a), Fy = F * Math.sin(a);
    const P2 = m2 ? m2 * g : 0, M = m1 + (m2 || 0);
    const N = Py - Fy;
    const pasos = [];
    const inclinado = th > 0;
    const arriba = inclinado ? 'up the incline' : 'to the right', abajo = inclinado ? 'down the incline' : 'to the left';
    pasos.push({ t: 'Weight and its components', html: inclinado
      ? `$P = m_1 g = ${f(m1)} · ${f(g)}$ = <b>${f(P1)} N</b><br>$P_x = P sin θ = ${f(P1)} · sin ${f(th)}° = ${f(Px)} "N"$ (down the plane), &ensp; $P_y = P cos θ = ${f(P1)} · cos ${f(th)}° = ${f(Py)} "N"$`
      : `$P = m_1 g = ${f(m1)} · ${f(g)}$ = <b>${f(P1)} N</b>` });
    if (F) pasos.push({ t: 'Components of the applied force', html: `$F_x = F cos α = ${f(F)} · cos ${p(al)}° = ${f(Fx)} "N"$, &ensp; $F_y = F sin α = ${f(F)} · sin ${p(al)}° = ${f(Fy)} "N"$` });
    if (N < -1e-9) throw new Error(`The force lifts the block off the plane: F sin α = ${f(Fy).replace(/<[^>]+>/g, '')} N is greater than P${inclinado ? ' cos θ' : ''} = ${f(Py).replace(/<[^>]+>/g, '')} N`);
    const Py_ = inclinado ? 'P_y' : 'P';
    pasos.push({ t: 'Normal force (no motion perpendicular to the plane: ΣF<sub>y</sub> = 0)', html: Fy ? `$N + F_y − ${Py_} = 0 ⇒ N = ${f(Py)} − ${p(Fy)}$ = <b>${f(N)} N</b>` : `$N − ${Py_} = 0 ⇒ N = ${Py_}$ = <b>${f(N)} N</b>` });
    const D = Fx + P2 - Px;
    const terminos = [F ? 'F_x' : '', m2 ? 'P_2' : '', inclinado ? '− P_x' : ''].filter(Boolean).join(' + ').replace('+ −', '−');
    const valores = [F ? f(Fx) : '', m2 ? f(P2) : '', inclinado ? `− ${f(Px)}` : ''].filter(Boolean).join(' + ').replace('+ −', '−');
    if (m2) pasos.push({ t: 'Weight of the hanging mass', html: `$P_2 = m_2 g = ${f(m2)} · ${f(g)}$ = <b>${f(P2)} N</b>. The rope is inextensible and the pulley ideal: both bodies have the same acceleration and the tension is the same on both sides.` });
    pasos.push({ t: 'Forces along the plane not counting friction', html: terminos
      ? `$ΣF = ${terminos} = ${valores}$ = <b>${f(D)} N</b>${Math.abs(D) < 1e-9 ? ': it is in equilibrium' : D > 0 ? ` (${arriba})` : ` (${abajo})`}<br>Maximum static friction: $F_{f,max} = μ_s N = ${f(mus)} · ${f(N)}$ = <b>${f(mus * N)} N</b>`
      : 'There is no force along the plane.' });
    if (amed !== null) {
      if (Math.abs(D) < 1e-12) throw new Error('With no forces along the plane it cannot accelerate: μ cannot be obtained from the acceleration');
      if (N < 1e-12) throw new Error('With zero normal force there is no friction: μ cannot be obtained');
      muk = (Math.abs(D) - M * Math.abs(amed)) / N;
      if (muk < -1e-12) throw new Error(`With those forces the acceleration without friction would be ${f(Math.abs(D) / M).replace(/<[^>]+>/g, '')} m/s²: a larger measured acceleration is not possible`);
      muk = Math.max(0, muk);
      pasos.push({ t: 'Coefficient of friction from the measured acceleration', html: `It slides ${D > 0 ? arriba : abajo}, so $|ΣF| − μ_k N = ${m2 ? '(m_1 + m_2)' : 'm_1'} a ⇒ μ_k = {|ΣF| − ${m2 ? '(m_1 + m_2)' : 'm_1'} a}/N = {${f(Math.abs(D))} − ${f(M)} · ${f(Math.abs(amed))}}/{${f(N)}}$ = <b>${f(muk)}</b>` });
    }
    let tramos = [], tf = 0, xf = 0, fase1 = null;
    if (v0) {
      const s0 = Math.sign(v0), a1 = (D - s0 * muk * N) / M;
      const dir = s0 > 0 ? arriba : abajo;
      pasos.push({ t: `Launched ${dir} with $v_0 = ${f(Math.abs(v0))} "m/s"$`, html: `While it moves, kinetic friction opposes the velocity: $F_f = μ_k N = ${f(muk)} · ${f(N)} = ${f(muk * N)} "N"$ ${s0 > 0 ? (inclinado ? 'down the plane' : 'to the left') : (inclinado ? 'up the plane' : 'to the right')}.<br>$a_1 = {ΣF ${s0 > 0 ? '−' : '+'} F_f}/{${m2 ? 'm_1 + m_2' : 'm_1'}} = {${f(D)} ${s0 > 0 ? '−' : '+'} ${f(muk * N)}}/{${f(M)}}$ = <b>${f(a1)} m/s<sup>2</sup></b> (positive ${arriba})` });
      if (a1 * s0 < 0) {
        const t1 = -v0 / a1, x1 = -(v0 * v0) / (2 * a1);
        fase1 = { a: a1, t: t1, x: x1 };
        tramos.push({ t0: 0, x0: 0, v0, a: a1, dur: t1 }); tf = t1; xf = x1;
        pasos.push({ t: 'Until it stops', html: `$t_1 = |v_0/a_1| = ${f(Math.abs(v0))}/${f(Math.abs(a1))}$ = <b>${f(t1)} s</b>, &ensp; $s_1 = v_0^2/(2 |a_1|) = ${f(v0)}^2/(2 · ${f(Math.abs(a1))})$ = <b>${f(Math.abs(x1))} m</b> ${dir}. Then, once stopped, we check whether static friction holds it:` });
      } else {
        fase1 = { a: a1, t: Infinity, x: Infinity };
        tramos.push({ t0: 0, x0: 0, v0, a: a1, dur: Infinity });
        pasos.push({ t: 'It does not stop', html: `The acceleration is in the direction of the velocity${Math.abs(a1) < 1e-12 ? ' or is zero' : ''}: the block keeps going ${dir} ${Math.abs(a1) < 1e-12 ? 'at the same speed' : 'faster and faster'}.` });
      }
    }
    let estado, acel = 0, Fr = 0, sentido = 0;
    const Frmax = mus * N;
    if (!fase1 || isFinite(fase1.t)) {
      if (Math.abs(D) <= Frmax + 1e-9 && amed === null) {
        estado = 'reposo'; Fr = -D;
        pasos.push({ t: v0 ? 'Then it stays stopped' : 'It stays at rest', html: `Since $|ΣF| = ${f(Math.abs(D))} "N" ≤ ${f(Frmax)} "N"$, static friction holds it: $a = 0$ and friction is exactly $F_f = |ΣF|$ = <b>${f(Math.abs(D))} N</b>${Math.abs(D) > 1e-9 ? `, ${D > 0 ? (inclinado ? 'down the plane' : 'to the left') : (inclinado ? 'up the plane' : 'to the right')}` : ''} (not $μ_s N$, which is only the maximum).` });
        tramos.push({ t0: tf, x0: xf, v0: 0, a: 0, dur: Infinity });
      } else {
        estado = 'mueve'; sentido = Math.sign(D); Fr = -sentido * muk * N; acel = (D + Fr) / M;
        const Mt = m2 ? '(m_1 + m_2)' : 'm_1';
        if (amed === null) pasos.push({ t: v0 ? 'Then it moves again' : 'It moves: kinetic friction', html: `$|ΣF| = ${f(Math.abs(D))} "N" > ${f(Frmax)} "N"$, so the block slides ${sentido > 0 ? arriba : abajo} and friction opposes it: $F_f = μ_k N = ${f(muk)} · ${f(N)}$ = <b>${f(Math.abs(Fr))} N</b>` });
        pasos.push({ t: 'Newton\'s second law', html: m2
          ? `Block: $T ${F ? '+ F_x ' : ''}${inclinado ? '− P_x ' : ''}${sentido > 0 ? '−' : '+'} F_f = m_1 a$; &ensp; hanging mass: $P_2 − T = m_2 a$<br>Adding the two: $a = {${valores} ${sentido > 0 ? '−' : '+'} ${f(Math.abs(Fr))}}/{${f(M)}}$ = <b>${f(acel)} m/s<sup>2</sup></b>`
          : `$ΣF_x = ${Mt} a ⇒ a = {${valores} ${sentido > 0 ? '−' : '+'} ${f(Math.abs(Fr))}}/{${f(M)}}$ = <b>${f(acel)} m/s<sup>2</sup></b>` });
        tramos.push({ t0: tf, x0: xf, v0: 0, a: acel, dur: Infinity });
      }
    } else { estado = 'mueve'; sentido = Math.sign(v0); Fr = -sentido * muk * N; acel = fase1.a; }
    let T = null;
    if (m2) {
      T = m2 * (g - (fase1 && !isFinite(fase1.t) ? fase1.a : acel));
      pasos.push({ t: 'Tension in the rope', html: `From the hanging mass: $T = m_2 (g − a) = ${f(m2)} · (${f(g)} − ${p(acel)})$ = <b>${f(T)} N</b>` });
    }
    let Fmin = null;
    if (mus > 0 || inclinado) {
      const ne = Px - P2 + mus * Py, den = Math.cos(a) + mus * Math.sin(a);
      if (ne > 0 && den > 0) {
        const Fm = ne / den, Fo = ne / Math.hypot(1, mus), ao = Math.atan(mus) / RAD;
        Fmin = { F: Fm, Fopt: Fo, alfaOpt: ao };
        pasos.push({ t: 'Minimum force to start it moving up', html: `Just before it starts moving ${arriba}, static friction is at its maximum and points ${inclinado ? 'down the plane' : 'to the left'}: $F cos α ${m2 ? '+ P_2 ' : ''}= ${inclinado ? 'P_x + ' : ''}μ_s (${Py_} − F sin α) ⇒ F_{min} = {${inclinado ? 'P_x + ' : ''}μ_s ${Py_}${m2 ? ' − P_2' : ''}}/{cos α + μ_s sin α}$ = <b>${f(Fm)} N</b> with α = ${f(al)}°.<br>The smallest possible is obtained by pulling with $tan α = μ_s$, α = ${f(ao)}°: $F = {${inclinado ? 'P_x + ' : ''}μ_s ${Py_}${m2 ? ' − P_2' : ''}}/√(1 + μ_s^2)$ = <b>${f(Fo)} N</b>.` });
      }
    }
    let cin = null;
    if (d) {
      const rec = (tt) => tramos.reduce((s, x) => { if (tt <= x.t0) return s; const u = Math.min(tt - x.t0, x.dur); return s + Math.abs(x.v0 * u + 0.5 * x.a * u * u); }, 0);
      let tl = null, lo = 0, hi = Math.max(tf, 1);
      while (rec(hi) < d && hi < 1e5) hi *= 2;
      if (rec(hi) >= d) { for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (rec(m) < d) lo = m; else hi = m; } tl = (lo + hi) / 2; }
      if (tl !== null) {
        cin = { v: Math.abs(enTramos(tramos, tl).v), t: tl };
        pasos.push({ t: `After travelling ${f(d)} m`, html: !v0 ? `Uniformly accelerated motion from rest: $v = √(2 |a| d) = √(2 · ${f(Math.abs(acel))} · ${f(d)})$ = <b>${f(cin.v)} m/s</b>, &ensp; $t = √(2 d/|a|) = √(2 · ${f(d)}/${f(Math.abs(acel))})$ = <b>${f(cin.t)} s</b>`
          : `Putting the stages of the motion together: $v$ = <b>${f(cin.v)} m/s</b> at $t$ = <b>${f(cin.t)} s</b>.` });
      } else if (v0 || estado === 'reposo') pasos.push({ t: `Travelling ${f(d)} m`, html: `It does not manage to travel ${f(d)} m: it stops before.` });
    }
    const fuerzas = [{ k: 'P', nombre: 'Weight', x: -Px, y: -Py, mod: P1 }, { k: 'N', nombre: 'Normal force', x: 0, y: N, mod: N }];
    const Fr0 = v0 ? -Math.sign(v0) * muk * N : Fr;
    if (F) fuerzas.push({ k: 'F', nombre: 'Applied force', x: Fx, y: Fy, mod: F });
    if (Math.abs(Fr0) > 1e-9) fuerzas.push({ k: 'Fr', nombre: 'Friction', x: Fr0, y: 0, mod: Math.abs(Fr0) });
    const a0 = v0 ? fase1.a : acel;
    if (m2) fuerzas.push({ k: 'T', nombre: 'Tension', x: m2 * (g - a0), y: 0, mod: m2 * (g - a0) });
    const fuerzasFin = fuerzas.filter((q) => q.k !== 'Fr' && q.k !== 'T');
    if (Math.abs(Fr) > 1e-9) fuerzasFin.push({ k: 'Fr', nombre: 'Friction', x: Fr, y: 0, mod: Math.abs(Fr) });
    if (m2) fuerzasFin.push({ k: 'T', nombre: 'Tension', x: T, y: 0, mod: T });
    return { tipo: 'plano', g, m1, th, mus, muk, F, al, m2, d, v0, amed, P1, Px, Py, Fx, Fy, N, D, Frmax, Fr, a: acel, a0, T, estado, sentido, cin, fase1, Fmin, fuerzas, fuerzasFin, tf, pasos, mov: (tt) => enTramos(tramos, tt) };
  }

  function dos(sc) {
    const g = lee(sc, 'g', 'gravity', { estricto: true }), th = lee(sc, 'theta', 'the angle of the plane', { max: 89.9 });
    const m1 = lee(sc, 'm1', 'the mass of block 1', { estricto: true }), m2 = lee(sc, 'm2', 'the mass of block 2', { estricto: true });
    const F = lee(sc, 'F', 'the force', { opcional: true }) ?? 0, mus = lee(sc, 'mus', 'the static friction', { opcional: true }) ?? 0;
    const mk1 = lee(sc, 'muk1', 'the kinetic friction of block 1', { opcional: true }) ?? 0, mk2 = lee(sc, 'muk2', 'the kinetic friction of block 2', { opcional: true }) ?? 0;
    if (Math.max(mk1, mk2) > mus && mus > 0) throw new Error('The kinetic coefficients cannot be greater than the static one');
    const d = lee(sc, 'd', 'the distance', { opcional: true, estricto: true });
    const cuerda = sc.union === 'cuerda', t = th * RAD, M = m1 + m2, s = Math.sin(t), c = Math.cos(t), incl = th > 0;
    const pasos = [];
    const nomF = cuerda ? 'pulls block 1 (in front), which drags block 2 with a rope' : 'pushes block 2 (behind), which pushes block 1';
    pasos.push({ t: 'Both together as a single body', html: `The force ${nomF}. They move together with the same acceleration, so first the whole system is taken (the force between them is internal and cancels):<br>$M = m_1 + m_2 = ${f(m1)} + ${f(m2)} = ${f(M)} "kg"$${incl ? `, &ensp; $M g sin θ = ${f(M * g * s)} "N"$` : ''}` });
    const D = F - M * g * s;
    pasos.push({ t: 'Do they move?', html: `Without friction: $ΣF = F${incl ? ' − M g sin θ' : ''} = ${f(D)} "N"$. Maximum static friction: $μ_s M g ${incl ? 'cos θ ' : ''}= ${f(mus * M * g * c)} "N"$.` });
    let a = 0, Fi = null, estado;
    const nomI = cuerda ? 'T' : 'F_{12}';
    if (Math.abs(D) <= mus * M * g * c + 1e-9) {
      estado = 'reposo';
      pasos.push({ t: 'They stay at rest', html: `$|ΣF| ≤ μ_s M g ${incl ? 'cos θ' : ''}$: static friction holds them and $a = 0$.` });
    } else {
      estado = 'mueve';
      const sg = Math.sign(D), roz = sg * g * c * (mk1 * m1 + mk2 * m2);
      a = (D - roz) / M;
      pasos.push({ t: 'Acceleration of the system', html: `Kinetic friction: $F_f = g ${incl ? 'cos θ ' : ''}(μ_1 m_1 + μ_2 m_2) = ${f(Math.abs(roz))} "N"$, opposite to the motion.<br>$a = {F${incl ? ' − M g sin θ' : ''} ${sg > 0 ? '−' : '+'} F_r}/M = {${f(D)} ${sg > 0 ? '−' : '+'} ${f(Math.abs(roz))}}/{${f(M)}}$ = <b>${f(a)} m/s<sup>2</sup></b>` });
      const [mo, mko, no] = cuerda ? [m2, mk2, '2'] : [m1, mk1, '1'];
      Fi = mo * (a + g * s + sg * mko * g * c);
      pasos.push({ t: cuerda ? 'Tension in the rope' : 'Contact force between the blocks', html: `Block ${no} is isolated, which only receives ${cuerda ? 'the tension' : 'the push from the other'}: $${nomI}${incl ? ` − m_${no} g sin θ` : ''} ${sg > 0 ? '−' : '+'} μ_${no} m_${no} g ${incl ? 'cos θ ' : ''}= m_${no} a ⇒ ${nomI} = ${f(mo)} · (${f(a)}${incl ? ` + ${f(g * s)}` : ''} ${sg > 0 ? '+' : '−'} ${f(mko * g * c)})$ = <b>${f(Fi)} N</b>${Fi < 0 ? `<br>It comes out negative: ${cuerda ? 'the rope goes slack and each block goes its own way' : 'the blocks separate'}, each with its own acceleration.` : ''}` });
      if (Math.abs(mk1 - mk2) < 1e-12) pasos.push({ t: 'Check', html: `With the same friction on both, $${nomI} = F · m_${no}/(m_1 + m_2) = ${f(F)} · ${f(mo)}/${f(M)} = ${f(F * mo / M)} "N"$: it does not depend on friction or on the inclination.` });
    }
    let cin = null;
    if (d && estado === 'mueve' && Math.abs(a) > 1e-12) { cin = { v: Math.sqrt(2 * Math.abs(a) * d), t: Math.sqrt((2 * d) / Math.abs(a)) }; pasos.push({ t: `After travelling ${f(d)} m`, html: `$v = √(2 |a| d)$ = <b>${f(cin.v)} m/s</b>, &ensp; $t = √(2 d/|a|)$ = <b>${f(cin.t)} s</b>` }); }
    return { tipo: 'dos', g, th, m1, m2, F, mus, mk1, mk2, d, cuerda, a, Fi, estado, cin, pasos, mov: (tt) => ({ x: 0.5 * a * tt * tt, v: a * tt }) };
  }

  function atwood(sc) {
    const g = lee(sc, 'g', 'gravity', { estricto: true });
    const m1 = lee(sc, 'm1', 'mass 1', { estricto: true }), m2 = lee(sc, 'm2', 'mass 2', { estricto: true });
    const mp = lee(sc, 'mp', 'the mass of the pulley', { opcional: true }) ?? 0, d = lee(sc, 'd', 'the distance', { opcional: true, estricto: true });
    const a = ((m2 - m1) * g) / (m1 + m2 + mp / 2), T1 = m1 * (g + a), T2 = m2 * (g - a);
    const pasos = [];
    pasos.push({ t: 'Weights', html: `$P_1 = m_1 g = ${f(m1 * g)} "N"$, &ensp; $P_2 = m_2 g = ${f(m2 * g)} "N"$.<br>We take as positive the direction in which mass 2 goes down (mass 1 goes up).` });
    pasos.push({ t: 'Newton\'s second law for each body', html: `Mass 1 (goes up): $T_1 − P_1 = m_1 a$<br>Mass 2 (goes down): $P_2 − T_2 = m_2 a$<br>${mp ? 'Pulley (disc, $I = 1/2 m_p R^2$, no slipping $α = a/R$): $(T_2 − T_1) R = I α ⇒ T_2 − T_1 = 1/2 m_p a$' : 'Massless pulley: $T_1 = T_2 = T$'}` });
    pasos.push({ t: 'Acceleration', html: `Adding: $(m_2 − m_1) g = (m_1 + m_2${mp ? ' + 1/2 m_p' : ''}) a ⇒ a = {(${f(m2)} − ${f(m1)}) · ${f(g)}}/{${f(m1)} + ${f(m2)}${mp ? ` + ${f(mp / 2)}` : ''}}$ = <b>${f(a)} m/s<sup>2</sup></b>${Math.abs(a) < 1e-12 ? ' (equal masses: equilibrium)' : a < 0 ? ' (negative: mass 1 actually goes down)' : ''}` });
    pasos.push({ t: mp ? 'Tensions' : 'Tension', html: mp
      ? `$T_1 = m_1 (g + a) = ${f(m1)} · (${f(g)} + ${p(a)})$ = <b>${f(T1)} N</b><br>$T_2 = m_2 (g − a) = ${f(m2)} · (${f(g)} − ${p(a)})$ = <b>${f(T2)} N</b>`
      : `$T = m_1 (g + a) = ${f(m1)} · (${f(g)} + ${p(a)})$ = <b>${f(T1)} N</b> &ensp;($= {2 m_1 m_2 g}/{m_1 + m_2}$)` });
    let cin = null;
    if (d && Math.abs(a) > 1e-12) {
      const A = Math.abs(a), v = Math.sqrt(2 * A * d), tt = Math.sqrt((2 * d) / A);
      cin = { v, t: tt };
      pasos.push({ t: `When each mass has travelled ${f(d)} m`, html: `$v = √(2 |a| d)$ = <b>${f(v)} m/s</b>, &ensp; $t = √(2 d/|a|)$ = <b>${f(tt)} s</b>` });
    }
    return { tipo: 'atwood', g, m1, m2, mp, d, a, T1, T2, cin, pasos, mov: (t) => ({ x: 0.5 * a * t * t, v: a * t }) };
  }

  function circular(sc) {
    const g = lee(sc, 'g', 'gravity', { estricto: true }), m = lee(sc, 'm', 'the mass', { estricto: true });
    const caso = sc.caso || 'peralte', pasos = [], r = { tipo: 'circular', caso, g, m, pasos };
    if (caso === 'peralte') {
      const R = lee(sc, 'R', 'the radius of the curve', { estricto: true }), be = lee(sc, 'beta', 'the banking angle', { max: 89 });
      const mu = lee(sc, 'mus', 'the static friction', { opcional: true }) ?? 0, v = lee(sc, 'v', 'the speed', { opcional: true });
      const b = be * RAD, sb = Math.sin(b), cb = Math.cos(b);
      Object.assign(r, { R, beta: be, mu, v });
      pasos.push({ t: 'The centripetal force', html: `To move in a circle of radius R a net force towards the centre is needed, $F_c = m v^2/R$. It is provided by the horizontal component of the normal force${be ? ' (because of the banking)' : ''} and by friction.` });
      const vid = Math.sqrt(R * g * Math.tan(b));
      r.videal = vid;
      if (be) pasos.push({ t: 'Speed with no friction needed', html: `With the normal force alone: $N sin β = m v^2/R$, $N cos β = m g ⇒ v = √(R g tan β) = √(${f(R)} · ${f(g)} · tan ${f(be)}°)$ = <b>${f(vid)} m/s</b> (${f(vid * 3.6)} km/h)` });
      const dmax = cb - mu * sb, vmax = dmax > 1e-12 ? Math.sqrt((R * g * (sb + mu * cb)) / dmax) : Infinity;
      const nmin = sb - mu * cb, vmin = nmin > 0 ? Math.sqrt((R * g * nmin) / (cb + mu * sb)) : 0;
      Object.assign(r, { vmax, vmin });
      pasos.push({ t: 'Maximum speed without skidding', html: `At the maximum speed friction is at its maximum and points inwards (down the plane):<br>$v_{máx} = √({R g (sen β + μ_e cos β)}/{cos β − μ_e sen β})$ = <b>${isFinite(vmax) ? `${f(vmax)} m/s</b> (${f(vmax * 3.6)} km/h)` : '∞</b>: with that banking and that friction it never skids outwards'}` });
      if (be) pasos.push({ t: 'Minimum speed without slipping inwards', html: nmin > 0 ? `If it goes too slowly it slips towards the centre; friction points up the plane:<br>$v_{min} = √({R g (sin β − μ_s cos β)}/{cos β + μ_s sin β})$ = <b>${f(vmin)} m/s</b> (${f(vmin * 3.6)} km/h)` : `Since $μ_s ≥ tan β$, it can go as slowly as it likes (even stopped) without slipping.` });
      if (v !== null) {
        const N = m * (g * cb + (v * v / R) * sb), fr = m * ((v * v / R) * cb - g * sb);
        Object.assign(r, { N, fr, derrapa: Math.abs(fr) > mu * N + 1e-9 });
        pasos.push({ t: `A ${f(v)} m/s`, html: `Horizontal: $N sin β + F_f cos β = m v^2/R$; vertical: $N cos β − F_f sin β = m g$ ($F_f$ positive inwards):<br>$N = m (g cos β + v^2/R sin β)$ = <b>${f(N)} N</b>, &ensp; $F_f = m (v^2/R cos β − g sin β)$ = <b>${f(fr)} N</b><br>${r.derrapa ? `It needs a friction of ${f(Math.abs(fr))} N and the maximum is $μ_s N = ${f(mu * N)} "N"$: <b>${fr > 0 ? 'it skids outwards' : 'it slips inwards'}</b>.` : `The friction needed fits within the maximum $μ_s N = ${f(mu * N)} "N"$: <b>it takes the curve</b>.`}` });
      }
    } else if (caso === 'conico') {
      const L = lee(sc, 'L', 'the length of the string', { estricto: true }), an = lee(sc, 'ang', 'the angle with the vertical', { opcional: true, max: 89.9 }), w = lee(sc, 'w', 'the angular velocity', { opcional: true, estricto: true });
      if (an === null && w === null) throw new Error('The angle with the vertical or the angular velocity is missing');
      let th;
      if (an !== null) th = an * RAD;
      else {
        const cth = g / (w * w * L);
        if (cth >= 1) throw new Error(`With ω ≤ √(g/L) = ${f(Math.sqrt(g / L)).replace(/<[^>]+>/g, '')} rad/s the string does not leave the vertical`);
        th = Math.acos(cth);
        pasos.push({ t: 'Angle from ω', html: `$cos θ = g/(ω^2 L) = ${f(g)}/(${f(w)}^2 · ${f(L)}) ⇒ θ$ = <b>${f(th / RAD)}°</b>` });
      }
      const T = (m * g) / Math.cos(th), Rr = L * Math.sin(th), v = Math.sqrt(g * Rr * Math.tan(th)), om = v / Rr, per = (2 * Math.PI) / om;
      Object.assign(r, { L, ang: th / RAD, T, R: Rr, v, w: om, periodo: per });
      pasos.push({ t: 'Forces', html: `Only the weight and the tension act. Vertical: $T cos θ = m g ⇒ T = {m g}/{cos θ} = {${f(m)} · ${f(g)}}/{cos ${f(th / RAD)}°}$ = <b>${f(T)} N</b>` });
      pasos.push({ t: 'Radius and speed', html: `$r = L sin θ = ${f(Rr)} "m"$. Horizontal: $T sin θ = m v^2/r ⇒ v = √(g r tan θ)$ = <b>${f(v)} m/s</b>, &ensp; $ω = v/r$ = <b>${f(om)} rad/s</b>` });
      pasos.push({ t: 'Period', html: `$T_{rev} = 2 π √({L cos θ}/g) = 2 π/ω$ = <b>${f(per)} s</b> (it does not depend on the mass)` });
    } else {
      const R = lee(sc, 'R', 'the radius', { estricto: true }), v = lee(sc, 'v', 'the speed');
      const loma = caso === 'loma', ac = (v * v) / R, N = m * (g + (loma ? -ac : ac)), vmax = Math.sqrt(g * R);
      Object.assign(r, { R, v, N, vmax, despega: loma && N < 0 });
      pasos.push({ t: loma ? 'At the top of the hill' : 'At the bottom of the dip', html: `The centre of the curve is ${loma ? 'below' : 'above'}; the net force towards it is the centripetal force:<br>$${loma ? 'm g − N' : 'N − m g'} = m v^2/R ⇒ N = m (g ${loma ? '−' : '+'} v^2/R) = ${f(m)} · (${f(g)} ${loma ? '−' : '+'} ${f(ac)})$ = <b>${f(N)} N</b>` });
      pasos.push({ t: 'Apparent weight', html: `$N/(m g) = ${f(N / (m * g))}$: it feels ${N < m * g ? 'lighter' : 'heavier'} than at rest.${loma ? `<br>It leaves the ground if $N < 0$, that is if $v > √(g R)$ = <b>${f(vmax)} m/s</b> (${f(vmax * 3.6)} km/h)${N < 0 ? ': <b>at this speed it takes off</b>.' : '.'}` : ''}` });
    }
    return r;
  }

  function muelle(sc) {
    const g = lee(sc, 'g', 'gravity', { estricto: true }), k1 = lee(sc, 'k', 'the spring constant', { estricto: true });
    const k2 = lee(sc, 'k2', 'the constant of the second spring', { opcional: true, estricto: true });
    const m = lee(sc, 'm', 'the mass', { opcional: true, estricto: true }), th = lee(sc, 'theta', 'the angle', { opcional: true, max: 90 }) ?? 90;
    const mu = lee(sc, 'mus', 'the static friction', { opcional: true }) ?? 0, xd = lee(sc, 'x', 'the extension', { opcional: true, signo: true });
    const pasos = [];
    let k = k1;
    if (k2) {
      const serie = sc.asoc !== 'paralelo';
      k = serie ? (k1 * k2) / (k1 + k2) : k1 + k2;
      pasos.push({ t: `Springs in ${serie ? 'series' : 'parallel'}`, html: serie ? `Both carry the same force and the extensions add: $1/k = 1/k_1 + 1/k_2 ⇒ k = {k_1 k_2}/{k_1 + k_2} = {${f(k1)} · ${f(k2)}}/{${f(k1)} + ${f(k2)}}$ = <b>${f(k)} N/m</b>` : `They stretch the same amount and the forces add: $k = k_1 + k_2 = ${f(k1)} + ${f(k2)}$ = <b>${f(k)} N/m</b>` });
    }
    const r = { tipo: 'muelle', g, k1, k2, k, m, th, mu, pasos };
    if (xd !== null) { r.Fx = k * xd; pasos.push({ t: 'Hooke\'s law', html: `$F = k x = ${f(k)} · ${p(xd)}$ = <b>${f(k * xd)} N</b> (the spring pulls in the direction opposite to the extension)` }); }
    if (m) {
      const t = th * RAD, Pp = m * g * Math.sin(t), Nn = m * g * Math.cos(t), colgado = th >= 90 - 1e-9;
      const x0 = Pp / k, xmin = Math.max(0, (Pp - mu * Nn)) / k, xmax = (Pp + mu * Nn) / k;
      Object.assign(r, { x0, xmin, xmax });
      pasos.push({ t: colgado ? 'Hanging mass in equilibrium' : 'Block held by the spring on the plane', html: colgado
        ? `$k x = m g ⇒ x = {m g}/k = {${f(m)} · ${f(g)}}/{${f(k)}}$ = <b>${f(x0)} m</b> (${f(x0 * 100)} cm)`
        : `Without friction: $k x = m g sin θ ⇒ x = {m g sin θ}/k$ = <b>${f(x0)} m</b> (${f(x0 * 100)} cm)${mu ? `<br>With static friction the block stays at rest for any extension between $x_{min} = {m g (sin θ − μ_s cos θ)}/k$ = <b>${f(xmin)} m</b> and $x_{max} = {m g (sin θ + μ_s cos θ)}/k$ = <b>${f(xmax)} m</b>` : ''}` });
      const w = Math.sqrt(k / m), T = (2 * Math.PI) / w;
      Object.assign(r, { w, periodo: T });
      pasos.push({ t: 'If it is displaced from equilibrium (without friction)', html: `It oscillates with simple harmonic motion: $ω = √(k/m) = √(${f(k)}/${f(m)})$ = <b>${f(w)} rad/s</b>, &ensp; $T = 2 π √(m/k)$ = <b>${f(T)} s</b> (it does not depend on gravity or on the inclination)` });
    }
    if (pasos.length === 0) throw new Error('Enter the mass, an extension or a second spring to calculate something');
    return r;
  }

  function resolver(sc) {
    if (sc.tipo === 'atwood') return atwood(sc);
    if (sc.tipo === 'dos') return dos(sc);
    if (sc.tipo === 'circular') return circular(sc);
    if (sc.tipo === 'muelle') return muelle(sc);
    return plano(sc);
  }

  const G = '9,8';
  const ejemplos = [
    { clave: 'horizontal', nombre: 'Pulling a crate with an inclined rope', sc: { tipo: 'plano', g: G, m1: '20', theta: '0', mus: '0,4', muk: '0,3', F: '100', alfa: '30', m2: '', v0: '', amed: '', d: '5' } },
    { clave: 'inclinado-baja', nombre: 'Block sliding down an inclined plane', sc: { tipo: 'plano', g: G, m1: '5', theta: '30', mus: '0,3', muk: '0,2', F: '', alfa: '', m2: '', v0: '', amed: '', d: '2' } },
    { clave: 'inclinado-quieto', nombre: 'Friction holds the block', sc: { tipo: 'plano', g: G, m1: '5', theta: '20', mus: '0,5', muk: '0,4', F: '', alfa: '', m2: '', v0: '', amed: '', d: '' } },
    { clave: 'empujar-arriba', nombre: 'Pushing a block up by pushing parallel to the plane', sc: { tipo: 'plano', g: G, m1: '10', theta: '25', mus: '0,25', muk: '0,2', F: '80', alfa: '0', m2: '', v0: '', amed: '', d: '3' } },
    { clave: 'lanzado-arriba', nombre: 'Block launched up the plane that slows down and comes back', sc: { tipo: 'plano', g: G, m1: '2', theta: '30', mus: '0,3', muk: '0,2', F: '', alfa: '', m2: '', v0: '6', amed: '', d: '' } },
    { clave: 'frenada', nombre: 'Crate sliding along the floor until it stops', sc: { tipo: 'plano', g: G, m1: '8', theta: '0', mus: '0,4', muk: '0,3', F: '', alfa: '', m2: '', v0: '5', amed: '', d: '' } },
    { clave: 'mu-medida', nombre: 'Coefficient of friction from the acceleration', sc: { tipo: 'plano', g: G, m1: '3', theta: '35', mus: '', muk: '', F: '', alfa: '', m2: '', v0: '', amed: '3,2', d: '' } },
    { clave: 'mesa-polea', nombre: 'Block on a table and hanging mass', sc: { tipo: 'plano', g: G, m1: '4', theta: '0', mus: '0,3', muk: '0,25', F: '', alfa: '', m2: '2', v0: '', amed: '', d: '1' } },
    { clave: 'plano-polea', nombre: 'Inclined plane with pulley and hanging mass', sc: { tipo: 'plano', g: G, m1: '6', theta: '37', mus: '0,2', muk: '0,15', F: '', alfa: '', m2: '5', v0: '', amed: '', d: '1,5' } },
    { clave: 'contacto', nombre: 'Two crates in contact pushed along the floor', sc: { tipo: 'dos', union: 'contacto', g: G, m1: '3', m2: '5', theta: '0', mus: '0,3', muk1: '0,2', muk2: '0,2', F: '40', d: '' } },
    { clave: 'cuerda-plano', nombre: 'Two blocks joined by a rope going up a plane', sc: { tipo: 'dos', union: 'cuerda', g: G, m1: '4', m2: '2', theta: '20', mus: '0,3', muk1: '0,25', muk2: '0,1', F: '60', d: '2' } },
    { clave: 'atwood', nombre: 'Atwood machine', sc: { tipo: 'atwood', g: G, m1: '3', m2: '5', mp: '', d: '2' } },
    { clave: 'atwood-polea', nombre: 'Atwood machine with a pulley with mass', sc: { tipo: 'atwood', g: G, m1: '3', m2: '5', mp: '2', d: '2' } },
    { clave: 'peralte', nombre: 'Car on a banked curve', sc: { tipo: 'circular', caso: 'peralte', g: G, m: '1200', R: '80', beta: '15', mus: '0,5', v: '25', L: '', ang: '', w: '' } },
    { clave: 'curva-plana', nombre: 'Unbanked curve: maximum speed', sc: { tipo: 'circular', caso: 'peralte', g: G, m: '1000', R: '50', beta: '0', mus: '0,6', v: '20', L: '', ang: '', w: '' } },
    { clave: 'conico', nombre: 'Conical pendulum', sc: { tipo: 'circular', caso: 'conico', g: G, m: '0,5', L: '1,2', ang: '30', w: '', R: '', v: '' } },
    { clave: 'loma', nombre: 'Car over a change of gradient', sc: { tipo: 'circular', caso: 'loma', g: G, m: '900', R: '40', v: '15' } },
    { clave: 'muelle-colgado', nombre: 'Mass hanging from a spring', sc: { tipo: 'muelle', g: G, k: '200', k2: '', asoc: 'serie', m: '0,5', theta: '90', mus: '', x: '' } },
    { clave: 'muelle-plano', nombre: 'Block held by two springs on a plane', sc: { tipo: 'muelle', g: G, k: '300', k2: '200', asoc: 'paralelo', m: '4', theta: '30', mus: '0,2', x: '' } },
  ];

  return { plano, dos, atwood, circular, muelle, resolver, ejemplos, f };
})();

