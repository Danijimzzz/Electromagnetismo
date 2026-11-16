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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${Mayus(nom)} debe ser un número`);
    if (cero ? v < 0 : v <= 0) throw new Error(`${Mayus(nom)} debe ser ${cero ? 'positivo o cero' : 'mayor que 0'}`);
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
    if (!vacio(sc.pK)) { const p = leeNum(sc.pK); if (!isFinite(p)) throw new Error(`El p${nom} debe ser un número`); return 10 ** -p; }
    throw new Error(`Falta ${nom} (o p${nom})`);
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
  const CLASICOS = ['naranja de metilo', 'rojo de metilo', 'azul de bromotimol', 'fenolftaleína', 'timolftaleína']; // los de clase; el resto se muestra entre los que sirven
  const indicador = (pH) => INDICADORES.filter((q) => CLASICOS.includes(q[0])).reduce((a, b) => (Math.abs((b[1] + b[2]) / 2 - pH) < Math.abs((a[1] + a[2]) / 2 - pH) ? b : a));
  const caracter = (pH) => (pH < PKW / 2 - 0.005 ? 'ácida' : pH > PKW / 2 + 0.005 ? 'básica' : 'neutra');
  const finPH = (pH) => `$pH = ${f2(pH)}$: disolución ${caracter(pH)}.`;
  const desdeH = (h) => `$pH = −log [H_{3}O^{+}] = −log ${f(h)}$ = <b>${f2(-lg(h))}</b>`;
  const desdeOH = (oh) => `$pOH = −log [OH^{−}] = −log ${f(oh)} = ${f2(-lg(oh))}$, &ensp; $pH = ${p14()} − pOH$ = <b>${f2(PKW + lg(oh))}</b>`;
  const raiz = (K, C) => (-K + Math.sqrt(K * K + 4 * K * C)) / 2;

  function fuerte(sc) {
    const base = sc.especie === 'base', C = lee(sc, 'C', 'la concentración'), n = lee(sc, 'n', base ? 'el número de OH⁻' : 'el número de H⁺', { opcional: true }) ?? 1;
    const c = n * C, ion = base ? 'OH^{−}' : 'H_{3}O^{+}';
    const pasos = [{ t: 'Disociación completa', html: `Al ser ${base ? 'una base fuerte' : 'un ácido fuerte'} se disocia del todo${n > 1 ? ` y cada fórmula da ${f(n)} ${base ? 'OH⁻' : 'H⁺'}` : ''}: $[${ion}] = ${n > 1 ? `${f(n)} · ${f(C)}` : f(C)}$ = ${f(c)} M` }];
    let pH;
    if (c < 1e-6) {
      const x = (c + Math.sqrt(c * c + 4 * KW)) / 2;
      pH = base ? PKW + lg(x) : -lg(x);
      pasos.push({ t: 'Muy diluido: cuenta el agua', html: `Con tan poca concentración los iones del agua no son despreciables. Con $[${ion}] = c + [${base ? 'H_{3}O^{+}' : 'OH^{−}'}]$ y $K_w = [H_{3}O^{+}][OH^{−}] = ${PKW === 14 ? '10^{−14}' : f(KW)}$ queda $x^2 − c x − K_w = 0$, $x = ${f(x)}$ M` });
      pasos.push({ t: 'pH', html: base ? desdeOH(x) : desdeH(x) });
    } else {
      pH = base ? PKW + lg(c) : -lg(c);
      pasos.push({ t: 'pH', html: base ? desdeOH(c) : desdeH(c) });
    }
    pasos.push({ t: 'Concentraciones en el equilibrio', html: `$[H_{3}O^{+}] = ${f(10 ** -pH)}$ M, &ensp; $[OH^{−}] = ${f(10 ** (pH - PKW))}$ M. ${finPH(pH)}` });
    return { modo: 'fuerte', base, C, n, pH, h: 10 ** -pH, pasos };
  }

  function debil(sc) {
    const base = sc.especie === 'base', C = lee(sc, 'C', 'la concentración'), K = leeK(sc, base ? 'Kb' : 'Ka');
    const x = raiz(K, C), aprox = Math.sqrt(K * C), alfa = x / C;
    const Kn = base ? 'K_b' : 'K_a';
    const pasos = [
      { t: 'Equilibrio', html: base ? `$B + H_{2}O ⇌ BH^{+} + OH^{−}$<br>inicial: ${f(C)}, 0, 0 &ensp; equilibrio: ${f(C)} − x, x, x` : `$HA + H_{2}O ⇌ A^{−} + H_{3}O^{+}$<br>inicial: ${f(C)}, 0, 0 &ensp; equilibrio: ${f(C)} − x, x, x` },
      { t: 'Constante', html: `$${Kn} = {x^2}/{C − x}$, &ensp; $${f(K)} = {x^2}/{${f(C)} − x}$<br>$x^2 + ${f(K)} x − ${f(K * C)} = 0$, &ensp; $x = {−${Kn} + √(${Kn}^2 + 4 ${Kn} C)}/{2}$ = <b>${f(x)} M</b> = $[${base ? 'OH^{−}' : 'H_{3}O^{+}'}]$` },
      { t: 'pH', html: base ? desdeOH(x) : desdeH(x) },
      { t: 'Grado de disociación', html: `$α = x/C = ${f(x)}/${f(C)}$ = <b>${f(alfa)}</b> (${f(100 * alfa)} %)` },
      { t: 'Con la aproximación', html: `Si se desprecia x frente a C: $x ≈ √(${Kn} C) = √(${f(K)} · ${f(C)}) = ${f(aprox)}$ M, ${alfa < 0.05 ? `que vale porque α < 5 % (error del ${f((100 * (aprox - x)) / x, 2)} %)` : `pero aquí α > 5 % y la aproximación da un error del ${f((100 * (aprox - x)) / x, 2)} %: hay que resolver la ecuación de segundo grado`}.` },
    ];
    const pH = base ? PKW + lg(x) : -lg(x);
    pasos.push({ t: 'Resultado', html: finPH(pH) });
    return { modo: 'debil', base, C, K, pK: -lg(K), x, alfa, pH, h: 10 ** -pH, pasos };
  }

  function tampon(sc) {
    const base = sc.especie === 'base', K = leeK(sc, base ? 'Kb' : 'Ka');
    const Cd = lee(sc, 'Cd', base ? 'la concentración de la base' : 'la concentración del ácido'), Cs = lee(sc, 'Cs', 'la concentración de la sal');
    const pKa = base ? PKW + lg(K) : -lg(K); // del ácido del par
    const cAc = base ? Cs : Cd, cBa = base ? Cd : Cs, Ac = base ? 'BH^{+}' : 'HA', Ba = base ? 'B' : 'A^{−}';
    const pH0 = pKa + lg(cBa / cAc);
    const pasos = [{ t: 'Ecuación de Henderson-Hasselbalch', html: `${base ? `El par es $B/BH^{+}$: $pK_a = ${p14()} − pK_b = ${p14()} − ${f2(-lg(K))} = ${f2(pKa)}$.` : `$pK_a = −log ${f(K)} = ${f2(pKa)}$.`}<br>$pH = pK_a + log {[${Ba}]}/{[${Ac}]} = ${f2(pKa)} + log {${f(cBa)}}/{${f(cAc)}}$ = <b>${f2(pH0)}</b>` }];
    let pH = pH0, pHagua = null, nAc = null, nBa = null;
    const anade = sc.anade === 'acido' || sc.anade === 'base' ? sc.anade : 'nada';
    if (anade !== 'nada') {
      const V = lee(sc, 'V', 'el volumen de la disolución reguladora'), Cad = lee(sc, 'Cad', 'la concentración de lo que se añade'), Vad = lee(sc, 'Vad', 'el volumen que se añade');
      const n = (Cad * Vad) / 1000, nAc0 = (cAc * V) / 1000, nBa0 = (cBa * V) / 1000, Vt = (V + Vad) / 1000;
      nAc = anade === 'acido' ? nAc0 + n : nAc0 - n; nBa = anade === 'acido' ? nBa0 - n : nBa0 + n;
      const ion = anade === 'acido' ? 'H_{3}O^{+}' : 'OH^{−}';
      pasos.push({ t: 'Moles antes de añadir', html: `$n(${Ac}) = ${f(cAc)} · ${f(V / 1000)} = ${f(nAc0)}$ mol, &ensp; $n(${Ba}) = ${f(cBa)} · ${f(V / 1000)} = ${f(nBa0)}$ mol, &ensp; $n(${ion}) = ${f(Cad)} · ${f(Vad / 1000)} = ${f(n)}$ mol` });
      if (nAc <= 0 || nBa <= 0) {
        const sp = base ? { cb: (nAc0 + nBa0) / Vt, Kb: K, cl: nAc0 / Vt } : { ca: (nAc0 + nBa0) / Vt, Ka: K, na: nBa0 / Vt };
        if (anade === 'acido') sp.cl = (sp.cl || 0) + n / Vt; else sp.na = (sp.na || 0) + n / Vt;
        pH = exacto(sp);
        pasos.push({ t: 'Se agota el tampón', html: `Lo que se añade gasta toda la ${anade === 'acido' ? 'forma básica' : 'forma ácida'} del par y sobra: la disolución deja de amortiguar y el pH cambia mucho, hasta <b>${f2(pH)}</b>.` });
      } else {
        pH = pKa + lg(nBa / nAc);
        pasos.push({ t: anade === 'acido' ? 'El ácido reacciona con la forma básica' : 'La base reacciona con la forma ácida', html: `${anade === 'acido' ? `$${Ba} + H_{3}O^{+} → ${Ac}$` : `$${Ac} + OH^{−} → ${Ba}$`}: quedan $n(${Ac}) = ${f(nAc)}$ mol y $n(${Ba}) = ${f(nBa)}$ mol. El volumen es el mismo para los dos, así que se puede usar el cociente de moles:<br>$pH = ${f2(pKa)} + log {${f(nBa)}}/{${f(nAc)}}$ = <b>${f2(pH)}</b>` });
      }
      const c = n / Vt;
      pHagua = anade === 'acido' ? -lg((c + Math.sqrt(c * c + 4 * KW)) / 2) : PKW + lg((c + Math.sqrt(c * c + 4 * KW)) / 2);
      pasos.push({ t: 'Comparado con agua pura', html: `El pH cambia en ${f2(Math.abs(pH - pH0))} unidades. Si lo mismo se echara en ${f(V)} mL de agua pura, el pH pasaría de ${f2(PKW / 2)} a ${f2(pHagua)}.` });
    }
    pasos.push({ t: 'Concentración de H₃O⁺', html: `$[H_{3}O^{+}] = 10^{−pH} = ${f(10 ** -pH)}$ M` });
    pasos.push({ t: 'Capacidad reguladora', html: `Amortiguan bien entre $pH = pK_a ± 1$, de ${f2(pKa - 1)} a ${f2(pKa + 1)}, y mejor cuanto más concentradas estén las dos formas.` });
    return { modo: 'tampon', base, K, pKa, cAc, cBa, pH0, pH, anade, pHagua, nAc, nBa, h: 10 ** -pH, pasos };
  }

  function mezcla(sc) {
    if (sc.tipo === 'df' || sc.tipo === 'fd') return mezclaDebil(sc);
    const Ca = lee(sc, 'Ca', 'la concentración del ácido'), Va = lee(sc, 'Va', 'el volumen del ácido'), Cb = lee(sc, 'Cb', 'la concentración de la base'), Vb = lee(sc, 'Vb', 'el volumen de la base');
    const na = (Ca * Va) / 1000, nb = (Cb * Vb) / 1000, Vt = (Va + Vb) / 1000, d = na - nb;
    const pasos = [
      { t: 'Moles de cada uno', html: `$n(H_{3}O^{+}) = ${f(Ca)} · ${f(Va / 1000)} = ${f(na)}$ mol, &ensp; $n(OH^{−}) = ${f(Cb)} · ${f(Vb / 1000)} = ${f(nb)}$ mol` },
      { t: 'Neutralización', html: `$H_{3}O^{+} + OH^{−} → 2 H_{2}O$. ${Math.abs(d) < 1e-12 * Math.max(na, nb) ? 'Hay los mismos moles de los dos: se neutralizan del todo.' : `Sobran ${f(Math.abs(d))} mol de ${d > 0 ? 'H₃O⁺' : 'OH⁻'} en $V = ${f(Va)} + ${f(Vb)} = ${f(Va + Vb)}$ mL.`}` },
    ];
    let pH;
    if (Math.abs(d) < 1e-12 * Math.max(na, nb)) { pH = PKW / 2; pasos.push({ t: 'pH', html: `Solo queda agua y una sal que no se hidroliza: <b>pH = ${f2(PKW / 2)}</b>${PKW === 14 ? '' : ', el neutro a esta temperatura'}.` }); } else {
      const c = Math.abs(d) / Vt;
      pasos.push({ t: 'Concentración del que sobra', html: `$[${d > 0 ? 'H_{3}O^{+}' : 'OH^{−}'}] = ${f(Math.abs(d))}/${f(Vt)}$ = ${f(c)} M` });
      pH = d > 0 ? -lg(c) : PKW + lg(c);
      pasos.push({ t: 'pH', html: d > 0 ? desdeH(c) : desdeOH(c) });
    }
    pasos.push({ t: 'Resultado', html: finPH(pH) });
    return { modo: 'mezcla', Ca, Va, Cb, Vb, na, nb, pH, h: 10 ** -pH, pasos };
  }

  const contrasta = (pH, sp, pasos, porque) => {
    const ex = exacto(sp);
    if (Math.abs(ex - pH) <= 0.02) return pH;
    pasos.push({ t: 'Comprobación con el equilibrio entero', html: `${porque} Resolviendo el balance de cargas completo sale <b>pH = ${f2(ex)}</b> (la cuenta de clase daba ${f2(pH)}).` });
    return ex;
  };

  function mezclaDebil(sc) {
    const df = sc.tipo === 'df', K = leeK(sc, df ? 'Ka' : 'Kb');
    const Ca = lee(sc, 'Ca', `la concentración del ácido${df ? ' débil' : ''}`), Va = lee(sc, 'Va', 'el volumen del ácido'), Cb = lee(sc, 'Cb', `la concentración de la base${df ? '' : ' débil'}`), Vb = lee(sc, 'Vb', 'el volumen de la base');
    const na = (Ca * Va) / 1000, nb = (Cb * Vb) / 1000, Vt = (Va + Vb) / 1000;
    const nD = df ? na : nb, nF = df ? nb : na; // moles del débil y del fuerte
    const D = df ? 'HA' : 'B', C = df ? 'A^{−}' : 'BH^{+}', F = df ? 'OH^{−}' : 'H_{3}O^{+}';
    const pKa = df ? -lg(K) : PKW + lg(K);
    const pasos = [
      { t: 'Moles de cada uno', html: `$n(${D}) = ${f(df ? Ca : Cb)} · ${f((df ? Va : Vb) / 1000)} = ${f(nD)}$ mol, &ensp; $n(${F}) = ${f(df ? Cb : Ca)} · ${f((df ? Vb : Va) / 1000)} = ${f(nF)}$ mol` },
      { t: 'Reacción', html: `El fuerte reacciona entero con el débil: $${D} + ${F} → ${C}${df ? ' + H_{2}O' : ' + H_{2}O'}$. ${Math.abs(nD - nF) < 1e-12 * nD ? 'Hay los mismos moles: solo queda la sal.' : nF < nD ? `Se forman ${f(nF)} mol de ${df ? 'A⁻' : 'BH⁺'} y quedan ${f(nD - nF)} mol de ${D}.` : `Se gasta todo el ${D} y sobran ${f(nF - nD)} mol de ${df ? 'OH⁻' : 'H₃O⁺'}.`}` },
    ];
    const sp = df ? { ca: na / Vt, Ka: K, na: nb / Vt } : { cb: nb / Vt, Kb: K, cl: na / Vt };
    let pH, caso;
    if (Math.abs(nD - nF) < 1e-12 * nD) {
      caso = 'sal';
      const cs = nD / Vt, Kh = KW / K, x = raiz(Kh, cs);
      pH = df ? PKW + lg(x) : -lg(x);
      pasos.push({ t: 'Hidrólisis de la sal', html: `$[${C}] = ${f(nD)}/${f(Vt)} = ${f(cs)}$ M, que se hidroliza con $${df ? 'K_b' : 'K_a'} = K_w/${df ? 'K_a' : 'K_b'} = ${f(Kh)}$: $x = ${f(x)}$ M de ${df ? 'OH⁻' : 'H₃O⁺'} y <b>pH = ${f2(pH)}</b>` });
    } else if (nF < nD) {
      caso = 'tampon';
      pH = pKa + lg(df ? nF / (nD - nF) : (nD - nF) / nF);
      pasos.push({ t: 'Queda una disolución reguladora', html: `${df ? '' : `$pK_a = ${p14()} − pK_b = ${f2(pKa)}$. `}$pH = pK_a + log {n(${df ? 'A^{−}' : 'B'})}/{n(${df ? 'HA' : 'BH^{+}'})} = ${f2(pKa)} + log {${f(df ? nF : nD - nF)}}/{${f(df ? nD - nF : nF)}}$ = <b>${f2(pH)}</b>` });
      pH = contrasta(pH, sp, pasos, 'Una de las dos formas es muy escasa y Henderson-Hasselbalch no vale.');
    } else {
      caso = 'exceso';
      const c = (nF - nD) / Vt;
      pH = df ? PKW + lg(c) : -lg(c);
      pasos.push({ t: 'Manda el fuerte que sobra', html: `$[${F}] = ${f(nF - nD)}/${f(Vt)} = ${f(c)}$ M (la hidrólisis de la sal es despreciable frente a él): ${df ? desdeOH(c) : desdeH(c)}` });
      pH = contrasta(pH, sp, pasos, 'Sobra tan poco que la hidrólisis de la sal ya no es despreciable.');
    }
    pasos.push({ t: 'Resultado', html: finPH(pH) });
    return { modo: 'mezcla', tipo: sc.tipo, caso, K, pKa, Ca, Va, Cb, Vb, na, nb, pH, h: 10 ** -pH, pasos };
  }

  function anfotera(sc) {
    const C = lee(sc, 'C', 'la concentración de la sal'), K1 = lee(sc, 'K1', 'Ka₁ (del ácido H₂A)'), K2 = lee(sc, 'K2', 'Ka₂ (de HA⁻)');
    if (K2 >= K1) throw new Error('Ka₁ tiene que ser mayor que Ka₂');
    const pH0 = (-lg(K1) - lg(K2)) / 2, h = Math.sqrt((K1 * (K2 * C + KW)) / (K1 + C)), pH = -lg(h), pasos = [];
    pasos.push({ t: 'Anión anfótero', html: `El anión $HA^{−}$ se comporta como ácido ($HA^{−} + H_{2}O ⇌ A^{2−} + H_{3}O^{+}$, $K_{a2} = ${f(K2)}$) y como base ($HA^{−} + H_{2}O ⇌ H_{2}A + OH^{−}$, $K_b = K_w/K_{a1} = ${f(KW / K1)}$). El catión (Na⁺) no influye.` });
    pasos.push({ t: 'Aproximación de clase', html: `Las dos reacciones se compensan y el pH no depende de la concentración: $pH ≈ {pK_{a1} + pK_{a2}}/2 = {${f2(-lg(K1))} + ${f2(-lg(K2))}}/2$ = <b>${f2(pH0)}</b>.` });
    pasos.push({ t: 'Comprobación con la fórmula completa', html: `Con el balance de cargas sin aproximar, $[H_{3}O^{+}] = \sqrt{K_{a1}(K_{a2}C + K_w)/(K_{a1} + C)} = ${f(h)}$ M ⇒ <b>pH = ${f2(pH)}</b> (la aproximación se aparta ${f2(Math.abs(pH - pH0))} unidades).` });
    pasos.push({ t: 'Cuándo vale', html: Math.abs(pH - pH0) < 0.05 ? 'La aproximación es buena: $C ≫ K_{a1}$... y $K_{a2}C ≫ K_w$.' : 'Aquí la aproximación empieza a fallar: la concentración es muy baja ($C$ no es mucho mayor que $K_{a1}$) o $K_{a2}C$ no supera a $K_w$. Usa el valor de la fórmula completa.' });
    return { modo: 'sal', tipo: 'anfotera', C, K1, K2, pH, pH0, h, alfa: null, pasos };
  }
  function sal(sc) {
    if (sc.tipo === 'anfotera') return anfotera(sc);
    const tipo = ['basica', 'acida', 'neutra'].includes(sc.tipo) ? sc.tipo : 'basica', C = lee(sc, 'C', 'la concentración de la sal'), pasos = [];
    if (tipo === 'neutra') {
      pasos.push({ t: 'Sal de ácido fuerte y base fuerte', html: `Sus iones (como Na⁺ y Cl⁻) son conjugados de un ácido y una base fuertes: son tan débiles que no reaccionan con el agua. La disolución tiene el pH del agua: <b>pH = ${f2(PKW / 2)}</b>.` });
      return { modo: 'sal', tipo, C, pH: PKW / 2, h: 10 ** (-PKW / 2), pasos };
    }
    const bas = tipo === 'basica', K = leeK(sc, bas ? 'Ka' : 'Kb'), Kh = KW / K, x = raiz(Kh, C), pH = bas ? PKW + lg(x) : -lg(x);
    pasos.push({ t: 'Qué ion se hidroliza', html: bas ? `El anión A⁻ es la base conjugada de un ácido débil y reacciona con el agua: $A^{−} + H_{2}O ⇌ HA + OH^{−}$. El catión (Na⁺, K⁺) no se hidroliza.` : `El catión BH⁺ (como el NH₄⁺) es el ácido conjugado de una base débil: $BH^{+} + H_{2}O ⇌ B + H_{3}O^{+}$. El anión (Cl⁻, NO₃⁻) no se hidroliza.` });
    pasos.push({ t: 'Constante de hidrólisis', html: `$${bas ? 'K_b' : 'K_a'} = {K_w}/{${bas ? 'K_a' : 'K_b'}} = {${PKW === 14 ? '10^{−14}' : f(KW)}}/{${f(K)}} = ${f(Kh)}$` });
    pasos.push({ t: 'Equilibrio', html: `$${f(Kh)} = {x^2}/{${f(C)} − x}$ → $x = ${f(x)}$ M = $[${bas ? 'OH^{−}' : 'H_{3}O^{+}'}]$ (grado de hidrólisis ${f((100 * x) / C)} %)` });
    pasos.push({ t: 'pH', html: bas ? desdeOH(x) : desdeH(x) });
    pasos.push({ t: 'Resultado', html: finPH(pH) });
    return { modo: 'sal', tipo, C, K, Kh, x, alfa: x / C, pH, h: 10 ** -pH, pasos };
  }

  function inverso(sc) {
    const base = sc.especie === 'base', pHm = lee(sc, 'pHm', 'el pH', { cero: true }), ion = base ? 'OH^{−}' : 'H_{3}O^{+}';
    if (pHm > PKW) throw new Error(`El pH tiene que estar entre 0 y ${p14()}`);
    if (base ? pHm <= PKW / 2 : pHm >= PKW / 2) throw new Error(`Con pH ${f2(pHm)} la disolución no es ${base ? 'básica' : 'ácida'}`);
    const x = base ? 10 ** (pHm - PKW) : 10 ** -pHm, pasos = [];
    pasos.push({ t: `La concentración de ${base ? 'OH⁻' : 'H₃O⁺'}`, html: base ? `$pOH = ${p14()} − ${f2(pHm)} = ${f2(PKW - pHm)}$, &ensp; $[OH^{−}] = 10^{−pOH} = ${f(x)}$ M` : `$[H_{3}O^{+}] = 10^{−pH} = 10^{−${f2(pHm)}} = ${f(x)}$ M` });
    if (sc.fuerza === 'fuerte') {
      const n = lee(sc, 'n', 'el número de H⁺ u OH⁻', { opcional: true }) ?? 1, C = x / n;
      pasos.push({ t: 'Concentración', html: `Se disocia del todo${n > 1 ? ` y da ${f(n)} iones por fórmula` : ''}: $C = [${ion}]${n > 1 ? `/${f(n)}` : ''}$ = <b>${f(C)} M</b>` });
      return { modo: 'inverso', base, pH: pHm, x, C, h: 10 ** -pHm, pasos };
    }
    const Kn = base ? 'K_b' : 'K_a';
    if (sc.busca === 'C') {
      const K = leeK(sc, base ? 'Kb' : 'Ka'), C = (x * x) / K + x;
      pasos.push({ t: 'Concentración inicial', html: `De $${Kn} = {x^2}/{C − x}$: $C = {x^2}/{${Kn}} + x = {(${f(x)})^2}/{${f(K)}} + ${f(x)}$ = <b>${f(C)} M</b>` });
      pasos.push({ t: 'Grado de disociación', html: `$α = x/C = ${f(x / C)}$ (${f((100 * x) / C)} %)` });
      return { modo: 'inverso', base, pH: pHm, x, C, K, alfa: x / C, h: 10 ** -pHm, pasos };
    }
    const C = lee(sc, 'C', 'la concentración inicial');
    if (!(x < C)) throw new Error(`Con ${f(C)} M no puede haber ${f(x)} M de ${base ? 'OH⁻' : 'H₃O⁺'}: o es fuerte o falla un dato`);
    const K = (x * x) / (C - x);
    pasos.push({ t: 'Equilibrio', html: base ? `$B + H_{2}O ⇌ BH^{+} + OH^{−}$: en el equilibrio $[BH^{+}] = [OH^{−}] = x$ y $[B] = C − x$` : `$HA + H_{2}O ⇌ A^{−} + H_{3}O^{+}$: en el equilibrio $[A^{−}] = [H_{3}O^{+}] = x$ y $[HA] = C − x$` });
    pasos.push({ t: 'Constante', html: `$${Kn} = {x^2}/{C − x} = {(${f(x)})^2}/{${f(C)} − ${f(x)}}$ = <b>${f(K)}</b>, &ensp; $p${Kn} = ${f2(-lg(K))}$` });
    pasos.push({ t: 'Grado de disociación', html: `$α = x/C = ${f(x)}/${f(C)}$ = <b>${f(x / C)}</b> (${f((100 * x) / C)} %)` });
    return { modo: 'inverso', base, pH: pHm, x, C, K, pK: -lg(K), alfa: x / C, h: 10 ** -pHm, pasos };
  }

  function preparar(sc) {
    const base = sc.especie === 'base', K = leeK(sc, base ? 'Kb' : 'Ka'), pHo = lee(sc, 'pHo', 'el pH que se quiere', { cero: true });
    const Cd = lee(sc, 'Cd', base ? 'la concentración de la base' : 'la concentración del ácido'), V = lee(sc, 'V', 'el volumen que se prepara');
    const pKa = base ? PKW + lg(K) : -lg(K), r = 10 ** (pHo - pKa); // [forma básica]/[forma ácida]
    const Cs = base ? Cd / r : Cd * r, ns = (Cs * V) / 1000, pasos = [];
    const Ac = base ? 'BH^{+}' : 'HA', Ba = base ? 'B' : 'A^{−}';
    pasos.push({ t: 'Cociente de las dos formas', html: `${base ? `$pK_a = ${p14()} − pK_b = ${f2(pKa)}$. ` : `$pK_a = ${f2(pKa)}$. `}De Henderson-Hasselbalch, $log {[${Ba}]}/{[${Ac}]} = pH − pK_a = ${f2(pHo)} − ${f2(pKa)} = ${f2(pHo - pKa)}$ → ${'$'}{[${Ba}]}/{[${Ac}]} = 10^{${f2(pHo - pKa)}}$ = <b>${f(r)}</b>` });
    pasos.push({ t: 'Concentración de la sal', html: `$[${base ? 'BH^{+}' : 'A^{−}'}] = ${base ? `${f(Cd)}/${f(r)}` : `${f(r)} · ${f(Cd)}`}$ = <b>${f(Cs)} M</b>; en ${f(V)} mL son $n = ${f(Cs)} · ${f(V / 1000)}$ = <b>${f(ns)} mol</b>` });
    let masa = null, M = null;
    if (!vacio(sc.sal) && typeof Formulas !== 'undefined') {
      try { M = Formulas.masaMolar(sc.sal).M; } catch (e) { throw new Error(`La sal: ${e.message}`); }
      masa = ns * M;
      pasos.push({ t: 'Masa de sal', html: `M(${Formulas.leer(sc.sal).html}) = ${f(M, 4)} g/mol → m = ${f(ns)} · ${f(M, 4)}$ = <b>${f(masa)} g</b>`.replace('$ = <b>', ' = <b>') });
    }
    if (Math.abs(pHo - pKa) > 1) pasos.push({ t: 'Aviso', html: `El pH pedido está a más de una unidad del pK<sub>a</sub> (${f2(pKa)}): una de las dos formas es mucho más abundante y el tampón amortiguará mal. Conviene un par con pK<sub>a</sub> más cercano.` });
    pasos.push({ t: 'Cómo se prepara', html: `En un matraz de ${f(V)} mL: ${base ? 'la base' : 'el ácido'} hasta ${f(Cd)} M y ${masa !== null ? `${f(masa)} g de la sal` : `${f(ns)} mol de la sal`}, y se enrasa con agua.` });
    return { modo: 'preparar', base, K, pKa, pH: pHo, cociente: r, Cs, ns, masa, M, h: 10 ** -pHo, pasos };
  }

  const fracciones = (Kas, pH) => { const h = 10 ** -pH, t = [1]; Kas.forEach((K, i) => t.push((t[i] * K) / h)); const den = t.reduce((a, b) => a + b, 0); return t.map((v) => v / den); };
  const leeKas = (sc) => {
    const Kas = [lee(sc, 'K1', 'Ka₁'), lee(sc, 'K2', 'Ka₂')], K3 = lee(sc, 'K3', 'Ka₃', { opcional: true });
    if (K3 !== null) Kas.push(K3);
    if (Kas.some((K, i) => i && K >= Kas[i - 1])) throw new Error('Las constantes tienen que ir de mayor a menor: Ka₁ > Ka₂ > Ka₃');
    return Kas;
  };
  function poliprotico(sc) {
    const C = lee(sc, 'C', 'la concentración'), Kas = leeKas(sc), pasos = [];
    const x1 = raiz(Kas[0], C), pH1 = -lg(x1), pH = exacto({ cp: C, Kas });
    const nom = Kas.length === 2 ? ['H_{2}A', 'HA^{−}', 'A^{2−}'] : ['H_{3}A', 'H_{2}A^{−}', 'HA^{2−}', 'A^{3−}'];
    pasos.push({ t: 'Primera disociación', html: `$${nom[0]} + H_{2}O ⇌ ${nom[1]} + H_{3}O^{+}$, &ensp; $K_{a1} = ${f(Kas[0])}$. Como las demás constantes son mucho menores, casi todo el H₃O⁺ sale de aquí: $x = {−K_{a1} + √(K_{a1}^2 + 4 K_{a1} C)}/{2} = ${f(x1)}$ M, $pH ≈ ${f2(pH1)}$` });
    pasos.push({ t: 'Segunda disociación', html: `$${nom[1]} ⇌ ${nom[2]} + H_{3}O^{+}$. Con $[${nom[1]}] ≈ [H_{3}O^{+}]$, queda $[${nom[2]}] ≈ K_{a2} = ${f(Kas[1])}$ M: aporta muy poco H₃O⁺${Kas[1] / x1 > 0.05 ? ' (aquí no tan poco, porque Ka₂ no es tan pequeña: por eso el pH exacto cambia)' : ''}.` });
    const h = 10 ** -pH, t = [1]; Kas.forEach((K, i) => t.push((t[i] * K) / h)); const den = t.reduce((a, b) => a + b, 0);
    const conc = t.map((v) => (C * v) / den);
    pasos.push({ t: 'Con el balance de cargas completo', html: `<b>pH = ${f2(pH)}</b>. Concentraciones: ${conc.map((c, i) => `$[${nom[i]}] = ${f(c)}$ M`).join(', ')}.` });
    pasos.push({ t: 'Resultado', html: finPH(pH) });
    return { modo: 'poliprotico', C, Kas, pH, pH1, conc, h, alfa: fracciones(Kas, pH), pasos };
  }

  const TIPOS = { 'af-bf': ['ácido fuerte', 'base fuerte', false, false], 'ad-bf': ['ácido débil', 'base fuerte', true, false], 'bf-af': ['base fuerte', 'ácido fuerte', false, true], 'bd-af': ['base débil', 'ácido fuerte', true, true] };
  function valoracionPoli(sc) {
    const C = lee(sc, 'C', 'la concentración del ácido'), V = lee(sc, 'V', 'el volumen valorado'), Ct = lee(sc, 'Ct', 'la concentración del valorante'), Kas = leeKas(sc);
    const np = Kas.length, n0 = (C * V) / 1000, Veq = (C * V) / Ct;
    const ph = (v) => { const Vt = (V + v) / 1000; return exacto({ cp: n0 / Vt, Kas, na: (Ct * v) / 1000 / Vt }); };
    const curva = []; for (let i = 0; i <= 240; i++) { const v = ((np + 1) * Veq * i) / 240; curva.push([v, ph(v)]); }
    const pK = Kas.map((K) => -lg(K)), pasos = [];
    pasos.push({ t: 'Puntos de equivalencia', html: `Cada protón da una equivalencia: $V_{eq,1} = {C V}/{C_t} = {${f(C)} · ${f(V)}}/{${f(Ct)}}$ = <b>${f(Veq)} mL</b>${Kas.slice(1).map((_, i) => `, $V_{eq,${i + 2}} = ${i + 2} V_{eq,1}$ = <b>${f((i + 2) * Veq)} mL</b>`).join('')}` });
    pasos.push({ t: 'A mitad de cada tramo', html: pK.map((p, i) => `con ${f((i + 0.5) * Veq)} mL, $pH ≈ pK_{a${i + 1}} = ${f2(p)}$ (exacto: ${f2(ph((i + 0.5) * Veq))})`).join('; ') + '. Cuanto más pequeña es la constante, peor funciona la aproximación.' });
    const eqs = Kas.slice(0, -1).map((_, i) => (pK[i] + pK[i + 1]) / 2);
    if (eqs.length) pasos.push({ t: 'Equivalencias intermedias', html: eqs.map((p, i) => `en la ${i + 1}.ª queda el anfótero y $pH ≈ (pK_{a${i + 1}} + pK_{a${i + 2}})/2 = ${f2(p)}$ (exacto: ${f2(ph((i + 1) * Veq))})`).join('; ') + '.' });
    const pHeq = ph(np * Veq), ind = indicador(pHeq);
    pasos.push({ t: 'Última equivalencia', html: `Queda el anión $A^{${np}−}$, que se hidroliza: <b>pH = ${f2(pHeq)}</b>. Indicador: ${ind[0]}, de ${ind[3]} a ${ind[4]} entre ${f(ind[1])} y ${f(ind[2])}.` });
    const v = lee(sc, 'Vt', 'el volumen añadido', { opcional: true, cero: true });
    const pHv = v === null ? null : ph(v);
    if (v !== null) pasos.push({ t: `Con ${f(v)} mL añadidos`, html: `Con el balance de cargas: <b>pH = ${f2(pHv)}</b>` });
    return { modo: 'valoracion', tipo: 'ap-bf', poli: true, nomV: 'ácido poliprótico', nomT: 'base fuerte', debilV: true, esBase: false, C, V, Ct, Kas, pKa: pK[0], pKs: pK, Veq, Veqs: Kas.map((_, i) => (i + 1) * Veq), pHeq, ind, v, pHv, curva, pH: pHv ?? curva[0][1], ph, pasos };
  }
  function valoracion(sc) {
    if (sc.tipo === 'ap-bf') return valoracionPoli(sc);
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'af-bf', [nomV, nomT, debilV, esBase] = TIPOS[tipo];
    const C = lee(sc, 'C', `la concentración del ${nomV.split(' ')[0]}`), V = lee(sc, 'V', 'el volumen valorado'), Ct = lee(sc, 'Ct', 'la concentración del valorante');
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
    const pasos = [{ t: 'Punto de equivalencia', html: `Cuando los moles de valorante igualan a los del ${nomV}: $C V = C_t V_{eq}$, $V_{eq} = {C V}/{C_t} = {${f(C)} · ${f(V)}}/{${f(Ct)}}$ = <b>${f(Veq)} mL</b>` }];
    const pKa = debilV ? (esBase ? PKW + lg(K) : -lg(K)) : null;
    let pHeq;
    if (!debilV) {
      pHeq = PKW / 2;
      pasos.push({ t: 'pH en la equivalencia', html: `Se forma una sal de ácido fuerte y base fuerte, que no se hidroliza: <b>pH = ${f2(pHeq)}</b>.` });
    } else {
      const cs = n0 / ((V + Veq) / 1000), Kh = KW / K, x = raiz(Kh, cs);
      pHeq = esBase ? -lg(x) : PKW + lg(x);
      pasos.push({ t: 'pH en la equivalencia', html: `Todo el ${nomV} se ha convertido en su ${esBase ? 'ácido conjugado, $BH^{+}$' : 'base conjugada, $A^{−}$'}, con $c = ${f(n0)}/${f((V + Veq) / 1000)} = ${f(cs)}$ M, que se hidroliza con $${esBase ? 'K_a' : 'K_b'} = K_w/${esBase ? 'K_b' : 'K_a'} = ${f(Kh)}$: $x = ${f(x)}$ M de ${esBase ? 'H₃O⁺' : 'OH⁻'}, y <b>pH = ${f2(pHeq)}</b>, ${esBase ? 'ácido' : 'básico'}.` });
    }
    const ind = indicador(pHeq);
    const salto = [ph(Veq * 0.999), ph(Veq * 1.001)].sort((x, y) => x - y), adecuados = INDICADORES.filter((q) => Math.min(q[2], salto[1]) - Math.max(q[1], salto[0]) >= 0.5 * (q[2] - q[1]));
    pasos.push({ t: 'Indicador', html: `Hace falta uno que vire cerca de pH ${f2(pHeq)}: ${ind[0]}, que pasa de ${ind[3]} a ${ind[4]} entre ${f(ind[1])} y ${f(ind[2])}.` });
    pasos.push({ t: '¿Qué indicadores sirven?', html: `El salto de pH al pasar del 99,9 % al 100,1 % del valorante va de ${f2(salto[0])} a ${f2(salto[1])}. Sirven los indicadores que viran dentro de ese salto: ${adecuados.length ? adecuados.map((q) => `${q[0]} (${f(q[1])}–${f(q[2])})`).join(', ') : 'ninguno de la lista (el salto es demasiado estrecho para un indicador visual: conviene un pH-metro)'}.` });
    if (debilV) pasos.push({ t: 'A mitad de la valoración', html: `Con $V = V_{eq}/2 = ${f(Veq / 2)}$ mL hay la misma cantidad de la forma ácida y de la básica: es una disolución reguladora con <b>pH = pK<sub>a</sub> = ${f2(pKa)}</b>${esBase ? ' (del ácido conjugado)' : ''}. Así se mide la constante de un ácido o una base.` });
    const v = lee(sc, 'Vt', 'el volumen añadido', { opcional: true, cero: true });
    let pHv = null;
    if (v !== null) {
      const Vtot = (V + v) / 1000, nt = (Ct * v) / 1000, d = n0 - nt, ionV = esBase ? 'OH^{−}' : 'H_{3}O^{+}', ionT = esBase ? 'H_{3}O^{+}' : 'OH^{−}';
      let html;
      if (v === 0) {
        if (debilV) { const x = raiz(K, C); pHv = esBase ? PKW + lg(x) : -lg(x); html = `Antes de añadir nada es ${esBase ? 'una base débil' : 'un ácido débil'}: $x = ${f(x)}$ M y <b>pH = ${f2(pHv)}</b>`; } else { pHv = esBase ? PKW + lg(C) : -lg(C); html = `Antes de añadir nada: $[${ionV}] = ${f(C)}$ M y <b>pH = ${f2(pHv)}</b>`; }
      } else if (Math.abs(d) < 1e-9 * n0) {
        pHv = pHeq; html = `Es el punto de equivalencia: <b>pH = ${f2(pHeq)}</b>`;
      } else if (d > 0) {
        if (debilV) {
          pHv = pKa + (esBase ? -1 : 1) * lg(nt / d);
          const hh = pHv, ex = ph(v);
          html = `Ha reaccionado ${f(nt)} mol y quedan ${f(d)} mol de ${nomV}: es una disolución reguladora, $pH = pK_a + log {${esBase ? `n(B)`: `n(A^{−})`}}/{${esBase ? `n(BH^{+})` : `n(HA)`}} = ${f2(pKa)} + log {${f(esBase ? d : nt)}}/{${f(esBase ? nt : d)}}$`;
          if (Math.abs(hh - ex) > 0.02) {
            pHv = ex;
            html += ` = ${f2(hh)}. Pero aquí una de las dos formas es tan escasa que la ${esBase ? 'protonación de la base' : 'disociación del ácido'} (o la hidrólisis de su conjugado) la cambia mucho, y Henderson-Hasselbalch ya no vale. Resolviendo el equilibrio entero con el balance de cargas sale <b>pH = ${f2(pHv)}</b>`;
          } else html += ` = <b>${f2(pHv)}</b>`;
        } else {
          const c = d / Vtot; pHv = esBase ? PKW + lg(c) : -lg(c);
          html = `Quedan $${f(n0)} − ${f(nt)} = ${f(d)}$ mol de ${esBase ? 'OH⁻' : 'H₃O⁺'} en ${f(V + v)} mL: $[${ionV}] = ${f(c)}$ M y <b>pH = ${f2(pHv)}</b>`;
        }
      } else {
        const c = -d / Vtot; pHv = esBase ? -lg(c) : PKW + lg(c);
        html = `Ya se ha pasado la equivalencia: sobran $${f(nt)} − ${f(n0)} = ${f(-d)}$ mol de ${esBase ? 'H₃O⁺' : 'OH⁻'} en ${f(V + v)} mL, $[${ionT}] = ${f(c)}$ M y <b>pH = ${f2(pHv)}</b>`;
      }
      pasos.push({ t: `Con ${f(v)} mL añadidos`, html });
    }
    return { modo: 'valoracion', tipo, nomV, nomT, debilV, esBase, C, V, Ct, K, pKa, Veq, pHeq, ind, adecuados, salto, v, pHv, curva, pH: pHv ?? curva[0][1], ph, pasos };
  }

  function resolver(sc) {
    const T = vacio(sc.T) ? 25 : leeNum(sc.T);
    if (!isFinite(T) || T < 0 || T > 100) throw new Error('La temperatura tiene que estar entre 0 y 100 °C');
    KW = kwDe(T); PKW = KW === 1e-14 ? 14 : -lg(KW);
    const r = elige(sc);
    if (PKW !== 14) r.pasos.unshift({ t: `Agua a ${f(T)} °C`, html: `$K_w = ${f(KW)}$, &ensp; $pK_w = ${f2(PKW)}$: la disolución neutra tiene pH = ${f2(PKW / 2)} y pH + pOH = ${f2(PKW)}.` });
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
    { clave: 'diluido', nombre: 'HCl 10⁻⁸ M (¿pH básico?)', sc: { modo: 'fuerte', especie: 'acido', C: '1e-8', n: '1' } },
    { clave: 'acetico', nombre: 'Ácido acético 0,1 M', sc: { modo: 'debil', especie: 'acido', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'amoniaco', nombre: 'Amoniaco 0,2 M', sc: { modo: 'debil', especie: 'base', C: '0.2', K: '1.8e-5', pK: '' } },
    { clave: 'hf', nombre: 'Ácido fluorhídrico 0,01 M (sin aproximar)', sc: { modo: 'debil', especie: 'acido', C: '0.01', K: '6.8e-4', pK: '' } },
    { clave: 'tampon-acetato', nombre: 'Tampón acético/acetato', sc: { modo: 'tampon', especie: 'acido', K: '1.8e-5', pK: '', Cd: '0.1', Cs: '0.1', anade: 'nada' } },
    { clave: 'tampon-hcl', nombre: 'Tampón acetato al añadir HCl', sc: { modo: 'tampon', especie: 'acido', K: '1.8e-5', pK: '', Cd: '0.1', Cs: '0.1', V: '100', anade: 'acido', Cad: '0.1', Vad: '10' } },
    { clave: 'tampon-amonio', nombre: 'Tampón amoniaco/amonio', sc: { modo: 'tampon', especie: 'base', K: '1.8e-5', pK: '', Cd: '0.15', Cs: '0.1', anade: 'nada' } },
    { clave: 'mezcla', nombre: 'Mezcla de HCl y NaOH', sc: { modo: 'mezcla', tipo: 'ff', Ca: '0.1', Va: '50', Cb: '0.2', Vb: '30' } },
    { clave: 'mezcla-debil', nombre: 'Mezcla de ácido acético y NaOH', sc: { modo: 'mezcla', tipo: 'df', Ca: '0.2', Va: '50', Cb: '0.1', Vb: '50', K: '1.8e-5', pK: '' } },
    { clave: 'mezcla-amoniaco', nombre: 'Mezcla de amoniaco y HCl (todo sal)', sc: { modo: 'mezcla', tipo: 'fd', Ca: '0.1', Va: '50', Cb: '0.1', Vb: '50', K: '1.8e-5', pK: '' } },
    { clave: 'sal-bicarbonato', nombre: 'Sal anfótera: NaHCO₃ 0,1 M', sc: { modo: 'sal', tipo: 'anfotera', C: '0.1', K1: '4.5e-7', K2: '4.7e-11', K: '', pK: '' } },
    { clave: 'sal-dihidrogenofosfato', nombre: 'Sal anfótera: NaH₂PO₄ 0,05 M', sc: { modo: 'sal', tipo: 'anfotera', C: '0.05', K1: '7.1e-3', K2: '6.3e-8', K: '', pK: '' } },
    { clave: 'sal-acetato', nombre: 'Hidrólisis: acetato de sodio 0,1 M', sc: { modo: 'sal', tipo: 'basica', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'sal-amonio', nombre: 'Hidrólisis: cloruro de amonio 0,1 M', sc: { modo: 'sal', tipo: 'acida', C: '0.1', K: '1.8e-5', pK: '' } },
    { clave: 'ka-ph', nombre: 'Ka a partir del pH (ácido 0,1 M con pH 2,87)', sc: { modo: 'inverso', especie: 'acido', fuerza: 'debil', busca: 'K', pHm: '2.87', C: '0.1' } },
    { clave: 'c-ph', nombre: 'Concentración de amoniaco para pH 11', sc: { modo: 'inverso', especie: 'base', fuerza: 'debil', busca: 'C', pHm: '11', K: '1.8e-5', pK: '' } },
    { clave: 'preparar-acetato', nombre: 'Preparar un tampón acetato de pH 5', sc: { modo: 'preparar', especie: 'acido', K: '1.8e-5', pK: '', pHo: '5', Cd: '0.1', V: '500', sal: 'CH3COONa' } },
    { clave: 'carbonico', nombre: 'Ácido carbónico 0,05 M (diprótico)', sc: { modo: 'poliprotico', C: '0.05', K1: '4.3e-7', K2: '4.8e-11', K3: '' } },
    { clave: 'sulfurico', nombre: 'Ácido sulfúrico 0,01 M con su Ka₂', sc: { modo: 'poliprotico', C: '0.01', K1: '1e3', K2: '1.2e-2', K3: '' } },
    { clave: 'agua-50', nombre: 'Agua pura a 50 °C (¿neutra con pH 6,6?)', sc: { modo: 'fuerte', especie: 'acido', C: '1e-12', n: '1', T: '50' } },
    { clave: 'val-fuerte', nombre: 'Valoración de HCl con NaOH', sc: { modo: 'valoracion', tipo: 'af-bf', C: '0.1', V: '25', Ct: '0.1', Vt: '20' } },
    { clave: 'val-acetico', nombre: 'Valoración de ácido acético con NaOH', sc: { modo: 'valoracion', tipo: 'ad-bf', C: '0.1', V: '25', Ct: '0.1', K: '1.8e-5', pK: '', Vt: '12.5' } },
    { clave: 'val-fosforico', nombre: 'Valoración de ácido fosfórico con NaOH', sc: { modo: 'valoracion', tipo: 'ap-bf', C: '0.1', V: '20', Ct: '0.1', K1: '7.5e-3', K2: '6.2e-8', K3: '4.8e-13', Vt: '' } },
    { clave: 'val-amoniaco', nombre: 'Valoración de amoniaco con HCl', sc: { modo: 'valoracion', tipo: 'bd-af', C: '0.1', V: '20', Ct: '0.1', K: '1.8e-5', pK: '', Vt: '30' } },
  ];

  return { resolver, fuerte, debil, tampon, mezcla, valoracion, sal, inverso, preparar, poliprotico, fracciones, exacto, kwDe, ejemplos, INDICADORES, f, f2 };
})();

