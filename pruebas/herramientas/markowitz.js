/* Comprobación de la Cartera de Markowitz y CAPM: cálculos en Node (fórmulas cerradas de 2 activos y
   búsqueda por fuerza bruta) y la página en Chromium.
   La carga pruebas/comprobar.js (node pruebas/comprobar.js --solo markowitz). */
module.exports = ({ fs, path, fuente, publico, args, mal: avisa, pagina }) => {
  let fallos = 0;
  const mal = (m) => { fallos++; avisa(m); };
  const Com = require('./comun/calculadora.js'), N = 'Cartera de Markowitz y CAPM';
  const C = require(path.join(fuente, 'markowitz', 'calculo.js'));
  {
    const antes = fallos, { cerca, error, ej } = Com.node(N, mal, C);
    // dos activos (σ₁ = 20 %, σ₂ = 10 %, ρ = 0,3): w₁ de mínima varianza = (σ₂² − ρσ₁σ₂)/(σ₁² + σ₂² − 2ρσ₁σ₂)
    const d = ej('dos'), s1 = 0.2, s2 = 0.1, rho = 0.3, den = s1 * s1 + s2 * s2 - 2 * rho * s1 * s2, w1 = (s2 * s2 - rho * s1 * s2) / den;
    cerca(d.mv.w[0], w1, 1e-12, 'peso del primer activo en mínima varianza');
    cerca(d.mv.w[0], 0.004 / 0.038, 1e-12, 'w₁ de mínima varianza (0,004/0,038)'); cerca(d.mv.sg * d.mv.sg, w1 * w1 * s1 * s1 + (1 - w1) ** 2 * s2 * s2 + 2 * w1 * (1 - w1) * rho * s1 * s2, 1e-14, 'varianza de la mínima varianza');
    // tangente de 2 activos (fórmula): w₁ = [(μ₁−rf)σ₂² − (μ₂−rf)ρσ₁σ₂] / [(μ₁−rf)σ₂² + (μ₂−rf)σ₁² − (μ₁−rf+μ₂−rf)ρσ₁σ₂]
    const a = 0.08, b = 0.04, wt = (a * s2 * s2 - b * rho * s1 * s2) / (a * s2 * s2 + b * s1 * s1 - (a + b) * rho * s1 * s2);
    cerca(d.tg.w[0], wt, 1e-12, 'peso del primer activo en la tangente'); cerca(d.tg.sharpe, (d.tg.mu - 0.02) / d.tg.sg, 1e-12, 'Sharpe');
    // sin ventas en corto, los pesos no son negativos y suman 1
    for (const c of ['dos', 'tres', 'negativa']) {
      const r = ej(c);
      for (const [q, p] of [['mínima varianza', r.mv], ['tangente', r.tg], ['objetivo', r.obj]]) if (p) { cerca(p.w.reduce((x, y) => x + y, 0), 1, 1e-9, `suma de pesos (${q}, ${c})`); if (p.w.some((x) => x < -1e-9)) mal(`${N} · ${c}: pesos negativos en ${q} sin ventas en corto`); }
    }
    // fuerza bruta (rejilla de pesos) para 3 activos sin ventas en corto: no puede mejorar la mínima varianza, la tangente ni la cartera objetivo
    const t = ej('tres'), rf = t.rf, paso = 0.005;
    let mejorV = Infinity, mejorS = -Infinity, mejorObj = Infinity;
    for (let x = 0; x <= 1 + 1e-9; x += paso) for (let y = 0; x + y <= 1 + 1e-9; y += paso) {
      const w = [x, y, Math.max(0, 1 - x - y)];
      const mu = w.reduce((s, v, i) => s + v * t.mu[i], 0), v = w.reduce((s, vi, i) => s + w.reduce((u, vj, j) => u + vi * vj * t.cov[i][j], 0), 0);
      mejorV = Math.min(mejorV, v); mejorS = Math.max(mejorS, (mu - rf) / Math.sqrt(v)); if (mu >= t.m0 - 1e-12) mejorObj = Math.min(mejorObj, v);
    }
    if (!(t.mv.sg * t.mv.sg <= mejorV + 1e-12 && t.mv.sg * t.mv.sg >= mejorV - 1e-5)) mal(`${N} · tres: mínima varianza ${t.mv.sg ** 2} frente a la rejilla ${mejorV}`);
    if (!(t.tg.sharpe >= mejorS - 1e-12 && t.tg.sharpe <= mejorS + 1e-3)) mal(`${N} · tres: Sharpe ${t.tg.sharpe} frente a la rejilla ${mejorS}`);
    if (!(t.obj.sg * t.obj.sg <= mejorObj + 1e-9 && t.obj.sg * t.obj.sg >= mejorObj - 2e-5)) mal(`${N} · tres: la cartera objetivo (${t.obj.sg ** 2}) no mejora la rejilla (${mejorObj})`);
    cerca(t.obj.mu, 0.08, 1e-9, 'rentabilidad de la cartera objetivo');
    // con ventas en corto y mercado = tangente, todos los activos quedan sobre la SML (α = 0) y β de la tangente = 1
    const c = ej('corto');
    c.alfa.forEach((x, i) => cerca(x, 0, 1e-9, `alfa del activo ${i + 1} con ventas en corto`));
    cerca(c.beta.reduce((s, b, i) => s + b * c.tg.w[i], 0), 1, 1e-9, 'β de la cartera tangente');
    cerca(c.obj.mu, 0.10, 1e-9, 'rentabilidad objetivo con ventas en corto');
    // la varianza en la frontera crece con la rentabilidad en la rama eficiente, y la mínima varianza es el menor riesgo de la frontera
    const ef = c.frontera.ef.map((p) => p[0]); if (ef.some((x, i) => i && x < ef[i - 1] - 1e-12)) mal(`${N}: la rama eficiente no es creciente en riesgo`);
    cerca(Math.min(...c.frontera.ineficiente.map((p) => p[0]), ...ef), c.mv.sg, 1e-9, 'riesgo mínimo de la frontera');
    // sin ventas en corto, con la tangente de mercado los activos fuera de la cartera tienen α ≤ 0 y los de dentro α = 0
    t.alfa.forEach((x, i) => { if (t.tg.w[i] > 1e-9) cerca(x, 0, 1e-9, `alfa de un activo dentro de la tangente (${i + 1})`); else if (x > 1e-9) mal(`${N}: α > 0 en un activo fuera de la tangente`); });
    // CAPM con pesos de mercado dados: β del propio mercado = 1; la SML pasa por rf y por el mercado
    const m = ej('capm');
    cerca(m.beta.reduce((s, b, i) => s + b * m.mer.w[i], 0), 1, 1e-12, 'β del mercado dado'); cerca(m.mer.w[0], 0.5, 1e-12, 'pesos de mercado normalizados');
    cerca(m.req[0], 0.025 + m.beta[0] * (m.mer.mu - 0.025), 1e-12, 'rentabilidad exigida');
    // diversificación: con ρ < 0 el riesgo de la mínima varianza es menor que el de cualquier activo
    const g = ej('negativa'); if (!(g.mv.sg < Math.min(...g.sg))) mal(`${N}: con correlación negativa la mínima varianza debería ser menor que el menor riesgo individual`);
    // correlación ±1 con dos activos (σ₁ = 20 %, σ₂ = 10 %, μ₁ = 12 %, μ₂ = 6 %)
    { const m1 = ej('rho-menos-uno');
      cerca(m1.mv.w[0], 1 / 3, 1e-12, 'w₁ sin riesgo con ρ = −1 (σ₂/(σ₁+σ₂))'); cerca(m1.mv.sg, 0, 1e-12, 'riesgo cero con ρ = −1'); cerca(m1.mv.mu, 0.08, 1e-12, 'rentabilidad de la cartera sin riesgo (8 %)');
      if (!m1.arbitraje || m1.tg) mal(`${N}: con la cartera sin riesgo al 8 % y rf = 2 % hay arbitraje y no hay tangente`);
      cerca(m1.obj.w[0], 0.5, 1e-12, 'peso para el 9 % con ρ = −1'); cerca(m1.obj.sg, 0.05, 1e-12, 'riesgo para el 9 % con ρ = −1 (|0,5·20 − 0,5·10|)');
      const sv = C.resolver({ ...C.ejemplos.find((e) => e.clave === 'rho-menos-uno').sc, rf: '8' }); if (sv.arbitraje || !sv.tg) mal(`${N}: con rf = 8 % no hay arbitraje y la tangente es el activo X`); else cerca(sv.tg.w[0], 1, 1e-12, 'tangente con ρ = −1 y rf = 8 %');
      const m2 = ej('rho-uno'); cerca(m2.mv.w[1], 1, 1e-12, 'con ρ = 1 sin ventas la mínima varianza es el activo menos arriesgado'); cerca(m2.obj.sg, 0.15, 1e-12, 'riesgo para el 9 % con ρ = 1 (0,5·20 + 0,5·10)'); cerca(m2.tg.sharpe, 0.5, 1e-12, 'Sharpe con ρ = 1');
      const cv = C.resolver({ ...C.ejemplos.find((e) => e.clave === 'rho-uno').sc, ventas: 'si', objetivo: '' }); cerca(cv.mv.sg, 0, 1e-12, 'con ρ = 1 y ventas en corto hay cartera sin riesgo'); cerca(cv.mv.w[0], -1, 1e-12, 'peso −1 en X'); cerca(cv.mv.w[1], 2, 1e-12, 'peso 2 en Y');
      // el riesgo calculado con la fórmula general de la varianza coincide
      const w = m2.obj.w; cerca(m2.obj.sg, Math.sqrt(w[0] ** 2 * 0.04 + w[1] ** 2 * 0.01 + 2 * w[0] * w[1] * 0.2 * 0.1), 1e-12, 'varianza con ρ = 1 por la fórmula general'); }
    // errores
    const b0 = C.ejemplos[0].sc;
    error({ ...C.ejemplos.find((e) => e.clave === 'tres').sc, corr: '1 1 1\n1 1 1\n1 1 1' }, 'correlación 1 con tres activos (matriz singular)'); error({ ...b0, corr: '1 0,3\n0,4 1' }, 'matriz no simétrica'); error({ ...b0, corr: '1 1,2\n1,2 1' }, 'correlación mayor que 1');
    error({ ...b0, corr: '1 0,3 0,1\n0,3 1 0\n0,1 0 1' }, 'matriz de tamaño distinto'); error({ ...b0, activos: 'Solo; 5; 10' }, 'un único activo'); error({ ...b0, activos: 'A; 5; 0\nB; 6; 10' }, 'volatilidad 0');
    error({ ...b0, activos: 'A; 5; 10\nB; 5; 20' }, 'misma rentabilidad'); error({ ...b0, rf: '' }, 'sin tipo sin riesgo'); error({ ...b0, objetivo: '30' }, 'objetivo fuera del rango sin ventas en corto'); error({ ...b0, mercado: '1 2 3' }, 'pesos de mercado de otro tamaño');
    // tangente inexistente: rf mayor que todas las rentabilidades
    const sinTg = C.resolver({ ...b0, rf: '12' }); if (sinTg.tg || sinTg.beta) mal(`${N}: con rf = 12 % no debería haber tangente ni CAPM por defecto`);
    if (fallos === antes) console.log(`  ✓ ${N}: ${C.ejemplos.length} ejemplos, mínima varianza, tangente y objetivo (frente a fórmulas y rejilla), CAPM y errores`);
  }
  return Com.navegador({ publico, carpeta: 'markowitz', nombre: N, app: 'MarkowitzApp', C, pagina, mal, malo: { k: 'rf', v: 'abc' } });
};
