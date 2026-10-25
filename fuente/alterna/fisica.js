/* =====================================================================
   Corriente alterna y fasores (sin DOM): circuitos RLC en serie y en
   paralelo con impedancias complejas, fasores de tensión y corriente,
   potencias activa, reactiva y aparente, factor de potencia, resonancia
   y corrección del factor de potencia con un condensador.
   Notación de electrotecnia: j es la unidad imaginaria, valores eficaces.
   ===================================================================== */
const Alterna = (() => {
  /* ---------- Complejos en coma flotante ---------- */
  const Z = (re, im = 0) => ({ re, im });
  const suma = (a, b) => Z(a.re + b.re, a.im + b.im);
  const mul = (a, b) => Z(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const m = b.re * b.re + b.im * b.im; return Z((a.re * b.re + a.im * b.im) / m, (a.im * b.re - a.re * b.im) / m); };
  const mod = (a) => Math.hypot(a.re, a.im), arg = (a) => Math.atan2(a.im, a.re);
  const polar = (r, fi) => Z(r * Math.cos(fi), r * Math.sin(fi));
  const GRAD = 180 / Math.PI;

  /* ---------- Formato ---------- */
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const PREF = [[1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n'], [1e-12, 'p']];
  const u = (x, un, d = 4) => {
    if (!isFinite(x)) return `${f(x)} ${un}`;
    if (x === 0) return `0 ${un}`;
    const a = Math.abs(x), p = PREF.find(([v]) => a >= v * 0.9999999) || PREF[PREF.length - 1];
    return `${String(+(x / p[0]).toPrecision(d)).replace('.', ',').replace('-', '−')} ${p[1]}${un}`;
  };
  const ang = (fi) => `${f(Math.abs(fi) < 1e-5 ? 0 : fi * GRAD, 4)}°`;
  // binómica con j: 3 + j4, 3 − j4, j4, −j4
  const bin = (z, d = 4) => {
    const re = Math.abs(z.re) < 1e-5 * (mod(z) || 1) ? 0 : z.re, im = Math.abs(z.im) < 1e-5 * (mod(z) || 1) ? 0 : z.im;
    if (!im) return f(re, d);
    const ji = `j${f(Math.abs(im), d)}`;
    return re ? `${f(re, d)} ${im < 0 ? '−' : '+'} ${ji}` : `${im < 0 ? '−' : ''}${ji}`;
  };
  const pol = (z, d = 4) => `${f(mod(z), d)}∠${ang(arg(z))}`;
  const ambos = (z, un) => `${bin(z)} ${un} = ${pol(z)} ${un}`;

  // con prefijo (4k7, 100n, 10m) o unidad el valor va en unidades del SI; un número solo, en las del campo (base)
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom, { opcional = false, cero = false, base = 1 } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = Herramienta.leeSI(sc[k], base);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    return v;
  }

  /* ---------- Circuito RLC ---------- */
  // sc: { conexion: 'serie'|'paralelo', V (V eficaces), f (Hz), R (Ω), L (mH), C (μF) }; R, L y C vacíos = no están
  function circuito(sc) {
    const serie = sc.conexion !== 'paralelo';
    const V = lee(sc, 'V', 'la tensión de la fuente'), fr = lee(sc, 'f', 'la frecuencia');
    const R = lee(sc, 'R', 'la resistencia', { opcional: true, cero: !serie }), L = lee(sc, 'L', 'la inductancia', { opcional: true, base: 1e-3 }), C = lee(sc, 'C', 'la capacidad', { opcional: true, base: 1e-6 });
    if (R === null && L === null && C === null) throw new Error('Pon al menos un elemento: R, L o C');
    const w = 2 * Math.PI * fr, XL = L === null ? null : w * L, XC = C === null ? null : 1 / (w * C);
    const el = [];
    if (!serie && R === 0) throw new Error('En paralelo, una resistencia de 0 Ω cortocircuita la fuente. Si no hay resistencia, deja R vacía');
    if (R !== null) el.push({ k: 'R', nombre: 'Resistencia', Z: Z(R, 0) });
    if (L !== null) el.push({ k: 'L', nombre: 'Bobina', Z: Z(0, XL) });
    if (C !== null) el.push({ k: 'C', nombre: 'Condensador', Z: Z(0, -XC) });
    if (!el.length) throw new Error('En paralelo, una resistencia de 0 Ω cortocircuita la fuente');
    const pasos = [];
    pasos.push({ t: 'Pulsación y reactancias', html: `ω = 2πf = 2π·${f(fr)} = ${f(w)} rad/s${XL !== null ? `<br>X<sub>L</sub> = ωL = ${f(w)}·${f(L)} = <b>${u(XL, 'Ω')}</b>` : ''}${XC !== null ? `<br>X<sub>C</sub> = 1/(ωC) = 1/(${f(w)}·${f(C)}) = <b>${u(XC, 'Ω')}</b>` : ''}` });
    const Vf = Z(V, 0);
    let Zt, I, partes;
    if (serie) {
      if (R === 0 && XL !== null && XC !== null && Math.abs(XL - XC) < 1e-12 * XL) throw new Error('Sin resistencia y en resonancia la impedancia es 0: la corriente sería infinita');
      Zt = el.reduce((s, e) => suma(s, e.Z), Z(0));
      if (mod(Zt) === 0) throw new Error('La impedancia total es 0');
      pasos.push({ t: 'Impedancia en serie: se suman', html: `Z = ${[R !== null ? 'R' : '', XL !== null ? 'jX<sub>L</sub>' : '', XC !== null ? '−jX<sub>C</sub>' : ''].filter(Boolean).join(' + ').replace('+ −', '− ')} = <b>${ambos(Zt, 'Ω')}</b><br>|Z| = √(R<sup>2</sup> + X<sup>2</sup>) = ${u(mod(Zt), 'Ω')}, &nbsp; φ = arctg(X/R) = ${ang(arg(Zt))}` });
      I = div(Vf, Zt);
      pasos.push({ t: 'Corriente (Ley de Ohm con fasores)', html: `I = V / Z = ${f(V)}∠0° / ${pol(Zt)} = <b>${ambos(I, 'A')}</b>` });
      partes = el.map((e) => ({ ...e, V: mul(I, e.Z), I }));
      pasos.push({ t: 'Tensión en cada elemento', html: partes.map((p) => `V<sub>${p.k}</sub> = I·Z<sub>${p.k}</sub> = ${pol(I)}·${pol(p.Z)} = <b>${ambos(p.V, 'V')}</b>`).join('<br>') + `<br>Sumadas como fasores dan la de la fuente (${f(V)} V), aunque sus módulos sumen ${f(partes.reduce((s, p) => s + mod(p.V), 0))} V.` });
    } else {
      const Y = el.reduce((s, e) => suma(s, div(Z(1), e.Z)), Z(0));
      pasos.push({ t: 'Admitancia en paralelo: se suman las inversas', html: `Y = ${el.map((e) => `1/Z<sub>${e.k}</sub>`).join(' + ')} = ${el.map((e) => bin(div(Z(1), e.Z))).join(' + ').replace(/\+ −/g, '− ')} = <b>${ambos(Y, 'S')}</b>` });
      if (mod(Y) < 1e-15) { Zt = Z(Infinity, 0); throw new Error('En resonancia y sin resistencia, la admitancia es 0: la impedancia del paralelo es infinita'); }
      Zt = div(Z(1), Y);
      pasos.push({ t: 'Impedancia equivalente', html: `Z = 1/Y = <b>${ambos(Zt, 'Ω')}</b>` });
      I = mul(Vf, Y);
      partes = el.map((e) => ({ ...e, V: Vf, I: div(Vf, e.Z) }));
      pasos.push({ t: 'Corriente en cada rama', html: partes.map((p) => `I<sub>${p.k}</sub> = V / Z<sub>${p.k}</sub> = <b>${ambos(p.I, 'A')}</b>`).join('<br>') + `<br>Total: I = ${partes.map((p) => `I<sub>${p.k}</sub>`).join(' + ')} = V·Y = <b>${ambos(I, 'A')}</b>` });
    }
    // potencias: S = V·I*
    const S = mul(Vf, Z(I.re, -I.im)), P = S.re, Q = S.im, Sa = mod(S), fi = arg(Zt), fp = Math.cos(fi);
    const car = Math.abs(fi) < 1e-5 ? 'resistivo' : fi > 0 ? 'inductivo (la corriente va retrasada)' : 'capacitivo (la corriente va adelantada)';
    pasos.push({ t: 'Potencias', html: `P = V·I·cos φ = ${f(V)}·${f(mod(I))}·cos(${ang(fi)}) = <b>${u(P, 'W')}</b>${R ? ` (= I<sub>R</sub><sup>2</sup>R)` : ''}<br>Q = V·I·sen φ = <b>${u(Q, 'var')}</b><br>S = V·I = <b>${u(Sa, 'VA')}</b> &nbsp;(S<sup>2</sup> = P<sup>2</sup> + Q<sup>2</sup>)<br>Factor de potencia cos φ = <b>${f(fp)}</b>, ${car}` });
    // resonancia
    let res = null;
    if (L !== null && C !== null) {
      const w0 = 1 / Math.sqrt(L * C), f0 = w0 / (2 * Math.PI);
      res = { w0, f0 };
      let h = `ω<sub>0</sub> = 1/√(LC) = ${f(w0)} rad/s ⇒ f<sub>0</sub> = <b>${u(f0, 'Hz')}</b>. Ahí X<sub>L</sub> = X<sub>C</sub> = ${u(w0 * L, 'Ω')}`;
      if (serie && R) { res.Q = (w0 * L) / R; res.B = f0 / res.Q; h += `, la impedancia es mínima (Z = R) y la corriente máxima: I<sub>0</sub> = V/R = ${u(V / R, 'A')}.<br>Factor de calidad Q = ω<sub>0</sub>L/R = ${f(res.Q)}; ancho de banda Δf = f<sub>0</sub>/Q = ${u(res.B, 'Hz')}`; }
      else if (!serie) { h += ', la admitancia es mínima y la corriente que da la fuente también'; if (R) { res.Q = R / (w0 * L); h += `. Factor de calidad Q = R/(ω<sub>0</sub>L) = ${f(res.Q)}`; } }
      pasos.push({ t: 'Resonancia', html: h + `.<br>Ahora f ${Math.abs(fr - f0) < 1e-5 * f0 ? '= f<sub>0</sub>' : fr > f0 ? '&gt; f<sub>0</sub>' : '&lt; f<sub>0</sub>'}.` });
    }
    return { serie, V, fr, w, R, L, C, XL, XC, Zt, I, partes, P, Q, S: Sa, fi, fp, res, pasos, Vf };
  }

  /* ---------- Corrección del factor de potencia ---------- */
  // sc: { V, f, P (kW), fp1, fp2 }
  function correccion(sc) {
    const V = lee(sc, 'V', 'la tensión'), fr = lee(sc, 'f', 'la frecuencia'), P = lee(sc, 'P', 'la potencia activa', { base: 1e3 });
    const fp1 = lee(sc, 'fp1', 'el factor de potencia inicial'), fp2 = lee(sc, 'fp2', 'el factor de potencia deseado');
    if (fp1 > 1 || fp2 > 1) throw new Error('El factor de potencia no puede ser mayor que 1');
    if (fp2 <= fp1) throw new Error('El factor de potencia deseado tiene que ser mayor que el inicial');
    const f1 = Math.acos(fp1), f2 = Math.acos(fp2), Q1 = P * Math.tan(f1), Q2 = P * Math.tan(f2), Qc = Q1 - Q2, w = 2 * Math.PI * fr, C = Qc / (w * V * V);
    const I1 = P / (V * fp1), I2 = P / (V * fp2);
    const pasos = [
      { t: 'Antes', html: `φ<sub>1</sub> = arccos(${f(fp1)}) = ${ang(f1)} ⇒ Q<sub>1</sub> = P·tg φ<sub>1</sub> = ${u(P, 'W')}·${f(Math.tan(f1))} = <b>${u(Q1, 'var')}</b>; S<sub>1</sub> = ${u(P / fp1, 'VA')}, I<sub>1</sub> = P/(V cos φ<sub>1</sub>) = ${u(I1, 'A')}` },
      { t: 'Después', html: `φ<sub>2</sub> = arccos(${f(fp2)}) = ${ang(f2)} ⇒ Q<sub>2</sub> = P·tg φ<sub>2</sub> = <b>${u(Q2, 'var')}</b>; S<sub>2</sub> = ${u(P / fp2, 'VA')}, I<sub>2</sub> = ${u(I2, 'A')}` },
      { t: 'Potencia reactiva del condensador', html: `Q<sub>C</sub> = Q<sub>1</sub> − Q<sub>2</sub> = P (tg φ<sub>1</sub> − tg φ<sub>2</sub>) = <b>${u(Qc, 'var')}</b>` },
      { t: 'Capacidad (en paralelo con la carga)', html: `Q<sub>C</sub> = V<sup>2</sup> ω C ⇒ C = Q<sub>C</sub> / (ω V<sup>2</sup>) = ${f(Qc)} / (${f(w)}·${f(V)}<sup>2</sup>) = <b>${u(C, 'F')}</b>` },
      { t: 'Qué se gana', html: `La potencia activa no cambia, pero la corriente de la línea baja de ${u(I1, 'A')} a ${u(I2, 'A')} (un ${f(100 * (1 - I2 / I1), 3)} % menos), y con ella las pérdidas por efecto Joule en los cables, que van con I<sup>2</sup>.` },
    ];
    return { V, fr, P, fp1, fp2, f1, f2, Q1, Q2, Qc, C, I1, I2, pasos };
  }

  const ejemplos = [
    { clave: 'rlc-serie', nombre: 'RLC en serie a 50 Hz', sc: { modo: 'circuito', conexion: 'serie', V: '230', f: '50', R: '40', L: '200', C: '100' } },
    { clave: 'resonancia', nombre: 'RLC en serie en resonancia', sc: { modo: 'circuito', conexion: 'serie', V: '10', f: '159.1549', R: '10', L: '100', C: '10' } },
    { clave: 'rl', nombre: 'Bobina real (R y L en serie)', sc: { modo: 'circuito', conexion: 'serie', V: '230', f: '50', R: '30', L: '127.32', C: '' } },
    { clave: 'rc', nombre: 'Filtro RC en serie a 1 kHz', sc: { modo: 'circuito', conexion: 'serie', V: '5', f: '1000', R: '1000', L: '', C: '0.159' } },
    { clave: 'paralelo', nombre: 'RLC en paralelo', sc: { modo: 'circuito', conexion: 'paralelo', V: '120', f: '60', R: '60', L: '159.2', C: '22.1' } },
    { clave: 'fp', nombre: 'Corregir el factor de potencia de un motor', sc: { modo: 'correccion', V: '400', f: '50', P: '10', fp1: '0.7', fp2: '0.95' } },
  ];

  return { circuito, correccion, ejemplos, Z, mod, arg, polar, mul, div, suma, f, u, bin, pol, ang, GRAD };
})();
if (typeof module !== 'undefined') module.exports = Alterna;
