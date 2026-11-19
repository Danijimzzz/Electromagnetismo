const Configuracion = (() => {
  const LETRA = 'spdf';
  const SUP = (k) => String(k).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const ORDEN = [];
  for (let s = 1; s <= 8; s++) for (let l = Math.min(s - 1, 3); l >= 0; l--) { const n = s - l; if (n > l) ORDEN.push(`${n}${LETRA[l]}`); }

  function leer(texto, carga = null) {
    let t = String(texto).trim().replace(/[⁺]/g, '+').replace(/[⁻−]/g, '-').replace(/[⁰-⁹]/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c));
    if (!t) throw new Error('Saisissez un élément : symbole, nom ou numéro atomique');
    let q = 0;
    const m = t.match(/^(.*?)\s*\^?\(?(\d*)([+-])(\d*)\)?$/);
    if (m && m[1]) { q = (m[3] === '+' ? 1 : -1) * +(m[2] || m[4] || 1); t = m[1].trim(); }
    let el = /^\d+$/.test(t) ? Elementos.lista[+t - 1] : Elementos.porSimbolo[t[0].toUpperCase() + t.slice(1).toLowerCase()];
    if (!el) el = Elementos.lista.find((e) => sinTildes(e.nombre) === sinTildes(t));
    if (!el) throw new Error(`Je ne trouve pas l’élément « ${t} »`);
    if (carga !== null && carga !== '' && isFinite(+carga)) q = +carga;
    if (q >= el.Z) throw new Error(`Un ion ${el.simbolo}${q}+ n’aurait pas d’électrons`);
    if (q < -4) throw new Error('Un anion avec plus de 4 charges négatives n’existe pas');
    return { el, carga: q };
  }

  function analizar(texto, carga = null) {
    const { el, carga: q } = leer(texto, carga);
    const Z = el.Z, ne = Z - q;
    const conf = Elementos.configuracion(Z, q);
    const porCapas = Elementos.texto(conf);
    const porLlenado = ORDEN.filter((o) => conf.some((c) => c.nombre === o)).map((o) => o + SUP(conf.find((c) => c.nombre === o).e)).join(' ');
    const madelung = {};
    let resto = Z;
    for (const o of ORDEN) { if (!resto) break; const cap = 2 * (2 * LETRA.indexOf(o[o.length - 1]) + 1); madelung[o] = Math.min(cap, resto); resto -= madelung[o]; }
    const neutro = Elementos.configuracion(Z, 0);
    const excepcion = neutro.some((c) => madelung[c.nombre] !== c.e) || Object.keys(madelung).some((o) => !neutro.some((c) => c.nombre === o));
    const esperada = ORDEN.filter((o) => madelung[o]).map((o) => o + SUP(madelung[o])).join(' ');
    const real = (o) => neutro.find((c) => c.nombre === o)?.e || 0;
    const cambian = ORDEN.filter((o) => (madelung[o] || 0) !== real(o));
    const cambio = { esperada: cambian.map((o) => o + SUP(madelung[o] || 0)).join(' '), real: cambian.map((o) => o + SUP(real(o))).join(' ') };
    const g = [...Elementos.NOBLES].reverse().find((n) => (q ? n <= ne : n < ne));
    let abreviada = porLlenado;
    if (g) {
      const base = Elementos.configuracion(g);
      const resto2 = conf.filter((c) => { const b = base.find((x) => x.nombre === c.nombre); return !b || b.e !== c.e; });
      abreviada = `[${Elementos.lista[g - 1].simbolo}] ` + ORDEN.filter((o) => resto2.some((c) => c.nombre === o)).map((o) => o + SUP(resto2.find((c) => c.nombre === o).e)).join(' ');
      if (!resto2.length) abreviada = `[${Elementos.lista[g - 1].simbolo}]`;
    } else if (ne === 0) abreviada = '';
    const cajas = ORDEN.filter((o) => conf.some((c) => c.nombre === o)).map((o) => {
      const l = LETRA.indexOf(o[o.length - 1]), k = conf.find((c) => c.nombre === o).e, nOrb = 2 * l + 1;
      const orbitales = Array.from({ length: nOrb }, (_, i) => (i < k ? 1 : 0) + (i < k - nOrb ? 1 : 0));
      return { nombre: o, n: +o.slice(0, -1), l, e: k, orbitales };
    });
    const desapareados = cajas.reduce((s, c) => s + c.orbitales.filter((x) => x === 1).length, 0);
    let diferenciador = null;
    const ult = cajas[cajas.length - 1];
    if (ult) {
      const nOrb = 2 * ult.l + 1, k = ult.e;
      const i = k <= nOrb ? k - 1 : k - nOrb - 1;
      diferenciador = { orbital: ult.nombre, n: ult.n, l: ult.l, ml: i - ult.l, ms: k <= nOrb ? '+½' : '−½' };
    }
    const nMax = conf.length ? Math.max(...conf.map((c) => c.n)) : 0;
    const valencia = conf.filter((c) => c.n === nMax).reduce((s, c) => s + c.e, 0);
    const nN = Math.max(...neutro.map((c) => c.n)), bl = Elementos.bloque(Z);
    const esVal = (o) => o.n === nN || (bl !== 's' && bl !== 'p' && o.n === nN - 1 && o.l === 2) || (bl === 'f' && o.n === nN - 2 && o.l === 3);
    const subVal = neutro.filter(esVal).map((o) => o.nombre);
    const val = subVal.map((o) => ({ nombre: o, e: conf.find((c) => c.nombre === o)?.e || 0 }));
    const nValencia = val.reduce((t, o) => t + o.e, 0);
    const cuanticos = [];
    for (const o of val) {
      const n = +o.nombre.slice(0, -1), l = LETRA.indexOf(o.nombre.slice(-1)), nOrb = 2 * l + 1;
      for (let k = 0; k < o.e; k++) cuanticos.push({ orbital: o.nombre, n, l, ml: (k % nOrb) - l, ms: k < nOrb ? '+½' : '−½' });
    }
    return {
      el, carga: q, Z, electrones: ne, porLlenado, porCapas, abreviada, capas: capasDe(conf), cajas, desapareados,
      magnetismo: desapareados ? 'paramagnétique' : 'diamagnétique', diferenciador, excepcion: excepcion && q === 0, esperada, cambio,
      capaValencia: nMax, electronesValencia: valencia, bloque: Elementos.bloque(Z),
      valencia: { subniveles: val, n: nValencia, texto: val.map((o) => o.nombre + SUP(o.e)).join(' ') }, cuanticos,
      slater: slater(Z, conf), isoelectronicos: isoelectronicos(ne),
    };
  }
  const capasDe = (conf) => { const c = []; for (const o of conf) c[o.n - 1] = (c[o.n - 1] || 0) + o.e; return Array.from(c, (x) => x || 0); };

  function slater(Z, conf) {
    if (!conf.length) return null;
    const grupo = (o) => (o.l <= 1 ? `${o.n}sp` : `${o.n}${LETRA[o.l]}`);
    const ordenG = (g) => { const n = parseInt(g, 10), t = g.replace(/^\d+/, ''); return n + (t === 'sp' ? 0 : t === 'd' ? 0.5 : 0.7); };
    const ext = conf.reduce((a, o) => (ordenG(grupo(o)) > ordenG(grupo(a)) || (grupo(o) === grupo(a) && o.l > a.l) ? o : a));
    const gE = grupo(ext), nE = ext.n, sp = ext.l <= 1;
    let S = 0;
    const partes = [];
    const cuenta = (e, f, txt) => { if (e > 0) { S += e * f; partes.push(`${e} · ${String(f).replace('.', ',')} (${txt})`); } };
    const mismo = conf.filter((o) => grupo(o) === gE).reduce((t, o) => t + o.e, 0) - 1;
    cuenta(mismo, gE === '1sp' ? 0.3 : 0.35, 'mismo grupo');
    if (sp) {
      cuenta(conf.filter((o) => o.n === nE - 1).reduce((t, o) => t + o.e, 0), 0.85, `capa n = ${nE - 1}`);
      cuenta(conf.filter((o) => o.n <= nE - 2).reduce((t, o) => t + o.e, 0), 1, 'couches les plus internes');
    } else cuenta(conf.filter((o) => grupo(o) !== gE && ordenG(grupo(o)) < ordenG(gE)).reduce((t, o) => t + o.e, 0), 1, 'groupes de gauche');
    return { orbital: ext.nombre, S, Zef: Z - S, partes };
  }

  function isoelectronicos(ne) {
    const out = [];
    const posible = (Z, q) => {
      const e = Elementos.lista[Z - 1], g = e.grupo;
      if (q === 0) return true;
      if (q < 0) return ['n', 'h', 's'].includes(e.cat) && g >= 15 && g <= 17 && -q <= 18 - g;
      if (!['a', 't', 'm', 'p', 'l', 'c'].includes(e.cat)) return false;
      return g == null ? q <= 3 : g <= 2 ? q <= g : g >= 13 ? q <= g - 10 : q <= 3;
    };
    for (let q = -3; q <= 3; q++) { const Z = ne + q; if (Z >= 1 && Z <= 118 && Z > q && posible(Z, q)) out.push({ Z, carga: q, simbolo: Elementos.lista[Z - 1].simbolo, zef: slater(Z, Elementos.configuracion(Z, q))?.Zef }); }
    return out;
  }

  function identificar(texto) {
    let t = String(texto).trim().replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).replace(/\^/g, '');
    if (!t) throw new Error('Saisissez une configuration : 1s2 2s2 2p6 3s1 ou [Ne] 3s1');
    const occ = {};
    let base = null;
    const mb = t.match(/^\[\s*([A-Za-z]{1,2})\s*\]/);
    if (mb) {
      const g = Elementos.porSimbolo[mb[1][0].toUpperCase() + mb[1].slice(1).toLowerCase()];
      if (!g || !Elementos.NOBLES.includes(g.Z)) throw new Error(`[${mb[1]}] n’est pas un gaz noble`);
      base = g; for (const o of Elementos.configuracion(g.Z)) occ[o.nombre] = o.e;
      t = t.slice(mb[0].length);
    }
    const re = /(\d+)\s*([spdfghSPDFGH])\s*(\d+)/g, problemas = [];
    let m, alguno = false;
    const resto = t.replace(re, '').replace(/[\s,;·.]/g, '');
    if (resto) throw new Error(`Je ne comprends pas « ${resto} » : écrivez chaque sous-couche comme 3d6 ou 3d⁶`);
    while ((m = re.exec(t))) {
      alguno = true;
      const n = +m[1], letra = m[2].toLowerCase(), l = 'spdfgh'.indexOf(letra), e = +m[3], o = `${n}${letra}`;
      if (l >= n) problemas.push(`la sous-couche ${o} n’existe pas : avec n = ${n}, l ne peut aller que de 0 à ${n - 1}`);
      else if (e > 2 * (2 * l + 1)) problemas.push(`dans ${o} il tient au plus ${2 * (2 * l + 1)} électrons (principe d’exclusion de Pauli) et il y en a ${e}`);
      if (occ[o] !== undefined && !(base && Elementos.configuracion(base.Z).some((x) => x.nombre === o))) problemas.push(`la sous-couche ${o} est écrite deux fois`);
      occ[o] = (base && Elementos.configuracion(base.Z).some((x) => x.nombre === o) ? occ[o] : 0) + e;
    }
    if (!alguno && !base) throw new Error('Saisissez au moins une sous-couche avec ses électrons : 1s2');
    const ne = Object.values(occ).reduce((a, b) => a + b, 0);
    const lista = ORDEN.filter((o) => occ[o]).map((o) => o + SUP(occ[o]));
    if (problemas.length) return { tipo: 'imposible', ne, problemas, texto: lista.join(' ') };
    if (ne > 118) return { tipo: 'imposible', ne, problemas: [`elle a ${ne} électrons et aucun élément n’en a autant`], texto: lista.join(' ') };
    const el = Elementos.lista[ne - 1], fund = Elementos.configuracion(ne);
    const igual = fund.length === Object.keys(occ).filter((o) => occ[o]).length && fund.every((o) => occ[o.nombre] === o.e);
    const ocupados = ORDEN.filter((o) => occ[o]), huecos = ORDEN.slice(0, ORDEN.indexOf(ocupados[ocupados.length - 1]) + 1).filter((o) => (occ[o] || 0) < 2 * (2 * LETRA.indexOf(o.slice(-1)) + 1));
    return { tipo: igual ? 'fundamental' : 'excitada', ne, el, texto: lista.join(' '), fundamental: Elementos.texto(fund), huecos,
      iones: [-2, -1, 1, 2, 3].map((q) => ({ q, Z: ne + q })).filter((x) => x.Z >= 1 && x.Z <= 118).filter((x) => { const c = Elementos.configuracion(x.Z, x.q); return c.length === ocupados.length && c.every((o) => occ[o.nombre] === o.e); }).map((x) => ({ simbolo: Elementos.lista[x.Z - 1].simbolo, carga: x.q })) };
  }

  function cuanticos({ n, l, ml, ms }) {
    const lee = (v) => +String(v ?? '').trim().replace(',', '.').replace(/[−–]/g, '-').replace(/^\+/, '');
    const N = lee(n), L = lee(l), ML = lee(ml);
    const sTxt = String(ms ?? '').trim().replace(/[−–]/g, '-').replace(/\s/g, '');
    const MS = /^\+?(1\/2|½|0[.,]5)$/.test(sTxt) ? 0.5 : /^-(1\/2|½|0[.,]5)$/.test(sTxt) ? -0.5 : NaN;
    const fallos = [];
    if (!Number.isInteger(N) || N < 1) fallos.push('n doit être un entier positif (1, 2, 3…)');
    if (!Number.isInteger(L) || L < 0) fallos.push('l doit être un entier supérieur ou égal à 0');
    else if (Number.isInteger(N) && N >= 1 && L > N - 1) fallos.push(`avec n = ${N}, l ne peut valoir que de 0 à ${N - 1}`);
    if (!Number.isInteger(ML)) fallos.push('m_l doit être un nombre entier');
    else if (Number.isInteger(L) && L >= 0 && Math.abs(ML) > L) fallos.push(L ? `avec l = ${L}, m_l ne peut aller que de −${L} à +${L}` : 'avec l = 0, m_l ne peut valoir que 0');
    if (isNaN(MS)) fallos.push('s (ou m_s) ne peut valoir que +½ ou −½');
    const orbital = fallos.length ? null : `${N}${'spdfghik'[L] || `(l=${L})`}`;
    return { valido: !fallos.length, fallos, orbital, n: N, l: L, ml: ML, ms: MS,
      maximo: Number.isInteger(N) && N >= 1 ? 2 * N * N : null };
  }

  const ejemplos = ['Fe', 'Cr', 'Cu', 'Fe^2+', 'Cl-', 'O', 'Gd', 'Ag'];
  return { leer, analizar, identificar, cuanticos, slater, isoelectronicos, ORDEN, ejemplos };
})();

