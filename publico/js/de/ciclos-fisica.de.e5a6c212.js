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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Es fehlt ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} muss eine Zahl sein`);
    if (!signo && v <= 0) throw new Error(`${Mayus(nom)} muss größer als 0 sein`);
    return v;
  }
  const R = 8.314;
  const GASES = { mono: { nom: 'einatomig', cv: 1.5, cvT: '3/2' }, di: { nom: 'zweiatomig (Luft)', cv: 2.5, cvT: '5/2' } };
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
      html = `Isotherme bei ${f(a.T)} K: $ΔU = 0$ und $Q = W = n R T ln {V_${hasta}}/{V_${de}} = ${f(n)} · 8,314 · ${f(a.T)} · ln {${f(b.V * 1000)}}/{${f(a.V * 1000)}}$ = <b>${f(W)} J</b>`;
    } else if (tipo === 'adiabatica') {
      Q = 0; W = -U;
      html = `Adiabate: $Q = 0$, $ΔU = n C_v (T_${hasta} − T_${de}) = ${f(n)} · ${f(G.Cv)} · (${f(b.T)} − ${f(a.T)})$ = ${f(U)} J, und $W = −ΔU$ = <b>${f(W)} J</b>`;
    } else if (tipo === 'isocora') {
      W = 0; Q = U;
      html = `Isochore: $W = 0$ und $Q = ΔU = n C_v (T_${hasta} − T_${de}) = ${f(n)} · ${f(G.Cv)} · (${f(b.T)} − ${f(a.T)})$ = <b>${f(Q)} J</b>`;
    } else if (tipo === 'recta') {
      W = ((a.P + b.P) / 2) * (b.V - a.V); Q = U + W;
      html = `Gerade im p-V-Diagramm: Die Arbeit ist die Trapezfläche, $W = {P_${de} + P_${hasta}}/2 · (V_${hasta} − V_${de}) = {${f(a.P)} + ${f(b.P)}}/2 · (${f(b.V)} − ${f(a.V)})$ = ${f(W)} J, $ΔU = n C_v ΔT = ${f(U)}$ J und $Q = ΔU + W$ = <b>${f(Q)} J</b>`;
    } else {
      W = a.P * (b.V - a.V); Q = n * G.Cp * (b.T - a.T);
      html = `Isobare bei ${f(a.P / 1000)} kPa: $W = P ΔV = ${f(a.P)} · (${f(b.V)} − ${f(a.V)})$ = ${f(W)} J, $Q = n C_p ΔT = ${f(n)} · ${f(G.Cp)} · (${f(b.T)} − ${f(a.T)})$ = <b>${f(Q)} J</b>, $ΔU = Q − W$ = ${f(U)} J`;
    }
    const S = tipo === 'adiabatica' ? 0 : n * G.Cv * Math.log(b.T / a.T) + n * R * Math.log(b.V / a.V);
    let Tpico = Math.max(a.T, b.T);
    if (tipo === 'recta') { const dP = b.P - a.P, dV = b.V - a.V, s0 = -(a.P * dV + a.V * dP) / (2 * dP * dV); if (s0 > 0 && s0 < 1) Tpico = Math.max(Tpico, ((a.P + dP * s0) * (a.V + dV * s0)) / (n * R)); }
    return { de, a: hasta, nom, tipo, W, Q, U, S, Tpico, html };
  }
  const NOMBRE = { isoterma: 'isoterma', adiabatica: 'Adiabate', isocora: 'isocora', isobara: 'isobara', recta: 'Gerade im p-V-Diagramm' };

  function balance(est, tramos, pasos, formula) {
    const W = tramos.reduce((s, t) => s + t.W, 0), Qabs = tramos.reduce((s, t) => s + Math.max(0, t.Q), 0), Qced = tramos.reduce((s, t) => s + Math.min(0, t.Q), 0);
    const eta = W / Qabs, Tmax = Math.max(...est.map((e) => e.T), ...tramos.map((t) => t.Tpico)), Tmin = Math.min(...est.map((e) => e.T)), etaC = 1 - Tmin / Tmax;
    pasos.push({ t: 'Bilanz des Kreisprozesses', html: `Er kehrt in den Anfangszustand zurück, also $ΔU = 0$ und $W_{netto} = Q_{netto}$ = <b>${f(W)} J</b><br>Aufgenommene Wärme $Q_{auf} = ${f(Qabs)}$ J, abgegebene $Q_{ab} = ${f(Qced)}$ J` });
    pasos.push({ t: 'Wirkungsgrad', html: `$η = {W_{neto}}/{Q_{abs}} = {${f(W)}}/{${f(Qabs)}}$ = <b>${f(100 * eta, 3)} %</b>${formula ? `<br>${formula}` : ''}` });
    pasos.push({ t: 'Vergleich mit Carnot', html: `Eine Carnot-Maschine zwischen der höchsten und der niedrigsten Temperatur des Kreisprozesses hätte $η_C = 1 − T_{min}/T_{max} = 1 − ${f(Tmin)}/${f(Tmax)}$ = ${f(100 * etaC, 3)} %, das Maximum zwischen diesen Temperaturen.` });
    pasos.push({ t: 'Entropie jedes Abschnitts (T-S-Diagramm)', html: `In einem idealen Gas gilt $ΔS = n C_v ln {T_b}/{T_a} + n R ln {V_b}/{V_a}$ (0 bei reversiblen Adiabaten): ${tramos.map((t) => `${t.nom}: ${f(t.S)} J/K`).join(', ')}. Die Summe ist 0, weil S eine Zustandsfunktion ist. Im T-S-Diagramm ist die eingeschlossene Fläche ebenfalls die Nettoarbeit.` });
    return { W, Qabs, Qced, eta, Tmax, Tmin, etaC };
  }
  function potencia(sc, W, pasos) {
    const rpm = lee(sc, 'rpm', 'die Umdrehungen pro Minute', { opcional: true });
    if (rpm === null) return null;
    const cil = lee(sc, 'cil', 'die Anzahl der Zylinder', { opcional: true }) ?? 1, P = (cil * W * rpm) / 120;
    pasos.push({ t: 'Motorleistung', html: `In einem Viertaktmotor macht jeder Zylinder alle zwei Umdrehungen einen Zyklus: $P = {N_{Zyl} · W · U/min}/{2 · 60} = {${f(cil)} · ${f(W)} · ${f(rpm)}}/{120}$ = <b>${f(P / 1000)} kW</b> (${f(P / 735.5)} PS). Das ist die Leistung des idealen Kreisprozesses; die eines echten Motors ist deutlich geringer.` });
    return P;
  }
  const estado = (nom, P, V, T) => ({ nom, P, V, T });
  function inicial(sc, G) {
    const T1 = lee(sc, 'T1', 'die Anfangstemperatur'), P1 = lee(sc, 'P1', 'der Anfangsdruck') * 1000, V1 = lee(sc, 'V1', 'das Anfangsvolumen') / 1000;
    const n = (P1 * V1) / (R * T1);
    return { T1, P1, V1, n, paso: { t: 'Gas und Anfangszustand', html: `Ideales Gas ${G.nom}: $${G.frac} = ${f(G.Cv)}$ J/(mol·K), $C_p = C_v + R = ${f(G.Cp)}$ J/(mol·K), $γ = C_p/C_v = ${f(G.gam)}$.<br>$n = {P_1 V_1}/{R T_1} = {${f(P1)} · ${f(V1)}}/{8,314 · ${f(T1)}}$ = ${f(n)} mol` } };
  }

  function carnot(sc) {
    const G = gasDe(sc), Tc = lee(sc, 'Tc', 'die Temperatur des heißen Reservoirs'), Tf = lee(sc, 'Tf', 'die Temperatur des kalten Reservoirs');
    if (Tf >= Tc) throw new Error('Das kalte Reservoir muss eine niedrigere Temperatur haben als das heiße');
    const n = lee(sc, 'n', 'die Stoffmenge in mol'), V1 = lee(sc, 'V1', 'das Anfangsvolumen') / 1000, V2 = lee(sc, 'V2', 'das Volumen am Ende der isothermen Expansion') / 1000;
    if (V2 <= V1) throw new Error('Bei der isothermen Expansion muss das Volumen zunehmen: V₂ > V₁');
    const k = (Tc / Tf) ** (1 / (G.gam - 1)), V3 = V2 * k, V4 = V1 * k;
    const P = (V, T) => (n * R * T) / V;
    const est = [estado('1', P(V1, Tc), V1, Tc), estado('2', P(V2, Tc), V2, Tc), estado('3', P(V3, Tf), V3, Tf), estado('4', P(V4, Tf), V4, Tf)];
    const pasos = [{ t: 'Gas', html: `Ideales Gas ${G.nom}: $${G.frac} = ${f(G.Cv)}$ J/(mol·K) und $γ = ${f(G.gam)}$, mit n = ${f(n)} mol.` }];
    pasos.push({ t: 'Volumina der Adiabaten', html: `Bei einer Adiabate gilt $T V^{γ − 1}$ = const, also $V_3 = V_2 (T_h/T_k)^{1/(γ − 1)} = ${f(V2 * 1000)} · (${f(Tc)}/${f(Tf)})^{${f(1 / (G.gam - 1))}}$ = ${f(V3 * 1000)} L und $V_4 = V_1 (T_h/T_k)^{1/(γ − 1)}$ = ${f(V4 * 1000)} L` });
    const tipos = ['isoterma', 'adiabatica', 'isoterma', 'adiabatica'];
    const tramos = tipos.map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Abschnitt ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `Stimmt mit der Carnot-Formel überein: $η = 1 − T_k/T_h = 1 − ${f(Tf)}/${f(Tc)} = ${f(100 * (1 - Tf / Tc), 3)}$ %`);
    pasos.push({ t: 'Entropie', html: `In der heißen Isotherme gewinnt das Gas $ΔS = Q_{auf}/T_h = ${f(b.Qabs / Tc)}$ J/K und in der kalten verliert es $Q_{ab}/T_k = ${f(b.Qced / Tf)}$ J/K: Im reversiblen Kreisprozess ändert sich die Entropie des Universums nicht.` });
    return { modo: 'carnot', G, n, est, tramos, ...b, pasos };
  }

  function otto(sc) {
    const G = gasDe(sc), r = lee(sc, 'r', 'das Verdichtungsverhältnis');
    if (r <= 1) throw new Error('Das Verdichtungsverhältnis muss größer als 1 sein');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, V2 = V1 / r;
    const T2 = T1 * r ** (G.gam - 1), P2 = P1 * r ** G.gam;
    let T3;
    const pasos = [I.paso, { t: '1→2: adiabatische Verdichtung', html: `$V_2 = V_1/r = ${f(V1 * 1000)}/${f(r)} = ${f(V2 * 1000)}$ L, $T_2 = T_1 r^{γ − 1} = ${f(T1)} · ${f(r)}^{${f(G.gam - 1)}}$ = ${f(T2)} K, $P_2 = P_1 r^γ$ = ${f(P2 / 1000)} kPa` }];
    if (sc.datos === 'Q') {
      const Q = lee(sc, 'Q', 'die Verbrennungswärme'); T3 = T2 + Q / (n * G.Cv);
      pasos.push({ t: '2→3: Verbrennung bei konstantem Volumen', html: `$Q = n C_v (T_3 − T_2)$, $T_3 = T_2 + {Q}/{n C_v} = ${f(T2)} + {${f(Q)}}/{${f(n)} · ${f(G.Cv)}}$ = ${f(T3)} K` });
    } else {
      T3 = lee(sc, 'T3', 'die Höchsttemperatur');
      if (T3 <= T2) throw new Error(`Die Höchsttemperatur muss größer sein als die am Ende der Verdichtung (${f(T2)} K)`);
      pasos.push({ t: '2→3: Verbrennung bei konstantem Volumen', html: `Erreicht $T_3 = ${f(T3)}$ K mit $V_3 = V_2$` });
    }
    const P3 = (P2 * T3) / T2, T4 = T3 * r ** (1 - G.gam), P4 = (P1 * T4) / T1;
    pasos.push({ t: '3→4: adiabatische Expansion', html: `$T_4 = T_3 r^{1 − γ} = ${f(T3)} · ${f(r)}^{${f(1 - G.gam)}}$ = ${f(T4)} K, $P_4$ = ${f(P4 / 1000)} kPa, mit $V_4 = V_1$` });
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P3, V2, T3), estado('4', P4, V1, T4)];
    const tramos = ['adiabatica', 'isocora', 'adiabatica', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Abschnitt ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `Mit der Formel des Otto-Prozesses: $η = 1 − r^{1 − γ} = 1 − ${f(r)}^{${f(1 - G.gam)}} = ${f(100 * (1 - r ** (1 - G.gam)), 3)}$ %: Er hängt nur vom Verdichtungsverhältnis ab.`);
    const Pot = potencia(sc, b.W, pasos);
    return { modo: 'otto', G, n, r, est, tramos, ...b, Pot, pasos };
  }

  function diesel(sc) {
    const G = gasDe(sc), r = lee(sc, 'r', 'das Verdichtungsverhältnis'), rc = lee(sc, 'rc', 'das Einspritzverhältnis');
    if (r <= 1) throw new Error('Das Verdichtungsverhältnis muss größer als 1 sein');
    if (rc <= 1 || rc >= r) throw new Error('Das Einspritzverhältnis muss zwischen 1 und dem Verdichtungsverhältnis liegen');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, V2 = V1 / r, V3 = rc * V2;
    const T2 = T1 * r ** (G.gam - 1), P2 = P1 * r ** G.gam, T3 = T2 * rc, T4 = T3 * (V3 / V1) ** (G.gam - 1), P4 = (P1 * T4) / T1;
    const pasos = [I.paso,
      { t: '1→2: adiabatische Verdichtung', html: `$V_2 = V_1/r = ${f(V2 * 1000)}$ L, $T_2 = T_1 r^{γ − 1}$ = ${f(T2)} K, $P_2 = P_1 r^γ$ = ${f(P2 / 1000)} kPa` },
      { t: '2→3: Verbrennung bei konstantem Druck', html: `$V_3 = r_c V_2 = ${f(rc)} · ${f(V2 * 1000)} = ${f(V3 * 1000)}$ L und, da P konstant ist, $T_3 = T_2 V_3/V_2 = T_2 r_c$ = ${f(T3)} K` },
      { t: '3→4: adiabatische Expansion', html: `$T_4 = T_3 (V_3/V_1)^{γ − 1} = ${f(T3)} · (${f(V3 * 1000)}/${f(V1 * 1000)})^{${f(G.gam - 1)}}$ = ${f(T4)} K, $P_4$ = ${f(P4 / 1000)} kPa` }];
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P2, V3, T3), estado('4', P4, V1, T4)];
    const tramos = ['adiabatica', 'isobara', 'adiabatica', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Abschnitt ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const etaF = 1 - (rc ** G.gam - 1) / (G.gam * r ** (G.gam - 1) * (rc - 1));
    const b = balance(est, tramos, pasos, `Mit der Formel des Diesel-Prozesses: $η = 1 − {r_c^γ − 1}/{γ r^{γ − 1} (r_c − 1)} = ${f(100 * etaF, 3)}$ %. Ein Otto-Prozess mit demselben r hätte ${f(100 * (1 - r ** (1 - G.gam)), 3)} %.`);
    const Pot = potencia(sc, b.W, pasos);
    return { modo: 'diesel', G, n, r, rc, est, tramos, ...b, Pot, pasos };
  }

  function brayton(sc) {
    const G = gasDe(sc), rp = lee(sc, 'rp', 'das Druckverhältnis');
    if (rp <= 1) throw new Error('Das Druckverhältnis muss größer als 1 sein');
    const I = inicial(sc, G), { T1, P1, V1, n } = I, e = (G.gam - 1) / G.gam;
    const T2 = T1 * rp ** e, P2 = P1 * rp, V2 = V1 * rp ** (-1 / G.gam), T3 = lee(sc, 'T3', 'die Temperatur am Turbineneintritt');
    if (T3 <= T2) throw new Error(`Die Temperatur am Turbineneintritt muss größer sein als die am Verdichteraustritt (${f(T2)} K)`);
    const V3 = (V2 * T3) / T2, T4 = T3 * rp ** -e, V4 = (V1 * T4) / T1;
    const pasos = [I.paso,
      { t: '1→2: Verdichter (Adiabate)', html: `$P_2 = r_p P_1 = ${f(P2 / 1000)}$ kPa, $T_2 = T_1 r_p^{(γ − 1)/γ} = ${f(T1)} · ${f(rp)}^{${f(e)}}$ = ${f(T2)} K, $V_2 = V_1 r_p^{−1/γ}$ = ${f(V2 * 1000)} L` },
      { t: '2→3: Brennkammer (Isobare)', html: `Erreicht $T_3 = ${f(T3)}$ K bei konstantem Druck: $V_3 = V_2 T_3/T_2$ = ${f(V3 * 1000)} L` },
      { t: '3→4: Turbine (Adiabate)', html: `$T_4 = T_3 r_p^{−(γ − 1)/γ}$ = ${f(T4)} K, $P_4 = P_1$, $V_4 = V_1 T_4/T_1$ = ${f(V4 * 1000)} L` }];
    const est = [estado('1', P1, V1, T1), estado('2', P2, V2, T2), estado('3', P2, V3, T3), estado('4', P1, V4, T4)];
    const tramos = ['adiabatica', 'isobara', 'adiabatica', 'isobara'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Abschnitt ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, `Mit der Formel des Brayton-Prozesses: $η = 1 − r_p^{−(γ − 1)/γ} = 1 − ${f(rp)}^{−${f(e)}} = ${f(100 * (1 - rp ** -e), 3)}$ %: Er hängt nur vom Druckverhältnis ab.`);
    return { modo: 'brayton', G, n, rp, est, tramos, ...b, pasos };
  }

  function stirling(sc) {
    const G = gasDe(sc), Tc = lee(sc, 'Tc', 'die Temperatur des heißen Reservoirs'), Tf = lee(sc, 'Tf', 'die Temperatur des kalten Reservoirs');
    if (Tf >= Tc) throw new Error('Das kalte Reservoir muss eine niedrigere Temperatur haben als das heiße');
    const n = lee(sc, 'n', 'die Stoffmenge in mol'), V1 = lee(sc, 'V1', 'das Mindestvolumen') / 1000, V2 = lee(sc, 'V2', 'das Höchstvolumen') / 1000;
    if (V2 <= V1) throw new Error('Das Höchstvolumen muss größer als das Mindestvolumen sein');
    const P = (V, T) => (n * R * T) / V;
    const est = [estado('1', P(V1, Tc), V1, Tc), estado('2', P(V2, Tc), V2, Tc), estado('3', P(V2, Tf), V2, Tf), estado('4', P(V1, Tf), V1, Tf)];
    const pasos = [{ t: 'Gas und Zustände', html: `Ideales Gas ${G.nom}: $${G.frac} = ${f(G.Cv)}$ J/(mol·K), mit n = ${f(n)} mol. Zwei Isothermen, bei $T_h = ${f(Tc)}$ K und $T_k = ${f(Tf)}$ K, verbunden durch zwei Isochoren zwischen $V_1 = ${f(V1 * 1000)}$ L und $V_2 = ${f(V2 * 1000)}$ L. Die Drücke ergeben sich aus $P = nRT/V$.` }];
    const tramos = ['isoterma', 'isocora', 'isoterma', 'isocora'].map((t, i) => tramo(t, est[i], est[(i + 1) % 4], n, G, est[i].nom, est[(i + 1) % 4].nom));
    for (const t of tramos) pasos.push({ t: `Abschnitt ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const Wn = tramos.reduce((s2, t) => s2 + t.W, 0), etaReg = Wn / tramos[0].Q;
    const b = balance(est, tramos, pasos, `Mit einem idealen Regenerator wird die Wärme, die das Gas in der Isochore 2→3 abgibt, gespeichert und ihm in der 4→1 zurückgegeben; dann wird nur in der heißen Isotherme Wärme aufgenommen und $η = W/Q_{12} = ${f(Wn)}/${f(tramos[0].Q)} = ${f(100 * etaReg, 3)}$ %, wie bei Carnot.`);
    return { modo: 'stirling', G, n, est, tramos, ...b, etaReg, pasos };
  }

  function propio(sc) {
    const G = gasDe(sc), n = lee(sc, 'n', 'die Stoffmenge in mol'), est = [];
    for (let i = 1; i <= 4; i++) {
      const P = lee(sc, `P${i}`, `der Druck des Zustands ${i}`, { opcional: i === 4 }), V = lee(sc, `V${i}`, `das Volumen des Zustands ${i}`, { opcional: i === 4 });
      if (i === 4 && (P === null) !== (V === null)) throw new Error('Für den Zustand 4 braucht man Druck und Volumen (oder keines, für einen Kreisprozess mit drei Abschnitten)');
      if (P !== null) est.push(estado(String(i), P * 1000, V / 1000, (P * V) / (n * R)));
    }
    const N = est.length, pasos = [{ t: 'Zustände', html: `Ideales Gas ${G.nom}, n = ${f(n)} mol. Jede Temperatur ergibt sich aus $T = PV/(nR)$: ${est.map((e) => `$T_${e.nom} = ${f(e.T)}$ K`).join(', ')}.` }];
    const tramos = [];
    for (let i = 0; i < N; i++) {
      const a = est[i], b = est[(i + 1) % N], k = i === N - 1 ? 'tfin' : `t${a.nom}${b.nom}`, pedido = sc[k] || 'auto', cerca = (x, y) => Math.abs(x - y) <= 1e-6 * Math.max(Math.abs(x), Math.abs(y));
      if (cerca(a.P, b.P) && cerca(a.V, b.V)) throw new Error(`Die Zustände ${a.nom} und ${b.nom} sind derselbe`);
      let tipo = cerca(a.V, b.V) ? 'isocora' : cerca(a.P, b.P) ? 'isobara' : 'recta';
      if (pedido === 'isoterma') { if (Math.abs(a.P * a.V - b.P * b.V) > 0.01 * a.P * a.V) throw new Error(`Der Abschnitt ${a.nom}→${b.nom} kann keine Isotherme sein: PV geht von ${f(a.P * a.V)} auf ${f(b.P * b.V)} J (müsste gleich sein)`); tipo = 'isoterma'; }
      if (pedido === 'adiabatica') { if (Math.abs(a.P * a.V ** G.gam - b.P * b.V ** G.gam) > 0.01 * a.P * a.V ** G.gam) throw new Error(`Der Abschnitt ${a.nom}→${b.nom} kann keine Adiabate sein: PV^γ bleibt zwischen diesen Zuständen nicht erhalten`); tipo = 'adiabatica'; }
      tramos.push(tramo(tipo, a, b, n, G, a.nom, b.nom));
    }
    for (const t of tramos) pasos.push({ t: `Abschnitt ${t.nom} (${NOMBRE[t.tipo]})`, html: t.html });
    const b = balance(est, tramos, pasos, W0(tramos) < 0 ? 'Die Nettoarbeit ist negativ: Der Kreisprozess läuft im p-V-Diagramm gegen den Uhrzeigersinn, also ist es keine Wärmekraftmaschine, sondern ein Kühlschrank (oder eine Wärmepumpe).' : '');
    return { modo: 'propio', G, n, est, tramos, ...b, pasos };
  }
  const W0 = (tramos) => tramos.reduce((s2, t) => s2 + t.W, 0);

  function maquina(sc) {
    const tipo = ['frigorifico', 'bomba'].includes(sc.tipo) ? sc.tipo : 'motor';
    let Qc = lee(sc, 'Qc', 'die Wärme des heißen Reservoirs', { opcional: true }), Qf = lee(sc, 'Qf', 'die Wärme des kalten Reservoirs', { opcional: true }), W = lee(sc, 'W', 'die Arbeit', { opcional: true });
    const datos = [Qc, Qf, W].filter((x) => x !== null).length;
    if (datos < 2) throw new Error('Es werden zwei der drei benötigt: Q des heißen Reservoirs, Q des kalten Reservoirs und W');
    const pasos = [];
    const motor = tipo === 'motor';
    const ec = motor ? 'Q_c = W + Q_f' : 'Q_c = Q_f + W';
    if (W === null) W = Qc - Qf; else if (Qc === null) Qc = W + Qf; else if (Qf === null) Qf = Qc - W;
    if (Math.abs(Qc - W - Qf) > 1e-9 * Math.max(Qc, 1)) throw new Error('Die drei Angaben erfüllen den ersten Hauptsatz nicht: Q des heißen Reservoirs muss W + Q des kalten Reservoirs sein (lass eine leer)');
    if (!(Qf > 0) || !(W > 0)) throw new Error('Mit diesen Angaben ergibt sich eine negative Wärme oder Arbeit: Prüfe, welche größer ist');
    pasos.push({ t: 'Erster Hauptsatz', html: `${motor ? 'Die Maschine nimmt Wärme vom heißen Reservoir auf, verrichtet Arbeit und gibt den Rest an das kalte ab' : 'Mit der Arbeit wird dem kalten Reservoir Wärme entzogen und mehr an das heiße abgegeben'}: $${ec}$<br>$Q_c$ = ${f(Qc)} J, $Q_f$ = ${f(Qf)} J, $W$ = ${f(W)} J` });
    let ef, nomEf, efC = null;
    if (motor) { ef = W / Qc; nomEf = 'Wirkungsgrad'; pasos.push({ t: 'Wirkungsgrad', html: `$η = W/Q_c = ${f(W)}/${f(Qc)}$ = <b>${f(100 * ef, 3)} %</b>` }); }
    else if (tipo === 'frigorifico') { ef = Qf / W; nomEf = 'Effizienz (COP)'; pasos.push({ t: 'Effizienz des Kühlschranks', html: `$COP = Q_k/W = ${f(Qf)}/${f(W)}$ = <b>${f(ef, 3)}</b>: Er entzieht dem Inneren ${f(ef, 3)} J pro Joule Arbeit.` }); }
    else { ef = Qc / W; nomEf = 'Effizienz (COP)'; pasos.push({ t: 'Effizienz der Wärmepumpe', html: `$COP = Q_h/W = ${f(Qc)}/${f(W)}$ = <b>${f(ef, 3)}</b>: Sie liefert ${f(ef, 3)} J Wärme pro Joule Arbeit.` }); }
    const Tc = lee(sc, 'Tc', 'die Temperatur des heißen Reservoirs', { opcional: true }), Tf = lee(sc, 'Tf', 'die Temperatur des kalten Reservoirs', { opcional: true });
    let posible = null, dS = null;
    if (Tc && Tf) {
      if (Tf >= Tc) throw new Error('Das kalte Reservoir muss eine niedrigere Temperatur haben als das heiße');
      efC = motor ? 1 - Tf / Tc : tipo === 'frigorifico' ? Tf / (Tc - Tf) : Tc / (Tc - Tf);
      dS = motor ? -Qc / Tc + Qf / Tf : Qc / Tc - Qf / Tf;
      posible = ef <= efC * (1 + 1e-9);
      pasos.push({ t: 'Carnot-Grenze', html: `${motor ? `$η_C = 1 − T_f/T_c = 1 − ${f(Tf)}/${f(Tc)}$ = ${f(100 * efC, 3)} %` : tipo === 'frigorifico' ? `$COP_C = {T_f}/{T_c − T_f} = {${f(Tf)}}/{${f(Tc)} − ${f(Tf)}}$ = ${f(efC, 3)}` : `$COP_C = {T_c}/{T_c − T_f} = {${f(Tc)}}/{${f(Tc)} − ${f(Tf)}}$ = ${f(efC, 3)}`}<br>${posible ? (Math.abs(ef - efC) < 1e-9 * efC ? 'Stimmt mit der von Carnot überein: Es wäre eine reversible, ideale Maschine.' : 'Sie ist kleiner als die von Carnot: Die Maschine ist möglich (und irreversibel).') : '<b>Sie ist größer als die von Carnot: Diese Maschine ist unmöglich</b>, sie würde den zweiten Hauptsatz verletzen.'}` });
      pasos.push({ t: 'Entropie des Universums', html: `Die Reservoirs ändern ihre Entropie: $ΔS = ${motor ? `−Q_h/T_h + Q_k/T_k = −${f(Qc)}/${f(Tc)} + ${f(Qf)}/${f(Tf)}` : `Q_h/T_h − Q_k/T_k = ${f(Qc)}/${f(Tc)} − ${f(Qf)}/${f(Tf)}`}$ = <b>${f(dS)} J/K</b> pro Zyklus (die des Arbeitsmediums der Maschine ändert sich nicht). ${dS >= -1e-12 ? 'Sie ist positiv oder null, wie es der zweite Hauptsatz verlangt.' : 'Sie ist negativ: unmöglich.'}` });
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
    { clave: 'carnot', nombre: 'Carnot-Prozess zwischen 600 K und 300 K', sc: { modo: 'carnot', gas: 'di', Tc: '600', Tf: '300', n: '1', V1: '10', V2: '20' } },
    { clave: 'carnot-mono', nombre: 'Carnot mit einem einatomigen Gas', sc: { modo: 'carnot', gas: 'mono', Tc: '500', Tf: '350', n: '0,5', V1: '5', V2: '15' } },
    { clave: 'otto', nombre: 'Benzinmotor (Otto-Prozess)', sc: { modo: 'otto', gas: 'di', r: '8', T1: '300', P1: '100', V1: '0,5', datos: 'T3', T3: '1800', rpm: '', cil: '' } },
    { clave: 'otto-calor', nombre: 'Otto-Prozess mit der Verbrennungswärme', sc: { modo: 'otto', gas: 'di', r: '10', T1: '290', P1: '95', V1: '0,6', datos: 'Q', Q: '800', rpm: '', cil: '' } },
    { clave: 'otto-potencia', nombre: 'Leistung eines 4-Zylinder-Motors bei 3000 U/min', sc: { modo: 'otto', gas: 'di', r: '9', T1: '300', P1: '100', V1: '0,4', datos: 'T3', T3: '2000', rpm: '3000', cil: '4' } },
    { clave: 'diesel', nombre: 'Dieselmotor', sc: { modo: 'diesel', gas: 'di', r: '18', rc: '2', T1: '300', P1: '100', V1: '1', rpm: '', cil: '' } },
    { clave: 'brayton', nombre: 'Gasturbine (Brayton-Prozess)', sc: { modo: 'brayton', gas: 'di', rp: '10', T1: '300', P1: '100', V1: '1', T3: '1400' } },
    { clave: 'stirling', nombre: 'Stirling-Motor', sc: { modo: 'stirling', gas: 'mono', Tc: '700', Tf: '300', n: '1', V1: '1', V2: '3' } },
    { clave: 'rectangulo', nombre: 'Rechteckiger Kreisprozess (zwei Isobaren und zwei Isochoren)', sc: { modo: 'propio', gas: 'mono', n: '1', P1: '100', V1: '10', P2: '300', V2: '10', P3: '300', V3: '30', P4: '100', V4: '30', t12: 'auto', t23: 'auto', t34: 'auto', tfin: 'auto' } },
    { clave: 'triangulo', nombre: 'Dreieckiger Kreisprozess mit einer Geraden im p-V-Diagramm', sc: { modo: 'propio', gas: 'di', n: '0,5', P1: '100', V1: '10', P2: '300', V2: '10', P3: '100', V3: '30', P4: '', V4: '', t12: 'auto', t23: 'auto', t34: 'auto', tfin: 'auto' } },
    { clave: 'motor', nombre: 'Wärmekraftmaschine: Ist sie möglich?', sc: { modo: 'maquina', tipo: 'motor', Qc: '1000', Qf: '', W: '350', Tc: '500', Tf: '300' } },
    { clave: 'imposible', nombre: 'Ein Erfinder verspricht 60 %', sc: { modo: 'maquina', tipo: 'motor', Qc: '1000', Qf: '400', W: '', Tc: '600', Tf: '300' } },
    { clave: 'frigorifico', nombre: 'Haushaltskühlschrank', sc: { modo: 'maquina', tipo: 'frigorifico', Qc: '', Qf: '300', W: '100', Tc: '298', Tf: '268' } },
    { clave: 'bomba', nombre: 'Wärmepumpe zum Heizen', sc: { modo: 'maquina', tipo: 'bomba', Qc: '3500', Qf: '', W: '1000', Tc: '308', Tf: '278' } },
  ];

  return { resolver, carnot, otto, diesel, brayton, stirling, propio, maquina, ejemplos, f, R, GASES };
})();

