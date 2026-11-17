const PH = (() => {
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-2 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', '.').replace('-', '−');
  };
  const f2 = (x) => x.toFixed(2).replace('.', '.').replace('-', '−'); // pH, pOH y pK con dos decimales
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} is missing`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} must be a number`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${Mayus(nom)} must be ${cero ? 'positive or zero' : 'greater than 0'}`);
    return v;
  }
  let KW = 1e-14, PKW = 14;
  const lg = Math.log10;
  const KW_T = [[0, 0.114], [10, 0.293], [20, 0.681], [25, 1.0], [30, 1.47], [40, 2.92], [50, 5.47], [60, 9.61], [70, 15.8], [80, 25.1], [90, 38.0], [100, 56.0]];
  const kwDe = (T) => {
    if (Math.abs(T - 25) < 1e-9) return 1e-14;
    const t = Math.max(0, Math.min(100, T)), i = KW_T.findIndex(([x]) => x >= t), [x1, y1] = KW_T[Math.max(1, i)], [x0, y0] = KW_T[Math.max(1, i) - 1];
    return 1e-14 * 10 ** (lg(y0) + ((lg(y1) - lg(y0)) * (t - x0)) / (x1 - x0));
  };
  const p14 = () => (PKW === 14 ? '14' : f2(PKW));
  function leeK(sc, nom) {
    if (!vacio(sc.K)) return lee(sc, 'K', nom);
    if (!vacio(sc.pK)) { const p = leeNum(sc.pK); if (!isFinite(p)) throw new Error(`p${nom} must be a number`); return 10 ** -p; }
    throw new Error(`${nom} (or p${nom}) is missing`);
  }

  const cargaMedia = (h, Kas) => { let t = 1, num = 0, den = 1; Kas.forEach((K, i) => { t *= K / h; den += t; num += (i + 1) * t; }); return num / den; };
  function exacto(c) {
    const Ka = c.Ka || 1, Kbh = c.Kb ? KW / c.Kb : 1;
    const g = (h) => h + (c.na || 0) + ((c.cb || 0) * h) / (h + Kbh) - KW / h - (c.cl || 0) - ((c.ca || 0) * Ka) / (Ka + h) - (c.cp ? c.cp * cargaMedia(h, c.Kas) : 0);
    let lo = -16, hi = 2; // log10 de [H3O+]
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (g(10 ** m) > 0) hi = m; else lo = m; }
    return -(lo + hi) / 2;
  }

  const D = typeof Datos !== 'undefined' ? Datos : require('../quimica/datos.js');
  const INDICADORES = D.INDICADORES; // 12 indicadores con su intervalo de viraje (quimica/datos.js)
  const CLASICOS = ['methyl orange', 'methyl red', 'bromothymol blue', 'phenolphthalein', 'thymolphthalein']; // los de clase; el resto se muestra entre los que sirven
  const indicador = (pH) => INDICADORES.filter((q) => CLASICOS.includes(q[0])).reduce((a, b) => (Math.abs((b[1] + b[2]) / 2 - pH) < Math.abs((a[1] + a[2]) / 2 - pH) ? b : a));
  const caracter = (pH) => (pH < PKW / 2 - 0.005 ? 'acidic' : pH > PKW / 2 + 0.005 ? 'basic' : 'neutra');
  const finPH = (pH) => `$pH = ${f2(pH)}$: ${caracter(pH)} solution.`;
  const desdeH = (h) => `$pH = −log [H_{3}O^{+}] = −log ${f(h)}$ = <b>${f2(-lg(h))}</b>`;
  const desdeOH = (oh) => `$pOH = −log [OH^{−}] = −log ${f(oh)} = ${f2(-lg(oh))}$, &ensp; $pH = ${p14()} − pOH$ = <b>${f2(PKW + lg(oh))}</b>`;
  const raiz = (K, C) => (-K + Math.sqrt(K * K + 4 * K * C)) / 2;

  function fuerte(sc) {
    const base = sc.especie === 'base', C = lee(sc, 'C', 'the concentration'), n = lee(sc, 'n', base ? 'the number of OH⁻' : 'the number of H⁺', { opcional: true }) ?? 1;
    const c = n * C, ion = base ? 'OH^{−}' : 'H_{3}O^{+}';
    const pasos = [{ t: 'Complete dissociation', html: `Being ${base ? 'a strong base' : 'a strong acid'} it dissociates completely${n > 1 ? ` and each formula unit gives ${f(n)} ${base ? 'OH⁻' : 'H⁺'}` : ''}: $[${ion}] = ${n > 1 ? `${f(n)} · ${f(C)}` : f(C)}$ = ${f(c)} M` }];
    let pH;
    if (c < 1e-6) {
      const x = (c + Math.sqrt(c * c + 4 * KW)) / 2;
      pH = base ? PKW + lg(x) : -lg(x);
      pasos.push({ t: 'Very dilute: water counts', html: `With such a low concentration the water ions are not negligible. With $[${ion}] = c + [${base ? 'H_{3}O^{+}' : 'OH^{−}'}]$ and $K_w = [H_{3}O^{+}][OH^{−}] = ${PKW === 14 ? '10^{−14}' : f(KW)}$ we get $x^2 − c x − K_w = 0$, $x = ${f(x)}$ M` });
      pasos.push({ t: 'pH', html: base ? desdeOH(x) : desdeH(x) });
    } else {
      pH = base ? PKW + lg(c) : -lg(c);
      pasos.push({ t: 'pH', html: base ? desdeOH(c) : desdeH(c) });
    }
    pasos.push({ t: 'Equilibrium concentrations', html: `$[H_{3}O^{+}] = ${f(10 ** -pH)}$ M, &ensp; $[OH^{−}] = ${f(10 ** (pH - PKW))}$ M. ${finPH(pH)}` });
    return { modo: 'fuerte', base, C, n, pH, h: 10 ** -pH, pasos };
  }

  function debil(sc) {
    const base = sc.especie === 'base', C = lee(sc, 'C', 'the concentration'), K = leeK(sc, base ? 'Kb' : 'Ka');
    const x = raiz(K, C), aprox = Math.sqrt(K * C), alfa = x / C;
    const Kn = base ? 'K_b' : 'K_a';
    const pasos = [
      { t: 'Equilibrium', html: base ? `$B + H_{2}O ⇌ BH^{+} + OH^{−}$<br>initial: ${f(C)}, 0, 0 &ensp; equilibrium: ${f(C)} − x, x, x` : `$HA + H_{2}O ⇌ A^{−} + H_{3}O^{+}$<br>initial: ${f(C)}, 0, 0 &ensp; equilibrium: ${f(C)} − x, x, x` },
      { t: 'Constant', html: `$${Kn} = {x^2}/{C − x}$, &ensp; $${f(K)} = {x^2}/{${f(C)} − x}$<br>$x^2 + ${f(K)} x − ${f(K * C)} = 0$, &ensp; $x = {−${Kn} + √(${Kn}^2 + 4 ${Kn} C)}/{2}$ = <b>${f(x)} M</b> = $[${base ? 'OH^{−}' : 'H_{3}O^{+}'}]$` },
      { t: 'pH', html: base ? desdeOH(x) : desdeH(x) },
      { t: 'Degree of dissociation', html: `$α = x/C = ${f(x)}/${f(C)}$ = <b>${f(alfa)}</b> (${f(100 * alfa)} %)` },
      { t: 'With the approximation', html: `Neglecting x compared with C: $x ≈ √(${Kn} C) = √(${f(K)} · ${f(C)}) = ${f(aprox)}$ M, ${alfa < 0.05 ? `which is valid because α < 5 % (error of ${f((100 * (aprox - x)) / x, 2)} %)` : `but here α > 5 % and the approximation gives an error of ${f((100 * (aprox - x)) / x, 2)} %: the quadratic equation has to be solved`}.` },
    ];
    const pH = base ? PKW + lg(x) : -lg(x);
    pasos.push({ t: 'Result', html: finPH(pH) });
    return { modo: 'debil', base, C, K, pK: -lg(K), x, alfa, pH, h: 10 ** -pH, pasos };
  }

  function tampon(sc) {
    const base = sc.especie === 'base', K = leeK(sc, base ? 'Kb' : 'Ka');
    const Cd = lee(sc, 'Cd', base ? 'the concentration of the base' : 'the concentration of the acid'), Cs = lee(sc, 'Cs', 'the concentration of the salt');
    const pKa = base ? PKW + lg(K) : -lg(K); // del ácido del par
    const cAc = base ? Cs : Cd, cBa = base ? Cd : Cs, Ac = base ? 'BH^{+}' : 'HA', Ba = base ? 'B' : 'A^{−}';
    const pH0 = pKa + lg(cBa / cAc);
    const pasos = [{ t: 'Henderson-Hasselbalch equation', html: `${base ? `The pair is $B/BH^{+}$: $pK_a = ${p14()} − pK_b = ${p14()} − ${f2(-lg(K))} = ${f2(pKa)}$.` : `$pK_a = −log ${f(K)} = ${f2(pKa)}$.`}<br>$pH = pK_a + log {[${Ba}]}/{[${Ac}]} = ${f2(pKa)} + log {${f(cBa)}}/{${f(cAc)}}$ = <b>${f2(pH0)}</b>` }];
    let pH = pH0, pHagua = null, nAc = null, nBa = null;
    const anade = sc.anade === 'acido' || sc.anade === 'base' ? sc.anade : 'nada';
    if (anade !== 'nada') {
      const V = lee(sc, 'V', 'the volume of the buffer solution'), Cad = lee(sc, 'Cad', 'the concentration of what is added'), Vad = lee(sc, 'Vad', 'the volume that is added');
      const n = (Cad * Vad) / 1000, nAc0 = (cAc * V) / 1000, nBa0 = (cBa * V) / 1000, Vt = (V + Vad) / 1000;
      nAc = anade === 'acido' ? nAc0 + n : nAc0 - n; nBa = anade === 'acido' ? nBa0 - n : nBa0 + n;
      const ion = anade === 'acido' ? 'H_{3}O^{+}' : 'OH^{−}';
      pasos.push({ t: 'Moles before adding', html: `$n(${Ac}) = ${f(cAc)} · ${f(V / 1000)} = ${f(nAc0)}$ mol, &ensp; $n(${Ba}) = ${f(cBa)} · ${f(V / 1000)} = ${f(nBa0)}$ mol, &ensp; $n(${ion}) = ${f(Cad)} · ${f(Vad / 1000)} = ${f(n)}$ mol` });
      if (nAc <= 0 || nBa <= 0) {
        const sp = base ? { cb: (nAc0 + nBa0) / Vt, Kb: K, cl: nAc0 / Vt } : { ca: (nAc0 + nBa0) / Vt, Ka: K, na: nBa0 / Vt };
        if (anade === 'acido') sp.cl = (sp.cl || 0) + n / Vt; else sp.na = (sp.na || 0) + n / Vt;
        pH = exacto(sp);
        pasos.push({ t: 'The buffer is used up', html: `What is added consumes all of the ${anade === 'acido' ? 'basic form' : 'acidic form'} of the pair and some is left over: the solution stops buffering and the pH changes a lot, to <b>${f2(pH)}</b>.` });
      } else {
        pH = pKa + lg(nBa / nAc);
        pasos.push({ t: anade === 'acido' ? 'The acid reacts with the basic form' : 'The base reacts with the acidic form', html: `${anade === 'acido' ? `$${Ba} + H_{3}O^{+} → ${Ac}$` : `$${Ac} + OH^{−} → ${Ba}$`}: $n(${Ac}) = ${f(nAc)}$ mol and $n(${Ba}) = ${f(nBa)}$ mol remain. The volume is the same for both, so the ratio of moles can be used:<br>$pH = ${f2(pKa)} + log {${f(nBa)}}/{${f(nAc)}}$ = <b>${f2(pH)}</b>` });
      }
      const c = n / Vt;
      pHagua = anade === 'acido' ? -lg((c + Math.sqrt(c * c + 4 * KW)) / 2) : PKW + lg((c + Math.sqrt(c * c + 4 * KW)) / 2);
      pasos.push({ t: 'Compared with pure water', html: `The pH changes by ${f2(Math.abs(pH - pH0))} units. If the same were added to ${f(V)} mL of pure water, the pH would go from ${f2(PKW / 2)} to ${f2(pHagua)}.` });
    }
    pasos.push({ t: 'H₃O⁺ concentration', html: `$[H_{3}O^{+}] = 10^{−pH} = ${f(10 ** -pH)}$ M` });
    const Ka = 10 ** -pKa, Ct = cAc + cBa, betaDe = (pHx) => { const hx = 10 ** -pHx; return Math.LN10 * (hx + KW / hx + (Ct * Ka * hx) / ((Ka + hx) ** 2)); };
    const beta = betaDe(pH0), betaMax = (Math.LN10 / 4) * Ct, curvaBeta = Array.from({ length: 141 }, (_, i) => [i / 10, betaDe(i / 10)]);
    pasos.push({ t: 'Buffer capacity', html: `They buffer well between $pH = pK_a ± 1$, from ${f2(pKa - 1)} to ${f2(pKa + 1)}, and better the more concentrated both forms are.` });
    pasos.push({ t: 'Buffer capacity β', html: `$β = {d C_b}/{d pH} = 2.303 ([H_{3}O^{+}] + [OH^{−}] + {C K_a [H_{3}O^{+}]}/{(K_a + [H_{3}O^{+}])^2})$, with $C = [HA] + [A^{−}] = ${f(Ct)}$ M. At pH = ${f2(pH0)} it is <b>β = ${f(beta)} mol/(L·pH)</b>: ${f(beta)} mol of strong base per liter is needed to raise the pH by one unit. It is maximum at $pH = pK_a$, with $β_{max} = 2.303 C/4 = ${f(betaMax)}$ mol/(L·pH), and falls to half near $pK_a ± 0.76$.` });
    return { modo: 'tampon', base, K, pKa, cAc, cBa, pH0, pH, anade, pHagua, nAc, nBa, Ct, beta, betaMax, curvaBeta, betaDe, h: 10 ** -pH, pasos };
  }

  function mezcla(sc) {
    if (sc.tipo === 'df' || sc.tipo === 'fd') return mezclaDebil(sc);
    const Ca = lee(sc, 'Ca', 'the concentration of the acid'), Va = lee(sc, 'Va', 'the volume of the acid'), Cb = lee(sc, 'Cb', 'the concentration of the base'), Vb = lee(sc, 'Vb', 'the volume of the base');
    const na = (Ca * Va) / 1000, nb = (Cb * Vb) / 1000, Vt = (Va + Vb) / 1000, d = na - nb;
    const pasos = [
      { t: 'Moles of each', html: `$n(H_{3}O^{+}) = ${f(Ca)} · ${f(Va / 1000)} = ${f(na)}$ mol, &ensp; $n(OH^{−}) = ${f(Cb)} · ${f(Vb / 1000)} = ${f(nb)}$ mol` },
      { t: 'Neutralization', html: `$H_{3}O^{+} + OH^{−} → 2 H_{2}O$. ${Math.abs(d) < 1e-12 * Math.max(na, nb) ? 'There are equal moles of both: they neutralize completely.' : `${f(Math.abs(d))} mol of ${d > 0 ? 'H₃O⁺' : 'OH⁻'} are left over in $V = ${f(Va)} + ${f(Vb)} = ${f(Va + Vb)}$ mL.`}` },
    ];
    let pH;
    if (Math.abs(d) < 1e-12 * Math.max(na, nb)) { pH = PKW / 2; pasos.push({ t: 'pH', html: `Only water and a salt that does not hydrolyze remain: <b>pH = ${f2(PKW / 2)}</b>${PKW === 14 ? '' : ', the neutral value at this temperature'}.` }); } else {
      const c = Math.abs(d) / Vt;
      pasos.push({ t: 'Concentration of what is left over', html: `$[${d > 0 ? 'H_{3}O^{+}' : 'OH^{−}'}] = ${f(Math.abs(d))}/${f(Vt)}$ = ${f(c)} M` });
      pH = d > 0 ? -lg(c) : PKW + lg(c);
      pasos.push({ t: 'pH', html: d > 0 ? desdeH(c) : desdeOH(c) });
    }
    pasos.push({ t: 'Result', html: finPH(pH) });
    return { modo: 'mezcla', Ca, Va, Cb, Vb, na, nb, pH, h: 10 ** -pH, pasos };
  }

  const contrasta = (pH, sp, pasos, porque) => {
    const ex = exacto(sp);
    if (Math.abs(ex - pH) <= 0.02) return pH;
    pasos.push({ t: 'Check with the full equilibrium', html: `${porque} Solving the complete charge balance gives <b>pH = ${f2(ex)}</b> (the classroom calculation gave ${f2(pH)}).` });
    return ex;
  };

  function mezclaDebil(sc) {
    const df = sc.tipo === 'df', K = leeK(sc, df ? 'Ka' : 'Kb');
    const Ca = lee(sc, 'Ca', `the concentration of the${df ? ' weak' : ''} acid`), Va = lee(sc, 'Va', 'the volume of the acid'), Cb = lee(sc, 'Cb', `the concentration of the${df ? '' : ' weak'} base`), Vb = lee(sc, 'Vb', 'the volume of the base');
    const na = (Ca * Va) / 1000, nb = (Cb * Vb) / 1000, Vt = (Va + Vb) / 1000;
    const nD = df ? na : nb, nF = df ? nb : na; // moles del débil y del fuerte
    const D = df ? 'HA' : 'B', C = df ? 'A^{−}' : 'BH^{+}', F = df ? 'OH^{−}' : 'H_{3}O^{+}';
    const pKa = df ? -lg(K) : PKW + lg(K);
    const pasos = [
      { t: 'Moles of each', html: `$n(${D}) = ${f(df ? Ca : Cb)} · ${f((df ? Va : Vb) / 1000)} = ${f(nD)}$ mol, &ensp; $n(${F}) = ${f(df ? Cb : Ca)} · ${f((df ? Vb : Va) / 1000)} = ${f(nF)}$ mol` },
      { t: 'Reaction', html: `The strong one reacts completely with the weak one: $${D} + ${F} → ${C}${df ? ' + H_{2}O' : ' + H_{2}O'}$. ${Math.abs(nD - nF) < 1e-12 * nD ? 'There are equal moles: only the salt remains.' : nF < nD ? `${f(nF)} mol of ${df ? 'A⁻' : 'BH⁺'} form and ${f(nD - nF)} mol of ${D} remain.` : `All the ${D} is used up and ${f(nF - nD)} mol of ${df ? 'OH⁻' : 'H₃O⁺'} are left over.`}` },
    ];
    const sp = df ? { ca: na / Vt, Ka: K, na: nb / Vt } : { cb: nb / Vt, Kb: K, cl: na / Vt };
    let pH, caso;
    if (Math.abs(nD - nF) < 1e-12 * nD) {
      caso = 'sal';
      const cs = nD / Vt, Kh = KW / K, x = raiz(Kh, cs);
      pH = df ? PKW + lg(x) : -lg(x);
      pasos.push({ t: 'Hydrolysis of the salt', html: `$[${C}] = ${f(nD)}/${f(Vt)} = ${f(cs)}$ M, which hydrolyzes with $${df ? 'K_b' : 'K_a'} = K_w/${df ? 'K_a' : 'K_b'} = ${f(Kh)}$: $x = ${f(x)}$ M of ${df ? 'OH⁻' : 'H₃O⁺'} and <b>pH = ${f2(pH)}</b>` });
    } else if (nF < nD) {
      caso = 'tampon';
      pH = pKa + lg(df ? nF / (nD - nF) : (nD - nF) / nF);
      pasos.push({ t: 'A buffer solution remains', html: `${df ? '' : `$pK_a = ${p14()} − pK_b = ${f2(pKa)}$. `}$pH = pK_a + log {n(${df ? 'A^{−}' : 'B'})}/{n(${df ? 'HA' : 'BH^{+}'})} = ${f2(pKa)} + log {${f(df ? nF : nD - nF)}}/{${f(df ? nD - nF : nF)}}$ = <b>${f2(pH)}</b>` });
      pH = contrasta(pH, sp, pasos, 'One of the two forms is very scarce and Henderson-Hasselbalch is not valid.');
    } else {
      caso = 'exceso';
      const c = (nF - nD) / Vt;
      pH = df ? PKW + lg(c) : -lg(c);
      pasos.push({ t: 'The leftover strong one rules', html: `$[${F}] = ${f(nF - nD)}/${f(Vt)} = ${f(c)}$ M (the hydrolysis of the salt is negligible compared with it): ${df ? desdeOH(c) : desdeH(c)}` });
      pH = contrasta(pH, sp, pasos, 'So little is left over that the hydrolysis of the salt is no longer negligible.');
    }
    pasos.push({ t: 'Result', html: finPH(pH) });
    return { modo: 'mezcla', tipo: sc.tipo, caso, K, pKa, Ca, Va, Cb, Vb, na, nb, pH, h: 10 ** -pH, pasos };
  }

  function anfotera(sc) {
    const C = lee(sc, 'C', 'the concentration of the salt'), K1 = lee(sc, 'K1', 'Ka₁ (of the acid H₂A)'), K2 = lee(sc, 'K2', 'Ka₂ (of HA⁻)');
    if (K2 >= K1) throw new Error('Ka₁ must be greater than Ka₂');
    const pH0 = (-lg(K1) - lg(K2)) / 2, h = Math.sqrt((K1 * (K2 * C + KW)) / (K1 + C)), pH = -lg(h), pasos = [];
    pasos.push({ t: 'Amphoteric anion', html: `The anion $HA^{−}$ behaves as an acid ($HA^{−} + H_{2}O ⇌ A^{2−} + H_{3}O^{+}$, $K_{a2} = ${f(K2)}$) and as a base ($HA^{−} + H_{2}O ⇌ H_{2}A + OH^{−}$, $K_b = K_w/K_{a1} = ${f(KW / K1)}$). The cation (Na⁺) has no influence.` });
    pasos.push({ t: 'Classroom approximation', html: `The two reactions compensate and the pH does not depend on the concentration: $pH ≈ {pK_{a1} + pK_{a2}}/2 = {${f2(-lg(K1))} + ${f2(-lg(K2))}}/2$ = <b>${f2(pH0)}</b>.` });
    pasos.push({ t: 'Check with the full formula', html: `With the charge balance without approximation, $[H_{3}O^{+}] = \sqrt{K_{a1}(K_{a2}C + K_w)/(K_{a1} + C)} = ${f(h)}$ M ⇒ <b>pH = ${f2(pH)}</b> (the approximation is off by ${f2(Math.abs(pH - pH0))} units).` });
    pasos.push({ t: 'When it is valid', html: Math.abs(pH - pH0) < 0.05 ? 'The approximation is good: $C ≫ K_{a1}$... and $K_{a2}C ≫ K_w$.' : 'Here the approximation starts to fail: the concentration is very low ($C$ is not much greater than $K_{a1}$) or $K_{a2}C$ does not exceed $K_w$. Use the value from the full formula.' });
    return { modo: 'sal', tipo: 'anfotera', C, K1, K2, pH, pH0, h, alfa: null, pasos };
  }
  function sal(sc) {
    if (sc.tipo === 'anfotera') return anfotera(sc);
    const tipo = ['basica', 'acida', 'neutra'].includes(sc.tipo) ? sc.tipo : 'basica', C = lee(sc, 'C', 'the concentration of the salt'), pasos = [];
    if (tipo === 'neutra') {
      pasos.push({ t: 'Salt of a strong acid and a strong base', html: `Its ions (such as Na⁺ and Cl⁻) are conjugates of a strong acid and a strong base: they are so weak that they do not react with water. The solution has the pH of water: <b>pH = ${f2(PKW / 2)}</b>.` });
      return { modo: 'sal', tipo, C, pH: PKW / 2, h: 10 ** (-PKW / 2), pasos };
    }
    const bas = tipo === 'basica', K = leeK(sc, bas ? 'Ka' : 'Kb'), Kh = KW / K, x = raiz(Kh, C), pH = bas ? PKW + lg(x) : -lg(x);
    pasos.push({ t: 'Which ion hydrolyzes', html: bas ? `The anion A⁻ is the conjugate base of a weak acid and reacts with water: $A^{−} + H_{2}O ⇌ HA + OH^{−}$. The cation (Na⁺, K⁺) does not hydrolyze.` : `The cation BH⁺ (such as NH₄⁺) is the conjugate acid of a weak base: $BH^{+} + H_{2}O ⇌ B + H_{3}O^{+}$. The anion (Cl⁻, NO₃⁻) does not hydrolyze.` });
    pasos.push({ t: 'Hydrolysis constant', html: `$${bas ? 'K_b' : 'K_a'} = {K_w}/{${bas ? 'K_a' : 'K_b'}} = {${PKW === 14 ? '10^{−14}' : f(KW)}}/{${f(K)}} = ${f(Kh)}$` });
    pasos.push({ t: 'Equilibrium', html: `$${f(Kh)} = {x^2}/{${f(C)} − x}$ → $x = ${f(x)}$ M = $[${bas ? 'OH^{−}' : 'H_{3}O^{+}'}]$ (degree of hydrolysis ${f((100 * x) / C)} %)` });
    pasos.push({ t: 'pH', html: bas ? desdeOH(x) : desdeH(x) });
    pasos.push({ t: 'Result', html: finPH(pH) });
    return { modo: 'sal', tipo, C, K, Kh, x, alfa: x / C, pH, h: 10 ** -pH, pasos };
  }

  function inverso(sc) {
    const base = sc.especie === 'base', pHm = lee(sc, 'pHm', 'the pH', { cero: true }), ion = base ? 'OH^{−}' : 'H_{3}O^{+}';
    if (pHm > PKW) throw new Error(`The pH must be between 0 and ${p14()}`);
    if (base ? pHm <= PKW / 2 : pHm >= PKW / 2) throw new Error(`With pH ${f2(pHm)} the solution is not ${base ? 'basic' : 'acidic'}`);
    const x = base ? 10 ** (pHm - PKW) : 10 ** -pHm, pasos = [];
    pasos.push({ t: `The concentration of ${base ? 'OH⁻' : 'H₃O⁺'}`, html: base ? `$pOH = ${p14()} − ${f2(pHm)} = ${f2(PKW - pHm)}$, &ensp; $[OH^{−}] = 10^{−pOH} = ${f(x)}$ M` : `$[H_{3}O^{+}] = 10^{−pH} = 10^{−${f2(pHm)}} = ${f(x)}$ M` });
    if (sc.fuerza === 'fuerte') {
      const n = lee(sc, 'n', 'the number of H⁺ or OH⁻', { opcional: true }) ?? 1, C = x / n;
      pasos.push({ t: 'Concentration', html: `It dissociates completely${n > 1 ? ` and gives ${f(n)} ions per formula unit` : ''}: $C = [${ion}]${n > 1 ? `/${f(n)}` : ''}$ = <b>${f(C)} M</b>` });
      return { modo: 'inverso', base, pH: pHm, x, C, h: 10 ** -pHm, pasos };
    }
    const Kn = base ? 'K_b' : 'K_a';
    if (sc.busca === 'C') {
      const K = leeK(sc, base ? 'Kb' : 'Ka'), C = (x * x) / K + x;
      pasos.push({ t: 'Initial concentration', html: `From $${Kn} = {x^2}/{C − x}$: $C = {x^2}/{${Kn}} + x = {(${f(x)})^2}/{${f(K)}} + ${f(x)}$ = <b>${f(C)} M</b>` });
      pasos.push({ t: 'Degree of dissociation', html: `$α = x/C = ${f(x / C)}$ (${f((100 * x) / C)} %)` });
      return { modo: 'inverso', base, pH: pHm, x, C, K, alfa: x / C, h: 10 ** -pHm, pasos };
    }
    const C = lee(sc, 'C', 'the initial concentration');
    if (!(x < C)) throw new Error(`With ${f(C)} M there cannot be ${f(x)} M of ${base ? 'OH⁻' : 'H₃O⁺'}: either it is strong or a value is wrong`);
    const K = (x * x) / (C - x);
    pasos.push({ t: 'Equilibrium', html: base ? `$B + H_{2}O ⇌ BH^{+} + OH^{−}$: at equilibrium $[BH^{+}] = [OH^{−}] = x$ and $[B] = C − x$` : `$HA + H_{2}O ⇌ A^{−} + H_{3}O^{+}$: at equilibrium $[A^{−}] = [H_{3}O^{+}] = x$ and $[HA] = C − x$` });
    pasos.push({ t: 'Constant', html: `$${Kn} = {x^2}/{C − x} = {(${f(x)})^2}/{${f(C)} − ${f(x)}}$ = <b>${f(K)}</b>, &ensp; $p${Kn} = ${f2(-lg(K))}$` });
    pasos.push({ t: 'Degree of dissociation', html: `$α = x/C = ${f(x)}/${f(C)}$ = <b>${f(x / C)}</b> (${f((100 * x) / C)} %)` });
    return { modo: 'inverso', base, pH: pHm, x, C, K, pK: -lg(K), alfa: x / C, h: 10 ** -pHm, pasos };
  }

  function preparar(sc) {
    const base = sc.especie === 'base', K = leeK(sc, base ? 'Kb' : 'Ka'), pHo = lee(sc, 'pHo', 'the desired pH', { cero: true });
    const Cd = lee(sc, 'Cd', base ? 'the concentration of the base' : 'the concentration of the acid'), V = lee(sc, 'V', 'the volume to prepare');
    const pKa = base ? PKW + lg(K) : -lg(K), r = 10 ** (pHo - pKa); // [forma básica]/[forma ácida]
    const Cs = base ? Cd / r : Cd * r, ns = (Cs * V) / 1000, pasos = [];
    const Ac = base ? 'BH^{+}' : 'HA', Ba = base ? 'B' : 'A^{−}';
    pasos.push({ t: 'Ratio of the two forms', html: `${base ? `$pK_a = ${p14()} − pK_b = ${f2(pKa)}$. ` : `$pK_a = ${f2(pKa)}$. `}From Henderson-Hasselbalch, $log {[${Ba}]}/{[${Ac}]} = pH − pK_a = ${f2(pHo)} − ${f2(pKa)} = ${f2(pHo - pKa)}$ → ${'$'}{[${Ba}]}/{[${Ac}]} = 10^{${f2(pHo - pKa)}}$ = <b>${f(r)}</b>` });
    pasos.push({ t: 'Concentration of the salt', html: `$[${base ? 'BH^{+}' : 'A^{−}'}] = ${base ? `${f(Cd)}/${f(r)}` : `${f(r)} · ${f(Cd)}`}$ = <b>${f(Cs)} M</b>; in ${f(V)} mL that is $n = ${f(Cs)} · ${f(V / 1000)}$ = <b>${f(ns)} mol</b>` });
    let masa = null, M = null;
    if (!vacio(sc.sal) && typeof Formulas !== 'undefined') {
      try { M = Formulas.masaMolar(sc.sal).M; } catch (e) { throw new Error(`La sal: ${e.message}`); }
      masa = ns * M;
      pasos.push({ t: 'Mass of salt', html: `M(${Formulas.leer(sc.sal).html}) = ${f(M, 4)} g/mol → m = ${f(ns)} · ${f(M, 4)}$ = <b>${f(masa)} g</b>`.replace('$ = <b>', ' = <b>') });
    }
    if (Math.abs(pHo - pKa) > 1) pasos.push({ t: 'Warning', html: `The requested pH is more than one unit away from the pK<sub>a</sub> (${f2(pKa)}): one of the two forms is much more abundant and the buffer will work poorly. A pair with a closer pK<sub>a</sub> is advisable.` });
    pasos.push({ t: 'How to prepare it', html: `In a ${f(V)} mL flask: ${base ? 'the base' : 'the acid'} up to ${f(Cd)} M and ${masa !== null ? `${f(masa)} g of the salt` : `${f(ns)} mol of the salt`}, and make up to the mark with water.` });
    return { modo: 'preparar', base, K, pKa, pH: pHo, cociente: r, Cs, ns, masa, M, h: 10 ** -pHo, pasos };
  }

  const fracciones = (Kas, pH) => { const h = 10 ** -pH, t = [1]; Kas.forEach((K, i) => t.push((t[i] * K) / h)); const den = t.reduce((a, b) => a + b, 0); return t.map((v) => v / den); };
  const leeKas = (sc) => {
    const Kas = [lee(sc, 'K1', 'Ka₁'), lee(sc, 'K2', 'Ka₂')], K3 = lee(sc, 'K3', 'Ka₃', { opcional: true });
    if (K3 !== null) Kas.push(K3);
    if (Kas.some((K, i) => i && K >= Kas[i - 1])) throw new Error('The constants must go from largest to smallest: Ka₁ > Ka₂ > Ka₃');
    return Kas;
  };
  function poliprotico(sc) {
    const C = lee(sc, 'C', 'the concentration'), Kas = leeKas(sc), pasos = [];
    const x1 = raiz(Kas[0], C), pH1 = -lg(x1), pH = exacto({ cp: C, Kas });
    const nom = Kas.length === 2 ? ['H_{2}A', 'HA^{−}', 'A^{2−}'] : ['H_{3}A', 'H_{2}A^{−}', 'HA^{2−}', 'A^{3−}'];
    pasos.push({ t: 'First dissociation', html: `$${nom[0]} + H_{2}O ⇌ ${nom[1]} + H_{3}O^{+}$, &ensp; $K_{a1} = ${f(Kas[0])}$. Since the other constants are much smaller, almost all the H₃O⁺ comes from here: $x = {−K_{a1} + √(K_{a1}^2 + 4 K_{a1} C)}/{2} = ${f(x1)}$ M, $pH ≈ ${f2(pH1)}$` });
    pasos.push({ t: 'Second dissociation', html: `$${nom[1]} ⇌ ${nom[2]} + H_{3}O^{+}$. With $[${nom[1]}] ≈ [H_{3}O^{+}]$, we get $[${nom[2]}] ≈ K_{a2} = ${f(Kas[1])}$ M: it contributes very little H₃O⁺${Kas[1] / x1 > 0.05 ? ' (here not so little, because Ka₂ is not so small: that is why the exact pH changes)' : ''}.` });
    const h = 10 ** -pH, t = [1]; Kas.forEach((K, i) => t.push((t[i] * K) / h)); const den = t.reduce((a, b) => a + b, 0);
    const conc = t.map((v) => (C * v) / den);
    pasos.push({ t: 'With the full charge balance', html: `<b>pH = ${f2(pH)}</b>. Concentrations: ${conc.map((c, i) => `$[${nom[i]}] = ${f(c)}$ M`).join(', ')}.` });
    pasos.push({ t: 'Result', html: finPH(pH) });
    return { modo: 'poliprotico', C, Kas, pH, pH1, conc, h, alfa: fracciones(Kas, pH), pasos };
  }

  const TIPOS = { 'af-bf': ['strong acid', 'base fuerte', false, false], 'ad-bf': ['weak acid', 'base fuerte', true, false], 'bf-af': ['base fuerte', 'strong acid', false, true], 'bd-af': ['weak base', 'strong acid', true, true] };
  function valoracionPoli(sc) {
    const C = lee(sc, 'C', 'the concentration of the acid'), V = lee(sc, 'V', 'the volume titrated'), Ct = lee(sc, 'Ct', 'the concentration of the titrant'), Kas = leeKas(sc);
    const np = Kas.length, n0 = (C * V) / 1000, Veq = (C * V) / Ct;
    const ph = (v) => { const Vt = (V + v) / 1000; return exacto({ cp: n0 / Vt, Kas, na: (Ct * v) / 1000 / Vt }); };
    const curva = []; for (let i = 0; i <= 240; i++) { const v = ((np + 1) * Veq * i) / 240; curva.push([v, ph(v)]); }
    const pK = Kas.map((K) => -lg(K)), pasos = [];
    pasos.push({ t: 'Equivalence points', html: `Each proton gives an equivalence: $V_{eq,1} = {C V}/{C_t} = {${f(C)} · ${f(V)}}/{${f(Ct)}}$ = <b>${f(Veq)} mL</b>${Kas.slice(1).map((_, i) => `, $V_{eq,${i + 2}} = ${i + 2} V_{eq,1}$ = <b>${f((i + 2) * Veq)} mL</b>`).join('')}` });
    pasos.push({ t: 'At the midpoint of each stage', html: pK.map((p, i) => `with ${f((i + 0.5) * Veq)} mL, $pH ≈ pK_{a${i + 1}} = ${f2(p)}$ (exact: ${f2(ph((i + 0.5) * Veq))})`).join('; ') + '. The smaller the constant, the worse the approximation works.' });
    const eqs = Kas.slice(0, -1).map((_, i) => (pK[i] + pK[i + 1]) / 2);
    if (eqs.length) pasos.push({ t: 'Intermediate equivalences', html: eqs.map((p, i) => { const e = ph((i + 1) * Veq), ii = indicador(e); return `at equivalence ${i + 1} the amphoteric species remains and $pH ≈ (pK_{a${i + 1}} + pK_{a${i + 2}})/2 = ${f2(p)}$ (exact: ${f2(e)}; indicator: ${ii[0]}, from ${ii[3]} to ${ii[4]} between ${f(ii[1])} and ${f(ii[2])})`; }).join('; ') + '.' });
    const nitidos = pK.slice(0, -1).map((p, i) => pK[i + 1] - p >= 4);
    pasos.push({ t: 'Are the jumps distinguishable?', html: pK.slice(0, -1).map((p, i) => `Between stages ${i + 1} and ${i + 2}, $Δ pK_a = ${f2(pK[i + 1] - p)}$: ${nitidos[i] ? 'the jump is sharp and can be titrated separately' : 'the two constants are too close (a difference of about 4 units is needed) and the jump overlaps with the next one'}`).join('; ') + '.' });
    const pHeq = ph(np * Veq), ind = indicador(pHeq);
    pasos.push({ t: 'Last equivalence', html: `The anion $A^{${np}−}$ remains, which hydrolyzes: <b>pH = ${f2(pHeq)}</b>. Indicator: ${ind[0]}, from ${ind[3]} to ${ind[4]} between ${f(ind[1])} and ${f(ind[2])}.` });
    const v = lee(sc, 'Vt', 'the volume added', { opcional: true, cero: true });
    const pHv = v === null ? null : ph(v);
    if (v !== null) pasos.push({ t: `With ${f(v)} mL added`, html: `With the charge balance: <b>pH = ${f2(pHv)}</b>` });
    return { modo: 'valoracion', tipo: 'ap-bf', poli: true, nomV: 'polyprotic acid', nomT: 'base fuerte', debilV: true, esBase: false, C, V, Ct, Kas, pKa: pK[0], pKs: pK, Veq, Veqs: Kas.map((_, i) => (i + 1) * Veq), pHeq, ind, v, pHv, curva, pH: pHv ?? curva[0][1], ph, pasos };
  }
  function valoracion(sc) {
    if (sc.tipo === 'ap-bf') return valoracionPoli(sc);
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'af-bf', [nomV, nomT, debilV, esBase] = TIPOS[tipo];
    const C = lee(sc, 'C', `the concentration of the ${nomV.split(' ')[0]}`), V = lee(sc, 'V', 'the volume titrated'), Ct = lee(sc, 'Ct', 'the concentration of the titrant');
    const K = debilV ? leeK(sc, esBase ? 'Kb' : 'Ka') : null;
    const n0 = (C * V) / 1000, Veq = (C * V) / Ct;
    const ph = (v) => {
      const Vt = (V + v) / 1000, cv = n0 / Vt, ct = (Ct * v) / 1000 / Vt;
      if (tipo === 'af-bf') return exacto({ cl: cv, na: ct });
      if (tipo === 'ad-bf') return exacto({ ca: cv, Ka: K, na: ct });
      if (tipo === 'bf-af') return exacto({ na: cv, cl: ct });
      return exacto({ cb: cv, Kb: K, cl: ct });
    };
    const curva = [];
    for (let i = 0; i <= 240; i++) { const v = (2 * Veq * i) / 240; curva.push([v, ph(v)]); }
    const pasos = [{ t: 'Equivalence point', html: `When the moles of titrant equal those of the ${nomV}: $C V = C_t V_{eq}$, $V_{eq} = {C V}/{C_t} = {${f(C)} · ${f(V)}}/{${f(Ct)}}$ = <b>${f(Veq)} mL</b>` }];
    const pKa = debilV ? (esBase ? PKW + lg(K) : -lg(K)) : null;
    let pHeq;
    if (!debilV) {
      pHeq = PKW / 2;
      pasos.push({ t: 'pH at the equivalence point', html: `A salt of a strong acid and a strong base forms, which does not hydrolyze: <b>pH = ${f2(pHeq)}</b>.` });
    } else {
      const cs = n0 / ((V + Veq) / 1000), Kh = KW / K, x = raiz(Kh, cs);
      pHeq = esBase ? -lg(x) : PKW + lg(x);
      pasos.push({ t: 'pH at the equivalence point', html: `All the ${nomV} has been converted into its ${esBase ? 'conjugate acid, $BH^{+}$' : 'conjugate base, $A^{−}$'}, with $c = ${f(n0)}/${f((V + Veq) / 1000)} = ${f(cs)}$ M, which hydrolyzes with $${esBase ? 'K_a' : 'K_b'} = K_w/${esBase ? 'K_b' : 'K_a'} = ${f(Kh)}$: $x = ${f(x)}$ M of ${esBase ? 'H₃O⁺' : 'OH⁻'}, and <b>pH = ${f2(pHeq)}</b>, ${esBase ? 'acidic' : 'basic'}.` });
    }
    const ind = indicador(pHeq);
    const salto = [ph(Veq * 0.999), ph(Veq * 1.001)].sort((x, y) => x - y), adecuados = INDICADORES.filter((q) => Math.min(q[2], salto[1]) - Math.max(q[1], salto[0]) >= 0.5 * (q[2] - q[1]));
    pasos.push({ t: 'Indicator', html: `One that changes near pH ${f2(pHeq)} is needed: ${ind[0]}, which goes from ${ind[3]} to ${ind[4]} between ${f(ind[1])} and ${f(ind[2])}.` });
    pasos.push({ t: 'Which indicators work?', html: `The pH jump from 99.9 % to 100.1 % of the titrant goes from ${f2(salto[0])} to ${f2(salto[1])}. Indicators that change within that jump work: ${adecuados.length ? adecuados.map((q) => `${q[0]} (${f(q[1])}–${f(q[2])})`).join(', ') : 'none from the list (the jump is too narrow for a visual indicator: a pH meter is advisable)'}.` });
    if (debilV) pasos.push({ t: 'At the midpoint of the titration', html: `With $V = V_{eq}/2 = ${f(Veq / 2)}$ mL there are equal amounts of the acidic and basic forms: it is a buffer solution with <b>pH = pK<sub>a</sub> = ${f2(pKa)}</b>${esBase ? ' (of the conjugate acid)' : ''}. This is how the constant of an acid or base is measured.` });
    const v = lee(sc, 'Vt', 'the volume added', { opcional: true, cero: true });
    let pHv = null;
    if (v !== null) {
      const Vtot = (V + v) / 1000, nt = (Ct * v) / 1000, d = n0 - nt, ionV = esBase ? 'OH^{−}' : 'H_{3}O^{+}', ionT = esBase ? 'H_{3}O^{+}' : 'OH^{−}';
      let html;
      if (v === 0) {
        if (debilV) { const x = raiz(K, C); pHv = esBase ? PKW + lg(x) : -lg(x); html = `Before adding anything it is ${esBase ? 'a weak base' : 'a weak acid'}: $x = ${f(x)}$ M and <b>pH = ${f2(pHv)}</b>`; } else { pHv = esBase ? PKW + lg(C) : -lg(C); html = `Before adding anything: $[${ionV}] = ${f(C)}$ M and <b>pH = ${f2(pHv)}</b>`; }
      } else if (Math.abs(d) < 1e-9 * n0) {
        pHv = pHeq; html = `It is the equivalence point: <b>pH = ${f2(pHeq)}</b>`;
      } else if (d > 0) {
        if (debilV) {
          pHv = pKa + (esBase ? -1 : 1) * lg(nt / d);
          const hh = pHv, ex = ph(v);
          html = `${f(nt)} mol have reacted and ${f(d)} mol of ${nomV} remain: it is a buffer solution, $pH = pK_a + log {${esBase ? `n(B)`: `n(A^{−})`}}/{${esBase ? `n(BH^{+})` : `n(HA)`}} = ${f2(pKa)} + log {${f(esBase ? d : nt)}}/{${f(esBase ? nt : d)}}$`;
          if (Math.abs(hh - ex) > 0.02) {
            pHv = ex;
            html += ` = ${f2(hh)}. But here one of the two forms is so scarce that the ${esBase ? 'protonation of the base' : 'dissociation of the acid'} (or the hydrolysis of its conjugate) changes it a lot, and Henderson-Hasselbalch is no longer valid. Solving the full equilibrium with the charge balance gives <b>pH = ${f2(pHv)}</b>`;
          } else html += ` = <b>${f2(pHv)}</b>`;
        } else {
          const c = d / Vtot; pHv = esBase ? PKW + lg(c) : -lg(c);
          html = `$${f(n0)} − ${f(nt)} = ${f(d)}$ mol of ${esBase ? 'OH⁻' : 'H₃O⁺'} remain in ${f(V + v)} mL: $[${ionV}] = ${f(c)}$ M and <b>pH = ${f2(pHv)}</b>`;
        }
      } else {
        const c = -d / Vtot; pHv = esBase ? -lg(c) : PKW + lg(c);
        html = `The equivalence has been passed: $${f(nt)} − ${f(n0)} = ${f(-d)}$ mol of ${esBase ? 'H₃O⁺' : 'OH⁻'} are left over in ${f(V + v)} mL, $[${ionT}] = ${f(c)}$ M and <b>pH = ${f2(pHv)}</b>`;
      }
      pasos.push({ t: `With ${f(v)} mL added`, html });
    }
    return { modo: 'valoracion', tipo, nomV, nomT, debilV, esBase, C, V, Ct, K, pKa, Veq, pHeq, ind, adecuados, salto, v, pHv, curva, pH: pHv ?? curva[0][1], ph, pasos };
  }

  function resolver(sc) {
    const T = vacio(sc.T) ? 25 : leeNum(sc.T);
    if (!isFinite(T) || T < 0 || T > 100) throw new Error('The temperature must be between 0 and 100 °C');
    KW = kwDe(T); PKW = KW === 1e-14 ? 14 : -lg(KW);
    const r = elige(sc);
    if (PKW !== 14) r.pasos.unshift({ t: `Water at ${f(T)} °C`, html: `$K_w = ${f(KW)}$, &ensp; $pK_w = ${f2(PKW)}$: the neutral solution has pH = ${f2(PKW / 2)} and pH + pOH = ${f2(PKW)}.` });
    return { ...r, pKw: PKW, Kw: KW, T };
  }
  function elige(sc) {
    if (sc.modo === 'sal') return sal(sc);
    if (sc.modo === 'inverso') return inverso(sc);
    if (sc.modo === 'preparar') return preparar(sc);
    if (sc.modo === 'poliprotico') return poliprotico(sc);
    if (sc.modo === 'debil') return debil(sc);
    if (sc.modo === 'tampon') return tampon(sc);
    if (sc.modo === 'mezcla') return mezcla(sc);
    if (sc.modo === 'valoracion') return valoracion(sc);
    return fuerte(sc);
  }

  const ejemplos = [
    { clave: 'hcl', nombre: 'HCl 0,01 M', sc: { modo: 'fuerte', especie: 'acido', C: '0.01', n: '1' } },
    { clave: 'baoh2', nombre: 'Ba(OH)₂ 0,005 M', sc: { modo: 'fuerte', especie: 'base', C: '0.005', n: '2' } },
    { clave: 'diluido', nombre: '10⁻⁸ M HCl (basic pH?)', sc: { modo: 'fuerte', especie: 'acido', C: '1e-8', n: '1' } },
    { clave: 'acetico', nombre: '0.1 M acetic acid', sc: { modo: 'debil', especie: 'acido', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'amoniaco', nombre: '0.2 M ammonia', sc: { modo: 'debil', especie: 'base', C: '0.2', K: '1.8e-5', pK: '' } },
    { clave: 'hf', nombre: '0.01 M hydrofluoric acid (without approximating)', sc: { modo: 'debil', especie: 'acido', C: '0.01', K: '6.8e-4', pK: '' } },
    { clave: 'tampon-acetato', nombre: 'Acetic acid/acetate buffer', sc: { modo: 'tampon', especie: 'acido', K: '1.8e-5', pK: '', Cd: '0.1', Cs: '0.1', anade: 'nada' } },
    { clave: 'tampon-hcl', nombre: 'Acetate buffer on adding HCl', sc: { modo: 'tampon', especie: 'acido', K: '1.8e-5', pK: '', Cd: '0.1', Cs: '0.1', V: '100', anade: 'acido', Cad: '0.1', Vad: '10' } },
    { clave: 'tampon-amonio', nombre: 'Ammonia/ammonium buffer', sc: { modo: 'tampon', especie: 'base', K: '1.8e-5', pK: '', Cd: '0.15', Cs: '0.1', anade: 'nada' } },
    { clave: 'mezcla', nombre: 'Mixture of HCl and NaOH', sc: { modo: 'mezcla', tipo: 'ff', Ca: '0.1', Va: '50', Cb: '0.2', Vb: '30' } },
    { clave: 'mezcla-debil', nombre: 'Mixture of acetic acid and NaOH', sc: { modo: 'mezcla', tipo: 'df', Ca: '0.2', Va: '50', Cb: '0.1', Vb: '50', K: '1.8e-5', pK: '' } },
    { clave: 'mezcla-amoniaco', nombre: 'Mixture of ammonia and HCl (all salt)', sc: { modo: 'mezcla', tipo: 'fd', Ca: '0.1', Va: '50', Cb: '0.1', Vb: '50', K: '1.8e-5', pK: '' } },
    { clave: 'sal-bicarbonato', nombre: 'Amphoteric salt: 0.1 M NaHCO₃', sc: { modo: 'sal', tipo: 'anfotera', C: '0.1', K1: '4.5e-7', K2: '4.7e-11', K: '', pK: '' } },
    { clave: 'sal-dihidrogenofosfato', nombre: 'Amphoteric salt: 0.05 M NaH₂PO₄', sc: { modo: 'sal', tipo: 'anfotera', C: '0.05', K1: '7.1e-3', K2: '6.3e-8', K: '', pK: '' } },
    { clave: 'sal-acetato', nombre: 'Hydrolysis: 0.1 M sodium acetate', sc: { modo: 'sal', tipo: 'basica', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'sal-amonio', nombre: 'Hydrolysis: 0.1 M ammonium chloride', sc: { modo: 'sal', tipo: 'acida', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'ka-ph', nombre: 'Ka from the pH (0.1 M acid with pH 2.87)', sc: { modo: 'inverso', especie: 'acido', fuerza: 'debil', busca: 'K', pHm: '2.87', C: '0.1' } },
    { clave: 'c-ph', nombre: 'Ammonia concentration for pH 11', sc: { modo: 'inverso', especie: 'base', fuerza: 'debil', busca: 'C', pHm: '11', K: '1.8e-5', pK: '' } },
    { clave: 'preparar-acetato', nombre: 'Prepare an acetate buffer of pH 5', sc: { modo: 'preparar', especie: 'acido', K: '1.8e-5', pK: '', pHo: '5', Cd: '0.1', V: '500', sal: 'CH3COONa' } },
    { clave: 'carbonico', nombre: '0.05 M carbonic acid (diprotic)', sc: { modo: 'poliprotico', C: '0.05', K1: '4.3e-7', K2: '4.8e-11', K3: '' } },
    { clave: 'sulfurico', nombre: '0.01 M sulfuric acid with its Ka₂', sc: { modo: 'poliprotico', C: '0.01', K1: '1e3', K2: '1.2e-2', K3: '' } },
    { clave: 'agua-50', nombre: 'Pure water at 50 °C (neutral at pH 6.6?)', sc: { modo: 'fuerte', especie: 'acido', C: '1e-12', n: '1', T: '50' } },
    { clave: 'val-fuerte', nombre: 'Titration of HCl with NaOH', sc: { modo: 'valoracion', tipo: 'af-bf', C: '0.1', V: '25', Ct: '0.1', Vt: '20' } },
    { clave: 'val-acetico', nombre: 'Titration of acetic acid with NaOH', sc: { modo: 'valoracion', tipo: 'ad-bf', C: '0.1', V: '25', Ct: '0.1', K: '1.8e-5', pK: '', Vt: '12.5' } },
    { clave: 'val-fosforico', nombre: 'Titration of phosphoric acid with NaOH', sc: { modo: 'valoracion', tipo: 'ap-bf', C: '0.1', V: '20', Ct: '0.1', K1: '7.5e-3', K2: '6.2e-8', K3: '4.8e-13', Vt: '' } },
    { clave: 'val-amoniaco', nombre: 'Titration of ammonia with HCl', sc: { modo: 'valoracion', tipo: 'bd-af', C: '0.1', V: '20', Ct: '0.1', K: '1.8e-5', pK: '', Vt: '30' } },
  ];

  return { resolver, fuerte, debil, tampon, mezcla, valoracion, sal, inverso, preparar, poliprotico, fracciones, exacto, kwDe, ejemplos, INDICADORES, f, f2 };
})();

