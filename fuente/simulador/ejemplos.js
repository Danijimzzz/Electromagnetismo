/* =====================================================================
   Simulador de circuitos · ejemplos de partida. Cada uno se escribe con
   componentes colocados en la rejilla (id, tipo, x, y, giro, valores) y
   cables entre patillas «id.n» o puntos [x, y]; `monta` los convierte en el
   estado del editor. Las patillas que caen en el mismo punto ya están unidas.
   ===================================================================== */
const EjemplosSim = (() => {
  // giro: 0 → derecha, 1 → abajo, 2 → izquierda, 3 → arriba
  const monta = (nombre, comps, cables = [], analisis = {}) => {
    const cs = comps.map(([id, t, x, y, rot = 0, v = {}, espejo = false]) => ({ id, t, x, y, rot, espejo, v: { ...CompSim.vacio(t), ...v } }));
    const punto = (q) => { if (Array.isArray(q)) return q; const [id, n] = q.split('.'), c = cs.find((k) => k.id === id); return Esquema.pines(c, CompSim.C)[+n]; };
    const w = [];
    for (const [a0, b0] of cables) {
      const a = punto(a0), b = punto(b0);
      if (a[0] === b[0] || a[1] === b[1]) w.push({ a, b }); else { const m = [b[0], a[1]]; w.push({ a, b: m }, { a: m, b }); }
    }
    return { nombre, sc: { version: 2, componentes: cs, cables: w, analisis, vista: null } };
  };
  const lista = [
    { clave: 'divisor', ...monta('Divisor de tensión en continua', [['E1', 'V', 0, 2, 1, { forma: 'cc', v: '12' }], ['R1', 'R', 0, 2, 0, { R: '1k' }], ['R2', 'R', 4, 2, 1, { R: '2k' }], ['GND1', 'GND', 0, 6, 0]], [['R2.1', [0, 6]]]) },
    { clave: 'wheatstone', ...monta('Puente de Wheatstone desequilibrado', [['E1', 'V', 0, 2, 1, { forma: 'cc', v: '12' }], ['R1', 'R', 4, 2, 1, { R: '1k' }], ['R2', 'R', 4, 6, 1, { R: '2k' }], ['R3', 'R', 10, 2, 1, { R: '1k' }], ['R4', 'R', 10, 6, 1, { R: '1k' }], ['VM1', 'VM', 4, 6, 0], ['GND1', 'GND', 0, 10, 0]],
      [['E1.0', 'R1.0'], ['R1.0', 'R3.0'], ['R2.1', 'R4.1'], [[0, 10], 'R2.1'], ['E1.1', [0, 10]], ['VM1.1', 'R3.1']]) },
    { clave: 'rc-escalon', ...monta('Carga de un condensador (RC con escalón)', [['E1', 'V', 0, 2, 1, { forma: 'escalon', v1: '0', v2: '5', t0: '0' }], ['R1', 'R', 0, 2, 0, { R: '1k' }], ['C1', 'C', 4, 2, 1, { C: '1' }], ['SONDA1', 'SONDA', 4, 2, 0, { canal: '1' }], ['GND1', 'GND', 0, 6, 0]], [['C1.1', [0, 6]]], { tfin: '5m' }) },
    { clave: 'rlc-alterna', ...monta('RLC en serie a 50 Hz', [['E1', 'V', 0, 2, 1, { forma: 'seno', A: '230', eficaz: 'eficaz', f: '50' }], ['R1', 'R', 0, 2, 0, { R: '40' }], ['L1', 'L', 4, 2, 0, { L: '200' }], ['C1', 'C', 8, 2, 1, { C: '100' }], ['GND1', 'GND', 0, 6, 0]], [['C1.1', [0, 6]]], { tfin: '60m' }) },
    { clave: 'rectificador', ...monta('Rectificador de media onda con filtro', [['E1', 'V', 0, 2, 1, { forma: 'seno', A: '10', f: '50' }], ['D1', 'D', 0, 2, 0], ['C1', 'C', 4, 2, 1, { C: '100' }], ['R1', 'R', 8, 2, 1, { R: '1k' }], ['SONDA1', 'SONDA', 4, 2, 0, { canal: '1' }], ['GND1', 'GND', 0, 6, 0]], [['C1.0', 'R1.0'], ['C1.1', 'R1.1'], ['C1.1', [0, 6]]], { tfin: '60m' }) },
    { clave: 'transformador', ...monta('Transformador ideal 10:1', [['E1', 'V', 0, 1, 1, { forma: 'seno', A: '230', eficaz: 'eficaz', f: '50' }], ['T1', 'TR', 4, 2, 0, { n: '10' }], ['R1', 'R', 10, 1, 1, { R: '10' }], ['GND1', 'GND', 0, 5, 0]], [['E1.0', 'T1.0'], ['E1.1', 'T1.1'], ['T1.2', 'R1.0'], ['R1.1', 'T1.3'], [[8, 5], [4, 5]]], { tfin: '60m' }) },
    { clave: 'inversor', ...monta('Amplificador operacional inversor (ganancia −5)', [['E1', 'V', 0, 2, 1, { forma: 'cc', v: '1' }], ['R1', 'R', 0, 2, 0, { R: '1k' }], ['R2', 'R', 4, 0, 0, { R: '5k' }], ['A1', 'AO', 8, 3, 0], ['R3', 'R', 12, 3, 1, { R: '10k' }], ['GND1', 'GND', 0, 6, 0]],
      [['R1.1', 'A1.1'], ['R1.1', 'R2.0'], ['R2.1', [12, 0]], [[12, 0], 'A1.2'], ['A1.0', [8, 6]], [[8, 6], [0, 6]], ['R3.1', [12, 6]], [[12, 6], [8, 6]]]) },
    { clave: 'filtro-rc', ...monta('Filtro RC paso bajo (mira el Bode)', [['E1', 'V', 0, 2, 1, { forma: 'seno', A: '1', f: '1k' }], ['R1', 'R', 0, 2, 0, { R: '1k' }], ['C1', 'C', 4, 2, 1, { C: '0,159' }], ['SONDA1', 'SONDA', 0, 2, 0, { canal: '1' }], ['SONDA2', 'SONDA', 4, 2, 0, { canal: '2' }], ['GND1', 'GND', 0, 6, 0]], [['C1.1', [0, 6]]], { tfin: '5m' }) },
    { clave: 'emisor-comun', ...monta('Transistor NPN en emisor común', [['E1', 'V', 0, 0, 1, { forma: 'cc', v: '12' }], ['RB', 'R', 4, 0, 1, { R: '470k' }], ['RC', 'R', 10, 0, 1, { R: '1k' }], ['Q1', 'BJT', 8, 6, 0, { bf: '100' }], ['SONDA1', 'SONDA', 10, 4, 0, { canal: '1' }], ['GND1', 'GND', 0, 12, 0]],
      [['E1.0', 'RB.0'], ['RB.0', 'RC.0'], ['RB.1', 'Q1.1'], ['E1.1', [0, 12]], ['Q1.2', [10, 12]], [[0, 12], [10, 12]]]) },
    { clave: 'nmos', ...monta('MOSFET de canal N en saturación', [['E1', 'V', 0, 0, 1, { forma: 'cc', v: '10' }], ['RD', 'R', 10, 0, 1, { R: '1k' }], ['M1', 'NMOS', 8, 6, 0, { k: '2m', Vth: '2' }], ['E2', 'V', 4, 6, 1, { forma: 'cc', v: '4' }], ['GND1', 'GND', 0, 12, 0]],
      [['E1.0', 'RD.0'], ['E2.0', 'M1.1'], ['E1.1', [0, 12]], ['E2.1', [4, 12]], ['M1.2', [10, 12]], [[0, 12], [10, 12]]]) },
    { clave: 'nand', ...monta('Puerta NAND con una entrada a 5 V y otra a 0 V', [['E1', 'V', 0, 0, 1, { forma: 'cc', v: '5' }], ['E2', 'V', 4, 6, 1, { forma: 'cc', v: '0' }], ['U1', 'NAND', 8, 4, 0], ['R1', 'R', 12, 4, 1, { R: '1k' }], ['SONDA1', 'SONDA', 12, 4, 0, { canal: '1' }], ['GND1', 'GND', 0, 10, 0]],
      [['E1.0', 'U1.0'], ['E2.0', 'U1.1'], ['E1.1', [0, 10]], ['E2.1', [4, 10]], ['R1.1', [12, 10]], [[0, 10], [12, 10]]]) },
    { clave: 'trifasica', ...monta('Trifásica en estrella con carga equilibrada', [['G1', 'FT', 4, 4, 2, { Vf: '230', f: '50' }, true], ['K1', 'CT', 8, 4, 0, { R: '10', L: '0' }], ['GND1', 'GND', 2, 7, 0]],
      [['G1.0', 'K1.0'], ['G1.1', 'K1.1'], ['G1.2', 'K1.2'], ['G1.3', 'K1.3']], { tfin: '60m' }) },
  ];
  return { lista };
})();
if (typeof module !== 'undefined') module.exports = EjemplosSim;
