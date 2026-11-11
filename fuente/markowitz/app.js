/* =====================================================================
   Interfaz de la Cartera de Markowitz y CAPM: activos y correlaciones,
   resultados de las carteras notables, la tabla de pesos y de CAPM, la
   gráfica (frontera eficiente con la línea del mercado de capitales, o la
   línea del mercado de valores) y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en markowitz/calculo.js
   (Markowitz).
   ===================================================================== */
(() => {
  const P = Markowitz, { f, pct } = Eco, esc = Herramienta.esc, num = Eco.num;
  const p2 = (x) => num(100 * x, 2);
  Calculadora.monta({
    C: P, carpeta: 'markowitz', app: 'MarkowitzApp', azar: P.azar, enunciado: P.enunciado,
    acciones: (s) => (s.tg ? [{ texto: `Usar la rentabilidad de la cartera tangente (${f(100 * s.tg.mu, 4)} %) como objetivo`, cambios: { objetivo: (100 * s.tg.mu).toFixed(4).replace('.', ',') } }] : []),
    nota: 'Una línea por activo: «Nombre; rentabilidad esperada %; volatilidad %». Después, la matriz de correlaciones (una fila por línea, 1 en la diagonal). Sin pesos de mercado, el CAPM usa la cartera tangente como mercado.',
    campos: () => [
      { k: 'activos', nom: 'Activos', tipo: 'area', filas: 5, sep: 'Activos' },
      { k: 'corr', nom: 'Matriz de correlaciones', tipo: 'area', filas: 5 },
      { k: 'rf', nom: 'Tipo sin riesgo rf', un: '%', sep: 'Mercado' },
      { k: 'ventas', nom: 'Ventas en corto', tipo: 'sel', ops: [['no', 'No permitidas (pesos ≥ 0)'], ['si', 'Permitidas']] },
      { k: 'objetivo', nom: 'Rentabilidad objetivo', un: '%', ayuda: 'opcional' },
      { k: 'mercado', nom: 'Pesos de mercado', tipo: 'texto', ayuda: 'opcional, uno por activo' },
      { k: 'grafico', nom: 'Gráfica', tipo: 'sel', ops: [['frontera', 'Frontera eficiente y CML'], ['sml', 'Línea del mercado de valores (SML)']] },
    ],
    resumen: (s) => {
      const r = [['Modo', s.ventas ? 'Con ventas en corto (pesos negativos permitidos)' : 'Sin ventas en corto (pesos ≥ 0)', true], ['Mínima varianza', `${pct(s.mv.mu)} · σ ${pct(s.mv.sg)}`]];
      r.push(['Cartera tangente', s.tg ? `${pct(s.tg.mu)} · σ ${pct(s.tg.sg)}` : 'no existe']);
      r.push(['Ratio de Sharpe', s.tg ? f(s.tg.sharpe, 4) : '—']);
      if (s.obj) r.push([`Para ${pct(s.m0)}`, `σ ${pct(s.obj.sg)}`]);
      if (s.mer) r.push(['Mercado (CAPM)', `${pct(s.mer.mu)} · σ ${pct(s.mer.sg)}`]);
      return r;
    },
    tabla: (s) => {
      const cols = [['Mínima varianza', s.mv.w], ...(s.tg ? [['Tangente', s.tg.w]] : []), ...(s.obj ? [[`Objetivo ${pct(s.m0, 1)}`, s.obj.w]] : []), ...(s.mer && s.merTipo === 'dado' ? [['Mercado', s.mer.w]] : [])];
      const t1 = `<table class="tabla-eco"><thead><tr><th>Pesos</th>${cols.map((c) => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${s.nombres.map((n, i) => `<tr><td>${esc(n)}</td>${cols.map((c) => `<td>${p2(c[1][i])} %</td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr><td>Rentabilidad</td>${cols.map((c, k) => `<td>${p2([s.mv, ...(s.tg ? [s.tg] : []), ...(s.obj ? [s.obj] : []), ...(s.mer && s.merTipo === 'dado' ? [s.mer] : [])][k].mu)} %</td>`).join('')}</tr></tfoot></table>`;
      if (!s.beta) return t1;
      const t2 = `<table class="tabla-eco" style="margin-top:14px"><thead><tr><th>CAPM</th><th>β</th><th>Exigida</th><th>Esperada</th><th>α</th></tr></thead><tbody>${s.nombres.map((n, i) => `<tr><td>${esc(n)}</td><td>${num(s.beta[i], 4)}</td><td>${p2(s.req[i])} %</td><td>${p2(s.mu[i])} %</td><td>${Math.abs(s.alfa[i]) < 5e-5 ? '' : s.alfa[i] > 0 ? '+' : '−'}${p2(Math.abs(s.alfa[i]))} %</td></tr>`).join('')}</tbody></table>`;
      return t1 + t2;
    },
    grafica: (s) => {
      const pc = (a) => a.map(([x, y]) => [100 * x, 100 * y]);
      if (s.grafico === 'sml' && s.beta) {
        const bmax = Math.max(1.2, ...s.beta) * 1.1, bmin = Math.min(0, ...s.beta), y = (b) => 100 * (s.rf + b * (s.mer.mu - s.rf));
        const ys = [y(bmin), y(bmax), ...s.mu.map((m) => 100 * m)];
        return { x: [bmin, bmax], y: Eco.rango(ys), fx: (v) => num(v, 1), fy: (v) => num(v, 1), ejeX: 'Beta β', ejeY: 'Rentabilidad (%)',
          series: [{ pts: [[bmin, y(bmin)], [bmax, y(bmax)]], color: '--serie-3' }, { tipo: 'puntos', pts: s.beta.map((b, i) => [b, 100 * s.mu[i]]), color: '--serie-2', radio: 5 }, { tipo: 'puntos', pts: [[1, 100 * s.mer.mu]], color: '--serie-1', radio: 6 }, { tipo: 'puntos', pts: [[0, 100 * s.rf]], color: '--ink', radio: 4 }],
          etiquetas: s.nombres.map((n, i) => ({ x: s.beta[i], y: 100 * s.mu[i], texto: n, color: '--ink' })).concat([{ x: 1, y: 100 * s.mer.mu, texto: 'Mercado', color: '--serie-1' }]) };
      }
      const ef = pc(s.frontera.ef), ine = pc(s.frontera.ineficiente), xs = [...s.sg.map((x) => 100 * x), ...ef.map((p) => p[0]), ...ine.map((p) => p[0])];
      const xmax = Math.max(...xs) * 1.12, cml = s.tg ? [[0, 100 * s.rf], [Math.min(xmax, 150 * s.tg.sg), 100 * (s.rf + s.tg.sharpe * Math.min(xmax / 100, 1.5 * s.tg.sg))]] : null;
      const ys = [...s.mu.map((x) => 100 * x), 100 * s.rf, ...ef.map((p) => p[1]), ...ine.map((p) => p[1]), ...(cml ? cml.map((p) => p[1]) : [])];
      const series = [{ pts: ine, color: '--serie-1', discontinua: true }, { pts: ef, color: '--serie-1' }];
      if (cml) series.push({ pts: cml, color: '--serie-3', discontinua: true });
      series.push({ tipo: 'puntos', pts: s.sg.map((x, i) => [100 * x, 100 * s.mu[i]]), color: '--ink', radio: 4 }, { tipo: 'puntos', pts: [[100 * s.mv.sg, 100 * s.mv.mu]], color: '--serie-2', radio: 6 });
      if (s.tg) series.push({ tipo: 'puntos', pts: [[100 * s.tg.sg, 100 * s.tg.mu]], color: '--serie-3', radio: 6 });
      if (s.obj) series.push({ tipo: 'puntos', pts: [[100 * s.obj.sg, 100 * s.obj.mu]], color: '--ink', radio: 6 });
      return { x: [0, xmax], y: Eco.rango(ys), fx: (v) => num(v, 0), fy: (v) => num(v, 1), ejeX: 'Riesgo σ (%)', ejeY: 'Rentabilidad esperada (%)', series,
        etiquetas: s.nombres.map((n, i) => ({ x: 100 * s.sg[i], y: 100 * s.mu[i], texto: n, color: '--ink' })) };
    },
    leyenda: (s) => s.grafico === 'sml' && s.beta
      ? `La <b style="color:var(--serie-3)">SML</b> es la rentabilidad que exige el mercado según la beta: ${pct(s.rf)} + β·(${pct(s.mer.mu)} − ${pct(s.rf)}). Un activo por encima (α > 0) rinde más de lo exigido; por debajo (α < 0), menos.`
      : `<b style="color:var(--serie-1)">Azul</b>: frontera eficiente (la rama discontinua es ineficiente). <b style="color:var(--serie-2)">Punto rojo</b>: mínima varianza.${s.tg ? ' <b style="color:var(--serie-3)">Morado</b>: cartera tangente y su línea del mercado de capitales, que se alcanza mezclándola con el activo sin riesgo.' : ''} Puntos negros: cada activo suelto.`,
  });
})();
