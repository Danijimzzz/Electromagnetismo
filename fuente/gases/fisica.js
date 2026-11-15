/* =====================================================================
   Gases ideales (sin DOM): ecuación de estado PV = nRT, transformaciones
   (isoterma, isobara, isocora y adiabática) encadenadas en un proceso o un
   ciclo con el primer principio, mezclas de gases (ley de Dalton), gases
   reales con la ecuación de Van der Waals y teoría cinética (velocidades
   de las moléculas, distribución de Maxwell y recorrido libre medio).
   Los pasos llevan fórmulas $…$ que la página pasa a MathML (mates.js).
   Por dentro todo en el SI; el trabajo W es el que hace el gas y
   ΔU = Q − W. R sigue el ajuste común de quimica/ajuste.js (F12.4): 8,314
   «de clase» por defecto o la exacta, 8,314462618; se lee en cada cálculo
   y el valor usado sale escrito en el desarrollo.
   ===================================================================== */
const Gases = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-60) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace('−', '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Aj = typeof Ajuste !== 'undefined' ? Ajuste : require('../quimica/ajuste.js');
  let R = 8.314, Rs = '8,314';
  const kB = 1.380649e-23, NA = 6.02214076e23;
  // lee R del ajuste común antes de cada cálculo (conR envuelve lo que se exporta)
  const ponR = () => { R = Aj.valores().R; Rs = Aj.texto(R); };
  const conR = (fn) => (...a) => { ponR(); return fn(...a); };
  const UP = { atm: [101325, 'atm'], kPa: [1000, 'kPa'], Pa: [1, 'Pa'], bar: [1e5, 'bar'], mmHg: [101325 / 760, 'mmHg'] };
  const UV = { L: [1e-3, 'L'], m3: [1, 'm<sup>3</sup>'], cm3: [1e-6, 'cm<sup>3</sup>'] };
  const GASES = {
    monoatomico: { nombre: 'Monoatómico (He, Ne, Ar…)', gamma: 5 / 3, cv: '3/2', cp: '5/2' },
    diatomico: { nombre: 'Diatómico (N₂, O₂, aire…)', gamma: 7 / 5, cv: '5/2', cp: '7/2' },
  };
  // nombre, masa molar (g/mol) y diámetro cinético (pm) para el recorrido libre medio.
  // Fuente de los diámetros: D. W. Breck, «Zeolite Molecular Sieves» (1974), contrastados en Fase 10 con la tabla de Wikipedia «Kinetic diameter»;
  // el aire (365 pm) es una media de N₂ y O₂. Masas molares: IUPAC.
  const MOLECULAS = { He: ['Helio', 4.003, 260], Ne: ['Neón', 20.18, 275], Ar: ['Argón', 39.95, 340], H2: ['Hidrógeno, H₂', 2.016, 289], N2: ['Nitrógeno, N₂', 28.01, 364], O2: ['Oxígeno, O₂', 32.00, 346], aire: ['Aire', 28.96, 365], CO2: ['Dióxido de carbono, CO₂', 44.01, 330] };
  // constantes de Van der Waals: a (Pa·m⁶/mol²), b (m³/mol). Fuente: CRC Handbook of Chemistry and Physics (Weast, 53.ª ed.),
  // contrastadas en Fase 10 con Wikipedia «Van der Waals constants (data page)» (a en L²·bar/mol² ÷ 10; b en L/mol ÷ 1000)
  const VDW = { He: ['Helio', 0.00346, 2.38e-5], H2: ['Hidrógeno, H₂', 0.02476, 2.661e-5], N2: ['Nitrógeno, N₂', 0.1370, 3.87e-5], O2: ['Oxígeno, O₂', 0.1382, 3.186e-5], Ar: ['Argón', 0.1355, 3.20e-5], CO2: ['Dióxido de carbono, CO₂', 0.3640, 4.267e-5], NH3: ['Amoniaco, NH₃', 0.4225, 3.707e-5], H2O: ['Vapor de agua', 0.5536, 3.049e-5] };
  // Constantes críticas reales [T_c (K), P_c (atm)] de los mismos gases (CRC Handbook, «Critical Constants»; contrastadas con `chemicals` salvo el P_c del argón, que ese paquete trae mal)
  const CRIT = { He: [5.19, 2.24], H2: [33.2, 12.8], N2: [126.2, 33.5], O2: [154.6, 49.8], Ar: [150.9, 48.3], CO2: [304.1, 72.8], NH3: [405.5, 111.3], H2O: [647.1, 217.7] };

  function num(sc, k, nom, { opcional = false, signo = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (!signo && v <= 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser mayor que 0`);
    return v;
  }
  const unidades = (sc) => ({ P: UP[sc.uP] || UP.atm, V: UV[sc.uV] || UV.L, celsius: sc.uT === 'C' });
  // pasa de las unidades de la pantalla al SI
  function aSI(u, k, v) {
    if (v === null) return null;
    if (k === 'P') return v * u.P[0];
    if (k === 'V') return v * u.V[0];
    if (k === 'T') { const T = u.celsius ? v + 273.15 : v; if (T <= 0) throw new Error('La temperatura absoluta tiene que ser mayor que 0 K'); return T; }
    return v;
  }
  const verP = (u, P) => `${f(P / u.P[0])} ${u.P[1]}`, verV = (u, V) => `${f(V / u.V[0])} ${u.V[1]}`, verT = (T) => `${f(T, 5)} K`;

  /* ---------- Ecuación de estado ---------- */
  // sc: { P, V, T, n, m (g), M (g/mol), uP, uV, uT }: tres de P, V, T, n (n también sale de m y M)
  function estado(sc, { prefijo = '', pasos = [] } = {}) {
    const u = unidades(sc), g = (k) => sc[prefijo + k];
    const lee = (k, nom) => { const v = vacio(g(k)) ? null : leeNum(g(k)); if (v !== null && !isFinite(v)) throw new Error(`${nom} debe ser un número`); if (v !== null && k !== 'T' && v <= 0) throw new Error(`${nom} debe ser mayor que 0`); return v; };
    let P = aSI(u, 'P', lee('P', 'La presión')), V = aSI(u, 'V', lee('V', 'El volumen')), T = aSI(u, 'T', lee('T', 'La temperatura')), n = lee('n', 'El número de moles');
    const m = prefijo ? null : lee('m', 'La masa'), M = prefijo ? null : lee('M', 'La masa molar');
    if (n === null && m !== null && M !== null) { n = m / M; pasos.push({ t: 'Número de moles', html: `$n = m/M = ${f(m)}/${f(M)}$ = <b>${f(n)} mol</b>` }); }
    const faltan = [['P', P], ['V', V], ['T', T], ['n', n]].filter(([, v]) => v === null).map(([k]) => k);
    if (faltan.length > 1) throw new Error(`Faltan datos: da tres de P, V, T y n (ahora faltan ${faltan.join(' y ')})`);
    const nr = (x) => f(x);
    if (faltan.length === 0) {
      const err = Math.abs(P * V - n * R * T) / (P * V);
      if (err > 1e-3) throw new Error(`Los cuatro datos no cumplen PV = nRT (PV = ${nr(P * V).replace(/<[^>]+>/g, '')} J y nRT = ${nr(n * R * T).replace(/<[^>]+>/g, '')} J): deja uno vacío`);
    } else {
      const k = faltan[0], ecs = {
        P: () => { P = (n * R * T) / V; return `$P = {nRT}/V = {${f(n)} · ${Rs} · ${f(T, 5)}}/{${f(V)}} = ${f(P, 6)}$ Pa = <b>${verP(u, P)}</b>`; },
        V: () => { V = (n * R * T) / P; return `$V = {nRT}/P = {${f(n)} · ${Rs} · ${f(T, 5)}}/{${f(P, 6)}} = ${f(V)}$ m<sup>3</sup> = <b>${verV(u, V)}</b>`; },
        T: () => { T = (P * V) / (n * R); return `$T = {PV}/{nR} = {${f(P, 6)} · ${f(V)}}/{${f(n)} · ${Rs}}$ = <b>${verT(T)}</b> (${f(T - 273.15)} °C)`; },
        n: () => { n = (P * V) / (R * T); return `$n = {PV}/{RT} = {${f(P, 6)} · ${f(V)}}/{${Rs} · ${f(T, 5)}}$ = <b>${f(n)} mol</b>`; },
      };
      if (!prefijo) pasos.push({ t: 'Datos en el SI', html: [P !== null && `P = ${verP(u, P)} = ${f(P, 6)} Pa`, V !== null && `V = ${verV(u, V)} = ${f(V)} m<sup>3</sup>`, T !== null && `T = ${verT(T)}`, n !== null && `n = ${f(n)} mol`].filter(Boolean).join(', &nbsp; ') + `. R = ${Rs} J/(mol·K)` });
      pasos.push({ t: prefijo ? 'Estado inicial (PV = nRT)' : 'Ecuación de estado PV = nRT', html: ecs[k]() });
    }
    return { P, V, T, n, m, M, u, pasos };
  }

  function resolverEstado(sc) {
    const pasos = [], e = estado(sc, { pasos });
    if (e.M) { const rho = (e.P * e.M * 1e-3) / (R * e.T); pasos.push({ t: 'Densidad', html: `$ρ = {PM}/{RT} = {${f(e.P, 6)} · ${f(e.M * 1e-3)}}/{${Rs} · ${f(e.T, 5)}}$ = <b>${f(rho)} kg/m<sup>3</sup></b> (= ${f(rho)} g/L)` }); e.rho = rho; }
    const Vm = (R * e.T) / e.P;
    pasos.push({ t: 'Volumen molar y moléculas', html: `$V_m = V/n = ${f(Vm * 1000)}$ L/mol${Math.abs(e.T - 273.15) < 0.01 && Math.abs(e.P - 101325) < 1 ? ' (22,4 L/mol en condiciones normales)' : ''}; &nbsp; $N = n N_A$ = <b>${f(e.n * NA)} moléculas</b>` });
    return { modo: 'estado', ...e, Vm, pasos };
  }

  /* ---------- Procesos y ciclos ---------- */
  const NOMBRES = { isoterma: 'isoterma (T constante)', isobara: 'isobara (P constante)', isocora: 'isocora (V constante)', adiabatica: 'adiabática (Q = 0)' };
  const LETRA = (i) => String.fromCharCode(65 + i);
  // sc: { gas, uP, uV, uT, P1, V1, T1, n1, procesos: [{ tipo, dato: 'P'|'V'|'T', valor ('A' = el del estado inicial) }] }
  function procesos(sc) {
    const G = GASES[sc.gas] || GASES.diatomico, gm = G.gamma, cv = R / (gm - 1), cp = cv + R;
    const pasos = [];
    const e1 = estado(sc, { prefijo: '', pasos: [] });
    const u = e1.u, n = e1.n;
    pasos.push({ t: 'Estado A', html: `$P_A$ = ${verP(u, e1.P)}, $V_A$ = ${verV(u, e1.V)}, $T_A$ = ${verT(e1.T)}, n = <b>${f(n)} mol</b>${e1.pasos.length ? `<br>${e1.pasos.map((p) => p.html).join('<br>')}` : ''}<br>Gas ${G.nombre.split(' (')[0].toLowerCase()}: $C_v = {${G.cv.split('/')[0]}}/{${G.cv.split('/')[1]}} R$, $C_p = {${G.cp.split('/')[0]}}/{${G.cp.split('/')[1]}} R$, $γ = ${f(gm)}$` });
    const est = [{ P: e1.P, V: e1.V, T: e1.T }], tramos = [];
    const lista = sc.procesos || [];
    if (!lista.length) throw new Error('Añade al menos una transformación');
    lista.forEach((pr, i) => {
      const a = est[i], de = LETRA(i), cierra = String(pr.valor).trim().toUpperCase() === 'A', a2 = cierra ? 'A' : LETRA(i + 1), tipo = pr.tipo;
      if (!NOMBRES[tipo]) throw new Error(`Tramo ${de}→${a2}: tipo desconocido`);
      const permitidos = { isoterma: ['V', 'P'], isobara: ['V', 'T'], isocora: ['P', 'T'], adiabatica: ['V', 'P', 'T'] }[tipo];
      if (!permitidos.includes(pr.dato)) throw new Error(`Tramo ${de}→${a2}: en una ${tipo} se da ${permitidos.join(', ')} del estado final`);
      let val;
      if (cierra) val = est[0][pr.dato];
      else { const v = num(pr, 'valor', `el dato del tramo ${de}→${a2}`); val = aSI(u, pr.dato, v); }
      let b;
      if (tipo === 'isoterma') b = pr.dato === 'V' ? { V: val, T: a.T, P: (a.P * a.V) / val } : { P: val, T: a.T, V: (a.P * a.V) / val };
      else if (tipo === 'isobara') b = pr.dato === 'V' ? { P: a.P, V: val, T: (a.T * val) / a.V } : { P: a.P, T: val, V: (a.V * val) / a.T };
      else if (tipo === 'isocora') b = pr.dato === 'P' ? { V: a.V, P: val, T: (a.T * val) / a.P } : { V: a.V, T: val, P: (a.P * val) / a.T };
      else if (pr.dato === 'V') { const P = a.P * (a.V / val) ** gm; b = { V: val, P, T: (P * val) / (n * R) }; }
      else if (pr.dato === 'P') { const V = a.V * (a.P / val) ** (1 / gm); b = { P: val, V, T: (val * V) / (n * R) }; }
      else { const V = a.V * (a.T / val) ** (1 / (gm - 1)); b = { T: val, V, P: (n * R * val) / V }; }
      if (cierra) {
        const A = est[0], ok = ['P', 'V', 'T'].every((k) => Math.abs(b[k] - A[k]) <= 1e-6 * A[k]);
        if (!ok) throw new Error(`Tramo ${de}→${a2}: con una ${tipo} no se vuelve al estado A desde ${de}; el ciclo no cierra`);
        b = { ...A };
      }
      const dT = b.T - a.T, dU = n * cv * dT;
      let W, Q, hW, hQ;
      const cvT = `{${G.cv.split('/')[0]}}/{${G.cv.split('/')[1]}}`, cpT = `{${G.cp.split('/')[0]}}/{${G.cp.split('/')[1]}}`;
      if (tipo === 'isoterma') { W = n * R * a.T * Math.log(b.V / a.V); Q = W; hW = `$W = nRT ln {V_${a2}}/{V_${de}} = ${f(n)} · ${Rs} · ${f(a.T)} · ln ${f(b.V / a.V)}$ = <b>${f(W)} J</b>`; hQ = `$ΔU = 0$ (T constante) ⇒ $Q = W$ = <b>${f(Q)} J</b>`; }
      else if (tipo === 'isobara') { W = a.P * (b.V - a.V); Q = n * cp * dT; hW = `$W = P ΔV = ${f(a.P)} · (${f(b.V)} − ${f(a.V)})$ = <b>${f(W)} J</b>`; hQ = `$Q = n C_p ΔT = ${f(n)} · ${cpT} · ${Rs} · ${f(dT)}$ = <b>${f(Q)} J</b>; $ΔU = n C_v ΔT$ = <b>${f(dU)} J</b>`; }
      else if (tipo === 'isocora') { W = 0; Q = dU; hW = '$W = 0$ (no cambia el volumen)'; hQ = `$Q = ΔU = n C_v ΔT = ${f(n)} · ${cvT} · ${Rs} · ${f(dT)}$ = <b>${f(Q)} J</b>`; }
      else { W = (a.P * a.V - b.P * b.V) / (gm - 1); Q = 0; hW = `$W = {P_${de} V_${de} − P_${a2} V_${a2}}/{γ − 1}$ = <b>${f(W)} J</b>`; hQ = `$Q = 0$ ⇒ $ΔU = −W$ = <b>${f(dU)} J</b> (= $n C_v ΔT$)`; }
      const rel = { isoterma: `$P_${de} V_${de} = P_${a2} V_${a2}$`, isobara: `$V_${de}/T_${de} = V_${a2}/T_${a2}$`, isocora: `$P_${de}/T_${de} = P_${a2}/T_${a2}$`, adiabatica: '$P V^γ$ = cte y $T V^{γ − 1}$ = cte' }[tipo];
      pasos.push({ t: `${de} → ${a2}: ${NOMBRES[tipo]}`, html: `${rel} ⇒ $P_${a2}$ = ${verP(u, b.P)}, $V_${a2}$ = ${verV(u, b.V)}, $T_${a2}$ = ${verT(b.T)}<br>${hW}<br>${hQ}` });
      est.push(b); tramos.push({ de, a: a2, tipo, W, Q, dU, ini: a, fin: b });
    });
    // los restos de redondeo de una suma que debe ser 0 (ΔU de un ciclo) se quedan en 0
    const escala = Math.max(...tramos.map((t) => Math.abs(t.Q) + Math.abs(t.W) + Math.abs(t.dU))), limpia = (x) => (Math.abs(x) < 1e-9 * escala ? 0 : x);
    const Wt = limpia(tramos.reduce((s, t) => s + t.W, 0)), Qt = limpia(tramos.reduce((s, t) => s + t.Q, 0)), Ut = limpia(tramos.reduce((s, t) => s + t.dU, 0));
    const ult = est[est.length - 1], ciclo = lista.length > 1 && ['P', 'V', 'T'].every((k) => Math.abs(ult[k] - est[0][k]) <= 1e-6 * est[0][k]);
    let rend = null;
    const Qabs = tramos.filter((t) => t.Q > 0).reduce((s, t) => s + t.Q, 0), Qced = -tramos.filter((t) => t.Q < 0).reduce((s, t) => s + t.Q, 0);
    if (ciclo) {
      rend = Qabs > 0 ? Wt / Qabs : null;
      const Tmax = Math.max(...est.map((e) => e.T)), Tmin = Math.min(...est.map((e) => e.T));
      pasos.push({ t: 'Balance del ciclo', html: `$ΔU = 0$ (vuelve al estado A) ⇒ $W_{neto} = Q_{neto}$ = <b>${f(Wt)} J</b><br>Calor absorbido: $Q_{abs} = ${f(Qabs)}$ J; cedido: ${f(Qced)} J${rend !== null ? `<br>${Wt > 0 ? 'Rendimiento' : 'Es un ciclo frigorífico (W &lt; 0); como motor'}: $η = W/Q_{abs}$ = <b>${f(100 * rend, 3)} %</b>; un Carnot entre ${f(Tmax)} K y ${f(Tmin)} K daría $1 − T_{"mín"}/T_{"máx"} = ${f(100 * (1 - Tmin / Tmax), 3)}$ %. Para ver el ciclo también en el diagrama T-S, ábrelo en Ciclos termodinámicos (ciclo propio).` : ''}` });
    } else pasos.push({ t: 'Totales', html: `$W = ${f(Wt)}$ J, $Q = ${f(Qt)}$ J, $ΔU = ${f(Ut)}$ J ($Q − W = ${f(Qt - Wt)}$ J)` });
    return { modo: 'procesos', G, u, n, est, tramos, Wt, Qt, Ut, ciclo, rend, Qabs, Qced, pasos };
  }

  /* ---------- Teoría cinética ---------- */
  // sc: { molecula (o 'otra' con M), M (g/mol), T, uT, n (opcional) }
  function cinetica(sc) {
    const Mg = sc.molecula && sc.molecula !== 'otra' && MOLECULAS[sc.molecula] ? MOLECULAS[sc.molecula][1] : num(sc, 'M', 'la masa molar');
    const nombre = sc.molecula && MOLECULAS[sc.molecula] ? MOLECULAS[sc.molecula][0] : 'Gas';
    const u = unidades(sc), T = aSI(u, 'T', num(sc, 'T', 'la temperatura', { signo: true })), M = Mg * 1e-3;
    const vrms = Math.sqrt((3 * R * T) / M), vmed = Math.sqrt((8 * R * T) / (Math.PI * M)), vp = Math.sqrt((2 * R * T) / M), Ec = 1.5 * kB * T, m = M / NA;
    const n = num(sc, 'n', 'el número de moles', { opcional: true });
    const pasos = [
      { t: 'Velocidad cuadrática media', html: `$v_{cm} = √({3RT}/M) = √({3 · ${Rs} · ${f(T, 5)}}/{${f(M)}})$ = <b>${f(vrms)} m/s</b> (M en kg/mol)` },
      { t: 'Velocidad media y más probable', html: `$v̄ = √({8RT}/{πM})$ = <b>${f(vmed)} m/s</b>, &nbsp; $v_p = √({2RT}/M)$ = <b>${f(vp)} m/s</b><br>Siempre $v_p < v̄ < v_{cm}$.` },
      { t: 'Energía cinética media de traslación de una molécula', html: `$⟨E_c⟩ = {3}/{2} k T = 1,5 · 1,381·10<sup>−23</sup> · ${f(T, 5)}$ = <b>${f(Ec)} J</b> (= $½ m v_{cm}^2$ con $m = M/N_A = ${f(m)}$ kg). Solo depende de T, no del gas.` },
    ];
    if (n) pasos.push({ t: `Energía cinética de traslación de ${f(n)} mol`, html: `$E = {3}/{2} n R T$ = <b>${f(1.5 * n * R * T)} J</b>` });
    // recorrido libre medio con la presión
    const Patm = num(sc, 'P', 'la presión', { opcional: true });
    let lam = null, z = null, nV = null, d = null;
    if (Patm) {
      const P = Patm * 101325, d0 = num(sc, 'd', 'el diámetro de la molécula', { opcional: true });
      d = (d0 ?? (MOLECULAS[sc.molecula] ? MOLECULAS[sc.molecula][2] : 0)) * 1e-12;
      if (!d) throw new Error('Para el recorrido libre medio hace falta el diámetro de la molécula');
      nV = P / (kB * T); lam = 1 / (Math.SQRT2 * Math.PI * d * d * nV); z = vmed / lam;
      pasos.push({ t: 'Moléculas por metro cúbico', html: `$n_V = P/(kT) = {${f(P, 6)}}/{1,381·10<sup>−23</sup> · ${f(T, 5)}}$ = <b>${f(nV)} m<sup>−3</sup></b>` });
      pasos.push({ t: 'Recorrido libre medio', html: `Con un diámetro molecular $d = ${f(d * 1e12)}$ pm${d0 ? '' : ' (diámetro cinético típico)'}, la distancia media entre dos choques es $λ = 1/(√2 π d^2 n_V)$ = <b>${f(lam)} m</b> (${f(lam * 1e9)} nm), unas ${f(lam / d, 3)} veces el tamaño de la molécula.` });
      pasos.push({ t: 'Choques por segundo', html: `Cada molécula choca $z = v̄/λ = ${f(vmed)}/${f(lam)}$ = <b>${f(z)} veces por segundo</b>, una cada ${f(1 / z)} s.` });
    }
    return { modo: 'cinetica', nombre, Mg, M, T, vrms, vmed, vp, Ec, n, lam, z, nV, d, pasos };
  }

  /* ---------- Mezcla de gases (Dalton) ---------- */
  // sc: { T, V (L), cant: 'n' | 'm', g1..g3 (claves de MOLECULAS), c1..c3 (moles o gramos) }
  function mezcla(sc) {
    const T = num(sc, 'T', 'la temperatura'), V = num(sc, 'V', 'el volumen') * 1e-3, gramos = sc.cant === 'm', comp = [];
    for (let i = 1; i <= 3; i++) {
      if (vacio(sc[`c${i}`])) continue;
      const k = sc[`g${i}`], gas = MOLECULAS[k];
      if (!gas) throw new Error(`Elige el gas ${i}`);
      const c = num(sc, `c${i}`, `la cantidad del gas ${i}`), n = gramos ? c / gas[1] : c;
      comp.push({ k, nombre: gas[0], M: gas[1], m: gramos ? c : c * gas[1], n });
    }
    if (comp.length < 2) throw new Error('Una mezcla necesita al menos dos gases');
    const nt = comp.reduce((s2, c) => s2 + c.n, 0), Pt = (nt * R * T) / V, mt = comp.reduce((s2, c) => s2 + c.m, 0), Mm = mt / nt;
    for (const c of comp) { c.x = c.n / nt; c.P = c.x * Pt; }
    const pasos = [];
    if (gramos) pasos.push({ t: 'Moles de cada gas', html: comp.map((c) => `$n_{"${c.k}"} = m/M = ${f(c.m)}/${f(c.M)}$ = ${f(c.n)} mol`).join('<br>') });
    pasos.push({ t: 'Moles totales y fracciones molares', html: `$n = ${comp.map((c) => f(c.n)).join(' + ')} = ${f(nt)}$ mol<br>${comp.map((c) => `$x_{"${c.k}"} = n_{"${c.k}"}/n = ${f(c.n)}/${f(nt)}$ = <b>${f(c.x)}</b>`).join('<br>')}` });
    pasos.push({ t: 'Presión total', html: `Cada gas ocupa todo el recipiente como si estuviera solo, así que la mezcla cumple $P V = n R T$ con los moles totales: $P = {nRT}/V = {${f(nt)} · ${Rs} · ${f(T)}}/{${f(V)}}$ = <b>${f(Pt)} Pa</b> (${f(Pt / 101325)} atm)` });
    pasos.push({ t: 'Presiones parciales (ley de Dalton)', html: `La presión de cada gas es la que tendría él solo en todo el volumen, $P_i = x_i P$, y la suma es la total: ${comp.map((c) => `$P_{"${c.k}"} = ${f(c.x)} · ${f(Pt)}$ = <b>${f(c.P)} Pa</b>`).join(', ')}.` });
    pasos.push({ t: 'Masa molar media y densidad', html: `$M̄ = Σ x_i M_i = ${f(Mm)}$ g/mol y $ρ = {P M̄}/{RT} = ${f((Pt * Mm * 1e-3) / (R * T))}$ kg/m³` });
    return { modo: 'mezcla', T, V, comp, nt, Pt, mt, Mm, rho: (Pt * Mm * 1e-3) / (R * T), pasos };
  }

  /* ---------- Gas real: Van der Waals ---------- */
  // sc: { gasR (clave de VDW u 'otra'), a, b (si es otra), n, V (L), T (K) }
  function real(sc) {
    let a, b, nombre;
    if (VDW[sc.gasR]) [nombre, a, b] = VDW[sc.gasR];
    else { nombre = 'Gas'; a = num(sc, 'a', 'la constante a'); b = num(sc, 'b', 'la constante b'); }
    const n = num(sc, 'n', 'el número de moles'), V = num(sc, 'V', 'el volumen') * 1e-3, T = num(sc, 'T', 'la temperatura');
    if (V <= n * b) throw new Error(`El volumen tiene que ser mayor que el que ocupan las propias moléculas, nb = ${f(n * b * 1000).replace(/<[^>]+>/g, '')} L`);
    const Pi = (n * R * T) / V, rep = (n * R * T) / (V - n * b), atr = (a * n * n) / (V * V), P = rep - atr, Z = (P * V) / (n * R * T);
    const Tc = (8 * a) / (27 * R * b), Pc = a / (27 * b * b), Vc = 3 * b;
    const usaReal = sc.crit === 'real' && !!CRIT[sc.gasR], TcR = usaReal ? CRIT[sc.gasR][0] : Tc, PcR = usaReal ? CRIT[sc.gasR][1] * 101325 : Pc;
    // Redlich-Kwong con los mismos Tc y Pc: a' = 0,42748 R²Tc^2,5/Pc, b' = 0,08664 R Tc/Pc; P = nRT/(V − nb') − a'n²/(√T V (V + nb'))
    const aR = (0.42748 * R * R * TcR ** 2.5) / PcR, bR = (0.08664 * R * TcR) / PcR;
    const prk = (Vm, TT) => (R * TT) / (Vm - bR) - aR / (Math.sqrt(TT) * Vm * (Vm + bR)), pvdw = (Vm, TT) => (R * TT) / (Vm - b) - a / (Vm * Vm);
    if (V / n <= bR) throw new Error(`El volumen molar tiene que ser mayor que b de Redlich-Kwong, ${f(bR * 1000)} L/mol`);
    const PRK = prk(V / n, T), ZRK = (PRK * V) / (n * R * T);
    const pasos = [
      { t: 'Ecuación de Van der Waals', html: `${nombre}: $a = ${f(a)}$ Pa·m⁶/mol², $b = ${f(b)}$ m³/mol. La ecuación $(P + {a n^2}/{V^2})(V − nb) = nRT$ corrige el gas ideal: b es el volumen que ocupan las moléculas y a mide lo que se atraen.` },
      { t: 'Presión del gas real', html: `$P = {nRT}/{V − nb} − {a n^2}/{V^2} = {${f(n)} · ${Rs} · ${f(T)}}/{${f(V)} − ${f(n * b)}} − {${f(a)} · ${f(n)}^2}/{(${f(V)})^2} = ${f(rep)} − ${f(atr)}$ = <b>${f(P)} Pa</b> (${f(P / 101325)} atm)` },
      { t: 'Comparación con el gas ideal', html: `Ideal: $P = {nRT}/V$ = ${f(Pi)} Pa (${f(Pi / 101325)} atm). El real da un ${f((100 * (P - Pi)) / Pi, 3)} %. Factor de compresibilidad $Z = {PV}/{nRT}$ = <b>${f(Z)}</b>: ${Z < 1 ? 'menor que 1, mandan las atracciones' : 'mayor que 1, manda el volumen de las moléculas'}.` },
      { t: 'Redlich-Kwong', html: `${usaReal ? `Con los datos críticos reales del gas, $T_c$ = ${f(TcR)} K y $P_c$ = ${f(PcR / 101325)} atm (los de Van der Waals dan ${f(Tc)} K y ${f(Pc / 101325)} atm): ` : 'Con los mismos $T_c$ y $P_c$: '}$a' = {0,42748 R^2 T_c^{2,5}}/{P_c} = ${f(aR)}$ Pa·m⁶·K<sup>½</sup>/mol², $b' = {0,08664 R T_c}/{P_c} = ${f(bR)}$ m³/mol. La ecuación $P = {RT}/{V_m − b'} − {a'}/{√T V_m (V_m + b')}$ da <b>${f(PRK)} Pa</b> (${f(PRK / 101325)} atm), $Z = ${f(ZRK)}$. Suele ajustarse mejor que Van der Waals a presiones altas y a temperaturas por encima de la crítica. <b>Aviso:</b> aquí $T_c$ y $P_c$ no son los valores medidos del gas, sino los que salen de $a$ y $b$ de Van der Waals, así que este Redlich-Kwong es una aproximación; con los valores críticos reales ($T_c$ y $P_c$ de tablas) saldría algo distinto.` },
      { t: 'Punto crítico', html: `$T_c = {8a}/{27Rb}$ = <b>${f(Tc)} K</b>, $P_c = {a}/{27 b^2}$ = ${f(Pc / 101325)} atm, $V_{m,c} = 3b$ = ${f(Vc * 1000)} L/mol. Por encima de $T_c$ el gas no se puede licuar por mucho que se comprima.` },
    ];
    return { modo: 'real', nombre, a, b, n, V, T, P, Pi, Z, Tc, Pc, Vc, aR, bR, usaReal, TcR, PcR, PRK, ZRK, prk, pvdw, pasos };
  }
  // densidad de Maxwell para la gráfica
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
    { clave: 'volumen', nombre: 'Volumen de un gas (PV = nRT)', sc: { modo: 'estado', ...B, uT: 'C', P: '2', V: '', T: '27', n: '', m: '16', M: '32' } },
    { clave: 'normales', nombre: 'Un mol en condiciones normales', sc: { modo: 'estado', ...B, P: '1', V: '', T: '273,15', n: '1', m: '', M: '' } },
    { clave: 'isoterma', nombre: 'Expansión isoterma', sc: { modo: 'procesos', gas: 'diatomico', ...B, P: '4', V: '5', T: '300', n: '', procesos: [{ tipo: 'isoterma', dato: 'V', valor: '20' }] } },
    { clave: 'adiabatica', nombre: 'Compresión adiabática del aire', sc: { modo: 'procesos', gas: 'diatomico', ...B, P: '1', V: '10', T: '300', n: '', procesos: [{ tipo: 'adiabatica', dato: 'V', valor: '2' }] } },
    { clave: 'ciclo-rect', nombre: 'Ciclo rectangular (dos isobaras y dos isocoras)', sc: { modo: 'procesos', gas: 'monoatomico', ...B, uP: 'kPa', P: '100', V: '2', T: '', n: '0,1', procesos: [{ tipo: 'isocora', dato: 'P', valor: '300' }, { tipo: 'isobara', dato: 'V', valor: '6' }, { tipo: 'isocora', dato: 'P', valor: '100' }, { tipo: 'isobara', dato: 'V', valor: 'A' }] } },
    { clave: 'carnot', nombre: 'Ciclo de Carnot', sc: { modo: 'procesos', gas: 'diatomico', ...B, P: '10', V: '1', T: '600', n: '', procesos: [{ tipo: 'isoterma', dato: 'V', valor: '3' }, { tipo: 'adiabatica', dato: 'T', valor: '300' }, { tipo: 'isoterma', dato: 'V', valor: String(3 * 2 ** 2.5 / 3) }, { tipo: 'adiabatica', dato: 'V', valor: 'A' }] } },
    { clave: 'cinetica', nombre: 'Velocidad de las moléculas de oxígeno', sc: { modo: 'cinetica', molecula: 'O2', M: '', T: '300', uT: 'K', n: '1', P: '', d: '' } },
    { clave: 'recorrido', nombre: 'Recorrido libre medio del aire', sc: { modo: 'cinetica', molecula: 'aire', M: '', T: '293', uT: 'K', n: '', P: '1', d: '' } },
    { clave: 'aire-mezcla', nombre: 'Presiones parciales del aire (N₂, O₂, Ar)', sc: { modo: 'mezcla', T: '298', V: '22,4', cant: 'n', g1: 'N2', c1: '0,78', g2: 'O2', c2: '0,21', g3: 'Ar', c3: '0,01' } },
    { clave: 'buceo', nombre: 'Botella de buceo con oxígeno y helio', sc: { modo: 'mezcla', T: '293', V: '12', cant: 'm', g1: 'O2', c1: '800', g2: 'He', c2: '400', g3: 'N2', c3: '' } },
    { clave: 'vdw', nombre: 'CO₂ comprimido: real frente a ideal', sc: { modo: 'real', gasR: 'CO2', a: '', b: '', n: '1', V: '0,5', T: '300' } },
    { clave: 'vdw-n2', nombre: 'Nitrógeno a presión moderada', sc: { modo: 'real', gasR: 'N2', a: '', b: '', n: '2', V: '10', T: '273' } },
  ];
  // en el Carnot, V_D = V_A·(T_A/T_C)^(1/(γ−1)) = 1·2^2,5 L
  ejemplos[5].sc.procesos[2].valor = String(+(2 ** 2.5).toFixed(6));

  return { resolver, estado: conR(resolverEstado), procesos: conR(procesos), cinetica: conR(cinetica), mezcla: conR(mezcla), real: conR(real), maxwell: conR(maxwell), GASES, MOLECULAS, VDW, CRIT, UP, UV, NOMBRES, ejemplos, f, get R() { ponR(); return R; }, kB };
})();
if (typeof module !== 'undefined') module.exports = Gases;
