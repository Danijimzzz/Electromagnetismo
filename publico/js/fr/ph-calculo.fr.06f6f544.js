const PH = (() => {
  const f = (x, d = 3) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    const s = a >= 1e5 || a < 1e-2 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const f2 = (x) => x.toFixed(2).replace('.', ',').replace('-', '−'); // pH, pOH y pK con dos decimales
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const Mayus = (s) => s[0].toUpperCase() + s.slice(1);
  function lee(sc, k, nom, { opcional = false, cero = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} manque`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} doit être un nombre`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${Mayus(nom)} doit être ${cero ? 'positif ou nul' : 'supérieur à 0'}`);
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
    if (!vacio(sc.pK)) { const p = leeNum(sc.pK); if (!isFinite(p)) throw new Error(`Le p${nom} doit être un nombre`); return 10 ** -p; }
    throw new Error(`Il manque ${nom} (ou p${nom})`);
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
  const CLASICOS = ['orange de méthyle', 'rouge de méthyle', 'bleu de bromothymol', 'phénolphtaléine', 'thymolphtaléine']; // los de clase; el resto se muestra entre los que sirven
  const indicador = (pH) => INDICADORES.filter((q) => CLASICOS.includes(q[0])).reduce((a, b) => (Math.abs((b[1] + b[2]) / 2 - pH) < Math.abs((a[1] + a[2]) / 2 - pH) ? b : a));
  const caracter = (pH) => (pH < PKW / 2 - 0.005 ? 'acide' : pH > PKW / 2 + 0.005 ? 'basique' : 'neutra');
  const finPH = (pH) => `$pH = ${f2(pH)}$ : solution ${caracter(pH)}.`;
  const desdeH = (h) => `$pH = −log [H_{3}O^{+}] = −log ${f(h)}$ = <b>${f2(-lg(h))}</b>`;
  const desdeOH = (oh) => `$pOH = −log [OH^{−}] = −log ${f(oh)} = ${f2(-lg(oh))}$, &ensp; $pH = ${p14()} − pOH$ = <b>${f2(PKW + lg(oh))}</b>`;
  const raiz = (K, C) => (-K + Math.sqrt(K * K + 4 * K * C)) / 2;

  function fuerte(sc) {
    const base = sc.especie === 'base', C = lee(sc, 'C', 'la concentration'), n = lee(sc, 'n', base ? 'le nombre de OH⁻' : 'le nombre de H⁺', { opcional: true }) ?? 1;
    const c = n * C, ion = base ? 'OH^{−}' : 'H_{3}O^{+}';
    const pasos = [{ t: 'Dissociation complète', html: `Comme c’est ${base ? 'une base forte' : 'un acide fort'}, il se dissocie totalement${n > 1 ? ` et chaque formule donne ${f(n)} ${base ? 'OH⁻' : 'H⁺'}` : ''} : $[${ion}] = ${n > 1 ? `${f(n)} · ${f(C)}` : f(C)}$ = ${f(c)} M` }];
    let pH;
    if (c < 1e-6) {
      const x = (c + Math.sqrt(c * c + 4 * KW)) / 2;
      pH = base ? PKW + lg(x) : -lg(x);
      pasos.push({ t: 'Très dilué : l’eau compte', html: `Avec si peu de concentration, les ions de l’eau ne sont pas négligeables. Avec $[${ion}] = c + [${base ? 'H_{3}O^{+}' : 'OH^{−}'}]$ et $K_w = [H_{3}O^{+}][OH^{−}] = ${PKW === 14 ? '10^{−14}' : f(KW)}$, il reste $x^2 − c x − K_w = 0$, $x = ${f(x)}$ M` });
      pasos.push({ t: 'pH', html: base ? desdeOH(x) : desdeH(x) });
    } else {
      pH = base ? PKW + lg(c) : -lg(c);
      pasos.push({ t: 'pH', html: base ? desdeOH(c) : desdeH(c) });
    }
    pasos.push({ t: 'Concentrations à l’équilibre', html: `$[H_{3}O^{+}] = ${f(10 ** -pH)}$ M, &ensp; $[OH^{−}] = ${f(10 ** (pH - PKW))}$ M. ${finPH(pH)}` });
    return { modo: 'fuerte', base, C, n, pH, h: 10 ** -pH, pasos };
  }

  function debil(sc) {
    const base = sc.especie === 'base', C = lee(sc, 'C', 'la concentration'), K = leeK(sc, base ? 'Kb' : 'Ka');
    const x = raiz(K, C), aprox = Math.sqrt(K * C), alfa = x / C;
    const Kn = base ? 'K_b' : 'K_a';
    const pasos = [
      { t: 'Équilibre', html: base ? `$B + H_{2}O ⇌ BH^{+} + OH^{−}$<br>initial : ${f(C)}, 0, 0 &ensp; équilibre : ${f(C)} − x, x, x` : `$HA + H_{2}O ⇌ A^{−} + H_{3}O^{+}$<br>initial : ${f(C)}, 0, 0 &ensp; équilibre : ${f(C)} − x, x, x` },
      { t: 'Constante', html: `$${Kn} = {x^2}/{C − x}$, &ensp; $${f(K)} = {x^2}/{${f(C)} − x}$<br>$x^2 + ${f(K)} x − ${f(K * C)} = 0$, &ensp; $x = {−${Kn} + √(${Kn}^2 + 4 ${Kn} C)}/{2}$ = <b>${f(x)} M</b> = $[${base ? 'OH^{−}' : 'H_{3}O^{+}'}]$` },
      { t: 'pH', html: base ? desdeOH(x) : desdeH(x) },
      { t: 'Degré de dissociation', html: `$α = x/C = ${f(x)}/${f(C)}$ = <b>${f(alfa)}</b> (${f(100 * alfa)} %)` },
      { t: 'Avec l’approximation', html: `Si l’on néglige x devant C : $x ≈ √(${Kn} C) = √(${f(K)} · ${f(C)}) = ${f(aprox)}$ M, ${alfa < 0.05 ? `ce qui est valable car α < 5 % (erreur de ${f((100 * (aprox - x)) / x, 2)} %)` : `mais ici α > 5 % et l’approximation donne une erreur de ${f((100 * (aprox - x)) / x, 2)} % : il faut résoudre l’équation du second degré`}.` },
    ];
    const pH = base ? PKW + lg(x) : -lg(x);
    pasos.push({ t: 'Résultat', html: finPH(pH) });
    return { modo: 'debil', base, C, K, pK: -lg(K), x, alfa, pH, h: 10 ** -pH, pasos };
  }

  function tampon(sc) {
    const base = sc.especie === 'base', K = leeK(sc, base ? 'Kb' : 'Ka');
    const Cd = lee(sc, 'Cd', base ? 'la concentration de la base' : 'la concentration de l’acide'), Cs = lee(sc, 'Cs', 'la concentration du sel');
    const pKa = base ? PKW + lg(K) : -lg(K); // del ácido del par
    const cAc = base ? Cs : Cd, cBa = base ? Cd : Cs, Ac = base ? 'BH^{+}' : 'HA', Ba = base ? 'B' : 'A^{−}';
    const pH0 = pKa + lg(cBa / cAc);
    const pasos = [{ t: 'Équation de Henderson-Hasselbalch', html: `${base ? `Le couple est $B/BH^{+}$ : $pK_a = ${p14()} − pK_b = ${p14()} − ${f2(-lg(K))} = ${f2(pKa)}$.` : `$pK_a = −log ${f(K)} = ${f2(pKa)}$.`}<br>$pH = pK_a + log {[${Ba}]}/{[${Ac}]} = ${f2(pKa)} + log {${f(cBa)}}/{${f(cAc)}}$ = <b>${f2(pH0)}</b>` }];
    let pH = pH0, pHagua = null, nAc = null, nBa = null;
    const anade = sc.anade === 'acido' || sc.anade === 'base' ? sc.anade : 'nada';
    if (anade !== 'nada') {
      const V = lee(sc, 'V', 'le volume de la solution tampon'), Cad = lee(sc, 'Cad', 'la concentration de ce qu’on ajoute'), Vad = lee(sc, 'Vad', 'le volume qu’on ajoute');
      const n = (Cad * Vad) / 1000, nAc0 = (cAc * V) / 1000, nBa0 = (cBa * V) / 1000, Vt = (V + Vad) / 1000;
      nAc = anade === 'acido' ? nAc0 + n : nAc0 - n; nBa = anade === 'acido' ? nBa0 - n : nBa0 + n;
      const ion = anade === 'acido' ? 'H_{3}O^{+}' : 'OH^{−}';
      pasos.push({ t: 'Moles avant d’ajouter', html: `$n(${Ac}) = ${f(cAc)} · ${f(V / 1000)} = ${f(nAc0)}$ mol, &ensp; $n(${Ba}) = ${f(cBa)} · ${f(V / 1000)} = ${f(nBa0)}$ mol, &ensp; $n(${ion}) = ${f(Cad)} · ${f(Vad / 1000)} = ${f(n)}$ mol` });
      if (nAc <= 0 || nBa <= 0) {
        const sp = base ? { cb: (nAc0 + nBa0) / Vt, Kb: K, cl: nAc0 / Vt } : { ca: (nAc0 + nBa0) / Vt, Ka: K, na: nBa0 / Vt };
        if (anade === 'acido') sp.cl = (sp.cl || 0) + n / Vt; else sp.na = (sp.na || 0) + n / Vt;
        pH = exacto(sp);
        pasos.push({ t: 'Le tampon s’épuise', html: `Ce qu’on ajoute consomme toute la ${anade === 'acido' ? 'forme basique' : 'forme acide'} du couple et il en reste : la solution ne tamponne plus et le pH change beaucoup, jusqu’à <b>${f2(pH)}</b>.` });
      } else {
        pH = pKa + lg(nBa / nAc);
        pasos.push({ t: anade === 'acido' ? 'L’acide réagit avec la forme basique' : 'La base réagit avec la forme acide', html: `${anade === 'acido' ? `$${Ba} + H_{3}O^{+} → ${Ac}$` : `$${Ac} + OH^{−} → ${Ba}$`} : il reste $n(${Ac}) = ${f(nAc)}$ mol et $n(${Ba}) = ${f(nBa)}$ mol. Le volume est le même pour les deux, on peut donc utiliser le rapport des moles :<br>$pH = ${f2(pKa)} + log {${f(nBa)}}/{${f(nAc)}}$ = <b>${f2(pH)}</b>` });
      }
      const c = n / Vt;
      pHagua = anade === 'acido' ? -lg((c + Math.sqrt(c * c + 4 * KW)) / 2) : PKW + lg((c + Math.sqrt(c * c + 4 * KW)) / 2);
      pasos.push({ t: 'Comparé à l’eau pure', html: `Le pH change de ${f2(Math.abs(pH - pH0))} unités. Si l’on versait la même chose dans ${f(V)} mL d’eau pure, le pH passerait de ${f2(PKW / 2)} à ${f2(pHagua)}.` });
    }
    pasos.push({ t: 'Concentration de H₃O⁺', html: `$[H_{3}O^{+}] = 10^{−pH} = ${f(10 ** -pH)}$ M` });
    const Ka = 10 ** -pKa, Ct = cAc + cBa, betaDe = (pHx) => { const hx = 10 ** -pHx; return Math.LN10 * (hx + KW / hx + (Ct * Ka * hx) / ((Ka + hx) ** 2)); };
    const beta = betaDe(pH0), betaMax = (Math.LN10 / 4) * Ct, curvaBeta = Array.from({ length: 141 }, (_, i) => [i / 10, betaDe(i / 10)]);
    pasos.push({ t: 'Pouvoir tampon', html: `Ils tamponnent bien entre $pH = pK_a ± 1$, de ${f2(pKa - 1)} à ${f2(pKa + 1)}, et mieux quand les deux formes sont plus concentrées.` });
    pasos.push({ t: 'Capacité tampon β', html: `$β = {d C_b}/{d pH} = 2,303 ([H_{3}O^{+}] + [OH^{−}] + {C K_a [H_{3}O^{+}]}/{(K_a + [H_{3}O^{+}])^2})$, avec $C = [HA] + [A^{−}] = ${f(Ct)}$ M. À pH = ${f2(pH0)}, elle vaut <b>β = ${f(beta)} mol/(L·pH)</b> : il faut ${f(beta)} mol de base forte par litre pour monter le pH d’une unité. Elle est maximale en $pH = pK_a$, avec $β_{max} = 2,303 C/4 = ${f(betaMax)}$ mol/(L·pH), et tombe à la moitié vers $pK_a ± 0,76$.` });
    return { modo: 'tampon', base, K, pKa, cAc, cBa, pH0, pH, anade, pHagua, nAc, nBa, Ct, beta, betaMax, curvaBeta, betaDe, h: 10 ** -pH, pasos };
  }

  function mezcla(sc) {
    if (sc.tipo === 'df' || sc.tipo === 'fd') return mezclaDebil(sc);
    const Ca = lee(sc, 'Ca', 'la concentration de l’acide'), Va = lee(sc, 'Va', 'le volume de l’acide'), Cb = lee(sc, 'Cb', 'la concentration de la base'), Vb = lee(sc, 'Vb', 'le volume de la base');
    const na = (Ca * Va) / 1000, nb = (Cb * Vb) / 1000, Vt = (Va + Vb) / 1000, d = na - nb;
    const pasos = [
      { t: 'Moles de chacun', html: `$n(H_{3}O^{+}) = ${f(Ca)} · ${f(Va / 1000)} = ${f(na)}$ mol, &ensp; $n(OH^{−}) = ${f(Cb)} · ${f(Vb / 1000)} = ${f(nb)}$ mol` },
      { t: 'Neutralisation', html: `$H_{3}O^{+} + OH^{−} → 2 H_{2}O$. ${Math.abs(d) < 1e-12 * Math.max(na, nb) ? 'Il y a les mêmes moles des deux : ils se neutralisent totalement.' : `Il reste ${f(Math.abs(d))} mol de ${d > 0 ? 'H₃O⁺' : 'OH⁻'} dans $V = ${f(Va)} + ${f(Vb)} = ${f(Va + Vb)}$ mL.`}` },
    ];
    let pH;
    if (Math.abs(d) < 1e-12 * Math.max(na, nb)) { pH = PKW / 2; pasos.push({ t: 'pH', html: `Il ne reste que de l’eau et un sel qui ne s’hydrolyse pas : <b>pH = ${f2(PKW / 2)}</b>${PKW === 14 ? '' : ', le neutre à cette température'}.` }); } else {
      const c = Math.abs(d) / Vt;
      pasos.push({ t: 'Concentration de ce qui reste', html: `$[${d > 0 ? 'H_{3}O^{+}' : 'OH^{−}'}] = ${f(Math.abs(d))}/${f(Vt)}$ = ${f(c)} M` });
      pH = d > 0 ? -lg(c) : PKW + lg(c);
      pasos.push({ t: 'pH', html: d > 0 ? desdeH(c) : desdeOH(c) });
    }
    pasos.push({ t: 'Résultat', html: finPH(pH) });
    return { modo: 'mezcla', Ca, Va, Cb, Vb, na, nb, pH, h: 10 ** -pH, pasos };
  }

  const contrasta = (pH, sp, pasos, porque) => {
    const ex = exacto(sp);
    if (Math.abs(ex - pH) <= 0.02) return pH;
    pasos.push({ t: 'Vérification avec l’équilibre complet', html: `${porque} En résolvant le bilan de charges complet, on obtient <b>pH = ${f2(ex)}</b> (le calcul du cours donnait ${f2(pH)}).` });
    return ex;
  };

  function mezclaDebil(sc) {
    const df = sc.tipo === 'df', K = leeK(sc, df ? 'Ka' : 'Kb');
    const Ca = lee(sc, 'Ca', `la concentration de l’acide${df ? ' faible' : ''}`), Va = lee(sc, 'Va', 'le volume de l’acide'), Cb = lee(sc, 'Cb', `la concentration de la base${df ? '' : ' faible'}`), Vb = lee(sc, 'Vb', 'le volume de la base');
    const na = (Ca * Va) / 1000, nb = (Cb * Vb) / 1000, Vt = (Va + Vb) / 1000;
    const nD = df ? na : nb, nF = df ? nb : na; // moles del débil y del fuerte
    const D = df ? 'HA' : 'B', C = df ? 'A^{−}' : 'BH^{+}', F = df ? 'OH^{−}' : 'H_{3}O^{+}';
    const pKa = df ? -lg(K) : PKW + lg(K);
    const pasos = [
      { t: 'Moles de chacun', html: `$n(${D}) = ${f(df ? Ca : Cb)} · ${f((df ? Va : Vb) / 1000)} = ${f(nD)}$ mol, &ensp; $n(${F}) = ${f(df ? Cb : Ca)} · ${f((df ? Vb : Va) / 1000)} = ${f(nF)}$ mol` },
      { t: 'Réaction', html: `Le fort réagit entièrement avec le faible : $${D} + ${F} → ${C}${df ? ' + H_{2}O' : ' + H_{2}O'}$. ${Math.abs(nD - nF) < 1e-12 * nD ? 'Il y a les mêmes moles : il ne reste que le sel.' : nF < nD ? `Il se forme ${f(nF)} mol de ${df ? 'A⁻' : 'BH⁺'} et il reste ${f(nD - nF)} mol de ${D}.` : `Tout le ${D} est consommé et il reste ${f(nF - nD)} mol de ${df ? 'OH⁻' : 'H₃O⁺'}.`}` },
    ];
    const sp = df ? { ca: na / Vt, Ka: K, na: nb / Vt } : { cb: nb / Vt, Kb: K, cl: na / Vt };
    let pH, caso;
    if (Math.abs(nD - nF) < 1e-12 * nD) {
      caso = 'sal';
      const cs = nD / Vt, Kh = KW / K, x = raiz(Kh, cs);
      pH = df ? PKW + lg(x) : -lg(x);
      pasos.push({ t: 'Hydrolyse du sel', html: `$[${C}] = ${f(nD)}/${f(Vt)} = ${f(cs)}$ M, qui s’hydrolyse avec $${df ? 'K_b' : 'K_a'} = K_w/${df ? 'K_a' : 'K_b'} = ${f(Kh)}$ : $x = ${f(x)}$ M de ${df ? 'OH⁻' : 'H₃O⁺'} et <b>pH = ${f2(pH)}</b>` });
    } else if (nF < nD) {
      caso = 'tampon';
      pH = pKa + lg(df ? nF / (nD - nF) : (nD - nF) / nF);
      pasos.push({ t: 'Il reste une solution tampon', html: `${df ? '' : `$pK_a = ${p14()} − pK_b = ${f2(pKa)}$. `}$pH = pK_a + log {n(${df ? 'A^{−}' : 'B'})}/{n(${df ? 'HA' : 'BH^{+}'})} = ${f2(pKa)} + log {${f(df ? nF : nD - nF)}}/{${f(df ? nD - nF : nF)}}$ = <b>${f2(pH)}</b>` });
      pH = contrasta(pH, sp, pasos, 'Une des deux formes est très rare et Henderson-Hasselbalch ne vaut pas.');
    } else {
      caso = 'exceso';
      const c = (nF - nD) / Vt;
      pH = df ? PKW + lg(c) : -lg(c);
      pasos.push({ t: 'Le fort qui reste domine', html: `$[${F}] = ${f(nF - nD)}/${f(Vt)} = ${f(c)}$ M (l’hydrolyse du sel est négligeable devant lui) : ${df ? desdeOH(c) : desdeH(c)}` });
      pH = contrasta(pH, sp, pasos, 'Il en reste si peu que l’hydrolyse du sel n’est plus négligeable.');
    }
    pasos.push({ t: 'Résultat', html: finPH(pH) });
    return { modo: 'mezcla', tipo: sc.tipo, caso, K, pKa, Ca, Va, Cb, Vb, na, nb, pH, h: 10 ** -pH, pasos };
  }

  function anfotera(sc) {
    const C = lee(sc, 'C', 'la concentration du sel'), K1 = lee(sc, 'K1', 'Ka₁ (de l’acide H₂A)'), K2 = lee(sc, 'K2', 'Ka₂ (de HA⁻)');
    if (K2 >= K1) throw new Error('Ka₁ doit être supérieure à Ka₂');
    const pH0 = (-lg(K1) - lg(K2)) / 2, h = Math.sqrt((K1 * (K2 * C + KW)) / (K1 + C)), pH = -lg(h), pasos = [];
    pasos.push({ t: 'Anion amphotère', html: `L’anion $HA^{−}$ se comporte comme un acide ($HA^{−} + H_{2}O ⇌ A^{2−} + H_{3}O^{+}$, $K_{a2} = ${f(K2)}$) et comme une base ($HA^{−} + H_{2}O ⇌ H_{2}A + OH^{−}$, $K_b = K_w/K_{a1} = ${f(KW / K1)}$). Le cation (Na⁺) n’influe pas.` });
    pasos.push({ t: 'Approximation du cours', html: `Les deux réactions se compensent et le pH ne dépend pas de la concentration : $pH ≈ {pK_{a1} + pK_{a2}}/2 = {${f2(-lg(K1))} + ${f2(-lg(K2))}}/2$ = <b>${f2(pH0)}</b>.` });
    pasos.push({ t: 'Vérification avec la formule complète', html: `Avec le bilan de charges sans approximation, $[H_{3}O^{+}] = \sqrt{K_{a1}(K_{a2}C + K_w)/(K_{a1} + C)} = ${f(h)}$ M ⇒ <b>pH = ${f2(pH)}</b> (l’approximation s’écarte de ${f2(Math.abs(pH - pH0))} unités).` });
    pasos.push({ t: 'Quand elle est valable', html: Math.abs(pH - pH0) < 0.05 ? 'L’approximation est bonne : $C ≫ K_{a1}$... et $K_{a2}C ≫ K_w$.' : 'Ici l’approximation commence à échouer : la concentration est très basse ($C$ n’est pas très supérieur à $K_{a1}$) ou $K_{a2}C$ ne dépasse pas $K_w$. Utilisez la valeur de la formule complète.' });
    return { modo: 'sal', tipo: 'anfotera', C, K1, K2, pH, pH0, h, alfa: null, pasos };
  }
  function sal(sc) {
    if (sc.tipo === 'anfotera') return anfotera(sc);
    const tipo = ['basica', 'acida', 'neutra'].includes(sc.tipo) ? sc.tipo : 'basica', C = lee(sc, 'C', 'la concentration du sel'), pasos = [];
    if (tipo === 'neutra') {
      pasos.push({ t: 'Sel d’acide fort et de base forte', html: `Ses ions (comme Na⁺ et Cl⁻) sont les conjugués d’un acide et d’une base forts : ils sont si faibles qu’ils ne réagissent pas avec l’eau. La solution a le pH de l’eau : <b>pH = ${f2(PKW / 2)}</b>.` });
      return { modo: 'sal', tipo, C, pH: PKW / 2, h: 10 ** (-PKW / 2), pasos };
    }
    const bas = tipo === 'basica', K = leeK(sc, bas ? 'Ka' : 'Kb'), Kh = KW / K, x = raiz(Kh, C), pH = bas ? PKW + lg(x) : -lg(x);
    pasos.push({ t: 'Quel ion s’hydrolyse', html: bas ? `L’anion A⁻ est la base conjuguée d’un acide faible et réagit avec l’eau : $A^{−} + H_{2}O ⇌ HA + OH^{−}$. Le cation (Na⁺, K⁺) ne s’hydrolyse pas.` : `Le cation BH⁺ (comme NH₄⁺) est l’acide conjugué d’une base faible : $BH^{+} + H_{2}O ⇌ B + H_{3}O^{+}$. L’anion (Cl⁻, NO₃⁻) ne s’hydrolyse pas.` });
    pasos.push({ t: 'Constante d’hydrolyse', html: `$${bas ? 'K_b' : 'K_a'} = {K_w}/{${bas ? 'K_a' : 'K_b'}} = {${PKW === 14 ? '10^{−14}' : f(KW)}}/{${f(K)}} = ${f(Kh)}$` });
    pasos.push({ t: 'Équilibre', html: `$${f(Kh)} = {x^2}/{${f(C)} − x}$ → $x = ${f(x)}$ M = $[${bas ? 'OH^{−}' : 'H_{3}O^{+}'}]$ (degré d’hydrolyse ${f((100 * x) / C)} %)` });
    pasos.push({ t: 'pH', html: bas ? desdeOH(x) : desdeH(x) });
    pasos.push({ t: 'Résultat', html: finPH(pH) });
    return { modo: 'sal', tipo, C, K, Kh, x, alfa: x / C, pH, h: 10 ** -pH, pasos };
  }

  function inverso(sc) {
    const base = sc.especie === 'base', pHm = lee(sc, 'pHm', 'le pH', { cero: true }), ion = base ? 'OH^{−}' : 'H_{3}O^{+}';
    if (pHm > PKW) throw new Error(`Le pH doit être compris entre 0 et ${p14()}`);
    if (base ? pHm <= PKW / 2 : pHm >= PKW / 2) throw new Error(`Avec un pH de ${f2(pHm)}, la solution n’est pas ${base ? 'basique' : 'acide'}`);
    const x = base ? 10 ** (pHm - PKW) : 10 ** -pHm, pasos = [];
    pasos.push({ t: `La concentration de ${base ? 'OH⁻' : 'H₃O⁺'}`, html: base ? `$pOH = ${p14()} − ${f2(pHm)} = ${f2(PKW - pHm)}$, &ensp; $[OH^{−}] = 10^{−pOH} = ${f(x)}$ M` : `$[H_{3}O^{+}] = 10^{−pH} = 10^{−${f2(pHm)}} = ${f(x)}$ M` });
    if (sc.fuerza === 'fuerte') {
      const n = lee(sc, 'n', 'le nombre de H⁺ ou OH⁻', { opcional: true }) ?? 1, C = x / n;
      pasos.push({ t: 'Concentration', html: `Il se dissocie totalement${n > 1 ? ` et donne ${f(n)} ions par formule` : ''} : $C = [${ion}]${n > 1 ? `/${f(n)}` : ''}$ = <b>${f(C)} M</b>` });
      return { modo: 'inverso', base, pH: pHm, x, C, h: 10 ** -pHm, pasos };
    }
    const Kn = base ? 'K_b' : 'K_a';
    if (sc.busca === 'C') {
      const K = leeK(sc, base ? 'Kb' : 'Ka'), C = (x * x) / K + x;
      pasos.push({ t: 'Concentration initiale', html: `De $${Kn} = {x^2}/{C − x}$ : $C = {x^2}/{${Kn}} + x = {(${f(x)})^2}/{${f(K)}} + ${f(x)}$ = <b>${f(C)} M</b>` });
      pasos.push({ t: 'Degré de dissociation', html: `$α = x/C = ${f(x / C)}$ (${f((100 * x) / C)} %)` });
      return { modo: 'inverso', base, pH: pHm, x, C, K, alfa: x / C, h: 10 ** -pHm, pasos };
    }
    const C = lee(sc, 'C', 'la concentration initiale');
    if (!(x < C)) throw new Error(`Avec ${f(C)} M, il ne peut pas y avoir ${f(x)} M de ${base ? 'OH⁻' : 'H₃O⁺'} : soit il est fort, soit une donnée est fausse`);
    const K = (x * x) / (C - x);
    pasos.push({ t: 'Équilibre', html: base ? `$B + H_{2}O ⇌ BH^{+} + OH^{−}$ : à l’équilibre, $[BH^{+}] = [OH^{−}] = x$ et $[B] = C − x$` : `$HA + H_{2}O ⇌ A^{−} + H_{3}O^{+}$ : à l’équilibre, $[A^{−}] = [H_{3}O^{+}] = x$ et $[HA] = C − x$` });
    pasos.push({ t: 'Constante', html: `$${Kn} = {x^2}/{C − x} = {(${f(x)})^2}/{${f(C)} − ${f(x)}}$ = <b>${f(K)}</b>, &ensp; $p${Kn} = ${f2(-lg(K))}$` });
    pasos.push({ t: 'Degré de dissociation', html: `$α = x/C = ${f(x)}/${f(C)}$ = <b>${f(x / C)}</b> (${f((100 * x) / C)} %)` });
    return { modo: 'inverso', base, pH: pHm, x, C, K, pK: -lg(K), alfa: x / C, h: 10 ** -pHm, pasos };
  }

  function preparar(sc) {
    const base = sc.especie === 'base', K = leeK(sc, base ? 'Kb' : 'Ka'), pHo = lee(sc, 'pHo', 'le pH voulu', { cero: true });
    const Cd = lee(sc, 'Cd', base ? 'la concentration de la base' : 'la concentration de l’acide'), V = lee(sc, 'V', 'le volume préparé');
    const pKa = base ? PKW + lg(K) : -lg(K), r = 10 ** (pHo - pKa); // [forma básica]/[forma ácida]
    const Cs = base ? Cd / r : Cd * r, ns = (Cs * V) / 1000, pasos = [];
    const Ac = base ? 'BH^{+}' : 'HA', Ba = base ? 'B' : 'A^{−}';
    pasos.push({ t: 'Rapport des deux formes', html: `${base ? `$pK_a = ${p14()} − pK_b = ${f2(pKa)}$. ` : `$pK_a = ${f2(pKa)}$. `}D’après Henderson-Hasselbalch, $log {[${Ba}]}/{[${Ac}]} = pH − pK_a = ${f2(pHo)} − ${f2(pKa)} = ${f2(pHo - pKa)}$ → ${'$'}{[${Ba}]}/{[${Ac}]} = 10^{${f2(pHo - pKa)}}$ = <b>${f(r)}</b>` });
    pasos.push({ t: 'Concentration du sel', html: `$[${base ? 'BH^{+}' : 'A^{−}'}] = ${base ? `${f(Cd)}/${f(r)}` : `${f(r)} · ${f(Cd)}`}$ = <b>${f(Cs)} M</b> ; dans ${f(V)} mL, c’est $n = ${f(Cs)} · ${f(V / 1000)}$ = <b>${f(ns)} mol</b>` });
    let masa = null, M = null;
    if (!vacio(sc.sal) && typeof Formulas !== 'undefined') {
      try { M = Formulas.masaMolar(sc.sal).M; } catch (e) { throw new Error(`La sal: ${e.message}`); }
      masa = ns * M;
      pasos.push({ t: 'Masse de sel', html: `M(${Formulas.leer(sc.sal).html}) = ${f(M, 4)} g/mol → m = ${f(ns)} · ${f(M, 4)}$ = <b>${f(masa)} g</b>`.replace('$ = <b>', ' = <b>') });
    }
    if (Math.abs(pHo - pKa) > 1) pasos.push({ t: 'Avertissement', html: `Le pH demandé est à plus d’une unité du pK<sub>a</sub> (${f2(pKa)}) : une des deux formes est bien plus abondante et le tampon amortira mal. Il vaut mieux un couple de pK<sub>a</sub> plus proche.` });
    pasos.push({ t: 'Comment le préparer', html: `Dans une fiole de ${f(V)} mL : ${base ? 'la base' : 'l’acide'} jusqu’à ${f(Cd)} M et ${masa !== null ? `${f(masa)} g de sel` : `${f(ns)} mol de sel`}, et on complète avec de l’eau jusqu’au trait de jauge.` });
    return { modo: 'preparar', base, K, pKa, pH: pHo, cociente: r, Cs, ns, masa, M, h: 10 ** -pHo, pasos };
  }

  const fracciones = (Kas, pH) => { const h = 10 ** -pH, t = [1]; Kas.forEach((K, i) => t.push((t[i] * K) / h)); const den = t.reduce((a, b) => a + b, 0); return t.map((v) => v / den); };
  const leeKas = (sc) => {
    const Kas = [lee(sc, 'K1', 'Ka₁'), lee(sc, 'K2', 'Ka₂')], K3 = lee(sc, 'K3', 'Ka₃', { opcional: true });
    if (K3 !== null) Kas.push(K3);
    if (Kas.some((K, i) => i && K >= Kas[i - 1])) throw new Error('Les constantes doivent aller de la plus grande à la plus petite : Ka₁ > Ka₂ > Ka₃');
    return Kas;
  };
  function poliprotico(sc) {
    const C = lee(sc, 'C', 'la concentration'), Kas = leeKas(sc), pasos = [];
    const x1 = raiz(Kas[0], C), pH1 = -lg(x1), pH = exacto({ cp: C, Kas });
    const nom = Kas.length === 2 ? ['H_{2}A', 'HA^{−}', 'A^{2−}'] : ['H_{3}A', 'H_{2}A^{−}', 'HA^{2−}', 'A^{3−}'];
    pasos.push({ t: 'Première dissociation', html: `$${nom[0]} + H_{2}O ⇌ ${nom[1]} + H_{3}O^{+}$, &ensp; $K_{a1} = ${f(Kas[0])}$. Comme les autres constantes sont bien plus petites, presque tout le H₃O⁺ vient d’ici : $x = {−K_{a1} + √(K_{a1}^2 + 4 K_{a1} C)}/{2} = ${f(x1)}$ M, $pH ≈ ${f2(pH1)}$` });
    pasos.push({ t: 'Deuxième dissociation', html: `$${nom[1]} ⇌ ${nom[2]} + H_{3}O^{+}$. Avec $[${nom[1]}] ≈ [H_{3}O^{+}]$, il reste $[${nom[2]}] ≈ K_{a2} = ${f(Kas[1])}$ M : elle apporte très peu de H₃O⁺${Kas[1] / x1 > 0.05 ? ' (ici pas si peu, car Ka₂ n’est pas si petite : c’est pourquoi le pH exact change)' : ''}.` });
    const h = 10 ** -pH, t = [1]; Kas.forEach((K, i) => t.push((t[i] * K) / h)); const den = t.reduce((a, b) => a + b, 0);
    const conc = t.map((v) => (C * v) / den);
    pasos.push({ t: 'Avec le bilan de charges complet', html: `<b>pH = ${f2(pH)}</b>. Concentrations : ${conc.map((c, i) => `$[${nom[i]}] = ${f(c)}$ M`).join(', ')}.` });
    pasos.push({ t: 'Résultat', html: finPH(pH) });
    return { modo: 'poliprotico', C, Kas, pH, pH1, conc, h, alfa: fracciones(Kas, pH), pasos };
  }

  const TIPOS = { 'af-bf': ['acide fort', 'base fuerte', false, false], 'ad-bf': ['acide faible', 'base fuerte', true, false], 'bf-af': ['base fuerte', 'acide fort', false, true], 'bd-af': ['base faible', 'acide fort', true, true] };
  function valoracionPoli(sc) {
    const C = lee(sc, 'C', 'la concentration de l’acide'), V = lee(sc, 'V', 'le volume dosé'), Ct = lee(sc, 'Ct', 'la concentration du réactif titrant'), Kas = leeKas(sc);
    const np = Kas.length, n0 = (C * V) / 1000, Veq = (C * V) / Ct;
    const ph = (v) => { const Vt = (V + v) / 1000; return exacto({ cp: n0 / Vt, Kas, na: (Ct * v) / 1000 / Vt }); };
    const curva = []; for (let i = 0; i <= 240; i++) { const v = ((np + 1) * Veq * i) / 240; curva.push([v, ph(v)]); }
    const pK = Kas.map((K) => -lg(K)), pasos = [];
    pasos.push({ t: 'Points d’équivalence', html: `Chaque proton donne une équivalence : $V_{eq,1} = {C V}/{C_t} = {${f(C)} · ${f(V)}}/{${f(Ct)}}$ = <b>${f(Veq)} mL</b>${Kas.slice(1).map((_, i) => `, $V_{eq,${i + 2}} = ${i + 2} V_{eq,1}$ = <b>${f((i + 2) * Veq)} mL</b>`).join('')}` });
    pasos.push({ t: 'À la moitié de chaque tronçon', html: pK.map((p, i) => `avec ${f((i + 0.5) * Veq)} mL, $pH ≈ pK_{a${i + 1}} = ${f2(p)}$ (exact : ${f2(ph((i + 0.5) * Veq))})`).join('; ') + '. Plus la constante est petite, moins bien fonctionne l’approximation.' });
    const eqs = Kas.slice(0, -1).map((_, i) => (pK[i] + pK[i + 1]) / 2);
    if (eqs.length) pasos.push({ t: 'Équivalences intermédiaires', html: eqs.map((p, i) => { const e = ph((i + 1) * Veq), ii = indicador(e); return `à la ${i + 1}ᵉ, il reste l’amphotère et $pH ≈ (pK_{a${i + 1}} + pK_{a${i + 2}})/2 = ${f2(p)}$ (exact : ${f2(e)} ; indicateur : ${ii[0]}, de ${ii[3]} à ${ii[4]} entre ${f(ii[1])} et ${f(ii[2])})`; }).join('; ') + '.' });
    const nitidos = pK.slice(0, -1).map((p, i) => pK[i + 1] - p >= 4);
    pasos.push({ t: 'Les sauts se distinguent-ils ?', html: pK.slice(0, -1).map((p, i) => `Entre la ${i + 1}ᵉ et la ${i + 2}ᵉ, $Δ pK_a = ${f2(pK[i + 1] - p)}$ : ${nitidos[i] ? 'le saut est net et on peut doser séparément' : 'les deux constantes sont trop proches (il faut une différence d’environ 4 unités) et le saut se chevauche avec le suivant'}`).join('; ') + '.' });
    const pHeq = ph(np * Veq), ind = indicador(pHeq);
    pasos.push({ t: 'Dernière équivalence', html: `Il reste l’anion $A^{${np}−}$, qui s’hydrolyse : <b>pH = ${f2(pHeq)}</b>. Indicateur : ${ind[0]}, de ${ind[3]} à ${ind[4]} entre ${f(ind[1])} et ${f(ind[2])}.` });
    const v = lee(sc, 'Vt', 'le volume ajouté', { opcional: true, cero: true });
    const pHv = v === null ? null : ph(v);
    if (v !== null) pasos.push({ t: `Avec ${f(v)} mL ajoutés`, html: `Avec le bilan de charges : <b>pH = ${f2(pHv)}</b>` });
    return { modo: 'valoracion', tipo: 'ap-bf', poli: true, nomV: 'acide polyprotique', nomT: 'base fuerte', debilV: true, esBase: false, C, V, Ct, Kas, pKa: pK[0], pKs: pK, Veq, Veqs: Kas.map((_, i) => (i + 1) * Veq), pHeq, ind, v, pHv, curva, pH: pHv ?? curva[0][1], ph, pasos };
  }
  function valoracion(sc) {
    if (sc.tipo === 'ap-bf') return valoracionPoli(sc);
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'af-bf', [nomV, nomT, debilV, esBase] = TIPOS[tipo];
    const C = lee(sc, 'C', `la concentration du ${nomV.split(' ')[0]}`), V = lee(sc, 'V', 'le volume dosé'), Ct = lee(sc, 'Ct', 'la concentration du réactif titrant');
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
    const pasos = [{ t: 'Point d’équivalence', html: `Quand les moles de réactif titrant égalent celles du ${nomV} : $C V = C_t V_{eq}$, $V_{eq} = {C V}/{C_t} = {${f(C)} · ${f(V)}}/{${f(Ct)}}$ = <b>${f(Veq)} mL</b>` }];
    const pKa = debilV ? (esBase ? PKW + lg(K) : -lg(K)) : null;
    let pHeq;
    if (!debilV) {
      pHeq = PKW / 2;
      pasos.push({ t: 'pH à l’équivalence', html: `Il se forme un sel d’acide fort et de base forte, qui ne s’hydrolyse pas : <b>pH = ${f2(pHeq)}</b>.` });
    } else {
      const cs = n0 / ((V + Veq) / 1000), Kh = KW / K, x = raiz(Kh, cs);
      pHeq = esBase ? -lg(x) : PKW + lg(x);
      pasos.push({ t: 'pH à l’équivalence', html: `Tout le ${nomV} s’est transformé en son ${esBase ? 'acide conjugué, $BH^{+}$' : 'base conjuguée, $A^{−}$'}, avec $c = ${f(n0)}/${f((V + Veq) / 1000)} = ${f(cs)}$ M, qui s’hydrolyse avec $${esBase ? 'K_a' : 'K_b'} = K_w/${esBase ? 'K_b' : 'K_a'} = ${f(Kh)}$ : $x = ${f(x)}$ M de ${esBase ? 'H₃O⁺' : 'OH⁻'}, et <b>pH = ${f2(pHeq)}</b>, ${esBase ? 'acide' : 'basique'}.` });
    }
    const ind = indicador(pHeq);
    const salto = [ph(Veq * 0.999), ph(Veq * 1.001)].sort((x, y) => x - y), adecuados = INDICADORES.filter((q) => Math.min(q[2], salto[1]) - Math.max(q[1], salto[0]) >= 0.5 * (q[2] - q[1]));
    pasos.push({ t: 'Indicateur', html: `Il en faut un qui vire près de pH ${f2(pHeq)} : ${ind[0]}, qui passe de ${ind[3]} à ${ind[4]} entre ${f(ind[1])} et ${f(ind[2])}.` });
    pasos.push({ t: 'Quels indicateurs conviennent ?', html: `Le saut de pH en passant de 99,9 % à 100,1 % du réactif titrant va de ${f2(salto[0])} à ${f2(salto[1])}. Conviennent les indicateurs qui virent dans ce saut : ${adecuados.length ? adecuados.map((q) => `${q[0]} (${f(q[1])}–${f(q[2])})`).join(', ') : 'aucun de la liste (le saut est trop étroit pour un indicateur visuel : il vaut mieux un pH-mètre)'}.` });
    if (debilV) pasos.push({ t: 'À la moitié du dosage', html: `Avec $V = V_{eq}/2 = ${f(Veq / 2)}$ mL, il y a la même quantité de la forme acide et de la forme basique : c’est une solution tampon avec <b>pH = pK<sub>a</sub> = ${f2(pKa)}</b>${esBase ? ' (de l’acide conjugué)' : ''}. C’est ainsi qu’on mesure la constante d’un acide ou d’une base.` });
    const v = lee(sc, 'Vt', 'le volume ajouté', { opcional: true, cero: true });
    let pHv = null;
    if (v !== null) {
      const Vtot = (V + v) / 1000, nt = (Ct * v) / 1000, d = n0 - nt, ionV = esBase ? 'OH^{−}' : 'H_{3}O^{+}', ionT = esBase ? 'H_{3}O^{+}' : 'OH^{−}';
      let html;
      if (v === 0) {
        if (debilV) { const x = raiz(K, C); pHv = esBase ? PKW + lg(x) : -lg(x); html = `Avant d’ajouter quoi que ce soit, c’est ${esBase ? 'une base faible' : 'un acide faible'} : $x = ${f(x)}$ M et <b>pH = ${f2(pHv)}</b>`; } else { pHv = esBase ? PKW + lg(C) : -lg(C); html = `Avant d’ajouter quoi que ce soit : $[${ionV}] = ${f(C)}$ M et <b>pH = ${f2(pHv)}</b>`; }
      } else if (Math.abs(d) < 1e-9 * n0) {
        pHv = pHeq; html = `C’est le point d’équivalence : <b>pH = ${f2(pHeq)}</b>`;
      } else if (d > 0) {
        if (debilV) {
          pHv = pKa + (esBase ? -1 : 1) * lg(nt / d);
          const hh = pHv, ex = ph(v);
          html = `Il a réagi ${f(nt)} mol et il reste ${f(d)} mol de ${nomV} : c’est une solution tampon, $pH = pK_a + log {${esBase ? `n(B)`: `n(A^{−})`}}/{${esBase ? `n(BH^{+})` : `n(HA)`}} = ${f2(pKa)} + log {${f(esBase ? d : nt)}}/{${f(esBase ? nt : d)}}$`;
          if (Math.abs(hh - ex) > 0.02) {
            pHv = ex;
            html += ` = ${f2(hh)}. Mais ici une des deux formes est si rare que la ${esBase ? 'protonation de la base' : 'dissociation de l’acide'} (ou l’hydrolyse de son conjugué) la modifie beaucoup, et Henderson-Hasselbalch ne vaut plus. En résolvant l’équilibre complet avec le bilan de charges, on obtient <b>pH = ${f2(pHv)}</b>`;
          } else html += ` = <b>${f2(pHv)}</b>`;
        } else {
          const c = d / Vtot; pHv = esBase ? PKW + lg(c) : -lg(c);
          html = `Il reste $${f(n0)} − ${f(nt)} = ${f(d)}$ mol de ${esBase ? 'OH⁻' : 'H₃O⁺'} dans ${f(V + v)} mL : $[${ionV}] = ${f(c)}$ M et <b>pH = ${f2(pHv)}</b>`;
        }
      } else {
        const c = -d / Vtot; pHv = esBase ? -lg(c) : PKW + lg(c);
        html = `On a déjà dépassé l’équivalence : il reste en excès $${f(nt)} − ${f(n0)} = ${f(-d)}$ mol de ${esBase ? 'H₃O⁺' : 'OH⁻'} dans ${f(V + v)} mL, $[${ionT}] = ${f(c)}$ M et <b>pH = ${f2(pHv)}</b>`;
      }
      pasos.push({ t: `Avec ${f(v)} mL ajoutés`, html });
    }
    return { modo: 'valoracion', tipo, nomV, nomT, debilV, esBase, C, V, Ct, K, pKa, Veq, pHeq, ind, adecuados, salto, v, pHv, curva, pH: pHv ?? curva[0][1], ph, pasos };
  }

  function resolver(sc) {
    const T = vacio(sc.T) ? 25 : leeNum(sc.T);
    if (!isFinite(T) || T < 0 || T > 100) throw new Error('La température doit être comprise entre 0 et 100 °C');
    KW = kwDe(T); PKW = KW === 1e-14 ? 14 : -lg(KW);
    const r = elige(sc);
    if (PKW !== 14) r.pasos.unshift({ t: `Eau à ${f(T)} °C`, html: `$K_w = ${f(KW)}$, &ensp; $pK_w = ${f2(PKW)}$ : la solution neutre a un pH = ${f2(PKW / 2)} et pH + pOH = ${f2(PKW)}.` });
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
    { clave: 'diluido', nombre: 'HCl 10⁻⁸ M (pH basique ?)', sc: { modo: 'fuerte', especie: 'acido', C: '1e-8', n: '1' } },
    { clave: 'acetico', nombre: 'Acide acétique 0,1 M', sc: { modo: 'debil', especie: 'acido', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'amoniaco', nombre: 'Ammoniac 0,2 M', sc: { modo: 'debil', especie: 'base', C: '0.2', K: '1.8e-5', pK: '' } },
    { clave: 'hf', nombre: 'Acide fluorhydrique 0,01 M (sans approximation)', sc: { modo: 'debil', especie: 'acido', C: '0.01', K: '6.8e-4', pK: '' } },
    { clave: 'tampon-acetato', nombre: 'Tampon acétique/acétate', sc: { modo: 'tampon', especie: 'acido', K: '1.8e-5', pK: '', Cd: '0.1', Cs: '0.1', anade: 'nada' } },
    { clave: 'tampon-hcl', nombre: 'Tampon acétate en ajoutant du HCl', sc: { modo: 'tampon', especie: 'acido', K: '1.8e-5', pK: '', Cd: '0.1', Cs: '0.1', V: '100', anade: 'acido', Cad: '0.1', Vad: '10' } },
    { clave: 'tampon-amonio', nombre: 'Tampon ammoniac/ammonium', sc: { modo: 'tampon', especie: 'base', K: '1.8e-5', pK: '', Cd: '0.15', Cs: '0.1', anade: 'nada' } },
    { clave: 'mezcla', nombre: 'Mélange de HCl et de NaOH', sc: { modo: 'mezcla', tipo: 'ff', Ca: '0.1', Va: '50', Cb: '0.2', Vb: '30' } },
    { clave: 'mezcla-debil', nombre: 'Mélange d’acide acétique et de NaOH', sc: { modo: 'mezcla', tipo: 'df', Ca: '0.2', Va: '50', Cb: '0.1', Vb: '50', K: '1.8e-5', pK: '' } },
    { clave: 'mezcla-amoniaco', nombre: 'Mélange d’ammoniac et de HCl (tout en sel)', sc: { modo: 'mezcla', tipo: 'fd', Ca: '0.1', Va: '50', Cb: '0.1', Vb: '50', K: '1.8e-5', pK: '' } },
    { clave: 'sal-bicarbonato', nombre: 'Sel amphotère : NaHCO₃ 0,1 M', sc: { modo: 'sal', tipo: 'anfotera', C: '0.1', K1: '4.5e-7', K2: '4.7e-11', K: '', pK: '' } },
    { clave: 'sal-dihidrogenofosfato', nombre: 'Sel amphotère : NaH₂PO₄ 0,05 M', sc: { modo: 'sal', tipo: 'anfotera', C: '0.05', K1: '7.1e-3', K2: '6.3e-8', K: '', pK: '' } },
    { clave: 'sal-acetato', nombre: 'Hydrolyse : acétate de sodium 0,1 M', sc: { modo: 'sal', tipo: 'basica', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'sal-amonio', nombre: 'Hydrolyse : chlorure d’ammonium 0,1 M', sc: { modo: 'sal', tipo: 'acida', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'ka-ph', nombre: 'Ka à partir du pH (acide 0,1 M de pH 2,87)', sc: { modo: 'inverso', especie: 'acido', fuerza: 'debil', busca: 'K', pHm: '2.87', C: '0.1' } },
    { clave: 'c-ph', nombre: 'Concentration d’ammoniac pour pH 11', sc: { modo: 'inverso', especie: 'base', fuerza: 'debil', busca: 'C', pHm: '11', K: '1.8e-5', pK: '' } },
    { clave: 'preparar-acetato', nombre: 'Préparer un tampon acétate de pH 5', sc: { modo: 'preparar', especie: 'acido', K: '1.8e-5', pK: '', pHo: '5', Cd: '0.1', V: '500', sal: 'CH3COONa' } },
    { clave: 'carbonico', nombre: 'Acide carbonique 0,05 M (diprotique)', sc: { modo: 'poliprotico', C: '0.05', K1: '4.3e-7', K2: '4.8e-11', K3: '' } },
    { clave: 'sulfurico', nombre: 'Acide sulfurique 0,01 M avec son Ka₂', sc: { modo: 'poliprotico', C: '0.01', K1: '1e3', K2: '1.2e-2', K3: '' } },
    { clave: 'agua-50', nombre: 'Eau pure à 50 °C (neutre avec un pH de 6,6 ?)', sc: { modo: 'fuerte', especie: 'acido', C: '1e-12', n: '1', T: '50' } },
    { clave: 'val-fuerte', nombre: 'Dosage de HCl par NaOH', sc: { modo: 'valoracion', tipo: 'af-bf', C: '0.1', V: '25', Ct: '0.1', Vt: '20' } },
    { clave: 'val-acetico', nombre: 'Dosage de l’acide acétique par NaOH', sc: { modo: 'valoracion', tipo: 'ad-bf', C: '0.1', V: '25', Ct: '0.1', K: '1.8e-5', pK: '', Vt: '12.5' } },
    { clave: 'val-fosforico', nombre: 'Dosage de l’acide phosphorique par NaOH', sc: { modo: 'valoracion', tipo: 'ap-bf', C: '0.1', V: '20', Ct: '0.1', K1: '7.5e-3', K2: '6.2e-8', K3: '4.8e-13', Vt: '' } },
    { clave: 'val-amoniaco', nombre: 'Dosage de l’ammoniac par HCl', sc: { modo: 'valoracion', tipo: 'bd-af', C: '0.1', V: '20', Ct: '0.1', K: '1.8e-5', pK: '', Vt: '30' } },
  ];

  return { resolver, fuerte, debil, tampon, mezcla, valoracion, sal, inverso, preparar, poliprotico, fracciones, exacto, kwDe, ejemplos, INDICADORES, f, f2 };
})();

