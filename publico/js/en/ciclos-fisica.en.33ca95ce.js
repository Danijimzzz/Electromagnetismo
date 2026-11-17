const Ciclos = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-9) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} must be a number`);
    if (!signo && v <= 0) throw new Error(`${Mayus(nom)} must be greater than 0`);
    return v;
  }
  const R = 8.314;
  const GASES = { mono: { nom: 'monatomic', cv: 1.5, cvT: '3/2' }, di: { nom: 'diatomic (air)', cv: 2.5, cvT: '5/2' } };
  function gasDe(sc) {
    const g = GASES[sc.gas] || GASES.di, Cv = g.cv * R, Cp = Cv + R;
    return { ...g, Cv, Cp, gam: Cp / Cv, frac: `C_v = {${g.cvT.split('/')[0]}}/{${g.cvT.split('/')[1]}} R` };
  }

  function tramo(tipo, a, b, n, G, de, hasta) {
    let W, Q, U, html;
    const nom = `${de}→${hasta}`;
    U = n * G.Cv * (b.T - a.T);
    if (tipo === 'isoterma') {
      W = n * R * a.T * Math.log(b.V / a.V); Q = W; U = 0;
      html = `Isothermal at ${f(a.T)} K: $ΔU = 0$ and $Q = W = n R T ln {V_${hasta}}/{V_${de}} = ${f(n)} · 8.314 · ${f(a.T)} · ln {${f(b.V * 1000)}}/{${f(a.V * 1000)}}$ = <b>${f(W)} J</b>`;
    } else if (tipo === 'adiabatica') {
      Q = 0; W = -U;
      html = `Adiabatic: $Q = 0$, $ΔU = n C_v (T_${hasta} − T_${de}) = ${f(n)} · ${f(G.Cv)} · (${f(b.T)} − ${f(a.T)})$ = ${f(U)} J, and $W = −ΔU$ = <b>${f(W)} J</b>`;
    } else if (tipo === 'isocora') {
      W = 0; Q = U;
      html = `Isochoric: $W = 0$ and $Q = ΔU = n C_v (T_${hasta} − T_${de}) = ${f(n)} · ${f(G.Cv)} · (${f(b.T)} − ${f(a.T)})$ = <b>${f(Q)} J</b>`;
    } else if (tipo === 'recta') {
      W = ((a.P + b.P) / 2) * (b.V - a.V); Q = U + W;
      html = `Straight line in the p-V diagram: the work is the area of the trapezoid, $W = {P_${de} + P_${hasta}}/2 · (V_${hasta} − V_${de}) = {${f(a.P)} + ${f(b.P)}}/2 · (${f(b.V)} − ${f(a.V)})$ = ${f(W)} J, $ΔU = n C_v ΔT = ${f(U)}$ J and $Q = ΔU + W$ = <b>${f(Q)} J</b>`;
    } else {
      W = a.P * (b.V - a.V); Q = n * G.Cp * (b.T - a.T);
      html = `Isobaric at ${f(a.P / 1000)} kPa: $W = P ΔV = ${f(a.P)} · (${f(b.V)} − ${f(a.V)})$ = ${f(W)} J, $Q = n C_p ΔT = ${f(n)} · ${f(G.Cp)} · (${f(b.T)} − ${f(a.T)})$ = <b>${f(Q)} J</b>, $ΔU = Q − W$ = ${f(U)} J`;
    }
    const S = tipo === 'adiabatica' ? 0 : n * G.Cv * Math.log(b.T / a.T) + n * R * Math.log(b.V / a.V);
    let Tpico = Math.max(a.T, b.T);
    if (tipo === 'recta') { const dP = b.P - a.P, dV = b.V - a.V, s0 = -(a.P * dV + a.V * dP) / (2 * dP * dV); if (s0 > 0 && s0 < 1) Tpico = Math.max(Tpico, ((a.P + dP * s0) * (a.V + dV * s0)) / (n * R)); }
    return { de, a: hasta, nom, tipo, W, Q, U, S, Tpico, html };
  }
  const NOMBRE = { isoterma: 'isoterma', adiabatica: 'adiabatic', isocora: 'isocora', isobara: 'isobara', recta: 'straight line in p-V' };

  function balance(est, tramos, pasos, formula) {
    const W = tramos.reduce((s, t) => s + t.W, 0), Qabs = tramos.reduce((s, t) => s + Math.max(0, t.Q), 0), Qced = tramos.reduce((s, t) => s + Math.min(0, t.Q), 0);
    const eta = W / Qabs, Tmax = Math.max(...est.map((e) => e.T), ...tramos.map((t) => t.Tpico)), Tmin = Math.min(...est.map((e) => e.T)), etaC = 1 - Tmin / Tmax;
    pasos.push({ t: 'Cycle balance', html: `It returns to the initial state, so $ΔU = 0$ and $W_{net} = Q_{net}$ = <b>${f(W)} J</b><br>Heat absorbed $Q_{abs} = ${f(Qabs)}$ J, released $Q_{rel} = ${f(Qced)}$ J` });
    pasos.push({ t: 'Efficiency', html: `$η = {W_{neto}}/{Q_{abs}} = {${f(W)}}/{${f(Qabs)}}$ = <b>${f(100 * eta, 3)} %</b>${formula ? `<br>${formula}` : ''}` });
    pasos.push({ t: 'Compared with Carnot', html: `A Carnot engine between the highest and lowest temperature of the cycle would have $η_C = 1 − T_{min}/T_{max} = 1 − ${f(Tmin)}/${f(Tmax)}$ = ${f(100 * etaC, 3)}%, the maximum possible between those temperatures.` });
    pasos.push({ t: 'Entropy of each stage (T-S diagram)', html: `For an ideal gas $ΔS = n C_v ln {T_b}/{T_a} + n R ln {V_b}/{V_a}$ (0 in reversible adiabats): ${tramos.map((t) => `${t.nom}: ${f(t.S)} J/K`).join(', ')}. The sum is 0 because S is a state function. In the T-S diagram the enclosed area is also the net work.` });
    return { W, Qabs, Qced, eta, Tmax, Tmin, etaC };
  }
  function potencia(sc, W, pasos) {
    const rpm = lee(sc, 'rpm', 'the revolutions per minute', { opcional: true });
    if (rpm === null) return null;
    const cil = lee(sc, 'cil', 'the number of cylinders', { opcional: true }) ?? 1, P = (cil * W * rpm) / 120;
    pasos.push({ t: 'Engine power', html: `In a four-stroke engine each cylinder does one cycle every two revolutions: $P = {N_{cyl} · W · rpm}/{2 · 60} = {${f(cil)} · ${f(W)} · ${f(rpm)}}/{120}$ = <b>${f(P / 1000)} kW</b> (${f(P / 735.5)} metric hp). This is the power of the ideal cycle; that of a real engine is quite a bit lower.` });
    return P;
  }
  const estado = (nom, P, V, T) => ({ nom, P, V, T });
  function inicial(sc, G) {
    const T1 = lee(sc, 'T1', 'the initial temperature'), P1 = lee(sc, 'P1', 'the initial pressure') * 1000, V1 = lee(sc, 'V1', 'the initial volume') / 1000;
    const n = (P1 * V1) / (R * T1);
    return { T1, P1, V1, n, paso: { t: 'Gas and initial state', html: `Ideal gas ${G.nom}: $${G.frac} = ${f(G.Cv)}$ J/(mol·K), $C_p = C_v + R = ${f(G.Cp)}$ J/(mol·K), $γ = C_p/C_v = ${f(G.gam)}$.<br>$n = {P_1 V_1}/{R T_1} = {${f(P1)} · ${f(V1)}}/{8.314 · ${f(T1)}}$ = ${f(n)} mol` } };
  }

  function carnot(sc) {
    const G = gasDe(sc), Tc = lee(sc, 'Tc', 'the temperature of the hot reservoir'), Tf = lee(sc, 'Tf', 'the temperature of the cold reservoir');
    if (Tf >= Tc) throw new Error('The cold reservoir must be at a lower temperature than the hot one');
    const n = lee(sc, 'n', 'the number of moles'), V1 = lee(sc, 'V1', 'the initial volume') / 1000, V2 = lee(sc, 'V2', 'the volume at the end of the isothermal expansion') / 1000;
    if (V2 <= V1) throw new Error('In the isothermal expansion the volume must increase: V₂ > V₁');
    const k = (Tc / Tf) ** (1 / (G.gam - 1)), V3 = V2 * k, V4 = V1 * k;
    const P = (V, T) => (n * R * T) / V;
    const est = [estado('1', P(V1, Tc), V1, Tc), estado('2', P(V2, Tc), V2, Tc), estado('3', P(V3, Tf), V3, Tf), estado('4', P(V4, Tf), V4, Tf)];
    const pasos = [{ t: 'Gas', html: `Ideal gas ${G.nom}: $${G.frac} = ${f(G.Cv)}$ J/(mol·K) and $γ = ${f(G.gam)}$, with n = ${f(n)} mol.` }];
    pasos.push({ t: 'Volumes of the adiabats', html: `In an adiabat $T V^{γ − 1}$ = const, so $V_3 = V_2 (T_h/T_c)^{1/(γ − 1)} = ${f(V2 * 1000)} · (${f(Tc)}/${f(Tf)})^{${f(1 / (G.gam - 1))}}$ = ${f(V3 * 1000)} L and $V_4 = V_1 (T_h/T_c)^{1/(γ − 1)}$ = ${f(V4 * 1000)} L` });
    const tipos = ['isoterma', 'adiabatica', 'isoterma', 'adiabatica'];
    const tramos = tipos.map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Stage ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `It matches the Carnot formula: $η = 1 − T_c/T_h = 1 − ${f(Tf)}/${f(Tc)} = ${f(100 * (1 - Tf / Tc), 3)}$%`);
    pasos.push({ t: 'Entropy', html: `In the hot isotherm the gas gains $ΔS = Q_{abs}/T_h = ${f(b.Qabs / Tc)}$ J/K and in the cold one it loses $Q_{rel}/T_c = ${f(b.Qced / Tf)}$ J/K: in the reversible cycle the entropy of the universe does not change.` });
    return { modo: 'carnot', G, n, est, tramos, ...b, pasos };
  }

  function otto(sc) {
    const G = gasDe(sc), r = lee(sc, 'r', 'the compression ratio');
    if (r <= 1) throw new Error('The compression ratio must be greater than 1');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, V2 = V1 / r;
    const T2 = T1 * r ** (G.gam - 1), P2 = P1 * r ** G.gam;
    let T3;
    const pasos = [I.paso, { t: '1→2: adiabatic compression', html: `$V_2 = V_1/r = ${f(V1 * 1000)}/${f(r)} = ${f(V2 * 1000)}$ L, $T_2 = T_1 r^{γ − 1} = ${f(T1)} · ${f(r)}^{${f(G.gam - 1)}}$ = ${f(T2)} K, $P_2 = P_1 r^γ$ = ${f(P2 / 1000)} kPa` }];
    if (sc.datos === 'Q') {
      const Q = lee(sc, 'Q', 'the heat of combustion'); T3 = T2 + Q / (n * G.Cv);
      pasos.push({ t: '2→3: combustion at constant volume', html: `$Q = n C_v (T_3 − T_2)$, $T_3 = T_2 + {Q}/{n C_v} = ${f(T2)} + {${f(Q)}}/{${f(n)} · ${f(G.Cv)}}$ = ${f(T3)} K` });
    } else {
      T3 = lee(sc, 'T3', 'the maximum temperature');
      if (T3 <= T2) throw new Error(`The maximum temperature must be greater than that at the end of compression (${f(T2)} K)`);
      pasos.push({ t: '2→3: combustion at constant volume', html: `It reaches $T_3 = ${f(T3)}$ K with $V_3 = V_2$` });
    }
    const P3 = (P2 * T3) / T2, T4 = T3 * r ** (1 - G.gam), P4 = (P1 * T4) / T1;
    pasos.push({ t: '3→4: adiabatic expansion', html: `$T_4 = T_3 r^{1 − γ} = ${f(T3)} · ${f(r)}^{${f(1 - G.gam)}}$ = ${f(T4)} K, $P_4$ = ${f(P4 / 1000)} kPa, with $V_4 = V_1$` });
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P3, V2, T3), estado('4', P4, V1, T4)];
    const tramos = ['adiabatica', 'isocora', 'adiabatica', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Stage ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `With the Otto cycle formula: $η = 1 − r^{1 − γ} = 1 − ${f(r)}^{${f(1 - G.gam)}} = ${f(100 * (1 - r ** (1 - G.gam)), 3)}$%: it depends only on the compression ratio.`);
    const Pot = potencia(sc, b.W, pasos);
    return { modo: 'otto', G, n, r, est, tramos, ...b, Pot, pasos };
  }

  function diesel(sc) {
    const G = gasDe(sc), r = lee(sc, 'r', 'the compression ratio'), rc = lee(sc, 'rc', 'the cutoff ratio');
    if (r <= 1) throw new Error('The compression ratio must be greater than 1');
    if (rc <= 1 || rc >= r) throw new Error('The cutoff ratio must be between 1 and the compression ratio');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, V2 = V1 / r, V3 = rc * V2;
    const T2 = T1 * r ** (G.gam - 1), P2 = P1 * r ** G.gam, T3 = T2 * rc, T4 = T3 * (V3 / V1) ** (G.gam - 1), P4 = (P1 * T4) / T1;
    const pasos = [I.paso,
      { t: '1→2: adiabatic compression', html: `$V_2 = V_1/r = ${f(V2 * 1000)}$ L, $T_2 = T_1 r^{γ − 1}$ = ${f(T2)} K, $P_2 = P_1 r^γ$ = ${f(P2 / 1000)} kPa` },
      { t: '2→3: combustion at constant pressure', html: `$V_3 = r_c V_2 = ${f(rc)} · ${f(V2 * 1000)} = ${f(V3 * 1000)}$ L and, since P is constant, $T_3 = T_2 V_3/V_2 = T_2 r_c$ = ${f(T3)} K` },
      { t: '3→4: adiabatic expansion', html: `$T_4 = T_3 (V_3/V_1)^{γ − 1} = ${f(T3)} · (${f(V3 * 1000)}/${f(V1 * 1000)})^{${f(G.gam - 1)}}$ = ${f(T4)} K, $P_4$ = ${f(P4 / 1000)} kPa` }];
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P2, V3, T3), estado('4', P4, V1, T4)];
    const tramos = ['adiabatica', 'isobara', 'adiabatica', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Stage ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const etaF = 1 - (rc ** G.gam - 1) / (G.gam * r ** (G.gam - 1) * (rc - 1));
    const b = balance(est, tramos, pasos, `With the Diesel cycle formula: $η = 1 − {r_c^γ − 1}/{γ r^{γ − 1} (r_c − 1)} = ${f(100 * etaF, 3)}$%. An Otto with the same r would have ${f(100 * (1 - r ** (1 - G.gam)), 3)}%.`);
    const Pot = potencia(sc, b.W, pasos);
    return { modo: 'diesel', G, n, r, rc, est, tramos, ...b, Pot, pasos };
  }

  function brayton(sc) {
    const G = gasDe(sc), rp = lee(sc, 'rp', 'the pressure ratio');
    if (rp <= 1) throw new Error('The pressure ratio must be greater than 1');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, e = (G.gam - 1) / G.gam;
    const T2 = T1 * rp ** e, P2 = P1 * rp, V2 = V1 * rp ** (-1 / G.gam), T3 = lee(sc, 'T3', 'the temperature at the turbine inlet');
    if (T3 <= T2) throw new Error(`The temperature at the turbine inlet must be greater than that at the compressor outlet (${f(T2)} K)`);
    const V3 = (V2 * T3) / T2, T4 = T3 * rp ** -e, V4 = (V1 * T4) / T1;
    const pasos = [I.paso,
      { t: '1→2: compressor (adiabatic)', html: `$P_2 = r_p P_1 = ${f(P2 / 1000)}$ kPa, $T_2 = T_1 r_p^{(γ − 1)/γ} = ${f(T1)} · ${f(rp)}^{${f(e)}}$ = ${f(T2)} K, $V_2 = V_1 r_p^{−1/γ}$ = ${f(V2 * 1000)} L` },
      { t: '2→3: combustion chamber (isobaric)', html: `It reaches $T_3 = ${f(T3)}$ K at constant pressure: $V_3 = V_2 T_3/T_2$ = ${f(V3 * 1000)} L` },
      { t: '3→4: turbine (adiabatic)', html: `$T_4 = T_3 r_p^{−(γ − 1)/γ}$ = ${f(T4)} K, $P_4 = P_1$, $V_4 = V_1 T_4/T_1$ = ${f(V4 * 1000)} L` }];
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P2, V3, T3), estado('4', P1, V4, T4)];
    const tramos = ['adiabatica', 'isobara', 'adiabatica', 'isobara'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Stage ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `With the Brayton cycle formula: $η = 1 − r_p^{−(γ − 1)/γ} = 1 − ${f(rp)}^{−${f(e)}} = ${f(100 * (1 - rp ** -e), 3)}$%: it depends only on the pressure ratio.`);
    return { modo: 'brayton', G, n, rp, est, tramos, ...b, pasos };
  }

  function stirling(sc) {
    const G = gasDe(sc), Tc = lee(sc, 'Tc', 'the temperature of the hot reservoir'), Tf = lee(sc, 'Tf', 'the temperature of the cold reservoir');
    if (Tf >= Tc) throw new Error('The cold reservoir must be at a lower temperature than the hot one');
    const n = lee(sc, 'n', 'the number of moles'), V1 = lee(sc, 'V1', 'the minimum volume') / 1000, V2 = lee(sc, 'V2', 'the maximum volume') / 1000;
    if (V2 <= V1) throw new Error('The maximum volume must be greater than the minimum');
    const P = (V, T) => (n * R * T) / V;
    const est = [estado('1', P(V1, Tc), V1, Tc), estado('2', P(V2, Tc), V2, Tc), estado('3', P(V2, Tf), V2, Tf), estado('4', P(V1, Tf), V1, Tf)];
    const pasos = [{ t: 'Gas and states', html: `Ideal gas ${G.nom}: $${G.frac} = ${f(G.Cv)}$ J/(mol·K), with n = ${f(n)} mol. Two isotherms, at $T_h = ${f(Tc)}$ K and $T_c = ${f(Tf)}$ K, joined by two isochores between $V_1 = ${f(V1 * 1000)}$ L and $V_2 = ${f(V2 * 1000)}$ L. The pressures come from $P = nRT/V$.` }];
    const tramos = ['isoterma', 'isocora', 'isoterma', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Stage ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const Wn = tramos.reduce((s2, t) => s2 + t.W, 0), etaReg = Wn / tramos[0].Q;
    const b = balance(est, tramos, pasos, `With an ideal regenerator, the heat the gas releases in isochore 2→3 is stored and returned to it in 4→1; then heat is absorbed only in the hot isotherm and $η = W/Q_{12} = ${f(Wn)}/${f(tramos[0].Q)} = ${f(100 * etaReg, 3)}$%, the same as Carnot.`);
    return { modo: 'stirling', G, n, est, tramos, ...b, etaReg, pasos };
  }

  function propio(sc) {
    const G = gasDe(sc), n = lee(sc, 'n', 'the number of moles'), est = [];
    for (let i = 1; i <= 4; i++) {
      const P = lee(sc, `P${i}`, `the pressure of state ${i}`, { opcional: i === 4 }), V = lee(sc, `V${i}`, `the volume of state ${i}`, { opcional: i === 4 });
      if (i === 4 && (P === null) !== (V === null)) throw new Error('For state 4 both the pressure and the volume are needed (or neither, for a three-stage cycle)');
      if (P !== null) est.push(estado(String(i), P * 1000, V / 1000, (P * V) / (n * R)));
    }
    const N = est.length, pasos = [{ t: 'States', html: `Ideal gas ${G.nom}, n = ${f(n)} mol. Each temperature comes from $T = PV/(nR)$: ${est.map((e) => `$T_${e.nom} = ${f(e.T)}$ K`).join(', ')}.` }];
    const tramos = [];
    for (let i = 0; i < N; i++) {
      const a = est[i], b = est[(i + 1) % N], k = i === N - 1 ? 'tfin' : `t${a.nom}${b.nom}`, pedido = sc[k] || 'auto', cerca = (x, y) => Math.abs(x - y) <= 1e-6 * Math.max(Math.abs(x), Math.abs(y));
      if (cerca(a.P, b.P) && cerca(a.V, b.V)) throw new Error(`States ${a.nom} and ${b.nom} are the same`);
      let tipo = cerca(a.V, b.V) ? 'isocora' : cerca(a.P, b.P) ? 'isobara' : 'recta';
      if (pedido === 'isoterma') { if (Math.abs(a.P * a.V - b.P * b.V) > 0.01 * a.P * a.V) throw new Error(`Stage ${a.nom}→${b.nom} cannot be an isotherm: PV goes from ${f(a.P * a.V)} to ${f(b.P * b.V)} J (it would have to be equal)`); tipo = 'isoterma'; }
      if (pedido === 'adiabatica') { if (Math.abs(a.P * a.V ** G.gam - b.P * b.V ** G.gam) > 0.01 * a.P * a.V ** G.gam) throw new Error(`Stage ${a.nom}→${b.nom} cannot be an adiabat: PV^γ is not conserved between those states`); tipo = 'adiabatica'; }
      tramos.push(tramo(tipo, a, b, n, G, a.nom, b.nom));
    }
    for (const t of tramos) pasos.push({ t: `Stage ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, W0(tramos) < 0 ? 'The net work comes out negative: the cycle runs anticlockwise in the p-V diagram, so it is not an engine but a refrigerator (or a heat pump).' : '');
    return { modo: 'propio', G, n, est, tramos, ...b, pasos };
  }
  const W0 = (tramos) => tramos.reduce((s2, t) => s2 + t.W, 0);

  function maquina(sc) {
    const tipo = ['frigorifico', 'bomba'].includes(sc.tipo) ? sc.tipo : 'motor';
    let Qc = lee(sc, 'Qc', 'the heat from the hot reservoir', { opcional: true }), Qf = lee(sc, 'Qf', 'the heat from the cold reservoir', { opcional: true }), W = lee(sc, 'W', 'the work', { opcional: true });
    const datos = [Qc, Qf, W].filter((x) => x !== null).length;
    if (datos < 2) throw new Error('Two of the three are needed: Q of the hot reservoir, Q of the cold reservoir and W');
    const pasos = [];
    const motor = tipo === 'motor';
    const ec = motor ? 'Q_c = W + Q_f' : 'Q_c = Q_f + W';
    if (W === null) W = Qc - Qf; else if (Qc === null) Qc = W + Qf; else if (Qf === null) Qf = Qc - W;
    if (Math.abs(Qc - W - Qf) > 1e-9 * Math.max(Qc, 1)) throw new Error('The three values do not satisfy the first law: Q of the hot reservoir must be W + Q of the cold reservoir (leave one empty)');
    if (!(Qf > 0) || !(W > 0)) throw new Error('With those data a negative heat or work comes out: check which is larger');
    pasos.push({ t: 'First law', html: `${motor ? 'The engine takes heat from the hot reservoir, does work and releases the rest to the cold one' : 'With work, heat is taken from the cold reservoir and more is dumped into the hot one'}: $${ec}$<br>$Q_c$ = ${f(Qc)} J, $Q_f$ = ${f(Qf)} J, $W$ = ${f(W)} J` });
    let ef, nomEf, efC = null;
    if (motor) { ef = W / Qc; nomEf = 'Efficiency'; pasos.push({ t: 'Efficiency', html: `$η = W/Q_c = ${f(W)}/${f(Qc)}$ = <b>${f(100 * ef, 3)} %</b>` }); }
    else if (tipo === 'frigorifico') { ef = Qf / W; nomEf = 'Efficiency (COP)'; pasos.push({ t: 'Refrigerator efficiency', html: `$COP = Q_c/W = ${f(Qf)}/${f(W)}$ = <b>${f(ef, 3)}</b>: it removes ${f(ef, 3)} J from the inside for each joule of work.` }); }
    else { ef = Qc / W; nomEf = 'Efficiency (COP)'; pasos.push({ t: 'Heat pump efficiency', html: `$COP = Q_h/W = ${f(Qc)}/${f(W)}$ = <b>${f(ef, 3)}</b>: it delivers ${f(ef, 3)} J of heat for each joule of work.` }); }
    const Tc = lee(sc, 'Tc', 'the temperature of the hot reservoir', { opcional: true }), Tf = lee(sc, 'Tf', 'the temperature of the cold reservoir', { opcional: true });
    let posible = null, dS = null;
    if (Tc && Tf) {
      if (Tf >= Tc) throw new Error('The cold reservoir must be at a lower temperature than the hot one');
      efC = motor ? 1 - Tf / Tc : tipo === 'frigorifico' ? Tf / (Tc - Tf) : Tc / (Tc - Tf);
      dS = motor ? -Qc / Tc + Qf / Tf : Qc / Tc - Qf / Tf;
      posible = ef <= efC * (1 + 1e-9);
      pasos.push({ t: 'Carnot limit', html: `${motor ? `$η_C = 1 − T_f/T_c = 1 − ${f(Tf)}/${f(Tc)}$ = ${f(100 * efC, 3)} %` : tipo === 'frigorifico' ? `$COP_C = {T_f}/{T_c − T_f} = {${f(Tf)}}/{${f(Tc)} − ${f(Tf)}}$ = ${f(efC, 3)}` : `$COP_C = {T_c}/{T_c − T_f} = {${f(Tc)}}/{${f(Tc)} − ${f(Tf)}}$ = ${f(efC, 3)}`}<br>${posible ? (Math.abs(ef - efC) < 1e-9 * efC ? 'It matches Carnot: it would be a reversible, ideal machine.' : 'It is lower than Carnot: the machine is possible (and irreversible).') : '<b>It is higher than Carnot: that machine is impossible</b>, it would violate the second law.'}` });
      pasos.push({ t: 'Entropy of the universe', html: `The reservoirs change their entropy: $ΔS = ${motor ? `−Q_h/T_h + Q_c/T_c = −${f(Qc)}/${f(Tc)} + ${f(Qf)}/${f(Tf)}` : `Q_h/T_h − Q_c/T_c = ${f(Qc)}/${f(Tc)} − ${f(Qf)}/${f(Tf)}`}$ = <b>${f(dS)} J/K</b> per cycle (that of the working fluid does not change). ${dS >= -1e-12 ? 'It is positive or zero, as the second law requires.' : 'It comes out negative: impossible.'}` });
    }
    return { modo: 'maquina', tipo, Qc, Qf, W, ef, nomEf, efC, posible, dS, Tc, Tf, pasos };
  }

  function resolver(sc) {
    if (sc.modo === 'otto') return otto(sc);
    if (sc.modo === 'diesel') return diesel(sc);
    if (sc.modo === 'maquina') return maquina(sc);
    if (sc.modo === 'brayton') return brayton(sc);
    if (sc.modo === 'stirling') return stirling(sc);
    if (sc.modo === 'propio') return propio(sc);
    return carnot(sc);
  }

  const ejemplos = [
    { clave: 'carnot', nombre: 'Carnot cycle between 600 K and 300 K', sc: { modo: 'carnot', gas: 'di', Tc: '600', Tf: '300', n: '1', V1: '10', V2: '20' } },
    { clave: 'carnot-mono', nombre: 'Carnot with a monatomic gas', sc: { modo: 'carnot', gas: 'mono', Tc: '500', Tf: '350', n: '0,5', V1: '5', V2: '15' } },
    { clave: 'otto', nombre: 'Petrol engine (Otto cycle)', sc: { modo: 'otto', gas: 'di', r: '8', T1: '300', P1: '100', V1: '0,5', datos: 'T3', T3: '1800', rpm: '', cil: '' } },
    { clave: 'otto-calor', nombre: 'Otto cycle with the heat of combustion', sc: { modo: 'otto', gas: 'di', r: '10', T1: '290', P1: '95', V1: '0,6', datos: 'Q', Q: '800', rpm: '', cil: '' } },
    { clave: 'otto-potencia', nombre: 'Power of a 4-cylinder engine at 3000 rpm', sc: { modo: 'otto', gas: 'di', r: '9', T1: '300', P1: '100', V1: '0,4', datos: 'T3', T3: '2000', rpm: '3000', cil: '4' } },
    { clave: 'diesel', nombre: 'Diesel engine', sc: { modo: 'diesel', gas: 'di', r: '18', rc: '2', T1: '300', P1: '100', V1: '1', rpm: '', cil: '' } },
    { clave: 'brayton', nombre: 'Gas turbine (Brayton cycle)', sc: { modo: 'brayton', gas: 'di', rp: '10', T1: '300', P1: '100', V1: '1', T3: '1400' } },
    { clave: 'stirling', nombre: 'Stirling engine', sc: { modo: 'stirling', gas: 'mono', Tc: '700', Tf: '300', n: '1', V1: '1', V2: '3' } },
    { clave: 'rectangulo', nombre: 'Rectangular cycle (two isobars and two isochores)', sc: { modo: 'propio', gas: 'mono', n: '1', P1: '100', V1: '10', P2: '300', V2: '10', P3: '300', V3: '30', P4: '100', V4: '30', t12: 'auto', t23: 'auto', t34: 'auto', tfin: 'auto' } },
    { clave: 'triangulo', nombre: 'Triangular cycle with a straight line in p-V', sc: { modo: 'propio', gas: 'di', n: '0,5', P1: '100', V1: '10', P2: '300', V2: '10', P3: '100', V3: '30', P4: '', V4: '', t12: 'auto', t23: 'auto', t34: 'auto', tfin: 'auto' } },
    { clave: 'motor', nombre: 'Heat engine: is it possible?', sc: { modo: 'maquina', tipo: 'motor', Qc: '1000', Qf: '', W: '350', Tc: '500', Tf: '300' } },
    { clave: 'imposible', nombre: 'An inventor promises 60%', sc: { modo: 'maquina', tipo: 'motor', Qc: '1000', Qf: '400', W: '', Tc: '600', Tf: '300' } },
    { clave: 'frigorifico', nombre: 'Household refrigerator', sc: { modo: 'maquina', tipo: 'frigorifico', Qc: '', Qf: '300', W: '100', Tc: '298', Tf: '268' } },
    { clave: 'bomba', nombre: 'Heat pump for heating', sc: { modo: 'maquina', tipo: 'bomba', Qc: '3500', Qf: '', W: '1000', Tc: '308', Tf: '278' } },
  ];

  return { resolver, carnot, otto, diesel, brayton, stirling, propio, maquina, ejemplos, f, R, GASES };
})();

