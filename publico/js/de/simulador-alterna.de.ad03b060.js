const Alterna = (() => {
  const Z = (re, im = 0) => ({ re, im });
  const suma = (a, b) => Z(a.re + b.re, a.im + b.im);
  const mul = (a, b) => Z(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => { const m = b.re * b.re + b.im * b.im; return Z((a.re * b.re + a.im * b.im) / m, (a.im * b.re - a.re * b.im) / m); };
  const mod = (a) => Math.hypot(a.re, a.im), arg = (a) => Math.atan2(a.im, a.re);
  const polar = (r, fi) => Z(r * Math.cos(fi), r * Math.sin(fi));
  const GRAD = 180 / Math.PI;

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
  const bin = (z, d = 4) => {
    const re = Math.abs(z.re) < 1e-5 * (mod(z) || 1) ? 0 : z.re, im = Math.abs(z.im) < 1e-5 * (mod(z) || 1) ? 0 : z.im;
    if (!im) return f(re, d);
    const ji = `j${f(Math.abs(im), d)}`;
    return re ? `${f(re, d)} ${im < 0 ? '−' : '+'} ${ji}` : `${im < 0 ? '−' : ''}${ji}`;
  };
  const pol = (z, d = 4) => `${f(mod(z), d)}∠${ang(arg(z))}`;
  const ambos = (z, un) => `${bin(z)} ${un} = ${pol(z)} ${un}`;

  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom, { opcional = false, cero = false, base = 1 } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} fehlt`); }
    const v = Herramienta.leeSI(sc[k], base);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine Zahl sein`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss ${cero ? 'positiv oder null' : 'größer als 0'} sein`);
    return v;
  }

  function leeFase(sc, k, nom) {
    if (vacio(sc[k])) return 0;
    const v = Herramienta.leeSI(String(sc[k]).replace(/[°º]/g, ''));
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine Zahl sein (in Grad)`);
    return v / GRAD;
  }

  function circuito(sc) {
    const serie = sc.conexion !== 'paralelo', pico = sc.tipoV === 'pico', enW = sc.unidadF === 'w';
    const Vin = lee(sc, 'V', pico ? 'der Scheitelwert der Spannung' : 'die Spannung der Quelle'), V = pico ? Vin / Math.SQRT2 : Vin, faseV = leeFase(sc, 'faseV', 'die Phase der Spannung');
    const fin = lee(sc, 'f', enW ? 'die Kreisfrequenz' : 'la frecuencia'), fr = enW ? fin / (2 * Math.PI) : fin;
    const R = lee(sc, 'R', 'la resistencia', { opcional: true, cero: !serie }), L = lee(sc, 'L', 'la inductancia', { opcional: true, base: 1e-3 }), C = lee(sc, 'C', 'la capacidad', { opcional: true, base: 1e-6 });
    if (R === null && L === null && C === null) throw new Error('Gib mindestens ein Element an: R, L oder C');
    const w = 2 * Math.PI * fr, XL = L === null ? null : w * L, XC = C === null ? null : 1 / (w * C);
    const el = [];
    if (!serie && R === 0) throw new Error('Parallel schließt ein Widerstand von 0 Ω die Quelle kurz. Gibt es keinen Widerstand, lass R leer');
    if (R !== null) el.push({ k: 'R', nombre: 'Widerstand', Z: Z(R, 0) });
    if (L !== null) el.push({ k: 'L', nombre: 'Spule', Z: Z(0, XL) });
    if (C !== null) el.push({ k: 'C', nombre: 'Kondensator', Z: Z(0, -XC) });
    if (!el.length) throw new Error('Parallel schließt ein Widerstand von 0 Ω die Quelle kurz');
    const pasos = [];
    if (pico || faseV || enW) pasos.push({ t: 'La fuente', html: [pico ? `Effektivwert: V = V<sub>m</sub>/√2 = ${f(Vin)}/√2 = <b>${f(V)} V</b>` : '', enW ? `Frequenz: f = ω/(2π) = ${f(fin)}/(2π) = <b>${u(fr, 'Hz')}</b>` : '', `Zeiger der Spannung: V = <b>${f(V)}∠${ang(faseV)} V</b> (Effektivbetrag und Anfangsphase)`].filter(Boolean).join('<br>') });
    pasos.push({ t: 'Kreisfrequenz und Reaktanzen', html: `ω = 2πf = 2π·${f(fr)} = ${f(w)} rad/s${XL !== null ? `<br>X<sub>L</sub> = ωL = ${f(w)}·${f(L)} = <b>${u(XL, 'Ω')}</b>` : ''}${XC !== null ? `<br>X<sub>C</sub> = 1/(ωC) = 1/(${f(w)}·${f(C)}) = <b>${u(XC, 'Ω')}</b>` : ''}` });
    const Vf = polar(V, faseV);
    let Zt, I, partes;
    if (serie) {
      if (R === 0 && XL !== null && XC !== null && Math.abs(XL - XC) < 1e-12 * XL) throw new Error('Ohne Widerstand und in Resonanz ist die Impedanz 0: Der Strom wäre unendlich');
      Zt = el.reduce((s, e) => suma(s, e.Z), Z(0));
      if (mod(Zt) === 0) throw new Error('Die Gesamtimpedanz ist 0');
      pasos.push({ t: 'Impedanz in Reihe: Sie addieren sich', html: `Z = ${[R !== null ? 'R' : '', XL !== null ? 'jX<sub>L</sub>' : '', XC !== null ? '−jX<sub>C</sub>' : ''].filter(Boolean).join(' + ').replace('+ −', '− ')} = <b>${ambos(Zt, 'Ω')}</b><br>|Z| = √(R<sup>2</sup> + X<sup>2</sup>) = ${u(mod(Zt), 'Ω')}, &nbsp; φ = arctan(X/R) = ${ang(arg(Zt))}` });
      I = div(Vf, Zt);
      pasos.push({ t: 'Strom (Ohmsches Gesetz mit Zeigern)', html: `I = V / Z = ${pol(Vf)} / ${pol(Zt)} = <b>${ambos(I, 'A')}</b>` });
      partes = el.map((e) => ({ ...e, V: mul(I, e.Z), I }));
      pasos.push({ t: 'Spannung an jedem Element', html: partes.map((p) => `V<sub>${p.k}</sub> = I·Z<sub>${p.k}</sub> = ${pol(I)}·${pol(p.Z)} = <b>${ambos(p.V, 'V')}</b>`).join('<br>') + `<br>Als Zeiger addiert ergeben sie die der Quelle (${f(V)} V), auch wenn ihre Beträge sich zu ${f(partes.reduce((s, p) => s + mod(p.V), 0))} V summieren.` });
    } else {
      const Y = el.reduce((s, e) => suma(s, div(Z(1), e.Z)), Z(0));
      pasos.push({ t: 'Admittanz parallel: Die Kehrwerte werden addiert', html: `Y = ${el.map((e) => `1/Z<sub>${e.k}</sub>`).join(' + ')} = ${el.map((e) => bin(div(Z(1), e.Z))).join(' + ').replace(/\+ −/g, '− ')} = <b>${ambos(Y, 'S')}</b>` });
      if (mod(Y) < 1e-15) { Zt = Z(Infinity, 0); throw new Error('In Resonanz und ohne Widerstand ist die Admittanz 0: Die Impedanz der Parallelschaltung ist unendlich'); }
      Zt = div(Z(1), Y);
      pasos.push({ t: 'Ersatzimpedanz', html: `Z = 1/Y = <b>${ambos(Zt, 'Ω')}</b>` });
      I = mul(Vf, Y);
      partes = el.map((e) => ({ ...e, V: Vf, I: div(Vf, e.Z) }));
      pasos.push({ t: 'Strom in jedem Zweig', html: partes.map((p) => `I<sub>${p.k}</sub> = V / Z<sub>${p.k}</sub> = <b>${ambos(p.I, 'A')}</b>`).join('<br>') + `<br>Gesamt: I = ${partes.map((p) => `I<sub>${p.k}</sub>`).join(' + ')} = V·Y = <b>${ambos(I, 'A')}</b>` });
    }
    const S = mul(Vf, Z(I.re, -I.im)), P = S.re, Q = S.im, Sa = mod(S), fi = arg(Zt), fp = Math.cos(fi);
    const car = Math.abs(fi) < 1e-5 ? 'resistivo' : fi > 0 ? 'induktiv (der Strom eilt nach)' : 'kapazitiv (der Strom eilt vor)';
    pasos.push({ t: 'Leistungen', html: `P = V·I·cos φ = ${f(V)}·${f(mod(I))}·cos(${ang(fi)}) = <b>${u(P, 'W')}</b>${R ? ` (= I<sub>R</sub><sup>2</sup>R)` : ''}<br>Q = V·I·sin φ = <b>${u(Q, 'var')}</b><br>S = V·I = <b>${u(Sa, 'VA')}</b> &nbsp;(S<sup>2</sup> = P<sup>2</sup> + Q<sup>2</sup>)<br>Leistungsfaktor cos φ = <b>${f(fp)}</b>, ${car}` });
    let res = null;
    if (L !== null && C !== null) {
      const w0 = 1 / Math.sqrt(L * C), f0 = w0 / (2 * Math.PI);
      res = { w0, f0 };
      let h = `ω<sub>0</sub> = 1/√(LC) = ${f(w0)} rad/s ⇒ f<sub>0</sub> = <b>${u(f0, 'Hz')}</b>. Dort ist X<sub>L</sub> = X<sub>C</sub> = ${u(w0 * L, 'Ω')}`;
      if (serie && R) { res.Q = (w0 * L) / R; res.B = f0 / res.Q; h += `, die Impedanz ist minimal (Z = R) und der Strom maximal: I<sub>0</sub> = V/R = ${u(V / R, 'A')}.<br>Güte Q = ω<sub>0</sub>L/R = ${f(res.Q)}; Bandbreite Δf = f<sub>0</sub>/Q = ${u(res.B, 'Hz')}`; }
      else if (!serie) { h += ', die Admittanz ist minimal und der Strom, den die Quelle liefert, ebenfalls'; if (R) { res.Q = R / (w0 * L); h += `. Güte Q = R/(ω<sub>0</sub>L) = ${f(res.Q)}`; } }
      pasos.push({ t: 'Resonanz', html: h + `.<br>Jetzt gilt f ${Math.abs(fr - f0) < 1e-5 * f0 ? '= f<sub>0</sub>' : fr > f0 ? '&gt; f<sub>0</sub>' : '&lt; f<sub>0</sub>'}.` });
    }
    const vt = `v(t) = ${f(Math.SQRT2 * V)} sen(${f(w)} t ${arg(Vf) < -1e-9 ? '−' : '+'} ${ang(Math.abs(arg(Vf)))}) V`, it = `i(t) = ${f(Math.SQRT2 * mod(I))} sen(${f(w)} t ${arg(I) < -1e-9 ? '−' : '+'} ${ang(Math.abs(arg(I)))}) A`;
    pasos.push({ t: 'Momentanwerte', html: `Mit Scheitelwerten, die das √2-Fache der Effektivwerte betragen, und der Phase jedes Zeigers:<br><b>${vt}</b><br><b>${it}</b>` });
    return { serie, V, fr, w, R, L, C, XL, XC, Zt, I, partes, P, Q, S: Sa, fi, fp, res, pasos, Vf, vt, it };
  }

  function barrido(sol, n = 240) {
    const { serie, V, R, L, C } = sol, fc = sol.res ? sol.res.f0 : sol.fr, pts = [];
    for (let k = 0; k <= n; k++) {
      const fr = fc * 10 ** (-1 + (2 * k) / n), w = 2 * Math.PI * fr;
      let Zt;
      if (serie) Zt = Z(R || 0, (L !== null ? w * L : 0) - (C !== null ? 1 / (w * C) : 0));
      else { const Y = Z(R ? 1 / R : 0, (C !== null ? w * C : 0) - (L !== null ? 1 / (w * L) : 0)); Zt = div(Z(1), Y); }
      pts.push({ f: fr, Z: mod(Zt), I: V / mod(Zt) });
    }
    return pts;
  }

  const DATOS = { P: ['die Wirkleistung', 1e3, 'W'], S: ['die Scheinleistung', 1e3, 'VA'], I: ['la corriente', 1, 'A'], Q: ['die Blindleistung', 1e3, 'var'] };
  function correccion(sc) {
    const V = lee(sc, 'V', 'die Spannung'), fr = lee(sc, 'f', 'la frecuencia'), dato = DATOS[sc.dato] ? sc.dato : 'P', [nomD, baseD] = DATOS[dato], valor = lee(sc, 'P', nomD, { base: baseD });
    const fp1 = lee(sc, 'fp1', 'der anfängliche Leistungsfaktor'), fp2 = lee(sc, 'fp2', 'der gewünschte Leistungsfaktor'), capac = sc.carga === 'capacitiva';
    if (fp1 > 1 || fp2 > 1) throw new Error('Der Leistungsfaktor darf nicht größer als 1 sein');
    if (fp2 <= fp1) throw new Error('Der gewünschte Leistungsfaktor muss größer als der anfängliche sein');
    if (dato === 'Q' && fp1 === 1) throw new Error('Bei cos φ = 1 gibt es keine Blindleistung, von der man ausgehen könnte');
    const f1 = Math.acos(fp1), f2 = Math.acos(fp2);
    const P = dato === 'P' ? valor : dato === 'S' ? valor * fp1 : dato === 'I' ? V * valor * fp1 : valor / Math.tan(f1);
    const Q1 = P * Math.tan(f1), Q2 = P * Math.tan(f2), Qc = Q1 - Q2, w = 2 * Math.PI * fr, C = capac ? null : Qc / (w * V * V), L = capac ? (V * V) / (w * Qc) : null;
    const I1 = P / (V * fp1), I2 = P / (V * fp2);
    const pasos = [];
    if (dato !== 'P') pasos.push({ t: 'Wirkleistung', html: dato === 'S' ? `P = S·cos φ<sub>1</sub> = ${u(valor, 'VA')}·${f(fp1)} = <b>${u(P, 'W')}</b>` : dato === 'I' ? `P = V·I·cos φ<sub>1</sub> = ${f(V)}·${u(valor, 'A')}·${f(fp1)} = <b>${u(P, 'W')}</b>` : `P = Q/tan φ<sub>1</sub> = ${u(valor, 'var')}/${f(Math.tan(f1))} = <b>${u(P, 'W')}</b>` });
    pasos.push(
      { t: 'Vorher', html: `φ<sub>1</sub> = arccos(${f(fp1)}) = ${ang(f1)} ⇒ Q<sub>1</sub> = ${capac ? '−' : ''}P·tan φ<sub>1</sub> = ${capac ? '−' : ''}${u(P, 'W')}·${f(Math.tan(f1))} = <b>${capac ? '−' : ''}${u(Q1, 'var')}</b>; S<sub>1</sub> = ${u(P / fp1, 'VA')}, I<sub>1</sub> = P/(V cos φ<sub>1</sub>) = ${u(I1, 'A')}` },
      { t: 'Nachher', html: `φ<sub>2</sub> = arccos(${f(fp2)}) = ${ang(f2)} ⇒ Q<sub>2</sub> = ${capac ? '−' : ''}P·tan φ<sub>2</sub> = <b>${capac ? '−' : ''}${u(Q2, 'var')}</b>; S<sub>2</sub> = ${u(P / fp2, 'VA')}, I<sub>2</sub> = ${u(I2, 'A')}` },
      capac
        ? { t: 'Blindleistung der Spule', html: `Die Last ist kapazitiv (Q<sub>1</sub> = −${u(Q1, 'var')}): Um cos φ näher an 1 zu bringen, braucht es eine Spule, die Q<sub>L</sub> = P (tan φ<sub>1</sub> − tan φ<sub>2</sub>) = <b>${u(Qc, 'var')}</b> aufnimmt` }
        : { t: 'Blindleistung des Kondensators', html: `Q<sub>C</sub> = Q<sub>1</sub> − Q<sub>2</sub> = P (tan φ<sub>1</sub> − tan φ<sub>2</sub>) = <b>${u(Qc, 'var')}</b>` },
      capac
        ? { t: 'Induktivität (parallel zur Last)', html: `Q<sub>L</sub> = V<sup>2</sup> / (ω L) ⇒ L = V<sup>2</sup> / (ω Q<sub>L</sub>) = ${f(V)}<sup>2</sup> / (${f(w)}·${f(Qc)}) = <b>${u(L, 'H')}</b>` }
        : { t: 'Kapazität (parallel zur Last)', html: `Q<sub>C</sub> = V<sup>2</sup> ω C ⇒ C = Q<sub>C</sub> / (ω V<sup>2</sup>) = ${f(Qc)} / (${f(w)}·${f(V)}<sup>2</sup>) = <b>${u(C, 'F')}</b>` },
      { t: 'Was man gewinnt', html: `Die Wirkleistung ändert sich nicht, aber der Leitungsstrom sinkt von ${u(I1, 'A')} auf ${u(I2, 'A')} (um ${f(100 * (1 - I2 / I1), 3)} % weniger), und damit die Jouleschen Verluste in den Leitungen, die mit I<sup>2</sup> gehen.` },
    );
    return { V, fr, P, fp1, fp2, f1, f2, Q1: capac ? -Q1 : Q1, Q2: capac ? -Q2 : Q2, Qc, C, L, capac, I1, I2, pasos };
  }

  const TIPOS = { R: { nombre: 'Widerstand', letra: 'R', un: 'Ω' }, L: { nombre: 'Spule', letra: 'L', un: 'mH', base: 1e-3 }, C: { nombre: 'Kondensator', letra: 'C', un: 'μF', base: 1e-6 }, V: { nombre: 'Spannungsquelle', letra: 'E', un: 'V' }, I: { nombre: 'Stromquelle', letra: 'J', un: 'A' } };
  const nombres = (els) => { const c = {}; return els.map((e) => { const l = (TIPOS[e.t] || TIPOS.R).letra; c[l] = (c[l] || 0) + 1; return `${l}${c[l]}`; }); };
  const subN = (n) => n.replace(/^([A-Za-z])(\d+)$/, '$1<sub>$2</sub>');
  function gaussZ(A, b) {
    const n = b.length, M = A.map((fi, i) => [...fi, b[i]]), escala = Math.max(1e-300, ...A.flat().map(mod));
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (mod(M[r][c]) > mod(M[piv][c])) piv = r;
      if (mod(M[piv][c]) < 1e-12 * escala) return null;
      [M[c], M[piv]] = [M[piv], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const k = div(M[r][c], M[c][c]); if (mod(k)) for (let j = c; j <= n; j++) M[r][j] = suma(M[r][j], mul(Z(-k.re, -k.im), M[c][j])); }
    }
    return M.map((fi, i) => div(fi[n], fi[i]));
  }
  function red(sc) {
    const fr = lee(sc, 'f', 'la frecuencia'), w = 2 * Math.PI * fr, crudos = sc.elementos || [];
    if (!crudos.length) throw new Error('Füge mindestens ein Element hinzu');
    const nom = nombres(crudos);
    const els = crudos.map((e, i) => {
      const q = nom[i], T = TIPOS[e.t];
      if (!T) throw new Error(`${q}: unbekannter Typ`);
      const a = String(e.a ?? '').trim(), b = String(e.b ?? '').trim();
      if (!a || !b) throw new Error(`${q}: Die Knoten fehlen`);
      if (!/^[\wÀ-ÿ]{1,8}$/.test(a) || !/^[\wÀ-ÿ]{1,8}$/.test(b)) throw new Error(`${q}: Knoten werden mit Buchstaben oder Zahlen benannt (bis zu 8)`);
      if (a === b) throw new Error(`${q}: Es ist auf beiden Seiten mit demselben Knoten verbunden`);
      if (vacio(e.v)) throw new Error(`${q}: Der Wert fehlt`);
      const v = Herramienta.leeSI(e.v, T.base || 1);
      if (!isFinite(v)) throw new Error(`${q}: Der Wert muss eine Zahl sein`);
      if ('RLC'.includes(e.t) && v <= 0) throw new Error(`${q}: Der Wert muss größer als 0 sein`);
      const fase = 'VI'.includes(e.t) ? leeFase(e, 'fase', `die Phase von ${q}`) : 0;
      const Ze = e.t === 'R' ? Z(v, 0) : e.t === 'L' ? Z(0, w * v) : e.t === 'C' ? Z(0, -1 / (w * v)) : null;
      return { i, t: e.t, n: q, a, b, v, fase, Z: Ze, F: 'VI'.includes(e.t) ? polar(v, fase) : null };
    });
    const nudos = [...new Set(els.flatMap((e) => [e.a, e.b]))], ref = nudos.includes('0') ? '0' : nudos[0];
    const ady = {}; for (const e of els) { (ady[e.a] ||= []).push(e.b); (ady[e.b] ||= []).push(e.a); }
    const visto = new Set([nudos[0]]), pila = [nudos[0]];
    while (pila.length) for (const m of ady[pila.pop()]) if (!visto.has(m)) { visto.add(m); pila.push(m); }
    const sueltos = nudos.filter((n) => !visto.has(n));
    if (sueltos.length) throw new Error(`Die Schaltung ist getrennt: ${sueltos.join(', ')} sind nicht mit dem Rest verbunden`);
    const inc = nudos.filter((n) => n !== ref), fuentes = els.filter((e) => e.t === 'V'), N = inc.length + fuentes.length, k = (n) => inc.indexOf(n);
    const A = Array.from({ length: N }, () => Array.from({ length: N }, () => Z(0))), b = Array.from({ length: N }, () => Z(0));
    const mas = (i, j, z) => { A[i][j] = suma(A[i][j], z); };
    for (const e of els) {
      const ia = k(e.a), ib = k(e.b);
      if (e.Z) { const Y = div(Z(1), e.Z), mY = Z(-Y.re, -Y.im); if (ia >= 0) { mas(ia, ia, Y); if (ib >= 0) mas(ia, ib, mY); } if (ib >= 0) { mas(ib, ib, Y); if (ia >= 0) mas(ib, ia, mY); } }
      else if (e.t === 'I') { if (ia >= 0) b[ia] = suma(b[ia], Z(-e.F.re, -e.F.im)); if (ib >= 0) b[ib] = suma(b[ib], e.F); }
      else { const s2 = inc.length + fuentes.indexOf(e); if (ia >= 0) { mas(ia, s2, Z(1)); mas(s2, ia, Z(1)); } if (ib >= 0) { mas(ib, s2, Z(-1)); mas(s2, ib, Z(-1)); } b[s2] = e.F; }
    }
    const x = N ? gaussZ(A, b) : [];
    if (!x) throw new Error('Das System hat keine eindeutige Lösung: Prüfe, ob keine Spannungsquellen parallel oder in einer Schleife liegen, keine Stromquellen in Reihe liegen und kein Knoten nur Stromquellen hat');
    const V = Object.fromEntries(nudos.map((n) => [n, n === ref ? Z(0) : x[k(n)]]));
    const res = els.map((e) => {
      const U = suma(V[e.a], Z(-V[e.b].re, -V[e.b].im)), I = e.Z ? div(U, e.Z) : e.t === 'V' ? x[inc.length + fuentes.indexOf(e)] : e.F;
      const S = mul(U, Z(I.re, -I.im)); // absorbida: S = U·I*
      return { ...e, U, I, S };
    });
    const escala = Math.max(1e-300, ...res.map((x) => mod(x.S))), limpio = (v) => (Math.abs(v) < 1e-9 * escala ? 0 : v);
    for (const x of res) x.S = Z(limpio(x.S.re), limpio(x.S.im));
    const Vn = (n) => (n === ref ? '0' : `V<sub>${n}</sub>`), pasos = [];
    pasos.push({ t: 'Kreisfrequenz und Impedanzen', html: `ω = 2πf = ${f(w)} rad/s<br>${els.filter((e) => e.Z).map((e) => `Z<sub>${e.n}</sub> = ${e.t === 'R' ? 'R' : e.t === 'L' ? 'jωL' : '1/(jωC)'} = <b>${bin(e.Z)} Ω</b>`).join('<br>')}${els.some((e) => e.F) ? `<br>Quellen (Effektivwerte): ${els.filter((e) => e.F).map((e) => `${subN(e.n)} = ${pol(e.F)} ${e.t === 'V' ? 'V' : 'A'}`).join(', ')}` : ''}` });
    const ecs = inc.map((n) => {
      const t = [], rhs = [];
      for (const e of els) {
        if (e.a !== n && e.b !== n) continue;
        const otro = e.a === n ? e.b : e.a;
        if (e.Z) t.push(`+ ${otro === ref ? Vn(n) : `(${Vn(n)} − ${Vn(otro)})`}/Z<sub>${e.n}</sub>`);
        else if (e.t === 'V') t.push(`${e.a === n ? '+' : '−'} I<sub>${e.n}</sub>`);
        else rhs.push(`${e.a === n ? '−' : '+'} ${subN(e.n)}`);
      }
      return `Knoten ${n}: ${t.join(' ').replace(/^\+ /, '').replace(/^− /, '−') || '0'} = ${rhs.join(' ').replace(/^\+ /, '').replace(/^− /, '−') || '0'}`;
    });
    pasos.push({ t: 'Knoten (Bezug ' + ref + ') und erste Kirchhoffsche Regel mit Zeigern', html: ecs.join('<br>') + (fuentes.length ? '<br>' + fuentes.map((e) => `${subN(e.n)}: ${Vn(e.a)} − ${Vn(e.b)} = ${pol(e.F)}`.replace(/ − 0 =/, ' =')).join('<br>') : '') });
    if (N) {
      const mh = (M) => `<span class="mat"><span class="mat-in" style="grid-template-columns:repeat(${M[0].length}, auto)">${M.flat().map((v) => `<span>${v}</span>`).join('')}</span></span>`;
      pasos.push({ t: 'System mit komplexen Zahlen', html: `${mh(A.map((fi) => fi.map((z) => bin(z, 3))))} · ${mh([...inc.map((n) => [`V<sub>${n}</sub>`]), ...fuentes.map((e) => [`I<sub>${e.n}</sub>`])])} = ${mh(b.map((z) => [bin(z, 3)]))}` });
      pasos.push({ t: 'Lösung', html: [...inc.map((n) => `V<sub>${n}</sub> = <b>${pol(V[n])} V</b>`), ...fuentes.map((e) => `I<sub>${e.n}</sub> = <b>${pol(x[inc.length + fuentes.indexOf(e)])} A</b>`)].join('<br>') });
    }
    pasos.push({ t: 'Strom und Leistung jedes Elements (S = V·I*)', html: res.map((r) => `${subN(r.n)}: U = ${pol(r.U)} V, I = <b>${pol(r.I)} A</b> (von ${r.a} nach ${r.b}); ${r.Z ? `P = <b>${u(r.S.re, 'W')}</b>, Q = <b>${u(r.S.im, 'var')}</b>` : `P abgegeben = <b>${u(-r.S.re, 'W')}</b>, Q abgegeben = <b>${u(-r.S.im, 'var')}</b>${r.S.re > 0 ? ' (nimmt Wirkleistung auf)' : ''}`}`).join('<br>') });
    const fu = res.filter((r) => !r.Z).reduce((s2, r) => suma(s2, r.S), Z(0)), ca = res.filter((r) => r.Z).reduce((s2, r) => suma(s2, r.S), Z(0));
    const ok = mod(suma(fu, ca)) <= 1e-9 * Math.max(1, mod(ca));
    pasos.push({ t: 'Leistungsbilanz', html: `Die Quellen geben P = ${u(-fu.re, 'W')} und Q = ${u(-fu.im, 'var')} ab; die Widerstände verbrauchen ${u(ca.re, 'W')} und Spulen und Kondensatoren zusammen Q = ${u(ca.im, 'var')}. ${ok ? 'Sie stimmen überein, wie es sein muss (Boucherot).' : 'Sie stimmen nicht überein: Prüfe die Daten.'}` });
    return { fr, w, ref, nudos, V, els: res, P: ca.re, Q: ca.im, ok, pasos };
  }

  function trifasica(sc) {
    const VL = lee(sc, 'VL', 'die Leiterspannung'), fr = lee(sc, 'f', 'la frecuencia'), R = lee(sc, 'R', 'der Widerstand jeder Phase', { cero: true });
    if (vacio(sc.X)) throw new Error('Die Reaktanz jeder Phase fehlt (0, wenn sie rein ohmsch ist)');
    const X = Herramienta.leeSI(sc.X);
    if (!isFinite(X)) throw new Error('Die Reaktanz muss eine Zahl sein');
    const Zf = Z(R, X);
    if (!mod(Zf)) throw new Error('Die Impedanz jeder Phase darf nicht 0 sein');
    const est = sc.conexion !== 'triangulo', w = 2 * Math.PI * fr, s3 = Math.sqrt(3), fi = arg(Zf), fp = Math.cos(fi);
    const Vf = est ? VL / s3 : VL, If = Vf / mod(Zf), IL = est ? If : s3 * If;
    const P = 3 * Vf * If * fp, Q = 3 * Vf * If * Math.sin(fi), S = 3 * Vf * If;
    const fases = ['R', 'S', 'T'].map((q, k) => ({ q, Vs: polar(VL / s3, (-2 * Math.PI * k) / 3), Vc: polar(VL, (-2 * Math.PI * k) / 3 + Math.PI / 6) }));
    for (const p of fases) { p.Vf = est ? p.Vs : p.Vc; p.If = div(p.Vf, Zf); p.IL = est ? p.If : div(p.Vs, div(Zf, Z(3))); }
    const car = Math.abs(fi) < 1e-5 ? 'resistiva' : fi > 0 ? 'inductiva' : 'capacitiva';
    const pasos = [
      { t: 'Impedanz jeder Phase', html: `Z = R + jX = <b>${ambos(Zf, 'Ω')}</b>: ${car} Last, mit cos φ = <b>${f(fp)}</b>` },
      { t: est ? 'Last in Sternschaltung' : 'Last in Dreieckschaltung', html: est ? `Jede Phase liegt zwischen einem Außenleiter und dem Neutralleiter: V<sub>Phase</sub> = V<sub>L</sub>/√3 = ${f(VL)}/√3 = <b>${f(Vf)} V</b>; I<sub>Phase</sub> = V<sub>Phase</sub>/|Z| = <b>${u(If, 'A')}</b>, und der Leiterstrom ist derselbe: I<sub>L</sub> = <b>${u(IL, 'A')}</b>` : `Jede Phase liegt zwischen zwei Außenleitern: V<sub>Phase</sub> = V<sub>L</sub> = <b>${f(Vf)} V</b>; I<sub>Phase</sub> = V<sub>L</sub>/|Z| = <b>${u(If, 'A')}</b>, und der Leiterstrom ist √3-mal größer: I<sub>L</sub> = √3·I<sub>Phase</sub> = <b>${u(IL, 'A')}</b>` },
      { t: 'Zeiger (Mitsystem R, S, T)', html: fases.map((p) => `V<sub>${p.q}N</sub> = ${pol(p.Vs)} V, &nbsp; ${est ? `I<sub>${p.q}</sub> = ${pol(p.IL)} A` : `I<sub>${p.q}${'RST'['RST'.indexOf(p.q) + 1] || 'R'}</sub> = ${pol(p.If)} A, &nbsp; I<sub>${p.q}</sub> = ${pol(p.IL)} A`}`).join('<br>') + `<br>Die verketteten Spannungen eilen den Strangspannungen um 30° voraus (V<sub>RS</sub> = ${pol(fases[0].Vc)} V)${est ? ', und der Neutralleiter führt keinen Strom, weil die Last symmetrisch ist' : ''}.` },
      { t: 'Leistungen', html: `P = √3·V<sub>L</sub>·I<sub>L</sub>·cos φ = 3·V<sub>Phase</sub>·I<sub>Phase</sub>·cos φ = <b>${u(P, 'W')}</b><br>Q = √3·V<sub>L</sub>·I<sub>L</sub>·sin φ = <b>${u(Q, 'var')}</b><br>S = √3·V<sub>L</sub>·I<sub>L</sub> = <b>${u(S, 'VA')}</b>` },
    ];
    let corr = null;
    if (!vacio(sc.fp2)) {
      const fp2 = Herramienta.leeSI(sc.fp2);
      if (!(fp2 > 0 && fp2 <= 1)) throw new Error('Der gewünschte Leistungsfaktor muss zwischen 0 und 1 liegen');
      if (fi <= 0) throw new Error('Die Last ist nicht induktiv: Sie wird nicht mit Kondensatoren kompensiert');
      if (fp2 <= fp) throw new Error('Der gewünschte Leistungsfaktor muss größer als der der Last sein');
      const Qc = P * (Math.tan(fi) - Math.tan(Math.acos(fp2))), Cy = Qc / 3 / (w * (VL / s3) ** 2), Cd = Qc / 3 / (w * VL * VL), IL2 = P / (s3 * VL * fp2);
      corr = { fp2, Qc, Cy, Cd, IL2 };
      pasos.push({ t: 'Kondensatorbatterie', html: `Q<sub>C</sub> = P (tan φ<sub>1</sub> − tan φ<sub>2</sub>) = <b>${u(Qc, 'var')}</b>, ein Drittel pro Phase.<br>In Sternschaltung (an V<sub>L</sub>/√3): C = Q<sub>C</sub>/(3ω(V<sub>L</sub>/√3)<sup>2</sup>) = <b>${u(Cy, 'F')}</b> pro Phase<br>In Dreieckschaltung (an V<sub>L</sub>): C = Q<sub>C</sub>/(3ωV<sub>L</sub><sup>2</sup>) = <b>${u(Cd, 'F')}</b> pro Phase, dreimal weniger<br>Der Leiterstrom sinkt von ${u(IL, 'A')} auf ${u(IL2, 'A')}.` });
    }
    return { VL, fr, w, est, Zf, fi, fp, Vf, If, IL, P, Q, S, fases, corr, pasos };
  }

  const ejemplos = [
    { clave: 'rlc-serie', nombre: 'RLC en serie a 50 Hz', sc: { modo: 'circuito', conexion: 'serie', V: '230', f: '50', R: '40', L: '200', C: '100' } },
    { clave: 'resonancia', nombre: 'Reihen-RLC in Resonanz', sc: { modo: 'circuito', conexion: 'serie', V: '10', f: '159.1549', R: '10', L: '100', C: '10' } },
    { clave: 'rl', nombre: 'Reale Spule (R und L in Reihe)', sc: { modo: 'circuito', conexion: 'serie', V: '230', f: '50', R: '30', L: '127.32', C: '' } },
    { clave: 'rc', nombre: 'RC-Filter in Reihe bei 1 kHz', sc: { modo: 'circuito', conexion: 'serie', V: '5', f: '1000', R: '1000', L: '', C: '0.159' } },
    { clave: 'paralelo', nombre: 'RLC en paralelo', sc: { modo: 'circuito', conexion: 'paralelo', V: '120', f: '60', R: '60', L: '159.2', C: '22.1' } },
    { clave: 'fp', nombre: 'Leistungsfaktor eines Motors verbessern', sc: { modo: 'correccion', V: '400', f: '50', dato: 'P', P: '10', fp1: '0.7', fp2: '0.95', carga: 'inductiva' } },
    { clave: 'fuente-pico', nombre: 'Quelle mit Scheitelwert, Phase und ω angegeben', sc: { modo: 'circuito', conexion: 'serie', V: '325', tipoV: 'pico', faseV: '30', f: '314.16', unidadF: 'w', R: '20', L: '50', C: '' } },
    { clave: 'fp-capacitiva', nombre: 'Eine kapazitive Last mit einer Spule kompensieren', sc: { modo: 'correccion', V: '230', f: '50', dato: 'S', P: '5', fp1: '0.8', fp2: '0.95', carga: 'capacitiva' } },
    { clave: 'red-bobina-real', nombre: 'Schaltung: reale Spule parallel zu einem Kondensator', sc: { modo: 'red', f: '50', elementos: [{ t: 'V', a: 'a', b: '0', v: '230', fase: '0' }, { t: 'R', a: 'a', b: 'b', v: '10' }, { t: 'L', a: 'b', b: '0', v: '100' }, { t: 'C', a: 'a', b: '0', v: '50' }] } },
    { clave: 'red-dos-fuentes', nombre: 'Schaltung mit zwei phasenverschobenen Quellen', sc: { modo: 'red', f: '50', elementos: [{ t: 'V', a: 'a', b: '0', v: '100', fase: '0' }, { t: 'R', a: 'a', b: 'b', v: '5' }, { t: 'C', a: 'b', b: '0', v: '318.3' }, { t: 'L', a: 'b', b: 'c', v: '15.92' }, { t: 'V', a: 'c', b: '0', v: '50', fase: '90' }] } },
    { clave: 'trifasica-estrella', nombre: 'Dreiphasig: Motor in Sternschaltung bei 400 V', sc: { modo: 'trifasica', VL: '400', f: '50', conexion: 'estrella', R: '8', X: '6', fp2: '' } },
    { clave: 'trifasica-triangulo', nombre: 'Dreiphasig: Last in Dreieckschaltung und Kondensatorbatterie', sc: { modo: 'trifasica', VL: '400', f: '50', conexion: 'triangulo', R: '30', X: '40', fp2: '0.95' } },
  ];

  return { circuito, correccion, red, trifasica, barrido, nombres, TIPOS, ejemplos, Z, mod, arg, polar, mul, div, suma, f, u, bin, pol, ang, GRAD };
})();

