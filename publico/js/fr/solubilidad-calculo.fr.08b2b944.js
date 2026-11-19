const Solubilidad = (() => {
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-300) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-2 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, entero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} manque`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} doit être un nombre`);
    if (v <= 0) throw new Error(`${Mayus(nom)} doit être supérieur à 0`);
    if (entero && (!Number.isInteger(v) || v > 6)) throw new Error(`${Mayus(nom)} doit être un entier de 1 à 6`);
    return v;
  }

  const D = typeof Datos !== 'undefined' ? Datos : require('../quimica/datos.js');
  const SALES = D.KPS.map(([c, cat, an, a, b, K, ac]) => [c, c, a, b, K, cat, an, ac]);

  const ns = (n) => (n === 1 ? 's' : `${n} s`);
  const sub = (n) => (n === 1 ? '' : `_{${n}}`), ex = (n) => (n === 1 ? '' : `^{${n}}`);
  const salM = (a, b) => `A${sub(a)}B${sub(b)}`; // la sal genérica, en Mates
  const prod = (a, b) => `[A]${ex(a)}[B]${ex(b)}`; // producto iónico, en Mates

  function masaM(sc) {
    if (!vacio(sc.M)) return lee(sc, 'M', 'la masse molaire');
    if (!vacio(sc.formula) && typeof Formulas !== 'undefined') { try { return Formulas.masaMolar(sc.formula).M; } catch (e) { throw new Error(`La formule : ${e.message}`); } }
    return null;
  }
  const nombre = (sc) => (!vacio(sc.formula) && typeof Formulas !== 'undefined' ? (() => { try { return Formulas.leer(sc.formula).html; } catch (e) { return ''; } })() : '');
  const cabecera = (sc, a, b, M) => {
    const nom = nombre(sc);
    return { t: 'Le sel et son équilibre', html: `${nom ? `${nom} est le sel peu soluble. ` : ''}Il s’écrit $${salM(a, b)}$ et se dissout : $${salM(a, b)} ⇌ ${a > 1 ? a + ' ' : ''}A + ${b > 1 ? b + ' ' : ''}B$, avec $K_{"s"} = ${prod(a, b)}$.${M ? ` Masse molaire : $M = ${f(M, 4)}$ g/mol.` : ''}` };
  };

  function biseca(g, lo, hi) { for (let i = 0; i < 300; i++) { const m = Math.sqrt(lo * hi); if (g(m) < 0) lo = m; else hi = m; } return Math.sqrt(lo * hi); }
  const solAgua = (Kps, a, b) => (Kps / (a ** a * b ** b)) ** (1 / (a + b));

  function deSolubilidad(sc) {
    const a = lee(sc, 'a', 'le nombre de cations', { entero: true }), b = lee(sc, 'b', 'le nombre d’anions', { entero: true });
    const dato = lee(sc, 's', 'la solubilidad'), enG = sc.uni === 'g', M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    if (enG && !M) throw new Error('Pour la solubilité en g/L, il faut la masse molaire (ou la formule)');
    const s = enG ? dato / M : dato;
    if (enG) pasos.push({ t: 'De g/L à mol/L', html: `$s = {${f(dato)} "g/L"}/{${f(M, 4)} "g/mol"} = ${f(s)} "mol/L"$` });
    const ca = a * s, cb = b * s, Kps = ca ** a * cb ** b;
    pasos.push({ t: 'Concentration des ions', html: `Chaque mole de sel qui se dissout donne $${a}$ mol de A et $${b}$ de B : $[A] = ${ns(a)} = ${f(ca)}$ M et $[B] = ${ns(b)} = ${f(cb)}$ M.` });
    pasos.push({ t: 'Produit de solubilité', html: `$K_{"s"} = ${prod(a, b)} = (${f(ca)})${ex(a)} (${f(cb)})${ex(b)}$ = <b>${f(Kps)}</b>. En général, $K_{"s"} = ${a ** a * b ** b === 1 ? '' : a ** a * b ** b + ' '}s^{${a + b}}$.` });
    return { modo: 'kps', a, b, s, g: M ? s * M : null, M, Kps, ca, cb, pasos };
  }

  function deKps(sc) {
    const a = lee(sc, 'a', 'le nombre de cations', { entero: true }), b = lee(sc, 'b', 'le nombre d’anions', { entero: true });
    const Kps = lee(sc, 'Ks', 'le Ks'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const s = solAgua(Kps, a, b), ca = a * s, cb = b * s;
    const k = a ** a * b ** b;
    pasos.push({ t: 'Ks en fonction de la solubilité', html: `Si $s$ mol/L se dissolvent, $[A] = ${a === 1 ? '' : a + ' '}s$ et $[B] = ${b === 1 ? '' : b + ' '}s$, donc $K_{"s"} = (${a === 1 ? '' : a} s)${ex(a)} (${b === 1 ? '' : b} s)${ex(b)} = ${k === 1 ? '' : k + ' '}s^{${a + b}}$.` });
    pasos.push({ t: 'Isoler la solubilité', html: `$s = (K_{"s"}/${k})^{1/${a + b}} = (${f(Kps)}${k === 1 ? '' : '/' + k})^{1/${a + b}}$ = <b>${f(s)} mol/L</b>` });
    pasos.push({ t: 'Concentration des ions', html: `$[A] = ${f(ca)}$ M y $[B] = ${f(cb)}$ M.` });
    if (M) pasos.push({ t: 'En grammes par litre', html: `$s = ${f(s)} · ${f(M, 4)}$ = <b>${f(s * M)} g/L</b>` });
    return { modo: 'solub', a, b, s, g: M ? s * M : null, M, Kps, ca, cb, pasos };
  }

  function ionComun(sc) {
    const a = lee(sc, 'a', 'le nombre de cations', { entero: true }), b = lee(sc, 'b', 'le nombre d’anions', { entero: true });
    const Kps = lee(sc, 'Ks', 'le Ks'), C = lee(sc, 'C', 'la concentration de l’ion commun'), M = masaM(sc), cat = sc.ion === 'cat', pasos = [cabecera(sc, a, b, M)];
    const s0 = solAgua(Kps, a, b), ion = cat ? 'A' : 'B', otro = cat ? 'B' : 'A', pc = cat ? a : b, po = cat ? b : a;
    const g = (s) => (a * s + (cat ? C : 0)) ** a * (b * s + (cat ? 0 : C)) ** b - Kps;
    const s = g(s0) <= 0 ? s0 : biseca((x) => g(x), s0 * 1e-80, s0);
    pasos.push({ t: 'Dans l’eau pure', html: `Sans ion commun, $s_{0} = (K_{"s"}/${a ** a * b ** b})^{1/${a + b}} = ${f(s0)}$ mol/L.` });
    pasos.push({ t: 'Avec l’ion commun', html: `La solution a déjà $[${ion}] = ${f(C)}$ M. Si $s$ mol/L se dissolvent, $[${ion}] = ${ns(cat ? a : b)} + ${f(C)}$ et $[${otro}] = ${ns(po)}$, donc $K_{"s"} = ${cat ? `(${ns(a)} + ${f(C)})${ex(a)}(${ns(b)})${ex(b)}` : `(${ns(a)})${ex(a)}(${ns(b)} + ${f(C)})${ex(b)}`}$.` });
    const sap = (Kps / C ** pc) ** (1 / po) / po, err = Math.abs(sap - s) / s;
    pasos.push({ t: 'Approximation', html: `Comme $s$ est bien plus petit que $C$, $${pc === 1 ? '' : pc + ' '}s + C ≈ C$ et $K_{"s"} ≈ C${ex(pc)} · ${po === 1 ? 's' : `(${po} s)${ex(po)}`}$, d’où $s ≈ ${f(sap)}$ mol/L${err < 0.05 ? ` (${f(100 * err, 2)} % de différence)` : ` (elle n’est pas bonne : elle diffère de ${f(100 * err, 2)} %)`}.` });
    pasos.push({ t: 'Résultat', html: `En résolvant l’équation complète : <b>$s = ${f(s)}$ mol/L</b>${M ? ` = ${f(s * M)} g/L` : ''}. Il est ${f(s0 / s, 3)} fois moins soluble que dans l’eau pure : l’ion commun déplace l’équilibre vers le solide.` });
    return { modo: 'comun', a, b, Kps, C, cat, s, s0, g: M ? s * M : null, M, ca: a * s + (cat ? C : 0), cb: b * s + (cat ? 0 : C), factor: s0 / s, pasos };
  }

  function precipita(sc) {
    const a = lee(sc, 'a', 'le nombre de cations', { entero: true }), b = lee(sc, 'b', 'le nombre d’anions', { entero: true });
    const Kps = lee(sc, 'Ks', 'le Ks'), c1 = lee(sc, 'c1', 'la concentration du cation'), V1 = lee(sc, 'V1', 'le volume de la solution du cation');
    const c2 = lee(sc, 'c2', 'la concentration de l’anion'), V2 = lee(sc, 'V2', 'le volume de la solution de l’anion'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const Vt = V1 + V2, ca = (c1 * V1) / Vt, cb = (c2 * V2) / Vt, Q = ca ** a * cb ** b, ratio = Q / Kps;
    pasos.push({ t: 'Concentrations après mélange', html: `Le volume total est ${f(V1)} + ${f(V2)} = ${f(Vt)} mL et chaque ion se dilue : $[A]_{0} = {${f(c1)} · ${f(V1)}}/{${f(Vt)}} = ${f(ca)}$ M, &ensp; $[B]_{0} = {${f(c2)} · ${f(V2)}}/{${f(Vt)}} = ${f(cb)}$ M.` });
    pasos.push({ t: 'Produit ionique Q', html: `$Q = ${prod(a, b)} = (${f(ca)})${ex(a)} (${f(cb)})${ex(b)}$ = <b>${f(Q)}</b>, face à $K_{"s"} = ${f(Kps)}$ : $Q / K_{"s"} = ${f(ratio)}$.` });
    const r = { modo: 'precipita', a, b, Kps, ca0: ca, cb0: cb, Q, ratio, Vt, M, pasos, precipita: Q > Kps * (1 + 1e-12) };
    if (!r.precipita) {
      pasos.push({ t: 'Conclusion', html: `${Q < Kps ? '$Q < K_{"s"}$ : la solution n’est pas saturée' : '$Q = K_{"s"}$ : tout juste saturée'}, <b>il ne précipite pas</b> et tout reste dissous.` });
    } else {
      pasos.push({ t: 'Conclusion', html: `$Q > K_{"s"}$ : la solution est sursaturée et du sel <b>précipite</b> jusqu’à ce que le produit ionique revienne à $K_{"s"}$.` });
      const ea = ca / a, eb = cb / b; // moles de sal que cabrían por litro con cada ion
      const limA = ea <= eb, e = limA ? eb - ea : ea - eb;
      const quedaA = (y) => (limA ? y : a * (y / b + e)), quedaB = (y) => (limA ? b * (y / a + e) : y);
      const hi = limA ? ca : cb, y = biseca((v) => quedaA(v) ** a * quedaB(v) ** b - Kps, hi * 1e-80, hi);
      const cA = quedaA(y), cB = quedaB(y), x = (ca - cA) / a, mol = (x * Vt) / 1000;
      pasos.push({ t: 'Ce qui précipite', html: `Si $x$ mol/L de sel précipitent, il reste $[A] = ${f(ca)} − ${a === 1 ? '' : a + ' '}x$ et $[B] = ${f(cb)} − ${b === 1 ? '' : b + ' '}x$. On impose $(${f(ca)} − ${a === 1 ? '' : a + ' '}x)${ex(a)} (${f(cb)} − ${b === 1 ? '' : b + ' '}x)${ex(b)} = ${f(Kps)}$ et on résout numériquement : $x = ${f(x)}$ mol/L.` });
      pasos.push({ t: 'Ce qui reste en solution', html: `$[A] = ${f(cA)}$ M et $[B] = ${f(cB)}$ M (${limA ? 'le cation' : 'l’anion'} est le limitant et s’épuise presque).` });
      pasos.push({ t: 'Solide formé', html: `$n = x V = ${f(x)} · ${f(Vt / 1000)}$ L = <b>${f(mol)} mol</b>${M ? `, soit <b>${f(mol * M)} g</b> de précipité` : ''}.` });
      Object.assign(r, { x, mol, masa: M ? mol * M : null, cA, cB, limitante: limA ? 'cation' : 'anion', porciento: limA ? (100 * (ca - cA)) / ca : (100 * (cb - cB)) / cb });
    }
    return r;
  }

  function selectiva(sc) {
    const cat = sc.comun === 'cat', S = [1, 2].map((i) => {
      const a = lee(sc, 'a' + i, `le nombre de cations du sel ${i}`, { entero: true }), b = lee(sc, 'b' + i, `le nombre d’anions du sel ${i}`, { entero: true });
      const Kps = lee(sc, 'Ks' + i, `le Ks du sel ${i}`), c = lee(sc, 'c' + i, `la concentration de l’ion du sel ${i} qui n’est pas l’ion commun`);
      const p = cat ? a : b, q = cat ? b : a; // exponentes del ion que se añade y del otro
      return { i, a, b, Kps, c, p, q, X: (Kps / c ** q) ** (1 / p) };
    });
    const ion = cat ? 'cation' : 'anion', add = cat ? 'A' : 'B', otro = cat ? 'B' : 'A';
    const pasos = [{ t: 'Énoncé', html: `On ajoute peu à peu l’${ion} que les deux sels partagent (on l’appelle $${add}$). Un sel commence à précipiter quand $Q = K_{"s"}$, c’est-à-dire quand $[${add}]$ atteint $[${add}] = (K_{"s"} / [${otro}]^{q})^{1/p}$, avec $p$ l’exposant de $${add}$ dans le Ks et $q$ celui de l’autre ion.` }];
    for (const s of S) pasos.push({ t: `Sel ${s.i}`, html: `$K_{"s"} = ${f(s.Kps)}$ avec $[${otro}] = ${f(s.c)}$ M : il commence à précipiter avec $[${add}] = (${f(s.Kps)} / ${f(s.c)}${ex(s.q)})^{1/${s.p}}$ = <b>${f(s.X)} M</b>.` });
    const [p, q] = S[0].X <= S[1].X ? [S[0], S[1]] : [S[1], S[0]];
    pasos.push({ t: 'Lequel précipite en premier', html: `Le <b>sel ${p.i}</b> précipite d’abord, car il demande moins de ${ion} (${f(p.X)} M contre ${f(q.X)} M).` });
    const resta = (p.Kps / q.X ** p.p) ** (1 / p.q), frac = resta / p.c;
    pasos.push({ t: `Ce qui reste du sel ${p.i} quand le ${q.i} commence`, html: `Quand on atteint $[${add}] = ${f(q.X)}$ M, l’ion $${otro}$ du sel ${p.i} vérifie $K_{"s"} = ${f(p.Kps)}$, donc il lui reste $[${otro}] = (${f(p.Kps)} / ${f(q.X)}${ex(p.p)})^{1/${p.q}}$ = <b>${f(resta)} M</b> : <b>${f(100 * frac)} %</b> de ce qu’il y avait (${f(p.c)} M).` });
    const sep = frac < 1e-3;
    pasos.push({ t: 'Séparation', html: `${f(100 * (1 - frac), 6)} % du sel ${p.i} a précipité avant que le ${q.i} commence. ${sep ? 'On la considère comme une <b>séparation quantitative</b> (il en reste moins de 0,1 %).' : 'Ce n’est pas une séparation quantitative (il faudrait qu’il en reste moins de 0,1 %) : ils précipiteraient en partie ensemble.'}` });
    return { modo: 'selectiva', cat, ion, S, primera: p.i, p, q, resta, frac, sep, pasos };
  }

  const lista = (t, nom) => {
    const xs = String(t ?? '').split(';').map((x) => x.trim()).filter(Boolean).map(leeNum);
    if (!xs.length || xs.some((x) => !isFinite(x))) throw new Error(`${nom} : écrivez des nombres séparés par « ; », comme 6,35 ; 10,33`);
    return xs;
  };
  const pHde = (sc) => { const v = leeNum(sc.pH); if (!isFinite(v) || v < 0 || v > 14) throw new Error('Le pH doit être un nombre entre 0 et 14'); return v; };
  const alfa0 = (pKas, pH) => {
    const h = 10 ** -pH, Ka = pKas.map((p) => 10 ** -p); let suma = 1, prod = 1;
    for (let k = 1; k <= Ka.length; k++) { prod *= Ka[Ka.length - k]; suma += h ** k / prod; }
    return 1 / suma;
  };
  function ph(sc) {
    const a = lee(sc, 'a', 'le nombre de cations', { entero: true }), b = lee(sc, 'b', 'le nombre d’anions', { entero: true }), Kps = lee(sc, 'Ks', 'le Ks'), pH = pHde(sc);
    const oh = sc.anion === 'oh', pKas = oh ? [] : lista(sc.pkas, 'Les pKa de l’acide conjugué de l’anion'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const s0 = solAgua(Kps, a, b);
    const sDe = (pHx) => {
      if (oh) { const OH = 10 ** (pHx - 14); return Math.min(Kps / OH ** b / a, Infinity) / 1; } // [A] = a·s → s = [A]/a con [A]^a [OH]^b = Kps
      return (Kps / (a ** a * b ** b * alfa0(pKas, pHx) ** b)) ** (1 / (a + b));
    };
    let s;
    if (oh) {
      const OH = 10 ** (pH - 14), A = (Kps / OH ** b) ** (1 / a);
      s = A / a;
      pasos.push({ t: 'Hydroxyde : le pH fixe [OH⁻]', html: `L’anion est OH⁻, donc le pH le fixe de l’extérieur : $[OH^{−}] = 10^{pH−14} = 10^{${f(pH - 14, 3)}} = ${f(OH)}$ M. L’équilibre $K_{"s"} = [A]${ex(a)}[OH^{−}]${ex(b)}$ donne $[A] = (K_{"s"}/[OH^{−}]${ex(b)})^{1/${a}} = ${f(A)}$ M.` });
      pasos.push({ t: 'Solubilité', html: `La solubilité est ce qui se dissout du solide : $s = [A]/${a} = ${f(s)}$ mol/L${M ? ` = ${f(s * M)} g/L` : ''}. Dans l’eau pure, ce serait $s_{0} = ${f(s0)}$ mol/L (le pH de cette solution serait autre : ici le pH est maintenu par un tampon).` });
    } else {
      const al = alfa0(pKas, pH);
      s = sDe(pH);
      pasos.push({ t: 'L’anion se protone', html: `L’anion B est la base conjuguée d’un acide faible de $pK_a$ = ${pKas.map((x) => f(x, 3)).join('; ')}. À pH ${f(pH, 3)}, seule une fraction $α = ${f(al)}$ de l’anion total est sous forme de B libre ; le reste est protoné (HB, H₂B…) et ne compte pas dans le $K_{"s"}$.` });
      pasos.push({ t: 'Solubilité', html: `$K_{"s"} = [A]${ex(a)}[B]${ex(b)} = (${a === 1 ? '' : a + ' '}s)${ex(a)}(${b === 1 ? '' : b + ' '}s α)${ex(b)}$ ⇒ $s = (K_{"s"}/(${a ** a * b ** b} α${ex(b)}))^{1/${a + b}} = ${f(s)}$ mol/L${M ? ` = ${f(s * M)} g/L` : ''}. Dans un milieu où l’anion ne se protone pas, ce serait $s_{0} = ${f(s0)}$ mol/L.` });
    }
    pasos.push({ t: 'Effet du pH', html: `À pH ${f(pH, 3)}, le sel est <b>${f(s / s0, 3)} fois ${s > s0 ? 'plus' : 'moins'} soluble</b> que sans tenir compte de la protonation de l’anion${oh ? ' dans l’eau pure' : ''}. ${oh ? 'Un pH acide (peu de OH⁻) dissout l’hydroxyde ; un pH basique le fait précipiter.' : 'En baissant le pH, l’anion se protone, l’équilibre de dissolution se déplace vers la droite et le sel se dissout davantage.'}` });
    const r = { modo: 'ph', a, b, Kps, pH, s, s0, factor: s / s0, g: M ? s * M : null, M, oh, pKas, pasos };
    const curva = []; for (let x = 0; x <= 14.0001; x += 0.25) curva.push([x, sDe(x)]);
    r.curva = curva;
    if (oh && String(sc.C ?? '').trim() !== '') {
      const C = lee(sc, 'C', 'la concentration du cation'), pIni = 14 + lg10((Kps / C ** a) ** (1 / b)), Cres = C / 1000, pFin = 14 + lg10((Kps / Cres ** a) ** (1 / b));
      Object.assign(r, { C, pHini: pIni, pHfin: pFin });
      pasos.push({ t: `pH auquel il commence à précipiter (${f(C)} M de cation)`, html: `Il commence quand $Q = K_{"s"}$ : $[OH^{−}] = (K_{"s"}/[A]${ex(a)})^{1/${b}} = (${f(Kps)}/${f(C)}${ex(a)})^{1/${b}} = ${f((Kps / C ** a) ** (1 / b))}$ M ⇒ $pOH = ${f(14 - pIni, 4)}$ ⇒ <b>pH = ${f(pIni, 4)}</b>.` });
      pasos.push({ t: 'pH auquel la précipitation est quantitative', html: `Quand il reste 0,1 % du cation ($[A] = ${f(Cres)}$ M) : $[OH^{−}] = (K_{"s"}/${f(Cres)}${ex(a)})^{1/${b}}$ ⇒ <b>pH = ${f(pFin, 4)}</b>. Entre pH ${f(pIni, 3)} et ${f(pFin, 3)} se trouve l’intervalle de précipitation ; à un pH supérieur, l’hydroxyde a précipité presque entièrement.` });
    }
    if (oh && ['Al(OH)3', 'Zn(OH)2', 'Pb(OH)2', 'Cr(OH)3'].includes(sc.formula)) pasos.push({ t: 'Avertissement : amphotérisme', html: `Cet hydroxyde est amphotère : en milieu très basique, il se redissout en formant des hydroxocomplexes (par exemple $Al(OH)_{4}^{−}$). Ce mode ne les inclut pas, donc à pH élevé la solubilité réelle est supérieure à celle calculée ; le mode des complexes les traite avec la constante de formation.` });
    return r;
  }
  const lg10 = Math.log10;

  function complejo(sc) {
    const a = lee(sc, 'a', 'le nombre de cations', { entero: true }), b = lee(sc, 'b', 'le nombre d’anions', { entero: true }), Kps = lee(sc, 'Ks', 'le Ks');
    const C0 = lee(sc, 'L0', 'la concentration initiale du ligand'), logb = lista(sc.logb, 'Les logarithmes des constantes de formation (log β₁ ; log β₂…)');
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
    pasos.push({ t: 'Complexes du cation', html: `Le cation A forme des complexes avec ${esc2(lig)} : $A + k ${lig} ⇌ A(${lig})_{k}$ de $β_k$ ($log β$ = ${logb.map((x, k) => `${k + 1} : ${x === null ? '—' : f(x, 3)}`).join('; ')}). Seule une fraction du cation dissous est libre : $[A]_{"libre"} = [A]_{"total"}/(1 + Σ β_k [${lig}]^{k})$.` });
    pasos.push({ t: 'Équilibres couplés', html: `On impose deux conditions : $K_{"s"} = [A]_{"libre"}${ex(a)}[B]${ex(b)}$ avec $[A]_{"total"} = ${a === 1 ? '' : a + ' '}s$ et $[B] = ${b === 1 ? '' : b + ' '}s$, et le bilan du ligand, $[${lig}]_{0} = [${lig}] + [A]_{"total"} · \bar n$, où $\bar n$ est le nombre moyen de ligands par cation. On les résout ensemble par dichotomie.` });
    pasos.push({ t: 'Résultat', html: `Avec ${f(C0)} M de ${lig} initial, il reste libre $[${lig}] = ${f(L)}$ M et $\bar n = ${f(nbar)}$. La solubilité est <b>$s = ${f(s)}$ mol/L</b>${M ? ` = ${f(s * M)} g/L` : ''}, contre $s_{0} = ${f(s0)}$ mol/L dans l’eau : <b>${f(s / s0, 3)} fois</b> plus grande. Le cation libre est $[A] = ${f(Alibre)}$ M.` });
    const especies = beta.map((b2, k) => ({ k: k + 1, c: a * s * frac(k + 1) })).filter((e) => e.c > 0);
    pasos.push({ t: 'Répartition du cation dissous', html: `Libre : ${f(100 * frac(0), 4)} %${especies.map((e) => `; ${'A(' + lig + ')'}<sub>${e.k}</sub> : ${f(100 * frac(e.k), 4)} %`).join('')}.` });
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
    { clave: 'ag2cro4', nombre: 'Ks de Ag₂CrO₄ à partir de sa solubilité', sc: { modo: 'kps', formula: 'Ag2CrO4', a: '2', b: '1', s: '6.5e-5', uni: 'mol', M: '' } },
    { clave: 'baso4-g', nombre: 'Ks de BaSO₄ avec la solubilité en g/L', sc: { modo: 'kps', formula: 'BaSO4', a: '1', b: '1', s: '2.4e-3', uni: 'g', M: '233.38' } },
    { clave: 'agcl', nombre: 'Solubilité de AgCl dans l’eau', sc: { modo: 'solub', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', M: '' } },
    { clave: 'caoh2', nombre: 'Solubilité de Ca(OH)₂ dans l’eau', sc: { modo: 'solub', formula: 'Ca(OH)2', a: '1', b: '2', Kps: '5.5e-6', M: '' } },
    { clave: 'agcl-nacl', nombre: 'AgCl dans NaCl 0,10 M (ion commun)', sc: { modo: 'comun', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', ion: 'an', C: '0.10', M: '' } },
    { clave: 'pbi2-mezcla', nombre: 'Mélange de Pb²⁺ et I⁻ : PbI₂ précipite-t-il ?', sc: { modo: 'precipita', formula: 'PbI2', a: '1', b: '2', Kps: '9.8e-9', c1: '0.01', V1: '50', c2: '0.01', V2: '50', M: '' } },
    { clave: 'agcl-mezcla', nombre: 'Mélange de Ag⁺ et Cl⁻ : combien de AgCl précipite', sc: { modo: 'precipita', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', c1: '0.10', V1: '50', c2: '0.10', V2: '50', M: '143.32' } },
    { clave: 'sin-precipitado', nombre: 'Solution très diluée : pas de précipitation', sc: { modo: 'precipita', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', c1: '1e-6', V1: '100', c2: '1e-6', V2: '100', M: '' } },
    { clave: 'mg-oh-ph', nombre: 'Mg(OH)₂ dans un tampon de pH 9 : solubilité et pH de précipitation', sc: { modo: 'ph', sal: 'Mg(OH)2', formula: 'Mg(OH)2', a: '1', b: '2', Kps: '1.8e-11', anion: 'oh', pkas: '', pH: '9', C: '0.01', M: '' } },
    { clave: 'caco3-ph', nombre: 'CaCO₃ à pH 5 : il se dissout en milieu acide', sc: { modo: 'ph', sal: 'CaCO3', formula: 'CaCO3', a: '1', b: '1', Kps: '3.4e-9', anion: 'base', pkas: '6,35 ; 10,33', pH: '5', C: '', M: '' } },
    { clave: 'caf2-ph', nombre: 'CaF₂ à pH 3 : F⁻ se protone', sc: { modo: 'ph', sal: 'CaF2', formula: 'CaF2', a: '1', b: '2', Kps: '3.9e-11', anion: 'base', pkas: '3,17', pH: '3', C: '', M: '' } },
    { clave: 'agcl-nh3', nombre: 'AgCl dans l’ammoniaque 1 M : il se dissout grâce au complexe', sc: { modo: 'complejo', sal: 'AgCl', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', lig: 'NH3', logb: '3,32 ; 7,23', L0: '1', M: '' } },
    { clave: 'cuoh2-nh3', nombre: 'Cu(OH)₂ dans l’ammoniaque 2 M', sc: { modo: 'complejo', sal: 'Cu(OH)2', formula: 'Cu(OH)2', a: '1', b: '2', Kps: '2.2e-20', lig: 'NH3', logb: '4,04 ; 7,47 ; 10,27 ; 11,75', L0: '2', M: '' } },
    { clave: 'hidroxidos-separar', nombre: 'Séparer Fe³⁺ et Mg²⁺ avec OH⁻ (hydroxydes à pH contrôlé)', sc: { modo: 'selectiva', comun: 'an', a1: '1', b1: '3', Kps1: '4e-38', c1: '0.01', a2: '1', b2: '2', Kps2: '1.8e-11', c2: '0.01' } },
    { clave: 'cl-i-ag', nombre: 'Séparer I⁻ et Cl⁻ en ajoutant Ag⁺', sc: { modo: 'selectiva', comun: 'cat', a1: '1', b1: '1', Kps1: '8.5e-17', c1: '0.10', a2: '1', b2: '1', Kps2: '1.8e-10', c2: '0.10' } },
    { clave: 'mohr', nombre: 'Cl⁻ et CrO₄²⁻ avec Ag⁺ (méthode de Mohr)', sc: { modo: 'selectiva', comun: 'cat', a1: '1', b1: '1', Kps1: '1.8e-10', c1: '0.10', a2: '2', b2: '1', Kps2: '1.1e-12', c2: '1e-3' } },
  ];

  return { resolver, ejemplos, SALES, f };
})();

