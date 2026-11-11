/* =====================================================================
   Regresión sobre datos económicos (sin DOM): mínimos cuadrados ordinarios
   con una variable explicativa en tres formas, lineal (Y = β₀ + β₁X),
   doble logarítmica (ln Y = β₀ + β₁ ln X, β₁ es la elasticidad) y
   semilogarítmica (ln Y = β₀ + β₁X, tasa de crecimiento), con R² y R²
   ajustado, errores típicos, t, p-valor e intervalos de β₁, la lectura
   económica de cada coeficiente y una predicción. La t de Student sale de
   estadistica/calculo.js y el formato y la lectura de datos de
   economia/comun.js. Interfaz en regresion-economia/app.js.
     resolver(sc)  { datos, modelo, nx, ny, x0, nivel } → { b, a, r2, … , pasos }
   ===================================================================== */
const RegresionEconomia = (() => {
  const E = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee, vacio } = K;
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const d4 = (x) => x.toFixed(4).replace('.', ',').replace('-', '−');
  const MODELOS = {
    lineal: { nombre: 'Lineal: Y = β₀ + β₁X', u: (x) => x, w: (y) => y, U: 'X', W: 'Y' },
    loglog: { nombre: 'Doble logarítmica: ln Y = β₀ + β₁ ln X (elasticidad)', u: Math.log, w: Math.log, U: 'ln X', W: 'ln Y' },
    loglin: { nombre: 'Semilogarítmica: ln Y = β₀ + β₁X (crecimiento)', u: (x) => x, w: Math.log, U: 'X', W: 'ln Y' },
  };

  function resolver(sc) {
    const mod = MODELOS[sc.modelo] || MODELOS.lineal, modelo = MODELOS[sc.modelo] ? sc.modelo : 'lineal';
    // en mitad de una frase, el nombre en minúscula (salvo siglas como PIB)
    const nombre = (v, d) => { const t = String(v ?? '').trim() || d; return /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t; };
    const nx = nombre(sc.nx, 'X'), ny = nombre(sc.ny, 'Y');
    const pts = K.filas(sc.datos, 2, 'los datos').map(([x, y]) => ({ x, y }));
    if (pts.length < 3) throw new Error('Hacen falta al menos 3 observaciones (una fila «x y» por cada una)');
    if (modelo !== 'lineal' && pts.some((q) => q.y <= 0)) throw new Error('Con logaritmos, todos los valores de Y tienen que ser positivos');
    if (modelo === 'loglog' && pts.some((q) => q.x <= 0)) throw new Error('En el modelo doble logarítmico, todos los valores de X tienen que ser positivos');
    const nivel = (() => { let c = lee(sc, 'nivel', 'el nivel de confianza', { min: 0, minEx: true, max: 100, maxEx: true, def: 95 }); if (c >= 1) c /= 100; return c; })();
    const n = pts.length, nu = n - 2;
    const u = pts.map((q) => mod.u(q.x)), w = pts.map((q) => mod.w(q.y));
    const mu = u.reduce((s, v) => s + v, 0) / n, mw = w.reduce((s, v) => s + v, 0) / n;
    const Suu = u.reduce((s, v) => s + (v - mu) ** 2, 0), Suw = u.reduce((s, v, i) => s + (v - mu) * (w[i] - mw), 0), Sww = w.reduce((s, v) => s + (v - mw) ** 2, 0);
    if (Suu === 0) throw new Error(`Todos los valores de ${nx} son iguales: no se puede estimar el efecto de ${nx}`);
    const b = Suw / Suu, a = mw - b * mu;
    const SCR = w.reduce((s, v, i) => s + (v - a - b * u[i]) ** 2, 0), r2 = Sww === 0 ? 1 : 1 - SCR / Sww, r2aj = 1 - ((1 - r2) * (n - 1)) / nu;
    const s = Math.sqrt(SCR / nu), sb = s / Math.sqrt(Suu), sa = s * Math.sqrt(1 / n + (mu * mu) / Suu);
    const t = sb === 0 ? Infinity : b / sb, pval = sb === 0 ? 0 : E.betaI(nu / (nu + t * t), nu / 2, 0.5);
    const tk = E.cuantil(E.DIST.t, { nu }, 1 - (1 - nivel) / 2);
    const mx = pts.reduce((s2, q) => s2 + q.x, 0) / n, my = pts.reduce((s2, q) => s2 + q.y, 0) / n;
    const pred = (x) => (modelo === 'lineal' ? a + b * x : modelo === 'loglog' ? Math.exp(a) * x ** b : Math.exp(a + b * x));
    const x0 = vacio(sc.x0) ? null : lee(sc, 'x0', `el valor de ${nx} para predecir`);
    if (x0 !== null && modelo === 'loglog' && x0 <= 0) throw new Error(`Para predecir con logaritmos, ${nx} tiene que ser positivo`);
    const elast = modelo === 'lineal' ? (b * mx) / my : modelo === 'loglog' ? b : null;
    const crec = modelo === 'loglin' ? Math.exp(b) - 1 : null;
    const pc = `${f(100 * nivel)} %`;

    const U = mod.U, W = mod.W, uu = modelo === 'loglog' ? 'u' : 'x', ww = modelo === 'lineal' ? 'y' : 'w';
    const pasos = [];
    pasos.push({ t: 'Modelo', html: `${mod.nombre}, con ${n} observaciones.${modelo === 'lineal' ? '' : ` Se trabaja con ${modelo === 'loglog' ? `$u = ln x$ y ` : ''}$w = ln y$, y el modelo es una recta en esas variables.`}` });
    pasos.push({ t: 'Medias y sumas de cuadrados', html: `$${uu}̄ = ${f(mu)}$, $${ww}̄ = ${f(mw)}$<br>$S_{${uu}${uu}} = ∑ (${uu}_i − ${uu}̄)^2 = ${f(Suu)}$, $S_{${uu}${ww}} = ∑ (${uu}_i − ${uu}̄)(${ww}_i − ${ww}̄) = ${f(Suw)}$, $S_{${ww}${ww}} = ${f(Sww)}$` });
    pasos.push({ t: 'Estimación por mínimos cuadrados', html: `$β̂_1 = S_{${uu}${ww}}/S_{${uu}${uu}} = {${f(Suw)}}/{${f(Suu)}} = ${f(b)}$<br>$β̂_0 = ${ww}̄ − β̂_1 ${uu}̄ = ${f(mw)} − ${p(b)} · ${p(mu)} = ${f(a)}$<br>Recta estimada: $${W === 'Y' ? 'Ŷ' : 'ln Ŷ'} = ${f(a)} ${b < 0 ? '−' : '+'} ${f(Math.abs(b))} ${U === 'X' ? 'X' : 'ln X'}$${modelo === 'loglog' ? `, es decir, $Ŷ = e^{${f(a)}} X^{${f(b)}} = ${f(Math.exp(a))} X^{${f(b)}}$` : modelo === 'loglin' ? `, es decir, $Ŷ = ${f(Math.exp(a))} e^{${f(b)} X}$` : ''}` });
    pasos.push({ t: 'Bondad del ajuste', html: `Suma de cuadrados de los residuos: $SCR = ∑ (${ww}_i − ${ww}̂_i)^2 = ${f(SCR)}$<br>$R^2 = 1 − SCR/S_{${ww}${ww}} = 1 − ${f(SCR)}/${f(Sww)} = ${d4(r2)}$: el modelo explica el ${f(100 * r2, 4)} % de la variación de ${modelo === 'lineal' ? ny : `ln ${ny}`}.<br>$R̄^2 = 1 − (1 − R^2)(n − 1)/(n − 2) = ${d4(r2aj)}$` });
    pasos.push({ t: `¿Es significativo el efecto de ${nx}?`, html: `$s = √(SCR/(n − 2)) = √(${f(SCR)}/${nu}) = ${f(s)}$, &ensp; $s(β̂_1) = s/√S_{${uu}${uu}} = ${f(sb)}$, &ensp; $s(β̂_0) = s √(1/n + ${uu}̄^2/S_{${uu}${uu}}) = ${f(sa)}$<br>Contraste $H_0: β_1 = 0$: $t = β̂_1/s(β̂_1) = ${isFinite(t) ? f(t) : '∞'}$, con ${nu} grados de libertad; p-valor = <b>${E.prob(pval)}</b>. ${pval < 1 - nivel ? `Como p &lt; ${f(1 - nivel)}, se rechaza H₀: ${nx} influye de forma significativa en ${ny}.` : `Como p ≥ ${f(1 - nivel)}, no se rechaza H₀: con estos datos el efecto de ${nx} no es significativo.`}<br>Intervalo de β₁ al ${pc}, con $t_{${nu}; α/2} = ${f(tk)}$: $β̂_1 ± t · s(β̂_1)$ = (${f(b - tk * sb)}; ${f(b + tk * sb)})` });
    const lectura = modelo === 'lineal'
      ? `β̂₁ es el efecto marginal: si ${nx} aumenta en una unidad, ${ny} cambia en promedio <b>${f(b)}</b> unidades, con lo demás constante. β̂₀ = ${f(a)} es el valor estimado de ${ny} cuando ${nx} vale 0 (solo tiene sentido económico si X = 0 está cerca de los datos).<br>Elasticidad en el punto medio: $ε = β̂_1 · x̄/ȳ = ${f(b)} · ${f(mx)}/${f(my)} = ${f(elast)}$: si ${nx} sube un 1 %, ${ny} cambia un ${f(elast)} % en torno a la media.`
      : modelo === 'loglog'
        ? `En el modelo doble logarítmico β̂₁ es la elasticidad, constante en todos los puntos: si ${nx} sube un 1 %, ${ny} cambia un <b>${f(b)} %</b>. ${Math.abs(b) > 1 ? 'Como |ε| > 1, la respuesta es elástica (más que proporcional).' : Math.abs(b) < 1 ? 'Como |ε| < 1, la respuesta es inelástica (menos que proporcional).' : 'Con |ε| = 1, la respuesta es proporcional.'}`
        : `En el modelo semilogarítmico, por cada unidad más de ${nx}, ${ny} se multiplica por $e^{β̂_1} = e^{${f(b)}} = ${f(Math.exp(b))}$: cambia un <b>${f(100 * crec)} %</b> (aproximadamente 100 · β̂₁ = ${f(100 * b)} % cuando β̂₁ es pequeño). Si ${nx} es el tiempo en años, es la tasa de crecimiento anual media.`;
    pasos.push({ t: 'Lectura económica', html: lectura });
    if (x0 !== null) pasos.push({ t: 'Predicción', html: `Para ${nx} = ${f(x0)}: ${modelo === 'lineal' ? `$Ŷ = ${f(a)} ${b < 0 ? '−' : '+'} ${f(Math.abs(b))} · ${p(x0)}$` : modelo === 'loglog' ? `$Ŷ = ${f(Math.exp(a))} · ${f(x0)}^{${f(b)}}$` : `$Ŷ = ${f(Math.exp(a))} · e^{${f(b)} · ${p(x0)}}$`} = <b>${f(pred(x0))}</b>${x0 < Math.min(...pts.map((q) => q.x)) || x0 > Math.max(...pts.map((q) => q.x)) ? '. Ojo: está fuera del rango de los datos (extrapolación), y la predicción es menos fiable.' : ''}` });
    // residuos del ajuste, en la escala en la que se estima (en ln Y si el modelo lleva logaritmo de Y)
    const res = pts.map((q, i) => ({ x: q.x, y: q.y, e: w[i] - a - b * u[i] }));
    const mayor = res.reduce((m2, r) => (Math.abs(r.e) > Math.abs(m2.e) ? r : m2), res[0]), esc = modelo === 'lineal' ? '' : ' (en ln Y)';
    // cuántas veces cambia de signo el residuo al ir ordenado por X: pocas rachas largas apuntan a una forma mal elegida (curvatura)
    const ord = res.slice().sort((p1, p2) => p1.x - p2.x), cambios = ord.slice(1).filter((r, i) => (r.e > 0) !== (ord[i].e > 0)).length;
    // forma de U: pocos cambios de signo y residuos muy correlacionados con (u − ū)²
    const cu = u.map((v) => (v - mu) ** 2), mc = cu.reduce((s2, v) => s2 + v, 0) / n, Scc = cu.reduce((s2, v) => s2 + (v - mc) ** 2, 0), See = res.reduce((s2, r) => s2 + r.e * r.e, 0);
    const rce = Scc > 0 && See > 0 ? res.reduce((s2, r, i) => s2 + (cu[i] - mc) * r.e, 0) / Math.sqrt(Scc * See) : 0, curva = cambios <= 2 && n >= 7 && Math.abs(rce) > 0.7 && r2 < 0.99;
    pasos.push({ t: 'Residuos', html: `El residuo de cada observación es lo que el modelo no explica, $e_i = ${ww}_i − ${ww}̂_i$${esc}; con una constante en el modelo suman 0 (aquí ${f(res.reduce((s2, r) => s2 + r.e, 0))}). El mayor es ${f(mayor.e)} para ${nx} = ${f(mayor.x)}. Ordenados por ${nx}, cambian de signo ${cambios} ${cambios === 1 ? 'vez' : 'veces'}: ${curva ? '<b>forman una sola racha de cada signo</b> (positivos, negativos y de nuevo positivos, o al revés), lo que suele indicar una forma que no es la buena (por ejemplo, una curva ajustada con una recta); prueba con otro modelo' : 'se reparten sin un patrón claro, que es lo que se espera de un buen ajuste'}.` });
    return { modelo, res, esc, cambios, curva, nx, ny, pts, n, a, b, sa, sb, t, pval, nu, tk, nivel, r2, r2aj, s, SCR, elast, crec, x0, y0: x0 === null ? null : pred(x0), pred, mx, my, pasos };
  }

  const ejemplos = [
    { clave: 'consumo', nombre: 'Función de consumo: propensión marginal a consumir', sc: { modelo: 'lineal', nx: 'Renta disponible', ny: 'Consumo', datos: 'Renta Consumo\n10 9,6\n15 13,2\n20 16,8\n25 20,9\n30 24,1\n35 27,8\n40 31,5', x0: '45', nivel: '95' } },
    { clave: 'publicidad', nombre: 'Ventas y gasto en publicidad', sc: { modelo: 'lineal', nx: 'Publicidad', ny: 'Ventas', datos: '1 42\n2 49\n3 55\n4 58\n5 66\n6 69\n7 76\n8 80', x0: '10', nivel: '95' } },
    { clave: 'demanda', nombre: 'Elasticidad precio de la demanda (doble log)', sc: { modelo: 'loglog', nx: 'Precio', ny: 'Cantidad demandada', datos: '2 520\n2,5 410\n3 330\n3,5 280\n4 240\n4,5 210\n5 185', x0: '6', nivel: '95' } },
    { clave: 'engel', nombre: 'Curva de Engel: alimentación y renta (doble log)', sc: { modelo: 'loglog', nx: 'Renta', ny: 'Gasto en alimentación', datos: '800 260\n1200 330\n1600 390\n2000 430\n2500 480\n3000 520\n4000 600', x0: '3500', nivel: '95' } },
    { clave: 'pib', nombre: 'Tasa de crecimiento del PIB (semilog)', sc: { modelo: 'loglin', nx: 'Año', ny: 'PIB real', datos: '2015 100\n2016 102,9\n2017 105,9\n2018 108,3\n2019 110,4\n2020 98,7\n2021 105\n2022 111,4\n2023 114,3\n2024 117,9', x0: '2026', nivel: '95' } },
  ];

  return { resolver, ejemplos, MODELOS };
})();
if (typeof module !== 'undefined') module.exports = RegresionEconomia;
