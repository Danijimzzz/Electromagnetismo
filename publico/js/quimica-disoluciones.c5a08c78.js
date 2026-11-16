const Disoluciones = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
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
  const Mayus = (t) => t[0].toUpperCase() + t.slice(1);
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
    N: { nom: 'normalidad', u: 'eq/L', masa: false },
  };

  function equivalentes(texto) {
    const t = String(texto || '').replace(/\s/g, '');
    let q;
    if (/^H2O2?$/.test(t)) return null;
    if ((q = /^H(\d*)[A-Z]/.exec(t))) return { z: +(q[1] || 1), porque: `es un ácido con ${q[1] || 1} H ácido${+(q[1] || 1) > 1 ? 's' : ''}` };
    if ((q = /\(OH\)(\d+)$/.exec(t))) return { z: +q[1], porque: `es un hidróxido con ${q[1]} OH` };
    if (/[A-Z][a-z]?OH$/.test(t) && !/C/.test(t)) return { z: 1, porque: 'es un hidróxido con un OH' };
    if (/COOH$/.test(t)) return { z: 1, porque: 'es un ácido carboxílico con un H ácido' };
    return null;
  }
  function leeZ(sc, soluto) {
    if (!vacio(sc.z)) { const z = num(sc, 'z', 'el número de equivalentes por mol'); return { z, html: `z = ${f(z)} eq/mol (dato)` }; }
    const e = equivalentes(soluto);
    return e ? { z: e.z, html: `z = ${e.z} eq/mol, porque ${e.porque}` } : { z: 1, html: 'z = 1 eq/mol: no se deduce de la fórmula, así que se supone 1 (escríbelo si es otro, por ejemplo la carga total del catión en una sal)' };
  }

  function concentracion(sc) {
    const modo = sc.modo || 'iupac';
    const S = sustancia(sc.soluto, 'soluto', modo), D = sustancia(vacio(sc.disolvente) ? 'H2O' : sc.disolvente, 'disolvente', modo);
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'M', T = TIPOS[tipo], Z = leeZ(sc, sc.soluto);
    const v = num(sc, 'valor', `el valor de la ${T.nom}`, { max: tipo === 'mm' || tipo === 'mv' ? (tipo === 'mm' ? 100 : Infinity) : tipo === 'x' ? 1 : tipo === 'ppm' ? 1e6 : Infinity });
    const rho = num(sc, 'densidad', 'la densidad', { opcional: true });
    const pasos = [];
    const s = S.html, d = D.html;
    pasos.push({ t: 'Masas molares', html: `M(${s}) = <b>${f(S.M)} g/mol</b> &nbsp; M(${d}) = <b>${f(D.M)} g/mol</b>` });
    let ms, md = null, V = null, ns, nd = null, base;
    if (tipo === 'mm') { base = '100 g de disolución'; ms = v; md = 100 - v; pasos.push({ t: 'Base de cálculo: 100 g de disolución', html: `Con ${f(v)} % en masa hay <b>${f(ms)} g de soluto</b> y 100 − ${f(v)} = <b>${f(md)} g de disolvente</b>.` }); }
    else if (tipo === 'ppm') { base = '1 kg de disolución'; ms = v / 1000; md = 1000 - ms; pasos.push({ t: 'Base de cálculo: 1 kg de disolución', html: `${f(v)} ppm son ${f(v)} mg de soluto por kg: <b>${f(ms)} g de soluto</b> y <b>${f(md)} g de disolvente</b>.` }); }
    else if (tipo === 'm') { base = '1 kg de disolvente'; ns = v; ms = v * S.M; md = 1000; pasos.push({ t: 'Base de cálculo: 1 kg de disolvente', html: `Hay ${f(v)} mol de soluto ⇒ m<sub>s</sub> = n · M = ${f(v)} · ${f(S.M)} = <b>${f(ms)} g</b>, con <b>1000 g de disolvente</b>.` }); }
    else if (tipo === 'x') { base = '1 mol en total'; ns = v; nd = 1 - v; ms = ns * S.M; md = nd * D.M; pasos.push({ t: 'Base de cálculo: 1 mol de disolución', html: `n<sub>s</sub> = ${f(ns)} mol ⇒ m<sub>s</sub> = ${f(ns)} · ${f(S.M)} = <b>${f(ms)} g</b>; n<sub>d</sub> = 1 − ${f(v)} = ${f(nd)} mol ⇒ m<sub>d</sub> = ${f(nd)} · ${f(D.M)} = <b>${f(md)} g</b>.` }); }
    else {
      base = tipo === 'mv' ? '100 mL de disolución' : '1 L de disolución';
      V = tipo === 'mv' ? 100 : 1000;
      if (tipo === 'N') { ns = v / Z.z; ms = ns * S.M; pasos.push({ t: 'Base de cálculo: 1 L de disolución', html: `Equivalentes por mol: ${Z.html}. Hay ${f(v)} eq ⇒ n<sub>s</sub> = ${f(v)} / ${f(Z.z)} = ${f(ns)} mol ⇒ m<sub>s</sub> = ${f(ns)} · ${f(S.M)} = <b>${f(ms)} g</b>.` }); }
      else if (tipo === 'M') { ns = v; ms = v * S.M; pasos.push({ t: 'Base de cálculo: 1 L de disolución', html: `Hay ${f(v)} mol de soluto ⇒ m<sub>s</sub> = ${f(v)} · ${f(S.M)} = <b>${f(ms)} g</b>.` }); }
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
    if (tipo !== 'm' && tipo !== 'M' && tipo !== 'x' && tipo !== 'N') pasos.push({ t: 'Moles', html: `n<sub>s</sub> = m<sub>s</sub> / M = ${f(ms)} / ${f(S.M)} = <b>${f(ns)} mol</b>${nd !== null && tipo !== 'x' ? ` &nbsp; n<sub>d</sub> = ${f(md)} / ${f(D.M)} = <b>${f(nd)} mol</b>` : ''}` });
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
    pon('N', V !== null ? (Z.z * ns) / (V / 1000) : null, `${tipo === 'N' ? '' : `Con ${Z.html}: `}N = z · M = ${f(Z.z)} · ${f(ns / (V / 1000))}`);
    val[tipo] = v;
    if (nd !== null) val.xd = nd / (ns + nd);
    if (msol !== null && V !== null) val.densidad = msol / V;
    if (faltan.length) pasos.push({ t: 'Sin la densidad', html: `Para pasar de masa a volumen hace falta la densidad de la disolución: sin ella no se pueden calcular ${faltan.map((k) => TIPOS[k].nom).join(', ')}.` });
    return { S, D, tipo, base, ms, md, V, ns, nd, z: Z.z, valores: val, faltan, pasos };
  }

  const seguridad = (soluto, comercial) => {
    const t = String(soluto || '').replace(/\s/g, '');
    if (comercial && /^H\d*[A-Z]/.test(t) && !/^H2O2?$/.test(t)) return ` Siempre el ácido sobre el agua, poco a poco y removiendo, nunca al revés: al diluirse desprende calor y el agua echada sobre el ácido puede hervir de golpe y salpicar${/SO4|NO3|Cl|ClO4/.test(t) ? '. Hazlo en la vitrina, con gafas y guantes' : ''}.`;
    if (/^(Li|Na|K)OH$/.test(t)) return ' Al disolverse se calienta mucho: échalo poco a poco sobre agua fría, con gafas y guantes.';
    if (comercial && /^NH3$/.test(t)) return ' El amoniaco concentrado desprende gas: mídelo en la vitrina.';
    return '';
  };
  const OBJ = {
    M: { nom: 'molaridad', u: 'mol/L', q: 'V' }, N: { nom: 'normalidad', u: 'eq/L', q: 'V' }, gL: { nom: 'concentración en g/L', u: 'g/L', q: 'V' },
    mv: { nom: '% m/v', u: '%', q: 'V' }, mm: { nom: '% en masa', u: '%', q: 'masa' }, m: { nom: 'molalidad', u: 'mol/kg', q: 'disolvente' },
  };
  function preparar(sc) {
    const S = sustancia(sc.soluto, 'soluto', sc.modo || 'iupac'), obj = OBJ[sc.obj] ? sc.obj : 'M', O = OBJ[obj];
    const c = num(sc, 'M', `la ${O.nom} que quieres`, { max: obj === 'mm' ? 100 : Infinity });
    const Q = num(sc, 'V', O.q === 'V' ? 'el volumen que quieres preparar' : O.q === 'masa' ? 'la masa de disolución que quieres preparar' : 'la masa de disolvente');
    const pasos = [];
    let n, mp;
    if (obj === 'M') { n = (c * Q) / 1000; mp = n * S.M; pasos.push({ t: 'Moles de soluto', html: `n = M · V = ${f(c)} mol/L · ${f(Q / 1000)} L = <b>${f(n)} mol</b>` }); }
    else if (obj === 'N') { const Z = leeZ(sc, sc.soluto); n = (c * Q) / 1000 / Z.z; mp = n * S.M; pasos.push({ t: 'Equivalentes y moles', html: `${Z.html}. Equivalentes = N · V = ${f(c)} · ${f(Q / 1000)} = ${f((c * Q) / 1000)} eq ⇒ n = eq / z = <b>${f(n)} mol</b>` }); }
    else if (obj === 'gL' || obj === 'mv') { mp = obj === 'gL' ? (c * Q) / 1000 : (c * Q) / 100; n = mp / S.M; pasos.push({ t: 'Masa de soluto', html: obj === 'gL' ? `m = c · V = ${f(c)} g/L · ${f(Q / 1000)} L = <b>${f(mp)} g</b>` : `${f(c)} % m/v son ${f(c)} g por cada 100 mL: m = ${f(c)} · ${f(Q)} / 100 = <b>${f(mp)} g</b>` }); }
    else if (obj === 'mm') { mp = (c * Q) / 100; n = mp / S.M; pasos.push({ t: 'Masa de soluto', html: `El ${f(c)} % de ${f(Q)} g de disolución: m = ${f(c)} · ${f(Q)} / 100 = <b>${f(mp)} g</b>` }); }
    else { n = (c * Q) / 1000; mp = n * S.M; pasos.push({ t: 'Moles de soluto', html: `n = m · kg de disolvente = ${f(c)} · ${f(Q / 1000)} = <b>${f(n)} mol</b>` }); }
    const res = { n, mPuro: mp, S, obj };
    if (obj !== 'gL' && obj !== 'mv' && obj !== 'mm') pasos.push({ t: 'Masa de soluto puro', html: `m = n · M(${S.html}) = ${f(n)} · ${f(S.M)} = <b>${f(mp)} g</b>` });
    else pasos.push({ t: 'Moles de soluto', html: `n = m / M(${S.html}) = ${f(mp)} / ${f(S.M)} = <b>${f(n)} mol</b>` });
    const fin = (mReactivo, aguaDentro) => {
      if (O.q === 'V') return sc.origen === 'comercial' ? `en un matraz aforado de ${f(Q)} mL y enrasa con agua.` : `pásalo a un matraz aforado de ${f(Q)} mL y enrasa.`;
      if (O.q === 'masa') { const a = Q - mReactivo; if (a < 0) throw new Error('Con tan poca masa de disolución no cabe el soluto: no se puede preparar tan concentrada'); res.agua = a; return `añade ${f(a)} g de agua (pesados) hasta tener ${f(Q)} g de disolución.`; }
      const a = Q - aguaDentro; if (a < 0) throw new Error('El reactivo comercial ya trae más agua que el disolvente que pides: no se puede preparar tan concentrada'); res.agua = a; return `añade ${f(a)} g de agua${aguaDentro > 0 ? ` (el reactivo ya trae ${f(aguaDentro)} g de los ${f(Q)} g de disolvente)` : ''}.`;
    };
    if (sc.origen === 'comercial') {
      const r = num(sc, 'riqueza', 'la riqueza', { max: 100.0000001 }), rho = num(sc, 'densidad', 'la densidad del reactivo comercial');
      const mc = (mp * 100) / r, Vc = mc / rho;
      Object.assign(res, { mComercial: mc, Vcomercial: Vc, Mcomercial: (1000 * rho * (r / 100)) / S.M });
      pasos.push({ t: 'Masa de reactivo comercial', html: `Solo el ${f(r)} % es soluto: m = ${f(mp)} · 100 / ${f(r)} = <b>${f(mc)} g</b>` });
      pasos.push({ t: 'Volumen de reactivo comercial', html: `V = m / ρ = ${f(mc)} / ${f(rho)} = <b>${f(Vc)} mL</b>` });
      pasos.push({ t: 'Molaridad del reactivo comercial', html: `En 1 L: 1000 · ${f(rho)} · ${f(r / 100)} / ${f(S.M)} = <b>${f(res.Mcomercial)} mol/L</b>.${obj === 'M' ? ` Comprobación: ${f(res.Mcomercial)} · ${f(Vc)} = ${f(c)} · ${f(Q)} (C<sub>1</sub>V<sub>1</sub> = C<sub>2</sub>V<sub>2</sub>).` : ''}` });
      if (O.q === 'V' && Vc > Q) throw new Error(`Haría falta más reactivo comercial (${f(Vc)} mL) que volumen final: no se puede preparar tan concentrada`);
      res.instrucciones = `Mide ${f(Vc)} mL del reactivo comercial con una pipeta, échalos sobre agua ${O.q === 'V' ? fin(mc, 0) : `en un vaso sobre la balanza y ${fin(mc, mc - mp)}`}${seguridad(sc.soluto, true)}`;
    } else {
      const p = vacio(sc.pureza) ? 100 : num(sc, 'pureza', 'la pureza', { max: 100.0000001 });
      const m = (mp * 100) / p;
      res.mPesar = m;
      if (p < 100) pasos.push({ t: 'Con la pureza', html: `El sólido es del ${f(p)} %: m = ${f(mp)} · 100 / ${f(p)} = <b>${f(m)} g</b>` });
      const como = O.q === 'V' ? `, disuélvelos en un poco de agua, ${fin(m, 0)}` : O.q === 'masa' ? ` en un vaso sobre la balanza y ${fin(m, 0)}` : (fin(m, 0), ` y disuélvelos en ${f(Q)} g de agua.`);
      res.instrucciones = `Pesa ${f(m)} g del sólido${como}${seguridad(sc.soluto, false)}`;
    }
    pasos.push({ t: 'Cómo se prepara', html: res.instrucciones });
    return { ...res, pasos };
  }

  const UC = { M: [1, 'mol', 'mol/L'], mM: [1e-3, 'mol', 'mmol/L'], uM: [1e-6, 'mol', 'µmol/L'], N: [1, 'eq', 'eq/L'], gL: [1, 'masa', 'g/L'], mgL: [1e-3, 'masa', 'mg/L'], mv: [10, 'masa', '% m/v'] };
  const UV = { L: [1000, 'L'], mL: [1, 'mL'], uL: [1e-3, 'µL'] };
  function diluir(sc) {
    const k = ['C1', 'V1', 'C2', 'V2'].filter((x) => vacio(sc[x]));
    if (k.length !== 1) throw new Error('Deja vacío justo uno de los cuatro datos: es el que se calcula');
    const nom = { C1: 'la concentración inicial', V1: 'el volumen inicial', C2: 'la concentración final', V2: 'el volumen final' };
    const u = (x) => (x[0] === 'C' ? UC[sc['u' + x]] || UC.M : UV[sc['u' + x]] || UV.mL), q = k[0];
    if (u('C1')[1] !== u('C2')[1]) throw new Error(`No se puede pasar de ${u('C1')[2]} a ${u('C2')[2]} sin la masa molar${u('C1')[1] === 'eq' || u('C2')[1] === 'eq' ? ' o los equivalentes' : ''}: usa la misma clase de unidad en los dos lados`);
    const v = {}, b = {};
    for (const x of ['C1', 'V1', 'C2', 'V2']) if (x !== q) { v[x] = num(sc, x, nom[x]); b[x] = v[x] * u(x)[0]; }
    const html = { C1: 'C<sub>1</sub>', V1: 'V<sub>1</sub>', C2: 'C<sub>2</sub>', V2: 'V<sub>2</sub>' };
    const otro = { C1: 'V1', V1: 'C1', C2: 'V2', V2: 'C2' }[q], lado = q[1] === '1' ? ['C2', 'V2'] : ['C1', 'V1'];
    b[q] = (b[lado[0]] * b[lado[1]]) / b[otro]; v[q] = b[q] / u(q)[0];
    if (b.C2 > b.C1 * (1 + 1e-12)) throw new Error('La concentración final sale mayor que la inicial: eso no es una dilución');
    const uc = UC[sc.uC1] ? sc.uC1 : 'M', base = { mol: 'mol/L', eq: 'eq/L', masa: 'g/L' }[u('C1')[1]];
    const mezcla = ['C1', 'C2'].some((x) => u(x)[0] !== 1) || ['V1', 'V2'].some((x) => u(x)[0] !== 1);
    const pasos = [];
    if (mezcla) pasos.push({ t: 'A las mismas unidades', html: `Se pasa todo a ${base} y mL: ${['C1', 'V1', 'C2', 'V2'].filter((x) => x !== q).map((x) => `${html[x]} = ${f(v[x])} ${u(x)[2] || u(x)[1]} = ${f(b[x])} ${x[0] === 'C' ? base : 'mL'}`).join('; ')}.` });
    pasos.push({ t: 'Los moles de soluto no cambian', html: `C<sub>1</sub> V<sub>1</sub> = C<sub>2</sub> V<sub>2</sub> ⇒ ${html[q]} = ${html[lado[0]]} ${html[lado[1]]} / ${html[otro]} = ${f(b[lado[0]])} · ${f(b[lado[1]])} / ${f(b[otro])} = <b>${f(b[q])} ${q[0] === 'C' ? base : 'mL'}</b>${u(q)[0] !== 1 ? ` = <b>${f(v[q])} ${u(q)[2] || u(q)[1]}</b>` : ''}` });
    pasos.push({ t: 'Agua que se añade', html: `V<sub>2</sub> − V<sub>1</sub> = ${f(b.V2)} − ${f(b.V1)} = <b>${f(b.V2 - b.V1)} mL</b>, suponiendo volúmenes aditivos. El factor de dilución es ${f(b.C1 / b.C2)}.` });
    return { ...v, calculado: q, unidad: q[0] === 'C' ? u(q)[2] : u(q)[1], agua: b.V2 - b.V1, factor: b.C1 / b.C2, pasos, uc };
  }

  const DISOLVENTES = {
    agua: { nom: 'agua', f: 'H2O', Kc: 1.86, Ke: 0.512, Tf: 0, Te: 100, P0: 23.76 },
    benceno: { nom: 'benceno', f: 'C6H6', Kc: 5.12, Ke: 2.53, Tf: 5.5, Te: 80.1, P0: 95.1 },
    ciclohexano: { nom: 'ciclohexano', f: 'C6H12', Kc: 20.0, Ke: 2.79, Tf: 6.6, Te: 80.7, P0: 97.6 },
    etanol: { nom: 'etanol', f: 'C2H5OH', Kc: 1.99, Ke: 1.22, Tf: -114.6, Te: 78.4, P0: 59.0 },
    acetico: { nom: 'ácido acético', f: 'CH3COOH', Kc: 3.90, Ke: 3.07, Tf: 16.6, Te: 117.9, P0: 15.7 },
    cloroformo: { nom: 'cloroformo', f: 'CHCl3', Kc: 4.68, Ke: 3.63, Tf: -63.5, Te: 61.2, P0: 194.8 },
    alcanfor: { nom: 'alcanfor', f: 'C10H16O', Kc: 40.0, Ke: 5.95, Tf: 179.8, Te: 204, P0: null },
  };
  const R = 0.082;
  function iones(texto) {
    const t = String(texto || '').replace(/\s/g, '').replace(/·.*$/, '');
    if (/C/.test(t.replace(/Cl|Ca|Cu|Co|Cr|Cs|Cd/g, '')) || /^H\d*[A-Z]/.test(t) && !/^H(Cl|Br|I|NO3|ClO4)$|^H2SO4$/.test(t)) return null;
    const POLI = ['SO4', 'NO3', 'PO4', 'CO3', 'ClO4', 'OH', 'NH4', 'SO3', 'NO2', 'CrO4', 'MnO4', 'ClO3'];
    let q, resto = t, n = 0;
    if ((q = /^\(?(NH4)\)?(\d*)(.*)$/.exec(resto)) && q[1]) { n += +(q[2] || 1); resto = q[3]; }
    else if ((q = /^(H|Li|Na|K|Rb|Cs|Be|Mg|Ca|Sr|Ba|Al|Fe|Cu|Zn|Ag|Pb|Ni|Co|Mn|Cr|Cd|Hg|Sn)(\d*)(.*)$/.exec(resto))) { n += +(q[2] || 1); resto = q[3]; } else return null;
    if (!resto) return null;
    if ((q = /^\((\w+)\)(\d+)$/.exec(resto)) && POLI.includes(q[1])) return n + +q[2];
    if (POLI.includes(resto)) return n + 1;
    if ((q = /^(F|Cl|Br|I|S|O|N|P)(\d*)$/.exec(resto))) return n + +(q[2] || 1);
    if ((q = /^(\w+?)(\d*)$/.exec(resto)) && POLI.includes(q[1])) return n + +(q[2] || 1);
    return null;
  }
  function coligativas(sc) {
    const Dv = DISOLVENTES[sc.disolvente] || DISOLVENTES.agua, modo = sc.modo || 'iupac', pasos = [];
    const ms = num(sc, 'ms', 'la masa de soluto'), md = num(sc, 'md', 'la masa de disolvente');
    const T = vacio(sc.T) ? 25 : num(sc, 'T', 'la temperatura', { min: -273.15 }), TK = T + 273.15;
    const ic = !vacio(sc.i) ? null : iones(sc.soluto), i = vacio(sc.i) ? ic || 1 : num(sc, 'i', 'el factor de van \'t Hoff');
    const Mdis = Formulas.masaMolar(Dv.f, modo).M;
    pasos.push({ t: 'Disolvente', html: `${Mayus(Dv.nom)}: K<sub>c</sub> = ${f(Dv.Kc)} K·kg/mol, K<sub>e</sub> = ${f(Dv.Ke)} K·kg/mol, funde a ${f(Dv.Tf)} °C y hierve a ${f(Dv.Te)} °C (valores de tabla).` });
    pasos.push({ t: "Factor de van 't Hoff", html: vacio(sc.i) ? (ic ? `Es un electrolito fuerte que da ${ic} iones por fórmula: <b>i = ${ic}</b> (en disoluciones concentradas el i real es algo menor).` : 'No se disocia (o no se sabe por la fórmula): <b>i = 1</b>. Escríbelo si es un electrolito.') : `<b>i = ${f(i)}</b> (dato).` });
    if (sc.busca === 'M') {
      const via = ['ebu', 'osm'].includes(sc.via) ? sc.via : 'crio', x = num(sc, 'medida', via === 'osm' ? 'la presión osmótica' : via === 'ebu' ? 'el aumento del punto de ebullición' : 'el descenso del punto de congelación');
      let M;
      if (via === 'osm') {
        const V = num(sc, 'V', 'el volumen de la disolución');
        M = (i * ms * R * TK) / (x * (V / 1000));
        pasos.push({ t: 'Presión osmótica', html: `π = i · (n/V) · R · T ⇒ n = π V / (i R T) = ${f(x)} · ${f(V / 1000)} / (${f(i)} · 0,082 · ${f(TK)}) = ${f(ms / M)} mol` });
      } else {
        const K = via === 'ebu' ? Dv.Ke : Dv.Kc;
        M = (i * K * ms) / (x * (md / 1000));
        pasos.push({ t: via === 'ebu' ? 'Ebulloscopía' : 'Crioscopía', html: `ΔT = i · K · m ⇒ m = ΔT / (i K) = ${f(x)} / (${f(i)} · ${f(K)}) = ${f(x / (i * K))} mol/kg ⇒ n = m · kg de disolvente = ${f(x / (i * K))} · ${f(md / 1000)} = ${f(ms / M)} mol` });
      }
      pasos.push({ t: 'Masa molar', html: `M = m / n = ${f(ms)} g / ${f(ms / M)} mol = <b>${f(M)} g/mol</b>` });
      return { busca: 'M', Dv, i, M, pasos };
    }
    const S = sustancia(sc.soluto, 'soluto', modo), n = ms / S.M, mol = n / (md / 1000);
    pasos.push({ t: 'Molalidad', html: `n = ${f(ms)} / ${f(S.M)} = ${f(n)} mol; m = n / kg de disolvente = ${f(n)} / ${f(md / 1000)} = <b>${f(mol)} mol/kg</b>` });
    const dTc = i * Dv.Kc * mol, dTe = i * Dv.Ke * mol;
    pasos.push({ t: 'Descenso crioscópico', html: `ΔT<sub>c</sub> = i · K<sub>c</sub> · m = ${f(i)} · ${f(Dv.Kc)} · ${f(mol)} = <b>${f(dTc)} K</b>: congela a ${f(Dv.Tf)} − ${f(dTc)} = <b>${f(Dv.Tf - dTc)} °C</b>` });
    pasos.push({ t: 'Aumento ebulloscópico', html: `ΔT<sub>e</sub> = i · K<sub>e</sub> · m = ${f(i)} · ${f(Dv.Ke)} · ${f(mol)} = <b>${f(dTe)} K</b>: hierve a ${f(Dv.Te)} + ${f(dTe)} = <b>${f(Dv.Te + dTe)} °C</b>` });
    const V = vacio(sc.V) ? null : num(sc, 'V', 'el volumen de la disolución'), Vl = V === null ? (md + ms) / 1000 : V / 1000;
    const pi = (i * n * R * TK) / Vl;
    pasos.push({ t: 'Presión osmótica', html: `π = i · M · R · T = ${f(i)} · ${f(n / Vl)} · 0,082 · ${f(TK)} = <b>${f(pi)} atm</b>${V === null ? ` (sin el volumen se toma V ≈ ${f(Vl * 1000)} mL, como si la densidad fuera 1 g/mL)` : ''}` });
    const nd = md / Mdis, xd = nd / (nd + i * n), P0 = vacio(sc.P0) ? Dv.P0 : num(sc, 'P0', 'la presión de vapor del disolvente puro');
    let P = null;
    if (P0 !== null) { P = xd * P0; pasos.push({ t: 'Presión de vapor (Raoult)', html: `n<sub>d</sub> = ${f(md)} / ${f(Mdis)} = ${f(nd)} mol; x<sub>d</sub> = n<sub>d</sub> / (n<sub>d</sub> + i n) = ${f(xd)}; P = x<sub>d</sub> P° = ${f(xd)} · ${f(P0)} = <b>${f(P)} mmHg</b>, baja ${f(P0 - P)} mmHg${vacio(sc.P0) ? ' (P° a 25 °C)' : ''}` }); }
    return { busca: 'prop', S, Dv, i, n, molal: mol, dTc, dTe, Tc: Dv.Tf - dTc, Te: Dv.Te + dTe, pi, P, P0, xd, pasos };
  }

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
    { clave: 'h2so4-normal', nombre: '250 mL de H2SO4 0,5 N desde el comercial', sc: { soluto: 'H2SO4', obj: 'N', M: '0.5', V: '250', origen: 'comercial', riqueza: '98', densidad: '1.84' } },
    { clave: 'glucosa-gl', nombre: '500 mL de glucosa de 50 g/L', sc: { soluto: 'C6H12O6', obj: 'gL', M: '50', V: '500', origen: 'solido', pureza: '100' } },
    { clave: 'nacl-masa', nombre: '200 g de NaCl al 5 % en masa', sc: { soluto: 'NaCl', obj: 'mm', M: '5', V: '200', origen: 'solido', pureza: '100' } },
    { clave: 'urea-molal', nombre: 'Urea 0,5 molal con 250 g de agua', sc: { soluto: 'CO(NH2)2', obj: 'm', M: '0.5', V: '250', origen: 'solido', pureza: '100' } },
    { clave: 'nitrico', nombre: '250 mL de HNO3 1 M desde el comercial (65 %)', sc: { soluto: 'HNO3', M: '1', V: '250', origen: 'comercial', riqueza: '65', densidad: '1.39' } },
  ];
  const ejemplosColig = [
    { clave: 'glucosa-agua', nombre: '18 g de glucosa en 500 g de agua', sc: { busca: 'prop', soluto: 'C6H12O6', ms: '18', disolvente: 'agua', md: '500', i: '', T: '25', V: '' } },
    { clave: 'nacl-agua', nombre: '5,85 g de NaCl en 100 g de agua (i = 2)', sc: { busca: 'prop', soluto: 'NaCl', ms: '5.85', disolvente: 'agua', md: '100', i: '', T: '25', V: '' } },
    { clave: 'cacl2', nombre: 'CaCl2 en agua: anticongelante (i = 3)', sc: { busca: 'prop', soluto: 'CaCl2', ms: '11.1', disolvente: 'agua', md: '200', i: '', T: '25', V: '' } },
    { clave: 'naftaleno', nombre: 'Naftaleno en benceno', sc: { busca: 'prop', soluto: 'C10H8', ms: '2.56', disolvente: 'benceno', md: '100', i: '', T: '25', V: '' } },
    { clave: 'm-crio', nombre: 'Masa molar por crioscopía', sc: { busca: 'M', via: 'crio', soluto: '', ms: '3.2', disolvente: 'agua', md: '100', medida: '0.33', i: '1', T: '25', V: '' } },
    { clave: 'm-alcanfor', nombre: 'Masa molar con alcanfor (método de Rast)', sc: { busca: 'M', via: 'crio', soluto: '', ms: '0.1', disolvente: 'alcanfor', md: '2', medida: '10', i: '1', T: '25', V: '' } },
    { clave: 'm-osmotica', nombre: 'Masa molar de una proteína por π', sc: { busca: 'M', via: 'osm', soluto: '', ms: '1', disolvente: 'agua', md: '100', medida: '0.0045', i: '1', T: '25', V: '100' } },
  ];

  return { concentracion, preparar, diluir, mezclar, coligativas, equivalentes, iones, TIPOS, OBJ, UC, UV, DISOLVENTES, ejemplos, ejemplosPreparar, ejemplosColig, f };
})();

