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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} manquant`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} doit être un nombre`);
    if (!signo && v <= 0) throw new Error(`${Mayus(nom)} doit être strictement positif`);
    return v;
  }
  const R = 8.314;
  const GASES = { mono: { nom: 'monoatomique', cv: 1.5, cvT: '3/2' }, di: { nom: 'diatomique (air)', cv: 2.5, cvT: '5/2' } };
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
      html = `Isotherme à ${f(a.T)} K : $ΔU = 0$ et $Q = W = n R T ln {V_${hasta}}/{V_${de}} = ${f(n)} · 8,314 · ${f(a.T)} · ln {${f(b.V * 1000)}}/{${f(a.V * 1000)}}$ = <b>${f(W)} J</b>`;
    } else if (tipo === 'adiabatica') {
      Q = 0; W = -U;
      html = `Adiabatique : $Q = 0$, $ΔU = n C_v (T_${hasta} − T_${de}) = ${f(n)} · ${f(G.Cv)} · (${f(b.T)} − ${f(a.T)})$ = ${f(U)} J, et $W = −ΔU$ = <b>${f(W)} J</b>`;
    } else if (tipo === 'isocora') {
      W = 0; Q = U;
      html = `Isochore : $W = 0$ et $Q = ΔU = n C_v (T_${hasta} − T_${de}) = ${f(n)} · ${f(G.Cv)} · (${f(b.T)} − ${f(a.T)})$ = <b>${f(Q)} J</b>`;
    } else if (tipo === 'recta') {
      W = ((a.P + b.P) / 2) * (b.V - a.V); Q = U + W;
      html = `Droite dans le diagramme p-V : le travail est l’aire du trapèze, $W = {P_${de} + P_${hasta}}/2 · (V_${hasta} − V_${de}) = {${f(a.P)} + ${f(b.P)}}/2 · (${f(b.V)} − ${f(a.V)})$ = ${f(W)} J, $ΔU = n C_v ΔT = ${f(U)}$ J et $Q = ΔU + W$ = <b>${f(Q)} J</b>`;
    } else {
      W = a.P * (b.V - a.V); Q = n * G.Cp * (b.T - a.T);
      html = `Isobare à ${f(a.P / 1000)} kPa : $W = P ΔV = ${f(a.P)} · (${f(b.V)} − ${f(a.V)})$ = ${f(W)} J, $Q = n C_p ΔT = ${f(n)} · ${f(G.Cp)} · (${f(b.T)} − ${f(a.T)})$ = <b>${f(Q)} J</b>, $ΔU = Q − W$ = ${f(U)} J`;
    }
    const S = tipo === 'adiabatica' ? 0 : n * G.Cv * Math.log(b.T / a.T) + n * R * Math.log(b.V / a.V);
    let Tpico = Math.max(a.T, b.T);
    if (tipo === 'recta') { const dP = b.P - a.P, dV = b.V - a.V, s0 = -(a.P * dV + a.V * dP) / (2 * dP * dV); if (s0 > 0 && s0 < 1) Tpico = Math.max(Tpico, ((a.P + dP * s0) * (a.V + dV * s0)) / (n * R)); }
    return { de, a: hasta, nom, tipo, W, Q, U, S, Tpico, html };
  }
  const NOMBRE = { isoterma: 'isoterma', adiabatica: 'adiabatique', isocora: 'isocora', isobara: 'isobara', recta: 'droite en p-V' };

  function balance(est, tramos, pasos, formula) {
    const W = tramos.reduce((s, t) => s + t.W, 0), Qabs = tramos.reduce((s, t) => s + Math.max(0, t.Q), 0), Qced = tramos.reduce((s, t) => s + Math.min(0, t.Q), 0);
    const eta = W / Qabs, Tmax = Math.max(...est.map((e) => e.T), ...tramos.map((t) => t.Tpico)), Tmin = Math.min(...est.map((e) => e.T)), etaC = 1 - Tmin / Tmax;
    pasos.push({ t: 'Bilan du cycle', html: `Il revient à l’état initial, donc $ΔU = 0$ et $W_{net} = Q_{net}$ = <b>${f(W)} J</b><br>Chaleur absorbée $Q_{abs} = ${f(Qabs)}$ J, cédée $Q_{ced} = ${f(Qced)}$ J` });
    pasos.push({ t: 'Rendement', html: `$η = {W_{neto}}/{Q_{abs}} = {${f(W)}}/{${f(Qabs)}}$ = <b>${f(100 * eta, 3)} %</b>${formula ? `<br>${formula}` : ''}` });
    pasos.push({ t: 'Comparé à Carnot', html: `Une machine de Carnot entre la température la plus haute et la plus basse du cycle aurait $η_C = 1 − T_{min}/T_{max} = 1 − ${f(Tmin)}/${f(Tmax)}$ = ${f(100 * etaC, 3)} %, le maximum possible entre ces températures.` });
    pasos.push({ t: 'Entropie de chaque transformation (diagramme T-S)', html: `Pour un gaz parfait, $ΔS = n C_v ln {T_b}/{T_a} + n R ln {V_b}/{V_a}$ (0 pour les adiabatiques réversibles) : ${tramos.map((t) => `${t.nom} : ${f(t.S)} J/K`).join(', ')}. La somme est 0 parce que S est une fonction d’état. Dans le diagramme T-S, l’aire délimitée est aussi le travail net.` });
    return { W, Qabs, Qced, eta, Tmax, Tmin, etaC };
  }
  function potencia(sc, W, pasos) {
    const rpm = lee(sc, 'rpm', 'le nombre de tours par minute', { opcional: true });
    if (rpm === null) return null;
    const cil = lee(sc, 'cil', 'le nombre de cylindres', { opcional: true }) ?? 1, P = (cil * W * rpm) / 120;
    pasos.push({ t: 'Puissance du moteur', html: `Dans un moteur à quatre temps, chaque cylindre effectue un cycle tous les deux tours : $P = {N_{cil} · W · rpm}/{2 · 60} = {${f(cil)} · ${f(W)} · ${f(rpm)}}/{120}$ = <b>${f(P / 1000)} kW</b> (${f(P / 735.5)} ch). C’est la puissance du cycle idéal ; celle d’un moteur réel est nettement inférieure.` });
    return P;
  }
  const estado = (nom, P, V, T) => ({ nom, P, V, T });
  function inicial(sc, G) {
    const T1 = lee(sc, 'T1', 'la température initiale'), P1 = lee(sc, 'P1', 'la pression initiale') * 1000, V1 = lee(sc, 'V1', 'le volume initial') / 1000;
    const n = (P1 * V1) / (R * T1);
    return { T1, P1, V1, n, paso: { t: 'Gaz et état initial', html: `Gaz parfait ${G.nom} : $${G.frac} = ${f(G.Cv)}$ J/(mol·K), $C_p = C_v + R = ${f(G.Cp)}$ J/(mol·K), $γ = C_p/C_v = ${f(G.gam)}$.<br>$n = {P_1 V_1}/{R T_1} = {${f(P1)} · ${f(V1)}}/{8,314 · ${f(T1)}}$ = ${f(n)} mol` } };
  }

  function carnot(sc) {
    const G = gasDe(sc), Tc = lee(sc, 'Tc', 'la température de la source chaude'), Tf = lee(sc, 'Tf', 'la température de la source froide');
    if (Tf >= Tc) throw new Error('La source froide doit être à une température inférieure à celle de la source chaude');
    const n = lee(sc, 'n', 'le nombre de moles'), V1 = lee(sc, 'V1', 'le volume initial') / 1000, V2 = lee(sc, 'V2', 'le volume à la fin de la détente isotherme') / 1000;
    if (V2 <= V1) throw new Error('Dans la détente isotherme, le volume doit augmenter : V₂ > V₁');
    const k = (Tc / Tf) ** (1 / (G.gam - 1)), V3 = V2 * k, V4 = V1 * k;
    const P = (V, T) => (n * R * T) / V;
    const est = [estado('1', P(V1, Tc), V1, Tc), estado('2', P(V2, Tc), V2, Tc), estado('3', P(V3, Tf), V3, Tf), estado('4', P(V4, Tf), V4, Tf)];
    const pasos = [{ t: 'Gaz', html: `Gaz parfait ${G.nom} : $${G.frac} = ${f(G.Cv)}$ J/(mol·K) et $γ = ${f(G.gam)}$, avec n = ${f(n)} mol.` }];
    pasos.push({ t: 'Volumes des adiabatiques', html: `Dans une adiabatique, $T V^{γ − 1}$ = cte, donc $V_3 = V_2 (T_c/T_f)^{1/(γ − 1)} = ${f(V2 * 1000)} · (${f(Tc)}/${f(Tf)})^{${f(1 / (G.gam - 1))}}$ = ${f(V3 * 1000)} L et $V_4 = V_1 (T_c/T_f)^{1/(γ − 1)}$ = ${f(V4 * 1000)} L` });
    const tipos = ['isoterma', 'adiabatica', 'isoterma', 'adiabatica'];
    const tramos = tipos.map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Transformation ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `Cela coïncide avec la formule de Carnot : $η = 1 − T_f/T_c = 1 − ${f(Tf)}/${f(Tc)} = ${f(100 * (1 - Tf / Tc), 3)}$ %`);
    pasos.push({ t: 'Entropie', html: `Dans l’isotherme chaude, le gaz gagne $ΔS = Q_{abs}/T_c = ${f(b.Qabs / Tc)}$ J/K et, dans la froide, il perd $Q_{ced}/T_f = ${f(b.Qced / Tf)}$ J/K : dans le cycle réversible, l’entropie de l’univers ne change pas.` });
    return { modo: 'carnot', G, n, est, tramos, ...b, pasos };
  }

  function otto(sc) {
    const G = gasDe(sc), r = lee(sc, 'r', 'le taux de compression');
    if (r <= 1) throw new Error('Le taux de compression doit être supérieur à 1');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, V2 = V1 / r;
    const T2 = T1 * r ** (G.gam - 1), P2 = P1 * r ** G.gam;
    let T3;
    const pasos = [I.paso, { t: '1→2 : compression adiabatique', html: `$V_2 = V_1/r = ${f(V1 * 1000)}/${f(r)} = ${f(V2 * 1000)}$ L, $T_2 = T_1 r^{γ − 1} = ${f(T1)} · ${f(r)}^{${f(G.gam - 1)}}$ = ${f(T2)} K, $P_2 = P_1 r^γ$ = ${f(P2 / 1000)} kPa` }];
    if (sc.datos === 'Q') {
      const Q = lee(sc, 'Q', 'la chaleur de combustion'); T3 = T2 + Q / (n * G.Cv);
      pasos.push({ t: '2→3 : combustion à volume constant', html: `$Q = n C_v (T_3 − T_2)$, $T_3 = T_2 + {Q}/{n C_v} = ${f(T2)} + {${f(Q)}}/{${f(n)} · ${f(G.Cv)}}$ = ${f(T3)} K` });
    } else {
      T3 = lee(sc, 'T3', 'la température maximale');
      if (T3 <= T2) throw new Error(`La température maximale doit être supérieure à celle de la fin de la compression (${f(T2)} K)`);
      pasos.push({ t: '2→3 : combustion à volume constant', html: `Atteint $T_3 = ${f(T3)}$ K avec $V_3 = V_2$` });
    }
    const P3 = (P2 * T3) / T2, T4 = T3 * r ** (1 - G.gam), P4 = (P1 * T4) / T1;
    pasos.push({ t: '3→4 : détente adiabatique', html: `$T_4 = T_3 r^{1 − γ} = ${f(T3)} · ${f(r)}^{${f(1 - G.gam)}}$ = ${f(T4)} K, $P_4$ = ${f(P4 / 1000)} kPa, avec $V_4 = V_1$` });
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P3, V2, T3), estado('4', P4, V1, T4)];
    const tramos = ['adiabatica', 'isocora', 'adiabatica', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Transformation ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `Avec la formule du cycle d’Otto : $η = 1 − r^{1 − γ} = 1 − ${f(r)}^{${f(1 - G.gam)}} = ${f(100 * (1 - r ** (1 - G.gam)), 3)}$ % : il ne dépend que du taux de compression.`);
    const Pot = potencia(sc, b.W, pasos);
    return { modo: 'otto', G, n, r, est, tramos, ...b, Pot, pasos };
  }

  function diesel(sc) {
    const G = gasDe(sc), r = lee(sc, 'r', 'le taux de compression'), rc = lee(sc, 'rc', 'le rapport de détente');
    if (r <= 1) throw new Error('Le taux de compression doit être supérieur à 1');
    if (rc <= 1 || rc >= r) throw new Error('Le rapport de détente doit être compris entre 1 et le taux de compression');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, V2 = V1 / r, V3 = rc * V2;
    const T2 = T1 * r ** (G.gam - 1), P2 = P1 * r ** G.gam, T3 = T2 * rc, T4 = T3 * (V3 / V1) ** (G.gam - 1), P4 = (P1 * T4) / T1;
    const pasos = [I.paso,
      { t: '1→2 : compression adiabatique', html: `$V_2 = V_1/r = ${f(V2 * 1000)}$ L, $T_2 = T_1 r^{γ − 1}$ = ${f(T2)} K, $P_2 = P_1 r^γ$ = ${f(P2 / 1000)} kPa` },
      { t: '2→3 : combustion à pression constante', html: `$V_3 = r_c V_2 = ${f(rc)} · ${f(V2 * 1000)} = ${f(V3 * 1000)}$ L et, comme P est constante, $T_3 = T_2 V_3/V_2 = T_2 r_c$ = ${f(T3)} K` },
      { t: '3→4 : détente adiabatique', html: `$T_4 = T_3 (V_3/V_1)^{γ − 1} = ${f(T3)} · (${f(V3 * 1000)}/${f(V1 * 1000)})^{${f(G.gam - 1)}}$ = ${f(T4)} K, $P_4$ = ${f(P4 / 1000)} kPa` }];
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P2, V3, T3), estado('4', P4, V1, T4)];
    const tramos = ['adiabatica', 'isobara', 'adiabatica', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Transformation ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const etaF = 1 - (rc ** G.gam - 1) / (G.gam * r ** (G.gam - 1) * (rc - 1));
    const b = balance(est, tramos, pasos, `Avec la formule du cycle Diesel : $η = 1 − {r_c^γ − 1}/{γ r^{γ − 1} (r_c − 1)} = ${f(100 * etaF, 3)}$ %. Un cycle d’Otto de même r aurait ${f(100 * (1 - r ** (1 - G.gam)), 3)} %.`);
    const Pot = potencia(sc, b.W, pasos);
    return { modo: 'diesel', G, n, r, rc, est, tramos, ...b, Pot, pasos };
  }

  function brayton(sc) {
    const G = gasDe(sc), rp = lee(sc, 'rp', 'le rapport de pressions');
    if (rp <= 1) throw new Error('Le rapport de pressions doit être supérieur à 1');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, e = (G.gam - 1) / G.gam;
    const T2 = T1 * rp ** e, P2 = P1 * rp, V2 = V1 * rp ** (-1 / G.gam), T3 = lee(sc, 'T3', 'la température à l’entrée de la turbine');
    if (T3 <= T2) throw new Error(`La température à l’entrée de la turbine doit être supérieure à celle de la sortie du compresseur (${f(T2)} K)`);
    const V3 = (V2 * T3) / T2, T4 = T3 * rp ** -e, V4 = (V1 * T4) / T1;
    const pasos = [I.paso,
      { t: '1→2 : compresseur (adiabatique)', html: `$P_2 = r_p P_1 = ${f(P2 / 1000)}$ kPa, $T_2 = T_1 r_p^{(γ − 1)/γ} = ${f(T1)} · ${f(rp)}^{${f(e)}}$ = ${f(T2)} K, $V_2 = V_1 r_p^{−1/γ}$ = ${f(V2 * 1000)} L` },
      { t: '2→3 : chambre de combustion (isobare)', html: `Atteint $T_3 = ${f(T3)}$ K à pression constante : $V_3 = V_2 T_3/T_2$ = ${f(V3 * 1000)} L` },
      { t: '3→4 : turbine (adiabatique)', html: `$T_4 = T_3 r_p^{−(γ − 1)/γ}$ = ${f(T4)} K, $P_4 = P_1$, $V_4 = V_1 T_4/T_1$ = ${f(V4 * 1000)} L` }];
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P2, V3, T3), estado('4', P1, V4, T4)];
    const tramos = ['adiabatica', 'isobara', 'adiabatica', 'isobara'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Transformation ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `Avec la formule du cycle de Brayton : $η = 1 − r_p^{−(γ − 1)/γ} = 1 − ${f(rp)}^{−${f(e)}} = ${f(100 * (1 - rp ** -e), 3)}$ % : il ne dépend que du rapport de pressions.`);
    return { modo: 'brayton', G, n, rp, est, tramos, ...b, pasos };
  }

  function stirling(sc) {
    const G = gasDe(sc), Tc = lee(sc, 'Tc', 'la température de la source chaude'), Tf = lee(sc, 'Tf', 'la température de la source froide');
    if (Tf >= Tc) throw new Error('La source froide doit être à une température inférieure à celle de la source chaude');
    const n = lee(sc, 'n', 'le nombre de moles'), V1 = lee(sc, 'V1', 'le volume minimal') / 1000, V2 = lee(sc, 'V2', 'le volume maximal') / 1000;
    if (V2 <= V1) throw new Error('Le volume maximal doit être supérieur au volume minimal');
    const P = (V, T) => (n * R * T) / V;
    const est = [estado('1', P(V1, Tc), V1, Tc), estado('2', P(V2, Tc), V2, Tc), estado('3', P(V2, Tf), V2, Tf), estado('4', P(V1, Tf), V1, Tf)];
    const pasos = [{ t: 'Gaz et états', html: `Gaz parfait ${G.nom} : $${G.frac} = ${f(G.Cv)}$ J/(mol·K), avec n = ${f(n)} mol. Deux isothermes, à $T_c = ${f(Tc)}$ K et $T_f = ${f(Tf)}$ K, reliées par deux isochores entre $V_1 = ${f(V1 * 1000)}$ L et $V_2 = ${f(V2 * 1000)}$ L. Les pressions viennent de $P = nRT/V$.` }];
    const tramos = ['isoterma', 'isocora', 'isoterma', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Transformation ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const Wn = tramos.reduce((s2, t) => s2 + t.W, 0), etaReg = Wn / tramos[0].Q;
    const b = balance(est, tramos, pasos, `Avec un régénérateur idéal, la chaleur que le gaz cède dans l’isochore 2→3 est stockée et lui est restituée dans la 4→1 ; alors la chaleur n’est absorbée que dans l’isotherme chaude et $η = W/Q_{12} = ${f(Wn)}/${f(tramos[0].Q)} = ${f(100 * etaReg, 3)}$ %, comme Carnot.`);
    return { modo: 'stirling', G, n, est, tramos, ...b, etaReg, pasos };
  }

  function propio(sc) {
    const G = gasDe(sc), n = lee(sc, 'n', 'le nombre de moles'), est = [];
    for (let i = 1; i <= 4; i++) {
      const P = lee(sc, `P${i}`, `la pression de l’état ${i}`, { opcional: i === 4 }), V = lee(sc, `V${i}`, `le volume de l’état ${i}`, { opcional: i === 4 });
      if (i === 4 && (P === null) !== (V === null)) throw new Error('Pour l’état 4, il faut la pression et le volume (ou aucun des deux, pour un cycle à trois transformations)');
      if (P !== null) est.push(estado(String(i), P * 1000, V / 1000, (P * V) / (n * R)));
    }
    const N = est.length, pasos = [{ t: 'États', html: `Gaz parfait ${G.nom}, n = ${f(n)} mol. Chaque température vient de $T = PV/(nR)$ : ${est.map((e) => `$T_${e.nom} = ${f(e.T)}$ K`).join(', ')}.` }];
    const tramos = [];
    for (let i = 0; i < N; i++) {
      const a = est[i], b = est[(i + 1) % N], k = i === N - 1 ? 'tfin' : `t${a.nom}${b.nom}`, pedido = sc[k] || 'auto', cerca = (x, y) => Math.abs(x - y) <= 1e-6 * Math.max(Math.abs(x), Math.abs(y));
      if (cerca(a.P, b.P) && cerca(a.V, b.V)) throw new Error(`Les états ${a.nom} et ${b.nom} sont identiques`);
      let tipo = cerca(a.V, b.V) ? 'isocora' : cerca(a.P, b.P) ? 'isobara' : 'recta';
      if (pedido === 'isoterma') { if (Math.abs(a.P * a.V - b.P * b.V) > 0.01 * a.P * a.V) throw new Error(`La transformation ${a.nom}→${b.nom} ne peut pas être une isotherme : PV passe de ${f(a.P * a.V)} à ${f(b.P * b.V)} J (il faudrait qu’ils soient égaux)`); tipo = 'isoterma'; }
      if (pedido === 'adiabatica') { if (Math.abs(a.P * a.V ** G.gam - b.P * b.V ** G.gam) > 0.01 * a.P * a.V ** G.gam) throw new Error(`La transformation ${a.nom}→${b.nom} ne peut pas être une adiabatique : PV^γ ne se conserve pas entre ces états`); tipo = 'adiabatica'; }
      tramos.push(tramo(tipo, a, b, n, G, a.nom, b.nom));
    }
    for (const t of tramos) pasos.push({ t: `Transformation ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, W0(tramos) < 0 ? 'Le travail net est négatif : le cycle est parcouru dans le sens antihoraire dans le diagramme p-V, ce n’est donc pas un moteur mais un réfrigérateur (ou une pompe à chaleur).' : '');
    return { modo: 'propio', G, n, est, tramos, ...b, pasos };
  }
  const W0 = (tramos) => tramos.reduce((s2, t) => s2 + t.W, 0);

  function maquina(sc) {
    const tipo = ['frigorifico', 'bomba'].includes(sc.tipo) ? sc.tipo : 'motor';
    let Qc = lee(sc, 'Qc', 'la chaleur de la source chaude', { opcional: true }), Qf = lee(sc, 'Qf', 'la chaleur de la source froide', { opcional: true }), W = lee(sc, 'W', 'le travail', { opcional: true });
    const datos = [Qc, Qf, W].filter((x) => x !== null).length;
    if (datos < 2) throw new Error('Il faut deux des trois : Q de la source chaude, Q de la source froide et W');
    const pasos = [];
    const motor = tipo === 'motor';
    const ec = motor ? 'Q_c = W + Q_f' : 'Q_c = Q_f + W';
    if (W === null) W = Qc - Qf; else if (Qc === null) Qc = W + Qf; else if (Qf === null) Qf = Qc - W;
    if (Math.abs(Qc - W - Qf) > 1e-9 * Math.max(Qc, 1)) throw new Error('Les trois données ne respectent pas le premier principe : Q de la source chaude doit être W + Q de la source froide (laisse-en une vide)');
    if (!(Qf > 0) || !(W > 0)) throw new Error('Avec ces données, on obtient une chaleur ou un travail négatif : vérifie laquelle est la plus grande');
    pasos.push({ t: 'Premier principe', html: `${motor ? 'La machine prend de la chaleur à la source chaude, fournit du travail et cède le reste à la source froide' : 'Avec du travail, on prélève de la chaleur à la source froide et on en rejette davantage vers la source chaude'}: $${ec}$<br>$Q_c$ = ${f(Qc)} J, $Q_f$ = ${f(Qf)} J, $W$ = ${f(W)} J` });
    let ef, nomEf, efC = null;
    if (motor) { ef = W / Qc; nomEf = 'Rendement'; pasos.push({ t: 'Rendement', html: `$η = W/Q_c = ${f(W)}/${f(Qc)}$ = <b>${f(100 * ef, 3)} %</b>` }); }
    else if (tipo === 'frigorifico') { ef = Qf / W; nomEf = 'Efficacité (COP)'; pasos.push({ t: 'Efficacité du réfrigérateur', html: `$COP = Q_f/W = ${f(Qf)}/${f(W)}$ = <b>${f(ef, 3)}</b> : il extrait ${f(ef, 3)} J de l’intérieur pour chaque joule de travail.` }); }
    else { ef = Qc / W; nomEf = 'Efficacité (COP)'; pasos.push({ t: 'Efficacité de la pompe à chaleur', html: `$COP = Q_c/W = ${f(Qc)}/${f(W)}$ = <b>${f(ef, 3)}</b> : elle fournit ${f(ef, 3)} J de chaleur pour chaque joule de travail.` }); }
    const Tc = lee(sc, 'Tc', 'la température de la source chaude', { opcional: true }), Tf = lee(sc, 'Tf', 'la température de la source froide', { opcional: true });
    let posible = null, dS = null;
    if (Tc && Tf) {
      if (Tf >= Tc) throw new Error('La source froide doit être à une température inférieure à celle de la source chaude');
      efC = motor ? 1 - Tf / Tc : tipo === 'frigorifico' ? Tf / (Tc - Tf) : Tc / (Tc - Tf);
      dS = motor ? -Qc / Tc + Qf / Tf : Qc / Tc - Qf / Tf;
      posible = ef <= efC * (1 + 1e-9);
      pasos.push({ t: 'Limite de Carnot', html: `${motor ? `$η_C = 1 − T_f/T_c = 1 − ${f(Tf)}/${f(Tc)}$ = ${f(100 * efC, 3)} %` : tipo === 'frigorifico' ? `$COP_C = {T_f}/{T_c − T_f} = {${f(Tf)}}/{${f(Tc)} − ${f(Tf)}}$ = ${f(efC, 3)}` : `$COP_C = {T_c}/{T_c − T_f} = {${f(Tc)}}/{${f(Tc)} − ${f(Tf)}}$ = ${f(efC, 3)}`}<br>${posible ? (Math.abs(ef - efC) < 1e-9 * efC ? 'Elle coïncide avec celle de Carnot : ce serait une machine réversible, idéale.' : 'Elle est inférieure à celle de Carnot : la machine est possible (et irréversible).') : '<b>Elle est supérieure à celle de Carnot : cette machine est impossible</b>, elle violerait le second principe.'}` });
      pasos.push({ t: 'Entropie de l’univers', html: `Les sources changent d’entropie : $ΔS = ${motor ? `−Q_c/T_c + Q_f/T_f = −${f(Qc)}/${f(Tc)} + ${f(Qf)}/${f(Tf)}` : `Q_c/T_c − Q_f/T_f = ${f(Qc)}/${f(Tc)} − ${f(Qf)}/${f(Tf)}`}$ = <b>${f(dS)} J/K</b> par cycle (celle du fluide de la machine ne change pas). ${dS >= -1e-12 ? 'Elle est positive ou nulle, comme l’exige le second principe.' : 'Elle est négative : impossible.'}` });
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
    { clave: 'carnot', nombre: 'Cycle de Carnot entre 600 K et 300 K', sc: { modo: 'carnot', gas: 'di', Tc: '600', Tf: '300', n: '1', V1: '10', V2: '20' } },
    { clave: 'carnot-mono', nombre: 'Carnot avec un gaz monoatomique', sc: { modo: 'carnot', gas: 'mono', Tc: '500', Tf: '350', n: '0,5', V1: '5', V2: '15' } },
    { clave: 'otto', nombre: 'Moteur à essence (cycle d’Otto)', sc: { modo: 'otto', gas: 'di', r: '8', T1: '300', P1: '100', V1: '0,5', datos: 'T3', T3: '1800', rpm: '', cil: '' } },
    { clave: 'otto-calor', nombre: 'Cycle d’Otto avec la chaleur de combustion', sc: { modo: 'otto', gas: 'di', r: '10', T1: '290', P1: '95', V1: '0,6', datos: 'Q', Q: '800', rpm: '', cil: '' } },
    { clave: 'otto-potencia', nombre: 'Puissance d’un moteur à 4 cylindres à 3000 tr/min', sc: { modo: 'otto', gas: 'di', r: '9', T1: '300', P1: '100', V1: '0,4', datos: 'T3', T3: '2000', rpm: '3000', cil: '4' } },
    { clave: 'diesel', nombre: 'Moteur diesel', sc: { modo: 'diesel', gas: 'di', r: '18', rc: '2', T1: '300', P1: '100', V1: '1', rpm: '', cil: '' } },
    { clave: 'brayton', nombre: 'Turbine à gaz (cycle de Brayton)', sc: { modo: 'brayton', gas: 'di', rp: '10', T1: '300', P1: '100', V1: '1', T3: '1400' } },
    { clave: 'stirling', nombre: 'Moteur Stirling', sc: { modo: 'stirling', gas: 'mono', Tc: '700', Tf: '300', n: '1', V1: '1', V2: '3' } },
    { clave: 'rectangulo', nombre: 'Cycle rectangulaire (deux isobares et deux isochores)', sc: { modo: 'propio', gas: 'mono', n: '1', P1: '100', V1: '10', P2: '300', V2: '10', P3: '300', V3: '30', P4: '100', V4: '30', t12: 'auto', t23: 'auto', t34: 'auto', tfin: 'auto' } },
    { clave: 'triangulo', nombre: 'Cycle triangulaire avec une droite en p-V', sc: { modo: 'propio', gas: 'di', n: '0,5', P1: '100', V1: '10', P2: '300', V2: '10', P3: '100', V3: '30', P4: '', V4: '', t12: 'auto', t23: 'auto', t34: 'auto', tfin: 'auto' } },
    { clave: 'motor', nombre: 'Machine thermique : est-elle possible ?', sc: { modo: 'maquina', tipo: 'motor', Qc: '1000', Qf: '', W: '350', Tc: '500', Tf: '300' } },
    { clave: 'imposible', nombre: 'Un inventeur promet 60 %', sc: { modo: 'maquina', tipo: 'motor', Qc: '1000', Qf: '400', W: '', Tc: '600', Tf: '300' } },
    { clave: 'frigorifico', nombre: 'Réfrigérateur domestique', sc: { modo: 'maquina', tipo: 'frigorifico', Qc: '', Qf: '300', W: '100', Tc: '298', Tf: '268' } },
    { clave: 'bomba', nombre: 'Pompe à chaleur pour le chauffage', sc: { modo: 'maquina', tipo: 'bomba', Qc: '3500', Qf: '', W: '1000', Tc: '308', Tf: '278' } },
  ];

  return { resolver, carnot, otto, diesel, brayton, stirling, propio, maquina, ejemplos, f, R, GASES };
})();

