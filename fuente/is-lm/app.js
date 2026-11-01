/* =====================================================================
   Interfaz del Modelo IS-LM: los datos de la economía y de la política (ΔG, ΔT, ΔM),
   la gráfica con las curvas IS y LM (y las nuevas, discontinuas) y el desarrollo.
   Se monta con Calculadora.monta (calculadora.js); el cálculo está en is-lm/calculo.js.
   ===================================================================== */
(() => {
  const L = IsLm, { f, num } = Eco;
  const pt = (x) => `${f(x, 5)} %`;
  // recorta la recta i = o + p·Y al rectángulo [0, X] × [lo, hi] (devuelve los dos extremos)
  const recta = (o, p, X, lo, hi) => {
    let a = 0, z = X;
    if (p > 0) { a = Math.max(a, (lo - o) / p); z = Math.min(z, (hi - o) / p); } else if (p < 0) { a = Math.max(a, (hi - o) / p); z = Math.min(z, (lo - o) / p); }
    return z > a ? [[a, o + p * a], [z, o + p * z]] : [];
  };
  Calculadora.monta({
    C: L, carpeta: 'is-lm', app: 'IsLmApp',
    nota: 'El tipo de interés i va en %. Inversión I = I₀ − b·i; demanda de dinero L = k·Y − h·i. Precios fijos y economía cerrada. Deja vacías las variaciones si solo quieres el equilibrio.',
    campos: () => [
      { k: 'c0', nom: 'Consumo autónomo c₀', sep: 'Mercado de bienes (IS)' }, { k: 'c1', nom: 'Propensión a consumir c₁', ayuda: 'entre 0 y 1' }, { k: 'T', nom: 'Impuestos T' },
      { k: 'I0', nom: 'Inversión autónoma I₀' }, { k: 'b', nom: 'Sensibilidad inversión b', un: 'por punto de i' }, { k: 'G', nom: 'Gasto público G' },
      { k: 'M', nom: 'Oferta monetaria M', sep: 'Mercado de dinero (LM)' }, { k: 'P', nom: 'Nivel de precios P' },
      { k: 'k', nom: 'Sensibilidad a la renta k', ayuda: 'dinero por unidad de renta' }, { k: 'h', nom: 'Sensibilidad al tipo h', un: 'por punto de i' },
      { k: 'dG', nom: 'Variación del gasto ΔG', sep: 'Política (opcional)' }, { k: 'dT', nom: 'Variación de impuestos ΔT' }, { k: 'dM', nom: 'Variación de dinero ΔM' },
    ],
    resumen: (s) => [
      ['Renta de equilibrio', `Y* = ${f(s.y, 6)}`, !s.politica], ['Tipo de interés', `i* = ${pt(s.i)}`],
      ['Consumo', f(s.c, 6)], ['Inversión', f(s.inv, 6)],
      ...(s.politica ? [
        ['Nueva renta', `Y' = ${f(s.y1, 6)}`, true], ['Nuevo tipo', `i' = ${pt(s.i1)}`],
        ['Variación de la renta', `ΔY = ${f(s.dy, 6)}`], ['Variación del tipo', `Δi = ${f(s.di, 5)} puntos`],
        ['Multiplicador fiscal', f(s.mf, 5)], ['Multiplicador monetario', f(s.mm, 5)],
        ...(s.dA ? [['Efecto expulsión', f(s.ex, 6)]] : []),
      ] : [['Multiplicador fiscal', f(s.mf, 5)], ['Multiplicador monetario', f(s.mm, 5)]]),
    ],
    grafica: (s) => {
      const yTop = Math.max(s.y, s.y1 ?? 0), iTop = Math.max(Math.abs(s.i), Math.abs(s.i1 ?? 0), 1e-9), X = yTop * 1.6;
      const lo = Math.min(0, s.i, s.i1 ?? 0) - iTop * 0.3, hi = iTop * 2;
      const isO = (a) => a / s.b, lmO = (m) => -m / s.h;
      const series = [{ pts: recta(isO(s.A), -s.isP, X, lo, hi), color: '--serie-1' }, { pts: recta(lmO(s.m), s.lmP, X, lo, hi), color: '--serie-2' }];
      const yi = Math.max(X * 0.02, (isO(s.A) - hi * 0.9) / s.isP), etiquetas = [{ x: yi, y: isO(s.A) - s.isP * yi, texto: 'IS', color: '--serie-1' }];
      const yl = Math.min(X * 0.93, (hi * 0.9 - lmO(s.m)) / s.lmP); etiquetas.push({ x: yl, y: lmO(s.m) + s.lmP * yl, texto: 'LM', color: '--serie-2', alinea: 'right' });
      let puntos = [[s.y, s.i]];
      if (s.politica) {
        series.push({ pts: recta(isO(s.A1), -s.isP, X, lo, hi), color: '--serie-1', discontinua: true }, { pts: recta(lmO(s.m1), s.lmP, X, lo, hi), color: '--serie-2', discontinua: true });
        puntos.push([s.y1, s.i1]);
        series.push({ pts: [[s.y1, s.i1], [s.y1, lo]], color: '--muted', grosor: 1, discontinua: true });
        etiquetas.push({ x: s.y1, y: s.i1, texto: "E'" });
      }
      series.push({ pts: [[s.y, s.i], [s.y, lo]], color: '--muted', grosor: 1, discontinua: true }, { tipo: 'puntos', pts: puntos, color: '--ink', radio: 5 });
      etiquetas.push({ x: s.y, y: s.i, texto: 'E' });
      return { x: [0, X], y: [lo, hi], fx: (v) => f(v, 4), fy: (v) => num(v, 1), ejeX: 'Renta Y', ejeY: 'Tipo de interés i (%)', series, etiquetas };
    },
    leyenda: (s) => `<b style="color:var(--serie-1)">Azul</b>: curva IS (equilibrio en el mercado de bienes). <b style="color:var(--serie-2)">Rojo</b>: curva LM (equilibrio en el mercado de dinero). Se cortan en E, con Y* = ${f(s.y, 5)} e i* = ${pt(s.i)}.${s.politica ? ` Las curvas discontinuas son las nuevas tras la política y E' es el nuevo equilibrio.` : ''}`,
  });
})();
