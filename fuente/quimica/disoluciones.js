/* =====================================================================
   Disoluciones (sin DOM): paso entre formas de expresar la concentración
   (% en masa, % m/v, g/L, ppm, molaridad, molalidad y fracción molar) a
   partir de una base de cálculo; preparar una disolución desde un sólido o
   desde un reactivo comercial; diluir (C₁V₁ = C₂V₂) y mezclar.
   Usa Formulas (formulas.js) para las masas molares.
   ===================================================================== */
const Disoluciones = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  // «1,84», «2·10^-3», «2e-3»
  const leeNum = (s) => +String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  const num = (sc, k, nom, { min = 0, max = Infinity, opcional = false } = {}) => {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`);
    if (v <= min) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser mayor que ${f(min)}`);
    if (v >= max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser menor que ${f(max)}`);
    return v;
  };
  const sustancia = (texto, nom, modo) => {
    if (vacio(texto)) throw new Error(`Escribe la fórmula del ${nom}`);
    try { const r = Formulas.masaMolar(texto, modo); return { M: r.M, html: r.html }; } catch (e) { throw new Error(`${nom[0].toUpperCase() + nom.slice(1)}: ${e.message}`); }
  };

  const TIPOS = {
    mm: { nom: '% en masa', u: '%', masa: true },
    ppm: { nom: 'concentración en ppm (mg/kg)', u: 'ppm', masa: true },
    m: { nom: 'molalidad', u: 'mol/kg', masa: true },
    x: { nom: 'fracción molar del soluto', u: '', masa: true },
    M: { nom: 'molaridad', u: 'mol/L', masa: false },
    gL: { nom: 'concentración en g/L', u: 'g/L', masa: false },
    mv: { nom: '% masa/volumen', u: '% (g/100 mL)', masa: false },
  };

  /* ---------- Concentraciones ---------- */
  // sc: { soluto, disolvente, tipo, valor, densidad (g/mL), modo }
  function concentracion(sc) {
    const modo = sc.modo || 'iupac';
    const S = sustancia(sc.soluto, 'soluto', modo), D = sustancia(vacio(sc.disolvente) ? 'H2O' : sc.disolvente, 'disolvente', modo);
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'M', T = TIPOS[tipo];
    const v = num(sc, 'valor', `el valor de la ${T.nom}`, { max: tipo === 'mm' || tipo === 'mv' ? (tipo === 'mm' ? 100 : Infinity) : tipo === 'x' ? 1 : tipo === 'ppm' ? 1e6 : Infinity });
    const rho = num(sc, 'densidad', 'la densidad', { opcional: true });
    const pasos = [];
    const s = S.html, d = D.html;
    pasos.push({ t: 'Masas molares', html: `M(${s}) = <b>${f(S.M)} g/mol</b> &nbsp; M(${d}) = <b>${f(D.M)} g/mol</b>` });
    let ms, md = null, V = null, ns, nd = null, base;
    // base de cálculo: la cantidad que hace más sencillo el dato
    if (tipo === 'mm') { base = '100 g de disolución'; ms = v; md = 100 - v; pasos.push({ t: 'Base de cálculo: 100 g de disolución', html: `Con ${f(v)} % en masa hay <b>${f(ms)} g de soluto</b> y 100 − ${f(v)} = <b>${f(md)} g de disolvente</b>.` }); }
    else if (tipo === 'ppm') { base = '1 kg de disolución'; ms = v / 1000; md = 1000 - ms; pasos.push({ t: 'Base de cálculo: 1 kg de disolución', html: `${f(v)} ppm son ${f(v)} mg de soluto por kg: <b>${f(ms)} g de soluto</b> y <b>${f(md)} g de disolvente</b>.` }); }
    else if (tipo === 'm') { base = '1 kg de disolvente'; ns = v; ms = v * S.M; md = 1000; pasos.push({ t: 'Base de cálculo: 1 kg de disolvente', html: `Hay ${f(v)} mol de soluto ⇒ m<sub>s</sub> = n · M = ${f(v)} · ${f(S.M)} = <b>${f(ms)} g</b>, con <b>1000 g de disolvente</b>.` }); }
    else if (tipo === 'x') { base = '1 mol en total'; ns = v; nd = 1 - v; ms = ns * S.M; md = nd * D.M; pasos.push({ t: 'Base de cálculo: 1 mol de disolución', html: `n<sub>s</sub> = ${f(ns)} mol ⇒ m<sub>s</sub> = ${f(ns)} · ${f(S.M)} = <b>${f(ms)} g</b>; n<sub>d</sub> = 1 − ${f(v)} = ${f(nd)} mol ⇒ m<sub>d</sub> = ${f(nd)} · ${f(D.M)} = <b>${f(md)} g</b>.` }); }
    else {
      base = tipo === 'mv' ? '100 mL de disolución' : '1 L de disolución';
      V = tipo === 'mv' ? 100 : 1000;
      if (tipo === 'M') { ns = v; ms = v * S.M; pasos.push({ t: 'Base de cálculo: 1 L de disolución', html: `Hay ${f(v)} mol de soluto ⇒ m<sub>s</sub> = ${f(v)} · ${f(S.M)} = <b>${f(ms)} g</b>.` }); }
      else if (tipo === 'gL') { ms = v; pasos.push({ t: 'Base de cálculo: 1 L de disolución', html: `Hay <b>${f(ms)} g de soluto</b> en 1000 mL.` }); }
      else { ms = v; pasos.push({ t: 'Base de cálculo: 100 mL de disolución', html: `${f(v)} % m/v son <b>${f(ms)} g de soluto</b> en 100 mL de disolución.` }); }
      if (rho !== null) {
        const msol = rho * V;
        md = msol - ms;
        pasos.push({ t: 'Masa de la disolución', html: `m = ρ · V = ${f(rho)} g/mL · ${f(V)} mL = ${f(msol)} g ⇒ disolvente: ${f(msol)} − ${f(ms)} = <b>${f(md)} g</b>.` });
        if (md <= 0) throw new Error(`Con esa densidad la disolución pesaría menos que el soluto que lleva (${f(ms)} g en ${f(V)} mL): revisa los datos`);
      }
    }
    if (ns === undefined) ns = ms / S.M;
    if (nd === null && md !== null) nd = md / D.M;
    const msol = md !== null ? ms + md : null;
    if (V === null && rho !== null) { V = msol / rho; pasos.push({ t: 'Volumen de la disolución', html: `V = m / ρ = ${f(msol)} g / ${f(rho)} g/mL = <b>${f(V)} mL</b>.` }); }
    if (tipo !== 'm' && tipo !== 'M' && tipo !== 'x') pasos.push({ t: 'Moles', html: `n<sub>s</sub> = m<sub>s</sub> / M = ${f(ms)} / ${f(S.M)} = <b>${f(ns)} mol</b>${nd !== null && tipo !== 'x' ? ` &nbsp; n<sub>d</sub> = ${f(md)} / ${f(D.M)} = <b>${f(nd)} mol</b>` : ''}` });
    else if (tipo !== 'x' && nd !== null) pasos.push({ t: 'Moles de disolvente', html: `n<sub>d</sub> = ${f(md)} / ${f(D.M)} = <b>${f(nd)} mol</b>` });
    const val = {}, faltan = [];
    const pon = (k, cuenta, html) => {
      if (cuenta === null) { faltan.push(k); return; }
      val[k] = cuenta;
      if (k !== tipo) pasos.push({ t: TIPOS[k].nom[0].toUpperCase() + TIPOS[k].nom.slice(1), html: `${html} = <b>${f(cuenta)}${TIPOS[k].u ? ' ' + TIPOS[k].u : ''}</b>` });
    };
    pon('mm', msol !== null ? (100 * ms) / msol : null, `% = 100 · m<sub>s</sub> / m<sub>disolución</sub> = 100 · ${f(ms)} / ${f(msol)}`);
    pon('ppm', msol !== null ? (1e6 * ms) / msol : null, `ppm = 10<sup>6</sup> · m<sub>s</sub> / m<sub>disolución</sub>`);
    pon('m', md !== null ? ns / (md / 1000) : null, `m = n<sub>s</sub> / kg de disolvente = ${f(ns)} / ${f(md / 1000)}`);
    pon('x', nd !== null ? ns / (ns + nd) : null, `x<sub>s</sub> = n<sub>s</sub> / (n<sub>s</sub> + n<sub>d</sub>) = ${f(ns)} / (${f(ns)} + ${f(nd)})`);
    pon('M', V !== null ? ns / (V / 1000) : null, `M = n<sub>s</sub> / V(L) = ${f(ns)} / ${f(V / 1000)}`);
    pon('gL', V !== null ? ms / (V / 1000) : null, `c = m<sub>s</sub> / V(L) = ${f(ms)} / ${f(V / 1000)}`);
    pon('mv', V !== null ? (100 * ms) / V : null, `% m/v = 100 · m<sub>s</sub> / V(mL) = 100 · ${f(ms)} / ${f(V)}`);
    val[tipo] = v;
    if (nd !== null) val.xd = nd / (ns + nd);
    if (msol !== null && V !== null) val.densidad = msol / V;
    if (faltan.length) pasos.push({ t: 'Sin la densidad', html: `Para pasar de masa a volumen hace falta la densidad de la disolución: sin ella no se pueden calcular ${faltan.map((k) => TIPOS[k].nom).join(', ')}.` });
    return { S, D, tipo, base, ms, md, V, ns, nd, valores: val, faltan, pasos };
  }

  /* ---------- Preparar una disolución ---------- */
  // sc: { soluto, M (mol/L), V (mL), origen: 'solido'|'comercial', pureza (%), riqueza (%), densidad (g/mL), modo }
  function preparar(sc) {
    const S = sustancia(sc.soluto, 'soluto', sc.modo || 'iupac');
    const M = num(sc, 'M', 'la molaridad que quieres'), V = num(sc, 'V', 'el volumen que quieres preparar');
    const pasos = [], n = (M * V) / 1000, mp = n * S.M, res = { n, mPuro: mp, S };
    pasos.push({ t: 'Moles de soluto', html: `n = M · V = ${f(M)} mol/L · ${f(V / 1000)} L = <b>${f(n)} mol</b>` });
    pasos.push({ t: 'Masa de soluto puro', html: `m = n · M(${S.html}) = ${f(n)} · ${f(S.M)} = <b>${f(mp)} g</b>` });
    if (sc.origen === 'comercial') {
      const r = num(sc, 'riqueza', 'la riqueza', { max: 100.0000001 }), rho = num(sc, 'densidad', 'la densidad del reactivo comercial');
      const mc = (mp * 100) / r, Vc = mc / rho;
      Object.assign(res, { mComercial: mc, Vcomercial: Vc, Mcomercial: (1000 * rho * (r / 100)) / S.M });
      pasos.push({ t: 'Masa de reactivo comercial', html: `Solo el ${f(r)} % es soluto: m = ${f(mp)} · 100 / ${f(r)} = <b>${f(mc)} g</b>` });
      pasos.push({ t: 'Volumen de reactivo comercial', html: `V = m / ρ = ${f(mc)} / ${f(rho)} = <b>${f(Vc)} mL</b>` });
      pasos.push({ t: 'Molaridad del reactivo comercial', html: `En 1 L: 1000 · ${f(rho)} · ${f(r / 100)} / ${f(S.M)} = <b>${f(res.Mcomercial)} mol/L</b>. Comprobación: ${f(res.Mcomercial)} · ${f(Vc)} = ${f(M)} · ${f(V)} (C<sub>1</sub>V<sub>1</sub> = C<sub>2</sub>V<sub>2</sub>).` });
      if (Vc > V) throw new Error(`Haría falta más reactivo comercial (${f(Vc)} mL) que volumen final: no se puede preparar tan concentrada`);
      res.instrucciones = `Mide ${f(Vc)} mL del reactivo comercial con una pipeta, échalos sobre agua en un matraz aforado de ${f(V)} mL${/SO4/.test(sc.soluto) ? ' (siempre el ácido sobre el agua, nunca al revés)' : ''} y enrasa con agua.`;
    } else {
      const p = vacio(sc.pureza) ? 100 : num(sc, 'pureza', 'la pureza', { max: 100.0000001 });
      const m = (mp * 100) / p;
      res.mPesar = m;
      if (p < 100) pasos.push({ t: 'Con la pureza', html: `El sólido es del ${f(p)} %: m = ${f(mp)} · 100 / ${f(p)} = <b>${f(m)} g</b>` });
      res.instrucciones = `Pesa ${f(m)} g del sólido, disuélvelos en un poco de agua, pásalo a un matraz aforado de ${f(V)} mL y enrasa.`;
    }
    pasos.push({ t: 'Cómo se prepara', html: res.instrucciones });
    return { ...res, pasos };
  }

  /* ---------- Diluir ---------- */
  // sc: { C1, V1, C2, V2 } con uno vacío: se despeja de C₁V₁ = C₂V₂
  function diluir(sc) {
    const k = ['C1', 'V1', 'C2', 'V2'].filter((x) => vacio(sc[x]));
    if (k.length !== 1) throw new Error('Deja vacío justo uno de los cuatro datos: es el que se calcula');
    const nom = { C1: 'la concentración inicial', V1: 'el volumen inicial', C2: 'la concentración final', V2: 'el volumen final' };
    const v = {};
    for (const x of ['C1', 'V1', 'C2', 'V2']) if (x !== k[0]) v[x] = num(sc, x, nom[x]);
    const q = k[0];
    const html = { C1: 'C<sub>1</sub>', V1: 'V<sub>1</sub>', C2: 'C<sub>2</sub>', V2: 'V<sub>2</sub>' };
    const otro = { C1: 'V1', V1: 'C1', C2: 'V2', V2: 'C2' }[q], lado = q[1] === '1' ? ['C2', 'V2'] : ['C1', 'V1'];
    v[q] = (v[lado[0]] * v[lado[1]]) / v[otro];
    if (v.C2 > v.C1 * (1 + 1e-12)) throw new Error('La concentración final sale mayor que la inicial: eso no es una dilución');
    const pasos = [
      { t: 'Los moles de soluto no cambian', html: `C<sub>1</sub> V<sub>1</sub> = C<sub>2</sub> V<sub>2</sub> ⇒ ${html[q]} = ${html[lado[0]]} ${html[lado[1]]} / ${html[otro]} = ${f(v[lado[0]])} · ${f(v[lado[1]])} / ${f(v[otro])} = <b>${f(v[q])}</b>` },
      { t: 'Agua que se añade', html: `V<sub>2</sub> − V<sub>1</sub> = ${f(v.V2)} − ${f(v.V1)} = <b>${f(v.V2 - v.V1)}</b> (en las mismas unidades de volumen), suponiendo volúmenes aditivos. El factor de dilución es ${f(v.C1 / v.C2)}.` },
    ];
    return { ...v, calculado: q, agua: v.V2 - v.V1, factor: v.C1 / v.C2, pasos };
  }

  /* ---------- Mezclar dos disoluciones del mismo soluto ---------- */
  // sc: { C1, V1, C2, V2, Va } (Va: agua añadida, opcional)
  function mezclar(sc) {
    const C1 = num(sc, 'C1', 'la concentración de la primera', { min: -1e-300 }), V1 = num(sc, 'V1', 'el volumen de la primera');
    const C2 = num(sc, 'C2', 'la concentración de la segunda', { min: -1e-300 }), V2 = num(sc, 'V2', 'el volumen de la segunda');
    const Va = vacio(sc.Va) ? 0 : num(sc, 'Va', 'el agua añadida', { min: -1e-300 });
    const n = C1 * V1 + C2 * V2, Vt = V1 + V2 + Va, C = n / Vt;
    const pasos = [{ t: 'Concentración de la mezcla', html: `C = (C<sub>1</sub> V<sub>1</sub> + C<sub>2</sub> V<sub>2</sub>) / (V<sub>1</sub> + V<sub>2</sub>${Va ? ' + V<sub>agua</sub>' : ''}) = (${f(C1)} · ${f(V1)} + ${f(C2)} · ${f(V2)}) / ${f(Vt)} = <b>${f(C)}</b>, suponiendo volúmenes aditivos.` }];
    return { C, Vt, pasos };
  }

  const ejemplos = [
    { clave: 'sulfurico', nombre: 'Ácido sulfúrico comercial (98 %, 1,84 g/mL)', sc: { soluto: 'H2SO4', disolvente: 'H2O', tipo: 'mm', valor: '98', densidad: '1.84' } },
    { clave: 'clorhidrico', nombre: 'Ácido clorhídrico comercial (37 %, 1,19 g/mL)', sc: { soluto: 'HCl', disolvente: 'H2O', tipo: 'mm', valor: '37', densidad: '1.19' } },
    { clave: 'suero', nombre: 'Suero fisiológico (0,9 % m/v)', sc: { soluto: 'NaCl', disolvente: 'H2O', tipo: 'mv', valor: '0.9', densidad: '1.005' } },
    { clave: 'glucosa', nombre: 'Glucosa 0,5 molal (sin densidad)', sc: { soluto: 'C6H12O6', disolvente: 'H2O', tipo: 'm', valor: '0.5', densidad: '' } },
    { clave: 'etanol', nombre: 'Etanol con fracción molar 0,1', sc: { soluto: 'C2H5OH', disolvente: 'H2O', tipo: 'x', valor: '0.1', densidad: '0.97' } },
    { clave: 'sosa', nombre: 'Hidróxido de sodio 2 M', sc: { soluto: 'NaOH', disolvente: 'H2O', tipo: 'M', valor: '2', densidad: '1.08' } },
  ];
  const ejemplosPreparar = [
    { clave: 'nacl', nombre: '250 mL de NaCl 0,1 M con sólido del 99,5 %', sc: { soluto: 'NaCl', M: '0.1', V: '250', origen: 'solido', pureza: '99.5' } },
    { clave: 'sulfato-cobre', nombre: '100 mL de CuSO4 0,2 M con el pentahidrato', sc: { soluto: 'CuSO4·5H2O', M: '0.2', V: '100', origen: 'solido', pureza: '100' } },
    { clave: 'hcl', nombre: '500 mL de HCl 0,5 M desde el comercial', sc: { soluto: 'HCl', M: '0.5', V: '500', origen: 'comercial', riqueza: '37', densidad: '1.19' } },
    { clave: 'h2so4', nombre: '100 mL de H2SO4 1 M desde el comercial', sc: { soluto: 'H2SO4', M: '1', V: '100', origen: 'comercial', riqueza: '98', densidad: '1.84' } },
  ];

  return { concentracion, preparar, diluir, mezclar, TIPOS, ejemplos, ejemplosPreparar, f };
})();
if (typeof module !== 'undefined') module.exports = Disoluciones;
