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
    C: P, carpeta: 'termoquimica', app: 'TermoquimicaApp',
    nota: 'Una sustancia por línea, con su coeficiente y su estado: «2 H2O(l)». Si la entalpía de formación no está en la tabla, escríbela detrás de un «;» (kJ/mol). En la ley de Hess, cada reacción lleva «; ΔH» (kJ) al final y se admiten coeficientes como 1/2.',
    campos: (sc) => [
      { k: 'modo', nom: 'Qué calcular', tipo: 'sel', ops: [['formacion', 'ΔH desde entalpías de formación'], ['hess', 'Ley de Hess (combinar reacciones)'], ['gibbs', 'Espontaneidad (ΔG = ΔH − TΔS)']] },
      ...(sc.modo === 'hess' ? [
        { k: 'reacciones', nom: 'Reacciones dadas, una por línea, con su ΔH tras «;»', tipo: 'area', filas: 5, sep: 'Reacciones' },
        { k: 'objetivo', nom: 'Reacción que quieres obtener', tipo: 'texto' },
      ] : sc.modo === 'gibbs' ? [
        { k: 'h', nom: 'Entalpía ΔH', un: 'kJ', sep: 'Datos' }, { k: 's', nom: 'Entropía ΔS', un: 'J/K' }, { k: 't', nom: 'Temperatura T', un: 'K' },
      ] : [
        { k: 'reactivos', nom: 'Reactivos (uno por línea)', tipo: 'area', filas: 3, sep: 'Reacción' },
        { k: 'productos', nom: 'Productos (uno por línea)', tipo: 'area', filas: 3 },
        { k: 'masa', nom: 'Masa del primer reactivo (opcional)', un: 'g' },
      ]),
    ],
    resumen: (s) => (s.modo === 'gibbs'
      ? [['Energía libre ΔG', kJ(s.dG), true], ['Entalpía ΔH', kJ(s.dH)], ['−T·ΔS', kJ(-s.T * s.dS / 1000)], ['Temperatura de equilibrio', isFinite(s.Te) ? `${f(s.Te)} K` : '—']]
      : [['Entalpía de reacción ΔH', kJ(s.dH), true], ['Tipo', s.dH < 0 ? 'Exotérmica' : s.dH > 0 ? 'Endotérmica' : 'Sin calor'], ...(s.q !== undefined ? [['Calor del ejercicio', kJ(s.q)]] : [])]),
    grafica: (s, col) => {
      const b = s.barras, vals = b.map(([, v]) => v), [y0, y1] = Calculadora.rango(vals, { cero: true });
      return { x: [-0.6, b.length - 0.4], y: [y0, y1], fx: () => '', fy: (v) => Herramienta.txt(f(v, 4)), ejeY: 'kJ',
        series: b.map(([, v], i) => ({ tipo: 'barras', pts: [[i, v]], ancho: 0.6, color: i === b.length - 1 || s.modo === 'gibbs' && i === 0 ? '--serie-2' : '--serie-1' })),
        etiquetas: b.map(([t, v], i) => ({ x: i - 0.3, y: Math.max(v, 0), texto: `${t}  ${f(v, 4).replace(/<[^>]+>/g, '')}`, color: '--ink' })) };
    },
    leyenda: (s) => (s.modo === 'gibbs' ? 'Barras: la entalpía, el término −T·ΔS y la energía libre ΔG que resulta de sumarlos.' : s.modo === 'hess' ? 'Entalpía que aporta cada reacción (ya multiplicada o invertida) y la suma, que es la ΔH pedida.' : 'Entalpía de formación total de los reactivos y de los productos; su diferencia es la entalpía de reacción ΔH.'),
  });
})();
