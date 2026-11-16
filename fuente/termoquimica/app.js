/* =====================================================================
   Interfaz de Termoquímica y ley de Hess: el modo (entalpías de formación, ley
   de Hess o espontaneidad), los datos de cada uno, el diagrama de barras de las
   entalpías y el desarrollo. Se monta con Calculadora.monta (calculadora.js); el
   cálculo está en termoquimica/calculo.js.
   ===================================================================== */
(() => {
  const P = Termoquimica, { f } = P;
  const kJ = (x) => `${f(x, 5)} kJ`;
  Calculadora.monta({
    C: P, carpeta: 'termoquimica', app: 'TermoquimicaApp', exportar: true,
    nota: 'Una sustancia por línea, con su coeficiente y su estado: «2 H2O(l)». Si la entalpía de formación no está en la tabla, escríbela detrás de un «;» (kJ/mol). En la ley de Hess, cada reacción lleva «; ΔH» (kJ) al final y se admiten coeficientes como 1/2.',
    campos: (sc) => [
      { k: 'modo', nom: 'Qué calcular', tipo: 'sel', ops: [['formacion', 'ΔH desde entalpías de formación'], ['hess', 'Ley de Hess (combinar reacciones)'], ['gibbs', 'Espontaneidad (ΔG = ΔH − TΔS)'], ['born', 'Ciclo de Born-Haber (energía reticular)']] },
      ...(sc.modo === 'hess' ? [
        { k: 'reacciones', nom: 'Reacciones dadas, una por línea, con su ΔH tras «;»', tipo: 'area', filas: 5, sep: 'Reacciones' },
        { k: 'objetivo', nom: 'Reacción que quieres obtener', tipo: 'texto' },
      ] : sc.modo === 'born' ? [
        { k: 'sal', nom: 'Sal (metal y no metal)', tipo: 'texto', sep: 'Sal iónica' }, { k: 'hf', nom: 'Entalpía de formación (vacío = tabla)', un: 'kJ/mol' },
      ] : sc.modo === 'gibbs' ? [
        { k: 'h', nom: 'Entalpía ΔH', un: 'kJ', sep: 'Datos' }, { k: 's', nom: 'Entropía ΔS', un: 'J/K' }, { k: 't', nom: 'Temperatura T', un: 'K' },
      ] : [
        { k: 'reactivos', nom: 'Reactivos (uno por línea)', tipo: 'area', filas: 3, sep: 'Reacción' },
        { k: 'productos', nom: 'Productos (uno por línea)', tipo: 'area', filas: 3 },
        { k: 'masa', nom: 'Masa del primer reactivo (opcional)', un: 'g' },
        { k: 't', nom: 'Temperatura para ΔG (vacío = 298,15 K)', un: 'K' },
      ]),
    ],
    resumen: (s) => (s.modo === 'born'
      ? [['Energía reticular', `${f(s.U, 5)} kJ/mol`, true], ['Entalpía de formación', kJ(s.hf)], ['Sublimación + ionización', kJ(s.sub + s.ion)], ['Atomización + afinidad', kJ(s.at + s.ae)], ...(s.ref ? [['Valor de las tablas', `${f(s.ref)} kJ/mol`]] : [])]
      : s.modo === 'gibbs'
      ? [['Energía libre ΔG', kJ(s.dG), true], ['Entalpía ΔH', kJ(s.dH)], ['−T·ΔS', kJ(-s.T * s.dS / 1000)], ['Temperatura de equilibrio', isFinite(s.Te) ? `${f(s.Te)} K` : '—']]
      : [['Entalpía de reacción ΔH', kJ(s.dH), true], ['Tipo', s.dH < 0 ? 'Exotérmica' : s.dH > 0 ? 'Endotérmica' : 'Sin calor'], ...(s.q !== undefined ? [['Calor del ejercicio', kJ(s.q)]] : []),
        ...(s.dS !== undefined ? [['Entropía ΔS°', `${f(s.dS)} J/K`], [`Energía libre ΔG a ${f(s.T)} K`, kJ(s.dGT)], ['Temperatura de equilibrio', isFinite(s.Te) ? `${f(s.Te)} K` : 'no hay (siempre o nunca)']] : []),
        ...(s.dG298 !== undefined ? [['ΔG° a 25 °C con ΔGf°', kJ(s.dG298)]] : [])]),
    grafica: (s, col) => {
      const b = s.barras, vals = b.map(([, v]) => v), [y0, y1] = Calculadora.rango(vals, { cero: true });
      return { x: [-0.6, b.length - 0.4], y: [y0, y1], fx: () => '', fy: (v) => Herramienta.txt(f(v, 4)), ejeY: 'kJ',
        series: b.map(([, v], i) => ({ tipo: 'barras', pts: [[i, v]], ancho: 0.6, color: i === b.length - 1 || s.modo === 'gibbs' && i === 0 ? '--serie-2' : '--serie-1' })),
        etiquetas: b.map(([t, v], i) => ({ x: i - 0.3, y: Math.max(v, 0), texto: `${t}  ${f(v, 4).replace(/<[^>]+>/g, '')}`, color: '--ink' })) };
    },
    // QUI.TQ-4: ΔH, −TΔS y ΔG frente a T, con el cruce (ΔG = 0) marcado
    grafica2: (s) => {
      if (s.dS === undefined || !isFinite(s.dH) || !isFinite(s.dS)) return null;
      const Te = s.Te, Tmax = Math.max(600, 2 * (s.T || 298), isFinite(Te) && Te > 0 ? 1.6 * Te : 0), G = (T) => s.dH - (T * s.dS) / 1000, tds = (T) => -(T * s.dS) / 1000;
      const [y0, y1] = Calculadora.rango([s.dH, G(0), G(Tmax), tds(Tmax)], { cero: true }), N = 60, tab = (fn) => Array.from({ length: N + 1 }, (_, i) => [(Tmax * i) / N, fn((Tmax * i) / N)]);
      const cruce = isFinite(Te) && Te > 0 && Te < Tmax;
      return { x: [0, Tmax], y: [y0, y1], ejeX: 'T (K)', ejeY: 'kJ', fx: (v) => Herramienta.txt(f(v, 3)), fy: (v) => Herramienta.txt(f(v, 4)),
        series: [{ pts: [[0, 0], [Tmax, 0]], color: '--muted', discontinua: true }, { pts: [[0, s.dH], [Tmax, s.dH]], color: '--serie-1', discontinua: true }, { pts: tab(tds), color: '--muted' }, { pts: tab(G), color: '--serie-2', grosor: 3 },
          ...(cruce ? [{ pts: [[Te, 0]], tipo: 'puntos', color: '--ink', radio: 5 }] : []), { pts: [[s.T, G(s.T)]], tipo: 'puntos', color: '--serie-2', radio: 4 }],
        etiquetas: [{ x: Tmax * 0.02, y: s.dH, texto: 'ΔH', color: '--serie-1' }, { x: Tmax * 0.7, y: tds(Tmax * 0.7), texto: '−TΔS', color: '--muted' }, { x: Tmax * 0.02, y: G(0), texto: 'ΔG', color: '--serie-2' }, ...(cruce ? [{ x: Te, y: 0, texto: `T = ${Herramienta.txt(f(Te, 4))} K`, color: '--ink' }] : [])] };
    },
    leyenda2: (s) => `ΔG = ΔH − T·ΔS frente a la temperatura: la recta de ΔG corta el eje (ΔG = 0) en la temperatura de equilibrio${isFinite(s.Te) && s.Te > 0 ? `, ${Herramienta.txt(f(s.Te, 4))} K` : ' (aquí no hay cruce con T > 0: la reacción es siempre o nunca espontánea)'}. Por debajo del eje, espontánea; por encima, no. El punto es la temperatura de los datos.`,
    // ΔG° de la reacción → K en Equilibrio (K = e^(−ΔG°/RT)), si cabe en dos reactivos y dos productos
    usarEn: (s) => {
      const dG = s.dGT !== undefined ? s.dGT : s.dG298, T = s.dGT !== undefined ? s.T : 298.15;
      if (s.modo !== 'formacion' || dG === undefined || !isFinite(dG) || s.R.length > 2 || s.P.length > 2) return [];
      const c = (x) => String(+x.toFixed(4)).replace('.', ','), L = [...s.R, ...s.P];
      const e = { modo: 'dG', dG: c(dG), T: c(T), nA: '', nB: '', nC: '', nD: '', a: '', b: '', c: '', d: '', cA: '', cB: '', cC: '', cD: '' };
      s.R.forEach((q, i) => { const k = 'AB'[i]; e['n' + k] = q.base; e[k.toLowerCase()] = String(q.coef); e['c' + k] = String(q.coef); });
      s.P.forEach((q, i) => { const k = 'CD'[i]; e['n' + k] = q.base; e[k.toLowerCase()] = String(q.coef); e['c' + k] = '0'; });
      return L.length ? [{ texto: 'Calcular K en Equilibrio', carpeta: 'equilibrio', estado: e }] : [];
    },
    leyenda: (s) => (s.modo === 'born' ? 'Cada paso del ciclo (sublimación, ionización, atomización, afinidad, red) y la entalpía de formación, que es la suma de todos.' : s.modo === 'gibbs' ? 'Barras: la entalpía, el término −T·ΔS y la energía libre ΔG que resulta de sumarlos.' : s.modo === 'hess' ? 'Entalpía que aporta cada reacción (ya multiplicada o invertida) y la suma, que es la ΔH pedida.' : 'Entalpía de formación total de los reactivos y de los productos; su diferencia es la entalpía de reacción ΔH.'),
  });
})();
