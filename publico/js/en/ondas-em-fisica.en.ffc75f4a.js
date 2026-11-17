const OndasEM = (() => {
  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const C0 = SI.c, MU0 = 1.25663706212e-6, EPS0 = 8.8541878128e-12;
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−').replace(/^(−?)1·10/, '$110');
  };
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/^(-?)10\^/, '$11e').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Missing ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} must be a number (3e8 or 3·10^8 is accepted)`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${may(nom)} must be ${cero ? 'positive or zero' : 'greater than 0'}`);
    return v;
  }

  const EJES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const GORRO = { x: 'î', y: 'ĵ', z: 'k̂' };
  const dir = (s) => { const m = /^([+-]?)([xyz])$/.exec(s || ''); if (!m) throw new Error('Invalid direction'); const e = EJES[m[2]].map((c) => (m[1] === '-' ? -c : c)); return { v: e, eje: m[2], signo: m[1] === '-' ? -1 : 1 }; };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nomDir = (v) => { const i = v.findIndex((c) => Math.abs(c) > 0.5); return `${v[i] < 0 ? '−' : ''}${GORRO['xyz'[i]]}`; };
  const unit = (v) => { const n = Math.hypot(...v); return v.map((c) => (Math.abs(c / n) < 1e-12 ? 0 : c / n)); };
  const enEje = (v) => v.filter((c) => Math.abs(c) > 1e-12).length === 1;
  const vecTxt = (v) => (enEje(v) ? nomDir(v) : `(${v.map((c, i) => (Math.abs(c) < 1e-12 ? '' : `${c < 0 ? '− ' : '+ '}${f(Math.abs(c))} ${GORRO['xyz'[i]]}`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−')})`);
  const dirExp = (v) => { const t = vecTxt(v); return t[0] === '−' ? `(${t})` : t; };
  const dirTxt = (v) => (enEje(v) ? (() => { const i = v.findIndex((c) => Math.abs(c) > 0.5); return `${v[i] < 0 ? '−' : '+'}${'xyz'[i]}`; })() : vecTxt(v));
  function vecDe(sc, k, p, nom) {
    if (sc[k] !== 'otra') { const d = dir(sc[k]); return { v: d.v, eje: d.eje, signo: d.signo }; }
    const v = ['x', 'y', 'z'].map((e) => { const x = leeNum(vacio(sc[p + e]) ? '0' : sc[p + e]); if (!isFinite(x)) throw new Error(`The ${e} component of ${nom} must be a number`); return x; });
    if (!(Math.hypot(...v) > 0)) throw new Error(`Enter some component of ${nom}`);
    const u = unit(v), i = u.findIndex((c) => Math.abs(c) > 1 - 1e-12);
    return { v: u, eje: i >= 0 ? 'xyz'[i] : null, signo: i >= 0 ? Math.sign(u[i]) : 1 };
  }
  const kr = (kv, k) => kv.map((c, i) => (Math.abs(c) < 1e-12 ? '' : `${c < 0 ? '− ' : '+ '}${f(Math.abs(c * k))}${'xyz'[i]}`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−');

  const COLORES = [[380, 'violeta'], [450, 'azul'], [495, 'verde'], [570, 'amarillo'], [590, 'naranja'], [620, 'rojo'], [750, '']];
  function banda(fr) {
    const l = C0 / fr;
    if (l > 1) return 'radio waves';
    if (l > 1e-3) return 'microondas';
    if (l > 750e-9) return 'infrarrojo';
    if (l >= 380e-9) { const nm = l * 1e9; let c = 'rojo'; for (let i = 0; i < COLORES.length - 1; i++) if (nm >= COLORES[i][0] && nm < COLORES[i + 1][0]) c = COLORES[i][1]; return `luz visible (${c})`; }
    if (l > 10e-9) return 'ultravioleta';
    if (l > 10e-12) return 'rayos X';
    return 'rayos gamma';
  }

  function medio(sc) {
    const vacioM = sc.medio !== 'medio';
    const er = vacioM ? 1 : lee(sc, 'er', 'the relative permittivity εr'), mr = vacioM || vacio(sc.mr) ? 1 : lee(sc, 'mr', 'the relative permeability μr');
    const eps = er * EPS0, mu = mr * MU0, v = 1 / Math.sqrt(eps * mu), n = Math.sqrt(er * mr), eta = Math.sqrt(mu / eps);
    return { vacioM, er, mr, eps, mu, v, n, eta };
  }
  function frecuencia(sc, v) {
    const dato = ['f', 'lambda', 'omega', 'k'].includes(sc.dato) ? sc.dato : 'f';
    const x = lee(sc, 'valor', { f: 'the frequency f', lambda: 'the wavelength λ', omega: 'the angular frequency ω', k: 'the wave number k' }[dato]);
    const fr = dato === 'f' ? x : dato === 'lambda' ? v / x : dato === 'omega' ? x / (2 * Math.PI) : (x * v) / (2 * Math.PI);
    return { dato, x, fr, w: 2 * Math.PI * fr, k: (2 * Math.PI * fr) / v, lam: v / fr, T: 1 / fr };
  }
  const medioTxt = (M) => (M.vacioM ? 'In vacuum: $v = c = 1/√(μ_0 ε_0)$ = 2.998·10<sup>8</sup> m/s, $η_0 = √(μ_0/ε_0)$ = 376.7 Ω'
    : `Medium with ε<sub>r</sub> = ${f(M.er)}${M.mr !== 1 ? ` and μ<sub>r</sub> = ${f(M.mr)}` : ''}: index $n = √(ε_r μ_r)$ = ${f(M.n)}, $v = c/n$ = ${f(M.v)} m/s, $η = √(μ/ε) = η_0 √(μ_r/ε_r)$ = ${f(M.eta)} Ω`);

  function onda(sc) {
    const M = medio(sc), F = frecuencia(sc, M.v), E0 = lee(sc, 'E0', 'the amplitude E₀'), pasos = [...(sc.previos || [])];
    const K = vecDe({ prop: '+z', ...sc }, 'prop', 'k', 'the direction of propagation'), Ed = vecDe({ pol: '+x', ...sc }, 'pol', 'e', 'the direction of E');
    if (Math.abs(K.v[0] * Ed.v[0] + K.v[1] * Ed.v[1] + K.v[2] * Ed.v[2]) > 1e-9) throw new Error('E has to be perpendicular to the direction of propagation (the wave is transverse)');
    const Bv = cruz(K.v, Ed.v).map((c) => (Math.abs(c) < 1e-12 ? 0 : c)), B0 = E0 / M.v;
    const phiG = vacio(sc.fase) ? 0 : leeNum(sc.fase), phi = (phiG * Math.PI) / 180;
    if (!isFinite(phi)) throw new Error('The phase must be a number (in degrees)');
    const tp = ['circular', 'eliptica'].includes(sc.tipoPol) ? sc.tipoPol : 'lineal';
    const E02 = tp === 'circular' ? E0 : tp === 'eliptica' ? lee(sc, 'E02', 'the second amplitude E₀₂', { cero: true }) : 0;
    const dG = tp === 'circular' ? (sc.giro === 'horario' ? -90 : 90) : tp === 'eliptica' ? leeNum(vacio(sc.delta) ? '90' : sc.delta) : 0, dl = (dG * Math.PI) / 180;
    if (!isFinite(dl)) throw new Error('The phase difference δ must be a number (in degrees)');
    if (!sc.previos) pasos.push({ t: 'Medium', html: medioTxt(M) });
    const fTxt = { f: `f = ${f(F.fr)} Hz ⇒ $ω = 2π f$ = ${f(F.w)} rad/s`, lambda: `λ = ${f(F.x)} m ⇒ $f = v/λ = ${f(M.v)}/${f(F.x)}$ = ${f(F.fr)} Hz, $ω = 2π f$ = ${f(F.w)} rad/s`, omega: `ω = ${f(F.w)} rad/s ⇒ $f = ω/(2π)$ = ${f(F.fr)} Hz`, k: `k = ${f(F.x)} rad/m ⇒ $ω = k v$ = ${f(F.w)} rad/s, f = ${f(F.fr)} Hz` }[F.dato];
    pasos.push({ t: 'Frequency, wavelength and wave number', html: `${fTxt}<br>$λ = v/f$ = <b>${f(F.lam)} m</b>, &ensp; $k = {2π}/λ = ω/v$ = <b>${f(F.k)} rad/m</b>, &ensp; $T = 1/f$ = ${f(F.T)} s${M.vacioM ? '' : `<br>In vacuum it would have $λ_0 = c/f$ = ${f(C0 / F.fr)} m: inside the medium $λ = {λ_0}/n$.`}<br>Spectrum region: ${banda(F.fr)}` });
    const ar = K.eje ? K.eje : 'r', fTxt2 = phi ? ` ${phi < 0 ? '−' : '+'} ${f(Math.abs(phi))}` : '';
    const fase = K.eje ? `${f(F.k)}${ar} ${K.signo > 0 ? '−' : '+'} ${f(F.w)}t${fTxt2}` : `${kr(K.v, F.k)} − ${f(F.w)}t${fTxt2}`;
    const fase2 = (d) => (d ? `${fase} ${d < 0 ? '−' : '+'} ${f(Math.abs(d))}` : fase), menosE1 = Ed.v.map((c) => (c ? -c : 0));
    const Eexp = tp === 'lineal' ? `E(${ar}, t) = ${f(E0)} cos(${fase}) ${dirExp(Ed.v)} V/m` : `E(${ar}, t) = ${f(E0)} cos(${fase}) ${dirExp(Ed.v)} + ${f(E02)} cos(${fase2(dl)}) ${dirExp(Bv)} V/m`;
    const Bexp = tp === 'lineal' ? `B(${ar}, t) = ${f(B0)} cos(${fase}) ${dirExp(Bv)} T` : `B(${ar}, t) = ${f(B0)} cos(${fase}) ${dirExp(Bv)} + ${f(E02 / M.v)} cos(${fase2(dl)}) ${dirExp(menosE1)} T`;
    const ek = (v) => (vecTxt(v)[0] === '−' ? `(${vecTxt(v)})` : vecTxt(v));
    pasos.push({ t: 'Magnetic field', html: `In a plane wave E, B and the direction of propagation are perpendicular to each other and $B_0 = {E_0}/v = ${f(E0)}/{${f(M.v)}}$ = <b>${f(B0)} T</b><br>The direction of B comes from k̂ = Ê × B̂, that is B̂ = k̂ × Ê = ${ek(K.v)} × ${ek(Ed.v)} = <b>${vecTxt(Bv)}</b>` });
    if (tp !== 'lineal') {
      const forma = tp === 'circular' || (Math.abs(E02 - E0) < 1e-12 * E0 && Math.abs(Math.abs(dG) - 90) < 1e-9) ? 'circular' : Math.abs(Math.sin(dl)) < 1e-12 || E02 === 0 ? 'lineal' : 'elliptical', gira = Math.sin(dl) > 0 ? 'antihorario' : 'horario';
      pasos.push({ t: 'Polarization', html: `E is the sum of two perpendicular waves: E<sub>01</sub> = ${f(E0)} V/m along ${vecTxt(Ed.v)} and E<sub>02</sub> = ${f(E02)} V/m along k̂ × Ê = ${vecTxt(Bv)}, out of phase by δ = ${f(dG)}°. ${forma === 'lineal' ? 'With δ = 0° or 180° they stay in phase and the polarization remains <b>linear</b>, tilted.' : `At a fixed point the tip of E describes a ${forma === 'circular' ? '<b>circle</b> (circular polarization: E<sub>01</sub> = E<sub>02</sub> and δ = ±90°)' : '<b>ellipse</b> (elliptical polarization)'} and rotates <b>${gira}</b> as seen by the receiver of the wave (looking towards the source).`}${forma === 'circular' ? ` |E| is constant, ${f(E0)} V/m.` : ''}` });
    }
    const pref = phi ? `, with initial phase φ = ${f(phiG)}° = ${f(phi)} rad` : '';
    pasos.push({ t: 'Expressions', html: `With the form cos(k·r − ωt + φ), travelling towards ${dirTxt(K.v)}${K.eje ? '' : ` (k = k k̂ = ${kr(K.v, F.k).replace(/([xyz])/g, (m) => ` ${GORRO[m]}`)} rad/m)`}${pref}:<br>${Eexp}<br>${Bexp}` });
    const I = (E0 * E0 + E02 * E02) / (2 * M.eta), u = 0.5 * M.eps * (E0 * E0 + E02 * E02);
    pasos.push({ t: 'Energy and intensity', html: `Poynting vector $S = {E × B}/μ$, in the direction ${vecTxt(K.v)}. Its mean value is the intensity:<br>${tp === 'lineal' ? `$I = {E_0^2}/{2η} = {${f(E0)}^2}/{2·${f(M.eta)}}$` : `$I = {E_01^2 + E_02^2}/{2η} = {${f(E0)}^2 + ${f(E02)}^2}/{2·${f(M.eta)}}$`} = <b>${f(I)} W/m<sup>2</sup></b><br>Mean energy density $u = 1/2 ε E_0^2$ = ${f(u)} J/m<sup>3</sup> (half in E and half in B), and $I = u v$.<br>RMS values: $E_{rms} = {E_0}/√2$ = ${f(E0 / Math.SQRT2)} V/m, B<sub>rms</sub> = ${f(B0 / Math.SQRT2)} T` });
    pasos.push({ t: 'Radiation pressure', html: `On a surface that absorbs it, $p = I/v$ = ${f(I / M.v)} Pa; if it reflects it completely, $p = {2I}/v$ = ${f((2 * I) / M.v)} Pa.` });
    return { modo: 'onda', M, F, E0, B0, K, Ed, Bv, I, u, Eexp, Bexp, fase, phi, tp, E02, dl, pa: I / M.v, alfa: 0, pasos };
  }

  function numPi(t) {
    let s = t.replace(/\s/g, ''), m = 1;
    if (/π|pi/.test(s)) { m = Math.PI; s = s.replace(/·?(π|pi)/, ''); if (s === '' || s === '+') s = '1'; if (s === '-' || s === '−') s = '-1'; if (/^[+\-−]?\//.test(s)) s = s.replace(/^([+\-−]?)\//, '$11/'); }
    const fr = /^(.*)\/(.*)$/.exec(s);
    if (fr) { const a = numPi(fr[1] || '1'), b = numPi(fr[2]); return (a * m) / b; }
    const v = leeNum(s);
    return v * m;
  }
  function leeExpresion(texto) {
    let s = String(texto || '').trim().replace(/\s+/g, ' ').replace(/^[EB]\s*\([^)]*\)\s*=\s*/i, '').replace(/^[EB]\s*=\s*/i, '').replace(/[−–]/g, '-').replace(/sin/gi, 'sin');
    const m0 = /^(.*?)(cos|sen)\s*\(/i.exec(s);
    let fin = -1;
    if (m0) for (let i = m0[0].length, n = 1; i < s.length; i++) { if (s[i] === '(') n++; else if (s[i] === ')' && !--n) { fin = i; break; } }
    if (fin < 0) throw new Error('Write the wave as E₀ cos(k·r − ωt + φ) and its direction, e.g. 30 cos(2.09y + 6.28e8t) k');
    const m = [s, m0[1], m0[2], s.slice(m0[0].length, fin), s.slice(fin + 1).trim()];
    let amp = m[1].replace(/[·*×\s]/g, '') || '1'; if (amp === '-') amp = '-1'; if (amp === '+') amp = '1';
    const A = numPi(amp);
    if (!isFinite(A) || A === 0) throw new Error('I do not understand the amplitude of the expression');
    const c = { x: 0, y: 0, z: 0, t: 0, '': 0 };
    const arg = m[3].replace(/\s/g, '').replace(/(\d)([eE])([+\-]?\d)/g, '$1E$3');
    const terms = arg.match(/[+\-]?[^+\-]+(?:E[+\-]?\d+[^+\-]*)?/g) || [];
    for (const t0 of terms) {
      const t = t0.replace(/E/g, 'e'), v = /([xyzt])$/.exec(t), var_ = v ? v[1] : '', num = var_ ? t.slice(0, -1).replace(/[·*]$/, '') : t;
      const x = numPi(num === '' || num === '+' ? '1' : num === '-' ? '-1' : num);
      if (!isFinite(x)) throw new Error(`I do not understand the term «${t0}» of the phase`);
      c[var_] += x;
    }
    let d = m[4].replace(/\s/g, '').replace(/V\/m|T$/i, ''), sg = 1;
    if (d[0] === '-') { sg = -1; d = d.slice(1); }
    let dv;
    const vec = /^\(([^,]+),([^,]+),([^,]+)\)$/.exec(d.replace(/;/g, ','));
    if (vec) dv = vec.slice(1).map((x) => numPi(x));
    else { const e = { 'î': 'x', 'ĵ': 'y', 'k̂': 'z', i: 'x', j: 'y', k: 'z', x: 'x', y: 'y', z: 'z', ux: 'x', uy: 'y', uz: 'z', u_x: 'x', u_y: 'y', u_z: 'z' }[d.normalize('NFC')] || { 'x̂': 'x', 'ŷ': 'y', 'ẑ': 'z' }[d]; if (!e) throw new Error('The field direction is missing at the end: î, ĵ, k̂ or a vector (a, b, c)'); dv = EJES[e].slice(); }
    if (dv.some((x) => !isFinite(x)) || !(Math.hypot(...dv) > 0)) throw new Error('The field direction is not valid');
    return { A: A * sg, c, dv, func: m[2].toLowerCase() };
  }
  function expresion(sc) {
    const campo = sc.campo === 'B' ? 'B' : 'E', X = leeExpresion(sc.expr), pasos = [];
    let kv = [X.c.x, X.c.y, X.c.z], w = -X.c.t, phi = X.c[''];
    if (X.func === 'sin') phi -= Math.PI / 2;
    if (!(Math.hypot(...kv) > 0)) throw new Error('The spatial part of the phase is missing (terms in x, y or z)');
    if (!w) throw new Error('The term in t of the phase is missing');
    let nota = '';
    if (w < 0) { kv = kv.map((c) => -c); w = -w; phi = -phi; nota = ' Since the cosine is even, cos(k·r + ωt + φ) = cos(−k·r − ωt − φ): the wave travels in the direction of −k.'; }
    const k = Math.hypot(...kv), v = w / k, n = C0 / v, amp = Math.abs(X.A) * Math.hypot(...X.dv), dv = unit(X.dv).map((c) => c * Math.sign(X.A)), kh = unit(kv);
    pasos.push({ t: 'Reading the expression', html: `${X.func === 'sen' ? 'sin θ = cos(θ − π/2). ' : ''}Comparing with ${campo}<sub>0</sub> cos(k·r − ωt + φ): amplitude ${campo}<sub>0</sub> = <b>${f(amp)} ${campo === 'E' ? 'V/m' : 'T'}</b> along ${vecTxt(dv)}, k = (${kv.map((c) => f(c)).join(', ')}) rad/m, with magnitude k = <b>${f(k)} rad/m</b>, ω = <b>${f(w)} rad/s</b>${phi ? ` and φ = ${f(phi)} rad` : ''}.${nota} It propagates towards ${vecTxt(kh)}.` });
    if (n < 1 - 1e-3) throw new Error(`With those k and ω the wave would go at ω/k = ${f(v).replace(/<[^>]+>/g, '')} m/s, faster than light: check the expression`);
    const enVacio = Math.abs(n - 1) < 2e-3;
    pasos.push({ t: 'Speed and medium', html: `$v = ω/k = ${f(w)}/{${f(k)}}$ = <b>${f(v)} m/s</b>${enVacio ? ': it is c, so the wave goes through vacuum (or air).' : `, less than c: it goes through a medium of index $n = c/v$ = <b>${f(n)}</b> (if μ<sub>r</sub> = 1, $ε_r = n^2$ = ${f(n * n)}).`}` });
    if (Math.abs(kh[0] * dv[0] + kh[1] * dv[1] + kh[2] * dv[2]) > 1e-6) throw new Error(`The ${campo} field is not perpendicular to k: it is not a transverse plane wave`);
    let ev = dv, E0 = amp;
    const vMedio = enVacio ? C0 : v;
    if (campo === 'B') { ev = cruz(dv, kh); E0 = amp * vMedio; pasos.push({ t: 'Electric field', html: `$E_0 = v B_0 = ${f(vMedio)}·${f(amp)}$ = <b>${f(E0)} V/m</b>, and since B̂ = k̂ × Ê, the direction of E is Ê = B̂ × k̂ = ${vecTxt(unit(ev))}.` }); }
    const e = unit(ev), num = (x) => String(+x.toPrecision(12));
    const sc2 = { modo: 'onda', medio: enVacio ? 'vacio' : 'medio', er: num(n * n), mr: '1', dato: 'omega', valor: num(w), E0: num(E0), prop: 'otra', kx: num(kh[0]), ky: num(kh[1]), kz: num(kh[2]), pol: 'otra', ex: num(e[0]), ey: num(e[1]), ez: num(e[2]), fase: num((phi * 180) / Math.PI), previos: pasos };
    const r = onda(sc2);
    return { ...r, modo: 'expresion', campo, leido: { k, w, phi, amp } };
  }

  function incidencia(sc) {
    const M = medio(sc), F = frecuencia(sc, M.v), E0 = lee(sc, 'E0', 'the amplitude E₀ of the incident wave'), pasos = [], cond = sc.destino !== 'dielectrico';
    const I0 = (E0 * E0) / (2 * M.eta), B0 = E0 / M.v;
    pasos.push({ t: 'Medium of arrival', html: `${medioTxt(M)}<br>λ = ${f(F.lam)} m, k = ${f(F.k)} rad/m. The wave arrives from z < 0 towards +z: E<sub>i</sub> = ${f(E0)} cos(kz − ωt) î V/m, with $I_i = {E_0^2}/{2η}$ = ${f(I0)} W/m<sup>2</sup>.` });
    if (cond) {
      const K = (2 * B0) / M.mu;
      pasos.push({ t: 'Reflected wave', html: 'Inside a perfect conductor E = 0 and, since tangential E is continuous, E = 0 at the surface z = 0. That requires a reflected wave E<sub>r</sub> = −E<sub>0</sub> cos(kz + ωt) î: the reflection coefficient is <b>r = −1</b> and all the energy is reflected.' });
      pasos.push({ t: 'Standing wave', html: `Adding: $E = E_0 [cos(k z − ω t) − cos(k z + ω t)] = 2E_0 sin(k z) sin(ω t) î$ = ${f(2 * E0)} sin(${f(F.k)}z) sin(${f(F.w)}t) î V/m<br>$B = {E_0}/v [cos(k z − ω t) + cos(k z + ω t)] = 2B_0 cos(k z) cos(ω t) ĵ$ = ${f(2 * B0)} cos(${f(F.k)}z) cos(${f(F.w)}t) ĵ T<br>It no longer advances: each point oscillates in place, and E and B are out of phase by a quarter of a period in time and a quarter of λ in space.` });
      pasos.push({ t: 'Nodes and antinodes', html: `E is always zero on the planes z = −nλ/2 = 0, −${f(F.lam / 2)}, −${f(F.lam)} m… (nodes of E, where B is maximum) and has maximum amplitude 2E<sub>0</sub> = ${f(2 * E0)} V/m at z = −λ/4, −3λ/4… = −${f(F.lam / 4)}, −${f((3 * F.lam) / 4)} m… The distance between two nodes is λ/2 = <b>${f(F.lam / 2)} m</b>.` });
      pasos.push({ t: 'Energy, pressure and surface current', html: `The mean Poynting vector is 0: the energy does not travel, it goes back and forth between E and B. The radiation pressure on the conductor is $p = {2I_i}/v$ = <b>${f((2 * I0) / M.v)} Pa</b>. At the surface B = 2B<sub>0</sub> cos(ωt), and that jump in B is produced by a surface current $K = B/μ$ = <b>${f(K)} cos(ωt) A/m</b> (along î).` });
      return { modo: 'incidencia', cond, M, F, E0, B0, I0, r: -1, t: 0, R: 1, T: 0, K, pasos };
    }
    const er2 = lee(sc, 'er2', 'the relative permittivity ε₂ of the second medium'), mr2 = vacio(sc.mr2) ? 1 : lee(sc, 'mr2', 'the relative permeability μ₂'), M2 = medio({ medio: 'medio', er: er2, mr: mr2 });
    const r = (M2.eta - M.eta) / (M2.eta + M.eta), t = 1 + r, Rr = r * r, T = (M.eta / M2.eta) * t * t, swr = (1 + Math.abs(r)) / (1 - Math.abs(r));
    pasos.push({ t: 'Second medium', html: `ε<sub>r</sub> = ${f(er2)}${mr2 !== 1 ? `, μ<sub>r</sub> = ${f(mr2)}` : ''}: n<sub>2</sub> = ${f(M2.n)}, v<sub>2</sub> = ${f(M2.v)} m/s, η<sub>2</sub> = ${f(M2.eta)} Ω, λ<sub>2</sub> = ${f(M2.v / F.fr)} m.` });
    pasos.push({ t: 'Fresnel coefficients', html: `With tangential E and H continuous at z = 0: $r = {η_2 − η_1}/{η_2 + η_1}$ = <b>${f(r)}</b> and $t = {2η_2}/{η_1 + η_2} = 1 + r$ = <b>${f(t)}</b>${mr2 === 1 && M.mr === 1 ? ` (with μ = μ<sub>0</sub>, $r = {n_1 − n_2}/{n_1 + n_2}$)` : ''}.<br>$E_r = r E_0$ = ${f(r * E0)} V/m${r < 0 ? ' (the reflected wave is inverted: phase change of 180°)' : ''} y $E_t = t E_0$ = ${f(t * E0)} V/m.` });
    pasos.push({ t: 'Energy', html: `$R = r^2$ = <b>${f(100 * Rr, 3)} %</b> is reflected and $T = {η_1}/{η_2} t^2$ = <b>${f(100 * T, 3)} %</b> is transmitted (R + T = 1). In the first medium the sum of the incident and reflected waves is a partially standing wave: |E| oscillates between ${f(E0 * (1 - Math.abs(r)))} and ${f(E0 * (1 + Math.abs(r)))} V/m (standing wave ratio ${f(swr)}).` });
    return { modo: 'incidencia', cond, M, M2, F, E0, B0, I0, r, t, R: Rr, T, swr, pasos };
  }

  function intensidad(sc) {
    const M = medio(sc), pasos = [], de = ['fuente', 'I', 'E0'].includes(sc.de) ? sc.de : 'fuente';
    let I, P = null, r = null;
    pasos.push({ t: 'Medium', html: medioTxt(M) });
    if (de === 'fuente') {
      P = lee(sc, 'P', 'the power P'); r = lee(sc, 'r', 'the distance r'); I = P / (4 * Math.PI * r * r);
      pasos.push({ t: 'Intensity at a distance r', html: `A point source spreads the power equally over a sphere of area 4πr<sup>2</sup>:<br>$I = P/(4π r^2) = {${f(P)}}/{4π·${f(r)}^2}$ = <b>${f(I)} W/m<sup>2</sup></b>` });
    } else if (de === 'I') I = lee(sc, 'I', 'the intensity I');
    let E0 = de === 'E0' ? lee(sc, 'E0', 'the amplitude E₀') : Math.sqrt(2 * M.eta * I);
    if (de === 'E0') { I = (E0 * E0) / (2 * M.eta); pasos.push({ t: 'Intensity', html: `$I = {E_0^2}/{2η} = {${f(E0)}^2}/{2·${f(M.eta)}}$ = <b>${f(I)} W/m<sup>2</sup></b>` }); }
    else pasos.push({ t: 'Electric field amplitude', html: `$I = {E_0^2}/{2η} ⇒ E_0 = √(2η I) = √(2·${f(M.eta)}·${f(I)})$ = <b>${f(E0)} V/m</b>` });
    const B0 = E0 / M.v;
    pasos.push({ t: 'Magnetic field and RMS values', html: `$B_0 = {E_0}/v$ = <b>${f(B0)} T</b><br>$E_{rms} = {E_0}/√2$ = ${f(E0 / Math.SQRT2)} V/m, &ensp; B<sub>rms</sub> = ${f(B0 / Math.SQRT2)} T` });
    const u = I / M.v, A = lee(sc, 'A', 'the area A', { opcional: true });
    pasos.push({ t: 'Energy and radiation pressure', html: `$u = I/v$ = ${f(u)} J/m<sup>3</sup><br>$p = I/v$ = ${f(I / M.v)} Pa if absorbed and $ {2I}/v$ = ${f((2 * I) / M.v)} Pa if reflected${A !== null ? `<br>On A = ${f(A)} m<sup>2</sup>: power arriving I·A = ${f(I * A)} W, force ${f((I * A) / M.v)} N (absorbs) or ${f((2 * I * A) / M.v)} N (reflects)` : ''}` });
    return { modo: 'intensidad', M, de, P, r, I, E0, B0, u, A, pa: I / M.v, pasos };
  }

  function perdidas(sc) {
    const er = lee(sc, 'er', 'the relative permittivity εr'), mr = vacio(sc.mr) ? 1 : lee(sc, 'mr', 'the relative permeability μr'), sg = lee(sc, 'sigma', 'the conductivity σ', { cero: true });
    const fr = lee(sc, 'valor', 'the frequency f'), w = 2 * Math.PI * fr, eps = er * EPS0, mu = mr * MU0, pasos = [];
    const tg = sg / (w * eps), raiz = Math.sqrt(1 + tg * tg), base = w * Math.sqrt((mu * eps) / 2);
    const alfa = base * Math.sqrt(raiz - 1), beta = base * Math.sqrt(raiz + 1), delta = alfa > 0 ? 1 / alfa : Infinity;
    const etaM = Math.sqrt(mu / eps) / Math.sqrt(raiz), th = 0.5 * Math.atan(tg), vf = w / beta, lam = (2 * Math.PI) / beta;
    const tipo = tg > 100 ? 'buen conductor' : tg < 0.01 ? 'good dielectric (low losses)' : 'medium with moderate losses';
    pasos.push({ t: 'Loss tangent', html: `$ω = 2π f$ = ${f(w)} rad/s, $ε = ε_r ε_0$ = ${f(eps)} F/m<br>$σ/(ω ε) = {${f(sg)}}/{${f(w)}·${f(eps)}}$ = <b>${f(tg)}</b> ⇒ ${tipo}${tg > 100 ? ' (the conduction current dominates)' : tg < 0.01 ? ' (the displacement current dominates)' : ''}` });
    let h = `The propagation constant is $γ = α + jβ = √(jω μ (σ + jω ε))$, with<br>$α = ω √({μ ε}/2) √(√(1 + (σ/(ω ε))^2) − 1)$ = <b>${f(alfa)} Np/m</b><br>$β = ω √({μ ε}/2) √(√(1 + (σ/(ω ε))^2) + 1)$ = <b>${f(beta)} rad/m</b>`;
    if (tg > 100) h += `<br>In a good conductor $α ≈ β ≈ √(π f μ σ)$ = ${f(Math.sqrt(Math.PI * fr * mu * sg))}`;
    else if (tg < 0.01 && sg > 0) h += `<br>With low losses $α ≈ σ/2 √(μ/ε)$ = ${f((sg / 2) * Math.sqrt(mu / eps))} and $β ≈ ω √(μ ε)$ = ${f(w * Math.sqrt(mu * eps))}`;
    pasos.push({ t: 'Attenuation and phase', html: h });
    pasos.push({ t: 'Penetration depth', html: sg === 0 ? 'Without conductivity there are no losses: the wave is not attenuated (δ = ∞).' : `$δ = 1/α$ = <b>${f(delta)} m</b>: at that depth the amplitude drops to 1/e = 37 % and the intensity to 1/e<sup>2</sup> = 13.5 %.` });
    pasos.push({ t: 'Speed, wavelength and impedance', html: `$v = ω/β$ = ${f(vf)} m/s, &ensp; $λ = {2π}/β$ = ${f(lam)} m<br>$η = √({jω μ}/{σ + jω ε}) = |η|∠θ$ = <b>${f(etaM)} Ω ∠${f((th * 180) / Math.PI)}°</b>: the B field lags E by ${f((th * 180) / Math.PI)}°.` });
    const E0 = lee(sc, 'E0', 'the amplitude E₀', { opcional: true }), d = lee(sc, 'd', 'the depth d', { opcional: true, cero: true });
    let Ed = null;
    if (E0 !== null) {
      let g = `E(z, t) = ${f(E0)} e<sup>−${f(alfa)}z</sup> cos(${f(beta)}z − ${f(w)}t) V/m`;
      if (d !== null) { Ed = E0 * Math.exp(-alfa * d); g += `<br>At z = ${f(d)} m: $E = E_0 e^{−α z} = ${f(E0)}·e^{−${f(alfa * d)}}$ = <b>${f(Ed)} V/m</b> (${f(100 * Math.exp(-alfa * d))} % of the amplitude)`; }
      g += `<br>Intensity on entering: $I = {E_0^2 cos θ}/{2|η|}$ = ${f((E0 * E0 * Math.cos(th)) / (2 * etaM))} W/m<sup>2</sup>`;
      pasos.push({ t: 'Field inside the medium', html: g });
    }
    return { modo: 'perdidas', er, mr, sg, fr, w, tg, tipo, alfa, beta, delta, etaM, th, vf, lam, E0, d, Ed, M: { eps, mu, v: vf, eta: etaM }, F: { fr, w, k: beta, lam }, pasos };
  }

  function polarizadores(sc) {
    const luz = ['natural', 'lineal', 'circular'].includes(sc.luz) ? sc.luz : 'natural', I0 = lee(sc, 'I0', 'the intensity I₀'), pasos = [];
    const angs = String(sc.angulos ?? '').split(';').map((s) => s.trim()).filter(Boolean).map(leeNum);
    if (!angs.length) throw new Error('The angle of at least one polarizer is missing (for example 0; 45; 90)');
    if (angs.some((a) => !isFinite(a))) throw new Error('The polarizer angles must be numbers, separated by semicolons (0; 45; 90)');
    if (angs.length > 6) throw new Error('At most 6 polarizers');
    const alfa = luz === 'lineal' ? (vacio(sc.alfa) ? 0 : leeNum(sc.alfa)) : 0;
    if (luz === 'lineal' && !isFinite(alfa)) throw new Error('The light angle must be a number');
    const norm = (a) => { let d = ((a + 90) % 180 + 180) % 180 - 90; return d; };
    pasos.push({ t: 'Malus\'s law', html: `An ideal polarizer lets through only the component of E parallel to its axis: $E = E_0 cos θ$, and since $I ∝ E^2$:<br>$I = I_0 cos^2 θ$ (Malus's law), with θ the angle between the polarization of the light and the axis.<br>Natural light (all directions equal): the first polarizer lets through half, $I = I_0/2$, and leaves it polarized along its axis. Circular light also loses half.` });
    const etapas = []; let I = I0, pol = luz === 'lineal' ? alfa : null;
    angs.forEach((a, i) => {
      const prev = I;
      let h;
      if (pol === null) { I = prev / 2; h = `${luz === 'natural' ? 'Natural' : 'Circular'} light: $I_${i + 1} = I_${i}/2 = {${f(prev)}}/2$ = <b>${f(I)} W/m<sup>2</sup></b>`; etapas.push({ a, de: null, I, prev, c2: 0.5 }); }
      else { const th = norm(a - pol), c2 = Math.cos((th * Math.PI) / 180) ** 2; I = prev * (Math.abs(c2) < 1e-15 ? 0 : c2); h = `Angle between the light (${f(pol)}°) and the axis (${f(a)}°): θ = ${f(th)}°<br>$I_${i + 1} = I_${i} cos^2 θ = ${f(prev)}·cos^2(${f(th)}°)$ = <b>${f(I)} W/m<sup>2</sup></b>`; etapas.push({ a, de: pol, th, I, prev, c2 }); }
      pol = a;
      pasos.push({ t: `Polarizer ${i + 1} (axis at ${f(a)}°)`, html: h + `<br>It leaves polarized along ${f(a)}°, with E<sub>0</sub> = ${f(Math.sqrt(2 * 376.730313 * I))} V/m (in vacuum).` });
    });
    const E0f = Math.sqrt(2 * 376.730313 * I), frac = I / I0;
    pasos.push({ t: 'Final result', html: `$I_f/I_0 = $ <b>${f(frac, 4)}</b> (${f(100 * frac, 4)} %), $I_f = $ <b>${f(I)} W/m<sup>2</sup></b>, $E_0 = √(2 η I_f)$ = ${f(E0f)} V/m with η = 376.7 Ω.` });
    if (I <= 1e-300 * I0) pasos.push({ t: 'Crossed polarizers', html: 'With axes at 90° no light gets through. An intermediate polarizer at 45° between two crossed ones lets light through: it is the classic paradox.' });
    return { modo: 'polarizadores', luz, I0, alfa, angs, etapas, I, frac, E0f, pasos };
  }

  function poynting(sc) {
    const sis = ['hilo', 'condensador', 'coaxial'].includes(sc.sis) ? sc.sis : 'hilo', pasos = [];
    pasos.push({ t: 'Idea', html: `The Poynting vector $S = {E × B}/μ_0$ gives the power per unit area. Its flux through a closed surface is the power entering or leaving (energy balance): $∮ S·dA = −{dU}/{dt} − P_{Joule}$. In a circuit the energy does not travel through the wires: it arrives through the fields outside.` });
    let r;
    if (sis === 'hilo') {
      const a = lee(sc, 'a', 'the radius a'), L = lee(sc, 'L', 'the length L'), I = lee(sc, 'I', 'the current I'), sg = lee(sc, 'sigma', 'the conductivity σ');
      const A = Math.PI * a * a, R = L / (sg * A), E = I / (sg * A), B = (MU0 * I) / (2 * Math.PI * a), S = (E * B) / MU0, flujo = S * 2 * Math.PI * a * L, P = I * I * R;
      pasos.push({ t: 'Fields at the surface of the wire', html: `Cross-section A = πa<sup>2</sup> = ${f(A)} m<sup>2</sup>; resistance $R = {L}/{σ A}$ = <b>${f(R)} Ω</b><br>Electric field (along the wire): $E = {I}/{σ A}$ = ${f(E)} V/m<br>Magnetic field (Ampère, at r = a): $B = {μ_0 I}/{2π a}$ = ${f(B)} T, azimuthal.` });
      pasos.push({ t: 'Poynting vector', html: `$S = {E B}/μ_0 = {I^2}/{2π^2 σ a^3}$ = <b>${f(S)} W/m<sup>2</sup></b>, directed towards the axis of the wire (radial, inward): E × B points inward.` });
      pasos.push({ t: 'Energy balance', html: `Flux through the lateral surface of area 2πaL = ${f(2 * Math.PI * a * L)} m<sup>2</sup>:<br>$Φ_S = S·2π a L$ = <b>${f(flujo)} W</b> entering<br>Power dissipated: $P = I^2 R$ = ${f(P)} W. <b>They agree</b>: the wire heats up with the energy that reaches it from the outside fields.` });
      r = { E, B, S, flujo, P, R, dir: 'inward (radial)' };
    } else if (sis === 'condensador') {
      const a = lee(sc, 'a', 'the radius a of the plates'), d = lee(sc, 'd', 'the separation d'), V = lee(sc, 'V', 'the voltage V'), I = lee(sc, 'I', 'the charging current I');
      const C = (EPS0 * Math.PI * a * a) / d, E = V / d, B = (MU0 * I) / (2 * Math.PI * a), S = (E * B) / MU0, flujo = S * 2 * Math.PI * a * d, U = 0.5 * C * V * V, dU = V * I, vol = Math.PI * a * a * d, dE = I / (EPS0 * Math.PI * a * a);
      pasos.push({ t: 'Capacitor and electric field', html: `Capacitance $C = {ε_0 π a^2}/d$ = ${f(C)} F; field between the plates $E = V/d$ = <b>${f(E)} V/m</b>, growing at ${f(dE)} V/m/s while the current I = ${f(I)} A charges the plates.<br>Stored energy $U = ½ C V^2$ = ${f(U)} J.` });
      pasos.push({ t: 'Ampère–Maxwell magnetic field', html: `The displacement current creates B at the edge: $B·2π a = μ_0 ε_0 π a^2 {dE}/{dt} = μ_0 I$ ⇒ $B = {μ_0 I}/{2π a}$ = ${f(B)} T, azimuthal.` });
      pasos.push({ t: 'Poynting vector', html: `$S = {E B}/μ_0$ = <b>${f(S)} W/m<sup>2</sup></b>, radial inward (while the plate is charging).` });
      pasos.push({ t: 'Energy balance', html: `Flux through the lateral edge of area 2πad = ${f(2 * Math.PI * a * d)} m<sup>2</sup>: $Φ_S = S·2π a d$ = <b>${f(flujo)} W</b><br>Rate of increase of the field energy: $dU/dt = V I$ = ${f(dU)} W (with ${f(0.5 * EPS0 * E * E * vol)} J = ½ ε<sub>0</sub>E<sup>2</sup>·volume). <b>They agree</b>: all the energy enters through the sides, not through the wires.` });
      r = { E, B, S, flujo, P: dU, C, U, dir: 'inward (radial)' };
    } else {
      const a = lee(sc, 'a', 'the inner radius a'), b = lee(sc, 'b', 'the outer radius b'), V = lee(sc, 'V', 'the voltage V'), I = lee(sc, 'I', 'the current I'), rr = vacio(sc.r) ? a : lee(sc, 'r', 'the radius r of the point');
      if (b <= a) throw new Error('The outer radius b must be greater than the inner radius a');
      if (rr < a || rr > b) throw new Error('The point has to be between the two conductors (a ≤ r ≤ b)');
      const ln = Math.log(b / a), E = V / (rr * ln), B = (MU0 * I) / (2 * Math.PI * rr), S = (E * B) / MU0, flujo = V * I, P = V * I;
      pasos.push({ t: 'Fields between the conductors', html: `Gauss: $E = {V}/{r ln(b/a)}$ (radial), with ln(b/a) = ${f(ln)}; Ampère: $B = {μ_0 I}/{2π r}$ (azimuthal). At r = ${f(rr)} m: E = ${f(E)} V/m, B = ${f(B)} T.` });
      pasos.push({ t: 'Poynting vector', html: `$S = {E B}/μ_0 = {V I}/{2π r^2 ln(b/a)}$ = <b>${f(S)} W/m<sup>2</sup></b> along the cable, from the source to the load (if V and I are positive).` });
      pasos.push({ t: 'Power carried', html: `Integrating S over the annulus between a and b: $∫_a^b S·2π r dr = {V I}/{ln(b/a)}·ln(b/a)$ = <b>${f(P)} W</b>. It is $P = V I$: the power travels through the dielectric between the conductors, not inside the metal.` });
      r = { E, B, S, flujo, P, ln, dir: 'along the axis, from the source to the load', rr };
    }
    return { modo: 'poynting', sis, ...r, pasos };
  }

  function plasma(sc) {
    const QE = SI.e, ME = 9.1093837015e-31, ne = lee(sc, 'ne', 'the electron density n_e'), fr = lee(sc, 'valor', 'the frequency f', { opcional: true }), pasos = [];
    const ang = vacio(sc.ang) ? null : lee(sc, 'ang', 'the angle of incidence', { cero: true });
    if (ang !== null && ang >= 90) throw new Error('The angle of incidence has to be less than 90°');
    const wp = Math.sqrt((ne * QE * QE) / (EPS0 * ME)), fp = wp / (2 * Math.PI), lp = C0 / fp;
    pasos.push({ t: 'Plasma frequency', html: `The free electrons oscillate collectively with $ω_p = √({n_e e^2}/{ε_0 m_e}) = √({${f(ne)}·(${f(QE)})^2}/{${f(EPS0)}·${f(ME)}})$ = <b>${f(wp)} rad/s</b>, that is $f_p = ω_p/2π$ = <b>${f(fp)} Hz</b> (≈ 8.98 √n_e Hz), and $λ_p = c/f_p$ = ${f(lp)} m.` });
    pasos.push({ t: 'Dispersion relation', html: `Maxwell's equations with the electron current give $k^2 c^2 = ω^2 − ω_p^2$, that is an index $n(ω) = √(1 − ω_p^2/ω^2)$: less than 1 and real only if $ω > ω_p$.` });
    const r = { modo: 'plasma', ne, wp, fp, lp, fr, ang, fcrit: ang === null ? fp : fp / Math.cos((ang * Math.PI) / 180) };
    if (fr !== null) {
      const w = 2 * Math.PI * fr, x = w / wp;
      if (x > 1) {
        const n = Math.sqrt(1 - 1 / (x * x)), k = (w * n) / C0, vf = C0 / n, vg = C0 * n;
        Object.assign(r, { w, x, n, k, vf, vg, lam: (2 * Math.PI) / k, propaga: true });
        pasos.push({ t: 'The wave propagates', html: `$ω/ω_p = ${f(x)} > 1$: $n = √(1 − 1/${f(x)}^2)$ = <b>${f(n)}</b>, $k = nω/c$ = ${f(k)} rad/m and $λ = 2π/k$ = <b>${f(r.lam)} m</b> (greater than in vacuum).` });
        pasos.push({ t: 'Phase and group velocities', html: `$v_f = ω/k = c/n$ = <b>${f(vf)} m/s</b> (greater than c!), but energy and information travel at $v_g = dω/dk = c n$ = <b>${f(vg)} m/s</b> (less than c). $v_f v_g = c^2$ holds: ${f(vf * vg)} m²/s².` });
      } else {
        const kap = (wp / C0) * Math.sqrt(1 - x * x);
        Object.assign(r, { w, x, kappa: kap, delta: 1 / kap, propaga: false });
        pasos.push({ t: 'The wave does not propagate', html: `$ω/ω_p = ${f(x)} < 1$: $n$ is imaginary, $k = ±jκ$ with $κ = {ω_p}/c √(1 − ω^2/ω_p^2)$ = ${f(kap)} m<sup>-1</sup>. The field decays as $e^{−κ z}$ with penetration depth $δ = 1/κ$ = <b>${f(r.delta)} m</b> and the wave is <b>reflected</b> almost completely (R = 1 without losses): that is why the ionosphere reflects short waves and metals shine.` });
      }
    }
    if (ang !== null) pasos.push({ t: 'Oblique reflection in the ionosphere', html: `With incidence at $θ = ${f(ang)}°$ the wave is reflected if $n ≤ sin θ$, that is if $f ≤ f_p/cos θ$ (secant law): $f_{max} = ${f(fp)}/cos ${f(ang)}°$ = <b>${f(r.fcrit)} Hz</b>.` + (fr !== null ? ` At ${f(fr)} Hz ${fr <= r.fcrit ? '<b>it is reflected</b>' : '<b>it goes through</b> the layer'}.` : '') });
    else pasos.push({ t: 'Reflection in the ionosphere', html: `With vertical incidence, the layer reflects all frequencies below $f_p$ = ${f(fp)} Hz${fp > 1e6 ? ` (${f(fp / 1e6)} MHz)` : ''}; above that, the wave goes through it.` });
    r.reflejada = fr !== null && (r.fcrit >= fr);
    r.pasos = pasos;
    r.curva = (n) => Array.from({ length: n + 1 }, (_, i) => { const kk = (i / n) * 3; return [kk, Math.sqrt(1 + kk * kk)]; }); // κ = kc/ω_p → ω/ω_p
    return r;
  }

  const CARAS = { antihorario: 'anticlockwise (seen by the receiver: left-handed)', horario: 'clockwise (seen by the receiver: right-handed)' };
  function elipse(Ex, Ey, dl) {
    const c = Math.cos(dl), s = Math.sin(dl), sum = Ex * Ex + Ey * Ey, dif = Ex * Ex - Ey * Ey, raiz = Math.sqrt(dif * dif + 4 * Ex * Ex * Ey * Ey * c * c);
    const a = Math.sqrt((sum + raiz) / 2), b = Math.sqrt(Math.max(0, (sum - raiz) / 2)), psi = 0.5 * Math.atan2(2 * Ex * Ey * c, dif), S3 = 2 * Ex * Ey * s;
    const lineal = Math.abs(S3) < 1e-9 * sum, circular = !lineal && Math.abs(b / a - 1) < 1e-9;
    return { a, b, psi: (psi * 180) / Math.PI, tipo: lineal ? 'lineal' : circular ? 'circular' : 'elliptical', giro: lineal ? null : S3 > 0 ? 'antihorario' : 'horario', razon: a ? b / a : 0 };
  }
  function suma(sc) {
    const caso = ['batido', 'estacionaria', 'polarizacion'].includes(sc.caso) ? sc.caso : 'batido', A1 = lee(sc, 'A1', 'the amplitude A₁', { cero: true }), A2 = lee(sc, 'A2', 'the amplitude A₂', { cero: true }), pasos = [];
    if (A1 === 0 && A2 === 0) throw new Error('One of the amplitudes has to be greater than 0');
    const dl = vacio(sc.delta) ? 0 : leeNum(sc.delta);
    if (!isFinite(dl)) throw new Error('The phase difference must be a number (in degrees)');
    const d = (dl * Math.PI) / 180, r = { modo: 'suma', caso, A1, A2, delta: dl };
    if (caso === 'batido') {
      const f1 = lee(sc, 'f1', 'the frequency f₁'), f2 = lee(sc, 'f2', 'the frequency f₂'), df = Math.abs(f1 - f2), fm = (f1 + f2) / 2, w1 = 2 * Math.PI * f1, w2 = 2 * Math.PI * f2;
      const env = (t) => Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos((w1 - w2) * t - d));
      Object.assign(r, { f1, f2, df, fm, Emax: A1 + A2, Emin: Math.abs(A1 - A2), env, Tb: df > 0 ? 1 / df : Infinity, E: (t) => A1 * Math.cos(w1 * t) + A2 * Math.cos(w2 * t + d) });
      pasos.push({ t: 'Two waves with different frequencies', html: `At a fixed point, $E_1 = ${f(A1)} cos(2π ${f(f1)} t)$ and $E_2 = ${f(A2)} cos(2π ${f(f2)} t + ${f(dl)}°)$. They add because Maxwell's equations are linear (superposition principle).` });
      if (df === 0) pasos.push({ t: 'Same frequency: interference', html: `With the same frequency the result is another wave of amplitude $√(A_1^2 + A_2^2 + 2A_1 A_2 cos δ)$ = <b>${f(env(0))} V/m</b> (δ = ${f(dl)}°): constructive if δ = 0° (A₁ + A₂ = ${f(A1 + A2)}) and destructive if δ = 180° (|A₁ − A₂| = ${f(Math.abs(A1 - A2))}).` });
      else {
        pasos.push({ t: 'Beats', html: `If $f_1 ≈ f_2$ the sum is an oscillation at the mean frequency $\\bar f = (f_1 + f_2)/2$ = <b>${f(fm)} Hz</b> with an amplitude that varies slowly between $|A_1 − A_2|$ = ${f(r.Emin)} and $A_1 + A_2$ = ${f(r.Emax)} V/m: $A(t) = √(A_1^2 + A_2^2 + 2A_1 A_2 cos(Δω t − δ))$.` });
        pasos.push({ t: 'Beat frequency', html: `The envelope repeats with $f_b = |f_1 − f_2|$ = <b>${f(df)} Hz</b>, that is every $T_b = 1/f_b$ = ${f(r.Tb)} s.` + (A1 === A2 ? ` With equal amplitudes, $E = 2A cos(π Δf t) cos(2π \\bar f t)$ and the envelope reaches 0.` : '') });
      }
    } else if (caso === 'estacionaria') {
      const fr = lee(sc, 'f1', 'the frequency f'), w = 2 * Math.PI * fr, k = w / C0, lam = C0 / fr, ROE = Math.abs(A1 - A2) < 1e-12 * Math.max(A1, A2) ? Infinity : (A1 + A2) / Math.abs(A1 - A2);
      const env = (z) => Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(2 * k * z + d));
      Object.assign(r, { f1: fr, w, k, lam, ROE, env, Emax: A1 + A2, Emin: Math.abs(A1 - A2), E: (z, t) => A1 * Math.cos(k * z - w * t) + A2 * Math.cos(k * z + w * t + d), Pr: A1 > 0 ? (A2 / A1) ** 2 : null });
      pasos.push({ t: 'Two waves in opposite directions', html: `$E = ${f(A1)} cos(kz − ωt) + ${f(A2)} cos(kz + ωt + ${f(dl)}°)$ with $k = ω/c$ = ${f(k)} rad/m and $λ$ = ${f(lam)} m.` });
      pasos.push({ t: 'Amplitude at each point', html: `Each point oscillates with an amplitude that depends on $z$: $A(z) = √(A_1^2 + A_2^2 + 2A_1 A_2 cos(2kz + δ))$, between $|A_1 − A_2|$ = <b>${f(r.Emin)} V/m</b> (nodes) and $A_1 + A_2$ = <b>${f(r.Emax)} V/m</b> (antinodes). They repeat every $λ/2$ = ${f(lam / 2)} m.` });
      pasos.push({ t: 'Standing wave ratio', html: `$ROE = {A_1 + A_2}/{|A_1 − A_2|}$ = <b>${ROE === Infinity ? '∞ (pure standing wave: the nodes are zero)' : f(ROE)}</b>${A1 > 0 ? `; the reflected power is $(A_2/A_1)^2$ = ${f(100 * r.Pr, 3)} % of the incident` : ''}.` });
    } else {
      const A = lee(sc, 'A1', 'the amplitude A₁'), B2 = lee(sc, 'A2', 'the amplitude A₂'), S = elipse(A, B2, d);
      Object.assign(r, { A1: A, A2: B2, E: S, estado: S });
      pasos.push({ t: 'Two waves with perpendicular polarizations', html: `$E_x = ${f(A)} cos(kz − ωt)$ and $E_y = ${f(B2)} cos(kz − ωt + ${f(dl)}°)$, with the same frequency and direction. At each point the resulting field traces the curve $(E_x/A_1)^2 + (E_y/A_2)^2 − 2 (E_x E_y)/(A_1 A_2) cos δ = sin^2 δ$.` });
      pasos.push({ t: 'Polarization state', html: S.tipo === 'lineal' ? `With δ = ${f(dl)}° (a multiple of 180°) the ellipse flattens into a line: <b>linear</b> polarization, at an angle $ψ$ = <b>${f(S.psi)}°</b> to the x axis and with amplitude ${f(S.a)} V/m.` : S.tipo === 'circular' ? `With $A_1 = A_2$ and $δ = ±90°$ the tip of E describes a circle of radius ${f(S.a)} V/m: <b>circular</b> polarization, ${CARAS[S.giro]}.` : `<b>Elliptical</b> polarization, ${CARAS[S.giro]}: semi-axes $a$ = ${f(S.a)} V/m and $b$ = ${f(S.b)} V/m (b/a = ${f(S.razon)}), with the major axis at $ψ$ = <b>${f(S.psi)}°</b> to the x axis.` });
      pasos.push({ t: 'Semi-axes', html: `$a^2, b^2 = {1}/{2}[A_1^2 + A_2^2 ± √((A_1^2 − A_2^2)^2 + 4 A_1^2 A_2^2 cos^2 δ)]$ and $tan 2ψ = {2 A_1 A_2 cos δ}/{A_1^2 − A_2^2}$. $a^2 + b^2 = A_1^2 + A_2^2$ = ${f(A * A + B2 * B2)} holds.` });
    }
    r.pasos = pasos;
    return r;
  }

  const cx = (re, im = 0) => [re, im], cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mv = (M, v) => [cadd(cmul(M[0][0], v[0]), cmul(M[0][1], v[1])), cadd(cmul(M[1][0], v[0]), cmul(M[1][1], v[1]))];
  const mm = (A, B) => [[cadd(cmul(A[0][0], B[0][0]), cmul(A[0][1], B[1][0])), cadd(cmul(A[0][0], B[0][1]), cmul(A[0][1], B[1][1]))], [cadd(cmul(A[1][0], B[0][0]), cmul(A[1][1], B[1][0])), cadd(cmul(A[1][0], B[0][1]), cmul(A[1][1], B[1][1]))]];
  const rot = (t) => [[cx(Math.cos(t)), cx(Math.sin(t))], [cx(-Math.sin(t)), cx(Math.cos(t))]];
  const jonesElem = (tipo, th) => { const D = tipo === 'pol' ? [[cx(1), cx(0)], [cx(0), cx(0)]] : tipo === 'l4' ? [[cx(1), cx(0)], [cx(0), cx(0, 1)]] : [[cx(1), cx(0)], [cx(0), cx(-1)]]; return mm(rot(-th), mm(D, rot(th))); };
  const cTxt = (z) => { const a = Math.abs(z[0]) < 1e-9 ? 0 : z[0], b = Math.abs(z[1]) < 1e-9 ? 0 : z[1]; return b === 0 ? f(a, 3) : a === 0 ? `${f(b, 3)}i` : `${f(a, 3)} ${b < 0 ? '−' : '+'} ${f(Math.abs(b), 3)}i`; };
  const matTxt = (M) => `[[${cTxt(M[0][0])}, ${cTxt(M[0][1])}], [${cTxt(M[1][0])}, ${cTxt(M[1][1])}]]`;
  function estadoJones(J) {
    const I = J[0][0] ** 2 + J[0][1] ** 2 + J[1][0] ** 2 + J[1][1] ** 2;
    if (I < 1e-18) return { I: 0, tipo: 'no light' };
    const S1 = J[0][0] ** 2 + J[0][1] ** 2 - J[1][0] ** 2 - J[1][1] ** 2, S2 = 2 * (J[0][0] * J[1][0] + J[0][1] * J[1][1]), S3 = 2 * (J[0][0] * J[1][1] - J[0][1] * J[1][0]);
    const psi = (0.5 * Math.atan2(S2, S1) * 180) / Math.PI, chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, S3 / I))), lineal = Math.abs(S3 / I) < 1e-6, circ = Math.abs(S3 / I) > 1 - 1e-9;
    return { I, tipo: lineal ? 'lineal' : circ ? 'circular' : 'elliptical', psi, razon: Math.abs(Math.tan(chi)), giro: lineal ? null : S3 > 0 ? 'antihorario' : 'horario', S: [S1 / I, S2 / I, S3 / I] };
  }
  const NOMEL = { pol: 'Polarizer', l4: 'λ/4 plate', l2: 'λ/2 plate' };
  const txtEstado = (e) => (e.tipo === 'no light' ? 'no light passes' : e.tipo === 'lineal' ? `linear at ${f(e.psi, 4)}° to the x axis` : e.tipo === 'circular' ? `circular ${e.giro === 'antihorario' ? 'a izquierdas (antihoraria)' : 'a derechas (horaria)'}` : `elliptical ${e.giro === 'antihorario' ? 'left-handed (anticlockwise)' : 'right-handed (clockwise)'}, b/a = ${f(e.razon, 3)}, major axis at ${f(e.psi, 4)}°`);
  function retardo(sc) {
    const luz = ['lineal', 'circI', 'circD'].includes(sc.luz) ? sc.luz : 'lineal', alfa = luz === 'lineal' ? (vacio(sc.alfa) ? 0 : leeNum(sc.alfa)) : 0, pasos = [];
    if (!isFinite(alfa)) throw new Error('The light angle must be a number (in degrees)');
    const R2 = Math.SQRT1_2, ai = (alfa * Math.PI) / 180;
    let J = luz === 'lineal' ? [[cx(Math.cos(ai)), cx(0)], [cx(Math.sin(ai)), cx(0)]].map((r) => r[0]) : luz === 'circI' ? [cx(R2), cx(0, R2)] : [cx(R2), cx(0, -R2)];
    const elems = [];
    for (let i = 1; i <= 4; i++) { const t = sc['e' + i]; if (!t) continue; if (!NOMEL[t]) throw new Error(`Element ${i} is not valid`); const a = vacio(sc['a' + i]) ? 0 : leeNum(sc['a' + i]); if (!isFinite(a)) throw new Error(`The angle of element ${i} must be a number`); elems.push({ t, a }); }
    if (!elems.length) throw new Error('Choose at least one element (polarizer or plate)');
    pasos.push({ t: 'Jones calculus', html: `Polarized light is described by the vector $E = (E_x, E_y)$ with complex components and each element by a 2×2 matrix: $E_{out} = M · E_{in}$. Polarizer at θ: $M = [[cos^2 θ, cos θ sin θ], [cos θ sin θ, sin^2 θ]]$. Retarder plate with fast axis at θ: $M = R(−θ) · diag(1, e^{jΓ}) · R(θ)$, with $Γ = 90°$ ($λ/4$) or $180°$ ($λ/2$).` });
    pasos.push({ t: 'Input light', html: `${luz === 'lineal' ? `Linear at ${f(alfa)}°: $E = (cos α, sin α)$ = (${f(Math.cos(ai), 4)}; ${f(Math.sin(ai), 4)})` : luz === 'circI' ? 'Left-handed circular: $E = (1, j)/√2$' : 'Right-handed circular: $E = (1, −j)/√2$'}. Intensity 1 (relative).` });
    const etapas = [{ nombre: 'Input', I: 1, estado: estadoJones([[J[0][0], J[0][1]], [J[1][0], J[1][1]]]), J: J.map((z) => z.slice()) }];
    elems.forEach((e, i) => {
      const M = jonesElem(e.t, (e.a * Math.PI) / 180); J = mv(M, J);
      const est = estadoJones([[J[0][0], J[0][1]], [J[1][0], J[1][1]]]);
      etapas.push({ nombre: `${NOMEL[e.t]} a ${f(e.a)}°`, I: est.I, estado: est, J: J.map((z) => z.slice()), M });
      pasos.push({ t: `${i + 1}. ${NOMEL[e.t]} (axis at ${f(e.a)}°)`, html: `$M$ = ${matTxt(M)}<br>$E$ = (${cTxt(J[0])}; ${cTxt(J[1])}), $I$ = <b>${f(est.I, 4)}</b>: ${txtEstado(est)} light.` });
    });
    const fin = etapas[etapas.length - 1];
    pasos.push({ t: 'Result', html: `${txtEstado(fin.estado)} light comes out with an intensity of <b>${f(100 * fin.I, 4)} %</b> of the input.` + (fin.estado.tipo === 'lineal' && etapas.length > 1 ? '' : '') });
    return { modo: 'retardo', luz, alfa, elems, etapas, I: fin.I, estado: fin.estado, texto: txtEstado(fin.estado), pasos };
  }

  const MODOS = { plasma, suma, retardo, onda, expresion, incidencia, intensidad, perdidas, polarizadores, poynting };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : onda(sc); }

  const ejemplos = [
    { clave: 'fm', nombre: 'FM radio wave in vacuum', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '100e6', E0: '0,05', prop: '+z', pol: '+x', er: '', mr: '' } },
    { clave: 'laser', nombre: 'Light from a red laser (λ = 633 nm)', sc: { modo: 'onda', medio: 'vacio', dato: 'lambda', valor: '633e-9', E0: '1000', prop: '+x', pol: '+y', er: '', mr: '' } },
    { clave: 'agua', nombre: 'Light entering water', sc: { modo: 'onda', medio: 'medio', dato: 'f', valor: '5e14', E0: '200', prop: '+z', pol: '+y', er: '1,77', mr: '1' } },
    { clave: 'expresion', nombre: 'From k: E = 30 cos(2.09y + ωt) k̂', sc: { modo: 'onda', medio: 'vacio', dato: 'k', valor: '2,094', E0: '30', prop: '-y', pol: '+z', er: '', mr: '' } },
    { clave: 'dielectrico', nombre: 'Microwaves in a dielectric (εr = 4)', sc: { modo: 'onda', medio: 'medio', dato: 'f', valor: '2,45e9', E0: '100', prop: '+z', pol: '+x', er: '4', mr: '1' } },
    { clave: 'diagonal', nombre: 'Diagonal wave with initial phase', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '3e9', E0: '10', prop: 'otra', kx: '1', ky: '1', kz: '0', pol: '+z', er: '', mr: '', fase: '60' } },
    { clave: 'circular', nombre: 'Circular polarization', sc: { modo: 'onda', medio: 'vacio', dato: 'lambda', valor: '0,03', E0: '20', prop: '+z', pol: '+x', er: '', mr: '', tipoPol: 'circular', giro: 'antihorario' } },
    { clave: 'eliptica', nombre: 'Elliptical polarization', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '1e9', E0: '30', prop: '+x', pol: '+y', er: '', mr: '', tipoPol: 'eliptica', E02: '15', delta: '-90' } },
    { clave: 'expr-E', nombre: 'From E(r, t) = 30 cos(2.094y + 6.283·10⁸t) k̂', sc: { modo: 'expresion', campo: 'E', expr: '30 cos(2,094y + 6,283e8t) k' } },
    { clave: 'expr-B', nombre: 'From B(r, t) in a glass', sc: { modo: 'expresion', campo: 'B', expr: '2e-7 sen(1,5e7z - 3e15t) j' } },
    { clave: 'conductor', nombre: 'Standing wave against a conductor', sc: { modo: 'incidencia', destino: 'conductor', medio: 'vacio', dato: 'f', valor: '1e9', E0: '50', er: '', mr: '', er2: '', mr2: '' } },
    { clave: 'vidrio', nombre: 'Light arriving from air to glass', sc: { modo: 'incidencia', destino: 'dielectrico', medio: 'vacio', dato: 'lambda', valor: '600e-9', E0: '100', er: '', mr: '', er2: '2,25', mr2: '' } },
    { clave: 'sol', nombre: 'Sunlight on Earth', sc: { modo: 'intensidad', medio: 'vacio', de: 'I', I: '1361', P: '', r: '', E0: '', A: '1' } },
    { clave: 'bombilla', nombre: '100 W light bulb at 2 m', sc: { modo: 'intensidad', medio: 'vacio', de: 'fuente', P: '100', r: '2', I: '', E0: '', A: '' } },
    { clave: 'antena', nombre: '50 kW antenna at 10 km', sc: { modo: 'intensidad', medio: 'vacio', de: 'fuente', P: '50000', r: '10000', I: '', E0: '', A: '' } },
    { clave: 'vela', nombre: 'Solar sail that reflects (E₀ given)', sc: { modo: 'intensidad', medio: 'vacio', de: 'E0', E0: '1012', P: '', r: '', I: '', A: '100' } },
    { clave: 'malus', nombre: 'Malus\'s law: linear light at 30° to a polarizer', sc: { modo: 'polarizadores', luz: 'lineal', alfa: '0', I0: '100', angulos: '30' } },
    { clave: 'tres-polarizadores', nombre: 'Natural light through three polarizers (0°, 45°, 90°)', sc: { modo: 'polarizadores', luz: 'natural', I0: '1000', angulos: '0; 45; 90' } },
    { clave: 'cruzados', nombre: 'Two crossed polarizers (0° and 90°)', sc: { modo: 'polarizadores', luz: 'natural', I0: '1000', angulos: '0; 90' } },
    { clave: 'poy-hilo', nombre: 'Poynting in a copper wire carrying current', sc: { modo: 'poynting', sis: 'hilo', a: '1e-3', L: '2', I: '10', sigma: '5,8e7' } },
    { clave: 'poy-condensador', nombre: 'Poynting in a capacitor being charged', sc: { modo: 'poynting', sis: 'condensador', a: '0,05', d: '0,002', V: '100', I: '0,5' } },
    { clave: 'poy-coaxial', nombre: 'Power through a coaxial cable', sc: { modo: 'poynting', sis: 'coaxial', a: '1e-3', b: '3,5e-3', V: '50', I: '2', r: '' } },
    { clave: 'plasma-iono', nombre: 'Ionosphere (nₑ = 10¹² m⁻³): does a 5 MHz wave bounce?', sc: { modo: 'plasma', ne: '1e12', valor: '5e6', ang: '' } },
    { clave: 'plasma-obl', nombre: 'Ionosphere with 60° oblique incidence (15 MHz wave)', sc: { modo: 'plasma', ne: '1e12', valor: '15e6', ang: '60' } },
    { clave: 'plasma-metal', nombre: 'Electrons of a metal (sodium): transparent to ultraviolet', sc: { modo: 'plasma', ne: '2,5e28', valor: '2e15', ang: '' } },
    { clave: 'suma-batido', nombre: 'Beats: two waves of 100 and 110 Hz', sc: { modo: 'suma', caso: 'batido', A1: '1', A2: '1', f1: '100', f2: '110', delta: '' } },
    { clave: 'suma-estacionaria', nombre: 'Partial standing wave: incident and reflected at 1 GHz', sc: { modo: 'suma', caso: 'estacionaria', A1: '10', A2: '4', f1: '1e9', f2: '', delta: '180' } },
    { clave: 'suma-circular', nombre: 'Two orthogonal waves with δ = 90°: circular polarization', sc: { modo: 'suma', caso: 'polarizacion', A1: '10', A2: '10', f1: '', f2: '', delta: '90' } },
    { clave: 'suma-eliptica', nombre: 'Two orthogonal waves with δ = 60°: elliptical polarization', sc: { modo: 'suma', caso: 'polarizacion', A1: '10', A2: '6', f1: '', f2: '', delta: '60' } },
    { clave: 'ret-circular', nombre: 'λ/4 plate at 45°: from linear to circular', sc: { modo: 'retardo', luz: 'lineal', alfa: '0', e1: 'l4', a1: '45', e2: '', a2: '', e3: '', a3: '', e4: '', a4: '' } },
    { clave: 'ret-media', nombre: 'λ/2 plate between crossed polarizers: it rotates the polarization', sc: { modo: 'retardo', luz: 'lineal', alfa: '0', e1: 'pol', a1: '0', e2: 'l2', a2: '45', e3: 'pol', a3: '90', e4: '', a4: '' } },
    { clave: 'ret-analizador', nombre: 'Circular light that becomes linear with λ/4 and analyser', sc: { modo: 'retardo', luz: 'circI', alfa: '', e1: 'l4', a1: '0', e2: 'pol', a2: '135', e3: '', a3: '', e4: '', a4: '' } },
    { clave: 'cobre', nombre: 'Copper at 1 MHz (good conductor)', sc: { modo: 'perdidas', er: '1', mr: '1', sigma: '5,8e7', valor: '1e6', E0: '1', d: '0,0001' } },
    { clave: 'mar', nombre: 'Seawater at 1 kHz', sc: { modo: 'perdidas', er: '81', mr: '1', sigma: '4', valor: '1000', E0: '1', d: '10' } },
    { clave: 'tierra', nombre: 'Moist soil at 1 MHz', sc: { modo: 'perdidas', er: '10', mr: '1', sigma: '0,01', valor: '1e6', E0: '10', d: '5' } },
    { clave: 'baquelita', nombre: 'Low-loss dielectric', sc: { modo: 'perdidas', er: '4,9', mr: '1', sigma: '1e-6', valor: '1e8', E0: '5', d: '100' } },
  ];
  return { resolver, plasma, suma, retardo, elipse, estadoJones, jonesElem, onda, expresion, incidencia, intensidad, perdidas, polarizadores, poynting, leeExpresion, banda, ejemplos, f, C0, MU0, EPS0 };
})();

