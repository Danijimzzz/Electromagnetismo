const Calor = (() => {
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-9) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const leeNum = (s) => +String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[·x×*]10\^?([+\-−]?\d+)/i, 'e$1').replace('−', '-');
  const par = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';

  const SUSTANCIAS = {
    agua: { nombre: 'Wasser', cs: 2090, cl: 4180, cg: 2010, Tf: 0, Tv: 100, Lf: 334e3, Lv: 2257e3, fases: ['hielo', 'agua', 'vapor'] },
    etanol: { nombre: 'Ethanol', cs: 1960, cl: 2440, cg: 1420, Tf: -114, Tv: 78, Lf: 108e3, Lv: 855e3 },
    aluminio: { nombre: 'Aluminium', cs: 900, cl: 1180, Tf: 660, Lf: 397e3 },
    cobre: { nombre: 'Kupfer', cs: 385, cl: 494, Tf: 1085, Lf: 205e3 },
    hierro: { nombre: 'Eisen', cs: 450, cl: 820, Tf: 1538, Lf: 247e3 },
    plomo: { nombre: 'Blei', cs: 128, cl: 142, Tf: 327.5, Lf: 23e3 },
    estano: { nombre: 'Zinn', cs: 227, cl: 255, Tf: 231.9, Lf: 59e3 },
    plata: { nombre: 'Silber', cs: 235, cl: 310, Tf: 961.8, Lf: 105e3 },
    oro: { nombre: 'Gold', cs: 129, cl: 150, Tf: 1064, Lf: 64.5e3 },
    mercurio: { nombre: 'Quecksilber', cs: 135, cl: 140, cg: 104, Tf: -38.8, Tv: 356.7, Lf: 11.3e3, Lv: 295e3 },
    laton: { nombre: 'Messing', cs: 380 },
    vidrio: { nombre: 'Glas', cs: 840 },
    aceite: { nombre: 'Olivenöl', cl: 1970 },
    calorimetro: { nombre: 'Kalorimeter' },
    calentador: { nombre: 'Heizer (P · t)' },
    otra: { nombre: 'Andere (mit deinen Daten)' },
  };
  const FASES = ['fest', 'flüssig', 'gas'];

  function leerCuerpo(c, i) {
    const S = SUSTANCIAS[c.sustancia] || SUSTANCIAS.agua, quien = `Körper ${i + 1}`;
    const n = (k, nom, { opcional = false, positivo = false } = {}) => {
      if (vacio(c[k])) { if (opcional) return null; throw new Error(`${quien}: ${nom} fehlt`); }
      const v = leeNum(c[k]);
      if (!isFinite(v)) throw new Error(`${quien}: ${nom} muss eine Zahl sein`);
      if (positivo && v <= 0) throw new Error(`${quien}: ${nom} muss größer als 0 sein`);
      return v;
    };
    if (c.sustancia === 'calentador') {
      const P = n('P', 'die Leistung'), t = n('t', 'die Zeit', { positivo: true }), eta = vacio(c.eta) ? 100 : n('eta', 'der Wirkungsgrad', { positivo: true });
      if (eta > 100) throw new Error(`${quien}: Der Wirkungsgrad darf 100 % nicht übersteigen`);
      return { i, clave: 'calentador', nombre: 'Heizer', calentador: true, P, t, eta, Qext: (eta / 100) * P * t, m: 0 };
    }
    const T0 = n('T0', 'die Anfangstemperatur');
    if (T0 < -273.15) throw new Error(`${quien}: Die Temperatur darf nicht unter den absoluten Nullpunkt (−273,15 °C) fallen`);
    if (c.sustancia === 'calorimetro') {
      if (vacio(c.C) && !vacio(c.me)) { const me = n('me', 'der Wasserwert', { positivo: true }); return { i, clave: 'calorimetro', nombre: 'Kalorimeter', C: (me / 1000) * 4180, me, T0, m: 0 }; }
      return { i, clave: 'calorimetro', nombre: 'Kalorimeter', C: n('C', 'die Wärmekapazität', { positivo: true }), T0, m: 0 };
    }
    const p = c.sustancia === 'otra'
      ? { nombre: vacio(c.nombre) ? `Körper ${i + 1}` : String(c.nombre), cs: n('cs', 'die spezifische Wärmekapazität des Festkörpers', { opcional: true }), cl: n('cl', 'die spezifische Wärmekapazität der Flüssigkeit', { opcional: true }), cg: n('cg', 'die spezifische Wärmekapazität des Gases', { opcional: true }),
        Tf: n('Tf', 'die Schmelztemperatur', { opcional: true }), Tv: n('Tv', 'die Siedetemperatur', { opcional: true }), Lf: n('Lf', 'die latente Schmelzwärme', { opcional: true }), Lv: n('Lv', 'die latente Verdampfungswärme', { opcional: true }) }
      : { ...S };
    const m = n('m', 'die Masse', { positivo: true }) / 1000;
    if (p.Tf === null || p.Tf === undefined) { p.Tf = -Infinity; p.Lf = 0; }
    if (p.Tv === null || p.Tv === undefined) { p.Tv = Infinity; p.Lv = 0; }
    if (p.Tv <= p.Tf) throw new Error(`${quien}: Die Siedetemperatur muss über der Schmelztemperatur liegen`);
    for (const [k, nom] of [['cs', 'des Festkörpers'], ['cl', 'der Flüssigkeit'], ['cg', 'des Gases']]) if (p[k] != null && p[k] <= 0) throw new Error(`${quien}: Die spezifische Wärmekapazität ${nom} muss positiv sein`);
    let e = T0 < p.Tf ? 0 : T0 > p.Tv ? 2 : T0 > p.Tf && T0 < p.Tv ? 1 : null;
    const pedido = { solido: 0, liquido: 1, gas: 2 }[c.estado];
    if (e === null) e = pedido !== undefined ? pedido : 1;
    else if (pedido !== undefined && pedido !== e) throw new Error(`${quien}: Bei ${f(T0)} °C kann er nicht im Zustand ${FASES[pedido]} sein`);
    if ((T0 === p.Tf && e === 2) || (T0 === p.Tv && e === 0)) throw new Error(`${quien}: Bei ${f(T0)} °C kann er nicht im Zustand ${FASES[e]} sein`);
    if (p.cs == null && p.cl == null && p.cg == null) throw new Error(`${quien}: Die spezifische Wärmekapazität fehlt`);
    if (isFinite(p.Tf) && (p.Lf == null || p.Lf < 0)) throw new Error(`${quien}: Die latente Schmelzwärme fehlt`);
    if (isFinite(p.Tv) && (p.Lv == null || p.Lv < 0)) throw new Error(`${quien}: Die latente Verdampfungswärme fehlt`);
    return { i, clave: c.sustancia, ...p, m, T0, e0: e };
  }

  function tramos(b) {
    const T0K = -273.15;
    if (b.C !== undefined) return [{ tipo: 'sensible', fase: 0, Ta: T0K, Tb: Infinity, k: b.C, Ha: 0, Hb: Infinity }];
    const { m, Tf, Tv, Lf, Lv } = b;
    const cs = b.cs ?? b.cl ?? b.cg, cl = b.cl ?? b.cs ?? b.cg, cg = b.cg ?? b.cl ?? b.cs;
    const t = [];
    if (isFinite(Tf)) t.push({ tipo: 'sensible', fase: 0, Ta: T0K, Tb: Tf, k: m * cs }, { tipo: 'latente', fase: 0, T: Tf, L: Lf, m });
    t.push({ tipo: 'sensible', fase: 1, Ta: isFinite(Tf) ? Tf : T0K, Tb: Tv, k: m * cl });
    if (isFinite(Tv)) t.push({ tipo: 'latente', fase: 1, T: Tv, L: Lv, m }, { tipo: 'sensible', fase: 2, Ta: Tv, Tb: Infinity, k: m * cg });
    let Hc = 0;
    for (const s of t) {
      s.Ha = Hc;
      s.Hb = s.tipo === 'latente' ? Hc + s.m * s.L : isFinite(s.Tb) ? Hc + s.k * (s.Tb - s.Ta) : Infinity;
      Hc = s.Hb;
    }
    return t;
  }
  function H(b, T, e) {
    const s = tramos(b).find((x) => x.tipo === 'sensible' && x.fase === e && T >= x.Ta - 1e-9 && T <= x.Tb + 1e-9);
    return s ? s.Ha + s.k * (T - s.Ta) : NaN;
  }
  const faseEn = (b, T, alto) => (b.C !== undefined ? 0 : T < b.Tf || (T === b.Tf && !alto) ? 0 : T < b.Tv || (T === b.Tv && !alto) ? 1 : 2);
  const Hbajo = (b, T) => H(b, T, faseEn(b, T, false)), Halto = (b, T) => H(b, T, faseEn(b, T, true));

  function equilibrio(sc) {
    const lista = (sc.cuerpos || []).filter((c) => c && !c.quitar);
    if (lista.length < 2) throw new Error('Es sind mindestens zwei Körper nötig');
    const todos = lista.map(leerCuerpo), cal = todos.filter((b) => b.calentador), B = todos.filter((b) => !b.calentador);
    if (B.every((b) => b.C !== undefined)) throw new Error(B.length ? 'Außer dem Kalorimeter muss sich etwas darin befinden' : 'Außer dem Heizer muss es etwas zum Erwärmen geben');
    const Qext = cal.reduce((s, b) => s + b.Qext, 0);
    const H0 = B.map((b) => H(b, b.T0, b.C !== undefined ? 0 : b.e0));

    for (const [j, b] of B.entries()) if (!isFinite(H0[j])) throw new Error(`Körper ${j + 1}: Angaben zur Phase, in der er sich befindet, fehlen`);
    const total = (T, alto) => B.reduce((s, b, j) => s + (alto ? Halto(b, T) : Hbajo(b, T)) - H0[j], 0) - Qext;
    let Tmin = Math.min(...B.map((b) => b.T0)), Tmax = Math.max(...B.map((b) => b.T0));
    if (Qext < 0) { Tmin = -273.15; if (total(Tmin, false) > 0) throw new Error('Der Heizer entzieht mehr Wärme, als die Körper haben'); }
    if (Qext > 0) { let k = 0; while (total(Tmax, true) < 0 && k++ < 60) Tmax = Tmax + Math.max(100, Math.abs(Tmax)); }
    const cortes = [...new Set(B.flatMap((b) => (b.C !== undefined ? [] : [b.Tf, b.Tv])).filter((T) => isFinite(T) && T >= Tmin && T <= Tmax))].sort((a, b) => a - b);
    const nodos = [...new Set([Tmin, ...cortes, Tmax])].sort((a, b) => a - b);
    let Te = null, enCambio = null;
    for (const T of nodos) {
      const lo = total(T, false), hi = total(T, true);
      if (lo <= 1e-9 && hi >= -1e-9) { Te = T; if (hi - lo > 1e-9 && cortes.includes(T)) enCambio = { T, lo, hi }; break; }
    }
    if (Te === null) {
      for (let k = 0; k + 1 < nodos.length; k++) {
        const a = nodos[k], z = nodos[k + 1], Fa = total(a, true), Fz = total(z, false);
        if (Fa <= 0 && Fz >= 0) { Te = a + ((z - a) * -Fa) / (Fz - Fa); break; }
      }
    }
    if (Te === null) throw new Error('Ich finde die Gleichgewichtstemperatur nicht: Überprüfe die Angaben');
    const finales = B.map((b, j) => {
      const lo = Hbajo(b, Te), hi = Halto(b, Te);
      return { lo, hi, salto: hi - lo, j };
    });
    const Hf = finales.map((x, j) => Math.min(x.hi, Math.max(x.lo, H0[j])));
    let R = H0.reduce((s, v) => s + v, 0) + Qext - Hf.reduce((s, v) => s + v, 0);
    if (Math.abs(R) > 1e-9) {
      const cap = finales.map((x, j) => (R > 0 ? x.hi - Hf[j] : Hf[j] - x.lo)), tot = cap.reduce((s, v) => s + v, 0);
      if (tot > 0) Hf.forEach((_, j) => { Hf[j] += Math.sign(R) * Math.min(cap[j], (cap[j] / tot) * Math.abs(R)); });
    }
    const cuerpos = B.map((b, j) => {
      const Q = Hf[j] - H0[j], fr = finales[j].salto > 0 ? (Hf[j] - finales[j].lo) / finales[j].salto : null;
      const etapas = camino(b, H0[j], Hf[j]);
      let estado;
      if (b.C !== undefined) estado = `a ${f(Te)} °C`;
      else if (fr !== null && fr > 1e-9 && fr < 1 - 1e-9) {
        const e = faseEn(b, Te, false), nom = nombreFase(b, e), nom2 = nombreFase(b, e + 1);
        estado = `${f((1 - fr) * b.m * 1000)} g ${nom} und ${f(fr * b.m * 1000)} g ${nom2}`;
      } else estado = `${f(b.m * 1000)} g ${nombreFase(b, fr === null ? faseEn(b, Te, false) : fr >= 1 - 1e-9 ? faseEn(b, Te, true) : faseEn(b, Te, false))}`;
      const nombre = b.fases ? b.fases[b.e0][0].toUpperCase() + b.fases[b.e0].slice(1) : b.nombre;
      return { b, nombre, Q, etapas, estado, fraccion: fr };
    });
    for (const b of cal) cuerpos.push({ b, nombre: 'Heizer', Q: -b.Qext, etapas: [], estado: `liefert ${f(b.Qext)} J`, fraccion: null });
    const pasos = [];
    for (const b of cal) pasos.push({ t: 'Heizer', html: `$Q = η P t = ${f(b.eta / 100)} · ${f(b.P)} "W" · ${f(b.t)} "s"$ = <b>${f(b.Qext)} J</b>, die in das System gelangen: $Σ Q_{Körper} = Q_{Heizer}$.` });
    for (const c of cuerpos.filter((c) => !c.b.calentador)) pasos.push({ t: `${c.nombre}${c.b.C === undefined ? ` (${f(c.b.m * 1000)} g a ${f(c.b.T0)} °C)` : ` (C = ${f(c.b.C)} J/K a ${f(c.b.T0)} °C)`}`, html: c.etapas.length ? c.etapas.map((e) => e.html).join('<br>') + (c.etapas.length > 1 ? `<br>$Q$ = <b>${f(c.Q)} J</b>` : '') : 'Tauscht keine Wärme aus: Er hat bereits die Endtemperatur.' });
    const cedido = -cuerpos.filter((c) => c.Q < 0).reduce((s, c) => s + c.Q, 0), absorbido = cuerpos.filter((c) => c.Q > 0).reduce((s, c) => s + c.Q, 0);
    if (cal.length) cuerpos.forEach((c) => { if (c.b.calentador) c.Q = -c.b.Qext; });
    if (enCambio) {
      const cambian = cuerpos.filter((c) => c.fraccion !== null && c.fraccion > 1e-9 && c.fraccion < 1 - 1e-9);
      pasos.push({ t: 'Reicht es für einen Phasenübergang?', html: `Würde alles bei ${f(Te)} °C vor dem Phasenübergang enden, blieben ${f(-enCambio.lo)} J übrig; würde es danach enden, fehlten ${f(enCambio.hi)} J. Die Energie reicht nicht, den Phasenübergang abzuschließen, also bleibt das Gleichgewicht bei <b>T<sub>e</sub> = ${f(Te)} °C</b>${cambian.length ? ` mit ${cambian.map((c) => c.estado).join(' und ')}` : ''}.` });
    } else {
      const Ce = B.reduce((s, b) => s + (b.C !== undefined ? b.C : b.m * cEn(b, Te)), 0);
      pasos.push({ t: 'Gleichgewichtstemperatur', html: `$Σ Q = 0$ ⇒ die Summe aller Wärmen, mit $T_e$ als Unbekannter, wird bei <b>$T_e$ = ${f(Te)} °C</b> null. (Gesamtwärmekapazität bei dieser Temperatur: ${f(Ce)} J/K.)` });
    }
    pasos.push({ t: 'Kontrolle', html: `Abgegebene Wärme ${f(cedido)} J = aufgenommene Wärme ${f(absorbido)} J ⇒ $Σ Q = ${f(absorbido - cedido)} "J"$.` });
    return { Te, cuerpos, cedido, absorbido, enCambio: !!enCambio, pasos };
  }
  const cEn = (b, T) => { const e = faseEn(b, T, false); return e === 0 ? b.cs : e === 1 ? b.cl : b.cg; };
  const nombreFase = (b, e) => (b.fases ? b.fases[e] : !isFinite(b.Tf) && !isFinite(b.Tv) ? b.nombre.toLowerCase() : `${b.nombre.toLowerCase()} ${FASES[e]}`);

  function camino(b, H0, Hf) {
    const sube = Hf >= H0, lo = Math.min(H0, Hf), hi = Math.max(H0, Hf), out = [];
    if (hi - lo < 1e-9) return out;
    let lista = tramos(b).map((s) => ({ ...s })).filter((s) => Math.min(hi, s.Hb) - Math.max(lo, s.Ha) > 1e-9);
    if (!sube) lista = lista.reverse();
    for (const s of lista) {
      const a = Math.max(lo, s.Ha), z = Math.min(hi, s.Hb), Q = (z - a) * (sube ? 1 : -1);
      if (s.tipo === 'latente') {
        const dm = (z - a) / s.L, nom = s.fase === 0 ? (sube ? 'Schmelzen' : 'Erstarren') : sube ? 'Verdampfen' : 'Kondensieren';
        out.push({ tipo: 'latente', Q, T: s.T, dm, html: `${nom} a ${f(s.T)} °C: $Q = ${sube ? '' : '−'}m L = ${sube ? '' : '−'}${f(dm)} "kg" · ${f(s.L)} "J/kg"$ = <b>${f(Q)} J</b>` });
      } else {
        const Tde = (Hx) => s.Ta + (Hx - s.Ha) / s.k;
        const Ti = Tde(sube ? a : z), Tf_ = Tde(sube ? z : a), c = b.C !== undefined ? null : s.k / b.m;
        const fase = b.C !== undefined ? 'Kalorimeter' : nombreFase(b, s.fase);
        out.push({ tipo: 'sensible', Q, Ti, Tf: Tf_, html: `${sube ? 'Erwärmung' : 'Abkühlung'} ${b.C !== undefined ? 'des Kalorimeters' : `(${fase})`} von ${f(Ti)} auf ${f(Tf_)} °C: $Q = ${b.C !== undefined ? `C ΔT = ${f(b.C)} · (${f(Tf_)} − ${par(Ti)})` : `m c ΔT = ${f(b.m)} · ${f(c)} · (${f(Tf_)} − ${par(Ti)})`}$ = <b>${f(Q)} J</b>` });
      }
    }
    return out;
  }

  function curva(c) {
    const pts = [[0, c.b.T0]];
    let Q = 0;
    for (const e of c.etapas) { Q += e.Q; pts.push([Q, e.tipo === 'latente' ? e.T : e.Tf]); }
    return pts;
  }

  const INCOGNITAS = { m: 'die Masse', T0: 'die Anfangstemperatur', C: 'die Wärmekapazität', me: 'der Wasserwert', cs: 'die spezifische Wärmekapazität', cl: 'die spezifische Wärmekapazität', cg: 'die spezifische Wärmekapazität', P: 'die Leistung', t: 'die Zeit' };
  const UNIDAD = { m: 'g', T0: '°C', C: 'J/K', me: 'g', cs: 'J/(kg·K)', cl: 'J/(kg·K)', cg: 'J/(kg·K)', P: 'W', t: 's' };
  const esInc = (v) => String(v ?? '').trim() === '?';
  function resolver(sc) {
    const lista = (sc.cuerpos || []).filter((c) => c && !c.quitar);
    const inc = [];
    lista.forEach((c, i) => { for (const k of Object.keys(INCOGNITAS)) if (esInc(c[k])) inc.push({ i, k }); });
    if (!inc.length) return { ...equilibrio(sc), incognita: null };
    if (inc.length > 1) throw new Error('Es darf nur eine unbekannte Größe geben (mit „?“)');
    if (vacio(sc.Tfin)) throw new Error('Um die Größe mit „?“ zu bestimmen, wird die Endtemperatur benötigt');
    const Tfin = leeNum(sc.Tfin);
    if (!isFinite(Tfin)) throw new Error('Die Endtemperatur muss eine Zahl sein');
    const { i, k } = inc[0], lineal = k === 'T0';
    const con = (x) => ({ cuerpos: lista.map((c, j) => (j === i ? { ...c, [k]: String(x) } : c)) });
    const Te = (x) => { try { return equilibrio(con(x)).Te; } catch (e) { return NaN; } };
    const a = lineal ? -273.15 : 1e-6, z = lineal ? 1e5 : 1e10;
    const Ta = Te(a), Tz = Te(z), eps = 1e-12 * Math.max(1, Math.abs(Tfin));
    if (!isFinite(Ta) || !isFinite(Tz) || (Tfin - Ta) * (Tfin - Tz) > 0) throw new Error(`Kein Wert für ${INCOGNITAS[k]} bringt die Mischung auf ${f(Tfin)} °C`);
    const sube = Tz > Ta, llega = (x) => { const T = Te(x); return sube ? T >= Tfin - eps : T <= Tfin + eps; };
    let lo = lineal ? a : Math.log(a), hi = lineal ? z : Math.log(z);
    const val = (u) => (lineal ? u : Math.exp(u));
    for (let n = 0; n < 200; n++) { const mid = (lo + hi) / 2; if (llega(val(mid))) hi = mid; else lo = mid; }
    const x = val(hi), r = equilibrio(con(x));
    const quien = r.cuerpos[i] ? r.cuerpos[i].nombre : `Körper ${i + 1}`;
    const meseta = Math.abs(r.Te - Tfin) < 1e-6 * Math.max(1, Math.abs(Tfin)) && r.enCambio;
    r.pasos.unshift({ t: 'Unbekannte Größe', html: `Gesucht wird ${INCOGNITAS[k]} von ${esc_(quien)}, damit das Gleichgewicht bei $T_e$ = ${f(Tfin)} °C liegt. Die Gleichung $Σ Q = 0$ mit diesem $T_e$ und der Größe als Unbekannter ergibt <b>${f(x)} ${UNIDAD[k]}</b>${meseta ? ' (genau der Wert, um diese Temperatur zu erreichen: Es ist die eines Phasenübergangs, und bei größerer Menge bliebe sie ebenfalls dort)' : ''}. Mit diesem Wert tauscht jeder Körper aus:` });
    return { ...r, incognita: { i, k, valor: x, nombre: INCOGNITAS[k], unidad: UNIDAD[k], quien, Tfin } };
  }
  const esc_ = (s) => String(s).replace(/[<>&]/g, '');

  const DILATA = {
    acero: { nombre: 'Stahl', a: 12e-6 }, aluminio: { nombre: 'Aluminium', a: 23e-6 }, cobre: { nombre: 'Kupfer', a: 17e-6 }, laton: { nombre: 'Messing', a: 19e-6 },
    vidrio: { nombre: 'Glas', a: 9e-6 }, pyrex: { nombre: 'Pyrexglas', a: 3.2e-6 }, hormigon: { nombre: 'Beton', a: 12e-6 },
    agua: { nombre: 'Wasser (Flüssigkeit)', b: 2.1e-4 }, mercurio: { nombre: 'Quecksilber (Flüssigkeit)', b: 1.82e-4 }, etanol: { nombre: 'Ethanol (Flüssigkeit)', b: 1.1e-3 }, glicerina: { nombre: 'Glycerin (Flüssigkeit)', b: 5e-4 },
    otro: { nombre: 'Anderes (mit deinem Koeffizienten)' },
  };
  function dilatacion(sc) {
    const num = (k, nom, opc) => { if (vacio(sc[k])) { if (opc) return null; throw new Error(`Es fehlt ${nom}`); } const v = leeNum(sc[k]); if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} muss eine Zahl sein`); return v; };
    const tipo = ['superficial', 'volumen', 'rebose'].includes(sc.tipo) ? sc.tipo : 'lineal';
    const M = DILATA[sc.mat] || DILATA.acero;
    const coef = sc.mat === 'otro' ? num('coef', 'der Ausdehnungskoeffizient') : M.a ?? M.b;
    const esLiq = sc.mat === 'otro' ? tipo === 'volumen' || tipo === 'rebose' : M.b !== undefined;
    const X0 = num('medida', 'das Anfangsmaß'), T0 = num('T0', 'die Anfangstemperatur'), T1 = num('T1', 'die Endtemperatur', true), obj = num('objetivo', 'das gesuchte Maß', true);
    if (X0 <= 0) throw new Error('Das Anfangsmaß muss größer als 0 sein');
    if (tipo !== 'volumen' && tipo !== 'rebose' && esLiq) throw new Error('Eine Flüssigkeit hat keine eigene Länge oder Fläche: Verwende die Volumenausdehnung');
    if (tipo === 'rebose' && !esLiq) throw new Error('Beim Überlaufen ist das Material die Flüssigkeit; das Gefäß wird gesondert angegeben');
    if (T1 === null && obj === null) throw new Error('Es fehlt die Endtemperatur (oder das Maß, das du erreichen willst)');
    const U = { lineal: 'm', superficial: 'm²', volumen: 'L', rebose: 'L' }[tipo];
    const pasos = [], res = {};
    let k, sim, nom;
    if (tipo === 'rebose') {
      const R = DILATA[sc.rec] && DILATA[sc.rec].a !== undefined ? DILATA[sc.rec] : DILATA.vidrio;
      const bl = esLiq && sc.mat === 'otro' ? coef : coef, br = 3 * R.a;
      k = bl - br; sim = 'β_ap'; nom = 'scheinbarer Koeffizient';
      pasos.push({ t: 'Koeffizienten', html: `Flüssigkeit $β$ = ${f(bl)} K⁻¹; Gefäß aus ${R.nombre.toLowerCase()} $β_r = 3α = 3 · ${f(R.a)}$ = ${f(br)} K⁻¹. Die überlaufende Flüssigkeit dehnt sich mit dem scheinbaren Koeffizienten $β_{sch} = β − β_r$ = <b>${f(k)} K⁻¹</b> aus.` });
      Object.assign(res, { beta: bl, betaR: br, betaAp: k });
    } else {
      k = tipo === 'lineal' ? coef : tipo === 'superficial' ? 2 * coef : esLiq ? coef : 3 * coef;
      sim = tipo === 'lineal' ? 'α' : tipo === 'superficial' ? 'γ' : 'β';
      if (tipo !== 'lineal' && !esLiq) pasos.push({ t: 'Koeffizient', html: `In einem isotropen Festkörper gilt $${sim} = ${tipo === 'superficial' ? 2 : 3}α = ${tipo === 'superficial' ? 2 : 3} · ${f(coef)}$ = <b>${f(k)} K⁻¹</b>.` });
    }
    const letra = { lineal: 'L', superficial: 'S', volumen: 'V', rebose: 'V' }[tipo];
    if (T1 !== null) {
      const dT = T1 - T0, dX = k * X0 * dT;
      Object.assign(res, { dT, dX, X1: X0 + dX, k });
      pasos.push({ t: tipo === 'rebose' ? 'Überlaufendes Volumen' : 'Ausdehnung', html: `$Δ${letra} = ${sim} ${letra}_0 ΔT = ${f(k)} · ${f(X0)} · (${f(T1)} − ${par(T0)})$ = <b>${f(dX)} ${U}</b>${tipo === 'rebose' ? (dX >= 0 ? ' laufen über' : ' (der Pegel sinkt: Es läuft nichts über)') : ` ⇒ $${letra} = ${letra}_0 + Δ${letra}$ = <b>${f(X0 + dX)} ${U}</b>`} (${f(100 * k * dT, 3)} %).` });
    }
    if (obj !== null && tipo !== 'rebose') {
      const Tn = T0 + (obj - X0) / (k * X0);
      res.Tobjetivo = Tn;
      pasos.push({ t: `Bei welcher Temperatur misst es ${f(obj)} ${U}?`, html: `$ΔT = {${letra} − ${letra}_0}/{${sim} ${letra}_0} = {${f(obj)} − ${f(X0)}}/{${f(k)} · ${f(X0)}}$ = ${f(Tn - T0)} K ⇒ <b>T = ${f(Tn)} °C</b>.` });
    }
    return { tipo, k, sim, X0, T0, T1, U, pasos, res, liquido: esLiq };
  }

  const ejemplos = [
    { clave: 'hielo-agua', nombre: 'Eis von −10 °C in lauwarmem Wasser: Es schmilzt ganz', cuerpos: [{ sustancia: 'agua', m: '50', T0: '-10' }, { sustancia: 'agua', m: '200', T0: '40' }] },
    { clave: 'sobra-hielo', nombre: 'Viel Eis: Das Gleichgewicht bleibt bei 0 °C', cuerpos: [{ sustancia: 'agua', m: '100', T0: '0', estado: 'solido' }, { sustancia: 'agua', m: '100', T0: '20' }] },
    { clave: 'cobre-agua', nombre: 'Heißes Kupfer in Wasser', cuerpos: [{ sustancia: 'cobre', m: '200', T0: '100' }, { sustancia: 'agua', m: '300', T0: '20' }] },
    { clave: 'calorimetro', nombre: 'Aluminium in einem Kalorimeter mit Wasser', cuerpos: [{ sustancia: 'aluminio', m: '150', T0: '90' }, { sustancia: 'agua', m: '250', T0: '18' }, { sustancia: 'calorimetro', C: '125', T0: '18' }] },
    { clave: 'vapor', nombre: 'Dampf von 100 °C, der in Wasser kondensiert', cuerpos: [{ sustancia: 'agua', m: '10', T0: '100', estado: 'gas' }, { sustancia: 'agua', m: '200', T0: '20' }] },
    { clave: 'plomo-fundido', nombre: 'Geschmolzenes Blei, das in Wasser erstarrt', cuerpos: [{ sustancia: 'plomo', m: '500', T0: '400' }, { sustancia: 'agua', m: '1000', T0: '15' }] },
    { clave: 'calor-especifico', nombre: 'Umgekehrt: spezifische Wärmekapazität eines unbekannten Metalls', Tfin: '24', cuerpos: [{ sustancia: 'otra', nombre: 'Metall', m: '120', T0: '100', cs: '?' }, { sustancia: 'agua', m: '200', T0: '20' }] },
    { clave: 'cuanto-hielo', nombre: 'Umgekehrt: Eis, um ein Getränk auf 5 °C zu kühlen', Tfin: '5', cuerpos: [{ sustancia: 'agua', m: '330', T0: '25' }, { sustancia: 'agua', m: '?', T0: '-18' }] },
    { clave: 'equivalente', nombre: 'Umgekehrt: Wasserwert des Kalorimeters', Tfin: '35', cuerpos: [{ sustancia: 'agua', m: '200', T0: '20' }, { sustancia: 'agua', m: '100', T0: '70' }, { sustancia: 'calorimetro', me: '?', T0: '20' }] },
    { clave: 'hervidor', nombre: 'Wasserkocher mit 2000 W: Wie lange dauert es bis 100 °C?', Tfin: '100', cuerpos: [{ sustancia: 'agua', m: '1000', T0: '20' }, { sustancia: 'calentador', P: '2000', t: '?', eta: '90' }] },
    { clave: 'calentador', nombre: 'Heizer: Eis, das schmilzt und sich erwärmt', cuerpos: [{ sustancia: 'agua', m: '500', T0: '-10' }, { sustancia: 'calentador', P: '1000', t: '300', eta: '100' }] },
  ];
  const ejemplosDil = [
    { clave: 'rail', nombre: 'Stahlschiene von 25 m zwischen −10 und 40 °C', sc: { tipo: 'lineal', mat: 'acero', medida: '25', T0: '-10', T1: '40' } },
    { clave: 'anillo', nombre: 'Messingring: Bei welcher Temperatur passt er auf eine Welle?', sc: { tipo: 'lineal', mat: 'laton', medida: '0.04990', T0: '20', objetivo: '0.05' } },
    { clave: 'chapa', nombre: 'Aluminiumblech von 2 m², um 80 K erwärmt', sc: { tipo: 'superficial', mat: 'aluminio', medida: '2', T0: '20', T1: '100' } },
    { clave: 'cubo', nombre: 'Volumen eines Kupferblocks', sc: { tipo: 'volumen', mat: 'cobre', medida: '1', T0: '20', T1: '220' } },
    { clave: 'rebose', nombre: 'Mit Quecksilber gefülltes Glasgefäß, das überläuft', sc: { tipo: 'rebose', mat: 'mercurio', rec: 'vidrio', medida: '1', T0: '20', T1: '80' } },
  ];

  return { equilibrio, resolver, dilatacion, curva, SUSTANCIAS, DILATA, ejemplos, ejemplosDil, f, leeNum };
})();

