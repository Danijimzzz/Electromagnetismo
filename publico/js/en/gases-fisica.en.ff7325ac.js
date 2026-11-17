const Gases = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-60) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Aj = typeof Ajuste !== 'undefined' ? Ajuste : require('../quimica/ajuste.js');
  let R = 8.314, Rs = '8,314';
  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const kB = SI.kB, NA = SI.NA;
  const ponR = () => { R = Aj.valores().R; Rs = Aj.texto(R); };
  const conR = (fn) => (...a) => { ponR(); return fn(...a); };
  const UP = { atm: [101325, 'atm'], kPa: [1000, 'kPa'], Pa: [1, 'Pa'], bar: [1e5, 'bar'], mmHg: [101325 / 760, 'mmHg'] };
  const UV = { L: [1e-3, 'L'], m3: [1, 'm<sup>3</sup>'], cm3: [1e-6, 'cm<sup>3</sup>'] };
  const GASES = {
    monoatomico: { nombre: 'Monatomic (He, Ne, Ar…)', gamma: 5 / 3, cv: '3/2', cp: '5/2' },
    diatomico: { nombre: 'Diatomic (N₂, O₂, air…)', gamma: 7 / 5, cv: '5/2', cp: '7/2' },
  };
  const MOLECULAS = { He: ['Helium', 4.003, 260], Ne: ['Neon', 20.18, 275], Ar: ['Argon', 39.95, 340], H2: ['Hydrogen, H₂', 2.016, 289], N2: ['Nitrogen, N₂', 28.01, 364], O2: ['Oxygen, O₂', 32.00, 346], aire: ['Air', 28.96, 365], CO2: ['Carbon dioxide, CO₂', 44.01, 330] };
  const VDW = { He: ['Helium', 0.00346, 2.38e-5], H2: ['Hydrogen, H₂', 0.02476, 2.661e-5], N2: ['Nitrogen, N₂', 0.1370, 3.87e-5], O2: ['Oxygen, O₂', 0.1382, 3.186e-5], Ar: ['Argon', 0.1355, 3.20e-5], CO2: ['Carbon dioxide, CO₂', 0.3640, 4.267e-5], NH3: ['Ammonia, NH₃', 0.4225, 3.707e-5], H2O: ['Water vapour', 0.5536, 3.049e-5] };
  const CRIT = { He: [5.19, 2.24], H2: [33.2, 12.8], N2: [126.2, 33.5], O2: [154.6, 49.8], Ar: [150.9, 48.3], CO2: [304.1, 72.8], NH3: [405.5, 111.3], H2O: [647.1, 217.7] };

  function num(sc, k, nom, { opcional = false, signo = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be a number`);
    if (!signo && v <= 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} must be greater than 0`);
    return v;
  }
  const unidades = (sc) => ({ P: UP[sc.uP] || UP.atm, V: UV[sc.uV] || UV.L, celsius: sc.uT === 'C' });
  function aSI(u, k, v) {
    if (v === null) return null;
    if (k === 'P') return v * u.P[0];
    if (k === 'V') return v * u.V[0];
    if (k === 'T') { const T = u.celsius ? v + 273.15 : v; if (T <= 0) throw new Error('The absolute temperature must be greater than 0 K'); return T; }
    return v;
  }
  const verP = (u, P) => `${f(P / u.P[0])} ${u.P[1]}`, verV = (u, V) => `${f(V / u.V[0])} ${u.V[1]}`, verT = (T) => `${f(T, 5)} K`;

  function estado(sc, { prefijo = '', pasos = [] } = {}) {
    const u = unidades(sc), g = (k) => sc[prefijo + k];
    const lee = (k, nom) => { const v = vacio(g(k)) ? null : leeNum(g(k)); if (v !== null && !isFinite(v)) throw new Error(`${nom} must be a number`); if (v !== null && k !== 'T' && v <= 0) throw new Error(`${nom} must be greater than 0`); return v; };
    let P = aSI(u, 'P', lee('P', 'The pressure')), V = aSI(u, 'V', lee('V', 'The volume')), T = aSI(u, 'T', lee('T', 'The temperature')), n = lee('n', 'The number of moles');
    const m = prefijo ? null : lee('m', 'The mass'), M = prefijo ? null : lee('M', 'The molar mass');
    if (n === null && m !== null && M !== null) { n = m / M; pasos.push({ t: 'Number of moles', html: `$n = m/M = ${f(m)}/${f(M)}$ = <b>${f(n)} mol</b>` }); }
    const faltan = [['P', P], ['V', V], ['T', T], ['n', n]].filter(([, v]) => v === null).map(([k]) => k);
    if (faltan.length > 1) throw new Error(`Data are missing: give three of P, V, T and n (${faltan.join(' and ')} are missing now)`);
    const nr = (x) => f(x);
    if (faltan.length === 0) {
      const err = Math.abs(P * V - n * R * T) / (P * V);
      if (err > 1e-3) throw new Error(`The four values do not satisfy PV = nRT (PV = ${nr(P * V).replace(/<[^>]+>/g, '')} J and nRT = ${nr(n * R * T).replace(/<[^>]+>/g, '')} J): leave one empty`);
    } else {
      const k = faltan[0], ecs = {
        P: () => { P = (n * R * T) / V; return `$P = {nRT}/V = {${f(n)} · ${Rs} · ${f(T, 5)}}/{${f(V)}} = ${f(P, 6)}$ Pa = <b>${verP(u, P)}</b>`; },
        V: () => { V = (n * R * T) / P; return `$V = {nRT}/P = {${f(n)} · ${Rs} · ${f(T, 5)}}/{${f(P, 6)}} = ${f(V)}$ m<sup>3</sup> = <b>${verV(u, V)}</b>`; },
        T: () => { T = (P * V) / (n * R); return `$T = {PV}/{nR} = {${f(P, 6)} · ${f(V)}}/{${f(n)} · ${Rs}}$ = <b>${verT(T)}</b> (${f(T - 273.15)} °C)`; },
        n: () => { n = (P * V) / (R * T); return `$n = {PV}/{RT} = {${f(P, 6)} · ${f(V)}}/{${Rs} · ${f(T, 5)}}$ = <b>${f(n)} mol</b>`; },
      };
      if (!prefijo) pasos.push({ t: 'Data in SI', html: [P !== null && `P = ${verP(u, P)} = ${f(P, 6)} Pa`, V !== null && `V = ${verV(u, V)} = ${f(V)} m<sup>3</sup>`, T !== null && `T = ${verT(T)}`, n !== null && `n = ${f(n)} mol`].filter(Boolean).join(', &nbsp; ') + `. R = ${Rs} J/(mol·K)` });
      pasos.push({ t: prefijo ? 'Initial state (PV = nRT)' : 'Equation of state PV = nRT', html: ecs[k]() });
    }
    return { P, V, T, n, m, M, u, pasos };
  }

  function resolverEstado(sc) {
    const pasos = [], e = estado(sc, { pasos });
    if (e.M) { const rho = (e.P * e.M * 1e-3) / (R * e.T); pasos.push({ t: 'Density', html: `$ρ = {PM}/{RT} = {${f(e.P, 6)} · ${f(e.M * 1e-3)}}/{${Rs} · ${f(e.T, 5)}}$ = <b>${f(rho)} kg/m<sup>3</sup></b> (= ${f(rho)} g/L)` }); e.rho = rho; }
    const Vm = (R * e.T) / e.P;
    pasos.push({ t: 'Molar volume and molecules', html: `$V_m = V/n = ${f(Vm * 1000)}$ L/mol${Math.abs(e.T - 273.15) < 0.01 && Math.abs(e.P - 101325) < 1 ? ' (22.4 L/mol at standard conditions)' : ''}; &nbsp; $N = n N_A$ = <b>${f(e.n * NA)} molecules</b>` });
    return { modo: 'estado', ...e, Vm, pasos };
  }

  const NOMBRES = { isoterma: 'isotherm (T constant)', isobara: 'isobar (P constant)', isocora: 'isochore (V constant)', adiabatica: 'adiabatic (Q = 0)' };
  const LETRA = (i) => String.fromCharCode(65 + i);
  function procesos(sc) {
    const G = GASES[sc.gas] || GASES.diatomico, gm = G.gamma, cv = R / (gm - 1), cp = cv + R;
    const pasos = [];
    const e1 = estado(sc, { prefijo: '', pasos: [] });
    const u = e1.u, n = e1.n;
    pasos.push({ t: 'State A', html: `$P_A$ = ${verP(u, e1.P)}, $V_A$ = ${verV(u, e1.V)}, $T_A$ = ${verT(e1.T)}, n = <b>${f(n)} mol</b>${e1.pasos.length ? `<br>${e1.pasos.map((p) => p.html).join('<br>')}` : ''}<br>Gas ${G.nombre.split(' (')[0].toLowerCase()}: $C_v = {${G.cv.split('/')[0]}}/{${G.cv.split('/')[1]}} R$, $C_p = {${G.cp.split('/')[0]}}/{${G.cp.split('/')[1]}} R$, $γ = ${f(gm)}$` });
    const est = [{ P: e1.P, V: e1.V, T: e1.T }], tramos = [];
    const lista = sc.procesos || [];
    if (!lista.length) throw new Error('Add at least one transformation');
    lista.forEach((pr, i) => {
      const a = est[i], de = LETRA(i), cierra = String(pr.valor).trim().toUpperCase() === 'A', a2 = cierra ? 'A' : LETRA(i + 1), tipo = pr.tipo;
      if (!NOMBRES[tipo]) throw new Error(`Stage ${de}→${a2}: unknown type`);
      const permitidos = { isoterma: ['V', 'P'], isobara: ['V', 'T'], isocora: ['P', 'T'], adiabatica: ['V', 'P', 'T'] }[tipo];
      if (!permitidos.includes(pr.dato)) throw new Error(`Stage ${de}→${a2}: in a ${tipo}, ${permitidos.join(', ')} of the final state is given`);
      let val;
      if (cierra) val = est[0][pr.dato];
      else { const v = num(pr, 'valor', `the value for stage ${de}→${a2}`); val = aSI(u, pr.dato, v); }
      let b;
      if (tipo === 'isoterma') b = pr.dato === 'V' ? { V: val, T: a.T, P: (a.P * a.V) / val } : { P: val, T: a.T, V: (a.P * a.V) / val };
      else if (tipo === 'isobara') b = pr.dato === 'V' ? { P: a.P, V: val, T: (a.T * val) / a.V } : { P: a.P, T: val, V: (a.V * val) / a.T };
      else if (tipo === 'isocora') b = pr.dato === 'P' ? { V: a.V, P: val, T: (a.T * val) / a.P } : { V: a.V, T: val, P: (a.P * val) / a.T };
      else if (pr.dato === 'V') { const P = a.P * (a.V / val) ** gm; b = { V: val, P, T: (P * val) / (n * R) }; }
      else if (pr.dato === 'P') { const V = a.V * (a.P / val) ** (1 / gm); b = { P: val, V, T: (val * V) / (n * R) }; }
      else { const V = a.V * (a.T / val) ** (1 / (gm - 1)); b = { T: val, V, P: (n * R * val) / V }; }
      if (cierra) {
        const A = est[0], ok = ['P', 'V', 'T'].every((k) => Math.abs(b[k] - A[k]) <= 1e-6 * A[k]);
        if (!ok) throw new Error(`Stage ${de}→${a2}: with a ${tipo} you cannot return to state A from ${de}; the cycle does not close`);
        b = { ...A };
      }
      const dT = b.T - a.T, dU = n * cv * dT;
      let W, Q, hW, hQ;
      const cvT = `{${G.cv.split('/')[0]}}/{${G.cv.split('/')[1]}}`, cpT = `{${G.cp.split('/')[0]}}/{${G.cp.split('/')[1]}}`;
      if (tipo === 'isoterma') { W = n * R * a.T * Math.log(b.V / a.V); Q = W; hW = `$W = nRT ln {V_${a2}}/{V_${de}} = ${f(n)} · ${Rs} · ${f(a.T)} · ln ${f(b.V / a.V)}$ = <b>${f(W)} J</b>`; hQ = `$ΔU = 0$ (constant T) ⇒ $Q = W$ = <b>${f(Q)} J</b>`; }
      else if (tipo === 'isobara') { W = a.P * (b.V - a.V); Q = n * cp * dT; hW = `$W = P ΔV = ${f(a.P)} · (${f(b.V)} − ${f(a.V)})$ = <b>${f(W)} J</b>`; hQ = `$Q = n C_p ΔT = ${f(n)} · ${cpT} · ${Rs} · ${f(dT)}$ = <b>${f(Q)} J</b>; $ΔU = n C_v ΔT$ = <b>${f(dU)} J</b>`; }
      else if (tipo === 'isocora') { W = 0; Q = dU; hW = '$W = 0$ (the volume does not change)'; hQ = `$Q = ΔU = n C_v ΔT = ${f(n)} · ${cvT} · ${Rs} · ${f(dT)}$ = <b>${f(Q)} J</b>`; }
      else { W = (a.P * a.V - b.P * b.V) / (gm - 1); Q = 0; hW = `$W = {P_${de} V_${de} − P_${a2} V_${a2}}/{γ − 1}$ = <b>${f(W)} J</b>`; hQ = `$Q = 0$ ⇒ $ΔU = −W$ = <b>${f(dU)} J</b> (= $n C_v ΔT$)`; }
      const rel = { isoterma: `$P_${de} V_${de} = P_${a2} V_${a2}$`, isobara: `$V_${de}/T_${de} = V_${a2}/T_${a2}$`, isocora: `$P_${de}/T_${de} = P_${a2}/T_${a2}$`, adiabatica: '$P V^γ$ = const and $T V^{γ − 1}$ = const' }[tipo];
      pasos.push({ t: `${de} → ${a2}: ${NOMBRES[tipo]}`, html: `${rel} ⇒ $P_${a2}$ = ${verP(u, b.P)}, $V_${a2}$ = ${verV(u, b.V)}, $T_${a2}$ = ${verT(b.T)}<br>${hW}<br>${hQ}` });
      est.push(b); tramos.push({ de, a: a2, tipo, W, Q, dU, ini: a, fin: b });
    });
    const escala = Math.max(...tramos.map((t) => Math.abs(t.Q) + Math.abs(t.W) + Math.abs(t.dU))), limpia = (x) => (Math.abs(x) < 1e-9 * escala ? 0 : x);
    const Wt = limpia(tramos.reduce((s, t) => s + t.W, 0)), Qt = limpia(tramos.reduce((s, t) => s + t.Q, 0)), Ut = limpia(tramos.reduce((s, t) => s + t.dU, 0));
    const ult = est[est.length - 1], ciclo = lista.length > 1 && ['P', 'V', 'T'].every((k) => Math.abs(ult[k] - est[0][k]) <= 1e-6 * est[0][k]);
    let rend = null;
    const Qabs = tramos.filter((t) => t.Q > 0).reduce((s, t) => s + t.Q, 0), Qced = -tramos.filter((t) => t.Q < 0).reduce((s, t) => s + t.Q, 0);
    if (ciclo) {
      rend = Qabs > 0 ? Wt / Qabs : null;
      const Tmax = Math.max(...est.map((e) => e.T)), Tmin = Math.min(...est.map((e) => e.T));
      pasos.push({ t: 'Cycle balance', html: `$ΔU = 0$ (returns to state A) ⇒ $W_{net} = Q_{net}$ = <b>${f(Wt)} J</b><br>Heat absorbed: $Q_{abs} = ${f(Qabs)}$ J; released: ${f(Qced)} J${rend !== null ? `<br>${Wt > 0 ? 'Efficiency' : 'It is a refrigeration cycle (W &lt; 0); as an engine'}: $η = W/Q_{abs}$ = <b>${f(100 * rend, 3)}%</b>; a Carnot engine between ${f(Tmax)} K and ${f(Tmin)} K would give $1 − T_{"min"}/T_{"max"} = ${f(100 * (1 - Tmin / Tmax), 3)}$%. To see the cycle in the T-S diagram too, open it in Thermodynamic cycles (custom cycle).` : ''}` });
    } else pasos.push({ t: 'Totals', html: `$W = ${f(Wt)}$ J, $Q = ${f(Qt)}$ J, $ΔU = ${f(Ut)}$ J ($Q − W = ${f(Qt - Wt)}$ J)` });
    return { modo: 'procesos', G, u, n, est, tramos, Wt, Qt, Ut, ciclo, rend, Qabs, Qced, pasos };
  }

  function cinetica(sc) {
    const Mg = sc.molecula && sc.molecula !== 'otra' && MOLECULAS[sc.molecula] ? MOLECULAS[sc.molecula][1] : num(sc, 'M', 'the molar mass');
    const nombre = sc.molecula && MOLECULAS[sc.molecula] ? MOLECULAS[sc.molecula][0] : 'Gas';
    const u = unidades(sc), T = aSI(u, 'T', num(sc, 'T', 'the temperature', { signo: true })), M = Mg * 1e-3;
    const vrms = Math.sqrt((3 * R * T) / M), vmed = Math.sqrt((8 * R * T) / (Math.PI * M)), vp = Math.sqrt((2 * R * T) / M), Ec = 1.5 * kB * T, m = M / NA;
    const n = num(sc, 'n', 'the number of moles', { opcional: true });
    const pasos = [
      { t: 'Root-mean-square speed', html: `$v_{rms} = √({3RT}/M) = √({3 · ${Rs} · ${f(T, 5)}}/{${f(M)}})$ = <b>${f(vrms)} m/s</b> (M in kg/mol)` },
      { t: 'Mean and most probable speed', html: `$v̄ = √({8RT}/{πM})$ = <b>${f(vmed)} m/s</b>, &nbsp; $v_p = √({2RT}/M)$ = <b>${f(vp)} m/s</b><br>Always $v_p < v̄ < v_{rms}$.` },
      { t: 'Mean translational kinetic energy of a molecule', html: `$⟨E_k⟩ = {3}/{2} k T = 1.5 · 1.381·10<sup>−23</sup> · ${f(T, 5)}$ = <b>${f(Ec)} J</b> (= $½ m v_{rms}^2$ with $m = M/N_A = ${f(m)}$ kg). It depends only on T, not on the gas.` },
    ];
    if (n) pasos.push({ t: `Translational kinetic energy of ${f(n)} mol`, html: `$E = {3}/{2} n R T$ = <b>${f(1.5 * n * R * T)} J</b>` });
    const Patm = num(sc, 'P', 'the pressure', { opcional: true });
    let lam = null, z = null, nV = null, d = null;
    if (Patm) {
      const P = Patm * 101325, d0 = num(sc, 'd', 'the diameter of the molecule', { opcional: true });
      d = (d0 ?? (MOLECULAS[sc.molecula] ? MOLECULAS[sc.molecula][2] : 0)) * 1e-12;
      if (!d) throw new Error('For the mean free path the diameter of the molecule is needed');
      nV = P / (kB * T); lam = 1 / (Math.SQRT2 * Math.PI * d * d * nV); z = vmed / lam;
      pasos.push({ t: 'Molecules per cubic metre', html: `$n_V = P/(kT) = {${f(P, 6)}}/{1,381·10<sup>−23</sup> · ${f(T, 5)}}$ = <b>${f(nV)} m<sup>−3</sup></b>` });
      pasos.push({ t: 'Mean free path', html: `With a molecular diameter $d = ${f(d * 1e12)}$ pm${d0 ? '' : ' (typical kinetic diameter)'}, the mean distance between two collisions is $λ = 1/(√2 π d^2 n_V)$ = <b>${f(lam)} m</b> (${f(lam * 1e9)} nm), about ${f(lam / d, 3)} times the size of the molecule.` });
      pasos.push({ t: 'Collisions per second', html: `Each molecule collides $z = v̄/λ = ${f(vmed)}/${f(lam)}$ = <b>${f(z)} times per second</b>, one every ${f(1 / z)} s.` });
    }
    return { modo: 'cinetica', nombre, Mg, M, T, vrms, vmed, vp, Ec, n, lam, z, nV, d, pasos };
  }

  function mezcla(sc) {
    const T = num(sc, 'T', 'the temperature'), V = num(sc, 'V', 'the volume') * 1e-3, gramos = sc.cant === 'm', comp = [];
    for (let i = 1; i <= 3; i++) {
      if (vacio(sc[`c${i}`])) continue;
      const k = sc[`g${i}`], gas = MOLECULAS[k];
      if (!gas) throw new Error(`Choose gas ${i}`);
      const c = num(sc, `c${i}`, `the amount of gas ${i}`), n = gramos ? c / gas[1] : c;
      comp.push({ k, nombre: gas[0], M: gas[1], m: gramos ? c : c * gas[1], n });
    }
    if (comp.length < 2) throw new Error('A mixture needs at least two gases');
    const nt = comp.reduce((s2, c) => s2 + c.n, 0), Pt = (nt * R * T) / V, mt = comp.reduce((s2, c) => s2 + c.m, 0), Mm = mt / nt;
    for (const c of comp) { c.x = c.n / nt; c.P = c.x * Pt; }
    const pasos = [];
    if (gramos) pasos.push({ t: 'Moles of each gas', html: comp.map((c) => `$n_{"${c.k}"} = m/M = ${f(c.m)}/${f(c.M)}$ = ${f(c.n)} mol`).join('<br>') });
    pasos.push({ t: 'Total moles and mole fractions', html: `$n = ${comp.map((c) => f(c.n)).join(' + ')} = ${f(nt)}$ mol<br>${comp.map((c) => `$x_{"${c.k}"} = n_{"${c.k}"}/n = ${f(c.n)}/${f(nt)}$ = <b>${f(c.x)}</b>`).join('<br>')}` });
    pasos.push({ t: 'Total pressure', html: `Each gas fills the whole container as if it were alone, so the mixture obeys $P V = n R T$ with the total moles: $P = {nRT}/V = {${f(nt)} · ${Rs} · ${f(T)}}/{${f(V)}}$ = <b>${f(Pt)} Pa</b> (${f(Pt / 101325)} atm)` });
    pasos.push({ t: 'Partial pressures (Dalton\'s law)', html: `The pressure of each gas is what it would have alone in the whole volume, $P_i = x_i P$, and the sum is the total: ${comp.map((c) => `$P_{"${c.k}"} = ${f(c.x)} · ${f(Pt)}$ = <b>${f(c.P)} Pa</b>`).join(', ')}.` });
    pasos.push({ t: 'Mean molar mass and density', html: `$M̄ = Σ x_i M_i = ${f(Mm)}$ g/mol and $ρ = {P M̄}/{RT} = ${f((Pt * Mm * 1e-3) / (R * T))}$ kg/m³` });
    return { modo: 'mezcla', T, V, comp, nt, Pt, mt, Mm, rho: (Pt * Mm * 1e-3) / (R * T), pasos };
  }

  function real(sc) {
    let a, b, nombre;
    if (VDW[sc.gasR]) [nombre, a, b] = VDW[sc.gasR];
    else { nombre = 'Gas'; a = num(sc, 'a', 'the constant a'); b = num(sc, 'b', 'the constant b'); }
    const n = num(sc, 'n', 'the number of moles'), V = num(sc, 'V', 'the volume') * 1e-3, T = num(sc, 'T', 'the temperature');
    if (V <= n * b) throw new Error(`The volume must be greater than that occupied by the molecules themselves, nb = ${f(n * b * 1000).replace(/<[^>]+>/g, '')} L`);
    const Pi = (n * R * T) / V, rep = (n * R * T) / (V - n * b), atr = (a * n * n) / (V * V), P = rep - atr, Z = (P * V) / (n * R * T);
    const Tc = (8 * a) / (27 * R * b), Pc = a / (27 * b * b), Vc = 3 * b;
    const usaReal = sc.crit === 'real' && !!CRIT[sc.gasR], TcR = usaReal ? CRIT[sc.gasR][0] : Tc, PcR = usaReal ? CRIT[sc.gasR][1] * 101325 : Pc;
    const aR = (0.42748 * R * R * TcR ** 2.5) / PcR, bR = (0.08664 * R * TcR) / PcR;
    const prk = (Vm, TT) => (R * TT) / (Vm - bR) - aR / (Math.sqrt(TT) * Vm * (Vm + bR)), pvdw = (Vm, TT) => (R * TT) / (Vm - b) - a / (Vm * Vm);
    if (V / n <= bR) throw new Error(`The molar volume must be greater than the Redlich–Kwong b, ${f(bR * 1000)} L/mol`);
    const PRK = prk(V / n, T), ZRK = (PRK * V) / (n * R * T);
    const pasos = [
      { t: 'Van der Waals equation', html: `${nombre}: $a = ${f(a)}$ Pa·m⁶/mol², $b = ${f(b)}$ m³/mol. The equation $(P + {a n^2}/{V^2})(V − nb) = nRT$ corrects the ideal gas: b is the volume occupied by the molecules and a measures how much they attract each other.` },
      { t: 'Pressure of the real gas', html: `$P = {nRT}/{V − nb} − {a n^2}/{V^2} = {${f(n)} · ${Rs} · ${f(T)}}/{${f(V)} − ${f(n * b)}} − {${f(a)} · ${f(n)}^2}/{(${f(V)})^2} = ${f(rep)} − ${f(atr)}$ = <b>${f(P)} Pa</b> (${f(P / 101325)} atm)` },
      { t: 'Comparison with the ideal gas', html: `Ideal: $P = {nRT}/V$ = ${f(Pi)} Pa (${f(Pi / 101325)} atm). The real one gives ${f((100 * (P - Pi)) / Pi, 3)}%. Compressibility factor $Z = {PV}/{nRT}$ = <b>${f(Z)}</b>: ${Z < 1 ? 'less than 1, attractions dominate' : 'greater than 1, the volume of the molecules dominates'}.` },
      { t: 'Redlich–Kwong', html: `${usaReal ? `With the real critical data of the gas, $T_c$ = ${f(TcR)} K and $P_c$ = ${f(PcR / 101325)} atm (those from Van der Waals give ${f(Tc)} K and ${f(Pc / 101325)} atm): ` : 'With the same $T_c$ and $P_c$: '}$a' = {0.42748 R^2 T_c^{2.5}}/{P_c} = ${f(aR)}$ Pa·m⁶·K<sup>½</sup>/mol², $b' = {0.08664 R T_c}/{P_c} = ${f(bR)}$ m³/mol. The equation $P = {RT}/{V_m − b'} − {a'}/{√T V_m (V_m + b')}$ gives <b>${f(PRK)} Pa</b> (${f(PRK / 101325)} atm), $Z = ${f(ZRK)}$. It usually fits better than Van der Waals at high pressures and at temperatures above the critical one. <b>Warning:</b> here $T_c$ and $P_c$ are not the measured values of the gas, but those obtained from the Van der Waals $a$ and $b$, so this Redlich–Kwong is an approximation; with the real critical values ($T_c$ and $P_c$ from tables) it would come out slightly different.` },
      { t: 'Critical point', html: `$T_c = {8a}/{27Rb}$ = <b>${f(Tc)} K</b>, $P_c = {a}/{27 b^2}$ = ${f(Pc / 101325)} atm, $V_{m,c} = 3b$ = ${f(Vc * 1000)} L/mol. Above $T_c$ the gas cannot be liquefied however much it is compressed.` },
    ];
    return { modo: 'real', nombre, a, b, n, V, T, P, Pi, Z, Tc, Pc, Vc, aR, bR, usaReal, TcR, PcR, PRK, ZRK, prk, pvdw, pasos };
  }
  const maxwell = (M, T, v) => { const a = M / (2 * R * T); return 4 * Math.PI * (a / Math.PI) ** 1.5 * v * v * Math.exp(-a * v * v); };

  function resolver(sc) {
    ponR();
    if (sc.modo === 'procesos') return procesos(sc);
    if (sc.modo === 'cinetica') return cinetica(sc);
    if (sc.modo === 'mezcla') return mezcla(sc);
    if (sc.modo === 'real') return real(sc);
    return resolverEstado(sc);
  }

  const B = { uP: 'atm', uV: 'L', uT: 'K' };
  const ejemplos = [
    { clave: 'volumen', nombre: 'Volume of a gas (PV = nRT)', sc: { modo: 'estado', ...B, uT: 'C', P: '2', V: '', T: '27', n: '', m: '16', M: '32' } },
    { clave: 'normales', nombre: 'One mole at standard conditions', sc: { modo: 'estado', ...B, P: '1', V: '', T: '273,15', n: '1', m: '', M: '' } },
    { clave: 'isoterma', nombre: 'Isothermal expansion', sc: { modo: 'procesos', gas: 'diatomico', ...B, P: '4', V: '5', T: '300', n: '', procesos: [{ tipo: 'isoterma', dato: 'V', valor: '20' }] } },
    { clave: 'adiabatica', nombre: 'Adiabatic compression of air', sc: { modo: 'procesos', gas: 'diatomico', ...B, P: '1', V: '10', T: '300', n: '', procesos: [{ tipo: 'adiabatica', dato: 'V', valor: '2' }] } },
    { clave: 'ciclo-rect', nombre: 'Rectangular cycle (two isobars and two isochores)', sc: { modo: 'procesos', gas: 'monoatomico', ...B, uP: 'kPa', P: '100', V: '2', T: '', n: '0,1', procesos: [{ tipo: 'isocora', dato: 'P', valor: '300' }, { tipo: 'isobara', dato: 'V', valor: '6' }, { tipo: 'isocora', dato: 'P', valor: '100' }, { tipo: 'isobara', dato: 'V', valor: 'A' }] } },
    { clave: 'carnot', nombre: 'Carnot cycle', sc: { modo: 'procesos', gas: 'diatomico', ...B, P: '10', V: '1', T: '600', n: '', procesos: [{ tipo: 'isoterma', dato: 'V', valor: '3' }, { tipo: 'adiabatica', dato: 'T', valor: '300' }, { tipo: 'isoterma', dato: 'V', valor: String(3 * 2 ** 2.5 / 3) }, { tipo: 'adiabatica', dato: 'V', valor: 'A' }] } },
    { clave: 'cinetica', nombre: 'Speed of oxygen molecules', sc: { modo: 'cinetica', molecula: 'O2', M: '', T: '300', uT: 'K', n: '1', P: '', d: '' } },
    { clave: 'recorrido', nombre: 'Mean free path of air', sc: { modo: 'cinetica', molecula: 'aire', M: '', T: '293', uT: 'K', n: '', P: '1', d: '' } },
    { clave: 'aire-mezcla', nombre: 'Partial pressures of air (N₂, O₂, Ar)', sc: { modo: 'mezcla', T: '298', V: '22,4', cant: 'n', g1: 'N2', c1: '0,78', g2: 'O2', c2: '0,21', g3: 'Ar', c3: '0,01' } },
    { clave: 'buceo', nombre: 'Diving cylinder with oxygen and helium', sc: { modo: 'mezcla', T: '293', V: '12', cant: 'm', g1: 'O2', c1: '800', g2: 'He', c2: '400', g3: 'N2', c3: '' } },
    { clave: 'vdw', nombre: 'Compressed CO₂: real versus ideal', sc: { modo: 'real', gasR: 'CO2', a: '', b: '', n: '1', V: '0,5', T: '300' } },
    { clave: 'vdw-n2', nombre: 'Nitrogen at moderate pressure', sc: { modo: 'real', gasR: 'N2', a: '', b: '', n: '2', V: '10', T: '273' } },
  ];
  ejemplos[5].sc.procesos[2].valor = String(+(2 ** 2.5).toFixed(6));

  return { resolver, estado: conR(resolverEstado), procesos: conR(procesos), cinetica: conR(cinetica), mezcla: conR(mezcla), real: conR(real), maxwell: conR(maxwell), GASES, MOLECULAS, VDW, CRIT, UP, UV, NOMBRES, ejemplos, f, get R() { ponR(); return R; }, kB };
})();

