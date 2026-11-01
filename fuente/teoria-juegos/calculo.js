/* =====================================================================
   Teoría de juegos (sin DOM): un juego de dos jugadores con dos
   estrategias cada uno (matriz de pagos 2×2). Mejores respuestas,
   estrategias dominantes, equilibrios de Nash en estrategias puras y el
   equilibrio mixto (probabilidades que dejan indiferente al rival), con
   la eficiencia en el sentido de Pareto y el tipo de juego (dilema del
   prisionero, coordinación, gallina, cara o cruz…). Formato de
   economia/comun.js; interfaz en teoria-juegos/app.js.
     resolver(sc)  { f1, f2, c1, c2, a11…a22, b11…b22 } →
       { A, B, nom: { f: [..], c: [..] }, mejorF, mejorC, nash: [[i, j]], domF, domC,
         mixto: { p, q, u1, u2 } | null, pareto, tipo, pasos }
       (a_ij es el pago del jugador 1 y b_ij el del 2 si el 1 juega la fila i y el 2 la columna j;
        p = probabilidad de que el 1 juegue su primera estrategia, q la del 2)
   ===================================================================== */
const TeoriaJuegos = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  const n = (x) => f(x, 5), par = (x) => (x < 0 ? `(${n(x)})` : n(x));
  const limpia = (s, def) => (String(s ?? '').replace(/[<>&"$\\{}]/g, '').trim().slice(0, 24) || def);
  const EPS = 1e-12;

  function resolver(sc) {
    const nom = { f: [limpia(sc.f1, 'Arriba'), limpia(sc.f2, 'Abajo')], c: [limpia(sc.c1, 'Izquierda'), limpia(sc.c2, 'Derecha')] };
    const A = [[0, 0], [0, 0]], B = [[0, 0], [0, 0]];
    for (const i of [0, 1]) for (const j of [0, 1]) {
      A[i][j] = lee(sc, `a${i + 1}${j + 1}`, `el pago del jugador 1 en (${nom.f[i]}, ${nom.c[j]})`);
      B[i][j] = lee(sc, `b${i + 1}${j + 1}`, `el pago del jugador 2 en (${nom.f[i]}, ${nom.c[j]})`);
    }
    const [[a11, a12], [a21, a22]] = A, [[b11, b12], [b21, b22]] = B;
    // mejores respuestas (con empate, las dos lo son)
    const mejorF = [[0, 1].map((j) => A[0][j] >= A[1][j] - EPS), [0, 1].map((j) => A[1][j] >= A[0][j] - EPS)];
    const mejorC = [0, 1].map((i) => [B[i][0] >= B[i][1] - EPS, B[i][1] >= B[i][0] - EPS]);
    const nash = [];
    for (const i of [0, 1]) for (const j of [0, 1]) if (mejorF[i][j] && mejorC[i][j]) nash.push([i, j]);
    // dominancia: { i, fuerte } si la estrategia i da al menos lo mismo contra las dos del rival y más en alguna
    const domina = (u) => {
      for (const i of [0, 1]) {
        const x = u(i, 0) - u(1 - i, 0), y = u(i, 1) - u(1 - i, 1);
        if (x > EPS && y > EPS) return { i, fuerte: true };
        if (x >= -EPS && y >= -EPS && (x > EPS || y > EPS)) return { i, fuerte: false };
      }
      return null;
    };
    const domF = domina((i, j) => A[i][j]), domC = domina((j, i) => B[i][j]);
    // equilibrio mixto: cada uno deja indiferente al otro
    const dq = a11 - a12 - a21 + a22, dp = b11 - b12 - b21 + b22;
    let mixto = null, motivoMixto = '';
    if (Math.abs(dq) < EPS || Math.abs(dp) < EPS) motivoMixto = 'a uno de los jugadores le da igual lo que haga el otro (o su pago no cambia al mezclar), así que no hay probabilidades que lo dejen indiferente';
    else {
      const q = (a22 - a12) / dq, p = (b22 - b21) / dp;
      if (!(p > EPS && p < 1 - EPS && q > EPS && q < 1 - EPS)) motivoMixto = `las probabilidades que salen (p = ${n(p)} y q = ${n(q)}) no están entre 0 y 1`;
      else mixto = { p, q, u1: q * a11 + (1 - q) * a12, u2: p * b11 + (1 - p) * b21 };
    }
    // eficiencia: una casilla es óptima de Pareto si ninguna otra mejora a un jugador sin empeorar al otro
    const pareto = A.map((fila, i) => fila.map((_, j) => ![0, 1].some((k) => [0, 1].some((l) => (k !== i || l !== j) && A[k][l] >= A[i][j] - EPS && B[k][l] >= B[i][j] - EPS && (A[k][l] > A[i][j] + EPS || B[k][l] > B[i][j] + EPS)))));
    const mejoraAmbos = (i, j) => [0, 1].some((k) => [0, 1].some((l) => A[k][l] > A[i][j] + EPS && B[k][l] > B[i][j] + EPS));
    let tipo;
    const mismo = (x) => nash.length === 2 && nash.some((t) => t[0] === x[0] && t[1] === x[1]);
    if (nash.length === 0) tipo = 'Sin equilibrio en estrategias puras (como cara o cruz): cada uno quiere adivinar lo que hará el otro, y solo hay equilibrio mezclando.';
    else if (nash.length === 1 && domF?.fuerte && domC?.fuerte && mejoraAmbos(...nash[0])) tipo = 'Dilema del prisionero: las dos tienen una estrategia dominante, juegan el equilibrio de Nash y los dos saldrían ganando con otro resultado, pero ninguno puede conseguirlo por su cuenta.';
    else if (nash.length === 1) tipo = pareto[nash[0][0]][nash[0][1]] ? 'Equilibrio de Nash único y eficiente: nadie puede mejorar sin que otro empeore.' : 'Equilibrio de Nash único, pero ineficiente: existe otro resultado mejor para los dos.';
    else if (mismo([0, 0]) && mismo([1, 1])) tipo = 'Juego de coordinación: hay dos equilibrios y a los dos les conviene elegir lo mismo, pero hay que ponerse de acuerdo en cuál.';
    else if (mismo([0, 1]) && mismo([1, 0])) tipo = 'Juego de la gallina (anticoordinación): hay dos equilibrios y a cada uno le interesa hacer lo contrario que el otro; cada uno prefiere el equilibrio en el que el otro cede.';
    else tipo = 'Varios equilibrios de Nash (hay empates entre estrategias).';

    /* ---------- desarrollo ---------- */
    const pasos = [], N = (r, c) => `${nom.f[r]} / ${nom.c[c]}`;
    const cel = (i, j) => `(${n(A[i][j])}, ${n(B[i][j])})`;
    pasos.push({ t: 'Matriz de pagos', html: `Cada casilla es (pago del jugador 1, pago del jugador 2). El jugador 1 elige fila (<b>${nom.f[0]}</b> o <b>${nom.f[1]}</b>) y el 2 columna (<b>${nom.c[0]}</b> o <b>${nom.c[1]}</b>):<br>` + [0, 1].map((i) => [0, 1].map((j) => `${N(i, j)}: ${cel(i, j)}`).join(' &ensp; ')).join('<br>') });
    const respF = [0, 1].map((j) => { const [x, y] = [A[0][j], A[1][j]]; return `Si el 2 juega <b>${nom.c[j]}</b>: $${n(x)}${x > y ? ' > ' : x < y ? ' < ' : ' = '}${n(y)}$, ${x === y ? 'le da igual' : `mejor <b>${nom.f[x > y ? 0 : 1]}</b>`}`; });
    const respC = [0, 1].map((i) => { const [x, y] = [B[i][0], B[i][1]]; return `Si el 1 juega <b>${nom.f[i]}</b>: $${n(x)}${x > y ? ' > ' : x < y ? ' < ' : ' = '}${n(y)}$, ${x === y ? 'le da igual' : `mejor <b>${nom.c[x > y ? 0 : 1]}</b>`}`; });
    pasos.push({ t: 'Mejores respuestas del jugador 1', html: respF.join('<br>') });
    pasos.push({ t: 'Mejores respuestas del jugador 2', html: respC.join('<br>') });
    const dTxt = (d, jug, nm) => (d ? `El jugador ${jug} tiene una estrategia dominante ${d.fuerte ? 'estricta' : 'débil'}: <b>${nm[d.i]}</b>, que le da ${d.fuerte ? 'más' : 'al menos lo mismo'} que <b>${nm[1 - d.i]}</b> juegue lo que juegue el otro.` : `El jugador ${jug} no tiene estrategia dominante: su mejor respuesta depende de lo que haga el otro.`);
    pasos.push({ t: 'Estrategias dominantes', html: `${dTxt(domF, 1, nom.f)}<br>${dTxt(domC, 2, nom.c)}` });
    pasos.push({ t: 'Equilibrios de Nash en estrategias puras', html: nash.length ? `Un equilibrio de Nash es una casilla donde cada uno juega su mejor respuesta a la del otro (las dos marcadas): ${nash.map(([i, j]) => `<b>${N(i, j)}</b> con pagos ${cel(i, j)}`).join('; ')}.` : 'Ninguna casilla tiene las dos mejores respuestas a la vez: no hay equilibrio en estrategias puras.' });
    pasos.push({ t: 'Equilibrio en estrategias mixtas', html: `Sea $p$ la probabilidad de que el jugador 1 juegue <b>${nom.f[0]}</b> y $q$ la de que el 2 juegue <b>${nom.c[0]}</b>. Cada uno mezcla para dejar indiferente al otro.<br>`
      + `Jugador 1 indiferente: $${n(a11)} q + ${par(a12)} (1 − q) = ${n(a21)} q + ${par(a22)} (1 − q)$ ⇒ $q = {${n(a22)} − ${par(a12)}}/{${n(a11)} − ${par(a12)} − ${par(a21)} + ${par(a22)}}$ ${Math.abs(dq) < EPS ? '(el denominador es 0)' : `$= ${n((a22 - a12) / dq)}$`}<br>`
      + `Jugador 2 indiferente: $${n(b11)} p + ${par(b21)} (1 − p) = ${n(b12)} p + ${par(b22)} (1 − p)$ ⇒ $p = {${n(b22)} − ${par(b21)}}/{${n(b11)} − ${par(b12)} − ${par(b21)} + ${par(b22)}}$ ${Math.abs(dp) < EPS ? '(el denominador es 0)' : `$= ${n((b22 - b21) / dp)}$`}<br>`
      + (mixto ? `Hay equilibrio mixto: el 1 juega <b>${nom.f[0]}</b> con probabilidad $p = ${n(mixto.p)}$ y el 2 juega <b>${nom.c[0]}</b> con $q = ${n(mixto.q)}$. Pagos esperados: $u_1 = ${n(mixto.u1)}$ y $u_2 = ${n(mixto.u2)}$.` : `No hay equilibrio mixto con probabilidades entre 0 y 1: ${motivoMixto}.`) });
    const pa = [[0, 0], [0, 1], [1, 0], [1, 1]].filter(([i, j]) => pareto[i][j]);
    pasos.push({ t: 'Eficiencia y tipo de juego', html: `Casillas óptimas de Pareto (no se puede mejorar a uno sin empeorar al otro): ${pa.map(([i, j]) => `<b>${N(i, j)}</b> ${cel(i, j)}`).join('; ')}.<br>${nash.length ? nash.map(([i, j]) => `${N(i, j)} ${pareto[i][j] ? 'es eficiente' : 'es <b>ineficiente</b>: otra casilla da más a los dos'}`).join('; ') + '.<br>' : ''}${tipo}` });
    return { A, B, nom, mejorF, mejorC, nash, domF, domC, mixto, motivoMixto, pareto, tipo, pasos };
  }

  const ej = (f1, f2, c1, c2, a, b) => ({ f1, f2, c1, c2, a11: a[0], a12: a[1], a21: a[2], a22: a[3], b11: b[0], b12: b[1], b21: b[2], b22: b[3] });
  const ejemplos = [
    { clave: 'prisionero', nombre: 'Dilema del prisionero', sc: ej('Callar', 'Confesar', 'Callar', 'Confesar', ['-1', '-10', '0', '-5'], ['-1', '0', '-10', '-5']) },
    { clave: 'coordinacion', nombre: 'Coordinación: elegir la misma plataforma', sc: ej('Blu-ray', 'HD DVD', 'Blu-ray', 'HD DVD', ['2', '0', '0', '1'], ['2', '0', '0', '1']) },
    { clave: 'gallina', nombre: 'Juego de la gallina', sc: ej('Seguir', 'Ceder', 'Seguir', 'Ceder', ['-10', '2', '0', '1'], ['-10', '0', '2', '1']) },
    { clave: 'pares', nombre: 'Cara o cruz (sin equilibrio puro)', sc: ej('Cara', 'Cruz', 'Cara', 'Cruz', ['1', '-1', '-1', '1'], ['-1', '1', '1', '-1']) },
    { clave: 'batalla', nombre: 'Batalla de los sexos', sc: ej('Ópera', 'Fútbol', 'Ópera', 'Fútbol', ['3', '0', '0', '2'], ['2', '0', '0', '3']) },
    { clave: 'cuota', nombre: 'Dos empresas: bajar el precio o mantenerlo', sc: ej('Mantener', 'Bajar', 'Mantener', 'Bajar', ['10', '4', '14', '6'], ['10', '14', '4', '6']) },
  ];

  return { resolver, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = TeoriaJuegos;
