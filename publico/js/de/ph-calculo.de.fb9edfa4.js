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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} fehlt`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} muss eine Zahl sein`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${Mayus(nom)} muss ${cero ? 'positiv oder null' : 'größer als 0'} sein`);
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
    if (!vacio(sc.pK)) { const p = leeNum(sc.pK); if (!isFinite(p)) throw new Error(`Der p${nom} muss eine Zahl sein`); return 10 ** -p; }
    throw new Error(`${nom} (oder p${nom}) fehlt`);
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
  const CLASICOS = ['Methylorange', 'Methylrot', 'Bromthymolblau', 'Phenolphthalein', 'Thymolphthalein']; // los de clase; el resto se muestra entre los que sirven
  const indicador = (pH) => INDICADORES.filter((q) => CLASICOS.includes(q[0])).reduce((a, b) => (Math.abs((b[1] + b[2]) / 2 - pH) < Math.abs((a[1] + a[2]) / 2 - pH) ? b : a));
  const caracter = (pH) => (pH < PKW / 2 - 0.005 ? 'sauer' : pH > PKW / 2 + 0.005 ? 'basisch' : 'neutra');
  const finPH = (pH) => `$pH = ${f2(pH)}$: Die Lösung ist ${caracter(pH)}.`;
  const desdeH = (h) => `$pH = −log [H_{3}O^{+}] = −log ${f(h)}$ = <b>${f2(-lg(h))}</b>`;
  const desdeOH = (oh) => `$pOH = −log [OH^{−}] = −log ${f(oh)} = ${f2(-lg(oh))}$, &ensp; $pH = ${p14()} − pOH$ = <b>${f2(PKW + lg(oh))}</b>`;
  const raiz = (K, C) => (-K + Math.sqrt(K * K + 4 * K * C)) / 2;

  function fuerte(sc) {
    const base = sc.especie === 'base', C = lee(sc, 'C', 'die Konzentration'), n = lee(sc, 'n', base ? 'die Anzahl der OH⁻' : 'die Anzahl der H⁺', { opcional: true }) ?? 1;
    const c = n * C, ion = base ? 'OH^{−}' : 'H_{3}O^{+}';
    const pasos = [{ t: 'Vollständige Dissoziation', html: `Da es ${base ? 'eine starke Base' : 'eine starke Säure'} ist, dissoziiert es vollständig${n > 1 ? ` und jede Formel liefert ${f(n)} ${base ? 'OH⁻' : 'H⁺'}` : ''}: $[${ion}] = ${n > 1 ? `${f(n)} · ${f(C)}` : f(C)}$ = ${f(c)} M` }];
    let pH;
    if (c < 1e-6) {
      const x = (c + Math.sqrt(c * c + 4 * KW)) / 2;
      pH = base ? PKW + lg(x) : -lg(x);
      pasos.push({ t: 'Sehr verdünnt: Das Wasser zählt', html: `Bei so geringer Konzentration sind die Ionen des Wassers nicht vernachlässigbar. Mit $[${ion}] = c + [${base ? 'H_{3}O^{+}' : 'OH^{−}'}]$ und $K_w = [H_{3}O^{+}][OH^{−}] = ${PKW === 14 ? '10^{−14}' : f(KW)}$ ergibt sich $x^2 − c x − K_w = 0$, $x = ${f(x)}$ M` });
      pasos.push({ t: 'pH', html: base ? desdeOH(x) : desdeH(x) });
    } else {
      pH = base ? PKW + lg(c) : -lg(c);
      pasos.push({ t: 'pH', html: base ? desdeOH(c) : desdeH(c) });
    }
    pasos.push({ t: 'Gleichgewichtskonzentrationen', html: `$[H_{3}O^{+}] = ${f(10 ** -pH)}$ M, &ensp; $[OH^{−}] = ${f(10 ** (pH - PKW))}$ M. ${finPH(pH)}` });
    return { modo: 'fuerte', base, C, n, pH, h: 10 ** -pH, pasos };
  }

  function debil(sc) {
    const base = sc.especie === 'base', C = lee(sc, 'C', 'die Konzentration'), K = leeK(sc, base ? 'Kb' : 'Ka');
    const x = raiz(K, C), aprox = Math.sqrt(K * C), alfa = x / C;
    const Kn = base ? 'K_b' : 'K_a';
    const pasos = [
      { t: 'Gleichgewicht', html: base ? `$B + H_{2}O ⇌ BH^{+} + OH^{−}$<br>anfangs: ${f(C)}, 0, 0 &ensp; Gleichgewicht: ${f(C)} − x, x, x` : `$HA + H_{2}O ⇌ A^{−} + H_{3}O^{+}$<br>anfangs: ${f(C)}, 0, 0 &ensp; Gleichgewicht: ${f(C)} − x, x, x` },
      { t: 'Konstante', html: `$${Kn} = {x^2}/{C − x}$, &ensp; $${f(K)} = {x^2}/{${f(C)} − x}$<br>$x^2 + ${f(K)} x − ${f(K * C)} = 0$, &ensp; $x = {−${Kn} + √(${Kn}^2 + 4 ${Kn} C)}/{2}$ = <b>${f(x)} M</b> = $[${base ? 'OH^{−}' : 'H_{3}O^{+}'}]$` },
      { t: 'pH', html: base ? desdeOH(x) : desdeH(x) },
      { t: 'Dissoziationsgrad', html: `$α = x/C = ${f(x)}/${f(C)}$ = <b>${f(alfa)}</b> (${f(100 * alfa)} %)` },
      { t: 'Mit der Näherung', html: `Vernachlässigt man x gegenüber C: $x ≈ √(${Kn} C) = √(${f(K)} · ${f(C)}) = ${f(aprox)}$ M, ${alfa < 0.05 ? `was gilt, weil α < 5 % ist (Fehler von ${f((100 * (aprox - x)) / x, 2)} %)` : `aber hier ist α > 5 % und die Näherung ergibt einen Fehler von ${f((100 * (aprox - x)) / x, 2)} %: Man muss die quadratische Gleichung lösen`}.` },
    ];
    const pH = base ? PKW + lg(x) : -lg(x);
    pasos.push({ t: 'Ergebnis', html: finPH(pH) });
    return { modo: 'debil', base, C, K, pK: -lg(K), x, alfa, pH, h: 10 ** -pH, pasos };
  }

  function tampon(sc) {
    const base = sc.especie === 'base', K = leeK(sc, base ? 'Kb' : 'Ka');
    const Cd = lee(sc, 'Cd', base ? 'die Konzentration der Base' : 'die Konzentration der Säure'), Cs = lee(sc, 'Cs', 'die Konzentration des Salzes');
    const pKa = base ? PKW + lg(K) : -lg(K); // del ácido del par
    const cAc = base ? Cs : Cd, cBa = base ? Cd : Cs, Ac = base ? 'BH^{+}' : 'HA', Ba = base ? 'B' : 'A^{−}';
    const pH0 = pKa + lg(cBa / cAc);
    const pasos = [{ t: 'Henderson-Hasselbalch-Gleichung', html: `${base ? `Das Paar ist $B/BH^{+}$: $pK_a = ${p14()} − pK_b = ${p14()} − ${f2(-lg(K))} = ${f2(pKa)}$.` : `$pK_a = −log ${f(K)} = ${f2(pKa)}$.`}<br>$pH = pK_a + log {[${Ba}]}/{[${Ac}]} = ${f2(pKa)} + log {${f(cBa)}}/{${f(cAc)}}$ = <b>${f2(pH0)}</b>` }];
    let pH = pH0, pHagua = null, nAc = null, nBa = null;
    const anade = sc.anade === 'acido' || sc.anade === 'base' ? sc.anade : 'nada';
    if (anade !== 'nada') {
      const V = lee(sc, 'V', 'das Volumen der Pufferlösung'), Cad = lee(sc, 'Cad', 'die Konzentration des Zugegebenen'), Vad = lee(sc, 'Vad', 'das zugegebene Volumen');
      const n = (Cad * Vad) / 1000, nAc0 = (cAc * V) / 1000, nBa0 = (cBa * V) / 1000, Vt = (V + Vad) / 1000;
      nAc = anade === 'acido' ? nAc0 + n : nAc0 - n; nBa = anade === 'acido' ? nBa0 - n : nBa0 + n;
      const ion = anade === 'acido' ? 'H_{3}O^{+}' : 'OH^{−}';
      pasos.push({ t: 'Mol vor der Zugabe', html: `$n(${Ac}) = ${f(cAc)} · ${f(V / 1000)} = ${f(nAc0)}$ mol, &ensp; $n(${Ba}) = ${f(cBa)} · ${f(V / 1000)} = ${f(nBa0)}$ mol, &ensp; $n(${ion}) = ${f(Cad)} · ${f(Vad / 1000)} = ${f(n)}$ mol` });
      if (nAc <= 0 || nBa <= 0) {
        const sp = base ? { cb: (nAc0 + nBa0) / Vt, Kb: K, cl: nAc0 / Vt } : { ca: (nAc0 + nBa0) / Vt, Ka: K, na: nBa0 / Vt };
        if (anade === 'acido') sp.cl = (sp.cl || 0) + n / Vt; else sp.na = (sp.na || 0) + n / Vt;
        pH = exacto(sp);
        pasos.push({ t: 'Der Puffer ist erschöpft', html: `Das Zugegebene verbraucht die gesamte ${anade === 'acido' ? 'basische Form' : 'saure Form'} des Paares und es bleibt übrig: Die Lösung puffert nicht mehr und der pH-Wert ändert sich stark, bis auf <b>${f2(pH)}</b>.` });
      } else {
        pH = pKa + lg(nBa / nAc);
        pasos.push({ t: anade === 'acido' ? 'Die Säure reagiert mit der basischen Form' : 'Die Base reagiert mit der sauren Form', html: `${anade === 'acido' ? `$${Ba} + H_{3}O^{+} → ${Ac}$` : `$${Ac} + OH^{−} → ${Ba}$`}: Es bleiben $n(${Ac}) = ${f(nAc)}$ mol und $n(${Ba}) = ${f(nBa)}$ mol. Das Volumen ist für beide gleich, also kann man den Quotienten der Stoffmengen verwenden:<br>$pH = ${f2(pKa)} + log {${f(nBa)}}/{${f(nAc)}}$ = <b>${f2(pH)}</b>` });
      }
      const c = n / Vt;
      pHagua = anade === 'acido' ? -lg((c + Math.sqrt(c * c + 4 * KW)) / 2) : PKW + lg((c + Math.sqrt(c * c + 4 * KW)) / 2);
      pasos.push({ t: 'Verglichen mit reinem Wasser', html: `Der pH-Wert ändert sich um ${f2(Math.abs(pH - pH0))} Einheiten. Würde man dasselbe in ${f(V)} mL reines Wasser geben, ginge der pH-Wert von ${f2(PKW / 2)} auf ${f2(pHagua)}.` });
    }
    pasos.push({ t: 'Konzentration von H₃O⁺', html: `$[H_{3}O^{+}] = 10^{−pH} = ${f(10 ** -pH)}$ M` });
    const Ka = 10 ** -pKa, Ct = cAc + cBa, betaDe = (pHx) => { const hx = 10 ** -pHx; return Math.LN10 * (hx + KW / hx + (Ct * Ka * hx) / ((Ka + hx) ** 2)); };
    const beta = betaDe(pH0), betaMax = (Math.LN10 / 4) * Ct, curvaBeta = Array.from({ length: 141 }, (_, i) => [i / 10, betaDe(i / 10)]);
    pasos.push({ t: 'Pufferkapazität', html: `Sie puffern gut zwischen $pH = pK_a ± 1$, von ${f2(pKa - 1)} bis ${f2(pKa + 1)}, und umso besser, je konzentrierter beide Formen sind.` });
    pasos.push({ t: 'Pufferkapazität β', html: `$β = {d C_b}/{d pH} = 2,303 ([H_{3}O^{+}] + [OH^{−}] + {C K_a [H_{3}O^{+}]}/{(K_a + [H_{3}O^{+}])^2})$, mit $C = [HA] + [A^{−}] = ${f(Ct)}$ M. Bei pH = ${f2(pH0)} ist <b>β = ${f(beta)} mol/(L·pH)</b>: Man braucht ${f(beta)} mol starke Base pro Liter, um den pH-Wert um eine Einheit zu erhöhen. Sie ist bei $pH = pK_a$ maximal, mit $β_{max} = 2,303 C/4 = ${f(betaMax)}$ mol/(L·pH), und fällt bei $pK_a ± 0,76$ auf die Hälfte.` });
    return { modo: 'tampon', base, K, pKa, cAc, cBa, pH0, pH, anade, pHagua, nAc, nBa, Ct, beta, betaMax, curvaBeta, betaDe, h: 10 ** -pH, pasos };
  }

  function mezcla(sc) {
    if (sc.tipo === 'df' || sc.tipo === 'fd') return mezclaDebil(sc);
    const Ca = lee(sc, 'Ca', 'die Konzentration der Säure'), Va = lee(sc, 'Va', 'das Volumen der Säure'), Cb = lee(sc, 'Cb', 'die Konzentration der Base'), Vb = lee(sc, 'Vb', 'das Volumen der Base');
    const na = (Ca * Va) / 1000, nb = (Cb * Vb) / 1000, Vt = (Va + Vb) / 1000, d = na - nb;
    const pasos = [
      { t: 'Mol von jedem', html: `$n(H_{3}O^{+}) = ${f(Ca)} · ${f(Va / 1000)} = ${f(na)}$ mol, &ensp; $n(OH^{−}) = ${f(Cb)} · ${f(Vb / 1000)} = ${f(nb)}$ mol` },
      { t: 'Neutralisation', html: `$H_{3}O^{+} + OH^{−} → 2 H_{2}O$. ${Math.abs(d) < 1e-12 * Math.max(na, nb) ? 'Es liegen gleich viele Mol beider vor: Sie neutralisieren sich vollständig.' : `Es bleiben ${f(Math.abs(d))} mol ${d > 0 ? 'H₃O⁺' : 'OH⁻'} in $V = ${f(Va)} + ${f(Vb)} = ${f(Va + Vb)}$ mL übrig.`}` },
    ];
    let pH;
    if (Math.abs(d) < 1e-12 * Math.max(na, nb)) { pH = PKW / 2; pasos.push({ t: 'pH', html: `Es bleibt nur Wasser und ein Salz, das nicht hydrolysiert: <b>pH = ${f2(PKW / 2)}</b>${PKW === 14 ? '' : ', der neutrale bei dieser Temperatur'}.` }); } else {
      const c = Math.abs(d) / Vt;
      pasos.push({ t: 'Konzentration des Überschusses', html: `$[${d > 0 ? 'H_{3}O^{+}' : 'OH^{−}'}] = ${f(Math.abs(d))}/${f(Vt)}$ = ${f(c)} M` });
      pH = d > 0 ? -lg(c) : PKW + lg(c);
      pasos.push({ t: 'pH', html: d > 0 ? desdeH(c) : desdeOH(c) });
    }
    pasos.push({ t: 'Ergebnis', html: finPH(pH) });
    return { modo: 'mezcla', Ca, Va, Cb, Vb, na, nb, pH, h: 10 ** -pH, pasos };
  }

  const contrasta = (pH, sp, pasos, porque) => {
    const ex = exacto(sp);
    if (Math.abs(ex - pH) <= 0.02) return pH;
    pasos.push({ t: 'Überprüfung mit dem vollständigen Gleichgewicht', html: `${porque} Löst man die vollständige Ladungsbilanz, ergibt sich <b>pH = ${f2(ex)}</b> (die Näherung wie im Unterricht ergab ${f2(pH)}).` });
    return ex;
  };

  function mezclaDebil(sc) {
    const df = sc.tipo === 'df', K = leeK(sc, df ? 'Ka' : 'Kb');
    const Ca = lee(sc, 'Ca', `die Konzentration der${df ? ' schwachen' : ''} Säure`), Va = lee(sc, 'Va', 'das Volumen der Säure'), Cb = lee(sc, 'Cb', `die Konzentration der${df ? '' : ' schwachen'} Base`), Vb = lee(sc, 'Vb', 'das Volumen der Base');
    const na = (Ca * Va) / 1000, nb = (Cb * Vb) / 1000, Vt = (Va + Vb) / 1000;
    const nD = df ? na : nb, nF = df ? nb : na; // moles del débil y del fuerte
    const D = df ? 'HA' : 'B', C = df ? 'A^{−}' : 'BH^{+}', F = df ? 'OH^{−}' : 'H_{3}O^{+}';
    const pKa = df ? -lg(K) : PKW + lg(K);
    const pasos = [
      { t: 'Mol von jedem', html: `$n(${D}) = ${f(df ? Ca : Cb)} · ${f((df ? Va : Vb) / 1000)} = ${f(nD)}$ mol, &ensp; $n(${F}) = ${f(df ? Cb : Ca)} · ${f((df ? Vb : Va) / 1000)} = ${f(nF)}$ mol` },
      { t: 'Reaktion', html: `Die starke reagiert vollständig mit der schwachen: $${D} + ${F} → ${C}${df ? ' + H_{2}O' : ' + H_{2}O'}$. ${Math.abs(nD - nF) < 1e-12 * nD ? 'Es sind gleich viele Mol: Es bleibt nur das Salz.' : nF < nD ? `Es entstehen ${f(nF)} mol ${df ? 'A⁻' : 'BH⁺'} und es bleiben ${f(nD - nF)} mol ${D} übrig.` : `${D} wird ganz verbraucht und es bleiben ${f(nF - nD)} mol ${df ? 'OH⁻' : 'H₃O⁺'} übrig.`}` },
    ];
    const sp = df ? { ca: na / Vt, Ka: K, na: nb / Vt } : { cb: nb / Vt, Kb: K, cl: na / Vt };
    let pH, caso;
    if (Math.abs(nD - nF) < 1e-12 * nD) {
      caso = 'sal';
      const cs = nD / Vt, Kh = KW / K, x = raiz(Kh, cs);
      pH = df ? PKW + lg(x) : -lg(x);
      pasos.push({ t: 'Hydrolyse des Salzes', html: `$[${C}] = ${f(nD)}/${f(Vt)} = ${f(cs)}$ M, das mit $${df ? 'K_b' : 'K_a'} = K_w/${df ? 'K_a' : 'K_b'} = ${f(Kh)}$ hydrolysiert: $x = ${f(x)}$ M ${df ? 'OH⁻' : 'H₃O⁺'} und <b>pH = ${f2(pH)}</b>` });
    } else if (nF < nD) {
      caso = 'tampon';
      pH = pKa + lg(df ? nF / (nD - nF) : (nD - nF) / nF);
      pasos.push({ t: 'Es bleibt eine Pufferlösung', html: `${df ? '' : `$pK_a = ${p14()} − pK_b = ${f2(pKa)}$. `}$pH = pK_a + log {n(${df ? 'A^{−}' : 'B'})}/{n(${df ? 'HA' : 'BH^{+}'})} = ${f2(pKa)} + log {${f(df ? nF : nD - nF)}}/{${f(df ? nD - nF : nF)}}$ = <b>${f2(pH)}</b>` });
      pH = contrasta(pH, sp, pasos, 'Eine der beiden Formen ist sehr knapp, und Henderson-Hasselbalch gilt nicht.');
    } else {
      caso = 'exceso';
      const c = (nF - nD) / Vt;
      pH = df ? PKW + lg(c) : -lg(c);
      pasos.push({ t: 'Die überschüssige starke bestimmt', html: `$[${F}] = ${f(nF - nD)}/${f(Vt)} = ${f(c)}$ M (die Hydrolyse des Salzes ist ihr gegenüber vernachlässigbar): ${df ? desdeOH(c) : desdeH(c)}` });
      pH = contrasta(pH, sp, pasos, 'Es bleibt so wenig übrig, dass die Hydrolyse des Salzes nicht mehr vernachlässigbar ist.');
    }
    pasos.push({ t: 'Ergebnis', html: finPH(pH) });
    return { modo: 'mezcla', tipo: sc.tipo, caso, K, pKa, Ca, Va, Cb, Vb, na, nb, pH, h: 10 ** -pH, pasos };
  }

  function anfotera(sc) {
    const C = lee(sc, 'C', 'die Konzentration des Salzes'), K1 = lee(sc, 'K1', 'Ka₁ (der Säure H₂A)'), K2 = lee(sc, 'K2', 'Ka₂ (von HA⁻)');
    if (K2 >= K1) throw new Error('Ka₁ muss größer als Ka₂ sein');
    const pH0 = (-lg(K1) - lg(K2)) / 2, h = Math.sqrt((K1 * (K2 * C + KW)) / (K1 + C)), pH = -lg(h), pasos = [];
    pasos.push({ t: 'Amphoteres Anion', html: `Das Anion $HA^{−}$ verhält sich als Säure ($HA^{−} + H_{2}O ⇌ A^{2−} + H_{3}O^{+}$, $K_{a2} = ${f(K2)}$) und als Base ($HA^{−} + H_{2}O ⇌ H_{2}A + OH^{−}$, $K_b = K_w/K_{a1} = ${f(KW / K1)}$). Das Kation (Na⁺) hat keinen Einfluss.` });
    pasos.push({ t: 'Näherung wie im Unterricht', html: `Die beiden Reaktionen gleichen sich aus, und der pH-Wert hängt nicht von der Konzentration ab: $pH ≈ {pK_{a1} + pK_{a2}}/2 = {${f2(-lg(K1))} + ${f2(-lg(K2))}}/2$ = <b>${f2(pH0)}</b>.` });
    pasos.push({ t: 'Überprüfung mit der vollständigen Formel', html: `Mit der nicht genäherten Ladungsbilanz ist $[H_{3}O^{+}] = \sqrt{K_{a1}(K_{a2}C + K_w)/(K_{a1} + C)} = ${f(h)}$ M ⇒ <b>pH = ${f2(pH)}</b> (die Näherung weicht um ${f2(Math.abs(pH - pH0))} Einheiten ab).` });
    pasos.push({ t: 'Wann sie gilt', html: Math.abs(pH - pH0) < 0.05 ? 'Die Näherung ist gut: $C ≫ K_{a1}$... und $K_{a2}C ≫ K_w$.' : 'Hier beginnt die Näherung zu versagen: Die Konzentration ist sehr niedrig ($C$ ist nicht viel größer als $K_{a1}$) oder $K_{a2}C$ übersteigt $K_w$ nicht. Verwende den Wert der vollständigen Formel.' });
    return { modo: 'sal', tipo: 'anfotera', C, K1, K2, pH, pH0, h, alfa: null, pasos };
  }
  function sal(sc) {
    if (sc.tipo === 'anfotera') return anfotera(sc);
    const tipo = ['basica', 'acida', 'neutra'].includes(sc.tipo) ? sc.tipo : 'basica', C = lee(sc, 'C', 'die Konzentration des Salzes'), pasos = [];
    if (tipo === 'neutra') {
      pasos.push({ t: 'Salz aus starker Säure und starker Base', html: `Seine Ionen (wie Na⁺ und Cl⁻) sind konjugierte einer starken Säure und einer starken Base: Sie sind so schwach, dass sie nicht mit Wasser reagieren. Die Lösung hat den pH-Wert von Wasser: <b>pH = ${f2(PKW / 2)}</b>.` });
      return { modo: 'sal', tipo, C, pH: PKW / 2, h: 10 ** (-PKW / 2), pasos };
    }
    const bas = tipo === 'basica', K = leeK(sc, bas ? 'Ka' : 'Kb'), Kh = KW / K, x = raiz(Kh, C), pH = bas ? PKW + lg(x) : -lg(x);
    pasos.push({ t: 'Welches Ion hydrolysiert', html: bas ? `Das Anion A⁻ ist die konjugierte Base einer schwachen Säure und reagiert mit Wasser: $A^{−} + H_{2}O ⇌ HA + OH^{−}$. Das Kation (Na⁺, K⁺) hydrolysiert nicht.` : `Das Kation BH⁺ (wie NH₄⁺) ist die konjugierte Säure einer schwachen Base: $BH^{+} + H_{2}O ⇌ B + H_{3}O^{+}$. Das Anion (Cl⁻, NO₃⁻) hydrolysiert nicht.` });
    pasos.push({ t: 'Hydrolysekonstante', html: `$${bas ? 'K_b' : 'K_a'} = {K_w}/{${bas ? 'K_a' : 'K_b'}} = {${PKW === 14 ? '10^{−14}' : f(KW)}}/{${f(K)}} = ${f(Kh)}$` });
    pasos.push({ t: 'Gleichgewicht', html: `$${f(Kh)} = {x^2}/{${f(C)} − x}$ → $x = ${f(x)}$ M = $[${bas ? 'OH^{−}' : 'H_{3}O^{+}'}]$ (Hydrolysegrad ${f((100 * x) / C)} %)` });
    pasos.push({ t: 'pH', html: bas ? desdeOH(x) : desdeH(x) });
    pasos.push({ t: 'Ergebnis', html: finPH(pH) });
    return { modo: 'sal', tipo, C, K, Kh, x, alfa: x / C, pH, h: 10 ** -pH, pasos };
  }

  function inverso(sc) {
    const base = sc.especie === 'base', pHm = lee(sc, 'pHm', 'der pH-Wert', { cero: true }), ion = base ? 'OH^{−}' : 'H_{3}O^{+}';
    if (pHm > PKW) throw new Error(`Der pH-Wert muss zwischen 0 und ${p14()} liegen`);
    if (base ? pHm <= PKW / 2 : pHm >= PKW / 2) throw new Error(`Bei pH ${f2(pHm)} ist die Lösung nicht ${base ? 'basisch' : 'sauer'}`);
    const x = base ? 10 ** (pHm - PKW) : 10 ** -pHm, pasos = [];
    pasos.push({ t: `Die Konzentration von ${base ? 'OH⁻' : 'H₃O⁺'}`, html: base ? `$pOH = ${p14()} − ${f2(pHm)} = ${f2(PKW - pHm)}$, &ensp; $[OH^{−}] = 10^{−pOH} = ${f(x)}$ M` : `$[H_{3}O^{+}] = 10^{−pH} = 10^{−${f2(pHm)}} = ${f(x)}$ M` });
    if (sc.fuerza === 'fuerte') {
      const n = lee(sc, 'n', 'die Anzahl der H⁺ oder OH⁻', { opcional: true }) ?? 1, C = x / n;
      pasos.push({ t: 'Konzentration', html: `Sie dissoziiert vollständig${n > 1 ? ` und liefert ${f(n)} Ionen pro Formel` : ''}: $C = [${ion}]${n > 1 ? `/${f(n)}` : ''}$ = <b>${f(C)} M</b>` });
      return { modo: 'inverso', base, pH: pHm, x, C, h: 10 ** -pHm, pasos };
    }
    const Kn = base ? 'K_b' : 'K_a';
    if (sc.busca === 'C') {
      const K = leeK(sc, base ? 'Kb' : 'Ka'), C = (x * x) / K + x;
      pasos.push({ t: 'Anfangskonzentration', html: `Aus $${Kn} = {x^2}/{C − x}$: $C = {x^2}/{${Kn}} + x = {(${f(x)})^2}/{${f(K)}} + ${f(x)}$ = <b>${f(C)} M</b>` });
      pasos.push({ t: 'Dissoziationsgrad', html: `$α = x/C = ${f(x / C)}$ (${f((100 * x) / C)} %)` });
      return { modo: 'inverso', base, pH: pHm, x, C, K, alfa: x / C, h: 10 ** -pHm, pasos };
    }
    const C = lee(sc, 'C', 'die Anfangskonzentration');
    if (!(x < C)) throw new Error(`Bei ${f(C)} M können keine ${f(x)} M ${base ? 'OH⁻' : 'H₃O⁺'} vorliegen: Entweder ist sie stark, oder ein Wert ist falsch`);
    const K = (x * x) / (C - x);
    pasos.push({ t: 'Gleichgewicht', html: base ? `$B + H_{2}O ⇌ BH^{+} + OH^{−}$: Im Gleichgewicht ist $[BH^{+}] = [OH^{−}] = x$ und $[B] = C − x$` : `$HA + H_{2}O ⇌ A^{−} + H_{3}O^{+}$: Im Gleichgewicht ist $[A^{−}] = [H_{3}O^{+}] = x$ und $[HA] = C − x$` });
    pasos.push({ t: 'Konstante', html: `$${Kn} = {x^2}/{C − x} = {(${f(x)})^2}/{${f(C)} − ${f(x)}}$ = <b>${f(K)}</b>, &ensp; $p${Kn} = ${f2(-lg(K))}$` });
    pasos.push({ t: 'Dissoziationsgrad', html: `$α = x/C = ${f(x)}/${f(C)}$ = <b>${f(x / C)}</b> (${f((100 * x) / C)} %)` });
    return { modo: 'inverso', base, pH: pHm, x, C, K, pK: -lg(K), alfa: x / C, h: 10 ** -pHm, pasos };
  }

  function preparar(sc) {
    const base = sc.especie === 'base', K = leeK(sc, base ? 'Kb' : 'Ka'), pHo = lee(sc, 'pHo', 'der gewünschte pH-Wert', { cero: true });
    const Cd = lee(sc, 'Cd', base ? 'die Konzentration der Base' : 'die Konzentration der Säure'), V = lee(sc, 'V', 'das anzusetzende Volumen');
    const pKa = base ? PKW + lg(K) : -lg(K), r = 10 ** (pHo - pKa); // [forma básica]/[forma ácida]
    const Cs = base ? Cd / r : Cd * r, ns = (Cs * V) / 1000, pasos = [];
    const Ac = base ? 'BH^{+}' : 'HA', Ba = base ? 'B' : 'A^{−}';
    pasos.push({ t: 'Verhältnis der beiden Formen', html: `${base ? `$pK_a = ${p14()} − pK_b = ${f2(pKa)}$. ` : `$pK_a = ${f2(pKa)}$. `}Aus Henderson-Hasselbalch, $log {[${Ba}]}/{[${Ac}]} = pH − pK_a = ${f2(pHo)} − ${f2(pKa)} = ${f2(pHo - pKa)}$ → ${'$'}{[${Ba}]}/{[${Ac}]} = 10^{${f2(pHo - pKa)}}$ = <b>${f(r)}</b>` });
    pasos.push({ t: 'Konzentration des Salzes', html: `$[${base ? 'BH^{+}' : 'A^{−}'}] = ${base ? `${f(Cd)}/${f(r)}` : `${f(r)} · ${f(Cd)}`}$ = <b>${f(Cs)} M</b>; in ${f(V)} mL sind das $n = ${f(Cs)} · ${f(V / 1000)}$ = <b>${f(ns)} mol</b>` });
    let masa = null, M = null;
    if (!vacio(sc.sal) && typeof Formulas !== 'undefined') {
      try { M = Formulas.masaMolar(sc.sal).M; } catch (e) { throw new Error(`La sal: ${e.message}`); }
      masa = ns * M;
      pasos.push({ t: 'Masse des Salzes', html: `M(${Formulas.leer(sc.sal).html}) = ${f(M, 4)} g/mol → m = ${f(ns)} · ${f(M, 4)}$ = <b>${f(masa)} g</b>`.replace('$ = <b>', ' = <b>') });
    }
    if (Math.abs(pHo - pKa) > 1) pasos.push({ t: 'Hinweis', html: `Der gewünschte pH-Wert liegt mehr als eine Einheit vom pK<sub>a</sub> (${f2(pKa)}) entfernt: Eine der beiden Formen ist viel häufiger und der Puffer puffert schlecht. Besser ist ein Paar mit näherem pK<sub>a</sub>.` });
    pasos.push({ t: 'Wie man ihn ansetzt', html: `In einem ${f(V)}-mL-Messkolben: ${base ? 'die Base' : 'die Säure'} bis ${f(Cd)} M und ${masa !== null ? `${f(masa)} g des Salzes` : `${f(ns)} mol des Salzes`}, und man füllt mit Wasser bis zur Marke auf.` });
    return { modo: 'preparar', base, K, pKa, pH: pHo, cociente: r, Cs, ns, masa, M, h: 10 ** -pHo, pasos };
  }

  const fracciones = (Kas, pH) => { const h = 10 ** -pH, t = [1]; Kas.forEach((K, i) => t.push((t[i] * K) / h)); const den = t.reduce((a, b) => a + b, 0); return t.map((v) => v / den); };
  const leeKas = (sc) => {
    const Kas = [lee(sc, 'K1', 'Ka₁'), lee(sc, 'K2', 'Ka₂')], K3 = lee(sc, 'K3', 'Ka₃', { opcional: true });
    if (K3 !== null) Kas.push(K3);
    if (Kas.some((K, i) => i && K >= Kas[i - 1])) throw new Error('Die Konstanten müssen von groß nach klein geordnet sein: Ka₁ > Ka₂ > Ka₃');
    return Kas;
  };
  function poliprotico(sc) {
    const C = lee(sc, 'C', 'die Konzentration'), Kas = leeKas(sc), pasos = [];
    const x1 = raiz(Kas[0], C), pH1 = -lg(x1), pH = exacto({ cp: C, Kas });
    const nom = Kas.length === 2 ? ['H_{2}A', 'HA^{−}', 'A^{2−}'] : ['H_{3}A', 'H_{2}A^{−}', 'HA^{2−}', 'A^{3−}'];
    pasos.push({ t: 'Erste Dissoziation', html: `$${nom[0]} + H_{2}O ⇌ ${nom[1]} + H_{3}O^{+}$, &ensp; $K_{a1} = ${f(Kas[0])}$. Da die übrigen Konstanten viel kleiner sind, stammt fast das gesamte H₃O⁺ von hier: $x = {−K_{a1} + √(K_{a1}^2 + 4 K_{a1} C)}/{2} = ${f(x1)}$ M, $pH ≈ ${f2(pH1)}$` });
    pasos.push({ t: 'Zweite Dissoziation', html: `$${nom[1]} ⇌ ${nom[2]} + H_{3}O^{+}$. Mit $[${nom[1]}] ≈ [H_{3}O^{+}]$ ergibt sich $[${nom[2]}] ≈ K_{a2} = ${f(Kas[1])}$ M: Sie liefert sehr wenig H₃O⁺${Kas[1] / x1 > 0.05 ? ' (hier nicht so wenig, weil Ka₂ nicht so klein ist: Deshalb ändert sich der genaue pH-Wert)' : ''}.` });
    const h = 10 ** -pH, t = [1]; Kas.forEach((K, i) => t.push((t[i] * K) / h)); const den = t.reduce((a, b) => a + b, 0);
    const conc = t.map((v) => (C * v) / den);
    pasos.push({ t: 'Mit der vollständigen Ladungsbilanz', html: `<b>pH = ${f2(pH)}</b>. Konzentrationen: ${conc.map((c, i) => `$[${nom[i]}] = ${f(c)}$ M`).join(', ')}.` });
    pasos.push({ t: 'Ergebnis', html: finPH(pH) });
    return { modo: 'poliprotico', C, Kas, pH, pH1, conc, h, alfa: fracciones(Kas, pH), pasos };
  }

  const TIPOS = { 'af-bf': ['starke Säure', 'base fuerte', false, false], 'ad-bf': ['schwache Säure', 'base fuerte', true, false], 'bf-af': ['base fuerte', 'starke Säure', false, true], 'bd-af': ['schwache Base', 'starke Säure', true, true] };
  function valoracionPoli(sc) {
    const C = lee(sc, 'C', 'die Konzentration der Säure'), V = lee(sc, 'V', 'das titrierte Volumen'), Ct = lee(sc, 'Ct', 'die Konzentration des Titranten'), Kas = leeKas(sc);
    const np = Kas.length, n0 = (C * V) / 1000, Veq = (C * V) / Ct;
    const ph = (v) => { const Vt = (V + v) / 1000; return exacto({ cp: n0 / Vt, Kas, na: (Ct * v) / 1000 / Vt }); };
    const curva = []; for (let i = 0; i <= 240; i++) { const v = ((np + 1) * Veq * i) / 240; curva.push([v, ph(v)]); }
    const pK = Kas.map((K) => -lg(K)), pasos = [];
    pasos.push({ t: 'Äquivalenzpunkte', html: `Jedes Proton liefert einen Äquivalenzpunkt: $V_{eq,1} = {C V}/{C_t} = {${f(C)} · ${f(V)}}/{${f(Ct)}}$ = <b>${f(Veq)} mL</b>${Kas.slice(1).map((_, i) => `, $V_{eq,${i + 2}} = ${i + 2} V_{eq,1}$ = <b>${f((i + 2) * Veq)} mL</b>`).join('')}` });
    pasos.push({ t: 'In der Mitte jedes Abschnitts', html: pK.map((p, i) => `bei ${f((i + 0.5) * Veq)} mL, $pH ≈ pK_{a${i + 1}} = ${f2(p)}$ (exakt: ${f2(ph((i + 0.5) * Veq))})`).join('; ') + '. Je kleiner die Konstante, desto schlechter funktioniert die Näherung.' });
    const eqs = Kas.slice(0, -1).map((_, i) => (pK[i] + pK[i + 1]) / 2);
    if (eqs.length) pasos.push({ t: 'Mittlere Äquivalenzpunkte', html: eqs.map((p, i) => { const e = ph((i + 1) * Veq), ii = indicador(e); return `beim ${i + 1}. bleibt das Amphotere übrig und $pH ≈ (pK_{a${i + 1}} + pK_{a${i + 2}})/2 = ${f2(p)}$ (exakt: ${f2(e)}; Indikator: ${ii[0]}, von ${ii[3]} nach ${ii[4]} zwischen ${f(ii[1])} und ${f(ii[2])})`; }).join('; ') + '.' });
    const nitidos = pK.slice(0, -1).map((p, i) => pK[i + 1] - p >= 4);
    pasos.push({ t: 'Sind die Sprünge unterscheidbar?', html: pK.slice(0, -1).map((p, i) => `Zwischen dem ${i + 1}. und ${i + 2}., $Δ pK_a = ${f2(pK[i + 1] - p)}$: ${nitidos[i] ? 'Der Sprung ist deutlich und lässt sich einzeln titrieren' : 'Die beiden Konstanten liegen zu nah beieinander (nötig ist ein Unterschied von etwa 4 Einheiten) und der Sprung überlappt mit dem nächsten'}`).join('; ') + '.' });
    const pHeq = ph(np * Veq), ind = indicador(pHeq);
    pasos.push({ t: 'Letzter Äquivalenzpunkt', html: `Es bleibt das Anion $A^{${np}−}$, das hydrolysiert: <b>pH = ${f2(pHeq)}</b>. Indikator: ${ind[0]}, von ${ind[3]} nach ${ind[4]} zwischen ${f(ind[1])} und ${f(ind[2])}.` });
    const v = lee(sc, 'Vt', 'das zugegebene Volumen', { opcional: true, cero: true });
    const pHv = v === null ? null : ph(v);
    if (v !== null) pasos.push({ t: `Mit ${f(v)} mL Zugabe`, html: `Mit der Ladungsbilanz: <b>pH = ${f2(pHv)}</b>` });
    return { modo: 'valoracion', tipo: 'ap-bf', poli: true, nomV: 'mehrprotonige Säure', nomT: 'base fuerte', debilV: true, esBase: false, C, V, Ct, Kas, pKa: pK[0], pKs: pK, Veq, Veqs: Kas.map((_, i) => (i + 1) * Veq), pHeq, ind, v, pHv, curva, pH: pHv ?? curva[0][1], ph, pasos };
  }
  function valoracion(sc) {
    if (sc.tipo === 'ap-bf') return valoracionPoli(sc);
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'af-bf', [nomV, nomT, debilV, esBase] = TIPOS[tipo];
    const C = lee(sc, 'C', `die Konzentration von ${nomV.split(' ')[0]}`), V = lee(sc, 'V', 'das titrierte Volumen'), Ct = lee(sc, 'Ct', 'die Konzentration des Titranten');
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
    const pasos = [{ t: 'Äquivalenzpunkt', html: `Wenn die Stoffmenge des Titranten gleich der von ${nomV} ist: $C V = C_t V_{eq}$, $V_{eq} = {C V}/{C_t} = {${f(C)} · ${f(V)}}/{${f(Ct)}}$ = <b>${f(Veq)} mL</b>` }];
    const pKa = debilV ? (esBase ? PKW + lg(K) : -lg(K)) : null;
    let pHeq;
    if (!debilV) {
      pHeq = PKW / 2;
      pasos.push({ t: 'pH am Äquivalenzpunkt', html: `Es entsteht ein Salz aus starker Säure und starker Base, das nicht hydrolysiert: <b>pH = ${f2(pHeq)}</b>.` });
    } else {
      const cs = n0 / ((V + Veq) / 1000), Kh = KW / K, x = raiz(Kh, cs);
      pHeq = esBase ? -lg(x) : PKW + lg(x);
      pasos.push({ t: 'pH am Äquivalenzpunkt', html: `Alles ${nomV} hat sich in ${esBase ? 'seine konjugierte Säure, $BH^{+}$' : 'seine konjugierte Base, $A^{−}$'} umgewandelt, mit $c = ${f(n0)}/${f((V + Veq) / 1000)} = ${f(cs)}$ M, die mit $${esBase ? 'K_a' : 'K_b'} = K_w/${esBase ? 'K_b' : 'K_a'} = ${f(Kh)}$ hydrolysiert: $x = ${f(x)}$ M ${esBase ? 'H₃O⁺' : 'OH⁻'}, und <b>pH = ${f2(pHeq)}</b>, ${esBase ? 'sauer' : 'basisch'}.` });
    }
    const ind = indicador(pHeq);
    const salto = [ph(Veq * 0.999), ph(Veq * 1.001)].sort((x, y) => x - y), adecuados = INDICADORES.filter((q) => Math.min(q[2], salto[1]) - Math.max(q[1], salto[0]) >= 0.5 * (q[2] - q[1]));
    pasos.push({ t: 'Indikator', html: `Man braucht einen, der nahe pH ${f2(pHeq)} umschlägt: ${ind[0]}, der zwischen ${f(ind[1])} und ${f(ind[2])} von ${ind[3]} nach ${ind[4]} wechselt.` });
    pasos.push({ t: 'Welche Indikatoren eignen sich?', html: `Der pH-Sprung von 99,9 % auf 100,1 % des Titranten geht von ${f2(salto[0])} auf ${f2(salto[1])}. Geeignet sind Indikatoren, die innerhalb dieses Sprungs umschlagen: ${adecuados.length ? adecuados.map((q) => `${q[0]} (${f(q[1])}–${f(q[2])})`).join(', ') : 'keiner aus der Liste (der Sprung ist für einen visuellen Indikator zu schmal: Besser ist ein pH-Meter)'}.` });
    if (debilV) pasos.push({ t: 'In der Mitte der Titration', html: `Bei $V = V_{eq}/2 = ${f(Veq / 2)}$ mL liegen von der sauren und der basischen Form gleich viel vor: Es ist eine Pufferlösung mit <b>pH = pK<sub>a</sub> = ${f2(pKa)}</b>${esBase ? ' (der konjugierten Säure)' : ''}. So misst man die Konstante einer Säure oder Base.` });
    const v = lee(sc, 'Vt', 'das zugegebene Volumen', { opcional: true, cero: true });
    let pHv = null;
    if (v !== null) {
      const Vtot = (V + v) / 1000, nt = (Ct * v) / 1000, d = n0 - nt, ionV = esBase ? 'OH^{−}' : 'H_{3}O^{+}', ionT = esBase ? 'H_{3}O^{+}' : 'OH^{−}';
      let html;
      if (v === 0) {
        if (debilV) { const x = raiz(K, C); pHv = esBase ? PKW + lg(x) : -lg(x); html = `Vor jeder Zugabe ist es ${esBase ? 'eine schwache Base' : 'eine schwache Säure'}: $x = ${f(x)}$ M und <b>pH = ${f2(pHv)}</b>`; } else { pHv = esBase ? PKW + lg(C) : -lg(C); html = `Vor jeder Zugabe: $[${ionV}] = ${f(C)}$ M und <b>pH = ${f2(pHv)}</b>`; }
      } else if (Math.abs(d) < 1e-9 * n0) {
        pHv = pHeq; html = `Es ist der Äquivalenzpunkt: <b>pH = ${f2(pHeq)}</b>`;
      } else if (d > 0) {
        if (debilV) {
          pHv = pKa + (esBase ? -1 : 1) * lg(nt / d);
          const hh = pHv, ex = ph(v);
          html = `Es haben ${f(nt)} mol reagiert und es bleiben ${f(d)} mol ${nomV}: Es ist eine Pufferlösung, $pH = pK_a + log {${esBase ? `n(B)`: `n(A^{−})`}}/{${esBase ? `n(BH^{+})` : `n(HA)`}} = ${f2(pKa)} + log {${f(esBase ? d : nt)}}/{${f(esBase ? nt : d)}}$`;
          if (Math.abs(hh - ex) > 0.02) {
            pHv = ex;
            html += ` = ${f2(hh)}. Aber hier ist eine der beiden Formen so knapp, dass die ${esBase ? 'Protonierung der Base' : 'Dissoziation der Säure'} (oder die Hydrolyse ihres Konjugierten) sie stark verändert und Henderson-Hasselbalch nicht mehr gilt. Löst man das ganze Gleichgewicht mit der Ladungsbilanz, ergibt sich <b>pH = ${f2(pHv)}</b>`;
          } else html += ` = <b>${f2(pHv)}</b>`;
        } else {
          const c = d / Vtot; pHv = esBase ? PKW + lg(c) : -lg(c);
          html = `Es bleiben $${f(n0)} − ${f(nt)} = ${f(d)}$ mol ${esBase ? 'OH⁻' : 'H₃O⁺'} in ${f(V + v)} mL: $[${ionV}] = ${f(c)}$ M und <b>pH = ${f2(pHv)}</b>`;
        }
      } else {
        const c = -d / Vtot; pHv = esBase ? -lg(c) : PKW + lg(c);
        html = `Der Äquivalenzpunkt ist überschritten: Es bleiben $${f(nt)} − ${f(n0)} = ${f(-d)}$ mol ${esBase ? 'H₃O⁺' : 'OH⁻'} in ${f(V + v)} mL, $[${ionT}] = ${f(c)}$ M und <b>pH = ${f2(pHv)}</b>`;
      }
      pasos.push({ t: `Mit ${f(v)} mL Zugabe`, html });
    }
    return { modo: 'valoracion', tipo, nomV, nomT, debilV, esBase, C, V, Ct, K, pKa, Veq, pHeq, ind, adecuados, salto, v, pHv, curva, pH: pHv ?? curva[0][1], ph, pasos };
  }

  function resolver(sc) {
    const T = vacio(sc.T) ? 25 : leeNum(sc.T);
    if (!isFinite(T) || T < 0 || T > 100) throw new Error('Die Temperatur muss zwischen 0 und 100 °C liegen');
    KW = kwDe(T); PKW = KW === 1e-14 ? 14 : -lg(KW);
    const r = elige(sc);
    if (PKW !== 14) r.pasos.unshift({ t: `Wasser bei ${f(T)} °C`, html: `$K_w = ${f(KW)}$, &ensp; $pK_w = ${f2(PKW)}$: Die neutrale Lösung hat pH = ${f2(PKW / 2)} und pH + pOH = ${f2(PKW)}.` });
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
    { clave: 'diluido', nombre: '10⁻⁸ M HCl (basischer pH?)', sc: { modo: 'fuerte', especie: 'acido', C: '1e-8', n: '1' } },
    { clave: 'acetico', nombre: '0,1 M Essigsäure', sc: { modo: 'debil', especie: 'acido', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'amoniaco', nombre: '0,2 M Ammoniak', sc: { modo: 'debil', especie: 'base', C: '0.2', K: '1.8e-5', pK: '' } },
    { clave: 'hf', nombre: '0,01 M Flusssäure (ohne Näherung)', sc: { modo: 'debil', especie: 'acido', C: '0.01', K: '6.8e-4', pK: '' } },
    { clave: 'tampon-acetato', nombre: 'Acetat-Puffer (Essigsäure/Acetat)', sc: { modo: 'tampon', especie: 'acido', K: '1.8e-5', pK: '', Cd: '0.1', Cs: '0.1', anade: 'nada' } },
    { clave: 'tampon-hcl', nombre: 'Acetat-Puffer bei Zusatz von HCl', sc: { modo: 'tampon', especie: 'acido', K: '1.8e-5', pK: '', Cd: '0.1', Cs: '0.1', V: '100', anade: 'acido', Cad: '0.1', Vad: '10' } },
    { clave: 'tampon-amonio', nombre: 'Ammoniak/Ammonium-Puffer', sc: { modo: 'tampon', especie: 'base', K: '1.8e-5', pK: '', Cd: '0.15', Cs: '0.1', anade: 'nada' } },
    { clave: 'mezcla', nombre: 'Mischung aus HCl und NaOH', sc: { modo: 'mezcla', tipo: 'ff', Ca: '0.1', Va: '50', Cb: '0.2', Vb: '30' } },
    { clave: 'mezcla-debil', nombre: 'Mischung aus Essigsäure und NaOH', sc: { modo: 'mezcla', tipo: 'df', Ca: '0.2', Va: '50', Cb: '0.1', Vb: '50', K: '1.8e-5', pK: '' } },
    { clave: 'mezcla-amoniaco', nombre: 'Mischung aus Ammoniak und HCl (nur Salz)', sc: { modo: 'mezcla', tipo: 'fd', Ca: '0.1', Va: '50', Cb: '0.1', Vb: '50', K: '1.8e-5', pK: '' } },
    { clave: 'sal-bicarbonato', nombre: 'Amphoteres Salz: 0,1 M NaHCO₃', sc: { modo: 'sal', tipo: 'anfotera', C: '0.1', K1: '4.5e-7', K2: '4.7e-11', K: '', pK: '' } },
    { clave: 'sal-dihidrogenofosfato', nombre: 'Amphoteres Salz: 0,05 M NaH₂PO₄', sc: { modo: 'sal', tipo: 'anfotera', C: '0.05', K1: '7.1e-3', K2: '6.3e-8', K: '', pK: '' } },
    { clave: 'sal-acetato', nombre: 'Hydrolyse: 0,1 M Natriumacetat', sc: { modo: 'sal', tipo: 'basica', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'sal-amonio', nombre: 'Hydrolyse: 0,1 M Ammoniumchlorid', sc: { modo: 'sal', tipo: 'acida', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'ka-ph', nombre: 'Ka aus dem pH-Wert (0,1 M Säure mit pH 2,87)', sc: { modo: 'inverso', especie: 'acido', fuerza: 'debil', busca: 'K', pHm: '2.87', C: '0.1' } },
    { clave: 'c-ph', nombre: 'Ammoniakkonzentration für pH 11', sc: { modo: 'inverso', especie: 'base', fuerza: 'debil', busca: 'C', pHm: '11', K: '1.8e-5', pK: '' } },
    { clave: 'preparar-acetato', nombre: 'Einen Acetatpuffer mit pH 5 ansetzen', sc: { modo: 'preparar', especie: 'acido', K: '1.8e-5', pK: '', pHo: '5', Cd: '0.1', V: '500', sal: 'CH3COONa' } },
    { clave: 'carbonico', nombre: '0,05 M Kohlensäure (zweiprotonig)', sc: { modo: 'poliprotico', C: '0.05', K1: '4.3e-7', K2: '4.8e-11', K3: '' } },
    { clave: 'sulfurico', nombre: '0,01 M Schwefelsäure mit ihrer Ka₂', sc: { modo: 'poliprotico', C: '0.01', K1: '1e3', K2: '1.2e-2', K3: '' } },
    { clave: 'agua-50', nombre: 'Reines Wasser bei 50 °C (neutral mit pH 6,6?)', sc: { modo: 'fuerte', especie: 'acido', C: '1e-12', n: '1', T: '50' } },
    { clave: 'val-fuerte', nombre: 'Titration von HCl mit NaOH', sc: { modo: 'valoracion', tipo: 'af-bf', C: '0.1', V: '25', Ct: '0.1', Vt: '20' } },
    { clave: 'val-acetico', nombre: 'Titration von Essigsäure mit NaOH', sc: { modo: 'valoracion', tipo: 'ad-bf', C: '0.1', V: '25', Ct: '0.1', K: '1.8e-5', pK: '', Vt: '12.5' } },
    { clave: 'val-fosforico', nombre: 'Titration von Phosphorsäure mit NaOH', sc: { modo: 'valoracion', tipo: 'ap-bf', C: '0.1', V: '20', Ct: '0.1', K1: '7.5e-3', K2: '6.2e-8', K3: '4.8e-13', Vt: '' } },
    { clave: 'val-amoniaco', nombre: 'Titration von Ammoniak mit HCl', sc: { modo: 'valoracion', tipo: 'bd-af', C: '0.1', V: '20', Ct: '0.1', K: '1.8e-5', pK: '', Vt: '30' } },
  ];

  return { resolver, fuerte, debil, tampon, mezcla, valoracion, sal, inverso, preparar, poliprotico, fracciones, exacto, kwDe, ejemplos, INDICADORES, f, f2 };
})();

