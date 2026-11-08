/* =====================================================================
   Ondas electromagnéticas planas (sin DOM): onda plana armónica en el
   vacío o en un medio (εr, μr), en cualquier dirección y con fase, con
   polarización lineal, circular o elíptica: frecuencia, longitud de onda,
   número de onda, el campo B con su dirección (k̂ × Ê), la expresión de
   E(r, t) y B(r, t), la impedancia, la intensidad y la presión de
   radiación; la onda a partir de su expresión E(r, t) o B(r, t);
   incidencia normal sobre un conductor perfecto (onda estacionaria) o un
   dieléctrico; intensidad de una fuente puntual; y medios con pérdidas
   (conductividad σ): atenuación, profundidad de penetración e impedancia
   compleja; luz por polarizadores (ley de Malus); y el vector de Poynting
   con el balance de energía de un hilo, un condensador y un coaxial. Unidades del SI.
   ===================================================================== */
const OndasEM = (() => {
  const C0 = 299792458, MU0 = 1.25663706212e-6, EPS0 = 8.8541878128e-12;
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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${may(nom)} debe ser un número (se admite 3e8 o 3·10^8)`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${may(nom)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
    return v;
  }

  /* ---------- Direcciones ---------- */
  const EJES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  const GORRO = { x: 'î', y: 'ĵ', z: 'k̂' };
  const dir = (s) => { const m = /^([+-]?)([xyz])$/.exec(s || ''); if (!m) throw new Error('Dirección no válida'); const e = EJES[m[2]].map((c) => (m[1] === '-' ? -c : c)); return { v: e, eje: m[2], signo: m[1] === '-' ? -1 : 1 }; };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nomDir = (v) => { const i = v.findIndex((c) => Math.abs(c) > 0.5); return `${v[i] < 0 ? '−' : ''}${GORRO['xyz'[i]]}`; };
  const unit = (v) => { const n = Math.hypot(...v); return v.map((c) => (Math.abs(c / n) < 1e-12 ? 0 : c / n)); };
  const enEje = (v) => v.filter((c) => Math.abs(c) > 1e-12).length === 1;
  // vector unitario: î, −k̂ o (0,6 î + 0,8 ĵ)
  const vecTxt = (v) => (enEje(v) ? nomDir(v) : `(${v.map((c, i) => (Math.abs(c) < 1e-12 ? '' : `${c < 0 ? '− ' : '+ '}${f(Math.abs(c))} ${GORRO['xyz'[i]]}`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−')})`);
  const dirExp = (v) => { const t = vecTxt(v); return t[0] === '−' ? `(${t})` : t; };
  const dirTxt = (v) => (enEje(v) ? (() => { const i = v.findIndex((c) => Math.abs(c) > 0.5); return `${v[i] < 0 ? '−' : '+'}${'xyz'[i]}`; })() : vecTxt(v));
  // dirección elegida en la lista (+x…−z) o escrita por componentes
  function vecDe(sc, k, p, nom) {
    if (sc[k] !== 'otra') { const d = dir(sc[k]); return { v: d.v, eje: d.eje, signo: d.signo }; }
    const v = ['x', 'y', 'z'].map((e) => { const x = leeNum(vacio(sc[p + e]) ? '0' : sc[p + e]); if (!isFinite(x)) throw new Error(`La componente ${e} de ${nom} debe ser un número`); return x; });
    if (!(Math.hypot(...v) > 0)) throw new Error(`Escribe alguna componente de ${nom}`);
    const u = unit(v), i = u.findIndex((c) => Math.abs(c) > 1 - 1e-12);
    return { v: u, eje: i >= 0 ? 'xyz'[i] : null, signo: i >= 0 ? Math.sign(u[i]) : 1 };
  }
  // k·r con las componentes de k: 2,094z o 1,481x + 1,481y
  const kr = (kv, k) => kv.map((c, i) => (Math.abs(c) < 1e-12 ? '' : `${c < 0 ? '− ' : '+ '}${f(Math.abs(c * k))}${'xyz'[i]}`)).filter(Boolean).join(' ').replace(/^\+ /, '').replace(/^− /, '−');

  /* ---------- Espectro ---------- */
  const COLORES = [[380, 'violeta'], [450, 'azul'], [495, 'verde'], [570, 'amarillo'], [590, 'naranja'], [620, 'rojo'], [750, '']];
  function banda(fr) {
    const l = C0 / fr;
    if (l > 1) return 'ondas de radio';
    if (l > 1e-3) return 'microondas';
    if (l > 750e-9) return 'infrarrojo';
    if (l >= 380e-9) { const nm = l * 1e9; let c = 'rojo'; for (let i = 0; i < COLORES.length - 1; i++) if (nm >= COLORES[i][0] && nm < COLORES[i + 1][0]) c = COLORES[i][1]; return `luz visible (${c})`; }
    if (l > 10e-9) return 'ultravioleta';
    if (l > 10e-12) return 'rayos X';
    return 'rayos gamma';
  }

  /* ---------- Medio ---------- */
  function medio(sc) {
    const vacioM = sc.medio !== 'medio';
    const er = vacioM ? 1 : lee(sc, 'er', 'la permitividad relativa εr'), mr = vacioM || vacio(sc.mr) ? 1 : lee(sc, 'mr', 'la permeabilidad relativa μr');
    const eps = er * EPS0, mu = mr * MU0, v = 1 / Math.sqrt(eps * mu), n = Math.sqrt(er * mr), eta = Math.sqrt(mu / eps);
    return { vacioM, er, mr, eps, mu, v, n, eta };
  }
  // frecuencia a partir del dato que se dé (f, λ, ω o k) en un medio de velocidad v
  function frecuencia(sc, v) {
    const dato = ['f', 'lambda', 'omega', 'k'].includes(sc.dato) ? sc.dato : 'f';
    const x = lee(sc, 'valor', { f: 'la frecuencia f', lambda: 'la longitud de onda λ', omega: 'la frecuencia angular ω', k: 'el número de onda k' }[dato]);
    const fr = dato === 'f' ? x : dato === 'lambda' ? v / x : dato === 'omega' ? x / (2 * Math.PI) : (x * v) / (2 * Math.PI);
    return { dato, x, fr, w: 2 * Math.PI * fr, k: (2 * Math.PI * fr) / v, lam: v / fr, T: 1 / fr };
  }
  const medioTxt = (M) => (M.vacioM ? 'En el vacío: $v = c = 1/√(μ_0 ε_0)$ = 2,998·10<sup>8</sup> m/s, $η_0 = √(μ_0/ε_0)$ = 376,7 Ω'
    : `Medio con ε<sub>r</sub> = ${f(M.er)}${M.mr !== 1 ? ` y μ<sub>r</sub> = ${f(M.mr)}` : ''}: índice $n = √(ε_r μ_r)$ = ${f(M.n)}, $v = c/n$ = ${f(M.v)} m/s, $η = √(μ/ε) = η_0 √(μ_r/ε_r)$ = ${f(M.eta)} Ω`);

  /* ---------- Onda plana ---------- */
  function onda(sc) {
    const M = medio(sc), F = frecuencia(sc, M.v), E0 = lee(sc, 'E0', 'la amplitud E₀'), pasos = [...(sc.previos || [])];
    const K = vecDe({ prop: '+z', ...sc }, 'prop', 'k', 'la dirección de propagación'), Ed = vecDe({ pol: '+x', ...sc }, 'pol', 'e', 'la dirección de E');
    if (Math.abs(K.v[0] * Ed.v[0] + K.v[1] * Ed.v[1] + K.v[2] * Ed.v[2]) > 1e-9) throw new Error('E tiene que ser perpendicular a la dirección de propagación (la onda es transversal)');
    const Bv = cruz(K.v, Ed.v).map((c) => (Math.abs(c) < 1e-12 ? 0 : c)), B0 = E0 / M.v;
    const phiG = vacio(sc.fase) ? 0 : leeNum(sc.fase), phi = (phiG * Math.PI) / 180;
    if (!isFinite(phi)) throw new Error('La fase debe ser un número (en grados)');
    const tp = ['circular', 'eliptica'].includes(sc.tipoPol) ? sc.tipoPol : 'lineal';
    const E02 = tp === 'circular' ? E0 : tp === 'eliptica' ? lee(sc, 'E02', 'la segunda amplitud E₀₂', { cero: true }) : 0;
    const dG = tp === 'circular' ? (sc.giro === 'horario' ? -90 : 90) : tp === 'eliptica' ? leeNum(vacio(sc.delta) ? '90' : sc.delta) : 0, dl = (dG * Math.PI) / 180;
    if (!isFinite(dl)) throw new Error('El desfase δ debe ser un número (en grados)');
    if (!sc.previos) pasos.push({ t: 'Medio', html: medioTxt(M) });
    const fTxt = { f: `f = ${f(F.fr)} Hz ⇒ $ω = 2π f$ = ${f(F.w)} rad/s`, lambda: `λ = ${f(F.x)} m ⇒ $f = v/λ = ${f(M.v)}/${f(F.x)}$ = ${f(F.fr)} Hz, $ω = 2π f$ = ${f(F.w)} rad/s`, omega: `ω = ${f(F.w)} rad/s ⇒ $f = ω/(2π)$ = ${f(F.fr)} Hz`, k: `k = ${f(F.x)} rad/m ⇒ $ω = k v$ = ${f(F.w)} rad/s, f = ${f(F.fr)} Hz` }[F.dato];
    pasos.push({ t: 'Frecuencia, longitud de onda y número de onda', html: `${fTxt}<br>$λ = v/f$ = <b>${f(F.lam)} m</b>, &ensp; $k = {2π}/λ = ω/v$ = <b>${f(F.k)} rad/m</b>, &ensp; $T = 1/f$ = ${f(F.T)} s${M.vacioM ? '' : `<br>En el vacío tendría $λ_0 = c/f$ = ${f(C0 / F.fr)} m: dentro del medio $λ = {λ_0}/n$.`}<br>Zona del espectro: ${banda(F.fr)}` });
    // con un eje se escribe kz + ωt; en otra dirección, k·r − ωt con las componentes de k
    const ar = K.eje ? K.eje : 'r', fTxt2 = phi ? ` ${phi < 0 ? '−' : '+'} ${f(Math.abs(phi))}` : '';
    const fase = K.eje ? `${f(F.k)}${ar} ${K.signo > 0 ? '−' : '+'} ${f(F.w)}t${fTxt2}` : `${kr(K.v, F.k)} − ${f(F.w)}t${fTxt2}`;
    const fase2 = (d) => (d ? `${fase} ${d < 0 ? '−' : '+'} ${f(Math.abs(d))}` : fase), menosE1 = Ed.v.map((c) => (c ? -c : 0));
    const Eexp = tp === 'lineal' ? `E(${ar}, t) = ${f(E0)} cos(${fase}) ${dirExp(Ed.v)} V/m` : `E(${ar}, t) = ${f(E0)} cos(${fase}) ${dirExp(Ed.v)} + ${f(E02)} cos(${fase2(dl)}) ${dirExp(Bv)} V/m`;
    const Bexp = tp === 'lineal' ? `B(${ar}, t) = ${f(B0)} cos(${fase}) ${dirExp(Bv)} T` : `B(${ar}, t) = ${f(B0)} cos(${fase}) ${dirExp(Bv)} + ${f(E02 / M.v)} cos(${fase2(dl)}) ${dirExp(menosE1)} T`;
    const ek = (v) => (vecTxt(v)[0] === '−' ? `(${vecTxt(v)})` : vecTxt(v));
    pasos.push({ t: 'Campo magnético', html: `En una onda plana E, B y la dirección de propagación son perpendiculares entre sí y $B_0 = {E_0}/v = ${f(E0)}/{${f(M.v)}}$ = <b>${f(B0)} T</b><br>La dirección de B sale de k̂ = Ê × B̂, es decir B̂ = k̂ × Ê = ${ek(K.v)} × ${ek(Ed.v)} = <b>${vecTxt(Bv)}</b>` });
    if (tp !== 'lineal') {
      const forma = tp === 'circular' || (Math.abs(E02 - E0) < 1e-12 * E0 && Math.abs(Math.abs(dG) - 90) < 1e-9) ? 'circular' : Math.abs(Math.sin(dl)) < 1e-12 || E02 === 0 ? 'lineal' : 'elíptica', gira = Math.sin(dl) > 0 ? 'antihorario' : 'horario';
      pasos.push({ t: 'Polarización', html: `E es la suma de dos ondas perpendiculares: E<sub>01</sub> = ${f(E0)} V/m según ${vecTxt(Ed.v)} y E<sub>02</sub> = ${f(E02)} V/m según k̂ × Ê = ${vecTxt(Bv)}, desfasadas δ = ${f(dG)}°. ${forma === 'lineal' ? 'Con δ = 0° o 180° siguen en fase y la polarización sigue siendo <b>lineal</b>, inclinada.' : `En un punto fijo la punta de E describe una ${forma === 'circular' ? '<b>circunferencia</b> (polarización circular: E<sub>01</sub> = E<sub>02</sub> y δ = ±90°)' : '<b>elipse</b> (polarización elíptica)'} y gira en sentido <b>${gira}</b> visto por quien recibe la onda (mirando hacia la fuente).`}${forma === 'circular' ? ` |E| es constante, ${f(E0)} V/m.` : ''}` });
    }
    const pref = phi ? `, con fase inicial φ = ${f(phiG)}° = ${f(phi)} rad` : '';
    pasos.push({ t: 'Expresiones', html: `Con la forma cos(k·r − ωt + φ), que avanza hacia ${dirTxt(K.v)}${K.eje ? '' : ` (k = k k̂ = ${kr(K.v, F.k).replace(/([xyz])/g, (m) => ` ${GORRO[m]}`)} rad/m)`}${pref}:<br>${Eexp}<br>${Bexp}` });
    const I = (E0 * E0 + E02 * E02) / (2 * M.eta), u = 0.5 * M.eps * (E0 * E0 + E02 * E02);
    pasos.push({ t: 'Energía e intensidad', html: `Vector de Poynting $S = {E × B}/μ$, en la dirección ${vecTxt(K.v)}. Su valor medio es la intensidad:<br>${tp === 'lineal' ? `$I = {E_0^2}/{2η} = {${f(E0)}^2}/{2·${f(M.eta)}}$` : `$I = {E_01^2 + E_02^2}/{2η} = {${f(E0)}^2 + ${f(E02)}^2}/{2·${f(M.eta)}}$`} = <b>${f(I)} W/m<sup>2</sup></b><br>Densidad media de energía $u = 1/2 ε E_0^2$ = ${f(u)} J/m<sup>3</sup> (la mitad en E y la mitad en B), y $I = u v$.<br>Valores eficaces: $E_ef = {E_0}/√2$ = ${f(E0 / Math.SQRT2)} V/m, B<sub>ef</sub> = ${f(B0 / Math.SQRT2)} T` });
    pasos.push({ t: 'Presión de radiación', html: `Sobre una superficie que la absorbe, $p = I/v$ = ${f(I / M.v)} Pa; si la refleja del todo, $p = {2I}/v$ = ${f((2 * I) / M.v)} Pa.` });
    return { modo: 'onda', M, F, E0, B0, K, Ed, Bv, I, u, Eexp, Bexp, fase, phi, tp, E02, dl, pa: I / M.v, alfa: 0, pasos };
  }

  /* ---------- Onda a partir de su expresión ---------- */
  // un número con π: 2π, π/2, −1,5e8, 3·10^8
  function numPi(t) {
    let s = t.replace(/\s/g, ''), m = 1;
    if (/π|pi/.test(s)) { m = Math.PI; s = s.replace(/·?(π|pi)/, ''); if (s === '' || s === '+') s = '1'; if (s === '-' || s === '−') s = '-1'; if (/^[+\-−]?\//.test(s)) s = s.replace(/^([+\-−]?)\//, '$11/'); }
    const fr = /^(.*)\/(.*)$/.exec(s);
    if (fr) { const a = numPi(fr[1] || '1'), b = numPi(fr[2]); return (a * m) / b; }
    const v = leeNum(s);
    return v * m;
  }
  // E0 cos(kx·x + ky·y + kz·z − ωt + φ) dirección, con sen o cos
  function leeExpresion(texto) {
    let s = String(texto || '').trim().replace(/\s+/g, ' ').replace(/^[EB]\s*\([^)]*\)\s*=\s*/i, '').replace(/^[EB]\s*=\s*/i, '').replace(/[−–]/g, '-').replace(/sin/gi, 'sen');
    const m0 = /^(.*?)(cos|sen)\s*\(/i.exec(s);
    let fin = -1;
    if (m0) for (let i = m0[0].length, n = 1; i < s.length; i++) { if (s[i] === '(') n++; else if (s[i] === ')' && !--n) { fin = i; break; } }
    if (fin < 0) throw new Error('Escribe la onda como E₀ cos(k·r − ωt + φ) y su dirección, p. ej. 30 cos(2,09y + 6,28e8t) k');
    const m = [s, m0[1], m0[2], s.slice(m0[0].length, fin), s.slice(fin + 1).trim()];
    let amp = m[1].replace(/[·*×\s]/g, '') || '1'; if (amp === '-') amp = '-1'; if (amp === '+') amp = '1';
    const A = numPi(amp);
    if (!isFinite(A) || A === 0) throw new Error('No entiendo la amplitud de la expresión');
    const c = { x: 0, y: 0, z: 0, t: 0, '': 0 };
    const arg = m[3].replace(/\s/g, '').replace(/(\d)([eE])([+\-]?\d)/g, '$1E$3');
    const terms = arg.match(/[+\-]?[^+\-]+(?:E[+\-]?\d+[^+\-]*)?/g) || [];
    for (const t0 of terms) {
      const t = t0.replace(/E/g, 'e'), v = /([xyzt])$/.exec(t), var_ = v ? v[1] : '', num = var_ ? t.slice(0, -1).replace(/[·*]$/, '') : t;
      const x = numPi(num === '' || num === '+' ? '1' : num === '-' ? '-1' : num);
      if (!isFinite(x)) throw new Error(`No entiendo el término «${t0}» de la fase`);
      c[var_] += x;
    }
    // dirección: î ĵ k̂, i j k, x y z, ux…, o (a, b, c)
    let d = m[4].replace(/\s/g, '').replace(/V\/m|T$/i, ''), sg = 1;
    if (d[0] === '-') { sg = -1; d = d.slice(1); }
    let dv;
    const vec = /^\(([^,]+),([^,]+),([^,]+)\)$/.exec(d.replace(/;/g, ','));
    if (vec) dv = vec.slice(1).map((x) => numPi(x));
    else { const e = { 'î': 'x', 'ĵ': 'y', 'k̂': 'z', i: 'x', j: 'y', k: 'z', x: 'x', y: 'y', z: 'z', ux: 'x', uy: 'y', uz: 'z', u_x: 'x', u_y: 'y', u_z: 'z' }[d.normalize('NFC')] || { 'x̂': 'x', 'ŷ': 'y', 'ẑ': 'z' }[d]; if (!e) throw new Error('Falta la dirección del campo al final: î, ĵ, k̂ o un vector (a, b, c)'); dv = EJES[e].slice(); }
    if (dv.some((x) => !isFinite(x)) || !(Math.hypot(...dv) > 0)) throw new Error('La dirección del campo no es válida');
    return { A: A * sg, c, dv, func: m[2].toLowerCase() };
  }
  function expresion(sc) {
    const campo = sc.campo === 'B' ? 'B' : 'E', X = leeExpresion(sc.expr), pasos = [];
    let kv = [X.c.x, X.c.y, X.c.z], w = -X.c.t, phi = X.c[''];
    if (X.func === 'sen') phi -= Math.PI / 2;
    if (!(Math.hypot(...kv) > 0)) throw new Error('Falta la parte espacial de la fase (términos en x, y o z)');
    if (!w) throw new Error('Falta el término en t de la fase');
    let nota = '';
    if (w < 0) { kv = kv.map((c) => -c); w = -w; phi = -phi; nota = ' Como el coseno es par, cos(k·r + ωt + φ) = cos(−k·r − ωt − φ): la onda va en el sentido de −k.'; }
    const k = Math.hypot(...kv), v = w / k, n = C0 / v, amp = Math.abs(X.A) * Math.hypot(...X.dv), dv = unit(X.dv).map((c) => c * Math.sign(X.A)), kh = unit(kv);
    pasos.push({ t: 'Lectura de la expresión', html: `${X.func === 'sen' ? 'sen θ = cos(θ − π/2). ' : ''}Comparando con ${campo}<sub>0</sub> cos(k·r − ωt + φ): amplitud ${campo}<sub>0</sub> = <b>${f(amp)} ${campo === 'E' ? 'V/m' : 'T'}</b> según ${vecTxt(dv)}, k = (${kv.map((c) => f(c)).join(', ')}) rad/m, de módulo k = <b>${f(k)} rad/m</b>, ω = <b>${f(w)} rad/s</b>${phi ? ` y φ = ${f(phi)} rad` : ''}.${nota} Se propaga hacia ${vecTxt(kh)}.` });
    if (n < 1 - 1e-3) throw new Error(`Con esos k y ω la onda iría a ω/k = ${f(v).replace(/<[^>]+>/g, '')} m/s, más deprisa que la luz: revisa la expresión`);
    const enVacio = Math.abs(n - 1) < 2e-3;
    pasos.push({ t: 'Velocidad y medio', html: `$v = ω/k = ${f(w)}/{${f(k)}}$ = <b>${f(v)} m/s</b>${enVacio ? ': es c, así que la onda va por el vacío (o el aire).' : `, menor que c: va por un medio de índice $n = c/v$ = <b>${f(n)}</b> (si μ<sub>r</sub> = 1, $ε_r = n^2$ = ${f(n * n)}).`}` });
    if (Math.abs(kh[0] * dv[0] + kh[1] * dv[1] + kh[2] * dv[2]) > 1e-6) throw new Error(`El campo ${campo} no es perpendicular a k: no es una onda plana transversal`);
    let ev = dv, E0 = amp;
    const vMedio = enVacio ? C0 : v;
    if (campo === 'B') { ev = cruz(dv, kh); E0 = amp * vMedio; pasos.push({ t: 'Campo eléctrico', html: `$E_0 = v B_0 = ${f(vMedio)}·${f(amp)}$ = <b>${f(E0)} V/m</b>, y como B̂ = k̂ × Ê, la dirección de E es Ê = B̂ × k̂ = ${vecTxt(unit(ev))}.` }); }
    const e = unit(ev), num = (x) => String(+x.toPrecision(12));
    const sc2 = { modo: 'onda', medio: enVacio ? 'vacio' : 'medio', er: num(n * n), mr: '1', dato: 'omega', valor: num(w), E0: num(E0), prop: 'otra', kx: num(kh[0]), ky: num(kh[1]), kz: num(kh[2]), pol: 'otra', ex: num(e[0]), ey: num(e[1]), ez: num(e[2]), fase: num((phi * 180) / Math.PI), previos: pasos };
    const r = onda(sc2);
    return { ...r, modo: 'expresion', campo, leido: { k, w, phi, amp } };
  }

  /* ---------- Incidencia normal ---------- */
  // sc: { medio, er, mr (medio 1), destino: 'conductor'|'dielectrico', er2, mr2, dato, valor, E0 }
  function incidencia(sc) {
    const M = medio(sc), F = frecuencia(sc, M.v), E0 = lee(sc, 'E0', 'la amplitud E₀ de la onda incidente'), pasos = [], cond = sc.destino !== 'dielectrico';
    const I0 = (E0 * E0) / (2 * M.eta), B0 = E0 / M.v;
    pasos.push({ t: 'Medio de llegada', html: `${medioTxt(M)}<br>λ = ${f(F.lam)} m, k = ${f(F.k)} rad/m. La onda llega por z < 0 hacia +z: E<sub>i</sub> = ${f(E0)} cos(kz − ωt) î V/m, con $I_i = {E_0^2}/{2η}$ = ${f(I0)} W/m<sup>2</sup>.` });
    if (cond) {
      const K = (2 * B0) / M.mu;
      pasos.push({ t: 'Onda reflejada', html: 'Dentro de un conductor perfecto E = 0 y, como E tangente es continuo, E = 0 en la superficie z = 0. Eso exige una onda reflejada E<sub>r</sub> = −E<sub>0</sub> cos(kz + ωt) î: el coeficiente de reflexión es <b>r = −1</b> y se refleja toda la energía.' });
      pasos.push({ t: 'Onda estacionaria', html: `Sumando: $E = E_0 [cos(k z − ω t) − cos(k z + ω t)] = 2E_0 sen(k z) sen(ω t) î$ = ${f(2 * E0)} sen(${f(F.k)}z) sen(${f(F.w)}t) î V/m<br>$B = {E_0}/v [cos(k z − ω t) + cos(k z + ω t)] = 2B_0 cos(k z) cos(ω t) ĵ$ = ${f(2 * B0)} cos(${f(F.k)}z) cos(${f(F.w)}t) ĵ T<br>Ya no avanza: cada punto oscila en su sitio, y E y B van desfasados un cuarto de periodo en el tiempo y un cuarto de λ en el espacio.` });
      pasos.push({ t: 'Nodos y vientres', html: `E es nulo siempre en los planos z = −nλ/2 = 0, −${f(F.lam / 2)}, −${f(F.lam)} m… (nodos de E, donde B es máximo) y tiene amplitud máxima 2E<sub>0</sub> = ${f(2 * E0)} V/m en z = −λ/4, −3λ/4… = −${f(F.lam / 4)}, −${f((3 * F.lam) / 4)} m… La distancia entre dos nodos es λ/2 = <b>${f(F.lam / 2)} m</b>.` });
      pasos.push({ t: 'Energía, presión y corriente en la superficie', html: `El vector de Poynting medio es 0: la energía no viaja, va y viene entre E y B. La presión de radiación sobre el conductor es $p = {2I_i}/v$ = <b>${f((2 * I0) / M.v)} Pa</b>. En la superficie B = 2B<sub>0</sub> cos(ωt), y ese salto de B lo produce una corriente superficial $K = B/μ$ = <b>${f(K)} cos(ωt) A/m</b> (según î).` });
      return { modo: 'incidencia', cond, M, F, E0, B0, I0, r: -1, t: 0, R: 1, T: 0, K, pasos };
    }
    const er2 = lee(sc, 'er2', 'la permitividad relativa ε₂ del segundo medio'), mr2 = vacio(sc.mr2) ? 1 : lee(sc, 'mr2', 'la permeabilidad relativa μ₂'), M2 = medio({ medio: 'medio', er: er2, mr: mr2 });
    const r = (M2.eta - M.eta) / (M2.eta + M.eta), t = 1 + r, Rr = r * r, T = (M.eta / M2.eta) * t * t, swr = (1 + Math.abs(r)) / (1 - Math.abs(r));
    pasos.push({ t: 'Segundo medio', html: `ε<sub>r</sub> = ${f(er2)}${mr2 !== 1 ? `, μ<sub>r</sub> = ${f(mr2)}` : ''}: n<sub>2</sub> = ${f(M2.n)}, v<sub>2</sub> = ${f(M2.v)} m/s, η<sub>2</sub> = ${f(M2.eta)} Ω, λ<sub>2</sub> = ${f(M2.v / F.fr)} m.` });
    pasos.push({ t: 'Coeficientes de Fresnel', html: `Con E y H tangentes continuos en z = 0: $r = {η_2 − η_1}/{η_2 + η_1}$ = <b>${f(r)}</b> y $t = {2η_2}/{η_1 + η_2} = 1 + r$ = <b>${f(t)}</b>${mr2 === 1 && M.mr === 1 ? ` (con μ = μ<sub>0</sub>, $r = {n_1 − n_2}/{n_1 + n_2}$)` : ''}.<br>$E_r = r E_0$ = ${f(r * E0)} V/m${r < 0 ? ' (la reflejada se invierte: cambio de fase de 180°)' : ''} y $E_t = t E_0$ = ${f(t * E0)} V/m.` });
    pasos.push({ t: 'Energía', html: `$R = r^2$ = <b>${f(100 * Rr, 3)} %</b> se refleja y $T = {η_1}/{η_2} t^2$ = <b>${f(100 * T, 3)} %</b> se transmite (R + T = 1). En el primer medio la suma de la incidente y la reflejada es una onda parcialmente estacionaria: |E| oscila entre ${f(E0 * (1 - Math.abs(r)))} y ${f(E0 * (1 + Math.abs(r)))} V/m (razón de onda estacionaria ${f(swr)}).` });
    return { modo: 'incidencia', cond, M, M2, F, E0, B0, I0, r, t, R: Rr, T, swr, pasos };
  }

  /* ---------- Intensidad ---------- */
  function intensidad(sc) {
    const M = medio(sc), pasos = [], de = ['fuente', 'I', 'E0'].includes(sc.de) ? sc.de : 'fuente';
    let I, P = null, r = null;
    pasos.push({ t: 'Medio', html: medioTxt(M) });
    if (de === 'fuente') {
      P = lee(sc, 'P', 'la potencia P'); r = lee(sc, 'r', 'la distancia r'); I = P / (4 * Math.PI * r * r);
      pasos.push({ t: 'Intensidad a una distancia r', html: `Una fuente puntual reparte la potencia por igual en una esfera de área 4πr<sup>2</sup>:<br>$I = P/(4π r^2) = {${f(P)}}/{4π·${f(r)}^2}$ = <b>${f(I)} W/m<sup>2</sup></b>` });
    } else if (de === 'I') I = lee(sc, 'I', 'la intensidad I');
    let E0 = de === 'E0' ? lee(sc, 'E0', 'la amplitud E₀') : Math.sqrt(2 * M.eta * I);
    if (de === 'E0') { I = (E0 * E0) / (2 * M.eta); pasos.push({ t: 'Intensidad', html: `$I = {E_0^2}/{2η} = {${f(E0)}^2}/{2·${f(M.eta)}}$ = <b>${f(I)} W/m<sup>2</sup></b>` }); }
    else pasos.push({ t: 'Amplitud del campo eléctrico', html: `$I = {E_0^2}/{2η} ⇒ E_0 = √(2η I) = √(2·${f(M.eta)}·${f(I)})$ = <b>${f(E0)} V/m</b>` });
    const B0 = E0 / M.v;
    pasos.push({ t: 'Campo magnético y valores eficaces', html: `$B_0 = {E_0}/v$ = <b>${f(B0)} T</b><br>$E_ef = {E_0}/√2$ = ${f(E0 / Math.SQRT2)} V/m, &ensp; B<sub>ef</sub> = ${f(B0 / Math.SQRT2)} T` });
    const u = I / M.v, A = lee(sc, 'A', 'el área A', { opcional: true });
    pasos.push({ t: 'Energía y presión de radiación', html: `$u = I/v$ = ${f(u)} J/m<sup>3</sup><br>$p = I/v$ = ${f(I / M.v)} Pa si se absorbe y $ {2I}/v$ = ${f((2 * I) / M.v)} Pa si se refleja${A !== null ? `<br>Sobre A = ${f(A)} m<sup>2</sup>: potencia que llega I·A = ${f(I * A)} W, fuerza ${f((I * A) / M.v)} N (absorbe) o ${f((2 * I * A) / M.v)} N (refleja)` : ''}` });
    return { modo: 'intensidad', M, de, P, r, I, E0, B0, u, A, pa: I / M.v, pasos };
  }

  /* ---------- Medio con pérdidas ---------- */
  function perdidas(sc) {
    const er = lee(sc, 'er', 'la permitividad relativa εr'), mr = vacio(sc.mr) ? 1 : lee(sc, 'mr', 'la permeabilidad relativa μr'), sg = lee(sc, 'sigma', 'la conductividad σ', { cero: true });
    const fr = lee(sc, 'valor', 'la frecuencia f'), w = 2 * Math.PI * fr, eps = er * EPS0, mu = mr * MU0, pasos = [];
    const tg = sg / (w * eps), raiz = Math.sqrt(1 + tg * tg), base = w * Math.sqrt((mu * eps) / 2);
    const alfa = base * Math.sqrt(raiz - 1), beta = base * Math.sqrt(raiz + 1), delta = alfa > 0 ? 1 / alfa : Infinity;
    const etaM = Math.sqrt(mu / eps) / Math.sqrt(raiz), th = 0.5 * Math.atan(tg), vf = w / beta, lam = (2 * Math.PI) / beta;
    const tipo = tg > 100 ? 'buen conductor' : tg < 0.01 ? 'buen dieléctrico (pocas pérdidas)' : 'medio con pérdidas moderadas';
    pasos.push({ t: 'Tangente de pérdidas', html: `$ω = 2π f$ = ${f(w)} rad/s, $ε = ε_r ε_0$ = ${f(eps)} F/m<br>$σ/(ω ε) = {${f(sg)}}/{${f(w)}·${f(eps)}}$ = <b>${f(tg)}</b> ⇒ ${tipo}${tg > 100 ? ' (domina la corriente de conducción)' : tg < 0.01 ? ' (domina la de desplazamiento)' : ''}` });
    let h = `La constante de propagación es $γ = α + jβ = √(jω μ (σ + jω ε))$, con<br>$α = ω √({μ ε}/2) √(√(1 + (σ/(ω ε))^2) − 1)$ = <b>${f(alfa)} Np/m</b><br>$β = ω √({μ ε}/2) √(√(1 + (σ/(ω ε))^2) + 1)$ = <b>${f(beta)} rad/m</b>`;
    if (tg > 100) h += `<br>En un buen conductor $α ≈ β ≈ √(π f μ σ)$ = ${f(Math.sqrt(Math.PI * fr * mu * sg))}`;
    else if (tg < 0.01 && sg > 0) h += `<br>Con pocas pérdidas $α ≈ σ/2 √(μ/ε)$ = ${f((sg / 2) * Math.sqrt(mu / eps))} y $β ≈ ω √(μ ε)$ = ${f(w * Math.sqrt(mu * eps))}`;
    pasos.push({ t: 'Atenuación y fase', html: h });
    pasos.push({ t: 'Profundidad de penetración', html: sg === 0 ? 'Sin conductividad no hay pérdidas: la onda no se atenúa (δ = ∞).' : `$δ = 1/α$ = <b>${f(delta)} m</b>: a esa profundidad la amplitud baja a 1/e = 37 % y la intensidad a 1/e<sup>2</sup> = 13,5 %.` });
    pasos.push({ t: 'Velocidad, longitud de onda e impedancia', html: `$v = ω/β$ = ${f(vf)} m/s, &ensp; $λ = {2π}/β$ = ${f(lam)} m<br>$η = √({jω μ}/{σ + jω ε}) = |η|∠θ$ = <b>${f(etaM)} Ω ∠${f((th * 180) / Math.PI)}°</b>: el campo B va ${f((th * 180) / Math.PI)}° retrasado respecto a E.` });
    const E0 = lee(sc, 'E0', 'la amplitud E₀', { opcional: true }), d = lee(sc, 'd', 'la profundidad d', { opcional: true, cero: true });
    let Ed = null;
    if (E0 !== null) {
      let g = `E(z, t) = ${f(E0)} e<sup>−${f(alfa)}z</sup> cos(${f(beta)}z − ${f(w)}t) V/m`;
      if (d !== null) { Ed = E0 * Math.exp(-alfa * d); g += `<br>A z = ${f(d)} m: $E = E_0 e^{−α z} = ${f(E0)}·e^{−${f(alfa * d)}}$ = <b>${f(Ed)} V/m</b> (${f(100 * Math.exp(-alfa * d))} % de la amplitud)`; }
      g += `<br>Intensidad al entrar: $I = {E_0^2 cos θ}/{2|η|}$ = ${f((E0 * E0 * Math.cos(th)) / (2 * etaM))} W/m<sup>2</sup>`;
      pasos.push({ t: 'Campo dentro del medio', html: g });
    }
    return { modo: 'perdidas', er, mr, sg, fr, w, tg, tipo, alfa, beta, delta, etaM, th, vf, lam, E0, d, Ed, M: { eps, mu, v: vf, eta: etaM }, F: { fr, w, k: beta, lam }, pasos };
  }

  /* ---------- Polarizadores y ley de Malus ---------- */
  // luz natural (I/2 al primer polarizador), lineal (Malus) o circular (I/2) por una serie de polarizadores ideales
  function polarizadores(sc) {
    const luz = ['natural', 'lineal', 'circular'].includes(sc.luz) ? sc.luz : 'natural', I0 = lee(sc, 'I0', 'la intensidad I₀'), pasos = [];
    const angs = String(sc.angulos ?? '').split(';').map((s) => s.trim()).filter(Boolean).map(leeNum);
    if (!angs.length) throw new Error('Falta el ángulo de al menos un polarizador (por ejemplo 0; 45; 90)');
    if (angs.some((a) => !isFinite(a))) throw new Error('Los ángulos de los polarizadores deben ser números, separados por punto y coma (0; 45; 90)');
    if (angs.length > 6) throw new Error('Como mucho 6 polarizadores');
    const alfa = luz === 'lineal' ? (vacio(sc.alfa) ? 0 : leeNum(sc.alfa)) : 0;
    if (luz === 'lineal' && !isFinite(alfa)) throw new Error('El ángulo de la luz debe ser un número');
    const norm = (a) => { let d = ((a + 90) % 180 + 180) % 180 - 90; return d; };
    pasos.push({ t: 'Ley de Malus', html: `Un polarizador ideal deja pasar solo la componente de E paralela a su eje: $E = E_0 cos θ$, y como $I ∝ E^2$:<br>$I = I_0 cos^2 θ$ (ley de Malus), con θ el ángulo entre la polarización de la luz y el eje.<br>Luz natural (todas las direcciones por igual): el primer polarizador deja pasar la mitad, $I = I_0/2$, y la deja polarizada según su eje. La circular también pierde la mitad.` });
    const etapas = []; let I = I0, pol = luz === 'lineal' ? alfa : null;
    angs.forEach((a, i) => {
      const prev = I;
      let h;
      if (pol === null) { I = prev / 2; h = `Luz ${luz === 'natural' ? 'natural' : 'circular'}: $I_${i + 1} = I_${i}/2 = {${f(prev)}}/2$ = <b>${f(I)} W/m<sup>2</sup></b>`; etapas.push({ a, de: null, I, prev, c2: 0.5 }); }
      else { const th = norm(a - pol), c2 = Math.cos((th * Math.PI) / 180) ** 2; I = prev * (Math.abs(c2) < 1e-15 ? 0 : c2); h = `Ángulo entre la luz (${f(pol)}°) y el eje (${f(a)}°): θ = ${f(th)}°<br>$I_${i + 1} = I_${i} cos^2 θ = ${f(prev)}·cos^2(${f(th)}°)$ = <b>${f(I)} W/m<sup>2</sup></b>`; etapas.push({ a, de: pol, th, I, prev, c2 }); }
      pol = a;
      pasos.push({ t: `Polarizador ${i + 1} (eje a ${f(a)}°)`, html: h + `<br>Sale polarizada según ${f(a)}°, con E<sub>0</sub> = ${f(Math.sqrt(2 * 376.730313 * I))} V/m (en el vacío).` });
    });
    const E0f = Math.sqrt(2 * 376.730313 * I), frac = I / I0;
    pasos.push({ t: 'Resultado final', html: `$I_f/I_0 = $ <b>${f(frac, 4)}</b> (${f(100 * frac, 4)} %), $I_f = $ <b>${f(I)} W/m<sup>2</sup></b>, $E_0 = √(2 η I_f)$ = ${f(E0f)} V/m con η = 376,7 Ω.` });
    if (I <= 1e-300 * I0) pasos.push({ t: 'Polarizadores cruzados', html: 'Con ejes a 90° no pasa nada de luz. Un polarizador intermedio a 45° entre dos cruzados deja pasar luz: es la paradoja clásica.' });
    return { modo: 'polarizadores', luz, I0, alfa, angs, etapas, I, frac, E0f, pasos };
  }

  /* ---------- Vector de Poynting y balance de energía ---------- */
  // sistemas con corriente continua: hilo con resistencia, condensador que se carga y cable coaxial
  function poynting(sc) {
    const sis = ['hilo', 'condensador', 'coaxial'].includes(sc.sis) ? sc.sis : 'hilo', pasos = [];
    pasos.push({ t: 'Idea', html: `El vector de Poynting $S = {E × B}/μ_0$ da la potencia por unidad de área. Su flujo por una superficie cerrada es la potencia que entra o sale (balance de energía): $∮ S·dA = −{dU}/{dt} − P_{Joule}$. En un circuito la energía no viaja por los hilos: llega por los campos del exterior.` });
    let r;
    if (sis === 'hilo') {
      const a = lee(sc, 'a', 'el radio a'), L = lee(sc, 'L', 'la longitud L'), I = lee(sc, 'I', 'la corriente I'), sg = lee(sc, 'sigma', 'la conductividad σ');
      const A = Math.PI * a * a, R = L / (sg * A), E = I / (sg * A), B = (MU0 * I) / (2 * Math.PI * a), S = (E * B) / MU0, flujo = S * 2 * Math.PI * a * L, P = I * I * R;
      pasos.push({ t: 'Campos en la superficie del hilo', html: `Sección A = πa<sup>2</sup> = ${f(A)} m<sup>2</sup>; resistencia $R = {L}/{σ A}$ = <b>${f(R)} Ω</b><br>Campo eléctrico (a lo largo del hilo): $E = {I}/{σ A}$ = ${f(E)} V/m<br>Campo magnético (Ampère, en r = a): $B = {μ_0 I}/{2π a}$ = ${f(B)} T, azimutal.` });
      pasos.push({ t: 'Vector de Poynting', html: `$S = {E B}/μ_0 = {I^2}/{2π^2 σ a^3}$ = <b>${f(S)} W/m<sup>2</sup></b>, dirigido hacia el eje del hilo (radial, entrante): E × B apunta hacia dentro.` });
      pasos.push({ t: 'Balance de energía', html: `Flujo por la superficie lateral de área 2πaL = ${f(2 * Math.PI * a * L)} m<sup>2</sup>:<br>$Φ_S = S·2π a L$ = <b>${f(flujo)} W</b> entrando<br>Potencia disipada: $P = I^2 R$ = ${f(P)} W. <b>Coinciden</b>: el hilo se calienta con la energía que le llega de los campos de fuera.` });
      r = { E, B, S, flujo, P, R, dir: 'hacia dentro (radial)' };
    } else if (sis === 'condensador') {
      const a = lee(sc, 'a', 'el radio a de las placas'), d = lee(sc, 'd', 'la separación d'), V = lee(sc, 'V', 'la tensión V'), I = lee(sc, 'I', 'la corriente de carga I');
      const C = (EPS0 * Math.PI * a * a) / d, E = V / d, B = (MU0 * I) / (2 * Math.PI * a), S = (E * B) / MU0, flujo = S * 2 * Math.PI * a * d, U = 0.5 * C * V * V, dU = V * I, vol = Math.PI * a * a * d, dE = I / (EPS0 * Math.PI * a * a);
      pasos.push({ t: 'Condensador y campo eléctrico', html: `Capacidad $C = {ε_0 π a^2}/d$ = ${f(C)} F; campo entre placas $E = V/d$ = <b>${f(E)} V/m</b>, que crece a ${f(dE)} V/m/s mientras la corriente I = ${f(I)} A carga las placas.<br>Energía almacenada $U = ½ C V^2$ = ${f(U)} J.` });
      pasos.push({ t: 'Campo magnético de Ampère–Maxwell', html: `La corriente de desplazamiento crea B en el borde: $B·2π a = μ_0 ε_0 π a^2 {dE}/{dt} = μ_0 I$ ⇒ $B = {μ_0 I}/{2π a}$ = ${f(B)} T, azimutal.` });
      pasos.push({ t: 'Vector de Poynting', html: `$S = {E B}/μ_0$ = <b>${f(S)} W/m<sup>2</sup></b>, radial hacia dentro (con la placa cargándose).` });
      pasos.push({ t: 'Balance de energía', html: `Flujo por el borde lateral de área 2πad = ${f(2 * Math.PI * a * d)} m<sup>2</sup>: $Φ_S = S·2π a d$ = <b>${f(flujo)} W</b><br>Ritmo de aumento de la energía del campo: $dU/dt = V I$ = ${f(dU)} W (con ${f(0.5 * EPS0 * E * E * vol)} J = ½ ε<sub>0</sub>E<sup>2</sup>·volumen). <b>Coinciden</b>: toda la energía entra por los lados, no por los hilos.` });
      r = { E, B, S, flujo, P: dU, C, U, dir: 'hacia dentro (radial)' };
    } else {
      const a = lee(sc, 'a', 'el radio interior a'), b = lee(sc, 'b', 'el radio exterior b'), V = lee(sc, 'V', 'la tensión V'), I = lee(sc, 'I', 'la corriente I'), rr = vacio(sc.r) ? a : lee(sc, 'r', 'el radio r del punto');
      if (b <= a) throw new Error('El radio exterior b debe ser mayor que el interior a');
      if (rr < a || rr > b) throw new Error('El punto tiene que estar entre los dos conductores (a ≤ r ≤ b)');
      const ln = Math.log(b / a), E = V / (rr * ln), B = (MU0 * I) / (2 * Math.PI * rr), S = (E * B) / MU0, flujo = V * I, P = V * I;
      pasos.push({ t: 'Campos entre los conductores', html: `Gauss: $E = {V}/{r ln(b/a)}$ (radial), con ln(b/a) = ${f(ln)}; Ampère: $B = {μ_0 I}/{2π r}$ (azimutal). A r = ${f(rr)} m: E = ${f(E)} V/m, B = ${f(B)} T.` });
      pasos.push({ t: 'Vector de Poynting', html: `$S = {E B}/μ_0 = {V I}/{2π r^2 ln(b/a)}$ = <b>${f(S)} W/m<sup>2</sup></b> a lo largo del cable, de la fuente a la carga (si V e I son positivas).` });
      pasos.push({ t: 'Potencia transportada', html: `Integrando S por la corona entre a y b: $∫_a^b S·2π r dr = {V I}/{ln(b/a)}·ln(b/a)$ = <b>${f(P)} W</b>. Es $P = V I$: la potencia viaja por el dieléctrico entre los conductores, no por dentro del metal.` });
      r = { E, B, S, flujo, P, ln, dir: 'a lo largo del eje, de la fuente a la carga', rr };
    }
    return { modo: 'poynting', sis, ...r, pasos };
  }

  const MODOS = { onda, expresion, incidencia, intensidad, perdidas, polarizadores, poynting };
  function resolver(sc) { return MODOS[sc.modo] ? MODOS[sc.modo](sc) : onda(sc); }

  const ejemplos = [
    { clave: 'fm', nombre: 'Onda de radio FM en el vacío', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '100e6', E0: '0,05', prop: '+z', pol: '+x', er: '', mr: '' } },
    { clave: 'laser', nombre: 'Luz de un láser rojo (λ = 633 nm)', sc: { modo: 'onda', medio: 'vacio', dato: 'lambda', valor: '633e-9', E0: '1000', prop: '+x', pol: '+y', er: '', mr: '' } },
    { clave: 'agua', nombre: 'Luz que entra en el agua', sc: { modo: 'onda', medio: 'medio', dato: 'f', valor: '5e14', E0: '200', prop: '+z', pol: '+y', er: '1,77', mr: '1' } },
    { clave: 'expresion', nombre: 'Desde k: E = 30 cos(2,09y + ωt) k̂', sc: { modo: 'onda', medio: 'vacio', dato: 'k', valor: '2,094', E0: '30', prop: '-y', pol: '+z', er: '', mr: '' } },
    { clave: 'dielectrico', nombre: 'Microondas en un dieléctrico (εr = 4)', sc: { modo: 'onda', medio: 'medio', dato: 'f', valor: '2,45e9', E0: '100', prop: '+z', pol: '+x', er: '4', mr: '1' } },
    { clave: 'diagonal', nombre: 'Onda en diagonal con fase inicial', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '3e9', E0: '10', prop: 'otra', kx: '1', ky: '1', kz: '0', pol: '+z', er: '', mr: '', fase: '60' } },
    { clave: 'circular', nombre: 'Polarización circular', sc: { modo: 'onda', medio: 'vacio', dato: 'lambda', valor: '0,03', E0: '20', prop: '+z', pol: '+x', er: '', mr: '', tipoPol: 'circular', giro: 'antihorario' } },
    { clave: 'eliptica', nombre: 'Polarización elíptica', sc: { modo: 'onda', medio: 'vacio', dato: 'f', valor: '1e9', E0: '30', prop: '+x', pol: '+y', er: '', mr: '', tipoPol: 'eliptica', E02: '15', delta: '-90' } },
    { clave: 'expr-E', nombre: 'Desde E(r, t) = 30 cos(2,094y + 6,283·10⁸t) k̂', sc: { modo: 'expresion', campo: 'E', expr: '30 cos(2,094y + 6,283e8t) k' } },
    { clave: 'expr-B', nombre: 'Desde B(r, t) en un vidrio', sc: { modo: 'expresion', campo: 'B', expr: '2e-7 sen(1,5e7z - 3e15t) j' } },
    { clave: 'conductor', nombre: 'Onda estacionaria ante un conductor', sc: { modo: 'incidencia', destino: 'conductor', medio: 'vacio', dato: 'f', valor: '1e9', E0: '50', er: '', mr: '', er2: '', mr2: '' } },
    { clave: 'vidrio', nombre: 'Luz que llega del aire al vidrio', sc: { modo: 'incidencia', destino: 'dielectrico', medio: 'vacio', dato: 'lambda', valor: '600e-9', E0: '100', er: '', mr: '', er2: '2,25', mr2: '' } },
    { clave: 'sol', nombre: 'Luz del Sol en la Tierra', sc: { modo: 'intensidad', medio: 'vacio', de: 'I', I: '1361', P: '', r: '', E0: '', A: '1' } },
    { clave: 'bombilla', nombre: 'Bombilla de 100 W a 2 m', sc: { modo: 'intensidad', medio: 'vacio', de: 'fuente', P: '100', r: '2', I: '', E0: '', A: '' } },
    { clave: 'antena', nombre: 'Antena de 50 kW a 10 km', sc: { modo: 'intensidad', medio: 'vacio', de: 'fuente', P: '50000', r: '10000', I: '', E0: '', A: '' } },
    { clave: 'vela', nombre: 'Vela solar que refleja (E₀ dado)', sc: { modo: 'intensidad', medio: 'vacio', de: 'E0', E0: '1012', P: '', r: '', I: '', A: '100' } },
    { clave: 'malus', nombre: 'Ley de Malus: luz lineal a 30° de un polarizador', sc: { modo: 'polarizadores', luz: 'lineal', alfa: '0', I0: '100', angulos: '30' } },
    { clave: 'tres-polarizadores', nombre: 'Natural por tres polarizadores (0°, 45°, 90°)', sc: { modo: 'polarizadores', luz: 'natural', I0: '1000', angulos: '0; 45; 90' } },
    { clave: 'cruzados', nombre: 'Dos polarizadores cruzados (0° y 90°)', sc: { modo: 'polarizadores', luz: 'natural', I0: '1000', angulos: '0; 90' } },
    { clave: 'poy-hilo', nombre: 'Poynting en un hilo de cobre con corriente', sc: { modo: 'poynting', sis: 'hilo', a: '1e-3', L: '2', I: '10', sigma: '5,8e7' } },
    { clave: 'poy-condensador', nombre: 'Poynting en un condensador que se carga', sc: { modo: 'poynting', sis: 'condensador', a: '0,05', d: '0,002', V: '100', I: '0,5' } },
    { clave: 'poy-coaxial', nombre: 'Potencia por un cable coaxial', sc: { modo: 'poynting', sis: 'coaxial', a: '1e-3', b: '3,5e-3', V: '50', I: '2', r: '' } },
    { clave: 'cobre', nombre: 'Cobre a 1 MHz (buen conductor)', sc: { modo: 'perdidas', er: '1', mr: '1', sigma: '5,8e7', valor: '1e6', E0: '1', d: '0,0001' } },
    { clave: 'mar', nombre: 'Agua de mar a 1 kHz', sc: { modo: 'perdidas', er: '81', mr: '1', sigma: '4', valor: '1000', E0: '1', d: '10' } },
    { clave: 'tierra', nombre: 'Tierra húmeda a 1 MHz', sc: { modo: 'perdidas', er: '10', mr: '1', sigma: '0,01', valor: '1e6', E0: '10', d: '5' } },
    { clave: 'baquelita', nombre: 'Dieléctrico con pocas pérdidas', sc: { modo: 'perdidas', er: '4,9', mr: '1', sigma: '1e-6', valor: '1e8', E0: '5', d: '100' } },
  ];
  return { resolver, onda, expresion, incidencia, intensidad, perdidas, polarizadores, poynting, leeExpresion, banda, ejemplos, f, C0, MU0, EPS0 };
})();
if (typeof module !== 'undefined') module.exports = OndasEM;
