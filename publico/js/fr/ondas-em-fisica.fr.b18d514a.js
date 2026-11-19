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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} manquant`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} doit être un nombre (3e8 ou 3·10^8 acceptés)`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${may(nom)} doit être ${cero ? 'positif ou nul' : 'supérieur à 0'}`);
    return v;
  }

  const EJES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const GORRO = { x: 'î', y: 'ĵ', z: 'k̂' };
  const dir = (s) => { const m = /^([+-]?)([xyz])$/.exec(s || ''); if (!m) throw new Error('Direction non valide'); const e = EJES[m[2]].map((c) => (m[1] === '-' ? -c : c)); return { v: e, eje: m[2], signo: m[1] === '-' ? -1 : 1 }; };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nomDir = (v) => { const i = v.findIndex((c) => Math.abs(c) > 0.5); return `${v[i] < 0 ? '−' : ''}${GORRO['xyz'[i]]}`; };
  const unit = (v) => { const n = Math.hypot(...v); return v.map((c) => (Math.abs(c / n) < 1e-12 ? 0 : c / n)); };
  const enEje = (v) => v.filter((c) => Math.abs(c) > 1e-12).length === 1;
  const vecTxt = (v) => (enEje(v) ? nomDir(v) : `(${v.map((c, i) => (Math.abs(c) < 1e-12 ? '' : `${c < 0 ? '− ' : '+ '}${f(Math.abs(c))} ${GORRO['xyz'[i]]}`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−')})`);
  const dirExp = (v) => { const t = vecTxt(v); return t[0] === '−' ? `(${t})` : t; };
  const dirTxt = (v) => (enEje(v) ? (() => { const i = v.findIndex((c) => Math.abs(c) > 0.5); return `${v[i] < 0 ? '−' : '+'}${'xyz'[i]}`; })() : vecTxt(v));
  function vecDe(sc, k, p, nom) {
    if (sc[k] !== 'otra') { const d = dir(sc[k]); return { v: d.v, eje: d.eje, signo: d.signo }; }
    const v = ['x', 'y', 'z'].map((e) => { const x = leeNum(vacio(sc[p + e]) ? '0' : sc[p + e]); if (!isFinite(x)) throw new Error(`La composante ${e} de ${nom} doit être un nombre`); return x; });
    if (!(Math.hypot(...v) > 0)) throw new Error(`Écrivez au moins une composante de ${nom}`);
    const u = unit(v), i = u.findIndex((c) => Math.abs(c) > 1 - 1e-12);
    return { v: u, eje: i >= 0 ? 'xyz'[i] : null, signo: i >= 0 ? Math.sign(u[i]) : 1 };
  }
  const kr = (kv, k) => kv.map((c, i) => (Math.abs(c) < 1e-12 ? '' : `${c < 0 ? '− ' : '+ '}${f(Math.abs(c * k))}${'xyz'[i]}`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−');

  const COLORES = [[380, 'violeta'], [450, 'azul'], [495, 'verde'], [570, 'amarillo'], [590, 'naranja'], [620, 'rojo'], [750, '']];
  function banda(fr) {
    const l = C0 / fr;
    if (l > 1) return 'ondes radio';
    if (l > 1e-3) return 'microondas';
    if (l > 750e-9) return 'infrarrojo';
    if (l >= 380e-9) { const nm = l * 1e9; let c = 'rojo'; for (let i = 0; i < COLORES.length - 1; i++) if (nm >= COLORES[i][0] && nm < COLORES[i + 1][0]) c = COLORES[i][1]; return `luz visible (${c})`; }
    if (l > 10e-9) return 'ultravioleta';
    if (l > 10e-12) return 'rayos X';
    return 'rayos gamma';
  }

  function medio(sc) {
    const vacioM = sc.medio !== 'medio';
    const er = vacioM ? 1 : lee(sc, 'er', 'la permittivité relative εr'), mr = vacioM || vacio(sc.mr) ? 1 : lee(sc, 'mr', 'la perméabilité relative μr');
    const eps = er * EPS0, mu = mr * MU0, v = 1 / Math.sqrt(eps * mu), n = Math.sqrt(er * mr), eta = Math.sqrt(mu / eps);
    return { vacioM, er, mr, eps, mu, v, n, eta };
  }
  function frecuencia(sc, v) {
    const dato = ['f', 'lambda', 'omega', 'k'].includes(sc.dato) ? sc.dato : 'f';
    const x = lee(sc, 'valor', { f: 'la fréquence f', lambda: 'la longueur d\'onde λ', omega: 'la fréquence angulaire ω', k: 'le nombre d\'onde k' }[dato]);
    const fr = dato === 'f' ? x : dato === 'lambda' ? v / x : dato === 'omega' ? x / (2 * Math.PI) : (x * v) / (2 * Math.PI);
    return { dato, x, fr, w: 2 * Math.PI * fr, k: (2 * Math.PI * fr) / v, lam: v / fr, T: 1 / fr };
  }
  const medioTxt = (M) => (M.vacioM ? 'Dans le vide : $v = c = 1/√(μ_0 ε_0)$ = 2,998·10<sup>8</sup> m/s, $η_0 = √(μ_0/ε_0)$ = 376,7 Ω'
    : `Milieu avec ε<sub>r</sub> = ${f(M.er)}${M.mr !== 1 ? ` et μ<sub>r</sub> = ${f(M.mr)}` : ''} : indice $n = √(ε_r μ_r)$ = ${f(M.n)}, $v = c/n$ = ${f(M.v)} m/s, $η = √(μ/ε) = η_0 √(μ_r/ε_r)$ = ${f(M.eta)} Ω`);

  function onda(sc) {
    const M = medio(sc), F = frecuencia(sc, M.v), E0 = lee(sc, 'E0', 'l\'amplitude E₀'), pasos = [...(sc.previos || [])];
    const K = vecDe({ prop: '+z', ...sc }, 'prop', 'k', 'la direction de propagation'), Ed = vecDe({ pol: '+x', ...sc }, 'pol', 'e', 'la direction de E');
    if (Math.abs(K.v[0] * Ed.v[0] + K.v[1] * Ed.v[1] + K.v[2] * Ed.v[2]) > 1e-9) throw new Error('E doit être perpendiculaire à la direction de propagation (l\'onde est transversale)');
    const Bv = cruz(K.v, Ed.v).map((c) => (Math.abs(c) < 1e-12 ? 0 : c)), B0 = E0 / M.v;
    const phiG = vacio(sc.fase) ? 0 : leeNum(sc.fase), phi = (phiG * Math.PI) / 180;
    if (!isFinite(phi)) throw new Error('La phase doit être un nombre (en degrés)');
    const tp = ['circular', 'eliptica'].includes(sc.tipoPol) ? sc.tipoPol : 'lineal';
    const E02 = tp === 'circular' ? E0 : tp === 'eliptica' ? lee(sc, 'E02', 'la seconde amplitude E₀₂', { cero: true }) : 0;
    const dG = tp === 'circular' ? (sc.giro === 'horario' ? -90 : 90) : tp === 'eliptica' ? leeNum(vacio(sc.delta) ? '90' : sc.delta) : 0, dl = (dG * Math.PI) / 180;
    if (!isFinite(dl)) throw new Error('Le déphasage δ doit être un nombre (en degrés)');
    if (!sc.previos) pasos.push({ t: 'Moyen', html: medioTxt(M) });
    const fTxt = { f: `f = ${f(F.fr)} Hz ⇒ $ω = 2π f$ = ${f(F.w)} rad/s`, lambda: `λ = ${f(F.x)} m ⇒ $f = v/λ = ${f(M.v)}/${f(F.x)}$ = ${f(F.fr)} Hz, $ω = 2π f$ = ${f(F.w)} rad/s`, omega: `ω = ${f(F.w)} rad/s ⇒ $f = ω/(2π)$ = ${f(F.fr)} Hz`, k: `k = ${f(F.x)} rad/m ⇒ $ω = k v$ = ${f(F.w)} rad/s, f = ${f(F.fr)} Hz` }[F.dato];
    pasos.push({ t: 'Fréquence, longueur d\'onde et nombre d\'onde', html: `${fTxt}<br>$λ = v/f$ = <b>${f(F.lam)} m</b>, &ensp; $k = {2π}/λ = ω/v$ = <b>${f(F.k)} rad/m</b>, &ensp; $T = 1/f$ = ${f(F.T)} s${M.vacioM ? '' : `<br>Dans le vide, elle aurait $λ_0 = c/f$ = ${f(C0 / F.fr)} m : dans le milieu $λ = {λ_0}/n$.`}<br>Domaine du spectre : ${banda(F.fr)}` });
    const ar = K.eje ? K.eje : 'r', fTxt2 = phi ? ` ${phi < 0 ? '−' : '+'} ${f(Math.abs(phi))}` : '';
    const fase = K.eje ? `${f(F.k)}${ar} ${K.signo > 0 ? '−' : '+'} ${f(F.w)}t${fTxt2}` : `${kr(K.v, F.k)} − ${f(F.w)}t${fTxt2}`;
    const fase2 = (d) => (d ? `${fase} ${d < 0 ? '−' : '+'} ${f(Math.abs(d))}` : fase), menosE1 = Ed.v.map((c) => (c ? -c : 0));
    const Eexp = tp === 'lineal' ? `E(${ar}, t) = ${f(E0)} cos(${fase}) ${dirExp(Ed.v)} V/m` : `E(${ar}, t) = ${f(E0)} cos(${fase}) ${dirExp(Ed.v)} + ${f(E02)} cos(${fase2(dl)}) ${dirExp(Bv)} V/m`;
    const Bexp = tp === 'lineal' ? `B(${ar}, t) = ${f(B0)} cos(${fase}) ${dirExp(Bv)} T` : `B(${ar}, t) = ${f(B0)} cos(${fase}) ${dirExp(Bv)} + ${f(E02 / M.v)} cos(${fase2(dl)}) ${dirExp(menosE1)} T`;
    const ek = (v) => (vecTxt(v)[0] === '−' ? `(${vecTxt(v)})` : vecTxt(v));
    pasos.push({ t: 'Champ magnétique', html: `Dans une onde plane, E, B et la direction de propagation sont perpendiculaires entre eux et $B_0 = {E_0}/v = ${f(E0)}/{${f(M.v)}}$ = <b>${f(B0)} T</b><br>La direction de B vient de k̂ = Ê × B̂, c'est-à-dire B̂ = k̂ × Ê = ${ek(K.v)} × ${ek(Ed.v)} = <b>${vecTxt(Bv)}</b>` });
    if (tp !== 'lineal') {
      const forma = tp === 'circular' || (Math.abs(E02 - E0) < 1e-12 * E0 && Math.abs(Math.abs(dG) - 90) < 1e-9) ? 'circular' : Math.abs(Math.sin(dl)) < 1e-12 || E02 === 0 ? 'lineal' : 'elliptique', gira = Math.sin(dl) > 0 ? 'antihorario' : 'horario';
      pasos.push({ t: 'Polarisation', html: `E est la somme de deux ondes perpendiculaires : E<sub>01</sub> = ${f(E0)} V/m selon ${vecTxt(Ed.v)} et E<sub>02</sub> = ${f(E02)} V/m selon k̂ × Ê = ${vecTxt(Bv)}, déphasées de δ = ${f(dG)}°. ${forma === 'lineal' ? 'Avec δ = 0° ou 180°, elles restent en phase et la polarisation reste <b>linéaire</b>, inclinée.' : `En un point fixe, l'extrémité de E décrit un${forma === 'circular' ? 'e <b>circonférence</b> (polarisation circulaire : E<sub>01</sub> = E<sub>02</sub> et δ = ±90°)' : 'e <b>ellipse</b> (polarisation elliptique)'} et tourne dans le sens <b>${gira}</b> vu par celui qui reçoit l'onde (en regardant vers la source).`}${forma === 'circular' ? ` |E| est constant, ${f(E0)} V/m.` : ''}` });
    }
    const pref = phi ? `, avec la phase initiale φ = ${f(phiG)}° = ${f(phi)} rad` : '';
    pasos.push({ t: 'Expressions', html: `Sous la forme cos(k·r − ωt + φ), qui se propage vers ${dirTxt(K.v)}${K.eje ? '' : ` (k = k k̂ = ${kr(K.v, F.k).replace(/([xyz])/g, (m) => ` ${GORRO[m]}`)} rad/m)`}${pref} :<br>${Eexp}<br>${Bexp}` });
    const I = (E0 * E0 + E02 * E02) / (2 * M.eta), u = 0.5 * M.eps * (E0 * E0 + E02 * E02);
    pasos.push({ t: 'Énergie et intensité', html: `Vecteur de Poynting $S = {E × B}/μ$, dans la direction ${vecTxt(K.v)}. Sa valeur moyenne est l'intensité :<br>${tp === 'lineal' ? `$I = {E_0^2}/{2η} = {${f(E0)}^2}/{2·${f(M.eta)}}$` : `$I = {E_01^2 + E_02^2}/{2η} = {${f(E0)}^2 + ${f(E02)}^2}/{2·${f(M.eta)}}$`} = <b>${f(I)} W/m<sup>2</sup></b><br>Densité moyenne d'énergie $u = 1/2 ε E_0^2$ = ${f(u)} J/m<sup>3</sup> (la moitié dans E et la moitié dans B), et $I = u v$.<br>Valeurs efficaces : $E_eff = {E_0}/√2$ = ${f(E0 / Math.SQRT2)} V/m, B<sub>eff</sub> = ${f(B0 / Math.SQRT2)} T` });
    pasos.push({ t: 'Pression de radiation', html: `Sur une surface qui l'absorbe, $p = I/v$ = ${f(I / M.v)} Pa ; si elle la réfléchit entièrement, $p = {2I}/v$ = ${f((2 * I) / M.v)} Pa.` });
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
    if (fin < 0) throw new Error('Écrivez l\'onde sous la forme E₀ cos(k·r − ωt + φ) et sa direction, p. ex. 30 cos(2,09y + 6,28e8t) k');
    const m = [s, m0[1], m0[2], s.slice(m0[0].length, fin), s.slice(fin + 1).trim()];
    let amp = m[1].replace(/[·*×\s]/g, '') || '1'; if (amp === '-') amp = '-1'; if (amp === '+') amp = '1';
    const A = numPi(amp);
    if (!isFinite(A) || A === 0) throw new Error('Je ne comprends pas l\'amplitude de l\'expression');
    const c = { x: 0, y: 0, z: 0, t: 0, '': 0 };
    const arg = m[3].replace(/\s/g, '').replace(/(\d)([eE])([+\-]?\d)/g, '$1E$3');
    const terms = arg.match(/[+\-]?[^+\-]+(?:E[+\-]?\d+[^+\-]*)?/g) || [];
    for (const t0 of terms) {
      const t = t0.replace(/E/g, 'e'), v = /([xyzt])$/.exec(t), var_ = v ? v[1] : '', num = var_ ? t.slice(0, -1).replace(/[·*]$/, '') : t;
      const x = numPi(num === '' || num === '+' ? '1' : num === '-' ? '-1' : num);
      if (!isFinite(x)) throw new Error(`Je ne comprends pas le terme « ${t0} » de la phase`);
      c[var_] += x;
    }
    let d = m[4].replace(/\s/g, '').replace(/V\/m|T$/i, ''), sg = 1;
    if (d[0] === '-') { sg = -1; d = d.slice(1); }
    let dv;
    const vec = /^\(([^,]+),([^,]+),([^,]+)\)$/.exec(d.replace(/;/g, ','));
    if (vec) dv = vec.slice(1).map((x) => numPi(x));
    else { const e = { 'î': 'x', 'ĵ': 'y', 'k̂': 'z', i: 'x', j: 'y', k: 'z', x: 'x', y: 'y', z: 'z', ux: 'x', uy: 'y', uz: 'z', u_x: 'x', u_y: 'y', u_z: 'z' }[d.normalize('NFC')] || { 'x̂': 'x', 'ŷ': 'y', 'ẑ': 'z' }[d]; if (!e) throw new Error('Il manque la direction du champ à la fin : î, ĵ, k̂ ou un vecteur (a, b, c)'); dv = EJES[e].slice(); }
    if (dv.some((x) => !isFinite(x)) || !(Math.hypot(...dv) > 0)) throw new Error('La direction du champ n\'est pas valide');
    return { A: A * sg, c, dv, func: m[2].toLowerCase() };
  }
  function expresion(sc) {
    const campo = sc.campo === 'B' ? 'B' : 'E', X = leeExpresion(sc.expr), pasos = [];
    let kv = [X.c.x, X.c.y, X.c.z], w = -X.c.t, phi = X.c[''];
    if (X.func === 'sin') phi -= Math.PI / 2;
    if (!(Math.hypot(...kv) > 0)) throw new Error('Il manque la partie spatiale de la phase (termes en x, y ou z)');
    if (!w) throw new Error('Il manque le terme en t de la phase');
    let nota = '';
    if (w < 0) { kv = kv.map((c) => -c); w = -w; phi = -phi; nota = ' Comme le cosinus est pair, cos(k·r + ωt + φ) = cos(−k·r − ωt − φ) : l\'onde va dans le sens de −k.'; }
    const k = Math.hypot(...kv), v = w / k, n = C0 / v, amp = Math.abs(X.A) * Math.hypot(...X.dv), dv = unit(X.dv).map((c) => c * Math.sign(X.A)), kh = unit(kv);
    pasos.push({ t: 'Lecture de l\'expression', html: `${X.func === 'sen' ? 'sen θ = cos(θ − π/2). ' : ''}En comparant avec ${campo}<sub>0</sub> cos(k·r − ωt + φ) : amplitude ${campo}<sub>0</sub> = <b>${f(amp)} ${campo === 'E' ? 'V/m' : 'T'}</b> selon ${vecTxt(dv)}, k = (${kv.map((c) => f(c)).join(', ')}) rad/m, de module k = <b>${f(k)} rad/m</b>, ω = <b>${f(w)} rad/s</b>${phi ? ` et φ = ${f(phi)} rad` : ''}.${nota} Elle se propage vers ${vecTxt(kh)}.` });
    if (n < 1 - 1e-3) throw new Error(`Avec ces k et ω, l'onde irait à ω/k = ${f(v).replace(/<[^>]+>/g, '')} m/s, plus vite que la lumière : vérifiez l'expression`);
    const enVacio = Math.abs(n - 1) < 2e-3;
    pasos.push({ t: 'Vitesse et milieu', html: `$v = ω/k = ${f(w)}/{${f(k)}}$ = <b>${f(v)} m/s</b>${enVacio ? ' : c\'est c, donc l\'onde se propage dans le vide (ou dans l\'air).' : `, inférieure à c : elle se propage dans un milieu d'indice $n = c/v$ = <b>${f(n)}</b> (si μ<sub>r</sub> = 1, $ε_r = n^2$ = ${f(n * n)}).`}` });
    if (Math.abs(kh[0] * dv[0] + kh[1] * dv[1] + kh[2] * dv[2]) > 1e-6) throw new Error(`Le champ ${campo} n'est pas perpendiculaire à k : ce n'est pas une onde plane transversale`);
    let ev = dv, E0 = amp;
    const vMedio = enVacio ? C0 : v;
    if (campo === 'B') { ev = cruz(dv, kh); E0 = amp * vMedio; pasos.push({ t: 'Champ électrique', html: `$E_0 = v B_0 = ${f(vMedio)}·${f(amp)}$ = <b>${f(E0)} V/m</b>, et comme B̂ = k̂ × Ê, la direction de E est Ê = B̂ × k̂ = ${vecTxt(unit(ev))}.` }); }
    const e = unit(ev), num = (x) => String(+x.toPrecision(12));
    const sc2 = { modo: 'onda', medio: enVacio ? 'vacio' : 'medio', er: num(n * n), mr: '1', dato: 'omega', valor: num(w), E0: num(E0), prop: 'otra', kx: num(kh[0]), ky: num(kh[1]), kz: num(kh[2]), pol: 'otra', ex: num(e[0]), ey: num(e[1]), ez: num(e[2]), fase: num((phi * 180) / Math.PI), previos: pasos };
    const r = onda(sc2);
    return { ...r, modo: 'expresion', campo, leido: { k, w, phi, amp } };
  }

  function incidencia(sc) {
    const M = medio(sc), F = frecuencia(sc, M.v), E0 = lee(sc, 'E0', 'l\'amplitude E₀ de l\'onde incidente'), pasos = [], cond = sc.destino !== 'dielectrico';
    const I0 = (E0 * E0) / (2 * M.eta), B0 = E0 / M.v;
    pasos.push({ t: 'Milieu d\'arrivée', html: `${medioTxt(M)}<br>λ = ${f(F.lam)} m, k = ${f(F.k)} rad/m. L'onde arrive par z < 0 vers +z : E<sub>i</sub> = ${f(E0)} cos(kz − ωt) î V/m, avec $I_i = {E_0^2}/{2η}$ = ${f(I0)} W/m<sup>2</sup>.` });
    if (cond) {
      const K = (2 * B0) / M.mu;
      pasos.push({ t: 'Onde réfléchie', html: 'Dans un conducteur parfait, E = 0 et, comme E tangentiel est continu, E = 0 à la surface z = 0. Cela exige une onde réfléchie E<sub>r</sub> = −E<sub>0</sub> cos(kz + ωt) î : le coefficient de réflexion est <b>r = −1</b> et toute l\'énergie est réfléchie.' });
      pasos.push({ t: 'Onde stationnaire', html: `En additionnant : $E = E_0 [cos(k z − ω t) − cos(k z + ω t)] = 2E_0 sin(k z) sin(ω t) î$ = ${f(2 * E0)} sin(${f(F.k)}z) sin(${f(F.w)}t) î V/m<br>$B = {E_0}/v [cos(k z − ω t) + cos(k z + ω t)] = 2B_0 cos(k z) cos(ω t) ĵ$ = ${f(2 * B0)} cos(${f(F.k)}z) cos(${f(F.w)}t) ĵ T<br>Elle ne se propage plus : chaque point oscille sur place, et E et B sont déphasés d'un quart de période dans le temps et d'un quart de λ dans l'espace.` });
      pasos.push({ t: 'Nœuds et ventres', html: `E est toujours nul dans les plans z = −nλ/2 = 0, −${f(F.lam / 2)}, −${f(F.lam)} m… (nœuds de E, où B est maximal) et a une amplitude maximale 2E<sub>0</sub> = ${f(2 * E0)} V/m en z = −λ/4, −3λ/4… = −${f(F.lam / 4)}, −${f((3 * F.lam) / 4)} m… La distance entre deux nœuds est λ/2 = <b>${f(F.lam / 2)} m</b>.` });
      pasos.push({ t: 'Énergie, pression et courant à la surface', html: `Le vecteur de Poynting moyen est nul : l'énergie ne voyage pas, elle va et vient entre E et B. La pression de radiation sur le conducteur est $p = {2I_i}/v$ = <b>${f((2 * I0) / M.v)} Pa</b>. À la surface, B = 2B<sub>0</sub> cos(ωt), et ce saut de B est produit par un courant surfacique $K = B/μ$ = <b>${f(K)} cos(ωt) A/m</b> (selon î).` });
      return { modo: 'incidencia', cond, M, F, E0, B0, I0, r: -1, t: 0, R: 1, T: 0, K, pasos };
    }
    const er2 = lee(sc, 'er2', 'la permittivité relative ε₂ du second milieu'), mr2 = vacio(sc.mr2) ? 1 : lee(sc, 'mr2', 'la perméabilité relative μ₂'), M2 = medio({ medio: 'medio', er: er2, mr: mr2 });
    const r = (M2.eta - M.eta) / (M2.eta + M.eta), t = 1 + r, Rr = r * r, T = (M.eta / M2.eta) * t * t, swr = (1 + Math.abs(r)) / (1 - Math.abs(r));
    pasos.push({ t: 'Second milieu', html: `ε<sub>r</sub> = ${f(er2)}${mr2 !== 1 ? `, μ<sub>r</sub> = ${f(mr2)}` : ''}: n<sub>2</sub> = ${f(M2.n)}, v<sub>2</sub> = ${f(M2.v)} m/s, η<sub>2</sub> = ${f(M2.eta)} Ω, λ<sub>2</sub> = ${f(M2.v / F.fr)} m.` });
    pasos.push({ t: 'Coefficients de Fresnel', html: `Avec E et H tangentiels continus en z = 0 : $r = {η_2 − η_1}/{η_2 + η_1}$ = <b>${f(r)}</b> et $t = {2η_2}/{η_1 + η_2} = 1 + r$ = <b>${f(t)}</b>${mr2 === 1 && M.mr === 1 ? ` (avec μ = μ<sub>0</sub>, $r = {n_1 − n_2}/{n_1 + n_2}$)` : ''}.<br>$E_r = r E_0$ = ${f(r * E0)} V/m${r < 0 ? ' (l\'onde réfléchie est inversée : changement de phase de 180°)' : ''} y $E_t = t E_0$ = ${f(t * E0)} V/m.` });
    pasos.push({ t: 'Énergie', html: `$R = r^2$ = <b>${f(100 * Rr, 3)} %</b> est réfléchi et $T = {η_1}/{η_2} t^2$ = <b>${f(100 * T, 3)} %</b> est transmis (R + T = 1). Dans le premier milieu, la somme de l'onde incidente et de l'onde réfléchie est une onde partiellement stationnaire : |E| oscille entre ${f(E0 * (1 - Math.abs(r)))} et ${f(E0 * (1 + Math.abs(r)))} V/m (taux d'ondes stationnaires ${f(swr)}).` });
    return { modo: 'incidencia', cond, M, M2, F, E0, B0, I0, r, t, R: Rr, T, swr, pasos };
  }

  function intensidad(sc) {
    const M = medio(sc), pasos = [], de = ['fuente', 'I', 'E0'].includes(sc.de) ? sc.de : 'fuente';
    let I, P = null, r = null;
    pasos.push({ t: 'Moyen', html: medioTxt(M) });
    if (de === 'fuente') {
      P = lee(sc, 'P', 'la puissance P'); r = lee(sc, 'r', 'la distance r'); I = P / (4 * Math.PI * r * r);
      pasos.push({ t: 'Intensité à une distance r', html: `Une source ponctuelle répartit la puissance également sur une sphère d'aire 4πr<sup>2</sup> :<br>$I = P/(4π r^2) = {${f(P)}}/{4π·${f(r)}^2}$ = <b>${f(I)} W/m<sup>2</sup></b>` });
    } else if (de === 'I') I = lee(sc, 'I', 'l\'intensité I');
    let E0 = de === 'E0' ? lee(sc, 'E0', 'l\'amplitude E₀') : Math.sqrt(2 * M.eta * I);
    if (de === 'E0') { I = (E0 * E0) / (2 * M.eta); pasos.push({ t: 'Intensité', html: `$I = {E_0^2}/{2η} = {${f(E0)}^2}/{2·${f(M.eta)}}$ = <b>${f(I)} W/m<sup>2</sup></b>` }); }
    else pasos.push({ t: 'Amplitude du champ électrique', html: `$I = {E_0^2}/{2η} ⇒ E_0 = √(2η I) = √(2·${f(M.eta)}·${f(I)})$ = <b>${f(E0)} V/m</b>` });
    const B0 = E0 / M.v;
    pasos.push({ t: 'Champ magnétique et valeurs efficaces', html: `$B_0 = {E_0}/v$ = <b>${f(B0)} T</b><br>$E_eff = {E_0}/√2$ = ${f(E0 / Math.SQRT2)} V/m, &ensp; B<sub>eff</sub> = ${f(B0 / Math.SQRT2)} T` });
    const u = I / M.v, A = lee(sc, 'A', 'l\'aire A', { opcional: true });
    pasos.push({ t: 'Énergie et pression de radiation', html: `$u = I/v$ = ${f(u)} J/m<sup>3</sup><br>$p = I/v$ = ${f(I / M.v)} Pa si elle est absorbée et $ {2I}/v$ = ${f((2 * I) / M.v)} Pa si elle est réfléchie${A !== null ? `<br>Sur A = ${f(A)} m<sup>2</sup> : puissance reçue I·A = ${f(I * A)} W, force ${f((I * A) / M.v)} N (absorption) ou ${f((2 * I * A) / M.v)} N (réflexion)` : ''}` });
    return { modo: 'intensidad', M, de, P, r, I, E0, B0, u, A, pa: I / M.v, pasos };
  }

  function perdidas(sc) {
    const er = lee(sc, 'er', 'la permittivité relative εr'), mr = vacio(sc.mr) ? 1 : lee(sc, 'mr', 'la perméabilité relative μr'), sg = lee(sc, 'sigma', 'la conductivité σ', { cero: true });
    const fr = lee(sc, 'valor', 'la fréquence f'), w = 2 * Math.PI * fr, eps = er * EPS0, mu = mr * MU0, pasos = [];
    const tg = sg / (w * eps), raiz = Math.sqrt(1 + tg * tg), base = w * Math.sqrt((mu * eps) / 2);
    const alfa = base * Math.sqrt(raiz - 1), beta = base * Math.sqrt(raiz + 1), delta = alfa > 0 ? 1 / alfa : Infinity;
    const etaM = Math.sqrt(mu / eps) / Math.sqrt(raiz), th = 0.5 * Math.atan(tg), vf = w / beta, lam = (2 * Math.PI) / beta;
    const tipo = tg > 100 ? 'buen conductor' : tg < 0.01 ? 'bon diélectrique (peu de pertes)' : 'milieu à pertes modérées';
    pasos.push({ t: 'Tangente de pertes', html: `$ω = 2π f$ = ${f(w)} rad/s, $ε = ε_r ε_0$ = ${f(eps)} F/m<br>$σ/(ω ε) = {${f(sg)}}/{${f(w)}·${f(eps)}}$ = <b>${f(tg)}</b> ⇒ ${tipo}${tg > 100 ? ' (le courant de conduction domine)' : tg < 0.01 ? ' (le courant de déplacement domine)' : ''}` });
    let h = `La constante de propagation est $γ = α + jβ = √(jω μ (σ + jω ε))$, avec<br>$α = ω √({μ ε}/2) √(√(1 + (σ/(ω ε))^2) − 1)$ = <b>${f(alfa)} Np/m</b><br>$β = ω √({μ ε}/2) √(√(1 + (σ/(ω ε))^2) + 1)$ = <b>${f(beta)} rad/m</b>`;
    if (tg > 100) h += `<br>Dans un bon conducteur, $α ≈ β ≈ √(π f μ σ)$ = ${f(Math.sqrt(Math.PI * fr * mu * sg))}`;
    else if (tg < 0.01 && sg > 0) h += `<br>Avec peu de pertes, $α ≈ σ/2 √(μ/ε)$ = ${f((sg / 2) * Math.sqrt(mu / eps))} et $β ≈ ω √(μ ε)$ = ${f(w * Math.sqrt(mu * eps))}`;
    pasos.push({ t: 'Atténuation et phase', html: h });
    pasos.push({ t: 'Profondeur de pénétration', html: sg === 0 ? 'Sans conductivité, il n\'y a pas de pertes : l\'onde n\'est pas atténuée (δ = ∞).' : `$δ = 1/α$ = <b>${f(delta)} m</b> : à cette profondeur, l'amplitude tombe à 1/e = 37 % et l'intensité à 1/e<sup>2</sup> = 13,5 %.` });
    pasos.push({ t: 'Vitesse, longueur d\'onde et impédance', html: `$v = ω/β$ = ${f(vf)} m/s, &ensp; $λ = {2π}/β$ = ${f(lam)} m<br>$η = √({jω μ}/{σ + jω ε}) = |η|∠θ$ = <b>${f(etaM)} Ω ∠${f((th * 180) / Math.PI)}°</b> : le champ B est en retard de ${f((th * 180) / Math.PI)}° sur E.` });
    const E0 = lee(sc, 'E0', 'l\'amplitude E₀', { opcional: true }), d = lee(sc, 'd', 'la profondeur d', { opcional: true, cero: true });
    let Ed = null;
    if (E0 !== null) {
      let g = `E(z, t) = ${f(E0)} e<sup>−${f(alfa)}z</sup> cos(${f(beta)}z − ${f(w)}t) V/m`;
      if (d !== null) { Ed = E0 * Math.exp(-alfa * d); g += `<br>En z = ${f(d)} m : $E = E_0 e^{−α z} = ${f(E0)}·e^{−${f(alfa * d)}}$ = <b>${f(Ed)} V/m</b> (${f(100 * Math.exp(-alfa * d))} % de l'amplitude)`; }
      g += `<br>Intensité à l'entrée : $I = {E_0^2 cos θ}/{2|η|}$ = ${f((E0 * E0 * Math.cos(th)) / (2 * etaM))} W/m<sup>2</sup>`;
      pasos.push({ t: 'Champ dans le milieu', html: g });
    }
    return { modo: 'perdidas', er, mr, sg, fr, w, tg, tipo, alfa, beta, delta, etaM, th, vf, lam, E0, d, Ed, M: { eps, mu, v: vf, eta: etaM }, F: { fr, w, k: beta, lam }, pasos };
  }

  function polarizadores(sc) {
    const luz = ['natural', 'lineal', 'circular'].includes(sc.luz) ? sc.luz : 'natural', I0 = lee(sc, 'I0', 'l\'intensité I₀'), pasos = [];
    const angs = String(sc.angulos ?? '').split(';').map((s) => s.trim()).filter(Boolean).map(leeNum);
    if (!angs.length) throw new Error('L\'angle d\'au moins un polariseur est manquant (par exemple 0 ; 45 ; 90)');
    if (angs.some((a) => !isFinite(a))) throw new Error('Les angles des polariseurs doivent être des nombres, séparés par des points-virgules (0 ; 45 ; 90)');
    if (angs.length > 6) throw new Error('Six polariseurs au maximum');
    const alfa = luz === 'lineal' ? (vacio(sc.alfa) ? 0 : leeNum(sc.alfa)) : 0;
    if (luz === 'lineal' && !isFinite(alfa)) throw new Error('L\'angle de la lumière doit être un nombre');
    const norm = (a) => { let d = ((a + 90) % 180 + 180) % 180 - 90; return d; };
    pasos.push({ t: 'Loi de Malus', html: `Un polariseur idéal ne laisse passer que la composante de E parallèle à son axe : $E = E_0 cos θ$, et comme $I ∝ E^2$ :<br>$I = I_0 cos^2 θ$ (loi de Malus), avec θ l'angle entre la polarisation de la lumière et l'axe.<br>Lumière naturelle (toutes les directions également) : le premier polariseur laisse passer la moitié, $I = I_0/2$, et la laisse polarisée selon son axe. La lumière circulaire perd aussi la moitié.` });
    const etapas = []; let I = I0, pol = luz === 'lineal' ? alfa : null;
    angs.forEach((a, i) => {
      const prev = I;
      let h;
      if (pol === null) { I = prev / 2; h = `Lumière ${luz === 'natural' ? 'naturelle' : 'circulaire'} : $I_${i + 1} = I_${i}/2 = {${f(prev)}}/2$ = <b>${f(I)} W/m<sup>2</sup></b>`; etapas.push({ a, de: null, I, prev, c2: 0.5 }); }
      else { const th = norm(a - pol), c2 = Math.cos((th * Math.PI) / 180) ** 2; I = prev * (Math.abs(c2) < 1e-15 ? 0 : c2); h = `Angle entre la lumière (${f(pol)}°) et l'axe (${f(a)}°) : θ = ${f(th)}°<br>$I_${i + 1} = I_${i} cos^2 θ = ${f(prev)}·cos^2(${f(th)}°)$ = <b>${f(I)} W/m<sup>2</sup></b>`; etapas.push({ a, de: pol, th, I, prev, c2 }); }
      pol = a;
      pasos.push({ t: `Polariseur ${i + 1} (axe à ${f(a)}°)`, html: h + `<br>Elle sort polarisée selon ${f(a)}°, avec E<sub>0</sub> = ${f(Math.sqrt(2 * 376.730313 * I))} V/m (dans le vide).` });
    });
    const E0f = Math.sqrt(2 * 376.730313 * I), frac = I / I0;
    pasos.push({ t: 'Résultat final', html: `$I_f/I_0 = $ <b>${f(frac, 4)}</b> (${f(100 * frac, 4)} %), $I_f = $ <b>${f(I)} W/m<sup>2</sup></b>, $E_0 = √(2 η I_f)$ = ${f(E0f)} V/m avec η = 376,7 Ω.` });
    if (I <= 1e-300 * I0) pasos.push({ t: 'Polariseurs croisés', html: 'Avec des axes à 90°, aucune lumière ne passe. Un polariseur intermédiaire à 45° entre deux polariseurs croisés laisse passer de la lumière : c\'est le paradoxe classique.' });
    return { modo: 'polarizadores', luz, I0, alfa, angs, etapas, I, frac, E0f, pasos };
  }

  function poynting(sc) {
    const sis = ['hilo', 'condensador', 'coaxial'].includes(sc.sis) ? sc.sis : 'hilo', pasos = [];
    pasos.push({ t: 'Idée', html: `Le vecteur de Poynting $S = {E × B}/μ_0$ donne la puissance par unité d'aire. Son flux à travers une surface fermée est la puissance qui entre ou sort (bilan d'énergie) : $∮ S·dA = −{dU}/{dt} − P_{Joule}$. Dans un circuit, l'énergie ne voyage pas dans les fils : elle arrive par les champs de l'extérieur.` });
    let r;
    if (sis === 'hilo') {
      const a = lee(sc, 'a', 'le rayon a'), L = lee(sc, 'L', 'la longueur L'), I = lee(sc, 'I', 'le courant I'), sg = lee(sc, 'sigma', 'la conductivité σ');
      const A = Math.PI * a * a, R = L / (sg * A), E = I / (sg * A), B = (MU0 * I) / (2 * Math.PI * a), S = (E * B) / MU0, flujo = S * 2 * Math.PI * a * L, P = I * I * R;
      pasos.push({ t: 'Champs à la surface du fil', html: `Section A = πa<sup>2</sup> = ${f(A)} m<sup>2</sup> ; résistance $R = {L}/{σ A}$ = <b>${f(R)} Ω</b><br>Champ électrique (le long du fil) : $E = {I}/{σ A}$ = ${f(E)} V/m<br>Champ magnétique (Ampère, en r = a) : $B = {μ_0 I}/{2π a}$ = ${f(B)} T, azimutal.` });
      pasos.push({ t: 'Vecteur de Poynting', html: `$S = {E B}/μ_0 = {I^2}/{2π^2 σ a^3}$ = <b>${f(S)} W/m<sup>2</sup></b>, dirigé vers l'axe du fil (radial, entrant) : E × B pointe vers l'intérieur.` });
      pasos.push({ t: 'Bilan d\'énergie', html: `Flux à travers la surface latérale d'aire 2πaL = ${f(2 * Math.PI * a * L)} m<sup>2</sup> :<br>$Φ_S = S·2π a L$ = <b>${f(flujo)} W</b> entrant<br>Puissance dissipée : $P = I^2 R$ = ${f(P)} W. Elles <b>coïncident</b> : le fil s'échauffe grâce à l'énergie qui lui vient des champs extérieurs.` });
      r = { E, B, S, flujo, P, R, dir: 'vers l\'intérieur (radial)' };
    } else if (sis === 'condensador') {
      const a = lee(sc, 'a', 'le rayon a des armatures'), d = lee(sc, 'd', 'la séparation d'), V = lee(sc, 'V', 'la tension V'), I = lee(sc, 'I', 'le courant de charge I');
      const C = (EPS0 * Math.PI * a * a) / d, E = V / d, B = (MU0 * I) / (2 * Math.PI * a), S = (E * B) / MU0, flujo = S * 2 * Math.PI * a * d, U = 0.5 * C * V * V, dU = V * I, vol = Math.PI * a * a * d, dE = I / (EPS0 * Math.PI * a * a);
      pasos.push({ t: 'Condensateur et champ électrique', html: `Capacité $C = {ε_0 π a^2}/d$ = ${f(C)} F ; champ entre les armatures $E = V/d$ = <b>${f(E)} V/m</b>, qui croît de ${f(dE)} V/m/s tant que le courant I = ${f(I)} A charge les armatures.<br>Énergie stockée $U = ½ C V^2$ = ${f(U)} J.` });
      pasos.push({ t: 'Champ magnétique d\'Ampère–Maxwell', html: `Le courant de déplacement crée B sur le bord : $B·2π a = μ_0 ε_0 π a^2 {dE}/{dt} = μ_0 I$ ⇒ $B = {μ_0 I}/{2π a}$ = ${f(B)} T, azimutal.` });
      pasos.push({ t: 'Vecteur de Poynting', html: `$S = {E B}/μ_0$ = <b>${f(S)} W/m<sup>2</sup></b>, radial vers l'intérieur (pendant la charge de l'armature).` });
      pasos.push({ t: 'Bilan d\'énergie', html: `Flux à travers le bord latéral d'aire 2πad = ${f(2 * Math.PI * a * d)} m<sup>2</sup> : $Φ_S = S·2π a d$ = <b>${f(flujo)} W</b><br>Taux d'augmentation de l'énergie du champ : $dU/dt = V I$ = ${f(dU)} W (avec ${f(0.5 * EPS0 * E * E * vol)} J = ½ ε<sub>0</sub>E<sup>2</sup>·volume). Elles <b>coïncident</b> : toute l'énergie entre par les côtés, pas par les fils.` });
      r = { E, B, S, flujo, P: dU, C, U, dir: 'vers l\'intérieur (radial)' };
    } else {
      const a = lee(sc, 'a', 'le rayon intérieur a'), b = lee(sc, 'b', 'le rayon extérieur b'), V = lee(sc, 'V', 'la tension V'), I = lee(sc, 'I', 'le courant I'), rr = vacio(sc.r) ? a : lee(sc, 'r', 'le rayon r du point');
      if (b <= a) throw new Error('Le rayon extérieur b doit être supérieur au rayon intérieur a');
      if (rr < a || rr > b) throw new Error('Le point doit se trouver entre les deux conducteurs (a ≤ r ≤ b)');
      const ln = Math.log(b / a), E = V / (rr * ln), B = (MU0 * I) / (2 * Math.PI * rr), S = (E * B) / MU0, flujo = V * I, P = V * I;
      pasos.push({ t: 'Champs entre les conducteurs', html: `Gauss : $E = {V}/{r ln(b/a)}$ (radial), avec ln(b/a) = ${f(ln)} ; Ampère : $B = {μ_0 I}/{2π r}$ (azimutal). En r = ${f(rr)} m : E = ${f(E)} V/m, B = ${f(B)} T.` });
      pasos.push({ t: 'Vecteur de Poynting', html: `$S = {E B}/μ_0 = {V I}/{2π r^2 ln(b/a)}$ = <b>${f(S)} W/m<sup>2</sup></b> le long du câble, de la source à la charge (si V et I sont positifs).` });
      pasos.push({ t: 'Puissance transportée', html: `En intégrant S sur la couronne entre a et b : $∫_a^b S·2π r dr = {V I}/{ln(b/a)}·ln(b/a)$ = <b>${f(P)} W</b>. C'est $P = V I$ : la puissance voyage dans le diélectrique entre les conducteurs, pas à l'intérieur du métal.` });
      r = { E, B, S, flujo, P, ln, dir: 'le long de l\'axe, de la source à la charge', rr };
    }
    return { modo: 'poynting', sis, ...r, pasos };
  }

  function plasma(sc) {
    const QE = SI.e, ME = 9.1093837015e-31, ne = lee(sc, 'ne', 'la densité d\'électrons n_e'), fr = lee(sc, 'valor', 'la fréquence f', { opcional: true }), pasos = [];
    const ang = vacio(sc.ang) ? null : lee(sc, 'ang', 'l\'angle d\'incidence', { cero: true });
    if (ang !== null && ang >= 90) throw new Error('L\'angle d\'incidence doit être inférieur à 90°');
    const wp = Math.sqrt((ne * QE * QE) / (EPS0 * ME)), fp = wp / (2 * Math.PI), lp = C0 / fp;
    pasos.push({ t: 'Fréquence plasma', html: `Les électrons libres oscillent collectivement avec $ω_p = √({n_e e^2}/{ε_0 m_e}) = √({${f(ne)}·(${f(QE)})^2}/{${f(EPS0)}·${f(ME)}})$ = <b>${f(wp)} rad/s</b>, c'est-à-dire $f_p = ω_p/2π$ = <b>${f(fp)} Hz</b> (≈ 8,98 √n_e Hz), et $λ_p = c/f_p$ = ${f(lp)} m.` });
    pasos.push({ t: 'Relation de dispersion', html: `Les équations de Maxwell avec le courant des électrons donnent $k^2 c^2 = ω^2 − ω_p^2$, soit un indice $n(ω) = √(1 − ω_p^2/ω^2)$ : inférieur à 1 et réel seulement si $ω > ω_p$.` });
    const r = { modo: 'plasma', ne, wp, fp, lp, fr, ang, fcrit: ang === null ? fp : fp / Math.cos((ang * Math.PI) / 180) };
    if (fr !== null) {
      const w = 2 * Math.PI * fr, x = w / wp;
      if (x > 1) {
        const n = Math.sqrt(1 - 1 / (x * x)), k = (w * n) / C0, vf = C0 / n, vg = C0 * n;
        Object.assign(r, { w, x, n, k, vf, vg, lam: (2 * Math.PI) / k, propaga: true });
        pasos.push({ t: 'L\'onde se propage', html: `$ω/ω_p = ${f(x)} > 1$ : $n = √(1 − 1/${f(x)}^2)$ = <b>${f(n)}</b>, $k = nω/c$ = ${f(k)} rad/m et $λ = 2π/k$ = <b>${f(r.lam)} m</b> (plus grande que dans le vide).` });
        pasos.push({ t: 'Vitesses de phase et de groupe', html: `$v_f = ω/k = c/n$ = <b>${f(vf)} m/s</b> (supérieure à c !), mais l'énergie et l'information voyagent à $v_g = dω/dk = c n$ = <b>${f(vg)} m/s</b> (inférieure à c). On a $v_f v_g = c^2$ : ${f(vf * vg)} m²/s².` });
      } else {
        const kap = (wp / C0) * Math.sqrt(1 - x * x);
        Object.assign(r, { w, x, kappa: kap, delta: 1 / kap, propaga: false });
        pasos.push({ t: 'L\'onde ne se propage pas', html: `$ω/ω_p = ${f(x)} < 1$ : $n$ est imaginaire, $k = ±jκ$ avec $κ = {ω_p}/c √(1 − ω^2/ω_p^2)$ = ${f(kap)} m<sup>-1</sup>. Le champ décroît comme $e^{−κ z}$ avec une profondeur de pénétration $δ = 1/κ$ = <b>${f(r.delta)} m</b> et l'onde est presque entièrement <b>réfléchie</b> (R = 1 sans pertes) : c'est pourquoi l'ionosphère réfléchit les ondes courtes et les métaux brillent.` });
      }
    }
    if (ang !== null) pasos.push({ t: 'Réflexion oblique dans l\'ionosphère', html: `Avec une incidence à $θ = ${f(ang)}°$, l'onde est réfléchie si $n ≤ sin θ$, c'est-à-dire si $f ≤ f_p/cos θ$ (loi de la sécante) : $f_{max} = ${f(fp)}/cos ${f(ang)}°$ = <b>${f(r.fcrit)} Hz</b>.` + (fr !== null ? ` À ${f(fr)} Hz ${fr <= r.fcrit ? '<b>elle est réfléchie</b>' : '<b>elle traverse</b> la couche'}.` : '') });
    else pasos.push({ t: 'Réflexion dans l\'ionosphère', html: `Avec une incidence verticale, la couche réfléchit toutes les fréquences inférieures à $f_p$ = ${f(fp)} Hz${fp > 1e6 ? ` (${f(fp / 1e6)} MHz)` : ''} ; au-dessus, l'onde la traverse.` });
    r.reflejada = fr !== null && (r.fcrit >= fr);
    r.pasos = pasos;
    r.curva = (n) => Array.from({ length: n + 1 }, (_, i) => { const kk = (i / n) * 3; return [kk, Math.sqrt(1 + kk * kk)]; }); // κ = kc/ω_p → ω/ω_p
    return r;
  }

  const CARAS = { antihorario: 'sens anti-horaire (vu par celui qui la reçoit : lévogyre)', horario: 'sens horaire (vu par celui qui la reçoit : dextrogyre)' };
  function elipse(Ex, Ey, dl) {
    const c = Math.cos(dl), s = Math.sin(dl), sum = Ex * Ex + Ey * Ey, dif = Ex * Ex - Ey * Ey, raiz = Math.sqrt(dif * dif + 4 * Ex * Ex * Ey * Ey * c * c);
    const a = Math.sqrt((sum + raiz) / 2), b = Math.sqrt(Math.max(0, (sum - raiz) / 2)), psi = 0.5 * Math.atan2(2 * Ex * Ey * c, dif), S3 = 2 * Ex * Ey * s;
    const lineal = Math.abs(S3) < 1e-9 * sum, circular = !lineal && Math.abs(b / a - 1) < 1e-9;
    return { a, b, psi: (psi * 180) / Math.PI, tipo: lineal ? 'lineal' : circular ? 'circular' : 'elliptique', giro: lineal ? null : S3 > 0 ? 'antihorario' : 'horario', razon: a ? b / a : 0 };
  }
  function suma(sc) {
    const caso = ['batido', 'estacionaria', 'polarizacion'].includes(sc.caso) ? sc.caso : 'batido', A1 = lee(sc, 'A1', 'l\'amplitude A₁', { cero: true }), A2 = lee(sc, 'A2', 'l\'amplitude A₂', { cero: true }), pasos = [];
    if (A1 === 0 && A2 === 0) throw new Error('L\'une des amplitudes doit être supérieure à 0');
    const dl = vacio(sc.delta) ? 0 : leeNum(sc.delta);
    if (!isFinite(dl)) throw new Error('Le déphasage doit être un nombre (en degrés)');
    const d = (dl * Math.PI) / 180, r = { modo: 'suma', caso, A1, A2, delta: dl };
    if (caso === 'batido') {
      const f1 = lee(sc, 'f1', 'la fréquence f₁'), f2 = lee(sc, 'f2', 'la fréquence f₂'), df = Math.abs(f1 - f2), fm = (f1 + f2) / 2, w1 = 2 * Math.PI * f1, w2 = 2 * Math.PI * f2;
      const env = (t) => Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos((w1 - w2) * t - d));
      Object.assign(r, { f1, f2, df, fm, Emax: A1 + A2, Emin: Math.abs(A1 - A2), env, Tb: df > 0 ? 1 / df : Infinity, E: (t) => A1 * Math.cos(w1 * t) + A2 * Math.cos(w2 * t + d) });
      pasos.push({ t: 'Deux ondes de fréquences différentes', html: `En un point fixe, $E_1 = ${f(A1)} cos(2π ${f(f1)} t)$ et $E_2 = ${f(A2)} cos(2π ${f(f2)} t + ${f(dl)}°)$. Elles s'additionnent parce que les équations de Maxwell sont linéaires (principe de superposition).` });
      if (df === 0) pasos.push({ t: 'Même fréquence : interférence', html: `Avec la même fréquence, le résultat est une autre onde d'amplitude $√(A_1^2 + A_2^2 + 2A_1 A_2 cos δ)$ = <b>${f(env(0))} V/m</b> (δ = ${f(dl)}°) : constructive si δ = 0° (A₁ + A₂ = ${f(A1 + A2)}) et destructive si δ = 180° (|A₁ − A₂| = ${f(Math.abs(A1 - A2))}).` });
      else {
        pasos.push({ t: 'Battements', html: `Si $f_1 ≈ f_2$, la somme est une oscillation à la fréquence moyenne $\\bar f = (f_1 + f_2)/2$ = <b>${f(fm)} Hz</b> avec une amplitude qui varie lentement entre $|A_1 − A_2|$ = ${f(r.Emin)} et $A_1 + A_2$ = ${f(r.Emax)} V/m : $A(t) = √(A_1^2 + A_2^2 + 2A_1 A_2 cos(Δω t − δ))$.` });
        pasos.push({ t: 'Fréquence de battement', html: `L'enveloppe se répète avec $f_b = |f_1 − f_2|$ = <b>${f(df)} Hz</b>, soit toutes les $T_b = 1/f_b$ = ${f(r.Tb)} s.` + (A1 === A2 ? ` Avec des amplitudes égales, $E = 2A cos(π Δf t) cos(2π \\bar f t)$ et l'enveloppe atteint 0.` : '') });
      }
    } else if (caso === 'estacionaria') {
      const fr = lee(sc, 'f1', 'la fréquence f'), w = 2 * Math.PI * fr, k = w / C0, lam = C0 / fr, ROE = Math.abs(A1 - A2) < 1e-12 * Math.max(A1, A2) ? Infinity : (A1 + A2) / Math.abs(A1 - A2);
      const env = (z) => Math.sqrt(A1 * A1 + A2 * A2 + 2 * A1 * A2 * Math.cos(2 * k * z + d));
      Object.assign(r, { f1: fr, w, k, lam, ROE, env, Emax: A1 + A2, Emin: Math.abs(A1 - A2), E: (z, t) => A1 * Math.cos(k * z - w * t) + A2 * Math.cos(k * z + w * t + d), Pr: A1 > 0 ? (A2 / A1) ** 2 : null });
      pasos.push({ t: 'Deux ondes de sens opposés', html: `$E = ${f(A1)} cos(kz − ωt) + ${f(A2)} cos(kz + ωt + ${f(dl)}°)$ avec $k = ω/c$ = ${f(k)} rad/m et $λ$ = ${f(lam)} m.` });
      pasos.push({ t: 'Amplitude en chaque point', html: `Chaque point oscille avec une amplitude qui dépend de $z$ : $A(z) = √(A_1^2 + A_2^2 + 2A_1 A_2 cos(2kz + δ))$, entre $|A_1 − A_2|$ = <b>${f(r.Emin)} V/m</b> (nœuds) et $A_1 + A_2$ = <b>${f(r.Emax)} V/m</b> (ventres). Ils se répètent tous les $λ/2$ = ${f(lam / 2)} m.` });
      pasos.push({ t: 'Rapport d\'onde stationnaire', html: `$ROE = {A_1 + A_2}/{|A_1 − A_2|}$ = <b>${ROE === Infinity ? '∞ (onde stationnaire pure : les nœuds sont nuls)' : f(ROE)}</b>${A1 > 0 ? `; la puissance réfléchie est $(A_2/A_1)^2$ = ${f(100 * r.Pr, 3)} % de l'incidente` : ''}.` });
    } else {
      const A = lee(sc, 'A1', 'l\'amplitude A₁'), B2 = lee(sc, 'A2', 'l\'amplitude A₂'), S = elipse(A, B2, d);
      Object.assign(r, { A1: A, A2: B2, E: S, estado: S });
      pasos.push({ t: 'Deux ondes à polarisations perpendiculaires', html: `$E_x = ${f(A)} cos(kz − ωt)$ et $E_y = ${f(B2)} cos(kz − ωt + ${f(dl)}°)$, avec la même fréquence et le même sens. Le champ résultant parcourt en chaque point la courbe $(E_x/A_1)^2 + (E_y/A_2)^2 − 2 (E_x E_y)/(A_1 A_2) cos δ = sin^2 δ$.` });
      pasos.push({ t: 'État de polarisation', html: S.tipo === 'lineal' ? `Avec δ = ${f(dl)}° (multiple de 180°), l'ellipse s'aplatit en une droite : polarisation <b>linéaire</b>, à un angle $ψ$ = <b>${f(S.psi)}°</b> de l'axe x et d'amplitude ${f(S.a)} V/m.` : S.tipo === 'circular' ? `Avec $A_1 = A_2$ et $δ = ±90°$, l'extrémité de E décrit un cercle de rayon ${f(S.a)} V/m : polarisation <b>circulaire</b>, ${CARAS[S.giro]}.` : `Polarisation <b>elliptique</b>, ${CARAS[S.giro]} : demi-axes $a$ = ${f(S.a)} V/m et $b$ = ${f(S.b)} V/m (b/a = ${f(S.razon)}), avec le grand axe à $ψ$ = <b>${f(S.psi)}°</b> de l'axe x.` });
      pasos.push({ t: 'Demi-axes', html: `$a^2, b^2 = {1}/{2}[A_1^2 + A_2^2 ± √((A_1^2 − A_2^2)^2 + 4 A_1^2 A_2^2 cos^2 δ)]$ et $tan 2ψ = {2 A_1 A_2 cos δ}/{A_1^2 − A_2^2}$. On a $a^2 + b^2 = A_1^2 + A_2^2$ = ${f(A * A + B2 * B2)}.` });
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
    if (I < 1e-18) return { I: 0, tipo: 'sans lumière' };
    const S1 = J[0][0] ** 2 + J[0][1] ** 2 - J[1][0] ** 2 - J[1][1] ** 2, S2 = 2 * (J[0][0] * J[1][0] + J[0][1] * J[1][1]), S3 = 2 * (J[0][0] * J[1][1] - J[0][1] * J[1][0]);
    const psi = (0.5 * Math.atan2(S2, S1) * 180) / Math.PI, chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, S3 / I))), lineal = Math.abs(S3 / I) < 1e-6, circ = Math.abs(S3 / I) > 1 - 1e-9;
    return { I, tipo: lineal ? 'lineal' : circ ? 'circular' : 'elliptique', psi, razon: Math.abs(Math.tan(chi)), giro: lineal ? null : S3 > 0 ? 'antihorario' : 'horario', S: [S1 / I, S2 / I, S3 / I] };
  }
  const NOMEL = { pol: 'Polariseur', l4: 'Lame λ/4', l2: 'Lame λ/2' };
  const txtEstado = (e) => (e.tipo === 'sans lumière' ? 'aucune lumière ne passe' : e.tipo === 'lineal' ? `linéaire à ${f(e.psi, 4)}° de l'axe x` : e.tipo === 'circular' ? `circular ${e.giro === 'antihorario' ? 'a izquierdas (antihoraria)' : 'a derechas (horaria)'}` : `elliptique ${e.giro === 'antihorario' ? 'lévogyre (anti-horaire)' : 'dextrogyre (horaire)'}, b/a = ${f(e.razon, 3)}, grand axe à ${f(e.psi, 4)}°`);
  function retardo(sc) {
    const luz = ['lineal', 'circI', 'circD'].includes(sc.luz) ? sc.luz : 'lineal', alfa = luz === 'lineal' ? (vacio(sc.alfa) ? 0 : leeNum(sc.alfa)) : 0, pasos = [];
    if (!isFinite(alfa)) throw new Error('L\'angle de la lumière doit être un nombre (en degrés)');
    const R2 = Math.SQRT1_2, ai = (alfa * Math.PI) / 180;
    let J = luz === 'lineal' ? [[cx(Math.cos(ai)), cx(0)], [cx(Math.sin(ai)), cx(0)]].map((r) => r[0]) : luz === 'circI' ? [cx(R2), cx(0, R2)] : [cx(R2), cx(0, -R2)];
    const elems = [];
    for (let i = 1; i <= 4; i++) { const t = sc['e' + i]; if (!t) continue; if (!NOMEL[t]) throw new Error(`L'élément ${i} n'est pas valide`); const a = vacio(sc['a' + i]) ? 0 : leeNum(sc['a' + i]); if (!isFinite(a)) throw new Error(`L'angle de l'élément ${i} doit être un nombre`); elems.push({ t, a }); }
    if (!elems.length) throw new Error('Choisissez au moins un élément (polariseur ou lame)');
    pasos.push({ t: 'Calcul de Jones', html: `La lumière polarisée se décrit par le vecteur $E = (E_x, E_y)$ à composantes complexes et chaque élément par une matrice 2×2 : $E_{sort} = M · E_{ent}$. Polariseur à θ : $M = [[cos^2 θ, cos θ sin θ], [cos θ sin θ, sin^2 θ]]$. Lame à retard avec l'axe rapide à θ : $M = R(−θ) · diag(1, e^{jΓ}) · R(θ)$, avec $Γ = 90°$ ($λ/4$) ou $180°$ ($λ/2$).` });
    pasos.push({ t: 'Lumière d\'entrée', html: `${luz === 'lineal' ? `Linéaire à ${f(alfa)}° : $E = (cos α, sin α)$ = (${f(Math.cos(ai), 4)} ; ${f(Math.sin(ai), 4)})` : luz === 'circI' ? 'Circulaire gauche : $E = (1, j)/√2$' : 'Circulaire droite : $E = (1, −j)/√2$'}. Intensité 1 (relative).` });
    const etapas = [{ nombre: 'Entrée', I: 1, estado: estadoJones([[J[0][0], J[0][1]], [J[1][0], J[1][1]]]), J: J.map((z) => z.slice()) }];
    elems.forEach((e, i) => {
      const M = jonesElem(e.t, (e.a * Math.PI) / 180); J = mv(M, J);
      const est = estadoJones([[J[0][0], J[0][1]], [J[1][0], J[1][1]]]);
      etapas.push({ nombre: `${NOMEL[e.t]} a ${f(e.a)}°`, I: est.I, estado: est, J: J.map((z) => z.slice()), M });
      pasos.push({ t: `${i + 1}. ${NOMEL[e.t]} (axe à ${f(e.a)}°)`, html: `$M$ = ${matTxt(M)}<br>$E$ = (${cTxt(J[0])} ; ${cTxt(J[1])}), $I$ = <b>${f(est.I, 4)}</b> : lumière ${txtEstado(est)}.` });
    });
    const fin = etapas[etapas.length - 1];
    pasos.push({ t: 'Résultat', html: `Il sort une lumière ${txtEstado(fin.estado)} avec une intensité de <b>${f(100 * fin.I, 4)} %</b> de celle d'entrée.` + (fin.estado.tipo === 'lineal' && etapas.length > 1 ? '' : '') });
    return { modo: 'retardo', luz, alfa, elems, etapas, I: fin.I, estado: fin.estado, texto: txtEstado(fin.estado), pasos };
  }

  const MODOS = { plasma, suma, retardo, onda, expresion, incidencia, intensidad, perdidas, polarizadores, poynting };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : onda(sc); }

  const ejemplos = [
    { clave: 'fm', nombre: 'Onde radio FM dans le vide', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '100e6', E0: '0,05', prop: '+z', pol: '+x', er: '', mr: '' } },
    { clave: 'laser', nombre: 'Lumière d\'un laser rouge (λ = 633 nm)', sc: { modo: 'onda', medio: 'vacio', dato: 'lambda', valor: '633e-9', E0: '1000', prop: '+x', pol: '+y', er: '', mr: '' } },
    { clave: 'agua', nombre: 'Lumière qui entre dans l\'eau', sc: { modo: 'onda', medio: 'medio', dato: 'f', valor: '5e14', E0: '200', prop: '+z', pol: '+y', er: '1,77', mr: '1' } },
    { clave: 'expresion', nombre: 'À partir de k : E = 30 cos(2,09y + ωt) k̂', sc: { modo: 'onda', medio: 'vacio', dato: 'k', valor: '2,094', E0: '30', prop: '-y', pol: '+z', er: '', mr: '' } },
    { clave: 'dielectrico', nombre: 'Micro-ondes dans un diélectrique (εr = 4)', sc: { modo: 'onda', medio: 'medio', dato: 'f', valor: '2,45e9', E0: '100', prop: '+z', pol: '+x', er: '4', mr: '1' } },
    { clave: 'diagonal', nombre: 'Onde en diagonale avec phase initiale', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '3e9', E0: '10', prop: 'otra', kx: '1', ky: '1', kz: '0', pol: '+z', er: '', mr: '', fase: '60' } },
    { clave: 'circular', nombre: 'Polarisation circulaire', sc: { modo: 'onda', medio: 'vacio', dato: 'lambda', valor: '0,03', E0: '20', prop: '+z', pol: '+x', er: '', mr: '', tipoPol: 'circular', giro: 'antihorario' } },
    { clave: 'eliptica', nombre: 'Polarisation elliptique', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '1e9', E0: '30', prop: '+x', pol: '+y', er: '', mr: '', tipoPol: 'eliptica', E02: '15', delta: '-90' } },
    { clave: 'expr-E', nombre: 'À partir de E(r, t) = 30 cos(2,094y + 6,283·10⁸t) k̂', sc: { modo: 'expresion', campo: 'E', expr: '30 cos(2,094y + 6,283e8t) k' } },
    { clave: 'expr-B', nombre: 'À partir de B(r, t) dans un verre', sc: { modo: 'expresion', campo: 'B', expr: '2e-7 sen(1,5e7z - 3e15t) j' } },
    { clave: 'conductor', nombre: 'Onde stationnaire devant un conducteur', sc: { modo: 'incidencia', destino: 'conductor', medio: 'vacio', dato: 'f', valor: '1e9', E0: '50', er: '', mr: '', er2: '', mr2: '' } },
    { clave: 'vidrio', nombre: 'Lumière qui passe de l\'air au verre', sc: { modo: 'incidencia', destino: 'dielectrico', medio: 'vacio', dato: 'lambda', valor: '600e-9', E0: '100', er: '', mr: '', er2: '2,25', mr2: '' } },
    { clave: 'sol', nombre: 'Lumière du Soleil sur la Terre', sc: { modo: 'intensidad', medio: 'vacio', de: 'I', I: '1361', P: '', r: '', E0: '', A: '1' } },
    { clave: 'bombilla', nombre: 'Ampoule de 100 W à 2 m', sc: { modo: 'intensidad', medio: 'vacio', de: 'fuente', P: '100', r: '2', I: '', E0: '', A: '' } },
    { clave: 'antena', nombre: 'Antenne de 50 kW à 10 km', sc: { modo: 'intensidad', medio: 'vacio', de: 'fuente', P: '50000', r: '10000', I: '', E0: '', A: '' } },
    { clave: 'vela', nombre: 'Voile solaire réfléchissante (E₀ donné)', sc: { modo: 'intensidad', medio: 'vacio', de: 'E0', E0: '1012', P: '', r: '', I: '', A: '100' } },
    { clave: 'malus', nombre: 'Loi de Malus : lumière linéaire à 30° d\'un polariseur', sc: { modo: 'polarizadores', luz: 'lineal', alfa: '0', I0: '100', angulos: '30' } },
    { clave: 'tres-polarizadores', nombre: 'Lumière naturelle à travers trois polariseurs (0°, 45°, 90°)', sc: { modo: 'polarizadores', luz: 'natural', I0: '1000', angulos: '0; 45; 90' } },
    { clave: 'cruzados', nombre: 'Deux polariseurs croisés (0° et 90°)', sc: { modo: 'polarizadores', luz: 'natural', I0: '1000', angulos: '0; 90' } },
    { clave: 'poy-hilo', nombre: 'Poynting dans un fil de cuivre parcouru par un courant', sc: { modo: 'poynting', sis: 'hilo', a: '1e-3', L: '2', I: '10', sigma: '5,8e7' } },
    { clave: 'poy-condensador', nombre: 'Poynting dans un condensateur qui se charge', sc: { modo: 'poynting', sis: 'condensador', a: '0,05', d: '0,002', V: '100', I: '0,5' } },
    { clave: 'poy-coaxial', nombre: 'Puissance dans un câble coaxial', sc: { modo: 'poynting', sis: 'coaxial', a: '1e-3', b: '3,5e-3', V: '50', I: '2', r: '' } },
    { clave: 'plasma-iono', nombre: 'Ionosphère (nₑ = 10¹² m⁻³) : une onde de 5 MHz est-elle réfléchie ?', sc: { modo: 'plasma', ne: '1e12', valor: '5e6', ang: '' } },
    { clave: 'plasma-obl', nombre: 'Ionosphère avec une incidence oblique de 60° (onde de 15 MHz)', sc: { modo: 'plasma', ne: '1e12', valor: '15e6', ang: '60' } },
    { clave: 'plasma-metal', nombre: 'Électrons d\'un métal (sodium) : transparent à l\'ultraviolet', sc: { modo: 'plasma', ne: '2,5e28', valor: '2e15', ang: '' } },
    { clave: 'suma-batido', nombre: 'Battements : deux ondes de 100 et 110 Hz', sc: { modo: 'suma', caso: 'batido', A1: '1', A2: '1', f1: '100', f2: '110', delta: '' } },
    { clave: 'suma-estacionaria', nombre: 'Onde stationnaire partielle : incidente et réfléchie de 1 GHz', sc: { modo: 'suma', caso: 'estacionaria', A1: '10', A2: '4', f1: '1e9', f2: '', delta: '180' } },
    { clave: 'suma-circular', nombre: 'Deux ondes orthogonales avec δ = 90° : polarisation circulaire', sc: { modo: 'suma', caso: 'polarizacion', A1: '10', A2: '10', f1: '', f2: '', delta: '90' } },
    { clave: 'suma-eliptica', nombre: 'Deux ondes orthogonales avec δ = 60° : polarisation elliptique', sc: { modo: 'suma', caso: 'polarizacion', A1: '10', A2: '6', f1: '', f2: '', delta: '60' } },
    { clave: 'ret-circular', nombre: 'Lame λ/4 à 45° : de linéaire à circulaire', sc: { modo: 'retardo', luz: 'lineal', alfa: '0', e1: 'l4', a1: '45', e2: '', a2: '', e3: '', a3: '', e4: '', a4: '' } },
    { clave: 'ret-media', nombre: 'Lame λ/2 entre polariseurs croisés : elle fait tourner la polarisation', sc: { modo: 'retardo', luz: 'lineal', alfa: '0', e1: 'pol', a1: '0', e2: 'l2', a2: '45', e3: 'pol', a3: '90', e4: '', a4: '' } },
    { clave: 'ret-analizador', nombre: 'Lumière circulaire qui devient linéaire avec une λ/4 et un analyseur', sc: { modo: 'retardo', luz: 'circI', alfa: '', e1: 'l4', a1: '0', e2: 'pol', a2: '135', e3: '', a3: '', e4: '', a4: '' } },
    { clave: 'cobre', nombre: 'Cuivre à 1 MHz (bon conducteur)', sc: { modo: 'perdidas', er: '1', mr: '1', sigma: '5,8e7', valor: '1e6', E0: '1', d: '0,0001' } },
    { clave: 'mar', nombre: 'Eau de mer à 1 kHz', sc: { modo: 'perdidas', er: '81', mr: '1', sigma: '4', valor: '1000', E0: '1', d: '10' } },
    { clave: 'tierra', nombre: 'Terre humide à 1 MHz', sc: { modo: 'perdidas', er: '10', mr: '1', sigma: '0,01', valor: '1e6', E0: '10', d: '5' } },
    { clave: 'baquelita', nombre: 'Diélectrique à faibles pertes', sc: { modo: 'perdidas', er: '4,9', mr: '1', sigma: '1e-6', valor: '1e8', E0: '5', d: '100' } },
  ];
  return { resolver, plasma, suma, retardo, elipse, estadoJones, jonesElem, onda, expresion, incidencia, intensidad, perdidas, polarizadores, poynting, leeExpresion, banda, ejemplos, f, C0, MU0, EPS0 };
})();

