/* =====================================================================
   Interfaz de Teoría de juegos: los nombres de las estrategias y los ocho
   pagos de la matriz 2×2, los resultados (equilibrios de Nash, estrategias
   dominantes, equilibrio mixto, eficiencia), la matriz con las mejores
   respuestas marcadas, las curvas de mejor respuesta de los dos jugadores
   (donde se cruzan están los equilibrios) y el desarrollo. Se monta con
   Calculadora.monta (calculadora.js); el cálculo está en
   teoria-juegos/calculo.js.
   ===================================================================== */
(() => {
  const X = TeoriaJuegos, { f } = Eco;
  const par = (a, b) => `(${f(a, 5)}, ${f(b, 5)})`;
  // un juego con pagos enteros pequeños y los nombres de siempre, para el modo práctica
  function azar() {
    const e = () => String(Math.floor(Math.random() * 10));
    const sc = { f1: 'Arriba', f2: 'Abajo', c1: 'Izquierda', c2: 'Derecha' };
    for (const i of [1, 2]) for (const j of [1, 2]) { sc[`a${i}${j}`] = e(); sc[`b${i}${j}`] = e(); }
    return sc;
  }
  const matriz = (sc) => `Jugador 1 (filas): ${sc.f1} o ${sc.f2}. Jugador 2 (columnas): ${sc.c1} o ${sc.c2}. Pagos (jugador 1, jugador 2): `
    + [[1, 1], [1, 2], [2, 1], [2, 2]].map(([i, j]) => `(${sc['f' + i]}, ${sc['c' + j]}) = (${sc[`a${i}${j}`]}, ${sc[`b${i}${j}`]})`).join('; ') + '.';
  // la curva de mejor respuesta de un jugador: d0 y d1 son lo que gana por jugar su primera estrategia en vez de la segunda cuando el rival juega la suya con probabilidad 0 y 1
  function mejor(d0, d1, gira) {
    const u = (v, t) => (gira ? [t, v] : [v, t]);
    if (d0 * d1 < 0) { const tm = d0 / (d0 - d1), a = d0 > 0 ? 1 : 0; return [[u(a, 0), u(a, tm), u(1 - a, tm), u(1 - a, 1)]]; }
    if (d0 === 0 && d1 === 0) return [[u(0, 0), u(0, 1), u(1, 1), u(1, 0), u(0, 0)]];
    const v = d0 > 0 || d1 > 0 ? 1 : 0, r = [[u(v, 0), u(v, 1)]];
    if (d0 === 0) r.push([u(0, 0), u(1, 0)]); if (d1 === 0) r.push([u(0, 1), u(1, 1)]);
    return r;
  }
  const celda = (s, i, j) => {
    const a = f(s.A[i][j], 5), b = f(s.B[i][j], 5);
    return `<td class="${s.nash.some((t) => t[0] === i && t[1] === j) ? 'nash' : ''}">${s.mejorF[i][j] ? `<u>${a}</u>` : a}, ${s.mejorC[i][j] ? `<u>${b}</u>` : b}${s.pareto[i][j] ? ' <small title="Óptimo de Pareto">★</small>' : ''}</td>`;
  };
  Calculadora.monta({
    C: X, carpeta: 'teoria-juegos', app: 'TeoriaJuegosApp', azar,
    enunciado: (sc) => String(sc.tam) === '3' ? `En este juego de dos jugadores con tres estrategias cada uno (el jugador 1 elige fila entre ${[1, 2, 3].map((i) => sc['f' + i]).join(', ')} y el 2 columna entre ${[1, 2, 3].map((j) => sc['c' + j]).join(', ')}), con los pagos del 1 por filas «${String(sc.p1).replace(/\n/g, ' / ')}» y los del 2 «${String(sc.p2).replace(/\n/g, ' / ')}», elimina las estrategias estrictamente dominadas ronda a ronda y halla los equilibrios de Nash en estrategias puras.` : `En este juego de dos jugadores (${matriz(sc)}) halla las estrategias dominantes, los equilibrios de Nash en estrategias puras y, si lo hay, el equilibrio mixto (p es la probabilidad de que el jugador 1 juegue ${sc.f1} y q la de que el 2 juegue ${sc.c1}).`,
    nota: 'La matriz da, en cada casilla, el pago del jugador 1 y el del jugador 2. Pueden ser negativos (por ejemplo, años de cárcel). Los nombres de las estrategias son libres.',
    campos: (sc) => String(sc.tam) === '3' ? [
      { k: 'tam', nom: 'Tamaño de la matriz', tipo: 'sel', ops: [['2', '2 × 2 (con equilibrio mixto)'], ['3', '3 × 3 (con eliminación de dominadas)']] },
      { k: 'f1', nom: 'Jugador 1, estrategia 1', tipo: 'texto', sep: 'Estrategias (nombres)' }, { k: 'f2', nom: 'Jugador 1, estrategia 2', tipo: 'texto' }, { k: 'f3', nom: 'Jugador 1, estrategia 3', tipo: 'texto' },
      { k: 'c1', nom: 'Jugador 2, estrategia 1', tipo: 'texto' }, { k: 'c2', nom: 'Jugador 2, estrategia 2', tipo: 'texto' }, { k: 'c3', nom: 'Jugador 2, estrategia 3', tipo: 'texto' },
      { k: 'p1', nom: 'Pagos del jugador 1', tipo: 'area', filas: 3, ayuda: 'tres filas de tres números: una fila por estrategia del jugador 1', sep: 'Pagos' },
      { k: 'p2', nom: 'Pagos del jugador 2', tipo: 'area', filas: 3, ayuda: 'tres filas de tres números, en el mismo orden' },
    ] : [
      { k: 'tam', nom: 'Tamaño de la matriz', tipo: 'sel', ops: [['2', '2 × 2 (con equilibrio mixto)'], ['3', '3 × 3 (con eliminación de dominadas)']] },
      { k: 'f1', nom: 'Jugador 1, estrategia 1', tipo: 'texto', sep: 'Estrategias (nombres)' }, { k: 'f2', nom: 'Jugador 1, estrategia 2', tipo: 'texto' },
      { k: 'c1', nom: 'Jugador 2, estrategia 1', tipo: 'texto' }, { k: 'c2', nom: 'Jugador 2, estrategia 2', tipo: 'texto' },
      { k: 'a11', nom: 'Jugador 1 en (1, 1)', sep: 'Pagos del jugador 1' }, { k: 'a12', nom: 'Jugador 1 en (1, 2)' }, { k: 'a21', nom: 'Jugador 1 en (2, 1)' }, { k: 'a22', nom: 'Jugador 1 en (2, 2)' },
      { k: 'b11', nom: 'Jugador 2 en (1, 1)', sep: 'Pagos del jugador 2' }, { k: 'b12', nom: 'Jugador 2 en (1, 2)' }, { k: 'b21', nom: 'Jugador 2 en (2, 1)' }, { k: 'b22', nom: 'Jugador 2 en (2, 2)' },
    ],
    resumen: (s) => {
      if (s.tam === 3) {
        return [
          ['Equilibrios de Nash (puros)', s.nash.length ? s.nash.map(([i, j]) => `${s.nom.f[i]} / ${s.nom.c[j]} ${par(s.A[i][j], s.B[i][j])}`).join('<br>') : 'Ninguno', true],
          ['Eliminación de dominadas', s.rondas.length ? (s.resuelto ? `En ${s.rondas.length} ronda${s.rondas.length > 1 ? 's' : ''} solo queda ${s.nom.f[s.F[0]]} / ${s.nom.c[s.C[0]]}` : `Queda ${s.F.length} × ${s.C.length} tras ${s.rondas.length} ronda${s.rondas.length > 1 ? 's' : ''}`) : 'No se puede eliminar ninguna', true],
          ['Tipo de juego', s.tipo.split(':')[0].split('.')[0], true],
        ];
      }
      const dom = (d, nm) => (d ? `${nm[d.i]} (${d.fuerte ? 'estricta' : 'débil'})` : 'Ninguna');
      return [
        ['Equilibrios de Nash (puros)', s.nash.length ? s.nash.map(([i, j]) => `${s.nom.f[i]} / ${s.nom.c[j]} ${par(s.A[i][j], s.B[i][j])}`).join('<br>') : 'Ninguno', true],
        ['Dominante del jugador 1', dom(s.domF, s.nom.f)], ['Dominante del jugador 2', dom(s.domC, s.nom.c)],
        ['Equilibrio mixto', s.mixto ? `p = ${f(s.mixto.p, 5)} y q = ${f(s.mixto.q, 5)}` : 'No hay', true],
        ...(s.mixto ? [['Pago esperado del jugador 1', f(s.mixto.u1, 5)], ['Pago esperado del jugador 2', f(s.mixto.u2, 5)]] : []),
        ['Tipo de juego', s.tipo.split(':')[0].split(',')[0].replace(/\.$/, ''), true],
      ];
    },
    tabla: (s) => s.tam === 3
      ? `<table class="tabla-juego"><thead><tr><th><span class="solo-lector">Estrategias</span></th>${[0, 1, 2].map((j) => `<th>${s.nom.c[j]}${s.C.includes(j) ? '' : ' <small>(eliminada)</small>'}</th>`).join('')}</tr></thead><tbody>${[0, 1, 2].map((i) => `<tr><th>${s.nom.f[i]}${s.F.includes(i) ? '' : ' <small>(eliminada)</small>'}</th>${[0, 1, 2].map((j) => celda(s, i, j)).join('')}</tr>`).join('')}</tbody></table>`
      : `<table class="tabla-juego"><thead><tr><th><span class="solo-lector">Estrategias</span></th><th>${s.nom.c[0]}</th><th>${s.nom.c[1]}</th></tr></thead><tbody>${[0, 1].map((i) => `<tr><th>${s.nom.f[i]}</th>${celda(s, i, 0)}${celda(s, i, 1)}</tr>`).join('')}</tbody></table>`,
    grafica: (s) => {
      if (s.tam === 3) return null;
      const [[a11, a12], [a21, a22]] = s.A, [[b11, b12], [b21, b22]] = s.B;
      const series = [];
      for (const pts of mejor(a12 - a22, a11 - a21, false)) series.push({ pts, color: '--serie-1' });
      for (const pts of mejor(b21 - b22, b11 - b12, true)) series.push({ pts, color: '--serie-2' });
      series.push({ tipo: 'puntos', pts: s.nash.map(([i, j]) => [i === 0 ? 1 : 0, j === 0 ? 1 : 0]), color: '--ink', radio: 6 });
      if (s.mixto) series.push({ tipo: 'puntos', pts: [[s.mixto.p, s.mixto.q]], color: '--ink', radio: 6 });
      return { x: [-0.04, 1.04], y: [-0.04, 1.04], fx: (v) => f(v, 2), fy: (v) => f(v, 2), ejeX: `p: probabilidad de que el jugador 1 juegue «${s.nom.f[0]}»`, ejeY: `q: la de que el 2 juegue «${s.nom.c[0]}»`, series };
    },
    leyenda: (s) => s.tam === 3 ? '' : `<b style="color:var(--serie-1)">Mejor respuesta del jugador 1</b> (su p según la q del otro) y <b style="color:var(--serie-2)">mejor respuesta del jugador 2</b> (su q según la p del otro). Los puntos negros, donde se cruzan, son los equilibrios de Nash: ${s.nash.length ? 'las esquinas son los puros' : 'aquí no hay puros'}${s.mixto ? ' y el del interior es el mixto' : ''}.`,
  });
})();
