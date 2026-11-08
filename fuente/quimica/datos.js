/* =====================================================================
   Datos químicos comunes (QU-1): todo valor numérico de tabla que usan las herramientas de Química,
   en un solo sitio y con su fuente, para revisarlo y comprobarlo de una vez (pruebas/herramientas/datos.js
   cuando existe, y las pruebas de cada herramienta). Las herramientas lo leen; no copian tablas.
     TERMO       { 'H2O(l)': [ΔHf° kJ/mol, S° J/(mol·K), ΔGf° kJ/mol] } a 298,15 K y 1 bar
     KPS         [clave, catión, anión, a, b, Kps, nombre del anión conjugado o ''] a 25 °C
     ACIDOS_ANION  pKa sucesivos del ácido conjugado de cada anión (efecto del pH en la solubilidad)
     COMPLEJOS   constantes de formación globales βn (log) de complejos con NH3, OH⁻ y Cl⁻/CN⁻
     INDICADORES [nombre, pH inicial, pH final, color ácido, color básico]
     POTENCIALES semirreacciones de reducción con E° (V, 25 °C, pH según el medio de la propia semirreacción)
     BORN        datos del ciclo de Born-Haber (metales y no metales) y entalpías de formación de sales
   Fuentes: CRC Handbook of Chemistry and Physics (tablas «Standard Thermodynamic Properties of Chemical
   Substances», «Solubility Product Constants», «Electrochemical Series»), NBS (Wagman et al., 1982) y
   tablas de clase habituales (Atkins, Chang, Harris). Los valores son los de uso común en un curso; cuando
   dos tablas difieren en la tercera cifra, se ha dejado el más extendido. La fuente va en cada bloque (FUENTES).
   Constantes: R, F, T° estándar y masas «de clase» más abajo.
   ===================================================================== */
const Datos = (() => {
  const FUENTES = {
    termo: 'CRC Handbook (Standard Thermodynamic Properties of Chemical Substances) y NBS, Wagman et al. 1982; 298,15 K y 1 bar',
    kps: 'CRC Handbook (Solubility Product Constants) y Harris, Quantitative Chemical Analysis; 25 °C, sin actividades',
    potenciales: 'CRC Handbook (Electrochemical Series), Atkins y Chang; 25 °C, 1 M y 1 bar',
    indicadores: 'Intervalos de viraje de tablas habituales (Harris, Skoog)',
    complejos: 'CRC Handbook (Stability Constants) y Harris; 25 °C',
    born: 'CRC Handbook (Atomic, Molecular, and Optical Physics; Heat of Sublimation; Electron Affinities) y Atkins',
  };
  const R = 8.314462618, F = 96485.33212, T0 = 298.15, RATM = 0.082057366, RCLASE = 0.082, FCLASE = 96500;

  /* ---------- Termodinámica: ΔHf°, S° y ΔGf° ---------- */
  const TERMO = {
    'H2(g)': [0, 130.7, 0], 'O2(g)': [0, 205.1, 0], 'N2(g)': [0, 191.6, 0], 'Cl2(g)': [0, 223.1, 0], 'F2(g)': [0, 202.8, 0], 'Br2(l)': [0, 152.2, 0],
    'I2(s)': [0, 116.1, 0], 'C(s)': [0, 5.7, 0], 'S(s)': [0, 32.1, 0], 'Na(s)': [0, 51.3, 0], 'K(s)': [0, 64.7, 0], 'Ca(s)': [0, 41.6, 0],
    'Mg(s)': [0, 32.7, 0], 'Al(s)': [0, 28.3, 0], 'Fe(s)': [0, 27.3, 0], 'Cu(s)': [0, 33.2, 0], 'Zn(s)': [0, 41.6, 0], 'Ag(s)': [0, 42.6, 0],
    'P(s)': [0, 41.1, 0], 'Si(s)': [0, 18.8, 0],
    'H2O(l)': [-285.8, 69.9, -237.1], 'H2O(g)': [-241.8, 188.8, -228.6], 'H2O2(l)': [-187.8, 109.6, -120.4], 'O3(g)': [142.7, 238.9, 163.2],
    'CO(g)': [-110.5, 197.7, -137.2], 'CO2(g)': [-393.5, 213.8, -394.4], 'CH4(g)': [-74.8, 186.3, -50.5], 'C2H6(g)': [-84.7, 229.6, -32.0],
    'C3H8(g)': [-103.8, 270.3, -23.4], 'C4H10(g)': [-125.7, 310.2, -15.7], 'C2H4(g)': [52.3, 219.6, 68.4], 'C2H2(g)': [226.7, 200.9, 209.9],
    'C6H6(l)': [49.0, 173.4, 124.5], 'CH3OH(l)': [-238.6, 126.8, -166.6], 'C2H5OH(l)': [-277.7, 160.7, -174.8], 'C6H12O6(s)': [-1273.3, 212.1, -910.4],
    'C8H18(l)': [-250.0, 361.1, 6.4],
    'NH3(g)': [-46.1, 192.8, -16.4], 'NO(g)': [90.3, 210.8, 86.6], 'NO2(g)': [33.2, 240.1, 51.3], 'N2O(g)': [82.1, 220.0, 104.2], 'N2O4(g)': [9.2, 304.4, 97.9],
    'HNO3(l)': [-174.1, 155.6, -80.7],
    'SO2(g)': [-296.8, 248.2, -300.1], 'SO3(g)': [-395.7, 256.8, -371.1], 'H2S(g)': [-20.6, 205.8, -33.4], 'H2SO4(l)': [-814.0, 156.9, -690.0],
    'HCl(g)': [-92.3, 186.9, -95.3], 'HF(g)': [-273.3, 173.8, -275.4], 'HBr(g)': [-36.3, 198.7, -53.4], 'HI(g)': [26.5, 206.6, 1.7],
    'NaCl(s)': [-411.2, 72.1, -384.1], 'NaOH(s)': [-425.6, 64.5, -379.5], 'CaO(s)': [-635.1, 38.1, -604.0], 'CaCO3(s)': [-1206.9, 91.7, -1128.8],
    'Ca(OH)2(s)': [-986.1, 83.4, -898.5], 'MgO(s)': [-601.6, 26.9, -569.3], 'Fe2O3(s)': [-824.2, 87.4, -742.2], 'Fe3O4(s)': [-1118.4, 146.4, -1015.4],
    'Al2O3(s)': [-1675.7, 50.9, -1582.3], 'CuO(s)': [-157.3, 42.6, -129.7], 'ZnO(s)': [-348.3, 43.6, -318.3], 'SiO2(s)': [-910.7, 41.8, -856.3],
  };
  // S° de los elementos en su estado estándar, para comprobar ΔGf° = ΔHf° − T·ΔSf° de cada compuesto
  const ELEMENTOS_ESTANDAR = { H: 'H2(g)', O: 'O2(g)', N: 'N2(g)', Cl: 'Cl2(g)', F: 'F2(g)', Br: 'Br2(l)', I: 'I2(s)', C: 'C(s)', S: 'S(s)', Na: 'Na(s)', K: 'K(s)', Ca: 'Ca(s)', Mg: 'Mg(s)', Al: 'Al(s)', Fe: 'Fe(s)', Cu: 'Cu(s)', Zn: 'Zn(s)', Ag: 'Ag(s)', P: 'P(s)', Si: 'Si(s)' };
  const ATOMOS_POR_MOLECULA = { 'H2(g)': 2, 'O2(g)': 2, 'N2(g)': 2, 'Cl2(g)': 2, 'F2(g)': 2, 'Br2(l)': 2, 'I2(s)': 2 };

  /* ---------- Productos de solubilidad ---------- */
  // [clave, catión, anión, a, b, Kps, ácido conjugado del anión (clave de ACIDOS_ANION) o '']
  const KPS = [
    ['AgCl', 'Ag+', 'Cl-', 1, 1, 1.8e-10, ''], ['AgBr', 'Ag+', 'Br-', 1, 1, 5.0e-13, ''], ['AgI', 'Ag+', 'I-', 1, 1, 8.5e-17, ''], ['AgSCN', 'Ag+', 'SCN-', 1, 1, 1.0e-12, ''],
    ['CuCl', 'Cu+', 'Cl-', 1, 1, 1.7e-7, ''], ['CuI', 'Cu+', 'I-', 1, 1, 1.3e-12, ''], ['Hg2Cl2', 'Hg2^2+', 'Cl-', 1, 2, 1.4e-18, ''],
    ['PbCl2', 'Pb2+', 'Cl-', 1, 2, 1.7e-5, ''], ['PbBr2', 'Pb2+', 'Br-', 1, 2, 6.6e-6, ''], ['PbI2', 'Pb2+', 'I-', 1, 2, 9.8e-9, ''],
    ['CaF2', 'Ca2+', 'F-', 1, 2, 3.9e-11, 'F'], ['MgF2', 'Mg2+', 'F-', 1, 2, 5.2e-11, 'F'], ['BaF2', 'Ba2+', 'F-', 1, 2, 1.8e-7, 'F'], ['PbF2', 'Pb2+', 'F-', 1, 2, 3.3e-8, 'F'],
    ['BaSO4', 'Ba2+', 'SO4^2-', 1, 1, 1.1e-10, 'SO4'], ['SrSO4', 'Sr2+', 'SO4^2-', 1, 1, 3.4e-7, 'SO4'], ['CaSO4', 'Ca2+', 'SO4^2-', 1, 1, 4.9e-5, 'SO4'],
    ['PbSO4', 'Pb2+', 'SO4^2-', 1, 1, 1.6e-8, 'SO4'], ['Ag2SO4', 'Ag+', 'SO4^2-', 2, 1, 1.2e-5, 'SO4'],
    ['CaCO3', 'Ca2+', 'CO3^2-', 1, 1, 3.4e-9, 'CO3'], ['MgCO3', 'Mg2+', 'CO3^2-', 1, 1, 6.8e-6, 'CO3'], ['BaCO3', 'Ba2+', 'CO3^2-', 1, 1, 2.6e-9, 'CO3'],
    ['SrCO3', 'Sr2+', 'CO3^2-', 1, 1, 5.6e-10, 'CO3'], ['ZnCO3', 'Zn2+', 'CO3^2-', 1, 1, 1.5e-10, 'CO3'], ['PbCO3', 'Pb2+', 'CO3^2-', 1, 1, 7.4e-14, 'CO3'],
    ['FeCO3', 'Fe2+', 'CO3^2-', 1, 1, 3.1e-11, 'CO3'], ['Ag2CO3', 'Ag+', 'CO3^2-', 2, 1, 8.5e-12, 'CO3'],
    ['Ag2CrO4', 'Ag+', 'CrO4^2-', 2, 1, 1.1e-12, 'CrO4'], ['BaCrO4', 'Ba2+', 'CrO4^2-', 1, 1, 1.2e-10, 'CrO4'], ['PbCrO4', 'Pb2+', 'CrO4^2-', 1, 1, 2.8e-13, 'CrO4'],
    ['CaC2O4', 'Ca2+', 'C2O4^2-', 1, 1, 2.3e-9, 'C2O4'],
    ['Ca3(PO4)2', 'Ca2+', 'PO4^3-', 3, 2, 2.1e-33, 'PO4'], ['Ag3PO4', 'Ag+', 'PO4^3-', 3, 1, 8.9e-17, 'PO4'],
    ['Mg(OH)2', 'Mg2+', 'OH-', 1, 2, 1.8e-11, 'OH'], ['Ca(OH)2', 'Ca2+', 'OH-', 1, 2, 5.5e-6, 'OH'], ['Al(OH)3', 'Al3+', 'OH-', 1, 3, 3e-34, 'OH'],
    ['Fe(OH)3', 'Fe3+', 'OH-', 1, 3, 4e-38, 'OH'], ['Fe(OH)2', 'Fe2+', 'OH-', 1, 2, 4.9e-17, 'OH'], ['Zn(OH)2', 'Zn2+', 'OH-', 1, 2, 3e-17, 'OH'],
    ['Cu(OH)2', 'Cu2+', 'OH-', 1, 2, 2.2e-20, 'OH'], ['Ni(OH)2', 'Ni2+', 'OH-', 1, 2, 5.5e-16, 'OH'], ['Mn(OH)2', 'Mn2+', 'OH-', 1, 2, 1.9e-13, 'OH'],
    ['Pb(OH)2', 'Pb2+', 'OH-', 1, 2, 1.4e-20, 'OH'], ['Cr(OH)3', 'Cr3+', 'OH-', 1, 3, 6.3e-31, 'OH'], ['Co(OH)2', 'Co2+', 'OH-', 1, 2, 5.9e-15, 'OH'],
    ['Cd(OH)2', 'Cd2+', 'OH-', 1, 2, 7.2e-15, 'OH'],
    ['ZnS', 'Zn2+', 'S^2-', 1, 1, 1.6e-24, 'S'], ['CuS', 'Cu2+', 'S^2-', 1, 1, 6.3e-36, 'S'], ['PbS', 'Pb2+', 'S^2-', 1, 1, 8e-28, 'S'],
    ['CdS', 'Cd2+', 'S^2-', 1, 1, 8e-27, 'S'], ['FeS', 'Fe2+', 'S^2-', 1, 1, 6.3e-18, 'S'], ['Ag2S', 'Ag+', 'S^2-', 2, 1, 6.3e-50, 'S'],
  ];
  // pKa sucesivos (del más ácido al menos) del ácido conjugado del anión: OH⁻ ↔ H2O no tiene (se usa pOH directo)
  const ACIDOS_ANION = { F: [3.17], SO4: [1.99], CO3: [6.35, 10.33], CrO4: [6.49], C2O4: [1.25, 4.27], PO4: [2.15, 7.20, 12.35], S: [7.0, 13.0], OH: [] };
  // logβ globales de los complejos más habituales: [ligando, [logβ1, logβ2, …]] por catión
  const COMPLEJOS = {
    'Ag+': { NH3: [3.32, 7.23], S2O3: [8.82, 13.46] },
    'Cu2+': { NH3: [4.04, 7.47, 10.27, 11.75], OH: [6.3, 12.8] },
    'Zn2+': { NH3: [2.37, 4.81, 7.31, 9.46], OH: [5.0, 11.1, 13.6, 14.8] },
    'Pb2+': { OH: [6.3, 10.9, 13.9] },
    'Al3+': { OH: [9.0, 17.9, 26.0, 33.0] },
    'Ni2+': { NH3: [2.75, 4.95, 6.64, 7.79, 8.50, 8.49] },
  };

  /* ---------- Indicadores ácido-base ---------- */
  const INDICADORES = [
    ['azul de timol (ácido)', 1.2, 2.8, 'rojo', 'amarillo'], ['naranja de metilo', 3.1, 4.4, 'rojo', 'amarillo'], ['verde de bromocresol', 3.8, 5.4, 'amarillo', 'azul'],
    ['rojo de metilo', 4.2, 6.3, 'rojo', 'amarillo'], ['púrpura de bromocresol', 5.2, 6.8, 'amarillo', 'púrpura'], ['azul de bromotimol', 6.0, 7.6, 'amarillo', 'azul'],
    ['rojo de fenol', 6.8, 8.4, 'amarillo', 'rojo'], ['rojo de cresol', 7.2, 8.8, 'amarillo', 'rojo-púrpura'], ['azul de timol (básico)', 8.0, 9.6, 'amarillo', 'azul'],
    ['fenolftaleína', 8.2, 10.0, 'incoloro', 'rosa'], ['timolftaleína', 9.3, 10.5, 'incoloro', 'azul'], ['amarillo de alizarina R', 10.1, 12.0, 'amarillo', 'rojo'],
  ];

  /* ---------- Potenciales estándar de reducción ---------- */
  // { id, ox: [[coef, especie, fase]], red: [[…]], H: protones del lado oxidado (H⁺ si ácido), n, E, medio }
  // Las especies llevan la fase: aq (disuelta), s, l, g. El agua y el medio se escriben como especies para que el cociente Q salga solo.
  const S = (coef, esp, fase = 'aq') => [coef, esp, fase];
  const POTENCIALES = [
    { id: 'F2', ox: [S(1, 'F2', 'g')], red: [S(2, 'F-')], n: 2, E: 2.87, medio: 'neutro' },
    { id: 'Co3+', ox: [S(1, 'Co^3+')], red: [S(1, 'Co^2+')], n: 1, E: 1.92, medio: 'neutro' },
    { id: 'H2O2-ac', ox: [S(1, 'H2O2'), S(2, 'H+')], red: [S(2, 'H2O', 'l')], n: 2, E: 1.78, medio: 'ácido' },
    { id: 'MnO4-ac', ox: [S(1, 'MnO4-'), S(8, 'H+')], red: [S(1, 'Mn^2+'), S(4, 'H2O', 'l')], n: 5, E: 1.51, medio: 'ácido' },
    { id: 'Au3+', ox: [S(1, 'Au^3+')], red: [S(1, 'Au', 's')], n: 3, E: 1.50, medio: 'neutro' },
    { id: 'PbO2', ox: [S(1, 'PbO2', 's'), S(4, 'H+')], red: [S(1, 'Pb^2+'), S(2, 'H2O', 'l')], n: 2, E: 1.46, medio: 'ácido' },
    { id: 'Cl2', ox: [S(1, 'Cl2', 'g')], red: [S(2, 'Cl-')], n: 2, E: 1.36, medio: 'neutro' },
    { id: 'Cr2O7', ox: [S(1, 'Cr2O7^2-'), S(14, 'H+')], red: [S(2, 'Cr^3+'), S(7, 'H2O', 'l')], n: 6, E: 1.33, medio: 'ácido' },
    { id: 'O2-ac', ox: [S(1, 'O2', 'g'), S(4, 'H+')], red: [S(2, 'H2O', 'l')], n: 4, E: 1.23, medio: 'ácido' },
    { id: 'MnO2', ox: [S(1, 'MnO2', 's'), S(4, 'H+')], red: [S(1, 'Mn^2+'), S(2, 'H2O', 'l')], n: 2, E: 1.22, medio: 'ácido' },
    { id: 'Br2', ox: [S(1, 'Br2', 'l')], red: [S(2, 'Br-')], n: 2, E: 1.07, medio: 'neutro' },
    { id: 'NO3-NO', ox: [S(1, 'NO3-'), S(4, 'H+')], red: [S(1, 'NO', 'g'), S(2, 'H2O', 'l')], n: 3, E: 0.96, medio: 'ácido' },
    { id: 'Hg2+', ox: [S(1, 'Hg^2+')], red: [S(1, 'Hg', 'l')], n: 2, E: 0.85, medio: 'neutro' },
    { id: 'Ag+', ox: [S(1, 'Ag+')], red: [S(1, 'Ag', 's')], n: 1, E: 0.80, medio: 'neutro' },
    { id: 'NO3-NO2', ox: [S(1, 'NO3-'), S(2, 'H+')], red: [S(1, 'NO2', 'g'), S(1, 'H2O', 'l')], n: 1, E: 0.80, medio: 'ácido' },
    { id: 'Fe3+', ox: [S(1, 'Fe^3+')], red: [S(1, 'Fe^2+')], n: 1, E: 0.77, medio: 'neutro' },
    { id: 'O2-H2O2', ox: [S(1, 'O2', 'g'), S(2, 'H+')], red: [S(1, 'H2O2')], n: 2, E: 0.70, medio: 'ácido' },
    { id: 'MnO4-neutro', ox: [S(1, 'MnO4-'), S(2, 'H2O', 'l')], red: [S(1, 'MnO2', 's'), S(4, 'OH-')], n: 3, E: 0.59, medio: 'básico' },
    { id: 'I2', ox: [S(1, 'I2', 's')], red: [S(2, 'I-')], n: 2, E: 0.54, medio: 'neutro' },
    { id: 'Cu+', ox: [S(1, 'Cu+')], red: [S(1, 'Cu', 's')], n: 1, E: 0.52, medio: 'neutro' },
    { id: 'O2-bas', ox: [S(1, 'O2', 'g'), S(2, 'H2O', 'l')], red: [S(4, 'OH-')], n: 4, E: 0.40, medio: 'básico' },
    { id: 'Cu2+', ox: [S(1, 'Cu^2+')], red: [S(1, 'Cu', 's')], n: 2, E: 0.34, medio: 'neutro' },
    { id: 'AgCl', ox: [S(1, 'AgCl', 's')], red: [S(1, 'Ag', 's'), S(1, 'Cl-')], n: 1, E: 0.22, medio: 'neutro' },
    { id: 'Cu2+/Cu+', ox: [S(1, 'Cu^2+')], red: [S(1, 'Cu+')], n: 1, E: 0.16, medio: 'neutro' },
    { id: 'Sn4+', ox: [S(1, 'Sn^4+')], red: [S(1, 'Sn^2+')], n: 2, E: 0.15, medio: 'neutro' },
    { id: 'H+', ox: [S(2, 'H+')], red: [S(1, 'H2', 'g')], n: 2, E: 0.00, medio: 'ácido' },
    { id: 'Pb2+', ox: [S(1, 'Pb^2+')], red: [S(1, 'Pb', 's')], n: 2, E: -0.13, medio: 'neutro' },
    { id: 'Sn2+', ox: [S(1, 'Sn^2+')], red: [S(1, 'Sn', 's')], n: 2, E: -0.14, medio: 'neutro' },
    { id: 'Ni2+', ox: [S(1, 'Ni^2+')], red: [S(1, 'Ni', 's')], n: 2, E: -0.26, medio: 'neutro' },
    { id: 'Co2+', ox: [S(1, 'Co^2+')], red: [S(1, 'Co', 's')], n: 2, E: -0.28, medio: 'neutro' },
    { id: 'Cd2+', ox: [S(1, 'Cd^2+')], red: [S(1, 'Cd', 's')], n: 2, E: -0.40, medio: 'neutro' },
    { id: 'Fe2+', ox: [S(1, 'Fe^2+')], red: [S(1, 'Fe', 's')], n: 2, E: -0.44, medio: 'neutro' },
    { id: 'Cr3+', ox: [S(1, 'Cr^3+')], red: [S(1, 'Cr', 's')], n: 3, E: -0.74, medio: 'neutro' },
    { id: 'Zn2+', ox: [S(1, 'Zn^2+')], red: [S(1, 'Zn', 's')], n: 2, E: -0.76, medio: 'neutro' },
    { id: 'H2O', ox: [S(2, 'H2O', 'l')], red: [S(1, 'H2', 'g'), S(2, 'OH-')], n: 2, E: -0.83, medio: 'básico' },
    { id: 'Mn2+', ox: [S(1, 'Mn^2+')], red: [S(1, 'Mn', 's')], n: 2, E: -1.18, medio: 'neutro' },
    { id: 'Al3+', ox: [S(1, 'Al^3+')], red: [S(1, 'Al', 's')], n: 3, E: -1.66, medio: 'neutro' },
    { id: 'Mg2+', ox: [S(1, 'Mg^2+')], red: [S(1, 'Mg', 's')], n: 2, E: -2.37, medio: 'neutro' },
    { id: 'Na+', ox: [S(1, 'Na+')], red: [S(1, 'Na', 's')], n: 1, E: -2.71, medio: 'neutro' },
    { id: 'Ca2+', ox: [S(1, 'Ca^2+')], red: [S(1, 'Ca', 's')], n: 2, E: -2.87, medio: 'neutro' },
    { id: 'Ba2+', ox: [S(1, 'Ba^2+')], red: [S(1, 'Ba', 's')], n: 2, E: -2.91, medio: 'neutro' },
    { id: 'K+', ox: [S(1, 'K+')], red: [S(1, 'K', 's')], n: 1, E: -2.93, medio: 'neutro' },
    { id: 'Li+', ox: [S(1, 'Li+')], red: [S(1, 'Li', 's')], n: 1, E: -3.04, medio: 'neutro' },
  ];

  /* ---------- Born-Haber ---------- */
  // metales: ΔH de sublimación (kJ/mol), 1.ª, 2.ª y 3.ª energía de ionización (kJ/mol)
  const METALES = {
    Li: { sub: 159.4, ei: [520.2] }, Na: { sub: 107.5, ei: [495.8] }, K: { sub: 89.0, ei: [418.8] }, Rb: { sub: 80.9, ei: [403.0] }, Cs: { sub: 76.5, ei: [375.7] },
    Mg: { sub: 147.1, ei: [737.7, 1450.7] }, Ca: { sub: 177.8, ei: [589.8, 1145.4] }, Sr: { sub: 164.4, ei: [549.5, 1064.2] }, Ba: { sub: 180.0, ei: [502.9, 965.2] },
    Al: { sub: 330.0, ei: [577.5, 1816.7, 2744.8] },
  };
  // no metales: ΔH de atomización del átomo (½ del enlace, kJ/mol de átomos) y afinidades electrónicas sucesivas (kJ/mol, positivas si se desprende energía)
  const NOMETALES = {
    F: { atom: 79.4, ae: [328.0] }, Cl: { atom: 121.3, ae: [349.0] }, Br: { atom: 111.9, ae: [324.6] }, I: { atom: 106.8, ae: [295.2] },
    O: { atom: 249.2, ae: [141.0, -744.0] }, S: { atom: 277.2, ae: [200.4, -532.0] },
  };
  // entalpía de formación de las sales (kJ/mol) y energía reticular termodinámica de referencia (kJ/mol, energía que se desprende al formarse el cristal)
  const SALES_BORN = {
    LiF: { hf: -616.0, ref: 1037 }, LiCl: { hf: -408.6, ref: 853 }, NaF: { hf: -573.6, ref: 923 }, NaCl: { hf: -411.2, ref: 787 }, NaBr: { hf: -361.1, ref: 747 },
    NaI: { hf: -287.8, ref: 704 }, KF: { hf: -567.3, ref: 821 }, KCl: { hf: -436.5, ref: 715 }, KBr: { hf: -393.8, ref: 682 }, KI: { hf: -327.9, ref: 649 },
    RbCl: { hf: -435.4, ref: 689 }, CsCl: { hf: -443.0, ref: 659 }, MgO: { hf: -601.6, ref: 3791 }, CaO: { hf: -635.1, ref: 3401 }, SrO: { hf: -592.0, ref: 3223 },
    BaO: { hf: -548.0, ref: 3054 }, MgCl2: { hf: -641.3, ref: 2526 }, CaF2: { hf: -1219.6, ref: 2630 }, CaCl2: { hf: -795.4, ref: 2258 }, MgF2: { hf: -1124.2, ref: 2957 },
    Na2O: { hf: -414.2, ref: 2481 }, K2O: { hf: -361.5, ref: 2238 }, Li2O: { hf: -597.9, ref: 2799 }, Na2S: { hf: -364.8, ref: 2203 },
  };

  /* ---------- Constantes y ajustes «de clase» ---------- */
  // masas redondeadas de uso en clase (Cl 35,5; Cu 63,5…), por símbolo
  const MASAS_CLASE = { H: 1, He: 4, Li: 7, C: 12, N: 14, O: 16, F: 19, Na: 23, Mg: 24, Al: 27, Si: 28, P: 31, S: 32, Cl: 35.5, K: 39, Ca: 40, Mn: 55, Fe: 56, Cu: 63.5, Zn: 65.4, Br: 80, Ag: 108, I: 127, Ba: 137, Pb: 207 };

  const lee = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  // ajuste común (QU-3): masas y constantes «de clase» o exactas; lo fija la herramienta que lo cambia
  const ajuste = () => ({ clase: lee('quimica-clase') === '1' });

  return { FUENTES, R, F, T0, RATM, RCLASE, FCLASE, TERMO, ELEMENTOS_ESTANDAR, ATOMOS_POR_MOLECULA, KPS, ACIDOS_ANION, COMPLEJOS, INDICADORES, POTENCIALES, METALES, NOMETALES, SALES_BORN, MASAS_CLASE, ajuste };
})();
if (typeof module !== 'undefined') module.exports = Datos;
