/* ===== Casos hechos a mano para las herramientas con menos pruebas (TRV.10.18b · Fase 14) =====
   Elegidas con `node pruebas/cobertura.js`: tabla periódica, configuración electrónica, ajustador, masa molar, solubilidad, sistemas y choques.
   Cada resultado sale de una cuenta que cualquier libro da. Sin navegador. node pruebas/casos-flojas.js (lo llama comprobar.js) */
const path = require('path'), fuente = path.join(__dirname, '..', 'fuente');
global.Expr = require(path.join(fuente, 'matematicas', 'expresion.js')); global.Algebra = require(path.join(fuente, 'matematicas', 'algebra.js')); global.Herramienta = require(path.join(fuente, 'herramienta.js'));
global.Elementos = require(path.join(fuente, 'quimica', 'elementos.js')); global.Formulas = require(path.join(fuente, 'quimica', 'formulas.js'));
let fallos = 0, hechos = 0;
const igual = (nombre, a, b, tol = 1e-6) => { hechos++; const ok = typeof b === 'number' ? Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)) : a === b; if (!ok) { fallos++; console.log(`✗ ${nombre}: ${a} y no ${b}`); } };
const intenta = (nombre, fn) => { try { fn(); } catch (e) { fallos++; console.log(`✗ ${nombre}: ${e.message}`); } };

intenta('Tabla periódica', () => { const L = Elementos.lista;
  igual('118 elementos', L.length, 118); igual('Z consecutivos', L.every((e, i) => e.Z === i + 1) ? 1 : 0, 1);
  const por = {}; for (const e of L) por[e.periodo] = (por[e.periodo] || 0) + 1; igual('Tamaño de los periodos 2, 8, 8, 18, 18, 32, 32', Object.values(por).join(), '2,8,8,18,18,32,32');
  const S = Elementos.porSimbolo; igual('Fe: Z = 26, periodo 4, grupo 8', `${S.Fe.Z},${S.Fe.periodo},${S.Fe.grupo}`, '26,4,8'); igual('Masa del Fe', S.Fe.masa, 55.845, 1e-4); igual('Cl más electronegativo que Na', S.Cl.en > S.Na.en ? 1 : 0, 1);
  igual('Na: 1.er grupo', S.Na.grupo, 1); igual('Ne: grupo 18', S.Ne.grupo, 18); igual('La masa crece con Z salvo en los pares clásicos Ar/K, Co/Ni y Te/I', L.filter((e, i) => i && e.masa < L[i - 1].masa && e.Z < 90).map((e) => e.simbolo).join(), 'K,Ni,I');
});
intenta('Configuración electrónica', () => { const C = require(path.join(fuente, 'quimica', 'configuracion.js'));
  for (const [s, ab, des, ex] of [['Fe', '[Ar] 4s² 3d⁶', 4, false], ['Cr', '[Ar] 4s¹ 3d⁵', 6, true], ['Cu', '[Ar] 4s¹ 3d¹⁰', 1, true], ['O', '[He] 2s² 2p⁴', 2, false], ['Ne', '[He] 2s² 2p⁶', 0, false], ['N', '[He] 2s² 2p³', 3, false], ['Fe^3+', '[Ar] 3d⁵', 5, false], ['Cl^-', '[Ar]', 0, false]]) {
    const a = C.analizar(s); igual(`${s}: configuración`, a.abreviada, ab); igual(`${s}: electrones desapareados`, a.desapareados, des); igual(`${s}: excepción`, a.excepcion, ex);
  }
  igual('Fe³⁺ tiene 23 electrones', C.analizar('Fe^3+').electrones, 23); igual('Cl⁻ tiene 18 electrones', C.analizar('Cl^-').electrones, 18);
});
intenta('Ajustador', () => { const A = require(path.join(fuente, 'ajustador', 'calculo.js'));
  for (const [q, c] of [['C3H8 + O2 -> CO2 + H2O', '1,5,3,4'], ['Fe + O2 -> Fe2O3', '4,3,2'], ['Al + HCl -> AlCl3 + H2', '2,6,2,3'], ['KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O', '2,16,2,2,5,8'], ['C6H12O6 + O2 -> CO2 + H2O', '1,6,6,6'], ['Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O', '3,2,1,6'], ['NH3 + O2 -> NO + H2O', '4,5,4,6']])
    igual(`Ajustador ${q}`, A.resolver({ ecuacion: q }).especies.map((e) => e.coef).join(), c);
});
intenta('Masa molar', () => { const F = Formulas;
  for (const [f, M] of [['H2O', 18.015], ['CO2', 44.009], ['Ca(OH)2', 74.092], ['NaCl', 58.44], ['H2SO4', 98.07], ['C6H12O6', 180.156], ['Al2(SO4)3', 342.15], ['CuSO4·5H2O', 249.685]]) igual(`Masa molar de ${f}`, F.masaMolar(f).M, M, 2e-4);
  const h = F.masaMolar('H2O').filas; igual('Porcentaje de O en el agua', h.find((x) => x.simbolo === 'O').porcentaje, 88.81, 1e-3); igual('Los porcentajes suman 100', h.reduce((s, x) => s + x.porcentaje, 0), 100, 1e-9);
});
intenta('Solubilidad', () => { const S = require(path.join(fuente, 'solubilidad', 'calculo.js'));
  const r = S.resolver({ modo: 'kps', formula: 'Ag2CrO4', a: '2', b: '1', s: '6.5e-5', uni: 'mol', M: '' }); igual('Ag₂CrO₄: Kps = 4s³', r.Kps, 4 * (6.5e-5) ** 3, 1e-9); igual('[Ag⁺] = 2s', r.ca, 1.3e-4, 1e-9);
  const c = S.resolver({ modo: 'kps', formula: 'Ca(OH)2', a: '1', b: '2', s: '0.011', uni: 'mol', M: '' }); igual('Ca(OH)₂: Kps = 4s³', c.Kps, 4 * 0.011 ** 3, 1e-9);
  const m = S.resolver({ modo: 'kps', formula: 'AgCl', a: '1', b: '1', s: '1.34e-5', uni: 'mol', M: '' }); igual('AgCl: Kps = s²', m.Kps, 1.34e-5 ** 2, 1e-9);
});
intenta('Sistemas', () => { const S = require(path.join(fuente, 'sistemas', 'calculo.js'));
  const t = (M) => S.resolver({ metodo: 'gauss', M }).tipo;
  igual('x + y = 3, x − y = 1: compatible determinado', t([['1', '1', '3'], ['1', '-1', '1']]), 'SCD'); igual('x + y = 2, x + y = 3: incompatible', t([['1', '1', '2'], ['1', '1', '3']]), 'SI'); igual('x + y = 2, 2x + 2y = 4: indeterminado', t([['1', '1', '2'], ['2', '2', '4']]), 'SCI');
  igual('Solución de x + y = 3, x − y = 1', S.resolver({ metodo: 'gauss', M: [['1', '1', '3'], ['1', '-1', '1']] }).res.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' '), 'x = 2, y = 1');
  for (const m of ['gauss', 'cramer', 'inversa']) igual(`3×3 por ${m}: tipo`, S.resolver({ metodo: m, M: [['2', '1', '-1', '8'], ['-3', '-1', '2', '-11'], ['-2', '1', '2', '-3']] }).tipo, 'SCD');
});
console.log(`Casos de las herramientas con menos pruebas: ${hechos} comprobaciones; ${fallos} fallos.`);
process.exit(fallos ? 1 : 0);
