/* =====================================================================
   Cálculo de las guías de onda rectangulares (sin DOM). La interfaz está en app.js y la
   prueba en pruebas/herramientas/guias-onda.js.
     resolver(sc)  { a, b (mm), er, f (GHz), tipo ('TE'|'TM'), m, n } (texto) → modo pedido (frecuencia y
                   longitud de onda de corte, β, λg, velocidades, impedancia o atenuación), modos que
                   se propagan, banda monomodo y pasos; lanza un Error con un mensaje para el usuario
     modos(a, b, v)  todos los modos TE y TM hasta orden 8, ordenados por frecuencia de corte
     campo(tipo, m, n, a, b, x, y)  componentes transversales (Ex, Ey) del modo, sin escala
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
   Guía circular (GU-1): forma 'circ' con el radio R (mm) y los modos TE_nm (ceros x'_nm de J_n') y TM_nm (ceros x_nm de J_n):
     f_c = x v / (2π R); dominante TE₁₁ (x' = 1,8412), después TM₀₁ (2,4048), TE₂₁ (3,0542) y TE₀₁ = TM₁₁ (3,8317). Usa los
     ceros de Bessel de Cavidades (cavidades/calculo.js va antes en la página). Al cerrar la guía con una longitud d queda una
     cavidad: f = v/2 √(k_c²/π² + (p/d)²) (GU-3), y la guía «se abre en Cavidades» con los datos del modo.
   Constantes: c = 299 792 458 m/s y η₀ = 376,730313 Ω.
   ===================================================================== */
const GuiasOnda = (() => {
  const Cav = typeof Cavidades !== 'undefined' ? Cavidades : require('../cavidades/calculo.js');
  const C0 = 299792458, ETA0 = 376.730313;
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
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, min = 0) {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número`);
    if (v <= min) throw new Error(`${may(nom)} debe ser mayor que ${min}`);
    return v;
  }
  const entero = (sc, k, nom) => {
    if (vacio(sc[k])) throw new Error(`Falta ${nom}`);
    const v = leeNum(sc[k]);
    if (!Number.isInteger(v) || v < 0 || v > 20) throw new Error(`${may(nom)} debe ser un entero entre 0 y 20`);
    return v;
  };

  // frecuencia de corte de TE/TM_mn en una guía a × b con velocidad v en el relleno
  const fcorte = (a, b, v, m, n) => (v / 2) * Math.hypot(m / a, n / b);
  function modos(a, b, v) {
    const l = [];
    for (let m = 0; m <= 8; m++) for (let n = 0; n <= 8; n++) {
      if (m || n) l.push({ tipo: 'TE', m, n, fc: fcorte(a, b, v, m, n) });
      if (m && n) l.push({ tipo: 'TM', m, n, fc: fcorte(a, b, v, m, n) });
    }
    return l.sort((p, q) => p.fc - q.fc || p.m + p.n - q.m - q.n || (p.tipo < q.tipo ? -1 : 1));
  }
  // componentes transversales (Ex, Ey) en (x, y), con 0 ≤ x ≤ a y 0 ≤ y ≤ b
  function campo(tipo, m, n, a, b, x, y) {
    const cx = Math.cos(m * Math.PI * x / a), sx = Math.sin(m * Math.PI * x / a), cy = Math.cos(n * Math.PI * y / b), sy = Math.sin(n * Math.PI * y / b);
    return tipo === 'TE' ? [(n / b) * cx * sy, -(m / a) * sx * cy] : [-(m / a) * cx * sy, -(n / b) * sx * cy];
  }
  const nom = (t, m, n) => `<b>${t}<sub>${m}${n}</sub></b>`;
  const nomMates = (t, m, n) => `"${t}"_{${m}${n}}`;


  /* ---------- Guía circular ---------- */
  const xCirc = (tipo, n, m) => (tipo === 'TM' ? Cav.cerosJ(n, m) : Cav.cerosJp(n, m));
  function modosCirc(R, v) {
    const l = [];
    for (let n = 0; n <= 6; n++) for (let m = 1; m <= 4; m++) for (const t of ['TE', 'TM']) { const x = xCirc(t, n, m); l.push({ tipo: t, m: n, n: m, x, fc: (x * v) / (2 * Math.PI * R) }); } // m = índice azimutal n del modo, n = radial (se guardan con los nombres de la rectangular: «m» primero)
    return l.sort((p, q) => p.fc - q.fc || (p.tipo < q.tipo ? -1 : 1));
  }
  // campo eléctrico transversal (Ex, Ey) del modo TE/TM_nm de la guía circular en (x, y) con ρ ≤ R
  function campoCirc(tipo, n, m, R, x, y) {
    const rho = Math.max(Math.hypot(x, y), 1e-9), ph = Math.atan2(y, x), kc = xCirc(tipo, n, m) / R, u = kc * rho;
    const J = Cav.Jn(n, u), Jp = (Cav.Jn(n - 1, u) - Cav.Jn(n + 1, u)) / 2, c = Math.cos(n * ph), s2 = Math.sin(n * ph);
    const nJ = n === 0 ? 0 : (n * J) / rho;
    const [er, ef] = tipo === 'TE' ? [nJ * s2, kc * Jp * c] : [kc * Jp * c, -nJ * s2];
    return [er * Math.cos(ph) - ef * Math.sin(ph), er * Math.sin(ph) + ef * Math.cos(ph)];
  }
  const nomC = (t, n, m) => `<b>${t}<sub>${n}${m}</sub></b>`;

  function resolver(sc) {
    const circ = sc.forma === 'circ', er = lee(sc, 'er', 'εr'), F = lee(sc, 'f', 'la frecuencia') * 1e9;
    const a = circ ? 0 : lee(sc, 'a', 'el lado a') / 1000, b = circ ? 0 : lee(sc, 'b', 'el lado b') / 1000, R = circ ? lee(sc, 'R', 'el radio R') / 1000 : 0;
    const tipo = sc.tipo === 'TM' ? 'TM' : 'TE', m = entero(sc, 'm', circ ? 'n (azimutal)' : 'm'), n = circ ? entero(sc, 'n', 'm (radial)') : entero(sc, 'n', 'n');
    if (circ) { if (n < 1) throw new Error('En la guía circular el índice radial m tiene que ser al menos 1'); if (m > 6 || n > 4) throw new Error('Los índices admitidos son n de 0 a 6 y m de 1 a 4'); }
    else if (!m && !n) throw new Error('m y n no pueden ser los dos 0');
    if (!circ && tipo === 'TM' && (!m || !n)) throw new Error('En los modos TM, m y n tienen que ser al menos 1');
    const v = C0 / Math.sqrt(er), eta = ETA0 / Math.sqrt(er), lam = v / F, k = 2 * Math.PI / lam;
    const xr = circ ? xCirc(tipo, m, n) : 0, fc = circ ? (xr * v) / (2 * Math.PI * R) : fcorte(a, b, v, m, n), kc = 2 * Math.PI * fc / v, lc = v / fc, ratio = fc / F, propaga = F > fc;
    const lista = circ ? modosCirc(R, v) : modos(a, b, v), prop = lista.filter((q) => q.fc < F), fc1 = lista[0], seg = lista.find((q) => q.fc > fc1.fc * (1 + 1e-9));
    const r = { forma: circ ? 'circ' : 'rect', R, x: xr, a, b, er, F, tipo, m, n, v, eta, lam, k, fc, kc, lc, propaga, modos: prop, dominante: fc1, banda: [fc1.fc, seg.fc], lista };
    const nomMo = (t, i, j) => (circ ? `"${t}"_{${i}${j}}` : nomMates(t, i, j));
    const pasos = [
      { t: 'Datos', html: (circ ? `Guía circular de radio $R = ${f(R * 1000)} "mm"$` : `$a = ${f(a * 1000)} "mm"$, $b = ${f(b * 1000)} "mm"$`) + `, $ε_r = ${f(er)}$, $f = ${f(F / 1e9)} "GHz"$. Modo ${nomMo(tipo, m, n)}.` },
      { t: 'Velocidad y longitud de onda en el relleno', html: `$v = c/√(ε_r) = ${f(v)} "m/s"$, $λ = v/f = ${f(lam * 1000)} "mm"$, $η = {η_0}/√(ε_r) = ${f(eta)} "Ω"$` },
      { t: 'Frecuencia de corte', html: circ ? `Con ${tipo === 'TE' ? "el cero de la derivada $x'_{" + m + n + "}$ de $J_" + m + "'$" : 'el cero $x_{' + m + n + '}$ de $J_' + m + '$'} $= ${f(xr)}$: $f_c = {x v}/{2π R} = {${f(xr)} · ${f(v)}}/{2π · ${f(R)}} = ${f(fc / 1e9)} "GHz"$, y $λ_c = v/f_c = ${f(lc * 1000)} "mm"$ (= $2π R/x = ${f(2 * Math.PI * R * 1000 / (xr || 1))} "mm"$)` : `$f_c = v/2 √({(m/a)^2 + (n/b)^2}) = ${f(v / 2)}·√({(${m}/${f(a)})^2 + (${n}/${f(b)})^2}) = ${f(fc / 1e9)} "GHz"$, y $λ_c = v/f_c = ${f(lc * 1000)} "mm"$` },
    ];
    if (propaga) {
      const s = Math.sqrt(1 - ratio * ratio);
      r.beta = k * s; r.lg = 2 * Math.PI / r.beta; r.vf = v / s; r.vg = v * s; r.Z = tipo === 'TE' ? eta / s : eta * s;
      pasos.push(
        { t: `Como f = ${f(F / 1e9)} GHz > f_c = ${f(fc / 1e9)} GHz, el modo se propaga`, html: `$f_c/f = ${f(ratio)}$, $√(1 − (f_c/f)^2) = ${f(s)}$` },
        { t: 'Constante de fase y longitud de onda en la guía', html: `$β = k √(1 − (f_c/f)^2) = ${f(k)}·${f(s)} = ${f(r.beta)} "rad/m"$, $λ_g = {2π}/β = ${f(r.lg * 1000)} "mm"$` },
        { t: 'Velocidades de fase y de grupo', html: `$v_f = v/√(1 − (f_c/f)^2) = ${f(r.vf)} "m/s"$, $v_g = v √(1 − (f_c/f)^2) = ${f(r.vg)} "m/s"$ (cumplen $v_f v_g = v^2$)` },
        { t: `Impedancia de onda del modo ${tipo}`, html: tipo === 'TE' ? `$Z_{"TE"} = η/√(1 − (f_c/f)^2) = ${f(r.Z)} "Ω"$` : `$Z_{"TM"} = η √(1 − (f_c/f)^2) = ${f(r.Z)} "Ω"$` });
    } else {
      r.alfa = (2 * Math.PI / lc) * Math.sqrt(1 - (F / fc) ** 2);
      r.dB = 8.685889638 * r.alfa;
      pasos.push(
        { t: `Como f = ${f(F / 1e9)} GHz < f_c = ${f(fc / 1e9)} GHz, el modo no se propaga (evanescente)`, html: `$f_c/f = ${f(ratio)}$: el campo decae como $e^{−α z}$ sin propagarse` },
        { t: 'Atenuación', html: `$α = k_c √(1 − (f/f_c)^2) = ${f(r.kc)}·${f(Math.sqrt(1 - (F / fc) ** 2))} = ${f(r.alfa)} "Np/m" = ${f(r.dB)} "dB/m"$` });
    }
    const f1 = fc1.fc, f2 = seg.fc;
    pasos.push(
      { t: 'Modo dominante y banda monomodo', html: `El modo de menor $f_c$ es el ${nomMo(fc1.tipo, fc1.m, fc1.n)}, con $f_c = ${f(f1 / 1e9)} "GHz"$; el siguiente es el ${nomMo(seg.tipo, seg.m, seg.n)}, con ${f(f2 / 1e9)} GHz. Solo se propaga el dominante entre ${f(f1 / 1e9)} y ${f(f2 / 1e9)} GHz.` },
      { t: `A ${f(F / 1e9)} GHz se propagan ${prop.length ? prop.length : 'ningún'} modo${prop.length === 1 ? '' : 's'}`, html: prop.length ? prop.slice(0, 8).map((q) => `$${nomMo(q.tipo, q.m, q.n)}$ (${f(q.fc / 1e9)} GHz)`).join(', ') + (prop.length > 8 ? ', …' : '') : 'La frecuencia está por debajo de la de corte del modo dominante.' });
    // GU-3: cerrar la guía con dos tapas la convierte en una cavidad de longitud d; resuenan p semilongitudes de onda guiada
    const dC = vacio(sc.lc) ? (propaga ? r.lg / 2 : null) : lee(sc, 'lc', 'la longitud de la cavidad (mm)') / 1000;
    if (dC) {
      const res = [1, 2, 3].map((p) => ({ p, f: (v / 2) * Math.sqrt((kc / Math.PI) ** 2 + (p / dC) ** 2) }));
      if (tipo === 'TM' && !circ) res.unshift({ p: 0, f: (v / 2) * (kc / Math.PI) });
      r.cavidad = { d: dC, res, geo: circ ? 'cil' : 'rect' };
      pasos.push({ t: 'De la guía a la cavidad', html: `Cerrar la guía con dos tapas conductoras a distancia $d = ${f(dC * 1000)} "mm"$${vacio(sc.lc) ? ' ($λ_g/2$)' : ''} da una cavidad: las ondas que van y vuelven forman una onda estacionaria cuando $d = p λ_g/2$, es decir $f = v/2 √((k_c/π)^2 + (p/d)^2)$. Resuena a ` + res.map((q) => `$${f(q.f / 1e9)} "GHz"$ ($"${tipo}"_{${m}${n}${q.p}}$)`).join(', ') + '. Con «Abrir en Cavidades» se llevan estos datos a esa herramienta.' });
    }
    r.pasos = pasos;
    return r;
  }

  // WR-90: guía de banda X (22,86 × 10,16 mm)
  const ejemplos = [
    { clave: 'wr90', nombre: 'WR-90 a 10 GHz: modo TE10', sc: { a: '22,86', b: '10,16', er: '1', f: '10', tipo: 'TE', m: '1', n: '0' } },
    { clave: 'wr90-te20', nombre: 'WR-90 a 10 GHz: modo TE20 (no se propaga)', sc: { a: '22,86', b: '10,16', er: '1', f: '10', tipo: 'TE', m: '2', n: '0' } },
    { clave: 'wr90-tm11', nombre: 'WR-90 a 18 GHz: modo TM11', sc: { a: '22,86', b: '10,16', er: '1', f: '18', tipo: 'TM', m: '1', n: '1' } },
    { clave: 'teflon', nombre: 'Guía de 15 × 7 mm rellena de teflón (εr = 2,1)', sc: { a: '15', b: '7', er: '2,1', f: '8', tipo: 'TE', m: '1', n: '0' } },
    { clave: 'microondas', nombre: 'Cavidad de microondas: guía de 86 × 43 mm a 2,45 GHz', sc: { a: '86', b: '43', er: '1', f: '2,45', tipo: 'TE', m: '1', n: '0' } },
    { clave: 'circular-te11', nombre: 'Guía circular de R = 10 mm a 10 GHz: modo TE11 (dominante)', sc: { forma: 'circ', R: '10', er: '1', f: '10', tipo: 'TE', m: '1', n: '1', lc: '' } },
    { clave: 'circular-tm01', nombre: 'Guía circular de R = 10 mm a 15 GHz: modo TM01', sc: { forma: 'circ', R: '10', er: '1', f: '15', tipo: 'TM', m: '0', n: '1', lc: '' } },
    { clave: 'cerrar-cavidad', nombre: 'WR-90 cerrada con una longitud de 30 mm: cavidad (GU-3)', sc: { forma: 'rect', a: '22,86', b: '10,16', er: '1', f: '10', tipo: 'TE', m: '1', n: '0', lc: '30' } },
  ];

  return { resolver, ejemplos, modos, campo, campoCirc, modosCirc, xCirc, f, nom, nomC };
})();
if (typeof module !== 'undefined') module.exports = GuiasOnda;
