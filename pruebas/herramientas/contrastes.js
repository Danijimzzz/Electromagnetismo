/* Comprobación de Contrastes de hipótesis: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo contrastes). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Contrastes de hipótesis';
  const C = require(path.join(fuente, 'contrastes', 'calculo.js')), IN = require(path.join(fuente, 'estadistica', 'inferencia.js'));
  const REF = JSON.parse(fs.readFileSync(path.join(fuente, '..', 'pruebas', 'referencias', 'estadistica.json'), 'utf8')).potencia, REF2 = JSON.parse(fs.readFileSync(path.join(fuente, '..', 'pruebas', 'referencias', 'estadistica.json'), 'utf8'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    const mira = (c, est, crit, pv, rechaza) => { const r = ej(c); cerca(r.est, est, 1e-4, `${c}: estadístico`); crit.forEach((v, i) => cerca(r.crit[i], v, 2e-3, `${c}: valor crítico ${i + 1}`)); cerca(r.pv, pv, 2e-4, `${c}: p-valor`); if (r.rechaza !== rechaza) mal(`${N} · ${c}: la decisión sale al revés`); };
    // z = (496 − 500)/(10/5) = −2; z₀,₉₇₅ = 1,96; p = 2·Φ(−2) = 0,0455
    mira('paquetes', -2, [-1.96, 1.96], 0.0455, true);
    // t = 0,6/(1,2/4) = 2 con 15 g. l.; t₀,₉₅ = 1,753; p = 0,0320 (tablas)
    mira('pilas', 2, [1.753], 0.032, true);
    // p̂ = 0,29; z = 0,04/√(0,25·0,75/200) = 1,3064; p = 0,0957
    mira('encuesta', 1.3064, [1.6449], 0.0957, false);
    // χ² = 19·6,25/4 = 29,6875; χ²₁₉;₀,₉₅ = 30,144; p ≈ 0,056
    mira('maquina', 29.6875, [30.144], 0.0559, false);
    // sp² = (9·16 + 11·25)/20 = 20,95; t = 5/(√20,95·√(1/10 + 1/12)) = 2,5513 con 20 g. l.; t₀,₉₇₅ = 2,086
    mira('metodos', 2.5513, [-2.086, 2.086], 0.019, true);
    // p̂ = 0,25 conjunta; z = 0,1/√(0,25·0,75·2/150) = 2
    mira('tratamiento', 2, [-1.96, 1.96], 0.0455, true);
    // F = 9/4 = 2,25 con (10, 12); F₀,₉₇₅ = 3,374; F₀,₀₂₅ = 1/F₀,₉₇₅(12, 10) = 1/3,621 = 0,2762
    mira('proveedores', 2.25, [0.2762, 3.3736], 0.1848, false);
    // Welch con las varianzas de «metodos»: ν = (1,6 + 2,0833)²/(1,6²/9 + 2,0833²/11) = 19,99
    const w = C.resolver({ ...C.ejemplos[4].sc, caso: 'distintas' }); cerca(w.d[1].nu, (1.6 + 25 / 12) ** 2 / (1.6 ** 2 / 9 + (25 / 12) ** 2 / 11), 1e-9, 'grados de libertad de Welch');
    error({ tipo: 'media', alfa: '0,05', n: '1', xm: '3', s: '1', mu0: '2' }, 'n = 1');
    error({ tipo: 'proporcion', alfa: '0,05', n: '10', x: '12', p0: '0,5' }, 'más éxitos que n');
    error({ tipo: 'media', alfa: '0', n: '10', xm: '3', s: '1', mu0: '2' }, 'α = 0');
    // ---- potencia, β y tamaño de muestra (t no central contra statsmodels TTestPower y TTestIndPower; z con la fórmula clásica de scipy) ----
    const pw = ej('potencia').pot; cerca(pw.potencia, REF.media_t_mayor.pot, 1e-9, 'potencia de la t de una media (statsmodels)'); cerca(pw.beta, 1 - REF.media_t_mayor.pot, 1e-9, 'β = 1 − potencia'); cerca(pw.nec[0], REF.media_t_mayor.nec90, 0, 'n necesario para 0,9 (statsmodels)');
    const p2 = ej('potencia-dos').pot; cerca(p2.potencia, REF.dosmedias_t.pot, 1e-9, 'potencia de la t de dos medias (statsmodels)'); cerca(p2.nec[0], REF.dosmedias_t.nec80[0], 0, 'n₁ necesario'); cerca(p2.nec[1], REF.dosmedias_t.nec80[1], 0, 'n₂ necesario');
    const base = (o) => ({ alfa: '0,05', h1: 'distinto', ...o });
    cerca(C.resolver(base({ tipo: 'media', sigmaC: 'si', n: '25', xm: '505', s: '10', mu0: '500', real: '505' })).pot.potencia, REF.media_z.pot, 1e-9, 'potencia de la z de una media');
    cerca(C.resolver(base({ tipo: 'media', sigmaC: 'no', n: '12', xm: '5', s: '2', mu0: '4', real: '5' })).pot.potencia, REF.media_t_dos_colas.pot, 1e-9, 'potencia de la t bilateral (d = 0,5)');
    cerca(C.resolver(base({ tipo: 'media', h1: 'menor', sigmaC: 'no', n: '12', xm: '5', s: '2', mu0: '4', real: '3' })).pot.potencia, REF.media_t_dos_colas.pot_menor, 1e-9, 'potencia de la t unilateral por la izquierda');
    const pp = C.resolver(base({ tipo: 'proporcion', h1: 'mayor', n: '200', x: '58', p0: '0,25', real: '0,35' })).pot; cerca(pp.potencia, REF.prop.pot, 1e-9, 'potencia de una proporción'); cerca(pp.nec[0], REF.prop.nec80, 0, 'n necesario para una proporción (0,8)');
    cerca(C.resolver(base({ tipo: 'dosprop', n1: '150', x1: '45', n2: '150', x2: '30', real: '0,1' })).pot.potencia, REF.dosprop.pot, 1e-9, 'potencia de dos proporciones');
    cerca(C.resolver(base({ tipo: 'varianza', h1: 'mayor', n: '20', s: '2,5', s0: '2', real: '3' })).pot.potencia, REF.varianza.pot, 1e-9, 'potencia de una varianza (χ² escalada)');
    cerca(C.resolver(base({ tipo: 'dosvar', n1: '11', s1: '3', n2: '13', s2: '2', real: '3' })).pot.potencia, REF.dosvar.pot, 1e-9, 'potencia de dos varianzas (F escalada)');
    // sin el valor real no hay potencia; con α = potencia (valor real = el de H₀) la potencia es α
    if (ej('paquetes').pot) mal(`${N}: sin el valor real no debería calcular la potencia`);
    cerca(C.resolver(base({ tipo: 'media', sigmaC: 'si', n: '25', xm: '505', s: '10', mu0: '500', real: '500' })).pot.potencia, 0.05, 1e-9, 'con el valor real igual al de H₀ la potencia es α');
    // ---- tamaño del efecto ----
    cerca(ej('pilas').efecto.val, 0.5, 1e-9, 'd de Cohen de las pilas = 0,6/1,2'); cerca(ej('encuesta').efecto.val, 2 * Math.asin(Math.sqrt(0.29)) - 2 * Math.asin(Math.sqrt(0.25)), 1e-12, 'h de Cohen de la encuesta');
    cerca(ej('metodos').efecto.val, 5 / Math.sqrt(20.95), 1e-9, 'd de Cohen de dos medias (sp² = 20,95)'); cerca(ej('metodos').efecto.g, (5 / Math.sqrt(20.95)) * (1 - 3 / (4 * 22 - 9)), 1e-9, 'g de Hedges');
    // ---- datos en lista: n, x̄ y s salen de los datos, y se contrasta su normalidad ----
    const dt = ej('datos'), v = [498, 502, 495, 497, 501, 496, 494, 499, 503, 492, 497, 500], m = v.reduce((a, b) => a + b) / 12, sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / 11);
    cerca(dt.est, (m - 500) / (sd / Math.sqrt(12)), 1e-9, 'datos: t con la media y la s de la lista'); if (!dt.norm.length || !isFinite(dt.norm[0].W)) mal(`${N}: debería traer el Shapiro-Wilk de los datos`);
    // ---- apareados = una media sobre las diferencias ----
    const ap = ej('apareados'), dd = [0.6, -0.1, 0.7, 0.4, 0.4, 0.4, 0.5, 0.5], md = dd.reduce((a, b) => a + b) / 8, sdd = Math.sqrt(dd.reduce((a, b) => a + (b - md) ** 2, 0) / 7);
    cerca(ap.est, md / (sdd / Math.sqrt(8)), 1e-9, 'apareados: t de las diferencias'); cerca(ap.d[1].nu, 7, 0, 'apareados: g. l.');
    // ---- normalidad y varias varianzas ----
    const nm = ej('normalidad'); cerca(nm.sh.W, REF2.shapiro['13'][0], 1e-9, 'normalidad: W de scipy'); cerca(nm.sh.p, REF2.shapiro['13'][1], 1e-8, 'normalidad: p de scipy'); cerca(nm.jb.JB, REF2.jarque_bera[0], 1e-9, 'normalidad: JB de scipy');
    const vr = ej('varios'), gs = [[10.1, 9.9, 10.0, 10.2, 9.8], [10.5, 9.2, 10.9, 9.0, 10.3], [10.0, 10.1, 9.9, 10.1, 9.9]], lv = IN.levene(gs, 'mediana'); cerca(vr.lev.W, lv.W, 1e-12, 'varios: Levene'); cerca(vr.bar.B, IN.bartlett(gs).B, 1e-12, 'varios: Bartlett');
    error({ tipo: 'normalidad', alfa: '0,05', datos: '1 2' }, 'normalidad con 2 datos'); error({ tipo: 'normalidad', alfa: '0,05', datos: '3 3 3 3' }, 'normalidad con datos constantes');
    error({ tipo: 'varios', alfa: '0,05', datos: '1 2 3' }, 'un solo grupo'); error({ tipo: 'varios', alfa: '0,05', datos: '1 1 1\n2 3 4' }, 'grupo constante');
    error({ tipo: 'apareados', alfa: '0,05', h1: 'distinto', datos1: '1 2 3', datos2: '1 2' }, 'pares de distinta longitud'); error({ tipo: 'apareados', alfa: '0,05', h1: 'distinto', datos1: '1 2 3', datos2: '2 3 4' }, 'diferencias constantes');
    error({ tipo: 'media', alfa: '0,05', h1: 'distinto', entrada: 'datos', sigmaC: 'no', mu0: '1', datos: '5' }, 'un solo dato en la lista');
    error({ tipo: 'media', alfa: '0,05', h1: 'distinto', n: '10', xm: '3', s: '1', mu0: '2', real: '3', pot: '1' }, 'potencia deseada = 1');
    error({ tipo: 'dosprop', alfa: '0,05', h1: 'distinto', n1: '150', x1: '45', n2: '150', x2: '30', real: '0,9' }, 'diferencia real que saca p₁ de (0, 1)');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos (z, t, χ², F, dos medias, dos proporciones), Welch, potencia contra statsmodels, tamaño del efecto, normalidad, varias varianzas y errores`);
  }
  return Com.navegador({ publico, asignatura: 'estadistica', carpeta: 'contrastes', nombre: N, app: 'ContrastesApp', C, pagina, mal, malo: { k: 'n', v: '1' } });
};
