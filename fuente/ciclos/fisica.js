/* =====================================================================
   Ciclos termodinámicos y máquinas térmicas (sin DOM): los ciclos de
   Carnot, Otto, Diesel, Brayton, Stirling y uno propio dado por sus
   estados, con un gas ideal (estados, trabajo, calor, variación de energía
   interna y de entropía de cada tramo, el rendimiento y la potencia de un
   motor a partir de las revoluciones), y las
   máquinas térmicas, frigoríficos y bombas de calor con el límite de
   Carnot y la variación de entropía del universo.
   Presiones en kPa, volúmenes en L, temperaturas en K y energías en J.
   W es el trabajo que hace el gas: ΔU = Q − W.
   ===================================================================== */
const Ciclos = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-9) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, signo = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} debe ser un número`);
    if (!signo && v <= 0) throw new Error(`${Mayus(nom)} debe ser mayor que 0`);
    return v;
  }
  const R = 8.314;
  const GASES = { mono: { nom: 'monoatómico', cv: 1.5, cvT: '3/2' }, di: { nom: 'diatómico (aire)', cv: 2.5, cvT: '5/2' } };
  function gasDe(sc) {
    const g = GASES[sc.gas] || GASES.di, Cv = g.cv * R, Cp = Cv + R;
    return { ...g, Cv, Cp, gam: Cp / Cv, frac: `C_v = {${g.cvT.split('/')[0]}}/{${g.cvT.split('/')[1]}} R` };
  }

  /* ---------- Tramos ---------- */
  // a y b: { P (Pa), V (m³), T (K) }; devuelve W, Q y ΔU con el desarrollo
  function tramo(tipo, a, b, n, G, de, hasta) {
    let W, Q, U, html;
    const nom = `${de}→${hasta}`;
    U = n * G.Cv * (b.T - a.T);
    if (tipo === 'isoterma') {
      W = n * R * a.T * Math.log(b.V / a.V); Q = W; U = 0;
      html = `Isoterma a ${f(a.T)} K: $ΔU = 0$ y $Q = W = n R T ln {V_${hasta}}/{V_${de}} = ${f(n)} · 8,314 · ${f(a.T)} · ln {${f(b.V * 1000)}}/{${f(a.V * 1000)}}$ = <b>${f(W)} J</b>`;
    } else if (tipo === 'adiabatica') {
      Q = 0; W = -U;
      html = `Adiabática: $Q = 0$, $ΔU = n C_v (T_${hasta} − T_${de}) = ${f(n)} · ${f(G.Cv)} · (${f(b.T)} − ${f(a.T)})$ = ${f(U)} J, y $W = −ΔU$ = <b>${f(W)} J</b>`;
    } else if (tipo === 'isocora') {
      W = 0; Q = U;
      html = `Isocora: $W = 0$ y $Q = ΔU = n C_v (T_${hasta} − T_${de}) = ${f(n)} · ${f(G.Cv)} · (${f(b.T)} − ${f(a.T)})$ = <b>${f(Q)} J</b>`;
    } else if (tipo === 'recta') {
      W = ((a.P + b.P) / 2) * (b.V - a.V); Q = U + W;
      html = `Recta en el diagrama p-V: el trabajo es el área del trapecio, $W = {P_${de} + P_${hasta}}/2 · (V_${hasta} − V_${de}) = {${f(a.P)} + ${f(b.P)}}/2 · (${f(b.V)} − ${f(a.V)})$ = ${f(W)} J, $ΔU = n C_v ΔT = ${f(U)}$ J y $Q = ΔU + W$ = <b>${f(Q)} J</b>`;
    } else {
      W = a.P * (b.V - a.V); Q = n * G.Cp * (b.T - a.T);
      html = `Isobara a ${f(a.P / 1000)} kPa: $W = P ΔV = ${f(a.P)} · (${f(b.V)} − ${f(a.V)})$ = ${f(W)} J, $Q = n C_p ΔT = ${f(n)} · ${f(G.Cp)} · (${f(b.T)} − ${f(a.T)})$ = <b>${f(Q)} J</b>, $ΔU = Q − W$ = ${f(U)} J`;
    }
    // variación de entropía del gas: ΔS = n C_v ln(T_b/T_a) + n R ln(V_b/V_a)
    const S = tipo === 'adiabatica' ? 0 : n * G.Cv * Math.log(b.T / a.T) + n * R * Math.log(b.V / a.V);
    // en una recta de p-V la temperatura puede pasar por un máximo entre los dos estados
    let Tpico = Math.max(a.T, b.T);
    if (tipo === 'recta') { const dP = b.P - a.P, dV = b.V - a.V, s0 = -(a.P * dV + a.V * dP) / (2 * dP * dV); if (s0 > 0 && s0 < 1) Tpico = Math.max(Tpico, ((a.P + dP * s0) * (a.V + dV * s0)) / (n * R)); }
    return { de, a: hasta, nom, tipo, W, Q, U, S, Tpico, html };
  }
  const NOMBRE = { isoterma: 'isoterma', adiabatica: 'adiabática', isocora: 'isocora', isobara: 'isobara', recta: 'recta en p-V' };

  // balance común de un ciclo
  function balance(est, tramos, pasos, formula) {
    const W = tramos.reduce((s, t) => s + t.W, 0), Qabs = tramos.reduce((s, t) => s + Math.max(0, t.Q), 0), Qced = tramos.reduce((s, t) => s + Math.min(0, t.Q), 0);
    const eta = W / Qabs, Tmax = Math.max(...est.map((e) => e.T), ...tramos.map((t) => t.Tpico)), Tmin = Math.min(...est.map((e) => e.T)), etaC = 1 - Tmin / Tmax;
    pasos.push({ t: 'Balance del ciclo', html: `Vuelve al estado inicial, así que $ΔU = 0$ y $W_{neto} = Q_{neto}$ = <b>${f(W)} J</b><br>Calor absorbido $Q_{abs} = ${f(Qabs)}$ J, cedido $Q_{ced} = ${f(Qced)}$ J` });
    pasos.push({ t: 'Rendimiento', html: `$η = {W_{neto}}/{Q_{abs}} = {${f(W)}}/{${f(Qabs)}}$ = <b>${f(100 * eta, 3)} %</b>${formula ? `<br>${formula}` : ''}` });
    pasos.push({ t: 'Comparado con Carnot', html: `Una máquina de Carnot entre la temperatura más alta y la más baja del ciclo tendría $η_C = 1 − T_{mín}/T_{máx} = 1 − ${f(Tmin)}/${f(Tmax)}$ = ${f(100 * etaC, 3)} %, el máximo posible entre esas temperaturas.` });
    pasos.push({ t: 'Entropía de cada tramo (diagrama T-S)', html: `En un gas ideal $ΔS = n C_v ln {T_b}/{T_a} + n R ln {V_b}/{V_a}$ (0 en las adiabáticas reversibles): ${tramos.map((t) => `${t.nom}: ${f(t.S)} J/K`).join(', ')}. La suma es 0 porque S es función de estado. En el diagrama T-S el área encerrada también es el trabajo neto.` });
    return { W, Qabs, Qced, eta, Tmax, Tmin, etaC };
  }
  // potencia de un motor de cuatro tiempos: un ciclo cada dos vueltas en cada cilindro
  function potencia(sc, W, pasos) {
    const rpm = lee(sc, 'rpm', 'las revoluciones por minuto', { opcional: true });
    if (rpm === null) return null;
    const cil = lee(sc, 'cil', 'el número de cilindros', { opcional: true }) ?? 1, P = (cil * W * rpm) / 120;
    pasos.push({ t: 'Potencia del motor', html: `En un motor de cuatro tiempos cada cilindro hace un ciclo cada dos vueltas: $P = {N_{cil} · W · rpm}/{2 · 60} = {${f(cil)} · ${f(W)} · ${f(rpm)}}/{120}$ = <b>${f(P / 1000)} kW</b> (${f(P / 735.5)} CV). Es la potencia del ciclo ideal; la de un motor real es bastante menor.` });
    return P;
  }
  // estado en unidades de clase, para la tabla
  const estado = (nom, P, V, T) => ({ nom, P, V, T });
  function inicial(sc, G) {
    const T1 = lee(sc, 'T1', 'la temperatura inicial'), P1 = lee(sc, 'P1', 'la presión inicial') * 1000, V1 = lee(sc, 'V1', 'el volumen inicial') / 1000;
    const n = (P1 * V1) / (R * T1);
    return { T1, P1, V1, n, paso: { t: 'Gas y estado inicial', html: `Gas ideal ${G.nom}: $${G.frac} = ${f(G.Cv)}$ J/(mol·K), $C_p = C_v + R = ${f(G.Cp)}$ J/(mol·K), $γ = C_p/C_v = ${f(G.gam)}$.<br>$n = {P_1 V_1}/{R T_1} = {${f(P1)} · ${f(V1)}}/{8,314 · ${f(T1)}}$ = ${f(n)} mol` } };
  }

  /* ---------- Ciclo de Carnot ---------- */
  // sc: { gas, Tc, Tf, n, V1, V2 (L): expansión isoterma de V1 a V2 a Tc }
  function carnot(sc) {
    const G = gasDe(sc), Tc = lee(sc, 'Tc', 'la temperatura del foco caliente'), Tf = lee(sc, 'Tf', 'la temperatura del foco frío');
    if (Tf >= Tc) throw new Error('El foco frío tiene que estar a menos temperatura que el caliente');
    const n = lee(sc, 'n', 'el número de moles'), V1 = lee(sc, 'V1', 'el volumen inicial') / 1000, V2 = lee(sc, 'V2', 'el volumen al acabar la expansión isoterma') / 1000;
    if (V2 <= V1) throw new Error('En la expansión isoterma el volumen tiene que aumentar: V₂ > V₁');
    const k = (Tc / Tf) ** (1 / (G.gam - 1)), V3 = V2 * k, V4 = V1 * k;
    const P = (V, T) => (n * R * T) / V;
    const est = [estado('1', P(V1, Tc), V1, Tc), estado('2', P(V2, Tc), V2, Tc), estado('3', P(V3, Tf), V3, Tf), estado('4', P(V4, Tf), V4, Tf)];
    const pasos = [{ t: 'Gas', html: `Gas ideal ${G.nom}: $${G.frac} = ${f(G.Cv)}$ J/(mol·K) y $γ = ${f(G.gam)}$, con n = ${f(n)} mol.` }];
    pasos.push({ t: 'Volúmenes de las adiabáticas', html: `En una adiabática $T V^{γ − 1}$ = cte, así que $V_3 = V_2 (T_c/T_f)^{1/(γ − 1)} = ${f(V2 * 1000)} · (${f(Tc)}/${f(Tf)})^{${f(1 / (G.gam - 1))}}$ = ${f(V3 * 1000)} L y $V_4 = V_1 (T_c/T_f)^{1/(γ − 1)}$ = ${f(V4 * 1000)} L` });
    const tipos = ['isoterma', 'adiabatica', 'isoterma', 'adiabatica'];
    const tramos = tipos.map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Tramo ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `Coincide con la fórmula de Carnot: $η = 1 − T_f/T_c = 1 − ${f(Tf)}/${f(Tc)} = ${f(100 * (1 - Tf / Tc), 3)}$ %`);
    pasos.push({ t: 'Entropía', html: `En la isoterma caliente el gas gana $ΔS = Q_{abs}/T_c = ${f(b.Qabs / Tc)}$ J/K y en la fría la pierde, $Q_{ced}/T_f = ${f(b.Qced / Tf)}$ J/K: en el ciclo reversible la entropía del universo no cambia.` });
    return { modo: 'carnot', G, n, est, tramos, ...b, pasos };
  }

  /* ---------- Ciclo Otto ---------- */
  // sc: { gas, r, T1, P1 (kPa), V1 (L), datos: 'T3' | 'Q', T3 o Q (calor de la combustión en J) }
  function otto(sc) {
    const G = gasDe(sc), r = lee(sc, 'r', 'la relación de compresión');
    if (r <= 1) throw new Error('La relación de compresión tiene que ser mayor que 1');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, V2 = V1 / r;
    const T2 = T1 * r ** (G.gam - 1), P2 = P1 * r ** G.gam;
    let T3;
    const pasos = [I.paso, { t: '1→2: compresión adiabática', html: `$V_2 = V_1/r = ${f(V1 * 1000)}/${f(r)} = ${f(V2 * 1000)}$ L, $T_2 = T_1 r^{γ − 1} = ${f(T1)} · ${f(r)}^{${f(G.gam - 1)}}$ = ${f(T2)} K, $P_2 = P_1 r^γ$ = ${f(P2 / 1000)} kPa` }];
    if (sc.datos === 'Q') {
      const Q = lee(sc, 'Q', 'el calor de la combustión'); T3 = T2 + Q / (n * G.Cv);
      pasos.push({ t: '2→3: combustión a volumen constante', html: `$Q = n C_v (T_3 − T_2)$, $T_3 = T_2 + {Q}/{n C_v} = ${f(T2)} + {${f(Q)}}/{${f(n)} · ${f(G.Cv)}}$ = ${f(T3)} K` });
    } else {
      T3 = lee(sc, 'T3', 'la temperatura máxima');
      if (T3 <= T2) throw new Error(`La temperatura máxima tiene que ser mayor que la del final de la compresión (${f(T2)} K)`);
      pasos.push({ t: '2→3: combustión a volumen constante', html: `Llega a $T_3 = ${f(T3)}$ K con $V_3 = V_2$` });
    }
    const P3 = (P2 * T3) / T2, T4 = T3 * r ** (1 - G.gam), P4 = (P1 * T4) / T1;
    pasos.push({ t: '3→4: expansión adiabática', html: `$T_4 = T_3 r^{1 − γ} = ${f(T3)} · ${f(r)}^{${f(1 - G.gam)}}$ = ${f(T4)} K, $P_4$ = ${f(P4 / 1000)} kPa, con $V_4 = V_1$` });
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P3, V2, T3), estado('4', P4, V1, T4)];
    const tramos = ['adiabatica', 'isocora', 'adiabatica', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Tramo ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `Con la fórmula del ciclo Otto: $η = 1 − r^{1 − γ} = 1 − ${f(r)}^{${f(1 - G.gam)}} = ${f(100 * (1 - r ** (1 - G.gam)), 3)}$ %: solo depende de la relación de compresión.`);
    const Pot = potencia(sc, b.W, pasos);
    return { modo: 'otto', G, n, r, est, tramos, ...b, Pot, pasos };
  }

  /* ---------- Ciclo Diesel ---------- */
  // sc: { gas, r, rc (relación de corte V3/V2), T1, P1 (kPa), V1 (L) }
  function diesel(sc) {
    const G = gasDe(sc), r = lee(sc, 'r', 'la relación de compresión'), rc = lee(sc, 'rc', 'la relación de corte');
    if (r <= 1) throw new Error('La relación de compresión tiene que ser mayor que 1');
    if (rc <= 1 || rc >= r) throw new Error('La relación de corte tiene que estar entre 1 y la de compresión');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, V2 = V1 / r, V3 = rc * V2;
    const T2 = T1 * r ** (G.gam - 1), P2 = P1 * r ** G.gam, T3 = T2 * rc, T4 = T3 * (V3 / V1) ** (G.gam - 1), P4 = (P1 * T4) / T1;
    const pasos = [I.paso,
      { t: '1→2: compresión adiabática', html: `$V_2 = V_1/r = ${f(V2 * 1000)}$ L, $T_2 = T_1 r^{γ − 1}$ = ${f(T2)} K, $P_2 = P_1 r^γ$ = ${f(P2 / 1000)} kPa` },
      { t: '2→3: combustión a presión constante', html: `$V_3 = r_c V_2 = ${f(rc)} · ${f(V2 * 1000)} = ${f(V3 * 1000)}$ L y, como P es constante, $T_3 = T_2 V_3/V_2 = T_2 r_c$ = ${f(T3)} K` },
      { t: '3→4: expansión adiabática', html: `$T_4 = T_3 (V_3/V_1)^{γ − 1} = ${f(T3)} · (${f(V3 * 1000)}/${f(V1 * 1000)})^{${f(G.gam - 1)}}$ = ${f(T4)} K, $P_4$ = ${f(P4 / 1000)} kPa` }];
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P2, V3, T3), estado('4', P4, V1, T4)];
    const tramos = ['adiabatica', 'isobara', 'adiabatica', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Tramo ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const etaF = 1 - (rc ** G.gam - 1) / (G.gam * r ** (G.gam - 1) * (rc - 1));
    const b = balance(est, tramos, pasos, `Con la fórmula del ciclo Diesel: $η = 1 − {r_c^γ − 1}/{γ r^{γ − 1} (r_c − 1)} = ${f(100 * etaF, 3)}$ %. Un Otto con la misma r tendría ${f(100 * (1 - r ** (1 - G.gam)), 3)} %.`);
    const Pot = potencia(sc, b.W, pasos);
    return { modo: 'diesel', G, n, r, rc, est, tramos, ...b, Pot, pasos };
  }

  /* ---------- Ciclo Brayton (turbina de gas) ---------- */
  // sc: { gas, rp (P2/P1), T1, P1 (kPa), V1 (L), T3 (entrada de la turbina) }
  function brayton(sc) {
    const G = gasDe(sc), rp = lee(sc, 'rp', 'la relación de presiones');
    if (rp <= 1) throw new Error('La relación de presiones tiene que ser mayor que 1');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, e = (G.gam - 1) / G.gam;
    const T2 = T1 * rp ** e, P2 = P1 * rp, V2 = V1 * rp ** (-1 / G.gam), T3 = lee(sc, 'T3', 'la temperatura a la entrada de la turbina');
    if (T3 <= T2) throw new Error(`La temperatura a la entrada de la turbina tiene que ser mayor que la de salida del compresor (${f(T2)} K)`);
    const V3 = (V2 * T3) / T2, T4 = T3 * rp ** -e, V4 = (V1 * T4) / T1;
    const pasos = [I.paso,
      { t: '1→2: compresor (adiabática)', html: `$P_2 = r_p P_1 = ${f(P2 / 1000)}$ kPa, $T_2 = T_1 r_p^{(γ − 1)/γ} = ${f(T1)} · ${f(rp)}^{${f(e)}}$ = ${f(T2)} K, $V_2 = V_1 r_p^{−1/γ}$ = ${f(V2 * 1000)} L` },
      { t: '2→3: cámara de combustión (isobara)', html: `Llega a $T_3 = ${f(T3)}$ K a presión constante: $V_3 = V_2 T_3/T_2$ = ${f(V3 * 1000)} L` },
      { t: '3→4: turbina (adiabática)', html: `$T_4 = T_3 r_p^{−(γ − 1)/γ}$ = ${f(T4)} K, $P_4 = P_1$, $V_4 = V_1 T_4/T_1$ = ${f(V4 * 1000)} L` }];
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P2, V3, T3), estado('4', P1, V4, T4)];
    const tramos = ['adiabatica', 'isobara', 'adiabatica', 'isobara'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Tramo ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `Con la fórmula del ciclo Brayton: $η = 1 − r_p^{−(γ − 1)/γ} = 1 − ${f(rp)}^{−${f(e)}} = ${f(100 * (1 - rp ** -e), 3)}$ %: solo depende de la relación de presiones.`);
    return { modo: 'brayton', G, n, rp, est, tramos, ...b, pasos };
  }

  /* ---------- Ciclo Stirling ---------- */
  // sc: { gas, n, Tc, Tf, V1 (mínimo), V2 (máximo) }: isoterma caliente, isocora, isoterma fría, isocora
  function stirling(sc) {
    const G = gasDe(sc), Tc = lee(sc, 'Tc', 'la temperatura del foco caliente'), Tf = lee(sc, 'Tf', 'la temperatura del foco frío');
    if (Tf >= Tc) throw new Error('El foco frío tiene que estar a menos temperatura que el caliente');
    const n = lee(sc, 'n', 'el número de moles'), V1 = lee(sc, 'V1', 'el volumen mínimo') / 1000, V2 = lee(sc, 'V2', 'el volumen máximo') / 1000;
    if (V2 <= V1) throw new Error('El volumen máximo tiene que ser mayor que el mínimo');
    const P = (V, T) => (n * R * T) / V;
    const est = [estado('1', P(V1, Tc), V1, Tc), estado('2', P(V2, Tc), V2, Tc), estado('3', P(V2, Tf), V2, Tf), estado('4', P(V1, Tf), V1, Tf)];
    const pasos = [{ t: 'Gas y estados', html: `Gas ideal ${G.nom}: $${G.frac} = ${f(G.Cv)}$ J/(mol·K), con n = ${f(n)} mol. Dos isotermas, a $T_c = ${f(Tc)}$ K y $T_f = ${f(Tf)}$ K, unidas por dos isocoras entre $V_1 = ${f(V1 * 1000)}$ L y $V_2 = ${f(V2 * 1000)}$ L. Las presiones salen de $P = nRT/V$.` }];
    const tramos = ['isoterma', 'isocora', 'isoterma', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Tramo ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const Wn = tramos.reduce((s2, t) => s2 + t.W, 0), etaReg = Wn / tramos[0].Q;
    const b = balance(est, tramos, pasos, `Con un regenerador ideal, el calor que suelta el gas en la isocora 2→3 se guarda y se le devuelve en la 4→1; entonces solo se absorbe en la isoterma caliente y $η = W/Q_{12} = ${f(Wn)}/${f(tramos[0].Q)} = ${f(100 * etaReg, 3)}$ %, igual que Carnot.`);
    return { modo: 'stirling', G, n, est, tramos, ...b, etaReg, pasos };
  }

  /* ---------- Ciclo propio: estados y tipo de cada tramo ---------- */
  // sc: { gas, n, P1..P4 (kPa), V1..V4 (L; el 4 opcional), t12, t23, t34, tfin (el que vuelve al 1): 'auto' | 'isoterma' | 'adiabatica' }
  function propio(sc) {
    const G = gasDe(sc), n = lee(sc, 'n', 'el número de moles'), est = [];
    for (let i = 1; i <= 4; i++) {
      const P = lee(sc, `P${i}`, `la presión del estado ${i}`, { opcional: i === 4 }), V = lee(sc, `V${i}`, `el volumen del estado ${i}`, { opcional: i === 4 });
      if (i === 4 && (P === null) !== (V === null)) throw new Error('Para el estado 4 hacen falta la presión y el volumen (o ninguno, para un ciclo de tres tramos)');
      if (P !== null) est.push(estado(String(i), P * 1000, V / 1000, (P * V) / (n * R)));
    }
    const N = est.length, pasos = [{ t: 'Estados', html: `Gas ideal ${G.nom}, n = ${f(n)} mol. Cada temperatura sale de $T = PV/(nR)$: ${est.map((e) => `$T_${e.nom} = ${f(e.T)}$ K`).join(', ')}.` }];
    const tramos = [];
    for (let i = 0; i < N; i++) {
      const a = est[i], b = est[(i + 1) % N], k = i === N - 1 ? 'tfin' : `t${a.nom}${b.nom}`, pedido = sc[k] || 'auto', cerca = (x, y) => Math.abs(x - y) <= 1e-6 * Math.max(Math.abs(x), Math.abs(y));
      if (cerca(a.P, b.P) && cerca(a.V, b.V)) throw new Error(`Los estados ${a.nom} y ${b.nom} son el mismo`);
      let tipo = cerca(a.V, b.V) ? 'isocora' : cerca(a.P, b.P) ? 'isobara' : 'recta';
      if (pedido === 'isoterma') { if (Math.abs(a.P * a.V - b.P * b.V) > 0.01 * a.P * a.V) throw new Error(`El tramo ${a.nom}→${b.nom} no puede ser una isoterma: PV pasa de ${f(a.P * a.V)} a ${f(b.P * b.V)} J (tendría que ser igual)`); tipo = 'isoterma'; }
      if (pedido === 'adiabatica') { if (Math.abs(a.P * a.V ** G.gam - b.P * b.V ** G.gam) > 0.01 * a.P * a.V ** G.gam) throw new Error(`El tramo ${a.nom}→${b.nom} no puede ser una adiabática: PV^γ no se conserva entre esos estados`); tipo = 'adiabatica'; }
      tramos.push(tramo(tipo, a, b, n, G, a.nom, b.nom));
    }
    for (const t of tramos) pasos.push({ t: `Tramo ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, W0(tramos) < 0 ? 'El trabajo neto sale negativo: el ciclo va en sentido antihorario en el diagrama p-V, así que no es un motor sino un frigorífico (o una bomba de calor).' : '');
    return { modo: 'propio', G, n, est, tramos, ...b, pasos };
  }
  const W0 = (tramos) => tramos.reduce((s2, t) => s2 + t.W, 0);

  /* ---------- Máquina, frigorífico o bomba de calor ---------- */
  // sc: { tipo: 'motor' | 'frigorifico' | 'bomba', Qc, Qf, W (J, dos de los tres), Tc, Tf (K, opcionales) }
  function maquina(sc) {
    const tipo = ['frigorifico', 'bomba'].includes(sc.tipo) ? sc.tipo : 'motor';
    let Qc = lee(sc, 'Qc', 'el calor del foco caliente', { opcional: true }), Qf = lee(sc, 'Qf', 'el calor del foco frío', { opcional: true }), W = lee(sc, 'W', 'el trabajo', { opcional: true });
    const datos = [Qc, Qf, W].filter((x) => x !== null).length;
    if (datos < 2) throw new Error('Hacen falta dos de los tres: Q del foco caliente, Q del foco frío y W');
    const pasos = [];
    const motor = tipo === 'motor';
    const ec = motor ? 'Q_c = W + Q_f' : 'Q_c = Q_f + W';
    if (W === null) W = Qc - Qf; else if (Qc === null) Qc = W + Qf; else if (Qf === null) Qf = Qc - W;
    if (Math.abs(Qc - W - Qf) > 1e-9 * Math.max(Qc, 1)) throw new Error('Los tres datos no cumplen el primer principio: Q del foco caliente tiene que ser W + Q del foco frío (deja uno vacío)');
    if (!(Qf > 0) || !(W > 0)) throw new Error('Con esos datos sale un calor o un trabajo negativo: revisa cuál es mayor');
    pasos.push({ t: 'Primer principio', html: `${motor ? 'La máquina toma calor del foco caliente, hace trabajo y cede el resto al frío' : 'Con el trabajo se saca calor del foco frío y se echa más al caliente'}: $${ec}$<br>$Q_c$ = ${f(Qc)} J, $Q_f$ = ${f(Qf)} J, $W$ = ${f(W)} J` });
    let ef, nomEf, efC = null;
    if (motor) { ef = W / Qc; nomEf = 'Rendimiento'; pasos.push({ t: 'Rendimiento', html: `$η = W/Q_c = ${f(W)}/${f(Qc)}$ = <b>${f(100 * ef, 3)} %</b>` }); }
    else if (tipo === 'frigorifico') { ef = Qf / W; nomEf = 'Eficiencia (COP)'; pasos.push({ t: 'Eficiencia del frigorífico', html: `$COP = Q_f/W = ${f(Qf)}/${f(W)}$ = <b>${f(ef, 3)}</b>: saca ${f(ef, 3)} J del interior por cada julio de trabajo.` }); }
    else { ef = Qc / W; nomEf = 'Eficiencia (COP)'; pasos.push({ t: 'Eficiencia de la bomba de calor', html: `$COP = Q_c/W = ${f(Qc)}/${f(W)}$ = <b>${f(ef, 3)}</b>: da ${f(ef, 3)} J de calor por cada julio de trabajo.` }); }
    const Tc = lee(sc, 'Tc', 'la temperatura del foco caliente', { opcional: true }), Tf = lee(sc, 'Tf', 'la temperatura del foco frío', { opcional: true });
    let posible = null, dS = null;
    if (Tc && Tf) {
      if (Tf >= Tc) throw new Error('El foco frío tiene que estar a menos temperatura que el caliente');
      efC = motor ? 1 - Tf / Tc : tipo === 'frigorifico' ? Tf / (Tc - Tf) : Tc / (Tc - Tf);
      dS = motor ? -Qc / Tc + Qf / Tf : Qc / Tc - Qf / Tf;
      posible = ef <= efC * (1 + 1e-9);
      pasos.push({ t: 'Límite de Carnot', html: `${motor ? `$η_C = 1 − T_f/T_c = 1 − ${f(Tf)}/${f(Tc)}$ = ${f(100 * efC, 3)} %` : tipo === 'frigorifico' ? `$COP_C = {T_f}/{T_c − T_f} = {${f(Tf)}}/{${f(Tc)} − ${f(Tf)}}$ = ${f(efC, 3)}` : `$COP_C = {T_c}/{T_c − T_f} = {${f(Tc)}}/{${f(Tc)} − ${f(Tf)}}$ = ${f(efC, 3)}`}<br>${posible ? (Math.abs(ef - efC) < 1e-9 * efC ? 'Coincide con el de Carnot: sería una máquina reversible, ideal.' : 'Es menor que el de Carnot: la máquina es posible (e irreversible).') : '<b>Es mayor que el de Carnot: esa máquina es imposible</b>, violaría el segundo principio.'}` });
      pasos.push({ t: 'Entropía del universo', html: `Los focos cambian su entropía: $ΔS = ${motor ? `−Q_c/T_c + Q_f/T_f = −${f(Qc)}/${f(Tc)} + ${f(Qf)}/${f(Tf)}` : `Q_c/T_c − Q_f/T_f = ${f(Qc)}/${f(Tc)} − ${f(Qf)}/${f(Tf)}`}$ = <b>${f(dS)} J/K</b> por ciclo (la del fluido de la máquina no cambia). ${dS >= -1e-12 ? 'Es positiva o cero, como exige el segundo principio.' : 'Sale negativa: imposible.'}` });
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
    { clave: 'carnot', nombre: 'Ciclo de Carnot entre 600 K y 300 K', sc: { modo: 'carnot', gas: 'di', Tc: '600', Tf: '300', n: '1', V1: '10', V2: '20' } },
    { clave: 'carnot-mono', nombre: 'Carnot con un gas monoatómico', sc: { modo: 'carnot', gas: 'mono', Tc: '500', Tf: '350', n: '0,5', V1: '5', V2: '15' } },
    { clave: 'otto', nombre: 'Motor de gasolina (ciclo Otto)', sc: { modo: 'otto', gas: 'di', r: '8', T1: '300', P1: '100', V1: '0,5', datos: 'T3', T3: '1800', rpm: '', cil: '' } },
    { clave: 'otto-calor', nombre: 'Ciclo Otto con el calor de la combustión', sc: { modo: 'otto', gas: 'di', r: '10', T1: '290', P1: '95', V1: '0,6', datos: 'Q', Q: '800', rpm: '', cil: '' } },
    { clave: 'otto-potencia', nombre: 'Potencia de un motor de 4 cilindros a 3000 rpm', sc: { modo: 'otto', gas: 'di', r: '9', T1: '300', P1: '100', V1: '0,4', datos: 'T3', T3: '2000', rpm: '3000', cil: '4' } },
    { clave: 'diesel', nombre: 'Motor diésel', sc: { modo: 'diesel', gas: 'di', r: '18', rc: '2', T1: '300', P1: '100', V1: '1', rpm: '', cil: '' } },
    { clave: 'brayton', nombre: 'Turbina de gas (ciclo Brayton)', sc: { modo: 'brayton', gas: 'di', rp: '10', T1: '300', P1: '100', V1: '1', T3: '1400' } },
    { clave: 'stirling', nombre: 'Motor Stirling', sc: { modo: 'stirling', gas: 'mono', Tc: '700', Tf: '300', n: '1', V1: '1', V2: '3' } },
    { clave: 'rectangulo', nombre: 'Ciclo rectangular (dos isobaras y dos isocoras)', sc: { modo: 'propio', gas: 'mono', n: '1', P1: '100', V1: '10', P2: '300', V2: '10', P3: '300', V3: '30', P4: '100', V4: '30', t12: 'auto', t23: 'auto', t34: 'auto', tfin: 'auto' } },
    { clave: 'triangulo', nombre: 'Ciclo triangular con una recta en p-V', sc: { modo: 'propio', gas: 'di', n: '0,5', P1: '100', V1: '10', P2: '300', V2: '10', P3: '100', V3: '30', P4: '', V4: '', t12: 'auto', t23: 'auto', t34: 'auto', tfin: 'auto' } },
    { clave: 'motor', nombre: 'Máquina térmica: ¿es posible?', sc: { modo: 'maquina', tipo: 'motor', Qc: '1000', Qf: '', W: '350', Tc: '500', Tf: '300' } },
    { clave: 'imposible', nombre: 'Un inventor promete un 60 %', sc: { modo: 'maquina', tipo: 'motor', Qc: '1000', Qf: '400', W: '', Tc: '600', Tf: '300' } },
    { clave: 'frigorifico', nombre: 'Frigorífico doméstico', sc: { modo: 'maquina', tipo: 'frigorifico', Qc: '', Qf: '300', W: '100', Tc: '298', Tf: '268' } },
    { clave: 'bomba', nombre: 'Bomba de calor para calefacción', sc: { modo: 'maquina', tipo: 'bomba', Qc: '3500', Qf: '', W: '1000', Tc: '308', Tf: '278' } },
  ];

  return { resolver, carnot, otto, diesel, brayton, stirling, propio, maquina, ejemplos, f, R, GASES };
})();
if (typeof module !== 'undefined') module.exports = Ciclos;
