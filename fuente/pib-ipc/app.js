/* =====================================================================
   Interfaz de PIB, IPC e inflación: lo que se calcula (PIB nominal y real,
   deflactar con el IPC o los agregados), la gráfica (PIB nominal y real por
   año, la serie en euros corrientes y constantes, o los componentes del
   gasto), la tabla y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en pib-ipc/calculo.js (PibIpc).
   ===================================================================== */
(() => {
  const P = PibIpc, { f, num } = Eco;
  const pc = (x) => (x === null || x === undefined ? '—' : `${f(100 * x, 4)} %`);
  const num2 = (x) => String(+x.toFixed(2)).replace('.', ',');
  // «Usar en…»: el PIB real (a precios del año base) como serie para Números índice, con el mismo año base
  const enlacesDe = (s) => (s.modo === 'pib' && s.anos.length >= 2 ? [{ carpeta: 'numeros-indice', texto: 'Ver el PIB real como número índice →', estado: { modo: 'serie', datos: s.anos.map((x) => `${String(x.a).replace('.', ',')} ${num2(x.real)}`).join('\n'), base: String(s.base).replace('.', ',') } }] : []);
  Calculadora.monta({
    usarEn: enlacesDe,
    C: P, carpeta: 'pib-ipc', app: 'PibIpcApp', azar: P.azar, enunciado: P.enunciado,
    nota: 'En las tablas, una fila por línea con los números separados por espacios, tabuladores o «;»; se salta una primera fila con nombres. La coma es decimal.',
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(P.MODOS) }];
      if (sc.modo === 'deflactar') return [...cs, { k: 'serie', nom: 'Año, valor e IPC', tipo: 'area', filas: 7, ayuda: 'una línea por año: «2022 21500 111,8»' }, { k: 'ref', nom: 'Euros del año' }];
      if (sc.modo === 'agregados') return [...cs, { k: 'c', nom: 'Consumo C' }, { k: 'i', nom: 'Inversión I' }, { k: 'g', nom: 'Gasto público G' }, { k: 'x', nom: 'Exportaciones X' }, { k: 'm', nom: 'Importaciones M' },
        { k: 'rfn', nom: 'Rentas netas del exterior' }, { k: 'amort', nom: 'Amortizaciones' }, { k: 'tin', nom: 'Impuestos indirectos − subvenciones' }];
      return [...cs, { k: 'anos', nom: 'Años', ayuda: 'separados por espacios' }, { k: 'base', nom: 'Año base' }, { k: 'bienes', nom: 'Bienes: p y q de cada año', tipo: 'area', filas: 6, ayuda: 'una línea por bien: «p q» del primer año, «p q» del segundo…' }];
    },
    resumen: (s) => {
      if (s.modo === 'agregados') return [['PIB a precios de mercado', num(s.pib)], ['PNB', num(s.pnb)], ['PNN', num(s.pnn)], ['Renta nacional', num(s.rn)]];
      if (s.modo === 'deflactar') { const u = s.filas[s.filas.length - 1]; return [[`Último valor en euros de ${f(s.ref)}`, num(u.real), true], ['Variación nominal', pc(s.tN)], ['Variación real', pc(s.tR)], ['Inflación del último año', pc(u.infl)]]; }
      const u = s.anos[s.anos.length - 1];
      return [[`PIB nominal ${f(u.a)}`, num(u.nom)], [`PIB real ${f(u.a)}`, num(u.real)], ['Deflactor', f(u.def, 5)], ['Crecimiento real del último año', pc(u.crec)], ['Inflación (deflactor)', pc(u.infl)]];
    },
    tabla: (s) => (s.modo === 'agregados' ? ''
      : s.modo === 'deflactar'
        ? `<table class="tabla-eco"><thead><tr><th>Año</th><th>Nominal</th><th>IPC</th><th>Inflación</th><th>Real (euros de ${f(s.ref)})</th><th>Crecimiento real</th></tr></thead><tbody>${s.filas.map((r) => `<tr><td>${f(r.a)}</td><td>${num(r.x)}</td><td>${f(r.ipc, 6)}</td><td>${pc(r.infl)}</td><td>${num(r.real)}</td><td>${pc(r.crecReal)}</td></tr>`).join('')}</tbody></table>`
        : `<table class="tabla-eco"><thead><tr><th>Año</th><th>PIB nominal</th><th>PIB real</th><th>Deflactor</th><th>Crecimiento real</th><th>Inflación</th></tr></thead><tbody>${s.anos.map((r) => `<tr><td>${f(r.a)}</td><td>${num(r.nom)}</td><td>${num(r.real)}</td><td>${f(r.def, 5)}</td><td>${pc(r.crec)}</td><td>${pc(r.infl)}</td></tr>`).join('')}</tbody></table>`),
    grafica: (s) => {
      if (s.modo === 'agregados') {
        const v = [['C', s.c], ['I', s.i], ['G', s.g], ['X − M', s.x - s.m], ['PIB', s.pib], ['PNB', s.pnb], ['PNN', s.pnn], ['RN', s.rn]];
        return { x: [0.4, 8.6], y: Eco.rango(v.map((p) => p[1]), { cero: true }), fx: (x) => (Number.isInteger(x) && x >= 1 && x <= 8 ? v[x - 1][0] : ''), fy: (y) => num(y, 0),
          series: [{ tipo: 'barras', pts: v.slice(0, 4).map((p, k) => [k + 1, p[1]]), color: '--serie-1', ancho: 0.6 }, { tipo: 'barras', pts: v.slice(4).map((p, k) => [k + 5, p[1]]), color: '--serie-2', ancho: 0.6 }] };
      }
      const F = s.modo === 'deflactar' ? s.filas.map((r) => ({ a: r.a, n: r.x, r: r.real })) : s.anos.map((r) => ({ a: r.a, n: r.nom, r: r.real }));
      const a0 = F[0].a, a1 = F[F.length - 1].a, d = (a1 - a0) / Math.max(1, F.length - 1);
      return { x: [a0 - 0.6 * d, a1 + 0.6 * d], y: Eco.rango(F.flatMap((x) => [x.n, x.r]), { cero: s.modo === 'pib' }), fx: (x) => (F.some((q) => Math.abs(q.a - x) < 1e-9) ? String(x) : ''), fy: (y) => num(y, 0),
        series: s.modo === 'pib'
          ? [{ tipo: 'barras', pts: F.map((x) => [x.a - 0.18 * d, x.n]), color: '--serie-2', ancho: 0.34 * d }, { tipo: 'barras', pts: F.map((x) => [x.a + 0.18 * d, x.r]), color: '--serie-1', ancho: 0.34 * d }]
          : [{ pts: F.map((x) => [x.a, x.n]), color: '--serie-2' }, { tipo: 'puntos', pts: F.map((x) => [x.a, x.n]), color: '--serie-2' }, { pts: F.map((x) => [x.a, x.r]), color: '--serie-1' }, { tipo: 'puntos', pts: F.map((x) => [x.a, x.r]), color: '--serie-1' }] };
    },
    leyenda: (s) => (s.modo === 'agregados' ? '<b>Azul</b>: los componentes del gasto. <b>Rojo</b>: del PIB a la renta nacional.' : s.modo === 'deflactar' ? `<b>Rojo</b>: en euros de cada año (nominal). <b>Azul</b>: en euros de ${f(s.ref)} (real).` : `<b>Rojo</b>: PIB nominal. <b>Azul</b>: PIB real, a precios de ${f(s.base)}. La diferencia es la subida de los precios.`),
  });
})();
