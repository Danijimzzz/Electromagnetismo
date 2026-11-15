/* ===== Casos hechos a mano para las herramientas con menos pruebas (TRV.10.18b · Fase 14) =====
   Elegidas con `node pruebas/cobertura.js`: tabla periódica, configuración electrónica, ajustador, masa molar, solubilidad, sistemas y choques, y de Economía amortización del inmovilizado, Phillips-Okun, ahorro y formulación.
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

// Economía: amortización del inmovilizado, Phillips y Okun, ahorro (cuentas a mano)
global.Eco = require(path.join(fuente, 'economia', 'comun.js'));
intenta('Amortización del inmovilizado', () => { const A = require(path.join(fuente, 'amortizacion-inmovilizado', 'calculo.js'));
  const cu = (sc) => A.resolver(sc).filas.map((x) => Math.round(x.c * 100) / 100).join();
  igual('Lineal 50 000 − 5 000 en 5 años', cu({ metodo: 'lineal', v0: '50000', vr: '5000', n: '5' }), '9000,9000,9000,9000,9000');
  igual('Suma de dígitos (15)', cu({ metodo: 'digitos', v0: '50000', vr: '5000', n: '5' }), '15000,12000,9000,6000,3000');
  igual('Degresivo coef. 2: t = 0,4 y el último año llega al residual', cu({ metodo: 'degresivo', v0: '50000', vr: '5000', n: '5', coef: '2' }), '20000,12000,7200,4320,1480');
  igual('Unidades: 28 000/200 000 = 0,14 € por km', cu({ metodo: 'unidades', v0: '30000', vr: '2000', total: '200000', unidades: '50000 60000 40000 30000 20000' }), '7000,8400,5600,4200,2800');
  for (const m of ['lineal', 'digitos', 'degresivo']) { const r = A.resolver({ metodo: m, v0: '12345', vr: '345', n: '7', coef: '2' }); igual(`${m}: amortiza justo la base`, r.total, 12000, 1e-9); igual(`${m}: el valor neto final es el residual`, r.filas[6].vnc, 345, 1e-9); }
  const v = A.resolver({ metodo: 'lineal', v0: '50000', vr: '5000', n: '5', tventa: '3', pventa: '20000' }).venta;
  igual('Venta en el año 3: amortización acumulada 27 000', v.ac, 27000); igual('Venta: valor neto 23 000', v.vnc, 23000); igual('Venta: pérdida de 3 000', v.res, -3000); igual('Venta: tipo pérdida', v.tipo, 'pérdida');
  for (const mal of [{ metodo: 'lineal', v0: '1000', vr: '1000', n: '3' }, { metodo: 'degresivo', v0: '1000', vr: '0', n: '2', coef: '2' }, { metodo: 'unidades', v0: '1000', vr: '0', total: '10', unidades: '6 6' }]) { let m = null; try { A.resolver(mal); } catch (e) { m = e.message; } igual(`Error esperado: ${mal.metodo}`, m !== null, true); }
});
intenta('Phillips y Okun', () => { const P = require(path.join(fuente, 'phillips-okun', 'calculo.js'));
  let r = P.resolver({ modo: 'okun', busca: 'paro', u0: '8', gp: '3', beta: '0.5', g: '5' }); igual('Okun: Δu = −0,5·(5 − 3) = −1', r.du, -1); igual('Okun: paro final 7 %', r.u1, 7);
  r = P.resolver({ modo: 'okun', busca: 'crecimiento', u0: '8', u1: '6', gp: '3', beta: '0.5' }); igual('Okun: para bajar 2 puntos hay que crecer 7 %', r.g, 7);
  r = P.resolver({ modo: 'brecha', u: '8', un: '5', c: '2', Yp: '1000' }); igual('Brecha: −2·(8 − 5) = −6 %', r.br, -6); igual('Brecha: PIB 940', r.Y, 940);
  r = P.resolver({ modo: 'phillips', pe: '2', alfa: '0.5', un: '5', u: '3', s: '0' }); igual('Phillips: 2 − 0,5·(3 − 5) = 3 %', r.pi, 3);
  r = P.resolver({ modo: 'phillips', pe: '2', alfa: '0.5', un: '5', u: '5', s: '1.5' }); igual('Phillips con shock: paro natural → π = πᵉ + s', r.pi, 3.5);
  r = P.resolver({ modo: 'datos', datos: '4 6\n5 4\n6 2' }); igual('Ajuste exacto: pendiente −2', r.b, -2); igual('Ajuste exacto: ordenada 14', r.a, 14); igual('Ajuste exacto: r = −1', r.r, -1);
  let m = null; try { P.resolver({ modo: 'datos', datos: '4 6\n4 5\n4 3' }); } catch (e) { m = e.message; } igual('Paro constante: no se puede ajustar', m !== null, true);
});
intenta('Ahorro e inflación', () => { const A = require(path.join(fuente, 'ahorro', 'calculo.js'));
  let r = A.resolver({ modo: 'final', c0: '0', a: '1000', m: '1', r: '5', pi: '0', n: '10', indexa: 'no' }); igual('Renta pospagable: 1000·s(10; 5 %)', r.final, 1000 * (1.05 ** 10 - 1) / 0.05, 1e-9);
  r = A.resolver({ modo: 'final', c0: '1000', a: '0', m: '1', r: '5', pi: '0', n: '10', indexa: 'no' }); igual('Solo capital inicial: 1000·1,05¹⁰', r.final, 1000 * 1.05 ** 10, 1e-9);
  r = A.resolver({ modo: 'poder', x: '1000', pi: '2', n: '10' }); igual('Poder adquisitivo: 1000/1,02¹⁰', r.real, 1000 / 1.02 ** 10, 1e-9);
  r = A.resolver({ modo: 'final', c0: '0', a: '100', m: '12', r: '6', pi: '2', n: '5', indexa: 'no' }); igual('Euros de hoy: final/(1+π)ⁿ', r.real, r.final / 1.02 ** 5, 1e-9); igual('Fisher: (1+r)/(1+π) − 1', r.rr, 1.06 / 1.02 - 1, 1e-12);
  const o = A.resolver({ modo: 'objetivo', c0: '5000', objetivo: '100000', m: '12', r: '6', pi: '2', n: '25', indexa: 'no' });
  igual('Objetivo: con esa aportación se llega a 100 000 € de hoy', A.resolver({ modo: 'final', c0: '5000', a: String(o.a), m: '12', r: '6', pi: '2', n: '25', indexa: 'no' }).real, 100000, 1e-6);
  const z = A.resolver({ modo: 'final', c0: '0', a: '1000', m: '1', r: '0', pi: '0', n: '10', indexa: 'no' }); igual('Sin rentabilidad: se suma lo aportado', z.final, 10000, 1e-9);
});
intenta('Formulación', () => { const F = require(path.join(fuente, 'formulacion', 'calculo.js')), R = (modo, texto) => F.resolver({ modo, texto });
  for (const [n, f, t] of [['ácido nítrico', 'HNO3', 'Oxoácido'], ['hidróxido de calcio', 'Ca(OH)2', 'Hidróxido'], ['óxido de hierro(III)', 'Fe2O3', 'Óxido'], ['cloruro de sodio', 'NaCl', 'Sal binaria'], ['carbonato de calcio', 'CaCO3', 'Oxisal']]) {
    const r = R('n2f', n); igual(`${n} → fórmula`, r.formula, f); igual(`${n} → tipo`, r.tipo, t);
    const b = R('f2n', f); igual(`${f} → tipo`, b.tipo, t); igual(`${f} → ida y vuelta`, R('n2f', b.lineas[0].nombre).formula, f);
  }
  igual('H₂SO₄ en sistemática', R('f2n', 'H2SO4').lineas[0].nombre, 'tetraoxidosulfato de dihidrógeno'); igual('CuSO₄·5H₂O es un hidrato', R('f2n', 'CuSO4·5H2O').tipo, 'Hidrato');
  let m = null; try { R('f2n', 'Xx9'); } catch (e) { m = e.message; } igual('Fórmula sin sentido: error', m !== null, true);
});
// Solapes entre herramientas de Física (FIS.FG-3): lo que sale de dos sitios tiene que coincidir
global.Constantes = require(path.join(fuente, 'fisica', 'constantes.js'));
intenta('Solapes de Física', () => {
  const Dop = require(path.join(fuente, 'doppler', 'fisica.js')), On = require(path.join(fuente, 'ondas', 'fisica.js')), Ga = require(path.join(fuente, 'gases', 'fisica.js')), Ci = require(path.join(fuente, 'ciclos', 'fisica.js'));
  const FM = require(path.join(fuente, 'fisica-moderna', 'calculo.js')), Re = require(path.join(fuente, 'relatividad', 'calculo.js'));
  // Doppler: Ondas llama al módulo de Efecto Doppler, así que dan lo mismo (con y sin temperatura del aire)
  for (const [f, v, vF, vO] of [['700', '340', '25', '0'], ['500', '340', '-30', '8'], ['1000', '343', '0', '-10']]) igual(`Doppler ${f} Hz: Ondas = Efecto Doppler`, On.resolver({ modo: 'doppler', f, vs: v, vF, vO }).fp, Dop.recta({ f, v, vF, vO }).fp, 1e-12);
  igual('Doppler con T = 20 °C usa v = 331,3·√(1 + T/273,15)', On.resolver({ modo: 'doppler', f: '700', Taire: '20', vF: '25', vO: '0' }).fp, Dop.recta({ f: '700', v: String(331.3 * Math.sqrt(1 + 20 / 273.15)), vF: '25', vO: '0' }).fp, 1e-12);
  // Carnot: el rendimiento del ejemplo de Gases es el de Ciclos (1 − Tf/Tc)
  const eg = Ga.resolver(Ga.ejemplos.find((x) => x.clave === 'carnot').sc), ec = Ci.resolver({ modo: 'carnot', gas: 'di', Tc: '600', Tf: '300', n: '1', V1: '10', V2: '20' });
  igual('Carnot: η de Gases = η de Ciclos', eg.rend, ec.eta, 1e-6); igual('Carnot: η = 1 − 300/600', ec.eta, 0.5, 1e-12);
  // Relatividad y Física moderna: mismo γ, dilatación y contracción
  const d = FM.resolver({ modo: 'dilatacion', uv: 'c', v: '0,6', t0: '5' }), l = Re.resolver({ modo: 'lorentz', unidades: 'al', v: '0,6', x: '0', t: '5' });
  igual('γ(0,6) = 1,25 en las dos', `${d.g},${l.g}`, '1.25,1.25'); igual('Dilatación: Δt = γΔt₀ = el t′ de Relatividad', d.t, l.tp, 1e-12);
  igual('Contracción: 100 m a 0,6c miden 80 m', FM.resolver({ modo: 'contraccion', uv: 'c', v: '0,6', L0: '100' }).L, 80, 1e-12);
});
console.log(`Casos de las herramientas con menos pruebas: ${hechos} comprobaciones; ${fallos} fallos.`);
process.exit(fallos ? 1 : 0);
