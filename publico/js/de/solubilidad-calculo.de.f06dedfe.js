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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} fehlt`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} muss eine Zahl sein`);
    if (v <= 0) throw new Error(`${Mayus(nom)} muss größer als 0 sein`);
    if (entero && (!Number.isInteger(v) || v > 6)) throw new Error(`${Mayus(nom)} muss eine ganze Zahl von 1 bis 6 sein`);
    return v;
  }

  const D = typeof Datos !== 'undefined' ? Datos : require('../quimica/datos.js');
  const SALES = D.KPS.map(([c, cat, an, a, b, K, ac]) => [c, c, a, b, K, cat, an, ac]);

  const ns = (n) => (n === 1 ? 's' : `${n} s`);
  const sub = (n) => (n === 1 ? '' : `_{${n}}`), ex = (n) => (n === 1 ? '' : `^{${n}}`);
  const salM = (a, b) => `A${sub(a)}B${sub(b)}`; // la sal genérica, en Mates
  const prod = (a, b) => `[A]${ex(a)}[B]${ex(b)}`; // producto iónico, en Mates

  function masaM(sc) {
    if (!vacio(sc.M)) return lee(sc, 'M', 'die molare Masse');
    if (!vacio(sc.formula) && typeof Formulas !== 'undefined') { try { return Formulas.masaMolar(sc.formula).M; } catch (e) { throw new Error(`Die Formel: ${e.message}`); } }
    return null;
  }
  const nombre = (sc) => (!vacio(sc.formula) && typeof Formulas !== 'undefined' ? (() => { try { return Formulas.leer(sc.formula).html; } catch (e) { return ''; } })() : '');
  const cabecera = (sc, a, b, M) => {
    const nom = nombre(sc);
    return { t: 'Das Salz und sein Gleichgewicht', html: `${nom ? `${nom} ist das schwerlösliche Salz. ` : ''}Es wird als $${salM(a, b)}$ geschrieben und löst sich: $${salM(a, b)} ⇌ ${a > 1 ? a + ' ' : ''}A + ${b > 1 ? b + ' ' : ''}B$, mit $K_{"L"} = ${prod(a, b)}$.${M ? ` Molare Masse: $M = ${f(M, 4)}$ g/mol.` : ''}` };
  };

  function biseca(g, lo, hi) { for (let i = 0; i < 300; i++) { const m = Math.sqrt(lo * hi); if (g(m) < 0) lo = m; else hi = m; } return Math.sqrt(lo * hi); }
  const solAgua = (Kps, a, b) => (Kps / (a ** a * b ** b)) ** (1 / (a + b));

  function deSolubilidad(sc) {
    const a = lee(sc, 'a', 'die Anzahl der Kationen', { entero: true }), b = lee(sc, 'b', 'die Anzahl der Anionen', { entero: true });
    const dato = lee(sc, 's', 'la solubilidad'), enG = sc.uni === 'g', M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    if (enG && !M) throw new Error('Für die Löslichkeit in g/L braucht man die molare Masse (oder die Formel)');
    const s = enG ? dato / M : dato;
    if (enG) pasos.push({ t: 'Von g/L zu mol/L', html: `$s = {${f(dato)} "g/L"}/{${f(M, 4)} "g/mol"} = ${f(s)} "mol/L"$` });
    const ca = a * s, cb = b * s, Kps = ca ** a * cb ** b;
    pasos.push({ t: 'Konzentration der Ionen', html: `Jedes Mol gelöstes Salz liefert $${a}$ mol A und $${b}$ mol B: $[A] = ${ns(a)} = ${f(ca)}$ M und $[B] = ${ns(b)} = ${f(cb)}$ M.` });
    pasos.push({ t: 'Löslichkeitsprodukt', html: `$K_{"L"} = ${prod(a, b)} = (${f(ca)})${ex(a)} (${f(cb)})${ex(b)}$ = <b>${f(Kps)}</b>. Allgemein gilt $K_{"L"} = ${a ** a * b ** b === 1 ? '' : a ** a * b ** b + ' '}s^{${a + b}}$.` });
    return { modo: 'kps', a, b, s, g: M ? s * M : null, M, Kps, ca, cb, pasos };
  }

  function deKps(sc) {
    const a = lee(sc, 'a', 'die Anzahl der Kationen', { entero: true }), b = lee(sc, 'b', 'die Anzahl der Anionen', { entero: true });
    const Kps = lee(sc, 'KL', 'das KL'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const s = solAgua(Kps, a, b), ca = a * s, cb = b * s;
    const k = a ** a * b ** b;
    pasos.push({ t: 'KL als Funktion der Löslichkeit', html: `Lösen sich $s$ mol/L, ist $[A] = ${a === 1 ? '' : a + ' '}s$ und $[B] = ${b === 1 ? '' : b + ' '}s$, also $K_{"L"} = (${a === 1 ? '' : a} s)${ex(a)} (${b === 1 ? '' : b} s)${ex(b)} = ${k === 1 ? '' : k + ' '}s^{${a + b}}$.` });
    pasos.push({ t: 'Nach der Löslichkeit auflösen', html: `$s = (K_{"L"}/${k})^{1/${a + b}} = (${f(Kps)}${k === 1 ? '' : '/' + k})^{1/${a + b}}$ = <b>${f(s)} mol/L</b>` });
    pasos.push({ t: 'Konzentration der Ionen', html: `$[A] = ${f(ca)}$ M y $[B] = ${f(cb)}$ M.` });
    if (M) pasos.push({ t: 'In Gramm pro Liter', html: `$s = ${f(s)} · ${f(M, 4)}$ = <b>${f(s * M)} g/L</b>` });
    return { modo: 'solub', a, b, s, g: M ? s * M : null, M, Kps, ca, cb, pasos };
  }

  function ionComun(sc) {
    const a = lee(sc, 'a', 'die Anzahl der Kationen', { entero: true }), b = lee(sc, 'b', 'die Anzahl der Anionen', { entero: true });
    const Kps = lee(sc, 'KL', 'das KL'), C = lee(sc, 'C', 'die Konzentration des gleichen Ions'), M = masaM(sc), cat = sc.ion === 'cat', pasos = [cabecera(sc, a, b, M)];
    const s0 = solAgua(Kps, a, b), ion = cat ? 'A' : 'B', otro = cat ? 'B' : 'A', pc = cat ? a : b, po = cat ? b : a;
    const g = (s) => (a * s + (cat ? C : 0)) ** a * (b * s + (cat ? 0 : C)) ** b - Kps;
    const s = g(s0) <= 0 ? s0 : biseca((x) => g(x), s0 * 1e-80, s0);
    pasos.push({ t: 'In reinem Wasser', html: `Ohne gleiches Ion ist $s_{0} = (K_{"L"}/${a ** a * b ** b})^{1/${a + b}} = ${f(s0)}$ mol/L.` });
    pasos.push({ t: 'Mit gleichem Ion', html: `Die Lösung enthält bereits $[${ion}] = ${f(C)}$ M. Lösen sich $s$ mol/L, ist $[${ion}] = ${ns(cat ? a : b)} + ${f(C)}$ und $[${otro}] = ${ns(po)}$, also $K_{"L"} = ${cat ? `(${ns(a)} + ${f(C)})${ex(a)}(${ns(b)})${ex(b)}` : `(${ns(a)})${ex(a)}(${ns(b)} + ${f(C)})${ex(b)}`}$.` });
    const sap = (Kps / C ** pc) ** (1 / po) / po, err = Math.abs(sap - s) / s;
    pasos.push({ t: 'Näherung', html: `Da $s$ viel kleiner als $C$ ist, gilt $${pc === 1 ? '' : pc + ' '}s + C ≈ C$ und $K_{"L"} ≈ C${ex(pc)} · ${po === 1 ? 's' : `(${po} s)${ex(po)}`}$, woraus $s ≈ ${f(sap)}$ mol/L folgt${err < 0.05 ? ` (${f(100 * err, 2)} % Abweichung)` : ` (nicht gut: weicht um ${f(100 * err, 2)} % ab)`}.` });
    pasos.push({ t: 'Ergebnis', html: `Löst man die vollständige Gleichung: <b>$s = ${f(s)}$ mol/L</b>${M ? ` = ${f(s * M)} g/L` : ''}. Es ist ${f(s0 / s, 3)}-mal weniger löslich als in reinem Wasser: Das gleiche Ion verschiebt das Gleichgewicht zum Feststoff.` });
    return { modo: 'comun', a, b, Kps, C, cat, s, s0, g: M ? s * M : null, M, ca: a * s + (cat ? C : 0), cb: b * s + (cat ? 0 : C), factor: s0 / s, pasos };
  }

  function precipita(sc) {
    const a = lee(sc, 'a', 'die Anzahl der Kationen', { entero: true }), b = lee(sc, 'b', 'die Anzahl der Anionen', { entero: true });
    const Kps = lee(sc, 'KL', 'das KL'), c1 = lee(sc, 'c1', 'die Konzentration des Kations'), V1 = lee(sc, 'V1', 'das Volumen der Kationenlösung');
    const c2 = lee(sc, 'c2', 'die Konzentration des Anions'), V2 = lee(sc, 'V2', 'das Volumen der Anionenlösung'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const Vt = V1 + V2, ca = (c1 * V1) / Vt, cb = (c2 * V2) / Vt, Q = ca ** a * cb ** b, ratio = Q / Kps;
    pasos.push({ t: 'Konzentrationen nach dem Mischen', html: `Das Gesamtvolumen beträgt ${f(V1)} + ${f(V2)} = ${f(Vt)} mL, und jedes Ion wird verdünnt: $[A]_{0} = {${f(c1)} · ${f(V1)}}/{${f(Vt)}} = ${f(ca)}$ M, &ensp; $[B]_{0} = {${f(c2)} · ${f(V2)}}/{${f(Vt)}} = ${f(cb)}$ M.` });
    pasos.push({ t: 'Ionenprodukt Q', html: `$Q = ${prod(a, b)} = (${f(ca)})${ex(a)} (${f(cb)})${ex(b)}$ = <b>${f(Q)}</b>, verglichen mit $K_{"L"} = ${f(Kps)}$: $Q / K_{"L"} = ${f(ratio)}$.` });
    const r = { modo: 'precipita', a, b, Kps, ca0: ca, cb0: cb, Q, ratio, Vt, M, pasos, precipita: Q > Kps * (1 + 1e-12) };
    if (!r.precipita) {
      pasos.push({ t: 'Schlussfolgerung', html: `${Q < Kps ? '$Q < K_{"L"}$: Die Lösung ist nicht gesättigt' : '$Q = K_{"L"}$: gerade gesättigt'}, <b>es fällt nichts aus</b>, und alles bleibt gelöst.` });
    } else {
      pasos.push({ t: 'Schlussfolgerung', html: `$Q > K_{"L"}$: Die Lösung ist übersättigt, und Salz <b>fällt aus</b>, bis das Ionenprodukt wieder $K_{"L"}$ beträgt.` });
      const ea = ca / a, eb = cb / b; // moles de sal que cabrían por litro con cada ion
      const limA = ea <= eb, e = limA ? eb - ea : ea - eb;
      const quedaA = (y) => (limA ? y : a * (y / b + e)), quedaB = (y) => (limA ? b * (y / a + e) : y);
      const hi = limA ? ca : cb, y = biseca((v) => quedaA(v) ** a * quedaB(v) ** b - Kps, hi * 1e-80, hi);
      const cA = quedaA(y), cB = quedaB(y), x = (ca - cA) / a, mol = (x * Vt) / 1000;
      pasos.push({ t: 'Was ausfällt', html: `Fallen $x$ mol/L Salz aus, bleiben $[A] = ${f(ca)} − ${a === 1 ? '' : a + ' '}x$ und $[B] = ${f(cb)} − ${b === 1 ? '' : b + ' '}x$. Man setzt $(${f(ca)} − ${a === 1 ? '' : a + ' '}x)${ex(a)} (${f(cb)} − ${b === 1 ? '' : b + ' '}x)${ex(b)} = ${f(Kps)}$ an und löst numerisch: $x = ${f(x)}$ mol/L.` });
      pasos.push({ t: 'In der Lösung bleibt', html: `$[A] = ${f(cA)}$ M und $[B] = ${f(cB)}$ M (${limA ? 'das Kation' : 'das Anion'} ist limitierend und wird fast aufgebraucht).` });
      pasos.push({ t: 'Gebildeter Feststoff', html: `$n = x V = ${f(x)} · ${f(Vt / 1000)}$ L = <b>${f(mol)} mol</b>${M ? `, das sind <b>${f(mol * M)} g</b> Niederschlag` : ''}.` });
      Object.assign(r, { x, mol, masa: M ? mol * M : null, cA, cB, limitante: limA ? 'Kation' : 'Anion', porciento: limA ? (100 * (ca - cA)) / ca : (100 * (cb - cB)) / cb });
    }
    return r;
  }

  function selectiva(sc) {
    const cat = sc.comun === 'cat', S = [1, 2].map((i) => {
      const a = lee(sc, 'a' + i, `die Anzahl der Kationen von Salz ${i}`, { entero: true }), b = lee(sc, 'b' + i, `die Anzahl der Anionen von Salz ${i}`, { entero: true });
      const Kps = lee(sc, 'KL' + i, `das KL von Salz ${i}`), c = lee(sc, 'c' + i, `die Konzentration des Ions von Salz ${i}, das nicht das gemeinsame ist`);
      const p = cat ? a : b, q = cat ? b : a; // exponentes del ion que se añade y del otro
      return { i, a, b, Kps, c, p, q, X: (Kps / c ** q) ** (1 / p) };
    });
    const ion = cat ? 'Kation' : 'Anion', add = cat ? 'A' : 'B', otro = cat ? 'B' : 'A';
    const pasos = [{ t: 'Ansatz', html: `Man gibt nach und nach das ${ion} zu, das beide Salze gemeinsam haben (wir nennen es $${add}$). Ein Salz beginnt auszufallen, wenn $Q = K_{"L"}$ ist, also wenn $[${add}]$ den Wert $[${add}] = (K_{"L"} / [${otro}]^{q})^{1/p}$ erreicht, wobei $p$ der Exponent von $${add}$ im KL und $q$ der des anderen Ions ist.` }];
    for (const s of S) pasos.push({ t: `Salz ${s.i}`, html: `$K_{"L"} = ${f(s.Kps)}$ mit $[${otro}] = ${f(s.c)}$ M: Es beginnt auszufallen bei $[${add}] = (${f(s.Kps)} / ${f(s.c)}${ex(s.q)})^{1/${s.p}}$ = <b>${f(s.X)} M</b>.` });
    const [p, q] = S[0].X <= S[1].X ? [S[0], S[1]] : [S[1], S[0]];
    pasos.push({ t: 'Was zuerst ausfällt', html: `Zuerst fällt <b>Salz ${p.i}</b> aus, weil es weniger ${ion} braucht (${f(p.X)} M gegenüber ${f(q.X)} M).` });
    const resta = (p.Kps / q.X ** p.p) ** (1 / p.q), frac = resta / p.c;
    pasos.push({ t: `Wie viel von Salz ${p.i} übrig ist, wenn ${q.i} beginnt`, html: `Bei $[${add}] = ${f(q.X)}$ M erfüllt das Ion $${otro}$ von Salz ${p.i} $K_{"L"} = ${f(p.Kps)}$, also bleiben $[${otro}] = (${f(p.Kps)} / ${f(q.X)}${ex(p.p)})^{1/${p.q}}$ = <b>${f(resta)} M</b>: <b>${f(100 * frac)} %</b> der ursprünglichen Menge (${f(p.c)} M).` });
    const sep = frac < 1e-3;
    pasos.push({ t: 'Trennung', html: `Vor Beginn der Fällung von ${q.i} sind ${f(100 * (1 - frac), 6)} % von Salz ${p.i} ausgefallen. ${sep ? 'Das gilt als <b>quantitative Trennung</b> (es bleibt weniger als 0,1 %).' : 'Es ist keine quantitative Trennung (dafür müsste weniger als 0,1 % bleiben): Sie fallen teilweise gemeinsam aus.'}` });
    return { modo: 'selectiva', cat, ion, S, primera: p.i, p, q, resta, frac, sep, pasos };
  }

  const lista = (t, nom) => {
    const xs = String(t ?? '').split(';').map((x) => x.trim()).filter(Boolean).map(leeNum);
    if (!xs.length || xs.some((x) => !isFinite(x))) throw new Error(`${nom}: Schreibe durch «;» getrennte Zahlen, z. B. 6,35 ; 10,33`);
    return xs;
  };
  const pHde = (sc) => { const v = leeNum(sc.pH); if (!isFinite(v) || v < 0 || v > 14) throw new Error('Der pH-Wert muss eine Zahl zwischen 0 und 14 sein'); return v; };
  const alfa0 = (pKas, pH) => {
    const h = 10 ** -pH, Ka = pKas.map((p) => 10 ** -p); let suma = 1, prod = 1;
    for (let k = 1; k <= Ka.length; k++) { prod *= Ka[Ka.length - k]; suma += h ** k / prod; }
    return 1 / suma;
  };
  function ph(sc) {
    const a = lee(sc, 'a', 'die Anzahl der Kationen', { entero: true }), b = lee(sc, 'b', 'die Anzahl der Anionen', { entero: true }), Kps = lee(sc, 'KL', 'das KL'), pH = pHde(sc);
    const oh = sc.anion === 'oh', pKas = oh ? [] : lista(sc.pkas, 'Die pKs-Werte der konjugierten Säure des Anions'), M = masaM(sc), pasos = [cabecera(sc, a, b, M)];
    const s0 = solAgua(Kps, a, b);
    const sDe = (pHx) => {
      if (oh) { const OH = 10 ** (pHx - 14); return Math.min(Kps / OH ** b / a, Infinity) / 1; } // [A] = a·s → s = [A]/a con [A]^a [OH]^b = Kps
      return (Kps / (a ** a * b ** b * alfa0(pKas, pHx) ** b)) ** (1 / (a + b));
    };
    let s;
    if (oh) {
      const OH = 10 ** (pH - 14), A = (Kps / OH ** b) ** (1 / a);
      s = A / a;
      pasos.push({ t: 'Hydroxid: Der pH-Wert legt [OH⁻] fest', html: `Das Anion ist OH⁻, also wird es vom pH-Wert von außen festgelegt: $[OH^{−}] = 10^{pH−14} = 10^{${f(pH - 14, 3)}} = ${f(OH)}$ M. Das Gleichgewicht $K_{"L"} = [A]${ex(a)}[OH^{−}]${ex(b)}$ ergibt $[A] = (K_{"L"}/[OH^{−}]${ex(b)})^{1/${a}} = ${f(A)}$ M.` });
      pasos.push({ t: 'Löslichkeit', html: `Die Löslichkeit ist das, was sich vom Feststoff löst: $s = [A]/${a} = ${f(s)}$ mol/L${M ? ` = ${f(s * M)} g/L` : ''}. In reinem Wasser wäre $s_{0} = ${f(s0)}$ mol/L (der pH-Wert dieser Lösung wäre ein anderer: Hier wird der pH-Wert durch einen Puffer gehalten).` });
    } else {
      const al = alfa0(pKas, pH);
      s = sDe(pH);
      pasos.push({ t: 'Das Anion wird protoniert', html: `Das Anion B ist die konjugierte Base einer schwachen Säure mit $pK_a$ = ${pKas.map((x) => f(x, 3)).join('; ')}. Bei pH ${f(pH, 3)} liegt nur ein Anteil $α = ${f(al)}$ des gesamten Anions als freies B vor; der Rest ist protoniert (HB, H₂B…) und zählt im $K_{"L"}$ nicht mit.` });
      pasos.push({ t: 'Löslichkeit', html: `$K_{"L"} = [A]${ex(a)}[B]${ex(b)} = (${a === 1 ? '' : a + ' '}s)${ex(a)}(${b === 1 ? '' : b + ' '}s α)${ex(b)}$ ⇒ $s = (K_{"L"}/(${a ** a * b ** b} α${ex(b)}))^{1/${a + b}} = ${f(s)}$ mol/L${M ? ` = ${f(s * M)} g/L` : ''}. In einem Milieu, in dem das Anion nicht protoniert wird, wäre $s_{0} = ${f(s0)}$ mol/L.` });
    }
    pasos.push({ t: 'Effekt des pH-Werts', html: `Bei pH ${f(pH, 3)} ist das Salz <b>${f(s / s0, 3)}-mal ${s > s0 ? 'besser' : 'schlechter'} löslich</b> als ohne Berücksichtigung der Protonierung des Anions${oh ? ' in reinem Wasser' : ''}. ${oh ? 'Ein saurer pH-Wert (wenig OH⁻) löst das Hydroxid; ein basischer lässt es ausfallen.' : 'Beim Senken des pH-Werts wird das Anion protoniert, das Löslichkeitsgleichgewicht verschiebt sich nach rechts, und das Salz löst sich besser.'}` });
    const r = { modo: 'ph', a, b, Kps, pH, s, s0, factor: s / s0, g: M ? s * M : null, M, oh, pKas, pasos };
    const curva = []; for (let x = 0; x <= 14.0001; x += 0.25) curva.push([x, sDe(x)]);
    r.curva = curva;
    if (oh && String(sc.C ?? '').trim() !== '') {
      const C = lee(sc, 'C', 'die Konzentration des Kations'), pIni = 14 + lg10((Kps / C ** a) ** (1 / b)), Cres = C / 1000, pFin = 14 + lg10((Kps / Cres ** a) ** (1 / b));
      Object.assign(r, { C, pHini: pIni, pHfin: pFin });
      pasos.push({ t: `pH-Wert, bei dem die Fällung beginnt (${f(C)} M Kation)`, html: `Sie beginnt, wenn $Q = K_{"L"}$ ist: $[OH^{−}] = (K_{"L"}/[A]${ex(a)})^{1/${b}} = (${f(Kps)}/${f(C)}${ex(a)})^{1/${b}} = ${f((Kps / C ** a) ** (1 / b))}$ M ⇒ $pOH = ${f(14 - pIni, 4)}$ ⇒ <b>pH = ${f(pIni, 4)}</b>.` });
      pasos.push({ t: 'pH-Wert, bei dem die Fällung quantitativ ist', html: `Wenn 0,1 % des Kations übrig sind ($[A] = ${f(Cres)}$ M): $[OH^{−}] = (K_{"L"}/${f(Cres)}${ex(a)})^{1/${b}}$ ⇒ <b>pH = ${f(pFin, 4)}</b>. Zwischen pH ${f(pIni, 3)} und ${f(pFin, 3)} liegt der Fällungsbereich; bei höherem pH-Wert ist das Hydroxid fast vollständig ausgefallen.` });
    }
    if (oh && ['Al(OH)3', 'Zn(OH)2', 'Pb(OH)2', 'Cr(OH)3'].includes(sc.formula)) pasos.push({ t: 'Hinweis: Amphoterie', html: `Dieses Hydroxid ist amphoter: In stark basischem Milieu löst es sich unter Bildung von Hydroxokomplexen wieder auf (zum Beispiel $Al(OH)_{4}^{−}$). Dieser Modus berücksichtigt sie nicht, daher ist die tatsächliche Löslichkeit bei hohem pH-Wert größer als berechnet; der Komplexmodus behandelt sie mit der Bildungskonstante.` });
    return r;
  }
  const lg10 = Math.log10;

  function complejo(sc) {
    const a = lee(sc, 'a', 'die Anzahl der Kationen', { entero: true }), b = lee(sc, 'b', 'die Anzahl der Anionen', { entero: true }), Kps = lee(sc, 'KL', 'das KL');
    const C0 = lee(sc, 'L0', 'die Anfangskonzentration des Liganden'), logb = lista(sc.logb, 'Die Logarithmen der Bildungskonstanten (log β₁; log β₂…)');
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
    pasos.push({ t: 'Komplexe des Kations', html: `Das Kation A bildet Komplexe mit ${esc2(lig)}: $A + k ${lig} ⇌ A(${lig})_{k}$ mit $β_k$ ($log β$ = ${logb.map((x, k) => `${k + 1}: ${x === null ? '—' : f(x, 3)}`).join('; ')}). Nur ein Anteil des gelösten Kations liegt frei vor: $[A]_{"frei"} = [A]_{"gesamt"}/(1 + Σ β_k [${lig}]^{k})$.` });
    pasos.push({ t: 'Gekoppelte Gleichgewichte', html: `Es gelten zwei Bedingungen: $K_{"L"} = [A]_{"frei"}${ex(a)}[B]${ex(b)}$ mit $[A]_{"gesamt"} = ${a === 1 ? '' : a + ' '}s$ und $[B] = ${b === 1 ? '' : b + ' '}s$, sowie die Ligandenbilanz $[${lig}]_{0} = [${lig}] + [A]_{"gesamt"} · \bar n$, wobei $\bar n$ die mittlere Zahl der Liganden pro Kation ist. Beide werden gemeinsam per Bisektion gelöst.` });
    pasos.push({ t: 'Ergebnis', html: `Bei ${f(C0)} M anfänglichem ${lig} bleibt $[${lig}] = ${f(L)}$ M frei und $\bar n = ${f(nbar)}$. Die Löslichkeit ist <b>$s = ${f(s)}$ mol/L</b>${M ? ` = ${f(s * M)} g/L` : ''}, gegenüber $s_{0} = ${f(s0)}$ mol/L in Wasser: <b>${f(s / s0, 3)}-mal</b> größer. Das freie Kation ist $[A] = ${f(Alibre)}$ M.` });
    const especies = beta.map((b2, k) => ({ k: k + 1, c: a * s * frac(k + 1) })).filter((e) => e.c > 0);
    pasos.push({ t: 'Verteilung des gelösten Kations', html: `Frei: ${f(100 * frac(0), 4)} %${especies.map((e) => `; ${'A(' + lig + ')'}<sub>${e.k}</sub>: ${f(100 * frac(e.k), 4)} %`).join('')}.` });
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
    { clave: 'ag2cro4', nombre: 'KL von Ag₂CrO₄ aus seiner Löslichkeit', sc: { modo: 'kps', formula: 'Ag2CrO4', a: '2', b: '1', s: '6.5e-5', uni: 'mol', M: '' } },
    { clave: 'baso4-g', nombre: 'KL von BaSO₄ mit der Löslichkeit in g/L', sc: { modo: 'kps', formula: 'BaSO4', a: '1', b: '1', s: '2.4e-3', uni: 'g', M: '233.38' } },
    { clave: 'agcl', nombre: 'Löslichkeit von AgCl in Wasser', sc: { modo: 'solub', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', M: '' } },
    { clave: 'caoh2', nombre: 'Löslichkeit von Ca(OH)₂ in Wasser', sc: { modo: 'solub', formula: 'Ca(OH)2', a: '1', b: '2', Kps: '5.5e-6', M: '' } },
    { clave: 'agcl-nacl', nombre: 'AgCl in 0,10 M NaCl (gleichioniger Zusatz)', sc: { modo: 'comun', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', ion: 'an', C: '0.10', M: '' } },
    { clave: 'pbi2-mezcla', nombre: 'Mischung aus Pb²⁺ und I⁻: Fällt PbI₂ aus?', sc: { modo: 'precipita', formula: 'PbI2', a: '1', b: '2', Kps: '9.8e-9', c1: '0.01', V1: '50', c2: '0.01', V2: '50', M: '' } },
    { clave: 'agcl-mezcla', nombre: 'Mischung aus Ag⁺ und Cl⁻: Wie viel AgCl fällt aus?', sc: { modo: 'precipita', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', c1: '0.10', V1: '50', c2: '0.10', V2: '50', M: '143.32' } },
    { clave: 'sin-precipitado', nombre: 'Sehr verdünnte Lösung: keine Fällung', sc: { modo: 'precipita', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', c1: '1e-6', V1: '100', c2: '1e-6', V2: '100', M: '' } },
    { clave: 'mg-oh-ph', nombre: 'Mg(OH)₂ in einem Puffer mit pH 9: Löslichkeit und Fällungs-pH', sc: { modo: 'ph', sal: 'Mg(OH)2', formula: 'Mg(OH)2', a: '1', b: '2', Kps: '1.8e-11', anion: 'oh', pkas: '', pH: '9', C: '0.01', M: '' } },
    { clave: 'caco3-ph', nombre: 'CaCO₃ bei pH 5: löst sich im sauren Milieu', sc: { modo: 'ph', sal: 'CaCO3', formula: 'CaCO3', a: '1', b: '1', Kps: '3.4e-9', anion: 'base', pkas: '6,35 ; 10,33', pH: '5', C: '', M: '' } },
    { clave: 'caf2-ph', nombre: 'CaF₂ bei pH 3: F⁻ wird protoniert', sc: { modo: 'ph', sal: 'CaF2', formula: 'CaF2', a: '1', b: '2', Kps: '3.9e-11', anion: 'base', pkas: '3,17', pH: '3', C: '', M: '' } },
    { clave: 'agcl-nh3', nombre: 'AgCl in 1 M Ammoniak: löst sich durch den Komplex', sc: { modo: 'complejo', sal: 'AgCl', formula: 'AgCl', a: '1', b: '1', Kps: '1.8e-10', lig: 'NH3', logb: '3,32 ; 7,23', L0: '1', M: '' } },
    { clave: 'cuoh2-nh3', nombre: 'Cu(OH)₂ in 2 M Ammoniak', sc: { modo: 'complejo', sal: 'Cu(OH)2', formula: 'Cu(OH)2', a: '1', b: '2', Kps: '2.2e-20', lig: 'NH3', logb: '4,04 ; 7,47 ; 10,27 ; 11,75', L0: '2', M: '' } },
    { clave: 'hidroxidos-separar', nombre: 'Fe³⁺ und Mg²⁺ mit OH⁻ trennen (Hydroxide bei kontrolliertem pH)', sc: { modo: 'selectiva', comun: 'an', a1: '1', b1: '3', Kps1: '4e-38', c1: '0.01', a2: '1', b2: '2', Kps2: '1.8e-11', c2: '0.01' } },
    { clave: 'cl-i-ag', nombre: 'I⁻ und Cl⁻ durch Zugabe von Ag⁺ trennen', sc: { modo: 'selectiva', comun: 'cat', a1: '1', b1: '1', Kps1: '8.5e-17', c1: '0.10', a2: '1', b2: '1', Kps2: '1.8e-10', c2: '0.10' } },
    { clave: 'mohr', nombre: 'Cl⁻ und CrO₄²⁻ mit Ag⁺ (Methode nach Mohr)', sc: { modo: 'selectiva', comun: 'cat', a1: '1', b1: '1', Kps1: '1.8e-10', c1: '0.10', a2: '2', b2: '1', Kps2: '1.1e-12', c2: '1e-3' } },
  ];

  return { resolver, ejemplos, SALES, f };
})();

