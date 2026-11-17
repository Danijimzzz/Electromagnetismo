const Solubilidad = (() => {
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-2 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, entero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} is missing`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} must be a number`);
    if (v <= 0) throw new Error(`${Mayus(nom)} must be greater than 0`);
    if (entero && (!Number.isInteger(v) || v > 6)) throw new Error(`${Mayus(nom)} must be an integer from 1 to 6`);
    return v;
  }

  const D = typeof Datos !== 'undefined' ? Datos : require('../quimica/datos.js');
  const SALES = D.KPS.map(([c, cat, an, a, b, K, ac]) => [c, c, a, b, K, cat, an, ac]);

  const ns = (n) => (n === 1 ? 's' : `${n} s`);
  const sub = (n) => (n === 1 ? '' : `_{${n}}`), ex = (n) => (n === 1 ? '' : `^{${n}}`);
  const salM = (a, b) => `A${sub(a)}B${sub(b)}`; // la sal genérica, en Mates
  const prod = (a, b) => `[A]${ex(a)}[B]${ex(b)}`; // producto iónico, en Mates

  function masaM(sc) {
    if (!vacio(sc.M)) return lee(sc, 'M', 'the molar mass');
    if (!vacio(sc.formula) && typeof Formulas !== 'undefined') { try { return Formulas.masaMolar(sc.formula).M; } catch (e) { throw new Error(`The formula: ${e.message}`); } }
    return null;
  }
  const nombre = (sc) => (!vacio(sc.formula) && typeof Formulas !== 'undefined' ? (() => { try { return Formulas.leer(sc.formula).html; } catch (e) { return ''; } })() : '');
  const cabecera = (sc, a, b, M) => {
    const nom = nombre(sc);
    return { t: 'The salt and its equilibrium', html: `${nom ? `${nom} is the sparingly soluble salt. ` : ''}It is written as $${salM(a, b)}$ and dissolves: $${salM(a, b)} ⇌ ${a > 1 ? a + ' ' : ''}A + ${b > 1 ? b + ' ' : ''}B$, with $K_{"sp"} = ${prod(a, b)}$.${M ? ` Molar mass: $M = ${f(M, 4)}$ g/mol.` : ''}` };
  };

  function biseca(g, lo, hi) { for (let i = 0; i < 300; i++) { const m = Math.sqrt(lo * hi); if (g(m) < 0) lo = m; else hi = m; } return Math.sqrt(lo * hi); }
  const solAgua = (Kps, a, b) => (Kps / (a ** a * b ** b)) ** (1 / (a + b));

  function deSolubilidad(sc) {
    const a = lee(sc, 'a', 'the number of cations', { entero: true }), b = lee(sc, 'b', 'the number of anions', { entero: true });
    const dato = lee(sc, 's', 'la solubilidad'), enG = sc.uni === 'g', M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    if (enG && !M) throw new Error('For the solubility in g/L the molar mass (or the formula) is needed');
    const s = enG ? dato / M : dato;
    if (enG) pasos.push({ t: 'From g/L to mol/L', html: `$s = {${f(dato)} "g/L"}/{${f(M, 4)} "g/mol"} = ${f(s)} "mol/L"$` });
    const ca = a * s, cb = b * s, Kps = ca ** a * cb ** b;
    pasos.push({ t: 'Concentration of the ions', html: `Each mole of salt that dissolves gives $${a}$ mol of A and $${b}$ of B: $[A] = ${ns(a)} = ${f(ca)}$ M and $[B] = ${ns(b)} = ${f(cb)}$ M.` });
    pasos.push({ t: 'Solubility product', html: `$K_{"sp"} = ${prod(a, b)} = (${f(ca)})${ex(a)} (${f(cb)})${ex(b)}$ = <b>${f(Kps)}</b>. In general, $K_{"sp"} = ${a ** a * b ** b === 1 ? '' : a ** a * b ** b + ' '}s^{${a + b}}$.` });
    return { modo: 'kps', a, b, s, g: M ? s * M : null, M, Kps, ca, cb, pasos };
  }

  function deKps(sc) {
    const a = lee(sc, 'a', 'the number of cations', { entero: true }), b = lee(sc, 'b', 'the number of anions', { entero: true });
    const Kps = lee(sc, 'Ksp', 'the Ksp'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const s = solAgua(Kps, a, b), ca = a * s, cb = b * s;
    const k = a ** a * b ** b;
    pasos.push({ t: 'Ksp as a function of solubility', html: `If $s$ mol/L dissolve, $[A] = ${a === 1 ? '' : a + ' '}s$ and $[B] = ${b === 1 ? '' : b + ' '}s$, so $K_{"sp"} = (${a === 1 ? '' : a} s)${ex(a)} (${b === 1 ? '' : b} s)${ex(b)} = ${k === 1 ? '' : k + ' '}s^{${a + b}}$.` });
    pasos.push({ t: 'Solving for the solubility', html: `$s = (K_{"sp"}/${k})^{1/${a + b}} = (${f(Kps)}${k === 1 ? '' : '/' + k})^{1/${a + b}}$ = <b>${f(s)} mol/L</b>` });
    pasos.push({ t: 'Concentration of the ions', html: `$[A] = ${f(ca)}$ M y $[B] = ${f(cb)}$ M.` });
    if (M) pasos.push({ t: 'In grams per liter', html: `$s = ${f(s)} · ${f(M, 4)}$ = <b>${f(s * M)} g/L</b>` });
    return { modo: 'solub', a, b, s, g: M ? s * M : null, M, Kps, ca, cb, pasos };
  }

  function ionComun(sc) {
    const a = lee(sc, 'a', 'the number of cations', { entero: true }), b = lee(sc, 'b', 'the number of anions', { entero: true });
    const Kps = lee(sc, 'Ksp', 'the Ksp'), C = lee(sc, 'C', 'the concentration of the common ion'), M = masaM(sc), cat = sc.ion === 'cat', pasos = [cabecera(sc, a, b, M)];
    const s0 = solAgua(Kps, a, b), ion = cat ? 'A' : 'B', otro = cat ? 'B' : 'A', pc = cat ? a : b, po = cat ? b : a;
    const g = (s) => (a * s + (cat ? C : 0)) ** a * (b * s + (cat ? 0 : C)) ** b - Kps;
    const s = g(s0) <= 0 ? s0 : biseca((x) => g(x), s0 * 1e-80, s0);
    pasos.push({ t: 'In pure water', html: `Without a common ion, $s_{0} = (K_{"sp"}/${a ** a * b ** b})^{1/${a + b}} = ${f(s0)}$ mol/L.` });
    pasos.push({ t: 'With the common ion', html: `The solution already has $[${ion}] = ${f(C)}$ M. If $s$ mol/L dissolve, $[${ion}] = ${ns(cat ? a : b)} + ${f(C)}$ and $[${otro}] = ${ns(po)}$, so $K_{"sp"} = ${cat ? `(${ns(a)} + ${f(C)})${ex(a)}(${ns(b)})${ex(b)}` : `(${ns(a)})${ex(a)}(${ns(b)} + ${f(C)})${ex(b)}`}$.` });
    const sap = (Kps / C ** pc) ** (1 / po) / po, err = Math.abs(sap - s) / s;
    pasos.push({ t: 'Approximation', html: `Since $s$ is much smaller than $C$, $${pc === 1 ? '' : pc + ' '}s + C ≈ C$ and $K_{"sp"} ≈ C${ex(pc)} · ${po === 1 ? 's' : `(${po} s)${ex(po)}`}$, hence $s ≈ ${f(sap)}$ mol/L${err < 0.05 ? ` (a ${f(100 * err, 2)} % difference)` : ` (not a good one: it differs by ${f(100 * err, 2)} %)`}.` });
    pasos.push({ t: 'Result', html: `Solving the full equation: <b>$s = ${f(s)}$ mol/L</b>${M ? ` = ${f(s * M)} g/L` : ''}. It is ${f(s0 / s, 3)} times less soluble than in pure water: the common ion shifts the equilibrium toward the solid.` });
    return { modo: 'comun', a, b, Kps, C, cat, s, s0, g: M ? s * M : null, M, ca: a * s + (cat ? C : 0), cb: b * s + (cat ? 0 : C), factor: s0 / s, pasos };
  }

  function precipita(sc) {
    const a = lee(sc, 'a', 'the number of cations', { entero: true }), b = lee(sc, 'b', 'the number of anions', { entero: true });
    const Kps = lee(sc, 'Ksp', 'the Ksp'), c1 = lee(sc, 'c1', 'the concentration of the cation'), V1 = lee(sc, 'V1', 'the volume of the cation solution');
    const c2 = lee(sc, 'c2', 'the concentration of the anion'), V2 = lee(sc, 'V2', 'the volume of the anion solution'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const Vt = V1 + V2, ca = (c1 * V1) / Vt, cb = (c2 * V2) / Vt, Q = ca ** a * cb ** b, ratio = Q / Kps;
    pasos.push({ t: 'Concentrations after mixing', html: `The total volume is ${f(V1)} + ${f(V2)} = ${f(Vt)} mL and each ion is diluted: $[A]_{0} = {${f(c1)} · ${f(V1)}}/{${f(Vt)}} = ${f(ca)}$ M, &ensp; $[B]_{0} = {${f(c2)} · ${f(V2)}}/{${f(Vt)}} = ${f(cb)}$ M.` });
    pasos.push({ t: 'Ion product Q', html: `$Q = ${prod(a, b)} = (${f(ca)})${ex(a)} (${f(cb)})${ex(b)}$ = <b>${f(Q)}</b>, compared with $K_{"sp"} = ${f(Kps)}$: $Q / K_{"sp"} = ${f(ratio)}$.` });
    const r = { modo: 'precipita', a, b, Kps, ca0: ca, cb0: cb, Q, ratio, Vt, M, pasos, precipita: Q > Kps * (1 + 1e-12) };
    if (!r.precipita) {
      pasos.push({ t: 'Conclusion', html: `${Q < Kps ? '$Q < K_{"sp"}$: the solution is not saturated' : '$Q = K_{"sp"}$: just saturated'}, <b>no precipitate forms</b> and everything stays dissolved.` });
    } else {
      pasos.push({ t: 'Conclusion', html: `$Q > K_{"sp"}$: the solution is supersaturated and salt <b>precipitates</b> until the ion product is equal to $K_{"sp"}$ again.` });
      const ea = ca / a, eb = cb / b; // moles de sal que cabrían por litro con cada ion
      const limA = ea <= eb, e = limA ? eb - ea : ea - eb;
      const quedaA = (y) => (limA ? y : a * (y / b + e)), quedaB = (y) => (limA ? b * (y / a + e) : y);
      const hi = limA ? ca : cb, y = biseca((v) => quedaA(v) ** a * quedaB(v) ** b - Kps, hi * 1e-80, hi);
      const cA = quedaA(y), cB = quedaB(y), x = (ca - cA) / a, mol = (x * Vt) / 1000;
      pasos.push({ t: 'What precipitates', html: `If $x$ mol/L of salt precipitate, $[A] = ${f(ca)} − ${a === 1 ? '' : a + ' '}x$ and $[B] = ${f(cb)} − ${b === 1 ? '' : b + ' '}x$ remain. We impose $(${f(ca)} − ${a === 1 ? '' : a + ' '}x)${ex(a)} (${f(cb)} − ${b === 1 ? '' : b + ' '}x)${ex(b)} = ${f(Kps)}$ and solve numerically: $x = ${f(x)}$ mol/L.` });
      pasos.push({ t: 'What remains in solution', html: `$[A] = ${f(cA)}$ M and $[B] = ${f(cB)}$ M (the ${limA ? 'cation' : 'anion'} is the limiting one and is almost used up).` });
      pasos.push({ t: 'Solid formed', html: `$n = x V = ${f(x)} · ${f(Vt / 1000)}$ L = <b>${f(mol)} mol</b>${M ? `, which is <b>${f(mol * M)} g</b> of precipitate` : ''}.` });
      Object.assign(r, { x, mol, masa: M ? mol * M : null, cA, cB, limitante: limA ? 'cation' : 'anion', porciento: limA ? (100 * (ca - cA)) / ca : (100 * (cb - cB)) / cb });
    }
    return r;
  }

  function selectiva(sc) {
    const cat = sc.comun === 'cat', S = [1, 2].map((i) => {
      const a = lee(sc, 'a' + i, `the number of cations of salt ${i}`, { entero: true }), b = lee(sc, 'b' + i, `the number of anions of salt ${i}`, { entero: true });
      const Kps = lee(sc, 'Ksp' + i, `the Ksp of salt ${i}`), c = lee(sc, 'c' + i, `the concentration of the ion of salt ${i} that is not the common one`);
      const p = cat ? a : b, q = cat ? b : a; // exponentes del ion que se añade y del otro
      return { i, a, b, Kps, c, p, q, X: (Kps / c ** q) ** (1 / p) };
    });
    const ion = cat ? 'cation' : 'anion', add = cat ? 'A' : 'B', otro = cat ? 'B' : 'A';
    const pasos = [{ t: 'Setup', html: `The ${ion} shared by the two salts is added little by little (we call it $${add}$). A salt starts to precipitate when $Q = K_{"sp"}$, that is, when $[${add}]$ reaches $[${add}] = (K_{"sp"} / [${otro}]^{q})^{1/p}$, with $p$ the exponent of $${add}$ in the Ksp and $q$ that of the other ion.` }];
    for (const s of S) pasos.push({ t: `Salt ${s.i}`, html: `$K_{"sp"} = ${f(s.Kps)}$ with $[${otro}] = ${f(s.c)}$ M: it starts to precipitate at $[${add}] = (${f(s.Kps)} / ${f(s.c)}${ex(s.q)})^{1/${s.p}}$ = <b>${f(s.X)} M</b>.` });
    const [p, q] = S[0].X <= S[1].X ? [S[0], S[1]] : [S[1], S[0]];
    pasos.push({ t: 'Which precipitates first', html: `<b>Salt ${p.i}</b> precipitates first, because it needs less ${ion} (${f(p.X)} M versus ${f(q.X)} M).` });
    const resta = (p.Kps / q.X ** p.p) ** (1 / p.q), frac = resta / p.c;
    pasos.push({ t: `How much of salt ${p.i} remains when ${q.i} starts`, html: `On reaching $[${add}] = ${f(q.X)}$ M, the ion $${otro}$ of salt ${p.i} satisfies $K_{"sp"} = ${f(p.Kps)}$, so $[${otro}] = (${f(p.Kps)} / ${f(q.X)}${ex(p.p)})^{1/${p.q}}$ = <b>${f(resta)} M</b> remains: <b>${f(100 * frac)} %</b> of what there was (${f(p.c)} M).` });
    const sep = frac < 1e-3;
    pasos.push({ t: 'Separation', html: `${f(100 * (1 - frac), 6)} % of salt ${p.i} has precipitated before ${q.i} starts. ${sep ? 'It is considered a <b>quantitative separation</b> (less than 0.1 % remains).' : 'It is not a quantitative separation (for that less than 0.1 % would have to remain): they would partly precipitate together.'}` });
    return { modo: 'selectiva', cat, ion, S, primera: p.i, p, q, resta, frac, sep, pasos };
  }

  const lista = (t, nom) => {
    const xs = String(t ?? '').split(';').map((x) => x.trim()).filter(Boolean).map(leeNum);
    if (!xs.length || xs.some((x) => !isFinite(x))) throw new Error(`${nom}: enter numbers separated by “;”, such as 6.35 ; 10.33`);
    return xs;
  };
  const pHde = (sc) => { const v = leeNum(sc.pH); if (!isFinite(v) || v < 0 || v > 14) throw new Error('The pH must be a number between 0 and 14'); return v; };
  const alfa0 = (pKas, pH) => {
    const h = 10 ** -pH, Ka = pKas.map((p) => 10 ** -p); let suma = 1, prod = 1;
    for (let k = 1; k <= Ka.length; k++) { prod *= Ka[Ka.length - k]; suma += h ** k / prod; }
    return 1 / suma;
  };
  function ph(sc) {
    const a = lee(sc, 'a', 'the number of cations', { entero: true }), b = lee(sc, 'b', 'the number of anions', { entero: true }), Kps = lee(sc, 'Ksp', 'the Ksp'), pH = pHde(sc);
    const oh = sc.anion === 'oh', pKas = oh ? [] : lista(sc.pkas, 'The pKa values of the conjugate acid of the anion'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const s0 = solAgua(Kps, a, b);
    const sDe = (pHx) => {
      if (oh) { const OH = 10 ** (pHx - 14); return Math.min(Kps / OH ** b / a, Infinity) / 1; } // [A] = a·s → s = [A]/a con [A]^a [OH]^b = Kps
      return (Kps / (a ** a * b ** b * alfa0(pKas, pHx) ** b)) ** (1 / (a + b));
    };
    let s;
    if (oh) {
      const OH = 10 ** (pH - 14), A = (Kps / OH ** b) ** (1 / a);
      s = A / a;
      pasos.push({ t: 'Hydroxide: the pH fixes [OH⁻]', html: `The anion is OH⁻, so the pH fixes it from outside: $[OH^{−}] = 10^{pH−14} = 10^{${f(pH - 14, 3)}} = ${f(OH)}$ M. The equilibrium $K_{"sp"} = [A]${ex(a)}[OH^{−}]${ex(b)}$ gives $[A] = (K_{"sp"}/[OH^{−}]${ex(b)})^{1/${a}} = ${f(A)}$ M.` });
      pasos.push({ t: 'Solubility', html: `The solubility is what dissolves of the solid: $s = [A]/${a} = ${f(s)}$ mol/L${M ? ` = ${f(s * M)} g/L` : ''}. In pure water it would be $s_{0} = ${f(s0)}$ mol/L (the pH that solution would have is different: here the pH is held by a buffer).` });
    } else {
      const al = alfa0(pKas, pH);
      s = sDe(pH);
      pasos.push({ t: 'The anion is protonated', html: `The anion B is the conjugate base of a weak acid with $pK_a$ = ${pKas.map((x) => f(x, 3)).join('; ')}. At pH ${f(pH, 3)} only a fraction $α = ${f(al)}$ of the total anion is free B; the rest is protonated (HB, H₂B…) and does not count in $K_{"sp"}$.` });
      pasos.push({ t: 'Solubility', html: `$K_{"sp"} = [A]${ex(a)}[B]${ex(b)} = (${a === 1 ? '' : a + ' '}s)${ex(a)}(${b === 1 ? '' : b + ' '}s α)${ex(b)}$ ⇒ $s = (K_{"sp"}/(${a ** a * b ** b} α${ex(b)}))^{1/${a + b}} = ${f(s)}$ mol/L${M ? ` = ${f(s * M)} g/L` : ''}. In a medium where the anion is not protonated it would be $s_{0} = ${f(s0)}$ mol/L.` });
    }
    pasos.push({ t: 'Effect of pH', html: `At pH ${f(pH, 3)} the salt is <b>${f(s / s0, 3)} times ${s > s0 ? 'more' : 'less'} soluble</b> than without taking the protonation of the anion into account${oh ? ' in pure water' : ''}. ${oh ? 'An acidic pH (little OH⁻) dissolves the hydroxide; a basic one makes it precipitate.' : 'On lowering the pH the anion is protonated, the dissolution equilibrium shifts to the right and the salt dissolves more.'}` });
    const r = { modo: 'ph', a, b, Kps, pH, s, s0, factor: s / s0, g: M ? s * M : null, M, oh, pKas, pasos };
    const curva = []; for (let x = 0; x <= 14.0001; x += 0.25) curva.push([x, sDe(x)]);
    r.curva = curva;
    if (oh && String(sc.C ?? '').trim() !== '') {
      const C = lee(sc, 'C', 'the concentration of the cation'), pIni = 14 + lg10((Kps / C ** a) ** (1 / b)), Cres = C / 1000, pFin = 14 + lg10((Kps / Cres ** a) ** (1 / b));
      Object.assign(r, { C, pHini: pIni, pHfin: pFin });
      pasos.push({ t: `pH at which it starts to precipitate (${f(C)} M of cation)`, html: `It starts when $Q = K_{"sp"}$: $[OH^{−}] = (K_{"sp"}/[A]${ex(a)})^{1/${b}} = (${f(Kps)}/${f(C)}${ex(a)})^{1/${b}} = ${f((Kps / C ** a) ** (1 / b))}$ M ⇒ $pOH = ${f(14 - pIni, 4)}$ ⇒ <b>pH = ${f(pIni, 4)}</b>.` });
      pasos.push({ t: 'pH at which precipitation is quantitative', html: `When 0.1 % of the cation remains ($[A] = ${f(Cres)}$ M): $[OH^{−}] = (K_{"sp"}/${f(Cres)}${ex(a)})^{1/${b}}$ ⇒ <b>pH = ${f(pFin, 4)}</b>. Between pH ${f(pIni, 3)} and ${f(pFin, 3)} lies the precipitation interval; at a higher pH the hydroxide has almost completely precipitated.` });
    }
    if (oh && ['Al(OH)3', 'Zn(OH)2', 'Pb(OH)2', 'Cr(OH)3'].includes(sc.formula)) pasos.push({ t: 'Warning: amphoterism', html: `This hydroxide is amphoteric: in a very basic medium it dissolves again forming hydroxocomplexes (for example $Al(OH)_{4}^{−}$). This mode does not include them, so at high pH the real solubility is greater than calculated; the complex mode treats it with the formation constant.` });
    return r;
  }
  const lg10 = Math.log10;

  function complejo(sc) {
    const a = lee(sc, 'a', 'the number of cations', { entero: true }), b = lee(sc, 'b', 'the number of anions', { entero: true }), Kps = lee(sc, 'Ksp', 'the Ksp');
    const C0 = lee(sc, 'L0', 'the initial concentration of the ligand'), logb = lista(sc.logb, 'The logarithms of the formation constants (log β₁; log β₂…)');
    const M = masaM(sc), pasos = [cabecera(sc, a, b, M)], lig = vacio(sc.lig) ? 'L' : sc.lig;
    const beta = logb.map((x) => (x === null ? null : 10 ** x)), n = beta.length;
    const nb = (L) => { let S = 1, N = 0; for (let k = 0; k < n; k++) if (beta[k]) { const t = beta[k] * L ** (k + 1); S += t; N += (k + 1) * t; } return [S, N / S]; }; // [1 + Σβ L^k, ligandos medios n̄]
    const libre = (s) => { let lo = 0, hi = C0; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (m + a * s * nb(m)[1] < C0) lo = m; else hi = m; } return (lo + hi) / 2; };
    const g = (s) => { const L = libre(s), [S] = nb(L); return Math.log((a * s / S) ** a * (b * s) ** b / Kps); };
    const s0 = solAgua(Kps, a, b);
    let lo = s0, hi = Math.max(s0 * 2, C0 / a * 2); while (g(hi) < 0 && hi < 1e6) hi *= 2;
    for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (g(m) < 0) lo = m; else hi = m; }
    const s = (lo + hi) / 2, L = libre(s), [S, nbar] = nb(L), Alibre = a * s / S;
    const frac = (k) => (k === 0 ? 1 : beta[k - 1] ? beta[k - 1] * L ** k : 0) / S;
    pasos.push({ t: 'Complexes of the cation', html: `The cation A forms complexes with ${esc2(lig)}: $A + k ${lig} ⇌ A(${lig})_{k}$ with $β_k$ ($log β$ = ${logb.map((x, k) => `${k + 1}: ${x === null ? '—' : f(x, 3)}`).join('; ')}). Only a fraction of the dissolved cation is free: $[A]_{"free"} = [A]_{"total"}/(1 + Σ β_k [${lig}]^{k})$.` });
    pasos.push({ t: 'Coupled equilibria', html: `Two conditions are imposed: $K_{"sp"} = [A]_{"free"}${ex(a)}[B]${ex(b)}$ with $[A]_{"total"} = ${a === 1 ? '' : a + ' '}s$ and $[B] = ${b === 1 ? '' : b + ' '}s$, and the ligand balance, $[${lig}]_{0} = [${lig}] + [A]_{"total"} · \bar n$, where $\bar n$ is the mean number of ligands per cation. They are solved together by bisection.` });
    pasos.push({ t: 'Result', html: `With ${f(C0)} M of initial ${lig}, $[${lig}] = ${f(L)}$ M remains free and $\bar n = ${f(nbar)}$. The solubility is <b>$s = ${f(s)}$ mol/L</b>${M ? ` = ${f(s * M)} g/L` : ''}, compared with $s_{0} = ${f(s0)}$ mol/L in water: <b>${f(s / s0, 3)} times</b> greater. The free cation is $[A] = ${f(Alibre)}$ M.` });
    const especies = beta.map((b2, k) => ({ k: k + 1, c: a * s * frac(k + 1) })).filter((e) => e.c > 0);
    pasos.push({ t: 'Distribution of the dissolved cation', html: `Free: ${f(100 * frac(0), 4)} %${especies.map((e) => `; ${'A(' + lig + ')'}<sub>${e.k}</sub>: ${f(100 * frac(e.k), 4)} %`).join('')}.` });
    const curva = []; for (let x = -3; x <= 1.0001; x += 0.1) { const c0 = 10 ** x; curva.push([x, solComp(c0)]); }
    function solComp(c0) {
      const lib = (ss) => { let l = 0, h = c0; for (let i = 0; i < 100; i++) { const m = (l + h) / 2; if (m + a * ss * nb(m)[1] < c0) l = m; else h = m; } return (l + h) / 2; };
      const gg = (ss) => { const [Sx] = nb(lib(ss)); return Math.log((a * ss / Sx) ** a * (b * ss) ** b / Kps); };
      let l = s0, h = Math.max(s0 * 2, c0 / a * 2); while (gg(h) < 0 && h < 1e6) h *= 2;
      for (let i = 0; i < 100; i++) { const m = (l + h) / 2; if (gg(m) < 0) l = m; else h = m; }
      return (l + h) / 2;
    }
    return { modo: 'complejo', a, b, Kps, L0: C0, lig, s, s0, factor: s / s0, L, nbar, Alibre, g: M ? s * M : null, M, curva, pasos };
  }
  const esc2 = (t) => String(t).replace(/[<>&]/g, '');

  function resolver(sc) {
    if (sc.modo === 'ph') return ph(sc);
    if (sc.modo === 'complejo') return complejo(sc);
    if (sc.modo === 'solub') return deKps(sc);
    if (sc.modo === 'comun') return ionComun(sc);
    if (sc.modo === 'precipita') return precipita(sc);
    if (sc.modo === 'selectiva') return selectiva(sc);
    return deSolubilidad(sc);
  }

  const ejemplos = [
    { clave: 'ag2cro4', nombre: 'Ksp of Ag₂CrO₄ from its solubility', sc: { modo: 'kps', formula: 'Ag2CrO4', a: '2', b: '1', s: '6.5e-5', uni: 'mol', M: '' } },
    { clave: 'baso4-g', nombre: 'Ksp of BaSO₄ from the solubility in g/L', sc: { modo: 'kps', formula: 'BaSO4', a: '1', b: '1', s: '2.4e-3', uni: 'g', M: '233.38' } },
    { clave: 'agcl', nombre: 'Solubility of AgCl in water', sc: { modo: 'solub', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', M: '' } },
    { clave: 'caoh2', nombre: 'Solubility of Ca(OH)₂ in water', sc: { modo: 'solub', formula: 'Ca(OH)2', a: '1', b: '2', Kps: '5.5e-6', M: '' } },
    { clave: 'agcl-nacl', nombre: 'AgCl in 0.10 M NaCl (common ion)', sc: { modo: 'comun', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', ion: 'an', C: '0.10', M: '' } },
    { clave: 'pbi2-mezcla', nombre: 'Mixture of Pb²⁺ and I⁻: does PbI₂ precipitate?', sc: { modo: 'precipita', formula: 'PbI2', a: '1', b: '2', Kps: '9.8e-9', c1: '0.01', V1: '50', c2: '0.01', V2: '50', M: '' } },
    { clave: 'agcl-mezcla', nombre: 'Mixture of Ag⁺ and Cl⁻: how much AgCl precipitates', sc: { modo: 'precipita', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', c1: '0.10', V1: '50', c2: '0.10', V2: '50', M: '143.32' } },
    { clave: 'sin-precipitado', nombre: 'Very dilute solution: no precipitate', sc: { modo: 'precipita', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', c1: '1e-6', V1: '100', c2: '1e-6', V2: '100', M: '' } },
    { clave: 'mg-oh-ph', nombre: 'Mg(OH)₂ in a pH 9 buffer: solubility and precipitation pH', sc: { modo: 'ph', sal: 'Mg(OH)2', formula: 'Mg(OH)2', a: '1', b: '2', Kps: '1.8e-11', anion: 'oh', pkas: '', pH: '9', C: '0.01', M: '' } },
    { clave: 'caco3-ph', nombre: 'CaCO₃ at pH 5: it dissolves in acidic medium', sc: { modo: 'ph', sal: 'CaCO3', formula: 'CaCO3', a: '1', b: '1', Kps: '3.4e-9', anion: 'base', pkas: '6,35 ; 10,33', pH: '5', C: '', M: '' } },
    { clave: 'caf2-ph', nombre: 'CaF₂ at pH 3: F⁻ is protonated', sc: { modo: 'ph', sal: 'CaF2', formula: 'CaF2', a: '1', b: '2', Kps: '3.9e-11', anion: 'base', pkas: '3,17', pH: '3', C: '', M: '' } },
    { clave: 'agcl-nh3', nombre: 'AgCl in 1 M ammonia: it dissolves through the complex', sc: { modo: 'complejo', sal: 'AgCl', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', lig: 'NH3', logb: '3,32 ; 7,23', L0: '1', M: '' } },
    { clave: 'cuoh2-nh3', nombre: 'Cu(OH)₂ in 2 M ammonia', sc: { modo: 'complejo', sal: 'Cu(OH)2', formula: 'Cu(OH)2', a: '1', b: '2', Kps: '2.2e-20', lig: 'NH3', logb: '4,04 ; 7,47 ; 10,27 ; 11,75', L0: '2', M: '' } },
    { clave: 'hidroxidos-separar', nombre: 'Separate Fe³⁺ and Mg²⁺ with OH⁻ (hydroxides at controlled pH)', sc: { modo: 'selectiva', comun: 'an', a1: '1', b1: '3', Kps1: '4e-38', c1: '0.01', a2: '1', b2: '2', Kps2: '1.8e-11', c2: '0.01' } },
    { clave: 'cl-i-ag', nombre: 'Separate I⁻ and Cl⁻ by adding Ag⁺', sc: { modo: 'selectiva', comun: 'cat', a1: '1', b1: '1', Kps1: '8.5e-17', c1: '0.10', a2: '1', b2: '1', Kps2: '1.8e-10', c2: '0.10' } },
    { clave: 'mohr', nombre: 'Cl⁻ and CrO₄²⁻ with Ag⁺ (Mohr\'s method)', sc: { modo: 'selectiva', comun: 'cat', a1: '1', b1: '1', Kps1: '1.8e-10', c1: '0.10', a2: '2', b2: '1', Kps2: '1.1e-12', c2: '1e-3' } },
  ];

  return { resolver, ejemplos, SALES, f };
})();

