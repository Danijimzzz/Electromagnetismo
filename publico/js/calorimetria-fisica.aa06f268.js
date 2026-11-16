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
    agua: { nombre: 'Agua', cs: 2090, cl: 4180, cg: 2010, Tf: 0, Tv: 100, Lf: 334e3, Lv: 2257e3, fases: ['hielo', 'agua', 'vapor'] },
    etanol: { nombre: 'Etanol', cs: 1960, cl: 2440, cg: 1420, Tf: -114, Tv: 78, Lf: 108e3, Lv: 855e3 },
    aluminio: { nombre: 'Aluminio', cs: 900, cl: 1180, Tf: 660, Lf: 397e3 },
    cobre: { nombre: 'Cobre', cs: 385, cl: 494, Tf: 1085, Lf: 205e3 },
    hierro: { nombre: 'Hierro', cs: 450, cl: 820, Tf: 1538, Lf: 247e3 },
    plomo: { nombre: 'Plomo', cs: 128, cl: 142, Tf: 327.5, Lf: 23e3 },
    estano: { nombre: 'Estaño', cs: 227, cl: 255, Tf: 231.9, Lf: 59e3 },
    plata: { nombre: 'Plata', cs: 235, cl: 310, Tf: 961.8, Lf: 105e3 },
    oro: { nombre: 'Oro', cs: 129, cl: 150, Tf: 1064, Lf: 64.5e3 },
    mercurio: { nombre: 'Mercurio', cs: 135, cl: 140, cg: 104, Tf: -38.8, Tv: 356.7, Lf: 11.3e3, Lv: 295e3 },
    laton: { nombre: 'Latón', cs: 380 },
    vidrio: { nombre: 'Vidrio', cs: 840 },
    aceite: { nombre: 'Aceite de oliva', cl: 1970 },
    calorimetro: { nombre: 'Calorímetro' },
    calentador: { nombre: 'Calentador (P · t)' },
    otra: { nombre: 'Otra (con tus datos)' },
  };
  const FASES = ['sólido', 'líquido', 'gas'];

  function leerCuerpo(c, i) {
    const S = SUSTANCIAS[c.sustancia] || SUSTANCIAS.agua, quien = `Cuerpo ${i + 1}`;
    const n = (k, nom, { opcional = false, positivo = false } = {}) => {
      if (vacio(c[k])) { if (opcional) return null; throw new Error(`${quien}: falta ${nom}`); }
      const v = leeNum(c[k]);
      if (!isFinite(v)) throw new Error(`${quien}: ${nom} debe ser un número`);
      if (positivo && v <= 0) throw new Error(`${quien}: ${nom} debe ser mayor que 0`);
      return v;
    };
    if (c.sustancia === 'calentador') {
      const P = n('P', 'la potencia'), t = n('t', 'el tiempo', { positivo: true }), eta = vacio(c.eta) ? 100 : n('eta', 'el rendimiento', { positivo: true });
      if (eta > 100) throw new Error(`${quien}: el rendimiento no puede pasar del 100 %`);
      return { i, clave: 'calentador', nombre: 'Calentador', calentador: true, P, t, eta, Qext: (eta / 100) * P * t, m: 0 };
    }
    const T0 = n('T0', 'la temperatura inicial');
    if (T0 < -273.15) throw new Error(`${quien}: la temperatura no puede bajar del cero absoluto (−273,15 °C)`);
    if (c.sustancia === 'calorimetro') {
      if (vacio(c.C) && !vacio(c.me)) { const me = n('me', 'el equivalente en agua', { positivo: true }); return { i, clave: 'calorimetro', nombre: 'Calorímetro', C: (me / 1000) * 4180, me, T0, m: 0 }; }
      return { i, clave: 'calorimetro', nombre: 'Calorímetro', C: n('C', 'la capacidad calorífica', { positivo: true }), T0, m: 0 };
    }
    const p = c.sustancia === 'otra'
      ? { nombre: vacio(c.nombre) ? `Cuerpo ${i + 1}` : String(c.nombre), cs: n('cs', 'el calor específico del sólido', { opcional: true }), cl: n('cl', 'el calor específico del líquido', { opcional: true }), cg: n('cg', 'el calor específico del gas', { opcional: true }),
        Tf: n('Tf', 'la temperatura de fusión', { opcional: true }), Tv: n('Tv', 'la temperatura de ebullición', { opcional: true }), Lf: n('Lf', 'el calor latente de fusión', { opcional: true }), Lv: n('Lv', 'el calor latente de vaporización', { opcional: true }) }
      : { ...S };
    const m = n('m', 'la masa', { positivo: true }) / 1000;
    if (p.Tf === null || p.Tf === undefined) { p.Tf = -Infinity; p.Lf = 0; }
    if (p.Tv === null || p.Tv === undefined) { p.Tv = Infinity; p.Lv = 0; }
    if (p.Tv <= p.Tf) throw new Error(`${quien}: la ebullición debe estar por encima de la fusión`);
    for (const [k, nom] of [['cs', 'del sólido'], ['cl', 'del líquido'], ['cg', 'del gas']]) if (p[k] != null && p[k] <= 0) throw new Error(`${quien}: el calor específico ${nom} debe ser positivo`);
    let e = T0 < p.Tf ? 0 : T0 > p.Tv ? 2 : T0 > p.Tf && T0 < p.Tv ? 1 : null;
    const pedido = { solido: 0, liquido: 1, gas: 2 }[c.estado];
    if (e === null) e = pedido !== undefined ? pedido : 1;
    else if (pedido !== undefined && pedido !== e) throw new Error(`${quien}: a ${f(T0)} °C no puede estar en estado ${FASES[pedido]}`);
    if ((T0 === p.Tf && e === 2) || (T0 === p.Tv && e === 0)) throw new Error(`${quien}: a ${f(T0)} °C no puede estar en estado ${FASES[e]}`);
    if (p.cs == null && p.cl == null && p.cg == null) throw new Error(`${quien}: falta el calor específico`);
    if (isFinite(p.Tf) && (p.Lf == null || p.Lf < 0)) throw new Error(`${quien}: falta el calor latente de fusión`);
    if (isFinite(p.Tv) && (p.Lv == null || p.Lv < 0)) throw new Error(`${quien}: falta el calor latente de vaporización`);
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
    if (lista.length < 2) throw new Error('Hacen falta al menos dos cuerpos');
    const todos = lista.map(leerCuerpo), cal = todos.filter((b) => b.calentador), B = todos.filter((b) => !b.calentador);
    if (B.every((b) => b.C !== undefined)) throw new Error(B.length ? 'Además del calorímetro hace falta algo dentro' : 'Además del calentador hace falta algo que calentar');
    const Qext = cal.reduce((s, b) => s + b.Qext, 0);
    const H0 = B.map((b) => H(b, b.T0, b.C !== undefined ? 0 : b.e0));

    for (const [j, b] of B.entries()) if (!isFinite(H0[j])) throw new Error(`Cuerpo ${j + 1}: faltan datos de la fase en la que está`);
    const total = (T, alto) => B.reduce((s, b, j) => s + (alto ? Halto(b, T) : Hbajo(b, T)) - H0[j], 0) - Qext;
    let Tmin = Math.min(...B.map((b) => b.T0)), Tmax = Math.max(...B.map((b) => b.T0));
    if (Qext < 0) { Tmin = -273.15; if (total(Tmin, false) > 0) throw new Error('El calentador quita más calor del que tienen los cuerpos'); }
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
    if (Te === null) throw new Error('No encuentro la temperatura de equilibrio: revisa los datos');
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
        estado = `${f((1 - fr) * b.m * 1000)} g de ${nom} y ${f(fr * b.m * 1000)} g de ${nom2}`;
      } else estado = `${f(b.m * 1000)} g de ${nombreFase(b, fr === null ? faseEn(b, Te, false) : fr >= 1 - 1e-9 ? faseEn(b, Te, true) : faseEn(b, Te, false))}`;
      const nombre = b.fases ? b.fases[b.e0][0].toUpperCase() + b.fases[b.e0].slice(1) : b.nombre;
      return { b, nombre, Q, etapas, estado, fraccion: fr };
    });
    for (const b of cal) cuerpos.push({ b, nombre: 'Calentador', Q: -b.Qext, etapas: [], estado: `aporta ${f(b.Qext)} J`, fraccion: null });
    const pasos = [];
    for (const b of cal) pasos.push({ t: 'Calentador', html: `$Q = η P t = ${f(b.eta / 100)} · ${f(b.P)} "W" · ${f(b.t)} "s"$ = <b>${f(b.Qext)} J</b> que entran en el sistema: $Σ Q_cuerpos = Q_calentador$.` });
    for (const c of cuerpos.filter((c) => !c.b.calentador)) pasos.push({ t: `${c.nombre}${c.b.C === undefined ? ` (${f(c.b.m * 1000)} g a ${f(c.b.T0)} °C)` : ` (C = ${f(c.b.C)} J/K a ${f(c.b.T0)} °C)`}`, html: c.etapas.length ? c.etapas.map((e) => e.html).join('<br>') + (c.etapas.length > 1 ? `<br>$Q$ = <b>${f(c.Q)} J</b>` : '') : 'No intercambia calor: ya está a la temperatura final.' });
    const cedido = -cuerpos.filter((c) => c.Q < 0).reduce((s, c) => s + c.Q, 0), absorbido = cuerpos.filter((c) => c.Q > 0).reduce((s, c) => s + c.Q, 0);
    if (cal.length) cuerpos.forEach((c) => { if (c.b.calentador) c.Q = -c.b.Qext; });
    if (enCambio) {
      const cambian = cuerpos.filter((c) => c.fraccion !== null && c.fraccion > 1e-9 && c.fraccion < 1 - 1e-9);
      pasos.push({ t: '¿Llega para cambiar de fase?', html: `Si todo acabara a ${f(Te)} °C antes del cambio de fase, sobrarían ${f(-enCambio.lo)} J; si acabara después, faltarían ${f(enCambio.hi)} J. La energía no llega para completar el cambio de fase, así que el equilibrio se queda en <b>T<sub>e</sub> = ${f(Te)} °C</b>${cambian.length ? ` con ${cambian.map((c) => c.estado).join(' y ')}` : ''}.` });
    } else {
      const Ce = B.reduce((s, b) => s + (b.C !== undefined ? b.C : b.m * cEn(b, Te)), 0);
      pasos.push({ t: 'Temperatura de equilibrio', html: `$Σ Q = 0$ ⇒ la suma de todos los calores, con $T_e$ como incógnita, se anula en <b>$T_e$ = ${f(Te)} °C</b>. (Capacidad calorífica total a esa temperatura: ${f(Ce)} J/K.)` });
    }
    pasos.push({ t: 'Comprobación', html: `Calor cedido ${f(cedido)} J = calor absorbido ${f(absorbido)} J ⇒ $Σ Q = ${f(absorbido - cedido)} "J"$.` });
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
        const dm = (z - a) / s.L, nom = s.fase === 0 ? (sube ? 'Fusión' : 'Solidificación') : sube ? 'Vaporización' : 'Condensación';
        out.push({ tipo: 'latente', Q, T: s.T, dm, html: `${nom} a ${f(s.T)} °C: $Q = ${sube ? '' : '−'}m L = ${sube ? '' : '−'}${f(dm)} "kg" · ${f(s.L)} "J/kg"$ = <b>${f(Q)} J</b>` });
      } else {
        const Tde = (Hx) => s.Ta + (Hx - s.Ha) / s.k;
        const Ti = Tde(sube ? a : z), Tf_ = Tde(sube ? z : a), c = b.C !== undefined ? null : s.k / b.m;
        const fase = b.C !== undefined ? 'calorímetro' : nombreFase(b, s.fase);
        out.push({ tipo: 'sensible', Q, Ti, Tf: Tf_, html: `${sube ? 'Se calienta' : 'Se enfría'} ${b.C !== undefined ? 'el calorímetro' : `(${fase})`} de ${f(Ti)} a ${f(Tf_)} °C: $Q = ${b.C !== undefined ? `C ΔT = ${f(b.C)} · (${f(Tf_)} − ${par(Ti)})` : `m c ΔT = ${f(b.m)} · ${f(c)} · (${f(Tf_)} − ${par(Ti)})`}$ = <b>${f(Q)} J</b>` });
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

  const INCOGNITAS = { m: 'la masa', T0: 'la temperatura inicial', C: 'la capacidad calorífica', me: 'el equivalente en agua', cs: 'el calor específico', cl: 'el calor específico', cg: 'el calor específico', P: 'la potencia', t: 'el tiempo' };
  const UNIDAD = { m: 'g', T0: '°C', C: 'J/K', me: 'g', cs: 'J/(kg·K)', cl: 'J/(kg·K)', cg: 'J/(kg·K)', P: 'W', t: 's' };
  const esInc = (v) => String(v ?? '').trim() === '?';
  function resolver(sc) {
    const lista = (sc.cuerpos || []).filter((c) => c && !c.quitar);
    const inc = [];
    lista.forEach((c, i) => { for (const k of Object.keys(INCOGNITAS)) if (esInc(c[k])) inc.push({ i, k }); });
    if (!inc.length) return { ...equilibrio(sc), incognita: null };
    if (inc.length > 1) throw new Error('Solo puede haber un dato desconocido (con «?»)');
    if (vacio(sc.Tfin)) throw new Error('Para despejar el dato con «?» hace falta la temperatura final');
    const Tfin = leeNum(sc.Tfin);
    if (!isFinite(Tfin)) throw new Error('La temperatura final debe ser un número');
    const { i, k } = inc[0], lineal = k === 'T0';
    const con = (x) => ({ cuerpos: lista.map((c, j) => (j === i ? { ...c, [k]: String(x) } : c)) });
    const Te = (x) => { try { return equilibrio(con(x)).Te; } catch (e) { return NaN; } };
    const a = lineal ? -273.15 : 1e-6, z = lineal ? 1e5 : 1e10;
    const Ta = Te(a), Tz = Te(z), eps = 1e-12 * Math.max(1, Math.abs(Tfin));
    if (!isFinite(Ta) || !isFinite(Tz) || (Tfin - Ta) * (Tfin - Tz) > 0) throw new Error(`Ningún valor de ${INCOGNITAS[k]} deja la mezcla a ${f(Tfin)} °C`);
    const sube = Tz > Ta, llega = (x) => { const T = Te(x); return sube ? T >= Tfin - eps : T <= Tfin + eps; };
    let lo = lineal ? a : Math.log(a), hi = lineal ? z : Math.log(z);
    const val = (u) => (lineal ? u : Math.exp(u));
    for (let n = 0; n < 200; n++) { const mid = (lo + hi) / 2; if (llega(val(mid))) hi = mid; else lo = mid; }
    const x = val(hi), r = equilibrio(con(x));
    const quien = r.cuerpos[i] ? r.cuerpos[i].nombre : `Cuerpo ${i + 1}`;
    const meseta = Math.abs(r.Te - Tfin) < 1e-6 * Math.max(1, Math.abs(Tfin)) && r.enCambio;
    r.pasos.unshift({ t: 'Dato desconocido', html: `Se busca ${INCOGNITAS[k]} de ${esc_(quien)} para que el equilibrio quede a $T_e$ = ${f(Tfin)} °C. La ecuación $Σ Q = 0$ con esa $T_e$ y el dato como incógnita da <b>${f(x)} ${UNIDAD[k]}</b>${meseta ? ' (el valor justo para llegar a esa temperatura: es la de un cambio de fase y con más cantidad se quedaría también ahí)' : ''}. Con ese valor, cada cuerpo intercambia:` });
    return { ...r, incognita: { i, k, valor: x, nombre: INCOGNITAS[k], unidad: UNIDAD[k], quien, Tfin } };
  }
  const esc_ = (s) => String(s).replace(/[<>&]/g, '');

  const DILATA = {
    acero: { nombre: 'Acero', a: 12e-6 }, aluminio: { nombre: 'Aluminio', a: 23e-6 }, cobre: { nombre: 'Cobre', a: 17e-6 }, laton: { nombre: 'Latón', a: 19e-6 },
    vidrio: { nombre: 'Vidrio', a: 9e-6 }, pyrex: { nombre: 'Vidrio Pyrex', a: 3.2e-6 }, hormigon: { nombre: 'Hormigón', a: 12e-6 },
    agua: { nombre: 'Agua (líquido)', b: 2.1e-4 }, mercurio: { nombre: 'Mercurio (líquido)', b: 1.82e-4 }, etanol: { nombre: 'Etanol (líquido)', b: 1.1e-3 }, glicerina: { nombre: 'Glicerina (líquido)', b: 5e-4 },
    otro: { nombre: 'Otro (con tu coeficiente)' },
  };
  function dilatacion(sc) {
    const num = (k, nom, opc) => { if (vacio(sc[k])) { if (opc) return null; throw new Error(`Falta ${nom}`); } const v = leeNum(sc[k]); if (!isFinite(v)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} debe ser un número`); return v; };
    const tipo = ['superficial', 'volumen', 'rebose'].includes(sc.tipo) ? sc.tipo : 'lineal';
    const M = DILATA[sc.mat] || DILATA.acero;
    const coef = sc.mat === 'otro' ? num('coef', 'el coeficiente de dilatación') : M.a ?? M.b;
    const esLiq = sc.mat === 'otro' ? tipo === 'volumen' || tipo === 'rebose' : M.b !== undefined;
    const X0 = num('medida', 'la medida inicial'), T0 = num('T0', 'la temperatura inicial'), T1 = num('T1', 'la temperatura final', true), obj = num('objetivo', 'la medida buscada', true);
    if (X0 <= 0) throw new Error('La medida inicial debe ser mayor que 0');
    if (tipo !== 'volumen' && tipo !== 'rebose' && esLiq) throw new Error('Un líquido no tiene longitud ni superficie propias: usa la dilatación de volumen');
    if (tipo === 'rebose' && !esLiq) throw new Error('En el rebose el material es el líquido; el recipiente va aparte');
    if (T1 === null && obj === null) throw new Error('Falta la temperatura final (o la medida que quieres alcanzar)');
    const U = { lineal: 'm', superficial: 'm²', volumen: 'L', rebose: 'L' }[tipo];
    const pasos = [], res = {};
    let k, sim, nom;
    if (tipo === 'rebose') {
      const R = DILATA[sc.rec] && DILATA[sc.rec].a !== undefined ? DILATA[sc.rec] : DILATA.vidrio;
      const bl = esLiq && sc.mat === 'otro' ? coef : coef, br = 3 * R.a;
      k = bl - br; sim = 'β_ap'; nom = 'coeficiente aparente';
      pasos.push({ t: 'Coeficientes', html: `Líquido $β$ = ${f(bl)} K⁻¹; recipiente de ${R.nombre.toLowerCase()} $β_r = 3α = 3 · ${f(R.a)}$ = ${f(br)} K⁻¹. El líquido que rebosa se dilata con el coeficiente aparente $β_ap = β − β_r$ = <b>${f(k)} K⁻¹</b>.` });
      Object.assign(res, { beta: bl, betaR: br, betaAp: k });
    } else {
      k = tipo === 'lineal' ? coef : tipo === 'superficial' ? 2 * coef : esLiq ? coef : 3 * coef;
      sim = tipo === 'lineal' ? 'α' : tipo === 'superficial' ? 'γ' : 'β';
      if (tipo !== 'lineal' && !esLiq) pasos.push({ t: 'Coeficiente', html: `En un sólido isótropo $${sim} = ${tipo === 'superficial' ? 2 : 3}α = ${tipo === 'superficial' ? 2 : 3} · ${f(coef)}$ = <b>${f(k)} K⁻¹</b>.` });
    }
    const letra = { lineal: 'L', superficial: 'S', volumen: 'V', rebose: 'V' }[tipo];
    if (T1 !== null) {
      const dT = T1 - T0, dX = k * X0 * dT;
      Object.assign(res, { dT, dX, X1: X0 + dX, k });
      pasos.push({ t: tipo === 'rebose' ? 'Volumen que rebosa' : 'Dilatación', html: `$Δ${letra} = ${sim} ${letra}_0 ΔT = ${f(k)} · ${f(X0)} · (${f(T1)} − ${par(T0)})$ = <b>${f(dX)} ${U}</b>${tipo === 'rebose' ? (dX >= 0 ? ' rebosan' : ' (baja el nivel: no rebosa)') : ` ⇒ $${letra} = ${letra}_0 + Δ${letra}$ = <b>${f(X0 + dX)} ${U}</b>`} (${f(100 * k * dT, 3)} %).` });
    }
    if (obj !== null && tipo !== 'rebose') {
      const Tn = T0 + (obj - X0) / (k * X0);
      res.Tobjetivo = Tn;
      pasos.push({ t: `¿A qué temperatura mide ${f(obj)} ${U}?`, html: `$ΔT = {${letra} − ${letra}_0}/{${sim} ${letra}_0} = {${f(obj)} − ${f(X0)}}/{${f(k)} · ${f(X0)}}$ = ${f(Tn - T0)} K ⇒ <b>T = ${f(Tn)} °C</b>.` });
    }
    return { tipo, k, sim, X0, T0, T1, U, pasos, res, liquido: esLiq };
  }

  const ejemplos = [
    { clave: 'hielo-agua', nombre: 'Hielo a −10 °C en agua templada: se funde todo', cuerpos: [{ sustancia: 'agua', m: '50', T0: '-10' }, { sustancia: 'agua', m: '200', T0: '40' }] },
    { clave: 'sobra-hielo', nombre: 'Mucho hielo: el equilibrio se queda a 0 °C', cuerpos: [{ sustancia: 'agua', m: '100', T0: '0', estado: 'solido' }, { sustancia: 'agua', m: '100', T0: '20' }] },
    { clave: 'cobre-agua', nombre: 'Cobre caliente en agua', cuerpos: [{ sustancia: 'cobre', m: '200', T0: '100' }, { sustancia: 'agua', m: '300', T0: '20' }] },
    { clave: 'calorimetro', nombre: 'Aluminio en un calorímetro con agua', cuerpos: [{ sustancia: 'aluminio', m: '150', T0: '90' }, { sustancia: 'agua', m: '250', T0: '18' }, { sustancia: 'calorimetro', C: '125', T0: '18' }] },
    { clave: 'vapor', nombre: 'Vapor a 100 °C que se condensa en agua', cuerpos: [{ sustancia: 'agua', m: '10', T0: '100', estado: 'gas' }, { sustancia: 'agua', m: '200', T0: '20' }] },
    { clave: 'plomo-fundido', nombre: 'Plomo fundido que se solidifica en agua', cuerpos: [{ sustancia: 'plomo', m: '500', T0: '400' }, { sustancia: 'agua', m: '1000', T0: '15' }] },
    { clave: 'calor-especifico', nombre: 'Al revés: calor específico de un metal desconocido', Tfin: '24', cuerpos: [{ sustancia: 'otra', nombre: 'Metal', m: '120', T0: '100', cs: '?' }, { sustancia: 'agua', m: '200', T0: '20' }] },
    { clave: 'cuanto-hielo', nombre: 'Al revés: hielo para enfriar un refresco a 5 °C', Tfin: '5', cuerpos: [{ sustancia: 'agua', m: '330', T0: '25' }, { sustancia: 'agua', m: '?', T0: '-18' }] },
    { clave: 'equivalente', nombre: 'Al revés: equivalente en agua del calorímetro', Tfin: '35', cuerpos: [{ sustancia: 'agua', m: '200', T0: '20' }, { sustancia: 'agua', m: '100', T0: '70' }, { sustancia: 'calorimetro', me: '?', T0: '20' }] },
    { clave: 'hervidor', nombre: 'Hervidor de 2000 W: ¿cuánto tarda en llegar a 100 °C?', Tfin: '100', cuerpos: [{ sustancia: 'agua', m: '1000', T0: '20' }, { sustancia: 'calentador', P: '2000', t: '?', eta: '90' }] },
    { clave: 'calentador', nombre: 'Calentador: hielo que se funde y se calienta', cuerpos: [{ sustancia: 'agua', m: '500', T0: '-10' }, { sustancia: 'calentador', P: '1000', t: '300', eta: '100' }] },
  ];
  const ejemplosDil = [
    { clave: 'rail', nombre: 'Raíl de acero de 25 m entre −10 y 40 °C', sc: { tipo: 'lineal', mat: 'acero', medida: '25', T0: '-10', T1: '40' } },
    { clave: 'anillo', nombre: 'Anillo de latón: ¿a qué temperatura entra en un eje?', sc: { tipo: 'lineal', mat: 'laton', medida: '0.04990', T0: '20', objetivo: '0.05' } },
    { clave: 'chapa', nombre: 'Chapa de aluminio de 2 m² calentada 80 K', sc: { tipo: 'superficial', mat: 'aluminio', medida: '2', T0: '20', T1: '100' } },
    { clave: 'cubo', nombre: 'Volumen de un bloque de cobre', sc: { tipo: 'volumen', mat: 'cobre', medida: '1', T0: '20', T1: '220' } },
    { clave: 'rebose', nombre: 'Recipiente de vidrio lleno de mercurio que rebosa', sc: { tipo: 'rebose', mat: 'mercurio', rec: 'vidrio', medida: '1', T0: '20', T1: '80' } },
  ];

  return { equilibrio, resolver, dilatacion, curva, SUSTANCIAS, DILATA, ejemplos, ejemplosDil, f, leeNum };
})();

