/* =====================================================================
   Conversor de unidades y constantes (sin DOM): pasa un valor entre las
   unidades de una magnitud (longitud, energía, campo magnético…) con el
   desarrollo paso a paso, y guarda la tabla de constantes CODATA (2022 y 2018).
   La interfaz está en app.js y la prueba en pruebas/herramientas/unidades.js.
     resolver(sc)   { mag, valor, de, a } (texto) → { v, res, base, filas, pasos, … };
                    lanza un Error con un mensaje para el usuario
     MAGNITUDES     { clave: { n, base, u: [{ s, n, f }] } }, f = factor a la unidad base del SI
                    (la temperatura lleva además aK y deK, funciones de y a kelvin)
     CONSTANTES     [{ n, s, d, e, u, x, b, v }]: nombre, símbolo (HTML), cifras, exponente,
                    unidad, incertidumbre («exacta» o «(15)»), palabras de búsqueda y valor
     busca(texto)   las constantes que casan con lo escrito
     ejemplos       [{ clave, nombre, sc }] para el desplegable y Mis ejercicios
     azar()         sc al azar para el modo práctica
   Convención: todos los factores salen del valor exacto de cada definición (1 in = 0,0254 m,
   1 cal = 4,184 J, 1 atm = 101 325 Pa = 760 mmHg…); el año es el juliano (365,25 días).
   ===================================================================== */
const Unidades = (() => {
  const SI = typeof Constantes !== 'undefined' ? Constantes.SI : require('../fisica/constantes.js').SI;
  const PI = Math.PI, E = SI.e, C = SI.c;
  // [símbolo, factor a la unidad base del SI, nombre]
  const U = (l) => l.map(([s, f, n]) => ({ s, f, n }));
  const MAGNITUDES = {
    longitud: { n: 'Longitud', base: 'm', u: U([['m', 1, 'metro'], ['km', 1e3, 'kilómetro'], ['cm', 1e-2, 'centímetro'], ['mm', 1e-3, 'milímetro'], ['µm', 1e-6, 'micrómetro'], ['nm', 1e-9, 'nanómetro'], ['Å', 1e-10, 'ángstrom'], ['pm', 1e-12, 'picómetro'], ['fm', 1e-15, 'femtómetro'], ['in', 0.0254, 'pulgada'], ['ft', 0.3048, 'pie'], ['yd', 0.9144, 'yarda'], ['mi', 1609.344, 'milla'], ['mn', 1852, 'milla náutica'], ['ua', 149597870700, 'unidad astronómica'], ['al', 9460730472580800, 'año luz'], ['pc', 149597870700 * 648000 / PI, 'pársec']]) },
    masa: { n: 'Masa', base: 'kg', u: U([['kg', 1, 'kilogramo'], ['g', 1e-3, 'gramo'], ['mg', 1e-6, 'miligramo'], ['µg', 1e-9, 'microgramo'], ['t', 1e3, 'tonelada'], ['lb', 0.45359237, 'libra'], ['oz', 0.028349523125, 'onza'], ['slug', 14.5939029372, 'slug'], ['u', 1.66053906660e-27, 'unidad de masa atómica'], ['MeV/c²', 1e6 * E / (C * C), 'megaelectronvoltio entre c²']]) },
    tiempo: { n: 'Tiempo', base: 's', u: U([['s', 1, 'segundo'], ['ms', 1e-3, 'milisegundo'], ['µs', 1e-6, 'microsegundo'], ['ns', 1e-9, 'nanosegundo'], ['ps', 1e-12, 'picosegundo'], ['min', 60, 'minuto'], ['h', 3600, 'hora'], ['d', 86400, 'día'], ['sem', 604800, 'semana'], ['a', 31557600, 'año (365,25 días)']]) },
    velocidad: { n: 'Velocidad', base: 'm/s', u: U([['m/s', 1, 'metro por segundo'], ['km/h', 1 / 3.6, 'kilómetro por hora'], ['cm/s', 1e-2, 'centímetro por segundo'], ['mph', 0.44704, 'milla por hora'], ['ft/s', 0.3048, 'pie por segundo'], ['kn', 1852 / 3600, 'nudo'], ['Mach', 343, 'Mach (343 m/s, aire a 20 °C)'], ['c', C, 'velocidad de la luz']]) },
    aceleracion: { n: 'Aceleración', base: 'm/s²', u: U([['m/s²', 1, 'metro por segundo al cuadrado'], ['g', 9.80665, 'gravedad estándar'], ['cm/s²', 1e-2, 'gal (centímetro por segundo al cuadrado)'], ['ft/s²', 0.3048, 'pie por segundo al cuadrado'], ['km/h/s', 1 / 3.6, 'kilómetro por hora y segundo']]) },
    area: { n: 'Área', base: 'm²', u: U([['m²', 1, 'metro cuadrado'], ['km²', 1e6, 'kilómetro cuadrado'], ['cm²', 1e-4, 'centímetro cuadrado'], ['mm²', 1e-6, 'milímetro cuadrado'], ['ha', 1e4, 'hectárea'], ['in²', 0.0254 ** 2, 'pulgada cuadrada'], ['ft²', 0.3048 ** 2, 'pie cuadrado'], ['acre', 4046.8564224, 'acre'], ['mi²', 1609.344 ** 2, 'milla cuadrada'], ['barn', 1e-28, 'barn']]) },
    volumen: { n: 'Volumen', base: 'm³', u: U([['m³', 1, 'metro cúbico'], ['L', 1e-3, 'litro'], ['mL', 1e-6, 'mililitro'], ['cm³', 1e-6, 'centímetro cúbico'], ['mm³', 1e-9, 'milímetro cúbico'], ['in³', 0.0254 ** 3, 'pulgada cúbica'], ['ft³', 0.3048 ** 3, 'pie cúbico'], ['gal', 3.785411784e-3, 'galón estadounidense'], ['gal imp', 4.54609e-3, 'galón imperial'], ['fl oz', 2.95735295625e-5, 'onza líquida estadounidense'], ['bbl', 0.158987294928, 'barril de petróleo']]) },
    densidad: { n: 'Densidad', base: 'kg/m³', u: U([['kg/m³', 1, 'kilogramo por metro cúbico'], ['g/cm³', 1e3, 'gramo por centímetro cúbico'], ['g/L', 1, 'gramo por litro'], ['kg/L', 1e3, 'kilogramo por litro'], ['lb/ft³', 0.45359237 / 0.3048 ** 3, 'libra por pie cúbico']]) },
    fuerza: { n: 'Fuerza', base: 'N', u: U([['N', 1, 'newton'], ['kN', 1e3, 'kilonewton'], ['dyn', 1e-5, 'dina'], ['kgf', 9.80665, 'kilogramo-fuerza'], ['lbf', 0.45359237 * 9.80665, 'libra-fuerza'], ['pdl', 0.45359237 * 0.3048, 'poundal']]) },
    presion: { n: 'Presión', base: 'Pa', u: U([['Pa', 1, 'pascal'], ['kPa', 1e3, 'kilopascal'], ['MPa', 1e6, 'megapascal'], ['bar', 1e5, 'bar'], ['mbar', 100, 'milibar'], ['atm', 101325, 'atmósfera'], ['mmHg', 101325 / 760, 'milímetro de mercurio (igual al torr)'], ['Torr', 101325 / 760, 'torr'], ['psi', 0.45359237 * 9.80665 / 0.0254 ** 2, 'libra por pulgada cuadrada'], ['kgf/cm²', 9.80665e4, 'kilogramo-fuerza por centímetro cuadrado']]) },
    energia: { n: 'Energía', base: 'J', u: U([['J', 1, 'julio'], ['kJ', 1e3, 'kilojulio'], ['MJ', 1e6, 'megajulio'], ['cal', 4.184, 'caloría'], ['kcal', 4184, 'kilocaloría'], ['Wh', 3600, 'vatio-hora'], ['kWh', 3.6e6, 'kilovatio-hora'], ['eV', E, 'electronvoltio'], ['keV', 1e3 * E, 'kiloelectronvoltio'], ['MeV', 1e6 * E, 'megaelectronvoltio'], ['erg', 1e-7, 'ergio'], ['BTU', 1055.05585262, 'unidad térmica británica'], ['ft·lbf', 0.3048 * 0.45359237 * 9.80665, 'pie-libra fuerza'], ['tep', 4.1868e10, 'tonelada equivalente de petróleo']]) },
    potencia: { n: 'Potencia', base: 'W', u: U([['W', 1, 'vatio'], ['mW', 1e-3, 'milivatio'], ['kW', 1e3, 'kilovatio'], ['MW', 1e6, 'megavatio'], ['CV', 735.49875, 'caballo de vapor'], ['hp', 745.69987158227, 'caballo de potencia (hp)'], ['BTU/h', 1055.05585262 / 3600, 'BTU por hora'], ['erg/s', 1e-7, 'ergio por segundo']]) },
    temperatura: { n: 'Temperatura', base: 'K', u: [
      { s: 'K', n: 'kelvin', aK: (x) => x, deK: (x) => x },
      { s: '°C', n: 'grado Celsius', aK: (x) => x + 273.15, deK: (x) => x - 273.15 },
      { s: '°F', n: 'grado Fahrenheit', aK: (x) => (x - 32) * 5 / 9 + 273.15, deK: (x) => (x - 273.15) * 9 / 5 + 32 },
      { s: '°R', n: 'grado Rankine', aK: (x) => x * 5 / 9, deK: (x) => x * 9 / 5 }] },
    angulo: { n: 'Ángulo', base: 'rad', u: U([['rad', 1, 'radián'], ['°', PI / 180, 'grado sexagesimal'], ['′', PI / 10800, 'minuto de arco'], ['″', PI / 648000, 'segundo de arco'], ['rev', 2 * PI, 'vuelta'], ['gon', PI / 200, 'gradián']]) },
    frecuencia: { n: 'Frecuencia', base: 'Hz', u: U([['Hz', 1, 'hercio'], ['kHz', 1e3, 'kilohercio'], ['MHz', 1e6, 'megahercio'], ['GHz', 1e9, 'gigahercio'], ['THz', 1e12, 'terahercio'], ['rpm', 1 / 60, 'revoluciones por minuto'], ['rad/s', 1 / (2 * PI), 'radián por segundo']]) },
    carga: { n: 'Carga eléctrica', base: 'C', u: U([['C', 1, 'culombio'], ['mC', 1e-3, 'miliculombio'], ['µC', 1e-6, 'microculombio'], ['nC', 1e-9, 'nanoculombio'], ['pC', 1e-12, 'picoculombio'], ['e', E, 'carga elemental'], ['A·h', 3600, 'amperio-hora'], ['mA·h', 3.6, 'miliamperio-hora'], ['Fr', 1e-1 / C, 'franklin (statculombio)']]) },
    corriente: { n: 'Intensidad de corriente', base: 'A', u: U([['A', 1, 'amperio'], ['mA', 1e-3, 'miliamperio'], ['µA', 1e-6, 'microamperio'], ['nA', 1e-9, 'nanoamperio'], ['kA', 1e3, 'kiloamperio']]) },
    tension: { n: 'Tensión eléctrica', base: 'V', u: U([['V', 1, 'voltio'], ['mV', 1e-3, 'milivoltio'], ['µV', 1e-6, 'microvoltio'], ['kV', 1e3, 'kilovoltio'], ['MV', 1e6, 'megavoltio']]) },
    resistencia: { n: 'Resistencia eléctrica', base: 'Ω', u: U([['Ω', 1, 'ohmio'], ['mΩ', 1e-3, 'miliohmio'], ['kΩ', 1e3, 'kiloohmio'], ['MΩ', 1e6, 'megaohmio'], ['GΩ', 1e9, 'gigaohmio']]) },
    capacidad: { n: 'Capacidad eléctrica', base: 'F', u: U([['F', 1, 'faradio'], ['mF', 1e-3, 'milifaradio'], ['µF', 1e-6, 'microfaradio'], ['nF', 1e-9, 'nanofaradio'], ['pF', 1e-12, 'picofaradio']]) },
    inductancia: { n: 'Inductancia', base: 'H', u: U([['H', 1, 'henrio'], ['mH', 1e-3, 'milihenrio'], ['µH', 1e-6, 'microhenrio'], ['nH', 1e-9, 'nanohenrio']]) },
    campoE: { n: 'Campo eléctrico', base: 'V/m', u: U([['V/m', 1, 'voltio por metro'], ['N/C', 1, 'newton por culombio'], ['kV/m', 1e3, 'kilovoltio por metro'], ['MV/m', 1e6, 'megavoltio por metro'], ['V/cm', 100, 'voltio por centímetro']]) },
    campoB: { n: 'Campo magnético', base: 'T', u: U([['T', 1, 'tesla'], ['mT', 1e-3, 'militesla'], ['µT', 1e-6, 'microtesla'], ['nT', 1e-9, 'nanotesla'], ['G', 1e-4, 'gauss'], ['mG', 1e-7, 'miligauss']]) },
    flujo: { n: 'Flujo magnético', base: 'Wb', u: U([['Wb', 1, 'weber'], ['mWb', 1e-3, 'miliweber'], ['µWb', 1e-6, 'microweber'], ['T·m²', 1, 'tesla por metro cuadrado'], ['Mx', 1e-8, 'maxwell']]) },
  };

  /* ---------- Lectura y formato ---------- */
  // número de un campo: coma o punto, 3e8, 3·10^8 (sin prefijos ni unidades: «5m» no es milímetro)
  const lee = (s) => {
    const t = String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?\(?([+\-]?\d+)\)?/i, 'e$1');
    return /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t) ? +t : NaN;
  };
  const cifras = (x) => { const [m, e] = x.toExponential(9).split('e'); return [m.includes('.') ? m.replace(/0+$/, '').replace(/\.$/, '') : m, +e]; };
  // n: texto para dentro de una fórmula $…$ (10^{n}); h: HTML con ·10<sup>n</sup>
  const forma = (x, exp) => {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    const neg = x < 0 ? '−' : '', a = Math.abs(x);
    if (a >= 1e9 || a < 1e-4) { const [m, e] = cifras(a); return neg + (m === '1' ? '' : m.replace('.', ',') + '·') + exp(e); }
    return neg + String(+a.toPrecision(10)).replace('.', ',');
  };
  const n = (x) => forma(x, (e) => `10^{${String(e).replace('-', '−')}}`);
  const h = (x) => forma(x, (e) => `10<sup>${String(e).replace('-', '−')}</sup>`);

  const unidad = (m, s) => MAGNITUDES[m].u.find((u) => u.s === s);
  const aBase = (x, u) => (u.aK ? u.aK(x) : x * u.f);
  const deBase = (x, u) => (u.deK ? u.deK(x) : x / u.f);
  const convertir = (v, mag, de, a) => deBase(aBase(v, unidad(mag, de)), unidad(mag, a));

  function resolver(sc) {
    const M = MAGNITUDES[sc.mag];
    if (!M) throw new Error('Elige una magnitud de la lista.');
    const ud = unidad(sc.mag, sc.de), ua = unidad(sc.mag, sc.a);
    if (!ud || !ua) throw new Error('Elige dos unidades de la lista.');
    const v = lee(sc.valor);
    if (isNaN(v)) throw new Error('Escribe un número válido, por ejemplo 3,5 o 3·10^8.');
    const temp = sc.mag === 'temperatura', vb = aBase(v, ud);
    if (temp && vb < -1e-9) throw new Error('Esa temperatura está por debajo del cero absoluto (0 K = −273,15 °C).');
    const res = deBase(vb, ua);
    const nom = (u) => `${u.n} ($"${u.s}"$)`;
    const pasos = [{ t: 'Qué se pide', html: `Pasar $${n(v)} "${ud.s}"$ (${ud.n}) a ${nom(ua)}${ud === ua ? ': es la misma unidad, el valor no cambia' : ''}.` }];
    if (ud !== ua) {
      if (temp) {
        const KF = { '°C': ['T_K = T_C + 273,15', 'T_C = T_K − 273,15'], '°F': ['T_K = (T_F − 32) · 5/9 + 273,15', 'T_F = (T_K − 273,15) · 9/5 + 32'], '°R': ['T_K = T_R · 5/9', 'T_R = T_K · 9/5'], K: ['', ''] };
        if (ud.s !== 'K') pasos.push({ t: 'A kelvin', html: `La escala absoluta es el kelvin, y ${ud.n} se pasa a kelvin con $${KF[ud.s][0]}$: $T_K = ${n(vb)} "K"$.` });
        if (ua.s !== 'K') pasos.push({ t: `De kelvin a ${ua.n}`, html: `$${KF[ua.s][1]}$: $${n(res)} "${ua.s}"$.` });
      } else {
        if (ud.f !== 1) pasos.push({ t: `A la unidad base del SI (${M.base})`, html: `Como $1 "${ud.s}" = ${n(ud.f)} "${M.base}"$: $${n(v)} "${ud.s}" · (${n(ud.f)} "${M.base}")/(1 "${ud.s}") = ${n(vb)} "${M.base}"$.` });
        if (ua.f !== 1) pasos.push({ t: `De ${M.base} a ${ua.s}`, html: `Como $1 "${ua.s}" = ${n(ua.f)} "${M.base}"$: $${n(vb)} "${M.base}" · (1 "${ua.s}")/(${n(ua.f)} "${M.base}") = ${n(res)} "${ua.s}"$.` });
        pasos.push({ t: 'Factor directo', html: `Juntando los dos pasos, $1 "${ud.s}" = ${n(ud.f / ua.f)} "${ua.s}"$ y $1 "${ua.s}" = ${n(ua.f / ud.f)} "${ud.s}"$.` });
      }
    }
    const filas = M.u.map((u) => ({ k: u.s, t: `${u.n} (${u.s})`, v: `${h(deBase(vb, u))} ${u.s}`, x: deBase(vb, u) }));
    const factor = temp || ud === ua ? null : `1 ${ud.s} = ${h(ud.f / ua.f)} ${ua.s}`;
    return { mag: sc.mag, v, res, vb, ud, ua, base: M.base, filas, pasos, factor, resH: `${h(res)} ${ua.s}` };
  }

  /* ---------- Constantes CODATA 2022 (por defecto) y 2018 ---------- */
  // La tabla de abajo es la de 2018; las constantes que no son exactas cambiaron en 2022 y están en N22 (las exactas por definición del SI no cambian).
  // [nombre, símbolo en HTML, cifras, exponente, unidad en HTML, incertidumbre, palabras de búsqueda]
  const T18 = [
    ['Velocidad de la luz en el vacío', 'c', '299 792 458', 0, 'm/s', 'exacta', 'luz vacio light'],
    ['Constante de Planck', 'h', '6,626 070 15', -34, 'J·s', 'exacta', 'planck cuanto'],
    ['Constante de Planck reducida', 'ħ', '1,054 571 817', -34, 'J·s', '(exacta por definición de h)', 'planck reducida hbar dirac'],
    ['Carga elemental', 'e', '1,602 176 634', -19, 'C', 'exacta', 'electron proton carga'],
    ['Constante de Boltzmann', 'k<sub>B</sub>', '1,380 649', -23, 'J/K', 'exacta', 'boltzmann'],
    ['Número de Avogadro', 'N<sub>A</sub>', '6,022 140 76', 23, 'mol<sup>−1</sup>', 'exacta', 'avogadro mol'],
    ['Constante de los gases ideales', 'R', '8,314 462 618', 0, 'J/(mol·K)', 'exacta', 'gases ideales'],
    ['Constante de Faraday', 'F', '96 485,332 12', 0, 'C/mol', 'exacta', 'faraday electrolisis'],
    ['Constante de Stefan-Boltzmann', 'σ', '5,670 374 419', -8, 'W/(m<sup>2</sup>·K<sup>4</sup>)', 'exacta', 'stefan boltzmann cuerpo negro radiacion'],
    ['Constante de desplazamiento de Wien', 'b', '2,897 771 955', -3, 'm·K', 'exacta', 'wien cuerpo negro'],
    ['Constante de gravitación universal', 'G', '6,674 30', -11, 'N·m<sup>2</sup>/kg<sup>2</sup>', '(15)', 'gravitacion newton'],
    ['Aceleración estándar de la gravedad', 'g<sub>n</sub>', '9,806 65', 0, 'm/s<sup>2</sup>', 'exacta (convenio)', 'gravedad tierra'],
    ['Atmósfera estándar', 'atm', '101 325', 0, 'Pa', 'exacta (convenio)', 'presion atmosferica'],
    ['Permitividad del vacío', 'ε<sub>0</sub>', '8,854 187 8128', -12, 'F/m', '(13)', 'epsilon permitividad electrica vacio'],
    ['Permeabilidad del vacío', 'μ<sub>0</sub>', '1,256 637 062 12', -6, 'N/A<sup>2</sup>', '(19)', 'mu permeabilidad magnetica vacio'],
    ['Constante de Coulomb', 'k<sub>e</sub> = 1/(4πε<sub>0</sub>)', '8,987 551 7923', 9, 'N·m<sup>2</sup>/C<sup>2</sup>', '(14)', 'coulomb electrostatica k'],
    ['Impedancia característica del vacío', 'Z<sub>0</sub>', '376,730 313 668', 0, 'Ω', '(57)', 'impedancia vacio ondas'],
    ['Cuanto de flujo magnético', 'Φ<sub>0</sub>', '2,067 833 848', -15, 'Wb', 'exacta', 'flujo magnetico superconductor'],
    ['Cuanto de conductancia', 'G<sub>0</sub>', '7,748 091 729', -5, 'S', 'exacta', 'conductancia'],
    ['Constante de von Klitzing', 'R<sub>K</sub>', '25 812,807 45', 0, 'Ω', 'exacta', 'klitzing hall'],
    ['Constante de Josephson', 'K<sub>J</sub>', '4,835 978 484', 14, 'Hz/V', 'exacta', 'josephson'],
    ['Magnetón de Bohr', 'μ<sub>B</sub>', '9,274 010 0783', -24, 'J/T', '(28)', 'bohr magneton momento magnetico'],
    ['Magnetón nuclear', 'μ<sub>N</sub>', '5,050 783 7461', -27, 'J/T', '(15)', 'nuclear magneton'],
    ['Masa del electrón', 'm<sub>e</sub>', '9,109 383 7015', -31, 'kg', '(28)', 'electron'],
    ['Masa del protón', 'm<sub>p</sub>', '1,672 621 923 69', -27, 'kg', '(51)', 'proton'],
    ['Masa del neutrón', 'm<sub>n</sub>', '1,674 927 498 04', -27, 'kg', '(95)', 'neutron'],
    ['Unidad de masa atómica', 'u', '1,660 539 066 60', -27, 'kg', '(50)', 'dalton uma'],
    ['Energía en reposo del electrón', 'm<sub>e</sub>c<sup>2</sup>', '0,510 998 950 00', 0, 'MeV', '(15)', 'electron masa energia'],
    ['Energía en reposo del protón', 'm<sub>p</sub>c<sup>2</sup>', '938,272 088 16', 0, 'MeV', '(29)', 'proton masa energia'],
    ['Radio de Bohr', 'a<sub>0</sub>', '5,291 772 109 03', -11, 'm', '(80)', 'bohr atomo hidrogeno'],
    ['Radio clásico del electrón', 'r<sub>e</sub>', '2,817 940 3262', -15, 'm', '(13)', 'electron thomson'],
    ['Longitud de onda Compton del electrón', 'λ<sub>C</sub>', '2,426 310 238 67', -12, 'm', '(73)', 'compton electron'],
    ['Constante de estructura fina', 'α', '7,297 352 5693', -3, '(sin unidad)', '(11)', 'sommerfeld alfa'],
    ['Constante de Rydberg', 'R<sub>∞</sub>', '1,097 373 156 8160', 7, 'm<sup>−1</sup>', '(21)', 'rydberg espectro hidrogeno'],
    ['Energía de Hartree', 'E<sub>h</sub>', '4,359 744 722 2071', -18, 'J', '(85)', 'hartree atomica'],
    ['Volumen molar de un gas ideal (273,15 K, 100 kPa)', 'V<sub>m</sub>', '22,710 954 64', -3, 'm<sup>3</sup>/mol', 'exacta', 'volumen molar gas'],
    ['Unidad astronómica', 'ua', '149 597 870 700', 0, 'm', 'exacta (UAI 2012)', 'distancia tierra sol'],
    ['Año luz', 'al', '9,460 730 472 5808', 15, 'm', 'exacta', 'ano luz'],
  ];
  // CODATA 2022 (Mohr, Newell, Taylor, Tiesinga, Rev. Mod. Phys. 2025; NIST SP 961): nombre → [cifras, exponente, incertidumbre en las últimas cifras]
  const N22 = {
    'Constante de gravitación universal': ['6,674 30', -11, '(15)'],
    'Permitividad del vacío': ['8,854 187 8188', -12, '(14)'],
    'Permeabilidad del vacío': ['1,256 637 061 27', -6, '(20)'],
    'Constante de Coulomb': ['8,987 551 7862', 9, '(14)'],
    'Impedancia característica del vacío': ['376,730 313 412', 0, '(59)'],
    'Magnetón de Bohr': ['9,274 010 0657', -24, '(29)'],
    'Magnetón nuclear': ['5,050 783 7393', -27, '(16)'],
    'Masa del electrón': ['9,109 383 7139', -31, '(28)'],
    'Masa del protón': ['1,672 621 925 95', -27, '(52)'],
    'Masa del neutrón': ['1,674 927 500 56', -27, '(85)'],
    'Unidad de masa atómica': ['1,660 539 068 92', -27, '(52)'],
    'Energía en reposo del electrón': ['0,510 998 950 69', 0, '(16)'],
    'Energía en reposo del protón': ['938,272 089 43', 0, '(29)'],
    'Radio de Bohr': ['5,291 772 105 44', -11, '(82)'],
    'Radio clásico del electrón': ['2,817 940 3205', -15, '(13)'],
    'Longitud de onda Compton del electrón': ['2,426 310 235 38', -12, '(76)'],
    'Constante de estructura fina': ['7,297 352 5643', -3, '(11)'],
    'Constante de Rydberg': ['1,097 373 156 8157', 7, '(12)'],
    'Energía de Hartree': ['4,359 744 722 2060', -18, '(48)'],
  };
  const T22 = T18.map(([nombre, s, d, e, u, x, b]) => (N22[nombre] ? [nombre, s, N22[nombre][0], N22[nombre][1], u, N22[nombre][2], b] : [nombre, s, d, e, u, x, b]));
  const aObjeto = (T) => T.map(([nombre, s, d, e, u, x, b]) => ({ n: nombre, s, d, e, u, x, b, v: +d.replace(/\s/g, '').replace(',', '.') * 10 ** e }));
  const EDICIONES = { 2022: aObjeto(T22), 2018: aObjeto(T18) };
  const CONSTANTES = EDICIONES[2022];
  const plano = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/<[^>]+>/g, '');
  const busca = (q, ed = 2022) => {
    const t = plano(q).trim(), L = EDICIONES[ed] || CONSTANTES;
    return t ? L.filter((c) => plano(`${c.n} ${c.s} ${c.b}`).includes(t)) : L;
  };

  const ejemplos = [
    { clave: 'milla', nombre: '5 millas en kilómetros', sc: { mag: 'longitud', valor: '5', de: 'mi', a: 'km' } },
    { clave: 'velocidad', nombre: '90 km/h en m/s', sc: { mag: 'velocidad', valor: '90', de: 'km/h', a: 'm/s' } },
    { clave: 'temperatura', nombre: '100 °F en °C', sc: { mag: 'temperatura', valor: '100', de: '°F', a: '°C' } },
    { clave: 'presion', nombre: '1 atm en mmHg', sc: { mag: 'presion', valor: '1', de: 'atm', a: 'mmHg' } },
    { clave: 'energia', nombre: '1 kWh en MJ', sc: { mag: 'energia', valor: '1', de: 'kWh', a: 'MJ' } },
    { clave: 'electronvoltio', nombre: '13,6 eV en julios', sc: { mag: 'energia', valor: '13,6', de: 'eV', a: 'J' } },
    { clave: 'campo-magnetico', nombre: '0,5 G en µT (campo terrestre)', sc: { mag: 'campoB', valor: '0,5', de: 'G', a: 'µT' } },
    { clave: 'capacidad', nombre: '4700 nF en µF', sc: { mag: 'capacidad', valor: '4700', de: 'nF', a: 'µF' } },
  ];

  // un ejercicio al azar para el modo práctica (magnitudes de uso corriente)
  const azar = () => {
    const mags = ['longitud', 'masa', 'tiempo', 'velocidad', 'presion', 'energia', 'potencia', 'temperatura', 'campoB', 'capacidad', 'tension', 'fuerza'];
    const r = (k) => Math.floor(Math.random() * k), mag = mags[r(mags.length)], L = MAGNITUDES[mag].u;
    const de = L[r(L.length)].s; let a = de; while (a === de) a = L[r(L.length)].s;
    const valor = String([1, 2, 2.5, 3, 4, 5, 7.5, 12, 20, 25, 50, 80, 150, 250][r(14)]).replace('.', ',');
    return { mag, valor, de, a };
  };

  return { resolver, convertir, MAGNITUDES, CONSTANTES, EDICIONES, busca, ejemplos, azar, lee, n, h };
})();
if (typeof module !== 'undefined') module.exports = Unidades;
