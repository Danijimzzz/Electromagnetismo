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
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`${nom} fehlt`); }
    const v = leeNum(sc[k]);
    if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine Zahl sein`);
    if (v <= min) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss größer als ${f(min)} sein`);
    if (v >= max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss kleiner als ${f(max)} sein`);
    return v;
  };
  const Mayus = (t) => t[0].toUpperCase() + t.slice(1);
  const sustancia = (texto, nom, modo) => {
    if (vacio(texto)) throw new Error(`Schreibe die Formel von ${nom}`);
    try { const r = Formulas.masaMolar(texto, modo); return { M: r.M, html: r.html }; } catch (e) { throw new Error(`${nom[0].toUpperCase() + nom.slice(1)}: ${e.message}`); }
  };

  const TIPOS = {
    mm: { nom: 'Massenanteil in %', u: '%', masa: true },
    ppm: { nom: 'Konzentration in ppm (mg/kg)', u: 'ppm', masa: true },
    m: { nom: 'molalidad', u: 'mol/kg', masa: true },
    x: { nom: 'Stoffmengenanteil des gelösten Stoffs', u: '', masa: true },
    M: { nom: 'molaridad', u: 'mol/L', masa: false },
    gL: { nom: 'Konzentration in g/L', u: 'g/L', masa: false },
    mv: { nom: '% masa/volumen', u: '% (g/100 mL)', masa: false },
    N: { nom: 'normalidad', u: 'eq/L', masa: false },
  };

  function equivalentes(texto) {
    const t = String(texto || '').replace(/\s/g, '');
    let q;
    if (/^H2O2?$/.test(t)) return null;
    if ((q = /^H(\d*)[A-Z]/.exec(t))) return { z: +(q[1] || 1), porque: `ist eine Säure mit ${q[1] || 1} sauren H${+(q[1] || 1) > 1 ? '' : ''}` };
    if ((q = /\(OH\)(\d+)$/.exec(t))) return { z: +q[1], porque: `ist ein Hydroxid mit ${q[1]} OH` };
    if (/[A-Z][a-z]?OH$/.test(t) && !/C/.test(t)) return { z: 1, porque: 'ist ein Hydroxid mit einem OH' };
    if (/COOH$/.test(t)) return { z: 1, porque: 'ist eine Carbonsäure mit einem sauren H' };
    return null;
  }
  function leeZ(sc, soluto) {
    if (!vacio(sc.z)) { const z = num(sc, 'z', 'die Anzahl der Äquivalente pro Mol'); return { z, html: `z = ${f(z)} eq/mol (dato)` }; }
    const e = equivalentes(soluto);
    return e ? { z: e.z, html: `z = ${e.z} eq/mol, weil ${e.porque}` } : { z: 1, html: 'z = 1 eq/mol: Es lässt sich nicht aus der Formel ableiten, deshalb wird 1 angenommen (schreibe es, falls es ein anderer Wert ist, zum Beispiel die Gesamtladung des Kations bei einem Salz)' };
  }

  function concentracion(sc) {
    const modo = sc.modo || 'iupac';
    const S = sustancia(sc.soluto, 'soluto', modo), D = sustancia(vacio(sc.disolvente) ? 'H2O' : sc.disolvente, 'disolvente', modo);
    const tipo = TIPOS[sc.tipo] ? sc.tipo : 'M', T = TIPOS[tipo], Z = leeZ(sc, sc.soluto);
    const v = num(sc, 'valor', `der Wert von ${T.nom}`, { max: tipo === 'mm' || tipo === 'mv' ? (tipo === 'mm' ? 100 : Infinity) : tipo === 'x' ? 1 : tipo === 'ppm' ? 1e6 : Infinity });
    const rho = num(sc, 'densidad', 'la densidad', { opcional: true });
    const pasos = [];
    const s = S.html, d = D.html;
    pasos.push({ t: 'Molare Massen', html: `M(${s}) = <b>${f(S.M)} g/mol</b> &nbsp; M(${d}) = <b>${f(D.M)} g/mol</b>` });
    let ms, md = null, V = null, ns, nd = null, base;
    if (tipo === 'mm') { base = '100 g Lösung'; ms = v; md = 100 - v; pasos.push({ t: 'Rechenbasis: 100 g Lösung', html: `Bei ${f(v)} Massenprozent sind es <b>${f(ms)} g gelöster Stoff</b> und 100 − ${f(v)} = <b>${f(md)} g Lösungsmittel</b>.` }); }
    else if (tipo === 'ppm') { base = '1 kg Lösung'; ms = v / 1000; md = 1000 - ms; pasos.push({ t: 'Rechenbasis: 1 kg Lösung', html: `${f(v)} ppm sind ${f(v)} mg gelöster Stoff pro kg: <b>${f(ms)} g gelöster Stoff</b> und <b>${f(md)} g Lösungsmittel</b>.` }); }
    else if (tipo === 'm') { base = '1 kg Lösungsmittel'; ns = v; ms = v * S.M; md = 1000; pasos.push({ t: 'Rechenbasis: 1 kg Lösungsmittel', html: `Es sind ${f(v)} mol gelöster Stoff ⇒ m<sub>s</sub> = n · M = ${f(v)} · ${f(S.M)} = <b>${f(ms)} g</b>, mit <b>1000 g Lösungsmittel</b>.` }); }
    else if (tipo === 'x') { base = 'Insgesamt 1 mol'; ns = v; nd = 1 - v; ms = ns * S.M; md = nd * D.M; pasos.push({ t: 'Rechenbasis: 1 mol Lösung', html: `n<sub>s</sub> = ${f(ns)} mol ⇒ m<sub>s</sub> = ${f(ns)} · ${f(S.M)} = <b>${f(ms)} g</b>; n<sub>d</sub> = 1 − ${f(v)} = ${f(nd)} mol ⇒ m<sub>d</sub> = ${f(nd)} · ${f(D.M)} = <b>${f(md)} g</b>.` }); }
    else {
      base = tipo === 'mv' ? '100 mL Lösung' : '1 L Lösung';
      V = tipo === 'mv' ? 100 : 1000;
      if (tipo === 'N') { ns = v / Z.z; ms = ns * S.M; pasos.push({ t: 'Rechenbasis: 1 L Lösung', html: `Äquivalente pro Mol: ${Z.html}. Es sind ${f(v)} eq ⇒ n<sub>s</sub> = ${f(v)} / ${f(Z.z)} = ${f(ns)} mol ⇒ m<sub>s</sub> = ${f(ns)} · ${f(S.M)} = <b>${f(ms)} g</b>.` }); }
      else if (tipo === 'M') { ns = v; ms = v * S.M; pasos.push({ t: 'Rechenbasis: 1 L Lösung', html: `Es sind ${f(v)} mol gelöster Stoff ⇒ m<sub>s</sub> = ${f(v)} · ${f(S.M)} = <b>${f(ms)} g</b>.` }); }
      else if (tipo === 'gL') { ms = v; pasos.push({ t: 'Rechenbasis: 1 L Lösung', html: `Es sind <b>${f(ms)} g gelöster Stoff</b> in 1000 mL.` }); }
      else { ms = v; pasos.push({ t: 'Rechenbasis: 100 mL Lösung', html: `${f(v)} % m/v sind <b>${f(ms)} g gelöster Stoff</b> in 100 mL Lösung.` }); }
      if (rho !== null) {
        const msol = rho * V;
        md = msol - ms;
        pasos.push({ t: 'Masse der Lösung', html: `m = ρ · V = ${f(rho)} g/mL · ${f(V)} mL = ${f(msol)} g ⇒ Lösungsmittel: ${f(msol)} − ${f(ms)} = <b>${f(md)} g</b>.` });
        if (md <= 0) throw new Error(`Mit dieser Dichte würde die Lösung weniger wiegen als der gelöste Stoff, den sie enthält (${f(ms)} g in ${f(V)} mL): Prüfe die Daten`);
      }
    }
    if (ns === undefined) ns = ms / S.M;
    if (nd === null && md !== null) nd = md / D.M;
    const msol = md !== null ? ms + md : null;
    if (V === null && rho !== null) { V = msol / rho; pasos.push({ t: 'Volumen der Lösung', html: `V = m / ρ = ${f(msol)} g / ${f(rho)} g/mL = <b>${f(V)} mL</b>.` }); }
    if (tipo !== 'm' && tipo !== 'M' && tipo !== 'x' && tipo !== 'N') pasos.push({ t: 'Stoffmenge', html: `n<sub>s</sub> = m<sub>s</sub> / M = ${f(ms)} / ${f(S.M)} = <b>${f(ns)} mol</b>${nd !== null && tipo !== 'x' ? ` &nbsp; n<sub>d</sub> = ${f(md)} / ${f(D.M)} = <b>${f(nd)} mol</b>` : ''}` });
    else if (tipo !== 'x' && nd !== null) pasos.push({ t: 'Stoffmenge des Lösungsmittels', html: `n<sub>d</sub> = ${f(md)} / ${f(D.M)} = <b>${f(nd)} mol</b>` });
    const val = {}, faltan = [];
    const pon = (k, cuenta, html) => {
      if (cuenta === null) { faltan.push(k); return; }
      val[k] = cuenta;
      if (k !== tipo) pasos.push({ t: TIPOS[k].nom[0].toUpperCase() + TIPOS[k].nom.slice(1), html: `${html} = <b>${f(cuenta)}${TIPOS[k].u ? ' ' + TIPOS[k].u : ''}</b>` });
    };
    pon('mm', msol !== null ? (100 * ms) / msol : null, `% = 100 · m<sub>s</sub> / m<sub>Lösung</sub> = 100 · ${f(ms)} / ${f(msol)}`);
    pon('ppm', msol !== null ? (1e6 * ms) / msol : null, `ppm = 10<sup>6</sup> · m<sub>s</sub> / m<sub>Lösung</sub>`);
    pon('m', md !== null ? ns / (md / 1000) : null, `m = n<sub>s</sub> / kg Lösungsmittel = ${f(ns)} / ${f(md / 1000)}`);
    pon('x', nd !== null ? ns / (ns + nd) : null, `x<sub>s</sub> = n<sub>s</sub> / (n<sub>s</sub> + n<sub>d</sub>) = ${f(ns)} / (${f(ns)} + ${f(nd)})`);
    pon('M', V !== null ? ns / (V / 1000) : null, `M = n<sub>s</sub> / V(L) = ${f(ns)} / ${f(V / 1000)}`);
    pon('gL', V !== null ? ms / (V / 1000) : null, `c = m<sub>s</sub> / V(L) = ${f(ms)} / ${f(V / 1000)}`);
    pon('mv', V !== null ? (100 * ms) / V : null, `% m/v = 100 · m<sub>s</sub> / V(mL) = 100 · ${f(ms)} / ${f(V)}`);
    pon('N', V !== null ? (Z.z * ns) / (V / 1000) : null, `${tipo === 'N' ? '' : `Mit ${Z.html}: `}N = z · M = ${f(Z.z)} · ${f(ns / (V / 1000))}`);
    val[tipo] = v;
    if (nd !== null) val.xd = nd / (ns + nd);
    if (msol !== null && V !== null) val.densidad = msol / V;
    if (faltan.length) pasos.push({ t: 'Ohne die Dichte', html: `Um von Masse zu Volumen zu wechseln, braucht man die Dichte der Lösung: Ohne sie lassen sich ${faltan.map((k) => TIPOS[k].nom).join(', ')} nicht berechnen.` });
    return { S, D, tipo, base, ms, md, V, ns, nd, z: Z.z, valores: val, faltan, pasos };
  }

  const seguridad = (soluto, comercial) => {
    const t = String(soluto || '').replace(/\s/g, '');
    if (comercial && /^H\d*[A-Z]/.test(t) && !/^H2O2?$/.test(t)) return ` Immer die Säure ins Wasser, langsam und unter Rühren, niemals umgekehrt: Beim Verdünnen gibt sie Wärme ab, und auf die Säure gegossenes Wasser kann plötzlich aufkochen und spritzen${/SO4|NO3|Cl|ClO4/.test(t) ? '. Arbeite im Abzug, mit Schutzbrille und Handschuhen' : ''}.`;
    if (/^(Li|Na|K)OH$/.test(t)) return ' Beim Lösen erwärmt es sich stark: Gib es langsam in kaltes Wasser, mit Schutzbrille und Handschuhen.';
    if (comercial && /^NH3$/.test(t)) return ' Konzentrierter Ammoniak setzt Gas frei: Miss ihn im Abzug ab.';
    return '';
  };
  const OBJ = {
    M: { nom: 'molaridad', u: 'mol/L', q: 'V' }, N: { nom: 'normalidad', u: 'eq/L', q: 'V' }, gL: { nom: 'Konzentration in g/L', u: 'g/L', q: 'V' },
    mv: { nom: '% m/v', u: '%', q: 'V' }, mm: { nom: 'Massenanteil in %', u: '%', q: 'masa' }, m: { nom: 'molalidad', u: 'mol/kg', q: 'disolvente' },
  };
  function preparar(sc) {
    const S = sustancia(sc.soluto, 'soluto', sc.modo || 'iupac'), obj = OBJ[sc.obj] ? sc.obj : 'M', O = OBJ[obj];
    const c = num(sc, 'M', `${O.nom} (gewünscht)`, { max: obj === 'mm' ? 100 : Infinity });
    const Q = num(sc, 'V', O.q === 'V' ? 'das gewünschte anzusetzende Volumen' : O.q === 'masa' ? 'die gewünschte anzusetzende Masse an Lösung' : 'die Masse des Lösungsmittels');
    const pasos = [];
    let n, mp;
    if (obj === 'M') { n = (c * Q) / 1000; mp = n * S.M; pasos.push({ t: 'Stoffmenge des gelösten Stoffs', html: `n = M · V = ${f(c)} mol/L · ${f(Q / 1000)} L = <b>${f(n)} mol</b>` }); }
    else if (obj === 'N') { const Z = leeZ(sc, sc.soluto); n = (c * Q) / 1000 / Z.z; mp = n * S.M; pasos.push({ t: 'Äquivalente und Stoffmenge', html: `${Z.html}. Äquivalente = N · V = ${f(c)} · ${f(Q / 1000)} = ${f((c * Q) / 1000)} eq ⇒ n = eq / z = <b>${f(n)} mol</b>` }); }
    else if (obj === 'gL' || obj === 'mv') { mp = obj === 'gL' ? (c * Q) / 1000 : (c * Q) / 100; n = mp / S.M; pasos.push({ t: 'Masse des gelösten Stoffs', html: obj === 'gL' ? `m = c · V = ${f(c)} g/L · ${f(Q / 1000)} L = <b>${f(mp)} g</b>` : `${f(c)} % m/v sind ${f(c)} g pro 100 mL: m = ${f(c)} · ${f(Q)} / 100 = <b>${f(mp)} g</b>` }); }
    else if (obj === 'mm') { mp = (c * Q) / 100; n = mp / S.M; pasos.push({ t: 'Masse des gelösten Stoffs', html: `${f(c)} % von ${f(Q)} g Lösung: m = ${f(c)} · ${f(Q)} / 100 = <b>${f(mp)} g</b>` }); }
    else { n = (c * Q) / 1000; mp = n * S.M; pasos.push({ t: 'Stoffmenge des gelösten Stoffs', html: `n = m · kg Lösungsmittel = ${f(c)} · ${f(Q / 1000)} = <b>${f(n)} mol</b>` }); }
    const res = { n, mPuro: mp, S, obj };
    if (obj !== 'gL' && obj !== 'mv' && obj !== 'mm') pasos.push({ t: 'Masse des reinen gelösten Stoffs', html: `m = n · M(${S.html}) = ${f(n)} · ${f(S.M)} = <b>${f(mp)} g</b>` });
    else pasos.push({ t: 'Stoffmenge des gelösten Stoffs', html: `n = m / M(${S.html}) = ${f(mp)} / ${f(S.M)} = <b>${f(n)} mol</b>` });
    const fin = (mReactivo, aguaDentro) => {
      if (O.q === 'V') return sc.origen === 'comercial' ? `in einem ${f(Q)}-mL-Messkolben und fülle mit Wasser bis zur Marke auf.` : `gib es in einen ${f(Q)}-mL-Messkolben und fülle bis zur Marke auf.`;
      if (O.q === 'masa') { const a = Q - mReactivo; if (a < 0) throw new Error('Bei so geringer Lösungsmasse passt der gelöste Stoff nicht hinein: So konzentriert lässt sie sich nicht ansetzen'); res.agua = a; return `gib ${f(a)} g Wasser (abgewogen) hinzu, bis du ${f(Q)} g Lösung hast.`; }
      const a = Q - aguaDentro; if (a < 0) throw new Error('Das handelsübliche Reagenz bringt bereits mehr Wasser mit, als das gewünschte Lösungsmittel ausmacht: So konzentriert lässt sie sich nicht ansetzen'); res.agua = a; return `gib ${f(a)} g Wasser hinzu${aguaDentro > 0 ? ` (das Reagenz bringt bereits ${f(aguaDentro)} g der ${f(Q)} g Lösungsmittel mit)` : ''}.`;
    };
    if (sc.origen === 'comercial') {
      const r = num(sc, 'riqueza', 'la riqueza', { max: 100.0000001 }), rho = num(sc, 'densidad', 'die Dichte des handelsüblichen Reagenzes');
      const mc = (mp * 100) / r, Vc = mc / rho;
      Object.assign(res, { mComercial: mc, Vcomercial: Vc, Mcomercial: (1000 * rho * (r / 100)) / S.M });
      pasos.push({ t: 'Masse des handelsüblichen Reagenzes', html: `Nur ${f(r)} % sind gelöster Stoff: m = ${f(mp)} · 100 / ${f(r)} = <b>${f(mc)} g</b>` });
      pasos.push({ t: 'Volumen des handelsüblichen Reagenzes', html: `V = m / ρ = ${f(mc)} / ${f(rho)} = <b>${f(Vc)} mL</b>` });
      pasos.push({ t: 'Molarität des handelsüblichen Reagenzes', html: `In 1 L: 1000 · ${f(rho)} · ${f(r / 100)} / ${f(S.M)} = <b>${f(res.Mcomercial)} mol/L</b>.${obj === 'M' ? ` Kontrolle: ${f(res.Mcomercial)} · ${f(Vc)} = ${f(c)} · ${f(Q)} (C<sub>1</sub>V<sub>1</sub> = C<sub>2</sub>V<sub>2</sub>).` : ''}` });
      if (O.q === 'V' && Vc > Q) throw new Error(`Man bräuchte mehr handelsübliches Reagenz (${f(Vc)} mL) als das Endvolumen: So konzentriert lässt sie sich nicht ansetzen`);
      res.instrucciones = `Miss ${f(Vc)} mL des handelsüblichen Reagenzes mit einer Pipette ab und gib sie zu Wasser ${O.q === 'V' ? fin(mc, 0) : `in einem Becherglas auf der Waage und ${fin(mc, mc - mp)}`}${seguridad(sc.soluto, true)}`;
    } else {
      const p = vacio(sc.pureza) ? 100 : num(sc, 'pureza', 'la pureza', { max: 100.0000001 });
      const m = (mp * 100) / p;
      res.mPesar = m;
      if (p < 100) pasos.push({ t: 'Mit der Reinheit', html: `Der Feststoff ist ${f(p)} % rein: m = ${f(mp)} · 100 / ${f(p)} = <b>${f(m)} g</b>` });
      const como = O.q === 'V' ? `, löse ihn in etwas Wasser, ${fin(m, 0)}` : O.q === 'masa' ? ` in einem Becherglas auf der Waage und ${fin(m, 0)}` : (fin(m, 0), ` und löse ihn in ${f(Q)} g Wasser.`);
      res.instrucciones = `Wiege ${f(m)} g des Feststoffs ab${como}${seguridad(sc.soluto, false)}`;
    }
    pasos.push({ t: 'Wie man ihn ansetzt', html: res.instrucciones });
    return { ...res, pasos };
  }

  const UC = { M: [1, 'mol', 'mol/L'], mM: [1e-3, 'mol', 'mmol/L'], uM: [1e-6, 'mol', 'µmol/L'], N: [1, 'eq', 'eq/L'], gL: [1, 'masa', 'g/L'], mgL: [1e-3, 'masa', 'mg/L'], mv: [10, 'masa', '% m/v'] };
  const UV = { L: [1000, 'L'], mL: [1, 'mL'], uL: [1e-3, 'µL'] };
  function diluir(sc) {
    const k = ['C1', 'V1', 'C2', 'V2'].filter((x) => vacio(sc[x]));
    if (k.length !== 1) throw new Error('Lass genau einen der vier Werte leer: Er wird berechnet');
    const nom = { C1: 'die Anfangskonzentration', V1: 'das Anfangsvolumen', C2: 'die Endkonzentration', V2: 'das Endvolumen' };
    const u = (x) => (x[0] === 'C' ? UC[sc['u' + x]] || UC.M : UV[sc['u' + x]] || UV.mL), q = k[0];
    if (u('C1')[1] !== u('C2')[1]) throw new Error(`Ohne die molare Masse${u('C1')[1] === 'eq' || u('C2')[1] === 'eq' ? ' oder die Äquivalente' : ''} lässt sich nicht von ${u('C1')[2]} nach ${u('C2')[2]} umrechnen: Verwende auf beiden Seiten dieselbe Art von Einheit`);
    const v = {}, b = {};
    for (const x of ['C1', 'V1', 'C2', 'V2']) if (x !== q) { v[x] = num(sc, x, nom[x]); b[x] = v[x] * u(x)[0]; }
    const html = { C1: 'C<sub>1</sub>', V1: 'V<sub>1</sub>', C2: 'C<sub>2</sub>', V2: 'V<sub>2</sub>' };
    const otro = { C1: 'V1', V1: 'C1', C2: 'V2', V2: 'C2' }[q], lado = q[1] === '1' ? ['C2', 'V2'] : ['C1', 'V1'];
    b[q] = (b[lado[0]] * b[lado[1]]) / b[otro]; v[q] = b[q] / u(q)[0];
    if (b.C2 > b.C1 * (1 + 1e-12)) throw new Error('Die Endkonzentration wird größer als die anfängliche: Das ist keine Verdünnung');
    const uc = UC[sc.uC1] ? sc.uC1 : 'M', base = { mol: 'mol/L', eq: 'eq/L', masa: 'g/L' }[u('C1')[1]];
    const mezcla = ['C1', 'C2'].some((x) => u(x)[0] !== 1) || ['V1', 'V2'].some((x) => u(x)[0] !== 1);
    const pasos = [];
    if (mezcla) pasos.push({ t: 'In dieselben Einheiten', html: `Alles wird in ${base} und mL umgerechnet: ${['C1', 'V1', 'C2', 'V2'].filter((x) => x !== q).map((x) => `${html[x]} = ${f(v[x])} ${u(x)[2] || u(x)[1]} = ${f(b[x])} ${x[0] === 'C' ? base : 'mL'}`).join('; ')}.` });
    pasos.push({ t: 'Die Stoffmenge des gelösten Stoffs ändert sich nicht', html: `C<sub>1</sub> V<sub>1</sub> = C<sub>2</sub> V<sub>2</sub> ⇒ ${html[q]} = ${html[lado[0]]} ${html[lado[1]]} / ${html[otro]} = ${f(b[lado[0]])} · ${f(b[lado[1]])} / ${f(b[otro])} = <b>${f(b[q])} ${q[0] === 'C' ? base : 'mL'}</b>${u(q)[0] !== 1 ? ` = <b>${f(v[q])} ${u(q)[2] || u(q)[1]}</b>` : ''}` });
    pasos.push({ t: 'Zugegebenes Wasser', html: `V<sub>2</sub> − V<sub>1</sub> = ${f(b.V2)} − ${f(b.V1)} = <b>${f(b.V2 - b.V1)} mL</b>, bei additiven Volumina. Der Verdünnungsfaktor ist ${f(b.C1 / b.C2)}.` });
    return { ...v, calculado: q, unidad: q[0] === 'C' ? u(q)[2] : u(q)[1], agua: b.V2 - b.V1, factor: b.C1 / b.C2, pasos, uc };
  }

  const DISOLVENTES = {
    agua: { nom: 'agua', f: 'H2O', Kc: 1.86, Ke: 0.512, Tf: 0, Te: 100, P0: 23.76 },
    benceno: { nom: 'benceno', f: 'C6H6', Kc: 5.12, Ke: 2.53, Tf: 5.5, Te: 80.1, P0: 95.1 },
    ciclohexano: { nom: 'ciclohexano', f: 'C6H12', Kc: 20.0, Ke: 2.79, Tf: 6.6, Te: 80.7, P0: 97.6 },
    etanol: { nom: 'etanol', f: 'C2H5OH', Kc: 1.99, Ke: 1.22, Tf: -114.6, Te: 78.4, P0: 59.0 },
    acetico: { nom: 'Essigsäure', f: 'CH3COOH', Kc: 3.90, Ke: 3.07, Tf: 16.6, Te: 117.9, P0: 15.7 },
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
    const ms = num(sc, 'ms', 'die Masse des gelösten Stoffs'), md = num(sc, 'md', 'die Masse des Lösungsmittels');
    const T = vacio(sc.T) ? 25 : num(sc, 'T', 'la temperatura', { min: -273.15 }), TK = T + 273.15;
    const ic = !vacio(sc.i) ? null : iones(sc.soluto), i = vacio(sc.i) ? ic || 1 : num(sc, 'i', 'den Van-\'t-Hoff-Faktor');
    const Mdis = Formulas.masaMolar(Dv.f, modo).M;
    pasos.push({ t: 'Lösungsmittel', html: `${Mayus(Dv.nom)}: K<sub>c</sub> = ${f(Dv.Kc)} K·kg/mol, K<sub>e</sub> = ${f(Dv.Ke)} K·kg/mol, schmilzt bei ${f(Dv.Tf)} °C und siedet bei ${f(Dv.Te)} °C (Tabellenwerte).` });
    pasos.push({ t: "Van-'t-Hoff-Faktor", html: vacio(sc.i) ? (ic ? `Es ist ein starker Elektrolyt, der ${ic} Ionen pro Formel liefert: <b>i = ${ic}</b> (in konzentrierten Lösungen ist das reale i etwas kleiner).` : 'Es dissoziiert nicht (oder es ist aus der Formel nicht bekannt): <b>i = 1</b>. Schreibe es, wenn es ein Elektrolyt ist.') : `<b>i = ${f(i)}</b> (Angabe).` });
    if (sc.busca === 'M') {
      const via = ['ebu', 'osm'].includes(sc.via) ? sc.via : 'crio', x = num(sc, 'medida', via === 'osm' ? 'den osmotischen Druck' : via === 'ebu' ? 'die Siedepunktserhöhung' : 'die Gefrierpunktserniedrigung');
      let M;
      if (via === 'osm') {
        const V = num(sc, 'V', 'das Volumen der Lösung');
        M = (i * ms * R * TK) / (x * (V / 1000));
        pasos.push({ t: 'Osmotischer Druck', html: `π = i · (n/V) · R · T ⇒ n = π V / (i R T) = ${f(x)} · ${f(V / 1000)} / (${f(i)} · 0,082 · ${f(TK)}) = ${f(ms / M)} mol` });
      } else {
        const K = via === 'ebu' ? Dv.Ke : Dv.Kc;
        M = (i * K * ms) / (x * (md / 1000));
        pasos.push({ t: via === 'ebu' ? 'Ebullioskopie' : 'Kryoskopie', html: `ΔT = i · K · m ⇒ m = ΔT / (i K) = ${f(x)} / (${f(i)} · ${f(K)}) = ${f(x / (i * K))} mol/kg ⇒ n = m · kg Lösungsmittel = ${f(x / (i * K))} · ${f(md / 1000)} = ${f(ms / M)} mol` });
      }
      pasos.push({ t: 'Molare Masse', html: `M = m / n = ${f(ms)} g / ${f(ms / M)} mol = <b>${f(M)} g/mol</b>` });
      return { busca: 'M', Dv, i, M, pasos };
    }
    const S = sustancia(sc.soluto, 'soluto', modo), n = ms / S.M, mol = n / (md / 1000);
    pasos.push({ t: 'Molalität', html: `n = ${f(ms)} / ${f(S.M)} = ${f(n)} mol; m = n / kg Lösungsmittel = ${f(n)} / ${f(md / 1000)} = <b>${f(mol)} mol/kg</b>` });
    const dTc = i * Dv.Kc * mol, dTe = i * Dv.Ke * mol;
    pasos.push({ t: 'Gefrierpunktserniedrigung', html: `ΔT<sub>c</sub> = i · K<sub>c</sub> · m = ${f(i)} · ${f(Dv.Kc)} · ${f(mol)} = <b>${f(dTc)} K</b>: Es gefriert bei ${f(Dv.Tf)} − ${f(dTc)} = <b>${f(Dv.Tf - dTc)} °C</b>` });
    pasos.push({ t: 'Siedepunktserhöhung', html: `ΔT<sub>e</sub> = i · K<sub>e</sub> · m = ${f(i)} · ${f(Dv.Ke)} · ${f(mol)} = <b>${f(dTe)} K</b>: Es siedet bei ${f(Dv.Te)} + ${f(dTe)} = <b>${f(Dv.Te + dTe)} °C</b>` });
    const V = vacio(sc.V) ? null : num(sc, 'V', 'das Volumen der Lösung'), Vl = V === null ? (md + ms) / 1000 : V / 1000;
    const pi = (i * n * R * TK) / Vl;
    pasos.push({ t: 'Osmotischer Druck', html: `π = i · M · R · T = ${f(i)} · ${f(n / Vl)} · 0,082 · ${f(TK)} = <b>${f(pi)} atm</b>${V === null ? ` (ohne das Volumen wird V ≈ ${f(Vl * 1000)} mL angenommen, als wäre die Dichte 1 g/mL)` : ''}` });
    const nd = md / Mdis, xd = nd / (nd + i * n), P0 = vacio(sc.P0) ? Dv.P0 : num(sc, 'P0', 'den Dampfdruck des reinen Lösungsmittels');
    let P = null;
    if (P0 !== null) { P = xd * P0; pasos.push({ t: 'Dampfdruck (Raoult)', html: `n<sub>d</sub> = ${f(md)} / ${f(Mdis)} = ${f(nd)} mol; x<sub>d</sub> = n<sub>d</sub> / (n<sub>d</sub> + i n) = ${f(xd)}; P = x<sub>d</sub> P° = ${f(xd)} · ${f(P0)} = <b>${f(P)} mmHg</b>, er sinkt um ${f(P0 - P)} mmHg${vacio(sc.P0) ? ' (P° bei 25 °C)' : ''}` }); }
    return { busca: 'prop', S, Dv, i, n, molal: mol, dTc, dTe, Tc: Dv.Tf - dTc, Te: Dv.Te + dTe, pi, P, P0, xd, pasos };
  }

  function mezclar(sc) {
    const C1 = num(sc, 'C1', 'die Konzentration der ersten', { min: -1e-300 }), V1 = num(sc, 'V1', 'das Volumen der ersten');
    const C2 = num(sc, 'C2', 'die Konzentration der zweiten', { min: -1e-300 }), V2 = num(sc, 'V2', 'das Volumen der zweiten');
    const Va = vacio(sc.Va) ? 0 : num(sc, 'Va', 'das zugegebene Wasser', { min: -1e-300 });
    const n = C1 * V1 + C2 * V2, Vt = V1 + V2 + Va, C = n / Vt;
    const pasos = [{ t: 'Konzentration der Mischung', html: `C = (C<sub>1</sub> V<sub>1</sub> + C<sub>2</sub> V<sub>2</sub>) / (V<sub>1</sub> + V<sub>2</sub>${Va ? ' + V<sub>Wasser</sub>' : ''}) = (${f(C1)} · ${f(V1)} + ${f(C2)} · ${f(V2)}) / ${f(Vt)} = <b>${f(C)}</b>, bei additiven Volumina.` }];
    return { C, Vt, pasos };
  }

  const ejemplos = [
    { clave: 'sulfurico', nombre: 'Handelsübliche Schwefelsäure (98 %, 1,84 g/mL)', sc: { soluto: 'H2SO4', disolvente: 'H2O', tipo: 'mm', valor: '98', densidad: '1.84' } },
    { clave: 'clorhidrico', nombre: 'Handelsübliche Salzsäure (37 %, 1,19 g/mL)', sc: { soluto: 'HCl', disolvente: 'H2O', tipo: 'mm', valor: '37', densidad: '1.19' } },
    { clave: 'suero', nombre: 'Physiologische Kochsalzlösung (0,9 % m/v)', sc: { soluto: 'NaCl', disolvente: 'H2O', tipo: 'mv', valor: '0.9', densidad: '1.005' } },
    { clave: 'glucosa', nombre: '0,5-molale Glucose (ohne Dichte)', sc: { soluto: 'C6H12O6', disolvente: 'H2O', tipo: 'm', valor: '0.5', densidad: '' } },
    { clave: 'etanol', nombre: 'Ethanol mit Stoffmengenanteil 0,1', sc: { soluto: 'C2H5OH', disolvente: 'H2O', tipo: 'x', valor: '0.1', densidad: '0.97' } },
    { clave: 'sosa', nombre: '2 M Natriumhydroxid', sc: { soluto: 'NaOH', disolvente: 'H2O', tipo: 'M', valor: '2', densidad: '1.08' } },
  ];
  const ejemplosPreparar = [
    { clave: 'nacl', nombre: '250 mL 0,1 M NaCl aus 99,5-%igem Feststoff', sc: { soluto: 'NaCl', M: '0.1', V: '250', origen: 'solido', pureza: '99.5' } },
    { clave: 'sulfato-cobre', nombre: '100 mL 0,2 M CuSO4 aus dem Pentahydrat', sc: { soluto: 'CuSO4·5H2O', M: '0.2', V: '100', origen: 'solido', pureza: '100' } },
    { clave: 'hcl', nombre: '500 mL 0,5 M HCl aus dem handelsüblichen', sc: { soluto: 'HCl', M: '0.5', V: '500', origen: 'comercial', riqueza: '37', densidad: '1.19' } },
    { clave: 'h2so4', nombre: '100 mL 1 M H2SO4 aus dem handelsüblichen', sc: { soluto: 'H2SO4', M: '1', V: '100', origen: 'comercial', riqueza: '98', densidad: '1.84' } },
    { clave: 'h2so4-normal', nombre: '250 mL 0,5 N H2SO4 aus dem handelsüblichen', sc: { soluto: 'H2SO4', obj: 'N', M: '0.5', V: '250', origen: 'comercial', riqueza: '98', densidad: '1.84' } },
    { clave: 'glucosa-gl', nombre: '500 mL Glucose mit 50 g/L', sc: { soluto: 'C6H12O6', obj: 'gL', M: '50', V: '500', origen: 'solido', pureza: '100' } },
    { clave: 'nacl-masa', nombre: '200 g NaCl mit 5 Massenprozent', sc: { soluto: 'NaCl', obj: 'mm', M: '5', V: '200', origen: 'solido', pureza: '100' } },
    { clave: 'urea-molal', nombre: '0,5-molale Harnstofflösung mit 250 g Wasser', sc: { soluto: 'CO(NH2)2', obj: 'm', M: '0.5', V: '250', origen: 'solido', pureza: '100' } },
    { clave: 'nitrico', nombre: '250 mL 1 M HNO3 aus dem handelsüblichen (65 %)', sc: { soluto: 'HNO3', M: '1', V: '250', origen: 'comercial', riqueza: '65', densidad: '1.39' } },
  ];
  const ejemplosColig = [
    { clave: 'glucosa-agua', nombre: '18 g Glucose in 500 g Wasser', sc: { busca: 'prop', soluto: 'C6H12O6', ms: '18', disolvente: 'agua', md: '500', i: '', T: '25', V: '' } },
    { clave: 'nacl-agua', nombre: '5,85 g NaCl in 100 g Wasser (i = 2)', sc: { busca: 'prop', soluto: 'NaCl', ms: '5.85', disolvente: 'agua', md: '100', i: '', T: '25', V: '' } },
    { clave: 'cacl2', nombre: 'CaCl2 in Wasser: Frostschutz (i = 3)', sc: { busca: 'prop', soluto: 'CaCl2', ms: '11.1', disolvente: 'agua', md: '200', i: '', T: '25', V: '' } },
    { clave: 'naftaleno', nombre: 'Naphthalin in Benzol', sc: { busca: 'prop', soluto: 'C10H8', ms: '2.56', disolvente: 'benceno', md: '100', i: '', T: '25', V: '' } },
    { clave: 'm-crio', nombre: 'Molare Masse durch Kryoskopie', sc: { busca: 'M', via: 'crio', soluto: '', ms: '3.2', disolvente: 'agua', md: '100', medida: '0.33', i: '1', T: '25', V: '' } },
    { clave: 'm-alcanfor', nombre: 'Molare Masse mit Campher (Rast-Methode)', sc: { busca: 'M', via: 'crio', soluto: '', ms: '0.1', disolvente: 'alcanfor', md: '2', medida: '10', i: '1', T: '25', V: '' } },
    { clave: 'm-osmotica', nombre: 'Molare Masse eines Proteins über π', sc: { busca: 'M', via: 'osm', soluto: '', ms: '1', disolvente: 'agua', md: '100', medida: '0.0045', i: '1', T: '25', V: '100' } },
  ];

  return { concentracion, preparar, diluir, mezclar, coligativas, equivalentes, iones, TIPOS, OBJ, UC, UV, DISOLVENTES, ejemplos, ejemplosPreparar, ejemplosColig, f };
})();

