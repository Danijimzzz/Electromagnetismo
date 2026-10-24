/* =====================================================================
   Gases ideales (sin DOM): ecuación de estado PV = nRT, transformaciones
   (isoterma, isobara, isocora y adiabática) encadenadas en un proceso o un
   ciclo con el primer principio, y teoría cinética (velocidades de las
   moléculas y distribución de Maxwell).
   Por dentro todo en el SI; el trabajo W es el que hace el gas y
   ΔU = Q − W.
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
  const R = 8.314, Rs = '8,314', kB = 1.380649e-23, NA = 6.02214076e23;
  const UP = { atm: [101325, 'atm'], kPa: [1000, 'kPa'], Pa: [1, 'Pa'], bar: [1e5, 'bar'], mmHg: [101325 / 760, 'mmHg'] };
  const UV = { L: [1e-3, 'L'], m3: [1, 'm<sup>3</sup>'], cm3: [1e-6, 'cm<sup>3</sup>'] };
  const GASES = {
    monoatomico: { nombre: 'Monoatómico (He, Ne, Ar…)', gamma: 5 / 3, cv: '3/2', cp: '5/2' },
    diatomico: { nombre: 'Diatómico (N₂, O₂, aire…)', gamma: 7 / 5, cv: '5/2', cp: '7/2' },
  };
  const MOLECULAS = { He: ['Helio', 4.003], Ne: ['Neón', 20.18], Ar: ['Argón', 39.95], H2: ['Hidrógeno, H₂', 2.016], N2: ['Nitrógeno, N₂', 28.01], O2: ['Oxígeno, O₂', 32.00], aire: ['Aire', 28.96], CO2: ['Dióxido de carbono, CO₂', 44.01] };

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
    if (n === null && m !== null && M !== null) { n = m / M; pasos.push({ t: 'Número de moles', html: `n = m/M = ${f(m)} g / ${f(M)} g/mol = <b>${f(n)} mol</b>` }); }
    const faltan = [['P', P], ['V', V], ['T', T], ['n', n]].filter(([, v]) => v === null).map(([k]) => k);
    if (faltan.length > 1) throw new Error(`Faltan datos: da tres de P, V, T y n (ahora faltan ${faltan.join(' y ')})`);
    const nr = (x) => f(x);
    if (faltan.length === 0) {
      const err = Math.abs(P * V - n * R * T) / (P * V);
      if (err > 1e-3) throw new Error(`Los cuatro datos no cumplen PV = nRT (PV = ${nr(P * V).replace(/<[^>]+>/g, '')} J y nRT = ${nr(n * R * T).replace(/<[^>]+>/g, '')} J): deja uno vacío`);
    } else {
      const k = faltan[0], ecs = {
        P: () => { P = (n * R * T) / V; return `P = nRT/V = ${f(n)}·${Rs}·${f(T, 5)} / ${f(V)} m<sup>3</sup> = ${f(P, 6)} Pa = <b>${verP(u, P)}</b>`; },
        V: () => { V = (n * R * T) / P; return `V = nRT/P = ${f(n)}·${Rs}·${f(T, 5)} / ${f(P, 6)} Pa = ${f(V)} m<sup>3</sup> = <b>${verV(u, V)}</b>`; },
        T: () => { T = (P * V) / (n * R); return `T = PV/(nR) = ${f(P, 6)} Pa·${f(V)} m<sup>3</sup> / (${f(n)}·${Rs}) = <b>${verT(T)}</b> (${f(T - 273.15)} °C)`; },
        n: () => { n = (P * V) / (R * T); return `n = PV/(RT) = ${f(P, 6)} Pa·${f(V)} m<sup>3</sup> / (${Rs}·${f(T, 5)}) = <b>${f(n)} mol</b>`; },
      };
      if (!prefijo) pasos.push({ t: 'Datos en el SI', html: [P !== null && `P = ${verP(u, P)} = ${f(P, 6)} Pa`, V !== null && `V = ${verV(u, V)} = ${f(V)} m<sup>3</sup>`, T !== null && `T = ${verT(T)}`, n !== null && `n = ${f(n)} mol`].filter(Boolean).join(', &nbsp; ') + `. R = ${Rs} J/(mol·K)` });
      pasos.push({ t: prefijo ? 'Estado inicial (PV = nRT)' : 'Ecuación de estado PV = nRT', html: ecs[k]() });
    }
    return { P, V, T, n, m, M, u, pasos };
  }

  function resolverEstado(sc) {
    const pasos = [], e = estado(sc, { pasos });
    if (e.M) { const rho = (e.P * e.M * 1e-3) / (R * e.T); pasos.push({ t: 'Densidad', html: `ρ = PM/(RT) = ${f(e.P, 6)}·${f(e.M * 1e-3)} / (${Rs}·${f(e.T, 5)}) = <b>${f(rho)} kg/m<sup>3</sup></b> (= ${f(rho)} g/L)` }); e.rho = rho; }
    const Vm = (R * e.T) / e.P;
    pasos.push({ t: 'Volumen molar y moléculas', html: `V<sub>m</sub> = V/n = ${f(Vm * 1000)} L/mol${Math.abs(e.T - 273.15) < 0.01 && Math.abs(e.P - 101325) < 1 ? ' (22,4 L/mol en condiciones normales)' : ''}; &nbsp; N = nN<sub>A</sub> = <b>${f(e.n * NA)} moléculas</b>` });
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
    pasos.push({ t: 'Estado A', html: `P<sub>A</sub> = ${verP(u, e1.P)}, V<sub>A</sub> = ${verV(u, e1.V)}, T<sub>A</sub> = ${verT(e1.T)}, n = <b>${f(n)} mol</b>${e1.pasos.length ? `<br>${e1.pasos.map((p) => p.html).join('<br>')}` : ''}<br>Gas ${G.nombre.split(' (')[0].toLowerCase()}: C<sub>v</sub> = ${G.cv}R, C<sub>p</sub> = ${G.cp}R, γ = ${f(gm)}` });
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
      if (tipo === 'isoterma') { W = n * R * a.T * Math.log(b.V / a.V); Q = W; hW = `W = nRT ln(V<sub>${a2}</sub>/V<sub>${de}</sub>) = ${f(n)}·${Rs}·${f(a.T)}·ln(${f(b.V / a.V)}) = <b>${f(W)} J</b>`; hQ = `ΔU = 0 (T constante) ⇒ Q = W = <b>${f(Q)} J</b>`; }
      else if (tipo === 'isobara') { W = a.P * (b.V - a.V); Q = n * cp * dT; hW = `W = P ΔV = ${f(a.P)}·(${f(b.V)} − ${f(a.V)}) = <b>${f(W)} J</b>`; hQ = `Q = nC<sub>p</sub>ΔT = ${f(n)}·${G.cp}·${Rs}·${f(dT)} = <b>${f(Q)} J</b>; ΔU = nC<sub>v</sub>ΔT = <b>${f(dU)} J</b>`; }
      else if (tipo === 'isocora') { W = 0; Q = dU; hW = 'W = 0 (no cambia el volumen)'; hQ = `Q = ΔU = nC<sub>v</sub>ΔT = ${f(n)}·${G.cv}·${Rs}·${f(dT)} = <b>${f(Q)} J</b>`; }
      else { W = (a.P * a.V - b.P * b.V) / (gm - 1); Q = 0; hW = `W = (P<sub>${de}</sub>V<sub>${de}</sub> − P<sub>${a2}</sub>V<sub>${a2}</sub>)/(γ − 1) = <b>${f(W)} J</b>`; hQ = `Q = 0 ⇒ ΔU = −W = <b>${f(dU)} J</b> (= nC<sub>v</sub>ΔT)`; }
      const rel = { isoterma: `P<sub>${de}</sub>V<sub>${de}</sub> = P<sub>${a2}</sub>V<sub>${a2}</sub>`, isobara: `V<sub>${de}</sub>/T<sub>${de}</sub> = V<sub>${a2}</sub>/T<sub>${a2}</sub>`, isocora: `P<sub>${de}</sub>/T<sub>${de}</sub> = P<sub>${a2}</sub>/T<sub>${a2}</sub>`, adiabatica: `P V<sup>γ</sup> = cte y T V<sup>γ−1</sup> = cte` }[tipo];
      pasos.push({ t: `${de} → ${a2}: ${NOMBRES[tipo]}`, html: `${rel} ⇒ P<sub>${a2}</sub> = ${verP(u, b.P)}, V<sub>${a2}</sub> = ${verV(u, b.V)}, T<sub>${a2}</sub> = ${verT(b.T)}<br>${hW}<br>${hQ}` });
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
      pasos.push({ t: 'Balance del ciclo', html: `ΔU = 0 (vuelve al estado A) ⇒ W<sub>neto</sub> = Q<sub>neto</sub> = <b>${f(Wt)} J</b><br>Calor absorbido: Q<sub>abs</sub> = ${f(Qabs)} J; cedido: ${f(Qced)} J${rend !== null ? `<br>${Wt > 0 ? 'Rendimiento' : 'Es un ciclo frigorífico (W &lt; 0); como motor'}: η = W/Q<sub>abs</sub> = <b>${f(100 * rend, 3)} %</b>; un Carnot entre ${f(Tmax)} K y ${f(Tmin)} K daría 1 − T<sub>mín</sub>/T<sub>máx</sub> = ${f(100 * (1 - Tmin / Tmax), 3)} %` : ''}` });
    } else pasos.push({ t: 'Totales', html: `W = ${f(Wt)} J, Q = ${f(Qt)} J, ΔU = ${f(Ut)} J (Q − W = ${f(Qt - Wt)} J)` });
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
      { t: 'Velocidad cuadrática media', html: `v<sub>cm</sub> = √(3RT/M) = √(3·${Rs}·${f(T, 5)} / ${f(M)}) = <b>${f(vrms)} m/s</b> (M en kg/mol)` },
      { t: 'Velocidad media y más probable', html: `v̄ = √(8RT/(πM)) = <b>${f(vmed)} m/s</b>, &nbsp; v<sub>p</sub> = √(2RT/M) = <b>${f(vp)} m/s</b><br>Siempre v<sub>p</sub> &lt; v̄ &lt; v<sub>cm</sub>.` },
      { t: 'Energía cinética media de traslación de una molécula', html: `⟨E<sub>c</sub>⟩ = (3/2)kT = 1,5·1,381·10<sup>−23</sup>·${f(T, 5)} = <b>${f(Ec)} J</b> (= ½ m v<sub>cm</sub><sup>2</sup> con m = M/N<sub>A</sub> = ${f(m)} kg). Solo depende de T, no del gas.` },
    ];
    if (n) pasos.push({ t: `Energía cinética de traslación de ${f(n)} mol`, html: `E = (3/2)nRT = <b>${f(1.5 * n * R * T)} J</b>` });
    return { modo: 'cinetica', nombre, Mg, M, T, vrms, vmed, vp, Ec, n, pasos };
  }
  // densidad de Maxwell para la gráfica
  const maxwell = (M, T, v) => { const a = M / (2 * R * T); return 4 * Math.PI * (a / Math.PI) ** 1.5 * v * v * Math.exp(-a * v * v); };

  function resolver(sc) {
    if (sc.modo === 'procesos') return procesos(sc);
    if (sc.modo === 'cinetica') return cinetica(sc);
    return resolverEstado(sc);
  }

  const B = { uP: 'atm', uV: 'L', uT: 'K' };
  const ejemplos = [
    { clave: 'volumen', nombre: 'Volumen de un gas (PV = nRT)', sc: { modo: 'estado', ...B, uT: 'C', P: '2', V: '', T: '27', n: '', m: '16', M: '32' } },
    { clave: 'normales', nombre: 'Un mol en condiciones normales', sc: { modo: 'estado', ...B, P: '1', V: '', T: '273.15', n: '1', m: '', M: '' } },
    { clave: 'isoterma', nombre: 'Expansión isoterma', sc: { modo: 'procesos', gas: 'diatomico', ...B, P: '4', V: '5', T: '300', n: '', procesos: [{ tipo: 'isoterma', dato: 'V', valor: '20' }] } },
    { clave: 'adiabatica', nombre: 'Compresión adiabática del aire', sc: { modo: 'procesos', gas: 'diatomico', ...B, P: '1', V: '10', T: '300', n: '', procesos: [{ tipo: 'adiabatica', dato: 'V', valor: '2' }] } },
    { clave: 'ciclo-rect', nombre: 'Ciclo rectangular (dos isobaras y dos isocoras)', sc: { modo: 'procesos', gas: 'monoatomico', ...B, uP: 'kPa', P: '100', V: '2', T: '', n: '0.1', procesos: [{ tipo: 'isocora', dato: 'P', valor: '300' }, { tipo: 'isobara', dato: 'V', valor: '6' }, { tipo: 'isocora', dato: 'P', valor: '100' }, { tipo: 'isobara', dato: 'V', valor: 'A' }] } },
    { clave: 'carnot', nombre: 'Ciclo de Carnot', sc: { modo: 'procesos', gas: 'diatomico', ...B, P: '10', V: '1', T: '600', n: '', procesos: [{ tipo: 'isoterma', dato: 'V', valor: '3' }, { tipo: 'adiabatica', dato: 'T', valor: '300' }, { tipo: 'isoterma', dato: 'V', valor: String(3 * 2 ** 2.5 / 3) }, { tipo: 'adiabatica', dato: 'V', valor: 'A' }] } },
    { clave: 'cinetica', nombre: 'Velocidad de las moléculas de oxígeno', sc: { modo: 'cinetica', molecula: 'O2', M: '', T: '300', uT: 'K', n: '1' } },
  ];
  // en el Carnot, V_D = V_A·(T_A/T_C)^(1/(γ−1)) = 1·2^2,5 L
  ejemplos[5].sc.procesos[2].valor = String(+(2 ** 2.5).toFixed(6));

  return { resolver, estado: resolverEstado, procesos, cinetica, maxwell, GASES, MOLECULAS, UP, UV, NOMBRES, ejemplos, f, R };
})();
if (typeof module !== 'undefined') module.exports = Gases;
