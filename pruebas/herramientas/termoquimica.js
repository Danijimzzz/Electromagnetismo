/* Comprobación de Termoquímica y ley de Hess: cálculos en Node y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo termoquimica). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Termoquímica';
  global.Elementos = global.Elementos || require(path.join(fuente, 'quimica', 'elementos.js'));
  const C = require(path.join(fuente, 'termoquimica', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // a mano: CH4 + 2 O2 → CO2 + 2 H2O(l): −393,5 + 2·(−285,8) − (−74,8) = −890,3
    cerca(ej('metano').dH, -890.3, 1e-9, 'combustión del metano');
    // etanol: 2·(−393,5) + 3·(−285,8) + 277,7 = −1366,7; 10 g / 46,07 g/mol · (−1366,7)
    const e = ej('etanol'); cerca(e.dH, -1366.7, 1e-9, 'combustión del etanol'); cerca(e.q, -1366.7 * 10 / 46.069, 0.05, 'calor de 10 g de etanol');
    cerca(ej('amoniaco').dH, -92.2, 1e-9, 'síntesis del amoniaco');
    cerca(ej('propio').dH, -635.1 - 393.5 + 1207.1, 1e-9, 'con una entalpía propia');
    // Hess: C + ½O2 → CO = (C + O2 → CO2) − (CO + ½O2 → CO2): −393,5 + 283 = −110,5
    const h = ej('hess-co'); cerca(h.dH, -110.5, 1e-9, 'Hess del CO'); cerca(h.x[0], 1, 1e-9, 'factor 1'); cerca(h.x[1], -1, 1e-9, 'factor −1');
    // etano: −(−1560) + 2·(−393,5) + 3·(−285,8) = −84,4, con factores −1, 2, 3
    const t = ej('hess-etano'); cerca(t.dH, -84.4, 1e-9, 'Hess del etano'); cerca(t.x[0], -1, 1e-9, 'factor etano'); cerca(t.x[1], 2, 1e-9, 'factor C'); cerca(t.x[2], 3, 1e-9, 'factor H2');
    // Gibbs: 6,01 − 298·0,022 = −0,546; Te = 6010/22 = 273,18 K
    const g = ej('gibbs-hielo'); cerca(g.dG, -0.546, 1e-9, 'ΔG del hielo'); cerca(g.Te, 6010 / 22, 1e-9, 'Te del hielo');
    cerca(ej('gibbs-caco3').dG, 178.3 - 160.5, 1e-9, 'ΔG del CaCO3');
    // TQ-1: ΔS° = 213,8 + 2·188,8 − 186,3 − 2·205,1 = −5,1; ΔG° = −394,4 + 2·(−228,6) + 50,5 = −801,1
    const gm = ej('gibbs-metano'); cerca(gm.dS, 213.8 + 2 * 188.8 - 186.3 - 2 * 205.1, 1e-9, 'ΔS del metano'); cerca(gm.dG298, -394.4 - 2 * 228.6 + 50.5, 1e-9, 'ΔG° del metano con ΔGf'); cerca(gm.dGT, -802.3 + 298.15 * 5.1 / 1000, 0.05, 'ΔG del metano con ΔH − TΔS');
    // CaCO3 → CaO + CO2: ΔS = 38,1 + 213,8 − 91,7 = 160,2; Te = 178 300 / 160,2 = 1113 K; ΔG(1000 K) = 178,3 − 160,2 = 18,1
    const cc = ej('caco3-descomposicion'); cerca(cc.dS, 160.2, 1e-9, 'ΔS del CaCO3'); cerca(cc.Te, 178300 / 160.2, 1e-6, 'Te del CaCO3'); cerca(cc.dGT, 178.3 - 160.2, 1e-9, 'ΔG del CaCO3 a 1000 K');
    cerca(C.resolver({ modo: 'formacion', reactivos: 'N2(g)\n3 H2(g)', productos: '2 NH3(g)', masa: '', t: '' }).Te, 92200 / 198.1, 0.5, 'Te del amoniaco (≈ 465 K)');
    // la ΔH y el ΔS que se escriben a mano (tras «;»): con S sale ΔS, y sin S no se inventa
    if (C.resolver({ modo: 'formacion', reactivos: 'CaCO3(s) ; -1207,1', productos: 'CaO(s)\nCO2(g)', masa: '' }).dS !== undefined) mal(N + ': con una entalpía propia sin entropía no debería salir ΔS');
    cerca(C.resolver({ modo: 'formacion', reactivos: 'CaCO3(s) ; -1207,1 ; 90', productos: 'CaO(s)\nCO2(g)', masa: '' }).dS, 38.1 + 213.8 - 90, 1e-9, 'con S° propia');
    // TQ-3 Born-Haber: NaCl = −411,2 − 107,5 − 495,8 − 121,3 + 349,0 = −787,8… (con 495,8) → U = 787,0
    cerca(ej('born-nacl').U, 411.2 + 107.5 + 495.8 + 121.3 - 349.0, 1e-9, 'energía reticular del NaCl'); cerca(ej('born-mgo').U, 601.6 + 147.1 + 737.7 + 1450.7 + 249.2 - 141 + 744, 1e-9, 'energía reticular del MgO');
    cerca(ej('born-cacl2').U, 795.4 + 177.8 + 589.8 + 1145.4 + 2 * 121.3 - 2 * 349.0, 1e-9, 'energía reticular del CaCl2');
    for (const k of ['born-nacl', 'born-mgo', 'born-cacl2']) { const r = ej(k); if (Math.abs(r.U - r.ref) / r.ref > 0.01) mal(`${N}: la energía reticular de ${r.sal} (${r.U.toFixed(0)}) se aparta más de un 1 % del valor de tablas (${r.ref})`); }
    cerca(C.resolver({ modo: 'born', sal: 'NaCl', hf: '-400' }).U, 400 + 107.5 + 495.8 + 121.3 - 349.0, 1e-9, 'Born-Haber con ΔHf propia');
    error({ modo: 'born', sal: 'NaCl2' }, 'sal sin equilibrar en carga'); error({ modo: 'born', sal: 'XeF' }, 'metal desconocido'); error({ modo: 'born', sal: 'LiBr' }, 'sal sin ΔHf'); error({ modo: 'born', sal: '' }, 'sal vacía');
    // QU-1: los datos de Datos son coherentes: ΔGf° = ΔHf° − T·ΔSf° con las entropías de los elementos (±3 kJ/mol) y todas las especies con S° y ΔGf°
    {
      const D = require(path.join(fuente, 'quimica', 'datos.js')), F = require(path.join(fuente, 'quimica', 'formulas.js'));
      for (const [k, [h, sS, g]] of Object.entries(D.TERMO)) {
        if (![h, sS, g].every(Number.isFinite)) { mal(`${N} (datos): ${k} sin ΔHf, S° o ΔGf°`); continue; }
        const at = F.leer(k.replace(/\((?:s|l|g)\)$/, '')).atomos; let dS = sS;
        for (const [el, n] of Object.entries(at)) { const eK = D.ELEMENTOS_ESTANDAR[el], v = D.TERMO[eK]; if (!v) { mal(`${N} (datos): falta el elemento ${el} para comprobar ${k}`); dS = NaN; break; } dS -= n * v[1] / (D.ATOMOS_POR_MOLECULA[eK] || 1); }
        const gc = h - 298.15 * dS / 1000;
        if (D.ELEMENTOS_ESTANDAR[Object.keys(at)[0]] === k) { if (h !== 0 || g !== 0) mal(`${N} (datos): ${k} es un elemento y ΔHf y ΔGf deben ser 0`); }
        else if (!(Math.abs(g - gc) < 3)) mal(`${N} (datos): ${k} no es coherente: ΔGf° = ${g} pero ΔHf° − TΔS° = ${gc.toFixed(1)}`);
      }
    }
    error({ modo: 'formacion', reactivos: 'CH4(g)\nO2(g)', productos: 'CO2(g)\n2 H2O(l)' }, 'reacción sin ajustar');
    error({ modo: 'formacion', reactivos: 'H2O', productos: 'H2(g)\n1/2 O2(g)' }, 'H2O sin estado');
    error({ modo: 'formacion', reactivos: 'XeF4(s)', productos: 'Xe(g)\n2 F2(g)' }, 'sustancia sin entalpía');
    error({ modo: 'hess', reacciones: 'C(s) + O2(g) -> CO2(g) ; -393,5', objetivo: 'H2(g) + 1/2 O2(g) -> H2O(l)' }, 'Hess imposible');
    error({ modo: 'hess', reacciones: 'C(s) + O2(g) -> CO2(g)', objetivo: 'C(s) + O2(g) -> CO2(g)' }, 'reacción sin ΔH');
    error({ modo: 'gibbs', h: '', s: '1', t: '300' }, 'falta ΔH');
    error({ modo: 'gibbs', h: '1', s: '1', t: '0' }, 'temperatura cero');
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos calculados a mano (ΔHf, Hess, Gibbs) y errores`);
  }
  const nav = Com.navegador({ publico, asignatura: 'quimica', carpeta: 'termoquimica', nombre: N, app: 'TermoquimicaApp', C, pagina, mal, malo: { k: 'masa', v: '-1' } });
  return async (browser) => {
    await nav(browser);
    // QU-2 · «Usar en…»: ΔG° de la síntesis del amoníaco → Equilibrio (K = e^(−ΔG°/RT))
    const antes = fallos, { page } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'quimica', 'termoquimica', 'index.html'));
    await page.waitForFunction(() => window.TermoquimicaApp);
    await page.evaluate(() => TermoquimicaApp.abrirEjemplo('amoniaco'));

    const href = await page.evaluate(() => document.querySelector('#usar-en a')?.getAttribute('href') || '');
    if (!/^\.\.\/equilibrio\/#d=/.test(href)) mal('Termoquímica · falta el enlace «Calcular K en Equilibrio»: ' + href);
    else {
      const e = await page.evaluate(`(${(h) => JSON.parse(decodeURIComponent(escape(atob(h.slice(h.indexOf('#d=') + 3).replace(/-/g, '+').replace(/_/g, '/')))))})(${JSON.stringify(href)})`);
      if (e.modo !== 'dG' || e.nA !== 'N2' || e.nB !== 'H2' || e.nC !== 'NH3' || e.b !== '3' || e.c !== '2' || Math.abs(+e.dG.replace(',', '.') + 33.1365) > 1e-3) mal('Termoquímica · estado enviado a Equilibrio: ' + JSON.stringify(e));
      await page.goto('file://' + path.join(publico, 'quimica', 'equilibrio', 'index.html') + href.slice(href.indexOf('#')));
      await page.waitForFunction(() => window.EquilibrioApp);
      const r = await page.evaluate(() => EquilibrioApp.resultado());
      const Kp = Math.exp(33136.5 / (8.314462618 * 298.15));
      if (!r || r.modo !== 'dG' || Math.abs(r.Kp / Kp - 1) > 1e-3) mal('Termoquímica · Equilibrio no calcula Kp = e^(−ΔG°/RT) ≈ ' + Kp.toExponential(3) + ': ' + JSON.stringify(r));
    }
    await page.close();
    if (fallos === antes) console.log('  ✓ Termoquímica · «Calcular K en Equilibrio»: el enlace lleva reactivos, productos y ΔG° y Equilibrio da Kp = e^(−ΔG°/RT)');
  };
};
