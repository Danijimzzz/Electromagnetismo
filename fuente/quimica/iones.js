/* =====================================================================
   Iones y reglas de solubilidad (AJ-2): descompone un compuesto iónico en su catión y su anión,
   dice si es soluble (reglas de solubilidad de clase) y, con los estados (s), (l), (g), (aq),
   pasa una reacción molecular ajustada a la ecuación iónica completa y a la iónica neta,
   quitando los iones espectadores. Sin DOM. Usa Elementos (elementos.js).
     ionizar(texto)           { cat, nCat, an, nAn, qCat, qAn } o null si no es una sal conocida
     soluble(ion)             true / false / null (no es una sal)
     estadoPorReglas(texto)   estado supuesto cuando el usuario no lo escribe, con el motivo
     neta(especies)           [{ texto, coef, reactivo, estado }] → { completa, espectadores, neta, tipo… }
   Reglas: sales de metales alcalinos y de amonio, nitratos, acetatos, cloratos y percloratos son solubles;
   cloruros, bromuros y yoduros también, salvo los de Ag, Pb y Hg(I); sulfatos también, salvo los de Ba, Sr, Pb y Ca;
   carbonatos, fosfatos, sulfuros, sulfitos, cromatos, óxidos e hidróxidos son insolubles, salvo los alcalinos y
   amonio (y los hidróxidos de Ba, Sr y Ca, que se tratan como fuertes y solubles). Tomadas de las tablas habituales
   de química general (Chang, Atkins); son reglas de clase, no medidas.
   ===================================================================== */
const Iones = (() => {
  const E = typeof Elementos !== 'undefined' ? Elementos : require('./elementos.js');
  const SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  const ANIONES = { Cl: -1, Br: -1, I: -1, F: -1, NO3: -1, NO2: -1, ClO4: -1, ClO3: -1, ClO: -1, MnO4: -1, OH: -1, HCO3: -1, HSO4: -1, CH3COO: -1, C2H3O2: -1, CN: -1, SCN: -1,
    SO4: -2, SO3: -2, CO3: -2, CrO4: -2, Cr2O7: -2, S: -2, O: -2, C2O4: -2, PO4: -3 };
  const METALES = new Set(E.lista.filter((e) => ['a', 't', 'm', 'p', 'l', 'c'].includes(e.cat)).map((e) => e.simbolo));
  const CATIONES = [...METALES, 'NH4', 'Hg2', 'H'];
  const ALCALINOS = new Set(['Li', 'Na', 'K', 'Rb', 'Cs', 'NH4']);
  const ACIDOS_FUERTES = new Set(['HCl', 'HBr', 'HI', 'HNO3', 'H2SO4', 'HClO4', 'HClO3']);
  const ACIDOS_DEBILES = new Set(['HF', 'H2CO3', 'H2S', 'HCN', 'H3PO4', 'HNO2', 'H2SO3', 'HClO', 'CH3COOH', 'H2C2O4', 'H3BO3']);
  const GASES = new Set(['H2', 'O2', 'N2', 'Cl2', 'F2', 'CO2', 'CO', 'SO2', 'SO3', 'NO', 'NO2', 'N2O', 'N2O4', 'NH3', 'CH4', 'C2H6', 'C3H8', 'C4H10', 'C2H4', 'C2H2', 'H2S', 'O3', 'He', 'Ne', 'Ar']);
  const limpia = (t) => String(t).trim().replace(/[₀-₉]/g, (c) => SUB[c]).replace(/\s*\((?:s|l|g|aq|ac)\)\s*$/i, '').replace(/\s+/g, '');
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // «Al2(SO4)3» → { cat: 'Al', nCat: 2, an: 'SO4', nAn: 3, qCat: 3, qAn: -2 }; la carga del catión sale del equilibrio con el anión
  function ionizar(texto) {
    let t = limpia(texto);
    // los acetatos se escriben también con el anión delante: CH3COONa, (CH3COO)2Ca → NaCH3COO, Ca(CH3COO)2
    const ac = /^(?:CH3COO|\(CH3COO\)(\d+))([A-Z][a-z]?\d?|NH4)$/.exec(t);
    if (ac && ac[2] !== 'H') t = ac[1] ? `${ac[2]}(CH3COO)${ac[1]}` : `${ac[2]}CH3COO`;
    for (const an of Object.keys(ANIONES).sort((a, b) => b.length - a.length)) for (const cat of CATIONES.sort((a, b) => b.length - a.length)) {
      // el catión también puede ir entre paréntesis: (NH4)2CO3, (NH4)2SO4
      const re = new RegExp(`^(?:${esc(cat)}|\\(${esc(cat)}\\))(\\d*)\\(?${esc(an)}\\)?(\\d*)$`), m = re.exec(t);
      if (!m || (cat === 'H' && (an === 'O' || an === 'S' && false))) continue;
      const nCat = +(m[1] || 1), nAn = +(m[2] || 1), q = (-ANIONES[an] * nAn) / nCat;
      if (Number.isInteger(q) && q >= 1 && q <= 4 && (cat !== 'NH4' || q === 1) && (cat !== 'Hg2' || q === 2)) {
        return { cat, nCat, an, nAn, qCat: q, qAn: ANIONES[an], texto: t };
      }
    }
    return null;
  }
  // true soluble, false insoluble, null si no es una sal (o un ácido/base)
  function soluble(ion) {
    if (!ion) return null;
    const { cat, an } = ion;
    if (cat === 'H') return true;
    if (ALCALINOS.has(cat)) return true;
    if (['NO3', 'NO2', 'ClO4', 'ClO3', 'ClO', 'CH3COO', 'C2H3O2', 'HCO3', 'HSO4', 'MnO4', 'CN', 'SCN'].includes(an)) return an === 'SCN' || an === 'CN' ? !['Ag', 'Pb', 'Hg2', 'Cu'].includes(cat) : true;
    if (['Cl', 'Br', 'I'].includes(an)) return !['Ag', 'Pb', 'Hg2', 'Cu'].includes(cat);
    if (an === 'F') return !['Ca', 'Mg', 'Ba', 'Sr', 'Pb'].includes(cat);
    if (an === 'SO4') return !['Ba', 'Sr', 'Pb', 'Ca'].includes(cat);
    if (an === 'OH') return ['Ba', 'Sr', 'Ca'].includes(cat);
    return false; // CO3, PO4, S, SO3, CrO4, C2O4, O, Cr2O7
  }
  const esFuerte = (t) => { const x = limpia(t); return ACIDOS_FUERTES.has(x); };
  const esDebil = (t) => ACIDOS_DEBILES.has(limpia(t));
  // estado supuesto: sal → aq o s según las reglas; ácido → aq; agua → l; gases conocidos → g; resto, el elemento: s
  function estadoPorReglas(texto) {
    const t = limpia(texto);
    if (t === 'H2O') return { estado: 'l', motivo: 'agua líquida' };
    if (t === 'Br2' || t === 'Hg') return { estado: 'l', motivo: 'líquido a 25 °C' };
    if (GASES.has(t)) return { estado: 'g', motivo: 'gas a 25 °C' };
    if (esFuerte(t) || esDebil(t)) return { estado: 'aq', motivo: 'ácido en disolución acuosa' };
    const ion = ionizar(t);
    if (ion) { const s = soluble(ion); return { estado: s ? 'aq' : 's', motivo: s ? 'sal soluble según las reglas de solubilidad' : 'sal insoluble según las reglas de solubilidad (precipita)' }; }
    if (/^C\d*H\d*/.test(t) || /^[A-Z][a-z]?$/.test(t)) return { estado: /^C\d*H\d*/.test(t) ? 'l' : 's', motivo: 'sustancia molecular o elemento sin disociar' };
    return { estado: 's', motivo: 'sin regla: se supone sólido' };
  }
  // ¿se disocia por completo en disolución acuosa? (electrolito fuerte)
  function iones(texto, estado) {
    if (estado !== 'aq') return null;
    const t = limpia(texto);
    if (ACIDOS_FUERTES.has(t)) { const i = ionizar(t); return i ? [{ f: 'H', q: 1, n: i.nCat }, { f: i.an, q: i.qAn, n: i.nAn }] : null; }
    if (ACIDOS_DEBILES.has(t) || t === 'NH3') return null;
    const i = ionizar(t);
    if (!i || i.cat === 'H') return null;
    if (i.an === 'O') return null; // los óxidos reaccionan con el agua, no se disocian
    if (!soluble(i)) return null;
    return [{ f: i.cat === 'Hg2' ? 'Hg2' : i.cat, q: i.qCat, n: i.nCat }, { f: i.an === 'C2H3O2' ? 'CH3COO' : i.an, q: i.qAn, n: i.nAn }];
  }

  const mcd = (a, b) => (b ? mcd(b, a % b) : Math.abs(a));
  const sub = (f) => String(f).replace(/(\d+)/g, '<sub>$1</sub>');
  const html = (k) => { const [f, q] = k.split('^'); if (q === undefined) { const m = /^(.*)\((s|l|g|aq)\)$/.exec(f); return m ? `${sub(m[1])}<small class="estado">(${m[2]})</small>` : sub(f); } const qn = +q; return `${sub(f)}<sup>${Math.abs(qn) > 1 ? Math.abs(qn) : ''}${qn > 0 ? '+' : '−'}</sup>`; };
  const lado = (L) => L.map(([k, c]) => (c > 1 ? c + ' ' : '') + html(k)).join(' + ');

  // especies: [{ texto (sin estado), estado, coef, reactivo }] → ecuación iónica completa, espectadores y neta
  function neta(especies) {
    const dis = (L) => { const m = new Map(); for (const s of L) { const io = iones(s.texto, s.estado); if (io) for (const x of io) { const k = `${x.f}^${x.q}`; m.set(k, (m.get(k) || 0) + s.coef * x.n); } else { const k = `${limpia(s.texto)}(${s.estado})`; m.set(k, (m.get(k) || 0) + s.coef); } } return m; };
    const R = dis(especies.filter((s) => s.reactivo)), P = dis(especies.filter((s) => !s.reactivo));
    const completa = { R: [...R], P: [...P] }, esp = [];
    for (const [k, c] of R) if (P.has(k)) { const m = Math.min(c, P.get(k)); esp.push([k, m]); R.set(k, c - m); P.set(k, P.get(k) - m); }
    const limp = (M) => [...M].filter(([, c]) => c > 0);
    let r = limp(R), p = limp(P);
    const g = [...r, ...p].reduce((a, [, c]) => mcd(a, c), 0) || 1;
    r = r.map(([k, c]) => [k, c / g]); p = p.map(([k, c]) => [k, c / g]);
    return { completa, espectadores: esp.filter(([k]) => k.includes('^')).map(([k]) => k), neta: { R: r, P: p }, hayNeta: r.length > 0 || p.length > 0,
      htmlCompleta: `${lado(completa.R)} <span class="flecha">→</span> ${lado(completa.P)}`, htmlNeta: r.length || p.length ? `${lado(r)} <span class="flecha">→</span> ${lado(p)}` : '', htmlEspectadores: esp.filter(([k]) => k.includes('^')).map(([k]) => html(k)).join(', ') };
  }

  // tipo de reacción (clase) con las especies y sus estados
  function tipo(especies) {
    const R = especies.filter((s) => s.reactivo), P = especies.filter((s) => !s.reactivo), t = (s) => limpia(s.texto);
    const elem = (s) => /^[A-Z][a-z]?\d*$/.test(t(s)) && !s.carga;
    const tiene = (L, x) => L.some((s) => t(s) === x);
    if (tiene(R, 'O2') && R.length === 2 && P.every((s) => ['CO2', 'H2O', 'CO', 'SO2', 'N2', 'NO', 'NO2', 'C'].includes(t(s))) && R.some((s) => /^C\d*H\d*(O\d*)?$/.test(t(s)) )) return 'combustión';
    if (tiene(R, 'O2') && P.some((s) => t(s) === 'CO2') && P.some((s) => t(s) === 'H2O')) return 'combustión';
    if (R.length === 1 && P.length >= 2) return 'descomposición';
    if (R.length >= 2 && P.length === 1) return 'síntesis (combinación)';
    const ac = R.find((s) => esFuerte(t(s)) || esDebil(t(s))), ba = R.find((s) => { const i = ionizar(t(s)); return (i && i.an === 'OH') || t(s) === 'NH3'; });
    if (ac && ba && P.some((s) => t(s) === 'H2O')) return 'neutralización (ácido-base)';
    if (ac && R.some((s) => { const i = ionizar(t(s)); return i && (i.an === 'CO3' || i.an === 'HCO3' || i.an === 'SO3'); }) && P.some((s) => ['CO2', 'SO2'].includes(t(s)))) return 'ácido + carbonato (desprende un gas)';
    if (R.length === 2 && P.length === 2 && R.every((s) => s.estado === 'aq') && P.some((s) => s.estado === 's' && ionizar(t(s)))) return 'precipitación (doble desplazamiento)';
    if (R.length === 2 && P.length === 2 && R.filter(elem).length === 1 && P.filter(elem).length >= 1) return 'desplazamiento simple (redox)';
    if (R.length === 2 && P.length === 2 && R.every((s) => ionizar(t(s)) || esFuerte(t(s)) || esDebil(t(s))) ) return 'doble desplazamiento';
    if (R.some(elem) && P.some(elem)) return 'redox';
    return 'reacción general';
  }
  return { ionizar, soluble, estadoPorReglas, iones, neta, tipo, html, esAcido: (t) => esFuerte(t) || esDebil(t) };
})();
if (typeof module !== 'undefined') module.exports = Iones;
