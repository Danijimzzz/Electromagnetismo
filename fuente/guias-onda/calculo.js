/* =====================================================================
   Cálculo de las guías de onda rectangulares (sin DOM). La interfaz está en app.js y la
   prueba en pruebas/herramientas/guias-onda.js.
     resolver(sc)  { a, b (mm), er, f (GHz), tipo ('TE'|'TM'), m, n } (texto) → modo pedido (frecuencia y
                   longitud de onda de corte, β, λg, velocidades, impedancia o atenuación), modos que
                   se propagan, banda monomodo y pasos; lanza un Error con un mensaje para el usuario
     modos(a, b, v)  todos los modos TE y TM hasta orden 8, ordenados por frecuencia de corte
     campo(tipo, m, n, a, b, x, y)  componentes transversales (Ex, Ey) del modo, sin escala
     ejemplos      [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
   Constantes: c = 299 792 458 m/s y η₀ = 376,730313 Ω.
   ===================================================================== */
const GuiasOnda = (() => {
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

  function resolver(sc) {
    const a = lee(sc, 'a', 'el lado a') / 1000, b = lee(sc, 'b', 'el lado b') / 1000, er = lee(sc, 'er', 'εr'), F = lee(sc, 'f', 'la frecuencia') * 1e9;
    const tipo = sc.tipo === 'TM' ? 'TM' : 'TE', m = entero(sc, 'm', 'm'), n = entero(sc, 'n', 'n');
    if (!m && !n) throw new Error('m y n no pueden ser los dos 0');
    if (tipo === 'TM' && (!m || !n)) throw new Error('En los modos TM, m y n tienen que ser al menos 1');
    const v = C0 / Math.sqrt(er), eta = ETA0 / Math.sqrt(er), lam = v / F, k = 2 * Math.PI / lam;
    const fc = fcorte(a, b, v, m, n), kc = 2 * Math.PI * fc / v, lc = v / fc, ratio = fc / F, propaga = F > fc;
    const lista = modos(a, b, v), prop = lista.filter((q) => q.fc < F), fc1 = lista[0], seg = lista.find((q) => q.fc > fc1.fc * (1 + 1e-9));
    const r = { a, b, er, F, tipo, m, n, v, eta, lam, k, fc, kc, lc, propaga, modos: prop, dominante: fc1, banda: [fc1.fc, seg.fc], lista };
    const pasos = [
      { t: 'Datos', html: `$a = ${f(a * 1000)} "mm"$, $b = ${f(b * 1000)} "mm"$, $ε_r = ${f(er)}$, $f = ${f(F / 1e9)} "GHz"$. Modo ${nomMates(tipo, m, n)}.` },
      { t: 'Velocidad y longitud de onda en el relleno', html: `$v = c/√(ε_r) = ${f(v)} "m/s"$, $λ = v/f = ${f(lam * 1000)} "mm"$, $η = {η_0}/√(ε_r) = ${f(eta)} "Ω"$` },
      { t: 'Frecuencia de corte', html: `$f_c = v/2 √({(m/a)^2 + (n/b)^2}) = ${f(v / 2)}·√({(${m}/${f(a)})^2 + (${n}/${f(b)})^2}) = ${f(fc / 1e9)} "GHz"$, y $λ_c = v/f_c = ${f(lc * 1000)} "mm"$` },
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
      { t: 'Modo dominante y banda monomodo', html: `El modo de menor $f_c$ es el ${nomMates(fc1.tipo, fc1.m, fc1.n)}, con $f_c = ${f(f1 / 1e9)} "GHz"$; el siguiente es el ${nomMates(seg.tipo, seg.m, seg.n)}, con ${f(f2 / 1e9)} GHz. Solo se propaga el dominante entre ${f(f1 / 1e9)} y ${f(f2 / 1e9)} GHz.` },
      { t: `A ${f(F / 1e9)} GHz se propagan ${prop.length ? prop.length : 'ningún'} modo${prop.length === 1 ? '' : 's'}`, html: prop.length ? prop.slice(0, 8).map((q) => `$${nomMates(q.tipo, q.m, q.n)}$ (${f(q.fc / 1e9)} GHz)`).join(', ') + (prop.length > 8 ? ', …' : '') : 'La frecuencia está por debajo de la de corte del modo dominante.' });
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
  ];

  return { resolver, ejemplos, modos, campo, f, nom };
})();
if (typeof module !== 'undefined') module.exports = GuiasOnda;
