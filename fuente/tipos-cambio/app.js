/* =====================================================================
   Interfaz de Tipos de cambio y PPA: lo que se calcula, la moneda, los
   datos, la gráfica (la recta del cambio, el tipo antes y ahora, el precio
   del mismo bien aquí y fuera, o el tipo de cambio año a año), la tabla de
   la PPA relativa y el desarrollo. Se monta con Calculadora.monta
   (calculadora.js); el cálculo está en tipos-cambio/calculo.js.
   ===================================================================== */
(() => {
  const T = TiposCambio, { f, num, dinero } = Eco;
  const ops = Object.entries(T.MONEDAS).map(([k, [nom]]) => [k, `${nom[0].toUpperCase() + nom.slice(1)} (${k})`]);
  const sim = (k) => (T.MONEDAS[k] || T.MONEDAS.USD)[1], va = (x) => f(x, 5);
  // gráfica de dos barras con su nombre debajo
  const dos = (a, b, nA, nB, ejeY) => ({ x: [0.3, 2.7], y: Eco.rango([a, b], { cero: true, aire: 0.2 }), fx: (v) => (Math.abs(v - 1) < 1e-9 ? nA : Math.abs(v - 2) < 1e-9 ? nB : ''), fy: (v) => f(v), ejeY,
    series: [{ tipo: 'barras', pts: [[1, a]], ancho: 0.8, color: '--serie-1' }, { tipo: 'barras', pts: [[2, b]], ancho: 0.8, color: '--serie-2' }],
    etiquetas: [{ x: 1, y: a, texto: va(a), alinea: 'center' }, { x: 2, y: b, texto: va(b), alinea: 'center' }] });
  Calculadora.monta({
    C: T, carpeta: 'tipos-cambio', app: 'TiposCambioApp',
    nota: 'El tipo de cambio va como lo publica el Banco Central Europeo: unidades de la otra moneda por 1 €. La coma es decimal. <b>Los tipos de los ejemplos son ilustrativos</b> (1,08 dólares por euro, 160 yenes…), no cotizaciones de ningún día: escribe el del día que te interese.',
    campos: (sc) => {
      const cs = [{ k: 'modo', nom: 'Calcular', tipo: 'sel', ops: Object.entries(T.MODOS) }, { k: 'mon', nom: sc.modo === 'cruzado' ? 'Primera moneda' : 'Moneda', tipo: 'sel', ops }], s = sim(sc.mon);
      if (sc.modo === 'cruzado') return [...cs, { k: 'mon2', nom: 'Segunda moneda', tipo: 'sel', ops: ops.slice(1).concat(ops.slice(0, 1)) }, { k: 'E', nom: '1 € en la primera', un: s }, { k: 'E2', nom: '1 € en la segunda', un: sim(sc.mon2) }];
      if (sc.modo === 'variacion') return [...cs, { k: 'E', nom: '1 € antes', un: s }, { k: 'E2', nom: '1 € ahora', un: s }];
      if (sc.modo === 'ppa') return [...cs, { k: 'P', nom: 'Precio en España', un: '€' }, { k: 'Pe', nom: 'Precio fuera', un: s }, { k: 'E', nom: 'Tipo de cambio: 1 € =', un: s }];
      if (sc.modo === 'paridad') return [...cs, { k: 'E', nom: 'Tipo de cambio hoy: 1 € =', un: s }, { k: 'i', nom: 'Tipo de interés en España i', un: '% anual' }, { k: 'ie', nom: 'Tipo de interés fuera i*', un: '% anual' }, { k: 'n', nom: 'Plazo', un: 'años' }, { k: 'Fm', nom: 'Tipo a plazo de mercado', un: s, ayuda: 'opcional, para ver si hay arbitraje' }];
      if (sc.modo === 'relativa') return [...cs, { k: 'E', nom: 'Tipo de cambio hoy: 1 € =', un: s }, { k: 'pi', nom: 'Inflación en España π', un: '% anual' }, { k: 'pe', nom: 'Inflación fuera πₑ', un: '% anual' }, { k: 'n', nom: 'Años', un: 'años' }];
      return [...cs, { k: 'sentido', nom: 'Sentido', tipo: 'sel', ops: [['aOtra', 'De euros a la otra moneda'], ['aEuros', 'De la otra moneda a euros']] }, { k: 'E', nom: 'Tipo de cambio: 1 € =', un: s }, { k: 'x', nom: 'Cantidad', un: sc.sentido === 'aEuros' ? s : '€' }, { k: 'c', nom: 'Comisión', un: '%' }];
    },
    resumen: (s) => {
      if (s.modo === 'convertir') { const u = s.aOtra ? s.m[1] : '€'; return [['Recibes', `${num(s.neto)} ${u}`, true], ...(s.c ? [['Sin comisión', `${num(s.bruto)} ${u}`], ['Comisión', `${num(s.bruto - s.neto)} ${u}`]] : []), [`1 ${s.m[1]} vale`, `${f(s.inv, 5)} €`]]; }
      if (s.modo === 'cruzado') return [[`1 ${s.m1[1]} =`, `${f(s.t, 5)} ${s.m2[1]}`, true], [`1 ${s.m2[1]} =`, `${f(s.inv, 5)} ${s.m1[1]}`, true]];
      if (s.modo === 'variacion') return [['El euro', `${s.que} (${f(100 * s.ve, 4)} %)`, true], [s.m[2][0].toUpperCase() + s.m[2].slice(1), `${s.que2} (${f(100 * s.vo, 4)} %)`, true]];
      if (s.modo === 'ppa') return [['Tipo de cambio de la PPA', `${f(s.Eppa, 5)} ${s.m[1]}`], ['Tipo de cambio real q', f(s.q, 4)], ['El euro está', Math.abs(s.dev) < 1e-9 ? 'en su valor' : `${s.dev > 0 ? 'sobrevalorado' : 'infravalorado'} un ${f(Math.abs(100 * s.dev), 4)} %`, true], ['Precio de fuera en euros', dinero(s.PeEur)]];
      if (s.modo === 'paridad') return [[`Tipo a plazo (${f(s.N, 4)} año${s.N === 1 ? '' : 's'}): 1 € =`, `${f(s.F, 6)} ${s.m[1]}`, true], [`${s.prima >= 0 ? 'Prima' : 'Descuento'} del euro a plazo`, `${f(100 * Math.abs(s.prima), 4)} %`], ['Diferencial i* − i', `${f(100 * s.dif, 4)} puntos`], ['Tipo esperado (descubierta)', `${f(s.F, 6)} ${s.m[1]}`],
        ...(s.arb ? [['Invertir aquí (por euro)', dinero(s.arb.aqui, 5)], ['Invertir fuera con cobertura', dinero(s.arb.cubierta, 5)], ['Arbitraje', Math.abs(s.arb.dg) < 1e-9 ? 'no hay' : s.arb.dg > 0 ? `invertir fuera: +${f(s.arb.dg, 4)} € por euro` : `invertir aquí: +${f(-s.arb.dg, 4)} € por euro`, true]] : [])];
      return [[`Dentro de ${s.N} año${s.N > 1 ? 's' : ''}: 1 € =`, `${f(s.En, 5)} ${s.m[1]}`, true], ['Variación del euro', `${f(100 * s.v, 4)} %`], ['Cada año', `× ${f(s.r, 6)}`]];
    },
    tabla: (s) => (s.modo === 'paridad' ? `<table class="tabla-eco"><thead><tr><th>Plazo (años)</th><th>Tipo a plazo: 1 € =</th><th>Prima o descuento</th></tr></thead><tbody>${s.filas.map((r) => `<tr><td>${r.t}</td><td>${f(r.F, 6)} ${s.m[1]}</td><td>${f(100 * (r.F / s.E - 1), 4)} %</td></tr>`).join('')}</tbody></table>` : s.modo === 'relativa' ? `<table class="tabla-eco"><thead><tr><th>Año</th><th>1 € =</th><th>Variación acumulada</th></tr></thead><tbody>${s.filas.map((r) => `<tr><td>${r.t}</td><td>${f(r.E, 5)} ${s.m[1]}</td><td>${f(100 * (r.E / s.E0 - 1), 4)} %</td></tr>`).join('')}</tbody></table>` : ''),
    grafica: (s) => {
      if (s.modo === 'variacion') return dos(s.E0, s.E1, 'Antes', 'Ahora', `${s.m[0]} por euro`);
      if (s.modo === 'ppa') return dos(s.P, s.PeEur, 'En España', 'Fuera', 'Precio en euros');
      if (s.modo === 'paridad') return { x: [0, s.N], y: Eco.rango(s.filas.map((r) => r.F).concat([s.E, s.F, ...(s.arb ? [s.arb.Fm] : [])])), fy: (v) => f(v), ejeX: 'Plazo (años)', ejeY: `${s.m[0]} por euro`,
        series: [{ pts: [0, s.N].map((t) => [t, s.E * ((1 + s.ie) / (1 + s.i)) ** t]), color: '--serie-1' }, { tipo: 'puntos', pts: [[s.N, s.F]], color: '--serie-3', radio: 6 }, ...(s.arb ? [{ tipo: 'puntos', pts: [[s.N, s.arb.Fm]], color: '--serie-2', radio: 6 }] : [])], horizontales: [{ y: s.E, texto: 'hoy' }] };
      if (s.modo === 'relativa') return { x: [0, s.N], y: Eco.rango(s.filas.map((r) => r.E).concat(s.E0)), fy: (v) => f(v), ejeX: 'Años', ejeY: `${s.m[0]} por euro`,
        series: [{ pts: s.filas.map((r) => [r.t, r.E]), color: '--serie-1' }, { tipo: 'puntos', pts: s.filas.map((r) => [r.t, r.E]), color: '--serie-1' }], horizontales: [{ y: s.E0, texto: 'hoy' }] };
      // la recta del cambio: lo que se da y lo que se recibe
      const [x, y, k, ex, ey] = s.modo === 'cruzado' ? [100, 100 * s.t, s.t, s.m1[0], s.m2[0]] : [s.x, s.bruto, s.bruto / s.x, s.aOtra ? 'euros' : s.m[0], s.aOtra ? s.m[0] : 'euros'];
      return { x: [0, 2 * x], y: [0, 2.1 * y], fx: (v) => num(v, 0), fy: (v) => num(v, y < 10 ? 2 : 0), ejeX: ex[0].toUpperCase() + ex.slice(1), ejeY: ey[0].toUpperCase() + ey.slice(1),
        series: [{ pts: [[0, 0], [2 * x, 2 * x * k]], color: '--serie-1' }, ...(s.c ? [{ pts: [[0, 0], [2 * x, 2 * x * k * (1 - s.c)]], color: '--serie-2', discontinua: true }] : []), { tipo: 'puntos', pts: [[x, s.modo === 'cruzado' ? y : s.neto]], color: '--serie-3', radio: 6 }] };
    },
    leyenda: (s) => ({ convertir: () => `<b>Recta azul</b>: lo que recibes al tipo de cambio${s.c ? '; <b>discontinua</b>: después de la comisión' : ''}. <b>Punto</b>: tu cambio.`, cruzado: () => `<b>Recta</b>: ${s.m2[0]} que se reciben por ${s.m1[0]}. <b>Punto</b>: 100 ${s.m1[1]}.`, variacion: () => `<b>Barras</b>: ${s.m[0]} por euro antes y ahora.`, ppa: () => '<b>Barras</b>: lo que cuesta el mismo bien en España y fuera, pasado a euros. Si la PPA se cumpliera, serían iguales.', relativa: () => `<b>Línea</b>: el tipo de cambio que mantiene la PPA, año a año. <b>Discontinua</b>: el de hoy.`, paridad: () => `<b>Línea azul</b>: el tipo a plazo sin arbitraje, F = E·((1 + i*)/(1 + i))ᵀ, según el plazo. <b>Punto morado</b>: el tipo a plazo al final del plazo.${s.arb ? ' <b>Punto rojo</b>: el tipo a plazo de mercado; si no coincide, hay arbitraje.' : ''} <b>Discontinua</b>: el tipo de hoy.` }[s.modo]()),
  });
})();
