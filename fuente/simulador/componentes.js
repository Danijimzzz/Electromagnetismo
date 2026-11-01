/* =====================================================================
   Simulador de circuitos · catálogo de componentes (sin cálculo). Cada uno
   dice cómo se llama, a qué familia pertenece, dónde tiene las patillas (en
   casillas de 20 px, sin girar), cómo se dibuja (símbolo IEC) y qué valores se
   le piden. La conversión a elementos del motor está en extraer.js; el
   editor (esquema.js) solo usa pines, dib, ancho y alto.
   campos: { k, nom, un, def, base (para leeSI), op: [valores] si es una lista, si: (v) => ¿se muestra? }
   ===================================================================== */
const CompSim = (() => {
  const S = (d) => `<path d="${d}"/>`, T = (x, y, s, cl = '') => `<text class="sim-t ${cl}" x="${x}" y="${y}" text-anchor="middle">${s}</text>`;
  const CIRC = (r = 16, cx = 40, cy = 0) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  const dos = (cuerpo, cabos = 'M0 0H24M56 0H80') => S(cabos) + cuerpo; // dos patillas en (0,0) y (4,0)
  const FORMAS = ['cc', 'seno', 'cuadrada', 'triangular', 'diente', 'pulso', 'escalon'];
  const campoOnda = (un) => [
    { k: 'forma', nom: 'Forma de onda', op: FORMAS, def: 'cc' },
    { k: 'v', nom: 'Valor', un, def: '5', si: (v) => v.forma === 'cc' },
    { k: 'A', nom: 'Amplitud', un, def: '5', si: (v) => ['seno', 'cuadrada', 'triangular', 'diente'].includes(v.forma) },
    { k: 'eficaz', nom: 'La amplitud es', op: ['de pico', 'eficaz'], def: 'de pico', si: (v) => ['seno', 'cuadrada', 'triangular', 'diente'].includes(v.forma) },
    { k: 'f', nom: 'Frecuencia', un: 'Hz', def: '50', si: (v) => ['seno', 'cuadrada', 'triangular', 'diente'].includes(v.forma) },
    { k: 'fase', nom: 'Fase', un: '°', def: '0', si: (v) => v.forma === 'seno' },
    { k: 'off', nom: 'Continua añadida', un, def: '0', si: (v) => ['seno', 'cuadrada', 'triangular', 'diente'].includes(v.forma) },
    { k: 'duty', nom: 'Ciclo de trabajo', un: '%', def: '50', si: (v) => v.forma === 'cuadrada' },
    { k: 'v1', nom: 'Nivel bajo', un, def: '0', si: (v) => v.forma === 'pulso' || v.forma === 'escalon' },
    { k: 'v2', nom: 'Nivel alto', un, def: '5', si: (v) => v.forma === 'pulso' || v.forma === 'escalon' },
    { k: 't0', nom: 'Instante del escalón', un: 's', def: '0', si: (v) => v.forma === 'escalon' },
    { k: 'td', nom: 'Retardo', un: 's', def: '0', si: (v) => v.forma === 'pulso' },
    { k: 'tr', nom: 'Tiempo de subida', un: 's', def: '0', si: (v) => v.forma === 'pulso' },
    { k: 'tf', nom: 'Tiempo de bajada', un: 's', def: '0', si: (v) => v.forma === 'pulso' },
    { k: 'pw', nom: 'Ancho del pulso', un: 's', def: '1m', si: (v) => v.forma === 'pulso' },
    { k: 'per', nom: 'Periodo', un: 's', def: '2m', si: (v) => v.forma === 'pulso' },
  ];
  const gate = (cuerpo, neg = false, dos_ = true) => (c) => (dos_ ? S('M0 -20H20M0 20H20') : S('M0 0H20')) + S(`M${neg ? 77 : 68} 0H80`) + cuerpo + (neg ? `<circle cx="72" cy="0" r="4"/>` : '');
  const pinesPuerta = [[0, -1], [0, 1], [4, 0]];
  const puerta = (nombre, cuerpo, neg, extra) => ({ nombre, fam: 'Lógica', pines: pinesPuerta, letra: 'U', dib: gate(cuerpo, neg), campos: [{ k: 'Vcc', nom: 'Tensión de alimentación', un: 'V', def: '5' }], fn: extra, ancho: 4, alto: 2 });
  const AND = 'M20 -24H44A24 24 0 0 1 44 24H20Z', OR = 'M16 -24Q44 -24 64 0Q44 24 16 24Q28 0 16 -24Z', XOR = OR + 'M8 -24Q20 0 8 24';
  const diodo = (c) => S('M0 0H28M52 0H80') + S('M28 -12V12L52 0Z') + S('M52 -12V12');
  const trafo = (nucleo) => S('M0 -20H24M0 20H24M80 -20H56M80 20H56') + S('M24 -20a7 7 0 0 0 0 13.3a7 7 0 0 0 0 13.4a7 7 0 0 0 0 13.3M56 -20a7 7 0 0 1 0 13.3a7 7 0 0 1 0 13.4a7 7 0 0 1 0 13.3') + (nucleo ? S('M37 -24V24M43 -24V24') : '');
  const caja3 = (rot, n, lab) => `<rect x="0" y="-30" width="80" height="${n ? 90 : 60}" rx="6"/>` + T(40, -14, lab) + T(14, -17, 'R', 'peq') + T(14, 3, 'S', 'peq') + T(14, 23, 'T', 'peq') + (n ? T(40, 52, 'N', 'peq') : '');
  const alo = (c) => (c.v && c.v.forma && c.v.forma !== 'cc');

  const C = {
    /* Pasivos */
    R: { nombre: 'Resistencia', fam: 'Pasivos', letra: 'R', pines: [[0, 0], [4, 0]], campos: [{ k: 'R', nom: 'Resistencia', un: 'Ω', def: '1k' }], dib: () => dos('<rect x="24" y="-8" width="32" height="16"/>'), mostrar: (v) => `${v.R} Ω` },
    POT: { nombre: 'Potenciómetro', fam: 'Pasivos', letra: 'RV', pines: [[0, 0], [4, 0], [2, -2]], campos: [{ k: 'R', nom: 'Resistencia total', un: 'Ω', def: '10k' }, { k: 'pos', nom: 'Posición del cursor (0 a 1)', def: '0,5' }], dib: () => dos('<rect x="24" y="-8" width="32" height="16"/>') + S('M40 -40V-12M34 -20L40 -10L46 -20'), alto: 2, mostrar: (v) => `${v.R} Ω` },
    C: { nombre: 'Condensador', fam: 'Pasivos', letra: 'C', pines: [[0, 0], [4, 0]], campos: [{ k: 'C', nom: 'Capacidad', un: 'μF', def: '1', base: 1e-6 }], dib: () => S('M0 0H35M45 0H80') + S('M35 -14V14M45 -14V14'), mostrar: (v) => `${v.C} μF` },
    CP: { nombre: 'Condensador polarizado', fam: 'Pasivos', letra: 'C', pines: [[0, 0], [4, 0]], campos: [{ k: 'C', nom: 'Capacidad', un: 'μF', def: '100', base: 1e-6 }], dib: () => S('M0 0H35M47 0H80') + S('M35 -14V14') + S('M49 -14Q42 0 49 14') + T(27, -8, '+', 'peq'), mostrar: (v) => `${v.C} μF` },
    L: { nombre: 'Bobina', fam: 'Pasivos', letra: 'L', pines: [[0, 0], [4, 0]], campos: [{ k: 'L', nom: 'Inductancia', un: 'mH', def: '10', base: 1e-3 }], dib: () => S('M0 0H12M68 0H80') + S('M12 0a7 7 0 0 1 14 0a7 7 0 0 1 14 0a7 7 0 0 1 14 0a7 7 0 0 1 14 0'), mostrar: (v) => `${v.L} mH` },
    ZRL: { nombre: 'Carga R-L en serie', fam: 'Pasivos', letra: 'Z', pines: [[0, 0], [4, 0]], campos: [{ k: 'R', nom: 'Resistencia', un: 'Ω', def: '10' }, { k: 'L', nom: 'Inductancia', un: 'mH', def: '50', base: 1e-3 }], dib: () => S('M0 0H8M72 0H80') + '<rect x="8" y="-8" width="26" height="16"/>' + S('M34 0a5.5 5.5 0 0 1 11 0a5.5 5.5 0 0 1 11 0a5.5 5.5 0 0 1 11 0'), mostrar: (v) => `${v.R} Ω + ${v.L} mH` },
    ZRC: { nombre: 'Carga R-C en serie', fam: 'Pasivos', letra: 'Z', pines: [[0, 0], [4, 0]], campos: [{ k: 'R', nom: 'Resistencia', un: 'Ω', def: '10' }, { k: 'C', nom: 'Capacidad', un: 'μF', def: '100', base: 1e-6 }], dib: () => S('M0 0H8M72 0H80') + '<rect x="8" y="-8" width="26" height="16"/>' + S('M34 0H52M52 -12V12M60 -12V12M60 0H72'), mostrar: (v) => `${v.R} Ω + ${v.C} μF` },
    LAMP: { nombre: 'Lámpara', fam: 'Pasivos', letra: 'H', pines: [[0, 0], [4, 0]], campos: [{ k: 'R', nom: 'Resistencia', un: 'Ω', def: '100' }], dib: () => S('M0 0H24M56 0H80') + CIRC(16) + S('M28.7 -11.3L51.3 11.3M28.7 11.3L51.3 -11.3'), mostrar: (v) => `${v.R} Ω`, lampara: true },
    /* Fuentes */
    V: { nombre: 'Fuente de tensión', fam: 'Fuentes', letra: 'E', pines: [[0, 0], [4, 0]], campos: campoOnda('V'), dib: (c) => S('M0 0H24M56 0H80') + CIRC() + (alo(c) && c.v.forma !== 'escalon' ? S('M31 0q4.5-9 9 0t9 0') : T(31, 4, '+', 'peq') + T(50, 4, '−', 'peq')), mostrar: (v) => (v.forma === 'cc' ? `${v.v} V` : v.forma === 'seno' ? `${v.A} V ${v.f} Hz` : v.forma) },
    PILA: { nombre: 'Pila', fam: 'Fuentes', letra: 'E', pines: [[0, 0], [4, 0]], campos: [{ k: 'v', nom: 'Tensión', un: 'V', def: '9' }], dib: () => S('M0 0H34M46 0H80') + S('M34 -16V16') + S('M46 -9V9') + T(26, -9, '+', 'peq'), mostrar: (v) => `${v.v} V`, motor: 'V' },
    I: { nombre: 'Fuente de corriente', fam: 'Fuentes', letra: 'J', pines: [[0, 0], [4, 0]], campos: campoOnda('A'), dib: () => S('M0 0H24M56 0H80') + CIRC() + S('M26 0H54M47 -5L54 0L47 5'), mostrar: (v) => (v.forma === 'cc' ? `${v.v} A` : v.forma) },
    GND: { nombre: 'Tierra', fam: 'Fuentes', letra: 'GND', pines: [[0, 0]], campos: [], dib: () => S('M0 0V12M-13 12H13M-8 18H8M-3 24H3'), ancho: 0, alto: 1, etq: [34, 16] },
    ETIQ: { nombre: 'Etiqueta de nudo', fam: 'Fuentes', letra: 'N', pines: [[0, 0]], campos: [{ k: 'nombre', nom: 'Nombre del nudo', def: 'Vout' }], dib: (c) => S('M0 0H8') + `<path d="M8 0L14 -9H44V9H14Z"/>` + T(29, 4, Esquema.esc(c.v.nombre || ''), 'peq'), ancho: 2, alto: 1, etq: [30, -16] },
    /* Dependientes */
    VV: { nombre: 'Fuente de tensión controlada por tensión', fam: 'Dependientes', letra: 'Ed', pines: [[0, 0], [4, 0], [1, 2], [3, 2]], campos: [{ k: 'k', nom: 'Ganancia k', un: 'V/V', def: '2' }], dib: () => S('M0 0H24M56 0H80') + S('M40 -16L56 0L40 16L24 0Z') + T(31, 4, '+', 'peq') + T(50, 4, '−', 'peq') + `<path class="ctrl" d="M20 40L32 8M60 40L48 8"/>`, alto: 2, mostrar: (v) => `k = ${v.k}` },
    VI: { nombre: 'Fuente de tensión controlada por corriente', fam: 'Dependientes', letra: 'Ed', pines: [[0, 0], [4, 0]], campos: [{ k: 'r', nom: 'Transresistencia r', un: 'Ω', def: '2' }, { k: 'ctrl', nom: 'Componente que controla (por su nombre)', def: 'R1' }], dib: () => S('M0 0H24M56 0H80') + S('M40 -16L56 0L40 16L24 0Z') + T(31, 4, '+', 'peq') + T(50, 4, '−', 'peq'), mostrar: (v) => `r = ${v.r}` },
    IV: { nombre: 'Fuente de corriente controlada por tensión', fam: 'Dependientes', letra: 'Jd', pines: [[0, 0], [4, 0], [1, 2], [3, 2]], campos: [{ k: 'g', nom: 'Transconductancia g', un: 'S', def: '0,01' }], dib: () => S('M0 0H24M56 0H80') + S('M40 -16L56 0L40 16L24 0Z') + S('M30 0H50M44 -4L50 0L44 4') + `<path class="ctrl" d="M20 40L32 8M60 40L48 8"/>`, alto: 2, mostrar: (v) => `g = ${v.g}` },
    II: { nombre: 'Fuente de corriente controlada por corriente', fam: 'Dependientes', letra: 'Jd', pines: [[0, 0], [4, 0]], campos: [{ k: 'beta', nom: 'Ganancia β', un: 'A/A', def: '2' }, { k: 'ctrl', nom: 'Componente que controla (por su nombre)', def: 'R1' }], dib: () => S('M0 0H24M56 0H80') + S('M40 -16L56 0L40 16L24 0Z') + S('M30 0H50M44 -4L50 0L44 4'), mostrar: (v) => `β = ${v.beta}` },
    /* Conmutación */
    SW: { nombre: 'Interruptor', fam: 'Conmutación', letra: 'S', pines: [[0, 0], [4, 0]], campos: [{ k: 'estado', nom: 'Estado al empezar', op: ['abierto', 'cerrado'], def: 'abierto' }, { k: 'tc', nom: 'Cambia en el instante (opcional)', un: 's', def: '' }], dib: (c) => S('M0 0H20M60 0H80') + `<circle cx="22" cy="0" r="3"/><circle cx="58" cy="0" r="3"/>` + (c.v.estado === 'cerrado' ? S('M22 0H58') : S('M22 0L54 -16')), mostrar: (v) => v.estado + (v.tc ? ` · cambia en ${v.tc} s` : ''), manual: true },
    SPDT: { nombre: 'Conmutador', fam: 'Conmutación', letra: 'S', pines: [[0, 0], [4, -1], [4, 1]], campos: [{ k: 'estado', nom: 'Posición al empezar', op: ['arriba', 'abajo'], def: 'arriba' }, { k: 'tc', nom: 'Cambia en el instante (opcional)', un: 's', def: '' }], dib: (c) => S('M0 0H20M60 -20H80M60 20H80') + `<circle cx="22" cy="0" r="3"/><circle cx="58" cy="-20" r="3"/><circle cx="58" cy="20" r="3"/>` + (c.v.estado === 'abajo' ? S('M22 0L55 18') : S('M22 0L55 -18')), alto: 2, mostrar: (v) => v.estado, manual: true },
    /* Magnéticos */
    TR: { nombre: 'Transformador ideal', fam: 'Magnéticos', letra: 'T', pines: [[0, -1], [0, 1], [4, -1], [4, 1]], campos: [{ k: 'n', nom: 'Relación N1/N2', def: '10' }], dib: () => trafo(true), alto: 2, mostrar: (v) => `${v.n}:1` },
    TRR: { nombre: 'Transformador real', fam: 'Magnéticos', letra: 'T', pines: [[0, -1], [0, 1], [4, -1], [4, 1]], campos: [{ k: 'n', nom: 'Relación N1/N2', def: '10' }, { k: 'Rp', nom: 'Resistencia del primario', un: 'Ω', def: '0,5' }, { k: 'Lp', nom: 'Dispersión del primario', un: 'mH', def: '1', base: 1e-3 }, { k: 'Lm', nom: 'Inductancia de magnetización', un: 'mH', def: '500', base: 1e-3 }, { k: 'Rs', nom: 'Resistencia del secundario', un: 'Ω', def: '0,01' }, { k: 'Ls', nom: 'Dispersión del secundario', un: 'mH', def: '0,01', base: 1e-3 }], dib: () => trafo(true), alto: 2, mostrar: (v) => `${v.n}:1 real` },
    KL: { nombre: 'Bobinas acopladas', fam: 'Magnéticos', letra: 'M', pines: [[0, -1], [0, 1], [4, -1], [4, 1]], campos: [{ k: 'L1', nom: 'Inductancia 1', un: 'mH', def: '100', base: 1e-3 }, { k: 'L2', nom: 'Inductancia 2', un: 'mH', def: '100', base: 1e-3 }, { k: 'k', nom: 'Coeficiente de acoplamiento k', def: '0,9' }], dib: () => trafo(false), alto: 2, mostrar: (v) => `k = ${v.k}` },
    /* Semiconductores */
    D: { nombre: 'Diodo', fam: 'Semiconductores', letra: 'D', pines: [[0, 0], [4, 0]], campos: [{ k: 'Is', nom: 'Corriente de saturación', un: 'A', def: '1e-14' }, { k: 'n', nom: 'Factor de idealidad', def: '1' }], dib: diodo, mostrar: () => '' },
    Z: { nombre: 'Diodo Zener', fam: 'Semiconductores', letra: 'DZ', pines: [[0, 0], [4, 0]], campos: [{ k: 'Vz', nom: 'Tensión Zener', un: 'V', def: '5,1' }, { k: 'Is', nom: 'Corriente de saturación', un: 'A', def: '1e-14' }], dib: () => S('M0 0H28M52 0H80') + S('M28 -12V12L52 0Z') + S('M58 -16L52 -12V12L46 16'), mostrar: (v) => `${v.Vz} V` },
    LED: { nombre: 'LED', fam: 'Semiconductores', letra: 'LED', pines: [[0, 0], [4, 0]], campos: [{ k: 'Is', nom: 'Corriente de saturación', un: 'A', def: '1e-18' }, { k: 'n', nom: 'Factor de idealidad', def: '2' }], dib: () => diodo() + S('M34 -18L42 -28M42 -28L38 -28M42 -28L42 -24M44 -14L52 -24M52 -24L48 -24M52 -24L52 -20'), mostrar: () => '', led: true },
    BJT: { nombre: 'Transistor NPN', fam: 'Semiconductores', letra: 'Q', pines: [[2, -2], [0, 0], [2, 2]], campos: [{ k: 'bf', nom: 'Ganancia β (hFE)', def: '100' }, { k: 'Is', nom: 'Corriente de saturación', un: 'A', def: '1e-14' }], dib: () => S('M0 0H22M22 -16V16M22 -8L40 -22V-40M22 8L40 22V40') + S('M40 22L31 20M40 22L36 13'), alto: 2, pnp: false, mostrar: (v) => `β = ${v.bf}`, ancho: 2 },
    PNP: { nombre: 'Transistor PNP', fam: 'Semiconductores', letra: 'Q', pines: [[2, -2], [0, 0], [2, 2]], campos: [{ k: 'bf', nom: 'Ganancia β (hFE)', def: '100' }, { k: 'Is', nom: 'Corriente de saturación', un: 'A', def: '1e-14' }], dib: () => S('M0 0H22M22 -16V16M22 -8L40 -22V-40M22 8L40 22V40') + S('M22 8L31 10M22 8L26 17'), alto: 2, pnp: true, mostrar: (v) => `β = ${v.bf}`, ancho: 2, motor: 'BJT' },
    NMOS: { nombre: 'MOSFET de canal N', fam: 'Semiconductores', letra: 'M', pines: [[2, -2], [0, 0], [2, 2]], campos: [{ k: 'k', nom: 'Parámetro k = μCox·W/L', un: 'A/V²', def: '2m', base: 1 }, { k: 'Vth', nom: 'Tensión umbral', un: 'V', def: '2' }, { k: 'lambda', nom: 'Modulación de canal λ', un: '1/V', def: '0' }], dib: () => S('M0 0H14M14 -12V12M22 -16V-8M22 -4V4M22 8V16M22 -12H40V-40M22 12H40V40M22 0H40') + S('M34 0L28 -4M34 0L28 4'), alto: 2, mostrar: (v) => `V<sub>th</sub> = ${v.Vth} V`, ancho: 2, motor: 'MOS' },
    PMOS: { nombre: 'MOSFET de canal P', fam: 'Semiconductores', letra: 'M', pines: [[2, -2], [0, 0], [2, 2]], campos: [{ k: 'k', nom: 'Parámetro k = μCox·W/L', un: 'A/V²', def: '2m', base: 1 }, { k: 'Vth', nom: 'Tensión umbral (positiva)', un: 'V', def: '2' }, { k: 'lambda', nom: 'Modulación de canal λ', un: '1/V', def: '0' }], dib: () => S('M0 0H14M14 -12V12M22 -16V-8M22 -4V4M22 8V16M22 -12H40V-40M22 12H40V40M22 0H40') + S('M26 0L32 -4M26 0L32 4'), alto: 2, pmos: true, mostrar: (v) => `V<sub>th</sub> = ${v.Vth} V`, ancho: 2, motor: 'MOS' },
    /* Amplificadores */
    AO: { nombre: 'Amplificador operacional ideal', fam: 'Amplificadores', letra: 'A', pines: [[0, 1], [0, -1], [4, 0]], campos: [], dib: () => S('M0 -20H20M0 20H20M80 0H60') + S('M20 -40V40L80 0Z') + T(28, -15, '−', 'peq') + T(28, 25, '+', 'peq'), alto: 2, etq: [50, -44] },
    AOR: { nombre: 'Amplificador operacional real', fam: 'Amplificadores', letra: 'A', pines: [[0, 1], [0, -1], [4, 0]], campos: [{ k: 'A', nom: 'Ganancia en lazo abierto', def: '1e5' }, { k: 'Vsat', nom: 'Saturación (± tensión de alimentación)', un: 'V', def: '12' }], dib: () => S('M0 -20H20M0 20H20M80 0H60') + S('M20 -40V40L80 0Z') + T(28, -15, '−', 'peq') + T(28, 25, '+', 'peq'), alto: 2, etq: [50, -44], mostrar: (v) => `±${v.Vsat} V`, motor: 'AOR' },
    COMP: { nombre: 'Comparador', fam: 'Amplificadores', letra: 'U', pines: [[0, 1], [0, -1], [4, 0]], campos: [{ k: 'Vsat', nom: 'Tensión de salida alta', un: 'V', def: '5' }], dib: () => S('M0 -20H20M0 20H20M80 0H60') + S('M20 -40V40L80 0Z') + T(28, -15, '−', 'peq') + T(28, 25, '+', 'peq'), alto: 2, etq: [50, -44], mostrar: (v) => `±${v.Vsat} V` },
    /* Instrumentos */
    VM: { nombre: 'Voltímetro', fam: 'Instrumentos', letra: 'VM', pines: [[0, 0], [4, 0]], campos: [], dib: () => S('M0 0H24M56 0H80') + CIRC() + T(40, 5, 'V', 'grande'), medida: 'V' },
    AM: { nombre: 'Amperímetro', fam: 'Instrumentos', letra: 'AM', pines: [[0, 0], [4, 0]], campos: [], dib: () => S('M0 0H24M56 0H80') + CIRC() + T(40, 5, 'A', 'grande'), medida: 'I' },
    WM: { nombre: 'Vatímetro', fam: 'Instrumentos', letra: 'W', pines: [[0, 0], [4, 0], [1, 2], [3, 2]], campos: [], dib: () => S('M0 0H24M56 0H80') + CIRC() + T(40, 5, 'W', 'grande') + `<path class="ctrl" d="M28 12L20 40M52 12L60 40"/>`, alto: 2, medida: 'P' },
    SONDA: { nombre: 'Sonda del osciloscopio', fam: 'Instrumentos', letra: 'CH', pines: [[0, 0]], campos: [{ k: 'canal', nom: 'Canal', op: ['1', '2', '3', '4'], def: '1' }], dib: (c) => S('M0 0V-18') + `<circle cx="0" cy="0" r="5" class="sonda c${c.v.canal || 1}"/>` + T(0, -22, 'CH' + (c.v.canal || 1), 'peq'), ancho: 0, alto: 1, etq: [34, 10], sonda: true },
    /* Trifásica */
    FT: { nombre: 'Fuente trifásica en estrella', fam: 'Trifásica', letra: 'G', pines: [[0, -1], [0, 0], [0, 1], [2, 3]], campos: [{ k: 'Vf', nom: 'Tensión de fase (eficaz)', un: 'V', def: '230' }, { k: 'f', nom: 'Frecuencia', un: 'Hz', def: '50' }], dib: () => caja3(0, true, '3~ Y') + S('M40 60V70'), ancho: 4, alto: 2, etq: [40, -38], mostrar: (v) => `${v.Vf} V` },
    FTD: { nombre: 'Fuente trifásica en triángulo', fam: 'Trifásica', letra: 'G', pines: [[0, -1], [0, 0], [0, 1]], campos: [{ k: 'VL', nom: 'Tensión de línea (eficaz)', un: 'V', def: '400' }, { k: 'f', nom: 'Frecuencia', un: 'Hz', def: '50' }], dib: () => caja3(0, false, '3~ Δ'), ancho: 4, alto: 2, etq: [40, -38], mostrar: (v) => `${v.VL} V` },
    CT: { nombre: 'Carga trifásica en estrella', fam: 'Trifásica', letra: 'K', pines: [[0, -1], [0, 0], [0, 1], [2, 3]], campos: [{ k: 'R', nom: 'Resistencia por fase', un: 'Ω', def: '10' }, { k: 'L', nom: 'Inductancia por fase', un: 'mH', def: '0', base: 1e-3 }], dib: () => caja3(0, true, 'Carga Y') + S('M40 60V70'), ancho: 4, alto: 2, etq: [40, -38], mostrar: (v) => `${v.R} Ω` },
    CTD: { nombre: 'Carga trifásica en triángulo', fam: 'Trifásica', letra: 'K', pines: [[0, -1], [0, 0], [0, 1]], campos: [{ k: 'R', nom: 'Resistencia por fase', un: 'Ω', def: '30' }, { k: 'L', nom: 'Inductancia por fase', un: 'mH', def: '0', base: 1e-3 }], dib: () => caja3(0, false, 'Carga Δ'), ancho: 4, alto: 2, etq: [40, -38], mostrar: (v) => `${v.R} Ω` },
    /* Lógica */
    NOT: { nombre: 'Puerta NOT', fam: 'Lógica', letra: 'U', pines: [[0, 0], [4, 0]], campos: [{ k: 'Vcc', nom: 'Tensión de alimentación', un: 'V', def: '5' }], dib: () => S('M0 0H20M77 0H80') + S('M20 -16V16L60 0Z') + '<circle cx="64" cy="0" r="4"/>' + S('M68 0H80'), fn: 'NOT' },
    AND: puerta('Puerta AND', AND, false, 'AND'), NAND: puerta('Puerta NAND', AND, true, 'NAND'),
    OR: puerta('Puerta OR', OR, false, 'OR'), NOR: puerta('Puerta NOR', OR, true, 'NOR'),
    XOR: puerta('Puerta XOR', XOR, false, 'XOR'), XNOR: puerta('Puerta XNOR', XOR, true, 'XNOR'),
  };
  for (const [t, d] of Object.entries(C)) { d.ancho ??= 4; d.alto ??= 1; d.campos ??= []; d.fn && (d.fn = d.fn); }
  const FAMILIAS = ['Pasivos', 'Fuentes', 'Dependientes', 'Conmutación', 'Magnéticos', 'Semiconductores', 'Amplificadores', 'Instrumentos', 'Trifásica', 'Lógica'];
  // valores iniciales para un componente de ese tipo
  const vacio = (t) => Object.fromEntries((C[t].campos || []).map((f) => [f.k, f.def ?? '']));
  return { C, FAMILIAS, vacio, FORMAS };
})();
if (typeof module !== 'undefined') module.exports = CompSim;
