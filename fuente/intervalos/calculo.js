/* =====================================================================
   Intervalos de confianza (sin DOM): media con σ conocida (z) o
   desconocida (t de Student), proporción, varianza y desviación típica
   (χ²), diferencia de medias (σ conocidas, iguales o distintas, Welch) y
   de proporciones, y el tamaño de muestra para un error máximo. Los datos
   pueden ser un resumen (x̄, s, n) o la lista de valores.
   Los cuantiles de z, t y χ² salen de estadistica/calculo.js.
   ===================================================================== */
const Intervalos = (() => {
  const E = typeof Estadistica !== 'undefined' ? Estadistica : require('../estadistica/calculo.js');
  const f = (x, d = 4) => {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    const a = Math.abs(x);
    const s = a >= 1e6 || a < 1e-3 ? x.toExponential(d - 1).replace(/\.?0+e/, 'e').replace('e', '·10^').replace(/\^([+-]?)(\d+)/, (_, sg, e) => `<sup>${sg === '-' ? '−' : ''}${+e}</sup>`) : String(+x.toPrecision(d));
    return s.replace('.', ',').replace('-', '−');
  };
  const p = (x) => (x < 0 ? `(${f(x)})` : f(x));
  const leeNum = (s) => +String(s ?? '').trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-').replace(/[·x×*]10\^?([+\-]?\d+)/i, 'e$1');
  const vacio = (v) => v === undefined || v === null || String(v).trim() === '';
  function lee(sc, k, nom, { min = -Infinity, minEx = false, max = Infinity, entero = false, opcional = false } = {}) {
    if (vacio(sc[k])) { if (opcional) return null; throw new Error(`Falta ${nom}`); }
    const x = leeNum(sc[k]);
    if (!isFinite(x)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} no es un número`);
    if (entero && !Number.isInteger(x)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} tiene que ser un número entero`);
    if (x < min || (minEx && x === min)) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} tiene que ser ${minEx ? 'mayor que' : 'al menos'} ${f(min)}`);
    if (x > max) throw new Error(`${nom[0].toUpperCase() + nom.slice(1)} tiene que ser como mucho ${f(max)}`);
    return x;
  }
  // una lista de números separados por espacios, «;» o saltos de línea (la coma es decimal)
  function leeLista(texto, nom) {
    const xs = String(texto ?? '').split(/[\s;]+/).filter((t) => t).map((t) => leeNum(t));
    if (xs.some((x) => !isFinite(x))) throw new Error(`Hay algo en ${nom} que no es un número (la coma es decimal; separa con espacios o «;»)`);
    if (xs.length < 2) throw new Error(`Hacen falta al menos dos valores en ${nom}`);
    return xs;
  }

  /* ---------- Valores críticos ---------- */
  const N01 = { mu: 0, sigma: 1 };
  const zc = (a) => E.cuantil(E.DIST.normal, N01, 1 - a);
  const tc = (nu, a) => E.cuantil(E.DIST.t, { nu }, 1 - a);
  const xc = (k, a) => E.cuantil(E.DIST.chi2, { k }, 1 - a);
  const ic = (a, b) => `(${f(a, 5)}; ${f(b, 5)})`;
  // nivel de confianza: 95, 95 %, 0,95
  function nivel(sc) {
    let c = lee(sc, 'nivel', 'el nivel de confianza', { min: 0, minEx: true });
    if (c >= 1) c /= 100;
    if (!(c > 0 && c < 1)) throw new Error('El nivel de confianza tiene que estar entre 0 y 100 %');
    return c;
  }
  const pc = (c) => `${f(100 * c)} %`;
  const alfaTxt = (c) => `1 − α = ${f(c)} ⇒ α = ${f(1 - c)}, α/2 = ${f((1 - c) / 2)}`;

  /* ---------- Una muestra: resumen o lista ---------- */
  function muestra(sc, sufijo = '', nom = 'la muestra') {
    if ((sc['fuente' + sufijo] ?? sc.fuente) === 'datos') {
      const xs = leeLista(sc['datos' + sufijo], nom), n = xs.length, m = xs.reduce((s, x) => s + x, 0) / n, ss = xs.reduce((s, x) => s + (x - m) ** 2, 0);
      return { n, m, sc: Math.sqrt(ss / (n - 1)), sn: Math.sqrt(ss / n), xs, lista: true };
    }
    const n = lee(sc, 'n' + sufijo, `el tamaño n${sufijo}`, { min: 2, entero: true }), m = lee(sc, 'xm' + sufijo, `la media x̄${sufijo}`);
    const s = lee(sc, 's' + sufijo, `la desviación s${sufijo}`, { min: 0, minEx: true, opcional: true });
    if (s === null) return { n, m, sc: null, sn: null };
    return sc.tipoS === 'muestral' ? { n, m, sn: s, sc: s * Math.sqrt(n / (n - 1)) } : { n, m, sc: s, sn: s * Math.sqrt((n - 1) / n) };
  }
  const datosTxt = (M, i = '') => M.lista
    ? `n${i} = ${M.n} valores: x̄${i} = Σx/n = <b>${f(M.m, 6)}</b>, cuasidesviación s${i} = √(Σ(x − x̄)<sup>2</sup>/(n − 1)) = <b>${f(M.sc, 5)}</b> (la desviación típica con n es ${f(M.sn, 5)})`
    : `n${i} = ${M.n}, x̄${i} = ${f(M.m, 6)}${M.sc !== null ? `, cuasidesviación s${i} = ${f(M.sc, 5)}` : ''}`;
  const cuasiNota = (sc, M) => (!M.lista && sc.tipoS === 'muestral' && M.sc !== null ? ` La desviación dada es la de la muestra (con n), así que la cuasidesviación es s = σ<sub>n</sub>·√(n/(n − 1)) = ${f(M.sn, 5)}·√(${M.n}/${M.n - 1}) = ${f(M.sc, 5)}.` : '');

  /* ---------- Cada intervalo ---------- */
  // devuelven { a, b } y, con detalle, el desarrollo; la simulación los llama sin detalle
  function media(sc) {
    const c = nivel(sc), al = 1 - c, M = muestra(sc), conocida = sc.sigmaC === 'si', pasos = [];
    const sigma = conocida ? lee(sc, 'sigma', 'la desviación típica de la población σ', { min: 0, minEx: true }) : null;
    if (!conocida && M.sc === null) throw new Error('Falta la desviación s de la muestra');
    pasos.push({ t: 'Datos', html: `${datosTxt(M)}${conocida ? `, σ = ${f(sigma)} (conocida)` : ''}.${cuasiNota(sc, M)}<br>${alfaTxt(c)}` });
    let k, nombre, sd, h;
    if (conocida) {
      k = zc(al / 2); sd = sigma / Math.sqrt(M.n); nombre = `z<sub>α/2</sub> = z<sub>${f(al / 2)}</sub>`;
      h = `Con σ conocida, Z = (x̄ − μ)/(σ/√n) ~ N(0, 1). Se busca z<sub>α/2</sub> con P(Z &gt; z<sub>α/2</sub>) = ${f(al / 2)}, es decir Φ(z<sub>α/2</sub>) = ${f(1 - al / 2)}:<br>${nombre} = <b>${f(k)}</b>`;
    } else {
      k = tc(M.n - 1, al / 2); sd = M.sc / Math.sqrt(M.n); nombre = `t<sub>${M.n - 1}; α/2</sub> = t<sub>${M.n - 1}; ${f(al / 2)}</sub>`;
      h = `Con σ desconocida se usa la cuasidesviación s y T = (x̄ − μ)/(s/√n) sigue una t de Student con n − 1 = ${M.n - 1} grados de libertad. Se busca el valor que deja ${f(al / 2)} a su derecha:<br>${nombre} = <b>${f(k)}</b>`;
    }
    pasos.push({ t: 'Valor crítico', html: h });
    const err = k * sd, a = M.m - err, b = M.m + err;
    pasos.push({ t: 'Error máximo', html: `E = ${conocida ? 'z<sub>α/2</sub>·σ/√n' : 't<sub>n−1; α/2</sub>·s/√n'} = ${f(k)}·${f(conocida ? sigma : M.sc)}/√${M.n} = <b>${f(err)}</b>` });
    pasos.push({ t: 'Intervalo', html: `IC<sub>${f(c)}</sub>(μ) = (x̄ − E, x̄ + E) = (${f(M.m, 6)} − ${f(err)}, ${f(M.m, 6)} + ${f(err)}) = <b>${ic(a, b)}</b>` });
    if (!conocida && M.n >= 30) { const z = zc(al / 2), e2 = (z * M.sc) / Math.sqrt(M.n); pasos.push({ t: 'Con una muestra grande', html: `Como n ≥ 30, muchos libros usan z<sub>α/2</sub> = ${f(z)} en vez de t: E = ${f(e2)} y el intervalo sería ${ic(M.m - e2, M.m + e2)}, casi igual.` }); }
    pasos.push({ t: 'Interpretación', html: `Con una confianza del ${pc(c)}, la media de la población μ está entre ${f(a)} y ${f(b)}.` });
    return { a, b, est: M.m, err, k, crit: conocida ? 'z' : 't', gl: conocida ? null : M.n - 1, c, M, sigma, pasos, param: 'μ', dist: conocida ? { d: 'normal' } : { d: 't', nu: M.n - 1 } };
  }
  function exitos(sc, i = '') {
    const n = lee(sc, 'n' + i, `el tamaño n${i}`, { min: 1, entero: true });
    if (sc.tipoP === 'proporcion') { const ph = lee(sc, 'ph' + i, `la proporción p̂${i}`, { min: 0, max: 1 }); return { n, ph, x: null }; }
    const x = lee(sc, 'x' + i, `el número de éxitos x${i}`, { min: 0, entero: true });
    if (x > n) throw new Error(`Los éxitos x${i} no pueden ser más que n${i}`);
    return { n, x, ph: x / n };
  }
  function proporcion(sc) {
    const c = nivel(sc), al = 1 - c, P = exitos(sc), q = 1 - P.ph, pasos = [];
    pasos.push({ t: 'Datos', html: `n = ${P.n}, ${P.x !== null ? `x = ${P.x} éxitos ⇒ p̂ = x/n = ${P.x}/${P.n} = ` : 'p̂ = '}<b>${f(P.ph)}</b>, q̂ = 1 − p̂ = ${f(q)}<br>${alfaTxt(c)}` });
    const k = zc(al / 2), sd = Math.sqrt((P.ph * q) / P.n);
    pasos.push({ t: 'Valor crítico', html: `Para n grande, p̂ ≈ N(p, √(pq/n)): z<sub>α/2</sub> = z<sub>${f(al / 2)}</sub> = <b>${f(k)}</b>` });
    let err = k * sd, a = P.ph - err, b = P.ph + err;
    pasos.push({ t: 'Error máximo', html: `E = z<sub>α/2</sub>·√(p̂q̂/n) = ${f(k)}·√(${f(P.ph)}·${f(q)}/${P.n}) = <b>${f(err)}</b>` });
    pasos.push({ t: 'Intervalo', html: `IC<sub>${f(c)}</sub>(p) = (p̂ − E, p̂ + E) = <b>${ic(a, b)}</b>${a < 0 || b > 1 ? ` (se recorta a ${ic(Math.max(0, a), Math.min(1, b))}, porque p está entre 0 y 1)` : ''}` });
    if (P.n * P.ph < 5 || P.n * q < 5) {
      // intervalo de Wilson: no se sale de [0, 1] ni se queda en un punto con 0 éxitos o con todos
      const k2 = k * k, cen = (P.ph + k2 / (2 * P.n)) / (1 + k2 / P.n), med = (k / (1 + k2 / P.n)) * Math.sqrt((P.ph * q) / P.n + k2 / (4 * P.n * P.n));
      const wa = Math.max(0, cen - med), wb = Math.min(1, cen + med), extremo = P.ph === 0 || P.ph === 1;
      pasos.push({ t: 'Cuidado', html: `np̂ = ${f(P.n * P.ph)} o nq̂ = ${f(P.n * q)} es menor que 5: la aproximación normal no es buena con tan pocos éxitos o fracasos.${extremo ? ` Con p̂ = ${f(P.ph)}, el error sale 0 y el intervalo se queda en un punto, lo que no tiene sentido.` : ''}` });
      pasos.push({ t: 'Intervalo de Wilson', html: `Funciona bien aunque haya pocos éxitos o fracasos:<br>centro = (p̂ + z<sup>2</sup>/(2n))/(1 + z<sup>2</sup>/n) = ${f(cen)}, &ensp; semiamplitud = z/(1 + z<sup>2</sup>/n)·√(p̂q̂/n + z<sup>2</sup>/(4n<sup>2</sup>)) = ${f(med)}<br>IC<sub>${f(c)}</sub>(p) = <b>${ic(wa, wb)}</b>${extremo ? ' (es el que se da como resultado)' : ''}` });
      if (extremo) { a = wa; b = wb; err = (wb - wa) / 2; }
    }
    pasos.push({ t: 'Interpretación', html: `Con una confianza del ${pc(c)}, la proporción de la población está entre ${f(100 * Math.max(0, a))} % y ${f(100 * Math.min(1, b))} %.` });
    return { a, b, est: P.ph, err, k, crit: 'z', c, P, pasos, param: 'p', dist: { d: 'normal' } };
  }
  function varianza(sc) {
    // para la varianza no hace falta la media
    const c = nivel(sc), al = 1 - c, M = muestra(vacio(sc.xm) ? { ...sc, xm: '0' } : sc), pasos = [];
    if (M.sc === null) throw new Error('Falta la desviación s de la muestra');
    const nu = M.n - 1, s2 = M.sc ** 2;
    pasos.push({ t: 'Datos', html: `${M.lista ? datosTxt(M) : `n = ${M.n}, cuasidesviación s = ${f(M.sc, 5)}`} ⇒ s<sup>2</sup> = ${f(s2, 5)}.${cuasiNota(sc, M)}<br>${alfaTxt(c)}` });
    const ks = xc(nu, al / 2), ki = xc(nu, 1 - al / 2);
    pasos.push({ t: 'Valores críticos', html: `(n − 1)s<sup>2</sup>/σ<sup>2</sup> sigue una χ<sup>2</sup> con n − 1 = ${nu} grados de libertad, que no es simétrica: hacen falta los dos valores que dejan ${f(al / 2)} en cada cola.<br>χ<sup>2</sup><sub>${nu}; ${f(al / 2)}</sub> = <b>${f(ks)}</b> (deja ${f(al / 2)} a la derecha), &ensp; χ<sup>2</sup><sub>${nu}; ${f(1 - al / 2)}</sub> = <b>${f(ki)}</b> (deja ${f(al / 2)} a la izquierda)` });
    const a = (nu * s2) / ks, b = (nu * s2) / ki;
    pasos.push({ t: 'Intervalo de la varianza', html: `IC<sub>${f(c)}</sub>(σ<sup>2</sup>) = ((n − 1)s<sup>2</sup>/χ<sup>2</sup><sub>α/2</sub>, (n − 1)s<sup>2</sup>/χ<sup>2</sup><sub>1−α/2</sub>) = (${nu}·${f(s2, 5)}/${f(ks)}, ${nu}·${f(s2, 5)}/${f(ki)}) = <b>${ic(a, b)}</b>` });
    pasos.push({ t: 'Intervalo de la desviación típica', html: `Con la raíz de los dos extremos: IC<sub>${f(c)}</sub>(σ) = (√${f(a)}, √${f(b)}) = <b>${ic(Math.sqrt(a), Math.sqrt(b))}</b>` });
    pasos.push({ t: 'Interpretación', html: `Con una confianza del ${pc(c)}, σ<sup>2</sup> está entre ${f(a)} y ${f(b)}. El intervalo no es simétrico alrededor de s<sup>2</sup> porque la χ<sup>2</sup> no lo es.` });
    return { a, b, est: s2, k: ks, k2: ki, crit: 'chi2', gl: nu, c, M, sa: Math.sqrt(a), sb: Math.sqrt(b), pasos, param: 'σ²', dist: { d: 'chi2', k: nu } };
  }
  const conclusion = (a, b, q) => (a > 0 ? `Todo el intervalo es positivo: con esa confianza ${q[0]} es mayor que ${q[1]}.` : b < 0 ? `Todo el intervalo es negativo: con esa confianza ${q[0]} es menor que ${q[1]}.` : `El intervalo contiene el 0: con esa confianza no se puede decir que ${q[0]} y ${q[1]} sean distintas.`);
  function difMedias(sc) {
    const c = nivel(sc), al = 1 - c, M1 = muestra(sc, '1', 'la muestra 1'), M2 = muestra(sc, '2', 'la muestra 2'), caso = ['conocidas', 'iguales', 'distintas'].includes(sc.caso) ? sc.caso : 'iguales', pasos = [];
    const d = M1.m - M2.m;
    let k, err, h, gl = null, crit = 't', s1 = null, s2 = null, sp = null;
    if (caso === 'conocidas') { s1 = lee(sc, 'sigma1', 'σ₁', { min: 0, minEx: true }); s2 = lee(sc, 'sigma2', 'σ₂', { min: 0, minEx: true }); }
    else if (M1.sc === null || M2.sc === null) throw new Error('Faltan las desviaciones s₁ y s₂ de las muestras');
    pasos.push({ t: 'Datos', html: `Muestra 1: ${datosTxt(M1, '₁')}${s1 !== null ? `, σ₁ = ${f(s1)}` : ''}<br>Muestra 2: ${datosTxt(M2, '₂')}${s2 !== null ? `, σ₂ = ${f(s2)}` : ''}<br>x̄₁ − x̄₂ = ${f(M1.m, 6)} − ${p(M2.m)} = <b>${f(d)}</b>; ${alfaTxt(c)}` });
    if (caso === 'conocidas') {
      crit = 'z'; k = zc(al / 2); const sd = Math.sqrt(s1 ** 2 / M1.n + s2 ** 2 / M2.n); err = k * sd;
      h = `Con σ₁ y σ₂ conocidas: z<sub>α/2</sub> = <b>${f(k)}</b><br>E = z<sub>α/2</sub>·√(σ₁<sup>2</sup>/n₁ + σ₂<sup>2</sup>/n₂) = ${f(k)}·√(${f(s1)}<sup>2</sup>/${M1.n} + ${f(s2)}<sup>2</sup>/${M2.n}) = <b>${f(err)}</b>`;
    } else if (caso === 'iguales') {
      gl = M1.n + M2.n - 2; sp = Math.sqrt(((M1.n - 1) * M1.sc ** 2 + (M2.n - 1) * M2.sc ** 2) / gl); k = tc(gl, al / 2); err = k * sp * Math.sqrt(1 / M1.n + 1 / M2.n);
      h = `Varianzas desconocidas pero iguales: se juntan las dos en la cuasivarianza ponderada<br>s<sub>p</sub><sup>2</sup> = ((n₁ − 1)s₁<sup>2</sup> + (n₂ − 1)s₂<sup>2</sup>)/(n₁ + n₂ − 2) = (${M1.n - 1}·${f(M1.sc, 5)}<sup>2</sup> + ${M2.n - 1}·${f(M2.sc, 5)}<sup>2</sup>)/${gl} = ${f(sp ** 2, 5)} ⇒ s<sub>p</sub> = ${f(sp, 5)}<br>t<sub>${gl}; α/2</sub> = <b>${f(k)}</b><br>E = t·s<sub>p</sub>·√(1/n₁ + 1/n₂) = ${f(k)}·${f(sp, 5)}·√(1/${M1.n} + 1/${M2.n}) = <b>${f(err)}</b>`;
    } else {
      const v1 = M1.sc ** 2 / M1.n, v2 = M2.sc ** 2 / M2.n, nu = (v1 + v2) ** 2 / (v1 ** 2 / (M1.n - 1) + v2 ** 2 / (M2.n - 1));
      gl = Math.max(1, Math.floor(nu)); k = tc(gl, al / 2); err = k * Math.sqrt(v1 + v2);
      h = `Varianzas desconocidas y distintas (Welch): los grados de libertad salen de la fórmula de Welch-Satterthwaite<br>ν = (s₁<sup>2</sup>/n₁ + s₂<sup>2</sup>/n₂)<sup>2</sup> / [(s₁<sup>2</sup>/n₁)<sup>2</sup>/(n₁ − 1) + (s₂<sup>2</sup>/n₂)<sup>2</sup>/(n₂ − 1)] = ${f(nu)} ⇒ se redondea hacia abajo: ν = ${gl}<br>t<sub>${gl}; α/2</sub> = <b>${f(k)}</b><br>E = t·√(s₁<sup>2</sup>/n₁ + s₂<sup>2</sup>/n₂) = ${f(k)}·√(${f(v1, 5)} + ${f(v2, 5)}) = <b>${f(err)}</b>`;
    }
    pasos.push({ t: 'Valor crítico y error', html: h });
    const a = d - err, b = d + err;
    pasos.push({ t: 'Intervalo', html: `IC<sub>${f(c)}</sub>(μ₁ − μ₂) = ((x̄₁ − x̄₂) − E, (x̄₁ − x̄₂) + E) = <b>${ic(a, b)}</b>` });
    pasos.push({ t: 'Conclusión', html: conclusion(a, b, ['μ₁', 'μ₂']).replace('distintas', 'distintas las medias') });
    return { a, b, est: d, err, k, crit, gl, c, M1, M2, caso, sp, pasos, param: 'μ₁ − μ₂', dist: crit === 'z' ? { d: 'normal' } : { d: 't', nu: gl }, s1, s2 };
  }
  function difProp(sc) {
    const c = nivel(sc), al = 1 - c, P1 = exitos(sc, '1'), P2 = exitos(sc, '2'), pasos = [], d = P1.ph - P2.ph;
    pasos.push({ t: 'Datos', html: `p̂₁ = ${P1.x !== null ? `${P1.x}/${P1.n} = ` : ''}${f(P1.ph)}, &ensp; p̂₂ = ${P2.x !== null ? `${P2.x}/${P2.n} = ` : ''}${f(P2.ph)} ⇒ p̂₁ − p̂₂ = <b>${f(d)}</b><br>${alfaTxt(c)}` });
    const k = zc(al / 2), err = k * Math.sqrt((P1.ph * (1 - P1.ph)) / P1.n + (P2.ph * (1 - P2.ph)) / P2.n);
    pasos.push({ t: 'Valor crítico y error', html: `z<sub>α/2</sub> = <b>${f(k)}</b><br>E = z<sub>α/2</sub>·√(p̂₁q̂₁/n₁ + p̂₂q̂₂/n₂) = ${f(k)}·√(${f(P1.ph)}·${f(1 - P1.ph)}/${P1.n} + ${f(P2.ph)}·${f(1 - P2.ph)}/${P2.n}) = <b>${f(err)}</b>` });
    const a = d - err, b = d + err;
    pasos.push({ t: 'Intervalo', html: `IC<sub>${f(c)}</sub>(p₁ − p₂) = <b>${ic(a, b)}</b>` });
    pasos.push({ t: 'Conclusión', html: conclusion(a, b, ['p₁', 'p₂']).replace('distintas', 'distintas las proporciones') });
    return { a, b, est: d, err, k, crit: 'z', c, P1, P2, pasos, param: 'p₁ − p₂', dist: { d: 'normal' } };
  }
  function tamano(sc) {
    const c = nivel(sc), al = 1 - c, k = zc(al / 2), pasos = [], de = sc.de === 'proporcion' ? 'proporcion' : 'media';
    const Em = lee(sc, 'E', 'el error máximo E', { min: 0, minEx: true });
    pasos.push({ t: 'Datos', html: `Error máximo E = ${f(Em)}; ${alfaTxt(c)} ⇒ z<sub>α/2</sub> = <b>${f(k)}</b>` });
    let n0, sigma = null, pp = null;
    if (de === 'media') {
      sigma = lee(sc, 'sigma', 'la desviación típica σ', { min: 0, minEx: true }); n0 = ((k * sigma) / Em) ** 2;
      pasos.push({ t: 'Despejando n', html: `E = z<sub>α/2</sub>·σ/√n ⇒ n = (z<sub>α/2</sub>·σ/E)<sup>2</sup> = (${f(k)}·${f(sigma)}/${f(Em)})<sup>2</sup> = ${f(n0, 6)}` });
    } else {
      if (Em >= 1) throw new Error('En una proporción el error tiene que ser menor que 1 (por ejemplo 0,03 para un 3 %)');
      pp = lee(sc, 'p0', 'la proporción esperada p', { min: 0, max: 1, opcional: true });
      const pu = pp === null ? 0.5 : pp; n0 = (k ** 2 * pu * (1 - pu)) / Em ** 2;
      pasos.push({ t: 'Despejando n', html: `${pp === null ? 'Sin una estimación previa se toma el caso más desfavorable, p = q = 0,5 (el que da la n más grande).<br>' : ''}E = z<sub>α/2</sub>·√(pq/n) ⇒ n = z<sub>α/2</sub><sup>2</sup>·pq/E<sup>2</sup> = ${f(k)}<sup>2</sup>·${f(pu)}·${f(1 - pu)}/${f(Em)}<sup>2</sup> = ${f(n0, 6)}` });
      pp = pu;
    }
    const n = Math.ceil(n0 - 1e-9);
    pasos.push({ t: 'Redondeo', html: `n tiene que ser entero y el error no puede pasarse, así que se redondea siempre hacia arriba: <b>n = ${n}</b>` });
    return { n, n0, k, crit: 'z', c, Em, de, sigma, p0: pp, pasos, param: 'n', dist: { d: 'normal' } };
  }
  const MODOS = { media, proporcion, varianza, 'dif-medias': difMedias, 'dif-prop': difProp, tamano };
  function resolver(sc) {
    const m = MODOS[sc.modo] ? sc.modo : 'media';
    return Object.assign(MODOS[m](sc), { modo: m });
  }

  /* ---------- Simulación: muchas muestras de una población conocida ---------- */
  // Se toma como población la que dan los datos (μ = x̄, σ = s, p = p̂…), se sacan
  // muestras del mismo tamaño y se calcula el intervalo de cada una con el mismo método.
  const gauss = (r) => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  const binom = (r, n, q) => { if (n <= 200) { let k = 0; for (let i = 0; i < n; i++) if (r() < q) k++; return k; } return Math.min(n, Math.max(0, Math.round(n * q + gauss(r) * Math.sqrt(n * q * (1 - q))))); };
  function generaMuestra(r, n, mu, s) { const m = Math.min(n, 400); const xs = Array.from({ length: m }, () => mu + s * gauss(r)); return m === n ? xs : null; }
  function simula(sol, r = Math.random) {
    const base = { nivel: String(100 * sol.c) };
    const resumen = (n, mu, s) => {
      // n grande: se generan x̄ y s directamente (x̄ normal, (n − 1)s²/σ² con una χ² aproximada por la normal)
      const xs = generaMuestra(r, n, mu, s);
      if (xs) { const m = xs.reduce((a, x) => a + x, 0) / n; return { m, s: Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1)) }; }
      const nu = n - 1, ch = Math.max(1e-9, nu + Math.sqrt(2 * nu) * gauss(r));
      return { m: mu + (s / Math.sqrt(n)) * gauss(r), s: s * Math.sqrt(ch / nu) };
    };
    if (sol.modo === 'media') {
      const mu = sol.M.m, s = sol.sigma ?? sol.M.sc, n = sol.M.n;
      return { real: mu, una: () => { const q = resumen(n, mu, s); const x = media({ ...base, sigmaC: sol.sigma !== null ? 'si' : 'no', sigma: String(sol.sigma), n: String(n), xm: String(q.m), s: String(q.s) }); return [x.a, x.b, q.m]; } };
    }
    if (sol.modo === 'varianza') {
      const s = sol.M.sc, n = sol.M.n;
      return { real: s * s, una: () => { const q = resumen(n, 0, s); const x = varianza({ ...base, n: String(n), xm: '0', s: String(q.s) }); return [x.a, x.b, q.s * q.s]; } };
    }
    if (sol.modo === 'proporcion') {
      const pr = sol.P.ph, n = sol.P.n;
      return { real: pr, una: () => { const k = binom(r, n, pr); const x = proporcion({ ...base, n: String(n), x: String(k) }); return [x.a, x.b, k / n]; } };
    }
    if (sol.modo === 'dif-medias') {
      const { M1, M2 } = sol, sa = sol.s1 ?? M1.sc, sb = sol.s2 ?? M2.sc;
      return { real: M1.m - M2.m, una: () => { const q1 = resumen(M1.n, M1.m, sa), q2 = resumen(M2.n, M2.m, sb); const x = difMedias({ ...base, caso: sol.caso, n1: String(M1.n), xm1: String(q1.m), s1: String(q1.s), n2: String(M2.n), xm2: String(q2.m), s2: String(q2.s), sigma1: String(sol.s1), sigma2: String(sol.s2) }); return [x.a, x.b, q1.m - q2.m]; } };
    }
    if (sol.modo === 'dif-prop') {
      const { P1, P2 } = sol;
      return { real: P1.ph - P2.ph, una: () => { const k1 = binom(r, P1.n, P1.ph), k2 = binom(r, P2.n, P2.ph); const x = difProp({ ...base, n1: String(P1.n), x1: String(k1), n2: String(P2.n), x2: String(k2) }); return [x.a, x.b, k1 / P1.n - k2 / P2.n]; } };
    }
    return null;
  }

  /* ---------- Ejemplos ---------- */
  const ejemplos = [
    { clave: 'altura', nombre: 'Media con σ conocida (estaturas)', sc: { modo: 'media', fuente: 'resumen', sigmaC: 'si', sigma: '8', xm: '172', s: '', n: '36', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'bombillas', nombre: 'Media con σ desconocida (duración de bombillas)', sc: { modo: 'media', fuente: 'resumen', sigmaC: 'no', sigma: '', xm: '1200', s: '90', n: '16', nivel: '99', tipoS: 'cuasi' } },
    { clave: 'lista', nombre: 'Media a partir de los datos', sc: { modo: 'media', fuente: 'datos', sigmaC: 'no', datos: '9,8 10,2 10,1 9,7 10,4 9,9 10,0 10,3 9,6 10,1', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'muestral', nombre: 'Media con la desviación de la muestra (con n)', sc: { modo: 'media', fuente: 'resumen', sigmaC: 'no', sigma: '', xm: '25,4', s: '3,2', n: '12', nivel: '90', tipoS: 'muestral' } },
    { clave: 'encuesta', nombre: 'Proporción (encuesta)', sc: { modo: 'proporcion', tipoP: 'exitos', n: '500', x: '210', ph: '', nivel: '95' } },
    { clave: 'defectuosas', nombre: 'Proporción de piezas defectuosas', sc: { modo: 'proporcion', tipoP: 'proporcion', n: '400', x: '', ph: '0,06', nivel: '99' } },
    { clave: 'varianza', nombre: 'Varianza y desviación típica', sc: { modo: 'varianza', fuente: 'resumen', xm: '50', s: '2,5', n: '20', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'dif-conocidas', nombre: 'Diferencia de medias con σ conocidas', sc: { modo: 'dif-medias', caso: 'conocidas', fuente1: 'resumen', fuente2: 'resumen', xm1: '82', n1: '40', s1: '', sigma1: '6', xm2: '78', n2: '50', s2: '', sigma2: '7', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'dif-iguales', nombre: 'Diferencia de medias (varianzas iguales)', sc: { modo: 'dif-medias', caso: 'iguales', fuente1: 'resumen', fuente2: 'resumen', xm1: '15,2', n1: '10', s1: '1,8', xm2: '13,9', n2: '12', s2: '2,1', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'dif-welch', nombre: 'Diferencia de medias (Welch)', sc: { modo: 'dif-medias', caso: 'distintas', fuente1: 'resumen', fuente2: 'resumen', xm1: '68', n1: '15', s1: '4', xm2: '72', n2: '20', s2: '9', nivel: '95', tipoS: 'cuasi' } },
    { clave: 'dif-prop', nombre: 'Diferencia de proporciones', sc: { modo: 'dif-prop', tipoP: 'exitos', n1: '300', x1: '120', n2: '250', x2: '85', nivel: '95' } },
    { clave: 'n-media', nombre: 'Tamaño de muestra para una media', sc: { modo: 'tamano', de: 'media', sigma: '15', E: '3', p0: '', nivel: '95' } },
    { clave: 'n-prop', nombre: 'Tamaño de muestra para una encuesta', sc: { modo: 'tamano', de: 'proporcion', sigma: '', E: '0,03', p0: '', nivel: '95' } },
  ];
  return { resolver, simula, ejemplos, f, zc, tc, xc };
})();
if (typeof module !== 'undefined') module.exports = Intervalos;
