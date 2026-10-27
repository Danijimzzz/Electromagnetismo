/* =====================================================================
   Curva de Phillips y ley de Okun (sin DOM): la ley de Okun (cuánto cambia
   el paro con el crecimiento del PIB, o cuánto hay que crecer para bajarlo),
   la brecha de producción con el paro natural, la curva de Phillips con
   expectativas (y un shock de oferta) y el ajuste de una curva de Phillips
   a datos de paro e inflación. Todo en %. Formato de economia/comun.js;
   interfaz en phillips-okun/app.js.
     resolver(sc)  { modo: 'okun' | 'brecha' | 'phillips' | 'datos', … } → { …, pasos }
   ===================================================================== */
const PhillipsOkun = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, num, lee } = K;
  const MODOS = { okun: 'Ley de Okun', brecha: 'Brecha de producción', phillips: 'Curva de Phillips', datos: 'Curva de Phillips con datos' };
  const n = (x) => f(x, 6).replace(/\./g, ''), p = (x) => `${f(x, 4)} %`;
  // número entre paréntesis si es negativo, para las fórmulas
  const par = (x) => (x < 0 ? `(${n(x)})` : n(x));
  const pct = (sc, k, nom, o = {}) => lee(sc, k, nom, { min: -100, max: 100, ...o });

  function okun(sc) {
    const u0 = pct(sc, 'u0', 'el paro de partida', { min: 0 }), gp = pct(sc, 'gp', 'el crecimiento potencial'), b = lee(sc, 'beta', 'el coeficiente de Okun β', { min: 0, minEx: true, max: 5 });
    const pasos = [{ t: 'Ley de Okun', html: `El paro baja cuando el PIB crece más deprisa que su potencial, $g_p = ${n(gp)}$ %, y sube cuando crece menos: $Δu = −β (g − g_p)$, con $β = ${n(b)}$ (por cada punto de crecimiento de más, el paro baja ${n(b)} puntos).` }];
    if (sc.busca === 'crecimiento') {
      const u1 = pct(sc, 'u1', 'el paro que se quiere', { min: 0 }), du = u1 - u0, g = gp - du / b;
      pasos.push({ t: 'Crecimiento necesario', html: `Despejando: $g = g_p − Δu/β = ${n(gp)} − ${par(du)}/${n(b)} = ${n(g)}$ %.` });
      pasos.push({ t: 'Qué significa', html: Math.abs(du) < 1e-12 ? 'Para mantener el paro, basta con crecer al ritmo potencial.' : du < 0 ? `Para bajar el paro de ${n(u0)} % a ${n(u1)} % en un año hay que crecer un ${n(g)} %, ${n(g - gp)} puntos por encima del potencial. Crecer un poco no basta: con un crecimiento menor que el potencial, el paro sube aunque el PIB aumente.` : `Con un crecimiento del ${n(g)} %, el paro sube a ${n(u1)} %.` });
      return { modo: 'okun', busca: 'crecimiento', u0, u1, du, g, gp, b, pasos };
    }
    const g = pct(sc, 'g', 'el crecimiento del PIB'), du = -b * (g - gp), u1 = u0 + du;
    if (u1 < 0) throw new Error('Con ese crecimiento el paro saldría negativo: la ley de Okun solo vale para cambios moderados');
    pasos.push({ t: 'Variación del paro', html: `$Δu = −${n(b)} · (${n(g)} − ${n(gp)}) = ${n(du)}$ puntos.` });
    pasos.push({ t: 'Paro al final del año', html: `$u_1 = u_0 + Δu = ${n(u0)} + ${par(du)} = ${n(u1)}$ %. ${Math.abs(du) < 1e-12 ? 'El PIB crece justo a su ritmo potencial y el paro no se mueve.' : du > 0 ? 'El PIB crece menos que su potencial y el paro sube.' : 'El PIB crece más que su potencial y el paro baja.'}` });
    return { modo: 'okun', busca: 'paro', u0, u1, du, g, gp, b, pasos };
  }

  function brecha(sc) {
    const u = pct(sc, 'u', 'el paro', { min: 0 }), un = pct(sc, 'un', 'el paro natural', { min: 0 }), c = lee(sc, 'c', 'el coeficiente de Okun', { min: 0, minEx: true, max: 10 });
    const Yp = lee(sc, 'Yp', 'el PIB potencial', { min: 0, minEx: true, def: null }), br = -c * (u - un), pasos = [];
    pasos.push({ t: 'Brecha de producción', html: `Con la ley de Okun en niveles, $(Y − Y_p)/Y_p = −c (u − u_n) = −${n(c)} · (${n(u)} − ${n(un)}) = ${n(br)}$ %.` });
    pasos.push({ t: 'Qué significa', html: Math.abs(br) < 1e-12 ? 'El paro está en su tasa natural: la economía produce su PIB potencial.' : br < 0 ? `El paro está ${n(u - un)} puntos por encima del natural (paro cíclico) y la economía produce un ${n(-br)} % menos de lo que podría.` : `El paro está por debajo del natural: la economía produce por encima de su potencial, algo que no dura (suele traer inflación).` });
    let Y = null;
    if (Yp !== null) { Y = Yp * (1 + br / 100); pasos.push({ t: 'En euros', html: `PIB en miles de millones: $Y = Y_p (1 ${br < 0 ? '−' : '+'} ${f(Math.abs(br) / 100, 6)}) = ${n(Yp)} · ${f(1 + br / 100, 6)} = ${n(Y)}$: ${br < 0 ? 'se pierden' : 'se producen de más'} ${num(Math.abs(Y - Yp), 1)} mil millones de euros.` }); }
    return { modo: 'brecha', u, un, c, br, Yp, Y, pasos };
  }

  function phillips(sc) {
    const pe = pct(sc, 'pe', 'la inflación esperada'), a = lee(sc, 'alfa', 'la pendiente α', { min: 0, minEx: true, max: 10 }), un = pct(sc, 'un', 'el paro natural', { min: 0 }), u = pct(sc, 'u', 'el paro', { min: 0 });
    const s = pct(sc, 's', 'el shock de oferta', { def: 0 }), pi = pe - a * (u - un) + s, pasos = [];
    pasos.push({ t: 'Curva de Phillips con expectativas', html: `$π = π^e − α (u − u_n)${s ? ' + s' : ''} = ${n(pe)} − ${n(a)} · (${n(u)} − ${n(un)})${s ? ` + ${par(s)}` : ''} = ${n(pi)}$ %.` });
    pasos.push({ t: 'Paro e inflación', html: Math.abs(u - un) < 1e-12 ? 'Con el paro en su tasa natural, la inflación es la esperada.' : u < un ? `El paro está por debajo del natural: las empresas compiten por los trabajadores, suben los salarios y la inflación supera a la esperada en ${n(-a * (u - un))} puntos.` : `El paro está por encima del natural: los salarios suben poco y la inflación queda ${n(a * (u - un))} puntos por debajo de la esperada.` });
    if (s) pasos.push({ t: 'Shock de oferta', html: s > 0 ? `Una subida de costes (como el petróleo) añade ${n(s)} puntos: ${u >= un ? 'paro alto e inflación alta a la vez, la <b>estanflación</b> de los años 70.' : 'la inflación sube aún más.'}` : `Un abaratamiento de costes resta ${n(-s)} puntos a la inflación.` });
    pasos.push({ t: 'A largo plazo', html: `Si la inflación de verdad (${n(pi)} %) no es la esperada (${n(pe)} %), la gente revisa sus expectativas y la curva se desplaza. Solo con $u = u_n = ${n(un)}$ % se cumplen las expectativas: a largo plazo la curva es vertical y no se puede bajar el paro de forma duradera a cambio de más inflación.` });
    return { modo: 'phillips', pe, a, un, u, s, pi, pasos };
  }

  function datos(sc) {
    const pts = K.filas(sc.datos, 2, 'los datos');
    if (pts.length < 3) throw new Error('Hacen falta al menos 3 años de datos (paro e inflación en cada fila)');
    const N = pts.length, mx = pts.reduce((s, [x]) => s + x, 0) / N, my = pts.reduce((s, [, y]) => s + y, 0) / N;
    const sxx = pts.reduce((s, [x]) => s + (x - mx) ** 2, 0), syy = pts.reduce((s, [, y]) => s + (y - my) ** 2, 0), sxy = pts.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0);
    if (sxx === 0) throw new Error('El paro es igual todos los años: no se puede ajustar una recta');
    const b = sxy / sxx, a = my - b * mx, r = syy ? sxy / Math.sqrt(sxx * syy) : 0, pasos = [];
    pasos.push({ t: 'Medias', html: `Con ${N} años: $u_m = ${n(mx)}$ % y $π_m = ${n(my)}$ %.` });
    pasos.push({ t: 'Recta de mínimos cuadrados', html: `$b = S_{uπ}/S_{uu} = ${n(sxy)}/${n(sxx)} = ${f(b, 4)}$ y $a = π_m − b u_m = ${f(a, 4)}$, así que $π = ${f(a, 4)} ${b < 0 ? '−' : '+'} ${f(Math.abs(b), 4)} u$.` });
    pasos.push({ t: 'Correlación', html: `$r = S_{uπ}/√(S_{uu} S_{ππ}) = ${f(r, 4)}$ y $r^2 = ${f(r * r, 4)}$: la recta explica el ${f(100 * r * r, 3)} % de la variación de la inflación.` });
    pasos.push({ t: 'Qué dice', html: b < 0 ? `Hay curva de Phillips: en estos datos, cada punto menos de paro va con ${f(-b, 3)} puntos más de inflación${Math.abs(r) < 0.5 ? ', aunque la relación es débil' : ''}.` : 'La pendiente sale positiva: en estos años el paro y la inflación subieron juntos (como en una estanflación) y no se ve una curva de Phillips estable.' });
    return { modo: 'datos', pts, N, a, b, r, mx, my, pasos };
  }

  const R = { okun, brecha, phillips, datos };
  const resolver = (sc) => (R[sc.modo] || okun)(sc);

  const ejemplos = [
    { clave: 'recesion', nombre: 'Recesión: el PIB cae un 1 %', sc: { modo: 'okun', busca: 'paro', u0: '14', g: '−1', gp: '2', beta: '0,5' } },
    { clave: 'bajar-paro', nombre: 'Cuánto crecer para bajar el paro del 12 al 10 %', sc: { modo: 'okun', busca: 'crecimiento', u0: '12', u1: '10', gp: '2', beta: '0,5' } },
    { clave: 'brecha', nombre: 'Paro del 9 % con un paro natural del 6 %', sc: { modo: 'brecha', u: '9', un: '6', c: '2', Yp: '1400' } },
    { clave: 'phillips', nombre: 'Paro por debajo del natural', sc: { modo: 'phillips', pe: '2', alfa: '0,5', un: '5', u: '3', s: '0' } },
    { clave: 'estanflacion', nombre: 'Estanflación: shock del petróleo', sc: { modo: 'phillips', pe: '2', alfa: '0,5', un: '5', u: '6', s: '4' } },
    { clave: 'datos', nombre: 'Diez años de un país (datos de ejemplo)', sc: { modo: 'datos', datos: 'paro inflación\n4 5,1\n5 4,2\n6,5 3,4\n8 2,3\n7 3,1\n5,5 3,9\n4,5 4,9\n6 3,2\n7,5 2,9\n9 1,8' } },
  ];

  return { resolver, ejemplos, MODOS };
})();
if (typeof module !== 'undefined') module.exports = PhillipsOkun;
