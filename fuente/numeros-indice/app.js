/* =====================================================================
   Interfaz de Números índice y tasas de variación: una serie (año y valor)
   con su base, o una cesta de productos con precios y cantidades de dos
   periodos; la gráfica del índice (o de los índices de cada producto con
   Laspeyres y Paasche), la tabla y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en
   numeros-indice/calculo.js (NumerosIndice).
   ===================================================================== */
(() => {
  const N = NumerosIndice, { f, num } = Eco;
  const pc = (x) => (x === null ? '—' : `${f(100 * x, 4)} %`), i2 = (x) => num(x, 2);
  Calculadora.monta({
    C: N, carpeta: 'numeros-indice', app: 'NumerosIndiceApp', azar: N.azar, enunciado: N.enunciado,
    nota: 'Una fila por línea, con los números separados por espacios, tabuladores o «;» (puedes pegarlos de una hoja de cálculo); se salta una primera fila con nombres. La coma es decimal.',
    campos: (sc) => [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(N.MODOS) },
      ...(sc.modo === 'empalme'
        ? [{ k: 'datos', nom: 'Serie antigua (A): periodo e índice', tipo: 'area', filas: 5, ayuda: 'una línea por periodo, por ejemplo «2019 105,3»' }, { k: 'datos2', nom: 'Serie nueva (B): periodo e índice', tipo: 'area', filas: 5 }, { k: 'empalme', nom: 'Periodo de empalme', ayuda: 'uno que esté en las dos (si lo dejas vacío, el último común)' }, { k: 'expresar', nom: 'Expresar en la base de', tipo: 'sel', ops: [['b', 'la serie nueva (B)'], ['a', 'la serie antigua (A)']] }]
        : sc.modo === 'cesta'
        ? [{ k: 'cesta', nom: 'Cesta: p₀ q₀ p₁ q₁', tipo: 'area', filas: 6, ayuda: 'un producto por línea: precio y cantidad antes y ahora' }]
        : [{ k: 'datos', nom: 'Serie: periodo y valor', tipo: 'area', filas: 7, ayuda: 'una línea por periodo, por ejemplo «2020 240»' }, { k: 'base', nom: 'Periodo base', ayuda: 'vale 100' }])],
    resumen: (s) => (s.modo === 'empalme'
      ? [['Coeficiente de empalme k', f(s.k, 6)], [`Periodo de empalme`, f(s.t)], [`Último índice (${f(s.filas[s.n].p)})`, i2(s.filas[s.n].x), true], ['Tasa acumulada', pc(s.ta)], ['Tasa media por periodo', pc(s.tm)]]
      : s.modo === 'cesta'
      ? [['Laspeyres (precios)', i2(s.L)], ['Paasche (precios)', i2(s.P)], ['Fisher', i2(s.F)], ['Índice de valor', i2(s.V)], ['Subida de precios (Laspeyres)', pc(s.L / 100 - 1)]]
      : [[`Índice del último periodo (base ${f(s.base)})`, i2(s.filas[s.n].i), true], ['Tasa de la última variación', pc(s.filas[s.n].tv)], ['Tasa acumulada', pc(s.ta)], ['Tasa media por periodo', pc(s.tm)]]),
    tabla: (s) => (s.modo === 'empalme'
      ? `<table class="tabla-eco"><thead><tr><th>Periodo</th><th>Índice empalmado</th><th>Procede de</th><th>Tasa de variación</th></tr></thead><tbody>${s.filas.map((r) => `<tr><td>${f(r.p)}</td><td>${i2(r.x)}</td><td>${r.origen === 'A' ? 'A (antigua)' : 'B (nueva)'}</td><td>${pc(r.tv)}</td></tr>`).join('')}</tbody></table>`
      : s.modo === 'cesta'
      ? `<table class="tabla-eco"><thead><tr><th>Producto</th><th>p₀</th><th>q₀</th><th>p₁</th><th>q₁</th><th>Índice de precio</th><th>Peso en el gasto</th></tr></thead><tbody>${s.productos.map((r) => `<tr><td>${r.k}</td><td>${num(r.p0)}</td><td>${f(r.q0)}</td><td>${num(r.p1)}</td><td>${f(r.q1)}</td><td>${i2(r.ip)}</td><td>${f(100 * r.w, 4)} %</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td colspan="4">∑p₀q₀ = ${num(s.p0q0)} · ∑p₁q₁ = ${num(s.p1q1)}</td><td>${i2(s.L)}</td><td>100 %</td></tr></tfoot></table>`
      : `<table class="tabla-eco"><thead><tr><th>Periodo</th><th>Valor</th><th>Índice (base ${f(s.base)})</th><th>Tasa de variación</th></tr></thead><tbody>${s.filas.map((r) => `<tr><td>${f(r.p)}</td><td>${f(r.x, 8)}</td><td>${i2(r.i)}</td><td>${pc(r.tv)}</td></tr>`).join('')}</tbody></table>`),
    grafica: (s) => {
      if (s.modo === 'cesta') {
        const pts = s.productos.map((r) => [r.k, r.ip]);
        return { x: [0.4, s.productos.length + 0.6], y: Eco.rango(pts.map((p) => p[1]).concat(100, s.L, s.P), { cero: true }), fx: (v) => (Number.isInteger(v) && v >= 1 && v <= s.productos.length ? `Producto ${v}` : ''), fy: (v) => f(v), ejeY: 'Índice de precio',
          series: [{ tipo: 'barras', pts, color: '--serie-1', ancho: 0.55, alfa: 0.7 }], horizontales: [{ y: 100, color: '--muted', texto: '100' }, { y: s.L, color: '--serie-2' }, { y: s.P, color: '--serie-3' }] };
      }
      if (s.modo === 'empalme') {
        const pa = s.filas.filter((r) => r.origen === 'A').map((r) => [r.p, r.x]), pb = s.filas.filter((r) => r.origen === 'B' || r.p === s.t).map((r) => [r.p, r.x]), todos = s.filas.map((r) => r.x);
        return { x: [s.filas[0].p - 0.3, s.filas[s.n].p + 0.3], y: Eco.rango(todos), fx: (v) => (Number.isInteger(v) ? String(v) : ''), fy: (v) => f(v), ejeY: `Índice (base de ${s.enB ? 'B' : 'A'})`,
          series: [{ pts: pa, color: '--serie-1' }, { tipo: 'puntos', pts: pa, color: '--serie-1' }, { pts: pb, color: '--serie-3' }, { tipo: 'puntos', pts: pb, color: '--serie-3' }], verticales: [{ x: s.t, color: '--muted', texto: 'empalme' }] };
      }
      const pts = s.filas.map((r) => [r.p, r.i]);
      return { x: [s.filas[0].p - 0.3, s.filas[s.n].p + 0.3], y: Eco.rango(pts.map((p) => p[1]).concat(100)), fx: (v) => (Number.isInteger(v) ? String(v) : ''), fy: (v) => f(v), ejeY: `Índice (base ${f(s.base)} = 100)`,
        series: [{ pts, color: '--serie-1' }, { tipo: 'puntos', pts, color: '--serie-1' }, { tipo: 'puntos', pts: [[s.base, 100]], color: '--serie-2', radio: 6 }], horizontales: [{ y: 100, color: '--muted', texto: '100' }] };
    },
    leyenda: (s) => (s.modo === 'empalme' ? '<b>Azul</b>: la serie antigua (A) hasta el periodo de empalme. <b>Verde</b>: la serie nueva (B) desde ahí. Las dos están en la misma base gracias al coeficiente de empalme k.' : s.modo === 'cesta' ? '<b>Barras</b>: cuánto ha subido el precio de cada producto (índice simple). <b>Línea roja</b>: Laspeyres; <b>morada</b>: Paasche. Los dos son medias ponderadas de esas subidas.' : '<b>Línea azul</b>: el índice de cada periodo. <b>Punto rojo</b>: el periodo base, que vale 100.'),
  });
})();
