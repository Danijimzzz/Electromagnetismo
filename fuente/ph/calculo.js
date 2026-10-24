/* =====================================================================
   pH y valoraciones (sin DOM): ácidos y bases fuertes y débiles, mezclas
   de un ácido fuerte con una base fuerte, disoluciones reguladoras
   (Henderson-Hasselbalch, también al añadirles ácido o base) y curvas de
   valoración con el punto de equivalencia y el indicador adecuado.
   Concentraciones en mol/L y volúmenes en mL. A 25 °C, Kw = 10^-14.
   El desarrollo usa los métodos de clase; la curva sale del balance de
   cargas exacto, que coincide con ellos donde son válidos.
   ===================================================================== */
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
  const KW = 1e-14, lg = Math.log10;
  // la constante: K o pK, la que se haya escrito
  function leeK(sc, nom) {
    if (!vacio(sc.K)) return lee(sc, 'K', nom);
    if (!vacio(sc.pK)) { const p = leeNum(sc.pK); if (!isFinite(p)) throw new Error(`El p${nom} debe ser un número`); return 10 ** -p; }
    throw new Error(`Falta ${nom} (o p${nom})`);
  }

  /* ---------- pH exacto por el balance de cargas ---------- */
  // c: { na (catión de base fuerte), cl (anión de ácido fuerte), ca + Ka (ácido débil), cb + Kb (base débil) }
  function exacto(c) {
    const Ka = c.Ka || 1, Kbh = c.Kb ? KW / c.Kb : 1;
    const g = (h) => h + (c.na || 0) + ((c.cb || 0) * h) / (h + Kbh) - KW / h - (c.cl || 0) - ((c.ca || 0) * Ka) / (Ka + h);
    let lo = -16, hi = 2; // log10 de [H3O+]
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (g(10 ** m) > 0) hi = m; else lo = m; }
    return -(lo + hi) / 2;
  }

  const INDICADORES = [['naranja de metilo', 3.1, 4.4, 'rojo', 'amarillo'], ['rojo de metilo', 4.2, 6.3, 'rojo', 'amarillo'], ['azul de bromotimol', 6.0, 7.6, 'amarillo', 'azul'], ['fenolftaleína', 8.2, 10.0, 'incoloro', 'rosa'], ['timolftaleína', 9.3, 10.5, 'incoloro', 'azul']];
  const indicador = (pH) => INDICADORES.reduce((a, b) => (Math.abs((b[1] + b[2]) / 2 - pH) < Math.abs((a[1] + a[2]) / 2 - pH) ? b : a));
  const caracter = (pH) => (pH < 6.995 ? 'ácida' : pH > 7.005 ? 'básica' : 'neutra');
  const finPH = (pH) => `$pH = ${f2(pH)}$: disolución ${caracter(pH)}.`;
  // pH a partir de [H3O+] o de [OH−], escrito como en clase
  const desdeH = (h) => `$pH = −log [H_{3}O^{+}] = −log ${f(h)}$ = <b>${f2(-lg(h))}</b>`;
  const desdeOH = (oh) => `$pOH = −log [OH^{−}] = −log ${f(oh)} = ${f2(-lg(oh))}$, &ensp; $pH = 14 − pOH$ = <b>${f2(14 + lg(oh))}</b>`;
  // x de x²/(C − x) = K
  const raiz = (K, C) => (-K + Math.sqrt(K * K + 4 * K * C)) / 2;

  /* ---------- Ácido o base fuerte ---------- */
  // sc: { especie: 'acido' | 'base', C, n (H+ u OH− por fórmula) }
  function fuerte(sc) {
    const base = sc.especie === 'base', C = lee(sc, 'C', 'la concentración'), n = lee(sc, 'n', base ? 'el número de OH⁻' : 'el número de H⁺', { opcional: true }) ?? 1;
    const c = n * C, ion = base ? 'OH^{−}' : 'H_{3}O^{+}';
    const pasos = [{ t: 'Disociación completa', html: `Al ser ${base ? 'una base fuerte' : 'un ácido fuerte'} se disocia del todo${n > 1 ? ` y cada fórmula da ${f(n)} ${base ? 'OH⁻' : 'H⁺'}` : ''}: $[${ion}] = ${n > 1 ? `${f(n)} · ${f(C)}` : f(C)}$ = ${f(c)} M` }];
    let pH;
    if (c < 1e-6) {
      // muy diluido: cuenta también el agua
      const x = (c + Math.sqrt(c * c + 4 * KW)) / 2;
      pH = base ? 14 + lg(x) : -lg(x);
      pasos.push({ t: 'Muy diluido: cuenta el agua', html: `Con tan poca concentración los iones del agua no son despreciables. Con $[${ion}] = c + [${base ? 'H_{3}O^{+}' : 'OH^{−}'}]$ y $K_w = [H_{3}O^{+}][OH^{−}] = 10^{−14}$ queda $x^2 − c x − K_w = 0$, $x = ${f(x)}$ M` });
      pasos.push({ t: 'pH', html: base ? desdeOH(x) : desdeH(x) });
    } else {
      pH = base ? 14 + lg(c) : -lg(c);
      pasos.push({ t: 'pH', html: base ? desdeOH(c) : desdeH(c) });
    }
    pasos.push({ t: 'Concentraciones en el equilibrio', html: `$[H_{3}O^{+}] = ${f(10 ** -pH)}$ M, &ensp; $[OH^{−}] = ${f(10 ** (pH - 14))}$ M. ${finPH(pH)}` });
    return { modo: 'fuerte', base, C, n, pH, h: 10 ** -pH, pasos };
  }

  /* ---------- Ácido o base débil ---------- */
  // sc: { especie, C, K o pK }
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
    const pH = base ? 14 + lg(x) : -lg(x);
    pasos.push({ t: 'Resultado', html: finPH(pH) });
    return { modo: 'debil', base, C, K, pK: -lg(K), x, alfa, pH, h: 10 ** -pH, pasos };
  }

  /* ---------- Disolución reguladora ---------- */
  // sc: { especie: 'acido' (HA/A−) | 'base' (B/BH+), K o pK (del ácido débil o de la base débil), Cd (forma débil), Cs (sal), V (mL),
  //       anade: 'nada' | 'acido' | 'base', Cad, Vad (mL) }
  function tampon(sc) {
    const base = sc.especie === 'base', K = leeK(sc, base ? 'Kb' : 'Ka');
    const Cd = lee(sc, 'Cd', base ? 'la concentración de la base' : 'la concentración del ácido'), Cs = lee(sc, 'Cs', 'la concentración de la sal');
    const pKa = base ? 14 + lg(K) : -lg(K); // del ácido del par
    // forma ácida y forma básica del par
    const cAc = base ? Cs : Cd, cBa = base ? Cd : Cs, Ac = base ? 'BH^{+}' : 'HA', Ba = base ? 'B' : 'A^{−}';
    const pH0 = pKa + lg(cBa / cAc);
    const pasos = [{ t: 'Ecuación de Henderson-Hasselbalch', html: `${base ? `El par es $B/BH^{+}$: $pK_a = 14 − pK_b = 14 − ${f2(-lg(K))} = ${f2(pKa)}$.` : `$pK_a = −log ${f(K)} = ${f2(pKa)}$.`}<br>$pH = pK_a + log {[${Ba}]}/{[${Ac}]} = ${f2(pKa)} + log {${f(cBa)}}/{${f(cAc)}}$ = <b>${f2(pH0)}</b>` }];
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
      pHagua = anade === 'acido' ? -lg((c + Math.sqrt(c * c + 4 * KW)) / 2) : 14 + lg((c + Math.sqrt(c * c + 4 * KW)) / 2);
      pasos.push({ t: 'Comparado con agua pura', html: `El pH cambia en ${f2(Math.abs(pH - pH0))} unidades. Si lo mismo se echara en ${f(V)} mL de agua pura, el pH pasaría de 7 a ${f2(pHagua)}.` });
    }
    pasos.push({ t: 'Concentración de H₃O⁺', html: `$[H_{3}O^{+}] = 10^{−pH} = ${f(10 ** -pH)}$ M` });
    pasos.push({ t: 'Capacidad reguladora', html: `Amortiguan bien entre $pH = pK_a ± 1$, de ${f2(pKa - 1)} a ${f2(pKa + 1)}, y mejor cuanto más concentradas estén las dos formas.` });
    return { modo: 'tampon', base, K, pKa, cAc, cBa, pH0, pH, anade, pHagua, nAc, nBa, h: 10 ** -pH, pasos };
  }

  /* ---------- Mezcla de ácido fuerte y base fuerte ---------- */
  // sc: { Ca, Va, Cb, Vb } (volúmenes en mL)
  function mezcla(sc) {
    const Ca = lee(sc, 'Ca', 'la concentración del ácido'), Va = lee(sc, 'Va', 'el volumen del ácido'), Cb = lee(sc, 'Cb', 'la concentración de la base'), Vb = lee(sc, 'Vb', 'el volumen de la base');
    const na = (Ca * Va) / 1000, nb = (Cb * Vb) / 1000, Vt = (Va + Vb) / 1000, d = na - nb;
    const pasos = [
      { t: 'Moles de cada uno', html: `$n(H_{3}O^{+}) = ${f(Ca)} · ${f(Va / 1000)} = ${f(na)}$ mol, &ensp; $n(OH^{−}) = ${f(Cb)} · ${f(Vb / 1000)} = ${f(nb)}$ mol` },
      { t: 'Neutralización', html: `$H_{3}O^{+} + OH^{−} → 2 H_{2}O$. ${Math.abs(d) < 1e-12 * Math.max(na, nb) ? 'Hay los mismos moles de los dos: se neutralizan del todo.' : `Sobran ${f(Math.abs(d))} mol de ${d > 0 ? 'H₃O⁺' : 'OH⁻'} en $V = ${f(Va)} + ${f(Vb)} = ${f(Va + Vb)}$ mL.`}` },
    ];
    let pH;
    if (Math.abs(d) < 1e-12 * Math.max(na, nb)) { pH = 7; pasos.push({ t: 'pH', html: 'Solo queda agua y una sal que no se hidroliza: <b>pH = 7</b>.' }); } else {
      const c = Math.abs(d) / Vt;
      pasos.push({ t: 'Concentración del que sobra', html: `$[${d > 0 ? 'H_{3}O^{+}' : 'OH^{−}'}] = ${f(Math.abs(d))}/${f(Vt)}$ = ${f(c)} M` });
      pH = d > 0 ? -lg(c) : 14 + lg(c);
      pasos.push({ t: 'pH', html: d > 0 ? desdeH(c) : desdeOH(c) });
    }
    pasos.push({ t: 'Resultado', html: finPH(pH) });
    return { modo: 'mezcla', Ca, Va, Cb, Vb, na, nb, pH, h: 10 ** -pH, pasos };
  }

  /* ---------- Valoración ---------- */
  // sc: { tipo: 'af-bf' | 'ad-bf' | 'bf-af' | 'bd-af', C (valorado), V (mL), Ct (valorante), K o pK (si es débil), Vt (mL añadidos, opcional) }
  const TIPOS = { 'af-bf': ['ácido fuerte', 'base fuerte', false, false], 'ad-bf': ['ácido débil', 'base fuerte', true, false], 'bf-af': ['base fuerte', 'ácido fuerte', false, true], 'bd-af': ['base débil', 'ácido fuerte', true, true] };
  function valoracion(sc) {
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'af-bf', [nomV, nomT, debilV, esBase] = TIPOS[tipo];
    const C = lee(sc, 'C', `la concentración del ${nomV.split(' ')[0]}`), V = lee(sc, 'V', 'el volumen valorado'), Ct = lee(sc, 'Ct', 'la concentración del valorante');
    const K = debilV ? leeK(sc, esBase ? 'Kb' : 'Ka') : null;
    const n0 = (C * V) / 1000, Veq = (C * V) / Ct;
    // pH exacto con v mL de valorante
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
    const pKa = debilV ? (esBase ? 14 + lg(K) : -lg(K)) : null;
    // pH en la equivalencia, como en clase
    let pHeq;
    if (!debilV) {
      pHeq = 7;
      pasos.push({ t: 'pH en la equivalencia', html: 'Se forma una sal de ácido fuerte y base fuerte, que no se hidroliza: <b>pH = 7</b>.' });
    } else {
      const cs = n0 / ((V + Veq) / 1000), Kh = KW / K, x = raiz(Kh, cs);
      pHeq = esBase ? -lg(x) : 14 + lg(x);
      pasos.push({ t: 'pH en la equivalencia', html: `Todo el ${nomV} se ha convertido en su ${esBase ? 'ácido conjugado, $BH^{+}$' : 'base conjugada, $A^{−}$'}, con $c = ${f(n0)}/${f((V + Veq) / 1000)} = ${f(cs)}$ M, que se hidroliza con $${esBase ? 'K_a' : 'K_b'} = K_w/${esBase ? 'K_b' : 'K_a'} = ${f(Kh)}$: $x = ${f(x)}$ M de ${esBase ? 'H₃O⁺' : 'OH⁻'}, y <b>pH = ${f2(pHeq)}</b>, ${esBase ? 'ácido' : 'básico'}.` });
    }
    const ind = indicador(pHeq);
    pasos.push({ t: 'Indicador', html: `Hace falta uno que vire cerca de pH ${f2(pHeq)}: ${ind[0]}, que pasa de ${ind[3]} a ${ind[4]} entre ${f(ind[1])} y ${f(ind[2])}.` });
    if (debilV) pasos.push({ t: 'A mitad de la valoración', html: `Con $V = V_{eq}/2 = ${f(Veq / 2)}$ mL hay la misma cantidad de la forma ácida y de la básica: es una disolución reguladora con <b>pH = pK<sub>a</sub> = ${f2(pKa)}</b>${esBase ? ' (del ácido conjugado)' : ''}. Así se mide la constante de un ácido o una base.` });
    const v = lee(sc, 'Vt', 'el volumen añadido', { opcional: true, cero: true });
    let pHv = null;
    if (v !== null) {
      const Vtot = (V + v) / 1000, nt = (Ct * v) / 1000, d = n0 - nt, ionV = esBase ? 'OH^{−}' : 'H_{3}O^{+}', ionT = esBase ? 'H_{3}O^{+}' : 'OH^{−}';
      let html;
      if (v === 0) {
        if (debilV) { const x = raiz(K, C); pHv = esBase ? 14 + lg(x) : -lg(x); html = `Antes de añadir nada es ${esBase ? 'una base débil' : 'un ácido débil'}: $x = ${f(x)}$ M y <b>pH = ${f2(pHv)}</b>`; } else { pHv = esBase ? 14 + lg(C) : -lg(C); html = `Antes de añadir nada: $[${ionV}] = ${f(C)}$ M y <b>pH = ${f2(pHv)}</b>`; }
      } else if (Math.abs(d) < 1e-9 * n0) {
        pHv = pHeq; html = `Es el punto de equivalencia: <b>pH = ${f2(pHeq)}</b>`;
      } else if (d > 0) {
        if (debilV) {
          pHv = pKa + (esBase ? -1 : 1) * lg(nt / d);
          html = `Ha reaccionado ${f(nt)} mol y quedan ${f(d)} mol de ${nomV}: es una disolución reguladora, $pH = pK_a + log {${esBase ? `n(B)`: `n(A^{−})`}}/{${esBase ? `n(BH^{+})` : `n(HA)`}} = ${f2(pKa)} + log {${f(esBase ? d : nt)}}/{${f(esBase ? nt : d)}}$ = <b>${f2(pHv)}</b>`;
        } else {
          const c = d / Vtot; pHv = esBase ? 14 + lg(c) : -lg(c);
          html = `Quedan $${f(n0)} − ${f(nt)} = ${f(d)}$ mol de ${esBase ? 'OH⁻' : 'H₃O⁺'} en ${f(V + v)} mL: $[${ionV}] = ${f(c)}$ M y <b>pH = ${f2(pHv)}</b>`;
        }
      } else {
        const c = -d / Vtot; pHv = esBase ? -lg(c) : 14 + lg(c);
        html = `Ya se ha pasado la equivalencia: sobran $${f(nt)} − ${f(n0)} = ${f(-d)}$ mol de ${esBase ? 'H₃O⁺' : 'OH⁻'} en ${f(V + v)} mL, $[${ionT}] = ${f(c)}$ M y <b>pH = ${f2(pHv)}</b>`;
      }
      pasos.push({ t: `Con ${f(v)} mL añadidos`, html });
    }
    return { modo: 'valoracion', tipo, nomV, nomT, debilV, esBase, C, V, Ct, K, pKa, Veq, pHeq, ind, v, pHv, curva, pH: pHv ?? curva[0][1], ph, pasos };
  }

  function resolver(sc) {
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
    { clave: 'mezcla', nombre: 'Mezcla de HCl y NaOH', sc: { modo: 'mezcla', Ca: '0.1', Va: '50', Cb: '0.2', Vb: '30' } },
    { clave: 'val-fuerte', nombre: 'Valoración de HCl con NaOH', sc: { modo: 'valoracion', tipo: 'af-bf', C: '0.1', V: '25', Ct: '0.1', Vt: '20' } },
    { clave: 'val-acetico', nombre: 'Valoración de ácido acético con NaOH', sc: { modo: 'valoracion', tipo: 'ad-bf', C: '0.1', V: '25', Ct: '0.1', K: '1.8e-5', pK: '', Vt: '12.5' } },
    { clave: 'val-amoniaco', nombre: 'Valoración de amoniaco con HCl', sc: { modo: 'valoracion', tipo: 'bd-af', C: '0.1', V: '20', Ct: '0.1', K: '1.8e-5', pK: '', Vt: '30' } },
  ];

  return { resolver, fuerte, debil, tampon, mezcla, valoracion, exacto, ejemplos, INDICADORES, f, f2 };
})();
if (typeof module !== 'undefined') module.exports = PH;
