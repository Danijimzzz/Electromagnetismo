const Datos = (() => {
  const FUENTES = {
    termo: 'CRC Handbook (Standard Thermodynamic Properties of Chemical Substances) and NBS, Wagman et al. 1982; 298.15 K and 1 bar',
    kps: 'CRC Handbook (Solubility Product Constants) and Harris, Quantitative Chemical Analysis; 25 °C, without activities',
    potenciales: 'CRC Handbook (Electrochemical Series), Atkins and Chang; 25 °C, 1 M and 1 bar',
    indicadores: 'Transition ranges from common tables (Harris, Skoog)',
    complejos: 'CRC Handbook (Stability Constants) and Harris; 25 °C',
    solubilidadT: 'CRC Handbook (Aqueous Solubility of Inorganic Compounds at Various Temperatures) and Lange; g of anhydrous solute per 100 g of water every 20 °C',
    henry: 'Sander, R. (2015), Compilation of Henry\'s law constants, Atmos. Chem. Phys. 15, 4399; k at 298.15 K and d(ln k)/d(1/T) in K',
    born: 'CRC Handbook (Atomic, Molecular, and Optical Physics; Heat of Sublimation; Electron Affinities) and Atkins',
  };
  const R = 8.314462618, F = 96485.33212, T0 = 298.15, RATM = 0.082057366, RCLASE = 0.082, FCLASE = 96500;

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
  const ELEMENTOS_ESTANDAR = { H: 'H2(g)', O: 'O2(g)', N: 'N2(g)', Cl: 'Cl2(g)', F: 'F2(g)', Br: 'Br2(l)', I: 'I2(s)', C: 'C(s)', S: 'S(s)', Na: 'Na(s)', K: 'K(s)', Ca: 'Ca(s)', Mg: 'Mg(s)', Al: 'Al(s)', Fe: 'Fe(s)', Cu: 'Cu(s)', Zn: 'Zn(s)', Ag: 'Ag(s)', P: 'P(s)', Si: 'Si(s)' };
  const ATOMOS_POR_MOLECULA = { 'H2(g)': 2, 'O2(g)': 2, 'N2(g)': 2, 'Cl2(g)': 2, 'F2(g)': 2, 'Br2(l)': 2, 'I2(s)': 2 };

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
  const ACIDOS_ANION = { F: [3.17], SO4: [1.99], CO3: [6.35, 10.33], CrO4: [6.49], C2O4: [1.25, 4.27], PO4: [2.15, 7.20, 12.35], S: [7.0, 13.0], OH: [] };
  const COMPLEJOS = {
    'Ag+': { NH3: [3.32, 7.23], S2O3: [8.82, 13.46] },
    'Cu2+': { NH3: [4.04, 7.47, 10.27, 11.75], OH: [6.3, 12.8] },
    'Zn2+': { NH3: [2.37, 4.81, 7.31, 9.46], OH: [5.0, 11.1, 13.6, 14.8] },
    'Pb2+': { OH: [6.3, 10.9, 13.9] },
    'Al3+': { OH: [9.0, 17.9, 26.0, 33.0] },
    'Ni2+': { NH3: [2.75, 4.95, 6.64, 7.79, 8.50, 8.49] },
  };

  const INDICADORES = [
    ['thymol blue (acid)', 1.2, 2.8, 'rojo', 'amarillo'], ['methyl orange', 3.1, 4.4, 'rojo', 'amarillo'], ['bromocresol green', 3.8, 5.4, 'amarillo', 'azul'],
    ['methyl red', 4.2, 6.3, 'rojo', 'amarillo'], ['bromocresol purple', 5.2, 6.8, 'amarillo', 'purple'], ['bromothymol blue', 6.0, 7.6, 'amarillo', 'azul'],
    ['phenol red', 6.8, 8.4, 'amarillo', 'rojo'], ['cresol red', 7.2, 8.8, 'amarillo', 'red-purple'], ['thymol blue (basic)', 8.0, 9.6, 'amarillo', 'azul'],
    ['phenolphthalein', 8.2, 10.0, 'incoloro', 'rosa'], ['thymolphthalein', 9.3, 10.5, 'incoloro', 'azul'], ['alizarin yellow R', 10.1, 12.0, 'amarillo', 'rojo'],
  ];

  const S = (coef, esp, fase = 'aq') => [coef, esp, fase];
  const POTENCIALES = [
    { id: 'F2', ox: [S(1, 'F2', 'g')], red: [S(2, 'F-')], n: 2, E: 2.87, medio: 'neutro' },
    { id: 'Co3+', ox: [S(1, 'Co^3+')], red: [S(1, 'Co^2+')], n: 1, E: 1.92, medio: 'neutro' },
    { id: 'H2O2-ac', ox: [S(1, 'H2O2'), S(2, 'H+')], red: [S(2, 'H2O', 'l')], n: 2, E: 1.78, medio: 'acidic' },
    { id: 'MnO4-ac', ox: [S(1, 'MnO4-'), S(8, 'H+')], red: [S(1, 'Mn^2+'), S(4, 'H2O', 'l')], n: 5, E: 1.51, medio: 'acidic' },
    { id: 'Au3+', ox: [S(1, 'Au^3+')], red: [S(1, 'Au', 's')], n: 3, E: 1.50, medio: 'neutro' },
    { id: 'PbO2', ox: [S(1, 'PbO2', 's'), S(4, 'H+')], red: [S(1, 'Pb^2+'), S(2, 'H2O', 'l')], n: 2, E: 1.46, medio: 'acidic' },
    { id: 'Cl2', ox: [S(1, 'Cl2', 'g')], red: [S(2, 'Cl-')], n: 2, E: 1.36, medio: 'neutro' },
    { id: 'Cr2O7', ox: [S(1, 'Cr2O7^2-'), S(14, 'H+')], red: [S(2, 'Cr^3+'), S(7, 'H2O', 'l')], n: 6, E: 1.33, medio: 'acidic' },
    { id: 'O2-ac', ox: [S(1, 'O2', 'g'), S(4, 'H+')], red: [S(2, 'H2O', 'l')], n: 4, E: 1.23, medio: 'acidic' },
    { id: 'MnO2', ox: [S(1, 'MnO2', 's'), S(4, 'H+')], red: [S(1, 'Mn^2+'), S(2, 'H2O', 'l')], n: 2, E: 1.22, medio: 'acidic' },
    { id: 'Br2', ox: [S(1, 'Br2', 'l')], red: [S(2, 'Br-')], n: 2, E: 1.07, medio: 'neutro' },
    { id: 'NO3-NO', ox: [S(1, 'NO3-'), S(4, 'H+')], red: [S(1, 'NO', 'g'), S(2, 'H2O', 'l')], n: 3, E: 0.96, medio: 'acidic' },
    { id: 'Hg2+', ox: [S(1, 'Hg^2+')], red: [S(1, 'Hg', 'l')], n: 2, E: 0.85, medio: 'neutro' },
    { id: 'Ag+', ox: [S(1, 'Ag+')], red: [S(1, 'Ag', 's')], n: 1, E: 0.80, medio: 'neutro' },
    { id: 'NO3-NO2', ox: [S(1, 'NO3-'), S(2, 'H+')], red: [S(1, 'NO2', 'g'), S(1, 'H2O', 'l')], n: 1, E: 0.80, medio: 'acidic' },
    { id: 'Fe3+', ox: [S(1, 'Fe^3+')], red: [S(1, 'Fe^2+')], n: 1, E: 0.77, medio: 'neutro' },
    { id: 'O2-H2O2', ox: [S(1, 'O2', 'g'), S(2, 'H+')], red: [S(1, 'H2O2')], n: 2, E: 0.70, medio: 'acidic' },
    { id: 'MnO4-neutro', ox: [S(1, 'MnO4-'), S(2, 'H2O', 'l')], red: [S(1, 'MnO2', 's'), S(4, 'OH-')], n: 3, E: 0.59, medio: 'basic' },
    { id: 'I2', ox: [S(1, 'I2', 's')], red: [S(2, 'I-')], n: 2, E: 0.54, medio: 'neutro' },
    { id: 'Cu+', ox: [S(1, 'Cu+')], red: [S(1, 'Cu', 's')], n: 1, E: 0.52, medio: 'neutro' },
    { id: 'O2-bas', ox: [S(1, 'O2', 'g'), S(2, 'H2O', 'l')], red: [S(4, 'OH-')], n: 4, E: 0.40, medio: 'basic' },
    { id: 'Cu2+', ox: [S(1, 'Cu^2+')], red: [S(1, 'Cu', 's')], n: 2, E: 0.34, medio: 'neutro' },
    { id: 'AgCl', ox: [S(1, 'AgCl', 's')], red: [S(1, 'Ag', 's'), S(1, 'Cl-')], n: 1, E: 0.22, medio: 'neutro' },
    { id: 'Cu2+/Cu+', ox: [S(1, 'Cu^2+')], red: [S(1, 'Cu+')], n: 1, E: 0.16, medio: 'neutro' },
    { id: 'Sn4+', ox: [S(1, 'Sn^4+')], red: [S(1, 'Sn^2+')], n: 2, E: 0.15, medio: 'neutro' },
    { id: 'H+', ox: [S(2, 'H+')], red: [S(1, 'H2', 'g')], n: 2, E: 0.00, medio: 'acidic' },
    { id: 'Pb2+', ox: [S(1, 'Pb^2+')], red: [S(1, 'Pb', 's')], n: 2, E: -0.13, medio: 'neutro' },
    { id: 'Sn2+', ox: [S(1, 'Sn^2+')], red: [S(1, 'Sn', 's')], n: 2, E: -0.14, medio: 'neutro' },
    { id: 'Ni2+', ox: [S(1, 'Ni^2+')], red: [S(1, 'Ni', 's')], n: 2, E: -0.26, medio: 'neutro' },
    { id: 'Co2+', ox: [S(1, 'Co^2+')], red: [S(1, 'Co', 's')], n: 2, E: -0.28, medio: 'neutro' },
    { id: 'Cd2+', ox: [S(1, 'Cd^2+')], red: [S(1, 'Cd', 's')], n: 2, E: -0.40, medio: 'neutro' },
    { id: 'Fe2+', ox: [S(1, 'Fe^2+')], red: [S(1, 'Fe', 's')], n: 2, E: -0.44, medio: 'neutro' },
    { id: 'Cr3+', ox: [S(1, 'Cr^3+')], red: [S(1, 'Cr', 's')], n: 3, E: -0.74, medio: 'neutro' },
    { id: 'Zn2+', ox: [S(1, 'Zn^2+')], red: [S(1, 'Zn', 's')], n: 2, E: -0.76, medio: 'neutro' },
    { id: 'H2O', ox: [S(2, 'H2O', 'l')], red: [S(1, 'H2', 'g'), S(2, 'OH-')], n: 2, E: -0.83, medio: 'basic' },
    { id: 'H2O-pH7', ox: [S(2, 'H2O', 'l')], red: [S(1, 'H2', 'g'), S(2, 'OH-')], n: 2, E: -0.41, medio: 'pH 7' },
    { id: 'O2-pH7', ox: [S(1, 'O2', 'g'), S(4, 'H+')], red: [S(2, 'H2O', 'l')], n: 4, E: 0.82, medio: 'pH 7' },
    { id: 'Mn2+', ox: [S(1, 'Mn^2+')], red: [S(1, 'Mn', 's')], n: 2, E: -1.18, medio: 'neutro' },
    { id: 'Al3+', ox: [S(1, 'Al^3+')], red: [S(1, 'Al', 's')], n: 3, E: -1.66, medio: 'neutro' },
    { id: 'Mg2+', ox: [S(1, 'Mg^2+')], red: [S(1, 'Mg', 's')], n: 2, E: -2.37, medio: 'neutro' },
    { id: 'Na+', ox: [S(1, 'Na+')], red: [S(1, 'Na', 's')], n: 1, E: -2.71, medio: 'neutro' },
    { id: 'Ca2+', ox: [S(1, 'Ca^2+')], red: [S(1, 'Ca', 's')], n: 2, E: -2.87, medio: 'neutro' },
    { id: 'Ba2+', ox: [S(1, 'Ba^2+')], red: [S(1, 'Ba', 's')], n: 2, E: -2.91, medio: 'neutro' },
    { id: 'K+', ox: [S(1, 'K+')], red: [S(1, 'K', 's')], n: 1, E: -2.93, medio: 'neutro' },
    { id: 'Li+', ox: [S(1, 'Li+')], red: [S(1, 'Li', 's')], n: 1, E: -3.04, medio: 'neutro' },
  ];

  const METALES = {
    Li: { sub: 159.4, ei: [520.2] }, Na: { sub: 107.5, ei: [495.8] }, K: { sub: 89.0, ei: [418.8] }, Rb: { sub: 80.9, ei: [403.0] }, Cs: { sub: 76.5, ei: [375.7] },
    Mg: { sub: 147.1, ei: [737.7, 1450.7] }, Ca: { sub: 177.8, ei: [589.8, 1145.4] }, Sr: { sub: 164.4, ei: [549.5, 1064.2] }, Ba: { sub: 180.0, ei: [502.9, 965.2] },
    Al: { sub: 330.0, ei: [577.5, 1816.7, 2744.8] },
  };
  const NOMETALES = {
    F: { atom: 79.4, ae: [328.0] }, Cl: { atom: 121.3, ae: [349.0] }, Br: { atom: 111.9, ae: [324.6] }, I: { atom: 106.8, ae: [295.2] },
    O: { atom: 249.2, ae: [141.0, -744.0] }, S: { atom: 277.2, ae: [200.4, -532.0] },
  };
  const SALES_BORN = {
    LiF: { hf: -616.0, ref: 1037 }, LiCl: { hf: -408.6, ref: 853 }, NaF: { hf: -573.6, ref: 923 }, NaCl: { hf: -411.2, ref: 787 }, NaBr: { hf: -361.1, ref: 747 },
    NaI: { hf: -287.8, ref: 704 }, KF: { hf: -567.3, ref: 821 }, KCl: { hf: -436.5, ref: 715 }, KBr: { hf: -393.8, ref: 682 }, KI: { hf: -327.9, ref: 649 },
    RbCl: { hf: -435.4, ref: 689 }, CsCl: { hf: -443.0, ref: 659 }, MgO: { hf: -601.6, ref: 3791 }, CaO: { hf: -635.1, ref: 3401 }, SrO: { hf: -592.0, ref: 3223 },
    BaO: { hf: -548.0, ref: 3054 }, MgCl2: { hf: -641.3, ref: 2526 }, CaF2: { hf: -1219.6, ref: 2630 }, CaCl2: { hf: -795.4, ref: 2258 }, MgF2: { hf: -1124.2, ref: 2957 },
    Na2O: { hf: -414.2, ref: 2481 }, K2O: { hf: -361.5, ref: 2238 }, Li2O: { hf: -597.9, ref: 2799 }, Na2S: { hf: -364.8, ref: 2203 },
  };


  const SOLUBILIDAD_T = {
    NaCl: { nombre: 'Sodium chloride', f: 'NaCl', v: [35.7, 35.9, 36.4, 37.1, 38.0, 39.2] },
    KCl: { nombre: 'Potassium chloride', f: 'KCl', v: [28.0, 34.2, 40.1, 45.8, 51.3, 56.3] },
    KNO3: { nombre: 'Potassium nitrate', f: 'KNO3', v: [13.3, 31.6, 63.9, 110, 169, 246] },
    NaNO3: { nombre: 'Sodium nitrate', f: 'NaNO3', v: [73, 88, 105, 124, 148, 180] },
    NH4Cl: { nombre: 'Ammonium chloride', f: 'NH4Cl', v: [29.4, 37.2, 45.8, 55.3, 65.6, 77.3] },
    CuSO4: { nombre: 'Copper(II) sulfate', f: 'CuSO4', v: [14.3, 20.7, 28.5, 40.0, 55.0, 75.4] },
    K2Cr2O7: { nombre: 'Potassium dichromate', f: 'K2Cr2O7', v: [4.7, 12.3, 26.3, 45.6, 73.0, 102] },
    KClO3: { nombre: 'Potassium chlorate', f: 'KClO3', v: [3.3, 7.3, 13.9, 23.8, 37.5, 56.3] },
    PbNO32: { nombre: 'Lead(II) nitrate', f: 'Pb(NO3)2', v: [37.5, 54.3, 72.1, 91.6, 111, 133] },
    Na2SO4: { nombre: 'Sodium sulfate (anhydrous)', f: 'Na2SO4', v: [4.9, 19.5, 48.8, 45.3, 43.7, 42.5] },
    Li2SO4: { nombre: 'Lithium sulfate', f: 'Li2SO4', v: [36.1, 35.1, 33.7, 32.6, 31.4, 30.5] },
    CaOH2: { nombre: 'Calcium hydroxide', f: 'Ca(OH)2', v: [0.189, 0.173, 0.141, 0.121, 0.094, 0.076] },
    sacarosa: { nombre: 'Sucrose', f: 'C12H22O11', v: [179, 204, 238, 287, 362, 487] },
  };
  const T_SOL = [0, 20, 40, 60, 80, 100];
  const HENRY = {
    O2: { nombre: 'Oxygen', f: 'O2', k: 1.3e-3, C: 1700, M: 31.998 }, N2: { nombre: 'Nitrogen', f: 'N2', k: 6.4e-4, C: 1300, M: 28.014 },
    CO2: { nombre: 'Carbon dioxide', f: 'CO2', k: 3.3e-2, C: 2400, M: 44.009 }, H2: { nombre: 'Hydrogen', f: 'H2', k: 7.8e-4, C: 500, M: 2.016 },
    He: { nombre: 'Helium', f: 'He', k: 3.8e-4, C: 230, M: 4.003 }, Ar: { nombre: 'Argon', f: 'Ar', k: 1.4e-3, C: 1300, M: 39.948 },
    CH4: { nombre: 'Methane', f: 'CH4', k: 1.4e-3, C: 1600, M: 16.043 }, CO: { nombre: 'Carbon monoxide', f: 'CO', k: 9.5e-4, C: 1300, M: 28.010 },
    N2O: { nombre: 'Nitrous oxide', f: 'N2O', k: 2.4e-2, C: 2700, M: 44.013 }, H2S: { nombre: 'Hydrogen sulfide', f: 'H2S', k: 1.0e-1, C: 2100, M: 34.08 },
    NH3: { nombre: 'Ammonia', f: 'NH3', k: 59, C: 4200, M: 17.031 }, SO2: { nombre: 'Sulfur dioxide', f: 'SO2', k: 1.2, C: 3100, M: 64.066 },
  };

  const MASAS_CLASE = { H: 1, He: 4, Li: 7, C: 12, N: 14, O: 16, F: 19, Na: 23, Mg: 24, Al: 27, Si: 28, P: 31, S: 32, Cl: 35.5, K: 39, Ca: 40, Mn: 55, Fe: 56, Cu: 63.5, Zn: 65.4, Br: 80, Ag: 108, I: 127, Ba: 137, Pb: 207 };

  const lee = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const ajuste = () => ({ clase: lee('quimica-clase') === '1' });

  return { FUENTES, R, F, T0, RATM, RCLASE, FCLASE, SOLUBILIDAD_T, T_SOL, HENRY, TERMO, ELEMENTOS_ESTANDAR, ATOMOS_POR_MOLECULA, KPS, ACIDOS_ANION, COMPLEJOS, INDICADORES, POTENCIALES, METALES, NOMETALES, SALES_BORN, MASAS_CLASE, ajuste };
})();

