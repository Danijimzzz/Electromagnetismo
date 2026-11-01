/* =====================================================================
   Modelo IS-LM (sin DOM): equilibrio simultáneo del mercado de bienes y del de
   dinero en una economía cerrada con precios fijos.
   - IS: Y = C + I + G, con C = c₀ + c₁·(Y − T) e I = I₀ − b·i (i en %), da
     i = (A − (1 − c₁)·Y)/b, con A = c₀ − c₁·T + I₀ + G (gasto autónomo).
   - LM: M/P = k·Y − h·i (oferta de dinero real = demanda de dinero), da
     i = (k·Y − M/P)/h.
   - Equilibrio: Y* = (A + b·m/h)/((1 − c₁) + b·k/h), i* = (k·Y* − m)/h, con m = M/P.
   Opcionalmente se aplica una política (ΔG, ΔT, ΔM) y se compara el nuevo
   equilibrio con el multiplicador keynesiano simple (expulsión o crowding out).
   Formato en euros de economia/comun.js; interfaz en is-lm/app.js.
     resolver(sc)  { c0, c1, T, I0, b, G, M, P, k, h, dG, dT, dM } → { y, i, c, inv, … , pasos }
   ===================================================================== */
const IsLm = (() => {
  const K = typeof Eco !== 'undefined' ? Eco : require('../economia/comun.js');
  const { f, lee } = K;
  // números dentro de una fórmula: sin punto de miles (Mates lo leería como decimal)
  const u = (x) => f(x, 8).replace(/\./g, '');
  const s = (x) => (x < 0 ? `− ${u(-x)}` : `+ ${u(x)}`);

  function resolver(sc) {
    const c0 = lee(sc, 'c0', 'el consumo autónomo c₀', { min: 0 });
    const c1 = lee(sc, 'c1', 'la propensión marginal a consumir c₁', { min: 0, max: 1, maxEx: true });
    const T = lee(sc, 'T', 'los impuestos T', { min: 0 });
    const I0 = lee(sc, 'I0', 'la inversión autónoma I₀', { min: 0 });
    const b = lee(sc, 'b', 'la sensibilidad de la inversión b', { min: 0, minEx: true });
    const G = lee(sc, 'G', 'el gasto público G', { min: 0 });
    const M = lee(sc, 'M', 'la oferta monetaria M', { min: 0 });
    const P = lee(sc, 'P', 'el nivel de precios P', { min: 0, minEx: true });
    const k = lee(sc, 'k', 'la sensibilidad de la demanda de dinero a la renta k', { min: 0, minEx: true });
    const h = lee(sc, 'h', 'la sensibilidad de la demanda de dinero al tipo h', { min: 0, minEx: true });
    const dG = lee(sc, 'dG', 'la variación del gasto ΔG', { def: 0 });
    const dT = lee(sc, 'dT', 'la variación de impuestos ΔT', { def: 0 });
    const dM = lee(sc, 'dM', 'la variación de la oferta monetaria ΔM', { def: 0 });
    if (T + dT < 0) throw new Error('Los impuestos no pueden quedar negativos: ΔT es demasiado grande');
    if (G + dG < 0) throw new Error('El gasto público no puede quedar negativo: ΔG es demasiado grande');
    if (M + dM < 0) throw new Error('La oferta monetaria no puede quedar negativa: ΔM es demasiado grande');
    const politica = dG !== 0 || dT !== 0 || dM !== 0;
    const m = M / P, A = c0 - c1 * T + I0 + G, alfa = 1 / (1 - c1), den = (1 - c1) + b * k / h;
    const pasos = [];
    pasos.push({ t: 'Curva IS (mercado de bienes)', html: `El equilibrio exige $Y = C + I + G$ con $C = c_0 + c_1 (Y − T)$ e $I = I_0 − b · i$. Con el gasto autónomo $A = c_0 − c_1 T + I_0 + G = ${u(c0)} − ${u(c1)} · ${u(T)} + ${u(I0)} + ${u(G)} = ${u(A)}$ queda $Y = {A − b · i}/{1 − c_1}$, es decir, $IS: i = {A − (1 − c_1) Y}/{b} = ${u(A / b)} − ${u((1 - c1) / b)} · Y$. Tiene pendiente negativa: a menor tipo, más inversión y más renta.` });
    pasos.push({ t: 'Curva LM (mercado de dinero)', html: `La oferta de dinero real es $M/P = ${u(M)}/${u(P)} = ${u(m)}$ y se iguala a la demanda $L = k · Y − h · i$: $${u(m)} = ${u(k)} · Y − ${u(h)} · i$, es decir, $LM: i = {k · Y − M/P}/{h} = ${u(k / h)} · Y ${s(-m / h)}$. Tiene pendiente positiva: más renta pide más dinero para transacciones y, con la oferta fija, el tipo tiene que subir.` });
    const eq = (A_, m_) => { const y = (A_ + b * m_ / h) / den; return { y, i: (k * y - m_) / h }; };
    const e0 = eq(A, m), y = e0.y, i = e0.i, c = c0 + c1 * (y - T), inv = I0 - b * i;
    pasos.push({ t: 'Equilibrio', html: `Sustituyendo la LM en la IS: $Y^* = {A + b · M/P / h}/{(1 − c_1) + b · k / h} = {${u(A)} + ${u(b)} · ${u(m)} / ${u(h)}}/{${u(1 - c1)} + ${u(b * k / h)}} = ${u(y)}$ y, en la LM, $i^* = {k · Y^* − M/P}/{h} = {${u(k)} · ${u(y)} − ${u(m)}}/{${u(h)}} = ${u(i)}$ %.` });
    pasos.push({ t: 'Comprobación por componentes', html: `$C = c_0 + c_1 (Y^* − T) = ${u(c)}$, $I = I_0 − b · i^* = ${u(inv)}$ y $G = ${u(G)}$ suman $${u(c + inv + G)}$, que es $Y^*$.${i < 0 ? ' El tipo sale negativo: el modelo lineal no tiene en cuenta que el tipo nominal no baja de cero (trampa de liquidez).' : ''}` });
    const r = { c0, c1, T, I0, b, G, M, P, k, h, dG, dT, dM, politica, m, A, alfa, den, y, i, c, inv, mf: 1 / den, mm: (b / h) / den, isA: A / b, isP: (1 - c1) / b, lmP: k / h, lmO: -m / h, pasos };
    if (!politica) return r;

    const dA = dG - c1 * dT, dm = dM / P, A1 = A + dA, m1 = m + dm, e1 = eq(A1, m1);
    const dy = e1.y - y, di = e1.i - i, c1n = c0 + c1 * (e1.y - (T + dT)), inv1 = I0 - b * e1.i;
    pasos.push({ t: 'Qué cambia con la política', html: `${dG || dT ? `El gasto autónomo varía $ΔA = ΔG − c_1 ΔT = ${u(dG)} − ${u(c1)} · ${u(dT)} = ${u(dA)}$ y la IS se desplaza ${dA > 0 ? 'a la derecha' : dA < 0 ? 'a la izquierda' : 'cero'}. ` : ''}${dM ? `La oferta monetaria real varía $Δ(M/P) = ${u(dM)}/${u(P)} = ${u(dm)}$ y la LM se desplaza ${dm > 0 ? 'hacia abajo (a la derecha)' : 'hacia arriba (a la izquierda)'}. ` : ''}Con los nuevos valores, $A' = ${u(A1)}$ y $M/P' = ${u(m1)}$.` });
    pasos.push({ t: 'Nuevo equilibrio', html: `$Y' = {A' + b · M/P' / h}/{(1 − c_1) + b · k / h} = ${u(e1.y)}$ e $i' = {k · Y' − M/P'}/{h} = ${u(e1.i)}$ %. La renta varía $ΔY = ${u(dy)}$ y el tipo de interés $Δi = ${u(di)}$ puntos. El consumo pasa a $${u(c1n)}$ y la inversión a $${u(inv1)}$ ($ΔI = ${u(inv1 - inv)}$).` });
    const mf = r.mf, mm = r.mm, yf = dA * mf, ym = dm * mm;
    pasos.push({ t: 'Multiplicadores', html: `Fiscal: $ΔY/ΔA = {1}/{(1 − c_1) + b · k / h} = ${u(mf)}$, frente al multiplicador keynesiano simple $α = {1}/{1 − c_1} = ${u(alfa)}$. Monetario: $ΔY/Δ(M/P) = {b / h}/{(1 − c_1) + b · k / h} = ${u(mm)}$.${dA && dm ? ` Efecto fiscal $${u(yf)}$ y efecto monetario $${u(ym)}$, que suman $ΔY$.` : ''}` });
    const ex = alfa * dA - yf;
    if (dA) pasos.push({ t: 'Efecto expulsión (crowding out)', html: `Sin reacción del tipo de interés, el multiplicador simple daría $α · ΔA = ${u(alfa)} · ${u(dA)} = ${u(alfa * dA)}$. Como la renta sube, aumenta la demanda de dinero y sube el tipo, lo que frena la inversión: el efecto fiscal real es $${u(yf)}$ y la inversión privada expulsada, en términos de renta, $${u(ex)}$ (${f(100 * ex / (alfa * dA), 4)} % del efecto simple).` });
    return { ...r, dA, dm, A1, m1, y1: e1.y, i1: e1.i, dy, di, c1n, inv1, yf, ym, ex };
  }

  const base = { c0: '100', c1: '0,75', T: '200', I0: '300', b: '30', G: '150', M: '800', P: '2', k: '0,5', h: '20', dG: '', dT: '', dM: '' };
  const ejemplos = [
    { clave: 'equilibrio', nombre: 'Equilibrio de una economía', sc: { ...base } },
    { clave: 'fiscal', nombre: 'Política fiscal expansiva: +50 de gasto', sc: { ...base, dG: '50' } },
    { clave: 'monetaria', nombre: 'Política monetaria expansiva: +200 de dinero', sc: { ...base, dM: '200' } },
    { clave: 'impuestos', nombre: 'Bajada de impuestos de 50', sc: { ...base, dT: '-50' } },
    { clave: 'mixta', nombre: 'Combinación: más gasto y más dinero', sc: { ...base, dG: '50', dM: '200' } },
    { clave: 'trampa', nombre: 'Trampa de liquidez: LM casi plana', sc: { ...base, h: '100000', dG: '50' } },
  ];

  return { resolver, ejemplos };
})();
if (typeof module !== 'undefined') module.exports = IsLm;
