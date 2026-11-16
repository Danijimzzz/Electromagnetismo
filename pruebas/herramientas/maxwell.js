/* Comprobación de Ecuaciones de Maxwell: cálculos en Node (a mano) y la página en Chromium. La carga
   pruebas/comprobar.js (node pruebas/comprobar.js --solo maxwell ejecuta solo esta). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };

  const C = require(path.join(fuente, 'maxwell', 'calculo.js'));
  {
    const antes = fallos, cerca = (a, b, tol, q) => { if (!(Math.abs(a - b) <= tol * Math.max(1e-300, Math.abs(b)))) mal(`Maxwell · ${q}: ${a} en vez de ${b}`); };
    const r = (c) => C.resolver(C.ejemplos.find((e) => e.clave === c).sc);
    const e0 = 8.8541878128e-12, mu0 = 1.25663706212e-6;
    // Gauss: Φ = Q/ε₀ fuera; dentro solo la parte (r/R)³; E = Q/(4πε₀r²) y Q·r/(4πε₀R³)
    let s = r('esfera-fuera'); cerca(s.Phi, 2e-9 / e0, 1e-12, 'flujo fuera'); cerca(s.E, (2e-9 / e0) / (4 * Math.PI * 0.09), 1e-12, 'E fuera'); if (s.dentro) mal('Maxwell: r = 0,3 > R debería estar fuera');
    s = r('esfera-dentro'); cerca(s.Qint, 2e-9 / 8, 1e-12, 'carga encerrada dentro'); cerca(s.Phi, 2e-9 / 8 / e0, 1e-12, 'flujo dentro'); cerca(s.E, (2e-9 * 0.05) / (4 * Math.PI * e0 * 0.001), 1e-12, 'E dentro');
    // Gauss para B: el total es 0 y las caras opuestas tienen signo contrario
    s = r('cubo'); cerca(s.caras[0].v, 0.2 * 0.25, 1e-12, 'flujo cara +x'); cerca(s.caras[3].v, 0.1 * 0.25, 1e-12, 'flujo cara −y (B_y < 0 sale positivo)'); if (Math.abs(s.total) > 1e-15) mal(`Maxwell: el flujo total de B no es 0 (${s.total})`);
    // Continuidad: τ = ε/σ y ρ(t) = ρ₀ e^(−t/τ)
    s = r('relajacion-agua'); { const tau = (80 * e0) / 5.5e-6; cerca(s.tau, tau, 1e-12, 'τ del agua destilada'); cerca(s.rt, 10e-6 * Math.exp(-2e-4 / tau), 1e-12, 'ρ(t) del agua'); cerca(s.th, tau * Math.LN2, 1e-12, 'tiempo para la mitad'); cerca(s.ratio, 5.5e-6 / (2 * Math.PI * 1e3 * 80 * e0), 1e-12, 'σ/ωε del agua a 1 kHz'); }
    s = r('relajacion-cobre'); cerca(s.tau, e0 / 5.96e7, 1e-12, 'τ del cobre'); if (!(s.tau < 1e-18) || !(s.ratio > 1e6)) mal('Maxwell: el cobre debería relajarse en menos de 10⁻¹⁸ s y ser buen conductor a 1 GHz');
    for (const mala of [{ sigma: '0' }, { sigma: '' }, { er: '0.5' }, { rho0: '0' }, { t: '-1' }]) { let ok = false; try { C.resolver({ ...C.ejemplos.find((e) => e.clave === 'relajacion-agua').sc, ...mala }); } catch (e) { ok = true; } if (!ok) mal(`Maxwell: ${JSON.stringify(mala)} en continuidad debería dar error`); }
    // Faraday: ε_máx = N·B₀·A·ω = 200·0,1·0,002·2π·50
    s = r('bobina'); cerca(s.emax, 200 * 0.1 * 0.002 * 2 * Math.PI * 50, 1e-12, 'fem máxima'); cerca(s.Phi0, 0.04, 1e-12, 'amplitud del flujo');
    // Ampère–Maxwell: B = μ₀ I r /(2πR²) dentro y μ₀ I/(2π r) fuera; I_d = I fuera
    s = r('condensador-dentro'); cerca(s.B, (mu0 * 2 * 0.02) / (2 * Math.PI * 0.0025), 1e-12, 'B dentro del condensador'); cerca(s.Id, 2 * 0.16, 1e-12, 'I_d dentro'); cerca(s.dEdt, 2 / (e0 * Math.PI * 0.0025), 1e-12, 'dE/dt');
    s = r('condensador-fuera'); cerca(s.B, (mu0 * 2) / (2 * Math.PI * 0.1), 1e-12, 'B fuera del condensador'); cerca(s.Id, 2, 1e-12, 'I_d fuera = I');
    // Onda: c = 1/√(μ₀ε₀), B₀ = E₀/c, λ = c/f, I = E₀²/(2μ₀c)
    s = r('fm'); cerca(s.c, 299792458, 1e-8, 'c'); cerca(s.B0, 1 / s.c, 1e-12, 'B₀'); cerca(s.lam, s.c / 1e8, 1e-12, 'λ'); cerca(s.I, 1 / (2 * mu0 * s.c), 1e-12, 'intensidad');
    for (const x of C.ejemplos) { try { const q = C.resolver(x.sc); if (q.pasos.length < 4 || !q.grafica) mal(`Maxwell · ${x.clave}: desarrollo o gráfica incompletos`); } catch (err) { mal(`Maxwell · ${x.clave}: ${err.message}`); } }
    for (const [sc, q] of [[{ modo: 'gauss', Q: '', R: '1', r: '1' }, 'falta la carga'], [{ modo: 'gauss', Q: '0', R: '1', r: '1' }, 'carga cero'], [{ modo: 'gaussmag', Bx: '0', By: '0', Bz: '0', L: '1' }, 'B nulo'], [{ modo: 'faraday', B0: '1', fr: '50', A: '1', N: '1,5' }, 'espiras no enteras'], [{ modo: 'ampere', I: '1', R: '0', r: '1' }, 'radio cero'], [{ modo: 'onda', E0: '1', fr: '-1' }, 'frecuencia negativa'], [{ modo: 'otra' }, 'ecuación inexistente']]) {
      let ok = false; try { C.resolver(sc); } catch (e) { ok = true; }
      if (!ok) mal(`Maxwell: ${q} no da error`);
    }
    // MX-1 campos: onda plana (con B = E/c) cumple las cuatro; con B mal escalado fallan Faraday y Ampère; Coulomb fuera del origen cumple
    { const ok = (c) => r(c).eqs.map((q) => q.ok), base = C.ejemplos.find((e) => e.clave === 'campo-onda').sc;
      if (ok('campo-onda').some((x) => !x) || !r('campo-onda').ok) mal('Maxwell · MX-1: la onda plana debería cumplir las cuatro');
      const mal2 = r('campo-mal'); if (mal2.eqs.map((q) => q.n + q.ok).join() !== 'Gauss para Etrue,Gauss para Btrue,Faradayfalse,Ampère–Maxwellfalse') mal('Maxwell · MX-1: B mal escalado debería fallar Faraday y Ampère: ' + mal2.eqs.map((q) => q.n + q.ok));
      if (!r('campo-coulomb').ok) mal('Maxwell · MX-1: el campo de una carga puntual debería cumplir todo fuera del origen');
      if (r('campo-uniforme').eqs[0].ok || r('campo-uniforme').conB) mal('Maxwell · MX-1: E = 5x sin carga debería fallar Gauss y no dar veredicto sin B');
      cerca(r('campo-uniforme').eqs[0].rel, 1, 1e-9, 'residuo relativo de E = 5x sin carga'); if (!r('campo-rho').ok) mal('Maxwell · MX-1: E = 5x con ρ = 5ε₀ debería cumplir');
      const g = (extra) => C.resolver({ ...base, ...extra });
      if (g({ Bx: 'x', By: '0', Bz: '0' }).eqs[1].ok) mal('Maxwell · MX-1: B = (x, 0, 0) tiene divergencia 1 y debería fallar Gauss para B');
      if (g({ Ey: '100 cos(2 t - z)', Bx: '-100 cos(2 t - z)/2' }).ok) mal('Maxwell · MX-1: una onda con ω ≠ ck debería fallar');
      // corriente: E = 0, B = (0, x, 0)·? ∇×B = (0, 0, 1)·... B = (0, x, 0) → rot B = (0, 0, 1): J = 1/μ0 en z
      const est = C.resolver({ modo: 'campo', Ex: '0', Ey: '0', Ez: '0', Bx: '0', By: 'x', Bz: '0', Jz: '795774.715', rho: '', Jx: '', Jy: '' }); cerca(est.eqs[3].rel + 1, 1, 1e-5, 'Ampère estático con J = 1/μ₀'); if (!est.eqs[3].ok) mal('Maxwell · MX-1: ∇×B = μ₀J estático debería cumplir con J = 1/μ₀');
      cerca(g({ Ey: '100 cos(299792458 t - z)' }).eqs.length, 4, 0, 'cuatro ecuaciones con B');
      for (const mala of [{ Ex: '', Ey: '', Ez: '' }, { Ey: '100 cos(w t)' }, { Ey: 'sen(' }, { Ey: '1/(x-x)' }]) { let hay = false; try { g(mala); } catch (e) { hay = true; } if (!hay) mal(`Maxwell · MX-1: ${JSON.stringify(mala)} debería dar error`); }
    }
    if (fallos === antes) console.log(`  ✓ Maxwell: ${C.ejemplos.length} ejemplos a mano (Gauss, Faraday, Ampère–Maxwell, onda) y errores`);
  }

  return async (browser) => {
    const { page, consola } = await pagina(browser, 1200, 900);
    await page.goto('file://' + path.join(publico, 'electromagnetismo', 'maxwell', 'index.html'));
    await page.waitForFunction(() => window.MaxwellApp);
    const antes = fallos;
    const ver = (await page.locator('#ver').textContent()).trim();
    if (ver !== Version.de('maxwell').current) mal(`Maxwell: la página muestra la versión «${ver}», se esperaba ${Version.de('maxwell').current}`);
    for (const e of C.ejemplos) {
      await page.evaluate((c) => MaxwellApp.abrirEjemplo(c), e.clave);
      const r = await page.evaluate(() => ({ err: !document.querySelector('#error').hidden, pasos: document.querySelectorAll('#pasos li').length, mathml: document.querySelectorAll('#pasos math').length, dolar: /\$/.test(document.querySelector('#pasos').textContent), res: document.querySelectorAll('#res > div').length, modo: document.querySelector('#modo').value }));
      if (r.err || !r.pasos || !r.res) mal(`Maxwell · ${e.clave}: falta el resultado o el desarrollo`);
      if (!r.mathml || r.dolar) mal(`Maxwell · ${e.clave}: el desarrollo no sale en MathML`);
      if (r.modo !== e.sc.modo) mal(`Maxwell · ${e.clave}: el selector de ecuación no sigue al ejemplo`);
    }
    // cambiar de ecuación con el selector, y la teoría: cuatro ecuaciones, la continuidad y la onda con sus enlaces a los simuladores
    await page.selectOption('#modo', 'faraday');
    if (!(await page.locator('#f-N').count())) mal('Maxwell: al elegir Faraday no salen sus datos');
    const teoria = await page.evaluate(() => ({ eq: document.querySelectorAll('.eq').length, math: document.querySelectorAll('.eq math').length, enlaces: [...document.querySelectorAll('.eq .enl a')].map((a) => a.getAttribute('href')) }));
    if (teoria.eq !== 6 || teoria.math < 11) mal('Maxwell: la teoría no muestra las ecuaciones en MathML');
    for (const h of ['../electrostatica/', '../magnetostatica/', '../faraday/', '../ondas-em/']) if (!teoria.enlaces.includes(h)) mal(`Maxwell: falta el enlace a ${h}`);
    await page.click('.eq[data-modo="ampere"]');
    if ((await page.locator('#modo').inputValue()) !== 'ampere') mal('Maxwell: pulsar una ecuación no abre su calculadora');
    await page.fill('#f-R', '0');
    if (await page.locator('#error').isHidden()) mal('Maxwell: un radio cero no muestra el error');
    await page.close();
    if (consola.length) mal('Maxwell: consola del navegador:\n      ' + consola.join('\n      '));
    if (fallos === antes) console.log(`  ✓ Maxwell: ${C.ejemplos.length} ejemplos en la página con MathML, cambio de ecuación, enlaces y errores, sin errores de consola`);
  };
};
