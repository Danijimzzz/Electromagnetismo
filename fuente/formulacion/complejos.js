/* =====================================================================
   Formulación: compuestos de coordinación (sin DOM). Lee fórmulas como [Cu(NH3)4]2+, K3[Fe(CN)6] o
   [Co(NH3)6]Cl3 y da el nombre (libros de texto y IUPAC 2005), los ligandos, el número de coordinación,
   el estado de oxidación del metal, los electrones d y la geometría habitual. El camino inverso
   (nombre → fórmula) busca en una lista de unos 50 complejos del temario, cuyos nombres se generan
   con las mismas reglas.
     leer(texto)      fórmula → { formula, html, nombres: [{ et, nombre }], pasos, ... } (lanza Error si no cuadra)
     porNombre(norm)  nombre normalizado → fórmula de la lista, o null
     LISTA            fórmulas de la lista
   Alcance: un solo metal central, ligandos de la tabla LIG, sin isomería ni puentes. Lo que no esté
   en las tablas se avisa. La integra formulacion/calculo.js (resolver) y la prueba es
   pruebas/herramientas/formulacion.js.
   ===================================================================== */
const Complejos = (() => {
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  const sa = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const norm = (s) => sa(String(s).toLowerCase()).replace(/[^a-z0-9]/g, '');
  const ROM = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  const SIMPLE = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa'], COMPLEJO = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis'];
  const fh = (f) => String(f).replace(/\d+/g, '<sub>$&</sub>');
  const sup = (z) => (z === 0 ? '' : `<sup>${Math.abs(z) > 1 ? Math.abs(z) : ''}${z > 0 ? '+' : '−'}</sup>`);
  // ligandos: fórmula → carga, nombre de libro, nombre IUPAC 2005, denticidad, ¿lleva bis/tris?
  const LIG = {
    NH3: { q: 0, t: 'amino', i: 'amina', d: 1 }, H2O: { q: 0, t: 'acuo', i: 'aqua', d: 1 }, CO: { q: 0, t: 'carbonilo', i: 'carbonilo', d: 1 },
    CN: { q: -1, t: 'ciano', i: 'cianido', d: 1 }, Cl: { q: -1, t: 'cloro', i: 'cloruro', d: 1 }, Br: { q: -1, t: 'bromo', i: 'bromuro', d: 1 }, I: { q: -1, t: 'yodo', i: 'yoduro', d: 1 }, F: { q: -1, t: 'fluoro', i: 'fluoruro', d: 1 },
    OH: { q: -1, t: 'hidroxo', i: 'hidroxido', d: 1 }, NO2: { q: -1, t: 'nitro', i: 'nitrito-κN', d: 1 }, SCN: { q: -1, t: 'tiocianato', i: 'tiocianato-κS', d: 1, bis: true },
    en: { q: 0, t: 'etilendiamina', i: 'etano-1,2-diamina', d: 2, bis: true }, ox: { q: -2, t: 'oxalato', i: 'oxalato', d: 2, bis: true },
  };
  // metales: símbolo → nombre (neutro y catión), raíz del anión (-ato), grupo (para los electrones d)
  const MET = {
    Cu: ['cobre', 'cuprato', 11], Ag: ['plata', 'argentato', 11], Au: ['oro', 'aurato', 11], Zn: ['zinc', 'zincato', 12], Hg: ['mercurio', 'mercurato', 12], Fe: ['hierro', 'ferrato', 8], Co: ['cobalto', 'cobaltato', 9], Ni: ['níquel', 'niquelato', 10],
    Cr: ['cromo', 'cromato', 6], Mn: ['manganeso', 'manganato', 7], Pt: ['platino', 'platinato', 10], Pd: ['paladio', 'paladato', 10], Al: ['aluminio', 'aluminato', 3], Ti: ['titanio', 'titanato', 4],
  };
  const CAT = { Li: ['litio', 1], Na: ['sodio', 1], K: ['potasio', 1], Rb: ['rubidio', 1], Cs: ['cesio', 1], NH4: ['amonio', 1], Ca: ['calcio', 2], Mg: ['magnesio', 2], Ba: ['bario', 2], Ag: ['plata', 1] };
  const ANI = { Cl: ['cloruro', 1], Br: ['bromuro', 1], I: ['yoduro', 1], F: ['fluoruro', 1], NO3: ['nitrato', 1], SO4: ['sulfato', 2], OH: ['hidróxido', 1], ClO4: ['perclorato', 1], NO2: ['nitrito', 1], CO3: ['carbonato', 2] };

  // «(NH4)2», «K3», «SO4», «(NO3)2» → [{ f, n }]
  function iones(s) {
    const r = []; const re = /\(([A-Za-z0-9]+)\)(\d*)|([A-Z][a-z]?(?:\d)?(?:[A-Z][a-z]?\d?)*?)(\d*)(?=[A-Z(]|$)/g;
    let m, resto = s;
    while ((m = re.exec(s)) && m[0]) { r.push({ f: m[1] || m[3], n: +(m[1] ? m[2] : m[4]) || 1 }); }
    return r.filter((x) => x.f);
  }
  function parteExterior(s, tabla, nom) {
    // separa un texto exterior en iones de la tabla (probando el más largo primero)
    const claves = Object.keys(tabla).sort((a, b) => b.length - a.length), r = []; let i = 0;
    s = s.replace(/\s+/g, '');
    while (i < s.length) {
      let ok = false;
      if (s[i] === '(') { const j = s.indexOf(')', i); const f = s.slice(i + 1, j); if (!tabla[f]) throw new Error(`No reconozco el ion «${f}» fuera del corchete`); i = j + 1; let t = ''; while (/\d/.test(s[i] || '')) t += s[i++]; r.push({ f, n: +t || 1 }); continue; }
      for (const k of claves) if (s.startsWith(k, i) && !/[a-z]/.test(s[i + k.length] || '')) { i += k.length; let t = ''; while (/\d/.test(s[i] || '')) t += s[i++]; r.push({ f: k, n: +t || 1 }); ok = true; break; }
      if (!ok) throw new Error(`No reconozco «${s.slice(i)}» fuera del corchete: uso ${nom} de la tabla (${Object.keys(tabla).join(', ')})`);
    }
    return r;
  }

  function leer(texto) {
    let s = String(texto || '').replace(/\s+/g, '').replace(/[₀-₉]/g, (c) => SUBS.indexOf(c)).replace(/[{}]/g, (c) => (c === '{' ? '[' : ']'));
    const m = /^(.*?)\[(.+)\](?:\^?\{?(\d*)([+\-−])\}?)?(.*)$/.exec(s);
    if (!m) throw new Error('Para un complejo escribe el ion complejo entre corchetes, por ejemplo [Cu(NH3)4]2+ o K3[Fe(CN)6].');
    const [, izq, cuerpo, zn, zs, der] = m;
    if (/[\[\]]/.test(cuerpo)) throw new Error('Solo se admite un ion complejo con un metal central y sin corchetes dentro.');
    const mm = /^([A-Z][a-z]?)(.*)$/.exec(cuerpo);
    if (!mm || !MET[mm[1]]) throw new Error(`El metal central «${mm ? mm[1] : cuerpo}» no está en la tabla (${Object.keys(MET).join(', ')}).`);
    const metal = mm[1], ligs = []; const re = /\(([A-Za-z0-9]+)\)(\d*)|(Cl|Br|I|F|CN|OH|CO|en|ox)(\d*)/g; let t, usado = '';
    const resto = mm[2];
    while ((t = re.exec(resto))) { const f = t[1] || t[3], n = +(t[1] ? t[2] : t[4]) || 1; if (!LIG[f]) throw new Error(`No conozco el ligando «${f}». La tabla tiene: ${Object.keys(LIG).join(', ')}.`); const e = ligs.find((x) => x.f === f); if (e) e.n += n; else ligs.push({ f, n }); usado += t[0]; }
    if (usado !== resto) throw new Error(`No entiendo «${resto.replace(usado, '')}» dentro del corchete: los ligandos con varios átomos van entre paréntesis, como (NH3)4 o (CN)6.`);
    if (!ligs.length) throw new Error('El corchete no tiene ligandos.');
    // carga del ion complejo: explícita, o la que compensan los iones de fuera
    const catExt = izq ? parteExterior(izq, CAT, 'un catión') : [], aniExt = der ? parteExterior(der, ANI, 'un anión') : [];
    const qCat = catExt.reduce((a, x) => a + x.n * CAT[x.f][1], 0), qAni = aniExt.reduce((a, x) => a + x.n * ANI[x.f][1], 0);
    let z;
    if (zs) z = (zs === '+' ? 1 : -1) * (+zn || 1); else z = qCat - qAni === 0 ? 0 : (qAni - qCat);
    if (zs && (catExt.length || aniExt.length) && qAni - qCat !== z) throw new Error(`La carga ${z > 0 ? z + '+' : -z + '−'} del complejo no cuadra con los iones de fuera (suman ${qCat - qAni}).`);
    if (!zs && (catExt.length && aniExt.length)) throw new Error('Con un catión y un anión fuera del corchete hay que indicar la carga del complejo, por ejemplo [Cu(NH3)4]2+.');
    const qLig0 = ligs.reduce((a, x) => a + x.n * LIG[x.f].q, 0);
    if (!zs && !catExt.length && !aniExt.length && qLig0 !== 0 && !(qLig0 <= -1 && qLig0 >= -4)) throw new Error('Los ligandos aportan carga ' + qLig0 + ': escribe la carga del ion complejo, por ejemplo [Fe(CN)6]3-, o los iones que la compensan, como K3[Fe(CN)6].');
    const qLig = qLig0, ox = z - qLig, cn = ligs.reduce((a, x) => a + x.n * LIG[x.f].d, 0);
    if (ox < 0 || ox > 8) throw new Error(`Con esa carga el metal saldría con estado de oxidación ${ox}, que no es posible: revisa la carga o los ligandos.`);
    const info = MET[metal], dN = info[2] <= 2 ? 0 : Math.max(0, info[2] - ox);
    // geometría
    const geo = cn === 2 ? 'lineal' : cn === 3 ? 'trigonal plana' : cn === 4 ? (['Pt', 'Pd', 'Au'].includes(metal) || (metal === 'Cu' && ox === 2) || (metal === 'Ni' && ligs.some((x) => x.f === 'CN')) ? 'plana cuadrada' : 'tetraédrica') : cn === 5 ? 'bipirámide trigonal' : cn === 6 ? 'octaédrica' : 'poco frecuente';
    // nombre
    const orden = (x) => norm(LIG[x.f].t);
    const nombreLig = (x, v) => { const L = LIG[x.f], nm = v === 'i' ? L.i : L.t, pre = x.n === 1 ? '' : (L.bis || /\d|-/.test(nm) ? COMPLEJO[x.n] : SIMPLE[x.n]); return pre ? (L.bis || /\d|-/.test(nm) ? `${pre}(${nm})` : pre + nm) : nm; };
    const nombreIon = (v) => {
      const ls = [...ligs].sort((a, b) => (v === 'i' ? norm(LIG[a.f].i) : orden(a)).localeCompare(v === 'i' ? norm(LIG[b.f].i) : orden(b))).map((x) => nombreLig(x, v)).join('');
      const anion = z < 0, mn = anion ? info[1] : info[0];
      return `${ls}${mn}(${ROM[ox]})`;
    };
    const ext = (v) => {
      const base = nombreIon(v);
      if (z < 0 && catExt.length) return `${base} de ${catExt.map((x) => CAT[x.f][0]).join(' y ')}`;
      if (z > 0 && aniExt.length) return `${aniExt.map((x) => ANI[x.f][0]).join(' y ')} de ${base}`;
      if (z === 0 && !catExt.length && !aniExt.length) return base;
      return `ion ${base}`;
    };
    const formula = `${izq}[${cuerpo}]${zs ? (+zn > 1 ? zn : '') + zs.replace('−', '-') : ''}${der}`;
    const html = fh(izq) + '[' + fh(cuerpo) + ']' + (zs ? sup(z) : '') + fh(der);
    const nombres = [{ et: 'Libros de texto', nombre: ext('t') }, { et: 'IUPAC 2005', nombre: ext('i') }];
    const lista = ligs.map((x) => `${x.n === 1 ? '' : x.n + ' × '}${fh(x.f)} (${LIG[x.f].q === 0 ? 'neutro' : 'carga ' + Math.abs(LIG[x.f].q) + '−'}${LIG[x.f].d > 1 ? ', bidentado' : ''})`).join('; ');
    const pasos = [
      { t: 'Separa el ion complejo', html: `Lo que va entre corchetes es el <b>ion complejo</b>: un metal central (<b>${metal}</b>, ${info[0]}) rodeado de ligandos. Fuera del corchete ${catExt.length || aniExt.length ? 'quedan los iones que compensan su carga' : 'no hay iones: es un complejo suelto o neutro'}.` },
      { t: 'Ligandos y número de coordinación', html: `Ligandos: ${lista}. El <b>número de coordinación</b> es el número de enlaces del metal con los ligandos (los bidentados cuentan 2): <b>${cn}</b>, y la geometría habitual es <b>${geo}</b>.` },
      { t: 'Estado de oxidación del metal', html: `Carga del complejo ${z === 0 ? '0' : (z > 0 ? '+' : '−') + Math.abs(z)}${catExt.length || aniExt.length ? ` (deducida de los iones de fuera: ${qAni - qCat > 0 ? '−' : '+'}${Math.abs(qCat - qAni)} fuera)` : ''}; los ligandos aportan ${qLig}. Por tanto $x + (${qLig}) = ${z}$ ⇒ <b>estado de oxidación ${ox > 0 ? '+' + ox : ox} (${ROM[ox]})</b>.` },
      { t: 'Electrones d', html: info[2] <= 3 ? `El ${info[0]} no es un metal de transición con orbitales d ocupados en este estado.` : `El ${info[0]} está en el grupo ${info[2]}: con estado +${ox} le quedan <b>d<sup>${dN}</sup></b> electrones.` },
      { t: 'Nombre', html: `Primero los ligandos por orden alfabético, con prefijos di-, tri-… (bis-, tris-… si el nombre del ligando ya los lleva), y luego el metal con su estado de oxidación en números romanos${z < 0 ? ' y terminado en -ato porque el complejo es un anión' : ''}: <b>${nombres[0].nombre}</b> (libros de texto) o <b>${nombres[1].nombre}</b> (IUPAC 2005, que usa los nombres «aniónicos» de los ligandos: cloruro, cianido…).` },
    ];
    return { formula, html, tipo: 'Compuesto de coordinación', nombres, metal, ox, cn, dN, geo, z, ligandos: ligs, pasos, texto: formula, cuenta: null };
  }

  const LISTA = [
    '[Cu(NH3)4]2+', '[Cu(H2O)4]2+', '[Ag(NH3)2]+', '[Zn(NH3)4]2+', '[Ni(NH3)6]2+', '[Co(NH3)6]3+', '[Cr(NH3)6]3+', '[Fe(H2O)6]2+', '[Fe(H2O)6]3+', '[Co(H2O)6]2+', '[Ni(H2O)6]2+', '[Cr(H2O)6]3+', '[Al(H2O)6]3+', '[Zn(H2O)4]2+', '[Cu(en)2]2+', '[Co(en)3]3+', '[Pt(NH3)4]2+',
    '[Fe(CN)6]3-', '[Fe(CN)6]4-', '[Ag(CN)2]-', '[Cu(CN)4]3-', '[Zn(OH)4]2-', '[Al(OH)4]-', '[Cr(OH)4]-', '[CuCl4]2-', '[PtCl4]2-', '[PtCl6]2-', '[HgI4]2-', '[CoCl4]2-', '[FeCl4]-', '[Ni(CN)4]2-', '[Co(NO2)6]3-', '[Fe(SCN)6]3-', '[AgCl2]-', '[Zn(CN)4]2-', '[AuCl4]-', '[Fe(ox)3]3-',
    '[Ni(CO)4]', '[Fe(CO)5]', '[Pt(NH3)2Cl2]', '[Co(NH3)3Cl3]',
    'K3[Fe(CN)6]', 'K4[Fe(CN)6]', 'K[Ag(CN)2]', 'Na[Al(OH)4]', 'Na2[Zn(OH)4]', 'K2[PtCl4]', 'K2[PtCl6]', 'K2[HgI4]', 'K2[Ni(CN)4]', 'Na3[Co(NO2)6]', '[Cu(NH3)4]SO4', '[Co(NH3)6]Cl3', '[Ag(NH3)2]Cl', '[Ni(NH3)6]Cl2', '[Cr(H2O)6]Cl3', '[Pt(NH3)4]Cl2', '[Cu(NH3)4](NO3)2',
  ];
  let mapa = null;
  function indice() {
    if (mapa) return mapa;
    mapa = new Map();
    for (const f of LISTA) { const r = leer(f); for (const n of r.nombres) { mapa.set(norm(n.nombre), f); if (r.z !== 0 && !/ de /.test(n.nombre)) { mapa.set(norm(n.nombre.replace(/^ion /, '')), f); mapa.set(norm('cation ' + n.nombre.replace(/^ion /, '')), f); mapa.set(norm('anion ' + n.nombre.replace(/^ion /, '')), f); } } }
    return mapa;
  }
  const porNombre = (k) => indice().get(k) || null;
  return { leer, porNombre, LISTA, LIG, MET };
})();
if (typeof module !== 'undefined') module.exports = Complejos;
