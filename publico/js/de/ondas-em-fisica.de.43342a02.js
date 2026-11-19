const OndasEM = (() => {
  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const C0 = SI.c, MU0 = 1.25663706212e-6, EPS0 = 8.8541878128e-12;
  const f = (x, d = 4) => {
    if (!isFinite(x)) return x > 0 ? '∞' : '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace(/e([+-])(\d+)/, (_, sg, e) => `·10<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−').replace(/^(−?)1·10/, '$110');
  };
  const leeNum0 = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/^(-?)10\^/, '$11e').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
  const leeNum = (s) => { const u = typeof Herramienta !== 'undefined' ? Herramienta.leeUn(s) : undefined; return u !== undefined ? u : leeNum0(s); }; // admite «4 mm», «2,4 GHz», «10 pF»
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const may = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} fehlt`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} muss eine Zahl sein (3e8 oder 3·10^8 sind erlaubt)`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${may(nom)} muss ${cero ? 'positiv oder null' : 'größer als 0'} sein`);
    return v;
  }

  const EJES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const GORRO = { x: 'î', y: 'ĵ', z: 'k̂' };
  const dir = (s) => { const m = /^([+-]?)([xyz])$/.exec(s || ''); if (!m) throw new Error('Ungültige Richtung'); const e = EJES[m[2]].map((c) => (m[1] === '-' ? -c : c)); return { v: e, eje: m[2], signo: m[1] === '-' ? -1 : 1 }; };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nomDir = (v) => { const i = v.findIndex((c) => Math.abs(c) > 0.5); return `${v[i] < 0 ? '−' : ''}${GORRO['xyz'[i]]}`; };
  const unit = (v) => { const n = Math.hypot(...v); return v.map((c) => (Math.abs(c / n) < 1e-12 ? 0 : c / n)); };
  const enEje = (v) => v.filter((c) => Math.abs(c) > 1e-12).length === 1;
  const vecTxt = (v) => (enEje(v) ? nomDir(v) : `(${v.map((c, i) => (Math.abs(c) < 1e-12 ? '' : `${c < 0 ? '− ' : '+ '}${f(Math.abs(c))} ${GORRO['xyz'[i]]}`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−')})`);
  const dirExp = (v) => { const t = vecTxt(v); return t[0] === '−' ? `(${t})` : t; };
  const dirTxt = (v) => (enEje(v) ? (() => { const i = v.findIndex((c) => Math.abs(c) > 0.5); return `${v[i] < 0 ? '−' : '+'}${'xyz'[i]}`; })() : vecTxt(v));
  function vecDe(sc, k, p, nom) {
    if (sc[k] !== 'otra') { const d = dir(sc[k]); return { v: d.v, eje: d.eje, signo: d.signo }; }
    const v = ['x', 'y', 'z'].map((e) => { const x = leeNum(vacio(sc[p + e]) ? '0' : sc[p + e]); if (!isFinite(x)) throw new Error(`Die Komponente ${e} von ${nom} muss eine Zahl sein`); return x; });
    if (!(Math.hypot(...v) > 0)) throw new Error(`Gib eine Komponente von ${nom} ein`);
    const u = unit(v), i = u.findIndex((c) => Math.abs(c) > 1 - 1e-12);
    return { v: u, eje: i >= 0 ? 'xyz'[i] : null, signo: i >= 0 ? Math.sign(u[i]) : 1 };
  }
  const kr = (kv, k) => kv.map((c, i) => (Math.abs(c) < 1e-12 ? '' : `${c < 0 ? '− ' : '+ '}${f(Math.abs(c * k))}${'xyz'[i]}`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−');

  const COLORES = [[380, 'violeta'], [450, 'azul'], [495, 'verde'], [570, 'amarillo'], [590, 'naranja'], [620, 'rojo'], [750, '']];
  function banda(fr) {
    const l = C0 / fr;
    if (l > 1) return 'Radiowellen';
    if (l > 1e-3) return 'microondas';
    if (l > 750e-9) return 'infrarrojo';
    if (l >= 380e-9) { const nm = l * 1e9; let c = 'rojo'; for (let i = 0; i < COLORES.length - 1; i++) if (nm >= COLORES[i][0] && nm < COLORES[i + 1][0]) c = COLORES[i][1]; return `luz visible (${c})`; }
    if (l > 10e-9) return 'ultravioleta';
    if (l > 10e-12) return 'rayos X';
    return 'rayos gamma';
  }

  function medio(sc) {
    const vacioM = sc.medio !== 'medio';
    const er = vacioM ? 1 : lee(sc, 'er', 'die relative Permittivität εr'), mr = vacioM || vacio(sc.mr) ? 1 : lee(sc, 'mr', 'die relative Permeabilität μr');
    const eps = er * EPS0, mu = mr * MU0, v = 1 / Math.sqrt(eps * mu), n = Math.sqrt(er * mr), eta = Math.sqrt(mu / eps);
    return { vacioM, er, mr, eps, mu, v, n, eta };
  }
  function frecuencia(sc, v) {
    const dato = ['f', 'lambda', 'omega', 'k'].includes(sc.dato) ? sc.dato : 'f';
    const x = lee(sc, 'valor', { f: 'die Frequenz f', lambda: 'die Wellenlänge λ', omega: 'die Kreisfrequenz ω', k: 'die Wellenzahl k' }[dato]);
    const fr = dato === 'f' ? x : dato === 'lambda' ? v / x : dato === 'omega' ? x / (2 * Math.PI) : (x * v) / (2 * Math.PI);
    return { dato, x, fr, w: 2 * Math.PI * fr, k: (2 * Math.PI * fr) / v, lam: v / fr, T: 1 / fr };
  }
  const medioTxt = (M) => (M.vacioM ? 'Im Vakuum: $v = c = 1/√(μ_0 ε_0)$ = 2,998·10<sup>8</sup> m/s, $η_0 = √(μ_0/ε_0)$ = 376,7 Ω'
    : `Medium mit ε<sub>r</sub> = ${f(M.er)}${M.mr !== 1 ? ` und μ<sub>r</sub> = ${f(M.mr)}` : ''}: Brechungsindex $n = √(ε_r μ_r)$ = ${f(M.n)}, $v = c/n$ = ${f(M.v)} m/s, $η = √(μ/ε) = η_0 √(μ_r/ε_r)$ = ${f(M.eta)} Ω`);

  function onda(sc) {
    const M = medio(sc), F = frecuencia(sc, M.v), E0 = lee(sc, 'E0', 'die Amplitude E₀'), pasos = [...(sc.previos || [])];
    const K = vecDe({ prop: '+z', ...sc }, 'prop', 'k', 'die Ausbreitungsrichtung'), Ed = vecDe({ pol: '+x', ...sc }, 'pol', 'e', 'die Richtung von E');
    if (Math.abs(K.v[0] * Ed.v[0] + K.v[1] * Ed.v[1] + K.v[2] * Ed.v[2]) > 1e-9) throw new Error('E muss senkrecht zur Ausbreitungsrichtung stehen (die Welle ist transversal)');
    const Bv = cruz(K.v, Ed.v).map((c) => (Math.abs(c) < 1e-12 ? 0 : c)), B0 = E0 / M.v;
    const phiG = vacio(sc.fase) ? 0 : leeNum(sc.fase), phi = (phiG * Math.PI) / 180;
    if (!isFinite(phi)) throw new Error('Die Phase muss eine Zahl sein (in Grad)');
    const tp = ['circular', 'eliptica'].includes(sc.tipoPol) ? sc.tipoPol : 'lineal';
    const E02 = tp === 'circular' ? E0 : tp === 'eliptica' ? lee(sc, 'E02', 'die zweite Amplitude E₀₂', { cero: true }) : 0;
    const dG = tp === 'circular' ? (sc.giro === 'horario' ? -90 : 90) : tp === 'eliptica' ? leeNum(vacio(sc.delta) ? '90' : sc.delta) : 0, dl = (dG * Math.PI) / 180;
    if (!isFinite(dl)) throw new Error('Die Phasenverschiebung δ muss eine Zahl sein (in Grad)');
    if (!sc.previos) pasos.push({ t: 'Mittel', html: medioTxt(M) });
    const fTxt = { f: `f = ${f(F.fr)} Hz ⇒ $ω = 2π f$ = ${f(F.w)} rad/s`, lambda: `λ = ${f(F.x)} m ⇒ $f = v/λ = ${f(M.v)}/${f(F.x)}$ = ${f(F.fr)} Hz, $ω = 2π f$ = ${f(F.w)} rad/s`, omega: `ω = ${f(F.w)} rad/s ⇒ $f = ω/(2π)$ = ${f(F.fr)} Hz`, k: `k = ${f(F.x)} rad/m ⇒ $ω = k v$ = ${f(F.w)} rad/s, f = ${f(F.fr)} Hz` }[F.dato];
    pasos.push({ t: 'Frequenz, Wellenlänge und Wellenzahl', html: `${fTxt}<br>$λ = v/f$ = <b>${f(F.lam)} m</b>, &ensp; $k = {2π}/λ = ω/v$ = <b>${f(F.k)} rad/m</b>, &ensp; $T = 1/f$ = ${f(F.T)} s${M.vacioM ? '' : `<br>Im Vakuum wäre $λ_0 = c/f$ = ${f(C0 / F.fr)} m: im Medium gilt $λ = {λ_0}/n$.`}<br>Spektralbereich: ${banda(F.fr)}` });
    const ar = K.eje ? K.eje : 'r', fTxt2 = phi ? ` ${phi < 0 ? '−' : '+'} ${f(Math.abs(phi))}` : '';
    const fase = K.eje ? `${f(F.k)}${ar} ${K.signo > 0 ? '−' : '+'} ${f(F.w)}t${fTxt2}` : `${kr(K.v, F.k)} − ${f(F.w)}t${fTxt2}`;
    const fase2 = (d) => (d ? `${fase} ${d < 0 ? '−' : '+'} ${f(Math.abs(d))}` : fase), menosE1 = Ed.v.map((c) => (c ? -c : 0));
    const Eexp = tp === 'lineal' ? `E(${ar}, t) = ${f(E0)} cos(${fase}) ${dirExp(Ed.v)} V/m` : `E(${ar}, t) = ${f(E0)} cos(${fase}) ${dirExp(Ed.v)} + ${f(E02)} cos(${fase2(dl)}) ${dirExp(Bv)} V/m`;
    const Bexp = tp === 'lineal' ? `B(${ar}, t) = ${f(B0)} cos(${fase}) ${dirExp(Bv)} T` : `B(${ar}, t) = ${f(B0)} cos(${fase}) ${dirExp(Bv)} + ${f(E02 / M.v)} cos(${fase2(dl)}) ${dirExp(menosE1)} T`;
    const ek = (v) => (vecTxt(v)[0] === '−' ? `(${vecTxt(v)})` : vecTxt(v));
    pasos.push({ t: 'Magnetfeld', html: `In einer ebenen Welle stehen E, B und die Ausbreitungsrichtung senkrecht aufeinander, und $B_0 = {E_0}/v = ${f(E0)}/{${f(M.v)}}$ = <b>${f(B0)} T</b><br>Die Richtung von B ergibt sich aus k̂ = Ê × B̂, also B̂ = k̂ × Ê = ${ek(K.v)} × ${ek(Ed.v)} = <b>${vecTxt(Bv)}</b>` });
    if (tp !== 'lineal') {
      const forma = tp === 'circular' || (Math.abs(E02 - E0) < 1e-12 * E0 && Math.abs(Math.abs(dG) - 90) < 1e-9) ? 'circular' : Math.abs(Math.sin(dl)) < 1e-12 || E02 === 0 ? 'lineal' : 'elliptisch', gira = Math.sin(dl) > 0 ? 'antihorario' : 'horario';
      pasos.push({ t: 'Polarisation', html: `E ist die Summe zweier senkrechter Wellen: E<sub>01</sub> = ${f(E0)} V/m in Richtung ${vecTxt(Ed.v)} und E<sub>02</sub> = ${f(E02)} V/m in Richtung k̂ × Ê = ${vecTxt(Bv)}, mit der Phasenverschiebung δ = ${f(dG)}°. ${forma === 'lineal' ? 'Bei δ = 0° oder 180° bleiben sie in Phase, und die Polarisation bleibt <b>linear</b>, geneigt.' : `In einem festen Punkt beschreibt die Spitze von E ${forma === 'circular' ? 'einen <b>Kreis</b> (zirkulare Polarisation: E<sub>01</sub> = E<sub>02</sub> und δ = ±90°)' : 'eine <b>Ellipse</b> (elliptische Polarisation)'} und dreht sich im <b>${gira}</b> Sinn, vom Empfänger der Welle aus gesehen (zur Quelle blickend).`}${forma === 'circular' ? ` |E| ist konstant, ${f(E0)} V/m.` : ''}` });
    }
    const pref = phi ? `, mit Anfangsphase φ = ${f(phiG)}° = ${f(phi)} rad` : '';
    pasos.push({ t: 'Ausdrücke', html: `Mit der Form cos(k·r − ωt + φ), die in Richtung ${dirTxt(K.v)} fortschreitet${K.eje ? '' : ` (k = k k̂ = ${kr(K.v, F.k).replace(/([xyz])/g, (m) => ` ${GORRO[m]}`)} rad/m)`}${pref}:<br>${Eexp}<br>${Bexp}` });
    const I = (E0 * E0 + E02 * E02) / (2 * M.eta), u = 0.5 * M.eps * (E0 * E0 + E02 * E02);
    pasos.push({ t: 'Energie und Intensität', html: `Poynting-Vektor $S = {E × B}/μ$, in Richtung ${vecTxt(K.v)}. Sein Mittelwert ist die Intensität:<br>${tp === 'lineal' ? `$I = {E_0^2}/{2η} = {${f(E0)}^2}/{2·${f(M.eta)}}$` : `$I = {E_01^2 + E_02^2}/{2η} = {${f(E0)}^2 + ${f(E02)}^2}/{2·${f(M.eta)}}$`} = <b>${f(I)} W/m<sup>2</sup></b><br>Mittlere Energiedichte $u = 1/2 ε E_0^2$ = ${f(u)} J/m<sup>3</sup> (die Hälfte in E und die Hälfte in B), und $I = u v$.<br>Effektivwerte: $E_eff = {E_0}/√2$ = ${f(E0 / Math.SQRT2)} V/m, B<sub>eff</sub> = ${f(B0 / Math.SQRT2)} T` });
    pasos.push({ t: 'Strahlungsdruck', html: `Auf eine Fläche, die sie absorbiert, gilt $p = I/v$ = ${f(I / M.v)} Pa; wird sie vollständig reflektiert, $p = {2I}/v$ = ${f((2 * I) / M.v)} Pa.` });
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
    if (fin < 0) throw new Error('Schreibe die Welle als E₀ cos(k·r − ωt + φ) und ihre Richtung, z. B. 30 cos(2,09y + 6,28e8t) k');
    const m = [s, m0[1], m0[2], s.slice(m0[0].length, fin), s.slice(fin + 1).trim()];
    let amp = m[1].replace(/[·*×\s]/g, '') || '1'; if (amp === '-') amp = '-1'; if (amp === '+') amp = '1';
    const A = numPi(amp);
    if (!isFinite(A) || A === 0) throw new Error('Ich verstehe die Amplitude des Ausdrucks nicht');
    const c = { x: 0, y: 0, z: 0, t: 0, '': 0 };
    const arg = m[3].replace(/\s/g, '').replace(/(\d)([eE])([+\-]?\d)/g, '$1E$3');
    const terms = arg.match(/[+\-]?[^+\-]+(?:E[+\-]?\d+[^+\-]*)?/g) || [];
    for (const t0 of terms) {
      const t = t0.replace(/E/g, 'e'), v = /([xyzt])$/.exec(t), var_ = v ? v[1] : '', num = var_ ? t.slice(0, -1).replace(/[·*]$/, '') : t;
      const x = numPi(num === '' || num === '+' ? '1' : num === '-' ? '-1' : num);
      if (!isFinite(x)) throw new Error(`Ich verstehe den Term „${t0}“ der Phase nicht`);
      c[var_] += x;
    }
    let d = m[4].replace(/\s/g, '').replace(/V\/m|T$/i, ''), sg = 1;
    if (d[0] === '-') { sg = -1; d = d.slice(1); }
    let dv;
    const vec = /^\(([^,]+),([^,]+),([^,]+)\)$/.exec(d.replace(/;/g, ','));
    if (vec) dv = vec.slice(1).map((x) => numPi(x));
    else { const e = { 'î': 'x', 'ĵ': 'y', 'k̂': 'z', i: 'x', j: 'y', k: 'z', x: 'x', y: 'y', z: 'z', ux: 'x', uy: 'y', uz: 'z', u_x: 'x', u_y: 'y', u_z: 'z' }[d.normalize('NFC')] || { 'x̂': 'x', 'ŷ': 'y', 'ẑ': 'z' }[d]; if (!e) throw new Error('Am Ende fehlt die Feldrichtung: î, ĵ, k̂ oder ein Vektor (a, b, c)'); dv = EJES[e].slice(); }
    if (dv.some((x) => !isFinite(x)) || !(Math.hypot(...dv) > 0)) throw new Error('Die Feldrichtung ist ungültig');
    return { A: A * sg, c, dv, func: m[2].toLowerCase() };
  }
  function expresion(sc) {
    const campo = sc.campo === 'B' ? 'B' : 'E', X = leeExpresion(sc.expr), pasos = [];
    let kv = [X.c.x, X.c.y, X.c.z], w = -X.c.t, phi = X.c[''];
    if (X.func === 'sin') phi -= Math.PI / 2;
    if (!(Math.hypot(...kv) > 0)) throw new Error('Der räumliche Teil der Phase fehlt (Terme in x, y oder z)');
    if (!w) throw new Error('Der Term in t der Phase fehlt');
    let nota = '';
    if (w < 0) { kv = kv.map((c) => -c); w = -w; phi = -phi; nota = ' Da der Kosinus gerade ist, gilt cos(k·r + ωt + φ) = cos(−k·r − ωt − φ): Die Welle läuft in Richtung −k.'; }
    const k = Math.hypot(...kv), v = w / k, n = C0 / v, amp = Math.abs(X.A) * Math.hypot(...X.dv), dv = unit(X.dv).map((c) => c * Math.sign(X.A)), kh = unit(kv);
    pasos.push({ t: 'Lesen des Ausdrucks', html: `${X.func === 'sen' ? 'sin θ = cos(θ − π/2). ' : ''}Im Vergleich mit ${campo}<sub>0</sub> cos(k·r − ωt + φ): Amplitude ${campo}<sub>0</sub> = <b>${f(amp)} ${campo === 'E' ? 'V/m' : 'T'}</b> in Richtung ${vecTxt(dv)}, k = (${kv.map((c) => f(c)).join(', ')}) rad/m, mit dem Betrag k = <b>${f(k)} rad/m</b>, ω = <b>${f(w)} rad/s</b>${phi ? ` und φ = ${f(phi)} rad` : ''}.${nota} Sie breitet sich in Richtung ${vecTxt(kh)} aus.` });
    if (n < 1 - 1e-3) throw new Error(`Mit diesen k und ω würde die Welle mit ω/k = ${f(v).replace(/<[^>]+>/g, '')} m/s laufen, schneller als das Licht: Überprüfe den Ausdruck`);
    const enVacio = Math.abs(n - 1) < 2e-3;
    pasos.push({ t: 'Geschwindigkeit und Medium', html: `$v = ω/k = ${f(w)}/{${f(k)}}$ = <b>${f(v)} m/s</b>${enVacio ? ': Das ist c, die Welle läuft also im Vakuum (oder in Luft).' : `, kleiner als c: Sie läuft in einem Medium mit dem Brechungsindex $n = c/v$ = <b>${f(n)}</b> (bei μ<sub>r</sub> = 1 gilt $ε_r = n^2$ = ${f(n * n)}).`}` });
    if (Math.abs(kh[0] * dv[0] + kh[1] * dv[1] + kh[2] * dv[2]) > 1e-6) throw new Error(`Das Feld ${campo} steht nicht senkrecht zu k: Es ist keine transversale ebene Welle`);
    let ev = dv, E0 = amp;
    const vMedio = enVacio ? C0 : v;
    if (campo === 'B') { ev = cruz(dv, kh); E0 = amp * vMedio; pasos.push({ t: 'Elektrisches Feld', html: `$E_0 = v B_0 = ${f(vMedio)}·${f(amp)}$ = <b>${f(E0)} V/m</b>, und da B̂ = k̂ × Ê, ist die Richtung von E gleich Ê = B̂ × k̂ = ${vecTxt(unit(ev))}.` }); }
    const e = unit(ev), num = (x) => String(+x.toPrecision(12));
    const sc2 = { modo: 'onda', medio: enVacio ? 'vacio' : 'medio', er: num(n * n), mr: '1', dato: 'omega', valor: num(w), E0: num(E0), prop: 'otra', kx: num(kh[0]), ky: num(kh[1]), kz: num(kh[2]), pol: 'otra', ex: num(e[0]), ey: num(e[1]), ez: num(e[2]), fase: num((phi * 180) / Math.PI), previos: pasos };
    const r = onda(sc2);
    return { ...r, modo: 'expresion', campo, leido: { k, w, phi, amp } };
  }

  function incidencia(sc) {
    const M = medio(sc), F = frecuencia(sc, M.v), E0 = lee(sc, 'E0', 'die Amplitude E₀ der einfallenden Welle'), pasos = [], cond = sc.destino !== 'dielectrico';
    const I0 = (E0 * E0) / (2 * M.eta), B0 = E0 / M.v;
    pasos.push({ t: 'Zielmedium', html: `${medioTxt(M)}<br>λ = ${f(F.lam)} m, k = ${f(F.k)} rad/m. Die Welle kommt aus z < 0 in Richtung +z: E<sub>i</sub> = ${f(E0)} cos(kz − ωt) î V/m, mit $I_i = {E_0^2}/{2η}$ = ${f(I0)} W/m<sup>2</sup>.` });
    if (cond) {
      const K = (2 * B0) / M.mu;
      pasos.push({ t: 'Reflektierte Welle', html: 'Im Inneren eines perfekten Leiters ist E = 0, und da die tangentiale Komponente von E stetig ist, gilt E = 0 an der Oberfläche z = 0. Das erfordert eine reflektierte Welle E<sub>r</sub> = −E<sub>0</sub> cos(kz + ωt) î: Der Reflexionskoeffizient ist <b>r = −1</b>, und die gesamte Energie wird reflektiert.' });
      pasos.push({ t: 'Stehende Welle', html: `Die Summe lautet $E = E_0 [cos(k z − ω t) − cos(k z + ω t)] = 2E_0 sin(k z) sin(ω t) î$ = ${f(2 * E0)} sin(${f(F.k)}z) sin(${f(F.w)}t) î V/m<br>$B = {E_0}/v [cos(k z − ω t) + cos(k z + ω t)] = 2B_0 cos(k z) cos(ω t) ĵ$ = ${f(2 * B0)} cos(${f(F.k)}z) cos(${f(F.w)}t) ĵ T<br>Sie schreitet nicht mehr fort: Jeder Punkt schwingt an seinem Platz, und E und B sind zeitlich um eine Viertelperiode und räumlich um ein Viertel λ gegeneinander verschoben.` });
      pasos.push({ t: 'Knoten und Bäuche', html: `E ist in den Ebenen z = −nλ/2 = 0, −${f(F.lam / 2)}, −${f(F.lam)} m … immer null (Knoten von E, wo B maximal ist) und hat die maximale Amplitude 2E<sub>0</sub> = ${f(2 * E0)} V/m bei z = −λ/4, −3λ/4 … = −${f(F.lam / 4)}, −${f((3 * F.lam) / 4)} m … Der Abstand zwischen zwei Knoten beträgt λ/2 = <b>${f(F.lam / 2)} m</b>.` });
      pasos.push({ t: 'Energie, Druck und Strom an der Oberfläche', html: `Der mittlere Poynting-Vektor ist 0: Die Energie wandert nicht, sie pendelt zwischen E und B hin und her. Der Strahlungsdruck auf den Leiter beträgt $p = {2I_i}/v$ = <b>${f((2 * I0) / M.v)} Pa</b>. An der Oberfläche ist B = 2B<sub>0</sub> cos(ωt), und diesen Sprung von B erzeugt ein Oberflächenstrom $K = B/μ$ = <b>${f(K)} cos(ωt) A/m</b> (in Richtung î).` });
      return { modo: 'incidencia', cond, M, F, E0, B0, I0, r: -1, t: 0, R: 1, T: 0, K, pasos };
    }
    const er2 = lee(sc, 'er2', 'die relative Permittivität ε₂ des zweiten Mediums'), mr2 = vacio(sc.mr2) ? 1 : lee(sc, 'mr2', 'die relative Permeabilität μ₂'), M2 = medio({ medio: 'medio', er: er2, mr: mr2 });
    const r = (M2.eta - M.eta) / (M2.eta + M.eta), t = 1 + r, Rr = r * r, T = (M.eta / M2.eta) * t * t, swr = (1 + Math.abs(r)) / (1 - Math.abs(r));
    pasos.push({ t: 'Zweites Medium', html: `ε<sub>r</sub> = ${f(er2)}${mr2 !== 1 ? `, μ<sub>r</sub> = ${f(mr2)}` : ''}: n<sub>2</sub> = ${f(M2.n)}, v<sub>2</sub> = ${f(M2.v)} m/s, η<sub>2</sub> = ${f(M2.eta)} Ω, λ<sub>2</sub> = ${f(M2.v / F.fr)} m.` });
    pasos.push({ t: 'Fresnel-Koeffizienten', html: `Mit stetigen tangentialen E und H bei z = 0: $r = {η_2 − η_1}/{η_2 + η_1}$ = <b>${f(r)}</b> und $t = {2η_2}/{η_1 + η_2} = 1 + r$ = <b>${f(t)}</b>${mr2 === 1 && M.mr === 1 ? ` (mit μ = μ<sub>0</sub>, $r = {n_1 − n_2}/{n_1 + n_2}$)` : ''}.<br>$E_r = r E_0$ = ${f(r * E0)} V/m${r < 0 ? ' (die reflektierte Welle kehrt sich um: Phasensprung von 180°)' : ''} y $E_t = t E_0$ = ${f(t * E0)} V/m.` });
    pasos.push({ t: 'Energie', html: `$R = r^2$ = <b>${f(100 * Rr, 3)} %</b> werden reflektiert und $T = {η_1}/{η_2} t^2$ = <b>${f(100 * T, 3)} %</b> transmittiert (R + T = 1). Im ersten Medium ist die Summe aus einfallender und reflektierter Welle eine teilweise stehende Welle: |E| schwingt zwischen ${f(E0 * (1 - Math.abs(r)))} und ${f(E0 * (1 + Math.abs(r)))} V/m (Stehwellenverhältnis ${f(swr)}).` });
    return { modo: 'incidencia', cond, M, M2, F, E0, B0, I0, r, t, R: Rr, T, swr, pasos };
  }

  function intensidad(sc) {
    const M = medio(sc), pasos = [], de = ['fuente', 'I', 'E0'].includes(sc.de) ? sc.de : 'fuente';
    let I, P = null, r = null;
    pasos.push({ t: 'Mittel', html: medioTxt(M) });
    if (de === 'fuente') {
      P = lee(sc, 'P', 'die Leistung P'); r = lee(sc, 'r', 'der Abstand r'); I = P / (4 * Math.PI * r * r);
      pasos.push({ t: 'Intensität in einem Abstand r', html: `Eine Punktquelle verteilt die Leistung gleichmäßig auf eine Kugel mit der Fläche 4πr<sup>2</sup>:<br>$I = P/(4π r^2) = {${f(P)}}/{4π·${f(r)}^2}$ = <b>${f(I)} W/m<sup>2</sup></b>` });
    } else if (de === 'I') I = lee(sc, 'I', 'die Stromstärke I');
    let E0 = de === 'E0' ? lee(sc, 'E0', 'die Amplitude E₀') : Math.sqrt(2 * M.eta * I);
    if (de === 'E0') { I = (E0 * E0) / (2 * M.eta); pasos.push({ t: 'Intensität', html: `$I = {E_0^2}/{2η} = {${f(E0)}^2}/{2·${f(M.eta)}}$ = <b>${f(I)} W/m<sup>2</sup></b>` }); }
    else pasos.push({ t: 'Amplitude des elektrischen Feldes', html: `$I = {E_0^2}/{2η} ⇒ E_0 = √(2η I) = √(2·${f(M.eta)}·${f(I)})$ = <b>${f(E0)} V/m</b>` });
    const B0 = E0 / M.v;
    pasos.push({ t: 'Magnetfeld und Effektivwerte', html: `$B_0 = {E_0}/v$ = <b>${f(B0)} T</b><br>$E_eff = {E_0}/√2$ = ${f(E0 / Math.SQRT2)} V/m, &ensp; B<sub>eff</sub> = ${f(B0 / Math.SQRT2)} T` });
    const u = I / M.v, A = lee(sc, 'A', 'die Fläche A', { opcional: true });
    pasos.push({ t: 'Energie und Strahlungsdruck', html: `$u = I/v$ = ${f(u)} J/m<sup>3</sup><br>$p = I/v$ = ${f(I / M.v)} Pa bei Absorption und $ {2I}/v$ = ${f((2 * I) / M.v)} Pa bei Reflexion${A !== null ? `<br>Auf A = ${f(A)} m<sup>2</sup>: ankommende Leistung I·A = ${f(I * A)} W, Kraft ${f((I * A) / M.v)} N (absorbiert) oder ${f((2 * I * A) / M.v)} N (reflektiert)` : ''}` });
    return { modo: 'intensidad', M, de, P, r, I, E0, B0, u, A, pa: I / M.v, pasos };
  }

  function perdidas(sc) {
    const er = lee(sc, 'er', 'die relative Permittivität εr'), mr = vacio(sc.mr) ? 1 : lee(sc, 'mr', 'die relative Permeabilität μr'), sg = lee(sc, 'sigma', 'die Leitfähigkeit σ', { cero: true });
    const fr = lee(sc, 'valor', 'die Frequenz f'), w = 2 * Math.PI * fr, eps = er * EPS0, mu = mr * MU0, pasos = [];
    const tg = sg / (w * eps), raiz = Math.sqrt(1 + tg * tg), base = w * Math.sqrt((mu * eps) / 2);
    const alfa = base * Math.sqrt(raiz - 1), beta = base * Math.sqrt(raiz + 1), delta = alfa > 0 ? 1 / alfa : Infinity;
    const etaM = Math.sqrt(mu / eps) / Math.sqrt(raiz), th = 0.5 * Math.atan(tg), vf = w / beta, lam = (2 * Math.PI) / beta;
    const tipo = tg > 100 ? 'buen conductor' : tg < 0.01 ? 'guter Isolator (geringe Verluste)' : 'Medium mit mäßigen Verlusten';
    pasos.push({ t: 'Verlusttangens', html: `$ω = 2π f$ = ${f(w)} rad/s, $ε = ε_r ε_0$ = ${f(eps)} F/m<br>$σ/(ω ε) = {${f(sg)}}/{${f(w)}·${f(eps)}}$ = <b>${f(tg)}</b> ⇒ ${tipo}${tg > 100 ? ' (der Leitungsstrom überwiegt)' : tg < 0.01 ? ' (der Verschiebungsstrom überwiegt)' : ''}` });
    let h = `Die Ausbreitungskonstante ist $γ = α + jβ = √(jω μ (σ + jω ε))$, mit<br>$α = ω √({μ ε}/2) √(√(1 + (σ/(ω ε))^2) − 1)$ = <b>${f(alfa)} Np/m</b><br>$β = ω √({μ ε}/2) √(√(1 + (σ/(ω ε))^2) + 1)$ = <b>${f(beta)} rad/m</b>`;
    if (tg > 100) h += `<br>In einem guten Leiter gilt $α ≈ β ≈ √(π f μ σ)$ = ${f(Math.sqrt(Math.PI * fr * mu * sg))}`;
    else if (tg < 0.01 && sg > 0) h += `<br>Bei geringen Verlusten gilt $α ≈ σ/2 √(μ/ε)$ = ${f((sg / 2) * Math.sqrt(mu / eps))} und $β ≈ ω √(μ ε)$ = ${f(w * Math.sqrt(mu * eps))}`;
    pasos.push({ t: 'Dämpfung und Phase', html: h });
    pasos.push({ t: 'Eindringtiefe', html: sg === 0 ? 'Ohne Leitfähigkeit gibt es keine Verluste: Die Welle wird nicht gedämpft (δ = ∞).' : `$δ = 1/α$ = <b>${f(delta)} m</b>: In dieser Tiefe sinkt die Amplitude auf 1/e = 37 % und die Intensität auf 1/e<sup>2</sup> = 13,5 %.` });
    pasos.push({ t: 'Geschwindigkeit, Wellenlänge und Impedanz', html: `$v = ω/β$ = ${f(vf)} m/s, &ensp; $λ = {2π}/β$ = ${f(lam)} m<br>$η = √({jω μ}/{σ + jω ε}) = |η|∠θ$ = <b>${f(etaM)} Ω ∠${f((th * 180) / Math.PI)}°</b>: Das Feld B eilt E um ${f((th * 180) / Math.PI)}° nach.` });
    const E0 = lee(sc, 'E0', 'die Amplitude E₀', { opcional: true }), d = lee(sc, 'd', 'die Tiefe d', { opcional: true, cero: true });
    let Ed = null;
    if (E0 !== null) {
      let g = `E(z, t) = ${f(E0)} e<sup>−${f(alfa)}z</sup> cos(${f(beta)}z − ${f(w)}t) V/m`;
      if (d !== null) { Ed = E0 * Math.exp(-alfa * d); g += `<br>Bei z = ${f(d)} m: $E = E_0 e^{−α z} = ${f(E0)}·e^{−${f(alfa * d)}}$ = <b>${f(Ed)} V/m</b> (${f(100 * Math.exp(-alfa * d))} % der Amplitude)`; }
      g += `<br>Intensität beim Eintritt: $I = {E_0^2 cos θ}/{2|η|}$ = ${f((E0 * E0 * Math.cos(th)) / (2 * etaM))} W/m<sup>2</sup>`;
      pasos.push({ t: 'Feld im Inneren des Mediums', html: g });
    }
    return { modo: 'perdidas', er, mr, sg, fr, w, tg, tipo, alfa, beta, delta, etaM, th, vf, lam, E0, d, Ed, M: { eps, mu, v: vf, eta: etaM }, F: { fr, w, k: beta, lam }, pasos };
  }

  function polarizadores(sc) {
    const luz = ['natural', 'lineal', 'circular'].includes(sc.luz) ? sc.luz : 'natural', I0 = lee(sc, 'I0', 'die Intensität I₀'), pasos = [];
    const angs = String(sc.angulos ?? '').split(';').map((s) => s.trim()).filter(Boolean).map(leeNum);
    if (!angs.length) throw new Error('Es fehlt der Winkel mindestens eines Polarisators (zum Beispiel 0; 45; 90)');
    if (angs.some((a) => !isFinite(a))) throw new Error('Die Winkel der Polarisatoren müssen Zahlen sein, durch Semikolon getrennt (0; 45; 90)');
    if (angs.length > 6) throw new Error('Höchstens 6 Polarisatoren');
    const alfa = luz === 'lineal' ? (vacio(sc.alfa) ? 0 : leeNum(sc.alfa)) : 0;
    if (luz === 'lineal' && !isFinite(alfa)) throw new Error('Der Winkel des Lichts muss eine Zahl sein');
    const norm = (a) => { let d = ((a + 90) % 180 + 180) % 180 - 90; return d; };
    pasos.push({ t: 'Gesetz von Malus', html: `Ein idealer Polarisator lässt nur die zu seiner Achse parallele Komponente von E durch: $E = E_0 cos θ$, und da $I ∝ E^2$:<br>$I = I_0 cos^2 θ$ (Gesetz von Malus), wobei θ der Winkel zwischen der Polarisation des Lichts und der Achse ist.<br>Natürliches Licht (alle Richtungen gleich): Der erste Polarisator lässt die Hälfte durch, $I = I_0/2$, und polarisiert es entlang seiner Achse. Auch zirkulares Licht verliert die Hälfte.` });
    const etapas = []; let I = I0, pol = luz === 'lineal' ? alfa : null;
    angs.forEach((a, i) => {
      const prev = I;
      let h;
      if (pol === null) { I = prev / 2; h = `${luz === 'natural' ? 'Natürliches' : 'Zirkulares'} Licht: $I_${i + 1} = I_${i}/2 = {${f(prev)}}/2$ = <b>${f(I)} W/m<sup>2</sup></b>`; etapas.push({ a, de: null, I, prev, c2: 0.5 }); }
      else { const th = norm(a - pol), c2 = Math.cos((th * Math.PI) / 180) ** 2; I = prev * (Math.abs(c2) < 1e-15 ? 0 : c2); h = `Winkel zwischen Licht (${f(pol)}°) und Achse (${f(a)}°): θ = ${f(th)}°<br>$I_${i + 1} = I_${i} cos^2 θ = ${f(prev)}·cos^2(${f(th)}°)$ = <b>${f(I)} W/m<sup>2</sup></b>`; etapas.push({ a, de: pol, th, I, prev, c2 }); }
      pol = a;
      pasos.push({ t: `Polarisator ${i + 1} (Achse bei ${f(a)}°)`, html: h + `<br>Das Licht tritt entlang ${f(a)}° polarisiert aus, mit E<sub>0</sub> = ${f(Math.sqrt(2 * 376.730313 * I))} V/m (im Vakuum).` });
    });
    const E0f = Math.sqrt(2 * 376.730313 * I), frac = I / I0;
    pasos.push({ t: 'Endergebnis', html: `$I_f/I_0 = $ <b>${f(frac, 4)}</b> (${f(100 * frac, 4)} %), $I_f = $ <b>${f(I)} W/m<sup>2</sup></b>, $E_0 = √(2 η I_f)$ = ${f(E0f)} V/m mit η = 376,7 Ω.` });
    if (I <= 1e-300 * I0) pasos.push({ t: 'Gekreuzte Polarisatoren', html: 'Bei um 90° versetzten Achsen kommt kein Licht durch. Ein dazwischen liegender Polarisator bei 45° zwischen zwei gekreuzten lässt Licht durch: Das ist das klassische Paradoxon.' });
    return { modo: 'polarizadores', luz, I0, alfa, angs, etapas, I, frac, E0f, pasos };
  }

  function poynting(sc) {
    const sis = ['hilo', 'condensador', 'coaxial'].includes(sc.sis) ? sc.sis : 'hilo', pasos = [];
    pasos.push({ t: 'Idee', html: `Der Poynting-Vektor $S = {E × B}/μ_0$ gibt die Leistung pro Flächeneinheit an. Sein Fluss durch eine geschlossene Fläche ist die ein- oder austretende Leistung (Energiebilanz): $∮ S·dA = −{dU}/{dt} − P_{Joule}$. In einer Schaltung wandert die Energie nicht durch die Drähte: Sie kommt über die Felder von außen an.` });
    let r;
    if (sis === 'hilo') {
      const a = lee(sc, 'a', 'der Radius a'), L = lee(sc, 'L', 'die Länge L'), I = lee(sc, 'I', 'der Strom I'), sg = lee(sc, 'sigma', 'die Leitfähigkeit σ');
      const A = Math.PI * a * a, R = L / (sg * A), E = I / (sg * A), B = (MU0 * I) / (2 * Math.PI * a), S = (E * B) / MU0, flujo = S * 2 * Math.PI * a * L, P = I * I * R;
      pasos.push({ t: 'Felder an der Oberfläche des Drahtes', html: `Querschnitt A = πa<sup>2</sup> = ${f(A)} m<sup>2</sup>; Widerstand $R = {L}/{σ A}$ = <b>${f(R)} Ω</b><br>Elektrisches Feld (entlang des Drahtes): $E = {I}/{σ A}$ = ${f(E)} V/m<br>Magnetfeld (Ampère, bei r = a): $B = {μ_0 I}/{2π a}$ = ${f(B)} T, azimutal.` });
      pasos.push({ t: 'Poynting-Vektor', html: `$S = {E B}/μ_0 = {I^2}/{2π^2 σ a^3}$ = <b>${f(S)} W/m<sup>2</sup></b>, zur Drahtachse gerichtet (radial, einwärts): E × B zeigt nach innen.` });
      pasos.push({ t: 'Energiebilanz', html: `Fluss durch die Mantelfläche mit der Fläche 2πaL = ${f(2 * Math.PI * a * L)} m<sup>2</sup>:<br>$Φ_S = S·2π a L$ = <b>${f(flujo)} W</b> eintretend<br>Verlustleistung: $P = I^2 R$ = ${f(P)} W. <b>Sie stimmen überein</b>: Der Draht erwärmt sich durch die Energie, die ihm von den Feldern außerhalb zufließt.` });
      r = { E, B, S, flujo, P, R, dir: 'nach innen (radial)' };
    } else if (sis === 'condensador') {
      const a = lee(sc, 'a', 'der Plattenradius a'), d = lee(sc, 'd', 'der Abstand d'), V = lee(sc, 'V', 'die Spannung V'), I = lee(sc, 'I', 'der Ladestrom I');
      const C = (EPS0 * Math.PI * a * a) / d, E = V / d, B = (MU0 * I) / (2 * Math.PI * a), S = (E * B) / MU0, flujo = S * 2 * Math.PI * a * d, U = 0.5 * C * V * V, dU = V * I, vol = Math.PI * a * a * d, dE = I / (EPS0 * Math.PI * a * a);
      pasos.push({ t: 'Kondensator und elektrisches Feld', html: `Kapazität $C = {ε_0 π a^2}/d$ = ${f(C)} F; Feld zwischen den Platten $E = V/d$ = <b>${f(E)} V/m</b>, das mit ${f(dE)} V/m/s wächst, während der Strom I = ${f(I)} A die Platten lädt.<br>Gespeicherte Energie $U = ½ C V^2$ = ${f(U)} J.` });
      pasos.push({ t: 'Ampère-Maxwell-Magnetfeld', html: `Der Verschiebungsstrom erzeugt B am Rand: $B·2π a = μ_0 ε_0 π a^2 {dE}/{dt} = μ_0 I$ ⇒ $B = {μ_0 I}/{2π a}$ = ${f(B)} T, azimutal.` });
      pasos.push({ t: 'Poynting-Vektor', html: `$S = {E B}/μ_0$ = <b>${f(S)} W/m<sup>2</sup></b>, radial nach innen (während sich die Platte lädt).` });
      pasos.push({ t: 'Energiebilanz', html: `Fluss durch den seitlichen Rand mit der Fläche 2πad = ${f(2 * Math.PI * a * d)} m<sup>2</sup>: $Φ_S = S·2π a d$ = <b>${f(flujo)} W</b><br>Anstiegsrate der Feldenergie: $dU/dt = V I$ = ${f(dU)} W (mit ${f(0.5 * EPS0 * E * E * vol)} J = ½ ε<sub>0</sub>E<sup>2</sup>·Volumen). <b>Sie stimmen überein</b>: Die gesamte Energie tritt seitlich ein, nicht über die Drähte.` });
      r = { E, B, S, flujo, P: dU, C, U, dir: 'nach innen (radial)' };
    } else {
      const a = lee(sc, 'a', 'der Innenradius a'), b = lee(sc, 'b', 'der Außenradius b'), V = lee(sc, 'V', 'die Spannung V'), I = lee(sc, 'I', 'der Strom I'), rr = vacio(sc.r) ? a : lee(sc, 'r', 'der Radius r des Punktes');
      if (b <= a) throw new Error('Der Außenradius b muss größer sein als der Innenradius a');
      if (rr < a || rr > b) throw new Error('Der Punkt muss zwischen den beiden Leitern liegen (a ≤ r ≤ b)');
      const ln = Math.log(b / a), E = V / (rr * ln), B = (MU0 * I) / (2 * Math.PI * rr), S = (E * B) / MU0, flujo = V * I, P = V * I;
      pasos.push({ t: 'Felder zwischen den Leitern', html: `Gauß: $E = {V}/{r ln(b/a)}$ (radial), mit ln(b/a) = ${f(ln)}; Ampère: $B = {μ_0 I}/{2π r}$ (azimutal). Bei r = ${f(rr)} m: E = ${f(E)} V/m, B = ${f(B)} T.` });
      pasos.push({ t: 'Poynting-Vektor', html: `$S = {E B}/μ_0 = {V I}/{2π r^2 ln(b/a)}$ = <b>${f(S)} W/m<sup>2</sup></b> entlang des Kabels, von der Quelle zur Last (wenn V und I positiv sind).` });
      pasos.push({ t: 'Übertragene Leistung', html: `Integriert man S über den Ring zwischen a und b: $∫_a^b S·2π r dr = {V I}/{ln(b/a)}·ln(b/a)$ = <b>${f(P)} W</b>. Das ist $P = V I$: Die Leistung wandert im Dielektrikum zwischen den Leitern, nicht im Inneren des Metalls.` });
      r = { E, B, S, flujo, P, ln, dir: 'entlang der Achse, von der Quelle zur Last', rr };
    }
    return { modo: 'poynting', sis, ...r, pasos };
  }

  function plasma(sc) {
    const QE = SI.e, ME = 9.1093837015e-31, ne = lee(sc, 'ne', 'die Elektronendichte n_e'), fr = lee(sc, 'valor', 'die Frequenz f', { opcional: true }), pasos = [];
    const ang = vacio(sc.ang) ? null : lee(sc, 'ang', 'der Einfallswinkel', { cero: true });
    if (ang !== null && ang >= 90) throw new Error('Der Einfallswinkel muss kleiner als 90° sein');
    const wp = Math.sqrt((ne * QE * QE) / (EPS0 * ME)), fp = wp / (2 * Math.PI), lp = C0 / fp;
    pasos.push({ t: 'Plasmafrequenz', html: `Die freien Elektronen schwingen kollektiv mit $ω_p = √({n_e e^2}/{ε_0 m_e}) = √({${f(ne)}·(${f(QE)})^2}/{${f(EPS0)}·${f(ME)}})$ = <b>${f(wp)} rad/s</b>, also $f_p = ω_p/2π$ = <b>${f(fp)} Hz</b> (≈ 8,98 √n_e Hz), und $λ_p = c/f_p$ = ${f(lp)} m.` });
    pasos.push({ t: 'Dispersionsrelation', html: `Die Maxwell-Gleichungen mit dem Strom der Elektronen ergeben $k^2 c^2 = ω^2 − ω_p^2$, also einen Brechungsindex $n(ω) = √(1 − ω_p^2/ω^2)$: kleiner als 1 und nur reell, wenn $ω > ω_p$.` });
    const r = { modo: 'plasma', ne, wp, fp, lp, fr, ang, fcrit: ang === null ? fp : fp / Math.cos((ang * Math.PI) / 180) };
    if (fr !== null) {
      const w = 2 * Math.PI * fr, x = w / wp;
      if (x > 1) {
        const n = Math.sqrt(1 - 1 / (x * x)), k = (w * n) / C0, vf = C0 / n, vg = C0 * n;
        Object.assign(r, { w, x, n, k, vf, vg, lam: (2 * Math.PI) / k, propaga: true });
        pasos.push({ t: 'Die Welle breitet sich aus', html: `$ω/ω_p = ${f(x)} > 1$: $n = √(1 − 1/${f(x)}^2)$ = <b>${f(n)}</b>, $k = nω/c$ = ${f(k)} rad/m und $λ = 2π/k$ = <b>${f(r.lam)} m</b> (größer als im Vakuum).` });
        pasos.push({ t: 'Phasen- und Gruppengeschwindigkeit', html: `$v_f = ω/k = c/n$ = <b>${f(vf)} m/s</b> (größer als c!), aber Energie und Information wandern mit $v_g = dω/dk = c n$ = <b>${f(vg)} m/s</b> (kleiner als c). Es gilt $v_f v_g = c^2$: ${f(vf * vg)} m²/s².` });
      } else {
        const kap = (wp / C0) * Math.sqrt(1 - x * x);
        Object.assign(r, { w, x, kappa: kap, delta: 1 / kap, propaga: false });
        pasos.push({ t: 'Die Welle breitet sich nicht aus', html: `$ω/ω_p = ${f(x)} < 1$: $n$ ist imaginär, $k = ±jκ$ mit $κ = {ω_p}/c √(1 − ω^2/ω_p^2)$ = ${f(kap)} m<sup>-1</sup>. Das Feld fällt wie $e^{−κ z}$ ab mit der Eindringtiefe $δ = 1/κ$ = <b>${f(r.delta)} m</b>, und die Welle wird fast vollständig <b>reflektiert</b> (R = 1 ohne Verluste): Deshalb reflektiert die Ionosphäre Kurzwellen und Metalle glänzen.` });
      }
    }
    if (ang !== null) pasos.push({ t: 'Schräge Reflexion in der Ionosphäre', html: `Bei Einfall unter $θ = ${f(ang)}°$ wird die Welle reflektiert, wenn $n ≤ sin θ$, also wenn $f ≤ f_p/cos θ$ (Sekansgesetz): $f_{max} = ${f(fp)}/cos ${f(ang)}°$ = <b>${f(r.fcrit)} Hz</b>.` + (fr !== null ? ` Bei ${f(fr)} Hz ${fr <= r.fcrit ? '<b>wird sie reflektiert</b>' : '<b>durchdringt sie</b> die Schicht'}.` : '') });
    else pasos.push({ t: 'Reflexion in der Ionosphäre', html: `Bei senkrechtem Einfall reflektiert die Schicht alle Frequenzen unterhalb von $f_p$ = ${f(fp)} Hz${fp > 1e6 ? ` (${f(fp / 1e6)} MHz)` : ''}; darüber durchdringt die Welle sie.` });
    r.reflejada = fr !== null && (r.fcrit >= fr);
    r.pasos = pasos;
    r.curva = (n) => Array.from({ length: n + 1 }, (_, i) => { const kk = (i / n) * 3; return [kk, Math.sqrt(1 + kk * kk)]; }); // κ = kc/ω_p → ω/ω_p
    return r;
  }

  const CARAS = { antihorario: 'gegen den Uhrzeigersinn (vom Empfänger aus gesehen: linkszirkular)', horario: 'im Uhrzeigersinn (vom Empfänger aus gesehen: rechtszirkular)' };
  function elipse(Ex, Ey, dl) {
    const c = Math.cos(dl), s = Math.sin(dl), sum = Ex * Ex + Ey * Ey, dif = Ex * Ex - Ey * Ey, raiz = Math.sqrt(dif * dif + 4 * Ex * Ex * Ey * Ey * c * c);
    const a = Math.sqrt((sum + raiz) / 2), b = Math.sqrt(Math.max(0, (sum - raiz) / 2)), psi = 0.5 * Math.atan2(2 * Ex * Ey * c, dif), S3 = 2 * Ex * Ey * s;
    const lineal = Math.abs(S3) < 1e-9 * sum, circular = !lineal && Math.abs(b / a - 1) < 1e-9;
    return { a, b, psi: (psi * 180) / Math.PI, tipo: lineal ? 'lineal' : circular ? 'circular' : 'elliptisch', giro: lineal ? null : S3 > 0 ? 'antihorario' : 'horario', razon: a ? b / a : 0 };
  }
  function suma(sc) {
    const caso = ['batido', 'estacionaria', 'polarizacion'].includes(sc.caso) ? sc.caso : 'batido', A1 = lee(sc, 'A1', 'die Amplitude A₁', { cero: true }), A2 = lee(sc, 'A2', 'die Amplitude A₂', { cero: true }), pasos = [];
    if (A1 === 0 && A2 === 0) throw new Error('Eine der Amplituden muss größer als 0 sein');
    const dl = vacio(sc.delta) ? 0 : leeNum(sc.delta);
    if (!isFinite(dl)) throw new Error('Die Phasenverschiebung muss eine Zahl sein (in Grad)');
    const d = (dl * Math.PI) / 180, r = { modo: 'suma', caso, A1, A2, delta: dl };
    if (caso === 'batido') {
      const f1 = lee(sc, 'f1', 'die Frequenz f₁'), f2 = lee(sc, 'f2', 'die Frequenz f₂'), df = Math.abs(f1 - f2), fm = (f1 + f2) / 2, w1 = 2 * Math.PI * f1, w2 = 2 * Math.PI * f2;
      const env = (t) => Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos((w1 - w2) * t - d));
      Object.assign(r, { f1, f2, df, fm, Emax: A1 + A2, Emin: Math.abs(A1 - A2), env, Tb: df > 0 ? 1 / df : Infinity, E: (t) => A1 * Math.cos(w1 * t) + A2 * Math.cos(w2 * t + d) });
      pasos.push({ t: 'Zwei Wellen mit unterschiedlichen Frequenzen', html: `In einem festen Punkt gilt $E_1 = ${f(A1)} cos(2π ${f(f1)} t)$ und $E_2 = ${f(A2)} cos(2π ${f(f2)} t + ${f(dl)}°)$. Sie addieren sich, weil die Maxwell-Gleichungen linear sind (Superpositionsprinzip).` });
      if (df === 0) pasos.push({ t: 'Gleiche Frequenz: Interferenz', html: `Bei gleicher Frequenz ist das Ergebnis eine weitere Welle mit der Amplitude $√(A_1^2 + A_2^2 + 2A_1 A_2 cos δ)$ = <b>${f(env(0))} V/m</b> (δ = ${f(dl)}°): konstruktiv bei δ = 0° (A₁ + A₂ = ${f(A1 + A2)}) und destruktiv bei δ = 180° (|A₁ − A₂| = ${f(Math.abs(A1 - A2))}).` });
      else {
        pasos.push({ t: 'Schwebungen', html: `Ist $f_1 ≈ f_2$, ist die Summe eine Schwingung mit der mittleren Frequenz $\\bar f = (f_1 + f_2)/2$ = <b>${f(fm)} Hz</b> und einer Amplitude, die sich langsam zwischen $|A_1 − A_2|$ = ${f(r.Emin)} und $A_1 + A_2$ = ${f(r.Emax)} V/m ändert: $A(t) = √(A_1^2 + A_2^2 + 2A_1 A_2 cos(Δω t − δ))$.` });
        pasos.push({ t: 'Schwebungsfrequenz', html: `Die Hüllkurve wiederholt sich mit $f_b = |f_1 − f_2|$ = <b>${f(df)} Hz</b>, also alle $T_b = 1/f_b$ = ${f(r.Tb)} s.` + (A1 === A2 ? ` Bei gleichen Amplituden gilt $E = 2A cos(π Δf t) cos(2π \\bar f t)$, und die Hüllkurve erreicht 0.` : '') });
      }
    } else if (caso === 'estacionaria') {
      const fr = lee(sc, 'f1', 'die Frequenz f'), w = 2 * Math.PI * fr, k = w / C0, lam = C0 / fr, ROE = Math.abs(A1 - A2) < 1e-12 * Math.max(A1, A2) ? Infinity : (A1 + A2) / Math.abs(A1 - A2);
      const env = (z) => Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(2 * k * z + d));
      Object.assign(r, { f1: fr, w, k, lam, ROE, env, Emax: A1 + A2, Emin: Math.abs(A1 - A2), E: (z, t) => A1 * Math.cos(k * z - w * t) + A2 * Math.cos(k * z + w * t + d), Pr: A1 > 0 ? (A2 / A1) ** 2 : null });
      pasos.push({ t: 'Zwei Wellen in entgegengesetzter Richtung', html: `$E = ${f(A1)} cos(kz − ωt) + ${f(A2)} cos(kz + ωt + ${f(dl)}°)$ mit $k = ω/c$ = ${f(k)} rad/m und $λ$ = ${f(lam)} m.` });
      pasos.push({ t: 'Amplitude in jedem Punkt', html: `Jeder Punkt schwingt mit einer Amplitude, die von $z$ abhängt: $A(z) = √(A_1^2 + A_2^2 + 2A_1 A_2 cos(2kz + δ))$, zwischen $|A_1 − A_2|$ = <b>${f(r.Emin)} V/m</b> (Knoten) und $A_1 + A_2$ = <b>${f(r.Emax)} V/m</b> (Bäuche). Sie wiederholen sich alle $λ/2$ = ${f(lam / 2)} m.` });
      pasos.push({ t: 'Stehwellenverhältnis', html: `$ROE = {A_1 + A_2}/{|A_1 − A_2|}$ = <b>${ROE === Infinity ? '∞ (reine stehende Welle: Die Knoten sind null)' : f(ROE)}</b>${A1 > 0 ? `; die reflektierte Leistung beträgt $(A_2/A_1)^2$ = ${f(100 * r.Pr, 3)} % der einfallenden` : ''}.` });
    } else {
      const A = lee(sc, 'A1', 'die Amplitude A₁'), B2 = lee(sc, 'A2', 'die Amplitude A₂'), S = elipse(A, B2, d);
      Object.assign(r, { A1: A, A2: B2, E: S, estado: S });
      pasos.push({ t: 'Zwei Wellen mit senkrechten Polarisationen', html: `$E_x = ${f(A)} cos(kz − ωt)$ und $E_y = ${f(B2)} cos(kz − ωt + ${f(dl)}°)$, mit gleicher Frequenz und Richtung. Das resultierende Feld durchläuft in jedem Punkt die Kurve $(E_x/A_1)^2 + (E_y/A_2)^2 − 2 (E_x E_y)/(A_1 A_2) cos δ = sin^2 δ$.` });
      pasos.push({ t: 'Polarisationszustand', html: S.tipo === 'lineal' ? `Bei δ = ${f(dl)}° (Vielfaches von 180°) flacht die Ellipse zu einer Geraden ab: <b>lineare</b> Polarisation unter einem Winkel $ψ$ = <b>${f(S.psi)}°</b> zur x-Achse und mit der Amplitude ${f(S.a)} V/m.` : S.tipo === 'circular' ? `Mit $A_1 = A_2$ und $δ = ±90°$ beschreibt die Spitze von E einen Kreis mit dem Radius ${f(S.a)} V/m: <b>zirkulare</b> Polarisation, ${CARAS[S.giro]}.` : `<b>Elliptische</b> Polarisation, ${CARAS[S.giro]}: Halbachsen $a$ = ${f(S.a)} V/m und $b$ = ${f(S.b)} V/m (b/a = ${f(S.razon)}), mit der Hauptachse unter $ψ$ = <b>${f(S.psi)}°</b> zur x-Achse.` });
      pasos.push({ t: 'Halbachsen', html: `$a^2, b^2 = {1}/{2}[A_1^2 + A_2^2 ± √((A_1^2 − A_2^2)^2 + 4 A_1^2 A_2^2 cos^2 δ)]$ und $tan 2ψ = {2 A_1 A_2 cos δ}/{A_1^2 − A_2^2}$. Es gilt $a^2 + b^2 = A_1^2 + A_2^2$ = ${f(A * A + B2 * B2)}.` });
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
    if (I < 1e-18) return { I: 0, tipo: 'kein Licht' };
    const S1 = J[0][0] ** 2 + J[0][1] ** 2 - J[1][0] ** 2 - J[1][1] ** 2, S2 = 2 * (J[0][0] * J[1][0] + J[0][1] * J[1][1]), S3 = 2 * (J[0][0] * J[1][1] - J[0][1] * J[1][0]);
    const psi = (0.5 * Math.atan2(S2, S1) * 180) / Math.PI, chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, S3 / I))), lineal = Math.abs(S3 / I) < 1e-6, circ = Math.abs(S3 / I) > 1 - 1e-9;
    return { I, tipo: lineal ? 'lineal' : circ ? 'circular' : 'elliptisch', psi, razon: Math.abs(Math.tan(chi)), giro: lineal ? null : S3 > 0 ? 'antihorario' : 'horario', S: [S1 / I, S2 / I, S3 / I] };
  }
  const NOMEL = { pol: 'Polarisator', l4: 'λ/4-Platte', l2: 'λ/2-Platte' };
  const txtEstado = (e) => (e.tipo === 'kein Licht' ? 'kein Licht kommt durch' : e.tipo === 'lineal' ? `linear unter ${f(e.psi, 4)}° zur x-Achse` : e.tipo === 'circular' ? `circular ${e.giro === 'antihorario' ? 'a izquierdas (antihoraria)' : 'a derechas (horaria)'}` : `elliptisch ${e.giro === 'antihorario' ? 'linkszirkular (gegen den Uhrzeigersinn)' : 'rechtszirkular (im Uhrzeigersinn)'}, b/a = ${f(e.razon, 3)}, Hauptachse unter ${f(e.psi, 4)}°`);
  function retardo(sc) {
    const luz = ['lineal', 'circI', 'circD'].includes(sc.luz) ? sc.luz : 'lineal', alfa = luz === 'lineal' ? (vacio(sc.alfa) ? 0 : leeNum(sc.alfa)) : 0, pasos = [];
    if (!isFinite(alfa)) throw new Error('Der Winkel des Lichts muss eine Zahl sein (in Grad)');
    const R2 = Math.SQRT1_2, ai = (alfa * Math.PI) / 180;
    let J = luz === 'lineal' ? [[cx(Math.cos(ai)), cx(0)], [cx(Math.sin(ai)), cx(0)]].map((r) => r[0]) : luz === 'circI' ? [cx(R2), cx(0, R2)] : [cx(R2), cx(0, -R2)];
    const elems = [];
    for (let i = 1; i <= 4; i++) { const t = sc['e' + i]; if (!t) continue; if (!NOMEL[t]) throw new Error(`Das Element ${i} ist ungültig`); const a = vacio(sc['a' + i]) ? 0 : leeNum(sc['a' + i]); if (!isFinite(a)) throw new Error(`Der Winkel des Elements ${i} muss eine Zahl sein`); elems.push({ t, a }); }
    if (!elems.length) throw new Error('Wähle mindestens ein Element (Polarisator oder Platte)');
    pasos.push({ t: 'Jones-Kalkül', html: `Polarisiertes Licht wird durch den Vektor $E = (E_x, E_y)$ mit komplexen Komponenten beschrieben und jedes Element durch eine 2×2-Matrix: $E_{aus} = M · E_{ein}$. Polarisator unter θ: $M = [[cos^2 θ, cos θ sin θ], [cos θ sin θ, sin^2 θ]]$. Verzögerungsplatte mit schneller Achse unter θ: $M = R(−θ) · diag(1, e^{jΓ}) · R(θ)$, mit $Γ = 90°$ ($λ/4$) oder $180°$ ($λ/2$).` });
    pasos.push({ t: 'Eingangslicht', html: `${luz === 'lineal' ? `Linear unter ${f(alfa)}°: $E = (cos α, sin α)$ = (${f(Math.cos(ai), 4)}; ${f(Math.sin(ai), 4)})` : luz === 'circI' ? 'Linkszirkular: $E = (1, j)/√2$' : 'Rechtszirkular: $E = (1, −j)/√2$'}. Intensität 1 (relativ).` });
    const etapas = [{ nombre: 'Eintritt', I: 1, estado: estadoJones([[J[0][0], J[0][1]], [J[1][0], J[1][1]]]), J: J.map((z) => z.slice()) }];
    elems.forEach((e, i) => {
      const M = jonesElem(e.t, (e.a * Math.PI) / 180); J = mv(M, J);
      const est = estadoJones([[J[0][0], J[0][1]], [J[1][0], J[1][1]]]);
      etapas.push({ nombre: `${NOMEL[e.t]} a ${f(e.a)}°`, I: est.I, estado: est, J: J.map((z) => z.slice()), M });
      pasos.push({ t: `${i + 1}. ${NOMEL[e.t]} (Achse bei ${f(e.a)}°)`, html: `$M$ = ${matTxt(M)}<br>$E$ = (${cTxt(J[0])}; ${cTxt(J[1])}), $I$ = <b>${f(est.I, 4)}</b>: ${txtEstado(est)}.` });
    });
    const fin = etapas[etapas.length - 1];
    pasos.push({ t: 'Ergebnis', html: `Ausgangslicht: ${txtEstado(fin.estado)}, mit einer Intensität von <b>${f(100 * fin.I, 4)} %</b> der Eingangsintensität aus.` + (fin.estado.tipo === 'lineal' && etapas.length > 1 ? '' : '') });
    return { modo: 'retardo', luz, alfa, elems, etapas, I: fin.I, estado: fin.estado, texto: txtEstado(fin.estado), pasos };
  }

  const MODOS = { plasma, suma, retardo, onda, expresion, incidencia, intensidad, perdidas, polarizadores, poynting };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : onda(sc); }

  const ejemplos = [
    { clave: 'fm', nombre: 'UKW-Radiowelle im Vakuum', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '100e6', E0: '0,05', prop: '+z', pol: '+x', er: '', mr: '' } },
    { clave: 'laser', nombre: 'Licht eines roten Lasers (λ = 633 nm)', sc: { modo: 'onda', medio: 'vacio', dato: 'lambda', valor: '633e-9', E0: '1000', prop: '+x', pol: '+y', er: '', mr: '' } },
    { clave: 'agua', nombre: 'Licht, das ins Wasser eintritt', sc: { modo: 'onda', medio: 'medio', dato: 'f', valor: '5e14', E0: '200', prop: '+z', pol: '+y', er: '1,77', mr: '1' } },
    { clave: 'expresion', nombre: 'Aus k: E = 30 cos(2,09y + ωt) k̂', sc: { modo: 'onda', medio: 'vacio', dato: 'k', valor: '2,094', E0: '30', prop: '-y', pol: '+z', er: '', mr: '' } },
    { clave: 'dielectrico', nombre: 'Mikrowellen in einem Dielektrikum (εr = 4)', sc: { modo: 'onda', medio: 'medio', dato: 'f', valor: '2,45e9', E0: '100', prop: '+z', pol: '+x', er: '4', mr: '1' } },
    { clave: 'diagonal', nombre: 'Diagonale Welle mit Anfangsphase', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '3e9', E0: '10', prop: 'otra', kx: '1', ky: '1', kz: '0', pol: '+z', er: '', mr: '', fase: '60' } },
    { clave: 'circular', nombre: 'Zirkulare Polarisation', sc: { modo: 'onda', medio: 'vacio', dato: 'lambda', valor: '0,03', E0: '20', prop: '+z', pol: '+x', er: '', mr: '', tipoPol: 'circular', giro: 'antihorario' } },
    { clave: 'eliptica', nombre: 'Elliptische Polarisation', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '1e9', E0: '30', prop: '+x', pol: '+y', er: '', mr: '', tipoPol: 'eliptica', E02: '15', delta: '-90' } },
    { clave: 'expr-E', nombre: 'Aus E(r, t) = 30 cos(2,094y + 6,283·10⁸t) k̂', sc: { modo: 'expresion', campo: 'E', expr: '30 cos(2,094y + 6,283e8t) k' } },
    { clave: 'expr-B', nombre: 'Aus B(r, t) in Glas', sc: { modo: 'expresion', campo: 'B', expr: '2e-7 sen(1,5e7z - 3e15t) j' } },
    { clave: 'conductor', nombre: 'Stehende Welle vor einem Leiter', sc: { modo: 'incidencia', destino: 'conductor', medio: 'vacio', dato: 'f', valor: '1e9', E0: '50', er: '', mr: '', er2: '', mr2: '' } },
    { clave: 'vidrio', nombre: 'Licht, das von Luft auf Glas trifft', sc: { modo: 'incidencia', destino: 'dielectrico', medio: 'vacio', dato: 'lambda', valor: '600e-9', E0: '100', er: '', mr: '', er2: '2,25', mr2: '' } },
    { clave: 'sol', nombre: 'Sonnenlicht auf der Erde', sc: { modo: 'intensidad', medio: 'vacio', de: 'I', I: '1361', P: '', r: '', E0: '', A: '1' } },
    { clave: 'bombilla', nombre: '100-W-Glühbirne in 2 m Abstand', sc: { modo: 'intensidad', medio: 'vacio', de: 'fuente', P: '100', r: '2', I: '', E0: '', A: '' } },
    { clave: 'antena', nombre: '50-kW-Antenne in 10 km Entfernung', sc: { modo: 'intensidad', medio: 'vacio', de: 'fuente', P: '50000', r: '10000', I: '', E0: '', A: '' } },
    { clave: 'vela', nombre: 'Reflektierendes Sonnensegel (E₀ gegeben)', sc: { modo: 'intensidad', medio: 'vacio', de: 'E0', E0: '1012', P: '', r: '', I: '', A: '100' } },
    { clave: 'malus', nombre: 'Gesetz von Malus: lineares Licht unter 30° zu einem Polarisator', sc: { modo: 'polarizadores', luz: 'lineal', alfa: '0', I0: '100', angulos: '30' } },
    { clave: 'tres-polarizadores', nombre: 'Natürliches Licht durch drei Polarisatoren (0°, 45°, 90°)', sc: { modo: 'polarizadores', luz: 'natural', I0: '1000', angulos: '0; 45; 90' } },
    { clave: 'cruzados', nombre: 'Zwei gekreuzte Polarisatoren (0° und 90°)', sc: { modo: 'polarizadores', luz: 'natural', I0: '1000', angulos: '0; 90' } },
    { clave: 'poy-hilo', nombre: 'Poynting-Vektor in einem stromführenden Kupferdraht', sc: { modo: 'poynting', sis: 'hilo', a: '1e-3', L: '2', I: '10', sigma: '5,8e7' } },
    { clave: 'poy-condensador', nombre: 'Poynting-Vektor in einem sich ladenden Kondensator', sc: { modo: 'poynting', sis: 'condensador', a: '0,05', d: '0,002', V: '100', I: '0,5' } },
    { clave: 'poy-coaxial', nombre: 'Leistung in einem Koaxialkabel', sc: { modo: 'poynting', sis: 'coaxial', a: '1e-3', b: '3,5e-3', V: '50', I: '2', r: '' } },
    { clave: 'plasma-iono', nombre: 'Ionosphäre (nₑ = 10¹² m⁻³): Wird eine 5-MHz-Welle reflektiert?', sc: { modo: 'plasma', ne: '1e12', valor: '5e6', ang: '' } },
    { clave: 'plasma-obl', nombre: 'Ionosphäre bei schrägem Einfall von 60° (15-MHz-Welle)', sc: { modo: 'plasma', ne: '1e12', valor: '15e6', ang: '60' } },
    { clave: 'plasma-metal', nombre: 'Elektronen eines Metalls (Natrium): durchlässig für Ultraviolett', sc: { modo: 'plasma', ne: '2,5e28', valor: '2e15', ang: '' } },
    { clave: 'suma-batido', nombre: 'Schwebungen: zwei Wellen mit 100 und 110 Hz', sc: { modo: 'suma', caso: 'batido', A1: '1', A2: '1', f1: '100', f2: '110', delta: '' } },
    { clave: 'suma-estacionaria', nombre: 'Teilweise stehende Welle: einfallende und reflektierte bei 1 GHz', sc: { modo: 'suma', caso: 'estacionaria', A1: '10', A2: '4', f1: '1e9', f2: '', delta: '180' } },
    { clave: 'suma-circular', nombre: 'Zwei orthogonale Wellen mit δ = 90°: zirkulare Polarisation', sc: { modo: 'suma', caso: 'polarizacion', A1: '10', A2: '10', f1: '', f2: '', delta: '90' } },
    { clave: 'suma-eliptica', nombre: 'Zwei orthogonale Wellen mit δ = 60°: elliptische Polarisation', sc: { modo: 'suma', caso: 'polarizacion', A1: '10', A2: '6', f1: '', f2: '', delta: '60' } },
    { clave: 'ret-circular', nombre: 'λ/4-Platte unter 45°: von linear zu zirkular', sc: { modo: 'retardo', luz: 'lineal', alfa: '0', e1: 'l4', a1: '45', e2: '', a2: '', e3: '', a3: '', e4: '', a4: '' } },
    { clave: 'ret-media', nombre: 'λ/2-Platte zwischen gekreuzten Polarisatoren: dreht die Polarisation', sc: { modo: 'retardo', luz: 'lineal', alfa: '0', e1: 'pol', a1: '0', e2: 'l2', a2: '45', e3: 'pol', a3: '90', e4: '', a4: '' } },
    { clave: 'ret-analizador', nombre: 'Zirkulares Licht, das mit λ/4 und Analysator linear wird', sc: { modo: 'retardo', luz: 'circI', alfa: '', e1: 'l4', a1: '0', e2: 'pol', a2: '135', e3: '', a3: '', e4: '', a4: '' } },
    { clave: 'cobre', nombre: 'Kupfer bei 1 MHz (guter Leiter)', sc: { modo: 'perdidas', er: '1', mr: '1', sigma: '5,8e7', valor: '1e6', E0: '1', d: '0,0001' } },
    { clave: 'mar', nombre: 'Meerwasser bei 1 kHz', sc: { modo: 'perdidas', er: '81', mr: '1', sigma: '4', valor: '1000', E0: '1', d: '10' } },
    { clave: 'tierra', nombre: 'Feuchte Erde bei 1 MHz', sc: { modo: 'perdidas', er: '10', mr: '1', sigma: '0,01', valor: '1e6', E0: '10', d: '5' } },
    { clave: 'baquelita', nombre: 'Dielektrikum mit geringen Verlusten', sc: { modo: 'perdidas', er: '4,9', mr: '1', sigma: '1e-6', valor: '1e8', E0: '5', d: '100' } },
  ];
  return { resolver, plasma, suma, retardo, elipse, estadoJones, jonesElem, onda, expresion, incidencia, intensidad, perdidas, polarizadores, poynting, leeExpresion, banda, ejemplos, f, C0, MU0, EPS0 };
})();

