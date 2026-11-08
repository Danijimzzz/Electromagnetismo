/* =====================================================================
   Fórmula semidesarrollada ↔ SMILES (sin DOM) para la herramienta de
   Nomenclatura orgánica (OR-3). Se escribe como en clase: grupos como CH3,
   CH2, OH o NH2 unidos con - (sencillo), = (doble) y # o ≡ (triple), y las
   ramas entre paréntesis: CH3-CH(OH)-CH3, CH3-C(=O)-OH, CH2=CH-CH3.
     aSmiles(texto)  → { smiles }  (lanza Error si el grupo no cuadra)
     deSmiles(smiles)→ texto semidesarrollado con Organica.leer
     GRUPOS          botones de la interfaz: [etiqueta, texto que inserta]
   No admite anillos: los cierres de anillo se escriben en SMILES.
   ===================================================================== */
const Semi = (() => {
  const VAL = { C: 4, N: 3, O: 2, S: 2, F: 1, Cl: 1, Br: 1, I: 1 };
  const GRUPOS = [['CH₃', 'CH3'], ['CH₂', 'CH2'], ['CH', 'CH'], ['C', 'C'], ['OH', 'OH'], ['=O', '(=O)'], ['NH₂', 'NH2'], ['SH', 'SH'], ['F', 'F'], ['Cl', 'Cl'], ['Br', 'Br'], ['I', 'I'], ['-', '-'], ['=', '='], ['≡', '#'], ['( )', '()'], ['COOH', 'C(=O)-OH'], ['CHO', 'CH=O'], ['CN', 'C#N']];
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';

  function aSmiles(texto) {
    let s = String(texto ?? '').replace(/\s+/g, '').replace(/[₀-₉]/g, (d) => SUBS.indexOf(d)).replace(/[–−—]/g, '-').replace(/≡/g, '#');
    if (!s) throw new Error('Escribe la fórmula semidesarrollada, por ejemplo CH3-CH(OH)-CH3');
    // abreviaturas de clase: COOH, CONH2, COO-, CHO y CN
    s = s.replace(/CONH2/g, 'C(=O)NH2').replace(/COOH/g, 'C(=O)OH').replace(/COO(?!H)/g, 'C(=O)O').replace(/CHO(?!H)/g, 'CH(=O)').replace(/CN/g, 'C#N');
    const at = [], pila = [];
    let cur = -1, enl = 1, i = 0, pendiente = false, hIni = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === '-') { enl = 1; pendiente = true; i++; } else if (ch === '=') { enl = 2; pendiente = true; i++; } else if (ch === '#') { enl = 3; pendiente = true; i++; }
      else if (ch === '(') { if (cur < 0) throw new Error('Una rama entre paréntesis va después de un átomo'); pila.push(cur); i++; }
      else if (ch === ')') { if (!pila.length) throw new Error('Hay un paréntesis que se cierra sin haberse abierto'); cur = pila.pop(); enl = 1; pendiente = false; i++; }
      else if (ch === 'H' && !/^H\d/.test(s.slice(i))) { if (cur >= 0) at[cur].h++; else hIni++; enl = 1; pendiente = false; i++; }
      else {
        const m = /^(Cl|Br|[CNOSFI])(?:H(\d*))?/.exec(s.slice(i));
        if (!m) throw new Error(/^\d/.test(s.slice(i)) ? 'Aquí no caben números sueltos ni anillos: escribe cada grupo con sus hidrógenos (CH3, CH2…); los anillos se escriben en SMILES' : `No entiendo «${s.slice(i, i + 3)}». Usa C, N, O, S, F, Cl, Br e I con su número de hidrógenos (CH3, OH, NH2…)`);
        const h = m[2] === undefined ? (m[0].endsWith('H') ? 1 : 0) : (m[2] === '' ? 1 : +m[2]);
        at.push({ el: m[1], h: h + (cur < 0 ? hIni : 0), padre: cur, ord: cur < 0 ? 0 : enl, hijos: [] });
        if (cur >= 0) at[cur].hijos.push(at.length - 1);
        cur = at.length - 1; enl = 1; pendiente = false; i += m[0].length;
      }
    }
    if (pila.length) throw new Error('Falta cerrar un paréntesis');
    if (pendiente) throw new Error('La fórmula acaba en un enlace sin átomo');
    if (!at.length) throw new Error('No hay ningún átomo');
    for (const [k, a] of at.entries()) {
      const suma = (a.padre >= 0 ? a.ord : 0) + a.hijos.reduce((t, c) => t + at[c].ord, 0);
      if (a.h + suma !== VAL[a.el]) throw new Error(`El ${a.el} del grupo n.º ${k + 1} tiene ${suma} ${suma === 1 ? 'enlace' : 'enlaces'} con otros átomos y ${a.h} H: suma ${suma + a.h} y su valencia es ${VAL[a.el]}${a.el === 'C' && suma + a.h < 4 ? '. Los enlaces dobles y triples se escriben con = y # (CH3-C(=O)-OH)' : ''}`);
    }
    const rec = (k) => {
      const a = at[k]; let t = a.el;
      a.hijos.forEach((c, n) => { const e = at[c].ord === 2 ? '=' : at[c].ord === 3 ? '#' : ''; t += n < a.hijos.length - 1 ? `(${e}${rec(c)})` : e + rec(c); });
      return t;
    };
    return { smiles: rec(0) };
  }

  function deSmiles(smiles) {
    const M = (typeof Organica !== 'undefined' ? Organica : require('./calculo.js')).leer(smiles);
    const rec = (i) => {
      const a = M.at[i]; let t = a.el + (a.h ? 'H' + (a.h > 1 ? a.h : '') : '');
      a.hijos.forEach((c, n) => {
        const e = M.at[c].ord === 2 ? '=' : M.at[c].ord === 3 ? '≡' : '-';
        t += n < a.hijos.length - 1 ? `(${e === '-' ? '' : e}${rec(c)})` : e + rec(c);
      });
      return t;
    };
    return rec(0).replace(/H(\d)/g, (_, d) => 'H' + SUBS[d]).replace(/\(-/g, '(');
  }
  return { aSmiles, deSmiles, GRUPOS };
})();
if (typeof module !== 'undefined') module.exports = Semi;
